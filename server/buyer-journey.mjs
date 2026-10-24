// Buyer questions use the existing versioned journey and producer projection.
// These are workflow facts, never underwriting/eligibility decisions.
import {SIGNAL_QUESTION_LIBRARY} from './signal-decision-core.mjs';
const option=(code,label,signals={},buyer={})=>({code,label,signals,buyer});
export const BUYER_QUESTIONS={
 buyer_need:SIGNAL_QUESTION_LIBRARY.buyer_need,
 buyer_timing:{id:'buyer_timing',prompt:'When are you hoping to close on your home?',options:[
  option('within_7','Within 7 days',{decisionTiming:'now_urgent'},{closingWindow:'within_7'}),
  option('days_8_30','Within 8–30 days',{decisionTiming:'within_30'},{closingWindow:'days_8_30'}),
  option('days_31_60','Within 31–60 days',{decisionTiming:'days_31_60'},{closingWindow:'days_31_60'}),
  option('over_60','More than 60 days away',{decisionTiming:'over_60'},{closingWindow:'over_60'}),
  option('searching','Still searching / not sure yet',{}, {closingWindow:'searching',identifiedProperty:'not_yet'})]},
 buyer_location:{id:'buyer_location',prompt:'What is the property ZIP code?',input:'zip',hint:'A California ZIP helps Dylan prepare. No street address needed.',options:[option('unknown','I don’t know yet',{}, {propertyZip:'unknown'})]},
 buyer_property:{id:'buyer_property',prompt:'What type of home are you considering?',options:[
  option('single_family','Single-family home',{propertyType:'single_family'}),option('condo','Condominium',{propertyType:'condo'}),
  option('townhome','Townhome / PUD',{propertyType:'townhome'}),option('unsure','Other / not sure',{propertyType:'unsure'})]},
 buyer_identified:{id:'buyer_identified',prompt:'Have you identified a specific property?',options:[
  option('yes','Yes, I have a property in mind',{}, {identifiedProperty:'yes'}),option('not_yet','Still looking',{}, {identifiedProperty:'not_yet'})]}
};
export function buyerFacts(record,now=new Date()){
 const b=record.buyer||{},s=record.signals||{};
 let urgency=({within_7:'urgent',days_8_30:'near_term',days_31_60:'upcoming',over_60:'longer_term',searching:'exploratory'})[b.closingWindow]||'unknown';
 if(s.closingDate){const days=Math.ceil((Date.parse(s.closingDate+'T00:00:00Z')-now.getTime())/86400000);urgency=days<0?'needs_confirmation':days<=7?'urgent':days<=30?'near_term':days<=60?'upcoming':'longer_term';}
 const nextAction=urgency==='urgent'?'Prioritize a personal response; confirm closing date and property details.':urgency==='exploratory'?'Arrange a low-pressure follow-up using the requested channel.':'Review the request and confirm property and timing details.';
 return {...b,closingDate:s.closingDate||'',propertyType:s.propertyType||'',urgency,nextAction};
}
export function buyerDecision(record,now){
 const s=record.signals,b=record.buyer||{},answered=id=>record.answers.some(a=>a.questionId===id);
 let q;
 if(!s.reviewReason&&!s.statedTrigger&&!answered('buyer_need'))q=BUYER_QUESTIONS.buyer_need;
 else if(!s.closingDate&&!s.decisionTiming&&!b.closingWindow)q=BUYER_QUESTIONS.buyer_timing;
 else if(!b.propertyZip)q=BUYER_QUESTIONS.buyer_location;
 else if(!s.propertyType&&b.closingWindow!=='searching')q=BUYER_QUESTIONS.buyer_property;
 else if(!b.identifiedProperty&&b.closingWindow!=='within_7')q=BUYER_QUESTIONS.buyer_identified;
 return {nextQuestionId:q?.id,nextQuestion:q||null,publicExperience:{headline:'Let’s review your next steps.',body:'Ask Dylan to follow up using your preferred channel. No appointment or street address is required.'},buyer:buyerFacts(record,now)};
}
export function buyerSummary(record,now){
 const b=buyerFacts(record,now),intent=record.answers.find(a=>a.questionId==='buyer_need');
 const need=BUYER_QUESTIONS.buyer_need.options.find(o=>o.code===intent?.optionCode)?.label||record.signals.reviewReason||'review requested';
 return `Homebuyer: ${need}. ${b.propertyZip&&b.propertyZip!=='unknown'?'ZIP '+b.propertyZip:'Location not yet known'}. ${b.propertyType||'Property type unknown'}. ${b.closingDate?'Closing date '+b.closingDate:b.closingWindow?'Estimated closing window: '+b.closingWindow:'Closing timing needs confirmation'}. Priority: ${b.urgency}. Prefers ${record.contact?.mode||'contact channel not selected'}${record.contact?.contactTime?' / '+record.contact.contactTime:''}. ${b.nextAction}`;
}
