# AgencyZoom task and renewal evidence 0.2

Mandate: `CF-AGENCYZOOM-TASK-RENEWAL-EVIDENCE-0.2`
Date: November 18, 2026
Disposition: **PASS — isolated offline synthetic acceptance only. Live authentication and production activation remain unavailable.**

## Source verification and baseline

Main remains `43588dcf066b24adbed53302d4962ba216358687`. Discovery draft #43 remains `82d410663748b4c51b36bb740d02b686c309c3ee`. This change stacks on foundation draft #44 at `c6931d6a02a6bbb6abef164b524dd19ea3f05f71`; neither prerequisite was merged. Main, both PR refs and the relevant open inventory (#39, #36–37 and the separately gated #28–30 SIGNAL work) were refreshed. Unrelated implementation branches remain unchanged.

Reviewed normalized contracts, synthetic transport branding, identity mapping, revision/checkpoint logic and database marker; UCP/opportunity links, canonical sources/tasks, Policy.box, shared-profile source review and correction, Work, workspace authentication and SIGNAL contact holds. No current-agency database or API was inspected.

PR #44 remote evidence is now available: [offline workflow 44373257134](https://github.com/dhays4sports/CoverageFit/actions/runs/44373257134) and [shared-profile/desktop workflow 44373256995](https://github.com/dhays4sports/CoverageFit/actions/runs/44373256995) both completed successfully. Job steps show the foundation test subset and demo; integration tests and desktop tests; Windows package build/startup smoke. Those are PR-associated results, not a claim that its full root suite passed. A fresh local foundation run reproduced 32/32 connector passes and the inherited CSV assertion failure.

The stale CSV expectation `/48 hours/` contradicted `PILOT_ELIGIBILITY_DAYS=7`, the importer predicate `age > PILOT_ELIGIBILITY_MS`, the pre-existing six-day/eight-day test, and documented baseline reports. Only the assertion changed to `outside 7 days`; a frozen-clock test verifies just before seven days, exactly seven days, and one millisecond beyond. **No district business-policy or runtime enrollment logic changed.**

## Contract and storage decisions

`server/agencyzoom-resource-contract.mjs` defines a simulated task/policy contract. `synchronizeAgencyZoomEvidence` reuses the foundation's fail-closed authorization, branded in-process transport, bounded paging/retry and checkpoint coordinator. It has a separate `agencyzoom_resource_v2` checkpoint; lead checkpoints are unaffected. No HTTP client, login, production route, scheduler, credential or live transport was added.

Common fields: exact tenant/entity/revision/customer/lead IDs; an explicit external storage-anchor opportunity; an optional semantic opportunity relationship; original creation/update timestamps; availability (`present` or explicit `missing`); synthetic provenance and resource-history completeness.

- Tasks require one exact opportunity, assigned producer, title, external state and due value.
- Policies contain carrier/product labels, status, exact term ID, date-only effective/expiration values, optional renewal-effective date, optional exact replacement reference, and up to eight attributed date observations.
- Date observations preserve ID, kind, original value, source ID/revision and observed timestamp. The four kinds are **expiration**, **renewal effective**, **producer review** and **prospect callback**. They are never substituted for one another.
- Calendar dates require valid `YYYY-MM-DD`; they remain date-only strings. Zoned due/callback values retain their original offset and precision. Naive timestamps, impossible dates, invalid term ranges, ambiguous IDs, unknown fields and unsupported resources are rejected.
- Task title maximum 240 characters; normalized resource maximum 5,000 UTF-8 bytes; page maximum 100 resources; default five pages, hard maximum ten. Existing bounded retry/authentication behavior is preserved.

Policy.box stores document-analysis evidence, not an authoritative carrier policy ledger. No general canonical policy master was found. AgencyZoom policy observations therefore extend existing `cf_solo_sources`, supported by the foundation's immutable external revision ledger. No new policy/customer/task database, production schema or policy authority was introduced. The existing `az_read_revisions`/`az_read_heads` tables now also hold namespaced resource records; no additional tables or production migrations were needed.

## Exact relationships and customer-level scope

