/* Figures for the acetals notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   One worked example runs through the whole page: acetone and methanol,
   under an acid catalyst, giving 2-methoxypropan-2-ol (the hemiacetal) and
   then 2,2-dimethoxypropane (the acetal). Every atom that changes is written
   out with its label, its lone pairs and its charge, so each curved arrow
   can be checked against the structure it acts on.

   The seven elementary steps are drawn as one panel per step. Each panel
   shows the species BEFORE the step, with that step's arrows on it; the
   next panel shows the result. The panels are 340 wide so the same panel
   can sit two to a row on the notes page and one above another in the
   lesson, which shows the mechanism in three parts (steps 1-3, 4-5, 6-7).

   Geometry is kept the same from panel to panel so the eye can follow the
   two oxygens: in a four-bonded (sp3) carbon, the oxygen that is being
   changed sits up-left and the other one up-right, and the two CH3 groups
   point down. A three-bonded (sp2) carbon has its oxygen straight up.

   Lesson copies (id prefix l-) are 340 wide or less, stacked, and use only
   fg-lbl and fg-tag text. */
import { atom as atom0, bond, wedge, hash, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { sk, polyPts, ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
/* A lone pair pointing out along math angle `deg`. */
const lp = (c, deg) => lonePair(c.x, c.y, -deg, { dist: 22, spread: 4.5, r: 2.4 });
/* Where a curved arrow should start when it leaves the lone pair at `deg`. */
const lpTip = (c, deg) => at(c, deg, 28);

/* An atom disc that stays opaque in both themes (the tinted discs are
   translucent in the dark theme, so an opaque plain disc goes under them). */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
const rOf = (l) => (l.length >= 3 ? 18 : l === 'H' ? 12 : l === 'C' ? 16 : 15);
const charge = (p, s = '+') => text(p.x, p.y + 5, s, { cls: 'fg-warn', size: 15 });
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });

/* A group bonded to point `from` (whose disc has radius rFrom). */
function arm(from, deg, len, l, o = {}) {
  const e = at(from, deg, len);
  const r = o.r ?? rOf(l);
  let s = o.bond === 'wedge' ? wedge(from, e, { rFrom: o.rFrom ?? 16, rTo: r, width: 9 })
        : o.bond === 'hash' ? hash(from, e, { rFrom: o.rFrom ?? 16, rTo: r, width: 10, rungs: 5 })
        : bond(from, e, { rFrom: o.rFrom ?? 16, rTo: r, order: o.order || 1 });
  s += atom(e.x, e.y, l, { r, kind: o.kind });
  return { s, e };
}

/* One oxygen on the central carbon: the C–O bond (single or double), the
   oxygen, what else it carries, its lone pairs and its charge. */
function oxygen(c, spec) {
  const o = at(c, spec.deg, spec.len ?? (spec.order === 2 ? 62 : 58));
  let s = bond(c, o, { rFrom: 16, rTo: 15, order: spec.order || 1 });
  const subs = {};
  for (const g of spec.subs || []) {
    const a = arm(o, g.deg, g.len ?? (g.l === 'H' ? 40 : 48), g.l, { rFrom: 15, kind: g.kind });
    s += a.s;
    subs[g.l + (subs[g.l] ? '2' : '')] = a.e;
  }
  for (const d of spec.lps || []) s += lp(o, d);
  s += atom(o.x, o.y, 'O', { kind: spec.kind });
  if (spec.charge !== undefined) s += charge(at(o, spec.charge, 25));
  return { s, o, subs };
}

/* The central carbon with its two methyl groups, plus its oxygens. */
function species(c, { tet = true, oxy = [], cKind = 'warn', cCharge } = {}) {
  let s = '';
  const me = tet ? [225, 315] : [210, 330];
  for (const d of me) s += arm(c, d, 54, d < 270 ? 'H₃C' : 'CH₃').s;
  const os = oxy.map((spec) => oxygen(c, spec));
  for (const k of os) s += k.s;
  s += atom(c.x, c.y, 'C', { kind: cKind });
  if (cCharge !== undefined) s += charge(at(c, cCharge, 26));
  return { s, os };
}

/* A curved arrow from a lone pair on `o` (at angle deg) to point b. */
const fromLp = (o, deg, b, bow) => curve(lpTip(o, deg), b, { bow });
/* A curved arrow that starts on the middle of bond a–b, offset to one side
   by `off` (sign picks the side), and ends at point e. */
function fromBond(a, b, e, bow, off = 0) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  return curve(P(m.x - (dy / L) * off, m.y + (dx / L) * off), e, { bow });
}
/* Equilibrium arrows, one each way. */
function eqArrows(a, b, gap = 5) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const px = (-dy / L) * gap, py = (dx / L) * gap;
  return arrow(P(a.x - px, a.y - py), P(b.x - px, b.y - py), { size: 7 }) +
         arrow(P(b.x + px, b.y + py), P(a.x + px, a.y + py), { size: 7 });
}
function resArrow(a, b) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  return arrow(m, b, { size: 8 }) + arrow(m, a, { size: 8 });
}

/* ---------------------------------------------- the species themselves ---
   Each returns the ink and the points the arrows need. `c` is the central
   carbon. Oxygen geometry (math angles, seen from the oxygen):
     up-left oxygen (135):  its other groups at 180 and/or 90
     up-right oxygen (45):  its other groups at 0 and/or 90
     straight-up oxygen (90): its other group at 30                    */

// acetone, the carbonyl oxygen straight up with two lone pairs
const acetone = (c, kind) => species(c, { tet: false, cKind: kind || 'warn',
  oxy: [{ deg: 90, order: 2, lps: [30, 150] }] });

