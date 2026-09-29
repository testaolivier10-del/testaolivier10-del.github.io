/* Figures for the carbonyl-reduction notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure here is 340 wide with its panels stacked, and every label is
   fg-lbl or fg-tag, so any of them can sit in a lesson step on a phone. Each
   mechanism is drawn on a real molecule where one exists, and every curved
   arrow starts at a lone pair or a bond. The hydride arrows start on the
   B–H or Al–H bond, matching Nucleophilic addition. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { polyPts, ringDouble } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---- small local helpers ------------------------------------------------ */

const rad = (l) => (l === '' ? 0 : l.length > 2 ? 18 : l.length > 1 ? 16 : 14);
/* An atom whose label is drawn at the CSS size, centred in its disc. An empty
   label is a skeletal vertex and draws nothing. */
const A = (p, l, kind = 'plain', r) => (l === '' ? '' : atom(p.x, p.y, l, { kind, size: 13, r: r ?? rad(l) }));
/* A bond between two labeled atoms (or vertices), trimmed to both discs. */
const B = (a, la, b, lb, opts = {}) => bond(a, b, { rFrom: rad(la), rTo: rad(lb), ...opts });
/* A formal charge. */
const chg = (x, y, s) => `<text class="fg-lbl fg-warn" x="${x}" y="${y + 5}" text-anchor="middle">${s}</text>`;
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', anchor });
const tg = (x, y, s, kind = '', anchor = 'middle') => text(x, y, s, { cls: kind ? `fg-tag-${kind}` : 'fg-tag', size: 11, anchor });
const box = (y, h, title) => panel(4, y, 332, h) + tag(170, y + 22, title);
/* A label with an italic stereodescriptor or locant, e.g. ital('(', 'S', ')-butan-2-ol'). */
const ital = (x, y, pre, it, post, cls = 'fg-lbl') =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle">${pre}<tspan font-style="italic">${it}</tspan>${post}</text>`;
/* A labeled substituent at an angle from a centre: plain, wedge or hash. */
function arm(c, lc, deg, len, l, kind = 'plain', atomKind = 'plain') {
  const e = armEnd(c, deg, len);
  const o = { rFrom: rad(lc), rTo: rad(l) };
  let s = kind === 'wedge' ? wedge(c, e, { ...o, width: 9 })
        : kind === 'hash' ? hash(c, e, { ...o, width: 11, rungs: 4 })
        : bond(c, e, { ...o, cls: kind === 'hi' ? 'fg-bond-hi' : 'fg-bond' });
  s += A(e, l, atomKind);
  return { s, e };
}
/* An ethyl group off `c`: an unlabeled CH2 vertex, then a CH3 bent back. */
function ethyl(c, lc, deg, bend, len = 48) {
  const v = armEnd(c, deg, len);
  const m = armEnd(v, deg + bend, len - 2);
  let s = bond(c, v, { rFrom: rad(lc), rTo: 0 }) + bond(v, m, { rFrom: 0, rTo: 18 });
  s += A(m, 'CH₃');
  return { s, v, m };
}
/* A phenyl ring whose ipso carbon is `ipso`; `deg` points from ipso to the ring centre. */
function phenyl(ipso, deg, r = 24) {
  const cen = armEnd(ipso, deg, r);
  const pts = polyPts(cen.x, cen.y, 6, r, deg + 180);
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = pts[i], b = pts[(i + 1) % 6];
    s += i % 2 === 1 ? ringDouble(a, b, cen, { inset: 6, gap: 4.2 }) : bond(a, b, { rFrom: 0, rTo: 0 });
  }
  return s;
}
/* H–MH3 with its negative charge: the hydride donor, drawn as the bond it is. */
function hydride(h, metal, dir = 1, counter = '') {
  const m = P(h.x + dir * 68, h.y);
  let s = B(h, 'H', m, metal) + A(h, 'H', 'hi') + A(m, metal);
  s += chg(m.x + dir * 24, h.y - 18, '−');
  if (counter) s += lbl(m.x + dir * 64, h.y + 5, counter);
  return { s, m };
}
/* Hydroxide drawn as atoms: O with three lone pairs and its H to the right. */
function hydroxide(o) {
  const h = P(o.x + 38, o.y);
  let s = B(o, 'O', h, 'H') + A(o, 'O') + A(h, 'H');
  s += lonePair(o.x, o.y, 180, { dist: 21 }) + lonePair(o.x, o.y, 270, { dist: 21 }) + lonePair(o.x, o.y, 90, { dist: 21 });
  s += chg(o.x - 16, o.y - 22, '−');
  return s;
}
/* The propanoyl skeleton around a labeled carbonyl carbon: an ethyl on the
   left, the C–O on top (double unless `single`), and whatever goes at 330°. */
function propanoyl(c, oLabel, single, oKind = 'plain') {
  const o = armEnd(c, 90, 60);
  let s = B(c, 'C', o, oLabel, { order: single ? 1 : 2 });
  s += ethyl(c, 'C', 210, -60).s;
  return { s: s + A(o, oLabel, oKind), o };
}
/* An ethoxy group off `c` at 330°: O, CH2 vertex, CH3. */
function ethoxy(c) {
  const o = armEnd(c, 330, 50);
  const v = armEnd(o, 30, 48);
  const m = armEnd(v, 330, 46);
  let s = B(c, 'C', o, 'O') + bond(o, v, { rFrom: 14, rTo: 0 }) + bond(v, m, { rFrom: 0, rTo: 18 });
  s += A(o, 'O') + A(m, 'CH₃');
  return { s, o };
}

/* ------------------------------------------------------------------ 1 ---
   The mechanism on butan-2-one, the page's running example. The first arrow
   starts on the B–H bond, as in Nucleophilic addition; the product carbon is
   a stereocenter, so its new H is drawn in the plane, not on a wedge, and the
   two-faces figure takes that up. */
