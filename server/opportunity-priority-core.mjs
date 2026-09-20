const CAPS=Object.freeze({need:25,intent:30,timing:25,fit:20});
export const PRIORITY_BUILD='CF-OPPORTUNITY-PRIORITY-1.0';
export const PRIORITY_QUEUES=Object.freeze(new Set(['unclassified','shoot_now','quick_play','develop','nurture','low_priority']));
const QUEUE_LABELS=Object.freeze({
  unclassified:'Unclassified',
  shoot_now:'🔥 Shoot now',
  quick_play:'⚡ Quick play',
  develop:'🏀 Develop',
  nurture:'🌱 Nurture',
  low_priority:'⬇ Low priority'
});
const PROHIBITED_INPUTS=Object.freeze([
  'age','race','ethnicity','religion','sex','sexual_orientation','health_information',
  'credit','household_income','inferred_affluence','behavioral_propensity'
]);
const clean=(value,max=240)=>String(value??'').trim().replace(/[<>\u0000-\u001f\u007f]/g,'').slice(0,max);
const lower=(value,max=240)=>clean(value,max).toLowerCase();
const parseDate=value=>Number.isFinite(Date.parse(value))?new Date(value):null;
const daysBetween=(a,b)=>Math.ceil((b.getTime()-a.getTime())/86400000);
const latest=(items=[])=>[...items].sort((a,b)=>String(b?.updated_at||b?.updatedAt||'').localeCompare(String(a?.updated_at||a?.updatedAt||'')))[0]||null;

function reason(points,code,label,{evidence='',evidenceRef='',source='derived',observedAt=null,expiresAt=null}={}){
  return Object.freeze({points,code,label,evidence:clean(evidence,240),evidenceRef:clean(evidenceRef,240),source,observedAt,expiresAt});
}
function dimension(name,candidates=[]){
  const cap=CAPS[name];
  const usable=candidates.filter(item=>item&&Number.isFinite(item.points)&&item.points>=0&&item.points<=cap)
    .sort((a,b)=>b.points-a.points||String(a.code).localeCompare(String(b.code)));
  if(!usable.length)return Object.freeze({name,cap,status:'unknown',points:null,reasons:[]});
  const top=usable[0];
  const supporting=usable.filter((item,index)=>index===0||item.code!==top.code).slice(0,5);
  return Object.freeze({name,cap,status:'known',points:top.points,reasons:supporting});
}
function queueForScore(score){
  if(score>=80)return 'shoot_now';
  if(score>=65)return 'quick_play';
  if(score>=50)return 'develop';
  if(score>=30)return 'nurture';
  return 'low_priority';
}
function contextFromSources(sources=[]){
  const leads=sources.filter(source=>source?.kind==='lead'&&source?.summary);
  const lead=latest(leads);
  return {lead,context:lead?.summary?.context||{},attribution:lead?.summary?.attribution||{},consent:lead?.summary?.consent||{}};
}
function activeAppointment(sources=[]){
  return sources.map(source=>source?.kind==='calendar'?source?.summary:source?.summary?.appointment)
    .filter(item=>item?.status==='scheduled'&&parseDate(item.start||item.scheduledStart))
    .sort((a,b)=>Date.parse(a.start||a.scheduledStart)-Date.parse(b.start||b.scheduledStart))[0]||null;
}
function productTrack(opportunity={},context={}){
  const explicit=lower(context.reviewTrack||context.productTrack,80);
  if(/life/.test(explicit))return 'life';
  if(/auto/.test(explicit))return 'auto';
  if(/business|commercial/.test(explicit))return 'business';
  if(/condo|home|landlord|nonrenewal|property/.test(explicit))return 'home';
  const blob=lower(`${opportunity.products||''} ${opportunity.reason||''}`,500);
  if(/\blife\b/.test(blob))return 'life';
  if(/\bauto\b|vehicle/.test(blob))return 'auto';
  if(/commercial|business|workers comp|general liability|bop/.test(blob))return 'business';
  if(/home|condo|landlord|dwelling|property/.test(blob))return 'home';
  return 'unknown';
}
function textBlob(opportunity={},context={}){
  return lower([
    opportunity.reason,opportunity.products,context.reviewReason,context.reviewContext,
    context.autoNeed,context.lifeGoal,context.lifeCoverageStatus,context.lifeProtectionTrigger,context.shoppingIntent,context.statedTrigger,context.businessNeed,context.businessType
  ].filter(Boolean).join(' '),1200);
}
function reviewReason(context={}){return lower(context.reviewReason,80).replace(/[\s-]+/g,'_');}
function timingToken(context={}){return lower(context.decisionTiming||context.renewalTiming,80).replace(/[\s-]+/g,'_');}

