/* Figures for the electron-rich-poor notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   This page sits in How Reactions Happen, after skeletal structures, so
   chains may be drawn skeletally. Every atom the text asks the reader to
   find is drawn with its label and its evidence on it: lone pairs, a full
   or partial charge, a highlighted π bond, or an empty orbital.

   Conventions, kept the same as the Nucleophiles and Electrophiles pages:
   - δ+ and + are coral (fg-warn), δ− and − teal (fg-hi);
   - an electron-poor atom sits on a coral disc, an electron-rich atom on a
     teal one;
   - an empty orbital is a pale lobe (lobeE);
   - a curved arrow starts on electrons (a lone pair or the middle of a
     bond) and ends where they go.

   Every figure is 340 wide or less, with its panels stacked, and every
   label is fg-lbl or fg-tag, so the same drawing can sit in the lesson on a
   phone. */
import { atom as atom0, bond, wedge, hash, arrow, curve, lonePair, text, rule, P } from '../lib/ochem-figure.mjs';
import { sk, ringDouble, polyPts, benzene } from '../lib/ochem-skeletal.mjs';
import { lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
/* A lone pair pointing out along math angle `deg`. */
const lp = (c, deg, d = 22) => lonePair(c.x, c.y, -deg, { dist: d, spread: 4.5, r: 2.4 });
/* Disc radius for a label. */
const rOf = (l) => (l.length >= 3 ? 18 : l === 'H' ? 12 : l.length === 2 ? 16 : 15);

/* An atom disc that stays opaque in both themes (the tinted discs are
   translucent in the dark theme, so a plain disc goes under them). */
function A(p, l, kind = 'plain', r) {
  const rr = r ?? rOf(l);
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(p.x)}" cy="${r2(p.y)}" r="${r2(rr)}"></circle>` : '';
  return back + atom0(p.x, p.y, l, { kind, r: rr, size: 13 });
}
/* A bond between two labeled atoms (an empty label is a skeletal vertex). */
const B = (a, la, b, lb, o = {}) =>
  bond(a, b, { rFrom: la === '' ? 0 : rOf(la), rTo: lb === '' ? 0 : rOf(lb), ...o });
/* A bond from c to a labeled group at angle deg, plus the group. */
function arm(c, lc, deg, len, l, o = {}) {
  const e = at(c, deg, len);
  const opts = { rFrom: lc === '' ? 0 : rOf(lc), rTo: rOf(l) };
  const s = o.kind === 'wedge' ? wedge(c, e, { ...opts, width: 9 })
          : o.kind === 'hash' ? hash(c, e, { ...opts, width: 10, rungs: 5 })
          : bond(c, e, opts);
  return s + A(e, l, o.atomKind);
}
/* Charges and partial charges, at the label size. */
const q = (x, y, s, cls) => `<text class="fg-lbl ${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="middle">${s}</text>`;
const plus = (x, y) => q(x, y, '+', 'fg-warn');
const minus = (x, y) => q(x, y, '−', 'fg-hi');
const dP = (x, y, s = 'δ+') => q(x, y, s, 'fg-warn');
const dM = (x, y) => q(x, y, 'δ−', 'fg-hi');
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const tg = (x, y, s, kind = '', anchor = 'middle') =>
  text(x, y, s, { cls: kind ? `fg-tag-${kind}` : 'fg-tag', size: 11, anchor });
/* A curved arrow that starts on the middle of bond a–b, pushed `off` px to
   the left of the direction a→b (negative: right), and ends at e. */
function fromBond(a, b, e, bow, off = 6) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  return curve(P(m.x + (dy / L) * off, m.y - (dx / L) * off), e, { bow, size: 7 });
}
/* A resonance arrow, drawn vertically between two stacked panels. */
function resArrowV(x, y1, y2) {
  const m = P(x, (y1 + y2) / 2);
  return arrow(m, P(x, y2), { size: 8 }) + arrow(m, P(x, y1), { size: 8 });
}
/* An sp² center seen edge-on: two groups left and right in the plane, and
   the empty p orbital standing above and below. */
