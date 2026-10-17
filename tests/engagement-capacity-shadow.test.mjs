import test from 'node:test';
import assert from 'node:assert/strict';
import {createCapacitySimulation,communicationWindow} from '../server/engagement-capacity-shadow.mjs';
import {capacityConfig,capacityRecord,capacityCohort,importEvent,updateEvent,fact,CAPACITY_START,DAY,MINUTE} from './helpers/engagement-capacity-fixture.mjs';
const T=Date.parse(CAPACITY_START);
const setup=(records,config={})=>{const sim=createCapacitySimulation(capacityConfig(config));sim.submit(importEvent(records));return sim};
const records=s=>new Map(s.snapshot().records),works=s=>new Map(s.snapshot().work),slots=s=>s.snapshot().slots;
const safe=s=>{const r=s.report();
 const windows=new Map();for(const slot of slots(s)){const list=windows.get(slot.sender)||[];while(list.length&&list[0]<=slot.at-MINUTE)list.shift();list.push(slot.at);windows.set(slot.sender,list);assert.ok(list.length<=slot.rate-slot.manualReserve-(slot.priority===0?0:slot.activeReserve),'rolling shared budget');}
assert.equal(r.counts.capacity_violations,0);for(const k of ['external_actions','messages_sent','provider_calls','calendar_actions','model_calls'])assert.equal(r[k],0);assert.ok(Object.values(r.execution_eligibility).every(x=>x===false));assert.equal(new Set(slots(s).map(x=>x.id)).size,slots(s).length)};
const noFollowup=(id,extra={})=>capacityRecord(id,{followupDelaysMs:[],...extra});

