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

for(const alcoholShare of ['below_33','at_least_33','unknown'])test('restaurant '+alcoholShare+' durable receipt, first touch, retry and business context',async()=>{
 const dir=mkdtempSync('/tmp/restaurant-'),path=dir+'/qa.sqlite';let f=fixture(path);f.env.BUYER_STAGING_ISOLATED='1';
 try{
 const one=await start(f,'restaurant');
 const touch=handoff('restaurant','qa_partner_b');touch.attribution.placementId='qa_placement_002';
 const event=await distributionEvent(request({type:'landing_view',handoff:touch},one.cookie),f);assert.equal(event.status,200);
 const body={entry:'restaurant',action:'contact',revision:one.state.revision,reviewVersion:one.state.reviewVersion,name:'Synthetic Restaurant QA',phone:'2025550133',mode:'text',permission:true,restaurantName:'Synthetic QA Cafe',restaurantCity:'San Jose',alcoholShare};
 assert.equal((await distributionInteract(request({...body,restaurantCity:''},one.cookie),f)).status,422);
 const failed=await distributionInteract(request(body,one.cookie),{...f,project:async()=>{throw Error('injected downstream outage')}});assert.equal(failed.status,503);
 const pending=await failed.json();assert.match(pending.requestId,/^408d_/);assert.equal(pending.deliveryPending,true);
 const retry=await distributionInteract(request({entry:'restaurant',action:'retry_delivery'},one.cookie),f);assert.equal(retry.status,200);assert.equal((await retry.json()).requestId,pending.requestId);
 await distributionInteract(request(body,one.cookie),f);
 f.sql.close();f=fixture(path,false);
 const leads=f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'lead-ops/lead/%'").all().map(r=>JSON.parse(r.data_json));assert.equal(leads.length,1);
 const sources=f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='lead'").all().map(r=>JSON.parse(r.summary_json));assert.equal(sources.length,1);
 const receipt=sources[0];assert.equal(receipt.context.distribution.restaurant.name,'Synthetic QA Cafe');assert.equal(receipt.context.distribution.trafficClass,'TEST');assert.equal(receipt.context.reviewTrack,'business');assert.equal(receipt.attribution.partnerId,'qa_partner_a');assert.equal(receipt.attribution.placementId,'qa_placement_001');
 assert.ok(JSON.stringify(leads).includes('qa_placement_002'));assert.ok(JSON.stringify(leads).includes('Synthetic QA Cafe'));
 const journeys=f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").all().map(r=>JSON.parse(r.data_json));assert.equal(journeys[0].restaurant.detailedUnderwritingAllowed,alcoholShare==='below_33');assert.equal(journeys[0].firstTouch.partnerId,'qa_partner_a');
 const env={COVERAGEFIT_DB:f.db,COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'synthetic-distribution-test-only'};
 const api=await handleSoloDesk({request:new Request('https://coveragefit.com/api/solo-desk/producer-work?population=WEB_DIRECT',{headers:{Authorization:'Bearer '+env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}}),env});assert.equal(api.status,200);assert.equal((await api.json()).total,1);
 }finally{f.sql.close();rmSync(dir,{recursive:true});}
});
