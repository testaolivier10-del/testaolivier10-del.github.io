"""w1108-01-penny-doubling (AP Precalculus, exponential growth). Premium standard, all code (skia). The sister and the
brother are each ONE skinned body (pipeline/people person.py via cast.py).

Art plan and motion list (for the accuracy check):
- A (hook, 0 to "On"): a bright kitchen counter on a sunny morning (window right, sun shaft with dust, pendant lamp
  swaying a little, a plant on the sill moving in a draft). On the counter: an open briefcase packed with cash bundles
  (left) and one copper penny spinning on its edge (right), slowing, wobbling and settling flat (a real spinning coin).
  The sister (rust sweater, ponytail) stands left facing right; the brother (teal) stands right facing left. On
  "grabs" her near hand goes to the briefcase's near edge and stays on it while she slides it toward herself (the case
  moves only while her hand pushes it). On "takes the penny" his hand reaches the penny, closes on it, and lifts it to
  chest height: the penny rides in his hand. A slow push in. Poll zone (y 560 to 900) holds only wall and window.
- B ("On day one" to "So how"): one continuous push from A into the glass jar by the brother. His hand holds the penny
  over the jar mouth and lets go: the penny falls (gravity) and lands at the bottom. Day chip DAY 1 1 cent. On "two" his
  hand comes in with one more cent and drops it (total 2), on "four" with two more (total 4): each day he adds as much
  as he has (day n pile = 2^(n-1) cents). Hard cut on "After two weeks" to a medium shot: the jar now holds coins and a
  few bills, chip DAY 14 $81.92; the sister pats her briefcase and smiles ("she's sure she won").
- C ("So how" to "By"): a round lens opens from the jar (both siblings stay around it, dimmed). Inside, on a navy
  chart: his pile as a gold block; on each beat an equal teal block (labelled the same again) slides in and settles on
  top, the two merge, and the view zooms out 2x so the new pile looks like the old one: every doubling looks the same
  (DAY 15, 16, 17, 18). The lens closes back to the jar.
- D ("By day twenty" to "That's"): zoom cut to a big warehouse with skylight shafts. Two single columns of $100 bills
  stacked to scale (a bill is 0.11 mm thick, so $1,000,000 = 10,000 bills = 1.1 m; 1 m = 167 px): the sister's
  million (182 px) and the brother's, which grows with the day counter: day 20 $5,242.88 (5.8 mm, a sliver), day 25
  $167,772.16 (18.5 cm), day 30 $5,368,709.12 (5.9 m, over 3 times his height). Day and dollar chips tick on the words.
  The camera pulls back and up as the tower rises; he looks up, she stares.
- E ("That's exponential growth" to the end): on the warehouse wall a graph of his pile against the day traces out:
  flat along the floor for weeks ("crawls"), then shooting up at the end ("takes off"), ending at the tower top.
Sources: day n holds 2^(n-1) cents (day 14 $81.92, day 20 $5,242.88, day 25 $167,772.16, day 30 $5,368,709.12);
each day's gain 2^(n-2) cents equals the pile the day before; a $100 bill is about 0.11 mm thick (US BEP: 0.0043 in);
AP Precalculus Unit 2 (2.1 geometric sequences, 2.2 to 2.3 exponential functions)."""
import sys, math
sys.path[:0] = ['/home/claude/w1108/01', '/home/claude/lp/w1104', '/home/claude/short']
import numpy as np, skia
import kit
from kit import P, SP, blur, smooth, lerp, mix, smooth_closed, lgrad, ease_io, Wt, Y, R, TL, W, H, OR
import airman2 as A2
import cast as CS

ID = 'w1108-01-penny-doubling'
WD = kit.Words(f'/home/claude/w1108/out/{ID}/words.json')
at = WD.at
T_SHE = at('she'); T_GRABS = at('grabs'); T_HER = at('her'); T_HE = at('he'); T_TAKES = at('takes'); T_PENNY2 = at('penny', 2)
T_ON = at('on'); T_ONE = at('one'); T_CENT = at('cent'); T_TWO = at('two'); T_FOUR = at('four')
T_AFTER = at('after'); T_EIGHTY = at('eighty'); T_SURE = at("she's"); T_SO = at('so')
T_EVERY = at('every', 2); T_GROWS = at('grows'); T_ALREADY = at('already')
T_BY = at('by', 2); T_TWENTY = at('twenty'); T_FIVE = at('five', 2); T_LATER = at('later'); T_ALMOST = at('almost'); T_THOUS2 = at('thousand', 2)
T_AND30 = at('and', 3); T_THIRTY2 = at('thirty', 2); T_WORTH = at('worth'); T_FIVEM = at('five', 3); T_MILLION3 = at('million', 3)
T_THATS = at("that's", 2); T_EXP = at('exponential'); T_CRAWLS = at('crawls'); T_THEN = at('then', 3); T_OFF = at('off')
T_END = WD.end() + 0.45
DUR = round(T_END + 1.6, 2)
T_B = T_ON - 0.3
T_B2 = T_AFTER - 0.12
T_C = T_SO - 0.25
T_D = T_BY - 0.3
T_E = T_THATS - 0.3
GRN = (120, 220, 150)

TITLES = [
    (0.0, [[('A PENNY', Y), (' DOUBLED', Wt)], [('EVERY DAY', Wt)]]),
    (at('or') - 0.1, [[('OR $1,000,000', GRN)], [('TODAY?', Wt)]]),
    (T_SHE - 0.1, [[('SHE TAKES', Wt)], [('THE MILLION', GRN)]]),
    (T_HER - 0.1, [[('HE TAKES', Wt)], [('THE PENNY', Y)]]),
    (T_B, [[('DAY 1:', Wt), (' 1 CENT', Y)]]),
    (T_TWO - 0.1, [[('DAY 2:', Wt), (' 2 CENTS', Y)]]),
    (T_FOUR - 0.1, [[('DAY 3:', Wt), (' 4 CENTS', Y)]]),
    (T_B2, [[('TWO WEEKS', Wt)], [('LATER', Y)]]),
    (T_C, [[('HOW DOES HE', Wt)], [('END UP RICHER?', Y)]]),
    (T_EVERY - 0.1, [[('EACH DAY IT', Wt)], [('DOUBLES', Y)]]),
    (T_E, [[('EXPONENTIAL', Y)], [('GROWTH', Wt)]]),
]

CAP_FIX = {'FIVE': 'five'}

# ------------------------------------------------------------------ palette (sunny kitchen)
WALL, WALL_SH = (238, 222, 196), (220, 200, 172)
WOOD, WOOD_SH, WOOD_HI = (168, 112, 72), (134, 86, 54), (196, 140, 96)
FRONT, FRONT_SH = (118, 78, 52), (96, 62, 42)
COPPER, COPPER_SH, COPPER_HI = (204, 118, 64), (162, 86, 44), (255, 196, 140)
CASH, CASH_SH, CASH_HI = (150, 190, 140), (112, 152, 106), (196, 226, 184)
BAND = (230, 206, 120)
CASE, CASE_SH = (60, 52, 50), (40, 34, 34)

COUNTER_Y = 1268          # front edge of the counter top
GROUND = 1760
SIS_X, BRO_X = 170, 950


def penny_spin(t):
    """spinning coin: fast spin that slows, wobbles and falls flat by about 1 s before the brother reaches for it.
    returns (width factor 0..1 of the face seen, tilt 0 standing .. 1 flat)"""
    T_FLAT = T_HE - 0.5
    if t >= T_FLAT: return 1.0, 1.0
    u = t / T_FLAT
    rate = lerp(9.0, 2.0, u)                      # turns per second
    ph = 2 * math.pi * (rate * t) + 1.1
    tilt = smooth((u - 0.7) / 0.3)
    return abs(math.cos(ph)), tilt


