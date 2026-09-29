/* Figures for the organometallic-bonding notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every drawing is made of panels 340 wide whose labels are all fg-lbl or
   fg-tag, so the same figure can sit in the notes and in a lesson step
   (panels stacked in one 340-wide column). The one exception is
   halide-no-grignard, which is notes-only and sets its two panels side by
   side. Small reagents are drawn with every atom labeled; chains and
   ketones are skeletal, since this chapter comes long after skeletal
   structures are taught. */
import { atom, bond, arrow, curve, lonePair, text, tag, label, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];
const PW = 340;                       // panel width

/* ------------------------------------------------------------ helpers --- */
const rad = (l) => (!l ? 0 : l === 'H' ? 11 : l.length <= 2 ? 14 : 4 + l.length * 3.8);
/* A labeled atom {x, y, l, k, r}; V is an unlabeled skeletal vertex. */
const A = (x, y, l, k) => ({ x, y, l, k, r: rad(l) });
const V = (x, y) => ({ x, y, l: '', r: 0 });
const draw = (...as) => as.filter((a) => a.l).map((a) => atom(a.x, a.y, a.l, { kind: a.k, r: a.r })).join('');
const bd = (a, b, o = {}) => bond(a, b, { rFrom: a.r ?? 0, rTo: b.r ?? 0, ...o });
const dbl = (a, b, cls) => bd(a, b, { order: 2, ...(cls ? { cls } : {}) });
const lp = (a, deg, extra = 7) => lonePair(a.x, a.y, deg, { dist: a.r + extra });
const rich = (x, y, html, cls = 'fg-tag', anchor = 'middle') =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${cls === 'fg-lbl' ? 12.5 : 11}">${html}</text>`;
/* Every panel: a box, a title tag at the top and up to three tag lines at
   the bottom. A line is a string, or [html, cls]. */
function frameP(ox, oy, h, title, lines = [], kind, w = PW) {
  let s = panel(ox, oy, w, h, kind ? { kind } : {});
  if (title) s += rich(ox + w / 2, oy + 20, title);
  lines.forEach((ln, i) => {
    const [t, cls] = Array.isArray(ln) ? ln : [ln, 'fg-tag'];
    s += rich(ox + w / 2, oy + h - 14 - (lines.length - 1 - i) * 17, t, cls);
  });
  return s;
}
const down = (x, y1, y2) => arrow(P(x, y1), P(x, y2), { size: 7 });

/* ======================================================================
   1. The polarity flip: the same carbon in CH3Br and in CH3MgBr.
   ====================================================================== */
const H_FLIP = 180;
function pBromide(ox, oy) {
  let s = frameP(ox, oy, H_FLIP, 'bromomethane, CH₃Br', [
    'C 2.55, Br 2.96: the electrons go to bromine',
    ['carbon is δ+, so nucleophiles attack it', 'fg-tag-warn'],
  ], 'warn');
  const C = A(ox + 130, oy + 80, 'C', 'warn'), Br = A(ox + 216, oy + 80, 'Br');
  const H1 = A(ox + 88, oy + 80, 'H'), H2 = A(ox + 130, oy + 42, 'H'), H3 = A(ox + 130, oy + 118, 'H');
  s += bd(C, Br) + bd(C, H1) + bd(C, H2) + bd(C, H3);
  s += draw(C, Br, H1, H2, H3);
  s += label(ox + 154, oy + 62, 'δ+');
  s += label(ox + 216, oy + 56, 'δ−');
  return s;
}
function pGrignard(ox, oy) {
  let s = frameP(ox, oy, H_FLIP, 'methylmagnesium bromide, CH₃MgBr', [
    'C 2.55, Mg 1.31: the electrons go to carbon',
    ['carbon is δ−, so it attacks electrophiles', 'fg-tag-good'],
  ], 'good');
  const C = A(ox + 100, oy + 80, 'C', 'hi'), Mg = A(ox + 186, oy + 80, 'Mg'), Br = A(ox + 262, oy + 80, 'Br');
  const H1 = A(ox + 58, oy + 80, 'H'), H2 = A(ox + 100, oy + 42, 'H'), H3 = A(ox + 100, oy + 118, 'H');
  s += bd(C, Mg, { cls: 'fg-bond-hi' }) + bd(Mg, Br) + bd(C, H1) + bd(C, H2) + bd(C, H3);
  s += draw(C, Mg, Br, H1, H2, H3);
  s += label(ox + 124, oy + 62, 'δ−');
  s += label(ox + 186, oy + 56, 'δ+');
  return s;
}
const GAP_FLIP = 44;
FIGURES.push({
  id: 'polarity-flip',
  section: 'organometallic-bonding',
  anchor: '<!-- fig:polarity-flip:start -->',
  lessons: ['organometallic-bonding'],
  viewBox: `0 0 ${PW} ${H_FLIP * 2 + GAP_FLIP}`,
  alt: 'Top: bromomethane, a carbon with three hydrogens bonded to bromine. Carbon (2.55) is marked δ+ and bromine (2.96) δ−, so nucleophiles attack the carbon. An arrow labeled "Mg, dry ether" leads down to methylmagnesium bromide, the same carbon now bonded to magnesium, which is bonded to bromine. Carbon (2.55) is marked δ− and magnesium (1.31) δ+, so the carbon attacks electrophiles.',
  build() {
    let s = pBromide(0, 0);
    s += down(PW / 2, H_FLIP + 4, H_FLIP + GAP_FLIP - 4);
    s += tag(PW / 2 + 12, H_FLIP + GAP_FLIP / 2 + 4, 'Mg, dry ether', { anchor: 'start' });
    s += pGrignard(0, H_FLIP + GAP_FLIP);
    return s;
  },
  caption: 'Follow the highlighted carbon from top to bottom, and compare the pair of electronegativity values in each panel.',
});

