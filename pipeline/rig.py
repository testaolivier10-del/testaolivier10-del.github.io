"""Cut-out rigs for library characters (added 2026-10-17).

A rig splits one character pose PNG into layers so the person can move smoothly instead of only swapping poses:
  base  : the whole figure with the head cut out above the neck seam
  head  : the head (hair, face, ears) on its own layer, faded into the neck so the seam never shows
  lids  : skin colored eyelids drawn over each eye (blinks and squints)
Rig definitions live in characters/rigs.json (one entry per pose, in the pose PNG's own pixel coordinates):
  {"frank-chest": {"head": [[x,y],...], "seam": [y_top, y_bottom], "pivot": [x,y],
                   "eyes": [[cx,cy,rx,ry], ...], "lash": "#3a2a24"}}
Use:
  svg = rig.char(c, "frank-chest", x, y, h, "fr")      # like lpx.char, same placement and flip
  rig.idle(c, "fr", 0, c.TOTAL, seed=1)               # breathing, blinks, small head sway
  rig.react(c, "fr", "wince", t)                       # wince, nod, shake, lookup, relief, squint
Every motion is a GSAP tween on the main timeline, so frames are exact when the renderer seeks.
"""
import json, os, random
from PIL import Image, ImageDraw, ImageFilter

LP = "/home/claude/lp"
CHARS = "/tmp/m/characters"
RIGS = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "rigs.json")))


def _src(name):
    p = f"{LP}/gen/{name}.png"
    return p if os.path.exists(p) else f"{CHARS}/{name}.png"


def layers(name, out):
    """Write <name>_base.png and <name>_head.png (both full canvas size) into out; return (w, h, rig)."""
    r = RIGS[name]
    im = Image.open(_src(name)).convert("RGBA")
    W, H = im.size
    y0, y1 = r["seam"]
    poly = Image.new("L", (W, H), 0)
    ImageDraw.Draw(poly).polygon([tuple(p) for p in r["head"]], fill=255)
    poly = poly.filter(ImageFilter.GaussianBlur(0.8))
    # vertical ramp: 1 above the seam top, fading to 0 at the seam bottom
    ramp = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(ramp)
    for y in range(H):
        v = 255 if y <= y0 else (0 if y >= y1 else int(255 * (y1 - y) / (y1 - y0)))
        d.line([(0, y), (W, y)], fill=v)
    a = im.split()[3]
    from PIL import ImageChops
    head_a = ImageChops.multiply(ImageChops.multiply(a, poly), ramp)
    head = im.copy(); head.putalpha(head_a)
    # base keeps everything except the head above the seam top (so the neck and collar stay put)
    cut = Image.new("L", (W, H), 0)
    ImageDraw.Draw(cut).polygon([tuple(p) for p in r["head"]], fill=255)
    top = Image.new("L", (W, H), 0); ImageDraw.Draw(top).rectangle([0, 0, W, y0], fill=255)
    hole = ImageChops.multiply(cut, top).filter(ImageFilter.MinFilter(5))  # shrink the hole so base and head overlap at the cut
    base_a = ImageChops.multiply(a, ImageChops.invert(hole))
    base = im.copy(); base.putalpha(base_a)
    if r.get("still_head"):
        # head never moves in this pose (a hand overlaps the face): keep the figure whole, lids only
        base = im.copy(); head = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    base.save(f"{out}/{name}_base.png"); head.save(f"{out}/{name}_head.png")
    return W, H, r


