/* Figures for the cyclohexanes notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, arrow, text, tag, rule, P } from '../lib/ochem-figure.mjs';
import { polyPts, polyRing } from '../lib/ochem-skeletal.mjs';
import { lobeE, frame } from '../lib/ochem-helpers.mjs';

/* Shared drawing helpers, copied from the builder. */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
function chair(cx, cy, k = 1) {
  return CHAIR_V.map((v) => P(cx + v.x * k, cy + v.y * k));
}
const chairRing = (pts, cls) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls })).join('');

/* ---- Rings in 3D ---------------------------------------------------------
   CHAIR_V above is an orthographic view of a real chair: in-plane radius
   1.45 Å at 78.03 px/Å, seen from about 20° above the ring plane, so the
   ring's depth axis (y) is squashed by 0.342 and its height (z) drawn nearly
   full size. `view` reproduces that projection exactly, so any other ring
   shape built in 3D and drawn through it matches the chapter's chair. */
const PX = 78.03, ZS = 70.8, TY = 0.3421 * 78.03;
const view = (cx, cy, k = 1) => (v) => P(cx + k * PX * v.x, cy - k * (ZS * v.z + TY * v.y));

/* Six-ring shapes from Cremer–Pople puckering coordinates: Q is the total
   pucker, theta 0 gives the chair, 90 a boat or twist-boat (phi picks which),
   and about 51 a half-chair. Atoms sit over a regular hexagon; only their
   heights change. Q = 0.63 at theta 0 reproduces CHAIR_V exactly. */
function ring6(Q, thetaDeg = 0, phiDeg = 0) {
  const th = (thetaDeg * Math.PI) / 180, ph = (phiDeg * Math.PI) / 180;
  const q2 = Q * Math.sin(th), q3 = Q * Math.cos(th);
  return [0, 1, 2, 3, 4, 5].map((j) => ({
    x: 1.45 * Math.cos((j * Math.PI) / 3),
    y: 1.45 * Math.sin((j * Math.PI) / 3),
    z: Math.sqrt(1 / 3) * q2 * Math.cos(ph + (2 * Math.PI * j) / 3) + Math.sqrt(1 / 6) * q3 * (j % 2 ? -1 : 1),
  }));
}
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul = (a, k) => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const unit = (a) => mul(a, 1 / Math.hypot(a.x, a.y, a.z));
const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
/* The two hydrogens on ring carbon j, 1.09 Å out, in the plane that bisects
   the C–C–C angle and 109.5° apart. Returned with the one nearer the ring's
   axis first (the inward-leaning one; on a boat's raised end, the flagpole). */
function ringH(C, j, L = 1.09) {
  const c = C[j], a = C[(j + 5) % 6], b = C[(j + 1) % 6];
  const out = unit(add(sub(c, a), sub(c, b)));
  const nrm = unit(cross(sub(a, c), sub(b, c)));
  const h = 54.75 * Math.PI / 180;
  const hs = [add(c, mul(add(mul(out, Math.cos(h)), mul(nrm, Math.sin(h))), L)),
              add(c, mul(add(mul(out, Math.cos(h)), mul(nrm, -Math.sin(h))), L))];
  const r = (p) => Math.hypot(p.x, p.y);
  return r(hs[0]) <= r(hs[1]) ? hs : [hs[1], hs[0]];
}
const skRing = (pts, hiEdges = [], hiCls = 'fg-bond-hi') => pts.map((p, i) => {
  const j = (i + 1) % pts.length;
  const hi = hiEdges.some(([a, b]) => (a === i && b === j) || (a === j && b === i));
  return bond(p, pts[j], { rFrom: 0, rTo: 0, cls: hi ? hiCls : 'fg-bond' });
}).join('');

/* A Newman projection (copied from the builder, labels in fg-lbl). Angles
   are degrees clockwise from straight up. */
function newman(cx, cy, r, front, back) {
  const at = (a, R) => P(cx + R * Math.sin(a * Math.PI / 180), cy - R * Math.cos(a * Math.PI / 180));
  let s = '';
  for (const [a, lab] of back) {
    const p1 = at(a, r), p2 = at(a, r + 21), p3 = at(a, r + 34);
    s += `<line class="fg-bond-soft" x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}"></line>`;
    if (lab) s += text(p3.x, p3.y + 4.5, lab, { cls: 'fg-lbl' });
  }
  s += `<circle class="fg-atom" cx="${cx}" cy="${cy}" r="${r}"></circle>`;
  for (const [a, lab] of front) {
    const p2 = at(a, r), p3 = at(a, r + 13);
    s += `<line class="fg-bond" x1="${cx}" y1="${cy}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}"></line>`;
    if (lab) s += text(p3.x, p3.y + 4.5, lab, { cls: 'fg-lbl' });
  }
  s += `<circle class="fg-lp-mut" cx="${cx}" cy="${cy}" r="4.5"></circle>`;
  return s;
}
/* Where a Newman label lands, so clouds and notes can be placed on it. */
const nmAt = (cx, cy, a, R) => P(cx + R * Math.sin(a * Math.PI / 180), cy - R * Math.cos(a * Math.PI / 180));