/* ======================================================================
   2. One C–Mg bond, two fates: proton transfer from methanol (fast) and
      addition to acetone (only when no O–H is present).
   ====================================================================== */
/* The reagent, CH3–MgBr, with its C–Mg bond; returns the atoms. */
function reagent(ox, y, s) {
  const M = A(ox + 42, y, 'H₃C', 'hi'), G = A(ox + 116, y, 'MgBr');
  s.v += bd(M, G, { cls: 'fg-bond-hi' }) + draw(M, G);
  return { M, G };
}
const H_QA = 190, H_QB = 214;
function pQuench(ox, oy) {
  let s = frameP(ox, oy, H_QA, 'with methanol: the reagent takes a proton', [
    ['fast, and the reagent is used up', 'fg-tag-warn'],
  ], 'warn');
  const acc = { v: '' };
  reagent(ox, oy + 98, acc);
  s += acc.v;
  const O = A(ox + 252, oy + 70, 'O'), H = A(ox + 204, oy + 98, 'H', 'warn'), Me = A(ox + 300, oy + 98, 'CH₃');
  s += bd(O, H) + bd(O, Me) + draw(O, H, Me);
  s += lp(O, -135) + lp(O, -45);
  /* C–Mg bond electrons to the H; O–H bond electrons onto the O. */
  s += curve(P(ox + 79, oy + 106), P(ox + 193, oy + 104), { bow: 34, size: 7 });
  s += curve(P(ox + 224, oy + 91), P(ox + 250, oy + 86), { bow: 12, size: 7 });
  s += label(ox + PW / 2, oy + 148, 'CH₄  +  CH₃O⁻ ⁺MgBr');
  return s;
}
function pAdd(ox, oy) {
  let s = frameP(ox, oy, H_QB, 'with acetone: the reagent adds to C=O', [
    ['only when no O–H is present', 'fg-tag-good'],
  ], 'good');
  const acc = { v: '' };
  reagent(ox, oy + 116, acc);
  s += acc.v;
  const C = A(ox + 240, oy + 112, 'C'), O = A(ox + 240, oy + 62, 'O');
  const M1 = A(ox + 196, oy + 140, 'CH₃'), M2 = A(ox + 284, oy + 140, 'CH₃');
  s += dbl(C, O) + bd(C, M1) + bd(C, M2) + draw(C, O, M1, M2);
  s += lp(O, -145) + lp(O, -35);
  /* C–Mg bond electrons to the carbonyl C; the π electrons onto O. */
  s += curve(P(ox + 79, oy + 108), P(ox + 225, oy + 106), { bow: -34, size: 7 });
  s += curve(P(ox + 248, oy + 92), P(ox + 256, oy + 68), { bow: 12, size: 7 });
  s += label(ox + PW / 2, oy + 178, '(CH₃)₃C–O⁻ ⁺MgBr');
  return s;
}
const GAP_Q = 16;
FIGURES.push({
  id: 'quench-or-add',
  section: 'organometallic-bonding',
  anchor: '<!-- fig:quench-or-add:start -->',
  lessons: ['organometallic-bonding'],
  viewBox: `0 0 ${PW} ${H_QA + GAP_Q + H_QB}`,
  alt: 'Two panels, each starting from CH3–MgBr with its C–Mg bond highlighted. Top, with methanol: a curved arrow runs from the C–Mg bond to the H of the O–H, and a second from the O–H bond onto the oxygen, giving CH4 plus CH3O− +MgBr. This is fast and uses up the reagent. Bottom, with acetone: a curved arrow runs from the C–Mg bond to the carbonyl carbon, and a second from the C=O bond onto the oxygen, giving (CH3)3C–O− +MgBr. This happens only when no O–H is present.',
  build() {
    return pQuench(0, 0) + pAdd(0, H_QA + GAP_Q);
  },
  caption: 'In both panels the first curved arrow starts at the same highlighted C–Mg bond. Only its target changes: a proton on top, a carbonyl carbon below.',
});

