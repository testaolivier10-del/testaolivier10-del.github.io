"""w1118-01-book-stack (AP Calculus BC): the book stacking trick and the harmonic series. 1080x1920, 30 fps, all code (skia).

Logline: a student in a library at night tries to make the top book of a stack hang completely past the table's edge, with
no glue; she does it with four books, because the overhangs 1/2, 1/4, 1/6, 1/8 are half of the harmonic series, and that sum
never stops growing (31 books reach two book lengths out).
Beats: hook (0 to 6: can she get the top book past the edge?), the rule (8 to 13: the weight above stays over the book below),
the build (13 to 19.6: four pushes, each on its word), payoff (19.6 to 24: the top book clear of the table, her smile),
the idea (24 to 32: 1 + 1/2 + 1/3 + ... keeps growing), the reach (32 to 40: the ghost stack of 31 books reaches two book
lengths), loop (40 to 41.6: back to her four books, top book past the edge).
Colour script: cool night blue room (window, shelves), one warm key: the brass desk lamp over the books. The brightest moment
is the payoff: the light line at the table edge and the glowing gap under the top book (20.7 s). The pull back opens the
dark room; the ghost books are cool and pale against it.
Shot list (times from out/words.json):
 A 0.00-5.95  medium wide, front, slow push: Nadia at the table, four hardbacks flush at the edge; her fingertips square the
              top book (moving at frame 0); "hang completely past the edge": a ghost outline of the top book beyond the edge
              and a dashed line up from the edge. Title BOOK STACKING / PAST THE EDGE?
 B 5.95-8.25  face close (camera pushes into her face): she looks at the edge, brows drawn in, then a small lift: can she?
 C 8.25-12.95 side view of the stack, closer: a soft dot at the top book's middle (its weight) and a thin plumb line down
              onto the book below, whose top lights up as the support. Her hand comes onto the top book.
 D 12.95-19.6 the four pushes, each landing on its word (HALF 14.56, quarter 16.48, sixth 17.60, eighth 18.88); fingertips on
              the back end of the book she pushes every frame; books above ride along; brackets with 1/2, 1/4, 1/6, 1/8 on
              each overhang; a tiny settle after each release. Camera follows the stack to the right.
 E 19.6-22.45 payoff, close on the edge: a light line down from the table edge, the gap between it and the top book glows.
 F 22.45-24.0 face close: a surprised, then pleased smile.
 G 24.0-32.15 the stack, with the sum written in the air above it: 1/2 x (1 + 1/2 + 1/3 + 1/4 + ...) term by term on the
              words, then a running total that keeps ticking up.
 H 32.15-36.7 pull back: the four books turn into the top of a ghost stack that grows underneath, the classic shape (book k
              from the top sticks out L/2k past the next), a long slow curve over the dark floor; she looks up at it.
 I 36.7-39.9  wide hold: floor ruler from the edge with a 2 BOOKS OUT mark; the 31 book stack's top reaches it; 31 BOOKS.
 J 39.9-41.6  cut back to her four books, top book past the edge (loop point); levlprep.com line.
Motion list for the accuracy check: L = book length (340 px), T = thickness. Books are moved only by her right hand, whose
fingertips touch the back (left) end of the book being pushed; everything above that book rides along unchanged. Push 1: top
book +L/2 relative to book 2; push 2: books 1-2 +L/4 relative to book 3; push 3: books 1-3 +L/6 relative to book 4; push 4:
all four +L/8 past the table edge. Final top book left end = E + L(1/2+1/4+1/6+1/8) - L = E + 0.042 L (14 px gap, drawn to
scale). Each sub stack's centre of mass then sits exactly over the edge below it (marginal balance); a 0.4 degree settle
after each release, no tipping. Ghost stack: n books, top book's right end at E + (L/2) H_n; H_30 = 3.995, H_31 = 4.027, so
31 books are the first to pass 2 L.
Sound cues: book slides 13.8, 15.98, 18.4; a soft wood knock as the stack settles 19.1 (payoff build); room tone; far clock."""
import sys, math
sys.path[:0] = ['/home/claude/w1118/stack', '/home/claude/short', '/home/claude/guy']
import numpy as np, skia
import kit, world as Wd, reader as R
from kit import Words, Short, Wt, Y, TL
from lpk import P, SP, C, blur, smooth, lerp, mix
from art import glow, SCREEN
import layout as LY

WD = Words('/home/claude/w1118/stack/out/words.json')
DUR, T_END = 41.6, 41.61
TREW, TLOOP = 4.9, 41.1                   # the rewind at the end of the opening, the cut back to frame 0
E, L, T, YTT = Wd.E, Wd.L, Wd.T, Wd.YTT
TA, TB, TC, TD, TE, TF, TG, TG2, TH, TI, TJ = 0.0, 5.95, 8.25, 12.95, 19.6, 24.1, 25.3, 29.68, 32.15, 36.7, 39.9
CX0, SY0 = 200.0, 960.0                  # her body centre and shoulder line
RNG = np.random.default_rng(5)


