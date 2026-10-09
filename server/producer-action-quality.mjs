// COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0
// Deterministic reconciliation of existing governed projections.
// This module grants no contact permission, does not mutate CRM/provider state,
// and does not replace Attention, Signal Decision 2, Opportunity Priority,
// Commitments, or NBA as their respective sources of truth.

export const PRODUCER_ACTION_QUALITY_VERSION='COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0';

const firstReason=a=>a?.reasons?.[0]||null;
const evidence=(kind,text,source_ref,extra={})=>({kind,text,source_ref:source_ref||{kind},...extra});
const action=(code,label,{channel=null,due_at=null,actionable=true,source='derived'}={})=>({code,label,channel,due_at,actionable,source});

function commitmentAction(commitment,attention){
 if(!commitment)return null;
 const due=commitment.due_at||commitment.due_date||attention?.due_at||null;
 const byType={
  CALLBACK:['CALL_BACK','Call back', 'CALL'],
  APPOINTMENT:['PREPARE_OR_HOLD_APPOINTMENT','Prepare for the scheduled conversation',null],
  FOLLOW_UP:['COMPLETE_FOLLOW_UP','Complete the recorded follow-up',null],
  QUOTE_REVIEW:['REVIEW_QUOTE','Review the quote with the customer',null],
  DOCUMENT_EXPECTED:['CHECK_EXPECTED_DOCUMENT','Check for the expected document',null],
  FUTURE_BIND:['RECONNECT_AT_AGREED_TIME','Reconnect at the agreed time',null],
  CLOSING:['ADVANCE_CLOSING','Advance the closing step',null],
  RENEWAL:['REVIEW_RENEWAL_TIMING','Review the renewal timing',null]
 };
 const v=byType[commitment.type]||['ADVANCE_COMMITMENT','Complete the recorded commitment',null];
 return action(v[0],v[1],{channel:v[2],due_at:due,source:'commitment'});
}

function signalAction(sms){
 if(!sms?.decision_2)return null;
 const facts=sms.facts||{},requests=sms.new_facts||{};
 if(sms.decision_2==='STOP')return action('DO_NOT_CONTACT','Do not contact',{actionable:false,source:'signal_decision_2'});
 if(sms.decision_2==='CLOSE')return action('CLOSE_NO_OUTREACH','Close this sales follow-up',{actionable:false,source:'signal_decision_2'});
 if(sms.decision_2==='LATER')return action('WAIT_UNTIL_RECORDED_TIME','Wait until the recorded follow-up time',{due_at:sms.future_date||sms.future_month||null,actionable:false,source:'signal_decision_2'});
 if(sms.decision_2==='ASK_ONE_QUESTION')return action('ASK_ONE_QUESTION',sms.reply||'Ask the next missing useful question',{channel:facts.preferred_channel||'SMS',source:'signal_decision_2'});
 if(sms.decision_2==='CALL'){
  if(requests.explicit_call_request||facts.explicit_call_request)return action('CALL_CUSTOMER','Call the customer',{channel:'CALL',source:'signal_decision_2'});
  if(requests.explicit_quote_request||facts.explicit_quote_request||sms.quote_ready)return action('PREPARE_OR_REVIEW_QUOTE','Prepare or review the quote, then respond',{source:'signal_decision_2'});
  if(facts.preferred_channel==='EMAIL')return action('EMAIL_CUSTOMER','Follow up by email',{channel:'EMAIL',source:'signal_decision_2'});
  return action('PRODUCER_REVIEW_AND_RESPOND','Review the reply and respond',{channel:facts.preferred_channel||null,source:'signal_decision_2'});
 }
 return null;
}

function nbaAction(nba){
 if(!nba)return null;
 const nonAction=new Set(['NO_ACTIVE_OPPORTUNITY','NO_ACTION_CLOSED','NO_ACTION_BOUND']);
 return action(nba.action||'REVIEW_NEXT_ACTION',nba.label||'Review the next action',{
  due_at:nba.dueAt||null,
  actionable:!nonAction.has(nba.action),
  source:'nba'
 });
}

