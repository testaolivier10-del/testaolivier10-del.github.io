"""The people of yt-orgo-03 (Shorts people standard: every person is a new design on the front view people model lperson.py;
ship gates 2 and 3 are checked by gate2.py and gate3.py).

INES, the sculptor, about thirty (ref/ines_sheet.png, Figma AI gemini-3.1-flash-image): warm olive brown skin, dark brown hair swept
back into a low bun under a rolled teal bandana, a rust work shirt with the sleeves rolled to the elbow (bare forearms and bare
hands, so the one hand model shows), a brown leather apron, charcoal trousers, brown boots, round welding goggles that sit up on
the bandana (ps.goggles = 0) or down over her eyes (ps.goggles = 1; ps.gog_ref = (colour, 0..1) is what the dark lenses reflect).
She is LEFT HANDED: pencil, scribe and the cloth are in her left hand, which is the arm at SCREEN RIGHT (key 'l').
'ines_day': the same woman in the morning: bandana kept, no apron or goggles, a green work jacket over a cream top, a mustard scarf.
'town_a' (a broad older man, bald with a grey moustache, a long slate coat), 'town_b' (a young woman, long auburn hair, a lilac
cardigan and a skirt), 'town_c' (a young man, dark skin, curly hair, a yellow rain shell and cargo trousers): they only stand and watch.

API (all screen points are in the pixels of the canvas you draw on; a figure is placed by x, ground, s exactly as in draw()):
  draw(c, who, ps, x, ground, s)              draw a person; who is a key of LOOKS
  idle(t, ph=0, look=(0, 0), smile=.1, ...)   a standing Pose with breathing, weight shift, blinks (old API, unchanged)
  face(ps, mood)                              sets an expression on a Pose: 'curious' | 'focused' | 'smile' | 'calm'
  arm_to(ps, side, target, x, ground, s)      two bone IK in the model's plane: puts the WRIST of arm 'l' or 'r' on `target`, elbow
                                              bent the natural way, clamped to the joint limits. Returns the wrist point reached.
  ps.l_tool / ps.r_tool = dict(kind=...)      what the hand holds: 'pencil' | 'scribe' | 'torch' | 'bar' | 'cloth' (+ col=). draw()
                                              layers it with the hand (fingers over it, the pencil's shaft over the web of the thumb).
  tool_tip(ps, side, x, ground, s)            screen point of the pencil or scribe point, the torch nozzle, or the grip (bar, cloth)
  torch_dir(ps)                               unit direction the torch nozzle points, to aim the flame
  hands_only(c, kind, wrist, ang, s, ...)     a bare forearm, the hand and the tool alone, for close shots (same hand model)
  pose_sketch(t, tip, x, ground, s)           pencil in her left hand, its POINT on `tip`; her right hand lies flat on the paper
  pose_scribe(t, tip, x, ground, s)           the steel scribe in her left hand, its diamond point on `tip`
  pose_torch(t, tip, x, ground, s, down=1)    both hands on the cutting torch, the nozzle on `tip`; goggles down
  pose_pull(t, u, x, ground, s)               day outfit: her left fist holds the cloth and pulls it in and down, u from 0 to 1
  pose_watch(t, ph)                           a townsperson standing and watching
Every builder returns a Pose with idle life (breathing, blinks) and the head and eyes on the work; change fields after if needed.

Where the work has to be (Gate 3: only poses a real arm can hold; the builders clamp to these and put what they reached in
ps.reach): for a figure at (x, ground, s) with k = s * bw (bw = LOOKS[who]['cfg']['bw'] = 0.94), in pixels from (x, ground):
  pencil point     dx from 0 to +120 k,      dy from -495 s to -430 s    (a paper on a low bench top seen a little from above: far edge near -600 s, near edge near -420 s)
  scribe point     dx from +290 k to +365 k, dy from -475 s to -450 s    (a plate lying flat or tilted back on a stand at screen right)
  torch nozzle     dx from +200 k to +285 k, dy from -440 s to -405 s    (the same plate; the torch is held low, pointing right and down)
  cloth            her fist goes from about (+370 k, -680 s) at u = 0 to (+225 k, -495 s) at u = 1 on one smooth arc; the scene's cloth ends at tool_tip().
The plate must lie flat or lean back like a drawing board. A plate standing upright and facing the camera beside her cannot be
reached with a natural wrist from this front view (the hand would have to turn thumb down), so that staging is not offered.

Examples
  ps = pose_sketch(t, (1020 + 30 * math.sin(t), 850), 960, 1320, 1.0); draw(c, 'ines', ps, 960, 1320, 1.0)
  tip = tool_tip(ps, 'l', 960, 1320, 1.0)        # equals ps.reach when the point was inside the range
  ps = pose_torch(t, (1200, 900), 960, 1320, 1.0); ps.gog_ref = ((255, 190, 90), 0.8); draw(c, 'ines', ps, 960, 1320, 1.0)
  hands_only(c, 'bar', (700, 620), math.pi / 2, 2.4, side=-1)     # a fist on a cart handle: the bar runs across the fist
"""
import sys, math
sys.path[:0] = ['/home/claude/lv', '/home/claude/short', '/home/claude/guy']
import skia
import lperson as PN
import bhands as H
from guy import Pose, limb
from lpk import P, SP, blur, lerp, mix, smooth, smooth_closed
from art import shaded, tube, op