function edgeOnEmpty(c, l, gl, gr, { off = 26, ry = 14, rx = 11, len = 52, kind = 'warn' } = {}) {
  let s = '';
  s += lobeE(c.x, c.y - off, rx, ry);
  s += lobeE(c.x, c.y + off, rx, ry);
  s += arm(c, l, 180, len, gl) + arm(c, l, 0, len, gr);
  s += A(c, l, kind);
  return s;
}

/* ================================================================ 1 ===
   The opening example: ammonia and chloromethane. One rich atom, one poor
   atom, and the arrow between them. */
FIGURES.push({
  id: 'rp-first-look',
  section: 'electron-rich-poor',
  lessons: ['electron-rich-poor'],
  anchor: '',
  alt: 'Two stacked panels. Top: ammonia, a nitrogen with three hydrogens and one lone pair, beside chloromethane, a carbon with three hydrogens and a chlorine. The nitrogen is on a teal disc and labeled rich, lone pair. The carbon is on a coral disc, marked delta plus and labeled poor; the chlorine is marked delta minus. A curved arrow runs from the nitrogen lone pair to the carbon, and a second curved arrow moves the C–Cl bond pair onto chlorine. Bottom: the products, the methylammonium ion, CH3–NH3 with a plus charge on nitrogen, and chloride ion with four lone pairs and a minus charge.',
  viewBox: '0 0 340 366',
  build() {
    let s = '';
    s += tg(170, 20, 'AMMONIA MEETS CHLOROMETHANE');
    const n = P(72, 112), c = P(196, 112), cl = P(270, 112);
    s += arm(n, 'N', 180, 44, 'H') + arm(n, 'N', 118, 44, 'H') + arm(n, 'N', 242, 44, 'H');
    s += A(n, 'N', 'hi') + lp(n, 0);
    s += arm(c, 'C', 90, 44, 'H') + arm(c, 'C', 235, 44, 'H', { kind: 'wedge' }) + arm(c, 'C', 305, 44, 'H', { kind: 'hash' });
    s += B(c, 'C', cl, 'Cl') + A(cl, 'Cl', 'hi') + A(c, 'C', 'warn');
    s += lp(cl, 0) + lp(cl, 270) + lp(cl, 90);
    s += dP(220, 88) + dM(cl.x + 28, 84);
    s += curve(P(100, 106), P(177, 104), { bow: -18, size: 7 });
    s += fromBond(c, cl, P(252, 96), -10, 5);
    s += tg(66, 176, 'rich: lone pair');
    s += tg(196, 190, 'poor: δ+ carbon', 'warn');
    s += tg(292, 176, 'leaves as Cl⁻', 'mut');
    s += rule(16, 208, 324, 208);

    s += tg(170, 232, 'PRODUCTS');
    const m = P(46, 290), n2 = P(114, 290);
    s += B(m, 'CH₃', n2, 'N') + A(m, 'CH₃');
    s += arm(n2, 'N', 90, 38, 'H') + arm(n2, 'N', 0, 42, 'H') + arm(n2, 'N', 270, 38, 'H');
    s += A(n2, 'N', 'hi') + plus(138, 272);
    s += lbl(196, 295, '+');
    const cl2 = P(262, 290);
    s += A(cl2, 'Cl', 'hi') + lp(cl2, 0) + lp(cl2, 90) + lp(cl2, 180) + lp(cl2, 270) + minus(290, 266);
    s += tg(96, 354, 'methylammonium ion') + tg(262, 354, 'chloride ion');
    return s;
  },
  caption: 'Follow the first arrow from nitrogen’s lone pair to the δ+ carbon. That arrow is the whole prediction.',
});

/* ================================================================ 2 ===
   The six signs, three of each kind, each on a real molecule. */
