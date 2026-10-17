# Engagement Capacity SHADOW 0.2 — engineering acceptance

Mandate: `CF-SIGNAL-ENGAGEMENT-CAPACITY-SHADOW-0.2`. Synthetic engineering only. No live delivery, provider certification, hosted acceptance, or economic result is claimed.

## Baseline and scope

Refreshed draft PR #26 remains unmerged at `2bd96562f30941d00b5380c3bd49e7f5c8a4aa29`, based on `229b0f83db7f885c18940f7087ea6e6ce7cd4e7a`. Baseline rerun: **682/682 passed**. Baseline exact-head CI receipts: GitHub Actions runs `38982319631` and `38982315282`. This continuation is stacked directly on #26; it neither rebases nor merges #24/#26. The continuation PR body pins its exact implementation SHA and CI receipt after publication; that receipt must match the reviewed head.

The measurable engineering bottleneck is competing hypothetical demand for a shared sender and finite producer availability. New code is an isolated runtime-neutral simulator, fixtures, deterministic tests and a fresh-process benchmark. No existing runtime contract, planner action, gateway, route, database schema, scheduler or UI was changed. No production code imports the simulator. `planSignal` and `proposeSignalEngagement` remain canonical and unchanged.

## Implemented behavior

- Controlled 7–30-day clock; bounded imports of up to 5,000 synthetic records, up to 50,000 relationships in an experiment. Tenant/profile keys are explicit. Shared phone numbers never merge identities.
- Separate import, deduplication, source-rights, channel-eligibility, evaluated-relationship, hypothetical work and allocated-slot counters. `ENGAGEMENT_EVALUATED` counts unique initially eligible evaluated relationships; total evaluations and work iterations are reported separately. Funnel work/slot totals can exceed unique leads due to follow-ups.
- C1 current evidence and context drive each evaluation. Explicit call/quote requests and due commitments become internal producer work; advisory closing urgency preserves C1's underlying action. TEXT selects the existing BUYER/HOME/AUTO/LIFE journey through `routeSmsInbound`. Generated journey wording is not transmitted.
- Independent decision, communication-eligibility and transmission clocks. Every timer reruns C1; every candidate is checked again before assigning a slot. An elapsed canonical profile freshness boundary requires a fresh projection; the simulator does not fabricate a replacement E2 projection.
- Five priority bands, deadline ordering and stable IDs. Every tenth slot can favor an older waiting lower band. This is bounded queue fairness, not guaranteed delivery. Safety restrictions are holds, never low-priority send candidates.
- One rolling 60-second sender budget shared across families; manual headroom and active-conversation reservations. Explicit unknown external usage fails closed. Configured rates are hypothetical 10/20/25/40 per minute, not RingCentral permissions or verified account limits.
- Source/consent/owner/suppression/CONTROL/TEST/identity/takeover checks; recipient spacing across verified multiline relationships; revision/generation fences; expiry; reply cancellation; unknown/failed/conflicting receipt holds; explicit reconciliation; three-failure circuit breaker and explicit reset.
- Serializable simulator state, including pending work, budget consumption, recipient spacing, receipts, deduplication and unallocated producer handoffs. JSON restart tests compare uninterrupted and resumed outcomes.
- Distinct producer availability slots, preferences, offers, confirmed bookings, completed/missed/rescheduled/canceled outcomes. No automatic booking or completed conversation. Requests exceeding explicit availability become visible capacity exceptions; revised obsolete requests are invalidated.
- Every recommendation and slot has all external execution flags false. There are no message bodies in slot claims, provider clients, calendar calls, network calls or LLM calls in the simulation path.

## Bounds and computational behavior

Events and five ready bands use binary heaps; insertion/removal is O(log n). A claim examines at most 100 candidates; a simulation tick issues at most `80 + 40 × initialized senders` claims, with at most eight senders. No whole-prospect scan per event or slot. Imports are bounded at 5,000, record inventory at 50,000, pending events at 300,000 and work history at 200,000. Each relationship has at most 30 explicitly supplied follow-up intervals. Exceeding a bound throws rather than silently claiming complete processing.

Producer allocation processes only newly affected requests, ordered by urgency, against explicit bounded availability. Reports and serialized checkpoints intentionally enumerate accumulated experiment history; they are not production GET paths. Quiet-window searches are bounded to eight days and memoized by clock/window inside the experiment; those memoized results are included in restart state. Relevant deadlines still expire work before a later permitted window.

