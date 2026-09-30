# Signal Reply Copilot 1.0

Date: 2026-09-30. Baseline CoverageFit main: `5f47f2b7367110ca04ff03cc189983f136ab32fa`.
Branch: `signal-copilot`. Production flags/configuration were not inspected or changed.
**Implemented and mock-tested; not deployed or enabled. Hosted/mobile certification outstanding.**
Producer OS PR #6 remains separate; no assumption that its promotion fix is merged.

## Audit and reuse

Reviewed North Star, Signal Decision documents, Producer OS foundation roadmap on
its separate branch, importer/RAW normalization, migrations through 0019, Signal
service/API, ownership, district enrollment, producer workspace, Solo Desk API and
repository, priority projections/tests and the existing producer SMS UI.

Reuse authenticated producer API, same-origin/body/rate-limit protections, D1 JSON
storage, original opportunity/pilot linkage, RAW allowlist, current Signal facts,
shared webhook/send lock, revision checks, explicit edit/approve actions and the
single RingCentral gateway. No new CRM, transcript silo, navigation surface or
sender. Existing quote-extraction and displacement-outreach OpenAI integrations
remain unchanged; Copilot uses one bounded adapter, not new calls scattered across
Signal modules. Consolidating those specialized legacy integrations is deferred.

## Authority and scope

Stage A only: explicit producer-triggered advisory reasoning. Both flags default
off. No auto-analysis subscriber, no auto-send, no automated task/stage/quote/fact
mutation. Exact enrolled NEW_LEAD district SIGNAL relationships only in 1.0.
CONTROL, OTHER, WEB_DIRECT, unknown, wrong-number, suppression, takeover and unsafe
ownership are held before provider access. Existing pilot and five Decision 2
actions/weights remain unchanged. Candidate AI scores/actions never overwrite them.

Customer evidence, business state and producer direction are separate context
fields. All fact proposals remain PROPOSED / UNCERTAIN / CONFLICTING, with source
message ID, evidence text, confidence and extractor version. No accept-fact
mutation is introduced. Human review is mandatory even for high confidence.

## Modules and routes

- `server/ai-provider.mjs`: capability routing, server-only OpenAI Responses adapter.
- `server/signal-copilot-contract.mjs`: strict schema, producer style, validation.
- `server/signal-copilot-context.mjs`: exact relationship gates, bounded context.
- `server/signal-copilot-service.mjs`: cached suggestions, budgets, telemetry.
- `assets/js/producer-copilot.mjs`: native lead-detail panel.
- Existing `POST /api/solo-desk/copilot`: status/analyze/revise/reject actions.
- Existing authenticated API namespace `GET /api/solo-desk/copilot-usage`.
- Existing `POST /api/sms/signal`: explicit edit/select and approve/send, with added
  Copilot context checks. No new send route.

New state uses `sms_conversations` keys `signal-copilot/{workspace}/requests/`,
`budget/`, and `rate/`. No migrations/bindings. Persistent data is CoverageFit-owned;
provider conversations/response IDs are never required for continuation.

## Context and output contracts

Provider context: allowlisted insurance memory, KNOWN/UNKNOWN/UNCERTAIN/CONFLICTING
ledger and alternatives, do-not-reask fields, latest 12 inbound/outbound messages
(maximum 700 characters each), bounded existing thread summary, current Signal
stage/action/priority, style, previous suggestion and separate producer direction.
Full source snapshots are hashed locally for staleness, never sent. Names, phone,
email, address and original RAW records are not added as structured context.
Common sensitive free-text identifiers/details are redacted. This is bounded
minimization, **not a claim of perfect free-text anonymization**.

Output: interpretation and advisory scores, objections/shopping reason, sourced
fact proposals, candidate state changes, missing-information priority and reason,
five-action candidate, reply/purpose/asked fields, summary delta and ambiguities.
Scores, fields, object keys, types, lengths, dates and proposal message quotes are
validated locally. Unsupported output is rejected without business-state mutation.

