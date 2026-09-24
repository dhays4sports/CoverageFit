# Signal production cutover — checkpoint A

Cloudflare configuration is exclusively manual. No Cloudflare configuration, database or deployment settings were changed by the agent.

## Verified Git state

- CoverageFit previous main: `961d242a2fbdfc27f634a9836e66dfb3f2c60ef1`.
- CoverageFit certified integration: `ff217df2c0c71ec6bdf13e8e1dcc9c2e175a0595`, 69 commits ahead / zero behind. Contains current production recovery fixes by ancestry.
- CoverageFit main fast-forwarded to that integration SHA. This report is a subsequent documentation-only commit.
- 408FARMERS main: `fd4c6849a871649dd9840ff61eaa5a9407a515d0`, unchanged.
- 408FARMERS candidate: `cd015fc52890830a991ab304681ab8816b2d0a09`, 53 commits ahead / zero behind after full-history fetch. The historical 1.4.2 production-handoff changes remain in the candidate.
- Both repositories have immutable rollback branch `pre-signal-production-20260924` at their respective pre-cutover main SHAs above.

## Certification performed

`node --test tests/*.test.mjs`: 133 entries passed, zero failed/skipped.
Syntax: 191 JS/MJS/CJS files in server, functions and tests checked; zero failures.
`wrangler@3.114.17 pages functions build`: compiled successfully locally, without account mutation.
Source and tests cover deterministic compliance, seven templates including both fresh messages, five Decision 2 actions, context/memory, three-question depth, takeover, duplicate handling, approval-only send, manual AZ sync, anonymous PII/origin restrictions, no public score, and durable consent-aware Home handoff.
The standalone Playwright UI script was not rerun; production public UI was observed in the browser. Authenticated UI and provider-send certification are pending.

## Observed production state

CoverageFit homepage, SMS simulator, and SMS operations load. SMS pages show Decision Queue, CALL NOW and Future Bind controls behind producer authentication. Solo Desk is embedded at `/agent/workspace/`, not `/agent/solo-desk/` (the latter is a 404 and was incorrectly documented earlier).
GitHub returned no deployment status checks or deployed SHA. New production UI is observed, but exact deployed SHA is not externally attested.
Direct shell HTTP probes returned 403 in this environment; browser page checks succeeded. Do not characterize this as a production outage.

## Manual checkpoint A — CoverageFit production

1. Confirm main deployment succeeded; report its displayed commit SHA.
2. Confirm `COVERAGEFIT_DB` points to the existing production database. Verify `api_rate_limits`, `pvx_records`, and `cf_solo_opportunities` exist.
3. Check migration 0019 objects; if absent, execute the exact additive `migrations/0019_cf_opportunity_priority.sql` against that same database. Return object names, not records or secrets.
4. Preserve existing `COVERAGEFIT_PRODUCER_ACCESS_TOKEN` (minimum 24 characters).
5. `CF_SIGNAL_ALLOWED_ORIGINS`: unset uses exactly the two built-in 408 production origins. If configured, set `https://408farmers.com,https://www.408farmers.com`, removing obsolete preview additions. Leave `CF_SIGNAL_ALLOW_LOCALHOST` unset/false.
6. Preserve/provision `COVERAGEFIT_LEAD_SYNC_SECRET` (minimum 32 characters). Retain its value securely for the matching 408 production secret at checkpoint B.
7. Explicitly set `CF_SMS_SIGNAL_ENABLED=0` and keep `SIGNAL_HOME_HANDOFF_ENABLED=0` until the matching 408 secret and endpoint are configured. Feature activation follows successful production canaries.
8. Redeploy main after setting variables/bindings. No 408 main merge or public route activation yet.

No manual settings have been confirmed by Dylan at this checkpoint. Actual feature flag values are unknown; source defaults are off. No production contact submission, SMS, AgencyZoom write, or calendar action was performed.

Next: after operator confirmation, perform production decision and authenticated workspace canaries. Then certify and merge 408, switch its remote endpoint/CSP to production, and proceed to checkpoint B.
