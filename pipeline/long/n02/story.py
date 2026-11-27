"""Story beats of yt-nremt-02 (Walt's hardware store on a Saturday morning, then the ambulance). SCENES: hook, l6, j4, m3, end.
The people model is a front view figure, so every shot is staged where facing the camera is natural (the camera stands where a
customer stands). Shot list (cue: shot):
hook  1 Walt behind his counter, forearm on it, the other hand flat on his chest, short breaths, a slow push | 2 the whole store,
        four blank shoulder patches step up on "each of them" | 3 Priya inside the door, her hand on her bag strap; "EMT" patch on
        the word | 3b her hand lifts the aspirin bottle out of the open bag | 4 Priya holds the bottle, "give it, or ask first?"
l6    1 Ruiz inside the door with the AED case in his hand, then Walt on a chair, Ruiz's hand on his shoulder, the AED on the counter
      2 the ambulance pulls up outside the window; Priya beside Walt, hand to her chest on her name, he looks up; Marcus holds an
        IV bag up and primes the line | 3 the store with a small map inset: Joan's ambulance on the road | 4 four patches step up
j4    1 Priya asks, open palm; chips "allergies?" "bleeding?"; Walt shakes his head; her thinking face | 2 to 4 her face beside
        the map: 8 min, 25 min, the long route lights and the ambulance icon runs along it
m3    1 Priya beside the protocol card, then her open palm tips four tablets into Walt's cupped palm | 2 Walt chews, the card is
        stamped | 3 Walt's own small bottle in his open palm, "call first" | 4 Priya presses her shoulder microphone, the physician inset
end   1 the ambulance: Walt on the stretcher, the IV running, Joan with the strip, the monitor's tracing; close on Joan reading
      2 the four faces step up under a faint physician; Walt well behind his counter | 3 "levlprep.com" in the top third | 4 "Next"
"""
import sys, math, copy
sys.path[:0] = ['/home/claude/lv', '/home/claude/short', '/home/claude/guy']
import skia
import kit as K
from kit import C, P, SP, sm, W, H, text, blur, AMBER, CREAM, NAVY
from base import cue, cues, ww, ua, hw, talking, fin
import places as PL
from places import finish, shot, poly, rr, glow
import cast as CA
import nperson as PN
import bhands as BH

MINT = (63, 194, 169)
REC = None                                                   # gate checks: a list that collects every pose drawn


def lerp(a, b, u): return a + (b - a) * u


def kf(t, keys):
    """a value that eases between keys [(time, value), ...]"""
    if t <= keys[0][0]: return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t < t1: return lerp(v0, v1, sm((t - t0) / (t1 - t0)))
    return keys[-1][1]


def who(c, name, ps, x, g, s=1.0, tag=''):
    s = s * CA.LOOKS[name]['hs']
    if REC is not None: REC.append((tag, name, ps, x, g, s))
    CA.draw(c, name, ps, x, g, s)


def SS(name, s=1.0): return s * CA.LOOKS[name]['hs']


def speak(ps, t, k, t0=None, t1=None, amt=1.0):
    ps.talk = talking(t, k, t0, t1) * amt
    return ps


def opq(c, x0, y0, x1, y1, a=1.0, col=(16, 20, 48), edge=(90, 104, 170)):
    """an opaque panel for on screen information"""
    if a <= 0.01: return
    c.drawRRect(rr(x0 + 6, y0 + 10, x1 + 6, y1 + 10, 26), P((6, 8, 24), 110 * a, MaskFilter=blur(14)))
    c.drawRRect(rr(x0, y0, x1, y1, 26), P(col, 255 * a)); c.drawRRect(rr(x0, y0, x1, y1, 26), SP(edge, 3, 255 * a))


def qchip(c, s, cx, cy, a=1.0, size=46, col=MINT, kind='bold'):
    """a small opaque chip with a few spoken words"""
    if a <= 0.01: return
    w = K.width(s, size, kind) + 56; h = size * 1.7; y = cy + 12 * (1 - a)
    c.drawRRect(rr(cx - w / 2 + 4, y - h / 2 + 8, cx + w / 2 + 4, y + h / 2 + 8, h / 2), P((6, 8, 24), 110 * a, MaskFilter=blur(10)))
    c.drawRRect(rr(cx - w / 2, y - h / 2, cx + w / 2, y + h / 2, h / 2), P((16, 20, 48), 255 * a)); c.drawRRect(rr(cx - w / 2, y - h / 2, cx + w / 2, y + h / 2, h / 2), SP(col, 4, 255 * a))
    text(c, s, cx, y + size * 0.35, size, CREAM, a, kind, 'center')


def patch(c, cx, cy, k=1.0, label=None, lit=1.0, a=1.0):
    """a uniform shoulder patch: a shield with the six bar star of life; label = the level (only when it is spoken)"""
    if a <= 0.01: return
    c.save(); c.translate(cx, cy + 16 * (1 - a)); c.scale(k, k)
    sh = skia.Path(); sh.moveTo(-70, -84); sh.lineTo(70, -84); sh.lineTo(70, 20); sh.quadTo(64, 70, 0, 96); sh.quadTo(-64, 70, -70, 20); sh.close()
    pe = skia.Paint(AntiAlias=True, PathEffect=skia.CornerPathEffect.Make(14)); d = skia.Path(); pe.getFillPath(sh, d); sh = d
    q = skia.Path(sh); q.offset(4, 8); c.drawPath(q, P((6, 8, 24), 120 * a, MaskFilter=blur(8)))
    body = K_mix((60, 70, 110), (28, 44, 96), lit); c.drawPath(sh, P(body, 255 * a)); c.drawPath(sh, SP(K_mix((120, 130, 160), AMBER, lit), 6, 255 * a))
    cy0 = 2
    for j in range(3):
        c.save(); c.translate(0, cy0); c.rotate(60 * j); c.drawRRect(rr(-11, -40, 11, 40, 4), P(K_mix((150, 160, 190), (120, 190, 250), lit), 255 * a)); c.restore()
    if label: text(c, label, 0, 152, 44 / k, CREAM, a, 'xb', 'center')
    c.restore()


def K_mix(a, b, u): return tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


_SOFT = {}


def soft_bg(c, t, warm=True):
    """an out of focus piece of the store for close inserts: wall colour, the beam (cached once), slow bokeh"""
    if 'bg' not in _SOFT:
        sf = skia.Surface(W, H); cc = sf.getCanvas()
        PL.lgrad(cc, (0, 0, W, H), (92, 144, 138), (150, 110, 78))
        cc.drawRect(skia.Rect(0, 760, W, H), P((170, 120, 76), 255, MaskFilter=blur(30)))
        cc.drawPath(poly([(0, 0), (700, 0), (1500, H), (300, H)]), P((255, 236, 180), 46, MaskFilter=blur(60), BlendMode=skia.BlendMode.kScreen))
        _SOFT['bg'] = sf.makeImageSnapshot()
    c.drawImage(_SOFT['bg'], 0, 0)
    for i in range(14):
        x = (i * 173 + 40 * math.sin(t * 0.2 + i)) % W; y = 120 + (i * 97) % 700 + 16 * math.sin(t * 0.3 + i * 2)
        PL.rglow(c, x, y, 34 + (i % 4) * 12, (255, 240, 200), 0.10 + 0.03 * math.sin(t * 0.7 + i))


# ------------------------------------------------------------------------------------------------ pose builders
def walt_counter(t, wn=0.3, x=3050.0, g=20.0, well=False, look=(0.0, 0.3), yaw=0.0, worry=0.4):
    """Walt behind his counter: his left forearm lies on the counter top, his right hand is flat on his chest (or, when he
    is well again, both forearms rest on the counter). The counter is drawn between his body and his forearms (ps.mid)."""
    fast = 0.0 if well else 1.0
    br = 0.5 + 0.5 * math.sin(t * (1.5 + 3.4 * fast))
    ps = CA.pose(breath=br * (1 + 1.2 * fast), sway=2 + 1.5 * math.sin(t * 0.3), lean=2.2 + 0.5 * math.sin(t * 0.25) + 1.2 * wn * fast, look=look, smile=-0.25 * fast + (0.5 if well else 0), worry=worry, brow=0.0,
                 head_yaw=yaw, head_tilt=3 * fast + 2.0 * wn + 0.8 * math.sin(t * 0.4), lid=CA.blink(t, 0.2), wince=wn, head_pitch=0.5 * wn)
    ps.sh_r = (3 + 5 * br) * fast + 6 * wn * fast; ps.puff = 0.5 * fast * max(0.0, math.sin(t * 4.9 + 0.6)) * (1 - wn)
    CA._cfg(ps, 'walt'); s = SS('walt')
    ps.l_hand = CA.SOFT; ps.l_up, ps.l_fore, ps.l_wrist = 27 + 1.5 * br * fast, -116, -4; ps.l_ts = 1
    if well:                                                  # one forearm rests on the counter; the other arm hangs relaxed at his side
        ps.r_up, ps.r_fore, ps.r_wrist = 7, 8, -8; ps.front = ('l',)
    else:                                                     # the other hand presses on his breastbone, fingers together, well above the counter
        ps.r_hand = CA.PRESS; CA.place(ps, 'r', (44, 0), (x + 4, g - (818 + 3 * br) * s), -112, x, g, s, 'walt'); ps.r_ts = -1; ps.front = ('l', 'r')
    return ps


