"""Rebuild test (2026-10-17) of yt-apbio-01, chapter "Evaporation and sweat", with the new visual level:
Jordan is a rigged character who stays in the story the whole chapter; calm navy for the pure definition (she waits in a
corner inset); the sweat drop grows out of her arm (shrink, callout, grow) instead of a separate diagram; Lottie sparkle
on the payoff. Narration and timing are the posted video's (its audio is reused, so no voice credits)."""
import sys, math, random, json
sys.path[:0] = ["/home/claude/lp", "/home/claude/lp/long"]
import b01t_script as S
import b01_spec as B
import medart, rig, lottiefx
from engine_long import TEAL, GOLD, CORAL, INK, GREEN, WHITE
from n01_spec import W, L, card, chip, hideall, qcheck
from a01_spec import drops, fall, arrow, steps, bob

OUT = f"/home/claude/lp/out/{S.ID}"
B.OUT = OUT
WARM, BLUE = B.WARM, B.BLUE

# gaps so every beat starts exactly where it does in the posted video (audio reused)
TIM = json.load(open(f"{OUT}/timing.json"))
_keys = ["t6", "t7", "t8", "c4q", "c4a"]
for b in S.CHAPTERS[0]["beats"]:
    k = b["key"]; i = _keys.index(k)
    if i + 1 < len(_keys):
        b["gap"] = round(TIM[_keys[i + 1]][0] - TIM[k][0] - TIM[k][1] - b.get("pause", 0), 3)

# Jordan on the road (top left 520,250, height 760 = the posted layout)
# Jordan running: a 4 frame run cycle (one character sheet, frames 420x672, aligned on the torso)
JX, JY, JK = 600, 200, 1.32
JH = 672 * JK
ARM = (JX + 185 * JK, JY + 250 * JK)          # a sweaty spot on her upper arm, in stage units
FACE = (JX + 200 * JK, JY + 200 * JK)          # face and chest, for the corner circle
INS = (1740, 900, 130)
INS_S = 0.565
INS_T = (INS[0] - INS_S * FACE[0], INS[1] - INS_S * FACE[1])
SIDE_S, SIDE_X, SIDE_Y = 0.62, -260, 160        # road shrinks to the left while the drop grows on the right
ARM_S = (ARM[0] * SIDE_S + SIDE_X, ARM[1] * SIDE_S + SIDE_Y)
DC = (1250, 600)                                # drop group center


def tangents(c1, r1, c2, r2):
    (x1, y1), (x2, y2) = c1, c2
    dx, dy = x2 - x1, y2 - y1
    d = math.hypot(dx, dy); a = math.atan2(dy, dx); b = math.acos((r1 - r2) / d)
    return [((x1 + r1 * math.cos(a + s * b), y1 + r1 * math.sin(a + s * b)), (x2 + r2 * math.cos(a + s * b), y2 + r2 * math.sin(a + s * b))) for s in (1, -1)]