FIGURES.push({
  id: 'rp-signs',
  section: 'electron-rich-poor',
  lessons: ['electron-rich-poor'],
  anchor: '',
  alt: 'A grid of six small drawings in two columns. Left column, electron-rich: water, whose oxygen carries two lone pairs; hydroxide ion, H–O with three lone pairs and a minus charge; ethene, with its pi bond highlighted. Right column, electron-poor: chloromethane written H3C–Cl, with the carbon marked delta plus and the chlorine delta minus; the tert-butyl cation seen edge-on, a carbon with a plus charge, a methyl group left and right and an empty p orbital drawn as pale lobes above and below; boron trifluoride seen edge-on, a boron with a fluorine left and right and an empty p orbital above and below, with no charge.',
  viewBox: '0 0 340 440',
  build() {
    let s = '';
    s += tg(84, 20, 'ELECTRON-RICH') + tg(256, 20, 'ELECTRON-POOR', 'warn');
    s += `<line class="fg-rule" x1="170" y1="32" x2="170" y2="430"></line>`;
    s += rule(8, 164, 332, 164) + rule(8, 300, 332, 300);

    // ---- row 1 ----
    const o = P(84, 84);
    s += arm(o, 'O', 215, 40, 'H') + arm(o, 'O', 325, 40, 'H');
    s += A(o, 'O', 'hi') + lp(o, 55) + lp(o, 125);
    s += tg(84, 140, 'lone pairs', 'mut') + tg(84, 154, 'water');
    const me = P(222, 92), cl = P(290, 92);
    s += B(me, 'H₃C', cl, 'Cl') + A(me, 'H₃C', 'warn') + A(cl, 'Cl', 'hi');
    s += dP(me.x, 62) + dM(cl.x, 62);
    s += tg(256, 140, 'δ+ carbon', 'mut') + tg(256, 154, 'chloromethane', 'warn');

    // ---- row 2 ----
    const h = P(62, 232), o2 = P(108, 232);
    s += B(h, 'H', o2, 'O') + A(h, 'H') + A(o2, 'O', 'hi');
    s += lp(o2, 90) + lp(o2, 0) + lp(o2, 270) + minus(134, 208);
    s += tg(84, 276, 'negative charge', 'mut') + tg(84, 290, 'hydroxide ion');
    const c = P(256, 222);
    s += edgeOnEmpty(c, 'C', 'H₃C', 'CH₃', { len: 52 });
    s += plus(280, 206);
    s += tg(256, 276, '+ and an empty p orbital', 'mut') + `<text class="fg-tag-warn" x="256" y="290" text-anchor="middle" font-size="11"><tspan font-style="italic">tert</tspan>-butyl cation</text>`;

    // ---- row 3 ----
    const c1 = P(62, 360), c2 = P(108, 360);
    s += B(c1, 'C', c2, 'C');
    s += bond(P(c1.x, c1.y - 7), P(c2.x, c2.y - 7), { rFrom: 13, rTo: 13, cls: 'fg-bond-hi' });
    s += arm(c1, 'C', 145, 32, 'H') + arm(c1, 'C', 215, 32, 'H') + arm(c2, 'C', 35, 32, 'H') + arm(c2, 'C', 325, 32, 'H');
    s += A(c1, 'C') + A(c2, 'C');
    s += tg(85, 336, 'π', 'good');
    s += tg(84, 412, 'π bond', 'mut') + tg(84, 426, 'ethene');
    const b = P(256, 358);
    s += edgeOnEmpty(b, 'B', 'F', 'F', { len: 50 });
    s += tg(256, 412, 'empty p orbital', 'mut') + tg(256, 426, 'BF₃, no charge', 'warn');
    return s;
  },
  caption: 'Left, the three signs of an electron-rich site; right, the three signs of an electron-poor one. The pale lobes are empty p orbitals.',
  note: 'In the edge-on drawings, the third group on the carbon or boron points toward you, and all three lie in one flat plane with the empty orbital at right angles to it.',
});

/* ================================================================ 3 ===
   The second question: δ+ is not enough; the carbon needs a way to take a
   new pair. */
