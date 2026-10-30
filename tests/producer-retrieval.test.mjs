import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {createPVXRecordStore} from '../server/d1-json-store.mjs';
import {entryInput} from '../server/entry-presentation.mjs';
import {distributionInteract,distributionPresentation,distributionEvent} from '../server/distribution-journey.mjs';
import {onRequest as presentation} from '../functions/api/distribution/presentation.js';
import {handleSoloDesk} from '../server/solo-desk-api.mjs';
const now=new Date().toISOString();
function fixture(path=':memory:',migrate=true){
  const sql=new DatabaseSync(path);
  if(migrate)for(const f of readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
  const db={prepare(q){let args=[];const s={bind(...v){args=v;return s},async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}},async run(){return {meta:sql.prepare(q).run(...args)}}};return s},async batch(stmts){sql.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e}}};
  return {sql,db,store:createPVXRecordStore(db),env:{},now};
}

const request=(body,cookies='')=>new Request('https://coveragefit.com/api/distribution/interact',{method:'POST',headers:{Origin:'https://coveragefit.com','Content-Type':'application/json',Cookie:cookies},body:JSON.stringify(body)});
const handoff=(entry,source='qa_partner_a')=>entryInput(new URL('https://coveragefit.com/?entry='+entry+'&partner_id='+source+'&placement_id=qa_placement_001&utm_source='+source+'&utm_medium=newsletter&utm_campaign=distribution_engine_1_2'),new Date(now));
async function page(f,entry,cookies){const response=await presentation({request:new Request('https://coveragefit.com/api/distribution/presentation?entry='+entry,{headers:{Cookie:cookies}}),env:{COVERAGEFIT_DB:f.db}});assert.equal(response.status,200);return JSON.parse((await response.text()).match(/id="entry-data">(.*?)<\/script>/s)[1]);}
async function start(f,entry,cookies='',source){const h=handoff(entry,source),state=distributionPresentation(h,new Date(now));const response=await distributionInteract(request({action:'start',entry,handoff:h,questionId:state.question.id,code:state.question.options[0].code},cookies),f);assert.equal(response.status,200,await response.clone().text());return {cookie:response.headers.get('set-cookie').split(';')[0],state:await response.json()};}


