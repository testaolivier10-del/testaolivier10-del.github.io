/* Figures for the alkynes notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Alkynes sits in Alkenes & Alkynes, after skeletal structures, so carbon
   chains are drawn skeletal. Atoms a mechanism acts on (the H that leaves,
   the carbon that attacks, every heteroatom) are written out with labels.
   An sp carbon is always drawn with its two bonds at 180°. Figures that also
   appear in the lesson are 340 wide or less, stacked, and use only fg-lbl
   and fg-tag text. */
import { atom, bond, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { sk, polyRing } from '../lib/ochem-skeletal.mjs';
import { skDouble, plus } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const dir = (deg) => ({ x: Math.cos(rad(deg)), y: -Math.sin(rad(deg)) });
const r2 = (v) => Math.round(v * 100) / 100;

function ell(cx, cy, rx, ry, deg, cls, extra = '') {
  return `<ellipse class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" transform="rotate(${r2(-deg)} ${r2(cx)} ${r2(cy)})"${extra}></ellipse>`;
}
/* A p orbital: two lobes either side of the nucleus, one per phase colour. */
function pOrb(c, deg, len = 46, w = 13) {
  const d = dir(deg);
  const a = P(c.x + d.x * len * 0.52, c.y + d.y * len * 0.52);
  const b = P(c.x - d.x * len * 0.52, c.y - d.y * len * 0.52);
  return ell(a.x, a.y, len * 0.5, w, deg, 'fg-orb') + ell(b.x, b.y, len * 0.5, w, deg, 'fg-orb-alt');
}
/* The outline of one pi cloud: a dashed rounded box around two lobes. */
const cloud = (x1, y1, x2, y2) =>
  `<rect class="fg-dash-hi" x="${r2(x1)}" y="${r2(y1)}" width="${r2(x2 - x1)}" height="${r2(y2 - y1)}" rx="${r2(Math.min(22, (y2 - y1) / 2))}" fill="none"></rect>`;
const pill = (x, y, lbl, w = 42) =>
  `<rect class="fg-atom" x="${r2(x - w / 2)}" y="${r2(y - 14)}" width="${w}" height="28" rx="14"></rect>` + atom(x, y, lbl, { kind: 'point', size: 12 });
const dot = (x, y) => `<circle class="fg-lp" cx="${r2(x)}" cy="${r2(y)}" r="2.6"></circle>`;
const minus = (x, y) => text(x, y, '−', { cls: 'fg-warn', size: 16 });
const H = (p, kind) => atom(p.x, p.y, 'H', { r: 10, size: 11, ...(kind ? { kind } : {}) });
const Br = (p, kind) => atom(p.x, p.y, 'Br', { r: 14, ...(kind ? { kind } : {}) });
const C = (p, kind) => atom(p.x, p.y, 'C', { r: 13, ...(kind ? { kind } : {}) });
/* A skeletal triple bond between two vertices. */
const trip = (a, b, o = {}) => bond(a, b, { order: 3, rFrom: o.rFrom ?? 0, rTo: o.rTo ?? 0, gap: 3.2, cls: o.cls });
/* A plain double bond between two vertices (both lines full length). */
const dbl = (a, b, o = {}) => bond(a, b, { order: 2, rFrom: o.rFrom ?? 0, rTo: o.rTo ?? 0, gap: 3, cls: o.cls });
const lbl = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-lbl', size: 13, ...o });
const tg = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-tag', size: 11, ...o });
/* A label with an italic prefix, e.g. <i>cis</i> alkene. */
const italicTag = (x, y, it, rest, cls = 'fg-tag', anchor = 'middle') =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}" font-size="11"><tspan font-style="italic">${it}</tspan>${rest}</text>`;
/* Reaction arrow with a reagent above and a note below. */
function rxn(x1, x2, y, above, below) {
  let s = arrow(P(x1, y), P(x2, y));
  if (above) s += tg((x1 + x2) / 2, y - 10, above);
  if (below) s += tg((x1 + x2) / 2, y + 20, below, { cls: 'fg-tag-mut' });
  return s;
}
/* Equilibrium arrows: a long forward half-arrow over a short back one. */
function equil(x1, x2, y) {
  return arrow(P(x1, y - 4), P(x2, y - 4)) + arrow(P(x2 - 8, y + 4), P(x1 + 8, y + 4), { muted: true });
}
/* A resonance arrow: one line with a head at each end. */
function resArrow(x1, x2, y) {
  return arrow(P((x1 + x2) / 2, y), P(x2, y)) + arrow(P((x1 + x2) / 2, y), P(x1, y));
}
/* Downward reaction arrow for stacked lesson figures, reagent to its right. */
function down(x, y1, y2, above, below) {
  let s = arrow(P(x, y1), P(x, y2));
  if (above) s += tg(x + 12, (y1 + y2) / 2 - 2, above, { anchor: 'start' });
  if (below) s += tg(x + 12, (y1 + y2) / 2 + 14, below, { anchor: 'start', cls: 'fg-tag-mut' });
  return s;
}

/* -------------------------------------------------------- alkyne-two-pi ---
   The sp section's claim is two pi bonds at right angles, around a straight
   sigma framework. Propyne, taken apart in three rows. */