The isolated database remains locked to one explicit future-agency workspace, agency ID, database marker and synthetic principal. Resource identity additionally includes entity type and exact external ID. A resource's lead/customer/anchor relationships must agree with existing external mappings and current canonical UCP customer/household links. Unknown relationships fail before source insertion. Same product, name, carrier or date never supplies identity evidence.

For **opportunity-specific** evidence, `opportunityId` must equal the exact supplied storage anchor. It appears only in that opportunity's projection.

For **customer-level policy evidence**, `opportunityId` is explicitly `null`; the caller must still supply an exact `anchorOpportunityId` belonging to that customer. This is a physical attachment required by the existing opportunity-backed source table, not a semantic assignment of that policy to the opportunity. The shared profile displays it as customer evidence across that customer's opportunities. It cannot be promoted through the opportunity-specific external-fact review action. No automatic opportunity is created for a policy or renewal. Unresolved anchors or ambiguous assignment stop for explicit reconciliation.

Established resource relationships cannot be silently remapped. Local UCP reassignment blocks subsequent sync; shared-profile projection filters misassociated external policy evidence and reports a relationship hold. Replacement references must identify an existing policy under the same canonical customer. They remain references, never merge/delete/convert instructions. Cancellation, replacement and explicit missing status are displayed for reconciliation. An empty scan does not delete records or establish a complete inventory.

## Task authority

Imported tasks are one stable source snapshot per exact task ID, updated by revision. No `cf_solo_tasks` row is created, completed, cancelled, reassigned, scheduled or reopened by ingestion.

Where local tasks exist on the same opportunity, the relationship is **unresolved**; title similarity is not used to match them. The offline operator may explicitly call `store.reconcileExternalTask` with exact external/local IDs. It validates workspace/opportunity ownership and rejects ambiguous aliases. This supplies an audited relationship only. If external and local states disagree, both are shown with a state conflict. Completed local tasks remain readable as completed in Work even when an external task stays open. There is no production task-reconciliation endpoint.

Legacy lead snapshots retain original task evidence. Once a separately identified v2 task snapshot exists for that exact external task/opportunity, the legacy task display is suppressed to avoid presenting two current task cards; original source storage is preserved.

## Evidence, conflicts and review

Each accepted resource revision commits atomically with external mapping, source snapshot, immutable original, head, edit-version update and audit. SHA-256 checks protect original resource records, retained date observations and retained term ranges against detected corruption. Shared-profile reads also verify these digests, hold corrupt external evidence and reject attempts to approve it. Creation timestamps are immutable. Changed content under an existing revision, unseen stale revisions or identity changes fail closed; old known replay never regresses the current head.

Policy source snapshots retain earlier date observations and term ranges. Conflict grouping uses exact **policy + term + date kind**; different policies/terms or expiration and renewal-effective dates do not collide. A later timestamp never resolves a conflict. Observations remain unverified with unknown freshness; source observations over 30 days old and prior terms are labeled stale. Lifecycle uncertainty and partial history remain explicit.

Source-bound review uses the existing shared-profile approval, version-CAS, idempotent receipt, original-evidence and correction/supersession workflow. New optional `externalEvidence` metadata binds the reviewed fact to the exact source ID, revision, digest and date kind, with the policy/term encoded in its fact key. The server verifies canonical identity and date precision before accepting it. Source snapshots are copied into the producer-approved evidence message; no source is automatically approved.

The existing Prospect 360 panel supplies a **Review or correct** action for opportunity-specific policy dates. A conflicting date starts with no preselected choice. The producer enters a date, reviews the proposed addition, and explicitly approves it. Source-specific drafts and pending receipts survive reopening; a lost response retries the unchanged request. Saved drafts whose source changed carry a re-review notice. The server rejects stale source bindings. Read-only preview mode disables these controls.

An explicit reviewed choice may resolve operational uncertainty, but **original conflicting dates remain visible**. A correction supersedes the prior reviewed choice without deleting it. New source revisions invalidate the prior source-bound resolution. Multiple incompatible active reviewed choices do not silently select a winner. Source-bound resolution also becomes stale with old source observations. Policy metadata grants no coverage, carrier eligibility, completed quote, binding or premium conclusion.

## Existing Work and Prospect 360