FIGURES.push({
  id: 'hydride-arrows',
  section: 'carbonyl-reduction',
  lessons: ['carbonyl-reduction'],
  anchor: 'and butan-2-ol forms.</p>',
  alt: 'Three stacked panels. First, butan-2-one with borohydride below it: one curved arrow runs from the B–H bond to the carbonyl carbon and a second moves the C=O pi bond onto oxygen. Second, the tetrahedral alkoxide with the new hydrogen, whose O minus takes a proton from methanol. Third, butan-2-ol, a secondary alcohol, with methoxide.',
  viewBox: '0 0 340 660',
  build() {
    let s = '';
    const ketone = (c, single, oLabel = 'O', oKind = 'plain') => {
      const o = armEnd(c, 90, 60);
      let g = B(c, 'C', o, oLabel, { order: single ? 1 : 2 });
      g += arm(c, 'C', 210, 46, 'CH₃').s;
      g += ethyl(c, 'C', 330, 60).s;
      g += A(o, oLabel, oKind) + A(c, 'C', 'warn');
      return { g, o };
    };
    // ---- 1. attack ----
    s += box(8, 214, 'STEP 1 · HYDRIDE MOVES FROM B TO C');
    const c1 = P(120, 124), k1 = ketone(c1, false);
    s += k1.g;
    s += lonePair(k1.o.x, k1.o.y, 315, { dist: 21 }) + lonePair(k1.o.x, k1.o.y, 225, { dist: 21 });
    s += curve(P(126, 102), P(134, 70), { bow: 12 });
    s += hydride(P(120, 196), 'BH₃', 1, 'Na⁺').s;
    s += curve(P(152, 190), P(124, 142), { bow: 14 });
    s += tg(276, 64, 'NaBH₄', 'mut');
    s += tg(276, 82, 'in CH₃OH', 'mut');

    // ---- 2. protonation by the solvent ----
    s += box(230, 226, 'STEP 2 · METHANOL GIVES A PROTON');
    const c2 = P(110, 354), k2 = ketone(c2, true);
    s += k2.g;
    s += arm(c2, 'C', 270, 50, 'H', 'plain', 'hi').s;
    s += lonePair(k2.o.x, k2.o.y, 270, { dist: 21 }) + lonePair(k2.o.x, k2.o.y, 180, { dist: 21 }) + lonePair(k2.o.x, k2.o.y, 0, { dist: 21 });
    s += chg(88, 276, '−');
    const mh = P(190, 294), mo = P(244, 294), mc = P(298, 294);
    s += B(mh, 'H', mo, 'O') + B(mo, 'O', mc, 'CH₃') + A(mh, 'H') + A(mo, 'O') + A(mc, 'CH₃');
    s += lonePair(mo.x, mo.y, 90, { dist: 21 }) + lonePair(mo.x, mo.y, 270, { dist: 21 });
    s += curve(P(136, 290), P(176, 288), { bow: -16 });
    s += curve(P(212, 300), P(236, 314), { bow: 10 });
    s += tg(262, 414, 'tetrahedral', 'mut');
    s += tg(262, 432, 'alkoxide', 'mut');

    // ---- 3. product ----
    s += box(464, 186, 'PRODUCT · BUTAN-2-OL');
    const c3 = P(110, 580), k3 = ketone(c3, true, 'OH');
    s += k3.g;
    s += arm(c3, 'C', 270, 46, 'H', 'plain', 'hi').s;
    s += lbl(262, 540, '+  CH₃O⁻');
    s += tg(236, 634, 'secondary (2°) alcohol', 'good');
    return s;
  },
  caption: 'Butan-2-one and sodium borohydride in methanol. The first arrow starts on the B–H bond, and the highlighted H is the one that moved.',
});

/* ------------------------------------------------------------------ 2 ---
   Audit [H]: the racemic argument had no figure of its own. Butan-2-one is
   drawn in the plane of the page, so its two faces are front and back; each
   product is drawn with the new H on a wedge or a hash, and labelled. */
FIGURES.push({
  id: 'two-faces',
  section: 'carbonyl-reduction',
  lessons: ['carbonyl-reduction'],
  anchor: '<h3>Reducing a ketone usually makes a racemic mixture</h3>',
  alt: 'Butan-2-one drawn flat in the plane of the page. An arrow on the left leads to the product formed when hydride arrives from the front face: butan-2-ol with its new H on a solid wedge, labelled S. An arrow on the right leads to the product from the back face: the same alcohol with the H on a hashed bond, labelled R. The two form 50 to 50, a racemic mixture.',
  viewBox: '0 0 340 486',
  build() {
    let s = '';
    s += box(8, 212, 'BUTAN-2-ONE · FLAT AT THE C=O');
    const c = P(150, 124), o = armEnd(c, 90, 60);
    s += B(c, 'C', o, 'O', { order: 2 });
    s += arm(c, 'C', 210, 46, 'CH₃').s;
    s += ethyl(c, 'C', 330, 60).s;
    s += A(o, 'O') + A(c, 'C', 'warn');
    s += lonePair(o.x, o.y, 315, { dist: 21 }) + lonePair(o.x, o.y, 225, { dist: 21 });
    s += tg(170, 200, 'the C=O and its two neighbors lie in the page');
    s += arrow(P(124, 226), P(92, 264));
    s += arrow(P(216, 226), P(248, 264));

    const product = (x0, face) => {
      let g = panel(x0, 270, 162, 180) + tag(x0 + 81, 292, face === 'wedge' ? 'H⁻ FROM THE FRONT' : 'H⁻ FROM THE BACK');
      const pc = P(x0 + 58, 364);
      g += arm(pc, 'C', 90, 50, 'OH').s;
      g += arm(pc, 'C', 210, 44, 'CH₃').s;
      g += ethyl(pc, 'C', 330, 60, 46).s;
      g += arm(pc, 'C', 270, 42, 'H', face, 'hi').s;
      g += A(pc, 'C', 'warn');
      g += ital(x0 + 81, 440, '(', face === 'wedge' ? 'S' : 'R', ')-butan-2-ol');
      return g;
    };
    s += product(4, 'wedge');
    s += product(174, 'hash');
    s += tg(170, 476, '50 : 50 — a racemic mixture, (±)-butan-2-ol', 'good');
    return s;
  },
  caption: 'The page is the plane of the C=O. A wedge points toward you and a hash points away, so each product shows which face the hydride came from.',
});

