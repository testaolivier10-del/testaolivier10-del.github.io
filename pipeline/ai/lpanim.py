"""Client for Wan-Animate on the LevlPrep Modal app (painted character + driving video of a real person).
usage: python3 lpanim.py download                      (one time: fetch the weights on a cheap CPU machine)
       python3 lpanim.py submit job.json               -> call id   job: {"image": "char.png", "video": "drive.mp4", "prompt": "appearance and background only", "width": 832, "height": 480, "seed": 7}
       python3 lpanim.py wait <call id> out.mp4
Spend goes through ledger.py like every Modal call (reservation required; never past the month's free credit)."""
import sys, json, time, base64, urllib.request, urllib.error, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ledger
EP = open('/root/.lpkey/mep').read().strip(); KEY = open('/root/.lpkey/mk').read().strip()
def req(path, data=None, method='GET'):
    r = urllib.request.Request(EP + path, data=json.dumps(data).encode() if data is not None else None, method=method,
                               headers={'x-lp-key': KEY, 'content-type': 'application/json'})
    try:
        with urllib.request.urlopen(r, timeout=300) as resp: return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read() or b'{}')
        except Exception: return e.code, {}
cmd = sys.argv[1]
if cmd == 'download':
    print(req('/download', {'mode': 'animate'}, 'POST'))
elif cmd == 'submit':
    job = json.load(open(sys.argv[2]))
    job['image_b64'] = base64.b64encode(open(job.pop('image'), 'rb').read()).decode()
    job['video_b64'] = base64.b64encode(open(job.pop('video'), 'rb').read()).decode()
    if not ledger.can_spend(ledger.EST['animate']): sys.exit('Not enough Modal budget left (python3 ledger.py month).')
    s, b = req('/animate', job, 'POST')
    if 'call_id' not in b: sys.exit(f'submit failed {s} {b}')
    print(b['call_id'], flush=True); ledger.start(b['call_id'], 'animate')
elif cmd == 'wait':
    t0 = time.time()
    while True:
        s, b = req('/result?call_id=' + sys.argv[2])
        if s == 202: time.sleep(20); continue
        if 'video_b64' in b:
            open(sys.argv[3], 'wb').write(base64.b64decode(b['video_b64'])); ledger.finish(sys.argv[2]); print('saved', sys.argv[3], round(time.time() - t0), 's'); break
        ledger.finish(sys.argv[2]); print(s, json.dumps(b)[:6000]); break
