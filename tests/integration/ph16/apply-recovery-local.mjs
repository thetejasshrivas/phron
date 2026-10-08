import {readFile} from 'node:fs/promises';
import {sql,verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
let candidate=await readFile(new URL('../../../supabase/migrations/20261008124355_ph16_recovery_acceptance.sql',import.meta.url),'utf8');
if(process.argv.includes('--functions-only'))candidate='begin;\n'+candidate.slice(candidate.indexOf('create function phron_private.accept_recovery')).replaceAll('create function ','create or replace function ');
await sql(candidate);
console.log('PASS local recovery migration applied');
