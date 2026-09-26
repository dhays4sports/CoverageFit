# CoverageFit — one opportunity, one work surface

## Daily work

Open **/agent/workspace/**. The four areas are **Work, Import, Analytics, Tools**.

1. AgencyZoom receives the district's new leads as usual.
2. Download the individual RAW CSV files and use **Import → AgencyZoom RAW Leads**. Select them together, preview exceptions and confirm once. Quick Add is the fallback, not the daily routine.
3. Return to **Work → SIGNAL**. Open the person. An active SMS Decision 2 appears first; it takes precedence over the overall priority score.
4. Read the latest reply and the proposed message. Edit if needed, **Save edit**, then **Approve & send**. Saving an edit alone never sends it. After a revision conflict, refresh before acting. Never blindly retry uncertain delivery.
5. CALL records the decision; use RingCentral to place the call. LATER can retain a real month/date. CLOSE and STOP remain distinct. STOP suppresses continued sales conversation.
6. When AgencyZoom needs a meaningful move, make it there and verify the old campaign stopped. Only then check the acknowledgement and **Mark AZ updated** in the opportunity.
7. Record actual additional time and changed outcomes in **Effort & outcomes**, in the same detail. Do not enter minutes already saved elsewhere. Blank stays unknown. Do not invent quote/bind dates or infer a bind from intent.

## The four populations

| Work list | Meaning | How to work it |
|---|---|---|
| SIGNAL | Imported, enrolled NEW_LEAD treatment cohort | Evidence, overall priority, linked SMS decision/draft, stage recommendation and effort/outcomes |
| CONTROL | Imported, enrolled NEW_LEAD control cohort | Work normally in AgencyZoom; Signal guidance intentionally disabled. Minimal context, safety and measurement only |
| WEB / DIRECT | Explicit first-party source record, such as 408FARMERS handoff | Consumer evidence, permission, next action and normal work wrap; no district pilot controls |
| OTHER | Manual, legacy, non-pilot or synthetic rehearsal record | Generic context and normal work wrap; specialist record links when needed |

A never-uploaded AgencyZoom lead does **not** exist in CoverageFit. It does not become CONTROL merely because it was not uploaded. Assignment is immutable; stage, score and SMS replies do not change population.

Search covers all populations and labels every result. Counts follow the selected Open/Closed/All scope. A web lead only enters the district denominator through a valid explicit pilot enrollment, not because it has Signal-like evidence.

## Other areas

**Import:** RAW files and Quick Add. This is no longer buried in reporting.

**Analytics:** pilot scorecard and export, acquisition/spend, economics, Opportunity Priority and FIV calibration. Specialist reports retain the historical review shell; they do not load before Work.

**Tools:** producer connection, SMS Operations, Connection Lab, provider diagnostics, displacement outreach and historical record tools. Ordinary enrolled SIGNAL reply handling stays inside Work. Resolve unusual provider delivery/connection failures in SMS Operations.

Connected browsers retain the existing producer session. Reconnect under Tools when necessary; never paste access keys into chat. Existing web/source sync is bounded and can be continued with Refresh or the Tools sync action.

## What stays manual

AgencyZoom exports, actual AgencyZoom stage/campaign changes, producer approval of each conversational SMS, calls and actual insurance decisions. There is no AgencyZoom integration, new cadence engine, automatic quote/bind claim or autonomous SMS.

No individual pilot check-in is needed solely because a lead is silent. Unsuccessful contact still consumes producer time. The prior batch reconciliation and timed burden trial remain pilot release gates; this navigation improvement does not erase them.

## Compatibility

Original opportunity_id links open Work. Existing consultation_id and Today/Inbox/Consultation/Pipeline query links retain access to the historical workspace. Documents, recommendations, Shots and diagnostics are preserved. The historical shell is a specialist compatibility path, not the default daily screen.

## Pilot measurement update

After an actual call, use **+ Record call attempt** once if no reliable existing evidence captured it. The CALL recommendation button never counts a call. Both cohorts use the same measurement rule. Do not enter call duration.

Use **Analytics → weekly scorecard → Refresh → Batch reconciliation** for silent/unqualified inventory and shared observed outcomes. Select a group sharing the same verified update, preview, confirm once. Unknown stays unknown; never confirm zero merely because someone did not reply. Confirm existing recorded effort/calls only if they cover ALL work, including unsuccessful attempts and administration. Missing external totals can be reconciled on a worked record; totals include already-recorded activity and must not also be entered as additional minutes.

Record verified term premium and Farmers policy count in the optional observed outcomes after an actual bind. No annualization or estimated commission. Analytics separates historical district reference from enrolled cohort evidence.

## SMS ownership — before and after district upload

Upload **all eligible district leads participating in the pilot**, including CONTROL. Import creates stable identity, immutable cohort, exact SMS linkage and measurement. A reply before upload never determines the cohort.

- Before upload: AgencyZoom-template replies wait safely for enrollment. They do not enter legacy guided intake. Respond manually in RingCentral if needed.
- SIGNAL: CoverageFit Decision 2; every conversational draft requires approval.
- CONTROL: normal AgencyZoom/manual workflow; no Signal or legacy treatment.
- WEB / DIRECT: verified first-party workflow may continue guided intake.
- UNKNOWN: manual review; no automatic sales intake.
- Producer takeover and suppression remain authoritative.

Work → **SMS awaiting classification** shows pending/unclassified threads. These are conversations, not newly created opportunities or pilot enrollments. Their history is retained when you import later. Do not re-send an already handled reply just because enrollment finished.

A bare HOME/AUTO keyword does not prove where a lead came from. The shared phone number is transport. An old thread without positive workflow/source provenance may need manual handling.
