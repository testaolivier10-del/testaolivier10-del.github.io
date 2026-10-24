"""LevlPrep studio motion references (2026-10-21, studio system section 4).

Real human motion for 2D rigs, never hand keyed: the free Carnegie Mellon motion capture library (BVH files,
public on GitHub at una-dinosauria/cmu-mocap; CMU and the converter allow any use), read with forward
kinematics, viewed from the side or front, and turned into bone angle tracks for skin.js.

    from studio import mocap as M
    mo = M.load("15_06")                                   # downloads and caches data/015/15_06.bvh
    print(M.search("lean forward"))                         # index of the whole library
    clip = M.to_clip(mo, rig_bones, MAP, view="side", t0=1.2, t1=4.0, fps_out=30, smooth=2)

MAP says which mocap joints define each rig bone: {"spine": ("Hips", "Spine1"), "uarm": ("RightArm", "RightForeArm"), ...}.
The rig bone's angle each frame is the angle of that joint pair in the chosen view, written as an offset from
the rig's rest angle, so any rest pose works. Root motion comes from the hips.
Pose tracking from video (YOLO pose, weights from GitHub) produces the same joint tracks, so both sources
drive rigs the same way (pose_from_video below).
"""
import math, os, re, json, subprocess
import numpy as np

CACHE = "/home/claude/mocap/cache"
RAW = "https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/master"


def _get(rel, dst):
    if not os.path.exists(dst):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        subprocess.run(["curl", "-sfL", "-o", dst, f"{RAW}/{rel}"], check=True)
    return dst


def search(words):
    idx = _get("cmu-mocap-index-text.txt", f"{CACHE}/index.txt")
    ws = words.lower().split()
    return [l.strip() for l in open(idx, errors="ignore") if re.match(r"^\d+_\d+", l) and all(w in l.lower() for w in ws)]


class BVH:
    def __init__(self, text):
        tok = text.split()
        i = 0
        self.joints, self.parent, self.offset, self.channels, stack = [], [], [], [], []
        while True:
            t = tok[i]
            if t in ("ROOT", "JOINT"):
                name = tok[i + 1]; i += 2
                self.joints.append(name); self.parent.append(stack[-1] if stack else -1)
                self.offset.append(None); self.channels.append([])
                stack.append(len(self.joints) - 1)
            elif t == "End":
                name = self.joints[stack[-1]] + "_end"; i += 2
                self.joints.append(name); self.parent.append(stack[-1]); self.offset.append(None); self.channels.append([])
                stack.append(len(self.joints) - 1)
            elif t == "OFFSET":
                self.offset[stack[-1]] = [float(tok[i + 1]), float(tok[i + 2]), float(tok[i + 3])]; i += 4
            elif t == "CHANNELS":
                n = int(tok[i + 1]); self.channels[stack[-1]] = tok[i + 2:i + 2 + n]; i += 2 + n
            elif t == "}":
                stack.pop(); i += 1
            elif t == "MOTION":
                break
            else:
                i += 1
        nf = int(tok[tok.index("Frames:", i) + 1]); ft = float(tok[tok.index("Time:", i) + 1])
        start = tok.index("Time:", i) + 2
        nch = sum(len(c) for c in self.channels)
        self.data = np.array(tok[start:start + nf * nch], float).reshape(nf, nch)
        self.fps = 1.0 / ft; self.nf = nf
        self.ix = {n: k for k, n in enumerate(self.joints)}

    def positions(self):
        """World positions of every joint, every frame: (frames, joints, 3), in the file's units (CMU: inches/ish)."""
        nf, nj = self.nf, len(self.joints)
        P = np.zeros((nf, nj, 3)); Rm = np.zeros((nf, nj, 3, 3))
        col = 0
        chans = []
        for j in range(nj):
            chans.append((col, self.channels[j])); col += len(self.channels[j])
        for j in range(nj):
            c0, ch = chans[j]
            off = np.array(self.offset[j] or [0, 0, 0], float)
            R = np.tile(np.eye(3), (nf, 1, 1)); tr = np.zeros((nf, 3))
            for k, name in enumerate(ch):
                v = self.data[:, c0 + k]
                if name.endswith("position"):
                    tr[:, "XYZ".index(name[0])] = v
                else:
                    a = np.radians(v); c, s = np.cos(a), np.sin(a)
                    M = np.tile(np.eye(3), (nf, 1, 1))
                    if name[0] == "X": M[:, 1, 1], M[:, 1, 2], M[:, 2, 1], M[:, 2, 2] = c, -s, s, c
                    if name[0] == "Y": M[:, 0, 0], M[:, 0, 2], M[:, 2, 0], M[:, 2, 2] = c, s, -s, c
                    if name[0] == "Z": M[:, 0, 0], M[:, 0, 1], M[:, 1, 0], M[:, 1, 1] = c, -s, s, c
                    R = R @ M
            p = self.parent[j]
            if p < 0:
                P[:, j] = off + tr; Rm[:, j] = R
            else:
                P[:, j] = P[:, p] + np.einsum("fij,j->fi", Rm[:, p], off)
                Rm[:, j] = Rm[:, p] @ R
        return P