def ease(u):
    u = min(1.0, max(0.0, u)); return u * u * (3 - 2 * u)


def seg(t, a, b, v0, v1):
    return lerp(v0, v1, ease((t - a) / (b - a)))


# ------------------------------------------------------------------------------------------------ the four pushes
PUSHES = [(13.75, 14.95, L / 2), (15.95, 16.70, L / 4), (17.15, 17.85, L / 6), (18.35, 19.05, L / 8)]
RELEASE = [15.05, 16.78, 17.92, 19.15]


def offsets_fwd(t):
    sg = lambda k: seg(t, PUSHES[k][0], PUSHES[k][1], 0.0, PUSHES[k][2])
    return (sg(0), sg(1), sg(2), sg(3))


def open_p(t):
    """the opening: her last push, all four books together, the top book crossing the table edge (t may be negative for the loop)"""
    if t < 0: return 0.3 + 1.4 * t
    u = min(1.0, t / 1.0); return 0.3 + 0.7 * u * (2 - u)


def rew_tau(t):
    return lerp(19.15, 12.8, ease((t - TREW) / (TB - TREW)))


def offsets(t):
    if t >= TLOOP: return (L / 2, L / 4, L / 6, L / 8 * open_p(t - DUR))
    if t < TREW: return (L / 2, L / 4, L / 6, L / 8 * open_p(t))
    if t < TB: return offsets_fwd(rew_tau(t))
    return offsets_fwd(t)


def wobble(t):
    if 1.05 <= t < 2.4:
        u = t - 1.05; return (3, 0.5 * math.exp(-u / 0.25) * math.sin(u * 2 * math.pi * 3.0))
    if t < TB: return None
    for k, tr in enumerate(RELEASE):
        nxt = RELEASE[k + 1] if k < 3 else 99
        if tr <= t < nxt:
            u = t - tr; return (k, 0.45 * math.exp(-u / 0.22) * math.sin(u * 2 * math.pi * 3.2))
    return None


def book_mid(xs, j):
    return (xs[j], YTT - (3 - j) * T - T * 0.5)


REST_TIP = (262.0, 1238.0)


def hand_fwd(t, xs):
    """right hand: (tip, angle, contact). Fingertips sit on the back end of the book being pushed for the whole push."""
    def on(j): x, y = book_mid(xs, j); return (x - 8.0, y - 10.0)
    ang_push = math.radians(12)
    if t < 1.85: return on(0), ang_push, 1.0
    if t < 2.4:
        u = ease((t - 1.85) / 0.55); a = on(0); return (lerp(a[0] - 12 * math.sin(u * math.pi), REST_TIP[0], u), lerp(a[1], REST_TIP[1], u)), lerp(ang_push, math.radians(6), u), 0.0
    if t < 12.2:
        b = 1.5 * math.sin(t * 1.4); return (REST_TIP[0] + b, REST_TIP[1]), math.radians(6), 0.0
    if t < 12.8:
        u = ease((t - 12.2) / 0.6); a = on(0); lift = 40 * math.sin(u * math.pi)
        return (lerp(REST_TIP[0], a[0], u), lerp(REST_TIP[1], a[1], u) - lift), lerp(math.radians(6), ang_push, u), 0.0
    legs = [(14.95, 15.05, 15.55, 0, 1), (16.70, 16.78, 17.10, 1, 2), (17.85, 17.92, 18.30, 2, 3)]
    for (t0, t1, t2, j0, j1) in legs:
        if t0 <= t < t2:
            if t < t1: return on(j0), ang_push, 1.0
            u = ease((t - t1) / (t2 - t1)); a = on(j0); b = on(j1)
            back = 16 * math.sin(u * math.pi)
            return (lerp(a[0], b[0], u) - back, lerp(a[1], b[1], u) - 10 * math.sin(u * math.pi)), ang_push, 0.0
    if t < 14.95: return on(0), ang_push, 1.0
    if t < 16.70: return on(1), ang_push, 1.0
    if t < 17.85: return on(2), ang_push, 1.0
    if t < 19.15: return on(3), ang_push, 1.0
    if t < 19.75:
        u = ease((t - 19.15) / 0.6); a = on(3); return (lerp(a[0] - 14 * math.sin(u * math.pi), REST_TIP[0], u), lerp(a[1], REST_TIP[1], u) - 30 * math.sin(u * math.pi)), lerp(ang_push, math.radians(6), u), 0.0
    b = 1.5 * math.sin(t * 1.4); return (REST_TIP[0] + b, REST_TIP[1]), math.radians(6), 0.0


