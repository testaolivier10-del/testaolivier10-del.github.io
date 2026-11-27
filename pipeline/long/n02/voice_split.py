"""Voice a chapter as TWO takes split after its practice question (so the question ends cleanly before the pause timer),
then join them into out/vo/<chapter>.mp3 and .json with 1 s of silence between.  python3 voice_split.py what"""
import json, sys, base64, subprocess, os, time, re
sys.path[:0] = ['/home/claude/lv']
import n02_script as S, timing
VOICE = '5gaEGrWSk4v20HMfIhgC'; OUT = '/home/claude/lv/out/vo'; key = open('/root/.lpkey/k').read().strip()
cid = sys.argv[1]; ch = [c for c in S.CHAPTERS if c['id'] == cid][0]


def tokens(vo):
    out, pend = [], []
    for tok in vo.split():
        while True:
            m = re.match(r'^\{(\d+)\}(.*)$', tok)
            if not m: break
            pend.append(int(m.group(1))); tok = m.group(2)
        if not tok: continue
        out.append(dict(w=tok, cues=pend, tag=tok.startswith('[') or tok.endswith(']'))); pend = []
    return out


def take(beats_, name):
    beats = [(b['key'], tokens(b['vo'])) for b in beats_]
    text = ' '.join(S.clean(b['vo']) for b in beats_)
    json.dump({'text': text, 'model_id': 'eleven_v4', 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75}}, open('/tmp/lv_body.json', 'w'))
    for k in range(3):
        r = subprocess.run(['curl', '-s', '-w', '%{http_code}', '-X', 'POST', '-H', f'xi-api-key: {key}', '-H', 'Content-Type: application/json', '--data', '@/tmp/lv_body.json',
                            f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps', '-o', '/tmp/lv_raw.json'], capture_output=True, text=True)
        if r.stdout.strip() == '200': break
        print('http', r.stdout, 'retry'); time.sleep(20)
    d = json.load(open('/tmp/lv_raw.json')); open(f'/tmp/{name}.mp3', 'wb').write(base64.b64decode(d['audio_base64']))
    sw = timing.words_from_alignment(d['alignment']); toks = [t for _, ts in beats for t in ts]
    if len(sw) != len(toks):
        assert len(sw) == len([t for t in toks if not t['tag']]), ('MISMATCH', len(sw), len(toks))
        for t in toks: t['skip'] = t['tag']
    it = iter(sw); res = []
    for bk, ts in beats:
        words, cues = [], {}
        for t in ts:
            if t.get('skip'):
                for cn in t['cues']: cues[cn] = None
                continue
            w, a, b = next(it)
            for cn in t['cues']: cues[cn] = a
            for cn, v in list(cues.items()):
                if v is None: cues[cn] = a
            if not t['tag']: words.append((t['w'], a, b))
        res.append(dict(key=bk, words=words, cues=cues, t0=words[0][1], t1=words[-1][2]))
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'/tmp/{name}.mp3'], capture_output=True, text=True).stdout)
    print('voiced', name, len(text), round(dur, 1)); return res, dur


i = [j for j, b in enumerate(ch['beats']) if b.get('pause')][0] + 1
A, da = take(ch['beats'][:i], 'ta'); B, db = take(ch['beats'][i:], 'tb')
off = da + 1.0
for b in B:
    b['words'] = [(w, a + off, e + off) for w, a, e in b['words']]; b['cues'] = {k: v + off for k, v in b['cues'].items()}; b['t0'] += off; b['t1'] += off
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', '/tmp/ta.mp3', '-f', 'lavfi', '-t', '1.0', '-i', 'anullsrc=r=44100:cl=mono', '-i', '/tmp/tb.mp3',
                '-filter_complex', '[0:a]aresample=44100,aformat=channel_layouts=mono[a];[2:a]aresample=44100,aformat=channel_layouts=mono[b];[a][1:a][b]concat=n=3:v=0:a=1', '-b:a', '128k', f'{OUT}/{cid}.mp3'], check=True)
json.dump(A + B, open(f'{OUT}/{cid}.json', 'w'), indent=0); print('joined', cid)
