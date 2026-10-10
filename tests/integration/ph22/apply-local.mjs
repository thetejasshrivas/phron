import {readFile} from 'node:fs/promises';
import {sql,verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
if(await sql("select current_database()")!=='postgres')throw new Error('LOCAL_TARGET_REQUIRED');
const migration=await readFile(new URL('../../../supabase/migrations/20261010210000_ph22_bucket_goal_lifecycle.sql',import.meta.url),'utf8');
if(process.argv.includes('--refresh-candidate')){
 if(await sql("select to_regprocedure('public.phron_surface_lifecycle(uuid,text,jsonb)') is not null")!=='t')throw new Error('PH22_INITIAL_REQUIRED');
 const body=migration.slice(migration.indexOf('create function phron_private.surface_lifecycle('),migration.indexOf('create function public.phron_surface_lifecycle('));
 await sql(body.replace('create function','create or replace function'));
}else{
 if(await sql("select to_regprocedure('public.phron_surface_lifecycle(uuid,text,jsonb)') is not null")==='t')throw new Error('PH22_ALREADY_APPLIED');
 await sql(migration);
}
console.log('PASS PH22 candidate applied only to verified local container');
