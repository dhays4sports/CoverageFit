# District pilot 1.2 — RAW intake and administrative-burden checkpoint

Date: 2026-09-25. Candidate implementation, not a production certification. Pilot rollout remains **NO-GO** until the P0 measurement and live gates below are closed. Migration 0019 is already operator-confirmed; do not reapply it.

## What Dylan would do

| Work boundary | CONTROL | SIGNAL | Remaining incremental work |
|---|---|---|---|
| New inventory | Download each existing AgencyZoom RAW CSV | Same | Select multiple files together; preview exceptions; confirm the batch once. No manual merging or lead recreation. |
| Enrollment | Automatic immutable assignment | Same | No per-lead tagging, timestamp entry or separate CONTROL roster required for successfully imported records. |
| Silent lead | Normal existing outreach only | Same initial approved outreach | No individual pilot check-in. Failed contact still consumes producer time; it cannot be counted as zero. |
| Reply | Normal manual sales workflow | Review recommendation and draft; approve before sending | Useful-conversation yes/no/unknown at the existing work boundary. CONTROL never receives Signal treatment merely for measurement. |
| Worked opportunity | Record additional actual minutes once | Same | Presets 2/5/10/15/20/30 or exact minutes; optional existing work category. No duplicate Quick wrap time. |
| Outcome changed | Confirm actual quote/bind and normal disposition | Same | One atomic save with time. Future date/month only when known. No required narrative or invented event timestamps. |
| Stage/suppression | Normal AgencyZoom workflow | Normal stage move plus acknowledgement when needed | Keep safety and campaign-removal checks. Do not erase this real effort from the timing trial. |
| Weekly reporting | Shared comparison | Shared comparison | Existing export. Unknowns remain unknown; no manual rate calculation. |

Target: 30–60 seconds additional administration per worked opportunity, effectively no per-record pilot work for silent leads. Batch download/import and exceptions count toward the target. These are acceptance targets, **not measured results**.

## Implemented candidate

- Protected existing Solo Desk RAW preview/import endpoints and multi-file/drop interface; Quick Add fallback.
- Individual CSV files, 1–20 per batch, 64 KB each, 256 KB total text. One malformed file does not discard valid neighbors.
- UTF-8/BOM, quoted CSV and the exact observed AWL `_csv_` / insurance-header export defect; no general column-shift guessing.
- Stable source-key deduplication, immutable existing hash assignment, original received time, Pacific interpretation of unzoned source timestamps, 48-hour enrollment window.
- Different identities sharing a phone are held as exceptions. Existing unrelated opportunities are not merged merely because their phone matches. Repeat imports reuse the enrolled opportunity.
- Canonical RingCentral relationship link; no send, no AgencyZoom write and no inferred permission.
- Exact allowlisted RAW facts with provenance. No wholesale RAW persistence; demographic/credit/free-text payloads are excluded. Synthetic replicas only in tests.
- SIGNAL uses existing priority logic; static RAW participation earns no structured-engagement intent credit. CONTROL receives no FIV, priority or NBA projection and is excluded from producer priority queues.
- Known line/carrier/renewal facts feed SMS zero-repeat; passed imported timing is removed. A fresh reply can update facts. Drafts remain review-first.
- Optional pilot-only guard holds unenrolled threads and recognizes compliance first. It does not automatically release a human-review lock after later enrollment.
- Synthetic enrollment phase excluded from NEW_LEAD scorecard denominators.
- Minimal atomic quick review, effort presets, useful-conversation field and original primary metric retained.

## RAW field governance

