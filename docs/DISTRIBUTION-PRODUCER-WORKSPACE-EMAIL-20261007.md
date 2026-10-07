# 408FARMERS → CoverageFit Producer Workspace email alert (review candidate)

Status: **default off; pull request only**. No production email was sent, no SMS configuration changed, and no existing lead was replayed.

## Why this exists

Current canonical public routes such as 408farmers.com/tech/ now use the CoverageFit distribution journey, not the preserved legacy Formspree form. Explicit, permitted contact requests already create a durable lead and producer opportunity. Those WEB / DIRECT opportunities appear at https://coveragefit.com/agent/workspace/, which uses the existing Solo Desk repository/API internally. The older agent Solo Desk URL is not the producer's preferred destination.

The canonical distribution handoff currently has no producer email notifier. The older Formspree notification cannot be treated as proof that these new journeys notify Dylan.

## Proposed behavior

- Trigger only after a 408_contextual distribution contact request was saved and positively projected into the producer Workspace.
- Trigger once per canonical distribution journey. Anonymous answer events, reloaded confirmations, import batches, district Signal/Control leads, and separate CoverageFit paid/direct traffic do not trigger this notice.
- Send an operational email using the existing Resend notification configuration. **No customer SMS** is sent. No marketing permission is inferred.
- Subject example: **New 408FARMERS lead — Technology**.
- Body: entry program, requested response channel and a secure link to https://coveragefit.com/agent/workspace/?area=work&opportunity_id=<canonical-id>.
- No lead name, phone, insurance answers, address or other PII in the email. Producer authentication is required to open the record.
- A D1 pvx_records receipt in the producer-notifications/distribution/ namespace is inserted with onlyIfNew before invoking the provider. This inhibits duplicate emails on concurrent or repeated requests. Provider idempotency uses the same event-derived key.
- A provider problem records a failed receipt and logs a bounded reason. It never rolls back the already confirmed lead. The existing consumer success state is unchanged. Failed/uncertain emails do not automatically replay; require explicit receipt reconciliation before a retry.

## Cloudflare configuration — later, not yet performed

Set on the **CoverageFit production Pages environment**, not on 408FARMERS:

- COVERAGEFIT_DISTRIBUTION_LEAD_EMAIL_ENABLED=1 **only after** the conditions below are verified
- RESEND_API_KEY — valid provider secret
- COVERAGEFIT_PRODUCER_NOTIFICATION_EMAIL — intended producer mailbox (confirm with Dylan)
- COVERAGEFIT_NOTIFICATION_FROM — verified sending domain/identity
- COVERAGEFIT_SITE_URL=https://coveragefit.com — canonical Workspace origin
- Optional: COVERAGEFIT_NOTIFICATION_REPLY_TO

Do not copy secrets into source code, GitHub comments or chat. The default flag value is **off**, so simply merging/deploying this PR will not begin sending mail.

## Acceptance test

1. Inspect the configuration in Cloudflare without exposing credentials. Confirm verified Resend sender and producer recipient.
2. Run: node --test tests/distribution-producer-email.test.mjs tests/distribution-journey.test.mjs. Run the normal broader regressions.
3. Deploy to an isolated preview environment with the flag off. Confirm no outbound email occurs.
4. With a dedicated test destination and explicit authorization, enable the flag in the intended environment. Complete a fresh private-browser 408FARMERS /tech/ contact request using the operator's own test data.
5. Verify exactly one WEB / DIRECT opportunity in /agent/workspace/. Confirm a single received email, that its link opens the correct opportunity and requires the producer session.
6. Reload/submit the same saved contact state; confirm no second email. Exercise a simulated provider failure; ensure lead success is preserved and the failure is recorded, rather than falsely indicating email delivery.
7. Confirm district Signal/Control SMS workflows, RingCentral SMS, Formspree legacy routes, AgencyZoom, and the appointment SMS workflow are unaffected.

Read-only receipt inspection after activation:

    SELECT updated_at,
           json_extract(data_json,'$.status') AS status,
           json_extract(data_json,'$.reason') AS reason,
           json_extract(data_json,'$.providerStatus') AS provider_status
      FROM pvx_records
     WHERE record_key LIKE 'producer-notifications/distribution/%'
     ORDER BY updated_at DESC
     LIMIT 25;

**Do not** remove receipt rows as a retry shortcut. Reconcile any provider-uncertain result first. This is an email-notification improvement, not a general overhaul of producer alerts or the SMS ownership model.
