/* Figures for the electrophiles notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   This page sits in How Reactions Happen, after skeletal structures, so
   chains may be drawn skeletally. Every atom that carries a charge, a
   partial charge or an empty orbital is written out with its label, because
   that atom is what each figure is about.

   Conventions, kept the same as the Foundations, Carbocations and Carbonyl
   pages:
   - δ+ is coral (fg-warn) and δ− teal (fg-hi); full charges likewise;
   - the electrophilic atom sits on a coral disc, an electron-rich atom on a
     teal one;
   - an empty orbital is a pale lobe (lobeE) in the main orbital color, and
     is labeled "empty";
   - a curved arrow starts on electrons (a lone pair or the middle of a
     bond) and ends on the atom, or the bond, that receives them;
   - lone pairs are drawn on oxygen and nitrogen, whose pairs take part in
     what the figures show; halogen lone pairs are left off.

   Lesson copies (id prefix l-) are 340 wide or less, stacked, and use only
   fg-lbl and fg-tag text. */
import { atom as atom0, bond, wedge, hash, arrow, curve, lonePair, text, tag, rule, P } from '../lib/ochem-figure.mjs';
import { sk, ringDouble, benzene } from '../lib/ochem-skeletal.mjs';
import { lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
/* A lone pair pointing out along math angle `deg`. */
const lp = (c, deg, d = 21) => lonePair(c.x, c.y, -deg, { dist: d, spread: 4.5, r: 2.4 });
const lpTip = (c, deg) => at(c, deg, 28);

/* An atom disc that stays opaque in both themes (the tinted discs are
   translucent in the dark theme, so an opaque plain disc goes under them). */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
const rOf = (l) => (l.length >= 3 ? 17 : l === 'H' ? 12 : 15);

/* A bond from c (an atom of radius rFrom) to a labeled group, plus the group.
   o.kind: 'wedge' | 'hash' for the bond; o.atomKind for the group's disc. */
function arm(c, deg, len, l, o = {}) {
  const e = at(c, deg, len);
  const r = o.r ?? rOf(l);
  const opts = { rFrom: o.rFrom ?? 16, rTo: r };
  let s = o.kind === 'wedge' ? wedge(c, e, { ...opts, width: 9 })
        : o.kind === 'hash' ? hash(c, e, { ...opts, width: 10, rungs: 5 })
        : bond(c, e, { ...opts, order: o.order || 1 });
  s += atom(e.x, e.y, l, { r, kind: o.atomKind });
  return { s, e };
}

const charge = (x, y, s, cls = 'fg-warn', size = 15) => text(x, y, s, { cls, size });
const dPlus = (x, y, size = 13) => text(x, y, 'δ+', { cls: 'fg-warn', size });
const dMinus = (x, y, size = 13) => text(x, y, 'δ−', { cls: 'fg-hi', size });
const sm = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-sm', size: 10.5, anchor });
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const tg = (x, y, s, anchor = 'middle', cls = 'fg-tag') => text(x, y, s, { cls, size: 11, anchor });

/* Resonance arrow: one line, a head at each end. */
function resArrow(a, b) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  return arrow(m, b, { size: 8 }) + arrow(m, a, { size: 8 });
}
/* A curved arrow that starts on the middle of bond a–b, pushed `off` px to
   the left of the direction a→b (negative: right), and ends at e. */
function fromBond(a, b, e, bow, off = 5) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  return curve(P(m.x + (dy / L) * off, m.y - (dx / L) * off), e, { bow, size: 7 });
}
/* The C=O pi pair moving onto oxygen, for a C=O drawn straight up. */
const piToO = (c, o) => curve(P(c.x + 8, c.y - 24), P(o.x + 16, o.y + 4), { bow: 14 });

/* A carbonyl drawn face-on: C at c, O straight up, the other two groups at
   subs[i].deg. Returns the ink plus the key points. */
function carbonyl(c, { len = 56, subs = [], cKind = 'plain', oKind = 'plain', lps = [150, 30] } = {}) {
  let s = '';
  const o = at(c, 90, len);
  s += bond(c, o, { order: 2, rFrom: 16, rTo: 15 });
  const ends = [];
  for (const g of subs) { const a = arm(c, g.deg, g.len ?? len, g.l, { atomKind: g.kind, r: g.r }); s += a.s; ends.push(a.e); }
  for (const d of lps) s += lp(o, d);
  s += atom(o.x, o.y, 'O', { kind: oKind });
  s += atom(c.x, c.y, 'C', { kind: cKind });
  return { s, o, ends };
}

/* An sp² center seen edge-on: two of its three
   groups lie left and right in that plane (the third points at the reader),
   and the empty p orbital stands above and below. */
function edgeOnEmpty(c, l, gL, gR, { off = 44, ry = 30, len = 62, kind = 'warn', plus = true } = {}) {
  let s = '';
  s += lobeE(c.x, c.y - off, 19, ry);
  s += lobeE(c.x, c.y + off, 19, ry);
  s += arm(c, 180, len, gL).s + arm(c, 0, len, gR).s;
  s += atom(c.x, c.y, l, { kind });
  if (plus) s += charge(at(c, 28, 34).x, at(c, 28, 34).y + 5, '+');
  return s;
}

