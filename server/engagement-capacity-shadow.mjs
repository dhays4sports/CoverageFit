// Synthetic, in-process experiment only. Never imported by routes or the outbound gateway.
import {planSignal,proposeSignalEngagement} from './signal-dynamic-planner.mjs';
import {normalizeSmsIntent,routeSmsInbound} from './sms-conversation-core.mjs';
import {smsPermissionSnapshot} from './sms-consent-core.mjs';
export const CAPACITY_BUILD='CF-ENGAGEMENT-CAPACITY-SHADOW-0.2';
const MIN=60000,DAY=86400000;
const clone=x=>structuredClone(x);
const clock=x=>{const n=typeof x==='number'?x:Date.parse(x);if(!Number.isFinite(n))throw Error('invalid_clock');return n};
const iso=x=>new Date(x).toISOString();
const key=r=>JSON.stringify([r.workspace,r.id]);
const bounded=(n,a,b)=>{if(!Number.isInteger(n)||n<a||n>b)throw Error('invalid_bound');return n};
const noExecution=()=>({sms:false,call:false,external:false,calendar:false,crm:false,model:false});
// Binary heaps keep event admission/selection O(log n), not a population scan per slot.
class Heap{
 constructor(compare,items=[]){this.compare=compare;this.items=[];for(const x of items)this.push(x)}
 get length(){return this.items.length} peek(){return this.items[0]}
 push(x){const a=this.items;let i=a.length;a.push(x);while(i){const p=(i-1)>>1;if(this.compare(a[p],x)<=0)break;a[i]=a[p];i=p}a[i]=x}
 pop(){const a=this.items;if(!a.length)return;const top=a[0],x=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let j=i*2+1;if(j+1<a.length&&this.compare(a[j+1],a[j])<0)j++;if(this.compare(x,a[j])<=0)break;a[i]=a[j];i=j}a[i]=x}return top}
}
const eventOrder=(a,b)=>a.at-b.at||a.order-b.order||a.seq-b.seq;
const workOrder=(a,b)=>a.deadline-b.deadline||a.created-b.created||a.id.localeCompare(b.id);
const formatters=new Map();
export function communicationWindow(at,window){
 if(!window||!window.zone||!Array.isArray(window.weekdays)||!Array.isArray(window.holidays))throw Error('explicit_window_required');
 bounded(window.startHour,0,23);bounded(window.endHour,1,24);if(window.endHour<=window.startHour)throw Error('invalid_window');
 let fmt=formatters.get(window.zone);if(!fmt){fmt=new Intl.DateTimeFormat('en-US',{timeZone:window.zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23',weekday:'short'});formatters.set(window.zone,fmt)}
 const p=Object.fromEntries(fmt.formatToParts(at).map(x=>[x.type,x.value]));
 return window.weekdays.includes(p.weekday)&&!window.holidays.includes(`${p.year}-${p.month}-${p.day}`)&&Number(p.hour)>=window.startHour&&Number(p.hour)<window.endHour;
}
function safety(r,now){
 if(r.profile.next_change_at&&clock(r.profile.next_change_at)<=now)return 'PROFILE_REFRESH_REQUIRED';
 if(r.profile.identity_status!=='LINKED'||r.profile.material_conflicts)return 'IDENTITY_OR_CONFLICT';
 if(r.context.contact?.suppressed||r.context.contact?.wrong_number||!smsPermissionSnapshot(r.conversation||{},{occurredAt:iso(now)}).allowed)return 'SUPPRESSED';
 if(['CONTROL','DISTRICT_CONTROL','TEST'].includes(r.context.population))return 'CONTROL_OR_TEST';
 if(r.context.producerTakeover)return 'PRODUCER_TAKEOVER';
 if(r.source?.internal_insurance_use!==true||clock(r.source.retain_until)<=now)return 'SOURCE_RIGHTS';
 if(r.context.contact?.acquisition_type!=='first_party')return 'PURCHASED_OR_UNKNOWN_SOURCE';
 if(r.context.contact?.sms_permission!==true||r.context.contact?.verified_first_party_inquiry!==true)return 'PERMISSION';
 if(r.context.workflowOwner!=='COVERAGEFIT_APPROVED'||r.owners?.length!==1||r.owners[0]!=='COVERAGEFIT_APPROVED')return 'OWNERSHIP';
 if(r.deliveryHold)return 'DELIVERY_'+r.deliveryHold;
 if(r.hypotheticalSenderApproved!==true)return 'SENDER_PERMISSION';
 return null;
}
/** Serializable bounded simulation. A claim is an atomic JS transition on ONE simulator;
 * this tests interleaving/CAS semantics, not independent distributed process locking. */
export function createCapacitySimulation(config,snapshot){
 const cfg=clone(config);const start=clock(cfg.start);bounded(cfg.days,7,30);
 const end=start+cfg.days*DAY;
 bounded(cfg.rate,1,40);bounded(cfg.manualReserve??2,0,40);bounded(cfg.activeReserve??2,0,40);
 bounded(cfg.producerDailyCapacity??8,0,1000);
 const s=snapshot?clone(snapshot):{build:CAPACITY_BUILD,config:cfg,now:start,seq:0,records:[],events:[],ready:[[],[],[],[],[]],slots:[],work:[],seen:[],receipts:[],producer:[],daily:{},sender:{},lastRecipient:[],counts:{imported:0,unique:0,source_valid:0,channel_eligible:0,evaluated:0,queued:0,duplicate_prevented:0,stale:0,canceled:0,expired:0,capacity_violations:0,operations:0},holds:{},strategies:{}};
 if(s.build!==CAPACITY_BUILD||JSON.stringify(s.config)!==JSON.stringify(cfg))throw Error('snapshot_config_mismatch');
 const records=new Map(s.records),seen=new Set(s.seen),work=new Map(s.work),receipts=new Map(s.receipts),lastRecipient=new Map(s.lastRecipient),producer=new Map(s.producer);
 const events=new Heap(eventOrder,s.events),ready=s.ready.map(a=>new Heap(workOrder,a.map(w=>work.get(w.id))));
 const windowCache=new Map(s.windowCache||[]);
 const producerPending=new Set(s.producerPending||[]);const producerUsed=new Set();
 if(!Array.isArray(cfg.producerSlots)||cfg.producerSlots.length>30000||new Set(cfg.producerSlots).size!==cfg.producerSlots.length)throw Error('explicit_producer_availability_required');
 const availability=cfg.producerSlots.map(clock).sort((a,b)=>a-b);
 for(const p of producer.values())if(p.offeredAt)producerUsed.add(p.offeredAt);
 const inc=(obj,k,n=1)=>obj[k]=(obj[k]||0)+n;
 const day=()=>{const d=iso(s.now).slice(0,10);return s.daily[d]??=( {new_work:0,followup_work:0,evaluations:0,slots:0,backlog:0,capacity_available:0,capacity_deferrals:0})};
 const schedule=(type,at,payload,order=1)=>{if(events.length>=300000)throw Error('event_budget');events.push({type,at:clock(at),payload,order,seq:++s.seq});s.counts.peak_events=Math.max(s.counts.peak_events||0,events.length)};
 function submit(event){if(!event.id||clock(event.at)<s.now||clock(event.at)>=end)throw Error('invalid_event');if(seen.has(event.id)){inc(s.counts,'duplicate_prevented');return false}seen.add(event.id);schedule(event.type,event.at,clone(event),event.type==='import'?-2:0);return true}
 const cancel=r=>{if(r.workId){const w=work.get(r.workId);if(w?.state==='QUEUED'){w.state='CANCELED';inc(s.counts,'backlog',-1);inc(s.counts,'canceled')}}r.workId=null;r.generation++};
 function evaluate(r,reason='new'){
  if(r.source?.internal_insurance_use!==true||clock(r.source.retain_until)<=s.now){inc(s.holds,'SOURCE_RIGHTS');return}
  inc(s.counts,'evaluated');inc(day(),'evaluations');
  if(!r.evaluated){r.evaluated=true;inc(s.counts,'evaluated_unique');if(!safety(r,s.now))inc(s.counts,'eligible_evaluated_unique')}
  if(r.profile.next_change_at&&clock(r.profile.next_change_at)<=s.now){inc(s.holds,'PROFILE_REFRESH_REQUIRED');return}
  // Current profile is provided by the canonical evidence contract. No parallel fact reconciler.
  const profile={...r.profile,as_of:iso(s.now)};
  const plan=planSignal(profile,{...r.context,now:profile.as_of});
  const proposal=proposeSignalEngagement(plan,{profile,contact:r.context.contact,now:profile.as_of});
  r.lastDecision={plan,proposal,revision:r.revision,at:iso(s.now)};inc(s.strategies,proposal.strategy);
  if(plan.held||plan.action==='STOP'){inc(s.holds,plan.reason_category);return}
  if(proposal.producer_handoff){
   const pkey=key(r),stored=producer.get(pkey),prior=stored?.status==='INVALIDATED'?null:stored;
   producer.set(pkey,{...prior,key:pkey,id:r.id,workspace:r.workspace,revision:r.revision,action:plan.action,reason:plan.reason_category,
    priority:plan.reason_category==='COMMITMENT_DUE'||proposal.strategy==='COMMITMENT_FIRST'?0:1,
    requestedAt:prior?.requestedAt??s.now,preferredAt:r.preferredAt||null,confirmedAt:r.confirmedAt||null,
    status:prior?.status||'REQUESTED',offeredAt:prior?.offeredAt||null,execution_eligibility:noExecution()});
   producerPending.add(pkey);inc(s.counts,'avoided_qualification');return;
  }
  if(plan.action==='LATER'){
   if(plan.next_evaluation_at&&clock(plan.next_evaluation_at)>s.now&&clock(plan.next_evaluation_at)<end)schedule('evaluate',plan.next_evaluation_at,{key:key(r),revision:r.revision,reason:'timer'});
   return;
  }
  const hold=safety(r,s.now);if(hold){inc(s.holds,hold);return}
  if(!['CHOICE_FIRST','QUESTION_FIRST'].includes(proposal.strategy)){inc(s.holds,'NO_COMMUNICATION_PROPOSAL');return}
  // Each hypothetical invitation needs explicit synthetic approval; advisory != authorization.
  if(r.syntheticInvitationApproved!==true){inc(s.holds,'INVITATION_NOT_APPROVED');return}
  if(r.workId&&work.get(r.workId)?.state==='QUEUED'){inc(s.counts,'duplicate_prevented');return}
  const deadline=Math.min(clock(r.source.retain_until),r.relevantUntil?clock(r.relevantUntil):s.now+DAY);
  if(deadline<=s.now){inc(s.counts,'expired');return}
  const id=key(r)+':'+r.revision+':'+r.generation+':'+reason;
  if(work.has(id)){inc(s.counts,'duplicate_prevented');return}
  const priority=r.active?0:r.highIntent?1:r.quoteFollowup?2:r.older?4:3;
  const w={id,key:key(r),sender:r.sender,revision:r.revision,generation:r.generation,priority,created:s.now,decisionAt:s.now,deadline,state:'QUEUED',family:r.family,
   question:proposal.strategy==='QUESTION_FIRST'?plan.question_field:null,profile_version:profile.projection_version,evidence_refs:plan.evidence_refs,
   communicationEligibleAt:null,transmissionAt:null,execution_eligibility:noExecution()};
  if(work.size>=200000)throw Error('work_history_budget');
  work.set(id,w);inc(s.counts,'backlog');s.counts.peak_backlog=Math.max(s.counts.peak_backlog||0,s.counts.backlog);r.workId=id;ready[priority].push(w);inc(s.counts,'queued');inc(day(),reason==='new'?'new_work':'followup_work');
 }
 function handle(e){
  const x=e.payload;
  if(e.type==='import'){
   if(!Array.isArray(x.records)||x.records.length>5000)throw Error('bounded_import_required');
   for(const raw of x.records){inc(s.counts,'imported');if(raw.synthetic!==true||!raw.id||!raw.workspace||!raw.sender)throw Error('synthetic_identity_required');
    const k=key(raw);if(records.has(k)){inc(s.counts,'duplicate_prevented');continue}if(records.size>=50000)throw Error('record_budget');
    if(!Array.isArray(raw.followupDelaysMs)||raw.followupDelaysMs.length>30||raw.followupDelaysMs.some(n=>!Number.isSafeInteger(n)||n<MIN))throw Error('bounded_followup_policy_required');
    const r={...clone(raw),revision:1,generation:1,eventSequence:0,workId:null};records.set(k,r);inc(s.counts,'unique');
    if(r.source?.internal_insurance_use===true&&clock(r.source.retain_until)>s.now)inc(s.counts,'source_valid');
    if(!safety(r,s.now))inc(s.counts,'channel_eligible');
    evaluate(r);
   }return;
  }
  if(e.type==='capacity'){
   bounded(x.rate,0,40);const b=sender(x.sender);b.rate=x.rate;b.externalKnown=x.externalKnown===true;
   if(x.resetCircuit===true){b.failures=0;b.circuit=false}return;
  }
  if(e.type==='receipt'){
   const w=work.get(x.workId);if(!w||w.state!=='ASSIGNED'){inc(s.holds,'UNMATCHED_RECEIPT');return}
   const old=receipts.get(x.workId);if(!Number.isInteger(x.sequence)||x.sequence<1||old&&x.sequence<=old.sequence){inc(s.holds,'OUT_OF_ORDER_RECEIPT');return}
   if(!['delivered','failed','unknown'].includes(x.outcome))throw Error('invalid_receipt');
   const r=records.get(w.key);receipts.set(x.workId,{sequence:x.sequence,outcome:x.outcome});
   // A later delivered receipt cannot clear an earlier ambiguous/failed outcome without explicit reconciliation.
   if(old&&old.outcome!==x.outcome&&x.reconciled!==true){r.deliveryHold='CONFLICT';cancel(r);inc(s.holds,'RECEIPT_RECONCILIATION');return}
   if(x.outcome!=='delivered'){r.deliveryHold=x.outcome.toUpperCase();cancel(r);inc(s.holds,'DELIVERY_'+r.deliveryHold);const b=sender(w.sender);if(++b.failures>=3)b.circuit=true}
   else if(x.reconciled===true){r.deliveryHold=null;cancel(r);evaluate(r,'reconciled')}
   return;
  }
  const r=records.get(x.key||JSON.stringify([x.workspace,x.prospect]));if(!r){inc(s.holds,'UNKNOWN_RECORD');return}
  if(e.type==='evaluate'){if(x.revision!==r.revision){inc(s.counts,'stale');return}evaluate(r,x.reason);return}
  if(e.type==='wake'){const w=work.get(x.workId);if(w?.state==='QUEUED')ready[w.priority].push(w);return}
  if(e.type!=='update')throw Error('unknown_event');
  if(!Number.isInteger(x.sequence)||x.sequence<=r.eventSequence){inc(s.counts,'stale');return}
  r.eventSequence=x.sequence;cancel(r);r.revision++;
  // Updates are synthetic canonical-profile/context replacements, not unverified free-text facts.
  if(x.profile)r.profile=clone(x.profile);
  if(x.context)r.context=clone(x.context);
  if(x.owners)r.owners=clone(x.owners);
  if(x.source)r.source=clone(x.source);
  if(x.relevantUntil)r.relevantUntil=x.relevantUntil;
  if(x.takeover===true)r.context.producerTakeover=true;
  if(x.stop===true)r.context.contact.suppressed=true;
  if(x.reply){
   r.active=true;
   if(x.reply==='TEXT'){
    const intent=normalizeSmsIntent(x.line||r.line);if(!intent){inc(s.holds,'UNKNOWN_VERTICAL');return}
    // Existing pure deterministic journey; generated reply is never sent or scheduled verbatim.
    const journey=routeSmsInbound(r.journey||{state:'new'},x.line||r.line,{mode:'simulator',now:iso(s.now)});
    r.journey={state:journey.state,intent:journey.intent,answers:journey.answers};
   }
  }
  if(x.preferredAt)r.preferredAt=x.preferredAt;
  const prior=producer.get(key(r));
  if(prior&&!x.producerStatus)prior.status='INVALIDATED';
  if(x.producerStatus){
   if(!['CONFIRMED','COMPLETED','MISSED','RESCHEDULED','CANCELED'].includes(x.producerStatus)||!x.evidenceRef)throw Error('producer_evidence_required');
   if(!prior){inc(s.holds,'UNKNOWN_PRODUCER_WORK');return}
   if(x.producerStatus==='CONFIRMED'&&(!prior.offeredAt||clock(x.atForBooking)!==prior.offeredAt)){inc(s.holds,'UNAVAILABLE_BOOKING');return}
   prior.status=x.producerStatus;if(x.producerStatus==='CONFIRMED')prior.confirmedAt=prior.offeredAt;
   prior.evidenceRef=x.evidenceRef;
  }
  if(x.stop||x.takeover){if(prior)prior.status='CANCELED'}
  evaluate(r,'update');
 }
 function sender(id){if(!s.sender[id]){if(Object.keys(s.sender).length>=8)throw Error('sender_budget');s.sender[id]={rate:cfg.rate,externalKnown:cfg.externalCapacityKnown===true,used:[],failures:0,circuit:false}}return s.sender[id]}
 function claim(worker,now=s.now){
  if(now!==s.now||typeof worker!=='string'||!worker)throw Error('invalid_claim_clock');
  while(events.length&&events.peek().at<=s.now){inc(s.counts,'operations');handle(events.pop())}
  // At most 100 stale/ineligible candidates examined per claim. Caller budget bounds total tick work.
  for(let attempts=0;attempts<100;attempts++){
   let band=ready.findIndex(h=>h.length);if(band<0)return null;
   // Every tenth slot gives the oldest waiting lower band an opportunity; urgency retains 90%.
   if(s.slots.length%10===9){for(let i=band+1;i<5;i++)if(ready[i].length&&ready[i].peek().created<ready[band].peek().created)band=i}
   const w=ready[band].pop();inc(s.counts,'operations');if(w.state!=='QUEUED')continue;
   const r=records.get(w.key);if(w.revision!==r.revision||w.generation!==r.generation){w.state='STALE';inc(s.counts,'backlog',-1);inc(s.counts,'stale');continue}
   const hold=safety(r,s.now);if(hold){w.state='HELD';inc(s.counts,'backlog',-1);inc(s.holds,hold);continue}
   if(w.deadline<=s.now){w.state='EXPIRED';inc(s.counts,'backlog',-1);inc(s.counts,'expired');continue}
   // Reevaluate current canonical semantics at the transmission clock (expiry/timer can change action).
   const current=planSignal({...r.profile,as_of:iso(s.now)},{...r.context,now:iso(s.now)});
   if(current.held||current.action!=='ASK ONE QUESTION'){w.state='STALE';inc(s.counts,'backlog',-1);inc(s.counts,'stale');evaluate(r,'clock');continue}
   const recipient=JSON.stringify([r.workspace,r.relationship||r.id]);
   const eligible=communicationWindow(s.now,r.window)&&(!lastRecipient.has(recipient)||s.now-lastRecipient.get(recipient)>=(cfg.recipientGapMs??DAY));
   if(eligible&&w.communicationEligibleAt===null)w.communicationEligibleAt=s.now;
   const b=sender(w.sender);b.used=b.used.filter(t=>t>s.now-MIN);
   const available=Math.max(0,b.rate-(cfg.manualReserve??2)-(w.priority===0?0:(cfg.activeReserve??2)));
   if(!b.externalKnown||b.circuit){w.state='HELD';inc(s.counts,'backlog',-1);inc(s.holds,!b.externalKnown?'UNKNOWN_EXTERNAL_CAPACITY':'CIRCUIT_OPEN');continue}
   if(!eligible||b.used.length>=available){
    if(eligible)inc(day(),'capacity_deferrals');
    let wake=s.now+MIN;
    if(!eligible){
     wake=Math.max(wake,(lastRecipient.get(recipient)??-Infinity)+(cfg.recipientGapMs??DAY));
     if(!communicationWindow(wake,r.window)){
      const cacheKey=JSON.stringify([wake,r.window]);
      if(windowCache.has(cacheKey))wake=windowCache.get(cacheKey);
      else{const max=wake+8*DAY;while(wake<max&&!communicationWindow(wake,r.window)){wake+=MIN;inc(s.counts,'window_checks')}windowCache.set(cacheKey,wake)}
     }
    }
    schedule('wake',Math.min(wake,w.deadline),{key:w.key,workId:w.id});return {deferred:true};
   }
   // No await between eligibility, shared budget consumption and terminal claim: modeled CAS.
   b.used.push(s.now);lastRecipient.set(recipient,s.now);w.state='ASSIGNED';inc(s.counts,'backlog',-1);w.worker=worker;
   w.transmissionAt=s.now;r.workId=null;
   const slot={id:w.id,workspace:r.workspace,prospect:r.id,sender:w.sender,family:w.family,at:s.now,revision:w.revision,priority:w.priority,
    waitMs:s.now-w.created,rate:b.rate,manualReserve:cfg.manualReserve??2,activeReserve:cfg.activeReserve??2,execution_eligibility:noExecution()};
   s.slots.push(slot);inc(day(),'slots');
   if(b.used.length>b.rate)inc(s.counts,'capacity_violations');
   // Explicit experiment policy, NOT a prescribed production cadence. Every step reruns C1.
   const step=r.followupIndex||0;const delay=r.followupDelaysMs?.[step];r.followupIndex=step+1;r.generation++;
   if(delay&&s.now+delay<end)schedule('evaluate',s.now+delay,{key:w.key,revision:r.revision,reason:'followup:'+step});
   return slot;
  }return {budgetExhausted:true};
 }
 function allocateProducer(){
  const pending=[...producerPending].map(k=>producer.get(k)).filter(p=>p.status==='REQUESTED'||p.status==='CAPACITY_EXCEPTION').sort((a,b)=>a.priority-b.priority||a.requestedAt-b.requestedAt||a.key.localeCompare(b.key));
  producerPending.clear();
  for(const p of pending){
   const requestedDay=iso(p.preferredAt?clock(p.preferredAt):p.requestedAt).slice(0,10);
   const slot=availability.find(at=>at>=s.now&&iso(at).slice(0,10)===requestedDay&&!producerUsed.has(at));
   if(slot===undefined){p.status='CAPACITY_EXCEPTION';continue}
   producerUsed.add(slot);p.offeredAt=slot;p.preferenceMatched=p.preferredAt?clock(p.preferredAt)===slot:null;p.status='OFFERED';
  }
 }
 function advance(until){
  until=Math.min(clock(until),end);if(until<s.now)throw Error('clock_reversal');
  let ticks=0;
  while(s.now<until){
   if(++ticks>50000)throw Error('tick_budget');
   while(events.length&&events.peek().at<=s.now){inc(s.counts,'operations');handle(events.pop())}
   // Producer requests are batched before offering finite availability; urgency wins within tick.
   allocateProducer();
   const limit=Object.keys(s.sender).length*40+80;
   for(let i=0;i<limit;i++){const result=claim('worker-'+(i%3));if(!result)break}
   const d=day();d.backlog=s.counts.backlog||0;
   const next=Math.min(s.now+MIN,events.peek()?.at??until,until);
   for(const b of Object.values(s.sender))if(b.externalKnown&&!b.circuit)d.capacity_available+=Math.max(0,b.rate-(cfg.manualReserve??2))*(next-s.now)/MIN;
   s.now=next;
  }return report();
 }
 function report(){
  const waits=s.slots.map(x=>x.waitMs).sort((a,b)=>a-b);const statuses={},producerStatuses={},producerActions={};
  for(const w of work.values())inc(statuses,w.state);for(const p of producer.values()){inc(producerStatuses,p.status);inc(producerActions,p.action)}
  return {build:CAPACITY_BUILD,mode:'SYNTHETIC_ONLY',now:iso(s.now),counts:clone(s.counts),funnel:{IMPORTED:s.counts.imported,DEDUPLICATED:s.counts.unique,SOURCE_VALID:s.counts.source_valid,CHANNEL_ELIGIBLE:s.counts.channel_eligible,ENGAGEMENT_EVALUATED:s.counts.eligible_evaluated_unique||0,APPROVED_FOR_HYPOTHETICAL_QUEUE:s.counts.queued,TRANSMISSION_SLOT_ASSIGNED:s.slots.length},
   holds:clone(s.holds),strategies:clone(s.strategies),daily:clone(s.daily),work_statuses:statuses,producer_statuses:producerStatuses,producer_actions:producerActions,
   sender_utilization:s.slots.length/(Object.values(s.daily).reduce((n,d)=>n+d.capacity_available,0)||1),
   wait_ms:{p50:waits[Math.floor(waits.length*.5)]||0,p95:waits[Math.floor(waits.length*.95)]||0,max:waits.at(-1)||0},
   producer_due:[...producer.values()].filter(p=>(p.confirmedAt??(p.preferredAt?clock(p.preferredAt):p.requestedAt))<=s.now&&!['COMPLETED','CANCELED','INVALIDATED'].includes(p.status)).length,
   producer_unfulfilled:[...producer.values()].filter(p=>!['COMPLETED','CANCELED','INVALIDATED'].includes(p.status)).length,
   pending_events:events.length,external_actions:0,messages_sent:0,provider_calls:0,calendar_actions:0,model_calls:0,execution_eligibility:noExecution()};
 }
 function snapshotState(){return clone({...s,producerPending:[...producerPending],windowCache:[...windowCache],records:[...records],work:[...work],producer:[...producer],lastRecipient:[...lastRecipient],seen:[...seen],receipts:[...receipts],events:events.items,ready:ready.map(h=>h.items)})}
 return {submit,advance,claim,report,snapshot:snapshotState};
}
