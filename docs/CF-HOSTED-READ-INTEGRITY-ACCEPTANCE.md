# Hosted read integrity — engineering acceptance and release gates

2026-10-14 · CF-ADAPTIVE-INTELLIGENCE-3.0

**Disposition: bounded portable read engineering accepted locally; hosted acceptance and release remain blocked.** This package continues draft #22 at `80cb58ae7793d7bccabd084ffce1994f284cfdba`. It does not activate a route, hosted migration, write adapter, worker, provider or producer dogfood. Exact implementation head and full-suite Actions receipts are in the stacked draft PR body.

## 1. Repository and PR #22 review

Main remains `5f47f2b7367110ca04ff03cc189983f136ab32fa`. Draft #7 → #16 → #17 → #18 → #19 → #20 → #21 → #22 remain unmerged. All refreshed heads match the [verified ref/CI receipt](evidence/CF-HOSTED-READ-stack.json); every adjacent base is an ancestor, and read-only `merge-tree --write-tree` produced the child's exact tree. #22's push 38615342812 and PR run 38615380877 both passed 653 tests. The refreshed main API reports unprotected, rulesets empty; detailed protection access returns 403. This is not evidence of enforced review/CI protections.

Fresh review of #22's actual diff, SQL triggers and C2/C3 contracts found:

| Area | Finding and disposition |
|---|---|
| Publication | Candidate metadata is committed with fenced C2 acknowledgment and final queue generation; interruption rolls both back. Preserved. |
| Invalidation | Material evidence/context/identity changes invalidate through queue generations; source deletion/relink and status changes clear candidates. C3 revalidation remains the authority, including corrupt/expired candidates. Preserved. |
| Future timers | Only the legitimate future-timer generation exception remains current before its due boundary. Preserved. |
| Selection/scope | Indexed rank/due/ID ordering, record-scoped access, bounded windows, empty-page continuation and honest backlog coverage. Preserved. |
| Historical evidence | Local hydration was unbounded and repeated per event/fact, twice per record. Corrected in the portable path with explicit overflow rejection. |
| Stored decision integrity | C3 checked trace action/reason category/profile, but altered decision text could survive those checks. Added complete canonical SHA-256 decision verification and context-snapshot validation when its context is current. Corrupt text now fails UNAVAILABLE; an outdated context still reports STALE. |
| Missing evaluation state | Authorized existing detail records without a queue row explicitly return UNAVAILABLE, while genuinely absent/unauthorized records remain unavailable to the caller. No old action is substituted. |
| HTTP read boundary | Existing outer Solo Desk rate-limit middleware writes accounting rows. It is not invoked by this isolated harness. A future hosted GET path must separately reconcile this with its read-only contract. No live route was modified. |

The review is an engineering diff/contract review, not independent human release approval. The new read implementation is additionally compared against the immutable #22 code, rather than only comparing two paths sharing new functions.

## 2. Smallest portability change

`producer-intelligence-portable.mjs` consumes the existing trusted-server producer read contract through a D1-binding-shaped interface. It accepts synthetic-only construction and advertises `D1_COMPATIBLE_SYNTHETIC`, not certified hosted D1. Production `functions/`, hosted routes, configuration and `migrations/` are unchanged. Inventory browsing intentionally remains on its existing implementation; attempting portable inventory returns UNAVAILABLE instead of falling back. Attention, Today and detail use the bounded path.

Canonical E2 projection, C2 context normalization and pure C3 selection were extracted into runtime-neutral modules. Local writes/evaluation continue using their established SQLite adapters. The portable import graph contains no Node SQLite/crypto modules; Web Crypto computes the same SHA-256 JSON versions. No second scoring engine, memory store or cache was added.

The prior approximately 588-statement/25-record read repeatedly loaded identity, context, revisions, results, traces, events, assertions and source references, including two profile reconstructions. The portable path retrieves all selected inputs in **one SELECT with eight parameters**, then performs the same current-time and decision-time reconstructions in memory. This is a round-trip reduction, not a claim that SQL performs only one row lookup.

`tests/migrations/0023_bounded_read_history.sql` adds one local index on workspace/prospect/observed time/event key. It includes tombstones because source-ID conflict holds can remain relevant after an event ceases to be active. Existing candidate, assertion, result and source indexes are reused. This file is not a hosted migration.

## 3. Authorization and consistency contract

