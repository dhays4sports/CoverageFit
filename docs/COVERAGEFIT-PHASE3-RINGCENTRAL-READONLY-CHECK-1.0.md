# CoverageFit Phase 3 — RingCentral no-send connection preflight 1.0

**Date:** 2026-10-12  
**Status:** Read-only certification step; no production activation or external writes authorized.  
**Prerequisites:** Accepted Phase 2 Producer Action Quality Preview, producer authenticated on the same verified isolated Preview deployment.  
**Canonical implementation:** `GET /api/sms/ringcentral/status` via existing `handleRingCentralStatus` / `ringCentralConnectionStatus`; sanitization contract `scripts/phase3-ringcentral-readiness.mjs`.

## First objective

Determine without changing RingCentral or Cloudflare whether CoverageFit currently has:
1. outbound sender configuration,
2. webhook URL / validation configuration,
3. sender SMS capability,
4. actual active matching subscription and health,
5. known recovery and maintenance state.

A healthy sender does **not** establish a working webhook. A successful Phase 2 Producer Work test does **not** certify live SMS or bidirectional delivery.

## Exact operator browser procedure — GET only

1. Open the **same immutable Preview** used for Phase 2: `https://ee3f966a.coveragefit.pages.dev/agent/workspace/`. Reconfirm this is isolated Preview.
2. Connect producer access through Workspace Tools if necessary. **Never share or paste your bearer token into GitHub or chat.**
3. Press **F12 → Console** (not the Cloudflare D1 SQL Console).
4. Paste the following block starting at `(async () => {` and ending at `})();`. Never include a dangling `*/` from another copied comment.

```javascript
(async () => {
  'use strict';
  const expectedHost = 'ee3f966a.coveragefit.pages.dev';
  const code = x => /^[a-z][a-z0-9_:-]{0,70}$/i.test(String(x || ''))
    ? String(x) : 'unknown';
  const allowed = new Set([
    'RINGCENTRAL_CLIENT_ID','RINGCENTRAL_CLIENT_SECRET',
    'RINGCENTRAL_JWT_TOKEN','RINGCENTRAL_FROM_NUMBER',
    'RINGCENTRAL_CONVERSATION_HASH_SECRET',
    'RINGCENTRAL_WEBHOOK_URL','RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN'
  ]);
  if (location.protocol !== 'https:' || location.hostname !== expectedHost) {
    console.error('COVERAGEFIT_PHASE3_BLOCKED: WRONG_PREVIEW_HOST');
    return;
  }
  const token = sessionStorage.getItem('coveragefit.producerInbox.token');
  if (!token || token.length < 16) {
    console.error('COVERAGEFIT_PHASE3_BLOCKED: NO_PREVIEW_PRODUCER_SESSION');
    return;
  }
  try {
    const response = await fetch('/api/sms/ringcentral/status', {
      method: 'GET', credentials: 'same-origin', cache: 'no-store',
      redirect: 'error',
      headers: {Authorization: 'Bearer ' + token, Accept:'application/json'},
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) {
      console.error('COVERAGEFIT_PHASE3_BLOCKED: HTTP_' + response.status);
      return;
    }
    const payload = await response.json();
    if (payload?.ok !== true || !payload?.status) {
      console.error('COVERAGEFIT_PHASE3_BLOCKED: STATUS_MISSING');
      return;
    }
    const s = payload.status;
    const report = {
      outbound_configured: s.outboundConfigured === true,
      webhook_configured: s.webhookConfigured === true,
      sender_ready: s.senderReady === true,
      subscription_active: s.subscriptionHealth?.active === true,
      connected: s.connected === true,
      connection_state: code(s.connectionState),
      provider_environment: ['production','sandbox'].includes(s.environment)
        ? s.environment : 'unknown',
      subscription_health: code(s.subscriptionHealth?.state),
      missing_config_keys: (s.missing || []).filter(x => allowed.has(x)).sort(),
      missing_webhook_keys: (s.missingWebhook || []).filter(x => allowed.has(x)).sort(),
      recovery_status: code(s.recovery?.lastRecoveryStatus),
      maintenance_status: code(s.maintenance?.status),
      provider_error_code: s.error ? code(s.error.code) : null,
      send_actions: 0,
      status: 'READ_ONLY_OBSERVATION'
    };
    console.log('COVERAGEFIT_PHASE3_STATUS:', JSON.stringify(report));
    console.info('GET-only inspection complete. No subscription, recovery or send action was requested.');
  } catch (_) {
    console.error('COVERAGEFIT_PHASE3_BLOCKED: NETWORK_OR_REQUEST_ERROR');
  }
})();
```

**Share only the `COVERAGEFIT_PHASE3_STATUS` line** or its compact screenshot; never share raw response JSON, Network headers, tokens, exact webhook URL, phone numbers, provider message bodies or customer records. The script prints a fixed allowlist of booleans and status labels, not secrets.

This GET reads live provider/account readiness using the **configured Preview environment**; `provider_environment: production` can appear if Preview uses a production RingCentral account. It does **not** mean a customer message was sent or that the application is deployed to Production.

## Interpret safely

| Result | Next engineering action (no sends) |
| --- | --- |
| `outbound_configured=false` or `webhook_configured=false` | Record missing variable **names only**, prepare consolidated operator configuration review; do not create a webhook yet |
| `sender_ready=false` | Verify the configured number's SMS capability/assignment through RingCentral; no speculative outbound testing |
| `webhook_configured=true`, `subscription_active=false` | Audit matching webhook/subscription health and expiry, then prepare approved create/renew action; do not call subscription POST |
| `sender_ready=true`, `subscription_active=true`, `connected=true` | Read-only prerequisites present. Continue replay, STOP/CONTROL and recovery tests before a separately authorized operator-controlled canary |
| `provider_error_code` populated / HTTP not 200 | Diagnose auth/provider reachability with redacted status; do not retry mutation or publish credential values |

## Existing implementation boundaries

- `GET /api/sms/ringcentral/status` is an authenticated read-only status endpoint.
- `POST /api/sms/ringcentral/subscription` can create/renew a RingCentral subscription and may invoke history recovery.
- `POST /api/sms/ringcentral/recovery` processes/replays provider history into records.
- `POST /api/sms/ringcentral/maintenance` can renew subscription/recover and has separate authorization.
- `POST /api/sms/ringcentral/webhook` is a RingCentral event receiver, **not** an operator health check.
- Do **not** invoke POST endpoints during Phase 3A. No SMS sends, config/secret edits, D1 mutations or main-branch merges have been authorized.

**Exit for Phase 3A:** a bounded non-sensitive status line with timestamp, exact Preview origin and account realm, plus an explicit next action. This alone is **not** Phase 3 complete.

**Next:** Phase 3B deterministic inbound ordering, duplicate-event recovery, ownership/STOP, delivery ambiguity, Prospect 360 evidence and confirmed follow-up tests; Phase 3C separate approval for any external provider change or canary.
