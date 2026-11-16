"""Tiny server for the store:  python3 serve.py [port]

Serves the site, plus one route for Try it on:
  GET  /api/tryon   -> {"proxy": true, "signedIn": true|false}
  POST /api/tryon   (multipart: person, garment) -> {"url": "data:image/jpeg;base64,..."}
                    or 429 {"error": "quota", "retry": "HH:MM:SS"} / 502 {"error": "busy"}

It calls the free Hugging Face try-on demo (TRY_SPACE). If you start the server with your own Hugging Face
access token in the HF_TOKEN environment variable, the daily allowance is your account's instead of this
computer's anonymous one. The token is only sent to Hugging Face, never to the page.
"""
import base64, email, email.policy, functools, http.server, json, os, re, sys, urllib.request, uuid

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
TRY_SPACE = 'https://franciszzj-leffa.hf.space'
MAX_UPLOAD = 15 * 1024 * 1024
TOKEN = os.environ.get('HF_TOKEN', '').strip()   # only what you pass in when starting the server


class TryError(Exception):
    def __init__(self, kind, retry=None):
        super().__init__(kind); self.kind, self.retry = kind, retry


def try_on(person, garment):
    """Run one try-on on the Space; returns the result image bytes and their content type."""
    base, auth = TRY_SPACE + '/gradio_api', ({'Authorization': 'Bearer ' + TOKEN} if TOKEN else {})
    def call(url, data=None, headers=None, timeout=60):
        return urllib.request.urlopen(urllib.request.Request(url, data, {**auth, **(headers or {})}), timeout=timeout)
    cfg = json.load(call(TRY_SPACE + '/config'))
    fn = next((d['id'] for d in cfg['dependencies'] if d.get('api_name') == 'leffa_predict_vt'), None)
    if fn is None: raise TryError('busy')
    def upload(blob, name):
        b = '----nm' + uuid.uuid4().hex
        body = (f'--{b}\r\nContent-Disposition: form-data; name="files"; filename="{name}"\r\nContent-Type: image/jpeg\r\n\r\n').encode() + blob + f'\r\n--{b}--\r\n'.encode()
        return {'path': json.load(call(base + '/upload', body, {'Content-Type': 'multipart/form-data; boundary=' + b}))[0], 'meta': {'_type': 'gradio.FileData'}}
    p, g = upload(person, 'person.jpg'), upload(garment, 'garment.jpg')
    sh = uuid.uuid4().hex[:11]
    join = {'data': [p, g, False, 30, 2.5, 42, 'viton_hd', 'upper_body', False], 'fn_index': fn, 'session_hash': sh, 'event_data': None, 'trigger_id': None}
    call(base + '/queue/join', json.dumps(join).encode(), {'Content-Type': 'application/json'})
    for line in call(f'{base}/queue/data?session_hash={sh}', timeout=300):
        line = line.decode('utf-8', 'replace').strip()
        if not line.startswith('data:'): continue
        try: m = json.loads(line[5:])
        except ValueError: continue
        if m.get('msg') == 'unexpected_error': raise TryError('busy')
        if m.get('msg') == 'process_completed':
            out = m.get('output') or {}
            if m.get('success') and out.get('data') and out['data'][0]:
                r = call(out['data'][0]['url'], timeout=60)
                return r.read(), r.headers.get('Content-Type', 'image/jpeg')
            why = f"{m.get('title') or ''} {out.get('error') or ''}"
            if re.search('quota', why, re.I):
                t = re.search(r'(\d+:\d{2}:\d{2})', why)
                raise TryError('quota', t.group(1) if t else None)
            raise TryError('busy')
    raise TryError('busy')


class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def send_json(self, code, obj):
        b = json.dumps(obj).encode()
        self.send_response(code); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)

    def do_GET(self):
        if self.path.split('?')[0] == '/api/tryon':
            return self.send_json(200, {'proxy': True, 'signedIn': bool(TOKEN)})
        return super().do_GET()

    def do_POST(self):
        if self.path.split('?')[0] != '/api/tryon': return self.send_error(404)
        n = int(self.headers.get('Content-Length') or 0)
        if not n or n > MAX_UPLOAD: return self.send_json(413, {'error': 'size'})
        msg = email.message_from_bytes(b'Content-Type: ' + self.headers.get('Content-Type', '').encode() + b'\r\n\r\n' + self.rfile.read(n), policy=email.policy.HTTP)
        parts = {p.get_param('name', header='content-disposition'): p.get_payload(decode=True) for p in msg.iter_parts()} if msg.is_multipart() else {}
        if not parts.get('person') or not parts.get('garment'): return self.send_json(400, {'error': 'missing'})
        try:
            img, typ = try_on(parts['person'], parts['garment'])
            return self.send_json(200, {'url': f'data:{typ};base64,' + base64.b64encode(img).decode()})
        except TryError as e:
            return self.send_json(429 if e.kind == 'quota' else 502, {'error': e.kind, 'retry': e.retry})
        except Exception as e:   # network trouble with the Space: tell the page "busy", keep the details here
            print('try-on failed:', type(e).__name__, e, file=sys.stderr)
            return self.send_json(502, {'error': 'busy'})


print(f'Serving on http://localhost:{PORT}   (try-on: {"your Hugging Face account" if TOKEN else "anonymous, small daily allowance"})', flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(H, directory=ROOT)).serve_forever()