LOOKS = dict(
    ines=dict(TOP=(206, 94, 54), TOP_SH=(152, 58, 50), TOP_HI=(250, 156, 104), PANT=(66, 70, 84), PANT_SH=(42, 44, 60), PANT_HI=(120, 126, 150),
              SKIN=(192, 130, 90), SKIN_SH=(148, 90, 70), SKIN_HI=(236, 182, 136), HAIR=(54, 36, 32), HAIR_SH=(30, 20, 22), HAIR_HI=(120, 84, 64),
              cfg=dict(bw=0.94, top='uniform', rolled=True, bottom='chinos', hair='lowbun', fem=True, fw=1.04, fl=0.91, head=1.1, armw=0.92, wristw=0.96, lip=(176, 92, 86), eye=1.13,
                       cheek=5.0, blush=30, formsh=60, bandana=(42, 132, 130), goggles=(124, 128, 140), apron=(108, 68, 48),
                       shoe=((126, 80, 54), (86, 52, 42), (58, 42, 40)))),
    ines_day=dict(TOP=(64, 122, 104), TOP_SH=(40, 82, 86), TOP_HI=(140, 200, 172), PANT=(72, 90, 136), PANT_SH=(46, 58, 100), PANT_HI=(130, 150, 200),
                  SKIN=(192, 130, 90), SKIN_SH=(148, 90, 70), SKIN_HI=(236, 182, 136), HAIR=(54, 36, 32), HAIR_SH=(30, 20, 22), HAIR_HI=(120, 84, 64),
                  cfg=dict(bw=0.94, top='jacket', inner=(244, 234, 216), bottom='chinos', hair='lowbun', fem=True, fw=1.04, fl=0.91, head=1.1, lip=(176, 92, 86), eye=1.13, cheek=5.0, blush=30, formsh=60,
                           bandana=(42, 132, 130), scarf=(234, 178, 72), shoe=((126, 80, 54), (86, 52, 42), (58, 42, 40)))),
    town_a=dict(TOP=(96, 108, 132), TOP_SH=(62, 70, 98), TOP_HI=(166, 180, 206), PANT=(58, 56, 66), PANT_SH=(38, 36, 48), PANT_HI=(108, 106, 124),
                SKIN=(238, 192, 164), SKIN_SH=(200, 142, 124), SKIN_HI=(255, 230, 210), HAIR=(196, 194, 196), HAIR_SH=(140, 140, 156), HAIR_HI=(240, 240, 244),
                cfg=dict(bw=1.14, top='coat', inner=(214, 80, 70), bottom='chinos', hair='bald', beard='moustache', fw=1.06, fl=1.0, age=True, shoe=((70, 52, 44), (46, 34, 32), (40, 34, 36)))),
    town_b=dict(TOP=(176, 150, 226), TOP_SH=(124, 100, 180), TOP_HI=(226, 208, 250), PANT=(232, 222, 204), PANT_SH=(184, 170, 164), PANT_HI=(255, 250, 240),
                SKIN=(246, 206, 178), SKIN_SH=(208, 156, 138), SKIN_HI=(255, 238, 222), HAIR=(150, 74, 44), HAIR_SH=(100, 44, 36), HAIR_HI=(220, 136, 84),
                cfg=dict(bw=0.88, top='cardigan', inner=(250, 246, 238), bottom='skirt', tights=(60, 70, 110), hair='long', fem=True, fw=0.98, fl=0.96, head=1.06, lip=(204, 104, 104), eye=1.1, cheek=3.0, blush=24)),
    town_c=dict(TOP=(244, 206, 70), TOP_SH=(196, 150, 50), TOP_HI=(255, 240, 160), PANT=(84, 100, 84), PANT_SH=(56, 68, 62), PANT_HI=(140, 160, 136),
                SKIN=(128, 84, 62), SKIN_SH=(90, 56, 48), SKIN_HI=(178, 130, 100), HAIR=(28, 22, 26), HAIR_SH=(12, 8, 14), HAIR_HI=(84, 72, 80),
                cfg=dict(bw=0.98, top='rain', bottom='cargo', hair='curly', fw=1.0, fl=1.0, head=1.04, eye=1.06)),
)

# hand shapes (the one hand model, bhands.py; curls are thumb, index, middle, ring, little; 0 straight .. 1 curled under)
PINCH = dict(curls=(0.3, 0.5, 0.56, 0.8, 0.84), spread=0.05)        # thumb and index hold the shaft near its point, the middle finger under it
FIST = dict(curls=(0.72, 0.8, 0.82, 0.82, 0.8), spread=0.04)        # closed round a handle
REST = dict(curls=(0.14, 0.12, 0.14, 0.16, 0.2), spread=0.3)        # lying flat on the bench
# joint limits (ship gate 3), degrees
ELBOW_MAX, UP_MIN, UP_MAX = 145.0, -15.0, 150.0                    # the elbow never tucks in across the chest
WR_THUMB, WR_LITTLE = 20.0, 35.0                                      # the wrist bends less toward the thumb than toward the little finger
TIP = dict(pencil=(97.0, 22.0), scribe=(97.0, 22.0), bar=(38.0, 0.0), cloth=(38.0, 0.0))     # in the hand's frame (u along the fingers, v toward the thumb)
TORCH_L, TORCH_HEAD, TORCH_GAP = 250.0, 42.0, 128.0                   # rear palm to the bend, the bent head's length, rear palm to front palm
BOX = dict(pencil=(0, 120, -495, -430), scribe=(290, 365, -475, -450), torch=(200, 285, -440, -405))     # where each tool's working end may be (model units from the feet)


def pose(**kw):
    ps = Pose(); ps.r_hand = PN.RELAX; ps.l_hand = PN.RELAX; ps.head_yaw = 0.0
    for k, v in kw.items(): setattr(ps, k, v)
    return ps


def idle(t, ph=0.0, look=(0.0, 0.0), smile=0.1, yaw=0.0, tilt=0.0, worry=0.0, brow=0.0, lean=0.0, **kw):
    """breathing, a slow weight shift, blinks, a head that drifts a little"""
    br = 0.5 + 0.5 * math.sin(t * 1.5 + ph * 5)
    bl = (t * 0.26 + ph) % 1.0
    lid = 0.06 if bl < 0.03 else (0.55 if bl < 0.045 else 1.0)
    ps = pose(breath=br, sway=-5 + 3 * math.sin(t * 0.3 + ph * 3), lean=lean + 0.5 * math.sin(t * 0.22 + ph), look=look, smile=smile, worry=worry, brow=brow,
              head_yaw=yaw + 0.02 * math.sin(t * 0.41 + ph), head_tilt=tilt + 1.0 * math.sin(t * 0.36 + ph * 2), lid=lid)
    ps.pony_sway = 5 * math.sin(t * 0.9 + ph)
    for k_, v in kw.items(): setattr(ps, k_, v)
    return ps