def draw_penny(c, x, y, s=1.0, wf=1.0, tilt=1.0, glint=0.0):
    """a copper cent: standing (thin ellipse rotating) when tilt 0, lying flat (wide flat ellipse) when tilt 1"""
    r = 17 * s
    if tilt < 1:      # standing on edge, spinning: the face seen as an ellipse whose width changes
        w = max(2.5 * s, r * wf)
        hgt = lerp(r, r * 0.42, tilt)
        cy = y - lerp(r, r * 0.42, tilt)
        c.drawOval(skia.Rect(x - w, cy - hgt, x + w, cy + hgt), P(COPPER))
        c.drawOval(skia.Rect(x - w * 0.82, cy - hgt * 0.82, x + w * 0.82, cy + hgt * 0.82), SP(COPPER_SH, 1.6 * s))
        if w > 6 * s:     # embossed bust on the face while it turns toward us
            c.drawOval(skia.Rect(x - w * 0.34, cy - hgt * 0.42, x + w * 0.26, cy + hgt * 0.3), P(mix(COPPER, COPPER_HI, 0.3)))
        c.drawOval(skia.Rect(x - w * 0.6, cy - hgt * 0.7, x + w * 0.2, cy + hgt * 0.1), P(COPPER_HI, 110))
        rp = skia.Path(); rp.addArc(skia.Rect(x - w, cy - hgt, x + w, cy + hgt), 200, 110)
        c.drawPath(rp, SP(COPPER_HI, 2.2 * s, 230))
        c.drawOval(skia.Rect(x - w, cy - hgt, x + w, cy + hgt), SP(COPPER_SH, 1.4 * s))
    else:
        c.drawOval(skia.Rect(x - r * 1.1, y - 4 * s, x + r * 1.1, y + 4 * s), P((80, 52, 34), 90, MaskFilter=blur(3)))
        c.drawOval(skia.Rect(x - r, y - r * 0.42 - 2 * s, x + r, y + r * 0.42 - 2 * s), P(COPPER_SH))
        c.drawOval(skia.Rect(x - r, y - r * 0.42 - 5 * s, x + r, y + r * 0.42 - 5 * s), P(COPPER))
        c.drawOval(skia.Rect(x - r * 0.62, y - r * 0.3 - 5 * s, x + r * 0.62, y + r * 0.3 - 5 * s), SP(COPPER_SH, 1.5 * s))
        c.drawOval(skia.Rect(x - r * 0.7, y - r * 0.36 - 5 * s, x - r * 0.1, y - 5 * s), P(COPPER_HI, 160))
        # embossed face: a raised profile bust and lettering ring, and a bright rim on the lit edge
        c.drawOval(skia.Rect(x - r * 0.3, y - r * 0.26 - 5 * s, x + r * 0.22, y + r * 0.2 - 5 * s), P(COPPER_SH))
        c.drawOval(skia.Rect(x - r * 0.26, y - r * 0.24 - 6 * s, x + r * 0.18, y + r * 0.14 - 6 * s), P(mix(COPPER, COPPER_HI, 0.35)))
        for k in range(10):
            a = math.pi * (1.05 + 0.9 * k / 9)
            c.drawCircle(x + r * 0.8 * math.cos(a), y - 5 * s + r * 0.34 * math.sin(a), 0.9 * s, P(COPPER_SH))
        rp = skia.Path(); rp.addArc(skia.Rect(x - r, y - r * 0.42 - 5 * s, x + r, y + r * 0.42 - 5 * s), 190, 120)
        c.drawPath(rp, SP(COPPER_HI, 1.8 * s, 230))
    if glint > 0:
        c.drawCircle(x - 6 * s, y - 14 * s, 26 * s, P((255, 240, 200), 120 * glint, MaskFilter=blur(10 * s), BlendMode=skia.BlendMode.kScreen))


def coin_flat(c, x, y, s=0.6, col=COPPER, sh=COPPER_SH):
    r = 17 * s
    c.drawOval(skia.Rect(x - r, y - r * 0.42, x + r, y + r * 0.42), P(sh))
    c.drawOval(skia.Rect(x - r, y - r * 0.42 - 3 * s, x + r, y + r * 0.42 - 3 * s), P(col))


# ------------------------------------------------------------------ the kitchen
def kitchen(c, t):
    lgrad(c, skia.Rect(-400, -400, 1500, 2400), 0, 1300, [(244, 230, 206), WALL])
    # tiled backsplash band above the counter
    c.drawRect(skia.Rect(-400, 1040, 1500, COUNTER_Y - 20), P((226, 214, 196)))
    for k in range(-6, 28):
        x = k * 64
        c.drawLine(x, 1040, x, COUNTER_Y - 20, SP((206, 192, 172), 2))
    for y in (1104, 1168, 1232):
        c.drawLine(-400, y, 1500, y, SP((206, 192, 172), 2))
    # window (upper right) with morning sky, trees far off, frame and sill with a plant
    wx0, wy0, wx1, wy1 = 600, 360, 1010, 900
    lgrad(c, skia.Rect(wx0, wy0, wx1, wy1), wy0, wy1, [(150, 200, 236), (230, 236, 226)])
    c.save(); c.clipRect(skia.Rect(wx0, wy0, wx1, wy1))
    for k in range(3):
        x = wx0 - 100 + ((k * 210 + 8 * t) % 620)
        c.drawOval(skia.Rect(x, 420 + k * 70, x + 200, 450 + k * 70), P((255, 255, 255), 170, MaskFilter=blur(8)))
    for k in range(7):
        x = wx0 + k * 70 + 10 * math.sin(t * 0.8 + k)
        c.drawOval(skia.Rect(x - 50, 760 - 30 * (k % 3), x + 60, 900), P((120, 168, 120)))
        c.drawOval(skia.Rect(x - 30, 740 - 30 * (k % 3), x + 40, 830), P((146, 190, 134)))
    c.drawCircle(940, 430, 50, P((255, 248, 220), 230, MaskFilter=blur(12)))
    c.restore()
    for r in ((wx0 - 18, wy0 - 18, wx1 + 18, wy0), (wx0 - 18, wy1, wx1 + 18, wy1 + 18), (wx0 - 18, wy0, wx0, wy1), (wx1, wy0, wx1 + 18, wy1),
              ((wx0 + wx1) / 2 - 8, wy0, (wx0 + wx1) / 2 + 8, wy1)):
        c.drawRect(skia.Rect(*r), P((250, 246, 238)))
    c.drawRect(skia.Rect(wx0 - 40, wy1 + 18, wx1 + 40, wy1 + 40), P((236, 226, 210)))
    # plant on the sill, leaves moving a little in a draft
    c.drawPath(smooth_closed([(900, 918), (940, 918), (934, 860), (906, 860)]), P((196, 110, 76)))
    for k in range(6):
        a = math.radians(-150 + k * 24) + 0.06 * math.sin(t * 1.6 + k)
        L = 70 + 18 * (k % 2)
        tip = (920 + L * math.cos(a), 862 + L * math.sin(a))
        c.drawPath(smooth_closed([(920, 862), (920 + L * 0.5 * math.cos(a - 0.3), 862 + L * 0.5 * math.sin(a - 0.3)), tip,
                                  (920 + L * 0.5 * math.cos(a + 0.3), 862 + L * 0.5 * math.sin(a + 0.3))]), P((92, 150, 96) if k % 2 else (110, 170, 106)))
    # sun shaft from the window down across the room, dust drifting in it
    sh = skia.Path(); sh.moveTo(wx0, wy0); sh.lineTo(wx1, wy0); sh.lineTo(560, 1500); sh.lineTo(80, 1500); sh.close()
    c.drawPath(sh, P((255, 236, 190), 46, MaskFilter=blur(30), BlendMode=skia.BlendMode.kScreen))
    rs = np.random.default_rng(5)
    for k in range(26):
        x0, y0 = rs.uniform(150, 900), rs.uniform(500, 1250)
        x = x0 + 14 * math.sin(t * 0.4 + k); y = y0 - (t * 6 + k * 13) % 80
        c.drawCircle(x, y, rs.uniform(1.5, 3), P((255, 248, 220), 120))
    # pendant lamp, swaying a little
    sw = 0.025 * math.sin(t * 0.9)
    c.save(); c.translate(330, -40); c.rotate(math.degrees(sw))
    c.drawLine(0, 0, 0, 470, SP((60, 54, 50), 3))
    shade = skia.Path(); shade.moveTo(-70, 560); shade.lineTo(-30, 470); shade.lineTo(30, 470); shade.lineTo(70, 560); shade.close()
    c.drawPath(shade, P((52, 92, 96))); c.drawRect(skia.Rect(-70, 556, 70, 566), P((40, 72, 76)))
    c.drawOval(skia.Rect(-26, 556, 26, 576), P((255, 240, 196)))
    c.restore()