def hand_state(t, xs):
    def on(j): x, y = book_mid(xs, j); return (x - 8.0, y - 10.0)
    ap = math.radians(12)
    if t < 1.05 or t >= TLOOP: return on(3), ap, 1.0
    if t < 1.6:
        u = ease((t - 1.05) / 0.55); a = on(3)
        return (lerp(a[0] - 14 * math.sin(u * math.pi), REST_TIP[0], u), lerp(a[1], REST_TIP[1], u) - 30 * math.sin(u * math.pi)), lerp(ap, math.radians(6), u), 0.0
    if t < TREW: b_ = 1.5 * math.sin(t * 1.4); return (REST_TIP[0] + b_, REST_TIP[1]), math.radians(6), 0.0
    if t < TB: return hand_fwd(rew_tau(t), xs)
    return hand_fwd(t, xs)


def her_pose(t, tip):
    """her face and lean through the video (expressions keyed to the words)"""
    reach = max(0.0, min(1.0, (tip[1] - 1050) / 180))                     # she leans toward the lower books
    ps = R.Pose(breath=0.5 + 0.5 * math.sin(t * 2.1), lean=(10 * reach, 34 * reach))
    ps.look = (0.75, 0.75); ps.focus = 0.4
    if t >= TLOOP: t = t - DUR
    if t < TB:
        ps.look = (0.9, 0.55); ps.focus = 0.7 * (1 - ease((t - 1.1) / 0.4)); ps.smile = 0.45 * ease((t - 1.3) / 0.5) * (1 - ease((t - 4.9) / 0.3))
        ps.brow = 0.4 * ease((t - 1.3) / 0.4); ps.tilt = 2 * ease((t - 1.3) / 0.6)
    elif t < TC:                                                           # doubtful at the edge, then she makes up her mind
        d = ease((t - 6.1) / 0.4) * (1 - ease((t - 7.0) / 0.25)); k = ease((t - 7.2) / 0.3)
        ps.doubt = d; ps.det = k; ps.focus = 0.0
        ps.look = (lerp(0.95, 0.55, k), lerp(0.85, 0.75, k)); ps.tilt = lerp(-8 * d, 3, k) + 2.5 * math.sin(max(0.0, t - 7.25) * 7) * math.exp(-max(0.0, t - 7.25) * 3) * k
    elif t < TD: ps.look = (0.6, 0.9); ps.det = 0.7 - 0.4 * ease((t - TC) / 3.0); ps.focus = 0.4; ps.tilt = 3
    elif t < TE: ps.look = (0.6, 0.95); ps.focus = 0.8; ps.tilt = 3
    elif t < TF: ps.look = (0.85, 0.7); ps.focus = 0.3; ps.brow = ease((t - 21.3) / 0.4) * 0.7
    elif t < TG:
        ps.look = (seg(t, 24.1, 24.6, 0.8, 0.1), seg(t, 24.1, 24.6, 0.6, 0.0)); ps.brow = 1.0 - 0.5 * ease((t - 24.7) / 0.5)
        ps.opn = 0.35 * ease((t - 24.15) / 0.2) * (1 - ease((t - 24.55) / 0.3)); ps.smile = ease((t - 24.45) / 0.4) * 0.95; ps.lid = 1.15 - 0.15 * ease((t - 24.6) / 0.4); ps.tilt = seg(t, 24.1, 25.2, 0, 5)
    elif t < TH: ps.look = (0.7, -0.2); ps.focus = 0.0; ps.smile = 0.5; ps.brow = 0.2
    else:
        ps.look = (seg(t, TH, TH + 1.0, 0.7, 0.9), seg(t, TH, TH + 2.0, -0.2, -1.0)); ps.brow = 0.6 + 0.3 * ease((t - 38.4) / 0.4); ps.tilt = seg(t, TH, 36, 0, -6)
        ps.opn = 0.3 * ease((t - 33.0) / 0.4) * (1 - ease((t - 35.0) / 0.4)); ps.smile = 0.35 + 0.45 * ease((t - 38.5) / 0.4)
    bl = min(abs(t - x) for x in (2.6, 6.75, 7.95, 9.4, 12.1, 16.0, 20.1, 25.9, 29.3, 33.4, 37.1, 40.6))
    ps.lid = min(ps.lid, max(0.05, bl / 0.08))
    return ps


# ------------------------------------------------------------------------------------------------ camera
def cam_A(t):
    u = t / TB; return lerp(1.32, 1.36, u), lerp(545, 550, u), lerp(1075, 1078, u)


def cam_tall(m):
    n = max(4.0, m); top_r = E + 0.5 * L * Wd.H(max(4, int(round(n))))
    z = min(1.6, 950 / (n * T + 300)); return z, (300 + top_r) / 2, YTT - n * T / 2 + 200


