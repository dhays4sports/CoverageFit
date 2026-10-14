# C4 producer intelligence integration — engineering acceptance and readiness

**Subsequent consolidation:** [Roadmap 3.0 integration readiness](CF-ROADMAP-3-INTEGRATION-READINESS.md) verifies the full stack and reproduces the remaining global-priority selection and D1-portability blockers. This document retains C4's scoped local acceptance. Producer Integration C4 is not the unapproved Dynamic Cadence C4 communication canary.

Base: draft #20, `0098c34b5dc25d1c35816ed8c9b30f606f48a76d`. Exact C4 commit, draft PR, tested tree and exact-head CI receipt are recorded in the accompanying PR body. This closes the local source → durable memory → queued evaluation → current decision → existing producer read-contract handoff. It does not certify a deployed intelligence service or economic uplift.

## Reconciled contract

| Concern | Meaning | Authority |
|---|---|---|
| Decision validity | C3 CURRENT only; evidence, context, identity, generation and timing checks still govern | Existing E2/C1/C2/C3 snapshot |
| Human attention | Explicit `human_attention_eligible`; existing Attention bands and action-quality vocabulary | Internal review, never contact permission |
| External execution | SMS, call, calendar, CRM and external flags remain false | No execution authority provided |

The prior C3 bridge always set top-level action-quality/attention actionable false, hiding valid handoffs from Today. C4 makes those **visibility/attention fields** true only for CURRENT producer-worthy recommendations and labels their scope `INTERNAL_REVIEW_ONLY`. The nested action remains non-executable, channel/due-at remain null, and the rendered Today contract's `actionable` remains false with explicit human attention true. A customer-requested CALL or quote request uses the existing NOW band/rank; other justified quote work uses TODAY. Waiting/question/close guidance does not become urgent producer work. No new score or business stage is introduced.

AgencyZoom-owned intelligence may justify internal producer review without granting CoverageFit cadence ownership. Missing SMS permission is retained separately. STOP/opt-out, wrong number, CONTROL/TEST, takeover, identity/source holds, unknown owner and existing authoritative record restrictions override handoffs. Closed underlying opportunity records cannot surface contact work.

PENDING, STALE, HELD, FAILED and UNAVAILABLE expose no old action. Held/failed/unavailable records have restricted-review/evaluation-exception context; none enter Today or fabricated Inbox drafts. Exceptions may be inspected through existing detail/Work contracts; no new dashboard or navigation is added.

## Runtime-neutral boundary and existing consumers

- `producer-intelligence-contract.mjs`: runtime-neutral reconciliation and explicit SHADOW authority. It replaces legacy `action_quality`, `actionQuality`, `sms`, continuation, NBA and priority fallbacks for governed records. It preserves source references only for valid current recommendations. Prior E2 audit records remain governed by their existing retention rules.
- `producer-intelligence-read.mjs`: trusted-server authorization and adapter interface, bounded page/detail/Today/Prospect 360 composition. No Node SQLite/crypto imports. The authorizer supplies workspace, actor and either workspace-read scope or an explicit record allowlist; client workspace parameters confer no authority. Denials happen before store invocation. Returned record/workspace/decision IDs and clock must match; foreign or malformed envelopes fail closed.
- `producer-intelligence-local.mjs`: synthetic-only adapter, actual file-backed SQLite read transaction encompassing display record and C3 state. Required schema columns are checked without DDL/repair. It reuses the existing scoped UCP range index and performs at most limit+1 key selection; no 5,000-record dependency. C3's snapshot reader is reused, not replaced.
- Existing Producer Workspace and Command Center gain an explicit **server-injected** read seam. Without injection, prior behavior remains unchanged. No environment flag, request parameter or client payload can install the adapter. Hosted HTTP routes do not inject it.
- Existing Attention, Action Quality, Command Center and Prospect 360 projections recognize governed current-decision state and reject legacy-action fallback. The conservative C3 bridge delegates to the same neutral contract.
- Minimal existing UI guard: a governed decision field, including null/unavailable, prevents legacy SMS/Copilot/continuation/calendar/CRM mutation panels from mounting. Existing read-only detail/Prospect panels remain. Cursor handling accepts bounded page continuation; labels identify page-local totals. Today rows only open detail. No new UI surface is introduced.

**Adapter contract:** `CF-PRODUCER-INTELLIGENCE-READ-1`; initialized store with `read(scope,id,clock)` / `page(scope,cursor,limit,clock)` envelopes, authoritative scoped record and C3 decision from a consistent read. This implementation accepts only the local synthetic adapter with SQLite snapshot semantics. A D1-labeled adapter is explicitly rejected as `HOSTED_ADAPTER_NOT_ACCEPTED`. Matching SQL or an adapter string is not proof of hosted read consistency. Missing store, incompatible contract, missing columns and failed/uninitialized adapters yield explicit unavailable results, never legacy fallback.

Default page 25, maximum 100. Filters/search/counts/ranking apply to the selected bounded page, with a cursor retained even when the filtered page is empty. They are **not** global counts, global urgency ranking or a full-inventory search. The legacy non-C4 pilot inventory path remains unchanged. C4 does not add a provider Inbox adapter or fabricate SMS messages from evidence events.

## Persisted acceptance

