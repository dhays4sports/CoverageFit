// E2 LOCAL SYNTHETIC HARNESS ONLY. No route imports this module. Inject real SQLite.
// D1-compatible SQL schema; transaction adapter is NOT a certified hosted D1 adapter.
import {createHash} from 'node:crypto';
import {admitEvidence,emptyEvidenceState,projectEvidence} from './continuous-evidence-shadow.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const instant=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(x);
export const MEMORY_BUILD='CF-PROSPECT-MEMORY-E2-1';
export function prospectMemoryLocal(db,{syntheticOnly=false}={}){
 if(!syntheticOnly)throw Error('synthetic_only_required');
 db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA secure_delete=ON;');
 const get=(q,...a)=>db.prepare(q).get(...a),all=(q,...a)=>db.prepare(q).all(...a),run=(q,...a)=>db.prepare(q).run(...a);
 const tx=(fn,readOnly=false)=>{db.exec(readOnly?'BEGIN':'BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}};
 const bump=(w,p)=>run('INSERT INTO cf_evidence_revisions VALUES(?,?,1) ON CONFLICT(workspace_id,opportunity_id) DO UPDATE SET revision=revision+1',w,p);
 const key=e=>hash([e.source_type,e.source_event_id]);
 const link=(w,p)=>get('SELECT * FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id=?',w,p);
 const held=(w,k,code)=>{run('INSERT OR IGNORE INTO cf_evidence_holds VALUES(?,?,?)',w,k,code);return {code}};
 function state(w,p,now){
  const rows=all("SELECT * FROM cf_evidence_events WHERE workspace_id=? AND opportunity_id=? AND state='ACTIVE' ORDER BY observed_at,event_key",w,p);
  return {...emptyEvidenceState(),events:rows.map(r=>({...JSON.parse(r.event_json),claims:all('SELECT assertion_json FROM cf_evidence_assertions WHERE workspace_id=? AND event_key=? AND (superseded_at IS NULL OR superseded_at>?) ORDER BY assertion_id',w,r.event_key,now).map(x=>JSON.parse(x.assertion_json))}))};
 }
 function admit(e,{now,interruptAfterEvent=false}={}){
  if(!instant(now))throw Error('invalid_clock');
  if(!validId(e?.workspace_id)||!validId(e?.profile_id)||!validId(e?.source_event_id))return {code:'HOLD_INVALID_EVENT'};
  const w=e.workspace_id,p=e.profile_id,k=key(e);
  return tx(()=>{
   const identity=link(w,p),ref=e.source_ref;
   // References to the authoritative source and UCP link are checked, never phone matching.
   const source=ref&&get('SELECT opportunity_id FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND source_id=?',w,ref.kind,ref.id);
   if(!identity||identity.customer_id!==e.identity?.customer_id||source?.opportunity_id!==p
      ||e.identity?.basis==='shared_phone'||e.identity?.status!=='linked'||e.identity?.verified_reference!==true)
    return held(w,k,'HOLD_IDENTITY_UNVERIFIED');
   if(!instant(e.rights?.retain_until)||!validId(e.rights?.controller)||!validId(ref?.locator))return held(w,k,'HOLD_SOURCE_RIGHTS');
   // Namespace assertion IDs so two providers using the same event ID cannot supersede each other.
   const input={...e,source_event_id:k,observations:Array.isArray(e.observations)?e.observations.map(c=>({...c,
    supersedes_source_event_id:c.supersedes_source_event_id?hash([c.supersedes_source_type||e.source_type,c.supersedes_source_event_id]):undefined})):null};
   const normalized=admitEvidence(emptyEvidenceState(),input,{now});
   if(normalized.code!=='ADMITTED')return held(w,k,normalized.code);
   const event=normalized.state.events[0];
   event.rights.controller=e.rights.controller;
   const fingerprint=hash([event,ref,identity.customer_id]);
   const old=get('SELECT fingerprint,state FROM cf_evidence_events WHERE workspace_id=? AND event_key=?',w,k);
   if(old){
    if(old.state!=='ACTIVE')return {code:'REPLAY_TOMBSTONED'};
    return old.fingerprint===fingerprint?{code:'DUPLICATE_EXACT'}:held(w,k,'HOLD_SOURCE_ID_CONFLICT');
   }
   // Document verification requires a separately admitted producer verification event.
   if(e.source_type==='document_verification')for(const c of event.claims){
    const verificationKey=hash(['producer_confirmation',c.verification_event_id]);
    const verified=get("SELECT a.assertion_json,e.observed_at,e.retain_until FROM cf_evidence_assertions a JOIN cf_evidence_events e USING(workspace_id,event_key) WHERE a.workspace_id=? AND a.event_key=? AND a.field=? AND e.opportunity_id=? AND e.state='ACTIVE' AND a.superseded_at IS NULL",w,verificationKey,c.field,p);
    const assertion=verified&&JSON.parse(verified.assertion_json);
    if(!assertion||assertion.verification!=='producer_confirmed'||assertion.value!==c.value||assertion.policy_line!==c.policy_line||verified.observed_at>event.observed_at||verified.retain_until<=now)return held(w,k,'HOLD_DOCUMENT_VERIFICATION');
   }
   // Corrections must resolve a prior assertion on the same prospect and field.
   for(const c of event.claims.filter(c=>c.supersedes_assertion_id)){
    const prior=get('SELECT a.assertion_json,e.opportunity_id FROM cf_evidence_assertions a JOIN cf_evidence_events e USING(workspace_id,event_key) WHERE a.workspace_id=? AND a.assertion_id=?',w,c.supersedes_assertion_id);
    if(!prior||prior.opportunity_id!==p||JSON.parse(prior.assertion_json).observed_at>c.observed_at)return held(w,k,'HOLD_INVALID_CORRECTION');
   }
   const {claims,...metadata}=event;
   run('INSERT INTO cf_evidence_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',w,k,p,identity.customer_id,ref.kind,ref.id,event.observed_at,new Date(now).toISOString(),event.rights.retain_until,fingerprint,'ACTIVE',JSON.stringify(metadata),JSON.stringify({...ref,source_type:e.source_type,source_event_id:e.source_event_id}));
   if(interruptAfterEvent)throw Error('simulated_transaction_interruption');
   for(const c of claims)run('INSERT INTO cf_evidence_assertions(workspace_id,event_key,assertion_id,field,assertion_json) VALUES(?,?,?,?,?)',w,k,c.assertion_id,c.field,JSON.stringify(c));
   for(const c of claims.filter(c=>c.supersedes_assertion_id))run('UPDATE cf_evidence_assertions SET superseded_at=CASE WHEN superseded_at IS NULL OR superseded_at>? THEN ? ELSE superseded_at END WHERE workspace_id=? AND assertion_id=?',c.observed_at,c.observed_at,w,c.supersedes_assertion_id);
   bump(w,p);return {code:'ADMITTED',event_key:k};
  });
 }
 function projectSnapshot(w,p,{now,staleAfterDays={carrier:365,vehicle_count:180,homeowner:365,shopping_reason:90,explicit_call_request:7,explicit_quote_request:7}}={}){
  if(!instant(now))throw Error('invalid_clock');
  const s=state(w,p,now),projection=projectEvidence(s,{workspace_id:w,profile_id:p,now});
  const identity=link(w,p);
  const collisions=get("SELECT count(*) n FROM cf_evidence_holds h JOIN cf_evidence_events e USING(workspace_id,event_key) WHERE e.workspace_id=? AND e.opportunity_id=? AND h.code='HOLD_SOURCE_ID_CONFLICT'",w,p).n;
  projection.material_conflicts ||= collisions>0;
  projection.held_events=collisions;
  const identityHeld=!identity||all("SELECT customer_id FROM cf_evidence_events WHERE workspace_id=? AND opportunity_id=? AND state='ACTIVE'",w,p).some(r=>r.customer_id!==identity.customer_id);
  for(const [field,f] of Object.entries(projection.facts)){
   if(f.status==='KNOWN'&&((staleAfterDays[field]&&f.evidence.every(e=>Date.parse(now)-Date.parse(e.observed_at)>staleAfterDays[field]*86400000))
     ||field.startsWith('renewal_date')&&f.value.length===10&&f.value<now.slice(0,10)))f.status='STALE';
   f.evidence=f.evidence.map(e=>({...e,source_ref:JSON.parse(get('SELECT source_ref_json FROM cf_evidence_events WHERE workspace_id=? AND event_key=?',w,e.source_event_id)?.source_ref_json||'null')}));
  }
  const revision=get('SELECT revision FROM cf_evidence_revisions WHERE workspace_id=? AND opportunity_id=?',w,p)?.revision||0;
  const expiry=all("SELECT retain_until FROM cf_evidence_events WHERE workspace_id=? AND opportunity_id=? AND state='ACTIVE' AND retain_until>? ORDER BY retain_until LIMIT 1",w,p,now)[0]?.retain_until||null;
  const transitions=[expiry,...s.events.map(e=>e.observed_at),...Object.entries(projection.facts).flatMap(([field,f])=>staleAfterDays[field]?(f.evidence||[]).map(e=>new Date(Date.parse(e.observed_at)+staleAfterDays[field]*86400000+1).toISOString()):[])].filter(t=>t&&t>now).sort();
  return {...projection,build:MEMORY_BUILD,revision,as_of:now,next_change_at:transitions[0]||null,identity_status:identityHeld?'HOLD':'LINKED',next_expiration_at:expiry,
   projection_version:hash([MEMORY_BUILD,w,p,revision,now,projection.facts,identityHeld,collisions])};
 }
 const project=(w,p,options)=>tx(()=>projectSnapshot(w,p,options),true);
 function erase(w,k,reason,{now}={}){
  if(!instant(now)||!['RETRACTED','EXPIRED'].includes(reason))throw Error('invalid_erasure');
  return tx(()=>{
   const row=get("SELECT * FROM cf_evidence_events WHERE workspace_id=? AND event_key=? AND state='ACTIVE'",w,k);
   if(!row)return false;
   if(reason==='EXPIRED'&&row.retain_until>now)throw Error('not_expired');
   run('DELETE FROM cf_evidence_assertions WHERE workspace_id=? AND event_key=?',w,k);
   run('UPDATE cf_evidence_events SET event_json=NULL,source_ref_json=NULL,state=? WHERE workspace_id=? AND event_key=?',reason,w,k);
   // Remove derived decision traces instead of leaving now-invalid evidence claims.
   run('DELETE FROM cf_evidence_decisions WHERE workspace_id=? AND opportunity_id=?',w,row.opportunity_id);
   bump(w,row.opportunity_id);return true;
  });
 }
 function expire(w,{now,limit=100}={}){
  if(!instant(now))throw Error('invalid_clock');
  const due=all("SELECT event_key FROM cf_evidence_events WHERE workspace_id=? AND state='ACTIVE' AND retain_until<=? ORDER BY retain_until,event_key LIMIT ?",w,now,Math.max(1,Math.min(1000,limit)));
  for(const r of due)erase(w,r.event_key,'EXPIRED',{now});return due.length;
 }
 function recordDecision(profile,decision){return tx(()=>{
  const fresh=projectSnapshot(profile.workspace_id,profile.profile_id,{now:profile.as_of});
  if(fresh.projection_version!==profile.projection_version||decision.profile_version!==profile.projection_version)throw Error('stale_decision');
  const id=hash([profile.projection_version,decision]);
  run('INSERT OR IGNORE INTO cf_evidence_decisions VALUES(?,?,?,?,?,?,?,?)',profile.workspace_id,profile.profile_id,id,profile.projection_version,profile.as_of,decision.action,decision.reason_category,JSON.stringify(decision.evidence_refs));return id;
 });}
 return {admit,project,erase,expire,recordDecision,eventKey:key};
}