test('capacity: mixed 1000 separates import, source, eligibility, evaluated and slot stages',()=>{
 const rs=capacityCohort(1000);rs[0].source.internal_insurance_use=false;
 const s=setup([...rs,rs[1]]);s.advance(T+7*DAY);const r=s.report();
 assert.equal(r.funnel.IMPORTED,1001);assert.equal(r.funnel.DEDUPLICATED,1000);assert.equal(r.funnel.SOURCE_VALID,999);
 assert.ok(r.funnel.CHANNEL_ELIGIBLE<999);assert.ok(r.holds.PURCHASED_OR_UNKNOWN_SOURCE>0);
 const map=new Map(rs.map(x=>[x.id,x]));assert.ok(slots(s).every(x=>map.get(x.prospect).context.contact.acquisition_type==='first_party'));safe(s);
});
test('capacity: 5000 bounded records and deterministic complete rerun',()=>{
 const run=()=>{const s=setup(capacityCohort(5000));s.advance(T+7*DAY);safe(s);return s.report()};
 const a=run(),b=run();assert.deepEqual(a,b);assert.ok(a.counts.operations<1500000);assert.ok(a.counts.queued<=15000);
});
test('capacity: daily cohorts accumulate new and followup demand over 7 days',()=>{
 const s=createCapacitySimulation(capacityConfig());for(let d=0;d<5;d++)s.submit(importEvent(capacityCohort(1000,{prefix:'day'+d}),T+d*DAY,'import'+d));
 s.advance(T+7*DAY);const r=s.report();assert.equal(r.counts.imported,5000);assert.ok(Object.values(r.daily).some(d=>d.new_work>0&&d.followup_work>0));safe(s);
});
test('capacity: one sender across families reserves manual and active headroom',()=>{
 const rs=Array.from({length:100},(_,i)=>noFollowup('p'+i,{family:i%2?'renewal':'first_party'}));const s=setup(rs,{rate:10});s.advance(T+10*MINUTE);
 const grouped=Object.groupBy(slots(s),x=>x.at);assert.ok(Object.values(grouped).every(a=>a.length<=6));assert.equal(new Set(slots(s).map(x=>x.family)).size,2);safe(s);
});
test('capacity: competing worker claims cannot reuse item or rolling budget, including restart',()=>{
 const cfg=capacityConfig({rate:10});let s=setup(capacityCohort(100,{mixed:false}),{rate:10});
 const claims=Array.from({length:20},(_,i)=>s.claim('worker'+i)).filter(x=>x&&!x.deferred);
 assert.equal(claims.length,6);assert.equal(new Set(claims.map(x=>x.id)).size,6);
 s=createCapacitySimulation(cfg,JSON.parse(JSON.stringify(s.snapshot())));assert.ok(s.claim('restarted')?.deferred);s.advance(T+MINUTE);safe(s);
});
test('capacity: urgency arriving behind thousands wins next available slot',()=>{
 const s=setup(capacityCohort(5000,{mixed:false}),{rate:10});s.submit(importEvent([noFollowup('urgent',{active:true})],T+MINUTE,'urgent'));s.advance(T+2*MINUTE);
 assert.equal(slots(s).filter(x=>x.at===T+MINUTE)[0].prospect,'urgent');safe(s);
});
test('capacity: reply invalidates old work and selects existing vertical journey for TEXT',()=>{
 for(const [line,intent] of [['BUYER','buyer'],['HOME','home_review'],['AUTO','auto'],['LIFE','life']]){
  const r=noFollowup('reply',{line});const s=setup([r],{rate:1,manualReserve:1});s.advance(T+MINUTE);
  const profile={...r.profile,projection_version:'v2',facts:{preferred_channel:fact('TEXT')}};
  s.submit(updateEvent(r,1,T+MINUTE,{reply:'TEXT',line,profile}));s.advance(T+2*MINUTE);
  const state=[...records(s).values()][0];assert.equal(state.journey.intent,intent);assert.equal(state.lastDecision.proposal.strategy,'QUESTION_FIRST');assert.ok(s.report().counts.canceled>=1);safe(s);
 }
});
test('capacity: confirmed future callback waits then hands off without another appointment question',()=>{
 const r=noFollowup('callback');r.context.commitments=[{confirmed:true,status:'open',at:new Date(T+DAY).toISOString(),evidence_ref:'confirmed-synthetic'}];
 const s=setup([r]);s.advance(T+DAY+MINUTE);assert.equal(slots(s).length,0);assert.equal(s.snapshot().producer[0][1].action,'CALL');assert.equal(s.report().counts.evaluated,2);safe(s);
});
test('capacity: CALL/QUOTE replace qualification, while urgent closing preserves C1 action',()=>{
 const rs=['explicit_call_request','explicit_quote_request','closing_date'].map((f,i)=>noFollowup('p'+i,{profile:{projection_version:'v1',identity_status:'LINKED',facts:{[f]:fact(i===2?'2026-10-25':true)}}}));
 const s=setup(rs);s.advance(T+MINUTE);assert.equal(slots(s).length,0);assert.equal(s.snapshot().producer.length,3);assert.equal([...records(s).values()][2].lastDecision.plan.action,'ASK ONE QUESTION');safe(s);
});
test('capacity: STOP at exact transmission clock wins before every worker claim',()=>{
 const r=noFollowup('stop');const s=setup([r]);s.submit(updateEvent(r,1,T,{stop:true}));assert.equal(s.claim('worker'),null);assert.equal(slots(s).length,0);safe(s);
});
test('capacity: AgencyZoom, unknown and duplicate owners never gain slots',()=>{
 const rs=['AGENCYZOOM','UNKNOWN','DUPLICATE'].map((o,i)=>{const r=noFollowup('p'+i);if(o==='DUPLICATE')r.owners=['COVERAGEFIT_APPROVED','AGENCYZOOM'];else{r.context.workflowOwner=o;r.owners=[o]}return r});
 const s=setup(rs);s.advance(T+DAY);assert.equal(slots(s).length,0);assert.equal(s.report().holds.OWNERSHIP,3);safe(s);
});
test('capacity: failed, unknown, out-of-order and conflicting receipts hold until reconciliation',()=>{
 const r=capacityRecord('receipt');const s=setup([r]);s.advance(T+MINUTE);const id=slots(s)[0].id;
 s.submit({id:'unknown',type:'receipt',at:T+MINUTE,workId:id,sequence:2,outcome:'unknown'});
 s.submit({id:'old',type:'receipt',at:T+MINUTE,workId:id,sequence:1,outcome:'delivered'});
 s.submit({id:'conflict',type:'receipt',at:T+MINUTE,workId:id,sequence:3,outcome:'delivered'});
 s.advance(T+3*DAY);assert.equal(slots(s).length,1);assert.equal(s.report().holds.OUT_OF_ORDER_RECEIPT,1);assert.equal(s.report().holds.RECEIPT_RECONCILIATION,1);assert.equal([...records(s).values()][0].deliveryHold,'CONFLICT');safe(s);
});
test('capacity: systemic failures trip sender circuit for new work',()=>{
 const s=setup([0,1,2].map(i=>noFollowup('p'+i)));s.advance(T+MINUTE);
 slots(s).forEach((w,i)=>s.submit({id:'fail'+i,type:'receipt',at:T+MINUTE,workId:w.id,sequence:1,outcome:'failed'}));
 s.submit(importEvent([noFollowup('later')],T+MINUTE,'later'));s.advance(T+2*MINUTE);assert.equal(slots(s).length,3);assert.equal(s.report().holds.CIRCUIT_OPEN,1);safe(s);
});
test('capacity: reductions and outage share prior rolling usage, recovery stays bounded',()=>{
 const s=setup(capacityCohort(100,{mixed:false}));s.submit({id:'outage',type:'capacity',at:T+30000,sender:'synthetic-sender',rate:0,externalKnown:true});
 s.submit({id:'recovery',type:'capacity',at:T+3*MINUTE,sender:'synthetic-sender',rate:10,externalKnown:true});s.advance(T+5*MINUTE);
 assert.equal(slots(s).filter(x=>x.at>T&&x.at<T+3*MINUTE).length,0);assert.ok(slots(s).filter(x=>x.at===T+3*MINUTE).length<=6);safe(s);
});
test('capacity: 30 callback preferences do not fabricate availability, bookings or conversations',()=>{
 const rs=Array.from({length:30},(_,i)=>noFollowup('p'+i,{profile:{projection_version:'v1',identity_status:'LINKED',facts:{explicit_call_request:fact(true)}},preferredAt:new Date(T+2*MINUTE).toISOString()}));
 const s=setup(rs,{producerDailyCapacity:5});s.advance(T+MINUTE);const p=s.report().producer_statuses;
 assert.equal(p.OFFERED,5);assert.equal(p.CAPACITY_EXCEPTION,25);assert.equal(p.CONFIRMED,undefined);assert.equal(p.COMPLETED,undefined);assert.equal(slots(s).length,0);safe(s);
});
test('capacity: explicit offered booking evidence is distinct from completed/missed state',()=>{
 const r=noFollowup('booking',{profile:{projection_version:'v1',identity_status:'LINKED',facts:{explicit_call_request:fact(true)}}});const s=setup([r]);s.advance(T+MINUTE);
 s.submit(updateEvent(r,1,T+MINUTE,{producerStatus:'CONFIRMED',atForBooking:T,evidenceRef:'synthetic-booking'}));s.advance(T+2*MINUTE);
 assert.equal(s.report().producer_statuses.CONFIRMED,1);assert.equal(s.report().producer_statuses.COMPLETED,undefined);
 s.submit(updateEvent(r,2,T+2*MINUTE,{producerStatus:'MISSED',evidenceRef:'synthetic-missed'}));s.advance(T+3*MINUTE);assert.equal(s.report().producer_statuses.MISSED,1);safe(s);
});
test('capacity: expiration and retained-source deadline do not silently become late transmissions',()=>{
 const rs=capacityCohort(100,{mixed:false}).map(r=>({...r,relevantUntil:new Date(T+MINUTE).toISOString(),followupDelaysMs:[]}));
 const s=setup(rs,{rate:10});s.advance(T+3*MINUTE);assert.equal(slots(s).length,6);assert.equal(s.report().counts.expired,94);safe(s);
});
test('capacity: verified shared relationship across lines shares recipient frequency, not phone-based identity',()=>{
 const s=setup([noFollowup('home',{relationship:'verified-rel',line:'HOME'}),noFollowup('auto',{relationship:'verified-rel',line:'AUTO'})]);s.advance(T+2*MINUTE);assert.equal(slots(s).length,1);safe(s);
});
test('capacity: local holidays, quiet hours, DST spring/fall and invalid timezones',()=>{
 const w={zone:'America/Los_Angeles',weekdays:['Sun','Mon'],holidays:[],startHour:9,endHour:17};
 assert.equal(communicationWindow(Date.parse('2026-03-08T15:59:00Z'),w),false);assert.equal(communicationWindow(Date.parse('2026-03-08T16:00:00Z'),w),true);
 assert.equal(communicationWindow(Date.parse('2026-11-01T16:59:00Z'),w),false);assert.equal(communicationWindow(Date.parse('2026-11-01T17:00:00Z'),w),true);
 assert.equal(communicationWindow(T,{...w,holidays:['2026-10-19']}),false);assert.throws(()=>communicationWindow(T,{...w,zone:'invalid'}));
});
test('capacity: JSON restart replay matches uninterrupted results and duplicate imports remain inert',()=>{
 const cfg=capacityConfig(),s=setup(capacityCohort(100));s.advance(T+MINUTE);const saved=JSON.parse(JSON.stringify(s.snapshot()));
 const resumed=createCapacitySimulation(cfg,saved);assert.equal(resumed.submit(importEvent(capacityCohort(100),T+MINUTE)),false);
 resumed.advance(T+7*DAY);s.advance(T+7*DAY);const a=resumed.report(),b=s.report();assert.equal(a.counts.duplicate_prevented,b.counts.duplicate_prevented+1);a.counts.duplicate_prevented--;assert.deepEqual(a,b);assert.deepEqual(slots(resumed),slots(s));safe(resumed);
});
test('capacity: STOP CONTROL wrong number takeover identity and consent are higher than urgency',()=>{
 const rs=Array.from({length:6},(_,i)=>noFollowup('p'+i,{active:true}));rs[0].context.contact.suppressed=true;rs[1].context.population='CONTROL';rs[2].context.contact.wrong_number=true;rs[3].context.producerTakeover=true;rs[4].profile.identity_status='HOLD';rs[5].context.contact.sms_permission=false;
 const s=setup(rs);s.advance(T+MINUTE);assert.equal(slots(s).length,0);safe(s);
});
test('capacity: takeover and changed closing/context revision cancel queued work; old timers fenced',()=>{
 const r=capacityRecord('change');const s=setup([r],{rate:1,manualReserve:1});s.advance(T+MINUTE);
 s.submit(updateEvent(r,2,T+MINUTE,{takeover:true}));s.submit(updateEvent(r,1,T+MINUTE,{profile:{...r.profile,facts:{closing_date:fact('2026-10-20')}}}));s.advance(T+DAY);assert.equal(slots(s).length,0);assert.equal(s.report().counts.canceled,1);assert.equal(s.report().counts.stale,1);safe(s);
});
test('capacity: unknown manual use and absent invitation permission fail closed',()=>{
 const s=setup([noFollowup('p')],{externalCapacityKnown:false});s.advance(T+MINUTE);assert.equal(s.report().holds.UNKNOWN_EXTERNAL_CAPACITY,1);
 const t=setup([noFollowup('p',{syntheticInvitationApproved:false})]);t.advance(T+MINUTE);assert.equal(t.report().holds.INVITATION_NOT_APPROVED,1);safe(s);safe(t);
});
test('capacity: three clocks differ and known fact question is not repeated',()=>{
 const r=noFollowup('clocks',{profile:{projection_version:'v1',identity_status:'LINKED',facts:{preferred_channel:fact('TEXT'),renewal_date:fact('2026-10-25')}}});const s=setup([r],{rate:4});s.advance(T+MINUTE);
 s.submit({id:'capacity',type:'capacity',at:T+MINUTE,sender:r.sender,rate:10,externalKnown:true});s.advance(T+2*MINUTE);
 const w=[...works(s).values()][0];assert.equal(w.question,'vehicle_count');assert.equal(w.decisionAt,T);assert.equal(w.transmissionAt,T+MINUTE);safe(s);
});
test('capacity: no network or random/model/provider operations in deterministic simulation',()=>{
 const old=globalThis.fetch;let calls=0;globalThis.fetch=()=>{calls++;throw Error('forbidden_network')};try{const s=setup(capacityCohort(100));s.advance(T+7*DAY);safe(s);assert.equal(calls,0)}finally{globalThis.fetch=old}
});

