"""w1111-03-bank-run (AP Macroeconomics 4.4): a bank run. 1080x1920, 30 fps, all code (Python + skia).

LOGLINE  A man in a long line outside his bank has to decide: stay and get his cash out, or go home. His money is not in the vault
         (most of it is out on loan), so a run can empty even a healthy bank; deposit insurance is why he can go home.
BEATS    hook (0 to 4.6): the line, the alert on his phone / the choice said out loud on his face (4.7 to 8.1) / build: through the
         wall into the vault, the example 100 in, 10 kept, 90 lent to a house and a shop (8.2 to 20.9) / a normal day works (21 to 25.3) /
         turn and peak: everyone at once, the vault runs dry, the loans are still fine (25.4 to 31.2) / back to his face: the fear
         makes itself true (31.3 to 33.7) / payoff: the insured shield lands on the bank (33.8 to 36) / he puts the phone away, he can
         go home (36 to 37.7) / spoken call to action over the end card (37.7 to 42.2).
COLOUR   street: clear morning, key light low from the left, warm stone and paving, long cool blue shadows, blue sky; the people carry
         the saturated colour. vault: cool steel blue with one warm lamp on the cash and brass details; the loans are gold light;
         the run turns the lamp cold and red at the peak (28.8); the shield brings teal and the warm morning back (35.0, the brightest moment).
SHOTS    1  0.0  4.6  wide, slow push   the line from the bank's portico, Ray in front with his phone, alert card, pigeons, newspaper
         2  4.6  8.2  close on Ray      eyes phone, the doors, then toward home; STAY IN LINE or GO HOME?
         3  8.2 11.9  pan and push      the bank wall slides in, the round vault door swings open, through it into the vault: almost empty
         4 11.9 16.3  medium, vault     EXAMPLE: 100 deposited as ghost packs, only 10 are real cash
         5 16.3 20.9  pull back         the 90 leave as gold light to a house and a shop above; they light up
         6 20.9 25.3  push to the cash  a normal day: three hands take a pack each, three put one back
         7 25.3 31.2  close then back   everyone at once: ten hands empty the shelf, late hands find nothing; the loans still glow
         8 31.2 33.7  out the door, close on Ray   the vault door shuts, the wall slides away, his worried face, the line behind him longer
         9 33.7 36.0  wide              the shield with INSURED settles and docks on the bank's name plate; the line eases
         10 36.0 37.7 medium on Ray     relief; he slides the phone into his jacket pocket, looks toward home
         11 37.7 42.2 end card          the scene keeps moving under the house end card with levlprep.com
Facts drawn: fractional reserves as an example only (100 in, 10 cash, 90 on loan, labelled EXAMPLE); loans go to a house and a shop as
flowing light, never vanish; a normal day's withdrawals are covered; a run empties the cash while the loans stay good; deposits are
insured (US: up to $250,000). Bank name invented: CITY SAVINGS BANK."""
import sys, math
sys.path[:0] = ['/home/claude/w1111/bank', '/home/claude/short', '/home/claude/guy']
import numpy as np, skia
import kit, layout as L, lpk
from kit import Words, Short, Wt, Y, R
from kit import TL as TEAL
from lpk import P, SP, C, blur, smooth, lerp, mix, poly, smooth_closed
from art import shaded, diffp, glow
import bperson as PN, bhands as H
import people as PP
import world as WO
from world import text, MONT
import vault as VA
import legs as LG

OUT = '/home/claude/w1111/bank/out'
WD = Words(f'{OUT}/words.json')
T_CTA = WD.at('free') - 0.02
DUR = round(WD.end() + 1.55, 2)
T_END = DUR - 2.9                      # the end card alone holds for under 3 s
T2 = WD.at('should') - 0.12            # close on his face
T3 = WD.at("here's") - 0.05            # the camera starts toward the wall
T_IN = WD.at("isn't") - 0.05           # inside the vault
T4 = WD.at('a', 2) - 0.1               # the example
T5 = WD.at('the', 5) - 0.1             # the rest is out on loan
T6 = WD.at('on', 3) - 0.1              # a normal day
T7 = WD.at('but') - 0.05               # everyone at once
T_DRY = WD.at('dry')
T_HEALTHY = WD.at('even') - 0.1
T8 = WD.at('the', 7) - 0.15            # the fear makes itself true: back out to the street
T9 = WD.at("that's") - 0.1             # insured
T_INS = WD.at('insured')
T10 = WD.at('so') - 0.02               # he can go home
T11 = T_INS + 2.75                     # the cut to the square a little later: the line is gone
TL = T11 - 1.3                         # the low shot: his boots turn out of the line and walk away
T_GL = WD.at('around') - 0.1           # he glances back along the line
track = PN.track

# ------------------------------------------------------------------------------------------------ Ray
HOLD = dict(curls=(0.2, 0.42, 0.44, 0.46, 0.46), spread=0.06, show_thumb=False, creases=False)
OPENH = dict(curls=(0.2, 0.2, 0.22, 0.24, 0.26), spread=0.12, show_thumb=False)
SH_L = (97.0, -814.0)                  # his left shoulder in body units
POCKET = ((50, -648), (92, -586))      # the slit of his jacket's side pocket, body units