Full local suite: **634 passed, 0 failed, 0 skipped** (609 prior +25 C4). Command:

```sh
node --test --test-isolation=none --experimental-loader ./tests/json-loader.mjs tests/*.test.mjs
```

Actual E2/C1/C2/C3 file-backed fixtures verify:

- Admission → PENDING → durable evaluation → CURRENT CALL/quote → Workspace/Today/Prospect 360 internal handoff, with matching stored revision and decision/source references.
- Current waiting/question/close remain nonurgent. New evidence, exhausted retries, suppression, CONTROL, unknown owner, identity change and takeover remove old actions immediately.
- Deliberately poisoned legacy SMS CALL, NBA, continuation, action-quality and attention fields cannot restore old work through any producer projection.
- Real producer-token authorizer integration with server-fixed tenant scope; missing authorization, cross-tenant ID, record allowlist denial and forged adapter page/workspace envelopes fail closed. Unauthorized requests invoke the store zero times.
- Missing/incompatible/failed/uninitialized/uncertified-hosted adapter, partial migration, incompatible revision column, mismatched snapshot clock and inconsistent evidence/context state never authorize a fallback action.
- Reopened read-only SQLite connection, bounded cursor traversal, source-backed GET read harness, all-table snapshots, SQLite change counters and forbidden-network trap show zero writes or external calls. Existing designated hosted-handler-equivalent GET regressions remain passing.
- Existing C2 concurrency/SIGKILL/recovery and C3 restart/freshness regressions remain passing. No new worker or execution mechanism is introduced.
- UI gate tests consume real C4 records and verify mutation panels remain disabled; modified browser modules pass syntax checks. This is **not** a browser visual or hosted UI acceptance claim.

The initial exact-head CI run exposed a scheduling-sensitive assertion in the pre-existing Copilot concurrency test: it assumed exactly one promise must reject, although a second request may legitimately return the completed cache. The test now holds a synthetic provider operation in flight, verifies duplicate rejection and one invocation, then explicitly verifies later cached reuse without another invocation. No Copilot runtime behavior or provider operation was changed.

## Measured read overhead

Reproduce with `node --experimental-loader ./tests/json-loader.mjs scripts/benchmark-producer-intelligence-local.mjs`. Raw evidence: `docs/evidence/CF-C4-read-overhead.jsonl`. Each dataset uses real admission and committed C2 decisions. Paired measurements alternate C3 and C4 order over 100 reads of the same 25-record page; C4 includes authorization, schema checks, record hydration and contract reconciliation. A separate cursor traversal verifies every scoped identity, at most 25/page. One initial seed identity lacks context and correctly remains unavailable.

| Synthetic prospects | C3 mean/page | C4 mean/page | Added mean | C4 p95/page | Full paged traversal |
|---:|---:|---:|---:|---:|---:|
| 1,000 | 10.58 ms | 11.74 ms | 1.16 ms | 20.52 ms | 1,001 records / 41 pages / 0.51 s |
| 5,000 | 10.74 ms | 13.34 ms | 2.61 ms | 33.70 ms | 5,001 records / 201 pages / 2.75 s |

Both traversals stayed at 25 records/page, with zero SQLite changes and zero external operations. Timings include paired warm-cache variability; p95 differences are not a controlled causal estimate. No production capacity or global ranking claim is made.

Measurements are local synthetic warm-process results, not hosted capacity or a new memory investigation. No whole-population recomputation or write occurs during reads. C3's prior 50k measurements remain separate evidence. Per-prospect E2 history is still unbounded.

## Consolidated integration readiness

| Area | Disposition |
|---|---|
| E2 durable memory, C1 SHADOW planning, C2 fenced queue, C3 current integrity | Preserved; prior tests pass |
| C4 internal attention, bounded authorized read seam, stale-fallback exclusion | Implemented and tested locally |
| Existing UI mutation guard/cursor handling | Implemented; contract/syntax tested; no hosted visual claim |
| Hosted D1 snapshot adapter and actual authorization binding | Not implemented/accepted; contract rejects uncertified adapter |
| Real source identity/rights, suppression, owner and CRM authority mapping | Requires separately authorized real-data/provider evidence |
| Hosted deployment/isolation/migrations/rollback behavior | BLOCKED — EXTERNAL CLOUDFLARE ACCESS REQUIRED FOR RELEASE VERIFICATION |
| Messages, calls, appointments, CRM writes, unattended execution | Not authorized; not implemented in C4 |
| Producer minutes, useful conversations, quote/bind/premium improvement | Unmeasured; synthetic success is not economic progress |

Keep #7, #16, #17, #18, #19, #20 and this C4 PR draft/unmerged. No production deployment or deliberate hosted deployment action, hosted migration, Cloudflare setting, real-data expansion, provider operation, customer communication, CRM mutation, appointment or spending occurred. Automatic branch Preview builds confer no authority for hosted data operations.

Rollback: omit this stacked C4 branch; no schema or hosted state was changed. The next justified work is **integration readiness of this existing stack**, not another intelligence layer: review exact diffs and release effects, define/validate the production D1 snapshot and authorization mapping against this contract, then perform independently authorized hosted read-only/UI acceptance and rollback checks when access is available. No merge or principal intervention is requested by this engineering report.
