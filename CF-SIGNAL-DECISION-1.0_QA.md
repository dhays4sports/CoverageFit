# CF-SIGNAL-DECISION-1.0 QA

## Core regression gates

- Anonymous Life coverage status alone does not infer Intent.
- Employer-only Life + open-to-review asks Timing.
- Employer-only Life + open-to-review + within-30 becomes a qualified human offer.
- No-personal Life + ready-now + now becomes Shoot Now internally.
- Existing personal Life coverage does not fabricate Need; when needed it asks protection goal.
- Weak Life research routes to education rather than a producer.
- Explicit no-current-interest routes to continue later.
- Home nonrenewal + active intent + urgent timing offers a human.
- Auto new-vehicle + open intent + 31–60 days offers a human.
- Auto explicit need-now is recognized as a concrete auto change trigger.
- Commercial high priority still asks business type before human handoff.
- Commercial with business type can offer a human.
- Unknown product asks product selection.
- Public output does not include score, queue, or dimensions.
- Public guardrails state no persistence, lead creation, contact permission, underwriting, eligibility, pricing, or bind authority.
- PII-like keys are rejected.
- Arbitrary prose signal values are rejected.
- Personal-looking attribution values are rejected.
- Allowed 408FARMERS origin receives CORS.
- Disallowed browser origin is rejected.
- OPTIONS preflight succeeds for an allowed origin.

## Preview gates before wiring 408FARMERS

1. Deploy the CoverageFit feature branch to a preview/staging environment.
2. Configure the 408FARMERS preview origin in `CF_SIGNAL_ALLOWED_ORIGINS`.
3. POST a Life signal from the browser and verify CORS.
4. Confirm browser Network payload contains no identity/contact fields.
5. Confirm the response contains no score/queue/dimensions.
6. Confirm rate-limit failures still carry the permitted CORS origin.
7. Confirm no new lead/opportunity row is written by Signal Decision.
8. Confirm `OFFER_HUMAN` alone does not create contact permission.
9. Verify the same canonical evidence produces the same underlying Opportunity Priority result in signal mode.
10. Only then replace `signal-decision-local.js` in 408FARMERS.

## Production-page gate

Do not migrate `/life` until:
- Signal Foundation browser QA passes.
- Signal Decision preview QA passes.
- the remote-decision client degrades safely when CoverageFit is unavailable.
- ZERO-REPEAT handoff design is ready for the qualified-signal action.
