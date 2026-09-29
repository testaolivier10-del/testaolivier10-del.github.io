/* Figures for the hofmann-elimination notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure that a lesson step shows is 340 wide, stacked vertically, and
   uses only fg-lbl and fg-tag text, so one drawing serves both pages. */
import { atom, bond, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { sk, polyPts, benzene } from '../lib/ochem-skeletal.mjs';
import { skDouble } from '../lib/ochem-helpers.mjs';

const TOPIC = 'hofmann-elimination';
const mid = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2);
const lbl = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-lbl', size: 13, ...o });
const tg = (x, y, s, cls = 'fg-tag', o = {}) => text(x, y, s, { cls, size: 11, ...o });

/* A skeletal chain through the given vertices. */
const chain = (pts, hi = []) => pts.slice(1).map((p, i) => sk(pts[i], p, hi.includes(i))).join('');

/* A nitrogen drawn as a labelled atom with skeletal methyl sticks. `plus`
   places the + charge. */
function nitrogen(n, sticks, opts = {}) {
  let s = '';
  for (const e of sticks) s += bond(n, e, { rFrom: 15, rTo: 0 });
  s += atom(n.x, n.y, opts.label || 'N', { kind: opts.kind || 'warn' });
  if (opts.plus) s += lbl(opts.plus.x, opts.plus.y, '+');
  return s;
}

/* A Newman projection. Angles are degrees clockwise from straight up. Front
   bonds run from the centre to the rim; back bonds stick out from the rim.
   `hi` lists the angles whose bond is drawn highlighted. */
function newman(cx, cy, r, front, back, hi = []) {
  const at = (a, R) => P(cx + R * Math.sin(a * Math.PI / 180), cy - R * Math.cos(a * Math.PI / 180));
  let s = '';
  for (const [a, lab, dy = 0] of back) {
    const p1 = at(a, r), p2 = at(a, r + 20), p3 = at(a, r + 34);
    s += bond(p1, p2, { rFrom: 0, rTo: 0, cls: hi.includes('b' + a) ? 'fg-bond-hi' : 'fg-bond' });
    s += lbl(p3.x, p3.y + 4.5 + dy, lab);
  }
  s += `<circle class="fg-atom" cx="${cx}" cy="${cy}" r="${r}"></circle>`;
  for (const [a, lab] of front) {
    const p2 = at(a, r - 2), p3 = at(a, r + 15);
    s += bond(P(cx, cy), p2, { rFrom: 0, rTo: 0, cls: hi.includes('f' + a) ? 'fg-bond-hi' : 'fg-bond' });
    s += lbl(p3.x, p3.y + 4.5, lab);
  }
  s += `<circle class="fg-lp-mut" cx="${cx}" cy="${cy}" r="3.5"></circle>`;
  return s;
}

const FIGURES = [];

/* ------------------------------------------------------------------------
   The E2 step itself: three curved arrows on the salt from butan-2-amine,
   then the three products. */
