# SIGNAL-NORTH-STAR-1.0

2026-09-24. Incremental hardening; no new scoring engine, schema or vendor integration.

## Current versus future

Current: Exposure → Signal → Evidence → Opportunity Priority / FIV → NBA → Execution → Outcome Measurement.

Future: Exposure → Signal → Evidence → State → Action EV → Execution → Outcome → Learning → Acquisition Capital Allocation.

Opportunity Priority, FIV and NBA remain separate. Current deterministic priority is not P(Bind), a person-quality score, underwriting, eligibility or contact authority. Consumer value remains Snapshot → Understand → Add Evidence → See What Changed → Consider Recommendations → Act → Monitor → Update.

| Phase | Capability | Status |
|---|---|---|
| A | Deterministic evidence-gated routing | Current runtime |
| B | Outcome calibration by signal / score band | Observational reporting exists; empirical calibration not established |
| C | P(valuable outcome given evidence) | Future; no calibrated probability model |
| D | Execution/action success and cost | Future; no contactability or response-velocity model |
| E | Action EV | Future; no numerical runtime |
| F | External acquisition feedback | Future adapters; market.ad belongs here only |

Future EV(a | X) may combine P(valuable outcome | X,a), expected relationship value and execution cost. NO_ACTION, ASK_ONE_SIGNAL, SEND_SMS, AI_CALL, HUMAN_CALL, PREPARE_QUOTE, NURTURE and FUTURE_BIND are possible future execution options, not additions to today's five SMS actions. Observe/SMS/AI/human thresholds may differ; no numeric thresholds are proposed. DIG/$ is conceptual and uncalibrated.

## Generic seams, not market.ad implementation

`server/acquisition-measurement.mjs` already owns campaign registration, attribution, spend, exposures and outcome measurement; migrations 0014, 0015 and 0019 own existing persistence. No new tables are needed.

`normalizeAcquisitionTouch` accepts sourceFamily, sourceKey, campaignId, campaignVariant, creative, partnerId, batchId, flat utmSource/Medium/Campaign/Content/Term, landingPage and occurredAt. Existing nested `attribution.utm` remains supported. First/latest touch JSON retains creative without a schema migration. The bounded anonymous Signal transport accepts only its existing field allowlist; attribution does not permit PII or arbitrary evidence.

Source family describes acquisition class; source key identifies provider. The existing taxonomy supports paid_search, paid_social, purchased_lead, direct_mail, referral_partner, local_partner, event_or_affinity, outbound, organic_web, existing_relationship, district_lead and other. Unknown providers can use an approved family plus their own key; no market_ad family is added.

Future source adapter → generic attribution + canonical Signal → CoverageFit evidence / Priority / NBA / future EV → outcome measurement → generic feedback adapter. CoverageFit does not buy ads. Future feedback may export sourceFamily, sourceKey, campaignId, campaignVariant, exposure_count, signal_count, qualified_opportunity_count, human_escalation_count, quote_count, bind_count, bound_premium, producer_minutes and acquisition_spend. This export contract is documented, not implemented; anonymous session counts and identified outcomes must not be silently joined.

Existing seams: attribution, campaign identity, canonical Signal, exposure, spend, opportunity attribution, outcome milestones and manual producer effort. Missing future adapters: market.ad acquisition adapter and generic outcome feedback adapter. Core decisions must work if market.ad never launches.

## Measurement audit and bounded corrections

- First touch remains immutable; latest touch updates. Creative and flat attribution aliases now survive normalization.
- Contact/conversation require activity evidence; opening a call link is not contact. Quote preparation, delivery, close ask and bind retain separate milestones.
- Missing term premium stays null, including null/blank input; explicit producer-confirmed policy outcome remains necessary for bind evidence.
- Missing producer effort stays null / not_captured; acquisition group totals with no measured effort now return null. Partial totals describe captured minutes only, with effort coverage and sparse-data warnings.
- Exposure/spend writes are idempotent and retain evidence basis. Missing exposure denominators produce null rates. Premium totals are sums of verified evidence, with premium-gap warnings; they are not estimates of missing premiums.
- Priority calibration freezes first-ready evidence, labels small samples early/directional and never updates weights. Score changes require human review and a new engine version.
- Cross-system CRM conversion and producer effort not entered are unmeasured; no AgencyZoom success is inferred. Raw reply rate, useful conversation and sales-positive signal remain different concepts.