- Authorization runs first on every request through the existing injected trusted server authorizer. Tenant and actor are server-derived; query-string workspace values do not confer authority. Cursor contents confer no access.
- The adapter independently checks scope shape, actor, identifiers, allowlist size and detail membership. SQL applies workspace predicates to every persisted lookup. Record-scoped selection joins at most 100 server-authorized IDs via a JSON parameter; it does not scan the tenant and then filter unauthorized rows.
- Candidate selection, coverage hints, queue, identity, policy context, evidence, source validity, latest result and trace are evaluated in the **same SQL statement**. There is no sequence of awaited evidence queries to mix revisions, and no read-time repair.
- `withSession('first-primary')` requests primary freshness for that statement. Session sequential consistency is **not** used as proof of an atomic multiquery snapshot.
- SQLite tests interleave an actual second-connection writer inside the SELECT. The result is wholly from the statement snapshot; a subsequent read sees the changed ownership/suppression and holds or excludes the record. Changes committed before the SELECT are observed. There is no bounded-retry loop because one statement is the consistency boundary.
- A write committed after the snapshot can invalidate that result before the client receives it. CURRENT means valid **as of that read snapshot**, not a lock on future evidence. Refresh reevaluates it; all execution authority stays false. No implementation can promise permanent currentness after a concurrent writer commits.
- Missing schema/index, malformed context, oversized/corrupt evidence, invalid adapter metadata, driver failure and history overflow produce unavailable results. Corrupt decision digests fail closed. STOP, CONTROL, wrong number, takeover, identity/source holds and unknown ownership remain non-actionable. No stale legacy action fallback survives.

This establishes SQLite statement-snapshot behavior and a portable API/SQL contract. It does not certify D1 replication, binding resolution, deployed auth or runtime semantics. The test binding executes real file-backed SQLite; it is **not** Miniflare, workerd or an actual hosted D1 instance.

## 4. Explicit resource budget

| Dimension | Implemented boundary |
|---|---|
| SQL calls per attention/detail read | 1 SELECT; no read retry, schema probe or mutation call |
| Bound parameters | 8, including the entire authorized allowlist |
| Page | Default 25; maximum 40; 41 returns explicit READ_BUDGET_EXCEEDED without SQL |
| Candidates | At most page size + 1; lookahead is not hydrated |
| Record authorization | Maximum 100 scoped primary-key candidates; bounded in-memory/SQL ordering of that set |
| Retained events | 64 per selected prospect, plus one overflow sentinel; includes tombstones |
| Assertions | 12 per event, plus one sentinel; includes superseded claims needed at decision time |
| History overflow | Entire record UNAVAILABLE, explicit row/byte budget reason; never a partial CURRENT |
| Hydrated envelope | 65,536 UTF-8 bytes per prospect; larger payload replaced with an unavailable marker |
| Individual fields | Explicit SQL byte caps for evidence, source references, context, decisions, contact and queue metadata; malformed or oversized required inputs fail closed |
| Returned rows | At most 42 (40 selected + lookahead + coverage row) |
| Worst bounded history visits | 40 × 65 events and 40 × 65 × 13 assertions, plus indexed source/hold and fixed per-record lookups; no whole-history count/sort |
| Metadata / economic capture | Read metrics and existing decision/version/evidence references only; no GET-side analytics writes |

The SQL envelope cap applies before returning data to the adapter. Serialized transport/JS object memory is additional and measured separately; this is not an assertion that Workers memory equals payload size. SQL has bounded per-record intermediate work; an engine size/time limit still fails the whole read unavailable. SQL generated here is well below the documented 100 KB statement limit.

The 64-event boundary is a conservative acceptance limit, not a new retention policy. Records with larger relevant histories remain unavailable until a separately accepted history strategy exists. Nothing is silently discarded, archived or reclassified to fit the budget. Filtered/expired/overflow candidates consume the window, retain continuation and disclose limited coverage. No scan-to-fill loop is introduced.

## 5. Acceptance evidence

**672/672 local tests passed**, zero failures, cancellations or skips. Existing 653 tests are preserved; 19 portable-read cases add coverage for one-statement budgets, 25/40-record pages, 100-record allowlists, hashes, actual field supersession, conflicting renewals, row/byte overflow, tenant/record denial, invalid cursors, source retraction, expiry, pending/failure/identity states, unknown owner, STOP/CONTROL/takeover, stale acknowledgment, crashed lease recovery, concurrent writers, future timers, readonly reopen, driver failure and no runtime activation. All communication/calendar/CRM execution flags remain false.

The [independent baseline receipt](evidence/CF-HOSTED-READ-baseline-parity.json) records 11 exact C3 comparisons against unchanged PR #22: CALL, quote, waiting, conflict, material history, STOP, CONTROL, unknown owner, future timer, expiry and retraction. Status, evidence version, decision version and other C3 fields matched. The intentional new corrupt-decision rejection is tested separately.

Reproduce the full suite:

```sh
node --test --test-isolation=none --experimental-loader ./tests/json-loader.mjs tests/*.test.mjs
```

