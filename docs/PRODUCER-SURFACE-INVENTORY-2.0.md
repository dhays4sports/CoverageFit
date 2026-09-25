# Producer surface inventory and dependency decisions

2026-09-25. Inventoried before replacing the primary navigation. CoverageFit main 1fc2fe4; candidate 0283ef1 (local equivalent 78350e1). 408 main 78660e8. No route is proven unused; nothing is deleted.

| Surface / component | Purpose and verified dependency | Class | Decision |
|---|---|---|---|
| /agent/workspace/; solo-desk.mjs | Durable cf_solo opportunities, source sync, profiles, next actions, effort; producer deep links use opportunity_id | A/B | KEEP canonical URL; consolidate daily presentation |
| Workspace Today; weekly review panels | Mixed daily work, acquisition forms, economics and calibration | A/C | MOVE analytics out of daily work |
| Workspace Inbox; agent-workspace.js / pvx-unified-workspace.js | Consultations and web intake, producer access connection; linked by source/consultation records | B/E | HIDE from primary navigation; preserve compatibility view and query links |
| Workspace Consultation; consultation-command-center.js | Existing advisory discovery, reports, checklist and recommendation preparation | B | KEEP by contextual deep link; preserve historical workspace shell |
| Workspace Pipeline; consultation-pipeline-summary.js | Historical consultation disposition and source/campaign outcomes | C/F (overlapping presentation, not unused data) | MOVE to Analytics legacy review; no deletion |
| /agent/shots/; shots-board.mjs | Specialist FIV/priority/NBA triage and work wrapping; existing bookmarks | A/F (overlap) | HIDE from primary Work navigation; KEEP specialist deep link under Tools |
| /agent/sms-operations/; sms-operations.js / sms-signal.js | Provider health, queues, delivery, Signal decisions, CONTROL roster, audit | B/D | MOVE to Tools; embed same Signal backend in opportunity detail |
| /agent/sms-simulator/ | Connection checks, synthetic scenarios, provider canaries | D/E | MOVE to Tools; KEEP route |
| /agent/recommendations/ | Quote/advisory recommendation creation, linked by source context | B | KEEP contextual capability |
| /agent/protection-recommendations/ | Consumer protection recommendation workflow | B/G | KEEP specialist tool; no evidence supports deletion |
| /agent/consultation/ | Printable consultation document; expects consultation_id | B | KEEP, preserve workspace return links |
| /agent/quote-templates/ | Producer quote templates | E/B | MOVE to Tools; KEEP |
| /agent/displacement-outreach.html | Displacement outreach queue, separate workflow | D/G | MOVE to Tools; no live-usage assumption |
| Producer connection / remote-consultations.js | Session producer token shared by protected APIs | E | MOVE to Tools; compact connected indicator; retain auth |
| District pilot quick review | Enrollment metadata, effort, observed outcomes | B | KEEP inside enrolled opportunity only |
| RAW importer / Quick Add | Existing individual CSV batch intake | A | MOVE to IMPORT, separate from scorecard |
| Pilot scorecard, CSV | Enrolled NEW_LEAD denominator only | C | MOVE to ANALYTICS |
| Acquisition, economics, priority and FIV calibration | Existing measurement APIs/forms, observational reporting | C | MOVE to ANALYTICS; load on demand |
| Source links, policy.box, appointment and customer profile | Actual linked consumer/producer records, reused by Solo Desk detail | B | KEEP evidence/context and contextual legacy detail access; no replacement storage |
| 408 public routes + shared/coveragefit-launch.js | Consumer transition/bootstrap to CoverageFit, not producer work UI | B dependency | KEEP unchanged |
| 408 shared/signal-decision-remote.js | Production anonymous decision endpoint | B dependency | KEEP unchanged |
| 408 server/signal-home-proxy.mjs | Signed Home handoff → CoverageFit durable source → Solo Desk | B dependency | KEEP unchanged; never auto-enroll as district |
| 408 shared/referral-bridge.js / callback continuity | CoverageFit Home and booking return paths | B dependency | KEEP unchanged |
| 408 Signal preview and Life preview | Consumer certification surfaces; no producer UI | D dependency | KEEP unchanged |

## Dependency map

408 intake/Home handoff → canonical lead store → sourceSync → cf_solo opportunity and sources → producer population projection → Work detail.

District RAW import → immutable pilot source + cf_solo opportunity → SIGNAL or CONTROL. A never-imported AgencyZoom lead has no CoverageFit opportunity; no fabricated population.

SIGNAL detail → exact pilot conversation_id → canonical SMS store → existing /api/sms/signal actions → existing locked, revision-checked, producer-approved gateway. No new send engine.

Historical consultation_id/view links → preserved legacy workspace shell → existing consultation/report/recommendation code. Opportunity_id links → canonical Work detail.

Analytics → existing read/report APIs; historical campaign entry/calibration controls remain accessible from Analytics. Tools → existing diagnostics/setup routes.

## Cleanup boundary

No hard removal or unverified permanent redirect. Old consultation/pipeline components are overlapping historical presentation, not proven obsolete functionality. Specialist UI remains until parity and real usage are verified. One canonical daily work entry replaces competing prominent Today/Today’s Shots navigation.
