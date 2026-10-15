// Read-only normalization. Evidence never becomes a confirmed appointment by inference.
export const COMMITMENT_TYPES=['CALLBACK','APPOINTMENT','FOLLOW_UP','QUOTE_REVIEW','DOCUMENT_EXPECTED','FUTURE_BIND','CLOSING','RENEWAL'];
const bool=v=>typeof v==='boolean'?v:null;
export function dueWindow(value){
 const raw=String(value||'');
 if(/^\d{4}-\d{2}-\d{2}$/.test(raw)&&Number.isFinite(Date.parse(raw))&&new Date(raw).toISOString().slice(0,10)===raw)return {date:raw,at:null,precision:'day'};
 if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(raw)&&Number.isFinite(Date.parse(raw)))return {date:null,at:new Date(raw).toISOString(),precision:'instant'};
 return {date:null,at:null,precision:'unresolved',raw:raw.slice(0,160)};
}
export function projectCommitments({opportunity={},tasks=[],sources=[],sms=null}={}){
 const out=[];
 function add(id,type,value,ref,extra={}){const window=dueWindow(value);out.push({id,opportunity_id:opportunity.id,type,status:'open',due_at:window.at,due_date:window.date,due_window:window,source_ref:ref,customer_committed:null,producer_committed:null,confirmation:'unknown',title:type.replaceAll('_',' '),notes:'',external_provider:null,external_event_id:null,external_event_url:null,invite_status:'unknown',created_at:null,updated_at:null,completed_at:null,cancelled_at:null,...extra});}
 const calendar=sources.filter(s=>s.kind==='calendar');
 for(const source of calendar){const a=source.summary||{},id=a.eventId||source.source_id,status=['cancelled','canceled'].includes(a.status)?'cancelled':a.status==='completed'?'completed':'open';
  add('calendar:'+id,'APPOINTMENT',a.start,{kind:'calendar',id:source.source_id},{status,confirmation:a.status==='scheduled'?'confirmed':'unknown',title:a.title||'Scheduled conversation',external_provider:'google_calendar',external_event_id:id,external_event_url:/^https:\/\/(calendar\.google\.com|www\.google\.com)\//.test(a.eventUrl||a.htmlLink||'')?a.eventUrl||a.htmlLink:null,invite_status:a.inviteStatus||'unknown',customer_committed:bool(a.customerCommitted),producer_committed:bool(a.producerCommitted),created_at:a.createdAt||null,updated_at:source.updated_at||null,cancelled_at:status==='cancelled'?source.updated_at||null:null});
 }
 for(const t of tasks){if(t.source_key?.startsWith('appointment:')&&calendar.some(s=>(s.summary?.eventId||s.source_id)===t.source_key.slice(12)))continue;
  const type=COMMITMENT_TYPES.includes(t.commitment_type)?t.commitment_type:/callback|call as requested/i.test(t.title)?'CALLBACK':/quote review/i.test(t.title)?'QUOTE_REVIEW':/document/i.test(t.title)?'DOCUMENT_EXPECTED':/renewal/i.test(t.title)?'RENEWAL':/closing/i.test(t.title)?'CLOSING':'FOLLOW_UP';
  add('task:'+t.id,type,t.due_at,{kind:'task',id:t.id},{status:['completed','cancelled'].includes(t.state)?t.state:t.state==='waiting'?'waiting':'open',title:t.title,notes:t.blocker||'',producer_committed:t.state==='waiting'?null:true,customer_committed:null,confirmation:'producer_recorded',created_at:t.created_at||null,updated_at:t.updated_at||null,completed_at:t.state==='completed'?t.completed_at:null,cancelled_at:t.state==='cancelled'?t.completed_at:null});
 }
 for(const [field,type] of [['callback_date','CALLBACK'],['closing_date','CLOSING'],['renewal_date','RENEWAL']])if(sms?.facts?.[field])add('sms:'+field,type,sms.facts[field],{kind:'sms_fact',field,evidence:sms.fact_provenance?.[field]||sms.fact_evidence?.[field]||null},{confirmation:'evidence_only'});
 if(sms?.decision_2==='LATER'&&(sms.future_date||sms.future_month))add('sms:future','FUTURE_BIND',sms.future_date||sms.future_month,{kind:'sms_state',field:'future_date'},{confirmation:'recorded_timing'});
 if(opportunity.deadline&&!out.some(c=>c.due_at===opportunity.deadline||c.due_date===opportunity.deadline)){
  const raw=sources.find(s=>s.kind==='lead'&&s.summary?.rawFacts)||sources.find(s=>s.kind==='district_pilot_v1'&&s.summary?.raw_facts),facts=raw?.summary?.rawFacts||raw?.summary?.raw_facts||{};
  const rawType=facts.closing_date===opportunity.deadline?'CLOSING':facts.renewal_date===opportunity.deadline?'RENEWAL':null;
  add('opportunity:deadline',rawType||'FOLLOW_UP',opportunity.deadline,{kind:'opportunity',field:'deadline',basis:rawType?'raw_timing_evidence':'recorded_deadline'},{confirmation:rawType?'evidence_only':'producer_recorded'});
 }
 return out.sort((a,b)=>a.id.localeCompare(b.id));
}
// Optional 1.1 proposal contract, not a provider schema or mutation endpoint.
export function validateCommitmentProposal(p,messages=[]){
 if(!COMMITMENT_TYPES.includes(p?.type)||!Number.isFinite(p.confidence)||p.confidence<0||p.confidence>1||!['customer','producer','both','unknown'].includes(p.who_committed))throw Error('invalid_commitment_proposal');
 const m=messages.find(m=>m.id===p.evidence_message_id);if(!m||!['inbound','outbound'].includes(m.direction)||!p.evidence_text||!m.body?.includes(p.evidence_text))throw Error('unsupported_commitment_evidence');
 if(p.who_committed==='customer'&&m.direction!=='inbound')throw Error('unsupported_customer_commitment');
 return {...p,due_window:dueWindow(p.due_at),confirmation_needed:true,status:'proposed'};
}
