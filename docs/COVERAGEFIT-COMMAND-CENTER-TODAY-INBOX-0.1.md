# CoverageFit Command Center — Today + Inbox 0.1

**Date:** 2026-10-12  
**Status:** Draft, read-only, default-off. Feature not live-authorized.  
**Canonical UX North Star:** `docs/COVERAGEFIT-PRODUCER-COMMAND-CENTER-UX-1.0.md`  
**Implementation branch:** `feature/command-center-today-inbox-readonly-20261012`, stacked on draft PR #12.

## Scope

Adds an intentionally small **Today / Inbox** panel inside the canonical `/agent/workspace/` page. It reads existing Producer Work projections and opens the existing opportunity detail. No new CRM, identity merge, SMS sender, draft mutation, profile table, Calendar API or external provider integration is created.

New server projection `server/producer-command-center.mjs` returns the meaningful subset of existing Work data. New authenticated route:
`GET /api/solo-desk/producer-command-center`, available **only** with `CF_COMMAND_CENTER_READONLY_ENABLED=1`; default remains 404/disabled. Existing `CF_ATTENTION_ENABLED=1` is also required for meaningful action output. No POST routes are introduced.

### Today 0.1
- Counts and list of current actionable NOW, TODAY, HIGH priorities.
- Exact action, why-now, evidence count and due time from existing `deriveProducerActionQuality` and `deriveAttention`.
- STOP, suppressed, nonactionable, CONTROL and TEST never promoted.
- Opportunity deadline is displayed only as **unverified recorded deadline**—not as a confirmed policy renewal.
- Clicking a row opens the canonical current detail with the existing send controls and governance; the new panel has **no send controls**.

### Inbox 0.1
- Only existing linked DISTRICT_SIGNAL SMS decision snapshots, explicitly **not** an authoritative RingCentral message inbox.
- Read-only categories: `NEEDS_PRODUCER_ATTENTION` (fresh SMS-based NOW reason), `DRAFT_REVIEW` (pending draft; eligibility not evaluated), and `DELIVERY_REVIEW` (possible uncertain delivery).
- Any draft displayed has `sms_send_eligible=false`, `send_authority=NOT_EVALUATED`, `can_bulk_approve=false`. Never invent contact authorization from an existing draft or the absence of STOP.
- Strong user-visible warning that RingCentral live inbound synchronization is **not yet certified**. No fabricated unread count or transcript.
- Suppressed/CONTROL and closed-or-later nonactionable decisions are excluded from this review panel. Existing Work and Audit retain relevant records.

### Safety and performance
- Default OFF on the deployed site. When OFF, the new UI stays hidden; the prior Work, Import, Analytics and Tools navigation remains unchanged.
- The existing read-only GET API may refresh internal population/projection data (known current behavior); do not test against Production D1 without the appropriate environment release.
- The server evaluates the same bounded Work inventory cap (currently 5,000 opportunities) once, then projects maximum 30 Today and 30 Inbox rows (maximum 40 configurable internally). The public output excludes phone, token, raw profile and full message history. The list isn't considered complete if the inventory exceeds the current 5,000-record pilot limit.
- Avoid additional per-keystroke queries and fetch the preview just once when authorized; explicit "Refresh preview" is available.
- Output is HTML-escaped client-side and rendered inside existing responsive workspace CSS. Existing deep links remain intact.
- The feature flag **does not authorize SMS send or a change to existing AgencyZoom ownership**. It doesn't change any default flags or provider settings.

## Validation

- Pure projection tests: urgent vs upcoming; STOP, CONTROL and suppression; inbox delivery/draft/attention; unverified deadline; missing event context; default-off; bounds.
- Authenticated route test: default-off HTTP 404 and missing producer token HTTP 401; on/Attention-enabled read-only actual in-memory SQLite/Workspace fixture returns review-only rows with no contact eligibility.
- Full existing GitHub Node suite and critical syntax scan must pass on the exact PR head.
- **Still required before enabling for live producer data:** hosted Preview D1 environment isolation, UI review (desktop/mobile and keyboard), current SMS ownership/consent/STOP parity and performance measurements, separate flag enablement approval.
- RingCentral subscription and webhook still require separate Phase 3 provider decision/canary. No live message ingress is certified by this work.

## Next increments (separate reviewable changes)

1. **Inbox 1.0:** verify provider inbound/receipt health, durable message identity and proper "last unanswered" timestamps; then render an honest complete provider-linked inbox and exception queue.
2. **Bulk approval 1.0:** selection/edit/digest UI, **independent positive consent and provider route checks** on each recipient, producer-confirmed exact bodies, fresh revision locks and durable per-message results. No bulk-send handler until external actions are explicitly authorized.
3. **Prospect 360 / Renewals:** source-linked fact assertions, confidence/conflicts, verified vs provisional renewal dates, then due-date re-engagement.
4. **Acquisition/SHADOW automation:** evidence-backed importer and source economics; sandboxed deterministic scheduling with no sends while provider and consent routing are certified.

**Attention sovereignty:** no Cloudflare steps are needed from the owner for this draft. Release and configuration questions should be batched with other Phase 3 provider decisions.
