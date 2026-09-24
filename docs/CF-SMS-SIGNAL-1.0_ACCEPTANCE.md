# CoverageFit SMS v1 — mandate acceptance review

Status: repository implementation and synthetic acceptance checks complete; publication, deployment and live certification remain pending. This is not a declaration that every production acceptance condition is verified.

Scope: the 67-section mandate plus the two-fresh-template addition. AgencyZoom retains all scheduling and CRM changes. Conversational signal replies require explicit producer approval. Existing first-party intake behavior remains scoped to its original handlers.

## Evidence index

- Core: `server/sms-signal-core.mjs` — enums, registry, extraction, five actions, memory, summaries and metrics.
- Service: `server/sms-signal-service.mjs` — history, facts, locks, review policy and event evidence.
- API: `server/sms-signal-api.mjs` — authenticated queue, simulator, producer actions and manual AZ confirmation.
- Integration: existing `ringcentral-sms-connection-core.mjs`, `sms-outbound-gateway.mjs` and Pages handlers.
- UI: existing SMS operations and simulator pages, extended by `assets/js/sms-signal.js`.
- Scenarios: `server/sms-signal-scenarios.mjs` — 26 fictional acceptance scenarios shared with tests.
- Tests: `tests/sms-signal.test.mjs`, inherited `tests/production-sms-safety.test.mjs`, browser `tests/sms-signal-ui.cjs`.
- Deployment brief and operator instructions: `docs/CF-SMS-SIGNAL-1.0.md`.

“Implemented” below means code present and locally checked, not live-certified. Illustrative field/state names are adapted to existing storage. No claim of general natural-language understanding: unsupported or uncertain language is held for human review.

## Requirement-by-requirement review