/* ------------------------------------------------------------------ 3 ---
   Audit [M] ×2: the ketone-vs-ester figure sat under the wrong heading and
   the lesson had nothing like it. Redrawn as the mechanism on a real ester,
   ethyl propanoate, with the collapse drawn as arrows. */
FIGURES.push({
  id: 'ester-two-hydrides',
  section: 'carbonyl-reduction',
  lessons: ['carbonyl-reduction'],
  anchor: '<h3>Esters take two hydrides</h3>',
  alt: 'Four stacked panels. First, ethyl propanoate: an arrow runs from the Al–H bond of aluminohydride to the carbonyl carbon and the pi bond moves onto oxygen. Second, the tetrahedral intermediate: a lone pair on O minus moves back down to re-form the C=O while the C–O bond to the ethoxy group breaks and ethoxide leaves. Third, propanal meets a second hydride. Fourth, after workup, propan-1-ol with two highlighted hydrogens on the carbinol carbon, plus ethanol.',
  viewBox: '0 0 340 880',
  build() {
    let s = '';
    // ---- 1. first hydride ----
    s += box(8, 214, 'STEP 1 · THE FIRST HYDRIDE ADDS');
    const c1 = P(120, 120), p1 = propanoyl(c1, 'O', false);
    s += p1.s + ethoxy(c1).s + A(c1, 'C', 'warn');
    s += lonePair(p1.o.x, p1.o.y, 315, { dist: 21 }) + lonePair(p1.o.x, p1.o.y, 225, { dist: 21 });
    s += curve(P(126, 98), P(134, 66), { bow: 12 });
    s += hydride(P(120, 196), 'AlH₃', 1, 'Li⁺').s;
    s += curve(P(152, 190), P(124, 138), { bow: 14 });
    s += tg(286, 58, 'LiAlH₄', 'mut');
    s += tg(286, 76, 'dry ether', 'mut');

    // ---- 2. collapse ----
    s += box(230, 230, 'STEP 2 · THE C=O RE-FORMS, EtO⁻ LEAVES');
    const c2 = P(120, 354), p2 = propanoyl(c2, 'O', true);
    const e2 = ethoxy(c2);
    s += p2.s + e2.s;
    s += arm(c2, 'C', 270, 50, 'H', 'plain', 'hi').s;
    s += A(c2, 'C', 'warn');
    s += lonePair(p2.o.x, p2.o.y, 180, { dist: 21 }) + lonePair(p2.o.x, p2.o.y, 270, { dist: 21 }) + lonePair(p2.o.x, p2.o.y, 0, { dist: 21 });
    s += chg(140, 272, '−');
    s += curve(P(100, 300), P(115, 322), { bow: 10 });
    s += curve(P(146, 364), P(168, 392), { bow: -12 });
    s += tg(262, 436, 'ethoxide leaves', 'mut');

    // ---- 3. second hydride ----
    s += box(468, 214, 'STEP 3 · A SECOND HYDRIDE');
    const c3 = P(120, 580), p3 = propanoyl(c3, 'O', false);
    s += p3.s;
    s += arm(c3, 'C', 330, 46, 'H', 'plain', 'hi').s;
    s += A(c3, 'C', 'warn');
    s += lonePair(p3.o.x, p3.o.y, 315, { dist: 21 }) + lonePair(p3.o.x, p3.o.y, 225, { dist: 21 });
    s += curve(P(114, 558), P(106, 526), { bow: -12 });
    s += hydride(P(120, 656), 'AlH₃', 1).s;
    s += curve(P(152, 650), P(124, 598), { bow: 14 });
    s += tg(262, 522, 'propanal', 'warn');
    s += tg(262, 580, 'more electrophilic', 'mut');
    s += tg(262, 598, 'than the ester', 'mut');

    // ---- 4. product ----
    s += box(690, 180, 'AFTER H₃O⁺ WORKUP · PROPAN-1-OL');
    const c4 = P(120, 804), p4 = propanoyl(c4, 'OH', true);
    s += p4.s;
    s += arm(c4, 'C', 330, 46, 'H', 'plain', 'hi').s;
    s += arm(c4, 'C', 270, 42, 'H', 'plain', 'hi').s;
    s += A(c4, 'C', 'warn');
    s += lbl(262, 790, '+  CH₃CH₂OH');
    s += tg(262, 830, 'primary (1°) alcohol', 'good');
    return s;
  },
  caption: 'Ethyl propanoate and LiAlH₄. Step 2 is the new move: the O⁻ pushes the ethoxy group out. The two highlighted H atoms in the product are the two hydrides.',
});

/* ------------------------------------------------------------------ 4 ---
   DIBAL-H stops at the aldehyde because the tetrahedral intermediate holds
   together while cold, not because the reagent is simply weaker. */
