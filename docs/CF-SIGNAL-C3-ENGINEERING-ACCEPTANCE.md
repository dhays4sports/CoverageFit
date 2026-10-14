# C3 current decision integrity — local engineering acceptance

C3 addresses a reliability blocker: a producer must not receive an old action as current while evidence, authority or evaluation state has changed. It extends the accepted E2/C1/C2 spine; no second CRM, dashboard, decision engine or hosted route is introduced. Synthetic tests establish correctness, not producer-time savings or economic uplift.

Base: draft #19, `01a58c57857c63cbb5c7c426f8ebc38d73d96f2d`. The implementation commit, draft PR and exact-head CI receipt are recorded in the accompanying PR body, avoiding a self-referential commit hash in this document. All earlier PRs remain unmerged.

## Implemented and tested

`server/signal-current-decision-local.mjs` supplies a pure status selector, a synthetic-only SQLite read adapter and a contract-only Producer Workspace / Today / Prospect 360 record bridge. The bridge uses existing action-quality action codes and object shape. It is not wired into the deployed UI or API. No migrations or new tables are needed. C2 only exports its existing context normalizer so the read and write contracts cannot normalize context differently.

| Status | Meaning and display contract |
|---|---|
| CURRENT | Committed evidence revision, historical profile version, context version, queue pointer and generation remain valid; no due time boundary has crossed. Only this status includes a recommendation. |
| PENDING | Work exists but no retained committed result is available. Includes a first evaluation, leased initial work, or reevaluation after privacy erasure. |
| STALE | A retained result exists but evidence, policy, identity-triggered generation, pointer, work state or time has superseded it. The action is withheld. |
| HELD | Current safety, identity, source linkage, conflict, takeover, CONTROL/TEST, wait or unknown-owner restriction overrides an action. |
| FAILED | C2 reached its terminal failed state. Exposes attempts/error and recovery through new material evidence or an explicit governed refresh. |
| UNAVAILABLE | Missing identity/store/context, invalid persisted trace or an invalid decision clock prevents reliable assessment. No read-side repair occurs. |

Precedence is unavailable assessment → authoritative hold → terminal failure → absent-result pending → freshness/stale → current. Queue state remains visible even when safety overrides FAILED. Nonterminal retries with history are STALE; without history they are PENDING. Future timer-only generation advancement preserves CURRENT until due. An explicit refresh or material generation change conservatively withholds the old action even if requested for a future time.

AgencyZoom ownership remains authoritative. A change away from CoverageFit invalidates the old context; a subsequent current internal CALL or quote review may remain useful under AgencyZoom. This never transfers cadence ownership. Missing SMS permission remains a separate restriction, not a reason to erase internal intelligence. Every returned record and action bridge is SHADOW and non-executable; SMS/call/external eligibility is false. Next evaluation time is never a send or appointment time.

## Freshness and read integrity

Each single-record/page read uses one SQLite read transaction. It reads the scoped UCP identity, current normalized context, queue row, latest committed result and matching E2 decision trace. E2 projects only the selected prospect at the requested clock and at the committed evaluation clock. The second projection compares reproducible versions without incorrectly treating the passage of one millisecond as new evidence. C1 is consulted for current safety, not to publish an uncommitted replacement action. Evidence expiration is checked through time boundaries without erasing rows during reads.

A valid result must match current evidence/target revisions, normalized policy version, the historical profile hash, current last-decision pointer and an admissible generation/state. Expired leases, due timers, stale acknowledgments and fresh work cannot make an old result current. Source reassignment also holds results. Evidence references include source locators/timestamps only with CURRENT recommendations. Historical output contains identifiers/version/time, not old action text; existing governed E2 audit records are preserved unless E2 retention/retraction removes them. Erasure never resurrects deleted history.

The bridge creates a fresh record rather than merging prior action fields. Consumers must replace old action fields and must not fall back to legacy `sms.decision_2` or `action_quality` when current status is unavailable. Actual existing surfaces are unchanged in this slice.

## Automated acceptance

Full local suite: **609 passed, 0 failed, 0 skipped** (592 base + 17 C3 tests). Command:

```sh
node --test --test-isolation=none --experimental-loader ./tests/json-loader.mjs tests/*.test.mjs
```

Actual file-backed SQLite tests assert persisted revisions, generations, retained results, source traces and table state:

- Source admission → PENDING → committed CALL CURRENT → verified field correction → STALE → new quote-preparation CURRENT; reopen reproduces the result.
- STOP/opt-out, wrong number, CONTROL, producer takeover and unknown owner immediately hide historical CALL. AgencyZoom changes invalidate prior policy while valid internal intelligence remains independent of SMS permission.
- Identity changes/source reassignment, source retraction and retention expiration invalidate or remove old results. Read-side expiry changes no stored rows; governed C2 cleanup/requeue/commit restores a valid result.
- Terminal failure exposes safe recovery; new material evidence can recover. Pending, stale, failed and held states reproduce after reopen.
- Two independent connections compete for claims; expired lease completion is fenced; in-flight evidence invalidates stale acknowledgments. Only committed current generations are exposed. Existing C2 four-worker and actual SIGKILL tests remain passing.
- A read-only SQLite connection supports page/single reads. All-table snapshots and SQLite change counters stay identical; forbidden-network trap observes zero calls. Existing 12 designated GET paths additionally execute C3 against pending work and preserve all tables/change counters.
- Missing context/schema, malformed context, mismatched decision trace and reversed clock fail closed. Indexed keyset paging caps each request at 100 records (default 25), with one bounded extra key for pagination. No claim, refresh, cleanup or population-wide evaluation occurs during a read.

