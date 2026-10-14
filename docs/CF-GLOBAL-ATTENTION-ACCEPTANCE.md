# Global producer attention — integration-to-release decision package

2026-10-14 · CF-ADAPTIVE-INTELLIGENCE-3.0

**Disposition: the demonstrated global-selection defect is corrected and locally accepted; ready for engineering review, NOT authorized for merge, deployment or real producer use.** This is a bounded correction to Producer Integration C4, not another intelligence layer. The new draft is stacked on #21 at `e40d0367921640cd40987d57073125d4921b3416`. Its exact implementation commit and exact-head Actions receipt are recorded in the draft PR body, avoiding a self-referential commit in this file.

## Verified stack and preserved scope

Main remains `5f47f2b7367110ca04ff03cc189983f136ab32fa`. Ref and Actions refresh confirmed this nested, draft, unmerged stack:

| PR | Head | Base | Successful exact-head push run |
|---|---|---|---|
| #7 | `ad2915a7889637580505293ce38ab4db66f0a9b3` | main | 38305917703 |
| #16 | `5cfa79f4d01a8d9a3bf558c44d019064ca477f2a` | #7 | 38560012191 |
| #17 | `247b708d2615c0caa72d2a95402a59507ccf9b45` | #16 | 38595322944 |
| #18 | `33d6a48b448e224b878d075a3348d9ae5caf5369` | #17 | 38595766936 |
| #19 | `01a58c57857c63cbb5c7c426f8ebc38d73d96f2d` | #18 | 38600082788 |
| #20 | `0098c34b5dc25d1c35816ed8c9b30f606f48a76d` | #19 | 38603518868 |
| #21 | `e40d0367921640cd40987d57073125d4921b3416` | #20 | 38610674599 |

The [prior integration report](CF-ROADMAP-3-INTEGRATION-READINESS.md) retains historical graph/file overlap, runtime, protection and economic-contract evidence. This correction preserves the nested ancestry; no existing branch was rewritten. No hosted migration, route activation, worker schedule, configuration, provider or CRM operation was added. Existing inventory browsing remains an ID-keyset page; the new global attention method serves Today through the existing injected read contract. No second dashboard or scoring engine exists.

## Implementation and integrity

`tests/migrations/0022_global_producer_attention.sql` adds four selection columns and two indexes to the existing one-row-per-prospect C2 queue. JSON metadata holds decision reference, evidence/context/profile revisions, result and queue generations, existing Attention band/rank, eligibility, validity boundary, build and publication time. Scalar index keys hold eligibility, negative existing rank, confirmed commitment due time and prospect ID, scoped by workspace. No facts or second prospect history are copied.

The existing C4 human-attention policy is shared by publication and reconciliation. A successful revision/lease-fenced C2 acknowledgment publishes the candidate **in the same transaction** as its result and final queue transition. Rollback of candidate publication rolls back the decision/result too. Material queue generations, claims, failures, source deletion/relink and opportunity status changes invalidate eligibility; existing evidence/context/identity triggers propagate material changes into that fence. STOP, CONTROL, wrong number, takeover and unknown ownership cannot retain an eligible recommendation. AgencyZoom may still own a cadence while a customer-requested CALL is an internal producer handoff; no ownership transfer or execution permission follows.

A legitimate future evaluation timer retains CURRENT until its due boundary. Candidate metadata records the final queue generation, including that timer. Time passage itself performs no write: C3 and the validity boundary reject expired candidates during reads. Such holes consume the explicit search window until governed evaluation updates them.

Global workspace reads use `cf_eval_attention` ordered by rank, appropriate commitment due time, then binary ASCII prospect ID. This matches the existing recommended Attention comparator, with deterministic collation for governed records. `next_evaluation_at` is never treated as contact or callback time. Record-scoped readers perform at most 100 independently authorized primary-key lookups, sort that bounded set and revalidate only the selected page. No wide allowlist SQL or population scan is needed for global attention.

Every selected record is reread through C3 in the same local SQLite read transaction. Metadata must agree with current evidence, context, profile, result, queue and decision references. Contract reconciliation replaces legacy `nextBestAction`, `sms.decision_2` and action-quality fallbacks. CURRENT CALL and quote preparation can be internally attention-worthy while SMS, call, calendar, CRM and external execution authority all remain false.

The candidate window is `limit + 1`, with at most `limit` C3 validations (default 25; Today maximum 40, attention contract maximum 100). Empty filtered or expired pages retain continuation. Today and its Command Center wrapper carry cursor and coverage; the existing panel displays a next-page control and incomplete-coverage notice. Each page replaces the previous page. Refresh starts at the first page, which is necessary when new work moves ahead of an existing cursor; this is not a frozen population snapshot.

