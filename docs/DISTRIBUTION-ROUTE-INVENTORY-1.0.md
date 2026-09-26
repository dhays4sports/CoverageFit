> Historical dependency inventory. Updated route classifications and activation decisions are in ENTRY-ROUTE-MATRIX-1.0.md; do not use the old brand-transition recommendations below as current rollout instructions.

# Distribution route inventory — 2026-09-26

Source audit against CoverageFit main `04e47ef80ae2efa4730b2d0d7a1c32ba3e86d960` and 408finneas main `78660e8b5614ba4252af3ba55f35a543ccae21a1`. Repository references are dependency evidence, not traffic. External campaign/email/SMS/QR use remains unverified; preserve all existing URLs.

Classes: A acquisition; B canonical CoverageFit intelligence; C overlapping intake/session logic; D specialized; E legacy; F preview/dev; G active dependency; H unresolved. No H route is removed.

## 408FARMERS

| Route | Class | Current purpose / logic | Target mode | Dependencies / risk | Status |
|---|---|---|---|---|---|
| `/404.html` | D / H | Page Not Found / Dylan Haysbert; Contact/legal/referral/compatibility | KEEP pending dependency proof | 0 exact route references; external traffic unknown | Unchanged |
| `/auto-bundle/` | A / C / G | Home + Auto Coverage Review / Dylan Haysbert; Acquisition + existing form/appointment handoff | KEEP SHELL → CoverageFit | 6 exact route references; external traffic unknown | Gated on buyer certification and route-specific context |
| `/auto-bundle/thank-you.html` | E / G | Thank You / Dylan Haysbert; Existing form completion fallback | DEPRECATE after parent cutover | 0 exact route references; external traffic unknown | Compatibility retained |
| `/buyer/` | A / C / G | Homebuyer Coverage Help / Dylan Haysbert; Acquisition + existing form/appointment handoff | KEEP SHELL → CoverageFit | 3 exact route references; external traffic unknown | Buyer candidate only; active page unchanged |
| `/buyer/thank-you.html` | E / G | Buyer Request Received / Dylan Haysbert; Existing form completion fallback | DEPRECATE after parent cutover | 0 exact route references; external traffic unknown | Compatibility retained |
| `/condo/` | A / C / G | California Condo Insurance Review / 408-FARMERS; Acquisition + existing form/appointment handoff | KEEP SHELL → CoverageFit | 1 exact route references; external traffic unknown | Gated on buyer certification and route-specific context |
| `/contact/` | D / H | Contact Dylan / Dylan Haysbert; Contact/legal/referral/compatibility | KEEP pending dependency proof | 2 exact route references; external traffic unknown | Unchanged |
| `/engineers/` | A / C / G | Engineer Discount Review / Dylan Haysbert; Acquisition + existing form/appointment handoff | KEEP SHELL → CoverageFit | 7 exact route references; external traffic unknown | Gated on buyer certification and route-specific context |
| `/engineers/thank-you.html` | E / G | Thank You / Dylan Haysbert; Existing form completion fallback | DEPRECATE after parent cutover | 0 exact route references; external traffic unknown | Compatibility retained |
| `/healthcare/` | A / C / G | Healthcare Professional Discount Review / Dylan Haysbert; Acquisition + existing form/appointment handoff | KEEP SHELL → CoverageFit | 8 exact route references; external traffic unknown | Gated on buyer certification and route-specific context |
| `/healthcare/thank-you.html` | E / G | Thank You / Dylan Haysbert; Existing form completion fallback | DEPRECATE after parent cutover | 0 exact route references; external traffic unknown | Compatibility retained |
| `/home/` | A / C / G | Home Coverage Review / Dylan Haysbert; Acquisition + existing form/appointment handoff | KEEP SHELL → CoverageFit | 7 exact route references; external traffic unknown | Gated on buyer certification and route-specific context |
| `/home/thank-you.html` | E / G | Thank You / Dylan Haysbert; Existing form completion fallback | DEPRECATE after parent cutover | 0 exact route references; external traffic unknown | Compatibility retained |
| `/` | A / G | Insurance That Fits / Dylan Haysbert; Local brand, campaign links and intake | KEEP SHELL (hybrid local hub) | 41 exact route references; external traffic unknown | Active dependencies retained |
| `/life-ops/` | F / G | Life Application Queue / Dylan Haysbert; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 0 exact route references; external traffic unknown | Retained; noindex checked |
| `/life/` | D / G | Schedule a Life Insurance Review / Dylan Haysbert; Life application, conversion and queue | SPECIALIZED | 5 exact route references; external traffic unknown | Unchanged |
| `/life/thank-you.html` | D / G | Life Insurance Next Step / Dylan Haysbert; Life application, conversion and queue | SPECIALIZED | 0 exact route references; external traffic unknown | Unchanged |
| `/local/detail/` | D / H | 408 Local / Merchant Perk; Local merchant/referral program | SPECIALIZED | 1 exact route references; external traffic unknown | Dependency review needed |
| `/local/` | D / H | 408 Local / South Bay Places and Perks; Local merchant/referral program | SPECIALIZED | 8 exact route references; external traffic unknown | Dependency review needed |
| `/local/join/` | D / H | Join 408 Local; Local merchant/referral program | SPECIALIZED | 5 exact route references; external traffic unknown | Dependency review needed |
| `/local/join/thank-you.html` | D / H | 408 Local Application Received; Local merchant/referral program | SPECIALIZED | 2 exact route references; external traffic unknown | Dependency review needed |
| `/local/stevies-bar-grill/drawing/` | D / H | Win a $50 Stevie's Gift Card / Dylan's Local Drawing; Local merchant/referral program | SPECIALIZED | 1 exact route references; external traffic unknown | Dependency review needed |
| `/neighbor/` | D / H | Preparing Your CoverageFit Review; Contact/legal/referral/compatibility | KEEP pending dependency proof | 2 exact route references; external traffic unknown | Unchanged |
| `/privacy.html` | D / H | Privacy / Dylan Haysbert; Contact/legal/referral/compatibility | KEEP pending dependency proof | 7 exact route references; external traffic unknown | Unchanged |
| `/signal-lab/` | F / G | Signal Foundation Lab / 408FARMERS; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-life-preview/application/` | F / G | Life application handoff preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 0 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-life-preview/contact/` | F / G | Life contact handoff preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 0 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-life-preview/` | F / G | Life coverage preview / 408FARMERS; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-preview/auto-bundle/` | F / G | Home + auto / 408FARMERS Signal preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-preview/auto/` | F / G | Auto coverage / 408FARMERS Signal preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-preview/business/` | F / G | Business coverage / 408FARMERS Signal preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-preview/buyer/` | F / G | Buying a home / 408FARMERS Signal preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-preview/condo/` | F / G | Condo coverage / 408FARMERS Signal preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-preview/engineers/` | F / G | Engineers / 408FARMERS Signal preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-preview/healthcare/` | F / G | Healthcare professionals / 408FARMERS Signal preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-preview/home/` | F / G | Home coverage / 408FARMERS Signal preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-preview/` | F / G | Choose a starting point / 408FARMERS Signal preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 12 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-preview/start/` | F / G | Find your next step / 408FARMERS Signal preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-preview/teachers/` | F / G | Teachers / 408FARMERS Signal preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/signal-preview/tech/` | F / G | Tech professionals / 408FARMERS Signal preview; Preview or specialist operator UI | DEPRECATE publicly; retain test/operator dependency | 2 exact route references; external traffic unknown | Retained; noindex checked |
| `/snapshot/` | D / H | Schedule a Home Coverage Review / Dylan Haysbert; Contact/legal/referral/compatibility | KEEP pending dependency proof | 3 exact route references; external traffic unknown | Unchanged |
| `/teachers/` | A / C / G | Teacher &amp; School Employee Discount Review / Dylan Haysbert; Acquisition + existing form/appointment handoff | KEEP SHELL → CoverageFit | 7 exact route references; external traffic unknown | Gated on buyer certification and route-specific context |
| `/teachers/thank-you.html` | E / G | Request Received / Dylan Haysbert; Existing form completion fallback | DEPRECATE after parent cutover | 0 exact route references; external traffic unknown | Compatibility retained |
| `/tech/` | A / C / G | Tech Professional Discount Review / Dylan Haysbert; Acquisition + existing form/appointment handoff | KEEP SHELL → CoverageFit | 9 exact route references; external traffic unknown | Gated on buyer certification and route-specific context |
| `/tech/thank-you.html` | E / G | Thank You / Dylan Haysbert; Existing form completion fallback | DEPRECATE after parent cutover | 0 exact route references; external traffic unknown | Compatibility retained |
| `/terms.html` | D / H | Terms / Dylan Haysbert; Contact/legal/referral/compatibility | KEEP pending dependency proof | 7 exact route references; external traffic unknown | Unchanged |

## CoverageFit

| Route | Class | Current purpose / logic | Target mode | Dependencies / risk | Status |
|---|---|---|---|---|---|
| `/404.html` | B / G | Page Not Found / CoverageFit; Consumer/trust/review route | KEEP canonical | 0 exact route references; external traffic unknown | Unaffected |
| `/about/` | B / G | Why CoverageFit Exists / About Dylan Haysbert; Consumer/trust/review route | KEEP canonical | 10 exact route references; external traffic unknown | Unaffected |
| `/agent/consultation/` | B / F / G | Consultation Document / CoverageFit; Producer/operator surface | KEEP internal | 3 exact route references; external traffic unknown | Unaffected |
| `/agent/displacement-outreach.html` | B / F / G | Displacement Outreach / CoverageFit; Producer/operator surface | KEEP internal | 2 exact route references; external traffic unknown | Unaffected |
| `/agent/protection-recommendations/` | B / F / G | Protection recommendations / CoverageFit; Producer/operator surface | KEEP internal | 3 exact route references; external traffic unknown | Unaffected |
| `/agent/quote-templates/` | B / F / G | Quote Templates / CoverageFit; Producer/operator surface | KEEP internal | 2 exact route references; external traffic unknown | Unaffected |
| `/agent/recommendations/` | B / F / G | Prepare a recommendation / CoverageFit; Producer/operator surface | KEEP internal | 4 exact route references; external traffic unknown | Unaffected |
| `/agent/shots/` | B / F / G | Today’s Shots · 408FARMERS; Producer/operator surface | KEEP internal | 2 exact route references; external traffic unknown | Unaffected |
| `/agent/sms-operations/` | B / F / G | 408FARMERS SMS Operations / CoverageFit; Producer/operator surface | KEEP internal | 2 exact route references; external traffic unknown | Unaffected |
| `/agent/sms-simulator/` | B / F / G | 408FARMERS SMS Connection Lab / CoverageFit; Producer/operator surface | KEEP internal | 3 exact route references; external traffic unknown | Unaffected |
| `/agent/workspace/` | B / F / G | Work / CoverageFit; Producer/operator surface | KEEP internal | 9 exact route references; external traffic unknown | Unaffected |
| `/agent/workspace/legacy.html` | B / F / G | Historical work &amp; specialist tools / CoverageFit; Producer/operator surface | KEEP internal | 1 exact route references; external traffic unknown | Unaffected |
| `/appointment/` | B / D / G | Your call with Dylan / 408FARMERS; Specialized consumer or appointment flow | SPECIALIZED | 3 exact route references; external traffic unknown | Unaffected |
| `/assessment/` | B / G | CoverageFit Home Protection Review; Existing review/session/report dependencies | KEEP compatibility | 15 exact route references; external traffic unknown | Do not redirect or delete |
| `/book/` | B / G | Schedule Your Protection Review; Consumer/trust/review route | KEEP canonical | 0 exact route references; external traffic unknown | Unaffected |
| `/business/assessment/` | B / D / G | CoverageFit Business Protection Review; Specialized consumer or appointment flow | SPECIALIZED | 1 exact route references; external traffic unknown | Unaffected |
| `/business/` | B / D / G | CoverageFit Business / Business Coverage Review; Specialized consumer or appointment flow | SPECIALIZED | 13 exact route references; external traffic unknown | Unaffected |
| `/business/profile/` | B / D / G | Business Profile / CoverageFit Business; Specialized consumer or appointment flow | SPECIALIZED | 2 exact route references; external traffic unknown | Unaffected |
| `/business/report/` | B / D / G | Your CoverageFit Business Protection Snapshot; Specialized consumer or appointment flow | SPECIALIZED | 1 exact route references; external traffic unknown | Unaffected |
| `/campaign/` | B / G | Opening CoverageFit Assessment; Consumer/trust/review route | KEEP canonical | 0 exact route references; external traffic unknown | Unaffected |
| `/docs/agent-api/` | B / F / G | Agent API Documentation / CoverageFit; Producer/operator surface | KEEP internal | 0 exact route references; external traffic unknown | Unaffected |
| `/home/` | B / G | CoverageFit Home / Homeowners Coverage Review; Consumer/trust/review route | KEEP canonical | 21 exact route references; external traffic unknown | Unaffected |
| `/home/report/` | B / G | Your CoverageFit Protection Snapshot; Existing review/session/report dependencies | KEEP compatibility | 4 exact route references; external traffic unknown | Do not redirect or delete |
| `/how-it-works/` | B / G | How CoverageFit Works; Consumer/trust/review route | KEEP canonical | 12 exact route references; external traffic unknown | Unaffected |
| `/` | B / G | CoverageFit / Insurance Reviews with Dylan Haysbert; Consumer/trust/review route | KEEP canonical | 45 exact route references; external traffic unknown | Unaffected |
| `/landlord/` | B / D / G | CoverageFit Landlord / Rental Property Coverage Review; Specialized consumer or appointment flow | SPECIALIZED | 11 exact route references; external traffic unknown | Unaffected |
| `/nonrenewal/` | B / G | Home Insurance Nonrenewal Help / CoverageFit; Consumer/trust/review route | KEEP canonical | 3 exact route references; external traffic unknown | Unaffected |
| `/nonrenewal/safeco/` | B / G | Safeco Nonrenewal in California: What to Do Next / CoverageFit; Consumer/trust/review route | KEEP canonical | 1 exact route references; external traffic unknown | Unaffected |
| `/privacy/` | B / G | Privacy / CoverageFit; Consumer/trust/review route | KEEP canonical | 11 exact route references; external traffic unknown | Unaffected |
| `/pvx/appointment/` | B / D / G | Choose a time with Dylan / 408FARMERS; Specialized consumer or appointment flow | SPECIALIZED | 3 exact route references; external traffic unknown | Unaffected |
| `/pvx/continue/` | B / G | Make your CoverageFit Snapshot more precise; Existing review/session/report dependencies | KEEP compatibility | 7 exact route references; external traffic unknown | Do not redirect or delete |
| `/pvx/discovery/` | B / G | Your CoverageFit Discovery; Existing review/session/report dependencies | KEEP compatibility | 6 exact route references; external traffic unknown | Do not redirect or delete |
| `/pvx/home-profile/` | B / G | Build your Home Profile / CoverageFit; Existing review/session/report dependencies | KEEP compatibility | 7 exact route references; external traffic unknown | Do not redirect or delete |
| `/pvx/` | B / G | CoverageFit Progressive Experience Preview; Existing review/session/report dependencies | KEEP compatibility | 0 exact route references; external traffic unknown | Do not redirect or delete |
| `/pvx/policy/` | B / G | Add Current Policy Details / CoverageFit; Existing review/session/report dependencies | KEEP compatibility | 7 exact route references; external traffic unknown | Do not redirect or delete |
| `/pvx/progress/` | B / G | Your CoverageFit; Existing review/session/report dependencies | KEEP compatibility | 2 exact route references; external traffic unknown | Do not redirect or delete |
| `/pvx/refine/` | B / G | Refine Your CoverageFit Snapshot; Existing review/session/report dependencies | KEEP compatibility | 2 exact route references; external traffic unknown | Do not redirect or delete |
| `/pvx/return/` | B / G | Return to CoverageFit; Existing review/session/report dependencies | KEEP compatibility | 0 exact route references; external traffic unknown | Do not redirect or delete |
| `/pvx/snapshot/` | B / G | Your CoverageFit Snapshot; Existing review/session/report dependencies | KEEP compatibility | 6 exact route references; external traffic unknown | Do not redirect or delete |
| `/pvx/start/` | B / G | Start Your CoverageFit Snapshot; Existing review/session/report dependencies | KEEP compatibility | 9 exact route references; external traffic unknown | Do not redirect or delete |
| `/pvx/update/` | B / G | Update your CoverageFit; Existing review/session/report dependencies | KEEP compatibility | 1 exact route references; external traffic unknown | Do not redirect or delete |
| `/pvx/web/` | B / G | Opening Your CoverageFit Snapshot; Existing review/session/report dependencies | KEEP compatibility | 0 exact route references; external traffic unknown | Do not redirect or delete |
| `/review/` | B / G | Your insurance recommendation / CoverageFit; Existing review/session/report dependencies | KEEP compatibility | 1 exact route references; external traffic unknown | Do not redirect or delete |
| `/signal-continue.html` | B / G | Continue with Dylan / CoverageFit; Opportunity-specific review-first continuation | KEEP canonical | 0 exact route references; external traffic unknown | WEB_DIRECT creation still gated in existing service |
| `/sms/continue/` | B / D / G | Choose a Callback Time / CoverageFit; Specialized consumer or appointment flow | SPECIALIZED | 2 exact route references; external traffic unknown | Unaffected |
| `/support/` | B / G | Support / CoverageFit; Consumer/trust/review route | KEEP canonical | 9 exact route references; external traffic unknown | Unaffected |
| `/terms/` | B / G | Terms / CoverageFit; Consumer/trust/review route | KEEP canonical | 11 exact route references; external traffic unknown | Unaffected |
| `/transition/` | B / G | Preparing Your CoverageFit Review; Existing review/session/report dependencies | KEEP compatibility | 4 exact route references; external traffic unknown | Do not redirect or delete |
| `/triggers/homebuyer/` | B / G | Congratulations on your new home. / CoverageFit; Consumer/trust/review route | KEEP canonical | 0 exact route references; external traffic unknown | Unaffected |
| `/triggers/premium-increase/` | B / G | Your premium changed. Start with understanding. / CoverageFit; Consumer/trust/review route | KEEP canonical | 0 exact route references; external traffic unknown | Unaffected |
| `/triggers/renewal/` | B / G | Your renewal is a useful moment to pause. / CoverageFit; Consumer/trust/review route | KEEP canonical | 0 exact route references; external traffic unknown | Unaffected |

## Non-HTML and absent routes

| Surface | Class | Finding / disposition |
|---|---|---|
| 408 `/auto`, `/business` | H / F | Registry existingPath is null; only Signal preview route is established. Do not invent redirects from unverified public endpoints. |
| CoverageFit `/s/<token>` | B / G | Dynamic Signal Continue route; opaque token, noindex; unchanged. |
| 408 shared Signal registry/remote bridge/session | C / G | CoverageFit already decides; browser session/presentation remains until each preview dependency is retired. |
| 408 `signal-decision-local.js` | F / G | Foundation-only selector used by signal-lab, not a second Opportunity Priority engine. Retain dev dependency. |
| CoverageFit `/api/signal/decision` | B / G | Canonical anonymous evidence/question engine; unchanged. |
| CoverageFit `/api/signal/home-handoff` | B / G | Existing signed Home-only durable handoff; preserve compatibility. |
| CoverageFit `/api/pvx/web-bootstrap` | B / D / G | Existing appointment/review handoff can recover leads and schedule CRM sync; not reused as a generic no-side-effect Signal entry. |
| Candidate 408 `/buyer/continue.html` | A / F | Unlinked noindex certification shell. No replacement of `/buyer/` yet. |
| Candidate CoverageFit `/check-in/` and `/api/distribution/*` | B | Canonical Signal execution in existing PVX storage; buyer only; no new scoring, table or CRM sync. |
