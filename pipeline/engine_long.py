"""(static background and no progress bar so the renderer can skip unchanged frames; YouTube shows its own chapter bar)
LevlPrep long-form engine (16:9, 1920x1080) for full explanation videos.
A spec module provides: SPEC = dict(id, course_tag, chapters=[{id,title,beats:[{key,vo,disp?,pause?}]}], compose(c) -> svg string, end_next).
Voice: out/<id>/<key>.el.json (ElevenLabs with timestamps). Every beat must be voiced before building (no draft voice).
Helpers (on Ctx): everything from engine2.Ctx plus hw()/write() handwriting, scene(), atom(), arrow paths.
Optional spec keys: music=[(start, end, volume)] low music bed under story scenes only (quality v2), css, vars, tail.
Outputs: index.html, mix.wav, meta.json, captions.srt, chapters.txt. Render with render_long.py.
Sounds: swish on chapter cards, check on pause timers; spec adds more with c.sound(name, t, gain) (assets from sfx.py).
"""
import os, re, json, shutil, subprocess, sys, math, html as H
sys.path.insert(0, "/home/claude/lp")
import engine2, flow
from engine2 import dur, el_audio

ROOT = "/home/claude/lp"; A = f"{ROOT}/assets"
W_, H_ = 1920, 1080
TEAL, GOLD, CORAL, INK, GREEN, VIOLET, WHITE = "#2ee6d6", "#ffd23f", "#ff6b6b", "#a9bbd8", "#3fe07a", "#9b7bff", "#ffffff"

def strip_tags(s): return re.sub(r"<[^>]+>", "", s)

class Ctx(engine2.Ctx):
    def __init__(self, spec):
        super().__init__(spec); self.hwW = {}; self.titles = []
    def draw(self, sel, t, d=0.8, ease="power2.inOut"):
        self.g(f'tl.fromTo("{sel}",{{strokeDashoffset:1,opacity:1}},{{strokeDashoffset:0,duration:{d},ease:"{ease}",immediateRender:false}},{t:.2f});')
    def cue(self, key, n=None):
        return self.T[key] if n is None else self.C[key][n]
    def end(self, key):
        return self.T[key] + self.D[key]
    # handwriting text, revealed left to right by write()
    def hw(self, id, x, y, text, size=56, color=WHITE, anchor="start", font="hand", weight=700, w=None, extra=""):
        n = len(strip_tags(H.unescape(text)))
        W = w or int(n * size * (0.50 if font == "hand" else 0.58)) + 40
        rx = x if anchor == "start" else (x - W / 2 if anchor == "middle" else x - W)
        self.hwW[id] = (W, n)
        fam = "Kalam" if font == "hand" else "Inter"
        return (f'<clipPath id="cp_{id}"><rect id="cr_{id}" x="{rx-10:.0f}" y="{y-size*1.15:.0f}" width="0" height="{size*1.7:.0f}"/></clipPath>'
                f'<text id="{id}" clip-path="url(#cp_{id})" x="{x}" y="{y}" fill="{color}" font-family="{fam}" font-weight="{weight}" '
                f'font-size="{size}" text-anchor="{anchor}" {extra}>{text}</text>')
    def write(self, id, t, d=None):
        W, n = self.hwW[id]
        d = d if d is not None else min(1.8, max(0.3, n / 20))
        self.g(f'tl.fromTo("#cr_{id}",{{attr:{{width:0}}}},{{attr:{{width:{W+20}}},duration:{d:.2f},ease:"none"}},{t:.2f});')
    def show_text(self, id, t):
        W, n = self.hwW[id]; self.g(f'tl.set("#cr_{id}",{{attr:{{width:{W+20}}}}},{t:.2f});')
    def scene(self, sel, t_in, t_out=None, d=0.45):
        self.g(f'tl.fromTo("{sel}",{{opacity:0}},{{opacity:1,duration:{d}}},{t_in:.2f});')
        if t_out is not None: self.g(f'tl.to("{sel}",{{opacity:0,duration:{d}}},{t_out-d:.2f});')
    def hide(self, sel, t, d=0.35): self.g(f'tl.to("{sel}",{{opacity:0,duration:{d}}},{t:.2f});')
    def show(self, sel, t, d=0.35): self.g(f'tl.to("{sel}",{{opacity:1,duration:{d}}},{t:.2f});')
    def cam(self, t, scale=1, x=0, y=0, d=1.0, ease="power2.inOut"):
        self.g(f'tl.to("#cam",{{scale:{scale},x:{x},y:{y},duration:{d},ease:"{ease}"}},{t:.2f});')
    def glow(self, sel, t, color=GOLD, d=0.4):
        self.g(f'tl.to("{sel}",{{fill:"{color}",duration:{d}}},{t:.2f});')
    def stroke(self, sel, t, color=GOLD, d=0.4):
        self.g(f'tl.to("{sel}",{{stroke:"{color}",duration:{d}}},{t:.2f});')

