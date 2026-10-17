# SMS Delivery Contract Reconciliation 0.3

Mandate `CF-SMS-DELIVERY-CONTRACT-RECONCILIATION-0.3`. Offline engineering audit and failure injection only. **Reconciliation accepted subject to exact-head tests; operational delivery integration BLOCKED by demonstrated gaps.** Passing characterization tests do not certify the unsafe behaviors they reproduce.

## 1. Verified baseline and change inventory

Refreshed GitHub refs before changes:

| Draft | Current head | Base | Disposition |
| --- | --- | --- | --- |
| #24 | `7248ce2eb2677c142c767a66a0d87c8dfebdac4a` | `6276412d7c317d66283159b5f4edbd0ea883e020` | Draft, unmerged; Cloudflare pause checkpoint preserved |
| #26 | `2bd96562f30941d00b5380c3bd49e7f5c8a4aa29` | `229b0f83db7f885c18940f7087ea6e6ce7cd4e7a` | Draft, unmerged; based on an earlier #24 head |
| #27 | `dd5362312a4a136e0cedbf4f94456f249637ecbb` | `2bd96562f30941d00b5380c3bd49e7f5c8a4aa29` | Draft, unmerged; direct baseline |

#27 exact-head CI refreshed: successful push run [38985650523](https://github.com/dhays4sports/CoverageFit/actions/runs/38985650523) and PR run [38985671591](https://github.com/dhays4sports/CoverageFit/actions/runs/38985671591), previously verified 716/716. This continuation is directly stacked on #27. No reconciliation rewrite of earlier branches is needed; the later #24 pause documentation remains on its own branch.

Only two files change: this report and `tests/sms-delivery-contract-03.test.mjs`. All server files, gateway semantics, existing tests, routes, migrations, feature flags and workflow configurations remain unchanged. The continuation draft PR body pins the exact publication commit and CI receipts, avoiding a self-referential hash in this document.

Governing contracts remain [North Star](../COVERAGEFIT_NORTH_STAR.md), [Roadmap 3.0](COVERAGEFIT-AUTONOMOUS-GROWTH-ROADMAP-3.0.md), [commitment engagement](CF-SIGNAL-COMMITMENT-ENGAGEMENT-1.0.md), [Dynamic Cadence](CF-SIGNAL-DYNAMIC-CADENCE-1.0.md), [SHADOW 0.2 acceptance](CF-ENGAGEMENT-CAPACITY-SHADOW-0.2-ACCEPTANCE.md), [hosted preflight](CF-ROADMAP3-HOSTED-VALIDATION-PREFLIGHT.md) and [operational gates](COVERAGEFIT-SIGNAL-OPERATIONAL-GATES-1.0.md). No strategic direction or engagement strategy is reopened.

## 2. Critical findings and precise boundaries

1. **Unknown submission is collapsed into `failed`.** `sendSmsThroughGateway` catches a thrown `sendRingCentralSms`, writes failed idempotency and fingerprint records, then rethrows. `ringCentralRequest` maps network rejection to `ringcentral_api_unreachable`; it cannot know whether the remote side accepted the request. The same key is denied, but its error explicitly suggests a new key. A new key bypasses the failed fingerprint. Test `acceptance then response loss` demonstrates two synthetic acceptances for one intended action.
2. **Idempotency is narrower than business-action identity.** The key hashes sender + recipient + caller key. It does not bind tenant, verified relationship, family, body, profile/context version or campaign authority. Same key with changed content returns the earlier result. Two different keys can both pass the fingerprint's non-atomic read/write; the barrier test demonstrates two submissions. A previously sent fingerprint also permits another workflow/key. These facts do not establish that every current caller misuses the contract; they prohibit using it alone as future dispatch exclusivity.
3. **`sent` is a local submission/registration label.** A successful HTTP response with a usable ID produces `sent`, including a stub response containing `messageStatus: SendingFailed`. The webhook normalizer discards `messageStatus`; the event inbox deduplicates by message ID, not receipt version. Repeated/out-of-order `Delivered`/`DeliveryFailed` bodies with that ID do not form a receipt reducer. No verified delivery/read/engagement conclusion follows from this registration.
4. **Reconciliation does not complete the original action identity.** Failure after provider acceptance but before provider registration leaves idempotency `processing` and fingerprint `pending`. Same-key replay holds indefinitely. A matching outbound event can create a provider registration and mark it seen, but does not atomically resolve that original idempotency row. After the ten-minute fingerprint window, a new key can submit again despite the old processing row. Failed fingerprints are excluded from matching late acceptance.
5. **The existing producer-approved SIGNAL route is more conservative.** `sms-signal-api.mjs` takes a shared thread lock, checks conversation revision and Copilot context where present, writes `sending`, and on exception clears the draft into `delivery_review` with “Do not retry blindly.” Do not replace this with the generic retry behavior. Generic `queueSmsRetry` excludes suppression/pause codes but accepts `ringcentral_api_unreachable`; `retryJob` generates a new key per attempt. Its authenticated operations entry point does not make unknown acceptance safe to retry.
6. **Unsuppressed is not affirmative permission.** `normalizeSmsConsent` defaults unknown legacy state to active/provider unknown; `smsPermissionSnapshot.allowed` means no known application/provider suppression. The generic gateway descriptor does not validate source rights or campaign permission fields. A synthetic appointment descriptor containing purchased provenance/false campaign permission still reaches the stub because those extra fields are not contract inputs. The future execution boundary must not infer SMS authority from this behavior.

