"""Shared kit for LevlPrep long video thumbnails (1280x720). Each design is an HTML string built with these helpers,
then rendered with render({name: html}, out_dir). See design.py for 5 reviewed examples of the quality bar."""
import base64, os, subprocess, json, hashlib
from PIL import Image, ImageFilter, ImageEnhance

FONT = "/home/claude/lp/node_modules/@fontsource/inter/files/inter-latin-{}-normal.woff2"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

# Course colors from the site's theme.css. accent = main color, deep = darkest background tone, mid = lighter bg tone
COURSE = {
    "nremt":  dict(label="NREMT",        accent="#3FC2A9", deep="#07131a", mid="#1f5f55"),
    "orgo":   dict(label="ORGO",         accent="#9C8FE0", deep="#120d2c", mid="#2a1f63"),
    "anp":    dict(label="A&P",          accent="#EC846C", deep="#160a12", mid="#4a1d18"),
    "apbio":  dict(label="AP BIO",       accent="#8CC86E", deep="#0e1f10", mid="#1f4a22"),
    "apchem": dict(label="AP CHEM",      accent="#5A82E6", deep="#0a1230", mid="#1d3a8a"),
    "phys":   dict(label="AP PHYSICS 1", accent="#EBA532", deep="#0d0903", mid="#3a2a0c"),
    "calc":   dict(label="AP CALC",      accent="#E8507A", deep="#1a0710", mid="#4d1428"),
}


def uri(path, crop=None, blur=0, dark=1.0, sat=1.0, scale=None):
    """Image as a data URI. crop=(l,t,r,b) in source pixels. Frames from long videos are 1920x1080."""
    im = Image.open(path).convert("RGBA")
    if crop: im = im.crop(crop)
    if scale: im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    if dark != 1.0: im = ImageEnhance.Brightness(im).enhance(dark)
    if sat != 1.0: im = ImageEnhance.Color(im).enhance(sat)
    tmp = "/tmp/_u" + hashlib.md5(repr((path, crop, blur, dark, sat, scale)).encode()).hexdigest() + ".png"
    if not os.path.exists(tmp): im.save(tmp)
    return "data:image/png;base64," + base64.b64encode(open(tmp, "rb").read()).decode()


def _font(w):
    return "data:font/woff2;base64," + base64.b64encode(open(FONT.format(w), "rb").read()).decode()


_FONTS = None
def base_css():
    global _FONTS
    if _FONTS is None:
        _FONTS = "".join(f"@font-face{{font-family:I;font-weight:{w};src:url({_font(w)})}}" for w in (700, 800, 900))
    return _FONTS + """
*{box-sizing:border-box;margin:0} body{width:1280px;height:720px;overflow:hidden;font-family:I,Arial;position:relative}
.abs{position:absolute}
.big{font-weight:900;text-transform:uppercase;line-height:.92;letter-spacing:-3px;paint-order:stroke fill}
.mark{position:absolute;left:28px;bottom:26px;font-weight:800;font-size:30px;color:#fff;background:rgba(10,14,28,.78);border-radius:12px;padding:4px 14px}
.mark b{font-weight:900}
.pill{position:absolute;font-weight:900;font-size:26px;letter-spacing:4px;border-radius:999px;padding:6px 20px}
.sub{position:absolute;font-weight:800;font-size:34px;color:#fff;letter-spacing:0}
"""


def title(lines, c, x=44, y=150, size=130, width=640, stroke=12, extra=""):
    """lines: list of (text, color) with color 'w' for white or 'a' for the course accent or a hex. Text is the TOPIC, never a question."""
    col = lambda k: "#fff" if k == "w" else c["accent"] if k == "a" else k
    inner = "".join(f'<div style="color:{col(k)}">{t}</div>' for t, k in lines)
    return (f'<div class="abs big" style="left:{x}px;top:{y}px;font-size:{size}px;width:{width}px;'
            f'-webkit-text-stroke:{stroke}px {c["deep"]};{extra}">{inner}</div>')


def pill(c, x=44, y=56, text=None, invert=False):
    t = text or c["label"]
    if invert:
        return f'<div class=pill style="left:{x}px;top:{y}px;color:{c["accent"]};background:{c["deep"]}e6;border:3px solid {c["accent"]}">{t}</div>'
    return f'<div class=pill style="left:{x}px;top:{y}px;color:{c["deep"]};background:{c["accent"]}">{t}</div>'


def outline_filter(c, px=6, glow=True):
    d = [(px, 0), (-px, 0), (0, px), (0, -px), (px * .7, px * .7), (-px * .7, px * .7), (px * .7, -px * .7), (-px * .7, -px * .7)]
    f = " ".join(f"drop-shadow({a:.1f}px {b:.1f}px 0 #fff)" for a, b in d)
    if glow: f += f" drop-shadow(0 0 40px {c['accent']})"
    return f + " drop-shadow(0 20px 30px rgba(0,0,0,.6))"