/* ======================================================================
   3. Two halides that cannot be made into a Grignard reagent (notes only,
      two panels side by side).
   ====================================================================== */
const H_HAL = 158, GAP_HAL = 40;
function pHydroxyBromide(ox, oy) {
  let s = frameP(ox, oy, H_HAL, '4-bromobutan-1-ol', [
    ['its O–H would destroy the reagent as it forms', 'fg-tag-warn'],
  ]);
  const yb = oy + 100;
  const OH = A(ox + 58, yb, 'HO', 'warn'), c1 = V(ox + 98, yb - 22), c2 = V(ox + 136, yb),
        c3 = V(ox + 174, yb - 22), c4 = V(ox + 212, yb), Br = A(ox + 254, yb - 22, 'Br');
  s += bd(OH, c1) + bd(c1, c2) + bd(c2, c3) + bd(c3, c4) + bd(c4, Br);
  s += draw(OH, Br);
  return s;
}
function pKetoBromide(ox, oy) {
  let s = frameP(ox, oy, H_HAL, '5-bromopentan-2-one', [
    ['its C=O would be attacked by the reagent', 'fg-tag-warn'],
  ]);
  const yb = oy + 112;
  const c1 = V(ox + 60, yb), c2 = V(ox + 98, yb - 22), O = A(ox + 98, yb - 64, 'O', 'warn'),
        c3 = V(ox + 136, yb), c4 = V(ox + 174, yb - 22), c5 = V(ox + 212, yb), Br = A(ox + 254, yb - 22, 'Br');
  s += bd(c1, c2) + dbl(c2, O, 'fg-bond-hi') + bd(c2, c3) + bd(c3, c4) + bd(c4, c5) + bd(c5, Br);
  s += draw(O, Br);
  return s;
}
FIGURES.push({
  id: 'halide-no-grignard',
  section: 'organometallic-bonding',
  anchor: '<!-- fig:halide-no-grignard:start -->',
  viewBox: `0 0 ${PW * 2 + GAP_HAL} ${H_HAL}`,
  alt: 'Two skeletal structures. Left: 4-bromobutan-1-ol, a four-carbon chain with HO on one end and Br on the other; the HO is highlighted, because its O–H would destroy the reagent as it forms. Right: 5-bromopentan-2-one, a five-carbon chain with a C=O at carbon 2 and Br on carbon 5; the C=O is highlighted, because the reagent would attack it.',
  build() {
    return pHydroxyBromide(0, 0) + pKetoBromide(PW + GAP_HAL, 0);
  },
  caption: 'In each halide, the highlighted group is the one the new reagent would react with.',
});

/* ======================================================================
   4. The worked example: 4-hydroxybutan-2-one with 1.0 and 2.0 equiv
      CH3MgBr. The lesson copy shows the bare molecule only.
   ====================================================================== */
/* The four-carbon skeleton HO–CH2–CH2–C(=O)–CH3. `oxy` is the label of
   the chain-end oxygen; `c2` chooses what carbon 2 carries. */
