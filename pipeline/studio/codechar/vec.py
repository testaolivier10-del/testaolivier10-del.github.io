"""Traced vector parts as skia paths."""
import json
import numpy as np
import skia


def to_path(segs, M=None):
    """segs: [[p0,c1,c2,p3], ...] (subpaths break where p0 != previous p3). M: 2x3 affine applied to points."""
    p = skia.Path()
    last = None
    def T(q):
        if M is None:
            return float(q[0]), float(q[1])
        return float(M[0, 0] * q[0] + M[0, 1] * q[1] + M[0, 2]), float(M[1, 0] * q[0] + M[1, 1] * q[1] + M[1, 2])
    for p0, c1, c2, p3 in segs:
        if last is None or abs(p0[0] - last[0]) + abs(p0[1] - last[1]) > 1e-3:
            if last is not None:
                p.close()
            p.moveTo(*T(p0))
        p.cubicTo(*T(c1), *T(c2), *T(p3))
        last = p3
    p.close()
    return p


def hexcol(h, a=255):
    return skia.Color(int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), a)


def load(path='traced.json'):
    return json.load(open(path))
