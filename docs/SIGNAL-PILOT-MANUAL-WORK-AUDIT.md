# Signal pilot — producer administrative burden audit

September 25, 2026. Supersedes the per-lead administration requirements in the initial district pilot operator guide. Rollout is paused. This is an audit of the current code, not a claim that the target workflow is already production-certified.

## Decision

**Current production workflow fails the administrative-burden gate.** It requires individual enrollment plus a 13-category/six-date review, separate effort saves and completion confirmations. The CONTROL phone upload is only an exclusion registry, so it does not remove enrollment work. A blank scorecard loading is not evidence of a usable experiment.

Release target: at most 30–60 seconds of incremental pilot administration per worked opportunity, counting repeated visits and amortized batch work. Silent/unworked leads require no individual pilot opening, classification or completion check. Unqualified leads use their ordinary CRM disposition; do not add a pilot questionnaire. Calls to silent leads still consume time: silence does not imply zero effort.

## Every incremental producer action

Normal selling already includes reading the original request/history, contacting, handling replies, discovery, preparing/delivering quotes, binding, scheduling requested follow-up, recording the business disposition and following agency suppression rules. These remain. The following are the extra work imposed by the pilot or its current architecture.

| Extra action in the current design | CONTROL | SIGNAL | Required treatment |
|---|---|---|---|
| Export new lead roster / prepare IDs and columns | Yes | Yes | One batch, shared import mapping; do not hand-format each lead. P0 gap: combined intake not built. |
| Recreate an opportunity solely for measurement | Yes | Yes | Eliminate as a producer task. Batch matching must reuse an existing record; unresolved identities go to a small exception queue. Do not silently merge by phone. |
| Open CoverageFit, find opportunity, expand pilot panel | Yes | Yes | No per-silent-lead visits. Worked lead review should live at an existing work boundary; opening a second screen is included in time budget. |
| Click Load pilot record | Yes | Yes | Eliminated in prepared patch: opens automatically on expansion. |
| Type original stable lead key | Yes | Yes | Derive from roster once; immutable assignment. Current individual enrollment remains a P0 burden gap. |
| Type received timestamp | Yes | Yes | Read actual source timestamp from batch, never import time as receipt time. |
| Confirm eligibility for every lead | Yes | Yes | Confirm inclusion rules for a batch; inspect exceptions only. Do not remove eligibility protection. |
| Assign/check CONTROL versus SIGNAL | Yes | Yes | Deterministic allocation before response review; persist once. Do not choose by reply quality or change keys. |
| Confirm/link each SMS relationship | Yes | Yes | Batch exact normalization/matching plus shared-number/conflict exceptions. Unresolved contacts remain withheld from treatment. |
| Prepare and upload a second CONTROL-only file | Yes | No | Existing preview/import is safe but duplicates roster work. Target one cohort roster/import that also establishes exclusions. Do not weaken current exclusion guard in the meantime. |
| Read a Signal score/queue merely to measure a lead | No | Possible | Eliminate for CONTROL. SIGNAL uses priority only when it affects the next action, never to fill a pilot form. |
| Manually tag each response or copy it into a tracker | Would contaminate | Yes | Defer manual rich tags. Existing Signal evidence may be reused for treatment; do not run treatment classification on CONTROL just for analytics. |
| Review/edit/approve a Signal draft | No | Yes | Keep as communications safeguard. It replaces manual composition where useful. Count net time honestly; do not add a second approval solely for the pilot. |
| Copy known line/carrier/timing into another form | Yes | Yes | Eliminate duplicate entry. Reuse governed source/context; no inferred intent from static fields. |
| Enter each of 13 yes/no/unknown outcome flags | Yes | Yes | Removed from routine prepared UI. Retain only quote/bind verification and final disposition; keep old metadata readable. |
| Enter six timestamps | Yes | Yes | Removed from routine UI. Record review time automatically; do not invent quote/bind occurrence timestamps. Future date/month only when needed. |
| Enter producer minutes | Yes | Yes | Keep one measured-time input at wrap/end of work; reuse existing effort entries. Include unsuccessful work and pilot admin. Never time every text. |
| Choose effort category | Yes | Yes | Removed from compact review; pilot captures total attention. Existing detailed categories may remain for normal workflow. |
| Save effort separately from outcome | Yes | Yes | Eliminated in prepared patch: one atomic, idempotent save. |
| Check effort-complete and zero-work boxes per lead | Yes | Yes | Compact save confirms reviewed effort once. Silent/no-work completeness must be a batch reconciliation, not individual zero clicks. P0 gap. |
| Re-enter quote/bind evidence notes | Yes | Yes | No typed duplicate note in compact review: authenticated confirmation of an actual quote/bind. Prefer authoritative existing records or a later batch export. No outcome inferred from a score/draft. |
| Copy premium/commission | Yes | Yes | Defer beyond minimal launch metrics; use verified records in later reporting. No mandatory per-lead premium entry. |
| Enter Future Bind date again | Yes | Yes | Reuse known follow-up context or weekly CRM export; compact fallback accepts date OR month. No false appointment or invented renewal date. |
| Choose a separate pilot final status | Yes | Yes | Target import/reuse normal CRM disposition. Compact review is fallback for worked records only. STOP and CLOSED remain distinct. |
| Move AgencyZoom stage | Existing workflow | Existing workflow | Keep CRM action. Signal recommendation must not create a second CRM move. |
| MARK AZ UPDATED | No extra pilot acknowledgement | Incremental | Keep for cadence isolation after a relevant manual stage move; one acknowledgement per change, not per reply. Do not claim automation stopped without checking AZ. |
| Check campaign removal/enrollment | Normal cadence duties | Incremental at engagement | Keep safety-critical check and include its time. AgencyZoom remains manual. |
| Update suppression/wrong number twice for measurement | No | No | Do normal suppression immediately. Reuse the event; do not demand a second pilot checkbox. Never skip suppression to meet a timer. |
| Mark No response repeatedly | Yes | Yes | Eliminate. Silence creates no individual pilot task, notification or new cadence. |
| Open/close silent or unqualified records in two tools | Yes | Yes | Eliminate pilot-side duplicate action. Use normal CRM outcome and batch reconciliation. |
| Refresh/export scorecard / paste spreadsheet | Shared | Shared | Once weekly, one saved snapshot; no daily per-lead spreadsheet. Prefer built-in comparison. |
| Calculate rates manually | Shared | Shared | Eliminate: existing export/scorecard formulas. Unknowns remain unavailable. |
| Resolve failed imports, duplicates, mismatches or uncertain sends | Exceptions | Exceptions | Keep an exception queue, not universal review. Include exception time in actual pilot burden. Never bypass identity, suppression or delivery guards. |