FIGURES.push({
  id: 'hofmann-mechanism',
  section: TOPIC,
  lessons: [TOPIC],
  anchor: '<!-- fig:hofmann-mechanism:start -->',
  viewBox: '0 0 340 470',
  alt: 'The E2 step of a Hofmann elimination. Hydroxide uses a lone pair to take a hydrogen from C1 of the sec-butyltrimethylammonium ion, the C–H bonding pair becomes the C1=C2 pi bond, and the C2–N bond breaks with its pair going to nitrogen. The products are but-1-ene, water and neutral trimethylamine.',
  build() {
    let s = panel(0, 0, 340, 300);
    s += tg(170, 22, '1 · one step, three curved arrows');
    const C1 = P(104, 186), C2 = P(166, 152), C3 = P(228, 186), C4 = P(290, 152);
    s += chain([C1, C2, C3, C4]);
    const N = P(166, 92);
    s += bond(C2, N, { rFrom: 0, rTo: 16 });
    s += nitrogen(N, [P(130, 74), P(202, 74), P(166, 54)], { plus: P(146, 120) });
    const H = P(78, 234);
    s += bond(C1, H, { rFrom: 0, rTo: 11 });
    s += atom(H.x, H.y, 'H', { r: 11 });
    s += tg(90, 170, 'β');
    s += tg(166, 180, 'α');
    // hydroxide, with the lone pair that attacks
    s += lbl(40, 296, 'HO⁻');
    s += lonePair(40, 290, -90, { dist: 16 });
    s += curve(P(46, 270), P(68, 244), { bow: 12 });
    s += curve(mid(C1, H), mid(C1, C2), { bow: 22 });
    s += curve(P(172, 140), P(180, 108), { bow: 10 });
    s += tg(262, 222, 'all three arrows', 'fg-tag-warn');
    s += tg(262, 238, 'move at once', 'fg-tag-warn');
    s += arrow(P(170, 304), P(170, 338));
    s += panel(0, 342, 340, 128, { kind: 'good' });
    s += tg(170, 364, '2 · the products');
    const a = P(34, 420), b = P(72, 398), c = P(110, 420), d = P(148, 398);
    s += bond(a, b, { order: 2, rFrom: 0, rTo: 0 }) + sk(b, c) + sk(c, d);
    s += tg(91, 452, 'but-1-ene', 'fg-tag-good');
    s += lbl(208, 414, '+ H₂O');
    s += lbl(284, 414, '+ N(CH₃)₃');
    s += tg(288, 436, 'neutral', 'fg-tag-good');
    return s;
  },
  caption: 'Hydroxide pulls the hydrogen off C1, and the nitrogen leaves C2 as a neutral molecule.',
});

/* ------------------------------------------------------------------------
   The two beta carbons of the salt from butan-2-amine, and the alkene each
   one gives. */
FIGURES.push({
  id: 'hofmann-picks-the-open-side',
  section: TOPIC,
  lessons: [TOPIC],
  anchor: '<!-- fig:hofmann-picks-the-open-side:start -->',
  viewBox: '0 0 340 392',
  alt: 'The sec-butyltrimethylammonium ion with its two beta carbons labeled: C1, a CH3 with three hydrogens, and C3, a CH2 with two. Losing a hydrogen from C1 gives but-1-ene, the major product. Losing one from C3 gives but-2-ene, the minor product, although it is the more stable alkene.',
  build() {
    let s = panel(0, 0, 340, 196);
    s += tg(170, 20, 'the salt from butan-2-amine');
    const C1 = P(80, 146), C2 = P(140, 116), C3 = P(200, 146), C4 = P(260, 116);
    s += chain([C1, C2, C3, C4]);
    const N = P(140, 66);
    s += bond(C2, N, { rFrom: 0, rTo: 16 });
    s += nitrogen(N, [P(106, 50), P(174, 50)], { plus: P(158, 90) });
    s += bond(N, P(140, 34), { rFrom: 16, rTo: 0 });
    s += tg(80, 172, 'β · C1 · 3 H', 'fg-tag-good');
    s += tg(200, 172, 'β · C3 · 2 H');
    s += tg(272, 102, 'C4');
    s += tg(114, 104, 'C2');
    s += arrow(P(120, 200), P(92, 228));
    s += arrow(P(220, 200), P(248, 228));
    s += tg(56, 214, 'H from C1');
    s += tg(290, 214, 'H from C3');
    s += panel(0, 234, 164, 158, { kind: 'good' });
    const a = P(26, 316), b = P(62, 294), c = P(98, 316), d = P(134, 294);
    s += bond(a, b, { order: 2, rFrom: 0, rTo: 0 }) + sk(b, c) + sk(c, d);
    s += tg(82, 348, 'but-1-ene', 'fg-tag-good');
    s += tg(82, 366, 'major', 'fg-tag-good');
    s += panel(176, 234, 164, 158);
    const e = P(200, 316), f = P(236, 294), g = P(272, 316), h = P(308, 294);
    s += sk(e, f) + skDouble(f, g, P(254, 340)) + sk(g, h);
    s += tg(258, 348, 'but-2-ene');
    s += tg(258, 366, 'minor, more stable');
    return s;
  },
  caption: 'C1 and C3 both sit next to C2, the carbon that carries the nitrogen.',
});

