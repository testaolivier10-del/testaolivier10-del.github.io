"""t1018 Radial pulse, not your thumb (style B test Short, 2026-10-18).
Story: AI acting shot (Wan 2.2 on Modal) of a paramedic checking a collapsed man's wrist in a night kitchen ->
a lens grows out of his wrist -> the kitchen shrinks into a corner circle where she keeps moving -> close up in the same
style B look: her thumb has its own pulse (out of step with his) -> two fingertips on the thumb side over the radial artery,
light pressure (too hard flattens it) -> 30 s x 2 when steady, full 60 s when irregular -> the circle grows back into the
kitchen (second AI shot continues the moment) -> decision question.
Motion list for the accuracy check: see beats_pulse.MOTIONS."""
import json, os, shutil
import beats_pulse as B
import lpx, pulse_art2 as P2
from lpx import wt, chip

ID = "t1018-pulse-full"
import fullbleed
OUT = f"/home/claude/lp/out/{ID}"
WRIST = (480, 790)          # his wrist inside the AI shot, stage pixels
INSET = (905, 150, 118)     # corner circle: centre x, y, radius

HIS_PERIOD = 0.8            # 75 a minute
HER_PERIOD = 0.66           # about 90 a minute


def his_beats(t0, t1, irregular_from=None):
    out, t, n = [], t0, 0
    while t < t1:
        skip = irregular_from is not None and t >= irregular_from and n % 4 == 2
        if not skip: out.append(t)
        t += HIS_PERIOD if not (irregular_from is not None and t >= irregular_from and n % 3 == 1) else HIS_PERIOD * 1.35
        n += 1
    return out