def ik(target, sh=SH_L):
    dx, dy = target[0] - sh[0], target[1] - sh[1]; d = min(304.0, max(30.0, math.hypot(dx, dy)))
    phi = math.atan2(dx, dy); al = math.acos(max(-1, min(1, (160 ** 2 + d * d - 148 ** 2) / (2 * 160 * d))))
    a1 = phi + al; ex, ey = 160 * math.sin(a1), 160 * math.cos(a1); a2 = math.atan2(dx * d / math.hypot(dx, dy) - ex, dy * d / math.hypot(dx, dy) - ey)
    return math.degrees(a1), math.degrees(a2 - a1)


def phone(glow_=1.0):
    def draw(c, hw, ang, ts, s):
        ca, sa = math.cos(ang), math.sin(ang)
        W = lambda u, v: (hw[0] + s * (u * ca - v * ts * sa), hw[1] + s * (u * sa + v * ts * ca))
        o, v1 = W(0, 0), W(0, 1)
        c.save(); c.translate(*W(60, 10)); c.rotate(math.degrees(math.atan2(v1[1] - o[1], v1[0] - o[0])) + 90); c.scale(s, s)
        r = skia.RRect.MakeRectXY(skia.Rect(-21, -46, 21, 46), 7, 7)
        if glow_ > 0.02: c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-32, -56, 32, 56), 12, 12), P((150, 210, 255), 110 * glow_, MaskFilter=blur(15))); c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-25, -50, 25, 50), 9, 9), P((170, 220, 255), 190 * glow_, MaskFilter=blur(6)))   # the lit screen spills round the edge
        c.drawRRect(r, P((26, 28, 44))); c.drawRRect(r, SP((104, 110, 140), 2)); c.drawLine(-17, -44, -17, 44, SP((70, 76, 100), 1.6, 160))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-16, -41, -1, -25), 4, 4), P((46, 50, 70))); c.drawCircle(-11.5, -36.5, 2.8, P((124, 134, 166))); c.drawCircle(-5.5, -29.5, 2.8, P((124, 134, 166)))
        c.restore()
    return draw


def ray_pose(t):
    """Ray's acting for the whole film, keyed to the words"""
    ps = PP.pose(front=('l',), l_ts=1, l_hand=HOLD)
    g0, g1 = T_GL, T2 - 0.2                                   # the glance back over his shoulder at the line: eyes first, then the head
    pit = track([(0, 1), (1.3, 1), (1.7, 0), (g1, 0), (T2 + 0.4, 1), (T2 + 0.75, 0), (7.8, 0), (8.15, 0.7), (T8, 0.7), (T8 + 0.1, 0.0), (T9 - 0.2, 0.0), (T9 + 0.15, 1.0), (T_INS + 0.1, 1.0), (T_INS + 0.45, 0.0), (DUR, 0)], t)
    yaw = track([(0, 0.06), (1.3, 0.06), (1.75, -0.3), (g0 + 0.12, -0.3), (g0 + 0.55, 0.9), (g1, 0.9), (T2 + 0.3, 0.06), (T2 + 0.4, 0.06), (T2 + 0.8, -0.32), (6.8, -0.32), (7.15, 0.5), (7.75, 0.5), (8.15, 0.1), (T8, 0.1), (T8 + 0.1, -0.2), (T8 + 1.2, -0.2), (T8 + 1.7, 0.22), (T9 - 0.2, 0.2), (T9 + 0.15, 0.05),
                 (T_INS + 0.1, 0.05), (T_INS + 0.5, -0.12), (TL - 0.5, -0.1), (TL - 0.1, 0.4), (DUR, 0.4)], t)
    lead = track([(0, 0.06), (1.2, 0.06), (1.6, -0.3), (g0, -0.3), (g0 + 0.3, 0.9), (g1 - 0.14, 0.9), (T2 + 0.16, 0.06), (T2 + 0.3, 0.06), (T2 + 0.68, -0.32), (6.7, -0.32), (7.02, 0.5), (7.65, 0.5), (8.05, 0.1), (T8, 0.1), (T8 + 0.1, -0.2), (T8 + 1.1, -0.2), (T8 + 1.55, 0.22), (T9 - 0.3, 0.2), (T9 + 0.05, 0.05),
                  (T_INS, 0.05), (T_INS + 0.38, -0.12), (TL - 0.62, -0.1), (TL - 0.26, 0.4), (DUR, 0.4)], t)          # the eyes go first
    relief = smooth((t - (T_INS + 0.25)) / 0.8)
    glance = smooth((t - g0 - 0.1) / 0.4) * (1 - smooth((t - g1) / 0.4))
    ps.head_pitch = pit; ps.head_yaw = yaw; ps.look = (max(-1, min(1, lead * 2.6)), lerp(-0.25, 1.0, pit))
    ps.head_tilt = 3 * pit + yaw * 5
    blinks = (0.9, 2.4, g0 + 0.2, 6.2, 7.45, T8 + 0.9, T9 + 1.0, T_INS + 1.25, T10 + 2.9, T10 + 4.4)
    bl = min(abs(t - b) for b in blinks); ps.lid = max(0.05, min(1.0, bl / 0.08)) * lerp(1.0, 0.66, pit)
    ps.worry = lerp(track([(0, 0.7), (1.3, 0.7), (1.8, 1.0), (T2, 0.9), (7.0, 1.0), (T8, 1.0), (T9, 0.9), (DUR, 0.9)], t), 0.0, relief)
    ps.brow = 0.25 * (1 - pit) + 0.35 * relief + 0.3 * glance; ps.smile = 0.52 * relief
    tense = 1 - relief                                        # worried, he carries his shoulders high; they drop with one long breath out when the news lands
    ps.breath = 0.5 + 0.5 * math.sin(t * 2.2) + 3.4 * tense - 1.6 * math.exp(-((t - (T_INS + 0.95)) / 0.3) ** 2)
    ps.sh_r = 7 * tense
    ps.sway = track([(0, -8), (2.0, -8), (3.2, 6), (7.0, 6), (8.2, -4), (T8, -6), (T9, 4), (T10, 0), (DUR, 0)], t)
    ps.lean = 0.6 * math.sin(t * 0.7) + 2.4 * glance
    ps.r_up = 6 + 1.2 * math.sin(t * 1.1); ps.r_fore = 7 + 1.5 * math.sin(t * 0.9 + 1)
    # his left hand holds the phone up to read. When he knows he is safe the screen goes dark and he lowers it to his jacket pocket.
    bob = 3 * math.sin(t * 1.7)
    low = smooth((t - (T_INS + 0.45)) / 0.85)
    tgt = (lerp(15.0, 150.0, low), lerp(-707.0 + bob - 10 * pit, -690.0, low)); a3 = lerp(-100 + 8 * pit, -90, low)
    up, fore = ik(tgt); ps.l_up, ps.l_fore = up, fore; ps.l_wrist = a3 - up - fore
    ps.scr = 1 - smooth((t - (T_INS + 0.4)) / 0.35)
    ps.l_item = phone(ps.scr)
    return ps


