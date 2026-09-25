# Producer Workspace 2.0 — release evidence

## Scope and source baseline

CoverageFit production baseline: 1fc2fe436e96466ba1aa0f404381c752ee1632eb.
Pilot 1.2 candidate: 0283ef1f69bc4b11349b6151ce86db7fb1379fec.
408FARMERS: 78660e8b5614ba4252af3ba55f35a543ccae21a1; unchanged by this work.

This release extends the pilot candidate. It does not activate customer-facing SMS or certify the district experiment. Cloudflare remains manual. No migrations, cohort changes, scoring-weight changes or destructive data operations.

## Implemented

- Work / Import / Analytics / Tools; Work → SIGNAL default, with explicit population counts and global search.
- Durable producer_population_v2 projection in existing cf_solo_sources. Membership uses immutable NEW_LEAD enrollment or explicit first-party source evidence; no score/stage/SMS-based population inference.
- Protected producer-work and producer-detail aggregation endpoints reuse existing priority/FIV/NBA, source, effort and SMS stores.
- Exact conversation linkage for embedded edit/approve, same canonical /api/sms/signal handler, provider gateway, revision, suppression, CONTROL and duplicate safeguards.
- CONTROL has no actionable draft, priority, FIV or NBA; compliance suppression may still be shown.
- WEB / DIRECT and OTHER omit pilot forms and remain outside pilot reporting. Normal work wrap uses the existing validated wrap endpoint.
- Active Decision 2 precedes overall priority. Explicit CALL outranks numeric priority. Future/closed work does not jump above active inbound work merely because a manual review lock exists.
- Same-detail time/outcomes, known evidence provenance and manual AgencyZoom acknowledgement.
- Historical workspace preserved as legacy.html; original query links route to it. Active consultation/recommendation/customer paths retained.
- Import separated from scorecard; analytics lazy, diagnostics specialist-only.

## Local evidence

168 tests passed, 0 failed, 0 skipped before hosted verification. Nine new tests cover explicit population classification, durable persistence, counts, global search, detail isolation, attention precedence, escaped and suppressed presentation, authenticated API, exact linked opportunity, editing without send, stale revision rejection, one approved send maximum and manual AZ acknowledgement. Existing RAW, effort/outcome, SMS safety and measurement suites remain passing.

403 JavaScript/module files passed syntax validation. HTML checks found no duplicate IDs or missing referenced assets in either workspace shell. Local browser preview was blocked by the browser client; this is not evidence of a site failure. Hosted verification must be recorded below after deployment. No local test is labeled a live provider canary.

## Release limitations / gates

- Live provider approval canary requires enabled production Signal, an internal/user-controlled number and explicit approval for the exact message. No customer SMS is authorized by this UI work.
- No enrolled production pilot records were visible in the pre-release scorecard. Hosted empty-state/navigation checks do not prove live SIGNAL/CONTROL record flows.
- Batch outcome/effort reconciliation and a measured 30–60-second burden trial remain unresolved district-pilot P0 gates. No GO claim.
- Existing complex policy documents/recommendations and historical consultation flows still use contextual specialist views; they were preserved, not rebuilt.
- Population view bounded to 5,000 saved opportunities; it fails explicitly above the limit instead of showing inaccurate counts.
- No live narrow-device claim until observed. CSS supplies the narrow layout; no claim of measured human time savings.
- Legacy usage beyond source references remains unknown; none was deleted as supposedly obsolete.

## Rollback

Retain the pre-workspace production main reference created for this release and the older pre-signal-production-20260924 reference. Restore the historical shell as workspace/index.html for a presentation-only rollback, or revert the workspace commit. Never reset production data or force main. SMS activation remains a separate manual flag decision.

## Hosted evidence

Pending at initial commit. See final handoff / subsequent verification entry for actual deployment observation. No Cloudflare setting has been changed by the assistant.
