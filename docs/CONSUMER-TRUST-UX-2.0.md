# CoverageFit consumer trust audit and UX guide

September 26, 2026. Source baseline CoverageFit `6654018cdbc4a8911f11ab10b193bc74713ffcad`; 408FARMERS `78660e8b5614ba4252af3ba55f35a543ccae21a1`.

## Identity and copy decisions

Dylan explicitly confirmed **Insurance Producer** as the canonical public title. `producer.json` remains unchanged. Name, California license #4528400, agency and business phone match repository configuration and the public 408FARMERS disclosure. This is source/public-disclosure verification, not a fresh state-license database certification. No awards or additional credentials were added.

Farmers' official agency listing, inspected September 26: https://agents.farmers.com/ca/fremont/virginia-tam/ confirms Virginia Tam Insurance Agency, Inc., Fremont, agency license 0D79616. The About page links to that listing. No Farmers logo was redrawn, added or repositioned. Existing 408 agency assets remain unchanged. CoverageFit is presented as Dylan's review tool, without claiming corporate ownership or servicing authority.

| Claim / copy | Classification | Decision and evidence |
|---|---|---|
| Insurance Producer | FACTUAL / user confirmed | Retain canonical title; no Insurance Advisor credential |
| Answers return to Dylan in the existing review | FACTUAL for Continue | Existing scoped opportunity source and producer detail; no duplicate lead |
| No account required | FACTUAL for Continue | Opaque bearer link, no prospect account workflow |
| About 1–2 minutes | ESTIMATE | Existing bounded adaptive flow; not a measured guarantee |
| Skip known answers | FACTUAL with limitation | RAW/SMS hydration and current evidence tests; valid hosted canary pending |
| No automatic policy change or binding | FACTUAL | Continuation stores evidence; no binding/payment execution |
| “We do not sell/share any data” | NEEDS SOURCE / too broad | Not published; code cannot establish all operator/vendor practices |
| “Not a lead marketplace” | AMBIGUOUS as broad policy | Use specific continuation recipient/context instead; no claim covering every deployment |
| “CoverageFit is not Farmers corporate” | Brand review wording | No new categorical legal wording published. Tool/producer/agency hierarchy and official agency link used instead |
| 10–15 minutes saved | NEEDS MEASUREMENT | Not published as a performance promise |
| Auto/Life Coming Soon | OUTDATED public promotion | Hide cards/footer labels, retain existing paths elsewhere |
| Home “Most homeowners don’t need another quote” | TOO STRONG | Replace generalization with invitation to understand before comparing |
| “AI”, FIV, priority/cohort vocabulary | INTERNAL | Not added to consumer screens |

## Findings and bounded changes

The old root offered product selection but did not visibly identify Dylan or link privacy/terms. It advertised two unfinished products. Continue used only “With Dylan,” had no agency/license, and surfaced raw API error text with a retry even on expired links. Home could temporarily overwrite its real identity with demo defaults while `/producer.json` loaded.

Root now identifies Dylan and agency in initial HTML, explains a focused insurance conversation, distinguishes a new review from a personalized text link, adds privacy/contact navigation and keeps active Home/Business/Landlord entry points. About supplies a modest agency verification link. Existing review/report architecture remains intact.

Continue presents identity, short payoff, personalized/no-account/no-obligation context, a concise expandable explanation, privacy/terms/about, and a business-phone recovery path. It adds no third-party assets or producer scripts. Failed responses map to bounded consumer copy; server error details are not rendered. Expired/invalid links do not disclose which record exists. Uncertain submissions offer resume to inspect saved answers rather than asserting successful saving. Sales controls hide on error. Questions/completion move keyboard focus; native date input is labeled and sized; pause can resume immediately.

Shared trust CSS supplements the existing navy/green style. No unapproved headshot or Farmers mark added. No route deleted. No canonical scoring, consent, cohort, ownership, SMS sending, or database changes.

## Public UX guide

- Lead with purpose and a named human. Title: Insurance Producer.
- New public review and personalized continuation are different entrances. Never tell an existing recipient to restart on the generic homepage.
- Use plain language: review, useful details, timing, questions, Dylan. Keep allocation scores and cohort labels internal.
- State recipient/context narrowly; link full privacy instead of inventing privacy assurances.
- Contact, privacy and terms remain reachable on small screens even when desktop navigation contracts.
- Preserve compatibility: no route removal without references, traffic and owner review.
- Root is a verification destination, not a promise of quotes, savings or carrier acceptance.

## Signal Continue consumer specification

Initial page: CoverageFit → Continue with Dylan → quick check-in/payoff → identity → duration/account/obligation → single start control. Static text renders before API access. Initial page does not display customer name, phone, carrier, opportunity ID, score or cohort.

Each question uses existing server selection and allowable choices. Known RAW/SMS facts are hydrated server-side; no new local decision engine. Existing six-answer ceiling and early exits remain. Saved submitted answers can be reviewed; this pass does not introduce retroactive answer editing or a new evidence-conflict model. Future timing is optional and labeled. CALL/urgent/quote/later/negative/STOP controls retain existing semantics.

