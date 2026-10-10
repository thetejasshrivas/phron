import { readFile } from 'node:fs/promises';
import { sql, verifyLocalContainer } from '../ph11/local.mjs';

verifyLocalContainer();
const identity = await sql("select current_database()||':'||current_setting('server_version_num')");
if (!identity.startsWith('postgres:')) throw new Error('LOCAL_TARGET_REQUIRED');
const migration = await readFile(new URL('../../../supabase/migrations/20261010120000_ph19_d18_category_memory.sql', import.meta.url), 'utf8');
if (!migration.startsWith('-- PH-19 D18 category confirmation.') || !migration.includes('phron_ingest_confirm_category')) throw new Error('D18_MIGRATION_IDENTITY_MISMATCH');
await sql(migration);
console.log('PASS D18 category-confirmation candidate applied/reapplied to verified local Supabase container only; no remote target or migration history modified');
