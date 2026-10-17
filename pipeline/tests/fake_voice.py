"""Rebuild per-beat ElevenLabs-style alignment files from the posted video's audio (forced alignment),
so the new visuals line up with the exact same voice track without spending voice credits."""
import json, re, subprocess, base64, os, sys
sys.path.insert(0, '/home/claude/lp')
import beats_w1014 as B
ID = sys.argv[1]; SHIFT = 0.12; T_END = 31.62
out = f"/home/claude/lp/out/{ID}"; os.makedirs(out, exist_ok=True)
segs = json.load(open('/home/claude/work/align.json'))
segs = [(re.sub(r"\(\d\)", "", w), s + SHIFT, e + SHIFT) for w, s, e in segs]
i = 0; starts = {}; ends = {}; keys = []
for b in B.ASPIRIN:
    k = b["key"]; clean = re.sub(r"\{\d\}", "", b["vo"])
    if not clean.strip(): continue
    words = clean.split(" "); ws = segs[i:i + len(words)]; i += len(words)
    assert [re.sub(r"[^a-z']", "", w.lower()) for w in words] == [w for w, _, _ in ws], (words, ws)
    t0 = ws[0][1]; D = ws[-1][2] - t0 + 0.05
    chars, st = [], []
    for wi, (w, (_, s, e)) in enumerate(zip(words, ws)):
        for ci, ch in enumerate(w):
            chars.append(ch); st.append(round(s - t0 + (e - s) * ci / len(w), 3))
        if wi < len(words) - 1:
            chars.append(" "); st.append(round(e - t0, 3))
    subprocess.run(f'ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=44100:cl=mono -t {D:.3f} -c:a libmp3lame -b:a 64k {out}/{k}_sil.mp3', shell=True, check=True)
    al = dict(characters=chars, character_start_times_seconds=st, character_end_times_seconds=st[1:] + [D])
    json.dump(dict(audio_base64=base64.b64encode(open(f"{out}/{k}_sil.mp3", "rb").read()).decode(), alignment=al), open(f"{out}/{k}.el.json", "w"))
    starts[k] = t0; ends[k] = t0 + D; keys.append(k)
gaps = {}
for a, b in zip(keys, keys[1:]): gaps[a] = round(starts[b] - ends[a], 3)
gaps[keys[-1]] = round(T_END - ends[keys[-1]], 3)
json.dump(gaps, open(f"{out}/offsets.json", "w")); print(starts, gaps)
