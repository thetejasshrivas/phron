import {readFile} from 'node:fs/promises';
import {sql,verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
await sql(await readFile(new URL('../../../supabase/migrations/20261010223000_ph22_ingestion_replay.sql',import.meta.url),'utf8'));
console.log('PASS PH22 replay candidate applied only to verified local container');
