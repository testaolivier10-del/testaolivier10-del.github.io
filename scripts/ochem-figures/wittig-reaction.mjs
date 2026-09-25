/* Figures for the wittig-reaction notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every drawing is made of panels 340 wide whose labels are all fg-lbl or
   fg-tag, so the same panel can sit in a notes figure (two panels to a row)
   and in a lesson figure (panels stacked in one 340-wide column, id prefix
   l-). Each panel is a function of its top-left corner.

   The mechanism uses one concrete pair throughout: acetone with the
   methylene ylide, Ph3P=CH2, every atom labelled, so each curved arrow
   starts at a named lone pair or bond and ends at a named atom or bond. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { polyPts, polyRing, ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];
const PW = 340;                       // panel width
const GAP = 40;                       // gap between two panels in a notes row

/* ------------------------------------------------------------ helpers --- */
const rad = (l) => (l === 'H' ? 12 : l.length <= 2 ? 14 : 4 + l.length * 3.8);
/* A labelled atom: {x, y, l, k, r}. */
const A = (x, y, l, k) => ({ x, y, l, k, r: rad(l) });
const draw = (...as) => as.map((a) => atom(a.x, a.y, a.l, { kind: a.k, r: a.r })).join('');
const bd = (a, b, o = {}) => bond(a, b, { rFrom: a.r ?? 0, rTo: b.r ?? 0, ...o });
const wd = (a, b) => wedge(a, b, { rFrom: a.r, rTo: b.r, width: 9 });
const hs = (a, b) => hash(a, b, { rFrom: a.r, rTo: b.r, width: 10, rungs: 5 });
const mid = (a, b, t = 0.5) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const off = (p, dx, dy) => P(p.x + dx, p.y + dy);
const lp = (a, deg, extra = 7) => lonePair(a.x, a.y, deg, { dist: a.r + extra });
const lpAt = (a, deg, extra = 7) => {
  const r = (deg * Math.PI) / 180, d = a.r + extra;
  return P(a.x + Math.cos(r) * d, a.y + Math.sin(r) * d);
};
const it = (s) => `<tspan font-style="italic">${s}</tspan>`;
/* Text that may carry an italic tspan (E, Z, cis, trans). */
const rich = (x, y, html, cls = 'fg-tag') =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle" font-size="${cls === 'fg-lbl' ? 12.5 : 11}">${html}</text>`;
/* Every panel: a box, a title tag at the top and up to two tag lines at
   the bottom. A line is a string, or [html, cls] for rich text. */
function frameP(ox, oy, h, title, lines = [], kind) {
  let s = panel(ox, oy, PW, h, kind ? { kind } : {});
  s += rich(ox + PW / 2, oy + 20, title);
  lines.forEach((ln, i) => {
    const [t, cls] = Array.isArray(ln) ? ln : [ln, 'fg-tag'];
    s += rich(ox + PW / 2, oy + h - 14 - (lines.length - 1 - i) * 17, t, cls);
  });
  return s;
}
const down = (x, y1, y2) => arrow(P(x, y1), P(x, y2), { size: 7 });
const right = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { size: 7 });
const plus = (x, y) => text(x, y, '+', { cls: 'fg-lbl' });

/* Stack panels for a lesson: each entry is [panelFn, height]; a short
   arrow joins consecutive panels. Returns { svg, h }. */
function stack(parts, gap = 26, arrows = true) {
  let s = '', y = 0;
  parts.forEach(([fn, h], i) => {
    s += fn(0, y);
    if (arrows && i < parts.length - 1) s += down(PW / 2, y + h + 3, y + h + gap - 3);
    y += h + gap;
  });
  return { svg: s, h: y - gap };
}

/* ------------------------------------------------ making the ylide ------ */
const H_SN2 = 220, H_BASE = 256;

/* 1: the phosphorus lone pair does an SN2 on methyl iodide. */
function pSN2(ox, oy) {
  const Pp = A(ox + 58, oy + 76, 'Ph₃P'), C = A(ox + 176, oy + 76, 'CH₃', 'hi'), I = A(ox + 262, oy + 76, 'I', 'warn');
  let s = frameP(ox, oy, H_SN2, '1 · Ph₃P does an SN2 on CH₃–I', ['a phosphonium salt']);
  s += bd(C, I, { cls: 'fg-bond-hi' });
  s += lp(Pp, 0);
  s += draw(Pp, C, I);
  s += curve(off(lpAt(Pp, 0), 4, -6), P(C.x - C.r - 2, C.y - 7), { bow: -16 });
  s += curve(mid(C, I), off(I, -6, -17), { bow: -12 });
  s += down(ox + 170, oy + 106, oy + 136);
  const Pq = A(ox + 110, oy + 166, 'Ph₃P⁺'), Cq = A(ox + 200, oy + 166, 'CH₃', 'hi');
  s += bd(Pq, Cq) + draw(Pq, Cq);
  s += text(ox + 266, oy + 170, 'I⁻', { cls: 'fg-lbl' });
  return s;
}