def draw_walt_counter(c, t, ps, x=3050.0, g=20.0, items=True, tag='walt_counter', extra=None):
    M = c.getTotalMatrix()
    def mid(cc):
        cc.save(); cc.setMatrix(M); PL.counter(cc, t, items)
        if extra: extra(cc)
        cc.restore()
    ps.mid = mid
    who(c, 'walt', ps, x, g, 1.0, tag)


def walt_chair(t, wn=0.3, x=1960.0, g=150.0, look=(0.0, 0.0), yaw=0.0, worry=0.5, chest=True, chew=0.0, calm=0.0):
    """Walt on the chair, thighs toward the camera: his left hand pressed on his chest (or on his thigh), his right hand on his thigh"""
    fast = 1.0 - 0.6 * calm
    br = 0.5 + 0.5 * math.sin(t * (1.5 + 3.0 * fast))
    ps = CA.pose(breath=br * (1 + fast), sway=0.0, lean=0.6 * math.sin(t * 0.25) + 1.0 * wn, look=look, smile=-0.2 * fast, worry=worry, head_yaw=yaw, head_tilt=2.0 * wn + 0.8 * math.sin(t * 0.4), lid=CA.blink(t, 0.5), wince=wn, head_pitch=0.4 * wn)
    ps.sit = 'chair'; ps.sh_r = (2 + 4 * br) * fast + 5 * wn; ps.chew = chew; ps.puff = 0.45 * fast * max(0.0, math.sin(t * 4.5 + 0.6)) * (1 - wn) * (1 if chew == 0 else 0)
    CA._cfg(ps, 'walt'); s = SS('walt')
    def thigh(key):                                           # a hand resting on the thigh: upper arm down, forearm toward the camera
        setattr(ps, key + '_up', 1); setattr(ps, key + '_fore', -12); setattr(ps, key + '_wrist', 0); setattr(ps, key + '_fz', 0.86); setattr(ps, key + '_hang', 7); setattr(ps, key + '_hand', CA.SOFT)
    thigh('l')
    if chest:                                                 # his right hand presses on his breastbone
        ps.r_hand = CA.PRESS; CA.place(ps, 'r', (44, 0), (x + 14, g - (640 + 3 * br) * s), -106, x, g, s, 'walt'); ps.r_ts = -1
    else: thigh('r')
    ps.front = ('l', 'r')
    return ps


def draw_walt_chair(c, t, ps, x=1960.0, g=150.0, tag='walt_chair'):
    PL.chair(c, x, g, 'back'); PL.chair(c, x, g, 'seat'); who(c, 'walt', ps, x, g, 1.0, tag)


def priya_stand(t, k=None, x=1640.0, g=170.0, yaw=0.7, lean=4.0, look=(0.8, 0.5), worry=0.3, brow=0.2, smile=0.05, tilt=4.0):
    ps = CA.idle(t, 0.3, look=look, smile=smile, yaw=yaw, tilt=tilt, worry=worry, brow=brow, lean=lean, sway=4.0)
    CA._cfg(ps, 'priya')
    return ps


# ------------------------------------------------------------------------------------------------ hook
def hook(c, t):
    k = 'hook'; t0, c1, c2, c3, c4 = cues(k, 4); tb = ww(k, 'aspirin') - 0.25
    if t < c2 - 0.05:                                         # 1: Walt at his counter
        u = (t - t0) / (c2 - t0)
        c.save(); shot(c, lerp(1.3, 1.62, u), 3075 - 25 * u, lerp(-730, -800, u))
        PL.store_back(c, t)
        wn = kf(t, [(t0, 0.6), (t0 + 2.2, 0.5), (ww(k, 'chest') - 0.2, 0.55), (ww(k, 'heavy'), 1.0), (ww(k, 'heavy') + 1.6, 0.9), (ww(k, 'customer') - 0.2, 0.2), (c2, 0.3)])
        up = sm((t - ww(k, 'customer') + 0.2) / 0.7)
        ps = walt_counter(t, wn, look=(lerp(0.0, -0.7, up), lerp(0.5, -0.3, up)), yaw=-0.45 * up, worry=0.5 + 0.4 * up)
        draw_walt_counter(c, t, ps)
        PL.store_air(c, t); c.restore()
    elif t < c3 - 0.05:                                       # 2: the whole store; four patches step up
        u = (t - c2) / (c3 - c2)
        c.save(); shot(c, lerp(0.47, 0.5, u), 2400, -560)
        PL.store_back(c, t); ps = walt_counter(t, 0.35 + 0.2 * math.sin(t * 0.9) ** 2, look=(-0.4, 0.2), yaw=-0.2); draw_walt_counter(c, t, ps, tag='walt_counter_wide')
        PL.store_air(c, t); c.restore()
        opq(c, 250, 96, 1150, 366, ua(t, ww(k, 'four'), 0.3))
        for i in range(4):
            a = ua(t, ww(k, 'four') + 0.2 * i, 0.3) if i else ua(t, ww(k, 'four'), 0.3); lit = ua(t, ww(k, 'each') + 0.75 * i, 0.35)
            patch(c, 385 + 210 * i, 266 - 22 * i, 0.9, None, lit, a)
    elif t < tb:                                              # 3: Priya inside the door
        u = (t - c3) / (tb - c3); x, g = 470.0, 70.0; s = SS('priya')
        c.save(); shot(c, lerp(1.2, 1.32, u), 560, -760)
        PL.store_back(c, t, amb=1.0, ring=max(0.0, 1 - (t - c3) / 1.6))
        seen = sm((t - ww(k, "She's") + 0.2) / 0.6)
        ps = CA.idle(t, 0.3, look=(lerp(0.8, 0.5, seen), 0.1), smile=0.05, yaw=lerp(0.6, 0.35, seen), tilt=-2, worry=0.25 + 0.2 * seen, brow=0.4, lean=1.0, sway=3.0); CA._cfg(ps, 'priya')
        T = PN.skel(ps)['T']
        CA.hold(ps, 'r', 'strap'); CA.place(ps, 'r', CA.GRIP, CA._to_screen(ps, T(-56, -176), x, g, s), None, x, g, s, 'priya')
        def strap(cc):
            T_ = ps._T; a_ = T_(-62, 58); g_ = PN.hand_pt(ps, 'r', 38, 0); b_ = (g_[0] - 44, g_[1] + 250)
            pth = skia.Path(); pth.moveTo(a_[0] + 14, a_[1] - 6); pth.quadTo(a_[0] - 22, a_[1] + 40, g_[0], g_[1]); pth.quadTo(g_[0] - 8, g_[1] + 120, b_[0], b_[1])
            mk = lambda col, w, al=255: skia.Paint(AntiAlias=True, Color=C(col, al), Style=skia.Paint.kStroke_Style, StrokeWidth=w, StrokeCap=skia.Paint.kButt_Cap)
            q_ = skia.Path(pth); q_.offset(5, 6); cc.drawPath(q_, mk((20, 10, 40), 24, 70)); cc.drawPath(pth, mk((196, 84, 40), 24)); cc.drawPath(pth, mk((150, 60, 36), 24)); cc.drawPath(pth, mk((206, 92, 44), 19)); 
            q_ = skia.Path(pth); q_.offset(-5, 0); cc.drawPath(q_, mk((244, 146, 80), 3))
        ps.mid = strap
        bx, by = x - 118, g - 600                              # the jump bag hangs at her hip from the strap
        c.drawRRect(rr(bx - 96, by, bx + 70, by + 250, 30), P((214, 96, 44))); c.drawRRect(rr(bx - 96, by + 150, bx + 70, by + 250, 30), P((170, 66, 40))); c.drawRRect(rr(bx - 70, by + 40, bx + 20, by + 120, 12), P((244, 240, 230)))
        who(c, 'priya', ps, x, g, 1.0, 'priya_strap')
        PL.store_air(c, t, amb=1.0); c.restore()
        patch(c, 330, 380, 1.5, 'EMT', 1.0, ua(t, ww(k, "She's") + 0.3, 0.35))
    elif t < c4 - 0.05:                                       # 3b: her hand lifts the aspirin bottle out of the bag
        soft_bg(c, t); u = sm((t - tb - 0.25) / 1.3); dy = lerp(150, -40, u); dx = lerp(30, 0, u)
        c.drawRRect(rr(380, 560, 1540, 1200, 70), P((170, 66, 40)))                                         # the bag's far side and its open mouth
        c.drawRRect(rr(430, 600, 1490, 1200, 50), P((60, 30, 34)))
        for i, col in enumerate(((246, 246, 240), (63, 170, 160), (240, 190, 70))): c.drawRRect(rr(520 + i * 300, 640, 760 + i * 300, 900, 20), P(col)); c.drawRRect(rr(520 + i * 300, 640, 760 + i * 300, 700, 20), P(K_mix(col, (20, 20, 50), 0.25)))
        CA.hands_only(c, (1120 + dx, 470 + dy), math.radians(176 - 6 * u), 2.5, side=-1, who='priya', hand=CA.FIST, item=CA.ITEMS['bottle'], sleeve=False, nails=False)
        c.drawRRect(rr(360, 740, 1560, 1200, 70), P((214, 96, 44))); c.drawRRect(rr(360, 740, 1560, 790, 30), P((250, 150, 80)))               # the near side, in front of the hand
        c.drawRRect(rr(800, 860, 1120, 1010, 24), P((244, 240, 230))); c.save(); c.translate(960, 935)
        for j in range(3): c.save(); c.rotate(60 * j); c.drawRRect(rr(-13, -50, 13, 50, 5), P((60, 110, 200))); c.restore()
        c.restore()
        for xx in range(400, 1540, 40): c.drawLine(xx, 765, xx + 18, 765, SP((120, 60, 40), 6))
    else:                                                     # 4: she holds the bottle: give it, or ask first?
        u = (t - c4) / (fin(k) + 1.5 - c4); x, g = 470.0, 70.0; s = SS('priya')
        c.save(); shot(c, lerp(1.3, 1.42, u), 660, -770)
        PL.store_back(c, t, amb=1.0)
        q = sm((t - ww(k, 'or') + 0.2) / 0.5); dn = 1 - sm((t - ww(k, 'ask') + 0.3) / 0.5)
        ps = CA.idle(t, 0.3, look=(lerp(0.25, 0.7, 1 - dn), lerp(0.9, 0.0, 1 - dn)), smile=-0.12, yaw=lerp(0.15, 0.45, 1 - dn), tilt=lerp(-3, 4, q), worry=0.45 + 0.4 * q, brow=0.3 + 0.6 * q, lean=0.5, sway=3.0)
        ps.head_pitch = 0.6 * dn; CA._cfg(ps, 'priya'); CA.hold(ps, 'l', 'bottle'); ps.l_up, ps.l_fore, ps.l_wrist = 12 + 2 * q, -124 - 4 * q + 1.0 * math.sin(t * 1.2), 14
        who(c, 'priya', ps, x, g, 1.0, 'priya_bottle')
        PL.store_air(c, t, amb=1.0); c.restore()
        qchip(c, 'Can she give it, or must she ask?', 1380, 300, ua(t, ww(k, 'give') - 0.2, 0.35), 46)


