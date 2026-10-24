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
const rows=f=>f.sql.prepare("SELECT record_key,data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%' ORDER BY record_key").all();
const opportunities=f=>f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n;
async function completed(f){const s=await start(f);assert.equal((await s.post({action:'contact',revision:0,name:'Synthetic New Review QA',phone:'2025550123',mode:'call',permission:true})).status,200);return {...s,state:await(await s.post({action:'load'})).json()};}
function handoff(entry='buyer',campaign='new_campaign'){return entryInput(new URL('https://coveragefit.com/api/distribution/presentation?entry='+entry+'&utm_campaign='+campaign),new Date(now));}
const restart=(f,s,h=handoff())=>distributionInteract(req('interact',{action:'new_review',reviewVersion:s.state.reviewVersion,handoff:h},s.cookie),f);
const withCookie=response=>response.headers.get('set-cookie').split(';')[0];
const post=(f,cookie,body)=>distributionInteract(req('interact',body,cookie),f);
for(const entry of ['buyer','tech','healthcare','engineers','teachers','home','condo'])test('completed review starts current audience independently: '+entry,async()=>{
 const f=fixture();try{const old=await completed(f),before=rows(f)[0],count=opportunities(f);const leads=f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'lead-ops/lead/%'").all();
 const r=await restart(f,old,handoff(entry));assert.equal(r.status,200,await r.clone().text());const state=await r.json(),cookie=withCookie(r);assert.notEqual(cookie,old.cookie);assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax; Max-Age=604800/);
 assert.equal(state.question.id,entry==='buyer'?'buyer_need':entry==='condo'?'condo_need':entry==='home'?'home_trigger':'signal_product');assert.notEqual(state.reviewVersion,old.state.reviewVersion);assert.equal(rows(f).length,2);assert.equal(opportunities(f),count);
 assert.equal(f.sql.prepare('SELECT data_json FROM pvx_records WHERE record_key=?').get(before.record_key).data_json,before.data_json);assert.deepEqual(f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'lead-ops/lead/%'").all(),leads);
 const current=rows(f).map(r=>JSON.parse(r.data_json)).find(r=>r.journeyId!==JSON.parse(before.data_json).journeyId);assert.equal(current.distribution.entry,entry);assert.equal(current.firstTouch.utmCampaign,'new_campaign');assert.equal(current.firstTouch.campaignId,undefined);assert.equal(current.contact,undefined);assert.deepEqual(current.answers,[]);
 assert.equal((await(await post(f,cookie,{action:'load'})).json()).reviewVersion,state.reviewVersion);
 }finally{f.sql.close();}
});
test('new buyer answers and reload resume independently, and stale tab cannot mutate matching revision',async()=>{
 const f=fixture();try{const old=await completed(f),r=await restart(f,old),cookie=withCookie(r);let state=await r.json();
 for(const code of ['closing_coverage','within_7']){const answer=await post(f,cookie,{action:'answer',revision:state.revision,reviewVersion:state.reviewVersion,questionId:state.question.id,code});assert.equal(answer.status,200);state=await answer.json();}
 assert.equal((await(await post(f,cookie,{action:'load'})).json()).question.id,'buyer_location');
 for(const version of [old.state.reviewVersion,undefined]){const stale=await post(f,cookie,{action:'contact',revision:state.revision,reviewVersion:version,name:'Synthetic Stale',phone:'2025550123',mode:'call',permission:true});assert.equal(stale.status,409);assert.equal((await stale.json()).reviewChanged,true);}
 assert.equal(opportunities(f),1);assert.equal(rows(f).length,2);
 const oldStart=await post(f,cookie,{action:'start',handoff:handoff(),questionId:'buyer_intent',code:'planning'});assert.equal(oldStart.status,409);
 }finally{f.sql.close();}
});
test('concurrent completed tabs and repeated network retries rotate once without orphan records',async()=>{
 const f=fixture();try{const old=await completed(f);const batch=f.db.batch;let tail=Promise.resolve();f.db.batch=statements=>{const next=tail.then(()=>batch(statements));tail=next.catch(()=>{});return next;};
 const [a,b]=await Promise.all([restart(f,old),restart(f,old)]);assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(withCookie(a),withCookie(b));assert.equal(rows(f).length,2);
 assert.equal(withCookie(await restart(f,old)),withCookie(a));
 const stale=await restart(f,{...old,cookie:withCookie(a)});assert.equal(stale.status,409);assert.equal((await stale.json()).reviewChanged,true);assert.equal(rows(f).length,2);assert.equal(opportunities(f),1);
 const different=await restart(f,old,handoff('teachers'));assert.equal(different.status,409);assert.equal(different.headers.get('set-cookie'),null);assert.equal(rows(f).length,2);
 }finally{f.sql.close();}
});
test('pending delivery blocks rotation, keeps retry/reconciliation and original request',async()=>{
 const f=fixture();try{f.project=async()=>({ok:false});const s=await start(f);assert.equal((await s.post({action:'contact',revision:0,name:'Synthetic Pending',phone:'2025550123',mode:'call',permission:true})).status,503);s.state=await(await s.post({action:'load'})).json();const before=rows(f)[0].data_json;
 const blocked=await restart(f,s);assert.equal(blocked.status,409);assert.equal((await blocked.json()).deliveryPending,true);assert.equal(blocked.headers.get('set-cookie'),null);assert.equal(rows(f).length,1);assert.equal(rows(f)[0].data_json,before);
 delete f.project;assert.equal((await reconcileDistributionContacts(f)).recovered,1);s.state=await(await s.post({action:'load'})).json();assert.equal(s.state.deliveryPending,false);assert.equal((await restart(f,s)).status,200);assert.equal(opportunities(f),1);
 }finally{f.sql.close();}
});
test('expired, cross-origin, missing-session and uncompleted requests cannot rotate',async()=>{
 const f=fixture();try{const old=await completed(f);const body={action:'new_review',handoff:handoff(),reviewVersion:old.state.reviewVersion};assert.equal((await distributionInteract(req('interact',body,old.cookie,'https://evil.example'),f)).status,403);assert.equal((await post(f,'',body)).status,404);
 assert.equal((await restart({...f,now:'2026-10-05T00:00:00Z'},old)).status,404);assert.equal(rows(f).length,1);
 const r=await restart(f,old),state=await r.json();assert.equal((await restart(f,{cookie:withCookie(r),state})).status,409);assert.equal(rows(f).length,2);
 }finally{f.sql.close();}
});
test('atomic storage failure preserves active old capability and retry creates only one new journey',async()=>{
 const f=fixture();try{const old=await completed(f),before=rows(f)[0].data_json;const batch=f.db.batch;f.db.batch=async statements=>{f.sql.exec('BEGIN');try{await statements[0].run();throw Error('synthetic second statement failure');}finally{f.sql.exec('ROLLBACK');}};
 const failed=await restart(f,old);assert.equal(failed.status,503);assert.equal(failed.headers.get('set-cookie'),null);assert.equal(rows(f).length,1);assert.equal(rows(f)[0].data_json,before);f.db.batch=batch;assert.equal((await restart(f,old)).status,200);assert.equal(rows(f).length,2);assert.equal(opportunities(f),1);
 }finally{f.sql.close();}
});
test('a later consented request is independent, and another explicit restart is possible',async()=>{
 const f=fixture();try{const old=await completed(f),before=rows(f)[0],r=await restart(f,old),cookie=withCookie(r),state=await r.json();
 const payload={action:'contact',revision:state.revision,reviewVersion:state.reviewVersion,name:'Synthetic New Review QA',phone:'2025550123',mode:'text',permission:true};
 assert.equal((await post(f,cookie,{...payload,permission:false})).status,422);assert.equal(opportunities(f),1);
 const accepted=await post(f,cookie,payload);assert.equal(accepted.status,200);assert.equal(opportunities(f),2);assert.equal((await post(f,cookie,payload)).status,200);assert.equal(opportunities(f),2);
 const next=await restart(f,{cookie,state:await accepted.json()},handoff('teachers','later_context'));assert.equal(next.status,200);assert.equal((await next.json()).question.id,'signal_product');assert.equal(rows(f).length,3);assert.equal(opportunities(f),2);
 assert.equal(f.sql.prepare('SELECT data_json FROM pvx_records WHERE record_key=?').get(before.record_key).data_json,before.data_json);
 }finally{f.sql.close();}
});