/* ------------------------------------------------------------------------
   Why C3 loses: the anti-periplanar conformation for a C3 hydrogen forces
   C4 gauche to the trimethylammonium group. For C1 nothing is squeezed. */
FIGURES.push({
  id: 'hofmann-two-newmans',
  section: TOPIC,
  lessons: [TOPIC],
  anchor: '<!-- fig:hofmann-two-newmans:start -->',
  viewBox: '0 0 340 500',
  alt: 'Two Newman projections of the sec-butyltrimethylammonium ion, each with a beta hydrogen anti-periplanar to the nitrogen. Looking down C1 to C2, the front carbon carries only hydrogens, so nothing crowds the trimethylammonium group. Looking down C3 to C2, the front carbon carries a methyl group, C4, which has to sit gauche, 60 degrees, from the trimethylammonium group.',
  build() {
    let s = panel(0, 0, 340, 244, { kind: 'good' });
    s += tg(170, 20, '1 · down the C1–C2 bond (C1 in front)');
    s += newman(150, 122, 42,
      [[0, 'H'], [120, 'H'], [240, 'H']],
      [[180, 'N⁺(CH₃)₃'], [60, 'CH₂CH₃'], [300, 'H']],
      ['f0', 'b180']);
    s += tg(290, 150, 'H and N', 'fg-tag-good');
    s += tg(290, 166, 'anti, 180°', 'fg-tag-good');
    s += tg(170, 232, 'C1 holds only H: nothing is squeezed', 'fg-tag-good');
    s += panel(0, 256, 340, 244, { kind: 'warn' });
    s += tg(170, 276, '2 · down the C3–C2 bond (C3 in front)');
    s += newman(150, 378, 42,
      [[0, 'H'], [120, 'CH₃'], [240, 'H']],
      [[180, 'N⁺(CH₃)₃'], [60, 'H'], [300, 'CH₃']],
      ['f0', 'b180']);
    s += tg(274, 420, 'CH₃ gauche', 'fg-tag-warn');
    s += tg(274, 436, 'to N, 60°', 'fg-tag-warn');
    s += tg(170, 488, 'the front CH₃ (C4) is squeezed', 'fg-tag-warn');
    return s;
  },
  caption: 'In both views the hydrogen that leaves (top, front carbon) points opposite the nitrogen (bottom, back carbon).',
});

/* ------------------------------------------------------------------------
   The exception: a benzylic beta hydrogen wins over the open CH3. */