test('capacity: same-time STOP before import ordering cannot lose suppression',()=>{
 const r=noFollowup('late-import'),s=createCapacitySimulation(capacityConfig());s.submit(updateEvent(r,1,T,{stop:true}));s.submit(importEvent([r]));s.advance(T+MINUTE);assert.equal(slots(s).length,0);safe(s);
});
test('capacity: available routine work progresses under ongoing urgent arrivals',()=>{
 const rs=Array.from({length:20},(_,i)=>noFollowup('routine'+i,{older:true}));const s=setup(rs,{rate:10});
 for(let m=1;m<20;m++)s.submit(importEvent(Array.from({length:6},(_,i)=>noFollowup(`urgent${m}-${i}`,{active:true})),T+m*MINUTE,'urgent'+m));
 s.advance(T+30*MINUTE);assert.equal(slots(s).filter(x=>x.prospect.startsWith('routine')).length,20);safe(s);
});
test('capacity: material renewal update fences old slot and future timer is evaluation only',()=>{
 const r=noFollowup('renewal'),s=setup([r],{rate:1,manualReserve:1});s.advance(T+MINUTE);
 s.submit(updateEvent(r,1,T+MINUTE,{profile:{...r.profile,projection_version:'v2',facts:{renewal_date:fact('2027-01-01')}}}));s.advance(T+DAY);
 assert.equal(slots(s).length,0);assert.equal([...records(s).values()][0].lastDecision.plan.action,'LATER');assert.equal(s.report().counts.canceled,1);safe(s);
});
test('capacity: canonical evidence freshness boundary requires new projection, never invented current facts',()=>{
 const r=noFollowup('expiry');r.profile.next_change_at=new Date(T+MINUTE).toISOString();const s=setup([r],{rate:4});s.advance(T+MINUTE);
 s.submit({id:'capacity',type:'capacity',at:T+MINUTE,sender:r.sender,rate:10,externalKnown:true});s.advance(T+2*MINUTE);assert.equal(slots(s).length,0);assert.equal(s.report().holds.PROFILE_REFRESH_REQUIRED,1);safe(s);
});
test('capacity: producer offers are distinct available slots, no double booking or fake confirmation',()=>{
 const rs=Array.from({length:30},(_,i)=>noFollowup('p'+i,{profile:{projection_version:'v1',identity_status:'LINKED',facts:{explicit_call_request:fact(true)}}}));const s=setup(rs);s.advance(T+MINUTE);
 const offers=s.snapshot().producer.map(x=>x[1]).filter(x=>x.offeredAt);assert.equal(offers.length,8);assert.equal(new Set(offers.map(x=>x.offeredAt)).size,8);
 const p=rs[29];s.submit(updateEvent(p,1,T+MINUTE,{producerStatus:'CONFIRMED',atForBooking:T,evidenceRef:'fictional'}));s.advance(T+2*MINUTE);assert.equal(s.report().producer_statuses.CONFIRMED,undefined);assert.equal(s.report().holds.UNAVAILABLE_BOOKING,1);safe(s);
});
test('capacity: 30-day horizon and bounds remain explicit, unknown records cannot acquire work',()=>{
 const s=setup(capacityCohort(100),{days:30});s.submit({id:'unknown',type:'update',at:T,workspace:'other',prospect:'unknown',sequence:1,stop:true});s.advance(T+30*DAY);assert.equal(s.report().holds.UNKNOWN_RECORD,1);safe(s);
 assert.throws(()=>createCapacitySimulation(capacityConfig({days:31})),/invalid_bound/);
 assert.throws(()=>createCapacitySimulation(capacityConfig({rate:41})),/invalid_bound/);
});

