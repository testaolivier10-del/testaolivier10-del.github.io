"""Client for the LevlPrep Modal video generator.
usage: python3 lpvid.py submit job.json -> prints call_id ; python3 lpvid.py wait <call_id> out.mp4 ; python3 lpvid.py status <call_id>"""
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
cmd = sys.argv[1]
if cmd == 'submit':
    job = json.load(open(sys.argv[2]))
    for k in ('image', 'last'):
        if k in job: job[k + '_b64'] = base64.b64encode(open(job.pop(k), 'rb').read()).decode()
    if not ledger.can_spend(ledger.EST['video']): sys.exit('Not enough Modal budget left for this run (its reserved share or the month) (python3 ledger.py month). Use library stills instead.')
    cid = req('/submit', job, 'POST')[1]['call_id']; ledger.start(cid, 'video ' + job.get('mode', 'i2v')); print(cid)
elif cmd == 'status':
    s, b = req('/result?call_id=' + sys.argv[2]); print(s, {k: v for k, v in b.items() if k != 'video_b64'})
elif cmd == 'wait':
    t0 = time.time()
    while True:
        s, b = req('/result?call_id=' + sys.argv[2])
        if s == 202: time.sleep(20); continue
        if 'video_b64' in b:
            open(sys.argv[3], 'wb').write(base64.b64decode(b['video_b64'])); ledger.finish(sys.argv[2]); print('saved', sys.argv[3], round(time.time() - t0), 's'); break
        ledger.finish(sys.argv[2]); print(s, b); break
