-- Owner activation is explicit. An empty table leaves production disabled.
CREATE TABLE IF NOT EXISTS cf_prospect_desk_owner_access (
  workspace_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0,1)),
  desktop_sha256 TEXT NOT NULL CHECK (length(desktop_sha256)=64),
  updated_at TEXT NOT NULL
);