test('capacity: persisted E2 evidence and fenced C2 result feed existing C1 without alternate fact state',async()=>{
 const {fixture,event,configure,batch,result,W,P,NOW}=await import('./helpers/evaluation-queue-fixture.mjs');
 const f=fixture();try{
  const r=noFollowup(P);r.workspace=W;
  configure(f,{population:'WEB_DIRECT',workflowOwner:'COVERAGEFIT_APPROVED',contact:r.context.contact});
  f.queue.memory.admit(event('carrier'),{now:NOW});batch(f.queue,NOW);
  r.profile=f.queue.memory.project(W,P,{now:CAPACITY_START});const s=setup([r],{rate:4});s.advance(T+MINUTE);
  const now=new Date(T+MINUTE).toISOString();f.queue.memory.admit(event('request',[{field:'explicit_call_request',value:true}],{observed_at:now}),{now});batch(f.queue,now);
  const committed=result(f.db),profile=f.queue.memory.project(W,P,{now});assert.equal(committed.action,'CALL');
  s.submit(updateEvent(r,1,T+MINUTE,{profile,reply:'CALL'}));const changes=f.db.prepare('SELECT total_changes() n').get().n;s.advance(T+2*MINUTE);
  assert.equal(f.db.prepare('SELECT total_changes() n').get().n,changes);assert.equal(slots(s).length,0);
  const decision=[...records(s).values()][0].lastDecision.plan;assert.equal(decision.action,committed.action);assert.deepEqual(decision.evidence_refs,committed.evidence_refs);assert.equal(s.snapshot().producer.length,1);safe(s);
 }finally{f.cleanup()}
});

