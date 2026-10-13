import test from 'node:test';
import assert from 'node:assert/strict';
import {selectedIds,projectSelectedReview} from '../server/sms-review-readonly.mjs';
import {simulateEngagement,simulateEngagementBatch} from '../server/engagement-shadow-simulator.mjs';
const detail=()=>({
 opportunity:{id:'synthetic-a',contact:{name:'Synthetic QA Prospect'}},
 population:{population:'DISTRICT_SIGNAL'},
 contactSafety:{suppressed:false},
 sms:{conversation_id:'sms-live-synthetic',revision:4,decision_2:'ASK_ONE_QUESTION',
  draft_status:'pending',reply:'When does your current policy renew?',contact_suppressed:false}
});
test('selection is bounded to 10 unique, opaque opportunity identifiers',()=>{
 assert.deepEqual(selectedIds('abc,def'),['abc','def']);
 for(const s of ['',null,'one,one',Array.from({length:11},(_,i)=>'s'+i).join(','),'../etc','a'.repeat(200),'x,,y']){
  assert.throws(()=>selectedIds(s),/invalid_selection/);
 }
});
test('read-only draft snapshot refreshes current revision and gives no send authority',()=>{
 const r=projectSelectedReview(detail());
 assert.equal(r.current_revision,4);
 assert.equal(r.draft_body,'When does your current policy renew?');
 assert.equal(r.can_review,true);
 assert.equal(r.can_approve,false);
 assert.equal(r.can_send,false);
 assert.equal(r.send_eligibility,'NOT_VERIFIED');
});
test('STOP, CONTROL and takeover suppress draft bodies in selected review',()=>{
 const variants=[
  {...detail(),contactSafety:{suppressed:true}},
  {...detail(),population:{population:'DISTRICT_CONTROL'}},
  {...detail(),sms:{...detail().sms,decision_2:'STOP'}},
  {...detail(),sms:{...detail().sms,human_active:true}},
  {...detail(),sms:{...detail().sms,draft_status:'delivery_review'}}
 ];
 for(const v of variants){
  const r=projectSelectedReview(v);
  assert.equal(r.can_review,false);
  assert.equal(r.draft_body,'');
  assert.equal(r.can_send,false);
 }
});
const profile=()=>({population:'DISTRICT_SIGNAL',facts:{renewal:{verification:'unknown',lifecycle:'UNKNOWN',conflict:false},contact_safety:{suppressed:false}},commitments:[]});
const source=()=>({acquisition_type:'first_party',permission_verified:true,provider_route_verified:true});
test('shadow forbids purchased lists even when vendor claims consent',()=>{
 const result=simulateEngagement({prospect:profile(),sms:{decision_2:'ASK_ONE_QUESTION'},source:{...source(),acquisition_type:'purchased'}});
 assert.equal(result.code,'HOLD_PURCHASED_LIST_ROUTE');assert.equal(result.proposed_message,null);assert.equal(result.messages_sent,0);
});
test('unknown permission refuses to propose engagement; high intent cannot substitute',()=>{
 const r=simulateEngagement({prospect:profile(),sms:{decision_2:'CALL'},source:{...source(),permission_verified:false}});
 assert.equal(r.code,'HOLD_NO_POSITIVE_PERMISSION');assert.equal(r.will_send,false);
});
test('STOP beats caller intent, consent, renewal urgency and all approvals',()=>{
 const p=profile();p.facts.contact_safety.suppressed=true;p.facts.renewal.lifecycle='WINDOW_OPEN';
 const r=simulateEngagement({prospect:p,sms:{decision_2:'CALL'},source:source()});
 assert.equal(r.code,'HOLD_SUPPRESSED');assert.equal(r.proposed_message,null);
});
test('CONTROL and synthetic test never run SIGNAL shadow automation',()=>{
 assert.equal(simulateEngagement({prospect:{...profile(),population:'DISTRICT_CONTROL'},source:source()}).code,'HOLD_CONTROL');
 assert.equal(simulateEngagement({prospect:profile(),source:{...source(),synthetic:true}}).code,'HOLD_TEST');
});
test('positive test permission produces only a question proposal, never sends',()=>{
 const r=simulateEngagement({prospect:profile(),sms:{decision_2:'ASK_ONE_QUESTION'},source:source()});
 assert.equal(r.code,'PROPOSE_ASK_RENEWAL');assert.match(r.proposed_message,/renew/i);
 assert.equal(r.sms_send_authorized,false);assert.equal(r.provider_route_authorized,false);
 assert.equal(r.messages_sent,0);assert.equal(r.provider_calls,0);assert.equal(r.writes,0);
});
test('conflicts and explicit call/commitments are distinguished without sends',()=>{
 let p=profile();p.facts.renewal.conflict=true;
 assert.equal(simulateEngagement({prospect:p,source:source()}).code,'REVIEW_RENEWAL_CONFLICT');
 p=profile();assert.equal(simulateEngagement({prospect:p,sms:{decision_2:'CALL'},source:source()}).code,'PRODUCER_CALL_REQUESTED');
 p.commitments=[{type:'CALLBACK',actionable:true,due_date:'2026-10-13'}];
 assert.equal(simulateEngagement({prospect:p,source:source()}).code,'PRODUCER_CONFIRMED_FOLLOWUP');
});
test('100 synthetic prospects simulate without network or provider side effects',()=>{
 const records=Array.from({length:100},(_,i)=>({prospect:profile(),sms:{decision_2:'ASK_ONE_QUESTION'},source:i%2?source():{...source(),acquisition_type:'vendor_list'}}));
 const report=simulateEngagementBatch(records);
 assert.equal(report.evaluated,100);assert.equal(report.messages_sent,0);
 assert.equal(report.external_actions,0);assert.equal(report.counts.HOLD_PURCHASED_LIST_ROUTE,50);
 assert.equal(report.counts.PROPOSE_ASK_RENEWAL,50);
 assert.throws(()=>simulateEngagementBatch(Array.from({length:1001},()=>({}))),/shadow_batch_limit/);
});