DEFS = f'''<defs>
<radialGradient id="gnuc" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ff9a8a"/><stop offset="1" stop-color="#b83a4a"/></radialGradient>
<marker id="ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{GOLD}"/></marker>
<marker id="ahw" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#fff"/></marker>
<marker id="aht" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{TEAL}"/></marker>
<marker id="ahc" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{CORAL}"/></marker>
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity=".45"/></filter>
<filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="blur14"><feGaussianBlur stdDeviation="14"/></filter>
</defs>'''

CSS = """
:root{--navy:#081428;--teal:#2ee6d6;--yellow:#ffd23f;--muted:#a9bbd8;--coral:#ff6b6b}
*{box-sizing:border-box}
body{margin:0;background:#081428;color:#fff;font-family:"Inter",Arial,sans-serif}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#081428}
.bg{position:absolute;inset:-200px;background:radial-gradient(1300px 900px at 50% 45%,#123a6e 0%,rgba(8,20,40,0) 70%),linear-gradient(180deg,#0a1a36 0%,#081428 60%,#050c1a 100%)}
.orb{position:absolute;border-radius:50%;filter:blur(140px);opacity:.22}
#o1{left:-300px;top:-200px;width:900px;height:900px;background:#2ee6d6}
#o2{right:-360px;bottom:-380px;width:1000px;height:1000px;background:#3a5bff}
#grid{position:absolute;inset:-120px;background-image:linear-gradient(rgba(255,255,255,.03) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.03) 2px,transparent 2px);background-size:96px 96px}
#cam{position:absolute;inset:0;transform-origin:50% 50%}
#stage{position:absolute;inset:0}
#stage svg{position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:visible}
#hdr{position:absolute;left:56px;top:40px;z-index:10;display:flex;gap:16px;align-items:center}
#hdr .tag{font-size:22px;font-weight:900;letter-spacing:4px;color:var(--teal);border:3px solid var(--teal);border-radius:999px;padding:6px 18px;background:rgba(8,20,40,.6)}
#hdr .ch{position:relative;height:40px;width:900px}
#hdr .ch div{position:absolute;left:0;top:0;font-size:28px;font-weight:800;color:#cfe0ff;opacity:0;white-space:nowrap;line-height:40px;text-shadow:0 2px 8px rgba(0,0,0,.8)}
#card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9;opacity:0;pointer-events:none}
#card .n{font-size:40px;font-weight:900;color:var(--teal);letter-spacing:6px}
#card .t{font-family:Kalam;font-weight:700;font-size:110px;color:#fff;margin-top:6px}
#card .ul{width:520px;height:10px;border-radius:5px;background:var(--yellow);margin-top:8px;transform-origin:left center}
.cardbg{position:absolute;inset:0;background:radial-gradient(1000px 600px at 50% 50%,#12386e,#081428);opacity:0;z-index:8}
#pause{position:absolute;right:70px;top:110px;z-index:11;opacity:0;display:flex;align-items:center;gap:18px;background:rgba(5,12,26,.8);border:3px solid var(--yellow);border-radius:999px;padding:12px 26px 12px 14px}
#pause span{font-size:34px;font-weight:900;color:var(--yellow)}
"""

