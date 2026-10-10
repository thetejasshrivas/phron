import {readFile} from 'node:fs/promises';
import {sql,verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
if(await sql("select to_regclass('phron_private.commitment_safety') is not null")==='t')throw new Error('PH22_SAFETY_ALREADY_APPLIED');
await sql(await readFile(new URL('../../../supabase/migrations/20261010230000_ph22_commitment_safety.sql',import.meta.url),'utf8'));
console.log('PASS D24 candidate applied only to verified local container');
