/* Figures for the protecting-groups notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   The page is about masks: a reactive group is turned into an unreactive
   one, a step is run, and the mask comes off. Every figure here shows a real
   structure, so the reader can see which atom carries the mask and which
   bond breaks when it comes off.

   Chapter 21 comes long after skeletal structures, so chains are skeletal.
   Heteroatoms (O, N, Si, Mg, Br) are always labeled.

   Lesson copies (id prefix l-) are 340 wide or less, stacked, and use only
   fg-lbl and fg-tag text. */
import { atom as atom0, bond, arrow, curve, lonePair, text, rule, panel, P } from '../lib/ochem-figure.mjs';
import { sk, zig, polyPts, benzene } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
/* A lone pair pointing out along math angle `deg`. */
const lp = (c, deg, d = 22) => lonePair(c.x, c.y, -deg, { dist: d, spread: 4.5, r: 2.4 });

/* An atom disc that stays opaque in both themes (the tinted discs are
   translucent in the dark theme, so an opaque plain disc goes under them). */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind !== 'plain'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
const A = (p, l, o = {}) => atom(p.x, p.y, l, o);
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const tg = (x, y, s, kind, anchor = 'middle') =>
  text(x, y, s, { cls: kind ? `fg-tag-${kind}` : 'fg-tag', size: 11, anchor });
const charge = (p, s = '+') => text(p.x, p.y + 5, s, { cls: 'fg-warn', size: 15 });
const hiBond = (a, b, rFrom, rTo, order = 1) => bond(a, b, { rFrom, rTo, order, cls: 'fg-bond-hi' });
/* Both heads of a resonance arrow. */
const resArrow = (a, b) => arrow(a, b, { size: 8 }) + arrow(b, a, { size: 8 });
/* A skeletal tert-butyl group: a quaternary carbon at q, reached along math
   angle `dir`, with its three methyls drawn as line ends ahead and to either side. */
const tBu = (q, dir, len = 26) =>
  sk(q, at(q, dir, len)) + sk(q, at(q, dir + 90, len)) + sk(q, at(q, dir - 90, len));

/* ================================================ the Grignard and the O–H */
/* CH3MgBr takes the proton of R–O–H. Reactants are drawn with the two curved
   arrows; products with the new C–H bond highlighted. */
function quenchReactants(mg, opts = {}) {
  let s = '';
  const c = P(mg.x + 72, mg.y);
  const h = P(c.x + (opts.gap ?? 96), mg.y);
  const o = P(h.x + 46, mg.y);
  const r = at(o, -50, 46);
  s += bond(mg, c, { rFrom: 20, rTo: 17 });
  s += bond(h, o, { rFrom: 12, rTo: 15 });
  s += bond(o, r, { rFrom: 15, rTo: 14 });
  s += lp(o, 90) + lp(o, 10);
  s += A(mg, 'MgBr', { r: 20 });
  s += A(c, 'H₃C', { r: 17 });
  s += A(h, 'H', { r: 12, kind: 'warn' });
  s += A(o, 'O', { r: 15 });
  s += A(r, 'R', { r: 14 });
  // The C–Mg bond's electrons go to the proton...
  s += curve(P((mg.x + c.x) / 2 + 4, mg.y - 6), P(h.x - 8, h.y - 11), { bow: -34 });
  // ...and the O–H bond's electrons stay on oxygen.
  s += curve(P((h.x + o.x) / 2 - 2, o.y + 6), P(o.x - 6, o.y + 14), { bow: 9, size: 7 });
  return { s, c, h, o, r };
}
function quenchProducts(c, opts = {}) {
  let s = '';
  const h = P(c.x + 48, c.y);
  s += hiBond(c, h, 17, 12);
  s += A(c, 'H₃C', { r: 17 }) + A(h, 'H', { r: 12 });
  const plusX = h.x + (opts.plusGap ?? 36);
  s += lbl(plusX, c.y + 5, '+');
  const o = P(plusX + (opts.oGap ?? 62), c.y);
  const r = at(o, 230, 46);
  s += bond(o, r, { rFrom: 15, rTo: 14 });
  s += lp(o, 90) + lp(o, 340) + lp(o, 160);
  s += A(o, 'O', { r: 15 }) + A(r, 'R', { r: 14 });
  s += charge(P(o.x + 22, o.y - 20), '−');
  const mg = P(o.x + (opts.mgGap ?? 70), c.y);
  s += A(mg, 'MgBr', { r: 20 });
  s += charge(P(mg.x + 22, mg.y - 20), '+');
  return { s, h, o, r, mg };
}

