import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { verifyLocalContainer } from './local.mjs';

export function localAuth() {
  verifyLocalContainer();
  const cli = process.env.PHRON_TEST_CLI ?? 'C:/Users/thete/AppData/Local/Temp/phron-supabase-cli-2.119.0/supabase.exe';
  const state = JSON.parse(execFileSync(cli, ['status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  if (state.API_URL !== 'http://127.0.0.1:55321') throw new Error('LOCAL_TARGET_REQUIRED');
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const client = () => createClient(state.API_URL, state.ANON_KEY, options);
  const admin = createClient(state.API_URL, state.SERVICE_ROLE_KEY, options);
  const ids = [];
  return {
    client,
    async user() {
      const email = `ph11-${randomUUID()}@example.test`;
      const password = randomUUID() + 'aA!';
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error || !created.data.user) throw new Error('LOCAL_USER_SETUP_FAILED');
      ids.push(created.data.user.id);
      const ordinary = client();
      const signedIn = await ordinary.auth.signInWithPassword({ email, password });
      if (signedIn.error) throw new Error('LOCAL_SIGN_IN_FAILED');
      return { client: ordinary, id: created.data.user.id };
    },
    async anonymous() {
      const ordinary = client();
      const signedIn = await ordinary.auth.signInAnonymously();
      if (signedIn.error || !signedIn.data.user) throw new Error('LOCAL_ANONYMOUS_SETUP_FAILED');
      ids.push(signedIn.data.user.id);
      return ordinary;
    },
    async cleanup() {
      for (const id of ids) {
        const removed = await admin.auth.admin.deleteUser(id);
        if (removed.error) throw new Error('LOCAL_FIXTURE_CLEANUP_FAILED');
      }
    },
    async remove(id) {
      if (!ids.includes(id)) throw new Error('TEST_FIXTURE_REQUIRED');
      const removed = await admin.auth.admin.deleteUser(id);
      if (removed.error) throw new Error('LOCAL_FIXTURE_CLEANUP_FAILED');
      ids.splice(ids.indexOf(id),1);
    },
  };
}

export const initial = {
  // A future anchor avoids the explicitly unresolved payday-onboarding case.
  sustainableIncome: '6000000',
  salaryCreditDay: Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Kolkata',day:'numeric'}).format(new Date())) % 28 + 1,
  declaredCash: '250000',
  obligations: [{ name: 'Synthetic commitment', amount: '2000000', unpaid: '50000', isCreditCardLegacy: false }],
};
export async function rpc(client, name, input, operation = randomUUID(), revision = '0') {
  const result = await client.rpc(name, { p_operation_id: operation, p_expected_revision: revision, p_input: input });
  if (result.error) throw new Error('RPC_TRANSPORT_ERROR');
  return result.data;
}
