import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {createPVXRecordStore} from '../server/d1-json-store.mjs';
import {entryInput} from '../server/entry-presentation.mjs';
import {distributionInteract,distributionPresentation} from '../server/distribution-journey.mjs';
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
for(const [a,b] of [['condo','engineers'],['condo','buyer'],['engineers','healthcare'],['tech','teachers'],['buyer','condo']])test(a+' → '+b+' → '+a+' preserves identity, answers and first touch',async()=>{
 const f=fixture();try{
  const one=await start(f,a),before=await page(f,a,one.cookie);assert.equal(before.state.resumed,true);
  const landing=await page(f,b,one.cookie);assert.equal(landing.state.resumed,undefined);assert.deepEqual(landing.state.otherReviews,[a]);assert.equal(landing.state.question.id,distributionPresentation(handoff(b),new Date(now)).question.id);
  const two=await start(f,b,one.cookie,'qa_partner_b'),cookies=one.cookie+'; '+two.cookie;assert.notEqual(one.state.reviewVersion,two.state.reviewVersion);
  const back=await page(f,a,cookies);assert.equal(back.state.reviewVersion,one.state.reviewVersion);assert.deepEqual(back.state.question,before.state.question);
  assert.equal((await page(f,b,cookies)).state.reviewVersion,two.state.reviewVersion);
  const rows=f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").all().map(r=>JSON.parse(r.data_json));assert.equal(rows.length,2);assert.equal(rows.find(r=>r.distribution.entry===a).firstTouch.partnerId,'qa_partner_a');assert.equal(rows.find(r=>r.distribution.entry===b).firstTouch.partnerId,'qa_partner_b');assert.ok(rows.every(r=>!r.contact&&r.answers.length===1));
  const stale=await distributionInteract(request({action:'back',entry:b,revision:two.state.revision,reviewVersion:one.state.reviewVersion},cookies),f);assert.equal(stale.status,409);
 }finally{f.sql.close();}
});
test('legacy global cookie remains recoverable and does not contaminate a new audience',async()=>{const f=fixture();try{const one=await start(f,'condo'),legacy=one.cookie.replace('_condo=','=');assert.equal((await page(f,'engineers',legacy)).state.resumed,undefined);const two=await start(f,'engineers',legacy);assert.equal((await page(f,'condo',legacy+'; '+two.cookie)).state.reviewVersion,one.state.reviewVersion);}finally{f.sql.close();}});
test('business accepted request has durable ID, producer API receipt, source and exact channel consent; retries deduplicate',async()=>{const f=fixture();try{
 const one=await start(f,'business');const body={entry:'business',action:'contact',revision:one.state.revision,reviewVersion:one.state.reviewVersion,name:'Synthetic Distribution QA',phone:'2025550123',permission:true,mode:'call'};
 assert.equal((await distributionInteract(request({...body,permission:false},one.cookie),f)).status,422);
 const response=await distributionInteract(request(body,one.cookie),f);assert.equal(response.status,200);const accepted=await response.json();assert.match(accepted.requestId,/^408d_pvxj_/);assert.equal(accepted.deliveryPending,false);
 assert.equal((await distributionInteract(request(body,one.cookie),f)).status,200);
 const rows=f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='lead'").all().map(r=>JSON.parse(r.summary_json));assert.equal(rows.length,1);const receipt=rows[0];assert.equal(receipt.attribution.placementId,'qa_placement_001');assert.equal(receipt.attribution.partnerId,'qa_partner_a');assert.equal(receipt.attribution.utm.campaign,'distribution_engine_1_2');assert.equal(receipt.permission.callPermitted,true);assert.equal(receipt.permission.personalTextPermitted,false);assert.equal(receipt.context.reviewTrack,'business');
 const env={COVERAGEFIT_DB:f.db,COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'synthetic-distribution-test-only'};
 const api=await handleSoloDesk({request:new Request('https://coveragefit.com/api/solo-desk/producer-work?population=WEB_DIRECT',{headers:{Authorization:'Bearer '+env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}}),env});assert.equal(api.status,200);assert.equal((await api.json()).total,1);
 const records=f.sql.prepare("SELECT data_json FROM pvx_records WHERE record_key LIKE 'lead-ops/lead/%'").all();assert.equal(records.length,1);assert.ok(JSON.stringify(records).includes(accepted.requestId));
 }finally{f.sql.close();}});

test('accepted request and authenticated producer receipt survive closing and reopening durable storage',async()=>{
 const dir=mkdtempSync('/tmp/distribution-12-'),path=dir+'/test.sqlite';let f=fixture(path);let cookie,requestId;
 try{const one=await start(f,'business');cookie=one.cookie;const response=await distributionInteract(request({entry:'business',action:'contact',revision:one.state.revision,reviewVersion:one.state.reviewVersion,name:'Synthetic Persistent QA',phone:'2025550124',permission:true,mode:'call'},cookie),f);assert.equal(response.status,200);requestId=(await response.json()).requestId;f.sql.close();f=fixture(path,false);
 const load=await distributionInteract(request({entry:'business',action:'load'},cookie),f);assert.equal((await load.json()).requestId,requestId);
 const env={COVERAGEFIT_DB:f.db,COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'synthetic-distribution-test-only'};const response2=await handleSoloDesk({request:new Request('https://coveragefit.com/api/solo-desk/producer-work?population=WEB_DIRECT',{headers:{Authorization:'Bearer '+env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}}),env});assert.equal(response2.status,200);assert.equal((await response2.json()).total,1);
 }finally{f.sql.close();rmSync(dir,{recursive:true});}
});