function needCandidates(track,opportunity,context,lead){
  const why=reviewReason(context),blob=textBlob(opportunity,context),ref=lead?`lead:${lead.source_id}`:'opportunity:record',at=lead?.updated_at||opportunity.updated_at||opportunity.created_at||null;
  const out=[];
  const push=(points,code,label,evidence)=>out.push(reason(points,code,label,{evidence,evidenceRef:ref,source:lead?'customer_reported':'producer_recorded',observedAt:at}));

  if(/nonrenewal|non-renewal|cancellation|cancelled|canceled/.test(blob)||why==='nonrenewal_notice')push(25,'coverage_disruption','Coverage disruption or nonrenewal is the stated reason for review.',why||'nonrenewal/cancellation');
  if(/lender|required|requirement|certificate|\bcoi\b|contract requires|lease requires/.test(blob))push(25,'external_requirement','A lender, contract, lease, or certificate requirement is driving the request.','stated requirement');
  if(/buying|purchase|under contract|closing/.test(blob)||/buying_/.test(why))push(23,'transaction_trigger','A purchase or closing transaction creates a concrete protection need.',why||'purchase/closing');
  if(/premium.*(increase|up|jump)|rate.*(increase|up)|renewal_change/.test(blob)||why==='renewal_change')push(18,'material_renewal_change','A material renewal or premium change is driving the review.',why||'renewal change');
  if(/coverage gap|not enough|underinsured|only through work|employer only|no life|no coverage/.test(blob))push(25,'explicit_protection_gap','The prospect explicitly described a protection gap.','stated protection gap');

  if(track==='life'){
    const coverage=lower(context.lifeCoverageStatus,80).replace(/[\s-]+/g,'_');
    if(['none','no_personal','no_personal_coverage'].includes(coverage))push(25,'life_no_personal_coverage','The prospect reports no personally owned life coverage.',coverage);
    else if(['employer_only','work_only','through_work_only'].includes(coverage))push(23,'life_employer_only','The prospect reports relying on employer-provided life coverage only.',coverage);
    else if(['unsure','unknown'].includes(coverage))push(12,'life_coverage_unsure','The prospect is unsure what personal life coverage is in force.',coverage);
    const trigger=lower(context.lifeProtectionTrigger,120);
    if(trigger&&/mortgage|child|dependent|income|family|business|key_person|final/.test(trigger))push(22,'life_trigger','The prospect identified a concrete protection trigger.',trigger);
    const goal=lower(context.lifeGoal,120);
    if(goal){
      if(/mortgage|income|family|child|dependent|final|business|key person/.test(goal))push(22,'life_protection_goal','A concrete life-protection goal is already stated.',goal);
      else push(15,'life_review_goal','The prospect stated a life-insurance goal.',goal);
    }
  }
  if(track==='auto'){
    const need=lower(context.autoNeed,120);
    if(need){
      if(/new_vehicle|new vehicle|add_driver|add driver|teen|financ|lease|lapse|cancellation/.test(need))push(22,'auto_change_trigger','A vehicle, driver, financing, or coverage change creates a concrete auto need.',need);
      else push(14,'auto_review_need','The prospect stated an auto-insurance reason for review.',need);
    }
  }
  if(track==='business'){
    const need=lower(context.businessNeed,120);
    if(need){
      if(/coi|certificate|contract|lease|lender|opening|new business|hiring|workers/.test(need))push(23,'business_transaction_need','A business transaction or operating change creates a concrete coverage need.',need);
      else push(15,'business_review_need','The prospect stated a commercial-insurance reason for review.',need);
    }
  }
  if(track==='home'&&why==='coverage_review')push(14,'explicit_home_review','The prospect explicitly requested a home coverage review.',why);
  if(track==='home'&&why==='shopping_price')push(10,'home_comparison_interest','The prospect is actively comparing home pricing.',why);
  return out;
}

