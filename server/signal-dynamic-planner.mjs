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

// Commitment-oriented engagement is an advisory C1 projection, not Decision 2 or an SMS sender.
export const ENGAGEMENT_PROPOSAL_BUILD='CF-SIGNAL-COMMITMENT-SHADOW-0.1';
export function proposeSignalEngagement(plan,{profile,contact={},now}={}){
  // Advisory on top of the current C1 action. Never execution authority or a new decision engine.
  if(!plan||plan.mode!=='SHADOW_ONLY'||plan.execution_eligibility?.sms!==false||plan.execution_eligibility?.call!==false||plan.execution_eligibility?.external!==false)
    throw Error('shadow_only_plan_required');
  if(!profile?.projection_version||plan.profile_version!==profile.projection_version||profile.as_of!==now||!Number.isFinite(Date.parse(now))||!profile.facts)
    throw Error('engagement_profile_revision_mismatch');
  const base={build:ENGAGEMENT_PROPOSAL_BUILD,mode:'SHADOW_ONLY',profile_version:profile.projection_version,
    source_action:plan.action,source_reason_category:plan.reason_category,strategy:'HOLD',next_step:'NONE',
    rationale:'No automatic customer outreach is authorized.',requires_canonical_review:false,
    producer_handoff:false,execution_eligibility:{sms:false,call:false,external:false,reason:'SHADOW_ONLY'},
    messages_sent:0,provider_calls:0,calendar_actions:0,model_calls:0};
  const result=(strategy,next_step,rationale,extra={})=>({...base,strategy,next_step,rationale,...extra});
  if(plan.held||['STOP','CLOSE','NO ACTION','HUMAN REVIEW'].includes(plan.action))
    return result('HOLD','NONE','Governed decision requires no outreach or a held producer review.');
  if(plan.action==='LATER')
    return result('WAIT','REEVALUATE_WHEN_DUE','Preserve the canonical wait/commitment instead of adding a message.');
  if(plan.action==='CALL')
    return result('HUMAN_HANDOFF','PRODUCER_CALL','The existing governed call decision outranks further qualification.',{producer_handoff:true});
  if(plan.action==='QUOTE PREPARATION')
    return result('HUMAN_HANDOFF','PRODUCER_QUOTE_REVIEW','Quote preparation/review outranks further scripted questions.',{producer_handoff:true});
  if(plan.action!=='ASK ONE QUESTION')
    return result('HOLD','NONE','Unrecognized governed action; no outreach candidate.');
  if(!Array.isArray(plan.contact_restrictions)||plan.contact_restrictions.length||contact.sms_permission!==true
    ||contact.verified_first_party_inquiry!==true||contact.acquisition_type!=='first_party')
    return result('HOLD','NONE','No verified first-party SMS route and owner context for this candidate.');
  const known=k=>profile.facts[k]?.status==='KNOWN'&&profile.facts[k]?.verification!=='inference';
  const pref=String(known('preferred_channel')?profile.facts.preferred_channel.value:contact.explicit_channel_preference||'').toUpperCase();
  if(pref==='EMAIL'||pref==='CALL')
    return result('HOLD','PRODUCER_CHANNEL_REVIEW','Honor recorded non-SMS channel preference; SMS proposal held.',{producer_handoff:true});
  if(pref==='TEXT'||pref==='SMS')
    return result('QUESTION_FIRST','ASK_ONE_MATERIAL_FACT','Customer requested text assistance; ask only the governed missing fact.');
  if(known('closing_date')&&typeof profile.facts.closing_date.value==='string'
    &&/^\d{4}-\d{2}-\d{2}$/.test(profile.facts.closing_date.value)){
    const closing=Date.parse(profile.facts.closing_date.value+'T00:00:00Z');
    const days=(closing-Date.parse(now))/86400000;
    if(Number.isFinite(days)&&days>=-1&&days<=14)
      return result('COMMITMENT_FIRST','PROPOSE_PRODUCER_HELP','Near-term closing merits commitment/handoff review before more intake.',{requires_canonical_review:true,producer_handoff:true});
  }
  return result('CHOICE_FIRST','PROPOSE_CALL_OR_TEXT_CHOICE','Offer an appropriate call/text path rather than requiring a multi-question interview.',{requires_canonical_review:true});
}