FIGURES.push({
  id: 'dibal-stop',
  section: 'carbonyl-reduction',
  anchor: '<h3>Stopping at the aldehyde: DIBAL-H</h3>',
  alt: 'Three stacked panels. Ethyl propanoate with DIBAL-H at minus 78 degrees gives a tetrahedral intermediate whose oxygen is bonded to aluminum and which keeps its ethoxy group while cold. Aqueous workup then releases propanal and ethanol.',
  viewBox: '0 0 340 650',
  build() {
    let s = '';
    s += box(8, 180, 'ETHYL PROPANOATE');
    const c1 = P(120, 118), p1 = propanoyl(c1, 'O', false);
    s += p1.s + ethoxy(c1).s + A(c1, 'C', 'warn');
    s += lonePair(p1.o.x, p1.o.y, 315, { dist: 21 }) + lonePair(p1.o.x, p1.o.y, 225, { dist: 21 });
    s += arrow(P(170, 192), P(170, 226));
    s += tg(250, 214, 'DIBAL-H, −78 °C');

    s += box(230, 212, 'HELD TOGETHER WHILE COLD');
    const c2 = P(120, 340), p2 = propanoyl(c2, 'O', true);
    s += p2.s + ethoxy(c2).s;
    const al = P(188, 280);
    s += B(p2.o, 'O', al, 'AlR₂') + A(al, 'AlR₂');
    s += lonePair(p2.o.x, p2.o.y, 180, { dist: 21 }) + lonePair(p2.o.x, p2.o.y, 270, { dist: 21 });
    s += arm(c2, 'C', 270, 48, 'H', 'plain', 'hi').s;
    s += A(c2, 'C', 'warn');
    s += tg(276, 312, 'R = isobutyl', 'mut');
    s += tg(170, 428, 'the ethoxy group stays on at −78 °C', 'good');
    s += arrow(P(170, 446), P(170, 480));
    s += tg(250, 468, 'H₃O⁺ workup');

    s += box(486, 156, 'AFTER WORKUP · PROPANAL');
    const c3 = P(110, 590), p3 = propanoyl(c3, 'O', false);
    s += p3.s;
    s += arm(c3, 'C', 330, 46, 'H', 'plain', 'hi').s;
    s += A(c3, 'C', 'warn');
    s += lonePair(p3.o.x, p3.o.y, 315, { dist: 21 }) + lonePair(p3.o.x, p3.o.y, 225, { dist: 21 });
    s += lbl(254, 582, '+  CH₃CH₂OH');
    s += tg(254, 618, 'one hydride only', 'good');
    return s;
  },
  caption: 'The aldehyde appears only in the workup, after the DIBAL-H has been destroyed, so there is no hydride left to reduce it.',
});

/* ------------------------------------------------------------------ 5 ---
   Audit chemistry note: LiAlH4 meets a carboxylic acid as a base first. */
FIGURES.push({
  id: 'acid-first',
  section: 'carbonyl-reduction',
  anchor: 'and hydrogen gas bubbles off.</p>',
  alt: 'Two stacked panels. Propanoic acid: an arrow runs from the Al–H bond of aluminohydride to the acidic O–H hydrogen, and a second arrow moves the O–H bond electrons onto oxygen. Below, the propanoate ion and a molecule of hydrogen gas.',
  viewBox: '0 0 340 380',
  build() {
    let s = '';
    s += box(8, 180, 'STEP 1 · THE O–H PROTON GOES FIRST');
    const c1 = P(100, 118), p1 = propanoyl(c1, 'O', false);
    s += p1.s;
    const oh = armEnd(c1, 330, 50), h = armEnd(oh, 30, 46);
    s += B(c1, 'C', oh, 'O') + B(oh, 'O', h, 'H') + A(oh, 'O') + A(h, 'H', 'warn') + A(c1, 'C');
    s += lonePair(p1.o.x, p1.o.y, 315, { dist: 21 }) + lonePair(p1.o.x, p1.o.y, 225, { dist: 21 });
    s += lonePair(oh.x, oh.y, 90, { dist: 21 }) + lonePair(oh.x, oh.y, 0, { dist: 21 });
    const hh = P(244, 164);
    s += hydride(hh, 'AlH₃', 1).s;
    s += curve(P(270, 158), P(190, 108), { bow: 24 });
    s += curve(P(168, 118), P(150, 156), { bow: -10 });

    s += box(196, 174, 'PROPANOATE ION  +  HYDROGEN GAS');
    const c2 = P(100, 306), p2 = propanoyl(c2, 'O', false);
    s += p2.s;
    const om = armEnd(c2, 330, 50);
    s += B(c2, 'C', om, 'O') + A(om, 'O') + A(c2, 'C');
    s += lonePair(p2.o.x, p2.o.y, 315, { dist: 21 }) + lonePair(p2.o.x, p2.o.y, 225, { dist: 21 });
    s += lonePair(om.x, om.y, 90, { dist: 21 }) + lonePair(om.x, om.y, 0, { dist: 21 }) + lonePair(om.x, om.y, 300, { dist: 21 });
    s += chg(166, 318, '−');
    const h1 = P(236, 290), h2 = P(276, 290);
    s += B(h1, 'H', h2, 'H') + A(h1, 'H', 'warn') + A(h2, 'H', 'hi');
    s += tg(256, 324, 'H₂ bubbles off', 'good');
    s += tg(170, 356, 'then, more slowly: reduced to propan-1-ol', 'mut');
    return s;
  },
  caption: 'Propanoic acid and LiAlH₄. The acid is a proton donor before it is an electrophile, so the first hydride is spent making H₂.',
});

/* ------------------------------------------------------------------ 6 ---
   Amide to amine: the oxygen leaves, not the nitrogen. Drawn on
   N,N-dimethylacetamide, with the aluminum kept on the oxygen so the reason
   the oxygen can leave is on the drawing. */