function hkSkeleton(ox, yb, { oxy = 'HO', oxyKind = 'warn', c2 = 'ketone' } = {}) {
  if (oxyKind === 'plain') oxyKind = undefined;
  let s = '';
  const O1 = A(ox + 64, yb, oxy, oxyKind), c4 = V(ox + 104, yb - 22), c3 = V(ox + 142, yb),
        c2p = V(ox + 180, yb - 22), c1 = V(ox + 218, yb);
  s += bd(O1, c4) + bd(c4, c3) + bd(c3, c2p) + bd(c2p, c1);
  if (c2 === 'ketone') {
    const O = A(ox + 180, yb - 64, 'O');
    s += dbl(c2p, O) + draw(O);
  } else {
    /* The tertiary alcohol: OH up-left, the new CH3 up-right. */
    const OH = A(ox + 160, yb - 60, 'OH'), me = V(ox + 214, yb - 56);
    s += bd(c2p, OH) + bd(c2p, me, { cls: 'fg-bond-hi' }) + draw(OH);
    s += tag(ox + 222, yb - 60, 'new CH₃', { anchor: 'start' });
  }
  s += draw(O1);
  if (c2 === 'ketone') {
    s += tag(ox + 104, yb - 32, 'C4');
    s += tag(ox + 180, yb + 10, 'C2');
  }
  return s;
}
const H_HK1 = 168, H_HK2 = 206, H_HK3 = 176, GAP_HK = 34;
function pHK1(ox, oy) {
  let s = frameP(ox, oy, H_HK1, '4-hydroxybutan-2-one: two reactive sites');
  s += hkSkeleton(ox, oy + 116);
  s += rich(ox + 72, oy + 146, 'O–H, pK<tspan baseline-shift="sub" font-size="8">a</tspan> about 16');
  s += tag(ox + 206, oy + 56, 'ketone C=O', { anchor: 'start' });
  return s;
}
function pHK2(ox, oy) {
  let s = frameP(ox, oy, H_HK2, 'after 1.0 equiv CH₃MgBr: the O–H is gone', [
    'CH₄ leaves as a gas; the ketone is untouched',
    ['workup now would return the starting material', 'fg-tag-warn'],
  ], 'warn');
  s += hkSkeleton(ox, oy + 124, { oxy: 'O⁻', oxyKind: 'warn' });
  s += tag(ox + 64, oy + 152, '⁺MgBr');
  return s;
}
function pHK3(ox, oy) {
  let s = frameP(ox, oy, H_HK3, 'after 2.0 equiv, then workup', [
    ['3-methylbutane-1,3-diol', 'fg-tag-good'],
  ], 'good');
  s += hkSkeleton(ox, oy + 120, { oxy: 'HO', oxyKind: 'plain', c2: 'diol' });
  return s;
}
FIGURES.push({
  id: 'hydroxyketone-equiv',
  section: 'organometallic-bonding',
  anchor: '<!-- fig:hydroxyketone-equiv:start -->',
  viewBox: `0 0 ${PW} ${H_HK1 + H_HK2 + H_HK3 + GAP_HK * 2}`,
  alt: 'Three panels. First: 4-hydroxybutan-2-one in skeletal form, HO on the left end of a four-carbon chain and a C=O on carbon 2, with the acidic O–H and the ketone labeled. Second, after 1.0 equivalent of CH3MgBr: the oxygen on the left end is now O− with +MgBr, CH4 has left as a gas, and the ketone is untouched; workup at this point would return the starting material. Third, after a second equivalent and then workup: 3-methylbutane-1,3-diol, with an OH and a new CH3 on carbon 2.',
  build() {
    let s = pHK1(0, 0);
    s += down(PW / 2, H_HK1 + 4, H_HK1 + GAP_HK - 4);
    s += tag(PW / 2 + 12, H_HK1 + GAP_HK / 2 + 4, '1.0 equiv CH₃MgBr', { anchor: 'start' });
    const y2 = H_HK1 + GAP_HK;
    s += pHK2(0, y2);
    s += down(PW / 2, y2 + H_HK2 + 4, y2 + H_HK2 + GAP_HK - 4);
    s += tag(PW / 2 + 12, y2 + H_HK2 + GAP_HK / 2 + 4, 'a second equiv', { anchor: 'start' });
    s += pHK3(0, y2 + H_HK2 + GAP_HK);
    return s;
  },
  caption: 'The first equivalent changes only the oxygen on C4. The second adds the new CH₃ to C2, the carbonyl carbon; the product&rsquo;s name numbers its chain from the other end, so that carbon is C3 there.',
});

