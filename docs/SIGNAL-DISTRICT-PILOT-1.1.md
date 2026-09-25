# California Signal district pilot 1.1

Status: source implemented and locally tested; NOT a declaration that live pilot gates passed.

## Population and protocol

Phase 1 is new incoming California personal-lines leads from approved existing district sources. Enroll within 48 hours, before response review or treatment. Exclude aged recovery, unrelated organic traffic, tests, existing-customer service and duplicate original records. Keep an exclusion log. Wrong numbers discovered after enrollment remain in their assigned denominator.

Pilot ID `SIGNAL_DISTRICT_PILOT_1`; phase `NEW_LEAD`. Original provider-prefixed lead key is normalized and SHA-256 hashed with the pilot ID. Odd parity of the first eight hexadecimal characters assigns SIGNAL; even assigns CONTROL. Assignment is immutable. Use one existing opportunity per original lead. Do not change keys to choose arms. This deterministic allocation is predictable, not a concealed clinical randomization. Confirm the assignment protocol before enrollment. Any previously assigned control roster must agree with that protocol; the upload is not an assignment mechanism.

Dylan retains the old AgencyZoom outbound automations for CONTROL. Document both arms' actual cadences before launch. Keep initial contact opportunity broadly comparable. If cadence differs materially, results estimate the combined workflow change, not the isolated effect of scoring. STOP and legitimate service always override experimental purity.

Enroll for 30 days. Save weekly cumulative snapshots; allow 30 days of outcome follow-up after the last enrollment. Retain original assignment in the final analysis, including nonresponses, negatives and deviations. Primary metric: all recorded producer minutes / useful conversations. Secondary business-preservation metrics: quote-ready, quotes, binds, Future Bind and raised-hand requests per enrolled lead. District leadership must approve a tolerance for business loss before enrollment; no numerical noninferiority claim is currently justified.

## Operator paths

- Agent Workspace → Today → California new-lead pilot: refresh comparison and download CSV.
- Open an existing opportunity → New-lead pilot enrollment and measurement → Load pilot record. Enter original lead key, received time and eligibility. Explicitly link the existing phone relationship for SMS cohort isolation. An unlinked record is not certified for SMS isolation.
- Record actual work minutes by category, once. Do not duplicate Quick wrap effort. Review outcomes as yes, no as of review, or unknown. Quote/bind require a non-sensitive evidence reference. Verify bound term premium; do not annualize or invent commission.
- Mark effort complete only after all work through the review is entered. Explicit no-work confirmation is required for zero. Later effort invalidates the completeness review. Missing remains null.
- CONTROL uses normal AgencyZoom/RingCentral workflow. Do not select CONTROL work using the priority queue. Use the pilot panel for measurement only. This is an unblinded operational experiment.

### CONTROL phone CSV upload

SMS Operations → SMS Decision Queue → Upload CONTROL leads.

CSV headers: `phone`, optional `lead_id`. US numbers only, no extensions, 1–100 numbers and under 24 KB per file. Preview masked ending digits, confirm predetermined CONTROL assignment, import. Repeating the same file is safe. Invalid/duplicate numbers and conflicts with a linked SIGNAL enrollment are rejected.

The authenticated upload stores a canonical hashed RingCentral relationship ID, ending digits and optional hashed lead key in existing SMS storage. It does not create a lead, enroll an opportunity, grant permission, send SMS or change AgencyZoom. It suppresses Signal interpretation/drafts and Signal approval on registered CONTROL threads while Signal is enabled. Compliance handling remains active. Existing normal manual RingCentral communication and AgencyZoom automation remain operator controlled. There is no roster removal/reassignment UI in this release; resolve mistakes before real enrollment rather than silently switching groups.

Upload before working the leads. An already approved/in-flight provider send cannot be recalled by an exclusion import. The SMS feature flag remains a separate manual Cloudflare control; uploading does not enable Signal.

## Frozen measurement definitions

- Enrolled: eligible original incoming lead with immutable cohort and enrollment timestamp.
- Contact: verified two-way interaction. Fresh response: human inbound reply; excludes autoresponders.
- Useful conversation: materially changes known evidence or next action; one count per lead. A useful negative is allowed.
- Sales-positive: current/future shopping interest, willingness to evaluate/qualify or request for insurance action. Requires useful=true.
- Quote-ready: producer confirms enough context and an actionable quote path; not guaranteed eligibility.
- Quote: actually prepared; quote sent is separately verified delivery.
- Bind: verified bound policy/operational record; never inferred from a draft or intent.
- Future Bind: real future intent with an operational follow-up date; month-only precision must not become an invented renewal day.
- Producer minutes: actual lead-specific work across attempts/channels, including failed work and review/admin. No double counting; unrecorded is unknown.
- Acquisition cost: actual allocated fees/spend; any labor allocation must be documented consistently.
- Bound premium: verified written term premium, counted once, not commission.

Efficiency ratios are unavailable until all enrolled records have complete effort and relevant outcome reviews. The CSV exports missing values as blanks. The workbook shows arm counts, differences and Wilson intervals for major reviewed binary rates. Small samples are directional; the pilot is not powered to establish noninferiority. Current baseline counts/costs/effort have not been supplied: the contemporaneous CONTROL arm is the primary baseline.

## Implementation and boundaries

Reuses `cf_solo_sources`, `cf_solo_activity`, `cf_opportunity_effort`, acquisition attribution, existing authenticated workspace and SMS storage. No migration or new Cloudflare configuration is introduced by this patch. Migration 0019 was operator-confirmed and production calibration was observed loading without a migration warning.

No changes to Opportunity Priority, FIV, NBA, scheduled cadence ownership, SMS approval policy or Cloudflare settings. No AgencyZoom integration. Review-first remains mandatory. Market.ad and numerical Action EV remain deferred. Recovery is Phase 2 with separate denominators.

## Certification and remaining gates

CoverageFit complete Node suite: 149 passing, 0 failures, 0 skipped (September 25, 2026). Includes deterministic enrollment, missing effort, observation CAS/idempotency, export privacy, linked CONTROL isolation, roster preview/import/replay, invalid rows, STOP, auth/origin and all existing SMS/Signal regressions. These tests use synthetic data and no provider sends.

Live provider delivery/approval, Home durable producer receipt and complete production pilot enrollment/export still require observable canaries. A successful consumer page or local test does not prove those gates. No real pilot outcomes or calibrated probabilities are claimed.

GO remains blocked until production canaries, valid CONTROL/SIGNAL routing, complete measurement rehearsal and district protocol approval pass. Do not reapply migration 0019. Cloudflare flags/secrets/bindings remain manual; never paste secrets into chat. Keep rollback refs `pre-signal-production-20260924` untouched. Revert this bounded release commit for source regression rather than resetting data.