// protonated acetone: O+ carries H, one lone pair
const protAcetone = (c) => species(c, { tet: false,
  oxy: [{ deg: 90, order: 2, kind: 'hi', subs: [{ deg: 30, l: 'H' }], lps: [150], charge: 95 }] });

// methanol, drawn free: O with H and CH3 at the given angles, lone pairs at the others
function methanol(o, { h, me, lps, kind = 'hi' }) {
  let s = arm(o, h, 40, 'H', { rFrom: 15 }).s + arm(o, me, 48, 'CH₃', { rFrom: 15 }).s;
  for (const d of lps) s += lp(o, d);
  s += atom(o.x, o.y, 'O', { kind });
  return s;
}

// water or H3O+, drawn free: O with H atoms at the given angles
function water(o, { hs, lps, plus }) {
  let s = '';
  for (const d of hs) s += arm(o, d, 40, 'H', { rFrom: 15 }).s;
  for (const d of lps) s += lp(o, d);
  s += atom(o.x, o.y, 'O');
  if (plus !== undefined) s += charge(at(o, plus, 26));
  return s;
}

// the tetrahedral intermediate before the first deprotonation
const oxonium1 = (c) => species(c, { oxy: [
  { deg: 135, subs: [{ deg: 180, l: 'H' }], lps: [80, 250] },
  { deg: 45, kind: 'hi', subs: [{ deg: 90, l: 'H', len: 50 }, { deg: 0, l: 'CH₃' }], lps: [290], charge: 188 },
] });

// the hemiacetal: OH up-left, OCH3 up-right
const hemiacetal = (c, oKinds = []) => species(c, { oxy: [
  { deg: 135, kind: oKinds[0], subs: [{ deg: 180, l: 'H' }], lps: [80, 250] },
  { deg: 45, kind: oKinds[1], subs: [{ deg: 0, l: 'CH₃' }], lps: [110, 290] },
] });

// the protonated hemiacetal: OH2+ up-left
const protHemi = (c) => species(c, { oxy: [
  { deg: 135, kind: 'warn', subs: [{ deg: 180, l: 'H' }, { deg: 90, l: 'H' }], lps: [30], charge: 215 },
  { deg: 45, subs: [{ deg: 0, l: 'CH₃' }], lps: [110, 290] },
] });

// the oxocarbenium ion, C=O+ contributor, oxygen straight up
const oxocarb = (c) => species(c, { tet: false, oxy: [
  { deg: 90, order: 2, kind: 'hi', subs: [{ deg: 30, l: 'CH₃' }], lps: [150], charge: 95 },
] });

// the tetrahedral intermediate before the last deprotonation
const oxonium2 = (c) => species(c, { oxy: [
  { deg: 135, kind: 'hi', subs: [{ deg: 90, l: 'H', len: 50 }, { deg: 180, l: 'CH₃' }], lps: [250], charge: 352 },
  { deg: 45, subs: [{ deg: 0, l: 'CH₃' }], lps: [110, 290] },
] });

// the acetal
const acetal = (c, kind) => species(c, { cKind: kind || 'warn', oxy: [
  { deg: 135, subs: [{ deg: 180, l: 'CH₃' }], lps: [80, 250] },
  { deg: 45, subs: [{ deg: 0, l: 'CH₃' }], lps: [110, 290] },
] });

/* A curved arrow that starts on bond a–b, `side` px off its midpoint to the
   left of the direction a→b (negative for the right), and ends at `e`. */
function bondArrow(a, b, side, e, bow) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  // screen-left of a→b is (dy, -dx)/L
  return curve(P(m.x + (dy / L) * side, m.y - (dx / L) * side), e, { bow });
}

/* ------------------------------------------------- the seven step panels ---
   Each draws into a 340 x PH box at (x, y). Each panel shows the species
   before its step, with the arrows for that step. */
const PW = 340, PH = 304;
function box(x, y, title, note, kind) {
  let s = panel(x + 4, y + 4, PW - 8, PH - 8, kind ? { kind } : {});
  s += tag(x + PW / 2, y + 28, title);
  const lines = Array.isArray(note) ? note : [note];
  lines.forEach((t, i) => { s += lbl(x + PW / 2, y + PH - 22 - (lines.length - 1 - i) * 18, t); });
  return s;
}