/* 2: butyllithium's carbanion takes a proton from the carbon next to P+. */
function pBase(ox, oy) {
  const Pp = A(ox + 56, oy + 84, 'Ph₃P⁺'), C = A(ox + 150, oy + 84, 'CH₂', 'hi'),
        H = A(ox + 206, oy + 124, 'H', 'warn'), B = A(ox + 288, oy + 124, 'Bu⁻');
  let s = frameP(ox, oy, H_BASE, '2 · a strong base removes an H', [['the ylide: C⁻ right beside P⁺', 'fg-tag-good']], 'good');
  s += bd(Pp, C) + bd(C, H, { cls: 'fg-bond-hi' });
  s += lp(B, 180);
  s += draw(Pp, C, H, B);
  s += curve(off(lpAt(B, 180), -4, -6), off(H, 14, -6), { bow: 14 });
  s += curve(mid(C, H, 0.55), P(C.x - 6, C.y + C.r + 8), { bow: -10 });
  s += tag(B.x, oy + 158, 'from BuLi');
  s += down(ox + 110, oy + 140, oy + 172);
  const Pq = A(ox + 96, oy + 204, 'Ph₃P⁺'), Cq = A(ox + 184, oy + 204, 'CH₂⁻', 'hi');
  s += bd(Pq, Cq) + lp(Cq, 0) + draw(Pq, Cq);
  s += text(ox + 276, oy + 208, '+  butane', { cls: 'fg-lbl' });
  return s;
}

FIGURES.push({
  id: 'ylide-making',
  section: 'wittig-reaction',
  anchor: '<!-- fig:ylide-making:start -->',
  viewBox: `0 0 ${PW * 2 + GAP} ${H_BASE}`,
  alt: 'Making the methylene ylide. Panel 1: the lone pair on triphenylphosphine attacks the carbon of iodomethane while the C–I bond breaks, giving the phosphonium iodide. Panel 2: the butyl anion from butyllithium takes a proton from the CH3 next to P+, and the C–H electrons stay on carbon as a lone pair, giving Ph3P+–CH2−.',
  build() {
    let s = pSN2(0, 0) + pBase(PW + GAP, 0);
    s += right(PW + 6, PW + GAP - 6, 110);
    return s;
  },
  caption: 'Panel 1 is an ordinary S<sub>N</sub>2: one arrow from the phosphorus lone pair to carbon, one from the C&ndash;I bond to iodine. In panel 2, follow the second arrow: the C&ndash;H bonding pair stays behind on carbon as its lone pair.',
});

FIGURES.push({
  id: 'l-ylide-sn2',
  lessons: ['wittig-reaction'],
  viewBox: `0 0 ${PW} ${H_SN2}`,
  alt: 'The lone pair on triphenylphosphine attacks the carbon of iodomethane while the C–I bond breaks, giving the phosphonium iodide Ph3P+–CH3 I−.',
  build() { return pSN2(0, 0); },
  caption: 'One arrow from the phosphorus lone pair to carbon, one from the C&ndash;I bond to iodine.',
});

FIGURES.push({
  id: 'l-ylide-base',
  lessons: ['wittig-reaction'],
  viewBox: `0 0 ${PW} ${H_BASE}`,
  alt: 'The butyl anion from butyllithium takes a proton from the CH3 next to P+, and the C–H electrons stay on carbon as a lone pair, giving the ylide Ph3P+–CH2− and butane.',
  build() { return pBase(0, 0); },
  caption: 'The C&ndash;H bonding pair stays on carbon. That lone pair is the ylide&rsquo;s nucleophilic carbon.',
});

/* ------------------------------------------ the two drawings of it ------ */
const H_RES = 176;
FIGURES.push({
  id: 'ylide-resonance',
  section: 'wittig-reaction',
  anchor: '<!-- fig:ylide-resonance:start -->',
  lessons: ['wittig-reaction'],
  viewBox: `0 0 ${PW} ${H_RES}`,
  alt: 'The methylene ylide drawn two ways: Ph3P+–CH2− with a lone pair on carbon, a double-headed resonance arrow, and Ph3P=CH2 with a P=C double bond. A curved arrow from the carbon lone pair to the P–C bond converts the first drawing into the second.',
  build() {
    let s = frameP(0, 0, H_RES, 'one ylide, drawn two ways', ['both drawings are the same molecule']);
    const Pp = A(46, 84, 'Ph₃P⁺'), C = A(126, 84, 'CH₂⁻', 'hi');
    s += bd(Pp, C) + lp(C, -90) + draw(Pp, C);
    s += curve(off(lpAt(C, -90), -8, -2), off(mid(Pp, C), 2, -8), { bow: 12 });
    s += arrow(P(164, 84), P(200, 84), { size: 7 }) + arrow(P(200, 84), P(164, 84), { size: 7 });
    const Pq = A(244, 84, 'Ph₃P'), Cq = A(312, 84, 'CH₂', 'hi');
    s += bd(Pq, Cq, { order: 2 }) + draw(Pq, Cq);
    s += tag(86, 130, 'C⁻ beside P⁺');
    s += tag(278, 130, 'P=C shorthand');
    return s;
  },
  caption: 'Left, the charges drawn out. Right, the shorthand you will see in most reaction schemes.',
});