def cam_for(t):
    """(zoom, centre x, centre y) in world coords"""
    if t >= TLOOP: return cam_A(t - DUR)
    if t < TB: return cam_A(t)
    if t < TC:
        u = ease((t - TB) / 2.1); return lerp(2.2, 2.75, u), lerp(250, 214, u), lerp(860, 800, u)
    if t < TD: u = (t - TC) / (TD - TC); return lerp(1.52, 1.58, u), 470, 1075
    if t < TE:
        u = ease((t - 16.8) / 2.6); z, x, y = lerp(1.5, 1.42, u), lerp(520, 612, u), 1085
        k = ease((t - TD) / 0.9); return lerp(1.58, z, k), lerp(470, x, k), lerp(1075, y, k)
    if t < TF:
        u = (t - TE) / (TF - TE); z, x, y = lerp(1.72, 1.84, u), lerp(725, 720, u), lerp(1100, 1105, u)
        k = ease((t - TE) / 0.8); return lerp(1.42, z, k), lerp(612, x, k), lerp(1085, y, k)
    if t < TG: u = (t - TF) / (TG - TF); return lerp(2.7, 2.8, u), 214, lerp(800, 795, u)
    if t < TH:                                                                 # slow push, then an eased move in on the sum (no jump)
        z1, x1, y1 = lerp(1.45, 1.5, min(1.0, (t - TG) / 4.1)), lerp(770, 780, min(1.0, (t - TG) / 4.1)), 1080
        z2, x2, y2 = lerp(1.75, 1.82, max(0.0, (t - 30.4) / 1.75)), 790, 1075
        k = ease((t - 29.3) / 1.2); return lerp(z1, z2, k), lerp(x1, x2, k), lerp(y1, y2, k)
    g = cam_for(TH - 1e-3); m = ghost_n(t); zt, xt, yt = cam_tall(m)
    if t > 38.6: zt *= 1 + 0.04 * (t - 38.6) / 2.5
    k = ease((t - TH) / 1.4); return lerp(g[0], zt, k), lerp(g[1], xt, k), lerp(g[2], yt, k)


def apply_cam(c, z, cx, cy):
    c.translate(540, 960); c.scale(z, z); c.translate(-cx, -cy)


def to_screen(p, z, cx, cy):
    return (540 + (p[0] - cx) * z, 960 + (p[1] - cy) * z)


# ------------------------------------------------------------------------------------------------ ghost stack
def ghost_n(t):
    return 4.0 + 27.0 * ease((t - 32.35) / 6.2) ** 1.15 if t >= 32.35 else 4.0


def ghost_books(m):
    """books (x, yb, alpha) for a stack of m (float) books, top first"""
    n0 = int(math.floor(m)); u = m - n0
    s0 = Wd.tall_state(n0); s1 = Wd.tall_state(min(31, n0 + 1)) if u > 1e-6 else s0
    out = []
    for j in range(n0):
        x = lerp(s0[j], s1[j], u); yb = YTT - lerp(n0 - 1 - j, n0 - j, u) * T if u > 1e-6 else YTT - (n0 - 1 - j) * T
        out.append((x, yb, 1.0))
    if u > 1e-6 and n0 < 31: out.append((s1[n0], YTT, u))
    return out


# ------------------------------------------------------------------------------------------------ the scene
def world_scene(c, t, z, cx, cy, xs, ghost=0.0, m=4.0):
    # far wall: slower parallax, softened when the camera is close on her face (depth of field)
    zw = 1 + (z - 1) * 0.55; c.save(); apply_cam(c, zw, cx * 0.8 + 540 * 0.2 * 0 + 0.2 * 470, cy)
    if z > 1.8: c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(9, 9)))
    Wd.wall(c, t)
    if z > 1.8: c.restore()
    c.restore()
    c.save(); apply_cam(c, z, cx, cy)
    Wd.floor(c, t)
    tip, ang, contact = hand_state(t, xs)
    ps = her_pose(t, tip)
    shR, shL = R.bust(c, CX0, SY0, ps, t)
    Wd.table(c, t); Wd.lamp(c, t)
    # arms (behind the books), then the books, then her hands
    wr = R.wrist_for(tip, ang, reach=92)
    af = ang + math.radians(14); el = (wr[0] - 150 * math.cos(af), wr[1] - 150 * math.sin(af))
    R.sleeve(c, (shR[0] + 6, shR[1] + 14), el, wr, near=0.6); R.shoulder_cap(c, shR)
    if (TB <= t < TC) or (TF <= t < TG):
        pass                                                               # face close: the stack is below the frame
    elif ghost > 0:
        # the imagined tall stack: the real four stay on top, the extra books are real hardbacks too, a little hazier with depth
        gb = ghost_books(m); pts = []
        for j in range(len(gb) - 1, -1, -1):
            x, yb, a = gb[j]
            if j < 4: Wd.book(c, x, yb, j)
            else:
                hz = 0.18 + 0.3 * (j - 4) / 27.0
                c.save(); c.translate(0, (1 - a) * -18); Wd.book(c, x, yb, (j * 5) % 7, a=a * 0.9, haze=hz); c.restore()
            pts.append((x + L, yb - T))
        if len(pts) > 5:                                                   # the curve through the ends
            pa = skia.Path(); pa.moveTo(*pts[0])
            for q in pts[1:]: pa.lineTo(*q)
            c.drawPath(pa, SP((255, 210, 120), 4, 140 * ghost, PathEffect=skia.DashPathEffect.Make([16, 12], 0)))
    else:
        Wd.draw_stack(c, xs, wob=wobble(t))
    pose = R.PUSH if contact > 0.5 else R.REST
    if not ((TB <= t < TC) or (TF <= t < TG)): R.hand(c, wr, ang, 1, pose)
    Wd.beam(c, t, 1.0)
    c.restore()
    return ps


