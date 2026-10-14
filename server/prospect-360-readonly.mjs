import {reconcileProducerIntelligence} from './producer-intelligence-contract.mjs';
// PROSPECT-360-RENEWALS-0.1 — bounded read-only evidence projection.
// Do not infer household links, verified renewal timing or messaging permission.
import {dueWindow,actionableCommitment} from './commitment-projection.mjs';
const txt=(v,n=180)=>typeof v==='string'?v.trim().slice(0,n):'';
const verificationSet=new Set(['customer_confirmed','document_verified','producer_confirmed']);
const YYYY_MM=/^(\d{4})-(0[1-9]|1[0-2])$/;
function timing(raw){
 const str=txt(raw,40);
 if(!str)return null;
 const date=dueWindow(str);
 if(date.precision==='day')return {date:date.date,month:null,precision:'exact'};
 if(YYYY_MM.test(str))return {date:null,month:str,precision:'month'};
 return null;
}
function claim(value,{kind,id,observedAt,verification='imported_unverified'}={}){
 const parsed=timing(value);if(!parsed)return null;
 return {...parsed,source_kind:kind||'unknown',source_id:txt(id,150)||null,
  observed_at:txt(observedAt,40)||null,verification:verificationSet.has(verification)?verification:'imported_unverified'};
}
function uniqueClaims(items){
 const found=new Map();
 for(const e of items.filter(Boolean)){
  const key=[e.date||e.month,e.source_kind,e.source_id,e.verification].join('|');
  if(!found.has(key))found.set(key,e);
 }
 return [...found.values()].slice(0,40);
}
function renewalEvidence(d){
 const sources=d.sources||[],out=[];
 for(const s of sources){
  const v=s.summary||{};
  const raw=v.rawFacts||v.raw_facts||{};
  if(raw.renewal_date)out.push(claim(raw.renewal_date,{kind:s.kind,id:s.source_id,observedAt:s.updated_at}));
  if(v.context?.distribution?.knownContext?.renewal_date)
   out.push(claim(v.context.distribution.knownContext.renewal_date,{kind:s.kind,id:s.source_id,observedAt:s.updated_at}));
  // Only a structured, explicit verification record can establish an exact confirmed date.
  if(s.kind==='renewal_verification_v1'&&verificationSet.has(v.verification_status)){
   out.push(claim(v.renewal_exact_date,{kind:s.kind,id:s.source_id,observedAt:v.confirmed_at||s.updated_at,verification:v.verification_status}));
  }
 }
 const sms=d.sms||{};
 if(sms.facts?.renewal_date)out.push(claim(sms.facts.renewal_date,{kind:'sms_fact',id:sms.fact_provenance?.renewal_date?.message_id||sms.conversation_id||null,observedAt:sms.fact_provenance?.renewal_date?.occurred_at}));
 if(sms.facts?.renewal_month)out.push(claim(sms.facts.renewal_month,{kind:'sms_fact',id:sms.conversation_id||null}));
 // Opportunity deadline without explicit renewal source is *not* renewal proof.
 return uniqueClaims(out);
}
export function projectProspect360(d,{now=new Date(),identity=null}={}){
 if(d&&Object.hasOwn(d,'current_decision'))d=reconcileProducerIntelligence(d,d.current_decision);
 if(!d?.opportunity||!d?.population)throw Error('prospect_detail_required');
 const op=d.opportunity;const sources=Array.isArray(d.sources)?d.sources:[];
 const claims=renewalEvidence(d);
 const values=new Set(claims.map(x=>x.date||x.month));
 const confirmed=claims.filter(x=>x.date&&verificationSet.has(x.verification));
 const conflicting=values.size>1;
 let selected=null,verification='unknown',lifecycle='UNKNOWN';
 if(conflicting){verification='conflicted';lifecycle='CANDIDATE';}
 else if(confirmed.length){selected=confirmed[0];verification=selected.verification;lifecycle='VERIFIED';}
 else if(claims.length){selected=claims[0];verification='imported_unverified';lifecycle='CANDIDATE';}
 const nowDate=now instanceof Date?now:new Date(now);
 if(Number.isFinite(nowDate.getTime())&&selected?.date&&verificationSet.has(verification)){
  const days=Math.round((Date.parse(selected.date+'T00:00:00Z')-Date.UTC(nowDate.getUTCFullYear(),nowDate.getUTCMonth(),nowDate.getUTCDate()))/86400000);
  if(days<0){lifecycle='STALE';verification='stale';}
  else if(days<=30)lifecycle='WINDOW_OPEN';
  else if(days<=90)lifecycle='UPCOMING';
 }
 const commitmentRows=(d.commitments||[]).filter(x=>x&&x.status==='open')
  .slice(0,30).map(x=>({id:txt(x.id,130),type:txt(x.type,40),title:txt(x.title,160),
   due_at:x.due_at||null,due_date:x.due_date||null,
   confirmation:txt(x.confirmation,45),actionable:d.current_decision?false:actionableCommitment(x),source_ref:x.source_ref||null}));
 const evidence=claims.map(x=>({...x}));
 const safeIdentity=identity?.status==='linked'?{
  status:'linked',customer_id:identity.customer_id,household_id:identity.household_id,
  link_basis:identity.link_basis,related_opportunities:identity.related_opportunities
 }: {status:identity?.status==='unavailable'?'unavailable':'not_linked',related_opportunities:[]};
 return {
  version:'PROSPECT-360-RENEWALS-0.1',opportunity_id:op.id,population:d.population.population,
  identity:safeIdentity,
  ...(d.current_decision?{current_decision:d.current_decision,human_attention_eligible:d.human_attention_eligible,execution_authority:d.execution_authority,review_context:d.review_context}:{}),
  product_line:txt(op.products,90)||'Unknown',
  source_count:sources.length,
  facts:{
   renewal:{verification,lifecycle,
    value:selected?{date:selected.date,month:selected.month,precision:selected.precision}:null,
    evidence,conflict:conflicting,source_id:selected?.source_id||null,
    // Date evidence never grants contact permission, even if source is customer-confirmed.
    sms_send_authorized:false},
   decision:{attention_band:d.attention?.band||null,next_action:d.actionQuality?.action?.code||null,
    why_now:txt(d.actionQuality?.why_now?.text,260)||null},
   contact_safety:{suppressed:d.contactSafety?.suppressed===true,sms_authority:'NOT_EVALUATED'}
  },
  commitments:commitmentRows,
  limitations:{read_only:true,no_new_identity_merge:true,provenance_required:true,
   verified_renewal_does_not_grant_outreach:true}
 };
}
export async function readProspectIdentity(repo,opportunityId){
 try{
  const link=(await repo.rows('SELECT customer_id,household_id,link_basis FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id=? LIMIT 1',repo.scope.workspace,opportunityId))[0];
  if(!link)return {status:'not_linked'};
  const related=await repo.rows('SELECT opportunity_id FROM cf_ucp_opportunity_links WHERE workspace_id=? AND customer_id=? ORDER BY opportunity_id LIMIT 30',repo.scope.workspace,link.customer_id);
  return {status:'linked',customer_id:link.customer_id,household_id:link.household_id,link_basis:link.link_basis,
   related_opportunities:related.map(x=>x.opportunity_id)};
 }catch(e){if(/no such table/i.test(String(e?.message||'')))return {status:'unavailable'};throw e}
}
