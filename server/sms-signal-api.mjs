import {identity,parse} from './solo-desk-repository.mjs';
import {prepareControlRoster,saveControlRoster} from './district-control-roster.mjs';
import {districtSmsCohort} from './district-pilot-sms.mjs';
import {SIGNAL_SCENARIOS,simulateScenario} from './sms-signal-scenarios.mjs';
import {smsAutomationPaused} from './sms-safety-core.mjs';
import {authorizeProducer} from './consultation-inbox-core.mjs';
import {sendSmsThroughGateway} from './sms-outbound-gateway.mjs';
import {applySmsConsentCommand} from './sms-consent-core.mjs';
import {writeOpsAudit} from './sms-operations-core.mjs';
import {D2,AZ_STAGES,SIGNAL_PREFIX,SIGNAL_BUILD,enabled,decideSignal,validateTemplates,signalMetrics} from './sms-signal-core.mjs';
import {templatesFor} from './sms-signal-service.mjs';
const json=(x,status=200)=>Response.json(x,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message,status=422)=>json({ok:false,error:{message}},status);
const now=o=>new Date(typeof o.now==='function'?o.now():o.now||Date.now()).toISOString();
export async function handleSmsSignal(request,options={}) {
 const auth=authorizeProducer(request,options.env||{});if(!auth.ok)return auth.response;
 const store=options.store;if(!store)return fail('SMS storage unavailable',503);
 if(request.method==='GET'){
  const [cl,el]=await Promise.all([store.list({prefix:'sms-live-conversations/',limit:500}),store.list({prefix:SIGNAL_PREFIX+'events/',limit:1000})]);
  const all=(await Promise.all((cl.blobs||[]).map(x=>store.get(x.key)))).filter(Boolean),events=(await Promise.all((el.blobs||[]).map(x=>store.get(x.key)))).filter(Boolean);
  const visible=await Promise.all(all.filter(c=>c.signal?.managed).map(async c=>{const cohort=await districtSmsCohort(c,options.env,store);return cohort==='CONTROL'||(String(options.env?.CF_SMS_SIGNAL_PILOT_ONLY)==='1'&&cohort!=='SIGNAL')?null:c;}));
  const conversations=visible.filter(Boolean).map(c=>({id:c.id,phone:c.contactPhone,name:c.answers?.firstName||c.answers?.name||'',signal:c.signal}));
  return json({ok:true,enabled:enabled(options.env),build:SIGNAL_BUILD,send_policy:'review_first',scenarios:SIGNAL_SCENARIOS,conversations,templates:await templatesFor(store),metrics:signalMetrics(events,all),truncated:(cl.blobs||[]).length>=500||events.length>=1000});
 }
 if(request.method!=='POST')return fail('GET or POST required',405);
 if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Same-origin request required',403);
 let b;try {const raw=await request.text();if(raw.length>32000)return fail('Request too large',413);b=JSON.parse(raw);}catch{return fail('Invalid JSON');}
 const at=now(options);
 if(b.action==='simulate_scenario'){
  try{return json({ok:true,simulation:true,...simulateScenario(b.scenario_id,await templatesFor(store),at)});}catch(e){return fail(e.message);}
 }
 if(b.action==='simulate'){
  const c={transcript:[{direction:'outbound',body:String(b.previous_outbound||'').slice(0,2000)}],signal:b.signal&&typeof b.signal==='object'?b.signal:{}};
  return json({ok:true,simulation:true,conversation:decideSignal(c,String(b.inbound||'').slice(0,2000),{templates:await templatesFor(store),now:at,messageId:'simulation'})});
 }
 if(['preview_control_roster','import_control_roster'].includes(b.action)){
  try{const prepared=await prepareControlRoster(b.csv,options);
   // Refuse any existing SIGNAL assignment before changing exclusion state.
   for(const item of prepared.items)if(await districtSmsCohort({id:item.conversation_id},options.env)==='SIGNAL')return fail('A listed thread is already enrolled as SIGNAL. Resolve the cohort conflict before import.',409);
   if(b.action==='preview_control_roster')return json({ok:true,fingerprint:prepared.fingerprint,count:prepared.items.length,rows:prepared.items.map((r,i)=>({row:i+2,phone_last4:r.phone_last4}))});
   if(b.confirmed!==true||b.fingerprint!==prepared.fingerprint)return fail('Preview this exact file and confirm its predetermined CONTROL assignment first.',409);
   return json({ok:true,...await saveControlRoster(prepared,options)});
  }catch(e){return fail(e.message,422);}
 }
 if(b.action==='save_templates'){
  try {const templates=validateTemplates(b.templates).map(x=>({...x,updated_at:at}));await store.setJSON(SIGNAL_PREFIX+'templates',{templates,updated_at:at});await writeOpsAudit(store,'signal_templates_updated',{detail:'Producer updated literal template patterns.'},options);return json({ok:true});}catch(e){return fail(e.message);}
 }
 if(!enabled(options.env))return fail('Signal pilot is not enabled. Simulator remains available.',409);
 if(!/^sms-live-[a-f0-9]{32,64}$/.test(b.conversation_id||''))return fail('Invalid conversation identifier');
 if(b.opportunity_id){
  if(!options.env?.COVERAGEFIT_DB)return fail('Opportunity storage unavailable',503);
  const linked=await options.env.COVERAGEFIT_DB.prepare("SELECT summary_json FROM cf_solo_sources WHERE workspace_id=? AND opportunity_id=? AND kind='district_pilot_v1'").bind(identity(options.env).workspace,b.opportunity_id).first();
  const pilot=parse(linked?.summary_json);if(pilot.cohort!=='SIGNAL'||pilot.pilot_phase!=='NEW_LEAD'||pilot.conversation_id!==b.conversation_id)return fail('This opportunity is not linked to this SIGNAL conversation.',409);
 }
 const key='sms-live-conversations/'+b.conversation_id,lock=SIGNAL_PREFIX+'locks/'+b.conversation_id;
 // Shared with webhook processing. A stale crash lock fails closed until explicitly cleared.
 if(b.action==='clear_stale_lock'){
  const held=await store.get(lock);if(!held||Date.parse(at)-Date.parse(held.at)<600000)return fail('Only a lock older than ten minutes may be cleared.',409);
  await store.delete(lock);await writeOpsAudit(store,'signal_stale_lock_cleared',{conversationId:b.conversation_id,detail:'Producer cleared stale processing lock.'},options);return json({ok:true});
 }
 try{await store.setJSON(lock,{at},{onlyIfNew:true});}catch{return fail('Conversation is processing; refresh and retry.',409);}
 try{
  let c=await store.get(key);if(!c?.signal)return fail('Signal conversation not found',404);
  let s=c.signal;
  if(['approve_send','edit','unlock'].includes(b.action)&&await districtSmsCohort(c,options.env,options.store)==='CONTROL')return fail('CONTROL replies use the normal manual workflow; Signal drafts cannot be sent.',409);
  if(b.revision!==s.revision)return fail('Conversation changed. Refresh before acting.',409);
  if(b.action==='mark_az_updated'){
   if(b.stage!==s.az_recommended_stage||!AZ_STAGES.includes(b.stage))return fail('Confirm the currently recommended stage.',409);
   s.az_confirmed_stage=b.stage;s.az_sync_status='confirmed';s.az_sync_confirmed_at=at;s.az_sync_confirmed_by='authenticated_producer';s.stage_mismatch=false;
  }else if(b.action==='set_stage'){
   if(!AZ_STAGES.includes(b.stage))return fail('Invalid observed AgencyZoom stage');
   s.az_confirmed_stage=b.stage;s.az_inferred_stage=b.stage;s.az_sync_status=s.az_recommended_stage===b.stage?'confirmed':'pending';
  }else if(b.action==='record_quote'){
   const summary=String(b.summary||'').trim();if(!summary||summary.length>600)return fail('Enter a short factual summary of the quote already delivered (maximum 600 characters).');
   s.last_quote={summary,recorded_at:at,recorded_by:'authenticated_producer',source:'manual_observation'};
   if(s.future_opportunity)s.future_opportunity.last_quote=s.last_quote;
  }else if(b.action==='unlock'){
   if(s.contact_suppressed||s.decision_2==='STOP'||c.smsConsent?.status==='opted_out')return fail('Suppression cannot be cleared here.',409);
   s.human_active=false;s.automation_lock=false;s.human_required=false;s.reply='';s.draft_status='none';
   // Signal drafts resume, but existing producer ownership remains protected.
  }else if(b.action==='decide'){
   if(!D2.includes(b.decision_2))return fail('Select one of the five actions');
   if((s.decision_2==='STOP'||s.contact_suppressed||c.smsConsent?.status==='opted_out')&&b.decision_2!=='STOP')return fail('Suppression cannot be overridden.',409);
   s.decision_2=b.decision_2;s.reply='';s.draft_status='none';s.human_required=true;s.automation_lock=true;
   s.az_recommended_stage=({CALL:'ENGAGED',ASK_ONE_QUESTION:'ENGAGED',LATER:'FUTURE_BIND',CLOSE:'CLOSED',STOP:'STOP'})[b.decision_2];s.az_sync_status=s.az_confirmed_stage===s.az_recommended_stage?'confirmed':'pending';
   if(b.followup_date){if(!/^\d{4}-\d{2}(?:-\d{2})?$/.test(b.followup_date))return fail('Use YYYY-MM or YYYY-MM-DD');s.future_timing_raw=b.followup_date;const value=b.followup_date.length===7?b.followup_date+'-01':b.followup_date;const date=new Date(value+'T00:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)return fail('Enter a valid calendar date.');s.future_month=b.followup_date.length===7?b.followup_date:null;s.future_date=b.followup_date.length===10?b.followup_date:null;s.future_opportunity={...(s.future_opportunity||{}),future_month:s.future_month,future_date:s.future_date,future_date_type:'requested_callback',reason:'Producer recorded follow-up timing',line:s.facts?.line||null,current_carrier:s.facts?.current_carrier||null,current_premium:s.facts?.current_premium??null,preferred_channel:s.facts?.preferred_channel||'UNKNOWN',last_quote:s.last_quote||null,last_objection:s.last_objection||null,conversation_summary:s.conversation_summary||''};}
   if(b.decision_2==='STOP'){c=applySmsConsentCommand(c,'stop',{occurredAt:at});c.signal=s;}
  }else if(b.action==='edit'){
   const message=String(b.message||'').trim();if(!message||message.length>1000||(message.match(/\?/g)||[]).length>1)return fail('Use a short reply with at most one question.');
   if(s.decision_2==='STOP'||s.contact_suppressed||c.smsConsent?.status==='opted_out')return fail('Suppressed contact: no reply.',409);
   if(message.includes('?')&&(s.questions_sent||0)>=3)return fail('Question limit reached. Use producer follow-up.',409);
   s.reply=message;s.reply_goal=String(b.reply_goal||s.reply_goal||'HUMAN_HANDOFF');s.draft_status='pending';s.edited=true;
  }else if(b.action==='approve_send'){
   if(!s.reply||s.draft_status!=='pending'||s.decision_2==='STOP'||s.contact_suppressed||c.smsConsent?.status==='opted_out')return fail('No eligible pending draft.',409);
   if(s.human_active||smsAutomationPaused(c))return fail('Human takeover active. Resolve ownership before sending.',409);
   const question=s.reply.includes('?');if(question&&(s.questions_sent||0)>=3)return fail('Question limit reached.',409);
   // Hold on uncertain provider delivery. Never automatically retry an approval.
   s.draft_status='sending';await store.setJSON(key,c);
   const message=s.reply,goal=s.reply_goal,revision=s.revision;
   try{
    const sent=await (options.sendSignal||sendSmsThroughGateway)({to:c.contactPhone,message,origin:'producer_console',workflow:'signal_review_v1',replyRoute:'producer',ownershipEffect:'preserve',idempotencyKey:`signal:${c.id.slice(-32)}:${revision}`},{...options,conversationSnapshot:c});
    c=await store.get(key)||c;s=c.signal;s.draft_status='sent';s.response_message_id=sent.providerMessageId;s.sent_at=at;s.pending_goal=goal;s.previous_outbound=message;s.questions_sent=(s.questions_sent||0)+(question?1:0);s.asked_goals=[...new Set([...(s.asked_goals||[]),...(question?[goal]:[])])];
    const item=[...(c.transcript||[])].reverse().find(x=>x.id===`rc-${sent.providerMessageId}`);if(item)item.signalGoal=goal;
    const ekey=SIGNAL_PREFIX+'events/'+encodeURIComponent(s.inbound_message_id);const event=await store.get(ekey);if(event)await store.setJSON(ekey,{...event,response_message_id:sent.providerMessageId,reply_sent_at:at});
   }catch(e){s.draft_status='delivery_review';s.reply='';await store.setJSON(key,c);await writeOpsAudit(store,'signal_delivery_review',{conversationId:c.id,detail:'Delivery outcome requires RingCentral verification. No automatic retry.'},options);return fail('Delivery needs review in RingCentral. Do not retry blindly.',502);}
  }else return fail('Unsupported signal action');
  s.revision=(s.revision||0)+1;c.signal=s;c.updatedAt=at;await store.setJSON(key,c,{metadata:{updatedAt:at,createdAt:c.createdAt||at}});
  await writeOpsAudit(store,({mark_az_updated:'az_sync_confirmed',unlock:'conversation_unlocked',approve_send:'reply_sent',decide:s.decision_2==='STOP'?'lead_stopped':s.decision_2==='CLOSE'?'lead_closed':s.decision_2==='LATER'?'future_bind_created':'decision_2_selected'})[b.action]||'signal_'+b.action,{conversationId:c.id,detail:`Producer action ${b.action}; ${s.decision_2}; AZ ${s.az_recommended_stage||'unknown'}`},options);
  return json({ok:true,signal:s});
 }finally{await store.delete(lock);}
}
