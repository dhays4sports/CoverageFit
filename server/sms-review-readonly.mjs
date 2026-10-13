// SMS-REVIEW-READONLY-0.1 — selected review without permission inference or sends.
const MAX=10;
const safe=x=>typeof x==='string'?x:'';
export function selectedIds(raw){
 if(typeof raw!=='string'||raw.length>1800)throw Error('invalid_selection');
 const values=raw.split(',').filter(Boolean);
 if(!values.length||values.length>MAX||new Set(values).size!==values.length
  ||values.some(x=>x.length>128||!/^[a-zA-Z0-9._:-]+$/.test(x)))throw Error('invalid_selection');
 return values;
}
export function projectSelectedReview(detail){
 const op=detail?.opportunity||{};
 const pop=detail?.population?.population;
 const sms=detail?.sms;
 const suppressed=detail?.contactSafety?.suppressed===true;
 const held=pop!=='DISTRICT_SIGNAL'||suppressed||sms?.contact_suppressed===true
  ||sms?.decision_2==='STOP'||sms?.decision_2==='CLOSE'||sms?.decision_2==='LATER'
  ||sms?.human_active===true||sms?.automation_lock===true;
 const pending=sms?.draft_status==='pending'&&Number.isSafeInteger(sms?.revision);
 const reason=pop!=='DISTRICT_SIGNAL'?'NOT_SIGNAL_ENROLLED'
  :suppressed||sms?.contact_suppressed||sms?.decision_2==='STOP'?'CONTACT_SUPPRESSED'
  :sms?.human_active||sms?.automation_lock?'PRODUCER_TAKEOVER'
  :sms?.draft_status==='delivery_review'||sms?.draft_status==='sending'?'DELIVERY_UNCERTAIN'
  :!pending?'NO_CURRENT_PENDING_DRAFT'
  :held?'DECISION_NOT_CONTACTABLE'
  :!safe(sms.reply).trim()?'DRAFT_BODY_MISSING':'ELIGIBILITY_NOT_VERIFIED';
 const editable=reason==='ELIGIBILITY_NOT_VERIFIED';
 return {
  opportunity_id:op.id,display_name:safe(op.contact?.name).slice(0,120)||'Unnamed opportunity',
  population:pop,conversation_id:safe(sms?.conversation_id)||null,
  current_revision:Number.isSafeInteger(sms?.revision)?sms.revision:null,
  decision_2:safe(sms?.decision_2)||null,
  draft_body:editable?safe(sms?.reply).slice(0,1600):'',
  // Draft can be viewed/edited locally, but never persisted or sent from this endpoint.
  can_review:editable,
  reason,send_eligibility:'NOT_VERIFIED',send_authorized:false,
  can_approve:false,can_send:false,read_only:true
 };
}
export async function selectedReviewSnapshot(repo,env,ids){
 const {producerWorkspace}=await import('./producer-workspace.mjs');
 const p=producerWorkspace(repo,env);
 const out=[];
 // Re-fetch each selected item independently, preserving the canonical identity,
 // cohort and suppression checks from current Work. Never accept caller-supplied draft bodies.
 for(const id of ids){
  try{
   const d=await p.detail(id);
   const item=projectSelectedReview(d);
   out.push(item);
  }catch(e){
   if(/unavailable|not found|not_found|not_owned/i.test(String(e?.message||''))){
    out.push({opportunity_id:id,can_review:false,reason:'UNAVAILABLE_OR_NOT_OWNED',can_approve:false,can_send:false,read_only:true});
   }else throw e;
  }
 }
 return {version:'SMS-REVIEW-READONLY-0.1',count:out.length,max_selected:MAX,
  send_authority:'NONE',provider_inbound_live_certified:false,items:out};
}
