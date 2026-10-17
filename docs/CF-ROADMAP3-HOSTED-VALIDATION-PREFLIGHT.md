# Roadmap 3.0 hosted validation preflight

2026-10-14 · CF-ROADMAP3-HOSTED-VALIDATION-PREFLIGHT-1.0

## A. Executive disposition

**CONDITIONAL — SPECIFIC BLOCKERS REMAIN.** The local engineering baseline is accepted. The isolated hosted test is specified below, but must not be executed until resource identities, isolation, authorization, quota headroom and a reviewed harness artifact are established. This is not Production release readiness or a request to merge.

This change is documentation only. No route, flag, migration, provider integration, account setting or runtime code changes. All PRs remain draft/unmerged. No customer records were read, copied or enrolled; no hosted test was run. Roadmap 3.0, Evidence Flywheel, SIGNAL and Producer Attention Sovereignty remain governing. Producer Integration C4 is completed local read-contract engineering; Dynamic Cadence C4's live communication canary remains unapproved/unimplemented. Aggregate market intelligence remains parked.

**Smallest next action:** one read-only Cloudflare configuration inventory, using the exact checklist in section H. It unlocks a concrete isolated-test approval packet; it does not authorize resource creation, deployment, migration, customer data or providers. No login, credentials or generic screenshots are requested in this report.

## B. Verified technical baseline

Git refs and GitHub APIs refreshed on October 14, 2026. [Machine-readable receipt](evidence/CF-HOSTED-PREFLIGHT-refs.json) records observation time, exact base/head refs, draft/merge state, CI and deployment metadata. Main remains `5f47f2b7367110ca04ff03cc189983f136ab32fa`.

| PR | Exact head | Parent | Successful exact-head push CI |
|---|---|---|---|
| #7 | `ad2915a7889637580505293ce38ab4db66f0a9b3` | main | [38305917703](https://github.com/dhays4sports/CoverageFit/actions/runs/38305917703) |
| #16 | `5cfa79f4d01a8d9a3bf558c44d019064ca477f2a` | #7 | [38560012191](https://github.com/dhays4sports/CoverageFit/actions/runs/38560012191) |
| #17 | `247b708d2615c0caa72d2a95402a59507ccf9b45` | #16 | [38595322944](https://github.com/dhays4sports/CoverageFit/actions/runs/38595322944) |
| #18 | `33d6a48b448e224b878d075a3348d9ae5caf5369` | #17 | [38595766936](https://github.com/dhays4sports/CoverageFit/actions/runs/38595766936) |
| #19 | `01a58c57857c63cbb5c7c426f8ebc38d73d96f2d` | #18 | [38600082788](https://github.com/dhays4sports/CoverageFit/actions/runs/38600082788) |
| #20 | `0098c34b5dc25d1c35816ed8c9b30f606f48a76d` | #19 | [38603518868](https://github.com/dhays4sports/CoverageFit/actions/runs/38603518868) |
| #21 | `e40d0367921640cd40987d57073125d4921b3416` | #20 | [38610674599](https://github.com/dhays4sports/CoverageFit/actions/runs/38610674599) |
| #22 | `80cb58ae7793d7bccabd084ffce1994f284cfdba` | #21 | [38615342812](https://github.com/dhays4sports/CoverageFit/actions/runs/38615342812) |
| #23 | `6276412d7c317d66283159b5f4edbd0ea883e020` | #22 | [38628141934](https://github.com/dhays4sports/CoverageFit/actions/runs/38628141934) |

All nine PRs are open, draft, unmerged and reported mergeable. Every exact parent is an ancestor of its child; local `git merge-tree --write-tree BASE HEAD` equals the child's tree for all nine. No refreshed target head moved. Other open PRs predate #23; overlapping historical #12/#14/#15 work is already consolidated through #16 and must not be independently merged. A clean ancestry result is not release authority or proof of enforced branch protection.

#23 tree is `677c632b3c8edc70995048b5d5894672d14ce193`. Its push CI and [PR integration CI](https://github.com/dhays4sports/CoverageFit/actions/runs/38628149799) remain successful. The accepted evidence is 672/672 tests, 19 portable cases and 11/11 immutable #22 semantic comparisons; [report and reproducible receipts](CF-HOSTED-READ-INTEGRITY-ACCEPTANCE.md). Existing results are not relabeled as newly executed hosted evidence.

Fresh preflight verification: 20/20 portable-read/rate-limit-diagnostic tests passed with zero failures/skips; the independent immutable #22 comparison was rerun and passed 11/11. No runtime change justified another local scale benchmark. Documentation-head CI receipts and exact publication SHA are recorded in the draft PR body rather than a self-referential commit field.

