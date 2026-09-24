# CoverageFit SMS Signal Operating System v1

## Status

Implementation candidate on `cf-sms-signal-os-v1`, based on CoverageFit main `961d242a2fbdfc27f634a9836e66dfb3f2c60ef1`.
**Not production-deployed or live-certified.** Live processing is disabled unless `CF_SMS_SIGNAL_ENABLED=1`. All new signal replies require producer approval. No customer messages were sent during implementation.

## Architecture and reuse

AgencyZoom scheduled outbound → RingCentral history/webhook → CoverageFit compliance/context/template/facts → five-action Decision 2 → producer review → manual AgencyZoom move → MARK AZ UPDATED.

Reuses the existing authenticated RingCentral webhook, history client/recovery, hashed contact identity, D1 JSON store, consent handling, outbound gateway/idempotency registry, producer authentication, rate limiter, SMS operations page, simulator page, and redacted audit infrastructure. Existing first-party intake and booking workflows stay on their original handlers unless the conversation is managed by the signal pilot. New signal-managed conversations cannot receive legacy programmatic replies through the gateway; only reviewed producer messages can be sent.

No AgencyZoom API, CRM writeback, outbound campaign scheduler, quoting engine, policy advice engine, or separate SaaS application was added. External AgencyZoom sends cannot be stopped by CoverageFit. Dylan must move the stage and verify enrollment/queued sends in AgencyZoom.

The core classifier is deterministic, conservative and context-first. Confidence values are rule confidence, not statistically calibrated probabilities. Low-confidence, unrecognized-template, context-failure and advisory cases require human review. CALL denotes producer attention; it does not automatically dial and must respect text/email preference.

## Reused storage and additive data

No SQL migration is necessary. Existing `sms_conversations` JSON records hold:

- `sms-live-conversations/<id>.signal`: facts and provenance, internal state, intent/urgency/engagement/fit, latest decision, confidence/reason, priority, draft status, question count, asked goals, future timing, inferred template attribution, manual AZ sync, suppression and review locks.
- `sms-signal/templates`: producer-editable canonical registry.
- `sms-signal/events/<provider-message-id>`: deduplicated attribution/decision/delivery evidence without raw message text.
- `sms-signal/locks/<conversation-id>`: atomic D1 insert lock shared by webhook and signal operator mutations.
- Existing `sms-ops/audit/`: redacted decision and operator-action audit.

No existing table/data is deleted. Live normalization now preserves both signal memory and the existing aged-lead memory. Fact extraction reuses explicit facts from earlier thread messages and structured memory. Unknown values stay unknown. A month-only future request retains month precision; relative dates are approximate and raw wording remains available. Time zones and exact callback times must be verified by the producer; no appointment is created from inferred timing.

The five actions are CALL, ASK_ONE_QUESTION, LATER, CLOSE, STOP. Internal classes include wrong_number, automatic_response, existing_farmers, objection_price, quote_coverage, quote_timing, human_required and review. Autoresponders are excluded from meaningful engagement rather than given a sixth action.

## Decision table

| Reply/context | Decision | Suggested AZ stage | Response policy |
|---|---|---|---|
| Auto/Home after line question | ASK_ONE_QUESTION | ENGAGED | Draft next missing fact |
| Yes/maybe/open to compare | ASK_ONE_QUESTION | ENGAGED | One useful question per draft |
| Explicit callback, quote request, active shopping, urgent renewal/cancellation | CALL | ENGAGED or QUOTE_READY | Producer attention; no automatic text |
| Enough context or three sent questions | CALL | ENGAGED / QUOTE_READY | Stop qualification |
| Future callback/renewal | LATER | FUTURE_BIND | Capture available date/month; no call now |
| Already handled / declines | CLOSE | CLOSED | Optional short thanks for review |
| STOP / equivalent explicit opt-out | STOP | STOP | Hard suppression, no sales reply |
| Wrong number / spam | CLOSE | CLOSED | Local gateway suppression, no reply |
| Existing Farmers | CLOSE | CLOSED | Human review; no new-business pitch |
| Automatic driving/out-of-office reply | No new decision | Unchanged | No draft, no engagement increment |
| Quote sent: price | ASK_ONE_QUESTION | QUOTE_SENT | Ask target only if missing, then producer |
| Quote sent: coverage / ready / other question | CALL + human review | QUOTE_SENT | No automated coverage/binding advice |
| Quote sent: future timing | LATER | FUTURE_BIND | Preserve context |
| Missing context / unclear reply | CALL + human review, LOW | No invented stage | No draft |