function ageDays(value,now){
  const parsed=parseDate(value);
  if(!parsed)return null;
  return Math.max(0,daysBetween(parsed,now));
}
function intentCandidates(opportunity,tasks,sources,context,lead,now){
  const out=[],at=lead?.updated_at||opportunity.updated_at||opportunity.created_at||null,ref=lead?`lead:${lead.source_id}`:'opportunity:record',leadAge=ageDays(at,now);
  const task=(min)=>tasks.find(item=>Number(item?.priority||0)>=min&&!['completed','cancelled'].includes(item?.state));
  const proceed=task(100),question=task(90),contact=tasks.find(item=>Number(item?.priority||0)>=70&&/requested contact|contact request/i.test(item?.title||''));
  if(proceed)out.push(reason(30,'explicit_proceed','The client explicitly asked to proceed.',{evidence:proceed.title,evidenceRef:`task:${proceed.id}`,source:'explicit_client_response',observedAt:proceed.created_at||null}));
  if(question)out.push(reason(28,'active_client_question','A client question is waiting for a human response.',{evidence:question.title,evidenceRef:`task:${question.id}`,source:'explicit_client_response',observedAt:question.created_at||null}));
  if(contact)out.push(reason(27,'explicit_contact_request','The customer explicitly requested producer contact.',{evidence:contact.title,evidenceRef:`task:${contact.id}`,source:'explicit_client_response',observedAt:contact.created_at||null}));

  const appt=activeAppointment(sources);
  if(appt)out.push(reason(27,'scheduled_conversation','The customer selected a time for a conversation.',{evidence:appt.start||appt.scheduledStart,evidenceRef:'calendar:scheduled',source:'scheduled_appointment',observedAt:appt.createdAt||at}));
  if(['recommendation','decision','quote_preparation'].includes(opportunity.stage))out.push(reason(opportunity.stage==='decision'?30:opportunity.stage==='recommendation'?28:24,'advanced_sales_stage','The opportunity has already advanced beyond initial discovery.',{evidence:`stage=${opportunity.stage}`,evidenceRef:'opportunity:stage',source:'producer_recorded',observedAt:opportunity.updated_at||at}));

  const response=latest(sources.filter(source=>source?.kind==='response'));
  const responseAge=ageDays(response?.updated_at,now);
  if(response&&(responseAge==null||responseAge<=30))out.push(reason(22,'customer_response','A recent customer response is recorded.',{evidence:responseAge==null?'recent response':`${responseAge} days old`,evidenceRef:`response:${response.source_id||'latest'}`,source:'explicit_client_response',observedAt:response.updated_at||at}));
  else if(response&&responseAge<=90)out.push(reason(14,'aging_customer_response','A customer response exists, but it is no longer a fresh buying signal.',{evidence:`${responseAge} days old`,evidenceRef:`response:${response.source_id||'latest'}`,source:'explicit_client_response',observedAt:response.updated_at||at}));

  if((context?.contactRequested===true||lead?.summary?.consent?.contactRequested===true)&&(leadAge==null||leadAge<=30))out.push(reason(26,'lead_contact_requested','The prospect recently requested contact in the acquisition flow.',{evidenceRef:ref,source:'explicit_client_response',observedAt:at}));
  else if((context?.contactRequested===true||lead?.summary?.consent?.contactRequested===true)&&leadAge<=90)out.push(reason(16,'aging_contact_request','A prior contact request is recorded, but it should be reconfirmed before treating it as current intent.',{evidence:`${leadAge} days old`,evidenceRef:ref,source:'explicit_client_response',observedAt:at}));

  const statedIntent=lower(context.shoppingIntent,80).replace(/[\s-]+/g,'_');
  const freshIntent=leadAge==null||leadAge<=30,agingIntent=leadAge!=null&&leadAge>30&&leadAge<=90;
  if(freshIntent){
    if(['ready_now','ready','actively_comparing','active_now'].includes(statedIntent))out.push(reason(30,'stated_active_intent','The prospect explicitly reports active buying/comparison intent.',{evidence:statedIntent,evidenceRef:ref,source:'customer_reported',observedAt:at}));
    else if(['open_to_review','open','comparing'].includes(statedIntent))out.push(reason(22,'stated_open_intent','The prospect explicitly reports being open to a review or comparison.',{evidence:statedIntent,evidenceRef:ref,source:'customer_reported',observedAt:at}));
    else if(['exploring','researching'].includes(statedIntent))out.push(reason(10,'stated_exploring','The prospect explicitly reports early-stage exploration.',{evidence:statedIntent,evidenceRef:ref,source:'customer_reported',observedAt:at}));
    else if(['not_interested','no_interest'].includes(statedIntent))out.push(reason(2,'stated_no_current_intent','The prospect explicitly reports no current purchase interest.',{evidence:statedIntent,evidenceRef:ref,source:'customer_reported',observedAt:at}));
  }else if(agingIntent){
    if(['ready_now','ready','actively_comparing','active_now'].includes(statedIntent))out.push(reason(18,'aging_active_intent','The prospect previously reported active intent, but the signal is aging and should be reconfirmed.',{evidence:`${leadAge} days old`,evidenceRef:ref,source:'customer_reported',observedAt:at}));
    else if(['open_to_review','open','comparing'].includes(statedIntent))out.push(reason(13,'aging_open_intent','The prospect previously reported openness to a review, but the signal is aging.',{evidence:`${leadAge} days old`,evidenceRef:ref,source:'customer_reported',observedAt:at}));
    else if(['exploring','researching'].includes(statedIntent))out.push(reason(6,'aging_exploration','The prospect previously reported exploration; treat it as weak current intent.',{evidence:`${leadAge} days old`,evidenceRef:ref,source:'customer_reported',observedAt:at}));
  }

  const why=reviewReason(context);
  if((leadAge==null||leadAge<=30)&&['nonrenewal_notice','buying_condo','renewal_change','shopping_price','coverage_review'].includes(why))out.push(reason(16,'explicit_review_reason','The prospect supplied a recent specific reason for the review.',{evidence:why,evidenceRef:ref,source:'customer_reported',observedAt:at}));
  else if(leadAge!=null&&leadAge<=90&&['nonrenewal_notice','buying_condo','renewal_change','shopping_price','coverage_review'].includes(why))out.push(reason(9,'aging_review_reason','A specific review reason is recorded, but it is aging as an intent signal.',{evidence:`${why} · ${leadAge} days old`,evidenceRef:ref,source:'customer_reported',observedAt:at}));

  if(lead&&leadAge!=null&&leadAge<=14&&Object.keys(context||{}).some(key=>clean(context[key]).length))out.push(reason(12,'recent_structured_engagement','The prospect recently supplied structured acquisition context.',{evidence:`${leadAge} days old`,evidenceRef:ref,source:'customer_reported',observedAt:at,expiresAt:new Date(parseDate(at).getTime()+45*86400000).toISOString()}));
  return out;
}

