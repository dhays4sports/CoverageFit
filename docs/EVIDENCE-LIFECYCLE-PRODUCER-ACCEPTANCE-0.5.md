# Evidence lifecycle & producer acceptance 0.5

Mandate: `CF-EVIDENCE-LIFECYCLE-PRODUCER-ACCEPTANCE-0.5`  
Disposition: PASS — bounded offline synthetic engineering acceptance. Human usability UNVERIFIED. Disabled by default; no live access or action execution.

## Prerequisites and scope

Fetched main and PRs #43–47. Main remains `43588dcf066b24adbed53302d4962ba216358687`. This branch starts directly at PR #47 head `d190cbe5132cde93a2eb3286011009630fc1ed40`, tree `8af022806dd1db5ca511691130a9e72625765d06`; #46 is an ancestor. Prerequisites and unrelated open work remain unmerged. No unfinished SIGNAL stack was incorporated.

PR #47 remote runs [44401304557](https://github.com/dhays4sports/CoverageFit/actions/runs/44401304557) and [44401304821](https://github.com/dhays4sports/CoverageFit/actions/runs/44401304821) were freshly observed as successful. Reproduced local baseline: 596/596 root tests, 24/24 Prospect Desk tests.

Reviewed existing combined-review export (a presentation export, not an archive restore protocol), canonical UCP links, external mappings, connector revision/checkpoint tables, policy source summaries, SMS archive, shared-profile approvals/capture chunks, task receipts, suppression dependencies, Work/Prospect 360 and the existing pure SIGNAL contract. The new package uses those structures; no customer, policy, task or messaging authority is added.

## Package contract

Version: `CF-OFFLINE-EVIDENCE-PACKAGE-1`. One JSON document with exact top-level keys:

| Field | Meaning |
|---|---|
| `version` | Supported package contract version |
| `scope` | Exact synthetic workspace, agency ID and logical database ID |
| `createdAt` | Export timestamp, not source observation time |
| `manifest` | Per-table counts/digests, dependency digest and explicit omissions |
| `dependencies` | Exact existing canonical/context keys and digests, without canonical row values |
| `data` | Strictly allowlisted existing evidence rows |
| `packageId` | SHA-256 of the complete payload excluding this field |

The manifest states: **Checksums establish package consistency, not provider authenticity or current provider state.** This is not signed provider evidence and cannot establish trust in an arbitrary package author. Packages require explicit local operator selection and matching synthetic authorization; their contents remain attributed evidence under existing review rules. No credentials, provider conversations or consent grants are exported.

Included data: external identity maps; lead/resource originals and heads; read audits; SMS thread headers, page receipts/manifests, immutable message versions, heads and historical observations; synchronization failures/scans/checkpoints; connector source summaries; existing shared-profile update records, screenshot chunks, review source summaries and approval activity. Original edit/deletion/correction/supersession and request IDs remain intact. Row sequence is preserved for shared-profile review chronology. Source records and normalized contracts have explicit field allowlists; operational source kinds and unsupported tables reject.

Not included: canonical customer/household/opportunity/task row values, operational `sms_conversations`, credentials, active scoring/population state, provider authorization or an executable action. The manifest records these omissions rather than implying a complete operational database backup.

### Required destination dependencies

The destination must already contain exact versioned canonical customers, households, memberships, opportunity links, opportunities and local tasks. Full row digests detect changed versions or local task state. Any excluded context sources and referenced provider-state rows are separate required dependencies; their keyed digests must match. A missing provider dependency rejects restore, even if a package contains reviewed facts. Additional destination holds are preserved.

The **test-only** destination bootstrap copies synthetic canonical reference rows separately before restore; an optional test-only step supplies synthetic provider STOP fixtures. This does not expose an identity-copy command or make an evidence package an authorization to create or migrate canonical records. Source and destination have the same declared logical synthetic database identity, in distinct explicitly prepared local files. Different logical database/agency identities reject; this phase does not authorize reassignment to another tenant.

## Bounds and storage behavior