FIGURES.push({
  id: 'amide-to-amine',
  section: 'carbonyl-reduction',
  lessons: ['carbonyl-reduction'],
  anchor: '<h3>Amides give amines</h3>',
  alt: 'Four stacked panels. First, N,N-dimethylacetamide: an arrow runs from an Al–H bond to the carbonyl carbon and the pi bond moves onto oxygen. Second, the tetrahedral intermediate with its oxygen bonded to aluminum: the nitrogen lone pair moves in to form C=N while the C–O bond breaks toward oxygen. Third, the iminium ion takes a second hydride at carbon while the C=N pi bond moves onto nitrogen. Fourth, the amine N,N-dimethylethanamine, with two highlighted hydrogens on the carbon that was the carbonyl carbon.',
  viewBox: '0 0 340 890',
  build() {
    let s = '';
    const nMe2 = (c, len = 54) => {
      const n = armEnd(c, 330, len);
      let g = arm(n, 'N', 30, 44, 'CH₃').s + arm(n, 'N', 270, 44, 'CH₃').s;
      return { g, n };
    };
    // ---- 1. first hydride ----
    s += box(8, 222, 'STEP 1 · A HYDRIDE ADDS TO THE C=O');
    const c1 = P(120, 118), o1 = armEnd(c1, 90, 58), n1 = nMe2(c1);
    s += B(c1, 'C', o1, 'O', { order: 2 }) + arm(c1, 'C', 210, 46, 'CH₃').s + B(c1, 'C', n1.n, 'N');
    s += n1.g + A(o1, 'O') + A(n1.n, 'N') + A(c1, 'C', 'warn');
    s += lonePair(o1.x, o1.y, 315, { dist: 21 }) + lonePair(o1.x, o1.y, 225, { dist: 21 });
    s += lonePair(n1.n.x, n1.n.y, 30, { dist: 21 });
    s += curve(P(126, 96), P(134, 64), { bow: 12 });
    s += hydride(P(106, 196), 'AlH₃', -1).s;
    s += curve(P(84, 190), P(114, 138), { bow: 12 });
    s += tg(280, 58, 'LiAlH₄, dry ether', 'mut');

    // ---- 2. the oxygen leaves ----
    s += box(238, 244, 'STEP 2 · THE N LONE PAIR PUSHES O OUT');
    const c2 = P(120, 364), o2 = armEnd(c2, 90, 58), n2 = nMe2(c2), al = P(188, o2.y);
    s += B(c2, 'C', o2, 'O') + arm(c2, 'C', 210, 46, 'CH₃').s + B(c2, 'C', n2.n, 'N');
    s += arm(c2, 'C', 270, 46, 'H', 'plain', 'hi').s;
    s += B(o2, 'O', al, 'AlH₃') + A(al, 'AlH₃') + chg(212, o2.y - 18, '−');
    s += n2.g + A(o2, 'O') + A(n2.n, 'N') + A(c2, 'C', 'warn');
    s += lonePair(o2.x, o2.y, 180, { dist: 21 }) + lonePair(o2.x, o2.y, 270, { dist: 21 });
    s += lonePair(n2.n.x, n2.n.y, 30, { dist: 21 });
    s += curve(P(186, 404), P(150, 378), { bow: -14 });
    s += curve(P(114, 344), P(104, 318), { bow: 10 });
    s += tg(170, 470, 'O bonded to aluminum can leave', 'mut');

    // ---- 3. second hydride ----
    s += box(490, 222, 'STEP 3 · A SECOND HYDRIDE, TO THE C=N⁺');
    const c3 = P(120, 590), n3 = nMe2(c3, 58);
    s += arm(c3, 'C', 90, 46, 'H', 'plain', 'hi').s + arm(c3, 'C', 210, 46, 'CH₃').s;
    s += B(c3, 'C', n3.n, 'N', { order: 2 });
    s += n3.g + A(n3.n, 'N') + A(c3, 'C', 'warn');
    s += chg(n3.n.x + 4, n3.n.y - 26, '+');
    s += curve(P(146, 592), P(160, 626), { bow: -12 });
    s += hydride(P(106, 670), 'AlH₃', -1).s;
    s += curve(P(84, 664), P(114, 610), { bow: 12 });
    s += tg(262, 548, 'iminium ion', 'warn');

    // ---- 4. product ----
    s += box(720, 162, 'AFTER WORKUP · THE AMINE');
    const c4 = P(120, 804), n4 = nMe2(c4);
    s += arm(c4, 'C', 90, 44, 'H', 'plain', 'hi').s + arm(c4, 'C', 270, 42, 'H', 'plain', 'hi').s;
    s += arm(c4, 'C', 210, 46, 'CH₃').s + B(c4, 'C', n4.n, 'N');
    s += n4.g + A(n4.n, 'N') + A(c4, 'C', 'warn');
    s += lonePair(n4.n.x, n4.n.y, 30, { dist: 21 });
    s += tg(270, 760, 'C=O became CH₂', 'good');
    return s;
  },
  caption: 'N,N-Dimethylacetamide and LiAlH₄. In step 2 the nitrogen stays and the oxygen goes. Both highlighted H atoms in the product came from hydride.',
});

/* ------------------------------------------------------------------ 7 ---
   Nitrile to primary amine: two hydrides on one carbon. */
FIGURES.push({
  id: 'nitrile-to-amine',
  section: 'carbonyl-reduction',
  anchor: 'and workup puts two H on the nitrogen.</p>',
  alt: 'Propanenitrile, with its C≡N drawn as a straight triple bond, is reduced by LiAlH4 and then water to propan-1-amine. The carbon that carried the triple bond now carries two highlighted hydrogens, and the nitrogen is an NH2 group.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    s += box(8, 118, 'PROPANENITRILE');
    const m = P(60, 92), v = P(100, 69), c = P(140, 92);
    const u = { x: (c.x - v.x), y: (c.y - v.y) }, L = Math.hypot(u.x, u.y);
    const n = P(c.x + (u.x / L) * 50, c.y + (u.y / L) * 50);
    s += bond(m, v, { rFrom: 18, rTo: 0 }) + bond(v, c, { rFrom: 0, rTo: 0 }) + bond(c, n, { order: 3, rFrom: 0, rTo: 14, gap: 3.2 });
    s += A(m, 'CH₃') + A(n, 'N');
    s += lonePair(n.x, n.y, 30, { dist: 20 });
    s += tg(264, 84, 'sp carbon: C–C≡N', 'mut');
    s += tg(264, 102, 'in a straight line', 'mut');
    s += arrow(P(170, 136), P(170, 176));
    s += tg(250, 162, '1. LiAlH₄  2. H₂O');

    s += box(186, 136, 'PROPAN-1-AMINE');
    const m2 = P(60, 268), v2 = P(100, 245), c2 = P(140, 268), n2 = armEnd(c2, 30, 48);
    s += bond(m2, v2, { rFrom: 18, rTo: 0 }) + bond(v2, c2, { rFrom: 0, rTo: 14 }) + B(c2, 'C', n2, 'NH₂');
    s += arm(c2, 'C', 300, 40, 'H', 'plain', 'hi').s + arm(c2, 'C', 240, 40, 'H', 'plain', 'hi').s;
    s += A(m2, 'CH₃') + A(n2, 'NH₂') + A(c2, 'C', 'warn');
    s += tg(262, 290, 'two H from hydride', 'good');
    return s;
  },
  caption: 'Propanenitrile and LiAlH₄. The coral carbon is the nitrile carbon; its two new H atoms are the two hydrides.',
});

