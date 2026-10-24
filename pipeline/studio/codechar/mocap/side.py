"""Side view of a CMU take, aligned so the walk (or the body's facing) points to screen +x, y down.
Near side = the subject's LEFT (a figure facing right shows the viewer its left side)."""
import numpy as np, mocap as M


def side(code, heading_from=None):
    b = M.load(code); P = b.positions()                       # (F, J, 3), Y up
    ix = b.ix
    lat = P[:, ix['LeftUpLeg']] - P[:, ix['RightUpLeg']]      # points to the subject's left
    lat[:, 1] = 0
    lat = lat.mean(0) if heading_from is None else lat[heading_from[0]:heading_from[1]].mean(0)
    lat /= np.linalg.norm(lat)
    up = np.array([0, 1.0, 0])
    fwd = np.cross(lat, up)                                    # left x up = backward or forward? check below
    # make fwd agree with the direction the toes point
    toe = (P[:, ix['LeftToeBase']] - P[:, ix['LeftFoot']]).mean(0); toe[1] = 0
    if fwd @ toe < 0: fwd = -fwd
    S = np.stack([P @ fwd, -P[..., 1]], -1)                    # screen x (forward), y (down)
    depth = P @ lat                                            # + = toward the subject's left (near side)
    return b, S, depth


if __name__ == '__main__':
    import sys
    from PIL import Image, ImageDraw
    code = sys.argv[1]
    b, S, D = side(code)
    ix = b.ix
    bones = [('Hips', 'LowerBack'), ('LowerBack', 'Spine1'), ('Spine1', 'Neck'), ('Neck', 'Head'), ('Head', 'Head_end'),
             ('LeftUpLeg', 'LeftLeg'), ('LeftLeg', 'LeftFoot'), ('LeftFoot', 'LeftToeBase'),
             ('RightUpLeg', 'RightLeg'), ('RightLeg', 'RightFoot'), ('RightFoot', 'RightToeBase'),
             ('LeftArm', 'LeftForeArm'), ('LeftForeArm', 'LeftHand'), ('RightArm', 'RightForeArm'), ('RightForeArm', 'RightHand')]
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 12
    fr = np.linspace(0, b.nf - 1, n).astype(int)
    ymin, ymax = S[..., 1].min(), S[..., 1].max()
    sc = 300 / (ymax - ymin)
    W = 260
    im = Image.new('RGB', (W * n, 360), (235, 235, 235)); d = ImageDraw.Draw(im)
    for k, f in enumerate(fr):
        hx = S[f, ix['Hips'], 0]
        for a, c in bones:
            near = a.startswith('Left')
            p, q = S[f, ix[a]], S[f, ix[c]]
            P1 = (k * W + W / 2 + (p[0] - hx) * sc, 20 + (p[1] - ymin) * sc)
            Q1 = (k * W + W / 2 + (q[0] - hx) * sc, 20 + (q[1] - ymin) * sc)
            d.line([P1, Q1], fill=(200, 60, 40) if near else ((90, 90, 160) if a.startswith('Right') else (30, 30, 30)), width=4)
        d.text((k * W + 6, 4), f'{f / b.fps:.1f}s', fill=(0, 0, 0))
    im.save(f'side_{code}.png')
    hip = S[:, ix['Hips']]
    print('hip x travel', round(hip[-1, 0] - hip[0, 0], 1), 'leg', round(np.median(np.linalg.norm(S[:, ix['LeftUpLeg']] - S[:, ix['LeftFoot']], axis=-1)), 2))
    v = np.gradient(hip[:, 0]) * b.fps
    for t in np.arange(0, b.nf / b.fps, 0.5):
        f = int(t * b.fps)
        print(f'{t:4.1f}s hip vx {v[f]:6.1f}  Lfoot y {S[f, ix["LeftFoot"], 1]:6.1f} Rfoot y {S[f, ix["RightFoot"], 1]:6.1f}  Lx {S[f, ix["LeftFoot"], 0]:7.1f} Rx {S[f, ix["RightFoot"], 0]:7.1f}')