Coverage explicitly distinguishes pending/leased, failed and unpublished work, rejected candidates and rows returned. It never certifies whole-population completeness. With no visible backlog it claims only evaluated-candidate coverage. Expired holes, filtering and changes between pages can leave short/empty pages; the reader does not scan to refill them.

## Acceptance evidence

Full local suite: **653 passed, zero failures, cancellations or skips**, Node 24.19.0. Command:

```sh
node --test --test-isolation=none --experimental-loader ./tests/json-loader.mjs tests/*.test.mjs
```

The previous 636-test baseline is preserved, including its historical defect characterization now corrected to assert global Today behavior. Seventeen added file-backed synthetic acceptance cases cover:

- 2,000 earlier-ID nonurgent prospects followed by late-ID CALL/quote requests: urgent requests lead the initial Today page.
- Stored decision/revision/generation agreement; new evidence, identity changes, source retraction/relink and ownership transitions invalidate selection.
- STOP, CONTROL, wrong number, takeover and unknown owner exclusion before and after reevaluation.
- Stale acknowledgment rejection, interrupted acknowledgment and forced candidate-publication rollback; three competing worker connections publish 24 results exactly once.
- Future-timer validity, due-time rejection, crashed/expired lease recovery, explicit failure coverage.
- Binary equal-rank pagination, confirmed commitment ordering, empty-filter continuation and wrapper cursor propagation.
- Authenticated tenant/record scope, 100-record allowlist bounds, missing schema/corrupt candidate failure, read-only database reopen and selection reproduction.
- New priority appears on first-page refresh; old cursors explicitly do not promise discovery of newly inserted earlier-ranked work.
- Real SQLite query plan, bounded rows, zero GET mutations and disabled external execution. Existing C3/C4 safety, missing-adapter, legacy fallback and designated GET regression tests continue passing.

All test operations use fictional records and isolated SQLite. Fetch traps, execution-authority assertions and stored-state checks show zero external operations in these simulations, not hosted certification.

## Measured scale

Reproduce with `node --experimental-loader ./tests/json-loader.mjs scripts/benchmark-global-producer-attention.mjs`. [Raw JSONL receipts](evidence/CF-GLOBAL-ATTENTION-benchmark.jsonl) include timings, memory stages, plans, coverage and counters. Each population uses a fresh process, actual source admission/C2 evaluation and file-backed SQLite; one helper identity exists in addition to the stated population. The last 100 IDs are current human candidates. Fifty warm initial-page samples follow construction. The 1,000 run was repeated without the overlapping regression suite; these are shared-machine observations, not controlled hosted capacity tests.

| Prospects | Candidate selection mean ms | C3 hydration/validation mean ms | Full page mean / p95 ms | Evidence update mean ms | Backlog page ms |
|---:|---:|---:|---:|---:|---:|
| 1,000 | 0.111 | 12.463 | 13.196 / 20.033 | 0.484 | 1.172 |
| 5,000 | 0.129 | 12.787 | 13.551 / 22.714 | 0.485 | 1.280 |
| 20,000 | 0.148 | 15.958 | 16.603 / 35.785 | 0.486 | 1.090 |
| 50,000 | 0.110 | 11.365 | 11.794 / 16.053 | 0.496 | 1.193 |

Every size traversed 100 distinct candidates in four 25-record pages without omissions/duplicates in the unchanged dataset. An instrumented SQLite predicate measured **26 candidate index visits** for the 25-record page; the plan is an indexed tuple `SEARCH` using `cf_eval_attention`, without temporary sorting. The probe's projected ID query is covering; the adapter also fetches candidate metadata for those bounded rows. This is not a claim that all evidence hydration examines only 26 rows. The allowance-scoped test additionally measures at most 100 primary-key scope checks and no more than six bound parameters per statement.

Pending-backlog tests materially updated all but the last prospect (999 through 49,999 pending), invalidated their candidates and returned only the remaining CURRENT record, with incomplete coverage. No worker drain occurred in those reads. Explicit governed refresh then removed the last candidate. All measured reads changed zero SQLite rows and made zero external calls. Incremental update timings include evidence admission and invalidation, not merely an index update.

RSS in MiB (fresh process for each population):

| Prospects | Start | After admission | After evaluation | After reads | After backlog |
|---:|---:|---:|---:|---:|---:|
| 1000 | 70.5 | 142.7 | 148.0 | 158.3 | 158.9 |
| 5000 | 70.1 | 259.2 | 279.4 | 282.3 | 283.9 |
| 20000 | 70.6 | 364.6 | 407.8 | 407.4 | 406.8 |
| 50000 | 70.0 | 658.9 | 728.1 | 728.3 | 740.6 |

