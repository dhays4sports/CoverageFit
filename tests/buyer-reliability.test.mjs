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

import {reconcileDistributionContacts} from '../server/distribution-journey.mjs';
import {sourceSync} from '../server/solo-desk-sync.mjs';
import {soloRepository,identity} from '../server/solo-desk-repository.mjs';
const count=f=>f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n;
const saved=f=>JSON.parse(f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get().data_json);
function failLead(f){const original=f.store;f.store={...original,setJSON:async(k,...args)=>{if(k.startsWith('lead-ops/lead/'))throw Error('synthetic');return original.setJSON(k,...args);}};return ()=>{f.store=original;};}
async function pending(f){const s=await buyer(f);await s.answer('within_7');await s.answer('zip','95128');await s.answer('single_family');const restore=failLead(f);assert.equal((await s.post(contact(s))).status,503);restore();assert.equal(count(f),0);return s;}
test('producer lead Refresh recovers consent saved before failed lead write, without visitor return',async()=>{
 const f=fixture();try{await pending(f);const repo=soloRepository(f.db,identity(f.env));const result=await sourceSync(repo,f.env).sync('leads');assert.equal(result.recovery.recovered,1);assert.equal(result.recovery.pending,0);assert.equal(count(f),1);assert.equal(saved(f).contact.delivered,true);
 const source=JSON.parse(f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='lead'").get().summary_json);assert.equal(source.context.buyerUrgency,'urgent');assert.equal(source.attribution.utm.source,'instagram');assert.equal(source.permission.callPermitted,true);assert.equal(source.permission.personalTextPermitted,false);
 assert.equal((await sourceSync(repo,f.env).sync('leads')).recovery.attempted,0);assert.equal(count(f),1);
 }finally{f.sql.close();}
});
test('pending request survives browser expiry, while expired browser cannot access it',async()=>{
 const f=fixture();try{const s=await pending(f);f.now='2026-10-20T00:00:00Z';assert.equal((await s.post({action:'load'})).status,404);assert.equal((await reconcileDistributionContacts(f)).recovered,1);assert.equal(count(f),1);assert.equal(saved(f).expiresAt,'2026-10-03T16:00:00.000Z');}finally{f.sql.close();}
});
test('persistent failure remains visible and repeated reconciliation recovers exactly once',async()=>{
 const f=fixture();try{await pending(f);const restore=failLead(f);const first=await reconcileDistributionContacts(f);assert.deepEqual(first,{attempted:1,recovered:0,failed:1,pending:1});assert.equal(saved(f).contact.delivered,false);assert.equal(saved(f).contact.recoveryState,'pending');restore();assert.equal((await reconcileDistributionContacts(f)).recovered,1);assert.equal((await reconcileDistributionContacts(f)).attempted,0);assert.equal(count(f),1);}finally{f.sql.close();}
});
test('projection failure retains lead and pending state until reconciliation succeeds',async()=>{
 const f=fixture();try{await pending(f);f.project=async()=>({ok:false});assert.equal((await reconcileDistributionContacts(f)).pending,1);assert.equal(count(f),0);assert.equal(saved(f).contact.delivered,false);delete f.project;assert.equal((await reconcileDistributionContacts(f)).recovered,1);assert.equal(count(f),1);}finally{f.sql.close();}
});
test('concurrent visitor retries and operator reconciliation deduplicate producer opportunities',async()=>{
 const f=fixture();try{const s=await pending(f);
 // D1 serializes atomic batches; reproduce that property in the SQLite adapter.
 const batch=f.db.batch;let tail=Promise.resolve();f.db.batch=stmts=>{const next=tail.then(()=>batch(stmts));tail=next.catch(()=>{});return next;};
 const results=await Promise.all([s.post({action:'retry_delivery'}),s.post({action:'retry_delivery'}),reconcileDistributionContacts(f)]);
 assert.equal(count(f),1);assert.equal(saved(f).contact.delivered,true);assert.ok(results.slice(0,2).every(r=>r.status===200));assert.equal((await reconcileDistributionContacts(f)).pending,0);
 assert.equal(f.sql.prepare("SELECT count(*) n FROM pvx_records WHERE record_key LIKE 'lead-ops/lead/%'").get().n,1);
 }finally{f.sql.close();}
});
test('anonymous and unconsented answers never become producer requests during reconciliation',async()=>{
 const f=fixture();try{const s=await buyer(f);assert.equal((await s.post({...contact(s),permission:false})).status,422);assert.deepEqual(await reconcileDistributionContacts(f),{attempted:0,recovered:0,failed:0,pending:0});assert.equal(count(f),0);}finally{f.sql.close();}
});
import {withDistributionIsolation,contextualAssetOrigin} from '../server/distribution-preview.mjs';
test('preview isolation guard runs before storage/rate-limit callbacks; trusted origin only',async()=>{
 let calls=0;const request=new Request('https://1234abcd.coveragefit.pages.dev/api/distribution/interact');
 assert.equal((await withDistributionIsolation({request,env:{}},()=>{calls++;})).status,503);assert.equal(calls,0);
 assert.equal(contextualAssetOrigin(request,{BUYER_STAGING_ISOLATED:'1'}),'https://1234abcd.coveragefit.pages.dev');
 assert.throws(()=>contextualAssetOrigin(new Request('https://evil.pages.dev/'),{BUYER_STAGING_ISOLATED:'1'}));
});
test('paired preview uses its own assets and accepts own Origin only when isolated',async()=>{
 const f=fixture();try{
 const origin='https://1234abcd.coveragefit.pages.dev',handoff={...input(),evidence:{},knownContext:{}},state=distributionPresentation(handoff,new Date(now));
 const request=()=>new Request(origin+'/api/distribution/interact',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'start',handoff,questionId:state.question.id,code:'planning'})});
 assert.equal((await distributionInteract(request(),f)).status,503);assert.equal(f.sql.prepare('SELECT count(*) n FROM pvx_records').get().n,0);
 f.env={BUYER_STAGING_ISOLATED:'1'};assert.equal((await distributionEntry(new Request(origin+'/api/distribution/entry',{method:'POST',headers:{Origin:'https://coveragefit.com','Content-Type':'application/json'},body:JSON.stringify(handoff)}),f)).status,403);assert.equal((await distributionInteract(request(),f)).status,200);
 const html=renderEntry({...handoff,presentation:'408_contextual'},state,contextualAssetOrigin(request(),f.env));assert.ok(html.includes(origin+'/assets/js/entry-client.js?v=BUYER-1.0'));assert.doesNotMatch(html,/https:\/\/coveragefit.com\/assets/);
 }finally{f.sql.close();}
});
test('producer projection succeeding before final journey save remains idempotently recoverable',async()=>{
 const f=fixture();try{await pending(f);const prepare=f.db.prepare;let failed=false;
 f.db.prepare=q=>{const statement=prepare(q);if(q.startsWith('UPDATE pvx_records SET data_json=')){const bind=statement.bind;statement.bind=(...a)=>{bind(...a);if(JSON.parse(a[0]).contact?.delivered&&!failed){failed=true;statement.run=async()=>{throw Error('synthetic final save');};}return statement;};}return statement;};
 assert.equal((await reconcileDistributionContacts(f)).pending,1);assert.equal(count(f),1);assert.equal(saved(f).contact.delivered,false);f.db.prepare=prepare;
 assert.equal((await reconcileDistributionContacts(f)).recovered,1);assert.equal(count(f),1);assert.equal(saved(f).contact.delivered,true);
 }finally{f.sql.close();}
});
import {handleSoloDesk} from '../server/solo-desk-api.mjs';
test('authorized producer API recovers WEB / DIRECT request; unauthenticated sync cannot',async()=>{
 const f=fixture();try{await pending(f);const env={...f.env,COVERAGEFIT_DB:f.db,COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'synthetic-only-producer-test-token'};
 const request=authorized=>new Request('https://coveragefit.com/api/solo-desk/sync',{method:'POST',headers:{Origin:'https://coveragefit.com','Content-Type':'application/json',...(authorized?{Authorization:'Bearer '+env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}:{})},body:'{"stream":"leads"}'});
 assert.equal((await handleSoloDesk({request:request(false),env})).status,401);assert.equal(count(f),0);
 const response=await handleSoloDesk({request:request(true),env});assert.equal(response.status,200);assert.equal((await response.json()).recovery.recovered,1);
 const work=await handleSoloDesk({request:new Request('https://coveragefit.com/api/solo-desk/producer-work?population=WEB_DIRECT',{headers:{Authorization:'Bearer '+env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}}),env});assert.equal(work.status,200);assert.equal((await work.json()).total,1);
 }finally{f.sql.close();}
});
test('bounded reconciliation rotates failed rows so later requests are not starved',async()=>{
 const f=fixture();try{await pending(f);const template=saved(f);
 for(let i=0;i<11;i++){const record={...template,journeyId:'pvxj_synthetic_'+i,updatedAt:now};await f.store.setJSON('pvx/web-journey/synthetic-'+i,record,{metadata:{updatedAt:now,expiresAt:template.contact.retainedUntil}});}
 const restore=failLead(f);const first=await reconcileDistributionContacts({...f,now:'2026-10-01T00:00:00Z'});assert.equal(first.attempted,10);assert.equal(first.pending,12);restore();
 const second=await reconcileDistributionContacts({...f,now:'2026-10-01T00:01:00Z'});assert.equal(second.attempted,10);assert.equal(second.pending,2);
 assert.equal((await reconcileDistributionContacts({...f,now:'2026-10-01T00:02:00Z'})).pending,0);assert.equal(count(f),12);
 }finally{f.sql.close();}
});
