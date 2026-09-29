/* Figures for the organolithium-reagents notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Most drawings are built from 340-wide panels. The notes page sets the
   panels side by side; the lesson copy (id prefix l-) stacks the same panels,
   so the two pages cannot drift apart. Lesson text uses fg-lbl and fg-tag
   only, never fg-sm. */
import { atom, bond, arrow, curve, lonePair, text, tag, label, panel, P } from '../lib/ochem-figure.mjs';
import { sk, ringDouble, benzene } from '../lib/ochem-skeletal.mjs';
import { lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const TOPIC = 'organolithium-reagents';

/* ---- small shared pieces ---------------------------------------------- */

/* A charge or a small superscript-style mark beside an atom. */
const mark = (x, y, s) => text(x, y, s, { cls: 'fg-lbl', size: 13 });
/* A group written as text, with no atom circle (e.g. "Li⁺"). */
const grp = (x, y, s, anchor = 'middle') => text(x, y + 4.5, s, { cls: 'fg-lbl', size: 12.5, anchor });
/* Italic prefix, as in cis-pent-2-ene. The kit's text() escapes markup, so
   this one is written out by hand. */
const italicName = (x, y, pre, rest, cls = 'fg-tag') =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle" font-size="11"><tspan font-style="italic">${pre}</tspan>${rest}</text>`;
/* A skeletal isopropyl: vertex v bonded to two methyl vertices. */
const iPr = (v, m1, m2) => sk(v, m1) + sk(v, m2);
/* Shift a list of drawing calls: every panel is written at its own origin. */
const at = (ox, oy) => (x, y) => P(ox + x, oy + y);

/* ======================================================================
   1. Where a Grignard stalls on a hindered ketone.
   2,4-Dimethylpentan-3-one (diisopropyl ketone) with isopropylmagnesium
   bromide: the reagent acts as a base (enolization) or passes a hydride
   from its own beta carbon through a six-membered ring (reduction).
   Isopropyllithium adds instead.
   ====================================================================== */
const STALL_H = 250;

function enolizationPanel(ox, oy) {
  const p = at(ox, oy);
  let s = panel(ox + 2, oy + 2, 336, STALL_H - 4, { kind: 'warn' });
  s += tag(ox + 170, oy + 24, 'Grignard as a base: enolization');
  const C = p(200, 106), O = p(200, 56);
  const L = p(160, 128), R = p(240, 128);
  const H = p(110, 168);
  s += bond(C, O, { order: 2, rFrom: 15, rTo: 15 });
  s += bond(C, L, { rFrom: 15, rTo: 0 });
  s += bond(C, R, { rFrom: 15, rTo: 0 });
  s += iPr(L, p(122, 106), p(160, 172));
  s += iPr(R, p(278, 106), p(240, 172));
  s += bond(L, H, { rFrom: 0, rTo: 12 });
  s += atom(C.x, C.y, 'C');
  s += atom(O.x, O.y, 'O');
  s += atom(H.x, H.y, 'H', { kind: 'warn', r: 12 });
  s += tag(ox + 170, oy + 146, 'α', { anchor: 'start' });
  /* The Grignard, below and to the left of the alpha H. */
  const G = p(70, 214), Mg = p(128, 214), Br = p(184, 214);
  s += iPr(G, p(36, 194), p(36, 234));
  s += bond(G, Mg, { rFrom: 0, rTo: 16 });
  s += bond(Mg, Br, { rFrom: 16, rTo: 15 });
  s += atom(Mg.x, Mg.y, 'Mg', { kind: 'hi' });
  s += atom(Br.x, Br.y, 'Br');
  s += curve(p(92, 207), p(104, 182), { bow: -12 });
  s += curve(p(128, 141), p(180, 112), { bow: -18 });
  s += curve(p(206, 83), p(220, 58), { bow: -12 });
  s += tag(ox + 270, oy + 206, 'enolate forms;', { cls: 'fg-tag-warn' });
  s += tag(ox + 270, oy + 224, 'workup gives', { cls: 'fg-tag-warn' });
  s += tag(ox + 270, oy + 242 - 4, 'the ketone back', { cls: 'fg-tag-warn' });
  return s;
}

function reductionPanel(ox, oy) {
  const p = at(ox, oy);
  let s = panel(ox + 2, oy + 2, 336, STALL_H - 4, { kind: 'warn' });
  s += tag(ox + 170, oy + 24, 'Grignard as a hydride donor: reduction');
  const C = p(120, 142), O = p(120, 88);
  const L = p(80, 120), R = p(100, 182);
  s += bond(C, O, { order: 2, rFrom: 15, rTo: 15 });
  s += bond(C, L, { rFrom: 15, rTo: 0 });
  s += bond(C, R, { rFrom: 15, rTo: 0 });
  s += iPr(L, p(42, 140), p(80, 78));
  s += iPr(R, p(62, 204), p(120, 222));
  /* The six atoms of the ring: O, Mg, the Grignard carbon G, its beta
     carbon B, the beta H, and the carbonyl carbon. */
  const Mg = p(206, 70), Br = p(262, 48), G = p(262, 110), B = p(240, 162), H = p(182, 172);
  s += `<line class="fg-dash" x1="${O.x + 15}" y1="${O.y - 4}" x2="${Mg.x - 16}" y2="${Mg.y + 4}"></line>`;
  s += bond(Mg, Br, { rFrom: 16, rTo: 15 });
  s += bond(Mg, G, { rFrom: 16, rTo: 0 });
  s += sk(G, B);
  s += sk(G, p(304, 128));
  s += bond(B, H, { rFrom: 0, rTo: 12 });
  s += atom(C.x, C.y, 'C');
  s += atom(O.x, O.y, 'O');
  s += atom(Mg.x, Mg.y, 'Mg', { kind: 'hi' });
  s += atom(Br.x, Br.y, 'Br');
  s += atom(H.x, H.y, 'H', { kind: 'warn', r: 12 });
  s += tag(ox + 250, oy + 178, 'β', { anchor: 'start' });
  s += curve(p(212, 176), p(136, 152), { bow: -66 });
  s += curve(p(229, 97), p(244, 133), { bow: 10 });
  s += curve(p(114, 115), p(104, 92), { bow: -10 });
  s += tag(ox + 250, oy + 214, 'propene leaves;', { cls: 'fg-tag-warn' });
  s += tag(ox + 250, oy + 232, 'workup gives a 2° alcohol', { cls: 'fg-tag-warn' });
  return s;
}

function additionPanel(ox, oy) {
  const p = at(ox, oy);
  let s = panel(ox + 2, oy + 2, 336, STALL_H - 4, { kind: 'good' });
  s += tag(ox + 170, oy + 24, 'isopropyllithium: addition wins', { cls: 'fg-tag-good' });
  const C = p(130, 140), O = p(130, 86);
  const L = p(90, 162), R = p(170, 162);
  s += bond(C, O, { order: 2, rFrom: 15, rTo: 15 });
  s += bond(C, L, { rFrom: 15, rTo: 0 });
  s += bond(C, R, { rFrom: 15, rTo: 0 });
  s += iPr(L, p(52, 140), p(90, 206));
  s += iPr(R, p(208, 140), p(170, 206));
  s += atom(C.x, C.y, 'C');
  s += atom(O.x, O.y, 'O');
  const G = p(236, 92), Li = p(276, 136);
  s += iPr(G, p(236, 50), p(278, 72));
  s += bond(G, Li, { rFrom: 0, rTo: 15 });
  s += atom(Li.x, Li.y, 'Li', { kind: 'hi' });
  s += curve(p(254, 112), p(148, 128), { bow: 30 });
  s += curve(p(136, 113), p(146, 90), { bow: -10 });
  s += tag(ox + 270, oy + 206, 'new C–C bond;', { cls: 'fg-tag-good' });
  s += tag(ox + 270, oy + 224, 'workup gives', { cls: 'fg-tag-good' });
  s += tag(ox + 270, oy + 242 - 4, 'the 3° alcohol', { cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'grignard-stalls',
  section: TOPIC,
  anchor: '<h3>Where RLi succeeds and RMgX does not</h3>',
  viewBox: `0 0 760 ${STALL_H * 2 + 20}`,
  alt: 'Three panels on diisopropyl ketone. Top left: isopropylmagnesium bromide takes an alpha hydrogen, giving the enolate. Top right: the same Grignard passes a hydrogen from its beta carbon to the carbonyl carbon through a six-membered ring of atoms, releasing propene. Bottom: isopropyllithium adds to the carbonyl carbon instead.',
  build() {
    return enolizationPanel(20, 0) + reductionPanel(400, 0) + additionPanel(210, STALL_H + 20);
  },
  caption: 'Diisopropyl ketone with an isopropyl reagent. In both red panels the Grignard carbon never bonds to the carbonyl carbon: it takes an α hydrogen, or it hands over a hydrogen of its own. In the green panel the organolithium carbon makes that bond.',
});

FIGURES.push({
  id: 'l-grignard-stalls',
  lessons: [TOPIC],
  viewBox: `0 0 340 ${STALL_H * 3 + 20}`,
  alt: 'Diisopropyl ketone three ways, stacked: isopropylmagnesium bromide takes an alpha hydrogen (enolization); it passes a beta hydrogen to the carbonyl carbon through a six-membered ring, releasing propene (reduction); isopropyllithium adds to the carbonyl carbon.',
  build() {
    return enolizationPanel(0, 0) + reductionPanel(0, STALL_H + 10) + additionPanel(0, 2 * STALL_H + 20);
  },
  caption: 'In both red panels the Grignard carbon never bonds to the carbonyl carbon. In the green panel the organolithium carbon makes that bond.',
});

/* ======================================================================
   2. Butanoic acid + 2 CH3Li -> pentan-2-one.
   ====================================================================== */
const ACID_H = 200;
const propyl = (p, C) => {
  /* A skeletal propyl chain running left from the carbonyl carbon C. */
  const a = p(C.dx - 40, C.dy - 22), b = p(C.dx - 74, C.dy), c = p(C.dx - 108, C.dy - 22);
  return bond(C.pt, a, { rFrom: 15, rTo: 0 }) + sk(a, b) + sk(b, c);
};

function deprotonationPanel(ox, oy) {
  const p = at(ox, oy);
  let s = panel(ox + 2, oy + 2, 336, ACID_H - 4);
  s += tag(ox + 170, oy + 24, 'first CH₃Li: takes the O–H proton');
  const C = p(140, 122), O1 = p(140, 70), O2 = p(188, 144), H = p(232, 124);
  s += propyl(p, { dx: 140, dy: 122, pt: C });
  s += bond(C, O1, { order: 2, rFrom: 15, rTo: 15 });
  s += bond(C, O2, { rFrom: 15, rTo: 15 });
  s += bond(O2, H, { rFrom: 15, rTo: 12 });
  s += atom(C.x, C.y, 'C');
  s += atom(O1.x, O1.y, 'O');
  s += atom(O2.x, O2.y, 'O');
  s += atom(H.x, H.y, 'H', { kind: 'warn', r: 12 });
  const Me = p(272, 166), Li = p(318, 166);
  s += bond(Me, Li, { rFrom: 17, rTo: 15 });
  s += atom(Me.x, Me.y, 'CH₃', { r: 17 });
  s += atom(Li.x, Li.y, 'Li', { kind: 'hi' });
  s += curve(p(295, 158), p(244, 132), { bow: 16 });
  s += curve(p(212, 130), p(202, 156), { bow: -12 });
  s += tag(ox + 110, oy + 182, 'gives the carboxylate and CH₄');
  return s;
}

function additionToCarboxylatePanel(ox, oy) {
  const p = at(ox, oy);
  let s = panel(ox + 2, oy + 2, 336, ACID_H - 4);
  s += tag(ox + 170, oy + 24, 'second CH₃Li: adds to the carbon');
  const C = p(140, 112), O1 = p(140, 60), O2 = p(192, 112);
  s += propyl(p, { dx: 140, dy: 112, pt: C });
  s += bond(C, O1, { order: 2, rFrom: 15, rTo: 15 });
  s += bond(C, O2, { rFrom: 15, rTo: 15 });
  s += atom(C.x, C.y, 'C', { kind: 'hi' });
  s += atom(O1.x, O1.y, 'O');
  s += atom(O2.x, O2.y, 'O');
  s += mark(O2.x + 20, O2.y - 12, '−');
  s += grp(O2.x + 30, O2.y + 12, 'Li⁺', 'start');
  const Me = p(196, 170), Li = p(244, 170);
  s += bond(Me, Li, { rFrom: 17, rTo: 15 });
  s += atom(Me.x, Me.y, 'CH₃', { r: 17 });
  s += atom(Li.x, Li.y, 'Li', { kind: 'hi' });
  s += curve(p(220, 162), p(152, 126), { bow: -18 });
  s += curve(p(134, 86), p(122, 62), { bow: 10 });
  return s;
}

function dianionPanel(ox, oy) {
  const p = at(ox, oy);
  let s = panel(ox + 2, oy + 2, 336, ACID_H - 4, { kind: 'hi' });
  s += tag(ox + 170, oy + 24, 'the dianion waits in the flask');
  const C = p(150, 106), Oa = p(150, 54), Ob = p(150, 158), Me = p(204, 106);
  s += propyl(p, { dx: 150, dy: 106, pt: C });
  s += bond(C, Oa, { rFrom: 16, rTo: 15 });
  s += bond(C, Ob, { rFrom: 16, rTo: 15 });
  s += bond(C, Me, { rFrom: 16, rTo: 17, cls: 'fg-bond-hi' });
  s += atom(C.x, C.y, 'C', { kind: 'hi' });
  s += atom(Oa.x, Oa.y, 'O');
  s += atom(Ob.x, Ob.y, 'O');
  s += atom(Me.x, Me.y, 'CH₃', { r: 17 });
  s += mark(Oa.x + 20, Oa.y - 10, '−');
  s += mark(Ob.x + 20, Ob.y - 10, '−');
  s += grp(Oa.x + 30, Oa.y + 5, 'Li⁺', 'start');
  s += grp(Ob.x + 30, Ob.y + 5, 'Li⁺', 'start');
  s += tag(ox + 280, oy + 70, 'two O⁻ on', { cls: 'fg-tag-warn' });
  s += tag(ox + 280, oy + 88, 'one carbon:', { cls: 'fg-tag-warn' });
  s += tag(ox + 280, oy + 106, 'nothing can', { cls: 'fg-tag-warn' });
  s += tag(ox + 280, oy + 124, 'leave', { cls: 'fg-tag-warn' });
  return s;
}

function workupPanel(ox, oy) {
  const p = at(ox, oy);
  let s = panel(ox + 2, oy + 2, 336, ACID_H - 4, { kind: 'good' });
  s += tag(ox + 170, oy + 24, 'workup: H₃O⁺, then water leaves', { cls: 'fg-tag-good' });
  /* The hydrate, skeletal: C2 carries two OH groups. */
  const h = [p(30, 124), p(64, 102), p(98, 124), p(132, 102), p(166, 124)];
  for (let i = 0; i < 4; i++) s += sk(h[i], h[i + 1]);
  const OHup = p(64, 58), OHdn = p(64, 150);
  s += bond(h[1], OHup, { rFrom: 0, rTo: 15 });
  s += bond(h[1], OHdn, { rFrom: 0, rTo: 15 });
  s += atom(OHup.x, OHup.y, 'OH');
  s += atom(OHdn.x, OHdn.y, 'OH');
  s += arrow(p(180, 110), p(218, 110));
  s += tag(ox + 199, oy + 96, '−H₂O');
  /* Pentan-2-one. */
  const k = [p(228, 124), p(254, 108), p(280, 124), p(304, 108), p(328, 124)];
  for (let i = 0; i < 4; i++) s += sk(k[i], k[i + 1]);
  const Ok = p(254, 66);
  s += bond(k[1], Ok, { order: 2, rFrom: 0, rTo: 15 });
  s += atom(Ok.x, Ok.y, 'O');
  s += tag(ox + 98, oy + 180, 'the hydrate', { cls: 'fg-tag-mut' });
  s += tag(ox + 278, oy + 180, 'pentan-2-one', { cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'acid-to-ketone',
  section: TOPIC,
  anchor: '<b>A carboxylic acid straight to a ketone.</b>',
  viewBox: `0 0 760 ${ACID_H * 2 + 20}`,
  alt: 'Butanoic acid to pentan-2-one in four panels. First, methyllithium takes the O–H proton, giving the carboxylate and methane. Second, a second methyllithium adds to the carboxylate carbon. Third, the result is a dianion: one carbon carrying two negatively charged oxygens, each paired with a lithium ion. Fourth, acidic workup gives the hydrate, which loses water to give pentan-2-one.',
  build() {
    return deprotonationPanel(20, 0) + additionToCarboxylatePanel(400, 0) +
      dianionPanel(20, ACID_H + 20) + workupPanel(400, ACID_H + 20);
  },
  caption: 'Read the panels left to right, top row first. The highlighted C–CH₃ bond in the third panel is the new carbon–carbon bond.',
});

FIGURES.push({
  id: 'l-acid-to-ketone',
  lessons: [TOPIC],
  viewBox: `0 0 340 ${ACID_H * 3 + 20}`,
  alt: 'Three stacked panels: a second methyllithium adds to the carboxylate carbon; the result is a dianion, one carbon carrying two negatively charged oxygens; acidic workup gives the hydrate, which loses water to give pentan-2-one.',
  build() {
    return additionToCarboxylatePanel(0, 0) + dianionPanel(0, ACID_H + 10) + workupPanel(0, 2 * ACID_H + 20);
  },
  caption: 'The middle panel is the dianion. The ketone first appears in the bottom panel, after workup.',
});

/* ======================================================================
   3. Lithium-halogen exchange: bromobenzene + n-BuLi.
   No curved arrows: the course draws only the outcome here, which bond is
   gone and which is new.
   ====================================================================== */
FIGURES.push({
  id: 'li-halogen-exchange',
  section: TOPIC,
  anchor: '<b>Lithium&ndash;halogen exchange</b>',
  viewBox: '0 0 760 190',
  alt: 'Bromobenzene plus butyllithium gives phenyllithium plus 1-bromobutane. The lithium and the bromine trade places; the new C–Li and C–Br bonds are highlighted.',
  build() {
    let s = '';
    s += tag(380, 24, 'the lithium and the bromine trade places');
    const y = 96;
    /* bromobenzene */
    const r1 = benzene(70, y, 32, { rot: 0 });
    s += r1.svg;
    s += bond(r1.pts[0], P(146, y), { rFrom: 0, rTo: 16 });
    s += atom(146, y, 'Br', { kind: 'warn' });
    s += label(182, y + 5, '+');
    /* butyllithium */
    const bu = [P(208, y + 12), P(234, y - 8), P(260, y + 12), P(286, y - 8)];
    for (let i = 0; i < 3; i++) s += sk(bu[i], bu[i + 1]);
    s += bond(bu[3], P(326, y + 8), { rFrom: 0, rTo: 15 });
    s += atom(326, y + 8, 'Li', { kind: 'hi' });
    s += arrow(P(356, y), P(404, y));
    s += tag(380, y - 14, '−78 °C');
    /* phenyllithium */
    const r2 = benzene(460, y, 32, { rot: 0 });
    s += r2.svg;
    s += bond(r2.pts[0], P(536, y), { rFrom: 0, rTo: 15, cls: 'fg-bond-hi' });
    s += atom(536, y, 'Li', { kind: 'hi' });
    s += label(570, y + 5, '+');
    /* 1-bromobutane */
    const bb = [P(594, y + 12), P(620, y - 8), P(646, y + 12), P(672, y - 8)];
    for (let i = 0; i < 3; i++) s += sk(bb[i], bb[i + 1]);
    s += bond(bb[3], P(714, y + 8), { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' });
    s += atom(714, y + 8, 'Br', { kind: 'warn' });
    s += tag(88, 160, 'bromobenzene');
    s += tag(266, 160, 'butyllithium');
    s += tag(484, 160, 'phenyllithium', { cls: 'fg-tag-good' });
    s += tag(654, 160, '1-bromobutane');
    return s;
  },
  caption: 'The highlighted bonds are the new ones. The lithium ends up on the ring carbon, which is sp² and holds a negative charge better than the sp³ carbon of the butyl group.',
});

/* ======================================================================
   4. LDA: made from diisopropylamine and n-BuLi.
   ====================================================================== */
function ldaReactants(ox, oy) {
  const p = at(ox, oy);
  let s = panel(ox + 2, oy + 2, 336, 206);
  s += tag(ox + 170, oy + 24, 'diisopropylamine + butyllithium');
  const N = p(104, 122), H = p(104, 70);
  s += bond(N, H, { rFrom: 15, rTo: 12 });
  const L = p(66, 144), R = p(142, 144);
  s += bond(N, L, { rFrom: 15, rTo: 0 }) + bond(N, R, { rFrom: 15, rTo: 0 });
  s += iPr(L, p(28, 122), p(66, 188));
  s += iPr(R, p(180, 122), p(142, 188));
  s += atom(N.x, N.y, 'N');
  s += atom(H.x, H.y, 'H', { kind: 'warn', r: 12 });
  s += lonePair(N.x, N.y, 90);
  s += tag(ox + 64, oy + 64, 'pKa 36', { cls: 'fg-tag-mut' });
  const Li = p(236, 56);
  const bu = [p(236, 106), p(262, 126), p(288, 106), p(314, 126)];
  s += bond(Li, bu[0], { rFrom: 15, rTo: 0 });
  for (let i = 0; i < 3; i++) s += sk(bu[i], bu[i + 1]);
  s += atom(Li.x, Li.y, 'Li', { kind: 'hi' });
  s += curve(p(232, 84), p(119, 68), { bow: 22 });
  s += curve(p(98, 88), p(90, 108), { bow: 10 });
  s += tag(ox + 276, oy + 156, 'butane C–H', { cls: 'fg-tag-mut' });
  s += tag(ox + 276, oy + 174, 'pKa 50', { cls: 'fg-tag-mut' });
  return s;
}

function ldaProduct(ox, oy) {
  const p = at(ox, oy);
  let s = panel(ox + 2, oy + 2, 336, 206, { kind: 'good' });
  s += tag(ox + 170, oy + 24, 'LDA, lithium diisopropylamide', { cls: 'fg-tag-good' });
  const N = p(110, 96);
  const L = p(72, 118), R = p(148, 118);
  s += bond(N, L, { rFrom: 15, rTo: 0 }) + bond(N, R, { rFrom: 15, rTo: 0 });
  s += iPr(L, p(34, 96), p(72, 162));
  s += iPr(R, p(186, 96), p(148, 162));
  s += atom(N.x, N.y, 'N', { kind: 'hi' });
  s += lonePair(N.x, N.y, 215);
  s += lonePair(N.x, N.y, 325);
  s += mark(N.x, N.y - 30, '−');
  s += grp(ox + 110, oy + 150, 'Li⁺');
  s += tag(ox + 150, oy + 190, 'two isopropyl groups crowd the N', { cls: 'fg-tag-good' });
  s += label(ox + 214, oy + 101, '+');
  const bu = [p(234, 110), p(260, 90), p(286, 110), p(312, 90)];
  for (let i = 0; i < 3; i++) s += sk(bu[i], bu[i + 1]);
  s += tag(ox + 274, oy + 136, 'butane');
  return s;
}

FIGURES.push({
  id: 'lda-made',
  section: TOPIC,
  anchor: 'LDA is the one worth tracing back.',
  viewBox: '0 0 760 212',
  alt: 'Diisopropylamine plus butyllithium. Curved arrows: the C–Li bond electrons take the N–H proton, and the N–H bond electrons stay on nitrogen. The products are LDA, a nitrogen anion flanked by two isopropyl groups with a lithium ion, and butane.',
  build() {
    return ldaReactants(10, 2) + arrow(P(356, 106), P(404, 106)) + ldaProduct(412, 2);
  },
  caption: 'LDA: the nitrogen keeps two lone pairs and the negative charge, flanked by two isopropyl groups.',
});

FIGURES.push({
  id: 'l-lda-made',
  lessons: [TOPIC],
  viewBox: '0 0 340 470',
  alt: 'Diisopropylamine plus butyllithium, stacked. Curved arrows: the C–Li bond electrons take the N–H proton. The product is LDA, a nitrogen anion flanked by two isopropyl groups with a lithium ion, plus butane.',
  build() {
    return ldaReactants(0, 0) + arrow(P(170, 214), P(170, 254)) + ldaProduct(0, 262);
  },
  caption: 'LDA: the nitrogen keeps two lone pairs and the negative charge, flanked by two isopropyl groups.',
});

/* ======================================================================
   5. The acidity of the sp C–H: where the lone pair sits.
   ====================================================================== */
FIGURES.push({
  id: 's-character',
  section: TOPIC,
  lessons: [TOPIC],
  anchor: '<h3>Acetylides, the cheapest carbon nucleophile</h3>',
  viewBox: '0 0 340 266',
  alt: 'Three carbanions, each with its lone pair in a lobe drawn from the carbon. The ethyl anion (sp3, 25 percent s, from ethane at pKa 50) has the longest lobe; the vinyl anion (sp2, 33 percent s, from ethene at pKa 44) a shorter one; the acetylide (sp, 50 percent s, from ethyne at pKa 25) the shortest, held closest to the nucleus.',
  build() {
    let s = '';
    s += tag(170, 22, 'the lobe that holds the lone pair');
    const rows = [
      { y: 72, name: 'CH₃CH₂⁻', hyb: 'sp³ · 25% s', pka: 'ethane, pKa 50', rx: 40 },
      { y: 152, name: 'CH₂=CH⁻', hyb: 'sp² · 33% s', pka: 'ethene, pKa 44', rx: 31 },
      { y: 232, name: 'HC≡C⁻', hyb: 'sp · 50% s', pka: 'ethyne, pKa 25', rx: 22, hi: true },
    ];
    for (const r of rows) {
      s += label(46, r.y + 5, r.name);
      const cx = 110;
      s += lobeE(cx + 13 + r.rx, r.y, r.rx, 15, 'fg-orb');
      s += atom(cx, r.y, 'C', { kind: r.hi ? 'hi' : 'plain' });
      s += lonePair(cx, r.y, 0, { dist: 15 + r.rx * 0.9 });
      s += tag(272, r.y - 3, r.hyb, { cls: r.hi ? 'fg-tag-good' : 'fg-tag' });
      s += tag(272, r.y + 15, r.pka, { cls: 'fg-tag-mut' });
    }
    return s;
  },
  caption: 'Read down the column: as the s character rises, the lobe shortens and the pKa falls with it.',
});

/* ======================================================================
   6. Three things an acetylide does.
   ====================================================================== */
const acetylide = (x, y) => {
  let t = '';
  t += bond(P(x, y), P(x + 44, y), { rFrom: 12, rTo: 15 });
  t += bond(P(x + 44, y), P(x + 92, y), { order: 3, gap: 3.4, rFrom: 15, rTo: 16 });
  t += atom(x, y, 'H', { r: 12 });
  t += atom(x + 44, y, 'C');
  t += atom(x + 92, y, 'C', { kind: 'hi' });
  t += mark(x + 106, y - 16, '−');
  t += lonePair(x + 92, y, 0);
  return t;
};
/* A terminal alkyne drawn skeletal, a–b triple, b–c the new (highlighted) bond,
   a, b and c collinear because both alkyne carbons are sp. */
const alkyneHead = (x, y) => {
  const a = P(x, y), b = P(x + 44, y), c = P(x + 84, y);
  return { svg: bond(a, b, { order: 3, gap: 3.4, rFrom: 0, rTo: 0 }) + sk(b, c, true), c };
};

FIGURES.push({
  id: 'acetylide-three-jobs',
  section: TOPIC,
  anchor: 'An acetylide does three things',
  viewBox: '0 0 760 410',
  alt: 'The acetylide ion from ethyne with three electrophiles. With bromoethane it attacks the CH2 opposite the bromine and gives but-1-yne. With acetone it adds to the carbonyl carbon and, after acid workup, gives 2-methylbut-3-yn-2-ol. With ethylene oxide it opens the ring at a CH2 and, after workup, gives but-3-yn-1-ol. The new carbon–carbon bond is highlighted in each product.',
  build() {
    let s = '';
    const rowY = [78, 206, 334];
    rowY.forEach((y) => { s += panel(16, y - 60, 728, 118); });

    /* 1: bromoethane, SN2. */
    let y = rowY[0];
    s += acetylide(40, y);
    s += bond(P(232, y), P(290, y), { rFrom: 17, rTo: 16 });
    s += bond(P(232, y), P(232, y - 44), { rFrom: 17, rTo: 17 });
    s += atom(232, y, 'CH₂', { kind: 'warn', r: 17 });
    s += atom(290, y, 'Br', { kind: 'warn' });
    s += atom(232, y - 44, 'CH₃', { r: 17 });
    s += curve(P(158, y + 4), P(213, y + 5), { bow: 16 });
    s += curve(P(262, y + 3), P(300, y + 20), { bow: 12 });
    s += arrow(P(330, y), P(384, y));
    s += `<text class="fg-tag" x="357" y="${y - 12}" text-anchor="middle" font-size="11">S<tspan baseline-shift="sub" font-size="8">N</tspan>2</text>`;
    let h = alkyneHead(410, y);
    s += h.svg + sk(h.c, P(h.c.x + 30, y - 20));
    s += label(590, y + 5, '+ Br⁻');
    s += tag(470, y + 38, 'but-1-yne', { cls: 'fg-tag-good' });

    /* 2: acetone, addition. */
    y = rowY[1];
    s += acetylide(40, y);
    const C2 = P(236, y + 6);
    s += bond(C2, P(236, y - 40), { order: 2, rFrom: 15, rTo: 15 });
    s += bond(C2, P(290, y + 6), { rFrom: 15, rTo: 17 });
    s += bond(C2, P(236, y + 48), { rFrom: 15, rTo: 17 });
    s += atom(C2.x, C2.y, 'C', { kind: 'warn' });
    s += atom(236, y - 40, 'O');
    s += atom(290, y + 6, 'CH₃', { r: 17 });
    s += atom(236, y + 48, 'CH₃', { r: 17 });
    s += curve(P(158, y + 4), P(218, y + 8), { bow: 16 });
    s += curve(P(242, y - 16), P(254, y - 38), { bow: -10 });
    s += arrow(P(330, y), P(384, y));
    s += tag(357, y - 12, 'then H₃O⁺');
    h = alkyneHead(410, y);
    s += h.svg;
    s += bond(h.c, P(h.c.x, y - 40), { rFrom: 0, rTo: 15 });
    s += atom(h.c.x, y - 40, 'OH');
    s += sk(h.c, P(h.c.x + 40, y)) + sk(h.c, P(h.c.x, y + 40));
    s += tag(640, y + 5, '2-methylbut-3-yn-2-ol', { cls: 'fg-tag-good' });

    /* 3: ethylene oxide, ring opening at a CH2. */
    y = rowY[2];
    s += acetylide(40, y);
    const E1 = P(238, y + 16), E2 = P(298, y + 16), EO = P(268, y - 32);
    s += bond(E1, E2, { rFrom: 17, rTo: 17 });
    s += bond(E1, EO, { rFrom: 17, rTo: 15 });
    s += bond(E2, EO, { rFrom: 17, rTo: 15 });
    s += atom(E1.x, E1.y, 'CH₂', { kind: 'warn', r: 17 });
    s += atom(E2.x, E2.y, 'CH₂', { r: 17 });
    s += atom(EO.x, EO.y, 'O');
    s += curve(P(158, y + 4), P(219, y + 16), { bow: 16 });
    s += curve(P(247, y - 4), P(254, y - 36), { bow: 14 });
    s += arrow(P(330, y), P(384, y));
    s += tag(357, y - 12, 'then H₃O⁺');
    h = alkyneHead(410, y);
    s += h.svg;
    const d = P(h.c.x + 30, y - 20);
    s += sk(h.c, d);
    s += bond(d, P(d.x + 40, y), { rFrom: 0, rTo: 15 });
    s += atom(d.x + 40, y, 'OH');
    s += tag(650, y + 5, 'but-3-yn-1-ol', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The same carbanion in every row. Its lone pair always goes to a carbon, and the highlighted bond in each product is the one it made. Only the electrophile changes.',
});

/* ======================================================================
   7. Pent-2-yne to either pent-2-ene.
   ====================================================================== */
const pentyne = (x, y) => {
  const c1 = P(x, y), c2 = P(x + 40, y), c3 = P(x + 84, y), c4 = P(x + 124, y), c5 = P(x + 154, y - 20);
  return sk(c1, c2) + bond(c2, c3, { order: 3, gap: 3.4, rFrom: 0, rTo: 0 }) + sk(c3, c4) + sk(c4, c5);
};
/* An alkene C2=C3 drawn horizontal at (x, y), with its hydrogens shown. */
function pentene(x, y, cis) {
  const c2 = P(x, y), c3 = P(x + 50, y);
  const up = (q, dx) => P(q.x + dx, q.y - 43), dn = (q, dx) => P(q.x + dx, q.y + 43);
  let s = bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, gap: 3.4 });
  const c1 = dn(c2, -25), h2 = up(c2, -25);
  const c4 = cis ? dn(c3, 25) : up(c3, 25), h3 = cis ? up(c3, 25) : dn(c3, 25);
  const c5 = P(c4.x + 50, c4.y);
  s += sk(c2, c1) + sk(c3, c4) + sk(c4, c5);
  s += bond(c2, h2, { rFrom: 0, rTo: 12 }) + bond(c3, h3, { rFrom: 0, rTo: 12 });
  s += atom(h2.x, h2.y, 'H', { kind: 'hi', r: 12 }) + atom(h3.x, h3.y, 'H', { kind: 'hi', r: 12 });
  return s;
}

FIGURES.push({
  id: 'pentyne-two-alkenes',
  section: TOPIC,
  anchor: '<b>Step 5 &mdash; set the geometry.</b>',
  viewBox: '0 0 760 270',
  alt: 'Pent-2-yne in the middle left. An arrow up, labeled H2 and Lindlar catalyst, gives cis-pent-2-ene, with both alkene hydrogens on the same side. An arrow down, labeled Na in liquid NH3, gives trans-pent-2-ene, with the two hydrogens on opposite sides.',
  build() {
    let s = '';
    s += pentyne(40, 138);
    s += tag(112, 176, 'pent-2-yne');
    s += arrow(P(222, 120), P(330, 76));
    s += tag(250, 84, 'H₂, Lindlar catalyst', { anchor: 'end' });
    s += arrow(P(222, 156), P(330, 200));
    s += tag(250, 190, 'Na, NH₃(l)', { anchor: 'end' });
    s += pentene(420, 70, true);
    s += pentene(420, 206, false);
    s += italicName(650, 66, 'cis', '-pent-2-ene', 'fg-tag-good');
    s += tag(650, 84, 'both H on one side', { cls: 'fg-tag-mut' });
    s += italicName(650, 202, 'trans', '-pent-2-ene', 'fg-tag-good');
    s += tag(650, 220, 'H on opposite sides', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Compare where the two highlighted hydrogens sit in each product.',
});

FIGURES.push({
  id: 'l-pentyne-two-alkenes',
  lessons: [TOPIC],
  viewBox: '0 0 340 390',
  alt: 'Pent-2-yne at the top. H2 over Lindlar catalyst gives cis-pent-2-ene, both alkene hydrogens on one side. Na in liquid NH3 gives trans-pent-2-ene, hydrogens on opposite sides.',
  build() {
    let s = '';
    s += pentyne(92, 46);
    s += tag(170, 80, 'pent-2-yne');
    const row = (y, cond, cis) => {
      let t = panel(2, y - 64, 336, 138, { kind: 'good' });
      t += tag(62, y - 40, cond);
      t += arrow(P(24, y), P(100, y));
      t += pentene(160, y, cis);
      t += italicName(170, y + 64, cis ? 'cis' : 'trans', '-pent-2-ene', 'fg-tag-good');
      return t;
    };
    s += row(170, 'H₂, Lindlar', true);
    s += row(318, 'Na, NH₃(l)', false);
    return s;
  },
  caption: 'Compare where the two highlighted hydrogens sit in each product.',
});

export default FIGURES;