FIGURES.push({
  id: 'hofmann-conjugated-exception',
  section: TOPIC,
  anchor: '<!-- fig:hofmann-conjugated-exception:start -->',
  viewBox: '0 0 760 300',
  alt: 'The trimethylammonium salt from 1-phenylpropan-2-amine. One beta carbon is the benzylic CH2 next to the benzene ring; the other is the CH3. Losing a benzylic hydrogen gives 1-phenylprop-1-ene, whose C=C is conjugated with the ring: the major product. Losing a CH3 hydrogen gives 3-phenylprop-1-ene: the minor product.',
  build() {
    let s = panel(0, 40, 330, 230);
    s += tg(165, 62, 'the salt from 1-phenylpropan-2-amine');
    const ring = benzene(76, 150, 30, { rot: 0 });
    s += ring.svg;
    const v0 = ring.pts[0], Cb = P(150, 128), Ca = P(192, 150), Me = P(234, 128);
    s += sk(v0, Cb) + sk(Cb, Ca) + sk(Ca, Me);
    const N = P(192, 204);
    s += bond(Ca, N, { rFrom: 0, rTo: 16 });
    s += nitrogen(N, [P(156, 222), P(228, 222), P(192, 244)], { plus: P(212, 190) });
    s += tg(150, 96, 'benzylic CH₂:', 'fg-tag-warn');
    s += tg(150, 112, 'its H is more acidic', 'fg-tag-warn');
    s += tg(282, 124, 'CH₃: open');
    s += arrow(P(338, 130), P(430, 92));
    s += arrow(P(338, 180), P(430, 218));
    s += tg(372, 90, 'H from CH₂');
    s += tg(372, 226, 'H from CH₃');
    // major: 1-phenylprop-1-ene
    s += panel(440, 10, 310, 130, { kind: 'good' });
    const r1 = benzene(500, 66, 26, { rot: 0 });
    s += r1.svg;
    const m0 = r1.pts[0], m1 = P(562, 48), m2 = P(598, 66), m3 = P(634, 48);
    s += sk(m0, m1) + skDouble(m1, m2, P(580, 86)) + sk(m2, m3);
    s += tg(596, 110, '1-phenylprop-1-ene · major', 'fg-tag-good');
    s += tg(596, 126, 'C=C conjugated with the ring', 'fg-tag-good');
    // minor: 3-phenylprop-1-ene
    s += panel(440, 160, 310, 130);
    const r2 = benzene(500, 216, 26, { rot: 0 });
    s += r2.svg;
    const n0 = r2.pts[0], n1 = P(562, 198), n2 = P(598, 216), n3 = P(634, 198);
    s += sk(n0, n1) + sk(n1, n2) + bond(n2, n3, { order: 2, rFrom: 0, rTo: 0 });
    s += tg(596, 260, '3-phenylprop-1-ene · minor');
    s += tg(596, 276, 'the less substituted alkene');
    return s;
  },
  caption: 'Here the more acidic hydrogen wins, even though it sits on the more crowded carbon.',
});

/* ------------------------------------------------------------------------
   Worked example: 2-methylpentan-3-amine. Neither choice is a terminal
   alkene, and the less substituted one still wins. */
FIGURES.push({
  id: 'hofmann-worked-example',
  section: TOPIC,
  anchor: '<!-- fig:hofmann-worked-example:start -->',
  viewBox: '0 0 760 290',
  alt: 'The trimethylammonium salt from 2-methylpentan-3-amine, with its two beta carbons marked: C2, which carries two methyl groups and one hydrogen, and C4, which carries one methyl group and two hydrogens. Losing a hydrogen from C4 gives 4-methylpent-2-ene, disubstituted, the major product. Losing one from C2 gives 2-methylpent-2-ene, trisubstituted, the minor product.',
  build() {
    let s = panel(0, 20, 320, 250);
    s += tg(160, 42, 'the salt from 2-methylpentan-3-amine');
    const C1 = P(56, 150), C2 = P(104, 126), C3 = P(152, 150), C4 = P(200, 126), C5 = P(248, 150), Br = P(104, 84);
    s += chain([C1, C2, C3, C4, C5]) + sk(C2, Br);
    const N = P(152, 200);
    s += bond(C3, N, { rFrom: 0, rTo: 16 });
    s += nitrogen(N, [P(116, 218), P(188, 218), P(152, 240)], { plus: P(172, 186) });
    s += tg(56, 170, 'C1');
    s += tg(80, 100, 'C2', 'fg-tag-warn');
    s += tg(126, 132, 'β', 'fg-tag-warn');
    s += tg(200, 110, 'C4', 'fg-tag-good');
    s += tg(178, 132, 'β', 'fg-tag-good');
    s += tg(248, 170, 'C5');
    s += tg(270, 86, 'C2: 1 H,', 'fg-tag-warn');
    s += tg(270, 102, 'two CH₃ on it', 'fg-tag-warn');
    s += arrow(P(328, 120), P(430, 84));
    s += arrow(P(328, 170), P(430, 206));
    s += tg(376, 88, 'H from C4');
    s += tg(376, 214, 'H from C2');
    // major: double bond C3=C4
    s += panel(440, 10, 310, 126, { kind: 'good' });
    const a1 = P(480, 84), a2 = P(522, 62), a3 = P(564, 84), a4 = P(606, 62), a5 = P(648, 84), ab = P(522, 28);
    s += sk(a1, a2) + sk(a2, ab) + sk(a2, a3) + skDouble(a3, a4, P(585, 100)) + sk(a4, a5);
    s += tg(596, 108, '4-methylpent-2-ene · major', 'fg-tag-good');
    s += tg(596, 124, 'disubstituted', 'fg-tag-good');
    // minor: double bond C2=C3
    s += panel(440, 154, 310, 126);
    const b1 = P(480, 228), b2 = P(522, 206), b3 = P(564, 228), b4 = P(606, 206), b5 = P(648, 228), bb = P(522, 172);
    s += sk(b1, b2) + sk(b2, bb) + skDouble(b2, b3, P(530, 250)) + sk(b3, b4) + sk(b4, b5);
    s += tg(596, 252, '2-methylpent-2-ene · minor', 'fg-tag-warn');
    s += tg(596, 268, 'trisubstituted, more stable');
    return s;
  },
  caption: 'Both products keep the substrate’s left-to-right order, so you can see which bond became the C=C.',
});

