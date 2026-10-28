"""Shared helpers for batch w1025 (code drawn Shorts, flat layered scenes).
Painted plates (Gemini, flat layered), house layout (short/layout.py), timeline from the voiced words, drawing helpers
copied from the sprint lean Short (runner/short_sprint.py), the frame loop (skia -> ffmpeg) and the sound mix."""
import sys, math, json, subprocess, os, re
sys.path[:0] = ['/home/claude/short', '/home/claude/rig', '/home/claude/mocap', '/home/claude/runner']
import numpy as np, skia, cv2
from PIL import Image
import layout as L
from layout import smooth, col, TEAL, YELLOW, CORAL, WHITE, GREEN

W_, H_, FPS = 1080, 1920, 30
ART = '/home/claude/lp/art/w1025/'
GREY = (215, 220, 232)
ORANGE = (0xff, 0x9a, 0x3c)


def lerp(a, b, u):
    return a + (b - a) * u


def clamp(u, a=0.0, b=1.0):
    return min(max(u, a), b)


def ease(t, t0, d):
    return smooth((t - t0) / max(d, 1e-6))


def window(t, t0, t1, fin=0.2, fout=0.2):
    return smooth((t - t0) / fin) * (1 - smooth((t - t1) / fout))


# ------------------------------------------------------------------ images
_KEEP = []


def skimg(a):
    a = np.ascontiguousarray(a)
    if a.shape[2] == 3:
        a = np.dstack([a, np.full(a.shape[:2], 255, np.uint8)])
    im = skia.Image.fromarray(a, colorType=skia.ColorType.kRGBA_8888_ColorType)
    _KEEP.append(a)              # keep the pixels alive as long as the image (skia may share the buffer)
    if len(_KEEP) > 64:
        del _KEEP[:-64]
    return im


def load_rgb(path, trim=0):
    a = np.array(Image.open(path).convert('RGB'))
    if trim:
        a = a[trim:-trim, trim:-trim]
    return a


def plate(path, trim=0, width=W_, height=None):
    """Painting scaled to the frame width (cubic, then a light unsharp so the flat edges stay crisp)."""
    a = load_rgb(path, trim)
    s = width / a.shape[1]
    b = cv2.resize(a, (width, int(round(a.shape[0] * s))), interpolation=cv2.INTER_CUBIC)
    bl = cv2.GaussianBlur(b, (0, 0), 1.2)
    b = cv2.addWeighted(b, 1.35, bl, -0.35, 0)
    if height:
        b = b[:height]
    return b, s


SMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kNone)


# ------------------------------------------------------------------ timeline from the voiced words
class Timeline:
    def __init__(self, vid):
        self.beats_txt = json.load(open('/home/claude/w1025/scripts.json'))[vid]
        self.words = [tuple(w) for w in json.load(open(f'/home/claude/w1025/out/{vid}/words.json'))]
        self.beats, i = {}, 0
        for b, txt in self.beats_txt:
            n = len(txt.split()); self.beats[b] = list(range(i, i + n)); i += n
        assert i == len(self.words), (i, len(self.words))
        self.end = self.words[-1][2]

    def k(self, beat, word, n=1, end=False):
        hits = [j for j in self.beats[beat] if re.sub(r'[^a-z0-9]', '', self.words[j][0].lower()) == word.lower()]
        j = hits[n - 1]
        return self.words[j][2 if end else 1]

    def span(self, beat):
        ix = self.beats[beat]
        return self.words[ix[0]][1], self.words[ix[-1]][2]

    def chunks(self, size=3):
        out = []
        for b, ix in self.beats.items():
            cur = []
            for j in ix:
                cur.append(j)
                if len(cur) >= size or re.search(r'[.,?!]$', self.words[j][0]):
                    out.append(cur); cur = []
            if cur:
                out.append(cur)
        return out


# ------------------------------------------------------------------ drawing helpers (house style, as in the sprint Short)
def arrow(c, p0, p1, color, w=15, head=42, a=1.0, grow=1.0):
    p0, p1 = np.array(p0, float), np.array(p1, float)
    if a <= 0.01 or grow <= 0.01:
        return
    p1 = p0 + (p1 - p0) * grow
    d = p1 - p0; Ln = np.linalg.norm(d)
    if Ln < 2:
        return
    u = d / Ln; n = np.array([-u[1], u[0]])
    hd = min(head, Ln * 0.6)
    base = p1 - u * hd
    path = skia.Path()
    path.moveTo(*p1); path.lineTo(*(base + n * hd * 0.62)); path.lineTo(*(base - n * hd * 0.62)); path.close()
    for widen, colr, al in ((7, (8, 10, 24), 0.55), (0, color, 1.0)):
        pa = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al), StrokeWidth=w + widen, StrokeCap=skia.Paint.kRound_Cap,
                        Style=skia.Paint.kStroke_Style)
        c.drawLine(*p0, *(base + u * 4), pa)
        pf = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al))
        if widen:
            pf.setStyle(skia.Paint.kStrokeAndFill_Style); pf.setStrokeWidth(widen); pf.setStrokeJoin(skia.Paint.kRound_Join)
        c.drawPath(path, pf)