At 50,000, peak RSS was 740.6 MiB. Most retained memory was already present after dataset construction/evaluation; this is not standalone reader memory or a demonstrated leak. The run does not measure worker contention memory; concurrency correctness is tested separately. C3 hydration still dominates latency and can grow with retained per-prospect evidence history. No new cache, distributed service or speculative performance optimization was introduced.

## Hosted D1 readiness — not acceptance

Read-only review of official [D1 database API](https://developers.cloudflare.com/d1/worker-api/d1-database/) and [limits](https://developers.cloudflare.com/d1/platform/limits/) confirms a direct local-adapter port is inappropriate. D1 documents 100 parameters per query, 50 queries per Free invocation and 1,000 per Paid invocation. Local instrumentation of a 25-current-candidate global read counted **588 prepared statement executions**, maximum three bindings on the first workspace page. The earlier inventory audit remains 583 executions and 103 bindings with a 100-record allowlist. The global attention path fixes its own allowlist binding issue; it does not rewrite legacy inventory hydration or eliminate C3 fan-out.

Minimum later hosted-adapter acceptance:

1. Trusted server authentication and workspace/record authorization on every query; no client workspace as authority. Preserve missing/uninitialized/incompatible schema fail-closed behavior and no legacy-action fallback.
2. Tenant-scoped indexed candidate seek, bounded bulk hydration and an explicit entire-request query/parameter/history budget, including pagination, authorization and C3 evidence reads.
3. Consistent evidence/context/queue/result reads. A D1 session provides sequential consistency; `first-primary` alone does not prove one atomic multiquery snapshot. Demonstrate an appropriate atomic batch/single relational read or revision-fenced bounded retry that fails closed on concurrent changes. Test actual D1 behavior independently.
4. Runtime-neutral C3 projection separation from local Node SQLite/crypto dependencies; do not import the local harness into Cloudflare routes. Missing migrations must remain UNAVAILABLE.
5. Authorized hosted schema/worker/bootstrap plan, provider-independent SHADOW operation, observability and rollback acceptance before any activation.

No hosted adapter, hosted migration or live dataset access was created. **BLOCKED — EXTERNAL CLOUDFLARE ACCESS REQUIRED FOR RELEASE VERIFICATION.** Local SQL, tests and automatic branch Preview builds cannot verify production bindings, authentication, routing, migration behavior or deployment effects.

## Integration, rollback and economic gates

New selection columns start ineligible for existing results. A local test migration does not retroactively certify old candidates. Bootstrap requires bounded, explicit governed refresh/re-evaluation; producer GETs never backfill. The current deployed route remains unchanged until a separately reviewed/accepted adapter is supplied.

Engineering rollback is to omit this draft and retain #21; local fixtures are disposable. If retaining a migrated local database, older readers do not consume the new candidate fields. No hosted database rollback was performed or is needed for this cycle. Before any future activation, define additive migration compatibility, disable/read-fail-closed behavior, candidate rebuild and result/evidence retention; never restore stale legacy fallback as a rollback strategy.

The prior protection audit reported main unprotected, no rulesets, and detailed protection access denied. That is not an enforced release gate. Separately verify protections and automatic deployment behavior before seeking merge authority. Integrate only in dependency order with refreshed diffs, tests and final-tree checks; all current PRs remain draft/unmerged.

**Remaining release gates:** authorized hosted persistence/tenant consistency, bounded hydration, deployment and rollback verification, source rights/identity mapping for the actual allowed cohort, agency workflow authority, provider certification for any later communication, and separately authorized low-friction producer dogfood. Existing Preview evidence is historical and does not certify this path. No producer economics were inferred from synthetic records.

Use the existing [economic measurement contracts](CF-ROADMAP-3-INTEGRATION-READINESS.md): producer minutes per genuine useful conversation, qualified conversations per 100 authorized leads, avoided repeat questions, quote-ready opportunities, independently verified quote/bind outcomes and unnecessary interruptions. Require decision/evidence versions, actual producer time and independently verified outcomes; proposed actions or synthetic responses are not economic progress.

**Stop here:** no further intelligence architecture milestone is authorized by this correction. The next integration work is a separately scoped hosted persistence/adapter and deployment-safety acceptance package, followed by authorized producer economics; provider/live communication authority remains independent. Producer Integration C4 is distinct from Dynamic Cadence C4's unapproved/unimplemented communication canary. Aggregate market-intelligence commercialization remains parked; individual Prospect 360 histories remain private.