The simulated worker claim is a synchronous transition on **one in-process state owner**. Interleaved workers share that state and cannot reuse a slot or work item. This is not proof of distributed locking, cross-process durable recovery or a replacement for C2's database transactions. A future hosted implementation would need separately accepted durable leases, CAS and sender accounting.

## Acceptance evidence

The new targeted suite covers the mandate's twenty scenario themes plus explicit edge cases. The full command includes all prior SIGNAL/SMS, E2/C2/C3/C4, gateway and authorization tests:

```sh
node --test --test-isolation=none --experimental-loader ./tests/json-loader.mjs tests/*.test.mjs
node --test --test-isolation=none --experimental-loader ./tests/json-loader.mjs tests/engagement-capacity-shadow.test.mjs
node --experimental-loader ./tests/json-loader.mjs scripts/benchmark-engagement-capacity.mjs > results.json
```

Acceptance checks include mixed 1,000/5,000 imports, repeated daily cohorts, rolling shared reservations, competing claims, urgent work behind 5,000 records, TEXT journey selection, future callbacks, CALL/QUOTE handoffs, same-clock STOP even when submitted before import, owner conflicts, uncertain/out-of-order receipts, circuit breaking, rate reductions/outages, 30 requests against five available slots, unique offered appointments, expiry, multiline frequency, holidays/DST, JSON replay, takeover and consent, unknown manual capacity, separate clocks, routine fairness, changed renewal timing, canonical evidence expiry, invalidated producer requests and restart between admission and allocation.

A file-backed E2/C2 integration test admits fictional evidence, commits a fenced C2 call recommendation, supplies the resulting E2 projection to the simulator, and checks matching C1 evidence references/action. The simulator produces no SQLite changes during that projection/advance. Existing pure synthetic profile fixtures exercise advisory fields without introducing a second evidence admission or reconciliation implementation.

Runtime fetch interception verifies zero network calls on the exercised paths; explicit outputs remain zero for provider, SMS, calendar, model and external actions. Tests also independently recompute each sender's rolling allocation bounds and uniqueness rather than trusting the zero-violation counter.

## Benchmark assumptions and interpretation

Machine-readable results: [CF-ENGAGEMENT-CAPACITY-SHADOW-0.2-RESULTS.json](CF-ENGAGEMENT-CAPACITY-SHADOW-0.2-RESULTS.json). Each case starts a fresh Node process. Dataset construction, simulation duration, before/construction/drain memory, maximum resident set, evaluations/second, actual heap/event operations, peaks, daily demand, backlog, expiry, safety reasons, strategies, producer work and wait distributions are retained.

Fixed experiment: Los Angeles weekdays 09:00–17:00; explicitly empty holiday list for these workload runs; separate tests exercise holidays and spring/fall DST. Manual reserve two/minute and active reserve two/minute. Recipient minimum spacing 24 hours. Initial work has a 24-hour relevance lifetime. Two **test-supplied** follow-up evaluations occur two and then three days after hypothetical slot allocation, subject to current C1 and safety. This is a workload stress assumption, not a production Day-2/Day-3 cadence policy. No customer response or delivery success is inferred from an allocation. Eight explicitly available producer slots/day; no appointments automatically confirmed.

Single cohorts run seven days. Seven daily imports of 1,000 run fourteen days. Tests also exercise a thirty-day horizon. Utilization uses the full modeled sender-clock capacity after manual reservation (including hours in which customer communication is not permitted); it is not carrier utilization or evidence that more contact should occur. Capacity-deferral counts are candidate deferrals, not unique minutes. Waiting time measures assigned work only; expired and still-pending work are separately visible.

Lower rates can shift later evaluation times enough to change the number of weekend expirations and subsequent hypothetical slots. Therefore the daily-cohort slot totals are not necessarily monotonic with sender rate. More slots do not establish better engagement or economics. Producer exceptions remain substantial at every rate: sender throughput alone does not create producer availability.

**Final local validation:** 34/34 new tests; **716/716 full-suite tests**, zero failures/skips (Node 24.19.0). Baseline 682 tests retained. Full-suite local duration: 20.009 seconds. Exact-head GitHub receipt is pinned in the continuation PR after CI completes.

