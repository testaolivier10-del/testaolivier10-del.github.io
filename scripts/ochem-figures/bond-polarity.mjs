/* Figures for the bond-polarity notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Foundations comes before skeletal structures, so every atom here is drawn
   and labeled (C, H, O, Cl, Li, or a CH₃/CH₂ group label). Nothing is a bare
   vertex or a zigzag.

   Conventions used in every figure:
   - A bond dipole is a thin arrow drawn beside its bond. It points at the
     δ− atom and carries a short cross bar at the δ+ end (the chemistry
     convention; the notes say that physics draws it the other way).
   - A molecule's net dipole is a thick arrow with the same cross bar.
   - δ+ is coral (fg-tag-warn), δ− is the accent color (fg-tag).
   - C–H bonds get no arrow: the course treats them as nonpolar.
   - Tetrahedral centers use the molecular-geometry page's convention:
     plain bonds in the plane, a solid wedge toward the reader and a dashed
     wedge away. Here the center is drawn "umbrella" style: one bond straight
     up, three pointing down, so the argument that three lower bond dipoles
     add to one arrow straight down can be seen.
   Lesson copies (id prefix l-) are 340 wide or less, stacked vertically,
   and use only fg-lbl and fg-tag text. */
import { atom, bond, wedge, hash, arrow, lonePair, text, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
/* Screen point at math angle `deg` (0 = east, counterclockwise) and distance `len`. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
const f1 = (v) => (Math.round(v * 10) / 10).toString();
const rOf = (l) => (l === 'H' ? 12 : l === 'Li' ? 15 : l === 'Cl' ? 15 : String(l).length > 2 ? 19 : String(l).length > 1 ? 15 : 14);
const unit = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; return { x: dx / L, y: dy / L, L }; };
/* A unit normal to a→b, on the side of point q (or away from it with away=true). */
function normal(a, b, q, away = false) {
  const u = unit(a, b);
  let nx = -u.y, ny = u.x;
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  const toward = (q.x - m.x) * nx + (q.y - m.y) * ny > 0;
  if (toward === away) { nx = -nx; ny = -ny; }
  return { x: nx, y: ny };
}

function headTri(tip, u, cls, size) {
  const px = -u.y, py = u.x, bx = tip.x - u.x * size, by = tip.y - u.y * size, h = size * 0.52;
  return `<path class="${cls}" d="M${f1(tip.x)} ${f1(tip.y)} L${f1(bx + px * h)} ${f1(by + py * h)} L${f1(bx - px * h)} ${f1(by - py * h)} Z"></path>`;
}
/* A bond dipole arrow from the δ+ atom a to the δ− atom b, shifted sideways
   by `off` along normal n, trimmed `p0` from a and `p1` from b. */
function dip(a, b, n, off = 13, p0 = 12, p1 = 12) {
  const u = unit(a, b);
  const s = P(a.x + u.x * p0 + n.x * off, a.y + u.y * p0 + n.y * off);
  const e = P(b.x - u.x * p1 + n.x * off, b.y - u.y * p1 + n.y * off);
  const c = P(s.x + u.x * 5, s.y + u.y * 5);
  return arrow(s, e, { size: 8 }) +
    `<line class="fg-arrow" x1="${f1(c.x - u.y * 5)}" y1="${f1(c.y + u.x * 5)}" x2="${f1(c.x + u.y * 5)}" y2="${f1(c.y - u.x * 5)}"></line>`;
}
/* A free-standing dipole arrow (for tip-to-tail sums), thin or thick. */
function vec(s, e, opts = {}) {
  const u = unit(s, e);
  const thick = !!opts.thick;
  const line = thick ? 'fg-bond-hi' : (opts.muted ? 'fg-arrow-mut' : 'fg-arrow');
  const hd = opts.muted && !thick ? 'fg-head-mut' : 'fg-head';
  const size = thick ? 11 : 8;
  const ee = P(e.x - u.x * size, e.y - u.y * size);
  let out = `<line class="${line}" x1="${f1(s.x)}" y1="${f1(s.y)}" x2="${f1(ee.x)}" y2="${f1(ee.y)}"></line>` + headTri(e, u, hd, size);
  if (opts.cross !== false) {
    const c = P(s.x + u.x * 6, s.y + u.y * 6), w = thick ? 7 : 5;
    out += `<line class="${line}" x1="${f1(c.x - u.y * w)}" y1="${f1(c.y + u.x * w)}" x2="${f1(c.x + u.y * w)}" y2="${f1(c.y - u.x * w)}"></line>`;
  }
  return out;
}
const dPlus = (p) => text(p.x, p.y + 4, 'δ+', { cls: 'fg-tag-warn', size: 11 });
const dMinus = (p) => text(p.x, p.y + 4, 'δ−', { cls: 'fg-tag', size: 11 });
const T = (x, y, s, cls = 'fg-tag', o = {}) => text(x, y, s, { cls, size: cls === 'fg-lbl' ? 13 : cls === 'fg-sm' ? 10.5 : 11, ...o });

/* Bond between two labeled atoms: kind 1, 2, 'w' (wedge), 'h' (hash). */
function bnd(a, b, la, lb, kind = 1) {
  const o = { rFrom: rOf(la), rTo: rOf(lb) };
  if (kind === 'w') return wedge(a, b, { ...o, width: 10 });
  if (kind === 'h') return hash(a, b, { ...o, width: 11, rungs: 5 });
  return bond(a, b, { ...o, order: kind });
}
const A = (p, l, kind) => atom(p.x, p.y, l, { r: rOf(l), kind });

/* ---------------------------------------------------- two-atom bonds --- */
/* One diatomic bond drawn at (x, y) with atoms 100 apart; `pos` is the
   δ+ side ('L' or 'R'), null for no arrow. */
function pairBond(x, y, la, lb, pos, opts = {}) {
  const a = P(x, y), b = P(x + (opts.gap ?? 100), y);
  let s = bnd(a, b, la, lb);
  if (pos) {
    const [p, m] = pos === 'L' ? [a, b] : [b, a];
    s += dip(p, m, { x: 0, y: -1 }, 30, 4, 4);
    s += dPlus(P(p.x, p.y + 32)) + dMinus(P(m.x, m.y + 32));
  }
  s += A(a, la) + A(b, lb, opts.hi);
  return s;
}

/* ------------------------------------------------------ CO2 and water --- */
function co2(c, opts = {}) {
  const L = opts.len ?? 62;
  const o1 = at(c, 180, L), o2 = at(c, 0, L);
  let s = bnd(c, o1, 'C', 'O', 2) + bnd(c, o2, 'C', 'O', 2);
  s += dip(c, o1, { x: 0, y: -1 }, 26, 6, 4) + dip(c, o2, { x: 0, y: -1 }, 26, 6, 4);
  s += A(c, 'C') + A(o1, 'O') + A(o2, 'O');
  s += dPlus(P(c.x, c.y + 32)) + dMinus(P(o1.x, o1.y + 32)) + dMinus(P(o2.x, o2.y + 32));
  return s;
}
/* The tip-to-tail sum for CO2: arrow 1 to the right, arrow 2 back from its tip. */
function co2Sum(s0, len = 70) {
  const a1 = P(s0.x + len, s0.y);
  let s = vec(s0, a1, { cross: false });
  s += `<line class="fg-dash" x1="${f1(a1.x)}" y1="${f1(a1.y)}" x2="${f1(a1.x)}" y2="${f1(a1.y + 16)}"></line>`;
  s += vec(P(a1.x, a1.y + 16), P(s0.x, s0.y + 16), { cross: false });
  s += `<circle class="fg-lp" cx="${f1(s0.x - 8)}" cy="${f1(s0.y + 16)}" r="3"></circle>`;
  return s;
}
function water(c, opts = {}) {
  const L = opts.len ?? 60, half = 52.25;
  const h1 = at(c, 270 - half, L), h2 = at(c, 270 + half, L);
  let s = bnd(c, h1, 'O', 'H') + bnd(c, h2, 'O', 'H');
  s += lonePair(c.x, c.y, -128, { dist: 24 }) + lonePair(c.x, c.y, -52, { dist: 24 });
  if (opts.arrows !== false) {
    s += dip(h1, c, normal(h1, c, h2, true), 14, 6, 10);
    s += dip(h2, c, normal(h2, c, h1, true), 14, 6, 10);
  }
  s += A(c, 'O', 'hi') + A(h1, 'H') + A(h2, 'H');
  s += dMinus(at(c, 90, 44));
  s += dPlus(P(h1.x, h1.y + 28)) + dPlus(P(h2.x, h2.y + 28));
  return { s, h1, h2 };
}
/* Tip-to-tail for water: the two O–H arrows, then their sum. */
function waterSum(s0, len = 58) {
  const half = 52.25;
  const v1 = at(P(0, 0), 90 - half, len), v2 = at(P(0, 0), 90 + half, len);
  const p1 = P(s0.x + v1.x, s0.y + v1.y), p2 = P(p1.x + v2.x, p1.y + v2.y);
  return vec(s0, p1, { cross: false }) + vec(p1, p2, { cross: false }) + vec(s0, p2, { thick: true, cross: false });
}

/* ------------------------------------------------ tetrahedral umbrella --- */
/* A carbon with one bond straight up and three down: one in the plane to
   the left, a solid wedge down-right and a dashed wedge right. `top` is the
   atom on the upper bond ('Cl' or 'H'). Arrows on every C–Cl. */
const UMB = [{ deg: 90, k: 1 }, { deg: 200, k: 1 }, { deg: 302, k: 'w' }, { deg: 342, k: 'h' }];
function umbrella(c, top, opts = {}) {
  const L = opts.len ?? 74;
  const ends = UMB.map((a) => at(c, a.deg, L));
  const labels = [top, 'Cl', 'Cl', 'Cl'];
  let s = '';
  UMB.forEach((a, i) => { s += bnd(c, ends[i], 'C', labels[i], a.k); });
  // Dipole arrows, each on its own clear side of the bond.
  const side = [{ x: 1, y: 0 }, null, null, null];
  side[1] = normal(c, ends[1], P(c.x, c.y + 100));       // below the left bond
  side[2] = normal(c, ends[2], ends[1]);                 // toward the lower left
  side[3] = normal(c, ends[3], ends[0]);                 // toward the top
  UMB.forEach((a, i) => {
    if (labels[i] !== 'Cl') return;
    s += dip(c, ends[i], side[i], 15, 24, 10);
  });
  s += A(c, 'C');
  UMB.forEach((a, i) => { s += A(ends[i], labels[i], labels[i] === 'Cl' ? 'hi' : undefined); });
  // Partial charges.
  s += dPlus(at(c, 142, 30));
  const dm = [at(ends[0], 180, 28), at(ends[1], 140, 28), at(ends[2], 215, 28), at(ends[3], 20, 29)];
  UMB.forEach((a, i) => { if (labels[i] === 'Cl') s += dMinus(dm[i]); });
  return s;
}

/* ---------------------------------------------------------- acetone --- */
function acetone(c) {
  const o = at(c, 0, 56), m1 = at(c, 150, 56), m2 = at(c, 210, 56);
  let s = bnd(c, o, 'C', 'O', 2) + bnd(c, m1, 'C', 'CH₃') + bnd(c, m2, 'C', 'CH₃');
  s += dip(c, o, { x: 0, y: -1 }, 24, 6, 4);
  s += lonePair(o.x, o.y, -60, { dist: 22 }) + lonePair(o.x, o.y, 60, { dist: 22 });
  s += A(c, 'C') + A(o, 'O', 'hi') + A(m1, 'CH₃') + A(m2, 'CH₃');
  s += dPlus(P(c.x, c.y + 30)) + dMinus(P(o.x + 30, o.y));
  return { s, o, c };
}
function butane(x, y, gap = 52) {
  const pts = [0, 1, 2, 3].map((i) => P(x + i * gap, y));
  const ls = ['CH₃', 'CH₂', 'CH₂', 'CH₃'];
  let s = '';
  for (let i = 0; i < 3; i++) s += bnd(pts[i], pts[i + 1], ls[i], ls[i + 1]);
  pts.forEach((p, i) => { s += A(p, ls[i]); });
  return s;
}

/* ---------------------------------------------------- ethanol pair --- */
/* Ethanol 1 on top; its O–H hydrogen points down-right at a lone pair on
   the oxygen of ethanol 2. Returns the drawing. */
function ethanolPair(o1, opts = {}) {
  const c1 = at(o1, 180, 50), m1 = at(c1, 180, 50);
  const h1 = at(o1, 300, 40);
  const o2 = at(h1, 300, 60);
  const c2 = at(o2, 195, 50), m2 = at(c2, 180, 50);
  const h2 = at(o2, 285, 40);
  let s = '';
  s += bnd(m1, c1, 'CH₃', 'CH₂') + bnd(c1, o1, 'CH₂', 'O') + bnd(o1, h1, 'O', 'H');
  s += bnd(m2, c2, 'CH₃', 'CH₂') + bnd(c2, o2, 'CH₂', 'O') + bnd(o2, h2, 'O', 'H');
  s += lonePair(o1.x, o1.y, -110, { dist: 22 }) + lonePair(o1.x, o1.y, -35, { dist: 22 });
  s += lonePair(o2.x, o2.y, -120, { dist: 22 }) + lonePair(o2.x, o2.y, -20, { dist: 22 });
  // The hydrogen bond: from the H to the lone pair it points at.
  const lpC = at(o2, 120, 22);
  const u = unit(h1, lpC);
  s += `<line class="fg-dash-hi" x1="${f1(h1.x + u.x * 14)}" y1="${f1(h1.y + u.y * 14)}" x2="${f1(lpC.x - u.x * 6)}" y2="${f1(lpC.y - u.y * 6)}" style="stroke-width:2.6"></line>`;
  s += A(m1, 'CH₃') + A(c1, 'CH₂') + A(o1, 'O', 'hi') + A(h1, 'H', 'hi');
  s += A(m2, 'CH₃') + A(c2, 'CH₂') + A(o2, 'O', 'hi') + A(h2, 'H');
  s += dPlus(at(h1, 190, 26)) + dMinus(at(o2, 70, 31));
  return { s, h1, o2, lpC };
}

function ether(o) {
  const m1 = at(o, 205, 54), m2 = at(o, 335, 54);
  let s = bnd(o, m1, 'O', 'CH₃') + bnd(o, m2, 'O', 'CH₃');
  s += lonePair(o.x, o.y, -125, { dist: 22 }) + lonePair(o.x, o.y, -55, { dist: 22 });
  s += A(o, 'O', 'hi') + A(m1, 'CH₃') + A(m2, 'CH₃');
  return s;
}

/* ------------------------------------------------------ water network --- */
function waterNet(c) {
  const half = 52.25, Lb = 48;
  const hA = at(c, 270 - half, Lb), hB = at(c, 270 + half, Lb);
  let s = '', atoms = '';
  s += bnd(c, hA, 'O', 'H') + bnd(c, hB, 'O', 'H');
  s += lonePair(c.x, c.y, -125, { dist: 21 }) + lonePair(c.x, c.y, -55, { dist: 21 });
  atoms += A(c, 'O', 'hi') + A(hA, 'H', 'hi') + A(hB, 'H', 'hi');
  const hb = (p, q) => { const u = unit(p, q); return `<line class="fg-dash-hi" x1="${f1(p.x + u.x * 14)}" y1="${f1(p.y + u.y * 14)}" x2="${f1(q.x - u.x * 5)}" y2="${f1(q.y - u.y * 5)}" style="stroke-width:2.4"></line>`; };
  // Neighbors that ACCEPT from the central hydrogens: their O sits beyond each H.
  for (const [h, dir] of [[hA, 270 - half], [hB, 270 + half]]) {
    const o = at(h, dir, 62);
    const back = dir + 180;
    const lp = at(o, back, 21);
    s += hb(h, lp);
    s += lonePair(o.x, o.y, -back, { dist: 21 });
    const hh = [at(o, back + 115, Lb), at(o, back - 115 + (dir < 270 ? 0 : 0), Lb)];
    // keep the two H of this neighbor 104.5° apart, both pointing away from the center
    const a1 = back + 127.75, a2 = a1 + 104.5;
    hh[0] = at(o, a1, Lb); hh[1] = at(o, a2, Lb);
    s += bnd(o, hh[0], 'O', 'H') + bnd(o, hh[1], 'O', 'H');
    atoms += A(o, 'O') + A(hh[0], 'H') + A(hh[1], 'H');
  }
  // Neighbors that DONATE to the central lone pairs: their H points at the pair.
  for (const dir of [125, 55]) {
    const lp = at(c, dir, 21);
    const h = at(c, dir, 21 + 50);
    const o = at(h, dir, Lb);
    s += hb(h, lp);
    const a2 = dir + 180 + (dir > 90 ? -104.5 : 104.5);
    const h2 = at(o, a2, Lb);
    s += bnd(o, h, 'O', 'H') + bnd(o, h2, 'O', 'H');
    atoms += A(o, 'O') + A(h, 'H') + A(h2, 'H');
  }
  return s + atoms;
}

/* ============================================================ NOTES === */

FIGURES.push({
  id: 'bond-dipoles',
  section: 'bond-polarity',
  anchor: 'so no arrow is drawn for either.</p>',
  viewBox: '0 0 760 236',
  alt: 'Three bonds. C–O: carbon 2.55, oxygen 3.44; carbon is delta plus, oxygen delta minus, and the dipole arrow points at oxygen with its cross bar at carbon. C–Li: carbon 2.55, lithium 0.98; the arrow is reversed and points at carbon, which is delta minus, with lithium delta plus. C–H: carbon 2.55, hydrogen 2.20; a difference of 0.35, drawn with no arrow.',
  build() {
    let s = '';
    const cols = [14, 262, 510];
    cols.forEach((x) => { s += panel(x, 8, 236, 220); });
    // C–O
    s += T(132, 32, 'C–O: oxygen pulls harder');
    s += pairBond(82, 104, 'C', 'O', 'L', { hi: 'hi' });
    s += T(82, 164, 'EN 2.55', 'fg-sm') + T(182, 164, 'EN 3.44', 'fg-sm');
    s += T(132, 192, 'cross bar at the δ+ end,', 'fg-sm') + T(132, 208, 'arrowhead at the δ− end', 'fg-sm');
    // C–Li
    s += T(380, 32, 'C–Li: the arrow reverses');
    s += pairBond(330, 104, 'C', 'Li', 'R');
    s += T(330, 164, 'EN 2.55', 'fg-sm') + T(430, 164, 'EN 0.98', 'fg-sm');
    s += T(380, 192, 'lithium pulls far less,', 'fg-sm') + T(380, 208, 'so carbon is the δ− end', 'fg-sm');
    // C–H
    s += T(628, 32, 'C–H: treated as nonpolar', 'fg-tag-mut');
    s += pairBond(578, 104, 'C', 'H', null);
    s += T(578, 164, 'EN 2.55', 'fg-sm') + T(678, 164, 'EN 2.20', 'fg-sm');
    s += T(628, 192, 'difference 0.35:', 'fg-sm') + T(628, 208, 'no arrow drawn', 'fg-sm');
    return s;
  },
  caption: 'Three carbon bonds. In each panel, compare the two electronegativity values with the direction of the arrow.',
});

FIGURES.push({
  id: 'adding-arrows',
  section: 'bond-polarity',
  anchor: 'and water is polar: μ = 1.85 D.</p>',
  viewBox: '0 0 760 262',
  alt: 'Left, carbon dioxide: O=C=O in a straight line, carbon delta plus, both oxygens delta minus, and two bond dipole arrows pointing outward, one to each oxygen. Beside it the two arrows are placed tip to tail: the second ends where the first began, so the sum is zero. Right, water: a bent oxygen with two hydrogens below it and two lone pairs above it; oxygen delta minus, each hydrogen delta plus, and an arrow along each O–H bond pointing at the oxygen. Beside it the two arrows placed tip to tail give a thick sum arrow pointing straight up, toward the oxygen side.',
  build() {
    let s = panel(14, 8, 362, 246) + panel(386, 8, 362, 246);
    s += T(195, 32, 'CO₂: linear', 'fg-lbl');
    s += co2(P(100, 128), { len: 58 });
    s += T(292, 84, 'tip to tail', 'fg-tag-mut');
    s += co2Sum(P(258, 122), 70);
    s += T(292, 168, 'ends where it began', 'fg-sm');
    s += T(195, 232, 'sum = 0, so μ = 0', 'fg-tag-mut');
    s += T(567, 32, 'H₂O: bent', 'fg-lbl');
    s += water(P(480, 104), { len: 58 }).s;
    s += T(668, 54, 'tip to tail', 'fg-tag-mut');
    s += waterSum(P(668, 196), 56);
    s += T(706, 136, 'sum', 'fg-tag');
    s += T(567, 232, 'sum points to the O side: μ = 1.85 D');
    return s;
  },
  caption: 'Each panel draws the molecule with its bond dipoles, then slides the same arrows tip to tail. Compare where the last arrow ends in each case.',
});

FIGURES.push({
  id: 'tetrahedral-sum',
  section: 'bond-polarity',
  anchor: 'so the sum no longer reaches zero.</p>',
  viewBox: '0 0 760 300',
  alt: 'Left, carbon tetrachloride: carbon with one chlorine straight up, one down-left in the plane, one down-right on a solid wedge and one to the right on a dashed wedge. Carbon is delta plus, every chlorine delta minus, and a dipole arrow runs along each C–Cl bond toward the chlorine. Beside it: the three lower arrows add to one arrow straight down, the same length as the single upward arrow of the top C–Cl bond, so the total is zero. Right, chloroform: the same drawing with a hydrogen in place of the top chlorine and no arrow on the C–H bond. The three lower arrows still add to one arrow straight down, and nothing opposes it: a net dipole of 1.04 D pointing toward the chlorines.',
  build() {
    let s = panel(14, 8, 362, 284) + panel(386, 8, 362, 284);
    s += T(195, 32, 'CCl₄: four identical corners', 'fg-lbl');
    s += umbrella(P(130, 150), 'Cl');
    // the sum
    s += T(296, 66, 'top C–Cl', 'fg-sm');
    s += vec(P(276, 150), P(276, 90));
    s += vec(P(316, 90), P(316, 150));
    s += T(296, 172, 'lower three,', 'fg-sm') + T(296, 186, 'added together', 'fg-sm');
    s += T(195, 250, 'equal length, opposite ways', 'fg-tag-mut');
    s += T(195, 270, 'sum = 0, so μ = 0', 'fg-tag-mut');
    s += T(567, 32, 'CHCl₃: one corner swapped', 'fg-lbl');
    s += umbrella(P(500, 150), 'H');
    s += T(530, 72, 'C–H: no arrow', 'fg-sm', { anchor: 'start' });
    s += vec(P(676, 96), P(676, 164), { thick: true });
    s += T(676, 186, 'lower three,', 'fg-sm') + T(676, 200, 'nothing opposing', 'fg-sm');
    s += T(567, 250, 'net arrow toward the chlorines');
    s += T(567, 270, 'μ = 1.04 D');
    return s;
  },
  caption: 'The same tetrahedral frame twice. Compare the two sums on the right of each panel: in CCl₄ the top arrow cancels the lower three; in CHCl₃ nothing is left at the top to do it.',
});

FIGURES.push({
  id: 'dipole-dipole',
  section: 'bond-polarity',
  anchor: 'Nearly sixty degrees of difference at the same molecular weight comes from polarity alone.</p>',
  viewBox: '0 0 760 222',
  alt: 'Left: two acetone molecules side by side. Each has a carbon double-bonded to an oxygen on its right and two CH3 groups on its left; carbon is delta plus, oxygen delta minus, and a dipole arrow points from carbon to oxygen. The delta-minus oxygen of the first molecule sits next to the delta-plus carbon of the second, joined by a dashed line labeled attraction. Right: butane, CH3–CH2–CH2–CH3, with no dipole arrow.',
  build() {
    let s = panel(14, 8, 480, 206) + panel(504, 8, 244, 206);
    s += T(254, 32, 'acetone, μ = 2.88 D', 'fg-lbl');
    const a1 = acetone(P(96, 110)), a2 = acetone(P(290, 110));
    const u = unit(a1.o, a2.c);
    s += `<line class="fg-dash-hi" x1="${f1(a1.o.x + 40)}" y1="${f1(a1.o.y)}" x2="${f1(a2.c.x - 60)}" y2="${f1(a2.c.y)}" style="stroke-width:2.4"></line>`;
    s += a1.s + a2.s;
    s += T(254, 176, 'δ− oxygen of one next to the δ+ carbon of the next', 'fg-sm');
    s += T(254, 198, 'dipole–dipole: boils at 56 °C', 'fg-tag');
    s += T(626, 32, 'butane, μ ≈ 0', 'fg-lbl');
    s += butane(548, 110, 52);
    s += T(626, 176, 'C–C and C–H only: no dipole', 'fg-sm');
    s += T(626, 198, 'dispersion only: boils at −1 °C', 'fg-tag-mut');
    return s;
  },
  caption: 'Both molecules weigh 58. Look at what lines up between the two acetones, and at what butane has to offer in its place.',
});

FIGURES.push({
  id: 'hydrogen-bond',
  section: 'bond-polarity',
  anchor: 'is worth a hundred degrees.</p>',
  viewBox: '0 0 760 262',
  alt: 'Left: two ethanol molecules, CH3–CH2–O–H. The O–H hydrogen of the upper one, delta plus, points at a lone pair on the oxygen of the lower one, delta minus, joined by a thick dashed line labeled hydrogen bond. The hydrogen is labeled donor and the lone pair acceptor. Right: dimethyl ether, CH3–O–CH3, with two lone pairs on the oxygen and every hydrogen on a carbon, labeled acceptor only, no donor.',
  build() {
    let s = panel(14, 8, 440, 246) + panel(464, 8, 284, 246);
    s += T(234, 32, 'ethanol, CH₃CH₂OH', 'fg-lbl');
    const e = ethanolPair(P(170, 78));
    s += e.s;
    s += T(212, 118, 'donor: H on O', 'fg-tag', { anchor: 'start' });
    s += T(186, 152, 'hydrogen bond', 'fg-tag', { anchor: 'end' });
    s += T(262, 176, 'acceptor: lone', 'fg-tag', { anchor: 'start' }) + T(262, 191, 'pair on O', 'fg-tag', { anchor: 'start' });
    s += T(234, 236, 'MW 46 · boils at 78 °C', 'fg-tag-good');
    s += T(606, 32, 'dimethyl ether, CH₃OCH₃', 'fg-lbl');
    s += ether(P(606, 120));
    s += T(606, 76, 'lone pairs: can accept', 'fg-sm');
    s += T(606, 178, 'every H is on a carbon:', 'fg-sm');
    s += T(606, 194, 'nothing to donate', 'fg-sm');
    s += T(606, 236, 'MW 46 · boils at −24 °C', 'fg-tag-warn');
    return s;
  },
  caption: 'Same formula, C₂H₆O. Follow the dashed line in ethanol from the hydrogen to the lone pair it points at, then look for a hydrogen in dimethyl ether that could do the same.',
});

FIGURES.push({
  id: 'water-hbonds',
  section: 'bond-polarity',
  anchor: 'although acetone has the larger dipole moment.</p>',
  viewBox: '0 0 620 318',
  alt: 'A central water molecule, its oxygen and two hydrogens highlighted, surrounded by four neighbors. Each of its two hydrogens points at a lone pair on a neighbor below it, and each of its two lone pairs receives a hydrogen from a neighbor above it. Four dashed hydrogen bonds in all.',
  build() {
    let s = panel(14, 8, 592, 302);
    s += waterNet(P(210, 158));
    s += T(488, 110, 'the central water:', 'fg-lbl');
    s += T(488, 138, 'gives 2 hydrogen bonds', 'fg-tag');
    s += T(488, 154, '(its two H)', 'fg-sm');
    s += T(488, 182, 'takes 2 hydrogen bonds', 'fg-tag');
    s += T(488, 198, '(its two lone pairs)', 'fg-sm');
    s += T(488, 232, 'boils at 100 °C', 'fg-tag-good');
    return s;
  },
  caption: 'Count the dashed lines around the highlighted molecule, and check which end of each one sits on it.',
});

/* =========================================================== LESSON === */

FIGURES.push({
  id: 'l-bond-dipoles',
  lessons: ['bond-polarity'],
  viewBox: '0 0 340 316',
  alt: 'Two bonds. C–O: carbon delta plus, oxygen delta minus, the arrow points at oxygen with its cross bar at carbon. C–Li: the arrow is reversed and points at carbon, which is delta minus, with lithium delta plus.',
  build() {
    let s = panel(4, 4, 332, 150) + panel(4, 162, 332, 150);
    s += T(170, 28, 'C–O: EN 2.55 vs 3.44', 'fg-lbl');
    s += pairBond(120, 94, 'C', 'O', 'L', { hi: 'hi' });
    s += T(170, 146, 'arrow points at O, the δ− end');
    s += T(170, 186, 'C–Li: EN 2.55 vs 0.98', 'fg-lbl');
    s += pairBond(120, 252, 'C', 'Li', 'R');
    s += T(170, 304, 'reversed: carbon is the δ− end');
    return s;
  },
  caption: 'Cross bar at the δ+ end, arrowhead at the δ− end.',
});

FIGURES.push({
  id: 'l-co2-sum',
  lessons: ['bond-polarity'],
  viewBox: '0 0 340 318',
  alt: 'Carbon dioxide, O=C=O in a straight line, carbon delta plus and both oxygens delta minus, with a dipole arrow pointing outward to each oxygen. Below, the two arrows placed tip to tail: the second ends where the first began, so the sum is zero.',
  build() {
    let s = panel(4, 4, 332, 160) + panel(4, 172, 332, 142);
    s += T(170, 28, 'CO₂: linear', 'fg-lbl');
    s += co2(P(170, 104), { len: 62 });
    s += T(170, 196, 'the same two arrows, tip to tail', 'fg-lbl');
    s += co2Sum(P(135, 236), 80);
    s += T(170, 294, 'back to the start: sum = 0');
    return s;
  },
  caption: 'Follow the second arrow: where does it end?',
});

FIGURES.push({
  id: 'l-water-arrows',
  lessons: ['bond-polarity'],
  viewBox: '0 0 340 186',
  alt: 'Water: a bent oxygen with two hydrogens below it and two lone pairs above it. Oxygen is delta minus, each hydrogen delta plus, and an arrow along each O–H bond points at the oxygen.',
  build() {
    let s = panel(4, 4, 332, 178);
    s += T(170, 28, 'H₂O: bent, 104.5°', 'fg-lbl');
    s += water(P(170, 92), { len: 58 }).s;
    return s;
  },
  caption: 'Both arrows point up toward the oxygen, from two different sides.',
});

FIGURES.push({
  id: 'l-water-sum',
  lessons: ['bond-polarity'],
  viewBox: '0 0 340 176',
  alt: 'The two O–H dipole arrows of water placed tip to tail. Their sum is a thick arrow pointing straight up, toward the oxygen side of the molecule.',
  build() {
    let s = panel(4, 4, 332, 168);
    s += T(170, 28, 'water’s two arrows, tip to tail', 'fg-lbl');
    s += waterSum(P(170, 148), 60);
    s += T(214, 96, 'sum', 'fg-tag', { anchor: 'start' });
    return s;
  },
  caption: 'The sideways parts cancel; the upward parts add.',
});

FIGURES.push({
  id: 'l-ccl4-sum',
  lessons: ['bond-polarity'],
  viewBox: '0 0 340 356',
  alt: 'Carbon tetrachloride: carbon with one chlorine straight up, one down-left in the plane, one down-right on a solid wedge and one to the right on a dashed wedge; carbon delta plus, every chlorine delta minus, an arrow along each C–Cl bond toward chlorine. Below: the three lower arrows add to one arrow straight down, the same length as the top arrow pointing up, so the sum is zero.',
  build() {
    let s = panel(4, 4, 332, 222) + panel(4, 234, 332, 118);
    s += T(170, 28, 'CCl₄: tetrahedral', 'fg-lbl');
    s += umbrella(P(160, 124), 'Cl', { len: 66 });
    s += T(170, 258, 'top arrow vs the lower three, added', 'fg-lbl');
    s += vec(P(140, 330), P(140, 272));
    s += vec(P(200, 272), P(200, 330));
    s += T(122, 306, 'top', 'fg-tag', { anchor: 'end' });
    s += T(218, 306, 'lower 3', 'fg-tag', { anchor: 'start' });
    return s;
  },
  caption: 'Same length, opposite directions: the sum is zero.',
});

FIGURES.push({
  id: 'l-chcl3',
  lessons: ['bond-polarity'],
  viewBox: '0 0 340 230',
  alt: 'Chloroform: the same tetrahedral drawing as carbon tetrachloride, but with a hydrogen straight up in place of the top chlorine and no arrow on the C–H bond. The three lower C–Cl bonds each carry an arrow toward chlorine.',
  build() {
    let s = panel(4, 4, 332, 222);
    s += T(170, 28, 'CHCl₃: H in the top corner', 'fg-lbl');
    s += umbrella(P(160, 124), 'H', { len: 66 });
    return s;
  },
  caption: 'The C–H bond carries no arrow.',
});

FIGURES.push({
  id: 'l-dipole-dipole',
  lessons: ['bond-polarity'],
  viewBox: '0 0 340 186',
  alt: 'Two acetone molecules, one above the other and offset. Each has a carbon double-bonded to an oxygen on its right and two CH3 groups on its left, carbon delta plus and oxygen delta minus. The delta-minus oxygen of the upper molecule sits next to the delta-plus carbon of the lower one, joined by a dashed line.',
  build() {
    let s = panel(4, 4, 332, 178);
    s += T(170, 28, 'two acetones, μ = 2.88 D', 'fg-lbl');
    const a1 = acetone(P(98, 84));
    const a2c = P(226, 138);
    const u = unit(a1.o, a2c);
    s += `<line class="fg-dash-hi" x1="${f1(a1.o.x + u.x * 22)}" y1="${f1(a1.o.y + u.y * 22)}" x2="${f1(a2c.x - u.x * 36)}" y2="${f1(a2c.y - u.y * 36)}" style="stroke-width:2.4"></line>`;
    s += a1.s;
    // lower molecule without its own arrow, to keep the pair readable
    const o = at(a2c, 0, 56), m1 = at(a2c, 150, 56), m2 = at(a2c, 210, 56);
    s += bnd(a2c, o, 'C', 'O', 2) + bnd(a2c, m1, 'C', 'CH₃') + bnd(a2c, m2, 'C', 'CH₃');
    s += A(a2c, 'C') + A(o, 'O', 'hi') + A(m1, 'CH₃') + A(m2, 'CH₃');
    s += dPlus(P(a2c.x + 4, a2c.y - 28)) + dMinus(P(o.x + 30, o.y));
    return s;
  },
  caption: 'The δ− oxygen of one molecule sits by the δ+ carbon of the next.',
});

FIGURES.push({
  id: 'l-hbond',
  lessons: ['bond-polarity'],
  viewBox: '0 0 340 250',
  alt: 'Two ethanol molecules, CH3–CH2–O–H. The O–H hydrogen of the upper one, delta plus, points at a lone pair on the oxygen of the lower one, delta minus, joined by a thick dashed line: the hydrogen bond. The hydrogen is labeled donor and the lone pair acceptor.',
  build() {
    let s = panel(4, 4, 332, 242);
    s += T(170, 28, 'ethanol + ethanol', 'fg-lbl');
    const e = ethanolPair(P(150, 72));
    s += e.s;
    s += T(222, 100, 'donor: H on O', 'fg-tag', { anchor: 'start' });
    s += T(248, 136, 'H bond', 'fg-tag', { anchor: 'start' });
    s += T(260, 172, 'acceptor:', 'fg-tag', { anchor: 'start' }) + T(260, 187, 'lone pair', 'fg-tag', { anchor: 'start' });
    return s;
  },
  caption: 'The dashed line runs from a hydrogen on oxygen to a lone pair on the next oxygen.',
});

export default FIGURES;
