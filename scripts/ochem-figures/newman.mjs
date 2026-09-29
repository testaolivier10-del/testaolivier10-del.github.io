/* Figures for the newman notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Lesson copies (id prefix l-) are 340 wide or less, stack their panels
   vertically and use only fg-lbl and fg-tag text. */
import { atom, bond, wedge, hash, arrow, text, tag, rule, P } from '../lib/ochem-figure.mjs';

/* ------------------------------------------------------------ helpers ---
   Angles are degrees clockwise from straight up, which is how a student
   reads a dihedral off the page. */
const at = (cx, cy, a, R) => P(cx + R * Math.sin(a * Math.PI / 180), cy - R * Math.cos(a * Math.PI / 180));
const f2 = (v) => (Math.round(v * 100) / 100).toString();

/* Where a label's centre goes so that its whole box sits just beyond the
   point p, in direction a. fg-lbl is 13px, about 8px per character. */
function labelAt(p, a, lab, gap = 3) {
  const w = lab.length * 8.1, h = 13;
  const ux = Math.sin(a * Math.PI / 180), uy = -Math.cos(a * Math.PI / 180);
  const s = Math.abs(ux) * w / 2 + Math.abs(uy) * h / 2 + gap;
  return P(p.x + ux * s, p.y + uy * s);
}
const lbl = (p, lab, cls = 'fg-lbl') => text(p.x, p.y + 4.6, lab, { cls, size: 13 });

/* A Newman projection. front and back are [angle, label] pairs. Back bonds
   run out from the rim; front bonds meet at the dot. In an eclipsed drawing
   the back bonds are turned by `skew` degrees so they stay visible, and each
   front label is nudged the other way so the two labels never touch. */
function newman(cx, cy, r, front, back, opts = {}) {
  const len = opts.backLen ?? 26;
  const skew = opts.skew ?? 0;
  const nudge = skew ? -(opts.nudge ?? 12) : 0;
  let s = '';
  for (const [a0, lab] of back) {
    const a = a0 + skew;
    const p1 = at(cx, cy, a, r), p2 = at(cx, cy, a, r + len);
    s += `<line class="fg-bond-soft" x1="${f2(p1.x)}" y1="${f2(p1.y)}" x2="${f2(p2.x)}" y2="${f2(p2.y)}"></line>`;
    s += lbl(labelAt(p2, a, lab), lab);
  }
  s += `<circle class="fg-atom" cx="${cx}" cy="${cy}" r="${r}"></circle>`;
  for (const [a, lab] of front) {
    const p2 = at(cx, cy, a, r);
    s += `<line class="fg-bond" x1="${cx}" y1="${cy}" x2="${f2(p2.x)}" y2="${f2(p2.y)}"></line>`;
    s += lbl(labelAt(at(cx, cy, a + nudge, r), a + nudge, lab, 4), lab);
  }
  s += `<circle class="fg-lp-mut" cx="${cx}" cy="${cy}" r="4.5"></circle>`;
  return s;
}

/* A dashed arc between two directions, for marking a dihedral angle. */
function arcMark(cx, cy, R, a1, a2) {
  const p1 = at(cx, cy, a1, R), p2 = at(cx, cy, a2, R);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  return `<path class="fg-dash-hi" d="M${f2(p1.x)} ${f2(p1.y)} A${R} ${R} 0 ${large} 1 ${f2(p2.x)} ${f2(p2.y)}"></path>`;
}

/* An eye, looking in direction +x, with its pupil on the right. */
function eye(x, y) {
  return `<path class="fg-bond" d="M${x - 15} ${y} Q${x} ${y - 13} ${x + 15} ${y} Q${x} ${y + 13} ${x - 15} ${y} Z"></path>` +
    `<circle class="fg-lp" cx="${x + 4}" cy="${y}" r="5"></circle>`;
}

/* Ethane drawn side-on, staggered, with the C–C bond horizontal. The left
   carbon is the one nearer the eye. Its in-plane H points up; the right
   carbon's in-plane H points down. */