def overlays(c, t, z, cx, cy, xs):
    S = lambda p: to_screen(p, z, cx, cy)
    ys = [YTT - (3 - j) * T for j in range(4)]                            # bottoms of the four books
    # A: the opening push: the table edge line, the gap under the top book, then the rewind
    if TA <= t < TREW:
        b_ = ease((t - 4.32) / 0.3) * (1 - ease((t - 4.75) / 0.15))
        if b_ > 0: edge_line(c, S, b_, ys[0] - T - 90, z, down=True, label=b_)
        g = ease((t - 0.7) / 0.3) * (1 - ease((t - 4.75) / 0.15))
        if g > 0 and xs[0] > E:
            p0 = S((E, ys[0] - T)); p1 = S((xs[0], ys[0]))
            c.drawRect(skia.Rect(p0[0], p0[1], p1[0], p1[1]), P((255, 226, 150), 150 * g, MaskFilter=blur(6)))
    if TREW <= t < TB:                                                     # a rewind mark, so the jump back to the start reads as an edit
        a = ease((t - TREW) / 0.12) * (1 - ease((t - TB + 0.1) / 0.1))
        c.drawRect(skia.Rect(0, 0, 1080, 1920), P((120, 160, 255), 34 * a))
        for k in range(0, 1920, 6): c.drawLine(0, k, 1080, k, SP((0, 0, 0), 1, 22 * a))
        x0, y0 = 860, 560
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0 - 150, y0 - 50, x0 + 150, y0 + 30), 36, 36), P((12, 12, 34), 210 * a))
        for d in (0, 34): c.drawPath(skia.Path().moveTo(x0 - 120 + d, y0 - 10).lineTo(x0 - 92 + d, y0 - 32).lineTo(x0 - 92 + d, y0 + 12).close(), P((255, 236, 200), 255 * a))
        f = skia.Font(LY.XBOLD, 40); c.drawString('REWIND', x0 - 40, y0 + 4, f, P((255, 236, 200), 255 * a))
    # C and the pushes: the balance point of the books being moved, an arrow straight down onto what holds them up
    for k in range(4):
        if k == 0: a = ease((t - 10.08) / 0.3) * (1 - ease((t - 15.3) / 0.3)) if TC <= t < 15.7 else 0.0
        else: a = ease((t - PUSHES[k][0] + 0.2) / 0.25) * (1 - ease((t - RELEASE[k] - 0.4) / 0.3)) if TD <= t < TE else 0.0
        if a <= 0: continue
        cxm = sum(xs[j] + L / 2 for j in range(k + 1)) / (k + 1); ym = sum(ys[j] - T / 2 for j in range(k + 1)) / (k + 1)
        p = S((cxm, ym)); grow = ease((t - 10.4) / 0.6) if k == 0 and t < 11.5 else 1.0
        q = S((cxm, lerp(ym, ys[k], grow)))
        c.drawLine(p[0], p[1], p[0], q[1] - 6, SP((20, 14, 30), 12, 150 * a)); c.drawLine(p[0], p[1], p[0], q[1] - 6, SP((255, 240, 205), 6, 255 * a))
        c.drawPath(skia.Path().moveTo(p[0] - 17, q[1] - 24).lineTo(p[0], q[1] - 2).lineTo(p[0] + 17, q[1] - 24).close(), P((255, 240, 205), 255 * a))
        c.drawCircle(p[0], p[1], 12, P((255, 200, 90), 255 * a)); c.drawCircle(p[0], p[1], 12, SP((20, 14, 30), 3, 255 * a))
        sup = (xs[k + 1] + L) if k < 3 else E
        if abs(cxm - sup) < 2: glow(c, q[0], q[1], 46, (255, 230, 160), 200 * a)
        if k == 0: tag(c, 'BALANCE POINT', p[0], p[1] - 40, a, size=40)
    if TC <= t < TD:
        d = ease((t - 11.76) / 0.3)
        if d > 0:
            p0 = S((xs[1], ys[1] - T)); p1 = S((xs[1] + L, ys[1] - T))
            c.drawLine(p0[0] + 6, p0[1] - 3, p1[0] - 6, p1[1] - 3, SP((120, 240, 200), 10, 230 * d)); c.drawLine(p0[0] + 6, p0[1] - 3, p1[0] - 6, p1[1] - 3, SP((120, 240, 200), 24, 60 * d, MaskFilter=blur(8)))
            tag(c, 'BOOK BELOW', (p0[0] + p1[0]) / 2, p1[1] + 140, d, size=40)
    # D to G: brackets with the fractions on each overhang
    if TD <= t < TH + 0.6 and not (TF <= t < TG):
        fade = 1 - ease((t - TH) / 0.5)
        if TE + 0.4 < t < TF: fade *= 1 - 0.55 * ease((t - 20.5) / 0.4)            # they step back while the payoff is shown
        sup = [xs[1] + L, xs[2] + L, xs[3] + L, E]
        for j, (num, den) in enumerate((('1', '2'), ('1', '4'), ('1', '6'), ('1', '8'))):
            a = ease((t - PUSHES[j][1] + 0.25) / 0.3) * fade
            if a <= 0: continue
            p0 = S((sup[j], ys[j] + 6)); p1 = S((xs[j] + L, ys[j] + 6))
            col = (255, 210, 110)
            hot = 0.0
            if TG <= t < TH:
                ts = (26.24, 26.96, 27.84, 28.64)[j]; hot = ease((t - ts) / 0.15) * (1 - 0.7 * ease((t - ts - 0.6) / 0.5))
                if hot > 0: c.drawLine(p0[0], p0[1] + 6, p1[0], p1[1] + 6, SP((255, 236, 170), 22, 160 * hot, MaskFilter=blur(8)))
            c.drawLine(p0[0], p0[1] + 6, p1[0], p1[1] + 6, SP(col, 5, 240 * a))
            for q in (p0, p1): c.drawLine(q[0], q[1] - 6, q[0], q[1] + 18, SP(col, 5, 240 * a))
            f_ = skia.Font(LY.BLACK, 72); s_ = f'{num}/{den}'; w_ = f_.measureText(s_)
            if j == 0:                                                     # 1/2 sits above the top book's overhang, clear of the others
                tq = S(((sup[0] + xs[0] + L) / 2, ys[0] - T)); lx, ly = min(tq[0] - w_ / 2, 1050 - w_), tq[1] - 18
            else: lx, ly = p1[0] + 16, p1[1] + 40
            lx = min(lx, 1060 - w_)
            c.drawString(s_, lx + 3, ly + 4, f_, P((8, 6, 18), 190 * a)); c.drawString(s_, lx, ly, f_, P(col, 255 * a))
    # E: the payoff: one clear table edge line, the glowing gap under the top book's back end, NO TABLE UNDER IT
    if TE <= t < TF:
        b_ = ease((t - 19.95) / 0.4)
        if b_ > 0: edge_line(c, S, b_, ys[0] - T - 90, z, down=True, label=ease((t - 20.2) / 0.3))
        g = ease((t - 20.7) / 0.35)
        if g > 0:
            pul = 0.8 + 0.2 * math.sin(t * 6)
            p0 = S((E, ys[0] - T)); p1 = S((xs[0], ys[0]))
            c.drawRect(skia.Rect(p0[0], p0[1], p1[0], p1[1]), P((255, 226, 150), 150 * g * pul, MaskFilter=blur(6)))
            c.drawRect(skia.Rect(p0[0] + 2, p0[1] + 4, p1[0] - 2, p1[1] - 4), P((255, 248, 220), 230 * g))
            q0 = S((xs[0], ys[0] - T)); q1 = S((xs[0] + L, ys[0]))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(q0[0] - 4, q0[1] - 4, q1[0] + 4, q1[1] + 4), 12, 12), SP((255, 226, 150), 5, 170 * g * pul))
        h = ease((t - 22.24) / 0.3)
        if h > 0:
            q = S((xs[0] + 6, ys[0] - T)); tx = S((xs[0] + L / 2, 0))[0] + 40
            tag(c, 'NO TABLE UNDER IT', tx, q[1] - 150, h, size=58)
            c.drawLine(q[0] + 30, q[1] - 140, q[0] + 4, q[1] - 60, SP((255, 236, 200), 5, 255 * h))
            c.drawLine(q[0] + 4, q[1] - 60, q[0] - 6, q[1] - 16, SP((255, 236, 200), 5, 255 * h))
            c.drawPath(skia.Path().moveTo(q[0] - 18, q[1] - 26).lineTo(q[0] - 7, q[1] - 12).lineTo(q[0] + 4, q[1] - 28), SP((255, 236, 200), 5, 255 * h))
    # G: the sum in the air above the stack (a fixed band on screen, so it reads the same through the cut in)
    if TG <= t < TH + 0.4:
        fade = 1 - ease((t - TH) / 0.4)
        terms = [('1/2 ×', 24.16), ('(1', 26.24), ('+ 1/2', 26.96), ('+ 1/3', 27.84), ('+ 1/4', 28.64), ('+ 1/5', 28.85), ('+ ...)', 29.05)]
        f = skia.Font(LY.BLACK, 50); widths = [f.measureText(s_ + ' ') for s_, _ in terms]
        x = 540 - sum(widths) / 2; y = 690
        for (s_, ts), w in zip(terms, widths):
            a = (1.0 if t >= TG and ts < TG else ease((t - ts) / 0.25)) * fade
            if a > 0:
                col = (255, 210, 110) if s_ == '1/2 ×' else (255, 246, 228)
                c.drawString(s_, x + 3, y + 4, f, P((10, 8, 20), 180 * a)); c.drawString(s_, x, y, f, P(col, 255 * a))
            x += w
        a = ease((t - 29.68) / 0.3) * fade
        if a > 0:
            n = min(12, 4 + int(max(0.0, t - 30.0) / 2.1 * 8)) if t > 30.0 else 4
            txt = f'1 + 1/2 + ... + 1/{n} = {Wd.H(n):.2f}'
            f2 = skia.Font(LY.XBOLD, 54); w2 = f2.measureText(txt); x2 = 510
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x2 - w2 / 2 - 28, y + 40, x2 + w2 / 2 + 28, y + 124), 34, 34), P((12, 12, 34), 210 * a))
            c.drawString(txt, x2 - w2 / 2, y + 101, f2, P((255, 236, 200), 255 * a))
            ar = ease((t - 30.56) / 0.4)
            if ar > 0:
                gx = x2 + w2 / 2 + 62; bob = 10 * math.sin(t * 4)
                c.drawLine(gx, y + 112, gx, y + 56 - bob, SP((120, 240, 200), 7, 255 * a * ar))
                c.drawPath(skia.Path().moveTo(gx - 16, y + 72 - bob).lineTo(gx, y + 52 - bob).lineTo(gx + 16, y + 72 - bob), SP((120, 240, 200), 7, 255 * a * ar))
    # H, I: the imagined tall stack: WHAT IF count, a big ruler at table height from the edge, 2 BOOKS OUT
    if TH <= t < TLOOP:
        m = ghost_n(t); n = int(round(m))
        a = ease((t - 32.6) / 0.4)
        top = S((E + 0.5 * L * Wd.H(max(4, int(m))) - L / 2, YTT - max(4, int(m)) * T))
        f = skia.Font(LY.XBOLD, 50); txt = f'WHAT IF: {n} BOOKS'
        w = f.measureText(txt); ty = max(560, top[1] - 40); tx = min(max(top[0] - 60, w / 2 + 40), 1040 - w / 2)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(tx - w / 2 - 26, ty - 58, tx + w / 2 + 26, ty + 16), 34, 34), P((12, 12, 34), 215 * a))
        c.drawString(txt, tx - w / 2, ty, f, P((255, 236, 200) if n < 31 else (255, 210, 63), 255 * a))
        r = ease((t - 36.72) / 0.6)
        if r > 0:
            yr = S((0, YTT + 40))[1]; e0 = S((E, 0))[0]; e1 = S((E + L, 0))[0]; e2 = S((E + 2 * L, 0))[0]
            c.drawLine(e0, yr, lerp(e0, e2, r), yr, SP((20, 14, 30), 16, 150)); c.drawLine(e0, yr, lerp(e0, e2, r), yr, SP((255, 226, 150), 8, 240))
            f2 = skia.Font(LY.BLACK, 44)
            for k, xq in enumerate((e0, e1, e2)):
                if lerp(e0, e2, r) >= xq - 1: c.drawLine(xq, yr - 26, xq, yr + 26, SP((255, 226, 150), 8, 240))
            if r > 0.99:
                lab = '2 BOOKS OUT'; wl = f2.measureText(lab); lx = min(1050 - wl, e2 - wl / 2)
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(lx - 18, yr + 30, lx + wl + 18, yr + 92), 30, 30), P((12, 12, 34), 200))
                c.drawString(lab, lx, yr + 78, f2, P((255, 226, 150)))
            if r > 0.99:
                top_y = S((0, YTT - 31 * T))[1]
                pa = skia.Path(); pa.moveTo(e2, yr); pa.lineTo(e2, top_y - 10)
                c.drawPath(pa, SP((255, 226, 150), 4, 190, PathEffect=skia.DashPathEffect.Make([14, 10], 0)))
            reach = ease((t - 38.4) / 0.35)
            if reach > 0 and n >= 31:
                tp = S((E + 0.5 * L * Wd.H(31), YTT - 31 * T + T / 2))
                glow(c, tp[0], tp[1], 90, (255, 214, 120), 220 * reach)


