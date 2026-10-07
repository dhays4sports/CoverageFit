import { sha256Hex } from './runtime-crypto.mjs';
import { notificationConfig, RESEND_EMAIL_ENDPOINT } from './producer-notification.mjs';

export const DISTRIBUTION_PRODUCER_EMAIL_BUILD = 'CF-DISTRIBUTION-LEAD-EMAIL-1.0';
export const DISTRIBUTION_PRODUCER_EMAIL_FLAG = 'COVERAGEFIT_DISTRIBUTION_LEAD_EMAIL_ENABLED';
const PREFIX = 'producer-notifications/distribution/';
const ENTRY_LABELS = Object.freeze({
  home: 'Home',
  buyer: 'Homebuyer',
  condo: 'Condo',
  tech: 'Technology',
  teachers: 'Teachers',
  healthcare: 'Healthcare',
  engineers: 'Engineers'
});
const clean = (value, max = 120) => String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const when = options => {
  const value = typeof options.now === 'function' ? options.now() : options.now;
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

export function distributionProducerEmailConfig(env = {}) {
  // Explicit activation only. Production is not changed by deployment alone.
  const enabled = String(env[DISTRIBUTION_PRODUCER_EMAIL_FLAG] || '').trim() === '1';
  return notificationConfig({
    ...env,
    COVERAGEFIT_NEW_REVIEW_NOTIFICATIONS_ENABLED: enabled ? '1' : '0'
  }, 'https://coveragefit.com/');
}

export function buildDistributionProducerEmail(input = {}, config = {}) {
  const opportunityId = clean(input.opportunityId, 160);
  if (!/^opp_[A-Za-z0-9_-]{8,155}$/.test(opportunityId)) throw new TypeError('A canonical producer opportunity is required.');
  if (!config.workspaceUrl || !/^https:\/\//.test(config.workspaceUrl)) throw new TypeError('A secure producer workspace is required.');
  const entry = ENTRY_LABELS[clean(input.entry, 40)] || 'Direct review';
  const mode = input.requestedMode === 'text' ? 'Personal text' : input.requestedMode === 'call' ? 'Personal call' : 'Review contact preference';
  const destination = config.workspaceUrl + '?area=work&opportunity_id=' + encodeURIComponent(opportunityId);
  const subject = 'New 408FARMERS lead — ' + entry;
  const plain = [
    'A 408FARMERS visitor has requested producer contact.',
    '',
    'Entry: ' + entry,
    'Preferred response: ' + mode,
    '',
    'Open this lead in CoverageFit Producer Workspace:',
    destination,
    '',
    'Customer identity, phone number, insurance answers and property details are intentionally excluded from email.',
    'Contact the prospect from the protected Producer Workspace.'
  ].join('\n');
  const html = '<!doctype html><html><body style="margin:0;background:#f4f7f8;font-family:Arial,sans-serif;color:#173047">' +
    '<div style="max-width:560px;margin:0 auto;padding:28px 20px">' +
    '<div style="background:white;border:1px solid #dbe5e8;border-radius:14px;padding:26px">' +
    '<p style="font-size:12px;color:#526d7b;font-weight:bold;letter-spacing:.08em">408FARMERS PRODUCER ALERT</p>' +
    '<h1 style="font-size:24px;line-height:1.3">New lead needs your attention</h1>' +
    '<p>A visitor has requested producer contact.</p>' +
    '<p><strong>Entry:</strong> ' + escapeHtml(entry) + '<br><strong>Preferred response:</strong> ' + escapeHtml(mode) + '</p>' +
    '<p style="margin:24px 0"><a href="' + escapeHtml(destination) + '" style="display:inline-block;background:#0e5c4a;color:white;padding:13px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Open in Producer Workspace</a></p>' +
    '<p style="font-size:12px;color:#647985">Customer identity, phone, policy and property details are intentionally excluded. Open the authenticated workspace to follow up.</p>' +
    '</div></div></body></html>';
  return { subject, plain, html, destination };
}

export async function sendDistributionProducerEmail(input = {}, options = {}) {
  const config = distributionProducerEmailConfig(options.env || {});
  if (!config.enabled) return { status:'skipped', reason:'disabled' };
  if (!config.configured) return { status:'skipped', reason:'not_configured', missing:config.missing };
  const journeyId = clean(input.journeyId, 120);
  const opportunityId = clean(input.opportunityId, 160);
  if (!/^pvxj_[A-Za-z0-9_-]{12,110}$/.test(journeyId)) return { status:'skipped', reason:'invalid_journey' };
  let email;
  try { email = buildDistributionProducerEmail(input, config); }
  catch (_) { return { status:'skipped', reason:'invalid_opportunity' }; }

  const store = options.store;
  if (!store?.get || !store?.setJSON) return { status:'failed', reason:'storage_unavailable' };
  const digest = await sha256Hex('distribution-contact-email-v1|' + journeyId);
  const key = PREFIX + digest;
  const existing = await store.get(key);
  if (existing) return { status:'deduplicated', recordedStatus:existing.status || 'unknown' };
  const createdAt = when(options);
  const receipt = { recordType:'distribution_producer_email', build:DISTRIBUTION_PRODUCER_EMAIL_BUILD,
    status:'sending', eventHash:digest, createdAt, updatedAt:createdAt };
  try {
    await store.setJSON(key, receipt, { onlyIfNew:true, metadata:{recordType:receipt.recordType,status:receipt.status,createdAt,updatedAt:createdAt} });
  } catch (error) {
    const raced = await store.get(key);
    if (raced) return { status:'deduplicated', recordedStatus:raced.status || 'unknown' };
    return { status:'failed', reason:'storage_unavailable' };
  }

  const request = {
    from: config.from, to:[config.to], subject:email.subject, text:email.plain, html:email.html,
    ...(config.replyTo ? {reply_to:config.replyTo} : {})
  };
  const headers = {
    'Authorization':'Bearer ' + config.apiKey,
    'Content-Type':'application/json',
    'Accept':'application/json',
    'Idempotency-Key':'coveragefit-distribution-lead-' + digest.slice(0, 48)
  };
  let status = 'failed', reason = 'provider_unavailable', providerStatus = null, providerId = '';
  const fetcher = options.fetch || globalThis.fetch;
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeoutMs = Number(options.timeoutMs) > 0 ? Math.min(Number(options.timeoutMs), 15000) : 5000;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    if (typeof fetcher !== 'function') throw new Error('fetch_unavailable');
    const response = await fetcher(RESEND_EMAIL_ENDPOINT, {
      method:'POST', headers, body:JSON.stringify(request),
      ...(controller ? {signal:controller.signal} : {})
    });
    providerStatus = response.status;
    if (response.ok) {
      const body = await response.json().catch(() => ({}));
      providerId = clean(body?.id, 160);
      status = 'sent'; reason = '';
    } else reason = 'provider_rejected';
  } catch (error) {
    reason = error?.name === 'AbortError' ? 'timeout' : 'network_error';
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
  const updatedAt = when(options);
  const updated = {...receipt, status, reason, providerStatus, providerId, updatedAt};
  try {
    await store.setJSON(key, updated, { metadata:{ recordType:receipt.recordType,status,createdAt,updatedAt } });
  } catch (_) {
    // The initial durable sending marker prevents duplicate sends even when
    // the provider accepted but the receipt update failed.
    return { status:'failed', reason:'receipt_update_failed' };
  }
  return { status, reason, providerStatus };
}