# ------------------------------------------------------------------------------------------------ the line
QUEUE = [('marisol', 0.62, 0.0), ('walter', 0.45, 1.3), ('june', 0.34, 2.1), ('dev', 0.26, 3.4), ('far0', 0.205, 4.2), ('far1', 0.165, 5.0), ('far2', 0.135, 0.7), ('far3', 0.112, 1.9)]
TURN = [(f'far{4 + i}', 0.094, 905 - 47 * i) for i in range(8)]      # the far end of the line, coming round the corner of the next building
MORE = [(f'far{12 + i}', 0.103, 884 - 50 * i) for i in range(6)]     # later the far end has doubled up: six more people
_PIC = {}


def sprite(who, s):
    """a far figure drawn once (the far end of the line is small: about 100 px tall)"""
    if who not in _PIC:
        rec = skia.PictureRecorder(); cc = rec.beginRecording(skia.Rect(-400, -1200, 400, 100))
        PP.person(cc, who, PP.pose(worry=0.6, head_yaw=(sum(map(ord, who)) % 7 - 3) * 0.1), 0, 0, 1.0); _PIC[who] = rec.finishRecordingAsPicture()
    return _PIC[who]


def watch(c, hw, ang, ts, s):
    ca, sa = math.cos(ang), math.sin(ang)
    c.save(); c.translate(hw[0] + s * 5 * ca, hw[1] + s * 5 * sa); c.rotate(math.degrees(ang)); c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-8, -26, 8, 26), 4, 4), P((70, 44, 36))); c.drawCircle(0, 0, 13, P((226, 196, 120))); c.drawCircle(0, 0, 9.5, P((246, 246, 250))); c.drawLine(0, 0, 0, -6, SP((40, 40, 60), 2)); c.drawLine(0, 0, 4, 2, SP((40, 40, 60), 2))
    c.restore()


