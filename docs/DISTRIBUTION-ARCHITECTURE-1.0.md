# 408FARMERS distribution consolidation

408FARMERS attracts, contextualizes, attributes, establishes trust and routes. CoverageFit remembers, asks, interprets, prioritizes, continues, hands off and measures. AgencyZoom remains CRM; RingCentral remains transport. Dylan’s public title remains Insurance Producer.

## Release boundary

This release implements a **buyer certification candidate**, not a completed public route migration. `/buyer/` and every other existing campaign URL remain unchanged. The unlinked, noindex `/buyer/continue.html` candidate posts to CoverageFit `/api/distribution/entry` and continues at `/check-in/`. Only buyer is accepted by the new entry endpoint. No broad Signal activation, Cloudflare configuration, migration, CRM sync, message send or appointment occurs through this path.

Do not replace the active buyer page or migrate other routes until the hosted cross-domain flow and producer receipt are certified. A passing local SQLite projection test is not a hosted producer-receipt canary.

## Route migration matrix

Full HTML and dynamic route inventory: `DISTRIBUTION-ROUTE-INVENTORY-1.0.md`. Counts there are repository references, not traffic. Email, live SMS histories, printed QR/flyers, partner bookmarks, social posts and search traffic were not available for exhaustive dependency verification.

| Route | Current purpose / logic | Acquisition value | Overlap | Target / mode | Attribution | Dependencies / SEO / risk | Implementation |
|---|---|---|---|---|---|---|---|
| `/` | Local hub plus intake | Brand, phone, campaign navigation | Intake | KEEP SHELL, hybrid local hub | Existing preserved | Many links; retain canonical root; medium | Unchanged |
| `/buyer/` | Partner buyer appointment-first form | High: realtor campaign and QR | Discovery/session/handoff | KEEP SHELL → CoverageFit buyer-aware check-in | Candidate POST tested | Buyer referral, appointment promises, thank-you, form fallback; high | Candidate only |
| `/condo/` | Condo appointment-first form | HOA/referral relevance | Intake/session | KEEP SHELL → canonical review | Existing preserved; candidate not activated | Must preserve HO-6, rental/landlord, association distinction; high | Gated |
| `/home/` | Home review/appointment form | Local campaign and QR | Intake overlaps CF Home | KEEP SHELL → canonical review | Existing preserved | Home landing variants and QR/deep links; high | Gated |
| `/auto-bundle/` | Shared home/auto appointment form | Bundle campaign | Intake | KEEP SHELL → shared review | Existing preserved | Bundle context and existing appointments; medium | Gated |
| `/auto/` | No established public registry path | Unverified | Preview only | VERIFY before introducing shell | Preview retained | Do not invent a redirect for an unverified URL | Not migrated |
| `/tech/` | Professional appointment flow | Affinity campaigns | Intake/session | KEEP SHELL → evidence-driven review | Audience only, never scoring | Profession must remain unconfirmed until stated; medium | Gated |
| `/teachers/` | Professional intake | Affinity campaigns | Intake/session | KEEP SHELL → evidence-driven review | Same | Form submission/thank-you compatibility; medium | Gated |
| `/healthcare/` | Professional intake | Affinity campaigns | Intake/session | KEEP SHELL → evidence-driven review | Same | Form submission/thank-you compatibility; medium | Gated |
| `/engineers/` | Professional intake | Affinity campaigns | Intake/session | KEEP SHELL → evidence-driven review | Same | Form submission/thank-you compatibility; medium | Gated |
| `/life/` | Application, conversion and queue | Specialized campaign | Shared primitives only | SPECIALIZED | Existing preserved | `_worker.js` life queue/sensitive storage/conversion; high | Retained |
| Business/commercial | Preview and CF specialized assessment | Commercial audience | Not personal-lines equivalent | SPECIALIZED | Existing preserved | Business need/type; no established 408 public registry path | Retained |
| Thank-you routes | Form fallback completion | Compatibility | End-state messaging | DEPRECATE after parent cutover | Existing preserved | Saved campaign/form links; noindex retained | None removed |
| `/signal-preview/*`, `/signal-lab/*` | Certification/development | No public campaign need | Browser state/presentation | DEV ONLY, retain dependency | Unchanged | noindex; no root/buyer navigation links found | Retained |
| `/local/*`, `/neighbor/` | Merchant/referral distribution | Active local/referral value | Separate program | SPECIALIZED / VERIFY | Existing preserved | Merchant/referral tokens, external links unknown | Retained |

