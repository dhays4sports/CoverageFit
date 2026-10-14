-- LOCAL SYNTHETIC ACCEPTANCE ONLY. Deliberately outside production migrations/.
-- Existing Solo Desk/UCP are authoritative identity; no duplicate prospect table.
CREATE TABLE cf_evidence_events (
 workspace_id TEXT NOT NULL, event_key TEXT NOT NULL, opportunity_id TEXT NOT NULL,
 customer_id TEXT NOT NULL, source_kind TEXT NOT NULL, source_id TEXT NOT NULL,
 observed_at TEXT NOT NULL, received_at TEXT NOT NULL, retain_until TEXT NOT NULL,
 fingerprint TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('ACTIVE','RETRACTED','EXPIRED')),
 event_json TEXT, source_ref_json TEXT,
 PRIMARY KEY(workspace_id,event_key),
 FOREIGN KEY(workspace_id,source_kind,source_id) REFERENCES cf_solo_sources(workspace_id,kind,source_id)
);
CREATE INDEX cf_evidence_subject ON cf_evidence_events(workspace_id,opportunity_id,state,observed_at,event_key);
CREATE INDEX cf_evidence_subject_expiry ON cf_evidence_events(workspace_id,opportunity_id,state,retain_until);
CREATE INDEX cf_evidence_expiry ON cf_evidence_events(workspace_id,state,retain_until);
CREATE TABLE cf_evidence_assertions (
 workspace_id TEXT NOT NULL, event_key TEXT NOT NULL, assertion_id TEXT NOT NULL,
 field TEXT NOT NULL, assertion_json TEXT NOT NULL, superseded_at TEXT,
 PRIMARY KEY(workspace_id,assertion_id),
 FOREIGN KEY(workspace_id,event_key) REFERENCES cf_evidence_events(workspace_id,event_key)
);
CREATE INDEX cf_assertions_event ON cf_evidence_assertions(workspace_id,event_key,assertion_id);
CREATE TABLE cf_evidence_revisions (
 workspace_id TEXT NOT NULL, opportunity_id TEXT NOT NULL, revision INTEGER NOT NULL,
 PRIMARY KEY(workspace_id,opportunity_id),
 FOREIGN KEY(workspace_id,opportunity_id) REFERENCES cf_ucp_opportunity_links(workspace_id,opportunity_id)
);
-- No raw held payloads. Audit holds without retaining inadmissible customer facts.
CREATE TABLE cf_evidence_holds (
 workspace_id TEXT NOT NULL, event_key TEXT NOT NULL, code TEXT NOT NULL,
 PRIMARY KEY(workspace_id,event_key,code)
);
-- Metadata trace only: projections are rebuilt from permitted evidence; no stale PII copies.
CREATE TABLE cf_evidence_decisions (
 workspace_id TEXT NOT NULL, opportunity_id TEXT NOT NULL, decision_id TEXT NOT NULL,
 profile_version TEXT NOT NULL, as_of TEXT NOT NULL, action TEXT NOT NULL,
 reason_category TEXT NOT NULL, evidence_keys_json TEXT NOT NULL,
 PRIMARY KEY(workspace_id,decision_id)
);
