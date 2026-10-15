"""Shared helpers for w1014 Shorts (engine2): word timestamps, camera, characters, soft-style defs."""
import json, os, re, shutil

LP = "/home/claude/lp"
CHARS = "/tmp/m/characters"


def apply_gaps(spec):
    """Beat gaps from el_split's offsets.json so beats play at the take's natural spacing."""
    p = f"{LP}/out/{spec['id']}/offsets.json"
    if os.path.exists(p):
        g = json.load(open(p))
        for b in spec["beats"]:
            if b["key"] in g:
                b["gap"] = max(0.08, g[b["key"]])


def words(c, key):
    j = f"{LP}/out/{c.spec['id']}/{key}.el.json"
    al = json.load(open(j))["alignment"]
    ch, st = al["characters"], al["character_start_times_seconds"]
    ws, cur, s0 = [], "", None
    for a, t in zip(ch, st):
        if a.strip():
            if not cur: s0 = t
            cur += a
        elif cur:
            ws.append((cur, s0)); cur = ""
    if cur: ws.append((cur, s0))
    return [(re.sub(r"[^\w']", "", w).lower(), c.T[key] + t) for w, t in ws]


def wt(c, key, word, nth=1):
    """Absolute time the given word (case and punctuation insensitive) starts in beat key."""
    word = word.lower(); n = 0
    for w, t in words(c, key):
        if w == word:
            n += 1
            if n == nth: return t
    raise KeyError((key, word, nth))


def cam_to(c, t, px, py, k, d=0.8, ease="power2.inOut"):
    c.cam(t, k, -(px - 540) * k, -(py - 480) * k, d, ease)


def char(c, name, x, y, h, cid, flip=False, opacity=1, src=None):
    """Character pose <image> from the library (or gen/), height h, placed at x,y (top left)."""
    from PIL import Image
    p = src or (f"{LP}/gen/{name}.png" if os.path.exists(f"{LP}/gen/{name}.png") else f"{CHARS}/{name}.png")
    out = f"{LP}/out/{c.spec['id']}"
    shutil.copy(p, f"{out}/{name}.png")
    im = Image.open(p); w = im.width * h / im.height
    tr = f' transform="translate({2 * x + w:.0f} 0) scale(-1 1)"' if flip else ""
    return f'<g id="{cid}" opacity="{opacity}"><image href="{name}.png" x="{x}" y="{y}" width="{w:.0f}" height="{h}"{tr}/></g>'


def swap(c, a, b, t, overshoot=1.04, origin="50% 100%"):
    """Hard pose swap with a small overshoot."""
    c.set(a, t, "opacity:0"); c.set(b, t, "opacity:1")
    c.g(f'tl.fromTo("{b}",{{scale:{overshoot},transformOrigin:"{origin}"}},{{scale:1,duration:0.25,ease:"back.out(2)",immediateRender:false}},{t:.2f});')


DEFS = """
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".45"/></filter>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="glowS" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="blur16"><feGaussianBlur stdDeviation="16"/></filter>
"""


def chip(cid, x, y, text, col="#2ee6d6", fs=36, w=None, fill="#081428", op=0):
    w = w or int(len(text) * fs * 0.58 + 60)
    return (f'<g id="{cid}" opacity="{op}"><rect x="{x - w / 2:.0f}" y="{y}" width="{w}" height="{fs + 30}" rx="{(fs + 30) / 2:.0f}" fill="{fill}" stroke="{col}" stroke-width="4"/>'
            f'<text x="{x}" y="{y + fs + 6:.0f}" text-anchor="middle" class="lbl" font-size="{fs}" fill="{col}">{text}</text></g>')
