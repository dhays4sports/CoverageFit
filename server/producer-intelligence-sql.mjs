// Read-only D1-compatible SQL. No session or multiquery-snapshot assumption.
// All history caps have overflow sentinels; no truncated history becomes CURRENT.
export const READ_BUDGET=Object.freeze({page:40,allowlist:100,events:64,assertionsPerEvent:12,recordBytes:65536,queries:1,parameters:8});
const capped=(x,n)=>`CASE WHEN length(CAST(${x} AS BLOB))<=${n} THEN ${x} ELSE NULL END`;
export function producerReadSQL({mode='attention',restricted=false,after=false}={}){
 const scope=restricted?`scope AS MATERIALIZED (SELECT value AS id FROM json_each(?2)), scoped AS MATERIALIZED (
  SELECT q.* FROM scope JOIN cf_evaluation_queue q ON q.workspace_id=?1 AND q.opportunity_id=scope.id),`:'';
 const table=restricted?'scoped q':'cf_evaluation_queue q INDEXED BY cf_eval_attention';
 const candidates=mode==='attention'?`SELECT q.* FROM ${table} WHERE q.workspace_id=?1 AND q.attention_eligible=1 AND ?8 IS NULL
 ${after?'AND (q.attention_order,q.attention_due,q.opportunity_id)>(?4,?5,?6)':''}
 ORDER BY q.attention_order,q.attention_due,q.opportunity_id LIMIT ?7`:
 `SELECT o.id AS opportunity_id,q.* FROM cf_solo_opportunities o LEFT JOIN cf_evaluation_queue q ON q.workspace_id=?1 AND q.opportunity_id=o.id
 WHERE o.workspace_id=?1 AND o.id=?8 ${restricted?'AND o.id IN (SELECT id FROM scope)':''} LIMIT 1`;
 // Correlated CTEs hydrate only selected rows. Each event/claim lookup has an index + hard LIMIT.
 const payload=`WITH ev AS MATERIALIZED (
 SELECT e.*,s.opportunity_id AS source_prospect,
 EXISTS(SELECT 1 FROM cf_evidence_holds h WHERE h.workspace_id=e.workspace_id AND h.event_key=e.event_key AND h.code='HOLD_SOURCE_ID_CONFLICT') AS collision
 FROM cf_evidence_events e INDEXED BY cf_evidence_read_history
 LEFT JOIN cf_solo_sources s ON s.workspace_id=e.workspace_id AND s.kind=e.source_kind AND s.source_id=e.source_id
 WHERE e.workspace_id=?1 AND e.opportunity_id=c.opportunity_id ORDER BY e.observed_at,e.event_key LIMIT 65
 ), history AS MATERIALIZED (SELECT json_object(
 'event_key',event_key,'state',state,'customer_id',customer_id,'retain_until',retain_until,'collision',collision,'source_prospect',source_prospect,
 'event_json',${capped('event_json',8192)},'source_ref_json',${capped('source_ref_json',2048)},
 'assertions',json((SELECT json_group_array(json_object('assertion_json',assertion_json,'superseded_at',superseded_at)) FROM (
 SELECT ${capped('a.assertion_json',2048)} AS assertion_json,a.superseded_at FROM cf_evidence_assertions a INDEXED BY cf_assertions_event
 WHERE a.workspace_id=?1 AND a.event_key=ev.event_key ORDER BY a.assertion_id LIMIT 13)))) AS item FROM ev),
 result AS MATERIALIZED (SELECT generation,decision_id,evidence_revision,context_version,evaluated_at,acknowledged_at,${capped('decision_json',16384)} AS decision_json
 FROM cf_evaluation_results WHERE workspace_id=?1 AND opportunity_id=c.opportunity_id ORDER BY generation DESC LIMIT 1),
 envelope AS (SELECT json_object(
 'history',json((SELECT json_group_array(json(item)) FROM history)),
 'identity',(SELECT customer_id FROM cf_ucp_opportunity_links WHERE workspace_id=?1 AND opportunity_id=c.opportunity_id),
 'revision',COALESCE((SELECT revision FROM cf_evidence_revisions WHERE workspace_id=?1 AND opportunity_id=c.opportunity_id),0),
 'context',(SELECT ${capped('summary_json',16384)} FROM cf_solo_sources WHERE workspace_id=?1 AND kind='signal_c2_context_v1' AND source_id=c.opportunity_id AND opportunity_id=c.opportunity_id),
 'op',json((SELECT json_object('id',id,'contact_json',${capped('contact_json',8192)},'products',${capped('products',2048)},'source',${capped('source',2048)},'status',status,'created_at',created_at,'updated_at',updated_at)
 FROM cf_solo_opportunities WHERE workspace_id=?1 AND id=c.opportunity_id)),
 'result',json((SELECT json_object('generation',generation,'decision_id',decision_id,'evidence_revision',evidence_revision,'context_version',context_version,'evaluated_at',evaluated_at,'acknowledged_at',acknowledged_at,'decision_json',decision_json) FROM result)),
 'trace',json((SELECT json_object('opportunity_id',d.opportunity_id,'profile_version',d.profile_version,'action',d.action,'reason_category',d.reason_category)
 FROM cf_evidence_decisions d WHERE d.workspace_id=?1 AND d.decision_id=(SELECT decision_id FROM result)))
 ) AS body)
 SELECT CASE WHEN length(CAST(body AS BLOB))>65536 THEN '{"error":"HISTORY_BYTE_BUDGET_EXCEEDED"}' ELSE body END FROM envelope`;
 const hints=restricted?`SELECT EXISTS(SELECT 1 FROM scoped WHERE state='LEASED' OR state='READY' AND due_at<=?3) AS pending,
 EXISTS(SELECT 1 FROM scoped WHERE state='FAILED') AS failed,
 EXISTS(SELECT 1 FROM scope LEFT JOIN scoped ON scope.id=scoped.opportunity_id WHERE scoped.attention_json IS NULL) AS unpublished`:
 `SELECT (EXISTS(SELECT 1 FROM cf_evaluation_queue INDEXED BY cf_eval_due WHERE workspace_id=?1 AND state='READY' AND due_at<=?3)
 OR EXISTS(SELECT 1 FROM cf_evaluation_queue INDEXED BY cf_eval_lease WHERE workspace_id=?1 AND state='LEASED')) AS pending,
 EXISTS(SELECT 1 FROM cf_evaluation_queue INDEXED BY cf_eval_due WHERE workspace_id=?1 AND state='FAILED') AS failed,
 EXISTS(SELECT 1 FROM cf_evaluation_queue INDEXED BY cf_eval_attention_unpublished WHERE workspace_id=?1 AND attention_json IS NULL) AS unpublished`;
 return `WITH ${scope} candidates AS MATERIALIZED (${candidates}), hints AS MATERIALIZED (${hints})
 SELECT ${capped('c.opportunity_id',160)} AS opportunity_id,c.attention_order,${capped('c.attention_due',32)} AS attention_due,c.generation,c.target_revision,c.state,${capped('c.due_at',32)} AS due_at,c.reason_mask,${capped('c.lease_until',32)} AS lease_until,c.attempts,${capped('c.last_error',256)} AS last_error,${capped('c.last_decision_id',64)} AS last_decision_id,
 ${capped('c.attention_json',4096)} AS attention_json,
 CASE WHEN row_number() OVER (ORDER BY c.attention_order,c.attention_due,c.opportunity_id)<?7 THEN (${payload}) ELSE NULL END AS payload,
 hints.pending,hints.failed,hints.unpublished FROM candidates c CROSS JOIN hints
 UNION ALL SELECT NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,pending,failed,unpublished FROM hints ORDER BY attention_order,attention_due,opportunity_id`;
}