Each approved question increments depth. Draft generation does not. Three is a maximum, not a target; active intent escalates earlier. One question mark maximum is also enforced on edited drafts. Edited text remains the producer's responsibility; punctuation validation alone cannot prove semantic one-question compliance.

## Template registry

The registry supports template ID, family, name, normalized literal phrase patterns, expected stage, purpose, expected reply types, reply goal, active flag, version, and timestamps.

Seed examples: AZ-FRESH-01, AZ-FRESH-02, AZ-AGED-P1, AZ-AGED-P2, AZ-QUOTE-01, AZ-FUTURE-01, AZ-CALLBACK-01. Families: AZ-FRESH, AZ-AGED-RECOVERY, AZ-QUOTE-FOLLOWUP, AZ-FUTURE-BIND, AZ-CALLBACK.

These are configurable examples, not evidence of the actual AgencyZoom account configuration. Register the real copy before activation. All pattern phrases must match after normalization; overlapping matches fail closed. Matching supports wording variations without arbitrary regular expressions. Attribution is explicitly inferred; wording cannot prove whether AgencyZoom or a human sent a message. A recognized template never clears an existing producer lock.

## Fresh-lead support

| Template | Family | Expected AZ stage | Purpose / default goal |
|---|---|---|---|
| AZ-FRESH-01 | AZ-FRESH | CONTACT_ATTEMPT | Start conversation, identify line / IDENTIFY_LINE |
| AZ-FRESH-02 | AZ-FRESH | CONTACT_ATTEMPT | FRESH_SECONDARY_CONTACT: offer text path, identify line / IDENTIFY_LINE |

The registry contains seven distinct templates. Existing saved registries receive missing defaults without replacing customized or disabled entries. Set `active: false` to disable a template; deleting a default entry does not disable it. Register distinctive phrases for the actual AgencyZoom wording; routing does not hardcode the full SMS prose. Ambiguous matches require review.

AgencyZoom alone controls the intended fresh cadence: call → Fresh #1 after no answer → call #2 roughly 30–60 minutes later → call #3 later that day/next business day → Fresh #2 if still no meaningful reply → final call → manually move to AWAITING_SIGNAL if exhausted. Exact delays remain an AgencyZoom operating choice. CoverageFit neither schedules these steps nor advances a silent lead automatically.

Replies to either fresh template enter compliance → context → template identification → facts → Decision 2 → draft/action → recommended stage. `Auto` and `Both` preserve the line and ask about timing; `Text is easier` records TEXT and asks for line only when unknown. These do not request an appointment. `Call me now` yields high-priority CALL; `Already got insurance` yields CLOSE/CLOSED; STOP yields STOP with no draft. Useful engagement prominently requests **AGENCYZOOM ACTION REQUIRED: CONTACT_ATTEMPT → ENGAGED**. Dylan must move the stage and stop remaining campaign enrollment manually.

After the actual manual move to AWAITING_SIGNAL, aged P1/P2 use their separate family/context. A fresh CONTACT_ATTEMPT template or aged AWAITING_SIGNAL template observed after meaningful engagement raises **POSSIBLE AGENCYZOOM STAGE / CAMPAIGN MISMATCH**, with inferred state, observed template and expected stage. No AgencyZoom record changes automatically.

Twenty-six synthetic scenarios are available in both signal simulator sections, including both fresh templates, the original mandate scenarios, all six quote-response classes, future reactivation, duplicate replay and aged/fresh campaign collisions. The test matrix exercises these across both templates, saved-registry compatibility, known-line memory, fresh/aged boundary and review-first webhook flow.

## Operator workflow