These are reproducible integration blockers. **No runtime correction was applied:** the mandate permits only offline/test-only fixes that do not change live sending semantics. A separately reviewed correction is required before linking a real sender to the simulated governor.

## 3. Existing lifecycle and identities

Canonical implementation references: [`sms-outbound-gateway.mjs`](../server/sms-outbound-gateway.mjs) functions `validateOutboundDescriptor`, `writeFingerprintRegistration`, `writeProviderRegistration`, `channelPermission`, `sendSmsThroughGateway`, `resolveOutboundRegistration`, `markOutboundRegistrationWebhookSeen`; [`ringcentral-client.mjs`](../server/ringcentral-client.mjs) `ringCentralRequest`/`sendRingCentralSms`; [`d1-json-store.mjs`](../server/d1-json-store.mjs) `setJSON`.

| Existing persisted object/state | Actual meaning and transition | Atomicity, crash and replay |
| --- | --- | --- |
| Caller descriptor | Recipient, body, origin, workflow, reply route, ownership effect/target/context; validated enums | Not an E2-approved action or affirmative consent record; no durable admission by itself |
| `sms-outbound-idempotency/…`: `processing` | Reserved before fingerprint/provider request using `onlyIfNew` | Unique insert if store honors contract. D1 JSON store uses plain INSERT against record key. No lease, submission-stage distinction or multi-record transaction |
| Fingerprint: `registered` | External registration without gateway submission | Ten-minute matching window, not a capacity reservation or global delivery lock |
| Fingerprint: `pending` | Gateway registration before attempted provider call | Sender + recipient + normalized whitespace/body hash. Workflow/tenant not in key. Read then upsert is not atomic exclusion |
| Idempotency/fingerprint: `failed` | Exception in preflight reload or provider request try block | Does not distinguish proven non-submission from unknown acceptance. Failure-record writes are best effort; same key holds, different key may proceed |
| Provider registration: `sent` | Usable provider ID returned or associated by outbound event | Provider-ID record uses `onlyIfNew` on initial submission; separate writes update fingerprint, conversation and idempotency. Partial completion possible |
| Idempotency: `sent` | Last successful gateway persistence step; provider ID/registration ID stored | Same key deduplicates, without verifying new caller body/workflow equality |
| `webhookSeenAt`, `status: sent` | Outbound event matched registration by provider ID or fingerprint | Upserts association; no delivered/read reducer, no original-idempotency reconciliation transaction |
| SIGNAL draft: `sending` → `sent` / `delivery_review` | Producer-approved reply lifecycle above gateway | Thread lock and revision guard; uncertainty becomes explicit manual review, not automatic retry |
| Generic retry: `pending` → `sent` / `pending` / `failed` / `suppressed` | Operations retry job with bounded attempts | Separate job identity and new gateway key each attempt; no common business-action unknown-outcome fence |

