import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveProducerActionQuality,PRODUCER_ACTION_QUALITY_VERSION} from '../server/producer-action-quality.mjs';

const attention=(band='NOW',text='Recent inbound has no later producer reply',actionable=true)=>({
 band,rank:band==='NOW'?110:20,actionable,reasons:[{text,source_ref:{kind:'sms',id:'m1'}}],due_at:null
});

test('Producer Action Quality exposes why, exact action and evidence',()=>{
 const q=deriveProducerActionQuality({
  population:'DISTRICT_SIGNAL',
  attention:attention(),
  sms:{decision_2:'ASK_ONE_QUESTION',reply:'When does your policy renew?',reason:'Ask only the next missing useful fact.'},
  commitments:[],
  opportunityPriority:{status:'provisional',queue:'unclassified',score:null,score_min:40,score_max:75},
  nextBestAction:{engine:'CF-NBA-1.2',action:'ASK_ONE_SIGNAL',label:'Ask one signal',rationale:'Priority range is incomplete.',source:'opportunity_priority_missing_signal'}
 });
 assert.equal(q.version,PRODUCER_ACTION_QUALITY_VERSION);
 assert.equal(q.actionable,true);
 assert.equal(q.why_now.text,'Recent inbound has no later producer reply');
 assert.equal(q.action.code,'ASK_ONE_QUESTION');
 assert.equal(q.action.label,'When does your policy renew?');
 assert.ok(q.evidence.some(x=>x.kind==='signal_decision_2'));
 assert.ok(q.evidence.some(x=>x.kind==='opportunity_priority'));
 assert.ok(q.evidence.some(x=>x.kind==='nba'));
});

test('STOP and suppression outrank every recommendation',()=>{
 const q=deriveProducerActionQuality({
  population:'DISTRICT_SIGNAL',
  attention:{band:'SUPPRESSED',rank:0,actionable:false,reasons:[{text:'Contact suppressed',source_ref:{kind:'contact_safety'}}]},
  sms:{decision_2:'STOP',quote_ready:true},
  commitments:[{id:'c1',type:'CALLBACK',status:'open',due_at:'2026-10-08T18:00:00Z',confirmation:'producer_recorded',source_ref:{kind:'task',id:'t1'}}],
  opportunityPriority:{status:'ready',queue:'shoot_now',score:95},
  nextBestAction:{action:'CONNECT_OR_PREPARE_NOW',label:'Move this opportunity now',rationale:'Tier A'}
 });
 assert.equal(q.action.code,'DO_NOT_CONTACT');
 assert.equal(q.actionable,false);
});

test('CLOSE and LATER outrank due commitments and NBA',()=>{
 const close=deriveProducerActionQuality({
  population:'DISTRICT_SIGNAL',attention:attention('TODAY','Producer commitment overdue'),
  sms:{decision_2:'CLOSE'},commitments:[{type:'CALLBACK',status:'open',due_at:'2026-10-08T17:00:00Z',confirmation:'producer_recorded',source_ref:{kind:'task',id:'t1'}}],
  nextBestAction:{action:'CONNECT_OR_BOOK',label:'Connect or book Dylan'}
 });
 assert.equal(close.action.code,'CLOSE_NO_OUTREACH');assert.equal(close.actionable,false);
 const later=deriveProducerActionQuality({population:'DISTRICT_SIGNAL',attention:attention('UPCOMING','Future timing recorded'),sms:{decision_2:'LATER',future_date:'2026-11-01'},nextBestAction:{action:'CONNECT_OR_BOOK',label:'Connect'}});
 assert.equal(later.action.code,'WAIT_UNTIL_RECORDED_TIME');assert.equal(later.action.due_at,'2026-11-01');assert.equal(later.actionable,false);
});

test('due commitment becomes exact action before generic NBA',()=>{
 const q=deriveProducerActionQuality({
  population:'WEB_DIRECT',
  attention:{band:'NOW',rank:100,actionable:true,reasons:[{text:'Appointment/callback due now',source_ref:{kind:'task',id:'t1'}}],due_at:'2026-10-08T18:00:00Z'},
  commitments:[{id:'c1',type:'CALLBACK',title:'Call customer',status:'open',due_at:'2026-10-08T18:00:00Z',confirmation:'producer_recorded',source_ref:{kind:'task',id:'t1'}}],
  nextBestAction:{action:'CONNECT_OR_BOOK',label:'Connect or book Dylan',rationale:'Journey state'}
 });
 assert.equal(q.action.code,'CALL_BACK');
 assert.equal(q.action.label,'Call back');
 assert.equal(q.action.source,'commitment');
});

test('current Signal CALL makes channel-specific exact action',()=>{
 const q=deriveProducerActionQuality({
  population:'DISTRICT_SIGNAL',attention:attention('NOW','Explicit contact, quote or proceed request'),
  sms:{decision_2:'CALL',new_facts:{explicit_call_request:true},facts:{preferred_channel:'CALL'}},
  nextBestAction:{action:'CONNECT_OR_PREPARE_NOW',label:'Move now'}
 });
 assert.equal(q.action.code,'CALL_CUSTOMER');assert.equal(q.action.channel,'CALL');
});

test('Opportunity Priority cannot override current Signal question',()=>{
 const q=deriveProducerActionQuality({
  population:'DISTRICT_SIGNAL',attention:attention('HIGH','Opportunity Priority: shoot now'),
  sms:{decision_2:'ASK_ONE_QUESTION',reply:'Who are you currently insured with?'},
  opportunityPriority:{status:'ready',queue:'shoot_now',score:93},
  nextBestAction:{action:'CONNECT_OR_PREPARE_NOW',label:'Move this opportunity now'}
 });
 assert.equal(q.action.code,'ASK_ONE_QUESTION');
});

test('NBA supplies exact action when no current Signal or commitment owns it',()=>{
 const q=deriveProducerActionQuality({
  population:'WEB_DIRECT',attention:{band:'HIGH',rank:50,actionable:true,reasons:[{text:'Opportunity Priority: shoot now',source_ref:{kind:'opportunity_priority'}}]},
  opportunityPriority:{status:'ready',queue:'shoot_now',score:88},
  nextBestAction:{engine:'CF-NBA-1.2',action:'CONNECT_OR_PREPARE_NOW',label:'Move this opportunity now',rationale:'Tier A',source:'opportunity_priority'}
 });
 assert.equal(q.action.code,'CONNECT_OR_PREPARE_NOW');assert.equal(q.action.source,'nba');assert.equal(q.actionable,true);
});

test('CONTROL receives no Producer Action Quality projection',()=>{
 assert.equal(deriveProducerActionQuality({population:'DISTRICT_CONTROL',attention:attention()}),null);
});