/* An angle arc at vertex v between directions (degrees, counterclockwise
   from east, as on paper). */
function arc(v, fromDeg, toDeg, r, cls = 'fg-bond-soft') {
  const pt = (d) => P(v.x + r * Math.cos(-d * Math.PI / 180), v.y + r * Math.sin(-d * Math.PI / 180));
  const a = pt(fromDeg), b = pt(toDeg);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `<path class="${cls}" d="M${a.x.toFixed(2)} ${a.y.toFixed(2)} A${r} ${r} 0 ${large} 0 ${b.x.toFixed(2)} ${b.y.toFixed(2)}"></path>`;
}

/* ---- Panels shared by a notes figure and its stacked lesson copy ---------
   Each draws around its own centre (cx, cy) and uses only fg-lbl and fg-tag
   text, so the same panel is legal in a lesson. */

/* Angle strain: cyclopropane's 60° against the 109.5° an sp³ carbon wants. */
function panelAngle(cx, cy) {
  let s = '';
  const A = P(cx - 30, cy + 34), B = P(cx + 60, cy + 34), C = P(cx + 15, cy + 34 - 77.94);
  s += bond(A, B, { rFrom: 0, rTo: 0 }) + bond(B, C, { rFrom: 0, rTo: 0 }) + bond(C, A, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
  s += arc(A, 0, 60, 24, 'fg-bond-hi');
  s += text(A.x + 34, A.y - 9, '60°', { cls: 'fg-tag' });
  // the direction the bond wants: 109.5° from the base
  const want = P(A.x + 64 * Math.cos(109.5 * Math.PI / 180), A.y - 64 * Math.sin(109.5 * Math.PI / 180));
  s += `<line class="fg-dash" x1="${A.x}" y1="${A.y}" x2="${want.x.toFixed(2)}" y2="${want.y.toFixed(2)}"></line>`;
  s += arc(A, 60, 109.5, 44, 'fg-dash');
  s += text(want.x - 4, want.y - 8, '109.5°', { cls: 'fg-tag-mut' });
  s += text(cx, cy + 62, 'squeezed from 109.5° to 60°', { cls: 'fg-tag' });
  return s;
}

/* Torsional strain: sight down one C–C bond of cyclopropane. The ring's
   third carbon sits straight below both, and the four hydrogens pair off
   eclipsed (drawn a few degrees apart so the back ones show). */
function panelTorsion(cx, cy) {
  let s = '';
  s += newman(cx, cy, 24, [[-62, 'H'], [62, 'H']], [[-40, 'H'], [84, 'H']]);
  const c3 = P(cx, cy + 50);
  s += `<line class="fg-bond" x1="${cx}" y1="${cy}" x2="${cx}" y2="${(c3.y - 14).toFixed(2)}"></line>`;
  s += atom(c3.x, c3.y, 'C', { r: 13 });
  s += text(cx, cy - 58, 'H in front of H, twice', { cls: 'fg-tag-warn' });
  s += text(cx, cy + 90, 'third ring carbon: behind both', { cls: 'fg-tag-mut' });
  return s;
}

/* Steric strain: gauche butane. Staggered, so no eclipsing, yet the two
   methyls' electron clouds overlap. */
function panelSteric(cx, cy) {
  let s = '';
  const r = 24;
  const fM = nmAt(cx, cy, 300, r + 13), bM = nmAt(cx, cy, 0, r + 34);
  s += lobeE(fM.x.toFixed(1), (fM.y - 1).toFixed(1), 24, 20, 'fg-orb');
  s += lobeE(bM.x.toFixed(1), (bM.y - 1).toFixed(1), 24, 20, 'fg-orb-alt');
  s += newman(cx, cy, r, [[300, 'CH₃'], [60, 'H'], [180, 'H']], [[0, 'CH₃'], [120, 'H'], [240, 'H']]);
  s += text(cx, cy + 90, 'methyls 60° apart: clouds overlap', { cls: 'fg-tag-warn' });
  return s;
}

/* Cyclopropane's bent bonds. */
function panelBent(cx, cy) {
  let s = '';
  const V = [P(cx, cy - 46), P(cx - 50, cy + 40), P(cx + 50, cy + 40)];
  for (let i = 0; i < 3; i++) {
    const a = V[i], b = V[(i + 1) % 3];
    const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
    const out = unit({ x: m.x - cx, y: m.y - (cy + 11), z: 0 });
    const c = P(m.x + out.x * 26, m.y + out.y * 26);
    s += `<line class="fg-dash" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line>`;
    s += `<path class="fg-bond-hi" d="M${a.x} ${a.y} Q${c.x.toFixed(2)} ${c.y.toFixed(2)} ${b.x} ${b.y}"></path>`;
  }
  for (const v of V) s += atom(v.x, v.y, 'C', { r: 13 });
  return s;
}

/* Puckered cyclobutane, folded along the front-to-back diagonal (C1–C3):
   the left and right carbons tip up like a half-closed book. Drawn from a
   little higher (35°) than the chair view, where the fold reads clearly. */
function panelCyclobutane(cx, cy, k = 1) {
  const R = 1.08, h = 0.22, e = 35 * Math.PI / 180;
  const C = [0, 1, 2, 3].map((j) => ({ x: R * Math.cos((j * Math.PI) / 2), y: R * Math.sin((j * Math.PI) / 2), z: j % 2 ? -h : h }));
  const pts = C.map((v) => P(cx + k * PX * v.x, cy - k * PX * (Math.cos(e) * v.z + Math.sin(e) * v.y)));
  let s = skRing(pts);
  s += `<line class="fg-dash" x1="${pts[1].x.toFixed(2)}" y1="${pts[1].y.toFixed(2)}" x2="${pts[3].x.toFixed(2)}" y2="${pts[3].y.toFixed(2)}"></line>`;
  for (const p of pts) s += atom(p.x, p.y, 'C', { r: 12 });
  return s;
}

/* Cyclopentane as an envelope: four carbons in a plane, the fifth lifted. */
function panelEnvelope(cx, cy, k = 1) {
  const R = 1.276;
  const C = [0, 1, 2, 3, 4].map((j) => ({
    x: R * Math.cos((2 * Math.PI * j) / 5),
    y: R * Math.sin((2 * Math.PI * j) / 5),
    z: j === 0 ? 0.62 : 0,
  }));
  const pts = C.map(view(cx, cy, k));
  let s = skRing(pts, [[1, 2], [2, 3], [3, 4]]);
  s += `<line class="fg-dash-hi" x1="${pts[1].x.toFixed(2)}" y1="${pts[1].y.toFixed(2)}" x2="${pts[4].x.toFixed(2)}" y2="${pts[4].y.toFixed(2)}"></line>`;
  for (const [i, p] of pts.entries()) s += atom(p.x, p.y, 'C', { r: 12, kind: i === 0 ? 'warn' : 'plain' });
  return s;
}

/* A flat hexagon with its 120° marked. */
function panelHexagon(cx, cy, r = 52) {
  const pts = polyPts(cx, cy, 6, r, 90);
  let s = polyRing(pts);
  for (const p of pts) s += atom(p.x, p.y, 'C', { r: 12 });
  const v = pts[4];
  let d1 = Math.atan2(-(pts[3].y - v.y), pts[3].x - v.x) * 180 / Math.PI;
  let d2 = Math.atan2(-(pts[5].y - v.y), pts[5].x - v.x) * 180 / Math.PI;
  if (((d2 - d1 + 360) % 360) > 180) [d1, d2] = [d2, d1];
  s += arc(v, d1, d1 + ((d2 - d1 + 360) % 360), 22, 'fg-bond-hi');
  return { s, pts };
}

/* The chair with one bond picked out to sight down. */
function panelChairBond(cx, cy, k) {
  const pts = chair(cx, cy, k);
  let s = '';
  s += pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls: i === 0 ? 'fg-bond-hi' : 'fg-bond' })).join('');
  for (const p of pts) s += atom(p.x, p.y, '', { kind: 'point' });
  return { s, pts };
}

