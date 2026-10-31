"""captions.srt from the voiced word timings, and the YouTube package."""
import sys, re
sys.path.insert(0, '/home/claude/lv')
import tl, a02_script as S
T = tl.build()
def ts(x):
    h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f'{h:02d}:{m:02d}:{int(s):02d},{int((s % 1) * 1000):03d}'
cues = []
for b in sorted(T['beats'].values(), key=lambda b: b['t0']):
    ws = [w for w in b['words'] if not re.fullmatch(r'\[.*\]', w[0])]
    cur = []
    for w in ws:
        cur.append(w)
        txt = ' '.join(x[0] for x in cur)
        if len(txt) > 38 or w[0].endswith(('.', '?', '!')) or (w[0].endswith(',') and len(txt) > 24):
            cues.append((cur[0][1], cur[-1][2], txt)); cur = []
    if cur:
        cues.append((cur[0][1], cur[-1][2], ' '.join(x[0] for x in cur)))
with open('out/captions.srt', 'w') as f:
    for i, (a, b, s) in enumerate(cues):
        b = max(b, a + 0.8)
        if i + 1 < len(cues):
            b = min(b, cues[i + 1][0] - 0.02)
        f.write(f'{i + 1}\n{ts(a)} --> {ts(b)}\n{s}\n\n')
chap = []
for ch in S.CHAPTERS:
    cs = [s for s in T['segs'] if s['kind'] == 'card' and s['chapter'] == ch['id']]
    t = cs[0]['t0'] if cs else 0
    chap.append(f"{int(t // 60)}:{int(t % 60):02d} {ch['title']}")
print(len(cues), 'cues'); print('\n'.join(chap))
open('out/chapters.txt', 'w').write('\n'.join(chap))
