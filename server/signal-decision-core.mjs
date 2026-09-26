import {deriveOpportunityPriority,PRIORITY_BUILD} from './opportunity-priority-core.mjs';

export const SIGNAL_DECISION_BUILD='CF-SIGNAL-DECISION-1.0';
export const SIGNAL_DECISION_SCHEMA='1.0';

const PRODUCT_VALUES=new Set(['home','auto','life','business','unknown']);
const SIGNAL_FIELDS=new Set([
  'product','statedTrigger','shoppingIntent','decisionTiming','reviewReason','renewalTiming',
  'closingDate','propertyType','autoNeed','businessNeed','businessType','professionalProgram',
  'lifeCoverageStatus','lifeProtectionTrigger','lifeGoal'
]);
const ATTRIBUTION_FIELDS=new Set([
  'source','sourceFamily','sourceKey','campaignId','campaignVariant','creative','partnerId','batchId',
  'utmSource','utmMedium','utmCampaign','utmContent','utmTerm','landingPage'
]);
const PROHIBITED_KEYS=new Set([
  'name','firstname','first_name','lastname','last_name','email','phone','mobile','dob','dateofbirth',
  'date_of_birth','ssn','socialsecuritynumber','social_security_number','driverlicense','driver_license',
  'medicalhistory','medical_history','healthinformation','health_information','vin','fulladdress','full_address',
  'street','streetaddress','street_address','address','health'
]);
const ENUM_RE=/^[a-z0-9][a-z0-9_:-]{0,79}$/;
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const SESSION_RE=/^[A-Za-z0-9_-]{12,120}$/;
const FLOW_RE=/^[a-z0-9][a-z0-9_.:-]{0,99}$/;
const VERSION_RE=/^[A-Za-z0-9][A-Za-z0-9_.-]{0,39}$/;

const SIGNAL_VALUE_SETS=Object.freeze({
  product:new Set(['home','auto','life','business','unknown']),
  statedTrigger:new Set(['something_changed','comparing_options','just_exploring','just_researching','price_changed','renewal','purchase','closing','coverage_change','family_change','business_change']),
  shoppingIntent:new Set(['ready_now','ready','actively_comparing','active_now','open_to_review','open','comparing','exploring','researching','not_interested','no_interest']),
  decisionTiming:new Set(['now','now_urgent','urgent','within_14','within_30','days_15_30','0_30','days_31_60','within_60','31_60','days_61_90','within_90','61_90','over_60','over_90','future','later']),
  reviewReason:new Set(['nonrenewal_notice','renewal_change','buying_condo','buying_home','shopping_price','coverage_review','new_home_or_vehicle','price','upcoming_renewal','coverage_concern','comparison']),
  renewalTiming:new Set(['now','now_urgent','urgent','within_14','within_30','days_15_30','0_30','days_31_60','within_60','31_60','days_61_90','within_90','61_90','over_60','over_90','future','later']),
  propertyType:new Set(['house','single_family','condo','townhome','multi_unit','landlord','manufactured','mobile_home','other','unsure']),
  autoNeed:new Set(['new_vehicle','add_driver','teen_driver','financing','finance','lease','lapse','cancellation','need_now','renewal_price','coverage_change','just_comparing','price','upcoming_renewal']),
  businessNeed:new Set(['coi','certificate','contract','lease_lender','lease','lender','opening','new_business','hiring','workers_comp','renewal','price_change','just_researching']),
  businessType:new Set(['contractor','restaurant','professional','retail','habitational','other']),
  professionalProgram:new Set(['healthcare','teachers','teacher','tech','engineers','engineer','realtor','lender','first_responder','lawyer','cpa','other']),
  lifeCoverageStatus:new Set(['yes_personal','none','no_personal','no_personal_coverage','employer_only','work_only','through_work_only','unsure','unknown']),
  lifeProtectionTrigger:new Set(['mortgage','child','children','dependent','dependents','income','family','business','key_person','final_expenses']),
  lifeGoal:new Set(['family_income','mortgage','children','child','dependents','dependent','business','key_person','final_expenses','final','review_existing','income','family'])
});

