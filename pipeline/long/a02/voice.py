"""Voice each chapter of the long video as ONE ElevenLabs take (Jeremy, eleven_v3, stability 0.5, similarity 0.75),
then write out/vo/<chapter>.mp3 and out/vo/<chapter>.json: per beat its spoken words with times and its cue times.
usage: python3 voice.py [chapter ids comma separated | all-missing]"""
import json, sys, base64, subprocess, os, time, re
sys.path[:0] = ['/home/claude/lv', '/home/claude/runner']
import a02_script as S, timing
VOICE = '5gaEGrWSk4v20HMfIhgC'
OUT = '/home/claude/lv/out/vo'
os.makedirs(OUT, exist_ok=True)
want = sys.argv[1] if len(sys.argv) > 1 else 'all-missing'
key = open('/root/.lpkey/k').read().strip()


def tokens(vo):
    """spoken tokens of a beat with the cue numbers that start at each token"""
    out = []
    pend = []
    for tok in vo.split():
        while True:
            m = re.match(r'^\{(\d+)\}(.*)$', tok)
            if not m:
                break
            pend.append(int(m.group(1))); tok = m.group(2)
        if not tok:
            continue
        out.append(dict(w=tok, cues=pend, tag=tok.startswith('[') or tok.endswith(']')))
        pend = []
    return out


for ch in S.CHAPTERS:
    if want == 'all-missing':
        if os.path.exists(f"{OUT}/{ch['id']}.json"):
            continue
    elif ch['id'] not in want.split(','):
        continue
    beats = [(b['key'], tokens(b['vo'])) for b in ch['beats']]
    text = ' '.join(S.clean(b['vo']) for b in ch['beats'])
    body = {'text': text, 'model_id': 'eleven_v3', 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75}}
    json.dump(body, open('/tmp/lv_body.json', 'w'))
    for k in range(3):
        r = subprocess.run(['curl', '-s', '-w', '%{http_code}', '-X', 'POST', '-H', f'xi-api-key: {key}', '-H', 'Content-Type: application/json',
                            '--data', '@/tmp/lv_body.json', f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps',
                            '-o', '/tmp/lv_raw.json'], capture_output=True, text=True)
        if r.stdout.strip() == '200':
            break
        print('http', r.stdout, 'retry'); time.sleep(20)
    d = json.load(open('/tmp/lv_raw.json'))
    open(f"{OUT}/{ch['id']}.mp3", 'wb').write(base64.b64decode(d['audio_base64']))
    sw = timing.words_from_alignment(d['alignment'])
    toks = [t for _, ts in beats for t in ts]
    if len(sw) != len(toks):
        # alignment may leave the emotion tags out: drop them and try again
        toks_nt = [t for t in toks if not t['tag']]
        if len(sw) == len(toks_nt):
            for t in toks:
                t['skip'] = t['tag']
        else:
            print('MISMATCH', ch['id'], len(sw), len(toks)); json.dump(d['alignment'], open(f"{OUT}/{ch['id']}.align.json", 'w')); continue
    it = iter(sw)
    res = []
    for bk, ts in beats:
        words, cues = [], {}
        last = None
        for t in ts:
            if t.get('skip'):
                for cn in t['cues']:
                    cues[cn] = None
                continue
            w, a, b = next(it)
            for cn in t['cues']:
                cues[cn] = a
            for cn, v in list(cues.items()):
                if v is None:
                    cues[cn] = a
            if not t['tag']:
                words.append((t['w'], a, b))
        res.append(dict(key=bk, words=words, cues=cues, t0=words[0][1], t1=words[-1][2]))
    json.dump(res, open(f"{OUT}/{ch['id']}.json", 'w'), indent=0)
    print('voiced', ch['id'], len(text), round(res[-1]['t1'], 1), 's')