FIGURES.push({
  id: 'rp-exit',
  section: 'electron-rich-poor',
  lessons: ['electron-rich-poor'],
  anchor: '',
  alt: 'Three stacked panels. Chloroethane, CH3–CH2–Cl: the CH2 carbon is delta plus and the chlorine delta minus; verdict, chlorine can leave as chloride, so this carbon is a site. Ethanol, CH3–CH2–O–H: the CH2 carbon is delta plus and the oxygen, with two lone pairs, delta minus; verdict, hydroxide does not leave, so this carbon is not a site. Acetaldehyde, CH3–CH=O: the carbonyl carbon is delta plus and the oxygen delta minus; a curved arrow shows the C=O pi pair moving onto oxygen; verdict, the pi pair can shift onto oxygen, so this carbon is a site.',
  viewBox: '0 0 340 420',
  build() {
    let s = '';
    // ---- chloroethane ----
    s += tg(170, 20, 'CHLOROETHANE');
    const a1 = P(84, 72), a2 = P(160, 72), a3 = P(236, 72);
    s += B(a1, 'CH₃', a2, 'CH₂') + B(a2, 'CH₂', a3, 'Cl');
    s += A(a1, 'CH₃') + A(a2, 'CH₂', 'warn') + A(a3, 'Cl', 'hi');
    s += dP(a2.x, 44) + dM(a3.x, 44);
    s += tg(170, 112, 'δ+, and Cl can leave as Cl⁻: a site', 'good');
    s += rule(16, 128, 324, 128);

    // ---- ethanol ----
    s += tg(170, 150, 'ETHANOL');
    const b1 = P(66, 206), b2 = P(140, 206), b3 = P(214, 206), b4 = P(270, 206);
    s += B(b1, 'CH₃', b2, 'CH₂') + B(b2, 'CH₂', b3, 'O') + B(b3, 'O', b4, 'H');
    s += A(b1, 'CH₃') + A(b2, 'CH₂', 'warn') + A(b3, 'O', 'hi') + A(b4, 'H');
    s += lp(b3, 90) + lp(b3, 270);
    s += dP(b2.x, 178) + dM(240, 184);
    s += tg(170, 256, 'δ+, but HO⁻ does not leave: not a site', 'warn');
    s += rule(16, 272, 324, 272);

    // ---- acetaldehyde ----
    s += tg(170, 294, 'ACETALDEHYDE');
    const c = P(170, 384), o = P(170, 318), m = P(100, 384), hh = P(232, 384);
    s += B(m, 'CH₃', c, 'C') + B(c, 'C', hh, 'H');
    s += B(c, 'C', o, 'O', { order: 2 });
    s += A(m, 'CH₃') + A(hh, 'H') + A(o, 'O', 'hi') + A(c, 'C', 'warn');
    s += lp(o, 140) + lp(o, 40);
    s += dP(150, 412) + dM(o.x - 36, o.y + 12);
    s += fromBond(c, o, P(o.x + 20, o.y + 12), -16, -14);
    s += tg(282, 346, 'a site: the π', 'good') + tg(282, 360, 'pair can shift', 'good') + tg(282, 374, 'onto O', 'good');
    return s;
  },
  caption: 'All three carbons are δ+. Only the top and bottom ones have a way to take a new pair.',
});

/* The ether-chloride chain, shared by the notes scan and the lesson's
   final question. Returns the ink and the atom positions. */
function etherChain(y0, marked) {
  let s = '';
  const up = y0 - 30;
  const pts = [P(40, y0), P(92, up), P(144, y0), P(196, up), P(248, y0), P(300, up)];
  const L = ['CH₃', 'CH₂', 'O', 'CH₂', 'CH₂', 'Cl'];
  for (let i = 0; i < 5; i++) s += B(pts[i], L[i], pts[i + 1], L[i + 1]);
  const kinds = marked ? ['plain', 'plain', 'hi', 'plain', 'warn', 'hi'] : L.map(() => 'plain');
  pts.forEach((p, i) => { s += A(p, L[i], kinds[i]); });
  s += lp(pts[2], 235) + lp(pts[2], 305);
  s += lp(pts[5], 90) + lp(pts[5], 0) + lp(pts[5], 315);
  return { s, pts };
}

/* ================================================================ 4 ===
   Worked example 1: the ether chloride, scanned atom by atom. */
