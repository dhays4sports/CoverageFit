# CoverageFit — AgencyZoom Integration Discovery 1.0

Status: **documentation-only proposal; no credentialed integration, code, schema, or deployment changes**
Date: 2026-11-18
Decision: **CONDITIONAL GO for an isolated, read-only fixture adapter; NO-GO for live AgencyZoom access, sending, APEX automation, or existing-agency data transfer.**

## Product decision and trust boundary

The intended use is the owner's **future independent Farmers agency**. AgencyZoom may remain the operational CRM and vendor-intake / Farmers quoting gateway while CoverageFit provides its own evidence-backed Prospect 360, SIGNAL intelligence, and producer experience. This is an adapter to the existing shared profile—not a second customer database or a CRM replacement.

**Never import, retrieve, query, copy, or repurpose leads, customer/policy records, communication histories, credentials, or agency data from Virginia Tam's agency.** An existing producer's access is not permission to transfer agency-owned records. Do not invoke a production API, backfill the current workspace, or turn on a synchronization job in the current tenant. A separately approved future-agency identity, authorization, and isolated database or demonstrably enforced tenant boundary are prerequisites to any live pilot.

The owner elected to **skip AgencyZoom sales/support outreach**. Treat plan entitlement, account permissions, event triggers, and APEX API handoff as unanswered; do not make them blocking questions for a documentation-only fixture exercise or silently treat them as confirmed.

## Evidence reviewed

1. Official AgencyZoom public API reference, https://api.agencyzoom.com/openapi/ (accessed November 18, 2026). Documents JWT bearer login with version=2 refresh tokens, a 120 requests/minute published limit since August 17, 2026, and user-derived access permissions. This is not a statement that the intended future account includes API access.
2. AgencyZoom Web Lead Integration, https://support.agencyzoom.com/en/articles/12083509-web-lead-integration — webhook/email vendor intake, pipeline/stage assignment, producer/CSR and source mapping.
3. AgencyZoom Farmers Release Updates (December 2024), https://support.agencyzoom.com/en/articles/10201198-farmers-release-updates-december-2024 — AgencyZoom UI quote links create APEX records for completion in Alta or Guidewire Rater. No public APEX-launch endpoint confirmed.
4. Farmers Recommendation Engine / Lead Marketplace integration, https://support.agencyzoom.com/en/articles/17065320-recommendation-engine-integration-with-agencyzoom-via-farmers-lead-marketplace — cross-sell, win-back, and quotes-not-closed delivery into AgencyZoom. Delivery must not imply authorization to transfer current-agency data.
5. Existing repository: server/agencyzoom-raw.mjs, server/agencyzoom-import.mjs, server/solo-desk-repository.mjs, server/universal-customer-profile.mjs, server/sms-signal-service.mjs, server/producer-config.mjs, and docs/SHARED-PROSPECT-WORKSPACE-1.0.md. Prior Prospect Desk production release documented at docs/PROSPECT-DESK-OWNER-RELEASE-1.0.md.

## Public endpoint-to-CoverageFit matrix

'Documented' means only that a public endpoint or feature exists. It does **not** confirm account entitlement, response completeness, consent, real-time delivery, or use in the intended future agency.