| Category | Examples | Handling |
|---|---|---|
| A — operational identity | Original ID, received timestamp, name, phone/email, California state | Identity, eligibility and linking only; no consent inferred. Address/location fields are not turned into demographic priority proxies. |
| B — permitted insurance evidence | Product, carrier, insured status, renewal/closing, vehicle/use, limits/deductibles, property/occupancy, explicit need | Allowlisted facts and field provenance. Presence does not mean every field scores or proves fresh intent. |
| C — unneeded operational metadata | Buyer ID, VIN, best contact time, comments | Not persisted by this importer. Free text is not a back door into scoring. |
| D — prohibited priority inputs | DOB/age, credit, gender, marital, occupation, income, education | Values dropped; no scoring exposure. |
| E — unmapped | Unknown columns | Dropped; mapping does not guess. Missing/ambiguous required fields receive an exception. |

The real sample is not committed or bundled. Test fixtures use synthetic data.

## Primary measurement and P0 blockers

Primary metric remains **Producer Minutes / Useful Conversation**. Quotes, binds and Future Bind preservation prevent winning merely by working fewer leads. Missing producer minutes are null, never inferred zero.

1. **Batch outcome/effort reconciliation remains unresolved.** The current scorecard correctly withholds full-cohort efficiency when effort/outcomes are incomplete. It must not be solved by requiring individual silent-lead reviews. Reuse authoritative AgencyZoom outcomes in a batch or add a governed cohort work-block reconciliation, then test it before enrollment.
2. **Timing gate has not been measured.** Run ten worked opportunities per arm plus a silent/unqualified batch; include file downloads, navigation, exception handling, review, stage acknowledgements and weekly reconciliation. Report median and slowest case. Clicking a preset in a unit test is not a human timing trial.
3. **Existing-record exceptions** need a safe source-ID match/reuse path where an opportunity predates this importer. Current behavior holds these rather than duplicating or doing a phone-only merge.
4. **Production canaries remain unverified:** new RAW interface, durable imported record and SMS relationship, internal inbound, no pre-approval send, exactly one approved provider send, producer takeover and late-enrollment release. Do not send to customer numbers for certification.
5. **Pre-enrollment history** flag uses safely available stored inbound history since receipt; unavailable provider history is not proof there was no earlier reply. Do not silently exclude late replies from the denominator.

No GO declaration, no broad SMS activation and no route activation follows from local tests alone.

## Configuration boundary

No Cloudflare configuration was changed. No new migration is introduced. Existing D1 and producer authentication are reused. Existing RingCentral sending number and conversation-hash secret must match the live transport for links to work. Never paste secret values into chat.

Once release gates pass, the manual production checkpoint must explicitly retain review-first and set `CF_SMS_SIGNAL_PILOT_ONLY=1` before enabling `CF_SMS_SIGNAL_ENABLED`. Keep SMS Signal off until internal-number certification is ready. Do not change configuration merely to test this unfinished candidate.

## Operator notes

Open the existing producer workspace. Use **Import AgencyZoom RAW Leads**. Select the files, preview, fix only exceptions and confirm once. The result links to each existing/imported record. Re-importing identical source keys is safe. Do not change a key to obtain a desired cohort.

CONTROL keeps the normal AgencyZoom workflow. SIGNAL recommendations appear in the SMS Decision Queue after a meaningful inbound reply; enrollment itself does not create a conversational draft. AgencyZoom remains the business record and outbound cadence owner.

The earlier manual-work audit's proposal to change the primary metric to minutes/quote is superseded by the 1.2 mandate. Existing district presentation artifacts must be revised and re-certified before distribution; do not present the initial per-lead operator guide as the final low-burden process.

## Validation evidence

- Full local suite: **159 passed, 0 failed, 0 skipped**.
- JavaScript/module syntax: **397 files, 0 failures**.
- Real supplied RAW sample parsed successfully; only field names/counts were inspected in validation output. No sample identity data is in the repository.
- Seven new RAW tests cover allowlist/prohibited fields, export quirks, ten-file import, independent file failure, deduplication, test denominators, phone conflicts, fingerprint confirmation, age boundary, actual priority projection, CONTROL exclusion and SMS zero-repeat/pilot-only hold.
- Existing safety, compliance, idempotency, compact-review and rollback-on-effort-failure tests still pass.
- No browser timing claim, no production deployment claim, no live provider-send claim.
