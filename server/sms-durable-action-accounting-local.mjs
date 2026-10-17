// LOCAL SYNTHETIC prototype. No provider/network execution; never import into routes.
import {createHash,randomUUID} from 'node:crypto';
import {validateOutboundDescriptor} from './sms-outbound-gateway.mjs';
export const SMS_ACCOUNTING_BUILD='CF-SMS-DURABLE-ACTION-0.4';
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const json=x=>JSON.stringify(canonical(x));
const hash=x=>createHash('sha256').update(json(x)).digest('hex');
const id=x=>{if(typeof x!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(x))throw Error('invalid_identifier');return x};
const time=x=>{const n=typeof x==='number'?x:Date.parse(x);if(!Number.isSafeInteger(n))throw Error('invalid_clock');return n};
const bound=(n,a,b)=>{if(!Number.isSafeInteger(n)||n<a||n>b)throw Error('invalid_bound');return n};
const execution=Object.freeze({sms:false,call:false,external:false,reason:'LOCAL_SYNTHETIC_ONLY'});
export function smsDurableAccountingLocal(db,{syntheticOnly=false,maxAttempts=3}={}){
 if(!syntheticOnly)throw Error('synthetic_only_required');bound(maxAttempts,1,10);
 if(!db.prepare('PRAGMA database_list').all().find(x=>x.name==='main')?.file)throw Error('file_backed_database_required');
 db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=10000;');
 if(!db.prepare("SELECT 1 FROM sqlite_master WHERE name='cf_test_sms_actions'").get())throw Error('local_schema_required');
 const get=(q,...p)=>db.prepare(q).get(...p),all=(q,...p)=>db.prepare(q).all(...p),run=(q,...p)=>db.prepare(q).run(...p);
 const tx=fn=>{if(db.isTransaction)throw Error('own_transaction_required');db.exec('BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}};
 const audit=(op,now,ref,a=null,t=null,data={})=>run('INSERT INTO cf_test_sms_audit(workspace,action_id,attempt_id,operation,reference,json,at) VALUES(?,?,?,?,?,?,?)',a?.workspace||null,a?.action_id||null,t?.attempt_id||null,op,id(ref),json(data),now);
 function action(w,a){id(w);id(a);const row=get('SELECT * FROM cf_test_sms_actions WHERE workspace=? AND action_id=?',w,a);if(!row)throw Error('unknown_scoped_action');return row}
 const authority=(w,r)=>get('SELECT * FROM cf_test_sms_authority WHERE workspace=? AND relationship=?',w,r);
 const policy=s=>{const p=get('SELECT * FROM cf_test_sms_sender WHERE sender=?',s);return p?{...JSON.parse(p.json),revision:p.revision}:null};
 const active=a=>get('SELECT * FROM cf_test_sms_attempts WHERE action_id=? AND active=1',a.action_id);
 const immutable=a=>JSON.parse(a.immutable_json);
 const unresolvedSibling=a=>get("SELECT 1 FROM cf_test_sms_attempts t JOIN cf_test_sms_actions other ON other.action_id=t.action_id WHERE other.workspace=? AND other.relationship=? AND other.action_id<>? AND t.state IN ('SUBMISSION_IN_PROGRESS','OUTCOME_UNKNOWN') AND t.started_at IS NOT NULL LIMIT 1",a.workspace,a.relationship,a.action_id);
 function restriction(input,auth,now){
  if(!auth)return 'MISSING_AUTHORITY';const x=JSON.parse(auth.json),o=x.owners?.[input.family];
  if(x.synthetic!==true||x.identityVerified!==true||x.recipient!==input.descriptor.to)return 'IDENTITY_HOLD';
  if(x.suppressed!==false||x.wrongNumber!==false||x.providerOptOut!==false)return 'SUPPRESSED';
  if(x.control!==false||x.takeover!==false)return 'CONTROL_OR_TAKEOVER';
  if(x.sourceType!=='first_party'||x.sourceRights!==true||!x.sourceRef)return 'SOURCE_RIGHTS';
  if(x.smsPermission!==true||!x.permissionRef||x.purpose!==input.intent||x.preference!=='SMS')return 'PERMISSION';
  if(!o||o.owner!=='COVERAGEFIT_APPROVED'||o.exclusive!==true||o.epoch!==input.ownerEpoch)return 'OWNER_EPOCH';
  if(!x.campaigns?.some(c=>c.sender===input.sender&&c.campaign===input.campaign&&c.authorized===true&&c.reference))return 'SENDER_CAMPAIGN';
  if(x.profileVersion!==input.profileVersion||x.contextVersion!==input.contextVersion||x.decisionRef!==input.decisionRef||x.generation!==input.generation)return 'STALE_DECISION';
  if(!Array.isArray(x.evidenceRefs)||!x.evidenceRefs.length||!x.actor||!x.reference)return 'MISSING_PROVENANCE';
  if(!Number.isFinite(Date.parse(x.validUntil))||time(x.validUntil)<=now)return 'AUTHORITY_EXPIRED';
  if(!Number.isFinite(Date.parse(x.windowStart))||!Number.isFinite(Date.parse(x.windowEnd))||now<time(x.windowStart)||now>=time(x.windowEnd))return 'COMMUNICATION_WINDOW';
  return null;
 }
 function fresh(a,now){const auth=authority(a.workspace,a.relationship);return auth?.revision!==a.authority_revision?'AUTHORITY_REVISION_CHANGED':restriction(immutable(a),auth,now)}
 function hold(a,reason,now){run("UPDATE cf_test_sms_actions SET state='HELD',reason=?,revision=revision+1,updated_at=? WHERE action_id=?",reason,now,a.action_id);audit('HELD',now,'local-safety',a,null,{reason});return {code:'HELD',reason}}
 function setAuthority(w,r,input,{now,expectedRevision=0}={}){
  id(w);id(r);now=time(now);id(input.actor);id(input.reference);if(input.synthetic!==true)throw Error('synthetic_authority_required');
  return tx(()=>{const old=authority(w,r);if((old?.revision||0)!==expectedRevision)throw Error('authority_revision_conflict');
   const revision=expectedRevision+1;run('INSERT INTO cf_test_sms_authority VALUES(?,?,?,?) ON CONFLICT(workspace,relationship) DO UPDATE SET revision=excluded.revision,json=excluded.json',w,r,revision,json(input));
   // Bounded by the relationship, not the population. Every unsent action still checks exact revision.
   run("UPDATE cf_test_sms_actions SET state='HELD',reason='AUTHORITY_CHANGED',revision=revision+1,updated_at=? WHERE workspace=? AND relationship=? AND state NOT IN ('COMPLETED','CANCELED','EXPIRED')",now,w,r);
   audit('AUTHORITY',now,input.reference,{workspace:w},null,{relationship:r,revision,authority:input});return revision;
  });
 }
 function setSender(sender,input,{now,expectedRevision=0,reference}={}){
  id(sender);now=time(now);bound(input.rate,0,40);bound(input.reserve,0,40);bound(input.recipientGapMs,0,30*86400000);if(typeof input.externalKnown!=='boolean')throw Error('explicit_external_capacity_required');
  return tx(()=>{const old=policy(sender);if((old?.revision||0)!==expectedRevision)throw Error('sender_revision_conflict');const revision=expectedRevision+1;run('INSERT INTO cf_test_sms_sender VALUES(?,?,?) ON CONFLICT(sender) DO UPDATE SET revision=excluded.revision,json=excluded.json',sender,revision,json(input));audit('SENDER_POLICY',now,reference,null,null,{sender,revision,...input});return revision});
 }
 function normalize(raw){
  if(raw.synthetic!==true)throw Error('synthetic_action_required');
  const a=Object.fromEntries(['workspace','relationship','family','intent','businessEvent','decisionRef','profileVersion','contextVersion','sender','campaign'].map(k=>[k,id(raw[k])]));
  a.generation=bound(raw.generation,1,1e9);a.ownerEpoch=bound(raw.ownerEpoch,1,1e9);a.channel='SMS';a.notBefore=time(raw.notBefore);a.expiresAt=time(raw.expiresAt);if(a.expiresAt<=a.notBefore)throw Error('invalid_window');
  a.descriptor=validateOutboundDescriptor(raw.descriptor);if(!/^\+1[2-9]\d{2}55501\d{2}$/.test(a.descriptor.to))throw Error('fictional_recipient_required');
  // Caller gateway keys are deliberately not part of business identity or accepted as authority.
  const businessKey=hash([a.workspace,a.relationship,a.intent,a.businessEvent,a.decisionRef,a.generation,a.channel]);
  return {a,businessKey,actionId:'act_'+hash([businessKey,a.family,a.campaign]),payloadDigest:hash(a)};
 }
 function admit(raw,{now,interrupt=false}={}){
  now=time(now);const n=normalize(raw);if(raw.action_id&&raw.action_id!==n.actionId)throw Error('action_identity_conflict');
  return tx(()=>{
   const old=get('SELECT * FROM cf_test_sms_actions WHERE business_key=?',n.businessKey);
   if(old){if(old.payload_digest!==n.payloadDigest)throw Error('immutable_action_conflict');return {code:'DUPLICATE',action_id:old.action_id,state:old.state}}
   const auth=authority(n.a.workspace,n.a.relationship),reason=restriction(n.a,auth,now);if(reason)throw Error(reason);if(now>=n.a.expiresAt)throw Error('action_expired');
   run('INSERT INTO cf_test_sms_actions(action_id,business_key,workspace,relationship,family,sender,campaign,payload_digest,immutable_json,authority_revision,state,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',n.actionId,n.businessKey,n.a.workspace,n.a.relationship,n.a.family,n.a.sender,n.a.campaign,n.payloadDigest,json(n.a),auth.revision,'ADMITTED',now,now);
   const a=action(n.a.workspace,n.actionId);audit('ADMITTED',now,JSON.parse(auth.json).reference,a,null,{payload_digest:n.payloadDigest});if(interrupt)throw Error('admission_interrupted');return {code:'ADMITTED',action_id:n.actionId};
  });
 }
 function claim(w,aId,{now,worker,leaseMs=30000}={}){
  now=time(now);id(worker);bound(leaseMs,1,300000);
  return tx(()=>{const a=action(w,aId),i=immutable(a);if(!['ADMITTED','WAITING'].includes(a.state))return {code:'NOT_CLAIMABLE',state:a.state};
   if(now>=i.expiresAt){run("UPDATE cf_test_sms_actions SET state='EXPIRED',updated_at=? WHERE action_id=?",now,aId);audit('EXPIRED',now,'local-clock',a);return {code:'EXPIRED'}}
   if(now<i.notBefore)return {code:'NOT_DUE'};const reason=fresh(a,now);if(reason)return hold(a,reason,now);
   // An unresolved attempt blocks any new key/family/campaign on this verified relationship.
   if(get("SELECT 1 FROM cf_test_sms_attempts t JOIN cf_test_sms_actions a ON a.action_id=t.action_id WHERE a.workspace=? AND a.relationship=? AND t.state IN ('SUBMISSION_IN_PROGRESS','OUTCOME_UNKNOWN') AND t.started_at IS NOT NULL LIMIT 1",w,a.relationship))return hold(a,'RELATIONSHIP_OUTCOME_UNKNOWN',now);
   const token=randomUUID();run("UPDATE cf_test_sms_actions SET state='CLAIMED',worker=?,token=?,lease_until=?,revision=revision+1,updated_at=? WHERE action_id=?",worker,token,now+leaseMs,now,aId);audit('CLAIMED',now,worker,a,null,{token});return {code:'CLAIMED',workspace:w,action_id:aId,token,worker,lease_until:now+leaseMs};
  });
 }
 function owned(c,now){const a=action(c.workspace,c.action_id);if(a.state!=='CLAIMED'||a.token!==c.token||a.worker!==c.worker||a.lease_until<=now||now<a.updated_at)throw Error('claim_fenced');return a}
 function capacity(a,now,exclude=''){
  const p=policy(a.sender);if(!p||!p.externalKnown)return 'UNKNOWN_EXTERNAL_CAPACITY';
  const senderCount=get('SELECT count(*) n FROM cf_test_sms_reservations WHERE sender=? AND attempt_id<>? AND released=0 AND reserved_at>? AND (started_at IS NOT NULL OR expires_at>?)',a.sender,exclude,now-60000,now).n;
  if(senderCount>=Math.max(0,p.rate-p.reserve))return 'SENDER_CAPACITY';
  if(get('SELECT 1 FROM cf_test_sms_reservations WHERE workspace=? AND relationship=? AND attempt_id<>? AND released=0 AND reserved_at>? AND (started_at IS NOT NULL OR expires_at>?) LIMIT 1',a.workspace,a.relationship,exclude,now-p.recipientGapMs,now))return 'RECIPIENT_SPACING';return null;
 }
 function reserve(c,{now}={}){
  now=time(now);return tx(()=>{const a=owned(c,now),reason=fresh(a,now);if(reason)return hold(a,reason,now);const prior=active(a);if(prior){if(prior.token!==c.token)throw Error('attempt_fenced');return {code:'RESERVED',attempt_id:prior.attempt_id,gateway_key:prior.gateway_key}}
   if(unresolvedSibling(a))return hold(a,'RELATIONSHIP_OUTCOME_UNKNOWN',now);
   const capacityReason=capacity(a,now);if(capacityReason)return {code:'WAITING',reason:capacityReason};
   const n=get('SELECT count(*) n FROM cf_test_sms_attempts WHERE action_id=?',a.action_id).n+1;if(n>maxAttempts)return hold(a,'ATTEMPTS_EXHAUSTED',now);
   const attemptId=a.action_id+':'+n,key='local04:'+hash(attemptId);
   run("INSERT INTO cf_test_sms_attempts(attempt_id,action_id,ordinal,gateway_key,token,state,active,created_at) VALUES(?,?,?,?,?,'NOT_SUBMITTED',1,?)",attemptId,a.action_id,n,key,c.token,now);
   run('INSERT INTO cf_test_sms_reservations(attempt_id,sender,workspace,relationship,reserved_at,expires_at) VALUES(?,?,?,?,?,?)',attemptId,a.sender,a.workspace,a.relationship,now,a.lease_until);audit('RESERVED',now,c.worker,a,{attempt_id:attemptId},{gateway_key:key});return {code:'RESERVED',attempt_id:attemptId,gateway_key:key};
  });
 }
 function beginSubmission(c,attemptId,{now}={}){
  now=time(now);return tx(()=>{const a=owned(c,now),t=get('SELECT * FROM cf_test_sms_attempts WHERE attempt_id=? AND action_id=?',attemptId,a.action_id);if(!t||t.token!==c.token||t.state!=='NOT_SUBMITTED'||!t.active)throw Error('attempt_fenced');
   const reason=fresh(a,now);if(reason)return hold(a,reason,now);if(now>=immutable(a).expiresAt)return hold(a,'EXPIRED',now);
   if(unresolvedSibling(a))return hold(a,'RELATIONSHIP_OUTCOME_UNKNOWN',now);
   const cap=capacity(a,now,attemptId);if(cap)return {code:'WAITING',reason:cap};
   run("UPDATE cf_test_sms_attempts SET state='SUBMISSION_IN_PROGRESS',started_at=?,revision=revision+1 WHERE attempt_id=?",now,attemptId);
   run('UPDATE cf_test_sms_reservations SET started_at=?,reserved_at=? WHERE attempt_id=?',now,now,attemptId);audit('SUBMISSION_MARKER',now,c.worker,a,t,{token:c.token});
   return {code:'SUBMISSION_MARKED',build:SMS_ACCOUNTING_BUILD,syntheticOnly:true,workspace:a.workspace,action_id:a.action_id,attempt_id:attemptId,gateway_key:t.gateway_key,sender:a.sender,campaign:a.campaign,payload_digest:a.payload_digest,descriptor:immutable(a).descriptor,token:c.token,submissionAt:now,validUntil:Math.min(a.lease_until,immutable(a).expiresAt),execution_eligibility:execution};
  });
 }
 function recover(w,{now,limit=100,reference='local-recovery'}={}){
  id(w);now=time(now);bound(limit,1,500);return tx(()=>{
   const rows=all("SELECT * FROM cf_test_sms_actions WHERE workspace=? AND state IN ('CLAIMED','HELD') AND token IS NOT NULL AND lease_until<=? ORDER BY lease_until,action_id LIMIT ?",w,now,limit);
   const outcomes=[];for(const a of rows){const t=active(a);if(t?.started_at!==null&&t){run("UPDATE cf_test_sms_attempts SET state='OUTCOME_UNKNOWN',revision=revision+1 WHERE attempt_id=?",t.attempt_id);hold(a,'OUTCOME_UNKNOWN',now)}
    else{if(t){run('UPDATE cf_test_sms_attempts SET active=0,revision=revision+1 WHERE attempt_id=?',t.attempt_id);run('UPDATE cf_test_sms_reservations SET released=1 WHERE attempt_id=?',t.attempt_id)}const reason=fresh(a,now);run('UPDATE cf_test_sms_actions SET state=?,reason=?,revision=revision+1,updated_at=? WHERE action_id=?',reason?'HELD':'WAITING',reason,now,a.action_id)}
    run('UPDATE cf_test_sms_actions SET token=NULL,worker=NULL,lease_until=NULL WHERE action_id=?',a.action_id);audit('RECOVERED',now,reference,a,t,{potentially_submitted:!!t?.started_at});outcomes.push({action_id:a.action_id,unknown:!!t?.started_at});
   }return {recovered:outcomes.length,outcomes};
  });
 }
 function cancel(w,aId,{now,reference,expired=false}={}){
  now=time(now);return tx(()=>{const a=action(w,aId),t=active(a);if(t?.started_at)return hold(a,'IN_FLIGHT_CANNOT_RECALL',now);if(a.state==='COMPLETED')return {code:'ALREADY_ACKNOWLEDGED'};
   if(t){run('UPDATE cf_test_sms_attempts SET active=0,revision=revision+1 WHERE attempt_id=?',t.attempt_id);run('UPDATE cf_test_sms_reservations SET released=1 WHERE attempt_id=?',t.attempt_id)}
   run('UPDATE cf_test_sms_actions SET state=?,reason=?,token=NULL,worker=NULL,lease_until=NULL,revision=revision+1,updated_at=? WHERE action_id=?',expired?'EXPIRED':'CANCELED',reference,now,aId);audit(expired?'EXPIRED':'CANCELED',now,reference,a,t);return {code:expired?'EXPIRED':'CANCELED'};
  });
 }
 function reconcile(w,aId,attemptId,e,{now,expectedRevision}={}){
  now=time(now);id(e.evidence_id);id(e.actor);id(e.reference);return tx(()=>{
   const a=action(w,aId),t=get('SELECT * FROM cf_test_sms_attempts WHERE action_id=? AND attempt_id=?',aId,attemptId);if(!t||t.started_at===null)throw Error('submission_marker_required');if(now<t.started_at)throw Error('clock_reversed');
   const digest=hash(e),old=get('SELECT * FROM cf_test_sms_evidence WHERE workspace=? AND evidence_id=?',w,e.evidence_id);
   if(old){if(old.digest!==digest||old.attempt_id!==attemptId)throw Error('evidence_identity_conflict');return {code:'DUPLICATE'}}
   if(t.revision!==expectedRevision)throw Error('reconciliation_fenced');
   run('INSERT INTO cf_test_sms_evidence VALUES(?,?,?,?,?,?)',w,e.evidence_id,attemptId,digest,json(e),now);audit('RECONCILIATION_EVIDENCE',now,e.reference,a,t,{evidence_id:e.evidence_id});
   const fail=reason=>{run("UPDATE cf_test_sms_attempts SET state='OUTCOME_UNKNOWN',active=CASE WHEN EXISTS(SELECT 1 FROM cf_test_sms_attempts other WHERE other.action_id=cf_test_sms_attempts.action_id AND other.active=1 AND other.attempt_id<>cf_test_sms_attempts.attempt_id) THEN 0 ELSE 1 END,revision=revision+1 WHERE attempt_id=?",attemptId);return hold(a,reason,now)};
   if(e.authoritative!==true||e.workspace!==w||e.action_id!==aId||e.attempt_id!==attemptId||e.gateway_key!==t.gateway_key||e.sender!==a.sender||e.campaign!==a.campaign||e.payload_digest!==a.payload_digest||e.fingerprintOnly===true)return fail('UNPROVEN_PROVIDER_IDENTITY');
   if(!['ACCEPTED','REJECTED','DELIVERED','DELIVERY_FAILED'].includes(e.outcome))return fail('NO_AUTHORITATIVE_OUTCOME');
   if(a.reason?.startsWith('CONFLICTING_')&&e.resolvesConflict!==true)return fail(a.reason);
   if(e.outcome==='REJECTED'){
    if(t.state==='PROVEN_REJECTED')return {code:'ALREADY_REJECTED'};
    if(t.provider_id||t.state==='ACKNOWLEDGED'||e.nonAcceptance!==true)return fail('CONFLICTING_ACCEPTANCE');
    run("UPDATE cf_test_sms_attempts SET state='PROVEN_REJECTED',active=0,retry_eligible=?,revision=revision+1 WHERE attempt_id=?",e.retryEligible===true?1:0,attemptId);
    // Keep consumed sender/recipient accounting through its rolling window even after rejection.
    const reason=fresh(a,now);run('UPDATE cf_test_sms_actions SET state=?,reason=?,token=NULL,worker=NULL,lease_until=NULL,revision=revision+1,updated_at=? WHERE action_id=?',!reason&&e.retryEligible===true?'WAITING':'HELD',reason||'PROVEN_REJECTED',now,aId);return {code:'PROVEN_REJECTED'};
   }
   if(!e.provider_id||!e.provider_scope||e.provider_scope!==a.sender)return fail('INCOMPLETE_PROVIDER_IDENTITY');id(e.provider_id);
   if(t.state==='PROVEN_REJECTED')return fail('CONFLICTING_ACCEPTANCE');
   if(t.provider_id&&t.provider_id!==e.provider_id)return fail('CONFLICTING_PROVIDER_ID');
   const other=get('SELECT attempt_id FROM cf_test_sms_attempts WHERE provider_scope=? AND provider_id=?',e.provider_scope,e.provider_id);if(other&&other.attempt_id!==attemptId)return fail('PROVIDER_ID_ALREADY_BOUND');
   let receipt=t.receipt_state,seq=t.receipt_sequence;
   if(e.outcome!=='ACCEPTED'){
    bound(e.sequence,1,1e9);if(e.sequence<=seq){run('UPDATE cf_test_sms_attempts SET revision=revision+1 WHERE attempt_id=?',attemptId);return {code:'OUT_OF_ORDER'}}
    if(receipt&&receipt!==e.outcome)return fail('CONFLICTING_DELIVERY');receipt=e.outcome;seq=e.sequence;
   }
   run("UPDATE cf_test_sms_attempts SET state='ACKNOWLEDGED',active=0,provider_id=?,provider_scope=?,receipt_state=?,receipt_sequence=?,revision=revision+1 WHERE attempt_id=?",e.provider_id,e.provider_scope,receipt,seq,attemptId);
   const safety=fresh(a,now);run('UPDATE cf_test_sms_actions SET state=?,reason=?,token=NULL,worker=NULL,lease_until=NULL,revision=revision+1,updated_at=? WHERE action_id=?',safety?'HELD':'COMPLETED',safety||'SUBMISSION_ACKNOWLEDGED_NOT_ENGAGEMENT',now,aId);return {code:'ACKNOWLEDGED',delivery:receipt||'UNVERIFIED',execution_eligibility:execution};
  });
 }
 function inspect(w,aId){const a=action(w,aId);return {action:a,attempts:all('SELECT * FROM cf_test_sms_attempts WHERE action_id=? ORDER BY ordinal',aId),execution_eligibility:execution}}
 return {setAuthority,setSender,admit,claim,reserve,beginSubmission,recover,cancel,reconcile,inspect};
}
