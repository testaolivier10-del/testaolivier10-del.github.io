/* Figures for the resonance notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Resonance comes right after skeletal structures and curved arrows, so a
   reader can already read a hexagon as benzene. Chains are still drawn with
   every heavy atom labeled (CH₃, CH₂, CH, C, O, N), because this page is
   about where each lone pair and each charge sits, and a labeled atom gives
   those a place to sit. Lone pairs are two dots; every formal charge sits
   beside the atom that carries it; curved arrows start on a lone pair or a
   bond and end where the pair goes.

   Notes figures lay panels side by side. The lesson copies (ids that start
   with l-) stack them at 340 wide and use only fg-lbl and fg-tag text. */
import { atom, bond, arrow, curve, lonePair, text, tag, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { ringDouble, polyPts } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const f2 = (v) => Math.round(v * 100) / 100;
/* Screen angles: 0 is east, 90 is straight down. */
const at = (p, deg, len) => P(p.x + Math.cos(deg * Math.PI / 180) * len, p.y + Math.sin(deg * Math.PI / 180) * len);
const mid = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2);
const rad = (a) => a.r ?? (a.l === 'H' ? 11 : a.l.length === 1 ? 14 : a.l.length === 2 ? 15 : 17);

/* A molecule. `atoms` maps id -> {x, y, l, k}. `bonds` are [a, b, order, cls].
   `lp` are [atom, angle]. `q` are [atom, sign, angle, dist]. `arrows` are
   [from, to, bow] in absolute points. */
function mol(m) {
  const A = m.atoms;
  let s = '';
  for (const [a, b, order = 1, cls] of m.bonds || []) {
    s += bond(A[a], A[b], { order, cls, rFrom: rad(A[a]), rTo: rad(A[b]) });
  }
  for (const [id, ang, dist] of m.lp || []) s += lonePair(A[id].x, A[id].y, ang, { dist: dist ?? rad(A[id]) + 8 });
  for (const id of Object.keys(A)) {
    const a = A[id];
    s += atom(a.x, a.y, a.l, { kind: a.k, r: rad(a) });
  }
  for (const [id, sign, ang, dist] of m.q || []) {
    const p = at(A[id], ang, dist ?? rad(A[id]) + 9);
    s += text(p.x, p.y + 4.5, sign, { cls: 'fg-lbl', size: 13 });
  }
  for (const [a, b, bow] of m.arrows || []) s += curve(a, b, { bow, size: 7 });
  return s;
}

/* The tail of an arrow that starts on a lone pair: the pair's own spot. */
const lpAt = (p, ang, r = 14) => at(p, ang, r + 8);
/* A point just beside the middle of a bond, on the side of `toward`. */
function bondSide(a, b, deg, off = 5) {
  return at(mid(a, b), deg, off);
}

/* A resonance arrow (one line, a head at each end). */
function resArrow(a, b) {
  const m = mid(a, b);
  return arrow(m, b, { size: 7 }) + arrow(m, a, { size: 7 });
}

/* Equilibrium arrows: two half-headed arrows, one each way. */
function eqArrow(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len, px = -uy, py = ux;
  const off = 3.5, hs = 8;
  const top = [P(a.x - px * off, a.y - py * off), P(b.x - px * off, b.y - py * off)];
  const bot = [P(b.x + px * off, b.y + py * off), P(a.x + px * off, a.y + py * off)];
  const line = (p, q) => `<line class="fg-arrow" x1="${f2(p.x)}" y1="${f2(p.y)}" x2="${f2(q.x)}" y2="${f2(q.y)}"></line>`;
  let s = line(top[0], top[1]) + line(bot[0], bot[1]);
  // barbs: the forward arrow's barb on its outer (upper) side, the back arrow's on its lower side
  const b1 = P(top[1].x - ux * hs - px * 5, top[1].y - uy * hs - py * 5);
  const b2 = P(bot[1].x + ux * hs + px * 5, bot[1].y + uy * hs + py * 5);
  s += line(top[1], b1) + line(bot[1], b2);
  return s;
}

/* A bond drawn as one solid line plus one dashed line: a partial double bond. */
function partial(a, b, rA, rB, side = 1, gap = 3.5) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len, px = -uy * side, py = ux * side;
  const p1 = P(a.x + ux * rA, a.y + uy * rA), p2 = P(b.x - ux * rB, b.y - uy * rB);
  const l = (cls, o) => `<line class="${cls}" x1="${f2(p1.x + px * o)}" y1="${f2(p1.y + py * o)}" x2="${f2(p2.x + px * o)}" y2="${f2(p2.y + py * o)}"></line>`;
  return l('fg-bond', -gap) + l('fg-dash-hi', gap);
}

/* ---------------------------------------------------------- acetate ---
   C at c, CH₃ straight up, O1 lower left, O2 lower right. `form` 'A' puts
   the minus on O1 and the double bond to O2; 'B' is the mirror image.
   `arrows` draws the two arrows that turn A into B. `bare` leaves the lone
   pairs off. */