/* ------------------------------------------------------------------ 8 ---
   H2 across a C=O, with the two new H atoms marked. */
FIGURES.push({
  id: 'h2-carbonyl',
  section: 'carbonyl-reduction',
  anchor: 'one H lands on the carbon and one on the oxygen.</p>',
  alt: 'Cyclohexanone reacts with hydrogen gas over platinum oxide at high pressure to give cyclohexanol. In the product one highlighted H sits on the former carbonyl carbon and the other on the oxygen.',
  viewBox: '0 0 340 380',
  build() {
    let s = '';
    s += box(8, 150, 'CYCLOHEXANONE');
    const ring = (cx, cy) => {
      const pts = polyPts(cx, cy, 6, 30, 90);
      let g = '';
      for (let i = 0; i < 6; i++) g += bond(pts[i], pts[(i + 1) % 6], { rFrom: i === 0 ? 14 : 0, rTo: (i + 1) % 6 === 0 ? 14 : 0 });
      return { g, top: pts[0] };
    };
    const r1 = ring(170, 110);
    const o1 = armEnd(r1.top, 90, 46);
    s += r1.g + B(r1.top, 'C', o1, 'O', { order: 2 }) + A(o1, 'O') + A(r1.top, 'C', 'warn');
    s += lonePair(o1.x, o1.y, 315, { dist: 21 }) + lonePair(o1.x, o1.y, 225, { dist: 21 });
    s += arrow(P(170, 166), P(170, 206));
    s += tg(254, 184, 'H₂, PtO₂');
    s += tg(254, 202, 'high pressure', 'mut');

    s += box(216, 160, 'CYCLOHEXANOL');
    const r2 = ring(170, 330);
    const o2 = armEnd(r2.top, 120, 46), hC = armEnd(r2.top, 60, 42), hO = armEnd(o2, 60, 38);
    s += r2.g + B(r2.top, 'C', o2, 'O') + B(o2, 'O', hO, 'H') + B(r2.top, 'C', hC, 'H');
    s += A(o2, 'O') + A(hO, 'H', 'hi') + A(hC, 'H', 'hi') + A(r2.top, 'C', 'warn');
    s += lonePair(o2.x, o2.y, 180, { dist: 21 }) + lonePair(o2.x, o2.y, 225, { dist: 21 });
    s += tg(270, 330, 'one H on C,', 'good');
    s += tg(270, 348, 'one H on O', 'good');
    return s;
  },
  caption: 'The two highlighted H atoms are the two atoms of one H₂ molecule.',
});

/* ------------------------------------------------------------------ 9 ---
   Audit [M]: the worked example gave its substrate as a condensed formula
   only. Drawn skeletal, with each reagent's product below. */