## North Star conformance matrix

Paths in the 408 column refer to dhays4sports/408finneas.

| Principle | CoverageFit evidence | 408 evidence | Status |
|---|---|---|---|
| Signal before lead | signal-decision-core.mjs stateless guardrails | signal-session.js; explicit home contact | Source + local tests |
| Evidence accumulation | solo-desk-sync.mjs; Original Inquiry | signal-session.js answer history | Source + local tests |
| Fresh intent required | opportunity-priority-core.mjs aging; evidenceMode signal | bounded current answers, no route-derived intent | Source + local tests |
| Ask minimum question | signal-decision-core.mjs; sms-signal-core.mjs | remote shell displays one question | Source + local tests |
| Human attention scarce | priority overrides, NBA, five SMS actions | explicit human choice | Source + local tests |
| Opportunity vs channel separation | priority engine vs acquisition-measurement.mjs | route attribution separate from answers | Source audit; no weights changed |
| ZERO-REPEAT | SMS memory; signal-home-handoff.mjs; Solo Desk context | answer preservation, Back/resume | Source + local tests; production receipt pending |
| Outcome measurement | acquisition-measurement.mjs; calibration | attribution only, no invented outcomes | SQLite tests; live measurement not certified |
| No fake P(Bind) | bounded deterministic priority/ranges | no public score or local priority engine | Source + local tests |
| Future Action EV seam | this roadmap; North Star | remote authority retained | Documentation only |
| market.ad deferred | generic attribution/measurement | generic canonical Signal | No vendor runtime; future adapters missing |

## Privacy and execution boundaries

Anonymous Signal is separate from identified RingCentral SMS; no cross-identity stitching. Qualified Signal is not an opportunity. Home requires explicit human action, identity, channel-specific permission and signed durable handoff. Callback preference is not a booking. No marketing authority is fabricated.

SMS remains CALL / ASK_ONE_QUESTION / LATER / CLOSE / STOP, review-first. AgencyZoom owns scheduled outbound and CRM stages. Dylan manually updates and acknowledges AZ; RingCentral remains transport. STOP is deterministic; wrong numbers/autoresponses do not become opportunities. Uncertain/unsupported contexts require human review.

## Production evidence ledger

Verified starting main: CoverageFit 71ae13bcf73607c24546452c6efb31df07b8031e, including integrated ff217df2c0c71ec6bdf13e8e1dcc9c2e175a0595 and production SMS fixes. 408 main fd4c6849a871649dd9840ff61eaa5a9407a515d0; candidate cd015fc52890830a991ab304681ab8816b2d0a09 was 53 ahead / 0 behind.

Rollback `pre-signal-production-20260924` remains CoverageFit 961d242a2fbdfc27f634a9836e66dfb3f2c60ef1 and 408 fd4c6849a871649dd9840ff61eaa5a9407a515d0. No Cloudflare settings or data were changed by this task. Existing cutover checkpoint A remains unresolved: no operator confirmation has been supplied. Home/SMS flags are source-default OFF, actual deployed values unconfirmed. Producer receipt and review-first provider-send canaries have not passed. Git publication is not deployment/configuration/canary certification.

Certification for this change: CoverageFit 137 passing test entries (zero failures/skips), 192 syntax files clean, local Pages Functions compilation passed. 408 certification: 22 passing entries across 11 scripts including 11-route/58-path traversal, 62 syntax files clean. Source/local certification is not proof of production deployment, configuration, durable receipt, provider-send behavior, real traffic or calibrated economics.