def fonts(out):
    for f in ("700", "800", "900"): shutil.copy(f"{A}/inter-latin-{f}-normal.woff2", out)
    shutil.copy(f"{ROOT}/node_modules/@fontsource/kalam/files/kalam-latin-700-normal.woff2", out)
    shutil.copy(f"{ROOT}/node_modules/@fontsource/kalam/files/kalam-latin-400-normal.woff2", out)
    return ("".join(f'@font-face{{font-family:"Inter";font-weight:{w};src:url("inter-latin-{w}-normal.woff2") format("woff2");}}\n' for w in (700, 800, 900))
            + '@font-face{font-family:"Kalam";font-weight:700;src:url("kalam-latin-700-normal.woff2") format("woff2");}\n'
            + '@font-face{font-family:"Kalam";font-weight:400;src:url("kalam-latin-400-normal.woff2") format("woff2");}\n')

def clean(vo): return re.sub(r"\s+", " ", re.sub(r"\{\d+\}", "", vo)).strip()
def notag(s): return re.sub(r"\s+", " ", re.sub(r"\[[^\]]+\]\s*", "", s)).strip()

def plan(spec, out):
    D, CUES, WT = {}, {}, {}
    for ch in spec["chapters"]:
        for b in ch["beats"]:
            k, vo = b["key"], b["vo"]
            el = el_audio(k, out)
            if not el: raise SystemExit(f"beat {k} has no ElevenLabs audio; voice it first")
            D[k], al = el
            chars, starts = al["characters"], al["character_start_times_seconds"]
            txt = "".join(chars)
            # map cue positions through the tag-free text (alignment has no emotion tags when v3 drops them)
            base = vo if txt.startswith(clean(vo)[:12]) else re.sub(r"\[[^\]]+\]\s*", "", vo)
            cues = {}
            for m in re.finditer(r"\{(\d+)\}", base):
                pos = len(re.sub(r"\s+", " ", re.sub(r"\{\d+\}", "", base[:m.start()])).lstrip())
                cues[int(m.group(1))] = starts[min(pos, len(starts) - 1)]
            ws, inw = [], False
            for i, chh in enumerate(chars):
                if chh.strip() and not inw: ws.append((starts[i], i)); inw = True
                elif not chh.strip(): inw = False
            WT[k] = (ws, txt, starts)
            CUES[k] = cues
    T, CH, cur = {}, [], 0.4
    for ci, ch in enumerate(spec["chapters"]):
        if ci > 0: cur += 0.6
        card = spec.get("cards", True) and ci > 0 and ch.get("card", True)
        cs = cur
        if card: cur += 2.0
        CH.append(dict(id=ch["id"], title=ch["title"], t=cs, card=card))
        for b in ch["beats"]:
            k = b["key"]; T[k] = cur
            cur += D[k] + b.get("gap", 0.45) + b.get("pause", 0)
    return T, D, {k: {n: T[k] + v for n, v in c.items()} for k, c in CUES.items()}, CH, cur, WT

def srt(spec, c, WT, out):
    def ts(x):
        ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
    items = []
    for ch in spec["chapters"]:
        for b in ch["beats"]:
            k = b["key"]; d = notag(re.sub(r"\{\d+\}", "", b.get("disp") or clean(b["vo"]))); words = d.split()
            s0, e0 = c.T[k], c.T[k] + c.D[k]
            if k in WT and WT[k][0]:
                ws = [x for x, _ in WT[k][0]]
                times = [s0 + ws[min(len(ws) - 1, round(i * (len(ws) - 1) / max(len(words) - 1, 1)))] for i in range(len(words))]
            else:
                tot = sum(len(w) + 1 for w in words); acc = 0; times = []
                for w in words: times.append(s0 + (e0 - s0) * acc / tot); acc += len(w) + 1
            cur = []
            groups = []
            for i, w in enumerate(words):
                cur.append(i)
                txt = " ".join(words[j] for j in cur)
                if (w[-1] in ".?!" and len(txt) > 20) or len(txt) > 70: groups.append(cur); cur = []
            if cur: groups.append(cur)
            for gi, g in enumerate(groups):
                st = times[g[0]]; en = times[groups[gi + 1][0]] - 0.05 if gi + 1 < len(groups) else e0
                items.append((st, max(en, st + 0.8), " ".join(words[j] for j in g)))
    lines = []
    for i, (s, e, t) in enumerate(items):
        if i + 1 < len(items): e = min(e, items[i + 1][0] - 0.02)
        # wrap to two lines of about 42 characters
        if len(t) > 42:
            ws = t.split(); best = None
            for j in range(1, len(ws)):
                a, b2 = " ".join(ws[:j]), " ".join(ws[j:])
                sc = max(len(a), len(b2))
                if best is None or sc < best[0]: best = (sc, a + "\n" + b2)
            t = best[1]
        lines.append(f"{i+1}\n{ts(s)} --> {ts(e)}\n{t}\n")
    open(f"{out}/captions.srt", "w").write("\n".join(lines))