/* The chair's Newman: front {ring C, H, H}, back {ring C, H, H}, all
   staggered, with the two ring carbons 60° apart. */
function panelChairNewman(cx, cy) {
  let s = newman(cx, cy, 26, [[0, 'H'], [120, 'H'], [240, 'C']], [[60, 'H'], [180, 'H'], [300, 'C']]);
  return s;
}

/* Chair and boat side by side (or stacked), each with the hydrogens that
   matter: the two end hydrogens that point away from the ring. */
function shapeWithH(C, cx, cy, k, opts = {}) {
  const v = view(cx, cy, k);
  const pts = C.map(v);
  let s = skRing(pts, opts.hi || [], opts.hiCls || 'fg-bond-hi');
  for (const p of pts) s += atom(p.x, p.y, '', { kind: 'point' });
  for (const j of opts.hEnds || []) {
    const [hIn] = ringH(C, j, opts.hLen || 1.09);
    const hp = v(hIn);
    s += bond(pts[j], hp, { rFrom: 0, rTo: 11, cls: opts.hCls || 'fg-bond' });
    s += atom(hp.x, hp.y, 'H', { r: 11, kind: opts.hKind || 'plain' });
  }
  return { s, pts, v };
}
const CHAIR3 = () => ring6(0.63, 0, 0);
const BOAT3 = () => ring6(0.70, 90, 0);           // ends C0 and C3 both raised
const TWIST3 = (phi = 30) => ring6(0.70, 90, phi);
const HALF3 = () => ring6(0.62, 50.8, 30);        // C2–C5 in one plane, C0 up, C1 down