Known facts and high-confidence newly proposed facts guard against repeat questions.
Reported asked fields plus phrase guards hold detected repeats. Conflicts remain
visible and eligible for confirmation. Phrase guards cannot prove every paraphrase
safe; real-model quality and ZERO-REPEAT evaluation remain rollout gates. Prompts
also forbid fabricated prices, policy claims and guarantees; detectable monetary
claims/guarantees are held. Producer review remains necessary for semantic accuracy.

## Provider and cost boundary

Responses API, `store:false`, strict `text.format`, no tools, no provider memory.
Capabilities FAST_EXTRACT / NORMAL_REASON / DEEP_REASON have server-configured model
mappings. Stage A invokes NORMAL_REASON only; no automatic escalation. Future
adapters can replace transport without changing persisted schema/context/workflow.

One consolidated request; **zero automatic retries**. Default timeout 15 seconds,
bounded to 1–20 seconds; request abort propagated. Output capped at 2,000 tokens;
serialized request capped at 30,000 UTF-8 bytes. Input-token cost reservation uses
a conservative byte-based upper bound, no cached-input discount. Operator-supplied
pricing must match the configured model; the local estimate is not a provider bill.

Monthly workspace ceiling reserves before calling using a conditional atomic D1
update. Concurrent requests cannot each spend the same remaining balance. Six paid
attempts per producer/minute. Successful known usage reconciles the reservation;
failed/uncertain calls retain it conservatively. Crashed pending requests remain
held. Identical context/model/direction/revision requests return cached output;
failed identical attempts are not automatically retried. A new context or explicit
changed direction is needed for another attempt. No background regeneration.

Usage stores provider/model/capability, opportunity/conversation, type, token usage,
latency, estimated cost/reservation, retries, outcome, parent suggestion, direction,
accept/edit/reject, final approved text and provider message ID. Tools exposes UTC
daily request count, month-to-date charge/reservation, failures, latency and review
counts. Recent request aggregations are capped at 1,000 and marked truncated;
budget enforcement uses the separate ledger and is not capped by that view.
Estimated costs count cached input at full price conservatively.

At GPT-5 mini example prices ($0.25 input / $2 output per million), mocked 500 input
+ 200 output tokens = **$0.000525**. This is arithmetic on synthetic usage, not a real
call measurement or promise of quality/latency. The maximum configured reservation
is $0.0115. Actual routine calls need synthetic provider evaluation before rollout.

Official references checked 2026-09-30:
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/migrate-to-responses
- https://developers.openai.com/api/docs/models/gpt-5-mini

## Producer workflow

Open eligible lead → Suggest reply → inspect interpretation, known answers,
proposed facts, useful gaps, candidate action and reason → optionally add direction
→ Update suggestion → edit → Use this in reply → existing **Approve & send**.
Selecting saves a pending draft; it never sends. Explicit approval retains sender
ownership, suppression, question count, active-Continue and revision checks.
Changed context during generation rejects the result. Changed context before
selection/approval rejects the stale draft. Explicit manual replacement remains
possible even if Copilot is unavailable. Producer edits do not become customer
facts or universal style rules. Telemetry failure after successful delivery never
causes a send retry. Unknown provider delivery remains held by the existing sender.

Controls use labelled textareas, live status, escaped output, visible focus, 16px
inputs and 44px minimum buttons. No modal or second inbox. Mobile widths and visual
browser behavior are NOT certified: local Playwright was present but its browser
binary was absent, and the browser download failed. Static UI and backend tests
are not a substitute for that remaining gate.

## Tests and boundaries

Full suite: **365 passed, 0 failed, 0 skipped** (37 new Copilot tests).
`node --test --experimental-loader ./tests/json-loader.mjs tests/*.test.mjs`