function timingCandidates(opportunity,context,lead,now){
  const out=[],ref=lead?`lead:${lead.source_id}`:'opportunity:record',at=lead?.updated_at||opportunity.updated_at||opportunity.created_at||null,leadAge=ageDays(at,now);
  const token=timingToken(context);
  const add=(points,code,label,evidence,source='customer_reported')=>out.push(reason(points,code,label,{evidence,evidenceRef:ref,source,observedAt:at}));

  // Relative timing statements are intentionally short-lived. "Within 30 days"
  // from 60 days ago is not current timing evidence; it becomes UNKNOWN and the
  // system asks one timing question again.
  if(leadAge==null||leadAge<=30){
    if(['now_urgent','now','urgent','within_14'].includes(token))add(25,'immediate_timing','The customer reported an immediate decision window.',token);
    else if(['within_30','days_15_30','0_30'].includes(token))add(23,'within_30_days','The customer reported a decision window within 30 days.',token);
    else if(['days_31_60','within_60','31_60'].includes(token))add(17,'within_60_days','The customer reported a 31–60 day decision window.',token);
    else if(['days_61_90','within_90','61_90'].includes(token))add(12,'within_90_days','The customer reported a 61–90 day decision window.',token);
    else if(['over_60','over_90','future'].includes(token))add(6,'future_timing','The customer reported a later decision window.',token);
  }

  // Absolute future dates are recalculated every time and therefore remain usable.
  // Passed dates are not assigned low timing points; they become unknown so the
  // next micro-question reconfirms what "now" means.
  const rawDeadline=clean(context.closingDate||opportunity.deadline,40),deadline=parseDate(rawDeadline);
  if(deadline){
    const days=daysBetween(now,deadline);
    if(days>=0&&days<=14)add(25,'deadline_within_14','A recorded deadline is within 14 days.',rawDeadline,'producer_or_customer_recorded');
    else if(days<=30&&days>=0)add(22,'deadline_within_30','A recorded deadline is within 30 days.',rawDeadline,'producer_or_customer_recorded');
    else if(days<=60&&days>=0)add(17,'deadline_within_60','A recorded deadline is within 60 days.',rawDeadline,'producer_or_customer_recorded');
    else if(days<=90&&days>=0)add(12,'deadline_within_90','A recorded deadline is within 90 days.',rawDeadline,'producer_or_customer_recorded');
    else if(days>90)add(6,'future_deadline','A recorded deadline is more than 90 days away.',rawDeadline,'producer_or_customer_recorded');
  }
  return out;
}