FIGURES.push({
  id: 'three-reagents',
  section: 'carbonyl-reduction',
  anchor: '<span class="k">Worked example — one molecule, three reagents</span>',
  alt: 'Ethyl 4-oxopentanoate drawn as a skeletal structure, with the ketone and the ester labelled. NaBH4 gives ethyl 4-hydroxypentanoate, with the ketone reduced to an OH and the ester unchanged. LiAlH4 gives pentane-1,4-diol plus ethanol. H2 over Pd/C at one atmosphere leaves both carbonyls unchanged.',
  viewBox: '0 0 340 610',
  build() {
    let s = '';
    const X = (i) => 40 + 36 * i;
    const chain = (y0, n) => Array.from({ length: n }, (_, i) => P(X(i), i % 2 ? y0 : y0 + 22));
    /* Ethyl 4-oxopentanoate, or its NaBH4 product when `ketoneOH`. */
    const ketoester = (y0, ketoneOH) => {
      const p = chain(y0, 8);
      let g = '';
      for (let i = 0; i < 7; i++) {
        if (i === 4 || i === 5) continue;
        g += bond(p[i], p[i + 1], { rFrom: 0, rTo: 0 });
      }
      g += bond(p[4], p[5], { rFrom: 0, rTo: 14 }) + bond(p[5], p[6], { rFrom: 14, rTo: 0 });
      const ko = P(p[1].x, p[1].y - 44), eo = P(p[4].x, p[4].y + 44);
      g += ketoneOH ? bond(p[1], ko, { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' }) + A(ko, 'OH', 'hi')
                    : bond(p[1], ko, { rFrom: 0, rTo: 14, order: 2 }) + A(ko, 'O');
      g += bond(p[4], eo, { rFrom: 0, rTo: 14, order: 2 }) + A(eo, 'O') + A(p[5], 'O');
      return { g, p, ko, eo };
    };
    s += box(8, 196, 'ETHYL 4-OXOPENTANOATE');
    const k = ketoester(106, false);
    s += k.g;
    s += tg(k.ko.x + 46, k.ko.y + 4, 'ketone', 'warn');
    s += tg(k.eo.x + 52, k.eo.y + 4, 'ester', 'warn');

    s += box(212, 160, 'NaBH₄, CH₃OH, then workup');
    const k2 = ketoester(290, true);
    s += k2.g;
    s += tg(250, 262, 'ketone reduced,', 'good');
    s += tg(250, 280, 'ester kept', 'good');

    s += box(380, 150, 'LiAlH₄, dry ether, then workup');
    const p = chain(460, 6);
    for (let i = 0; i < 4; i++) s += bond(p[i], p[i + 1], { rFrom: 0, rTo: 0 });
    s += bond(p[4], p[5], { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' }) + A(p[5], 'OH', 'hi');
    const d1 = P(p[1].x, p[1].y - 44);
    s += bond(p[1], d1, { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' }) + A(d1, 'OH', 'hi');
    s += lbl(290, 488, '+ EtOH');
    s += tg(250, 432, 'both reduced', 'good');
    s += tg(170, 518, 'pentane-1,4-diol', 'mut');

    s += box(538, 64, 'H₂, Pd/C, 1 atm');
    s += tg(170, 588, 'no change: both C=O groups survive', 'warn');
    return s;
  },
  caption: 'The coral OH groups mark each carbonyl that was reduced. Compare the NaBH₄ and LiAlH₄ products at the right-hand end.',
});

/* ------------------------------------------------------------------ 10 ---
   The two routes from C=O to CH2, on one real ketone. */
FIGURES.push({
  id: 'methylene-routes',
  section: 'carbonyl-reduction',
  lessons: ['carbonyl-reduction'],
  anchor: '<h3>All the way to CH₂: Clemmensen and Wolff–Kishner</h3>',
  alt: '1-Phenylpropan-1-one at the top and propylbenzene at the bottom, joined by one arrow. On the left of the arrow, the Clemmensen conditions, zinc amalgam and HCl with heat, labelled strong acid. On the right, the Wolff–Kishner conditions, hydrazine then KOH with heat, labelled strong base. In the product the former carbonyl carbon is a highlighted CH2.',
  viewBox: '0 0 340 440',
  build() {
    let s = '';
    const chainFrom = (ipso, cLabel, cKind) => {
      const c = armEnd(ipso, 30, 40), v = armEnd(c, 330, 40), m = armEnd(v, 30, 40);
      let g = phenyl(ipso, 180, 26);
      g += bond(ipso, c, { rFrom: 0, rTo: rad(cLabel) }) + bond(c, v, { rFrom: rad(cLabel), rTo: 0 }) + bond(v, m, { rFrom: 0, rTo: 0 });
      return { g, c, lab: A(c, cLabel, cKind) };
    };
    s += box(8, 160, '1-PHENYLPROPAN-1-ONE');
    const k = chainFrom(P(118, 124), '', 'plain');
    const o = armEnd(k.c, 90, 44);
    s += k.g + bond(k.c, o, { rFrom: 0, rTo: 14, order: 2, cls: 'fg-bond-hi' }) + A(o, 'O', 'warn');
    s += lonePair(o.x, o.y, 315, { dist: 21 }) + lonePair(o.x, o.y, 225, { dist: 21 });

    s += arrow(P(170, 178), P(170, 290));
    s += tg(86, 204, 'CLEMMENSEN');
    s += lbl(86, 226, 'Zn(Hg), HCl');
    s += lbl(86, 246, 'heat');
    s += tg(86, 270, 'strong acid', 'warn');
    s += tg(256, 204, 'WOLFF–KISHNER');
    s += lbl(256, 226, '1. H₂N–NH₂');
    s += lbl(256, 246, '2. KOH, heat');
    s += tg(256, 270, 'strong base', 'warn');

    s += box(300, 132, 'PROPYLBENZENE');
    const p = chainFrom(P(118, 400), 'CH₂', 'hi');
    s += p.g + p.lab;
    s += tg(262, 414, 'C=O → CH₂', 'good');
    return s;
  },
  caption: 'One ketone, one product, two sets of conditions. Pick the route whose conditions the rest of the molecule can survive.',
});

/* ------------------------------------------------------------------ 11 ---
   Audit [M]: the Wolff–Kishner steps after the hydrazone were in words only.
   Every step drawn with its arrows, on a generic ketone R2C=O. */
FIGURES.push({
  id: 'wolff-kishner',
  section: 'carbonyl-reduction',
  anchor: 'is the step that makes the whole sequence go.</p>',
  alt: 'Five stacked panels of the Wolff–Kishner mechanism on a hydrazone R2C=N–NH2. One: hydroxide takes an N–H proton from the NH2. Two: the nitrogen lone pair forms an N=N bond while the C=N pi electrons take a proton from water onto carbon. Three: hydroxide takes the last N–H proton. Four: the C–N bond breaks, leaving a carbanion, and nitrogen gas, N≡N, departs. Five: the carbanion takes a proton from water, giving R2CH2.',
  viewBox: '0 0 340 1000',
  build() {
    let s = '';
    const Rs = (c) => arm(c, 'C', 150, 42, 'R').s + arm(c, 'C', 210, 42, 'R').s;

    // ---- 1 ----
    s += box(8, 166, 'STEP 1 · HYDROXIDE TAKES AN N–H');
    {
      const c = P(80, 110), n1 = armEnd(c, 30, 54), n2 = armEnd(n1, 330, 54);
      const ha = armEnd(n2, 30, 50), hb = armEnd(n2, 270, 40);
      s += Rs(c) + B(c, 'C', n1, 'N', { order: 2 }) + B(n1, 'N', n2, 'N') + B(n2, 'N', ha, 'H') + B(n2, 'N', hb, 'H');
      s += A(c, 'C', 'warn') + A(n1, 'N') + A(n2, 'N') + A(ha, 'H', 'hi') + A(hb, 'H');
      s += lonePair(n1.x, n1.y, 270, { dist: 21 }) + lonePair(n2.x, n2.y, 270, { dist: 21 });
      const ox = P(282, ha.y);
      s += hydroxide(ox);
      s += curve(P(258, ha.y - 4), P(230, ha.y - 4), { bow: 14 });
      s += curve(P(196, ha.y + 14), P(186, n2.y + 4), { bow: -8 });
      s += tg(70, 164, 'the hydrazone', 'mut');
    }
    // ---- 2 ----
    s += box(182, 236, 'STEP 2 · CARBON TAKES A PROTON');
    {
      const c = P(80, 290), n1 = armEnd(c, 30, 54), n2 = armEnd(n1, 330, 54), hb = armEnd(n2, 270, 40);
      s += Rs(c) + B(c, 'C', n1, 'N', { order: 2 }) + B(n1, 'N', n2, 'N') + B(n2, 'N', hb, 'H');
      s += A(c, 'C', 'warn') + A(n1, 'N') + A(n2, 'N') + A(hb, 'H');
      s += lonePair(n1.x, n1.y, 270, { dist: 21 });
      s += lonePair(n2.x, n2.y, 270, { dist: 21 }) + lonePair(n2.x, n2.y, 330, { dist: 21 });
      s += chg(n2.x + 26, n2.y - 30, '−');
      const hw = armEnd(c, 300, 64), ow = armEnd(hw, 300, 44), hw2 = P(ow.x + 40, ow.y);
      s += B(hw, 'H', ow, 'O') + B(ow, 'O', hw2, 'H') + A(hw, 'H', 'hi') + A(ow, 'O') + A(hw2, 'H');
      s += lonePair(ow.x, ow.y, 90, { dist: 21 }) + lonePair(ow.x, ow.y, 180, { dist: 21 });
      s += curve(P(n2.x - 6, n2.y - 26), P(n1.x + 22, n1.y + 4), { bow: 10 });
      s += curve(P(106, 272), P(hw.x + 4, hw.y - 16), { bow: -14 });
      s += curve(P(hw.x + 12, hw.y + 14), P(ow.x + 6, ow.y - 16), { bow: -8 });
      s += tg(262, 404, 'water is the acid', 'mut');
    }
    // ---- 3 ----
    s += box(426, 170, 'STEP 3 · HYDROXIDE TAKES THE LAST N–H');
    {
      const c = P(80, 532), n1 = armEnd(c, 30, 54), n2 = armEnd(n1, 330, 54), ha = armEnd(n2, 30, 50), hc = armEnd(c, 270, 40);
      s += Rs(c) + B(c, 'C', n1, 'N') + B(n1, 'N', n2, 'N', { order: 2 }) + B(n2, 'N', ha, 'H') + B(c, 'C', hc, 'H', { cls: 'fg-bond-hi' });
      s += A(c, 'C', 'warn') + A(n1, 'N') + A(n2, 'N') + A(ha, 'H') + A(hc, 'H', 'hi');
      s += lonePair(n1.x, n1.y, 270, { dist: 21 }) + lonePair(n2.x, n2.y, 90, { dist: 21 });
      const ox = P(282, ha.y);
      s += hydroxide(ox);
      s += curve(P(258, ha.y - 4), P(230, ha.y - 4), { bow: 14 });
      s += curve(P(196, ha.y + 14), P(186, n2.y + 4), { bow: -8 });
    }
    // ---- 4 ----
    s += box(604, 200, 'STEP 4 · N₂ LEAVES AS A GAS');
    {
      const c = P(80, 700), n1 = armEnd(c, 30, 60), n2 = armEnd(n1, 330, 54), hc = armEnd(c, 270, 40);
      s += Rs(c) + B(c, 'C', n1, 'N') + B(n1, 'N', n2, 'N', { order: 2 }) + B(c, 'C', hc, 'H', { cls: 'fg-bond-hi' });
      s += A(c, 'C', 'warn') + A(n1, 'N') + A(n2, 'N') + A(hc, 'H', 'hi');
      s += lonePair(n1.x, n1.y, 270, { dist: 21 });
      s += lonePair(n2.x, n2.y, 90, { dist: 21 }) + lonePair(n2.x, n2.y, 330, { dist: 21 });
      s += chg(n2.x + 28, n2.y - 28, '−');
      s += curve(P(n2.x - 4, n2.y + 24), P(n1.x + 14, n1.y + 18), { bow: -12 });
      s += curve(P(n1.x - 22, n1.y + 2), P(c.x + 6, c.y - 18), { bow: 10 });
      const a = P(232, 772), b = P(282, 772);
      s += B(a, 'N', b, 'N', { order: 3, gap: 3.2 }) + A(a, 'N') + A(b, 'N');
      s += lonePair(a.x, a.y, 180, { dist: 21 }) + lonePair(b.x, b.y, 0, { dist: 21 });
      s += tg(257, 740, 'N₂ gas escapes', 'good');
    }
    // ---- 5 ----
    s += box(812, 180, 'STEP 5 · WATER PROTONATES THE CARBANION');
    {
      const c = P(80, 910), hc = armEnd(c, 270, 40);
      s += Rs(c) + B(c, 'C', hc, 'H', { cls: 'fg-bond-hi' }) + A(c, 'C', 'warn') + A(hc, 'H', 'hi');
      s += lonePair(c.x, c.y, 330, { dist: 21 }) + chg(c.x + 8, c.y - 30, '−');
      const hw = P(160, 888), ow = P(206, 888), hw2 = P(246, 888);
      s += B(hw, 'H', ow, 'O') + B(ow, 'O', hw2, 'H') + A(hw, 'H', 'hi') + A(ow, 'O') + A(hw2, 'H');
      s += lonePair(ow.x, ow.y, 90, { dist: 21 }) + lonePair(ow.x, ow.y, 270, { dist: 21 });
      s += curve(P(104, 896), P(145, 892), { bow: 10 });
      s += curve(P(180, 882), P(196, 872), { bow: -10 });
      s += tg(196, 970, 'R₂CH₂ + HO⁻: two H where the O was', 'good');
    }
    return s;
  },
  caption: 'The hydrazone after it forms. Follow the coral carbon: it gains one H in step 2 and a second in step 5.',
});

export default FIGURES;
