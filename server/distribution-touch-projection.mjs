import {identity,digest} from './solo-desk-repository.mjs';

// Copy only later-touch evidence to an already-linked checkpoint/source. Never
// invoke sourceSync/projectLead: those can create work, profiles and tasks.
// Read the authoritative journey inside each transaction statement, so a stale
// event cannot roll a newer touch array backwards. No original evidence changes.
export async function projectDistributionTouches(loaded,options){
 if(!loaded.record.contact?.delivered)return;
 const db=options.db,workspace=identity(options.env||{}).workspace;
 const requestId='408d_'+loaded.record.journeyId;
 const leadKey='lead-ops/lead/'+await digest(requestId);
 const target=`SELECT j.data_json AS journey, l.record_key AS lead_key
 FROM pvx_records j JOIN pvx_records l ON l.record_key=?
 JOIN cf_solo_sources s ON s.workspace_id=? AND s.kind='lead' AND s.source_id=?
 JOIN cf_solo_opportunities o ON o.id=s.opportunity_id AND o.workspace_id=s.workspace_id
 WHERE j.record_key=? AND json_extract(j.data_json,'$.journeyId')=?
 AND json_extract(j.data_json,'$.contact.delivered')=1
 AND json_extract(l.data_json,'$.checkpointId')=s.source_id
 AND json_extract(l.data_json,'$.context.distribution.journeyId')=json_extract(j.data_json,'$.journeyId')
 AND json_extract(s.summary_json,'$.context.distribution.journeyId')=json_extract(j.data_json,'$.journeyId')
 AND json_extract(l.data_json,'$.context.distribution.firstTouch')=json_extract(j.data_json,'$.firstTouch')
 AND json_extract(s.summary_json,'$.context.distribution.firstTouch')=json_extract(j.data_json,'$.firstTouch')
 AND (l.expires_at IS NULL OR l.expires_at>?)`;
 const args=[leadKey,workspace,requestId,loaded.key,loaded.record.journeyId,new Date(options.now||Date.now()).toISOString()];
 if(!await db.prepare(target).bind(...args).first())throw Object.assign(Error('Existing touch projection unavailable'),{status:503});
 const touches="COALESCE(json_extract((SELECT journey FROM target),'$.additionalTouches'),'[]')";
 await db.batch([
  db.prepare(`WITH target AS (${target}) UPDATE pvx_records
   SET data_json=json_set(data_json,'$.context.distribution.additionalTouches',json(${touches}))
   WHERE record_key=(SELECT lead_key FROM target)
   AND COALESCE(json_extract(data_json,'$.context.distribution.additionalTouches'),'[]')<>${touches}`).bind(...args),
  db.prepare(`WITH target AS (${target}) UPDATE cf_solo_sources
   SET summary_json=json_set(summary_json,'$.context.distribution.additionalTouches',json(${touches}))
   WHERE workspace_id=? AND kind='lead' AND source_id=? AND EXISTS(SELECT 1 FROM target)
   AND COALESCE(json_extract(summary_json,'$.context.distribution.additionalTouches'),'[]')<>${touches}`).bind(...args,workspace,requestId)
 ]);
}