def counter_top(c):
    top = skia.Path(); top.moveTo(-400, COUNTER_Y - 30); top.lineTo(1500, COUNTER_Y - 30); top.lineTo(1500, COUNTER_Y); top.lineTo(-400, COUNTER_Y); top.close()
    c.drawPath(top, P(WOOD))
    c.drawRect(skia.Rect(-400, COUNTER_Y - 30, 1500, COUNTER_Y - 25), P(WOOD_HI))
    for k in range(9):
        y = COUNTER_Y - 26 + k * 3.2
        c.drawLine(-400, y, 1500, y + 1.2 * math.sin(k), SP(WOOD_SH, 1, 70))


def counter_front(c):
    c.drawRect(skia.Rect(-400, COUNTER_Y, 1500, COUNTER_Y + 26), P(WOOD_SH))
    c.drawRect(skia.Rect(-400, COUNTER_Y + 26, 1500, 2400), P(FRONT))
    for k in range(-2, 7):
        x = k * 230 + 20
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x, COUNTER_Y + 60, x + 200, COUNTER_Y + 300), 10, 10), P(FRONT_SH))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x + 70, COUNTER_Y + 90, x + 130, COUNTER_Y + 102), 6, 6), P((200, 180, 150)))
    c.drawRect(skia.Rect(-400, COUNTER_Y + 26, 1500, COUNTER_Y + 40), P((0, 0, 0), 40))


def bundle(c, x, y, w, h, a=255):
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x, y, x + w, y + h), 3, 3), P(CASH, a))
    c.drawRect(skia.Rect(x, y + h - 4, x + w, y + h), P(CASH_SH, a))
    c.drawRect(skia.Rect(x + w * 0.42, y, x + w * 0.58, y + h), P(BAND, a))
    c.drawRect(skia.Rect(x + 3, y + 2, x + w * 0.38, y + 5), P(CASH_HI, a))


def briefcase(c, x, y):
    """open briefcase seen from the front at counter height; (x, y) = bottom centre; lid up behind, cash inside"""
    lid = skia.Path(); lid.addRRect(skia.RRect.MakeRectXY(skia.Rect(x - 130, y - 190, x + 130, y - 70), 12, 12))
    c.drawPath(lid, P(CASE)); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - 118, y - 178, x + 118, y - 82), 8, 8), P((90, 40, 44)))
    for r in range(7):            # packed: a million in $100 bundles fills the case and heaps above the rim
        n = 5
        for k in range(n):
            bundle(c, x - 118 + k * 47 + (r % 2) * 6, y - 76 - r * 13, 44, 15)
    for k, (dx, dy, ang) in enumerate([(-70, -176, -8), (-8, -182, 5), (56, -174, -4)]):
        c.save(); c.translate(x + dx, y + dy); c.rotate(ang); bundle(c, -24, -8, 48, 16); c.restore()
    body = skia.Path(); body.addRRect(skia.RRect.MakeRectXY(skia.Rect(x - 136, y - 64, x + 136, y), 10, 10))
    c.drawPath(body, P(CASE)); c.drawRect(skia.Rect(x - 136, y - 18, x + 136, y - 6), P(CASE_SH))
    c.drawRect(skia.Rect(x - 136, y - 64, x + 136, y - 58), P((96, 86, 82)))
    for bx in (x - 80, x + 80): c.drawRect(skia.Rect(bx - 12, y - 52, bx + 12, y - 40), P((210, 180, 110)))
    c.drawOval(skia.Rect(x - 150, y - 6, x + 150, y + 8), P((40, 24, 14), 60, MaskFilter=blur(5)))


def jar(c, x, y, fill, s=1.0, front=True):
    """glass jar standing on the counter at (x, y bottom). fill: list of (kind, dx, dy) contents in jar coords"""
    w, h = 64 * s, 120 * s
    body = skia.Path(); body.addRRect(skia.RRect.MakeRectXY(skia.Rect(x - w, y - h, x + w, y), 16 * s, 16 * s))
    if not front:
        c.drawPath(body, P((214, 232, 236), 70))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w - 4 * s, y - h - 14 * s, x + w + 4 * s, y - h + 4 * s), 6 * s, 6 * s), P((190, 210, 214), 120))
        return
    c.drawPath(body, SP((236, 246, 250), 3.5 * s, 210))
    c.drawRect(skia.Rect(x - w + 10 * s, y - h + 14 * s, x - w + 20 * s, y - 14 * s), P((255, 255, 255), 90))
    c.drawOval(skia.Rect(x - w, y - h - 8 * s, x + w, y - h + 8 * s), SP((236, 246, 250), 3 * s, 200))


SIS_BASE = dict(face=1, ground=GROUND, lean=4, hand_n='flat', hand_f='relaxed', uarm_f=-6, elbow_f=20)
BRO_BASE = dict(face=-1, ground=GROUND, lean=4, hand_n='grip', hand_f='relaxed', uarm_f=-6, elbow_f=20)
CASE_Y = COUNTER_Y - 14
JAR_X = 800
PENNY_X0 = 620


def case_x(t):
    return lerp(470, 400, smooth((t - T_GRABS - 0.2) / 0.6))


def sis_pose(t, smile=0.4):
    br = math.sin(t * 2.2) * 0.5
    reach_in = smooth((t - T_GRABS + 0.35) / 0.5)
    rest = dict(SIS_BASE, x=SIS_X, uarm_n=-6, elbow_n=22, br=br, smile=smile, blink=(t % 3.7) < 0.12)
    if reach_in <= 0: return rest
    cx = case_x(t)
    tgt = (cx - 150 + 10, CASE_Y - 40)                 # her hand on the case's near (left) end
    kw = CS.reach(CS.SIS, dict(rest), 'n', tgt, key=('case', round(tgt[0] / 2)))
    if reach_in < 1:
        kw['uarm_n'] = lerp(-6, kw['uarm_n'], reach_in); kw['elbow_n'] = lerp(22, kw['elbow_n'], reach_in)
    return kw


def bro_take(t):
    """0 before reaching, 1 hand on the penny, then lift"""
    return smooth((t - T_TAKES + 0.15) / 0.45), smooth((t - T_PENNY2 - 0.1) / 0.6)


def held_penny_pt(t):
    """where the penny sits while he lifts it: on the counter, then at his chest height"""
    _, lift = bro_take(t)
    return (lerp(PENNY_X0, 760, lift), lerp(COUNTER_Y - 18, 1150, lift))


def bro_pose(t, look=0.0):
    br = math.sin(t * 2.0 + 1) * 0.5
    rest = dict(BRO_BASE, x=BRO_X, uarm_n=-6, elbow_n=22, br=br, blink=((t + 1.3) % 4.1) < 0.12, look=look)
    reach_in, lift = bro_take(t)
    if reach_in <= 0: return rest
    px, py = held_penny_pt(t)
    kw = CS.reach(CS.BRO, dict(rest), 'n', (px + 4, py - 10), key=('penny', round(px / 3), round(py / 3)))
    if reach_in < 1:
        kw['uarm_n'] = lerp(-6, kw['uarm_n'], reach_in); kw['elbow_n'] = lerp(22, kw['elbow_n'], reach_in)
    return kw


