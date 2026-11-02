"""Anterior view of the heart in the house flat style (code, after textbook anatomy and ref_heart.png colours).
Viewer's left = the patient's right. Parts back to front: pulmonary veins, IVC, aorta with its three arch branches,
SVC, right atrium with its auricle over the aortic root, left auricle, pulmonary trunk crossing in front of the
aortic root and splitting under the arch, the ventricles (right ventricle forms most of the front, left ventricle
the right edge and the apex), fat in the coronary and anterior interventricular grooves with the right coronary
artery, the LAD with a diagonal branch and the great cardiac vein.
draw_heart(c, x, y, s, t, beat, vf): beat 0..1 is the ventricular squeeze (cold slow rhythm), vf 0..1 replaces it
with a fine uneven ripple of the ventricular wall and no squeeze (ventricular fibrillation)."""
import math
import numpy as np, skia
from cperson import plate, Light, tube, union, inter, diff, V, smooth_closed, P, dark, mix, rim_path
import tfig

LT = Light(sd=(-0.72, -0.69), rim=(255, 214, 190), rim_w=3.0, rim_a=200, shade_k=0.22)
MUS, MUS_SH = (196, 72, 80), (150, 46, 62)            # heart muscle
ATR, ATR_SH = (178, 64, 82), (136, 42, 62)            # atria a touch darker and bluer
ART, ART_SH = (222, 62, 66), (170, 36, 50)            # arteries (oxygenated, red)
VEN, VEN_SH = (70, 110, 206), (44, 74, 160)           # veins and pulmonary trunk (deoxygenated, blue by convention)
FAT, FAT_SH = (236, 200, 120), (204, 160, 88)

VENT = [(-96, -30), (-52, -52), (6, -60), (50, -56), (96, -44), (132, -8), (146, 44), (136, 100), (106, 148), (72, 180),
        (46, 184), (10, 166), (-36, 126), (-78, 76), (-100, 28), (-104, -6)]
RA = [(-138, -58), (-108, -92), (-70, -92), (-48, -60), (-52, -16), (-68, 26), (-100, 48), (-130, 28), (-144, -16)]
RAUR = [(-74, -84), (-60, -106), (-32, -106), (-10, -92), (-4, -76), (-16, -66), (-36, -64), (-58, -66)]
LAUR = [(58, -66), (74, -88), (102, -86), (118, -68), (112, -54), (102, -58), (94, -48), (82, -54), (70, -46)]
AV_GROOVE = [(-44, -54), (-62, -20), (-80, 18), (-92, 44), (-84, 90), (-62, 120)]
IV_GROOVE = [(52, -56), (54, -20), (60, 30), (66, 90), (70, 140), (72, 176)]
BASE = (16, -46)          # the ventricles squeeze toward their base


def _pts(pts, f=None):
    return [f(x, y) if f else (x, y) for x, y in pts]


def _ripple(t, amp):
    """fine uneven ripple: several short waves running over the wall in different directions"""
    ws = ((0.21, 0.08, 41.0, 0.0), (-0.11, 0.19, 53.0, 1.7), (0.16, -0.17, 37.0, 3.1), (0.27, 0.23, 61.0, 4.4))
    def f(x, y):
        dx = dy = 0.0
        for kx, ky, w, ph in ws:
            s = math.sin(kx * x + ky * y + w * t + ph)
            dx += s * kx * 9; dy += s * ky * 9
        return x + amp * dx, y + amp * dy
    return f


def _squeeze(beat):
    kx, ky = 1 - 0.05 * beat, 1 - 0.08 * beat
    return lambda x, y: (BASE[0] + (x - BASE[0]) * kx, BASE[1] + (y - BASE[1]) * ky)


def _dense(pts, rs, n=6):
    """Catmull Rom resample of a centre line (and its radii) so tubes bend smoothly instead of in facets"""
    if len(pts) < 3: return pts, rs
    P_ = [pts[0]] + list(pts) + [pts[-1]]; R_ = [rs[0]] + list(rs) + [rs[-1]]
    out, ro = [], []
    for i in range(1, len(P_) - 2):
        p0, p1, p2, p3 = (np.array(P_[i + k], float) for k in (-1, 0, 1, 2))
        for j in range(n):
            u = j / n
            q = 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3)
            out.append(tuple(q)); ro.append(R_[i] + (R_[i + 1] - R_[i]) * u)
    out.append(tuple(pts[-1])); ro.append(rs[-1])
    return out, ro


