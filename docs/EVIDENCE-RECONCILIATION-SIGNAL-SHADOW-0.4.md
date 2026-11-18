# Evidence reconciliation & SIGNAL SHADOW 0.4

Mandate: `CF-EVIDENCE-RECONCILIATION-SIGNAL-SHADOW-0.4`  
Disposition: PASS for isolated offline synthetic engineering acceptance. Disabled by default; no live access or action execution.

## Verified prerequisites

Fetched main and PRs #43–46; reviewed the prerequisite connector, archive, shared profile, Work, suppression and pure SIGNAL decision contracts. PRs remain draft and unmerged. This change is stacked directly on PR #46, `9c0ec2cc81286d7776853e53c1261994918f5e31` (tree `b57aeb3a5cd91ddc7990cd67ddad5a75c605a87a`). Main was `43588dcf066b24adbed53302d4962ba216358687`.

PR #46 remote runs 44385461733 (offline) and 44385461743 (shared profile/Windows desktop) reported success. Fresh inherited local baseline: 551/551 root tests, 24/24 Prospect Desk tests. No unrelated SIGNAL branch or prerequisite merge was incorporated.

## Producer experience and authority

The existing shared-profile Review tab now presents one stable, source-bound queue; existing Work review filtering includes its open issues. Each item identifies the canonical customer, exact opportunity or explicit customer-level anchor, source/revision/digest, effect and smallest supported step. Imported source cards remain available behind details. Clean imported observations and a settled historical STOP do not generate pointless approval tasks. STOP remains visible as a hold.

Issue IDs bind workspace, customer, anchor, kind and exact source key. Current evidence determines open/resolved/reopened state. Acknowledgements cannot hide changed evidence. Unassigned ingestion failures appear in the same Review tab with exact external references and an explicit unknown canonical relationship; no customer or opportunity is invented. Inspection bounds and omitted counts are visible.

Supported decisions reuse existing shared-profile approval, correction, evidence, timeline and request-receipt storage:

- Review a current policy date, retaining conflicting originals; supersede a prior reviewed policy/SMS fact using an exact available current revision.
- Associate an external task with one explicitly selected existing local task using exact identifiers.
- Acknowledge an external/local state discrepancy while retaining the local task unchanged.

Task associations and state acknowledgements are typed shared-profile decisions, not another task system. Receipts preserve prior source/link/task state, evidence, actor, timestamp, reason, request ID and expected source/canonical versions. The first accepted update is guarded by the full canonical task row within the transaction, including priority. Same-request retries return the existing receipt; altered replay or stale source/task/review versions reject. The UI retains exact pending requests for receipt recovery. Client-supplied receipts are rejected.

Associations do not reopen merely because an unrelated source title changes. State acknowledgements do reopen after relevant revisions or local changes. Unsupported identity remaps, customer merges, provider conversation combinations, uncertain lifecycle changes and unavailable originals retain review holds. No name/contact similarity establishes a relationship.

Source-bound approvals now include a server-generated source-decision receipt. Changed policy revisions invalidate affected reviewed facts, consistently with SMS review invalidation. Original evidence remains available through existing inspection controls.

Resolving a factual or task issue never clears STOP/DNC, changes messaging ownership, grants consent, schedules contact, completes a local task or creates local work. AgencyZoom remains authoritative for external operational records; canonical CoverageFit identity and local task controls remain authoritative within their scope.

## Isolation and configuration

All three additional settings are required to enable this offline surface:

```
CF_EVIDENCE_REVIEW_SHADOW_ENABLED=1
CF_EVIDENCE_REVIEW_AGENCY_ID=<exact synthetic agency identity>
CF_EVIDENCE_REVIEW_DATABASE_ID=<exact isolated database identity>
```

The existing future-agency workspace, scoped authorization, synthetic agency/database markers and archive setup must also match. Missing/mismatched configuration fails closed before returning a profile. Existing disabled behavior is preserved. Fresh isolated fixture databases include review-ledger marker v4; older databases require separate offline setup rather than an implicit migration. No production migration, route, scheduler, webhook, credential, sender or live transport was added. All fixtures are synthetic; no Virginia Tam agency data was accessed.

## Archive inspection and recovery

Existing originals and page/revision records remain in the connector's isolated evidence archive, not an operational messaging database. Capacity reports include message heads, retained revisions, original bytes and page records; warn at 80%, identify the exact thread at a hard limit and retain failed-ingestion receipts without message bodies or secrets. Resource summaries retain their 7,800-byte budget. Existing per-thread bounds remain 200 message identities, 400 revisions, 1 MiB originals and 64 page records. Inspection is bounded to nine thread records, 100 failure records and 100 local-task candidates, with visible incomplete coverage; unassigned failures show 25 plus overflow counts.

