import test from 'node:test';
import assert from 'node:assert/strict';
import {
 emptyEvidenceState,admitEvidence,projectEvidence,pruneExpiredEvidence,simulateEvidenceCycle
} from '../server/continuous-evidence-shadow.mjs';

const NOW='2026-10-14T00:00:00Z';
const rights=()=>({internal_insurance_use:true,external_transfer_authorized:false,
 commercial_analytics_eligible:false});
const identity=()=>({status:'linked',verified_reference:true,linked_profile_id:'prospect-1'});
const event=(source_event_id,source_type,observations,overrides={})=>({
 workspace_id:'qa-workspace',profile_id:'prospect-1',source_event_id,source_type,
 observed_at:'2026-10-13T14:00:00Z',identity:identity(),rights:rights(),observations,
 ...overrides
});
const a=(field,value,extra={})=>({field,value,...extra});
const importCarrier=()=>event('vendor-1','vendor_import',[a('carrier','AAA')]);
const smsKnown=()=>event('sms-1','sms_inbound',[
 a('vehicle_count',3),a('renewal_date','2026-12-18',{policy_line:'AUTO'})
],{observed_at:'2026-10-13T15:00:00Z'});
const smsCall=()=>event('sms-2','sms_inbound',[
 a('homeowner',true),a('explicit_call_request',true)
],{observed_at:'2026-10-13T16:00:00Z'});
const add=(s,e)=>{const r=admitEvidence(s,e,{now:NOW});assert.equal(r.code,'ADMITTED');return r.state};
const scenario={acquisition_type:'first_party',permission_verified:true,provider_route_verified:true};
const cycle=(s,opts={})=>simulateEvidenceCycle(s,{
 workspace_id:'qa-workspace',profile_id:'prospect-1',now:NOW,source:scenario,...opts
});
const safe=r=>{assert.equal(r.will_send,false);assert.equal(r.sms_send_authorized,false);
 assert.equal(r.provider_calls,0);assert.equal(r.messages_sent,0);assert.equal(r.writes,0);};