def _vessel(c, pts, r, base, shade, w=None):
    rs = list(r) if isinstance(r, (list, tuple)) else [r] * len(pts)
    pts, rs = _dense([tuple(q) for q in pts], rs)
    p = tube([V(q) for q in pts], rs)
    plate(c, LT, p, base, shade, w or 2 * max(r if not isinstance(r, (list, tuple)) else max(r), 1), k=0.3)
    return p


def _open_end(c, ctr, r, ang, col):
    """the cut end of a vessel: a darker oval mouth"""
    c.save(); c.translate(*ctr); c.rotate(ang)
    c.drawOval(skia.Rect(-r * 0.8, -r * 0.42, r * 0.8, r * 0.42), P(dark(col, 0.55)))
    c.restore()


def draw_heart(c, x, y, s, t, beat=0.0, vf=0.0, a=1.0):
    c.save(); c.translate(x, y); c.scale(s, s)
    if a < 1: c.saveLayer(None, skia.Paint(Alphaf=a))
    sq = _squeeze(beat * (1 - vf))
    rp = _ripple(t, 1.15 * vf)
    def fv(x_, y_):
        x2, y2 = sq(x_, y_)
        if vf <= 0.01: return x2, y2
        g = smooth01((y2 + 50) / 60.0)            # the ripple lives on the ventricles, fading out toward the base
        x3, y3 = rp(x2, y2)
        return x2 + (x3 - x2) * g, y2 + (y3 - y2) * g
    pulse = beat * (1 - vf)
    # ---- behind: pulmonary veins into the left atrium (viewer's right), IVC under the right atrium
    for (a0, a1) in (((104, -74), (160, -80)), ((108, -44), (162, -38))):
        _vessel(c, [a0, a1], 11, ART, ART_SH); _open_end(c, a1, 11, 90 - 8, ART)
    # ---- aorta: up from behind the pulmonary trunk, arching to the viewer's right and back; three branches
    ra = 22 + 1.5 * pulse
    for p0, p1, r in (((-6, -170), (-22, -226), 10), ((22, -182), (22, -232), 8), ((48, -176), (62, -226), 8)):
        _vessel(c, [p0, p1], r, ART, ART_SH); _open_end(c, p1, r, math.degrees(math.atan2(p1[1] - p0[1], p1[0] - p0[0])) + 90, ART)
    _vessel(c, [(0, -46), (-20, -94), (-24, -136), (-8, -168), (24, -180), (58, -170), (80, -142), (88, -104)], ra, ART, ART_SH, w=46)
    # ---- SVC down into the right atrium
    _vessel(c, [(-92, -204), (-94, -140), (-96, -74)], 19, VEN, VEN_SH); _open_end(c, (-92, -204), 19, 0, VEN)
    # ---- right atrium; left auricle (behind the pulmonary trunk)
    ra_p = smooth_closed(RA)
    plate(c, LT, ra_p, ATR, ATR_SH, 90, k=0.24)
    plate(c, LT, smooth_closed(LAUR), ATR, ATR_SH, 40, k=0.3)
    # ---- pulmonary trunk: from the right ventricle's outflow, up and to the viewer's right in front of the aortic
    # root, splitting under the arch (left pulmonary artery to the right; the right one runs behind the aorta)
    rp_ = 22 + 1.5 * pulse
    _vessel(c, [(70, -118), (142, -128)], 13, VEN, VEN_SH); _open_end(c, (142, -128), 13, 90 - 8, VEN)
    _vessel(c, [(18, -40), (28, -86), (50, -112), (72, -118)], rp_, VEN, VEN_SH, w=46)
    # ---- right auricle over the root of the aorta
    plate(c, LT, smooth_closed(RAUR), ATR, ATR_SH, 36, k=0.3)
    # ---- ventricles (with the ripple in VF)
    vent = smooth_closed(_pts(VENT, fv))
    plate(c, LT, vent, MUS, MUS_SH, 240, k=0.15)
    # the left ventricle (right of the interventricular groove) a touch deeper
    lv = smooth_closed(_pts([(52, -56), (96, -44), (132, -8), (146, 44), (136, 100), (106, 148), (72, 180), (70, 140), (66, 90), (60, 30), (54, -20)], fv))
    c.save(); c.clipPath(vent, skia.ClipOp.kIntersect, True)
    c.drawPath(lv, P(mix(MUS, MUS_SH, 0.22)))
    q = skia.Path(lv); q.offset(-14, -10); c.save(); c.clipPath(q, skia.ClipOp.kDifference, True); c.drawPath(lv, P(MUS_SH)); c.restore()
    # VF: fine fibrillation waves crawling over the wall (short darker and lighter crescents that flicker)
    if vf > 0.02:
        rs = np.random.default_rng(int(t * 12))
        for k in range(20):
            px, py = rs.uniform(-80, 130), rs.uniform(-20, 170)
            ang = rs.uniform(0, 180); L_ = rs.uniform(12, 26)
            col = MUS_SH if k % 3 else (230, 118, 118)
            c.save(); c.translate(*fv(px, py)); c.rotate(ang)
            pth = skia.Path(); pth.moveTo(-L_, 0); pth.quadTo(0, -6 - 4 * math.sin(t * 40 + k), L_, 0)
            c.drawPath(pth, skia.Paint(AntiAlias=True, Color=skia.Color(*col, int(230 * vf)), Style=skia.Paint.kStroke_Style, StrokeWidth=5.5, StrokeCap=skia.Paint.kRound_Cap))
            c.restore()
    c.restore()
    # ---- fat in the grooves, then the coronary vessels on it
    fat_av = tube([V(fv(*p)) for p in AV_GROOVE], [6, 8, 8, 7, 6, 4])
    fat_iv = tube([V(fv(*p)) for p in IV_GROOVE], [10, 10, 9, 8, 6, 3])
    fat_top = smooth_closed(_pts([(-36, -54), (0, -60), (46, -58), (54, -48), (20, -50), (-10, -50), (-32, -46)], fv))
    for fp in (fat_av, fat_iv, fat_top):
        plate(c, LT, fp, FAT, FAT_SH, 16, k=0.3)
    # right coronary artery in the coronary groove, its marginal branch along the lower border
    rca = [fv(*p) for p in [(-12, -50), (-38, -52), (-60, -20), (-78, 18), (-90, 46), (-82, 90), (-60, 120)]]
    _vessel(c, rca, [4.5, 4.5, 4.2, 4, 3.8, 3.4, 3], ART, ART_SH, w=10)
    _vessel(c, [fv(*p) for p in [(-84, 70), (-50, 112), (-12, 148), (16, 166)]], [3, 2.6, 2.2, 1.8], ART, ART_SH, w=8)
    # LAD down the anterior interventricular groove with a diagonal branch; great cardiac vein beside it
    _vessel(c, [fv(*p) for p in [(52, -52), (54, -20), (60, 30), (66, 90), (70, 140), (72, 174)]], [4.6, 4.4, 4.0, 3.5, 3, 2.2], ART, ART_SH, w=10)
    _vessel(c, [fv(*p) for p in [(57, 8), (90, 42), (112, 86)]], [3, 2.4, 1.8], ART, ART_SH, w=8)
    # one thin warm rim on the lit (upper left) edge of the whole heart
    rim_path(c, LT, vent, a=170, w=3.2)
    rim_path(c, LT, ra_p, a=150, w=3.0)
    if a < 1: c.restore()
    c.restore()


def smooth01(u):
    u = min(1.0, max(0.0, u)); return u * u * (3 - 2 * u)


def beat_at(t, t0, period=1.5):
    """ventricular squeeze for a beat whose QRS lands at t0 + k*period; peaks about 0.15 s after the QRS"""
    u = ((t - t0) % period)
    return math.exp(-((u - 0.16) / 0.11) ** 2) if u < 0.6 else 0.0
