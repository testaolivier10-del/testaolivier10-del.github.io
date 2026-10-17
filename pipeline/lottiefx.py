"""Lottie effects in LevlPrep videos (added 2026-10-17).

Ready made vector animations (Lottie JSON) placed on the stage and driven frame by frame by the GSAP timeline,
so every rendered frame is exact when the renderer seeks (no autoplay, no real time).
Files live in pipeline/lottie/ (see lottie/README.md for source, author and license of each one).
Only effects that match the flat LevlPrep look go in that folder.

  svg_part = lottiefx.place(c, "stars-gold", x, y, w, h, t, dur=1.2, fid="spk1")   # inside the stage <svg>
  lottiefx.place(..., recolor={"#f5c64a": "#ffd23f"})                           # optional color swap
The first call also adds the player script to the stage.
"""
import json, os, re, shutil

LP = "/home/claude/lp"
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(HERE, "lottie")
NAMES = {
    "stars-gold": "stars-gold-TgDsvafIZt",
    "sparkle-stars": "sparkle-stars-Z4URVaAq6R",
    "idea-bulb": "idea-bulb-QT00q9HsP4",
    "warning": "errorwarning-ybiaGTeYHl",
    "alert-dot": "connection-error-IifZWvcuUv",
    "ecg": "ecg-nFJKmPyH46",
}


def _hex_to_rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]


def _recolor(obj, pairs):
    """Swap solid colors (Lottie stores them as [r,g,b(,a)] in 0..1) that are close to a source hex."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "k" and isinstance(v, list) and len(v) in (3, 4) and all(isinstance(x, (int, float)) for x in v):
                for src, dst in pairs:
                    if all(abs(a - b) < 0.06 for a, b in zip(v[:3], src)):
                        obj[k] = dst + list(v[3:])
                        break
            else:
                _recolor(v, pairs)
    elif isinstance(obj, list):
        for x in obj:
            _recolor(x, pairs)


def place(c, name, x, y, w, h, t, dur=None, fid=None, recolor=None, loops=1, fade=0.15, opacity=1.0):
    """Put a Lottie effect at x,y (stage units, top left) sized w x h, starting at t.
    dur: seconds for the whole clip (default: its natural length times loops)."""
    out = f"{LP}/out/{c.spec['id']}"
    if not getattr(c, "_lottie_ready", False):
        shutil.copy(f"{LP}/node_modules/lottie-web/build/player/lottie_svg.min.js", f"{out}/lottie.min.js")
        c._lottie_ready = True
        c._lottie_n = 0
    c._lottie_n += 1
    fid = fid or f"lf{c._lottie_n}"
    data = json.load(open(os.path.join(LIB, NAMES.get(name, name) + ".json")))
    if recolor:
        _recolor(data, [(_hex_to_rgb(a), _hex_to_rgb(b)) for a, b in recolor.items()])
    ip, op, fr = data.get("ip", 0), data["op"], data.get("fr", 30)
    nat = (op - ip) / fr
    dur = dur or nat * loops
    frames = (op - ip) * loops
    var = f"__L_{fid.replace('-', '_')}"
    c.g(f'const {var} = lottie.loadAnimation({{container: document.getElementById("{fid}"), renderer: "svg", loop: false, autoplay: false, animationData: {json.dumps(data, separators=(",", ":"))}, rendererSettings: {{preserveAspectRatio: "xMidYMid meet"}}}});')
    c.g(f'tl.fromTo({{f:0}},{{f:0}},{{f:{frames - 0.01:.2f},duration:{dur:.2f},ease:"none",immediateRender:false,onUpdate(){{ {var}.goToAndStop({ip} + (this.targets()[0].f % {op - ip}), true); }}}},{t:.2f});')
    c.g(f'tl.fromTo("#{fid}w",{{opacity:0}},{{opacity:{opacity},duration:{fade},immediateRender:false}},{t:.2f}); tl.to("#{fid}w",{{opacity:0,duration:{fade}}},{t + dur - fade:.2f});')
    script = '<script src="lottie.min.js"></script>' if c._lottie_n == 1 else ""
    return (f'<g id="{fid}w" opacity="0"><foreignObject x="{x}" y="{y}" width="{w}" height="{h}">'
            f'<div xmlns="http://www.w3.org/1999/xhtml" id="{fid}" style="width:{w}px;height:{h}px"></div></foreignObject></g>'), script
