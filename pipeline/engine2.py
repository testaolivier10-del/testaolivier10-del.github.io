"""LevlPrep engine v2: big illustrated stage, camera moves, word-highlight captions, frame zero hook.
Each spec supplies beats (voice) and a compose(c) function that returns stage SVG/HTML and adds timeline lines.
"""
import os, re, json, shutil, subprocess, sys
sys.path.insert(0, "/home/claude/lp")
os.environ.setdefault("LP_VOICE", "am_liam+am_michael")
os.environ.setdefault("LP_SPEED", "1.0")
import flow, music

ROOT = "/home/claude/lp"; A = f"{ROOT}/assets"
SITE = "levlprep.com"

def dur(p):
    return float(subprocess.check_output(f'ffprobe -v error -show_entries format=duration -of csv=p=0 "{p}"', shell=True).decode())

class Ctx:
    def __init__(self, spec):
        self.spec = spec; self.L = []; self.T = {}; self.D = {}; self.C = {}; self.TOTAL = 0; self.sfx = []
    def g(self, s): self.L.append(s)
    def at(self, key, n=None):
        return self.T[key] if n is None else self.C[key][n]
    def fade_in(self, sel, t, d=0.4, y=30, scale=None, ease="power3.out"):
        fr = f"opacity:0,y:{y}" + (f",scale:{scale}" if scale else "")
        to = "opacity:1,y:0" + (",scale:1" if scale else "")
        self.g(f'tl.fromTo("{sel}",{{{fr}}},{{{to},duration:{d},ease:"{ease}"}},{t:.2f});')
    def pop(self, sel, t, d=0.45, origin="50% 50%"):
        self.g(f'tl.fromTo("{sel}",{{opacity:0,scale:0.3,transformOrigin:"{origin}"}},{{opacity:1,scale:1,duration:{d},ease:"back.out(2.2)"}},{t:.2f});')
    def fade_out(self, sel, t, d=0.3):
        self.g(f'tl.to("{sel}",{{opacity:0,duration:{d}}},{t:.2f});')
    def to(self, sel, t, props, d=0.5, ease="power2.inOut"):
        self.g(f'tl.to("{sel}",{{{props},duration:{d},ease:"{ease}"}},{t:.2f});')
    def set(self, sel, t, props):
        self.g(f'tl.set("{sel}",{{{props}}},{t:.2f});')
    def draw(self, sel, t, d=0.8, ease="power2.inOut"):
        self.g(f'tl.fromTo("{sel}",{{strokeDashoffset:1,opacity:1}},{{strokeDashoffset:0,duration:{d},ease:"{ease}"}},{t:.2f});')
    def cam(self, t, scale=1, x=0, y=0, d=0.9, ease="power2.inOut"):
        self.g(f'tl.to("#cam",{{scale:{scale},x:{x},y:{y},duration:{d},ease:"{ease}"}},{t:.2f});')
    def pulse(self, sel, s, e, amp=1.06, per=0.6, origin="50% 50%"):
        n = max(1, int((e - s) / per))
        self.g(f'tl.fromTo("{sel}",{{scale:1}},{{scale:{amp},transformOrigin:"{origin}",duration:{per/2:.2f},yoyo:true,repeat:{2*n-1},ease:"sine.inOut",immediateRender:false}},{s:.2f});')
    def title(self, html, t, out=None, cls="", size=None):
        i = len(self.titles); self.titles.append((i, html, cls, size))
        if i > 0:
            self.g(f'tl.fromTo("#tt{i}",{{opacity:0,y:40,scale:0.92}},{{opacity:1,y:0,scale:1,duration:0.38,ease:"back.out(1.8)"}},{t:.2f});')
        if out is not None:
            self.g(f'tl.to("#tt{i}",{{opacity:0,y:-30,duration:0.22,ease:"power2.in"}},{out:.2f});')
        if i > 0: self.sfx.append(("whoosh", max(0, t - 0.08), 0.45))
        return f"#tt{i}"
    def sound(self, name, t, gain=1.0):
        self.sfx.append((name, t, gain))