def face(ps, mood):
    """an expression: 'curious' (brows up, a small open look), 'focused' (brows low, lids a little closed), 'smile' (warm), 'calm'"""
    if mood == 'curious': ps.brow = 2.4; ps.smile = 0.12; ps.worry = 0.2
    elif mood == 'focused': ps.brow = -0.9; ps.smile = 0.0; ps.lid = min(ps.lid, 0.8)
    elif mood == 'smile': ps.brow = 0.6; ps.smile = 0.52                       # a closed, warm smile (above 0.55 the model opens the mouth)
    else: ps.brow = 0.0; ps.smile = 0.1
    return ps


def _cfg(ps, who='ines'):
    if not hasattr(ps, 'cfg'): ps.cfg = LOOKS[who]['cfg']
    return ps.cfg


def _to_model(ps, pt, x, ground, s):
    k = s * _cfg(ps).get('bw', 1.0); return ((pt[0] - x) / k, (pt[1] - ground) / s)


def _to_screen(ps, pt, x, ground, s):
    k = s * _cfg(ps).get('bw', 1.0); return (x + pt[0] * k, ground + pt[1] * s)


def _ik_all(sh, tgt, side):
    """every way a two bone arm can reach tgt from sh inside the joint limits: a list of (score, a_up, a_fore, reached point),
    best first by the natural rule (the elbow hangs low, and out from the ribs rather than inside the chest)"""
    L1, L2 = PN.UPPER, PN.FORE
    dx, dy = tgt[0] - sh[0], tgt[1] - sh[1]; dist = math.hypot(dx, dy) or 1e-6
    dmin = math.sqrt(L1 * L1 + L2 * L2 - 2 * L1 * L2 * math.cos(math.radians(180 - ELBOW_MAX))); dc = max(dmin, min(L1 + L2 - 0.5, dist))
    ux, uy = dx / dist, dy / dist; tgt = (sh[0] + ux * dc, sh[1] + uy * dc)
    a = (L1 * L1 - L2 * L2 + dc * dc) / (2 * dc); h = math.sqrt(max(0.0, L1 * L1 - a * a)); out = []
    for sg in (-1, 1):
        el = (sh[0] + ux * a - uy * h * sg, sh[1] + uy * a + ux * h * sg)
        a1 = math.degrees(math.atan2(side * (el[0] - sh[0]), el[1] - sh[1])); a2 = math.degrees(math.atan2(side * (tgt[0] - el[0]), tgt[1] - el[1]))
        fo = (a2 - a1 + 180) % 360 - 180
        ok = UP_MIN <= a1 <= UP_MAX and abs(fo) <= ELBOW_MAX + 0.01
        out.append((el[1] + 0.35 * side * el[0] + (0 if ok else -1e4), a1, fo, tgt))
    return sorted(out, reverse=True)


def _ik(sh, tgt, side):
    b = _ik_all(sh, tgt, side)[0]; return b[1], b[2], b[3]


def arm_to(ps, side, target, x, ground, s, who='ines', bend=None):
    """puts the wrist of arm `side` ('l' = her left arm, at screen right; 'r' = her right arm) on the screen point `target`.
    Set sway, lean, breath and sh_r on the pose first (they move the shoulder). Returns the screen point the wrist reached.
    bend: None takes the natural elbow (low, out from the ribs) for this target alone; for a MOVE pass +1 (forearm swings outward
    from the upper arm) or -1 (inward) on every frame, so the elbow never flips side in the middle of the move."""
    _cfg(ps, who); sd = 1 if side == 'l' else -1
    sols = _ik_all(PN.skel(ps)[side], _to_model(ps, target, x, ground, s), sd)
    if bend is not None: sols = sorted(sols, key=lambda q: (q[0] < -5e3, -bend * q[2]))
    _, up, fo, got = sols[0]
    if side == 'l': ps.l_up, ps.l_fore = up, fo
    else: ps.r_up, ps.r_fore = up, fo
    return _to_screen(ps, got, x, ground, s)


def _aim_hand(ps, side, ang):
    """turns the hand so its fingers point along `ang` (degrees from straight down, + = out to that arm's side), within the
    wrist's real range (a hand that points down turns outward toward its little finger, inward toward its thumb);
    returns how far past the range the asked direction was (0 when the pose is possible)"""
    up, fo = (ps.l_up, ps.l_fore) if side == 'l' else (ps.r_up, ps.r_fore)
    want = (ang - up - fo + 180) % 360 - 180
    got = max(-WR_THUMB, min(WR_LITTLE, want))
    if side == 'l': ps.l_wrist = got
    else: ps.r_wrist = got
    return want - got


def _place(ps, side, pt_hand, target, hand_ang, x, ground, s, iters=30):
    """IK so that the point pt_hand = (u, v) of the hand's frame lands on the screen point target, the fingers along hand_ang.
    Of the two ways the elbow can bend it takes the natural one (low elbow); the other only if the first cannot reach."""
    tg = _to_model(ps, target, x, ground, s); sd = 1 if side == 'l' else -1; res = []
    for pick in (0, 1):
        wr = tg; over = 0.0
        for _ in range(iters):
            sols = _ik_all(PN.skel(ps)[side], wr, sd); sc, up, fo, got = sols[min(pick, len(sols) - 1)]
            if side == 'l': ps.l_up, ps.l_fore = up, fo
            else: ps.r_up, ps.r_fore = up, fo
            over = _aim_hand(ps, side, hand_ang)
            A = PN.arm_pts(ps, side); p = PN.hand_pt(ps, side, *pt_hand)
            wr = (A['wr'][0] + 0.7 * (tg[0] - p[0]), A['wr'][1] + 0.7 * (tg[1] - p[1]))
        miss = math.hypot(p[0] - tg[0], p[1] - tg[1])
        res.append((sc < -5e3, miss > 0.5, pick, (ps.l_up, ps.l_fore, ps.l_wrist) if side == 'l' else (ps.r_up, ps.r_fore, ps.r_wrist), abs(over)))
        if not res[-1][0] and not res[-1][1]: break
    best = min(res)
    if side == 'l': ps.l_up, ps.l_fore, ps.l_wrist = best[3]
    else: ps.r_up, ps.r_fore, ps.r_wrist = best[3]
    ps.wrist_over = max(getattr(ps, 'wrist_over', 0.0), best[4])
    return _to_screen(ps, PN.hand_pt(ps, side, *pt_hand), x, ground, s)


