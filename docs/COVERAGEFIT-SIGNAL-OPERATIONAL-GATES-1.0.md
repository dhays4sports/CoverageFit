# CoverageFit + SIGNAL — Operational Consolidation Certification Gates 1.0

**Date:** 2026-10-12  
**Status:** Review-only execution gate; **not** production or district launch authorization  
**Scope:** Operational consolidation, Producer Action Quality certification, reliable lead-to-follow-up loop, and measured producer leverage  
**Canonical context:** Read `docs/COVERAGEFIT-CURRENT-STATE.md` from the latest `signal-copilot` branch and the existing near-term producer roadmap before implementing. This gate **does not** replace either document.

## One outcome

A producer should open CoverageFit and see a small, justified set of actions: **who needs attention, why now, what to do, and supporting evidence**, without manually reconstructing context across lead sources, AgencyZoom, RingCentral, and Calendar.

The smallest complete operating loop is:

`source intake -> immutable provenance/population -> SIGNAL evidence -> action-quality reconciliation -> producer-approved action -> provider receipt/inbound observation -> durable next commitment -> outcome measurement`

Complete and certify the loop before increasing lead volume, contact autonomy, scope of integrations, or public adoption.

## Audited repository starting point

- CoverageFit `main`: `5f47f2b7367110ca04ff03cc189983f136ab32fa` (2026-09-29). Recheck before integration.
- Draft PR #6: race-safe district promotion and seven-day eligibility preservation.
- Draft PR #7: Signal Reply Copilot, current Producer Action Quality work, read-only Attention development, source-level release documentation. Its more recent code must not be replaced by a historical #8 base.
- Draft PR #8: commitments/Attention/Calendar foundations; stacked on an older PR #7 head and overlaps PR #6. Reconcile deliberately rather than merging branches blindly.
- Draft PR #9: default-off producer email notices for 408FARMERS handoffs; separate validation gate.
- Draft PR #10: separate Windows Desktop Copilot, not on the critical operational path.
- 408FARMERS draft Signal Decision/preview work remains unmerged. Existing landing pages should not be migrated during this phase.
- The repo contains a stale test assertion expecting “48 hours” even though the approved fresh-lead pilot window is **seven days**. This PR repairs the assertion only; it does not change runtime eligibility.

All above are **repository claims**, not assertions that production deploys equal branch heads. Review current Cloudflare / provider state before claiming a live feature.

## Gate 0 — restore trustworthy tests (first deliverable)

- Align the legacy `tests/agencyzoom-raw.test.mjs` age-hold expectation with `outside 7 days`.
- Preserve the existing six-day eligible / eight-day ineligible test and older-inventory safe-hold behavior.
- Run the full repository regression suite on a supported Node version with its documented loader. A previously passing suite on a different branch is **not** current-head evidence.
- Require green checks or document any separately proven infrastructure-only failure before requesting an integration review.
- No runtime behavior or production configuration change is part of Gate 0.

## Gate 1 — certify Producer Action Quality in isolated Preview

Use the existing `server/producer-action-quality.mjs` implementation on the current `signal-copilot` branch. Do not implement a rival recommendation engine.

For synthetic, non-customer fixtures, confirm that **Work list and detail** show identical `Why now / Do / Evidence` for:

| Case | Required outcome |
| --- | --- |
| Recent meaningful inbound, Decision 2 `ASK_ONE_QUESTION` | Ask the single known missing fact; urgency alone must not turn it into CALL |
| Current explicit request, Decision 2 `CALL` | Clearly show the call action when contact safety permits |
| Confirmed callback/appointment now due | Surface the due obligation ahead of merely attractive Opportunity Priority |
| STOP, wrong number, opt-out, suppression, or CONTROL | No actionable contact guidance; no AI/provider call or send implied |

Also verify: synthetic QA records do not clutter producer attention; stale evidence invalidates advice; underlying evidence refs remain visible; disabled flags preserve the existing manual workspace.

Certification requires **verified Preview/Production DB isolation and the exact deployed SHA**. If that cannot be established, use deterministic mocked tests and record the hosted gate as blocked. Do not use production data or force Preview bindings.