const H_LHK = 130;
FIGURES.push({
  id: 'l-hydroxyketone',
  lessons: ['organometallic-bonding'],
  viewBox: `0 0 ${PW} ${H_LHK}`,
  alt: '4-hydroxybutan-2-one in skeletal form: an HO on the left end of a four-carbon chain, and a C=O on carbon 2.',
  build() {
    let s = frameP(0, 0, H_LHK, '4-hydroxybutan-2-one');
    s += hkSkeleton(0, 110, { oxyKind: 'plain' });
    return s;
  },
  caption: 'Two groups to find: an OH on C4 and a C=O on C2.',
});

/* ======================================================================
   5. A Grignard reagent and an alkyl halide: the SN2 you might hope for,
      and the E2 that competes with it.
   ====================================================================== */
const H_MX1 = 150, H_MX2 = 230, GAP_MX = 16;
function pHoped(ox, oy) {
  let s = frameP(ox, oy, H_MX1, 'the hoped-for SN2 at C1 of 1-bromobutane', [
    ['pentane, but it forms only slowly', 'fg-tag-mut'],
  ]);
  const acc = { v: '' };
  reagent(ox - 8, oy + 100, acc);
  s += acc.v;
  const yb = oy + 100;
  const c4 = V(ox + 166, yb), c3 = V(ox + 200, yb - 22), c2 = V(ox + 234, yb), c1 = V(ox + 268, yb - 22),
        Br = A(ox + 306, yb, 'Br');
  s += bd(c4, c3) + bd(c3, c2) + bd(c2, c1) + bd(c1, Br) + draw(Br);
  s += text(ox + 282, yb - 32, 'C1', { cls: 'fg-tag', anchor: 'start' });
  s += curve(P(ox + 71, yb - 8), P(ox + 266, yb - 28), { bow: -40, size: 7, muted: true });
  s += curve(P(ox + 290, yb - 17), P(ox + 317, yb - 8), { bow: -10, size: 7, muted: true });
  return s;
}
function pE2(ox, oy) {
  let s = frameP(ox, oy, H_MX2, 'what competes: E2, with the reagent as the base', [
    'CH₄  +  but-1-ene  +  MgBr₂',
  ], 'warn');
  const yb = oy + 88;
  const c4 = V(ox + 138, yb), c3 = V(ox + 174, yb - 22), c2 = V(ox + 210, yb), c1 = V(ox + 246, yb - 22),
        Br = A(ox + 286, yb, 'Br'), H = A(ox + 210, yb + 44, 'H', 'warn');
  s += bd(c4, c3) + bd(c3, c2) + bd(c2, c1, { cls: 'fg-bond-hi' }) + bd(c1, Br) + bd(c2, H);
  s += draw(Br, H);
  s += text(ox + 246, yb - 32, 'C1', { cls: 'fg-tag' });
  s += text(ox + 222, yb + 14, 'C2', { cls: 'fg-tag', anchor: 'start' });
  const G = A(ox + 46, yb + 92, 'BrMg'), M = A(ox + 122, yb + 92, 'CH₃', 'hi');
  s += bd(G, M, { cls: 'fg-bond-hi' }) + draw(G, M);
  /* C–Mg electrons to the H; C2–H electrons into the new π bond; C1–Br
     electrons onto Br. */
  s += curve(P(ox + 86, yb + 82), P(ox + 199, yb + 50), { bow: -26, size: 7 });
  s += curve(P(ox + 205, yb + 28), P(ox + 222, yb - 6), { bow: -18, size: 7 });
  s += curve(P(ox + 262, yb - 18), P(ox + 290, yb - 16), { bow: -12, size: 7 });
  return s;
}
FIGURES.push({
  id: 'alkyl-halide-mix',
  section: 'organometallic-bonding',
  anchor: '<!-- fig:alkyl-halide-mix:start -->',
  lessons: ['organometallic-bonding'],
  viewBox: `0 0 ${PW} ${H_MX1 + GAP_MX + H_MX2}`,
  alt: 'Two panels with CH3MgBr and 1-bromobutane. Top: muted curved arrows show the hoped-for SN2, the C–Mg bond attacking C1 and bromide leaving, which would give pentane but forms only slowly. Bottom: E2. A curved arrow runs from the C–Mg bond to a hydrogen on C2, a second from the C2–H bond into the C1–C2 bond to make a double bond, and a third from the C1–Br bond onto bromine. The products are CH4, but-1-ene and MgBr2.',
  build() {
    return pHoped(0, 0) + pE2(0, H_MX1 + GAP_MX);
  },
  caption: 'Top: the slow substitution you might plan, with its arrows in gray. Bottom: the E2 that competes with it.',
});

export default FIGURES;