FIGURES.push({
  id: 'rp-ether-scan',
  section: 'electron-rich-poor',
  anchor: '',
  alt: 'The chain CH3–CH2–O–CH2–CH2–Cl drawn as a zigzag of labeled groups, with two lone pairs on oxygen and three on chlorine. Both CH2 groups bonded to oxygen are marked delta plus; the oxygen is on a teal disc and marked delta minus. The CH2 bonded to chlorine is on a coral disc and marked delta plus, and the chlorine is marked delta minus. A list below gives the verdict on each part: the CH3 is bonded to carbon and hydrogen only; the oxygen has lone pairs and is electron-rich; the two CH2 groups next to oxygen are delta plus but have no leaving group; the CH2 next to chlorine is delta plus and chloride can leave, so it is the site of attack.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    s += tg(170, 20, 'WHERE DOES A NUCLEOPHILE ATTACK?');
    const { s: ink, pts } = etherChain(130, true);
    s += ink;
    s += dP(pts[1].x, 64) + dP(pts[3].x, 64) + dP(pts[4].x, 168) + dM(pts[5].x - 24, 62);
    s += dM(pts[2].x, 172);
    s += rule(16, 190, 324, 190);
    s += tg(20, 212, 'CH₃: bonded to C and H only', 'mut', 'start');
    s += tg(20, 232, 'O: lone pairs, so electron-rich', '', 'start');
    s += tg(20, 252, 'CH₂ next to O (both): δ+, no exit', 'mut', 'start');
    s += tg(20, 272, 'CH₂ next to Cl: δ+, and Cl⁻ can leave', 'warn', 'start');
    s += tg(20, 290, '→ the site of attack', 'warn', 'start');
    return s;
  },
  caption: 'Three carbons are δ+. The coral one is the only δ+ carbon holding a group that can leave.',
});

/* The same chain, unmarked, for the lesson's final question. */
FIGURES.push({
  id: 'l-rp-ether-plain',
  lessons: ['electron-rich-poor'],
  anchor: '',
  alt: 'The chain CH3–CH2–O–CH2–CH2–Cl drawn as a zigzag of labeled groups, with two lone pairs on the oxygen and three on the chlorine, and no other marks.',
  viewBox: '0 0 340 150',
  build() {
    let s = '';
    s += etherChain(88, false).s;
    s += tg(170, 140, '1-chloro-2-ethoxyethane', 'mut');
    return s;
  },
  caption: 'Scan every carbon before you answer.',
});

/* ================================================================ 5 ===
   Worked example 2: an amino ketone. The nitrogen reaches the carbonyl
   carbon, and the new bond closes a five-membered ring. */