# ------------------------------------------------------------------------------------------------ l6
WX, WG = 1960.0, 150.0          # Walt's chair
RX, RG = 2330.0, 205.0          # Ruiz beside him
PX, PG = 1530.0, 170.0          # Priya
MX, MG = 850.0, 190.0          # Marcus
AEDX = 2800.0
BEND = 1


def aed_on_counter(c):
    c.drawOval(skia.Rect(AEDX - 96, PL.CT - 40, AEDX + 104, PL.CT - 16), P((60, 30, 30), 70)); CA.aed_case(c, (AEDX, PL.CT - 30 - 200 * 0.9), 0.9); CA._rod(c, (AEDX - 44, PL.CT - 30 - 180), (AEDX + 44, PL.CT - 30 - 180), 14, (44, 46, 60), (24, 24, 36), (110, 116, 140))


def ruiz_shoulder(t, k, talk=True, yaw=-0.75, look=(-0.8, 0.7)):
    """Ruiz stands beside the chair, his hands resting at his belt, and looks down at Walt"""
    ps = CA.idle(t, 0.7, look=look, smile=0.1, yaw=yaw, tilt=-5, worry=0.3, brow=0.1, lean=-3.0, sway=-6.0); CA._cfg(ps, 'ruiz'); s = SS('ruiz')
    ps.r_hand = CA.SOFT; ps.l_hand = CA.SOFT; b = 1.2 * math.sin(t * 1.4)
    ps.r_up, ps.r_fore, ps.r_wrist = 25 + b, -92, 24; ps.l_up, ps.l_fore, ps.l_wrist = 25 - b, -92, 24; ps.r_ts = -1; ps.l_ts = 1; ps.front = ('l', 'r')
    if talk: speak(ps, t, k, ww(k, 'keeps') - 0.6, ww(k, 'calm') + 0.3, 0.8)
    return ps


def marcus_iv(t, x=MX, g=MG, up=1.0):
    """Marcus holds the IV bag up by its hanger in his right fist and the line below the drip chamber in his left"""
    ps = CA.idle(t, 0.9, look=(-0.7, -0.8), smile=0.0, yaw=-0.5, tilt=-6, brow=-0.2, lean=0.0, sway=4.0); CA._cfg(ps, 'marcus')
    CA.hold(ps, 'r', 'bag'); ps.r_up = lerp(16, 34, up) + 1.0 * math.sin(t * 1.1); ps.r_fore = lerp(96, 116, up); ps.r_wrist = 8; ps.bag_sway = 2.5 * math.sin(t * 1.7) * (0.4 + 0.6 * up); ps.drip = (t * 1.6) % 1.0
    ps.l_hand = CA.FIST; ps.l_up, ps.l_fore, ps.l_wrist = 14, -96 + 1.5 * math.sin(t * 0.9), 10; ps.front = ('l', 'r'); ps.sh_r = 3 * up
    return ps


def draw_marcus(c, t, ps, x=MX, g=MG):
    who(c, 'marcus', ps, x, g, 1.0, 'marcus_iv')
    s = SS('marcus'); b = getattr(ps, 'bag_out', None)        # the line runs from the drip chamber to the coil in his left hand
    if b:
        b = CA._to_screen(ps, b, x, g, s); h = CA._to_screen(ps, PN.hand_pt(ps, 'l', 38, 0), x, g, s)
        p = skia.Path(); p.moveTo(*b); p.cubicTo(b[0] - 6, b[1] + 110, h[0] - 90, h[1] + 30, h[0] - 6, h[1] + 4)
        c.drawPath(p, SP((226, 240, 250), 5)); c.drawPath(p, SP((150, 200, 236), 2))
        for i, (rx, ry) in enumerate(((40, 52), (34, 46), (28, 40))):
            o = skia.Rect(h[0] - rx + i * 5, h[1] + 2, h[0] + rx + i * 5, h[1] + 2 + 2 * ry); c.drawOval(o, SP((226, 240, 250), 5)); c.drawOval(o, SP((150, 200, 236), 2))


def wide_store(c, t, k, z, fx, fy, amb, people=('walt', 'ruiz'), walt_kw=None, ruiz_kw=None, priya=None, marcus_up=1.0, amb_x=0.0):
    c.save(); shot(c, z, fx, fy)
    if amb_x:
        c.save(); PL.store_back(c, t, amb=0.0); c.restore()
        c.save(); c.clipRect(skia.Rect(930, -1270, 1870, -530)); c.translate(amb_x, 0); PL.ambulance_out(c, t, 1.0); c.restore()
        for xx in (1240, 1560): c.drawRect(skia.Rect(xx - 8, -1270, xx + 8, -530), P(PL.WOOD_D))
        c.drawRect(skia.Rect(930, -1010, 1870, -994), P(PL.WOOD_D))
    else:
        PL.store_back(c, t, amb=amb)
    PL.counter(c, t); aed_on_counter(c)
    if 'marcus' in people: draw_marcus(c, t, marcus_iv(t, up=marcus_up))
    if 'priya' in people: who(c, 'priya', priya, PX, PG, 1.0, 'priya_wide')
    draw_walt_chair(c, t, walt_chair(t, **(walt_kw or {})))
    if 'ruiz' in people: who(c, 'ruiz', ruiz_shoulder(t, k, **(ruiz_kw or {})), RX, RG, 1.0, 'ruiz_shoulder')
    PL.store_air(c, t, amb=amb if not amb_x else 0.0); c.restore()


