# CoverageFit engineering and agent guidance

**Owner-approved strategic priority (2026-10-13):** CoverageFit + SIGNAL is an **evidence-driven autonomous insurance acquisition and relationship operating system**. Its primary business outcome is **more genuine useful, compliant conversations and verified written premium with fewer producer minutes and less owner attention**.

## Read these canonical documents before prioritizing or writing work

1. [CoverageFit North Star](COVERAGEFIT_NORTH_STAR.md) — product constitution and long-term agency/consumer intelligence vision.
2. [Autonomous Insurance Growth Roadmap 3.0](docs/COVERAGEFIT-AUTONOMOUS-GROWTH-ROADMAP-3.0.md) — **HIGH-PRIORITY economic execution governor**, P0–P6 gates and named engineering work packages.
3. [Continuous Evidence Accumulation / CF-CONTINUOUS-EVIDENCE-1.0](docs/CF-CONTINUOUS-EVIDENCE-1.0.md) — **P1 FOUNDATIONAL, CROSS-CUTTING evidence flywheel**, admissible events, fact assertions, current Profile, identity/retention and SIGNAL multi-turn feedback.
4. [Master Roadmap 2.0](docs/COVERAGEFIT-NEAR-TERM-PRODUCER-ROADMAP-1.0.md) — accepted safety/release dependencies and implementation sequence.
5. [Current State](docs/COVERAGEFIT-CURRENT-STATE.md) — factual status, verified refs and unresolved gates. Always inspect current GitHub refs; recorded snapshots may age.
6. [Producer Command Center UX](docs/COVERAGEFIT-PRODUCER-COMMAND-CENTER-UX-1.0.md) and [Operational Gates](docs/COVERAGEFIT-SIGNAL-OPERATIONAL-GATES-1.0.md) — existing human-facing scope and hard safety gates.

**Priority order:** P0 reconcile accepted Preview and PR #7 → #16 release effects; **P1 foundational CF-CONTINUOUS-EVIDENCE-1.0 (shared source/event → typed assertion → conflict/time reconciliation → versioned Prospect Memory → SIGNAL feedback)**; P1 source-traceable high-volume acquisition; P1 durable source/identity/renewal memory; P1 stateful no-send SIGNAL qualification SHADOW; P2 only when separately authorized actual provider closed-loop canary and SIGNAL/CONTROL economic pilot; P3 measured permissioned automation scale.

## Non-negotiable implementation constraints

**DATA MONETIZATION BOUNDARY — principal-locked future optionality:** Enriched identifiable **Prospect 360 profiles, SMS histories, agency-owned imported contacts and long-lived insurance facts are NOT a lead resale product**. The only later options worth preserving are **genuinely de-identified aggregate market intelligence** (only from rights-qualified sources after robust reidentification/privacy review) and **possibly specifically authorized direct CoverageFit-originated inquiries** (separate consumer consent/agency/licensing/referral-review gate). [Canonical requirements](docs/CF-DATA-RIGHTS-AND-MARKET-INTELLIGENCE-OPTIONAL-1.0.md). P1 evidence work should track **rights, ownership, source, purpose, retention and default-deny transferability**, but future commercialization remains **OPTIONAL/NOT ACTIVATED**. Do not create individual profile APIs, data resale markets, pseudonymized-row exports, fees, recipient feeds or new BusinessUnits. No actual data export, resale, consumer/agent outreach or monetization authorization is implied.

- Continue existing code; **no replatform, second CRM, shadow prospect database, competing messaging gateway, duplicate master roadmap, unnecessary repo/domain or ungrounded new feature**.
- Preserve STOP, opt-out, wrong number, district CONTROL, TEST exclusion, identity conflict holds, source provenance, positive message/contact permission, sender/provider and agency/carrier restrictions and producer takeover. **Never remove suppression to satisfy a test.**
- Purchased/vendor leads may be imported/intelligently assessed with appropriate data rights; acquisition itself **does not grant** texting authority. Respect RingCentral restrictions on purchased/third-party-generated list SMS; never launder provenance or route around provider rules.
- Producer Command Center read-only Preview was operator-attested **19/19 hosted and 4/4 visuals** at runtime head `d8083570c0425371c67b1bae74813ec6c50a9be6`; this is **not** live RingCentral, Production, premium improvement or live automation certification.
- **No merges, Production deployments, Cloudflare/D1 changes, provider mutations, real customer outreach, data purchases, AgencyZoom/Calendar writes or autonomous sends without explicit specific approval.** GitHub merges may auto-trigger Cloudflare Production publish: inspect actual effect before requesting any merge authorization.
- Safe default: research, deterministic tests, synthetic replay, no-send SHADOW, scoped draft PRs, reproducible evidence, manual fallback. No assumption that a draft, prompt, CI or document grants external-action authority.
- **Continuous Evidence Accumulation — P1 contract:** Every *permitted* import, reply, producer correction or actual outcome enters a **single source-linked evidence spine** only with valid provenance and retention rights. Extract typed assertions without silently verifying them, hold uncertain identities and conflicts, derive a repeatable versioned current Prospect Profile, and have SIGNAL SHADOW consume/refresh it each meaningful cycle. Ask no redundant question; don't infer contact authority. Keep consent/STOP/CONTROL, source correction, expiry/deletion propagation and cross-tenant isolation as independent hard gates. The current read-only Prospect 360 **does not yet implement** this persistent flywheel.
- **Principal Attention Sovereignty:** automate the routine engineering work, consolidate owner approval into one consequential release packet per gate; don't require repeated existing Preview SQL/Chrome tests for an unchanged tested runtime.
- Each engineering change must identify **one measurable bottleneck** (useful conversations, verified premium, producer minutes, source cost, verified renewals or an evidenced safety/reliability blocker), the exact change, evidence, authority level, rollback and next justified gate. Do not confuse tests/clicks/sends with real economics.

## Immediate working direction

Complete bounded merge-trigger/deployment impact review for PR #7 → aggregate PR #16 without merging; concurrently implement independently reviewable synthetic/test-only steps for **CF-ACQUISITION-INTELLIGENCE-1.0**, **CF-PROSPECT-MEMORY-1.0** and **CF-SIGNAL-AUTONOMY-SHADOW-1.0** using one identity/evidence spine. Do not stall no-send acquisition and memory development on the unfinished RingCentral webhook/provider canary. Measure actual value before increasing volume, autonomy or spending.

**Rule:** The Command Center is the producer control surface. The product is the **autonomous acquisition-to-qualified-conversation-to-premium operating loop**.