def page(body, c, css="", mark=True):
    m = f"<div class='mark'><b style='color:{c['accent']}'>Levl</b>Prep</div>" if mark else ""
    return f"<!doctype html><html><head><meta charset='utf-8'><style>{base_css()}{css}</style></head><body>{body}{m}</body></html>"


def render(designs, out):
    """designs: {name: html}. Writes out/<name>.png at 1280x720."""
    os.makedirs(out, exist_ok=True)
    for k, h in designs.items():
        open(f"{out}/{k}.html", "w").write(h)
    names = json.dumps(list(designs))
    js = f"""const {{chromium}}=require('/home/claude/lp/node_modules/playwright-core');(async()=>{{
const b=await chromium.launch({{executablePath:'{CHROME}',args:['--no-sandbox','--disable-gpu']}});
const p=await b.newPage({{viewport:{{width:1280,height:720}}}});
for(const k of {names}){{await p.goto('file://{os.path.abspath(out)}/'+k+'.html');await p.evaluate(()=>document.fonts.ready);await p.screenshot({{path:'{os.path.abspath(out)}/'+k+'.png'}});}}
await b.close();}})();"""
    subprocess.run(["node", "-e", js], check=True)
    for k in designs: os.remove(f"{out}/{k}.html")


def sheet(out, names, labels, path, feed=True):
    """Labeled review sheet: each thumbnail at 640x360 plus the real feed sizes (246x138 search, 168x94 sidebar)."""
    from PIL import ImageDraw, ImageFont
    F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
    rowh = 360 + 56
    s = Image.new("RGB", (640 + 246 + 168 + 80, rowh * len(names) + 10), (18, 18, 18)); d = ImageDraw.Draw(s)
    for r, (n, lab) in enumerate(zip(names, labels)):
        y = 10 + r * rowh; im = Image.open(f"{out}/{n}.png").convert("RGB")
        d.text((20, y), lab, fill=(235, 235, 235), font=F)
        s.paste(im.resize((640, 360), Image.LANCZOS), (20, y + 42))
        if feed:
            s.paste(im.resize((246, 138), Image.LANCZOS), (680, y + 42))
            s.paste(im.resize((168, 94), Image.LANCZOS), (946, y + 42))
    s.save(path)
    return path


# ---- v3 additions (owner's reference style: course pill, title case topic title, yellow handwritten scope line, levlprep.com) ----
KALAM = "/home/claude/lp/node_modules/@fontsource/kalam/files/kalam-latin-700-normal.woff2"


def css_v3():
    k = "data:font/woff2;base64," + base64.b64encode(open(KALAM, "rb").read()).decode()
    return f"@font-face{{font-family:K;font-weight:700;src:url({k})}}" + """
.t3{position:absolute;font-weight:900;line-height:.98;letter-spacing:-2px;color:#fff}
.scope{position:absolute;font-family:K;font-weight:700;color:#ffd23f;letter-spacing:.5px}
.url{position:absolute;left:44px;bottom:30px;font-weight:800;font-size:26px;color:#c9d2e3}
"""


def pill3(c, text, x=44, y=50):
    """Outlined pill like the owner's reference: 'NREMT · CH 1', 'ORGO · START HERE'."""
    return (f'<div class=pill style="left:{x}px;top:{y}px;font-size:22px;letter-spacing:3px;color:{c["accent"]};'
            f'background:{c["deep"]}cc;border:3px solid {c["accent"]};padding:5px 18px">{text}</div>')


def title3(lines, c, x=44, y=130, size=104):
    """Title case topic title (like 'How EMS Works', 'Atomic Structure'). lines: [(text, 'w'|'a'|hex)]."""
    col = lambda k: "#fff" if k == "w" else c["accent"] if k == "a" else k
    inner = "".join(f'<div style="color:{col(k)}">{t}</div>' for t, k in lines)
    return f'<div class=t3 style="left:{x}px;top:{y}px;font-size:{size}px;text-shadow:0 6px 0 {c["deep"]},0 0 30px rgba(0,0,0,.5)">{inner}</div>'


def scope(text, x=46, y=400, size=44):
    """Yellow handwritten line that sums up the WHOLE video's scope (e.g. '911 call → hospital')."""
    return f'<div class=scope style="left:{x}px;top:{y}px;font-size:{size}px">{text}</div>'


def page3(body, c, css=""):
    """Like page(), but with the levlprep.com footer of the owner's reference instead of the LevlPrep mark."""
    return (f"<!doctype html><html><head><meta charset='utf-8'><style>{base_css()}{css_v3()}{css}</style></head>"
            f"<body>{body}<div class=url>levlprep.com</div></body></html>")