`idempotencyKey` is not forwarded as a provider idempotency header/body field by `sendRingCentralSms`; that body contains from/to/text only. This is a repository observation, not a claim about RingCentral's possible external capabilities. Provider-ID keys are store-wide; sender/account/tenant isolation depends on the store boundary and is not established by the prefix. Fingerprints normalize whitespace, not business intent. Conversation IDs hash phone pair plus configured secret; they are channel relationships, not proof of an E2 verified prospect identity or tenant authorization.

## 4. End-to-end owner and compatibility matrix

| Boundary / SHADOW concept | Canonical component | Existing guarantee and evidence | Missing guarantee / required next step |
| --- | --- | --- | --- |
| Source admission and current profile | `prospect-memory-local.mjs`, `prospect-memory-projection.mjs`; E2 fixtures | Local transactional event admission, exact source refs, replay, retention/identity/version rules; existing E2 tests | No accepted hosted ingestion path or automatic bridge from every live SMS event into E2 |
| Due evaluation and decision | `signal-evaluation-queue-local.mjs`, `signal-dynamic-planner.mjs` | Local SQLite revision/generation/context fences, bounded claims/leases, transactional result/candidate publication; `evaluation-queue-c2.test.mjs` | Evaluation identity is NOT authorized SMS work identity; no provider capacity or submission transaction |
| Engagement approach | `proposeSignalEngagement`; `engagement-capacity-shadow.mjs` | Pure SHADOW advisory with false execution flags; supplied permission/owner assumptions; 34 existing tests | An invitation/slot is not send authorization; do not route simulator output directly into gateway |
| Workflow ownership | `sms-ownership.mjs`, `sms-orchestrator-core.mjs`, `sms-safety-core.mjs` | District CONTROL/SIGNAL guards, AgencyZoom template/context holds, producer takeover, explicit first-party workflow; `sms-ownership.test.mjs` | No ability to cancel an independent AgencyZoom cadence. Future family transfer requires agency approval, cancellation receipts and one owner epoch |
| Eligible contact | `sms-consent-core.mjs`, gateway `channelPermission` | Application/provider suppression, wrong-number signal, selected ownership checks and persisted reload | Affirmative purpose/source/sender/campaign permission, retention, verified relationship and current preference must be independently bound. Unknown legacy consent is insufficient |
| Pending message / admission | Gateway idempotency/fingerprint; current retry jobs | Per-key insert exclusion and short matching window | Durable business-action identity and unknown-outcome fence across keys/families; no competing sender engine |
| Sender capacity/windows/recipient spacing | SHADOW 0.2 only | In-process rolling reservations, priority, expiry, recipient gap, explicit unknown-traffic hold | No shared durable sender reservation, real traffic accounting, production clock/window or circuit-breaker enforcement in generic gateway |
| Provider submission | `sendSmsThroughGateway` → `sendRingCentralSms` | Existing sole guarded transport, stored preflight safety reload and provider ID registration | No atomic transaction with external provider; final local check cannot retract an already in-flight request. Need explicit unknown state and fenced attempt |
| Receipt/replay | `ringcentral-sms-connection-core.mjs`, `ringcentral-webhook-recovery-core.mjs` | Authenticated inbound/outbound ingestion, message-ID dedup, conversation lock, history replay/cursors | No monotonic delivery receipt model. Message ID dedup hides later status versions; stale crash locks need governed recovery |
| Customer reply / next decision | Webhook → ownership/compliance → SMS SIGNAL or vertical journey; E2/C2 separate | Existing inbound updates invalidate SMS drafts; SHADOW reply cancels scheduled synthetic work | No accepted end-to-end live inbound → E2 → C2 → authorized sender loop; define explicit identity/source adapter rather than duplicating facts |
| Producer commitment | `sms-callback-scheduling-core.mjs`, SHADOW availability model | Existing uncertain scheduling handoff and no repeated scheduled acknowledgments; `production-sms-safety.test.mjs` | Synthetic offered slots are not calendar bookings; future execution needs actual availability/booking evidence and separate authority |

