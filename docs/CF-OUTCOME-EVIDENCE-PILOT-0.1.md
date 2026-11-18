# CF-OUTCOME-EVIDENCE-PILOT-0.1 — California restaurant insurance reviews

**Prepared:** 2026-10-20 PT  
**Observation window:** 2026-10-21 through 2026-11-03 (14 calendar days; Pacific Time)  
**Pending-outcome review:** through 2026-11-10 where practical  
**Status:** MANUAL PILOT PREPARED — **no cohort enrolled or real customer outcome independently verified by this document**  
**Mode:** Observation of ordinary, authorized producer work; documentation and empty template only. No new runtime, hosted experiment, autonomous sending, CRM mutation, carrier action, provider setup, or production activation.

## Business decision to test

**Customer job:** convert authorized restaurant-prospect interactions into genuinely useful, qualified insurance reviews that take place with a decision-maker, ultimately supporting accurate suitable quotes and bound business without wasting scarce producer hours.

**Pilot question:** Can a compact, explicitly evidenced outcome definition reliably distinguish attempts, appointments, completed qualified reviews, and actual insurance business—at no more than 30–60 seconds additional producer administration per worked opportunity?

This is a measurement-quality exercise, **not** a claim that CoverageFit autonomously booked a meeting or lifted conversion. Prior documents already establish outcome-first review and producer-burden targets:
- `docs/CF-OUTCOME-FIRST-INTELLIGENCE-1.0.md`
- `docs/SIGNAL-PILOT-MANUAL-WORK-AUDIT.md`
- `docs/SIGNAL-PILOT-MEASUREMENT-HARDENING-1.0.md`
- `docs/SIGNAL-NORTH-STAR-1.0.md`

Do **not** redefine or reassign existing district CONTROL/SIGNAL cohorts to this study. SIGNAL's existing experimental metrics remain authoritative for their own use case. This pilot is a separate manual observational log.

## Scope, inclusion and denominator

1. Record the **first 20 consecutive California restaurant prospect work episodes** meaningfully worked by the producer inside the observation window, up to the window end. Do not cherry-pick positive replies; calls without human contact, declined appointments, failures and unknowns stay counted.
2. A work episode starts at an actual ordinary producer prospecting/contact boundary (not every dial or auto-generated lead). One stable pseudonymous `case_key` per prospect episode; repeated touches update the same row, not the denominator.
3. Existing inbound/referral and outbound contacts can be classified by their actual source. Source family stays descriptive, not a causal treatment arm.
4. A business with alcohol revenue **33% or more** is treated as ineligible under the stated Farmers commercial restaurant guideline. **Strictly less than 33%** is the prequalification threshold, subject to full carrier and licensed producer review. Unknown alcohol mix is UNKNOWN, not presumed eligible.
5. Out-of-scope prospects, revoked permission and other restrictions are logged accurately as not meeting the outcome. No contact is authorized just because a person appears in the study.
6. Do not access new consumer data just for pilot eligibility, duplicate AgencyZoom records or collect protected/demographic proxies. Never infer marketing consent from a source label.

**What the denominator means:** consecutive worked episodes (not all purchased leads, all missed calls, all exposures, or the whole market). It must be disclosed in every result.

## Three levels of evidence

**L1 ACTIVITY_RECORDED:** an attempt, response, meeting suggestion or CRM status; no verified result.

**L2 EXECUTION_EVIDENCED:** credible contemporaneous calendar/CRM/prospect/provider records show the asserted step took place. A producer-only assertion without corroboration remains limited and is labeled appropriately.

**L3 OUTCOME_ACCEPTED:** producer reviews sufficiently supported evidence that:
- contact was permission-appropriate and with an actual decision-maker;
- restaurant is relevant and prequalified to the extent necessary for this review, including applicable alcohol revenue threshold of strictly below 33%;
- meeting was agreed to **and held**, not merely proposed/booked;
- uncertainties, contradictory evidence and authorization constraints have been resolved or expressly disclosed.

The agent's own `success=true` output or an uncorroborated draft cannot reach L3. A held meeting is not a quote, a quote is not a bound policy, and bound premium requires authoritative confirmation. Separately record those downstream milestones. No monetary settlement is implied.

## Lightweight measurement record

File: `docs/CF-OUTCOME-EVIDENCE-PILOT-0.1-TRACKER.csv` is an **empty schema template, not a dataset**. Keep the working log in an agency-approved restricted location. Do not commit filled-in customer rows, names, phone numbers, emails, street addresses, unredacted provider IDs, exact calendars or customer-specific URL tokens to GitHub.

