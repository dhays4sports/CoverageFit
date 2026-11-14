-- Approved screenshot evidence belongs to existing UCP identities, not a new CRM.
-- Apply only with separately approved hosted rollout. Feature defaults off.
CREATE TABLE IF NOT EXISTS cf_shared_profile_updates (
 workspace_id TEXT NOT NULL, request_id TEXT NOT NULL,
 customer_id TEXT NOT NULL REFERENCES cf_ucp_customers(id),
 opportunity_id TEXT NOT NULL REFERENCES cf_solo_opportunities(id),
 fingerprint TEXT NOT NULL, record_json TEXT NOT NULL,
 created_at TEXT NOT NULL, actor_id TEXT NOT NULL,
 PRIMARY KEY(workspace_id,request_id)
);
CREATE INDEX IF NOT EXISTS idx_shared_profile_customer ON cf_shared_profile_updates(workspace_id,customer_id,created_at,request_id);
CREATE TABLE IF NOT EXISTS cf_shared_profile_capture_chunks (
 workspace_id TEXT NOT NULL, request_id TEXT NOT NULL, capture_id TEXT NOT NULL,
 chunk_index INTEGER NOT NULL CHECK(chunk_index>=0), chunk_base64 TEXT NOT NULL,
 PRIMARY KEY(workspace_id,request_id,capture_id,chunk_index),
 FOREIGN KEY(workspace_id,request_id) REFERENCES cf_shared_profile_updates(workspace_id,request_id) ON DELETE CASCADE
);
