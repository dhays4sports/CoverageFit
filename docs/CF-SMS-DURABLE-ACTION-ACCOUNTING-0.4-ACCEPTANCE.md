# Durable SMS action and attempt accounting 0.4

Mandate: CF-SMS-DURABLE-ACTION-ACCOUNTING-0.4. Local engineering execution: 2026-10-17 UTC. Fixture time is independently controlled at 2026-10-20T16:00:00Z.

**ACCEPTED — LOCAL DURABLE ACCOUNTING**, subject to the exact-head CI receipt attached to this draft PR. This accepts the isolated SQLite accounting contract, not hosted execution, RingCentral behavior, delivery, customer engagement or economics. No production gateway behavior changes.

## Baseline and traceability

Parent: draft PR #28, `9ef8b5062be1a0f6ab17c8ba728f45d1afbf1057`, branch `audit/sms-delivery-contract-03`. Refreshed open/draft/unmerged. Parent CI runs 38987829406 and 38987804955 passed 734 tests. This branch adds 48 accounting tests; the complete suite passes 782/782 locally. The draft PR body records the final implementation SHA and exact-head CI URLs, avoiding a self-referential commit in this file.

All prior tests and tracked application files remain unchanged. PR #24's pause-checkpoint divergence is preserved; no rebase, merge, deployment, branch protection, provider, CRM or Cloudflare change is part of this work. Cloudflare owner inventory remains paused. The prior delivery-contract audit remains authoritative: [0.3 findings](CF-SMS-DELIVERY-CONTRACT-RECONCILIATION-0.3.md).

## Scope and architectural reuse

- `server/sms-durable-action-accounting-local.mjs`: explicit synthetic-only, file-backed Node SQLite ledger. Reuses the existing gateway descriptor validator, plus E2/C2 transaction/fencing patterns. It does not import or call a provider send operation.
- `tests/migrations/0024_sms_action_accounting_local.sql`: test-only schema, outside production migrations. Actions, attempts, authority snapshots, sender policy, reservations, immutable reconciliation evidence and immutable audit records. This is not a second prospect-memory or evaluation queue.
- `tests/helpers/sms-fictional-provider.mjs`: independent SQLite acceptance database. No networking or credentials; fictional destinations only. Deliberately has no deduplication, so it cannot conceal repeated calls made by the harness.
- Worker/crash fixtures, 48 deterministic tests, and a fresh-process workload script. No routes import the ledger; static search of server/functions confirms no active consumer. There is no scheduler or active sender.

The constructor refuses in-memory databases and missing local schema. Mutations use their own `BEGIN IMMEDIATE` transaction, foreign keys, scoped lookups, unique keys and compare-and-swap fences. WAL/FULL durability is configured by the fixture. A 10-second SQLite busy timeout bounds lock waiting; lock errors propagate rather than authorize a fallback. Hosted transaction semantics are deliberately not assumed.

## Proven accounting contract

### Identity and authority

A stable business key covers workspace, verified relationship, intent, business event, canonical decision, generation and channel. The action ID also covers family and campaign. Reusing the business key with changed family/campaign/payload fails closed; it does not silently mint a second action. Caller gateway retry keys have no effect on identity. Every attempt has a distinct ordinal, immutable gateway key, claim token, sender/campaign and action payload digest. The immutable action links profile/context versions; the admitted authority revision links an audited snapshot with source/evidence references.

Authority is an explicit trusted fixture input, not inferred from a legacy unsuppressed contact. It requires verified relationship and exact recipient, first-party source rights, affirmative SMS permission and purpose, SMS preference, approved sender/campaign, current profile/context/decision/generation, exclusive workflow owner and owner epoch, provenance, validity and communication window. STOP, wrong number, provider opt-out, CONTROL and takeover deny admission or fence unsubmitted work. AgencyZoom or ambiguous ownership is not CoverageFit authority. This module is not an authentication service: a future server must independently authorize actor, workspace, relationship and source inputs.

Current authority is rechecked at claim, reservation and submission marker. Relationship authority updates atomically hold nonterminal work. Already accepted operations cannot be recalled; an in-flight acceptance after suppression is retained while the action stays held. No conflict silently transfers workflow ownership or resumes work. All returned execution flags remain false.

### Claims, reservations and uncertainty

Only ADMITTED/WAITING actions can be claimed. One current token/lease owns the claim; one active attempt per action is enforced by a partial unique index. Sender reservations share a rolling 60-second budget across processes; recipient spacing spans HOME/AUTO within the verified tenant relationship. Sender IDs represent the same physical sender globally in this local contract, so capacity is not multiplied by tenant. Unknown external/manual traffic holds reservations. Rates 10/20/25/40 are hypothetical engineering inputs, not provider entitlements or billable-segment limits.

