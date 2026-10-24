# Start a New Review — acceptance and release notes

Mandate: 408FARMERS-NEW-REVIEW-1.0. Tested October 24, 2026. No production deployment, production contact submission, CRM record, message or appointment was created for this change.

## Baseline and scope

CoverageFit main: `7e77b58fcb2e22f6ac2f5b57851d63e1e2c1f289`; acquisition main: `3df7dc3002675847aeb1bdb0f10101c4081d89d5` (tree equivalent to reviewed head `96ded94b0ca31278ca5e43f2fe8372aa7ab29b68`). Only CoverageFit requires a PR. The existing acquisition proxy already forwards the operation and Set-Cookie, and accepts the retained BUYER-1.0 client marker.

Runtime files:
- `server/distribution-journey.mjs`: shared creation helper; explicit new_review operation; atomic idempotent rotation; stale-view protection.
- `assets/js/entry-client.js`: completion action, pending delivery explanation, reload recovery for stale tabs, fresh initial-question rendering.
- `server/entry-presentation.mjs`: cache version `BUYER-1.0&review=NEW-REVIEW-1.0`.

Supporting files: `tests/new-review.test.mjs`, `qa/new-review/server.mjs`, this report and `docs/new-review-evidence/`.

## Behavior and preservation

An explicitly selected Start a New Review action requires the active private cookie, same-origin validation, existing rate limiting, a matching non-authorizing view version, and a successfully delivered previous contact request. The server validates the current landing-page handoff and uses the existing random capability and journey formats. An atomic D1 batch creates one new journey and one idempotency alias per predecessor. Only the HttpOnly, Secure, SameSite=Lax cookie carries the browser capability. No token or private record identifier is put in a URL or analytics event.

A fresh seven-day journey starts at the current audience's first question. Its attribution comes from the current landing-page handoff, not the previous review. Old answers, contact details, permission, first-touch attribution, producer lead and opportunity remain unchanged. Reload resumes the new journey. No producer opportunity is created until the new journey's own explicit consented submission.

Repeated requests using the predecessor cookie return the same new journey. Concurrent tabs cannot create multiple successors. A stale tab whose cookie has rotated receives an understandable Reload current review action; it cannot write answers/contact to the new journey. Legacy unrotated sessions remain compatible with existing clients. Rotated sessions require the view version on mutations.

Pending delivery deliberately does **not** offer restart: Retry delivery remains prominent and the explanation states that a new review becomes available after delivery. Existing producer reconciliation remains available. This avoids abandoning or hiding an unresolved consented request. Success copy is reused unchanged; no appointment is represented as scheduled.

## Automated acceptance

Commands from CoverageFit: `node --test tests/new-review.test.mjs` and `node --test tests/*.test.mjs`. Acquisition: existing full Node test suite. Raw output is in the evidence directory.

| Check | Result |
|---|---|
| New-review tests | 13/13 pass |
| Full CoverageFit suite | 360/361 pass |
| Existing acquisition suite | 68/68 pass |
| Whitespace validation | git diff --check passes |

The sole backend failure remains the inherited `tests/agencyzoom-raw.test.mjs:13` assertion expecting `/48 hours/` against `READY — outside 7 days; import outside NEW_LEAD pilot`. No AgencyZoom business logic was changed.

| Mandate scenario | Evidence/result |
|---|---|
| A completed buyer | Automated fresh ID/cookie and unchanged previous JSON; browser completion → first buyer question passes |
| B refresh/resume | Automated two saved answers and reload; browser reload restores ZIP after urgency selection |
| C preservation | Previous journey, lead and opportunity retained; independent later consent creates separate opportunity |
| D duplicate/retry | Concurrent predecessor retries share one successor; repeat contact creates no duplicate opportunity; transaction failure rolls back then retry succeeds |
| E two tabs | Automated stale mutations rejected; browser stale Start shows reload recovery, reload opens current new journey |
| F audiences | Automated and browser buyer, tech, healthcare, engineers, teachers, home, condo pass; buyer_need / signal_product / home_trigger as appropriate |
| G pending delivery | Automated pending rotation blocked and reconciliation recovery; browser retry retained, restart absent until retry succeeds |
| H regression | Full suites above; all seven routes exercised in local browser; seven-day retention and buyerFlowVersion 1 preserved |

## Browser evidence and limits

Real browser interaction used a local isolated harness with the actual acquisition proxy, CoverageFit handlers, current migrations and in-memory SQLite D1 adapter. Empty provider environment; synthetic data only. It is **not** Cloudflare hosted D1 acceptance, production verification, or an iPhone Meta in-app test. For local HTTP, the harness removes Secure from cookies and rewrites assets/removes CSP; deployed cookie/CSP code is unchanged. Production cookie/CSP behavior is covered by existing contracts, not claimed as newly hosted-tested here.

At 320, 390 and 1280 CSS px, content width matched the viewport without horizontal overflow. Restart button height was approximately 52.8px. Keyboard focus moves to the next question/notice. Buyer answers, Back/reload and pending retry were exercised; all six other audiences restarted at their own first question.

Screenshots: [completed](new-review-evidence/completed.jpg), [new review](new-review-evidence/new-review.jpg), [pending delivery](new-review-evidence/pending.jpg), [desktop](new-review-evidence/desktop.jpg).

Reproduce locally with sibling `CoverageFit` and `408finneas` checkouts at the above versions and Node supporting `node:sqlite`: `node qa/new-review/server.mjs`. The harness listens on port 4173. Open `/qa-completed?route=buyer&width=390` to create an isolated synthetic completed review; add `&pending=1` for pending delivery. Supported route values are the seven listed above. `/qa-receipt` contains only this disposable process's synthetic records. Do not deploy/expose this fixture server. Restarting it discards fixture data. No customer/provider credentials should be supplied.

## Release and rollback

Disposition: ready for review and controlled-release approval; **not merged or deployed**. No acquisition release or database migration is necessary. Keep Meta advertising gates unchanged.

After separate approval, recheck main/head changes and tests, merge CoverageFit through the established Cloudflare workflow, and verify the deployed script includes both version markers. Perform non-contact smoke checks for all audiences. A real-device completed-state check needs a suitable already authorized session; do not create production submissions as part of this mandate.

Preferred immediate rollback is UI-only: remove the Start action and revert its client cache version while retaining server rotation/stale-tab protections for active new sessions. If a full runtime revert is needed, the base runtime recognizes the same canonical_signal records and buyerFlowVersion 1; old clients can still resume ordinary journeys, but new_review is unavailable and stale-tab protection is lost. Reload active tabs. Do not delete aliases, journeys, consent, producer records, or change retention. No destructive migration or data rollback is required. Keep server compatibility for at least the existing seven-day session window before retiring guards.

Remaining external checks: iPhone Safari and Facebook/Instagram browser tap → restart → answer → Back → reload/resume using an isolated synthetic fixture or separately authorized session. Existing agency advertising review, producer operational acceptance and Meta launch gates remain separate and are not passed by this UX change.
