# Buyer staging and lead reliability 1.2

The coordinated decision package and sanitized local test logs are maintained in acquisition PR #6 at `docs/BUYER-STAGING-1.2.md` and `docs/buyer-evidence/buyer12-*.txt`:
https://github.com/dhays4sports/408finneas/blob/upgrade/buyer-conversion-1/docs/BUYER-STAGING-1.2.md

Backend delta: fail-closed preview distribution guard before database/rate-limit access; validated preview contextual assets; existing producer leads sync reconciles at most ten saved consented requests; repeated/concurrent recovery uses original checkpoint and deterministic producer identity; pending counts appear in workspace sync status. New consented request storage uses the existing lead retention policy while browser resume remains seven days. No new service, queue, provider sends, CRM actions or migration.

Local tests: buyer/distribution/reliability 45/45; full suite 347/348. The sole inherited AgencyZoom assertion expects 48 hours while unchanged business logic says outside 7 days. Eleven new tests cover isolation, producer authentication, recovery, concurrency, expiry, partial failures and bounded backlog rotation. See tests/buyer-reliability.test.mjs.

BLOCKED for hosted acceptance: Cloudflare redirected this browser to sign-in; Preview D1 identity and provider configuration cannot be verified. No hosted submissions or production changes. The isolation flag must remain absent until bindings are inspected. It is an operator acknowledgement, not proof of database isolation.

Release only after hosted/manual acceptance and explicit approval: backend first, acquisition second. Roll back frontend first and retain buyerFlowVersion 1 backend/recovery compatibility. Never remove records or revert to pre-buyer main while compatible sessions remain. Operator-triggered recovery needs workspace load/Refresh; it is not a background scheduler. AgencyZoom and calendar are not required once the producer queue is hosted-verified.
