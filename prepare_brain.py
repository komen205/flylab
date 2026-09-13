"""Download checksum-locked data and build the unmodified upstream baseline."""
import hashlib,json,subprocess,sys,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parent.parent/'minecraft-flybrain'
lock=json.loads((root/'data-provenance/malecns_v1/source.lock.json').read_text())
data=root/'connectome_data/malecns_v1';data.mkdir(parents=True,exist_ok=True)
for name,meta in lock.items():
    target=data/name
    if not target.exists():
        print('Downloading',name,flush=True)
        temp=target.with_suffix('.partial')
        urllib.request.urlretrieve(meta['url'],temp)
        temp.replace(target)
    with target.open('rb') as f:digest=hashlib.file_digest(f,'sha256').hexdigest()
    if digest!=meta['sha256']:raise ValueError('Checksum failed: '+name)
(data/'source.lock.json').write_text(json.dumps(lock,indent=2))
for module in ['doom.connectome','doom.prepare','doom.build_kernel']:
    subprocess.run([sys.executable,'-m',module],cwd=root,check=True)