def cam_a(t):
    """hook camera: close on the spinning penny, a pan to the briefcase on "million", then wide on "She grabs",
    then a slow push. returns (zoom, world x, world y, screen y the world point sits at)"""
    T1 = at('million') - 0.35; T2 = T_SHE - 0.35
    k0 = (2.5, 548, COUNTER_Y - 58, 1250)          # the briefcase and the penny together, centred, filling the frame
    k1 = (2.3, 505, COUNTER_Y - 90, 1200)
    k2 = (1.04, 540, 1150, 1080)
    k3 = (1.12, 560, 1150, 1080)
    def L4(a, b, u): return tuple(lerp(x, y, u) for x, y in zip(a, b))
    k0b = (2.9, 580, COUNTER_Y - 50, 1250)
    if t < T1: return L4(k0, k0b, ease_io(t / T1))
    if t < T1 + 0.5: return L4(k0b, k1, ease_io((t - T1) / 0.5))
    if t < T2: return k1
    if t < T2 + 0.55: return L4(k1, k2, ease_io((t - T2) / 0.55))
    return L4(k2, k3, ease_io((t - T2 - 0.55) / (T_B - T2 - 0.55)))


def hand_front(c, who, ps, r=58, side='n'):
    """redraw a person clipped to a circle around one hand, so the hand sits in front of the counter and the props
    it touches (the person stands behind the counter; the hand rests on or grips what is on it)"""
    hx, hy = CS.hand_center(who, ps, side)
    c.save(); p = skia.Path(); p.addCircle(hx, hy, r); c.clipPath(p, doAntiAlias=True)
    who.draw(c, ps, shadow=False); c.restore()


def scene_a(c, t, cam=None):
    """the kitchen counter; cam = (zoom, target x, target y) in kitchen coords"""
    z, tx, ty, ay = cam if cam else cam_a(t)
    c.save(); c.translate(540, ay); c.scale(z, z); c.translate(-tx, -ty)
    kitchen(c, t)
    jar(c, JAR_X, CASE_Y, None, front=False)
    jar_contents(c, t)
    sp = A2.Pose(**sis_pose(t)); bp = A2.Pose(**bro_pose(t))
    CS.SIS.draw(c, sp); CS.BRO.draw(c, bp)
    counter_top(c)
    briefcase(c, case_x(t), CASE_Y)
    jar(c, JAR_X, CASE_Y, None)
    # the penny: spinning on the counter, then in his hand
    reach_in, lift = bro_take(t)
    if lift <= 0:
        wf, tilt = penny_spin(t)
        draw_penny(c, PENNY_X0, COUNTER_Y - 14, 1.5, wf, tilt, glint=0.6 * (1 - tilt) * (0.5 + 0.5 * math.sin(t * 20)))
    if t > T_GRABS - 0.4: hand_front(c, CS.SIS, sp)
    if reach_in > 0:
        if lift > 0:
            hx, hy = CS.hand_center(CS.BRO, bp)
            draw_penny(c, hx + 2, hy + 24, 1.5, 1.0, 1.0)
        hand_front(c, CS.BRO, bp)
    counter_front(c)
    c.restore()


# ------------------------------------------------------------------ B: the jar (day 1, 2, 3)
def jar_drops():
    """(time released, landing slot) for each cent he drops: day 1 one cent, day 2 one more, day 3 two more"""
    return [(T_ONE + 0.25, 0), (T_TWO + 0.05, 1), (T_FOUR + 0.0, 2), (T_FOUR + 0.12, 3)]


SLOTS = [(2, 0), (16, -4), (-12, -8), (8, -13)]


def fall_y(dt, y0, y1):
    y = y0 + 0.5 * 2600 * dt * dt
    return min(y, y1)


def hand_coins(c, t):
    """coins in flight (dropped from his hand into the jar), drawn over the jar front"""
    if not (T_B - 0.4 < t < T_B2): return
    for t0, k in jar_drops():
        if t < t0 or t - t0 > 0.45: continue
        y = fall_y(t - t0, CASE_Y - 162, CASE_Y - 12 + SLOTS[k][1])
        x = JAR_X + SLOTS[k][0]
        if y < CASE_Y - 12 + SLOTS[k][1]:
            draw_penny(c, x, y, 1.5, wf=0.9, tilt=1.0)


def jar_contents(c, t):
    if t < T_B2:
        for t0, k in jar_drops():
            if t - t0 >= 0.45 or (t >= t0 and fall_y(t - t0, CASE_Y - 162, CASE_Y - 12 + SLOTS[k][1]) >= CASE_Y - 12 + SLOTS[k][1]):
                coin_flat(c, JAR_X + SLOTS[k][0], CASE_Y - 12 + SLOTS[k][1], 1.5)
    else:      # two weeks later: coins and a few small bills ($81.92)
        rs = np.random.default_rng(4)
        for k in range(26):
            coin_flat(c, JAR_X + rs.uniform(-46, 46), CASE_Y - 12 - rs.uniform(0, 26) - (k // 9) * 6, 0.7,
                      col=COPPER if k % 3 else (200, 200, 206), sh=COPPER_SH if k % 3 else (160, 160, 168))
        for k, (dx, dy, ang) in enumerate([(-20, -50, -18), (14, -60, 12), (-4, -72, 4), (22, -44, 30)]):
            c.save(); c.translate(JAR_X + dx, CASE_Y + dy); c.rotate(ang)
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-38, -15, 38, 15), 3, 3), P(CASH)); c.drawRect(skia.Rect(-12, -10, 12, 10), P(CASH_SH))
            c.restore()


def hand_path(t):
    """his near hand through the jar beat: (target point, coins held). From the penny he lifted in A, to a hover point
    right above the jar mouth; each cent is released there and falls straight down; between drops the hand goes out
    of frame to the right for the next coins and comes back (never snapping to rest)."""
    P0 = (764, 1140)                               # where the lifted penny was at the end of A
    Hv = (JAR_X + 6, CASE_Y - 186)                 # just above the jar mouth (rim at CASE_Y - 120)
    O = (BRO_X - 30, CASE_Y + 70)                  # down below the counter edge, to his pocket for the next coins
    Rr = (BRO_X - 30, CASE_Y + 90)                 # lowered, resting below the counter
    r1, r2, r3 = [d[0] for d in jar_drops()][:3]
    W = (JAR_X + 150, CASE_Y - 196)                # beside the jar, above the rim: the hand never crosses the glass
    keys = [(T_B - 0.4, P0, 1), (T_B + 0.5, Hv, 1), (r1, Hv, 0), (r1 + 0.15, Hv, 0), (r1 + 0.35, W, 0), (r1 + 0.7, O, 0),
            (r2 - 0.75, O, 1), (r2 - 0.42, W, 1), (r2 - 0.15, Hv, 1), (r2, Hv, 0), (r2 + 0.12, Hv, 0), (r2 + 0.3, W, 0),
            (r2 + 0.55, O, 0), (r3 - 0.62, O, 2), (r3 - 0.36, W, 2), (r3 - 0.12, Hv, 2), (r3, Hv, 1), (r3 + 0.12, Hv, 0),
            (r3 + 0.3, Hv, 0), (r3 + 0.5, W, 0), (r3 + 0.9, O, 0), (r3 + 1.3, Rr, 0), (99, Rr, 0)]
    if t <= keys[0][0]: return P0, 1
    for (ta, pa, ha), (tb, pb, hb) in zip(keys, keys[1:]):
        if ta <= t < tb:
            u = ease_io((t - ta) / (tb - ta))
            return (lerp(pa[0], pb[0], u), lerp(pa[1], pb[1], u)), ha
    return Rr, 0


def bro_drop_pose(t):
    rest = dict(BRO_BASE, x=BRO_X, uarm_n=-6, elbow_n=22, br=math.sin(t * 2.0 + 1) * 0.5, blink=((t + 1.3) % 4.1) < 0.12)
    (px, py), held = hand_path(t)
    kw = CS.reach(CS.BRO, dict(rest), 'n', (px, py), key=('jp', round(px / 3), round(py / 3)))
    return kw, held


