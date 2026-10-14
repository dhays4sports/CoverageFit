// C4 runtime-neutral read contract. No database, Node, provider or execution imports.
export const PRODUCER_INTELLIGENCE_CONTRACT='CF-PRODUCER-INTELLIGENCE-READ-1';
export const ATTENTION_SELECTION_BUILD='CF-GLOBAL-ATTENTION-1';
// One existing C4 attention policy shared by transaction-time selection and reads.
export function currentProducerAttention(v){
 const current=v.status==='CURRENT',rec=current?v.recommendation:null;
 const human=current&&v.producer_attention===true&&['CALL','QUOTE PREPARATION','HUMAN REVIEW'].includes(rec?.action);
 const urgent=human&&['CUSTOMER_REQUESTED_CALL','CUSTOMER_REQUESTED_QUOTE','COMMITMENT_DUE'].includes(v.reason);
 return {human,urgent,band:v.status==='HELD'?'SUPPRESSED':human?(urgent?'NOW':rec.action==='HUMAN REVIEW'?'NORMAL':'TODAY'):current&&rec?.action==='LATER'?'UPCOMING':'WAITING',rank:urgent?120:human?80:0,intent_rank:urgent?3:0};
}
export function encodeAttentionCursor(key){return 'attention:'+btoa(JSON.stringify(key))}
export function decodeAttentionCursor(cursor){
 if(!cursor)return null;
 try{if(typeof cursor!=='string'||cursor.length>600||!cursor.startsWith('attention:'))throw 0;
  const k=JSON.parse(atob(cursor.slice(10)));
  if(!Array.isArray(k)||k.length!==3||!Number.isSafeInteger(k[0])||k[0]>0||k[0]<-1000||typeof k[1]!=='string'||!(k[1]==='9999'||/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(k[1]))||typeof k[2]!=='string'||! /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(k[2]))throw 0;return k;
 }catch{throw Error('INVALID_ATTENTION_CURSOR')}
}
export const compareAttentionIds=(a,b)=>a===b?0:a<b?-1:1; // ASCII IDs; SQLite BINARY parity.
export const compareAttentionKeys=(a,b)=>a[0]-b[0]||compareAttentionIds(a[1],b[1])||compareAttentionIds(a[2],b[2]);
export const decisionAttentionDue=(reason,commitments=[])=>reason==='COMMITMENT_DUE'?commitments.filter(c=>c.confirmed&&c.status==='open'&&c.evidence_ref).map(c=>c.at).sort()[0]||null:null;
const statuses=new Set(['CURRENT','PENDING','STALE','HELD','FAILED','UNAVAILABLE']);
const codes={'CALL':'CALL_CUSTOMER','QUOTE PREPARATION':'PREPARE_OR_REVIEW_QUOTE','HUMAN REVIEW':'PRODUCER_REVIEW_AND_RESPOND','ASK ONE QUESTION':'ASK_ONE_QUESTION','LATER':'WAIT_UNTIL_RECORDED_TIME','CLOSE':'CLOSE_NO_OUTREACH','NO ACTION':'NO_ACTION'};
export const shadowAuthority=()=>({sms:false,call:false,calendar:false,crm:false,external:false,reason:'SHADOW_ONLY'});
export function unavailableDecision(id,now,reason='DECISION_STORE_UNAVAILABLE'){
 return {id,as_of:now,status:'UNAVAILABLE',reason,recommendation:null,evidence_refs:[],source_references:[],execution_eligibility:shadowAuthority(),producer_attention:false,requires_human_review:true};
}
export function reconcileProducerIntelligence(record,value){
 const id=record.id||record.opportunity?.id;
 let v=value&&value.id===id&&statuses.has(value.status)?{...value}:unavailableDecision(id,value?.as_of,'INVALID_DECISION_CONTRACT');
 // Secondary contract checks never replace C3's atomic source/version assessment.
 if(v.status==='CURRENT'&&(v.build!=='CF-SIGNAL-C3-1'||!codes[v.recommendation?.action]||!v.decision_version||!v.evidence_version||!v.context_version
  ||!Number.isSafeInteger(v.evidence_revision)||v.evaluation?.target_revision!==v.evidence_revision
  ||v.decision_profile_version!==v.historical?.profile_version||!v.decision_profile_version))v=unavailableDecision(id,v.as_of,'INCONSISTENT_DECISION_CONTRACT');
 const pop=typeof record.population==='object'?record.population?.population:record.population;
 const suppression=record.contactSafety?.suppressed||record.sms?.contact_suppressed||record.sms?.decision_2==='STOP'||record.sms?.facts?.opt_out||record.sms?.facts?.wrong_number;
 const restricted=suppression||['CONTROL','DISTRICT_CONTROL','TEST'].includes(pop)||record.pilot?.is_test||record.pilot?.synthetic||record.pilot?.pilot_phase==='TEST'||record.producer_takeover===true||record.sms?.producer_takeover===true||record.sms?.human_active===true||record.status==='closed'||record.opportunity?.status==='closed';
 if(restricted)v={...v,status:'HELD',reason:suppression?'CONTACT_SUPPRESSED':'AUTHORITATIVE_PRODUCER_RESTRICTION',recommendation:null,producer_attention:false,requires_human_review:false};
 if(!['AGENCYZOOM','COVERAGEFIT_APPROVED'].includes(v.workflow_owner)&&v.status==='CURRENT')v={...v,status:'HELD',reason:'WORKFLOW_OWNER_UNKNOWN',recommendation:null};
 const current=v.status==='CURRENT';
 const rec=current?v.recommendation:null;
 const {human,urgent,band,rank,intent_rank}=currentProducerAttention(v);
 const reason=human?'Review internally: '+rec.reason+' Contact authority is not granted.':rec?.reason||v.reason;
 const attention={version:PRODUCER_INTELLIGENCE_CONTRACT,band,rank,intent_rank,
  actionable:human,human_attention_eligible:human,actionability_scope:'INTERNAL_REVIEW_ONLY',due_at:human?v.attention_due_at||null:null,
  reasons:[{text:reason,source_ref:{kind:'signal_current_decision',id:v.decision_version||null}}],requires_human_review:v.requires_human_review===true};
 const actionQuality={version:PRODUCER_INTELLIGENCE_CONTRACT,actionable:human,human_attention_eligible:human,actionability_scope:'INTERNAL_REVIEW_ONLY',
  action:{code:rec?codes[rec.action]:'NO_ACTION',label:reason,channel:null,due_at:null,actionable:false,source:'signal_current_decision'},
  why_now:{text:reason,band,source_ref:{kind:'signal_current_decision',id:v.decision_version||null}},
  evidence:current?(v.source_references||[]).map(e=>({kind:'prospect_memory',text:'Source-backed evidence',source_ref:e.source_ref,event_id:e.event_id})):[]};
 v={...v,recommendation:rec,evidence_refs:current?v.evidence_refs:[],source_references:current?v.source_references:[],execution_eligibility:shadowAuthority()};
 return {...record,current_decision:v,attention,action_quality:actionQuality,actionQuality,
  human_attention_eligible:human,execution_authority:shadowAuthority(),review_context:v.status==='FAILED'||v.status==='UNAVAILABLE'?'EVALUATION_EXCEPTION':v.status==='HELD'?'RESTRICTED_REVIEW':null,
  // Deliberate replacement, not merging: legacy actions cannot survive stale C3 state.
  sms:null,continuation:null,nextBestAction:null,next_best_action:null,opportunityPriority:null,priority:null,
  sources:(record.sources||[]).filter(s=>s.kind!=='signal_continue_v1'),
  sms_enabled:false,copilot_enabled:false,can_bulk_approve:false,calendar_enabled:false,crm_sync_enabled:false};
}