def compose(c):
    k = lambda key, w, n=1: wt(c, key, w, n)
    shutil.copy("/tmp/m/characters/style_b/shotA_first.png", f"{OUT}/bgA.png")
    meta = json.load(open(f"{OUT}/clips.json"))      # frame folders made by clips.py

    # ---------- titles ----------
    c.title('<span class="y">NOT</span> YOUR<br>THUMB', 0, out=k("why", "your"), cls="hook")
    c.title('<span class="t">TWO</span> FINGERTIPS', k("fix", "two") - 0.1, out=k("count", "if"))
    c.title('30 s <span class="y">x 2</span>', k("count", "thirty") - 0.15, out=k("count", "if", 2) - 0.05, size=110)
    c.title('IRREGULAR?<br><span class="r">FULL MINUTE</span>', k("count", "irregular") - 0.1, out=k("ask", "his") - 0.45, size=96)
    c.title('48 AND <span class="r">SKIPPING</span><br>HOW LONG?', k("ask", "his") - 0.05, out=None, size=92)

    # ---------- AI shots ----------
    t_switch = k("hook", "you")
    t_back = k("ask", "his") - 0.25
    c.set("#clipA", 0, "opacity:1")
    c.set("#clipB", 0, "opacity:0")
    c.set("#clipA", t_back + 0.02, "opacity:0")
    c.set("#clipB", t_back, "opacity:1")
    # lens grows out of his wrist while the kitchen is still full frame
    t_lens = k("hook", "thumb") - 0.05
    c.g(f'tl.fromTo("#cuWrap",{{clipPath:"circle(0px at {WRIST[0]}px {WRIST[1] + 440}px)"}},{{clipPath:"circle(150px at {WRIST[0]}px {WRIST[1] + 440}px)",duration:0.45,ease:"back.out(1.6)"}},{t_lens:.2f});')
    c.g(f'tl.fromTo("#cuRing",{{attr:{{r:0}},opacity:1}},{{attr:{{r:150}},duration:0.45,ease:"back.out(1.6)"}},{t_lens:.2f});')
    c.sound("whoosh_real", t_lens - 0.05, 0.6)
    # the kitchen shrinks into the corner circle while the lens opens to full frame (one continuous move)
    cx, cy, r = INSET
    c.set("#sceneW", t_switch + 0.42, "zIndex:5"); c.set("#cuWrap", t_switch + 0.42, "zIndex:2")
    c.g(f'tl.to("#sceneW",{{scale:0.27,x:{cx - 0.27 * 469:.0f},y:{cy - 0.27 * 640:.0f},duration:0.7,ease:"power3.inOut"}},{t_switch:.2f});')
    c.g(f'tl.to("#sceneW",{{clipPath:"circle(440px at 469px 640px)",duration:0.7,ease:"power3.inOut"}},{t_switch:.2f});')
    c.g(f'tl.to("#cuWrap",{{clipPath:"circle(1700px at 540px 920px)",duration:0.7,ease:"power3.inOut"}},{t_switch:.2f});')
    c.g(f'tl.to("#cuRing",{{opacity:0,duration:0.3}},{t_switch + 0.2:.2f});')
    c.g(f'tl.fromTo("#insetRing",{{opacity:0,scale:0.6,transformOrigin:"{cx}px {cy}px"}},{{opacity:1,scale:1,duration:0.4,ease:"back.out(2)"}},{t_switch + 0.45:.2f});')
    c.sound("swish", t_switch, 0.8)
    # back: the circle grows into the full kitchen again, same person, same place
    c.g(f'tl.to("#sceneW",{{scale:1,x:0,y:0,duration:0.75,ease:"power3.inOut"}},{t_back:.2f});')
    c.g(f'tl.to("#sceneW",{{clipPath:"circle(1500px at 469px 640px)",duration:0.75,ease:"expo.in"}},{t_back:.2f});')
    c.g(f'tl.to("#insetRing",{{opacity:0,duration:0.25}},{t_back:.2f});')
    c.g(f'tl.to("#cuWrap",{{opacity:0,duration:0.45}},{t_back + 0.2:.2f});')
    c.sound("whoosh_real", t_back - 0.05, 0.6)

    # ---------- close up (AI stills in the same style + code pieces drawn in that style) ----------
    P2.copy_assets(OUT)
    for a, b in (("cu_fb.png", "cu_base.png"), ("L_thumb_fb.png", "cu_thumb.png"), ("L_fing_fb.png", "cu_fing.png")):
        shutil.copy(f"/tmp/m/characters/style_b/{a}", f"{OUT}/{b}")
    RS = (452, 492)                      # radial pulse spot on the thumb side of his wrist (close up coords)
    # during the lens the close up is shifted so the pulse spot sits exactly in the lens over his wrist
    c.set("#cuCam", 0, f"x:{WRIST[0] - RS[0]},y:{WRIST[1] - RS[1]}")
    c.g(f'tl.to("#cuCam",{{x:0,y:0,duration:0.7,ease:"power3.inOut"}},{t_switch:.2f});')
    c.g(f'tl.fromTo("#cuZoom",{{scale:1.0,transformOrigin:"{RS[0]}px {RS[1]}px"}},{{scale:1.07,duration:{t_back - t_switch:.2f},ease:"sine.inOut"}},{t_switch:.2f});')
    c.g(f'tl.fromTo("#artFlow",{{strokeDashoffset:0}},{{strokeDashoffset:-1100,duration:{t_back - t_lens:.2f},ease:"none"}},{t_lens:.2f});')
    t_irr = k("count", "irregular")
    beats = his_beats(t_lens + 0.1, t_back, irregular_from=t_irr)
    squash0, squash1 = k("fix", "squash") - 0.15, k("fix", "flat") + 0.55
    for b in beats:
        if squash0 <= b <= squash1: continue
        c.g(f'tl.fromTo("#artBody",{{attr:{{"stroke-width":17}}}},{{attr:{{"stroke-width":25}},duration:0.11,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false}},{b:.2f});')
        c.g(f'tl.fromTo("#artSurge",{{opacity:0}},{{opacity:0.6,duration:0.11,yoyo:true,repeat:1,immediateRender:false}},{b:.2f});')
        c.sound("heartbeat", b, 0.28)

    # her thumb presses on his wrist; her own thumb pulse glows on her rhythm
    t_thumb_in = t_switch + 0.35
    t_thumb_out = k("fix", "so") - 0.05
    c.g(f'tl.fromTo("#eThumb",{{opacity:0,x:150,y:-190}},{{opacity:1,x:0,y:0,duration:0.6,ease:"power3.out"}},{t_thumb_in:.2f});')
    c.sound("cloth", t_thumb_in + 0.35, 0.6)
    t = k("hook", "heartbeat")
    while t < t_thumb_out:
        c.g(f'tl.fromTo("#herBeat",{{opacity:0,scale:0.7,svgOrigin:"{P2.THUMB_PAD[0]} {P2.THUMB_PAD[1]}"}},{{opacity:1,scale:1.25,duration:0.16,yoyo:true,repeat:1,immediateRender:false}},{t:.2f});')
        c.g(f'tl.fromTo("#herRing",{{opacity:0.9,scale:0.6,svgOrigin:"{P2.THUMB_PAD[0]} {P2.THUMB_PAD[1]}"}},{{opacity:0,scale:1.5,duration:0.4,ease:"power1.out",immediateRender:false}},{t:.2f});')
        t += HER_PERIOD
    c.pop("#herChipG", k("why", "own") - 0.05)
    c.pop("#hisChipG", k("why", "instead") - 0.05)
    c.to("#eThumbIn", k("why", "press"), "y:7", 0.25, "power2.out")
    c.to("#eThumbIn", k("why", "press") + 0.55, "y:0", 0.35)
    c.g(f'tl.to("#eThumb",{{opacity:0,x:170,y:-200,duration:0.45,ease:"power2.in"}},{t_thumb_out:.2f});')
    c.fade_out("#hisChipG", t_thumb_out, 0.25); c.fade_out("#herChipG", t_thumb_out, 0.25)

    # two fingertips land on the thumb side of the wrist
    t_f = max(k("fix", "tips"), t_thumb_out + 0.5)
    c.g(f'tl.fromTo("#eFing",{{opacity:0,x:160,y:-200}},{{opacity:1,x:0,y:0,duration:0.65,ease:"power3.out"}},{t_f:.2f});')
    c.sound("cloth", t_f + 0.45, 0.7)
    for w, i in (("index", 0), ("middle", 1)):
        c.g(f'tl.fromTo("#tipDot{i}",{{opacity:0,scale:0.5,svgOrigin:"{P2.TIPS[i][0]} {P2.TIPS[i][1]}"}},{{opacity:1,scale:1,duration:0.2,yoyo:true,repeat:1,repeatDelay:0.25,immediateRender:false}},{k("fix", w):.2f});')
    c.g(f'tl.fromTo("#art2",{{filter:"brightness(1)"}},{{filter:"brightness(1.35)",duration:0.3,yoyo:true,repeat:1,immediateRender:false}},{k("fix", "radial") - 0.05:.2f});')
    c.pop("#radChipG", k("fix", "radial") - 0.05)
    c.fade_out("#radChipG", k("fix", "keep") + 0.2, 0.3)
    for b in beats:
        if k("fix", "keep") <= b < squash0 or squash1 < b < t_back:
            for i in (0, 1):
                c.g(f'tl.fromTo("#tipRip{i}",{{opacity:0.9,scale:0.6,svgOrigin:"{P2.TIPS[i][0]} {P2.TIPS[i][1]}"}},{{opacity:0,scale:1.6,duration:0.45,ease:"power1.out",immediateRender:false}},{b:.2f});')
    # too hard: fingers push in, the tube under them pinches shut and the flow stops, then it rounds out again
    c.to("#eFingIn", squash0, "y:9", 0.25, "power2.out")
    c.g(f'tl.to(["#sqCover","#sqThin"],{{opacity:1,duration:0.22,ease:"power2.out"}},{squash0 + 0.05:.2f});')
    c.to("#artFlow", squash0, "opacity:0", 0.25)
    c.pop("#hardChipG", k("fix", "squash"))
    c.sound("pat", squash0, 0.6)
    c.to("#eFingIn", squash1 - 0.2, "y:0", 0.35)
    c.g(f'tl.to(["#sqCover","#sqThin"],{{opacity:0,duration:0.3}},{squash1 - 0.2:.2f});')
    c.to("#artFlow", squash1 - 0.2, "opacity:0.75", 0.35)
    c.fade_out("#hardChipG", squash1, 0.25)

    # counting: her watch face on the floor side of the frame, 30 s with a beat counter, then the full irregular minute
    WX, WY, WR = P2.WATCH
    t_w = k("count", "steady") - 0.1
    c.g(f'tl.fromTo("#watch",{{opacity:0,scale:0.6,svgOrigin:"{WX} {WY}"}},{{opacity:1,scale:1,duration:0.45,ease:"back.out(1.8)"}},{t_w:.2f});')
    c.sound("riser", t_w - 0.3, 0.5)
    circ = 2 * 3.14159265 * WR * 0.78
    s30a, s30b = k("count", "thirty"), k("count", "double") - 0.05
    c.g(f'tl.fromTo("#wRing",{{strokeDashoffset:{circ:.2f}}},{{strokeDashoffset:{circ / 2:.2f},duration:{s30b - s30a:.2f},ease:"none"}},{s30a:.2f});')
    c.g(f'tl.fromTo("#wHandG",{{rotation:0,svgOrigin:"0 0"}},{{rotation:180,duration:{s30b - s30a:.2f},ease:"none"}},{s30a:.2f});')
    n = 38; steps = 12
    for i in range(1, steps + 1):
        ti = s30a + (s30b - s30a) * i / steps
        c.g(f'tl.call(()=>{{document.getElementById("wNum").textContent="{round(n * i / steps)}"}},null,{ti:.2f});')
        c.sound("tick", ti, 0.35)
    c.g(f'tl.call(()=>{{document.getElementById("wNum").textContent="x2 = 76"}},null,{k("count", "double"):.2f});')
    c.sound("ding", k("count", "double"), 0.5)
    t_m0, t_m1 = k("count", "count", 2), k("count", "beats") + 0.3
    c.g(f'tl.call(()=>{{document.getElementById("wNum").textContent="0";document.getElementById("wSec").textContent="60 s"}},null,{k("count", "irregular"):.2f});')
    c.g(f'tl.set("#wRing",{{strokeDashoffset:{circ:.2f},stroke:"#ff8a8a"}},{k("count", "irregular"):.2f});')
    c.g(f'tl.set("#wHandG",{{rotation:0,svgOrigin:"0 0"}},{k("count", "irregular"):.2f});')
    c.g(f'tl.to("#wRing",{{strokeDashoffset:0,duration:{t_m1 - t_m0:.2f},ease:"none"}},{t_m0:.2f});')
    c.g(f'tl.to("#wHandG",{{rotation:360,svgOrigin:"0 0",duration:{t_m1 - t_m0:.2f},ease:"none"}},{t_m0:.2f});')
    for i in range(1, 13):
        ti = t_m0 + (t_m1 - t_m0) * i / 12
        c.g(f'tl.call(()=>{{document.getElementById("wNum").textContent="{round(48 * i / 12)}"}},null,{ti:.2f});')
        c.sound("tick", ti, 0.3)
    c.pop("#skipMarkG", k("count", "skipped") - 0.05)
    c.sound("wrong", k("count", "skipped"), 0.5)
    c.g(f'tl.fromTo("#skipMarkG",{{opacity:1}},{{opacity:0.25,duration:0.3,yoyo:true,repeat:3,immediateRender:false}},{k("count", "skipped") + 0.4:.2f});')
    c.fade_out("#skipMarkG", k("ask", "his") - 0.3, 0.25)
    c.g(f'tl.fromTo("#wShake",{{x:0}},{{x:-8,duration:0.06,yoyo:true,repeat:5,immediateRender:false}},{k("count", "doubles"):.2f});')
    c.fade_out("#watch", t_back, 0.3)

    # answer choices on the last line
    t_q = k("ask", "how")
    c.pop("#ansA", t_q); c.pop("#ansB", t_q + 0.15)
    c.sound("pop", t_q, 0.6); c.sound("pop", t_q + 0.15, 0.6)

    # gentle camera life inside the close up
    c.g(f'tl.fromTo("#cuCam",{{scale:1,transformOrigin:"560px 520px"}},{{scale:1.06,duration:{t_back - t_switch:.2f},ease:"sine.inOut"}},{t_switch:.2f});')
    c.music_auto = [(0, 2.2, 0.35), (t_back, t_back + 6, 0.5)]

    clipA = meta["A"]; clipB = meta["B"]
    def clip_img(cid, d):
        return (f'<img id="{cid}" class="mclip" data-dir="{d["dir"]}" data-start="{d["start"]:.3f}" data-n="{d["n"]}" data-fps="30" data-hold="manual" '
                f'style="position:absolute;left:0;top:-440px;width:1080px;height:1920px;opacity:0" src="{d["dir"]}/0000.png">')

    chips = (f'<g id="hisChipG" opacity="0" transform="translate(640 640)">{chip("hisC", 0, 0, "his pulse", "#ff8a8a", 40, op=1)}</g>'
             f'<g id="herChipG" opacity="0" transform="translate(250 395)">{chip("herC", 0, 0, "YOUR pulse", "#2ee6d6", 34, op=1)}</g>'
             f'<g id="radChipG" opacity="0" transform="translate(640 640)">{chip("radC", 0, 0, "radial artery", "#ff8a8a", 34, op=1)}</g>'
             f'<g id="hardChipG" opacity="0" transform="translate(470 640)">{chip("hardC", 0, 0, "no flow", "#ff6b6b", 36, op=1)}</g>'
             f'<g id="skipMarkG" opacity="0" transform="translate(620 400)"><circle r="30" fill="#ff6b6b"/><rect x="-5" y="-18" width="10" height="23" rx="5" fill="#fff"/><circle cy="14" r="5" fill="#fff"/></g>'
             '')
    answers = (f'<g id="ansA" opacity="0" transform="translate(300 130)">{chip("aA", 0, 0, "30 s x 2", "#ffd23f", 44, op=1)}</g>'
               f'<g id="ansB" opacity="0" transform="translate(780 130)">{chip("aB", 0, 0, "full 60 s", "#2ee6d6", 44, op=1)}</g>')
    sq = ''
    tips = "".join(f'<circle id="tipDot{i}" cx="{x}" cy="{y}" r="22" fill="none" stroke="#ffd23f" stroke-width="5" opacity="0"/>'
                   f'<ellipse id="tipRip{i}" cx="{x}" cy="{y + 4}" rx="30" ry="11" fill="none" stroke="#ffd9c4" stroke-width="4" opacity="0"/>'
                   for i, (x, y) in enumerate(P2.TIPS))
    svg = lambda inner, z="": f'<svg viewBox="0 0 1080 960" width="1080" height="960" style="position:absolute;left:0;top:0;overflow:visible{z}">{inner}</svg>'
    cu_html = (f'<div id="cuCam" style="position:absolute;inset:0"><div id="cuZoom" style="position:absolute;inset:0">'
               f'<img src="cu_base.png" style="position:absolute;left:-4px;top:-440px;width:1088px;height:1920px">'
               + svg(f'<defs>{lpx.DEFS}{P2.defs()}</defs>{P2.artery()}{sq}')
               + P2.hands().replace('left:-4px;top:0;width:1088px;height:960px','left:-4px;top:-440px;width:1088px;height:1920px').replace('width:1088px;height:960px"></div>','width:1088px;height:1920px"></div>')
               + svg(f'<defs>{P2.defs()}</defs><circle id="herBeat" cx="{P2.THUMB_PAD[0]}" cy="{P2.THUMB_PAD[1]}" r="50" fill="url(#g2Glow)" opacity="0"/><circle id="herRing" cx="{P2.THUMB_PAD[0]}" cy="{P2.THUMB_PAD[1]}" r="30" fill="none" stroke="#2ee6d6" stroke-width="5" opacity="0"/>{tips}')
               + '</div></div>'
               + svg(f'<defs>{lpx.DEFS}{P2.defs()}</defs>{P2.watch()}{chips}'))
    ring = f'''<svg viewBox="0 0 1080 960" width="1080" height="960" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none;z-index:6">
  <circle id="cuRing" cx="{WRIST[0]}" cy="{WRIST[1]}" r="0" fill="none" stroke="#ffc583" stroke-width="6" opacity="0"/>
  {answers}
  <g id="insetRing" opacity="0"><circle cx="{cx}" cy="{cy}" r="{r + 4}" fill="none" stroke="#ffc583" stroke-width="6"/></g>
</svg>'''
    return fullbleed.wrap(f'''
<div id="cuWrap" style="position:absolute;left:0;top:-440px;width:1080px;height:1920px;z-index:4;overflow:hidden;background:#0b0f22;clip-path:circle(0px at {WRIST[0]}px {WRIST[1] + 440}px)"><div style="position:absolute;left:0;top:440px;width:1080px;height:960px">{cu_html}</div></div>
<div id="sceneW" style="position:absolute;inset:0;z-index:3;transform-origin:0 0;clip-path:circle(1500px at 469px 640px)">{clip_img("clipA", clipA)}{clip_img("clipB", clipB)}</div>
{ring}''')


SPEC = dict(id=ID, badge="NREMT", beats=[dict(b) for b in B.PULSE], compose=compose,
            end_line="Which one did you pick? Free practice on", vars="--glow:#1b2a6b;--acc1:#ff8a3d;--acc2:#2a3d9e;", bpm=84, seed=5, css=fullbleed.CSS)
lpx.apply_gaps(SPEC)
