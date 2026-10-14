// One local synthetic suite exercises Action Quality -> Today/Inbox -> Prospect360
// -> selected SMS review -> no-send shadow across the REAL in-memory SQLite API.
// It DOES NOT claim hosted/Cloudflare Preview certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {generatePreviewFixturePackage} from '../scripts/prepare-producer-action-preview-fixtures.mjs';
import {handleSoloDesk} from '../server/solo-desk-api.mjs';
import {simulateEngagement} from '../server/engagement-shadow-simulator.mjs';

const runId='qa-combined-integration-20261012';
const workspace='qa-combined';
function fixture(){
 const sql=new DatabaseSync(':memory:');
 for(const filename of readdirSync(new URL('../migrations/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort())
  sql.exec(readFileSync(new URL('../migrations/'+filename,import.meta.url),'utf8'));
 const p=generatePreviewFixturePackage({runId,workspaceId:workspace,head:'b'.repeat(40)});
 sql.exec(p.sql);
 const eventId='sms-live-'+runId;
 // Modify only synthetic *local in-memory* fixture conversation to make a
 // current draft reviewable. No provider or hosted D1 change.
 const ask=p.fixtures.ask_one_question;
 const source=sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='district_pilot_v1' AND opportunity_id=?").get(ask);
 const conversationId=JSON.parse(source.summary_json).conversation_id;
 const rec=sql.prepare('SELECT record_key,data_json FROM sms_conversations WHERE record_key=?').get('sms-live-conversations/'+conversationId);
 const body=JSON.parse(rec.data_json);
 body.signal.draft_status='pending';body.signal.revision=4;body.signal.latest_inbound='When can you quote auto?';
 sql.prepare('UPDATE sms_conversations SET data_json=? WHERE record_key=?').run(JSON.stringify(body),rec.record_key);
 // Seed two distinct renewal states in local synthetic data only.
 sql.prepare("INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?)").run(workspace,'lead','qa-raw-renewal',p.fixtures.due_callback,JSON.stringify({rawFacts:{renewal_date:'2027-01-17'}}),new Date().toISOString());
 sql.prepare("INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?)").run(workspace,'renewal_verification_v1','qa-confirmed-renewal',p.fixtures.due_appointment,JSON.stringify({renewal_exact_date:'2027-01-17',verification_status:'customer_confirmed',confirmed_at:'2026-10-11T20:00:00Z'}),new Date().toISOString());
 const db={prepare(q){let args=[];const statement={bind(...v){args=v;return statement},async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}},async run(){return {meta:sql.prepare(q).run(...args)}}};return statement},async batch(stmts){sql.exec('BEGIN');try{const output=[];for(const x of stmts)output.push(await x.run());sql.exec('COMMIT');return output}catch(e){sql.exec('ROLLBACK');throw e}}};
 const env={COVERAGEFIT_DB:db,COVERAGEFIT_SOLO_WORKSPACE_ID:workspace,COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'synthetic-test-token-not-a-real-account',CF_ATTENTION_ENABLED:'1',CF_AI_ENABLED:'0',CF_SMS_SIGNAL_ENABLED:'0',CF_COMMAND_CENTER_READONLY_ENABLED:'1',CF_PROSPECT_360_READONLY_ENABLED:'1',CF_SMS_REVIEW_READONLY_ENABLED:'1'};
 const api=async(path,withAuth=true)=>{
  const res=await handleSoloDesk({request:new Request('https://synthetic.test/api/solo-desk/'+path,{headers:withAuth?{Authorization:'Bearer '+env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}:{}}),env,now:new Date('2026-10-12T22:30:00Z')});
  return {status:res.status,data:await res.json()};
 };
 return {sql,env,api,p};
}
test('one coherent synthetic API run covers Action Quality + Today + Inbox + current SMS draft review',async()=>{
 const f=fixture();try{
  const center=await f.api('producer-command-center');
  assert.equal(center.status,200);assert.equal(center.data.enabled,true);
  assert.equal(center.data.coverage.provider_inbound_live_certified,false);
  assert.equal(center.data.review_readonly_enabled,true);
  const id=f.p.fixtures.ask_one_question;
  assert.equal(center.data.inbox.some(x=>x.opportunity_id===id&&x.category==='DRAFT_REVIEW'),true);
  assert.equal(center.data.today.some(x=>x.opportunity_id===f.p.fixtures.call),true);
  const selected=await f.api('producer-approval-preflight?ids='+id);
  assert.equal(selected.status,200);assert.equal(selected.data.items.length,1);
  assert.equal(selected.data.items[0].current_revision,4);
  assert.equal(selected.data.items[0].can_review,true);
  assert.equal(selected.data.items[0].can_approve,false);
  assert.equal(selected.data.items[0].can_send,false);
  assert.equal(selected.data.send_authority,'NONE');
  assert.equal(center.data.inbox.every(x=>x.can_bulk_approve===false&&x.sms_send_eligible===false),true);
 }finally{f.sql.close()}
});
test('renewal profile does not silently confirm imported dates; explicit source confirms independently',async()=>{
 const f=fixture();try{
  const raw=await f.api('prospect-360?id='+f.p.fixtures.due_callback);
  const confirmed=await f.api('prospect-360?id='+f.p.fixtures.due_appointment);
  assert.equal(raw.status,200);assert.equal(confirmed.status,200);
  assert.equal(raw.data.facts.renewal.verification,'imported_unverified');
  assert.equal(raw.data.facts.renewal.lifecycle,'CANDIDATE');
  assert.equal(confirmed.data.facts.renewal.verification,'customer_confirmed');
  assert.equal(confirmed.data.facts.renewal.value.date,'2027-01-17');
  for(const v of [raw.data,confirmed.data]){
   assert.equal(v.facts.renewal.sms_send_authorized,false);
   assert.equal(v.limitations.no_new_identity_merge,true);
  }
 }finally{f.sql.close()}
});
test('all three read-only surfaces exclude TEST/CONTROL and refuse STOP authority',async()=>{
 const f=fixture();try{
  const center=(await f.api('producer-command-center')).data;
  const excluded=[f.p.fixtures.test_excluded,f.p.fixtures.control,f.p.fixtures.stop,f.p.fixtures.opt_out];
  for(const id of excluded){
   assert.equal(center.today.some(x=>x.opportunity_id===id),false,id);
   assert.equal(center.inbox.some(x=>x.opportunity_id===id),false,id);
  }
  const q=await f.api('producer-approval-preflight?ids='+excluded.join(','));
  assert.equal(q.status,200);
  assert.ok(q.data.items.every(x=>x.can_send===false&&x.can_review===false));
  assert.ok(q.data.items.some(x=>x.reason==='CONTACT_SUPPRESSED'));
  assert.ok(q.data.items.some(x=>x.reason==='NOT_SIGNAL_ENROLLED'));
 }finally{f.sql.close()}
});
test('unauthenticated combined endpoints deny before reading producer data; default-off gates fail closed',async()=>{
 const f=fixture();try{
  for(const p of ['producer-command-center','prospect-360?id='+f.p.fixtures.call,'producer-approval-preflight?ids='+f.p.fixtures.call])
   assert.equal((await f.api(p,false)).status,401);
  f.env.CF_COMMAND_CENTER_READONLY_ENABLED='0';
  assert.equal((await f.api('producer-command-center')).status,404);
  assert.equal((await f.api('producer-approval-preflight?ids='+f.p.fixtures.call)).status,404);
  f.env.CF_COMMAND_CENTER_READONLY_ENABLED='1';f.env.CF_PROSPECT_360_READONLY_ENABLED='0';
  assert.equal((await f.api('prospect-360?id='+f.p.fixtures.call)).status,404);
 }finally{f.sql.close()}
});
test('cross-surface synthetic SHADOW does not create sends or writes',async()=>{
 const f=fixture();try{
  const p=(await f.api('prospect-360?id='+f.p.fixtures.due_callback)).data;
  const result=simulateEngagement({prospect:p,sms:{decision_2:'ASK_ONE_QUESTION'},source:{acquisition_type:'purchased',permission_verified:true,provider_route_verified:true}});
  assert.equal(result.code,'HOLD_PURCHASED_LIST_ROUTE');
  assert.equal(result.messages_sent,0);assert.equal(result.provider_calls,0);assert.equal(result.writes,0);
 }finally{f.sql.close()}
});