C2 uses `BEGIN IMMEDIATE` local transactions, unique scoped rows, generation and token leases, bounded retries, lease recovery, profile digest/context checks, and source-triggered invalidation. Its `acknowledge` rebuilds the decision and commits evidence references/result/candidate together. Reuse these **properties** and canonical revisions; do not turn its READY/LEASED/IDLE/FAILED evaluation state into transport states. Releasing an expired evaluation lease is safe because evaluation has no external side effect. Releasing an expired sender lease after submission is not safe without reconciliation.

## 5. Safety and persistence limits

Gateway `channelPermission` runs before reservation and again after persisted conversation reload immediately before the provider call. Tests prove STOP/provider opt-out/takeover before that call prevent submission; STOP/takeover written during the stubbed call survives final conversation persistence. The already-started provider request still occurred. This is honest race handling, not cancellation of a transmitted message. The producer SIGNAL shared lock also serializes webhook handling; it can delay processing a STOP event until after a submission. Any future claim of immediate suppression must define the linearization point and distinguish received, persisted and provider-in-flight events.

Store writes are individually durable operations only if the deployed adapter/binding actually fulfills that contract. `createD1JsonStore` uses unique inserts/upserts but provides no transaction joining action, rate reservation and gateway registration. Mock CAS tests prove caller behavior with a conforming store, not hosted consistency. Webhook event inbox and thread lock are separate keys; event processing can leave partial state or a stale lock on process death. Recovery skips existing message IDs and is not evidence that every processing-state crash is automatically recovered.

Provider transport status must remain separate from customer reply, useful conversation, quote-ready handoff, verified quote/bind or economics. `SendingFailed`/`DeliveryFailed` strings in these tests are synthetic input labels; the actual subscribed event shape, delivery lifecycle and available authoritative reconciliation evidence remain externally unverified. No live provider API, account inventory or history was accessed for this audit.

AgencyZoom: observed outbound templates and district enrollment enforce local holds. They do not disable independent agency jobs. Before any future transfer, obtain authority for the exact family/cohort, inventory pending legacy jobs, cancel or suppress them with receipts, confirm the effective owner version and retain rollback that cannot re-enable two owners. Unknown external/manual sender usage requires conservative reservation or hold; a local limiter cannot constrain unobserved traffic.

## 6. Failure-mode register and test receipts

`tests/sms-delivery-contract-03.test.mjs` adds **18** focused tests. Names prefixed **GAP** deliberately assert current missing guarantees; a green test is evidence of the blocker. Actual gateway/client/webhook functions are exercised with injected `fetchImpl`, fictional credentials, reserved 555 numbers and clone-on-read mock stores. No real HTTP is used. Existing suites are reused rather than duplicated.

| Required scenario | Evidence | Classification / result |
| --- | --- | --- |
| 1 Acceptance then response loss | New `acceptance then response loss` | **Missing deterministic guarantee:** unknown marked failed; new key duplicated synthetic acceptance |
| 2 Timeout/unknown acceptance | New `unknown timeout…` | **Partially implemented:** same-key hold; no cross-key unknown fence |
| 3 Rejection before acceptance | Same test, explicit stub rejection | **Already tested** failed recording; failure taxonomy still conflates unknown |
| 4 Same-identity duplicate submission | New concurrent/replay test | **Already guaranteed and tested** with store atomic unique insert |
| 5 Same content/different context | New content/workflow and race tests | **Missing deterministic guarantee:** workflow intent not business identity; two keys can race |
| 6 Stale profile during submission | New stale-fields test; C2 stale-ack and SIGNAL approval revision tests | **Partially implemented:** guarded in those callers, not generic gateway/E2 dispatch boundary |
| 7 STOP before send | New pre-submission and stored reload tests; existing ownership tests | **Already guaranteed and tested** on examined paths |
| 8 STOP in flight | New in-flight STOP test | **Partially implemented:** suppression preserved, one request already submitted; not recall |
| 9 Late provider opt-out | New after-fingerprint suppression test | **Already tested** persisted suppression reload; actual provider event ingestion unknown |
| 10 Producer takeover | New before/in-flight tests; production safety suite | **Already tested** persisted pause; external in-flight request remains |
| 11 AgencyZoom competition | `sms-ownership.test.mjs`: exact templates, stale snapshot/retry, district CONTROL | **Partially implemented / external agency authority:** local holds, no cancellation of independent AZ jobs |
| 12 Duplicate/out-of-order receipts | New actual webhook test; existing history replay tests | **Missing deterministic guarantee:** message-ID dedup is not versioned receipt reconciliation |
| 13 Conflicting outcome evidence | New webhook/status test; SHADOW receipt test | **Missing deterministic guarantee:** simulator handles conflict, live reducer absent |
| 14 Capacity reduction after admission | SHADOW `reductions and outage…` | **Requires durable hosted infrastructure:** synthetic only |
| 15 Competing sender dispatchers | SHADOW competing claims; new different-key gateway race | **Requires durable hosted infrastructure:** no production shared atomic sender budget |
| 16 Restart pending submission | New serialized-store restart test | **Partially implemented:** same-key processing hold; no safe lease/reconciliation completion |
| 17 Unknown prevents unsafe retry | New timeout/new-key/expired-fingerprint/retry admission tests; SIGNAL `delivery_review` source | **Missing guarantee in generic path**; producer SIGNAL review is conservative |
| 18 Explicit reconciliation | New registration reconciliation test | **Partially implemented:** provider association succeeds, original action remains processing |
| 19 Reply cancels obsolete follow-up | SHADOW reply/generation tests; `sms-signal.test.mjs` subsequent inbound interrupts qualification | **Already tested locally**, no hosted E2 sender integration |
| 20 Multiple families/relationship | SHADOW frequency test; new different-workflow tests | **Partially implemented:** shared synthetic recipient spacing, gateway has no durable family/action fence |