const STEPS = {
  1(x, y) {
    let s = box(x, y, 'STEP 1 · PROTONATE THE C=O', 'the carbonyl O takes H⁺ from H₃O⁺');
    const c = P(x + 110, y + 182);
    const k = acetone(c);
    s += k.s;
    const o = k.os[0].o;
    const h = P(x + 222, y + 110), w = P(x + 272, y + 110);
    s += bond(h, w, { rFrom: 12, rTo: 15 }) + atom(h.x, h.y, 'H', { r: 12, kind: 'hi' });
    s += water(w, { hs: [45, 315], lps: [270], plus: 90 });
    s += fromLp(o, 30, P(h.x - 14, h.y), -20);
    s += bondArrow(h, w, 5, at(w, 125, 18), -12);
    return s;
  },
  2(x, y) {
    let s = box(x, y, 'STEP 2 · CH₃OH ADDS TO C', ['two arrows: O to C,', 'and the π bond onto O⁺']);
    const c = P(x + 100, y + 178);
    const k = protAcetone(c);
    s += k.s;
    const o = k.os[0].o;
    const m = at(c, 22, 118);
    s += methanol(m, { h: 90, me: 0, lps: [202, 285] });
    s += fromLp(m, 202, at(c, 22, 21), -18);
    s += bondArrow(c, o, 4, at(o, 205, 19), -14);
    return s;
  },
  3(x, y) {
    let s = box(x, y, 'STEP 3 · LOSE H⁺', 'a water molecule takes the H⁺');
    const c = P(x + 96, y + 188);
    const k = oxonium1(c);
    s += k.s;
    const ob = k.os[1], h = ob.subs.H;
    const base = P(h.x + 100, h.y - 6);
    s += water(base, { hs: [60, 0], lps: [185, 280] });
    s += fromLp(base, 185, P(h.x + 14, h.y - 3), 12);
    s += bondArrow(ob.o, h, 5, at(ob.o, 128, 18), 14);
    return s;
  },
  4(x, y) {
    let s = box(x, y, 'STEP 4 · PROTONATE THE OH', 'the OH, not the OCH₃, takes the H⁺');
    const c = P(x + 176, y + 192);
    const k = hemiacetal(c, ['hi']);
    s += k.s;
    const oa = k.os[0].o;
    const h = P(x + 64, y + 116), w = P(x + 64, y + 68);
    s += bond(h, w, { rFrom: 12, rTo: 15 }) + atom(h.x, h.y, 'H', { r: 12, kind: 'hi' });
    s += water(w, { hs: [150, 30], lps: [90], plus: 210 });
    s += fromLp(oa, 80, P(h.x + 14, h.y + 4), 18);
    s += bondArrow(h, w, -5, at(w, 320, 18), -12);
    return s;
  },
  5(x, y) {
    let s = box(x, y, 'STEP 5 · WATER LEAVES', ['the C–O bond breaks; an OCH₃', 'lone pair makes the C=O⁺']);
    const c = P(x + 176, y + 172);
    const k = protHemi(c);
    s += k.s;
    const oa = k.os[0].o, ob = k.os[1].o;
    s += bondArrow(c, oa, -9, at(oa, 285, 19), -12);
    s += fromLp(ob, 110, at(c, 45, 30), 22);
    return s;
  },
  6(x, y) {
    let s = box(x, y, 'STEP 6 · SECOND CH₃OH ADDS', ['two arrows again: O to C,', 'and the π bond onto O⁺']);
    const c = P(x + 200, y + 178);
    const k = oxocarb(c);
    s += k.s;
    const o = k.os[0].o;
    const m = at(c, 152, 112);
    s += methanol(m, { h: 90, me: 180, lps: [332, 250] });
    s += fromLp(m, 332, at(c, 152, 21), 18);
    s += bondArrow(c, o, -8, at(o, 335, 19), 14);
    return s;
  },
  7(x, y) {
    let s = box(x, y, 'STEP 7 · LOSE H⁺', 'a water molecule takes the last H⁺');
    const c = P(x + 150, y + 188);
    const k = oxonium2(c);
    s += k.s;
    const oa = k.os[0], h = oa.subs.H;
    const base = P(h.x + 100, h.y - 6);
    s += water(base, { hs: [60, 0], lps: [185, 280] });
    s += fromLp(base, 185, P(h.x + 14, h.y - 3), 12);
    s += bondArrow(oa.o, h, -5, at(oa.o, 52, 18), -14);
    return s;
  },
};

/* The result panels that close a part. */
function resultPanel(x, y, title, draw, note) {
  let s = box(x, y, title, note, 'good');
  s += draw(P(x + 170, y + 190)).s;
  return s;
}
const hemiResult = (x, y) => resultPanel(x, y, 'RESULT · THE HEMIACETAL', (c) => hemiacetal(c), 'one OH and one OCH₃');
const acetalResult = (x, y) => resultPanel(x, y, 'RESULT · THE ACETAL', (c) => acetal(c), 'two OCH₃, no OH, no C=O');
function oxoResult(x, y) {
  let s = box(x, y, 'RESULT · OXOCARBENIUM ION', 'plus one H₂O', 'good');
  s += oxocarb(P(x + 160, y + 200)).s;
  return s;
}

/* Lay a list of panel painters out in `cols` columns. */
function grid(painters, cols, x0 = 0, y0 = 0, gap = 20) {
  let s = '';
  painters.forEach((p, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    s += p(x0 + col * (PW + gap), y0 + row * PH);
  });
  return s;
}
const vb = (painters, cols, gap = 20) =>
  `0 0 ${cols * PW + (cols - 1) * gap} ${Math.ceil(painters.length / cols) * PH}`;

const PART_A = [STEPS[1], STEPS[2], STEPS[3], hemiResult];
/* The lesson drops the result panels: each part's product opens the next
   part, and the overview figure already shows the acetal. */
const L_A = [STEPS[1], STEPS[2], STEPS[3]], L_B = [STEPS[4], STEPS[5]], L_C = [STEPS[6], STEPS[7]];
const PART_B = [STEPS[4], STEPS[5], oxoResult];
const PART_C = [STEPS[6], STEPS[7], acetalResult];

const ALT_A = 'Steps 1 to 3 of acetal formation from acetone and methanol. Step 1: a lone pair on the carbonyl oxygen takes H+ from the acid. Step 2: a methanol oxygen lone pair attacks the carbonyl carbon while the C=O pi bond moves onto the positive oxygen. Step 3: the O–H bond on the added oxygen breaks, its electrons stay on that oxygen, and H+ leaves. Result: the hemiacetal, a carbon carrying OH, OCH3 and two CH3 groups.';
const ALT_B = 'Steps 4 and 5. Step 4: a lone pair on the hemiacetal OH oxygen takes H+, making an OH2+ group. Step 5: the C–O bond to that oxygen breaks and water leaves, while a lone pair on the OCH3 oxygen moves in to make a C=O double bond. Result: the oxocarbenium ion, a flat carbon double-bonded to an oxygen that carries CH3 and the positive charge, plus a water molecule.';
const ALT_C = 'Steps 6 and 7. Step 6: a second methanol oxygen lone pair attacks the carbon of the oxocarbenium ion while the C=O pi bond moves onto the positive oxygen. Step 7: the O–H bond on the newly added oxygen breaks and H+ leaves. Result: the acetal, a carbon carrying two OCH3 groups and two CH3 groups.';