# ------------------------------------------------------------------------------------------------ the tools
def _frame(hw, ang, ts, hs, nar):
    ca, sa = math.cos(ang), math.sin(ang)
    return lambda u, v: (hw[0] + hs * (u * ca - v * nar * ts * sa), hw[1] + hs * (u * sa + v * nar * ts * ca))


def _rod(c, a, b, w, col, sh, hi):
    """a round rod from a to b: a body, a shaded lower edge and a lit line"""
    dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1; nx, ny = -dy / L, dx / L
    if ny < 0: nx, ny = -nx, -ny
    c.drawLine(a[0], a[1], b[0], b[1], skia.Paint(AntiAlias=True, Color=skia.Color(int(col[0]), int(col[1]), int(col[2])), Style=skia.Paint.kStroke_Style, StrokeWidth=w, StrokeCap=skia.Paint.kButt_Cap))
    c.drawLine(a[0] + nx * w * 0.3, a[1] + ny * w * 0.3, b[0] + nx * w * 0.3, b[1] + ny * w * 0.3, skia.Paint(AntiAlias=True, Color=skia.Color(int(sh[0]), int(sh[1]), int(sh[2]), 220), Style=skia.Paint.kStroke_Style, StrokeWidth=w * 0.34, StrokeCap=skia.Paint.kButt_Cap))
    c.drawLine(a[0] - nx * w * 0.24, a[1] - ny * w * 0.24, b[0] - nx * w * 0.24, b[1] - ny * w * 0.24, skia.Paint(AntiAlias=True, Color=skia.Color(int(hi[0]), int(hi[1]), int(hi[2]), 200), Style=skia.Paint.kStroke_Style, StrokeWidth=w * 0.18, StrokeCap=skia.Paint.kButt_Cap))


def _stick(kind, part):
    """a pencil or a scribe in a pinch grip. part 'under': from the point back to the pinch (the fingers lie over it);
    part 'over': from the pinch back over the web of the thumb (it lies on top of the hand)"""
    def f(c, hw, ang, ts, hs, nar):
        W = _frame(hw, ang, ts, hs, nar); tip = TIP[kind]; back = (-14.0, 27.0); pin = 0.26       # the pinch, as a fraction of the way back from the point
        Q = lambda u: W(lerp(tip[0], back[0], u), lerp(tip[1], back[1], u))
        w = 8.6 * hs
        if kind == 'pencil': body, bsh, bhi = (240, 188, 62), (190, 132, 48), (255, 232, 150)
        else: body, bsh, bhi = (176, 184, 202), (112, 120, 146), (240, 244, 252)
        if part == 'under':
            c.drawLine(*Q(0.02), *Q(pin + 0.06), SP((30, 14, 40), w * 1.2, 60, MaskFilter=blur(3)))
            _rod(c, Q(0.13), Q(pin + 0.08), w, body, bsh, bhi)
            cone = skia.Path(); a_, b_ = Q(0.13), Q(0.0); dx, dy = b_[0] - a_[0], b_[1] - a_[1]; L = math.hypot(dx, dy) or 1; nx, ny = -dy / L, dx / L
            cone.moveTo(a_[0] + nx * w / 2, a_[1] + ny * w / 2); cone.lineTo(*b_); cone.lineTo(a_[0] - nx * w / 2, a_[1] - ny * w / 2); cone.close()
            c.drawPath(cone, P((228, 192, 150) if kind == 'pencil' else (150, 158, 178)))
            m_ = Q(0.045); lead = skia.Path(); lead.moveTo(m_[0] + nx * w * 0.17, m_[1] + ny * w * 0.17); lead.lineTo(*b_); lead.lineTo(m_[0] - nx * w * 0.17, m_[1] - ny * w * 0.17); lead.close()
            c.drawPath(lead, P((60, 60, 70) if kind == 'pencil' else (236, 250, 255)))
            if kind == 'scribe': c.drawCircle(b_[0], b_[1], 2.2 * hs, P((255, 255, 255))); c.drawCircle(b_[0], b_[1], 6 * hs, P((190, 240, 255), 90, MaskFilter=blur(3)))
        else:
            c.drawLine(*Q(pin + 0.04), *Q(1.0), SP((30, 14, 40), w * 1.1, 70, MaskFilter=blur(3.5)))
            _rod(c, Q(pin + 0.02), Q(0.9 if kind == 'pencil' else 1.0), w, body, bsh, bhi)
            if kind == 'pencil':
                _rod(c, Q(0.9), Q(0.95), w * 1.04, (186, 192, 206), (120, 126, 150), (240, 244, 252)); _rod(c, Q(0.95), Q(1.0), w, (232, 128, 128), (184, 86, 96), (255, 190, 186))
            else:
                for u in (0.5, 0.56, 0.62, 0.68): a_, b_ = Q(u), Q(u + 0.03); _rod(c, a_, b_, w * 1.08, (134, 142, 166), (90, 96, 124), (210, 216, 232))      # the knurled grip
    return f


def _bar(col=(150, 156, 176), length=150.0, w=27.0):
    """a round bar that runs across the fist (along v), seen on both sides of it"""
    def f(c, hw, ang, ts, hs, nar):
        W = _frame(hw, ang, ts, hs, nar); a_, b_ = W(TIP['bar'][0], -length / 2), W(TIP['bar'][0], length / 2)
        c.drawLine(a_[0] + 3, a_[1] + 6, b_[0] + 3, b_[1] + 6, SP((20, 14, 40), w * hs, 70, MaskFilter=blur(5)))
        _rod(c, a_, b_, w * hs, col, mix(col, (30, 30, 70), 0.42), mix(col, (255, 255, 255), 0.6))
    return f