def tag(c, txt, x, y, a, size=30):
    if a <= 0: return
    f = skia.Font(LY.XBOLD, size); w = f.measureText(txt); x = min(max(x, w / 2 + 40), 1040 - w / 2)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x - w / 2 - 20, y - size * 1.2, x + w / 2 + 20, y + size * 0.42), size * 0.75, size * 0.75), P((12, 12, 34), 210 * a))
    c.drawString(txt, x - w / 2, y, f, P((255, 236, 200), 255 * a))


def edge_line(c, S, a, ytop, z, down=False, label=0.0):
    """ONE clear line standing on the table's end edge, labelled TABLE EDGE"""
    ybot = YTT + (520 if down else 140); y1 = lerp(ytop, ybot, a)
    p0 = S((E, ytop)); p1 = S((E, y1))
    c.drawLine(p0[0], p0[1], p1[0], p1[1], SP((255, 236, 190), 16, 70 * a, MaskFilter=blur(7)))
    c.drawLine(p0[0], p0[1], p1[0], p1[1], SP((255, 248, 224), 4.5, 250 * a))
    q0 = S((E, YTT)); glow(c, q0[0], q0[1], 40, (255, 220, 150), 180 * a)
    if label > 0:
        f = skia.Font(LY.XBOLD, 52); s = 'TABLE EDGE'; w = f.measureText(s); lx = p0[0] - w - 26; ly = p0[1] + 46
        if lx < 30: lx = p0[0] + 24
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect(lx - 20, ly - 56, lx + w + 20, ly + 18), 32, 32), P((12, 12, 34), 215 * label))
        c.drawString(s, lx, ly, f, P((255, 236, 200), 255 * label))