FIGURES.push({
  id: 'grignard-quench',
  section: 'protecting-groups',
  anchor: '<p class="step-body">RMgBr + R\'OH &rarr; R–H + R\'OMgBr</p>',
  alt: 'Left: CH3–MgBr beside an alcohol H–O–R. One curved arrow runs from the C–Mg bond to the alcohol proton; a second runs from the O–H bond onto the oxygen. Right: the products, CH3–H (methane) with the new C–H bond highlighted, and the magnesium alkoxide, R–O minus with MgBr plus.',
  viewBox: '0 0 760 230',
  build() {
    let s = '';
    s += tg(380, 26, 'THE GRIGNARD TAKES THE O–H PROTON');
    const q = quenchReactants(P(46, 110));
    s += q.s;
    s += tg(q.c.x - 36, 196, 'strong base');
    s += tg((q.h.x + q.o.x) / 2 + 6, 196, 'acid: O–H pKa ≈ 16');
    s += arrow(P(380, 110), P(446, 110), { size: 8 });
    const pr = quenchProducts(P(488, 110), { plusGap: 32, oGap: 66, mgGap: 66 });
    s += pr.s;
    s += tg(512, 196, 'methane: pKa ≈ 50');
    s += tg(662, 196, 'magnesium alkoxide');
    return s;
  },
  caption: 'Shown with CH₃MgBr. The first arrow carries the C–Mg bond’s electrons to the proton; the second leaves the O–H bond’s electrons on oxygen. The new C–H bond is highlighted.',
});

FIGURES.push({
  id: 'l-grignard-quench',
  lessons: ['protecting-groups'],
  alt: 'Top: CH3–MgBr beside an alcohol H–O–R, with a curved arrow from the C–Mg bond to the proton and another from the O–H bond onto oxygen. Bottom: methane, with the new C–H bond highlighted, plus the magnesium alkoxide R–O minus with MgBr plus.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    const q = quenchReactants(P(30, 76), { gap: 86 });
    s += q.s;
    s += tg(250, 160, 'O–H pKa ≈ 16');
    s += arrow(P(90, 132), P(90, 186), { size: 8 });
    const pr = quenchProducts(P(34, 236), { plusGap: 28, oGap: 60, mgGap: 64 });
    s += pr.s;
    s += tg(58, 290, 'CH₄ pKa ≈ 50');
    return s;
  },
  caption: 'The C–Mg bond’s electrons take the proton. The reagent becomes methane.',
});

/* ===================================================== the alcohol mask */
/* R–O–H and R–O–TBS drawn with the same bent oxygen. */
function alcohol(o, kindH = 'warn') {
  const r = at(o, 210, 46), h = at(o, 330, 42);
  return bond(r, o, { rFrom: 14, rTo: 15 }) + bond(o, h, { rFrom: 15, rTo: 12 }) +
    A(r, 'R', { r: 14 }) + A(o, 'O', { r: 15 }) + A(h, 'H', { r: 12, kind: kindH });
}
function silylEther(o) {
  const r = at(o, 210, 46), si = at(o, 330, 48);
  const m1 = P(si.x, si.y - 44), m2 = P(si.x, si.y + 44), tb = P(si.x + 50, si.y);
  let s = bond(r, o, { rFrom: 14, rTo: 15 }) + bond(o, si, { rFrom: 15, rTo: 16 });
  s += bond(si, m1, { rFrom: 16, rTo: 16 }) + bond(si, m2, { rFrom: 16, rTo: 16 }) + bond(si, tb, { rFrom: 16, rTo: 0 });
  s += tBu(tb, 0);
  s += A(r, 'R', { r: 14 }) + A(o, 'O', { r: 15 }) + A(si, 'Si', { kind: 'hi' });
  s += A(m1, 'CH₃', { r: 16 }) + A(m2, 'CH₃', { r: 16 });
  return { s, si, tb };
}
FIGURES.push({
  id: 'silyl-ether-mask',
  section: 'protecting-groups',
  anchor: '<h3>Protecting an alcohol: a silyl ether</h3>',
  alt: 'An alcohol R–O–H, with the acidic hydrogen highlighted, is converted by TBSCl and imidazole into the silyl ether R–O–Si, where the silicon carries two CH3 groups and a C(CH3)3 group. A return arrow labeled TBAF, fluoride, converts the silyl ether back into the alcohol.',
  viewBox: '0 0 760 220',
  build() {
    let s = '';
    s += tg(380, 26, 'AN ALCOHOL MASKED AS A TBS SILYL ETHER');
    s += alcohol(P(110, 104));
    s += tg(110, 186, 'acidic O–H, pKa ≈ 16', 'warn');
    s += arrow(P(210, 100), P(390, 100), { size: 8 });
    s += lbl(300, 86, 'TBSCl, imidazole');
    s += arrow(P(390, 124), P(210, 124), { size: 8, muted: true });
    s += lbl(300, 146, 'TBAF (F⁻)');
    const e = silylEther(P(480, 104));
    s += e.s;
    s += tg(700, 104, 'TBS group =', null);
    s += tg(700, 120, 'Si(CH₃)₂C(CH₃)₃', null);
    s += tg(540, 202, 'no acidic proton left', 'good');
    return s;
  },
  caption: 'The proton that destroys a Grignard (coral) is replaced by the silicon group (shaded). Fluoride reverses the change.',
});