Completion uses the existing outcome-specific server message beside persistent identity/contact. Pause preserves submitted evidence; resume recalculates from current state. No reminders. No autonomous link sends.

Security: seven-day scoped bearer tokens, hash lookup, revocation/current eligibility, exact-origin POST, no-referrer, no-store and noindex remain. Direct `.html` alias now receives the same defensive headers. Producer API authentication is unchanged. The URL contains an opaque capability; recipients should keep it private. Noindex is not access control.

## Privacy and measurement audit

Continue writes to existing opportunity evidence/activity and exposes results through authenticated Work. The only provider send is explicit producer approval through the existing gateway. No marketplace distribution or AgencyZoom write occurs in this path. Privacy policy retains service-provider disclosures and adds factual continuation context; no new legal retention promise.

Existing offered/sent/opened/started/completed timestamps, answers/provenance and descriptive analytics remain. “Opened” currently means explicit Start/resume, not passive page view. Incomplete started sessions can be described observationally; abandonment is not intent. Dedicated expired-hit counts, questions-shown events, client-error telemetry and measured first-interaction latency are **not implemented/certified** in this bounded copy pass. No invasive tracking added.

## Performance and accessibility

Continue HTML/CSS/JS total approximately 8.2 KB uncompressed after polish, no image/font dependency, no producer bundle. Root retains existing 139 KB logo and established stylesheet stack. Static trust content is immediate; no numerical mobile-network speed, Core Web Vitals or Lighthouse result is claimed.

Native buttons, details/summary, labels, status region, focus management, wrapping contact links, 48px continuation buttons and 18px date input are source-verified. CSS addresses narrow navigation and 320px content constraints. Browser widths 320/375/390/430, screen-reader announcement quality, contrast across all legacy routes and slow-network behavior require actual rendering/device checks; do not equate source review with full WCAG certification.

## Dependency and legacy decisions

See CONSUMER-ROUTE-INVENTORY-2.0.md for all tracked HTML surfaces and repository reference counts. No traffic logs available. Existing PVX, review, assessment, booking, SMS and transition surfaces have active dependencies and remain. 408 preview/lab routes remain explicitly certification-only, noindex and outside public navigation; public route activation is not part of this change. The 408→CoverageFit transition now explains Dylan's continuity without changing token transfer.

## Production QA and scenario checklist

| Scenario | Evidence / gate |
|---|---|
| Root skeptical/direct visitor | Initial hosted old UI observed; new deployment check required |
| Home skeptic / existing Farmers visitor | Hosted Home and 408 identity reviewed; new copy and official agency link check required |
| Busy Auto personalized link | Local same-opportunity adaptive tests; valid hosted internal identity still required |
| Future Bind / urgent / negative | Existing local Continue suite; no routing changes |
| Expired or invalid link | Safe synthetic invalid production link; new error UX check required; real TTL tested locally |
| Halfway abandonment / resume | Local persistence tests plus client pause/resume regression |
| Two-question completion | Existing local canonical test; not yet certified with provider/mobile |
| Keyboard / screen reader | Focus/status regression; real screen-reader test pending |
| Slow mobile | Payload reviewed; throttled device test pending |
| 408→CoverageFit | Source endpoint and transition references preserved; no real intake submitted |
| Legal links | Public Privacy and Terms rendered before changes; recheck after deploy |
| Producer separation | No consumer nav to producer tools; `/agent/*` noindex added; auth unchanged |

## Readiness and limits

Consumer trust release: **PASS WITH LIMITATION locally**. Full end-to-end consumer trust certification remains **BLOCKED** on a valid governed internal link, mobile widths and real screen-reader/device checks. No claim that every consumer route is fully polished: unknown/historical dependencies were retained deliberately.

No migration, no Cloudflare change, no provider message sent. Dylan already confirmed `SIGNAL_CONTINUE_ENABLED=1` and redeployed before this task; active invalid-token rejection was observed. Earlier disabled-state notes are historical. Current broad SMS activation is not inferred from Continue activation. Existing pilot GO gates remain unchanged.

## Hosted QA update — September 26

Release `5f7f05e23379c66aef5aa9c6e2b623fa929540e0` reached public production. Root rendered the new headline, full identity, legal/contact links and no Coming Soon cards. About rendered the agency block. Home, Privacy and Terms rendered; tested desktop pages had no horizontal overflow or broken images. 408 root/Home/Buyer/Condo rendered their existing identity and functioning entry controls. Direct CoverageFit transition rendered, but a real submitted 408 handoff was not exercised.

One real hosted defect was found: an existing browser retained the old Continue script despite new HTML because `/assets/*` is cached for one day. Follow-up adds explicit `TRUST-2.0` versions to changed consumer script/style references. This must be verified before claiming new error behavior is live. The 404 and support paths also receive plain human recovery copy; no routes removed.

