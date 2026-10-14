-- C2: LOCAL SYNTHETIC ACCEPTANCE ONLY. Not a production migration or message queue.
ALTER TABLE cf_evidence_revisions ADD COLUMN changed_at TEXT;
CREATE TABLE cf_evaluation_queue (
 workspace_id TEXT NOT NULL, opportunity_id TEXT NOT NULL,
 generation INTEGER NOT NULL DEFAULT 1, target_revision INTEGER NOT NULL,
 due_at TEXT, enqueued_at TEXT NOT NULL, reason_mask INTEGER NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('READY','LEASED','IDLE','FAILED')),
 claim_token TEXT, worker_id TEXT, claimed_generation INTEGER, claimed_at TEXT, lease_until TEXT,
 attempts INTEGER NOT NULL DEFAULT 0, recovery_count INTEGER NOT NULL DEFAULT 0,
 stale_ack_count INTEGER NOT NULL DEFAULT 0, last_error TEXT, last_decision_id TEXT,
 PRIMARY KEY(workspace_id,opportunity_id),
 FOREIGN KEY(workspace_id,opportunity_id) REFERENCES cf_ucp_opportunity_links(workspace_id,opportunity_id)
);
CREATE INDEX cf_eval_due ON cf_evaluation_queue(workspace_id,state,due_at,opportunity_id);
CREATE INDEX cf_eval_lease ON cf_evaluation_queue(workspace_id,state,lease_until,opportunity_id);
CREATE TABLE cf_evaluation_results (
 workspace_id TEXT NOT NULL, opportunity_id TEXT NOT NULL, generation INTEGER NOT NULL,
 decision_id TEXT NOT NULL, evidence_revision INTEGER NOT NULL, context_version TEXT NOT NULL,
 evaluated_at TEXT NOT NULL, acknowledged_at TEXT NOT NULL, decision_json TEXT NOT NULL,
 PRIMARY KEY(workspace_id,opportunity_id,generation),
 FOREIGN KEY(workspace_id,decision_id) REFERENCES cf_evidence_decisions(workspace_id,decision_id) ON DELETE CASCADE
);
CREATE INDEX cf_eval_result_decision ON cf_evaluation_results(workspace_id,decision_id);
CREATE TRIGGER cf_eval_erased_decision AFTER DELETE ON cf_evidence_decisions BEGIN
 UPDATE cf_evaluation_queue SET last_decision_id=NULL
 WHERE workspace_id=OLD.workspace_id AND opportunity_id=OLD.opportunity_id AND last_decision_id=OLD.decision_id;
END;
CREATE TRIGGER cf_eval_evidence_insert AFTER INSERT ON cf_evidence_revisions WHEN NEW.changed_at IS NOT NULL BEGIN
 INSERT INTO cf_evaluation_queue(workspace_id,opportunity_id,target_revision,due_at,enqueued_at,reason_mask,state)
 VALUES(NEW.workspace_id,NEW.opportunity_id,COALESCE((SELECT revision FROM cf_evidence_revisions WHERE workspace_id=NEW.workspace_id AND opportunity_id=NEW.opportunity_id),0),NEW.changed_at,NEW.changed_at,1,'READY')
 ON CONFLICT(workspace_id,opportunity_id) DO UPDATE SET
 generation=generation+1,target_revision=excluded.target_revision,
 due_at=CASE WHEN state IN ('IDLE','FAILED') OR due_at IS NULL THEN excluded.due_at ELSE MIN(due_at,excluded.due_at) END,
 enqueued_at=excluded.enqueued_at,reason_mask=reason_mask|excluded.reason_mask,
 state=CASE WHEN state='LEASED' THEN 'LEASED' ELSE 'READY' END,attempts=0,last_error=NULL;
END;
CREATE TRIGGER cf_eval_evidence_update AFTER UPDATE ON cf_evidence_revisions WHEN NEW.revision<>OLD.revision AND NEW.changed_at IS NOT NULL BEGIN
 INSERT INTO cf_evaluation_queue(workspace_id,opportunity_id,target_revision,due_at,enqueued_at,reason_mask,state)
 VALUES(NEW.workspace_id,NEW.opportunity_id,COALESCE((SELECT revision FROM cf_evidence_revisions WHERE workspace_id=NEW.workspace_id AND opportunity_id=NEW.opportunity_id),0),NEW.changed_at,NEW.changed_at,1,'READY')
 ON CONFLICT(workspace_id,opportunity_id) DO UPDATE SET
 generation=generation+1,target_revision=excluded.target_revision,
 due_at=CASE WHEN state IN ('IDLE','FAILED') OR due_at IS NULL THEN excluded.due_at ELSE MIN(due_at,excluded.due_at) END,
 enqueued_at=excluded.enqueued_at,reason_mask=reason_mask|excluded.reason_mask,
 state=CASE WHEN state='LEASED' THEN 'LEASED' ELSE 'READY' END,attempts=0,last_error=NULL;
