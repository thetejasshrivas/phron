import {readFile} from 'node:fs/promises';
import {sql,verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
await sql(await readFile(new URL('../../../supabase/migrations/20261008183014_ph18_nonpositive_commitment_cap.sql',import.meta.url),'utf8'));
console.log('PASS D13 zero-cap migration applied to verified local test container only');
