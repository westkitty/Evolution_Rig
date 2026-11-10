"""Non-mutating build-parity check against source, for local or CI use."""
from pathlib import Path
import subprocess
R=Path(__file__).resolve().parents[1]
before=(R/'index.html').read_bytes()
result=subprocess.run(['python3','build.py'],cwd=R,capture_output=True,text=True,check=True)
after=(R/'index.html').read_bytes()
assert before==after,'Compiled app differs from recorded source; update index.html before publishing.'
assert b'crochet' not in after.lower()
assert b'RigLab' in after
print('PASS: deterministic source build matches index.html byte-for-byte; forbidden content absent.')
