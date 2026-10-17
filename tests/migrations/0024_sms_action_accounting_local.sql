-- LOCAL SYNTHETIC ONLY. Not a production migration or hosted adapter.
PRAGMA foreign_keys=ON;
CREATE TABLE cf_test_sms_authority(workspace TEXT NOT NULL,relationship TEXT NOT NULL,revision INTEGER NOT NULL,json TEXT NOT NULL,PRIMARY KEY(workspace,relationship));
CREATE TABLE cf_test_sms_sender(sender TEXT PRIMARY KEY,revision INTEGER NOT NULL,json TEXT NOT NULL);
CREATE TABLE cf_test_sms_actions(
 action_id TEXT PRIMARY KEY,business_key TEXT NOT NULL UNIQUE,workspace TEXT NOT NULL,relationship TEXT NOT NULL,
 family TEXT NOT NULL,sender TEXT NOT NULL,campaign TEXT NOT NULL,payload_digest TEXT NOT NULL,immutable_json TEXT NOT NULL,
 authority_revision INTEGER NOT NULL,state TEXT NOT NULL,reason TEXT,revision INTEGER NOT NULL DEFAULT 1,
 worker TEXT,token TEXT,lease_until INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
);
CREATE INDEX cf_test_sms_relationship ON cf_test_sms_actions(workspace,relationship);
CREATE INDEX cf_test_sms_recovery ON cf_test_sms_actions(workspace,state,lease_until,action_id);
CREATE TABLE cf_test_sms_attempts(
 attempt_id TEXT PRIMARY KEY,action_id TEXT NOT NULL REFERENCES cf_test_sms_actions(action_id),ordinal INTEGER NOT NULL,
 gateway_key TEXT NOT NULL UNIQUE,token TEXT NOT NULL,state TEXT NOT NULL,active INTEGER NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1,started_at INTEGER,provider_id TEXT,provider_scope TEXT,
 receipt_state TEXT,receipt_sequence INTEGER NOT NULL DEFAULT 0,retry_eligible INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL,UNIQUE(action_id,ordinal)
);
CREATE UNIQUE INDEX cf_test_sms_active ON cf_test_sms_attempts(action_id) WHERE active=1;
CREATE UNIQUE INDEX cf_test_sms_provider ON cf_test_sms_attempts(provider_scope,provider_id) WHERE provider_id IS NOT NULL;
CREATE TABLE cf_test_sms_reservations(
 attempt_id TEXT PRIMARY KEY REFERENCES cf_test_sms_attempts(attempt_id),sender TEXT NOT NULL,
 workspace TEXT NOT NULL,relationship TEXT NOT NULL,reserved_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,
 started_at INTEGER,released INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX cf_test_sms_sender_window ON cf_test_sms_reservations(sender,reserved_at);
CREATE INDEX cf_test_sms_recipient_window ON cf_test_sms_reservations(workspace,relationship,reserved_at);
CREATE TABLE cf_test_sms_evidence(
 workspace TEXT NOT NULL,evidence_id TEXT NOT NULL,attempt_id TEXT NOT NULL REFERENCES cf_test_sms_attempts(attempt_id),
 digest TEXT NOT NULL,json TEXT NOT NULL,at INTEGER NOT NULL,PRIMARY KEY(workspace,evidence_id)
);
CREATE TABLE cf_test_sms_audit(id INTEGER PRIMARY KEY,workspace TEXT,action_id TEXT,attempt_id TEXT,operation TEXT NOT NULL,reference TEXT NOT NULL,json TEXT NOT NULL,at INTEGER NOT NULL);
CREATE TRIGGER cf_test_sms_evidence_no_update BEFORE UPDATE ON cf_test_sms_evidence BEGIN SELECT RAISE(ABORT,'immutable_evidence'); END;
CREATE TRIGGER cf_test_sms_evidence_no_delete BEFORE DELETE ON cf_test_sms_evidence BEGIN SELECT RAISE(ABORT,'immutable_evidence'); END;
CREATE TRIGGER cf_test_sms_audit_no_update BEFORE UPDATE ON cf_test_sms_audit BEGIN SELECT RAISE(ABORT,'immutable_audit'); END;
CREATE TRIGGER cf_test_sms_audit_no_delete BEFORE DELETE ON cf_test_sms_audit BEGIN SELECT RAISE(ABORT,'immutable_audit'); END;