/* ---------------------------------------------------- overview (notes) --- */
/* Compact forms for the overview: each oxygen's other group points up, so
   the whole molecule is about 130 wide instead of 240. */
const hemiCompact = (c) => species(c, { oxy: [
  { deg: 135, kind: 'hi', subs: [{ deg: 90, l: 'H' }], lps: [180, 235] },
  { deg: 45, kind: 'hi', subs: [{ deg: 90, l: 'CH₃' }], lps: [0, 305] },
] });
const acetalCompact = (c) => species(c, { oxy: [
  { deg: 135, kind: 'hi', subs: [{ deg: 90, l: 'CH₃' }], lps: [180, 235] },
  { deg: 45, kind: 'hi', subs: [{ deg: 90, l: 'CH₃' }], lps: [0, 305] },
] });

FIGURES.push({
  id: 'acetal-overview',
  section: 'acetals',
  anchor: 'and no C=O at all.</p>',
  alt: 'Acetone plus methanol, with an acid catalyst, in equilibrium with 2-methoxypropan-2-ol, the hemiacetal. That plus a second methanol is in equilibrium with 2,2-dimethoxypropane, the acetal, plus water.',
  viewBox: '0 0 760 270',
  build() {
    let s = '';
    const y = 150;
    s += acetone(P(76, y + 10)).s;
    s += lbl(76, 252, 'acetone');
    s += lbl(178, y + 4, '+ CH₃OH');
    s += eqArrows(P(224, y), P(276, y));
    s += lbl(250, y - 16, 'H⁺');
    s += hemiCompact(P(360, y + 30)).s;
    s += lbl(360, 252, 'the hemiacetal');
    s += lbl(478, y + 4, '+ CH₃OH');
    s += eqArrows(P(524, y), P(576, y));
    s += lbl(550, y - 16, 'H⁺');
    s += acetalCompact(P(664, y + 30)).s;
    s += lbl(664, 252, 'the acetal + H₂O');
    return s;
  },
  caption: 'Two methanols add to acetone, one at a time. The coral carbon is the old carbonyl carbon; it ends with two O–CH₃ groups and no C=O.',
});

/* The same, stacked, for the lesson. */
FIGURES.push({
  id: 'l-acetal-overview',
  lessons: ['acetals'],
  alt: 'Top: acetone plus methanol. Middle: the hemiacetal, a carbon with OH, OCH3 and two CH3 groups. Bottom: the acetal, a carbon with two OCH3 groups and two CH3 groups, plus water. Equilibrium arrows marked H+ join each pair.',
  viewBox: '0 0 340 720',
  build() {
    let s = '';
    s += tag(170, 22, 'ACETONE');
    s += acetone(P(120, 112)).s;
    s += lbl(250, 116, '+ CH₃OH');
    s += eqArrows(P(170, 176), P(170, 218));
    s += lbl(196, 202, 'H⁺', 'start');
    s += tag(170, 246, 'THE HEMIACETAL');
    s += hemiCompact(P(170, 358)).s;
    s += lbl(170, 440, '+ CH₃OH');
    s += eqArrows(P(170, 452), P(170, 494));
    s += lbl(196, 478, 'H⁺', 'start');
    s += tag(170, 520, 'THE ACETAL');
    s += acetalCompact(P(140, 650)).s;
    s += lbl(260, 630, '+ H₂O');
    return s;
  },
  caption: 'Each methanol adds to the coral carbon, the old carbonyl carbon.',
});

/* ------------------------------------------------ the mechanism (notes) --- */
FIGURES.push({
  id: 'acetal-mech-a',
  section: 'acetals',
  anchor: '<h3>Part one: the hemiacetal (steps 1&ndash;3)</h3>',
  alt: ALT_A,
  viewBox: vb(PART_A, 2),
  build() { return grid(PART_A, 2); },
  caption: 'Steps 1–3. Each panel shows the species before its step, with that step’s arrows on it.',
});
FIGURES.push({
  id: 'acetal-mech-b',
  section: 'acetals',
  anchor: '<h3>Part two: water leaves and an oxocarbenium ion forms (steps 4&ndash;5)</h3>',
  alt: ALT_B,
  viewBox: vb(PART_B, 2),
  build() { return grid(PART_B, 2); },
  caption: 'Steps 4–5. The oxygen that leaves is shaded coral.',
});
FIGURES.push({
  id: 'acetal-mech-c',
  section: 'acetals',
  anchor: '<h3>Part three: a second alcohol completes the acetal (steps 6&ndash;7)</h3>',
  alt: ALT_C,
  viewBox: vb(PART_C, 2),
  build() { return grid(PART_C, 2); },
  caption: 'Steps 6–7 repeat steps 2–3 on the oxocarbenium ion.',
});

/* ---------------------------------------------- the mechanism (lesson) --- */
FIGURES.push({
  id: 'l-acetal-mech-a',
  lessons: ['acetals'],
  alt: ALT_A.replace(/ Result:.*$/, ''),
  viewBox: vb(L_A, 1),
  build() { return grid(L_A, 1); },
  caption: 'Steps 1–3, top to bottom. Each panel carries the arrows for its own step.',
});
FIGURES.push({
  id: 'l-acetal-mech-b',
  lessons: ['acetals'],
  alt: ALT_B.replace(/ Result:.*$/, ''),
  viewBox: vb(L_B, 1),
  build() { return grid(L_B, 1); },
  caption: 'Steps 4–5. The oxygen that leaves is shaded coral.',
});
FIGURES.push({
  id: 'l-acetal-mech-c',
  lessons: ['acetals'],
  alt: ALT_C.replace(/ Result:.*$/, ''),
  viewBox: vb(L_C, 1),
  build() { return grid(L_C, 1); },
  caption: 'Steps 6–7: the same two moves as steps 2–3.',
});

