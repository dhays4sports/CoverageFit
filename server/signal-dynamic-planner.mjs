// C1 deterministic internal planning only. No provider, scheduler, database or network imports.
export const PLANNER_BUILD='CF-SIGNAL-C1-1';
export function planSignal(profile,{
 now,contact={},population='DISTRICT_SIGNAL',workflowOwner='UNKNOWN',producerTakeover=false,
 commitments=[],timing={renewalWindowDays:30},closed=false
}={}){
 if(!profile?.projection_version||!Number.isFinite(Date.parse(now))||now!==profile.as_of)throw Error('invalid_or_stale_profile_clock');
 const facts=profile.facts;
 const known=field=>facts[field]?.status==='KNOWN'&&facts[field]?.verification!=='inference';
 const missing=['renewal_date','vehicle_count','homeowner'].filter(f=>!known(f));
 const refs=[...new Set(Object.values(facts).flatMap(f=>f.evidence||[]).map(e=>e.source_event_id))].sort();
 const restrictions=[...(contact.suppressed||contact.wrong_number?['SUPPRESSED']:[]),
  ...(contact.sms_permission!==true?['SMS_PERMISSION_UNVERIFIED']:[]),
  ...(contact.acquisition_type==='purchased'?['PURCHASED_LIST_SMS_BLOCKED']:[]),
  ...(workflowOwner!=='COVERAGEFIT_APPROVED'?['EXTERNAL_OR_UNKNOWN_WORKFLOW_OWNER']:[])];
 const result={build:PLANNER_BUILD,mode:'SHADOW_ONLY',profile_version:profile.projection_version,
  action:'NO ACTION',reason_category:'NO_JUSTIFIED_ACTION',reason:'Wait for meaningful evidence.',
  missing,question_field:null,evidence_refs:refs,producer_attention:false,held:false,
  next_evaluation_at:profile.next_change_at||profile.next_expiration_at||null,event_trigger:'NEW_EVIDENCE_OR_SAFETY_CHANGE',
  workflow_owner:workflowOwner,contact_restrictions:restrictions,
  execution_eligibility:{sms:false,call:false,external:false,reason:'SHADOW_ONLY'},
  messages_sent:0,provider_calls:0,external_actions:0};
 const done=(action,code,reason,extra={})=>({...result,action,reason_category:code,reason,...extra});
 if(contact.suppressed||contact.wrong_number)return done('STOP','CONTACT_SUPPRESSED','Preserve contact suppression.',{held:true,next_evaluation_at:null});
 if(['DISTRICT_CONTROL','CONTROL','TEST'].includes(population))return done('NO ACTION','CONTROL_OR_TEST','Excluded from intervention.',{held:true,next_evaluation_at:null});
 if(profile.identity_status!=='LINKED')return done('HUMAN REVIEW','IDENTITY_HOLD','Resolve the established identity link.',{held:true,producer_attention:true});
 if(producerTakeover)return done('NO ACTION','PRODUCER_TAKEOVER','Producer owns this conversation.',{held:true});
 if(closed)return done('CLOSE','CLOSED','No further qualification is justified.',{next_evaluation_at:null});
 if(profile.material_conflicts||facts.renewal_date?.status==='AMBIGUOUS')return done('HUMAN REVIEW','CONFLICTING_EVIDENCE','Resolve policy-specific conflicting evidence.',{held:true,producer_attention:true});
 if(contact.wait_until){
  if(!Number.isFinite(Date.parse(contact.wait_until)))return done('HUMAN REVIEW','INVALID_WAIT_TIME','Clarify the contact timing restriction.',{held:true,producer_attention:true});
  if(contact.wait_until>now)return done('LATER','CONTACT_WAIT','Respect the recorded contact timing restriction.',{next_evaluation_at:!result.next_evaluation_at||contact.wait_until<result.next_evaluation_at?contact.wait_until:result.next_evaluation_at,held:true});
 }
 const confirmed=commitments.filter(c=>c.confirmed===true&&c.evidence_ref&&c.status==='open');
 if(confirmed.some(c=>!Number.isFinite(Date.parse(c.at))))return done('HUMAN REVIEW','INVALID_COMMITMENT_TIME','Confirm the recorded commitment time.',{held:true,producer_attention:true});
 const next=[...confirmed].sort((a,b)=>a.at.localeCompare(b.at))[0];
 if(next){
  if(Date.parse(next.at)>Date.parse(now))return done('LATER','CONFIRMED_CALLBACK','Wait for the confirmed producer commitment.',{next_evaluation_at:!result.next_evaluation_at||next.at<result.next_evaluation_at?next.at:result.next_evaluation_at,evidence_refs:[...refs,next.evidence_ref]});
  return done('CALL','COMMITMENT_DUE','A confirmed producer callback is due.',{producer_attention:true,next_evaluation_at:null,evidence_refs:[...refs,next.evidence_ref]});
 }
 if(known('explicit_call_request')&&facts.explicit_call_request.value)return done('CALL','CUSTOMER_REQUESTED_CALL','Customer requested a call; producer review is warranted.',{producer_attention:true,next_evaluation_at:null});
 if(known('explicit_quote_request')&&facts.explicit_quote_request.value)return done('QUOTE PREPARATION','CUSTOMER_REQUESTED_QUOTE','Customer requested a quote; review known and missing facts.',{producer_attention:true,next_evaluation_at:null});
 if(known('renewal_date')){
  const renewal=facts.renewal_date.value;
  if(renewal.length===7)return done('HUMAN REVIEW','MONTH_PRECISION','Renewal month is known; exact timing needs producer review.',{producer_attention:true});
  const days=timing.renewalWindowDays;
  if(!Number.isInteger(days)||days<0||days>180)throw Error('invalid_timing_policy');
  const due=new Date(Date.parse(renewal+'T00:00:00Z')-days*86400000).toISOString();
  if(due>now)return done('LATER','RENEWAL_WINDOW','Known renewal is outside the configured review window.',{next_evaluation_at:!result.next_evaluation_at||due<result.next_evaluation_at?due:result.next_evaluation_at});
 }
 const stale=missing.find(f=>facts[f]?.status==='STALE');
 if(stale)return done('HUMAN REVIEW','STALE_FACT','Previously answered information is stale; review before asking again.',{producer_attention:true,question_field:null});
 if(missing.length)return done('ASK ONE QUESTION','MISSING_FACT','One material fact remains unknown.',{question_field:missing[0]});
 return done('QUOTE PREPARATION','QUALIFICATION_FACTS_PRESENT','Review known facts for quote preparation; this does not establish quote eligibility.',{producer_attention:true});
}
