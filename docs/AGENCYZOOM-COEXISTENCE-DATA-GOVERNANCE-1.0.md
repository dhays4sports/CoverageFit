# AgencyZoom Coexistence & CoverageFit Data Governance 1.0

**Document:** CF-AZ-COEXISTENCE-DATA-GOVERNANCE-1.0  
**Status:** Canonical architecture and rollout gate  
**Date:** 2026-10-07  
**Repository:** dhays4sports/CoverageFit

## Purpose

CoverageFit is becoming the producer intelligence and attention operating layer. That does not yet make it the agency CRM or the authoritative system for every field.

This contract prevents CoverageFit from becoming a shadow CRM with divergent state while preserving long-term portability and the option to reduce dependency on AgencyZoom later.

The governing strategy is:

> **Do not disengage from AgencyZoom during Producer OS development. Make AgencyZoom replaceable through clean architecture rather than assuming it will be replaced.**

CoverageFit should earn additional operational authority only after the relevant data, synchronization, recovery, security and audit contracts are proven.

## System roles during coexistence

### AgencyZoom
Treat AgencyZoom as the current agency CRM / operational record for agency-owned lifecycle state that other staff and district processes depend on, including:
- CRM contact/opportunity lifecycle state;
- agency ownership / assignment where AgencyZoom is the current operational authority;
- campaign enrollment and campaign-state expectations;
- CRM-visible workflow state used by other agency users.

### CoverageFit
CoverageFit owns its own derived intelligence and governed producer state, including:
- Universal Customer Profile projections;
- evidence provenance and conflicts;
- Opportunity Priority;
- FIV;
- Signal Decision 2;
- Attention Priority;
- CoverageFit-owned summaries and known-answer ledgers;
- producer commitments;
- normalized customer commitments when supported by evidence;
- CoverageFit tasks / audit state;
- proposed next actions;
- Copilot suggestions and evaluation telemetry.

### External evidence/action providers
Provider-native facts remain provider evidence unless explicitly normalized into CoverageFit business state:
- RingCentral: calls/SMS provider records and transport receipts;
- Google Calendar: external event existence and provider event state;
- email provider: sent/received email evidence;
- carrier systems: quote, policy, bind and servicing evidence;
- AgencyZoom: CRM stage/campaign/assignment evidence.

A provider event must not be silently upgraded into a broader business conclusion. For example, a calendar event existing does not prove contact occurred, and an AI suggestion does not prove a customer fact.

## Field-level authority contract

Every durable field or projection added to CoverageFit must be classified as one of:

1. **EXTERNAL_AUTHORITY** — authoritative in a provider/CRM; CoverageFit mirrors with source/version metadata.
2. **COVERAGEFIT_AUTHORITY** — CoverageFit is the canonical owner.
3. **DERIVED_PROJECTION** — deterministic or model-assisted interpretation that can be rebuilt from evidence.
4. **PRODUCER_CONFIRMED** — becomes business state only after explicit human confirmation.
5. **COMPLIANCE_HARD_STATE** — STOP/DNC/consent/wrong-number/suppression/ownership restrictions that outrank prioritization and automation.

No new CRM-like write is allowed until its authority class and conflict behavior are documented.

## Read / derive / own / write / reconcile contract

For each AgencyZoom-integrated field or action, document:

- **READ:** exact AgencyZoom source and identifier;
- **DERIVE:** what CoverageFit may infer without changing AgencyZoom;
- **OWN:** which state CoverageFit may own independently;
- **WRITE:** whether CoverageFit may write back, and exact allowed values;
- **CONFIRM:** whether producer approval is required;
- **RECONCILE:** behavior if AgencyZoom changed after CoverageFit read it;
- **RECOVER:** how state can be rebuilt if either system is unavailable;
- **AUDIT:** source version, actor, timestamp, previous/new value and external receipt when applicable.

Default for new AgencyZoom interactions is **read-only or recommendation-only** until a write contract is specifically certified.

## Synchronization rules

- Never use last-write-wins blindly across CoverageFit and AgencyZoom.
- Never overwrite a newer external value with an older CoverageFit projection.
- Preserve external IDs and source versions.
- Treat stale writes as conflicts requiring reconciliation.
- Retain a visible distinction between observed AgencyZoom stage, recommended CoverageFit stage and confirmed producer action.
- Do not let CoverageFit campaign logic silently compete with an active AgencyZoom campaign.
- Ownership changes must be explicit and auditable.
- STOP/DNC/wrong-number/suppression state must fail closed across action surfaces.
- Provider timeout or uncertain response must not trigger blind retries.

## Portability and recovery

CoverageFit must be designed so that optionality increases over time.

Required tests:

**Agency continuity test:** if CoverageFit is unavailable, the agency can continue operating in AgencyZoom and provider systems without losing authoritative CRM state.

**CoverageFit portability test:** CoverageFit can export its canonical identities, evidence references, owned state, projections, commitments, tasks, action receipts and provider links in a documented machine-readable format.