/* Raw text with an italic prefix, e.g. <i>tert</i>-butyl. */
const italic = (x, y, pre, rest, cls = 'fg-sm', size = 10.5, anchor = 'middle') =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}"><tspan font-style="italic">${pre}</tspan>${rest}</text>`;

/* ======================================================= NOTES FIGURES === */

/* 1. Acetone: which atom is electron-poor. */
FIGURES.push({
  id: 'acetone-electrophile',
  section: 'electrophiles',
  anchor: '',
  alt: 'Acetone, a carbonyl carbon double-bonded to oxygen and bonded to two methyl groups. The carbon is marked delta plus and labeled as the atom a nucleophile attacks. The oxygen, with two lone pairs, is marked delta minus and labeled as the atom an acid protonates. A note gives both formal charges as zero.',
  viewBox: '40 44 480 186',
  build() {
    let s = '';
    const c = P(150, 140);
    const k = carbonyl(c, { subs: [{ deg: 210, l: 'CH₃' }, { deg: 330, l: 'CH₃' }], len: 58, cKind: 'warn', oKind: 'hi' });
    s += k.s;
    s += dPlus(122, 126);
    s += dMinus(114, 94);
    s += arrow(P(262, 140), P(172, 140), { muted: true });
    s += sm(272, 136, 'the carbon is short of electrons:', 'start');
    s += sm(272, 152, 'a nucleophile attacks it', 'start');
    s += arrow(P(262, 82), P(186, 82), { muted: true });
    s += sm(272, 78, 'the oxygen holds extra density:', 'start');
    s += sm(272, 94, 'an acid protonates it', 'start');
    s += lbl(150, 212, 'acetone');
    s += sm(272, 212, 'formal charges: C 0, O 0', 'start');
    return s;
  },
  caption: 'Acetone, with the δ+ and δ− ends of its C=O marked and both formal charges given.',
});

/* 2. The two electrophilic carbons besides the carbonyl. */
FIGURES.push({
  id: 'carbon-electrophiles',
  section: 'electrophiles',
  anchor: '',
  alt: 'Left: bromomethane, a carbon with three hydrogens and a bromine. The carbon is marked delta plus and the bromine delta minus; the bromine is labeled as the leaving group. Right: the tert-butyl cation seen edge-on. Its carbon carries a plus charge, two methyl groups lie left and right in the flat plane, and an empty p orbital stands above and below the plane.',
  viewBox: '0 0 760 262',
  build() {
    let s = '';
    s += tg(190, 26, 'A δ+ CARBON NEXT TO A LEAVING GROUP');
    const c = P(160, 124), br = at(c, 0, 76);
    for (const d of [90, 180, 270]) s += arm(c, d, 46, 'H').s;
    s += bond(c, br, { rFrom: 16, rTo: 16 });
    s += atom(br.x, br.y, 'Br', { kind: 'hi' });
    s += atom(c.x, c.y, 'C', { kind: 'warn' });
    s += dPlus(184, 104);
    s += dMinus(br.x, br.y - 26);
    s += sm(br.x, br.y + 34, 'leaving group');
    s += lbl(190, 214, 'bromomethane');
    s += sm(190, 236, 'Br leaves as Br⁻, taking the bonding pair');

    s += rule(380, 40, 380, 246);

    s += tg(570, 26, 'A CARBOCATION');
    const q = P(570, 124);
    s += edgeOnEmpty(q, 'C', 'H₃C', 'CH₃');
    s += sm(598, 62, 'empty p orbital', 'start');
    s += italic(570, 214, 'tert', '-butyl cation, seen edge-on', 'fg-lbl', 13);
    s += sm(570, 236, 'the third CH₃ points toward you');
    return s;
  },
  caption: 'Left: the δ+ and δ− ends of the C–Br bond. Right: the + on carbon, and its empty p orbital as two pale lobes.',
});

/* 3. Electrophiles that are not carbon. */
FIGURES.push({
  id: 'other-electrophiles',
  section: 'electrophiles',
  anchor: '',
  alt: 'Three panels. The proton: an H with a plus charge inside a pale empty 1s orbital. H–Br: the hydrogen marked delta plus and the bromine delta minus. BF3 seen edge-on: boron with two fluorines left and right in a flat plane and an empty p orbital above and below it.',
  viewBox: '0 0 760 262',
  build() {
    let s = '';
    // The proton.
    s += tg(126, 26, 'THE PROTON, H⁺');
    const h = P(126, 124);
    s += lobeE(h.x, h.y, 30, 30);
    s += atom(h.x, h.y, 'H', { kind: 'warn', r: 13 });
    s += charge(h.x + 36, h.y - 26, '+');
    s += sm(126, 178, 'empty 1s orbital');
    s += sm(126, 222, 'no electrons at all');
    s += sm(126, 240, 'an acid H–A carries it');

    s += rule(253, 40, 253, 246);

    // H–Br.
    s += tg(380, 26, 'A POLARIZED REAGENT, H–Br');
    const hh = P(346, 124), b = P(418, 124);
    s += bond(hh, b, { rFrom: 13, rTo: 16 });
    s += atom(hh.x, hh.y, 'H', { kind: 'warn', r: 13 });
    s += atom(b.x, b.y, 'Br', { kind: 'hi' });
    s += dPlus(hh.x, hh.y - 24);
    s += dMinus(b.x, b.y - 26);
    s += sm(380, 222, 'the H end is δ+:');
    s += sm(380, 240, 'a nucleophile attacks the H');

    s += rule(507, 40, 507, 246);

    // BF3 edge-on.
    s += tg(633, 26, 'A LEWIS ACID, BF₃');
    const bb = P(633, 124);
    s += edgeOnEmpty(bb, 'B', 'F', 'F', { len: 54, plus: false });
    s += sm(660, 62, 'empty p orbital', 'start');
    s += sm(633, 222, 'six electrons on boron;');
    s += sm(633, 240, 'the third F points toward you');
    return s;
  },
  caption: 'Left and right, the pale shapes are empty orbitals. In the middle, H–Br has none; look at the δ+ on its H instead.',
});