/* ------------------------------------------------------ the mechanism --- */
const H_M = 240, H_PROD = 190;
/* The ring positions shared by panels 1 to 3: P top left, the ylide carbon
   top right, the carbonyl carbon bottom right, O bottom left. */
function ringAtoms(ox, oy, pl, cl) {
  return {
    Pp: A(ox + 80, oy + 66, pl), Cy: A(ox + 190, oy + 66, cl, 'hi'),
    Cc: A(ox + 190, oy + 146, 'C', 'hi'), O: A(ox + 80, oy + 146, 'O'),
    M1: A(ox + 250, oy + 116, 'CH₃'), M2: A(ox + 250, oy + 180, 'CH₃'),
  };
}

function pClose(ox, oy) {
  const { Pp, Cy, Cc, O, M1, M2 } = ringAtoms(ox, oy, 'Ph₃P⁺', 'CH₂⁻');
  let s = frameP(ox, oy, H_M, '1 · the ylide meets acetone', ['new bonds: C to C, and O to P']);
  s += bd(Pp, Cy) + bd(Cc, O, { order: 2 }) + bd(Cc, M1) + bd(Cc, M2);
  s += lp(Cy, 90) + lp(O, 135) + lp(O, 225);
  s += draw(Pp, Cy, Cc, O, M1, M2);
  s += curve(off(lpAt(Cy, 90), 7, 0), P(Cc.x + 5, Cc.y - Cc.r - 3), { bow: -10 });
  // The O–P bond that is forming: dashed, so the arrow has a visible target.
  s += `<line class="fg-dash-hi" x1="${ox + 80}" y1="${oy + 132}" x2="${ox + 80}" y2="${oy + 90}"></line>`;
  s += curve(P(ox + 138, oy + 141), P(ox + 84, oy + 111), { bow: 14 });
  return s;
}

function pRing(ox, oy) {
  const { Pp, Cy, Cc, O, M1, M2 } = ringAtoms(ox, oy, 'Ph₃P', 'CH₂');
  let s = frameP(ox, oy, H_M, '2 · the oxaphosphetane', ['a four-membered ring: P, C, C and O', 'no charges; the ring is strained'], 'hi');
  s += bd(Pp, Cy) + bd(Cy, Cc) + bd(Cc, O) + bd(O, Pp) + bd(Cc, M1) + bd(Cc, M2);
  s += lp(O, 135) + lp(O, 225);
  s += draw(Pp, Cy, Cc, O, M1, M2);
  return s;
}

function pBreak(ox, oy) {
  const { Pp, Cy, Cc, O, M1, M2 } = ringAtoms(ox, oy, 'Ph₃P', 'CH₂');
  let s = frameP(ox, oy, H_M, '3 · the ring splits the other way', ['C–P and C–O break', 'C=C and P=O form']);
  s += bd(Pp, Cy, { cls: 'fg-bond-hi' }) + bd(Cy, Cc) + bd(Cc, O, { cls: 'fg-bond-hi' }) + bd(O, Pp);
  s += bd(Cc, M1) + bd(Cc, M2);
  s += lp(O, 135) + lp(O, 225);
  s += draw(Pp, Cy, Cc, O, M1, M2);
  s += curve(mid(Pp, Cy), off(mid(Cy, Cc), -6, 0), { bow: 12 });
  s += curve(mid(Cc, O), off(mid(O, Pp), 6, 0), { bow: 12 });
  return s;
}

function pProd(ox, oy) {
  const C1 = A(ox + 84, oy + 82, 'C', 'hi'), M1 = A(ox + 34, oy + 54, 'CH₃'), M2 = A(ox + 34, oy + 110, 'CH₃'),
        C2 = A(ox + 146, oy + 82, 'CH₂', 'hi');
  const Pr = A(ox + 226, oy + 82, 'Ph₃P'), Ox = A(ox + 292, oy + 82, 'O');
  let s = frameP(ox, oy, H_PROD, '4 · the alkene and Ph₃P=O', [['the strong P=O bond pays for the reaction', 'fg-tag-good']], 'good');
  s += bd(C1, C2, { order: 2, cls: 'fg-bond-hi' }) + bd(C1, M1) + bd(C1, M2);
  s += bd(Pr, Ox, { order: 2 }) + lp(Ox, -55) + lp(Ox, 55);
  s += draw(C1, M1, M2, C2, Pr, Ox);
  s += plus(ox + 186, oy + 87);
  s += tag(ox + 90, oy + 140, '2-methylpropene');
  s += tag(ox + 250, oy + 140, 'triphenylphosphine oxide');
  return s;
}