def line_pose(who, i, ph, t, relief):
    """the people in the line: weight shifting from foot to foot, and every few seconds each one leans out and cranes to see the doors.
    Walter checks his watch; Dev is on his phone. All of it eases when the news lands."""
    w = 0.5 + 0.5 * math.sin(t * 0.55 + ph)
    u = ((t + ph * 0.9) % 3.4) / 1.5
    cr = (math.sin(math.pi * u) ** 2 if u < 1 else 0.0) * (1 - relief)
    d = -1 if i % 2 else 1
    yaw = 0.34 * math.sin(t * 0.8 + ph * 2.1) * (1 - 0.5 * relief) + (-0.25 if i % 2 else 0.15)
    bl = ((t + ph * 1.7 + 1.3) % 3.1)
    ps = PP.pose(sway=12 * math.sin(t * 0.5 + ph) + d * 44 * cr, lean=1.2 * math.sin(t * 0.63 + ph * 1.3) + d * 9 * cr, head_yaw=yaw * (1 - cr) - d * 0.1 * cr, look=(max(-1, min(1, yaw * 2.4)) * (1 - cr), -0.6 * cr),
                 worry=lerp(0.55 + 0.4 * max(w, cr), 0.0, relief), smile=0.5 * relief, brow=0.7 * cr, head_x=d * 12 * cr,
                 breath=0.5 + 0.5 * math.sin(t * 2 + ph), lid=0.08 if bl < 0.1 else 1.0, head_tilt=3 * math.sin(t * 0.5 + ph) + d * 5 * cr, r_up=6 + 2 * math.sin(t + ph), l_up=7 + 2 * math.sin(t * 0.9 + ph + 1))
    if who == 'walter' and t < 3.4:                           # he lifts his wrist, reads the time, lets it drop
        k = track([(0, 0), (0.7, 0), (1.25, 1), (2.5, 1), (3.05, 0), (3.4, 0)], t)
        up, fore = ik((lerp(119, 20, k), lerp(-510, -702, k))); a3 = lerp(2, -98, k)
        ps.front = ('l',); ps.l_ts = 1; ps.l_up, ps.l_fore, ps.l_wrist = up, fore, a3 - up - fore; ps.l_hand = dict(PN.RELAX, creases=False); ps.l_item_top = watch
        ps.head_pitch = k; ps.head_yaw = yaw * (1 - k); ps.look = (ps.look[0] * (1 - k), k); ps.sway = 6 * math.sin(t * 0.5 + ph); ps.lean = 0.0; ps.head_x = 0; ps.head_tilt = 2 * k
    if who == 'dev':                                          # reading the same news on his own phone, glancing up at the doors
        up, fore = ik((15.0, -707.0 + 3 * math.sin(t * 1.3))); ps.front = ('l',); ps.l_ts = 1; ps.l_up, ps.l_fore, ps.l_wrist = up, fore, -100 - up - fore; ps.l_hand = HOLD; ps.l_item = phone(1.0 - relief)
        ps.head_pitch = 1 - cr; ps.look = (ps.look[0], lerp(1.0, -0.6, cr))
    return ps


def card(c, x, y, w, a, lines, tag='NEWS ALERT', tagc=(226, 70, 70), ptr=None):
    """a phone notification, drawn big beside the phone it is on"""
    if a <= 0.01: return
    h = 74 + 46 * len(lines)
    c.save(); c.translate(x, y); s = 0.9 + 0.1 * smooth(a); c.scale(s, s); al = 255 * min(1.0, a)
    if ptr:
        pp = poly([(ptr[0] - x, ptr[1] - y), (-w / 2 + 6, -30), (-w / 2 + 6, 30)]); c.drawPath(pp, P((250, 250, 252), al))
    r = skia.RRect.MakeRectXY(skia.Rect(-w / 2, -h / 2, w / 2, h / 2), 26, 26)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w / 2 + 4, -h / 2 + 10, w / 2 + 6, h / 2 + 14), 26, 26), P((20, 24, 60), 110 * min(1, a), MaskFilter=blur(12)))
    c.drawRRect(r, P((250, 250, 252), al))
    f = skia.Font(L.BLACK, 24); tw = f.measureText(tag)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(-w / 2 + 24, -h / 2 + 18, -w / 2 + 52 + tw, -h / 2 + 56), 19, 19), P(tagc, al)); c.drawString(tag, -w / 2 + 38, -h / 2 + 46, f, P((255, 255, 255), al))
    text(c, 'now', w / 2 - 28, -h / 2 + 46, 24, (140, 144, 160), al, face=MONT, align=1.0)
    for i, ln in enumerate(lines): text(c, ln, -w / 2 + 28, -h / 2 + 104 + i * 46, 40, (20, 24, 50), al, align=0.0)
    c.restore()


PLQ = (100, 560, 128, 150)                                   # the bank's name plate on the near column (foreground layer)


def fgmap(cam, wx, wy):
    tx, ty, z = cam; return (540 + (wx - 540 - (tx - 540) * 1.22) * z * 1.22, 900 + (wy - 900 - (ty - 900) * 1.22) * z * 1.22)


