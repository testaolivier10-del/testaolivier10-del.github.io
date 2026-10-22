"""Image client. usage: python3 lpimg.py job.json outprefix   (job: refs: [paths], prompts: [...], width, height, steps, cfg, seed)"""
import sys, json, time, base64, urllib.request, urllib.error, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ledger
EP = open('/root/.lpkey/mep').read().strip(); KEY = open('/root/.lpkey/mk').read().strip()
def req(path, data=None, method='GET'):
    r = urllib.request.Request(EP + path, data=json.dumps(data).encode() if data is not None else None, method=method,
                               headers={'x-lp-key': KEY, 'content-type': 'application/json'})
    try:
        with urllib.request.urlopen(r, timeout=300) as resp: return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b'{}')
job = json.load(open(sys.argv[1])); pre = sys.argv[2]
job['refs_b64'] = [base64.b64encode(open(p, 'rb').read()).decode() for p in job.pop('refs')]
n = max(1, len(job.get('prompts', [])))
if not ledger.can_spend(ledger.EST['images'] * n): sys.exit('Modal call refused (see the message above). Use library art or Gemini in Chrome (claude/levlprep-studio-wan.md), or redesign the shot; a stills fallback never ships.')
s, b = req('/images', job, 'POST'); cid = b['call_id']; print('call', cid, flush=True); ledger.start(cid, 'images', n)
t0 = time.time()
while True:
    s, b = req('/result?call_id=' + cid)
    if s == 202: time.sleep(15); continue
    if 'images_b64' in b:
        for i, im in enumerate(b['images_b64']):
            open(f'{pre}_{i}.png', 'wb').write(base64.b64decode(im))
        ledger.finish(cid); print('saved', len(b['images_b64']), round(time.time() - t0), 's'); break
    ledger.finish(cid); print(s, b); break