| Capability | AgencyZoom public API or feature | Intended CoverageFit mapping | Status / caveat |
|---|---|---|---|
| Authenticate | POST /v1/api/auth/login (version=2), POST /v1/api/auth/refresh; V4 SSO methods also described | Server-only integration session | Documented; dedicated least-privilege integration account not established. Do not store owner credentials in desktop, code, or logs. |
| Search and fetch leads | POST /v1/api/leads/list; GET /v1/api/leads/{leadId} | Existing opportunity / UCP identity, vendor attribution, stage and assigned producer | Documented; list page starts at zero, max 100. Validate filters/sorting and lastActivityDate precision on fixture before incremental sync. |
| Lead source | GET /v1/api/lead-sources; GET /v1/api/lead-source-categories | Canonical source reference and provider ID | Documented; prefer immutable source IDs over display strings. |
| Lead notes | GET /v1/api/leads/{leadId}/notes; POST to same resource | Source-linked, attributed evidence; future approved note write | Documented; no write in phase 1. |
| Lead tasks | GET /v1/api/leads/{leadId}/tasks; POST /v1/api/tasks/list; GET /v1/api/tasks/{taskId} | Read-only tasks and obligations in existing queue view | Documented; no second competing editable task master. |
| Pipeline / stages | Lead list includes workflow/stage and statuses; status update method documented | Read authoritative stage and state | Stage writes may trigger AgencyZoom lifecycle automation: explicitly prohibited in phase 1. |
| Opportunities / quotes | GET /v1/api/leads/{leadId}/opportunities; GET /v1/api/leads/{leadId}/quotes | Opportunity/quote metadata with provenance | These are AgencyZoom records, **not proof of APEX quote creation, carrier eligibility, or binding**. |
| Customer / policies | GET /v1/api/customers/{customerId}/policies and /ams-policies; customer management documented | Linked household/client and renewal evidence | Reconcile lead-to-customer conversion by supported identifiers, never fuzzy auto-merge. Carrier-record completeness not established. |
| SMS conversation list | POST /v1/api/text-thread/list | Find associated conversations | Documented; max pageSize 500 per thread search request. Contact ID association needs fixture verification. |
| SMS message detail | POST /v1/api/text-thread/text-thread-detail | Immutable messages, direction, timestamps, source, and STOP evidence | Documented; validate message IDs, ordering, deletion edits, and completeness before deriving SIGNAL facts. |
| Email conversation list/detail | POST /v1/api/email-thread/list and /email-thread/email-thread-detail | Source-linked thread evidence with safe HTML handling | Documented; HTML message bodies are untrusted, must not be treated as instructions. |
| Task creation/completion | POST /v1/api/tasks; PUT /v1/api/tasks/{taskId}/completed | Later controlled write-back after human approval | Not in phase 1; verify idempotency and cross-product side effects first. |
| Lead-vendor intake | AgencyZoom webhook or email lead integrations | AgencyZoom owns intake, CoverageFit consumes resulting record | Supported in AgencyZoom UI, not a new CoverageFit vendor-integration requirement. |
| Farmers Recommendation Engine intake | Farmers Lead Marketplace → AgencyZoom | Read and prioritize opportunity signals from the future agency | Supported UI/integration; not a direct Farmers carrier API. |
| Farmers APEX quote handoff | AgencyZoom UI quote links | Producer uses native AgencyZoom link/button for quoting | Supported AgencyZoom UI feature; no authorized third-party API/direct deep link verified. |
| APEX/Alta/Guidewire quote result sync | Not established | Future read-only carrier outcome evidence | **Unverified**; never infer quote completion or bound premium from a link click. |
| AgencyZoom outbound messaging via API | No general-purpose SMS sending endpoint validated in this audit | Keep sender/provider authority separate | **Unverified**; no sending or contact automations. |
| Change notifications | Vendor-to-AgencyZoom webhooks documented; AgencyZoom-to-CoverageFit push not verified | Bounded polling prototype unless approved event provider available | Do not conflate inbound vendor webhooks with outbound AgencyZoom event webhooks. |

## Existing CoverageFit constraints

- The existing AgencyZoom path is a **CSV/raw import and district pilot**, not a general live API adapter. Do not reuse its district-specific enrollment rules as generic future agency business policy.
- Current server/solo-desk-repository.mjs identity defaults to an explicit **Virginia Tam / Dylan Haysbert** workspace unless preview flags are set. server/producer-config.mjs is generated from present Virginia Tam producer branding/configuration. Do not use this default when introducing a future-agency connector.
- UniversalCustomerProfile already has customer, household and explicit opportunity links; existing cf_solo_opportunities, cf_solo_sources, and cf_solo_tasks anchor the shared producer workflow. **Extend and link** them; do not build a parallel CRM profile.
- Prospect Desk's reviewed evidence pipeline is source-linked and revision-bound. An API import is external evidence, not an automatically approved customer fact or permission to reach out.
- Current SIGNAL SMS code includes RingCentral conversation/ownership semantics, district pilot assumptions, and suppression/control states. Treat AgencyZoom evidence as a separate, clearly attributed input; never emit messages, grant consent, or override provider ownership as a side effect of reading.
- PR #42 delivered shared-profile production code but owner activation and real-world pilot acceptance are separate. A new integration must not enable or modify those flags.

## Proposed architecture: isolated, read-only adapter

Future-agency AgencyZoom (operational source) → bounded server-side AZ read adapter → allowlisted normalization and source-provenance ledger → existing CoverageFit UCP/opportunity links / source evidence → SIGNAL suggestion projections → Prospect Desk and producer Work.