CSS = """
:root{--navy:#081428;--teal:#2ee6d6;--yellow:#ffd23f;--white:#fff;--muted:#a9bbd8;--green:#3fe07a;--coral:#ff6b6b;--violet:#9b7bff;}
*{box-sizing:border-box}
body{margin:0;background:var(--navy);color:#fff;font-family:"Inter",Arial,sans-serif}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:var(--navy)}
.bg{position:absolute;inset:-200px;background:radial-gradient(900px 800px at 50% 38%,var(--glow,#123a6e) 0%,rgba(8,20,40,0) 70%),linear-gradient(180deg,#0a1a36 0%,#081428 55%,#050c1a 100%)}
.orb{position:absolute;border-radius:50%;filter:blur(110px);opacity:.30}
#o1{left:-260px;top:260px;width:700px;height:700px;background:var(--acc1,#2ee6d6)}
#o2{right:-300px;top:980px;width:760px;height:760px;background:var(--acc2,#3a5bff)}
#grid{position:absolute;inset:-100px;background-image:linear-gradient(rgba(255,255,255,.035) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.035) 2px,transparent 2px);background-size:90px 90px}
.spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#bff8f2;opacity:.0}
#progress{position:absolute;left:0;top:0;width:1080px;height:10px;background:rgba(255,255,255,.08);z-index:20}
#pbar{display:block;height:10px;width:1080px;background:linear-gradient(90deg,var(--teal),var(--yellow));transform-origin:left center;transform:scaleX(0)}
#badge{position:absolute;left:0;right:0;top:100px;text-align:center;z-index:5}
#badge span{display:inline-block;padding:10px 28px;border-radius:999px;font-size:30px;font-weight:900;letter-spacing:5px;background:rgba(8,20,40,.6);color:var(--teal);border:3px solid var(--teal)}
#titles{position:absolute;left:50px;right:50px;top:170px;height:270px;z-index:6}
.tt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;opacity:0;font-weight:900;line-height:1.04;letter-spacing:-1.5px;font-size:92px;text-shadow:0 6px 0 rgba(0,0,0,.35)}
.tt > div{display:block;width:100%}
.tt .y{color:var(--yellow)} .tt .t{color:var(--teal)} .tt .r{color:var(--coral)} .tt .g{color:var(--green)}
.tt.hook{font-size:118px}
#stagewrap{position:absolute;left:0;top:440px;width:1080px;height:960px;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 70px,#000 820px,transparent 960px);mask-image:linear-gradient(180deg,transparent 0,#000 70px,#000 820px,transparent 960px)}
#cam{position:absolute;inset:0;transform-origin:50% 50%}
#stage{position:absolute;inset:0}
#stage svg{position:absolute;left:0;top:0;width:1080px;height:960px;overflow:visible}
#captions{position:absolute;left:50px;right:50px;top:1430px;height:150px;z-index:8}
.cap{position:absolute;left:0;right:0;top:0;text-align:center;opacity:0}
.cap span.box{display:inline-block;background:rgba(5,12,26,.86);padding:12px 30px;border-radius:24px;font-size:62px;font-weight:900;line-height:1.12;border:2px solid rgba(255,255,255,.08)}
.cap .w{color:#fff}
.cap .w.on{color:var(--yellow)}
#end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;z-index:15;background:radial-gradient(800px 700px at 50% 45%,#12386e,#081428)}
#end-l1{font-size:64px;font-weight:900;text-align:center;line-height:1.1;padding:0 80px}
#end-site{font-size:120px;font-weight:900;color:var(--teal);margin-top:30px;letter-spacing:-2px}
#end-ul{display:block;width:760px;height:10px;border-radius:5px;background:var(--yellow);margin-top:6px;transform-origin:left center;transform:scaleX(0)}
.lbl{font-family:Inter,Arial,sans-serif;font-weight:900}
#wm{position:absolute;left:56px;top:1372px;z-index:9;font-size:32px;font-weight:900;color:var(--teal);letter-spacing:.5px;opacity:.88;text-shadow:0 2px 8px rgba(0,0,0,.7)}
"""

def fonts():
    return "".join(f'@font-face{{font-family:"Inter";font-weight:{w};src:url("inter-latin-{w}-normal.woff2") format("woff2");}}\n' for w in (700, 800, 900))

