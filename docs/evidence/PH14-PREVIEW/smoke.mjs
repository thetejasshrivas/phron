import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

// Existing owner credentials and existing protection token stay in memory only.
// No app session, service-role key, new bypass token, or financial write.
const { token } = JSON.parse(readFileSync('C:/Users/thete/AppData/Local/Temp/phron-vercel-cli-62.4.0/auth/auth.json', 'utf8'));
const project = await (await fetch('https://api.vercel.com/v9/projects/prj_XT5Pzc4J81PHQRmGudpkgOkWXtdg?teamId=team_9b59Ygdac65ozFlAnednpM3Q', {
  headers: { Authorization: `Bearer ${token}` },
})).json();
assert.equal(project.name, 'phron');
assert.equal(project.ssoProtection.deploymentType, 'prod_deployment_urls_and_all_previews');
const bypass = Object.keys(project.protectionBypass ?? {}).find(key => project.protectionBypass[key].scope === 'automation-bypass');
assert.ok(bypass, 'EXISTING_PROTECTION_TOKEN_REQUIRED');
const origin = 'https://phron-hys7wn9wb-tts-1e31.vercel.app';
const deployment = await (await fetch('https://api.vercel.com/v13/deployments/dpl_87okEBHQTbn6nZCgr4yrQzpzqdNn?teamId=team_9b59Ygdac65ozFlAnednpM3Q', {
  headers: { Authorization: `Bearer ${token}` },
})).json();
assert.equal(deployment.url, new URL(origin).hostname);
assert.equal(deployment.meta.gitCommitSha, '0f28e49e42b13ed07640855468ec943e44dda4eb');
assert.equal(deployment.target, null);
assert.equal(deployment.readyState, 'READY');
const records = [];
async function request(path, protectedRequest, options = {}) {
  const r = await fetch(origin + path, {
    ...options, redirect: 'manual', signal: AbortSignal.timeout(20000),
    headers: { ...(protectedRequest ? { 'x-vercel-protection-bypass': bypass } : {}), ...options.headers },
  });
  const responseText = await r.clone().text();
  const responseHeaders = Array.from(r.headers.values()).join('\n');
  assert.ok(![token, bypass].some(secret => responseText.includes(secret) || responseHeaders.includes(secret)), 'CREDENTIAL_ECHO_DENIED');
  const destination = r.headers.get('location');
  records.push({ path, mode: protectedRequest ? 'existing automation protection credential; no app session' : 'anonymous',
    method: options.method ?? 'GET', status: r.status,
    redirect: destination ? new URL(destination, origin).origin + new URL(destination, origin).pathname : null,
    cacheControl: r.headers.get('cache-control') });
  return r;
}
for (const path of ['/home', '/api/health']) {
  const r = await request(path, false);
  assert.equal(r.status, 302);
  assert.equal(new URL(r.headers.get('location')).hostname, 'vercel.com');
}
let r = await request('/api/health', true);
assert.equal(r.status, 200);
assert.equal(await r.text(), '{"status":"ok"}');
assert.equal(r.headers.get('cache-control'), 'no-store');
assert.equal(r.headers.has('set-cookie'), false);
assert.equal((await request('/api/health', true, { method: 'POST' })).status, 405);
r = await request('/home', true);
assert.equal(r.status, 307);
assert.equal(new URL(r.headers.get('location'), origin).href, origin + '/sign-in');
r = await request('/sign-in', true);
assert.equal(r.status, 200);
assert.match(await r.text(), /Continue with Google/);
assert.equal((await request('/api/finance/state', true)).status, 401);
for (const path of ['/.env.local', '/docs/source/PHRON_PRD_v1.2.1_FROZEN.txt']) {
  assert.equal((await request(path, true)).status, 404);
}
r = await request('/api/auth/google', true, { method: 'POST', headers: { origin, 'sec-fetch-site': 'same-origin' } });
assert.equal(r.status, 303);
const authorization = new URL(r.headers.get('location'));
assert.equal(authorization.origin, 'https://kavuwjngrtqavtmxyvsq.supabase.co');
assert.equal(authorization.searchParams.get('redirect_to'), origin + '/auth/callback');
assert.ok(r.headers.has('set-cookie'), 'PKCE cookie required');
assert.equal((await request('/api/auth/google', true, { method: 'POST', headers: { origin: 'https://evil.example' } })).status, 403);
r = await request('/auth/callback', true);
assert.equal(r.status, 303);
assert.equal(new URL(r.headers.get('location')).origin, origin);
writeFileSync('docs/evidence/PH14-PREVIEW/smoke.json', JSON.stringify({ status: 'PASS', checkedAt: new Date().toISOString(), commit: deployment.meta.gitCommitSha, url: origin, checks: records, credentialEchoAbsent: true, oauthCallbackMatchesPreview: true, authenticatedFinanceJourney: 'NOT RUN; requires ordinary human Google sign-in' }, null, 2));
console.log('PASS protected Preview health, sign-in, identity denial, exact OAuth redirect, unsafe-origin denial and private-file exclusion');
