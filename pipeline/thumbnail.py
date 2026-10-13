"""Professional thumbnails for LevlPrep (Shorts 1080x1920 and long videos 1280x720), designed as their own image,
not a frame grab. Rendered in headless Chromium with the brand fonts.

Rules this follows (from research on what top edu channels do; see claude/levlprep-quality-v2.md, Thumbnails):
one focal subject that is BIG (a person with a strong emotion, or the key diagram), 2 to 5 words of huge text,
high contrast with a darkened, blurred background, a white outline and glow that pops the subject off the
background, at most one inset or arrow that points at the payoff, no URL, a small consistent LevlPrep mark.

    import thumbnail as T
    T.make(dict(
        size="short",                                   # "short" 1080x1920 or "long" 1280x720
        bg="out/<id>/still_0.5.png", bg_crop=(450, 440, 1080, 1150), bg_blur=6, bg_dark=0.45, bg_pos="50% 30%", bg_zoom=1.15,
        subject=dict(src="characters/patient-a-recoil.png", x=-80, y=640, w=1300, outline="#fff", glow="#ff8a3d", flip=False),
        inset=dict(src="out/<id>/still_16.png", crop=(120, 560, 960, 1120), x=600, y=1180, d=420, ring="#ff6b6b", label="NUMB"),
        lines=[("NO PAIN?", "#ffd23f"), ("BAD SIGN", "#ff5a5a")], text_y=150, text_size=190,
        badge="NREMT", arrow=dict(x1=520, y1=1150, x2=640, y2=1280, color="#ffd23f"),
        overlay_svg="",                                  # optional extra SVG (fire, sparks) in thumbnail coordinates
    ), "out/<id>/thumb_pro.png")
    T.preview(["a.png", "b.png"], "short")  -> a sheet showing each thumbnail at real feed sizes, to judge readability

Make 3 genuinely different concepts per long video (different subject, words or angle, not color swaps) and
2 for each Short, look at them with preview(), and keep the one that is clearest at the smallest size.
"""
import os, json, base64, subprocess, html as H
from PIL import Image

LP = "/home/claude/lp"
SIZES = {"short": (1080, 1920), "long": (1280, 720)}


def _uri(path, crop=None):
    im = Image.open(path)
    if crop:
        im = im.crop(crop)
    tmp = f"/tmp/_th_{abs(hash((path, crop)))}.png"
    im.save(tmp)
    return "data:image/png;base64," + base64.b64encode(open(tmp, "rb").read()).decode()


def _font(w):
    p = f"{LP}/assets/inter-latin-{w}-normal.woff2"
    return "data:font/woff2;base64," + base64.b64encode(open(p, "rb").read()).decode()


def flame(x, y, s=1.0, rot=0):
    """Layered cartoon flame (red outer, orange body, white hot core, glow) centered at its base (x, y)."""
    p = "M0,0 C-60,-20 -70,-90 -30,-150 C-20,-110 0,-110 -5,-170 C30,-130 70,-90 55,-30 C50,-10 30,0 0,0 Z"
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s})">'
            f'<ellipse cx="0" cy="-60" rx="150" ry="170" fill="url(#fglow)"/>'
            f'<path d="{p}" fill="#e8331b" transform="scale(1.25)"/><path d="{p}" fill="#ff8a1f"/>'
            f'<path d="{p}" fill="#ffd34a" transform="translate(0,-4) scale(.62)"/><path d="{p}" fill="#fff6d0" transform="translate(0,-6) scale(.32)"/></g>')


FLAME_DEFS = '<defs><radialGradient id="fglow"><stop offset="0" stop-color="#ff8a1f" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a1f" stop-opacity="0"/></radialGradient></defs>'