def street(c, t, cam=(540, 900, 1.0), dof=0.0, extra=0.0, ins=0.0, cardspec=None, fg=True, people=True):
    """the whole street shot. cam = (world x, world y, zoom): that world point sits at the middle of the frame.
    people=False is the square a little later: the line has gone home and the pigeons have it back."""
    tx, ty, z = cam
    relief = smooth((t - (T_INS + 0.3)) / 0.9)
    def view(par=1.0):
        c.translate(540, 900); c.scale(z * par, z * par); c.translate(-540 - (tx - 540) * par, -900 - (ty - 900) * par)
    c.save(); view()
    if dof > 0: kit.blur_layer(c, 7 * dof)
    WO.sky(c, t)
    for (ph, y, s, p2) in WO.BIRDS: WO.bird(c, ((ph + t * 0.03 * s) % 1.0) * 1300 - 100, y + 14 * math.sin(t * 0.8 + p2), s * 0.8, math.sin(t * 9 * s + p2))
    WO.far_row(c, t); WO.car(c, t, 0.0, 120.0, x0=180); WO.car(c, t, T8 - 1.5, 150.0, col=(70, 120, 190)); WO.car(c, t, 5.5, -130.0, col=(240, 196, 80), x0=1300); WO.car(c, t, T11 - 1.2, 140.0, col=(120, 170, 120))
    WO.plaza(c, t)
    if people:
        for i, (who, s, x) in enumerate(TURN):
            gy = WO.feet_y(s) + 1.5 * math.sin(t * 1.3 + i)
            WO.cast_shadow(c, x, gy, s, 0.8)
            c.save(); c.translate(x + 2 * math.sin(t * 0.7 + i * 1.7), gy); c.scale(s, s); c.drawPicture(sprite(who, s)); c.restore()
    WO.neighbour(c, t)
    if people:
        if extra > 0:
            for i, (who, s, x) in enumerate(MORE):
                gy = WO.feet_y(s) + 1.5 * math.sin(t * 1.2 + i * 2)
                WO.cast_shadow(c, x, gy, s, 0.8)
                c.save(); c.translate(x + 2 * math.sin(t * 0.8 + i), gy); c.scale(s, s); c.drawPicture(sprite(who, s)); c.restore()
        for i, (who, s, ph) in enumerate(sorted(QUEUE, key=lambda m: m[1])):
            x = WO.line_x(s) + 4 * math.sin(t * 0.4 + ph); gy = WO.feet_y(s)
            WO.cast_shadow(c, x, gy, s)
            PP.person(c, who, line_pose(who, i, ph, t, relief), x, gy, s)
        WO.pigeon(c, 846, 1392, 1.5, t, 0.0); WO.pigeon(c, 930, 1330, 1.25, t, 2.2, flip=-1)
        WO.newspaper(c, t, -0.5)
    else:
        for k, (px, py, ps_, ph, fl) in enumerate(((846, 1392, 1.5, 0.0, 1), (930, 1330, 1.25, 2.2, -1), (560, 1300, 1.4, 1.1, 1), (690, 1120, 1.0, 3.0, -1), (430, 1560, 1.9, 0.6, -1), (760, 1010, 0.8, 4.1, 1), (300, 1250, 1.3, 5.0, 1))):
            if k < 3: WO.pigeon(c, px, py, ps_, t, ph, flip=fl)
            else: WO.pigeon_land(c, px, py, ps_, t, T11 - 0.25 + 0.22 * (k - 3), ph, flip=fl)
        c.save(); c.translate(640, 1470); c.rotate(-12); c.scale(1.5, 0.62)                                           # the newspaper has settled on the paving
        c.drawOval(skia.Rect(-44, 22, 48, 40), P(WO.COOL, 70, MaskFilter=blur(5))); sh = poly([(-40, -28), (40, -30), (42, 28), (-38, 30)]); c.drawPath(sh, P((246, 242, 232))); c.drawPath(sh, SP((190, 186, 180), 2)); c.drawRect(skia.Rect(-32, -22, 32, -12), P((70, 70, 80)))
        for j in range(4): c.drawRect(skia.Rect(-32, -4 + j * 8, 30 - (j % 2) * 16, -1 + j * 8), P((150, 150, 160)))
        c.restore()
    if dof > 0: c.restore()
    if people:
        rx, rs = 400, 0.95; rg = WO.feet_y(rs)
        WO.cast_shadow(c, rx, rg, rs)
        rp = ray_pose(t); PP.person(c, 'ray', rp, rx, rg, rs)
        if rp.scr > 0.02: glow(c, rx + 6, rg - 800 * rs, 150 * rs, (150, 200, 255), 60 * rp.scr)                      # the screen's light under his chin
    c.restore()
    if fg:
        c.save(); view(1.22)                                 # the portico is close to the camera: it moves more than the square
        kit.blur_layer(c, 2.2); WO.column(c, 65, 172, t); c.restore()
        WO.plaque(c, PLQ[0], PLQ[1], PLQ[2], PLQ[3], 0.0)
        if ins > 0.5: WO.shield(c, PLQ[0] + PLQ[2] / 2, PLQ[1] + PLQ[3] + 76, 0.34)          # the insured shield now hangs under the name plate, clear of the name
        WO.door_leaf(c, t, 900)
        c.restore()
    WO.motes(c, t, 0.8)
    if cardspec: card(c, *cardspec)


