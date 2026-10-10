import { readFile } from 'node:fs/promises';
import { sql, verifyLocalContainer } from '../ph11/local.mjs';
verifyLocalContainer();
if((await sql("select current_database()||':'||current_setting('server_version_num')")).split(':')[0]!=='postgres')throw new Error('LOCAL_TARGET_REQUIRED');
const migration=await readFile(new URL('../../../supabase/migrations/20261010160000_ph21_surfaces.sql',import.meta.url),'utf8');
if(process.argv.includes('--refresh-candidate')){
 if(await sql("select to_regprocedure('public.phron_surface_source()') is not null")!=='t')throw new Error('PH21_INITIAL_APPLY_REQUIRED');
 const read=migration.slice(migration.indexOf('create function phron_private.surface_source()'),migration.indexOf('create function public.phron_surface_source()'));
 const config=migration.slice(migration.indexOf('create function phron_private.surface_config('),migration.indexOf('create function public.phron_surface_config('));
 const remaining=migration.slice(migration.indexOf('create or replace function public.phron_active_custom_buckets()'));
 await sql('begin;'+read.replace('create function','create or replace function')+config.replace('create function','create or replace function')+remaining.replaceAll('create function','create or replace function'));
}else{
 if(await sql("select to_regprocedure('public.phron_surface_source()') is not null")==='t')throw new Error('PH21_ALREADY_APPLIED');
 await sql(migration);
}
console.log('PASS PH-21 candidate applied only to verified local test container');