def dashed(c, p0, p1, color, w=5, a=1.0, on=18, off=12, phase=0.0):
    if a <= 0.01:
        return
    for widen, colr, al in ((5, (8, 10, 24), 0.45), (0, color, 1.0)):
        pa = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al), StrokeWidth=w + widen, Style=skia.Paint.kStroke_Style,
                        StrokeCap=skia.Paint.kRound_Cap, PathEffect=skia.DashPathEffect.Make([on, off], phase))
        c.drawLine(*p0, *p1, pa)


def line(c, p0, p1, color, w=6, a=1.0):
    if a <= 0.01:
        return
    for widen, colr, al in ((6, (8, 10, 24), 0.5), (0, color, 1.0)):
        c.drawLine(*p0, *p1, skia.Paint(AntiAlias=True, Color=col(colr, 255 * a * al), StrokeWidth=w + widen,
                                        StrokeCap=skia.Paint.kRound_Cap, Style=skia.Paint.kStroke_Style))


def label(c, s, x, y, color, a, size=34, anchor=None):
    if a <= 0.01:
        return
    L.chip(c, s, x, y, color, size, a, scale=0.9 + 0.1 * a, anchor=anchor)


def text(c, s, x, y, size, color, a=1.0, center=False, font=None):
    if a <= 0.01:
        return
    f = skia.Font(font or L.BLACK, size); f.setEdging(skia.Font.Edging.kAntiAlias)
    if center:
        x -= f.measureText(s) / 2
    c.drawString(s, x, y, f, skia.Paint(AntiAlias=True, Color=col(color, 255 * a)))


def tw(s, size):
    return skia.Font(L.BLACK, size).measureText(s)


def card(c, x, y, w, h, a, r=26):
    if a <= 0.01:
        return
    rr = skia.RRect.MakeRectXY(skia.Rect(x, y, x + w, y + h), r, r)
    c.drawRRect(rr, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(210 * a))))
    c.drawRRect(rr, skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(28 * a)), Style=skia.Paint.kStroke_Style, StrokeWidth=2))


def ring(c, p, r, color, a, w=8):
    if a <= 0.01:
        return
    c.drawCircle(*p, r, skia.Paint(AntiAlias=True, Color=col((8, 10, 24), 140 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=w + 5))
    c.drawCircle(*p, r, skia.Paint(AntiAlias=True, Color=col(color, 255 * a), Style=skia.Paint.kStroke_Style, StrokeWidth=w))


def glow(c, p, r, color, a):
    if a <= 0.01:
        return
    sh = skia.GradientShader.MakeRadial(skia.Point(*p), r, [col(color, 200 * a), col(color, 0)])
    c.drawCircle(*p, r, skia.Paint(Shader=sh))


def x_stamp(c, x, y, s, a):
    if a <= 0.01:
        return
    for widen, colr in ((12, (20, 6, 10)), (0, CORAL)):
        pa = skia.Paint(AntiAlias=True, Color=col(colr, 255 * a), StrokeWidth=34 + widen, StrokeCap=skia.Paint.kRound_Cap,
                        Style=skia.Paint.kStroke_Style)
        c.drawLine(x - 90 * s, y - 90 * s, x + 90 * s, y + 90 * s, pa)
        c.drawLine(x - 90 * s, y + 90 * s, x + 90 * s, y - 90 * s, pa)


def check_stamp(c, x, y, s, a):
    if a <= 0.01:
        return
    p = skia.Path(); p.moveTo(x - 80 * s, y); p.lineTo(x - 20 * s, y + 60 * s); p.lineTo(x + 90 * s, y - 70 * s)
    for widen, colr in ((12, (6, 20, 12)), (0, GREEN)):
        c.drawPath(p, skia.Paint(AntiAlias=True, Color=col(colr, 255 * a), StrokeWidth=34 + widen, StrokeCap=skia.Paint.kRound_Cap,
                                 StrokeJoin=skia.Paint.kRound_Join, Style=skia.Paint.kStroke_Style))


def rewind_fx(c, t, a):
    if a <= 0.01:
        return
    c.drawRect(skia.Rect(0, 0, W_, H_), skia.Paint(Color=skia.Color(20, 30, 70, int(70 * a))))
    rng = np.random.default_rng(int(t * 60))
    for y in range(0, H_, 6):
        c.drawRect(skia.Rect(0, y, W_, y + 2), skia.Paint(Color=skia.Color(255, 255, 255, int(14 * a))))
    for _ in range(3):
        y = rng.uniform(560, 1300)
        c.drawRect(skia.Rect(0, y, W_, y + rng.uniform(4, 16)), skia.Paint(Color=skia.Color(255, 255, 255, int(55 * a))))
    p = skia.Path(); x0, y0 = 70, 590
    for k in range(2):
        p.moveTo(x0 + 46 + k * 46, y0); p.lineTo(x0 + k * 46, y0 + 30); p.lineTo(x0 + 46 + k * 46, y0 + 60); p.close()
    c.drawPath(p, skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(235 * a))))
    text(c, 'REWIND', 70, 690, 40, WHITE, a)


