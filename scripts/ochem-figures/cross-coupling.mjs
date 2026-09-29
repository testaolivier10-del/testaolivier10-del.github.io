/* Figures for the cross-coupling notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   The page is example-first: bromobenzene + phenylboronic acid carries the
   catalytic cycle, iodobenzene + phenylacetylene the Sonogashira, and
   iodobenzene + methyl acrylate the Heck. Every figure uses those same
   molecules, so the drawing and the prose beside it name the same things.
   Figures shown in the lesson are 340 wide or less and use only fg-lbl and
   fg-tag text. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, benzene } from '../lib/ochem-skeletal.mjs';
import { lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* A text-only label with no disc behind it (a group such as CO2CH3 or B(OH)2).
   Bonds to it are trimmed by the rTo/rFrom the caller passes. */
const grp = (x, y, s) => atom(x, y, s, { kind: 'point' });
const dash = (a, b, cls = 'fg-dash-hi') =>
  `<line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line>`;
/* A benzene ring with vertex 0 pointing east (rot 0), so a ring can be joined
   left-to-right to a neighbor. */
const ringE = (cx, cy, r, cls) => benzene(cx, cy, r, { rot: 0, cls });

/* ------------------------------------------------------------------------
   Why an aryl halide refuses SN2: the backside of the C–Br carbon is inside
   the ring. Shown against bromoethane, where the back is open. */
FIGURES.push({
  id: 'aryl-no-sn2',
  section: 'cross-coupling',
  lessons: ['cross-coupling'],
  anchor: '<!-- fig:aryl-no-sn2:start -->',
  viewBox: '0 0 340 300',
  alt: 'Top: a nucleophile approaches the carbon of bromoethane from directly behind the C–Br bond, where nothing is in the way. Bottom: in bromobenzene the same path runs straight through the benzene ring, so there is no way in.',
  build() {
    let s = '';
    s += panel(6, 6, 328, 140);
    s += tag(170, 26, 'bromoethane: the back of the carbon is open');
    const c = P(196, 86);
    s += bond(c, P(258, 86), { rFrom: 15, rTo: 16 });
    s += bond(c, P(166, 56), { rFrom: 15, rTo: 17 });
    s += wedge(c, P(168, 116), { rFrom: 13, rTo: 11, width: 8 });
    s += hash(c, P(208, 126), { rFrom: 13, rTo: 11, width: 9, rungs: 4 });
    s += atom(c.x, c.y, 'C');
    s += atom(258, 86, 'Br', { kind: 'warn' });
    s += atom(166, 56, 'CH₃', { r: 17 });
    s += atom(168, 116, 'H', { r: 11 });
    s += atom(208, 126, 'H', { r: 11 });
    s += label(58, 91, 'Nu⁻');
    s += arrow(P(80, 86), P(178, 86));
    s += tag(96, 76, 'backside attack');

    s += panel(6, 154, 328, 140);
    s += tag(170, 174, 'bromobenzene: behind the carbon is the ring');
    const ring = ringE(170, 234, 30);
    s += ring.svg;
    s += bond(ring.pts[0], P(254, 234), { rFrom: 0, rTo: 16 });
    s += atom(254, 234, 'Br', { kind: 'warn' });
    s += label(46, 239, 'Nu⁻');
    s += arrow(P(66, 234), P(128, 234), { muted: true });
    s += dash(P(140, 234), P(192, 234), 'fg-dash');
    s += text(170, 229, '✕', { cls: 'fg-lbl' });
    s += tag(170, 284, 'no path through the ring to the back');
    return s;
  },
  caption: 'Follow each arrow to the carbon that carries the bromine. Only in bromoethane can the nucleophile reach the back of it.',
});

/* ------------------------------------------------------------------------
   The catalytic cycle, on the one reaction the section is built from:
   bromobenzene + phenylboronic acid -> biphenyl. Each node is drawn with its
   bonds, and the bonds the step just made are highlighted. */
const node = (cx, cy, left, right, hiLeft, hiRight) => {
  let s = '';
  s += bond(P(cx - 44, cy), P(cx, cy), { rFrom: 16, rTo: 16, cls: hiLeft ? 'fg-bond-hi' : 'fg-bond' });
  s += bond(P(cx, cy), P(cx + 44, cy), { rFrom: 16, rTo: 16, cls: hiRight ? 'fg-bond-hi' : 'fg-bond' });
  s += atom(cx - 44, cy, left, { kind: 'hi' });
  s += atom(cx, cy, 'Pd', { kind: 'warn' });
  s += atom(cx + 44, cy, right, { kind: right === 'Ph' ? 'hi' : 'plain' });
  return s;
};

/* The equation strip: two rings + B(OH)2 -> biphenyl. `x0` is the left edge,
   `r` the ring radius. Returns the drawing and the x where it ended. */