function curledChain(cx, cy, closed) {
  let s = '';
  // Pentagon: v0 top = C2, v1 upper-left = N, v2 lower-left = C5,
  // v3 lower-right = C4, v4 upper-right = C3.
  const v = polyPts(cx, cy, 5, 64, 90);
  const c2 = v[0], n = v[1], c5 = v[2], c4 = v[3], c3 = v[4];
  s += B(n, 'N', c5, '') + sk(c5, c4) + sk(c4, c3) + B(c3, '', c2, 'C');
  const o = at(c2, 125, 50), me = at(c2, 55, 50);
  s += B(c2, 'C', me, 'CH₃') + A(me, 'CH₃');
  s += arm(n, 'N', 200, 40, 'H') + arm(n, 'N', 250, 40, 'H');
  if (closed) {
    s += B(n, 'N', c2, 'C', { cls: 'fg-bond-hi' });
    s += B(c2, 'C', o, 'O') + A(o, 'O', 'hi');
    s += lp(o, 35) + lp(o, 125) + lp(o, 215) + minus(o.x + 4, o.y - 28);
    s += A(n, 'N', 'hi') + plus(n.x - 22, n.y - 18);
    s += A(c2, 'C');
  } else {
    s += B(c2, 'C', o, 'O', { order: 2 }) + A(o, 'O', 'hi');
    s += lp(o, 170) + lp(o, 80);
    s += A(n, 'N', 'hi') + lp(n, 36);
    s += A(c2, 'C', 'warn');
  }
  const loc = (p, t) => tg(p.x + (p.x - cx) * 0.3, p.y + (p.y - cy) * 0.3 + 4, t, 'mut');
  s += loc(c3, '3') + loc(c4, '4') + loc(c5, '5');
  s += tg(c2.x + 4, c2.y + 34, '2', 'mut');
  return { s, c2, n, o, me };
}
FIGURES.push({
  id: 'rp-amino-scan',
  section: 'electron-rich-poor',
  lessons: ['electron-rich-poor'],
  anchor: '',
  alt: 'Two stacked panels. Top: 5-aminopentan-2-one drawn with its chain curled round, so that the nitrogen at C5 sits near the carbonyl carbon, C2. The nitrogen carries two hydrogens and a lone pair and is on a teal disc labeled rich. The carbonyl carbon is on a coral disc, marked delta plus and labeled poor, with a C=O double bond to an oxygen carrying two lone pairs. One curved arrow runs from the nitrogen lone pair to the carbonyl carbon; a second moves the C=O pi pair onto oxygen. Bottom: the result, a five-membered ring of N, C5, C4, C3 and C2. The new N–C2 bond is highlighted, the nitrogen carries a plus charge and two hydrogens, and the oxygen, now single-bonded, carries three lone pairs and a minus charge.',
  viewBox: '0 0 340 516',
  build() {
    let s = '';
    s += tg(170, 20, '5-AMINOPENTAN-2-ONE');
    const a = curledChain(170, 160, false);
    s += a.s;
    s += curve(P(a.n.x + 24, a.n.y - 20), P(a.c2.x - 16, a.c2.y + 8), { bow: 12, size: 7 });
    s += fromBond(a.c2, a.o, P(a.o.x + 17, a.o.y + 6), -10, -6);
    s += dP(a.c2.x + 30, a.c2.y - 4);
    s += tg(50, 84, 'rich:') + tg(50, 98, 'lone pair');
    s += tg(290, 76, 'poor: δ+', 'warn') + tg(290, 90, 'C=O carbon', 'warn');
    s += rule(16, 250, 324, 250);

    s += tg(170, 274, 'THE NEW N–C BOND CLOSES A RING');
    const b = curledChain(170, 426, true);
    s += b.s;
    s += tg(296, 450, 'five atoms:', 'mut') + tg(296, 466, 'N, C5, C4,', 'mut') + tg(296, 482, 'C3, C2', 'mut');
    return s;
  },
  caption: 'The chain curls round so that nitrogen’s lone pair reaches the δ+ carbonyl carbon. The highlighted bond is the one that forms.',
  note: 'The ring shown is only the first step. What the ring goes on to become is a question for Carbonyl Chemistry.',
});

/* ================================================================ 6 ===
   Induction fading along a chain. */
FIGURES.push({
  id: 'rp-induction',
  section: 'electron-rich-poor',
  lessons: ['electron-rich-poor'],
  anchor: '',
  alt: '1-Chloropropane written Cl–CH2–CH2–CH3 in a row. The chlorine is marked delta minus. The CH2 bonded to chlorine is marked delta plus, the next CH2 delta-delta plus, and the CH3 delta-delta-delta plus, each fainter than the last. An arrow under the chain points from the CH3 end toward chlorine, labeled pull through sigma bonds, and a note says it fades within two or three bonds.',
  viewBox: '0 0 340 170',
  build() {
    let s = '';
    s += tg(170, 20, 'INDUCTION IN 1-CHLOROPROPANE');
    const pts = [P(40, 80), P(126, 80), P(212, 80), P(298, 80)];
    const L = ['Cl', 'CH₂', 'CH₂', 'CH₃'];
    for (let i = 0; i < 3; i++) s += B(pts[i], L[i], pts[i + 1], L[i + 1]);
    s += A(pts[0], 'Cl', 'hi') + A(pts[1], 'CH₂', 'warn') + A(pts[2], 'CH₂') + A(pts[3], 'CH₃');
    s += dM(pts[0].x, 52);
    s += dP(pts[1].x, 50);
    s += `<g opacity="0.6">${dP(pts[2].x, 50, 'δδ+')}</g>`;
    s += `<g opacity="0.35">${dP(pts[3].x, 50, 'δδδ+')}</g>`;
    s += arrow(P(300, 118), P(46, 118), { muted: true });
    s += tg(170, 140, 'pull through σ bonds', 'mut');
    s += tg(170, 158, 'fades within two or three bonds', 'mut');
    return s;
  },
  caption: 'Each extra δ means a smaller partial charge: δδ+ is less than δ+, and δδδ+ is less again.',
});

