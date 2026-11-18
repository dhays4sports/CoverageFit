# One shared prospect profile — desktop integration 0.2

Problem: the initial Prospect Desk pilot saved its own local prospect records.
A producer would otherwise have to maintain different facts in CoverageFit,
Signal and the screenshot app. This change makes the desktop a client of the
existing UCP customer identity, with each thread explicitly targeting an existing
linked opportunity. It adds source-linked reviewed evidence, not another CRM.

## Resulting flow

Capture → choose existing CoverageFit customer → choose linked policy/opportunity
→ discuss/correct privately → generate versioned review → approve selected items
→ one transactional shared save → identical shared evidence in the desktop and
CoverageFit/Signal Producer Workspace. Full drafts remain local. Only evidence
supporting selected additions is uploaded; nothing contacts a prospect.

Backend: `server/shared-prospect-profile.mjs` and the default-off
`/api/shared-profile/` endpoint. Desktop: `apps/prospect-desk`, including the
already delivered Prospect Desk UI. The earlier unpublished
`feature/coveragefit-desktop-copilot-1.0` branch is preserved, not merged or
activated as a second profile system. This proposal supplies the connector for
the screenshot app requested in this conversation. Other unmerged intelligence
stacks are preserved; this is not a replacement implementation of E2/C1–C4.

## Existing authorities and durable evidence

- Customer, household, opportunity and workspace IDs come from existing UCP.
  Search is paged; identity linking is never inferred from a screenshot/name.
- `0020_cf_shared_profile.sql` adds approved-update and capture-chunk tables linked
  to existing identities. It does not seed/replace customers or opportunities.
- Selected messages and original screenshot bytes persist with SHA-256 metadata.
  Base64 chunks are bounded below D1's per-value limit; per-approval images total
  <=6 MiB. Item JSON <=20 KB, source-record JSON <=900 KB, request <=10 MiB.
- Existing `cf_solo_sources` and audited activity record the approved additions.
  Selected tasks/callbacks use existing `cf_solo_tasks`. Unclear timing stays blank
  with a blocker, rather than becoming a made-up appointment time.
- Native cache refreshes from the server before AI processing/review. It is not a
  master record. Draft screenshots and discussions can persist locally offline.
- Reads use a single bounded SQL snapshot; a hash version is rechecked inside
  the transaction. Customer/identity/source/task changes reject a stale review.
  Inputs remain available for a refreshed review.
- Approval IDs and fingerprints fence replay. Uncertain native requests retain
  the exact payload across restart; changed selections cannot reuse that request.
  Definitive rejected saves unlock the review. New corrections/captures invalidate
  old unsubmitted reviews. Each thread pins its own target opportunity.
- Reassigned opportunity links withhold earlier shared evidence pending identity
  reconciliation; there is no silent transfer of evidence across customer IDs.
- No automatic fact verification. Confidence is preserved from the producer's
  review. Corrections append evidence; this is not generalized fact conflict
  resolution or the unmerged SIGNAL Prospect Memory flywheel.

## Access and preserved execution boundary

`CF_SHARED_PROFILE_ENABLED` must equal `1` to activate this route or the added
shared producer panel. Default behavior and existing sending/import tools remain.
A separate `CF_SHARED_PROFILE_DESKTOP_TOKEN` (>=32 characters) is required for the
single configured owner workspace. The normal producer token cannot authorize
this endpoint; the desktop token cannot authorize existing sending endpoints.
It is pinned to the HTTPS origin, encrypted under Windows account protection,
and never placed in the renderer or backup. Cross-origin/browser-origin requests
are rejected. This is an owner-private pilot, not multi-tenant SSO certification.

Legacy producer APIs continue their existing authorization. Protected source
images are fetched through a producer-authenticated evidence route, with no
public image URLs. The shared producer detail includes the same canonical object
read by the desktop. Original stage/consent/suppression/provider ownership are
not rewritten. CONTROL/raw cohorts are held from shared writes; STOP remains
suppressed. New evidence never grants outreach, Calendar, or provider authority.

## Current limits and release state

Implemented and tested with local SQLite and simulated desktop transport. No
production merge, hosted migration, token provisioning, flag activation, client
record transfer, live OpenAI request, provider call, or new billable resource was
performed. The server remains inactive until a reviewed hosted rollout.

The read projection is bounded (100 related opportunities/tasks, 80 legacy
sources, 50 recent approved updates). Large legacy summaries are explicitly
marked truncated; full approved source evidence is separately retrievable.
Older shared updates remain stored, but older-history paging is not implemented.
Large aggregate snapshots can encounter D1 limits and must fail without changes;
no scale/latency acceptance is claimed. This is deliberately a bounded owner
pilot. Screenshots are database chunks in this slice; inspect storage/retention
cost and consider governed object storage before expanding volume.

Shared tasks are completed through existing CoverageFit work controls, then
refreshed on desktop. Native app-level task completion is not a second workflow.
API usage still uses the owner's existing OpenAI key, stored in the native main
process. Windows capture/tray/mixed DPI and real-provider accuracy remain actual
laptop acceptance gates. Windows CI packaging/startup smoke is separate from
interactive screenshot certification.

## Validation and known baseline failure

- Desktop core/DOM/connector checks cover local persistence, selected approvals,
  provenance, retry receipts, backend pinning, corrections and per-thread targets.
- Server checks cover read-only/scoped access, atomic stale/racing saves, identity
  reassignment, idempotency, evidence bytes, task linkage, CONTROL/STOP, escaping,
  and actual desktop → database → second desktop → producer-detail equality.
- Full backend suite has a pre-existing AgencyZoom wording assertion expecting
  `48 hours` while main produces `outside 7 days`. Reproduced on untouched main
  `29b5839`. It was not changed or bypassed here. Record targeted and full-suite
  totals from the exact head before review; do not claim all-suite green.

## Hosted activation packet — not executed

Before enabling: identify the actual Pages project, production branch and
merge-trigger effects; inspect isolated Preview and Production DB bindings,
compatibility/runtime support, existing flags and rollback. Back up the selected
DB. Review authorization/rights, retention/subject erasure, source identity and
customer-data processing. The new evidence tables need integration into the
operator's retention process; no automated retention policy is activated here.

With an exact reviewed release approval: apply migration 0020 to the approved
isolated target; provision a dedicated random desktop-profile token securely;
deploy the exact reviewed head with the flag initially off. Test synthetic
customer scope, cross-workspace denial, evidence read-back, version conflict,
uncertain retry, no-send behavior and rollback on the real Workers/D1 runtime.
Enable only for the approved owner workspace, then configure the app's HTTPS
origin/token through its Settings. Initial customer processing awaits those gates.

Rollback: disable `CF_SHARED_PROFILE_ENABLED` and revoke/rotate the dedicated
desktop token; keep existing producer routes and data intact. Preserve evidence
rows/chunks for retention and reconciliation rather than deleting on rollback.
No existing send/automation setting needs changing.

Official runtime references consulted:
- https://developers.cloudflare.com/d1/worker-api/d1-database/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/workers/runtime-apis/web-crypto/

Exact local validation for this proposed runtime:
- Desktop: **21 passed, 0 failed**.
- Shared backend + existing Producer Workspace targeted suite: **25 passed, 0 failed**.
- Full backend: **412 total, 411 passed, 1 failed**; the sole failure is the
  untouched-main AgencyZoom wording assertion documented above.
- Static syntax checks and `git diff --check` passed.
- The packaged Windows ZIP is separately verified against these runtime files;
  local build does not certify native Windows or hosted deployment behavior.
