# CF-ADAPTIVE-INTELLIGENCE-3.0 — engineering acceptance

2026-10-14. Scope: isolated local SQLite and synthetic SHADOW; no hosted or economic acceptance.

## Decision

**E2 restart/replay milestone implemented and locally accepted. C1 deterministic no-send planner implemented and locally accepted. P0 designated read paths corrected and locally regression-tested.** Nothing is merged or activated. Exact final GitHub commit and Actions run are recorded in the accompanying draft PR acceptance body, so this document does not create a self-referential commit-hash loop.

Bottleneck addressed: a subsequent producer recommendation previously depended on transient evidence and some reads silently mutated operational state. The new persisted evidence changes subsequent recommendations without repeated known questions. No useful-conversation, premium, producer-time saving or live delivery improvement has yet been demonstrated.

## Verified graph and reconciliation

| Ref | Verified head / disposition |
|---|---|
| main | `5f47f2b7367110ca04ff03cc189983f136ab32fa`, untouched |
| draft #7 | `ad2915a7889637580505293ce38ab4db66f0a9b3`, untouched; base main |
| draft #16 | `5cfa79f4d01a8d9a3bf558c44d019064ca477f2a`, untouched; base #7 |
| prior draft #17 | `299216f4dcbfea2416348835a8234222aa592629` |
| reconciled draft #17 | `247b708d2615c0caa72d2a95402a59507ccf9b45`, two-parent integration commit preserving both prior #17 and current #16 |
| E2/C1/P0 draft | `engineering/adaptive-memory-e2-20261014`, child of reconciled #17; no merge into main |

Reconciliation tree `3dd1953085eb4355702f1823cc0e2aadd36b2782` exactly equals the locally tested merge tree. Only seven documentation/guidance files changed relative to original #17. All three original E1 files were preserved byte-for-byte at the reconciliation boundary. Full reconciled baseline: **556 passed, 0 failed**. No history rewrite, dropped branch work or PR merge. CLI push lacked credentials; equivalent GitHub Git-data operations created the same tree and ordered parents through the connected authorized app.

## P0 read/write correction

- `producer-workspace.mjs`: population stays a pure source-derived classification. Existing stored WEB_DIRECT fallback remains readable; a GET does not insert/update classification rows. No new persisted population copy is necessary.
- `universal-customer-profile.mjs`: detail reads established links; missing links return `not_initialized`, with candidates explicitly not auto-merged. `ensure` remains an explicit operation used by existing create/sync/link paths.
- `solo-desk-repository.mjs`: detail still derives FIV and Opportunity Priority but does not save projections/calibration baselines. Existing explicit ingestion/refresh/backfill methods remain the persistence paths.
- `solo-desk-api.mjs` and `acquisition-measurement.mjs`: calibration, daily and summary reads no longer implicitly reconcile measurements. Existing explicit refresh/reconcile APIs remain available internally. Reports reflect materialized evidence; callers needing refresh must invoke the existing mutation path, not a GET. This changes cache-warming semantics deliberately.
- `producer-command-center.mjs`: inspected; it consumes workspace reads and needs no additional mutation removal. No per-request E2 evaluation added.

Regression: real migrated SQLite, twelve seeded fictional fixtures, every table snapshotted before/after **12 GET paths**, plus `total_changes()` equality (also catches writes restored to identical values): producer-work, command-center, producer-detail, Prospect 360, selected review, profile, record, next-best-action, FIV calibration, priority calibration, acquisition summary, economics summary. All return 200 without a database write.

Three older tests now materialize explicitly or assert pure classification; business assertions remain. The nine-case preview fixture test explicitly refreshes score projections during fixture ingestion instead of depending on detail GET to warm them. Existing list views still use materialized scores; incremental refresh completeness is a follow-on, not a claim that every historical source mutation already refreshes every cache.

## E0 schema reuse and E2 implementation

Audit found:

| Existing primitive | Reuse / missing capability |
|---|---|
| `cf_solo_opportunities`, `cf_solo_sources` | Authoritative opportunity and source anchors; mutable source summary is not an append-only assertion history |
| `cf_ucp_opportunity_links`, customers/households | Established scoped identity; no phone-based merging or second prospect table |
| `sms_conversations` and source pilot/continuation links | Existing communication state; not copied or modified by E2 |
| `prospect-360-readonly.mjs` | Existing read projection preserved; E2 is not connected to real Prospect 360 routes |
| tasks, commitment projection, `cf_solo_activity` | Existing operational commitment/activity authority; C1 consumes explicitly confirmed commitment scenarios |
| source replay keys / acquisition measurements / effort records | Retained; new event revisions are narrower than source-summary upserts; no fabricated economic outcomes |

