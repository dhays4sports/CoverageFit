import { identity } from './solo-desk-repository.mjs';

export function isOwnerReleaseOrigin(request) {
  return new URL(request.url).origin === 'https://coveragefit.com';
}

export async function ownerWorkspaceActivation(request, env) {
  if (!isOwnerReleaseOrigin(request)) return env;
  const disabled = { ...env, CF_SHARED_PROFILE_ENABLED: '0', CF_SHARED_PROFILE_DESKTOP_TOKEN: undefined };
  if (env.BUYER_STAGING_ISOLATED === '1' || !env.COVERAGEFIT_DB) return disabled;

  try {
    const workspace = identity(env).workspace;
    const row = await env.COVERAGEFIT_DB.prepare(
      'SELECT desktop_sha256 FROM cf_prospect_desk_owner_access WHERE workspace_id=? AND enabled=1',
    ).bind(workspace).first();
    if (/^[a-f0-9]{64}$/.test(row?.desktop_sha256 || '')) {
      return { ...disabled, CF_SHARED_PROFILE_ENABLED: '1', desktopDigest: row.desktop_sha256 };
    }
  } catch {
    // Producer Work must remain usable when shared-profile storage is unavailable.
  }
  return disabled;
}