/* 4. Br2 becoming polarized as it meets an alkene. */
function br2Scene(o) {
  // o: center of the C=C, Br2 stacked above it.
  let s = '';
  const c1 = P(o.x - 44, o.y), c2 = P(o.x + 44, o.y);
  s += `<ellipse class="fg-orb-alt" cx="${o.x}" cy="${o.y - 24}" rx="60" ry="15"></ellipse>`;
  s += `<ellipse class="fg-orb-alt" cx="${o.x}" cy="${o.y + 24}" rx="60" ry="15"></ellipse>`;
  s += arm(c1, 150, 46, 'H', { kind: 'hash' }).s + arm(c1, 210, 46, 'H', { kind: 'wedge' }).s;
  s += arm(c2, 30, 46, 'H', { kind: 'hash' }).s + arm(c2, 330, 46, 'H', { kind: 'wedge' }).s;
  s += bond(c1, c2, { rFrom: 15, rTo: 15 });
  s += atom(c1.x, c1.y, 'C') + atom(c2.x, c2.y, 'C');
  const near = P(o.x, o.y - 76), far = P(o.x, o.y - 142);
  s += bond(near, far, { rFrom: 16, rTo: 16 });
  s += atom(near.x, near.y, 'Br', { kind: 'warn' });
  s += atom(far.x, far.y, 'Br', { kind: 'hi' });
  s += dPlus(near.x + 30, near.y + 5);
  s += dMinus(far.x + 30, far.y + 5);
  s += arrow(P(o.x - 28, near.y - 4), P(o.x - 28, far.y + 6), { size: 7 });
  return { s, near, far };
}

FIGURES.push({
  id: 'bromine-induced',
  section: 'electrophiles',
  anchor: '',
  alt: 'Left: Br2 on its own, two identical bromine atoms with no partial charges. Right: Br2 held end-on above an ethene molecule that is seen edge-on, with its filled pi orbital drawn above and below the C–C bond. An arrow beside the Br–Br bond points away from the alkene: the bonding pair has shifted to the far bromine, which is marked delta minus, and the near bromine is marked delta plus.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tg(130, 26, 'Br₂ ON ITS OWN');
    const a = P(90, 140), b = P(170, 140);
    s += bond(a, b, { rFrom: 16, rTo: 16 });
    s += atom(a.x, a.y, 'Br') + atom(b.x, b.y, 'Br');
    s += sm(130, 186, 'two identical atoms share');
    s += sm(130, 202, 'the pair evenly: no δ+, no δ−');

    s += rule(270, 40, 270, 284);

    s += tg(500, 26, 'Br₂ MEETING AN ALKENE');
    const sc = br2Scene(P(440, 222));
    s += sc.s;
    s += sm(560, 74, 'the pair shifts away', 'start');
    s += sm(560, 90, 'from the π cloud', 'start');
    s += sm(560, 150, 'the near Br is left δ+:', 'start');
    s += sm(560, 166, 'the alkene attacks it', 'start');
    s += sm(560, 216, 'filled π orbital: electrons', 'start');
    s += sm(560, 232, 'above and below the C–C bond', 'start');
    s += sm(440, 288, 'ethene, seen edge-on');
    return s;
  },
  caption: 'Right: the arrow beside the Br–Br bond shows which way the shared pair shifts as the alkene’s π electrons come close.',
});

