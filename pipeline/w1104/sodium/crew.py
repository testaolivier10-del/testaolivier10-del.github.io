"""The crew's actions done right (Olivier 2026-11-05: hands must touch what they push; nothing moves by itself).
Drums stand upright and are walked to the edge on their bottom rim by a worker whose hands stay on the drum's upper
side every frame (the arm angle is solved per frame so the wrist sits on the drum), then tipped over the edge; the
worker lets go only as it tips. The shooter holds a rifle whose stock sits at his shoulder and whose barrel rests in
both hands; flashes come from its muzzle."""
import math
import skia
import airman2 as A2
from kit import P, SP, blur, smooth, lerp

GROUND = 760
EDGE = 410            # drum centre x where it tips over the edge
DS = 1.25             # drum scale: 115 px tall, about half a man's height
HALF_H, HALF_W = 46 * DS, 34 * DS
CY = GROUND - HALF_H
SPEED = 150.0         # px per second while walking a drum


def drum_state(t, ts, xs, x1, y1, ground=GROUND, ds=DS):
    """a drum walked from xs to the edge starting at ts, tipped over and dropped onto the ice at (x1, y1)"""
    dur = (EDGE - xs) / SPEED
    cy = ground - 46 * ds
    base = dict(ground=ground, ds=ds, dur=dur, ts=ts)
    u = t - ts
    if u < 0: return dict(base, cx=xs, cy=cy, ang=0.0, ph='wait', d=0.0)
    if u < dur:
        return dict(base, cx=xs + SPEED * u, cy=cy, ang=-10 * smooth(u / 0.25), ph='push', d=SPEED * u)
    g = u - dur
    if g < 0.3:
        k = g / 0.3
        return dict(base, cx=EDGE + 34 * k, cy=cy + 12 * k * k, ang=lerp(-10, 55, k * k), ph='tip', d=EDGE - xs, g=g)
    f = g - 0.3
    x = EDGE + 34 + 120 * f; y = cy + 12 + 140 * f + 900 * f * f
    if y >= y1: return dict(base, cx=x1, cy=y1, ang=90.0, ph='landed', d=EDGE - xs, g=g)
    return dict(base, cx=x, cy=y, ang=55 + 420 * f, ph='fall', d=EDGE - xs, g=g)


def contact(st):
    """world point on the drum's upper left side where the hands push"""
    a = math.radians(st['ang']); lx, ly = -34 * st['ds'], -46 * st['ds'] * 0.72
    return (st['cx'] + lx * math.cos(a) - ly * math.sin(a), st['cy'] + lx * math.sin(a) + ly * math.cos(a))


def walk_legs(d, stride=46.0):
    ph = d / stride * math.pi
    s = math.sin(ph)
    return dict(thigh_n=10 + 14 * s, knee_n=-10 - 14 * max(0.0, -s), thigh_f=10 - 14 * s, knee_f=-10 - 14 * max(0.0, s))


def push_pose(who, hand, d, lean=40, ground=GROUND):
    """solve the arm so the near wrist sits on the drum at `hand`; return (x, pose kwargs)"""
    legs = walk_legs(d)
    lo, hi = 0.0, 150.0
    kw = None; hx = 0.0
    for _ in range(20):
        mid = (lo + hi) / 2
        kw = dict(face=1, lean=lean, neck=26, uarm_n=mid, elbow_n=16, uarm_f=mid - 5, elbow_f=20, hand_n='flat', hand_f='flat', **legs)
        ps = A2.Pose(x=0, ground=ground, **kw); J = who.joints(ps)
        hx, hy = who.canvas_pt(ps, J['hand_n'][0])
        if hy > hand[1]: lo = mid
        else: hi = mid
    return hand[0] - 5 - hx, kw


def walker(who, d, face):
    return dict(face=face, lean=4, uarm_n=12 * math.sin(d / 46 * math.pi), elbow_n=20, uarm_f=-12 * math.sin(d / 46 * math.pi), elbow_f=20, **walk_legs(d))


def draw_man(c, who, x, kw, light=(0.75, -0.65), ground=GROUND):
    ps = A2.Pose(x=x, ground=ground, **kw)
    who.draw(c, ps, light=light)
    return ps


