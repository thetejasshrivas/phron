import {readFile} from 'node:fs/promises';
import {sql,verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
let candidate=await readFile(new URL('../../../supabase/migrations/20261008131409_ph17_cycle_reconciliation.sql',import.meta.url),'utf8');
if(process.argv.includes('--functions-only'))candidate='begin;\n'+candidate.slice(candidate.indexOf('create or replace function phron_private.read_snapshot')).replaceAll('create function ','create or replace function ');
await sql(candidate);
console.log('PASS PH17 migration applied locally');