def load(code):
    a, b = code.split("_")
    path = _get(f"data/{int(a):03d}/{code}.bvh", f"{CACHE}/{code}.bvh")
    return BVH(open(path).read())


def _view(P, view, facing=1):
    """3D -> 2D screen (x right, y down). side: we look along X so the body's forward (+Z in CMU) points right."""
    if view == "side":
        x, y = P[..., 2] * facing, -P[..., 1]
    elif view == "front":
        x, y = P[..., 0] * facing, -P[..., 1]
    else:
        raise ValueError(view)
    return np.stack([x, y], -1)


def _smooth(a, k):
    if k <= 0: return a
    w = np.exp(-0.5 * (np.arange(-3 * k, 3 * k + 1) / k) ** 2); w /= w.sum()
    pad = np.pad(a, (3 * k, 3 * k), mode="edge")
    return np.convolve(pad, w, mode="valid")


def to_clip(bvh, rig_bones, MAP, view="side", facing=1, t0=0.0, t1=None, fps_out=30, smooth=2, scale=None,
            root_joint="Hips", root_scale=1.0, time_scale=1.0, at=0.0):
    """Bone tracks for skin.js. Angles are the WORLD angle of each mapped joint pair minus the parent bone's
    world angle (so a child follows its parent like in the rig), minus the rest offset. Returns the clip's
    'bones' and 'root' dicts. time_scale > 1 slows the motion down; at shifts it to start later."""
    P = bvh.positions()
    S = _view(P, view, facing)
    f0 = int(t0 * bvh.fps); f1 = int((t1 if t1 is not None else bvh.nf / bvh.fps) * bvh.fps)
    S = S[f0:f1]
    n_out = int((f1 - f0) / bvh.fps * time_scale * fps_out)
    src_t = np.arange(len(S)) / bvh.fps * time_scale
    out_t = np.arange(n_out) / fps_out
    B = {b["id"]: b for b in rig_bones}

    def world_angle(pair):
        a, b = bvh.ix[pair[0]], bvh.ix[pair[1]]
        d = S[:, b] - S[:, a]
        return np.unwrap(np.arctan2(d[:, 1], d[:, 0]))

    def rest_angle(bid):
        b = B[bid]; return math.atan2(b["tail"][1] - b["head"][1], b["tail"][0] - b["head"][0])

    wa = {bid: world_angle(pair) for bid, pair in MAP.items()}
    tracks = {}
    for bid in MAP:
        par = B[bid].get("parent")
        # walk up to the nearest mapped ancestor
        while par is not None and par not in MAP: par = B[par].get("parent")
        rel = wa[bid] - (wa[par] if par else 0)
        rest_rel = rest_angle(bid) - (rest_angle(par) if par else 0)
        off = np.degrees(rel - rest_rel)
        off = (off + 180) % 360 - 180
        off = np.degrees(np.unwrap(np.radians(off)))
        off = _smooth(off, smooth)
        v = np.interp(out_t, src_t, off)
        tracks[bid] = [[round(at + t, 4), round(float(x), 3), "linear"] for t, x in zip(out_t, v)]
    hip = S[:, bvh.ix[root_joint]]
    if scale is None:
        # fit: mocap spine length to the rig's mapped spine length
        scale = 1.0
        for bid, pair in MAP.items():
            L_rig = math.dist(B[bid]["head"], B[bid]["tail"])
            a, b = bvh.ix[pair[0]], bvh.ix[pair[1]]
            L_mo = np.median(np.linalg.norm(S[:, b] - S[:, a], axis=1))
            if L_mo > 1e-6: scale = L_rig / L_mo; break
    d = (hip - hip[0]) * scale * root_scale
    dx = np.interp(out_t, src_t, _smooth(d[:, 0], smooth)); dy = np.interp(out_t, src_t, _smooth(d[:, 1], smooth))
    root = [[round(at + t, 4), round(float(x), 2), round(float(y), 2), "linear"] for t, x, y in zip(out_t, dx, dy)]
    return dict(bones=tracks, root=root, scale=scale, frames=n_out)