## Gate 2 — establish a single controlled integration lane

Prepare an integration branch from a freshly verified base and a requirement-by-requirement change inventory. Do not merge any existing PR automatically.

1. Preserve PR #6's compare-and-swap district promotion safety and ownership boundaries.
2. Preserve the *latest* PR #7's Copilot and Producer Action Quality code, test fixtures, and provenance.
3. Reconcile PR #8's commitment, Attention, and Calendar work against the latest #7; avoid an obsolete stacked-base regression.
4. Integrate PR #9 only after its intake-to-email linkage and Resend configuration pass a controlled synthetic canary.
5. Leave Desktop Copilot #10 separately scoped; it cannot bypass CoverageFit's evidence or send authority.

For every overlap record: source head, retained behavior, displaced implementation, affected files, regression tests, rollback, and whether permissions/provider writes have changed.

## Gate 3 — certify the communication and follow-up loop

- Producer-approved SMS must remain the only outbound authorization. Draft selection is **not** send approval.
- Verify stable message IDs, stale-revision rejection, duplicate/retry behavior, opt-out/manual takeover, owner/cohort gating, and provider acknowledgement reconciliation.
- Distinguish **outbound certified in a prior controlled Preview canary** from **inbound webhook/subscription still unverified**. Recheck RingCentral subscription, validated webhook handling, and actual inbound projection before claiming bidirectional sync.
- AgencyZoom remains the district cadence/CRM owner during the pilot. CoverageFit provides intelligence, evidence, attention, and producer action support; it does not silently take over SMS ownership.
- A saved/confirmed commitment should drive future due attention without fabricating a completed call or a Calendar event.
- Resolve ambiguous provider success through reconciliation, not blind repeated writes.
- Ensure 408FARMERS WEB/DIRECT handoff produces one Workspace opportunity and, if separately enabled, one correct producer notification without making notification success a condition of lead persistence.

Do not introduce production AI flags, RingCentral subscriptions, Google invites, automated SMS or email, customer-data model calls, or CRM writes under this review-only authorization.

## Gate 4 — establish economic evidence before district expansion

Use a small, controlled population of **fresh California personal-lines leads** and stable cohorts. The operating comparison is normal AgencyZoom/RingCentral process versus governed SIGNAL support, not raw total-contact volume.

Measure per cohort and time window:

- leads received, successfully normalized, actionable, held, excluded, duplicated;
- producer minutes spent on triage, conversation, correction, callbacks, and administration;
- **useful conversations** (defined in advance), quotes, policies bound, verified written premium;
- unanswered meaningful inbound, missed due commitments, delivery-review exceptions;
- contacts per useful conversation, producer minutes per useful conversation, binds and verified premium per producer hour.

Keep CONTROL isolated and preserve the audit of any documented allocation override. Synthetic/test opportunities never count toward outcomes. Do not claim uplift, savings, ROI, or production lift from passing tests alone.

## Release decision

**NO-GO** until all of the following have evidence:

1. Full suite and relevant security/ownership regressions green on the exact integration head.
2. Producer Action Quality Preview cases certified or explicitly blocked with a bounded fallback plan.
3. RingCentral inbound/outbound and producer-approved send idempotency proven in an authorized, isolated environment.
4. AgencyZoom ownership, source/provenance, seven-day cohort rules, STOP/CONTROL exclusions verified.
5. Lead -> action -> receipt/inbound -> next commitment -> outcome traceable without reconstruction.
6. Baseline/control measurement available for a genuine small pilot.
7. Separate operator authorization for main merge, production deploy/configuration, external sends, calendar invites, live lead enrollment, and district expansion.

## Principal attention budget

Default to **zero owner interruptions** for read-only audits, mock tests, code review, and draft PR preparation. Batch consequential approvals into one compact review with evidence, reversible recommendation, risks, and clear cost of delaying. The owner should not need to repeatedly switch among GitHub, Cloudflare, RingCentral, AgencyZoom, and ChatGPT merely to certify a development increment.

**Definition of success:** fewer minutes of producer attention required for each useful, compliant insurance conversation—not more automation for its own sake.
