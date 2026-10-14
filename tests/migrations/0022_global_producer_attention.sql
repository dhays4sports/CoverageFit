-- LOCAL SYNTHETIC ONLY. Not a hosted migration. Selection metadata, not another profile.
ALTER TABLE cf_evaluation_queue ADD COLUMN attention_eligible INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cf_evaluation_queue ADD COLUMN attention_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cf_evaluation_queue ADD COLUMN attention_due TEXT NOT NULL DEFAULT '9999';
ALTER TABLE cf_evaluation_queue ADD COLUMN attention_json TEXT;
CREATE INDEX cf_eval_attention ON cf_evaluation_queue(workspace_id,attention_eligible,attention_order,attention_due,opportunity_id);
CREATE INDEX cf_eval_attention_unpublished ON cf_evaluation_queue(workspace_id,opportunity_id) WHERE attention_json IS NULL;
-- Material work changes fence selection in the same transaction. Acknowledgment
-- republishes only after its final future-timer/IDLE transition has succeeded.
CREATE TRIGGER cf_attention_invalidated AFTER UPDATE OF generation,target_revision,state,last_decision_id ON cf_evaluation_queue
WHEN NEW.generation<>OLD.generation OR NEW.target_revision<>OLD.target_revision
 OR NEW.state NOT IN ('IDLE','READY') OR NEW.last_decision_id IS NOT OLD.last_decision_id
BEGIN
 UPDATE cf_evaluation_queue SET attention_eligible=0,attention_json=NULL
 WHERE workspace_id=NEW.workspace_id AND opportunity_id=NEW.opportunity_id;
END;
CREATE TRIGGER cf_attention_source_deleted AFTER DELETE ON cf_solo_sources BEGIN
 UPDATE cf_evaluation_queue SET attention_eligible=0,attention_json=NULL
 WHERE workspace_id=OLD.workspace_id AND opportunity_id=OLD.opportunity_id;
END;
CREATE TRIGGER cf_attention_source_relinked AFTER UPDATE OF opportunity_id ON cf_solo_sources WHEN NEW.opportunity_id<>OLD.opportunity_id BEGIN
 UPDATE cf_evaluation_queue SET attention_eligible=0,attention_json=NULL
 WHERE workspace_id=OLD.workspace_id AND opportunity_id IN (OLD.opportunity_id,NEW.opportunity_id);
END;
CREATE TRIGGER cf_attention_opportunity_closed AFTER UPDATE OF status ON cf_solo_opportunities WHEN NEW.status<>OLD.status BEGIN
 UPDATE cf_evaluation_queue SET attention_eligible=0,attention_json=NULL
 WHERE workspace_id=NEW.workspace_id AND opportunity_id=NEW.id;
END;
