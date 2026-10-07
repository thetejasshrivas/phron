import { readFile } from 'node:fs/promises';
import { sql, verifyLocalContainer } from '../ph11/local.mjs';
verifyLocalContainer();
try {
  await sql(await readFile(new URL('../../../supabase/migrations/20261007060205_ph12_authorized_snapshot_read.sql', import.meta.url),'utf8'));
  console.log('PASS PH-12 local migration applied');
} catch (error) {
  console.log('FAIL local migration:',error.diagnostic ?? error.message);
  process.exitCode=1;
}
