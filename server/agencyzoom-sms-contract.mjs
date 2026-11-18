import {externalId,reject} from './agencyzoom-contract-utils.mjs';
import {zonedTime} from './agencyzoom-resource-contract.mjs';
export const AZ_SMS_KIND='agencyzoom_sms_v3';
export const SMS_LIMITS=Object.freeze({pageMessages:25,threadMessages:200,messageBytes:4096,pageBytes:131072,versions:400,archiveBytes:1048576,threadPages:64,window:20});
const object=(v,keys)=>{if(!v||Object.getPrototypeOf(v)!==Object.prototype||Object.keys(v).some(k=>!keys.includes(k)))reject('unsupported_fields');};
const one=(v,values)=>{if(!values.includes(v))reject('malformed_sms');return v;};
export const smsHeader=page=>{const {messages,pageIndex,...header}=page;return header;};
export function normalizeAgencyZoomSms(v,agency){
 object(v,['agencyId','synthetic','id','revision','customerId','leadId','anchorOpportunityId','opportunityId','createdAt','updatedAt','relationship','otherProviderReference','sourceSuppression','historyCompleteReported','pageIndex','pageCount','messages']);
 if(v.synthetic!==true||v.agencyId!==agency)reject('agency_scope');
 const r={agencyId:externalId(v.agencyId),id:externalId(v.id),revision:externalId(v.revision),customerId:externalId(v.customerId),leadId:externalId(v.leadId),anchorOpportunityId:externalId(v.anchorOpportunityId),opportunityId:v.opportunityId===null?null:externalId(v.opportunityId),createdAt:zonedTime(v.createdAt),updatedAt:zonedTime(v.updatedAt),relationship:one(v.relationship,['attributed','unresolved']),otherProviderReference:null,sourceSuppression:one(v.sourceSuppression,['unknown','historical_opt_out']),historyCompleteReported:v.historyCompleteReported,pageIndex:v.pageIndex,pageCount:v.pageCount};
 if(r.opportunityId!==null&&r.opportunityId!==r.anchorOpportunityId)reject('ambiguous_identity');
 if(Date.parse(r.updatedAt)<Date.parse(r.createdAt)||typeof r.historyCompleteReported!=='boolean')reject('malformed_sms');
 if(!Number.isInteger(r.pageIndex)||!Number.isInteger(r.pageCount)||r.pageIndex<0||r.pageCount<1||r.pageCount>8||r.pageIndex>=r.pageCount)reject('page_bound');
 if(v.otherProviderReference!==null){object(v.otherProviderReference,['provider','id']);r.otherProviderReference={provider:one(v.otherProviderReference.provider,['ringcentral']),id:externalId(v.otherProviderReference.id)};}
 if(!Array.isArray(v.messages)||v.messages.length>SMS_LIMITS.pageMessages)reject('record_bound');
 const seen=new Set();r.messages=v.messages.map(m=>{
  object(m,['id','conversationId','revision','direction','authorRole','authorId','occurredAt','updatedAt','body','change','delivery']);
  const out={id:externalId(m.id),conversationId:externalId(m.conversationId),revision:externalId(m.revision),direction:one(m.direction,['inbound','outbound','unknown']),authorRole:one(m.authorRole,['prospect','producer','system','unknown']),authorId:m.authorId===null?null:externalId(m.authorId),occurredAt:m.occurredAt===null?null:zonedTime(m.occurredAt),updatedAt:zonedTime(m.updatedAt),body:m.body,change:one(m.change,['original','edited','deleted']),delivery:one(m.delivery,['unreported','reported_sent','reported_delivered','reported_read','reported_failed'])};
  if(out.conversationId!==r.id||seen.has(out.id))reject('ambiguous_identity');seen.add(out.id);
  if(Date.parse(out.updatedAt)>Date.parse(r.updatedAt)||(out.occurredAt&&Date.parse(out.occurredAt)>Date.parse(out.updatedAt)))reject('malformed_timestamp');
  if(out.change==='deleted'){if(out.body!==null)reject('malformed_sms');}
  else if(typeof out.body!=='string'||!out.body.trim()||new TextEncoder().encode(out.body).length>SMS_LIMITS.messageBytes||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(out.body))reject('record_bound');
  if(out.body&&/\b\d{3}-\d{2}-\d{4}\b/.test(out.body))reject('sensitive_message');
  return out;
 });
 if(new TextEncoder().encode(JSON.stringify(r)).length>SMS_LIMITS.pageBytes)reject('record_bound');return r;
}
export async function smsDigest(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),b=>b.toString(16).padStart(2,'0')).join('');}