function ethaneSide(c1, c2) {
  let s = '';
  s += bond(c1, c2, { rFrom: 16, rTo: 15, cls: 'fg-bond-hi' });
  const h = (p) => atom(p.x, p.y, 'H', { r: 13 });
  const l1 = P(c1.x, c1.y - 56), l2 = P(c1.x - 42, c1.y + 40), l3 = P(c1.x - 8, c1.y + 56);
  s += bond(c1, l1, { rFrom: 16, rTo: 13 });
  s += wedge(c1, l2, { rFrom: 16, rTo: 13, width: 9 });
  s += hash(c1, l3, { rFrom: 16, rTo: 13, width: 10, rungs: 4 });
  const r1 = P(c2.x, c2.y + 56), r2 = P(c2.x + 42, c2.y - 40), r3 = P(c2.x + 8, c2.y - 56);
  s += bond(c2, r1, { rFrom: 15, rTo: 13 });
  s += wedge(c2, r2, { rFrom: 15, rTo: 13, width: 9 });
  s += hash(c2, r3, { rFrom: 15, rTo: 13, width: 10, rungs: 4 });
  for (const p of [l1, l2, l3, r1, r2, r3]) s += h(p);
  s += atom(c1.x, c1.y, 'C', { kind: 'warn' });
  s += atom(c2.x, c2.y, 'C');
  return s;
}

/* The staggered ethane Newman that matches ethaneSide: front H at 0, 120,
   240; back H at 60, 180, 300. */
const ETHANE_FRONT = [[0, 'H'], [120, 'H'], [240, 'H']];
const ETHANE_STAG = [[60, 'H'], [180, 'H'], [300, 'H']];
const ETHANE_ECL = [[0, 'H'], [120, 'H'], [240, 'H']];

/* Butane down C2–C3: front CH3 at the top. */
const BUT_FRONT = [[0, 'CH₃'], [120, 'H'], [240, 'H']];
const BUTANE = [
  { name: 'anti', deg: '180°', kind: 'staggered', e: '0', cls: 'fg-tag-good', back: [[60, 'H'], [180, 'CH₃'], [300, 'H']], skew: 0 },
  { name: 'gauche', deg: '60°', kind: 'staggered', e: '+0.9', cls: 'fg-tag-good', back: [[60, 'CH₃'], [180, 'H'], [300, 'H']], skew: 0 },
  { name: 'eclipsed', deg: '120°', kind: 'eclipsed', e: '+3.6', cls: 'fg-tag-warn', back: [[0, 'H'], [120, 'CH₃'], [240, 'H']], skew: 14 },
  { name: 'syn', deg: '0°', kind: 'eclipsed', e: '+4.5 to 6', cls: 'fg-tag-warn', back: [[0, 'CH₃'], [120, 'H'], [240, 'H']], skew: 14 },
];

/* 2-Methylbutane down C2–C3, C2 in front: CH3 at the top, CH3 lower right,
   H lower left. The back carbon carries one CH3 and two H. */
const MB_FRONT = [[0, 'CH₃'], [120, 'CH₃'], [240, 'H']];
const mbBack = (m) => [0, 120, 240].map((d) => [(m + d) % 360, d === 0 ? 'CH₃' : 'H']);

const FIGURES = [];

/* ---------------------------------------------------------------------------
   The view itself: a bond seen side-on, then end-on. */
