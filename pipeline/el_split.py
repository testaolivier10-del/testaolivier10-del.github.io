import json, base64, subprocess, re, sys, os, io, wave
sys.path.insert(0, '/home/claude/lp')
def load(path):
    """Accept a raw ElevenLabs with-timestamps JSON or a saved Zapier tool result that wraps it."""
    d = json.load(open(path))
    if isinstance(d, dict) and "results" in d: d = d["results"][0]
    if isinstance(d, dict) and "body" in d: d = d["body"] if isinstance(d["body"], dict) else json.loads(d["body"])
    return d
def split(resp, beats, outdir):
    os.makedirs(outdir, exist_ok=True)
    open('/tmp/claude-0/full.mp3', 'wb').write(base64.b64decode(resp['audio_base64']))
    subprocess.run('ffmpeg -y -loglevel error -i /tmp/claude-0/full.mp3 -ar 44100 -ac 1 /tmp/claude-0/full.wav', shell=True, check=True)
    al = resp['alignment']; chars = al['characters']; st = al['character_start_times_seconds']; en = al['character_end_times_seconds']
    full = "".join(chars); cur = 0; spans = []
    for k, text in beats:
        i = full.find(text, cur)
        if i < 0:
            text = re.sub(r'\s+', ' ', re.sub(r'\[[^\]]+\]\s*', '', text)).strip()
            i = full.find(text, cur)
        assert i >= 0, (k, text[:30], full[cur:cur+40])
        j = i + len(text); spans.append((k, i, j)); cur = j
    for n, (k, i, j) in enumerate(spans):
        a = st[i]; jj = j - 1
        while jj > i and not chars[jj].isalnum(): jj -= 1
        b = en[jj]
        prev_end = en[spans[n-1][2]-1] if n else 0
        nxt = st[spans[n+1][1]] if n + 1 < len(spans) else b + 0.3
        s = max(prev_end + 0.01, a - 0.05) if n else max(0, a - 0.05); e = min(nxt - 0.01, b + 0.12)
        subprocess.run(f'ffmpeg -y -loglevel error -i /tmp/claude-0/full.wav -ss {s:.3f} -to {e:.3f} -af "afade=t=in:d=0.01,areverse,afade=t=in:d=0.03,areverse" /tmp/claude-0/seg.wav', shell=True, check=True)
        sub = dict(characters=chars[i:j], character_start_times_seconds=[x - s for x in st[i:j]], character_end_times_seconds=[x - s for x in en[i:j]])
        json.dump(dict(audio_base64=base64.b64encode(open('/tmp/claude-0/seg.wav', 'rb').read()).decode(), alignment=sub), open(f'{outdir}/{k}.el.json', 'w'))
    segs = []
    for n, (k, i, j) in enumerate(spans):
        a = st[i]; jj = j - 1
        while jj > i and not chars[jj].isalnum(): jj -= 1
        b = en[jj]; prev_end = en[spans[n-1][2]-1] if n else 0
        nxt = st[spans[n+1][1]] if n + 1 < len(spans) else b + 0.3
        segs.append((max(prev_end + 0.01, a - 0.05) if n else max(0, a - 0.05), min(nxt - 0.01, b + 0.12)))
    gaps = {k: round(segs[n+1][0] - segs[n][1], 3) for n, (k, i, j) in enumerate(spans[:-1])}
    json.dump(gaps, open(f'{outdir}/offsets.json', 'w'))
    print(outdir, [(k, round(st[i], 2)) for k, i, j in spans], gaps)
def beats_of(mod, keys=None):
    m = __import__(mod)
    out = [(b['key'], re.sub(r'\{\d\}', '', b['vo'])) for b in m.SPEC['beats']]
    if keys: out = [x for x in out if x[0] in keys]
    return m.SPEC['id'], out

if __name__ == "__main__":
    cmd, mod = sys.argv[1], sys.argv[2]
    if cmd == "text":
        keys = sys.argv[3].split(",") if len(sys.argv) > 3 else None
        sid, bs = beats_of(mod, keys); t = " ".join(x[1] for x in bs)
        print(t); print(len(t), "characters", file=sys.stderr)
    else:
        keys = sys.argv[4].split(",") if len(sys.argv) > 4 else None
        sid, bs = beats_of(mod, keys); split(load(sys.argv[3]), bs, f'/home/claude/lp/out/{sid}')
