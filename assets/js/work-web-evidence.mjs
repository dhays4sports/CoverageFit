// Display persisted evidence only. This is not a question or scoring engine.
const fields=new Set(['product','statedTrigger','shoppingIntent','decisionTiming','reviewReason','renewalTiming','closingDate','propertyType','autoNeed','businessNeed','businessType','lifeCoverageStatus','lifeProtectionTrigger','lifeGoal']);
export function webEvidence(distribution){
  if(distribution?.version!=='coveragefit-distribution-v1')return [];
  const facts=new Map();
  const add=(signals,origin)=>{for(const [key,value] of Object.entries(signals||{})){
    if(fields.has(key)&&typeof value==='string'&&value&&value!=='unknown')facts.set(key,[key,value.replaceAll('_',' '),origin]);
  }};
  add(distribution.initialEvidence,'Entry context / previously supplied evidence');
  for(const answer of distribution.answers||[])if(answer.source==='coveragefit_signal')add(answer.signals,'Submitted web answer');
  return [...facts.values()];
}
