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
import {buyerFacts} from '../server/buyer-journey.mjs';
import {webEvidence} from '../assets/js/work-web-evidence.mjs';
import {projectAgencyZoomLead} from '../server/lead-operations-core.mjs';
async function buyer(f,code='closing_coverage',evidence={}){
 const handoff={...input(),evidence,knownContext:{},attribution:{utmSource:'instagram',utmMedium:'paid_social',utmCampaign:'buyer_qa',creative:'buying_home'}};
 const first=distributionPresentation(handoff,new Date(now));
 const response=await distributionInteract(req('interact',{action:'start',handoff,questionId:first.question.id,code}),f);
 assert.equal(response.status,200,await response.clone().text());
 const cookie=response.headers.get('set-cookie').split(';')[0],post=body=>distributionJourney(req('journey',body,cookie),f);
 let state=await response.json();
 return {post,cookie,get state(){return state},async answer(code,value){const r=await post({action:'answer',revision:state.revision,questionId:state.question.id,code,...(value?{value}:{})});assert.equal(r.status,200,await r.clone().text());state=await r.json();return state;}};
}
const contact=s=>({action:'contact',revision:s.state.revision,name:'Synthetic Buyer',phone:'2025550123',mode:'call',permission:true,contactTime:'afternoon'});
for(const scenario of [
 {name:'urgent house',intent:'closing_coverage',timing:'within_7',zip:'95128',type:'single_family',urgency:'urgent'},
 {name:'near-term condo',intent:'compare_purchase',timing:'days_8_30',zip:'95128',type:'condo',identified:'yes',urgency:'near_term'},
 {name:'early planning without address',intent:'planning',timing:'searching',urgency:'exploratory'},
 {name:'coverage review townhome',intent:'understand_coverage',timing:'days_31_60',zip:'95128',type:'townhome',identified:'not_yet',urgency:'upcoming'},
 {name:'longer-term buyer',intent:'planning',timing:'over_60',type:'unsure',identified:'not_yet',urgency:'longer_term'}
])test(`buyer: ${scenario.name} reaches one durable producer request`,async()=>{
 const f=fixture();try{
  const s=await buyer(f,scenario.intent);assert.equal(s.state.question.id,'buyer_timing');
  await s.answer(scenario.timing);assert.equal(s.state.urgent,scenario.urgency==='urgent');
  assert.equal(s.state.question.id,'buyer_location');
  if(scenario.zip){assert.equal((await s.post({action:'answer',revision:s.state.revision,questionId:'buyer_location',code:'zip',value:'10001'})).status,422);await s.answer('zip',scenario.zip);}else await s.answer('unknown');
  if(scenario.type)await s.answer(scenario.type);
  if(scenario.identified)await s.answer(scenario.identified);
  assert.equal(s.state.question,null);
  const payload=contact(s);assert.equal((await s.post({...payload,permission:false})).status,422);
  assert.equal((await s.post(payload)).status,200);assert.equal((await s.post(payload)).status,200);
  const summary=JSON.parse(f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='lead'").get().summary_json);
  assert.equal(summary.context.distribution.buyer.urgency,scenario.urgency);
  assert.equal(summary.context.propertyType||'',scenario.type||'');
  assert.equal(summary.attribution.utm.campaign,'buyer_qa');assert.equal(summary.attribution.sourceFamily,'paid_social');
  assert.match(summary.context.buyerSummary,/afternoon/);assert.equal(summary.permission.callPermitted,true);assert.equal(summary.permission.personalTextPermitted,false);
  assert.ok(webEvidence(summary.context.distribution).some(([k,v])=>k==='urgency'&&v===scenario.urgency.replaceAll('_',' ')));
  assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,1);
  assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_conversations').get().n,0);
  const events=f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/acquisition-event/%'").all().map(r=>JSON.parse(r.data_json));assert.equal(events.filter(e=>e.type==='producer_handoff').length,1);assert.equal(events.filter(e=>e.type==='buyer_qualified_request_accepted').length,scenario.zip&&scenario.type!=='unsure'?1:0);
  const records=f.sql.prepare('SELECT data_json FROM pvx_records').all().map(r=>JSON.parse(r.data_json));const lead=records.find(r=>r.checkpointId?.startsWith('408d_'));assert.ok(lead);assert.equal(lead.crm.state,'pending');assert.equal(projectAgencyZoomLead(lead).buyer_context.urgency,scenario.urgency);
  // No scheduling is required or claimed; abandoning after acceptance loses nothing.
  assert.equal((await (await s.post({action:'load'})).json()).contactSubmitted,true);
 }finally{f.sql.close()}
});
test('buyer Back corrects context, same-browser resume retains answers; no cookie exposes no record',async()=>{
 const f=fixture();try{const s=await buyer(f);await s.answer('within_7');await s.answer('zip','95128');
  let back=await(await s.post({action:'back',revision:s.state.revision})).json();assert.equal(back.question.id,'buyer_location');
  let load=await(await s.post({action:'load'})).json();assert.equal(load.question.id,'buyer_location');assert.equal(load.urgent,true);
  assert.equal((await distributionJourney(req('journey',{action:'load'}),f)).status,404);
  assert.equal((await s.post({action:'answer',revision:s.state.revision,questionId:'buyer_location',code:'unknown'})).status,409);
 }finally{f.sql.close()}
});
test('known exact closing date and type are retained and not requested again',async()=>{
 const f=fixture();try{const s=await buyer(f,'compare_purchase',{closingDate:'2026-10-01',propertyType:'condo'});assert.equal(s.state.question.id,'buyer_location');assert.equal(s.state.urgent,true);await s.answer('unknown');assert.equal(s.state.question.id,'buyer_identified');}finally{f.sql.close()}
});
test('failed delivery is truthful, retry and concurrent contact requests create one opportunity',async()=>{
 const f=fixture();try{const s=await buyer(f);f.project=async()=>({ok:false});const payload=contact(s);const r=await s.post(payload);assert.equal(r.status,503);assert.equal((await r.json()).deliveryPending,true);delete f.project;
  const results=await Promise.all([s.post({action:'retry_delivery'}),s.post({action:'retry_delivery'})]);assert.ok(results.some(r=>r.status===200));
  assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,1);
  assert.equal((await(await s.post({action:'load'})).json()).deliveryPending,false);
 }finally{f.sql.close()}
});
test('exact past date requests confirmation; urgency is not inferred from campaign',()=>{
 assert.equal(buyerFacts({signals:{closingDate:'2026-09-01'}},new Date(now)).urgency,'needs_confirmation');
 assert.equal(buyerFacts({signals:{},distribution:{audience:'homebuyer'}}).urgency,'unknown');
});
