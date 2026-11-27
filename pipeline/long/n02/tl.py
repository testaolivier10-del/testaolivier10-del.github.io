"""Timeline for the long video: chapter cards, beats, pause timers, and the voice track.
PACING (Olivier, 2026-11-24: the narration felt like one continuous stream): the voice plays at its natural speed (no speed up),
and the silences are set from the word timings, never by changing the words: at least 0.8 s between sentences, 0.5 s at a comma or
colon where the voice already paused, 1.2 s after each beat (an idea) and 1.5 s around story scenes. A practice question ends,
0.7 s passes, the countdown runs, and the answer starts 0.6 s after it. Only real silences are stretched: a cut is made only where the take itself is silent for 50 ms or more (measured on the audio,
because the word timings are approximate; a first version cut by the timings alone and clipped words). Other boundaries are left as voiced.
tl.build() -> dict(segs=[...], beats={key: beat}, DUR, cuts={chapter: [(take time, extra seconds)]}, base={chapter: t})
  seg: dict(kind='card'|'beat'|'pause', t0, t1, chapter, key?)
  beat: dict(key, chapter, t0, t1, words=[(w, a, b)], cues={n: t}, story, pause)"""
import json, os, subprocess, sys
sys.path.insert(0, '/home/claude/lv')
import n02_script as S

CARD = 2.6
SENT, COMMA, BEAT, STORY = 0.8, 0.5, 1.2, 1.5
PRE_TIMER, POST_TIMER = 0.7, 0.6
VO = '/home/claude/lv/out/vo'
OUT = '/home/claude/lv/out'


def _end(w):
    w = w.rstrip('"\')')
    if w.endswith('...'): return 'c'
    if w.endswith(('.', '?', '!')): return 's'
    if w.endswith((',', ':', ';')): return 'c'
    return ''


_ENV = {}
FR = 220 / 44100.0


def _env(ch):
    """loudness of the take in 5 ms frames (dB), cached"""
    if ch not in _ENV:
        import numpy as np
        r = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{VO}/{ch}.mp3', '-f', 'f32le', '-ac', '1', '-ar', '44100', '-'], capture_output=True, check=True)
        x = np.frombuffer(r.stdout, np.float32); n = 220; m = len(x) // n
        _ENV[ch] = 20 * np.log10(np.sqrt((x[:m * n].reshape(m, n) ** 2).mean(1)) + 1e-9)
    return _ENV[ch]


def _quiet(env, t0, t1, thr=-48.0, need=0.05):
    """the middle and length of the longest truly silent run between t0 and t1 (None if under `need` seconds)"""
    a, b = max(0, int(t0 / FR)), min(len(env), int(t1 / FR)); best = (0, 0); st = None
    for i in range(a, b + 1):
        q = i < b and env[i] < thr
        if q and st is None: st = i
        if not q and st is not None:
            if i - st > best[1] - best[0]: best = (st, i)
            st = None
    ln = (best[1] - best[0]) * FR
    return ((best[0] + best[1]) / 2 * FR, ln) if ln >= need else (None, 0.0)


