# SIGNAL-SMS-OWNERSHIP-HARDENING-1.0

2026-09-25 Pacific. Bounded protection of shared-number SMS ownership.

## Root cause and correction

Source tracing reproduced the reported failure; the original customer's production event was not fetched or replayed.

`server/sms-conversation-core.mjs` defines `SMS_AUTOMATION_INTRO` with the exact “Thanks for texting 408-FARMERS. This is the automated intake for Dylan at the Virginia Tam Insurance Agency. Dylan will personally review your information.” text. Its Home intake adds the own/rent question.

The live webhook in `server/ringcentral-sms-connection-core.mjs` previously called `signalInbound` before legacy intake. However, both Signal inbound interpretation and outbound template observation returned immediately when `CF_SMS_SIGNAL_ENABLED` was off. `resolveSmsInboundRoute` then accepted a standalone HOME keyword (or recognized intent) as permission to enter CoverageFit intake. Positive acquisition/workflow ownership was not required. If prior outbound had not been observed, the legacy path also had no template/history check. The shared destination number and a line answer therefore acted as an unintended intake entry.

The new gate runs after deterministic consent handling and before Signal, callback, aged-response, or guided-intake routing. It works with Signal OFF. No unknown-source message may acquire sales automation solely by stating HOME/AUTO or arriving at the shared number.

## Canonical resolver and precedence

`server/sms-ownership.mjs` resolves relationship ownership independently of score, stage, consent, population and feature activation.

| Priority | Evidence | Result |
|---|---|---|
| 1 | STOP, existing suppression, wrong number, spam, autoresponder | Safety hold; no sales continuation |
| 2 | Existing explicit producer pause/takeover or human-active state | PRODUCER_OWNED |
| 3 | Exact linked CONTROL enrollment / existing exclusion roster | DISTRICT_CONTROL |
| 4 | Exact linked canonical SIGNAL NEW_LEAD enrollment | DISTRICT_SIGNAL |
| 5 | Registered AgencyZoom template in prior outbound context | UNKNOWN + agencyzoom_pending_enrollment |
| 6 | Server-written first-party outbound registration or explicit producer-started CoverageFit workflow | FIRST_PARTY_408 |
| 7 | No positive evidence, ambiguous templates, failed enrollment/context lookup | UNKNOWN; manual handling |

Existing TEST enrollment is supported only for internal transport certification and remains outside NEW_LEAD pilot denominators. No new assignment mode was added. Existing producer precedence remains authoritative after late enrollment. An explicit producer return/resume releases stale human-active flags without restoring an old draft or changing suppression/enrollment.

Registry matching is shared, not duplicated. `sms-template-registry.mjs` contains the existing saved/default registry loader moved from Signal service. `matchingTemplates` exposes the same normalized candidates to detect ambiguity. AZ-FRESH-01/02, AZ-AGED-P1/P2, AZ-QUOTE-01, AZ-FUTURE-01 and AZ-CALLBACK-01 remain canonical.

Inbound-only delivery can recover bounded RingCentral history when local outbound context is missing. Failure never authorizes intake. AgencyZoom evidence remains sticky across subsequent legacy messages; known system-generated guided questions are not mistaken for newly observed AgencyZoom outreach. Recognized outbound context is retained even with Signal OFF and without enrollment. No off-flag Signal draft is generated.

## Late enrollment and ZERO-REPEAT

The existing RAW importer already derives immutable cohort from stable lead identity, links the exact conversation and records pre_enrollment_response / late_enrollment. It was not rewritten. Good/bad replies never select cohort.

The pending conversation keeps its transcript and non-sensitive ownership provenance. On a subsequent inbound, enrollment is resolved again. SIGNAL consumes paired historical facts (including the prior Home answer) plus governed RAW; CONTROL receives no Signal guidance or legacy intake. Import does not replay inbound or send a retroactive draft. A producer takeover remains paused until governed release.

## Guided-send path audit

| Runtime path | Prior trigger/fallback | Disposition |
|---|---|---|
| Live webhook → generic HOME/AUTO/intake router | Keyword/intent could claim unknown thread | HARDEN: ownership gate precedes router |
| Homebuyer / Home review / bundle / other guided states | Existing first-party intake | KEEP with positive first-party evidence; inferred legacy state alone is insufficient |
| Registered first-party outbound and producer-started workflow | Server-side workflow registration | KEEP; template/district/safety precedence still checked |
| Aged reply / callback scheduling in live webhook | Reply context or heuristics before generic intake | HARDEN: same ownership gate; no new recovery/cadence work |
| Live outbound observation / recovery | Template detection gated by Signal flag | HARDEN: template hold always active; unknown outbound retains existing producer takeover |
| Signal edit / approval / unlock | Could use stale managed state outside strict pilot mode | HARDEN: current exact SIGNAL ownership required |
| Programmatic gateway and delivery retry | Old snapshot or queued legacy body | HARDEN: current enrollment/ownership checked before provider send; no bypass on retry |
| Producer manual / console response | Authenticated manual action | KEEP; no mandatory enrollment to respond manually |
| Simulator `routeSmsInbound` | Synthetic local engine demonstration | KEEP; no live provider access or ownership assertion |

No active first-party capability was removed. Bare HOME/BUYER/etc. from an unclassified thread now waits for manual handling. The text itself cannot distinguish an AgencyZoom answer from a first-party entry. Older inferred workflows without provenance are held rather than assumed valid.

## Producer experience

Work retains SIGNAL / CONTROL / WEB-DIRECT / OTHER populations. A small **SMS awaiting classification** section lists held conversations without creating opportunities, assigning cohorts or adding pilot denominator records. It shows “AgencyZoom lead — awaiting pilot enrollment” or “Unclassified SMS — manual review,” phone and latest inbound. Use Import for eligible district leads; respond manually in RingCentral while pending. Enrolled relationships leave this pending view on refresh.