No external messages, provider calls, AgencyZoom writes, appointments or hosted database operations were performed. Tests and prior C2 snapshots protect these boundaries. Local fixtures remain synthetic authority; they are not proof of real-world consent, agency transfer or rights.

## Performance and memory

Reproducible benchmark: `node --expose-gc scripts/benchmark-current-decision-local.mjs`. Raw evidence: `docs/evidence/CF-C3-fresh-process-benchmark.jsonl`. Each dataset size has separate fresh OS processes for construction, queue drain, paginated C3 reads and a four-worker 1,000-record contention sample. All phases use the same file for that size; no process carries allocations from a previous size or phase. Native/JS memory, peak RSS, before/after close+forced-GC, elapsed time, page latency and bounded work are recorded. The benchmark traverses all pages deliberately; each producer-sized request reads at most 25 records. The fixture includes one additional seed identity without context, correctly UNAVAILABLE.

| Prospects | Construction | Queue drain | 25-record C3 page p95 | Indexed key query mean | C3 records/s |
|---:|---:|---:|---:|---:|---:|
| 1,000 | 1.13 s | 1.03 s | 18.73 ms | 0.0149 ms | 2,028 |
| 5,000 | 4.21 s | 4.72 s | 17.41 ms | 0.0136 ms | 2,273 |
| 20,000 | 18.09 s | 18.93 s | 21.51 ms | 0.0138 ms | 2,165 |
| 50,000 | 45.70 s | 49.01 s | 28.93 ms | 0.0153 ms | 2,114 |

All sizes drained exactly N initial decisions; C3 read N+1 scoped identities with at most 25 records/page, and four-worker contention completed 1,000 evaluations without errors. Query timings are 100 repeated bounded key lookups; page timings include SQL, per-prospect evidence/version/safety projections and result construction. These are local synthetic measurements, not hosted capacity guarantees.

| 50,000-record phase | RSS before close/GC | JS heap used | OS peak RSS | RSS after close/GC |
|---|---:|---:|---:|---:|
| construct | 320.1 MiB | 30.6 MiB | 320.1 MiB | 320.1 MiB |
| drain | 205.2 MiB | 54.1 MiB | 206.1 MiB | 205.2 MiB |
| read | 145.8 MiB | 39.3 MiB | 145.8 MiB | 145.8 MiB |
| contend | 131.3 MiB | 8.1 MiB | 152.4 MiB | 131.8 MiB |

C3 benchmark workload: one event/one factual assertion and one AgencyZoom context per prospect. This differs from the original C2 two-assertion workload; the fresh-process control below uses the unchanged original C2 script to avoid attributing all differences to process separation.

Unchanged original C2 benchmark, **50,000 records alone in one fresh process**, measured **413.0 MiB sampled peak RSS**, versus the earlier sequential 1k/5k/20k/50k run's ~1.1 GiB. Raw control: `docs/evidence/CF-C3-original-C2-fresh-process-control.jsonl`. It drained in 54.55 s (917/s), with zero due records remaining, maximum 100 examined/batch, and 100/100 abandoned leases recovered. Four-worker contention completed 1,000 records at 750/s with zero busy errors, but one worker processed all 1,000; there is no fairness or parallel-speedup claim.

The large reduction with the unchanged workload in a fresh process is consistent with retained historical process allocations contributing to the earlier footprint. The C3 phase measurements separately locate substantial construction and drain memory, versus a smaller fresh reader. Close+GC leaves most RSS resident despite smaller JS heaps, consistent with native/allocator retention. **This does not prove the allocator/SQLite/V8 cause or rule out a leak.** No memory optimization is claimed; native allocation profiling and representative long-history workloads remain a justified performance follow-up if required before real-data adoption.

RSS includes SQLite/native allocations, V8 heap and allocator retention; JS heap is not total process memory. Closing a database and forcing GC is diagnostic, not a production memory remedy. Four-worker RSS is process-wide and includes workers. Max RSS is the OS high-water mark; it does not imply every stage retained that amount. Single-writer contention still limits parallel throughput. No unproven caching, distributed infrastructure or tuning was introduced.

## Limits, rollback and next gate

**Implemented and locally accepted:** C3 read selector/adapter, producer contract bridge, persisted acceptance and benchmark harness. **Not integrated/accepted for hosted use:** real Producer Workspace/Today/Prospect 360 API/UI, production D1 read adapter, authentication/tenant authorization, real source rights/suppression/ownership adapters or hosted consistency. Per-request prospect count is bounded; E2 history within a prospect is still unbounded. No population aggregate/count query or new cache is introduced. Read status is true as of its snapshot/clock, not an execution lock; future actions would require independent freshness/authority checks.

**BLOCKED — EXTERNAL CLOUDFLARE ACCESS REQUIRED FOR RELEASE VERIFICATION.** No deployed behavior, environment isolation, bindings, permissions or deployment triggers are certified here. All PRs remain draft/unmerged. Provider, real-data, agency ownership transfer, outbound activity, production migration and release require separate authority. No Cloudflare intervention is requested.

Rollback is to retain #19 and omit this stacked C3 branch; no schema or hosted state changed. Next smallest justified milestone: a separately reviewed deployment-safe read-contract adapter for the existing producer endpoints, with tenant/auth and unavailable-store fallback tests, preserving C3 status precedence and no legacy-action fallback. Keep it synthetic/disabled until hosted read isolation and release authorization are verified. No new dashboard or execution worker is justified by this slice.