test('E1: one source-linked import yields unverified carrier and zero data monetization rights',()=>{
 const original=emptyEvidenceState();
 const out=admitEvidence(original,importCarrier(),{now:NOW});
 assert.equal(original.events.length,0,'pure input state stays untouched');
 assert.equal(out.code,'ADMITTED');
 const p=projectEvidence(out.state,{workspace_id:'qa-workspace',profile_id:'prospect-1',now:NOW});
 assert.equal(p.facts.carrier.value,'AAA');
 assert.equal(p.facts.carrier.verification,'imported_unverified');
 assert.equal(p.facts.carrier.evidence[0].source_event_id,'vendor-1');
 assert.equal(p.external_transfer_authorized,false);
 assert.equal(p.commercial_analytics_eligible,false);
 assert.equal(p.sms_send_authorized,false);
 assert.equal(p.facts.renewal_date.status,'MISSING');
});
test('E1: replay exact event is idempotent; conflicting same source ID is held',()=>{
 let s=add(emptyEvidenceState(),importCarrier());
 let r=admitEvidence(s,importCarrier(),{now:NOW});
 assert.equal(r.code,'DUPLICATE_EXACT');
 assert.equal(r.state.events.length,1);
 r=admitEvidence(r.state,event('vendor-1','vendor_import',[a('carrier','Other Carrier')]),{now:NOW});
 assert.equal(r.code,'HOLD_SOURCE_ID_CONFLICT');
 assert.equal(r.state.events.length,1);
 assert.equal(r.state.held.length,1);
 assert.equal(projectEvidence(r.state,{workspace_id:'qa-workspace',profile_id:'prospect-1',now:NOW}).facts.carrier.value,'AAA');
});
test('E1: ingestion requires explicit internal-use rights, identity and valid allowlisted facts',()=>{
 const s=emptyEvidenceState();
 for(const [bad,code] of [
  [event('bad-1','vendor_import',[a('carrier','AAA')],{rights:{}}),'HOLD_SOURCE_RIGHTS'],
  [event('bad-2','vendor_import',[a('carrier','AAA')],{identity:{status:'candidate'}}),'HOLD_IDENTITY_UNVERIFIED'],
  [event('bad-3','vendor_import',[a('carrier','AAA')],{identity:{status:'linked',verified_reference:true,linked_profile_id:'someone-else'}}),'HOLD_IDENTITY_UNVERIFIED'],
  [event('bad-4','vendor_import',[a('religion','unknown')]),'HOLD_INVALID_EVENT'],
  [event('bad-5','vendor_import',[a('renewal_date','2026-02-30')]),'HOLD_INVALID_EVENT'],
  [event('bad-6','vendor_import',[a('vehicle_count','3')]),'HOLD_INVALID_EVENT']
 ])assert.equal(admitEvidence(s,bad,{now:NOW}).code,code);
 assert.equal(s.events.length,0);
});
test('E2: precise renewal month and exact date can agree; separate policy dates are not contradictions',()=>{
 let s=add(emptyEvidenceState(),event('vendor-month','vendor_import',[
  a('renewal_date','2026-12',{policy_line:'AUTO'})]));
 s=add(s,smsKnown());
 const p=projectEvidence(s,{workspace_id:'qa-workspace',profile_id:'prospect-1',now:NOW});
 assert.equal(p.facts.renewal_date.status,'KNOWN');
 assert.equal(p.facts.renewal_date.value,'2026-12-18');
 assert.equal(p.facts.renewal_date.verification,'customer_reported');
 assert.equal(p.material_conflicts,false);
 s=add(s,event('home-policy','sms_inbound',[
  a('renewal_date','2026-11-20',{policy_line:'HOME'})]));
 const p2=projectEvidence(s,{workspace_id:'qa-workspace',profile_id:'prospect-1',now:NOW});
 assert.equal(p2.facts['renewal_date:AUTO'].value,'2026-12-18');
 assert.equal(p2.facts['renewal_date:HOME'].value,'2026-11-20');
 assert.equal(p2.facts.renewal_date.status,'AMBIGUOUS');
 assert.equal(p2.material_conflicts,false);
});
test('E2: real same-line renewal contradictions hold current value, keep source trail',()=>{
 let s=add(emptyEvidenceState(),smsKnown());
 s=add(s,event('sms-conflict','sms_inbound',[
  a('renewal_date','2027-01-01',{policy_line:'AUTO'})]));
 const p=projectEvidence(s,{workspace_id:'qa-workspace',profile_id:'prospect-1',now:NOW});
 assert.equal(p.facts.renewal_date.status,'CONFLICTED');
 assert.equal(p.facts.renewal_date.value,null);
 assert.equal(p.facts.renewal_date.evidence.length,2);
 assert.equal(p.material_conflicts,true);
 const d=cycle(s);assert.equal(d.shadow_code,'REVIEW_RENEWAL_CONFLICT');safe(d);
});
test('E2: explicit producer correction can supersede an earlier source; original stays auditable',()=>{
 let s=add(emptyEvidenceState(),smsKnown());
 s=add(s,event('prod-confirm','producer_confirmation',[
  a('renewal_date','2026-12-19',{policy_line:'AUTO',producer_verified:true,supersedes_source_event_id:'sms-1'})]));
 const p=projectEvidence(s,{workspace_id:'qa-workspace',profile_id:'prospect-1',now:NOW});
 assert.equal(p.facts.renewal_date.status,'KNOWN');
 assert.equal(p.facts.renewal_date.value,'2026-12-19');
 assert.equal(p.facts.renewal_date.verification,'producer_confirmed');
 assert.equal(p.facts.vehicle_count.value,3,'a correction of renewal must not erase an unrelated vehicle assertion');
 assert.equal(s.events.length,2,'previous source event retained in synthetic audit state');
});
test('E2: workspace boundaries and expiry protect projections, and pruning removes expired payload',()=>{
 let s=add(emptyEvidenceState(),importCarrier());
 s=add(s,event('short-lived','sms_inbound',[a('vehicle_count',3)],{
 rights:{...rights(),retain_until:'2026-10-14T01:00:00Z'}}));
 assert.equal(projectEvidence(s,{workspace_id:'other',profile_id:'prospect-1',now:NOW}).source_events,0);
 assert.equal(projectEvidence(s,{workspace_id:'qa-workspace',profile_id:'other',now:NOW}).source_events,0);
 assert.equal(projectEvidence(s,{workspace_id:'qa-workspace',profile_id:'prospect-1',now:'2026-10-14T02:00:00Z'}).facts.vehicle_count.status,'MISSING');
 const p=pruneExpiredEvidence(s,{now:'2026-10-14T02:00:00Z'});
 assert.equal(p.events.length,1);
 assert.equal(p.events[0].source_event_id,'vendor-1');
});
test('E3: admitted import → useful question → new reply → different question → explicit CALL handoff',()=>{
 let s=add(emptyEvidenceState(),importCarrier());
 let d=cycle(s);
 assert.equal(d.shadow_code,'PROPOSE_ASK_RENEWAL');
 assert.match(d.proposed_message,/renew/i);safe(d);
 s=add(s,smsKnown());
 d=cycle(s);
 assert.equal(d.memory.facts.vehicle_count.value,3);
 assert.equal(d.memory.facts.renewal_date.value,'2026-12-18');
 assert.equal(d.shadow_code,'PROPOSE_ASK_BUNDLE');
 assert.equal(/renew/i.test(d.proposed_message),false,'never repeat answered renewal question');
 safe(d);
 s=add(s,smsCall());
 d=cycle(s);
 assert.equal(d.memory.facts.homeowner.value,true);
 assert.equal(d.shadow_code,'PRODUCER_CALL_REQUESTED');
 assert.equal(d.proposed_message,null);safe(d);
 assert.equal(d.memory.source_events,3);
});
test('E3: STOP, CONTROL, purchased route and unknown permission outrank learned high intent',()=>{
 let s=add(emptyEvidenceState(),importCarrier());
 s=add(s,smsCall());
 for(const [options,code] of [
  [{contact_suppressed:true},'HOLD_SUPPRESSED'],
  [{population:'DISTRICT_CONTROL'},'HOLD_CONTROL'],
  [{source:{...scenario,acquisition_type:'purchased'}},'HOLD_PURCHASED_LIST_ROUTE'],
  [{source:{...scenario,permission_verified:false}},'HOLD_NO_POSITIVE_PERMISSION']
 ]){
  const r=cycle(s,options);
  assert.equal(r.shadow_code,code);
  assert.equal(r.proposed_message,null);safe(r);
 }
});
test('E1/E3: separate source event reuse in another profile is rejected, no cross-profile leakage',()=>{
 let s=add(emptyEvidenceState(),importCarrier());
 const r=admitEvidence(s,event('vendor-1','vendor_import',[a('carrier','AAA')],{
  profile_id:'prospect-2',identity:{status:'linked',verified_reference:true,linked_profile_id:'prospect-2'}}),{now:NOW});
 assert.equal(r.code,'HOLD_SOURCE_ID_CONFLICT');
 assert.equal(r.state.events.length,1);
 assert.equal(projectEvidence(r.state,{workspace_id:'qa-workspace',profile_id:'prospect-2',now:NOW}).facts.carrier.status,'MISSING');
});
test('E1/E3: modeled case never executes I/O, even after 50 repeated synthetic turns',()=>{
 let s=emptyEvidenceState();
 s=add(s,importCarrier());
 for(let i=0;i<50;i++){
  const r=admitEvidence(s,event('repeat-'+i,'sms_inbound',[a('shopping_reason','Comparing coverage')]),{now:NOW});
  assert.equal(r.code,'ADMITTED');s=r.state;
  const out=cycle(s);safe(out);
 }
 assert.equal(s.events.length,51);
 const p=projectEvidence(s,{workspace_id:'qa-workspace',profile_id:'prospect-1',now:NOW});
 assert.equal(p.facts.shopping_reason.evidence.length,50);
});
