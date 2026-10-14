// Isolated SQLite acceptance adapter only; never import from Cloudflare routes.
import {signalCurrentDecisionLocal} from './signal-current-decision-local.mjs';
import {PRODUCER_INTELLIGENCE_CONTRACT,unavailableDecision} from './producer-intelligence-contract.mjs';
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
 return {contract:PRODUCER_INTELLIGENCE_CONTRACT,runtime:'LOCAL_SYNTHETIC',initialized:true,consistency:'SQLITE_READ_TRANSACTION',
  read:a=>tx(()=>record(a,a.id,ready())),
  page:a=>tx(()=>{
   if(!ready())return {unavailable:'DECISION_MIGRATION_UNAVAILABLE'};
   if(!a.workspaceRead&&!a.recordIds?.length)return {items:[],next_cursor:null};
   const restriction=a.workspaceRead?'':` AND opportunity_id IN (${a.recordIds.map(()=>'?').join(',')})`;
   const keys=db.prepare('SELECT opportunity_id AS id FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id>?'+restriction+' ORDER BY opportunity_id LIMIT ?').all(a.workspace,a.after,...(a.workspaceRead?[]:a.recordIds),a.limit+1);
   const selected=keys.slice(0,a.limit);return {items:selected.map(k=>record(a,k.id,true)),next_cursor:keys.length>a.limit?selected.at(-1).id:null};
  })};
}
