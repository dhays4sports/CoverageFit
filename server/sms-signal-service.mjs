import {districtSmsCohort} from './district-pilot-sms.mjs';
import {resolveSmsInboundRoute} from './sms-orchestrator-core.mjs';
import { SIGNAL_PREFIX, DEFAULT_TEMPLATES, enabled, observeOutbound, decideSignal, compliance, extractFacts, matchTemplate } from './sms-signal-core.mjs';
import { listRingCentralMessageHistory, normalizeE164 } from './ringcentral-client.mjs';
import { smsAutomationPaused } from './sms-safety-core.mjs';
import { applySmsConsentCommand } from './sms-consent-core.mjs';
import { writeOpsAudit } from './sms-operations-core.mjs';
export const templatesFor=async store=>{
 const saved=(await store.get(SIGNAL_PREFIX+'templates'))?.templates;
 if(!saved)return DEFAULT_TEMPLATES;
 // Add newly introduced defaults without replacing customized or disabled entries.
 const ids=new Set(saved.map(t=>t.template_id));
 return [...saved,...DEFAULT_TEMPLATES.filter(t=>!ids.has(t.template_id))];
};
export async function recordSignalEvent(store,c,event,options={}) {
 const s=c.signal||{},ignored=compliance(event.body,c)==='automatic_response';
 const transition_types=event.direction==='outbound'?['sms_outbound_detected','template_matched',...(s.stage_mismatch?['stage_mismatch_detected']:[])]:['sms_inbound_received',...(ignored?[]:['reply_classified','decision_2_selected',...(Object.keys(s.new_facts||{}).length?['facts_extracted']:[]),...(s.reply?['reply_generated']:[]),...(s.human_required?['human_review_required']:[]),...(s.automation_lock?['conversation_locked']:[]),...(s.az_recommended_stage?['az_stage_recommended']:[]),...(s.decision_2==='LATER'?['future_bind_created']:s.decision_2==='CLOSE'?['lead_closed']:s.decision_2==='STOP'?['lead_stopped']:[])])];
 const record={transition_types,processed_at:new Date().toISOString(),context_revision:s.revision,context_outbound_message_id:s.source_message_id||null,fact_fields:Object.keys(s.new_facts||{}),recommended_az_stage:s.az_recommended_stage||null,human_required:!!s.human_required,automation_lock:!!s.automation_lock,response_policy:'review_first',build:'CF-SMS-SIGNAL-1.0',conversation_id:c.id,inbound_message_id:event.messageId,direction:event.direction,observed_at:event.occurredAt,classification:ignored?'automatic_response':s.classification,decision_2:ignored?null:s.decision_2,source_campaign:s.source_campaign,source_template:s.source_template,source_probe:s.source_probe,source_message_id:s.source_message_id,classification_confidence:s.classification_confidence,reason:s.reason,reply_goal:s.reply_goal,response_generated:!ignored&&!!s.reply,response_message_id:s.response_message_id||null,useful:!ignored&&s.useful,sales_positive:!ignored&&s.sales_positive};
 const key=SIGNAL_PREFIX+'events/'+encodeURIComponent(event.messageId);
 await store.setJSON(key,record,{metadata:{conversationId:c.id,createdAt:event.occurredAt,updatedAt:event.occurredAt}});
 await writeOpsAudit(store,event.direction==='outbound'?(s.stage_mismatch?'stage_mismatch_detected':'template_matched'):'decision_2_selected',{conversationId:c.id,detail:`${record.classification||'outbound'}; ${record.decision_2||'no action'}; ${s.reason||'template attribution inferred'}`},options);
}
export async function signalOutbound(c,event,options={}) {
 if(!enabled(options.env))return {conversation:c,matched:false};
 if(await districtSmsCohort(c,options.env,options.store)==='CONTROL')return {conversation:c,matched:false};
 const out=observeOutbound(c,event,await templatesFor(options.store));
 if(out.matched){out.conversation.transcript=[...(c.transcript||[]),{id:`rc-${event.messageId}`,direction:'outbound',body:event.body,occurredAt:event.occurredAt,kind:'inferred_agencyzoom'}].slice(-60);out.conversation.lastOutboundAt=event.occurredAt;out.conversation.updatedAt=event.occurredAt;out.conversation.outboundCount=(c.outboundCount||0)+1;await recordSignalEvent(options.store,out.conversation,event,options);}
 return out;
}
async function historyContext(c,event,options) {
 if((c.transcript||[]).some(x=>x.direction==='outbound'))return c;
 const out=structuredClone(c);
 try {
  const history=await (options.listSignalHistory||listRingCentralMessageHistory)({direction:'All',dateFrom:new Date(Date.parse(event.occurredAt)-30*86400000).toISOString(),dateTo:event.occurredAt,perPage:100,page:1},options.env,options);
  if(history.hasMore)throw Error('Context window incomplete');
  const items=history.records.filter(r=>{
   const from=normalizeE164(r.from?.phoneNumber),to=(r.to||[]).map(x=>normalizeE164(x.phoneNumber));
   return (from===c.contactPhone&&to.includes(c.businessPhone))||(from===c.businessPhone&&to.includes(c.contactPhone));
  }).map(r=>({id:`rc-${r.id}`,direction:r.direction==='Outbound'?'outbound':'inbound',body:String(r.subject||''),occurredAt:r.creationTime,kind:'recovered_context'})).filter(r=>r.id!==`rc-${event.messageId}`).sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt));
  out.transcript=[...items,...(c.transcript||[])].slice(-60);
  const last=[...items].reverse().find(x=>x.direction==='outbound');
  if(last){const matched=observeOutbound(out,{body:last.body,messageId:last.id.slice(3),occurredAt:last.occurredAt},await templatesFor(options.store));out.signal=matched.conversation.signal;if(!matched.matched)out.signal={...(out.signal||{}),human_active:true,automation_lock:true};}
 } catch {out.signal={...(out.signal||{}),context_error:true};}
 return out;
}
export async function signalInbound(c,event,options={}) {
 if(!enabled(options.env))return null;
 if(!compliance(event.body,c)&&await districtSmsCohort(c,options.env,options.store)==='CONTROL'){
  const out=structuredClone(c);out.signal={...(out.signal||{}),managed:false,pilot_cohort:'CONTROL',reply:'',draft_status:'none',decision_2:null,useful:false,sales_positive:false,human_required:true,automation_lock:true,reason:'CONTROL: use the existing AgencyZoom workflow and manual RingCentral response.'};
  await writeOpsAudit(options.store,'pilot_control_inbound',{conversationId:c.id,detail:'Signal interpretation and conversational draft withheld for CONTROL.'},options);return out;
 }
 if(c.signal?.inbound_message_id===event.messageId)return c;
 // Preserve existing first-party intake and booked appointment workflows unless enrolled.
 const firstParty=c.orchestration?.workflow?.type;
 if(!compliance(event.body,c)&&!c.signal?.managed&&(firstParty?.startsWith('coveragefit_')||(firstParty&&firstParty!=='unknown'&&firstParty!=='none'&&c.outboundContext?.origin&&!['crm','campaign','external_unknown'].includes(c.outboundContext.origin))))return null;
 if(!compliance(event.body,c))c=await historyContext(c,event,options);
 // Preserve explicit first-party entry commands after checking for campaign context.
 if(!compliance(event.body,c)&&!c.signal?.managed&&!c.signal?.context_error&&['explicit_entry_keyword','explicit_coveragefit_command','explicit_restart','explicit_producer_request','partner_attributed_entry'].includes(resolveSmsInboundRoute(c,event.body,{occurredAt:event.occurredAt,partnerRegistry:options.partnerRegistry}).reason))return null;
 const templates=await templatesFor(options.store);
 // Backfill only explicit facts from preceding paired messages, then let structured memory win.
 let historyFacts={},previous='',goal='';
 for(const item of (c.transcript||[])){
  if(item.id===`rc-${event.messageId}`)continue;
  if(item.direction==='outbound'){previous=item.body;goal=item.signalGoal||matchTemplate(previous,templates)?.default_reply_goal||'';}
  else if(previous)historyFacts=extractFacts(item.body,previous,historyFacts,item.occurredAt||event.occurredAt,goal).facts;
 }
 c.signal={...(c.signal||{}),facts:{...historyFacts,...(c.signal?.facts||{})}};
 if(c.signal.response_timestamp>event.occurredAt&&compliance(event.body,c)!=='opt_out'){
  c.signal={...c.signal,reply:'',draft_status:'none',automation_lock:true,human_required:true,reason:'Delayed inbound arrived out of order; review history before acting.',revision:(c.signal.revision||0)+1};
  await recordSignalEvent(options.store,c,event,options);return c;
 }
 const paused=smsAutomationPaused(c)||c.signal?.human_active;
 const wasLocked=c.signal?.automation_lock;
 let next=decideSignal(c,event.body,{templates:await templatesFor(options.store),now:event.occurredAt,messageId:event.messageId});
 if(compliance(event.body,c)==='automatic_response'){next.signal={...(next.signal||{}),reply:'',draft_status:'none'};}
 else {
  next.signal.draft_status=next.signal.reply?'pending':'none';
  if(next.signal.decision_2!=='STOP'&&(paused||wasLocked||next.signal.context_error)){next.signal.human_required=true;next.signal.automation_lock=true;next.signal.reply='';next.signal.draft_status='none';next.signal.reason=paused?'Producer takeover active; review only.':wasLocked?'Thread locked for human review.':'History could not be loaded; review only.';}
 }
 if(next.signal?.decision_2==='STOP')next=applySmsConsentCommand(next,'stop',{occurredAt:event.occurredAt});
 next.updatedAt=event.occurredAt;
 await recordSignalEvent(options.store,next,event,options);
 return next;
}
