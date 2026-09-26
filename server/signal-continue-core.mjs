import {deriveSignalDecision} from './signal-decision-core.mjs';
import {randomBase64Url,sha256Hex} from './runtime-crypto.mjs';

export const CONTINUE_KIND='signal_continue_v1';
export const CONTINUE_TTL=7*86400000;
export const CONTINUE_MAX_ANSWERS=6;
export const CONTINUE_TOKEN=/^[A-Za-z0-9_-]{43}$/;
export const newContinueToken=()=>randomBase64Url(32);
export const continueKey=async token=>CONTINUE_TOKEN.test(token||'')?'signal-continue/'+await sha256Hex(token):null;
export const continueUrl=token=>CONTINUE_TOKEN.test(token||'')?'https://coveragefit.com/s/'+token:null;
export function validContinueSession(s,now=Date.now()){
 return !!s&&s.scope===CONTINUE_KIND&&!s.revoked_at&&Number.isFinite(Date.parse(s.expires_at))&&Date.parse(s.expires_at)>now;
}

// A producer-observed interrupted discovery is an explicit prerequisite, not
// inferred buying intent. A clear next action always takes precedence.
export function continueEligibility({population,owner,cohort,facts={},signal={},status,activeFirstParty=false,trigger,interestConfirmed=false,producerChosen=false}){
 const no=reason=>({eligible:false,reason});
 if(cohort==='CONTROL'||population==='DISTRICT_CONTROL'||owner==='DISTRICT_CONTROL')return no('CONTROL does not receive Signal treatment.');
 if(!['DISTRICT_SIGNAL','WEB_DIRECT'].includes(population))return no('This population is not supported.');
 if(!['DISTRICT_SIGNAL','FIRST_PARTY_408','PRODUCER_OWNED'].includes(owner))return no('Explicit conversation ownership is required.');
 if(owner==='PRODUCER_OWNED'&&!producerChosen)return no('The producer must explicitly choose this continuation.');
 if(activeFirstParty)return no('Resume the existing first-party journey.');
 if(status==='closed'||facts.opt_out||facts.wrong_number||facts.existing_farmers||signal.contact_suppressed||['STOP','CLOSE'].includes(signal.decision_2))return no('Sales continuation is unavailable.');
 if(facts.callback_date||facts.future_date_type==='requested_callback'||facts.explicit_call_request||facts.explicit_quote_request||signal.quote_ready||['HIGH','URGENT'].includes(signal.priority)||signal.decision_2==='CALL')return no('Preserve the producer call, callback, or quote action.');
 if(signal.decision_2==='LATER'||facts.future_date||signal.future_date||signal.future_month)return no('Preserve the established Future Bind timing.');
 if(signal.context_error)return no('Resolve missing conversation context first.');
 if(signal.human_required&&signal.classification!=='review')return no('Licensed producer review comes first.');
 if(!['AUTO','HOME','HOME_AUTO'].includes(facts.line))return no('V1 requires a known personal-lines product.');
 if(!['busy','limited_time','async_requested','send_something','interested_not_ready'].includes(trigger)||!interestConfirmed||!producerChosen)return no('Confirm interest, missing evidence, and the prospect’s preference to continue asynchronously.');
 return {eligible:true,reason:'Producer-selected bridge for unfinished discovery.'};
}

export function continueSignals(facts={},fresh={},now=new Date()){
 const out={product:facts.line==='AUTO'?'auto':'home',...fresh};
 const date=facts.renewal_date||facts.closing_date;
 if(!out.decisionTiming&&date){const days=Math.ceil((Date.parse(date)-now.getTime())/86400000);if(days>=0)out.decisionTiming=days<=14?'within_14':days<=30?'within_30':days<=60?'days_31_60':'future';}
 if(!out.decisionTiming&&facts.timing?.date&&facts.timing.date!==date)return continueSignals({...facts,renewal_date:facts.timing.date},out,now);
 if(facts.shopping_reason&&!out.autoNeed&&!out.reviewReason&&!out.statedTrigger){
  if(facts.shopping_reason==='cancellation_nonrenewal')out[out.product==='auto'?'autoNeed':'reviewReason']=out.product==='auto'?'cancellation':'nonrenewal_notice';
  else if(facts.shopping_reason==='active_shopping')out.shoppingIntent='actively_comparing';
  else if(/price|renewal/i.test(facts.shopping_reason))out[out.product==='auto'?'autoNeed':'reviewReason']=out.product==='auto'?'renewal_price':'renewal_change';
 }
 return out;
}

export function continueStep(signals,answered=0,now=new Date()){
 const done=(decision,priority='LOW',reason='Enough evidence to choose the next action.')=>({done:true,decision_2:decision,priority,reason,recommended_az_stage:{CALL:'ENGAGED',LATER:'FUTURE_BIND',CLOSE:'CLOSED',STOP:'STOP'}[decision]});
 if(signals.autoNeed==='cancellation'||signals.autoNeed==='need_now'||signals.reviewReason==='nonrenewal_notice')return done('CALL','URGENT','Immediate coverage need requires Dylan.');
 if(signals.reviewReason==='coverage_review'||signals.autoNeed==='coverage_change')return done('CALL','HIGH','A licensed coverage discussion is the next action.');
 if(['not_interested','researching'].includes(signals.shoppingIntent))return done('LATER','LOW','No present shopping commitment; preserve later potential.');
 if(signals.shoppingIntent&&['future','later','over_90'].includes(signals.decisionTiming))return done('LATER','MEDIUM','Future timing established.');
 const result=deriveSignalDecision({signalSessionId:'continue_server_session',flowId:'signal_continue',canonicalSignals:signals},now).public;
 if(result.decision==='OFFER_HUMAN')return done('CALL','HIGH');
 if(result.decision!=='ASK_ONE_SIGNAL')return done('LATER');
 if(answered>=CONTINUE_MAX_ANSWERS)return done('CALL','MEDIUM','Question ceiling reached; producer review.');
 return {done:false,decision_2:'ASK_ONE_QUESTION',question:result.nextQuestion};
}

export function applyContinueChoice(signals,question,code){
 const option=question?.options?.find(x=>x.code===code);
 if(!option)throw Object.assign(new Error('Refresh the current question before answering.'),{status:409,code:'question_changed'});
 return {...signals,...option.signals};
}
export const continueCompletion=decision=>decision==='STOP'?'Your contact opt-out has been saved.':decision==='CLOSE'?'Thanks — your preference has been saved.':decision==='CALL'?'Thanks — Dylan has what he needs. He’ll follow up with you personally.':decision==='LATER'?'Thanks — your answers and timing were saved. Dylan can pick up from here when it makes sense.':'Thanks — your answers were saved.';
