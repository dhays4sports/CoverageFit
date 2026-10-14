import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {fixture,open,event,project,seed,NOW} from './helpers/prospect-memory-fixture.mjs';
import {planSignal} from '../server/signal-dynamic-planner.mjs';
const plan=(m,options={})=>planSignal(project(m),{now:NOW,...options});
const count=(db,t)=>db.prepare('SELECT count(*) n FROM '+t).get().n;
const admit=(m,e)=>{const r=m.admit(e,{now:NOW});assert.equal(r.code,'ADMITTED');return r};

test('E2 essential file-backed restart/replay -> changed SIGNAL decision, no repeated question or external I/O',()=>{
 const f=fixture();let reopened;const oldFetch=globalThis.fetch;let calls=0;globalThis.fetch=()=>{calls++;throw Error('external I/O forbidden')};
 try{
  const first=event('import',[{field:'carrier',value:'AAA'}],{source_type:'vendor_import'});
  admit(f.memory,first);
  const before=project(f.memory),initial=plan(f.memory);
  assert.equal(initial.action,'ASK ONE QUESTION');assert.equal(initial.question_field,'renewal_date');
  assert.equal(before.facts.carrier.verification,'imported_unverified');
  f.db.close();reopened=open(f.path);
  assert.deepEqual(project(reopened.memory),before);
  assert.equal(reopened.memory.admit(first,{now:NOW}).code,'DUPLICATE_EXACT');
  assert.equal(count(reopened.db,'cf_evidence_events'),1);assert.equal(count(reopened.db,'cf_evidence_assertions'),1);
  admit(reopened.memory,event('reply',[{field:'renewal_date',value:'2026-10-25',policy_line:'AUTO'},{field:'vehicle_count',value:3}]));
  const next=plan(reopened.memory);
  assert.equal(next.action,'ASK ONE QUESTION');assert.equal(next.question_field,'homeowner');
  assert.notEqual(next.profile_version,initial.profile_version);
  const current=project(reopened.memory);assert.equal(current.facts.renewal_date.evidence[0].source_ref.source_event_id,'reply');
  admit(reopened.memory,event('request-call',[{field:'explicit_call_request',value:true},{field:'homeowner',value:true}]));
  const final=plan(reopened.memory);
  assert.equal(final.action,'CALL');assert.equal(final.execution_eligibility.call,false);
  assert.ok(final.contact_restrictions.includes('SMS_PERMISSION_UNVERIFIED'));
  assert.equal(reopened.memory.recordDecision(project(reopened.memory),final),reopened.memory.recordDecision(project(reopened.memory),final));
  assert.equal(count(reopened.db,'cf_evidence_decisions'),1);
  assert.equal(calls,0);assert.equal(final.external_actions,0);
 }finally{globalThis.fetch=oldFetch;reopened?.db.close();f.cleanup()}
});
test('E2 atomic rollback after event INSERT leaves no partial assertions or revisions',()=>{
 const f=fixture();try{
  assert.throws(()=>f.memory.admit(event(),{now:NOW,interruptAfterEvent:true}),/interruption/);
  for(const t of ['cf_evidence_events','cf_evidence_assertions','cf_evidence_revisions'])assert.equal(count(f.db,t),0);
  admit(f.memory,event());assert.equal(project(f.memory).revision,1);
 }finally{f.cleanup()}
});
test('E2 simultaneous connections admit one event and one revision',async()=>{
 const f=fixture();try{
  const run=()=>new Promise((resolve,reject)=>{const w=new Worker(new URL('./helpers/prospect-memory-worker.mjs',import.meta.url),{workerData:{path:f.path,event:event()}});w.on('message',resolve);w.on('error',reject)});
  const results=await Promise.all([run(),run(),run(),run()]);
  assert.equal(results.filter(r=>r.code==='ADMITTED').length,1);assert.equal(results.filter(r=>r.code==='DUPLICATE_EXACT').length,3);
  assert.equal(count(f.db,'cf_evidence_events'),1);assert.equal(count(f.db,'cf_evidence_assertions'),1);assert.equal(project(f.memory).revision,1);
 }finally{f.cleanup()}
});
test('E2 conflicting renewals held; field-specific sourced correction preserves unrelated vehicle count',()=>{
 const f=fixture();try{
  admit(f.memory,event('original',[{field:'renewal_date',value:'2026-10-25',policy_line:'AUTO'},{field:'vehicle_count',value:3}]));
  admit(f.memory,event('conflict',[{field:'renewal_date',value:'2026-11-25',policy_line:'AUTO'}]));
  assert.equal(plan(f.memory).reason_category,'CONFLICTING_EVIDENCE');
  admit(f.memory,event('correction',[{field:'renewal_date',value:'2026-11-25',policy_line:'AUTO',producer_verified:true,supersedes_source_type:'sms_inbound',supersedes_source_event_id:'original'}],{source_type:'producer_confirmation',observed_at:'2026-10-14T11:00:00Z'}));
  const p=project(f.memory);assert.equal(p.facts.renewal_date.status,'KNOWN');assert.equal(p.facts.vehicle_count.value,3);
  assert.equal(p.facts.renewal_date.verification,'producer_confirmed');assert.equal(plan(f.memory).action,'LATER');
 }finally{f.cleanup()}
});
test('E2 source namespaces, collision holds, cross-workspace and ambiguous identity never merge',()=>{
 const f=fixture();try{
  const first=event();admit(f.memory,first);
  assert.equal(f.memory.admit(event('first',[{field:'carrier',value:'Other'}]),{now:NOW}).code,'HOLD_SOURCE_ID_CONFLICT');
  admit(f.memory,event('first',[{field:'carrier',value:'AAA'}],{source_type:'vendor_import'}));
  assert.equal(count(f.db,'cf_evidence_assertions'),2);
  for(const identity of [{status:'ambiguous'},{...first.identity,basis:'shared_phone'},{...first.identity,customer_id:'wrong'}])assert.equal(f.memory.admit(event('held',undefined,{identity}),{now:NOW}).code,'HOLD_IDENTITY_UNVERIFIED');
  assert.equal(f.memory.admit(event('other',undefined,{workspace_id:'other'}),{now:NOW}).code,'HOLD_IDENTITY_UNVERIFIED');
  assert.equal(count(f.db,'cf_evidence_events'),2);
  seed(f.db,'other');
  assert.equal(f.memory.admit(event('bad-correction',[{field:'carrier',value:'Other',producer_verified:true,supersedes_source_type:'sms_inbound',supersedes_source_event_id:'first'}],{source_type:'producer_confirmation',profile_id:'other',observed_at:'2026-10-14T11:00:00Z'}),{now:NOW}).code,'HOLD_INVALID_CORRECTION');
 }finally{f.cleanup()}
});
test('E2 out-of-order admission is reproducible, future evidence withheld and stale facts require review',()=>{
 const a=fixture(),b=fixture();try{
  const e1=event('one'),e2=event('two',[{field:'vehicle_count',value:2}],{observed_at:'2026-10-13T00:00:00Z'});
  admit(a.memory,e1);admit(a.memory,e2);admit(b.memory,e2);admit(b.memory,e1);
  assert.deepEqual(project(a.memory),project(b.memory));
  admit(a.memory,event('future',[{field:'homeowner',value:true}],{observed_at:'2026-10-15T00:00:00Z'}));
  assert.equal(project(a.memory).facts.homeowner.status,'MISSING');
  admit(a.memory,event('old-renewal',[{field:'renewal_date',value:'2026-10-01',policy_line:'AUTO'}]));
  assert.equal(plan(a.memory).reason_category,'STALE_FACT');assert.equal(plan(a.memory).question_field,null);
 }finally{a.cleanup();b.cleanup()}
});
test('E2 retention and retraction delete assertion payloads and decision traces; replay cannot resurrect',()=>{
 const f=fixture();try{
  const e=event('expiring',undefined,{rights:{internal_insurance_use:true,controller:'qa',retain_until:'2026-10-15T00:00:00Z'}});
  const admitted=admit(f.memory,e);
  f.memory.recordDecision(project(f.memory),plan(f.memory));
  const later='2026-10-16T00:00:00.000Z';
  assert.equal(f.memory.project('qa-memory','prospect-1',{now:later}).facts.carrier.status,'MISSING');
  assert.equal(f.memory.expire('qa-memory',{now:later}),1);
  assert.equal(count(f.db,'cf_evidence_assertions'),0);assert.equal(count(f.db,'cf_evidence_decisions'),0);
  const row=f.db.prepare('SELECT * FROM cf_evidence_events').get();assert.equal(row.event_json,null);assert.equal(row.source_ref_json,null);
  assert.notEqual(f.memory.admit(e,{now:later}).code,'ADMITTED');
  const r=admit(f.memory,event('retract'));assert.equal(f.memory.erase('qa-memory',r.event_key,'RETRACTED',{now:NOW}),true);
  assert.equal(f.memory.admit(event('retract'),{now:NOW}).code,'REPLAY_TOMBSTONED');
  assert.equal(project(f.memory).facts.carrier.status,'MISSING');
 }finally{f.cleanup()}
});
test('E2 default-deny rights and document/inference verification remain distinct',()=>{
 const f=fixture();try{
  assert.equal(f.memory.admit(event('no-rights',undefined,{rights:{}}),{now:NOW}).code,'HOLD_SOURCE_RIGHTS');
  assert.equal(f.memory.admit(event('bad-doc',[{field:'carrier',value:'AAA'}],{source_type:'document_verification'}),{now:NOW}).code,'HOLD_INVALID_EVENT');
  const doc=event('doc',[{field:'carrier',value:'AAA',document_ref:'synthetic-policy',verification_event_id:'producer-review-1'}],{source_type:'document_verification'});
  assert.equal(f.memory.admit(doc,{now:NOW}).code,'HOLD_DOCUMENT_VERIFICATION');
  admit(f.memory,event('producer-review-1',[{field:'carrier',value:'AAA',producer_verified:true}],{source_type:'producer_confirmation'}));
  admit(f.memory,event('doc',[{field:'carrier',value:'AAA',document_ref:'synthetic-policy',verification_event_id:'producer-review-1'}],{source_type:'document_verification'}));
  assert.equal(project(f.memory).facts.carrier.verification,'document_verified');
  admit(f.memory,event('guess',[{field:'explicit_call_request',value:true}],{source_type:'model_inference'}));
  assert.equal(project(f.memory).facts.explicit_call_request.verification,'inference');assert.notEqual(plan(f.memory).action,'CALL');
  assert.equal(project(f.memory).external_transfer_authorized,false);
 }finally{f.cleanup()}
});
test('C1 STOP CONTROL TEST permission owner takeover and confirmed callback precedence',()=>{
 const f=fixture();try{
  admit(f.memory,event('call',[{field:'explicit_call_request',value:true}]));
  assert.equal(plan(f.memory,{contact:{suppressed:true}}).action,'STOP');
  assert.equal(plan(f.memory,{contact:{wrong_number:true}}).action,'STOP');
  for(const population of ['CONTROL','DISTRICT_CONTROL','TEST'])assert.equal(plan(f.memory,{population}).action,'NO ACTION');
  assert.equal(plan(f.memory,{producerTakeover:true}).action,'NO ACTION');
  for(const workflowOwner of ['AGENCYZOOM','UNKNOWN','COVERAGEFIT_APPROVED']){
   const r=plan(f.memory,{workflowOwner,contact:{sms_permission:false,acquisition_type:'purchased'}});
   assert.equal(r.action,'CALL');assert.equal(r.execution_eligibility.sms,false);assert.equal(r.execution_eligibility.call,false);
  }
  const commitments=[{confirmed:true,status:'open',evidence_ref:'producer-callback-1',at:'2026-10-16T10:00:00.000Z'}];
  assert.equal(plan(f.memory,{commitments}).action,'LATER');assert.equal(plan(f.memory,{commitments}).next_evaluation_at,commitments[0].at);
  commitments[0].at='2026-10-14T10:00:00.000Z';assert.equal(plan(f.memory,{commitments}).reason_category,'COMMITMENT_DUE');
  f.db.prepare("UPDATE cf_ucp_opportunity_links SET customer_id='cust_other' WHERE opportunity_id='prospect-1'");
  seed(f.db,'other');f.db.prepare("UPDATE cf_ucp_opportunity_links SET customer_id='cust_other' WHERE opportunity_id='prospect-1'").run();
  assert.equal(plan(f.memory).reason_category,'IDENTITY_HOLD');
 }finally{f.cleanup()}
});
test('C1 versioned decision rejects changed evidence and invalid controlled clock',()=>{
 const f=fixture();try{
  admit(f.memory,event());const p=project(f.memory),d=plan(f.memory);
  admit(f.memory,event('new',[{field:'homeowner',value:true}]));
  assert.throws(()=>f.memory.recordDecision(p,d),/stale_decision/);
  assert.throws(()=>planSignal(p,{now:'bad'}),/clock/);
  assert.throws(()=>planSignal(p,{now:'2026-10-15T00:00:00Z'}),/clock/);
 }finally{f.cleanup()}
});