def l6(c, t):
    k = 'l6'; t0, c1, c2, c3, c4 = cues(k, 4); ta = ww(k, 'sits') - 0.35; tp = ww(k, 'tells') - 0.4; tm = ww(k, 'while') + 0.2
    if t < ta:                                                # 1a: Ruiz, just inside the door, the AED case in his hand
        u = (t - t0) / (ta - t0); x, g = 500.0, 80.0
        c.save(); shot(c, lerp(0.86, 0.96, u), 700, -600)
        PL.store_back(c, t, ring=max(0.0, 1 - (t - t0) / 2.4) * 0.8)
        see = sm((t - t0 - 0.6) / 0.8)
        ps = CA.idle(t, 0.7, look=(lerp(0.2, 0.9, see), 0.1), smile=0.0, yaw=lerp(0.1, 0.7, see), tilt=2 * see, worry=0.3 + 0.3 * see, brow=0.5 * see, lean=1.5 * see, sway=5.0); CA._cfg(ps, 'ruiz')
        CA.hold(ps, 'l', 'handle'); ps.front = (); ps.l_up, ps.l_fore, ps.l_wrist = 9 + 1.0 * math.sin(t * 1.3), 5, -12
        ps.r_up, ps.r_fore = 9, 12
        who(c, 'ruiz', ps, x, g, 1.0, 'ruiz_aed')
        PL.store_air(c, t); c.restore()
    elif t < c2 - 0.05:                                       # 1b: Walt on the chair, Ruiz's hand on his shoulder, the AED within reach
        u = (t - ta) / (c2 - ta)
        up = sm((t - ww(k, 'keeps') + 0.3) / 0.6)
        wide_store(c, t, k, lerp(0.78, 0.86, u), 2230, -470, 0.0, walt_kw=dict(wn=kf(t, [(ta, 0.7), (ww(k, 'calm'), 0.25)]), look=(0.7 * up, -0.6 * up), yaw=0.5 * up, calm=0.5 * up),
                   ruiz_kw=dict(yaw=kf(t, [(ww(k, 'sets') - 0.3, -0.75), (ww(k, 'sets') + 0.4, 0.7), (ww(k, 'reach') + 0.5, 0.7), (ww(k, 'reach') + 1.1, -0.6)]),
                                look=(kf(t, [(ww(k, 'sets') - 0.3, -0.8), (ww(k, 'sets') + 0.4, 0.9), (ww(k, 'reach') + 0.5, 0.9), (ww(k, 'reach') + 1.1, -0.8)]), 0.6)))
    elif t < tp:                                              # 2a: the ambulance pulls up outside the window
        u = (t - c2) / (tp - c2); ax = 1100 * (1 - sm((t - c2 - 0.2) / 1.5)) ** 2
        lk = sm((t - c2 - 0.9) / 0.6)
        wide_store(c, t, k, lerp(0.56, 0.6, u), 1800, -560, 1.0, walt_kw=dict(wn=0.25, look=(-0.8 * lk, -0.2), yaw=-0.5 * lk, calm=0.5), ruiz_kw=dict(talk=False, yaw=-0.75 - 0.2 * lk, look=(-0.9, 0.1 + 0.3 * (1 - lk))), amb_x=ax if ax > 2 else 0.001)
        if ax < 600:
            c.save(); shot(c, lerp(0.56, 0.6, u), 1800, -560); PL.store_air(c, t, amb=sm((600 - ax) / 500)); c.restore()
    elif t < tm:                                              # 2b: Priya beside Walt; her hand goes to her chest on her name; he looks up
        u = (t - tp) / (tm - tp)
        c.save(); shot(c, lerp(0.98, 1.06, u), 1810, -585)
        PL.store_back(c, t, amb=1.0); PL.counter(c, t); aed_on_counter(c)
        nm = sm((t - ww(k, 'her') + 0.45) / 0.5) * (1 - sm((t - ww(k, 'starts') + 0.2) / 0.6)); s = SS('priya')
        pp = priya_stand(t, look=(0.9, 0.55), smile=0.25, brow=0.5, worry=0.1); speak(pp, t, k, tp, ww(k, 'assessment') + 0.5, 0.9)
        pp.r_hand = CA.blend_hand(PN.RELAX, CA.REST, nm) if hasattr(CA, 'blend_hand') else CA.REST
        pp.r_up = lerp(8, 2, nm); pp.r_fore = lerp(-14, -126, nm); pp.r_wrist = lerp(-8, -10, nm); pp.r_ts = -1
        pp.front = ('r',) if nm > 0.12 else ()
        lu = sm((t - ww(k, 'her') + 0.3) / 0.5)
        draw_walt_chair(c, t, walt_chair(t, wn=0.2, look=(-0.9, -0.8 * lu), yaw=-0.65, worry=0.4 + 0.4 * lu, calm=0.6))
        who(c, 'priya', pp, PX, PG, 1.0, 'priya_name')
        PL.store_air(c, t, amb=1.0); c.restore()
    elif t < c3 - 0.05:                                       # 2c: Marcus gets the IV ready
        u = (t - tm) / (c3 - tm)
        c.save(); shot(c, lerp(0.92, 1.0, u), MX + 40, MG - 850)
        PL.store_back(c, t, amb=1.0)
        draw_marcus(c, t, marcus_iv(t, up=sm((t - tm - 0.2) / 1.2)))
        PL.store_air(c, t, amb=1.0); c.restore()
    else:                                                     # 3 and 4: everyone; Joan on her way (map inset); four patches step up
        u = (t - c3) / (fin(k) + 1.5 - c3)
        pp = priya_stand(t, look=(0.9, 0.5), smile=0.15, yaw=0.75); pp.l_hand = CA.SOFT
        wide_store(c, t, k, lerp(0.52, 0.56, u), 1880, -650, 1.0, people=('walt', 'ruiz', 'priya', 'marcus'), priya=pp, marcus_up=0.12, walt_kw=dict(wn=0.2, look=(-0.8, -0.5), yaw=-0.5, calm=0.7), ruiz_kw=dict(talk=False, yaw=-0.7))
        a = ua(t, c3, 0.3) * (1 - ua(t, c4 - 0.45, 0.3))
        if a > 0.01:                                          # Joan's ambulance on the road to the store
            c.save(); c.translate(1010, 0); opq(c, 110, 96, 800, 380, a)
            c.save(); c.clipRect(skia.Rect(120, 106, 790, 370)); c.saveLayerAlpha(None, int(255 * a))
            rd = skia.Path(); rd.moveTo(120, 330); rd.cubicTo(300, 330, 330, 250, 480, 250); rd.cubicTo(600, 250, 640, 300, 790, 300)
            c.drawPath(rd, SP((70, 80, 120), 34)); c.drawPath(rd, skia.Paint(AntiAlias=True, Color=C(CREAM, 180), Style=skia.Paint.kStroke_Style, StrokeWidth=3, PathEffect=skia.DashPathEffect.Make([18, 16], 0)))
            m = skia.PathMeasure(rd, False); L = m.getLength(); v = lerp(0.06, 0.52, (t - c3) / (c4 - c3)); pos, tan = m.getPosTan(L * v)
            c.drawPath(poly([(700, 300), (700, 262), (726, 240), (752, 262), (752, 300)]), P((232, 184, 124))); c.drawRect(skia.Rect(716, 276, 736, 300), P((120, 80, 54)))
            c.save(); c.translate(pos.x(), pos.y() - 6); c.rotate(math.degrees(math.atan2(tan.y(), tan.x())))
            c.drawRRect(rr(-44, -30, 30, 14, 6), P((246, 246, 244))); c.drawRRect(rr(30, -18, 52, 14, 5), P((246, 246, 244))); c.drawRect(skia.Rect(-44, -6, 52, 2), P((240, 130, 50))); c.drawRect(skia.Rect(34, -14, 48, -2), P((150, 190, 214)))
            c.drawRect(skia.Rect(-20, -38, 6, -30), P((240, 60, 60) if int(t * 4) % 2 else (70, 110, 240)))
            for xx in (-26, 34): c.drawCircle(xx, 16, 9, P((40, 42, 56)))
            c.restore(); c.restore(); c.restore()
            c.save(); c.clipPath(skia.Path().addCircle(196, 186, 62), skia.ClipOp.kIntersect, True); c.saveLayerAlpha(None, int(255 * a)); c.drawPaint(P((60, 70, 110)))
            jp = CA.idle(t, 0.1, look=(0.4, 0.0), smile=0.1); CA.draw(c, 'joan', jp, 196, 186 + 905 * 0.62, 0.62); c.restore(); c.restore()
            c.drawCircle(196, 186, 62, SP(MINT, 5, 255 * a))
            text(c, 'Joan, paramedic', 280, 200, 46, CREAM, a * ua(t, ww(k, 'paramedic') - 0.2, 0.3), 'bold'); c.restore()
        b = ua(t, c4 - 0.1, 0.3)
        if b > 0.01:
            opq(c, 760, 70, 1830, 400, b)
            for i, lab in enumerate(('EMR', 'EMT', 'AEMT', 'Paramedic')):
                patch(c, 900 + 262 * i, 214 - 10 * i, 0.9, lab, ua(t, ww(k, 'each') + 0.5 * i, 0.35), ua(t, c4 + 0.1 + 0.15 * i, 0.3))