/* ===================================================== the carbonyl mask */
function ketone(c) {
  const o = P(c.x, c.y - 44), ra = at(c, 210, 46), rb = at(c, 330, 46);
  let s = bond(c, o, { rFrom: 0, rTo: 15, order: 2 }) + bond(c, ra, { rFrom: 0, rTo: 14 }) + bond(c, rb, { rFrom: 0, rTo: 14 });
  s += A(o, 'O', { r: 15 }) + A(ra, 'R', { r: 14 }) + A(rb, 'R', { r: 14 });
  s += atom(c.x, c.y, '', { kind: 'warn', r: 5 });
  return s;
}
/* A 1,3-dioxolane hanging below the acetal carbon c; R groups up-left and up-right. */
function dioxolane(c, rr = 30) {
  const pv = polyPts(c.x, c.y + rr, 5, rr, 90);
  let s = '';
  s += bond(pv[0], pv[1], { rFrom: 0, rTo: 14 }) + bond(pv[1], pv[2], { rFrom: 14, rTo: 0 });
  s += sk(pv[2], pv[3]);
  s += bond(pv[3], pv[4], { rFrom: 0, rTo: 14 }) + bond(pv[4], pv[0], { rFrom: 14, rTo: 0 });
  s += A(pv[1], 'O', { r: 14, kind: 'hi' }) + A(pv[4], 'O', { r: 14, kind: 'hi' });
  return { s, pv };
}
function acetal(c) {
  const d = dioxolane(c);
  const ra = at(c, 150, 46), rb = at(c, 30, 46);
  let s = d.s + bond(c, ra, { rFrom: 0, rTo: 14 }) + bond(c, rb, { rFrom: 0, rTo: 14 });
  s += A(ra, 'R', { r: 14 }) + A(rb, 'R', { r: 14 });
  s += atom(c.x, c.y, '', { kind: 'warn', r: 5 });
  return s;
}
FIGURES.push({
  id: 'acetal-mask',
  section: 'protecting-groups',
  anchor: '<h3>Protecting a ketone or aldehyde: an acetal</h3>',
  alt: 'A ketone R2C=O is converted by ethylene glycol and acid, with water removed, into a cyclic acetal: the former carbonyl carbon now sits in a five-membered ring with two oxygens and has only single bonds. A return arrow labeled aqueous acid converts the acetal back to the ketone.',
  viewBox: '0 0 760 230',
  build() {
    let s = '';
    s += tg(380, 26, 'A KETONE MASKED AS A CYCLIC ACETAL');
    s += ketone(P(110, 120));
    s += tg(110, 206, 'electrophilic C=O carbon', 'warn');
    s += arrow(P(210, 112), P(390, 112), { size: 8 });
    s += lbl(300, 82, 'HOCH₂CH₂OH, H⁺,');
    s += lbl(300, 100, 'remove H₂O');
    s += arrow(P(390, 136), P(210, 136), { size: 8, muted: true });
    s += lbl(300, 158, 'H₃O⁺');
    s += acetal(P(500, 104));
    s += tg(650, 110, 'two C–O single bonds,', 'good');
    s += tg(650, 126, 'no C=O left to attack', 'good');
    return s;
  },
  caption: 'The coral dot marks the old carbonyl carbon. After protection it sits in a five-membered ring, bonded to the two oxygens of the diol (shaded).',
});

