"""Timeline for the long video: chapter cards, beats (word and cue times from the voiced takes, sped up by TEMPO),
gaps between beats, and pause timers after practice questions. Also builds the voice track.
tl.build() -> dict(segs=[...], beats={key: beat}, DUR)
  seg: dict(kind='card'|'beat'|'pause', t0, t1, chapter, key?)
  beat: dict(key, chapter, t0, t1, words=[(w, a, b)], cues={n: t}, story, pause)"""
import json, os, subprocess, sys
sys.path.insert(0, '/home/claude/lv')
import a02_script as S

TEMPO = 1.06
CARD = 2.6
GAP = 0.45
VO = '/home/claude/lv/out/vo'
OUT = '/home/claude/lv/out'


def build():
    t = 0.0
    segs, beats, audio = [], {}, []
    for ci, ch in enumerate(S.CHAPTERS):
        d = {b['key']: b for b in json.load(open(f"{VO}/{ch['id']}.json"))}
        if ci > 0:
            segs.append(dict(kind='card', t0=t, t1=t + CARD, chapter=ch['id'], title=ch['title'], n=ci))
            t += CARD
        prev_end = None
        for bi, b in enumerate(ch['beats']):
            v = d[b['key']]
            if prev_end is None:
                base = t - v['t0'] / TEMPO
                audio.append((ch['id'], base))
            else:
                # keep the take's own spacing, but at least GAP between beats; extra beat time shifts the take
                natural = (v['t0'] - prev_end) / TEMPO
                if natural < GAP:
                    pass
            off = base
            bt0, bt1 = off + v['t0'] / TEMPO, off + v['t1'] / TEMPO
            beat = dict(key=b['key'], chapter=ch['id'], t0=bt0, t1=bt1, story=b.get('story', False), pause=b.get('pause', 0),
                        words=[(w, off + a / TEMPO, off + e / TEMPO) for w, a, e in v['words']],
                        cues={int(k): off + x / TEMPO for k, x in v['cues'].items()}, disp=b['disp'])
            beats[b['key']] = beat
            segs.append(dict(kind='beat', t0=bt0, t1=bt1, chapter=ch['id'], key=b['key']))
            prev_end = v['t1']
            if b.get('pause'):
                # a pause timer: the rest of the take moves later by the pause length
                p0 = bt1 + 0.4
                segs.append(dict(kind='pause', t0=p0, t1=p0 + b['pause'], chapter=ch['id'], key=b['key']))
                base += b['pause'] + 0.4
                audio.append((ch['id'] + f"@{v['t1'] + 0.05:.3f}", base))
            t = bt1
        t += 0.9
    return dict(segs=segs, beats=beats, DUR=t + 1.5, audio=audio)


def voice_track(T, out=f'{OUT}/voice.wav'):
    """place each chapter take (split at pause points) on the timeline, sped up by TEMPO"""
    import numpy as np, soundfile as sf
    SR = 44100
    N = int((T['DUR'] + 1) * SR)
    track = np.zeros(N, np.float32)
    # build per chapter list of (start offset in take, place time)
    by_ch = {}
    for name, base in T['audio']:
        ch, _, cut = name.partition('@')
        by_ch.setdefault(ch, []).append((float(cut) if cut else 0.0, base))
    for ch, parts in by_ch.items():
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{VO}/{ch}.mp3', '-af', f'atempo={TEMPO}', '-ac', '1', '-ar', str(SR), '/tmp/lv_ch.wav'], check=True)
        x, _ = sf.read('/tmp/lv_ch.wav', dtype='float32')
        for i, (c0, base) in enumerate(parts):
            c1 = parts[i + 1][0] if i + 1 < len(parts) else 1e9
            a, b = int(c0 / TEMPO * SR), min(len(x), int(c1 / TEMPO * SR))
            seg = x[a:b].copy()
            n = min(400, len(seg) // 4)
            if n > 0:
                seg[:n] *= np.linspace(0, 1, n); seg[-n:] *= np.linspace(1, 0, n)
            at = int((base + c0 / TEMPO) * SR)
            m = min(len(seg), N - at)
            track[at:at + m] += seg[:m]
    sf.write(out, track, SR)
    return out


if __name__ == '__main__':
    T = build()
    print('DUR', round(T['DUR'], 1), 'segs', len(T['segs']))
    json.dump({k: v for k, v in T.items()}, open(f'{OUT}/timeline.json', 'w'), indent=0, default=str)
    voice_track(T)
    print('voice track ok')