Reviewed implementation and wiring:

| Files | Finding |
|---|---|
| `server/producer-intelligence-portable.mjs`, `producer-intelligence-sql.mjs` | Synthetic-only constructor; one bounded SELECT/eight bindings; primary session; scoped candidate/history hydration; no write/repair/provider path. |
| `producer-intelligence-read.mjs`, `producer-intelligence-contract.mjs` | Trusted injected authorizer plus independent scope validation; CURRENT/human attention/execution separated; SHADOW authority false; actual `D1` runtime rejected. |
| `prospect-memory-projection.mjs`, `signal-context.mjs`, `signal-current-decision.mjs` | Shared portable canonical logic, no Node SQLite dependency; evidence, context, queue and digest checks remain. |
| `prospect-memory-local.mjs`, `signal-evaluation-queue-local.mjs` | Local-only durable mutation/claim/acknowledgment; not hosted ingestion/evaluation. |
| `functions/api/solo-desk/[[path]].js`, `solo-desk-api.mjs` | Existing wrapper/dispatcher unchanged; no portable reader import or route wiring. |
| `cloudflare-rate-limit.mjs`, `cloudflare-pages-handlers.mjs`, `consultation-inbox-core.mjs`, `solo-desk-repository.mjs` | Security accounting writes and legacy auth limitations detailed below. |
| `.github/workflows/test.yml` and `_routes.json` | Test workflow on push/PR/manual; route configuration is not proof of live bindings. No checked-in Wrangler environment or deployment/migration workflow establishes current account settings. |

#23 changed 21 files, including pure-module extraction and tests, but no `functions/`, production `migrations/`, `_routes.json` or CI configuration. No new activation code was introduced. Existing application still includes provider-capable routes elsewhere; absence of credentials in the proposed harness must be independently verified, not inferred from false execution flags.

Two precise limitations need explicit handling before hosted testing: cursors are validated unsigned keyset tuples, not authenticated scope-bound tokens; and the existing Solo Desk identity is shared-token authorization plus `COVERAGEFIT_SOLO_WORKSPACE_ID` (with a default) and actor from `producer-config.mjs`. Earlier shorthand about a configured actor must not be interpreted as a per-user identity system.

## C. Cloudflare environment evidence

No Cloudflare account API capability is available here. A single read-only dashboard visit reached **Sign in to Cloudflare**; no sign-in or verification attempted. Account settings remain inaccessible. The Sites connector is not authority over this GitHub-managed Pages project and was not substituted.

| Item | Evidence class / finding | Missing verification / action |
|---|---|---|
| Platform/project | Verified GitHub Cloudflare Pages check for #23; project `coveragefit`. Repository supplies Pages Functions. | Actual active Functions build, other Workers/routes and compatibility date/flags require account inventory. |
| Account identifier | Check URL names `ac46c14627f1ad50d6f4c92b347c957c`. Public deployment metadata, not authenticated account ownership proof. | Confirm project/account association in dashboard. |
| #23 Preview | Check 116072647476 reports success, deployment `02ea6a76-a1e3-4185-90e0-b4294083e9cf`, SHA `6276412d7c317d66283159b5f4edbd0ea883e020`. | Not exercised; no auth, isolation, runtime or data certification. |
| Automatic deployment | Verified draft push generated Pages Preview. | Production branch, include/exclude/watch paths, build hooks and all trigger rules unknown. |
| Production | Main Git SHA known; actual served SHA unknown. | Deployment ID/SHA, active route and immutable compatible rollback artifact. |
| D1 | Expected binding `COVERAGEFIT_DB`; actual UUIDs unknown. | Preview/Production UUID comparison, test DB existence, replication, schema/migration inventory. Never assume separation. |
| Auth/secrets | Expected `COVERAGEFIT_PRODUCER_ACCESS_TOKEN`; resolver accepts a string or `.get()` binding. Workspace/actor behavior verified statically. | Presence/type per environment, independent actor/cohort mapping, access policy. Do not export values. |
| Plan/resources | Workers tier, CPU configuration, usage, quota headroom and observability unknown. | Workers subscription/limits and project metrics, not the website zone plan. |
| GitHub protection | Refreshed main: `protected:false`, required-status enforcement off; rulesets endpoint returns `[]`. | No enforced review/CI protection established. Owner must make a separate protection decision before eventual integration; no setting changed. |

Official specifications checked October 14 (documented limits, **not account facts**):