FIGURES.push({
  id: 'l-two-masks',
  lessons: ['protecting-groups'],
  alt: 'Two conversions stacked. Top: an alcohol R–O–H becomes the TBS silyl ether R–O–Si(CH3)2C(CH3)3 with TBSCl and imidazole, and comes back with TBAF. Bottom: a ketone R2C=O becomes a five-membered cyclic acetal with ethylene glycol and acid, and comes back with aqueous acid.',
  viewBox: '0 0 340 630',
  build() {
    let s = '';
    s += tg(170, 20, 'ALCOHOL → SILYL ETHER');
    s += alcohol(P(170, 64));
    s += arrow(P(150, 108), P(150, 166), { size: 8 });
    s += lbl(140, 132, 'TBSCl,', 'end');
    s += lbl(140, 150, 'imidazole', 'end');
    s += arrow(P(190, 166), P(190, 108), { size: 8, muted: true });
    s += lbl(200, 142, 'TBAF', 'start');
    const e = silylEther(P(90, 226));
    s += e.s;
    s += rule(20, 316, 320, 316);
    s += tg(170, 344, 'KETONE → CYCLIC ACETAL');
    s += ketone(P(170, 414));
    s += arrow(P(150, 450), P(150, 506), { size: 8 });
    s += lbl(140, 472, 'diol, H⁺,', 'end');
    s += lbl(140, 490, '−H₂O', 'end');
    s += arrow(P(190, 506), P(190, 450), { size: 8, muted: true });
    s += lbl(200, 482, 'H₃O⁺', 'start');
    s += acetal(P(170, 558));
    return s;
  },
  caption: 'Top: the O–H proton is replaced by silicon. Bottom: the C=O becomes two C–O single bonds in a ring.',
});

/* ===================================================== the amine mask */
/* A carbamate laid out as a zigzag from R: R, N (H up), C (=O down), O, tail.
   form 'res' draws the second resonance contributor (N+=C, O−). */
