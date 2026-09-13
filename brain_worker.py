"""Fixed full MaleCNS baseline. JSON pixels in, neural actions out. No learning."""
import sys,json,base64,hashlib
from pathlib import Path
import numpy as np
from PIL import Image
from retina import retinal_samples

UPSTREAM=Path(__file__).resolve().parent.parent/'minecraft-flybrain'
sys.path.insert(0,str(UPSTREAM))
from doom.native import NativeBrain
from doom.engine import NeuralControls

root=UPSTREAM/'outputs/doom/malecns_v1'
manifest=json.loads((root/'manifest.json').read_text())
brain=NativeBrain(root/'graph.npz')
controls=NeuralControls(manifest['readouts'],mode='bci')
run=Path(__file__).resolve().parent/'run'; run.mkdir(exist_ok=True)
print(json.dumps({'ready':True,'neurons':brain.n,'edges':len(brain.post),'learning':False}),flush=True)
for line in sys.stdin:
    try:
        req=json.loads(line)
        if set(req)!={'rgb','width','height','frame'}: raise ValueError('Only camera pixels and frame ID are accepted')
        w,h=req['width'],req['height']
        if (w,h)!=(64,48):raise ValueError('Expected 64x48 RGB')
        rgb=np.frombuffer(base64.b64decode(req['rgb'],validate=True),dtype=np.uint8).reshape(h,w,3)
        light=retinal_samples(rgb,brain.uv)
        counts,wall=brain.step(light,50.0)
        action=controls.decode(counts,.05)
        result={'frame':req['frame'],'turn':action['turn'],'forward':action['forward'],
            'attack':bool(action['attack']),'spikes':int(counts.sum()),'neural_ms':brain.sim_ms,'compute_seconds':wall,
            'pixel_sha256':hashlib.sha256(rgb.tobytes()).hexdigest(),
            'readouts':action['readouts']}
        Image.fromarray(rgb).resize((640,480),Image.Resampling.NEAREST).save(run/'camera.png')
        with (run/'neural.jsonl').open('a') as f:f.write(json.dumps(result)+'\n')
        print(json.dumps(result),flush=True)
    except Exception as e:
        print(json.dumps({'error':str(e)}),flush=True)
        break
