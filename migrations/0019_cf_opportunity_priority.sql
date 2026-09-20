-- CF-OPPORTUNITY-PRIORITY-1.0
-- Evidence-gated producer-priority projection for signal-first acquisition.
-- Additive only. Does not replace FIV, Protection Score, underwriting, eligibility,
-- pricing, consent, identity, recommendation, carrier, or binding state.

CREATE TABLE IF NOT EXISTS cf_opportunity_priority_projections (
  workspace_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL REFERENCES cf_solo_opportunities(id),
  status TEXT NOT NULL DEFAULT 'unclassified' CHECK(status IN ('unclassified','provisional','ready','complete')),
  score INTEGER CHECK(score IS NULL OR (score>=0 AND score<=100)),
  score_min INTEGER NOT NULL DEFAULT 0 CHECK(score_min>=0 AND score_min<=100),
  score_max INTEGER NOT NULL DEFAULT 100 CHECK(score_max>=0 AND score_max<=100),
  need_points INTEGER CHECK(need_points IS NULL OR (need_points>=0 AND need_points<=25)),
  intent_points INTEGER CHECK(intent_points IS NULL OR (intent_points>=0 AND intent_points<=30)),
  timing_points INTEGER CHECK(timing_points IS NULL OR (timing_points>=0 AND timing_points<=25)),
  fit_points INTEGER CHECK(fit_points IS NULL OR (fit_points>=0 AND fit_points<=20)),
  evidence_completeness INTEGER NOT NULL DEFAULT 0 CHECK(evidence_completeness>=0 AND evidence_completeness<=100),
  queue TEXT NOT NULL DEFAULT 'unclassified' CHECK(queue IN ('unclassified','shoot_now','quick_play','develop','nurture','low_priority')),
  projection_json TEXT NOT NULL DEFAULT '{}',
  engine TEXT NOT NULL DEFAULT 'CF-OPPORTUNITY-PRIORITY-1.0',
  updated_at TEXT NOT NULL,
  PRIMARY KEY(workspace_id,opportunity_id)
);
CREATE INDEX IF NOT EXISTS idx_cf_priority_queue
  ON cf_opportunity_priority_projections(workspace_id,queue,status,updated_at,opportunity_id);
CREATE INDEX IF NOT EXISTS idx_cf_priority_score
  ON cf_opportunity_priority_projections(workspace_id,status,score,updated_at,opportunity_id);

CREATE TABLE IF NOT EXISTS cf_opportunity_priority_baselines (
  workspace_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL REFERENCES cf_solo_opportunities(id),
  score INTEGER NOT NULL CHECK(score>=0 AND score<=100),
  need_points INTEGER NOT NULL CHECK(need_points>=0 AND need_points<=25),
  intent_points INTEGER NOT NULL CHECK(intent_points>=0 AND intent_points<=30),
  timing_points INTEGER NOT NULL CHECK(timing_points>=0 AND timing_points<=25),
  fit_points INTEGER NOT NULL CHECK(fit_points>=0 AND fit_points<=20),
  queue TEXT NOT NULL CHECK(queue IN ('shoot_now','quick_play','develop','nurture','low_priority')),
  projection_json TEXT NOT NULL DEFAULT '{}',
  engine TEXT NOT NULL,
  basis TEXT NOT NULL DEFAULT 'first_ready',
  captured_at TEXT NOT NULL,
  PRIMARY KEY(workspace_id,opportunity_id,engine)
);
CREATE INDEX IF NOT EXISTS idx_cf_priority_baseline_queue
  ON cf_opportunity_priority_baselines(workspace_id,engine,queue,captured_at,opportunity_id);
CREATE INDEX IF NOT EXISTS idx_cf_priority_baseline_score
  ON cf_opportunity_priority_baselines(workspace_id,engine,score,captured_at,opportunity_id);

CREATE TABLE IF NOT EXISTS cf_acq_exposure_rollups (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  exposure_day TEXT NOT NULL,
  source_family TEXT NOT NULL CHECK(source_family IN (
    'district_lead','purchased_lead','paid_search','paid_social','direct_mail',
    'referral_partner','local_partner','organic_web','outbound','existing_relationship',
    'event_or_affinity','other'
  )),
  source_key TEXT NOT NULL DEFAULT '',
  campaign_id TEXT NOT NULL DEFAULT '',
  campaign_variant TEXT NOT NULL DEFAULT '',
  partner_id TEXT NOT NULL DEFAULT '',
  batch_id TEXT NOT NULL DEFAULT '',
  exposures INTEGER NOT NULL CHECK(exposures>=1 AND exposures<=100000000),
  basis TEXT NOT NULL CHECK(basis IN (
    'first_party_visit','platform_report','outbound_delivered','direct_mail_households',
    'event_attendance','manual_import','other'
  )),
  note TEXT NOT NULL DEFAULT '',
  evidence_ref TEXT NOT NULL DEFAULT '',
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(workspace_id,request_id)
);
CREATE INDEX IF NOT EXISTS idx_cf_acq_exposure_period
  ON cf_acq_exposure_rollups(workspace_id,exposure_day,campaign_id,source_family,source_key);

PRAGMA optimize;
