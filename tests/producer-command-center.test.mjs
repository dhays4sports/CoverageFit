import test from 'node:test';
import assert from 'node:assert/strict';
import {projectCommandCenter} from '../server/producer-command-center.mjs';

const qa=(action,band='NOW',more={})=>({
 id:'id-'+action,name:'Synthetic QA '+action,population:'DISTRICT_SIGNAL',status:'open',
 products:'AUTO',source:'qa',updated_at:'2026-10-12T17:00:00Z',
 attention:{band,actionable:true,reasons:[{text:'Recent inbound has no later producer reply',source_ref:{kind:'sms',id:'msg1'}}]},
 action_quality:{actionable:true,why_now:{text:'Recent inbound has no later producer reply'},action:{code:action,label:'Review quote'},evidence:[{kind:'sms',text:'customer asked'}]},
 sms:{decision_2:'CALL',draft_status:'pending',latest_inbound:'Please call me',contact_suppressed:false},
 ...more
});
const work=records=>({attention_enabled:true,records,total:records.length,test_excluded:2});
test('Today includes governed NOW, TODAY and HIGH; not inferred urgency or consent',()=>{
 const a=qa('CALL_CUSTOMER','NOW');
 const b=qa('ASK_ONE_QUESTION','TODAY',{sms:{decision_2:'ASK_ONE_QUESTION',draft_status:'pending',latest_inbound:'Quote?',contact_suppressed:false}});
 const c=qa('CONTACT_LATER','UPCOMING');
 const d=qa('LOOK_AT_EVIDENCE','NORMAL');
 const r=projectCommandCenter(work([a,b,c,d]));
 assert.deepEqual(r.today.map(x=>x.opportunity_id),[a.id,b.id]);
 assert.equal(r.today[0].actionable,true);
 assert.equal(r.coverage.provider_inbound_live_certified,false);
 assert.equal(r.coverage.read_only,true);
 assert.equal(r.counts.today,2);
});
test('STOP, opt-out/suppressed, CONTROL, and CLOSE cannot surface as actionable',()=>{
 const stop=qa('DO_NOT_CONTACT','SUPPRESSED');
 const control=qa('CALL_CUSTOMER','NOW',{population:'DISTRICT_CONTROL'});
 const held=qa('CALL_CUSTOMER','NOW',{sms:{decision_2:'CALL',contact_suppressed:true,draft_status:'pending'}});
 const close=qa('CLOSE_NO_OUTREACH','TODAY');
 const result=projectCommandCenter(work([stop,control,held,close]));
 assert.equal(result.counts.today,0);
 assert.equal(result.inbox.length,0);
});
test('inbox separates draft review, meaningful SMS now, and delivery exceptions',()=>{
 const draft=qa('ASK_ONE_QUESTION','HIGH',{sms:{decision_2:'ASK_ONE_QUESTION',draft_status:'pending',latest_inbound:'?',contact_suppressed:false}});
 const urgent=qa('CALL_CUSTOMER','NOW',{sms:{decision_2:'CALL',draft_status:'none',latest_inbound:'Please call',contact_suppressed:false}});
 const delivery=qa('ASK_ONE_QUESTION','TODAY',{sms:{decision_2:'ASK_ONE_QUESTION',draft_status:'delivery_review',latest_inbound:'Receipt uncertain',contact_suppressed:false}});
 const r=projectCommandCenter(work([draft,urgent,delivery]));
 assert.deepEqual(r.inbox.map(x=>x.category),['DELIVERY_REVIEW','NEEDS_PRODUCER_ATTENTION','DRAFT_REVIEW']);
 assert.equal(r.counts.draft_review,1);
 assert.equal(r.counts.delivery_review,1);
 assert.equal(r.counts.needs_attention,1);
 assert.ok(r.inbox.every(x=>x.sms_send_eligible===false&&x.can_bulk_approve===false&&x.send_authority==='NOT_EVALUATED'));
});
test('a stored deadline remains unverified and never becomes a confirmed renewal',()=>{
 const a=qa('CALL_CUSTOMER','NOW',{deadline:'2026-11-15'});
 const result=projectCommandCenter(work([a]));
 assert.deepEqual(result.today[0].timing_hint,{raw:'2026-11-15',verification:'UNVERIFIED_OPPORTUNITY_DEADLINE'});
});
test('inbox does not infer reply-needed from generic old SMS or unlinked first-party records',()=>{
 const old=qa('CONNECT_OR_BOOK','NORMAL',{attention:{band:'NORMAL',actionable:false,reasons:[{text:'Review current evidence',source_ref:{kind:'opportunity'}}]},sms:{decision_2:'CALL',draft_status:'none',latest_inbound:'Old reply'}});
 const web=qa('CONNECT_OR_BOOK','NOW',{population:'WEB_DIRECT'});
 const r=projectCommandCenter(work([old,web]));
 assert.equal(r.inbox.length,0);
});
test('disabled Attention and missing evidence expose no fake priorities',()=>{
 assert.equal(projectCommandCenter({attention_enabled:false,records:[qa('CALL_CUSTOMER')]}).enabled,false);
 assert.equal(projectCommandCenter({attention_enabled:true,records:null}).counts.today,0);
});
test('result sizes capped to 40 but counters cover the complete evaluated Work inventory',()=>{
 const rows=Array.from({length:68},(_,i)=>qa('CALL_CUSTOMER','NOW',{id:'id-'+i}));
 const r=projectCommandCenter(work(rows),{maxRows:10000});
 assert.equal(r.today.length,40);
 assert.equal(r.counts.today,68);
 assert.equal(r.coverage.scanned_work_records,68);
});
