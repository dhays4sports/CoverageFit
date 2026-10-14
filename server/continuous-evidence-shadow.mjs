// CF-CONTINUOUS-EVIDENCE-1.0 / E0–E1 — PURE, TEST-ONLY EVIDENCE FLYWHEEL.
// No D1, provider, HTTP, contact, credential, customer-data or persistence operations.
// Callers must never equate synthetic rights flags with legal/provider send authority.
import {simulateEngagement} from './engagement-shadow-simulator.mjs';

export const EVIDENCE_SHADOW_BUILD='CF-CONTINUOUS-EVIDENCE-SHADOW-0.1';
const SOURCE_TYPES=new Set(['vendor_import','first_party_form','sms_inbound','producer_confirmation','document_verification','model_inference']);
const FIELDS=new Set(['carrier','vehicle_count','renewal_date','homeowner','shopping_reason','explicit_call_request','explicit_quote_request']);
const COMPARE_FIELDS=['carrier','vehicle_count','renewal_date','homeowner','shopping_reason','explicit_call_request','explicit_quote_request'];
const text=(value,max=150)=>typeof value==='string'?value.trim().slice(0,max):'';
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value);
const validInstant=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const date=(value)=>{
 if(!/^\d{4}-\d\d-\d\d$/.test(value))return false;
 const parsed=new Date(value+'T00:00:00Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
};
const month=value=>/^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const freezeOutput=(state,code,more={})=>({build:EVIDENCE_SHADOW_BUILD,mode:'TEST_ONLY',state,code,...more,external_actions:0,provider_calls:0,messages_sent:0,writes:0});
export const emptyEvidenceState=()=>({build:EVIDENCE_SHADOW_BUILD,events:[],held:[]});

function normalizeClaim(raw,sourceType,eventId,occurredAt){
 if(!raw||!FIELDS.has(raw.field))return null;
 if(sourceType==='producer_confirmation'&&raw.producer_verified!==true)return null;
 if(sourceType==='document_verification'&&(!validId(raw.verification_event_id)||!validId(raw.document_ref)))return null;
 const field=raw.field;
 let value=raw.value;
 if(field==='renewal_date'){
  if(typeof value!=='string'||!date(value)&&!month(value))return null;
 }else if(field==='vehicle_count'){
  if(!Number.isSafeInteger(value)||value<0||value>30)return null;
 }else if(field==='homeowner'||field==='explicit_call_request'||field==='explicit_quote_request'){
  if(typeof value!=='boolean')return null;
 }else{
  if(typeof value!=='string'||!value.trim()||value.length>150)return null;
  value=text(value);
 }
 const policy=field==='renewal_date'?text(raw.policy_line,24).toUpperCase()||'UNSPECIFIED':null;
 if(policy&&!/^[A-Z][A-Z0-9_]{0,23}$/.test(policy))return null;
 const verification=sourceType==='producer_confirmation'&&raw.producer_verified===true?'producer_confirmed'
  :sourceType==='document_verification'?'document_verified':sourceType==='model_inference'?'inference':sourceType==='vendor_import'?'imported_unverified':'customer_reported';
 return {assertion_id:eventId+':'+field+(policy?':'+policy:''),field,value,policy_line:policy,
  precision:field==='renewal_date'?(date(value)?'exact':'month'):null,
  verification,verification_event_id:sourceType==='document_verification'?raw.verification_event_id:null,document_ref:sourceType==='document_verification'?raw.document_ref:null,source_event_id:eventId,observed_at:occurredAt,
  supersedes_assertion_id:sourceType==='producer_confirmation'&&raw.producer_verified===true&&validId(raw.supersedes_source_event_id)
   ?raw.supersedes_source_event_id+':'+field+(policy?':'+policy:''):null};
}
const eventKey=e=>e.workspace_id+'|'+e.source_type+'|'+e.source_event_id;
function normalizedEvent(event){
 if(!event||!validId(event.workspace_id)||!validId(event.profile_id)||!validId(event.source_event_id)
   ||!SOURCE_TYPES.has(event.source_type)||!validInstant(event.observed_at))return null;
 const raw=event.observations;
 if(!Array.isArray(raw)||raw.length<1||raw.length>12)return null;
 const claims=raw.map(x=>normalizeClaim(x,event.source_type,event.source_event_id,new Date(event.observed_at).toISOString()));
 if(claims.some(x=>!x)||new Set(claims.map(x=>x.assertion_id)).size!==claims.length)return null;
 claims.sort((a,b)=>a.assertion_id.localeCompare(b.assertion_id));
 return {workspace_id:event.workspace_id,profile_id:event.profile_id,source_type:event.source_type,
  source_event_id:event.source_event_id,observed_at:new Date(event.observed_at).toISOString(),
  claims,rights:{
   internal_insurance_use:event.rights?.internal_insurance_use===true,
   commercial_analytics_eligible:false,
   external_transfer_authorized:false,
   retain_until:validInstant(event.rights?.retain_until)?new Date(event.rights.retain_until).toISOString():null
  }};
}
function hold(state,code,key){
 if(!state.held.some(x=>x.code===code&&x.event_key===key))
  return {...state,held:[...state.held,{code,event_key:key}]};
 return state;
}
/**
 * Admit one synthetic event. Evidence-bearing data never authorizes contact.
 * Identity must already be separately linked; unknown/cross-workspace matches hold.
 * Replays are exact-content idempotent; conflicting same-ID events fail closed.
 */
export function admitEvidence(state,event,{now='2026-10-14T00:00:00Z'}={}){
 if(state?.build!==EVIDENCE_SHADOW_BUILD||!Array.isArray(state.events)||!Array.isArray(state.held))
  throw new TypeError('invalid_evidence_state');
 if(!validInstant(now))throw new TypeError('invalid_clock');
 const candidate=normalizedEvent(event);
 const key=candidate?eventKey(candidate):'invalid';
 if(!candidate)return freezeOutput(state,'HOLD_INVALID_EVENT');
 const existing=state.events.find(x=>eventKey(x)===key);
 if(existing){
  if(JSON.stringify(existing)===JSON.stringify(candidate))return freezeOutput(state,'DUPLICATE_EXACT');
  return freezeOutput(hold(state,'HOLD_SOURCE_ID_CONFLICT',key),'HOLD_SOURCE_ID_CONFLICT');
 }
 if(candidate.rights.internal_insurance_use!==true)return freezeOutput(hold(state,'HOLD_SOURCE_RIGHTS',key),'HOLD_SOURCE_RIGHTS');
 if(candidate.rights.retain_until&&Date.parse(candidate.rights.retain_until)<=Date.parse(now))
  return freezeOutput(hold(state,'HOLD_RETENTION_EXPIRED',key),'HOLD_RETENTION_EXPIRED');
 if(event.identity?.status!=='linked'||event.identity?.verified_reference!==true)
  return freezeOutput(hold(state,'HOLD_IDENTITY_UNVERIFIED',key),'HOLD_IDENTITY_UNVERIFIED');
 if(state.events.some(x=>x.workspace_id===candidate.workspace_id&&x.profile_id===candidate.profile_id
      &&event.identity?.linked_profile_id!==candidate.profile_id))
  return freezeOutput(hold(state,'HOLD_IDENTITY_UNVERIFIED',key),'HOLD_IDENTITY_UNVERIFIED');
 if(event.identity.linked_profile_id!==candidate.profile_id)
  return freezeOutput(hold(state,'HOLD_IDENTITY_UNVERIFIED',key),'HOLD_IDENTITY_UNVERIFIED');
 return freezeOutput({...state,events:[...state.events,candidate]},'ADMITTED');
}

function comparable(a,b){
 if(a.field==='renewal_date'&&b.field==='renewal_date'&&a.policy_line===b.policy_line){
  if(a.precision==='exact'&&b.precision==='month')return a.value.slice(0,7)===b.value;
  if(a.precision==='month'&&b.precision==='exact')return a.value===b.value.slice(0,7);
 }
 return a.value===b.value;
}
const rank=a=>(a.verification==='document_verified'?4:a.verification==='inference'?0:a.verification==='producer_confirmed'?3:a.verification==='customer_reported'?2:1)
  +(a.precision==='exact'?0.25:0);
const fieldKey=x=>x.field+(x.policy_line?':'+x.policy_line:'');

export function projectEvidence(state,{workspace_id,profile_id,now='2026-10-14T00:00:00Z'}={}){
 if(state?.build!==EVIDENCE_SHADOW_BUILD||!validId(workspace_id)||!validId(profile_id)||!validInstant(now))
  throw new TypeError('invalid_evidence_projection');
 const current=Date.parse(now);
 const events=state.events.filter(e=>e.workspace_id===workspace_id&&e.profile_id===profile_id
   &&Date.parse(e.observed_at)<=current
   &&(!e.rights.retain_until||Date.parse(e.rights.retain_until)>current));
 const all=events.flatMap(e=>e.claims);
 const superseded=new Set(all.filter(x=>x.supersedes_assertion_id).map(x=>x.supersedes_assertion_id));
 const active=all.filter(x=>!superseded.has(x.assertion_id));
 const facts={};
 for(const name of COMPARE_FIELDS)facts[name]={status:'MISSING',value:null,verification:'unknown',evidence:[]};
 const groups=new Map();
 for(const x of active){
  const key=fieldKey(x);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(x);
 }
 for(const [key,claims] of groups){
  const sorted=[...claims].sort((a,b)=>rank(b)-rank(a)||b.observed_at.localeCompare(a.observed_at)
   ||a.source_event_id.localeCompare(b.source_event_id));
  const conflict=sorted.some(x=>!comparable(x,sorted[0]));
  facts[key]={status:conflict?'CONFLICTED':sorted[0].verification==='inference'?'INFERRED':'KNOWN',value:conflict?null:sorted[0].value,
   verification:conflict?'conflicted':sorted[0].verification,
   evidence:sorted.map(x=>({source_event_id:x.source_event_id,source_type:events.find(e=>e.source_event_id===x.source_event_id)?.source_type||'unknown',
    value:x.value,verification:x.verification,verification_event_id:x.verification_event_id,document_ref:x.document_ref,precision:x.precision,observed_at:x.observed_at}))};
 }
 const renewalKeys=[...groups.keys()].filter(x=>x.startsWith('renewal_date:'));
 if(renewalKeys.length===1)facts.renewal_date=facts[renewalKeys[0]];
 else if(renewalKeys.length>1)facts.renewal_date={status:'AMBIGUOUS',value:null,verification:'unknown',
  evidence:renewalKeys.flatMap(k=>facts[k].evidence)};
 const hasMaterialConflict=Object.values(facts).some(x=>x.status==='CONFLICTED');
 return {build:EVIDENCE_SHADOW_BUILD,mode:'TEST_ONLY',workspace_id,profile_id,
  source_events:events.length,assertions:active.length,
  facts,material_conflicts:hasMaterialConflict,held_events:state.held.length,
  external_transfer_authorized:false,commercial_analytics_eligible:false,
  sms_send_authorized:false,provider_calls:0,messages_sent:0,writes:0};
}
/** Pure expiry pruning: do not retain expired synthetic event contents in state. */
export function pruneExpiredEvidence(state,{now='2026-10-14T00:00:00Z'}={}){
 if(state?.build!==EVIDENCE_SHADOW_BUILD||!validInstant(now))throw new TypeError('invalid_evidence_state');
 const instant=Date.parse(now);
 return {...state,events:state.events.filter(e=>!e.rights.retain_until||Date.parse(e.rights.retain_until)>instant)};
}
/**
 * Use the current projection to propose the next *test-only* action.
 * Existing SHADOW decides safety/route precedence. No sending, scheduling or writes.
 */
export function simulateEvidenceCycle(state,{
 workspace_id,profile_id,now='2026-10-14T00:00:00Z',source={},population='DISTRICT_SIGNAL',
 contact_suppressed=false,commitments=[]
}={}){
 const memory=projectEvidence(state,{workspace_id,profile_id,now});
 const renewal=memory.facts.renewal_date;
 const reportedCall=memory.facts.explicit_call_request?.status==='KNOWN'
   &&memory.facts.explicit_call_request.value===true;
 const probe=simulateEngagement({
  prospect:{population,facts:{renewal:{
   verification:renewal.status==='MISSING'?'unknown':renewal.verification,
   lifecycle:renewal.status==='KNOWN'?'CANDIDATE':'UNKNOWN',
   conflict:renewal.status==='CONFLICTED'
  },contact_safety:{suppressed:contact_suppressed}},commitments},
  sms:{decision_2:reportedCall?'CALL':'ASK_ONE_QUESTION',contact_suppressed},
  // This is a synthetic scenario describing hypothetical route authority.
  // No provider is ever reachable through this module.
  source:{...source},
  now
 });
 let next=probe.code,message=probe.proposed_message,why=probe.reason;
 if(['PROPOSE_ASK_RENEWAL','WAIT_FOR_TIMING','PRODUCER_REVIEW'].includes(probe.code)){
  if(renewal.status==='AMBIGUOUS'){
   next='PRODUCER_REVIEW';
   message=null;
   why='Multiple policy-specific renewal dates exist; avoid an unnecessary generic renewal question.';
  }else if(renewal.status==='MISSING'){
   next='PROPOSE_ASK_RENEWAL';
   message='When does your current insurance policy renew?';
   why='Renewal timing is missing from the current sourced profile.';
  }else if(renewal.status==='KNOWN'&&memory.facts.homeowner.status==='MISSING'){
   next='PROPOSE_ASK_BUNDLE';
   message='Do you also need home insurance?';
   why='Known renewal timing need not be asked again; bundle interest remains unknown.';
  }else{
   next='PRODUCER_REVIEW';
   message=null;
   why='Material currently known facts are sufficient for producer review or waiting.';
  }
 }
 return {build:EVIDENCE_SHADOW_BUILD,mode:'TEST_ONLY',workspace_id,profile_id,
  memory,shadow_code:next,reason:why,proposed_message:message,
  evidence_refs:memory.facts.renewal_date.evidence.map(x=>x.source_event_id),
  source_policy_code:probe.code,requires_producer_review:true,
  sms_send_authorized:false,provider_route_authorized:false,will_send:false,
  external_actions:0,provider_calls:0,messages_sent:0,writes:0};
}