/* ================================================================ 7 ===
   Resonance reaching the β carbon of propenal. */
function enal(y, contributor) {
  let s = '';
  const b = P(70, y), a = P(122, y - 30), c1 = P(174, y), o = P(226, y - 30);
  if (contributor) {
    s += sk(b, a) + ringDouble(a, c1, P(148, y + 30), { inset: 7 });
    s += B(c1, '', o, 'O') + A(o, 'O', 'hi');
    s += lp(o, 90) + lp(o, 0) + lp(o, 300) + minus(o.x + 24, o.y - 18);
    s += A(b, '', 'point') + `<circle class="fg-atom-warn" cx="${b.x}" cy="${b.y}" r="7"></circle>`;
    s += plus(b.x - 16, b.y - 12);
  } else {
    s += ringDouble(b, a, P(96, y + 30), { inset: 7 }) + sk(a, c1);
    s += B(c1, '', o, 'O', { order: 2 }) + A(o, 'O', 'hi');
    s += lp(o, 90) + lp(o, 0);
    s += fromBond(b, a, P(148, y - 22), -14, 7);
    s += fromBond(c1, o, P(o.x + 4, o.y + 20), 10, -7);
  }
  s += lbl(b.x, b.y + 24, 'β') + lbl(a.x, a.y - 14, 'α');
  s += tg(c1.x + 6, c1.y + 22, 'C1', 'mut');
  return s;
}
FIGURES.push({
  id: 'rp-enal',
  section: 'electron-rich-poor',
  lessons: ['electron-rich-poor'],
  anchor: '',
  alt: 'Propenal, H2C=CH–CHO, drawn skeletally with the carbon next to the carbonyl carbon labeled alpha and the far carbon of the C=C labeled beta. Two curved arrows: the C=C pi pair moves toward the bond between alpha carbon and carbonyl carbon, and the C=O pi pair moves onto oxygen. A double-headed resonance arrow leads down to the second structure, in which the double bond now joins alpha carbon and carbonyl carbon, oxygen carries three lone pairs and a minus charge, and the beta carbon, on a coral dot, carries a plus charge.',
  viewBox: '0 0 340 290',
  build() {
    let s = '';
    s += tg(170, 20, 'PROPENAL');
    s += enal(98, false);
    s += tg(290, 90, 'push the', 'mut') + tg(290, 104, 'π pairs', 'mut');
    s += resArrowV(170, 138, 176);
    s += enal(240, true);
    s += tg(290, 216, '+ lands on', 'warn') + tg(290, 230, 'the β carbon', 'warn');
    return s;
  },
  caption: 'The + in the lower structure sits on the β carbon, three bonds from the oxygen.',
});

/* ================================================================ 8 ===
   Aniline: induction pulls out a little, resonance pushes in a lot. */