Additional source checks: gateway request body contains no propagated provider idempotency identity; webhook normalized event omits delivery state; `sms-operations-core.mjs` retries use attempt-specific keys; `sms-signal-api.mjs` keeps uncertain producer approvals in review. These conclusions are scoped to the inspected implementation, not a provider capability certification.

Reproduce:

```sh
node --test --test-isolation=none --experimental-loader ./tests/json-loader.mjs tests/sms-delivery-contract-03.test.mjs tests/production-sms-safety.test.mjs tests/sms-ownership.test.mjs tests/engagement-capacity-shadow.test.mjs tests/evaluation-queue-c2.test.mjs
node --test --test-isolation=none --experimental-loader ./tests/json-loader.mjs tests/*.test.mjs
```

Local validation on the published source tree: **18/18 new characterization tests, 130/130 focused checks, 734/734 full-suite tests; zero failures/skips.** Full-suite duration 20.028 seconds on Node 24.19.0. Prior 716 tests are retained unchanged. Publication SHA and exact-head push/PR CI receipts are pinned in the continuation PR body after completion. No benchmarks were rerun because simulator/runtime code did not change.

## 7. Minimum durable accounting proposal — NOT implemented

Use one governed action identity upstream of the **existing gateway**. Reuse E2 profile/source identities, C2 committed decision provenance, existing conversation IDs, descriptor, provider registration and audit conventions. Extend the current persistence boundary only after isolated atomicity tests; no new transport, conversation brain or production queue is proposed here.

