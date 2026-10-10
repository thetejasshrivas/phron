"""Sanitize disposable local Playwright failure traces before saving evidence."""
import json
import re
import sys
import zipfile
from pathlib import Path

source, target = map(lambda x: Path(x).resolve(), sys.argv[1:])
root = Path('docs/evidence/PH23').resolve()
assert source.parent == target.parent and source.parent in (root, root / 'remediation') and source.name.endswith('-raw.zip')
token = re.compile(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|base64-[A-Za-z0-9_=+/-]{60,}')
secret_keys = {'authorization', 'cookie', 'set-cookie', 'apikey', 'access_token', 'refresh_token', 'cookies'}

def clean(value):
    if isinstance(value, dict):
        if str(value.get('name', '')).lower() in secret_keys:
            return {k: '[REDACTED]' if k == 'value' else clean(v) for k, v in value.items()}
        return {k: '[REDACTED]' if k.lower() in secret_keys else clean(v) for k, v in value.items()}
    if isinstance(value, list):
        return [clean(item) for item in value]
    if isinstance(value, str):
        return token.sub('[REDACTED_SESSION]', value)
    return value

with zipfile.ZipFile(source) as original, zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as output:
    for entry in original.infolist():
        data = original.read(entry.filename)
        try:
            text = data.decode('utf-8')
            lines = []
            for line in text.splitlines():
                try:
                    lines.append(json.dumps(clean(json.loads(line))))
                except ValueError:
                    lines.append(token.sub('[REDACTED_SESSION]', line))
            data = ('\n'.join(lines)+'\n').encode('utf-8')
            assert not token.search(data.decode('utf-8'))
        except UnicodeDecodeError:
            pass  # Screenshots are synthetic fixture images, never auth files.
        output.writestr(entry.filename, data)
source.unlink()  # Only the validated newly created raw trace in PH23 evidence.
