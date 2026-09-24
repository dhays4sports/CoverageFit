import {SIGNAL_QUESTION_LIBRARY} from './signal-decision-core.mjs';
import {authenticateIntake,normalizeLeadPayload,upsertLeadJourney} from './lead-operations-core.mjs';
import {projectSoloDeskEvent} from './solo-desk-event-projection.mjs';
import {sha256Hex} from './runtime-crypto.mjs';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export function validateHomeRequest(body){
 if(body?.version!=='signal-home-contact-v1'||!['call','text','callback'].includes(body.mode)||body.permission!==true)throw Error('permission_required');
 if(!/^[a-zA-Z0-9_-]{10,100}$/.test(body.sessionId||''))throw Error('invalid_session');
 const name=String(body.name||'').trim(),phone=String(body.phone||'').replace(/\D/g,'').replace(/^1(?=\d{10}$)/,'');
 if(!name||name.length>80||/[<>\x00-\x1f]/.test(name)||!/^\d{10}$/.test(phone))throw Error('invalid_contact');
 if(body.mode==='callback'&&!['weekday_morning','weekday_afternoon'].includes(body.timePreference))throw Error('choose_time');
 if(!Array.isArray(body.answers)||body.answers.length>3)throw Error('invalid_answers');
 const signals={product:'home'},seen=new Set(),answers=[];
 for(const a of body.answers){
  if(!['home_trigger','home_shopping_intent','home_decision_timing'].includes(a.questionId)||seen.has(a.questionId))throw Error('invalid_answer');
  seen.add(a.questionId);const q=SIGNAL_QUESTION_LIBRARY[a.questionId],option=q.options.find(o=>o.code===a.optionCode);
  if(!option)throw Error('invalid_option');
  Object.assign(signals,option.signals);answers.push({question:q.prompt,answer:option.label,questionId:q.id,optionCode:option.code});
 }
 return {sessionId:body.sessionId,name,phone,mode:body.mode,timePreference:body.mode==='callback'?body.timePreference:'',answers,signals};
}
export async function handleSignalHomeHandoff(request,options={}){
 if(request.method!=='POST')return json({ok:false,error:'method_not_allowed'},405);
 if(options.env?.SIGNAL_HOME_HANDOFF_ENABLED!=='1')return json({ok:false,error:'handoff_not_configured'},503);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({ok:false,error:'json_required'},415);
 const raw=await request.text();if(new TextEncoder().encode(raw).length>8192)return json({ok:false,error:'body_too_large'},413);
 const auth=await authenticateIntake(request,raw,options);if(!auth.ok)return auth.response;
 let value;try{value=validateHomeRequest(JSON.parse(raw));}catch{return json({ok:false,error:'invalid_contact_request'},422);}
 try{
  // Deterministic identity across lost acknowledgements and repeat submissions.
  const checkpointId='408d_home_'+await sha256Hex(JSON.stringify(value));
  const now=new Date().toISOString(),s=value.signals;
  const n=normalizeLeadPayload({lead_checkpoint_id:checkpointId,lead_stage:'contact_requested',first_name:value.name,phone:value.phone,contact_consent:true,consent_version:'signal-home-contact-v1',consent_at:now,source_key:'web_408_home',source:'408farmers',route_path:'/signal-preview/home/',review_track:'home',review_reason:s.reviewReason,stated_trigger:s.statedTrigger,shopping_intent:s.shoppingIntent,decision_timing:s.decisionTiming,automated_marketing_sms_consent:false});
  if(!n.valid)return json({ok:false,error:'invalid_contact_request'},422);
  n.value.context.signalHome={...value,name:undefined,phone:undefined,receivedAt:now};
  n.value.context.reviewContext=`Signal Home: ${value.mode}${value.timePreference?' / '+value.timePreference:''}`;
  n.value.consent.agencyContact.callPermitted=value.mode!=='text';
  n.value.consent.agencyContact.personalTextPermitted=value.mode==='text';
  n.value.consent.agencyContact.scope='requested_home_'+value.mode;
  const result=await upsertLeadJourney(options.store,n.value,{env:options.env});
  const projection=await (options.project||projectSoloDeskEvent)({db:options.db,env:options.env},{kind:'lead',record:result.record});
  if(!projection.ok)return json({ok:false,error:'operator_delivery_pending',saved:true},503);
  // Deliberately no scheduleSync, email, SMS, calendar or AgencyZoom call.
  return json({ok:true,durable:true,operatorVisible:true,receipt:checkpointId,idempotent:!result.created,booked:false},result.created?201:200);
 }catch{return json({ok:false,error:'delivery_unavailable'},503);}
}