function carbamate(p, o = {}) {
  const dx = o.dx ?? 44, dy = 22;
  const R = p, N = P(p.x + dx, p.y - dy), C = P(p.x + 2 * dx, p.y), Od = P(C.x, C.y + 44);
  const Os = P(p.x + 3 * dx, p.y - dy);
  const H = P(N.x, N.y - 38);
  const res = o.form === 'res';
  let s = '';
  s += bond(R, N, { rFrom: 14, rTo: 15 }) + bond(N, H, { rFrom: 15, rTo: 12 });
  s += res ? bond(N, C, { rFrom: 15, rTo: 0, order: 2 }) : bond(N, C, { rFrom: 15, rTo: 0 });
  s += res ? bond(C, Od, { rFrom: 0, rTo: 15 }) : bond(C, Od, { rFrom: 0, rTo: 15, order: 2 });
  const tail = o.tail || 'R';
  let T = null;
  if (tail === 'OH') {
    s += bond(C, Os, { rFrom: 0, rTo: 17 });
  } else {
    s += bond(C, Os, { rFrom: 0, rTo: 15 });
    if (tail === 'tBu') {
      T = P(Os.x + dx, p.y);
      s += o.breakTail ? hiBond(Os, T, 15, 0) : bond(Os, T, { rFrom: 15, rTo: 0 });
      s += tBu(T, -26.57);
    } else if (tail === 'Bn') {
      T = P(Os.x + dx, p.y);
      s += o.breakTail ? hiBond(Os, T, 15, 0) : bond(Os, T, { rFrom: 15, rTo: 0 });
      const rr = o.ringR ?? 22;
      const cen = at(T, 30, 30 + rr);
      const ring = benzene(cen.x, cen.y, rr, { rot: 210 });
      s += sk(T, ring.pts[0]) + ring.svg;
      T = { ...T, ring: cen };
    } else {
      T = P(Os.x + dx, p.y);
      s += bond(Os, T, { rFrom: 15, rTo: 16 }) + A(T, 'R′', { r: 16 });
    }
  }
  s += A(R, 'R', { r: 14 }) + A(N, 'N', { r: 15, kind: o.nKind }) + A(H, 'H', { r: 12 });
  s += A(Od, 'O', { r: 15 });
  s += tail === 'OH' ? A(Os, 'OH', { r: 17 }) : A(Os, 'O', { r: 15 });
  if (o.lp) s += lp(N, 30, 21);
  if (res) {
    s += charge(P(N.x + 19, N.y - 22), '+');
    s += lp(Od, 200) + lp(Od, 340) + lp(Od, 270, 21);
    s += charge(P(Od.x + 20, Od.y - 20), '−');
  } else if (o.lpO) {
    s += lp(Od, 225) + lp(Od, 315);
  }
  if (o.arrows) {
    // N lone pair into the N–C bond; C=O π bond onto O.
    s += curve(at(N, 30, 27), P((N.x + C.x) / 2 + 6, (N.y + C.y) / 2 - 2), { bow: -12, size: 7 });
    s += curve(P(C.x + 4, (C.y + Od.y) / 2 - 4), P(Od.x + 13, Od.y - 8), { bow: -10, size: 7 });
  }
  return { s, R, N, C, Od, Os, T };
}
FIGURES.push({
  id: 'carbamate-mask',
  section: 'protecting-groups',
  anchor: '<h3>Protecting an amine: a carbamate</h3>',
  alt: 'Top: the two standard carbamates. Boc: R–NH–C(=O)–O–C(CH3)3. Cbz: R–NH–C(=O)–O–CH2–phenyl. Bottom: resonance in a carbamate. A curved arrow moves the nitrogen lone pair into the N–C bond and another moves the C=O pi bond onto oxygen, giving a contributor with N plus double-bonded to carbon and O minus.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    s += lbl(150, 26, 'Boc group, from Boc₂O');
    const b = carbamate(P(40, 110), { tail: 'tBu' });
    s += b.s;
    s += lbl(540, 26, 'Cbz group, from benzyl chloroformate');
    const z = carbamate(P(420, 110), { tail: 'Bn' });
    s += z.s;
    s += rule(26, 196, 734, 196);
    s += tg(380, 222, 'WHY THE NITROGEN IS A POOR NUCLEOPHILE');
    const f1 = carbamate(P(60, 300), { tail: 'R', lp: true, lpO: true, arrows: true });
    s += f1.s;
    s += resArrow(P(290, 300), P(340, 300));
    const f2 = carbamate(P(380, 300), { tail: 'R', form: 'res', nKind: 'hi' });
    s += f2.s;
    s += tg(680, 290, 'the N lone pair', 'good');
    s += tg(680, 306, 'is shared with C=O', 'good');
    return s;
  },
  caption: 'Top: Boc and Cbz differ only in the group on the single-bonded oxygen. Bottom: the second resonance contributor puts a positive charge on nitrogen, so its lone pair is much less free to attack.',
});

FIGURES.push({
  id: 'l-carbamate',
  lessons: ['protecting-groups'],
  alt: 'A carbamate R–NH–C(=O)–OR′ with a curved arrow moving the nitrogen lone pair into the N–C bond and another moving the C=O pi bond onto oxygen. Below it, the resonance contributor with N plus double-bonded to carbon and O minus.',
  viewBox: '0 0 340 350',
  build() {
    let s = '';
    s += tg(170, 20, 'A CARBAMATE: R–NH–C(=O)–OR′');
    const f1 = carbamate(P(80, 104), { tail: 'R', lp: true, lpO: true, arrows: true });
    s += f1.s;
    s += resArrow(P(170, 172), P(170, 206));
    const f2 = carbamate(P(80, 262), { tail: 'R', form: 'res', nKind: 'hi' });
    s += f2.s;
    return s;
  },
  caption: 'The nitrogen lone pair is shared with the C=O, just as in an amide.',
});