For the independent reference, create a detached checkout of `80cb58ae7793d7bccabd084ffce1994f284cfdba` and pass its path to `scripts/audit-portable-baseline.mjs` using the same JSON loader.

No provider actions, customer communications, CRM mutations or appointments occurred in the synthetic simulations. Existing designated projection/GET regressions pass. This does not imply that the deployed HTTP middleware performs zero accounting writes.

## 6. Scale and memory evidence

| Prospects | Page p50 / p95 ms | SQL mean ms | C3 projection mean ms | Backlog p95 ms | Evidence invalidation mean ms |
|---:|---:|---:|---:|---:|---:|
| 1,000 | 28.13 / 48.64 | 7.80 | 22.51 | 4.23 | 0.532 |
| 5,000 | 28.10 / 35.29 | 7.82 | 21.15 | 3.69 | 0.488 |
| 20,000 | 29.85 / 44.53 | 9.18 | 21.44 | 5.13 | 0.509 |
| 50,000 | 32.83 / 46.16 | 9.28 | 24.54 | 3.57 | 0.494 |

Fresh-process memory (MiB; build and reader are different processes):

| Prospects | Build peak RSS | Reader start RSS | Reader peak RSS | Reader final JS heap |
|---:|---:|---:|---:|---:|
| 1,000 | 148.4 | 70.1 | 129.5 | 24.5 |
| 5,000 | 303.8 | 70.5 | 130.9 | 22.8 |
| 20,000 | 379.8 | 69.1 | 130.8 | 22.9 |
| 50,000 | 426.3 | 69.8 | 129.1 | 23.0 |

The initial response was 951759 bytes with 5377 bytes of SQL. Reader peak RSS was approximately 129–131 MiB across populations; this remains a hosted memory acceptance concern, not proof that a 128 MB Workers isolate will succeed. The final JS heap was approximately 23–25 MiB, but it excludes native/runtime allocations. The prior whole-build high-water mark must not be used as per-request memory.

[Raw receipts](evidence/CF-HOSTED-READ-benchmark.jsonl) are reproducible with:

```sh
node --experimental-loader ./tests/json-loader.mjs scripts/benchmark-portable-producer-read.mjs
```

Each population is built/evaluated in a fresh process. A separate fresh read-only process measures 30 reads against 100 late-ID CURRENT candidates, each with 21 retained source events/assertions. This separates construction/native allocations from reader measurements. The 100 candidates paginate without duplicates or omissions across four pages in the unchanged dataset. The fixture has one additional seeded identity.

Instrumented predicates inside the actual SQL measured **26 candidate visits, 525 event visits and 525 assertion visits** per initial 25-record page at every population. These counters exclude additional fixed/source/hold index probes; they are not D1 billed `rows_read`. Raw plans show indexed SEARCH on candidate/history/assertion tables. Temporary ordering over the already bounded candidate set is allowed. There is no prospect-population or unbounded history sort. Local D1-shaped metadata deliberately reports `rows_read: null` rather than fabricate hosted counters.

Separate processes admit material new evidence for all but the last prospect, then fresh readers evaluate the backlog. Only the remaining CURRENT candidate appears; pending and unpublished coverage is LIMITED. No queued work is claimed or drained by the read. Evidence-admission/invalidation timing is in the raw receipt. No DB mutations occurred during the measured reads.

These are shared-host Node/SQLite timings, not D1 latency, capacity, CPU billing or Workers isolate memory. Node RSS includes Node, SQLite and native statement allocations. The raw receipt separates heap/RSS, build/read phases and CPU measurements; there is no claim of a solved Workers memory budget or real economic improvement.

## 7. Official D1 constraints and actual tier gap