def scene_b(c, t):
    """continuous push from the counter into the jar; the brother drops the day's cents"""
    u = ease_io((t - T_B) / 1.0)
    z = lerp(1.12, 2.0, u); tx = lerp(560, JAR_X - 20, u); ty = lerp(1150, COUNTER_Y - 70, u); ay = lerp(1080, 1080, u)
    z += 0.04 * ease_io((t - T_B - 1.0) / (T_B2 - T_B - 1.0))
    c.save(); c.translate(540, ay); c.scale(z, z); c.translate(-tx, -ty)
    kitchen(c, t)
    jar(c, JAR_X, CASE_Y, None, front=False)
    jar_contents(c, t)
    CS.SIS.draw(c, A2.Pose(**sis_pose(t)))
    kw, holding = bro_drop_pose(t)
    bp = A2.Pose(**kw)
    CS.BRO.draw(c, bp)
    counter_top(c)
    briefcase(c, case_x(t), CASE_Y)
    jar(c, JAR_X, CASE_Y, None)
    hand_coins(c, t)
    hx, hy = CS.hand_center(CS.BRO, bp)
    if hy < COUNTER_Y - 30:      # the hand above the counter: coins pinched in his fingers, fingers drawn over them
        for k in range(int(holding)): draw_penny(c, hx + 2 + 8 * k, hy + 24 + 3 * k, 1.5, wf=0.9, tilt=1.0)
        hand_front(c, CS.BRO, bp)
    counter_front(c)
    c.restore()


def scene_b2(c, t):
    """two weeks later: medium shot; the sister pats her briefcase, sure she won"""
    u = ease_io((t - T_B2) / (T_C - T_B2))
    z, tx, ty, ay = (lerp(1.14, 1.2, u), 540, 1170, 1080)
    c.save(); c.translate(540, ay); c.scale(z, z); c.translate(-tx, -ty)
    kitchen(c, t)
    jar(c, JAR_X, CASE_Y, None, front=False)
    jar_contents(c, t)
    sm = lerp(0.4, 1.0, smooth((t - T_SURE + 0.2) / 0.4))
    pat = 0.5 + 0.5 * math.sin((t - T_SURE) * 7) if T_SURE - 0.1 < t < T_SURE + 1.4 else 0.0
    rest = dict(SIS_BASE, x=SIS_X, br=math.sin(t * 2.2) * 0.5, smile=sm, blink=(t % 3.7) < 0.12)
    tgt = (case_x(t) - 70, CASE_Y - 70 - 16 * pat)    # her hand pats the lid's top edge
    kw = CS.reach(CS.SIS, dict(rest), 'n', tgt, key=('pat', round(pat * 6)))
    sp = A2.Pose(**kw)
    CS.SIS.draw(c, sp)
    CS.BRO.draw(c, A2.Pose(**dict(BRO_BASE, x=BRO_X, uarm_n=-6, elbow_n=22, br=math.sin(t * 2 + 1) * 0.5, blink=((t + 1.3) % 4.1) < 0.12)))
    counter_top(c)
    briefcase(c, case_x(t), CASE_Y)
    jar(c, JAR_X, CASE_Y, None)
    hand_front(c, CS.SIS, sp)
    counter_front(c)
    c.restore()
    a = smooth((t - T_EIGHTY + 0.1) / 0.3)
    kit.L.chip(c, 'DAY 14: $81.92', 540, 1290, Y, size=56, a=a)


# ------------------------------------------------------------------ C: every doubling looks the same (lens)
def coin_block(c, x, y, w, h, col=None, sh=None, hi=None, a=255, mark=None):
    """one share of his pile as real money: stacks of copper and silver coins and a short pile of folded bills.
    (x, y) = bottom centre; mark = an outline colour for "the same again" shares"""
    n = 4; cw = w / n
    rs = np.random.default_rng(int(x * 7 + y * 3) % 997)
    for k in range(n):
        cx = x - w / 2 + cw * (k + 0.5)
        silver = k % 2 == 1
        base, side, top = ((200, 200, 208), (150, 150, 160), (236, 236, 242)) if silver else (COPPER, COPPER_SH, COPPER_HI)
        hh = h * (0.72 + 0.28 * rs.random())
        c.drawRect(skia.Rect(cx - cw * 0.42, y - hh, cx + cw * 0.42, y), P(side, a))
        nn = max(3, int(hh / 7))
        for j in range(nn):
            yy = y - hh * j / nn
            c.drawLine(cx - cw * 0.42, yy, cx + cw * 0.42, yy, SP(mix(side, (0, 0, 0), 0.2), 1.6, a))
        c.drawRect(skia.Rect(cx - cw * 0.42, y - hh, cx - cw * 0.28, y), P(mix(base, (255, 255, 255), 0.25), a))
        c.drawOval(skia.Rect(cx - cw * 0.42, y - hh - cw * 0.14, cx + cw * 0.42, y - hh + cw * 0.14), P(base, a))
        c.drawOval(skia.Rect(cx - cw * 0.28, y - hh - cw * 0.08, cx + cw * 0.28, y - hh + cw * 0.08), SP(side, 1.4, a))
    if mark is not None:
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2 - 4, y - h - 14, x + w / 2 + 4, y + 4), 10, 10), SP(mark, 4, a))


def doubling_scene(c, t):
    """fixed scale (no zoom): his pile on day 14 is one block; each day an equal amount (teal, the same again) slides
    in, so day 15 = 2 blocks, day 16 = 4 blocks, day 17 = 8 blocks. The pile visibly grows and every jump equals the
    whole pile before it."""
    lgrad(c, skia.Rect(0, 0, W, H), 300, 1600, [(58, 40, 34), (92, 64, 48)])     # warm, the counter's wood seen close
    for k in range(-2, 22):
        x = k * 60 + (t * 6) % 60
        c.drawLine(x, 0, x, H, SP((255, 220, 170), 1.5, 22))
    for k in range(0, 34):
        c.drawLine(0, k * 60, W, k * 60, SP((255, 220, 170), 1.5, 22))
    beats = [T_EVERY - 0.1, T_GROWS - 0.05, T_ALREADY - 0.05]
    bw, bh = 230, 112; base_y = 1190; cx = 600
    slots = [(0, 0), (0, 1), (1, 0), (1, 1), (0, 2), (1, 2), (0, 3), (1, 3)]     # (col, row): grows 1 -> 2 -> 4 -> 8
    def pos(i):
        col, row = slots[i]; return cx - bw + col * bw + bw / 2, base_y - row * bh
    have = 1; adding = None
    for i, b in enumerate(beats):
        if t >= b + 0.7: have *= 2
        elif t >= b: adding = (have, (t - b) / 0.7)
    n_static = have
    c.drawLine(cx - 340, base_y + 2, cx + 340, base_y + 2, SP((255, 230, 190), 3, 120))
    for i in range(n_static):
        x, y = pos(i)
        old = adding is None and i >= n_static // 2 and n_static > 1 and False
        coin_block(c, x, y, bw - 8, bh - 6)
    if adding is not None:
        n0, u = adding
        for i in range(n0, 2 * n0):
            x, y = pos(i)
            k = smooth((u - 0.08 * (i - n0)) / 0.7)
            coin_block(c, lerp(x + 700, x, k), y, bw - 8, bh - 6, mark=(90, 214, 196))
        kit.L.chip(c, '+ the same again', cx, base_y - 4 * bh - 70, TL, size=46, a=smooth(u / 0.15) * (1 - smooth((u - 0.85) / 0.15)))
    day = 14 + sum(1 for b in beats if t >= b + 0.35)
    a0 = smooth((t - T_C - 0.65) / 0.3)          # labels come in once the lens is open
    kit.L.chip(c, f'DAY {day}', cx, base_y + 90, Y, size=60, a=a0)
    kit.L.chip(c, 'his pile', cx - 360, base_y - 50, Wt, size=44, anchor=(cx - bw - 4, base_y - 50), a=a0)


def scene_c(c, t):
    open_ = smooth((t - T_C) / 0.6)
    cam = (1.2, 540, 1170, 1080)
    scene_b2_still(c, t, cam)
    c.drawRect(skia.Rect(0, 0, W, H), P((8, 12, 24), 150 * open_))
    if open_ <= 0: return
    jx, jy = 540 + 1.2 * (JAR_X - 540), 1080 + 1.2 * (CASE_Y - 60 - 1170)
    cx, cy = lerp(jx, 540, open_), lerp(jy, 900, open_)
    r = 600 * open_
    path = skia.Path(); path.addCircle(cx, cy, r)
    c.save(); c.clipPath(path, doAntiAlias=True)
    c.translate(cx, cy); s = 0.6 + 0.4 * open_; c.scale(s, s); c.translate(-540, -900)
    doubling_scene(c, t)
    c.restore()
    c.drawCircle(cx, cy, r, SP((255, 210, 120), 6, 230))