/* ======================================== how Boc and Cbz come off */
function amineNH2(p) {
  const n = P(p.x + 46, p.y - 22);
  return bond(p, n, { rFrom: 14, rTo: 18 }) + A(p, 'R', { r: 14 }) + A(n, 'NH₂', { r: 18, kind: 'hi' });
}
FIGURES.push({
  id: 'carbamate-removal',
  section: 'protecting-groups',
  anchor: 'is called <b>hydrogenolysis</b>',
  alt: 'Top row: a Boc carbamate with its O–C(CH3)3 bond highlighted. TFA breaks that bond, giving the carbamic acid R–NH–C(=O)–OH, which loses CO2 to give the amine R–NH2. Bottom row: a Cbz carbamate with its O–CH2 bond highlighted. H2 over Pd/C breaks that bond, giving the same carbamic acid plus toluene; loss of CO2 gives the amine.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    // Boc row
    const b = carbamate(P(30, 96), { tail: 'tBu', breakTail: true });
    s += b.s;
    s += tg(b.Os.x + 34, b.Os.y - 26, 'this bond breaks', 'warn');
    s += arrow(P(290, 96), P(352, 96), { size: 8 });
    s += lbl(321, 82, 'TFA');
    s += tg(321, 118, 'H⁺ adds to C=O,');
    s += tg(321, 132, '(CH₃)₃C⁺ leaves');
    const c1 = carbamate(P(380, 96), { tail: 'OH' });
    s += c1.s;
    s += tg(460, 176, 'carbamic acid');
    s += arrow(P(560, 96), P(622, 96), { size: 8 });
    s += lbl(591, 82, '−CO₂');
    s += amineNH2(P(652, 106));
    s += rule(26, 196, 734, 196);
    // Cbz row
    const z = carbamate(P(30, 262), { tail: 'Bn', breakTail: true, dx: 40, ringR: 20 });
    s += z.s;
    s += tg(z.Os.x + 40, z.Os.y + 56, 'this bond breaks', 'warn');
    s += arrow(P(290, 262), P(352, 262), { size: 8 });
    s += lbl(321, 248, 'H₂, Pd/C');
    const c2 = carbamate(P(380, 262), { tail: 'OH' });
    s += c2.s;
    s += tg(321, 284, 'toluene');
    s += tg(321, 298, 'forms');
    s += arrow(P(560, 262), P(622, 262), { size: 8 });
    s += lbl(591, 248, '−CO₂');
    s += amineNH2(P(652, 272));
    return s;
  },
  caption: 'Each mask breaks at a different bond (highlighted), and both give the same carbamic acid, which loses CO₂ to free the amine.',
});

/* ===================================================== orthogonality */
/* A two-by-two test: masks across the top, reagents down the side. */
function grid(x, y, w, cols, rows, cells, o = {}) {
  const lw = o.labelW ?? 96, ch = o.cellH ?? 56, hh = 40;
  const cw = (w - lw) / cols.length;
  let s = '';
  cols.forEach((c, i) => {
    s += panel(x + lw + i * cw + 4, y, cw - 8, hh - 6, { kind: 'hi', r: 8 });
    s += lbl(x + lw + i * cw + cw / 2, y + 22, c);
  });
  rows.forEach((r, j) => {
    const yy = y + hh + j * ch;
    s += rule(x, yy, x + w, yy);
    s += lbl(x + 4, yy + ch / 2 + 5, r, 'start');
    cols.forEach((_, i) => {
      const [t, k] = cells[j][i];
      s += tg(x + lw + i * cw + cw / 2, yy + ch / 2 + 4, t, k);
    });
  });
  s += rule(x, y + hh + rows.length * ch, x + w, y + hh + rows.length * ch);
  return s;
}
const BOC_CBZ = {
  cols: ['Boc', 'Cbz'],
  rows: ['TFA', 'H₂, Pd/C'],
  cells: [[['comes off', 'good'], ['stays on', 'mut']], [['stays on', 'mut'], ['comes off', 'good']]],
};
const TBS_ACETAL = {
  cols: ['TBS ether', 'acetal'],
  rows: ['TBAF (F⁻)', 'H₃O⁺'],
  cells: [[['comes off', 'good'], ['stays on', 'mut']], [['can come off', 'warn'], ['comes off', 'good']]],
};
FIGURES.push({
  id: 'orthogonal-grid',
  section: 'protecting-groups',
  anchor: '<h3>Orthogonality</h3>',
  alt: 'Two grids. Left: Boc and Cbz tested against TFA and against H2 over Pd/C. TFA removes Boc and leaves Cbz on; H2 over Pd/C removes Cbz and leaves Boc on. Right: a TBS ether and an acetal tested against TBAF and against aqueous acid. TBAF removes the TBS ether and leaves the acetal on; aqueous acid removes the acetal but can also remove the TBS ether.',
  viewBox: '0 0 760 240',
  build() {
    let s = '';
    s += tg(190, 24, 'ORTHOGONAL BOTH WAYS');
    s += grid(20, 40, 340, BOC_CBZ.cols, BOC_CBZ.rows, BOC_CBZ.cells);
    s += tg(570, 24, 'CLEAN IN ONE DIRECTION ONLY');
    s += grid(400, 40, 340, TBS_ACETAL.cols, TBS_ACETAL.rows, TBS_ACETAL.cells);
    s += lbl(190, 222, 'Either mask can go first.');
    s += lbl(570, 222, 'Take the TBS ether off first.');
    return s;
  },
  caption: 'Read each row as one reagent applied to a molecule carrying both masks. On the left each reagent removes exactly one mask. On the right only the fluoride row is that clean.',
});

