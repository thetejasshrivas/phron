import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sql, verifyLocalContainer } from './local.mjs';
verifyLocalContainer();
// Refuse to delete an application account. Only the named disposable local candidate
// objects are rebuilt, after test fixtures have been explicitly cleaned up.
assert.equal(await sql('select count(*) from public.users;'), '0');
await sql(`begin;
drop function public.phron_onboard(uuid,text,jsonb),public.phron_manual_spend(uuid,text,jsonb);
drop schema phron_private cascade;
drop table public.card_payment_allocations,public.card_liability_payments,public.transactions,
public.operation_log,public.cycle_buckets,public.buckets,public.cycle_obligations,
public.obligations,public.pay_cycles,public.financial_profiles,public.users;
drop owned by phron_writer;
drop role phron_writer;
commit;`);
await sql(readFileSync('supabase/migrations/20261006104126_ph11_core_transactions.sql','utf8'));
console.log('PASS complete migration applied to empty local application schema');