**Rebuild test:** derived projections can be recomputed from retained evidence plus authoritative external snapshots without treating AI output as the only source.

The goal is not to replace AgencyZoom now. The goal is to prevent AgencyZoom from becoming an irreversible architectural dependency.

## Data minimization and classification

CoverageFit should collect useful, authorized, provenance-preserved data rather than all technically available data.

Before adding a new durable data class, define:
- purpose;
- authority class;
- sensitivity;
- minimum fields needed;
- retention period;
- allowed processors/providers;
- producer/customer visibility;
- deletion or tombstone behavior;
- export behavior;
- whether the data may be included in model context.

High-risk or unnecessary data should not be collected merely because it may be useful later.

## Retention and deletion program

Before broad production ingestion, establish explicit retention behavior for at least:
- raw imported lead payloads;
- SMS bodies and transcripts;
- call transcripts/recordings where used;
- AI prompts, structured outputs and rejected proposals;
- provider telemetry and failure diagnostics;
- closed/lost opportunities;
- duplicate records;
- uploaded declarations/proposals;
- audit logs;
- opt-out/wrong-number/suppression records;
- deleted customer data.

Compliance hard-state tombstones may need to outlive ordinary content so deletion does not accidentally re-enable contact. The exact retention schedule requires separate legal/compliance review before broad deployment.

## AI data boundary

The model is a replaceable reasoning provider, not a system of record.

For every model call:
- build context server-side from allowlisted fields;
- include only the minimum evidence required for the task;
- do not send unrelated UCP domains by default;
- do not expose credentials/secrets;
- validate structured output;
- require evidence for proposed facts;
- distinguish producer direction from customer evidence;
- retain bounded telemetry rather than raw provider failures when possible;
- preserve AI-off manual operation.

As richer calls/documents arrive, context minimization must be enforced in code rather than left to prompt wording.

## Environment and secret isolation

Before production expansion, maintain an explicit matrix for Local / Preview / Production covering:
- database/bindings;
- AI keys and budgets;
- RingCentral credentials and sender identity;
- webhook URLs and validation secrets;
- Google credentials;
- feature flags;
- queues/KV/cache if introduced;
- analytics/log destinations;
- external provider IDs;
- production-only action authority.

Preview must not be assumed isolated merely because its database is isolated.

Required gate: runtime secret-exposure review proving client bundles, logs, diagnostics and API responses do not expose server-only credentials or bearer material.

## Security / access-control baseline

Before CoverageFit becomes a primary producer operating surface:
- authenticate every producer action;
- authorize workspace/opportunity ownership server-side;
- make action endpoints fail closed;
- use idempotency for external writes;
- audit security-sensitive changes;
- avoid durable raw tokens in client-visible storage where a stronger pattern is available;
- validate inbound webhooks cryptographically/provider-specifically;
- protect against replay;
- rate-limit sensitive endpoints;
- separate read authority from write authority;
- maintain least-privilege provider credentials;
- test stale-context behavior for all mutating actions.

## AgencyZoom write-authority ladder

CoverageFit may expand authority only in stages:

**A0 — Observe:** import/read AgencyZoom evidence; no write.

**A1 — Recommend:** CoverageFit recommends a stage/task/campaign action; producer performs it in AgencyZoom and confirms.

**A2 — Prepared write:** CoverageFit prepares the exact AgencyZoom mutation and shows old → new; producer explicitly approves.

**A3 — Bounded write-through:** CoverageFit performs a small allowlisted set of idempotent, audited writes after approval, with stale-version conflict detection.

**A4 — Delegated automation:** only for narrow, proven flows with documented rollback and monitoring. Never inferred from AI accuracy.

Broad CRM replacement is not a milestone in this roadmap.

## CONTROL / experiment policy during production crunch

Keep cohort capability and existing CONTROL records intact for experimental integrity.

Operationally, new CONTROL enrollment may be paused or reduced during high-production periods when the opportunity cost of withholding the improved workflow is material. Do not retroactively relabel historical CONTROL records. Future experiments should prefer smaller or time-boxed holdouts unless a larger holdout is justified.

## Exit criteria for this gate

Do not increase CoverageFit's CRM-like authority until:
- field-authority matrix exists for the next write surface;
- AgencyZoom conflict/reconciliation behavior is tested;
- provider/environment matrix is complete;
- runtime secret-exposure review passes;
- minimum retention/deletion policy is documented;
- export/recovery path exists for CoverageFit-owned state;
- STOP/DNC/wrong-number/suppression precedence is verified;
- stale-write and duplicate-action tests pass;
- audit receipts are sufficient to explain what changed, why and by whom.

## Strategic test

CoverageFit succeeds if it becomes the producer's best place to decide what needs attention without forcing the agency to trust an ungoverned second CRM.

The long-term option remains open:

> **CoverageFit may eventually make AgencyZoom unnecessary, but it must first make AgencyZoom replaceable.**