def scene_b2_still(c, t, cam):
    z, tx, ty, ay = cam
    c.save(); c.translate(540, ay); c.scale(z, z); c.translate(-tx, -ty)
    kitchen(c, t)
    jar(c, JAR_X, CASE_Y, None, front=False)
    jar_contents(c, T_B2 + 1)
    CS.SIS.draw(c, A2.Pose(**dict(SIS_BASE, x=SIS_X, uarm_n=-6, elbow_n=22, br=math.sin(t * 2.2) * 0.5, smile=0.9, blink=(t % 3.7) < 0.12)))
    CS.BRO.draw(c, A2.Pose(**dict(BRO_BASE, x=BRO_X, uarm_n=-6, elbow_n=22, br=math.sin(t * 2 + 1) * 0.5, look=-0.6, blink=((t + 1.3) % 4.1) < 0.12)))
    counter_top(c)
    briefcase(c, case_x(t), CASE_Y)
    jar(c, JAR_X, CASE_Y, None)
    counter_front(c)
    c.restore()


# ------------------------------------------------------------------ D and E: the warehouse, stacks to scale
PX_PER_M = 167.0
BILL_MM = 0.11


def day_at(t):
    """the day the stack shows at time t (continuous, eased between the spoken days)"""
    keys = [(T_D, 20.0), (T_TWENTY, 20.0), (T_FIVE, 20.0), (T_THOUS2 - 0.2, 25.0), (T_AND30, 25.0), (T_THIRTY2 + 0.3, 30.0), (99, 30.0)]
    for (a, da), (b, db) in zip(keys, keys[1:]):
        if a <= t < b: return lerp(da, db, ease_io((t - a) / max(0.01, b - a)))
    return keys[0][1]


def dollars(day):
    return 0.01 * 2 ** (day - 1)


def stack_px(d):
    return d / 100 * BILL_MM / 1000 * PX_PER_M


def bill_column(c, x, floor, hpx, w=30, a=255):
    """a single column of $100 bills seen from the side: green edge, a lighter band every 100 bills"""
    if hpx < 0.6:
        c.drawRect(skia.Rect(x - w / 2, floor - 1.2, x + w / 2, floor), P(CASH, a)); return
    c.drawRect(skia.Rect(x - w / 2, floor - hpx, x + w / 2, floor), P(CASH, a))
    c.drawRect(skia.Rect(x + w / 2 - 7, floor - hpx, x + w / 2, floor), P(CASH_SH, a))
    step = 100 * BILL_MM / 1000 * PX_PER_M          # one strap of 100 bills = 1.84 px
    if hpx > 40:
        k = 0; y = floor
        while y > floor - hpx and k < 900:
            if k % 5 == 0: c.drawLine(x - w / 2, y, x + w / 2 - 7, y, SP(BAND, 1.4, 160))
            y -= step * 5; k += 5
    c.drawRect(skia.Rect(x - w / 2, floor - hpx, x - w / 2 + 5, floor), P(CASH_HI, 150))


def warehouse(c, t, z):
    """a warm warehouse at golden hour: brick toned walls, high windows, warm shafts and dust"""
    lgrad(c, skia.Rect(-3000, -4000, 4000, 400), -2600, 0, [(96, 70, 58), (164, 124, 96)])
    for k in range(-12, 14):
        x = k * 220
        c.drawRect(skia.Rect(x, -2600, x + 8, 0), P((120, 88, 70)))
    for k in range(-3, 4):
        x = k * 440 + 100
        sh = skia.Path(); sh.moveTo(x - 20, -1420); sh.lineTo(x + 130, -1420); sh.lineTo(x + 520, 0); sh.lineTo(x + 300, 0); sh.close()
        c.drawPath(sh, P((255, 206, 140), 60, MaskFilter=blur(26), BlendMode=skia.BlendMode.kScreen))
        c.drawOval(skia.Rect(x + 260, -10, x + 560, 60), P((255, 210, 150), 50, MaskFilter=blur(20), BlendMode=skia.BlendMode.kScreen))
    rs = np.random.default_rng(9)
    for k in range(40):
        x0, y0 = rs.uniform(-900, 1100), rs.uniform(-1200, 0)
        c.drawCircle(x0 + 20 * math.sin(t * 0.3 + k), y0 - (t * 10 + k * 17) % 120, rs.uniform(2, 3.5), P((255, 236, 196), 100))
    lgrad(c, skia.Rect(-3000, 0, 4000, 1600), 0, 600, [(178, 144, 112), (138, 108, 84)])
    for k in range(-14, 16):
        c.drawLine(k * 200, 0, k * 200 * 1.6, 1600, SP((160, 126, 98), 2, 120))
    c.drawLine(-3000, 0, 4000, 0, SP((110, 82, 64), 3))


SIS_W = CS.SIS_S; BRO_W = CS.BRO_S
SIS_WX, BRO_WX = -240, 170
MIL_X, HIS_X = -120, 50
HIS_COL = (96, 200, 186)      # his column gets a teal edge so it reads as his


GX0, GX1, GY0, GY1 = -560, -70, -430, -990      # graph panel on the back wall, left of the tower, above the heads


def graph_on_wall(c, t, z):
    """his pile against the day on a panel on the back wall: flat for weeks, then shooting up. The curve ends at the
    panel's top right (day 30) and a dotted line runs from there to the tower top, which is the same amount."""
    g = smooth((t - T_EXP + 0.2) / 0.5)
    if g <= 0: return None
    tr_flat = smooth((t - T_CRAWLS + 0.2) / 1.2)
    tr_up = smooth((t - T_THEN + 0.1) / 0.8)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(GX0 - 40, GY1 - 50, GX1 + 30, GY0 + 110), 26, 26), P((30, 22, 20), 170 * g))
    ax0, ax1 = GX0 + 30, GX1 - 20
    gx = lambda d: lerp(ax0, ax1, (d - 1) / 29)
    gy = lambda d: GY0 - (GY0 - GY1) * dollars(d) / dollars(30)
    c.drawLine(ax0, GY0, ax1 + 10, GY0, SP((255, 255, 255), 5 / z, 230 * g))
    c.drawLine(ax0, GY0, ax0, GY1, SP((255, 255, 255), 5 / z, 230 * g))
    f = skia.Font(kit.L.BLACK, 44 / z)
    for dd in (1, 14, 30):
        x = gx(dd)
        c.drawLine(x, GY0, x, GY0 + 16 / z, SP((255, 255, 255), 4 / z, 230 * g))
        lab = f'day {dd}'; w = f.measureText(lab)
        c.drawString(lab, max(x - w / 2, GX0 - 30), GY0 + 66 / z, f, P((255, 255, 255), 245 * g))
    lim_d = 1 + 24 * tr_flat + 5 * tr_up
    path = skia.Path(); last = None
    for i in range(301):
        d = 1 + 29 * i / 300
        if d > lim_d: break
        p = (gx(d), gy(d))
        if last is None: path.moveTo(*p)
        else: path.lineTo(*p)
        last = p
    c.drawPath(path, SP(Y, 9 / z, 255 * g))
    if last: c.drawCircle(*last, 13 / z, P(Y, 255 * g))
    if tr_up > 0.98:       # the end of the curve is the tower top: a dotted link
        tt = (HIS_X - 16, -stack_px(dollars(30)))
        n = 14
        for k in range(n):
            u0, u1 = k / n, (k + 0.5) / n
            c.drawLine(lerp(last[0], tt[0], u0), lerp(last[1], tt[1], u0), lerp(last[0], tt[0], u1), lerp(last[1], tt[1], u1), SP(Y, 4 / z, 200 * g))
    return last


T_PEN0 = round(T_OFF + 0.85, 3)      # the push down to the penny at the tower's base starts
T_PEN = round(T_PEN0 + 1.0, 3)       # it lands; the end line comes in