function fitCandidates(track,opportunity,context,lead,possessionQuality){
  const out=[],ref=lead?`lead:${lead.source_id}`:'opportunity:record',at=lead?.updated_at||opportunity.updated_at||opportunity.created_at||null;
  if(possessionQuality?.status==='ready'&&possessionQuality?.fit?.status!=='unknown'){
    const level=possessionQuality.fit?.level;
    const points=level==='high'?20:level==='medium'?13:level==='low'?4:null;
    if(points!=null)out.push(reason(points,'fiv_fit_projection','The existing evidence-based FIV fit projection is available.',{evidence:`fit=${level}`,evidenceRef:'fiv:fit',source:'derived_existing_fiv',observedAt:at}));
  }
  if(['home','auto','life','business'].includes(track))out.push(reason(10,'supported_product_lane','The request is in a product lane CoverageFit is designed to route for producer review.',{evidence:`track=${track}`,evidenceRef:ref,source:'product_lane',observedAt:at}));
  const blob=textBlob(opportunity,context);
  if(/wrong number|not homeowner|do not call|\bdnc\b|not interested/.test(blob))out.push(reason(2,'known_sales_friction','Recorded context contains a clear sales-friction signal. This is not an eligibility determination.',{evidence:'recorded friction',evidenceRef:ref,source:'producer_or_customer_recorded',observedAt:at}));
  return out;
}

function routeOverride(opportunity,tasks,sources){
  if(opportunity?.status==='closed')return Object.freeze({kind:'complete',reason:'Opportunity is closed.',priority:100});
  const proceed=tasks.find(task=>Number(task?.priority||0)>=100&&!['completed','cancelled'].includes(task?.state));
  if(proceed)return Object.freeze({kind:'human_now',reason:'Client explicitly asked to proceed.',priority:100,evidenceRef:`task:${proceed.id}`});
  const question=tasks.find(task=>Number(task?.priority||0)>=90&&!['completed','cancelled'].includes(task?.state));
  if(question)return Object.freeze({kind:'human_now',reason:'A client response or question is waiting.',priority:90,evidenceRef:`task:${question.id}`});
  const contact=tasks.find(task=>Number(task?.priority||0)>=70&&/requested contact|contact request/i.test(task?.title||'')&&!['completed','cancelled'].includes(task?.state));
  if(contact)return Object.freeze({kind:'human_now',reason:'Customer explicitly requested producer contact.',priority:85,evidenceRef:`task:${contact.id}`});
  const appt=activeAppointment(sources);
  if(appt)return Object.freeze({kind:'scheduled_human',reason:'A customer-selected conversation is already scheduled.',priority:80,evidenceRef:'calendar:scheduled',dueAt:appt.start||appt.scheduledStart});
  return null;
}

