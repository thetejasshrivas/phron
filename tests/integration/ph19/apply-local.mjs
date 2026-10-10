import { readFile } from 'node:fs/promises';
import { sql, verifyLocalContainer } from '../ph11/local.mjs';

verifyLocalContainer();
const identity = await sql("select current_database()||':'||current_setting('server_version_num')");
if (!identity.startsWith('postgres:')) throw new Error('LOCAL_TARGET_REQUIRED');
const prior = await sql("select to_regclass('public.merchant_memory') is not null or exists(select 1 from information_schema.columns where table_schema='public' and table_name='transactions' and column_name='category_swap_expires_at')");
if (prior === 't') throw new Error('PH19_MIGRATION_ALREADY_PRESENT');
const migration = await readFile(new URL('../../../supabase/migrations/20261010100000_ph19_ingestion.sql', import.meta.url), 'utf8');
if (!migration.startsWith('-- PH-19 local candidate only.') || !migration.includes('create table public.merchant_memory')) throw new Error('PH19_MIGRATION_IDENTITY_MISMATCH');
await sql(migration);
console.log('PASS PH-19 migration applied to verified local Supabase container only; no remote target or history modified');
