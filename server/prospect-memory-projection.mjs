// Canonical E2 read projection. The injected digest preserves legacy SHA-256 versions.
import {emptyEvidenceState,projectEvidence} from './continuous-evidence-shadow.mjs';
export const MEMORY_BUILD='CF-PROSPECT-MEMORY-E2-1';
export function projectMemoryRows({rows,identity,collisions,revision},w,p,{now,staleAfterDays={carrier:365,vehicle_count:180,homeowner:365,shopping_reason:90,explicit_call_request:7,explicit_quote_request:7}},hash){
 if(typeof now!=='string'||!Number.isFinite(Date.parse(now)))throw Error('invalid_clock');
 const s={...emptyEvidenceState(),events:rows.map(r=>({...JSON.parse(r.event_json),claims:r.assertions.filter(a=>!a.superseded_at||a.superseded_at>now).map(a=>JSON.parse(a.assertion_json))}))};
 const projection=projectEvidence(s,{workspace_id:w,profile_id:p,now});
  projection.material_conflicts ||= collisions>0;
  projection.held_events=collisions;
  const identityHeld=!identity||rows.some(r=>r.customer_id!==identity.customer_id);
  for(const [field,f] of Object.entries(projection.facts)){
   if(f.status==='KNOWN'&&((staleAfterDays[field]&&f.evidence.every(e=>Date.parse(now)-Date.parse(e.observed_at)>staleAfterDays[field]*86400000))
     ||field.startsWith('renewal_date')&&f.value.length===10&&f.value<now.slice(0,10)))f.status='STALE';
   f.evidence=f.evidence.map(e=>({...e,source_ref:JSON.parse(rows.find(r=>r.event_key===e.source_event_id)?.source_ref_json||'null')}));
  }
  const expiry=rows.map(r=>r.retain_until).filter(t=>t>now).sort()[0]||null;
  const renewalExpiry=Object.entries(projection.facts).filter(([field,f])=>field.startsWith('renewal_date')&&f.status==='KNOWN'&&f.value?.length===10).map(([,f])=>new Date(Date.parse(f.value+'T00:00:00Z')+86400000).toISOString());
  const transitions=[expiry,...renewalExpiry,...s.events.map(e=>e.observed_at),...Object.entries(projection.facts).flatMap(([field,f])=>staleAfterDays[field]?(f.evidence||[]).map(e=>new Date(Date.parse(e.observed_at)+staleAfterDays[field]*86400000+1).toISOString()):[])].filter(t=>t&&t>now).sort();
  return {...projection,build:MEMORY_BUILD,revision,as_of:now,next_change_at:transitions[0]||null,identity_status:identityHeld?'HOLD':'LINKED',next_expiration_at:expiry,
   projection_version:hash([MEMORY_BUILD,w,p,revision,now,projection.facts,identityHeld,collisions])};
}