/* ------------------------------------- the oxocarbenium ion, two views --- */
function resonancePair(x, y) {
  let s = '';
  const c1 = P(x + 70, y + 110);
  const k1 = species(c1, { tet: false, cCharge: 270, oxy: [
    { deg: 90, subs: [{ deg: 30, l: 'CH₃' }], lps: [110, 190] },
  ] });
  s += k1.s;
  const o1 = k1.os[0].o;
  s += fromLp(o1, 190, P(c1.x - 6, (c1.y + o1.y) / 2), 18);
  s += resArrow(P(x + 142, y + 104), P(x + 188, y + 104));
  const c2 = P(x + 250, y + 110);
  s += oxocarb(c2).s;
  s += lbl(c1.x + 4, y + 190, 'C⁺ has only');
  s += lbl(c1.x + 4, y + 207, '6 electrons');
  s += lbl(c2.x + 4, y + 190, 'every atom has');
  s += lbl(c2.x + 4, y + 207, 'an octet');
  return s;
}
/* The orbital view: the carbon's empty p orbital beside the oxygen's filled
   one, side on, sharing the pair. Drawn edge-on to the C–O bond. */
function orbitalView(x, y) {
  let s = '';
  const c = P(x + 140, y + 100), o = P(x + 176, y + 100);
  const lobe = (p, up, cls) => `<ellipse class="${cls}" cx="${r2(p.x)}" cy="${r2(p.y + (up ? -36 : 36))}" rx="17" ry="30"></ellipse>`;
  // the region where the two p orbitals overlap side on: the pi bond
  const mid = (c.x + o.x) / 2;
  s += `<ellipse class="fg-orb-alt" cx="${r2(mid)}" cy="${r2(c.y - 38)}" rx="40" ry="30"></ellipse>`;
  s += `<ellipse class="fg-orb-alt" cx="${r2(mid)}" cy="${r2(c.y + 38)}" rx="40" ry="30"></ellipse>`;
  s += lobe(c, true, 'fg-orb-node') + lobe(c, false, 'fg-orb-node');
  s += lobe(o, true, 'fg-orb') + lobe(o, false, 'fg-orb');
  s += bond(c, o, { rFrom: 16, rTo: 15 });
  s += arm(c, 215, 52, 'H₃C').s;
  s += arm(c, 145, 52, 'H₃C').s;
  // the O–CH3 bond is bent at O, about 120 degrees from the C–O bond
  s += arm(o, 330, 52, 'CH₃', { rFrom: 15 }).s;
  s += atom(c.x, c.y, 'C', { kind: 'warn' }) + atom(o.x, o.y, 'O', { kind: 'hi' });
  // the lone pair, in the oxygen's p orbital
  s += `<circle class="fg-lp" cx="${r2(o.x - 4.5)}" cy="${r2(o.y - 46)}" r="2.6"></circle><circle class="fg-lp" cx="${r2(o.x + 4.5)}" cy="${r2(o.y - 46)}" r="2.6"></circle>`;
  s += curve(P(o.x - 6, o.y - 56), P(c.x + 2, c.y - 58), { bow: 12 });
  s += lbl(c.x - 8, y + 186, 'empty p on C', 'end');
  s += lbl(o.x + 8, y + 186, 'filled p on O', 'start');
  s += lbl(mid, y + 12, 'overlap = π bond', 'middle');
  return s;
}
FIGURES.push({
  id: 'acetal-oxocarbenium',
  section: 'acetals',
  anchor: 'that shared pair is the C=O &pi; bond.</p>',
  alt: 'Left: two resonance contributors of the oxocarbenium ion. In one, the carbon carries the positive charge and the OCH3 oxygen has two lone pairs; a curved arrow moves one lone pair into the C–O bond. In the other, a C=O double bond has formed and the oxygen carries the positive charge and one lone pair. Right: the same ion as orbitals. The carbon has an empty p orbital, drawn dashed; the oxygen beside it has a filled p orbital holding a lone pair. The two orbitals lie parallel and overlap side on.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += tag(170, 22, 'TWO RESONANCE CONTRIBUTORS');
    s += resonancePair(0, 14);
    s += rule(372, 30, 372, 230);
    s += tag(572, 22, 'THE ORBITALS: SIDE-ON OVERLAP');
    s += orbitalView(410, 26);
    return s;
  },
  caption: 'Left: the curved arrow moves an oxygen lone pair into the C–O bond. Right: the same move as orbitals. The oxygen’s filled p orbital lies parallel to the carbon’s empty one (dashed), and the shaded region where they overlap side on is the π bond.',
});
FIGURES.push({
  id: 'l-acetal-oxocarbenium',
  lessons: ['acetals'],
  alt: 'Top: the two resonance contributors of the oxocarbenium ion, C+ with a neutral OCH3, and C=O+ with the charge on oxygen, joined by a double-headed arrow. Bottom: the carbon empty p orbital, dashed, parallel to the oxygen filled p orbital holding a lone pair, overlapping side on.',
  viewBox: '0 0 340 470',
  build() {
    let s = '';
    s += tag(170, 22, 'TWO RESONANCE CONTRIBUTORS');
    s += resonancePair(0, 14);
    s += rule(20, 240, 320, 240);
    s += tag(170, 266, 'THE ORBITALS: SIDE-ON OVERLAP');
    s += orbitalView(-8, 268);
    return s;
  },
  caption: 'The lone pair moves into the C–O bond (top). The same move as orbitals: the filled p on O overlaps side on with the empty p on C (bottom).',
});

/* ----------------------------------------- cyclic acetal from a diol --- */
/* Cyclohexanone drawn skeletally, the carbonyl carbon at `c` with the ring
   hanging below it. Returns the ring points too. */