def scene(c, t):
    z, cx, cy = cam_for(t)
    xs = Wd.stack_x(offsets(t))
    ghost = ease((t - 32.25) / 0.5) if TH <= t < TLOOP else 0.0
    m = ghost_n(t) if TH <= t < TLOOP else 4.0
    if ghost > 0:                                                          # the ghost stack's top four keep the real offsets
        world_scene(c, t, z, cx, cy, xs, ghost=ghost, m=m)
    else:
        world_scene(c, t, z, cx, cy, xs)
    overlays(c, t, z, cx, cy, xs)


TITLES = [
    (0.0, [[('BOOK STACKING', Wt)], [('PAST THE ', Wt), ('EDGE?', Y)]]),
    (TB, [[('NO GLUE', Wt)], [('CAN SHE ', Wt), ('DO IT?', Y)]]),
    (TC, [[('WEIGHT ABOVE', Wt)], [('OVER THE ', Wt), ('BOOK BELOW', TL)]]),
    (TD, [[('TOP BOOK OUT', Wt)], [('HALF', Y), (' A LENGTH', Wt)]]),
    (15.6, [[('NEXT ONE OUT', Wt)], [('A QUARTER', Y)]]),
    (17.28, [[('THEN', Wt)], [('A SIXTH', Y)]]),
    (18.24, [[('THEN', Wt)], [('AN EIGHTH', Y)]]),
    (19.68, [[('ADD THEM UP', Wt)], [('1/2 + 1/4 + 1/6 + 1/8', Y)]]),
    (20.68, [[('THE TOP BOOK IS', Wt)], [('CLEAR OF THE TABLE', Y)]]),
    (23.2, [[('HALF OF THE', Wt)], [('HARMONIC SERIES', Y)]]),
    (29.68, [[('THE SUM DIVERGES', Y)], [('IT NEVER STOPS GROWING', Wt)]]),
    (32.24, [[('WHAT IF YOU STACK', Wt)], [('ENOUGH BOOKS?', Y)]]),
    (33.28, [[('IT REACHES', Wt)], [('AS FAR AS YOU LIKE', Y)]]),
    (35.28, [[('IT REACHES FAR', Wt)], [('JUST SLOWLY', Y)]]),
    (36.72, [[('TWO FULL', Wt)], [('BOOK LENGTHS', Y)]]),
    (38.4, [[('TWO BOOK LENGTHS', Wt)], [('31 BOOKS', Y)]]),
    (TJ, [[('1 + 1/2 + 1/3 + ...', Y)], [('NEVER STOPS', Wt)]]),
    (TLOOP, [[('BOOK STACKING', Wt)], [('PAST THE ', Wt), ('EDGE?', Y)]]),
]

FIX = {'HALF': 'half'}
def _title_hard(c, lines, t, a, size=92):
    """hard switch: the new title is fully there on its first frame (no blank or faded frame), with a small settle in scale"""
    widest = max(LY.line_width(ln, size) for ln in lines)
    if widest > 960: size = size * 960 / widest
    s = 0.96 + 0.04 * smooth((t - a) / 0.18) if a > 0 else 1.0
    c.save(); c.translate(540, 300); c.scale(s, s); c.translate(-540, -300)
    n = len(lines); y0 = 300 - (n - 1) * size * 0.52 + size * 0.36
    for i, ln in enumerate(lines): LY.rich_line(c, ln, 540, y0 + i * size * 1.04, size, 1.0)
    c.restore()


kit._title_hard = _title_hard
SHORT = Short(WD, 'AP CALCULUS BC', TITLES, scene, DUR, T_END, lift=lambda t: 1.08, fix=FIX)

if __name__ == '__main__':
    out, st = kit.args()
    kit.render(SHORT, out, stills=st, outdir='/home/claude/w1118/stack/out/stills')