def _cloth(col=(226, 222, 212), toward=-1):
    """a gathered fold of cloth through the fist: a short tuft out of one side, the cloth leaving the other side.
    toward: -1 the cloth leaves on the little finger side (default), +1 on the thumb side"""
    def f(c, hw, ang, ts, hs, nar):
        W = _frame(hw, ang, ts, hs, nar); u0 = TIP['cloth'][0]; sh = mix(col, (60, 60, 110), 0.38); hi = mix(col, (255, 255, 255), 0.6); t_ = toward
        tuft = smooth_closed([W(u0 - 13, -t_ * 14), W(u0 - 20, -t_ * 40), W(u0 - 8, -t_ * 58), W(u0 + 8, -t_ * 52), W(u0 + 18, -t_ * 36), W(u0 + 13, -t_ * 14)])
        out = smooth_closed([W(u0 - 13, t_ * 12), W(u0 - 26, t_ * 44), W(u0 - 34, t_ * 78), W(u0 + 34, t_ * 78), W(u0 + 26, t_ * 44), W(u0 + 13, t_ * 12)])
        for p_ in (out, tuft): shaded(c, p_, col, sh, sh=(-5, -3), rimL=hi, rl=(2, 2))
        for dv in (-6, 4): a_, b_ = W(u0 + dv, t_ * 18), W(u0 + dv * 3.2, t_ * 74); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(sh, 2.6 * hs, 170))
        a_, b_ = W(u0, -t_ * 18), W(u0 - 4, -t_ * 48); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(sh, 2.4 * hs, 150))
    return f


def _torch_geo(ps):
    """the torch's line in MODEL units from the two palms: rear palm (her right fist), the axis, the bend and the nozzle tip"""
    g0 = PN.hand_pt(ps, 'r', 38, 0); g1 = PN.hand_pt(ps, 'l', 38, 0)
    dx, dy = g1[0] - g0[0], g1[1] - g0[1]; L = math.hypot(dx, dy) or 1; ax = (dx / L, dy / L); n = (-ax[1], ax[0])
    if n[1] < 0: n = (-n[0], -n[1])                                           # the head bends toward the floor side
    hd = getattr(ps, 'torch_down', 1.0); c_, s_ = math.cos(math.radians(72 * hd)), math.sin(math.radians(72 * hd))
    hdir = (ax[0] * c_ + n[0] * s_, ax[1] * c_ + n[1] * s_)
    bend = (g0[0] + ax[0] * TORCH_L, g0[1] + ax[1] * TORCH_L); tip = (bend[0] + hdir[0] * TORCH_HEAD, bend[1] + hdir[1] * TORCH_HEAD)
    return dict(g0=g0, ax=ax, n=n, bend=bend, tip=tip, hdir=hdir)


def _torch(ps):
    """the cutting torch, drawn once under both hands: brass handle with two valves, two gas tubes and the cutting oxygen lever,
    the bent head and its copper nozzle, two hoses trailing down from the back end"""
    def f(c, hw, ang, ts, hs, nar):
        G = _torch_geo(ps); g0, ax, n = G['g0'], G['ax'], G['n']
        A = lambda u, v=0.0: (g0[0] + ax[0] * u + n[0] * v, g0[1] + ax[1] * u + n[1] * v)
        BR, BR_SH, BR_HI = (214, 168, 78), (150, 104, 58), (255, 228, 150); ST, ST_SH, ST_HI = (170, 178, 196), (108, 116, 142), (236, 240, 250)
        for col, v0, k in (((196, 60, 56), -6, 0.0), ((66, 150, 96), 6, 1.0)):                               # hoses: acetylene red, oxygen green
            p0 = A(-62, v0); hp = skia.Path(); hp.moveTo(*p0); hp.cubicTo(p0[0] - 60, p0[1] + 30 + 20 * k, p0[0] - 120 + 30 * k, p0[1] + 230, p0[0] - 150 + 40 * k, p0[1] + 520)
            c.drawPath(hp, SP(mix(col, (20, 10, 40), 0.45), 15)); c.drawPath(hp, SP(col, 10)); c.drawPath(hp, SP(mix(col, (255, 255, 255), 0.45), 2.4, 150))
        c.drawLine(*A(-60, 5), *A(TORCH_L, 5), SP((20, 14, 40), 34, 60, MaskFilter=blur(6)))
        for v0 in (-6, 6): _rod(c, A(-70, v0), A(-52, v0), 11, ST, ST_SH, ST_HI)                              # hose nuts
        _rod(c, A(-54), A(70), 31, BR, BR_SH, BR_HI)                                                          # the handle
        for u in (-34, -22, -10, 2, 14, 26, 38, 50): a_, b_ = A(u, -14), A(u, 14); c.drawLine(a_[0], a_[1], b_[0], b_[1], SP(BR_SH, 2.2, 150))
        for u, v0 in ((-44, -22), (-44, 22)):                                                                 # two valve knobs
            q_ = A(u, v0); c.drawCircle(q_[0], q_[1], 11, P(ST_SH)); c.drawCircle(q_[0] - 1.5, q_[1] - 1.5, 8.5, P(ST)); c.drawCircle(q_[0] - 3, q_[1] - 3, 3, P(ST_HI))
        _rod(c, A(70), A(92), 36, BR, BR_SH, BR_HI)                                                           # the mixer body
        _rod(c, A(92, -8), A(TORCH_L, -8), 10, ST, ST_SH, ST_HI); _rod(c, A(92, 8), A(TORCH_L + 4, 8), 10, ST, ST_SH, ST_HI)   # two gas tubes
        lv = skia.Path(); lv.moveTo(*A(74, -20)); lv.lineTo(*A(150, -30)); lv.lineTo(*A(196, -24)); c.drawPath(lv, SP(ST_SH, 9)); c.drawPath(lv, SP(ST, 5))   # the cutting oxygen lever
        b, hd = G['bend'], G['hdir']; hb = skia.Path(); hb.moveTo(*A(TORCH_L - 10)); hb.quadTo(b[0] + ax[0] * 12, b[1] + ax[1] * 12, b[0] + hd[0] * 14, b[1] + hd[1] * 14)
        c.drawPath(hb, SP(BR_SH, 30)); c.drawPath(hb, SP(BR, 22))
        p0 = (b[0] + hd[0] * 12, b[1] + hd[1] * 12); p1 = (b[0] + hd[0] * (TORCH_HEAD - 2), b[1] + hd[1] * (TORCH_HEAD - 2)); hn = (-hd[1], hd[0])
        nz = skia.Path(); nz.moveTo(p0[0] + hn[0] * 12, p0[1] + hn[1] * 12); nz.lineTo(p1[0] + hn[0] * 6, p1[1] + hn[1] * 6); nz.lineTo(p1[0] - hn[0] * 6, p1[1] - hn[1] * 6); nz.lineTo(p0[0] - hn[0] * 12, p0[1] - hn[1] * 12); nz.close()
        shaded(c, nz, (206, 122, 78), (140, 76, 60), sh=(-3, -2), rimL=(255, 196, 150), rl=(1.5, 1.5))        # the copper nozzle
    return f


