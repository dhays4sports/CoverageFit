const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { reservePilotRequest } = require('../src/pilot-budget');

test('pilot budget reserves before each call and keeps unknown costs across restarts', t => {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'desk-budget-'));
 t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
 const file = path.join(dir, 'owner-pilot-usage.json');
 const req = { input: [{ content: 'test' }], max_output_tokens: 4000 };
 const settle = reservePilotRequest(dir, req);
 const uncertain = JSON.parse(fs.readFileSync(file)).charged;
 settle();
 assert.equal(JSON.parse(fs.readFileSync(file)).charged, uncertain);
 reservePilotRequest(dir, req)({ input_tokens: 200, output_tokens: 100 });
 assert.equal(JSON.parse(fs.readFileSync(file)).charged, uncertain + 600);
 fs.writeFileSync(file, JSON.stringify({ charged: 4_990_000 }));
 assert.throws(() => reservePilotRequest(dir, req), /would exceed/);
});