/* 5. Two ways to make a carbonyl carbon more electrophilic. */
FIGURES.push({
  id: 'carbonyl-activation',
  section: 'electrophiles',
  anchor: '',
  alt: 'Top row: acetone takes a proton from an acid H–A. A curved arrow runs from an oxygen lone pair to the H, and another from the H–A bond to A. The product, protonated acetone, is drawn as two resonance structures: one with the plus charge on oxygen and a C=O double bond, the other with a C–O single bond and the plus charge on carbon. Bottom row: acetone donates an oxygen lone pair to the boron of BF3, giving an adduct with a plus charge on oxygen and a minus charge on boron; its carbon is marked more delta plus than before.',
  viewBox: '0 0 760 470',
  build() {
    let s = '';
    // Row 1: protonation.
    s += tg(24, 24, 'PROTONATION', 'start');
    const c1 = P(100, 160);
    const k1 = carbonyl(c1, { subs: [{ deg: 210, l: 'CH₃' }, { deg: 330, l: 'CH₃' }], len: 56 });
    s += k1.s;
    const h = P(196, 78), A = P(254, 78);
    s += bond(h, A, { rFrom: 12, rTo: 15 });
    s += atom(h.x, h.y, 'H', { r: 12, kind: 'warn' });
    s += atom(A.x, A.y, 'A');
    s += curve(lpTip(k1.o, 30), P(h.x - 14, h.y + 4), { bow: -12, size: 7 });
    s += fromBond(h, A, P(A.x + 2, A.y - 18), -14, 5);
    s += arrow(P(282, 140), P(334, 140), { muted: true });
    s += sm(308, 160, '− A⁻');

    const c2 = P(420, 160);
    const o2 = at(c2, 90, 56);
    s += arm(c2, 210, 56, 'CH₃').s + arm(c2, 330, 56, 'CH₃').s;
    s += bond(c2, o2, { order: 2, rFrom: 16, rTo: 15 });
    s += arm(o2, 30, 46, 'H', { rFrom: 15, r: 12 }).s;
    s += lp(o2, 150);
    s += atom(o2.x, o2.y, 'O', { kind: 'warn' });
    s += charge(o2.x - 2, o2.y - 24, '+');
    s += atom(c2.x, c2.y, 'C');
    s += piToO(c2, o2);

    s += resArrow(P(506, 140), P(566, 140));

    const c3 = P(652, 160);
    const o3 = at(c3, 90, 56);
    s += arm(c3, 210, 56, 'CH₃').s + arm(c3, 330, 56, 'CH₃').s;
    s += bond(c3, o3, { rFrom: 16, rTo: 15 });
    s += arm(o3, 30, 46, 'H', { rFrom: 15, r: 12 }).s;
    s += lp(o3, 150) + lp(o3, 210);
    s += atom(o3.x, o3.y, 'O');
    s += atom(c3.x, c3.y, 'C', { kind: 'warn' });
    s += charge(c3.x + 24, c3.y - 12, '+');
    s += sm(100, 222, 'acetone');
    s += sm(420, 222, '+ drawn on oxygen');
    s += sm(652, 222, '+ on carbon: the site');
    s += sm(652, 238, 'a nucleophile attacks');

    s += rule(20, 256, 740, 256);

    // Row 2: a Lewis acid.
    s += tg(24, 282, 'COORDINATION TO A LEWIS ACID', 'start');
    const c4 = P(100, 400);
    const k4 = carbonyl(c4, { subs: [{ deg: 210, l: 'CH₃' }, { deg: 330, l: 'CH₃' }], len: 56 });
    s += k4.s;
    const B = P(236, 356);
    s += arm(B, 90, 44, 'F', { rFrom: 15 }).s + arm(B, 330, 44, 'F', { rFrom: 15 }).s + arm(B, 210, 44, 'F', { rFrom: 15 }).s;
    s += atom(B.x, B.y, 'B');
    s += curve(lpTip(k4.o, 30), P(B.x - 17, B.y - 4), { bow: -14, size: 7 });
    s += arrow(P(304, 370), P(356, 370), { muted: true });

    const c5 = P(440, 400);
    const o5 = at(c5, 90, 56);
    s += arm(c5, 210, 56, 'CH₃').s + arm(c5, 330, 56, 'CH₃').s;
    s += bond(c5, o5, { order: 2, rFrom: 16, rTo: 15 });
    const B5 = at(o5, 25, 58);
    s += bond(o5, B5, { rFrom: 15, rTo: 15 });
    s += arm(B5, 90, 42, 'F', { rFrom: 15 }).s + arm(B5, 10, 44, 'F', { rFrom: 15 }).s + arm(B5, 300, 44, 'F', { rFrom: 15 }).s;
    s += atom(B5.x, B5.y, 'B');
    s += charge(B5.x - 22, B5.y + 26, '−', 'fg-hi');
    s += lp(o5, 150);
    s += atom(o5.x, o5.y, 'O', { kind: 'warn' });
    s += charge(o5.x - 2, o5.y - 24, '+');
    s += atom(c5.x, c5.y, 'C', { kind: 'warn' });
    s += dPlus(c5.x - 30, c5.y - 12);
    s += sm(100, 460, 'acetone + BF₃');
    s += sm(440, 460, 'oxygen shares a pair with boron');
    s += sm(572, 404, 'the positive oxygen pulls', 'start');
    s += sm(572, 420, 'harder on the carbon, so', 'start');
    s += sm(572, 436, 'the carbon is more δ+', 'start');
    return s;
  },
  caption: 'Top: follow the arrows to protonated acetone, then compare where its two resonance structures put the +. Bottom: the same oxygen lone pair goes to boron instead of to a proton.',
});

