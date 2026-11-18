# AgencyZoom SMS evidence 0.3

Mandate: `CF-AGENCYZOOM-SMS-EVIDENCE-0.3`
Date: November 18, 2026
Disposition: **PASS — isolated offline synthetic acceptance. Live authentication, production activation and outbound communication remain unavailable.**

## Verified prerequisites

Main remains `43588dcf066b24adbed53302d4962ba216358687`. Discovery #43 remains `82d410663748b4c51b36bb740d02b686c309c3ee`; foundation #44 remains `c6931d6a02a6bbb6abef164b524dd19ea3f05f71`. This PR stacks on #45 at `0b87146e41aa5e4750c936f14a7732062c69becb`. All three remain draft/unmerged. Main, PR refs and the relevant open inventory (#39, #36–37 and the existing discovery/connector work) were refreshed. Unrelated branches were not incorporated or changed.

PR #45's [offline workflow 44377298467](https://github.com/dhays4sports/CoverageFit/actions/runs/44377298467) and [shared-profile/desktop workflow 44377298577](https://github.com/dhays4sports/CoverageFit/actions/runs/44377298577) are successful. Its recorded PR test-merge tree equaled the candidate tree. Fresh local baseline: **503/503 root tests; 24/24 desktop tests**, zero skips.

Reviewed foundation normalization, external identities, isolation marker, revision/checkpoint recovery; task/policy evidence and the 7,800-byte source-summary cap; canonical UCP/opportunity links; shared-profile approval/correction and Work; existing SMS conversation storage, `resolveSmsOwnership`, `compliance`, SIGNAL suppression and outbound gateway guards. Imported text is not submitted to the runtime SIGNAL classifier or a model. No live customer/provider data was inspected.

## Storage and read architecture

`server/agencyzoom-sms-contract.mjs` defines the synthetic thread-page/message contract. The existing branded simulator now supplies read-only SMS pages; `synchronizeAgencyZoomSms` reuses scoped authorization, bounded retries, page limits and redacted errors. It has an independent `agencyzoom_sms_v3` checkpoint.

`scripts/lib/agencyzoom-sms-store.mjs` adds an **offline evidence archive in the same isolated synthetic SQLite database**, not an operational messaging database: schema marker, thread references to canonical identities, page receipts/manifests, immutable message revisions, current revision pointers and attributed safety observations. No phone directory, sender, delivery queue, consent master, workflow state machine or replacement customer profile is added. Existing `sms_conversations` is untouched.

Archive tables are created only when the foundation creates an exclusively new synthetic database. There is no production migration. Reopening an older archive without the v3 schema does not auto-upgrade it; SMS synchronization fails closed with setup required, while existing foundation capabilities remain separate.

Existing `cf_solo_sources` stores a small reference/count/integrity summary for each thread. Bodies and message manifests stay outside that summary. The actual demonstration's largest summary is **910 bytes**, while all 34 message identities and 36 immutable message versions remain archived. Source summaries are never truncated to make a thread fit.

## Contract and exact ownership

Required thread fields: exact agency/thread/revision/customer/lead IDs; explicit storage-anchor opportunity; semantic opportunity ID or explicit `null` customer scope; original creation/update times; relationship (`attributed` or `unresolved`); optional declared other-provider reference; historical source opt-out indicator or unknown; source-reported history completeness; requested page index/count; and message records.

Each message retains exact external identity and conversation ID, source revision, direction, declared author role/ID, original time (or explicit unknown), update time, body or deletion marker, explicit change type and delivery report. The importer actor is separately labeled `agencyzoom-offline-importer`; direction does not determine authorship. Delivery values are source reports only, not verified sending, delivery or reading.

Identifiers must resolve through the existing tenant-isolated external registry and current active UCP links. Thread identity binds customer, lead, storage anchor and semantic opportunity. A message ID cannot move to another thread. Changes to original time, direction or authorship require reconciliation. Names, phone numbers, email addresses, body similarity and matching carrier/product labels never supply identity.

Opportunity-specific bodies appear only for that exact opportunity. Customer-level threads are explicitly labeled as context and cannot support an opportunity fact without an explicit relationship. Their storage anchor does not imply sales relevance. Potential RingCentral duplicates remain unverified references with a review hold; no provider conversation is queried, combined, registered or reassigned.