function eyeBody(stacked) {
  let s = '';
  if (!stacked) {
    s += tag(200, 30, 'SIDE-ON: THE BOND YOU LOOK DOWN');
    s += eye(40, 150);
    s += arrow(P(62, 150), P(104, 150), { muted: true });
    s += text(40, 188, 'your eye', { cls: 'fg-lbl' });
    s += ethaneSide(P(170, 150), P(290, 150));
    s += text(170, 250, 'FRONT carbon', { cls: 'fg-tag-warn' });
    s += text(290, 250, 'BACK carbon', { cls: 'fg-tag' });
    s += rule(390, 50, 390, 270);
    s += tag(575, 30, 'END-ON: THE NEWMAN PROJECTION');
    s += newman(575, 150, 44, ETHANE_FRONT, ETHANE_STAG);
    s += text(575, 250, 'front carbon = the dot', { cls: 'fg-tag-warn' });
    s += text(575, 268, 'back carbon = the circle', { cls: 'fg-tag' });
    return s;
  }
  s += tag(170, 24, 'SIDE-ON: THE BOND YOU LOOK DOWN');
  s += eye(36, 120);
  s += arrow(P(56, 120), P(92, 120), { muted: true });
  s += text(36, 158, 'eye', { cls: 'fg-lbl' });
  s += ethaneSide(P(160, 120), P(270, 120));
  s += text(160, 216, 'FRONT carbon', { cls: 'fg-tag-warn' });
  s += text(270, 216, 'BACK carbon', { cls: 'fg-tag' });
  s += rule(20, 236, 320, 236);
  s += tag(170, 262, 'END-ON: THE NEWMAN PROJECTION');
  s += newman(170, 360, 42, ETHANE_FRONT, ETHANE_STAG);
  s += text(170, 456, 'front carbon = the dot', { cls: 'fg-tag-warn' });
  s += text(170, 474, 'back carbon = the circle', { cls: 'fg-tag' });
  return s;
}
const EYE_ALT = 'Ethane drawn side-on with an eye on the left looking along the C–C bond, the nearer carbon labeled front and the farther one back, and beside it the Newman projection of the same view: the front carbon as a dot with three H, the back carbon as a circle with three H';
FIGURES.push({
  id: 'eye-on-axis',
  section: 'newman',
  anchor: 'so they are drawn 120° apart.</p>',
  alt: EYE_ALT,
  viewBox: '0 0 760 290',
  build: () => eyeBody(false),
  caption: 'Left: ethane side-on. The wedge comes toward you, the hashed bond goes away, and the highlighted bond is the one the eye looks along. Right: what the eye sees. The front hydrogens meet at the dot; the back hydrogens start at the rim of the circle.',
});
FIGURES.push({
  id: 'l-eye-on-axis',
  lessons: ['newman'],
  alt: EYE_ALT,
  viewBox: '0 0 340 490',
  build: () => eyeBody(true),
  caption: 'Top: ethane side-on, with the eye looking along the highlighted C–C bond. Bottom: what the eye sees.',
});

/* ---------------------------------------------------------------------------
   The conversion, done once on butane. */