# ------------------------------------------------------------------------------------------------ the vault shots
T_HOUSE, T_SHOP = WD.at('house'), WD.at('shop')
T_EVERY = WD.at('everyone')
VA.TM.update(T_AS=WD.at('as') - 0.15, T_IN=T_IN, T4=T4, T5=T5, T6=T6, T7=T7, T_DRY=T_DRY, T_HEALTHY=T_HEALTHY, T_HOUSE=T_HOUSE - 0.1, T_SHOP=T_SHOP - 0.1)
ACTS = []
for k_, (who, ang) in enumerate((('marisol', 72), ('walter', 108), ('june', 64))): ACTS.append(dict(kind='take', who=who, ang=ang, t0=T6 + 0.42 + 0.6 * k_, d=1.0, j=9 - k_))
for k_, (who, ang) in enumerate((('dev', 112), ('far0', 70), ('far1', 106))): ACTS.append(dict(kind='give', who=who, ang=ang, t0=T6 + 2.3 + 0.6 * k_, d=1.0, j=7 + k_))
for k_, ang in enumerate((66, 114, 250, 290, 58, 122, 262, 278, 74, 106)): ACTS.append(dict(kind='take', who=f'far{2 + k_}', ang=ang, t0=T_EVERY - 0.1 + 0.2 * k_, d=0.74, j=9 - k_))
for k_, (who, ang, dx) in enumerate((('walter', 97, -112), ('june', 90, 38), ('dev', 83, 188))): ACTS.append(dict(kind='empty', who=who, ang=ang, dx=dx, t0=T_EVERY + 1.95 + 0.17 * k_, d=T_HEALTHY + 0.35 - (T_EVERY + 1.95 + 0.17 * k_), j=0))
TW = T3 + 2.3                                                # the camera is through the door
TE = T8 - 0.25                                               # the camera starts back out


def vcam(t):
    ks = [(TW - 0.8, 525, 1170, 0.8), (TW, 525, 1170, 1.38), (T5 - 0.05, 525, 1170, 1.44), (T5 + 0.9, 540, 900, 1.0), (T6 - 0.1, 540, 900, 1.03), (T6 + 0.6, 622, 1000, 2.0), (T7, 622, 1000, 2.06), (T_HEALTHY - 0.05, 622, 1000, 2.16),
          (T_HEALTHY + 0.7, 540, 900, 1.0), (TE, 540, 900, 1.03), (TE + 0.5, 540, 900, 0.8)]
    x, y, z = (track([(k[0], k[i_]) for k in ks], t) for i_ in (1, 2, 3))
    if T_EVERY < t < T_HEALTHY:                              # the rush shakes the frame a little
        e = math.exp(-max(0.0, t - T_DRY) / 0.5) * smooth((t - T_EVERY) / 0.3)
        x += 5 * e * math.sin(t * 43) / z; y += 4 * e * math.sin(t * 37 + 1) / z
    return (x, y, z)


def vault_shot(c, t):
    M, n = VA.cross(c, t, vcam(t), ACTS)
    chip = VA.chip
    if T4 <= t < TE + 0.3:
        ex, ey = M(200, 822); chip(c, 'EXAMPLE', max(150, ex), max(468, ey), (255, 210, 63), smooth((t - T4) / 0.25) * (1 - smooth((t - TE) / 0.25)), size=34)
    if T4 <= t < T5 - 0.05:                                  # gone before the camera moves
        k = sum(1 for i_ in range(9) if t >= T4 + 0.25 + 0.2 * i_ + 0.12); a = smooth((t - T4 - 0.2) / 0.25) * (1 - smooth((t - T5 + 0.25) / 0.18))
        x_, y_ = M(540, 868); f = skia.Font(L.BLACK, 58); s_ = f'{10 + 10 * k} DEPOSITED'; w_ = f.measureText(s_)
        c.drawString(s_, x_ - w_ / 2 + 2, y_ + 4, f, P((6, 8, 30), 200 * a, MaskFilter=blur(5))); c.drawString(s_, x_ - w_ / 2, y_, f, P((255, 255, 255), 255 * a))
    t_as = WD.at('as') - 0.15
    if t_as <= t < T6 + 0.2 and not (T5 - 0.05 <= t < T5 + 0.85):
        x_, y_ = M(540, 1136); a = smooth((t - t_as) / 0.25) * (1 - smooth((t - T6 + 0.1) / 0.25)) * (1 - smooth((t - T5 + 0.25) / 0.18) if t < T5 else smooth((t - T5 - 0.85) / 0.2))
        chip(c, 'ONLY 10 KEPT AS CASH' if t < T5 else '10 CASH', x_, y_, (64, 226, 206), a, size=40 if t < T5 else 34)
        if t < T5: VA.glow(c, *M(540, 990), 230, (120, 255, 230), 120 * a * (0.7 + 0.3 * math.sin(t * 6)))
    if T5 + 0.85 <= t < T6 + 0.15:
        x_, y_ = M(540, 737); chip(c, '90 OUT ON LOAN', x_, y_ + 2, VA.GOLD, smooth((t - T5 - 0.85) / 0.25) * (1 - smooth((t - T6 + 0.1) / 0.2)), size=38)
    if T6 + 0.45 <= t < T_HEALTHY + 0.1:
        x_, y_ = M(540, 1140); col = (64, 226, 206) if n > 3 else ((255, 210, 63) if n > 0 else (255, 92, 92))
        a = smooth((t - T6 - 0.45) / 0.25) * (1 - smooth((t - T_HEALTHY + 0.15) / 0.2))
        chip(c, f'CASH {n}', x_, y_, col, a, size=50, ink=(20, 18, 44) if n else (255, 255, 255), scale=1.0 + (0.14 * math.exp(-((t - T_DRY) / 0.25) ** 2) if n == 0 else 0))
    td = T6 + 2.2                                            # the count goes back up because new deposits come in: say so
    if td <= t < T7 + 0.1:
        chip(c, 'NEW DEPOSITS COME IN', 760, 596, (64, 226, 206), smooth((t - td) / 0.25) * (1 - smooth((t - T7 + 0.15) / 0.2)), size=32)
    if T_HEALTHY + 0.6 <= t < TE + 0.2:
        a = smooth((t - T_HEALTHY - 0.6) / 0.25) * (1 - smooth((t - TE) / 0.2))
        x_, y_ = M(540, 737); chip(c, 'LOANS STILL GOOD: 90', x_, y_ + 2, VA.GOLD, a, size=36)
        x_, y_ = M(540, 1136); chip(c, 'CASH 0', x_, y_, (255, 92, 92), a, size=38, ink=(255, 255, 255))


