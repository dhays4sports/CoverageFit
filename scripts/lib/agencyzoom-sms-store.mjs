// Offline evidence archive only; never an operational sender or conversation store.
import {AZ_SMS_KIND,SMS_LIMITS,smsHeader} from '../../server/agencyzoom-sms-contract.mjs';
import {reject} from '../../server/agencyzoom-contract-utils.mjs';
import {compliance} from '../../server/sms-signal-core.mjs';
export const SMS_ARCHIVE_SCHEMA=`
 CREATE TABLE az_sms_archive_meta(singleton INTEGER PRIMARY KEY CHECK(singleton=1),schema_version TEXT NOT NULL);
 INSERT INTO az_sms_archive_meta VALUES(1,'v3');
 CREATE TABLE az_sms_threads(thread_id TEXT PRIMARY KEY,customer_id TEXT NOT NULL,anchor_id TEXT NOT NULL,opportunity_id TEXT,revision TEXT NOT NULL,updated_at TEXT NOT NULL,header_json TEXT NOT NULL,digest TEXT NOT NULL);
 CREATE TABLE az_sms_pages(thread_id TEXT NOT NULL,revision TEXT NOT NULL,page_index INTEGER NOT NULL,page_count INTEGER NOT NULL,digest TEXT NOT NULL,header_json TEXT NOT NULL,manifest_json TEXT NOT NULL,PRIMARY KEY(thread_id,revision,page_index));
 CREATE TABLE az_sms_messages(message_id TEXT NOT NULL,revision TEXT NOT NULL,thread_id TEXT NOT NULL,digest TEXT NOT NULL,payload_json TEXT NOT NULL,PRIMARY KEY(message_id,revision));
 CREATE TABLE az_sms_heads(message_id TEXT PRIMARY KEY,thread_id TEXT NOT NULL,revision TEXT NOT NULL,digest TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE az_sms_observations(thread_id TEXT NOT NULL,kind TEXT NOT NULL,entity_id TEXT NOT NULL,revision TEXT NOT NULL,digest TEXT NOT NULL,PRIMARY KEY(thread_id,kind,entity_id,revision));
 CREATE INDEX az_sms_customer ON az_sms_threads(customer_id,thread_id);
 CREATE INDEX az_sms_thread_messages ON az_sms_heads(thread_id,message_id);`;