/* ------------------------------------------------------------------------
   The Cope elimination: the amine oxide, the syn five-membered ring, the
   products. */
FIGURES.push({
  id: 'cope-elimination',
  section: TOPIC,
  anchor: '<!-- fig:cope-elimination:start -->',
  viewBox: '0 0 760 350',
  alt: 'The Cope elimination in three panels. Panel 1: N,N-dimethylbutan-2-amine is oxidized by hydrogen peroxide to its amine oxide, with a positive nitrogen bonded to a negative oxygen. Panel 2: the oxide oxygen uses a lone pair to take a hydrogen from C1, on the same side as the nitrogen; the five atoms O, H, C1, C2 and N form a flat ring; the C–H pair becomes the C1=C2 pi bond and the C2–N bond breaks toward nitrogen. Panel 3: the products are but-1-ene and N,N-dimethylhydroxylamine.',
  build() {
    let s = '';
    // Panel 1: make the amine oxide
    s += panel(0, 0, 230, 350);
    s += tg(115, 22, '1 · make the amine oxide');
    {
      const C1 = P(40, 60), C2 = P(88, 84), C3 = P(136, 60), C4 = P(184, 84);
      s += chain([C1, C2, C3, C4]);
      const N = P(88, 128);
      s += bond(C2, N, { rFrom: 0, rTo: 16 });
      s += nitrogen(N, [P(52, 148), P(124, 148)], { kind: 'hi' });
      s += lonePair(88, 128, 90, { dist: 22 });
      s += arrow(P(115, 172), P(115, 206));
      s += tg(160, 194, 'H₂O₂');
      const D1 = P(40, 232), D2 = P(88, 256), D3 = P(136, 232), D4 = P(184, 256);
      s += chain([D1, D2, D3, D4]);
      const M = P(88, 298);
      s += bond(D2, M, { rFrom: 0, rTo: 16 });
      s += nitrogen(M, [P(52, 318), P(124, 318)], { plus: P(108, 284) });
      const O = P(156, 298);
      s += bond(M, O, { rFrom: 16, rTo: 15 });
      s += atom(O.x, O.y, 'O');
      s += tg(174, 286, '−');
      s += tg(115, 342, 'amine oxide: N⁺ bonded to O⁻');
    }
    s += arrow(P(236, 175), P(262, 175));
    // Panel 2: the syn step
    s += panel(266, 0, 230, 350, { kind: 'warn' });
    s += tg(381, 22, '2 · the syn step, on heating');
    {
      const ox = 266;
      const Ca = P(ox + 84, 214), Cb = P(ox + 154, 214), N = P(ox + 60, 146), O = P(ox + 118, 100), H = P(ox + 170, 150);
      const C3 = P(ox + 60, 256), C4 = P(ox + 84, 300);
      s += sk(Ca, Cb) + sk(Ca, C3) + sk(C3, C4);
      s += bond(Ca, N, { rFrom: 0, rTo: 16 });
      s += nitrogen(N, [P(ox + 22, 124), P(ox + 24, 168)], { plus: P(ox + 48, 118) });
      s += bond(N, O, { rFrom: 16, rTo: 15 });
      s += atom(O.x, O.y, 'O');
      s += tg(O.x - 2, O.y - 22, '−');
      s += bond(Cb, H, { rFrom: 0, rTo: 11 });
      s += atom(H.x, H.y, 'H', { r: 11 });
      s += bond(O, H, { rFrom: 15, rTo: 11, cls: 'fg-dash' });
      s += lonePair(O.x, O.y, -25, { dist: 21 });
      s += curve(P(O.x + 24, O.y - 12), P(H.x - 2, H.y - 13), { bow: -14 });
      s += curve(mid(Cb, H), mid(Ca, Cb), { bow: -16 });
      s += curve(mid(Ca, N), P(N.x + 14, N.y + 12), { bow: 12 });
      s += tg(Cb.x + 12, Cb.y + 22, 'C1');
      s += tg(Ca.x + 18, Ca.y + 30, 'C2');
      s += tg(381, 324, 'five atoms in a flat ring:', 'fg-tag-warn');
      s += tg(381, 340, 'O, H, C1, C2, N · syn, 0°', 'fg-tag-warn');
    }
    s += arrow(P(502, 175), P(526, 175));
    // Panel 3: products
    s += panel(530, 0, 230, 350, { kind: 'good' });
    s += tg(645, 22, '3 · the products');
    {
      const a = P(580, 120), b = P(618, 98), c = P(656, 120), d = P(694, 98);
      s += bond(a, b, { order: 2, rFrom: 0, rTo: 0 }) + sk(b, c) + sk(c, d);
      s += tg(637, 152, 'but-1-ene', 'fg-tag-good');
      s += lbl(645, 196, '+');
      const N = P(632, 246), O = P(690, 246);
      s += nitrogen(N, [P(596, 226), P(596, 268)], { kind: 'plain' });
      s += bond(N, O, { rFrom: 15, rTo: 16 });
      s += atom(O.x, O.y, 'OH');
      s += tg(645, 300, 'N,N-dimethylhydroxylamine');
    }
    return s;
  },
  caption: 'In panel 2, the dashed line marks the O–H bond about to form. It closes the five-atom ring.',
});

