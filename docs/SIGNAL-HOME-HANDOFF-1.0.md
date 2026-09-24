# Home Signal — contact handoff v1

## Delivered flow
Home Signal questions → Talk with Dylan (available before completing questions) → name, phone, selected call/text/callback method and explicit channel-specific permission → same-origin signed relay → existing CoverageFit durable lead storage → existing Solo Desk opportunity → confirmed receipt.

Callback windows are preferences in Pacific time, not calendar bookings. No outbound SMS, call, email or AgencyZoom mutation is performed. Direct call/text links are user-initiated and clearly state that answers are not transferred by those links.

The backend reconstructs answer labels and canonical signals from the existing Signal question registry, never client-provided prose. It carries the Home answers into Solo Desk under Original inquiry. Channel-specific permission is preserved; automated marketing SMS remains unauthorized. Immediate human choice permits zero answers.

Existing PVX records and Solo Desk tables are reused; there are no migrations. A deterministic request identity makes retries converge to one durable lead/source/opportunity. A partial failure after persistence is not reported as success; resubmission recovers the same request. Changed channel, phone or evidence is a new request, intentionally.

## Preview deployment configuration
These are configuration requirements, not a claim that they are present.

408FARMERS Cloudflare Pages project `408farmers-v2`, Preview environment / `signal-life-1.0` deployment:
- `SIGNAL_HOME_HANDOFF_URL=https://cf-signal-sms-integration.coveragefit.pages.dev/api/signal/home-handoff`
- Secret `COVERAGEFIT_LEAD_SYNC_SECRET`: the same existing lead-sync secret as CoverageFit, at least 32 characters. Set through Cloudflare; never paste into source or chat.

CoverageFit Cloudflare Pages project, Preview environment / `cf-signal-sms-integration` deployment:
- `SIGNAL_HOME_HANDOFF_ENABLED=1`
- Matching `COVERAGEFIT_LEAD_SYNC_SECRET` secret.
- `COVERAGEFIT_DB` bound to the intended preview database with existing PVX and Solo Desk migrations applied.
- `COVERAGEFIT_PRODUCER_ACCESS_TOKEN` configured for producer access, at least 24 characters.
- Keep SMS automation disabled. The new handler does not call the CRM synchronization helper.

Redeploy both previews after configuration changes. Do not alter production bindings or replace `/home/` for this validation.

## Operator steps
Open CoverageFit `/agent/solo-desk/` using existing producer authentication. Find the submitted synthetic name. Open Original inquiry to see Home questions/answers, requested method and callback window. Contact manually using the selected method. A window is not an appointment; confirm availability directly with the prospect.

## Validation
- Backend: `node --test tests/signal-home-handoff.test.mjs` (4 tests).
- 408FARMERS: `node --test tests/signal-home-proxy.test.mjs` (1 test).
- Existing 408 Signal regression scripts pass.
- CoverageFit SMS, decision engine and integration boundary regression: 109 tests pass.
- Synthetic SQLite tests use the real existing migrations and real Solo Desk projection. They verify receipt, answer preservation, channel permissions, no automated marketing consent, retries, concurrent duplicates, missing configuration, invalid signatures and projection failure/recovery.
- Functions bundle compiled successfully.

Hosted end-to-end delivery and authenticated producer visibility must be verified after configuration. Until then, this is implemented and locally verified, not certified ready for real traffic.

## Hosted check, September 24, 2026
The deployed Home form loads, resumes prior answers, opens contact choice, reveals a Pacific callback window and requires explicit permission. A synthetic submission returned the unconfirmed-delivery state; hosted receipt and producer visibility are NOT verified. Cloudflare dashboard access stopped at security verification, so configuration could not be changed from this session. Configure the Preview settings above and redeploy both branches before repeating the synthetic test. Keep real traffic on the existing live Home route until this gate passes.