All input uses strict allowlists. Attachments, destination/contact fields, sensitive structured fields and unsupported delivery semantics are rejected. A basic SSN-shaped text rejection is included; it is **not a general sensitive-content detector or real-data retention approval**. Fixtures contain synthetic insurance context only. Message bodies are untrusted text, escaped in the UI, never instructions.

Original zoned timestamp spelling is retained. Missing times remain unknown. Equal instants, including differing offset spellings, are marked chronologically ambiguous. IDs supply deterministic display order within ties, explicitly not inferred conversation order.

## Revision integrity, interruption and bounds

One page transaction commits exact identity references, message originals/heads, page manifest, source summary, safety observations, thread head and audit together. A crash/constraint failure rolls back that page. Previously accepted pages survive an interrupted scan; replay deduplicates them.

Hashes verify normalized originals, page reconstruction, thread headers and the current message index. Reusing a revision with changed content fails. Edits retain prior bodies; unmarked body changes fail. Explicit deletion stores a tombstone. Earlier observed content stays archived; unseen deleted content remains unknown. Omission is not deletion. Previously known old versions never regress current heads. Resurrecting a deleted message or repairing changed identity/time requires a separately reviewed reconciliation procedure.

The scan checkpoint advances only after the requested outer range finishes **and every touched thread revision has all declared pages**. Missing or gapped pages stop completion. The UI may still inspect durable partial evidence, labeled incomplete. Empty scans neither clear records nor certify history coverage. Last successful snapshots remain separate from returned failure codes and redacted audit outcomes.

| Bound | Offline behavior |
|---|---|
| Outer pages | Default 5, hard maximum 10; up to 100 thread-page records per response |
| Thread page range | 1–8 pages; at most 25 messages per thread page |
| Message body | At most 4,096 UTF-8 bytes; page payload at most 128 KiB |
| Retained message identities | At most 200 per thread |
| Immutable message revisions | At most 400 per thread |
| Message-original payload storage | At most 1 MiB per thread |
| Retained page receipts | At most 64 per thread |
| Customer read inventory | At most 8 threads; larger inventories produce a hold |
| Body inspection | Explicit windows of 20 messages; current originals are integrity-checked within the thread bound |
| Reviewed-source references | At most 100 per profile inspection; exceeding the bound produces a hold |

Exceeding a bound stops without deleting accepted evidence. The capacity test fills 200 identities and rejects an additional identity while retaining an earlier STOP hold. No scalability, retention or Workers CPU-budget certification is claimed.

## Completeness and inspection

The producer sees four separate concepts:

1. Whether all pages in the **requested range** are retained.
2. Whether the **synthetic source reports** complete history.
3. Whether the retained current originals passed integrity checks.
4. Whether the **actual conversation history** is established as complete — always unverified here.

Read-only previous/next windows use optional bounded parameters on existing authenticated record reads. **No new HTTP route or authentication path was introduced.** The existing shared-profile feature gate and exact synthetic archive marker still apply. Changing the inspected window does not change the material-evidence revision or invalidate a fact by itself. Records outside the visible window remain archived and can be inspected; content scoped to another opportunity is not projected into the selected opportunity.

Archive/body/page corruption, missing sources, unsupported schema and canonical reassignment produce a contact/review hold rather than a fabricated empty complete history. On canonical reassignment, both the archive's original customer and the newly associated anchor are held; message bodies are withheld. Non-future-agency workspaces do not query these archive tables.

## Suppression and contact authority

The importer reuses the existing `compliance` text semantics as a **read-only evidence classifier**. Attributable inbound prospect opt-outs and explicit historical source opt-out reports become retained source observations. Unknown-direction/unknown-author opt-outs, wrong-number evidence, unresolved relationships and potential cross-provider duplicates produce review holds.

These observations are not a provider consent or suppression master. They are monotonic imported evidence projected through existing `contactSafety` holds. No imported event grants consent, clears an authoritative hold or changes provider ownership. Later replies, missing pages, edits, deletion markers, omission and replay do not clear an accepted historical observation. Outbound STOP text is not an inbound opt-out.

Work labels the imported hold, disables its messaging capability projection and removes an imported-held next action. Prospect 360 remains available for passive review. Existing provider STOP/DNC state remains byte-for-byte unchanged. There is no production sender integration or claim that every legacy provider workflow has been live-certified to consume this offline evidence. All actual provider execution remains outside this prototype and unauthorized.

## Source-bound producer review