FIGURES.push({
  id: 'l-orthogonal-grid',
  lessons: ['protecting-groups'],
  alt: 'Two grids stacked. Top: TFA removes Boc and leaves Cbz on; H2 over Pd/C removes Cbz and leaves Boc on. Bottom: TBAF removes a TBS ether and leaves an acetal on; aqueous acid removes the acetal but can also remove the TBS ether.',
  viewBox: '0 0 340 440',
  build() {
    let s = '';
    s += tg(170, 22, 'ORTHOGONAL BOTH WAYS');
    s += grid(10, 36, 320, BOC_CBZ.cols, BOC_CBZ.rows, BOC_CBZ.cells, { labelW: 92 });
    s += tg(170, 226, 'CLEAN IN ONE DIRECTION ONLY');
    s += grid(10, 240, 320, TBS_ACETAL.cols, TBS_ACETAL.rows, TBS_ACETAL.cells, { labelW: 92 });
    s += lbl(170, 422, 'Take the TBS ether off first.');
    return s;
  },
  caption: 'Each row is one reagent applied to a molecule carrying both masks.',
});

/* ================================= worked example 1: the short route */
/* 4-hydroxybutan-2-one and its three successors, as a zigzag
   O – C4 – C3 – C2 – C1 with C2 on an upper vertex. */
function hbk(p, st) {
  const pts = zig(p.x, p.y, 5, 36, 22);
  const [o, c4, c3, c2, c1] = pts;
  const oLab = st === 0 || st === 3 ? 'HO' : 'TBSO';
  const oR = oLab === 'HO' ? 17 : 21;
  let s = bond(o, c4, { rFrom: oR, rTo: 0 }) + sk(c4, c3) + sk(c3, c2) + sk(c2, c1);
  if (st <= 1) {
    const od = P(c2.x, c2.y - 40);
    s += bond(c2, od, { rFrom: 0, rTo: 15, order: 2 }) + A(od, 'O', { r: 15 });
  } else {
    const oh = at(c2, 120, 40), me = at(c2, 60, 34);
    s += bond(c2, oh, { rFrom: 0, rTo: 17 }) + A(oh, 'OH', { r: 17 });
    s += hiBond(c2, me, 0, 0);
    s += tg(me.x + 6, me.y - 8, 'CH₃', null, 'start');
  }
  s += A(o, oLab, { r: oR, kind: st === 0 ? 'warn' : st === 3 ? undefined : 'hi' });
  return s;
}
FIGURES.push({
  id: 'route-short',
  section: 'protecting-groups',
  anchor: '<span class="k">Worked example — the full three steps</span>',
  alt: 'Four skeletal structures. 4-hydroxybutan-2-one, with its OH highlighted, becomes the TBS ether with TBSCl and imidazole. CH3MgBr then a water workup adds a methyl group to the ketone carbon, giving a tertiary alcohol while the TBS ether is unchanged. TBAF then removes the TBS group, giving 3-methylbutane-1,3-diol.',
  viewBox: '0 0 760 356',
  build() {
    let s = '';
    s += hbk(P(60, 110), 0);
    s += lbl(118, 150, '4-hydroxybutan-2-one');
    s += arrow(P(250, 100), P(470, 100), { size: 8 });
    s += lbl(360, 86, '1 protect: TBSCl, imidazole');
    s += hbk(P(530, 110), 1);
    s += lbl(592, 150, 'TBS ether');
    s += arrow(P(560, 180), P(260, 250), { size: 8 });
    s += lbl(170, 192, '2 react: CH₃MgBr,', 'start');
    s += lbl(170, 210, 'then mild aqueous workup', 'start');
    s += hbk(P(60, 300), 2);
    s += arrow(P(250, 300), P(470, 300), { size: 8 });
    s += lbl(360, 320, '3 deprotect: TBAF');
    s += hbk(P(530, 300), 3);
    s += lbl(592, 340, '3-methylbutane-1,3-diol');
    return s;
  },
  caption: 'Read left to right, then along the diagonal to the second row. The new C–C bond is highlighted; the TBS group (shaded) rides through step 2 unchanged.',
});

