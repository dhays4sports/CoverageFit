# CoverageFit — Data Rights, De-identified Market Intelligence and Optional Direct Inquiries 1.0

**Decision:** PRINCIPAL-APPROVED PRODUCT BOUNDARY — 2026-10-13  
**Priority:** **P1 data-rights architecture** within Continuous Evidence Accumulation; **FUTURE OPTIONAL / NOT ACTIVATED** for either monetization path  
**Business:** CoverageFit + SIGNAL; no new independent BusinessUnit authorized  
**Related:** [Product North Star](../COVERAGEFIT_NORTH_STAR.md) · [Growth Roadmap 3.0](COVERAGEFIT-AUTONOMOUS-GROWTH-ROADMAP-3.0.md) · [Evidence Flywheel](CF-CONTINUOUS-EVIDENCE-1.0.md) · [Current State](COVERAGEFIT-CURRENT-STATE.md)

## 1. Principal's locked preference

The owner is interested **only** in these optional later possibilities:

1. **Aggregated, genuinely de-identified insurance market intelligence**, generated only from source data for which the relevant collection, analysis, aggregation and secondary/commercial use rights are actually established.
2. **Potential distribution or monetization of direct CoverageFit inquiries** (consumer-initiated inquiries originating directly with CoverageFit), **only if** separate disclosure, consumer authorization, agency/producer ownership, privacy, referral-compensation/licensing and recipient rules are satisfied.

**Not in scope:** Selling, renting, licensing, transferring or exchanging **individual enriched Prospect 360 profiles** or their accumulated source evidence, raw transcripts, notes, documents or longitudinal customer histories as a lead-resale product. No general resale of purchased/vendor-originated leads, district/AgencyZoom records, Farmers/agency-derived records or 408FARMERS leads based only on their presence in CoverageFit. The phrase "optional direct inquiries" **does not itself** authorize all first-party or affiliated-brand lead distribution; prove source/rights for the specifically named CoverageFit intake route.

**One business, one primary domain:** This is future product optionality within CoverageFit's evidence platform. Do not spin up another domain, marketplace, customer data broker or standalone entity without independently demonstrated business value and the owner's explicit decision.

## 2. Separate data rights from technical capability

Being able to deduplicate, retain, link or infer useful profile facts does not establish ownership, permission to monetize, third-party transferability, consent to contact, or eligibility to disclose for marketing. CoverageFit must retain or access the relevant source agreement, collection disclosure, original consent/permission context, agency/carrier restrictions, law/regulated-data category, purpose limitations, downstream-sharing constraints, retention/deletion obligations and withdrawal/restriction status.

**Proposed logical data-rights and transferability projection** (design contract; not an existing table or live grant):

- `source_event_id`, `workspace_id`, `data_controller_or_owner`, `source_family`, `data_rights_basis`, `original_collection_purpose`, `permitted_internal_uses`, `secondary_analytics_rights`, `external_distribution_rights`, `direct_CoverageFit_inquiry_provenance`.
- `recipient_scope`, `allowed_fields_or_data_classes`, `approved_purpose`, `applicable_agency_carrier_contract_gates`, `subject_notice_or_authorization_evidence_refs`, `revocation_opt_out_state`, `retention_class`, `effective_and_expiry_dates`, `rights_review_status`, `policy_version`.
- Derived `market_intelligence_contribution_eligible` and `direct_inquiry_distribution_eligible` must be **separate, positive, purpose-specific determinations**, recomputed after material rights changes.
- Default for third-party transfer or external monetization: **NOT_AUTHORIZED / NOT_ELIGIBLE**. `UNKNOWN` does not mean permission, and owning a domain or retaining a prospect record does not upgrade rights.
- Store permission and commercial rights separately from **SMS/call contact authority**; a right to publish a de-identified statistic does not authorize sending a message or disclosing individual identities.
- The proposed rights ledger is part of the **existing source/evidence governance spine**, not a new editable profile CRM or uncontrolled downstream copy.

## 3. Primary optional path — de-identified aggregate intelligence

**Illustrative products only, not yet authorized:** regional and sufficiently broad renewal-window trends, product interest composition, broad coverage questions, source mix and attrition, anonymized conversation-to-quote funnel trends, and other statistically reliable insurance demand patterns.

**Before any external release:**

1. Prove source-specific secondary/commercial use rights, agency/carrier contractual authority and permitted retention. Exclude any unapproved vendor, agency, carrier, or specially regulated information—even from aggregated outputs—where secondary use is not permitted.
2. Minimize source fields. Produce **statistics, rates, distributions or sufficiently coarse models**, not reconstructed record-level rows, detailed profiles, individual stories, transcript examples or pseudonymized customer tables.
3. Conduct documented disclosure-risk assessment using the **release context**, not just a name/phone removal rule: indirect and linkable quasi-identifiers, small cell sizes, rare insurance/property combinations, fine-grained ZIP/time data, longitudinal differencing, repeated queries, cross-dataset joins and likely recipients.
4. Apply a risk-appropriate combination of coarse geographic/time buckets, minimum cohort and minimum distinct-contributor thresholds, small-cell suppression (including complementary/differencing attacks), field exclusion, query/rate limits, randomized noise or differential privacy where justified, and output review. **Do not assume a fixed threshold is sufficient**; select and validate it for the dataset and threat model.
5. Prohibit re-identification and unauthorized onward use by technical controls and contractual obligations. Require access logging, versioning, permitted audience and revocation/correction processes, and retest after material dataset or model changes.
6. Clearly label statistical limitations, sample bias, coverage, cohort exclusions, source permissions and uncertainty. A small or nonrepresentative lead dataset is not automatically generalizable market intelligence.
7. Complete a counsel-led analysis of applicable California and other jurisdictional insurance privacy, consumer privacy, data broker, de-identification, contractual and commercial distribution rules **for the actual contemplated product and entity**. No legal conclusion is established by this roadmap.