# ------------------------------------------------------------------------------------------------ j4
def _map(c, t, k, x0, y0, x1, y1, a):
    c2, c3, c4 = cue(k, 2), cue(k, 3), cue(k, 4)
    opq(c, x0, y0, x1, y1, a, col=(22, 30, 62))
    c.save(); c.clipRect(skia.Rect(x0 + 6, y0 + 6, x1 - 6, y1 - 6)); c.saveLayerAlpha(None, int(255 * a))
    for i in range(7):
        for j in range(6): c.drawRRect(rr(x0 + 30 + i * 150, y0 + 30 + j * 130, x0 + 150 + i * 150, y0 + 130 + j * 130, 10), P((30, 40, 78)))
    st = (x0 + 150, y1 - 150); hp = (x0 + 470, y1 - 420); hc = (x1 - 170, y0 + 190)
    near = skia.Path(); near.moveTo(*st); near.lineTo(st[0] + 160, st[1]); near.lineTo(st[0] + 160, hp[1]); near.lineTo(*hp)
    far = skia.Path(); far.moveTo(*st); far.lineTo(st[0] + 160, st[1]); far.lineTo(st[0] + 600, st[1]); far.lineTo(st[0] + 600, hc[1] + 150); far.lineTo(hc[0], hc[1] + 150); far.lineTo(*hc)
    rp = lambda col, w, al=255, eff=None: skia.Paint(AntiAlias=True, Color=C(col, al), Style=skia.Paint.kStroke_Style, StrokeWidth=w, StrokeJoin=skia.Paint.kRound_Join, StrokeCap=skia.Paint.kRound_Cap, PathEffect=eff)
    def part(pth, u):
        m = skia.PathMeasure(pth, False); d = skia.Path(); m.getSegment(0, m.getLength() * max(0.0, min(1.0, u)), d, True); return d
    un = 1.0; uf = 1.0; dim = 1 - 0.65 * ua(t, ww(k, "isn't") - 0.2, 0.6); lit = ua(t, c4 + 0.2, 0.8)
    c.drawPath(part(near, un), rp((120, 136, 190), 20, int(255 * dim))); c.drawPath(part(far, uf), rp(K_mix((120, 136, 190), AMBER, lit), 20 + 6 * lit))
    # the store
    c.drawCircle(st[0], st[1], 54, P((16, 20, 48))); c.drawPath(poly([(st[0] - 34, st[1] + 30), (st[0] - 34, st[1] - 8), (st[0], st[1] - 38), (st[0] + 34, st[1] - 8), (st[0] + 34, st[1] + 30)]), P((232, 184, 124))); c.drawRect(skia.Rect(st[0] - 10, st[1] + 2, st[0] + 10, st[1] + 30), P((120, 80, 54)))
    c.drawPath(poly([(st[0] - 40, st[1] - 6), (st[0], st[1] - 42), (st[0] + 40, st[1] - 6), (st[0] + 30, st[1] - 2), (st[0], st[1] - 28), (st[0] - 30, st[1] - 2)]), P((214, 80, 70)))
    def hospital(p, al, heart):
        if al <= 0.01: return
        c.save(); c.translate(p[0], p[1]); c.scale(1.5, 1.5); c.translate(-p[0], -p[1])
        c.drawRRect(rr(p[0] - 70, p[1] - 90, p[0] + 70, p[1] + 60, 12), P((16, 20, 48), 255 * al)); c.drawRRect(rr(p[0] - 56, p[1] - 76, p[0] + 56, p[1] + 60, 8), P((236, 240, 248), 255 * al)); c.drawRect(skia.Rect(p[0] + 20, p[1] - 76, p[0] + 56, p[1] + 60), P((196, 204, 226), 255 * al))
        for i in range(3):
            for j in range(2): c.drawRect(skia.Rect(p[0] - 44 + i * 34, p[1] + 2 + j * 26, p[0] - 24 + i * 34, p[1] + 18 + j * 26), P((120, 160, 210), 255 * al))
        if heart:
            hh = skia.Path(); hh.moveTo(p[0], p[1] - 14); hh.cubicTo(p[0] - 50, p[1] - 46, p[0] - 28, p[1] - 86, p[0], p[1] - 60); hh.cubicTo(p[0] + 28, p[1] - 86, p[0] + 50, p[1] - 46, p[0], p[1] - 14); c.drawPath(hh, P((236, 78, 90), 255 * al))
        else:
            c.drawRect(skia.Rect(p[0] - 9, p[1] - 66, p[0] + 9, p[1] - 18), P((236, 78, 90), 255 * al)); c.drawRect(skia.Rect(p[0] - 24, p[1] - 51, p[0] + 24, p[1] - 33), P((236, 78, 90), 255 * al))
        c.restore()
    hospital(hp, ua(t, ww(k, 'nearest') + 0.5, 0.4) * dim, False); hospital(hc, ua(t, c3 + 0.3, 0.4), True)
    text(c, '8 min', hp[0] - 120, hp[1] - 60, 64, CREAM, ua(t, ww(k, 'eight') - 0.1, 0.3) * dim, 'xb', 'right')
    text(c, '25 min', hc[0] - 124, hc[1] + 10, 64, K_mix(CREAM, AMBER, lit), ua(t, ww(k, 'twenty') - 0.1, 0.3), 'xb', 'right')
    ug = ua(t, ww(k, 'heads') - 0.2, 3.6)
    if ug > 0.001:
        m = skia.PathMeasure(far, False); pos, tan = m.getPosTan(m.getLength() * min(0.93, ug * 0.93))
        c.save(); c.translate(pos.x(), pos.y()); glow(c, 0, 0, 60, AMBER, 0.5)
        c.drawRRect(rr(-40, -26, 26, 14, 6), P((246, 246, 244))); c.drawRRect(rr(26, -14, 46, 14, 5), P((246, 246, 244))); c.drawRect(skia.Rect(-40, -4, 46, 3), P((240, 130, 50))); c.drawRect(skia.Rect(-16, -34, 6, -26), P((240, 60, 60) if int(t * 4) % 2 else (70, 110, 240)))
        for xx in (-24, 30): c.drawCircle(xx, 16, 8, P((40, 42, 56)))
        c.restore()
    c.restore(); c.restore()


def j4(c, t):
    k = 'j4'; t0, c1, c2, c3, c4 = cues(k, 4); tf = ww(k, 'Aspirin', 1) - 0.3
    if t < tf:                                                # 1a: Priya asks, an open palm toward him; Walt shakes his head
        u = (t - t0) / (tf - t0)
        c.save(); shot(c, lerp(0.98, 1.08, u), 1815, -590)
        PL.store_back(c, t, amb=1.0); PL.counter(c, t); aed_on_counter(c)
        ask = sm((t - ww(k, 'asks') + 0.5) / 0.6)
        pp = priya_stand(t, look=(0.9, 0.55), smile=0.1, brow=0.3 + 0.5 * ask, worry=0.25, lean=4 + 1.5 * ask, tilt=4 + 3 * ask); speak(pp, t, k, ww(k, 'asks') - 0.4, ww(k, 'problems') + 0.5)
        pp.r_hand = CA.OPENP; pp.r_palm = ask > 0.5; pp.r_up = lerp(8, 15, ask); pp.r_fore = lerp(-10, -74, ask) + 2 * math.sin(t * 2.2) * ask; pp.r_wrist = lerp(-8, 8, ask); pp.front = ('r',) if ask > 0.1 else ()   # an open palm in front of herself, clear of Walt
        no = ua(t, ww(k, 'problems') + 0.3, 0.2) * (1 - ua(t, ww(k, 'problems') + 1.5, 0.3)); sh = 0.3 * math.sin((t - ww(k, 'problems') - 0.3) * 9.5) * no
        draw_walt_chair(c, t, walt_chair(t, wn=0.2, look=(-0.9, -0.7), yaw=-0.6 + sh, worry=0.5, calm=0.6))
        who(c, 'priya', pp, PX, PG, 1.0, 'priya_ask')
        PL.store_air(c, t, amb=1.0); c.restore()
        qchip(c, 'allergies?', 1560, 190, ua(t, ww(k, 'allergies') - 0.1, 0.3), 50); qchip(c, 'bleeding?', 1560, 300, ua(t, ww(k, 'bleeding') - 0.1, 0.3), 50)
    else:                                                     # 1b to 4: her thinking face; the map beside her
        u = (t - tf) / (fin(k) + 1.5 - tf); m = ua(t, c2 - 0.3, 0.45)
        zx = lerp(1640, 1640 + (960 - 410) / 2.2, m)
        c.save(); shot(c, lerp(2.3, 2.2, m) + 0.08 * u, zx, -765)
        PL.store_back(c, t, amb=1.0)
        th = sm((t - tf) / 0.8); mp = ua(t, c2 + 0.3, 0.5); dec = ua(t, c4 + 0.2, 0.6)
        lx = kf(t, [(tf, 0.5), (tf + 1.2, -0.2), (ww(k, 'dangerous'), 0.5), (c2, 0.3), (c2 + 0.8, 0.95), (c4, 0.95), (c4 + 1.0, 0.2)])
        ly = kf(t, [(tf, 0.4), (tf + 1.2, 0.9), (ww(k, 'dangerous'), 0.3), (c2 + 0.8, -0.2), (c4 + 1.0, 0.0)])
        pp = CA.idle(t, 0.3, look=(lx, ly), smile=-0.1 + 0.25 * dec, yaw=kf(t, [(tf, 0.5), (c2, 0.3), (c2 + 0.8, 0.6), (c4 + 1.0, 0.25)]), tilt=kf(t, [(tf, 3), (c2 + 0.8, -4), (c4 + 0.6, 2)]),
                     worry=0.5 * (1 - dec), brow=kf(t, [(tf, 0.2), (ww(k, 'dangerous'), -0.5), (c2, 0.3), (ww(k, "doesn't"), -0.6), (c3, 0.4), (c4 + 0.6, 0.0)]), lean=1.0, sway=4.0)
        pp.head_pitch = 0.5 * math.exp(-((t - c4 - 1.2) / 0.35) ** 2)
        who(c, 'priya', pp, PX, PG, 1.0, 'priya_think')
        PL.store_air(c, t, amb=1.0); c.restore()
        _map(c, t, k, 800, 110, 1830, 960, m)