1. Open `/agent/sms-operations/`, sign in with the existing producer access key, and use **Refresh decisions**.
2. Review the latest inbound, previous outbound, extracted facts, five-action recommendation and priority. CALL NOW filters HIGH/URGENT CALL decisions; Future Bind filters LATER.
3. For a draft, edit and **Save edit**, then **APPROVE & SEND**. Unsaved edits cannot accidentally approve the old text. Each approval is tied to a conversation revision.
4. CALL marks producer attention; place the call through normal RingCentral operations. LATER can capture a follow-up month/date. CLOSE stops this opportunity. STOP applies local hard suppression.
5. Complete the recommended stage move in AgencyZoom. Verify that the remaining campaign texts are canceled/unenrolled there. Then **MARK AZ UPDATED** and confirm the stage.
6. Use **Record actual AZ stage** to provide QUOTE_SENT, WON or other current state when the CRM changes. This is an operator assertion, not CRM verification.
7. A detected human outbound invalidates the draft and locks the conversation. Use existing ownership controls to resolve producer ownership; resolving the signal review lock alone does not bypass those controls.
8. Delivery uncertainty shows `delivery_review`, clears the draft and forbids blind repeat approval. Verify RingCentral history before preparing any subsequent message.

The same Signal simulator is appended to `/agent/sms-simulator/`. It uses fictional previous-outbound/inbound pairs and never sends or writes live conversation state. Use Simulate Decision 2 for edited input or Run scenario / replay for preset checks and traces. Replay uses isolated synthetic state; actual persistent webhook deduplication is separately covered by handler tests.

## Metrics and limits

The endpoint reports observed unique contacts, meaningful responders, reply rate, STOP/wrong-number/confusion rates, sales-positive/negative/future/high-intent rates, Probe 1/2 responders, useful conversations, autoresponder count and pending AZ moves. Useful and sales-positive are separate: closure/wrong-number information can be useful without being sales-positive.

Reply/STOP/wrong-number rates use observed contacted leads; signal rates use meaningful responders. Reports cover retained signal event records (up to 1000) and up to 500 stored conversations, with a truncation flag. They are neither account-wide nor lifetime metrics. Historical recovery may provide context without a complete observed outreach denominator. Template attribution is inferred, not an AgencyZoom campaign receipt.

Conversion fields and efficiency fields are explicitly null until reliable measurement exists: positive-to-engaged, engaged-to-quote-ready, quote-ready-to-quote-sent, quote-sent-to-won, future-bind-to-reopened, producer effort per useful conversation, texts per positive signal, texts per quote ready, calls per quote and producer minutes per bind. This release supplies the reporting contract, not a manual outcome/time-entry UI. Do not substitute zero or claim CRM conversion rates from stage recommendations.

## Validation

- 123 deterministic tests passed: 17 inherited production safety tests and 106 new tests.
- Tests cover template recognition/ambiguity, STOP, wrong number, autoresponder, existing Farmers, context-sensitive No/Home, fact extraction, legacy/history memory, zero repeat, depth limit, future timing, quote objections, manual AZ acknowledgment, stage mismatch, duplicate webhooks/approval, thread contention, human takeover, gateway suppression, API auth/origin, simulator isolation, delivery uncertainty, stale draft invalidation, metrics and missing history.
- Cloudflare Pages Functions compilation passed using the repository's documented Wrangler version 3.114.17.
- Node syntax checks cover server modules, Functions routes and new UI JavaScript (see QA JSON for count).
- Synthetic Chromium browser QA passed: desktop/mobile queue, CALL/Future filters, Quote Ready/Future summaries, fresh/quote/replay/mismatch simulator runs, no horizontal mobile overflow and no JavaScript page errors. API data is mocked; this is not live-provider certification.
- Live RingCentral webhook, real provider delivery, deployment bindings, D1 state, protected intake pages and production regression canaries remain UNVERIFIED.

Run:

```sh
node --experimental-loader ./tests/json-loader.mjs --test tests/*.test.mjs
npx --yes wrangler@3.114.17 pages functions build --outdir=/tmp/cf-signal-build
```

