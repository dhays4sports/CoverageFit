-- LOCAL SYNTHETIC ACCEPTANCE ONLY. No hosted migration activation.
-- Includes tombstones because source-ID conflict holds remain canonical evidence state.
CREATE INDEX cf_evidence_read_history ON cf_evidence_events(workspace_id,opportunity_id,observed_at,event_key);