def el_audio(k, out):
    import base64
    jp = f"{out}/{k}.el.json"
    if not os.path.exists(jp): return None
    j = json.load(open(jp))
    if "results" in j: j = j["results"][0]
    if "body" in j: j = j["body"] if isinstance(j["body"], dict) else json.loads(j["body"])
    open(f"{out}/{k}.mp3", "wb").write(base64.b64decode(j["audio_base64"]))
    subprocess.run(f'ffmpeg -y -loglevel error -i "{out}/{k}.mp3" -af "highpass=f=60,acompressor=threshold=-20dB:ratio=2:attack=8:release=120:makeup=1.5" -ar 44100 -ac 1 "{out}/{k}.wav"', shell=True, check=True)
    al = j.get("normalized_alignment") or j.get("alignment")
    return dur(f"{out}/{k}.wav"), al

def plan(spec, out):
    D, CUES, W = {}, {}, {}
    for b in spec["beats"]:
        k, vo = b["key"], b["vo"]
        clean = re.sub(r"\{\d\}", "", vo)
        if not clean.strip():
            subprocess.run(f'ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=44100:cl=mono -t 0.05 "{out}/{k}.wav"', shell=True, check=True)
            D[k] = 0.05; CUES[k] = {}; continue
        el = el_audio(k, out)
        if el:
            D[k], al = el
            chars, starts = al["characters"], al["character_start_times_seconds"]
            txt = "".join(chars)
            cues = {}
            for m in re.finditer(r"\{(\d)\}", vo):
                pos = len(re.sub(r"\{\d\}", "", vo[:m.start()]))
                cues[int(m.group(1))] = starts[min(pos, len(starts) - 1)] if txt.startswith(clean[:20]) else D[k] * pos / max(len(clean), 1)
            ws, inword = [], False
            for i, ch in enumerate(chars):
                if ch.strip() and not inword: ws.append(starts[i]); inword = True
                elif not ch.strip(): inword = False
            W[k] = ws
        else:
            flow.one(clean, f"{out}/{k}.wav"); D[k] = dur(f"{out}/{k}.wav")
            tot = flow.weight(clean); cues = {}
            for m in re.finditer(r"\{(\d)\}", vo):
                before = re.sub(r"\{\d\}", "", vo[:m.start()])
                cues[int(m.group(1))] = D[k] * flow.weight(before) / tot
        CUES[k] = cues
    T, cur = {}, 0.12
    for b in spec["beats"]:
        k = b["key"]; T[k] = cur
        cur = T[k] + max(D[k] + b.get("gap", 0.22), b.get("hold", 0))
    plan.W = W
    return T, D, {k: {n: T[k] + v for n, v in c.items()} for k, c in CUES.items()}

def captions(c):
    divs, n = [], 0
    for b in c.spec["beats"]:
        k = b["key"]; words = b["disp"].split(); s, e = c.T[k], c.T[k] + c.D[k]
        wts = [len(w) + (3 if w[-1] in ".?!" else 1 if w[-1] == "," else 0) + 1 for w in words]
        tot = sum(wts); times = []; t = s
        for w in wts: times.append(t); t += (e - s) * w / tot
        ws = getattr(plan, "W", {}).get(k)
        if ws:
            if len(ws) == len(words): times = [s + x for x in ws]
            else: times = [s + ws[min(len(ws) - 1, round(i * (len(ws) - 1) / max(len(words) - 1, 1)))] for i in range(len(words))]
        groups, cur = [], []
        for i, w in enumerate(words):
            cur.append(i)
            if len(" ".join(words[j] for j in cur)) > 17 or w[-1] in ".?!" or len(cur) == 3:
                groups.append(cur); cur = []
        if cur: groups.append(cur)
        for gi, grp in enumerate(groups):
            gs = times[grp[0]]; ge = times[grp[-1]] + (e - s) * wts[grp[-1]] / tot
            spans = "".join(f'<span class="w" id="w{n}_{j}">{words[i].replace("&","&amp;")}</span>{" " if j < len(grp)-1 else ""}' for j, i in enumerate(grp))
            divs.append(f'<div class="cap" id="cap{n}"><span class="box">{spans}</span></div>')
            if n: c.g(f'tl.set("#cap{n-1}",{{opacity:0}},{gs:.2f});')
            c.g(f'tl.fromTo("#cap{n}",{{opacity:0,y:14,scale:0.96}},{{opacity:1,y:0,scale:1,duration:0.09}},{gs:.2f});')
            for j, i in enumerate(grp):
                c.g(f'tl.set("#w{n}_{j}",{{className:"w on"}},{times[i]:.2f});')
                if j < len(grp) - 1: c.g(f'tl.set("#w{n}_{j}",{{className:"w"}},{times[grp[j+1]]:.2f});')
            c.g(f'tl.to("#cap{n}",{{opacity:0,duration:0.05}},{ge-0.04:.2f});')
            n += 1
    return "".join(divs)

