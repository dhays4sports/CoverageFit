# CoverageFit Security & Data Expansion Gate 1.0

**Document:** CF-SECURITY-DATA-GATE-1.0  
**Status:** Canonical pre-expansion gate  
**Date:** 2026-10-07  
**Repository:** dhays4sports/CoverageFit

## Purpose

CoverageFit is moving from a bounded producer tool toward a higher-volume intelligence and attention operating layer. Before materially expanding ingestion, external writes, or multi-producer use, the current security and data boundaries must be explicit and testable.

This gate complements:
- `AGENCYZOOM-COEXISTENCE-DATA-GOVERNANCE-1.0.md`
- `COVERAGEFIT-NEAR-TERM-PRODUCER-ROADMAP-1.0.md`
- `COVERAGEFIT-CURRENT-STATE.md`

The objective is not to freeze development. It is to prevent a useful solo producer system from silently becoming a higher-risk multi-system platform without equivalent controls.

## Current audit findings

### Strong current controls to preserve

The current repository already contains several important fail-closed patterns:

- server-side RingCentral client credentials/JWT use;
- masked sender information in status surfaces rather than raw credentials;
- same-origin checks on mutating Solo Desk requests;
- bearer authentication on producer APIs;
- endpoint body-size limits;
- API responses with private/no-store behavior and restrictive response CSP;
- RingCentral webhook payload-size limits;
- webhook authentication through configured validation token or provider API read-back;
- webhook event deduplication and per-conversation locking;
- explicit outbound registration and provider-message identity;
- duplicate/replay controls;
- SMS consent / STOP / wrong-number suppression precedence;
- Copilot stale-context protection;
- bounded Copilot telemetry rather than raw provider failures;
- model requests with minimized structured context and local validation;
- AI-off/manual fallback;
- explicit PVX customer deletion and expiry purge support for that journey store.

These are real architectural strengths and should remain invariants.

## Priority finding: producer authentication

### Current state

Producer APIs use a single configured `COVERAGEFIT_PRODUCER_ACCESS_TOKEN`. The browser stores that bearer credential in `sessionStorage` and sends it on producer API requests.

The server compares the bearer value with a timing-safe equality check and refuses access when the configured token is absent or too short.

### Risk

This model is reasonable for a bounded solo-operator Preview, but it has important limits:

- the credential is long-lived rather than an expiring session;
- possession of the token is the producer identity;
- there is no per-user/session identity or role model;
- browser JavaScript can read the token from `sessionStorage`;
- a successful same-origin script injection could therefore obtain producer authority;
- revocation is coarse: rotate the shared key rather than revoke one session/user;
- audit identity is effectively environment-configured operator identity rather than independently authenticated user identity.

### Required direction

Before multi-producer access, broad production lead ingestion, or increased external write authority, migrate toward:

- per-user authentication;
- short-lived server-validated sessions;
- `HttpOnly`, `Secure`, `SameSite` cookies where compatible with the deployment model;
- explicit logout/revocation;
- server-side workspace/record authorization;
- actor identity on audit events;
- role/permission separation for read, draft, send, config and destructive actions;
- CSRF defenses appropriate to cookie-authenticated mutating requests;
- no reusable long-lived producer secret exposed to browser JavaScript.

Do not block the current bounded single-producer Preview solely on this finding. Do block multi-producer or materially expanded production authority until the replacement contract is designed and certified.

## Browser surface hardening

The Producer Workspace currently receives the global security headers plus noindex behavior, but does not yet have a workspace-specific restrictive CSP comparable to the existing `/signal-continue` surface.

Before broad production use:

- inventory inline script/style requirements for every producer page;
- establish a restrictive CSP for the primary Producer Workspace;
- keep scripts/styles first-party unless a reviewed dependency requires otherwise;
- restrict `connect-src` to necessary origins;
- keep `frame-ancestors 'none'` for authenticated producer surfaces where embedding is not required;
- maintain no-store/no-referrer behavior for authenticated views where practical.

Do not deploy a CSP blindly across legacy `/agent/*` pages without compatibility testing.

## Secrets and configuration

Secrets must remain server-only.

Critical categories include:

- `COVERAGEFIT_PRODUCER_ACCESS_TOKEN`;
- RingCentral client secret and JWT;
- RingCentral webhook validation/conversation hashing secrets;
- OpenAI API keys;
- Google OAuth/service credentials;
- cron/maintenance secrets;
- any AgencyZoom or webhook credentials;
- database/binding identifiers where disclosure creates operational risk.

Requirements:

- no secret values in repository files, client bundles, rendered HTML, API diagnostics or logs;
- status APIs return only readiness/masked metadata;
- separate Preview and Production credentials when provider capabilities allow it;
- rotate credentials after suspected exposure;
- least-privilege provider identities;
- document owner, purpose, scope and rotation procedure without storing the secret itself.

The source-only inventory generator at `scripts/environment-contract-inventory.py` exists to enumerate expected names without reading deployed values.

## Environment isolation

Maintain a Local / Preview / Production matrix for every mutable provider and binding:

- D1/database;
- RingCentral app/JWT/from-number/webhook/subscription;
- AI provider/key/model/budget;
- Google Calendar credentials/calendar IDs;
- AgencyZoom/webhook configuration;
- queues/KV/R2 if used;
- analytics/log destinations;
- feature flags;
- cron/maintenance credentials.

A separate Preview D1 is not sufficient evidence that all other providers are isolated.

## RingCentral inbound security

Current code has good baseline behavior:

- validates payload size;
- accepts the subscription validation handshake without processing an event;
- validates the configured developer token when present;
- otherwise verifies the referenced message against RingCentral before accepting the event;
- deduplicates provider event IDs;
- serializes conversation processing;
- preserves outbound registration identity.

Before enabling the Preview inbound webhook and then Production:

- configure an environment-specific webhook URL and validation secret;
- certify subscription ownership and renewal behavior;
- replay the same event and prove deduplication;
- test forged validation token rejection;
- test no-token forged event rejection through provider read-back;
- test wrong business number / malformed message rejection;
- test provider timeout/recovery without duplicate processing;
- confirm logs do not contain message bodies beyond intentionally retained conversation evidence.

## AI data boundary

AI remains a reasoning processor, not authority.

Before adding calls/documents/full UCP context:

- define an allowlisted context builder for each capability;
- include only fields required for the task;
- keep unrelated household, property, financial or document context out by default;
- preserve source/evidence references;
- locally validate model-proposed facts;
- distinguish customer evidence, producer direction and derived projection;
- never let model output create contact permission or underwriting/binding authority;
- prefer bounded structured telemetry over raw prompt/output retention where operationally sufficient.

## Retention and deletion

CoverageFit already has explicit deletion/expiry handling for the PVX checkpoint journey. That is not yet a platform-wide retention policy.

Before broad ingestion, define retention classes for:

- raw AgencyZoom lead imports;
- SMS transcripts;
- RingCentral event/audit records;
- Copilot requests/results;
- failed/rejected AI proposals;
- call transcripts/recordings if introduced;
- uploaded insurance documents;
- closed/lost opportunities;
- duplicate records;
- producer notes;
- provider action receipts;
- compliance hard-state tombstones.

Deletion must not accidentally erase the minimum suppression state needed to prevent renewed contact after STOP/DNC/wrong-number events.

Exact legal/compliance retention periods are outside this repository audit and require agency/legal review before they are treated as policy.

## AgencyZoom / split-brain protection

Security includes integrity, not only confidentiality.

Before CoverageFit writes CRM state:

- preserve AgencyZoom's external ID/version;
- distinguish observed CRM state from CoverageFit recommendation;
- detect stale writes;
- never use blind last-write-wins;
- require an authority contract per writable field;
- ensure one automation family has one active owner;
- preserve an audit receipt for every external write;
- keep rollback/recovery procedures.

## Data-volume expansion gate

CoverageFit may ingest larger lead volumes before it gains more action authority, provided the ingestion path is:

- server-side validated;
- deduplicated by stable source identity;
- provenance-preserving;
- bounded in batch/body size;
- fail-closed on ambiguous identity;
- separated from contact permission;
- separated from automation enrollment;
- observable through import/result counts;
- recoverable/exportable.

This means raw-lead intake and Attention work do not need to wait for full CRM replacement or calendar automation.

## Exit criteria before broader production authority

Required before multi-producer access or materially expanded autonomous/external writes:

1. per-user/session auth design implemented and tested;
2. current-tree environment inventory generated and reviewed;
3. Preview/Production matrix completed;
4. runtime secret-exposure review passes;
5. producer workspace CSP/browser-hardening plan certified;
6. RingCentral inbound webhook security certified;
7. platform retention classes documented;
8. AgencyZoom field-authority/write contract present for any new CRM write;
9. stale-write, replay and duplicate-action tests pass;
10. fresh full-suite test evidence exists for the reconciled branch.

## Operating decision

For the current phase:

> **Continue building read-only intelligence, governed ingestion, durable evidence and Attention. Hold expansion of identity-sensitive multi-user access and new external write authority until this gate is satisfied.**
