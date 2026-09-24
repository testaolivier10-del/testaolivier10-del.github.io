/* Skeletal-drawing helpers shared by every figure file.

   ochem-figure.mjs knows atoms, bonds and arrows. Skeletal structures need a
   few more shapes on top of those: a zigzag chain, a regular ring, a double
   bond drawn inside a ring, and locant numbers that sit clear of the bonds.
   These used to be private to build-ochem-figures.mjs. Figure modules under
   scripts/ochem-figures/ need them too, so they live here and both import
   them. Nothing here decides chemistry. */
import { bond, text, P } from './ochem-figure.mjs';

/* A zigzag chain: n carbons, even indices on the baseline y0 and odd ones
   raised by dy, the way a skeletal chain is drawn. */
export const zig = (x0, y0, n, dx = 34, dy = 22) =>
  Array.from({ length: n }, (_, i) => P(x0 + i * dx, y0 + (i % 2 ? -dy : 0)));

/* Skeletal bonds: vertices are unlabeled carbons, so nothing is trimmed. */
export const sk = (a, b, hi) => bond(a, b, { rFrom: 0, rTo: 0, cls: hi ? 'fg-bond-hi' : 'fg-bond' });

/* A double bond inside a ring, or on a skeleton whose ends carry something
   else. `bond(a, b, { order: 2 })` draws two full-length lines either side of
   the axis, which is right for an isolated C=C and wrong the moment the
   vertices are shared: the second line runs past the corner and hangs over
   the neighboring bond. A chemist draws the second line short and on the
   inside instead, so this does that: one full line along the bond, one inset
   line offset toward `inward`. */
export function ringDouble(a, b, inward, opts = {}) {
  const gap = opts.gap ?? 4.6;
  const inset = opts.inset ?? 12;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  let px = -uy, py = ux;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  if ((inward.x - mx) * px + (inward.y - my) * py < 0) { px = -px; py = -py; }
  const A = P(a.x + ux * inset + px * gap, a.y + uy * inset + py * gap);
  const B = P(b.x - ux * inset + px * gap, b.y - uy * inset + py * gap);
  return bond(a, b, { rFrom: 0, rTo: 0, cls: opts.cls }) +
         bond(A, B, { rFrom: 0, rTo: 0, cls: opts.cls });
}

/* A regular polygon's vertices, angle 0 at the right and measured
   counter-clockwise. rot = 90 puts the first vertex at the top. */
export const polyPts = (cx, cy, n, r, rot = 90) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((rot + (i * 360) / n) * Math.PI) / 180;
    return P(cx + r * Math.cos(a), cy - r * Math.sin(a));
  });

export const polyRing = (pts, cls) =>
  pts.map((p, i) => bond(p, pts[(i + 1) % pts.length], { rFrom: 0, rTo: 0, cls })).join('');

/* A locant number placed away from the bonds that meet at vertex p. `away`
   is a point the number should move away from (usually the centre of the
   ring, or the vertex's neighbours' midpoint); d is the distance. */
export function locant(p, away, value, opts = {}) {
  const d = opts.d ?? 15;
  const dx = p.x - away.x, dy = p.y - away.y;
  const len = Math.hypot(dx, dy) || 1;
  const x = p.x + (dx / len) * d, y = p.y + (dy / len) * d;
  return text(x, y + 4, value, { cls: opts.cls || 'fg-lbl', size: opts.size ?? 11 });
}

/* A benzene ring as a Kekulé structure: six vertices and three inset double
   bonds (between vertices 0-1, 2-3, 4-5, or 1-2, 3-4, 5-0 with shift = 1). */
export function benzene(cx, cy, r, opts = {}) {
  const pts = polyPts(cx, cy, 6, r, opts.rot ?? 90);
  const c = P(cx, cy);
  const shift = opts.shift ?? 0;
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = pts[i], b = pts[(i + 1) % 6];
    s += (i % 2 === shift) ? ringDouble(a, b, c, { inset: 7, cls: opts.cls }) : bond(a, b, { rFrom: 0, rTo: 0, cls: opts.cls });
  }
  return { svg: s, pts };
}
