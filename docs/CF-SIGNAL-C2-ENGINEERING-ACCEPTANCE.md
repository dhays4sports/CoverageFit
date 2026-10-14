# CF-SIGNAL-C2 — local engineering acceptance

Date: 2026-10-14. Program: CF-ADAPTIVE-INTELLIGENCE-3.0. Authority: synthetic local SQLite, scoped draft development, no external execution.

**Implemented and locally accepted:** a durable evaluation queue connecting existing E2 Prospect Memory to the unchanged C1 planner. Evidence admission independently creates work; bounded workers retain source-linked SHADOW decisions; stale workers cannot complete newer work; unfinished evaluations recover across runtime restart and lease expiry. No producer request is needed for ordinary evidence-triggered or already-recorded time-triggered reevaluation.

Base is draft PR #18, `33d6a48b448e224b878d075a3348d9ae5caf5369`. Branch: `engineering/c2-evaluation-queue-20261014`. The accompanying draft PR records the final exact commit, tree and observed GitHub Actions run; this avoids a self-referential commit identifier in this file. PRs #7, #16, #17 and #18 remain unmerged.

## What changed and why

Bottleneck: E2 could preserve and project evidence, but a caller still had to initiate each evaluation. C2 makes material changes durable work and protects completion against concurrent evidence, safety and ownership changes.

- `tests/migrations/0021_signal_evaluation_queue.sql` adds a change timestamp to local E2 revisions, one queue row per workspace/prospect, decision-result records and indexes. It is outside production migrations. No second CRM, provider queue or distributed framework.
- Revision insert/update triggers enqueue in the **same transaction** as E2 admission, correction, retraction, expiration and newly detected source-ID collisions. Replays do not increment revision or queue generation.
- Established UCP identity changes and insert/update/delete of the local typed policy snapshot also enqueue. The snapshot uses existing `cf_solo_sources` (`signal_c2_context_v1`), rather than another owner registry. It represents one synthetic workflow family; no live agency ownership is claimed or transferred.
- `server/signal-evaluation-queue-local.mjs` implements governed context updates/recompute, bounded claim/evaluate/acknowledge/failure operations, a bounded `runBatch`, and read-only queue metrics. It requires `syntheticOnly:true` and has no production-route importer.
- E2 gains nested savepoint support so decision recording and queue acknowledgment share one atomic outer transaction. Existing E2-only databases remain supported. Exact renewal-date staleness now contributes its next time boundary.
- C1 itself is unchanged. No production API, Cloudflare setting, provider adapter, appointment path, feature flag or live scheduler changed.

## Queue and completion contract

`generation` fences all work changes, including context/identity changes that do not change `target_revision`. New evidence coalesces into the same row while preserving its newest revision and earliest justified due time. A current lease is not silently reassigned when work changes.

Claiming uses `BEGIN IMMEDIATE`, a fresh random token, worker ID, stored claim time, claimed generation and expiry. Two indexed scans examine **at most the requested 1–100 rows in total** (expired leases first, then due ready rows). No inventory-wide evaluation runs inside a GET. Claims cannot be acquired early; expired tokens cannot acknowledge, fail or overwrite work held by a successor.

Evaluation reads current E2 and the persisted typed owner/contact/commitment snapshot. Before projection it may explicitly erase **at most 100 expired source events for that prospect**. Cleanup creates a new evidence revision, so the old evaluation is deliberately requeued rather than committing against its old claim. This may require another bounded batch.

Acknowledgment holds a write transaction and rechecks:

1. Current lease token/worker/generation and clock, including expiry.
2. Current evidence revision and exact profile version.
3. Current context version and identity projection.
4. Whether a meaningful time boundary passed during evaluation.
5. The deterministically rebuilt C1 decision, rejecting tampered results.

Only then does it atomically save the E2 decision trace, full no-send C1 result, validated context snapshot/version, evidence revision, evaluation/acknowledgment timestamps and next evaluation time. Unique `(workspace, prospect, generation)` results prevent duplicate committed results for that generation. Context snapshots preserve historical decision provenance after later owner/safety changes; no message bodies or customer fact values are copied into this result record.

New evidence/context during evaluation returns `STALE_REQUEUED`; the newest work remains due. An acknowledgment interruption rolls back both the decision and completion. A lost lease returns `LEASE_LOST`. Computation is **at least once**, not exactly once; the guarantees are fenced, atomic, revision-current result commits. No result grants execution permission.