The view is authenticated, loaded on demand and bounded to 500 stored threads / 50 displayed pending threads, with truncation disclosed. It is not a complete CRM inbox. The shared number is transport, never source proof.

## Storage and compatibility

No migration. No reapplication of 0019. Ownership lives in existing conversation JSON as `smsOwnership`, with owner, basis, hold, template context and timestamps. Existing transcript, consent, source/RAW contracts, producer populations and cohort assignment remain intact. Existing audit storage records ownership holds without message bodies. The existing per-thread processing lock now also protects ownership when Signal is disabled.

CONTROL cannot enter Signal/legacy even if `CF_SMS_SIGNAL_PILOT_ONLY` is unset. SIGNAL still requires its enabled flag and producer approval. No weights, score bands, action taxonomy, question ceiling, AgencyZoom state or scheduled cadence changed. No 408 repository change.

## Certification and production gates

Full Node suite: **231 passed, 0 failed, 0 skipped** (including 38 new ownership scenarios and one Workspace pending-view test). Existing Signal integration fixtures now explicitly represent enrolled relationships; first-party fixtures carry positive workflow provenance. Existing isolation assertions remain; outbound matching now proves hold/attribution rather than being skipped.

Covered: exact Andrew/Home sequence with enabled flag 0 and 1; all seven templates; provider-history recovery; unknown Home; true first-party Home guided send through fake provider; late SIGNAL and CONTROL; no retroactive send; producer takeover; STOP/wrong-number/spam/autoresponder; suppression persistence; ambiguous templates; failed enrollment lookup; stale snapshot/retry; stale unenrolled draft rejection; historical first-party contamination; pending Workspace visibility.

These are local tests, not live-provider certification. No customer messages or live test sends were made. A–F live canaries remain BLOCKED pending an agreed internal/user-controlled relationship and explicit approval of exact test sends. SIGNAL canary additionally requires Dylan's manual feature activation. First-party canary must have verified workflow ownership. No live canary is claimed from local passing tests.

No Cloudflare changes are required to deploy ownership protection. Keep current flags unchanged for this release. If an internal SIGNAL canary is scheduled: CoverageFit production, variable CF_SMS_SIGNAL_PILOT_ONLY=1 and CF_SMS_SIGNAL_ENABLED=1, applied manually only to the intended internal roster; rollback CF_SMS_SIGNAL_ENABLED=0. No secrets in chat.

## Readiness

| Area | Status |
|---|---|
| Resolver, template hold, UNKNOWN fail-closed | PASS locally |
| Late enrollment, history, cohort preservation | PASS locally |
| CONTROL / SIGNAL isolation | PASS locally |
| First-party guided intake preservation | PASS locally with positive provenance |
| Producer takeover and STOP/compliance | PASS locally |
| Schema / Cloudflare changes | None |
| Live A–F provider canaries | BLOCKED; not run |
| District launch | NO-GO pending live review-first/send certification and measured human admin trial |

Pre-release CoverageFit main: `57b166037bfd34e8f82dc9e12bb9ccfbe68a45e6`. 408 main remains `78660e8b5614ba4252af3ba55f35a543ccae21a1`. Local syntax verification: 418 JavaScript/module/CommonJS files clean. Source publication and hosted observation are separate from live provider certification. Existing rollback refs remain intact; `pre-sms-ownership-20260925-57b1660` preserves this starting SHA.

## Files changed

- `agent/workspace/index.html`
- `assets/js/producer-workspace.mjs`
- `docs/PRODUCER-WORKSPACE-2.0-GUIDE.md`
- `docs/SIGNAL-SMS-OWNERSHIP-HARDENING-1.0.md`
- `server/producer-workspace.mjs`
- `server/ringcentral-sms-connection-core.mjs`
- `server/sms-outbound-gateway.mjs`
- `server/sms-ownership.mjs`
- `server/sms-producer-handoff-core.mjs`
- `server/sms-signal-api.mjs`
- `server/sms-signal-core.mjs`
- `server/sms-signal-service.mjs`
- `server/sms-template-registry.mjs`
- `server/solo-desk-api.mjs`
- `tests/agencyzoom-raw.test.mjs`
- `tests/district-pilot.test.mjs`
- `tests/producer-workspace.test.mjs`
- `tests/sms-ownership.test.mjs`
- `tests/sms-signal.test.mjs`

## Hosted observation

Implementation release `f48a6c68ecb1eea6a183e890d8989a9ab2fb7abc` was fast-forwarded to main, with matching locally tested Git tree. On 2026-09-25 Pacific, production served `/agent/workspace/` with `producer-workspace.mjs?v=OWNERSHIP-1.0`. Existing producer access connected, Work loaded, and the new authenticated pending-SMS section loaded successfully (zero unclassified threads in the reviewed window). No customer transcript was printed or modified.

The production SMS Operations status remained “Preview only: live signal processing is not enabled.” Thus SMS Signal is OFF by observed application status. No Cloudflare configuration was changed; no migration or new secret is required. These hosted checks establish deployed UI/API behavior, not a live webhook/send canary. No Cloudflare deployment SHA was independently available. A small follow-up removes now-unreachable pre-ownership first-party fallback checks, so the canonical resolver remains the single authority and context is not fetched twice.

Next gate: agree an internal/user-controlled recipient and approve the exact outbound/inbound canary texts. Canary A can verify the AgencyZoom hold while Signal stays OFF. Do not enable Signal broadly for this protection release. District pilot GO remains blocked on the separate live provider/review-first gates and the actual producer administrative-burden timing trial.