FIGURES.push({
  id: 'wittig-mechanism',
  section: 'wittig-reaction',
  anchor: '<!-- fig:wittig-mechanism:start -->',
  viewBox: `0 0 ${PW * 2 + GAP} ${H_M * 2 + 30}`,
  alt: 'The Wittig mechanism for acetone and Ph3P=CH2, drawn with curved arrows in four panels. 1: the carbon lone pair of the ylide attacks the carbonyl carbon while the C=O pi bond swings onto phosphorus. 2: the neutral four-membered oxaphosphetane ring, P–C–C–O. 3: the C–P and C–O bonds break, their electrons becoming the new C=C and P=O pi bonds. 4: 2-methylpropene and triphenylphosphine oxide.',
  build() {
    const y2 = H_M + 30;
    let s = pClose(0, 0) + pRing(PW + GAP, 0) + pBreak(0, y2) + pProd(PW + GAP, y2);
    s += right(PW + 6, PW + GAP - 6, 106);
    s += right(PW + 6, PW + GAP - 6, y2 + 90);
    return s;
  },
  caption: 'Read the top row, then the bottom row. In panel 1 the dashed line is the O&ndash;P bond as it forms. Follow the two highlighted carbons: they are the ones that end up in the C=C.',
});

FIGURES.push({
  id: 'l-wittig-mechanism',
  lessons: ['wittig-reaction'],
  viewBox: `0 0 ${PW} ${H_M * 3 + H_PROD + 3 * 26}`,
  alt: 'The Wittig mechanism for acetone and Ph3P=CH2 in four stacked panels: the ylide carbon attacks the carbonyl carbon while the C=O pi bond swings onto phosphorus; the neutral oxaphosphetane ring; the C–P and C–O bonds break to form C=C and P=O; 2-methylpropene and triphenylphosphine oxide.',
  build() { return stack([[pClose, H_M], [pRing, H_M], [pBreak, H_M], [pProd, H_PROD]]).svg; },
  caption: 'Two arrows close the ring (the dashed line is the O&ndash;P bond forming); two arrows open it the other way. The highlighted carbons become the C=C.',
});

/* ------------------------------------------- elimination vs Wittig ------ */
const H_EW = 336;
const ringAt = (cx, cy, r = 26) => polyPts(cx, cy, 6, r, 90);

function pElim(ox, oy) {
  let s = frameP(ox, oy, H_EW, 'elimination: Zaitsev picks', [], 'warn');
  const c0 = P(ox + 170, oy + 100), g = ringAt(c0.x, c0.y);
  s += polyRing(g);
  const OH = A(ox + 142, oy + 46, 'OH'), Me = A(ox + 200, oy + 46, 'CH₃');
  s += bond(g[0], OH, { rFrom: 0, rTo: OH.r }) + bond(g[0], Me, { rFrom: 0, rTo: Me.r });
  s += draw(OH, Me);
  s += tag(ox + 170, oy + 146, '1-methylcyclohexan-1-ol');
  s += down(ox + 170, oy + 152, oy + 178);
  s += tag(ox + 236, oy + 170, 'H₂SO₄, heat');
  // Major: the C=C inside the ring.
  const cL = P(ox + 90, oy + 256), gL = ringAt(cL.x, cL.y);
  s += gL.map((p, i) => i === 0 ? ringDouble(gL[0], gL[1], cL, { inset: 6 }) : bond(p, gL[(i + 1) % 6], { rFrom: 0, rTo: 0 })).join('');
  const MeL = A(ox + 90, oy + 206, 'CH₃');
  s += bond(gL[0], MeL, { rFrom: 0, rTo: MeL.r }) + draw(MeL);
  // Minor: the C=C outside it.
  const cR = P(ox + 250, oy + 256), gR = ringAt(cR.x, cR.y);
  s += polyRing(gR);
  const CH2 = A(ox + 250, oy + 202, 'CH₂');
  s += bond(gR[0], CH2, { rFrom: 0, rTo: CH2.r, order: 2 }) + draw(CH2);
  s += tag(ox + 90, oy + 304, '1-methylcyclohexene');
  s += tag(ox + 90, oy + 322, 'major', { cls: 'fg-tag-warn' });
  s += tag(ox + 250, oy + 304, 'methylenecyclohexane');
  s += tag(ox + 250, oy + 322, 'minor', { cls: 'fg-tag-mut' });
  return s;
}

