import { readFileSync } from 'node:fs';
import { sql, verifyLocalContainer } from './local.mjs';
verifyLocalContainer();
// Deliberately no db push, remote URL, linked project, or migration-history mutation.
let candidate = readFileSync('supabase/migrations/20261006104126_ph11_core_transactions.sql','utf8');
if (process.argv.includes('--functions-only')) {
  candidate = candidate.slice(candidate.indexOf('create function phron_private.caller_id'))
    .replaceAll('create function ', 'create or replace function ');
  candidate = 'begin; grant phron_writer to postgres with set true;\n' + candidate;
}
await sql(candidate);
console.log('PASS local candidate SQL executed; no remote database or migration history modified');
