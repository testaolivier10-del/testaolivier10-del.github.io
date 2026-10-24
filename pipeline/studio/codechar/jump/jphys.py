"""Physics of the recorded jump (CMU 13_11 on the girl rig): CoM path, touchdown, stop time, F = m(g + a)."""
import sys
sys.path.insert(0, '/home/claude/runner'); sys.path.insert(0, '/home/claude/mocap'); sys.path.insert(0, '/home/claude/rig'); sys.path.insert(0, '/home/claude/jump/side')
import numpy as np
import model, mocap_perf as MP, perf, phys
from scipy.signal import butter, filtfilt
HZ = 120
def run(t0=0.8, t1=3.6, near='Left'):
    TK = MP.Take('13_11', near=near); perf.repair(TK)
    rig, spec, joints, radius = model.build()
    P = MP.MocapPerformer(rig, spec, lambda t: [('a', TK, t0 + t, 1.0)], ground_take=TK)
    rows = []
    for i in range(int((t1 - t0) * HZ)):
        W = P.pose(i / HZ)
        c = phys.com(rig, W)
        rows.append((t0 + i / HZ, c[0] + 0 * P.x, c[1], P.lock_w['near'], P.lock_w['far'], P.x))
    return np.array(rows), rig, P
if __name__ == '__main__':
    R, rig, P = run()
    t, cy = R[:, 0], R[:, 2]
    b, a = butter(2, 8 / (HZ / 2))
    yf = filtfilt(b, a, cy)
    v = np.gradient(yf, 1 / HZ); acc = np.gradient(v, 1 / HZ)   # rig y is DOWN
    air = (R[:, 3] < 0.5) & (R[:, 4] < 0.5)
    idx = np.nonzero(air)[0]; print('airborne', round(t[idx[0]], 3), '->', round(t[idx[-1]], 3))
    # gravity from the flight parabola
    fl = idx[3:-3]
    pp = np.polyfit(t[fl], cy[fl], 2); g_px = 2 * pp[0]
    pxm_leg = (model.TH_L + model.SHIN_L) / 0.85
    print('g from flight px/s2', round(g_px), 'px/m by g', round(g_px / 9.81), 'px/m by leg', round(pxm_leg))
    td = idx[-1] + 1
    vy_td = v[td] ; print('touchdown t', round(t[td], 3), 'vy (down +) m/s', round(vy_td / pxm_leg, 2), round(vy_td / (g_px / 9.81), 2))
    stop = td + np.argmax(v[td:] <= 0); print('CoM stops t', round(t[stop], 3), 'stop time s', round(t[stop] - t[td], 3))
    pxm = g_px / 9.81
    F = np.maximum(0, 1 - acc / g_px)     # F/mg = 1 + a_up/g ; a_up = -acc (rig y down)
    print('peak F/mg after touchdown', round(F[td:td + 60].max(), 2), 'at', round(t[td + np.argmax(F[td:td + 60])], 3))
    print('F/mg in flight (should be ~0)', round(F[fl].mean(), 2))
    for k in range(td - 12, stop + 40, 6): print(round(t[k], 3), 'F', round(F[k], 2), 'vy', round(v[k] / pxm, 2), 'y', round(cy[k]), R[k, 3:5].round(2))
    np.save('jphys.npy', np.c_[t, cy, yf, v, acc, F, R[:, 3:]])