def status_pill(c, kind, a, x=56, y=556):
    """'PAUSED' (two bars) or 'SLOW MOTION' pill, top left of the art zone."""
    if a <= 0.01:
        return
    if kind == 'paused':
        r = skia.RRect.MakeRectXY(skia.Rect(x, y, x + 194, y + 60), 30, 30)
        c.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(200 * a))))
        for bx in (x + 28, x + 44):
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx, y + 16, bx + 10, y + 44), 3, 3), skia.Paint(AntiAlias=True, Color=col(WHITE, 240 * a)))
        text(c, 'PAUSED', x + 68, y + 42, 30, WHITE, a)
    else:
        r = skia.RRect.MakeRectXY(skia.Rect(x, y, x + 264, y + 60), 30, 30)
        c.drawRRect(r, skia.Paint(AntiAlias=True, Color=skia.Color(5, 12, 26, int(200 * a))))
        text(c, 'SLOW MOTION', x + 26, y + 42, 30, YELLOW, a)


def meter(c, x, y, w, h, val, a, title, colr_lo=GREEN, colr_hi=CORAL, ticks=None):
    """Vertical card with a fill bar; val 0..1; colour goes from colr_lo to colr_hi with the value."""
    if a <= 0.01:
        return
    card(c, x, y, w, h, a)
    text(c, title, x + w / 2, y + 44, 28, WHITE, a, center=True)
    bx0, by0, bx1, by1 = x + w / 2 - 26, y + 70, x + w / 2 + 26, y + h - 24
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, by0, bx1, by1), 14, 14), skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(40 * a))))
    v = clamp(val)
    cc = tuple(int(lerp(colr_lo[i], colr_hi[i], v)) for i in range(3))
    top = by1 - (by1 - by0) * v
    if v > 0.01:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(bx0, top, bx1, by1), 14, 14), skia.Paint(AntiAlias=True, Color=col(cc, 255 * a)))


def contact_shadow(c, x, y, rx, ry, a=0.35):
    c.drawOval(skia.Rect(x - rx, y - ry, x + rx, y + ry),
               skia.Paint(AntiAlias=True, Color=skia.Color(30, 20, 30, int(255 * a)), MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, ry * 0.8)))


# ------------------------------------------------------------------ house layout pass
def layout_pass(c, t, tl, DUR, badge, titles, end_t, end_lines, last_frame, series=None):
    L.fades(c)
    L.progress(c, t / DUR)
    L.badge(c, badge)
    if series:
        a = 1 - smooth((t - 3.0) / 0.4)
        if a > 0.01:
            label(c, series, W_ / 2, 196, ORANGE, a, 32)
    for t_in, t_out, lines in titles:
        L.title(c, lines, t, t_in, t_out)
    L.watermark(c)
    if t < end_t:
        cur_chunk, cur_word = None, -1
        for ch in tl.chunks(3):
            if tl.words[ch[0]][1] - 0.05 <= t <= tl.words[ch[-1]][2] + 0.25:
                cur_chunk = ch
        if cur_chunk:
            ws = [tl.words[j][0] for j in cur_chunk]
            for n, j in enumerate(cur_chunk):
                if tl.words[j][1] - 0.02 <= t:
                    cur_word = n
            L.caption(c, ws, cur_word)
    else:
        L.end_card(c, last_frame, t - end_t, end_lines)