def build(spec):
    out = f"{ROOT}/out/{spec['id']}"; os.makedirs(out, exist_ok=True)
    for f in ("700", "800", "900"): shutil.copy(f"{A}/inter-latin-{f}-normal.woff2", out)
    shutil.copy(f"{ROOT}/node_modules/gsap/dist/gsap.min.js", out)
    c = Ctx(spec); c.titles = []
    c.T, c.D, c.C = plan(spec, out)
    last = spec["beats"][-1]["key"]
    c.TOTAL = round(c.T[last] + c.D[last] + spec.get("tail", 0.7), 2)
    TOT = c.TOTAL
    c.g(f'tl.fromTo("#grid",{{y:0,x:0}},{{y:-180,x:-60,duration:{TOT},ease:"none"}},0);')
    c.g(f'tl.fromTo("#o1",{{x:0,y:0}},{{x:220,y:160,duration:{TOT},ease:"sine.inOut"}},0);')
    c.g(f'tl.fromTo("#o2",{{x:0,y:0}},{{x:-220,y:-180,duration:{TOT},ease:"sine.inOut"}},0);')
    c.g(f'tl.fromTo("#pbar",{{scaleX:0}},{{scaleX:1,duration:{TOT},ease:"none"}},0);')
    import random; rnd = random.Random(hash(spec["id"]) % 1000)
    sparks = ""
    for i in range(18):
        x, y = rnd.randint(40, 1040), rnd.randint(300, 1800); d = rnd.uniform(5, 9); st = rnd.uniform(0, 4)
        sparks += f'<i class="spark" id="sp{i}" style="left:{x}px;top:{y}px"></i>'
        c.g(f'tl.fromTo("#sp{i}",{{opacity:0,y:0}},{{opacity:.55,y:-160,duration:{d/2:.2f},ease:"sine.out",yoyo:true,repeat:{int(TOT/d)+1}}},{st:.2f});')
    c.sound("punch", 0.02, 0.9)
    c.music_auto = []
    stage = spec["compose"](c)
    # Full screen is the default (Olivier, 2026-10-18): the art fills 1080x1920, titles and captions sit on soft fades.
    # Compose code keeps its 1080x960 "core" coordinates (placed at y=440); full height art uses top:-440px, height:1920px.
    # layout="strip" only for rebuilding old reference specs.
    full = spec.get("layout", "full") == "full"
    if full and 'id="core"' not in stage:
        import fullbleed
        stage = fullbleed.wrap(stage)
    c.L.insert(0, 'tl.fromTo("#tt0",{opacity:1,scale:1.06},{opacity:1,scale:1,duration:0.5,ease:"back.out(2)"},0);')
    tE = c.T[last] + (c.D[last] + spec.get("end_pad", 0.25) if spec.get("end_after_last") else 0)  # end card after the last line (Shorts that end on a question)
    c.g(f'tl.fromTo("#end",{{opacity:0}},{{opacity:1,duration:0.3}},{tE:.2f});')
    c.g(f'tl.fromTo("#end-l1",{{opacity:0,y:30}},{{opacity:1,y:0,duration:0.35,ease:"power3.out"}},{tE+0.1:.2f});')
    c.g(f'tl.fromTo("#end-site",{{opacity:0,scale:1.4}},{{opacity:1,scale:1,duration:0.4,ease:"back.out(2)"}},{tE+0.35:.2f});')
    c.g(f'tl.fromTo("#end-ul",{{scaleX:0}},{{scaleX:1,duration:0.45,ease:"power3.out"}},{tE+0.6:.2f});')
    c.sound("pop", tE + 0.35, 0.8)
    c.g(f'tl.fromTo("#end-site",{{scale:1}},{{scale:1.06,duration:{max(0.5, TOT - tE - 0.75):.2f},ease:"sine.inOut",immediateRender:false}},{tE+0.75:.2f});')
    c.g(f'tl.fromTo("#end-l1",{{y:0}},{{y:-12,duration:{max(0.5, TOT - tE - 0.45):.2f},ease:"sine.inOut",immediateRender:false}},{tE+0.45:.2f});')
    caps = captions(c)
    titles = "".join(f'<div class="tt {cls}" id="tt{i}" style="{"opacity:1;" if i==0 else ""}{f"font-size:{sz}px;" if sz else ""}"><div>{h}</div></div>' for i, h, cls, sz in c.titles)
    v = spec.get("vars", "")
    lottie_tag = '<script src="lottie.min.js"></script>' if os.path.exists(f"{out}/lottie.min.js") else ""
    html = f'''<!doctype html><html><head><meta charset="utf-8"><title>{spec["id"]}</title><script src="gsap.min.js"></script>{lottie_tag}
<style>{fonts()}{CSS}{__import__("fullbleed").CSS if full else ""}{spec.get("css","")}</style></head><body>
<div id="root" style="{v}"><div class="bg"></div><div class="orb" id="o1"></div><div class="orb" id="o2"></div><div id="grid"></div>{sparks}
<div id="progress"><i id="pbar"></i></div>
<div id="badge"><span>{spec["badge"]}</span></div>
<div id="titles">{titles}</div>
<div id="stagewrap"><div id="cam"><div id="stage">{stage}</div></div></div>
<div id="captions">{caps}</div>
<div id="wm">{SITE if spec.get("watermark", True) else ""}</div>
<div id="end"><div id="end-l1">{spec["end_line"]}</div><div id="end-site">{SITE}</div><i id="end-ul"></i></div>
</div>
<script>
window.__timelines = {{}}; const tl = gsap.timeline({{ paused: true }});
{chr(10).join(c.L)}
tl.set({{}}, {{}}, {TOT});
window.__timelines["main"] = tl;
</script></body></html>'''
    open(f"{out}/index.html", "w", encoding="utf-8").write(html)
    inputs, filt, labels, idx = [], [], [], 0
    for b in spec["beats"]:
        k = b["key"]; inputs.append(f'-i "{out}/{k}.wav"'); ms = int(c.T[k] * 1000)
        filt.append(f"[{idx}:a]adelay={ms}|{ms}[a{idx}]"); labels.append(f"[a{idx}]"); idx += 1
    for name, t, gn in c.sfx:
        inputs.append(f'-i "{A}/{name}.wav"'); ms = int(max(0, t) * 1000)
        filt.append(f"[{idx}:a]volume={0.33*gn:.2f},adelay={ms}|{ms}[a{idx}]"); labels.append(f"[a{idx}]"); idx += 1
    base = ";".join(filt) + ";" + "".join(labels) + f"amix=inputs={idx}:normalize=0:dropout_transition=0,apad=whole_dur={TOT},atrim=0:{TOT}"
    mus = f"{out}/music.wav"
    music.make_music(TOT, mus, bpm=spec.get("bpm", 88), key=spec.get("key", 0), seed=spec.get("seed", 1))
    nm = f"[{idx}:a]"
    auto = "".join(f",volume=enable='between(t,{a:.2f},{b:.2f})':volume={v}" for a, b, v in c.music_auto)
    fc = (f"{base}[vx];[vx]asplit=2[v1][v2];{nm}atrim=0:{TOT},afade=t=in:d=0.4,afade=t=out:st={TOT-1.0:.2f}:d=1.0,volume=0.6{auto}[mu];"
          f"[mu][v1]sidechaincompress=threshold=0.03:ratio=4:attack=15:release=400[md];"
          f"[v2][md]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[m]")
    subprocess.run(f'ffmpeg -y -loglevel error {" ".join(inputs)} -i "{mus}" -filter_complex "{fc}" -map "[m]" -ar 44100 -ac 2 "{out}/mix.wav"', shell=True, check=True)
    fc2 = base + ",loudnorm=I=-14:TP=-1.5:LRA=9[m]"
    subprocess.run(f'ffmpeg -y -loglevel error {" ".join(inputs)} -filter_complex "{fc2}" -map "[m]" -ar 44100 -ac 2 "{out}/mix_nomusic.wav"', shell=True, check=True)
    json.dump(dict(total=TOT, T=c.T, D=c.D, C=c.C), open(f"{out}/meta.json", "w"))
    print("built", spec["id"], TOT)
    return out