| Required field/property | Existing reusable field | Proposed addition or stronger invariant |
| --- | --- | --- |
| Action identity | Caller idempotency key; C2 decision ID/generation | Stable immutable `action_id` scoped by tenant + verified relationship + approved family + business intent. Same action survives retries/worker restarts; changed payload under same identity rejected |
| Authority | Gateway origin/workflow/reply/ownership descriptor | Actor/approval reference, source-purpose rights, affirmative SMS permission, campaign/sender authorization, owner epoch; verified record access independently enforced |
| Evidence | C2 profile version/revision, context version, decision reference | Bind action to those references and allowed evidence-use lifetime; revalidate immediately before governed submission |
| Timing | C2 due time, SHADOW eligibility/expiry | Distinct evaluation, earliest permitted contact, deadline, reservation and attempt times; expiry cannot grant retry |
| Exclusive claim | C2 token/worker/lease pattern | Durable action token/fence; expired pre-submission claim recoverable, expired in-flight attempt becomes unknown, never automatically sendable |
| Capacity | SHADOW rolling sender history/reservations | One atomic check-and-reserve across action claim, sender/campaign budget and recipient spacing. Unknown external usage held; reservations counted conservatively after uncertainty |
| Attempt identity | Gateway idempotency, fingerprint, registration ID | Immutable attempt linked to action before external request; payload digest, claim fence, start marker and reconciliation evidence. Persist mapping to existing gateway key, not a fresh unrelated retry identity |
| Provider identity | Existing provider-message registration | Link account/sender + provider ID to exact attempt; prevent cross-tenant/account association; fingerprint only candidate evidence, never unique proof of acceptance |
| Submission outcome | Existing processing/sent/failed; SIGNAL delivery_review | Proposed explicit `NOT_SUBMITTED`, `SUBMISSION_IN_PROGRESS`, `ACKNOWLEDGED`, `OUTCOME_UNKNOWN`, `PROVEN_REJECTED`, `CANCELED`, `EXPIRED` distinctions. These labels do not exist as a complete current gateway state machine |
| Receipt state | Existing webhookSeenAt | Separate append-only, versioned/ordered evidence of supported provider status; conflicting evidence holds. Delivery/read/engagement never inferred from local submission label |
| Recovery | Existing history reader, registration matching and audits | Explicit audited resolution tied to original action/attempt. Proven acceptance binds provider ID and closes submission uncertainty without resending; proven non-acceptance permits a separately guarded attempt; insufficient evidence remains held |
| STOP/takeover | Existing suppression and orchestration | Invalidate unsent claims and preserve authority across all writes. In-flight attempts retain history and prohibit further autonomous work, not fictional cancellation |
| Operator/rollback | SIGNAL delivery_review, existing ops audit | Scoped reconciliation decision with actor, evidence and CAS; no deletion of uncertainty to unblock sending. Default-off adapter; disable admission first, retain unresolved attempt and suppression history |

Atomic invariants: (a) at most one active submitting attempt per action, (b) capacity and recipient reservation consumed exactly once by that fenced attempt, (c) lease loss cannot mint a replacement submission while acceptance is unknown, (d) all retries share the original action history, (e) any safety/owner/rights change fences unsubmitted work, (f) no completion claims without independent outcome evidence. There is no database transaction that can atomically commit the remote provider operation with local records; recovery must explicitly account for that uncertainty.

Least-complex option: extend the existing repository/gateway accounting boundary with one scoped action/attempt ledger and an atomic reservation operation, proven first in isolated local SQLite. Reusing JSON keys alone cannot supply the demonstrated multi-record CAS guarantees. A single serialized hosted authority could also satisfy the properties, but choosing D1 patterns, Durable Objects or another runtime now would assume unverified account constraints. Do not select/provision infrastructure until the separately paused hosted inventory resumes by instruction. No schema or hosted adapter is implemented in 0.3.

## 8. Disposition, gates and one next milestone

**Offline reconciliation: complete when the exact-head full suite is green. Delivery integration: NOT ACCEPTED.** The blockers above are deterministic code findings, not excuses to request Cloudflare access. Hosted store atomicity, actual provider acknowledgements/status availability, campaign authority, source rights and agency transfer remain additional independent gates. No conversion or producer-economic outcomes were measured.

**One recommended next milestone:** an explicitly authorized, test-isolated durable action/attempt accounting prototype around the existing gateway contract, using file-backed SQLite and synthetic provider stubs. Prerequisites: approve the uncertainty taxonomy and single action identity above; keep production adapters/routes disabled and runtime sending semantics outside scope. Acceptance: crash after acceptance cannot produce a second submission under any key; competing processes cannot exceed sender/recipient reservations; stale owner/evidence/STOP fences work; explicit evidence-based reconciliation completes the original attempt; retry is possible only after proven non-submission and renewed authority. No hosted implementation choice, production migration or live send is included.

Rollback for this PR is removal of the two added test/document files. No application behavior or external state changed. Keep #24/#26/#27 and this continuation draft/unmerged. Cloudflare inventory remains paused at its existing checkpoint; RingCentral account diagnosis, real history, CRM/calendar writes, communications, deployments, migration, purchases and live canaries remain unauthorized. Automatic Preview artifacts from branch publication are not permission to exercise them.