function activeCommitment(commitments=[],attention){
 const ref=firstReason(attention)?.source_ref;
 if(ref?.kind==='task')return commitments.find(c=>c.source_ref?.kind==='task'&&c.source_ref?.id===ref.id)||null;
 if(ref?.kind==='calendar')return commitments.find(c=>c.source_ref?.kind==='calendar'&&c.source_ref?.id===ref.id)||null;
 return commitments
  .filter(c=>!['cancelled','completed','proposed'].includes(c.status)&&c.confirmation!=='evidence_only')
  .sort((a,b)=>String(a.due_at||a.due_date||'9999').localeCompare(String(b.due_at||b.due_date||'9999')))[0]||null;
}

export function deriveProducerActionQuality({
 population,attention=null,sms=null,commitments=[],opportunityPriority=null,nextBestAction=null,suppressed=false
}={}){
 if(population==='DISTRICT_CONTROL')return null;
 const reason=firstReason(attention);
 const support=[];
 if(attention)support.push(evidence('attention',reason?.text||attention.band,reason?.source_ref,{band:attention.band,rank:attention.rank}));
 if(sms?.decision_2)support.push(evidence('signal_decision_2',`Signal Decision 2: ${sms.decision_2}`,{kind:'sms_state'},{decision_2:sms.decision_2,reason:sms.reason||null}));
 const commitment=activeCommitment(commitments,attention);
 if(commitment)support.push(evidence('commitment',commitment.title||commitment.type,commitment.source_ref,{type:commitment.type,due_at:commitment.due_at||commitment.due_date||null,confirmation:commitment.confirmation}));
 if(opportunityPriority)support.push(evidence('opportunity_priority',`Opportunity Priority: ${opportunityPriority.queue||opportunityPriority.status||'unclassified'}`,{kind:'opportunity_priority'},{queue:opportunityPriority.queue||null,score:opportunityPriority.score??null,score_min:opportunityPriority.score_min??opportunityPriority.scoreMin??null,score_max:opportunityPriority.score_max??opportunityPriority.scoreMax??null}));
 if(nextBestAction)support.push(evidence('nba',nextBestAction.rationale||nextBestAction.label,{kind:'nba',engine:nextBestAction.engine},{action:nextBestAction.action,source:nextBestAction.source}));

 let exact;
 // Safety and explicit current conversation state always outrank derived work.
 if(suppressed||attention?.band==='SUPPRESSED'||sms?.decision_2==='STOP')exact=action('DO_NOT_CONTACT','Do not contact',{actionable:false,source:'contact_safety'});
 else if(sms?.decision_2==='CLOSE'||sms?.decision_2==='LATER')exact=signalAction(sms);
 // A due/overdue commitment can be the precise task even when Signal has no immediate direction.
 else if(['NOW','TODAY'].includes(attention?.band)&&commitment)exact=commitmentAction(commitment,attention);
 // Current SMS direction outranks older/generic NBA.
 else if(sms?.decision_2)exact=signalAction(sms);
 else if(commitment&&['NOW','TODAY','UPCOMING'].includes(attention?.band))exact=commitmentAction(commitment,attention);
 else exact=nbaAction(nextBestAction);

 const actionable=Boolean(attention?.actionable!==false&&exact?.actionable!==false&&exact);
 return {
  version:PRODUCER_ACTION_QUALITY_VERSION,
  actionable,
  why_now:reason?{band:attention.band,text:reason.text,source_ref:reason.source_ref,due_at:attention.due_at||null}:null,
  action:exact||action('NO_ACTION','No producer action due',{actionable:false}),
  evidence:support,
  precedence:[
   'contact_safety',
   'signal_stop_close_later',
   'due_commitment',
   'current_signal_decision_2',
   'upcoming_commitment',
   'nba'
  ]
 };
}