Package limit: 16 MiB; 5,000 rows per table, 20,000 evidence rows overall, eight SMS threads and 50 shared-profile approvals per package. These are conservative whole-workspace snapshot limits, not production sizing claims. Input files are size checked and bounded while reading; table counts and serialized payload sizes are bounded. Exported package files are private, exclusively created and published from an fsynced temporary file without overwriting an existing package.

Unchanged per-thread archive limits: 200 message identities, 400 retained versions, 1 MiB original payload and 64 page records. Policy source-summary budget remains 7,800 bytes. Normalization, original/page reconstruction, exact relationships, review dependencies, capture hashes and historical suppression observations are checked. Current and historical revisions are distinct: an old, integrity-available approved message is retained even when its conclusion is now stale.

Export leaves source rows and capacity unchanged. Restore does not expand per-thread budgets. The existing Review tab explains this and shows the latest historical workspace restore receipt and package size inside its capacity details. Local CLI inspection reports requested-range coverage, source-reported completeness, original counts/bytes and unchanged limits; actual history remains unverified.

## Restore transaction and receipts

Restore is a **snapshot restoration**, not an incremental merge. It accepts an empty compatible evidence destination with exact preexisting dependencies, or identical evidence data. Any other existing included evidence rejects for explicit inspection. It never updates canonical rows, local task state, provider state, ownership, active scores or populations.

An expected-destination-state digest is required. Under one `BEGIN IMMEDIATE` transaction, restore validates dependencies, checks that state, inserts allowlisted evidence, verifies integrity/closure/capacity, records an acceptance receipt, then commits. Any failure rolls back all inserted evidence and the receipt. Existing facts cannot become current against a partially committed restore.

Receipts retain package ID, actor, timestamp, request identity, expected state, counts, package bytes and explicit false contact/operational-replay/capacity-freed flags. Same-request retries return the original acceptance receipt after an integrity check. They do not overwrite later producer decisions or certify the current database as identical to the old snapshot. Reusing a request for another package, actor or expected state rejects. Repeating an identical package under another explicit request creates only an inspection receipt, not duplicate evidence or local work.

Tested actual process termination immediately before COMMIT: no partial restore survived, and the same request restored successfully after restart. This is local SQLite crash recovery evidence, not hosted D1 acceptance.

## Suppression and authority

Historical opt-outs retain exact supporting message/header revisions and attribution. Validation checks required opt-out and uncertain-ownership observations; removing a historical STOP observation from an otherwise consistently resealed package rejects. Reviewed source facts cannot supply contact authority. Existing authoritative provider STOP and communication ownership remain byte-identical.

Missing originals or invalid hashes reject restoration. If evidence later becomes unavailable or corrupted, existing projections invalidate dependent conclusions and hold SHADOW. Partial requested ranges and source history limitations remain visible; absence of a message never becomes consent or completeness proof. Factual reconciliation may resolve a review issue while contact remains held.

No network call, provider write, local task creation/completion, callback, appointment, district enrollment, consent clearing or action execution is part of export, restore, inspection or SHADOW.

## Producer scenarios and measurements

Expected cases were declared in `tests/fixtures/agencyzoom/lifecycle-expectations.json` before evaluation execution. Twelve scenarios cover clean lead/policy records, conflicting/resolved policy dates, stale SMS review, unlinked/linked external tasks, uncertain ownership, historical STOP, partial history and approaching/exhausted capacity. Separate tests cover multiple opportunities, unavailable originals, corrections/deletions, images, provider STOP after factual resolution and unsupported resolutions.

The automated DOM evaluation uses the existing Work/shared Prospect 360 UI. Every open item displays customer/opportunity, problem, effect, source references and smallest next step. From an open Prospect 360, inspection takes one click to Review and one to the first issue's exact references; clean records take one click. Policy-date review and exact local-task association each require five navigation clicks including reference inspection, proposed-decision review and explicit save. These counts exclude reading, typing, login and opening the customer. They do not measure speed, cognitive burden or actual human success.

The UI improvement is confined to capacity/preservation explanations and historical restore receipt visibility in the existing queue. No parallel dashboard was introduced.