The demonstrated supported recovery is replaying an interrupted/missing requested page with exact original identity/revision, then completing a verified scan of the exact failed thread revision. A later unrelated successful scan cannot certify recovery. This resolves the history issue without discarding originals. Reaching archive capacity stops safely; this phase does not pretend that retrying can manufacture space. No deletion, compaction, removal of referenced originals or automatic bound increase exists. Larger archives need a separately tested storage/migration plan, integrity-checked export/import and reference-preservation criteria. Source-reported completeness, ingested range and actual historical coverage remain distinct. Unavailable/integrity-failed originals cannot support current reviewed conclusions.

## SIGNAL compatibility boundary

SHADOW calls the existing pure `CF-SIGNAL-DECISION-1.0` contract. It accepts only explicitly reviewed, current, integrity-verified `signal.<existing canonical field>` facts that pass the existing enum normalizer. Imported policy metadata, raw messages and free-form dates are not silently translated into product, intent or contact permission. A conflict, control hold or historical suppression produces HELD and an explanation. Missing facts remain missing.

The observation exposes the existing decision code, missing dimension, accepted/rejected evidence and exact evidence revision. It omits executable actions and scores; execution, contact authority, active recommendation replacement and priority-write flags are always false. Changed source/review/canonical state invalidates or recomputes it on read. No active Work recommendation, ranking, population, callback or task changes. It is not a second recommendation engine or a certification of live AgencyZoom semantics.

## Acceptance results

| Verification | Result |
|---|---|
| Fresh prerequisite local baseline | 551/551 root; 24/24 desktop |
| Final implementation local regression | 596/596 root; 24/24 desktop |
| New reconciliation coverage | 45 tests including 24 declared scenarios |
| Fixed synthetic evaluation | 24/24 PASS |
| Duplicate/unnecessary/missed issues | 0 / 0 / 0 |
| Incorrect resolutions / stale-current conclusions | 0 / 0 |
| Suppression/authority violations / stale SHADOW | 0 / 0 |
| Network attempts / outbound communications in evaluation | 0 / 0 |
| End-to-end replay | Same receipt; two decisions; one unchanged open local task |
| Remote CI for this candidate | Recorded separately in the draft PR after publication; local results do not imply remote success |

Expected cases were declared in `tests/fixtures/agencyzoom/reconciliation-expectations.json` before evaluation execution. They cover clean records, policy conflicts/reopening, term conflicts, integrity failures, stale SMS review, uncertain ownership, partial/missing/recovered history, task linking/state changes, archive warning/limit and identity changes. Results measure engineering scenario correctness, not actual producer time saved, conversion or sales improvement. Judgment counts are remaining producer decisions, including capacity planning decisions that cannot be safely saved as a reconciliation in this phase.

Additional tests exercise full-task concurrent mutation, changed request replay, wrong/foreign identities, STOP/DNC preservation through source and task review, no outbox/network/local-work effects, the existing SIGNAL output equality, missing originals, capacity receipts and UI lost-response recovery/read-only controls. Existing CoverageFit and Prospect Desk regressions pass.

## Reproduce and inspect

Use Node 24 and install the existing Prospect Desk dependencies with `npm ci --ignore-scripts --no-audit --no-fund` in `apps/prospect-desk`.

```
node --test tests/*.test.mjs
npm test --prefix apps/prospect-desk
node scripts/evidence-review-demo.mjs
```

The demo creates and removes isolated temporary databases. Open `docs/agencyzoom/reconciliation-demo.html`: it renders actual existing Work/Prospect 360 projections through import, review, exact decision, SHADOW and replay. Snapshot buttons are disabled. `reconciliation-receipt.json` records the completed flow and `reconciliation-evaluation.json` records all expected/actual scenarios. Request IDs are intentionally fresh on each isolated run.

The demo resolves a policy-date conflict and associates one exact existing task. Its SHADOW remains `ASK_ONE_SIGNAL` for missing product, illustrating that importing a home policy does not manufacture a reviewed SIGNAL product fact. Separate tests demonstrate reviewed canonical facts reaching the existing engine. Suppression cases remain HELD after supported decisions.

## Limits and next milestone

Live AgencyZoom fields, relationships, pagination semantics and provider suppression state remain unverified. No hosted D1 consistency, production retention, throughput, CPU budget, real-world usability or production scalability claim is made. Unknown relationships cannot be resolved by a generic override. Hard-cap recovery by export/migration remains future work; originals must stay intact.

Recommend an **offline evidence lifecycle and producer usability acceptance** milestone: test integrity-preserving archive export/restore and reference continuity beyond these small fixtures; exercise representative customer/opportunity cases in the existing UI; define only the missing explicit review mappings to the existing SIGNAL enum contract. Measure actual review decisions and usability before adding more connector resources. Keep production activation and any live API validation behind a separate mandate with explicit ownership and authorization prerequisites.
