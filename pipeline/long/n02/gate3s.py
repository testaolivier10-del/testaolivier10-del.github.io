"""Ship gate 3 for the story of yt-nremt-02, on the rig values of every pose the story draws (the samples of gate2s.py): elbow
bend 0 to 145 degrees; upper arm inside the shoulder's range (-15 to 150 from straight down); wrist bend inside 60 back and 70
forward for a hand placed on something and 20 / 35 sideways for a hanging hand; finger curls 0 to 1; bone lengths within
2 percent of rest on what was DRAWN (a forearm pointing at the camera is checked against its foreshortened length); head turn
within the model's range and tilt under 40 degrees. Prints the worst value per joint."""
import sys, math
sys.path[:0] = ['/home/claude/lv', '/home/claude/short', '/home/claude/guy']
import skia
import cast as CA, nperson as PN
from gate2s import samples
W = dict(elbow=0.0, up_max=-999.0, up_min=999.0, wrist=0.0, bone=0.0, curl=0.0, yaw=0.0, tilt=0.0)
fails = []; n = 0; S_ = skia.Surface(1300, 1300)
for (k, t, tag, name, ps, x, g, s) in samples():
    n += 1; c = S_.getCanvas(); mid = getattr(ps, 'mid', None); ps.mid = None; CA.draw(c, name, ps, 650, 1180, 0.9); ps.mid = mid
    for key in ('l', 'r'):
        up, fo, wr = (ps.l_up, ps.l_fore, ps.l_wrist) if key == 'l' else (ps.r_up, ps.r_fore, ps.r_wrist)
        W['elbow'] = max(W['elbow'], abs(fo)); W['up_max'] = max(W['up_max'], up); W['up_min'] = min(W['up_min'], up); W['wrist'] = max(W['wrist'], abs(wr))
        if abs(fo) > 145.01: fails.append((k, t, tag, key, 'elbow', round(fo)))
        if not (CA.UP_MIN - 0.01 <= up <= CA.UP_MAX + 0.01): fails.append((k, t, tag, key, 'shoulder', round(up)))
        if wr < -60.01 or wr > 70.01: fails.append((k, t, tag, key, 'wrist', round(wr)))
        A = PN.arm_pts(ps, key); el, w_ = ps._dbg[key]; fz = getattr(ps, key + '_fz', 0.0)
        for a_, b_, L in ((A['sh'], el, PN.UPPER), (el, w_, PN.FORE * (1 - 0.66 * fz))):
            e = abs(math.hypot(b_[0] - a_[0], b_[1] - a_[1]) / L - 1) * 100; W['bone'] = max(W['bone'], e)
            if e > 2: fails.append((k, t, tag, key, 'bone length %', round(e, 1)))
        hp = ps.l_hand if key == 'l' else ps.r_hand; W['curl'] = max(W['curl'], max(hp['curls']))
        if max(hp['curls']) > 1 or min(hp['curls']) < 0: fails.append((k, t, tag, key, 'finger curl', hp['curls']))
    W['yaw'] = max(W['yaw'], abs(getattr(ps, 'head_yaw', 0.0))); W['tilt'] = max(W['tilt'], abs(ps.head_tilt))
    if abs(getattr(ps, 'head_yaw', 0.0)) > 1.0 or abs(ps.head_tilt) > 40: fails.append((k, t, tag, 'head', round(ps.head_tilt)))
print('gate 3:', n, 'poses checked,', len(fails), 'failed')
print('worst values: elbow bend %.0f (limit 145) | upper arm %.0f to %.0f (limit -15 to 150) | wrist %.0f (limit 60 back, 70 forward) | bone length error %.3f%% (limit 2) | largest finger curl %.2f | head turn %.2f of the model range, tilt %.0f deg (limit 40)' % (W['elbow'], W['up_min'], W['up_max'], W['wrist'], W['bone'], W['curl'], W['yaw'], W['tilt']))
seen = set()
for f in fails:
    if (f[2], f[3], f[4]) in seen: continue
    seen.add((f[2], f[3], f[4])); print('  FAIL', f)
