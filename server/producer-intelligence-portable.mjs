// Isolated D1-binding-shaped acceptance adapter. Not installed in a hosted route.
// One SELECT is the snapshot boundary; first-primary supplies initial freshness only.
import {producerReadSQL,READ_BUDGET} from './producer-intelligence-sql.mjs';
import {projectMemoryRows} from './prospect-memory-projection.mjs';
import {projectCurrentDecision} from './signal-current-decision.mjs';
import {normalizeContext} from './signal-context.mjs';
import {planSignal} from './signal-dynamic-planner.mjs';
import {PRODUCER_INTELLIGENCE_CONTRACT,ATTENTION_SELECTION_BUILD,unavailableDecision,decodeAttentionCursor,encodeAttentionCursor} from './producer-intelligence-contract.mjs';
const valid=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(x);
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),x=>x.toString(16).padStart(2,'0')).join('');
async function profile(data,w,p,now){let input;const result=projectMemoryRows(data,w,p,{now},x=>{input=x;return null});result.projection_version=await hash(input);return result}
export function producerIntelligencePortable(db,{syntheticOnly=false}={}){
 if(!syntheticOnly)throw Error('synthetic_only_required');
 const key=r=>[r.attention_order,r.attention_due,r.opportunity_id];
 async function item(a,q,attention){
  const p=q.opportunity_id,base={workspace:a.workspace,record:{id:p,opportunity:{id:p,contact:{}},sources:[]},decision:unavailableDecision(p,a.now)};
  try{
   const h=JSON.parse(q.payload);if(h.error)return {...base,decision:unavailableDecision(p,a.now,h.error)};
   if(!h.op||h.op.id!==p||!h.identity||!h.context||h.op.contact_json===null||h.op.products===null||h.op.source===null)throw Error('CORRUPT_OR_MISSING_RECORD');
   const history=h.history;
   if(history.length>READ_BUDGET.events||history.some(e=>e.assertions.length>READ_BUDGET.assertionsPerEvent))throw Error('HISTORY_ROW_BUDGET_EXCEEDED');
   const rows=history.filter(e=>e.state==='ACTIVE');
   if(rows.some(e=>!e.event_json||!e.source_ref_json||e.assertions.some(x=>!x.assertion_json)))throw Error('CORRUPT_OR_OVERSIZED_EVIDENCE');
   const options=normalizeContext(JSON.parse(h.context)),policy={options,version:await hash(options)};
   const data={rows,identity:{customer_id:h.identity},collisions:history.reduce((n,e)=>n+e.collision,0),revision:h.revision};
   const current=await profile(data,a.workspace,p,a.now),r=h.result,decision=r&&JSON.parse(r.decision_json);
   if(r){const {context_snapshot,...original}=decision,t=h.trace;
    if(!t||t.opportunity_id!==p||t.profile_version!==decision.profile_version||t.action!==decision.action||t.reason_category!==decision.reason_category
     ||await hash([decision.profile_version,original])!==r.decision_id||r.context_version===policy.version&&await hash(normalizeContext(context_snapshot))!==r.context_version)throw Error('CORRUPT_DECISION');
   }
   const atDecision=r&&await profile(data,a.workspace,p,r.evaluated_at);
   let v=projectCurrentDecision({id:p,now:a.now,profile:current,atDecision,policy,queue:q.generation===null?null:q,result:r,decision,
    safety:planSignal(current,{...options,now:a.now}),sourceValid:rows.every(e=>e.source_prospect===p)});
   if(attention){const c=JSON.parse(q.attention_json);
    if(!c||c.build!==ATTENTION_SELECTION_BUILD||c.published_at>a.now||c.valid_until&&c.valid_until<=a.now
     ||c.decision_id!==v.decision_version||c.evidence_revision!==v.evidence_revision||c.context_version!==v.context_version
     ||c.profile_version!==v.decision_profile_version||c.queue_generation!==q.generation||c.queue_generation!==v.evaluation?.generation
     ||c.result_generation!==v.historical?.generation||q.target_revision!==c.evidence_revision)v=unavailableDecision(p,a.now,'ATTENTION_CANDIDATE_INVALIDATED');
   }
   const contact=JSON.parse(h.op.contact_json);
   return {workspace:a.workspace,decision:v,record:{...h.op,name:contact.name||'Synthetic prospect',opportunity:{...h.op,contact,contact_json:undefined},population:{population:v.population||'OTHER'},sources:[],commitments:[]}};
  }catch(e){return {...base,decision:unavailableDecision(p,a.now,['HISTORY_ROW_BUDGET_EXCEEDED','CORRUPT_OR_OVERSIZED_EVIDENCE','CORRUPT_DECISION'].includes(e.message)?e.message:'CORRUPT_OR_MISSING_RECORD')}}
 }
 async function readSnapshot(a,mode){
  // Defense in depth: independent SQL record predicate, even behind trusted authorizer.
  if(!valid(a.workspace)||!valid(a.actor)||!Number.isFinite(Date.parse(a.now)))throw Error('SCOPE_DENIED');
  const restricted=a.workspaceRead!==true;
  if(restricted&&(!Array.isArray(a.recordIds)||a.recordIds.length>100||!a.recordIds.every(valid)))throw Error('SCOPE_DENIED');
  if(mode==='detail'&&(!valid(a.id)||restricted&&!a.recordIds.includes(a.id)))throw Error('RECORD_UNAVAILABLE');
  const limit=mode==='detail'?1:a.limit;
  if(!Number.isInteger(limit)||limit<1||limit>READ_BUDGET.page)throw Error('READ_BUDGET_EXCEEDED');
  const cursor=decodeAttentionCursor(a.after),sql=producerReadSQL({mode,restricted,after:!!cursor});
  const args=[a.workspace,JSON.stringify(restricted?a.recordIds:[]),a.now,...(cursor||[0,'9999','']),limit+1,mode==='detail'?a.id:null];
  const start=performance.now();
  const response=await db.withSession('first-primary').prepare(sql).bind(...args).all();
  if(response.success!==true||!Array.isArray(response.results)||response.meta?.changed_db||response.meta?.rows_written>0)throw Error('READ_INTEGRITY_FAILURE');
  const all=response.results,meta=all.find(x=>x.opportunity_id===null),keys=all.filter(x=>x.opportunity_id!==null);
  if(!meta||all.filter(x=>x.opportunity_id===null).length!==1||keys.length>limit+1||keys.some(q=>!valid(q.opportunity_id)||restricted&&!a.recordIds.includes(q.opportunity_id)))throw Error('INVALID_READ_ENVELOPE');
  const selectionMs=performance.now()-start,t=performance.now(),selected=keys.slice(0,limit),items=[];
  // Sequential projection keeps the transient working set bounded per prospect.
  for(const q of selected)items.push({...await item(a,q,mode==='attention'),candidate_key:key(q)});
  return {items,next_cursor:keys.length>limit?encodeAttentionCursor(key(selected.at(-1))):null,
   coverage:{selection:'GLOBAL_EVALUATED_CANDIDATES',population_completeness:'NOT_CERTIFIED',pending_evaluation:!!meta.pending,failed_evaluation:!!meta.failed,unpublished_candidates:!!meta.unpublished,
    candidate_rows_read:keys.length,scope_rows_examined:restricted?a.recordIds.length:0,candidates_validated:selected.length,window_limit:limit,has_more:keys.length>limit,restart_from_first_page_for_new_priority:true,as_of:a.now,
    history_budget_exceeded:items.filter(x=>x.decision.reason.includes('BUDGET')).length},
   read_metrics:{queries:1,bound_parameters:args.length,sql_bytes:new TextEncoder().encode(sql).length,response_bytes:new TextEncoder().encode(JSON.stringify(all)).length,
    selection_ms:selectionMs,validation_ms:performance.now()-t,rows_read:response.meta?.rows_read??null,rows_read_source:response.meta?.rows_read===undefined?'UNAVAILABLE':'ADAPTER_REPORTED'}};
 }
 return {contract:PRODUCER_INTELLIGENCE_CONTRACT,runtime:'D1_COMPATIBLE_SYNTHETIC',initialized:true,consistency:'SINGLE_STATEMENT',
  attentionPage:a=>a.limit>READ_BUDGET.page?Promise.resolve({unavailable:'READ_BUDGET_EXCEEDED'}):readSnapshot(a,'attention'),
  read:async a=>(await readSnapshot(a,'detail')).items[0]||null,
  // Existing inventory remains on its existing implementation; no unsafe fallback.
  page:async()=>({unavailable:'PORTABLE_INVENTORY_NOT_IMPLEMENTED'})};
}
