import { readFile } from 'node:fs/promises';
import { sql, verifyLocalContainer } from '../ph11/local.mjs';
verifyLocalContainer();
try {
  let candidate=await readFile(new URL('../../../supabase/migrations/20261007164321_ph15_card_settlement.sql',import.meta.url),'utf8');
  if(process.argv.includes('--functions-only')) candidate='begin;\n'+candidate.slice(candidate.indexOf('create function phron_private.card_payment')).replaceAll('create function ','create or replace function ');
  await sql(candidate);
  console.log('PASS PH15 local candidate applied; no remote target or migration history changed');
} catch(error) { console.log('FAIL local SQL:',error.diagnostic??error.message); process.exitCode=1; }