Browser script: `node --experimental-loader ./tests/json-loader.mjs tests/sms-signal-ui.cjs` (Playwright via `CODEX_PRIMARY_RUNTIME_NODE_MODULES`, installed Chromium and Python 3). It starts a local fixture server. Optional `CF_CHROMIUM_PATH` and `CF_CHROMIUM_HELPER` support a separately installed Chromium binary/launch helper.

The test-only loader supports existing bundled JSON imports in Node; production imports were not rewritten.

## Deployment and activation brief

1. Review this branch against base main. Preserve the existing deployment configuration and all secrets. Do not deploy or overwrite older signal preview branches.
2. Run the test command and Functions build above. Complete browser checks on both existing SMS pages and the protected intake/booking flows.
3. Deploy the feature branch to the existing Cloudflare Pages project using normal Git preview deployment. Keep `CF_SMS_SIGNAL_ENABLED` unset initially. This does not authorize customer test messages.
4. Verify the preview's existing D1/producer-auth/RingCentral bindings. No new database binding or migration is needed. Do not copy production secrets into source.
5. Review actual AgencyZoom templates and register their distinctive literal phrases. Confirm pipeline stages and removal/cancel behavior. The new registry does not modify AgencyZoom.
6. For an isolated authorized internal canary, set `CF_SMS_SIGNAL_ENABLED=1` in that environment. Verify the complete sequence: outbound template, inbound → draft without send, explicit approval → one send, webhook retry → no duplicate, human takeover → no draft/send, opt-out → suppression, wrong-number suppression, autoresponder silence, manual AZ confirmation, Fresh #2 and aged P2 mismatch warnings, both fresh-template reply cases, quote objection and future timing.
7. Review live latency/history recovery; same wording is only template inference. Confirm no legacy callback sequences remain active for pilot leads. Gateway protection blocks programmatic legacy sends once managed, but cannot control AgencyZoom or direct human RingCentral sends.
8. Only after these gates pass, merge/deploy using the existing production workflow and enable the pilot flag for the intended environment. Verify the production deployment and canary before calling it live-ready.

Cloudflare CLI authentication was unavailable here (`wrangler whoami`: not authenticated); no production deployment or environment change was performed.

Crash recovery: a held thread lock returns retryable HTTP 503 rather than risking concurrent processing. Producer control **Clear stale processing lock** removes a lock older than ten minutes. Verify no live request is processing before use. Provider failure after acceptance can be ambiguous; the signal approval path never automatically retries it.

Rollback: disable the feature flag to stop new signal classification, and revert this feature commit using the existing Cloudflare/Git rollback procedure if needed. Existing consent and wrong-number suppression must remain honored; do not bulk-clear signal suppression records. Review queued legacy sends before disabling the managed-conversation gateway guard.

## Completion review

The section-by-section review is in `CF-SMS-SIGNAL-1.0_ACCEPTANCE.md`. The initial 83-test handoff overstated coverage: the final pass added named wrong-person suppression, urgent payment/price-target interpretation, explicit quote TIMING/DECLINE, Future/Quote Ready summaries, quote-context recording, shared scenario/replay controls and transition evidence. It also corrected first-party entry preservation, known-date zero-repeat, stale Quote Ready flags, persistent wrong-number suppression and manual-date validation.

Quote Ready shows the five-action CALL decision plus Prepare quote and known facts. Future Bind shows future date/type, reason, last objection/quote and retained context. Context and controls offers Record delivered quote summary: this is a factual producer observation, not an AgencyZoom write or automatically prepared quote. Expanded metrics show all available and unavailable measures.

Inbound decision events now preserve transition types, context revision/outbound reference, extracted field names, processing timestamp, confidence/reason, response policy, lock/review state and stage recommendation. Existing protected conversation state holds actual facts; audit logs do not duplicate raw messages. Producer send, acknowledgment, unlock, close/stop/future actions and takeover use existing audit infrastructure.

## Next step

Approve publication of this feature branch to the public `dhays4sports/CoverageFit` repository, then run the isolated internal preview canary and protected-flow browser checks before activation. Automatic approval review rejected the branch push because public publication was not explicitly authorized. No remote branch or deployment was created. No live AgencyZoom integration is needed.
