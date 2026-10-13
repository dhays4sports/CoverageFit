// ENGAGEMENT-SHADOW-0.1 — deterministic proposals only; zero external operations.
// Shadow outcome is never permission to send or a provider-eligibility grant.
const CODES=Object.freeze({
 SUPPRESSED:'HOLD_SUPPRESSED',CONTROL:'HOLD_CONTROL',TEST:'HOLD_TEST',
 PURCHASED:'HOLD_PURCHASED_LIST_ROUTE',UNKNOWN:'HOLD_NO_POSITIVE_PERMISSION',
 CONFLICT:'REVIEW_RENEWAL_CONFLICT',CALL:'PRODUCER_CALL_REQUESTED',
 ASK:'PROPOSE_ASK_RENEWAL',WAIT:'WAIT_FOR_TIMING',
 FOLLOWUP:'PRODUCER_CONFIRMED_FOLLOWUP',REVIEW:'PRODUCER_REVIEW'
});
const clean=x=>typeof x==='string'?x.trim():'';
export function simulateEngagement({prospect=null,sms=null,source=null,now=new Date()}={}){
 const population=clean(prospect?.population)||'OTHER';
 const suppressed=prospect?.facts?.contact_safety?.suppressed===true
  ||sms?.contact_suppressed===true||sms?.decision_2==='STOP'||sms?.smsConsent?.status==='opted_out'
  ||source?.opted_out===true||source?.wrong_number===true;
 const purchased=['purchased','third_party_generated','vendor_list'].includes(source?.acquisition_type);
 const isTest=source?.synthetic===true||source?.pilot_phase==='TEST';
 const renewal=prospect?.facts?.renewal||{};
 const decision=clean(sms?.decision_2);
 const timed=(prospect?.commitments||[]).filter(x=>x?.actionable===true&&['CALLBACK','FOLLOW_UP','QUOTE_REVIEW'].includes(x.type))
  .some(x=>x.due_at||x.due_date);
 const output={
  build:'ENGAGEMENT-SHADOW-0.1',mode:'SHADOW_ONLY',
  intent:decision||'UNKNOWN',renewal:renewal.lifecycle||'UNKNOWN',
  // No channel permission is carried from a proposal into real outbound controls.
  sms_send_authorized:false,provider_route_authorized:false,will_send:false,
  messages_sent:0,provider_calls:0,writes:0,
  requires_producer_review:true,
  code:CODES.REVIEW,reason:'Current evidence needs producer review.',
  proposed_message:null
 };
 const set=(code,reason,message=null)=>({...output,code,reason,proposed_message:message});
 if(isTest)return set(CODES.TEST,'Synthetic/TEST records cannot enter live engagement.');
 if(population==='DISTRICT_CONTROL')return set(CODES.CONTROL,'CONTROL cannot receive SIGNAL automation treatment.');
 if(suppressed)return set(CODES.SUPPRESSED,'Contact suppression or STOP outranks all sales signals.');
 if(purchased)return set(CODES.PURCHASED,'Purchased and third-party lists are not authorized RingCentral SMS acquisition routes.');
 // The simulator is stricter than legacy manual one-to-one workflows:
 // vendor proof or a vague consent status cannot establish provider-specific permission.
 if(source?.permission_verified!==true||source?.provider_route_verified!==true)
  return set(CODES.UNKNOWN,'No positive evidence of the recipient, campaign and provider route together.');
 if(renewal.conflict)return set(CODES.CONFLICT,'Renewal timing evidence conflicts; verify before engagement.');
 if(decision==='CALL')return set(CODES.CALL,'Customer explicitly requested a call; assign to producer, do not auto-text.');
 if(timed)return set(CODES.FOLLOWUP,'An existing confirmed producer commitment needs attention, not an automatic text.');
 if(decision==='ASK_ONE_QUESTION'&&renewal.verification==='unknown')
  return set(CODES.ASK,'Potential next qualification question for separate approval.',
   'When does your current insurance policy renew?');
 if(renewal.lifecycle==='UPCOMING'||renewal.lifecycle==='WINDOW_OPEN')
  return set(CODES.REVIEW,'Renewal opportunity for permitted-channel producer review.');
 if(decision==='LATER'||renewal.lifecycle==='CANDIDATE')
  return set(CODES.WAIT,'Provisional or future timing needs verification before contact.');
 return set(CODES.REVIEW,'Insufficient actionable customer evidence for an automated step.');
}
export function simulateEngagementBatch(records,{max=100}={}){
 if(!Array.isArray(records)||records.length>Math.min(Math.max(Number(max)||100,1),1000))
  throw Error('shadow_batch_limit');
 const outcomes=records.map(x=>simulateEngagement(x));
 const counts={};for(const o of outcomes)counts[o.code]=(counts[o.code]||0)+1;
 return {build:'ENGAGEMENT-SHADOW-0.1',mode:'SHADOW_ONLY',evaluated:outcomes.length,
  counts,results:outcomes,external_actions:0,provider_calls:0,messages_sent:0};
}