/* 6. An alcohol made into a tosylate. */
FIGURES.push({
  id: 'tosylate',
  section: 'electrophiles',
  anchor: '',
  alt: 'Left: ethanol drawn skeletally, its C–O carbon marked delta plus. An arrow labeled make the tosylate leads to ethyl tosylate: the same two-carbon chain on an oxygen, which is bonded to a sulfur carrying two double-bonded oxygens and a benzene ring with a methyl group at the far end. A bracket labels the sulfur, both S=O oxygens, the ring and its methyl as Ts, the tosyl group.',
  viewBox: '0 56 760 234',
  build() {
    let s = '';
    // Ethanol.
    const a = P(46, 160), b = P(96, 132), o = P(146, 160);
    s += sk(a, b) + bond(b, o, { rFrom: 0, rTo: 16 });
    s += lp(o, 330) + lp(o, 210);
    s += atom(o.x, o.y, 'OH', { r: 16 });
    s += dPlus(b.x, b.y - 16);
    s += sm(96, 214, 'ethanol: δ+ carbon,');
    s += sm(96, 230, 'but HO⁻ does not leave');
    s += arrow(P(196, 146), P(260, 146), { muted: true });
    s += sm(228, 114, 'make the');
    s += sm(228, 130, 'tosylate');

    // Ethyl tosylate.
    const a2 = P(290, 176), b2 = P(340, 148), o2 = P(390, 176), S = P(448, 176);
    s += sk(a2, b2) + bond(b2, o2, { rFrom: 0, rTo: 15 });
    s += bond(o2, S, { rFrom: 15, rTo: 15 });
    s += lp(o2, 90) + lp(o2, 270);
    s += atom(o2.x, o2.y, 'O');
    const oUp = at(S, 90, 50), oDn = at(S, 270, 50);
    s += bond(S, oUp, { order: 2, rFrom: 15, rTo: 15 }) + bond(S, oDn, { order: 2, rFrom: 15, rTo: 15 });
    s += lp(oUp, 150) + lp(oUp, 30) + lp(oDn, 210) + lp(oDn, 330);
    s += atom(oUp.x, oUp.y, 'O') + atom(oDn.x, oDn.y, 'O');
    const ring = benzene(528, 176, 28, { rot: 0 });
    s += ring.svg;
    const ipso = ring.pts[3], para = ring.pts[0];
    s += bond(S, ipso, { rFrom: 15, rTo: 0 });
    s += atom(S.x, S.y, 'S');
    const me = P(para.x + 42, para.y);
    s += bond(para, me, { rFrom: 0, rTo: 17 }) + atom(me.x, me.y, 'CH₃');
    s += dPlus(b2.x, b2.y - 16);
    // The Ts bracket.
    const yb = 88;
    s += `<path class="fg-bond-soft" d="M433 ${yb + 8} L433 ${yb} L${r2(me.x + 18)} ${yb} L${r2(me.x + 18)} ${yb + 8}"></path>`;
    s += tg((433 + me.x + 18) / 2, yb - 10, 'Ts, the tosyl group');
    s += sm(470, 262, 'ethyl tosylate, CH₃CH₂–OTs: the same δ+ carbon,');
    s += sm(470, 278, 'now carrying a group that leaves easily');
    return s;
  },
  caption: 'Ethanol and ethyl tosylate. The bracket marks everything the letters Ts stand for.',
});

