import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {deriveSignalDecision} from '../server/signal-decision-core.mjs';
import {entryInput,renderEntry} from '../server/entry-presentation.mjs';
import {normalizeDistribution} from '../server/distribution-contract.mjs';
import {distributionEntry,distributionJourney,distributionInteract,distributionEvent,distributionPresentation} from '../server/distribution-journey.mjs';
import {createPVXRecordStore} from '../server/d1-json-store.mjs';
const now='2026-09-26T16:00:00.000Z';
const input=()=>({version:'coveragefit-distribution-v1',entry:'buyer',bootstrapId:'pvxb_abcdefghijklmnopqrstuvwx',occurredAt:now,attribution:{campaignId:'buyer_fall',campaignVariant:'a',partnerId:'partner_alpha'},evidence:{product:'home',reviewReason:'buying_home'},knownContext:{housing:'buyer',bundleInterest:'yes'},contactChoice:'text'});
function fixture(){
  const sql=new DatabaseSync(':memory:');
  for(const f of readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
  const db={prepare(q){let args=[];const s={bind(...v){args=v;return s},async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}},async run(){return {meta:sql.prepare(q).run(...args)}}};return s},async batch(stmts){sql.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e}}};
  return {sql,db,store:createPVXRecordStore(db),env:{},now};
}
const req=(path,body,cookie='',origin='https://coveragefit.com')=>new Request('https://coveragefit.com/api/distribution/'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
async function start(f,payload=input()){
  const response=await distributionEntry(req('entry',payload,'','https://408farmers.com'),f);assert.equal(response.status,303,await response.clone().text());
  const cookie=response.headers.get('set-cookie').split(';')[0];
  const post=body=>distributionJourney(req('journey',body,cookie),f);
  return {cookie,post,state:await (await post({action:'load'})).json(),response};
}
test('contract keeps campaign audience separate from evidence and rejects PII/authority injection',()=>{
  const n=normalizeDistribution({...input(),entry:'tech',evidence:{}},new Date(now));
  assert.equal(n.audience,'tech');assert.deepEqual(n.evidence,{product:'unknown'});assert.equal(n.attribution.sourceFamily,'organic_web');
  for(const extra of [{name:'Someone'},{cohort:'SIGNAL'},{permission:true}])assert.throws(()=>normalizeDistribution({...input(),...extra},new Date(now)));
  assert.throws(()=>normalizeDistribution({...input(),evidence:{professionalProgram:'tech'}},new Date(now)));
  assert.throws(()=>normalizeDistribution({...input(),attribution:{campaignId:'person@example.com'}},new Date(now)));
  assert.throws(()=>normalizeDistribution({...input(),occurredAt:'2020-01-01'},new Date(now)));
});
test('buyer POST uses a private cookie; known evidence is not asked again; no opportunity before permission',async()=>{
  const f=fixture();try{const s=await start(f);assert.equal(s.response.headers.get('location'),'/check-in/');assert.match(s.response.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);
    assert.equal(s.state.question.id,'home_shopping_intent');assert.equal(s.state.contactChoice,'text');
    assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,0);
    assert.doesNotMatch(JSON.stringify(s.state),/pvxj_|buyer_fall|partner_alpha|priority|cohort|score/);
  }finally{f.sql.close();}
});
test('answers persist, resume does not restart, Back retains imported facts, revisions reject stale changes',async()=>{
  const f=fixture();try{const s=await start(f);let r=await s.post({action:'answer',revision:0,questionId:s.state.question.id,code:'ready_now'});assert.equal(r.status,200);let state=await r.json();assert.equal(state.question.id,'home_decision_timing');
    assert.equal((await s.post({action:'answer',revision:0,questionId:s.state.question.id,code:'ready_now'})).status,409);
    assert.equal((await (await s.post({action:'load'})).json()).question.id,'home_decision_timing');
    state=await (await s.post({action:'back',revision:1})).json();assert.equal(state.question.id,'home_shopping_intent');
    assert.equal((await s.post({action:'answer',revision:2,questionId:'signal_product',code:'auto'})).status,422);
  }finally{f.sql.close();}
});
test('sufficient evidence ends questions and explicit contact reaches one producer opportunity with attribution',async()=>{
  const f=fixture();try{const s=await start(f,{...input(),evidence:{product:'home',reviewReason:'buying_home',shoppingIntent:'ready_now',decisionTiming:'within_14'}});
    assert.equal(s.state.question,null);assert.equal(s.state.complete,true);
    const body={action:'contact',revision:0,name:'Synthetic Buyer',phone:'2025550123',mode:'text',permission:true};
    assert.equal((await s.post({...body,permission:false})).status,422);
    const response=await s.post(body);assert.equal(response.status,200,await response.clone().text());assert.equal((await response.json()).contactSubmitted,true);
    assert.equal((await s.post(body)).status,200);assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,1);
    const source=JSON.parse(f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='lead'").get().summary_json);
    assert.equal(source.attribution.sourceKey,'web_408_buyer');assert.equal(source.attribution.campaignId,'buyer_fall');assert.equal(source.attribution.partnerId,'partner_alpha');assert.equal(source.attribution.audience,'homebuyer');
    assert.equal(source.context.distribution.knownContext.bundleInterest,'yes');assert.equal(source.context.shoppingIntent,'ready_now');
    assert.equal(source.permission.callPermitted,false);assert.equal(source.permission.personalTextPermitted,true);
    assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_conversations').get().n,0);
  }finally{f.sql.close();}
});
test('failed producer delivery stays pending and retry recovers without duplicate lead',async()=>{
  const f=fixture();try{f.project=async()=>({ok:false});const s=await start(f);const response=await s.post({action:'contact',revision:0,name:'Synthetic Buyer',phone:'2025550123',mode:'call',permission:true});assert.equal(response.status,503);assert.equal((await response.json()).deliveryPending,true);delete f.project;
    const retry=await s.post({action:'retry_delivery'});assert.equal(retry.status,200);assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,1);
  }finally{f.sql.close();}
});
test('cross-origin, expired capability, unsupported routes and malformed inputs fail closed',async()=>{
  const f=fixture();try{const s=await start(f);
    assert.equal((await distributionJourney(req('journey',{action:'load'},s.cookie,'https://408farmers.com'),f)).status,403);
    assert.equal((await distributionJourney(req('journey',{action:'load'},s.cookie),{...f,now:'2026-10-05T00:00:00Z'})).status,404);
    assert.equal((await distributionEntry(req('entry',{...input(),entry:'tech'},'','https://408farmers.com'),f)).status,422);
    assert.equal((await distributionEntry(req('entry',input(),'','https://evil.example'),f)).status,403);
    assert.equal((await s.post({action:'load',opportunityId:'other'})).status,422);
  }finally{f.sql.close();}
});
test('cross-domain retry with same bootstrap identity reuses same journey capability',async()=>{
  const f=fixture();try{const [a,b]=await Promise.all([start(f),start(f)]);assert.equal(a.cookie,b.cookie);assert.equal(f.sql.prepare("SELECT count(*) n FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get().n,1);
  }finally{f.sql.close();}
});
test('a changed handoff under the same key cannot silently overwrite attribution',async()=>{
  const f=fixture();try{await start(f);const response=await distributionEntry(req('entry',{...input(),attribution:{campaignId:'different_campaign'}},'','https://408farmers.com'),f);assert.equal(response.status,409);}finally{f.sql.close();}
});
test('research answers exit without implying buying intent; route audience does not change the decision',async()=>{
  const f=fixture();try{const s=await start(f,{...input(),evidence:{product:'home',statedTrigger:'just_researching',shoppingIntent:'researching'}});assert.equal(s.state.question,null);assert.match(s.state.message,/learn first/);assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,0);}finally{f.sql.close();}
});
test('Home shows a canonical question before a session; first answer is the session boundary',async()=>{
  const f=fixture();try{
    const handoff={...input(),entry:'home',evidence:{},knownContext:{},presentation:'408_contextual'};
    const first=distributionPresentation(handoff,new Date(now));assert.equal(first.question.id,'home_trigger');
    assert.equal(f.sql.prepare('SELECT count(*) n FROM pvx_records').get().n,0);
    const response=await distributionInteract(req('interact',{action:'start',handoff,questionId:first.question.id,code:'renewal_change'}),f);
    assert.equal(response.status,200,await response.clone().text());const value=await response.json();assert.equal(value.question.id,'home_shopping_intent');
    assert.match(response.headers.get('set-cookie'),/HttpOnly/);
    assert.equal(f.sql.prepare("SELECT count(*) n FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get().n,1);
    assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,0);
    const retry=await distributionInteract(req('interact',{action:'start',handoff,questionId:first.question.id,code:'renewal_change'}),f);assert.equal((await retry.json()).question.id,'home_shopping_intent');
  }finally{f.sql.close();}
});
test('buyer presentation asks the next useful purchase question without granting intent or priority',()=>{
  const handoff={...input(),evidence:{},knownContext:{}};const state=distributionPresentation(handoff,new Date(now));assert.equal(state.question.id,'buyer_need');assert.doesNotMatch(state.question.prompt,/Are you buying/);
  const common={signalSessionId:'synthetic_context_123',canonicalSignals:{product:'home'}};
  const generic=deriveSignalDecision(common,new Date(now));const buyer=deriveSignalDecision({...common,presentationContext:'homebuyer'},new Date(now));
  assert.deepEqual(generic.internal.priority,buyer.internal.priority);assert.equal(buyer.public.nextQuestionId,'buyer_need');assert.equal(buyer.internal.input.canonicalSignals.shoppingIntent,undefined);
});
test('QR market and affinity audience are attribution, never quality evidence',()=>{
  const qr=normalizeDistribution({...input(),entry:'home',evidence:{},qr:{market:'95118',campaign:'rate'}},new Date(now));
  assert.equal(qr.attribution.sourceFamily,'qr');assert.equal(qr.route,'/home/qr/95118/rate');assert.equal(qr.marketContext,'95118');assert.deepEqual(qr.evidence,{product:'home'});
  for(const entry of ['tech','teachers','healthcare','engineers']){const value=normalizeDistribution({...input(),entry,evidence:{}},new Date(now));assert.deepEqual(value.evidence,{product:'unknown'});assert.equal(value.audience,entry);}
  assert.throws(()=>normalizeDistribution({...input(),entry:'home',qr:{market:'person@example.com',campaign:'rate'}},new Date(now)));
});
test('Meta has a direct agency-contextualized presentation and preserved paid source',()=>{
  const handoff=entryInput(new URL('https://coveragefit.com/begin/?entry=home&presentation=paid_agency&utm_source=meta&utm_medium=paid_social&campaign_id=home_review_a'),new Date(now));
  const n=normalizeDistribution(handoff,new Date(now));assert.equal(n.attribution.sourceKey,'meta');assert.equal(n.attribution.sourceFamily,'paid_social');assert.equal(n.route,'/begin/');
  const html=renderEntry(handoff,distributionPresentation(handoff,new Date(now)));assert.match(html,/<fieldset><legend/);assert.match(html,/Insurance Producer/);assert.doesNotMatch(html,/Start your|Get Started|Find a time|408farmers.com/);
});
test('presentation contains immediate semantic options and no transition-only gate',()=>{
  const handoff={...input(),entry:'home',evidence:{},presentation:'408_contextual'};const html=renderEntry(handoff,distributionPresentation(handoff,new Date(now)));
  assert.match(html,/408FARMERS/);assert.match(html,/<fieldset><legend/);assert.match(html,/data-answer="renewal_change"/);assert.doesNotMatch(html,/Start your homebuyer review|Continue in CoverageFit/);assert.match(html,/entry-status" role="status"/);
});
test('observed view events are idempotent and do not establish buying intent or a session',async()=>{
  const f=fixture();try{
    for(let i=0;i<2;i++)assert.equal((await distributionEvent(req('events',{type:'landing_view',handoff:input()}),f)).status,200);
    assert.equal(f.sql.prepare("SELECT count(*) n FROM pvx_records WHERE record_key LIKE 'pvx/acquisition-event/%'").get().n,1);
    assert.equal(f.sql.prepare("SELECT count(*) n FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get().n,0);
    assert.equal((await distributionEvent(req('events',{type:'producer_handoff',handoff:input()}),f)).status,422);
  }finally{f.sql.close();}
});
test('resumed measurement retains original acquisition instead of a new landing campaign',async()=>{
  const f=fixture();try{const s=await start(f);await s.post({action:'answer',revision:0,questionId:s.state.question.id,code:'ready_now'});
    const response=await distributionEvent(req('events',{type:'landing_view',handoff:{...input(),bootstrapId:'pvxb_differentlandingabcdefghijkl',attribution:{campaignId:'later_campaign'}}},s.cookie),f);
    assert.equal(response.status,200);
    const events=f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/acquisition-event/%'").all().map(r=>JSON.parse(r.data_json));
    assert.equal(events.find(e=>e.type==='landing_view').firstTouch.campaignId,'buyer_fall');
    assert.equal((await distributionEvent(req('events',{type:'abandon',handoff:input()}),f)).status,422);
  }finally{f.sql.close();}
});

test('direct entry is included in Pages function routing',()=>{const routes=JSON.parse(readFileSync(new URL('../_routes.json',import.meta.url),'utf8'));for(const path of ['/begin','/begin/'])assert.ok(routes.include.includes(path));assert.ok(routes.include.includes('/api/*'));});

test('real canonical buyer handoff continues on the same opportunity with original source and no repeated first answer',async()=>{
  const f=fixture();try{
    f.env={COVERAGEFIT_DB:f.db,COVERAGEFIT_SOLO_WORKSPACE_ID:'qa',RINGCENTRAL_FROM_NUMBER:'+12025550198',RINGCENTRAL_CONVERSATION_HASH_SECRET:'synthetic-cross-channel-key-123456'};
    const handoff={...input(),evidence:{},knownContext:{housing:'buyer'}};
    const first=distributionPresentation(handoff,new Date(now));assert.equal(first.question.id,'buyer_need');
    const response=await distributionInteract(req('interact',{action:'start',handoff,questionId:first.question.id,code:'closing_coverage'}),f);
    assert.equal(response.status,200);const state=await response.json(),cookie=response.headers.get('set-cookie').split(';')[0];
    assert.equal(state.question.id,'home_shopping_intent');
    const contact=await distributionJourney(req('journey',{action:'contact',revision:state.revision,name:'Synthetic Entry Canary',phone:'2025550199',mode:'call',permission:true},cookie),f);assert.equal(contact.status,200,await contact.clone().text());
    const opportunity=f.sql.prepare('SELECT id FROM cf_solo_opportunities').get().id;
    const original=JSON.parse(f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='lead'").get().summary_json);assert.ok(original.context.distribution.conversation_id);assert.equal(original.context.distribution.phase,'producer_handoff');
    const {soloRepository}=await import('../server/solo-desk-repository.mjs'),{signalContinue}=await import('../server/signal-continue-service.mjs');
    const repo=soloRepository(f.db,{workspace:'qa',actor:'qa'});let sent=0;const service=signalContinue(repo,f.env,{now,send:async()=>{sent++;return {providerMessageId:'fake-provider'};}});
    const draft=await service.create({id:opportunity,trigger:'busy',interestConfirmed:true,producerChosen:true});assert.equal(sent,0);
    assert.equal((await service.preview(opportunity)).step.question.id,'home_shopping_intent');
    await service.producer({id:opportunity,revision:draft.revision,action:'approve_send'});assert.equal(sent,1);
    const token=draft.draft.match(/\/s\/([A-Za-z0-9_-]+)/)[1],resumed=await service.resume(token);assert.equal(resumed.question.id,'home_shopping_intent');
    const done=await service.answer(token,{revision:resumed.revision,action:'later',future_date:'2027-02-01'});assert.equal(done.done,true);assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,1);
    const preserved=JSON.parse(f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE source_id NOT LIKE 'signal_continue_v1:%' AND kind='lead'").get().summary_json);assert.deepEqual(preserved,original);
    const summary=JSON.parse(f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='signal_continue_v1'").get().summary_json);assert.equal(summary.first_touch.landingPage,'/buyer/');assert.equal(summary.first_touch.campaignId,'buyer_fall');assert.equal(summary.current_channel,'signal_continue');assert.equal(summary.decision_2,'LATER');assert.equal(summary.future_date,'2027-02-01');assert.equal(sent,1);
    const {producerWorkspace}=await import('../server/producer-workspace.mjs');const detail=await producerWorkspace(repo,f.env).detail(opportunity);assert.equal(detail.continuation.decision_2,'LATER');assert.equal(detail.continuation.future_date,'2027-02-01');assert.equal(detail.sms,null);
    const {continueAnalytics}=await import('../server/signal-continue-analytics.mjs');assert.equal((await continueAnalytics(repo,f.env,new Date(now))).links_offered,0,'web continuation cannot contaminate district SIGNAL analytics');
  }finally{f.sql.close();}
});

test('Buyer entry keeps the preserved appointment destination separate from canonical intake',()=>{
 const handoff={...input(),entry:'buyer',evidence:{},presentation:'408_contextual'};
 const html=renderEntry(handoff,distributionPresentation(handoff,new Date(now)));
 assert.match(html,/href="\/buyer\/legacy.html">Existing review or appointment/);
 assert.match(html,/What would be most useful for your home purchase/);
});

test('Condo context survives entry without asking property type or adding intent',()=>{
 const handoff={...input(),entry:'condo',evidence:{},presentation:'408_contextual'};
 const normalized=normalizeDistribution(handoff,new Date(now));
 assert.equal(normalized.audience,'condo');assert.equal(normalized.route,'/condo/');
 assert.deepEqual(normalized.evidence,{product:'home'});
 const state=distributionPresentation(handoff,new Date(now));assert.equal(state.question.id,'home_trigger');
 assert.doesNotMatch(state.question.prompt,/property type|own or rent/i);
 const html=renderEntry(handoff,state);assert.match(html,/Condo insurance review with Dylan/);
 assert.match(html,/href="\/condo\/legacy.html">Existing review or appointment/);
});

test('Tech presentation starts with insurance evidence, not a profession gate',()=>{
 const handoff={...input(),entry:'tech',evidence:{},presentation:'408_contextual'};
 const normalized=normalizeDistribution(handoff,new Date(now));assert.equal(normalized.audience,'tech');
 assert.deepEqual(normalized.evidence,{product:'unknown'});
 const state=distributionPresentation(handoff,new Date(now));assert.equal(state.question.id,'signal_product');
 const html=renderEntry(handoff,state);assert.match(html,/href="\/tech\/legacy.html">Existing review or appointment/);
 assert.doesNotMatch(html,/What kind of work|professional_role|income|salary/i);
 assert.throws(()=>normalizeDistribution({...handoff,evidence:{professionalProgram:'tech'}},new Date(now)));
});
