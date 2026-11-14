# Professional Home + auto combined review 1.0

Mandate: 408FARMERS-HOME-AUTO-COMBINED-REVIEW-1.0. Prepared November 14, 2026 (Pacific). Unmerged candidate; no production publishing.

## Behavior and contract

Only new Tech, Healthcare, Engineers and Teachers sessions receive `professionalFlowVersion: 1`. Their initial product question retains its existing ID and four original codes, with explicit `home_auto` added first. The option's canonical product remains `home` as a legacy routing anchor; **requested products are explicitly `[home, auto]`, never inferred from that anchor, campaign audience, or bundle-interest metadata**. The global SIGNAL product enum and generic question library are unchanged. Existing saved records without the new flow version continue their original questions, including four opening choices.

The bounded flow is: coverage selection → home reason → auto reason → home timing → auto timing → property type. It takes **six questions including selection**, or **five when the home answer is just researching**. Contact capture is separate and occurs once. Each timing question has an explicit unknown option. There is no additional shared intent question or fabricated buying-intent field. Consumers can request follow-up after the first selection, with remaining evidence unknown. The existing seven-answer ceiling is unchanged.

`professionalFacts()` reduces only active, server-validated answer metadata into requested products, selection provenance, and separate home/auto evidence. Relative timing windows remain relative windows, not exact policy dates. Property type does not imply ownership or occupancy. Exact renewal, closing and coverage-end dates must be confirmed by Dylan. Back rebuilds active state from remaining answers; discarded professional answers are retained separately in a bounded 24-entry audit history on the journey, never reused for active scoring or producer evidence.

The handoff persists `context.distribution.professionalCombined` (version, requested products, selection source, product evidence, earliest reported timing, priority product and next action), with explicit context-level requested-products/evidence copies on the lead. Existing primary routing fields remain compatible. One journey checkpoint creates one lead and one Solo Desk opportunity using existing deduplication, compare-and-swap, retention, consent, retry and reconciliation controls. No second policy opportunity or external message is created.

The producer list and detail show Home + auto. The combined detail presents readable per-policy reasons/timing, property type and chosen contact method. Original source and UTM campaign remain visible. The existing authenticated producer API adds `GET /api/solo-desk/review-export?id=...`; its JSON export preserves structured evidence, provenance, answers, permission and attribution. Authorization and workspace ownership are enforced before export. Current main has no general producer CSV export endpoint; the independent portability work is not silently merged or certified here.

Priority uses the existing engine on one line's evidence: the earliest explicitly reported timing window selects that line, with Home as the stable anchor if no timing is known. The other line's reasons/timing are not mixed into that projection, and product count adds no points. Both lines remain visible to the producer. Existing explicit contact-request intent and workflow overrides remain in effect. No eligibility, pricing, bound coverage, discount, or buying-probability claim is introduced.

## Compatibility and release order

Baselines: CoverageFit `4aacbb82d789bf55a5b7e289a9f014382df5d36f`; 408finneas `0c59566f7adb378563124207ec609365aae79968`. Frontend visual refinement 1.1 is preserved.

Companion frontend change adds scoped full-width-choice styling and uses CSS version 1.2. Backend server rendering and the shared client both annotate the combined choice; the client displays the server-confirmed combined label on questions, contact and confirmation. Its cache key changes. An already-open old page can still start any original single-product code because the product question ID and codes remain compatible.

After separate release authorization: deploy the frontend styling first, then the backend feature. Existing frontend can render arbitrary canonical choices, so this ordering establishes the approved full-width appearance before the fifth option is offered. No schema migration, provider configuration, CRM activation or messaging enrollment is required by this candidate.

Rollback: set `PROFESSIONAL_COMBINED_NEW_REVIEWS=0` on the compatible backend to withdraw new combined enrollment while preserving readers, answers, producer evidence and export for saved version-1 sessions. That switch is tested. Do not restore a pre-feature backend while combined sessions or receipts require its reader. Frontend CSS can be reverted independently, but retaining the full-width rule is preferred while sessions remain. Never delete customer records during rollback. No environment changes were performed here.

Open distribution work remains separate: backend #36/#37 and frontend #9/#10 modify overlapping transport/session areas. This candidate is based on current production main, not stacked on those unpublished branches. A future integration must reconcile those overlaps and rerun their audience-cookie/preview acceptance. Existing single-cookie cross-audience resume behavior is not repaired by this mandate.

## Verification and limitations

Final local Node 24.22.1 verification: **25/25 new combined-review tests passed**. The complete backend suite is **399/400 passing**, with the one inherited RAW assertion below. The frontend companion suite is **74/74 passing**, including four new real proxy-to-backend combined-review cases. Exact candidate commits are recorded in the coordinated PRs. New coverage includes four routes × full home-first, auto-first, researching and early-contact paths; source, permission and export preservation; Back/change, legacy sessions, stale/invalid answers, delivery failure/recovery, duplicate suppression, restart, export authorization/workspace isolation, priority equivalence and compatible withdrawal.

The existing full-suite AgencyZoom RAW test expects “48 hours” while current main returns “outside 7 days.” It fails unchanged on the pristine baseline. No enrollment rule or unrelated assertion was changed to make this feature's suite green.

Browser acceptance uses the actual frontend proxy, CoverageFit handlers, in-memory SQLite and producer interface in the companion local QA harness. It does not send messages, access production data, or certify AgencyZoom delivery. The harness has a clearly synthetic, public local-only fixture token and provides a preauthenticated synthetic producer page; it grants no real account access. Production authentication is unchanged.

Screenshots and authoritative synthetic receipt are stored with the frontend companion. Width-constrained Chromium frames are not physical iPhone/Safari or Instagram WebView certification. Hosted preview build status is not authenticated hosted acceptance. No production merge, deployment, environment change or external customer communication is authorized or performed by this mandate.
