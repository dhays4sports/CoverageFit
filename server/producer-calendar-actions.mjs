import {googleEvent,googleCalendarAvailability,callbackConfig,parseCallbackDateTime} from './sms-callback-scheduling-core.mjs';
import {createSmsConversationStore} from './d1-json-store.mjs';
import {digest,parse} from './solo-desk-repository.mjs';
import {sourceSync} from './solo-desk-sync.mjs';
import {producerWorkspace} from './producer-workspace.mjs';
const clean=(v,n=500)=>String(v||'').trim().slice(0,n);
const email=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export function producerCalendar(repo,env,options={}){
 const store=createSmsConversationStore(repo.db),prefix='producer-calendar/'+repo.scope.workspace+'/',provider=options.googleEvent||googleEvent;
 const config=callbackConfig(env),transport={...options,env,config};
 async function view(id){await repo.own(id);return await store.get(prefix+id)||{version:0,status:'none'};}
 async function act(v){
  if(env.CF_CALENDAR_ACTIONS_ENABLED!=='1')throw Error('Calendar actions are off.');
  if(!['create','reschedule','invite','cancel'].includes(v.action)||!/^\w[\w-]{15,80}$/.test(v.requestId||''))throw Error('Reload the appointment form.');
  const d=await producerWorkspace(repo,env).detail(v.id);
  if(d.opportunity.status==='closed'||d.population.population==='DISTRICT_CONTROL'||d.contactSafety.suppressed||d.sms?.facts?.wrong_number||d.sms?.decision_2==='CLOSE')throw Error('Calendar action unavailable for this record.');
  const key=prefix+v.id,old=await view(v.id),fingerprint=await digest(JSON.stringify(v));
  if(old.last_request===v.requestId){if(old.last_fingerprint!==fingerprint)throw Error('Request changed. Reload the appointment.');return old;}
  if(old.pending&&old.pending.requestId!==v.requestId)throw Error('An earlier calendar action needs reconciliation. Retry that action first.');
  if(!old.pending&&Number(v.version)!==old.version)throw Error('Appointment changed. Reload before saving.');
  if(old.pending&&old.pending.fingerprint!==fingerprint)throw Error('Pending request changed. Retry the original action.');
  let desired=old.pending?.desired;
  if(!desired){
   if(v.action==='create'&&(old.status==='scheduled'||d.sources.some(s=>s.kind==='calendar'&&s.summary?.status==='scheduled')))throw Error('An appointment already exists. Reschedule it.');
   if(v.action!=='create'&&(!old.event_id||old.status!=='scheduled'))throw Error('No active owned appointment.');
   desired={...old};delete desired.pending;
   if(['create','reschedule'].includes(v.action)){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(v.date||'')||!/^\d{2}:\d{2}$/.test(v.time||''))throw Error('Choose an exact date and time.');
    const duration=Number(v.duration||20);if(!Number.isInteger(duration)||duration<10||duration>90)throw Error('Duration must be 10–90 minutes.');
    const tz=clean(v.timeZone,80)||config.timeZone;try{new Intl.DateTimeFormat('en-US',{timeZone:tz});}catch{throw Error('Choose a valid timezone.');}
    const parsed=parseCallbackDateTime(v.date+' at '+v.time,{...transport,now:options.now,config:{...config,timeZone:tz,durationMinutes:duration}});if(!parsed.ok)throw Error('Choose a valid weekday/time within the callback scheduling window.');
    desired={...desired,start:parsed.start,end:parsed.end,timeZone:tz,duration,title:clean(v.title,160)||'Insurance Review — '+clean(v.name,100),description:clean(v.description,1800),name:clean(v.name,100),phone:clean(v.phone,40),email:clean(v.email,200),status:'scheduled'};
    if(!desired.name)throw Error('Prospect name is required.');
    desired.event_id=v.action==='create'?'cf'+(await digest(repo.scope.workspace+'|'+v.id+'|'+parsed.start)).slice(0,48):old.event_id;
   }
   if(v.invite===true||v.action==='invite'){const address=clean(v.email||desired.email,200);if(!email(address))throw Error('A valid prospect email is required to invite.');desired.email=address;desired.invite_status='requested';}
   else desired.invite_status=old.invite_status||'not_requested';
   if(v.action==='cancel')desired.status='cancelled';
  }
  const pending={...old,pending:{requestId:v.requestId,fingerprint,action:v.action,input:v,desired,started_at:new Date().toISOString()}};
  if(!old.pending){
   if(!old.version&&old.status==='none')await repo.sql("INSERT OR IGNORE INTO sms_conversations(record_key,data_json,metadata_json,created_at,updated_at) VALUES(?,?,'{}',?,?)",key,JSON.stringify(old),new Date().toISOString(),new Date().toISOString()).run();
   const lock=await repo.sql('UPDATE sms_conversations SET data_json=? WHERE record_key=? AND data_json=?',JSON.stringify(pending),key,JSON.stringify(old)).run();if(lock.meta?.changes!==1)throw Error('Appointment action already in progress.');
  }
  // Pending remains after an ambiguous provider result. A different action cannot race it.
  const ownership=await digest(repo.scope.workspace+'|'+v.id),eventId=desired.event_id;
  let found=await provider('GET',eventId,null,transport);if(!found.configured)throw Error('Calendar provider is unavailable. Retry this action after configuration is restored.');
  let e=found.event;
  if(e&&e.extendedProperties?.private?.coveragefitOwner!==ownership)throw Error('Calendar event ownership does not match.');
  const applied=()=>e?.extendedProperties?.private?.coveragefitOperation===v.requestId;
  const guestUpdates=desired.invite_status==='requested'||old.invite_status==='requested'?'all':undefined;
  if(v.action==='cancel'){
   if(old.pending&&e&&e.status!=='cancelled')throw Error('Cancellation acceptance remains unknown; reconcile with the provider before retrying.');
   if(e&&e.status!=='cancelled')await provider('DELETE',eventId,null,{...transport,guestUpdates});
  }else if(!applied()){
   if(old.pending)throw Error('Calendar acceptance remains unknown; no automatic retry will create or update another event.');
   if(v.action!=='create'&&!e)throw Error('Calendar event is missing. Reconcile before making changes.');
   if(e?.status==='cancelled')throw Error('Calendar event was cancelled. Choose a new appointment time.');
   if(['create','reschedule'].includes(v.action)){
    const busy=await (options.availability||googleCalendarAvailability)(desired.start,desired.end,transport);
    if(!busy.configured)throw Error('Calendar availability is unknown.');
    if(busy.busy?.some(b=>Date.parse(b.start)<Date.parse(desired.end)&&Date.parse(b.end)>Date.parse(desired.start))){const restored={...old};delete restored.pending;await repo.sql('UPDATE sms_conversations SET data_json=? WHERE record_key=? AND data_json=?',JSON.stringify(restored),key,JSON.stringify(pending)).run();throw Error('This time is busy. Choose another slot.');}
   }
   const body={...(v.action==='create'?{id:eventId}:{}),summary:desired.title,description:[desired.description,'Prospect phone: '+desired.phone].filter(Boolean).join('\n'),start:{dateTime:desired.start,timeZone:desired.timeZone},end:{dateTime:desired.end,timeZone:desired.timeZone},extendedProperties:{private:{coveragefitOwner:ownership,coveragefitOperation:v.requestId}},...(desired.invite_status==='requested'?{attendees:[{email:desired.email}]}:{})};
   if(e&&v.action==='create')throw Error('This opportunity/time already has an event. Reconcile it before retrying.');
   const sent=await provider(e?'PATCH':'POST',e?eventId:null,body,{...transport,guestUpdates});if(!sent.configured||!sent.event?.id)throw Error('Calendar acceptance unknown; retry this exact action.');e=sent.event;
  }
  const at=new Date().toISOString(),next={...desired,version:old.version+1,event_url:e?.htmlLink||old.event_url||null,last_request:v.requestId,last_fingerprint:fingerprint,updated_at:at,created_at:old.created_at||at,...(v.action==='cancel'?{cancelled_at:at}:{})};delete next.pending;
  // Project before releasing the durable operation. Retry reuses the accepted provider operation.
  await sourceSync(repo).projectAppointment(v.id,{eventId,start:next.start,end:next.end,status:next.status,eventUrl:next.event_url,title:next.title,inviteStatus:next.invite_status,producerCommitted:true,createdAt:next.created_at});
  await store.setJSON(key,next);await repo.detail(v.id);return next;
 }
 return {view,act};
}
