// COMMAND-CENTER-TODAY-INBOX-0.1 — read-only projection of existing producer work.
// Provides no new lead identity, contact permission, messaging transport, or send authority.
// No source mutations or new database tables. Producer Workspace owns the underlying data.
import {producerWorkspace} from './producer-workspace.mjs';
const STOP=new Set(['DO_NOT_CONTACT','CLOSE_NO_OUTREACH','WAIT_UNTIL_RECORDED_TIME']);
const urgent=new Set(['NOW','TODAY','HIGH']);
const trim=(v,max=240)=>String(v??'').slice(0,max);
const isHeld=r=>r?.population==='DISTRICT_CONTROL'
  ||r?.attention?.band==='SUPPRESSED'
  ||r?.attention?.actionable===false
  ||r?.sms?.contact_suppressed===true
  ||r?.sms?.decision_2==='STOP'
  ||STOP.has(r?.action_quality?.action?.code);
function common(r){
 return {
  opportunity_id:r.id,
  name:trim(r.name,120),
  population:r.population,
  products:trim(r.products,100),
  source:trim(r.source,90),
  updated_at:r.updated_at||null,
  band:r.attention?.band||'UNVERIFIED',
  why_now:trim(r.action_quality?.why_now?.text||r.attention?.reasons?.[0]?.text||'',260),
  next_action:r.action_quality?.action?.code||null,
  next_action_label:trim(r.action_quality?.action?.label||'',240),
  due_at:r.action_quality?.action?.due_at||r.attention?.due_at||null,
  evidence_count:(r.action_quality?.evidence||[]).length,
  // Opportunity.deadline by itself is not a customer-confirmed renewal date.
  timing_hint:r.deadline?{raw:trim(r.deadline,40),verification:'UNVERIFIED_OPPORTUNITY_DEADLINE'}:null,
  actionable:!isHeld(r)&&r.action_quality?.actionable===true
 };
}
function messageCategory(r){
 if(r.population!=='DISTRICT_SIGNAL'||!r.sms)return null;
 if(isHeld(r))return null;
 if(r.sms.draft_status==='delivery_review'||r.sms.draft_status==='sending')return 'DELIVERY_REVIEW';
 if(r.sms.draft_status==='pending'&&r.sms.decision_2==='ASK_ONE_QUESTION')return 'DRAFT_REVIEW';
 if(r.sms.draft_status==='pending')return 'DRAFT_REVIEW';
 if(r.attention?.band==='NOW'&&r.attention?.reasons?.some(x=>x.source_ref?.kind==='sms'))return 'NEEDS_PRODUCER_ATTENTION';
 return null;
}
export function projectCommandCenter(work,{maxRows=30}={}){
 if(!work||!Array.isArray(work.records)||work.attention_enabled!==true)
  return {enabled:false,reason:'attention_not_certified',today:[],inbox:[],counts:{today:0,needs_attention:0,draft_review:0,delivery_review:0},coverage:{provider_inbound_live_certified:false,source:'producer_work'}};
 // The workspace already excludes TEST/synthetic and computes STOP/CONTROL guards.
 const records=work.records.filter(r=>r&&typeof r.id==='string');
 const today=records.filter(r=>!isHeld(r)&&r.action_quality?.actionable===true&&urgent.has(r.attention?.band))
  .map(common);
 const inbox=records.map(r=>{
  const category=messageCategory(r);
  if(!category)return null;
  return {...common(r),category,latest_inbound:trim(r.sms?.latest_inbound,260),
   draft_state:trim(r.sms?.draft_status,35),decision_2:trim(r.sms?.decision_2,35),
   // Positive SMS permission cannot be inferred from existence of a draft.
   sms_send_eligible:false,send_authority:'NOT_EVALUATED',can_bulk_approve:false};
 }).filter(Boolean);
 // All underlying work records were ranked by the existing recommended ordering,
 // but the inbox is grouped by meaningful interruptions, not a fabricated "unread".
 const bucket={DELIVERY_REVIEW:0,NEEDS_PRODUCER_ATTENTION:1,DRAFT_REVIEW:2};
 inbox.sort((a,b)=>bucket[a.category]-bucket[b.category]
  ||String(b.updated_at||'').localeCompare(String(a.updated_at||''))
  ||a.opportunity_id.localeCompare(b.opportunity_id));
 const limit=Math.min(40,Math.max(1,Number(maxRows)||30));
 return {
  enabled:true,
  version:'COMMAND-CENTER-TODAY-INBOX-0.1',
  today:today.slice(0,limit),
  inbox:inbox.slice(0,limit),
  counts:{
   today:today.length,
   needs_attention:inbox.filter(x=>x.category==='NEEDS_PRODUCER_ATTENTION').length,
   draft_review:inbox.filter(x=>x.category==='DRAFT_REVIEW').length,
   delivery_review:inbox.filter(x=>x.category==='DELIVERY_REVIEW').length
  },
  coverage:{
   source:'producer_work',
   scanned_work_records:records.length,
   total_work_matches:Number(work.total||records.length),
   test_excluded:work.test_excluded||0,
   provider_inbound_live_certified:false,
   inbox_scope:'Linked SIGNAL SMS decision snapshots only; not the complete RingCentral message history',
   contact_authority:'NOT_EVALUATED',
   read_only:true
  }
 };
}
export async function commandCenterPreview(repo,env){
 if(env.CF_COMMAND_CENTER_READONLY_ENABLED!=='1')return {enabled:false,reason:'feature_disabled'};
 // Read-only command center consumes the canonical single producer projection.
 const work=await producerWorkspace(repo,env).list(
  new URLSearchParams({population:'ALL',status:'open',sort:'recommended'}),
  {allRecords:true}
 );
 return projectCommandCenter(work);
}