| § | Requirement | Result / evidence |
|---|---|---|
| 1 | Product boundary | Implemented: no AgencyZoom scheduler/API/writeback; signal processing is review-first. |
| 2 | Lifecycle | Implemented in existing webhook → service → core → queue → manual AZ acknowledgment. |
| 3 | AZ stages | Ten canonical stage codes; probes remain events in AWAITING_SIGNAL. |
| 4 | Internal states | Adapted states cover fresh attempts, probes, collection, review, quote, objections, future, closure and suppression. Illustrative names are not all separate operational states. |
| 5 | Five actions | Exactly five for meaningful signal replies; autoresponders do not create a new decision. |
| 6 | Definitions | Core routing and scenario matrix cover all five. CALL means human attention, never automatic dialing. |
| 7 | Compliance first | Deterministic filter precedes history/business classification; opt-out overrides downstream routing. |
| 8 | Autoresponder | Ignored for engagement; no conversational draft or new stage recommendation. |
| 9 | Wrong number | Direct wrong-number/person and named identity denials suppress local contact. Unknown identity language remains review-only. |
| 10 | Existing Farmers | CLOSE/human review, no new-business pitch. |
| 11 | Registry | Seven versioned, configurable templates and five families; exact-one normalized phrase match. |
| 12 | Context first | Prior outbound, history, structured facts, pending goal and existing state used; unavailable context holds. |
| 13 | Zero repeat | Thread backfill, known facts, explicit stored dates and sent-goal history prevent repeated known questions. |
| 14 | Extraction | Requested line/timing/price/carrier/context/channel facts plus opt-out and wrong-number flags supported conservatively. Price targets stay separate from premiums. |
| 15 | Signal dimensions | Intent/urgency/engagement/fit vocabulary supported; unknown fit is not invented. Sustained engagement represented. |
| 16 | Priority | LOW/MEDIUM/HIGH/URGENT; payment-due-plus-price-target example now urgent. |
| 17 | Minimum context | Partial facts permitted; useful context or depth threshold escalates; no underwriting intake added. |
| 18 | Question depth | Maximum three sent qualification questions; draft generation does not consume depth. |
| 19 | Safe responses | Bounded drafts only; no autonomous conversational signal sends. Not every illustrative category requires a separate generator. |
| 20 | Human review | Advisory/complex/unclear cases escalate or hold; no policy advice/price guarantees generated. |
| 21 | Confidence | Rule confidence recorded; low-confidence paths require human review. Values are not calibrated model probabilities. |
| 22 | Fresh logic | Both FRESH-01 and FRESH-02; Auto/Both/Text replies ask next missing fact, not appointment scheduling. |
| 23 | Aged recovery | P1/P2 attribution and reply routing; no Probe 3 or scheduler. |
| 24 | Engagement supersedes cadence | Prominent manual ENGAGED recommendation. Only Dylan/AgencyZoom can actually cancel queued campaign messages. |
| 25 | Manual AZ sync | Pending/confirmed, stage, timestamp and authenticated-producer acknowledgment; revision checks. |
| 26 | Mismatch | Fresh CONTACT_ATTEMPT or aged AWAITING_SIGNAL templates after engagement warn, with template and stage evidence. |
| 27 | Quote Ready | Explicit CALL / QUOTE READY card, known facts and Prepare quote instruction; stops qualification. |
| 28 | Quote sub-routing | PRICE, COVERAGE, TIMING, READY, DECLINE, QUESTION retained explicitly. |
| 29 | Price objection | One missing-target question, then producer escalation. |
| 30 | Coverage objection | Producer review; no automated coverage recommendation. |
| 31 | Timing objection | LATER/FUTURE_BIND plus TIMING and preserved opportunity context. |
| 32 | Future Bind data | Date/month precision, type, reason, line/carrier/premium, last objection/quote, channel and summary. Unknown quote remains null; optional producer quote-summary entry. |
| 33 | Reactivation | Prior facts reused; shared simulator scenario verifies no repeated qualification when context sufficient. |
| 34 | Channel | TEXT/CALL/EMAIL persisted; email-only suppresses SMS draft. |
| 35 | Idempotency | Existing provider-event records, thread locks and approval revision/idempotency keys; real handler replay test. |
| 36 | Thread locking | Human-review locks hold drafts; explicit resolution; stale processing-lock control. |
| 37 | Human takeover | Unregistered outbound invalidates drafts, records takeover, preserves existing ownership safeguards. |
| 38 | Style | Short bounded scripts, one question, no marketing promises; edited replies remain producer responsibility. |
| 39 | Identity | Template-context separation; no invented recent inquiry claim in generated qualification drafts. |
| 40 | Reply goal | One reply_goal per generated draft; identify-line does not schedule. |
| 41 | Stop conditions | Intent, depth, negative, future date, opt-out, review and takeover gates implemented. |
| 42 | Decision Queue | Contact/phone/context/facts/action/priority/draft/AZ recommendation and requested controls. |
| 43 | CALL NOW | HIGH/URGENT CALL filter; target premium and deductible visible when known. |
| 44 | Future view | LATER filter with prominent date/type/reason/quote/objection and general carrier/premium/channel/AZ fields. |
| 45 | Metrics | Outreach and signal measures calculated; conversion contract present but null without verified data. Expandable UI exposes all measures. |
| 46 | Efficiency | Correctly named nullable measures and unavailable reason; no fabricated producer time or conversions. Full manual time-entry app is outside this foundation. |
| 47 | Useful conversation | Recorded separately; actionable closure and contact corrections count, silence/autoresponder do not. |
| 48 | Sales-positive | Separate restricted flag for qualification/action/future intent; closure not sales-positive. |
| 49 | Attribution | Family/template/probe/source ID persisted; normalized inference, not AZ receipt certification. |
| 50 | Audit | Existing audit store reused; decision event has transition types, context revision/reference, extracted field names, confidence, reason, response policy and AZ recommendation. Producer actions, send, lock resolution and takeover audited. |
| 51 | Database | Existing D1 JSON store reused; zero SQL migrations, no deleted records. |
| 52 | Inspection/reuse | Existing webhook, gateway, consent, orchestration, history, storage, auth and UI reused. |
| 53 | Compatibility | Inherited safety tests plus first-party entry/workflow and token checks pass locally. Full deployed intake/booking regression remains a live gate. |
| 54 | Simulator | 26 selectable scenarios, including original categories, both fresh templates, six quote classes, duplicate replay and campaign collisions. Isolated simulation does not call provider or write live state. |
| 55 | Tests | 123 deterministic tests passing (17 inherited + 106 new), plus separate browser test. |
| 56 | Observability | Protected state retains context/facts; events retain decision evidence without duplicating raw customer text into audit logs. |
| 57 | Failure behavior | Missing/incomplete history, ambiguous templates, delayed messages and low confidence hold for review; no automatic send. |
| 58 | Pilot scope | Core pilot implemented; no CRM integration, autonomous advice or quote generation dependency. |
| 59 | Ten phases | Repository phases complete. Deployment/live QA cannot be counted complete. |
| 60 | Discipline | Existing primitives extended; no new application framework. |
| 61 | Outbound copy | Registry/scenario examples only; no AgencyZoom copy changed. |
| 62 | Security | Existing producer auth, same-origin mutations, rate limiter, secret bindings and outbound gateway preserved. Synthetic data only. |
| 63 | Deployment | Exact handoff provided. Not pushed/deployed: public publication approval pending; CLI Cloudflare authentication unavailable. |
| 64 | Deliverables | Implementation brief, architecture, storage, decision table, registry, workflow, tests, deployment and manual steps documented. |
| 65 | Acceptance | Local core acceptance exercised; production preservation/provider behavior remain unverified, so overall live acceptance remains pending. |
| 66 | North-star behavior | Five-action decision policy with AgencyZoom-owned persistence; no extra outbound cadence. |
| 67 | Product intent | Bounded qualification, producer attention threshold, useful vs sales-positive reporting; no aggressive SMS bot. |

## Fresh-lead addition

Both fresh templates share AZ-FRESH/CONTACT_ATTEMPT while retaining distinct IDs and purposes. Both immediately route replies through Decision 2. Generic line/channel replies do not schedule calls. The CONTACT_ATTEMPT → ENGAGED recommendation is visible. Fresh #2 after engagement raises a mismatch. Manual transition to AWAITING_SIGNAL uses the separate aged family. Registry tests cover existing customized/disabled templates. AgencyZoom owns the complete call/SMS cadence and its timing. All conversational sends remain review-first.

## Unfinished operational gates — not hidden implementation claims

1. Publish the feature branch only after explicit authorization to the public repository. Automatic approval review rejected the previous push; no bypass attempted.
2. Deploy via existing Cloudflare preview conventions with pilot flag initially disabled; verify actual D1/auth/RingCentral bindings.
3. Confirm actual AgencyZoom template copy, stages, enrollment and campaign-cancellation behavior manually.
4. Run authorized internal-number canary: observed outbound → inbound draft → manual approval → one provider send → retry deduplication → takeover → STOP/wrong number → manual AZ acknowledgment.
5. Verify existing intake/secure-link/booking flows in the deployed browser environment and confirm no regression before production activation.

No customer outreach was performed. No live AgencyZoom integration or stage movement was introduced.
