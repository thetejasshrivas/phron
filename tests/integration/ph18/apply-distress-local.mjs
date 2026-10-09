import {readFile} from 'node:fs/promises';
import {sql,verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
await sql(await readFile(new URL('../../../supabase/migrations/20261009044907_ph18_distress_allowances.sql',import.meta.url),'utf8'));
console.log('PASS D14 applied to verified local database only');