END;
CREATE TRIGGER cf_eval_identity AFTER UPDATE ON cf_ucp_opportunity_links WHEN NEW.customer_id<>OLD.customer_id OR NEW.household_id<>OLD.household_id BEGIN
 INSERT INTO cf_evaluation_queue(workspace_id,opportunity_id,target_revision,due_at,enqueued_at,reason_mask,state)
 VALUES(NEW.workspace_id,NEW.opportunity_id,COALESCE((SELECT revision FROM cf_evidence_revisions WHERE workspace_id=NEW.workspace_id AND opportunity_id=NEW.opportunity_id),0),NEW.updated_at,NEW.updated_at,4,'READY')
 ON CONFLICT(workspace_id,opportunity_id) DO UPDATE SET
 generation=generation+1,target_revision=excluded.target_revision,
 due_at=CASE WHEN state IN ('IDLE','FAILED') OR due_at IS NULL THEN excluded.due_at ELSE MIN(due_at,excluded.due_at) END,
 enqueued_at=excluded.enqueued_at,reason_mask=reason_mask|excluded.reason_mask,
 state=CASE WHEN state='LEASED' THEN 'LEASED' ELSE 'READY' END,attempts=0,last_error=NULL;
END;
CREATE TRIGGER cf_eval_context_insert AFTER INSERT ON cf_solo_sources WHEN NEW.kind='signal_c2_context_v1' BEGIN
 INSERT INTO cf_evaluation_queue(workspace_id,opportunity_id,target_revision,due_at,enqueued_at,reason_mask,state)
 VALUES(NEW.workspace_id,NEW.opportunity_id,COALESCE((SELECT revision FROM cf_evidence_revisions WHERE workspace_id=NEW.workspace_id AND opportunity_id=NEW.opportunity_id),0),NEW.updated_at,NEW.updated_at,2,'READY')
 ON CONFLICT(workspace_id,opportunity_id) DO UPDATE SET
 generation=generation+1,target_revision=excluded.target_revision,
 due_at=CASE WHEN state IN ('IDLE','FAILED') OR due_at IS NULL THEN excluded.due_at ELSE MIN(due_at,excluded.due_at) END,
 enqueued_at=excluded.enqueued_at,reason_mask=reason_mask|excluded.reason_mask,
 state=CASE WHEN state='LEASED' THEN 'LEASED' ELSE 'READY' END,attempts=0,last_error=NULL;
END;
CREATE TRIGGER cf_eval_context_update AFTER UPDATE ON cf_solo_sources WHEN NEW.kind='signal_c2_context_v1' AND NEW.summary_json<>OLD.summary_json BEGIN
 INSERT INTO cf_evaluation_queue(workspace_id,opportunity_id,target_revision,due_at,enqueued_at,reason_mask,state)
 VALUES(NEW.workspace_id,NEW.opportunity_id,COALESCE((SELECT revision FROM cf_evidence_revisions WHERE workspace_id=NEW.workspace_id AND opportunity_id=NEW.opportunity_id),0),NEW.updated_at,NEW.updated_at,2,'READY')
 ON CONFLICT(workspace_id,opportunity_id) DO UPDATE SET
 generation=generation+1,target_revision=excluded.target_revision,
 due_at=CASE WHEN state IN ('IDLE','FAILED') OR due_at IS NULL THEN excluded.due_at ELSE MIN(due_at,excluded.due_at) END,
 enqueued_at=excluded.enqueued_at,reason_mask=reason_mask|excluded.reason_mask,
 state=CASE WHEN state='LEASED' THEN 'LEASED' ELSE 'READY' END,attempts=0,last_error=NULL;
END;
CREATE TRIGGER cf_eval_context_delete AFTER DELETE ON cf_solo_sources WHEN OLD.kind='signal_c2_context_v1' BEGIN
 INSERT INTO cf_evaluation_queue(workspace_id,opportunity_id,target_revision,due_at,enqueued_at,reason_mask,state)
 VALUES(OLD.workspace_id,OLD.opportunity_id,COALESCE((SELECT revision FROM cf_evidence_revisions WHERE workspace_id=OLD.workspace_id AND opportunity_id=OLD.opportunity_id),0),OLD.updated_at,OLD.updated_at,2,'READY')
 ON CONFLICT(workspace_id,opportunity_id) DO UPDATE SET
 generation=generation+1,target_revision=excluded.target_revision,
 due_at=CASE WHEN state IN ('IDLE','FAILED') OR due_at IS NULL THEN excluded.due_at ELSE MIN(due_at,excluded.due_at) END,
 enqueued_at=excluded.enqueued_at,reason_mask=reason_mask|excluded.reason_mask,
 state=CASE WHEN state='LEASED' THEN 'LEASED' ELSE 'READY' END,attempts=0,last_error=NULL;
END;