`server/prospect-memory-local.mjs` accepts an actual SQLite connection and requires `syntheticOnly:true`. No production module imports it. Its SQL follows existing scoped relational patterns, but its synchronous transaction adapter is **local-only**, not a certified D1 runtime adapter.

`tests/migrations/0020_prospect_memory_e2.sql` is deliberately **outside production `migrations/`**. It creates event, assertion, revision, payload-free hold and metadata-only decision tables. There is no second customer master, live queue, hosted migration or automatic D1 binding.

Capabilities proven: namespace-stable event hashes; atomic event/assertion/revision admission with `BEGIN IMMEDIATE`; duplicate/collision handling; existing source/UCP reference validation; typed fields; original source reference and observed/received timestamps; mandatory retention and controller/internal-use rights; default-deny transfer/secondary commercial use; imported/customer/producer/document/inference labels; field-specific sourced supersession; contradictory renewal holds; deterministic as-of projections; future and stale evidence handling; scoped identity-change hold; retention filtering plus explicit bounded erasure; restart recovery; decision/evidence version trace.

Document labels require both a document reference and a separately admitted matching producer-confirmation event. Model assertions remain `INFERRED`, never customer verification or a CALL request. This is synthetic provenance validation, not actual policy-document review or legal validation of data rights.

Supersession has an effective timestamp and survives deletion/retraction of the correcting event, preventing old corrected facts from silently becoming current again. Event tombstones prevent replay resurrection; assertions and derived decision traces are removed on erasure. Original source stores and backups remain under their own retention policy; local logical deletion is not a claim about hosted backups or physical media erasure.

Projection reads use a coherent SQLite transaction. Recording a decision rechecks the version inside a write transaction. No full profile copies are persisted, avoiding extra retained PII. Version hashes include scoped facts, revision, clock, identity and collision state. Read-only as-of reconstruction can no longer reproduce payloads that have legitimately been erased.

## Acceptance tests

Final local suite: **569 passed, 0 failed, 0 skipped** (556 prior tests + 12 E2/C1 tests + one all-table GET regression). See draft PR for final exact-head CI.

The central test executes all 15 required steps: creates a temporary file-backed SQLite database with real migrations; seeds fictional established source/UCP identity; admits imported carrier; produces missing-renewal recommendation; closes connection; reconstructs runtime; reopens the same file; replays original event; verifies one event/one assertion; admits customer renewal and vehicle count; reprojects; changes next question to homeowner; admits explicit call request; verifies internal CALL and no repeated known question; persists one idempotent decision trace. Fetch is trapped and zero calls observed; the modules have no provider/action adapters.

Additional real stored-state assertions cover transaction interruption, four independent worker connections simultaneously admitting one event (one admission, three duplicates, one revision), renewal conflicts, scoped field corrections, cross-prospect corrections rejected, source-ID collisions, ambiguous/shared-phone identity rejected, cross-workspace isolation, out-of-order/future evidence, expiration/retraction, no resurrection, source rights, document-verification prerequisites, inference, stale clocks/decisions, STOP/wrong-number, CONTROL/TEST, takeover, AgencyZoom/unknown owner, missing SMS permission, purchased-list restrictions, callbacks, month precision, quote intent and wait restrictions.

## C1 behavior and limitations

`server/signal-dynamic-planner.mjs` is pure and has no imports or I/O. It consumes versioned current evidence and a controlled clock, explicit workflow-owner/contact/takeover state, confirmed commitments and a renewal-window policy. It returns action, reason category, missing fields, scoped evidence references, producer attention, hold state, next evaluation time/event and **separate always-false execution eligibility**.

Known answers are not repeated. Missing SMS permission retains valid internal CALL/quote-review intelligence. STOP and CONTROL remain stronger than intent; ambiguous identity/conflicts hold; takeover suppresses competing planning. Callbacks and contact waits are honored. Evaluation time is never a send time. AgencyZoom ownership is never altered. Quiet hours/provider readiness are not modeled as live execution gates because there is no execution path; they remain necessary before any later outbound authorization.

## Incremental evaluation — designed, not implemented

Smallest next milestone: **C2 test-only revision-safe evaluation queue**, still local SQLite and SHADOW. Proposed single row per `(workspace_id, opportunity_id)` containing target evidence revision, due time, reason flags, claim token, lease expiry, attempt count and last error. No message payload, send state or provider job.