def pusher(c, who, t, st, retreat_x=None):
    """the worker for drum state st: hands on the drum while it is walked to the edge; as it tips he lets go, his arms
    following through, then he straightens up and stays at the edge watching"""
    g0 = st['ground']
    if st['ph'] in ('wait', 'push'):
        x, kw = push_pose(who, contact(st), st['d'], ground=g0)
        draw_man(c, who, x, kw, ground=g0); return
    end = dict(st, cx=EDGE, cy=g0 - 46 * st['ds'], ang=-10, ph='push')
    x, kw = push_pose(who, contact(end), st['d'], ground=g0)
    k = smooth(st.get('g', 1.0) / 0.9)          # follow through, then stand up
    kw = dict(kw)
    kw['uarm_n'] = lerp(kw['uarm_n'] + 10, 14, k); kw['lean'] = lerp(34, 6, k); kw['elbow_n'] = lerp(10, 24, k)
    kw['uarm_f'] = lerp(kw['uarm_f'] + 10, 10, k)
    legs = walk_legs(st['d']); kw.update({kk: lerp(v, 6 if 'thigh' in kk else -6, k) for kk, v in legs.items()})
    g = st.get('g', 0.0)
    if retreat_x is not None and g > 0.9:       # he turns and walks back from the edge, out of the next man's way
        dist = min(x - retreat_x, (g - 0.9) * 110)
        if dist < x - retreat_x:
            draw_man(c, who, x - dist, walker(who, dist, -1), ground=g0); return
        kw = dict(face=1, lean=4, uarm_n=8, elbow_n=20, uarm_f=6, elbow_f=20, thigh_n=6, knee_n=-6, thigh_f=6, knee_f=-6)
        draw_man(c, who, retreat_x, kw, ground=g0); return
    draw_man(c, who, x, kw, ground=g0)


_RCACHE = {}


def _arm_to(who, base_kw, side, target, ground):
    """grid search the shoulder and elbow angles so the wrist of arm `side` ('n' or 'f') reaches target"""
    best = None
    for ua in range(0, 181, 6):
        for el in range(0, 151, 6):
            kw = dict(base_kw); kw['uarm_' + side] = ua; kw['elbow_' + side] = el
            ps = A2.Pose(x=0, ground=ground, **kw); J = who.joints(ps)
            hx, hy = who.canvas_pt(ps, J['hand_' + side][0])
            d = (hx - target[0]) ** 2 + (hy - target[1]) ** 2
            if best is None or d < best[0]: best = (d, ua, el)
    return best[1], best[2], best[0] ** 0.5


def rifleman(c, who, x, t, aim=1.0, ground=GROUND, target=(760, 1100)):
    """a worker shouldering a rifle: the stock against his shoulder, the near hand under the fore-end, the far hand on
    the grip; aim 0 = carried pointing at the ground, 1 = aimed down at the drums on the ice. Returns the muzzle."""
    base = dict(face=1, lean=lerp(4, 12, aim), neck=lerp(10, 18, aim), thigh_n=12, knee_n=-6, thigh_f=-8, knee_f=-4,
                hand_n='grip', hand_f='grip')
    ps0 = A2.Pose(x=0, ground=ground, **base); J0 = who.joints(ps0)
    sh = who.canvas_pt(ps0, (J0['sh'][0] + 34, J0['sh'][1] + 8))      # the far (right) shoulder takes the stock
    # barrel direction: from pointing at the ground (carried) to aimed at the target
    ax, ay = target[0] - (x + sh[0]), target[1] - sh[1]; L = math.hypot(ax, ay) or 1
    aim_ang = math.atan2(ay / L, ax / L); low = math.radians(75)
    ang = lerp(low, aim_ang, aim)
    ux, uy = math.cos(ang), math.sin(ang)
    stock = (sh[0] - ux * 8, sh[1] - uy * 8)
    key = (id(who), round(aim, 1), ground)
    if key not in _RCACHE:
        grip = (sh[0] + ux * 30, sh[1] + uy * 30 + 4)
        fore = (sh[0] + ux * 78, sh[1] + uy * 78 + 3)
        ua_n, el_n, _ = _arm_to(who, base, 'n', fore, ground)      # near (left) hand under the fore-end
        ua_f, el_f, _ = _arm_to(who, base, 'f', grip, ground)      # far (right) hand on the grip, behind the body
        _RCACHE[key] = (ua_n, el_n, ua_f, el_f)
    ua_n, el_n, ua_f, el_f = _RCACHE[key]
    kw = dict(base, uarm_n=ua_n, elbow_n=el_n, uarm_f=ua_f, elbow_f=el_f)
    ps = A2.Pose(x=x, ground=ground, **kw)
    S = (x + stock[0], stock[1]); M = (x + sh[0] + ux * 150, sh[1] + uy * 150)
    # the rifle drawn between the far arm and the body: wooden stock and fore-end, dark barrel
    c.drawLine(S[0], S[1], M[0], M[1], SP((34, 30, 28), 5))
    c.drawLine(S[0], S[1], S[0] + ux * 58, S[1] + uy * 58, SP((112, 74, 44), 10))
    c.drawLine(S[0] + ux * 66, S[1] + uy * 66, S[0] + ux * 104, S[1] + uy * 104, SP((112, 74, 44), 7))
    who.draw(c, ps)
    return M
