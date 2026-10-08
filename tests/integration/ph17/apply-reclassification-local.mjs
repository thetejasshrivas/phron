import {readFile} from 'node:fs/promises';
import {sql,verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
await sql(await readFile(new URL('../../../supabase/migrations/20261008132750_ph17_drift_reclassification.sql',import.meta.url),'utf8'));
console.log('PASS local residual reclassification migration applied');
