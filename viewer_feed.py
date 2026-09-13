"""Read-only authenticated camera feed. No files or commands exposed."""
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import json,time,base64,secrets,io
from PIL import Image
ROOT=Path(__file__).resolve().parent/'run'
key=ROOT/'viewer-secret'
if not key.exists():key.write_text(secrets.token_urlsafe(32));key.chmod(0o600)
TOKEN=key.read_text().strip()
def latest(name):
    with (ROOT/name).open('rb') as f:
        f.seek(0,2);size=f.tell();f.seek(max(0,size-131072))
        lines=f.read().splitlines()
    for line in reversed(lines):
        try:return json.loads(line)
        except (ValueError,UnicodeDecodeError):pass
    raise ValueError('No complete sample')
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path=='/':
            body=Path(__file__).with_name('viewer.html').read_bytes()
            self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('Referrer-Policy','no-referrer');self.end_headers();self.wfile.write(body);return
        if self.path!='/snapshot' or not secrets.compare_digest(self.headers.get('Authorization',''),'Bearer '+TOKEN):
            self.send_error(404);return
        try:
            stats=latest('bot.jsonl');neural=latest('neural.jsonl')
            view=ROOT/'viewer.ppm'
            if view.exists():
                buffer=io.BytesIO();Image.open(view).save(buffer,format='PNG');png=buffer.getvalue()
            else:
                png=(ROOT/'camera.png').read_bytes();Image.open(io.BytesIO(png)).verify()
            age=time.time()-(ROOT/'bot.jsonl').stat().st_mtime
            data={'online':age<10,'age':round(age,1),'frame':stats['frame'],
                'position':stats['position'],'spikes':stats['spikes'],
                'computeMs':round(stats['compute_seconds']*1000,1),
                'brainSeconds':round(neural['neural_ms']/1000,1),
                'camera':'data:image/png;base64,'+base64.b64encode(png).decode(),
                'readouts':[{'name':r['type']+' '+r['side'],'rate':r['rate_hz']} for r in neural['readouts']]}
            body=json.dumps(data).encode();self.send_response(200)
            self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
        except Exception:
            self.send_error(503,'Feed temporarily unavailable')
    def log_message(self,*args):pass
ThreadingHTTPServer(('127.0.0.1',8768),Handler).serve_forever()
