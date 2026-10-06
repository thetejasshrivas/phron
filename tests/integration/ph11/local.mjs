import { execFileSync, spawn } from 'node:child_process';

export const container = 'supabase_db_phron-ph11-local';
const docker = process.env.PHRON_TEST_DOCKER ?? 'C:/Users/thete/AppData/Local/Programs/DockerDesktop/resources/bin/docker.exe';
const base = ['--context', 'desktop-linux'];

// No configurable remote database URL. Every SQL call targets this local test container.
export function verifyLocalContainer() {
  const endpoint = execFileSync(docker, [...base, 'context', 'inspect', 'desktop-linux', '--format', '{{.Endpoints.docker.Host}}'], { encoding: 'utf8' }).trim();
  if (endpoint !== 'npipe:////./pipe/dockerDesktopLinuxEngine') throw new Error('LOCAL_TARGET_REQUIRED');
  const name = execFileSync(docker, [...base, 'inspect', container, '--format', '{{.Name}}'], { encoding: 'utf8' }).trim();
  if (name !== '/' + container) throw new Error('LOCAL_TARGET_REQUIRED');
}

export function sql(query) {
  return new Promise((resolve, reject) => {
    const child = spawn(docker, [...base, 'exec', '-i', container, 'psql', '-X', '-qAt', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    let error = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { error += data; });
    child.on('error', () => reject(new Error('LOCAL_SQL_PROCESS_UNAVAILABLE')));
    child.on('close', code => {
      if (code === 0) return resolve(output.trim());
      const failure = new Error(error.includes('does not exist') ? 'SQL_OBJECT_MISSING' : 'SQL_FAILED');
      // Retained only for local diagnosis; run() never prints SQL or row details.
      Object.defineProperty(failure, 'diagnostic', { value: error.match(/^ERROR:.*$/m)?.[0] });
      reject(failure);
    });
    child.stdin.end(query);
  });
}

export function literal(value) { return "'" + String(value).replaceAll("'", "''") + "'"; }

export async function run(cases) {
  let failed = 0;
  for (const [name, execute] of cases) {
    try { await execute(); console.log('PASS ' + name); }
    catch (error) { failed++; console.log('FAIL ' + name + ': ' + (error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : 'ASSERTION_FAILED')); }
  }
  console.log(`${cases.length - failed} passed; ${failed} failed; ${cases.length} total`);
  if (failed) process.exitCode = 1;
}
