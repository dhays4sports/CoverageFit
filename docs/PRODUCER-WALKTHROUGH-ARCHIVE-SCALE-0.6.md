# Producer review walkthrough & archive scale 0.6

Mandate: `CF-PRODUCER-WALKTHROUGH-ARCHIVE-SCALE-0.6`
Engineering disposition: **PASS — local synthetic acceptance**.
Human usability update (0.7): **FIRST ATTEMPT UNSUCCESSFUL; RETEST PENDING**. Authenticated browser walkthrough: **UNVERIFIED**. See [actual feedback](walkthrough/human-feedback.json) and [0.7 report](CLEAR-PRODUCER-DECISIONS-0.7.md); original engineering results below remain historical.

## Verified prerequisite

Fetched main and PRs #43–48, inspected relevant open work and read the inherited reports/source. Main was `43588dcf066b24adbed53302d4962ba216358687`. This change is stacked directly on PR #48 head `58a9ffc5b3fc67385aff4db592a78466f532b37f`, tree `b6a0c7a68b93e9f42de505d29fd32af8dfd0a8d1`. PR #47 is an ancestor. No prerequisites, unrelated intake branches or separate unfinished SIGNAL stack were merged or incorporated.

Freshly observed prerequisite [remote CI 44415775128](https://github.com/dhays4sports/CoverageFit/actions/runs/44415775128) success. Reproduced baseline: **633/633 root tests and 24/24 desktop tests**. No applicable repository AGENTS.md file was found; supplied project instructions were retained.

## Delivered interaction

Run `node scripts/producer-walkthrough.mjs` with Node 24. Open its printed local URL and use its temporary local key. [Walkthrough instructions](walkthrough/README.md) describe actual persistence, unavailable operations, reset behavior and feedback download. No installation is required to run it.

This is a local-only HTTP harness around existing `producerWorkspace`, `sharedProfileService` and the existing `mountSharedWorkspace` Prospect 360 component. All records live in independently marked, fresh temporary synthetic databases. Scenario/reset-specific canonical identifiers prevent browser drafts crossing fixture boundaries. Existing exact source, identity, version, approval and receipt checks remain active.

The server binds only to loopback, gates APIs with a random local session key, uses HttpOnly/SameSite cookies and a separate mutation header, rejects cross-site mutations, bounds request/feedback/reset inputs and serves an explicit static-file allowlist. It cannot accept an existing database path or arbitrary workspace configuration from the client. No public unauthenticated data API, production route or hosted resource was introduced. The local dev manifest lives under `docs/walkthrough`; repository-root package/build behavior is unchanged.

Explicit source-bound factual decisions and exact task reconciliation save through existing review services. Generic updates, local task/callback/commitment creation, attachments, providers, sends and active recommendations are blocked by the harness. Feedback is explicitly self-reported, bounded and separate from acceptance. It does not create tasks or facts.

Reset creates a fresh copy and rejects old generations. Previous fixture files remain until teardown but are not available through the replacement fixture API. Stopping deliberately removes the disposable session; download feedback first. No active archive is compacted or deleted. The unavailable-original fixture is a deliberate isolated fault injection, not an automatic retention mechanism.

## Scenarios and human status

Twelve goals and expected outcomes were declared in `walkthrough/scenarios.json` before execution. The interactive API exposes goals only. Expected outcomes remain separate so the owner can attempt scenarios before reading the answers.

Cases cover a clean record; home/auto scope; policy-date conflict; stale SMS review; external/local task relationship; unresolved ownership; factual review while historical and authoritative STOP remain active; partial history; unavailable originals; capacity warning/stop; and a restored profile with original approvals and task reconciliation receipts.

At original 0.6 delivery, human observations were pending. The subsequent first owner attempt was **unsuccessful**: Dylan reached “Inspect source originals” and reported confusion, including an unclear reason for review before inspection. `walkthrough/human-feedback.json` now records those actual observations; the second attempt is pending. Automated feedback transport tests are not human evidence or usability acceptance.

Browser entry-page QA confirmed the local page renders. Authentication was not completed in the automated browser. HTTP and DOM-to-HTTP tests establish engineering interaction and persistence; they do not substitute for authenticated browser execution or human participation. The supported managed preview was used for entry-page QA and stopped after checks. The reproducible local command is the delivered interactive alternative; no hosted preview or account was provisioned.

## Justified UI changes

| Reproduced finding | Narrow change | Verification |
|---|---|---|
| Queue showed exact references, while supporting originals were elsewhere in collapsed source records | Added a read-only “Inspect source originals” control in the existing queue | DOM tests inspect current/earlier SMS copies and policy/task source context |
| A resolved factual issue could leave contact held, with that distinction primarily in lower SHADOW details | Added an explicit typed `contactHoldActive` observation and prominent contact-hold notice | HTTP factual review retains provider/historical STOP; active authority remains false |
| Raw source metadata can obscure meaningful policy dates | Original inspector presents typed date observations first and keeps exact stored JSON/digests in disclosure controls | Existing source approval remains separate; no inferred date choice or timestamp precedence |

These are engineering-observed improvements, not owner feedback. No safeguard was removed and no second review dashboard was created. Source inspection remains available in read-only mode. Missing originals explain the missing proof; an inventory issue does not falsely claim to have a single missing source. Untrusted message bodies are escaped as text, not executed or loaded as markup.

## Local acceptance

| Check | Result |
|---|---|
| Full CoverageFit regression | **659/659 PASS**, no skips |
| Prospect Desk regression | **24/24 PASS**, no skips |
| New walkthrough tests | **26/26 PASS** |
| Declared interactive fixtures | **12/12 PASS** |
| Declared scale workloads | **15/15 PASS** |
| Supported HTTP/DOM-to-HTTP review | Policy choice and exact task association persist and replay safely |
| Scope/reset | Separate fixture identities; stale generations and foreign customer/opportunity requests reject |
| Local task authority | Existing task stays open; no automatic new work |
| STOP/DNC and ownership | Remain held after factual resolution; no consent or ownership takeover |
| Originals/history | Stale or unavailable evidence excluded from current facts; incomplete history stays explicit |
| Network/operations | No external network/provider calls or communications in workload checks; local HTTP requests are expected |
| Browser verification | Entry page verified; authenticated interaction unverified |
| Human participation | Pending; no observations or time-savings claim |
| Candidate remote CI | Recorded separately in the draft PR after publication; local success does not imply remote success |

Tests also cover CSRF/session boundaries, request allowlists, source inspection without saving, markup safety, feedback idempotency, and representative archive-limit/recovery regressions. Existing lifecycle/reconciliation/connector tests remain in the full regression suite.

## Measured archive behavior

Full local results are in `walkthrough/scale-results.json`; declared inputs/ceilings are in `walkthrough/workloads.json`. Every workload runs in a separate Node process with a 384 MiB heap ceiling and 45-second timeout. One repetition per workload; no percentile claims.

The key result is growth in full-read verification cost: 235 repository queries for a 200-message thread despite a 20-message visible window, and 258 for eight threads. Several independent bounds trigger well before a large payload: 64 page receipts for repeated two-message edits, 400 versions, a 1 MiB per-thread original budget, seven policy revisions before the source-summary cap in this fixture, nine-thread package rejection, and a 51st approval beyond the current package/profile window.

Rejected ingestion preserves accepted originals/heads/revisions. Partial-page interruption does not advance the stream checkpoint; reopen and exact replay recover the requested range without certifying actual history. Export does not free capacity. The oversized-package workload is explicitly a rejection test, not a valid ingestion benchmark.

Phase durations, database size, payload/index-metadata sizes and process peak RSS are recorded. Physical index bytes are unmeasured. Query counts cover only repository calls during selected-customer projection; package/connector direct SQLite calls are unmeasured. These local results do not establish hosted D1, CPU, network object-store, production retention or scalability readiness.

## Storage recommendation and boundaries

[Archive scale design](ARCHIVE-SCALE-DESIGN-0.6.md) compares keeping the current archive with separating immutable originals/manifests from bounded inspection indexes. It specifies the proposed per-customer dependency closure, immutable legacy-reference resolver, exact policy/SMS review dependencies, sticky historical suppression references, completeness distinctions, migration fencing, semantic projection parity and rollback requirements.

No storage prototype or selector switch was needed to establish the measured concern. Current archive bounds and storage remain unchanged. There is no limit increase, automatic rotation, destructive compaction, original deletion policy or production migration.

Recommend next: **complete the actual synthetic owner walkthrough**, review the resulting observations, and choose the smallest demonstrated usability fix. If archive-read cost or history limits are the next engineering priority, separately authorize a bounded reference-resolver/index experiment under this design's acceptance criteria. Do not proceed to live API access or production activation from these results.

## Reproduce

```
node scripts/producer-walkthrough.mjs
node --test tests/*.test.mjs
npm test --prefix apps/prospect-desk
node scripts/archive-scale.mjs
```

Tests use the existing Prospect Desk dev dependencies. The walkthrough itself uses Node built-ins and repository modules. All fixtures are synthetic and isolated. No Virginia Tam data, real prospects, live authentication, provider credentials, provider writes, communications, spending, production database/configuration change, deployment, support outreach or merge occurred. The connector remains disabled by default.