No redirects or destructive deletions are introduced. The candidate is not added to the sitemap or public navigation. A future promotion replaces the buyer implementation at its existing canonical URL, after certification; it does not send all traffic to CoverageFit’s generic root.

## Canonical responsibility map and duplicate-logic audit

| Component | Current authority / decision |
|---|---|
| CoverageFit `signal-decision-core.mjs` | Canonical anonymous question/decision selection. Reused unchanged by the candidate. |
| Opportunity Priority, FIV, NBA | Existing separate objects; weights, thresholds and action vocabulary unchanged. |
| 408 `signal-decision-remote.js` | Transport to CoverageFit production; retain while preview clients depend on it. |
| 408 `signal-decision-local.js` | Foundation selector used by Signal Lab, not an independent Opportunity Priority engine. Retain dev dependency. |
| 408 `signal-session.js`, route shells | Browser answer/resume/presentation responsibilities to retire route-by-route after canonical migration. Not removed in this candidate release. |
| 408 `appointment-first-intake.js`, professional forms, thank-you | Active identity/appointment compatibility. Do not delete until each route’s promises and downstream consumers are replaced. |
| Existing CoverageFit PVX review/appointment APIs | Active consumers retained. Generic bootstrap can recover a lead and schedule CRM sync, so it is not used as a no-side-effect anonymous Signal bootstrap. |
| New distribution journey | Existing `pvx_records` / `pvx/web-journey/` storage, canonical Signal selector, existing lead normalization/upsert and producer projection. No third database or separate opportunity model. |
| Consumer roots | 408 local brand hub; CoverageFit professional review/trust explanation. No duplicated campaign directory added to CoverageFit. |

## Handoff and attribution contract

`coveragefit-distribution-v1` is a bounded anonymous POST body. The browser sends no identity, score, cohort or internal opportunity ID. The endpoint uses exact origins, rate limiting, a cryptographic 32-byte server token, a Secure/HttpOnly/SameSite=Lax cookie, seven-day expiry and no-store/no-referrer/noindex responses. Neither PII nor the session capability is placed in a navigation URL.

Fields: version, entry, opaque bootstrapId, original occurredAt, attribution, permitted canonical evidence, knownContext, optional contactChoice and coded referralContext. The server derives source/provider/route/audience from the adapter registry; approved source-family taxonomy is reused through `deriveSourceFamily`. Campaign ID/variant, partner ID, creative and UTM fields use the existing anonymous Signal validator. Arbitrary fields and personal-looking values are rejected. Browser helper forwards only the allowlist from the existing CoverageFit launcher attribution reader.

The current adapter is 408FARMERS-specific; the Signal decision engine is not. Future distribution clients need an adapter/origin registration, not new scoring. Life and commercial are deliberately excluded from this personal-lines candidate.

Buyer CTA selects Home as product. It does **not** claim the visitor is purchasing, owns a home, is shopping now, wants a bundle, or consents to contact. Affinity routes in the contract keep occupation only as audience attribution; they cannot inject `professionalProgram` into scoring evidence. They remain disabled at the entry endpoint.

Already collected canonical evidence is hydrated before question selection. The contract also retains explicitly supplied housing, occupancy and bundle-interest enums plus contact choice. Closing date uses the existing canonical Signal field. Imported facts are not erased by Back; only the latest answer from this execution is removed. Permission is collected explicitly on CoverageFit; this candidate does not migrate an existing identified/consented appointment session. Those legacy sessions continue through their existing handoff until a separate compatibility adapter is certified.

