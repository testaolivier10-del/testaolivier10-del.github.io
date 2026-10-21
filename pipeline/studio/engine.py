"""Use the studio systems inside engine2 (Shorts) and engine_long (long videos) specs (2026-10-21).

    from studio import engine as S
    def compose(c):
        S.install(c)                                     # once per video
        svg = S.defs()                                   # style B lighting filters, put inside the stage <svg><defs>
        g_pm = S.rig(c, rig, clip, "pm", t0=2.0)         # vector character: returns '<g id="pm"></g>' for the svg
        g_face = S.face(c, C.FACE, tl, "pm", "head", C.FACE_AT, "pmface", t0=2.0)
        cv = S.paint(c, rig, paint, clip, "pmp", 1920, 1080, t0=2.0)    # painted character: a <canvas> layer
        img = S.liquid(c, "/path/frames", "bleed", start=2.4)           # liquid frames: an <img class="mclip">
Times passed to rig/face/paint are video seconds; t0 is when that layer's own clock starts (its clip time 0).
Each frame the renderer calls window.__studioHooks (render.js / render_long.js), so every layer is exact on
every frame and seeks in any order give the same picture.
"""
import json, os, shutil, sys
sys.path.insert(0, "/home/claude/lp")
from studio import vec

HERE = os.path.dirname(os.path.abspath(__file__))


def _src(name): return open(os.path.join(HERE, name)).read()


def install(c):
    if getattr(c, "_studio", False): return
    c._studio = True
    c.g("window.__studioHooks = window.__studioHooks || [];")
    for f in ("skin.js", "face.js", "paintskin.js"):
        c.g(_src(f))


def defs(**kw): return vec.defs(**kw)


def rig(c, rig_data, clip, gid, t0=0.0, t1=None, prefix=None):
    install(c)
    rd = dict(rig_data); rd["prefix"] = prefix or gid
    c.g(f"window.__rig_{gid} = new LPRig({json.dumps(rd)}, document.getElementById('{gid}'), {json.dumps(clip)});")
    end = "" if t1 is None else f" if (t > {t1}) t = {t1};"
    c.g(f"window.__studioHooks.push(async (t) => {{ t = t - {t0};{end} if (t < 0) t = 0; window.__W_{gid} = window.__rig_{gid}.draw(t); }});")
    return f'<g id="{gid}"></g>'


def face(c, design, timeline, rig_gid, bone, at, fid, t0=0.0):
    """A face on a rig's bone. design/timeline: face.js. at = eye position in the rig's rest pose."""
    install(c)
    tl = dict(timeline); tl.setdefault("id", fid)
    c.g(f"window.__face_{fid} = new LPFace(document.getElementById('{fid}_in'), {json.dumps(design)}, {json.dumps(tl)});")
    c.g(f"window.__studioHooks.push(async (t) => {{ const W = window.__W_{rig_gid}; if (!W) return;"
        f" const m = window.__rig_{rig_gid}.skinMatrix('{bone}', W);"
        f" document.getElementById('{fid}').setAttribute('transform', 'matrix(' + m.map(v => v.toFixed(4)).join(' ') + ')');"
        f" let tt = t - {t0}; if (tt < 0) tt = 0; window.__face_{fid}.draw(tt); }});")
    return f'<g id="{fid}"><g id="{fid}_in" transform="translate({at[0]} {at[1]})"></g></g>'


def paint(c, rig_data, paint_data, clip, cid, W, H, t0=0.0, style="position:absolute;left:0;top:0"):
    install(c)
    c.g(f"window.__paint_{cid} = new LPPaint({json.dumps(rig_data)}, {json.dumps(paint_data)}, document.getElementById('{cid}'), {json.dumps(clip)}, '');")
    c.g(f"window.__studioHooks.push(async (t) => {{ await window.__paint_{cid}.ready; let tt = t - {t0}; if (tt < 0) tt = 0;"
        f" window.__W_{cid} = window.__paint_{cid}.draw(tt); window.__rig_{cid} = window.__paint_{cid}.rig; }});")
    return f'<canvas id="{cid}" width="{W}" height="{H}" style="{style};width:{W}px;height:{H}px"></canvas>'


def liquid(c, frames_dir, name, start, x=0, y=0, w=None, h=None, out=None):
    """Liquid frames from liquid.render played as an mclip. Copies the frames next to the video page."""
    meta = json.load(open(f"{frames_dir}/meta.json"))
    out = out or f"/home/claude/lp/out/{c.spec['id']}"
    dst = f"{out}/{name}"
    if os.path.abspath(dst) != os.path.abspath(frames_dir):
        shutil.rmtree(dst, ignore_errors=True); shutil.copytree(frames_dir, dst)
    w = w or meta["W"]; h = h or meta["H"]
    return (f'<img class="mclip" data-dir="{name}" data-start="{start:.3f}" data-n="{meta["n"]}" data-fps="{meta["fps"]}" '
            f'src="{name}/0000.png" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;opacity:0">')