const reactants = (x0, y, r) => {
  let s = '';
  const a = ringE(x0 + r, y, r); s += a.svg;
  s += bond(a.pts[0], P(x0 + 2 * r + 38, y), { rFrom: 0, rTo: 16 });
  s += atom(x0 + 2 * r + 38, y, 'Br', { kind: 'warn' });
  s += label(x0 + 2 * r + 70, y + 5, '+');
  const bx = x0 + 2 * r + 100;
  const b = ringE(bx + r, y, r); s += b.svg;
  s += bond(b.pts[0], P(bx + 2 * r + 44, y), { rFrom: 0, rTo: 25 });
  s += grp(bx + 2 * r + 44, y, 'B(OH)₂');
  return s;
};
const biphenyl = (x0, y, r) => {
  let s = '';
  const a = ringE(x0 + r, y, r); s += a.svg;
  const b = ringE(x0 + 3 * r + 26, y, r); s += b.svg;
  s += bond(a.pts[0], b.pts[3], { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
  return s;
};

FIGURES.push({
  id: 'pd-cycle',
  section: 'cross-coupling',
  anchor: '<!-- fig:pd-cycle:start -->',
  viewBox: '0 0 760 510',
  alt: 'Bromobenzene and phenylboronic acid give biphenyl. Below, the palladium cycle: Pd(0) inserts into the C–Br bond to give Ph–Pd–Br, Pd(II); the borate hands over its phenyl to give Ph–Pd–Ph, still Pd(II); the two phenyls join and leave as biphenyl, and Pd(0) is back.',
  build() {
    let s = '';
    s += reactants(40, 72, 26);
    s += arrow(P(372, 72), P(488, 72));
    s += tag(430, 58, 'Pd(PPh₃)₄, Na₂CO₃');
    s += tag(430, 94, 'water/toluene, heat');
    s += biphenyl(520, 72, 26);
    s += text(581, 36, 'new C–C bond', { cls: 'fg-tag-good' });
    s += tag(581, 120, 'biphenyl');
    s += rule(20, 140, 740, 140);

    // Pd(0), top.
    s += atom(380, 196, 'Pd', { kind: 'warn' });
    s += tag(380, 170, 'Pd(0), the catalyst');
    // Ph–Pd–Br, lower right; Ph–Pd–Ph, lower left.
    s += node(560, 360, 'Ph', 'Br', true, true);
    s += text(560, 394, 'Pd(II)', { cls: 'fg-tag' });
    s += node(200, 360, 'Ph', 'Ph', false, true);
    s += text(200, 394, 'Pd(II)', { cls: 'fg-tag' });

    // Oxidative addition, top right.
    s += curve(P(402, 206), P(548, 334), { bow: -40 });
    s += tag(522, 222, 'oxidative addition', { anchor: 'start' });
    s += text(522, 238, 'Ph–Br goes in', { cls: 'fg-sm', anchor: 'start' });
    s += text(522, 254, 'Pd: 0 → II', { cls: 'fg-sm', anchor: 'start' });
    // Transmetalation, bottom.
    s += curve(P(540, 408), P(222, 408), { bow: -38 });
    s += tag(380, 470, 'transmetalation');
    s += text(380, 486, '[PhB(OH)₃]⁻ goes in; B(OH)₃ and Br⁻ leave', { cls: 'fg-sm' });
    s += text(380, 502, 'Pd stays II', { cls: 'fg-sm' });
    // Reductive elimination, top left.
    s += curve(P(190, 334), P(358, 206), { bow: -40 });
    s += tag(238, 222, 'reductive elimination', { anchor: 'end' });
    s += text(238, 238, 'biphenyl leaves', { cls: 'fg-sm', anchor: 'end' });
    s += text(238, 254, 'Pd: II → 0', { cls: 'fg-sm', anchor: 'end' });
    return s;
  },
  caption: 'Go around clockwise from the top. At each node, the highlighted bonds are the ones that step just made.',
});

/* The same cycle for the lesson card, stacked: the equation first, then the
   three steps as a column. */
FIGURES.push({
  id: 'l-pd-cycle',
  lessons: ['cross-coupling'],
  viewBox: '0 0 340 530',
  alt: 'Bromobenzene and phenylboronic acid give biphenyl. Below, the cycle as a column: Pd(0); oxidative addition gives Ph–Pd–Br, Pd(II); transmetalation gives Ph–Pd–Ph, still Pd(II); reductive elimination releases biphenyl and returns Pd(0).',
  build() {
    let s = '';
    s += reactants(14, 44, 22);
    s += arrow(P(150, 78), P(150, 112));
    s += tag(162, 100, 'Pd catalyst, Na₂CO₃, heat', { anchor: 'start' });
    s += biphenyl(110, 146, 22);
    s += tag(170, 188, 'biphenyl');
    s += rule(10, 204, 330, 204);

    s += atom(110, 234, 'Pd', { kind: 'warn' });
    s += tag(136, 238, 'Pd(0), the catalyst', { anchor: 'start' });
    s += arrow(P(110, 254), P(110, 300));
    s += tag(124, 272, 'oxidative addition', { anchor: 'start' });
    s += tag(124, 288, 'Ph–Br goes in; Pd 0 → II', { anchor: 'start' });
    s += node(110, 324, 'Ph', 'Br', true, true);
    s += tag(180, 328, 'Pd(II)', { anchor: 'start' });
    s += arrow(P(110, 344), P(110, 390));
    s += tag(124, 362, 'transmetalation', { anchor: 'start' });
    s += tag(124, 378, 'borate gives Ph; Br⁻ leaves', { anchor: 'start' });
    s += node(110, 414, 'Ph', 'Ph', false, true);
    s += tag(180, 418, 'Pd(II)', { anchor: 'start' });
    s += arrow(P(110, 434), P(110, 480));
    s += tag(124, 452, 'reductive elimination', { anchor: 'start' });
    s += tag(124, 468, 'biphenyl leaves; Pd II → 0', { anchor: 'start' });
    s += atom(110, 504, 'Pd', { kind: 'warn' });
    s += tag(136, 508, 'Pd(0), ready to go again', { anchor: 'start' });
    return s;
  },
  caption: 'Read down the column. At each stage, the highlighted bonds are the ones that step just made.',
});

/* ------------------------------------------------------------------------
   What the base does in a Suzuki: hydroxide adds to boron's empty p orbital,
   and the trigonal boronic acid becomes a tetrahedral borate. */
FIGURES.push({
  id: 'borate',
  section: 'cross-coupling',
  lessons: ['cross-coupling'],
  anchor: '<!-- fig:borate:start -->',
  viewBox: '0 0 340 370',
  alt: 'Phenylboronic acid, with boron trigonal planar and an empty p orbital drawn above and below it. A hydroxide lone pair attacks the boron. The product is the tetrahedral borate, with four groups on boron and the negative charge on boron.',
  build() {
    let s = '';
    const B = P(130, 100);
    s += lobeE(B.x, B.y - 30, 5.5, 13, 'fg-orb');
    s += lobeE(B.x, B.y + 30, 5.5, 13, 'fg-orb');
    s += bond(B, P(70, 100), { rFrom: 15, rTo: 16 });
    s += bond(B, P(162, 46), { rFrom: 15, rTo: 17 });
    s += bond(B, P(162, 154), { rFrom: 15, rTo: 17 });
    s += atom(B.x, B.y, 'B', { kind: 'hi' });
    s += atom(70, 100, 'Ph', { kind: 'plain', r: 16 });
    s += atom(162, 46, 'OH', { r: 17 });
    s += atom(162, 154, 'OH', { r: 17 });
    s += tag(74, 50, 'empty p orbital');

    const O = P(262, 100);
    s += bond(O, P(306, 100), { rFrom: 15, rTo: 15 });
    s += atom(O.x, O.y, 'O');
    s += atom(306, 100, 'H');
    s += lonePair(O.x, O.y, 180);
    s += lonePair(O.x, O.y, -90);
    s += lonePair(O.x, O.y, 90);
    s += text(282, 80, '−', { cls: 'fg-warn', size: 15 });
    s += curve(P(238, 96), P(148, 94), { bow: 22 });
    s += tag(262, 146, 'HO⁻ from the base');
    s += tag(130, 190, 'boronic acid: boron has six electrons');

    s += arrow(P(170, 204), P(170, 238));

    const C = P(170, 286);
    s += bond(C, P(110, 286), { rFrom: 15, rTo: 16 });
    s += bond(C, P(214, 252), { rFrom: 15, rTo: 17 });
    s += wedge(C, P(222, 312), { rFrom: 13, rTo: 16, width: 9 });
    s += hash(C, P(160, 336), { rFrom: 13, rTo: 16, width: 10, rungs: 4 });
    s += atom(C.x, C.y, 'B', { kind: 'hi' });
    s += atom(110, 286, 'Ph', { r: 16 });
    s += atom(214, 252, 'OH', { r: 17 });
    s += atom(222, 312, 'OH', { r: 17 });
    s += atom(160, 336, 'OH', { r: 17 });
    s += text(152, 266, '−', { cls: 'fg-warn', size: 15 });
    s += tag(282, 272, 'the borate');
    s += tag(282, 288, 'four groups;');
    s += tag(282, 304, 'the − is on B');
    return s;
  },
  caption: 'Top: follow the arrow from a hydroxide lone pair into the empty orbital on boron. Bottom: boron now has four groups, sits at the center of a tetrahedron, and carries the negative charge.',
});

/* ------------------------------------------------------------------------
   Sonogashira, part 1: how copper makes the acetylide. Cu(I) binds the
   triple bond side-on, which lets triethylamine remove the terminal H. */
FIGURES.push({
  id: 'sonogashira-copper',
  section: 'cross-coupling',
  anchor: '<!-- fig:sonogashira-copper:start -->',
  viewBox: '0 0 760 256',
  alt: 'Phenylacetylene with copper iodide bound side-on to the middle of the triple bond. Triethylamine uses its lone pair to remove the terminal hydrogen, and the C–H bonding pair becomes a carbon–copper bond. The product is the copper acetylide, Ph–C≡C–Cu, plus triethylammonium iodide.',
  build() {
    let s = '';
    const y = 118;
    s += bond(P(56, y), P(126, y), { rFrom: 16, rTo: 15 });
    s += bond(P(126, y), P(196, y), { order: 3, rFrom: 15, rTo: 15, gap: 3.4 });
    s += bond(P(196, y), P(252, y), { rFrom: 15, rTo: 15 });
    s += atom(56, y, 'Ph', { kind: 'hi', r: 16 });
    s += atom(126, y, 'C');
    s += atom(196, y, 'C');
    s += atom(252, y, 'H', { kind: 'warn' });
    // CuI above the middle of the triple bond, side-on.
    s += bond(P(161, 50), P(213, 50), { rFrom: 17, rTo: 15 });
    s += atom(161, 50, 'Cu', { kind: 'warn', r: 17 });
    s += atom(213, 50, 'I');
    s += dash(P(161, 68), P(161, 106));
    s += tag(240, 40, 'bound side-on', { anchor: 'start' });
    s += tag(240, 56, 'to the π bonds', { anchor: 'start' });
    // Triethylamine below the H.
    const N = P(300, 196);
    s += bond(N, P(250, 214), { rFrom: 15, rTo: 13 });
    s += bond(N, P(350, 214), { rFrom: 15, rTo: 13 });
    s += bond(N, P(300, 240), { rFrom: 15, rTo: 10 });
    s += atom(N.x, N.y, 'N');
    s += atom(250, 214, 'Et', { r: 13 });
    s += atom(350, 214, 'Et', { r: 13 });
    s += grp(300, 244, 'Et');
    s += lonePair(N.x, N.y, -110);
    s += curve(P(290, 172), P(262, 132), { bow: -14 });
    s += curve(P(226, 122), P(184, 72), { bow: 18 });
    s += tag(330, 178, 'Et₃N takes the H', { anchor: 'start' });

    s += arrow(P(420, y), P(476, y));

    const y2 = 104;
    s += bond(P(512, y2), P(572, y2), { rFrom: 16, rTo: 15 });
    s += bond(P(572, y2), P(636, y2), { order: 3, rFrom: 15, rTo: 15, gap: 3.4 });
    s += bond(P(636, y2), P(700, y2), { rFrom: 15, rTo: 17, cls: 'fg-bond-hi' });
    s += atom(512, y2, 'Ph', { kind: 'hi', r: 16 });
    s += atom(572, y2, 'C');
    s += atom(636, y2, 'C');
    s += atom(700, y2, 'Cu', { kind: 'warn', r: 17 });
    s += tag(606, 146, 'the copper acetylide');
    s += label(606, 196, '+ Et₃NH⁺ I⁻');
    return s;
  },
  caption: 'Copper sits over the middle of the triple bond, not on one carbon. Follow the two arrows: the amine lone pair takes the H, and the C–H bonding pair becomes the C–Cu bond.',
});

/* Sonogashira, part 2: the two cycles and the step that links them. */
const box = (cx, cy, w, s0, kind) => panel(cx - w / 2, cy - 18, w, 36, { kind }) + text(cx, cy + 5, s0, { cls: 'fg-lbl' });
FIGURES.push({
  id: 'sonogashira-cycles',
  section: 'cross-coupling',
  anchor: '<!-- fig:sonogashira-cycles:start -->',
  viewBox: '0 0 760 380',
  alt: 'Two cycles side by side. Copper cycle: CuI binds phenylacetylene, triethylamine removes the H to give the copper acetylide, the acetylide passes its alkynyl group to palladium, and CuI returns. Palladium cycle: Pd(0) adds to iodobenzene to give Ph–Pd–I, transmetalation gives Ph–Pd–C≡C–Ph, and reductive elimination releases diphenylacetylene and returns Pd(0).',
  build() {
    let s = '';
    s += tag(200, 22, 'copper cycle');
    s += tag(560, 22, 'palladium cycle');
    // Copper column.
    s += box(200, 64, 110, 'CuI', null);
    s += arrow(P(200, 84), P(200, 146));
    s += tag(212, 110, '+ Ph–C≡C–H', { anchor: 'start' });
    s += box(200, 166, 190, 'Cu on the C≡C', null);
    s += arrow(P(200, 186), P(200, 256));
    s += tag(212, 216, 'Et₃N takes the H', { anchor: 'start' });
    s += tag(212, 232, '(Et₃NH⁺ I⁻ forms)', { anchor: 'start' });
    s += box(200, 276, 130, 'Ph–C≡C–Cu', 'hi');
    // CuI returns up the left side.
    s += `<path class="fg-arrow" d="M135 276 L60 276 L60 64 L137 64"></path>`;
    s += arrow(P(120, 64), P(145, 64));
    s += tag(70, 226, 'CuI returns', { anchor: 'start' });
    // Palladium column.
    s += box(560, 64, 110, 'Pd(0)', null);
    s += arrow(P(560, 84), P(560, 146));
    s += tag(572, 104, 'oxidative addition', { anchor: 'start' });
    s += tag(572, 120, '+ Ph–I', { anchor: 'start' });
    s += box(560, 166, 110, 'Ph–Pd–I', null);
    s += arrow(P(560, 186), P(560, 256));
    s += box(560, 276, 150, 'Ph–Pd–C≡C–Ph', 'hi');
    // Reductive elimination up the right side.
    s += `<path class="fg-arrow" d="M635 276 L706 276 L706 64 L623 64"></path>`;
    s += arrow(P(640, 64), P(615, 64));
    s += tag(698, 210, 'reductive', { anchor: 'end' });
    s += tag(698, 226, 'elimination', { anchor: 'end' });
    // The link: transmetalation.
    s += arrow(P(266, 276), P(482, 276));
    s += tag(374, 262, 'transmetalation');
    s += text(374, 298, 'Ph–C≡C– moves to Pd, I⁻ to Cu', { cls: 'fg-sm' });
    s += rule(20, 322, 740, 322);
    s += label(380, 348, 'out of the flask: Ph–C≡C–Ph, diphenylacetylene');
    s += text(380, 368, 'Pd(0) and CuI both come back, so both are catalysts.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'The two cycles meet at one step. Transmetalation, in the middle, takes the alkynyl group from copper and gives it to palladium.',
});

/* ------------------------------------------------------------------------
   The Heck, on iodobenzene + methyl acrylate, in six cells of 250 x 180.
   Cells are drawn relative to (ox, oy) so the notes can lay them out in a
   3 x 2 grid and the lesson can stack them in a 340-wide column. */
const E = 'CO₂CH₃';
const heckCells = [
  /* 0: oxidative addition, as in every coupling. */
  (ox, oy) => {
    let s = '';
    s += atom(ox + 34, oy + 70, 'Pd', { kind: 'warn' });
    s += text(ox + 34, oy + 44, 'Pd(0)', { cls: 'fg-tag' });
    s += label(ox + 64, oy + 75, '+');
    s += bond(P(ox + 94, oy + 70), P(ox + 138, oy + 70), { rFrom: 16, rTo: 15 });
    s += atom(ox + 94, oy + 70, 'Ph', { kind: 'hi', r: 16 });
    s += atom(ox + 138, oy + 70, 'I');
    s += arrow(P(ox + 125, oy + 92), P(ox + 125, oy + 112));
    s += bond(P(ox + 81, oy + 132), P(ox + 125, oy + 132), { rFrom: 16, rTo: 16, cls: 'fg-bond-hi' });
    s += bond(P(ox + 125, oy + 132), P(ox + 169, oy + 132), { rFrom: 16, rTo: 15, cls: 'fg-bond-hi' });
    s += atom(ox + 81, oy + 132, 'Ph', { kind: 'hi', r: 16 });
    s += atom(ox + 125, oy + 132, 'Pd', { kind: 'warn' });
    s += atom(ox + 169, oy + 132, 'I');
    s += tag(ox + 125, oy + 170, '1 · oxidative addition, as before');
    return s;
  },
  /* 1: the alkene binds side-on. */
  (ox, oy) => {
    let s = '';
    s += bond(P(ox + 56, oy + 40), P(ox + 110, oy + 40), { rFrom: 16, rTo: 16 });
    s += bond(P(ox + 110, oy + 40), P(ox + 164, oy + 40), { rFrom: 16, rTo: 15 });
    s += atom(ox + 56, oy + 40, 'Ph', { kind: 'hi', r: 16 });
    s += atom(ox + 110, oy + 40, 'Pd', { kind: 'warn' });
    s += atom(ox + 164, oy + 40, 'I');
    s += bond(P(ox + 80, oy + 118), P(ox + 140, oy + 118), { order: 2, rFrom: 17, rTo: 15 });
    s += bond(P(ox + 140, oy + 118), P(ox + 196, oy + 150), { rFrom: 15, rTo: 30 });
    s += atom(ox + 80, oy + 118, 'CH₂', { r: 17 });
    s += atom(ox + 140, oy + 118, 'CH');
    s += grp(ox + 196, oy + 150, E);
    s += dash(P(ox + 110, oy + 58), P(ox + 110, oy + 108));
    s += tag(ox + 125, oy + 174, '2 · the alkene binds side-on');
    return s;
  },
  /* 2: migratory insertion — Ph and Pd add to the same side. */
  (ox, oy) => {
    let s = '';
    s += bond(P(ox + 70, oy + 40), P(ox + 140, oy + 40), { rFrom: 16, rTo: 16 });
    s += bond(P(ox + 140, oy + 40), P(ox + 196, oy + 40), { rFrom: 16, rTo: 15 });
    s += atom(ox + 70, oy + 40, 'Ph', { kind: 'hi', r: 16 });
    s += atom(ox + 140, oy + 40, 'Pd', { kind: 'warn' });
    s += atom(ox + 196, oy + 40, 'I');
    s += bond(P(ox + 70, oy + 118), P(ox + 140, oy + 118), { order: 2, rFrom: 17, rTo: 15 });
    s += bond(P(ox + 140, oy + 118), P(ox + 202, oy + 150), { rFrom: 15, rTo: 30 });
    s += atom(ox + 70, oy + 118, 'CH₂', { r: 17 });
    s += atom(ox + 140, oy + 118, 'CH');
    s += grp(ox + 202, oy + 150, E);
    s += curve(P(ox + 104, oy + 46), P(ox + 72, oy + 96), { bow: 16 });
    s += curve(P(ox + 106, oy + 112), P(ox + 138, oy + 62), { bow: 16 });
    s += tag(ox + 125, oy + 174, '3 · Ph and Pd add on the same side');
    return s;
  },
  /* 3: after insertion, turned so H and Pd sit on the same side; the
     beta-hydride elimination. */
  (ox, oy) => {
    let s = '';
    const a = P(ox + 92, oy + 84), b = P(ox + 156, oy + 84);
    s += bond(a, b, { rFrom: 15, rTo: 15 });
    s += bond(a, P(ox + 42, oy + 84), { rFrom: 15, rTo: 12 });
    s += bond(a, P(ox + 92, oy + 32), { rFrom: 15, rTo: 16 });
    s += bond(a, P(ox + 92, oy + 136), { rFrom: 15, rTo: 12 });
    s += bond(b, P(ox + 156, oy + 34), { rFrom: 15, rTo: 12 });
    s += bond(b, P(ox + 210, oy + 84), { rFrom: 15, rTo: 28 });
    s += bond(b, P(ox + 156, oy + 136), { rFrom: 15, rTo: 16 });
    s += bond(P(ox + 156, oy + 136), P(ox + 204, oy + 136), { rFrom: 16, rTo: 12 });
    s += atom(a.x, a.y, 'C');
    s += atom(b.x, b.y, 'C');
    s += atom(ox + 92, oy + 32, 'Ph', { kind: 'hi', r: 16 });
    s += atom(ox + 42, oy + 84, 'H', { r: 12 });
    s += atom(ox + 92, oy + 136, 'H', { kind: 'warn', r: 12 });
    s += atom(ox + 156, oy + 34, 'H', { r: 12 });
    s += grp(ox + 210, oy + 84, E);
    s += atom(ox + 156, oy + 136, 'Pd', { kind: 'warn' });
    s += atom(ox + 204, oy + 136, 'I', { r: 12 });
    s += curve(P(ox + 96, oy + 112), P(ox + 140, oy + 140), { bow: 14 });
    s += curve(P(ox + 150, oy + 110), P(ox + 126, oy + 88), { bow: 10 });
    s += tag(ox + 125, oy + 174, '4 · H and Pd on the same side leave');
    return s;
  },
  /* 4: the trans alkene and H–Pd–I. */
  (ox, oy) => {
    let s = '';
    const a = P(ox + 100, oy + 70), b = P(ox + 152, oy + 70);
    s += bond(a, b, { order: 2, rFrom: 15, rTo: 15 });
    s += bond(a, P(ox + 72, oy + 26), { rFrom: 15, rTo: 16 });
    s += bond(a, P(ox + 76, oy + 110), { rFrom: 15, rTo: 12 });
    s += bond(b, P(ox + 176, oy + 30), { rFrom: 15, rTo: 12 });
    s += bond(b, P(ox + 192, oy + 116), { rFrom: 15, rTo: 28 });
    s += atom(a.x, a.y, 'C');
    s += atom(b.x, b.y, 'C');
    s += atom(ox + 72, oy + 26, 'Ph', { kind: 'hi', r: 16 });
    s += atom(ox + 76, oy + 110, 'H', { r: 12 });
    s += atom(ox + 176, oy + 30, 'H', { r: 12 });
    s += grp(ox + 192, oy + 116, E);
    s += text(ox + 36, oy + 145, '+', { cls: 'fg-lbl' });
    s += bond(P(ox + 70, oy + 140), P(ox + 112, oy + 140), { rFrom: 12, rTo: 16 });
    s += bond(P(ox + 112, oy + 140), P(ox + 154, oy + 140), { rFrom: 16, rTo: 12 });
    s += atom(ox + 70, oy + 140, 'H', { r: 12 });
    s += atom(ox + 112, oy + 140, 'Pd', { kind: 'warn' });
    s += atom(ox + 154, oy + 140, 'I', { r: 12 });
    s += tag(ox + 125, oy + 174, '5 · the trans alkene leaves');
    return s;
  },
  /* 5: the base takes HI and gives back Pd(0). */
  (ox, oy) => {
    let s = '';
    s += bond(P(ox + 44, oy + 60), P(ox + 88, oy + 60), { rFrom: 12, rTo: 16 });
    s += bond(P(ox + 88, oy + 60), P(ox + 132, oy + 60), { rFrom: 16, rTo: 12 });
    s += atom(ox + 44, oy + 60, 'H', { r: 12 });
    s += atom(ox + 88, oy + 60, 'Pd', { kind: 'warn' });
    s += atom(ox + 132, oy + 60, 'I', { r: 12 });
    s += label(ox + 190, oy + 65, '+ Et₃N');
    s += arrow(P(ox + 125, oy + 84), P(ox + 125, oy + 110));
    s += label(ox + 125, oy + 138, 'Pd(0) + Et₃NH⁺ I⁻');
    s += tag(ox + 125, oy + 174, '6 · the base gives back Pd(0)');
    return s;
  },
];

FIGURES.push({
  id: 'heck-steps',
  section: 'cross-coupling',
  anchor: '<!-- fig:heck-steps:start -->',
  viewBox: '0 0 760 392',
  alt: 'Six frames of the Heck reaction of iodobenzene with methyl acrylate: oxidative addition gives Ph–Pd–I; the alkene binds side-on to palladium; migratory insertion puts Ph on the CH2 carbon and Pd on the other carbon, from the same side; after rotation an H and the Pd sit on the same side and leave together; the trans alkene is released with H–Pd–I; triethylamine takes HI and returns Pd(0).',
  build() {
    let s = '';
    heckCells.forEach((cell, i) => {
      const ox = 5 + (i % 3) * 250, oy = 6 + Math.floor(i / 3) * 190;
      s += panel(ox + 2, oy, 246, 184, { kind: i === 2 || i === 3 ? 'hi' : null });
      s += cell(ox, oy);
    });
    return s;
  },
  caption: 'Read the frames in order. Frames 2 to 4 take the place of transmetalation. In frame 4, the H and the Pd that leave are on the same side, and the phenyl and the ester are on opposite sides.',
});

const heckColumn = (cells) => {
  let s = '';
  cells.forEach((i, k) => {
    s += panel(46, 4 + k * 190, 248, 184, { kind: i === 2 || i === 3 ? 'hi' : null });
    s += heckCells[i](45, 4 + k * 190);
  });
  return s;
};
FIGURES.push({
  id: 'l-heck-a',
  lessons: ['cross-coupling'],
  viewBox: '0 0 340 574',
  alt: 'The Heck of iodobenzene with methyl acrylate, first half: oxidative addition gives Ph–Pd–I; the alkene binds side-on to palladium; migratory insertion puts Ph on the CH2 carbon and Pd on the other carbon, from the same side.',
  build() { return heckColumn([0, 1, 2]); },
  caption: 'Frames 1 to 3. In frame 3, Ph and Pd both come from above the C=C, so they add to the same side.',
});
FIGURES.push({
  id: 'l-heck-b',
  lessons: ['cross-coupling'],
  viewBox: '0 0 340 574',
  alt: 'The Heck, second half: an H and the Pd on neighboring carbons sit on the same side and leave together; the trans alkene is released with H–Pd–I; triethylamine takes HI and returns Pd(0).',
  build() { return heckColumn([3, 4, 5]); },
  caption: 'Frames 4 to 6. The H and the Pd that leave sit on the same side, and the phenyl and the ester end up on opposite sides of the C=C.',
});

/* ------------------------------------------------------------------------
   Why the halide is aryl or alkenyl: an alkyl group on Pd has a beta H it can
   lose; a phenyl group does not. */
FIGURES.push({
  id: 'alkyl-beta-h',
  section: 'cross-coupling',
  anchor: '<!-- fig:alkyl-beta-h:start -->',
  viewBox: '0 0 760 260',
  alt: 'Left: butyl–Pd–Br, with the alpha and beta carbons marked; an H on the beta carbon and the Pd sit on the same side, and they leave as H–Pd–Br while but-1-ene forms. Right: phenyl–Pd–Br; the carbons next to the Pd-bonded carbon are ring carbons whose H atoms point away from the metal.',
  build() {
    let s = '';
    s += tag(210, 24, 'butyl on Pd: the β carbon has H');
    const b = P(150, 112), a = P(214, 112);
    s += bond(P(80, 112), b, { rFrom: 30, rTo: 15 });
    s += bond(b, a, { rFrom: 15, rTo: 15 });
    s += bond(b, P(150, 62), { rFrom: 15, rTo: 12 });
    s += bond(b, P(150, 162), { rFrom: 15, rTo: 12 });
    s += bond(a, P(214, 62), { rFrom: 15, rTo: 12 });
    s += bond(a, P(262, 112), { rFrom: 15, rTo: 12 });
    s += bond(a, P(214, 162), { rFrom: 15, rTo: 16 });
    s += bond(P(214, 162), P(262, 186), { rFrom: 16, rTo: 16 });
    s += grp(76, 112, 'CH₃CH₂');
    s += atom(b.x, b.y, 'C');
    s += atom(a.x, a.y, 'C');
    s += atom(150, 62, 'H', { r: 12 });
    s += atom(150, 162, 'H', { kind: 'warn', r: 12 });
    s += atom(214, 62, 'H', { r: 12 });
    s += atom(262, 112, 'H', { r: 12 });
    s += atom(214, 162, 'Pd', { kind: 'warn' });
    s += atom(262, 186, 'Br', { r: 16 });
    s += text(128, 92, 'β', { cls: 'fg-tag-warn' });
    s += text(236, 92, 'α', { cls: 'fg-tag' });
    s += arrow(P(290, 112), P(338, 112));
    // but-1-ene, skeletal: CH3-CH2-CH=CH2.
    const z = zig(350, 124, 4, 30, 20);
    s += `<g>${[0, 1].map((i) => bond(z[i], z[i + 1], { rFrom: 0, rTo: 0 })).join('')}</g>`;
    s += bond(z[2], z[3], { order: 2, rFrom: 0, rTo: 0, gap: 3 });
    s += tag(395, 152, 'but-1-ene');
    s += label(395, 190, '+ H–Pd–Br');
    s += tag(210, 236, 'faster than reductive elimination: no coupling');

    s += rule(470, 30, 470, 240);

    s += tag(612, 24, 'phenyl on Pd: no sp³ β carbon');
    const ring = ringE(580, 118, 30);
    s += ring.svg;
    s += bond(ring.pts[0], P(662, 118), { rFrom: 0, rTo: 16 });
    s += bond(P(662, 118), P(712, 118), { rFrom: 16, rTo: 16 });
    s += atom(662, 118, 'Pd', { kind: 'warn' });
    s += atom(712, 118, 'Br', { r: 16 });
    const o1 = ring.pts[1], o5 = ring.pts[5];
    s += bond(o1, P(o1.x + 14, o1.y - 24), { rFrom: 0, rTo: 10 });
    s += bond(o5, P(o5.x + 14, o5.y + 24), { rFrom: 0, rTo: 10 });
    s += atom(o1.x + 14, o1.y - 24, 'H', { r: 10 });
    s += atom(o5.x + 14, o5.y + 24, 'H', { r: 10 });
    s += tag(612, 196, 'these H lie in the ring plane,');
    s += tag(612, 212, 'pointing away from Pd:');
    s += tag(612, 228, 'it waits for reductive elimination');
    return s;
  },
  caption: 'Left: the β hydrogen and the Pd sit on the same side, as in frame 4 of the Heck. Right: the ring carbons next to the Pd-bonded carbon are sp², and their hydrogens point away.',
});

/* ------------------------------------------------------------------------
   The worked example, drawn: 4'-bromoacetophenone + phenylboronic acid ->
   4-acetylbiphenyl, with the ketone shaded to show it is untouched. */
const acetyl = (c, dirUp = true) => {
  // A C(=O)CH3 group whose carbonyl carbon sits at c: C=O up, CH3 down-right.
  let s = '';
  const O = P(c.x + 22, c.y - 38 * (dirUp ? 1 : -1)), Me = P(c.x + 24, c.y + 40);
  s += bond(c, O, { order: 2, rFrom: 15, rTo: 15 });
  s += bond(c, Me, { rFrom: 15, rTo: 17 });
  s += atom(c.x, c.y, 'C');
  s += atom(O.x, O.y, 'O');
  s += atom(Me.x, Me.y, 'CH₃', { r: 17 });
  return s;
};
FIGURES.push({
  id: 'suzuki-drawn',
  section: 'cross-coupling',
  anchor: '<!-- fig:suzuki-drawn:start -->',
  viewBox: '0 0 700 400',
  alt: 'Four-prime-bromoacetophenone and phenylboronic acid react with Pd(PPh3)4 and aqueous sodium carbonate to give 4-acetylbiphenyl. The ketone is shaded in both the starting material and the product.',
  build() {
    let s = '';
    const a = ringE(170, 110, 30); s += a.svg;
    s += bond(a.pts[3], P(92, 110), { rFrom: 0, rTo: 16 });
    s += atom(92, 110, 'Br', { kind: 'warn' });
    s += bar(212, 54, 102, 100, { kind: 'hi', opacity: 0.18 });
    s += bond(a.pts[0], P(236, 110), { rFrom: 0, rTo: 15 });
    s += acetyl(P(236, 110));
    s += label(340, 115, '+');
    const b = ringE(410, 110, 30); s += b.svg;
    s += bond(b.pts[0], P(484, 110), { rFrom: 0, rTo: 26 });
    s += grp(486, 110, 'B(OH)₂');
    s += tag(180, 184, '4′-bromoacetophenone');
    s += tag(440, 184, 'phenylboronic acid');

    s += arrow(P(300, 204), P(300, 240));
    s += tag(314, 226, 'Pd(PPh₃)₄, Na₂CO₃ (aq), heat', { anchor: 'start' });

    const c = ringE(252, 300, 30); s += c.svg;
    const d = ringE(340, 300, 30); s += d.svg;
    s += bond(c.pts[0], d.pts[3], { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bar(368, 244, 102, 100, { kind: 'hi', opacity: 0.18 });
    s += bond(d.pts[0], P(394, 300), { rFrom: 0, rTo: 15 });
    s += acetyl(P(394, 300));
    s += text(296, 262, 'new C–C bond', { cls: 'fg-tag-good' });
    s += tag(300, 372, '4-acetylbiphenyl');
    s += tag(560, 300, 'the ketone is unchanged');
    return s;
  },
  caption: 'Compare the shaded ketone before and after: it is the same. The highlighted bond between the rings is the one palladium made, at the carbon that carried the bromine.',
});

/* ------------------------------------------------------------------------
   Lesson-only targets. */
const acetylBiphenyl = (lettered) => {
  let s = '';
  const a = ringE(76, 96, 28); s += a.svg;
  const b = ringE(76 + 28 * 2 + 28, 96, 28); s += b.svg;   // centre 160
  s += bond(a.pts[0], b.pts[3], { rFrom: 0, rTo: 0 });
  s += bond(b.pts[0], P(222, 96), { rFrom: 0, rTo: 15 });
  s += acetyl(P(222, 96));
  if (lettered) {
    s += text(118, 84, 'a', { cls: 'fg-tag-warn' });
    s += text(204, 116, 'b', { cls: 'fg-tag-warn' });
    s += text(222, 134, 'c', { cls: 'fg-tag-warn' });
  }
  return { s, a, b };
};
FIGURES.push({
  id: 'l-cut-target',
  lessons: ['cross-coupling'],
  viewBox: '0 0 340 180',
  alt: '4-acetylbiphenyl with three bonds lettered: a joins the two rings, b joins the right-hand ring to the carbonyl carbon, and c joins the carbonyl carbon to the CH3.',
  build() {
    let s = acetylBiphenyl(true).s;
    s += tag(170, 164, '4-acetylbiphenyl');
    return s;
  },
  caption: 'The target, with three of its bonds lettered.',
});
FIGURES.push({
  id: 'l-phenol-ketone',
  lessons: ['cross-coupling'],
  viewBox: '0 0 340 180',
  alt: 'A biaryl with an OH directly on the left-hand ring, para to the ring junction, and an acetyl ketone on the right-hand ring, para to the junction.',
  build() {
    const t = acetylBiphenyl(false);
    let s = t.s;
    s += bond(t.a.pts[3], P(22, 96), { rFrom: 0, rTo: 16 });
    s += atom(22, 96, 'HO', { kind: 'warn', r: 16 });
    s += tag(40, 150, 'phenol O–H');
    s += tag(292, 62, 'ketone');
    return s;
  },
  caption: 'The target: a phenol on one ring, a ketone on the other, and a bond between the rings.',
});

export default FIGURES;