function fail(status,code,message){
  const error=new Error(message);
  error.status=status;error.code=code;
  throw error;
}
const clean=(value,max=160)=>String(value??'').trim().replace(/[<>\u0000-\u001f\u007f]/g,'').slice(0,max);
const token=value=>clean(value,80).toLowerCase().replace(/[\s-]+/g,'_');
const isObject=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));

function scanProhibitedKeys(value,path='root'){
  if(!isObject(value)&&!Array.isArray(value))return;
  if(Array.isArray(value)){
    value.forEach((item,index)=>scanProhibitedKeys(item,`${path}[${index}]`));
    return;
  }
  for(const [key,item] of Object.entries(value)){
    const normalized=String(key).toLowerCase().replace(/[^a-z0-9_]/g,'');
    if(PROHIBITED_KEYS.has(normalized))fail(422,'pii_not_allowed',`Anonymous Signal Decision does not accept identity/contact field "${key}".`);
    scanProhibitedKeys(item,`${path}.${key}`);
  }
}

function enumValue(value,field,{allowEmpty=true}={}){
  const normalized=token(value);
  if(!normalized&&allowEmpty)return '';
  if(!ENUM_RE.test(normalized))fail(422,'signal_value',`${field} must use a bounded canonical option code.`);
  return normalized;
}