def cam_d(t):
    """(zoom, world x at screen centre, world y at screen y 1000)"""
    T_UP0, T_UP1 = T_AND30 - 0.1, T_THIRTY2 + 0.3          # the tower rises: the camera tilts up with its top
    T_BK = T_FIVEM - 0.35                                   # pulled back to see all of it, then the close reaction
    wide = (0.9, -40, -400)
    if t < T_UP0: return (2.0 + 0.06 * ease_io((t - T_D) / (T_UP0 - T_D)), -40, -150)
    if t < T_UP1:
        u = (t - T_UP0) / (T_UP1 - T_UP0)
        top = stack_px(dollars(day_at(t)))
        return (lerp(2.06, 1.5, ease_io(u)), lerp(-40, HIS_X, ease_io(u)), lerp(-150, -top + 120, ease_io(min(1, u * 1.15))))
    if t < T_BK:
        u = ease_io((t - T_UP1) / (T_BK - T_UP1))
        top = stack_px(dollars(30))
        return (lerp(1.5, 0.9, u), lerp(HIS_X, -40, u), lerp(-top + 120, -400, u))
    if t < T_E:
        u = ease_io((t - T_BK) / (T_E - T_BK))
        return (3.0 + 0.15 * u, SIS_WX + 50, -230)
    if t < T_PEN0: return (0.9 + 0.04 * ease_io((t - T_E) / (T_PEN0 - T_E)), -40, -400)
    if t < T_PEN:
        u = ease_io((t - T_PEN0) / (T_PEN - T_PEN0))
        zz = math.exp(lerp(math.log(0.94), math.log(11.0), u))
        return (zz, lerp(-40, PENNY_FLOOR[0], u ** 0.6), lerp(-400, -14, u ** 0.6))
    u = (t - T_PEN) / max(0.1, DUR - T_PEN)
    return (11.0 + 0.7 * u, PENNY_FLOOR[0] + 0.6 * u, -14)


PENNY_FLOOR = (HIS_X + 36, -2)


def scene_d(c, t):
    d = day_at(t)
    hpx = stack_px(dollars(d))
    z, cxw, ty = cam_d(t)
    c.save(); c.translate(540, 1000); c.scale(z, z); c.translate(-cxw, -ty)
    warehouse(c, t, z)
    last = graph_on_wall(c, t, z)
    bill_column(c, MIL_X, 0, stack_px(1_000_000))
    bill_column(c, HIS_X, 0, hpx)
    if hpx > 1:      # his column: a teal edge glow so it reads as his
        c.drawRect(skia.Rect(HIS_X - 15, -hpx, HIS_X + 15, 0), SP(HIS_COL, 3 / max(z, 0.6), 230))
    gl = smooth((t - T_AND30) / 0.8)
    if gl > 0 and hpx > 40:     # the reveal: a warm glow along the tower and a bright crown at its top
        c.drawRect(skia.Rect(HIS_X - 60, -hpx - 30, HIS_X + 60, 0), P((255, 214, 120), 70 * gl, MaskFilter=blur(40), BlendMode=skia.BlendMode.kScreen))
        c.drawCircle(HIS_X, -hpx, 90, P((255, 230, 150), 120 * gl, MaskFilter=blur(36), BlendMode=skia.BlendMode.kScreen))
        rs = np.random.default_rng(3)
        for k in range(16):
            a = rs.uniform(0, 6.28); r = 40 + 50 * ((t * 0.6 + k / 16) % 1)
            c.drawCircle(HIS_X + r * math.cos(a), -hpx + r * math.sin(a) * 0.6, 3.5, P((255, 240, 190), 200 * gl * (1 - ((t * 0.6 + k / 16) % 1))))
    c.drawOval(skia.Rect(MIL_X - 30, -4, MIL_X + 30, 6), P((0, 0, 0), 50, MaskFilter=blur(4)))
    c.drawOval(skia.Rect(HIS_X - 30, -4, HIS_X + 30, 6), P((0, 0, 0), 50, MaskFilter=blur(4)))
    penny_floor(c, *PENNY_FLOOR, 12, t)   # the penny it all started from, lying at the base of his tower
    # people: weight shifts while they watch, heads turning up the tower as it grows, her reaction at day 30
    up = min(1.0, hpx / 700)
    ws1, ws2 = math.sin(t * 1.1), math.sin(t * 0.9 + 1.7)
    shock = smooth((t - (T_FIVEM - 0.35)) / 0.35)
    sis = dict(x=SIS_WX, ground=0, face=1, lean=2 + 1.5 * ws1 - 8 * shock, neck=-12 * smooth((t - T_D) / 0.8) * (1 - up) - 32 * up,
               thigh_n=3 * ws1, thigh_f=-3 * ws1, knee_n=-2 * max(0, -ws1), knee_f=-2 * max(0, ws1),
               br=math.sin(t * 2.2) * 0.5, mouth=0.4 * up + 0.5 * shock, smile=lerp(0.9, 0.0, up), blink=(t % 3.7) < 0.12 and up < 0.4)
    if shock > 0:     # her near hand comes up to her cheek
        J = SIS_W.joints(A2.Pose(**sis)); hcx, hcy = SIS_W.canvas_pt(A2.Pose(**sis), J['head_c'])
        sis = CS.reach(SIS_W, dict(sis), 'n', (hcx + 14 * 0 + 16, hcy + 26), key=('cheek', round(hcx), round(hcy)))
        sis['uarm_n'] = lerp(-3, sis['uarm_n'], shock); sis['elbow_n'] = lerp(22, sis['elbow_n'], shock); sis['hand_n'] = 'flat'
    SIS_W.draw(c, A2.Pose(**sis))
    BRO_W.draw(c, A2.Pose(x=BRO_WX, ground=0, face=-1, lean=2 + 1.5 * ws2 - 7 * up, neck=-8 * (1 - up) - 38 * up,
                          thigh_n=3 * ws2, thigh_f=-3 * ws2, br=math.sin(t * 2 + 1) * 0.5, smile=0.5 + 0.4 * up,
                          blink=((t + 1.3) % 4.1) < 0.12))
    c.restore()
    sx = lambda wx: 540 + z * (wx - cxw)
    sy = lambda wy: 1000 + z * (wy - ty)
    T_CU0 = T_FIVEM - 0.35
    show = smooth((t - T_D - 0.45) / 0.3) * (0.0 if t >= T_CU0 else 1.0)
    top_m = sy(-stack_px(1_000_000))
    if top_m - 46 < 1300: kit.L.chip(c, 'her $1,000,000', sx(MIL_X) - 30, max(top_m - 46, 610), GRN, size=38, a=show)
    dd = int(round(d)) if abs(d - round(d)) < 0.02 else int(d)
    amt = dollars(dd)
    txt = f'his pile, DAY {dd}: ${amt:,.2f}' if amt < 1e6 else f'his pile, DAY {dd}: ${amt:,.0f}'
    top_h = sy(-hpx)
    ins = smooth((t - T_D - 0.45) / 0.3) * (1 - smooth((t - (T_THOUS2 - 0.4)) / 0.3))
    hpd = stack_px(dollars(dd))       # the inset and its label show exactly the day the chip names
    if ins > 0:      # while his pile is too thin to see: a round zoom inset (x40) on the floor at his column
        icx, icy, ir = sx(HIS_X) - 110, 800, 105
        bx, by = sx(HIS_X), sy(0)
        c.drawLine(bx, by - 4, icx - ir * 0.7, icy + ir * 0.7, SP(HIS_COL, 4, 230 * ins))
        c.drawCircle(bx, by - 3, 12, SP(HIS_COL, 4, 255 * ins))
        c.saveLayer(None, P((0, 0, 0), 255 * ins))
        p = skia.Path(); p.addCircle(icx, icy, ir); c.save(); c.clipPath(p, doAntiAlias=True)
        c.drawRect(skia.Rect(icx - ir, icy - ir, icx + ir, icy + ir), P((172, 140, 110)))
        c.drawRect(skia.Rect(icx - ir, icy + 40, icx + ir, icy + ir), P((150, 118, 92)))
        k40 = 40 * z
        hh = min(hpd * k40, 150); ww = 30 * 4
        bill_column(c, icx, icy + 40, hh, w=ww)
        c.restore()
        c.drawCircle(icx, icy, ir, SP(HIS_COL, 5, 255))
        c.restore()
        mm = hpd / PX_PER_M * 1000
        kit.L.chip(c, f'{mm:.0f} mm tall' if mm >= 1 else f'{mm:.1f} mm tall', icx, icy + ir + 34, HIS_COL, size=34, a=ins * show)
        kit.L.chip(c, txt, 560, icy - ir - 50, HIS_COL, size=40, a=show)
    else:
        kit.L.chip(c, txt, min(max(sx(HIS_X) + 60, 380), 700), max(min(top_h - 60, 1240), 610), HIS_COL, size=42, a=show,
                   anchor=(sx(HIS_X), top_h - 4))
    kit.L.chip(c, '$100 bills, stacked to scale', 540, 1330, Wt, size=34, a=smooth((t - T_D - 0.45) / 0.3) * (1 - smooth((t - T_FIVE) / 0.4)))
    if T_CU0 <= t < T_E:
        kit.L.chip(c, 'DAY 30: $5,368,709', 540, 640, Y, size=52)
    if t >= T_E and last is not None and t < T_PEN0:
        ga = smooth((t - T_EXP) / 0.4) * (1 - smooth((t - T_PEN0 + 0.25) / 0.25))
        kit.L.chip(c, 'his pile by day', sx(GX0 + 190), sy(GY1 + 50), Y, size=42, a=ga)
    if t >= T_PEN - 0.2:
        kit.L.chip(c, '1\u00a2  \u2192  $5.4 MILLION', 540, 700, Y, size=74, a=smooth((t - T_PEN + 0.2) / 0.3))