function pWit(ox, oy) {
  let s = frameP(ox, oy, H_EW, 'Wittig: the C=O carbon decides', [], 'good');
  const c0 = P(ox + 80, oy + 106), g = ringAt(c0.x, c0.y);
  s += polyRing(g);
  const O = A(ox + 80, oy + 48, 'O');
  s += bond(g[0], O, { rFrom: 0, rTo: O.r, order: 2, cls: 'fg-bond-hi' }) + lp(O, -150) + lp(O, -30) + draw(O);
  s += plus(ox + 140, oy + 110);
  const Pp = A(ox + 200, oy + 106, 'Ph₃P'), C = A(ox + 280, oy + 106, 'CH₂', 'hi');
  s += bd(Pp, C, { order: 2 }) + draw(Pp, C);
  s += tag(ox + 80, oy + 152, 'cyclohexanone');
  s += down(ox + 170, oy + 152, oy + 178);
  const cP = P(ox + 110, oy + 256), gP = ringAt(cP.x, cP.y);
  s += polyRing(gP);
  const CH2 = A(ox + 110, oy + 202, 'CH₂', 'hi');
  s += bond(gP[0], CH2, { rFrom: 0, rTo: CH2.r, order: 2, cls: 'fg-bond-hi' }) + draw(CH2);
  s += text(ox + 244, oy + 260, '+  Ph₃P=O', { cls: 'fg-lbl' });
  s += tag(ox + 110, oy + 304, 'methylenecyclohexane');
  s += tag(ox + 110, oy + 322, 'the only alkene formed', { cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'elim-vs-wittig',
  section: 'wittig-reaction',
  anchor: '<!-- fig:elim-vs-wittig:start -->',
  viewBox: `0 0 ${PW * 2 + GAP} ${H_EW}`,
  alt: 'Two routes to a methylcyclohexane alkene. Left: 1-methylcyclohexan-1-ol with H2SO4 and heat gives mostly 1-methylcyclohexene, with the C=C inside the ring, and a little methylenecyclohexane. Right: cyclohexanone with Ph3P=CH2 gives only methylenecyclohexane, with the C=C outside the ring where the C=O was.',
  build() { return pElim(0, 0) + pWit(PW + GAP, 0); },
  caption: 'On the right, the highlighted bonds mark the C=O and the C=C that takes its place.',
});

FIGURES.push({
  id: 'l-elim-route',
  lessons: ['wittig-reaction'],
  viewBox: `0 0 ${PW} ${H_EW}`,
  alt: '1-methylcyclohexan-1-ol with H2SO4 and heat gives mostly 1-methylcyclohexene, with the C=C inside the ring, and a little methylenecyclohexane, with the C=C outside it.',
  build() { return pElim(0, 0); },
  caption: 'The C=C can form toward three neighbors of the ring carbon. The most substituted choice wins.',
});

FIGURES.push({
  id: 'l-wittig-route',
  lessons: ['wittig-reaction'],
  viewBox: `0 0 ${PW} ${H_EW}`,
  alt: 'Cyclohexanone with Ph3P=CH2 gives only methylenecyclohexane: the C=C forms where the C=O was, outside the ring.',
  build() { return pWit(0, 0); },
  caption: 'The highlighted C=O becomes the highlighted C=C, pointing out of the ring.',
});

/* -------------------------------------------- the stabilized ylide ------ */
const H_STAB = 336;
FIGURES.push({
  id: 'stabilized-ylide',
  section: 'wittig-reaction',
  anchor: '<!-- fig:stabilized-ylide:start -->',
  lessons: ['wittig-reaction'],
  viewBox: `0 0 ${PW} ${H_STAB}`,
  alt: 'The stabilized ylide Ph3P+–CH−–CO2Et drawn two ways. Top: the negative charge on the ylide carbon, with curved arrows moving the lone pair into a C=C bond and the C=O pi bond onto oxygen. Bottom: Ph3P+–CH=C(O−)OEt, with the negative charge on oxygen.',
  build() {
    let s = frameP(0, 0, H_STAB, 'a stabilized ylide: the charge spreads', ['the lower drawing puts the charge on O']);
    const Pp = A(46, 78, 'Ph₃P⁺'), C = A(126, 78, 'CH⁻', 'hi'), Cc = A(200, 78, 'C'),
          O = A(200, 134, 'O'), E = A(274, 78, 'OEt');
    s += bd(Pp, C) + bd(C, Cc) + bd(Cc, O, { order: 2 }) + bd(Cc, E);
    s += lp(C, -90) + lp(O, 145) + lp(O, 35);
    s += draw(Pp, C, Cc, O, E);
    s += curve(off(lpAt(C, -90), 6, -2), off(mid(C, Cc), 2, -8), { bow: -12 });
    s += curve(P(Cc.x + 6, (Cc.y + O.y) / 2), P(O.x + 16, O.y - 6), { bow: -8 });
    s += arrow(P(110, 158), P(110, 184), { size: 7 }) + arrow(P(110, 184), P(110, 158), { size: 7 });
    const Pq = A(46, 222, 'Ph₃P⁺'), Cq = A(126, 222, 'CH', 'hi'), Cr = A(200, 222, 'C'),
          Oq = A(200, 276, 'O⁻', 'warn'), Eq = A(274, 222, 'OEt');
    s += bd(Pq, Cq) + bd(Cq, Cr, { order: 2 }) + bd(Cr, Oq) + bd(Cr, Eq);
    s += lp(Oq, 150) + lp(Oq, 30) + lp(Oq, 90, 5);
    s += draw(Pq, Cq, Cr, Oq, Eq);
    return s;
  },
  caption: 'The two arrows in the upper drawing lead to the lower one. The double-headed arrow joins two drawings of one molecule.',
});

/* ----------------------------------------------------- E and Z ---------- */
const H_EZ = 392;
function pEZ(ox, oy, stab) {
  const R = stab ? 'CO₂Et' : 'CH₃';
  const title = stab ? 'stabilized: Ph₃P=CH–CO₂Et' : 'unstabilized: Ph₃P=CH–CH₃';
  const last = stab
    ? [`(${it('E')}) alkene: Ph and CO₂Et on opposite sides`, 'fg-tag-good']
    : [`(${it('Z')}) alkene: Ph and CH₃ on the same side`, 'fg-tag-good'];
  let s = frameP(ox, oy, H_EZ, title, [last], stab ? 'good' : 'hi');
  s += tag(ox + PW / 2, oy + 40, 'each with benzaldehyde, PhCHO', { cls: 'fg-tag-mut' });
  const Pp = A(ox + 90, oy + 90, 'Ph₃P'), Ca = A(ox + 180, oy + 90, 'C', 'hi'),
        Cb = A(ox + 180, oy + 170, 'C', 'hi'), O = A(ox + 90, oy + 170, 'O');
  const Ra = A(ox + 256, oy + 66, R), Ha = A(ox + 248, oy + 112, 'H'),
        Hb = A(ox + 248, oy + 148, 'H'), Ph = A(ox + 254, oy + 194, 'Ph');
  s += bd(Pp, Ca) + bd(Ca, Cb) + bd(Cb, O) + bd(O, Pp);
  s += wd(Ca, Ra) + hs(Ca, Ha);
  s += stab ? hs(Cb, Ph) + wd(Cb, Hb) : wd(Cb, Ph) + hs(Cb, Hb);
  s += lp(O, 135) + lp(O, 225);
  s += draw(Pp, Ca, Cb, O, Ra, Ha, Hb, Ph);
  s += rich(ox + PW / 2, oy + 222, stab
    ? `${it('trans')} ring: CO₂Et toward you, Ph away`
    : `${it('cis')} ring: CH₃ and Ph both toward you`);
  s += down(ox + PW / 2, oy + 232, oy + 256);
  // The alkene: C1 came from the aldehyde, C2 from the ylide.
  const C1 = A(ox + 140, oy + 304, 'C', 'hi'), C2 = A(ox + 204, oy + 304, 'C', 'hi');
  const P1 = A(ox + 104, oy + 268, 'Ph'), H1 = A(ox + 108, oy + 342, 'H');
  const up = stab ? A(ox + 238, oy + 270, 'H') : A(ox + 242, oy + 268, 'CH₃');
  const dn = stab ? A(ox + 248, oy + 342, 'CO₂Et') : A(ox + 236, oy + 340, 'H');
  s += bd(C1, C2, { order: 2 }) + bd(C1, P1) + bd(C1, H1) + bd(C2, up) + bd(C2, dn);
  s += draw(C1, C2, P1, H1, up, dn);
  return s;
}

FIGURES.push({
  id: 'ez-oxaphosphetanes',
  section: 'wittig-reaction',
  anchor: '<!-- fig:ez-oxaphosphetanes:start -->',
  viewBox: `0 0 ${PW * 2 + GAP} ${H_EZ}`,
  alt: 'Left: benzaldehyde with the unstabilized ylide Ph3P=CH–CH3 gives the cis oxaphosphetane, with CH3 and Ph both on wedges, which opens to the Z alkene with Ph and CH3 on the same side. Right: benzaldehyde with the stabilized ylide Ph3P=CH–CO2Et gives the trans oxaphosphetane, CO2Et on a wedge and Ph on a hash, which opens to the E alkene with Ph and CO2Et on opposite sides.',
  build() { return pEZ(0, 0, false) + pEZ(PW + GAP, 0, true); },
  caption: 'Wedges point toward you and hashes away. Compare each ring with the alkene drawn under it.',
});

FIGURES.push({
  id: 'l-ez-oxaphosphetanes',
  lessons: ['wittig-reaction'],
  viewBox: `0 0 ${PW} ${H_EZ * 2 + 20}`,
  alt: 'Top: the unstabilized ylide Ph3P=CH–CH3 with benzaldehyde gives the cis oxaphosphetane and then the Z alkene. Bottom: the stabilized ylide Ph3P=CH–CO2Et with benzaldehyde gives the trans oxaphosphetane and then the E alkene.',
  build() { return stack([[(x, y) => pEZ(x, y, false), H_EZ], [(x, y) => pEZ(x, y, true), H_EZ]], 20, false).svg; },
  caption: 'Wedges point toward you and hashes away. Compare each ring with the alkene under it.',
});

/* ------------------------------------------------ the disconnection ----- */
const H_T = 150, H_R = 296;
function rowTag(ox, y, s) { return text(ox + 14, y + 4, s, { cls: 'fg-tag-mut', anchor: 'start', size: 11 }); }

function pTarget(ox, oy) {
  let s = frameP(ox, oy, H_T, 'the target: cut the C=C', ['either half can become the C=O'], 'hi');
  const Ph = A(ox + 44, oy + 74, 'Ph'), C1 = A(ox + 106, oy + 74, 'CH', 'hi'), C2 = A(ox + 172, oy + 74, 'CH', 'hi'),
        C3 = A(ox + 234, oy + 74, 'CH'), M1 = A(ox + 292, oy + 50, 'CH₃'), M2 = A(ox + 292, oy + 98, 'CH₃');
  s += bd(Ph, C1) + bd(C1, C2, { order: 2 }) + bd(C2, C3) + bd(C3, M1) + bd(C3, M2);
  s += draw(Ph, C1, C2, C3, M1, M2);
  s += `<line class="fg-dash-hi" x1="${ox + 139}" y1="${oy + 46}" x2="${ox + 139}" y2="${oy + 104}"></line>`;
  return s;
}

function pRouteA(ox, oy) {
  let s = frameP(ox, oy, H_R, '(a) the C=O on the Ph side', ['primary halide: fine for SN2', `unstabilized ylide: mostly ${it('Z')}`]);
  s += rowTag(ox, oy + 70, 'C=O') + rowTag(ox, oy + 142, 'ylide') + rowTag(ox, oy + 224, 'halide');
  const Ph = A(ox + 120, oy + 70, 'Ph'), Ca = A(ox + 180, oy + 70, 'CH', 'hi'), O = A(ox + 240, oy + 70, 'O');
  s += bd(Ph, Ca) + bd(Ca, O, { order: 2 }) + lp(O, -50) + lp(O, 50) + draw(Ph, Ca, O);
  const Pp = A(ox + 112, oy + 142, 'Ph₃P'), Cy = A(ox + 180, oy + 142, 'CH', 'hi'), Ci = A(ox + 238, oy + 142, 'CH'),
        M1 = A(ox + 292, oy + 120, 'CH₃'), M2 = A(ox + 292, oy + 164, 'CH₃');
  s += bd(Pp, Cy, { order: 2 }) + bd(Cy, Ci) + bd(Ci, M1) + bd(Ci, M2) + draw(Pp, Cy, Ci, M1, M2);
  const Br = A(ox + 112, oy + 224, 'Br', 'warn'), Ch = A(ox + 176, oy + 224, 'CH₂', 'hi'), Cj = A(ox + 238, oy + 224, 'CH'),
        M3 = A(ox + 292, oy + 202, 'CH₃'), M4 = A(ox + 292, oy + 246, 'CH₃');
  s += bd(Br, Ch) + bd(Ch, Cj) + bd(Cj, M3) + bd(Cj, M4) + draw(Br, Ch, Cj, M3, M4);
  return s;
}

function pRouteB(ox, oy) {
  let s = frameP(ox, oy, H_R, '(b) the C=O on the CH(CH₃)₂ side', ['benzylic halide: fine for SN2', `semi-stabilized ylide: poor ${it('E')}/${it('Z')} ratio`]);
  s += rowTag(ox, oy + 70, 'C=O') + rowTag(ox, oy + 142, 'ylide') + rowTag(ox, oy + 224, 'halide');
  const M1 = A(ox + 104, oy + 48, 'CH₃'), M2 = A(ox + 104, oy + 92, 'CH₃'), Ci = A(ox + 158, oy + 70, 'CH'),
        Ca = A(ox + 216, oy + 70, 'CH', 'hi'), O = A(ox + 274, oy + 70, 'O');
  s += bd(M1, Ci) + bd(M2, Ci) + bd(Ci, Ca) + bd(Ca, O, { order: 2 }) + lp(O, -50) + lp(O, 50);
  s += draw(M1, M2, Ci, Ca, O);
  const Pp = A(ox + 120, oy + 142, 'Ph₃P'), Cy = A(ox + 188, oy + 142, 'CH', 'hi'), Ph = A(ox + 248, oy + 142, 'Ph');
  s += bd(Pp, Cy, { order: 2 }) + bd(Cy, Ph) + draw(Pp, Cy, Ph);
  const Br = A(ox + 120, oy + 224, 'Br', 'warn'), Ch = A(ox + 184, oy + 224, 'CH₂', 'hi'), Ph2 = A(ox + 248, oy + 224, 'Ph');
  s += bd(Br, Ch) + bd(Ch, Ph2) + draw(Br, Ch, Ph2);
  return s;
}

FIGURES.push({
  id: 'wittig-disconnection',
  section: 'wittig-reaction',
  anchor: '<!-- fig:wittig-disconnection:start -->',
  viewBox: `0 0 ${PW * 2 + GAP} ${H_T + 30 + H_R}`,
  alt: 'Planning a Wittig backwards for Ph–CH=CH–CH(CH3)2. The target with a dashed cut through its C=C. Route (a): benzaldehyde, the ylide Ph3P=CH–CH(CH3)2, and the halide BrCH2–CH(CH3)2, primary. Route (b): 2-methylpropanal, the ylide Ph3P=CH–Ph, and the halide BrCH2–Ph, benzylic.',
  build() {
    const tx = (PW * 2 + GAP - PW) / 2, y2 = H_T + 30;
    let s = pTarget(tx, 0) + pRouteA(0, y2) + pRouteB(PW + GAP, y2);
    s += arrow(P(tx + 60, H_T + 4), P(PW / 2 + 40, y2 - 4), { size: 7 });
    s += arrow(P(tx + PW - 60, H_T + 4), P(PW + GAP + PW / 2 - 40, y2 - 4), { size: 7 });
    return s;
  },
  caption: 'Each column is one way to split the target. In each, the ylide row sits above the halide it is made from: the halide&rsquo;s CH<sub>2</sub> becomes the ylide&rsquo;s CH.',
});

FIGURES.push({
  id: 'l-disconnection',
  lessons: ['wittig-reaction'],
  viewBox: `0 0 ${PW} ${H_T + H_R * 2 + 2 * 26}`,
  alt: 'Ph–CH=CH–CH(CH3)2 cut through its C=C, then two routes. (a) benzaldehyde with Ph3P=CH–CH(CH3)2, made from the primary halide BrCH2–CH(CH3)2. (b) 2-methylpropanal with Ph3P=CH–Ph, made from benzyl bromide.',
  build() { return stack([[pTarget, H_T], [pRouteA, H_R], [pRouteB, H_R]]).svg; },
  caption: 'In each route, the halide&rsquo;s CH<sub>2</sub> becomes the ylide&rsquo;s CH.',
});

/* -------------------------------------------------------- the HWE ------- */
const H_HWE = 250;
FIGURES.push({
  id: 'hwe-phosphonate',
  section: 'wittig-reaction',
  anchor: '<!-- fig:hwe-phosphonate:start -->',
  viewBox: `0 0 ${PW * 2 + GAP} ${H_HWE}`,
  alt: 'Left: triethyl phosphonoacetate, a phosphorus with a P=O, two OEt groups and a CH2 joined to an ester, with the CH2 highlighted as the carbon that loses a proton. Right: after the anion reacts with an aldehyde RCHO, the E alkene R–CH=CH–CO2Et forms, with R and CO2Et on opposite sides, plus the diethyl phosphate salt.',
  build() {
    let s = frameP(0, 0, H_HWE, 'the phosphonate', ['NaH removes an H from the CH₂', 'the anion adds to an aldehyde']);
    const Pp = A(110, 118, 'P', 'warn'), Ou = A(110, 62, 'O'), E1 = A(46, 118, 'EtO'), E2 = A(110, 176, 'OEt'),
          Cm = A(182, 118, 'CH₂', 'hi'), Cc = A(250, 118, 'C'), O2 = A(250, 62, 'O'), E3 = A(308, 150, 'OEt');
    s += bd(Pp, Ou, { order: 2 }) + bd(Pp, E1) + bd(Pp, E2) + bd(Pp, Cm) + bd(Cm, Cc) + bd(Cc, O2, { order: 2 }) + bd(Cc, E3);
    s += lp(Ou, -150) + lp(Ou, -30) + lp(O2, -150) + lp(O2, -30);
    s += draw(Pp, Ou, E1, E2, Cm, Cc, O2, E3);

    const ox = PW + GAP;
    s += frameP(ox, 0, H_HWE, `the product: an (${it('E')}) alkene`, [['the phosphate salt washes out in water', 'fg-tag-good']], 'good');
    s += tag(ox + PW / 2, 46, 'the anion + an aldehyde, RCHO', { cls: 'fg-tag-mut' });
    s += down(ox + PW / 2, 56, 82);
    const C1 = A(ox + 146, 132, 'CH', 'hi'), C2 = A(ox + 210, 132, 'CH', 'hi'),
          R = A(ox + 106, 100, 'R'), E = A(ox + 256, 166, 'CO₂Et');
    s += bd(C1, C2, { order: 2 }) + bd(C1, R) + bd(C2, E) + draw(C1, C2, R, E);
    s += text(ox + PW / 2, 208, '+  (EtO)₂PO₂⁻ Na⁺', { cls: 'fg-lbl' });
    s += right(PW + 6, PW + GAP - 6, 118);
    return s;
  },
  caption: 'Left, the highlighted CH<sub>2</sub> is the carbon that loses a proton. Right, the charged by-product is the part that washes out.',
});

export default FIGURES;
