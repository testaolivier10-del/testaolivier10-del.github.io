"""Ship gate 3, automatic part, on the rig values of every pose the video uses (the same samples as gate2.py):
elbow 0 to 145 degrees; the upper arm inside the shoulder's range, and for the work poses no higher than 65 degrees out from
the body (no raised elbow at a bench); wrist 20 degrees toward the thumb, 35 toward the little finger; finger curls 0 to 1 with
the thumb opposing (the pinch and the fist of bhands.py); bone lengths within 2 percent of rest, measured on what was DRAWN;
the pencil, scribe and torch points on their targets within 1 px; the torch crossing each fist within 35 degrees of square;
elbows of arms held in front never past the body's midline, hanging arms outside the torso. Prints the worst value per joint."""
import sys, math
sys.path[:0] = ['/home/claude/lv', '/home/claude/short', '/home/claude/guy']
import skia
import cast as CA, lperson as PN
samples = CA.gate_samples
W = dict(elbow=0.0, up_max=-999.0, up_min=999.0, up_work=0.0, wr_thumb=0.0, wr_little=0.0, bone=0.0, miss=0.0, grip=0.0, mid=999.0, hang=999.0, curl=0.0)
fails = []; n = 0
S_ = skia.Surface(1200, 1200)
for name, who, ps, x, g, s, tg, side in samples():
    n += 1; c = S_.getCanvas(); CA.draw(c, who, ps, x, g, s)
    front = getattr(ps, 'front', ())
    for key in ('l', 'r'):
        up, fo, wr = (ps.l_up, ps.l_fore, ps.l_wrist) if key == 'l' else (ps.r_up, ps.r_fore, ps.r_wrist); sd = 1 if key == 'l' else -1
        W['elbow'] = max(W['elbow'], abs(fo)); W['up_max'] = max(W['up_max'], up); W['up_min'] = min(W['up_min'], up)
        if abs(fo) > 145.01: fails.append((name, n, key, 'elbow', round(fo)))
        if not (CA.UP_MIN - 0.01 <= up <= CA.UP_MAX + 0.01): fails.append((name, n, key, 'shoulder', round(up)))
        if name in ('pencil', 'scribe', 'torch'):
            W['up_work'] = max(W['up_work'], up)
            if up > 65: fails.append((name, n, key, 'raised elbow', round(up)))
        if key in front or name in ('pencil', 'scribe', 'torch', 'pull'):
            W['wr_thumb'] = max(W['wr_thumb'], -wr); W['wr_little'] = max(W['wr_little'], wr)
            if wr < -20.01 or wr > 35.01: fails.append((name, n, key, 'wrist', round(wr)))
        A = PN.arm_pts(ps, key); el, w_ = ps._dbg[key]
        for a_, b_, L in ((A['sh'], el, PN.UPPER), (el, w_, PN.FORE)):
            e = abs(math.hypot(b_[0] - a_[0], b_[1] - a_[1]) / L - 1) * 100; W['bone'] = max(W['bone'], e)
            if e > 2: fails.append((name, n, key, 'bone length %', round(e, 1)))
        if math.hypot(A['el'][0] - el[0], A['el'][1] - el[1]) > 0.01 or math.hypot(A['wr'][0] - w_[0], A['wr'][1] - w_[1]) > 0.01: fails.append((name, n, key, 'helper and drawing differ'))
        hp = ps.l_hand if key == 'l' else ps.r_hand
        cm = max(max(hp['curls']) - 1, -min(hp['curls'])); W['curl'] = max(W['curl'], max(hp['curls']))
        if cm > 0: fails.append((name, n, key, 'finger curl', hp['curls']))
        if key in front:
            m = sd * (el[0] - PN.skel(ps)['chest'][0]); W['mid'] = min(W['mid'], m)
            if m < 0: fails.append((name, n, key, 'elbow past the midline', round(m)))
        elif name != 'pull' or key == 'r':
            hgap = sd * (w_[0] - PN.skel(ps)['chest'][0]); W['hang'] = min(W['hang'], hgap)
            if hgap < 80: fails.append((name, n, key, 'hanging hand inside the torso', round(hgap)))
    if tg is not None:
        tip = CA.tool_tip(ps, 'l', x, g, s); e = math.hypot(tip[0] - tg[0], tip[1] - tg[1]); W['miss'] = max(W['miss'], e)
        if e > 1.0: fails.append((name, n, 'tool point off target px', round(e, 2)))
    if name == 'torch':
        G = CA._torch_geo(ps)
        for key in ('l', 'r'):
            A = PN.arm_pts(ps, key); f = (math.cos(A['ang']), math.sin(A['ang'])); d = abs(f[0] * G['ax'][0] + f[1] * G['ax'][1]); ob = math.degrees(math.asin(min(1, d))); W['grip'] = max(W['grip'], ob)
            if ob > 35: fails.append((name, n, key, 'torch not square in the fist', round(ob)))
print('gate 3:', n, 'poses checked,', len(fails), 'failed')
print('worst values: elbow bend %.0f (limit 145) | upper arm %.0f to %.0f (limit -35 to 150), at the bench %.0f (limit 65) | wrist %.0f toward the thumb (limit 20), %.0f toward the little finger (limit 35)' % (W['elbow'], W['up_min'], W['up_max'], W['up_work'], W['wr_thumb'], W['wr_little']))
print('bone length error %.3f%% (limit 2) | tool point off target %.2f px (limit 1) | torch off square in a fist %.0f deg (limit 35) | front elbow to midline %.0f units (must be > 0) | hanging wrist from chest centre %.0f units (must be > 80) | largest finger curl %.2f' % (W['bone'], W['miss'], W['grip'], W['mid'], W['hang'], W['curl']))
for f in fails[:40]: print('  FAIL', f)
