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
  const H = p(124, 156);
  s += bond(C, O, { order: 2, rFrom: 15, rTo: 15 });
  s += bond(C, L, { rFrom: 15, rTo: 0 });
  s += bond(C, R, { rFrom: 15, rTo: 0 });
  s += iPr(L, p(122, 106), p(160, 172));
  s += iPr(R, p(278, 106), p(240, 172));
  s += bond(L, H, { rFrom: 0, rTo: 12 });
  s += atom(C.x, C.y, 'C');
  s += atom(O.x, O.y, 'O');
  s += atom(H.x, H.y, 'H', { kind: 'warn', r: 12 });
  s += tag(ox + 176, oy + 156, 'α', { anchor: 'start' });
  /* The Grignard, below and to the left of the alpha H. */
  const G = p(70, 214), Mg = p(128, 214), Br = p(184, 214);
  s += iPr(G, p(36, 194), p(36, 234));
  s += bond(G, Mg, { rFrom: 0, rTo: 16 });
  s += bond(Mg, Br, { rFrom: 16, rTo: 15 });
  s += atom(Mg.x, Mg.y, 'Mg', { kind: 'hi' });
  s += atom(Br.x, Br.y, 'Br');
  s += curve(p(96, 207), p(116, 170), { bow: -16 });
  s += curve(p(138, 146), p(178, 115), { bow: -12 });
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
  s += sk(G, p(304, 90));
  s += bond(B, H, { rFrom: 0, rTo: 12 });
  s += atom(C.x, C.y, 'C');
  s += atom(O.x, O.y, 'O');
  s += atom(Mg.x, Mg.y, 'Mg', { kind: 'hi' });
  s += atom(Br.x, Br.y, 'Br');
  s += atom(H.x, H.y, 'H', { kind: 'warn', r: 12 });
  s += tag(ox + 250, oy + 178, 'β', { anchor: 'start' });
  s += curve(p(213, 170), p(136, 150), { bow: -40 });
  s += curve(p(238, 88), p(256, 138), { bow: -16 });
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
  s += curve(p(254, 116), p(148, 136), { bow: -26 });
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
  caption: 'Read the panels left to right, top row first. The highlighted C–CH₃ bond in the third panel is the new carbon–carbon bond. The first CH₃Li never reaches carbon at all.',
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

export default FIGURES;
