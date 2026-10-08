import {readFile} from 'node:fs/promises';
import {sql,verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
await sql(await readFile(new URL('../../../supabase/migrations/20261008080545_ph16_goal_cancellation.sql',import.meta.url),'utf8'));
console.log('PASS PH16 cancellation migration applied locally only');