def build(spec, draft_ok=True):
    out = f"{ROOT}/out/{spec['id']}"; os.makedirs(out, exist_ok=True)
    ff = fonts(out); shutil.copy(f"{ROOT}/node_modules/gsap/dist/gsap.min.js", out)
    for f in spec.get("images", []): shutil.copy(f, out)
    c = Ctx(spec)
    c.T, c.D, c.C, CH, TOT, WT = plan(spec, out)
    TOT = round(TOT + spec.get("tail", 1.0), 2); c.TOTAL = TOT; c.CH = CH
    # chapter header + chapter cards
    hdr = []
    for i, ch in enumerate(CH):
        hdr.append(f'<div id="chh{i}">{H.escape(ch["title"])}</div>')
        t0 = ch["t"]; t1 = CH[i + 1]["t"] if i + 1 < len(CH) else TOT
        c.g(f'tl.fromTo("#chh{i}",{{opacity:0,y:12}},{{opacity:1,y:0,duration:0.4}},{t0 + (1.9 if ch["card"] else 0):.2f});')
        c.g(f'tl.to("#chh{i}",{{opacity:0,duration:0.3}},{t1 - 0.3:.2f});')
        if ch["card"]:
            c.g(f'tl.set("#card .n",{{textContent:"{i}"}},{t0:.2f});')
            c.g(f'tl.set("#card .t",{{textContent:{json.dumps(ch["title"])}}},{t0:.2f});')
            c.g(f'tl.fromTo(".cardbg",{{opacity:0}},{{opacity:1,duration:0.35}},{t0:.2f});')
            c.g(f'tl.fromTo("#card",{{opacity:0,scale:1.04}},{{opacity:1,scale:1,duration:0.4,ease:"power3.out"}},{t0+0.05:.2f});')
            c.g(f'tl.fromTo("#card .ul",{{scaleX:0}},{{scaleX:1,duration:0.5,ease:"power3.out"}},{t0+0.3:.2f});')
            c.g(f'tl.to("#card",{{opacity:0,duration:0.35}},{t0+1.65:.2f});')
            c.g(f'tl.to(".cardbg",{{opacity:0,duration:0.4}},{t0+1.65:.2f});')
            c.sound("swish", t0, 0.6)
    # pause timers
    for ch in spec["chapters"]:
        for b in ch["beats"]:
            p = b.get("pause")
            if p:
                s = c.T[b["key"]] + c.D[b["key"]] + 0.1
                c.g(f'tl.fromTo("#pause",{{opacity:0,y:-10}},{{opacity:1,y:0,duration:0.3}},{s:.2f});')
                c.g(f'tl.fromTo("#pring",{{strokeDashoffset:0}},{{strokeDashoffset:1,duration:{p-0.4:.2f},ease:"none"}},{s:.2f});')
                c.g(f'tl.to("#pause",{{opacity:0,duration:0.3}},{s+p-0.3:.2f});')
                c.sound("check", s, 0.4)
    stage = spec["compose"](c)
    srt(spec, c, WT, out)
    v = spec.get("vars", "")
    lottie_tag = '<script src="lottie.min.js"></script>' if os.path.exists(f"{out}/lottie.min.js") else ""
    page = f'''<!doctype html><html><head><meta charset="utf-8"><title>{spec["id"]}</title><script src="gsap.min.js"></script>{lottie_tag}
<style>{ff}{CSS}{spec.get("css","")}</style></head><body>
<div id="root" style="{v}"><div class="bg"></div><div class="orb" id="o1"></div><div class="orb" id="o2"></div><div id="grid"></div>
<div id="cam"><div id="stage"><svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">{DEFS}{stage}</svg></div></div>
<div class="cardbg"></div><div id="card"><div class="n">1</div><div class="t">x</div><div class="ul"></div></div>
<div id="hdr"><span class="tag">{spec["course_tag"]}</span><div class="ch">{"".join(hdr)}</div></div>
<div id="pause"><svg width="54" height="54" viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" fill="none" stroke="rgba(255,210,63,.25)" stroke-width="6"/><circle id="pring" cx="27" cy="27" r="22" fill="none" stroke="#ffd23f" stroke-width="6" pathLength="1" stroke-dasharray="1" transform="rotate(-90 27 27)"/></svg><span>Pause and try it</span></div>
</div>
<script>
window.__timelines = {{}}; const tl = gsap.timeline({{ paused: true }});
{chr(10).join(c.L)}
tl.set({{}}, {{}}, {TOT});
window.__timelines["main"] = tl;
</script></body></html>'''
    open(f"{out}/index.html", "w", encoding="utf-8").write(page)
    # audio: voice + sound design + optional low music bed under story scenes
    inputs, filt, labels, idx = [], [], [], 0
    for ch in spec["chapters"]:
        for b in ch["beats"]:
            k = b["key"]; inputs.append(f'-i "{out}/{k}.wav"'); ms = int(c.T[k] * 1000)
            filt.append(f"[{idx}:a]adelay={ms}|{ms}[a{idx}]"); labels.append(f"[a{idx}]"); idx += 1
    for name, t, gn in c.sfx:
        inputs.append(f'-i "{A}/{name}.wav"'); ms = int(max(0, t) * 1000)
        filt.append(f"[{idx}:a]volume={0.22*gn:.2f},adelay={ms}|{ms}[a{idx}]"); labels.append(f"[a{idx}]"); idx += 1
    mus = spec.get("music")
    if mus:
        import music
        mlen = max(b for _, b, _ in mus) + 1
        mp = f"{out}/music.wav"
        if not os.path.exists(mp) or json.load(open(f"{out}/music.json")) != [mlen]:
            music.make_music(mlen, mp, bpm=spec.get("bpm", 80), key=spec.get("key", 0), seed=spec.get("seed", 3)); json.dump([mlen], open(f"{out}/music.json", "w"))
        vol = "+".join(f"between(t,{a:.2f},{b:.2f})*{v}" for a, b, v in mus)
        inputs.append(f'-i "{mp}"')
        filt.append(f"[{idx}:a]aformat=channel_layouts=mono,volume='{vol}':eval=frame,afade=t=out:st={mlen-1.5:.2f}:d=1.5[a{idx}]"); labels.append(f"[a{idx}]"); idx += 1
    fc = ";".join(filt) + ";" + "".join(labels) + f"amix=inputs={idx}:normalize=0:dropout_transition=0,apad=whole_dur={TOT},atrim=0:{TOT},loudnorm=I=-14:TP=-1.5:LRA=11[m]"
    open(f"{out}/fc.txt", "w").write(fc)
    subprocess.run(f'ffmpeg -y -loglevel error {" ".join(inputs)} -filter_complex_script "{out}/fc.txt" -map "[m]" -ar 48000 -ac 2 "{out}/mix.wav"', shell=True, check=True)
    chap = []
    for ch in CH:
        t = int(ch["t"]); chap.append(f"{t//60}:{t%60:02d} {ch['title']}")
    chap[0] = "0:00 " + CH[0]["title"]
    open(f"{out}/chapters.txt", "w").write("\n".join(chap) + "\n")
    json.dump(dict(total=TOT, T=c.T, D=c.D, C=c.C, CH=CH, drafts=[], w=1920, h=1080), open(f"{out}/meta.json", "w"))
    print("built", spec["id"], TOT, "s")
    return out
