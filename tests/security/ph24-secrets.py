"""Read-only repository/history/client scan. Reports locations, never values."""
import base64,hashlib,json,re,subprocess,sys
from pathlib import Path
root=Path.cwd().resolve();out=root/('docs/evidence/PH24/remediation' if '--remediation' in sys.argv else 'docs/evidence/PH24');out.mkdir(parents=True,exist_ok=True)
private=[]
for name in ['.env.local','.env.test']:
 p=root/name
 if p.exists():
  for line in p.read_text(encoding='utf-8-sig').splitlines():
   m=re.match(r'\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$',line)
   if m and not m[1].startswith('NEXT_PUBLIC_') and re.search(r'KEY|SECRET|TOKEN|PASSWORD|DATABASE_URL',m[1]) and len(m[2].strip('"\''))>=16:
    private.append(m[2].strip('"\'').encode())
jwt=re.compile(rb'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+')
findings=[];public_count=0
def scan(data,location):
 global public_count
 kinds=set()
 for value in private:
  if value in data:kinds.add('local-private-value')
 if re.search(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',data):kinds.add('private-key-material')
 for match in jwt.finditer(data):
  try:
   part=match.group().split(b'.')[1];payload=json.loads(base64.urlsafe_b64decode(part+b'='*(-len(part)%4)))
   if payload.get('role')=='service_role':kinds.add('privileged-jwt')
   elif payload.get('role')=='anon':public_count+=1
  except (ValueError,KeyError):pass
 if kinds:findings.append({'location':location,'kinds':sorted(kinds)})
tracked=subprocess.check_output(['git','ls-files','-z']).decode().split('\0');tracked=[x for x in tracked if x]
for name in tracked:
 p=root/name
 if p.exists() and p.suffix not in ('.png','.pdf','.zip'):scan(p.read_bytes(),'working-tree:'+name)
client=list((root/'.next/static').rglob('*'))
for p in client:
 if p.is_file():scan(p.read_bytes(),'client:'+str(p.relative_to(root)).replace('\\','/'))
objects=subprocess.check_output(['git','rev-list','--objects','--all'],text=True).splitlines();names={line.split(' ',1)[0]:line.split(' ',1)[1] for line in objects if ' ' in line}
history=subprocess.Popen(['git','cat-file','--batch'],stdin=subprocess.PIPE,stdout=subprocess.PIPE)
count=0
for line in objects:
 sha=line.split(' ',1)[0];history.stdin.write((sha+'\n').encode());history.stdin.flush();header=history.stdout.readline().decode().split()
 if len(header)!=3:continue
 size=int(header[2]);data=history.stdout.read(size);history.stdout.read(1)
 if header[1]=='blob':count+=1;scan(data,'history:'+sha+':'+names.get(sha,'[unnamed]'))
history.stdin.close();history.wait()
privileged=[]
for name in tracked:
 p=root/name
 if p.suffix in ('.ts','.tsx','.mjs','.json') and p.exists():
  for m in re.finditer(r'NEXT_PUBLIC_[A-Z0-9_]*(?:SERVICE_ROLE|SECRET|PRIVATE|GEMINI|GROQ)[A-Z0-9_]*',p.read_text(encoding='utf-8',errors='replace')):privileged.append({'path':name,'identifier':m.group()})
env=Path('.env.example');empty=all(not line.split('=',1)[1].strip() for line in env.read_text(encoding='utf-8').splitlines() if '=' in line and not line.lstrip().startswith('#'))
result={'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'trackedFiles':len(tracked),'historyBlobs':count,'clientFiles':sum(p.is_file() for p in client),'secretFindings':findings,'privilegedPublicIdentifiers':privileged,'publicAnonOccurrencesClassified':public_count,'envExampleEmpty':empty,'limitations':'exact local private values + privileged JWT/private-key patterns; not a complete entropy scanner; public publishable config is not privileged'}
(out/'secrets-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'findings':len(findings),'privilegedPublicIdentifiers':len(privileged),'historyBlobs':count,'envExampleEmpty':empty}))
raise SystemExit(1 if findings or privileged or not empty else 0)
