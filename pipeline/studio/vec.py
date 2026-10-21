"""Small vector drawing helpers for hand built style B art (2026-10-21).
Smooth closed shapes from a few points (Catmull-Rom to cubic beziers), tapered limbs through joints,
and the style B look as SVG filters (rim light on the lit edge, soft shadow on the far edge), so every piece
gets the same lighting automatically, even while a rig bends it."""
import math


def _cr(pts, closed=True, tension=0.5):
    n = len(pts)
    if n < 2: return ""
    P = pts[:]
    d = f"M{P[0][0]:.1f} {P[0][1]:.1f}"
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = P[(i - 1) % n] if (closed or i > 0) else P[i]
        p1 = P[i]; p2 = P[(i + 1) % n]
        p3 = P[(i + 2) % n] if (closed or i + 2 < n) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) * tension / 3, p1[1] + (p2[1] - p0[1]) * tension / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * tension / 3, p2[1] - (p3[1] - p1[1]) * tension / 3)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d + ("Z" if closed else "")


def blob(pts, tension=0.5):
    """Smooth closed shape through the given points."""
    return _cr(pts, True, tension)


def line(pts, tension=0.5):
    return _cr(pts, False, tension)


def limb(joints, widths, bulge=None, cap0=0.5, cap1=0.9):
    """Tapered limb outline through joints (list of (x, y)) with a width at each joint; bulge adds width in the
    middle of each segment (muscle, sleeve folds). Round caps at both ends."""
    n = len(joints)
    bulge = bulge or [0] * (n - 1)
    left, right = [], []
    def nrm(a, b):
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1
        return (-dy / L, dx / L), (dx / L, dy / L)
    samples = []
    for i in range(n - 1):
        a, b = joints[i], joints[i + 1]
        for k, u in enumerate((0.0, 0.5)):
            p = (a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u)
            w = widths[i] + (widths[i + 1] - widths[i]) * u + (bulge[i] if u == 0.5 else 0)
            samples.append((p, w, nrm(a, b)))
    a, b = joints[-2], joints[-1]
    samples.append((b, widths[-1], nrm(a, b)))
    # average normals at shared joints for smooth bends
    for (p, w, (nv, tv)) in samples:
        left.append((p[0] + nv[0] * w / 2, p[1] + nv[1] * w / 2))
        right.append((p[0] - nv[0] * w / 2, p[1] - nv[1] * w / 2))
    (n0, t0) = samples[0][2]; (n1, t1) = samples[-1][2]
    p0, w0 = samples[0][0], samples[0][1]; p1, w1 = samples[-1][0], samples[-1][1]
    end = (p1[0] + t1[0] * w1 * cap1 / 2, p1[1] + t1[1] * w1 * cap1 / 2)
    start = (p0[0] - t0[0] * w0 * cap0 / 2, p0[1] - t0[1] * w0 * cap0 / 2)
    pts = left + [end] + right[::-1] + [start]
    return blob(pts, 0.55)


def defs(rim="#ffb35c", rim_dx=2.6, rim_dy=2.2, rim_op=0.8, shade="#0b1230", shade_dx=-16, shade_dy=-6, shade_op=0.38, fid="sbRim"):
    """style B lighting as filters: url(#sbRim) gives a part a warm rim on the lit edge and a soft shadow plane
    on the far edge. url(#sbRimOnly) only the rim. Light direction = (-rim_dx, -rim_dy)."""
    return f"""
<filter id="{fid}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
  <feOffset in="SourceAlpha" dx="{rim_dx}" dy="{rim_dy}" result="o1"/>
  <feComposite in="SourceAlpha" in2="o1" operator="out" result="edge"/>
  <feGaussianBlur in="edge" stdDeviation="0.7" result="edgeB"/>
  <feFlood flood-color="{rim}" flood-opacity="{rim_op}" result="c1"/><feComposite in="c1" in2="edgeB" operator="in" result="rim"/>
  <feOffset in="SourceAlpha" dx="{shade_dx}" dy="{shade_dy}" result="o2"/>
  <feComposite in="SourceAlpha" in2="o2" operator="out" result="far"/>
  <feGaussianBlur in="far" stdDeviation="5" result="farB"/>
  <feComposite in="farB" in2="SourceAlpha" operator="in" result="farIn"/>
  <feFlood flood-color="{shade}" flood-opacity="{shade_op}" result="c2"/><feComposite in="c2" in2="farIn" operator="in" result="shadow"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shadow"/><feMergeNode in="rim"/></feMerge>
</filter>
<filter id="{fid}Only" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
  <feOffset in="SourceAlpha" dx="{rim_dx}" dy="{rim_dy}" result="o1"/>
  <feComposite in="SourceAlpha" in2="o1" operator="out" result="edge"/>
  <feGaussianBlur in="edge" stdDeviation="0.7" result="edgeB"/>
  <feFlood flood-color="{rim}" flood-opacity="{rim_op}" result="c1"/><feComposite in="c1" in2="edgeB" operator="in" result="rim"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="rim"/></feMerge>
</filter>"""