function anilineRing(cx, cy, contributor) {
  let s = '';
  const v = polyPts(cx, cy, 6, 38, 90);   // v0 top (ipso), v1 upper-left (ortho) ...
  const n = P(cx, cy - 38 - 50);
  if (!contributor) {
    s += benzene(cx, cy, 38, { shift: 0 }).svg;
    s += B(v[0], '', n, 'N');
  } else {
    s += bond(v[0], v[1], { rFrom: 0, rTo: 0 });
    s += bond(v[1], v[2], { rFrom: 0, rTo: 0 });
    s += ringDouble(v[2], v[3], P(cx, cy), { inset: 7 });
    s += bond(v[3], v[4], { rFrom: 0, rTo: 0 });
    s += ringDouble(v[4], v[5], P(cx, cy), { inset: 7 });
    s += bond(v[5], v[0], { rFrom: 0, rTo: 0 });
    s += B(v[0], '', n, 'N', { order: 2 });
  }
  s += arm(n, 'N', 150, 40, 'H') + arm(n, 'N', 30, 40, 'H');
  s += A(n, 'N', 'hi');
  return { s, v, n };
}
FIGURES.push({
  id: 'rp-aniline',
  section: 'electron-rich-poor',
  anchor: '',
  alt: 'Two stacked panels. Top: aniline, a benzene ring with an NH2 group on the top carbon. The nitrogen has a lone pair. One curved arrow moves the lone pair into the bond between nitrogen and the ring; a second moves the pi pair of the ring double bond onto the neighboring ring carbon, the ortho carbon. Bottom: the resulting resonance structure, with a C=N double bond, a plus charge on nitrogen, and a lone pair and a minus charge on the ortho ring carbon, which is on a teal dot and labeled electron-rich.',
  viewBox: '0 0 340 424',
  build() {
    let s = '';
    s += tg(170, 20, 'ANILINE');
    const a = anilineRing(150, 150, false);
    s += a.s + lp(a.n, 0);
    s += curve(P(a.n.x + 26, a.n.y + 6), P(a.n.x + 6, a.n.y + 30), { bow: -12, size: 7 });
    s += fromBond(a.v[0], a.v[1], P(a.v[1].x - 7, a.v[1].y - 9), 12, 7);
    s += tg(270, 70, 'lone pair', '', 'middle') + tg(270, 84, 'pushes in', '', 'middle');
    s += tg(262, 132, 'N also pulls a', 'mut') + tg(262, 146, 'little through σ', 'mut');
    s += resArrowV(150, 194, 228);

    const b = anilineRing(150, 370, true);
    s += b.s + plus(b.n.x, b.n.y - 24);
    s += `<circle class="fg-atom-hi" cx="${r2(b.v[1].x)}" cy="${r2(b.v[1].y)}" r="7"></circle>`;
    s += lp(b.v[1], 150, 16) + minus(b.v[1].x - 24, b.v[1].y + 20);
    s += `<text class="fg-tag" x="270" y="360" text-anchor="middle" font-size="11"><tspan font-style="italic">ortho</tspan> carbon:</text>` + tg(270, 374, 'electron-rich', '');
    return s;
  },
  caption: 'The lower structure puts a − on a ring carbon next to the one carrying nitrogen. That is the ring gaining density.',
});

/* ================================================================ 9 ===
   Lesson question: cyclohexenone, with its carbons numbered. */
FIGURES.push({
  id: 'l-rp-cyclohexenone',
  lessons: ['electron-rich-poor'],
  anchor: '',
  alt: 'Cyclohex-2-en-1-one drawn skeletally: a six-membered ring with a C=O on the top carbon, C1, and a C=C between C2 and C3. The ring carbons are numbered 1 to 6.',
  viewBox: '0 0 340 230',
  build() {
    let s = '';
    const cx = 170, cy = 136;
    const v = polyPts(cx, cy, 6, 44, 90);   // v0 top = C1, then C2 upper-left, C3 lower-left ...
    for (let i = 0; i < 6; i++) {
      const a = v[i], b2 = v[(i + 1) % 6];
      s += (i === 1) ? ringDouble(a, b2, P(cx, cy), { inset: 7 }) : sk(a, b2);
    }
    const o = P(cx, cy - 44 - 50);
    s += B(v[0], '', o, 'O', { order: 2 }) + A(o, 'O') + lp(o, 150) + lp(o, 30);
    const loc = (p, t) => tg(p.x + (p.x - cx) * 0.42, p.y + (p.y - cy) * 0.42 + 4, t, 'mut');
    s += tg(v[0].x + 16, v[0].y + 14, '1', 'mut');
    for (let i = 1; i < 6; i++) s += loc(v[i], String(i + 1));
    s += tg(170, 222, 'cyclohex-2-en-1-one', 'mut');
    return s;
  },
  caption: 'Push the π pairs as you did for propenal.',
});

export default FIGURES;