function safePath(value){
  const raw=clean(value,180);
  if(!raw)return '';
  if(!raw.startsWith('/')||raw.includes('://')||/[?#]/.test(raw))fail(422,'attribution_value','landingPage must be a relative route path.');
  return raw;
}

function normalizeSignals(raw={}){
  if(!isObject(raw))fail(422,'signals','canonicalSignals must be an object.');
  const unknown=Object.keys(raw).filter(key=>!SIGNAL_FIELDS.has(key));
  if(unknown.length)fail(422,'signal_field',`Unsupported canonical signal field: ${unknown[0]}`);
  const out={};
  for(const field of SIGNAL_FIELDS){
    if(raw[field]==null||raw[field]==='')continue;
    if(field==='closingDate'){
      const value=clean(raw[field],10);
      if(!DATE_RE.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z')))fail(422,'signal_value','closingDate must be YYYY-MM-DD.');
      out[field]=value;
      continue;
    }
    const normalized=enumValue(raw[field],field,{allowEmpty:false});
    const allowed=SIGNAL_VALUE_SETS[field];
    if(allowed&&!allowed.has(normalized))fail(422,'signal_value',`${field} is not a supported canonical option code.`);
    out[field]=normalized;
  }
  const product=enumValue(out.product||'unknown','product',{allowEmpty:false});
  if(!PRODUCT_VALUES.has(product))fail(422,'product','product must be home, auto, life, business, or unknown.');
  out.product=product;
  return Object.freeze(out);
}

function normalizeAttribution(raw={}){
  if(raw==null)return Object.freeze({});
  if(!isObject(raw))fail(422,'attribution','attribution must be an object.');
  const unknown=Object.keys(raw).filter(key=>!ATTRIBUTION_FIELDS.has(key));
  if(unknown.length)fail(422,'attribution_field',`Unsupported attribution field: ${unknown[0]}`);
  const out={};
  for(const [field,value] of Object.entries(raw)){
    if(value==null||value==='')continue;
    if(field==='landingPage'){out[field]=safePath(value);continue;}
    const normalized=clean(value,120);
    if(!/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,119}$/.test(normalized)||/@/.test(normalized)||/\d{7,}/.test(normalized))fail(422,'attribution_value',`${field} contains unsupported or personal-looking characters.`);
    out[field]=normalized;
  }
  return Object.freeze(out);
}

export function normalizeSignalDecisionInput(raw={}){
  if(!isObject(raw))fail(400,'json','The Signal Decision request must be an object.');
  scanProhibitedKeys(raw);
  const allowedFields=new Set(['schemaVersion','signalSessionId','flowId','flowVersion','canonicalSignals','attribution','presentationContext']);
  if(Object.keys(raw).some(key=>!allowedFields.has(key)))fail(422,'request_field','Unsupported Signal Decision request field.');
  const schemaVersion=clean(raw.schemaVersion||SIGNAL_DECISION_SCHEMA,20);
  if(schemaVersion!==SIGNAL_DECISION_SCHEMA)fail(422,'schema_version','Unsupported Signal Decision schema version.');
  const signalSessionId=clean(raw.signalSessionId,120);
  if(!SESSION_RE.test(signalSessionId))fail(422,'signal_session','signalSessionId is required and must be opaque.');
  const flowId=clean(raw.flowId||'unknown',100).toLowerCase();
  if(!FLOW_RE.test(flowId))fail(422,'flow','flowId is invalid.');
  const flowVersion=clean(raw.flowVersion||'1.0',40);
  if(!VERSION_RE.test(flowVersion))fail(422,'flow_version','flowVersion is invalid.');
  const canonicalSignals=normalizeSignals(raw.canonicalSignals||{});
  const attribution=normalizeAttribution(raw.attribution||{});
  const presentationContext=raw.presentationContext||'';
  if(!['','homebuyer','condo'].includes(presentationContext))fail(422,'presentation_context','Unsupported presentation context.');
  return Object.freeze({schemaVersion,signalSessionId,flowId,flowVersion,canonicalSignals,attribution,presentationContext});
}

const option=(code,label,signals={})=>Object.freeze({code,label,signals:Object.freeze(signals)});

const QUESTIONS=Object.freeze({
  buyer_need:Object.freeze({
    id:'buyer_need',dimension:'need',prompt:'What would be most useful for your home purchase?',canonicalField:'reviewReason',
    options:Object.freeze([
      option('closing_coverage','Coverage for an upcoming closing',{reviewReason:'buying_home'}),
      option('compare_purchase','Compare options for the new home',{reviewReason:'comparison'}),
      option('understand_coverage','Understand the coverage I may need',{reviewReason:'coverage_review'}),
      option('planning','I am planning ahead',{statedTrigger:'just_researching'})
    ])
  }),
  signal_product:Object.freeze({
    id:'signal_product',dimension:'product',prompt:'What are you looking for help with?',canonicalField:'product',
    options:Object.freeze([
      option('home','Home coverage',{product:'home'}),
      option('auto','Auto coverage',{product:'auto'}),
      option('life','Life coverage',{product:'life'}),
      option('business','Business coverage',{product:'business'})
    ])
  }),
  life_coverage_status:Object.freeze({
    id:'life_coverage_status',dimension:'need',prompt:'Do you currently have personal life insurance outside of anything through work?',canonicalField:'lifeCoverageStatus',
    options:Object.freeze([
      option('yes_personal','Yes',{lifeCoverageStatus:'yes_personal'}),
      option('employer_only','Only through work',{lifeCoverageStatus:'employer_only'}),
      option('none','No',{lifeCoverageStatus:'none'}),
      option('unsure','Not sure',{lifeCoverageStatus:'unsure'})
    ])
  }),
  life_protection_goal:Object.freeze({
    id:'life_protection_goal',dimension:'need',prompt:'What are you mainly trying to protect or improve?',canonicalField:'lifeGoal',
    options:Object.freeze([
      option('family_income','Family income',{lifeGoal:'family_income'}),
      option('mortgage','Mortgage or home',{lifeGoal:'mortgage'}),
      option('children','Children or dependents',{lifeGoal:'children'}),
      option('business','Business or key-person need',{lifeGoal:'business'}),
      option('final_expenses','Final expenses',{lifeGoal:'final_expenses'}),
      option('review_existing','Review what I already have',{lifeGoal:'review_existing'})
    ])
  }),
  life_shopping_intent:Object.freeze({
    id:'life_shopping_intent',dimension:'intent',prompt:'Are you actively looking to put personal life coverage in place?',canonicalField:'shoppingIntent',
    options:Object.freeze([
      option('ready_now','Yes, now',{shoppingIntent:'ready_now'}),
      option('open_to_review','I am open to it',{shoppingIntent:'open_to_review'}),
      option('researching','Mostly researching',{shoppingIntent:'researching'}),
      option('not_interested','Not really',{shoppingIntent:'not_interested'})
    ])
  }),
  life_decision_timing:Object.freeze({
    id:'life_decision_timing',dimension:'timing',prompt:'When would you ideally want coverage in place?',canonicalField:'decisionTiming',
    options:Object.freeze([
      option('now','As soon as possible',{decisionTiming:'now'}),
      option('within_30','Within 30 days',{decisionTiming:'within_30'}),
      option('within_90','In the next few months',{decisionTiming:'within_90'}),
      option('future','I am not sure yet',{decisionTiming:'future'})
    ])
  }),
  home_trigger:Object.freeze({
    id:'home_trigger',dimension:'need',prompt:'What changed that has you looking at home coverage right now?',canonicalField:'reviewReason',
    options:Object.freeze([
      option('nonrenewal_notice','I am being cancelled or nonrenewed',{reviewReason:'nonrenewal_notice'}),
      option('renewal_change','My renewal or price changed',{reviewReason:'renewal_change'}),
      option('buying_home','I am buying a home',{reviewReason:'buying_home'}),
      option('shopping_price','I am comparing options',{reviewReason:'shopping_price'}),
      option('coverage_review','I want a coverage review',{reviewReason:'coverage_review'}),
      option('just_researching','I am just researching',{statedTrigger:'just_researching'})
    ])
  }),
  home_shopping_intent:Object.freeze({
    id:'home_shopping_intent',dimension:'intent',prompt:'Are you planning to compare your home coverage this cycle?',canonicalField:'shoppingIntent',
    options:Object.freeze([
      option('ready_now','Yes, now',{shoppingIntent:'ready_now'}),
      option('open_to_review','I am open to a comparison',{shoppingIntent:'open_to_review'}),
      option('researching','Mostly researching',{shoppingIntent:'researching'}),
      option('not_interested','Not right now',{shoppingIntent:'not_interested'})
    ])
  }),
  home_decision_timing:Object.freeze({
    id:'home_decision_timing',dimension:'timing',prompt:'When do you need the home coverage reviewed?',canonicalField:'decisionTiming',
    options:Object.freeze([
      option('within_14','Within 2 weeks',{decisionTiming:'within_14'}),
      option('within_30','Within 30 days',{decisionTiming:'within_30'}),
      option('days_31_60','31–60 days',{decisionTiming:'days_31_60'}),
      option('future','Later',{decisionTiming:'future'})
    ])
  }),
  auto_trigger:Object.freeze({
    id:'auto_trigger',dimension:'need',prompt:'What changed that has you looking at auto coverage right now?',canonicalField:'autoNeed',
    options:Object.freeze([
      option('new_vehicle','I bought or am buying a vehicle',{autoNeed:'new_vehicle'}),
      option('add_driver','I am adding a driver',{autoNeed:'add_driver'}),
      option('need_now','I need coverage now',{autoNeed:'need_now'}),
      option('renewal_price','My renewal or price changed',{autoNeed:'renewal_price'}),
      option('coverage_change','I want to change coverage',{autoNeed:'coverage_change'}),
      option('just_comparing','I am just comparing',{autoNeed:'just_comparing'})
    ])
  }),
  auto_shopping_intent:Object.freeze({
    id:'auto_shopping_intent',dimension:'intent',prompt:'Are you actively comparing auto coverage right now?',canonicalField:'shoppingIntent',
    options:Object.freeze([
      option('ready_now','Yes, now',{shoppingIntent:'ready_now'}),
      option('open_to_review','I am open to switching',{shoppingIntent:'open_to_review'}),
      option('researching','Mostly researching',{shoppingIntent:'researching'}),
      option('not_interested','Not right now',{shoppingIntent:'not_interested'})
    ])
  }),
  auto_decision_timing:Object.freeze({
    id:'auto_decision_timing',dimension:'timing',prompt:'When would you need the auto coverage handled?',canonicalField:'decisionTiming',
    options:Object.freeze([
      option('now','Today or now',{decisionTiming:'now'}),
      option('within_30','Within 30 days',{decisionTiming:'within_30'}),
      option('days_31_60','31–60 days',{decisionTiming:'days_31_60'}),
      option('future','Later',{decisionTiming:'future'})
    ])
  }),
  business_trigger:Object.freeze({
    id:'business_trigger',dimension:'need',prompt:'What changed that has you looking for business coverage?',canonicalField:'businessNeed',
    options:Object.freeze([
      option('coi','I need a COI or certificate',{businessNeed:'coi'}),
      option('contract','A contract requires coverage',{businessNeed:'contract'}),
      option('lease_lender','A landlord or lender requires it',{businessNeed:'lease_lender'}),
      option('opening','I am opening a business or location',{businessNeed:'opening'}),
      option('hiring','I am hiring employees',{businessNeed:'hiring'}),
      option('renewal','My renewal is coming up',{businessNeed:'renewal'}),
      option('price_change','My price changed',{businessNeed:'price_change'}),
      option('just_researching','I am just researching',{businessNeed:'just_researching'})
    ])
  }),
  business_shopping_intent:Object.freeze({
    id:'business_shopping_intent',dimension:'intent',prompt:'Are you trying to put business coverage in place now, or planning ahead?',canonicalField:'shoppingIntent',
    options:Object.freeze([
      option('ready_now','I need it now',{shoppingIntent:'ready_now'}),
      option('open_to_review','I am actively comparing',{shoppingIntent:'open_to_review'}),
      option('researching','I am planning ahead',{shoppingIntent:'researching'}),
      option('not_interested','Not right now',{shoppingIntent:'not_interested'})
    ])
  }),
  business_decision_timing:Object.freeze({
    id:'business_decision_timing',dimension:'timing',prompt:'When do you need the coverage or certificate in place?',canonicalField:'decisionTiming',
    options:Object.freeze([
      option('now','Today or this week',{decisionTiming:'now'}),
      option('within_30','Within 30 days',{decisionTiming:'within_30'}),
      option('days_31_60','31–60 days',{decisionTiming:'days_31_60'}),
      option('future','Later',{decisionTiming:'future'})
    ])
  }),
  business_type:Object.freeze({
    id:'business_type',dimension:'fit',prompt:'What type of business do you operate?',canonicalField:'businessType',
    options:Object.freeze([
      option('contractor','Contractor or trade',{businessType:'contractor'}),
      option('restaurant','Restaurant or food service',{businessType:'restaurant'}),
      option('professional','Professional office or service',{businessType:'professional'}),
      option('retail','Retail',{businessType:'retail'}),
      option('habitational','Apartment or habitational',{businessType:'habitational'}),
      option('other','Other',{businessType:'other'})
    ])
  })
});

function openingQuestion(track,signals){
  if(track==='life'&&!signals.lifeCoverageStatus)return QUESTIONS.life_coverage_status;
  if(track==='home'&&!signals.reviewReason&&!signals.statedTrigger)return QUESTIONS.home_trigger;
  if(track==='auto'&&!signals.autoNeed)return QUESTIONS.auto_trigger;
  if(track==='business'&&!signals.businessNeed)return QUESTIONS.business_trigger;
  return null;
}

function nextQuestion(track,missing,signals){
  if(track==='unknown')return QUESTIONS.signal_product;
  if(track==='life'){
    if(missing==='need')return signals.lifeCoverageStatus?QUESTIONS.life_protection_goal:QUESTIONS.life_coverage_status;
    if(missing==='intent')return QUESTIONS.life_shopping_intent;
    if(missing==='timing')return QUESTIONS.life_decision_timing;
  }
  if(track==='home'){
    if(missing==='need')return QUESTIONS.home_trigger;
    if(missing==='intent')return QUESTIONS.home_shopping_intent;
    if(missing==='timing')return QUESTIONS.home_decision_timing;
  }
  if(track==='auto'){
    if(missing==='need')return QUESTIONS.auto_trigger;
    if(missing==='intent')return QUESTIONS.auto_shopping_intent;
    if(missing==='timing')return QUESTIONS.auto_decision_timing;
  }
  if(track==='business'){
    if(missing==='need')return QUESTIONS.business_trigger;
    if(missing==='intent')return QUESTIONS.business_shopping_intent;
    if(missing==='timing')return QUESTIONS.business_decision_timing;
    if(missing==='fit')return QUESTIONS.business_type;
  }
  return QUESTIONS.signal_product;
}

function publicQuestion(question){
  return Object.freeze({
    id:question.id,
    dimension:question.dimension,
    prompt:question.prompt,
    canonicalField:question.canonicalField,
    options:Object.freeze(question.options.map(item=>Object.freeze({code:item.code,label:item.label,signals:item.signals})))
  });
}

function weakEarlyExit(signals){
  const intent=token(signals.shoppingIntent);
  const trigger=token(signals.statedTrigger);
  const lifeGoal=token(signals.lifeGoal);
  const autoNeed=token(signals.autoNeed);
  const businessNeed=token(signals.businessNeed);
  if(intent==='not_interested')return 'CONTINUE_LATER';
  if(intent==='researching'&&['just_researching',''].includes(trigger)&&!lifeGoal&&!autoNeed&&!businessNeed)return 'OFFER_LEARN';
  return '';
}

function publicExperience(decision){
  if(decision==='OFFER_HUMAN')return Object.freeze({
    eyebrow:'Next step',
    headline:'This looks worth a quick conversation.',
    body:'A licensed agent can pick up from what you already shared instead of starting over.',
    actions:Object.freeze(['talk_now','choose_time','text'])
  });
  if(decision==='OFFER_LEARN')return Object.freeze({
    eyebrow:'You can keep this light',
    headline:'You are early enough to learn first.',
    body:'You can review the basics now and come back when the timing is better. You can still ask for a person at any point.',
    actions:Object.freeze(['learn_first','continue_later','talk_anyway'])
  });
  if(decision==='CONTINUE_LATER')return Object.freeze({
    eyebrow:'No pressure',
    headline:'You can come back when the timing changes.',
    body:'Your current answers do not require a sales conversation. Learning resources and a human option can remain available.',
    actions:Object.freeze(['continue_later','learn_first','talk_anyway'])
  });
  return null;
}

function syntheticPriorityInput(input,now){
  const signals=input.canonicalSignals;
  const track=signals.product||'unknown';
  const context={...signals,reviewTrack:track,productTrack:track};
  const opportunity=Object.freeze({
    id:`signal_${input.signalSessionId}`,
    products:track,
    reason:signals.statedTrigger||signals.reviewReason||signals.autoNeed||signals.businessNeed||signals.lifeGoal||'',
    status:'open',
    stage:'inquiry',
    created_at:now.toISOString(),
    updated_at:now.toISOString()
  });
  const source=Object.freeze({
    kind:'lead',
    source_id:input.signalSessionId,
    updated_at:now.toISOString(),
    summary:Object.freeze({
      context:Object.freeze(context),
      attribution:Object.freeze({
        sourceKey:input.attribution.sourceKey||input.attribution.source||'',
        campaignId:input.attribution.campaignId||input.attribution.utmCampaign||''
      }),
      consent:Object.freeze({})
    })
  });
  return {opportunity,tasks:[],sources:[source],customerProfile:null,possessionQuality:null,evidenceMode:'signal'};
}

export function deriveSignalDecision(raw={},now=new Date()){
  const input=normalizeSignalDecisionInput(raw);
  const priority=deriveOpportunityPriority(syntheticPriorityInput(input,now),now);
  const weak=weakEarlyExit(input.canonicalSignals);
  let decision='',state='',question=null;

  const opening=openingQuestion(priority.track,input.canonicalSignals);
  if(input.canonicalSignals.product==='unknown'){
    decision='ASK_ONE_SIGNAL';state='signal_developing';question=QUESTIONS.signal_product;
  }else if(weak){
    decision=weak;state='signal_only';
  }else if(opening){
    decision='ASK_ONE_SIGNAL';state='signal_developing';question=opening;
  }else if(!input.canonicalSignals.shoppingIntent){
    // A concrete need is not explicit willingness to compare or buy.
    // Opportunity heuristics may credit a review reason as intent; anonymous
    // Signal routing must ask for the visitor's own answer before handoff.
    question=nextQuestion(priority.track,'intent',input.canonicalSignals);
    decision='ASK_ONE_SIGNAL';state='signal_developing';
  }else if(priority.status!=='ready'){
    question=nextQuestion(priority.track,priority.missingCriticalFact,input.canonicalSignals);
    decision='ASK_ONE_SIGNAL';state='signal_developing';
  }else if(priority.track==='business'&&!input.canonicalSignals.businessType){
    question=QUESTIONS.business_type;
    decision='ASK_ONE_SIGNAL';state='signal_developing';
  }else if(['shoot_now','quick_play'].includes(priority.queue)){
    decision='OFFER_HUMAN';state='qualified_signal';
  }else if(priority.queue==='develop'){
    decision='OFFER_LEARN';state='signal_only';
  }else{
    decision='CONTINUE_LATER';state='signal_only';
  }

  // Presentation context changes wording/question choice, never the priority input.
  if(question?.id==='home_trigger'&&input.presentationContext==='homebuyer')question=QUESTIONS.buyer_need;
  const publicResult=Object.freeze({
    ok:true,
    schemaVersion:SIGNAL_DECISION_SCHEMA,
    engine:SIGNAL_DECISION_BUILD,
    priorityEngine:PRIORITY_BUILD,
    signalSessionId:input.signalSessionId,
    flowId:input.flowId,
    flowVersion:input.flowVersion,
    decision,
    state,
    nextQuestionId:question?.id||null,
    missingDimension:decision==='ASK_ONE_SIGNAL'?question?.dimension||priority.missingCriticalFact||null:null,
    nextQuestion:question?publicQuestion(question):null,
    publicExperience:publicExperience(decision),
    evaluatedAt:now.toISOString(),
    guardrails:Object.freeze({
      anonymous:true,
      persisted:false,
      leadCreated:false,
      opportunityCreated:false,
      contactPermissionGranted:false,
      consumerScoreExposed:false,
      underwritingDecision:false,
      eligibilityDecision:false,
      pricingDecision:false,
      bindAuthorized:false
    })
  });
  return Object.freeze({public:publicResult,internal:Object.freeze({input,priority})});
}

export function allowedSignalOrigin(request,env={}){
  const origin=clean(request?.headers?.get?.('origin'),240);
  if(!origin)return '';
  const defaults=['https://408farmers.com','https://www.408farmers.com'];
  const configured=clean(env.CF_SIGNAL_ALLOWED_ORIGINS||'',1000).split(',').map(item=>item.trim()).filter(Boolean);
  const allowed=new Set(defaults.concat(configured));
  if(env.CF_SIGNAL_ALLOW_LOCALHOST==='true'&&/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin))return origin;
  return allowed.has(origin)?origin:'';
}

export function corsHeaders(origin){
  return {
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Max-Age':'600',
    'Vary':'Origin'
  };
}

function json(body,status=200,headers={}){
  return Response.json(body,{status,headers:{
    'Cache-Control':'no-store, max-age=0',
    'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",
    'Referrer-Policy':'no-referrer',
    'X-Content-Type-Options':'nosniff',
    ...headers
  }});
}

async function readJson(request){
  if(!request.headers.get('content-type')?.toLowerCase().includes('application/json'))fail(415,'content_type','A JSON request is required.');
  const advertised=Number(request.headers.get('content-length')||0);
  if(advertised>8192)fail(413,'size','Keep Signal Decision requests under 8 KB.');
  const text=await request.text();
  if(new TextEncoder().encode(text).byteLength>8192)fail(413,'size','Keep Signal Decision requests under 8 KB.');
  try{return JSON.parse(text);}catch{fail(400,'json','The Signal Decision request could not be read.');}
}

export async function handleSignalDecision(request,{env={},now=new Date()}={}){
  const origin=allowedSignalOrigin(request,env);
  if(!origin)return json({ok:false,error:{code:'origin',message:'This Signal Decision origin is not allowed.'}},403);
  const cors=corsHeaders(origin);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST')return json({ok:false,error:{code:'method',message:'POST is required.'}},405,cors);
  try{
    const raw=await readJson(request);
    return json(deriveSignalDecision(raw,now).public,200,cors);
  }catch(error){
    return json({ok:false,error:{code:error.code||'signal_decision_unavailable',message:error.status?error.message:'The Signal Decision service could not evaluate this request.'}},error.status||503,cors);
  }
}

export const SIGNAL_QUESTION_LIBRARY=QUESTIONS;
