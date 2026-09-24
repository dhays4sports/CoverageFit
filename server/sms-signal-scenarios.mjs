// Fictional fixtures shared by the authenticated simulator and acceptance tests.
import {decideSignal,observeOutbound} from './sms-signal-core.mjs';
const fresh='Hi Test, Dylan with Farmers. I just tried calling about the insurance request you sent in. Is this for auto, home, or both?';
const fresh2='Hi Test, just following up on your request. If it’s easier, we can handle most of this by text. Are you mainly looking at auto, home, or both?';
const aged='Are you still open to comparing your insurance, or are you all set now?';
const p2="Just closing the loop — if you'd still like me to take a look, reply YES. Otherwise I'll close this out.";
const quote='Wanted to make sure you saw the options I sent. Is the main question price, coverage, or timing?';
const sample=(id,label,outbound,inbound,expected,signal={})=>({id,label,previous_outbound:outbound,inbound,expected,signal});
export const SIGNAL_SCENARIOS=[
 sample('fresh1','Fresh #1 — line identified',fresh,'Auto',{decision_2:'ASK_ONE_QUESTION',source_template:'AZ-FRESH-01',az_recommended_stage:'ENGAGED'}),
 sample('fresh2-text','Fresh #2 — text path',fresh2,'Text is easier.',{decision_2:'ASK_ONE_QUESTION',reply_goal:'IDENTIFY_LINE'}),
 sample('fresh2-both','Fresh #2 — both',fresh2,'Both',{decision_2:'ASK_ONE_QUESTION',reply_goal:'DETECT_TIMING'}),
 sample('fresh-call','Fresh — call now',fresh2,'Call me now.',{decision_2:'CALL',priority:'URGENT'}),
 sample('fresh-close','Fresh — already insured',fresh2,'Already got insurance.',{decision_2:'CLOSE'}),
 sample('stop','Fresh — opt-out',fresh2,'STOP',{decision_2:'STOP',reply:''}),
 sample('aged-positive','Aged — positive',aged,'Sure, send me something.',{decision_2:'ASK_ONE_QUESTION',az_recommended_stage:'ENGAGED'}),
 sample('urgent','Cancellation — urgent',aged,'My policy cancels Friday.',{decision_2:'CALL',priority:'URGENT'}),
 sample('future','Future Bind — December',aged,'I just renewed. Call me in December.',{decision_2:'LATER',az_recommended_stage:'FUTURE_BIND'}),
 sample('negative','Aged — all set',aged,"I'm all set, thanks.",{decision_2:'CLOSE',az_recommended_stage:'CLOSED'}),
 sample('wrong','Wrong number',aged,'Wrong number.',{decision_2:'CLOSE',classification:'wrong_number',reply:''}),
 sample('wrong-name','Wrong person by name',aged,"This isn't Mike",{decision_2:'CLOSE',classification:'wrong_number'}),
 sample('farmers','Existing Farmers',aged,"I'm already with Farmers.",{decision_2:'CLOSE',classification:'existing_farmers'}),
 sample('automatic','Driving autoresponder',aged,"I'm Driving - Sent from My Car",{last_ignored:'automatic_response'}),
 sample('home','Contextual Home',fresh,'Home',{decision_2:'ASK_ONE_QUESTION'}),
 sample('payment','Payment due — price target',aged,"I pay my insurance tomorrow. If it's lower than $140 let me know.",{decision_2:'CALL',priority:'URGENT'}),
 sample('quote-price','Quote — price',quote,'Too expensive.',{decision_2:'ASK_ONE_QUESTION',quote_response:'PRICE'}),
 sample('quote-coverage','Quote — coverage',quote,'Does this cover water damage?',{decision_2:'CALL',quote_response:'COVERAGE'}),
 sample('quote-timing','Quote — timing',quote,'I will switch when I renew in December.',{decision_2:'LATER',quote_response:'TIMING'}),
 sample('quote-ready','Quote — ready',quote,'Ready to bind.',{decision_2:'CALL',quote_response:'READY'}),
 sample('quote-decline','Quote — decline',quote,'Not interested.',{decision_2:'CLOSE',quote_response:'DECLINE'}),
 sample('quote-question','Quote — question',quote,'How does this work?',{decision_2:'CALL',quote_response:'QUESTION'}),
 {...sample('duplicate','Duplicate inbound replay',aged,'Yes',{decision_2:'ASK_ONE_QUESTION'}),replay:true},
 {...sample('mismatch','Engaged → aged Probe 2 collision',aged,'Yes',{stage_mismatch:true}),later_outbound:p2},
 {...sample('fresh-mismatch','Engaged → Fresh #2 collision',fresh,'Auto',{stage_mismatch:true}),later_outbound:fresh2},
 sample('reactivation','Future reactivation — remembered context','You asked me to check back. Is this still a good time?','Yes',{decision_2:'CALL'},{facts:{line:'AUTO',current_carrier:'GEICO',current_premium:280,timing:{raw:'renewal in December',month:'2026-12',days:68},shopping_reason:'price'},future_month:'2026-12'})
];
export function simulateScenario(id,templates,now){
 const item=SIGNAL_SCENARIOS.find(s=>s.id===id);if(!item)throw Error('Unknown synthetic scenario');
 let c={id:'synthetic-only',signal:structuredClone(item.signal),transcript:[]};
 c=observeOutbound(c,{body:item.previous_outbound,messageId:'synthetic-out',occurredAt:now},templates).conversation;
 const seen=new Set(),trace=[];
 for(const messageId of item.replay?['synthetic-in','synthetic-in']:['synthetic-in']){
  if(seen.has(messageId)){trace.push({event:'duplicate_skipped',message_id:messageId});continue;}
  seen.add(messageId);c=decideSignal(c,item.inbound,{templates,now,messageId});trace.push({event:'decision_2_selected',message_id:messageId,decision_2:c.signal.decision_2||null});
 }
 if(item.later_outbound){const out=observeOutbound(c,{body:item.later_outbound,messageId:'synthetic-later-out',occurredAt:now},templates);c=out.conversation;trace.push({event:out.mismatch?'stage_mismatch_detected':'template_matched'});}
 const checks=Object.entries(item.expected).map(([field,expected])=>({field,expected,actual:c.signal[field]??null,pass:c.signal[field]===expected}));
 return {conversation:c,trace,checks,passed:checks.every(x=>x.pass),processed_inbounds:seen.size,sends:0,note:'Isolated synthetic state; no provider or database mutation. Duplicate webhook persistence is tested separately through the real handler.'};
}