| Topic | Relevant specification and acceptance implication |
|---|---|
| [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) | 100 parameters, 100,000-byte SQL, 2,000,000-byte string/BLOB/row, 32 function arguments, 30-second SQL duration. D1 page lists 50 Free/1,000 Paid queries per invocation. Our read is one query/eight bindings; whole HTTP accounting is additional. |
| [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) | 128 MB per isolate, shared across concurrent requests; Free HTTP CPU 10 ms; Paid default 30 seconds/configurable to 5 minutes. HTTP duration differs from CPU and depends on connection lifetime. Current Workers page lists 50 Free external/1,000 internal subrequests and 10,000 Paid default; this differs from D1's query table. Use the stricter D1 figure until applicability is confirmed; our small query budget fits both. |
| [Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/) | Functions use Workers accounting; a Pages/zone label does not establish execution allowance. Verify platform-level fail-open/fail-closed behavior on exhaustion. |
| [D1 sessions](https://developers.cloudflare.com/d1/worker-api/d1-database/) | `first-primary` directs the first query to primary; later queries may be sequentially consistent replicas. It is not an atomic multiquery snapshot. Our one SELECT is the intended snapshot boundary. |
| [SQL support](https://developers.cloudflare.com/d1/sql-api/sql-statements/) / [JSON](https://developers.cloudflare.com/d1/sql-api/query-json/) | SQLite conventions/JSON supported. Actual MATERIALIZED CTE, correlated hydration, window function, row-value keyset comparison, INDEXED BY and JSON serialization/order must compile and agree on hosted D1. No unsupported custom SQL function is required by the reader. |
| [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) | Free includes 5 million rows read/day, 100,000 written/day and 5 GB total storage. Paid includes allowances with overages. Indexes/DDL/bootstrap/accounting also consume resources; no zero-cost claim without actual headroom. |
| [D1 metrics](https://developers.cloudflare.com/d1/observability/metrics-analytics/) | Capture actual rows read/written and SQL metrics; returned candidate count is not billed rows read. Use Workers invocation metrics for CPU/wall time, not local Node RSS or JavaScript timer deltas as CPU certification. |
| [Branch controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/) | Preview rules are configurable; inspect actual settings rather than infer from one successful check. |

SQL review found no known definite syntax incompatibility requiring a speculative code change. The largest JSON-object argument list is within the documented function-argument limit. Intermediate JSON construction can still exceed driver/runtime limits before the final 65,536-byte envelope cap, particularly at maximum history sizes: errors must produce unavailable, never partial CURRENT. This remains a hosted stress test.

### Isolation choice

| Option | Assessment |
|---|---|
| Existing production project Preview | Reject by default: bindings/credentials may be inherited/shared and the full dispatcher exposes unrelated routes. Accept only with explicit verified isolation; no such proof exists. |
| Existing dedicated synthetic Pages/Worker + distinct D1 | Preferred if inventory proves correct tier, no real data, no production/provider bindings, private access and disposable rollback. No suitable resource is currently verified. |
| New minimal private acceptance deployment + one synthetic D1 | Conditional fallback. Same Workers tier/compatibility as intended runtime, no Git auto-deploy, no custom production domain, no provider/CRM/cron bindings. One D1 may hold synthetic business tables and a separately scoped accounting table; two databases are unnecessary unless actual isolation policy requires them. Creation/cost needs separate approval. |

A standalone minimal Worker can validate Workers/D1 driver behavior; if the eventual deployment is Pages Functions, the Pages packaging/auth/middleware boundary still requires targeted acceptance before integration. No architecture migration is implied. Do not inherit the full application or import `cloudflare-pages-handlers.mjs` into the harness merely to resolve a test credential.

## D. HTTP and rate-limiter decision

### Current path and effects

Actual order is **HTTP → `withD1RateLimit` → resolve producer secret → shared-token auth → binding check → repository SELECT readiness → route dispatch → legacy read projection → response**. Authentication does not run first in the current wrapper.

The limiter keys `route:IP:window`, uses `CF-Connecting-IP` then forwarded-for fallback, UPSERTs the counter, SELECTs it, and with 2% probability schedules DELETE of buckets older than an hour. A request above 180/minute receives 429. Missing binding or query errors call the handler unless `failClosed:true`; the current Solo Desk invocation omits that option. Fail-open logging includes the raw error. The two-step count is not a single atomic admission result; concurrency can conservatively over-deny. A missing/malformed count becomes zero, which also needs fail-closed handling in the test boundary.

Authentication resolves a string/secret-store binding; unavailable or short token returns 503, invalid bearer returns 401. Scope does not come from client workspace parameters, but a shared token is not independent actor/record permission. `repo.ready()` is SELECT-only. Legacy dispatch initializes service objects and contains other GET and POST behaviors; prior designated GET tests do not certify every route or its provider dependencies. The proposed test must not call that dispatcher.

| Effect | Treatment |
|---|---|
| Rate counter INSERT/UPDATE and bounded expiry cleanup | Legitimate security accounting; disclose and measure separately. Never describe whole HTTP GET as physically write-free. |
| Evidence/context/queue/result/decision/identity/contact changes | Prohibited during intelligence GET. Compare all business tables and revisions, including side effects of triggers. |
| Schema creation, migration, scoring refresh, UCP initialization, candidate repair | Prohibited read-time operations; missing dependency returns unavailable. |
| Analytics/business outcome append, provider/CRM/calendar/scheduler operation | Prohibited; no GET telemetry insertion into business stores and no external execution. |

### Selected minimal boundary — proposed, not implemented or activated

Use a minimal private acceptance endpoint with only the portable read import graph. Gate it default-off; permit GET attention/detail only. Proposed flag `CF_HOSTED_READ_ACCEPTANCE_ENABLED` is a future harness setting, not an existing live flag. Missing/false returns 404. No fallback to legacy actions/routes. Reject POST/other methods with 405. No public fixture mutation endpoint.

Preserve pre-auth abuse protection with a bounded global ingress bucket, then authenticate with distinct test-only credentials, resolve a frozen server-owned tenant/actor/cohort map and apply a per-tenant/actor bucket. Reuse the existing D1 counter approach, with a **narrow separately reviewed harness variant**, not a distributed limiter. Both stages must fail closed (503 on storage/schema/count failure), use only trusted edge client-address information, hash bucket identities, redact errors and expose no remaining tenant counts. Scope keys by deployment + route + tenant + actor; the ingress bucket is deliberately global abuse accounting, never a tenant signal.

Prefer one atomic UPSERT ... RETURNING count per stage, validated on D1, instead of the current write/read pair. Refuse nonnumeric/missing count. Proposed acceptance limit: global 180/minute, authenticated actor 60/minute; both fixed window, with documented possible boundary bursts. No random cleanup in GET: a separately authorized, bounded cleanup/disposal operation handles this short-lived test. This modifies only the future isolated harness; existing routes remain unchanged. Exact ceiling must remain within verified quota headroom.

Normal valid request budget: **2 accounting statements + 1 business SELECT**, no retries. Unauthorized: at most ingress accounting, no business query. Exhausted tenant bucket: no business read. Missing storage: 503, never handler fallback. No SQL is generated from user strings. Test request/body/URL size caps, private/no-store responses, error redaction and credential-free logs. D1 bindings themselves are not presumed table-level read-only credentials: static imports, exact prepared-statement allowlist and before/after business digests enforce the application boundary.

Required HTTP tests (not yet run hosted): normal auth (only accounting changes); unauthorized (401/no business read); missing binding/table and DB error (503/no fallback); exhaustion (429/Retry-After); concurrent increments (no more accepted requests than budget within a fixed window); actor/tenant separation at shared IP; spoofed forwarding headers; missing/invalid count; disabled flag; method denial; no private data in metadata/errors; no provider/CRM/appointment/scheduler calls. Run security-accounting and business-integrity assertions separately. Global ingress contention is deliberate and must not disclose other tenant identity/activity.

## E. Isolated hosted test specification

**Status: designed, not deployed.** Before approval freeze an exact harness SHA/artifact digest, binding UUID, schema digest, compatibility date/flags, authorization-map digest, tier/CPU allowance, quota headroom and cost ceiling. The harness must explicitly retain `syntheticOnly:true` and synthetic contract labeling; do not globally accept `runtime:'D1'` or activate production routes to run this test.

### Fixtures and reproducibility

Start with 100 synthetic prospects in tenant A and 20 in tenant B; unique IDs across tenants to respect existing globally keyed opportunity/customer tables. Use generated fictional contact labels, no deliverable phone/email addresses. Freeze clock at `2026-10-14T12:00:00.000Z`, then advance only through the privileged test controller. Two actors in A have disjoint server allowlists; actor B belongs only to B. Explicitly test empty scope, up to 100 allowed IDs, and workspace-wide test authority as distinct grants.

Generate baseline fixture tables through the existing local E2 admission → C2 context/evaluation/fenced acknowledgment pipeline, export only those synthetic rows with manifest/digests, then import into a separately authorized empty D1. Preserve decision JSON bytes and canonical hashes. Never hand-author a CURRENT candidate. Import completed fixture states first and verify them before exposing the read endpoint. The fixture transport is not proof of hosted ingestion or queue execution.

Include CURRENT CALL/quote/human-review, waiting/no-action, PENDING, STALE, HELD, FAILED, UNAVAILABLE, missing queue, STOP/opt-out, CONTROL, wrong number, identity ambiguity, producer takeover, AGENCYZOOM and unknown owners; call/SMS permission false independently. Include 1/21/64 retained events, 65-event overflow, 12/13 assertions, byte-cap boundaries, corrections, conflicts, expired/retracted sources and tombstones. Put urgent IDs last. Use 1,000 prospects only after the small functional suite passes; 5k/20k/50k remain optional separately budgeted experiments, not required to repeat local scale claims.

### Required acceptance matrix

| ID | Test | Pass condition |
|---|---|---|
| H01 | Default 25/max40 attention pages, detail and Today wrapper | Same status/action/evidence/context/decision hashes as canonical fixture oracle; urgent late ID first; waiting not urgent; execution false. |
| H02 | Equal rank, expired/filtered empty pages, pending backlog | Stable rank/due/ID continuation; no scan-to-fill; no loss of cursor; LIMITED coverage when relevant; fresh first-page restart finds newly raised priority. No cross-request snapshot claim. |
| H03 | Safety/ownership/history changes | New committed material revisions suppress old candidates; STOP/CONTROL/identity/source/owner/takeover restrictions survive; only governed later evaluation can restore eligibility. |
| H04 | Future timer and clock boundaries | CURRENT before justified future due boundary, pending/stale/held as canonical after; request cannot set its own clock. |
| H05 | Tenant/actor/record authorization | Client workspace/actor ignored; unknown/missing credential denied; unauthorized detail indistinguishable from absent; no other tenant values, counts, cursor keys or private errors. Empty allowlist produces empty scoped results. |
| H06 | Cursor manipulation | Malformed/out-of-range cursor denied before business query. Existing syntactically valid edited tuples are untrusted positions, never grants, and may skip data only within authorized scope. They are not currently tamper-evident. If strict tamper denial is required, wrap tuple in a short-lived server-authenticated token bound to actor, tenant, cohort version, filter and build; test cross-scope replay denial. This narrow HTTP feature remains unimplemented and a test-entry gate, not an asserted #23 property. |
| H07 | Hosted consistency | Actual one SELECT returns coherent tuples under controlled competing writer; pre-read acknowledged writes visible on first-primary; overlapping read yields one complete allowed revision, not mixed hashes; post-read change appears next read. Record driver/bookmark/timestamps, never assert later session calls form a snapshot. |
| H08 | Failure/corruption | Missing index/table/binding, invalid JSON/digest, inconsistent revisions, overflow, failed driver and exhausted budgets return explicit unavailable/503 as appropriate; no previous CALL/question/quote fallback. |
| H09 | Read integrity/security accounting | Business table digest and revision snapshots unchanged after quiescent reads; business SELECT rows_written=0; only expected limiter rows change. For concurrent scenarios reconcile changes solely to writer receipts. |
| H10 | Driver/SQL compatibility | All attention/detail/restricted/cursor SQL shapes compile with eight bindings; JSON/order/hash parity; expected candidate/history/assertion indexes; missing index fails closed. |
| H11 | Resource/operational limits | Budgets below satisfied; unexpected timeouts/overload stop run. Do not intentionally exhaust shared account quotas; inject local/harness failures or use isolated per-request limits only after approval. |
| H12 | Restart/redeploy and no external execution | Reopen/reinvoke same data reproduces status; all external flags false; no provider credentials/bindings/imports; no outbound fetch or scheduler/CRM/calendar route reachable. |

Concurrency controller: a separate privileged administrative test runner, not the GET credential, performs a fixed reviewed sequence of synthetic context/revision/suppression updates against the isolated D1, each with transaction receipts. Where several rows must move together, use supported atomic D1 batch semantics and prove rollback; do not port local BEGIN IMMEDIATE blindly. Execute writes before SELECT, overlapped with SELECT and after response. D1's serialized query execution plus observed complete tuples supports the one-statement design; lack of ability to force an intra-statement hook is disclosed, not replaced by a mocked claim. Any torn/unexplained result is a hard stop.

### Proposed resource ceilings and measurements

These are **test approval thresholds**, not measured hosted results or implemented hard controls. Run controller must enforce total work caps and stop on first safety failure. No automatic retries/increases/plan upgrades.

| Dimension | Ceiling / recording rule |
|---|---|
| Reader | Exactly1 statement,8 parameters; SQL <10,000 bytes; page25/default40/max; max100 authorized IDs; max42 result rows. |
| HTTP | Normal3 total statements with proposed two atomic accounting stages; no business writes; accounting writes separately reported. No outbound provider subrequest. |
| Hydration | At most page+1 candidates; 64+1 retained events/prospect and12+1 assertions/event;65,536-byte record payload; >limit means UNAVAILABLE, not truncation. |
| Response | Proposed maximum4 MiB internal D1 response and4 MiB serialized HTTP response; record both, reject overflow. Current caps bound records but no existing whole-HTTP4MiB enforcement is claimed. |
| Rows read | Initial stop/review above100,000 D1 rows/read; expected fixed workload must not grow linearly with population. Record all actual meta counters including accounting; no equivalence to local visit counters. |
| SQL/runtime | Investigate/stop normal SQL >1second, HTTP p95 >1second or any >5seconds (same runner region; cold/warm separate). These are preflight goals, not Cloudflare guarantees. |
| CPU | Actual per-request metrics required; p95 <=80% of verified configured allowance and no limit errors. Free target<=8ms; do not assume prior local28–33ms wall time establishes CPU fit. Fail means review, no upgrade. |
| Memory |128MB isolate platform ceiling; zero OOM/resource errors at concurrency1 then5. Capture actual memory/heap if exposed; otherwise record unavailable and retain explicit memory-observability limitation. Node129–131MiB RSS is not an isolate measurement. |
| Run budget |<=300 HTTP invocations,<=1,000 business prospects plus20 tenant-B sentinels,<=2million total rows read and<=50,000 rows written including schema/index/bootstrap/accounting;<=100MiB database; stop at lower actual headroom. These are upper ceilings, not an assertion fixture construction fits them. |
| Cost |No incremental spending authorized. Must establish allowance/headroom before future run; if unable to ensure within included capacity, seek a separate explicit cost cap. No50k hosted expansion by default. |

Collect30 warm page25 and30 warm page40 samples (p50/p95), cold observations separately, then bounded concurrency5 and failure cases within300 total. Avoid overlapping intentionally rate-limited tests with latency sampling. Capture actual D1 SQL duration/rows_written/rows_read, response bytes, result size, index plans, Workers CPU/wall/outcome and request correlation IDs. Do not log credentials, IPs, synthetic payloads unnecessarily or any real records. Where timing/metrics cannot be obtained, the relevant gate is unresolved. Raw metrics/manifest belong in the acceptance receipt, not a new analytics platform.

Cleanup: first disable endpoint and revoke test authority, export sanitized receipts and fixture/schema hashes, then remove only explicitly designated disposable synthetic resources under the approved test cleanup scope. Preserve production entirely. Bounded rate-bucket cleanup runs explicitly, outside GET. Failure aborts further writes and traffic; no fallback to production.

## F. Hosted persistence dependency map

| Component / schema | Reader-only validation | Complete hosted loop |
|---|---|---|
| Existing migrations0001–0019 | Local fixture applies all in order; hosted applied versions unknown. Inspect schema metadata without customer rows. | Reconcile actual schema, foreign keys, uniqueness and ownership before additive port. |
| Solo opportunities/sources; UCP customers/households/links | Required synthetic identity/source chain. Source kind/id linkage must match exact prospect. | Existing authoritative identity retained; no phone-only merge. |
| Test0020: events/assertions/revisions/holds/decision traces | Required fixture schema; event/assertion source foreign keys, retention and supersession metadata. | Transactional admission/replay/correction/retraction/erasure port absent. |
| Test0021: revision changed_at, queue/results + triggers | Required state and result rows, due/lease indexes, context in `cf_solo_sources` kind `signal_c2_context_v1`. | Claim/fence/ack/lease/retry/erasure atomicity and restart acceptance absent on D1. |
| Test0022: attention columns/indexes/invalidation triggers | Required eligibility/order/due/JSON and unpublished index; candidate derived from accepted local fenced ack. | Hosted ack must atomically publish candidate with result and correct generation; no stale acknowledgment publication. |
| Test0023: evidence history index | Required `cf_evidence_read_history` explicit index. | Additive index compatibility/cost separately reviewed. |
| Pure E2/C1/C3 + C4 reader | Portable; reused unchanged with runtime tests. | Same functions; no separate scoring/memory layer. |
| HTTP auth/limiter/driver | New minimal test composition required as specified, not implemented here. | Independent real actor/record authority and deployed middleware acceptance required. |

No hosted migration authored or executed. Prepare a later reviewed ordered manifest (names, hashes, expected columns/indexes/triggers, schema pre/post digests). Do not apply test0020–0023 blindly to an unknown database or assume numbering implies installation. Verify foreign-key enforcement, source deletion constraints, decision erasure cascade and queue invalidation, context insert/update/delete, identity relink and opportunity closure triggers on actual D1. Source retraction/expiry logic also lives in application operations; presence of a trigger is not complete retention enforcement. Missing schema stays unavailable.

For **reader-only** acceptance, the reviewed fixture import transports completed local governed decisions; no hosted C2 worker is needed. Import with manifest-bound tables/IDs, correct dependency order and triggers accounted for; use empty DB and deterministic restart checkpoints. Abort on digest mismatch. Do not disable integrity triggers to make imported candidates pass; publish candidate fields last from the verified manifest after final queue state, then independently validate them. This is fixture reconstruction, not hosted acknowledgment certification.

For a **hosted operating loop**, separately implement minimal D1 admission/context and fenced evaluation interfaces. Bootstrap only rights-qualified, linked, unsuppressed inputs; authorizer names operator/reference and exact workspace. Batch<=25 prospects, keyset checkpoints, idempotent request IDs, bounded retries and expired-lease recovery; publish only while evidence/context/generation fences still match. Stale ack leaves newer work pending. Failed/unfinished work remains visible as limited coverage. Receipts include request/build/schema, cursor, revisions, counts/reasons and no secrets. No GET claim/refresh/backfill. Disable writes/worker before rollback; retain suppression, retention and erasure state. This is a dependency specification, not a new implementation authorization.

## G. Deployment and rollback assessment

Refreshed #23 Pages success proves automatic Preview deployment exists. It does not prove current Preview bindings, Production SHA or rollback compatibility. Documentation-only branch publication may also trigger a Preview build; it changes no runtime files and must not be used to activate or test hosted workflows. No Cloudflare configuration was changed by this preflight.

Before a future isolated deployment, pin reviewed harness SHA and packaged artifact digest; verify no production route, custom domain, provider binding, cron/queue trigger or Git auto-publish; prove default-off flag and missing-binding fail-closed path. Bind only the named synthetic DB and separate test credentials. Require exact-head CI and independent review. Main currently lacks enforced protections; successful checks do not prevent accidental merge. Any protection change is a separate owner action, not bundled here.

| Rollback surface | Executable plan for later approved test |
|---|---|
| Application code | Save immutable baseline deny-all harness artifact and deployment ID before enabling; restore that artifact and verify endpoint denies. No production redeploy. |
| Route activation | Remove/disable only acceptance route or test host; verify legacy Production routes/config unchanged. No fallback legacy recommendations. |
| Feature flag | Turn proposed acceptance flag off; missing flag must return404. Verify via test host before other cleanup. |
| D1 schema | For dedicated disposable synthetic DB, detach after disable and delete only with explicit cleanup authority. For future shared business DB, prefer forward repair/disable; no blind DROP or backup restore. Code revert does not undo migration. |
| Fixture/bootstrap | Stop runner, retain manifest/checkpoint/failure receipts; reconstruct a new empty synthetic DB or remove only manifest-owned rows under reviewed FK order. Never touch production/customer rows. |
| Authorization | Revoke dedicated test token/grant; restore recorded test policy; never restore previously revoked real access or copy production credentials. |
| Rate limiting | Keep fail-closed protection; disable endpoint if limiter rollback is unsafe. Preserve audit categories; clean test counters explicitly. Never resolve an outage by enabling fail-open. |

No immutable compatible hosted rollback target has been verified. The historical Preview is not one. No provider side effect exists to roll back in the proposed harness; discovering one aborts acceptance and requires incident review rather than retry.

## H. Owner-assisted action sheet — one read-only inventory

The only current account blocker is unavailable authenticated Cloudflare inspection. Complete these together once; export only a sanitized settings table, no tokens, passwords, secret values, account member lists, customer rows or raw request logs. This is an evidence request, not a mutation approval.

1. **Cloudflare account → Workers & Pages → account plan/usage and project `coveragefit` → Settings.** Inspect Workers subscription/tier, actual CPU configuration, compatibility date/flags, Functions runtime, request/CPU/D1 quota headroom and available metrics. Read-only; record limits and usage totals, not payment details. Unlocks resource/cost feasibility.
2. **Workers & Pages → `coveragefit` → Settings/build deployments/bindings/variables, then Deployments.** Export Production branch, Preview includes/excludes/watch paths, build hooks, deployed SHA/ID per environment, binding names and D1 UUIDs, secret presence/type only, workspace configuration presence and auth boundary. Confirm any candidate dedicated test environment and absence of provider bindings. Read-only; no revealing secret values. Unlocks separation, trigger and rollback choice.
3. **Storage & Databases → D1 → the identified database settings/schema/migration metadata.** Confirm UUIDs and environment mapping, size/usage/replication, migration names/hashes and schema/index/trigger definitions; inspect metadata only, no business-table rows or exports. Identify empty synthetic DB if one exists. Read-only; redact SQL literals containing credentials or actual data. Unlocks additive compatibility and fixture strategy.
4. **Workers & Pages → candidate test deployment → access/observability/settings and immutable deployment history.** Record test-access mechanism, platform quota failure mode, log availability/retention, rollback artifact ID and binding compatibility. Read-only; no enabling logs, creating credentials or deploying. Unlocks precise isolated-test artifact/access approval scope. If the test resource does not exist, report absent instead of creating it.

GitHub Settings → Branches/Rules → main has already been inspected through API: unprotected/no rulesets. No repeated screenshot needed. Before eventual integration, the repository owner must separately decide and verify protection/required checks; this is not a prerequisite to merely inventory Cloudflare or a request to change protections now.

## I. Go/no-go matrix and producer dogfood gates

| Gate | Status / evidence | Failure consequence | Next action / approval owner |
|---|---|---|---|
| Local E2→C4 integrity | ACCEPTED locally; #23 CI672 and recorded parity/benchmarks | Regression blocks further test | Preserve exact head; engineering reviewer |
| Preflight documentation | COMPLETE; no runtime mutation | Missing specification prevents bounded approval | Review this packet; principal |
| Account tier/isolation | BLOCKED; login wall, UUID/plan unknown | Possible production exposure or cost | SectionH read-only inventory; account administrator |
| Hosted reader semantics/resources | NOT TESTED | Unsafe/stale/unbounded advice | Approve isolated test only after named resources/artifact/budget; principal + technical reviewer |
| HTTP security boundary | DESIGNED; legacy limiter fail-open and writes confirmed | Abuse bypass or false read-only claim | Implement/review isolated composition, scoped cursor decision and negative tests; security/engineering reviewer |
| Hosted persistence/bootstrap | Fixture plan designed; operational E2/C2 absent | Seeded reader mistaken for durable operating loop | Separate scoped port/acceptance before genuine workflow; engineering + principal |
| Deployment/rollback | BLOCKED; automatic Preview observed, rollback unknown | Accidental production change/data mismatch | Freeze artifact/config, verify isolation/disablement; account administrator |
| Merge governance | NOT ENFORCED by observed main settings | CI/review can be bypassed | Separate branch-protection/integration decision; repository owner |
| Real-data/source authority | NOT APPROVED | Unauthorized evidence processing | Approved cohort, provenance, retention, identity/suppression/owner evidence; agency/controller |
| Provider/CRM/calendar | DISABLED / NOT AUTHORIZED | Unauthorized communication or workflow conflict | Separate future provider gate; agency/principal; not required to send anything for read-only dogfood |
| Producer economics | UNMEASURED | Synthetic output mistaken for value | Separately approved read-only cohort exercise; producer + agency |

Cloudflare-dependent gates: **BLOCKED — EXTERNAL CLOUDFLARE ACCESS REQUIRED FOR RELEASE VERIFICATION.** This does not invalidate local engineering and does not authorize repeated principal checks of unchanged historical Preview acceptance.

Before real read-only dogfood: accepted hosted read and authorization; accepted evidence-population/refresh path (not merely static fixtures); expressly approved existing-record cohort and frozen denominator; verified source rights/current identity/suppression/AgencyZoom ownership; defined retention and erasure; independent deployment approval; manual agency workflow fallback; explicit producer review/disposition process. No cohort enrollment, import, UI activation or customer communication under this mandate.

Reuse existing effort/acquisition/policy evidence contracts, not a parallel analytics platform. Predefine observation window, eligible cohort denominator and independent outcome verifier. Capture all review, troubleshooting, correction and conversation minutes. Primary metric = total producer minutes / independently verified useful two-way conversations (undefined when zero, never report zero cost). Also qualified conversations per100 eligible leads; repeated questions demonstrably avoided with evidence reference; quote-ready handoffs with producer confirmation; independently verified quote/bind/premium references; unnecessary interruptions/corrections/exceptions per reviewed item. Version each recommendation and disposition; an accepted suggestion is not a conversation, and a synthetic reply is not premium. Explicit authorized disposition writes occur outside GET. Existing `cf_opportunity_effort`, acquisition/exposure and policy evidence can be reused after cohort/mapping approval. No economics claimed here.

## J. Single recommended next action

**Obtain the sanitized read-only Cloudflare inventory in sectionH.** With that evidence, finish a narrowly reviewed synthetic harness artifact and request only isolated hosted-test authorization naming the environment, DB, exact SHA, cost/work caps, test-only mutations and cleanup. Keep merge, Production deployment, real-data dogfood and provider authority as separate later decisions. Stop here; no additional intelligence layer or automated communication milestone.