Coverage includes generation/revision/selection/explicit one-send flow with mocked
provider/transport; STOP/DNC/wrong number/CONTROL/OTHER/off isolation; auth/origin/
workspace access; field/date/score/schema rejection; six ZERO-REPEAT fields and
newly extracted facts; conflicts; direction provenance; stale source/revision;
manual fallback; timeout/size/refusal; atomic budget concurrency; duplicate request
cost suppression; failure reservation; privacy minimization and labelled UI.

The baseline had one stale 48-hour assertion; it is updated to seven days, matching
the already-approved production rule. No importer logic changes in this branch.
Behavioral examples A–F are sanitized fixtures under `tests/fixtures/copilot/`.
Mocks verify enforcement and plumbing, not real-model interpretation accuracy.
No actual OpenAI requests, customer SMS, live import or production writes performed.

## Manual operator checkpoint (after code review/release)

Project identity gate: historical repo evidence calls the CoverageFit Pages project
`dontworrycoverage`; newer readiness explicitly requires verification. **Confirm
that project's Custom domains contains coveragefit.com before any configuration.**
If it does not, stop and identify the serving project; do not configure a guessed
project or `408farmers-v2`. This uncertainty does not block repository work.

In the confirmed CoverageFit Pages project, Settings → Variables and Secrets,
configure the intended environment only. Preview first with isolated synthetic
records and test transport; never point a canary at real customer identities.

| Setting | Value / format | Purpose |
|---|---|---|
| `CF_AI_ENABLED` | `0` initially | Master off switch |
| `CF_SIGNAL_COPILOT_ENABLED` | `0` initially | Copilot off switch |
| `CF_AI_PROVIDER` | `openai` | Transport selection |
| `OPENAI_API_KEY` | Secret entered directly in Cloudflare; never pasted into chat | OpenAI authentication; preserve an existing shared key if already configured |
| `CF_AI_MONTHLY_BUDGET_USD` | `10` | Workspace estimated monthly ceiling |
| `CF_AI_REQUEST_TIMEOUT_MS` | `15000` | Timeout |
| `CF_AI_MODELS_JSON` | JSON below | Model and verified price mapping |

```json
{"NORMAL_REASON":{"model":"gpt-5-mini","input_per_million":0.25,"output_per_million":2,"reasoning_effort":"low"}}
```

No additional key is required if the existing server-only OPENAI_API_KEY is already
valid for this model/project. Do not expose or rotate it merely for this feature.
Verify pricing/model availability in the operator's OpenAI project before enabling.
No FAST/DEEP mapping is necessary for Stage A. No automatic-analysis flag is used.

Deploy the reviewed commit with flags at `0`. Verify existing Work, import preview,
Signal and manual draft behavior; Copilot generation must be absent. Then, only in
the intended test environment, set both flags to `1` and redeploy. Open one internal
SIGNAL test record, generate once, revise once, verify proposals do not alter facts,
check Tools usage, and verify CONTROL/STOP show no Copilot guidance. Do not approve
a send solely for certification on a real customer. Measure actual provider latency,
usage, output validity and estimated cost. Complete 320/375/390/430px and desktop
checks, keyboard/focus/error announcements, edit/reload/stale draft and explicit
approval with a controlled transport/number before certifying production rollout.

Do NOT change DNS, D1 bindings, migrations (especially 0019), RingCentral secrets,
SMS flags, AgencyZoom ownership/cadence, CONTROL/SIGNAL assignment or priority.
Rollback: set either Copilot flag to `0` and redeploy; existing manual workflows
remain. Code revert is optional; retain audit records. No data reset.

## Readiness and next increment

Repository implementation / mocked sender flow: PASS.
Real provider quality/latency/cost: NOT VERIFIED (optional key-dependent canary).
Hosted workflow and mobile visual/keyboard certification: BLOCKED at deployment/operator gate.
Overall: **PASS WITH LIMITATION for repository build; not certified for live enablement.**