test('capacity: revised evidence cannot retain obsolete producer request as current',()=>{
 const r=noFollowup('producer-revision',{profile:{projection_version:'v1',identity_status:'LINKED',facts:{explicit_call_request:fact(true)}}}),s=setup([r]);s.advance(T+MINUTE);
 s.submit(updateEvent(r,1,T+MINUTE,{profile:{...r.profile,projection_version:'v2',facts:{}},context:{...r.context,producerTakeover:true}}));s.advance(T+2*MINUTE);
 assert.equal(s.report().producer_statuses.INVALIDATED,1);assert.equal(s.report().producer_due,0);assert.equal(slots(s).length,0);safe(s);
});

test('capacity: restart between work admission and producer allocation retains pending handoff',()=>{
 const cfg=capacityConfig(),r=noFollowup('producer-restart',{profile:{projection_version:'v1',identity_status:'LINKED',facts:{explicit_call_request:fact(true)}}}),s=setup([r]);
 assert.equal(s.claim('worker'),null);const resumed=createCapacitySimulation(cfg,JSON.parse(JSON.stringify(s.snapshot())));s.advance(T+MINUTE);resumed.advance(T+MINUTE);assert.deepEqual(resumed.report(),s.report());assert.equal(resumed.report().producer_statuses.OFFERED,1);safe(resumed);
});