import {previewFirewall,TEST_DATABASE_ID,TEST_WORKSPACE} from '../server/preview-firewall.mjs';
import {digest} from '../server/solo-desk-repository.mjs';
import {isSyntheticPreview,retrievalError,fullRecordAction,savedSourceEvidence} from '../assets/js/producer-retrieval.mjs';
async function linkedFixture(){
 const f=fixture();f.env={BUYER_STAGING_ISOLATED:'1',COVERAGEFIT_SOLO_WORKSPACE_ID:TEST_WORKSPACE};
 const one=await start(f,'restaurant');
 await distributionEvent(request({type:'landing_view',handoff:handoff('restaurant','qa_partner_b')},one.cookie),f);
 const response=await distributionInteract(request({entry:'restaurant',action:'contact',revision:one.state.revision,reviewVersion:one.state.reviewVersion,name:'Local regression fixture',phone:'2025550133',mode:'call',permission:true,restaurantName:'Local QA Cafe',restaurantCity:'San Jose',alcoholShare:'below_33'},one.cookie),f);
 assert.equal(response.status,200);f.requestId=(await response.json()).requestId;
 f.env={...f.env,COVERAGEFIT_DB:f.db,COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'synthetic-local-regression-only'};
 f.source=f.sql.prepare("SELECT * FROM cf_solo_sources WHERE workspace_id=? AND kind='lead' AND source_id=?").get(TEST_WORKSPACE,f.requestId);
 f.read=(id=f.source.opportunity_id,token=f.env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN,env=f.env)=>handleSoloDesk({request:new Request('https://qa.coveragefit.pages.dev/api/solo-desk/producer-detail?id='+encodeURIComponent(id),{headers:token?{Authorization:'Bearer '+token}:{}}),env});
 return f;
}
test('exact journey/checkpoint/source/opportunity chain survives repeated authenticated reads',async()=>{
 const f=await linkedFixture();try{
 const journeys=f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%' AND '408d_'||json_extract(data_json,'$.journeyId')=?").all(f.requestId);assert.equal(journeys.length,1);
 const journey=JSON.parse(journeys[0].data_json);
 const lead=JSON.parse(f.sql.prepare('SELECT data_json FROM pvx_records WHERE record_key=?').get('lead-ops/lead/'+await digest(f.requestId)).data_json);
 assert.equal(lead.checkpointId,f.requestId);assert.equal(lead.context.distribution.journeyId,journey.journeyId);
 assert.equal(f.source.opportunity_id,'opp_src_'+(await digest(TEST_WORKSPACE+'|lead|'+f.requestId)).slice(0,32));
 const sourceBefore=f.source.summary_json,journeyBefore=journeys[0].data_json;
 for(let i=0;i<3;i++){
  const response=await f.read();assert.equal(response.status,200);const d=await response.json();
  assert.equal(d.opportunity.id,f.source.opportunity_id);assert.equal(d.opportunity.status,'open');
  const source=d.sources.find(s=>s.kind==='lead');assert.equal(source.source_id,f.requestId);
  assert.deepEqual(source.summary.context.distribution,lead.context.distribution);
  assert.equal(source.summary.contactRequested,true);assert.equal(source.summary.permission.callPermitted,true);assert.equal(source.summary.permission.personalTextPermitted,false);
  assert.equal(source.summary.permission.basis,lead.consent.agencyContact.basis);
  assert.deepEqual(source.summary.context.distribution.firstTouch,journey.firstTouch);
  assert.deepEqual(source.summary.context.distribution.additionalTouches,journey.additionalTouches);
  assert.deepEqual(source.summary.context.distribution.restaurant,journey.restaurant);
  assert.ok(d.nextBestAction);assert.ok(d.tasks.length);
  const html=savedSourceEvidence(d);for(const v of [f.requestId,journey.journeyId,'qa_partner_a','qa_partner_b','Local QA Cafe','below_33'])assert.ok(html.includes(v));
 }
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM cf_solo_opportunities').get().n,1);
 assert.equal(f.sql.prepare("SELECT COUNT(*) n FROM cf_solo_sources WHERE workspace_id=? AND kind='lead' AND source_id=?").get(TEST_WORKSPACE,f.requestId).n,1);
 assert.equal(f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='lead'").get().summary_json,sourceBefore);
 assert.equal(f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get().data_json,journeyBefore);
 }finally{f.sql.close();}
});
test('producer authorization and exact workspace isolation reject other readers',async()=>{
 const f=await linkedFixture();try{
 assert.equal((await f.read(undefined,'')).status,401);assert.equal((await f.read(undefined,'incorrect')).status,401);
 assert.equal((await f.read(undefined,undefined,{...f.env,COVERAGEFIT_SOLO_WORKSPACE_ID:'other-workspace'})).status,404);
 assert.equal((await f.read('opp_src_'+'0'.repeat(32))).status,404);
 }finally{f.sql.close();}
});
test('Preview denies full record and sync before application execution; authenticated detail remains allowlisted',async()=>{
 const f=await linkedFixture();try{
 f.sql.exec('CREATE TABLE distribution_preview_identity(singleton INTEGER PRIMARY KEY,database_id TEXT,traffic_class TEXT)');
 f.sql.prepare('INSERT INTO distribution_preview_identity VALUES(1,?,?)').run(TEST_DATABASE_ID,'TEST');
 let calls=0;
 const run=(route,method='GET',token=f.env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN)=>{const context={env:f.env,request:new Request('https://qa.coveragefit.pages.dev/api/solo-desk/'+route+'?id='+f.source.opportunity_id,{method,headers:token?{Authorization:'Bearer '+token}:{}})};return previewFirewall({...context,next:()=>{calls++;return handleSoloDesk(context);}});};
 for(const [route,method] of [['record','GET'],['sync','POST']]){const r=await run(route,method);assert.equal(r.status,403);const body=await r.json();assert.equal(body.error,undefined);assert.equal(retrievalError(r.status,body).code,'preview_operation_disabled');}
 assert.equal(calls,0);assert.equal((await run('producer-detail')).status,200);assert.equal((await run('producer-detail','GET','')).status,401);
 }finally{f.sql.close();}
});
test('safe fallback is Preview-only; production full-record workflow and non-firewall errors remain distinct',()=>{
 assert.equal(isSyntheticPreview('fa3adc1d.coveragefit.pages.dev'),true);assert.equal(isSyntheticPreview('coveragefit.com'),false);assert.equal(isSyntheticPreview('coveragefit.pages.dev.evil.test'),false);
 assert.doesNotMatch(fullRecordAction('opp',true),/<a /);assert.match(fullRecordAction('opp',true),/saved source evidence/);
 assert.match(fullRecordAction('opp',false),/legacy.html\?opportunity_id=opp&quick_wrap=1/);
 assert.equal(retrievalError(503,{error:{code:'storage_unavailable',message:'Storage unavailable'}}).code,'storage_unavailable');
 assert.equal(retrievalError(401,{message:'Unauthorized'}).code,'request_failed');
 const html=savedSourceEvidence({sources:[{kind:'lead',source_id:'<script>',summary:{context:{distribution:{restaurant:{name:'<img src=x>'}}}}}]});assert.doesNotMatch(html,/<script>|<img /);
 const source=readFileSync(new URL('../assets/js/producer-workspace.mjs',import.meta.url),'utf8');
 assert.match(source,/async function syncSources\(\)\{if\(syntheticPreview\)/);assert.match(source,/fullRecordAction\(id,syntheticPreview\)/);assert.match(source,/savedSourceEvidence\(d\)/);
});