FIGURES.push({
  id: 'structure-to-newman',
  section: 'newman',
  anchor: 'they come from putting a group on the wrong carbon.</p>',
  alt: 'A skeletal drawing of butane with the C2 to C3 bond highlighted and C2 labeled front and C3 labeled back, and beside it the anti Newman projection obtained by sighting down that bond',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(180, 34, 'STEP 1: MARK THE BOND, FRONT AND BACK');
    const c1 = P(58, 178), c2 = P(116, 144), c3 = P(174, 178), c4 = P(232, 144);
    s += bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += bond(c2, c3, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(c3, c4, { rFrom: 0, rTo: 0 });
    s += text(58, 200, 'C1', { cls: 'fg-sm' });
    s += text(232, 166, 'C4', { cls: 'fg-sm' });
    s += text(116, 124, 'C2', { cls: 'fg-tag-warn' });
    s += text(174, 202, 'C3', { cls: 'fg-tag' });
    s += text(116, 108, 'FRONT', { cls: 'fg-tag-warn' });
    s += text(174, 218, 'BACK', { cls: 'fg-tag' });
    s += text(150, 252, 'C2 carries CH₃ + H + H', { cls: 'fg-sm' });
    s += text(150, 268, 'C3 carries CH₃ + H + H', { cls: 'fg-sm' });

    s += arrow(P(296, 170), P(368, 170), { muted: true });
    s += text(332, 152, 'look along', { cls: 'fg-sm' });
    s += text(332, 192, 'the C2–C3 bond', { cls: 'fg-sm' });
    s += rule(398, 56, 398, 268);

    s += tag(578, 34, 'STEP 2: DRAW WHAT EACH CARBON CARRIES');
    s += newman(578, 156, 44, BUT_FRONT, BUTANE[0].back);
    s += text(578, 262, 'anti: the two CH₃ groups 180° apart', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Step 1 decides everything: which carbon is front, which is back, and what each one carries. Step 2 only writes those two lists around the dot and the circle.',
  note: 'Read backward, the drawing gives the structure: CH₃, H, H on the dot and CH₃, H, H on the circle is butane seen down C2–C3.',
});

/* ---------------------------------------------------------------------------
   Staggered against eclipsed ethane, with the dihedral angle marked. */
function ethanePair(stacked) {
  let s = '';
  const A = stacked ? { x: 170, y: 110 } : { x: 190, y: 150 };
  const B = stacked ? { x: 170, y: 350 } : { x: 570, y: 150 };
  const tA = stacked ? 24 : 34, tB = stacked ? 264 : 34;
  s += tag(A.x, tA, 'STAGGERED: 60°', { cls: 'fg-tag-good' });
  s += newman(A.x, A.y, 44, ETHANE_FRONT, ETHANE_STAG);
  s += arcMark(A.x, A.y, 36, 0, 60);
  s += text(A.x + 14, A.y - 11, '60°', { cls: 'fg-tag' });
  s += tag(B.x, tB, 'ECLIPSED: 0°', { cls: 'fg-tag-warn' });
  s += newman(B.x, B.y, 44, ETHANE_FRONT, ETHANE_ECL, { skew: 14 });
  const cap = stacked ? 18 : 0;
  if (!stacked) s += rule(380, 56, 380, 270);
  s += text(A.x, A.y + 104 - cap, 'each back bond sits mid-gap', { cls: stacked ? 'fg-tag' : 'fg-sm' });
  s += text(B.x, B.y + 104 - cap, 'each back bond hides behind a front one', { cls: stacked ? 'fg-tag' : 'fg-sm' });
  s += text(A.x, A.y + 126 - cap, 'lowest energy', { cls: 'fg-tag-good' });
  s += text(B.x, B.y + 126 - cap, '+2.9 kcal/mol', { cls: 'fg-tag-warn' });
  return s;
}
FIGURES.push({
  id: 'ethane-stagger-eclipse',
  section: 'newman',
  anchor: 'A staggered drawing puts each back bond squarely in the middle of a gap.</p>',
  alt: 'Two Newman projections of ethane. Staggered: each back H sits halfway between two front H, 60 degrees from each, lowest energy. Eclipsed: each back H sits just behind a front H, drawn turned a few degrees so both show, 2.9 kcal/mol higher',
  viewBox: '0 0 760 290',
  build: () => ethanePair(false),
  caption: 'The dashed arc marks the dihedral angle between the top front H and the nearest back H. In the eclipsed drawing the back bonds are turned a few degrees only so you can see them; the angle they show is 0°.',
});

/* The same two drawings, unnamed, for the lesson's "pick the staggered one"
   step: the names would give the answer away. */
FIGURES.push({
  id: 'l-ethane-choice',
  lessons: ['newman'],
  alt: 'Two Newman projections of ethane, labeled A and B. In A each back H sits halfway between two front H. In B each back H sits just behind a front H, turned a few degrees so it shows',
  viewBox: '0 0 340 440',
  build() {
    let s = '';
    s += tag(170, 24, 'A');
    s += newman(170, 110, 44, ETHANE_FRONT, ETHANE_STAG);
    s += rule(20, 212, 320, 212);
    s += tag(170, 244, 'B');
    s += newman(170, 330, 44, ETHANE_FRONT, ETHANE_ECL, { skew: 14 });
    s += text(170, 430, 'front H meet at the dot; back H start at the rim', { cls: 'fg-tag' });
    return s;
  },
  caption: 'Two conformations of ethane, seen down the C–C bond.',
});

/* ---------------------------------------------------------------------------
   Hyperconjugation: a filled C–H bond and the empty C–H σ* next door, lined
   up when staggered and out of line when eclipsed. Side-on, C–C horizontal. */
function hyperPanel(cx, cy, staggered) {
  let s = '';
  const c1 = P(cx - 55, cy), c2 = P(cx + 55, cy);
  s += bond(c1, c2, { rFrom: 16, rTo: 16 });
  // left carbon: in-plane H up (the donor bond), two more H lower left
  const hU = P(c1.x, c1.y - 62);
  s += `<ellipse class="fg-orb-alt" cx="${c1.x}" cy="${c1.y - 31}" rx="12" ry="36"></ellipse>`;
  s += bond(c1, hU, { rFrom: 16, rTo: 13, cls: 'fg-bond-hi' });
  const w1 = P(c1.x - 56, c1.y + 20), h1 = P(c1.x - 34, c1.y + 50);
  s += wedge(c1, w1, { rFrom: 16, rTo: 13, width: 9 });
  s += hash(c1, h1, { rFrom: 16, rTo: 13, width: 10, rungs: 4 });
  for (const p of [hU, w1, h1]) s += atom(p.x, p.y, 'H', { r: 13 });
  // right carbon: the acceptor C–H is down (anti) when staggered, up (syn) when eclipsed.
  // Its sigma* has its big lobe on carbon, pointing away from that H.
  const dir = staggered ? 1 : -1;               // +1: H points down
  const hA = P(c2.x, c2.y + dir * 62);
  s += `<ellipse class="fg-orb" cx="${c2.x}" cy="${c2.y - dir * 34}" rx="15" ry="30"></ellipse>`;
  s += `<ellipse class="fg-orb-alt" cx="${c2.x}" cy="${c2.y + dir * 84}" rx="8" ry="9"></ellipse>`;
  s += bond(c2, hA, { rFrom: 16, rTo: 13 });
  const o1 = P(c2.x + 56, c2.y - dir * 20), o2 = P(c2.x + 34, c2.y - dir * 50);
  s += wedge(c2, o1, { rFrom: 16, rTo: 13, width: 9 });
  s += hash(c2, o2, { rFrom: 16, rTo: 13, width: 10, rungs: 4 });
  for (const p of [hA, o1, o2]) s += atom(p.x, p.y, 'H', { r: 13 });
  s += atom(c1.x, c1.y, 'C');
  s += atom(c2.x, c2.y, 'C');
  return s;
}
function hyperBody(stacked) {
  let s = '';
  const P1 = stacked ? { x: 170, y: 160, t: 24 } : { x: 190, y: 160, t: 30 };
  const P2 = stacked ? { x: 170, y: 476, t: 340 } : { x: 570, y: 160, t: 30 };
  s += tag(P1.x, P1.t, 'STAGGERED: LINED UP', { cls: 'fg-tag-good' });
  s += hyperPanel(P1.x, P1.y, true);
  s += text(P1.x - 55, P1.y - 108, 'filled C–H bond', { cls: 'fg-tag' });
  s += text(P1.x + 55, P1.y - 108, 'empty σ*', { cls: 'fg-tag' });
  s += text(P1.x, P1.y + 118, 'parallel, side by side:', { cls: stacked ? 'fg-tag' : 'fg-sm' });
  s += text(P1.x, P1.y + 134, 'electrons spread into σ*', { cls: 'fg-tag-good' });
  s += tag(P2.x, P2.t, 'ECLIPSED: OUT OF LINE', { cls: 'fg-tag-warn' });
  s += hyperPanel(P2.x, P2.y, false);
  s += text(P2.x - 55, P2.y - 108, 'filled C–H bond', { cls: 'fg-tag' });
  s += text(P2.x + 55, P2.y + 92, 'empty σ*', { cls: 'fg-tag' });
  s += text(P2.x, P2.y + 134, 'no C–H bond opposite: weaker overlap', { cls: 'fg-tag-warn' });
  if (!stacked) s += rule(380, 50, 380, 290);
  else s += rule(20, 318, 320, 318);
  return s;
}
const HYPER_ALT = 'Ethane side-on, twice. Staggered: the upper C–H bond on the left carbon, shaded as a filled orbital, sits parallel to the large lobe of the empty sigma-star orbital of the lower C–H bond on the right carbon. Eclipsed: the right carbon\'s matching C–H bond points up, so its sigma-star lobe points down, away from the filled bond';
FIGURES.push({
  id: 'hyperconjugation',
  section: 'newman',
  anchor: 'Eclipsing turns the bonds out of line and loses most of that stabilization.</p>',
  alt: HYPER_ALT,
  viewBox: '0 0 760 310',
  build: () => hyperBody(false),
  caption: 'Only one pair of bonds is shaded; in staggered ethane every C–H bond has such a partner. The σ* orbital has its large lobe on carbon, on the side facing away from its own H, and a small lobe of opposite phase beyond the H.',
});
FIGURES.push({
  id: 'l-hyperconjugation',
  lessons: ['newman'],
  alt: HYPER_ALT,
  viewBox: '0 0 340 626',
  build: () => hyperBody(true),
  caption: 'The shaded bond on the left carbon is filled. The lobes on the right carbon are the empty σ* of the C–H bond drawn there.',
});

/* ---------------------------------------------------------------------------
   All four butane conformers. */
FIGURES.push({
  id: 'butane-four-conformers',
  section: 'newman',
  anchor: 'and most of the rest in the two gauche forms.</p>',
  alt: 'The four named conformations of butane drawn as Newman projections in order of energy: anti, gauche, methyl-hydrogen eclipsed and syn',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    s += tag(380, 30, 'ONE ROTATION, FOUR NAMES, IN ORDER OF ENERGY');
    BUTANE.forEach((p, i) => {
      const x = 95 + i * 190;
      s += newman(x, 150, 38, BUT_FRONT, p.back, { skew: p.skew });
      s += text(x, 262, p.name + ', ' + p.deg, { cls: p.cls });
      s += text(x, 280, p.kind, { cls: 'fg-sm' });
      s += text(x, 302, p.e + ' kcal/mol', { cls: 'fg-lbl' });
    });
    for (const x of [190, 380, 570]) s += rule(x, 62, x, 300);
    return s;
  },
  caption: 'The panels are ordered by energy, not by the order in which a turn reaches them.',
});
FIGURES.push({
  id: 'l-butane-four',
  lessons: ['newman'],
  alt: 'The four named conformations of butane as Newman projections: anti and gauche on the top row, methyl-hydrogen eclipsed and syn on the bottom row',
  viewBox: '0 0 340 440',
  build() {
    let s = '';
    BUTANE.forEach((p, i) => {
      const x = i % 2 ? 255 : 85, y = i < 2 ? 90 : 310;
      s += newman(x, y, 30, BUT_FRONT, p.back, { skew: p.skew, backLen: 20 });
      s += text(x, y + 88, p.name + ', ' + p.deg, { cls: p.cls });
      s += text(x, y + 106, p.e + ' kcal/mol', { cls: 'fg-lbl' });
    });
    s += rule(170, 20, 170, 420);
    s += rule(20, 216, 320, 216);
    return s;
  },
  caption: 'Top row: staggered. Bottom row: eclipsed.',
});

/* ---------------------------------------------------------------------------
   1,2-Dibromoethane, anti and gauche. */
FIGURES.push({
  id: 'dibromoethane',
  section: 'newman',
  anchor: 'once you say which pair you are tracking.</p>',
  alt: 'Two Newman projections of 1,2-dibromoethane down the C–C bond: anti, with the back Br 180 degrees from the front Br, and gauche, with the back Br 60 degrees from it',
  viewBox: '0 0 560 260',
  build() {
    let s = '';
    const F = [[0, 'Br'], [120, 'H'], [240, 'H']];
    s += tag(140, 28, 'ANTI: Br 180° FROM Br', { cls: 'fg-tag-good' });
    s += newman(140, 140, 40, F, [[60, 'H'], [180, 'Br'], [300, 'H']]);
    s += rule(280, 50, 280, 240);
    s += tag(420, 28, 'GAUCHE: Br 60° FROM Br', { cls: 'fg-tag' });
    s += newman(420, 140, 40, F, [[60, 'Br'], [180, 'H'], [300, 'H']]);
    s += arcMark(420, 140, 26, 0, 60);
    return s;
  },
  caption: 'The same names as butane, with Br in place of CH₃. The gauche form has a twin with the back Br at 300°.',
});

/* ---------------------------------------------------------------------------
   2-Methylbutane, the worked example. */
function mbPanel(x, y, m, opts = {}) {
  return newman(x, y, opts.r ?? 34, MB_FRONT, mbBack(m), { skew: opts.skew || 0, backLen: opts.backLen ?? 22 });
}
FIGURES.push({
  id: 'methylbutane-conformers',
  section: 'newman',
  anchor: 'it has no conformer that escapes gauche strain entirely.</p>',
  alt: '2-Methylbutane with C2 marked front and C3 marked back. Below, Newman projections down C2–C3: conformer A, with the back CH3 between the two front CH3 groups; the eclipsed conformer 60 degrees on, with the back CH3 behind a front CH3; conformer B, with the back CH3 between the lower front CH3 and the front H; and conformer C, with the back CH3 between the top front CH3 and the front H',
  viewBox: '0 0 760 636',
  build() {
    let s = '';
    // Row 1: the skeleton.
    s += tag(190, 28, 'STEPS 1–2: MARK C2 FRONT, C3 BACK');
    const c1 = P(70, 110), c2 = P(130, 76), c3 = P(190, 110), c4 = P(250, 76), cb = P(130, 30 + 6);
    s += bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += bond(c2, c3, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(c3, c4, { rFrom: 0, rTo: 0 });
    s += bond(c2, P(130, 44), { rFrom: 0, rTo: 0 });
    s += text(70, 132, 'C1', { cls: 'fg-sm' });
    s += text(250, 98, 'C4', { cls: 'fg-sm' });
    s += text(100, 64, 'C2 FRONT', { cls: 'fg-tag-warn', anchor: 'end' });
    s += text(190, 134, 'C3 BACK', { cls: 'fg-tag' });
    void cb;
    s += text(460, 70, 'C2 carries CH₃ (C1), CH₃ (branch), H', { cls: 'fg-lbl' });
    s += text(460, 96, 'C3 carries CH₃ (C4), H, H', { cls: 'fg-lbl' });
    s += rule(20, 160, 740, 160);
    // Row 2: A, turn 60°, eclipsed, turn 60°, B.
    s += tag(380, 186, 'STEPS 3–4: TURN THE BACK CARBON 60° AT A TIME');
    const y2 = 290;
    s += mbPanel(110, y2, 60);
    s += arrow(P(210, y2), P(262, y2), { muted: true });
    s += text(236, y2 - 12, '60°', { cls: 'fg-sm' });
    s += mbPanel(380, y2, 120, { skew: 14 });
    s += arrow(P(498, y2), P(550, y2), { muted: true });
    s += text(524, y2 - 12, '60°', { cls: 'fg-sm' });
    s += mbPanel(650, y2, 180);
    s += text(110, y2 + 88, 'A: staggered', { cls: 'fg-tag' });
    s += text(380, y2 + 88, 'eclipsed', { cls: 'fg-tag-warn' });
    s += text(380, y2 + 106, 'CH₃/CH₃ + CH₃/H + H/H ≈ 5', { cls: 'fg-sm' });
    s += text(650, y2 + 88, 'B: staggered', { cls: 'fg-tag' });
    s += rule(20, 412, 740, 412);
    // Row 3: C, and the count.
    s += tag(380, 436, 'STEP 5: COUNT GAUCHE CH₃/CH₃ PAIRS IN EACH STAGGERED FORM');
    s += mbPanel(110, 530, 300);
    s += text(110, 618, 'C: staggered', { cls: 'fg-tag' });
    s += text(250, 490, 'A: back CH₃ 60° from both front CH₃', { cls: 'fg-lbl', anchor: 'start' });
    s += text(250, 510, '2 pairs × 0.9 = 1.8 kcal/mol', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(250, 544, 'B and C: back CH₃ 60° from one front CH₃', { cls: 'fg-lbl', anchor: 'start' });
    s += text(250, 564, '1 pair = 0.9 kcal/mol each: the best', { cls: 'fg-tag-good', anchor: 'start' });
    return s;
  },
  caption: 'The front groups stay put while the back carbon turns. Turning B a further 120° gives C.',
});
FIGURES.push({
  id: 'l-methylbutane',
  lessons: ['newman'],
  alt: 'The three staggered Newman projections of 2-methylbutane down C2–C3. A: back CH3 between the two front CH3 groups, two gauche pairs. B: back CH3 at the bottom, between the lower-right front CH3 and the front H, one gauche pair. C: back CH3 at the upper left, between the top front CH3 and the front H, one gauche pair',
  viewBox: '0 0 340 580',
  build() {
    let s = '';
    const rows = [
      { m: 60, name: 'A', n: '2 gauche pairs: 1.8', cls: 'fg-tag-warn' },
      { m: 180, name: 'B', n: '1 gauche pair: 0.9', cls: 'fg-tag-good' },
      { m: 300, name: 'C', n: '1 gauche pair: 0.9', cls: 'fg-tag-good' },
    ];
    rows.forEach((r, i) => {
      const y = 88 + i * 196;
      s += mbPanel(120, y, r.m, { r: 32, backLen: 20 });
      s += text(262, y - 8, r.name, { cls: 'fg-lbl' });
      s += text(262, y + 14, r.n, { cls: r.cls });
      if (i < 2) s += rule(20, y + 98, 320, y + 98);
    });
    return s;
  },
  caption: '2-Methylbutane down C2–C3, C2 in front. Costs in kcal/mol.',
});

/* ---------------------------------------------------------------------------
   Butane's energy over one full turn. */
FIGURES.push({
  id: 'butane-energy-curve',
  section: 'newman',
  anchor: 'and large enough that anti is clearly preferred.</p>',
  alt: 'Butane energy in kcal/mol against the dihedral angle between the two methyl groups from 0 to 360 degrees: maxima at 0 degrees (syn, about 5), 120 and 240 degrees (methyl-hydrogen eclipsed, 3.6), minima at 60 and 300 degrees (gauche, 0.9) and 180 degrees (anti, 0)',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const x0 = 110, x1 = 730, yb = 216, k = 30;   // k px per kcal/mol
    const X = (d) => x0 + (x1 - x0) * d / 360, Y = (e) => yb - e * k;
    s += rule(x0, yb, x1, yb);
    s += rule(x0, yb + 6, x0, Y(6.2));
    for (const e of [0, 2, 4, 6]) {
      s += rule(x0 - 5, Y(e), x0, Y(e));
      s += text(x0 - 10, Y(e) + 4, String(e), { cls: 'fg-sm', anchor: 'end' });
    }
    s += `<text class="fg-sm" x="58" y="${Y(3)}" text-anchor="middle" transform="rotate(-90 58 ${Y(3)})">kcal/mol</text>`;
    const pts = [[0, 5], [60, 0.9], [120, 3.6], [180, 0], [240, 3.6], [300, 0.9], [360, 5]];
    let d = `M${X(0)} ${f2(Y(5))}`;
    for (let i = 1; i < pts.length; i++) {
      const [a0, e0] = pts[i - 1], [a1, e1] = pts[i];
      const dx = (X(a1) - X(a0)) * 0.3;
      d += ` C${f2(X(a0) + dx)} ${f2(Y(e0))} ${f2(X(a1) - dx)} ${f2(Y(e1))} ${f2(X(a1))} ${f2(Y(e1))}`;
    }
    s += `<path class="fg-bond-hi" d="${d}"></path>`;
    const marks = [
      [0, 5, 'syn', 'fg-tag-warn', 'about 5', 'above', 'start'],
      [60, 0.9, 'gauche', 'fg-tag-good', '0.9', 'above'],
      [120, 3.6, 'eclipsed', 'fg-tag-warn', '3.6', 'above'],
      [180, 0, 'anti', 'fg-tag-good', '0', 'above'],
      [240, 3.6, 'eclipsed', 'fg-tag-warn', '3.6', 'above'],
      [300, 0.9, 'gauche', 'fg-tag-good', '0.9', 'above'],
    ];
    for (const [a, e, name, cls, v, where, anchor] of marks) {
      const x = X(a), y = Y(e);
      s += `<circle class="fg-lp" cx="${f2(x)}" cy="${f2(y)}" r="4.5"></circle>`;
      const tx = anchor === 'start' ? x + 10 : x;
      const ty = where === 'above' ? y - 24 : y + 22;
      s += text(tx, ty, name, { cls, anchor: anchor || 'middle' });
      s += text(tx, ty + 14, v, { cls: 'fg-sm', anchor: anchor || 'middle' });
    }
    for (const a of [0, 60, 120, 180, 240, 300, 360]) s += text(X(a), yb + 22, a + '°', { cls: 'fg-sm' });
    s += text((x0 + x1) / 2, yb + 46, 'dihedral angle between the two methyl groups', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Staggered conformations sit at the dips and eclipsed ones at the peaks. The syn peak is drawn at about 5; measured values run from 4.5 to 6.',
});

/* ---------------------------------------------------------------------------
   A scaffold for the lesson's challenge: the front carbon filled in, the
   back positions left open. */
FIGURES.push({
  id: 'l-dimethylbutane',
  lessons: ['newman'],
  alt: 'A Newman projection of 2,3-dimethylbutane down C2–C3 with the front carbon filled in, CH3 at the top, CH3 at the lower right and H at the lower left, and the three back positions marked with question marks',
  viewBox: '0 0 340 264',
  build() {
    let s = '';
    s += newman(170, 110, 44, MB_FRONT, [[60, '?'], [180, '?'], [300, '?']]);
    s += text(170, 228, 'front carbon: CH₃, CH₃, H', { cls: 'fg-tag' });
    s += text(170, 248, 'back carbon: CH₃, CH₃, H (place them)', { cls: 'fg-tag' });
    return s;
  },
  caption: '2,3-Dimethylbutane down C2–C3, staggered. Fill in the back carbon three ways.',
});

export default FIGURES;