FIGURES.push({
  id: 'l-final-target',
  lessons: ['protecting-groups'],
  alt: 'Top: 4-hydroxybutan-2-one, HO–CH2–CH2–C(=O)–CH3, with its OH highlighted. A downward arrow marked with a question mark leads to the target below: the same chain with a methyl group added to the ketone carbon, now a tertiary alcohol, and the original OH unchanged.',
  viewBox: '0 0 340 290',
  build() {
    let s = '';
    s += tg(20, 56, 'START', null, 'start');
    s += hbk(P(98, 90), 0);
    s += arrow(P(170, 124), P(170, 184), { size: 8 });
    s += lbl(186, 160, '?', 'start');
    s += tg(20, 236, 'TARGET', null, 'start');
    s += hbk(P(98, 270), 3);
    return s;
  },
  caption: 'Add a methyl group to the ketone carbon and leave the other OH as it is.',
});

/* ================================= worked example 2: the longer route */
/* X – C5 – C4 – C3 – C2 – C1, C2 on a lower vertex. */
function bromoChain(p, st) {
  const pts = zig(p.x, p.y, 6, 34, 22);
  const [x, c5, c4, c3, c2, c1] = pts;
  let s = '';
  if (st === 3) {
    // C6 is a skeletal carbon carrying OH and a phenyl ring; the new C6–C5 bond is highlighted.
    s += hiBond(x, c5, 0, 0);
    const oh = P(x.x, x.y + 38);
    s += bond(x, oh, { rFrom: 0, rTo: 17 }) + A(oh, 'OH', { r: 17 });
    const rr = 20;
    const cen = at(x, 150, 30 + rr);
    const ring = benzene(cen.x, cen.y, rr, { rot: 330 });
    s += sk(x, ring.pts[0]) + ring.svg;
  } else {
    const lab = st === 2 ? 'BrMg' : 'Br';
    const r = st === 2 ? 21 : 16;
    s += bond(x, c5, { rFrom: r, rTo: 0 });
    s += A(x, lab, { r, kind: st === 2 ? 'hi' : undefined });
  }
  s += sk(c5, c4) + sk(c4, c3) + sk(c3, c2) + sk(c2, c1);
  if (st === 1 || st === 2) {
    s += dioxolane(c2, 30).s;
  } else {
    const od = P(c2.x, c2.y + 40);
    s += bond(c2, od, { rFrom: 0, rTo: 15, order: 2 }) + A(od, 'O', { r: 15, kind: st === 0 ? 'warn' : undefined });
  }
  return s;
}
FIGURES.push({
  id: 'route-long',
  section: 'protecting-groups',
  anchor: '<span class="k">Worked example — a protecting group inside a longer route</span>',
  alt: 'Four skeletal structures. 5-bromopentan-2-one, with its ketone oxygen highlighted, is converted with ethylene glycol and TsOH into the cyclic acetal, where the ketone carbon now sits in a five-membered ring with two oxygens. Magnesium in dry ether turns the C–Br into C–MgBr. Benzaldehyde, then aqueous acid, gives 6-hydroxy-6-phenylhexan-2-one: a new C–C bond joins the old CH2Br carbon to a CH(OH) carrying a phenyl ring, and the ketone is back.',
  viewBox: '0 0 760 390',
  build() {
    let s = '';
    s += bromoChain(P(60, 90), 0);
    s += lbl(145, 176, '5-bromopentan-2-one');
    s += arrow(P(260, 80), P(470, 80), { size: 8 });
    s += lbl(365, 50, '1 protect: HOCH₂CH₂OH,');
    s += lbl(365, 68, 'TsOH, remove H₂O');
    s += bromoChain(P(520, 90), 1);
    s += arrow(P(560, 196), P(270, 250), { size: 8 });
    s += lbl(290, 206, '2 Mg, dry ether', 'start');
    s += bromoChain(P(60, 290), 2);
    s += arrow(P(290, 290), P(470, 290), { size: 8 });
    s += lbl(380, 276, '3 PhCHO', 'middle');
    s += lbl(380, 312, '4 H₃O⁺', 'middle');
    s += bromoChain(P(570, 290), 3);
    s += lbl(620, 376, '6-hydroxy-6-phenylhexan-2-one');
    return s;
  },
  caption: 'Follow the ketone (right end of each chain): masked in step 1, carried through steps 2 and 3, and unmasked in step 4. The new C–C bond is highlighted.',
});

export default FIGURES;
