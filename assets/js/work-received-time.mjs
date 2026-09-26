// Receipt and record creation are distinct; never substitute last activity.
export function workReceivedTime(record={}){
  const received=record.received_at||record.pilot?.received_at;
  const value=received||record.created_at;
  const label=received?'Received':'Record created';
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))return 'Received: Unknown';
  return label+': '+new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(value));
}
