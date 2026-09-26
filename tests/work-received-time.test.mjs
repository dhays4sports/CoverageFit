import test from 'node:test';import assert from 'node:assert/strict';
import {workReceivedTime} from '../assets/js/work-received-time.mjs';
test('receipt takes precedence over record creation and later activity',()=>{
 const text=workReceivedTime({received_at:'2026-09-26T19:00:00Z',created_at:'2026-09-27T19:00:00Z',updated_at:'2026-09-28T19:00:00Z'});
 assert.match(text,/Received: Sep 26, 2026/);assert.match(text,/12:00 PM PDT/);
});
test('historical creation is labeled honestly and missing time stays unknown',()=>{
 assert.match(workReceivedTime({created_at:'2026-01-02T20:00:00Z'}),/Record created: Jan 2, 2026.*12:00 PM PST/);
 for(const value of [undefined,'','broken','2026-09-26'])assert.equal(workReceivedTime({created_at:value,updated_at:'2026-09-26T19:00:00Z'}),'Received: Unknown');
});