- Admission/correction/identity-safety/outcome mutations atomically upsert work at the newest revision. Expiration and confirmed callbacks add justified due times; an explicit governed recompute pages by stable key.
- Index `(workspace_id,due_at,opportunity_id)` plus lease expiry; claim at most a configured batch using transactional conditional update. Never scan/recompute all prospects on Command Center GET.
- Worker reads current evidence/identity/owner, computes C1, then conditionally records/acknowledges only if claimed target revision still matches. Evidence arriving during evaluation leaves the newer queue item pending. Duplicate triggers coalesce.
- Expired leases recover crashes; bounded exponential retry and attempt cap expose an exception, never send. Terminal STOP/control/takeover decisions are stored internally with no execution eligibility. Stale clock and expired evidence are rechecked on claim.
- Measure due-item lag, rows claimed/evaluated, revision retries, failures, time and memory. Acceptance: duplicate triggers, concurrent claims, stale acknowledgment, worker death/restart, owner-change race, paging and bounded work at 1k/5k/20k/50k synthetic profiles.

This cycle benchmarks synchronous evidence admission and evaluate+decision recording, **not a queue worker or Command Center throughput**. Existing Command Center 5,000-record guard is unchanged.

## Decision feedback — partial implementation, remaining design

Implemented decision metadata: deterministic ID, profile version, as-of time, action, reason category, exact evidence keys. No acceptance/override/send/reply/outcome is invented.

Next durable outcome contract should extend existing `cf_solo_activity`/effort/acquisition primitives with a decision ID, actor, acceptance/override category and reason, independently sourced outcome reference and observed time. Use existing effort evidence for producer minutes/correction effort; existing verified recommendation/policy evidence for quote/bind/premium. Proposal, synthetic reply and message count must never count as economic progress. Primary operating metric remains producer minutes per genuine useful conversation; no scoring-policy self-modification. Aggregate market intelligence stays parked; profiles remain private.

## Release gates and rollback

**BLOCKED — EXTERNAL CLOUDFLARE ACCESS REQUIRED FOR RELEASE VERIFICATION:** actual production branch/automatic publish effects, deployed exact build, bindings, secrets/flags, database isolation, rollout/rollback and hosted regression acceptance of this changed runtime. Prior 19/19 hosted acceptance belongs to unchanged historical runtime `d8083570c0425371c67b1bae74813ec6c50a9be6`, not this implementation.

**Blocked by other external authority/evidence:** real-source data/retention rights and intake approval; approved hosted D1 transaction adapter/migration; real RingCentral inbound/receipt certification and applicable sender/provider policy; agency workflow-family ownership/transfer; any customer communication or production activation. No such operations occurred.

**Deferred:** live evaluation scheduling, all outbound automation, real datasets, economic claims, adaptive scoring promotion and market-intelligence commercialization.

Rollback in this engineering phase: keep all draft PRs unmerged, discard temporary databases, or revert the scoped engineering commit. No deployed state or production migration needs reversing. Before any merge that may auto-publish, obtain separately approved release effects. No owner intervention is needed to continue C2 local engineering.

## Reproduction

```sh
node --test --test-isolation=none --experimental-loader ./tests/json-loader.mjs tests/*.test.mjs
node scripts/benchmark-prospect-memory-local.mjs 1000 5000 20000 50000
```

Measured results are appended below and preserved in `docs/evidence/CF-E2-local-benchmark.jsonl`. These synthetic records have one event with two assertions; larger per-prospect histories, real data distribution, hosted D1 latency and production load remain unmeasured.

| Records | Admission/sec | Evaluate + record/sec | Total seconds | CPU seconds | End RSS MiB | DB MiB |
|---:|---:|---:|---:|---:|---:|---:|
| 1,000 | 3,163 | 1,691 | 0.96 | 0.99 | 81.3 | 5.5 |
| 5,000 | 2,984 | 1,725 | 4.90 | 5.04 | 137.4 | 24.2 |
| 20,000 | 3,045 | 1,677 | 19.96 | 20.19 | 251.9 | 95.0 |
| 50,000 | 2,954 | 1,720 | 49.67 | 49.68 | 451.5 | 237.1 |

Node 24.19.0, file-backed SQLite DELETE journal, one sequential local process, default synchronous setting. RSS is an end-of-run observation, not peak memory or an isolated per-size allocation. All sizes verified exactly N events, 2N assertions and N decision traces. Two indexes (assertions by event and subject-specific expiry) removed measured repeated lookup scans. No network/provider operations or incremental spending.
