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
const routes=['tech','healthcare','engineers','teachers','home','buyer','condo','home_qr','condo_qr'];
function handoffFor(route){return entryInput(new URL('https://coveragefit.com/?entry='+route.replace('_qr','')+'&utm_source=instagram&utm_medium=paid_social&utm_campaign=direct_qa'+(route.endsWith('_qr')?'&market=95128&qr_campaign=review':'')),new Date(now));}
async function open(f,route='tech'){
 f.env={COVERAGEFIT_DB:f.db,COVERAGEFIT_SOLO_WORKSPACE_ID:'qa'};const handoff=handoffFor(route);
 const r=await distributionInteract(req('interact',{action:'open_contact',handoff}),f);assert.equal(r.status,200,await r.clone().text());let state=await r.json();const cookie=r.headers.get('set-cookie').split(';')[0];
 const post=body=>distributionInteract(req('interact',{...body,reviewVersion:state.reviewVersion},cookie),f);
 return {handoff,cookie,post,get state(){return state},async answer(code,value){const r=await post({action:'answer',revision:state.revision,questionId:state.question.id,code,value});assert.equal(r.status,200,await r.clone().text());state=await r.json();},async load(){state=await(await post({action:'load'})).json();}};
}
const contactPayload=s=>({action:'contact',revision:s.state.revision,name:'Synthetic Direct Contact',phone:'2025550123',mode:'call',permission:true});
for(const route of routes)for(const stage of ['opening','during_questionnaire','after_questionnaire'])test(`${route}: ${stage} preserves one canonical review and one accepted producer request`,async()=>{
 const f=fixture();try{const s=await open(f,route);assert.equal(s.state.showContact,true);assert.equal(s.state.directContact,true);assert.ok(s.state.question);assert.equal(s.state.canBack,false);
 const record=JSON.parse(f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get().data_json);assert.equal(record.answers.length,0);assert.equal(record.contact,undefined);assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,0);
 if(stage!=='opening')await s.answer(s.state.question.options[0].code);
 if(stage==='after_questionnaire'){let count=1;while(s.state.question&&count++<8)await s.answer(s.state.question.options[0].code);assert.equal(s.state.question,null);assert.equal(s.state.complete,true);}
 const metric=await distributionEvent(req('events',{type:'contact_form_opened',revision:s.state.revision,handoff:s.handoff},s.cookie),f);assert.equal(metric.status,200);
 assert.equal((await s.post({...contactPayload(s),permission:false})).status,422);assert.equal((await s.post({...contactPayload(s),phone:'bad'})).status,422);
 const result=await s.post(contactPayload(s));assert.equal(result.status,200,await result.clone().text());assert.equal((await result.json()).contactSubmitted,true);
 await Promise.all([s.post(contactPayload(s)),s.post(contactPayload(s))]);assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,1);
 const row=JSON.parse(f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='lead'").get().summary_json),d=row.context.distribution;
 assert.equal(d.contactEntry.stage,stage);assert.equal(d.contactEntry.questionnaireComplete,stage==='after_questionnaire');assert.equal(d.contactEntry.answeredCount,stage==='opening'?0:stage==='during_questionnaire'?1:record.answers.length+d.answers.length);
 assert.equal(row.permission.callPermitted,true);assert.equal(row.permission.personalTextPermitted,false);assert.equal(row.attribution.utm.campaign,'direct_qa');assert.equal(row.attribution.audience,route==='buyer'?'homebuyer':route.replace('_qr',''));
 if(route.endsWith('_qr')){assert.equal(row.attribution.marketContext,'95128');assert.match(row.attribution.landingPage,/\/qr\/95128\/review/);}
 if(stage==='opening'&&['tech','healthcare','engineers','teachers'].includes(route)){assert.equal(row.context.reviewTrack,'unknown');assert.equal(d.professionalCombined,undefined);assert.ok(!row.context.professionalProgram);}
 if(d.professionalCombined){const detail={opportunity:{id:'synthetic',contact:{}},sources:[{kind:'lead',source_id:'synthetic',summary:row}]};const exported=combinedReviewExport(detail);assert.deepEqual(exported.contactEntry,d.contactEntry);assert.deepEqual(exported.requestedProducts,['home','auto']);assert.deepEqual(exported.productEvidence,d.professionalCombined.productEvidence);}
 assert.ok(webEvidence(d).some(([k,v])=>k==='Questionnaire at contact request'&&v===(stage==='after_questionnaire'?'Completed':'Contact requested before questionnaire completion')));
 const events=f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/acquisition-event/%'").all().map(r=>JSON.parse(r.data_json));
 for(const e of events)assert.doesNotMatch(JSON.stringify(e),/Synthetic Direct|2025550123|first_name|permission|productEvidence/);
 assert.equal(events.filter(e=>e.type==='contact_form_opened_'+stage).length,1);assert.equal(events.filter(e=>e.type==='contact_requested_'+stage).length,1);assert.equal(events.filter(e=>e.type==='producer_handoff_'+stage).length,1);
 assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_conversations').get().n,0);
 }finally{f.sql.close()}
});
test('opening repeatedly and concurrently reuses the bootstrap without invented answers or permission',async()=>{
 const f=fixture();try{f.env={};const h=handoffFor('tech'),request=()=>req('interact',{action:'open_contact',handoff:h});const results=await Promise.all([distributionInteract(request(),f),distributionInteract(request(),f)]);for(const r of results)assert.equal(r.status,200,await r.clone().text());assert.equal(results[0].headers.get('set-cookie').split(';')[0],results[1].headers.get('set-cookie').split(';')[0]);
 assert.equal(f.sql.prepare("SELECT count(*) n FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get().n,1);
 const s=await open(f);for(let i=0;i<3;i++)assert.equal((await s.post({action:'open_contact',revision:s.state.revision})).status,200);assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,0);
 }finally{f.sql.close()}
});
test('opening and contact-first start preserve stale-tab fences and bounded request validation',async()=>{
 const f=fixture();try{const s=await open(f);await s.answer('auto');assert.equal((await s.post({action:'open_contact',revision:0})).status,409);
 const before=f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get().data_json;
 assert.equal((await distributionInteract(req('interact',{action:'open_contact',handoff:s.handoff,permission:true}),f)).status,422);
 assert.equal(f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get().data_json,before);
 assert.equal((await distributionEvent(req('events',{type:'contact_form_opened',revision:0,handoff:s.handoff},s.cookie),f)).status,422);
 const bad={...handoffFor('tech'),name:'forbidden'};assert.equal((await distributionInteract(req('interact',{action:'open_contact',handoff:bad}),f)).status,422);
 }finally{f.sql.close()}
});
test('pending early delivery remains pending, recovers once and does not expose a blank form',async()=>{
 const f=fixture();try{const s=await open(f);f.project=async()=>({ok:false});const r=await s.post(contactPayload(s));assert.equal(r.status,503);const state=await r.json();assert.equal(state.contactSubmitted,true);assert.equal(state.deliveryPending,true);delete f.project;assert.equal((await reconcileDistributionContacts(f)).recovered,1);await s.load();assert.equal(s.state.contactSubmitted,true);assert.equal(s.state.deliveryPending,false);assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,1);
 }finally{f.sql.close()}
});
