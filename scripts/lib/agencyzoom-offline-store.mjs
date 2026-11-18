import {reviewLedger,REVIEW_SCHEMA} from './evidence-review-ledger.mjs';
import {smsOfflineStore,SMS_ARCHIVE_SCHEMA} from './agencyzoom-sms-store.mjs';
// Node-only isolated synthetic repository. Never imported by a route or Worker.
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {openSync,closeSync,readFileSync,readdirSync} from 'node:fs';
import {AZ_KIND,reject,externalId} from '../../server/agencyzoom-connector.mjs';
import {AZ_RESOURCE_KIND} from '../../server/agencyzoom-resource-contract.mjs';
const hash = value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const now = ()=>new Date().toISOString();
export function openAgencyZoomSyntheticStore(path, config, {create=false}={}) {
  // Create only an empty, exclusive offline file. Never bootstrap an existing DB.
  if (create) { if (path !== ':memory:') closeSync(openSync(path,'wx',0o600)); }
  else if (path === ':memory:') reject('isolation_required');
  const db = new DatabaseSync(path, {open:true, ...(create?{}:{readOnly:false})});
  const get=(q,...v)=>db.prepare(q).get(...v),run=(q,...v)=>db.prepare(q).run(...v);
  function transaction(fn) { db.exec('BEGIN IMMEDIATE'); try { const result=fn(); db.exec('COMMIT'); return result; } catch(e) { db.exec('ROLLBACK'); throw e; } }
  if (create) {
    for (const file of readdirSync(new URL('../../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort()) db.exec(readFileSync(new URL('../../migrations/'+file,import.meta.url),'utf8'));
    db.exec(`CREATE TABLE az_synthetic_scope (singleton INTEGER PRIMARY KEY CHECK(singleton=1), workspace TEXT NOT NULL, agency TEXT NOT NULL, database_id TEXT NOT NULL);
      CREATE TABLE az_external_ids (entity TEXT NOT NULL, external_id TEXT NOT NULL, canonical_id TEXT NOT NULL, parent TEXT NOT NULL, PRIMARY KEY(entity,external_id));
      CREATE TABLE az_read_revisions (lead_id TEXT NOT NULL, revision TEXT NOT NULL, digest TEXT NOT NULL, updated_at TEXT NOT NULL, evidence_json TEXT NOT NULL, PRIMARY KEY(lead_id,revision));
      CREATE TABLE az_read_heads (lead_id TEXT PRIMARY KEY, revision TEXT NOT NULL, updated_at TEXT NOT NULL, digest TEXT NOT NULL);
      CREATE TABLE az_read_audit (sequence INTEGER PRIMARY KEY, code TEXT NOT NULL, occurred_at TEXT NOT NULL);`);
    db.exec(SMS_ARCHIVE_SCHEMA);
    db.exec(REVIEW_SCHEMA);
    run('INSERT INTO az_synthetic_scope VALUES(1,?,?,?)',config.workspace,config.agencyId,config.databaseId);
  }
  const scope = Object.freeze({...config});
  function verify(candidate) {
    const row=get('SELECT * FROM az_synthetic_scope WHERE singleton=1');
    if (candidate.enabled!==true || candidate.mode!=='offline_synthetic' || !/^future-agency:synthetic:[a-z0-9-]+$/.test(candidate.workspace||'') || !/^synthetic-[a-z0-9-]+$/.test(candidate.agencyId||'') || !/^az-test-[a-z0-9-]+$/.test(candidate.databaseId||'') || !row || row.workspace!==candidate.workspace || row.agency!==candidate.agencyId || row.database_id!==candidate.databaseId || candidate.workspace!==scope.workspace || candidate.agencyId!==scope.agencyId || candidate.databaseId!==scope.databaseId) reject('isolation_required');
  }
  try { verify(scope); } catch(e) { db.close(); throw e; }
  const w=scope.workspace;
  const id=(type,external)=>'az_'+type+'_'+hash([w,scope.agencyId,type,external]).slice(0,40);
  const mapped=(entity,external)=>get('SELECT * FROM az_external_ids WHERE entity=? AND external_id=?',entity,external);
  function register(entity, external, canonical, parent) {
    const previous=mapped(entity,external);
    if (previous && (previous.canonical_id!==canonical || previous.parent!==parent)) reject('identity_conflict');
    if (!previous) run('INSERT INTO az_external_ids VALUES(?,?,?,?)',entity,external,canonical,parent);
  }
  function checkpoint(stream=AZ_KIND) { return JSON.parse(get("SELECT cursor_json FROM cf_solo_sync WHERE workspace_id=? AND stream=?",w,stream)?.cursor_json||'null'); }
  function audit(code) { run('INSERT INTO az_read_audit(code,occurred_at) VALUES(?,?)',code,now()); }
  function accept(lead) { verify(scope); if(lead.agencyId!==scope.agencyId) reject('agency_scope'); return transaction(()=> {
    const digest=hash(lead), previous=get('SELECT * FROM az_read_heads WHERE lead_id=?',lead.id), replay=get('SELECT * FROM az_read_revisions WHERE lead_id=? AND revision=?',lead.id,lead.revision);
    if (replay && hash(JSON.parse(replay.evidence_json))!==replay.digest) reject('evidence_integrity');
    if (replay && replay.digest!==digest) reject('revision_conflict');
    const customerMap=mapped('customer',lead.customerId),cid=customerMap?.canonical_id||id('customer',lead.customerId),hh=customerMap?.parent||id('household',lead.customerId);
    const customer=get("SELECT * FROM cf_ucp_customers WHERE workspace_id=? AND id=? AND status='active'",w,cid);
    if ((customerMap && !customer) || (customer && !customerMap) || (customerMap && !get("SELECT 1 FROM cf_ucp_households WHERE workspace_id=? AND id=? AND status='active'",w,hh))) reject('reconciliation_required');
    // Even an old revision replay must validate current canonical links first.
    for (const op of lead.opportunities) {
      const m=mapped('opportunity',op.id); if (m && m.parent!==JSON.stringify([lead.id,lead.customerId])) reject('identity_conflict');
      if (m) { const l=get('SELECT * FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id=?',w,m.canonical_id); if (!l || l.customer_id!==cid || l.household_id!==hh || !get('SELECT 1 FROM cf_solo_opportunities WHERE workspace_id=? AND id=?',w,m.canonical_id)) reject('reconciliation_required'); }
    }
    if (replay) return 0; // never regress a current head to an older previously seen version
    if (previous && (lead.updatedAt < previous.updated_at || (lead.updatedAt===previous.updated_at && digest!==previous.digest))) reject('stale_revision');
    // Removed opportunities are not guessed to be deleted or converted.
    if (previous) { const row=get('SELECT evidence_json FROM az_read_revisions WHERE lead_id=? AND revision=?',lead.id,previous.revision); if(!row || hash(JSON.parse(row.evidence_json))!==previous.digest) reject('evidence_integrity'); const old=JSON.parse(row.evidence_json); if (old.customerId!==lead.customerId || old.opportunities.some(op=>!lead.opportunities.some(x=>x.id===op.id))) reject('reconciliation_required'); }
    const at=now();
    if (!customer) {
      run('INSERT INTO cf_ucp_customers(id,workspace_id,display_name,created_at,updated_at) VALUES(?,?,?,?,?)',cid,w,lead.name,lead.createdAt,at);
      run('INSERT INTO cf_ucp_households(id,workspace_id,label,created_at,updated_at) VALUES(?,?,?,?,?)',hh,w,'Synthetic AgencyZoom household',lead.createdAt,at);
      run('INSERT INTO cf_ucp_household_members(workspace_id,household_id,customer_id,created_at) VALUES(?,?,?,?)',w,hh,cid,at);
    }
    register('customer',lead.customerId,cid,hh);
    for (const op of lead.opportunities) {
      const m=mapped('opportunity',op.id),oid=m?.canonical_id||id('opportunity',op.id),sourceId=id('source',[lead.id,op.id]);
      if (!m) {
        run('INSERT INTO cf_solo_opportunities(id,workspace_id,owner_id,contact_json,source,products,last_mutation_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',oid,w,'synthetic-owner',JSON.stringify({name:lead.name,contactBasis:'Not recorded'}),'AgencyZoom',op.product,'az:initial',lead.createdAt,at);
        run("INSERT INTO cf_ucp_opportunity_links(workspace_id,opportunity_id,customer_id,household_id,link_basis,linked_by,request_id,created_at,updated_at) VALUES(?,?,?,?,'seeded_from_opportunity','agencyzoom-offline',?,?,?)",w,oid,cid,hh,sourceId,at,at);
      }
      register('opportunity',op.id,oid,JSON.stringify([lead.id,lead.customerId]));
      register('source',JSON.stringify([lead.id,op.id]),sourceId,oid);
      const evidence={provider:'AgencyZoom',mode:'offline_synthetic',status:'synchronized',leadName:lead.name,revision:lead.revision,digest,createdAt:lead.createdAt,updatedAt:lead.updatedAt,synchronizedAt:at,source:lead.source,pipeline:lead.pipeline,stage:lead.stage,producerId:lead.producerId,opportunity:op,tasks:lead.tasks,notes:lead.notes,review:'unreviewed_external_evidence',contactAuthorityGranted:false};
      run('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id,kind,source_id) DO UPDATE SET summary_json=excluded.summary_json,updated_at=excluded.updated_at',w,AZ_KIND,sourceId,oid,JSON.stringify(evidence),at);
      // Only evidence changes; local edits, stages, tasks and reviews retain authority.
      run('UPDATE cf_solo_opportunities SET edit_version=edit_version+1,updated_at=? WHERE workspace_id=? AND id=?',at,w,oid);
    }
    run('INSERT INTO az_read_revisions VALUES(?,?,?,?,?)',lead.id,lead.revision,digest,lead.updatedAt,JSON.stringify(lead));
    run('INSERT INTO az_read_heads VALUES(?,?,?,?) ON CONFLICT(lead_id) DO UPDATE SET revision=excluded.revision,updated_at=excluded.updated_at,digest=excluded.digest',lead.id,lead.revision,lead.updatedAt,digest);
    audit('record_accepted'); return 1;
  }); }
  // Explicit operator reconciliation to a verified existing UCP opportunity. No matching by contact details.
  function reconcile({customerId,leadId,opportunityId,targetOpportunityId}) { verify(scope); [customerId,leadId,opportunityId,targetOpportunityId].forEach(externalId); return transaction(()=> {
    const link=get("SELECT l.* FROM cf_ucp_opportunity_links l JOIN cf_ucp_customers c ON c.id=l.customer_id AND c.workspace_id=l.workspace_id JOIN cf_solo_opportunities o ON o.id=l.opportunity_id AND o.workspace_id=l.workspace_id WHERE l.workspace_id=? AND l.opportunity_id=? AND c.status='active'",w,targetOpportunityId);
    if (!link) reject('reconciliation_required');
    const other=get("SELECT external_id FROM az_external_ids WHERE entity='opportunity' AND canonical_id=?",targetOpportunityId); if(other&&other.external_id!==opportunityId) reject('ambiguous_identity');
    register('customer',customerId,link.customer_id,link.household_id); register('opportunity',opportunityId,targetOpportunityId,JSON.stringify([leadId,customerId])); audit('explicit_identity_reconciliation');
  }); }
  function complete(expected,value,stream=AZ_KIND) { verify(scope); transaction(()=> {
    if (checkpoint(stream)!==expected) reject('checkpoint_conflict');
    run("INSERT INTO cf_solo_sync VALUES(?,?,?) ON CONFLICT(workspace_id,stream) DO UPDATE SET cursor_json=excluded.cursor_json",w,stream,JSON.stringify(value)); audit('scan_complete');ledger.recordScan(stream);
  }); }
  function resourceKey(r){return JSON.stringify(['resource-v2',r.kind,r.id]);}
  function resourceIdentity(r){
    const c=mapped('customer',r.customerId),op=mapped('opportunity',r.anchorOpportunityId);
    if(!c||!op||op.parent!==JSON.stringify([r.leadId,r.customerId]))reject('reconciliation_required');
    const link=get("SELECT l.* FROM cf_ucp_opportunity_links l JOIN cf_ucp_customers c ON c.id=l.customer_id AND c.workspace_id=l.workspace_id JOIN cf_ucp_households h ON h.id=l.household_id AND h.workspace_id=l.workspace_id WHERE l.workspace_id=? AND l.opportunity_id=? AND c.status='active' AND h.status='active'",w,op.canonical_id);
    if(!link||link.customer_id!==c.canonical_id||link.household_id!==c.parent)reject('reconciliation_required');
    const m=mapped(r.kind,r.id),parent=JSON.stringify([r.leadId,r.customerId,r.anchorOpportunityId,r.opportunityId]);
    if(m&&m.parent!==parent)reject('identity_conflict');
    return {cid:c.canonical_id,oid:op.canonical_id,sourceId:id(r.kind,r.id),parent};
  }
  function acceptResource(r){verify(scope);if(r.agencyId!==scope.agencyId)reject('agency_scope');return transaction(()=>{
    const {cid,oid,sourceId,parent}=resourceIdentity(r),key=resourceKey(r),digest=hash(r),previous=get('SELECT * FROM az_read_heads WHERE lead_id=?',key),replay=get('SELECT * FROM az_read_revisions WHERE lead_id=? AND revision=?',key,r.revision);
    if(replay&&hash(JSON.parse(replay.evidence_json))!==replay.digest)reject('evidence_integrity');
    if(replay&&replay.digest!==digest)reject('revision_conflict');
    const local=mapped('task_local',r.id);
    if(r.kind==='task'&&local&&!get('SELECT 1 FROM cf_solo_tasks WHERE workspace_id=? AND id=? AND opportunity_id=?',w,local.canonical_id,oid))reject('reconciliation_required');
    const existingSource=get('SELECT summary_json FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND source_id=?',w,AZ_RESOURCE_KIND,sourceId);
    if(previous){const snapshot=existingSource?JSON.parse(existingSource.summary_json):null;if(!snapshot||hash(snapshot.resource)!==previous.digest||hash(snapshot.observations)!==snapshot.observationsDigest||hash(snapshot.termObservations||[])!==snapshot.termsDigest)reject('evidence_integrity');}
    if(replay)return 0;
    if(previous&&(Date.parse(r.updatedAt)<Date.parse(previous.updated_at)||(Date.parse(r.updatedAt)===Date.parse(previous.updated_at)&&digest!==previous.digest)))reject('stale_revision');
    const oldSource=get('SELECT summary_json FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND source_id=?',w,AZ_RESOURCE_KIND,sourceId);
    let observations=oldSource?JSON.parse(oldSource.summary_json).observations||[]:[];
    const termObservations=oldSource?JSON.parse(oldSource.summary_json).termObservations||[]:[];
    if(r.availability==='missing'&&!previous)reject('reconciliation_required');
    if(previous){const old=get('SELECT * FROM az_read_revisions WHERE lead_id=? AND revision=?',key,previous.revision);if(!old||hash(JSON.parse(old.evidence_json))!==previous.digest)reject('evidence_integrity');if(JSON.parse(old.evidence_json).createdAt!==r.createdAt)reject('revision_conflict');}
    if(r.kind==='policy'){
      termObservations.push({termId:r.termId,effectiveDate:r.effectiveDate,expirationDate:r.expirationDate,revision:r.revision,digest});
      if(r.replacesPolicyId){const replacement=mapped('policy',r.replacesPolicyId);if(!replacement||replacement.parent===parent&&r.replacesPolicyId===r.id)reject('reconciliation_required');const other=get('SELECT summary_json FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND source_id=?',w,AZ_RESOURCE_KIND,replacement.canonical_id);if(!other||JSON.parse(other.summary_json).canonicalCustomerId!==cid)reject('identity_conflict');}
      const dates=[{id:'term-expiration',field:'expiration',value:r.expirationDate,sourceId:r.id,sourceRevision:r.revision,observedAt:r.updatedAt},...(r.renewalEffectiveDate?[{id:'term-renewal',field:'renewal_effective',value:r.renewalEffectiveDate,sourceId:r.id,sourceRevision:r.revision,observedAt:r.updatedAt}]:[]),...r.dates];
      for(const d of dates){const observation={...d,termId:r.termId,resourceRevision:r.revision,resourceDigest:digest,verification:'unverified',freshness:'unknown'};const same=observations.find(x=>x.id===d.id&&x.sourceId===d.sourceId&&x.sourceRevision===d.sourceRevision&&x.termId===r.termId);if(same&&JSON.stringify({...same,resourceRevision:r.revision,resourceDigest:digest})!==JSON.stringify(observation))reject('revision_conflict');if(!same)observations.push(observation);}
    }
    const at=now(),summary={provider:'AgencyZoom',mode:'offline_synthetic',status:'synchronized',resource:r,revision:r.revision,digest,canonicalCustomerId:cid,canonicalOpportunityId:r.opportunityId?oid:null,storageAnchorOpportunityId:oid,scope:r.opportunityId?'opportunity':'customer',observations,observationsDigest:hash(observations),termObservations,termsDigest:hash(termObservations),synchronizedAt:at,linkedLocalTaskId:r.kind==='task'?local?.canonical_id||null:null,review:'unreviewed_external_evidence',contactAuthorityGranted:false,inventoryComplete:false};
    if(new TextEncoder().encode(JSON.stringify(summary)).length>7800)reject('record_bound');
    register(r.kind,r.id,sourceId,parent);
    run('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id,kind,source_id) DO UPDATE SET summary_json=excluded.summary_json,updated_at=excluded.updated_at',w,AZ_RESOURCE_KIND,sourceId,oid,JSON.stringify(summary),at);
    run('INSERT INTO az_read_revisions VALUES(?,?,?,?,?)',key,r.revision,digest,r.updatedAt,JSON.stringify(r));
    run('INSERT INTO az_read_heads VALUES(?,?,?,?) ON CONFLICT(lead_id) DO UPDATE SET revision=excluded.revision,updated_at=excluded.updated_at,digest=excluded.digest',key,r.revision,r.updatedAt,digest);
    run('UPDATE cf_solo_opportunities SET edit_version=edit_version+1,updated_at=? WHERE workspace_id=? AND id=?',at,w,oid);audit('resource_accepted');return 1;
  });}
  function reconcileExternalTask({externalTaskId,localTaskId}){verify(scope);externalId(externalTaskId);externalId(localTaskId);return transaction(()=>{
    const m=mapped('task',externalTaskId);if(!m)reject('reconciliation_required');
    const source=get('SELECT * FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND source_id=?',w,AZ_RESOURCE_KIND,m.canonical_id);if(!source)reject('reconciliation_required');
    const value=JSON.parse(source.summary_json);resourceIdentity(value.resource);
    if(!get('SELECT 1 FROM cf_solo_tasks WHERE workspace_id=? AND id=? AND opportunity_id=?',w,localTaskId,source.opportunity_id))reject('identity_conflict');
    const other=get("SELECT external_id FROM az_external_ids WHERE entity='task_local' AND canonical_id=?",localTaskId);if(other&&other.external_id!==externalTaskId)reject('ambiguous_identity');
    register('task_local',externalTaskId,localTaskId,source.opportunity_id);value.linkedLocalTaskId=localTaskId;
    run('UPDATE cf_solo_sources SET summary_json=? WHERE workspace_id=? AND kind=? AND source_id=?',JSON.stringify(value),w,AZ_RESOURCE_KIND,m.canonical_id);audit('explicit_task_reconciliation');
  });}
  // Compatibility wrapper for existing CoverageFit Work/UCP/Prospect 360 reads.
  const repositoryDb={prepare(q){let values=[]; return {bind(...v){values=v;return this;},async first(){return get(q,...values)||null;},async all(){return {results:db.prepare(q).all(...values)};},async run(){return {meta:run(q,...values)};}};},async batch(statements){db.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}};
  const ledger=reviewLedger({get,run,verify,scope,mapped,hash,now});
  const sms=smsOfflineStore({get,run,all:(q,...v)=>db.prepare(q).all(...v),transaction,verify,scope,resourceIdentity,register,id,hash,audit,now});
  return {...sms,recordSyncFailure:ledger.recordSyncFailure,verify,checkpoint,accept,acceptResource,reconcile,reconcileExternalTask,complete,audit,repositoryDb,close:()=>db.close()};
}