**Release state:** `OPTIONAL_RESEARCH_ONLY` until a real economic case, qualified source rights, privacy engineering, legal review, specific release authorization and customer/agency governance are complete. **No exports or external aggregation-as-a-service are authorized now.**

## 4. Secondary optional path — direct CoverageFit inquiry introductions

This is **not** a general lead-resale or profile-trading permission. It may be evaluated later only for an inquiry initiated **directly with CoverageFit**, with verifiable collection source and first-party intent.

Requirements before any recipient transfer:

- Obtain legally sufficient, **specific, affirmative and documented authorization where required**, along with appropriate collection notices, scope, withdrawal and recipient/recipient-category disclosure. Don't assume a generic insurance quote form or consumer's interest in coverage grants third-party marketing or sale permission.
- Verify actual customer/agency/carrier ownership and contractor/agency restrictions; distinguish the CoverageFit consumer-facing route from 408FARMERS, imported district leads, existing policies and purchased lists. Do not silently repurpose those populations.
- Use **minimum necessary, approved inquiry fields only** for the requested introduction; never transfer an entire enriched Prospect 360 profile, SMS transcript, internal producer notes, external source records or speculative inferred characteristics by default.
- Confirm receiving party's licensing/authorized scope, purpose limitation, distribution/access controls, prohibition on further resale, permissible channel and independent contact authority. Separate sending/communication permission is still required.
- Obtain insurance counsel review of potential lead/referral compensation, producer licensing, agency/carrier rules, privacy/disclosure and the proposed fee structure **before accepting payment or activation**.
- Provide recipient auditability, customer correction/withdrawal where required, retention/deletion propagation and incident response. Treat permission status changes as live eligibility revocations.

**Release state:** `OPTIONAL_CONCEPT_ONLY`. No public intake copy changes, customer sharing, price/fee, agent directory, referrals, recipient list, API/feed or lead transfer currently authorized.

## 5. Canonical Evidence Flywheel integration

Private/source-linked Prospect Intelligence and de-identified aggregate statistics are **two deliberately separated outputs** of permitted evidence handling:

`Permitted evidence → source/identity/verification/retention governance →`
- `Private Prospect 360 / SIGNAL relationship decision (authorized internal purpose)`, OR
- `Subject to separate source-use rights + expert disclosure-risk review → genuinely de-identified aggregate statistics (future optional external use)`.

**No general-purpose inverse path** from aggregated insights back to identifiable prospects; **no resale path** from private Prospect 360. Optional direct CoverageFit inquiries require a **new, source-specific consumer-authorized sharing decision**, not a data dump from the private intelligence store.

**P1 build now:** add logical rights/provenance fields and ability to **fail closed** on monetization eligibility, retention class and secondary-use restrictions as part of source data contracts. This need not require a migration today. Neither production exports nor a market-intelligence dashboard should be built until sources and economics justify them.

## 6. Priority, evidence and decision gates

- **Today: P1 internal governance only.** Capture lawful source use, minimization, provenance, privacy and future rights optionality as part of `CF-CONTINUOUS-EVIDENCE-1.0`. Keep all external monetization functions disabled/nonexistent.
- **Later: de-identified market intelligence evaluation.** Only if accumulated source rights and sufficiently large, suitable data support useful statistics. Require separate privacy/contract/agency review, measurable external demand and a small read-only, nonpublic de-identification risk assessment before product planning.
- **Later still: optional direct CoverageFit inquiry program.** Requires owner-specific product approval, consumer authorization/user experience, destination agent and licensing/fee review, and independent contact eligibility. No presumption of unrestricted resale.

**Decision rule for future agents:** Do not prioritize a resale marketplace, unrestricted prospect export, data broker, individual profile API or new business merely because the Evidence Flywheel is accumulating valuable private customer evidence. Preserve **private relationships by default**, **genuinely de-identified aggregated intelligence as the preferred optional future product**, and **direct CoverageFit inquiries only as an independently authorized secondary possibility**.

## 7. Explicit non-authorization

This adoption changes **product direction and documentation only**. It does not authorize any PR merge, Production deployment or flag change, real customer export, lead purchase or sale, third-party disclosure, data resale, disclosure template, payment, referral compensation, new vendor/provider relationship, outreach, cloud migration or change in lawful retention. The accepted read-only hosted Preview remains unchanged and its 19/19 evidence does not certify these future data-sharing products.