/* 7. A neighbor that pulls, and a neighbor that pushes. */
FIGURES.push({
  id: 'carbonyl-neighbors',
  section: 'electrophiles',
  anchor: '',
  alt: 'Top row: acetaldehyde, CH3–CHO, with a small delta plus on the carbonyl carbon, beside trifluoroacetaldehyde, CF3–CHO, with a larger delta plus. Bottom row: acetamide and its resonance structure. Curved arrows move the nitrogen lone pair into the C–N bond and the C=O pi pair onto oxygen, giving a structure with C=N, a plus charge on nitrogen and a minus charge on oxygen.',
  viewBox: '0 0 760 510',
  build() {
    let s = '';
    s += tg(24, 24, 'A NEIGHBOR THAT PULLS DENSITY AWAY', 'start');
    const c1 = P(130, 140);
    s += carbonyl(c1, { subs: [{ deg: 210, l: 'CH₃' }, { deg: 330, l: 'H', len: 48, r: 12 }], cKind: 'warn' }).s;
    s += dPlus(c1.x - 30, c1.y - 12, 11);
    s += lbl(130, 204, 'acetaldehyde');
    s += sm(130, 222, 'weaker electrophile');
    const c2 = P(380, 140);
    s += carbonyl(c2, { subs: [{ deg: 210, l: 'CF₃', kind: 'hi' }, { deg: 330, l: 'H', len: 48, r: 12 }], cKind: 'warn' }).s;
    s += dPlus(c2.x - 32, c2.y - 12, 18);
    s += lbl(380, 204, 'trifluoroacetaldehyde');
    s += sm(380, 222, 'stronger electrophile');
    s += sm(540, 120, 'three F atoms pull density', 'start');
    s += sm(540, 136, 'out of the carbonyl carbon', 'start');
    s += sm(540, 152, 'through the σ bonds', 'start');

    s += rule(20, 244, 740, 244);

    s += tg(24, 270, 'A NEIGHBOR THAT GIVES DENSITY BACK', 'start');
    const c3 = P(130, 390);
    const k3 = carbonyl(c3, { subs: [{ deg: 210, l: 'CH₃' }], cKind: 'plain' });
    s += k3.s;
    const n3 = at(c3, 330, 58);
    s += bond(c3, n3, { rFrom: 16, rTo: 15 });
    s += arm(n3, 30, 44, 'H', { rFrom: 15, r: 12 }).s + arm(n3, 270, 44, 'H', { rFrom: 15, r: 12 }).s;
    s += lp(n3, 210);
    s += atom(n3.x, n3.y, 'N');
    s += curve(at(n3, 210, 24), P((c3.x + n3.x) / 2 - 2, (c3.y + n3.y) / 2 + 3), { bow: -10, size: 7 });
    s += piToO(c3, k3.o);
    s += lbl(130, 496, 'acetamide');

    s += resArrow(P(250, 380), P(318, 380));

    const c4 = P(420, 390);
    const o4 = at(c4, 90, 56);
    s += bond(c4, o4, { rFrom: 16, rTo: 15 });
    s += lp(o4, 90) + lp(o4, 180) + lp(o4, 0);
    s += atom(o4.x, o4.y, 'O', { kind: 'hi' });
    s += charge(o4.x + 24, o4.y - 18, '−', 'fg-hi');
    s += arm(c4, 210, 56, 'CH₃').s;
    const n4 = at(c4, 330, 58);
    s += bond(c4, n4, { order: 2, rFrom: 16, rTo: 15 });
    s += arm(n4, 30, 44, 'H', { rFrom: 15, r: 12 }).s + arm(n4, 270, 44, 'H', { rFrom: 15, r: 12 }).s;
    s += atom(n4.x, n4.y, 'N', { kind: 'warn' });
    s += charge(n4.x + 22, n4.y + 20, '+');
    s += atom(c4.x, c4.y, 'C');
    s += sm(420, 496, 'the + sits on nitrogen, not carbon');
    s += sm(556, 370, 'nitrogen’s lone pair is shared', 'start');
    s += sm(556, 386, 'with the carbonyl carbon, so', 'start');
    s += sm(556, 402, 'that carbon is far less δ+', 'start');
    return s;
  },
  caption: 'Top: compare the size of the two δ+ labels. Bottom: follow the two arrows from acetamide to its charge-separated resonance structure.',
});

/* 8. One molecule, four candidate carbons. */
FIGURES.push({
  id: 'electrophile-scan',
  section: 'electrophiles',
  anchor: '',
  alt: 'A skeletal drawing of 4-chlorobutan-2-one with its four carbons numbered. Carbons 2 and 4 are marked delta plus. A list beside it gives the verdict on each carbon: carbon 1, the CH3, is not a target; carbon 2, the carbonyl carbon, is a target because its pi bond can break; carbon 3 is not; carbon 4, the CH2Cl, is a target because it is delta plus and chloride can leave.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tg(210, 36, 'FOUR CARBONS, TWO SITES');
    const cl = P(96, 176), c1 = P(154, 142), c2 = P(212, 176), c3 = P(270, 142), o = P(270, 82), c4 = P(328, 176);
    s += bond(cl, c1, { rFrom: 16, rTo: 0 });
    s += sk(c1, c2) + sk(c2, c3) + sk(c3, c4);
    s += bond(c3, o, { rFrom: 0, rTo: 15, order: 2 });
    s += atom(cl.x, cl.y, 'Cl', { kind: 'hi' });
    s += lp(o, 150) + lp(o, 30);
    s += atom(o.x, o.y, 'O', { kind: 'hi' });
    for (const pt of [c1, c2, c3, c4]) s += atom(pt.x, pt.y, '', { kind: 'point' });
    s += text(154, 124, '4', { cls: 'fg-tag-good', size: 12 });
    s += text(212, 202, '3', { cls: 'fg-tag-mut', size: 12 });
    s += text(254, 164, '2', { cls: 'fg-tag-good', size: 12 });
    s += text(328, 202, '1', { cls: 'fg-tag-mut', size: 12 });
    s += dPlus(176, 132);
    s += dPlus(246, 124);
    s += lbl(210, 244, 'ClCH₂–CH₂–CO–CH₃');
    s += sm(210, 264, '4-chlorobutan-2-one');

    s += rule(376, 34, 376, 288);

    const lines = [
      ['1', 'CH₃: nothing pulls on it,', 'nothing on it can leave', false],
      ['2', 'carbonyl carbon: strongly δ+,', 'and its π bond can break: a target', true],
      ['3', 'middle CH₂: barely polarized,', 'nothing on it can leave', false],
      ['4', 'CH₂Cl carbon: δ+, and chloride', 'can leave: a target', true],
    ];
    let y = 84;
    for (const [num, a, b, good] of lines) {
      s += text(404, y, num, { cls: good ? 'fg-tag-good' : 'fg-tag-mut', size: 12, anchor: 'start' });
      s += sm(424, y, a, 'start');
      if (b) s += sm(424, y + 16, b, 'start');
      y += 52;
    }
    return s;
  },
  caption: 'The numbers in green mark the two electrophilic sites, and the list gives the verdict on every carbon.',
});