function contactability(consent={}){
  const agency=consent?.agencyContact||{},marketing=consent?.automatedMarketingSms||{};
  return Object.freeze({
    known:Boolean(Object.keys(agency).length||Object.keys(marketing).length),
    callPermitted:agency.callPermitted===true,
    personalTextPermitted:agency.personalTextPermitted===true,
    emailPermitted:agency.emailPermitted===true,
    automatedMarketingSmsAuthorized:marketing.granted===true,
    automatedMarketingSmsSuppressed:marketing.granted!==true,
    note:'Priority never grants contact permission. Channel execution must obey the authoritative consent and suppression state.'
  });
}

function microQuestion(track,missing){
  const questions={
    life:{
      intent:'Are you actively looking to put life coverage in place, or are you mainly exploring right now?',
      timing:'When would you ideally want the life coverage in place?',
      need:'Do you currently have personal life insurance outside of anything through work?',
      fit:'Are you looking for personal life coverage for yourself or someone in your household?'
    },
    home:{
      intent:'Are you planning to compare your home coverage this cycle?',
      timing:'When does your current home coverage renew, or when are you closing if you are buying?',
      need:'What changed that has you looking at your home coverage right now?',
      fit:'Is this for a home you own now or a home you are buying?'
    },
    auto:{
      intent:'Are you actively comparing auto coverage right now?',
      timing:'When does your current auto coverage renew?',
      need:'What changed that has you looking at auto coverage right now?',
      fit:'Is this for your personal vehicles or a business/commercial vehicle?'
    },
    business:{
      intent:'Are you trying to put business coverage in place now, or are you planning ahead?',
      timing:'When do you need the business coverage or certificate in place?',
      need:'What changed that has you looking at business coverage right now?',
      fit:'What type of business do you operate?'
    },
    unknown:{
      intent:'Are you actively looking to make an insurance decision right now, or mainly exploring?',
      timing:'When would you need coverage or a comparison completed?',
      need:'What changed that has you looking at coverage right now?',
      fit:'Which type of coverage are you looking for?'
    }
  };
  return questions[track]?.[missing]||questions.unknown[missing]||'';
}

function missingFact(dimensions){
  for(const name of ['intent','timing','need','fit'])if(dimensions[name].status==='unknown')return name;
  return '';
}
function handoff({track,dimensions,score,scoreMin,scoreMax,queue,routeOverride:override,missingCriticalFact,recommendedMicroQuestion,context,opportunity}){
  const reasons=Object.values(dimensions).flatMap(d=>d.reasons.map(r=>({...r,dimension:d.name})))
    .sort((a,b)=>b.points-a.points).slice(0,6);
  const knownFacts=[];
  if(context.reviewReason)knownFacts.push(`Review reason: ${clean(context.reviewReason,100)}`);
  if(context.decisionTiming||context.renewalTiming)knownFacts.push(`Timing: ${clean(context.decisionTiming||context.renewalTiming,100)}`);
  if(context.shoppingIntent)knownFacts.push(`Intent: ${clean(context.shoppingIntent,100)}`);
  if(context.statedTrigger)knownFacts.push(`Trigger: ${clean(context.statedTrigger,120)}`);
  if(context.lifeCoverageStatus)knownFacts.push(`Life coverage status: ${clean(context.lifeCoverageStatus,100)}`);
  if(context.closingDate)knownFacts.push(`Closing date: ${clean(context.closingDate,100)}`);
  if(context.lifeGoal)knownFacts.push(`Life goal: ${clean(context.lifeGoal,120)}`);
  if(context.autoNeed)knownFacts.push(`Auto need: ${clean(context.autoNeed,120)}`);
  if(context.businessNeed)knownFacts.push(`Business need: ${clean(context.businessNeed,120)}`);
  if(opportunity?.deadline&&!context.closingDate)knownFacts.push(`Deadline: ${clean(opportunity.deadline,40)}`);
  return Object.freeze({
    track,
    whyNow:reasons.slice(0,3).map(item=>item.label),
    strongestSignals:reasons,
    knownFacts:knownFacts.slice(0,8),
    doNotAskAgain:knownFacts.slice(0,8),
    missingCriticalFact:missingCriticalFact||null,
    recommendedMicroQuestion:recommendedMicroQuestion||null,
    score,
    scoreRange:{min:scoreMin,max:scoreMax},
    queue,
    routeOverride:override||null,
    recommendedOpening:override?.kind==='human_now'
      ? 'Pick up where the customer left off; acknowledge the stated reason and move directly to the requested next step.'
      : missingCriticalFact
        ? `Use one question only: ${recommendedMicroQuestion}`
        : 'Open with the stated trigger, confirm it is still current, and move directly into the relevant recommendation path.'
  });
}