Reservation replay is idempotent. Capacity reductions are rechecked at submission. The boundary also checks unresolved sibling actions, including actions claimed/reserved before another action became uncertain. This closes a race demonstrated during implementation. No second provider sender was introduced.

`beginSubmission` durably records SUBMISSION_IN_PROGRESS before returning a synthetic ticket. Once that marker exists, lease expiration becomes OUTCOME_UNKNOWN, never retry permission. Pre-marker recovery can release an unsubmitted reservation and return eligible work to WAITING. Recovery is bounded to 1–500 rows per call; workloads use batches of 100. Explicit cancellation releases only unsubmitted capacity. Exhausted attempts hold; default maximum is three, including abandoned pre-marker attempts.

Sender accounting measures reservations/submission markers, not handset delivery or actual future network timing. A future gateway must honor the marker, token, deadline and immediate authority checks; arbitrarily replaying a returned ticket outside that contract is not prevented by the fictional provider. This is conservative at-most-one unresolved attempt, not an atomic database/provider transaction or exactly-once delivery claim.

### Reconciliation

Evidence must identify the original workspace/action/attempt/gateway key/sender/campaign/payload and authoritative source. Provider identity is separately unique within sender scope. Fingerprint-only, incomplete, ambiguous or conflicting evidence holds the original action; a new gateway key cannot escape it. Evidence IDs are immutable/idempotent, and attempt revision CAS rejects stale writers.

Acknowledgement, delivery and engagement are separate. ACKNOWLEDGED/COMPLETED mean provider acceptance was recorded, never that the customer received or answered. Delivery receipts need sequence and matching provider identity. Older receipts are retained but do not regress current receipt state; conflicting terminal evidence holds. Conflict resolution requires explicit authoritative resolution evidence. There is no synthetic economic progress field.

Only proven authoritative nonacceptance with explicit retry eligibility can reopen WAITING, subject to all fresh authority, capacity and attempt-limit checks. Repeated old rejection cannot reset a newer claim. Uncertainty cannot auto-retry. Existing producer-approved SIGNAL `delivery_review` behavior is unchanged.

## Acceptance evidence

| Scenario | Stored-state assertion |
|---|---|
| Four processes admit same intent with different retry keys | One action and one immutable identity; changed payload/family rejected |
| Competing workers at rates 10/20/25/40, reserve two slots | 120 unique claims; exactly 8/18/23/38 reservations; no duplicate active attempts |
| Different senders, shared relationship families | Independent sender capacity; recipient spacing enforced across HOME/AUTO |
| Capacity reduction, unknown traffic, exact rolling boundary | No submission above current budget; holds on unknown traffic; slot reopens at 60 seconds |
| Crash before/after admission, claim, reservation | Transaction rollback or durable existing action; expired pre-marker claim safely recoverable |
| Crash after marker or independent provider acceptance | Original attempt becomes unknown and held, including full process restart; alternate keys do not resend |
| Provider response returned, local acknowledgement write fails | SQLite trigger aborts actual ACK update; evidence insert rolls back; independent provider retains acceptance; later exact reconciliation succeeds |
| Concurrent recoverers, stale worker/attempt revisions | One recovery, stale marker and reconciliation rejected; original attempt identity retained |
| STOP, CONTROL, takeover, identity, owner epoch, source, consent, campaign, profile/context/generation | Admission denied or reserved work fenced; no automatic resume; acceptance evidence retained after in-flight STOP |
| Duplicate, conflicting, incomplete and out-of-order receipts | Immutable evidence, revision CAS, safe holds; no false delivery or engagement |
| Read-only inspect and cross-tenant inspect | No business-state changes; other workspace cannot access action |
| Fictional provider boundary | Separate durable acceptance DB; networking trap; no live provider/CRM/calendar operations |

Commands:

```sh
node --test --test-isolation=none --experimental-loader ./tests/json-loader.mjs tests/sms-durable-action-accounting.test.mjs
node --test --test-isolation=none --experimental-loader ./tests/json-loader.mjs tests/*.test.mjs
node --experimental-loader ./tests/json-loader.mjs scripts/benchmark-sms-accounting-04.mjs 1000
node --experimental-loader ./tests/json-loader.mjs scripts/benchmark-sms-accounting-04.mjs 5000
```

Targeted: 48/48. Full: 782/782, including unchanged gateway/0.3, E2/C2 and SHADOW 0.2 tests. No skipped tests. Exact-head CI and final SHA are recorded in the PR receipt.

## Measured local workload

Raw receipts: [0.4 results](CF-SMS-DURABLE-ACTION-ACCOUNTING-0.4-RESULTS.json). Node 24.19.0, fresh parent process per dataset, independent worker processes, actual file-backed SQLite WAL/FULL. Synthetic logical relationships share the fictional destination range; these are not real customer identities.

