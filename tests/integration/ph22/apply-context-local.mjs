import {readFile} from 'node:fs/promises';
import {sql,verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
if(await sql("select to_regprocedure('public.phron_recovery_context()') is not null")==='t')throw new Error('PH22_CONTEXT_ALREADY_APPLIED');
try{await sql(await readFile(new URL('../../../supabase/migrations/20261010213000_ph22_recovery_context.sql',import.meta.url),'utf8'));}catch(error){console.error(error.diagnostic??'LOCAL_SQL_FAILED');process.exit(1);}
console.log('PASS PH22 context candidate applied only to verified local container');