export function deriveOpportunityPriority({opportunity=null,tasks=[],sources=[],customerProfile=null,possessionQuality=null}={},now=new Date()){
  if(!opportunity)return Object.freeze({schemaVersion:'1.0',engine:PRIORITY_BUILD,status:'unclassified',score:null,scoreMin:0,scoreMax:100,evidenceCompleteness:0,queue:'unclassified',queueLabel:QUEUE_LABELS.unclassified});
  const {lead,context,attribution,consent}=contextFromSources(sources),track=productTrack(opportunity,context),override=routeOverride(opportunity,tasks,sources);
  const dimensions=Object.freeze({
    need:dimension('need',needCandidates(track,opportunity,context,lead)),
    intent:dimension('intent',intentCandidates(opportunity,tasks,sources,context,lead,now)),
    timing:dimension('timing',timingCandidates(opportunity,context,lead,now)),
    fit:dimension('fit',fitCandidates(track,opportunity,context,lead,possessionQuality))
  });
  const known=Object.values(dimensions).filter(d=>d.status==='known'),knownPoints=known.reduce((sum,d)=>sum+d.points,0),knownCapacity=known.reduce((sum,d)=>sum+d.cap,0),unknownCapacity=100-knownCapacity;
  const scoreMin=knownPoints,scoreMax=Math.min(100,knownPoints+unknownCapacity),evidenceCompleteness=known.length*25;
  const missingCriticalFact=missingFact(dimensions),recommendedMicroQuestion=microQuestion(track,missingCriticalFact);
  let status=known.length===4?'ready':known.length>=3?'provisional':'unclassified';
  if(opportunity.status==='closed')status='complete';
  const score=status==='ready'?knownPoints:null;
  const queue=status==='ready'?queueForScore(score):'unclassified';
  const projection={
    schemaVersion:'1.0',engine:PRIORITY_BUILD,scope:'producer_priority',status,track,
    score,scoreMin,scoreMax,evidenceCompleteness,knownDimensions:known.map(d=>d.name),
    dimensions,queue,queueLabel:QUEUE_LABELS[queue],routeOverride:override,
    missingCriticalFact:missingCriticalFact||null,recommendedMicroQuestion:recommendedMicroQuestion||null,
    source:{kind:lead?'lead':'opportunity',id:lead?.source_id||opportunity.id,sourceKey:attribution.sourceKey||'',campaignId:attribution.campaignId||''},
    contactability:contactability(consent),
    handoff:null,
    guardrails:{
      internalProducerPriorityOnly:true,consumerVisible:false,underwritingDecision:false,eligibilityConclusion:null,
      pricingConclusion:null,bindAuthorized:false,identityAutoMerged:false,usesSensitiveDemographics:false,
      prohibitedInputs:PROHIBITED_INPUTS,unknownIsNotLow:true,buyingPrediction:false,autoRecalibration:false,
      scoreMeaning:'Evidence-based allocation of producer attention, not a prediction of who will buy or a judgment of a person.'
    }
  };
  projection.handoff=handoff({track,dimensions,score,scoreMin,scoreMax,queue,routeOverride:override,missingCriticalFact,recommendedMicroQuestion,context,opportunity});
  return Object.freeze(projection);
}

export const PRIORITY_CAPS=CAPS;
export const PRIORITY_QUEUE_LABELS=QUEUE_LABELS;