def sweat(c):
    T, C, g = c.T, c.C, c.g
    t0, t1 = T["t6"] - 0.4, c.TOTAL
    s = []
    # ---------------- the road scene, one group for the whole story part (masked soft edges, transform + clip for inset/side)
    far_mid, fg = B.hot_road("rdA", op=1)
    s.append('<mask id="mRd" maskUnits="userSpaceOnUse" x="-600" y="-600" width="3200" height="2400"><rect x="-120" y="-60" width="2160" height="1200" fill="#fff" filter="url(#blurM)"/></mask>'
             '<filter id="blurM" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="40"/></filter>'
             f'<clipPath id="rdClip"><circle id="rdC" cx="{INS[0]}" cy="{INS[1]}" r="2600"/></clipPath>')
    s.append(f'<g id="g_road" clip-path="url(#rdClip)"><g id="rdT" mask="url(#mRd)">{far_mid}')
    s.append(rig.cycle_svg(c, [f"jordan-run{i}" for i in range(1, 5)], JX, JY, JH, "jR"))
    for k in range(10):
        x = JX + 150 + (k % 5) * 50; y = JY + 120 + (k // 5) * 140
        s.append(f'<circle id="sw_vp{k}" cx="{x}" cy="{y}" r="9" fill="#e8f8ff" opacity="0"/>')
    s.append(fg + '</g></g>')
    s.append(f'<circle id="insRing" cx="{INS[0]}" cy="{INS[1]}" r="{INS[2]}" fill="none" stroke="{WARM}" stroke-width="7" opacity="0"/>')
    c.g(f'tl.set("#g_road",{{opacity:1}},0); gsap.set("#rdT",{{svgOrigin:"0 0"}}); gsap.set("#dropG",{{svgOrigin:"{DC[0]} {DC[1]}"}});')
    B.road_motion(c, "rdA", t0, T["c4q"]); rig.cycle(c, "jR", 4, t0, T["c4q"], fps=10)

    def to_inset(t, d=1.0):
        """shrink into the corner, then close the circle (no bubble left on screen)"""
        g(f'tl.to("#rdT",{{scale:{INS_S},x:{INS_T[0]:.1f},y:{INS_T[1]:.1f},duration:{d},ease:"power2.inOut"}},{t:.2f});')
        g(f'tl.to("#rdC",{{attr:{{r:{INS[2]}}},duration:{d},ease:"power2.inOut"}},{t:.2f}); tl.to("#insRing",{{opacity:1,duration:0.3}},{t + d - 0.3:.2f});')
        g(f'tl.to("#rdC, #insRing",{{attr:{{r:0}},duration:0.35,ease:"back.in(1.6)"}},{t + d + 0.15:.2f}); tl.set("#insRing",{{opacity:0}},{t + d + 0.5:.2f});')

    def to_full(t, d=0.9):
        """reopen from the same corner spot, then grow back to full size"""
        g(f'tl.set("#insRing",{{opacity:1}},{t - 0.35:.2f}); tl.fromTo("#rdC, #insRing",{{attr:{{r:0}}}},{{attr:{{r:{INS[2]}}},duration:0.35,ease:"back.out(1.6)",immediateRender:false}},{t - 0.35:.2f});')
        g(f'tl.to("#rdT",{{scale:1,x:0,y:0,duration:{d},ease:"power2.inOut"}},{t:.2f});')
        g(f'tl.to("#rdC",{{attr:{{r:2600}},duration:{d},ease:"power2.in"}},{t:.2f}); tl.to("#insRing",{{opacity:0,duration:0.25}},{t:.2f});')

    # ---------------- t6: the definition is pure teaching, so calm navy; Jordan waits in a corner inset
    to_inset(C["t6"][1] - 0.5)
    s.append(card("sw_dc", 120, 200, 980, 230, GOLD, op=0)); c.fade_in("#sw_dc", C["t6"][1] - 0.2, y=20)
    s.append(W(c, "sw_d1", 160, 280, "heat of vaporization:", C["t6"][1], 50, GOLD))
    s.append(W(c, "sw_d2", 160, 350, "energy to turn 1 g of liquid into gas", C["t6"][1] + 1.2, 38, WHITE))
    s.append(W(c, "sw_d3", 160, 410, "water: about 2,260 J/g (at 100 °C)", C["t6"][2], 40, TEAL))
    s.append(B.MI("sw_pot", "pot-water-hot", 1260, 200, 520)); c.fade_in("#sw_pot", C["t6"][1], y=20)
    s.append(f'<rect id="sw_bv" x="300" y="560" width="1100" height="90" rx="16" fill="{GOLD}" opacity="0" data-ol="1"/>')
    s.append(f'<rect id="sw_bh" x="300" y="700" width="200" height="90" rx="16" fill="{CORAL}" opacity="0" data-ol="1"/>')
    c.hide("#sw_pot", C["t6"][3]); g(f'tl.fromTo("#sw_bh",{{opacity:1,scaleX:0}},{{scaleX:1,duration:0.6}},{C["t6"][3]+0.3:.2f});tl.fromTo("#sw_bv",{{opacity:1,scaleX:0}},{{scaleX:1,duration:1.2}},{C["t6"][3]+1.0:.2f});')
    s.append(L(c, "sw_bvl", 1430, 618, "1 g: liquid → gas", C["t6"][3] + 1.6, 34, GOLD, anchor="start"))
    s.append(L(c, "sw_bhl", 530, 758, "1 g: heat from 0 to 100 °C", C["t6"][3] + 0.4, 34, CORAL, anchor="start"))
    s.append(chip("sw_5x", 850, 900, "more than 5 times", GOLD, 46, 0)); c.pop("#sw_5x", C["t6"][3] + 2.4)
    hideall(c, ["#sw_dc", "#sw_d1", "#sw_d2", "#sw_d3", "#sw_pot", "#sw_bv", "#sw_bh", "#sw_bvl", "#sw_bhl", "#sw_5x"], T["t7"] - 0.1)
    # move the definition layer in front of nothing: the road group is clipped to the inset while these show

    # ---------------- t7: back on the road, then the sweat drop grows out of her arm
    to_full(T["t7"] - 0.15)
    tg = T["t7"] + 1.0
    g(f'tl.to("#rdT",{{scale:{SIDE_S},x:{SIDE_X},y:{SIDE_Y},duration:0.8,ease:"power3.inOut"}},{tg:.2f});')
    s.append('<linearGradient id="gDimR" x1="0" y1="0" x2="1" y2="0"><stop offset=".2" stop-color="#081428" stop-opacity="0"/><stop offset=".36" stop-color="#081428" stop-opacity=".9"/><stop offset="1" stop-color="#081428" stop-opacity=".95"/></linearGradient>'
             '<rect id="dimR" x="-100" y="-100" width="2120" height="1280" fill="url(#gDimR)" opacity="0"/>')
    g(f'tl.to("#dimR",{{opacity:1,duration:0.6}},{tg + 0.1:.2f});')
    (p1, q1), (p2, q2) = tangents(ARM_S, 18, DC, 470)
    s.append(f'<linearGradient id="gCall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7fe8ff" stop-opacity=".5"/><stop offset="1" stop-color="#7fe8ff" stop-opacity=".05"/></linearGradient>'
             f'<g id="callout" opacity="0"><path d="M{p1[0]:.1f} {p1[1]:.1f} L{q1[0]:.1f} {q1[1]:.1f} L{q2[0]:.1f} {q2[1]:.1f} L{p2[0]:.1f} {p2[1]:.1f} Z" fill="url(#gCall)"/>'
             + "".join(f'<path d="M{a[0]:.1f} {a[1]:.1f} L{b_[0]:.1f} {b_[1]:.1f}" stroke="#7fe8ff" stroke-width="3" stroke-dasharray="10 9" opacity=".8"/>' for a, b_ in ((p1, q1), (p2, q2)))
             + f'<circle cx="{ARM_S[0]:.1f}" cy="{ARM_S[1]:.1f}" r="18" fill="none" stroke="#7fe8ff" stroke-width="4"/></g>')
    g(f'tl.to("#callout",{{opacity:1,duration:0.5}},{tg + 0.6:.2f});')
    # the drop on the skin: warm skin band under a big dome of liquid water, molecules large enough to read
    d = [f'<g id="dropW" opacity="0"><g id="dropG">']
    d.append('<linearGradient id="gSkinB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4b896"/><stop offset="1" stop-color="#d9846a"/></linearGradient>'
             '<radialGradient id="gWarmS" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="#ff9a4a" stop-opacity=".55"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>')
    d.append('<rect x="640" y="900" width="1220" height="110" rx="18" fill="url(#gSkinB)"/>'
             + "".join(f'<path d="M{x} 905 q 40 30 0 100" stroke="#c9735c" stroke-width="3" fill="none" opacity=".55"/>' for x in range(700, 1860, 110))
             + '<ellipse id="skinWarm" cx="1250" cy="1000" rx="620" ry="120" fill="url(#gWarmS)"/>')
    d.append('<path d="M 700 905 Q 700 330 1250 300 Q 1800 330 1800 905 Z" fill="url(#gWater)" stroke="#bfefff" stroke-width="5"/>')
    d.append('<path d="M 760 600 Q 790 400 1000 345" stroke="#ffffff" stroke-width="10" fill="none" opacity=".35" stroke-linecap="round"/>')
    R = random.Random(12); dm = []
    for r_, yy in enumerate((520, 660, 800)):
        for i in range(7):
            x = 820 + i * 143 + (r_ % 2) * 40 + R.uniform(-10, 10)
            if (r_ == 0 and (i == 0 or i == 6)): continue
            dm.append(f"sw_m{len(dm)}"); d.append(B.mol(dm[-1], x, yy + R.uniform(-10, 10), 1.15, R.uniform(0, 360), 1))
    d.append(f'<circle id="sw_fg" cx="1250" cy="410" r="80" fill="url(#gFast)" opacity="0"/>' + B.mol("sw_esc", 1250, 410, 1.2, 20, 1))
    for k, (x2, y2) in enumerate(((1105, 520), (1250, 520), (1395, 520))):
        d.append(B.hb(f"sw_eb{k}", 1250, 432, x2, y2 - 28, 0, GOLD, 6))
    for k in range(3):
        d.append(arrow(f"sw_ha{k}", 1000 + k * 250, 1000, 1000 + k * 250, 860, WARM, 10))
    d.append('</g></g>')
    s.append("".join(d))
    g(f'tl.set("#dropW",{{opacity:1}},{tg + 0.45:.2f});')
    g(f'tl.fromTo("#dropG",{{scale:0.04,x:{ARM_S[0] - DC[0]:.1f},y:{ARM_S[1] - DC[1]:.1f}}},{{scale:1,x:0,y:0,duration:0.95,ease:"power3.out",immediateRender:false}},{tg + 0.45:.2f});')
    B.jiggle(c, dm, tg + 1.0, T["t8"], 9, 0.6, 7)
    # {1} every hydrogen bond holding it breaks
    g(f'tl.to("[id^=sw_eb]",{{opacity:1,duration:0.3}},{C["t7"][1] - 0.2:.2f});')
    g(f'tl.to("[id^=sw_eb]",{{opacity:0,duration:0.15,stagger:0.25}},{C["t7"][1] + 0.9:.2f});')
    s.append(L(c, "sw_every", 1250, 245, "must break EVERY hydrogen bond", C["t7"][1], 40, GOLD))
    # {2} only the fastest make it: gold glow, then it flies off into the air
    c.to("#sw_fg", C["t7"][2], "opacity:1", 0.3)
    g(f'tl.to("#sw_esc,#sw_fg",{{x:420,y:-300,duration:1.0,ease:"power2.in"}},{C["t7"][2] + 0.4:.2f});')
    s.append(L(c, "sw_fast", 1250, 1058, "only the fastest molecules make it out", C["t7"][2] + 0.2, 34, WHITE))
    s.append(chip("sw_en", 1600, 200, "carries energy away", GOLD, 34, 0)); c.pop("#sw_en", C["t7"][3])
    c.hide("#sw_every", C["t7"][3])
    # {4} the rest slow down and cool (blue)
    g(f'tl.to("{",".join("#" + x + "_O" for x in dm)}",{{fill:"#6aa8e8",duration:0.8}},{C["t7"][4]:.2f});')
    c.hide("#sw_fast", C["t7"][4] - 0.1)
    s.append(L(c, "sw_slow", 1250, 1058, "left behind: slower, so cooler", C["t7"][4] + 0.2, 34, BLUE))
    # {5} cooler sweat soaks up heat from the warm skin underneath
    g(f'tl.to("[id^=sw_ha]",{{strokeDashoffset:0,opacity:1,duration:0.6,stagger:0.2}},{C["t7"][5] + 0.4:.2f});')
    g(f'tl.to("#skinWarm",{{opacity:0.25,duration:1.2}},{C["t7"][5] + 0.8:.2f});')
    s.append(L(c, "sw_soak", 1250, 1058, "cooler sweat soaks up heat from the skin", C["t7"][5] + 0.8, 34, WARM))
    c.hide("#sw_slow", C["t7"][5] + 0.7)

    # ---------------- t8: the drop shrinks back into her arm and the road comes back to full size
    tb = T["t8"] - 0.35
    hideall(c, ["#sw_soak", "#sw_en", "#callout"], tb)
    g(f'tl.to("#dropG",{{scale:0.04,x:{ARM_S[0] - DC[0]:.1f},y:{ARM_S[1] - DC[1]:.1f},duration:0.7,ease:"power3.in"}},{tb:.2f}); tl.set("#dropW",{{opacity:0}},{tb + 0.7:.2f});')
    g(f'tl.to("#dimR",{{opacity:0,duration:0.5}},{tb + 0.4:.2f});')
    g(f'tl.to("#rdT",{{scale:1,x:0,y:0,duration:0.8,ease:"power2.inOut"}},{tb + 0.5:.2f});')
    s.append(card("sw_tc", 1200, 220, 640, 260, WARM, op=0)); c.fade_in("#sw_tc", T["t8"] + 1.0, y=20)
    s.append(L(c, "sw_air", 1520, 300, "air: 33 °C", T["t8"] + 1.2, 44, WARM))
    s.append(L(c, "sw_sk2", 1520, 370, "almost as warm as her skin", T["t8"] + 2.4, 34, WHITE))
    s.append(L(c, "sw_left", 1520, 440, "→ evaporation is what's left", T["t8"] + 5.0, 34, GOLD))
    for k in range(10):
        g(f'tl.fromTo("#sw_vp{k}",{{opacity:.9,y:0}},{{opacity:0,y:-160,duration:1.6,repeat:{int((T["c4q"] - C["t8"][1]) / 1.7)},ease:"sine.out",immediateRender:false}},{C["t8"][1] + k * 0.17:.2f});')
    s.append(chip("sw_2k", 1520, 600, "> 2,000 J per gram of sweat", GOLD, 40, 0)); c.pop("#sw_2k", C["t8"][1] + 0.6)
    s.append(chip("sw_ec", 1520, 720, "evaporative cooling", TEAL, 46, 0)); c.pop("#sw_ec", C["t8"][2])
    s.append(lottiefx.place(c, "sparkle-stars", 1300, 560, 440, 300, C["t8"][2] + 0.05, dur=1.9))
    s.append(card("sw_lc", 1300, 790, 440, 260, TEAL, op=0)); c.fade_in("#sw_lc", C["t8"][3] - 0.1, y=20)
    s.append(f'<g id="sw_leaf" opacity="0"><ellipse cx="1520" cy="900" rx="170" ry="70" fill="url(#gLeaf)" transform="rotate(-12 1520 900)"/><path d="M 1360 930 L 1690 870" stroke="#2c6b30" stroke-width="5"/></g>')
    c.fade_in("#sw_leaf", C["t8"][3], y=20)
    for k in range(4):
        s.append(f'<circle id="sw_lv{k}" cx="{1440 + k * 55}" cy="860" r="8" fill="#e8f8ff" opacity="0"/>')
        g(f'tl.fromTo("#sw_lv{k}",{{opacity:.9,y:0}},{{opacity:0,y:-110,duration:1.4,repeat:2,ease:"sine.out",immediateRender:false}},{C["t8"][3] + 0.3 + k * 0.2:.2f});')
    s.append(L(c, "sw_ll", 1520, 1010, "a leaf cools the same way", C["t8"][3] + 0.3, 32, WHITE))
    c.hide("#g_road, #sw_tc, #sw_air, #sw_sk2, #sw_left, #sw_2k, #sw_ec, #sw_lc, #sw_leaf, #sw_ll", T["c4q"] - 0.45, 0.4)

    # ---------------- quick check: calm navy card, Jordan bent over on a humid day (rigged, panting)
    s.append('<g id="g_sw3" opacity="0">')
    c.scene("#g_sw3", T["c4q"] - 0.3, t1 + 1)
    s.append(qcheck(c, "qc4", "c4q", ["Humid day: sweat drips off instead of drying.", "Why do you feel hotter?"]))
    s.append('<g id="qc4_fog" opacity="0" filter="url(#blur14)">' + "".join(f'<ellipse cx="{200 + k * 260}" cy="{900 + (k % 2) * 40}" rx="200" ry="70" fill="#cdd8e6" opacity=".25"/>' for k in range(7)) + '</g>')
    c.fade_in("#qc4_fog", C["c4q"][1], y=0)
    s.append(rig.char(c, "jordan-bent", 1500, 1070 - 1153 * 0.42, 1153 * 0.42, "jB"))
    rig.idle(c, "jB", T["c4q"] - 0.3, t1, seed=23, fast=True)
    rig.react(c, "jB", "wince", C["c4q"][1] + 2.2, 0.8)
    s.append(drops("qc4_d", 1610, 640, 6, "#cfefff", 0, 9)); c.set("#qc4_d", C["c4q"][1] + 0.4, "opacity:1"); fall(c, "#qc4_d path", C["c4q"][1] + 0.5, 1.2, 220, 4)
    s.append(W(c, "qc4_a1", 320, 600, "cooling needs EVAPORATION", T["c4a"] + 0.2, 52, GREEN))
    s.append(W(c, "qc4_a2", 320, 690, "humid air is already full of vapor", C["c4a"][1], 40, WHITE))
    s.append(W(c, "qc4_a3", 320, 770, "→ sweat evaporates slowly and drips off", C["c4a"][1] + 2.0, 40, WHITE))
    s.append('</g>')
    return "".join(s)


def build_spec():
    def compose(c):
        c.g('gsap.set("[data-ob]",{transformOrigin:"50% 100%"});gsap.set("[data-ol]",{transformOrigin:"0% 50%"});')
        return B.GRAD + sweat(c)
    return dict(id=S.ID, course_tag="AP BIO · UNIT 1 · 1.1", chapters=S.CHAPTERS, compose=compose, tail=0.23,
                css="#hdr .ch div{background:rgba(5,12,26,.75);padding:0 14px;border-radius:10px} #pause{top:36px}")


SPEC = build_spec()