def _hold(ps, side, tool):
    """wires a tool into the pose: the item callbacks the model draws with the hand, and the hand's shape"""
    kind = tool['kind']; hp = FIST
    if kind in ('pencil', 'scribe'):
        setattr(ps, side + '_item', _stick(kind, 'under')); setattr(ps, side + '_item_over', _stick(kind, 'over')); hp = PINCH
    elif kind == 'bar': setattr(ps, side + '_item', _bar(tool.get('col', (150, 156, 176)), tool.get('length', 150.0), tool.get('w', 27.0)))
    elif kind == 'cloth': setattr(ps, side + '_item', _cloth(tool.get('col', (226, 222, 212)), tool.get('toward', -1)))
    elif kind == 'torch' and side == 'l': ps.l_item = _torch(ps)             # drawn once, under the front hand; the rear hand is drawn over it after
    hp = dict(hp, creases=False) if hp is FIST else hp
    if side == 'l': ps.l_hand = hp
    else: ps.r_hand = hp


def _wire(ps):
    fr = set(getattr(ps, 'front', ()))
    for side in ('l', 'r'):
        tool = getattr(ps, side + '_tool', None)
        if tool: _hold(ps, side, tool); fr.add(side)
    if fr: ps.front = tuple(sorted(fr))                                       # 'l' is drawn before 'r'


def tool_tip(ps, side, x, ground, s, who='ines'):
    """the screen point of the tool's working end for a pose drawn at (x, ground, s): the pencil or scribe point, the torch
    nozzle (side is ignored for the torch), or the middle of the grip for a bar or a cloth"""
    _cfg(ps, who); _wire(ps); tool = getattr(ps, side + '_tool', None) or getattr(ps, 'l_tool', None) or getattr(ps, 'r_tool', None)
    kind = tool['kind']
    if kind == 'torch': return _to_screen(ps, _torch_geo(ps)['tip'], x, ground, s)
    return _to_screen(ps, PN.hand_pt(ps, side, *TIP[kind]), x, ground, s)


def torch_dir(ps):
    """the unit direction the nozzle points (screen space), so the scene can aim the flame"""
    h = _torch_geo(ps)['hdir']; bw = _cfg(ps).get('bw', 1.0); L = math.hypot(h[0] * bw, h[1]) or 1
    return (h[0] * bw / L, h[1] / L)


def draw(c, who, ps, x, ground, s):
    for k, v in LOOKS[who].items():
        if k != 'cfg': setattr(PN, k, v)
    ps.cfg = LOOKS[who]['cfg']; _wire(ps)
    PN.draw(c, ps, x=x, ground=ground, s=s)


def hands_only(c, kind, wrist, ang, s, side=1, who='ines', forearm=300.0, tool=None, hand=None, sleeve=False):
    """a bare forearm, the hand and what it holds, alone, for a close shot. wrist: screen point; ang: the direction the fingers
    point (radians, screen space; the forearm comes from the opposite side, out of frame); s: scale (1 = the size in a figure
    drawn at s = 1); side: +1 thumb on the clockwise side, -1 mirrored; kind: 'bar' | 'pencil' | 'scribe' | 'cloth' | 'none'.
    Returns a function W(u, v) from the hand's frame to the screen (the tool's working end is W(*TIP[kind]))."""
    L = LOOKS[who]; SK, SH_, HI = L['SKIN'], L['SKIN_SH'], L['SKIN_HI']; hs = 1.22 * s; tool = dict(tool or {}, kind=kind)
    hp = hand or (PINCH if kind in ('pencil', 'scribe') else (PN.RELAX if kind == 'none' else dict(FIST, creases=False)))
    nar = lerp(0.72, 1.0, min(1.0, max(0.0, 1 - (hp['curls'][2] - 0.05) / 0.5)))
    d = (math.cos(ang), math.sin(ang)); far = (wrist[0] - d[0] * forearm * s, wrist[1] - d[1] * forearm * s); hw = (wrist[0] + d[0] * 6 * s, wrist[1] + d[1] * 6 * s)
    cfg = L['cfg']; fa = limb(far, (wrist[0] + d[0] * 5 * s, wrist[1] + d[1] * 5 * s), 64 * cfg.get('armw', 1.0) * s, 45 * cfg.get('wristw', 1.0) * s, bulge=5 * s, bu=0.3, side=-side)
    q_ = skia.Path(fa); q_.offset(6 * s, 9 * s); c.drawPath(q_, P((20, 12, 40), 70, MaskFilter=blur(8 * s ** 0.5)))
    shaded(c, fa, SK, SH_, sh=(6 * s, 5 * s), rimL=HI, rl=(-3 * s, -3 * s))
    if sleeve:                                                                # the rolled sleeve, when the elbow end is in frame
        T_, TS, TH = L['TOP'], L['TOP_SH'], L['TOP_HI']
        c.save(); c.translate(far[0] + d[0] * 30 * s, far[1] + d[1] * 30 * s); c.rotate(math.degrees(ang)); c.scale(s, s)
        band = skia.Path(); band.addRoundRect(skia.Rect(-60, -38, 15, 38), 12, 12); c.drawPath(band, P(mix(T_, TH, 0.22))); c.drawLine(12, -34, 12, 34, SP(TS, 3, 150)); c.drawLine(-3, -36, -3, 36, SP(TS, 2.4, 150)); c.restore()
    if kind in ('pencil', 'scribe'): _stick(kind, 'under')(c, hw, ang, side, hs, nar)
    elif kind == 'bar': _bar(tool.get('col', (150, 156, 176)), tool.get('length', 150.0), tool.get('w', 27.0))(c, hw, ang, side, hs, nar)
    elif kind == 'cloth': _cloth(tool.get('col', (226, 222, 212)), tool.get('toward', -1))(c, hw, ang, side, hs, nar)
    H.hand(c, hw, ang, side, hs, skin=SK, shade=SH_, hi=HI, light=PN.LIGHT, narrow=nar, **hp)
    if kind in ('pencil', 'scribe'): _stick(kind, 'over')(c, hw, ang, side, hs, nar)
    return _frame(hw, ang, side, hs, nar)