Retries use capped exponential backoff and a bounded attempt limit (default 5). Repeated crashes exhaust attempts into `FAILED`; new material evidence or explicit governed recomputation can recover the work. Only fixed error categories are retained, not arbitrary error text or secrets. Claim/evaluation batches are bounded; an individual E2 projection still depends on that prospect's retained history size.

## Governance and operational boundaries

`setContext` and `requestRefresh` are explicit local mutations with scoped existing UCP identity, a named authority/reference, request fingerprint/idempotency and `cf_solo_activity` audit records. Context updates use compare-and-swap versions, so competing owner updates cannot silently overwrite each other. These are synthetic harness controls, **not production authentication or agency approval**.

Missing context fails closed to TEST/UNKNOWN/takeover. STOP, CONTROL/TEST, wrong-number restrictions, ambiguous identity, takeover, contact waits and single-owner snapshots flow into existing C1. AgencyZoom/unknown ownership remains visible, and **SMS, call and external execution eligibility are always false**, including internal CALL recommendations. Purchased-source and absent-SMS-permission restrictions remain separate from usable internal evidence.

A result references existing source evidence and a bounded policy-context snapshot. Retraction/expiration removes prior E2 decision traces and cascades C2 result deletion; its current pointer is cleared. Original source stores, context retention and backups remain separate policy concerns. Real source/agency/provider adapters have not been installed. Direct arbitrary SQL edits to canonical evidence are outside the supported mutation contract.

The module exposes callable bounded local workers. Test/benchmark processes consume work automatically. No unattended daemon, hosted cron, outbound schedule, transport, real AgencyZoom mutation or appointment operation was installed.

## Test evidence

Final local suite: **592 passed, 0 failed, 0 skipped**: prior 569 + 23 C2 acceptance tests. The existing 12-GET regression is additionally strengthened with a **nonempty pending C2 queue** and snapshots of every database table plus the SQLite write counter. It proves reads neither refresh, claim nor acknowledge evaluation work.

Real file-backed SQLite tests cover:

- Admission-to-queue atomicity, duplicate replay/coalescing, restart and changed current recommendation with no repeated known question.
- Four concurrent worker connections; four distinct claimers with distinct tokens and nonoverlapping generations; no duplicate committed generation.
- Evidence arriving between evaluation and acknowledgment, context/owner and identity races, stale failures and old-token fencing.
- Runtime close/reopen, expired leases, terminated worker threads and **SIGKILL of an actual child process after a committed claim**, followed by another runtime's recovery.
- Interrupted acknowledgment rollback, early/due callbacks, future observations, renewal-window/staleness timers and time boundaries crossed mid-evaluation.
- STOP/CONTROL, takeover, missing/removed context, AgencyZoom/unknown ownership, denied source rights and ambiguous identity admission.
- Scoped audited recompute, idempotency, context CAS, bounded/indexed selection, retry/exhaustion and governed recovery.
- Retraction/expiry cleanup with dependent decision deletion, source collision reevaluation, tampered results and reversed clocks.
- Successful worker operation with a forbidden-network trap and snapshots proving all non-evaluation tables—including existing CRM/source, SMS, task and appointment stores—remain unchanged. External actions are zero.

Exact-head GitHub CI and final PR metadata are recorded in the accompanying draft acceptance body. Local test success is not hosted acceptance.

## Benchmark method and interpretation

`node scripts/benchmark-evaluation-queue-local.mjs 1000 5000 20000 50000` uses actual file-backed SQLite. Each prospect has one synthetic evidence event with two assertions and an AgencyZoom-owned context. One queue row is retained per prospect. The first 100 events are replayed to verify duplicate safety.

The initial worker drain uses batches of 100 and measures full claim → E2 projection → C1 → guarded durable result/acknowledgment. All initial N decisions must commit, with no remaining **due** work; future justified reevaluation timers remain stored. Lag uses a controlled UTC origin plus actual measured elapsed time, including initial backlog construction; it is not hosted wall-clock telemetry.

At every size, 100 additional requests are claimed and abandoned, the database connection is closed/reopened, and the clock advances to the 50 ms lease expiry. Recovery processing time is measured separately; 50 ms is a **simulated lease/detection threshold**, not production recovery latency. Another 1,000 requests are processed by four competing worker-thread connections, using batches of 25 and a 1 ms cooperative pause between batches. Per-worker distributions, batch latency observations, elapsed time and busy-error counts are recorded. No linear concurrency scaling or fairness guarantee is claimed.