const FIGURES = [];

/* ---------------------------------------------------------------- strain ---
   The three kinds of strain, each on the molecule that shows it most simply. */
FIGURES.push({
  id: 'three-strains',
  section: 'cyclohexanes',
  alt: 'Three panels. Angle strain: a cyclopropane triangle with its 60 degree angle marked against a dashed line at the 109.5 degrees an sp3 carbon prefers. Torsional strain: a Newman projection down one C–C bond of cyclopropane, each front hydrogen sitting directly in front of a back hydrogen, with the third ring carbon straight below. Steric strain: gauche butane in a Newman projection, staggered, with the electron clouds around the two methyl groups overlapping.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(127, 30, 'ANGLE STRAIN') + tag(380, 30, 'TORSIONAL STRAIN') + tag(633, 30, 'STERIC STRAIN');
    s += text(127, 48, 'cyclopropane', { cls: 'fg-sm' }) + text(380, 48, 'cyclopropane, down one C–C bond', { cls: 'fg-sm' }) + text(633, 48, 'gauche butane', { cls: 'fg-sm' });
    s += panelAngle(127, 170);
    s += panelTorsion(380, 150);
    s += panelSteric(633, 150);
    s += rule(253, 24, 253, 276) + rule(507, 24, 507, 276);
    return s;
  },
  caption: 'One molecule per kind of strain. In each panel the highlighted feature is the one that costs energy: the squeezed angle, the pairs of eclipsed hydrogens, and the overlapping clouds of two methyl groups.',
});
FIGURES.push({
  id: 'l-three-strains',
  lessons: ['cyclohexanes'],
  alt: 'Three stacked panels. Angle strain: cyclopropane with its 60 degree angle marked against the 109.5 degrees an sp3 carbon prefers. Torsional strain: a Newman projection down a C–C bond of cyclopropane, with each front hydrogen directly in front of a back hydrogen. Steric strain: gauche butane, staggered, with the two methyl groups crowding each other.',
  viewBox: '0 0 340 650',
  build() {
    let s = '';
    s += tag(170, 24, 'ANGLE STRAIN: cyclopropane');
    s += panelAngle(160, 116);
    s += rule(20, 206, 320, 206);
    s += tag(170, 230, 'TORSIONAL STRAIN: down a C–C bond');
    s += panelTorsion(170, 320);
    s += rule(20, 424, 320, 424);
    s += tag(170, 448, 'STERIC STRAIN: gauche butane');
    s += panelSteric(170, 550);
    return s;
  },
  caption: 'The squeezed angle, the eclipsed hydrogens, and the crowded methyl groups are each highlighted.',
});

/* ------------------------------------------------------------ small rings ---
   Bent bonds, a folded square and an envelope. */
FIGURES.push({
  id: 'small-ring-shapes',
  section: 'cyclohexanes',
  alt: 'Three small rings. Cyclopropane: three carbons in a flat triangle; dashed straight lines join the nuclei and the highlighted bonds bow outward beyond them. Cyclobutane: four carbons folded along a diagonal so the ring is not flat. Cyclopentane: an envelope, four carbons in one plane joined by highlighted bonds and a fifth carbon lifted above them.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(127, 30, 'CYCLOPROPANE') + tag(380, 30, 'CYCLOBUTANE') + tag(633, 30, 'CYCLOPENTANE');
    s += panelBent(127, 138);
    s += text(127, 226, 'bonds bow outward:', { cls: 'fg-tag' });
    s += text(127, 244, '"bent" bonds', { cls: 'fg-tag' });
    s += text(127, 264, 'dashed: the straight C–C line', { cls: 'fg-sm' });
    s += panelCyclobutane(380, 128, 1.1);
    s += text(380, 226, 'folded, not flat', { cls: 'fg-tag' });
    s += text(380, 244, 'left and right carbons tip up', { cls: 'fg-sm' });
    s += text(380, 262, 'along the dashed fold line;', { cls: 'fg-sm' });
    s += text(380, 280, 'angles about 88°', { cls: 'fg-sm' });
    s += panelEnvelope(618, 150, 1.15);
    s += text(633, 226, 'an envelope', { cls: 'fg-tag' });
    s += text(633, 244, 'four carbons in one plane,', { cls: 'fg-sm' });
    s += text(633, 262, 'the fifth (red) lifted', { cls: 'fg-sm' });
    s += text(633, 280, 'angles about 104°', { cls: 'fg-sm' });
    s += rule(253, 24, 253, 276) + rule(507, 24, 507, 276);
    return s;
  },
  caption: 'Cyclopropane has to stay flat, so its bonds bend instead. Cyclobutane and cyclopentane fold out of the flat shape to relieve eclipsing, and pay a few degrees of angle for it.',
});