function hexBelow(c, r = 30) {
  const ctr = P(c.x, c.y + r);
  const pts = polyPts(ctr.x, ctr.y, 6, r, 90); // pts[0] is the top vertex = c
  let s = '';
  for (let i = 0; i < 6; i++) s += sk(pts[i], pts[(i + 1) % 6]);
  return { s, pts };
}
function cyclohexanone(c) {
  const h = hexBelow(c);
  const o = P(c.x, c.y - 44);
  let s = h.s + bond(c, o, { order: 2, rFrom: 0, rTo: 15 });
  s += atom(o.x, o.y, 'O', { kind: 'hi' });
  return s;
}
function glycol(x, y) {
  // HO–CH2–CH2–OH, skeletal middle, labelled ends
  const a = P(x, y), b = P(x + 30, y - 18), c = P(x + 60, y), d = P(x + 90, y - 18);
  let s = bond(a, b, { rFrom: 17, rTo: 0 }) + sk(b, c) + bond(c, d, { rFrom: 0, rTo: 17 });
  s += atom(a.x, a.y, 'HO', { r: 17, kind: 'hi' }) + atom(d.x, d.y, 'OH', { r: 17, kind: 'hi' });
  return s;
}
function dioxolane(c) {
  // spiro: cyclohexane below, five-membered O,C,C,O ring above
  const h = hexBelow(c);
  let s = h.s;
  const five = polyPts(c.x, c.y - 34, 5, 34, 270); // [0] is bottom vertex = c (approximately)
  const shift = P(c.x - five[0].x, c.y - five[0].y);
  const f = five.map((p) => P(p.x + shift.x, p.y + shift.y));
  // f[0] = spiro carbon, f[1] and f[4] = oxygens, f[2], f[3] = CH2
  s += bond(f[0], f[1], { rFrom: 0, rTo: 15 }) + bond(f[1], f[2], { rFrom: 15, rTo: 0 });
  s += sk(f[2], f[3]);
  s += bond(f[3], f[4], { rFrom: 0, rTo: 15 }) + bond(f[4], f[0], { rFrom: 15, rTo: 0 });
  s += atom(f[1].x, f[1].y, 'O', { kind: 'hi' }) + atom(f[4].x, f[4].y, 'O', { kind: 'hi' });
  return { s, f };
}
FIGURES.push({
  id: 'acetal-cyclic',
  section: 'acetals',
  anchor: 'called a <b>1,3-dioxolane</b>.</p>',
  alt: 'Cyclohexanone plus ethylene glycol, HO–CH2–CH2–OH, with an acid catalyst and water removed, in equilibrium with a cyclic acetal plus water. In the product the old carbonyl carbon is shared by the cyclohexane ring and a five-membered ring of O, CH2, CH2, O, called a 1,3-dioxolane.',
  viewBox: '0 0 760 230',
  build() {
    let s = '';
    s += cyclohexanone(P(80, 104));
    s += lbl(80, 206, 'cyclohexanone');
    s += lbl(150, 124, '+');
    s += glycol(186, 130);
    s += lbl(231, 206, 'ethylene glycol');
    s += eqArrows(P(318, 124), P(420, 124));
    s += lbl(369, 104, 'H⁺ (TsOH)');
    s += lbl(369, 156, 'remove H₂O');
    const d = dioxolane(P(520, 116));
    s += d.s;
    s += lbl(576, 60, '1,3-dioxolane ring', 'start');
    s += lbl(520, 206, 'the cyclic acetal');
    s += lbl(600, 150, '+  H₂O', 'start');
    return s;
  },
  caption: 'Both OH groups of one diol end up on the old carbonyl carbon, which now sits in two rings at once.',
});
FIGURES.push({
  id: 'l-acetal-cyclic',
  lessons: ['acetals'],
  alt: 'Top: cyclohexanone plus ethylene glycol. Middle: equilibrium arrows marked H+ and remove water. Bottom: the cyclic acetal, the old carbonyl carbon shared by the cyclohexane ring and a five-membered O, CH2, CH2, O ring, plus water.',
  viewBox: '0 0 340 440',
  build() {
    let s = '';
    s += cyclohexanone(P(80, 90));
    s += lbl(152, 110, '+');
    s += glycol(196, 116);
    s += lbl(80, 190, 'cyclohexanone');
    s += lbl(241, 190, 'ethylene glycol');
    s += eqArrows(P(150, 214), P(150, 270));
    s += lbl(176, 236, 'H⁺', 'start');
    s += lbl(176, 256, 'remove H₂O', 'start');
    const d = dioxolane(P(130, 348));
    s += d.s;
    s += lbl(210, 336, '+  H₂O', 'start');
    s += tag(170, 428, 'THE CYCLIC ACETAL');
    return s;
  },
  caption: 'One diol supplies both oxygens.',
});

/* ---------------------------------------- protect, react, deprotect --- */
/* Ethyl 4-oxocyclohexane-1-carboxylate and its route. The ring is drawn with
   C4 (the ketone carbon) at the top and C1 (the ester carbon) at the bottom. */
