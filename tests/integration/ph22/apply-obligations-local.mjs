import {readFile} from 'node:fs/promises';
import {sql,verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
if(await sql("select to_regprocedure('public.phron_obligation_records()') is not null")==='t')throw new Error('PH22_OBLIGATIONS_ALREADY_APPLIED');
await sql(await readFile(new URL('../../../supabase/migrations/20261010220000_ph22_obligation_read.sql',import.meta.url),'utf8'));
console.log('PASS PH22 obligation candidate applied only to verified local container');
