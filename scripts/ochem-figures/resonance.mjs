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
  caption: 'The two arrows turn A into B. The hybrid is a single ion; it does not switch between A and B.',
});

/* ------------------------------------------------ chain molecules ---
   Three heavy atoms in a zigzag: a1 at o, a2 up and to the right, a3 down
   and to the right. Each builder returns the atoms so arrows can be aimed. */
function chain3(o, L, labels) {
  const a1 = o, a2 = at(a1, 330, L), a3 = at(a2, 30, L);
  return { a1: { ...a1, l: labels[0] }, a2: { ...a2, l: labels[1] }, a3: { ...a3, l: labels[2] } };
}

/* An enol, CH₂=CH–OH ('start'), or its second structure ⁻CH₂–CH=OH⁺ ('end'). */
function enol(o, form, opt = {}) {
  const L = opt.L ?? 50;
  const A = chain3(o, L, ['CH₂', 'CH', 'O']);
  A.h = { ...at(A.a3, 330, 36), l: 'H', k: opt.hiH ? 'hi' : undefined };
  if (form === 'start') {
    const arrows = opt.arrows ? [
      [at(lpAt(A.a3, 130), 130, 4), bondSide(A.a2, A.a3, 120, 7), -20],
      [bondSide(A.a1, A.a2, 240, 7), at(A.a1, 250, 22), 14],
    ] : [];
    return mol({ atoms: A, bonds: [['a1', 'a2', 2], ['a2', 'a3'], ['a3', 'h']], lp: [['a3', 50], ['a3', 130]], arrows });
  }
  A.a1.k = 'hi'; A.a3.k = 'hi';
  return mol({ atoms: A, bonds: [['a1', 'a2'], ['a2', 'a3', 2], ['a3', 'h']], lp: [['a1', 220, 26], ['a3', 90]], q: [['a1', '−', 150, 27], ['a3', '+', 270, 25]] });
}

/* The allyl cation, CH₂=CH–CH₂⁺ ('start'), or ⁺CH₂–CH=CH₂ ('end'). */
function allyl(o, form, opt = {}) {
  const L = opt.L ?? 50;
  const A = chain3(o, L, ['CH₂', 'CH', 'CH₂']);
  if (form === 'start') {
    A.a3.k = 'warn';
    const arrows = opt.arrows ? [[bondSide(A.a1, A.a2, 240, 9), bondSide(A.a2, A.a3, 300, 9), -44]] : [];
    return mol({ atoms: A, bonds: [['a1', 'a2', 2], ['a2', 'a3']], q: [['a3', '+', 300, 27]], arrows });
  }
  A.a1.k = 'warn';
  return mol({ atoms: A, bonds: [['a1', 'a2'], ['a2', 'a3', 2]], q: [['a1', '+', 240, 27]] });
}

/* Formaldehyde, H₂C=O ('start'), or H₂C⁺–O⁻ ('end'). C on the left. */
function formaldehyde(o, form, opt = {}) {
  const L = opt.L ?? 50;
  const atoms = { c: { ...o, l: 'C' }, o: { ...at(o, 0, L), l: 'O' }, h1: { ...at(o, 150, 36), l: 'H' }, h2: { ...at(o, 210, 36), l: 'H' } };
  const hb = [['c', 'h1'], ['c', 'h2']];
  if (form === 'start') {
    const arrows = opt.arrows ? [[bondSide(atoms.c, atoms.o, 270, 7), at(atoms.o, 280, 21), -16]] : [];
    return mol({ atoms, bonds: [['c', 'o', 2], ...hb], lp: [['o', 330], ['o', 30]], arrows });
  }
  atoms.c.k = 'warn'; atoms.o.k = 'hi';
  return mol({ atoms, bonds: [['c', 'o'], ...hb], lp: [['o', 270], ['o', 0], ['o', 90]], q: [['c', '+', 270, 24], ['o', '−', 315, 30]] });
}

/* An enolate, CH₂=CH–O⁻ ('A') or ⁻CH₂–CH=O ('B'). */
function enolate(o, form, opt = {}) {
  const L = opt.L ?? 50;
  const A = chain3(o, L, ['CH₂', 'CH', 'O']);
  if (form === 'A') {
    A.a3.k = 'hi';
    const arrows = opt.arrows ? [
      [at(lpAt(A.a3, 120), 120, 4), bondSide(A.a2, A.a3, 120, 7), -20],
      [bondSide(A.a1, A.a2, 240, 7), at(A.a1, 250, 22), 14],
    ] : [];
    return mol({ atoms: A, bonds: [['a1', 'a2', 2], ['a2', 'a3']], lp: [['a3', 300], ['a3', 30], ['a3', 120]], q: [['a3', '−', 345, 30]], arrows });
  }
  A.a1.k = 'hi';
  return mol({ atoms: A, bonds: [['a1', 'a2'], ['a2', 'a3', 2]], lp: [['a1', 220, 26], ['a3', 330], ['a3', 90]], q: [['a1', '−', 150, 27]] });
}