function acetate(c, form, o = {}) {
  const L = o.L ?? 50;
  const atoms = {
    c: { ...c, l: 'C' },
    m: { ...at(c, 270, L), l: 'CH₃' },
    o1: { ...at(c, 150, L), l: 'O' },
    o2: { ...at(c, 30, L), l: 'O' },
  };
  const neg = form === 'A' ? 'o1' : 'o2';
  const dbl = form === 'A' ? 'o2' : 'o1';
  atoms[neg].k = 'hi';
  const lp = [];
  if (!o.bare) {
    if (neg === 'o1') lp.push(['o1', 60], ['o1', 150], ['o1', 240]);
    else lp.push(['o2', 120], ['o2', 30], ['o2', 300]);
    if (dbl === 'o2') lp.push(['o2', 330], ['o2', 90]);
    else lp.push(['o1', 210], ['o1', 90]);
  }
  const q = [[neg, '−', neg === 'o1' ? 282 : 258, 27]];
  const arrows = [];
  if (o.arrows) {
    // A -> B: a lone pair on O1 becomes the C–O1 pi bond; the C=O2 pi bond becomes a lone pair on O2.
    arrows.push([at(lpAt(atoms.o1, 60), 60, 4), bondSide(atoms.c, atoms.o1, 60, 7), 18]);
    if (!o.oneArrow) arrows.push([bondSide(atoms.c, atoms.o2, 300, 7), at(atoms.o2, 285, 21), -20]);
  }
  return mol({
    atoms,
    bonds: [['c', 'm'], ['c', 'o1', form === 'B' ? 2 : 1], ['c', 'o2', form === 'A' ? 2 : 1]],
    lp, q, arrows,
  });
}

/* The hybrid: both C–O bonds drawn part double, half the charge on each O. */
function acetateHybrid(c, o = {}) {
  const L = o.L ?? 50;
  const C = c, M = at(c, 270, L), O1 = at(c, 150, L), O2 = at(c, 30, L);
  let s = bond(C, M, { rFrom: 14, rTo: 17 });
  s += partial(C, O1, 14, 14, -1) + partial(C, O2, 14, 14, 1);
  s += atom(M.x, M.y, 'CH₃', { r: 17 }) + atom(C.x, C.y, 'C', { r: 14 });
  s += atom(O1.x, O1.y, 'O', { kind: 'hi', r: 14 }) + atom(O2.x, O2.y, 'O', { kind: 'hi', r: 14 });
  const t1 = at(O1, 120, 30), t2 = at(O2, 60, 30);
  s += text(t1.x, t1.y + 4.5, '−½', { cls: 'fg-lbl', size: 13 });
  s += text(t2.x, t2.y + 4.5, '−½', { cls: 'fg-lbl', size: 13 });
  return s;
}

/* --------------------------------------------------------- 1 acetate --- */
FIGURES.push({
  id: 'res-acetate',
  section: 'resonance',
  alt: 'Acetate drawn two ways. In drawing A the left oxygen carries the minus charge and three lone pairs and the right oxygen is double-bonded; two curved arrows run from a lone pair on the left oxygen into the left C–O bond and from the C=O double bond onto the right oxygen. Drawing B is the mirror image, and a double-headed arrow links A and B. On the right, the hybrid: both C–O bonds drawn as one solid and one dashed line, each oxygen labeled minus one half, both bonds 126 picometers.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += tag(120, 26, 'drawing A');
    s += tag(360, 26, 'drawing B');
    s += acetate(P(120, 130), 'A', { arrows: true });
    s += acetate(P(360, 130), 'B');
    s += resArrow(P(215, 150), P(265, 150));
    s += text(240, 226, 'the atoms sit in the same places in A and B', { cls: 'fg-sm', size: 10.5 });
    s += rule(492, 30, 492, 226);
    s += tag(626, 26, 'the real ion: the hybrid', { cls: 'fg-tag-good' });
    s += acetateHybrid(P(626, 130));
    s += tag(626, 212, 'both C–O bonds 126 pm');
    s += text(626, 230, 'single C–O 143 pm · double C=O 123 pm', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The two arrows on A give B. On the right, the dashed line marks the half of each C–O bond that is a π bond in one drawing and not in the other.',
});

FIGURES.push({
  id: 'l-res-acetate',
  lessons: ['resonance'],
  alt: 'Top: acetate drawings A and B linked by a double-headed arrow, with two curved arrows on A that turn it into B. Bottom: the hybrid, with both C–O bonds drawn part double and minus one half on each oxygen.',
  viewBox: '0 0 340 370',
  build() {
    let s = '';
    s += panel(4, 4, 332, 186);
    s += tag(82, 26, 'A');
    s += tag(258, 26, 'B');
    s += acetate(P(82, 104), 'A', { arrows: true, L: 44 });
    s += acetate(P(258, 104), 'B', { L: 44 });
    s += resArrow(P(152, 124), P(188, 124));
    s += tag(170, 178, 'same atoms, electrons moved');
    s += panel(4, 198, 332, 168, { kind: 'good' });
    s += tag(170, 220, 'the real ion: the hybrid', { cls: 'fg-tag-good' });
    s += acetateHybrid(P(170, 282), { L: 44 });
    s += tag(170, 354, 'both C–O bonds 126 pm');
    return s;
  },
  caption: 'Arrows on A give B. The hybrid is one ion, not the two taking turns.',
});

export default FIGURES;