Full CoverageFit suite after cache regression: **266 pass, 0 fail, 0 skip**. Dedicated post-fix Continue/trust suite: **34 pass, 0 fail, 0 skip**. Syntax: **426 files clean**. No runtime/scoring engine changes. Browser console sample contained extension-origin metadata errors, not a demonstrated site application failure; this is not a comprehensive zero-console-error claim.

The available cloud-browser controls did not expose a viewport resize capability. Required 320/375/390/430px render checks, throttled-network check and screen-reader session remain explicitly unverified. A valid internal continuation link cannot be certified from the current unauthenticated producer session; no customer or ungoverned fake pilot record was created to bypass that gate.

Rollback ref: `pre-consumer-trust-20260926` → `6654018cdbc4a8911f11ab10b193bc74713ffcad`. Existing rollback references retained. 408 repository unchanged. No new manual Cloudflare setting or migration required.

## Final observed release and readiness

Implementation release: `ef26a3cb73c77309e9478bb13a9bae9704cde7fc`. Production served `signal-continue.mjs?v=TRUST-2.0` and the matching stylesheet. An invalid synthetic link then showed the new bounded unavailable/expired message, no retry button, contact recovery, full identity, and focus on the status element. Token path stayed opaque; no customer identity or opportunity was submitted. Desktop root and error page visually inspected. Cloudflare injected an analytics script tag into HTML; source CSP restricts script-src to self. Network-level confirmation of beacon containment is not claimed from a DOM-only inspection.

| Required final report item | Classification | Result |
|---|---|---|
| CoverageFit | PASS | Release above on main; documentation follow-up may have a later SHA |
| 408FARMERS SHA | PASS | Unchanged `78660e8b5614ba4252af3ba55f35a543ccae21a1` |
| Routes audited | PASS WITH LIMITATION | Tracked HTML inventory; hosted root/Home/About/legal/Continue/transition and 408 root/Home/Buyer/Condo; not every interactive path executed |
| Files changed | PASS | List below; no decision engine change |
| Homepage positioning | PASS | Review tool, human relationship, no automatic policy action, existing review entrances |
| Dylan trust component | PASS | Static identity and canonical Insurance Producer title; placeholder flash prevented |
| Agency/Farmers clarity | PASS WITH LIMITATION | Official agency listing linked, agency/tool hierarchy; no new corporate/brand legal assertion |
| Privacy trust | PASS WITH LIMITATION | Accurate continuation recipient/context and policy links; no blanket no-sharing promise |
| Continue landing | PASS | Hosted full identity and personalized continuity observed |
| Continue payoff | PASS WITH LIMITATION | Short no-repeat framing; 1–2 minutes remains estimate |
| Completion/error/expiry | PASS WITH LIMITATION | Hosted invalid-token error, local expiry/completion/pause tests; genuine valid hosted session pending |
| Mobile QA | BLOCKED | Narrow CSS reviewed; four exact viewport widths not rendered in available controls |
| Accessibility QA | PASS WITH LIMITATION | Native controls/status/focus tests and hosted focus; no full screen-reader/WCAG certification |
| Performance | PASS WITH LIMITATION | Approximately 8.2KB Continue source payload; no network benchmark or web-vitals certification |
| Route cleanup | PASS | No routes deleted; known dependencies preserved; unknown paths retained |
| Coming Soon cleanup | PASS | Removed promotional cards/footer copy from five public pages |
| 408 transition | PASS WITH LIMITATION | Source continuity copy and production route inspected; real handoff canary not repeated |
| Wording needing approval | PASS WITH LIMITATION | No newly published claim awaiting approval; broader no-sale and corporate disclaimer wording deliberately withheld |
| Hosted production checks | PASS WITH LIMITATION | New root, About, Continue/error served; legal/Home/408 pages rendered; no authenticated record canary |
| Unresolved risks | BLOCKED certification gates | Mobile widths, real internal valid-link/provider receipt, screen reader and telemetry limitations |
| Overall consumer trust readiness | PASS WITH LIMITATION | Bounded improvements deployed; full mandate acceptance not yet certified |

Next concrete verification is a governed internal personalized link opened on a phone, followed through the same-opportunity producer receipt. Do not use a real customer solely for certification. No new Cloudflare action is required for this UX release.

### Changed files

- `404.html`
- `_headers`
- `about/index.html`
- `assets/css/consumer-trust.css`
- `assets/js/producer-branding.js`
- `assets/js/signal-continue.mjs`
- `assets/signal-continue.css`
- `business/index.html`
- `docs/CONSUMER-ROUTE-INVENTORY-2.0.md`
- `docs/CONSUMER-TRUST-UX-2.0.md`
- `home/index.html`
- `how-it-works/index.html`
- `index.html`
- `landlord/index.html`
- `privacy/index.html`
- `signal-continue.html`
- `support/index.html`
- `terms/index.html`
- `tests/consumer-trust.test.mjs`
- `transition/index.html`