def through(c, t, street_fn):
    """the move between the street and the vault: the bank wall slides across, the round door swings, the camera goes through it (and back)"""
    if t < (T3 + TW) / 2 + 1:                                 # going in
        slide = smooth((t - T3 - 0.4) / 0.85); spin = smooth((t - T3 - 0.95) / 0.5); swing = smooth((t - T3 - 1.3) / 0.6); zw = 1 + 2.7 * smooth((t - T3 - 1.5) / 0.8) ** 1.5
    else:                                                     # coming back out
        zw = 1 + 2.7 * (1 - smooth((t - TE) / 0.5)) ** 1.5; swing = 1 - smooth((t - TE - 0.38) / 0.42); spin = 1 - smooth((t - TE - 0.8) / 0.3); slide = 1 - smooth((t - TE - 1.05) / 0.6)
    if slide < 0.999: street_fn(c, t, slide)
    if slide > 0.001:
        c.save(); c.translate(-1320 * (1 - slide), 0); c.translate(540, 960); c.scale(zw, zw); c.translate(-540, -960)
        if slide < 0.999: c.drawRect(skia.Rect(1200, -200, 1300, 2200), P(WO.COOL, 110, MaskFilter=blur(34))); c.clipRect(skia.Rect(-3000, -3000, 1210, 4920))      # the wall's own edge, with its shadow on the street behind
        def inside(cc):
            cc.save(); cc.resetMatrix(); vault_shot(cc, t); cc.restore()
        VA.wall(c, t, 330, swing, spin, inside)
        c.restore()


def shield_group(c, t, cam):
    """the insured shield drops in over the street and lands with a pulse of light. It stays clear of every head; the amount is in the title."""
    a = smooth((t - (T_INS - 0.3)) / 0.22)
    if a <= 0: return
    u = (t - (T_INS - 0.3)) / 0.45; drop = (1 - smooth(u)); s = 0.62 * (1 + 0.9 * drop) * (1 + 0.05 * math.exp(-max(0, u - 1) * 6) * math.sin(max(0, u - 1) * 22))
    if u > 0.9: c.drawRect(skia.Rect(0, 0, 1080, 1920), P((150, 255, 236), 60 * math.exp(-(u - 0.9) / 0.35)))          # the moment it lands the whole square brightens
    WO.shield(c, 770, 515 - 60 * drop, s, a=a, glow_=math.exp(-max(0, u - 0.9) / 0.5) if u > 0.8 else 0.0)


def low_shot(c, t):
    """a low shot along the paving: the line's legs and shoes stay planted; Ray's boots turn out of the line and take two steps away"""
    tl = t - TL
    WO.grad(c, skia.Rect(0, 0, 1080, 1920), (0, 0), (0, 1920), [(240, 226, 200), (230, 212, 184), (212, 190, 162)], [0, 0.45, 1.0])
    for k in range(-9, 12): c.drawLine(700 + k * 46, -400, 700 + k * 330, 1920, SP((190, 166, 140), 2.6, 120))
    for yy in (120, 330, 610, 990, 1500): c.drawLine(0, yy, 1080, yy + 14, SP((190, 166, 140), 2 + yy / 400, 110))
    sp = poly([(-200, 1920), (140, 1920), (1500, 1060), (1500, 900)]); c.drawPath(sp, P(WO.COOL, 52, MaskFilter=blur(12)))  # a column's long shadow
    fy = lambda s_: -320 + 1308 * s_
    relief = 1.0
    for i, (who, s_, ph, x) in enumerate((('dev', 0.36, 3.4, 962), ('june', 0.47, 2.1, 880), ('walter', 0.62, 1.3, 760), ('marisol', 0.85, 0.0, 612))):
        WO.cast_shadow(c, x, fy(s_), s_)
        ps = line_pose(who, i, ph, t, relief); ps.sway *= 0.4
        PP.person(c, who, ps, x, fy(s_), s_)
    WO.pigeon(c, 930, 1560, 2.0, t, 0.0, flip=-1)
    LG.draw(c, tl, 300, 1380, 1.3, PP.LOOKS['ray'], phone(0.0))
    WO.motes(c, t, 0.8)


