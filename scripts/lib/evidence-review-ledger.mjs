export const REVIEW_SCHEMA=`
 CREATE TABLE az_evidence_review_meta(singleton INTEGER PRIMARY KEY CHECK(singleton=1),schema_version TEXT NOT NULL);
 INSERT INTO az_evidence_review_meta VALUES(1,'v4');
 CREATE TABLE az_connector_failures(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,stream TEXT NOT NULL,entity_id TEXT NOT NULL,source_revision TEXT NOT NULL,customer_id TEXT,anchor_id TEXT,code TEXT NOT NULL,source_updated_at TEXT NOT NULL,audit_sequence INTEGER NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE az_connector_scans(stream TEXT PRIMARY KEY,success_sequence INTEGER NOT NULL,completed_at TEXT NOT NULL);
 CREATE TABLE az_evidence_packages(request_id TEXT PRIMARY KEY,package_id TEXT NOT NULL,expected_state TEXT NOT NULL,actor TEXT NOT NULL,recorded_at TEXT NOT NULL,receipt_json TEXT NOT NULL);`;
export function reviewLedger({get,run,verify,scope,mapped,hash,now}){
 const present=()=>!!get("SELECT name FROM sqlite_master WHERE type='table' AND name='az_connector_failures'");
 function recordSyncFailure({stream,record,error,code}){
  verify(scope);if(!present()||!record)return;
  if(!['archive_bound','record_bound','incomplete_history','page_bound','evidence_integrity','identity_conflict','reconciliation_required'].includes(code))return;
  const entity=error.entityId||record.id,revision=error.sourceRevision||record.revision;
  if(!entity||!revision)return;
  const customer=mapped('customer',record.customerId),anchor=mapped('opportunity',record.anchorOpportunityId||record.opportunities?.[0]?.id);
  const matching=customer&&anchor&&get('SELECT 1 FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id=? AND customer_id=?',scope.workspace,anchor.canonical_id,customer.canonical_id);
  const fallback=customer?get('SELECT opportunity_id FROM cf_ucp_opportunity_links WHERE workspace_id=? AND customer_id=? ORDER BY opportunity_id LIMIT 1',scope.workspace,customer.canonical_id):null;
  const key='failure_'+hash([scope.workspace,scope.agencyId,stream,entity,revision,code]).slice(0,40),seq=get('SELECT COALESCE(max(sequence),0) n FROM az_read_audit').n;
  run('INSERT OR IGNORE INTO az_connector_failures VALUES(?,?,?,?,?,?,?,?,?,?,?)',key,scope.workspace,stream,entity,revision,customer?.canonical_id||null,matching?anchor.canonical_id:fallback?.opportunity_id||null,code,record.updatedAt,seq,now());
 }
 function recordScan(stream){if(!present())return;const seq=get('SELECT COALESCE(max(sequence),0) n FROM az_read_audit').n;run('INSERT INTO az_connector_scans VALUES(?,?,?) ON CONFLICT(stream) DO UPDATE SET success_sequence=excluded.success_sequence,completed_at=excluded.completed_at',stream,seq,now());}
 return {recordSyncFailure,recordScan};
}
