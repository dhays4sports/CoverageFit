// Isolated SQLite acceptance adapter only; never import from Cloudflare routes.
import {signalCurrentDecisionLocal} from './signal-current-decision-local.mjs';
import {PRODUCER_INTELLIGENCE_CONTRACT,unavailableDecision,ATTENTION_SELECTION_BUILD,encodeAttentionCursor,decodeAttentionCursor,compareAttentionKeys} from './producer-intelligence-contract.mjs';
export function producerIntelligenceLocal(db,{syntheticOnly=false}={}){
 if(!syntheticOnly)throw Error('synthetic_only_required');
 const reader=signalCurrentDecisionLocal(db,{syntheticOnly:true});
 const tx=fn=>{if(db.isTransaction)throw Error('own_read_snapshot_required');db.exec('BEGIN');try{const r=fn();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}};
 function ready(){try{
  db.prepare('SELECT opportunity_id FROM cf_ucp_opportunity_links LIMIT 0').all();
  db.prepare('SELECT generation,target_revision FROM cf_evaluation_queue LIMIT 0').all();
  db.prepare('SELECT context_version,decision_json FROM cf_evaluation_results LIMIT 0').all();
  db.prepare('SELECT profile_version FROM cf_evidence_decisions LIMIT 0').all();
  db.prepare('SELECT event_key,state,retain_until,source_ref_json FROM cf_evidence_events LIMIT 0').all();
  db.prepare('SELECT assertion_json,superseded_at FROM cf_evidence_assertions LIMIT 0').all();
  db.prepare('SELECT revision FROM cf_evidence_revisions LIMIT 0').all();return true;
 }catch{return false}}
 const allowed=(a,id)=>a.workspaceRead===true||a.recordIds?.includes(id);
 function record(a,id,available){
  if(!allowed(a,id))return null;
  const op=db.prepare('SELECT id,contact_json,products,source,status,created_at,updated_at FROM cf_solo_opportunities WHERE workspace_id=? AND id=?').get(a.workspace,id);
  if(!op)return null;
  const decision=available?reader.currentInSnapshot(a.workspace,id,{now:a.now}):unavailableDecision(id,a.now,'DECISION_MIGRATION_UNAVAILABLE');
  const contact=JSON.parse(op.contact_json||'{}');
  return {workspace:a.workspace,decision,record:{id,name:contact.name||'Synthetic prospect',products:op.products,source:op.source,status:op.status,created_at:op.created_at,updated_at:op.updated_at,
   opportunity:{...op,contact,contact_json:undefined},population:{population:decision.population||'OTHER'},sources:[],commitments:[]}};
 }
 function attentionPage(a){return tx(()=>{
  if(!ready())return {unavailable:'DECISION_MIGRATION_UNAVAILABLE'};
  try{db.prepare('SELECT attention_json,attention_eligible,attention_order,attention_due FROM cf_evaluation_queue LIMIT 0').all()}catch{return {unavailable:'ATTENTION_MIGRATION_UNAVAILABLE'}}
  const start=performance.now(),key=decodeAttentionCursor(a.after),tuple=q=>[q.attention_order,q.attention_due,q.opportunity_id];
  let keys,pending=false,failed=false,unpublished=false,scopeExamined=0;
  if(a.workspaceRead){
   // No post-index filter: even expired candidates consume the explicit window.
   // This is a bounded ordered index seek, not an inventory scan to fill a page.
   keys=db.prepare(`SELECT opportunity_id,attention_order,attention_due,attention_json,generation,target_revision FROM cf_evaluation_queue INDEXED BY cf_eval_attention
    WHERE workspace_id=? AND attention_eligible=1 ${key?'AND (attention_order,attention_due,opportunity_id)>(?,?,?)':''}
    ORDER BY attention_order,attention_due,opportunity_id LIMIT ?`).all(a.workspace,...(key||[]),a.limit+1);
   pending=!!db.prepare("SELECT 1 FROM cf_evaluation_queue WHERE workspace_id=? AND state='READY' AND due_at<=? LIMIT 1").get(a.workspace,a.now)
    ||!!db.prepare("SELECT 1 FROM cf_evaluation_queue WHERE workspace_id=? AND state='LEASED' LIMIT 1").get(a.workspace);
   failed=!!db.prepare("SELECT 1 FROM cf_evaluation_queue WHERE workspace_id=? AND state='FAILED' LIMIT 1").get(a.workspace);
   unpublished=!!db.prepare('SELECT 1 FROM cf_evaluation_queue INDEXED BY cf_eval_attention_unpublished WHERE workspace_id=? AND attention_json IS NULL LIMIT 1').get(a.workspace);
  }else{
   // At most 100 authorized PK lookups; no wide IN parameter list, no tenant scan.
   keys=[];
   for(const id of a.recordIds){scopeExamined++;
    const q=db.prepare('SELECT * FROM cf_evaluation_queue WHERE workspace_id=? AND opportunity_id=?').get(a.workspace,id);
    if(!q){unpublished=true;continue}
    pending ||= q.state==='LEASED'||q.state==='READY'&&q.due_at<=a.now;failed ||= q.state==='FAILED';unpublished ||= !q.attention_json;
    if(q.attention_eligible&&(!key||compareAttentionKeys(tuple(q),key)>0))keys.push(q);
   }
   keys.sort((x,y)=>compareAttentionKeys(tuple(x),tuple(y)));keys=keys.slice(0,a.limit+1);
  }
  const selectionMs=performance.now()-start,selected=keys.slice(0,a.limit),validationStart=performance.now();
  const items=selected.map(q=>{
   const item=record(a,q.opportunity_id,true)||{workspace:a.workspace,record:{id:q.opportunity_id,opportunity:{id:q.opportunity_id,contact:{}},sources:[]},decision:unavailableDecision(q.opportunity_id,a.now,'RECORD_UNAVAILABLE')};
   let c;try{c=JSON.parse(q.attention_json)}catch{}
   const d=item.decision;
   if(!c||c.build!==ATTENTION_SELECTION_BUILD||c.published_at>a.now||c.valid_until&&c.valid_until<=a.now
    ||c.decision_id!==d.decision_version||c.evidence_revision!==d.evidence_revision||c.context_version!==d.context_version
    ||c.profile_version!==d.decision_profile_version||c.queue_generation!==q.generation||c.queue_generation!==d.evaluation?.generation
    ||c.result_generation!==d.historical?.generation||q.target_revision!==c.evidence_revision)
    item.decision=unavailableDecision(q.opportunity_id,a.now,'ATTENTION_CANDIDATE_INVALIDATED');
   return {...item,candidate_key:tuple(q)};
  });
  return {items,next_cursor:keys.length>a.limit?encodeAttentionCursor(tuple(selected.at(-1))):null,
   coverage:{selection:'GLOBAL_EVALUATED_CANDIDATES',population_completeness:'NOT_CERTIFIED',pending_evaluation:pending,failed_evaluation:failed,unpublished_candidates:unpublished,
    candidate_rows_read:keys.length,scope_rows_examined:scopeExamined,candidates_validated:selected.length,window_limit:a.limit,has_more:keys.length>a.limit,
    restart_from_first_page_for_new_priority:true,as_of:a.now},
   read_metrics:{selection_ms:selectionMs,validation_ms:performance.now()-validationStart}};
 })}
 return {contract:PRODUCER_INTELLIGENCE_CONTRACT,runtime:'LOCAL_SYNTHETIC',initialized:true,consistency:'SQLITE_READ_TRANSACTION',attentionPage,
  read:a=>tx(()=>record(a,a.id,ready())),
  page:a=>tx(()=>{
   if(!ready())return {unavailable:'DECISION_MIGRATION_UNAVAILABLE'};
   if(!a.workspaceRead&&!a.recordIds?.length)return {items:[],next_cursor:null};
   const restriction=a.workspaceRead?'':` AND opportunity_id IN (${a.recordIds.map(()=>'?').join(',')})`;
   const keys=db.prepare('SELECT opportunity_id AS id FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id>?'+restriction+' ORDER BY opportunity_id LIMIT ?').all(a.workspace,a.after,...(a.workspaceRead?[]:a.recordIds),a.limit+1);
   const selected=keys.slice(0,a.limit);return {items:selected.map(k=>record(a,k.id,true)),next_cursor:keys.length>a.limit?selected.at(-1).id:null};
  })};
}