/* 9. Water plays both roles. */
FIGURES.push({
  id: 'water-two-roles',
  section: 'electrophiles',
  anchor: '',
  alt: 'Left: a water molecule uses an oxygen lone pair to bond to the positive carbon of the tert-butyl cation; a curved arrow runs from the lone pair to the carbon. Right: the amide ion, NH2 minus, uses a nitrogen lone pair to take a hydrogen from water; one curved arrow runs from the nitrogen lone pair to the H, and a second from the H–O bond onto the oxygen.',
  viewBox: '0 0 760 236',
  build() {
    let s = '';
    s += tg(190, 26, 'WATER AS THE NUCLEOPHILE');
    const c = P(96, 120);
    s += arm(c, 90, 50, 'CH₃').s + arm(c, 210, 50, 'CH₃').s + arm(c, 330, 50, 'CH₃').s;
    s += atom(c.x, c.y, 'C', { kind: 'warn' });
    s += charge(c.x - 24, c.y - 10, '+');
    const o = P(250, 110);
    s += arm(o, 40, 44, 'H', { rFrom: 15, r: 12 }).s + arm(o, 320, 44, 'H', { rFrom: 15, r: 12 }).s;
    s += lp(o, 150) + lp(o, 210);
    s += atom(o.x, o.y, 'O', { kind: 'hi' });
    s += curve(lpTip(o, 150), P(c.x + 20, c.y - 6), { bow: 16, size: 7 });
    s += sm(190, 200, 'an oxygen lone pair bonds');
    s += sm(190, 216, 'to the cation’s carbon');

    s += rule(380, 40, 380, 220);

    s += tg(570, 26, 'WATER’S H AS THE ELECTROPHILE');
    const n = P(450, 120);
    s += arm(n, 135, 44, 'H', { rFrom: 15, r: 12 }).s + arm(n, 225, 44, 'H', { rFrom: 15, r: 12 }).s;
    s += lp(n, 60) + lp(n, 0);
    s += atom(n.x, n.y, 'N', { kind: 'hi' });
    s += charge(n.x + 4, n.y + 34, '−', 'fg-hi');
    const hw = P(560, 120), ow = P(620, 120);
    s += bond(hw, ow, { rFrom: 12, rTo: 15 });
    s += atom(hw.x, hw.y, 'H', { r: 12, kind: 'warn' });
    s += arm(ow, 300, 44, 'H', { rFrom: 15, r: 12 }).s;
    s += lp(ow, 60) + lp(ow, 0);
    s += atom(ow.x, ow.y, 'O');
    s += curve(lpTip(n, 0), P(hw.x - 14, hw.y), { bow: -14, size: 7 });
    s += fromBond(hw, ow, P(ow.x - 8, ow.y - 18), -16, 5);
    s += sm(570, 200, 'the N lone pair takes the H;');
    s += sm(570, 216, 'the O–H pair stays on oxygen');
    return s;
  },
  caption: 'Follow the curved arrows in each panel to see which atom of water takes part.',
});

/* 10. An enone: alpha and beta carbons, and the + on beta. */
FIGURES.push({
  id: 'enone-beta',
  section: 'electrophiles',
  anchor: '',
  alt: 'But-3-en-2-one drawn skeletally, with the carbon next to the C=O labeled alpha and the far carbon of the C=C labeled beta. Curved arrows move the C=C pi pair toward the carbonyl carbon and the C=O pi pair onto oxygen, giving a resonance structure with a minus charge on oxygen and a plus charge on the beta carbon.',
  viewBox: '0 40 760 180',
  build() {
    let s = '';
    const enone = (x0, contributor) => {
      const c1 = P(x0, 150), c2 = P(x0 + 50, 122), c3 = P(x0 + 100, 150), c4 = P(x0 + 150, 122);
      const o = P(c2.x, 70);
      let g = sk(c1, c2);
      if (contributor) {
        g += ringDouble(c2, c3, P(x0 + 75, 176), { inset: 7 }) + sk(c3, c4);
        g += bond(c2, o, { rFrom: 0, rTo: 15 });
        g += lp(o, 90) + lp(o, 180) + lp(o, 0);
        g += atom(o.x, o.y, 'O', { kind: 'hi' });
        g += charge(o.x + 24, o.y - 16, '−', 'fg-hi');
        g += charge(c4.x + 12, c4.y - 8, '+');
      } else {
        g += sk(c2, c3) + ringDouble(c3, c4, P(x0 + 125, 166), { inset: 7 });
        g += bond(c2, o, { order: 2, rFrom: 0, rTo: 15 });
        g += lp(o, 150) + lp(o, 30);
        g += atom(o.x, o.y, 'O');
        g += curve(P((c3.x + c4.x) / 2 + 2, (c3.y + c4.y) / 2 - 8), P((c2.x + c3.x) / 2 + 2, (c2.y + c3.y) / 2 - 8), { bow: -14, size: 7 });
        g += curve(P(c2.x + 8, c2.y - 18), P(o.x + 16, o.y + 4), { bow: 12, size: 7 });
      }
      g += text(c3.x, c3.y + 24, 'α', { cls: 'fg-lbl', size: 13 });
      g += text(c4.x + 2, c4.y + 26, 'β', { cls: 'fg-lbl', size: 13 });
      return g;
    };
    s += enone(60, false);
    s += lbl(135, 206, 'but-3-en-2-one');
    s += resArrow(P(262, 124), P(334, 124));
    s += enone(390, true);
    s += lbl(465, 206, 'a resonance structure');
    s += sm(574, 104, 'the β carbon carries a +:', 'start');
    s += sm(574, 120, 'a nucleophile can attack it', 'start');
    return s;
  },
  caption: 'Follow the two arrows, then find the β carbon in the structure on the right.',
});