Raw measurements: `docs/evidence/CF-C2-local-queue-benchmark.jsonl`. RSS is sampled process memory, not a continuously measured OS peak; it includes worker threads and allocations retained across sequential sizes. CPU is total process CPU across setup, drain, recovery and contention. SQLite uses DELETE journal/default synchronous settings. These are local container measurements, not D1 or production capacity.

## Measured queue results

| Prospects | Setup/enqueue s | Queue drain s | Evaluations/sec | p95 lag s | Max lag s | Sampled RSS MiB | DB MiB |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1,000 | 1.01 | 1.18 | 846 | 2.07 | 2.07 | 163.7 | 11.3 |
| 5,000 | 5.67 | 5.89 | 848 | 11.21 | 11.45 | 342.5 | 42.8 |
| 20,000 | 20.11 | 23.93 | 836 | 42.73 | 43.93 | 625.0 | 161.1 |
| 50,000 | 51.41 | 58.16 | 860 | 106.83 | 109.47 | 1121.6 | 398.8 |

| Dataset | Abandoned / recovered | Recovery processing ms | Four-worker sample | Sample elapsed ms | Sample eval/sec | Busy errors |
|---:|---:|---:|---:|---:|---:|---:|
| 1,000 | 100 / 100 | 108.0 | 1,000 | 1335.6 | 749 | 0 |
| 5,000 | 100 / 100 | 110.6 | 1,000 | 1432.4 | 698 | 0 |
| 20,000 | 100 / 100 | 101.3 | 1,000 | 1432.2 | 698 | 0 |
| 50,000 | 100 / 100 | 141.3 | 1,000 | 1467.7 | 681 | 0 |

Every size retained exactly N queue rows and committed N initial results; after the extra 100 recovery and 1,000 contention requests, exactly N+1,100 results existed. Initial batches examined at most 100 rows, contention batches at most 25. There was zero due work after each initial drain. The 50k drain used 500 batches. Memory reached approximately 1.1 GiB in this sequential benchmark process: bounded queue work does not imply a small constant memory footprint. The four-worker sample was slower than the single-worker drain and distributed work unevenly; SQLite writer contention remains a limitation, not evidence of parallel scaling.

## Remaining limits and release disposition

- **Implemented and tested locally:** queue, atomic integration, C1 worker, provenance, timer/retry/recovery behavior and all listed negative gates.
- **Not implemented/accepted:** production D1 transaction adapter or migration, hosted worker scheduling, real-source identity/rights/safety adapters, UI/current-decision publishing, historical-data bootstrap, large per-prospect history paging, continuous service SLOs and economic benefit.
- Results are historical until their queue/current revision is checked. `last_decision_id` may still identify the previous result while newer work is pending; no UI or execution gateway consumes it in this slice. A future read projection must expose that freshness explicitly.
- SQLite permits a single writer. Contending workers may receive unequal shares and wait for locks; the measurements do not establish multi-worker throughput gains. Busy timeout is bounded; persistent service recovery/backoff after connection-level failures is not a hosted certification.
- Bounded claims do not mean bounded total ledger size or constant-cost E2 projection of arbitrarily long histories. Expiration cleanup is bounded, and can intentionally requeue before committing a fresh result. Existing pre-C2 data is not silently backfilled; use governed refresh operations for any later approved bootstrap.
- No communication, provider, agency, underwriting, spending or production authority is added. No PR is merged. Prior Preview acceptance still belongs to its historical runtime.
- **BLOCKED — EXTERNAL CLOUDFLARE ACCESS REQUIRED FOR RELEASE VERIFICATION:** actual deployment effects, bindings, flags, hosted database isolation, rollout/rollback and hosted behavior. Engineering acceptance does not substitute for these gates. No owner Cloudflare intervention is requested.

## Smallest next justified milestone

**C3 synthetic current-decision read projection:** expose only revision-current queue results through the existing read-only producer projection contract, marking pending/stale/held/failed results explicitly. Prove a synthetic source update → queued evaluation → persisted decision → current producer recommendation across restart, with zero GET writes and zero execution. Keep any live adapter, hosted deployment or communication authority separately gated. This connects the proven queue to useful producer attention without a dashboard redesign or another platform.

Rollback: leave the draft unmerged and discard local synthetic databases, or revert this scoped engineering commit. No hosted or provider state needs reversal.