export function smsOfflineStore({get,run,all,transaction,verify,scope,resourceIdentity,register,id,hash,audit,now}){
 const w=scope.workspace;
 function archiveAvailable(){try{if(get('SELECT schema_version FROM az_sms_archive_meta WHERE singleton=1')?.schema_version!=='v3')reject('sms_setup_required');get('SELECT thread_id FROM az_sms_threads LIMIT 1');}catch{reject('sms_setup_required');}}
 function original(messageId,revision){const row=get('SELECT * FROM az_sms_messages WHERE message_id=? AND revision=?',messageId,revision);if(!row||hash(JSON.parse(row.payload_json))!==row.digest)reject('evidence_integrity');return row;}
 function verifyPage(row){const header=JSON.parse(row.header_json),refs=JSON.parse(row.manifest_json),messages=refs.map(ref=>{const stored=original(ref.id,ref.revision);if(stored.thread_id!==row.thread_id||stored.digest!==ref.digest)reject('evidence_integrity');return JSON.parse(stored.payload_json);});if(hash({...header,messages})!==row.digest)reject('evidence_integrity');}
 function acceptSmsPage(r){verify(scope);archiveAvailable();if(r.agencyId!==scope.agencyId)reject('agency_scope');return transaction(()=>{
  const binding=resourceIdentity({...r,kind:'sms_thread'}),{cid,oid,sourceId,parent}=binding;
  const old=get('SELECT * FROM az_sms_threads WHERE thread_id=?',r.id),header=smsHeader(r),headerDigest=hash(header),pageDigest=hash(r);
  if(old&&hash(JSON.parse(old.header_json))!==old.digest)reject('evidence_integrity');
  if(old){const source=get('SELECT summary_json FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND source_id=?',w,AZ_SMS_KIND,sourceId),summary=source?JSON.parse(source.summary_json):null,heads=all('SELECT message_id,revision,digest FROM az_sms_heads WHERE thread_id=? ORDER BY message_id',r.id);if(!summary||summary.indexDigest!==hash(heads)||summary.threadDigest!==old.digest||summary.threadRevision!==old.revision)reject('evidence_integrity');for(const head of heads)if(original(head.message_id,head.revision).digest!==head.digest)reject('evidence_integrity');for(const observation of all('SELECT * FROM az_sms_observations WHERE thread_id=?',r.id)){if(['reported_opt_out','thread_ownership_review'].includes(observation.kind)){const page=get('SELECT header_json FROM az_sms_pages WHERE thread_id=? AND revision=? LIMIT 1',r.id,observation.revision);if(!page||hash(smsHeader(JSON.parse(page.header_json)))!==observation.digest)reject('evidence_integrity');}else if(original(observation.entity_id,observation.revision).digest!==observation.digest)reject('evidence_integrity');}}
  const prior=get('SELECT * FROM az_sms_pages WHERE thread_id=? AND revision=? AND page_index=?',r.id,r.revision,r.pageIndex);
  if(prior){verifyPage(prior);if(prior.digest!==pageDigest)reject('revision_conflict');return 0;}
  const sameRevision=get('SELECT header_json FROM az_sms_pages WHERE thread_id=? AND revision=? LIMIT 1',r.id,r.revision);
  if(sameRevision&&hash(smsHeader(JSON.parse(sameRevision.header_json)))!==headerDigest)reject('revision_conflict');
  if(old){const oldHeader=JSON.parse(old.header_json);if(oldHeader.createdAt!==r.createdAt)reject('identity_conflict');if(Date.parse(r.updatedAt)<Date.parse(old.updated_at)||(Date.parse(r.updatedAt)===Date.parse(old.updated_at)&&r.revision!==old.revision))reject('stale_revision');}
  register('sms_thread',r.id,sourceId,parent);
  const observe=(kind,entity,revision,digest)=>run('INSERT OR IGNORE INTO az_sms_observations VALUES(?,?,?,?,?)',r.id,kind,entity,revision,digest);
  if(r.sourceSuppression==='historical_opt_out')observe('reported_opt_out',r.id,r.revision,headerDigest);
  if(r.relationship==='unresolved'||r.otherProviderReference)observe('thread_ownership_review',r.id,r.revision,headerDigest);
  const manifest=[];
  for(const m of r.messages){
   register('sms_message',m.id,id('sms_message',m.id),r.id);
   const digest=hash(m),known=get('SELECT * FROM az_sms_messages WHERE message_id=? AND revision=?',m.id,m.revision),head=get('SELECT * FROM az_sms_heads WHERE message_id=?',m.id);
   if(known){original(m.id,m.revision);if(known.digest!==digest||known.thread_id!==r.id)reject('revision_conflict');}
   else{
    if(head){const previous=JSON.parse(original(m.id,head.revision).payload_json);if(head.thread_id!==r.id||previous.direction!==m.direction||previous.authorRole!==m.authorRole||previous.authorId!==m.authorId||previous.occurredAt!==m.occurredAt)reject('identity_conflict');if(Date.parse(m.updatedAt)<=Date.parse(head.updated_at))reject('stale_revision');if(previous.change==='deleted')reject('reconciliation_required');if(previous.body!==m.body&&!['edited','deleted'].includes(m.change))reject('unmarked_edit');}
    run('INSERT INTO az_sms_messages VALUES(?,?,?,?,?)',m.id,m.revision,r.id,digest,JSON.stringify(m));
    run('INSERT INTO az_sms_heads VALUES(?,?,?,?,?) ON CONFLICT(message_id) DO UPDATE SET revision=excluded.revision,digest=excluded.digest,updated_at=excluded.updated_at',m.id,r.id,m.revision,digest,m.updatedAt);
   }
   // Old known message versions never regress the current head.
   manifest.push({id:m.id,revision:m.revision,digest});
   const safety=m.body?compliance(m.body,{}):'';
   if(m.direction!=='outbound'&&safety==='opt_out')observe(m.direction==='inbound'&&m.authorRole==='prospect'?'inbound_opt_out':'ambiguous_opt_out',m.id,m.revision,digest);
   if(m.direction==='unknown'||(m.direction==='inbound'&&m.authorRole==='unknown'))observe('message_ownership_review',m.id,m.revision,digest);
   if(m.direction==='inbound'&&safety==='wrong_number')observe('message_ownership_review',m.id,m.revision,digest);
  }
  const {messages,...pageHeader}=r;
  run('INSERT INTO az_sms_pages VALUES(?,?,?,?,?,?,?)',r.id,r.revision,r.pageIndex,r.pageCount,pageDigest,JSON.stringify(pageHeader),JSON.stringify(manifest));
  const bound=get('SELECT count(*) n,COALESCE(sum(length(CAST(payload_json AS BLOB))),0) bytes FROM az_sms_messages WHERE thread_id=?',r.id),heads=all('SELECT message_id,revision,digest FROM az_sms_heads WHERE thread_id=? ORDER BY message_id',r.id);
  if(heads.length>SMS_LIMITS.threadMessages||bound.n>SMS_LIMITS.versions||bound.bytes>SMS_LIMITS.archiveBytes||get('SELECT count(*) n FROM az_sms_pages WHERE thread_id=?',r.id).n>SMS_LIMITS.threadPages)reject('archive_bound');
  run('INSERT INTO az_sms_threads VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(thread_id) DO UPDATE SET revision=excluded.revision,updated_at=excluded.updated_at,header_json=excluded.header_json,digest=excluded.digest',r.id,cid,oid,r.opportunityId?oid:null,r.revision,r.updatedAt,JSON.stringify(header),headerDigest);
  const received=get('SELECT count(*) n FROM az_sms_pages WHERE thread_id=? AND revision=?',r.id,r.revision).n,holds=all('SELECT kind FROM az_sms_observations WHERE thread_id=?',r.id);
  const summary={provider:'AgencyZoom',mode:'offline_synthetic',threadId:r.id,threadRevision:r.revision,threadDigest:headerDigest,canonicalCustomerId:cid,canonicalOpportunityId:r.opportunityId?oid:null,storageAnchorOpportunityId:oid,agencyId:scope.agencyId,databaseId:scope.databaseId,scope:r.opportunityId?'opportunity':'customer',messageCount:heads.length,indexDigest:hash(heads),requestedPagesComplete:received===r.pageCount,historyCompleteReported:r.historyCompleteReported,historyVerified:false,suppressionObserved:holds.some(h=>['reported_opt_out','inbound_opt_out'].includes(h.kind)),reviewHold:holds.some(h=>!['reported_opt_out','inbound_opt_out'].includes(h.kind)),sourceUpdatedAt:r.updatedAt,synchronizedAt:now(),importedBy:'agencyzoom-offline-importer',contactAuthorityGranted:false};
  run('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id,kind,source_id) DO UPDATE SET summary_json=excluded.summary_json,updated_at=excluded.updated_at',w,AZ_SMS_KIND,sourceId,oid,JSON.stringify(summary),summary.synchronizedAt);
  run('UPDATE cf_solo_opportunities SET edit_version=edit_version+1,updated_at=? WHERE workspace_id=? AND id=?',now(),w,oid);audit('sms_page_accepted');return 1;
 });}
 function verifySmsPages(touched){verify(scope);archiveAvailable();for(const [thread,revision] of touched){const pages=all('SELECT page_index,page_count FROM az_sms_pages WHERE thread_id=? AND revision=? ORDER BY page_index',thread,revision);if(!pages.length||pages.length!==pages[0].page_count||pages.some((p,i)=>p.page_index!==i)){try{reject('incomplete_history');}catch(e){throw Object.assign(e,{entityId:thread,sourceRevision:revision});}}}}
 return {acceptSmsPage,verifySmsPages};
}