def build():
    t = 0.0
    segs, beats, cuts, bases, skipped = [], {}, {}, {}, []
    for ci, ch in enumerate(S.CHAPTERS):
        d = {b['key']: b for b in json.load(open(f"{VO}/{ch['id']}.json"))}
        if ci > 0:
            segs.append(dict(kind='card', t0=t, t1=t + CARD, chapter=ch['id'], title=ch['title'], n=ci)); t += CARD
        bl = ch['beats']
        flat = [(bi, w, a, e) for bi, b in enumerate(bl) for (w, a, e) in d[b['key']]['words']]
        cl, timers = [], {}
        env = _env(ch['id'])
        for i in range(len(flat) - 1):
            bi, w, a, e = flat[i]; bj, _, a2, _ = flat[i + 1]
            gap = a2 - e; mid = (e + a2) / 2
            if bj != bi:
                b = bl[bi]
                if b.get('pause'):
                    tgt = PRE_TIMER + b['pause'] + POST_TIMER; timers[bi] = (mid, max(0.0, PRE_TIMER - gap / 2))
                else:
                    tgt = STORY if (b.get('story') or bl[bj].get('story')) else BEAT
            else:
                k = _end(w)
                tgt = SENT if k == 's' else (COMMA if k == 'c' else 0.0)
            if tgt - gap > 0.02:
                # the word timings are only approximate: cut where the take is really silent, or do not cut at all
                cp, sil = _quiet(env, e - 0.08, a2 + 0.08, need=(0.05 if (bj != bi or _end(w) == 's') else 0.10))   # a comma only where the voice really paused
                if cp is None:
                    if bj != bi and bl[bi].get('pause'): cp, sil = mid, 0.0      # a practice pause must exist (voice such a chapter as two takes)
                    else: skipped.append((ch['id'], w)); continue
                cl.append((cp, max(0.0, tgt - max(gap, sil))))
        base = t - flat[0][2]
        f = lambda x: base + x + sum(ex for (cp, ex) in cl if cp <= x)
        cuts[ch['id']] = cl; bases[ch['id']] = base
        for bi, b in enumerate(bl):
            v = d[b['key']]
            beat = dict(key=b['key'], chapter=ch['id'], t0=f(v['t0']), t1=f(v['t1']), story=b.get('story', False), pause=b.get('pause', 0),
                        words=[(w, f(a), f(e)) for w, a, e in v['words']], cues={int(k): f(x) for k, x in v['cues'].items()}, disp=b['disp'])
            beats[b['key']] = beat
            segs.append(dict(kind='beat', t0=beat['t0'], t1=beat['t1'], chapter=ch['id'], key=b['key']))
            if b.get('pause'):
                p0 = beat['t1'] + PRE_TIMER
                segs.append(dict(kind='pause', t0=p0, t1=p0 + b['pause'], chapter=ch['id'], key=b['key']))
            t = beat['t1']
        t += 1.2
    return dict(segs=segs, beats=beats, DUR=t + 1.5, cuts=cuts, base=bases, skipped=skipped)


def voice_track(T, out=f'{OUT}/voice.wav'):
    """each chapter take at natural speed, cut in the middle of the gaps listed in T['cuts'], with the extra silence put in"""
    import numpy as np, soundfile as sf
    SR = 44100; N = int((T['DUR'] + 1) * SR); track = np.zeros(N, np.float32)
    for ch, cl in T['cuts'].items():
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{VO}/{ch}.mp3', '-ac', '1', '-ar', str(SR), '/tmp/lv_ch.wav'], check=True)
        x, _ = sf.read('/tmp/lv_ch.wav', dtype='float32')
        pts = [0.0] + [c for c, _ in cl] + [len(x) / SR]; shift = 0.0
        for i in range(len(pts) - 1):
            a, b = int(pts[i] * SR), min(len(x), int(pts[i + 1] * SR)); seg = x[a:b].copy()
            n = min(441, len(seg) // 4)
            if n > 0:
                if i > 0: seg[:n] *= np.linspace(0, 1, n)
                if i < len(pts) - 2: seg[-n:] *= np.linspace(1, 0, n)
            at = int((T['base'][ch] + pts[i] + shift) * SR)
            if at < 0: seg = seg[-at:]; at = 0
            m = min(len(seg), N - at); track[at:at + m] += seg[:m]
            if i < len(cl): shift += cl[i][1]
    sf.write(out, track, SR)
    return out


if __name__ == '__main__':
    T = build()
    print('DUR', round(T['DUR'], 1), 'segs', len(T['segs']), 'silences stretched', sum(len(v) for v in T['cuts'].values()), 'added s', round(sum(e for v in T['cuts'].values() for _, e in v), 1), 'left alone (no real silence)', len(T['skipped']))
    json.dump({k: v for k, v in T.items()}, open(f'{OUT}/timeline.json', 'w'), indent=0, default=str)
    voice_track(T)
    print('voice track ok')