def make(spec, out):
    W, Hh = SIZES[spec.get("size", "short")]
    k = W / 1080 if spec.get("size", "short") == "short" else W / 1280
    parts = []
    bg = spec.get("bg")
    if bg:
        parts.append(f'<div class="bg" style="background-image:url({_uri(bg, tuple(spec["bg_crop"]) if spec.get("bg_crop") else None)});background-position:{spec.get("bg_pos","50% 40%")};'
                     f'transform:scale({spec.get("bg_zoom",1.15)});filter:blur({spec.get("bg_blur",6)}px) saturate(1.15)"></div>'
                     f'<div class="shade" style="opacity:{spec.get("bg_dark",0.45)}"></div>')
    parts.append('<div class="vig"></div>')
    s = spec.get("subject")
    if s:
        o, gl, t = s.get("outline", "#fff"), s.get("glow", "#2ee6d6"), s.get("outline_px", 6)
        dirs = [(t, 0), (-t, 0), (0, t), (0, -t), (t * .7, t * .7), (-t * .7, t * .7), (t * .7, -t * .7), (-t * .7, -t * .7)]
        f = " ".join(f"drop-shadow({x:.1f}px {y:.1f}px 0 {o})" for x, y in dirs) + f" drop-shadow(0 0 {40*k:.0f}px {gl}) drop-shadow(0 {24*k:.0f}px {30*k:.0f}px rgba(0,0,0,.6))"
        parts.append(f'<img class="subj" src="{_uri(s["src"])}" style="left:{s["x"]}px;top:{s["y"]}px;width:{s["w"]}px;'
                     f'filter:{f};{"transform:scaleX(-1);" if s.get("flip") else ""}">')
    if spec.get("overlay_svg"):
        parts.append(f'<svg class="ov" viewBox="0 0 {W} {Hh}">{spec["overlay_svg"]}</svg>')
    a = spec.get("arrow")
    if a:
        parts.append(f'''<svg class="ov" viewBox="0 0 {W} {Hh}"><defs><marker id="ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="{a.get("color","#ffd23f")}"/></marker></defs>
<path d="M{a["x1"]},{a["y1"]} Q{(a["x1"]+a["x2"])/2 + a.get("bend",40)},{(a["y1"]+a["y2"])/2 - a.get("bend",40)} {a["x2"]},{a["y2"]}" stroke="#081428" stroke-width="{34*k:.0f}" fill="none" stroke-linecap="round"/>
<path d="M{a["x1"]},{a["y1"]} Q{(a["x1"]+a["x2"])/2 + a.get("bend",40)},{(a["y1"]+a["y2"])/2 - a.get("bend",40)} {a["x2"]},{a["y2"]}" stroke="{a.get("color","#ffd23f")}" stroke-width="{20*k:.0f}" fill="none" stroke-linecap="round" marker-end="url(#ah)"/></svg>''')
    i = spec.get("inset")
    if i:
        ring = i.get("ring", "#ffd23f")
        parts.append(f'<div class="inset" style="left:{i["x"]}px;top:{i["y"]}px;width:{i["d"]}px;height:{i["d"]}px;border-color:{ring};'
                     f'box-shadow:0 0 0 {10*k:.0f}px #081428,0 0 {50*k:.0f}px {ring},0 {20*k:.0f}px {40*k:.0f}px rgba(0,0,0,.7)">'
                     f'<img src="{_uri(i["src"], tuple(i["crop"]) if i.get("crop") else None)}"></div>')
        if i.get("label"):
            parts.append(f'<div class="ilbl" style="left:{i["x"]}px;width:{i["d"]}px;top:{i["y"] + i["d"] - 30*k:.0f}px;background:{ring}">{H.escape(i["label"])}</div>')
    ty, ts = spec.get("text_y", 120), spec.get("text_size", 180)
    lines = "".join(f'<div style="color:{c}">{H.escape(t)}</div>' for t, c in spec.get("lines", []))
    parts.append(f'<div class="txt" style="top:{ty}px;font-size:{ts}px;{spec.get("text_css","")}">{lines}</div>')
    if spec.get("badge"):
        parts.append(f'<div class="badge" style="{spec.get("badge_css","")}">{H.escape(spec["badge"])}</div>')
    mk = spec.get("mark_css", "" if spec.get("size", "short") == "short" else "right:auto;left:30px")  # long: YouTube's timestamp sits bottom right
    parts.append(f'<div class="mark" style="{mk}"><b>Levl</b>Prep</div>')
    css = f"""
@font-face{{font-family:I;font-weight:900;src:url({_font(900)})}}@font-face{{font-family:I;font-weight:800;src:url({_font(800)})}}
*{{box-sizing:border-box;margin:0}} body{{width:{W}px;height:{Hh}px;overflow:hidden;background:#081428;font-family:I,Arial}}
.bg{{position:absolute;inset:-40px;background-size:cover}}
.shade{{position:absolute;inset:0;background:linear-gradient(180deg,#081428 0%,rgba(8,20,40,.55) 35%,rgba(8,20,40,.2) 60%,#081428 100%)}}
.vig{{position:absolute;inset:0;box-shadow:inset 0 0 {220*k:.0f}px {60*k:.0f}px rgba(0,0,0,.75)}}
.subj{{position:absolute}} .ov{{position:absolute;inset:0;width:100%;height:100%;overflow:visible}}
.inset{{position:absolute;border-radius:50%;overflow:hidden;border:{12*k:.0f}px solid}}
.inset img{{width:100%;height:100%;object-fit:cover}}
.ilbl{{position:absolute;text-align:center;font-weight:900;font-size:{58*k:.0f}px;color:#081428;border-radius:{40*k:.0f}px;padding:{4*k:.0f}px 0;letter-spacing:{3*k:.0f}px;width:auto}}
.txt{{position:absolute;left:{40*k:.0f}px;right:{40*k:.0f}px;text-align:center;font-weight:900;line-height:.98;letter-spacing:-{4*k:.0f}px;
  text-transform:uppercase;-webkit-text-stroke:{14*k:.0f}px #081428;paint-order:stroke fill;text-shadow:0 {10*k:.0f}px {0}px #081428,0 0 {50*k:.0f}px rgba(0,0,0,.6)}}
.badge{{position:absolute;left:50%;transform:translateX(-50%);top:{40*k:.0f}px;font-weight:900;font-size:{42*k:.0f}px;letter-spacing:{6*k:.0f}px;color:#2ee6d6;
  background:rgba(8,20,40,.85);border:{4*k:.0f}px solid #2ee6d6;border-radius:999px;padding:{8*k:.0f}px {30*k:.0f}px}}
.mark{{position:absolute;right:{36*k:.0f}px;bottom:{36*k:.0f}px;font-weight:800;font-size:{46*k:.0f}px;color:#fff;background:rgba(8,20,40,.8);
  border-radius:{16*k:.0f}px;padding:{6*k:.0f}px {18*k:.0f}px}} .mark b{{color:#2ee6d6;font-weight:900}}
"""
    page = f"<!doctype html><html><head><meta charset='utf-8'><style>{css}</style></head><body>{''.join(parts)}</body></html>"
    hp = out + ".html"
    open(hp, "w").write(page)
    js = f"""const {{chromium}}=require('{LP}/node_modules/playwright-core');(async()=>{{const fs=require('fs');
const d='/opt/pw-browsers';const v=fs.readdirSync(d).filter(x=>/^chromium-\\d+$/.test(x)).sort().pop();
const b=await chromium.launch({{executablePath:`${{d}}/${{v}}/chrome-linux/chrome`,args:['--no-sandbox','--disable-gpu']}});
const p=await b.newPage({{viewport:{{width:{W},height:{Hh}}}}});await p.goto('file://{os.path.abspath(hp)}');await p.evaluate(()=>document.fonts.ready);
await p.screenshot({{timeout:180000,path:'{os.path.abspath(out)}'}});await b.close();}})();"""
    subprocess.run(["node", "-e", js], check=True)
    os.remove(hp)
    return out


def preview(paths, size="short", out="/tmp/claude-0/thumb_preview.png"):
    """Each thumbnail at feed sizes on a dark app background: Shorts shelf (180x320) and big (360x640);
    long: home grid (360x202), search (246x138), suggested sidebar (168x94)."""
    from PIL import ImageDraw
    sz = [(360, 640), (180, 320)] if size == "short" else [(480, 270), (246, 138), (168, 94)]
    rowh = max(h for _, h in sz) + 30
    sheet = Image.new("RGB", (sum(w for w, _ in sz) + 30 * (len(sz) + 1), rowh * len(paths) + 20), (15, 15, 15))
    for r, p in enumerate(paths):
        im = Image.open(p).convert("RGB"); x = 30
        for w, h in sz:
            sheet.paste(im.resize((w, h), Image.LANCZOS), (x, 20 + r * rowh)); x += w + 30
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.save(out)
    return out