/* Acetamide, CH₃–C(=O)–NH₂ ('A'), or CH₃–C(–O⁻)=NH₂⁺ ('B'). C at o, O up. */
function amide(o, form, opt = {}) {
  const L = opt.L ?? 50;
  const atoms = {
    c: { ...o, l: 'C' }, ox: { ...at(o, 270, L), l: 'O' }, m: { ...at(o, 150, L), l: 'CH₃' }, n: { ...at(o, 30, L), l: 'N' },
  };
  atoms.h1 = { ...at(atoms.n, 330, 36), l: 'H' };
  atoms.h2 = { ...at(atoms.n, 90, 36), l: 'H' };
  const base = [['c', 'm'], ['n', 'h1'], ['n', 'h2']];
  if (form === 'A') {
    const arrows = opt.arrows ? [
      [at(atoms.n, 285, 31), bondSide(atoms.c, atoms.n, 300, 8), -26],
      [bondSide(atoms.c, atoms.ox, 0, 7), at(atoms.ox, 5, 18), -18],
    ] : [];
    return mol({ atoms, bonds: [['c', 'ox', 2], ['c', 'n'], ...base], lp: [['ox', 210], ['ox', 330], ['n', 270]], arrows });
  }
  atoms.ox.k = 'hi'; atoms.n.k = 'warn';
  return mol({ atoms, bonds: [['c', 'ox'], ['c', 'n', 2], ...base], lp: [['ox', 210], ['ox', 270], ['ox', 330]], q: [['ox', '−', 30, 28], ['n', '+', 270, 25]] });
}

/* Ethylamine, CH₃–CH₂–NH₂: a lone pair with no π bond beside it. */
function ethylamine(o, opt = {}) {
  const L = opt.L ?? 50;
  const A = chain3(o, L, ['CH₃', 'CH₂', 'N']);
  A.h1 = { ...at(A.a3, 0, 36), l: 'H' };
  A.h2 = { ...at(A.a3, 90, 36), l: 'H' };
  return mol({ atoms: A, bonds: [['a1', 'a2'], ['a2', 'a3'], ['a3', 'h1'], ['a3', 'h2']], lp: [['a3', 290]] });
}

/* Allylamine, CH₂=CH–CH₂–NH₂: the pair is two atoms from the π bond. */
function allylamine(o, opt = {}) {
  const L = opt.L ?? 50;
  const A = chain3(o, L, ['CH₂', 'CH', 'CH₂']);
  A.n = { ...at(A.a3, 330, L), l: 'N' };
  A.h1 = { ...at(A.n, 30, 36), l: 'H' };
  A.h2 = { ...at(A.n, 270, 36), l: 'H' };
  return mol({ atoms: A, bonds: [['a1', 'a2', 2], ['a2', 'a3'], ['a3', 'n'], ['n', 'h1'], ['n', 'h2']], lp: [['n', 90]] });
}

/* Vinylamine, CH₂=CH–NH₂, with the two arrows of the lone-pair move. */
function vinylamine(o, opt = {}) {
  const L = opt.L ?? 50;
  const A = chain3(o, L, ['CH₂', 'CH', 'N']);
  A.h1 = { ...at(A.a3, 330, 36), l: 'H' };
  A.h2 = { ...at(A.a3, 90, 36), l: 'H' };
  const arrows = [
    [at(A.a3, 165, 31), bondSide(A.a2, A.a3, 120, 8), -26],
    [bondSide(A.a1, A.a2, 240, 7), at(A.a1, 250, 22), 14],
  ];
  return mol({ atoms: A, bonds: [['a1', 'a2', 2], ['a2', 'a3'], ['a3', 'h1'], ['a3', 'h2']], lp: [['a3', 150]], arrows });
}

/* Protonated acetone, (CH₃)₂C=OH⁺ ('A') or (CH₃)₂C⁺–OH ('B'). C at o, O right. */
function protonated(o, form, opt = {}) {
  const L = opt.L ?? 50;
  const atoms = {
    c: { ...o, l: 'C' }, ox: { ...at(o, 0, L), l: 'O' }, m1: { ...at(o, 150, L), l: 'CH₃' }, m2: { ...at(o, 210, L), l: 'CH₃' },
  };
  atoms.h = { ...at(atoms.ox, 300, 36), l: 'H' };
  const base = [['c', 'm1'], ['c', 'm2'], ['ox', 'h']];
  if (form === 'A') {
    atoms.ox.k = 'hi';
    const arrows = opt.arrows ? [[bondSide(atoms.c, atoms.ox, 90, 7), at(atoms.ox, 110, 21), 16]] : [];
    return mol({ atoms, bonds: [['c', 'ox', 2], ...base], lp: [['ox', 50]], q: [['ox', '+', 355, 27]], arrows });
  }
  atoms.c.k = 'warn';
  return mol({ atoms, bonds: [['c', 'ox'], ...base], lp: [['ox', 30], ['ox', 110]], q: [['c', '+', 270, 24]] });
}

