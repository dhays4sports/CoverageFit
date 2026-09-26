import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {normalizeDistribution} from '../server/distribution-contract.mjs';
import {distributionEntry,distributionJourney} from '../server/distribution-journey.mjs';
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