function ringUpDown(ctr, r = 30) {
  const pts = polyPts(ctr.x, ctr.y, 6, r, 90); // [0] top, [3] bottom
  let s = '';
  for (let i = 0; i < 6; i++) s += sk(pts[i], pts[(i + 1) % 6]);
  return { s, top: pts[0], bot: pts[3] };
}
function topKetone(p) {
  const o = P(p.x, p.y - 42);
  return bond(p, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O', { kind: 'hi' });
}
function topAcetal(p) {
  const five = polyPts(0, 0, 5, 28, 270);
  const f = five.map((q) => P(q.x - five[0].x + p.x, q.y - five[0].y + p.y));
  let s = bond(f[0], f[1], { rFrom: 0, rTo: 15 }) + bond(f[1], f[2], { rFrom: 15, rTo: 0 }) + sk(f[2], f[3]);
  s += bond(f[3], f[4], { rFrom: 0, rTo: 15 }) + bond(f[4], f[0], { rFrom: 15, rTo: 0 });
  s += atom(f[1].x, f[1].y, 'O', { kind: 'hi' }) + atom(f[4].x, f[4].y, 'O', { kind: 'hi' });
  return s;
}
function bottomEster(p) {
  // C1 -> C(=O)OEt hanging below: carbonyl carbon, =O to the left, OEt to the right
  const cc = P(p.x, p.y + 30);
  const o = P(cc.x - 28, cc.y + 18), oe = P(cc.x + 28, cc.y + 18);
  let s = sk(p, cc) + bond(cc, o, { order: 2, rFrom: 0, rTo: 15 }) + bond(cc, oe, { rFrom: 0, rTo: 18 });
  s += atom(o.x, o.y, 'O', { kind: 'warn' }) + atom(oe.x, oe.y, 'OEt', { r: 19, kind: 'warn' });
  return s;
}
function bottomCH2OH(p) {
  const cc = P(p.x, p.y + 30);
  const oh = P(cc.x + 28, cc.y + 18);
  return sk(p, cc) + bond(cc, oh, { rFrom: 0, rTo: 17 }) + atom(oh.x, oh.y, 'OH', { r: 17, kind: 'good' === 'x' ? 'hi' : 'hi' });
}
const ROUTE = [
  { name: 'keto ester', top: topKetone, bot: bottomEster },
  { name: 'ketone masked', top: topAcetal, bot: bottomEster },
  { name: 'ester reduced', top: topAcetal, bot: bottomCH2OH },
  { name: 'ketone back', top: topKetone, bot: bottomCH2OH },
];
const REAGENTS = [
  ['1 protect:', 'HOCH₂CH₂OH, H⁺'],
  ['2 react:', 'LiAlH₄, then H₂O'],
  ['3 deprotect:', 'H₃O⁺'],
];
function routeMol(ctr, k) {
  const r = ringUpDown(ctr);
  return r.s + ROUTE[k].top(r.top) + ROUTE[k].bot(r.bot);
}
FIGURES.push({
  id: 'acetal-protect-route',
  section: 'acetals',
  anchor: '<span class="k">Worked example — using a protecting group</span>',
  alt: 'Four structures in a row. First: a cyclohexane ring with a ketone C=O at the top and an ethyl ester, CO2Et, at the bottom. Second, after ethylene glycol and acid: the ketone is now a five-membered cyclic acetal; the ester is unchanged. Third, after LiAlH4 then water: the ester is now CH2OH; the acetal is unchanged. Fourth, after aqueous acid: the acetal is gone and the ketone is back, with the CH2OH at the bottom.',
  viewBox: '0 0 760 290',
  build() {
    let s = '';
    const xs = [70, 280, 490, 690];
    ROUTE.forEach((r, i) => {
      s += routeMol(P(xs[i], 140), i);
      s += lbl(xs[i], 278, r.name);
    });
    for (let i = 0; i < 3; i++) {
      const a = xs[i] + 56, b = xs[i + 1] - 56;
      s += arrow(P(a, 140), P(b, 140), { size: 8 });
      s += lbl((a + b) / 2, 118, REAGENTS[i][0]);
      s += lbl((a + b) / 2, 166, REAGENTS[i][1]);
    }
    return s;
  },
  caption: 'Follow the top of the ring (the ketone) and the bottom (the ester) separately. Each reagent changes only one end.',
});
FIGURES.push({
  id: 'l-acetal-protect-route',
  lessons: ['acetals'],
  alt: 'Four structures from top to bottom, two to a row. A cyclohexane with a ketone at the top and an ethyl ester at the bottom; then the ketone masked as a cyclic acetal; then the ester reduced to CH2OH; then the acetal removed to give the ketone back.',
  viewBox: '0 0 340 640',
  build() {
    let s = '';
    const pos = [P(80, 110), P(260, 110), P(80, 470), P(260, 470)];
    ROUTE.forEach((r, i) => {
      s += routeMol(pos[i], i);
      s += tag(pos[i].x, pos[i].y + 128, r.name.toUpperCase());
    });
    s += arrow(P(130, 110), P(206, 110), { size: 8 });
    s += lbl(168, 30, '1 protect', 'middle');
    s += lbl(168, 48, 'diol, H⁺', 'middle');
    s += arrow(P(236, 264), P(124, 336), { size: 8 });
    s += lbl(200, 306, '2 LiAlH₄,', 'start');
    s += lbl(200, 324, 'then H₂O', 'start');
    s += arrow(P(130, 470), P(206, 470), { size: 8 });
    s += lbl(176, 378, '3 deprotect', 'middle');
    s += lbl(176, 396, 'H₃O⁺', 'middle');
    return s;
  },
  caption: 'Protect, react, deprotect. Only one end of the ring changes at each step.',
});

/* ------------------------------------- sugars: the ring-closed hemiacetal --- */
/* 5-hydroxypentanal closing onto itself, then glucose as a Haworth ring. */
function closure(x, y) {
  let s = '';
  // chain laid on a hexagon: ring positions (clockwise from top-right)
  const pts = polyPts(x, y, 6, 36, 30); // [0] up-right (30°), [1] top (90), [2] up-left, [3] down-left, [4] bottom, [5] down-right
  const O = pts[0], C1 = pts[5];
  // bonds C1-C2-C3-C4-C5 : pts[5] -> [4] -> [3] -> [2] -> [1]; C5-OH is pts[1] -> O (not yet a bond)
  s += sk(pts[5], pts[4]) + sk(pts[4], pts[3]) + sk(pts[3], pts[2]) + sk(pts[2], pts[1]);
  s += bond(pts[1], O, { rFrom: 0, rTo: 15 });
  const h = at(O, 60, 36);
  s += bond(O, h, { rFrom: 15, rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12 });
  // the aldehyde C1: =O out to the right-down, H implied
  const ald = at(C1, 330, 46);
  s += bond(C1, ald, { order: 2, rFrom: 0, rTo: 15 }) + lp(ald, 30) + lp(ald, 275) + atom(ald.x, ald.y, 'O', { kind: 'hi' });
  s += lp(O, 150) + lp(O, 0);
  s += atom(O.x, O.y, 'O', { kind: 'hi' });
  // arrows: O lone pair to C1, C=O pi to O
  s += curve(at(O, 350, 26), P(C1.x + 6, C1.y - 6), { bow: -12 });
  s += fromBond(C1, ald, at(ald, 218, 18), 14, 6);
  s += atom(C1.x, C1.y, '', { kind: 'warn', r: 5 });
  return s;
}
function closed(x, y) {
  let s = '';
  const pts = polyPts(x, y, 6, 36, 30);
  const O = pts[0], C1 = pts[5];
  s += sk(pts[5], pts[4]) + sk(pts[4], pts[3]) + sk(pts[3], pts[2]) + sk(pts[2], pts[1]);
  s += bond(pts[1], O, { rFrom: 0, rTo: 15 }) + bond(O, C1, { rFrom: 15, rTo: 0 });
  s += atom(O.x, O.y, 'O', { kind: 'hi' });
  const oh = at(C1, 330, 44);
  s += wedge(C1, oh, { rFrom: 0, rTo: 17, width: 9 }) + atom(oh.x, oh.y, 'OH', { r: 17, kind: 'hi' });
  s += atom(C1.x, C1.y, '', { kind: 'warn', r: 5 });
  return { s, C1 };
}
/* A Haworth ring: ring O back-right, C1 right, C2 front-right, C3 front-left,
   C4 left, C5 back-left. */
function haworth(x, y, beta) {
  let s = '';
  const O = P(x + 26, y - 38), C1 = P(x + 74, y - 4), C2 = P(x + 36, y + 26), C3 = P(x - 36, y + 26), C4 = P(x - 64, y - 4), C5 = P(x - 28, y - 38);
  s += bond(C5, O, { rFrom: 0, rTo: 15 }) + bond(O, C1, { rFrom: 15, rTo: 0 });
  s += sk(C4, C5) + sk(C1, C2) + sk(C3, C4);
  s += `<line class="fg-bond-hi" x1="${r2(C2.x)}" y1="${r2(C2.y)}" x2="${r2(C3.x)}" y2="${r2(C3.y)}" stroke-width="5"></line>`;
  s += atom(O.x, O.y, 'O', { kind: 'hi' });
  const sub = (p, up, l, len = 34, kind) => {
    const e = P(p.x, p.y + (up ? -len : len));
    return bond(p, e, { rFrom: 0, rTo: rOf(l) }) + atom(e.x, e.y, l, { r: rOf(l), kind });
  };
  s += sub(C1, beta, 'OH', 36, 'hi');
  s += sub(C2, false, 'OH');
  s += sub(C3, true, 'OH', 24);
  s += sub(C4, false, 'OH');
  // C5 carries CH2OH up
  const c6 = P(C5.x, C5.y - 26);
  s += sk(C5, c6);
  const oh6 = P(c6.x - 30, c6.y - 12);
  s += bond(c6, oh6, { rFrom: 0, rTo: 17 }) + atom(oh6.x, oh6.y, 'HO', { r: 17 });
  s += atom(C1.x, C1.y, '', { kind: 'warn', r: 5 });
  s += lbl(C1.x + 16, C1.y + 5, 'C1', 'start');
  return s;
}
FIGURES.push({
  id: 'acetal-ring-sugar',
  section: 'acetals',
  anchor: '<h3>The exception that runs your metabolism</h3>',
  alt: 'Left: 5-hydroxypentanal curled into a ring shape. A curved arrow runs from a lone pair on the OH oxygen to the aldehyde carbon, marked with a coral dot, and a second arrow moves the C=O pi bond onto the aldehyde oxygen. Middle: the six-membered cyclic hemiacetal, with the ring oxygen and the old aldehyde carbon, now the anomeric carbon, carrying an OH. Right: beta-D-glucose drawn as a flat hexagon seen from the edge, with the ring oxygen at the back right, C1 at the right carrying its OH up, and CH2OH up on C5.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += tag(120, 24, 'AN OH ATTACKS ITS OWN C=O');
    s += closure(120, 122);
    s += lbl(120, 214, '5-hydroxypentanal');
    s += arrow(P(222, 122), P(272, 122), { size: 8 });
    s += lbl(247, 92, 'H⁺ moves');
    s += lbl(247, 110, 'O⁺ to O⁻');
    s += tag(360, 24, 'A CYCLIC HEMIACETAL');
    const k = closed(350, 122);
    s += k.s;
    s += lbl(360, 196, 'dot = anomeric C:', 'middle');
    s += lbl(360, 214, 'its OH can point', 'middle');
    s += lbl(360, 232, 'either way', 'middle');
    s += rule(470, 34, 470, 236);
    s += tag(614, 24, 'GLUCOSE (β, HAWORTH VIEW)');
    s += haworth(600, 126, true);
    s += lbl(614, 226, 'α: C1–OH down · β: C1–OH up');
    return s;
  },
  caption: 'The coral dot marks the old carbonyl carbon in each drawing. In the Haworth view the thick edge is nearest you; the hydrogens on the ring carbons are left off.',
});

export default FIGURES;