## Minimum dataset and collection policy

| Field | Collection |
|---|---|
| Stable original lead key, cohort, received/enrolled time, source | One intake batch, immutable assignment, same inclusion rule for both arms |
| Producer effort | Actual additional minutes at a normal wrap, or measured cohort work block reconciled once; no double counting and no assumed zeros |
| Quote prepared | Actual producer confirmation / authoritative outcome record; reviewed absence distinct from unknown |
| Bind | Verified policy outcome; intent and drafted quote never count |
| Future Bind | Real later opportunity plus existing follow-up date or month; preserve precision |
| Final disposition | OPEN / FUTURE_BIND / CLOSED / STOP / WON; retain normal CRM truth and audit provenance |

Keep source/provenance, stable identifiers, suppression and assignment metadata internally. Do not make Dylan re-enter them. Rich signal dimensions, useful-conversation labels, sales-positive labels, quote-ready labels, price/premium, detailed effort categories and stage-by-stage timestamps are optional observational data, not launch chores. CONTROL must not receive Signal analysis merely to fill these columns.

Before the first enrollment, amend the primary metric to **total producer minutes / actual quotes prepared**, with binds, quote/bind output per enrolled lead and Future Bind preservation as safeguards. This removes the need for Dylan to judge “useful conversation” for every control interaction. The earlier minutes/useful-conversation primary is superseded for the proposed lean protocol, subject to district prelaunch approval. No outcome-driven goalpost change is allowed after enrollment.