def penny_face(c, x, y, r):
    """the penny seen face on: raised rim, field, a profile bust and lettering ring, bright rim on the lit side"""
    c.drawCircle(x + r * 0.04, y + r * 0.06, r, P((40, 22, 12), 90, MaskFilter=blur(r * 0.08)))
    c.drawCircle(x, y, r, P(COPPER_SH))
    c.drawCircle(x, y, r * 0.9, P(COPPER))
    c.drawCircle(x, y, r * 0.9, SP(mix(COPPER_SH, COPPER, 0.4), r * 0.025))
    for k in range(44):           # lettering ring, as raised dots
        a = math.radians(-200 + 220 * k / 43)
        c.drawCircle(x + r * 0.76 * math.cos(a), y + r * 0.76 * math.sin(a), r * 0.022, P(COPPER_SH))
    bust = smooth_closed([(x - r * 0.28, y + r * 0.5), (x - r * 0.34, y + r * 0.1), (x - r * 0.3, y - r * 0.32), (x - r * 0.06, y - r * 0.5),
                          (x + r * 0.2, y - r * 0.42), (x + r * 0.3, y - r * 0.2), (x + r * 0.36, y - r * 0.02), (x + r * 0.26, y + r * 0.08),
                          (x + r * 0.24, y + r * 0.26), (x + r * 0.12, y + r * 0.34), (x + r * 0.22, y + r * 0.56)])
    sh = skia.Path(bust); sh.offset(r * 0.035, r * 0.04)
    c.drawPath(sh, P(mix(COPPER_SH, (0, 0, 0), 0.15)))           # cast shadow of the raised bust
    c.drawPath(bust, P(mix(COPPER, COPPER_HI, 0.2)))
    hl = skia.Path(bust); hl.offset(-r * 0.03, -r * 0.03)
    c.save(); c.clipPath(bust, doAntiAlias=True)
    c.drawPath(skia.Op(bust, hl, skia.PathOp.kDifference_PathOp), P(COPPER_SH))       # shaded far edge
    c.drawPath(skia.Op(bust, skia.Path(sh), skia.PathOp.kDifference_PathOp) or bust, P(COPPER_HI, 60))
    c.drawOval(skia.Rect(x - r * 0.05, y - r * 0.28, x + r * 0.05, y - r * 0.18), P(COPPER_SH))       # an eye
    c.drawLine(x - r * 0.2, y + r * 0.2, x + r * 0.16, y + r * 0.18, SP(COPPER_SH, r * 0.02))         # collar
    c.restore()
    rp = skia.Path(); rp.addArc(skia.Rect(x - r * 0.97, y - r * 0.97, x + r * 0.97, y + r * 0.97), 190, 110)
    c.drawPath(rp, SP(COPPER_HI, r * 0.05, 230))
    c.drawCircle(x - r * 0.35, y - r * 0.45, r * 0.5, P((255, 236, 200), 60, MaskFilter=blur(r * 0.2), BlendMode=skia.BlendMode.kScreen))


def penny_floor(c, x, y, r, t):
    """the penny lying on the floor: its thick edge, then the embossed face foreshortened, a glint sliding across"""
    c.drawOval(skia.Rect(x - r * 1.2, y - r * 0.2, x + r * 1.25, y + r * 0.42), P((40, 24, 14), 90, MaskFilter=blur(r * 0.2)))
    c.drawOval(skia.Rect(x - r, y - r * 0.5, x + r, y + r * 0.5), P(mix(COPPER_SH, (0, 0, 0), 0.25)))
    c.save(); c.translate(x, y - r * 0.12); c.scale(1.0, 0.5); penny_face(c, 0, 0, r); c.restore()
    g = (t * 0.35) % 1.0
    c.drawOval(skia.Rect(x - r * 0.9 + 1.6 * r * g, y - r * 0.4, x - r * 0.6 + 1.6 * r * g, y + r * 0.1), P((255, 240, 210), 70, MaskFilter=blur(r * 0.1), BlendMode=skia.BlendMode.kScreen))


def scene_penny(c, t):
    """the payoff loop: the embossed penny from the opening, close, with what it became"""
    u = (t - T_PEN) / max(0.1, DUR - T_PEN)
    lgrad(c, skia.Rect(0, 0, W, H), 0, H, [(120, 88, 66), (176, 140, 108)])
    c.drawCircle(540, 980, 520, P((255, 214, 150), 90, MaskFilter=blur(120), BlendMode=skia.BlendMode.kScreen))
    c.save(); c.translate(540, 1080); k = 1.0 + 0.06 * ease_io(u); c.scale(k, k)
    penny_face(c, 0, 0, 250)
    c.restore()
    kit.L.chip(c, '1\u00a2  \u2192  $5.4 MILLION', 540, 700, Y, size=78)


def _day_titles():
    """warehouse titles follow the day counter exactly (the title and the chip always show the same day)"""
    out = []; prev = None; t = T_D
    while t < T_E:
        d = day_at(t); dd = int(round(d)) if abs(d - round(d)) < 0.02 else int(d)
        if dd != prev: out.append((round(t, 3), [[(f'DAY {dd}', Y)]], 'instant')); prev = dd
        t += 1 / 30
    return out


TITLES = sorted([x for x in TITLES if not (T_D <= x[0] < T_E)] + _day_titles(), key=lambda x: x[0])


def scene(c, t):
    if t < T_B: scene_a(c, t)
    elif t < T_B2: scene_b(c, t)
    elif t < T_C: scene_b2(c, t)
    elif t < T_D: scene_c(c, t)
    else: scene_d(c, t)


MERGE = [(['levlprep', 'dot', 'com.'], 'levlprep.com.')]
kit.MERGE[:] = MERGE + [(['thirty', 'days,'], '30 days,'), (['a', 'million', 'dollars'], 'a million dollars'),
                        (['day', 'twenty,'], 'day 20,'), (['five', 'thousand', 'dollars.'], '$5,000.'), (['day', 'thirty,'], 'day 30,'),
                        (['eighty', 'dollars,'], '$80,'), (['FIVE', 'million.'], '5 million.'),
                        (['a', 'hundred', 'and', 'seventy', 'thousand.'], '$170,000.')]

SHORT = kit.Short(WD, 'AP PRECALCULUS', TITLES, scene, DUR, T_PEN, cuts=(T_D,), fix=CAP_FIX)

if __name__ == '__main__':
    out, st = kit.args()
    import os
    kit.render(SHORT, out, stills=st, outdir=os.environ.get('SD', '/home/claude/w1108/01/stills'))