| Measurement | 1,000 actions | 5,000 actions |
|---|---:|---:|
| Authority setup plus durable admission | 276.9 ms | 1,393.6 ms |
| Admissions/second, including authority setup | 3,612 | 3,588 |
| Four-process overlapping claim/reserve workload, including process launch | 644.6 ms | 2,183.5 ms |
| Successful claims | 1,000 | 5,000 |
| Duplicate claims / busy errors | 0 / 0 | 0 / 0 |
| Reservations at 40/min less two reserved slots | 38 | 38 |
| Replay all admitted actions | 56.4 ms | 268.7 ms |
| Reopen database | 0.36 ms | 0.35 ms |
| Recover every expired claim, batches of 100 | 77.6 ms / 10 batches | 408.0 ms / 50 batches |
| Reconcile five independent provider acceptances | 1.76 ms | 1.90 ms |
| Parent peak RSS | 93.9 MiB | 97.0 MiB |
| Worker peak RSS range | 77.3–87.3 MiB | 84.2–93.3 MiB |
| Checkpointed ledger size | 4.08 MiB | 19.89 MiB |

Each workload marks ten attempts, records five independent fictional acceptances, closes/reopens the ledger, recovers all expired claims, then reconciles those five original attempts. Five unknown attempts remain held. No full-population send/drain throughput is claimed. Claim competition was uneven (some workers claimed zero), so fairness is not established. Worker elapsed times include lock contention (1,000: 334–465 ms; 5,000: 1,466–1,986 ms); internal lock-wait distributions were not instrumented. Reported busy errors are errors escaping the configured timeout, not evidence of zero contention. Memory peaks are per process, not a measured simultaneous aggregate. The 5,000 run overlapped local regression testing; these are single-run observations, not capacity guarantees or latency percentiles.

## Future existing-gateway integration contract — not activated

1. E2/C1/C2 may establish a justified decision, but an evaluation timer is not an outbound action. A separately governed admission must resolve current relationship, exact recipient, source/consent, owner epoch, canonical decision/evidence and campaign. C3/Producer Integration C4 remains SHADOW; its attention eligibility is not send authority.
2. The eventual trusted adapter would provide the existing gateway descriptor (recipient/body/origin/workflow/reply route/ownership effect), the authorized physical sender, immutable action/payload, attempt correlation, current authority revision and stable attempt gateway key. The current ticket exposes action/attempt/sender/campaign/digest/descriptor/token; the adapter must also load the admitted immutable context and current authority snapshot. No client-supplied context grants permission.
3. Wrap the existing guarded gateway, never create another network sender. Keep its independent STOP/channel/ownership checks. Persist the submission marker before any handoff, disallow automatic network retries, and preserve `delivery_review` on uncertainty. Physical gateway timing and sender/campaign normalization need separate acceptance.
4. Correlate gateway idempotency/registration and provider message ID to the original attempt plus authoritative sender scope. Registration fingerprints alone cannot reconcile unknown acceptance. A future evidence adapter must validate provider receipts and source credentials; a fixture's `authoritative:true` is not real verification.
5. The 0.3 runtime gaps remain: caller-key rather than business-action idempotency, non-atomic fingerprint admission, thrown post-acceptance errors classified as failure, retry jobs generating new keys, `sent` not proving delivery, and webhook status normalization/deduplication losing delivery transitions. Those require separately approved gateway/retry/webhook corrections before any execution. This ledger does not conceal or fix them by itself.
6. No hosted transaction, authentication, immutable authority feed, retention/erasure administration, provider receipt order, rate entitlement or operational reconciliation UI is certified here. Append-only local evidence is for synthetic testing, not approval of a production retention policy. Provider exactly-once handset delivery remains unclaimed.

## Release gates and rollback

Engineering: local accounting accepted after exact-head green CI. Hosted/provider integration: **not accepted**. Existing PR #24 gates, source rights, authorized workflow ownership, real actor/tenant controls, safe persistence/transaction guarantees and provider-specific evidence remain mandatory. Dynamic Cadence C4's live communication canary is separate and unapproved. All prior PRs remain draft/unmerged.

Rollback is removal of these new local-only files and disposal of generated temporary synthetic databases. The scripts clean their temporary directories on normal completion. Process-crash fixtures live inside their test parent directories and are removed by test cleanup. No production schema, route, flag, binding or provider rollback is required because none changed; reverting code would not erase provider side effects in a future deployment.

**Next gate:** a separately authorized hosted/provider integration-readiness review of the existing contract and known gateway gaps, including the actual Cloudflare transaction/isolation capability and authorized messaging product. Cloudflare inventory remains paused until explicitly resumed. Do not begin hosted implementation, migrations, real-data enrollment or sends under this milestone. No further standalone 0.5 accounting architecture is proposed.
