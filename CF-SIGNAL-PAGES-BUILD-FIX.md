# CF-SIGNAL Pages build compatibility fix

2026-09-22. The supplied failed-deployment log for 2b15f8bb7d54c292863237b2a8dac6b31bd1d49c shows Wrangler 3.114.17's Pages Functions bundling rejects JSON import attributes (`with {type:'json'}`) in quote-template-api.mjs, recommendation-api.mjs, and solo-desk-repository.mjs. This is a compilation failure before D1 runtime; a database change cannot fix this parse error.

The three modules now import plain ESM server/producer-config.mjs. That file is generated from the unchanged producer.json and parsed with JSON.parse to preserve its exact data semantics. No identity, contact information, producer configuration values, business behavior, score weights, or permissions were changed.

After editing producer.json, run `node scripts/sync-producer-config.mjs`; run `node tests/producer-config.test.mjs` to enforce deep equality and portable imports. No new dependency, build command, runtime fetch, or broad compatibility flag is required.

Validation: Node syntax checks for all three modified consumers PASS; generated configuration parity PASS before and after running the generator; Signal Decision regression suite PASS. The remote Pages rebuild must still confirm compatibility across its complete Functions graph. Cross-preview browser certification and Preview-only D1 setup remain pending; no merge or production rollout authorized.

## Deployment and isolated Preview D1 follow-up — 2026-09-22

Closing-flow's remaining JSON import was fixed at 2b58e1ead97083baa2d364a5a4c16b6dd3b454c2; the regression recursively scans all server modules. Pages deployment succeeds.

Operator screenshots verify Preview (all non-production branches) COVERAGEFIT_DB -> coveragefit-signal-preview, with api_rate_limits(bucket_key TEXT PRIMARY KEY, request_count INTEGER NOT NULL DEFAULT 0, reset_at INTEGER NOT NULL) and idx_api_rate_limits_reset_at. Production binding remains coveragefit-production. Preview contains the exact CF_SIGNAL_ALLOWED_ORIGINS variable.

The deployed Signal API still reports rate_limit_unavailable. Current settings/schema evidence does not prove that the last deployed Functions bundle received the binding. This documentation-only commit triggers a fresh Git-integrated feature preview to distinguish stale deployment configuration from a runtime database failure. No production setting or application logic is changed. Browser gate remains blocked until successful evaluation and the full matrix are verified.