Primary evaluation target is safe drafts sent unchanged or after one short edit.
This build records the ingredients; it does not claim sales lift, calibrated
model accuracy or a complete causal sales-outcome dashboard. Quote/bind outcomes
remain in existing canonical measurement; the read-only outcome join covers at most 50 recent analyzed opportunities and reports truncation/unknowns. Full meaningful-inbound coverage denominators and causal analysis remain deferred. No full retention/pruning policy for new
request records is introduced; audit data is durable in the existing store.

Next: certify the synthetic provider and hosted/mobile flow, then refine prompts
against cases A–F. 1.1 may extend durable summaries, commitments/callback proposals,
edit evaluation and outcome joins. 1.2 may reuse these contracts for call transcripts.
No autonomous sending, quoting, binding, vector DB or model fine-tuning is authorized.


## Section 77 completion report

| Item | Repository result / evidence |
|---|---|
| 1. Architecture audited | Current main, Signal/ownership/pilot/importer/workspace/priority, D1 schemas, Pages routes, existing OpenAI paths; see audit above |
| 2. Reused | Producer auth, same-origin/body/rate limits, D1 JSON store, provenance, shared conversation lock, Signal edit/approve/gateway |
| 3. New modules | ai-provider, signal-copilot-contract/context/service, producer-copilot UI |
| 4. Files changed | Modules above; producer-workspace server/client/CSS, solo-desk-api, sms-signal-api, workspace index, North Star, this document, Copilot tests/fixtures and stale importer assertion |
| 5. Migrations | None; do not reapply 0019 |
| 6. Adapter | Responses, strict structured output, store:false, timeout/abort, 2,000 output cap, zero retries |
| 7. Context | Bounded permitted memory/messages/summary, ledger, current business state; direction separated |
| 8. Output | Interpretation, proposals, gaps, advisory decision, reply/asks, summary delta and review metadata |
| 9. Facts | Allowlist/types/dates/evidence checks; conflicts visible; no canonical writes |
| 10. ZERO-REPEAT | Ledger plus proposal/asked-field and phrase guards; semantic coverage requires real-model evaluation |
| 11. Decision 2 | Existing five actions unchanged; AI candidate never silently adopted |
| 12. Direction | Natural-language revision and previous draft sent separately; saved for evaluation, never customer facts |
| 13. UI | Existing lead detail, native direction/draft controls, existing approval; Tools usage |
| 14. Send authority | No generation sends; explicit select then existing approve with fresh context/ownership/consent/revision |
| 15. CONTROL | Blocked before model call; no treatment panel |
| 16. Minimization | No full CRM/RAW payload; bounded allowlist and text redaction; no perfect-anonymization claim |
| 17. Portability | Capability/config adapter, domain-owned schema/storage; alternate provider not implemented |
| 18. Cost | Atomic reservation/ceiling, 6 attempts/minute, identical request cache, no loops; conservative failure charges |
| 19. Flags | CF_AI_ENABLED and CF_SIGNAL_COPILOT_ENABLED, both default off |
| 20. Failure | Existing Signal/manual path stays; stale/invalid output held; no silent state mutation |
| 21. Tests added | 37 Copilot tests, sanitized A–F fixture pack |
| 22. Tests passing | 365 full-suite pass; 0 fail; 0 skip |
| 23. Real provider | Not performed; no key used or requested in chat |
| 24. Real-call cost | Unknown; synthetic arithmetic example $0.000525, not measured spend |
| 25. Cloudflare | Manual serving-project identity check, secrets/vars and enablement steps above |
| 26. Deployment | Separate branch; unmerged, undeployed, disabled by default |
| 27. Limitations | Hosted/mobile/browser and real-model quality unverified; bounded telemetry/outcome joins; proposals require review; no complete free-text anonymization |
| 28. Next increment | Synthetic provider + hosted mobile/approval certification before production enablement; then 1.1 evaluation refinement |