/* ------------------------------------------------------------------------
   Piperidine takes two rounds: the first opens the ring, the second frees
   the nitrogen. Stacked at 340 so the lesson can use it too. */
FIGURES.push({
  id: 'cyclic-amine-degradation',
  section: TOPIC,
  lessons: [TOPIC],
  anchor: '<!-- fig:cyclic-amine-degradation:start -->',
  viewBox: '0 0 340 540',
  alt: 'Piperidine, a six-membered ring containing an NH, takes two CH3I to become the N,N-dimethylpiperidinium ion. In round 1, Ag2O, water and heat break one ring C–N bond, giving N,N-dimethylpent-4-en-1-amine: the ring is open but the nitrogen is still attached. In round 2, one more CH3I, then Ag2O and heat, break the second C–N bond, giving penta-1,4-diene and trimethylamine.',
  build() {
    let s = panel(0, 0, 340, 176);
    s += tg(170, 20, 'methylate: two CH₃I, K₂CO₃');
    // piperidine
    const p = polyPts(62, 108, 6, 34, 90);
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      s += bond(p[i], p[j], { rFrom: i === 0 ? 16 : 0, rTo: j === 0 ? 16 : 0 });
    }
    s += atom(p[0].x, p[0].y, 'NH', { kind: 'hi' });
    s += tg(62, 166, 'piperidine');
    s += arrow(P(106, 108), P(160, 108));
    // the salt
    const q = polyPts(236, 118, 6, 32, 90);
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      const breaks = (i === 5 && j === 0);
      s += bond(q[i], q[j], { rFrom: i === 0 ? 16 : 0, rTo: j === 0 ? 16 : 0, cls: breaks ? 'fg-bond-hi' : 'fg-bond' });
    }
    s += nitrogen(q[0], [P(210, 52), P(262, 52)], { plus: P(260, 78) });
    s += tg(302, 132, 'this C–N', 'fg-tag-warn');
    s += tg(302, 148, 'breaks', 'fg-tag-warn');
    s += tg(236, 170, 'the quaternary salt');
    // round 1
    s += arrow(P(170, 182), P(170, 222));
    s += tg(182, 206, 'round 1: Ag₂O, H₂O, heat', 'fg-tag-warn', { anchor: 'start' });
    s += panel(0, 228, 340, 132, { kind: 'warn' });
    s += tg(170, 248, 'the ring is open; N is still attached');
    {
      const v = [P(34, 314), P(72, 292), P(110, 314), P(148, 292), P(186, 314)];
      s += bond(v[0], v[1], { order: 2, rFrom: 0, rTo: 0 }) + sk(v[1], v[2]) + sk(v[2], v[3]) + sk(v[3], v[4]);
      const N = P(226, 292);
      s += bond(v[4], N, { rFrom: 0, rTo: 16 });
      s += nitrogen(N, [P(262, 314), P(262, 270)], { kind: 'hi' });
      s += tg(170, 348, 'N,N-dimethylpent-4-en-1-amine');
    }
    // round 2
    s += arrow(P(170, 366), P(170, 406));
    s += tg(250, 382, 'round 2: CH₃I,', 'fg-tag-warn');
    s += tg(250, 398, 'then Ag₂O, H₂O, heat', 'fg-tag-warn');
    s += panel(0, 412, 340, 128, { kind: 'good' });
    s += tg(170, 432, 'the nitrogen is free');
    {
      const v = [P(26, 494), P(62, 472), P(98, 494), P(134, 472), P(170, 494)];
      s += bond(v[0], v[1], { order: 2, rFrom: 0, rTo: 0 }) + sk(v[1], v[2]) + sk(v[2], v[3]) + bond(v[3], v[4], { order: 2, rFrom: 0, rTo: 0 });
      s += tg(98, 526, 'penta-1,4-diene', 'fg-tag-good');
      s += lbl(262, 488, '+ N(CH₃)₃');
    }
    return s;
  },
  caption: 'The first round breaks the highlighted C–N bond and opens the ring. The second round breaks the other one.',
});

/* ------------------------------------------------------------------------
   Lesson only: the amine in the independent-practice question. */
FIGURES.push({
  id: 'l-hofmann-quiz-amine',
  lessons: [TOPIC],
  viewBox: '0 0 340 200',
  alt: '3-Methylbutan-2-amine: a four-carbon chain numbered C1 to C4, with NH2 on C2 and a methyl group on C3.',
  build() {
    let s = '';
    const C1 = P(70, 122), C2 = P(130, 92), C3 = P(190, 122), C4 = P(250, 92), Me = P(190, 170);
    s += chain([C1, C2, C3, C4]) + sk(C3, Me);
    const N = P(130, 42);
    s += bond(C2, N, { rFrom: 0, rTo: 16 });
    s += atom(N.x, N.y, 'NH₂', { kind: 'hi', r: 17 });
    s += tg(70, 146, 'C1');
    s += tg(106, 80, 'C2');
    s += tg(190, 100, 'C3');
    s += tg(250, 76, 'C4');
    s += tg(170, 194, '3-methylbutan-2-amine');
    return s;
  },
  caption: 'The CH₃ drawn below C3 is a branch, not part of the numbered chain.',
});

export default FIGURES;
