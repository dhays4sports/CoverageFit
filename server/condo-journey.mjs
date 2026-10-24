// Customer-reported workflow context, never a policy-form or eligibility decision.
const o=(code,label,condo={},signals={})=>({code,label,condo,signals});
const question=(id,prompt,options)=>({id,prompt,options});
const windows=(renewal=false)=>[
 o(renewal?'within_14':'within_7',renewal?'Within 14 days':'Within 7 days',{timingWindow:renewal?'within_14':'within_7'},{decisionTiming:renewal?'within_14':'now_urgent'}),
 o(renewal?'days_15_30':'days_8_30',renewal?'Within 15–30 days':'Within 8–30 days',{timingWindow:renewal?'days_15_30':'days_8_30'},{decisionTiming:'within_30'}),
 o('days_31_60','Within 31–60 days',{timingWindow:'days_31_60'},{decisionTiming:'days_31_60'}),
 o('over_60','More than 60 days away',{timingWindow:'over_60'},{decisionTiming:'over_60'}),
 o('unknown',renewal?'Not sure':'Still searching / not sure',{timingWindow:'unknown'})];
export const CONDO_QUESTIONS={
 condo_need:question('condo_need','What brings you here for condo insurance?',[
 o('purchase','I’m buying a condo.',{reason:'purchase'},{reviewReason:'buying_condo'}),
 o('renewal','My policy is renewing or getting more expensive.',{reason:'renewal'},{reviewReason:'renewal_change'}),
 o('notice','I received a cancellation or non-renewal notice.',{reason:'notice'},{reviewReason:'nonrenewal_notice'}),
 o('coverage','I want to review my coverage or HOA gaps.',{reason:'coverage'},{reviewReason:'coverage_review'}),
 o('exploring','I’m just exploring options.',{reason:'exploring'},{shoppingIntent:'exploring'})].map(v=>({...v,signals:{product:'home',propertyType:'condo',...v.signals}}))),
 condo_closing:question('condo_closing','When are you hoping to close on the condo?',windows()),
 condo_renewal:question('condo_renewal','When does your policy renew?',windows(true)),
 condo_notice:question('condo_notice','What does the notice say?',[
 o('cancellation','Cancellation',{noticeType:'cancellation'}),o('nonrenewal','Non-renewal',{noticeType:'nonrenewal'}),o('unsure','I’m not sure',{noticeType:'unsure'})]),
 condo_ending:question('condo_ending','When is your current coverage due to end?',windows().map(v=>v.code==='unknown'?{...v,label:'Not sure — I need help checking'}:v)),
 condo_location:{...question('condo_location','What is the condo ZIP code?',[o('unknown','I don’t know yet',{propertyZip:'unknown'})]),input:'zip',hint:'A California ZIP helps Dylan prepare. No street address needed.'},
 condo_use:question('condo_use','How is the condo used, or how do you plan to use it?',[
 o('primary','I live there / will live there.',{propertyUse:'primary'}),o('rental','I rent it to a tenant.',{propertyUse:'rental'}),o('second_home','It’s a second or vacation home.',{propertyUse:'second_home'}),o('undecided','I haven’t decided yet.',{propertyUse:'undecided'}),o('unknown','Other / not sure.',{propertyUse:'unknown'})]),
 condo_identified:question('condo_identified','Have you identified a specific condo?',[
 o('yes','Yes, I have a condo in mind',{identifiedProperty:'yes'}),o('not_yet','Still looking',{identifiedProperty:'not_yet'})]),
 condo_comparison:question('condo_comparison','What would you like to compare?',[
 o('price','Premium',{concern:'price'}),o('coverage','Coverage',{concern:'coverage'}),o('both','Both premium and coverage',{concern:'both'})]),
 condo_concern:question('condo_concern','What would you most like help reviewing?',[
 o('interior','Interior improvements',{concern:'interior'}),o('belongings','Personal belongings',{concern:'belongings'}),o('liability','Personal liability',{concern:'liability'}),o('assessment','Loss assessment',{concern:'assessment'}),o('water','Water-related exposures',{concern:'water'}),o('hoa','HOA master-policy responsibilities',{concern:'hoa'}),o('general','General coverage / not sure',{concern:'general'})])
};
const labels={within_7:'within 7 days',days_8_30:'8–30 days',within_14:'within 14 days',days_15_30:'15–30 days',days_31_60:'31–60 days',over_60:'more than 60 days',unknown:'not established'};
export function condoFacts(r,now=new Date()){
 const c=r.condo||{},s=r.signals||{},window=c.timingWindow||s.decisionTiming||s.renewalTiming||'';
 let urgency=({within_7:'urgent',now_urgent:'urgent',within_14:'near_term',days_8_30:'near_term',days_15_30:'near_term',within_30:'near_term',days_31_60:'upcoming',over_60:'longer_term'})[window]||(c.reason==='notice'?'needs_confirmation':c.reason==='renewal'?'unknown':'exploratory');
 const closingDate=c.reason==='purchase'?s.closingDate||'':'';
 if(closingDate){const days=Math.ceil((Date.parse(closingDate+'T00:00:00Z')-now.getTime())/86400000);urgency=days<0?'needs_confirmation':days<=7?'urgent':days<=30?'near_term':days<=60?'upcoming':'longer_term';}
 const action=c.reason==='notice'?'Confirm notice type and coverage end date; review available options.':c.reason==='purchase'?'Confirm closing requirements and review condo insurance options.':c.concern==='hoa'?'Request HOA master-policy information for a personal review.':c.propertyUse==='rental'?'Confirm tenant occupancy and review appropriate coverage options.':c.reason==='renewal'?'Review renewal, premium and relevant coverage.':'Clarify coverage needs and arrange the requested personal follow-up.';
 return {...c,closingDate,timingWindow:window,urgency,nextAction:(urgency==='urgent'?'Urgent: ':'')+action};
}
export function condoDecision(r,now){
 const c=r.condo||{},s=r.signals||{};let id;
 if(!c.reason)id='condo_need';
 else if(c.reason==='notice'&&!c.noticeType)id='condo_notice';
 else if(['purchase','renewal','notice'].includes(c.reason)&&!c.timingWindow&&!s.decisionTiming&&!(c.reason==='purchase'&&s.closingDate)&&!(c.reason==='renewal'&&s.renewalTiming))id=c.reason==='purchase'?'condo_closing':c.reason==='renewal'?'condo_renewal':'condo_ending';
 else if(c.reason==='coverage'&&!c.concern)id='condo_concern';
 else if(c.reason!=='exploring'&&!c.propertyZip)id='condo_location';
 else if(!c.propertyUse)id='condo_use';
 else if(c.reason==='renewal'&&!c.concern)id='condo_comparison';
 else if(c.reason==='purchase'&&!c.identifiedProperty&&condoFacts(r,now).urgency!=='urgent'&&c.timingWindow!=='unknown')id='condo_identified';
 return {nextQuestionId:id,nextQuestion:CONDO_QUESTIONS[id]||null,publicExperience:{headline:'Let’s review your condo insurance options.',body:'Ask Dylan for a personal review. No street address, HOA documents or appointment is required to request help.'}};
}
export function condoSummary(r,now){
 const c=condoFacts(r,now),label=(id,code)=>CONDO_QUESTIONS[id].options.find(v=>v.code===code)?.label||'not yet known';
 return `Condo: ${label('condo_need',c.reason)} ${c.propertyZip&&c.propertyZip!=='unknown'?'ZIP '+c.propertyZip:'Location unknown'}. Use: ${label('condo_use',c.propertyUse)} ${c.noticeType?'Notice: '+c.noticeType+'. ':''}${c.closingDate?'Closing date: '+c.closingDate:'Estimated '+(c.reason==='purchase'?'closing':c.reason==='renewal'?'renewal':c.reason==='notice'?'coverage end':'timing')+': '+(labels[c.timingWindow]||'needs confirmation')}. Concern: ${c.concern?label(c.reason==='renewal'?'condo_comparison':'condo_concern',c.concern):'not specified'}. Priority: ${c.urgency}. Prefers ${r.contact?.mode||'not selected'}${r.contact?.contactTime?' / '+r.contact.contactTime:''}. ${c.nextAction}`;
}
export function condoQualified(r,now){const c=condoFacts(r,now);return Boolean(r.contact?.delivered&&c.reason&&c.reason!=='exploring'&&/^9\d{4}$/.test(c.propertyZip||'')&&['primary','rental','second_home'].includes(c.propertyUse));}
