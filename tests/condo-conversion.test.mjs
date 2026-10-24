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
import {condoFacts,condoQualified} from '../server/condo-journey.mjs';
import {soloRepository} from '../server/solo-desk-repository.mjs';
import {producerWorkspace} from '../server/producer-workspace.mjs';
async function condo(f,reason='renewal',evidence={}){
 const handoff=entryInput(new URL('https://coveragefit.com/?entry=condo&utm_source=instagram&utm_medium=paid_social&utm_campaign=condo_qa&utm_content=creative_a'),new Date(now));handoff.evidence=evidence;
 const r=await distributionInteract(req('interact',{action:'start',handoff,questionId:'condo_need',code:reason}),f);assert.equal(r.status,200,await r.clone().text());
 const cookie=r.headers.get('set-cookie').split(';')[0];let state=await r.json();
 const post=body=>distributionInteract(req('interact',{...body,reviewVersion:state.reviewVersion},cookie),f);
 return {cookie,handoff,post,get state(){return state},async answer(code,value){const r=await post({action:'answer',revision:state.revision,questionId:state.question.id,code,value});assert.equal(r.status,200,await r.clone().text());state=await r.json();},async back(){const r=await post({action:'back',revision:state.revision});assert.equal(r.status,200);state=await r.json();}};
}
const payload=s=>({action:'contact',revision:s.state.revision,name:'Synthetic Condo Acceptance',phone:'2025550123',mode:'call',contactTime:'afternoon',permission:true});
const scenarios=[
 ['renewal owner','renewal',[['days_15_30'],['zip','95128'],['primary'],['both']],'near_term','primary',true],
 ['urgent buyer','purchase',[['within_7'],['zip','94086'],['primary']],'urgent','primary',true],
 ['non-renewal','notice',[['nonrenewal'],['within_7'],['zip','95128'],['primary']],'urgent','primary',true],
 ['cancellation rental','notice',[['cancellation'],['days_8_30'],['zip','95128'],['rental']],'near_term','rental',true],
 ['rental coverage review','coverage',[['general'],['zip','95128'],['rental']],'exploratory','rental',true],
 ['HOA concern','coverage',[['hoa'],['zip','95128'],['primary']],'exploratory','primary',true],
 ['early research','exploring',[['undecided']],'exploratory','undecided',false],
 ['purchase no property','purchase',[['unknown'],['unknown'],['undecided']],'exploratory','undecided',false],
 ['second home purchase','purchase',[['days_31_60'],['zip','95128'],['second_home'],['yes']],'upcoming','second_home',true]
];
for(const [name,reason,answers,urgency,use,qualified]of scenarios)test('condo '+name+' persists and projects one consented opportunity',async()=>{
 const f=fixture();f.env={COVERAGEFIT_DB:f.db,COVERAGEFIT_SOLO_WORKSPACE_ID:'qa'};
 try{const s=await condo(f,reason);for(const a of answers)await s.answer(...a);assert.equal(s.state.question,null);assert.equal(s.state.urgent,urgency==='urgent');
 assert.equal((await s.post({...payload(s),permission:false})).status,422);
 const r=await s.post(payload(s));assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).deliveryPending,false);assert.equal((await s.post(payload(s))).status,200);
 const op=f.sql.prepare('SELECT id FROM cf_solo_opportunities').all();assert.equal(op.length,1);
 const detail=await producerWorkspace(soloRepository(f.db,{workspace:'qa',actor:'qa'}),f.env).detail(op[0].id);assert.equal(detail.population.population,'WEB_DIRECT');assert.equal(detail.sms,null);
 const summary=detail.sources.find(s=>s.kind==='lead').summary,c=summary.context.distribution.condo;
 assert.equal(c.reason,reason);assert.equal(c.urgency,urgency);assert.equal(c.propertyUse,use);assert.match(summary.context.condoSummary,/afternoon/);assert.equal(summary.permission.callPermitted,true);assert.equal(summary.permission.personalTextPermitted,false);
 assert.equal(summary.attribution.utm.campaign,'condo_qa');assert.equal(summary.attribution.utm.content,'creative_a');assert.equal(summary.attribution.sourceKey,'web_408_condo');assert.match(c.nextAction,/review|Review|Clarify/);assert.ok(f.sql.prepare('SELECT title FROM cf_solo_tasks').all().some(t=>t.title===c.nextAction));
 assert.ok(webEvidence(summary.context.distribution).some(([k,v])=>k==='propertyUse'&&v===use.replaceAll('_',' ')));
 const events=f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/acquisition-event/%'").all().map(r=>JSON.parse(r.data_json));assert.equal(events.filter(e=>e.type==='condo_qualified_request_accepted').length,qualified?1:0);assert.equal(events.filter(e=>e.type==='producer_handoff').length,1);
 for(const e of events)assert.doesNotMatch(JSON.stringify(e),/2025550123|Synthetic Condo|95128|94086/);
 assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_conversations').get().n,0);
 }finally{f.sql.close();}
});
test('condo Back, saved ZIP, reload, exact closing date and no-session protections',async()=>{
 const f=fixture();try{const s=await condo(f,'purchase',{closingDate:'2026-10-01'});assert.equal(s.state.question.id,'condo_location');assert.equal(s.state.urgent,true);
 assert.equal((await s.post({action:'answer',revision:s.state.revision,questionId:'condo_location',code:'zip',value:'10001'})).status,422);
 await s.answer('zip','95128');assert.equal(s.state.question.id,'condo_use');await s.back();assert.equal(s.state.question.id,'condo_location');
 const loaded=await(await s.post({action:'load'})).json();assert.equal(loaded.question.id,'condo_location');assert.equal(loaded.urgent,true);
 assert.equal((await distributionJourney(req('journey',{action:'load'}),f)).status,404);
 }finally{f.sql.close();}
});
test('condo projection failure remains pending, blocks restart, reconciliation deduplicates',async()=>{
 const f=fixture();try{const s=await condo(f);await s.answer('within_14');await s.answer('zip','95128');await s.answer('primary');await s.answer('both');f.project=async()=>({ok:false});
 const failed=await s.post(payload(s));assert.equal(failed.status,503);assert.equal((await failed.json()).deliveryPending,true);
 assert.equal((await s.post({action:'new_review',handoff:s.handoff})).status,409);delete f.project;
 const out=await reconcileDistributionContacts(f);assert.equal(out.recovered,1);assert.equal((await reconcileDistributionContacts(f)).recovered,0);
 await Promise.all([s.post({action:'retry_delivery'}),s.post({action:'retry_delivery'})]);assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,1);
 assert.equal((await(await s.post({action:'load'})).json()).deliveryPending,false);
 }finally{f.sql.close();}
});
test('transient lead write failure is recovered without visitor return',async()=>{
 const f=fixture();try{const s=await condo(f,'notice');await s.answer('nonrenewal');await s.answer('within_7');const original=f.store;f.store={...original,setJSON:async(key,...args)=>{if(key.startsWith('lead-ops/'))throw Error('synthetic unavailable');return original.setJSON(key,...args)}};
 assert.equal((await s.post(payload(s))).status,503);assert.equal((await(await s.post({action:'load'})).json()).deliveryPending,true);f.store=original;
 assert.equal((await reconcileDistributionContacts(f)).recovered,1);assert.equal((await reconcileDistributionContacts(f)).pending,0);assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,1);
 }finally{f.sql.close();}
});
test('legacy condo resumes unchanged; completed buyer restarts as versioned condo with independent attribution',async()=>{
 const f=fixture();try{
 const b=await start(f);const row=f.sql.prepare("SELECT record_key,data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get();const legacy=JSON.parse(row.data_json);legacy.distribution.entry='condo';legacy.distribution.audience='condo';legacy.signals={product:'home'};legacy.distribution.evidence={product:'home'};await f.store.setJSON(row.record_key,legacy);
 assert.equal((await(await b.post({action:'load'})).json()).question.id,'home_trigger');assert.equal(f.sql.prepare('SELECT data_json FROM pvx_records WHERE record_key=?').get(row.record_key).data_json,JSON.stringify(legacy));
 // Restore original buyer fixture, complete it, then explicitly rotate on condo.
 await f.store.setJSON(row.record_key,JSON.parse(row.data_json));assert.equal((await b.post({action:'contact',revision:0,name:'Synthetic prior buyer',phone:'2025550123',mode:'call',permission:true})).status,200);
 const old=await(await b.post({action:'load'})).json(),before=f.sql.prepare('SELECT data_json FROM pvx_records WHERE record_key=?').get(row.record_key).data_json;
 const h=entryInput(new URL('https://coveragefit.com/?entry=condo&utm_campaign=new_condo'),new Date(now));const r=await distributionInteract(req('interact',{action:'new_review',handoff:h,reviewVersion:old.reviewVersion},b.cookie),f);assert.equal(r.status,200);const fresh=await r.json();assert.equal(fresh.question.id,'condo_need');assert.equal(fresh.reviewAudience,'condo');assert.notEqual(fresh.reviewVersion,old.reviewVersion);
 assert.equal(f.sql.prepare('SELECT data_json FROM pvx_records WHERE record_key=?').get(row.record_key).data_json,before);
 const cookie=r.headers.get('set-cookie').split(';')[0];assert.equal((await distributionInteract(req('interact',{action:'answer',revision:0,questionId:'condo_need',code:'purchase',reviewVersion:old.reviewVersion},cookie),f)).status,409);
 const records=f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").all().map(r=>JSON.parse(r.data_json));assert.equal(records.find(r=>r.condoFlowVersion===1).firstTouch.utmCampaign,'new_condo');
 }finally{f.sql.close();}
});
test('unknown termination date requires confirmation, not an exploratory assumption',()=>{
 assert.equal(condoFacts({condo:{reason:'notice',timingWindow:'unknown'},signals:{}}).urgency,'needs_confirmation');
 assert.equal(condoFacts({condo:{reason:'renewal',timingWindow:'unknown'},signals:{}}).urgency,'unknown');
 assert.equal(condoFacts({condo:{reason:'purchase'},signals:{closingDate:'2026-09-01'}},new Date(now)).urgency,'needs_confirmation');
 assert.equal(condoQualified({condo:{reason:'exploring',propertyZip:'95128',propertyUse:'primary'},contact:{delivered:true},signals:{}}),false);
});