def scene(c, t):
    if t < T2:
        u = t / T2; cam = (540 - 64 * u, 900 + 46 * u, 1.0 + 0.2 * u)                                                  # a steady push in on him
        a = smooth((t - 0.12) / 0.25) * (1 - smooth((t - 2.5) / 0.3))
        sx = 540 + (392 - cam[0]) * cam[2]; sy = 900 + (1090 - cam[1]) * cam[2]                                        # where his phone is on screen
        street(c, t, cam=cam, cardspec=(sx + 330, sy - 26, 500, a, ['Is City Savings', 'in trouble?'], 'NEWS ALERT', (226, 70, 70), (sx + 36, sy - 6)))
    elif t < T3:
        street(c, t, cam=(410, 870, 2.4 + 0.12 * (t - T2) / (T3 - T2)), dof=1.0)
    elif t < TW:
        def st(c_, t_, slide):
            e = smooth((t_ - T3) / 1.3); street(c_, t_, cam=(410 - 250 * e, 870 + 10 * e, 2.52 - 0.5 * e), dof=1.0)
        through(c, t, st)
    elif t < TE: vault_shot(c, t)
    elif t < T9:
        def st(c_, t_, slide):
            e = 1 - smooth((t_ - TE - 1.0) / 0.9); street(c_, t_, cam=(410 - 200 * e, 870, 2.4 - 0.3 * e + 0.1 * (t_ - T8) / (T9 - T8)), dof=1.0, extra=1.0)
        through(c, t, st)
    elif t < TL:
        u = (t - T9) / (TL - T9); p = smooth((t - T_INS - 0.2) / (TL - T_INS - 0.2))                                  # after the shield lands the camera moves in on him
        cam = (lerp(540 + 8 * u, 452, p), lerp(836 + 6 * u, 892, p), lerp(1.0 + 0.05 * u, 1.34, p))
        street(c, t, cam=cam, extra=1.0)
        shield_group(c, t, cam)
    elif t < T11: low_shot(c, t)
    else:                                                     # a little later: the square in front of the bank, the line gone, the pigeons back
        v = (t - T11) / (DUR - T11)
        street(c, t, cam=(540, 884 - 10 * v, 1.1 - 0.08 * smooth(v * 1.4)), ins=1.0, people=False)
        VA.chip(c, 'A LITTLE LATER', 540, 470, (255, 210, 63), smooth((t - T11 - 0.05) / 0.2), size=36)


BL = (130, 210, 255)
TITLES = [
    (0.0, [[('BANK RUN', Y)], [('STAY IN LINE OR GO HOME?', Wt)]]),
    (T2, [[('STAY IN LINE', TEAL)]]),
    (WD.at('or') - 0.05, [[('STAY IN LINE', Wt)], [('OR ', Wt), ('GO HOME?', Y)]]),
    (T3, [[("HERE'S THE", Wt)], [('PROBLEM', R)]]),
    (WD.at('his', 3) - 0.05, [[('HIS MONEY', Wt)], [("ISN'T IN THE VAULT", R)]]),
    (T4, [[('BANKS KEEP ONLY', Wt)], [('A SMALL PART ', Y), ('AS CASH', Wt)]]),
    (T5, [[('THE REST IS', Wt)], [('OUT ON LOAN', Y)]]),
    (T6, [[('A NORMAL DAY', Wt)], [('A FEW ', TEAL), ('WANT CASH', Wt)]]),
    (T7, [[('BUT IF', Wt)], [('EVERYONE ', R), ('COMES?', Wt)]]),
    (WD.at('the', 6) - 0.08, [[('THE VAULT', Wt)], [('RUNS DRY', R)]]),
    (T_HEALTHY, [[('EVEN AT A', Wt)], [('HEALTHY ', TEAL), ('BANK', Wt)]]),
    (T8, [[('THE FEAR MAKES', Wt)], [('ITSELF TRUE', R)]]),
    (T9, [[('DEPOSITS ARE', Wt)], [('INSURED', TEAL)]]),
    (T_INS - 0.12, [[('DEPOSITS ARE ', Wt), ('INSURED', TEAL)], [('UP TO $250,000 (US)', Y)]]),
    (TL, [[('SO HE CAN', Wt)], [('GO HOME', Y)]]),
]


class BankShort(Short):
    """the house Short, ending on the house end card (levlprep.com) under the spoken call to action"""
    def frame(self, t):
        if t <= self.t_end: return Short.frame(self, t)
        s = skia.Surface(kit.W, kit.H); c = s.getCanvas(); self.scene(c, t)
        img = kit.finish(s.makeImageSnapshot().toarray(), t, lift=self.lift(t))
        s = skia.Surface(kit.W, kit.H); c = s.getCanvas(); im = skia.Image.fromarray(img, colorType=skia.kBGRA_8888_ColorType)
        c.drawImage(im, 0, 0); L.fades(c)
        u = (t - self.t_end) / 1.1
        if u < 0.35: kit._title_hard(c, self.titles[-1][1], t, self.titles[-1][0])
        L.end_card(c, im, u, [[('DEPOSITS ARE ', Wt), ('INSURED', TEAL)]])
        L.badge(c, self.badge); self.cap.draw(c, t)
        return s


SHORT = BankShort(WD, 'AP MACROECONOMICS', TITLES, scene, DUR, T_END, fix={'EVERYone': 'EVERYONE'})

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir=f'{OUT}/stills')
