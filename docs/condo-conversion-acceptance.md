# Condo Conversion Experience 1.0 — acceptance and release decision

Mandate: 408FARMERS-CONDO-CONVERSION-1.0. October 24, 2026 (America/Los_Angeles).

**Website: CONDITIONALLY READY for controlled release review. Paid Meta traffic: BLOCKED pending the existing operational, device and agency gates.** No production merge/deployment, customer contact, CRM test record, appointment, new service or ad change was performed.

## Reconciliation and minimum change

- CoverageFit baseline/main: `026fcec24a4e5072149816de71be04383f15d595`, including released Start a New Review.
- Acquisition baseline/main: `3df7dc3002675847aeb1bdb0f10101c4081d89d5`.
- Acquisition candidate: [PR 7](https://github.com/dhays4sports/408finneas/pull/7), `f69abbf3bf7809bd0cc5f29128ad82cda561f9f1`.
- Backend candidate: accompanying CoverageFit feature/condo-conversion PR. Its commit tree contains this report and exact test logs.

Live read-only inspection confirmed the plain generic condo shell and the /condo/legacy.html navigation. That legacy route remains active and is an older acquisition/callback intake, not an appointment-management interface. It is preserved. The new presentation points help to /contact/ and explains seven-day resume and original appointment confirmation links.

The buyer and professional shell is reused. Only condo gets the agency-primary header, official Farmers logo and authentic approved headshot, condo hero, vertical tap-friendly choices and compact spacing. Recognition copy is omitted because current authorization was not independently established. No policy-form, coverage, savings or acceptance guarantees are introduced. No broader visual redesign occurred.

## Runtime and supporting files

Acquisition:
- `server/condo-presentation.mjs`: condo-specific decoration of the existing buyer shell, retaining canonical question payload.
- `shared/condo-entry.css`: scoped branding, spacing, choices and saved-review notice.
- `server/entry-presentation-proxy.mjs`: invoke condo decoration and allow existing same-origin logo/CSS assets. Upstream routing, preview isolation and attribution allowlist unchanged.
- `tests/condo-presentation.test.mjs`: payload preservation, brand/nav, CSP and attribution checks.

CoverageFit:
- `server/condo-journey.mjs`: versioned question library, adaptive decisions, workflow facts, summary and qualification predicate.
- `server/distribution-journey.mjs`: new-session initialization, persist/rebuild condo answers on Back, reuse submission/reconciliation, include producer context and first-party event; expose only active audience label for cross-audience clarity.
- `assets/js/entry-client.js`: reuse ZIP/contact inputs, optional contact time and urgent call option; explain a different active audience without changing its answers or identity.
- `server/entry-presentation.mjs`: add `condo=CONDO-1.0` cache marker, retaining BUYER-1.0 and NEW-REVIEW-1.0.
- `server/solo-desk-sync.mjs`: retain full condo summary and existing source context; use condo next-action text in the existing task contract.
- `assets/js/work-web-evidence.mjs`: display persisted condo facts in existing producer evidence.
- `tests/condo-conversion.test.mjs`; updated `tests/distribution-journey.test.mjs` and `tests/new-review.test.mjs` for the deliberate fresh-condo question change.
- `qa/condo/`: synthetic-only reproduction fixture and baseline HTML. `docs/condo-evidence/`: screenshots, logs and sanitized producer receipt.

No database migration, dependency addition, session service, external provider adapter or new consent authority.

## Decision flow

| Visitor situation | Questions after condo intent | Convergence |
|---|---|---|
| Buying | Closing window (skip known exact date), ZIP, intended use; identified-property question for nonurgent known windows | Personal review request |
| Existing owner / renewal | Renewal window, ZIP, use, premium/coverage/both | Personal review request |
| Cancellation / non-renewal | Notice type, estimated ending window, ZIP, use | Urgent call option where appropriate; personal review |
| Coverage / HOA | Main concern, ZIP, use; no documents required | Personal review request |
| Exploring | Intended use including undecided/unknown | Optional personal review; no timing or address demand |

Typically 2–5 answers including the opening question. After the first answer, Ask Dylan to follow up can bypass remaining qualification. Each branch uses the same explicit call/text permission → durable journey contact → existing lead write → WEB / DIRECT producer projection. Only successful projection yields delivery confirmation. Failures remain pending and recover through retry or Producer Refresh reconciliation.

## Actual data contract

| Concept | Stored representation |
|---|---|
| Version / independent identity | Existing pvx_web_journey, journeyId, private cookie; new `condoFlowVersion: 1` |
| Reason | `condo.reason`: purchase, renewal, notice, coverage, exploring; mapped canonical reviewReason/shoppingIntent where meaningful |
| Product | Canonical product home and propertyType condo after explicit condo intent; no HO-6/HO-3 recommendation |
| Timing | `condo.timingWindow`; known canonical closingDate retained; canonical decisionTiming when reported |
| Notice | `condo.noticeType`: cancellation, nonrenewal, unsure |
| Location | `condo.propertyZip`: validated existing CA ZIP range or unknown; no full address |
| Use | `condo.propertyUse`: primary, rental, second_home, undecided, unknown |
| Other facts | `condo.concern`, `condo.identifiedProperty` when relevant |
| Evidence | Existing answers[] with questionId, optionCode, source, occurredAt, signals and condo answer fragment |
| Priority | Derived urgency + nextAction in `context.distribution.condo`; exact dates remain distinct from estimates |
| Producer summary | `context.condoSummary`, retained in cf_solo_sources; structured facts shown by work-web-evidence |
| Contact | Existing name/phone/mode/contactTime; explicit distribution-contact-v1 consent, selected-channel agencyContact permission; automated marketing SMS remains false |
| Attribution | Existing firstTouch, distribution attribution, campaign/creative/UTMs, WEB / DIRECT source `web_408_condo` |

Urgency: within seven days urgent; within fourteen or thirty near_term; 31–60 upcoming; over sixty longer_term. Research/no established coverage-review date is exploratory. Unknown notice ending requires confirmation; unknown renewal date is unknown, not silently classified as research. Past exact closing date requires confirmation. These are workflow labels only.

Internally qualified event `condo_qualified_request_accepted` requires delivered consented contact, a non-exploratory stated reason, a known validated ZIP and primary/rental/second-home use. It does **not** establish underwriting eligibility, an appointment, a quote or a bound policy. Early shoppers can still request contact without qualifying. Existing event keys deduplicate by bootstrap/type; retries, reload and reconciliation do not create duplicate conversion events. The event contains acquisition metadata, never contact details or property answers. This is first-party measurement, **not Meta-verified conversion tracking**. Quote/policy/premium outcomes are not inferred from intake.

## Producer evidence

[Sanitized isolated receipt](condo-evidence/producer-receipt.json) comes from a browser-submitted synthetic renewal request. It retains ZIP 95128, primary residence, estimated renewal 15–30 days, premium and coverage concern, afternoon call preference, explicit call-only permission and original campaign. Appointment is null. CRM state is pending, not delivered to AgencyZoom.

Automated tests load the actual producerWorkspace detail through soloRepository, assert WEB_DIRECT population, full condo facts and attribution, permission, one opportunity and a corresponding task with the suggested next action. Existing producer UI renders the summary and structured evidence. The browser exercised intake and inspected the synthetic receipt; it did not authenticate to the live producer UI. No production producer delivery or AgencyZoom synchronization is claimed.

## Acceptance results

Commands: CoverageFit `node --test tests/*.test.mjs`; targeted `node --test tests/condo-conversion.test.mjs tests/new-review.test.mjs`; acquisition `node --test tests/*.test.*`.

- Targeted: **27/27** (14 condo + 13 existing restart tests).
- Backend: **374/375**, sole inherited `agencyzoom-raw.test.mjs:13` expectation `/48 hours/` versus `READY — outside 7 days; import outside NEW_LEAD pilot`. No AgencyZoom logic changed.
- Acquisition: **70/70**.
- Both diffs pass whitespace validation.

| Scenario | Evidence / result |
|---|---|
| A renewal owner | Automated + browser end-to-end consented callback and producer receipt pass |
| B urgent purchase | Automated persistence/projection; browser urgency call alternative and Back pass |
| C notice | Cancellation and non-renewal automated paths, timing/urgency/producer facts pass |
| D rental | Automated rental review and cancellation cases retain use, no policy-form assumptions |
| E HOA | Automated concern reaches producer; no document upload required |
| F exploring | Automated two-answer path, no mandatory ZIP/date, no qualified event |
| G cross audience | Automated old record preservation and new attribution; browser completed buyer → condo restart, unfinished-review notice, stale-tab recovery pass |
| H failures | Automated lead-write/projection failures retained, reconciliation and repeated/concurrent retries deduplicate; browser pending buyer → condo preserves retry and blocks restart until delivery |
| I attribution | First-party campaign retained and qualified event deduplicated; no PII/ZIP in event payload |
| J regression | Full suites plus local browser first-question checks buyer/tech/healthcare/engineers/teachers/home; new-review suite remains passing |

Responsive browser tests used 320/390/768/1280px iframe widths. No horizontal overflow; minimum touch target 52px. At 390px the first question starts about 331px from the page top; at a 320px frame it starts about 383px (305px usable content width after browser scrollbar). Native controls have labels, correct ZIP inputmode/tel type, focus moves to question/confirmation, and existing focus-visible styles are reused. Same-browser reload restored saved progress. These are Chromium checks, not iPhone Facebook/Instagram acceptance.

### Before / after

| View | Before | Candidate |
|---|---|---|
| Mobile | [Baseline](condo-evidence/condo-before-mobile.jpg) | [Condo candidate](condo-evidence/condo-after-mobile.jpg) |
| Desktop | [Baseline](condo-evidence/condo-before-desktop.jpg) | [Condo candidate](condo-evidence/condo-after-desktop.jpg) |

Additional [urgent](condo-evidence/condo-urgent.jpg), [pending cross-audience](condo-evidence/condo-pending-cross-audience.jpg), [unfinished cross-audience](condo-evidence/condo-unfinished-cross-audience.jpg) evidence. Baseline images render the exact production source without JavaScript in the isolated harness; live legacy/current pages were separately inspected read-only.

## Isolation and reproduction limits

Browser tests used actual paired acquisition proxy + CoverageFit handlers and migrations against in-memory SQLite through the D1 adapter. Empty provider environment; synthetic-only records. Local HTTP removes Secure from response cookies and rewrites assets/removes CSP for iframe testing; production security settings are unchanged. This is **not hosted Cloudflare D1 acceptance**. Existing Cloudflare Preview isolation remains unverified/fail-closed; no hosted submissions were attempted.

With sibling repository checkouts at these paired heads and Node supporting node:sqlite, run `node qa/condo/server.mjs`. Open local port 4173 `/qa-fresh?width=390`; `/qa-completed?route=buyer&width=390&pending=1` seeds a synthetic pending prior review. `/qa-receipt` inspects synthetic projections. The helper clears only the disposable local test cookie to model independent visitors; the production client never clears cookies. No data is deleted by restart. Never deploy/expose the QA server or supply provider credentials. Before images use bundled baseline-condo.html.

## Sessions and limitations

- Existing condo sessions without condoFlowVersion retain their old questions; no in-place reinterpretation.
- Existing buyerFlowVersion 1 and other audiences remain supported.
- Same-browser resume remains seven days. New-review rotation keeps original records and creates an independent capability and journey.
- On a different audience page, a clear notice identifies the active saved review. Its answers, attribution and contact remain attached to it.
- **Unfinished reviews cannot be abandoned/switched in this release.** Continue or request assistance; after delivery, explicitly start the current audience's review. This is a bounded compatibility limitation, not an account/review-management feature.
- Pending consented requests keep retry, producer reconciliation and restart blocking. No pending record is silently discarded.
- Stale tabs must reload; existing capability/view-version and idempotency protections remain intact.

## Controlled release and rollback

No merge/deployment authority is granted by this mandate. After separate approval:
1. Reconcile both heads/main and evidence. Release CoverageFit first through the existing GitHub/Cloudflare integration. Confirm CONDO-1.0 client and compatible APIs. There are no migrations.
2. Release acquisition PR 7. Verify /condo agency branding and new first question with a clean eligible session; verify existing-session notice, non-contact progression/Back/resume and other routes. Do not create production contacts without separate authorization.
3. Obtain genuine iPhone Safari/Facebook/Instagram checks: open link, first question, advance, Back, reload/resume, usable controls and no overflow. Completed/pending tests require an isolated synthetic environment or separately authorized existing session.
4. Preserve existing producer-handoff operational acceptance and Farmers agency advertising review as paid-launch gates. Do not install Meta Pixel/CAPI or change ad spend.

Preferred rollback: revert acquisition decoration only; keep backend decoder, submission/projection/reconciliation and new-review safeguards. **Do not fully revert CoverageFit to a version that cannot read condoFlowVersion 1.** If stopping new condo initialization is necessary, use a narrow compatibility patch that restores generic initialization/presentation for *new* journeys while retaining condoDecision/answer handlers and delivery support for existing records. Keep this compatibility through seven-day active sessions and for the full consented-request retention/reconciliation lifetime. Never delete/transform journeys, consent, firstTouch, aliases, producer records or migrations. Frontend rollback does not remove saved context.

## Decision and next owner action

**Website: CONDITIONALLY READY for a narrow coordinated production-release approval.** Local paired acceptance passes subject to the documented inherited assertion, unfinished-review switching limitation and hosted/mobile limits.

**Paid Meta campaign: BLOCKED at this stage.** The candidate is not released; actual production condo producer receipt, genuine iPhone in-app behavior and final agency creative/page approval are unverified. AgencyZoom automation is not a mandatory gate if the existing producer workspace is operationally verified. Internal qualified-request events do not imply Meta conversion integration.

Next owner action: review the paired PRs and authorize CoverageFit-first controlled release if these explicit limitations are acceptable. No new infrastructure or design expansion is needed to perform that release.