Work detail and the shared profile show source identity, revision, last successful sync, original source update time, resource availability, source-reported history completeness and freshness. Tasks remain external obligations. Customer-scoped policies are labeled; exact opportunity policies remain scoped. Four separate date meanings, term conflicts, original observations, reviewed choices and stale reviews are visible.

Resource evidence participates in existing material-evidence revision handling, so changed source evidence invalidates applicable summaries/draft review coverage. It does not create a CURRENT SIGNAL recommendation or grant contact authority. STOP remains a hold during policy review. Resource inventory completeness is deliberately **unverified**, even when the synthetic source reports a complete individual-resource history. Shared workspace coverage reflects that limitation. A successful snapshot is not a live sync-health monitor.

## Reproduction and acceptance

With Node 24 and existing app test dependencies installed:

```sh
node --test tests/agencyzoom-connector.test.mjs tests/agencyzoom-task-renewal.test.mjs tests/agencyzoom-raw.test.mjs
node --test tests/*.test.mjs
npm test --prefix apps/prospect-desk
node scripts/agencyzoom-task-renewal-demo.mjs
```

The demonstration creates/removes a new local synthetic DB. Its actual Work and shared-profile projections produce `docs/agencyzoom/task-renewal-demo.html` and `task-renewal-receipt.json`. The HTML shows four successive acceptance snapshots with disabled controls; it is not a hosted app or browser-runtime certification. Interactive review was separately exercised through DOM tests against the real shared-profile commit service.

| Verification | Local result |
|---|---|
| Foundation connector regression | 32/32 PASS |
| Task/policy/renewal suite, including real review DOM + save/retry | 40/40 PASS |
| CSV suite including exact seven-day boundary | 25/25 PASS |
| Full root regression | **503/503 PASS**, zero skips |
| Prospect Desk application regression | **24/24 PASS**, zero skips |
| New/updated resources; multiple policies and opportunities | PASS |
| Exact/ambiguous/conflicting customer/opportunity/replacement links | PASS — closed on conflict |
| External task update, local task preservation and explicit relationship | PASS |
| Conflicting dates/term ranges; correction/supersession; stale review | PASS |
| Date-only precision, leap dates and callback offset | PASS |
| Partial/missing histories and empty scans | PASS — no completeness/deletion inference |
| Reopen/replay, separate checkpoints and transaction rollback | PASS |
| Auth/rate-limit simulation, isolation and revision corruption | PASS |
| No-network sentinel, no outbound outbox and no inferred local tasks | PASS |
| STOP contact hold retained during review | PASS |
| Demo | PASS: initial=4, update=2, replay=0; 2 opportunities, 3 policy sources, 2 review records; 1 explicitly producer-created local task remains open; sends=0 |

**Remote CI for this 0.2 package is tracked in the draft PR after publication.** The values above are executed local results; predecessor workflow successes are recorded separately above. No remote success is inferred from local results or a Pages build.

## Limits and next phase

This remains a bounded offline prototype. Retained source summaries cap at 7,800 UTF-8 bytes to fit the existing 8,000-byte shared-profile source window. If retained observations/terms exceed that bound, the transaction and scan stop; no history is silently discarded. A scalable archival/paged-history design is required before a long-running live pilot. The adapter does not certify real AgencyZoom account entitlement, payload field names, exact resource revision semantics, lead/customer conversion relationships, exhaustive paging, policy replacement semantics or missing-record interpretation. All supplied source relationships are synthetic contract assertions.

No live account authentication, Virginia Tam data, production DB operation, flag activation, route/scheduler, provider write, SMS/email ingestion, customer communications, APEX operation, merge, production deployment, spending or support outreach occurred. Existing Access, owner release and producer defaults remain unchanged. The newly added review behavior has no effect without matching external source records and existing authenticated shared-profile access.

**Recommended next phase: offline SMS evidence 0.3.** Require exact tenant/conversation/customer/opportunity ownership; immutable message/provider IDs, direction and original timestamp; bounded thread/message pagination; attachment/body allowlists; partial-history and edit/deletion labeling; duplicate/order/interruption tests; and STOP/DNC precedence across imported history and existing provider state. An outbound message is evidence of a past event, not authority to send again. Import no consent grants or current recommendations from thread existence. Keep all sending, task/stage write-back, live credentials, subscriptions and activation outside that phase.