class Writer:
    def __init__(self, out, stills=(), still_dir=None):
        self.proc = None
        if out:
            self.proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W_}x{H_}',
                                          '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15',
                                          '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
        self.stills, self.still_dir = set(stills), still_dir

    def put(self, fi, surf):
        fr = surf.makeImageSnapshot().toarray()
        if fi in self.stills and self.still_dir:
            Image.fromarray(fr[..., [2, 1, 0]]).save(f'{self.still_dir}/st_{fi:04d}.png')
        if self.proc:
            self.proc.stdin.write(fr.tobytes())

    def close(self):
        if self.proc:
            self.proc.stdin.close(); self.proc.wait()


# ------------------------------------------------------------------ sound mix
SR = 44100
A = '/home/claude/lp/assets/'


def _load(name):
    import soundfile as sf
    x, sr = sf.read(A + name + '.wav', dtype='float32')
    if x.ndim > 1:
        x = x.mean(1)
    if sr != SR:
        idx = np.arange(0, len(x), sr / SR); x = np.interp(idx, np.arange(len(x)), x).astype(np.float32)
    return x


def db(g):
    return 10 ** (g / 20)


def mix(outdir, DUR, sounds, beds, voice_mp3, music_seed=4, bpm=96, key=2):
    """sounds: [(name, t, gain)]; beds: [(name, gain_db, t0, t1)] looped ambience with 0.6 s fades.
    Writes outdir/mix_music.wav and mix_nomusic.wav at -14 LUFS, true peak -1.5 dBTP."""
    import soundfile as sf
    sys.path.insert(0, '/tmp/m/pipeline'); import music
    N = int((DUR + 0.3) * SR)
    fx = np.zeros(N, np.float32)
    tt = np.arange(N) / SR

    def put(x, t, gain):
        i = int(max(t, 0) * SR)
        if i >= N:
            return
        n = min(len(x), N - i)
        fx[i:i + n] += x[:n] * gain
    for name, t, gain in sounds:
        put(_load(name), t, gain)
    for name, gdb, t0, t1 in beds:
        x = _load(name)
        bed = np.tile(x, int(N / len(x)) + 2)[:N]
        env = db(gdb) * np.clip((tt - t0) / 0.6, 0, 1) * np.clip((t1 - tt) / 0.6, 0, 1)
        fx += bed * env
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', voice_mp3, '-ac', '1', '-ar', str(SR), '/tmp/voice_w1025.wav'], check=True)
    v, _ = sf.read('/tmp/voice_w1025.wav', dtype='float32')
    voice = np.zeros(N, np.float32); voice[:min(N, len(v))] = v[:N]
    music.make_music(DUR + 1, '/tmp/w1025_music.wav', bpm=bpm, key=key, seed=music_seed)
    m, _ = sf.read('/tmp/w1025_music.wav', dtype='float32')
    m = m[:N] if len(m) >= N else np.pad(m, ((0, N - len(m)), (0, 0)))
    e = np.convolve(np.abs(voice), np.ones(2205) / 2205, 'same')
    duck = np.where(e > 0.01, db(-8), 1.0)
    duck = np.convolve(duck, np.ones(4410) / 4410, 'same')
    fade = np.clip(tt / 0.4, 0, 1) * np.clip((DUR - tt) / 0.6, 0, 1)
    m = m * (db(-17) * duck * fade)[:, None]
    # effects never louder than the voice: soft limit the effects bus where the voice speaks
    for name, with_music in (('mix_music', True), ('mix_nomusic', False)):
        st = np.stack([voice + fx, voice + fx], 1)
        if with_music:
            st = st + m
        raw = f'/tmp/{name}_raw.wav'
        sf.write(raw, st.astype(np.float32), SR)
        r = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                           capture_output=True, text=True)
        js = r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1]
        p = json.loads(js)
        af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={p['input_i']}:measured_TP={p['input_tp']}:"
              f"measured_LRA={p['input_lra']}:measured_thresh={p['input_thresh']}:offset={p['target_offset']}:linear=true")
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', af, '-ar', '44100', f'{outdir}/{name}.wav'], check=True)


def encode(outdir):
    for src, dst in (('mix_music', 'final'), ('mix_nomusic', 'final_nomusic')):
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{outdir}/silent.mp4', '-i', f'{outdir}/{src}.wav',
                        '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-b:v', '8M', '-minrate', '8M', '-maxrate', '8M', '-bufsize', '8M', '-x264-params', 'nal-hrd=cbr',
                        '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-shortest',
                        '-movflags', '+faststart', f'{outdir}/{dst}.mp4'], check=True)