| Cohort × daily imports | Rate/min | Simulation seconds | Peak RSS MiB | Slots | Wait p95 minutes | Expired | Event/heap operations |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 × 1 | 10 | 0.905 | 100.1 | 836 | 59 | 418 | 15,734 |
| 1,000 × 1 | 20 | 0.442 | 99.3 | 836 | 23 | 418 | 7,466 |
| 1,000 × 1 | 25 | 0.358 | 96.3 | 836 | 17 | 418 | 6,240 |
| 1,000 × 1 | 40 | 0.273 | 97.2 | 836 | 10 | 418 | 4,578 |
| 5,000 × 1 | 10 | 4.026 | 183.8 | 4,170 | 295 | 2,085 | 87,723 |
| 5,000 × 1 | 20 | 1.832 | 178.7 | 4,170 | 114 | 2,085 | 40,571 |
| 5,000 × 1 | 25 | 1.542 | 179.3 | 4,170 | 87 | 2,085 | 33,617 |
| 5,000 × 1 | 40 | 1.247 | 178.3 | 4,170 | 51 | 2,085 | 24,251 |
| 1,000 × 7 | 10 | 3.630 | 248.3 | 4,408 | 1439 | 1,996 | 153,445 |
| 1,000 × 7 | 20 | 1.665 | 211.5 | 4,374 | 1439 | 2,016 | 63,735 |
| 1,000 × 7 | 25 | 1.469 | 241.0 | 4,364 | 1439 | 2,024 | 50,485 |
| 1,000 × 7 | 40 | 1.101 | 193.2 | 4,336 | 1439 | 2,042 | 32,567 |

All twelve measured cases had zero configured rolling-capacity violations and zero external actions. Peak memory includes dataset construction, retained simulation history and garbage-collector allocations; the JSON records before/construction/drain memory separately. Timings are single fresh-process measurements per case, not latency percentiles or hosted capacity estimates. Repeated daily scenarios expose nearly 24-hour waits among some assigned work because of communication windows; expired work is excluded from the wait percentile and reported separately.


## Compatibility and unresolved dependencies

C1/C2: unchanged canonical decisions; synthetic revisions/generations model fencing but do not create another persisted queue. The file-backed integration check proves compatible input/output, not a hosted operating loop. E2 remains authoritative for actual source admission, identity, rights, corrections and facts. Supplied profile freshness boundaries fail closed when a new canonical projection is needed.

SMS: existing consent suppression and deterministic vertical journey helpers are reused. Additional explicit synthetic first-party permission, sole CoverageFit owner, sender permission and invitation approval are required for hypothetical queue entry. The simulator never invokes the guarded outbound gateway. AgencyZoom ownership blocks CoverageFit slots. Existing source-use/STOP/CONTROL/producer authority remains mandatory.

Limitations: no measured provider tier, segment accounting, carrier quotas, receipt reliability or manual traffic telemetry; capacities are experiment inputs. Same-process worker interleaving and JSON replay are not independent-process concurrency certification. Recipient and holiday policies are supplied synthetic assumptions, not legal/provider certification. Explicit availability is fictional and not a calendar integration. No live completed conversations, quotes, binds, premiums, producer minutes saved or ROI are measured.

Cloudflare owner inventory and hosted validation remain **paused**, per the checkpoint preserved on PR #24 at `7248ce2eb2677c142c767a66a0d87c8dfebdac4a`. This continuation does not resume account login, screenshots or inventory. Hosted D1/Workers, provider/campaign permissions, agency workflow transfer, actual data rights and any live test remain separate gates.

## Disposition, rollback and next step

Engineering acceptance is limited to the synthetic simulator and exact-head test evidence. No merge, deployment, production activation, customer data, communications, CRM/calendar operation, lead purchase or spending is authorized. GitHub may automatically create a Preview artifact; it is not authority to exercise hosted workflows.

Rollback is removal of the isolated simulator/tests/benchmark/report and the single status note. No database, provider or external state was created to undo. Keep the draft stack unmerged.

Smallest next engineering step: a separately scoped offline review of the simulator's acceptance cases against the existing gateway's delivery-reconciliation and ownership contracts, identifying the exact durable accounting requirements before proposing any live Delivery Governor. Do not automatically implement it or resume the paused Cloudflare lane.