test('E2 future correction takes effect at observation time; retraction never resurrects superseded facts',()=>{
 const f=fixture();try{
  admit(f.memory,event('old',[{field:'vehicle_count',value:2}]));
  const correction=admit(f.memory,event('fix',[{field:'vehicle_count',value:3,producer_verified:true,supersedes_source_type:'sms_inbound',supersedes_source_event_id:'old'}],{source_type:'producer_confirmation',observed_at:'2026-10-15T00:00:00Z'}));
  assert.equal(project(f.memory).facts.vehicle_count.value,2);
  const future='2026-10-16T00:00:00.000Z';
  assert.equal(f.memory.project('qa-memory','prospect-1',{now:future}).facts.vehicle_count.value,3);
  f.memory.erase('qa-memory',correction.event_key,'RETRACTED',{now:future});
  assert.equal(f.memory.project('qa-memory','prospect-1',{now:future}).facts.vehicle_count.status,'MISSING');
 }finally{f.cleanup()}
});
test('C1 timing and precision, quote intent, stale intent, and wait restrictions remain internal',()=>{
 const f=fixture();try{
  admit(f.memory,event('renewal',[{field:'renewal_date',value:'2026-12',policy_line:'AUTO'}]));
  assert.equal(plan(f.memory).reason_category,'MONTH_PRECISION');
  admit(f.memory,event('quote',[{field:'explicit_quote_request',value:true}]));
  assert.equal(plan(f.memory).reason_category,'CUSTOMER_REQUESTED_QUOTE');
  assert.equal(plan(f.memory,{contact:{wait_until:'2026-10-18T00:00:00.000Z'}}).reason_category,'CONTACT_WAIT');
  assert.equal(plan(f.memory,{contact:{wait_until:'invalid'}}).action,'HUMAN REVIEW');
  assert.equal(plan(f.memory,{closed:true}).action,'CLOSE');
  const future='2026-10-23T12:00:00.000Z',p=f.memory.project('qa-memory','prospect-1',{now:future});
  assert.equal(p.facts.explicit_quote_request.status,'STALE');
  assert.notEqual(planSignal(p,{now:future}).reason_category,'CUSTOMER_REQUESTED_QUOTE');
 }finally{f.cleanup()}
});