# ------------------------------------------------------------------------------------------------ m3
def _card(c, t, k, x0, y0, x1, y1, a, stamp_t, early=False):
    """the protocol card: a title, one line, and the stamp"""
    if a <= 0.01: return
    c.save(); c.translate(0, 14 * (1 - a))
    c.drawRRect(rr(x0 + 8, y0 + 12, x1 + 8, y1 + 12, 22), P((6, 8, 24), 120 * a, MaskFilter=blur(14)))
    c.drawRRect(rr(x0, y0, x1, y1, 22), P((250, 244, 230), 255 * a)); c.drawRRect(rr(x0, y0, x1, y0 + 130, 22), P(MINT, 255 * a)); c.drawRect(skia.Rect(x0, y0 + 100, x1, y0 + 130), P(MINT, 255 * a))
    text(c, 'Chest pain', (x0 + x1) / 2, y0 + 88, 62, NAVY, a * ua(t, ww(k, 'chest') - 0.1, 0.3), 'xb', 'center')
    if early:                                                 # before the aspirin is named: the card's own line, and the heart it is about
        text(c, 'standing order', x0 + 60, y0 + 250, 62, (30, 36, 70), a * ua(t, ww(k, 'standing') - 0.1, 0.3), 'xb')
        ah = a * ua(t, ww(k, 'heart') - 0.2, 0.35)
        if ah > 0.01:
            hx, hy = (x0 + x1) / 2, y0 + 470; hh = skia.Path(); hh.moveTo(hx, hy + 70); hh.cubicTo(hx - 150, hy - 20, hx - 84, hy - 130, hx, hy - 56); hh.cubicTo(hx + 84, hy - 130, hx + 150, hy - 20, hx, hy + 70)
            c.drawPath(hh, P((226, 78, 84), 255 * ah)); c.drawCircle(hx - 40, hy - 50, 16, P((255, 170, 160), 200 * ah))
        c.restore(); return
    al = a * ua(t, ww(k, 'aspirin') - 0.15, 0.3)
    text(c, 'aspirin', x0 + 60, y0 + 240, 64, (30, 36, 70), al, 'xb')
    for i in range(4):
        cx, cy = x0 + 100 + i * 82, y0 + 330; c.drawCircle(cx + 3, cy + 4, 30, P((120, 110, 100), 90 * al)); c.drawCircle(cx, cy, 30, P((255, 255, 255), 255 * al)); c.drawCircle(cx, cy, 30, SP((200, 196, 190), 3, 255 * al)); c.drawLine(cx - 18, cy, cx + 18, cy, SP((206, 202, 196), 3, 255 * al))
    text(c, 'chew', x0 + 60, y0 + 462, 60, (30, 36, 70), a * ua(t, ww(k, 'chew') - 0.1, 0.3), 'bold')
    u = (t - stamp_t) / 0.22
    if u > 0:
        sc = 1 + 0.6 * max(0.0, 1 - u) ** 2; sa = min(1.0, u * 2) * a
        c.save(); c.translate((x0 + x1) / 2 + 40, y1 - 120); c.rotate(-9); c.scale(sc, sc)
        w = K.width('standing order', 54, 'xb') + 60
        c.drawRRect(rr(-w / 2, -52, w / 2, 44, 14), P((250, 244, 230), 230 * sa)); c.drawRRect(rr(-w / 2, -52, w / 2, 44, 14), SP((214, 70, 60), 7, 255 * sa)); text(c, 'standing order', 0, 14, 54, (214, 70, 60), sa, 'xb', 'center')
        c.restore()
    c.restore()


def tablet(c, x, y, r, a=255):
    c.drawOval(skia.Rect(x - r + 3, y - r * 0.62 + 5, x + r + 3, y + r * 0.62 + 5), P((60, 30, 40), 70 * a / 255, MaskFilter=blur(3)))
    c.drawOval(skia.Rect(x - r, y - r * 0.62, x + r, y + r * 0.62), P((255, 255, 252), a)); c.drawOval(skia.Rect(x - r, y - r * 0.62 + r * 0.22, x + r, y + r * 0.62), P((214, 214, 226), a)); c.drawOval(skia.Rect(x - r, y - r * 0.72, x + r, y + r * 0.42), P((255, 255, 252), a))
    c.drawLine(x - r * 0.6, y - r * 0.15, x + r * 0.6, y - r * 0.15, SP((210, 210, 222), 2.4, a))