The existing shared-profile approval, optimistic version guard, save receipt and correction/supersession workflow now accepts an exact `smsEvidence` binding: thread ID/revision/digest and message ID/revision/digest, validated against canonical identity and current archived originals. Only a suitably attributed inbound prospect message with an exact opportunity relationship can support this action. Customer-level, unresolved, deleted, unobserved-current or integrity-failed sources cannot be approved through it.

The UI leaves the fact value blank and requires an explicit fact key. The producer chooses the narrow insurance fact, inspects the proposal and explicitly approves it. No automatic fact extraction, task, callback, appointment or CURRENT SIGNAL recommendation occurs. The server copies the verified original into approved evidence; a caller-supplied paraphrase cannot replace that original. Approved-copy hashes are checked when source evidence is reopened.

Corrections preserve the original reviewed choice. A message edit/deletion, changed thread revision or unavailable source makes the affected reviewed fact stale and removes it from current verified facts. The old original may remain integrity-available; availability is distinguished from current applicability. The source archive does not automatically approve newer wording. Changed material evidence also rechecks existing summary/draft coverage. Pending approvals survive a lost response and retry their unchanged request without duplication.

## Acceptance and reproduction

```sh
node --test tests/agencyzoom-sms.test.mjs
node --test tests/*.test.mjs
npm test --prefix apps/prospect-desk
node scripts/agencyzoom-sms-demo.mjs
```

Use Node 24 and existing app test dependencies. The demonstration creates and removes its own isolated local DB. Actual existing Work and Prospect 360 projections produce `docs/agencyzoom/sms-demo.html` and `sms-receipt.json`. The HTML contains five successive static acceptance snapshots with disabled controls; interactive review and paging are separately exercised by DOM tests against real service/record-handler code. It is not hosted browser or live-provider certification.

| Verification | Executed local result |
|---|---|
| PR #45 unchanged baseline | 503/503 root; 24/24 desktop PASS |
| New SMS tests | **48/48 PASS** |
| Full root regression | **551/551 PASS**, zero skips |
| Prospect Desk application regression | **24/24 PASS**, zero skips |
| New/update/duplicate pages, restart and replay | PASS |
| Exact identity, tenant collision, opportunity/customer scope | PASS |
| Out-of-order/tied/unknown timestamps and offsets | PASS |
| Conflicting revisions, edits, deletions and omitted messages | PASS |
| Corruption, transaction abort, page gaps, archive/window bounds | PASS |
| Source-bound fact review, correction, invalidation and lost-receipt retry | PASS |
| Imported opt-outs, ambiguous evidence and authoritative STOP/DNC preservation | PASS |
| Existing authenticated read paging; no new endpoint | PASS |
| No-network sentinel, no provider conversations/outbox/local tasks | PASS |
| Synthetic demo | PASS: initial 4 pages; edit 1; deletion 1; replay 0 new pages; 3 threads; 34 message identities / 36 versions; 2 producer reviews become stale after source change; STOP hold retained; sends 0 |

**New-package remote CI is recorded in the draft PR after publication.** The counts above are local execution results; predecessor CI is recorded separately. The workflow runs full root and desktop tests plus all three connector demos. Source/build success alone is not hosted acceptance.

## Remaining limits and next recommendation

Real AgencyZoom entitlement, schemas, exact thread/message identifiers, deletion/edit semantics, paging snapshots and retention permissions remain unverified. The normalized fixture contract is not a certified live API response. The archive is local Node/SQLite evidence storage; D1 compatibility, migration/retention, pagination economics and production authorization require separate work. Existing archives are not automatically upgraded. Ambiguous ownership and deleted-message resurrection remain reconciliation holds; no clearing or provider-linking mechanism is introduced here.

**Recommended next phase: offline evidence reconciliation and SIGNAL shadow readiness.** Consolidate policy/SMS/date/identity conflicts into the existing producer review experience, establish an explicit audited reconciliation design and retention/paged-history budget, and evaluate whether approved evidence improves producer prioritization in no-action SHADOW. Measure review usefulness and effort before enabling another integration surface. No live credentials, contact automation, sender integration, write-back, APEX automation or release should be bundled into that phase.

The integration remains disabled by default. No live AgencyZoom authentication, credentials, production data/schema/configuration change, Virginia Tam data access, outbound communication, provider mutation, customer contact, spending, support outreach, merge or production deployment occurred.
