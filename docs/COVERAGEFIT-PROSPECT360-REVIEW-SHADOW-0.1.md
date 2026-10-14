# CoverageFit — Prospect 360 / SMS Review / Engagement SHADOW 0.1

**Status:** Draft implementation, default-off review-only, not live producer or external send certified  
**Branch:** `feature/prospect360-sms-review-shadow-20261012`, stacked on Command Center draft PR #14 (which is stacked on Action Quality draft PR #12).  
**Date:** 2026-10-12  
**North Star:** `COVERAGEFIT_NORTH_STAR.md`; operating experience: `docs/COVERAGEFIT-PRODUCER-COMMAND-CENTER-UX-1.0.md`.

## Ordered development outcomes

### 1. Prospect 360 + Renewal Intelligence — implemented as a read-only projection

- `server/prospect-360-readonly.mjs` reads existing opportunity detail, imported source/raw facts, SMS renewal facts, commitments and **preexisting** Universal Customer Profile links. It does not create or merge identities. Never match on phone alone.
- Explicit structured `renewal_verification_v1` records with recognized status `customer_confirmed`, `document_verified`, `producer_confirmed` can establish verified timing; in the absence of such evidence, imported CSV and SMS timing remain **imported_unverified**.
- Different dates from conflicting sources yield `conflicted` and no silently selected winner; month-only values stay month-only, an ordinary opportunity deadline cannot be silently promoted into verified renewal, and past verified dates become stale rather than being automatically rolled forward a year.
- Existing `projectCommitments` determines whether a callback/review commitment is actionable. Untested customer intent cannot create a confirmed callback.
- `GET /api/solo-desk/prospect-360?id=...` is authenticated, behind **`CF_PROSPECT_360_READONLY_ENABLED=1` (OFF by default)**; no write endpoint. `assets/js/prospect-360-readonly.mjs` shows an optional, source-labeled rail in existing opportunity detail, hidden when disabled.
- This is a source-linked projection, **not yet a durable canonical multi-source FactAssertion history**. Migration and verified renewal correction/update UI remain separate future approval.

### 2. Multi-message SMS review — implemented with no send authority

- `server/sms-review-readonly.mjs` accepts **1–10 distinct** opportunity IDs and re-fetches each current opportunity, revision, ownership/suppression, and pending SIGNAL draft. For CONTROL, STOP, human takeover, delivery uncertainty, stale/non-pending and missing drafts it withholds the draft and yields a distinct reason.
- `GET /api/solo-desk/producer-approval-preflight?ids=...` is authenticated, gated by **both** `CF_COMMAND_CENTER_READONLY_ENABLED=1` and `CF_SMS_REVIEW_READONLY_ENABLED=1`, each **OFF by default**. There is **no POST**.
- `assets/js/sms-review-panel.mjs` plus the existing Command Center Inbox implements multi-select, local editable draft preview, individual exception labels and a visible *No send* warning. Changes in those textareas are **not saved**; do not infer consent from merely showing/editing a draft.
- Response items explicitly state `can_send=false`, `can_approve=false`, `send_eligibility=NOT_VERIFIED`. No preview does send selection or bulk approval.
- Before a true production approval flow, require independently positive per-recipient opt-in and provider route/campaign/number verification; durable consent receipts; immutable exact-body and revision tokens; per-item idempotency, STOP/CONTROL/ownership checks and provider delivery reconciliation. This feature has **none of those send authorities**.

### 3. Qualification + follow-up SHADOW simulation — deterministic and offline

- `server/engagement-shadow-simulator.mjs`: pure `simulateEngagement` and `simulateEngagementBatch`, up to 1,000 synthetic cases by design. No network, database, RingCentral, Calendar or CRM connection.
- Strict precedence: TEST → CONTROL → STOP/suppressed → acquired/purchased-route block → missing independently evidenced permission/route → renewal conflict → explicit call → recorded due follow-up → provisional clarification → waiting/review.
- `PROPOSE_ASK_RENEWAL` may contain **proposal text for analysis**, but explicitly always reports `sms_send_authorized=false`, `provider_route_authorized=false`, `will_send=false`, `messages_sent=0`, `writes=0`.
- Source flag `permission_verified` is a synthetic simulation input **not** a new runtime consent authority; no path carries it into the sending gateway. Do not equate user-supplied vendor consent with authorization to text a purchased list.
- This module is not activated as a background worker or scheduled contact campaign.

## Test/release gates

- Nine Prospect 360 evidence, conflict, month-only, stale, promise and identity assertions.
- No-send selected review, STOP/CONTROL/ambiguous delivery, selection input and 100-prospect shadow tests.
- Authenticated SQLite integration confirms feature flags off by default; Prospect 360 renewal provenance; selected review stale/current draft and NO_SEND.
- CI includes critical syntax check and full repo tests on the exact PR head.
- **Not complete:** hosted isolated Preview acceptance for these new UI surfaces; accessibility/performance measurement, end-to-end live inbound, durable verified consent/approval ledger, RingCentral webhook subscription/canary, actual SMS sends, producer fact edits and any production deployment.

## Operational handoff

- **No owner action necessary for this draft.** Do not ask the principal to repeat Phase 2 D1 SQL or configure RingCentral to continue test-only work.
- The live webhook blocker remains: `RINGCENTRAL_WEBHOOK_URL` and `RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN` absent from accepted Preview; Preview points at production RingCentral realm. No real account edits/subscription creates until a separately approved controlled plan.
- After exact-head CI passes, continue preflight on synthetic fixtures and optionally request one consolidated isolated hosted Preview review for the three read-only views—not incremental Cloudflare steps.

**Attestation:** This is code and local test evidence, not deployed functionality.