Bootstrap retries reuse one opaque capability. A mismatched payload under the same bootstrap key is rejected rather than silently losing new attribution/evidence. Answer updates compare the prior stored JSON atomically, rejecting stale or concurrent revisions. Invalid options and answers to a different question are rejected. Reopening on the same device resumes current evidence; abandoning never creates a negative signal or reminder.

## Producer and measurement continuity

Anonymous completion alone creates no lead/opportunity. An explicit contact request freezes the contact choice and permission, upserts one lead checkpoint derived from the same journey, and projects through existing Solo Desk source linking. Failed producer projection remains pending; retry uses the same checkpoint. No AgencyZoom, calendar, email, SMS or provider call is invoked.

The lead retains route, source key/family, campaign/variant, partner, UTM, audience, original landing timestamp, answer timestamps and provenance. Producer source summary retains the distribution evidence; known housing/bundle/occupancy fields are shown in the existing known-evidence panel. Existing opportunity attribution connects subsequent governed outcomes to the source. No exposure, spend, quote, bind or premium outcome is fabricated by this release.

Explicit first-party provenance is saved with the lead. No SMS conversation is created, and no ownership or suppression state is overwritten. Existing DISTRICT_SIGNAL, DISTRICT_CONTROL, WEB_DIRECT and OTHER population logic is unchanged. Do not derive ownership merely from phone transport.

**Signal Continue limitation:** current production Continue creation intentionally denies WEB_DIRECT pending an exact first-party relationship adapter. This release preserves the same canonical source/journey identity for that future adapter; it does not claim WEB_DIRECT Continue is already certified and does not create a parallel intake to bypass the gate.

## Specialized exceptions and deprecation plan

Life remains specialized because `_worker.js` owns application initialization, conversion events, producer queue and sensitive-record handling. Commercial keeps its business need/type and assessment/report contracts. Local merchant/referral routes remain active, not insurance-intelligence migration targets.

After buyer certification: promote the shell at `/buyer/`, retain old appointment/thank-you destinations for existing sessions, verify old campaign links, then select the next route. Condo must first preserve occupancy/HO-6/rental distinctions; affinity routes must preserve campaign context without invented occupation. Only after callers are removed may shared legacy presentation/session files be retired. No code is deleted merely because another route no longer uses it.

## QA and rollback gates

- Local: contract validation; no PII/authority injection; attribution; ZERO-REPEAT; Back/resume; stale revision rejection; early stop; explicit permission; channel scope; durable SQLite producer projection; idempotent bootstrap/contact retry; expiry/origin rejection; no SMS creation.
- Regression: full CoverageFit suite includes district isolation, RAW governance, ownership, review-first SMS, Continue and measurement. Full 408 test suite preserves Signal routes, remote decision, CSP, life and Home compatibility.
- Hosted before promotion: buyer candidate CTA → same CoverageFit session → two/three useful answers as needed → explicit internal contact request → one WEB / DIRECT producer record → correct origin/campaign/partner → no provider send. Verify mobile layout, back, resume and delayed network retry.
- Repeat affinity/condo/life/old-link canaries only when their routes change. Local contract coverage is not a claim of migrated hosted routes.
- No Cloudflare mutation or migration is required by the source changes. Existing D1 binding/schema and automatic Pages build must be observable before claiming hosted readiness. Migration 0019 is not reapplied.
- Rollback: keep the active buyer page until certification. Candidate code can be reverted independently; newly stored records are additive and must not be deleted. Retain all existing production rollback refs. Before a public cutover, record exact pre-cutover main SHAs for both repos.

## Readiness

Local candidate: PASS with limitations. Broad consolidation and active buyer cutover: BLOCKED pending hosted receipt and compatibility certification. Remaining overlap is deliberate until those gates pass; this document does not label a staged candidate as a completed migration.
