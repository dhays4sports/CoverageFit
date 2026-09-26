# Entry route and deprecation matrix

2026-09-26. Read with ENTRY-ARCHITECTURE-1.0. Full tracked-route inventory and repository reference counts remain in DISTRIBUTION-ROUTE-INVENTORY-1.0. External SMS/email/flyer/partner traffic is not proven absent; all historical URLs are preserved.

Classes: A CONTEXTUAL_408; B COVERAGEFIT_DIRECT; C SIGNAL_CONTINUE; D SPECIALIZED; E LEGACY; F DEV/PREVIEW; G ACTIVE DEPENDENCY; H UNKNOWN.

| Domain / route or component | Class | Current implementation / decision | Gate / dependency |
|---|---|---|---|
| 408 `/` | A/G | Preserve local hub and current links | Existing acquisition forms |
| 408 `/home`, `/home/` | A/G | Adapter implemented; public activation rolled back after upstream failure | Existing Home restored; Cloudflare runtime evidence required |
| 408 `/home/legacy.html` | E/G | Preserve original review/appointment page | Existing forms and campaigns |
| 408 `/buyer/` | A/G | Existing page retained; canonical buyer-aware question implemented | Home certification before conversion |
| 408 `/buyer/continue[.html]` | A/F | Earlier unlinked candidate now uses immediate-question presentation | No public promotion before certification |
| 408 `/condo/` | A/G | Existing page retained | Condo-specific evidence and hosted canary |
| 408 `/tech/` | A/G | Existing page retained | No profession scoring; canonical source context ready |
| 408 `/teachers/`, `/healthcare/`, `/engineers/` | A/G | Existing pages retained | After Tech certification |
| 408 `/auto-bundle/` | A/G | Existing flow retained | Bundle transfer/appointment compatibility |
| 408 `/auto` | H/F | No assumed new public canonical route | Existing registry/preview only |
| 408 `/{home,condo}/qr/{market}/{campaign}` | A | Strict parser/contract implemented; interception inactive | Ordinary route certification first |
| 408 `/life/`, `/life/thank-you.html` | D/G | Keep specialized application/consent/queue | No architectural collapse |
| 408 business/commercial | D/H | Preview dependencies retained | No invented personal-lines conversion |
| 408 thank-you pages | E/G | Keep compatibility | Existing form posts and old links |
| 408 `/neighbor/`, `/snapshot/`, `/local/*` | D/G/H | Keep specialized/referral workflows | Partner and program dependencies unresolved |
| 408 `/contact/`, `/privacy.html`, `/terms.html` | D/G | Keep identity/legal/contact | No new legal or Farmers claims |
| 408 `/signal-preview/*`, `/signal-lab/*`, `/signal-life-preview/*`, `/life-ops/` | F/G | Existing noindex/dev containment retained | Not deleted; test/specialist dependencies |
| 408 shared Signal registry/session/remote bridge | E/F/G | Compatibility only for retained paths | Not used by new Home presentation |
| 408 local foundation decision module | F/G | Retain lab dependency; no new route calls it | Retire only after dependency proof |
| CoverageFit `/`, `/about/`, `/how-it-works/`, privacy/terms/support | B/G | Keep canonical trust/public explanation | Insurance Producer title retained |
| CoverageFit `/begin/` | B | New direct paid presentation, immediate question | Hosted paid canary; unlinked candidate |
| CoverageFit `/home/`, report/result/PVX/review/transition routes | B/G | Preserve existing active review/report compatibility | Avoid destructive consolidation |
| CoverageFit `/business/*`, `/landlord/` | D/G | Specialized retained | Evidence/application distinctions |
| CoverageFit `/s/<token>`, `/signal-continue.html` | C/G | Human-warm continuation plus exact canonical WEB_DIRECT handoff adapter | Local cross-channel certification passed; hosted internal send pending |
| CoverageFit `/sms/continue/`, `/pvx/appointment/` | D/G | Existing callback/booking flows retained | Do not replace clear callback with questionnaire |
| CoverageFit `/api/signal/decision` | B/G | Canonical engine; buyer question framing only | No weight/action changes |
| CoverageFit `/api/signal/home-handoff` | B/G | Existing signed handoff retained | Historical callers |
| CoverageFit `/api/distribution/*` | B/G | Canonical session, SSR question, interactions, measurement | Existing D1 binding and fail-closed limits |
| CoverageFit producer Workspace / source projection | G | Source/campaign/audience shown separately from priority | Existing producer authentication |

No routes deleted. No blanket redirects. No duplicate intelligence added to 408FARMERS. Old duplicate presentation/session paths remain until individually certified replacements exist. Canonical engine and acquisition-context contract are centralized in CoverageFit.