FIGURES.push({
  id: 'alkyne-two-pi',
  section: 'alkynes',
  anchor: 'takes ethyne apart the same way.</p>',
  lessons: ['alkynes'],
  viewBox: '0 0 340 440',
  alt: 'Propyne, CH3–C≡C–H, in three rows. Row 1: the sigma framework, with the CH3 group, both sp carbons and the hydrogen in one straight line and a 180 degree mark at each sp carbon. Row 2: side view of the first pi bond, a p orbital standing up and down on each sp carbon, with a dashed outline around the two upper lobes and another around the two lower lobes. Row 3: the view straight down the triple-bond axis, with four lobes around the carbon: up and down for the first pi bond, left and right for the second, at right angles to each other.',
  build() {
    let s = '';
    const row = (cy) => ({ M: P(44, cy), C1: P(128, cy), C2: P(212, cy), H: P(292, cy) });
    // row 1: sigma framework
    s += tg(10, 22, 'σ bonds: sp orbitals 180° apart', { anchor: 'start' });
    const a = row(66);
    s += bond(a.M, a.C1, { rFrom: 21, rTo: 13 }) + bond(a.C1, a.C2, { rFrom: 13, rTo: 13 }) + bond(a.C2, a.H, { rFrom: 13, rTo: 10 });
    s += pill(a.M.x, a.M.y, 'CH₃') + C(a.C1) + C(a.C2) + H(a.H);
    for (const c of [a.C1, a.C2]) {
      s += `<path class="fg-dash" d="M${c.x - 22} ${c.y} A 22 22 0 0 0 ${c.x + 22} ${c.y}" fill="none"></path>`;
      s += tg(c.x, c.y + 40, '180°');
    }
    s += rule(10, 124, 330, 124);
    // row 2: first pi, side view
    s += tg(10, 146, 'first π: p orbitals above and below', { anchor: 'start' });
    const b = row(214);
    s += bond(b.M, b.C1, { rFrom: 21, rTo: 13 }) + bond(b.C2, b.H, { rFrom: 13, rTo: 10 });
    s += bond(b.C1, b.C2, { rFrom: 13, rTo: 13, cls: 'fg-bond-soft' });
    s += pOrb(b.C1, 90, 46, 13) + pOrb(b.C2, 90, 46, 13);
    s += cloud(106, 214 - 54, 234, 214 - 8) + cloud(106, 214 + 8, 234, 214 + 54);
    s += pill(b.M.x, b.M.y, 'CH₃') + C(b.C1) + C(b.C2) + H(b.H);
    s += rule(10, 284, 330, 284);
    // row 3: end-on view
    s += tg(10, 306, 'looking straight down the C≡C axis', { anchor: 'start' });
    const c = P(150, 370);
    s += pOrb(c, 90, 50, 13) + pOrb(c, 0, 50, 13);
    s += C(c);
    s += tg(178, 330, 'first π', { anchor: 'start' });
    s += tg(206, 360, 'second π', { anchor: 'start' });
    s += tg(10, 432, 'the other atoms sit straight behind', { anchor: 'start', cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Rows 1 and 2 are side views; row 3 turns the molecule to look along the axis. There the second π bond appears, with its lobes pointing left and right, at 90° to the first.',
});

/* ------------------------------------------------------ cyclooctyne-bend ---
   "A straight line is hard to fit into a ring" is a shape claim. */
FIGURES.push({
  id: 'cyclooctyne-bend',
  section: 'alkynes',
  anchor: 'bent well short of 180°.</p>',
  viewBox: '0 0 340 230',
  alt: 'Cyclooctyne drawn as an eight-membered ring with a triple bond along its top edge. At each end of the triple bond, a dashed line continues straight on, showing where a 180 degree bond would point; the ring bond instead bends down and away from it.',
  build() {
    let s = '';
    const A = P(140, 70), B = P(200, 70);
    const Ap = P(94, 89), Bp = P(246, 89);
    const ring = [A, B, Bp, P(260, 138), P(218, 180), P(122, 180), P(80, 138), Ap];
    // ring single bonds (skip the triple-bond edge A-B)
    for (let i = 1; i < ring.length; i++) s += sk(ring[i], ring[(i + 1) % ring.length]);
    s += trip(A, B);
    // where a straight 180° bond would point
    s += `<line class="fg-dash" x1="${A.x}" y1="${A.y}" x2="${A.x - 62}" y2="${A.y}"></line>`;
    s += `<line class="fg-dash" x1="${B.x}" y1="${B.y}" x2="${B.x + 62}" y2="${B.y}"></line>`;
    s += tg(40, 58, '180° would', { anchor: 'middle' });
    s += tg(40, 72, 'point here', { anchor: 'middle' });
    s += tg(300, 58, '180° would', { anchor: 'middle' });
    s += tg(300, 72, 'point here', { anchor: 'middle' });
    s += tg(170, 30, 'cyclooctyne, C₈H₁₂');
    s += tg(170, 216, 'the ring pulls both ends down: strain', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Compare each ring bond at the triple bond with the dashed line beside it.',
});

/* --------------------------------------------------------- c4h6-isomers ---
   Two degrees of unsaturation, three ways: the formula cannot tell them
   apart. */
FIGURES.push({
  id: 'c4h6-isomers',
  section: 'alkynes',
  anchor: 'is for.</p>',
  viewBox: '0 0 760 170',
  alt: 'Three isomers of formula C4H6 drawn skeletal: but-1-yne with a triple bond, buta-1,3-diene with two double bonds, and cyclobutene with a ring and one double bond.',
  build() {
    let s = '';
    // but-1-yne: C1≡C2 linear with C3, then C4 bent
    const a1 = P(70, 80), a2 = P(120, 80), a3 = P(170, 80), a4 = P(200, 58);
    s += trip(a1, a2) + sk(a2, a3) + sk(a3, a4);
    s += lbl(140, 124, 'but-1-yne');
    s += tg(140, 144, 'one triple bond', { cls: 'fg-tag-mut' });
    // buta-1,3-diene
    const b = [P(320, 88), P(350, 66), P(390, 66), P(420, 44)];
    s += dbl(b[0], b[1]) + sk(b[1], b[2]) + dbl(b[2], b[3]);
    s += lbl(370, 124, 'buta-1,3-diene');
    s += tg(370, 144, 'two double bonds', { cls: 'fg-tag-mut' });
    // cyclobutene
    const q = [P(560, 50), P(600, 50), P(600, 90), P(560, 90)];
    s += polyRing(q) + bond(P(564, 57), P(596, 57), { rFrom: 0, rTo: 0 });
    s += lbl(580, 124, 'cyclobutene');
    s += tg(580, 144, 'one ring, one double bond', { cls: 'fg-tag-mut' });
    s += tg(380, 18, 'all three are C₄H₆: two degrees of unsaturation each');
    return s;
  },
  caption: 'Same formula, three different skeletons.',
});

/* -------------------------------------------------- acetylide-formation ---
   Replaces a hand-written figure. A proton transfer is two arrows: the
   base's lone pair to H, and the C–H bond back onto carbon. */
FIGURES.push({
  id: 'acetylide-formation',
  section: 'alkynes',
  anchor: 'Sodium hydride, NaH, works too.</p>',
  viewBox: '0 0 760 170',
  alt: 'Propyne plus the amide ion. One curved arrow runs from a lone pair on the amide nitrogen to the terminal hydrogen of propyne; a second runs from the C–H bond onto the sp carbon. Equilibrium arrows lead to the propynide anion, whose end carbon now carries a lone pair and a negative charge, plus ammonia. Propyne is labeled pKa 25 and ammonia pKa 38.',
  build() {
    let s = '';
    const y = 104;
    const M = P(44, y), C1 = P(122, y), C2 = P(196, y), Hh = P(264, y);
    s += bond(M, C1, { rFrom: 21, rTo: 13 }) + trip(C1, C2, { rFrom: 13, rTo: 13 }) + bond(C2, Hh, { rFrom: 13, rTo: 10, cls: 'fg-bond-hi' });
    s += pill(M.x, M.y, 'CH₃') + C(C1) + C(C2, 'hi') + H(Hh, 'warn');
    s += tg(150, 30, 'propyne');
    s += tg(264, 150, 'pKa 25', { cls: 'fg-tag-warn' });
    // amide ion
    const N = P(348, y);
    const h1 = P(378, 78), h2 = P(378, 130);
    s += bond(N, h1, { rFrom: 14, rTo: 10 }) + bond(N, h2, { rFrom: 14, rTo: 10 });
    s += atom(N.x, N.y, 'N', { r: 14 }) + H(h1) + H(h2);
    s += lonePair(N.x, N.y, 180, { dist: 22 });
    s += lonePair(N.x, N.y, 90, { dist: 22 });
    s += minus(330, 82);
    s += tg(348, 30, 'amide, from NaNH₂');
    // arrows: lone pair -> H ; C–H bond -> C
    s += curve(P(324, 98), P(272, 92), { bow: 18 });
    s += curve(P(232, 110), P(204, 118), { bow: -12 });
    // equilibrium
    s += equil(412, 468, y);
    // products: propynide + NH3
    const pM = P(512, y), pC1 = P(588, y), pC2 = P(660, y);
    s += bond(pM, pC1, { rFrom: 21, rTo: 13 }) + trip(pC1, pC2, { rFrom: 13, rTo: 13 });
    s += pill(pM.x, pM.y, 'CH₃') + C(pC1) + C(pC2, 'hi');
    s += lonePair(pC2.x, pC2.y, 0, { dist: 21 });
    s += minus(662, 80);
    s += tg(588, 30, 'propynide anion');
    s += lbl(726, y + 5, '+ NH₃');
    s += tg(734, 150, 'pKa 38', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Two arrows, as in every proton transfer: the amide lone pair forms the new N–H bond, and the old C–H pair stays behind on the sp carbon.',
});

/* --------------------------------------------------------- acetylide-sn2 ---
   The worked example, drawn: backside attack, and the new C–C bond. */
FIGURES.push({
  id: 'acetylide-sn2',
  section: 'alkynes',
  anchor: 'with whatever two groups you like on either end.</p>\n</div>',
  viewBox: '0 0 760 220',
  alt: 'Sodium acetylide, H–C≡C with a lone pair and negative charge on the end carbon, attacks the CH2 carbon of 1-bromobutane from the side opposite the bromine. A second arrow moves the C–Br bond onto bromine. The product is hex-1-yne, with the new carbon–carbon bond highlighted, plus sodium bromide.',
  build() {
    let s = '';
    const y = 150;
    const Hh = P(40, y), C1 = P(96, y), C2 = P(160, y);
    s += bond(Hh, C1, { rFrom: 10, rTo: 13 }) + trip(C1, C2, { rFrom: 13, rTo: 13 });
    s += H(Hh) + C(C1) + C(C2, 'hi');
    s += lonePair(C2.x, C2.y, 0, { dist: 21 });
    s += minus(162, 126);
    s += tg(100, 60, 'sodium acetylide');
    s += tg(100, 200, 'Na⁺ counterion', { cls: 'fg-tag-mut' });
    // 1-bromobutane: labeled CH2 carbon, Br to the right, chain upward
    const Ca = P(262, y), Brp = P(332, y);
    s += bond(Ca, Brp, { rFrom: 13, rTo: 14, cls: 'fg-bond-hi' });
    s += C(Ca, 'warn') + Br(Brp);
    s += lonePair(Brp.x, Brp.y, 0, { dist: 22 }) + lonePair(Brp.x, Brp.y, 90, { dist: 22 }) + lonePair(Brp.x, Brp.y, 270, { dist: 22 });
    const c2 = P(262, 104), c3 = P(292, 80), c4 = P(292, 40);
    s += bond(Ca, c2, { rFrom: 13, rTo: 0 }) + sk(c2, c3) + sk(c3, c4);
    s += tg(320, 30, '1-bromobutane', { anchor: 'start' });
    // arrows
    s += curve(P(186, 144), P(246, 142), { bow: -20 });
    s += curve(P(297, 158), P(330, 172), { bow: 12 });
    // reaction arrow
    s += arrow(P(390, y), P(440, y));
    // hex-1-yne
    const p1 = P(466, y), p2 = P(522, y), p3 = P(578, y), p4 = P(606, y - 22), p5 = P(634, y), p6 = P(662, y - 22);
    s += trip(p1, p2) + sk(p2, p3, true) + sk(p3, p4) + sk(p4, p5) + sk(p5, p6);
    s += tg(550, 176, 'new C–C bond', { cls: 'fg-tag-good' });
    s += tg(564, 60, 'hex-1-yne');
    s += lbl(712, y + 5, '+ NaBr');
    return s;
  },
  caption: 'Follow the two arrows: the lone pair goes to carbon, and the C–Br bond goes to bromine. The highlighted bond in the product is the one the reaction made.',
});

/* --------------------------------------------------------- acetylide-e2 ---
   The pitfall, drawn: on a tertiary halide the acetylide acts as a base. */
FIGURES.push({
  id: 'acetylide-e2',
  section: 'alkynes',
  anchor: 'install the branch a different way.</div>',
  viewBox: '0 0 760 250',
  alt: 'Sodium acetylide and tert-butyl bromide. Three curved arrows: the acetylide lone pair takes a hydrogen from one methyl group, that C–H bond becomes a new C=C pi bond, and the C–Br bond moves onto bromine. The products are 2-methylpropene, acetylene and bromide. No carbon–carbon bond to the acetylide forms.',
  build() {
    let s = '';
    const y = 96;
    const Hh = P(36, y), C1 = P(90, y), C2 = P(150, y);
    s += bond(Hh, C1, { rFrom: 10, rTo: 13 }) + trip(C1, C2, { rFrom: 13, rTo: 13 });
    s += H(Hh) + C(C1) + C(C2, 'hi');
    s += lonePair(C2.x, C2.y, 0, { dist: 21 });
    s += minus(152, 72);
    s += tg(94, 30, 'acetylide');
    // tert-butyl bromide with one methyl written out
    const Hb = P(222, y), Cb = P(268, y), Ca = P(318, 126), Brp = P(318, 182);
    s += bond(Hb, Cb, { rFrom: 10, rTo: 13, cls: 'fg-bond-hi' }) + bond(Cb, Ca, { rFrom: 13, rTo: 13 });
    s += bond(Ca, Brp, { rFrom: 13, rTo: 14, cls: 'fg-bond-hi' });
    s += bond(Ca, P(368, 100), { rFrom: 13, rTo: 0 }) + bond(Ca, P(368, 152), { rFrom: 13, rTo: 0 });
    s += H(Hb, 'warn') + C(Cb) + C(Ca, 'warn') + Br(Brp);
    s += lonePair(Brp.x, Brp.y, 180, { dist: 22 }) + lonePair(Brp.x, Brp.y, 90, { dist: 22 }) + lonePair(Brp.x, Brp.y, 0, { dist: 22 });
    s += italicTag(300, 30, 'tert', '-butyl bromide');
    // arrows: lp -> H ; C–H -> C–C ; C–Br -> Br
    s += curve(P(176, 90), P(214, 88), { bow: -12 });
    s += curve(P(245, 102), P(290, 116), { bow: 16 });
    s += curve(P(326, 152), P(334, 170), { bow: -12 });
    // arrow
    s += arrow(P(400, 110), P(450, 110));
    s += tg(425, 98, 'E2');
    // products: 2-methylpropene, acetylene, bromide
    const e1 = P(496, 110), e2 = P(540, 110);
    s += dbl(e1, e2) + sk(e2, P(562, 86)) + sk(e2, P(562, 134));
    s += tg(518, 164, '2-methylpropene');
    s += lbl(650, 115, '+ HC≡CH');
    s += tg(660, 164, 'the alkyne, back');
    s += lbl(736, 115, '+ Br⁻');
    s += tg(380, 238, 'no new C–C bond', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'A tertiary carbon is too crowded to attack from behind, so the acetylide takes the easier target, a hydrogen on the next carbon.',
});

/* -------------------------------------------------- double-elimination ---
   Vicinal and geminal dihalides, each through a vinyl halide to the
   alkyne. The bonds that break in each E2 are highlighted. */
FIGURES.push({
  id: 'double-elimination',
  section: 'alkynes',
  anchor: 'the second gives the triple bond.</p>',
  viewBox: '0 0 760 460',
  alt: 'Two rows of double elimination with sodium amide. Top row: 2,3-dibromobutane, with bromines on neighboring carbons, loses HBr to give the vinyl halide 2-bromobut-2-ene, which loses a second HBr to give but-2-yne. Bottom row: 3,3-dibromopentane, with both bromines on one carbon, loses HBr to give 3-bromopent-2-ene, which loses a second HBr to give pent-2-yne. In each structure, the C–H and C–Br bonds about to break are highlighted.',
  build() {
    let s = '';
    // ---- row 1: vicinal
    s += tg(10, 22, 'vicinal: Br on neighboring carbons', { anchor: 'start' });
    {
      const c1 = P(34, 142), c2 = P(78, 118), c3 = P(122, 142), c4 = P(166, 118);
      const b2 = P(78, 70), h2 = P(40, 90), b3 = P(122, 190);
      s += sk(c1, c2) + sk(c2, c3) + sk(c3, c4);
      s += bond(c2, b2, { rFrom: 0, rTo: 14 }) + bond(c2, h2, { rFrom: 0, rTo: 10, cls: 'fg-bond-hi' }) + bond(c3, b3, { rFrom: 0, rTo: 14, cls: 'fg-bond-hi' });
      s += Br(b2) + H(h2, 'warn') + Br(b3, 'warn');
      s += lbl(100, 232, '2,3-dibromobutane');
    }
    s += rxn(196, 262, 130, 'NaNH₂', '− HBr');
    {
      const c2 = P(318, 130), c3 = P(368, 130);
      const c1 = P(294, 170), b2 = P(294, 88), c4 = P(392, 88), h3 = P(392, 172);
      s += dbl(c2, c3) + sk(c2, c1) + sk(c3, c4);
      s += bond(c2, b2, { rFrom: 0, rTo: 14, cls: 'fg-bond-hi' }) + bond(c3, h3, { rFrom: 0, rTo: 10, cls: 'fg-bond-hi' });
      s += Br(b2, 'warn') + H(h3, 'warn');
      s += lbl(343, 232, '2-bromobut-2-ene');
      s += tg(343, 252, 'a vinyl halide', { cls: 'fg-tag-mut' });
    }
    s += rxn(430, 496, 130, 'NaNH₂', '− HBr');
    {
      const c1 = P(530, 130), c2 = P(580, 130), c3 = P(640, 130), c4 = P(690, 130);
      s += sk(c1, c2) + trip(c2, c3) + sk(c3, c4);
      s += lbl(610, 232, 'but-2-yne');
    }
    s += rule(10, 270, 750, 270);
    // ---- row 2: geminal
    s += tg(10, 292, 'geminal: both Br on one carbon', { anchor: 'start' });
    {
      const c1 = P(22, 372), c2 = P(62, 350), c3 = P(102, 372), c4 = P(142, 350), c5 = P(176, 372);
      const h2 = P(62, 312), b3a = P(78, 414), b3b = P(128, 414);
      s += sk(c1, c2) + sk(c2, c3) + sk(c3, c4) + sk(c4, c5);
      s += bond(c2, h2, { rFrom: 0, rTo: 10, cls: 'fg-bond-hi' });
      s += bond(c3, b3a, { rFrom: 0, rTo: 14, cls: 'fg-bond-hi' }) + bond(c3, b3b, { rFrom: 0, rTo: 14 });
      s += H(h2, 'warn') + Br(b3a, 'warn') + Br(b3b);
      s += lbl(100, 448, '3,3-dibromopentane');
    }
    s += rxn(196, 262, 366, 'NaNH₂', '− HBr');
    {
      const c2 = P(318, 366), c3 = P(368, 366);
      const c1 = P(294, 326), h2 = P(294, 408), b3 = P(392, 324), c4 = P(392, 408), c5 = P(420, 430);
      s += dbl(c2, c3) + sk(c2, c1) + sk(c3, c4) + sk(c4, c5);
      s += bond(c2, h2, { rFrom: 0, rTo: 10, cls: 'fg-bond-hi' }) + bond(c3, b3, { rFrom: 0, rTo: 14, cls: 'fg-bond-hi' });
      s += H(h2, 'warn') + Br(b3, 'warn');
      s += lbl(350, 448, '3-bromopent-2-ene');
    }
    s += rxn(446, 506, 366, 'NaNH₂', '− HBr');
    {
      const c1 = P(530, 366), c2 = P(574, 366), c3 = P(634, 366), c4 = P(678, 366), c5 = P(706, 344);
      s += sk(c1, c2) + trip(c2, c3) + sk(c3, c4) + sk(c4, c5);
      s += lbl(616, 448, 'pent-2-yne');
    }
    return s;
  },
  caption: 'Each arrow is one E2. The highlighted H and Br are the pair that leaves in the next step.',
});

/* ---------------------------------------------------- alkyne-hbr-twice ---
   Both HBr additions, then why the second bromine lands on C2. */
FIGURES.push({
  id: 'alkyne-hbr-twice',
  section: 'alkynes',
  anchor: 'a primary cation on C1 with no such help.</p>',
  viewBox: '0 0 760 400',
  alt: 'Top row: but-1-yne adds one HBr to give 2-bromobut-1-ene, then a second HBr to give 2,2-dibromobutane, with both bromines on C2. Bottom left: the cation formed when H+ adds to C1 of the vinyl bromide, with the positive charge on C2 beside the bromine; a curved arrow from a bromine lone pair forms a C=Br pi bond, and a second resonance form shows the positive charge on bromine. Bottom right: the alternative cation from adding H+ to C2, a primary cation on C1 with no neighboring lone pair.',
  build() {
    let s = '';
    const num = (p, v, dy = -14) => tg(p.x, p.y + dy, v, { cls: 'fg-tag-mut' });
    // ---- row 1
    {
      const c1 = P(30, 100), c2 = P(80, 100), c3 = P(130, 100), c4 = P(158, 78);
      s += trip(c1, c2) + sk(c2, c3) + sk(c3, c4);
      s += num(c1, '1') + num(c2, '2');
      s += lbl(96, 150, 'but-1-yne');
    }
    s += rxn(186, 244, 96, 'HBr');
    {
      const c1 = P(272, 122), c2 = P(310, 100), c3 = P(350, 122), c4 = P(388, 100), b = P(310, 54);
      s += dbl(c1, c2) + sk(c2, c3) + sk(c3, c4);
      s += bond(c2, b, { rFrom: 0, rTo: 14 }) + Br(b);
      s += tg(258, 128, '1', { cls: 'fg-tag-mut' }) + num(c2, '2', 22);
      s += lbl(330, 150, '2-bromobut-1-ene');
    }
    s += rxn(420, 478, 96, 'HBr');
    {
      const c1 = P(510, 122), c2 = P(550, 100), c3 = P(590, 122), c4 = P(628, 100);
      const ba = P(522, 56), bb = P(578, 56);
      s += sk(c1, c2) + sk(c2, c3) + sk(c3, c4);
      s += bond(c2, ba, { rFrom: 0, rTo: 14 }) + bond(c2, bb, { rFrom: 0, rTo: 14 }) + Br(ba) + Br(bb);
      s += num(c2, '2', 24);
      s += lbl(570, 150, '2,2-dibromobutane');
      s += tg(570, 170, 'geminal: both Br on C2', { cls: 'fg-tag-good' });
    }
    s += rule(10, 190, 750, 190);
    // ---- row 2, left: the cation on C2, and its resonance form
    s += panel(10, 202, 466, 190, { kind: 'good' });
    s += tg(243, 224, 'H⁺ adds to C1: the cation sits on C2, beside Br', { cls: 'fg-tag-good' });
    {
      const c2 = P(94, 322), c1 = P(58, 344), c3 = P(130, 344), c4 = P(166, 322), b = P(94, 268);
      s += sk(c2, c1) + sk(c2, c3) + sk(c3, c4);
      s += bond(c2, b, { rFrom: 0, rTo: 14 }) + Br(b);
      s += lonePair(b.x, b.y, 180, { dist: 22 }) + lonePair(b.x, b.y, 270, { dist: 22 }) + lonePair(b.x, b.y, 0, { dist: 22 });
      s += plus(112, 316);
      s += curve(P(70, 262), P(88, 296), { bow: 16 });
      s += num(c2, '2', 30);
    }
    s += resArrow(192, 236, 312);
    {
      const c2 = P(316, 322), c1 = P(280, 344), c3 = P(352, 344), c4 = P(388, 322), b = P(316, 268);
      s += sk(c2, c1) + sk(c2, c3) + sk(c3, c4);
      s += bond(c2, b, { order: 2, rFrom: 0, rTo: 14, gap: 3 }) + Br(b);
      s += lonePair(b.x, b.y, 180, { dist: 22 }) + lonePair(b.x, b.y, 0, { dist: 22 });
      s += plus(338, 256);
    }
    s += tg(243, 382, 'a Br lone pair shares the charge', { cls: 'fg-tag-mut' });
    // ---- row 2, right: the primary cation that does not form
    s += panel(488, 202, 262, 190, { kind: 'warn' });
    s += tg(619, 224, 'H⁺ adds to C2 instead', { cls: 'fg-tag-warn' });
    {
      const c1 = P(548, 300), c2 = P(590, 322), c3 = P(632, 300), c4 = P(674, 322), b = P(590, 368);
      s += sk(c1, c2) + sk(c2, c3) + sk(c3, c4);
      s += bond(c2, b, { rFrom: 0, rTo: 14 }) + Br(b);
      s += plus(534, 292);
      s += num(c1, '1');
    }
    s += tg(619, 262, 'primary cation on C1, no help', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Top: the two additions. Bottom: the two cations the second H⁺ could make.',
});

/* -------------------------------------------------------- alkyne-br2 ---
   Anti addition of Br2 to 2-butyne through the bridged ion, then the
   second equivalent. */
FIGURES.push({
  id: 'alkyne-br2',
  section: 'alkynes',
  anchor: 'the tetrahalide, 2,2,3,3-tetrabromobutane.</p>',
  viewBox: '0 0 760 360',
  alt: 'Top row: 2-butyne reacts with Br2 to give a bridged ion, a bromine with a positive charge bonded to both carbons of a C=C above the axis. Bromide approaches from below and attacks one carbon, and a curved arrow moves the bridge bond onto the upper bromine. The product, (E)-2,3-dibromobut-2-ene, has one bromine above the double bond and one below: trans. Bottom row: that dibromoalkene adds a second Br2 to give 2,2,3,3-tetrabromobutane.',
  build() {
    let s = '';
    // ---- row 1
    {
      const c1 = P(20, 140), c2 = P(64, 140), c3 = P(124, 140), c4 = P(168, 140);
      s += sk(c1, c2) + trip(c2, c3) + sk(c3, c4);
      s += lbl(94, 180, '2-butyne');
    }
    s += rxn(190, 240, 136, 'Br₂');
    {
      const c2 = P(300, 140), c3 = P(356, 140), b = P(328, 84);
      s += dbl(c2, c3) + sk(c2, P(262, 140)) + sk(c3, P(394, 140));
      s += bond(c2, b, { rFrom: 0, rTo: 14 }) + bond(c3, b, { rFrom: 0, rTo: 14 });
      s += Br(b) + plus(350, 72);
      // bromide from below
      const bm = P(356, 214);
      s += Br(bm) + minus(378, 240);
      s += lonePair(bm.x, bm.y, 180, { dist: 22 }) + lonePair(bm.x, bm.y, 270, { dist: 22 }) + lonePair(bm.x, bm.y, 0, { dist: 22 });
      s += curve(P(356, 186), P(358, 150), { bow: 10 });
      s += curve(P(348, 116), P(342, 92), { bow: -14 });
      s += tg(328, 36, 'bridged ion');
      s += tg(430, 222, 'Br⁻ attacks', { anchor: 'start', cls: 'fg-tag-mut' });
      s += tg(430, 238, 'from below', { anchor: 'start', cls: 'fg-tag-mut' });
    }
    s += rxn(500, 548, 136, '');
    {
      const c2 = P(608, 140), c3 = P(660, 140);
      const b2 = P(584, 96), c1 = P(584, 184), b3 = P(684, 184), c4 = P(684, 96);
      s += dbl(c2, c3) + sk(c2, c1) + sk(c3, c4);
      s += bond(c2, b2, { rFrom: 0, rTo: 14 }) + bond(c3, b3, { rFrom: 0, rTo: 14 });
      s += Br(b2) + Br(b3);
      s += italicTag(634, 36, 'trans', ': Br above and Br below', 'fg-tag-good');
      s += `<text class="fg-lbl" x="634" y="226" text-anchor="middle" font-size="13">(<tspan font-style="italic">E</tspan>)-2,3-dibromobut-2-ene</text>`;
    }
    s += rule(10, 258, 750, 258);
    // ---- row 2: second equivalent
    s += tg(10, 280, 'a second equivalent', { anchor: 'start' });
    s += `<text class="fg-lbl" x="190" y="318" text-anchor="middle" font-size="13">(<tspan font-style="italic">E</tspan>)-2,3-dibromobut-2-ene</text>`;
    s += rxn(300, 372, 314, 'Br₂');
    {
      const c1 = P(420, 330), c2 = P(460, 312), c3 = P(510, 312), c4 = P(550, 330);
      s += sk(c1, c2) + sk(c2, c3) + sk(c3, c4);
      const bs = [[c2, P(440, 276)], [c2, P(460, 350)], [c3, P(530, 276)], [c3, P(510, 350)]];
      for (const [c, b] of bs) s += bond(c, b, { rFrom: 0, rTo: 14 }) + Br(b);
      s += lbl(660, 318, '2,2,3,3-tetrabromobutane', { anchor: 'middle' });
    }
    return s;
  },
  caption: 'Top row: follow the bromide in from below the bridge. Bottom row: the second equivalent.',
});

/* ------------------------------------------------ alkyne-reduction-fork ---
   One internal alkyne, three reagents, three products. */
FIGURES.push({
  id: 'alkyne-reduction-fork',
  section: 'alkynes',
  anchor: 'runs on to the alkane.</p>',
  alt: 'One internal alkyne, 2-butyne, with three arrows leading to three different products: hydrogen over Lindlar catalyst gives the cis alkene with both methyls on the same side; sodium in liquid ammonia gives the trans alkene with the methyls on opposite sides; hydrogen over ordinary palladium gives butane.',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    const t1 = P(70, 170), t2 = P(130, 170);
    s += trip(t1, t2) + sk(P(26, 170), t1) + sk(t2, P(174, 170));
    s += lbl(100, 138, '2-butyne');
    const outcome = (y, reagent, sub, mode, nameIt, nameRest, why, good) => {
      let g = bond(P(192, 170), P(236, y), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
      g += arrow(P(242, y), P(322, y));
      g += tg(282, y - 12, reagent);
      g += tg(282, y + 22, sub, { cls: 'fg-tag-mut' });
      const a = P(392, y), b = P(448, y);
      if (mode === 'alkane') {
        g += sk(P(352, y + 22), a) + sk(a, b) + sk(b, P(488, y + 22));
      } else {
        g += dbl(a, b);
        if (mode === 'cis') g += sk(P(356, y - 22), a) + sk(b, P(484, y - 22));
        else g += sk(P(356, y + 22), a) + sk(b, P(484, y - 22));
      }
      g += nameIt ? italicTag(512, y - 2, nameIt, nameRest, good ? 'fg-tag-good' : 'fg-tag', 'start')
                  : tg(512, y - 2, nameRest, { anchor: 'start', cls: good ? 'fg-tag-good' : 'fg-tag' });
      g += tg(512, y + 16, why, { anchor: 'start', cls: 'fg-tag-mut' });
      return g;
    };
    s += outcome(62, 'H₂, Lindlar', 'Pd, Pb, quinoline', 'cis', 'cis', ' (Z) alkene', 'both H from one metal surface', true);
    s += outcome(170, 'Na, NH₃ (l)', 'e⁻, H⁺, e⁻, H⁺', 'trans', 'trans', ' (E) alkene', 'the vinyl anion sets the shape', true);
    s += outcome(280, 'H₂, Pd/C', 'no poison', 'alkane', '', 'butane', 'both pi bonds gone', false);
    return s;
  },
  caption: 'Each row is one set of conditions applied to the same 2-butyne.',
});

/* Lesson copy of the fork: stacked, 340 wide. */
FIGURES.push({
  id: 'l-reduction-fork',
  lessons: ['alkynes'],
  alt: '2-butyne at the top. Below it, three rows: H2 with Lindlar catalyst gives the cis alkene; sodium in liquid ammonia gives the trans alkene; H2 with Pd on carbon gives butane.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    const t1 = P(140, 40), t2 = P(200, 40);
    s += trip(t1, t2) + sk(P(96, 40), t1) + sk(t2, P(244, 40));
    s += tg(170, 18, '2-butyne');
    s += rule(10, 66, 330, 66);
    const row = (y, reagent, mode, it, rest, good) => {
      let g = tg(10, y - 6, reagent, { anchor: 'start' });
      g += arrow(P(12, y + 8), P(96, y + 8));
      const a = P(152, y + 8), b = P(204, y + 8);
      if (mode === 'alkane') g += sk(P(116, y + 28), a) + sk(a, b) + sk(b, P(240, y + 28));
      else {
        g += dbl(a, b);
        if (mode === 'cis') g += sk(P(120, y - 12), a) + sk(b, P(236, y - 12));
        else g += sk(P(120, y + 28), a) + sk(b, P(236, y - 12));
      }
      g += it ? italicTag(330, y + 12, it, rest, good ? 'fg-tag-good' : 'fg-tag', 'end')
              : tg(330, y + 12, rest, { anchor: 'end' });
      return g;
    };
    s += row(104, 'H₂, Lindlar', 'cis', 'cis', ' alkene', true);
    s += rule(10, 150, 330, 150);
    s += row(194, 'Na, NH₃ (l)', 'trans', 'trans', ' alkene', true);
    s += rule(10, 240, 330, 240);
    s += row(284, 'H₂, Pd/C', 'alkane', '', 'butane', false);
    return s;
  },
  caption: 'One alkyne, three reagents, three products.',
});

/* --------------------------------------------- dissolving-metal-steps ---
   The four steps of Na/NH3, with the geometry-setting vinyl anion drawn. */
FIGURES.push({
  id: 'dissolving-metal-steps',
  section: 'alkynes',
  anchor: 'the <i>trans</i> arrangement already locked in.</li>\n</ol>',
  viewBox: '0 0 760 440',
  alt: 'The four steps of the sodium–ammonia reduction of 2-butyne. Top row: 2-butyne gains an electron to give a radical anion, one carbon with a single dot and the other with a lone pair and negative charge; that carbon takes a proton from ammonia, giving a vinyl radical, shown as two bent shapes that interconvert quickly. Bottom row: a second electron gives the vinyl anion, with the two methyl groups on opposite sides; it takes a second proton from ammonia to give trans-2-butene.',
  build() {
    let s = '';
    // ---- row 1
    s += tg(10, 22, 'steps 1 and 2', { anchor: 'start' });
    {
      const c1 = P(18, 120), c2 = P(58, 120), c3 = P(114, 120), c4 = P(154, 120);
      s += sk(c1, c2) + trip(c2, c3) + sk(c3, c4);
      s += lbl(86, 176, '2-butyne');
    }
    s += rxn(172, 222, 116, '1  e⁻');
    {
      // radical anion, trans-bent
      const c2 = P(276, 120), c3 = P(326, 120);
      s += dbl(c2, c3) + sk(c2, P(252, 160)) + sk(c3, P(350, 80));
      s += dot(262, 94);
      s += lonePair(c3.x, c3.y, 60, { dist: 22 }) + minus(356, 150);
      s += lbl(300, 196, 'radical anion');
    }
    s += rxn(378, 432, 116, '2  H⁺', 'from NH₃');
    {
      // vinyl radical, two bent shapes
      const shape = (x, up) => {
        const c2 = P(x, 120), c3 = P(x + 48, 120), h = P(x + 70, 158), m4 = P(x + 70, 82);
        let g = dbl(c2, c3) + sk(c3, m4) + bond(c3, h, { rFrom: 0, rTo: 10 }) + H(h);
        g += up ? sk(c2, P(x - 24, 158)) + dot(x - 18, 92) : sk(c2, P(x - 24, 82)) + dot(x - 18, 148);
        return g;
      };
      s += shape(478, true);
      s += equil(572, 608, 120);
      s += shape(646, false);
      s += lbl(612, 196, 'vinyl radical');
      s += tg(612, 216, 'flips between shapes too fast to matter', { cls: 'fg-tag-mut' });
    }
    s += rule(10, 236, 750, 236);
    // ---- row 2
    s += tg(10, 258, 'steps 3 and 4', { anchor: 'start' });
    s += rxn(40, 100, 346, '3  e⁻');
    {
      const c2 = P(172, 346), c3 = P(222, 346), h = P(246, 386), m4 = P(246, 306), m1 = P(148, 386);
      s += dbl(c2, c3) + sk(c3, m4) + bond(c3, h, { rFrom: 0, rTo: 10 }) + H(h) + sk(c2, m1);
      s += lonePair(c2.x, c2.y, 240, { dist: 22 }) + minus(146, 336);
      s += lbl(196, 420, 'vinyl anion');
      s += italicTag(196, 284, 'trans', ': CH₃ groups far apart', 'fg-tag-good');
    }
    s += rxn(300, 360, 346, '4  H⁺', 'from NH₃');
    {
      const c2 = P(430, 346), c3 = P(480, 346);
      const h2 = P(406, 306), m1 = P(406, 386), h3 = P(504, 386), m4 = P(504, 306);
      s += dbl(c2, c3) + sk(c2, m1) + sk(c3, m4);
      s += bond(c2, h2, { rFrom: 0, rTo: 10 }) + bond(c3, h3, { rFrom: 0, rTo: 10 }) + H(h2) + H(h3);
      s += `<text class="fg-lbl" x="455" y="420" text-anchor="middle" font-size="13"><tspan font-style="italic">trans</tspan>-2-butene</text>`;
    }
    return s;
  },
  caption: 'The numbers match the four steps above. Watch the CH₃ groups: they are fixed on opposite sides once the vinyl anion forms in step 3.',
});

/* --------------------------------------------------- keto-enol-arrows ---
   Acid-catalyzed tautomerization with every arrow drawn. */
FIGURES.push({
  id: 'keto-enol-arrows',
  section: 'alkynes',
  anchor: 'The product is a ketone, acetone.</p>',
  viewBox: '0 0 760 250',
  alt: 'Keto–enol tautomerization under acid, in two steps. First, the enol from propyne and a hydronium ion: an arrow from an oxygen lone pair toward the C–O bond, an arrow from the C=C pi bond to a hydrogen of hydronium, and an arrow from that H–O bond onto its oxygen. This gives the protonated ketone, with a positive charge on oxygen and a new hydrogen on C1. Second, water takes the proton off the oxygen, with one arrow from the water lone pair to that hydrogen and one from the O–H bond onto the oxygen, leaving acetone.',
  build() {
    let s = '';
    // ---- panel 1: enol + H3O+
    s += panel(8, 12, 270, 226);
    s += tg(143, 34, 'the enol, from propyne');
    {
      const c1 = P(58, 170), c2 = P(110, 140), c3 = P(162, 170), o = P(110, 88), ho = P(146, 66);
      s += bond(c1, c2, { rFrom: 0, rTo: 0 }) + bond(P(64, 160), P(106, 136), { rFrom: 0, rTo: 0 });
      s += sk(c2, c3);
      s += bond(c2, o, { rFrom: 0, rTo: 14 }) + bond(o, ho, { rFrom: 14, rTo: 10 });
      s += atom(o.x, o.y, 'O', { r: 14, kind: 'hi' }) + H(ho);
      s += lonePair(o.x, o.y, 200, { dist: 22 }) + lonePair(o.x, o.y, 280, { dist: 22 });
      // hydronium below-left: H–OH2+
      const hh = P(40, 212), oh = P(108, 212);
      s += bond(hh, oh, { rFrom: 10, rTo: 24 }) + H(hh) + pill(oh.x, oh.y, 'OH₂', 46) + plus(140, 196);
      // arrows: O lone pair to C–O bond; pi bond to H; H–O bond to O
      s += curve(P(86, 84), P(106, 112), { bow: 16 });
      s += curve(P(80, 158), P(42, 200), { bow: 14 });
      s += curve(P(70, 214), P(100, 229), { bow: -10 });
    }
    s += arrow(P(282, 130), P(304, 130), { muted: true });
    // ---- panel 2: protonated ketone + water
    s += panel(308, 12, 216, 226);
    s += tg(416, 34, 'oxygen holds the charge');
    {
      const c1 = P(346, 170), c2 = P(398, 140), c3 = P(450, 170), o = P(398, 88), ho = P(444, 60);
      s += sk(c1, c2) + sk(c2, c3);
      s += bond(c2, o, { order: 2, rFrom: 0, rTo: 14, gap: 3 }) + bond(o, ho, { rFrom: 14, rTo: 10, cls: 'fg-bond-hi' });
      s += atom(o.x, o.y, 'O', { r: 14, kind: 'hi' }) + H(ho) + plus(376, 76);
      s += lonePair(o.x, o.y, 200, { dist: 22 });
      s += tg(372, 200, 'new H on C1', { cls: 'fg-tag-mut' });
      // water
      const w = P(490, 120);
      s += pill(w.x, w.y, 'OH₂', 46);
      s += lonePair(480, w.y, 270, { dist: 24 });
      s += curve(P(478, 92), P(454, 64), { bow: 12 });
      s += curve(P(422, 73), P(413, 97), { bow: 14 });
    }
    s += arrow(P(528, 130), P(550, 130), { muted: true });
    // ---- panel 3: ketone
    s += panel(554, 12, 198, 226);
    s += tg(653, 34, 'the ketone');
    {
      const c1 = P(604, 170), c2 = P(656, 140), c3 = P(708, 170), o = P(656, 88);
      s += sk(c1, c2) + sk(c2, c3);
      s += bond(c2, o, { order: 2, rFrom: 0, rTo: 14, gap: 3 });
      s += atom(o.x, o.y, 'O', { r: 14, kind: 'hi' });
      s += lonePair(o.x, o.y, 210, { dist: 22 }) + lonePair(o.x, o.y, 330, { dist: 22 });
      s += lbl(656, 214, 'acetone');
    }
    return s;
  },
  caption: 'Step 1: the C=C pi bond takes a proton onto C1, helped by the oxygen lone pair. Step 2: water takes the proton off oxygen.',
});

/* ------------------------------------------------ hydration-two-ways ---
   Which carbon gets the oxygen: Hg2+/H3O+ against hydroboration. */
const propyne = (x, y) => {
  const c1 = P(x, y), c2 = P(x + 44, y), c3 = P(x + 88, y);
  return trip(c1, c2) + sk(c2, c3);
};
/* Enol CH2=C(OH)CH3 (Markovnikov) or HOCH=CHCH3 (hydroboration). */
const markEnol = (x, y) => {
  const c1 = P(x, y + 18), c2 = P(x + 36, y), c3 = P(x + 72, y + 18), o = P(x + 36, y - 40);
  return dbl(c1, c2) + sk(c2, c3) + bond(c2, o, { rFrom: 0, rTo: 14 }) + atom(o.x, o.y, 'OH', { r: 15, size: 12 });
};
const hbEnol = (x, y) => {
  const c1 = P(x, y + 18), c2 = P(x + 36, y), c3 = P(x + 72, y + 18), o = P(x - 30, y);
  return bond(c1, o, { rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'HO', { r: 15, size: 12 }) + dbl(c1, c2) + sk(c2, c3);
};
const acetone = (x, y) => {
  const c1 = P(x, y + 18), c2 = P(x + 36, y), c3 = P(x + 72, y + 18), o = P(x + 36, y - 40);
  return sk(c1, c2) + sk(c2, c3) + bond(c2, o, { order: 2, rFrom: 0, rTo: 14, gap: 3 }) + atom(o.x, o.y, 'O', { r: 14, kind: 'hi' });
};
const propanal = (x, y) => {
  const c1 = P(x, y + 18), c2 = P(x + 36, y), c3 = P(x + 72, y + 18), o = P(x - 30, y);
  return bond(c1, o, { order: 2, rFrom: 0, rTo: 14, gap: 3 }) + atom(o.x, o.y, 'O', { r: 14, kind: 'hi' }) + sk(c1, c2) + sk(c2, c3) + H(P(x, y + 52)) + bond(c1, P(x, y + 52), { rFrom: 0, rTo: 10 });
};

FIGURES.push({
  id: 'hydration-two-ways',
  section: 'alkynes',
  anchor: 'Propyne gives propanal.</p>',
  viewBox: '0 0 760 350',
  alt: 'Two routes from propyne. Top row: water, sulfuric acid and HgSO4 give the enol with OH on C2, which tautomerizes to acetone, a methyl ketone. Bottom row: a bulky borane then hydrogen peroxide and hydroxide give the enol with OH on C1, which tautomerizes to propanal, an aldehyde.',
  build() {
    let s = '';
    s += tg(10, 22, 'Markovnikov: O on the internal carbon', { anchor: 'start', cls: 'fg-tag-good' });
    s += propyne(30, 110) + lbl(74, 150, 'propyne');
    s += rxn(150, 290, 106, 'H₂O, H₂SO₄, HgSO₄');
    s += markEnol(320, 110) + lbl(356, 158, 'enol');
    s += rxn(420, 480, 106, 'tautomer');
    s += acetone(530, 110) + lbl(566, 158, 'acetone');
    s += tg(660, 116, 'methyl ketone', { anchor: 'start', cls: 'fg-tag-mut' });
    s += rule(10, 180, 750, 180);
    s += tg(10, 202, 'hydroboration: O on the end carbon', { anchor: 'start', cls: 'fg-tag-good' });
    s += propyne(30, 270) + lbl(74, 310, 'propyne');
    s += tg(220, 250, '1. bulky R₂BH');
    s += tg(220, 290, '2. H₂O₂, NaOH');
    s += arrow(P(150, 266), P(290, 266));
    s += hbEnol(350, 266) + lbl(386, 334, 'enol');
    s += rxn(440, 500, 262, 'tautomer');
    s += propanal(560, 266) + lbl(610, 334, 'propanal');
    s += tg(660, 272, 'aldehyde', { anchor: 'start', cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Both routes pass through an enol. Where the OH sits on the enol decides whether the carbonyl ends up inside the chain or at its end.',
});

FIGURES.push({
  id: 'l-hydration-two-ways',
  lessons: ['alkynes'],
  alt: 'Two columns starting from propyne. Left column: H2O, H2SO4 and HgSO4 give the enol with OH on C2, which becomes acetone. Right column: a bulky borane then H2O2 and NaOH give the enol with OH on C1, which becomes propanal.',
  viewBox: '0 0 340 480',
  build() {
    let s = '';
    s += tg(84, 20, 'H₃O⁺, Hg²⁺', { cls: 'fg-tag-good' });
    s += tg(256, 20, 'bulky R₂BH, then', { cls: 'fg-tag-good' });
    s += tg(256, 36, 'H₂O₂, NaOH', { cls: 'fg-tag-good' });
    s += `<line class="fg-rule" x1="170" y1="10" x2="170" y2="470"></line>`;
    // left
    s += propyne(40, 80) + tg(84, 108, 'propyne');
    s += arrow(P(84, 122), P(84, 172));
    s += markEnol(48, 236) + tg(84, 276, 'enol, OH on C2');
    s += arrow(P(84, 290), P(84, 340));
    s += acetone(48, 404) + tg(84, 444, 'acetone');
    // right
    s += propyne(212, 80) + tg(256, 108, 'propyne');
    s += arrow(P(256, 122), P(256, 172));
    s += hbEnol(238, 216) + tg(256, 276, 'enol, OH on C1');
    s += arrow(P(256, 290), P(256, 340));
    s += propanal(238, 380) + tg(256, 466, 'propanal');
    return s;
  },
  caption: 'The first arrow in each column adds water; the second is the enol turning into its carbonyl.',
});

/* ---------------------------------------------------- l-acetylide-sn2 ---
   Lesson copy of the SN2 worked example, stacked. */
FIGURES.push({
  id: 'l-acetylide-sn2',
  lessons: ['alkynes'],
  alt: 'Top: sodium acetylide, H–C≡C with a lone pair and negative charge on the end carbon, attacks the CH2 carbon of 1-bromobutane from the side opposite the bromine, and the C–Br bond moves onto bromine. Bottom: the product, hex-1-yne, with the new carbon–carbon bond highlighted.',
  viewBox: '0 0 340 290',
  build() {
    let s = '';
    const y = 120;
    const Hh = P(20, y), C1 = P(66, y), C2 = P(120, y);
    s += bond(Hh, C1, { rFrom: 10, rTo: 13 }) + trip(C1, C2, { rFrom: 13, rTo: 13 });
    s += H(Hh) + C(C1) + C(C2, 'hi');
    s += lonePair(C2.x, C2.y, 0, { dist: 21 }) + minus(122, 96);
    s += tg(70, 160, 'acetylide');
    const Ca = P(216, y), Brp = P(284, y);
    s += bond(Ca, Brp, { rFrom: 13, rTo: 14, cls: 'fg-bond-hi' }) + C(Ca, 'warn') + Br(Brp);
    s += lonePair(Brp.x, Brp.y, 0, { dist: 22 }) + lonePair(Brp.x, Brp.y, 90, { dist: 22 }) + lonePair(Brp.x, Brp.y, 270, { dist: 22 });
    const c2 = P(216, 76), c3 = P(246, 52), c4 = P(246, 16);
    s += bond(Ca, c2, { rFrom: 13, rTo: 0 }) + sk(c2, c3) + sk(c3, c4);
    s += tg(230, 160, '1-bromobutane');
    s += curve(P(146, 114), P(200, 112), { bow: -18 });
    s += curve(P(250, 128), P(282, 142), { bow: 12 });
    s += arrow(P(170, 180), P(170, 214));
    const yy = 250;
    const p1 = P(60, yy), p2 = P(114, yy), p3 = P(168, yy), p4 = P(196, yy - 22), p5 = P(224, yy), p6 = P(252, yy - 22);
    s += trip(p1, p2) + sk(p2, p3, true) + sk(p3, p4) + sk(p4, p5) + sk(p5, p6);
    s += tg(141, 276, 'new C–C bond', { cls: 'fg-tag-good' });
    s += tg(300, 252, 'hex-1-yne', { anchor: 'middle' });
    return s;
  },
  caption: 'The acetylide attacks from the side opposite the bromine.',
});

export default FIGURES;