| Field | Semantics |
|---|---|
| `case_key` | Locally assigned opaque pseudonym, e.g. R-001; crosswalk remains outside repo |
| `work_date_pt` | Date ordinary producer work first occurred, YYYY-MM-DD |
| `source_family` | e.g. outbound, referral_partner, inbound, other; not inferred attribution |
| `alcohol_share_eligibility` | LT33 / GE33 / UNKNOWN / NA; GE33 is ineligible; eligibility not alone enough for quote/bind |
| `contact_authorized` | YES / NO / UNKNOWN; never inferred from opportunity existence |
| `decision_maker_reached` | YES / NO / UNKNOWN |
| `meeting_agreed` | YES / NO / UNKNOWN |
| `meeting_held` | YES / NO / PENDING / UNKNOWN |
| `quote_confirmed` | YES / NO / UNKNOWN; quote delivered to customer, not merely created |
| `bind_confirmed` | YES / NO / UNKNOWN; authoritative producer/carrier verification |
| `premium_usd` | Confirmed premium only; blank if unknown/not bound |
| `producer_minutes` | Actual total producer work minutes for this episode; blank if unavailable, never 0 by inference |
| `spend_usd` | Actual attributable lead/campaign spend if known; blank if unknown |
| `evidence_level` | L1 / L2 / L3; current best defensible evidence |
| `outcome_status` | UNKNOWN / NOT_MET / ACCEPTED / DISPUTED |
| `source_ref_class` | Short non-identifying evidence class, e.g. calendar+crm / crm+attestation / none; no sensitive IDs |
| `dispute_flag` | YES / NO / UNKNOWN |
| `reviewed_at_pt` | Most recent review time or blank; no fabricated timestamps |

Only ACCEPTED when L3 tests have been met. A scheduled appointment pending attendance remains UNKNOWN. An unqualified episode cannot be counted as a completed qualified review. A customer saying no after contact is NOT_MET; no misleading "zero outreach cost" treatment.

## Producer workflow (minimize attention)

At each existing CRM work boundary, use the normal system of record and existing calendar and RingCentral evidence. The extra pilot action is only to create/update the pseudonymous row, marking unknown fields as UNKNOWN/blank. The pilot never generates outreach, auto-books meetings, changes lead status, or creates a new AgencyZoom cadence.

- First interaction: assign next opaque case key and capture work date, source, consent-known status and actual producer time.
- When a decision-maker replies: update permission/decision-maker and meeting agreement; do not call a callback promise a booking.
- After a scheduled review: check *attendance* against contemporaneous evidence and the actual eligibility criterion; mark ACCEPTED only if requirements are met.
- On quote or bind: independently confirm and add milestones, premium and net effort if known. Correct past mistakes while retaining the business system's audit trail.
- At daily work boundary: check only new worked cases and existing pending meetings; no per-silent-lead form or second CRM. Stop recording extra fields if administrative burden becomes excessive.

No pre-registration of all targets, no need for twenty successful reviews, and no extra prospect contact for this experiment. Any real outreach remains governed by the producer's normal carrier, licensing, contact consent, suppression and approval requirements.

## Scorecard and calculations

**Primary:** `L3 ACCEPTED qualified review meetings / (sum of actually measured producer minutes / 60)`. Report number of worked episodes, L3 count, and effort coverage alongside this ratio. If effort is not sufficiently captured, report **NOT ESTIMABLE**, not a partial-effort efficiency figure portrayed as complete.

**Additional:** actual quotes delivered and producer/carrier-confirmed binds (both absolute counts and missingness); actual bound premium if authoritative; source mix; ineligibility/unknown screening rates; number of disputed and falsely accepted outcomes; observed incremental pilot administration time; estimated spend only where source known.

**Evidence quality:** L3 outcomes without support = verification defect. Missing/unknown eligibility, permission or meeting attendance may not be silently converted to success or failure.

**No causal inference:** without comparable control and independent outcome integrity, this pilot cannot demonstrate AI impact, purchased-lead ROI, or comparative contact effectiveness. Do not manufacture a dollar value per outcome or customer willingness to pay.

## Review and exit gates

At **2026-11-04 PT**, take a preliminary count, noting pending meeting attendance and incomplete attribution. By **2026-11-10 PT**, complete a bounded follow-up review of meetings due in the first window. Late or unavailable evidence stays UNKNOWN.

- **STOP** for unauthorized contact, fabricated evidence, sensitive-data exposure, false L3 acceptance, attempted unauthorized provider/financial execution, or interference with SIGNAL district experiment allocation.
- **REDESIGN** if added producer logging cannot stay near the existing 30–60-second target or regularly causes duplicate work; if evidence sources are systematically unavailable; if significant missingness prevents a meaningful efficiency comparison.
- **INCONCLUSIVE** if fewer than 20 worked episodes are available, denominator or producer time is materially incomplete, or the post-window attendance data is immature. Do not infer no market from a tiny sample.
- **PROVE NEXT** if evidence and workload are acceptable: determine whether standard existing application records solve the full problem or whether a repeated, independently evidenced provider-switch/authority continuity issue remains for Mesh to address.
- **NO-GO** for generalized outcome-verification infrastructure absent evidence of a distinct shared-system problem and real payer demand.

**Reporting format:** Observed counts; observation period; source of verification; missingness; producer time; false positives; what the system actually did versus what the human did; downstream quotes/binds; cost; specific next decision; explicit READY/NOT_READY state.

## Release and privacy exclusions

This file is documentation and an empty template only. It does not change existing schema, migrations, API handlers, pilot scorecards, CRM, RingCentral settings, SEND/STOP logic, live flags, Cloudflare staging, customer data, permission grants, lead acquisition spend or agency operations. The existing Roadmap 3 PR stack and protected gates are unaffected.

The Mesh hypothesis under review is `the-mesh/docs/MESH-OUTCOME-ECONOMY-HYPOTHESIS-0.1.md`. Neither file alone authorizes deployment, merging, external sending or economic actions.
