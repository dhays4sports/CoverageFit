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

import {reconcileDistributionContacts} from '../server/distribution-journey.mjs';
import {webEvidence} from '../assets/js/work-web-evidence.mjs';
import {professionalFacts,PROFESSIONAL_QUESTIONS} from '../server/professional-combined-journey.mjs';
import {combinedReviewExport,combinedReviewRows} from '../assets/js/combined-review-export.mjs';
import {deriveOpportunityPriority} from '../server/opportunity-priority-core.mjs';
import {handleSoloDesk} from '../server/solo-desk-api.mjs';
import {soloRepository} from '../server/solo-desk-repository.mjs';
import {producerWorkspace} from '../server/producer-workspace.mjs';
async function combined(f,entry='tech'){
 f.env={COVERAGEFIT_DB:f.db,COVERAGEFIT_SOLO_WORKSPACE_ID:'qa'};
 const handoff=entryInput(new URL('https://coveragefit.com/?entry='+entry+'&utm_source=instagram&utm_medium=paid_social&utm_campaign=combined_qa'),new Date(now));
 const initial=distributionPresentation(handoff,new Date(now));assert.equal(initial.question.options[0].code,'home_auto');
 const first=await distributionInteract(req('interact',{action:'start',handoff,questionId:initial.question.id,code:'home_auto'}),f);assert.equal(first.status,200,await first.clone().text());
 let state=await first.json();const cookie=first.headers.get('set-cookie').split(';')[0];
 const post=body=>distributionInteract(req('interact',{...body,reviewVersion:state.reviewVersion},cookie),f);
 return {handoff,cookie,post,get state(){return state},async answer(code){const r=await post({action:'answer',revision:state.revision,questionId:state.question.id,code});assert.equal(r.status,200,await r.clone().text());state=await r.json();},async back(){const r=await post({action:'back',revision:state.revision});assert.equal(r.status,200);state=await r.json();},async load(){state=await(await post({action:'load'})).json();}};
}
const contact=s=>({action:'contact',revision:s.state.revision,name:'Synthetic Combined',phone:'2025550123',mode:'call',permission:true});
const scenarios=[
 ['home urgent',['nonrenewal_notice','renewal_price','now','future','condo'],'home',6],
 ['auto urgent',['renewal_change','need_now','days_31_60','now','townhome'],'auto',6],
 ['research',['just_researching','just_comparing','unknown','unknown'],'home',5],
 ['partial',[],'home',1]
];
for(const entry of ['tech','healthcare','engineers','teachers'])for(const [name,codes,priority,count] of scenarios)test(`${entry}: ${name} preserves distinct lines through one producer receipt and export`,async()=>{
 const f=fixture();try{
 const s=await combined(f,entry);for(const code of codes)await s.answer(code);await s.load();assert.equal(s.state.combined,true);
 if(codes.length)assert.equal(s.state.question,null);
 const row=JSON.parse(f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get().data_json);
 assert.equal(row.answers.length,count);const facts=professionalFacts(row);assert.equal(facts.priorityProduct,priority);assert.deepEqual(facts.requestedProducts,['home','auto']);
 if(!codes.length){assert.deepEqual(facts.productEvidence,{home:{},auto:{}});assert.equal(facts.earliestReportedTiming,null);}
 assert.equal((await s.post({...contact(s),permission:false})).status,422);assert.equal((await s.post({...contact(s),phone:'bad'})).status,422);
 const delivered=await s.post(contact(s));assert.equal(delivered.status,200,await delivered.clone().text());assert.equal((await delivered.json()).deliveryPending,false);
 await Promise.all([s.post(contact(s)),s.post(contact(s))]);const ops=f.sql.prepare('SELECT id,products FROM cf_solo_opportunities').all();assert.equal(ops.length,1);assert.equal(ops[0].products,'Home + auto');
 const repo=soloRepository(f.db,{workspace:'qa',actor:'qa'}),detail=await producerWorkspace(repo,f.env).detail(ops[0].id);
 const summary=detail.sources.find(s=>s.kind==='lead').summary;assert.deepEqual(summary.context.distribution.professionalCombined.productEvidence,facts.productEvidence);
 assert.equal(summary.attribution.audience,entry);assert.equal(summary.attribution.utm.campaign,'combined_qa');assert.equal(summary.permission.callPermitted,true);assert.equal(summary.permission.personalTextPermitted,false);
 assert.ok(webEvidence(summary.context.distribution).some(([label,value])=>label==='Requested products'&&value==='home + auto'));
 assert.ok(combinedReviewRows(detail).some(([k,v])=>k==='Contact preference'&&v==='Personal call'));
 const exported=JSON.parse(JSON.stringify(combinedReviewExport(detail)));assert.deepEqual(exported.productEvidence,facts.productEvidence);assert.equal(exported.firstTouch.utmCampaign,'combined_qa');assert.deepEqual(exported.requestedProducts,['home','auto']);
 assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_conversations').get().n,0);
 }finally{f.sql.close()}
});
test('Back to choice removes obsolete active evidence, preserves bounded audit and accepts a single product',async()=>{
 const f=fixture();try{const s=await combined(f);for(const c of scenarios[0][1])await s.answer(c);
 for(let i=0;i<6;i++)await s.back();assert.equal(s.state.combined,false);assert.equal(s.state.question.id,'signal_product');await s.answer('auto');assert.equal(s.state.combined,false);assert.equal(s.state.question.id,'auto_trigger');
 const r=JSON.parse(f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get().data_json);assert.equal(r.signals.product,'auto');assert.equal(r.answers.length,1);assert.equal(r.professionalAnswerHistory.length,6);assert.deepEqual(professionalFacts(r).productEvidence,{});
 assert.equal((await s.post(contact(s))).status,200);const summary=JSON.parse(f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='lead'").get().summary_json);assert.equal(summary.context.distribution.professionalCombined,undefined);assert.equal(summary.context.reviewTrack,'auto');
 }finally{f.sql.close()}
});
test('legacy saved reviews retain original four choices and do not acquire combined flow on load',async()=>{
 const f=fixture();try{const s=await combined(f);const row=f.sql.prepare("SELECT record_key,data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get();const r=JSON.parse(row.data_json);delete r.professionalFlowVersion;r.answers=[];r.signals={product:'unknown'};await f.store.setJSON(row.record_key,r);await s.load();assert.equal(s.state.question.options.length,4);assert.equal(s.state.combined,undefined);assert.equal((await s.post({action:'answer',revision:s.state.revision,questionId:'signal_product',code:'home_auto'})).status,422);
 assert.equal(f.sql.prepare('SELECT data_json FROM pvx_records WHERE record_key=?').get(row.record_key).data_json,JSON.stringify(r));
 }finally{f.sql.close()}
});
test('stale and invalid answers reject; failed projection stays pending and recovery remains duplicate safe',async()=>{
 const f=fixture();try{const s=await combined(f);assert.equal((await s.post({action:'answer',revision:0,questionId:s.state.question.id,code:'coverage_review'})).status,409);
 assert.equal((await s.post({action:'answer',revision:s.state.revision,questionId:s.state.question.id,code:'injected'})).status,422);
 f.project=async()=>({ok:false});const pending=await s.post(contact(s));assert.equal(pending.status,503);assert.equal((await pending.json()).deliveryPending,true);
 assert.equal((await s.post({action:'new_review',handoff:s.handoff})).status,409);delete f.project;
 assert.equal((await reconcileDistributionContacts(f)).recovered,1);assert.equal((await reconcileDistributionContacts(f)).recovered,0);
 await Promise.all([s.post({action:'retry_delivery'}),s.post({action:'retry_delivery'})]);assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,1);
 await s.load();const next=await s.post({action:'new_review',handoff:s.handoff});assert.equal(next.status,200);const state=await next.json();assert.equal(state.combined,false);assert.equal(state.question.options[0].code,'home_auto');
 }finally{f.sql.close()}
});
test('combined count adds no priority points; only the earliest line supplies timing and need evidence',async()=>{
 const combined={version:1,priorityProduct:'auto',requestedProducts:['home','auto'],productEvidence:{home:{reviewReason:'nonrenewal_notice',decisionTiming:'future'},auto:{autoNeed:'just_comparing',decisionTiming:'now'}}};
 const opportunity={id:'qa',status:'open',created_at:now,products:'Home + auto',reason:'Home nonrenewal, Auto comparison'};
 const lead=context=>({kind:'lead',source_id:'synthetic',updated_at:now,summary:{context,attribution:{},consent:{}}});
 const result=deriveOpportunityPriority({opportunity,sources:[lead({distribution:{professionalCombined:combined}})]},new Date(now));
 const direct=deriveOpportunityPriority({opportunity:{...opportunity,products:'auto',reason:'just_comparing',deadline:''},sources:[lead({reviewTrack:'auto',autoNeed:'just_comparing',decisionTiming:'now'})]},new Date(now));
 assert.deepEqual(result.dimensions,direct.dimensions);assert.equal(result.scoreMin,direct.scoreMin);assert.equal(result.track,'auto');assert.ok(!result.dimensions.intent.reasons.some(r=>r.code==='stated_active_intent'));
});
test('export requires existing producer authorization and does not export unrelated records',async()=>{
 const response=await handleSoloDesk({request:new Request('https://coveragefit.com/api/solo-desk/review-export?id=unknown'),env:{}});assert.notEqual(response.status,200);assert.equal(combinedReviewExport({sources:[]}),null);
});
test('authenticated review export preserves structure and enforces workspace scope',async()=>{
 const f=fixture();try{const s=await combined(f);await s.answer('coverage_review');assert.equal((await s.post(contact(s))).status,200);const id=f.sql.prepare('SELECT id FROM cf_solo_opportunities').get().id;
 const token='synthetic-export-test-only-value';f.env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN=token;
 const request=()=>new Request('https://coveragefit.com/api/solo-desk/review-export?id='+id,{headers:{Authorization:'Bearer '+token}});
 const response=await handleSoloDesk({request:request(),env:f.env});assert.equal(response.status,200,await response.clone().text());const out=await response.json();assert.deepEqual(out.review.requestedProducts,['home','auto']);assert.deepEqual(out.review.productEvidence.auto,{});assert.equal(out.review.productEvidence.home.reviewReason,'coverage_review');
 assert.equal((await handleSoloDesk({request:request(),env:{...f.env,COVERAGEFIT_SOLO_WORKSPACE_ID:'other'}})).status,404);
 assert.equal((await handleSoloDesk({request:new Request(request().url),env:f.env})).status,401);
 }finally{f.sql.close()}
});
test('combined option is restricted to the four versioned professional entries',()=>{
 for(const entry of ['home','buyer','condo','auto-bundle']){const handoff=entryInput(new URL('https://coveragefit.com/?entry='+entry),new Date(now));const state=distributionPresentation(handoff,new Date(now));assert.ok(!state.question?.options.some(o=>o.code==='home_auto'));}
 assert.equal(PROFESSIONAL_QUESTIONS.signal_product.options.length,5);
});
test('a restarted review can select combined and return to all five choices',async()=>{
 const f=fixture();try{const s=await combined(f);await s.post(contact(s));await s.load();const restart=await s.post({action:'new_review',handoff:s.handoff});let state=await restart.json();const cookie=restart.headers.get('set-cookie').split(';')[0];
 const post=body=>distributionInteract(req('interact',{...body,reviewVersion:state.reviewVersion},cookie),f);
 state=await(await post({action:'answer',revision:state.revision,questionId:state.question.id,code:'home_auto'})).json();assert.equal(state.combined,true);
 state=await(await post({action:'back',revision:state.revision})).json();assert.equal(state.question.id,'signal_product');assert.equal(state.combined,false);assert.equal(state.question.options.length,5);
 }finally{f.sql.close()}
});
test('withdraw new combined enrollment without reinterpreting saved combined sessions',async()=>{
 const f=fixture();try{const s=await combined(f);await s.answer('coverage_review');f.env.PROFESSIONAL_COMBINED_NEW_REVIEWS='0';
 const fresh=distributionPresentation(s.handoff,new Date(now),f);assert.equal(fresh.question.options.length,4);await s.load();assert.equal(s.state.combined,true);assert.equal(s.state.question.id,'combined_auto_reason');await s.answer('new_vehicle');assert.equal(s.state.question.id,'combined_home_timing');assert.equal((await s.post(contact(s))).status,200);
 }finally{f.sql.close()}
});
