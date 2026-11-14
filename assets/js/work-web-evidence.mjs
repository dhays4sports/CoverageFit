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
  for(const [key,value] of Object.entries(distribution.buyer||{}))if(typeof value==='string'&&value)facts.set('buyer_'+key,[key,value.replaceAll('_',' '),'Buyer request / workflow context']);
  for(const [key,value] of Object.entries(distribution.condo||{}))if(typeof value==='string'&&value)facts.set('condo_'+key,[key,value.replaceAll('_',' '),'Condo request / workflow context']);
  const combined=distribution.professionalCombined;
  if(combined?.version===1){
    facts.delete('product'); // Legacy routing anchor is not the requested-products list.
    facts.set('requestedProducts',['Requested products',combined.requestedProducts.join(' + '),'Explicit consumer selection']);
    for(const line of ['home','auto'])for(const [key,value] of Object.entries(combined.productEvidence?.[line]||{}))if(value&&key!=='reasonCode')facts.set(line+'_'+key,[line+' '+key,String(value).replaceAll('_',' '),'Submitted '+line+' answer']);
    if(combined.earliestReportedTiming)facts.set('earliestTiming',['Earliest reported timing',combined.earliestReportedTiming.product+': '+combined.earliestReportedTiming.window.replaceAll('_',' '),'Reported window; confirm exact date']);
  }
  return [...facts.values()];
}
