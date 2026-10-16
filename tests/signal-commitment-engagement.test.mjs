// Synthetic SHADOW acceptance for commitment/choice/question engagement.
import test from 'node:test';
import assert from 'node:assert/strict';
import {planSignal,proposeSignalEngagement,ENGAGEMENT_PROPOSAL_BUILD} from '../server/signal-dynamic-planner.mjs';

const NOW='2026-10-16T16:00:00.000Z';
const firstParty={sms_permission:true,verified_first_party_inquiry:true,acquisition_type:'first_party'};
const fact=(value,verification='customer_confirmed')=>({status:'KNOWN',verification,value,evidence:[]});
const make=(facts={},extras={})=>{
 const profile={projection_version:'test-p1',as_of:NOW,identity_status:'LINKED',material_conflicts:false,facts,...extras.profile};
 const opts={now:NOW,population:'WEB_DIRECT',workflowOwner:'COVERAGEFIT_APPROVED',contact:firstParty,...extras.plan};
 return {profile,contact:{...firstParty,...extras.contact},decision:planSignal(profile,opts)};
};
const approach=({profile,contact,decision})=>proposeSignalEngagement(decision,{profile,contact,now:NOW});
const assertNoExecution=result=>{
 assert.equal(result.build,ENGAGEMENT_PROPOSAL_BUILD);
 assert.equal(result.mode,'SHADOW_ONLY');
 assert.deepEqual(result.execution_eligibility,{sms:false,call:false,external:false,reason:'SHADOW_ONLY'});
 for(const key of ['messages_sent','provider_calls','calendar_actions','model_calls'])assert.equal(result[key],0);
};

test('eligible first-party missing fact -> choice-first advisory, canonical C1 action unchanged',()=>{
 const d=make(),original=structuredClone(d.decision);
 assert.equal(d.decision.action,'ASK ONE QUESTION');
 const r=approach(d);
 assert.equal(r.strategy,'CHOICE_FIRST');
 assert.equal(r.next_step,'PROPOSE_CALL_OR_TEXT_CHOICE');
 assert.equal(r.requires_canonical_review,true);
 assert.deepEqual(d.decision,original);
 assertNoExecution(r);
});

test('customer-confirmed TEXT preference -> one question rather than forcing callback',()=>{
 const d=make({preferred_channel:fact('TEXT')});
 assert.equal(d.decision.action,'ASK ONE QUESTION');
 const r=approach(d);
 assert.equal(r.strategy,'QUESTION_FIRST');
 assert.equal(r.next_step,'ASK_ONE_MATERIAL_FACT');
 assertNoExecution(r);
});

test('near-term confirmed BUYER closing -> commitment-first requires canonical review, not an SMS',()=>{
 const d=make({closing_date:fact('2026-10-22')});
 assert.equal(d.decision.action,'ASK ONE QUESTION');
 const r=approach(d);
 assert.equal(r.strategy,'COMMITMENT_FIRST');
 assert.equal(r.requires_canonical_review,true);
 assert.equal(r.producer_handoff,true);
 assertNoExecution(r);
});

test('inferred buyer closing never independently creates urgency',()=>{
 const d=make({closing_date:fact('2026-10-22','inference')});
 assert.equal(approach(d).strategy,'CHOICE_FIRST');
});

test('explicit call or quote -> human handoff, not another SMS qualification turn',()=>{
 for(const [field,action,step] of [['explicit_call_request','CALL','PRODUCER_CALL'],['explicit_quote_request','QUOTE PREPARATION','PRODUCER_QUOTE_REVIEW']]){
   const d=make({[field]:fact(true)});
   assert.equal(d.decision.action,action);
   const r=approach(d);
   assert.equal(r.strategy,'HUMAN_HANDOFF');
   assert.equal(r.next_step,step);
   assert.equal(r.producer_handoff,true);
   assertNoExecution(r);
 }
});

test('confirmed future callback waits; due callback becomes producer call without repeat scheduling',()=>{
 const future=make({}, {plan:{commitments:[{confirmed:true,status:'open',evidence_ref:'fixture-callback',at:'2026-10-20T16:00:00.000Z'}]}});
 assert.equal(future.decision.action,'LATER');
 assert.equal(approach(future).strategy,'WAIT');
 const due=make({}, {plan:{commitments:[{confirmed:true,status:'open',evidence_ref:'fixture-callback',at:'2026-10-15T16:00:00.000Z'}]}});
 assert.equal(due.decision.action,'CALL');
 const r=approach(due);
 assert.equal(r.strategy,'HUMAN_HANDOFF');
 assertNoExecution(r);
});

test('suppression, CONTROL, TEST, identity hold and producer takeover never propose contact',()=>{
 const fixtures=[
   make({}, {plan:{contact:{...firstParty,suppressed:true}}}),
   make({}, {plan:{population:'CONTROL'}}),
   make({}, {plan:{population:'TEST'}}),
   make({}, {profile:{identity_status:'UNLINKED'}}),
   make({}, {plan:{producerTakeover:true}}),
   make({}, {plan:{closed:true}})
 ];
 for(const d of fixtures){
   const r=approach(d);
   assert.equal(r.strategy,'HOLD',d.decision.reason_category);
   assertNoExecution(r);
 }
});

test('vendor, no-consent, unknown owner, no first-party evidence and channel mismatches fail closed',()=>{
 const cases=[
   make({}, {plan:{contact:{...firstParty,acquisition_type:'purchased'}},contact:{acquisition_type:'purchased'}}),
   make({}, {plan:{contact:{...firstParty,sms_permission:false}},contact:{sms_permission:false}}),
   make({}, {plan:{workflowOwner:'AGENCYZOOM'},contact:{}}),
   make({}, {contact:{verified_first_party_inquiry:false}}),
   make({preferred_channel:fact('EMAIL')}),
   make({}, {contact:{explicit_channel_preference:'CALL'}})
 ];
 for(const d of cases){
   const r=approach(d);
   assert.equal(r.strategy,'HOLD',d.decision.reason_category);
   assertNoExecution(r);
 }
});

test('stale profile version and non-SHADOW plans are rejected, never sent',()=>{
 const d=make();
 assert.throws(()=>proposeSignalEngagement(d.decision,{profile:{...d.profile,projection_version:'newer'},contact:d.contact,now:NOW}),/revision_mismatch/);
 assert.throws(()=>proposeSignalEngagement({...d.decision,mode:'LIVE'},{profile:d.profile,contact:d.contact,now:NOW}),/shadow_only/);
 assert.throws(()=>proposeSignalEngagement({...d.decision,execution_eligibility:{sms:true,call:false,external:false}},{profile:d.profile,contact:d.contact,now:NOW}),/shadow_only/);
});

test('no sender, calendar, model or network code paths required for any SHADOW proposal',()=>{
 const originalFetch=globalThis.fetch;let externalCalls=0;
 globalThis.fetch=()=>{externalCalls++;throw Error('external provider access forbidden')};
 try{
   for(const d of [make(),make({preferred_channel:fact('TEXT')}),make({closing_date:fact('2026-10-22')}),make({explicit_call_request:fact(true)})])assertNoExecution(approach(d));
   assert.equal(externalCalls,0);
 }finally{globalThis.fetch=originalFetch}
});