## Acceptance

| Verification | Result |
|---|---|
| Fresh inherited local baseline | 596/596 root; 24/24 desktop |
| Final local regression | 633/633 root; 24/24 desktop |
| New lifecycle tests | 37/37 |
| Fixed synthetic lifecycle evaluation | 12/12 PASS |
| Duplicate / unnecessary / missed review issues | 0 / 0 / 0 |
| Incorrect resolutions / stale-current conclusions | 0 / 0 |
| Suppression or authority violations / evidence references lost | 0 / 0 |
| Network attempts / communications in the evaluation | 0 / 0 |
| Existing five demonstrations | All PASS locally |
| Human usability | UNVERIFIED — no human session occurred |
| Candidate remote CI | Recorded separately in the draft PR after publication; not inferred from local success |

The 37 new tests include adversarial, CLI, process-crash and real DOM-to-service coverage in addition to the fixed scenarios. `lifecycle-evaluation.json` contains expected/actual measurements. These are engineering results, not evidence of sales lift, production scalability or producer time saved.

## Reproduce

Node 24; install the existing desktop test dependencies with `npm ci --ignore-scripts --no-audit --no-fund` in `apps/prospect-desk`.

```
node --test tests/*.test.mjs
npm test --prefix apps/prospect-desk
node scripts/evidence-lifecycle-demo.mjs
```

The demo creates and removes isolated source/destination databases. It exports retained SMS originals and a previous reviewed fact, restores into exact separately seeded canonical references, resolves two genuine issues through existing UI controls, reads updated Work/Prospect 360 and revision-bound SHADOW, then replays the original restore request without undoing the producer decisions. One local task remains open. Snapshot controls in `docs/agencyzoom/lifecycle-demo.html` are disabled. Full receipts are in `lifecycle-receipt.json` and the scenario evaluation in `lifecycle-evaluation.json`.

Explicit local commands, using an operator-created JSON config file with `config` and `principal`:

```
node scripts/evidence-package.mjs inspect synthetic-operator.json destination.sqlite
node scripts/evidence-package.mjs export synthetic-operator.json source.sqlite evidence.json
node scripts/evidence-package.mjs restore synthetic-operator.json destination.sqlite evidence.json restore-request-id EXPECTED_STATE_FROM_INSPECT
```

`config` must contain `enabled:true`, `mode:"offline_synthetic"`, exact `workspace`, `agencyId`, `databaseId`; existing formats remain `future-agency:synthetic:…`, `synthetic-…`, `az-test-…`. `principal` must match workspace/agency, use `permission:"agencyzoom:synthetic:archive"` and a `synthetic-…` actor. This is an explicitly scoped synthetic operator principal, not production authentication. Existing shared-profile reconciliation flags/authorization remain separately required to review evidence in Work.

Commands cannot create canonical identities or prepare a destination. Fresh isolated stores include the additive package-receipt table; older stores fail setup without an automatic upgrade. No production migration exists. Failure output contains fixed codes rather than data, file contents or secrets. Keep packages private; even synthetic originals are untrusted text, rendered as data.

## Remaining gaps and next milestone

Hard-cap exhaustion remains a real blocker. Copying a full thread into another identical archive does not make room. A concrete next storage design should separate immutable version objects/page manifests from bounded inspection indexes, preserve content digests and exact source-bound references, and validate export/restore and projection parity before any explicitly authorized bound increase or storage cutover. Deletion, destructive compaction, cross-agency reassignment and automatic archive activation remain out of scope. No larger storage deployment is implemented or implied here.

Recommend **Producer Review Walkthrough & Archive Scale Design 0.6**: use these same synthetic scenarios for an actual owner walkthrough, record comprehension/errors/decisions rather than speculative time savings, and prepare a bounded storage/reference-migration design against measured archive workloads. The next implementation should follow demonstrated usability or capacity gaps. Live AgencyZoom API semantics, hosted D1/CPU budgets, authenticity/trust distribution, production retention/security and future-agency operational authorization remain separate unverified prerequisites.
