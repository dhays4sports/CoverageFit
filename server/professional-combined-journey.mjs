import {SIGNAL_QUESTION_LIBRARY as SIGNAL,deriveSignalDecision} from './signal-decision-core.mjs';
export const PROFESSIONAL_ENTRIES=new Set(['tech','healthcare','engineers','teachers']);
export const PROFESSIONAL_FLOW_VERSION=1;
const q=(id,prompt,options)=>({id,prompt,options});
const selection=(code,label,products,product)=>({code,label,signals:{product},professional:{requestedProducts:products}});
const scoped=(id,source,line)=>q(id,source.prompt,source.options.map(o=>({code:o.code,label:o.label,signals:{},professional:{[line]:{...o.signals,reasonCode:o.code}}})));
const timing=(line)=>q('combined_'+line+'_timing',`When do you need the ${line} coverage reviewed?`,[
 ['now','Today or now'],['within_14','Within 2 weeks'],['within_30','Within 30 days'],['days_31_60','31–60 days'],['future','Later'],['unknown','Not sure yet']
].map(([code,label])=>({code,label,signals:{},professional:{[line]:{decisionTiming:code}}})));
export const PROFESSIONAL_QUESTIONS={
 signal_product:q('signal_product','What would you like me to review?',[
  selection('home_auto','Home + auto',['home','auto'],'home'),
  ...SIGNAL.signal_product.options.map(o=>selection(o.code,o.label,[o.code],o.signals.product))
 ]),
 combined_home_reason:scoped('combined_home_reason',SIGNAL.home_trigger,'home'),
 combined_auto_reason:scoped('combined_auto_reason',SIGNAL.auto_trigger,'auto'),
 combined_home_timing:timing('home'),combined_auto_timing:timing('auto'),
 combined_property:q('combined_property','What type of property is the home coverage for?',[
 ['single_family','House'],['condo','Condo'],['townhome','Townhome'],['other','Other property'],['unsure','Not sure yet']
 ].map(([code,label])=>({code,label,signals:{},professional:{home:{propertyType:code}}})))
};
export function professionalFacts(record){
 const result={version:1,requestedProducts:[],productEvidence:{home:{},auto:{}},selectionSource:null};
 for(const a of record.answers||[]){const p=a.professional;if(!p)continue;
  if(p.requestedProducts){result.requestedProducts=[...p.requestedProducts];result.selectionSource={questionId:a.questionId,optionCode:a.optionCode,source:'consumer_answer',occurredAt:a.occurredAt};}
  for(const line of ['home','auto'])if(p[line])Object.assign(result.productEvidence[line],p[line]);
 }
 if(result.requestedProducts.length!==2)return {...result,productEvidence:{}};
 const rank={now:0,within_14:1,within_30:2,days_31_60:3,future:4};
 const known=['home','auto'].filter(line=>rank[result.productEvidence[line].decisionTiming]!==undefined);
 result.priorityProduct=known.sort((a,b)=>rank[result.productEvidence[a].decisionTiming]-rank[result.productEvidence[b].decisionTiming])[0]||'home';
 result.earliestReportedTiming=known.length?{product:result.priorityProduct,window:result.productEvidence[result.priorityProduct].decisionTiming}:null;
 // Relative windows remain reported windows, never fabricated exact deadlines.
 result.nextAction=result.earliestReportedTiming?`Review home + auto; confirm ${result.priorityProduct} timing (${result.earliestReportedTiming.window.replaceAll('_',' ')}).`:'Review home + auto; confirm each policy’s timing.';
 return result;
}
export function professionalDecision(record,now){
 const facts=professionalFacts(record);
 if(!record.answers.length&&record.signals.product==='unknown')return {nextQuestion:PROFESSIONAL_QUESTIONS.signal_product,nextQuestionId:'signal_product'};
 if(facts.requestedProducts.length!==2)return deriveSignalDecision({signalSessionId:record.journeyId,flowId:'distribution_'+record.distribution.entry,canonicalSignals:record.signals,attribution:record.distribution.attribution},now).public;
 let id;
 const {home,auto}=facts.productEvidence;
 if(!home.reasonCode)id='combined_home_reason';else if(!auto.reasonCode)id='combined_auto_reason';
 else if(!home.decisionTiming)id='combined_home_timing';else if(!auto.decisionTiming)id='combined_auto_timing';
 else if(home.reasonCode!=='just_researching'&&!home.propertyType)id='combined_property';
 return {nextQuestion:id?PROFESSIONAL_QUESTIONS[id]:null,nextQuestionId:id||null,publicExperience:{headline:'Your home + auto review is ready for Dylan.',body:'Send one request so I can review both with you. Any unanswered details can wait for our conversation.'}};
}
const label=(id,code)=>PROFESSIONAL_QUESTIONS[id]?.options.find(o=>o.code===code)?.label||'Not provided';
export function combinedSummary(facts){
 const {home,auto}=facts.productEvidence;
 return `Home + auto requested. Home: ${label('combined_home_reason',home.reasonCode)}; ${label('combined_home_timing',home.decisionTiming)}; property: ${label('combined_property',home.propertyType)}. Auto: ${label('combined_auto_reason',auto.reasonCode)}; ${label('combined_auto_timing',auto.decisionTiming)}. ${facts.nextAction}`;
}
