# CoverageFit Entry Architecture 1.0

Updated 2026-09-26. Governing instruction: contextual acquisition, not a brand-transition funnel. This supersedes the transition-button recommendations in DISTRIBUTION-ARCHITECTURE-1.0. The older route inventory remains dependency evidence, not current rollout status.

## Responsibility and presentation contract

| Mode | Consumer sees | Canonical owner | Entry boundary |
|---|---|---|---|
| 408_contextual | 408FARMERS, Dylan, agency, immediate question | CoverageFit session, evidence, question selection, completion and handoff | First meaningful answer |
| coveragefit_continue | Personalized CoverageFit continuation introduced by Dylan | Existing Signal Continue service on an opportunity | Existing secure-session and producer eligibility checks |
| paid_agency | CoverageFit with Dylan/agency identity, immediate question | Same canonical acquisition journey as contextual 408 | First meaningful answer |

408 uses a fixed-destination presentation/transport adapter. It does not choose questions, score evidence, store competing session state, or contact providers. CoverageFit serves the initial accessible question and its canonical browser renderer. Browser requests stay same-origin; the 408 worker forwards only the opaque continuation cookie to the fixed CoverageFit endpoint. No wildcard proxy, new secret, binding, or migration is introduced.

No empty clicks: first answer saves evidence and begins the interaction. Contact submission records an explicit requested channel. Back changes an answer; resume continues saved evidence. Existing appointment routes remain available. Signal Continue's trust/secure confirmation is not removed indiscriminately.

## Acquisition context contract

`coveragefit-distribution-v1` remains compatible. Acquisition input contains entry, presentation, opaque bootstrap identity, original landing timestamp, allowlisted attribution, permitted canonical evidence, known housing/bundle/occupancy context, optional coded referral and explicit contact choice. QR context is a separate bounded object.

Server-derived: source/source family/source key/route/audience/product context/market context. Supported campaign inputs: campaign ID, variant, partner ID, UTM source/medium/campaign/content/term and creative. Public query values are bounded campaign codes, not names/phone/email; other query fields are not forwarded by the presentation adapter. Do not put customer data in campaign codes. Permission requires a separate explicit contact submission; arrival and answers are not marketing consent.

First-touch source, route, campaign and timestamp are stored separately from current/last-touch channel. Current channel is presently the initiating acquisition presentation; later Signal Continue channel updates are not yet integrated. Resumed measurement uses the saved origin rather than replacing it with a later campaign. Events are idempotent per journey/type, not raw repeat page-view counts.

## Source is not intent

Route context is level 0. A meaningful answer is explicit engagement. Need, timing, intent and a raised hand require actual evidence. Buyer context changes the opening question; it does not add buying intent or priority. Tech/teacher/healthcare/engineer context stays attribution. Profession, audience, campaign and market/ZIP are excluded from priority inputs. No Opportunity Priority weights, bands, district assignment or Decision 2 actions change.

## ZERO-REPEAT and identity boundaries

CoverageFit selects questions from imported permitted evidence plus saved answers. Back reconstructs state from imported evidence and retained answers. Refresh resumes the same private capability. Contact retry reuses the same lead checkpoint and producer projection. No opportunity is created merely for a landing or anonymous answer.

Identity is not guessed across independent anonymous browsers. A fresh visit in another browser is not silently joined by route, audience or weak phone history. Existing stable projection primitives are reused; exact same-journey retries are tested. Cross-channel buyer → producer discovery → Signal Continue is NOT certified: the existing service still denies WEB_DIRECT continuation. This must be resolved with an explicit same-opportunity ownership adapter, not by broadly enabling all web or unknown SMS threads.

## QR specification

Strict routes: `/{home|condo}/qr/{five-digit-market}/{rate|review|fit}`. Example `/home/qr/95118/rate` maps to source family qr, product home, market 95118, campaign home_qr_95118_rate. No PII; market is attribution, never quality. Parser and canonical contract are implemented/tested. Public QR activation remains gated after ordinary-route certification.

## Paid acquisition specification

`https://coveragefit.com/begin/?entry=home&utm_source=meta&utm_medium=paid_social&campaign_id=home_review_a` renders agency-contextualized CoverageFit with the first question and no 408 redirect. Measurement records Meta separately from the operational lead-source key. Paid entries do not enter the district experiment. No advertising account or campaign is created. Template is unlinked pending hosted certification.

## Measurement

Recorded: landing_view, first_question_view, first_answer, second_answer, signal_session_started, signal_session_completed, contact_requested, producer_handoff and best-effort abandon. Server owns answer/completion/contact/handoff events. Clients cannot forge a producer_handoff event through the event endpoint. No opportunity is created for measurement alone. Records use existing PVX storage with 90-day expiry metadata; storage cleanup remains existing infrastructure.

Abandonment is best-effort pagehide evidence, not proof of disinterest. Events may be unavailable when rate limited/network interrupted; do not treat missing events as zero. No new callback or quote request UI exists in this increment, so those event counts are unavailable. Existing appointments remain separate. No causal comparison of immediate-question versus old CTA variants is claimed. Useful conversation/quote/bind/effort remain canonical recorded outcomes; no new source-level reporting calculation is certified here.

## Security, compliance and population boundaries

Private HttpOnly Secure SameSite=Lax cookie, seven-day expiry, opaque 256-bit resume token; no opportunity IDs, scores, cohort or PII in the public state. No-store/referrer/CSP headers; public campaign pages retain canonical metadata, personalized resume routes remain noindex. Revision compare-and-swap prevents stale overwrites. Contact projection does not send SMS, write AgencyZoom or create appointments. Suppression and existing ownership services remain unchanged. WEB_DIRECT remains outside district SIGNAL/CONTROL assignment. No autonomous outreach.

Same-origin proxy requires exact browser Origin, a fixed operation allowlist and bounded JSON; only the resume cookie is forwarded. Upstream per-IP rate limits may aggregate worker traffic. Validate real hosted behavior and capacity before broad campaign activation; do not weaken rate limits or add secrets silently.

## QA and rollout gate

Local suite: CoverageFit 282 passed, 0 failed, 0 skipped; 408FARMERS 27 top-level passed, 0 failed, 0 skipped. Existing district, ownership, Continue, review-first and STOP regressions are included. SQLite tests prove durable first-answer state, retry identity, imported evidence reuse, producer projection, source isolation, expiry and unknown-field rejection. Browser/mobile, hosted producer receipt and cross-channel Continue are not certified by those tests.

Order: Home hosted first-answer → reload/resume → next answer → explicit safe internal handoff and producer receipt. Only then Buyer, Condo, Tech, remaining affinity, QR, direct paid. Do not mass-enable the registry. Verify keyboard focus, 320/375/390/430px layout, no overflow, privacy/contact links, absence of producer data, no automatic SMS and old appointment compatibility. No timing/performance score is claimed without measurement.

Rollback: restore prior code through a normal revert; keep stored records and schema. Disable Home interception first if consumer entry fails; original page is preserved at /home/legacy.html. Restore previous CoverageFit implementation only after downstream entry usage is stopped. Existing migration0019 is untouched. No Cloudflare manual setting is currently required by this code.

Overall status: BLOCKED pending hosted Home certification and remaining route/cross-channel gates. Not a complete entry-architecture launch.