/* A vertical resonance arrow for stacked lesson panels. */
const resDown = (x, y1, y2) => resArrow(P(x, y1), P(x, y2));

/* ------------------------------------------------- 2 legal or not --- */
function acetateFive(c, L = 50) {
  const atoms = { c: { ...c, l: 'C', k: 'warn' }, m: { ...at(c, 270, L), l: 'CH₃' }, o1: { ...at(c, 150, L), l: 'O' }, o2: { ...at(c, 30, L), l: 'O' } };
  return mol({ atoms, bonds: [['c', 'm'], ['c', 'o1', 2], ['c', 'o2', 2]], lp: [['o1', 210], ['o1', 90], ['o2', 330], ['o2', 90]], q: [['c', '−', 90, 24]] });
}

FIGURES.push({
  id: 'res-legal',
  section: 'resonance',
  alt: 'Left: acetate drawing A with only one curved arrow, from a lone pair on the left oxygen into the left C–O bond. A straight arrow leads to the result on the right: the carbon now has two double bonds and a bond to CH3, five bonds in all, and is marked as not a structure.',
  viewBox: '0 0 620 220',
  build() {
    let s = '';
    s += tag(130, 26, 'one arrow only');
    s += acetate(P(130, 120), 'A', { arrows: true, oneArrow: true });
    s += arrow(P(250, 140), P(330, 140), { muted: true });
    s += panel(372, 12, 236, 196, { kind: 'warn' });
    s += tag(490, 32, 'not a structure', { cls: 'fg-tag-warn' });
    s += acetateFive(P(490, 120));
    s += tag(490, 190, 'C: 5 bonds = 10 electrons', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Left: the lone-pair arrow on its own. Right: the carbon it leaves behind, with five bonds.',
});

FIGURES.push({
  id: 'l-res-legal',
  lessons: ['resonance'],
  alt: 'Top: acetate drawing A with only one curved arrow, from a lone pair on the left oxygen into the left C–O bond. Bottom: the result, a carbon with two double bonds and a bond to CH3, five bonds in all, marked as not a structure.',
  viewBox: '0 0 340 376',
  build() {
    let s = '';
    s += panel(4, 4, 332, 160);
    s += tag(170, 26, 'one arrow only');
    s += acetate(P(170, 100), 'A', { arrows: true, oneArrow: true, L: 44 });
    s += arrow(P(170, 168), P(170, 192), { muted: true });
    s += panel(4, 196, 332, 176, { kind: 'warn' });
    s += tag(170, 218, 'not a structure', { cls: 'fg-tag-warn' });
    s += acetateFive(P(170, 290), 44);
    s += tag(170, 362, 'C: 5 bonds = 10 electrons', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'The C=O π bond has to move too. Without that second arrow, carbon ends up with five bonds.',
});

/* ------------------------------------------- 3 amine against amide --- */
FIGURES.push({
  id: 'res-conj-pairs',
  section: 'resonance',
  alt: 'Left: ethylamine, CH3–CH2–NH2, with the lone pair on nitrogen. Its neighbors are a CH2 and two hydrogens, none with a π bond, so no arrow can be drawn. Right: acetamide, CH3–C(=O)–NH2. The nitrogen lone pair sits beside the C=O π bond; one curved arrow runs from the lone pair into the C–N bond and a second from the C=O bond onto oxygen.',
  viewBox: '0 0 700 230',
  build() {
    let s = '';
    s += panel(8, 8, 330, 214);
    s += tag(173, 30, 'ethylamine: no π bond next door', { cls: 'fg-tag-mut' });
    s += ethylamine(P(90, 128));
    s += tag(173, 206, 'the pair stays on N', { cls: 'fg-tag-mut' });
    s += panel(362, 8, 330, 214, { kind: 'good' });
    s += tag(527, 30, 'acetamide: C=O right beside N', { cls: 'fg-tag-good' });
    s += amide(P(500, 120), 'A', { arrows: true });
    s += tag(527, 208, 'the pair spreads toward O', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Same nitrogen, same lone pair. Only the right-hand one has a π bond on the next atom for its arrows to use.',
});

/* ------------------------------------------ 4 the p orbitals in a row --- */
function ell(cx, cy, rx, ry, cls) {
  return `<ellipse class="${cls}" cx="${f2(cx)}" cy="${f2(cy)}" rx="${f2(rx)}" ry="${f2(ry)}"></ellipse>`;
}
/* A p orbital standing straight up and down through p. */
const pOrb = (p, len = 30, w = 12) => ell(p.x, p.y - len * 0.55, w, len * 0.5, 'fg-orb') + ell(p.x, p.y + len * 0.55, w, len * 0.5, 'fg-orb-alt');

/* Side view of a flat chain: the atoms on one line (the molecule's plane seen
   edge-on). `atoms` are [label, hasP, extra] with extra 'lpP' (a lone pair in
   the p orbital), 'sp3' (two H below, no p orbital) or 'lp2' (two lone pairs
   in hybrids, above). The last entry can be an H. */
function sideRow(x0, y, dx, atoms) {
  let s = '';
  const pts = atoms.map((_, i) => P(x0 + i * dx, y));
  s += `<line class="fg-dash" x1="${f2(pts[0].x - 30)}" y1="${y}" x2="${f2(pts[pts.length - 1].x + 24)}" y2="${y}"></line>`;
  atoms.forEach(([, hasP], i) => { if (hasP) s += pOrb(pts[i], 40, 13); });
  for (let i = 0; i < pts.length - 1; i++) {
    const rA = atoms[i][0] === 'H' ? 10 : 13, rB = atoms[i + 1][0] === 'H' ? 10 : 13;
    s += bond(pts[i], pts[i + 1], { rFrom: rA, rTo: rB });
  }
  atoms.forEach(([l, , extra], i) => {
    const p = pts[i];
    if (extra === 'sp3') {
      for (const ang of [270, 90]) {
        const h = at(p, ang, 34);
        s += bond(p, h, { rFrom: 13, rTo: 10 }) + atom(h.x, h.y, 'H', { r: 10 });
      }
    }
    s += atom(p.x, p.y, l, { r: l === 'H' ? 10 : 13, kind: extra === 'sp3' ? 'warn' : undefined });
    if (extra === 'lpP') {
      s += `<circle class="fg-lp" cx="${f2(p.x - 4.5)}" cy="${f2(p.y - 25)}" r="2.6"></circle><circle class="fg-lp" cx="${f2(p.x + 4.5)}" cy="${f2(p.y - 25)}" r="2.6"></circle>`;
    }
    if (extra === 'lp2') s += lonePair(p.x, p.y, 235, { dist: 21 }) + lonePair(p.x, p.y, 305, { dist: 21 });
  });
  return { svg: s, pts };
}

const ENOL_ROW = [['C', true], ['C', true], ['O', true, 'lpP'], ['H', false]];
const ALLYLOH_ROW = [['C', true], ['C', true], ['C', false, 'sp3'], ['O', false, 'lp2'], ['H', false]];

FIGURES.push({
  id: 'res-p-row',
  section: 'resonance',
  alt: 'Two molecules seen edge-on, each with its flat plane as a dashed line. Left, CH2=CH–OH: the two carbons and the oxygen each have a p orbital standing up and down, all three parallel, and the oxygen lone pair sits in its p orbital. Right, CH2=CH–CH2–OH: the two alkene carbons have p orbitals, but the CH2 carbon is sp3, with two hydrogens and no p orbital, so the oxygen lone pairs are cut off from the π bond.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += panel(8, 8, 330, 234, { kind: 'good' });
    s += tag(173, 30, 'CH₂=CH–OH', { cls: 'fg-tag-good' });
    const a = sideRow(76, 132, 72, ENOL_ROW);
    s += a.svg;
    s += tag(a.pts[2].x, 80, 'O lone pair');
    s += tag(173, 214, 'three p orbitals in an unbroken row', { cls: 'fg-tag-good' });
    s += tag(173, 230, 'the pair can spread over all three', { cls: 'fg-tag-good' });
    s += panel(356, 8, 396, 234, { kind: 'warn' });
    s += tag(554, 30, 'CH₂=CH–CH₂–OH', { cls: 'fg-tag-warn' });
    const b = sideRow(404, 132, 76, ALLYLOH_ROW);
    s += b.svg;
    s += tag(b.pts[2].x, 88, 'sp³: no p orbital', { cls: 'fg-tag-warn' });
    s += tag(554, 214, 'the row stops at the CH₂', { cls: 'fg-tag-warn' });
    s += tag(554, 230, 'the O pairs are cut off from the π bond', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Each molecule is seen edge-on, so its flat plane is the dashed line. On the left, only the oxygen lone pair that sits in a p orbital is drawn.',
});

FIGURES.push({
  id: 'l-res-p-row',
  lessons: ['resonance'],
  alt: 'Two molecules seen edge-on. Top, CH2=CH–OH: two carbons and the oxygen each have a parallel p orbital, and the oxygen lone pair sits in its p orbital. Bottom, CH2=CH–CH2–OH: the CH2 carbon is sp3, with no p orbital, so the row of p orbitals stops there.',
  viewBox: '0 0 340 420',
  build() {
    let s = '';
    s += panel(4, 4, 332, 200, { kind: 'good' });
    s += tag(170, 26, 'CH₂=CH–OH', { cls: 'fg-tag-good' });
    const a = sideRow(60, 116, 72, ENOL_ROW);
    s += a.svg;
    s += tag(a.pts[2].x, 64, 'O lone pair');
    s += tag(170, 190, 'an unbroken row: the pair spreads', { cls: 'fg-tag-good' });
    s += panel(4, 212, 332, 204, { kind: 'warn' });
    s += tag(170, 234, 'CH₂=CH–CH₂–OH', { cls: 'fg-tag-warn' });
    const b = sideRow(42, 322, 62, ALLYLOH_ROW);
    s += b.svg;
    s += tag(b.pts[2].x, 276, 'sp³: no p', { cls: 'fg-tag-warn' });
    s += tag(170, 402, 'the row stops at the CH₂', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Each molecule is seen edge-on, so its flat plane is the dashed line.',
});

/* ------------------------------------------------- 5 the three moves --- */
FIGURES.push({
  id: 'res-three-moves',
  section: 'resonance',
  alt: 'Three columns, each a starting structure with its curved arrows above the structure it gives, joined by a double-headed arrow. Move 1, a lone pair beside a π bond: CH2=CH–OH, with arrows from an oxygen lone pair into the C–O bond and from the C=C bond onto the end carbon, gives minus CH2–CH=OH plus. Move 2, a π bond beside an empty p orbital: the allyl cation CH2=CH–CH2 plus, with one arrow from the C=C bond into the next C–C bond, gives plus CH2–CH=CH2. Move 3, a π bond to an electronegative atom: formaldehyde H2C=O, with one arrow from the C=O bond onto oxygen, gives H2C plus, O minus.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const cols = [128, 380, 632];
    s += tag(cols[0], 24, '1 · lone pair beside a π bond');
    s += tag(cols[1], 24, '2 · π bond beside an empty p');
    s += tag(cols[2], 24, '3 · π bond to O or N');
    s += rule(254, 36, 254, 290) + rule(506, 36, 506, 290);
    s += enol(P(cols[0] - 70, 104), 'start', { arrows: true });
    s += enol(P(cols[0] - 70, 240), 'end');
    s += resDown(cols[0] + 90, 150, 196);
    s += allyl(P(cols[1] - 60, 104), 'start', { arrows: true });
    s += allyl(P(cols[1] - 60, 240), 'end');
    s += resDown(cols[1] + 90, 150, 196);
    s += tag(cols[1] + 62, 132, 'empty p', { cls: 'fg-tag-warn' });
    s += formaldehyde(P(cols[2] - 30, 96), 'start', { arrows: true });
    s += formaldehyde(P(cols[2] - 30, 236), 'end');
    s += resDown(cols[2] + 80, 150, 196);
    s += tag(cols[0], 42, 'CH₂=CH–OH', { cls: 'fg-tag-mut' });
    s += tag(cols[1], 42, 'the allyl cation', { cls: 'fg-tag-mut' });
    s += tag(cols[2], 42, 'formaldehyde, H₂C=O', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Top row: the arrows for each move. Bottom row: the structure they give, with its new formal charges.',
});

/* --------------------------------------------- 6 tautomer or resonance --- */
function keto(o, L = 46) {
  const A = chain3(o, L, ['CH₂', 'CH', 'O']);
  A.h = { ...at(A.a1, 210, 36), l: 'H', k: 'hi' };
  return mol({ atoms: A, bonds: [['a1', 'a2'], ['a2', 'a3', 2], ['a1', 'h']], lp: [['a3', 330], ['a3', 90]] });
}

FIGURES.push({
  id: 'res-tautomer',
  section: 'resonance',
  alt: 'Left panel, tautomers: acetaldehyde, with a hydrogen on the CH2 carbon highlighted, and the enol CH2=CH–OH, with the same hydrogen now on oxygen, joined by equilibrium half-arrows. Right panel, resonance: the enol CH2=CH–OH and its second structure, minus CH2–CH=OH plus, joined by a double-headed arrow. The atoms do not move.',
  viewBox: '0 0 760 200',
  build() {
    let s = '';
    s += panel(8, 8, 366, 184, { kind: 'warn' });
    s += tag(191, 30, 'tautomers: an H moved', { cls: 'fg-tag-warn' });
    s += keto(P(56, 110));
    s += eqArrow(P(166, 100), P(204, 100));
    s += enol(P(236, 110), 'start', { L: 46, hiH: true });
    s += tag(191, 176, 'two compounds, drawn with ⇌', { cls: 'fg-tag-warn' });
    s += panel(386, 8, 366, 184, { kind: 'good' });
    s += tag(569, 30, 'resonance: only electrons moved', { cls: 'fg-tag-good' });
    s += enol(P(420, 110), 'start', { L: 44, arrows: true });
    s += resArrow(P(552, 100), P(584, 100));
    s += enol(P(616, 110), 'end', { L: 44 });
    s += tag(569, 176, 'one compound, drawn with ↔', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Left: acetaldehyde and its enol. Follow the highlighted H as it changes atoms. Right: the enol’s two resonance structures, where every atom stays put.',
});

/* ------------------------------------------ 7 counting contributors --- */
function dewar(cx, cy, r, k, cls) {
  const pts = polyPts(cx, cy, 6, r, 90);
  const c = P(cx, cy);
  const long = [k, k + 3];
  const dbl = [[(k + 1) % 6, (k + 2) % 6], [(k + 4) % 6, (k + 5) % 6]];
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = i, b = (i + 1) % 6;
    const isD = dbl.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    s += isD ? ringDouble(pts[a], pts[b], c, { inset: 6, cls }) : bond(pts[a], pts[b], { rFrom: 0, rTo: 0, cls });
  }
  s += bond(pts[long[0]], pts[long[1]], { rFrom: 0, rTo: 0, cls });
  return s;
}
function kekule(cx, cy, r, shift) {
  const pts = polyPts(cx, cy, 6, r, 90), c = P(cx, cy);
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = pts[i], b = pts[(i + 1) % 6];
    s += (i % 2 === shift) ? ringDouble(a, b, c, { inset: 6 }) : bond(a, b, { rFrom: 0, rTo: 0 });
  }
  return s;
}
/* Naphthalene: two hexagons sharing a vertical edge. `form` 0, 1 or 2 picks
   which five bonds are double. */
function naphthalene(cx, cy, r, form) {
  const h = r * Math.cos(Math.PI / 6);
  const Lc = P(cx - h, cy), Rc = P(cx + h, cy);
  const Lp = polyPts(Lc.x, Lc.y, 6, r, 90), Rp = polyPts(Rc.x, Rc.y, 6, r, 90);
  // Lp: 0 top, 1 upper-left, 2 lower-left, 3 bottom, 4 lower-right, 5 upper-right (shared)
  const V = { L0: Lp[0], L1: Lp[1], L2: Lp[2], L3: Lp[3], a: Lp[5], b: Lp[4], R0: Rp[0], R5: Rp[5], R4: Rp[4], R3: Rp[3] };
  const edges = [['L0', 'L1', Lc], ['L1', 'L2', Lc], ['L2', 'L3', Lc], ['L3', 'b', Lc], ['b', 'a', Lc], ['a', 'L0', Lc],
    ['a', 'R0', Rc], ['R0', 'R5', Rc], ['R5', 'R4', Rc], ['R4', 'R3', Rc], ['R3', 'b', Rc]];
  const D = [
    ['L0-L1', 'L2-L3', 'b-a', 'R0-R5', 'R4-R3'],
    ['a-L0', 'L1-L2', 'L3-b', 'R0-R5', 'R4-R3'],
    ['L0-L1', 'L2-L3', 'a-R0', 'R5-R4', 'R3-b'],
  ][form];
  let s = '';
  for (const [x, y, cen] of edges) {
    const isD = D.includes(`${x}-${y}`) || D.includes(`${y}-${x}`);
    s += isD ? ringDouble(V[x], V[y], cen, { inset: 6 }) : bond(V[x], V[y], { rFrom: 0, rTo: 0 });
  }
  return s;
}

FIGURES.push({
  id: 'res-count',
  section: 'resonance',
  alt: 'Top row, benzene: the two Kekulé structures, with the three double bonds in alternate positions, joined by a double-headed arrow, then the three Dewar structures, each with a long bond straight across the ring and only two double bonds, drawn faintly. Bottom row, naphthalene, two hexagons sharing one edge: its three structures, joined by double-headed arrows, each with five double bonds in a different arrangement.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(160, 24, 'benzene: two Kekulé structures');
    s += kekule(90, 84, 34, 0) + resArrow(P(134, 84), P(186, 84)) + kekule(230, 84, 34, 1);
    s += rule(300, 40, 300, 130);
    s += tag(530, 24, 'three Dewar structures: a pairing across', { cls: 'fg-tag-mut' });
    [0, 1, 2].forEach((k, i) => { s += dewar(400 + i * 130, 84, 34, k, 'fg-bond-soft'); });
    s += tag(160, 146, 'these two matter');
    s += tag(530, 146, 'minor, usually ignored', { cls: 'fg-tag-mut' });
    s += rule(20, 162, 740, 162);
    s += tag(380, 184, 'naphthalene: three Kekulé structures');
    const xs = [140, 380, 620];
    xs.forEach((x, i) => { s += naphthalene(x, 244, 32, i); });
    s += resArrow(P(218, 244), P(302, 244)) + resArrow(P(458, 244), P(542, 244));
    return s;
  },
  caption: 'Within each row the atoms never move. Only the double bonds change places.',
});

/* ----------------------------------------------- 8 ranking, enolate --- */
FIGURES.push({
  id: 'res-rank-enolate',
  section: 'resonance',
  alt: 'The enolate CH2=CH–O minus, with three lone pairs on oxygen and two curved arrows, one from an oxygen lone pair into the C–O bond and one from the C=C bond onto the end carbon. A double-headed arrow leads to minus CH2–CH=O, with a lone pair and the minus charge on the end carbon. The first is labeled major, minus on oxygen; the second minor, minus on carbon.',
  viewBox: '0 0 560 160',
  build() {
    let s = '';
    s += enolate(P(52, 82), 'A', { arrows: true });
    s += resArrow(P(236, 72), P(290, 72));
    s += enolate(P(346, 82), 'B');
    s += tag(122, 146, 'major: − on O', { cls: 'fg-tag-good' });
    s += tag(416, 146, 'minor: − on C', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'The shaded atom holds the negative charge in each structure.',
});

FIGURES.push({
  id: 'l-res-enolate',
  lessons: ['resonance'],
  alt: 'Top: the enolate CH2=CH–O minus with two curved arrows, labeled major, minus on oxygen. Bottom: minus CH2–CH=O, with the lone pair and minus charge on carbon, labeled minor. A double-headed arrow joins them.',
  viewBox: '0 0 340 280',
  build() {
    let s = '';
    s += panel(4, 4, 332, 126, { kind: 'good' });
    s += enolate(P(112, 76), 'A', { arrows: true, L: 46 });
    s += tag(170, 118, 'major: − on O', { cls: 'fg-tag-good' });
    s += resDown(170, 133, 147);
    s += panel(4, 150, 332, 126);
    s += enolate(P(112, 222), 'B', { L: 46 });
    s += tag(170, 264, 'minor: − on C', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'The shaded atom holds the negative charge in each structure.',
});

/* ------------------------------------- 9 ranking, protonated carbonyl --- */
FIGURES.push({
  id: 'res-rank-protonated',
  section: 'resonance',
  alt: 'Protonated acetone, (CH3)2C=O–H plus, with the plus charge on oxygen and a curved arrow from the C=O bond onto oxygen. A double-headed arrow leads to (CH3)2C plus–OH, with the plus on carbon and two lone pairs on oxygen. The first is labeled major, every atom has an octet; the second minor, carbon has only six electrons.',
  viewBox: '0 0 560 170',
  build() {
    let s = '';
    s += protonated(P(110, 80), 'A', { arrows: true });
    s += resArrow(P(236, 80), P(290, 80));
    s += protonated(P(400, 80), 'B');
    s += tag(122, 156, 'major: every atom has an octet', { cls: 'fg-tag-good' });
    s += tag(416, 156, 'minor: C has only six', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'The shaded atom holds the positive charge in each structure. Count the electrons around carbon on the right.',
});

FIGURES.push({
  id: 'l-res-prot-ask',
  lessons: ['resonance'],
  alt: 'Structure 1: (CH3)2C=O–H plus, with the plus charge on oxygen and one lone pair on oxygen. Structure 2: (CH3)2C plus–OH, with the plus charge on carbon and two lone pairs on oxygen. A double-headed arrow joins them.',
  viewBox: '0 0 340 320',
  build() {
    let s = '';
    s += panel(4, 4, 332, 140);
    s += tag(30, 28, '1');
    s += protonated(P(150, 80), 'A', { L: 46 });
    s += resDown(170, 148, 172);
    s += panel(4, 176, 332, 140);
    s += tag(30, 200, '2');
    s += protonated(P(150, 252), 'B', { L: 46 });
    return s;
  },
  caption: 'Two structures of acetone with an H⁺ on its oxygen.',
});

/* ------------------------------------------------- 10 amide, flat --- */
FIGURES.push({
  id: 'res-amide',
  section: 'resonance',
  alt: 'Left: acetamide drawn two ways, CH3–C(=O)–NH2 with two curved arrows, and CH3–C(O minus)=NH2 plus, joined by a double-headed arrow. Right: the same six atoms, O, C, N, the CH3 carbon and the two H on nitrogen, drawn lying on one tilted flat plane, with the C–N bond labeled part double and the plane labeled all six atoms flat.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += amide(P(88, 126), 'A', { arrows: true });
    s += resArrow(P(184, 126), P(228, 126));
    s += amide(P(282, 126), 'B');
    s += tag(88, 234, 'major');
    s += tag(282, 234, 'minor, but it counts', { cls: 'fg-tag-mut' });
    s += rule(382, 30, 382, 230);
    // The six atoms on a flat plane seen from above at a slant: x runs
    // across the page, y runs back into it (drawn up and to the right).
    const sq = (x, y) => P(540 + x * 0.95 + y * 0.42, 134 + y * 0.4);
    const C = sq(0, 0), O = sq(-6, -100), M = sq(-96, 44), N = sq(86, 44), H1 = sq(140, 10), H2 = sq(90, 120);
    const plane = [sq(-110, -125), sq(150, -125), sq(150, 165), sq(-110, 165)];
    s += `<polygon class="fg-panel-hi" points="${plane.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ')}"></polygon>`;
    s += partial(C, O, 14, 14, 1);
    s += bond(C, M, { rFrom: 14, rTo: 17 });
    s += partial(C, N, 14, 14, 1);
    s += bond(N, H1, { rFrom: 14, rTo: 11 }) + bond(N, H2, { rFrom: 14, rTo: 11 });
    s += atom(C.x, C.y, 'C') + atom(O.x, O.y, 'O') + atom(M.x, M.y, 'CH₃', { r: 17 }) + atom(N.x, N.y, 'N', { kind: 'hi' });
    s += atom(H1.x, H1.y, 'H', { r: 11 }) + atom(H2.x, H2.y, 'H', { r: 11 });
    const lab = mid(C, N);
    s += tag(lab.x - 4, lab.y + 40, 'C–N part double');
    s += tag(580, 240, 'all six atoms in one plane', { cls: 'fg-tag' });
    return s;
  },
  caption: 'Right: the real amide. Each dashed line marks a part-double bond, and the shaded plane holds all six atoms.',
});

/* ------------------------------------------------ lesson questions --- */
function acetateH(c, L = 40) {
  // ⁻CH₂–C(=O)–OH: a methyl H moved onto the left oxygen.
  const atoms = { c: { ...c, l: 'C' }, m: { ...at(c, 270, L), l: 'CH₂' }, o1: { ...at(c, 150, L), l: 'O' }, o2: { ...at(c, 30, L), l: 'O' } };
  atoms.h = { ...at(atoms.o1, 210, 32), l: 'H' };
  return mol({ atoms, bonds: [['c', 'm'], ['c', 'o1'], ['c', 'o2', 2], ['o1', 'h']], lp: [['m', 200, 25], ['o1', 60], ['o1', 280], ['o2', 330], ['o2', 90]], q: [['m', '−', 340, 26]] });
}

FIGURES.push({
  id: 'l-res-acetate-ask',
  lessons: ['resonance'],
  alt: 'Four drawings. Given: acetate with the minus charge on the left oxygen and the double bond to the right oxygen. A: the minus charge on the right oxygen and the double bond to the left oxygen. B: a CH2 with a minus charge and a lone pair on top, bonded to a carbon that has a double bond to the right oxygen and a single bond to a left oxygen carrying an H. C: the minus on the right oxygen and the double bond to the left oxygen, with no lone pairs drawn.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    const cells = [[4, 4, 'given'], [172, 4, 'A'], [4, 168, 'B'], [172, 168, 'C']];
    for (const [x, y, t] of cells) {
      s += panel(x, y, 164, 158, { kind: t === 'given' ? 'hi' : undefined });
      s += tag(x + 18, y + 22, t, { anchor: 'start' });
    }
    s += acetate(P(86, 96), 'A', { L: 40 });
    s += acetate(P(254, 96), 'B', { L: 40 });
    s += acetateH(P(86, 262));
    s += acetate(P(254, 262), 'B', { L: 40, bare: true });
    return s;
  },
  caption: 'The top-left drawing is acetate. Compare each of A, B and C with it.',
});

FIGURES.push({
  id: 'l-res-amine-ask',
  lessons: ['resonance'],
  alt: 'Three nitrogen compounds, each with its nitrogen lone pair drawn. A: acetamide, CH3–C(=O)–NH2. B: ethylamine, CH3–CH2–NH2. C: allylamine, CH2=CH–CH2–NH2.',
  viewBox: '0 0 340 420',
  build() {
    let s = '';
    s += panel(4, 4, 332, 150);
    s += tag(24, 26, 'A');
    s += amide(P(150, 92), 'A', { L: 44 });
    s += panel(4, 160, 332, 116);
    s += tag(24, 182, 'B');
    s += ethylamine(P(90, 236), { L: 46 });
    s += panel(4, 282, 332, 134);
    s += tag(24, 304, 'C');
    s += allylamine(P(50, 360), { L: 46 });
    return s;
  },
  caption: 'Look at the atoms bonded to each nitrogen.',
});

FIGURES.push({
  id: 'l-res-vinylamine-ask',
  lessons: ['resonance'],
  alt: 'CH2=CH–NH2 with two curved arrows: one from the nitrogen lone pair into the C–N bond, and one from the C=C bond onto the end CH2 carbon.',
  viewBox: '0 0 340 190',
  build() {
    let s = '';
    s += panel(4, 4, 332, 182);
    s += vinylamine(P(100, 104), { L: 50 });
    s += tag(170, 172, 'follow both arrows');
    return s;
  },
  caption: 'CH₂=CH–NH₂ with two curved arrows: one from the N lone pair, one from the C=C π bond.',
});

FIGURES.push({
  id: 'l-res-amide-ask',
  lessons: ['resonance'],
  alt: 'Structure 1: acetamide, CH3–C(=O)–NH2, with two lone pairs on oxygen and one on nitrogen. Structure 2: CH3–C(O minus)=NH2 plus, with three lone pairs and a minus charge on oxygen and a plus charge on nitrogen. A double-headed arrow joins them.',
  viewBox: '0 0 340 360',
  build() {
    let s = '';
    s += panel(4, 4, 332, 170);
    s += tag(24, 26, '1');
    s += amide(P(150, 100), 'A', { L: 46 });
    s += resDown(170, 177, 197);
    s += panel(4, 200, 332, 156);
    s += tag(24, 222, '2');
    s += amide(P(150, 290), 'B', { L: 46 });
    return s;
  },
  caption: 'Two structures of acetamide.',
});

export default FIGURES;