All measured work, including failed contact and incremental pilot administration, belongs in the numerator. If full-cohort effort is incomplete, no headline efficiency claim. A worked-only subset can be labeled descriptive but cannot establish that Signal saves time on the incoming inventory.

## Target daily operation

CONTROL: work normally in AgencyZoom/RingCentral. No Signal scoring or reply classification. At the normal wrap, add time once if it was not already recorded. Quote/bind/disposition come from existing records/batch reconciliation or a short worked-record confirmation.

SIGNAL: read current context, review/edit/approve the reply or call as appropriate. Update AgencyZoom only when needed, acknowledge the move once. At the same work boundary, record time and changed outcomes once. Do not maintain a parallel tracker.

Silent/unworked: no individual pilot action. Enrollment and end-of-period status come from the roster/reconciliation batch. If an unsuccessful call was attempted, include its effort in the normal work block. Never classify silence as rejection, or assume no time merely because no reply exists.

Unqualified/closed: record the normal agency disposition once. No extra signal taxonomy, narrative or pilot close form. Carry that disposition into the measurement batch. Useful negatives need not receive an extra “useful” label.

## Time budget — acceptance target, not a measured result

Worked opportunity, across the measured workflow: 5–10 seconds amortized enrollment/reconciliation; 10–20 seconds time entry; 5–10 seconds outcome confirmation; SIGNAL only 5–15 seconds incremental stage-sync acknowledgement when applicable. Target total 20–55 seconds. Count navigation, repeated updates, corrections and weekly batch overhead. Do not exclude control administration from the comparison. A customer-safety exception may exceed the limit; record and resolve it rather than rushing it.

Time ten synthetic worked records per arm and a 20-record silent/unqualified batch before release. Pass only if no per-silent-record interaction is required, typical worked-record total is ≤60 seconds, and quote/bind/effort completeness can be reconciled without invented values. Report the median, slowest case and exception time; do not claim a measured savings from click counts.

## Changes prepared and tested in this audit

- Compact review: additional minutes, quote, bind, disposition; follow-up date/month displayed only for Future Bind.
- One database transaction for reviewed outcome plus effort; retries do not duplicate minutes; stale edits fail without partial writes.
- No typed quote/bind reference duplication; authenticated producer confirmation retained in audit.
- Review timestamp automatic; actual unknown quote/bind event dates stay unknown.
- Month-only Future Bind preserved without manufacturing a day.
- Deferred manual taxonomy removed from routine form and headline scorecard.
- Existing authentication, same-origin controls, immutable cohort, CONTROL isolation, SMS approvals, STOP rules and missing-time behavior preserved.

These changes are on the audit branch, **not activated in production**. They reduce the form burden but do not solve the entire intake/reconciliation burden. No Cloudflare change, provider send, roster import or customer data mutation was performed.

## Remaining P0 implementation gates

1. **Single batch enrollment and isolation:** existing approved-source export → stable keys/timestamps → eligibility batch → immutable assignment → exact relationship link/exclusion → exception-only review. The current CONTROL-only roster is insufficient. No repeated copying into two import files and no individual opportunity creation solely for measurement.
2. **Batch outcome/effort reconciliation:** reuse normal CRM quote/bind/future/disposition export and existing CoverageFit effort, with explicit source provenance and conflicts. Resolve silent/unqualified inventory in a batch. Verified no-work may be set to zero only through an explicit reconciliation; missing logs never establish zero.
3. **Timed rehearsal:** prove the target using the real screens, including navigation and weekly overhead. Compact form source tests are not a usability timing test.

Until these pass, **NO-GO on administrative burden**. Do not ask Dylan to compensate with spreadsheets, per-lead completion clicks or extra daily uploads. Do not enable SMS or resume rollout simply because the form is shorter.