/* --------------------------------------------------------- transannular ---
   Hydrogens from opposite sides of a medium ring reaching into one space. */
FIGURES.push({
  id: 'transannular',
  section: 'cyclohexanes',
  alt: 'An eight-carbon ring seen from above. One hydrogen on a carbon at the top and one on the carbon opposite it at the bottom both point into the middle of the ring, and the electron clouds around them overlap there.',
  viewBox: '0 0 460 270',
  build() {
    let s = '';
    const cx = 170, cy = 140;
    const pts = polyPts(cx, cy, 8, 92, 90);
    s += polyRing(pts);
    for (const p of pts) s += atom(p.x, p.y, '', { kind: 'point' });
    const top = pts[0], bot = pts[4];
    const h1 = P(cx, top.y + 44), h2 = P(cx, bot.y - 44);
    s += lobeE(h1.x, h1.y, 20, 18, 'fg-orb') + lobeE(h2.x, h2.y, 20, 18, 'fg-orb-alt');
    s += bond(top, h1, { rFrom: 0, rTo: 11 }) + bond(bot, h2, { rFrom: 0, rTo: 11 });
    s += atom(h1.x, h1.y, 'H', { r: 11 }) + atom(h2.x, h2.y, 'H', { r: 11 });
    s += text(290, 120, 'two hydrogens from', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(290, 138, 'opposite sides of the', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(290, 156, 'ring crowd the middle', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(cx, 262, 'cyclooctane, seen from above', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Transannular strain in an eight-carbon ring. The ring is drawn from above to show where the two hydrogens point; its real shape is puckered.',
});

/* The four rings of the lesson's "most strained" question, each drawn in
   its real shape with its C–C–C angle. */
FIGURES.push({
  id: 'l-four-rings',
  lessons: ['cyclohexanes'],
  alt: 'Four rings in a two-by-two grid. Cyclopropane: a flat triangle, angles 60 degrees. Cyclobutane: four carbons folded along a diagonal, angles about 88 degrees. Cyclopentane: an envelope with one carbon lifted, angles about 104 degrees. Cyclohexane: a chair, angles about 111 degrees.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    // cyclopropane
    const T = [P(85, 58), P(52, 116), P(118, 116)];
    for (let i = 0; i < 3; i++) s += bond(T[i], T[(i + 1) % 3], { rFrom: 0, rTo: 0 });
    for (const v of T) s += atom(v.x, v.y, 'C', { r: 11 });
    s += tag(85, 24, 'cyclopropane') + text(85, 146, 'flat, 60°', { cls: 'fg-tag-mut' });
    // cyclobutane
    s += panelCyclobutane(255, 78, 0.72);
    s += tag(255, 24, 'cyclobutane') + text(255, 146, 'folded, about 88°', { cls: 'fg-tag-mut' });
    s += rule(20, 166, 320, 166) + rule(170, 14, 170, 316);
    // cyclopentane
    s += panelEnvelope(80, 244, 0.7);
    s += tag(85, 190, 'cyclopentane') + text(85, 312, 'envelope, about 104°', { cls: 'fg-tag-mut' });
    // cyclohexane
    const ch = chair(255, 248, 0.58);
    s += chairRing(ch);
    for (const p of ch) s += atom(p.x, p.y, '', { kind: 'point' });
    s += tag(255, 190, 'cyclohexane') + text(255, 312, 'chair, about 111°', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Each ring in the shape it actually takes, with its C–C–C angle.',
});

/* ------------------------------------------------------------ flat ring ---
   What a flat hexagon would cost: 120° angles, and every bond eclipsed. */
FIGURES.push({
  id: 'flat-hexagon',
  section: 'cyclohexanes',
  alt: 'Left: a flat hexagon of six carbons with one 120 degree angle marked. Right: a Newman projection down one of its C–C bonds, in which the front carbon’s ring carbon and two hydrogens each sit directly in front of the matching groups on the back carbon.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += tag(200, 30, 'CYCLOHEXANE FORCED FLAT');
    const { s: hs, pts } = panelHexagon(200, 132, 62);
    s += hs;
    const mid = P(pts[4].x + (200 - pts[4].x) * 0.68, pts[4].y + (132 - pts[4].y) * 0.68);
    s += text(mid.x, mid.y + 4, '120°', { cls: 'fg-tag' });
    s += text(200, 226, 'angles 120°, not 109.5°', { cls: 'fg-tag' });
    s += arrow(P(318, 132), P(420, 132));
    s += text(369, 120, 'sight down', { cls: 'fg-sm' });
    s += text(369, 150, 'any ring bond', { cls: 'fg-sm' });
    s += tag(565, 30, 'EVERY BOND ECLIPSED');
    s += newman(565, 126, 26, [[270, 'C'], [30, 'H'], [150, 'H']], [[290, 'C'], [50, 'H'], [170, 'H']]);
    s += text(565, 226, 'each group sits in front of one on the back carbon', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Flat cyclohexane loses on both counts. Every angle is 10.5° too wide, and sighting down any of the six ring bonds shows the same fully eclipsed view (drawn a few degrees apart so the back groups show).',
});

/* ------------------------------------------------------------ the chair ---
   The chair's two targets: 111° angles and a staggered Newman at every bond. */
FIGURES.push({
  id: 'chair-two-targets',
  section: 'cyclohexanes',
  alt: 'Left: a cyclohexane chair with one C–C bond highlighted and its front and back carbons labeled. Right: the Newman projection down that bond. The front carbon carries a ring carbon and two hydrogens, the back carbon the same, and every group on the front sits between two groups on the back. The two ring carbons are 60 degrees apart.',
  viewBox: '0 0 760 270',
  build() {
    let s = '';
    s += tag(185, 30, 'THE CHAIR');
    const { s: cs, pts } = panelChairBond(185, 140, 1.0);
    s += cs;
    s += text(pts[0].x + 14, pts[0].y + 5, 'front C', { cls: 'fg-tag', anchor: 'start' });
    s += text(pts[1].x - 6, pts[1].y - 14, 'back C', { cls: 'fg-tag', anchor: 'middle' });
    s += text(185, 226, 'every C–C–C angle about 111°', { cls: 'fg-tag' });
    s += arrow(P(392, 140), P(470, 140));
    s += text(431, 128, 'sight down', { cls: 'fg-sm' });
    s += text(431, 158, 'the bond', { cls: 'fg-sm' });
    s += tag(578, 30, 'WHAT YOU SEE');
    s += panelChairNewman(578, 130);
    s += text(578, 226, 'all staggered; the ring carbons 60° apart', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The same view appears at all six ring bonds. The two ring carbons in the Newman sit 60° apart, like the methyls of gauche butane, and nothing is eclipsed.',
});
FIGURES.push({
  id: 'l-chair-targets',
  lessons: ['cyclohexanes'],
  alt: 'Top: a cyclohexane chair with one C–C bond highlighted, front and back carbons labeled. Bottom: the Newman projection down that bond, fully staggered, with the two ring carbons 60 degrees apart.',
  viewBox: '0 0 340 440',
  build() {
    let s = '';
    s += tag(170, 24, 'THE CHAIR');
    const { s: cs, pts } = panelChairBond(158, 110, 0.95);
    s += cs;
    s += text(pts[0].x + 10, pts[0].y + 5, 'front C', { cls: 'fg-tag', anchor: 'start' });
    s += text(pts[1].x - 8, pts[1].y - 13, 'back C', { cls: 'fg-tag' });
    s += text(170, 190, 'every angle about 111°', { cls: 'fg-tag' });
    s += arrow(P(170, 204), P(170, 240));
    s += text(182, 226, 'sight down the bond', { cls: 'fg-tag-mut', anchor: 'start' });
    s += panelChairNewman(170, 320);
    s += text(170, 424, 'all staggered, nothing eclipsed', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Near-ideal angles and a staggered view down every ring bond.',
});

/* ------------------------------------------------------------ draw one ---
   Drawing a chair. */
FIGURES.push({
  id: 'draw-a-chair',
  section: 'cyclohexanes',
  alt: 'Four steps building a cyclohexane chair from three pairs of parallel lines, with the finished ring showing its raised and lowered ends',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const bases = [30, 215, 400, 585];
    const labels = [
      ['1 — two parallel lines,', 'offset from each other'],
      ['2 — a second pair,', 'parallel to each other'],
      ['3 — a third pair closes it', '— three pairs in all'],
      ['4 — check the two ends:', 'one up, one down'],
    ];
    bases.forEach((ox, n) => {
      const pts = chair(ox + 66, 160, 0.58);
      const pairs = [[1, 2], [4, 5]];   // drawn first: the long pair
      const drawn = [];
      if (n >= 0) drawn.push([1, 2], [4, 5]);
      if (n >= 1) drawn.push([0, 1], [3, 4]);
      if (n >= 2) drawn.push([2, 3], [5, 0]);
      for (const [i, j] of drawn) {
        const hot = (n === 0 && pairs.some(([a, b]) => a === i && b === j)) ||
                    (n === 1 && (i === 0 || i === 3)) ||
                    (n === 2 && (i === 2 || i === 5));
        s += bond(pts[i], pts[j], { rFrom: 0, rTo: 0, cls: hot ? 'fg-bond-hi' : 'fg-bond' });
      }
      if (n === 3) {
        for (const p of pts) s += atom(p.x, p.y, '', { kind: 'point' });
        // The two ends are the far-right and far-left carbons, three bonds apart.
        s += bond(pts[0], P(pts[0].x, pts[0].y - 22), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
        s += text(pts[0].x, pts[0].y - 30, 'up end', { cls: 'fg-tag-good' });
        s += bond(pts[3], P(pts[3].x, pts[3].y + 22), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
        s += text(pts[3].x, pts[3].y + 36, 'down end', { cls: 'fg-tag-good' });
      }
      s += text(ox + 66, 246, labels[n][0], { cls: 'fg-tag' });
      s += text(ox + 66, 262, labels[n][1], { cls: 'fg-sm' });
    });
    s += tag(380, 36, 'A CHAIR IS THREE PAIRS OF PARALLEL LINES');
    for (const x of [200, 385, 570]) s += rule(x, 62, x, 226);
    return s;
  },
  caption: 'Each step adds <b>two lines that are parallel to each other</b>. After the third pair the ring is closed. In the finished chair, one end carbon points up and the other points down, and the four carbons between them lie in one plane.',
  note: 'If both ends point the same way, you have drawn a boat. If no end sticks out, you have drawn a flat hexagon.',
});

/* ------------------------------------------------------ chair and boat ---
   The boat's two costs, set against the chair. The ends are C0 (right) and
   C3 (left); in the chair C0 is up and C3 down, in the boat both are up. */
function chairBoatPanels(cxC, cyC, cxB, cyB, k) {
  const ch = shapeWithH(CHAIR3(), cxC, cyC, k, { hEnds: [0, 3], hLen: 0.8 });
  const bt = shapeWithH(BOAT3(), cxB, cyB, k, { hEnds: [0, 3], hLen: 0.95, hi: [[1, 2], [4, 5]], hKind: 'warn' });
  let s = ch.s + bt.s;
  // the flagpole clash: a dashed line between the two inward hydrogens
  const a = bt.v(ringH(BOAT3(), 0, 0.95)[0]), b = bt.v(ringH(BOAT3(), 3, 0.95)[0]);
  const L = Math.hypot(b.x - a.x, b.y - a.y), ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
  s += `<line class="fg-dash" x1="${(a.x + ux * 13).toFixed(2)}" y1="${(a.y + uy * 13).toFixed(2)}" x2="${(b.x - ux * 13).toFixed(2)}" y2="${(b.y - uy * 13).toFixed(2)}"></line>`;
  s += text((a.x + b.x) / 2, Math.min(a.y, b.y) - 12, 'flagpole H’s clash', { cls: 'fg-tag-warn' });
  return { s, ch, bt };
}
FIGURES.push({
  id: 'chair-and-boat',
  section: 'cyclohexanes',
  alt: 'Left: a chair whose right end carbon points up and whose left end carbon points down, each with its hydrogen pointing away from the ring. Right: a boat, with both end carbons raised. Their two flagpole hydrogens lean in toward each other, and the two long side bonds are highlighted as eclipsed.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const { s: ps, ch, bt } = chairBoatPanels(190, 160, 570, 180, 1.0);
    s += ps;
    s += tag(190, 30, 'CHAIR — 0 kcal/mol', { cls: 'fg-tag-good' });
    s += text(ch.pts[0].x + 16, ch.pts[0].y + 4, 'up end', { cls: 'fg-tag', anchor: 'start' });
    s += text(ch.pts[3].x - 16, ch.pts[3].y + 4, 'down end', { cls: 'fg-tag', anchor: 'end' });
    s += tag(570, 30, 'BOAT — about 6.5 kcal/mol higher', { cls: 'fg-tag-warn' });
    const mid = (i, j) => P((bt.pts[i].x + bt.pts[j].x) / 2, (bt.pts[i].y + bt.pts[j].y) / 2);
    const e1 = mid(4, 5), e2 = mid(1, 2);
    s += text(e1.x, e1.y + 24, 'eclipsed', { cls: 'fg-tag' });
    s += text(e2.x, e2.y - 12, 'eclipsed', { cls: 'fg-tag' });
    s += text(570, 284, 'both ends up', { cls: 'fg-tag-warn' });
    s += rule(380, 24, 380, 286);
    return s;
  },
  caption: 'Push the chair’s down end up and the ring becomes a boat. Its two <b>flagpole</b> hydrogens now point at each other, and the two highlighted side bonds are eclipsed.',
});
FIGURES.push({
  id: 'l-chair-and-boat',
  lessons: ['cyclohexanes'],
  alt: 'Top: a chair, right end up and left end down. Bottom: a boat, both ends raised, with two flagpole hydrogens leaning toward each other and the two long side bonds highlighted as eclipsed.',
  viewBox: '0 0 340 500',
  build() {
    let s = '';
    const { s: ps, ch } = chairBoatPanels(170, 120, 170, 390, 0.95);
    s += ps;
    s += tag(170, 24, 'CHAIR — 0 kcal/mol', { cls: 'fg-tag-good' });
    s += text(ch.pts[0].x + 10, ch.pts[0].y + 4, 'up end', { cls: 'fg-tag', anchor: 'start' });
    s += text(ch.pts[3].x + 16, ch.pts[3].y + 52, 'down end', { cls: 'fg-tag', anchor: 'start' });
    s += rule(20, 228, 320, 228);
    s += tag(170, 252, 'BOAT — about 6.5 higher', { cls: 'fg-tag-warn' });
    s += text(170, 484, 'the long side bonds are eclipsed', { cls: 'fg-tag' });
    return s;
  },
  caption: 'The boat pays twice: the flagpole clash and two eclipsed bonds.',
});

/* ------------------------------------------------------ the other shapes ---
   An energy profile through the other shapes, each drawn at its point. */
FIGURES.push({
  id: 'conformer-energies',
  section: 'cyclohexanes',
  alt: 'An energy curve. It starts low at the chair (0), climbs to a peak at the half-chair (about 10.8 kcal/mol, four carbons in one plane), falls into a shallow dip at the twist-boat (about 5.5), rises over a small peak at the boat (about 6.5) and falls into a second twist-boat dip. A small drawing of each shape sits beside its point on the curve.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    const base = 330, per = 18;
    const X = { chair: 110, half: 250, tb1: 400, boat: 540, tb2: 680 };
    const Y = (e) => base - e * per;
    s += frame(40, base, 60, 740);
    s += text(48, 60, 'energy above the chair (kcal/mol)', { cls: 'fg-sm', anchor: 'start' });
    const nodes = [P(X.chair, Y(0)), P(X.half, Y(10.8)), P(X.tb1, Y(5.5)), P(X.boat, Y(6.5)), P(X.tb2, Y(5.5))];
    let d = `M${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) {
      const a = nodes[i - 1], b = nodes[i], h = (b.x - a.x) * 0.5;
      d += ` C${a.x + h} ${a.y} ${b.x - h} ${b.y} ${b.x} ${b.y}`;
    }
    s += `<path class="fg-bond-hi" d="${d}"></path>`;
    for (const n of nodes) s += `<circle class="fg-fill-hi" cx="${n.x}" cy="${n.y}" r="4"></circle>`;
    const k = 0.42;
    // chair, above its point
    s += shapeWithH(CHAIR3(), X.chair, Y(0) - 58, k).s;
    s += text(X.chair, base + 24, 'chair · 0', { cls: 'fg-tag-good' });
    s += text(X.chair, base + 40, 'the resting shape', { cls: 'fg-sm' });
    // half-chair, above the peak; its four coplanar carbons highlighted
    const HC = HALF3();
    s += shapeWithH(HC, X.half, Y(10.8) - 46, k, { hi: [[2, 3], [3, 4], [4, 5]] }).s;
    s += text(X.half, Y(10.8) - 88, 'half-chair · 10.8', { cls: 'fg-tag-warn' });
    s += text(X.half + 70, Y(10.8) + 20, 'peak', { cls: 'fg-sm', anchor: 'start' });
    // twist-boats below their dips
    s += shapeWithH(TWIST3(), X.tb1, Y(5.5) + 50, k).s;
    s += text(X.tb1, Y(5.5) + 92, 'twist-boat · 5.5', { cls: 'fg-tag' });
    s += text(X.tb1, Y(5.5) + 108, 'dip', { cls: 'fg-sm' });
    s += shapeWithH(TWIST3(-30), X.tb2, Y(5.5) + 50, k).s;
    s += text(X.tb2, Y(5.5) + 92, 'twist-boat · 5.5', { cls: 'fg-tag' });
    s += text(X.tb2, Y(5.5) + 108, 'dip', { cls: 'fg-sm' });
    // boat above its small peak
    s += shapeWithH(BOAT3(), X.boat, Y(6.5) - 44, k, { hi: [[1, 2], [4, 5]] }).s;
    s += text(X.boat, Y(6.5) - 82, 'boat · 6.5', { cls: 'fg-tag-warn' });
    s += text(X.boat, Y(6.5) + 20, 'peak', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Energies are in kcal/mol above the chair. A <b>peak</b> is a shape the ring only passes through; a <b>dip</b> is one it can sit in briefly. In the half-chair, the four carbons joined by highlighted bonds lie in one plane.',
});

export default FIGURES;
