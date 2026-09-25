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

169 tests passed, 0 failed, 0 skipped before hosted verification. Ten new tests cover explicit population classification, durable persistence, counts, global search, detail isolation, attention precedence, escaped and suppressed presentation, authenticated API, exact linked opportunity, editing without send, stale revision rejection, one approved send maximum and manual AZ acknowledgement. A hosted catch added regression coverage for rendering existing ISO due dates in normal web work wrap. Existing RAW, effort/outcome, SMS safety and measurement suites remain passing.

403 JavaScript/module files passed syntax validation. HTML checks found no duplicate IDs or missing referenced assets in either workspace shell. Local browser preview was blocked by the browser client; this is not evidence of a site failure. Hosted verification is recorded below. No local test is labeled a live provider canary.

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

Initial workspace publication: 6581f60ea317519bf1a3e1c331f1e0511570caa8. GitHub main was safely advanced from 1fc2fe4 after rollback creation. The hosted UI was observed on 2026-09-25 at https://coveragefit.com/agent/workspace/?area=work. Cloudflare's deployment SHA was not independently exposed; the new rendered code was observed. No Cloudflare setting was changed.

Observed with an existing authenticated producer connection:
- Work / Import / Analytics / Tools loads; default daily work has no analytics tables, diagnostic panels or setup forms.
- Population counts: SIGNAL 0, CONTROL 0, WEB / DIRECT 4, OTHER 2. These are existing production records, not synthetic enrollments created by this release.
- Import renders the multi-file selection/preview flow; actual import was not performed during this UI check.
- Analytics returns 0 enrolled in both cohorts despite six non-pilot work records; effort remains Not measured, not fabricated zero.
- Tools contains the retained specialist/connection paths.
- Opening an existing WEB / DIRECT record exposed an ISO-date rendering defect in its normal work form. Corrected the Date conversion and added a regression test; production recheck passed: saved due date populated, Save work rendered, and no page error remained. No work update was submitted.
- Removed the old import footer directing daily work to SMS Operations. Population switches now discard the previous detail only after the unsaved-change guard and clear its URL identity.

No customer messages or customer outcome edits were made. The hosted empty district lists cannot certify a live enrolled SIGNAL/CONTROL journey.

## Readiness matrix

| Requirement | Status | Evidence / limit |
|---|---|---|
| Canonical navigation / clutter reduction | PASS WITH LIMITATION | Four primary areas observed; timed effort reduction not measured |
| SIGNAL membership | PASS WITH LIMITATION | Source-backed classification and exact linkage tested; live list empty |
| CONTROL isolation | PASS WITH LIMITATION | Backend and presentation tests; live list empty |
| WEB / DIRECT | PASS WITH LIMITATION | Four live records and zero pilot enrollment observed; corrected detail/work form observed |
| OTHER | PASS WITH LIMITATION | Two live records counted; explicit classification tested |
| Embedded Decision 2 / suggested reply | PASS WITH LIMITATION | Canonical engine and panel tested; no live enrolled record |
| Approve/send safety | BLOCKED for live certification | Edit/no-send, revision, suppression, duplicate, CONTROL guards tested; internal approved provider canary outstanding |
| Manual AZ recommendation / acknowledgement | PASS WITH LIMITATION | Canonical action tested; no AZ API or automatic stage writes |
| Same-detail effort/outcome capture | PASS WITH LIMITATION | Existing validation/atomic saves tested; batch reconciliation and timed burden gate remain |
| Analytics / Tools separation | PASS | Hosted navigation and pilot report observed |
| Legacy / deep links | PASS WITH LIMITATION | Original shell and dependencies retained; source/asset checks plus hosted old inbox URL redirect/return link; full historical advisory journeys not replayed |
| Cloudflare | PASS boundary | No changes; migration 0019 remains user-verified, not rerun |
| District launch | BLOCKED | Provider canary, batch reconciliation and measured administrative burden remain P0 |

## Production rollback references

CoverageFit pre-workspace-production-20260925 → 1fc2fe436e96466ba1aa0f404381c752ee1632eb.
CoverageFit pre-signal-production-20260924 → 961d242a2fbdfc27f634a9836e66dfb3f2c60ef1.
408FARMERS pre-signal-production-20260924 → fd4c6849a871649dd9840ff61eaa5a9407a515d0.
All retained. No force push, branch deletion, schema migration or data reset.


## Final hosted follow-up

Code fix publication: 4980eebf6d7a44e7ee80271c5d2be2c39f57a89c. Production served producer-workspace.mjs?v=2.0.1. Verified WEB / DIRECT form, valid saved Pacific due time and Save work; no render error. Switching to CONTROL removed the old detail and opportunity_id; Import links Work → SIGNAL. Old /agent/workspace/?view=inbox reached the retained historical inbox with Return to Work. SMS Operations explicitly reported: “Preview only: live signal processing is not enabled.” SMS Signal remains OFF.

No new Cloudflare checkpoint is needed for this UI release. Keep the current SMS flag unchanged until pilot gates and an authorized internal provider canary are ready. Do not rerun user-verified migration 0019.

Workspace release: **PASS WITH LIMITATION**. District pilot: **BLOCKED / NO-GO** pending batch reconciliation, measured incremental administration, and internal review-first provider certification. Neither a narrow-device browser run nor a human time trial was performed. Existing live records were read, not edited. No SMS was sent.

Next bounded engineering task: finish the authoritative batch outcome/effort reconciliation from the manual-work audit so silent/unqualified inventory requires no per-lead pilot visit; then run the timed CONTROL/SIGNAL rehearsal. Preserve unknown values and cohort isolation. Do not compensate with a second tracking spreadsheet.

## Changed-file groups

Primary shell: agent/workspace/index.html; agent/workspace/legacy.html; assets/css/producer-workspace.css.
Frontend: producer-workspace.mjs; producer-sms.mjs; producer-work-wrap.mjs; legacy-workspace-navigation.js; district-pilot.mjs; agencyzoom-import.mjs under assets/js.
Backend: producer-workspace.mjs; solo-desk-api.mjs; sms-signal-api.mjs; agencyzoom-import.mjs; district-pilot.mjs under server.
Tests: tests/producer-workspace.test.mjs.
Documentation: this readiness matrix, PRODUCER-SURFACE-INVENTORY-2.0.md, PRODUCER-WORKSPACE-2.0-GUIDE.md and updated historical framing in SIGNAL-PILOT-MANUAL-WORK-AUDIT.md.
