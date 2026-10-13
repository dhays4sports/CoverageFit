// Phase 3 RingCentral readiness — safe, no-send diagnostic projection.
// Reduces a producer-authorized status response to non-sensitive readiness fields.
// No network access, provider calls, credentials, or mutations in this module.
// Never log the original status response: it can include webhook URL details.
const STATE=/^[a-z][a-z0-9_:-]{0,70}$/i;
const code=value=>STATE.test(String(value||''))?String(value):'unknown';
const allowedNames=new Set([
 'RINGCENTRAL_CLIENT_ID','RINGCENTRAL_CLIENT_SECRET','RINGCENTRAL_JWT_TOKEN',
 'RINGCENTRAL_FROM_NUMBER','RINGCENTRAL_CONVERSATION_HASH_SECRET',
 'RINGCENTRAL_WEBHOOK_URL','RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN'
]);
export function projectRingCentralReadiness(body){
 if(body?.ok!==true||!body?.status||typeof body.status!=='object')throw Error('status_response_not_verified');
 const s=body.status;
 const missing=[...(Array.isArray(s.missing)?s.missing:[])].filter(k=>allowedNames.has(k)).sort();
 const missingWebhook=[...(Array.isArray(s.missingWebhook)?s.missingWebhook:[])].filter(k=>allowedNames.has(k)).sort();
 const result={
  outbound_configured:s.outboundConfigured===true,
  webhook_configured:s.webhookConfigured===true,
  sender_ready:s.senderReady===true,
  subscription_active:s.subscriptionHealth?.active===true,
  connected:s.connected===true,
  connection_state:code(s.connectionState),
  provider_environment:['sandbox','production'].includes(s.environment)?s.environment:'unknown',
  subscription_health:code(s.subscriptionHealth?.state),
  missing_config_keys:missing,
  missing_webhook_keys:missingWebhook,
  recovery_status:code(s.recovery?.lastRecoveryStatus),
  maintenance_status:code(s.maintenance?.status),
  provider_error_code:s.error?code(s.error.code):null,
  observed_at:new Date().toISOString()
 };
 result.readiness= result.connected&&result.sender_ready&&result.webhook_configured&&result.subscription_active
  ?'READY_FOR_SEPARATELY_AUTHORIZED_CANARY'
  :result.missing_config_keys.length||result.missing_webhook_keys.length?'CONFIGURATION_BLOCKED'
  :result.provider_error_code?'PROVIDER_STATUS_ERROR'
  :result.sender_ready?'SUBSCRIPTION_OR_WEBHOOK_NOT_CERTIFIED':'SENDER_NOT_READY';
 return result;
}