/* ====================================================== LESSON FIGURES === */

FIGURES.push({
  id: 'l-elec-dplus',
  lessons: ['electrophiles'],
  anchor: '',
  alt: 'Chloromethane: a carbon with three hydrogens and a chlorine. The carbon is marked delta plus and the chlorine delta minus.',
  viewBox: '0 0 340 206',
  build() {
    let s = '';
    const c = P(136, 86), cl = at(c, 0, 80);
    for (const d of [90, 180, 270]) s += arm(c, d, 46, 'H').s;
    s += bond(c, cl, { rFrom: 16, rTo: 16 });
    s += atom(cl.x, cl.y, 'Cl', { kind: 'hi' });
    s += atom(c.x, c.y, 'C', { kind: 'warn' });
    s += dPlus(160, 66, 15);
    s += dMinus(cl.x, cl.y - 26, 15);
    s += tg(170, 170, 'chloromethane');
    s += tg(170, 192, 'the δ+ carbon is the electrophile');
    return s;
  },
  caption: 'Read the δ+ and δ− labels on the two ends of the C–Cl bond.',
});

FIGURES.push({
  id: 'l-elec-empty',
  lessons: ['electrophiles'],
  anchor: '',
  alt: 'Top: the tert-butyl cation seen edge-on, a positive carbon with two methyl groups in a flat plane and an empty p orbital above and below it. Bottom: a proton, an H with a plus charge inside a pale empty 1s orbital.',
  viewBox: '0 0 340 404',
  build() {
    let s = '';
    s += tg(170, 20, 'A CARBOCATION, SEEN EDGE-ON');
    const q = P(170, 120);
    s += edgeOnEmpty(q, 'C', 'H₃C', 'CH₃', { len: 60 });
    s += tg(196, 60, 'empty p orbital', 'start');
    s += tg(170, 212, 'third CH₃ points toward you');
    s += rule(20, 232, 320, 232);
    s += tg(170, 258, 'A PROTON, H⁺');
    const h = P(170, 320);
    s += lobeE(h.x, h.y, 30, 30);
    s += atom(h.x, h.y, 'H', { kind: 'warn', r: 13 });
    s += charge(h.x + 36, h.y - 26, '+');
    s += tg(170, 382, 'empty 1s orbital, no electrons');
    return s;
  },
  caption: 'The pale shapes are the empty orbitals.',
});

FIGURES.push({
  id: 'l-elec-reagents',
  lessons: ['electrophiles'],
  anchor: '',
  alt: 'Top: H–Br with the hydrogen marked delta plus and the bromine delta minus. Middle: Br2 on its own, no partial charges. Bottom: Br2 held end-on above an ethene molecule seen edge-on, whose filled pi orbital is drawn as two lilac lobes above and below the C–C bond; an arrow shows the Br–Br pair shifting to the far bromine, which is delta minus, leaving the near bromine delta plus.',
  viewBox: '0 0 340 516',
  build() {
    let s = '';
    s += tg(170, 20, 'H–Br: POLAR ALL THE TIME');
    const h = P(136, 72), b = P(206, 72);
    s += bond(h, b, { rFrom: 13, rTo: 16 });
    s += atom(h.x, h.y, 'H', { kind: 'warn', r: 13 });
    s += atom(b.x, b.y, 'Br', { kind: 'hi' });
    s += dPlus(h.x, h.y - 24, 15);
    s += dMinus(b.x, b.y - 26, 15);
    s += rule(20, 110, 320, 110);
    s += tg(170, 136, 'Br₂ ALONE: NOT POLAR');
    const a1 = P(132, 176), a2 = P(208, 176);
    s += bond(a1, a2, { rFrom: 16, rTo: 16 });
    s += atom(a1.x, a1.y, 'Br') + atom(a2.x, a2.y, 'Br');
    s += rule(20, 212, 320, 212);
    s += tg(170, 238, 'Br₂ MEETING AN ALKENE');
    const sc = br2Scene(P(150, 424));
    s += sc.s;
    s += tg(sc.far.x + 44, sc.far.y + 26, 'pair shifts', 'start');
    s += tg(sc.far.x + 44, sc.far.y + 42, 'away', 'start');
    s += tg(170, 488, 'ethene, seen edge-on');
    s += tg(170, 506, 'lilac lobes: its filled π orbital');
    return s;
  },
  caption: 'Compare the δ labels in the three panels.',
});

export default FIGURES;
