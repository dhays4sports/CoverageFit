import {externalId,reject} from './agencyzoom-contract-utils.mjs';
export const AZ_RESOURCE_KIND='agencyzoom_resource_v2';
const object=(v,keys)=>{if(!v||Object.getPrototypeOf(v)!==Object.prototype||Object.keys(v).some(k=>!keys.includes(k)))reject('unsupported_fields');};
const text=(v,max=160)=>{if(typeof v!=='string'||!v.trim()||v.length>max||/[\u0000-\u001f]/.test(v))reject('malformed_field');return v;};
export function dateOnly(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)reject('malformed_date');return v;}
export function zonedTime(v){if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}(Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(v)||!Number.isFinite(Date.parse(v)))reject('malformed_timestamp');dateOnly(v.slice(0,10));if(+v.slice(11,13)>23||+v.slice(14,16)>59||+v.slice(17,19)>59)reject('malformed_timestamp');return v;}
export const dateValue=v=>typeof v==='string'&&v.length===10?dateOnly(v):zonedTime(v);
const nullableId=v=>v===null?null:externalId(v);
export function normalizeAgencyZoomResource(v,agency){
 const common=['agencyId','synthetic','kind','id','revision','customerId','leadId','anchorOpportunityId','opportunityId','createdAt','updatedAt','availability','historyComplete'];
 const task=['title','assigneeId','state','dueAt'];
 const policy=['carrier','product','status','termId','effectiveDate','expirationDate','renewalEffectiveDate','replacesPolicyId','dates'];
 object(v,[...common,...(v?.kind==='task'?task:policy)]);
 if(v.synthetic!==true||v.agencyId!==agency)reject('agency_scope');
 if(!['task','policy'].includes(v.kind))reject('unsupported_resource');
 const out={agencyId:externalId(v.agencyId),kind:v.kind,id:externalId(v.id),revision:externalId(v.revision),customerId:externalId(v.customerId),leadId:externalId(v.leadId),anchorOpportunityId:externalId(v.anchorOpportunityId),opportunityId:nullableId(v.opportunityId),createdAt:zonedTime(v.createdAt),updatedAt:zonedTime(v.updatedAt),availability:v.availability,historyComplete:v.historyComplete};
 if(Date.parse(out.updatedAt)<Date.parse(out.createdAt))reject('malformed_timestamp');
 if(!['present','missing'].includes(v.availability)||typeof v.historyComplete!=='boolean')reject('incomplete_resource');
 if(out.opportunityId!==null&&out.opportunityId!==out.anchorOpportunityId)reject('ambiguous_identity');
 if(v.kind==='task'){
  if(!out.opportunityId)reject('reconciliation_required');
  if(!['open','in_progress','waiting','completed','cancelled'].includes(v.state))reject('malformed_task');
  Object.assign(out,{title:text(v.title,240),assigneeId:externalId(v.assigneeId),state:v.state,dueAt:dateValue(v.dueAt)});
 }else{
  if(!['active','expired','cancelled','replaced','unknown'].includes(v.status))reject('malformed_policy');
  Object.assign(out,{carrier:text(v.carrier),product:text(v.product,60),status:v.status,termId:externalId(v.termId),effectiveDate:dateOnly(v.effectiveDate),expirationDate:dateOnly(v.expirationDate),renewalEffectiveDate:v.renewalEffectiveDate===null?null:dateOnly(v.renewalEffectiveDate),replacesPolicyId:nullableId(v.replacesPolicyId)});
  if(out.expirationDate<=out.effectiveDate)reject('invalid_term');
  if(out.renewalEffectiveDate&&out.renewalEffectiveDate<out.effectiveDate)reject('invalid_term');
  if(!Array.isArray(v.dates)||v.dates.length>8)reject('record_bound');
  const ids=new Set();out.dates=v.dates.map(d=>{object(d,['id','field','value','sourceId','sourceRevision','observedAt']);if(!['expiration','renewal_effective','producer_review','prospect_callback'].includes(d.field))reject('malformed_date_kind');const id=externalId(d.id);if(ids.has(id))reject('ambiguous_identity');ids.add(id);return {id,field:d.field,value:['expiration','renewal_effective','producer_review'].includes(d.field)?dateOnly(d.value):dateValue(d.value),sourceId:externalId(d.sourceId),sourceRevision:externalId(d.sourceRevision),observedAt:zonedTime(d.observedAt)};}).sort((a,b)=>a.id.localeCompare(b.id));
 }
 if(new TextEncoder().encode(JSON.stringify(out)).length>5000)reject('record_bound');return out;
}

export async function resourceEvidenceIntegrity(value){
 if(!value?.resource)return false;
 const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),b=>b.toString(16).padStart(2,'0')).join('');
 return await digest(value.resource)===value.digest&&await digest(value.observations||[])===value.observationsDigest&&await digest(value.termObservations||[])===value.termsDigest;
}
