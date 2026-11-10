"""Deterministic local package and manifest. Standard library only."""
from pathlib import Path
from hashlib import sha256
from datetime import datetime, timezone
import json, zipfile
root=Path(__file__).parent
archive=root.parent/'Evolution_Rig_Evolution_Lab_v2_0.zip'
exclude={'SHA256SUMS.txt','MANIFEST.json','package_release.py','desktop-preview.png','mobile-preview.png'}
files=sorted(p for p in root.rglob('*') if p.is_file() and '.git' not in p.parts and '__pycache__' not in p.parts and not p.name.endswith('.pyc') and p.name not in exclude)
manifest={'title':'Evolution Rig / Evolution Lab','release':'2.0','schema':1,'entrypoint':'index.html','build':'python3 build.py','dependencies':[], 'files':[{'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':sha256(p.read_bytes()).hexdigest()} for p in files]}
(root/'MANIFEST.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
checks=files+[root/'MANIFEST.json',root/'package_release.py']
(root/'SHA256SUMS.txt').write_text(''.join(f'{sha256(p.read_bytes()).hexdigest()}  {p.relative_to(root).as_posix()}\n' for p in sorted(checks)))
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as out:
    for p in sorted(root.rglob('*')):
        if not p.is_file() or '.git' in p.parts or '__pycache__' in p.parts or p.name.endswith('.pyc') or p.name in {'desktop-preview.png','mobile-preview.png'}:continue
        info=zipfile.ZipInfo('Evolution_Rig_Evolution_Lab_v2_0/'+p.relative_to(root).as_posix())
        info.date_time=(2026,11,9,12,0,0)
        info.compress_type=zipfile.ZIP_DEFLATED
        info.external_attr=0o644<<16
        out.writestr(info,p.read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
print('Created',archive,'bytes',archive.stat().st_size,'entries',len(zipfile.ZipFile(archive).namelist()))