Reviewed official [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [database/session API](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [D1 metrics](https://developers.cloudflare.com/d1/observability/metrics-analytics/).

D1 documents 100 bound parameters per statement, 100 KB SQL, 2 MB string/BLOB/row size and 50 Free / 1,000 Paid queries per invocation. Workers documents 128 MB per isolate and 10 ms Free CPU; Paid CPU limits/configuration differ. Eight bindings and one statement fit the documented query/parameter ceilings of either tier. That alone does not establish CPU, memory, daily-row or whole-HTTP-request acceptance. The measured projection cost warrants particular caution about Free CPU; no plan upgrade is proposed or authorized.

**Actual Workers tier, configured CPU limit, D1 schema/version, replication/session behavior and account usage are unverified.** A Cloudflare zone plan is not proof of a Workers tier. The minimum hosted test must run the same isolated synthetic workload on the intended tier, inspect D1 rows read/written and runtime CPU/memory, verify atomic SQL behavior and inspect cross-tenant failures. Querying the production customer database is not authorized.

## 8. Deployment safety, migration and rollback

| Evidence | Verified / unknown |
|---|---|
| GitHub #22 Cloudflare Pages check | Successful automatic Preview for `80cb58a`; project `coveragefit`, immutable Preview `https://8d116137.coveragefit.pages.dev`. Metadata observed only; no hosted workflow exercised. |
| Branch deployment behavior | A draft-branch push demonstrably produced that Preview. Production branch, include/exclude rules and merge-to-production behavior remain unverified. |
| Repository config | Only test workflow; no checked-in Wrangler binding/environment definition or deployment/migration job establishing actual configuration. `_routes.json` includes `/api/*` and `/begin`. |
| Database / auth names | Code expects `COVERAGEFIT_DB`, `COVERAGEFIT_PRODUCER_ACCESS_TOKEN`, server workspace `COVERAGEFIT_SOLO_WORKSPACE_ID` and configured producer actor. Actual Preview/Production values, distinct database IDs and secret-store access unverified. |
| Record authority | Existing deployed model is a producer token and server workspace/actor, not proven multi-tenant roles. Dogfood needs independently verified server cohort/record scope. |
| Outer GET behavior | `functions/api/solo-desk/[[path]].js` wraps the handler in `withD1RateLimit`, which INSERTs/updates counters and can DELETE old buckets. This prevents describing the complete current HTTP path as mutation-free. Preserve abuse protection while separately reviewing a suitable read boundary. |
| E2/C2 hosted persistence | Write/admission/queue adapters remain local-only. A portable reader does not establish hosted source ingestion, transactional queue publication or bootstrap execution. |

**BLOCKED — EXTERNAL CLOUDFLARE ACCESS REQUIRED FOR RELEASE VERIFICATION.** When access is available, the minimal consolidated owner-assisted evidence is one read-only project configuration review/export: Workers tier/limits, Preview and Production branch settings, distinct binding/database identities, migration history, authorization mapping, deployed SHA and approved rollback target. No secret values are needed in the report. No login or manual intervention is requested during this engineering cycle.

Prepared additive strategy, **not executed or authored as hosted migrations**:

1. Inventory the intended isolated hosted schema and compatibility; reconcile existing production migrations with E2/C2/attention tables, triggers and this history index. Review foreign keys, erasure and trigger behavior against actual D1.
2. Apply separately approved additive changes to an isolated synthetic database first. No real data copying. Require missing schema to remain UNAVAILABLE.
3. Bootstrap in bounded pages through an accepted explicit ingestion/evaluation mechanism. Existing results start without trusted candidates; only fenced C2 evaluation publishes them. GET requests never backfill or repair.
4. Verify candidate rebuild, concurrent invalidation, source rights, rollback and per-tier resources before separately authorizing a default-off read-route integration. This cycle supplies no hosted write worker or bootstrap runner.

Rollback now is to omit this draft and retain #22; local fixtures are disposable. The added local index is additive and old code can ignore it. No hosted rollback was performed. Later activation must have an immutable deployment rollback target and tested disable/fail-closed path that does not expose stale legacy recommendations. Preserve evidence erasure and STOP during any forward repair; restoring an old data backup is not automatically safe.

## 9. Smallest path to authorized producer dogfood

Stop at this engineering acceptance. Remaining work is integration/release evidence, not another intelligence architecture milestone:

1. Independently authorize and validate isolated hosted persistence/statement behavior, tenant/record authority, resource budgets, middleware boundary and deployment/rollback behavior.
2. Review and accept a bounded, rights-qualified producer cohort and source mapping. Until then, use synthetic data only. Any hosted ingestion/queue port is separately reviewed, not implied by this reader.
3. After explicit deployment and dogfood approval, expose only current internal recommendations in existing surfaces. AgencyZoom retains workflow/cadence ownership. RingCentral, automatic SMS/dialing, calendar/CRM writes and Dynamic Cadence C4's communication canary remain separately gated.

Minimal measurement contract reuses existing response and storage fields: decision/profile/context/generation versions, evidence refs, read `as_of`, status/reason, coverage, producer disposition and observed effort/outcome references. Existing `cf_opportunity_effort`, acquisition measurement and verified policy-outcome records remain the intended stores; no parallel analytics database is introduced. Future explicit review-completion/outcome capture must be authorized separately and never inserted by GET.

Track producer minutes per independently verified useful two-way conversation, qualified conversations per 100 cohort leads, avoided repeated questions, quote-ready handoffs, verified quote/bind outcomes and unnecessary interruptions. Preserve denominator, verification source and correction effort. This package adds bounded operational read metrics only; producer measurement capture is **specified, not activated**, and synthetic recommendations are not economic results. Individual Prospect 360 histories remain private; aggregate market-intelligence commercialization remains parked.
