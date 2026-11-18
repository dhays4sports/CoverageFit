// Attributed read-only projections. No new fact, task, policy or contact authority.
export const AZ_RESOURCE_SOURCE='agencyzoom_resource_v2';
export const renewalFactKey=(policy,term,field)=>`az:${policy}:${term}:${field}`;
export function projectAgencyZoomEvidence(sources=[],{customerId=null,opportunityId=null,tasks=[],records=[],asOf=new Date().toISOString()}={}){
 const result={tasks:[],policies:[],renewals:[],relationshipHolds:0,inventoryComplete:false,outreachAuthorized:false};
 for(const source of sources.filter(s=>s.kind===AZ_RESOURCE_SOURCE)){
  const s=source.summary||{},r=s.resource;if(!r)continue;
  if(customerId&&s.canonicalCustomerId!==customerId){result.relationshipHolds++;continue;}
  if(opportunityId&&s.scope!=='customer'&&s.canonicalOpportunityId!==opportunityId)continue;
  const sourceId=source.sourceId||source.source_id;
  const stale=Date.parse(asOf)-Date.parse(r.updatedAt)>30*86400000;
  const common={sourceId,revision:s.revision,digest:s.digest,synchronizedAt:s.synchronizedAt,updatedAt:r.updatedAt,scope:s.scope,availability:r.availability,historyComplete:r.historyComplete,freshness:stale?'stale':'unknown',verification:'unverified',needsReconciliation:r.availability==='missing'};
  if(r.kind==='task'){
   const local=s.linkedLocalTaskId?tasks.find(t=>t.id===s.linkedLocalTaskId&&(t.opportunityId||t.opportunity_id)===s.canonicalOpportunityId):null;
   const localTasks=tasks.filter(t=>(t.opportunityId||t.opportunity_id)===s.canonicalOpportunityId);
   result.tasks.push({...r,...common,localTaskId:local?.id||null,localState:local?.state||null,relationship:s.linkedLocalTaskId?(local?'explicitly_linked':'link_unavailable'):localTasks.length?'unresolved':'external_only',stateConflict:!!local&&local.state!==r.state});
  }else{
   result.policies.push({...r,...common,termObservations:s.termObservations||[],termConflict:new Set((s.termObservations||[]).filter(t=>t.termId===r.termId).map(t=>JSON.stringify([t.effectiveDate,t.expirationDate]))).size>1,needsReconciliation:common.needsReconciliation||['cancelled','replaced','unknown'].includes(r.status)});
   const groups=new Map();
   for(const observation of s.observations||[]){const factKey=renewalFactKey(r.id,observation.termId,observation.field);if(!groups.has(factKey))groups.set(factKey,[]);groups.get(factKey).push(observation);}
   for(const [factKey,observations] of groups){
    const values=[...new Set(observations.map(o=>o.value))];const field=observations[0].field;
    const activeReviews=records.filter(i=>i.kind==='fact'&&i.factKey===factKey&&i.externalEvidence?.sourceId===sourceId&&i.externalEvidence?.field===field&&i.dimensions?.freshness!=='superseded');
    const valid=activeReviews.filter(i=>i.externalEvidence.revision===s.revision&&i.externalEvidence.digest===s.digest&&i.dimensions?.verification==='verified'&&i.dimensions?.freshness==='current'&&!stale&&r.availability==='present');
    const reviewedValues=[...new Set(valid.map(i=>i.value))];
    result.renewals.push({...common,policyId:r.id,termId:observations[0].termId,field,factKey,observations,values,conflict:values.length>1||reviewedValues.length>1,verification:reviewedValues.length===1?'producer_reviewed':'unverified',freshness:observations[0].termId!==r.termId?'stale':common.freshness,resolution:reviewedValues.length===1?'reviewed_choice':activeReviews.length?'review_stale_or_unresolved':'unresolved',reviewedValue:reviewedValues.length===1?reviewedValues[0]:null,reviewIds:valid.map(i=>i.id)});
   }
  }
 }
 return result;
}
