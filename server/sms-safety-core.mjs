// A legacy human_takeover state also represents appointment-owned automation.
// Only explicit producer ownership pauses every automatic workflow.
export function smsAutomationPaused(conversation = {}) {
  const ownership = conversation.orchestration?.ownership || {};
  return ownership.owner === 'producer' && /^(unregistered_outbound_message|producer_manual_outbound|producer_paused_automation|producer_took_ownership|registered_outbound:producer_manual|callback_safety:)/.test(ownership.reason || '');
}
export function automaticSmsOrigin(origin) {
  return !['producer_manual', 'producer_console', 'external_unknown'].includes(origin);
}
