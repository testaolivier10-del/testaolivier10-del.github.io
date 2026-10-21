"""LevlPrep studio rig builder (2026-10-21, studio system section 3).

Turns layered vector art plus a skeleton into rig data for skin.js:
  - every path is converted to absolute cubic beziers and long curves are split, so a joint bend stays smooth;
  - every point (anchors and handles) gets weights for at most 2 bones, falling off with distance to each bone
    segment in the rest pose, restricted to the bones that part may follow (a sleeve follows the arm, never
    the head), so a bent elbow curves like a real arm instead of two pieces pinned together.

    from studio import skin
    rig = skin.build(bones, parts, max_seg=22)        # bones: [dict(id, parent, head, tail)] parents first
    json.dump(rig, open("rig.json", "w"))              # parts: [dict(id, d, fill, bones=[...], z=0)]
"""
import json, math
import numpy as np
from svgpathtools import parse_path, Line, CubicBezier, QuadraticBezier, Arc


def _cubics(d):
    """Absolute cubic segments grouped into subpaths: [(closed, [(p0, c1, c2, p3), ...])]."""
    path = parse_path(d)
    subs, cur, start = [], [], None
    for seg in path:
        if cur and abs(seg.start - cur[-1][3]) > 1e-6:          # a jump means a new subpath
            subs.append(cur); cur = []
        if isinstance(seg, Line):
            a, b = seg.start, seg.end
            cur.append((a, a + (b - a) / 3, a + 2 * (b - a) / 3, b))
        elif isinstance(seg, QuadraticBezier):
            p0, q, p2 = seg.start, seg.control, seg.end
            cur.append((p0, p0 + 2 / 3 * (q - p0), p2 + 2 / 3 * (q - p2), p2))
        elif isinstance(seg, CubicBezier):
            cur.append((seg.start, seg.control1, seg.control2, seg.end))
        elif isinstance(seg, Arc):
            n = max(2, int(seg.length() / 20))
            pts = [seg.point(i / n) for i in range(n + 1)]
            for a, b in zip(pts[:-1], pts[1:]):
                cur.append((a, a + (b - a) / 3, a + 2 * (b - a) / 3, b))
    if cur: subs.append(cur)
    out = []
    for s in subs:
        closed = abs(s[0][0] - s[-1][3]) < 1e-3
        out.append((closed, s))
    return out


def _split(seg, max_len):
    p0, c1, c2, p3 = seg
    approx = abs(c1 - p0) + abs(c2 - c1) + abs(p3 - c2)
    if approx <= max_len: return [seg]
    # de Casteljau at t = 0.5
    m01, m12, m23 = (p0 + c1) / 2, (c1 + c2) / 2, (c2 + p3) / 2
    a, b = (m01 + m12) / 2, (m12 + m23) / 2
    m = (a + b) / 2
    return _split((p0, m01, a, m), max_len) + _split((m, b, m23, p3), max_len)


def _seg_dist(p, a, b):
    ab = b - a; L2 = float(ab @ ab) + 1e-9
    t = np.clip(((p - a) @ ab) / L2, 0, 1)
    q = a + t[:, None] * ab
    return np.linalg.norm(p - q, axis=1)


def build(bones, parts, max_seg=22.0, falloff=4.0, soft=10.0, prefix="rig"):
    B = {b["id"]: b for b in bones}
    out_parts = []
    for part in sorted(parts, key=lambda p: p.get("z", 0)):
        subs = _cubics(part["d"])
        pts, sub_meta = [], []
        for closed, segs in subs:
            segs2 = []
            for s in segs: segs2 += _split(s, max_seg)
            pts.append(segs2[0][0])
            for (_, c1, c2, p3) in segs2: pts += [c1, c2, p3]
            sub_meta.append(dict(n=len(segs2), closed=bool(closed)))
        P = np.array([[z.real, z.imag] for z in pts], np.float64)
        allowed = part.get("bones") or [b["id"] for b in bones]
        if part.get("rigid"):                                  # a hard prop (watch, gauze pack) follows one bone
            allowed = [part["rigid"]]
        D = np.stack([_seg_dist(P, np.array(B[i]["head"], float), np.array(B[i]["tail"], float)) for i in allowed], 1)
        W = 1.0 / (D + soft) ** falloff
        if len(allowed) == 1:
            W = np.hstack([W, np.zeros_like(W)])
        idx = np.argsort(-W, axis=1)[:, :2]
        w2 = np.take_along_axis(W, idx, 1)
        idx = np.minimum(idx, len(allowed) - 1)
        w2 = w2 / w2.sum(1, keepdims=True)
        bone_index = {b["id"]: i for i, b in enumerate(bones)}
        bi = np.vectorize(lambda k: bone_index[allowed[k]])(idx)
        out_parts.append(dict(id=part["id"], fill=part.get("fill"), stroke=part.get("stroke"), sw=part.get("sw"),
                              opacity=part.get("opacity"), cls=part.get("cls"), filter=part.get("filter"), sub=sub_meta,
                              pts=[round(v, 2) for v in P.ravel().tolist()],
                              bi=bi.ravel().tolist(), bw=[round(v, 4) for v in w2.ravel().tolist()]))
    return dict(prefix=prefix, bones=[dict(id=b["id"], parent=b.get("parent"), head=list(b["head"]), tail=list(b["tail"])) for b in bones],
                parts=out_parts)
