import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './helpers/shared-workspace-fixture.mjs';
import { digest } from '../server/solo-desk-repository.mjs';
import { handleSharedProfile } from '../server/shared-prospect-profile.mjs';
import { handleSoloDesk } from '../server/solo-desk-api.mjs';

test('production desktop access requires canonical origin, an active workspace and its registered device', async t => {
  const { db, raw } = fixture(t);
  const env = { COVERAGEFIT_DB: db, COVERAGEFIT_SOLO_WORKSPACE_ID: 'qa', COVERAGEFIT_PRODUCER_ACCESS_TOKEN: 'p'.repeat(64) };
  const secret = 'd'.repeat(64);
  const root = 'https://coveragefit.com';
  const desktop = (route, token = secret, base = root, overrides = {}) => handleSharedProfile({
    env: { ...env, ...overrides },
    request: new Request(base + '/api/shared-profile/' + route, { headers: { Authorization: 'Bearer ' + token } }),
  });
  const work = token => handleSoloDesk({
    env,
    request: new Request(root + '/api/solo-desk/producer-detail?id=one', { headers: { Authorization: 'Bearer ' + token } }),
  });

  assert.equal((await desktop('')).status, 503);
  assert.equal((await (await work(env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN)).json()).sharedProfile, undefined);
  raw.prepare('INSERT INTO cf_prospect_desk_owner_access VALUES (?,1,?,?)').run('qa', await digest(secret), new Date().toISOString());
  assert.equal((await desktop('', secret, 'https://example.pages.dev')).status, 503);
  assert.equal((await desktop('', env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN)).status, 401);
  assert.equal((await desktop('', secret, root, { COVERAGEFIT_SOLO_WORKSPACE_ID: 'other' })).status, 503);
  assert.equal((await work(secret)).status, 401);
  const listing = await (await desktop('')).json();
  assert.equal(listing.workspace, 'qa');
  assert.deepEqual(listing.profiles.map(profile => profile.customerId), ['cust_one', 'cust_two']);
  assert.equal((await desktop('record?customerId=cust_other')).status, 404);
  assert.equal((await (await work(env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN)).json()).sharedProfile.customerId, 'cust_one');

  raw.prepare('UPDATE cf_prospect_desk_owner_access SET enabled=0 WHERE workspace_id=?').run('qa');
  assert.equal((await desktop('')).status, 503);
  assert.equal((await (await work(env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN)).json()).sharedProfile, undefined);
});