1. **Fail closed by tenant and environment.** New future-agency workspace identifier must be explicit, non-default, never equal any Virginia Tam identifier. Separate test database/bindings are preferable. No access to current producer-token or production secrets. No AgencyZoom username/password in app clients.
2. **External identity registry.** Persist source_system=agencyzoom, future_agency_id, entity_type, external_id, canonical customer/opportunity ID, seen revision/hash and timestamps. A lead/customer with identical name/phone is not automatically the same person. Require explicit identity reconciliation for ambiguous links, lead conversions, multi-opportunity records, and conflicts. The unique key includes agency tenant and entity type.
3. **Minimal allowlist.** From lead payload accept operational identifiers, selected contact fields, permitted lead source, stage, producer assignment, relevant timing/renewal fields, and documented insurance needs only. Do not mass-copy DOB, driver's license, financial/credit, gender, sensitive classes, arbitrary notes, or carrier-only application attributes into SIGNAL. External free text and emails are untrusted data, never instructions.
4. **Read-only polling pilot.** Page list records within documented limits, use a conservative overlap for activity-date queries, dedupe by stable AgencyZoom ID and content digest, reconcile missing/deleted/converted records with explicit status, and advance checkpoints only after durable accepted processing. Handle 429 with bounded backoff; stop on authentication or tenant mismatch. Published global rate limit of 120/minute is a ceiling, not a target.
5. **Conversation evidence.** Paginate by thread and message; store attributed provider message ID, direction, UTC timestamp, provenance, body hash, and scoped evidence when permitted. Mark partial/incomplete histories clearly. STOP, DNC, and consent remain separately governed; messages do not create outbound authorization.
6. **No duplicate automations.** AgencyZoom continues lead delivery, workflow/stage automation and carrier quoting. CoverageFit only reads and recommends. Future writes require per-operation allowlist, approval and replay receipt, plus analysis of whether the AZ action triggers communication.
7. **Quoting transition.** Phase 1 shows 'Open in AgencyZoom to quote' only when an officially supported, verified destination can be constructed or an owner-maintained link is validated. Otherwise guide the producer to AgencyZoom UI manually. Do not fabricate account-specific URLs or invoke private APEX endpoints.

## Synthetic acceptance pilot

Use an isolated fixture server and synthetic records; **no login and no calls to AgencyZoom**.

- Lead V1: vendor source, assignment, stage, renewal date and multiple policy opportunities are projected to the correct prospective future-agency UCP/opportunity IDs.
- Lead V1 replay: repeated page or repeated call creates zero duplicate opportunities, sources, or reviewed evidence.
- Message thread: inbound/outbound IDs and UTC dates preserved; no contact caused; STOP is visible and suppresses any hypothetical future send.
- Lead becomes customer: keep source lineage and require explicit identity-link handling rather than auto-merging by email/phone alone.
- Two distinct future-agency fixture tenants with the same numeric AgencyZoom lead ID must not overlap; attempts to target current Virginia Tam workspace fail closed.
- Failure and restart: transient 429, expired JWT, unexpected schema, dropped page, partial thread, missing fields, and checkpoint replay produce no lost or double-counted records.
- Prospect Desk: reviewed source provenance appears next to facts, corrections preserve originals, unresolved gaps are labeled, no invented appointments/renewals.
- No outbound SMS/email, status changes, APEX launches, customer imports, migrations to production D1, or production feature flags.

## Smallest safe engineering sequence

**Stage 0 — docs (this PR):** API mapping + security/ownership decision; no runtime changes.

**Stage 1 — offline fixture adapter:** Add a typed, read-only AgencyZoom client facade behind a hard off-by-default configuration and stub HTTP transport, allowlisted normalizers, external identity mapping contract, and test fixtures. Keep any schema only in a separate reviewable PR, isolated to an explicit synthetic workspace; no production migrations or deployments.

**Stage 2 — owner synthetic acceptance:** Demonstrate lead/task/note/message ingestion and replay against fixtures with UCP integration and SIGNAL safety holds, measure freshness/coverage/dedupe and remaining UI handoff; approve continuation only after passing.

**Stage 3 — independently authorized future-agency test:** Requires a future-agency AgencyZoom account with usable API entitlement and permissions, Farmers/custom-system approvals, approved credential storage and retention, actual API paging/message contracts, and verified AgencyZoom-to-APEX UI handoff. No use of existing agency's data.

**Stage 4 — optional write scope:** Only after live read-only stability and separately authorized controls. Investigate task/note writes before stage changes; no SMS send or APEX automation without verified official authority.

## Gate summary and owner decision

- **GO:** Documentation-only architecture and fixture-driven read adapter design.
- **NO-GO:** Live API authentication; Virginia Tam data use; staging/prod data mixing; automatic messaging; AgencyZoom stage writes; direct APEX calls; representing AgencyZoom quote records as carrier results.
- **Open dependencies:** Future-agency credentials/entitlement; whether AgencyZoom offers least-privilege integration identities; full message/policy response quality; real-time event delivery; approved AgencyZoom record/deep links and APEX handoff semantics; Farmers data handling permissions; retention and support obligations.

This integration should preserve a future exit route from AgencyZoom by keeping SIGNAL and Prospect Desk independent of the underlying CRM adapter, while leaving AgencyZoom authoritative for vendor intake, stage automation and existing carrier handoff until an explicitly proven alternative exists.