def lid_color(name, cx, cy, rx, ry):
    """Average skin color just above the eye (the brow ridge band), used for the eyelid."""
    im = Image.open(_src(name)).convert("RGBA")
    px = []
    for x in range(int(cx - rx), int(cx + rx) + 1):
        for y in range(int(cy - ry - 4), int(cy - ry - 1)):
            p = im.getpixel((x, y))
            if p[3] > 200 and sum(p[:3]) > 330:
                px.append(p)
    if not px:
        return "#e8b08c"
    r = sorted(px, key=lambda p: sum(p[:3]))[len(px) // 2]
    return "#%02x%02x%02x" % r[:3]


def char(c, name, x, y, h, cid, flip=False, opacity=1):
    """Rigged pose placed like lpx.char (top left x,y, height h). Returns SVG."""
    out = f"{LP}/out/{c.spec['id']}"
    W, H, r = layers(name, out)
    s = h / H
    tr = f"translate({x + W * s:.1f} {y}) scale({-s:.4f} {s:.4f})" if flip else f"translate({x} {y}) scale({s:.4f})"
    px, py = r["pivot"]
    lash = r.get("lash", "#2a1a14")
    lids, sets = "", []
    for i, (ex, ey, rx, ry) in enumerate(r["eyes"]):
        col = r.get("lid") or lid_color(name, ex, ey, rx, ry)
        # lid hinged at the top of the eye; the lash line rides on its lower edge
        lid = (f'<rect x="{ex - rx - 2}" y="{ey - ry - 2}" width="{2 * rx + 4}" height="1" fill="none"/>'
               f'<ellipse cx="{ex}" cy="{ey}" rx="{rx + 1.2}" ry="{ry + 1.4}" fill="{col}"/>'
               f'<path d="M{ex - rx - 0.6} {ey + 0.4} Q{ex} {ey + ry + 1.6} {ex + rx + 0.6} {ey + 0.4}" stroke="{lash}" stroke-width="{max(1.2, ry * 0.32):.1f}" fill="none" stroke-linecap="round"/>')
        for kind in ("blink", "sq"):
            lids += f'<g id="{cid}-{kind}{i}" class="{cid}-{kind}">{lid}</g>'
            sets.append(f'gsap.set("#{cid}-{kind}{i}",{{transformOrigin:"50% 0%",scaleY:0}});')
    o = f"{px}px {py}px"
    sets.append(f'gsap.set("#{cid}-br",{{transformOrigin:"{W / 2}px {H}px"}}); gsap.set("#{cid}-sw, #{cid}-hd",{{transformOrigin:"{o}"}});')
    for l in sets: c.g(l)
    return (f'<g id="{cid}" opacity="{opacity}"><g transform="{tr}">'
            f'<g id="{cid}-br"><rect width="{W}" height="{H}" fill="none"/>'
            f'<image href="{name}_base.png" width="{W}" height="{H}"/>'
            f'<g id="{cid}-sw"><g id="{cid}-hd"><rect width="{W}" height="{H}" fill="none"/>'
            f'<image href="{name}_head.png" width="{W}" height="{H}"/>{lids}</g></g>'
            f'</g></g></g>')


def idle(c, cid, t0, t1, seed=1, breath=3.4, amp=0.010, sway=1.2, blink=True, fast=False):
    """Life while on screen: breathing (faster and deeper if fast), blinks every 2.5 to 5 s, slow head sway."""
    g = c.g
    rnd = random.Random(seed)
    per = 1.5 if fast else breath
    a = amp * (1.6 if fast else 1.0)
    n = max(1, int((t1 - t0) / (per / 2)))
    g(f'tl.fromTo("#{cid}-br",{{scaleY:1,scaleX:1}},{{scaleY:{1 + a:.4f},scaleX:{1 + a * 0.35:.4f},duration:{per / 2:.2f},yoyo:true,repeat:{n - 1},ease:"sine.inOut",immediateRender:false}},{t0:.2f});')
    if sway:
        sp = 4.2 + rnd.uniform(-0.6, 0.6)
        n = max(1, int((t1 - t0) / (sp / 2)))
        g(f'tl.fromTo("#{cid}-sw",{{rotation:{-sway:.2f}}},{{rotation:{sway:.2f},duration:{sp / 2:.2f},yoyo:true,repeat:{n - 1},ease:"sine.inOut",immediateRender:false}},{t0:.2f});')
    if blink:
        t = t0 + rnd.uniform(0.6, 1.8)
        while t < t1 - 0.3:
            blink_at(c, cid, t)
            if rnd.random() < 0.18 and t + 0.35 < t1 - 0.3:
                blink_at(c, cid, t + 0.3)   # an occasional double blink
            t += rnd.uniform(2.4, 4.8)


def blink_at(c, cid, t):
    c.g(f'tl.to(".{cid}-blink",{{scaleY:1,duration:0.07,ease:"power2.in"}},{t:.2f}); tl.to(".{cid}-blink",{{scaleY:0,duration:0.11,ease:"power2.out"}},{t + 0.09:.2f});')


def react(c, cid, kind, t, k=1.0):
    """Short reactions on the word: wince, nod, shake, lookup, relief, squint, startle."""
    g = c.g
    hd, sq = f"#{cid}-hd", f".{cid}-sq"
    if kind == "wince":
        g(f'tl.to("{sq}",{{scaleY:{0.6 * k:.2f},duration:0.12,ease:"power2.out"}},{t:.2f}); tl.to("{sq}",{{scaleY:0,duration:0.35,ease:"sine.inOut"}},{t + 0.75:.2f});')
        g(f'tl.to("{hd}",{{rotation:{3.2 * k:.2f},y:{3 * k:.1f},duration:0.14,ease:"power2.out"}},{t:.2f}); tl.to("{hd}",{{rotation:0,y:0,duration:0.5,ease:"sine.inOut"}},{t + 0.6:.2f});')
        g(f'tl.to("#{cid}-br",{{y:{-3 * k:.1f},duration:0.12,ease:"power2.out"}},{t:.2f}); tl.to("#{cid}-br",{{y:0,duration:0.5,ease:"sine.inOut"}},{t + 0.55:.2f});')
    elif kind == "squint":
        g(f'tl.to("{sq}",{{scaleY:{0.45 * k:.2f},duration:0.2}},{t:.2f}); tl.to("{sq}",{{scaleY:0,duration:0.3}},{t + 0.9:.2f});')
    elif kind == "nod":
        g(f'tl.to("{hd}",{{rotation:{4 * k:.2f},duration:0.16,ease:"power2.out"}},{t:.2f}); tl.to("{hd}",{{rotation:0,duration:0.22,ease:"sine.inOut"}},{t + 0.16:.2f});')
    elif kind == "shake":
        g(f'tl.to("{hd}",{{rotation:{-3 * k:.2f},duration:0.12,yoyo:true,repeat:3,ease:"sine.inOut"}},{t:.2f}); tl.to("{hd}",{{rotation:0,duration:0.15}},{t + 0.48:.2f});')
    elif kind == "lookup":
        g(f'tl.to("{hd}",{{rotation:{-3 * k:.2f},duration:0.3,ease:"power2.out"}},{t:.2f}); tl.to("{hd}",{{rotation:0,duration:0.5,ease:"sine.inOut"}},{t + 1.0:.2f});')
    elif kind == "relief":
        g(f'tl.to("{hd}",{{rotation:{-2 * k:.2f},y:-2,duration:0.6,ease:"sine.out"}},{t:.2f}); tl.to("{hd}",{{rotation:0,y:0,duration:0.8,ease:"sine.inOut"}},{t + 1.2:.2f});')
        g(f'tl.to("#{cid}-br",{{scaleY:1.02,duration:0.6,yoyo:true,repeat:1,ease:"sine.inOut"}},{t:.2f});')
    elif kind == "startle":
        g(f'tl.to("{hd}",{{rotation:{-4 * k:.2f},y:-4,duration:0.1,ease:"power3.out"}},{t:.2f}); tl.to("{hd}",{{rotation:0,y:0,duration:0.45,ease:"back.out(2)"}},{t + 0.25:.2f});')
    else:
        raise ValueError(kind)


def debug(name, path):
    """Preview a rig definition: head polygon, seam lines, pivot and eye boxes over the pose."""
    r = RIGS[name]
    im = Image.open(_src(name)).convert("RGBA")
    bg = Image.new("RGBA", im.size, (40, 40, 60, 255)); bg.alpha_composite(im)
    d = ImageDraw.Draw(bg)
    d.polygon([tuple(p) for p in r["head"]], outline=(255, 255, 0, 255))
    for y in r["seam"]: d.line([(0, y), (im.width, y)], fill=(0, 255, 255, 255))
    px, py = r["pivot"]; d.ellipse([px - 3, py - 3, px + 3, py + 3], fill=(255, 0, 0, 255))
    for ex, ey, rx, ry in r["eyes"]: d.ellipse([ex - rx, ey - ry, ex + rx, ey + ry], outline=(255, 0, 255, 255))
    bg = bg.resize((im.width * 2, im.height * 2))
    bg.convert("RGB").save(path)
