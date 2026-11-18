# AgencyZoom connector foundation 0.1

Mandate: `CF-AGENCYZOOM-CONNECTOR-FOUNDATION-0.1`  
Date: November 18, 2026  
Disposition: **PASS — offline synthetic connector acceptance. Live integration and production activation remain NO-GO.**

## Inspected source and scope

Base: current main `43588dcf066b24adbed53302d4962ba216358687`.
Discovery: draft [PR #43](https://github.com/dhays4sports/CoverageFit/pull/43), head `82d410663748b4c51b36bb740d02b686c309c3ee`, `docs/AGENCYZOOM-INTEGRATION-DISCOVERY-1.0.md`.
Fetched main and PR #43; inspected open PR inventory, including #39 direct contact, #36–37 distribution, and #16–30's separately gated SIGNAL stack. Those branches are not incorporated, rewritten or activated. This engineering PR starts at main; it does not depend on merging #43.

Reviewed existing AgencyZoom CSV/raw import (`agencyzoom-raw.mjs`) and district enrollment (`agencyzoom-import.mjs`, `district-pilot.mjs`); UCP, Solo Desk repository and task authority; Producer Work and SIGNAL ownership; shared-profile evidence/review/queues and Prospect Desk owner release; workspace configuration, Access checks, producer defaults, schema and tests. District-specific enrollment and current-agency configuration are deliberately not reused. Existing workflows retain their defaults.

## Implementation and isolation

- `server/agencyzoom-connector.mjs`: allowlisted normalized read contracts, simulated transport, synchronization coordinator and extension names for future policies/SMS/email. **There is no HTTP client, login, credential provisioning, route, scheduler, live resource operation or write-back method.** The simulation supports only `readLeads`; an arbitrary replacement transport is rejected.
- `scripts/lib/agencyzoom-offline-store.mjs`: Node-only synthetic SQLite store. Creates an exclusively new file (or fresh memory DB), applies existing canonical migrations **only to that empty local database**, and adds private connector identity/revision/audit tables there. No production migration was added. Reopen requires the existing database identity marker to match.
- Existing `cf_ucp_*`, `cf_solo_opportunities`, `cf_solo_sources` and `cf_solo_sync` remain the canonical records. Auxiliary `az_*` tables hold external identifier references, immutable source revisions, heads and redacted audit outcomes, not another customer or task master.
- Enablement defaults absent/OFF. All of `enabled:true`, `mode:offline_synthetic`, `future-agency:synthetic:*` workspace, `synthetic-*` agency ID, `az-test-*` DB ID and an exact scoped `agencyzoom:synthetic:read` principal are required before reading transport. The actual DB marker must agree. No producer-config fallback or current-agency token is used. No current-agency data was queried, copied or reassigned.
- This principal is a local test-harness assertion, **not production authentication**. Production is structurally unavailable. A future implementation must supply independently verified server authorization, tenant/account identity and database-binding verification; it cannot turn this on by setting an environment variable alone.

## Normalized contract and identity

The fixture is a connector-level contract, **not a claim that the real AgencyZoom API returns this JSON**. Required lead fields: agency, exact lead/customer/revision IDs, explicit synthetic marker, UTC creation/update timestamps, name, immutable source ID/label, pipeline, stage, producer ID, opportunity metadata, tasks and notes. Associated resources retain their exact IDs and original creation/update timestamps. Tasks include due/state, notes include attributed author and bounded text. Notes are untrusted source evidence, rendered escaped, never instructions.

Require exact canonical ISO UTC milliseconds; reject impossible/ambiguous dates, missing fields, unknown/nested unsupported fields, wrong scalar types and duplicate opportunity/task/note IDs. Limits: 100 leads/page, 10 opportunities/tasks/notes per lead, 240 characters per note/task title, normalized record at most 6,000 UTF-8 bytes. No phone/email/address/DOB/financial/credential fields are accepted in this phase. This narrow scope is intentional; unsupported real payloads must be explicitly translated at a future authenticated boundary.

External customer, opportunity and source mappings use entity type plus exact external ID **inside a database locked to one explicit workspace and AgencyZoom tenant**. Canonical IDs additionally hash workspace, agency, type and external ID. Opportunity mappings bind both owning lead and customer; source mappings bind lead+opportunity. Task/note IDs remain within the tenant/lead revision evidence. Names never determine identity. New exact customers create conservative canonical UCP records; multiple explicit external opportunities with that customer ID share one UCP customer.

`store.reconcile` allows an explicit offline operator association to an existing verified UCP opportunity, validating customer/household/workspace and rejecting ambiguous opportunity aliases. It does not infer links from contact fields. Changed customer relationships, disappeared opportunities, locally reassigned UCP links or conflicting IDs stop for reconciliation. No automatic remap, customer merge, inferred conversion or deletion exists. Changing an established external mapping needs a later reviewed reconciliation procedure.

Each normalized revision is SHA-256 hashed and retained in an immutable insertion-only ledger. Replay and update verify the stored original against its digest; detected corruption blocks synchronization. Same ID/revision with different content fails. Previously accepted revisions replay without overwriting newer heads. Unseen stale or equal-time conflicting revisions fail conservatively. Source attribution and original timestamps remain in each original revision, even after an update. Updates change source evidence and local edit-version/freshness metadata, preserving locally edited contacts, customer facts, products, stages, task state, evidence approvals and producer controls.

## Synchronization and interruption

Each lead's customer/opportunity links, external mappings, current source evidence, immutable revision, head and audit acceptance commit in one `BEGIN IMMEDIATE` transaction. A database exception rolls back all of them. Existing evidence sources unrelated to the connector are untouched.

Scans start at page zero. Subsequent scans request a five-minute overlap before the durable update watermark. Page size is 100, default scan limit five pages, hard maximum ten. Validate the full page before ingesting its first lead. A completed lead may survive a later page failure; no scan checkpoint advances until the entire bounded scan finishes. Restart/reopen replays page zero with durable deduplication. Failed or truncated scans stop visibly rather than skipping pages. Checkpoint compare-and-swap rejects stale completion. The simulated transport records request parameters; real upstream filtering, stable ordering and late-update behavior remain unverified.

401/403 stop immediately. 429/503 allow at most two retries (three attempts), delays clamped to one second per retry. Other failures stop. Audit stores only enumerated outcomes and timestamps; no record IDs, note bodies, payloads, credentials or provider error text. Raw transport errors are converted to fixed failure codes.

## Existing producer experience

The actual demonstration reads the existing `producerWorkspace`, `soloRepository`, UCP and `sharedProfileService`. One mock lead produces two canonical opportunities in Work's **All/OTHER** population, sharing one customer in Prospect 360. It does not enroll a district SIGNAL population, create a new Today task or infer a governed recommendation.

Both Work detail and the shared Prospect 360 panel display **AgencyZoom**, the last successful synchronization snapshot, source revision, source update and synchronization timestamps, vendor source, pipeline/stage/assignment, and read-only tasks/notes. These are source snapshots, not a live connector-health monitor. Audit/returned status reports failed scans; UI failure-health projection is a later increment. No source snapshot is promoted to a reviewed fact, commitment or task. Imported tasks remain readable evidence; local `cf_solo_tasks` retain task authority. Existing review/correction, suppression and Work controls are preserved.

Reproduce locally with Node 24:

```sh
node --test tests/agencyzoom-connector.test.mjs
node scripts/agencyzoom-synthetic-demo.mjs
```

The demo creates and deletes its own isolated temporary database and refreshes `docs/agencyzoom/synthetic-receipt.json` and `synthetic-demo.html`. The HTML is a static snapshot of actual existing Work/Prospect 360 projections, with mutation controls disabled; it is not a hosted authentication or browser-interaction certification. No preview deployment or production configuration is needed. Existing GitHub/Pages automation may build the draft branch, but that does not activate the connector or establish hosted acceptance.

## Acceptance report

| Verification | Result |
|---|---|
| New and updated ingestion; one customer / multiple opportunities | PASS |
| Duplicate pages/scans; old replay does not regress head | PASS |
| Explicit association to existing canonical profile | PASS |
| Incorrect/conflicting/ambiguous identity; local reassignment | PASS — closed |
| Missing/malformed/unsupported fields; timestamp and page bounds | PASS — rejected |
| Interrupted scan, disk close/reopen, transaction abort and recovery | PASS |
| Incremental overlap and zero-based bounded request pagination | PASS — simulated contract |
| 401/403 stop; 429/503 bounded retry; other transport failures | PASS |
| Disabled defaults, authorization, DB identity, cross-agency isolation | PASS — synthetic only |
| Escaped evidence; zero network calls in send-sentinel test | PASS |
| No SMS conversations, outbound outbox rows, copied tasks or approved facts | PASS |
| Connector suite | **32/32 PASS** |
| Full existing root suite plus connector | **461/462 PASS**; sole inherited failure below |
| Main baseline, same environment | **429/430 PASS**; same inherited failure |
| Prospect Desk application suite | **24/24 PASS** |
| Demo | PASS: initial=1, update=1, replay=0, opportunities=2, customer=1, sends=0 |

The inherited `tests/agencyzoom-raw.test.mjs` assertion expects `/48 hours/`, while main returns `READY — outside 7 days; import outside NEW_LEAD pilot`. Reproduced on untouched main; this PR does not change district business policy or hide the failing assertion. Full-suite status is consequently not green. Connector-specific acceptance passes with no new regression.

## Production boundary and next phase

No live AgencyZoom authentication, customer data, APEX calls, CRM writes, outbound communications, production DB changes, flags, deployment, merge, spending or support outreach was performed. Credentials were not provisioned. No API entitlement, real response shape, stable revision ID, lead-to-customer relationship, exhaustive paging, deletion/conversion semantics or source completeness is certified.

Before any future live read-only code, require a separately authorized future-agency account and entitlement; server-only least-privilege authentication; owner/workspace/account binding; a dedicated verified database; encrypted secret storage and rotation; redacted auth failure handling; read-operation allowlist (some documented searches use POST); no credential/body logging or browser credentials; real contract fixtures; retention limits and review controls. Live login/refresh must be supplied by a separate audited module, never this simulation. APEX remains a native AgencyZoom handoff.

**Recommended next engineering phase:** expand offline read-only task reconciliation and policy/renewal evidence first, then SMS thread evidence with explicit completeness, message IDs, chronology and STOP/DNC precedence. Keep imported tasks governed by AgencyZoom and map only through existing Work authority; test policy-to-customer identifiers, renewal conflicts/corrections and freshness without inventing carrier outcomes. Before SMS evidence can influence SIGNAL, prove exact conversation ownership, deduplication, partial-history labeling and suppression inheritance. Email can follow the same attributed evidence model. No sends, task write-back, stage automation or live access should be bundled into that phase.