# ------------------------------------------------------------------------------------------------ pose builders
def _clampbox(ps, pt, x, ground, s, kind):
    dx0, dx1, dy0, dy1 = BOX[kind]; k = s * _cfg(ps).get('bw', 1.0)
    return (max(x + dx0 * k, min(x + dx1 * k, pt[0])), max(ground + dy0 * s, min(ground + dy1 * s, pt[1])))


def _work(t, ph=0.0, who='ines'):
    """a standing pose with slow breathing and blinks, ready to bend to the work"""
    ps = idle(t, ph); ps.cfg = LOOKS[who]['cfg']
    ps.sway = -3 + 2 * math.sin(t * 0.27 + ph); ps.lean = 0.4 * math.sin(t * 0.2 + ph)
    return ps


def _look_at(ps, tip, x, ground, s, pitch=0.8):
    """head and eyes on a screen point: the head turns a little and tips down, the eyes go the rest of the way"""
    m = _to_model(ps, tip, x, ground, s); dx = m[0] / 300.0
    ps.head_yaw = max(-0.5, min(0.5, dx * 0.55)); ps.head_pitch = pitch; ps.head_tilt = 3.0 * max(-1, min(1, dx)); ps.look = (max(-1, min(1, dx * 1.3)), 1.0)
    ps.lid = min(ps.lid, 0.74)                                                # looking down, the lids come down with the eyes
    return ps


def pose_sketch(t, tip, x, ground, s, who='ines'):
    """Ines draws: the pencil in her left hand with its point on `tip`, her right hand flat on the paper to hold it.
    The scene moves `tip` along the line being drawn; the wrist and elbow follow. ps.reach is the point the pencil reached."""
    ps = _work(t, 0.0, who); ps.lean += 1.2
    tip = _clampbox(ps, tip, x, ground, s, 'pencil')
    ps.l_tool = dict(kind='pencil'); _hold(ps, 'l', ps.l_tool)
    ps.reach = _place(ps, 'l', TIP['pencil'], tip, -14 + 3 * math.sin(t * 2.1), x, ground, s)
    k = s * ps.cfg['bw']; rest = (x - 150 * k + 1.5 * math.sin(t * 0.5) * k, ground - 500 * s)                       # the other hand holds the paper still
    ps.r_hand = REST; _place(ps, 'r', (40.0, 0.0), rest, 12.0, x, ground, s)
    ps.front = ('l', 'r'); _look_at(ps, ps.reach, x, ground, s, 0.9); face(ps, 'calm'); ps.brow = -0.3
    return ps


def pose_scribe(t, tip, x, ground, s, who='ines'):
    """Ines marks the steel: the scribe in her left hand, its diamond point on `tip` on a plate that lies flat or leans back on
    a stand at screen right; she leans a little toward it and her right hand rests on the bench. ps.reach is the point reached."""
    ps = _work(t, 0.4, who)
    tip = _clampbox(ps, tip, x, ground, s, 'scribe')
    m = _to_model(ps, tip, x, ground, s); far = smooth((m[0] - 300) / 120.0)
    ps.lean += 2.0 + 4.5 * far; ps.sway = 4 + 8 * far                                                              # she shifts her weight toward the plate to reach
    ps.l_tool = dict(kind='scribe'); _hold(ps, 'l', ps.l_tool)
    ps.reach = _place(ps, 'l', TIP['scribe'], tip, 30 + 12 * far + 2.0 * math.sin(t * 1.9), x, ground, s)
    k = s * ps.cfg['bw']; ps.r_hand = REST; _place(ps, 'r', (40.0, 0.0), (x - 150 * k, ground - 500 * s), 10.0, x, ground, s)
    ps.front = ('l', 'r'); _look_at(ps, ps.reach, x, ground, s, 0.8); face(ps, 'focused')
    return ps


