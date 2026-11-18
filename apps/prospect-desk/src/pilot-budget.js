const fs = require('node:fs');
const path = require('node:path');

const limit = 5_000_000; // microdollars
const model = 'gpt-4.1-mini-2025-04-14';
// Conservative ceilings for the pinned model. Include every text byte,
// up to 10,000 tokens per image, and request/serialization overhead.
const inputCeiling = 1;
const outputCeiling = 4;

function reservePilotRequest(directory, request) {
  const file = path.join(directory, 'owner-pilot-usage.json');
  const ledger = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { charged: 0, inputTokens: 0, outputTokens: 0, requests: 0 };
  if (!Number.isSafeInteger(ledger.charged) || ledger.charged < 0) throw Error('The pilot usage record is unavailable.');
  const input = JSON.stringify(request, (key, value) => key === 'image_url' ? '[image]' : value);
  const images = request.input.reduce((count, message) => count + (Array.isArray(message.content) ? message.content.filter(item => item.type === 'input_image').length : 0), 0);
  const reserved = (Buffer.byteLength(input) + 8192 + images * 10000) * inputCeiling + request.max_output_tokens * outputCeiling;
  if (ledger.charged + reserved > limit) throw Error('This request would exceed the $5 owner pilot budget. Your draft is saved.');
  const change = (delta, usage) => {
    const latest = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : ledger;
    latest.charged += delta;
    if (usage) {
      latest.inputTokens += usage.input_tokens;
      latest.outputTokens += usage.output_tokens;
    } else {
      latest.requests += 1;
    }
    const temporary = file + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify(latest), { mode: 0o600, flush: true });
    fs.renameSync(temporary, file);
  };
  change(reserved);
  return usage => {
    if (!usage || !Number.isSafeInteger(usage.input_tokens) || usage.input_tokens < 0 ||
        !Number.isSafeInteger(usage.output_tokens) || usage.output_tokens < 0) return;
    change(usage.input_tokens * inputCeiling + usage.output_tokens * outputCeiling - reserved, usage);
  };
}

module.exports = { model, reservePilotRequest };