def hands_shot(c, t, ta):
    """close: Priya's open palm (from the left) tips four small tablets into Walt's cupped palm (from the right); he lifts them away"""
    soft_bg(c, t); u = t - ta
    come = sm(u / 0.6); tip = sm((u - 1.3) / 0.7); away = sm((u - 3.3) / 0.8); lift = sm((u - 3.5) / 1.2)
    wwrist = (1560 + 90 * lift, 800 - 420 * lift ** 1.6 + 5 * math.sin(t * 4.4)); wang = math.radians(190 + 12 * lift)
    Ww = CA.hands_only(c, wwrist, wang, 3.4, side=1, who='walt', forearm=330, hand=CA.CUP, palm=True, sleeve=True)
    land = [Ww(34 + (i % 2) * 18, -10 + (i // 2) * 16) for i in range(4)]
    pwrist = (lerp(700, 930, come) - 700 * away, lerp(400, 450, come) + 6 * math.sin(t * 2) - 60 * away); pang = math.radians(lerp(2, 30, tip) - 20 * away)
    Wp = CA.hands_only(c, pwrist, pang, 3.4, side=-1, who='priya', forearm=330, hand=CA.OPENP, palm=True)
    for i in range(4):
        st = (30 + (i % 2) * 18, -9 + (i // 2) * 16); ti = 1.55 + 0.24 * i                                  # each tablet slides down the tilted palm, then drops
        sl = sm((u - ti) / 0.45); fl = min(1.0, max(0.0, (u - ti - 0.45) / 0.26))
        p0 = Wp(st[0] + 70 * sl, st[1] * (1 - 0.5 * sl)); p1 = land[i]
        if fl <= 0: x, y = p0
        elif fl < 1: x = lerp(p0[0], p1[0], fl); y = lerp(p0[1], p1[1], fl * fl)
        else: x, y = p1
        tablet(c, x, y, 26)


def m3(c, t):
    k = 'm3'; t0, c1, c2, c3, c4 = cues(k, 4); th = ww(k, 'hands') - 0.5
    if t < th:                                                # 1a: Priya and her protocol card
        u = (t - t0) / (th - t0)
        c.save(); shot(c, lerp(1.5, 1.62, u), 1640 + (960 - 1480) / 1.56, -730)
        PL.store_back(c, t, amb=1.0); PL.counter(c, t); aed_on_counter(c)
        rd = ua(t, ww(k, 'protocols') - 0.3, 0.5) * (1 - ua(t, ww(k, 'Once') - 0.2, 0.6))
        pp = CA.idle(t, 0.3, look=(lerp(0.6, -0.9, rd), lerp(0.4, 0.1, rd)), smile=0.12, yaw=lerp(0.55, -0.45, rd), tilt=lerp(3, -3, rd), worry=0.15, brow=0.3, lean=2.0, sway=4.0)
        pp.head_pitch = 0.45 * math.exp(-((t - ww(k, 'heart') - 0.5) / 0.3) ** 2)
        who(c, 'priya', pp, PX, PG, 1.0, 'priya_card')
        PL.store_air(c, t, amb=1.0); c.restore()
        _card(c, t, k, 150, 170, 800, 830, ua(t, ww(k, 'protocols') - 0.3, 0.4), 1e9, early=True)
    elif t < c2 - 0.05:                                       # 1b: four tablets, palm to palm
        hands_shot(c, t, th)
    elif t < c3 - 0.05:                                       # 2: Walt chews; the card is stamped
        u = (t - c2) / (c3 - c2)
        c.save(); shot(c, lerp(1.42, 1.5, u), WX + (960 - 520) / 1.46, -540)
        PL.store_back(c, t, amb=1.0); PL.counter(c, t, items=False)
        ch = 0.5 + 0.5 * math.sin(t * 9.0)
        draw_walt_chair(c, t, walt_chair(t, wn=0.12, look=(0.5, 0.1), yaw=0.2, worry=0.35, chew=ch, calm=0.8))
        PL.store_air(c, t, amb=1.0); c.restore()
        _card(c, t, k, 1090, 170, 1740, 830, 1.0, ww(k, 'gave') + 0.1)
    elif t < c4 - 0.05:                                       # 3: his own small bottle in his open palm; call first
        soft_bg(c, t); u = sm((t - c3) / 0.9)
        wr = (lerp(1700, 1290, u), 640 + 7 * math.sin(t * 4.6)); ang = math.radians(184)
        CA.hands_only(c, wr, ang, 3.4, side=-1, who='walt', forearm=330, hand=CA.FIST, item=CA.ITEMS['nitro'], sleeve=True, nails=False)
        qchip(c, 'nitroglycerin', 620, 240, ua(t, ww(k, 'nitroglycerin') - 0.1, 0.35), 56)
        bp = ua(t, ww(k, 'drop') - 0.15, 0.35)
        if bp > 0.01:
            qchip(c, 'blood pressure', 500, 420, bp, 52, col=AMBER); dd = 26 * sm((t - ww(k, 'drop')) / 0.8)
            K.arrow(c, (500, 480 + dd), (500, 590 + dd), AMBER, 12, 1.0, bp)
        a = ua(t, ww(k, 'call') - 0.25, 0.35)
        if a > 0.01:
            opq(c, 170, 690, 760, 910, a)
            c.save(); c.translate(270, 800 + 12 * (1 - a))                                                   # a hand radio
            c.drawRRect(rr(-34, -50, 34, 70, 12), P((60, 64, 84), 255 * a)); c.drawRRect(rr(-24, -38, 24, -4, 6), P((150, 200, 190), 255 * a)); c.drawRect(skia.Rect(14, -92, 24, -50), P((60, 64, 84), 255 * a))
            for j in range(3): c.drawLine(-20, 16 + j * 14, 20, 16 + j * 14, SP((30, 32, 46), 5, 255 * a))
            c.restore()
            text(c, 'call first', 340, 824, 72, CREAM, a, 'xb')
    else:                                                     # 4: Priya on the radio, Walt watching; the physician answers
        u = (t - c4) / (fin(k) + 1.5 - c4); s = SS('priya')
        c.save(); shot(c, lerp(1.2, 1.3, u), 1640 + (960 - 1010) / 1.25, -640)
        PL.store_back(c, t, amb=1.0); PL.counter(c, t); aed_on_counter(c)
        hear = ua(t, ww(k, 'hears') - 0.2, 0.5)
        pp = CA.idle(t, 0.3, look=(lerp(0.2, 0.7, hear), lerp(0.6, 0.2, hear)), smile=0.05 + 0.2 * hear, yaw=lerp(0.5, 0.35, hear), tilt=9 - 3 * hear, worry=0.3 * (1 - hear), brow=lerp(-0.3, 0.4, hear), lean=1.5, sway=4.0)
        CA._cfg(pp, 'priya'); pp.mic = False; CA.hold(pp, 'r', 'mic'); pp.r_hand = dict(curls=(0.5, 0.62, 0.66, 0.7, 0.7), spread=0.04, creases=False)
        T = PN.skel(pp)['T']; CA.place(pp, 'r', (62, 2), CA._to_screen(pp, T(48, -6), PX, PG, s), None, PX, PG, s, 'priya')
        speak(pp, t, k, c4, ww(k, 'found') + 0.4); pp.head_pitch = 0.5 * math.exp(-((t - ww(k, 'order', 2) - 0.5) / 0.3) ** 2)
        def cordf(cc):
            A = PN.arm_pts(pp, 'r'); m_ = PN.hand_pt(pp, 'r', 58, 2); wst = pp._T(60, -260); CA.cord(cc, (m_[0], m_[1] + 30), wst)
        pp.mid = cordf
        who(c, 'priya', pp, PX, PG, 1.0, 'priya_mic')
        draw_walt_chair(c, t, walt_chair(t, wn=0.1, look=(-0.9, -0.7), yaw=-0.6, worry=0.4, calm=0.8, chest=False))
        PL.store_air(c, t, amb=1.0); c.restore()
        a = ua(t, ww(k, 'physician', 1) - 0.3, 0.4)
        if a > 0.01:
            opq(c, 120, 130, 560, 560, a)
            c.save(); c.clipRect(skia.Rect(130, 140, 550, 550)); c.saveLayerAlpha(None, int(255 * a)); c.translate(340, 0)
            physician(c, t, talking(t, k, ww(k, 'hears') - 0.3, ww(k, 'order', 2) + 0.4) > 0)
            c.restore(); c.restore()
            for i in range(3):                                # radio waves between her microphone and the physician
                ph = ((t * 1.4 + i / 3) % 1.0); back = hear > 0.5; v = 1 - ph if back else ph
                x = lerp(900, 600, v); y = lerp(330, 300, v)
                c.drawArc(skia.Rect(x - 40, y - 70, x + 40, y + 70), 135 if not back else -45, 90, False, SP(MINT if not back else AMBER, 8, 230 * a * math.sin(math.pi * ph)))


def physician(c, t, talk=False, a=255):
    """the physician on duty at the base station (a small inset figure in the house style): a white coat over scrubs, a headset"""
    SK, SKS, HR = (150, 104, 80), (118, 76, 62), (40, 34, 40)
    coat = skia.Path(); coat.moveTo(-150, 660); coat.cubicTo(-150, 470, -110, 440, -40, 420); coat.lineTo(40, 420); coat.cubicTo(110, 440, 150, 470, 150, 660); coat.close()
    c.drawPath(coat, P((244, 246, 250))); c.save(); c.clipPath(coat, skia.ClipOp.kIntersect, True); c.drawRect(skia.Rect(40, 400, 160, 660), P((214, 220, 236)))
    c.drawPath(poly([(-40, 420), (40, 420), (0, 520)]), P((70, 160, 150))); c.drawPath(poly([(-40, 420), (-64, 430), (-18, 540), (0, 520)]), P((226, 230, 242))); c.drawPath(poly([(40, 420), (64, 430), (18, 540), (0, 520)]), P((200, 208, 228))); c.restore()
    c.drawRRect(rr(-27, 366, 27, 440, 18), P(SKS))
    for sx in (-1, 1): c.drawOval(skia.Rect(sx * 66 - 13, 296, sx * 66 + 13, 340), P(SKS))
    face = skia.Path(); face.addRoundRect(skia.Rect(-66, 230, 66, 400), 60, 66); c.drawPath(face, P(SK)); c.save(); c.clipPath(face, skia.ClipOp.kIntersect, True); c.drawRect(skia.Rect(30, 220, 80, 410), P(SKS, 150))
    c.drawPath(poly([(-80, 300), (-70, 220), (70, 220), (80, 300), (60, 262), (20, 250), (-30, 262), (-62, 280)]), P(HR)); c.restore()
    hair = skia.Path(); hair.addArc(skia.Rect(-72, 214, 72, 330), 180, 180); c.drawPath(hair, SP(HR, 16))
    for sx in (-1, 1):
        c.drawOval(skia.Rect(sx * 27 - 9, 308, sx * 27 + 9, 322), P((250, 250, 246))); c.drawCircle(sx * 27 + 1, 315, 5.5, P((40, 28, 30))); c.drawLine(sx * 16, 294, sx * 40, 292, SP(HR, 5))
    c.drawLine(4, 322, 8, 346, SP(SKS, 4)); c.drawLine(-4, 350, 9, 350, SP(SKS, 4))
    mh = 5 + (9 * abs(math.sin(t * 9)) if talk else 0); c.drawRRect(rr(-15, 366, 15, 366 + mh, 4), P((110, 46, 56)))
    c.drawArc(skia.Rect(-84, 200, 84, 380), 190, 160, False, SP((50, 54, 72), 10)); c.drawRRect(rr(-98, 286, -70, 350, 12), P((50, 54, 72))); c.drawRRect(rr(70, 286, 98, 350, 12), P((36, 40, 56)))
    bm = skia.Path(); bm.moveTo(-84, 340); bm.quadTo(-80, 384, -34, 380); c.drawPath(bm, SP((50, 54, 72), 6)); c.drawCircle(-30, 380, 9, P((50, 54, 72)))


# ------------------------------------------------------------------------------------------------ end
JX, JG = 1330.0, 1265.0


def joan_strip(t, k, read=0.0, lookiv=0.0, up=0.0):
    """Joan stands beside the stretcher holding the rhythm strip in both hands, her fingers over the paper"""
    sx = kf(t, [(ww(k, 'reads') - 0.2, -0.9), (ww(k, 'reads') + 1.7, 0.9)])
    ps = CA.idle(t, 0.1, look=(lerp(lerp(-0.6, -0.9, lookiv), sx, read) * (1 - up) + -0.7 * up, lerp(lerp(0.3, -0.7, lookiv), 1.0, read) * (1 - up)), smile=0.05, yaw=lerp(lerp(-0.4, -0.75, lookiv), 0.0, read) * (1 - up) - 0.55 * up,
                 tilt=lerp(-2, 0, read), worry=0.1, brow=lerp(0.2, -0.7, read) * (1 - up) + 0.3 * up, lean=-1.0, sway=-3.0)
    ps.head_pitch = 0.9 * read * (1 - up); ps.lid = min(ps.lid, lerp(1.0, 0.72, read * (1 - up)))
    CA._cfg(ps, 'joan')
    ps.r_hand = CA.HOLD; ps.l_hand = CA.HOLD
    # elbows by her sides, forearms raised (partly toward the camera), a hand at each end of the strip at chest height:
    # the fingers go behind the paper and the thumbs lie in front of it
    ps.r_up, ps.r_fore, ps.r_wrist = 14, 116, 0; ps.l_up, ps.l_fore, ps.l_wrist = 14, 116, 0; ps.r_fz = 0.5; ps.l_fz = 0.5; ps.r_hang = -86; ps.l_hang = -86; ps.r_ts = 1; ps.l_ts = -1; ps.front = ('l', 'r')
    ps.sh_r = 1.5 * math.sin(t * 1.2)
    def paper(cc, *a):
        from art import tube
        a_ = PN.hand_pt(ps, 'r', 4, 0); b_ = PN.hand_pt(ps, 'l', 4, 0); cc.save()
        for key in ('l', 'r'): cc.clipPath(tube(PN.hand_pt(ps, key, 8, 16), PN.hand_pt(ps, key, 52, 56), 34, 26), skia.ClipOp.kDifference, True)
        cc.translate((a_[0] + b_[0]) / 2, (a_[1] + b_[1]) / 2); cc.rotate(math.degrees(math.atan2(b_[1] - a_[1], b_[0] - a_[0])))
        L = math.hypot(b_[0] - a_[0], b_[1] - a_[1]) / 2
        PL.strip(cc, -L, -48, 2 * L, 96, 0.2, back=True)
        cc.restore()
    ps.r_item_over = paper
    return ps


def _amb_scene(c, t, k, z, fx, fy, read, lookiv, up):
    c.save(); PL.camera(c, z, fx, fy)
    PL.ambulance(c, t)
    PL.monitor(c, 36, 316, t, 0.86)
    x, hy = 800.0, 800.0; s = SS('walt', 0.9); g = hy + 596 * s
    PL.cot(c, x, hy, 'back')
    hook_pt = (455, 150); c.drawLine(hook_pt[0], 118, hook_pt[0], 150, SP((170, 176, 188), 7))
    out = CA.iv_bag(c, hook_pt, 1.0, 0.03 * math.sin(t * 1.1), (t * 1.5) % 1.0)
    ws = sm((t - ww(k, 'reads') + 0.6) / 0.8)
    ps = CA.idle(t, 0.5, look=(lerp(0.8, 0.7, ws), -0.2), smile=0.02, yaw=lerp(0.3, 0.6, ws), tilt=3, worry=0.45, brow=0.2, lean=0.0, sway=0.0); ps.lid = min(ps.lid, 0.85); CA._cfg(ps, 'walt_cot')
    ps.r_hand = CA.SOFT; ps.r_up, ps.r_fore, ps.r_wrist = 13, 5, -4                   # the IV arm lies straight at his side on the blanket
    ps.l_hand = CA.SOFT; ps.l_up, ps.l_fore, ps.l_wrist = 15, 4, -4; ps.front = ('l', 'r')
    M = c.getTotalMatrix()
    def mid(cc):
        cc.save(); cc.setMatrix(M); PL.cot(cc, x, hy, 'front'); cc.restore()
    ps.mid = mid
    who(c, 'walt_cot', ps, x, g, 0.9, 'walt_cot')
    A = PN.arm_pts(ps, 'r'); el = CA._to_screen(ps, A['el'], x, g, s); wr = CA._to_screen(ps, A['wr'], x, g, s); site = (lerp(el[0], wr[0], 0.55), lerp(el[1], wr[1], 0.55))
    ln = skia.Path(); ln.moveTo(*out); ln.cubicTo(out[0] + 10, out[1] + 200, site[0] - 90, site[1] - 220, site[0] - 8, site[1] - 6)
    c.drawPath(ln, SP((236, 244, 250), 5)); c.drawPath(ln, SP((150, 200, 236), 2))
    c.save(); c.translate(*site); c.rotate(math.degrees(math.atan2(wr[1] - el[1], wr[0] - el[0])) - 90); c.drawRRect(rr(-26, -20, 26, 20, 5), P((250, 250, 246), 235)); c.drawRRect(rr(-8, -14, 8, 6, 3), P((120, 190, 230))); c.restore()
    T_ = ps._T; mon = (396, 548)                              # four electrodes on his chest, their leads gathered into the monitor's cable
    for i, (u_, v_, col) in enumerate(((-74, -18, (240, 240, 240)), (74, -18, (60, 60, 70)), (-66, -168, (214, 70, 60)), (66, -168, (80, 170, 100)))):
        e_ = CA._to_screen(ps, T_(u_, v_), x, g, s); ld = skia.Path(); ld.moveTo(*e_); ld.cubicTo(e_[0] - 30, e_[1] + 70 + 12 * i, 560, 640 - 10 * i, 470, 600); c.drawPath(ld, SP(col, 3.5))
        c.drawCircle(e_[0] + 2, e_[1] + 3, 15, P((60, 20, 30), 70)); c.drawCircle(e_[0], e_[1], 15, P((246, 246, 244))); c.drawCircle(e_[0], e_[1], 6, P((150, 156, 172)))
    cb = skia.Path(); cb.moveTo(470, 600); cb.quadTo(430, 590, mon[0] - 60, mon[1]); c.drawPath(cb, SP((60, 64, 84), 8))
    jp = joan_strip(t, k, read, lookiv, up); speak(jp, t, k, ww(k, 'warns') - 0.1, ww(k, 'coming') + 0.5, up)
    who(c, 'joan', jp, JX, JG, 0.93, 'joan_strip')
    c.restore()


def medallion(c, x, y, r, a, ring, bg, inner):
    if a <= 0.01: return
    c.drawCircle(x + 5, y + 9, r + 6, P((6, 8, 24), 130 * a, MaskFilter=blur(12)))
    c.save(); c.clipPath(skia.Path().addCircle(x, y, r), skia.ClipOp.kIntersect, True); c.saveLayerAlpha(None, int(255 * a)); c.drawPaint(P(bg)); inner(); c.restore(); c.restore()
    c.drawCircle(x, y, r, SP(ring, 7, 255 * a))


def portraits(c, t, k):
    """the four who cared for Walt in a row, already on screen at the cut; the Medical Director in a fifth medallion above them,
    drawn in on "Medical Director", with a thin line down to each of the four on the words stood behind"""
    c2 = cue(k, 2)
    PL.lgrad(c, (0, 0, W, H), (30, 44, 92), (16, 22, 56)); PL.rglow(c, 960, 420, 800, (120, 150, 230), 0.16)
    md = ua(t, ww(k, 'Medical') - 0.3, 0.5); PX_, PY_, PR_ = 960, 232, 150
    xs = [285 + 450 * i for i in range(4)]; ys = [690 - 16 * i for i in range(4)]; r = 178; lv = ua(t, ww(k, 'levels') - 0.5, 0.4)
    for i, lab in enumerate(('EMR', 'EMT', 'AEMT', 'Paramedic')): text(c, lab, xs[i], ys[i] + r + 70, 54, CREAM, ua(t, ww(k, 'levels') - 0.5 + 0.12 * i, 0.35), 'xb', 'center')
    for i in range(4):                                        # the lines are drawn first, so they end under the rings
        uu = ua(t, ww(k, 'stood') - 0.1 + 0.12 * i, 0.5) * md
        if uu > 0.01:
            dx, dy = xs[i] - PX_, ys[i] - PY_; L = math.hypot(dx, dy); a0 = (PX_ + dx / L * (PR_ + 8), PY_ + dy / L * (PR_ + 8)); a1 = (xs[i] - dx / L * (r + 8), ys[i] - dy / L * (r + 8))
            c.drawLine(a0[0], a0[1], lerp(a0[0], a1[0], uu), lerp(a0[1], a1[1], uu), SP(CREAM, 6, 230))
    for i, nm in enumerate(('ruiz', 'priya', 'marcus', 'joan')):
        a = 1.0 if i == 0 else ua(t, c2 + 0.1 + 0.26 * i, 0.35)
        def inner(i=i, nm=nm):
            ps = CA.idle(t, 0.2 * i, look=(0.0, 0.0), smile=0.3, yaw=0.12 * math.sin(t * 0.5 + i)); s = 1.5 * CA.LOOKS[nm]['hs']
            CA.draw(c, nm, ps, xs[i], ys[i] + 72 + 905 * s, s)
        medallion(c, xs[i], ys[i] + 20 * (1 - a), r, a, K_mix(MINT, AMBER, i / 3), ((176, 150, 110), (70, 110, 150), (96, 120, 160), (150, 90, 90))[i], inner)
    def doc():
        c.save(); c.translate(PX_, PY_ - 300 * 0.98 - 14); c.scale(0.98, 0.98); physician(c, t); c.restore()
    medallion(c, PX_, PY_ + 20 * (1 - md), PR_, md, CREAM, (60, 110, 120), doc)


def end(c, t):
    k = 'end'; t0, c1, c2, c3, c4 = cues(k, 4); tr = ww(k, 'she') - 0.5; ts = ww(k, 'The', 0, ww(k, 'step')) - 0.4
    if t < c2 - 0.05:
        if t < tr:                                            # 1a: the ambulance, a slow push
            u = (t - t0) / (tr - t0); iv = ua(t, ww(k, 'Marcus') - 0.2, 0.6) * (1 - ua(t, ww(k, 'her') + 0.3, 0.6))
            _amb_scene(c, t, k, lerp(1.0, 1.08, u), 960, 540, 0.0, iv, 0.0)
        else:                                                 # 1b: Joan reads the strip, then looks up and calls ahead
            u = (t - tr) / (c2 - tr); up = ua(t, ww(k, 'warns') - 0.4, 0.6)
            _amb_scene(c, t, k, lerp(1.62, 1.74, u), 1250, 560, 1.0, 0.0, up)
        finish(c, t, vig=0.16, warm=4); return
    if t < ts:                                                # 2a: four faces, four levels, and the physician behind them
        portraits(c, t, k); finish(c, t, vig=0.18, warm=0); return
    u = sm((t - ts) / 9.0)                                    # 2b to 4: Walt, well again, behind his counter; calm for the end screen
    c.save(); shot(c, lerp(0.95, 0.8, u), lerp(3050, 2960, u), lerp(-640, -850, u))
    PL.store_back(c, t)
    ps = walt_counter(t, 0.0, well=True, look=(-0.3, 0.0), yaw=-0.2, worry=0.0); ps.smile = 0.5
    draw_walt_counter(c, t, ps, tag='walt_well')
    PL.store_air(c, t); c.restore()
    finish(c, t)
    a = ua(t, c3 - 0.2, 0.4)
    if a > 0.01:
        opq(c, 520, 70, 1400, 330, a)
        hw(c, 'levlprep.com', 960, 174, 92, CREAM, t, c3, 1.1, 'center')
        text(c, 'Next: staying certified', 960, 290, 52, AMBER, ua(t, c4, 0.4), 'bold', 'center')


def _fin(f):
    def g(c, t):
        f(c, t); finish(c, t)
    return g


SCENES = dict(hook=_fin(hook), l6=_fin(l6), j4=_fin(j4), m3=_fin(m3), end=end)