def pose_torch(t, tip, x, ground, s, down=1.0, who='ines', goggles=1.0, tilt=10.0):
    """Ines cuts: her right fist on the torch handle in front of her, her left fist forward on the gas tubes, the bent head's
    nozzle on `tip`, the torch pointing to screen right and `tilt` degrees down. goggles 1 = down over her eyes.
    ps.reach is the nozzle point reached; torch_dir(ps) is where the nozzle points; set ps.gog_ref for the flame in the lenses."""
    ps = _work(t, 0.8, who); ps.goggles = goggles; ps.torch_down = down
    tip = _clampbox(ps, tip, x, ground, s, 'torch')
    ps.l_tool = dict(kind='torch'); ps.r_tool = dict(kind='torch'); _hold(ps, 'r', ps.r_tool); _hold(ps, 'l', ps.l_tool)
    m0 = _to_model(ps, tip, x, ground, s); far = smooth((m0[0] - 200) / 110.0); ps.lean += 2.0 + 3.5 * far; ps.sway = 3 + 7 * far
    th = math.radians(tilt + 1.0 * math.sin(t * 1.3)); ax = (math.cos(th), math.sin(th)); n = (-ax[1], ax[0])
    hd = math.radians(72 * down); hdir = (ax[0] * math.cos(hd) + n[0] * math.sin(hd), ax[1] * math.cos(hd) + n[1] * math.sin(hd))
    k = s * ps.cfg['bw']; S_ = lambda p: (x + p[0] * k, ground + p[1] * s); m = m0
    for _ in range(3):                                                        # the palms sit on the torch's line; the line ends at the nozzle
        bend = (m[0] - hdir[0] * TORCH_HEAD, m[1] - hdir[1] * TORCH_HEAD); g0 = (bend[0] - ax[0] * TORCH_L, bend[1] - ax[1] * TORCH_L); g1 = (g0[0] + ax[0] * TORCH_GAP, g0[1] + ax[1] * TORCH_GAP)
        _place(ps, 'r', (38.0, 0.0), S_(g0), math.degrees(th), x, ground, s); _place(ps, 'l', (38.0, 0.0), S_(g1), -math.degrees(th), x, ground, s)
        got = _torch_geo(ps)['tip']; m = (m[0] + m0[0] - got[0], m[1] + m0[1] - got[1])
    ps.front = ('l', 'r'); ps.reach = tool_tip(ps, 'l', x, ground, s, who)
    _look_at(ps, ps.reach, x, ground, s, 0.75); face(ps, 'focused')
    return ps


def pose_pull(t, u, x, ground, s, who='ines_day', col=(226, 222, 212)):
    """the unveiling: her left fist (screen right) holds a fold of the cover and pulls it toward herself and down as u goes
    0 -> 1; her weight goes onto the far leg and she leans away from the pull. The scene's cloth ends at tool_tip(ps, 'l', ...)
    and leaves the fist up and to screen right. Give u an eased, continuous value (one move, no stops)."""
    ps = idle(t, 0.3); ps.cfg = LOOKS[who]['cfg']; u = max(0.0, min(1.0, u)); e = smooth(u)
    ps.sway = lerp(7, -13, e) + 1.5 * math.sin(t * 0.3); ps.lean = lerp(2.5, -3.5, e) + 0.3 * math.sin(t * 0.25)
    ps.l_tool = dict(kind='cloth', col=col, toward=-1); _hold(ps, 'l', ps.l_tool)
    k = s * ps.cfg['bw']                                                       # the wrist travels on an arc, in and down; the fist follows the forearm
    wx = lerp(318, 196, e); wy = lerp(-668, -536, e) - 26 * math.sin(math.pi * e)
    arm_to(ps, 'l', (x + wx * k, ground + wy * s), x, ground, s, who, bend=1); ps.l_wrist = lerp(8.0, 0.0, e)
    ps.reach = tool_tip(ps, 'l', x, ground, s, who)
    ps.front = ('l',)
    ps.head_yaw = lerp(0.42, 0.2, e); ps.look = (lerp(0.9, 0.5, e), lerp(-0.4, -0.1, e)); ps.head_tilt = lerp(4, 1, e); face(ps, 'smile'); ps.smile = lerp(0.3, 0.54, e)
    return ps


def pose_watch(t, ph=0.0, look=(0.0, -0.3), smile=0.5):
    """a townsperson watching the unveiling: standing, breathing, blinking, a small head move"""
    ps = idle(t, ph, look=look, smile=smile); ps.head_yaw = 0.12 * math.sin(t * 0.33 + ph * 4); ps.brow = 0.4 + 0.3 * math.sin(t * 0.2 + ph)
    return ps


# ------------------------------------------------------------------------------------------------ samples for the gate checks
_GX, _GG, _GS = 520, 1130, 1.0
def _box_pt(kind, a, b):
    dx0, dx1, dy0, dy1 = BOX[kind]; k = _GS * 0.94
    return (_GX + (dx0 + (dx1 - dx0) * a) * k, _GG + (dy0 + (dy1 - dy0) * b) * _GS)
def gate_samples():
    """every pose the video can use, sampled over time, for gate2.py and gate3.py: (name, who, pose, x, ground, s, target, side)"""
    out = []
    for i in range(30):
        t = i * 0.37; ps = idle(t, ph=i * 0.13, yaw=0.5 * math.sin(i * 0.7), tilt=5 * math.sin(i * 0.4), look=(math.sin(i), math.cos(i * 1.3)), smile=0.5 + 0.5 * math.sin(i * 0.9), talk=max(0, math.sin(i * 2.1)), head_pitch=0.5 * max(0, math.sin(i * 0.3)), lean=3 * math.sin(i * 0.2))
        ps.goggles = 0.5 + 0.5 * math.sin(i * 0.5); face(ps, ('curious', 'focused', 'smile', 'calm')[i % 4]); out.append(('idle', 'ines', ps, _GX, _GG, _GS, None, None))
        ps2 = idle(t, ph=i * 0.2, yaw=0.4 * math.sin(i * 0.6), smile=0.5 + 0.5 * math.sin(i)); out.append(('idle_day', 'ines_day', ps2, _GX, _GG, _GS, None, None))
    for kind, fn in (('pencil', pose_sketch), ('scribe', pose_scribe), ('torch', pose_torch)):
        for i in range(48):
            t = i * 0.21; a = 0.5 + 0.5 * math.sin(i * 0.45); b = 0.5 + 0.5 * math.cos(i * 0.31)
            if i < 4: a, b = (0, 0, 1, 1)[i], (0, 1, 0, 1)[i]                 # the four corners of the work area
            tg = _box_pt(kind, a, b); ps = fn(t, tg, _GX, _GG, _GS); out.append((kind, 'ines', ps, _GX, _GG, _GS, tg, 'l'))
    for i in range(40):
        u = i / 39; ps = pose_pull(i * 0.11, u, _GX, _GG, _GS); out.append(('pull', 'ines_day', ps, _GX, _GG, _GS, None, 'l'))
    for who in ('town_a', 'town_b', 'town_c'):
        for i in range(20): out.append((who, who, pose_watch(i * 0.41, ph=i * 0.17), _GX, _GG, _GS, None, None))
    return out
