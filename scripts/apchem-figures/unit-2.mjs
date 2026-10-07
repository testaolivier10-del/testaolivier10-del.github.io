/* Unit 2 figures for the AP® Chemistry course (our own SVGs, LevlPrep original).

     node scripts/apchem-figures/unit-2.mjs     writes chem/figures/<id>.svg

   Each figure is registered in chem/data/figures/<topic>.json. The exported
   helpers (pe curve points, small Lewis drawings) are also used to author the
   inline SVGs in the Unit 2 question stimuli, so a figure and a stimulus that
   show the same thing are drawn the same way. */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, P, At, svg, text, line, rect, circle, arrow, ball, latom, lbond, lhybrid, lps, fc, brackets, wedge, hash, lobe } from './draw.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'chem', 'figures');

/* A Morse-type curve: potential energy (kJ/mol) against distance (pm). It is
   a model with the right shape, used for drawings only; every number a
   question asks about is read from its labelled minimum. */
export const morse = (r, De, re, a) => De * ((1 - Math.exp(-a * (r - re))) ** 2 - 1);

/* ---------------------------------------------------------------- 2.1 */
function bondTypes() {
  const W = 760, H = 330;
  let b = '';
  // Electronegativity-difference arrow.
  b += arrow(40, 46, 720, 46, { w: 3 });
  b += text(40, 28, 'Electronegativity difference between the two atoms', { anchor: 'start', size: 15, weight: 700 });
  b += text(40, 70, 'small (0)', { anchor: 'start', size: 13, fill: C.muted });
  b += text(712, 70, 'large', { anchor: 'end', size: 13, fill: C.muted });
  // Panel 1: nonpolar covalent H-H (equal sharing).
  const panel = (x, title, sub) => rect(x, 88, 210, 222, { fill: C.panel }) + text(x + 105, 114, title, { size: 15, weight: 700 }) + text(x + 105, 292, sub, { size: 12.5, fill: C.muted });
  b += panel(30, 'Nonpolar covalent', 'Cl₂: electrons shared equally');
  b += `<ellipse cx="135" cy="200" rx="78" ry="44" fill="${C.tint}" stroke="${C.cobalt}" stroke-width="1.4"/>`;
  b += ball(100, 200, 24, '#FFFFFF', 'Cl', { size: 15 }) + ball(170, 200, 24, '#FFFFFF', 'Cl', { size: 15 });
  b += circle(131, 194, 3, { fill: C.cobalt, stroke: 'none' }) + circle(139, 206, 3, { fill: C.cobalt, stroke: 'none' });
  // Panel 2: polar covalent H-Cl.
  b += panel(275, 'Polar covalent', 'HCl: shared, pulled toward Cl');
  b += `<ellipse cx="398" cy="200" rx="84" ry="48" fill="${C.tint}" stroke="${C.cobalt}" stroke-width="1.4"/>`;
  b += ball(330, 200, 16, '#FFFFFF', 'H', { size: 14 }) + ball(410, 200, 26, '#FFFFFF', 'Cl', { size: 15 });
  b += circle(370, 196, 3, { fill: C.cobalt, stroke: 'none' }) + circle(377, 205, 3, { fill: C.cobalt, stroke: 'none' });
  b += text(318, 162, 'δ+', { size: 16, weight: 700, fill: C.coral }) + text(440, 158, 'δ−', { size: 16, weight: 700, fill: C.cobalt });
  b += arrow(342, 250, 432, 250, { stroke: C.ink, w: 2 }) + line(352, 244, 352, 256, { w: 2 });
  // Panel 3: ionic Na+ Cl-.
  b += panel(520, 'Ionic', 'NaCl: electron transferred');
  b += ball(585, 200, 20, C.cation, 'Na⁺', { size: 13 }) + ball(670, 200, 30, C.anion, 'Cl⁻', { size: 15 });
  b += arrow(612, 186, 642, 186, { stroke: C.coral, w: 2 });
  b += text(585, 250, 'cation', { size: 12.5, fill: C.muted }) + text(670, 250, 'anion', { size: 12.5, fill: C.muted });
  return { w: W, h: H, title: 'Bond type depends on the electronegativity difference',
    body: b };
}

function metallicBond() {
  const W = 360, H = 250;
  let b = rect(20, 20, 320, 210, { fill: '#FFFFFF' });
  const pts = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) pts.push([62 + c * 48, 52 + r * 48]);
  // Sea of electrons first, so the cations sit on top.
  const rnd = s => { const x = Math.sin(s * 12.9898) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 46; i++) b += circle(34 + rnd(i + 1) * 292, 32 + rnd(i + 101) * 186, 3.2, { fill: C.cobalt, stroke: 'none' });
  for (const [x, y] of pts) b += ball(x, y, 15, C.metal, '+', { size: 16 });
  b += text(180, 246, 'Metal cations in a sea of delocalized valence electrons', { size: 12.5, fill: C.muted });
  return { w: W, h: H + 8, title: 'Metallic bonding', body: b };
}

/* ---------------------------------------------------------------- 2.2 */
function peCurve() {
  const W = 700, H = 420, L = 90, T = 30, pw = 560, ph = 320;
  const r0 = 30, r1 = 300, E0 = -500, E1 = 400;
  const sx = r => L + (r - r0) / (r1 - r0) * pw, sy = E => T + (E1 - E) / (E1 - E0) * ph;
  let b = '';
  b += line(L, T, L, T + ph, { w: 1.6 }) + line(L, sy(0), L + pw, sy(0), { w: 1.4, stroke: C.line });
  b += line(L, T + ph, L + pw, T + ph, { w: 1.6 });
  for (const E of [-400, -200, 0, 200, 400]) b += text(L - 8, sy(E) + 5, String(E), { size: 12.5, anchor: 'end' }) + line(L - 4, sy(E), L, sy(E), { w: 1.4 });
  for (const r of [50, 100, 150, 200, 250, 300]) b += text(sx(r), T + ph + 20, String(r), { size: 12.5 }) + line(sx(r), T + ph, sx(r), T + ph + 4, { w: 1.4 });
  b += text(L + pw / 2, T + ph + 46, 'Distance between the two nuclei (pm)', { size: 14, weight: 700 });
  b += `<text x="26" y="${T + ph / 2}" font-size="14" font-weight="700" text-anchor="middle" transform="rotate(-90 26 ${T + ph / 2})">Potential energy (kJ/mol)</text>`;
  const pts = [];
  for (let r = 44; r <= r1; r += 2) { const E = morse(r, 436, 74, 0.0194); if (E <= E1) pts.push(`${sx(r).toFixed(1)},${sy(E).toFixed(1)}`); }
  b += `<polyline points="${pts.join(' ')}" fill="none" stroke="${C.cobalt}" stroke-width="3"/>`;
  // Minimum: bond length and bond energy.
  b += line(sx(74), sy(-436), sx(74), T + ph, { dash: '5 4', stroke: C.muted, w: 1.5 });
  b += circle(sx(74), sy(-436), 4.5, { fill: C.coral, stroke: 'none' });
  b += arrow(sx(118), sy(0), sx(118), sy(-436), { both: true, stroke: C.coral, w: 2 });
  b += line(sx(74), sy(-436), sx(126), sy(-436), { dash: '3 3', stroke: C.coral, w: 1.4 });
  b += text(sx(126), sy(-395), 'bond energy: 436 kJ/mol', { anchor: 'start', size: 13.5, weight: 700, fill: C.coral });
  b += text(sx(74) + 6, T + ph - 10, 'bond length: 74 pm', { anchor: 'start', size: 13.5, weight: 700, fill: C.coral });
  // Regions.
  b += text(sx(40), sy(330), 'nuclei repel', { anchor: 'start', size: 13 }) + text(sx(40), sy(285), '(energy rises)', { anchor: 'start', size: 12, fill: C.muted });
  b += text(sx(165), sy(-250), 'attraction lowers the energy', { anchor: 'start', size: 13 });
  b += text(sx(210), sy(40), 'atoms far apart: energy ≈ 0', { anchor: 'start', size: 13 });
  // Little atom pictures.
  const pair = (x, y, gap) => ball(x - gap / 2, y, 9, '#FFFFFF', 'H', { size: 10 }) + ball(x + gap / 2, y, 9, '#FFFFFF', 'H', { size: 10 });
  b += pair(sx(270), sy(110), 60) + pair(sx(74), sy(-330), 18);
  return { w: W, h: H + 20, title: 'Potential energy curve for two hydrogen atoms', body: b };
}

function bondOrders() {
  const W = 620, H = 220;
  let b = '';
  const rows = [['C–C', 1, 154, 347], ['C=C', 2, 134, 614], ['C≡C', 3, 120, 839]];
  b += text(40, 30, 'Bond', { anchor: 'start', size: 14, weight: 700 }) + text(240, 30, 'Length (pm)', { size: 14, weight: 700 }) + text(470, 30, 'Energy (kJ/mol)', { size: 14, weight: 700 });
  rows.forEach(([name, order, len, en], i) => {
    const y = 72 + i * 56, a = P(70, y), bb = P(70 + len * 0.62, y);
    b += text(a.x, y + 6.5, 'C', { size: 18, weight: 700 }) + text(bb.x, y + 6.5, 'C', { size: 18, weight: 700 });
    b += lbond(a, bb, order, { trimA: 12, trimB: 12 });
    b += text(240, y + 5, String(len), { size: 15 });
    b += rect(340, y - 10, en * 0.26, 20, { fill: C.tint, stroke: C.cobalt, r: 3 }) + text(350 + en * 0.26, y + 5, String(en), { anchor: 'start', size: 14 });
  });
  b += text(310, 236, 'More shared pairs between the same two atoms: shorter and stronger', { size: 12.5, fill: C.muted });
  return { w: W, h: H + 34, title: 'Single, double and triple carbon-carbon bonds', body: b };
}

/* ---------------------------------------------------------------- 2.3 */
function ionicLattice() {
  const W = 740, H = 300;
  let b = '';
  const grid = (x0, y0, shift) => {
    let g = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      const top = r < 2, dx = (!top && shift) ? 44 : 0;
      const plus = (r + c) % 2 === 0;
      g += ball(x0 + c * 44 + dx, y0 + r * 44, plus ? 14 : 19, plus ? C.cation : C.anion, plus ? '+' : '−', { size: 16 });
    }
    return g;
  };
  b += text(150, 28, 'A layer of an ionic solid', { size: 15, weight: 700 });
  b += grid(62, 70, false);
  b += text(150, 276, 'each ion is surrounded by ions of opposite charge', { size: 12.5, fill: C.muted });
  b += arrow(330, 135, 390, 135, { w: 2.5 });
  b += text(360, 120, 'a force', { size: 12.5 }) + text(360, 158, 'shifts a layer', { size: 12.5 });
  b += text(560, 28, 'After the shift', { size: 15, weight: 700 });
  b += grid(452, 70, true);
  b += line(440, 136, 680, 136, { dash: '6 5', stroke: C.coral, w: 1.6 });
  for (let c = 1; c < 5; c++) b += arrow(452 + c * 44, 136, 452 + c * 44, 128, { stroke: C.coral, w: 1.6, size: 6 }) + arrow(452 + c * 44, 136, 452 + c * 44, 144, { stroke: C.coral, w: 1.6, size: 6 });
  b += text(560, 276, 'like charges line up and repel: the crystal splits', { size: 12.5, fill: C.coral });
  return { w: W, h: H, title: 'Why ionic solids are brittle', body: b };
}

/* ---------------------------------------------------------------- 2.4 */
function alloys() {
  const W = 780, H = 300;
  let b = '';
  const frame = (x, title, sub) => rect(x, 46, 230, 210, { fill: '#FFFFFF' }) + text(x + 115, 32, title, { size: 15, weight: 700 }) + text(x + 115, 280, sub, { size: 12.5, fill: C.muted });
  const lattice = (x0, y0, swap = []) => {
    let g = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      const sw = swap.some(([a, d]) => a === r && d === c);
      g += ball(x0 + c * 40, y0 + r * 40, 18, sw ? C.other : C.metal, '');
    }
    return g;
  };
  b += frame(20, 'Pure metal', 'identical atoms in layers');
  b += lattice(55, 90);
  b += frame(275, 'Substitutional alloy', 'similar-size atoms swap in');
  b += lattice(310, 90, [[0, 1], [1, 3], [2, 0], [3, 2], [2, 4]]);
  b += frame(530, 'Interstitial alloy', 'small atoms fill the gaps');
  b += lattice(565, 90);
  for (const [r, c] of [[0, 0], [0, 2], [1, 1], [1, 3], [2, 2], [2, 0], [0, 3]]) b += ball(585 + c * 40, 110 + r * 40, 7, C.small, '');
  return { w: W, h: H, title: 'A pure metal and the two kinds of alloy', body: b };
}

/* ---------------------------------------------------------------- 2.5 */
function lewisExamples() {
  const W = 760, H = 250;
  let b = '';
  const cap = (x, s, n) => text(x, 220, s, { size: 15, weight: 700 }) + text(x, 240, n, { size: 12.5, fill: C.muted });
  // H2O
  { const O = At(95, 120, 'O'), H1 = At(55, 160, 'H'), H2 = At(135, 160, 'H');
    b += latom(O) + latom(H1) + latom(H2) + lbond(O, H1) + lbond(O, H2) + lps(O, [-130, -50]); b += cap(95, 'H₂O', '8 valence electrons'); }
  // NH3
  { const N = At(275, 112, 'N'), a = At(228, 150, 'H'), c = At(322, 150, 'H'), d = At(275, 172, 'H');
    b += latom(N) + latom(a) + latom(c) + latom(d) + lbond(N, a) + lbond(N, c) + lbond(N, d) + lps(N, [-90]); b += cap(275, 'NH₃', '8 valence electrons'); }
  // CO2
  { const Cc = At(460, 120, 'C'), O1 = At(400, 120, 'O'), O2 = At(520, 120, 'O');
    b += latom(Cc) + latom(O1) + latom(O2) + lbond(O1, Cc, 2) + lbond(Cc, O2, 2) + lps(O1, [-135, 135]) + lps(O2, [-45, 45]); b += cap(460, 'CO₂', '16 valence electrons'); }
  // NH4+
  { const N = At(655, 120, 'N'), u = At(655, 72, 'H'), dn = At(655, 168, 'H'), l = At(607, 120, 'H'), r = At(703, 120, 'H');
    b += [u, dn, l, r].map(x => latom(x) + lbond(N, x)).join('') + latom(N) + brackets(585, 52, 725, 188, '+'); b += cap(655, 'NH₄⁺', '8 valence electrons'); }
  b += text(380, 26, 'Lines are bonding pairs; blue dot pairs are lone pairs', { size: 13.5, fill: C.muted });
  return { w: W, h: H + 4, title: 'Lewis diagrams of four species', body: b };
}

/* ---------------------------------------------------------------- 2.6 */
/* Nitrate: three equivalent diagrams and the hybrid. */
export function nitrateDiagram(x0, y0, dbl) {
  const N = At(x0, y0, 'N'), O = [At(x0, y0 - 52, 'O'), At(x0 - 46, y0 + 28, 'O'), At(x0 + 46, y0 + 28, 'O')];
  const ang = [-90, 150, 30];
  let g = latom(N);
  O.forEach((o, i) => {
    g += latom(o) + lbond(N, o, i === dbl ? 2 : 1);
    const a = ang[i];
    g += i === dbl ? lps(o, [a - 60, a + 60]) : lps(o, [a - 75, a, a + 75]);
    if (i !== dbl) g += fc(o, '−', i === 0 ? 24 : i === 1 ? -6 : 6, i === 0 ? 2 : 34);
  });
  g += fc(N, '+', 17, 4);
  return g;
}
function nitrate() {
  const W = 820, H = 260;
  let b = '';
  b += nitrateDiagram(110, 120, 0) + arrow(178, 120, 218, 120, { both: true }) + nitrateDiagram(290, 120, 1) + arrow(358, 120, 398, 120, { both: true }) + nitrateDiagram(470, 120, 2);
  b += brackets(28, 40, 552, 196, '−');
  b += text(290, 232, 'Three resonance structures (formal charges in red)', { size: 13, fill: C.muted });
  const N = At(700, 120, 'N'), O = [At(700, 68, 'O'), At(654, 148, 'O'), At(746, 148, 'O')];
  b += latom(N) + O.map((o, i) => latom(o) + lhybrid(N, o, { side: i === 0 ? 1 : i === 1 ? -1 : 1 })).join('');
  b += brackets(626, 40, 774, 196, '−');
  b += text(700, 222, 'The hybrid: every N–O bond', { size: 13, fill: C.muted }) + text(700, 240, 'is the same, bond order 4/3', { size: 13, fill: C.muted });
  b += text(400, 24, 'Nitrate, NO₃⁻', { size: 16, weight: 700 });
  return { w: W, h: H, title: 'Resonance in the nitrate ion', body: b };
}

/* ---------------------------------------------------------------- 2.7 */
function shapeCell(x, y, name, angle, draw) {
  return rect(x, y, 176, 184, { fill: '#FFFFFF' }) + draw(P(x + 88, y + 76)) + text(x + 88, y + 158, name, { size: 13.5, weight: 700 }) + text(x + 88, y + 175, angle, { size: 12, fill: C.muted });
}
const A = (p, s = 'A') => latom(p, { size: 18 });
const X = p => ball(p.x, p.y, 10, C.cation, '');
function at(c, deg, d) { const t = deg * Math.PI / 180; return P(c.x + Math.cos(t) * d, c.y + Math.sin(t) * d); }
function plain(c, deg, d = 48) { const p = at(c, deg, d); return lbond(c, p, 1, { trimA: 11, trimB: 10 }) + X(p); }
function wdg(c, deg, d = 46) { const p = at(c, deg, d); return wedge(c, p, { trim: 10 }) + X(p); }
function hsh(c, deg, d = 44) { const p = at(c, deg, d); return hash(c, p, { trim: 10 }) + X(p); }
function center(c) { return ball(c.x, c.y, 12, C.metal, 'A', { size: 12 }); }

function vseprTwoToFour() {
  const W = 760, H = 586;
  let b = '';
  b += text(20, 26, '2, 3 and 4 electron domains (A = central atom, blue = bonded atom, lobe = lone pair)', { anchor: 'start', size: 13.5, fill: C.muted });
  const cells = [
    ['Linear', '180°', c => plain(c, 180) + plain(c, 0) + center(c)],
    ['Trigonal planar', '120°', c => plain(c, -90) + plain(c, 30) + plain(c, 150) + center(c)],
    ['Bent (3 domains)', 'slightly less than 120°', c => lobe(c, -90) + plain(c, 30) + plain(c, 150) + center(c)],
    ['Tetrahedral', '109.5°', c => plain(c, -90) + plain(c, 160) + wdg(c, 40) + hsh(c, 15) + center(c)],
    ['Trigonal pyramidal', 'about 107° (NH₃)', c => lobe(c, -90) + plain(c, 140) + wdg(c, 50) + hsh(c, 20) + center(c)],
    ['Bent (4 domains)', 'about 104.5° (H₂O)', c => lobe(c, -120) + lobe(c, -60) + plain(c, 140) + plain(c, 40) + center(c)],
  ];
  cells.forEach(([name, ang, f], i) => { b += shapeCell(20 + (i % 3) * 250, 44 + Math.floor(i / 3) * 204, name, ang, f); });
  b += text(150, 470, 'Domains', { size: 14, weight: 700, anchor: 'start' });
  const rows = [['2 domains', 'sp', 'linear electron arrangement'], ['3 domains', 'sp²', 'trigonal planar arrangement'], ['4 domains', 'sp³', 'tetrahedral arrangement']];
  rows.forEach(([d, h, e], i) => { b += text(150, 498 + i * 26, d, { size: 13.5, anchor: 'start' }) + text(300, 498 + i * 26, h, { size: 13.5, weight: 700, anchor: 'start', fill: C.cobalt }) + text(370, 498 + i * 26, e, { size: 13.5, anchor: 'start' }); });
  b += text(300, 470, 'Hybridization', { size: 14, weight: 700, anchor: 'start' });
  return { w: W, h: H, title: 'VSEPR shapes for two, three and four electron domains', body: b };
}

function vseprFiveSix() {
  const W = 760, H = 610;
  let b = '';
  b += text(20, 26, '5 and 6 electron domains (period 3 and below; no hybridization is asked for these)', { anchor: 'start', size: 13.5, fill: C.muted });
  const tbp = (c, lone) => {
    let g = '';
    // axial up/down, equatorial at 180 (in plane), wedge 35 and hash 325 directions
    const eq = [[180, 'p'], [35, 'w'], [-35, 'h']];
    g += plain(c, -90, 50) + plain(c, 90, 50);
    eq.forEach(([d, k], i) => { if (lone.includes(i)) g += lobe(c, d); else g += k === 'p' ? plain(c, d) : k === 'w' ? wdg(c, d) : hsh(c, d); });
    return g + center(c);
  };
  const oct = (c, lone) => {
    let g = '';
    const dirs = [[-90, 'p'], [90, 'p'], [180, 'p'], [0, 'p'], [35, 'w'], [215, 'h']];
    dirs.forEach(([d, k], i) => { if (lone.includes(i)) g += lobe(c, d); else g += k === 'p' ? plain(c, d, 50) : k === 'w' ? wdg(c, d, 40) : hsh(c, d, 40); });
    return g + center(c);
  };
  const cells = [
    ['Trigonal bipyramidal', '90°, 120°, 180°', c => tbp(c, [])],
    ['Seesaw', '1 lone pair (equatorial)', c => tbp(c, [0])],
    ['T-shaped', '2 lone pairs (equatorial)', c => tbp(c, [1, 2])],
    ['Linear (5 domains)', '3 lone pairs (equatorial)', c => tbp(c, [0, 1, 2])],
    ['Octahedral', '90°, 180°', c => oct(c, [])],
    ['Square pyramidal', '1 lone pair', c => oct(c, [1])],
    ['Square planar', '2 lone pairs, opposite', c => oct(c, [0, 1])],
  ];
  cells.forEach(([name, ang, f], i) => { b += shapeCell(20 + (i % 4) * 186, 44 + Math.floor(i / 4) * 204, name, ang, f); });
  b += text(380, 486, 'Lone pairs go where they have the most room: equatorial positions', { size: 13.5 });
  b += text(380, 508, 'for 5 domains, and opposite each other for 6.', { size: 13.5 });
  b += text(380, 546, 'Examples: PCl₅ trigonal bipyramidal, SF₄ seesaw, ClF₃ T-shaped, XeF₂ linear,', { size: 13, fill: C.muted });
  b += text(380, 566, 'SF₆ octahedral, BrF₅ square pyramidal, XeF₄ square planar.', { size: 13, fill: C.muted });
  return { w: W, h: H - 30, title: 'VSEPR shapes for five and six electron domains', body: b };
}

function polarity() {
  const W = 700, H = 270;
  let b = '';
  // CO2
  const Cc = At(150, 120, 'C'), O1 = At(80, 120, 'O'), O2 = At(220, 120, 'O');
  b += latom(Cc) + latom(O1) + latom(O2) + lbond(O1, Cc, 2) + lbond(Cc, O2, 2);
  b += arrow(132, 86, 92, 86, { stroke: C.cobalt }) + line(126, 80, 126, 92, { stroke: C.cobalt }) + arrow(168, 86, 208, 86, { stroke: C.cobalt }) + line(174, 80, 174, 92, { stroke: C.cobalt });
  b += text(150, 190, 'CO₂: linear', { size: 15, weight: 700 }) + text(150, 212, 'bond dipoles point opposite ways', { size: 12.5, fill: C.muted }) + text(150, 230, 'and cancel: nonpolar', { size: 12.5, fill: C.muted });
  // H2O
  const O = At(480, 100, 'O'), H1 = At(425, 160, 'H'), H2 = At(535, 160, 'H');
  b += latom(O) + latom(H1) + latom(H2) + lbond(O, H1) + lbond(O, H2) + lps(O, [-130, -50]);
  b += arrow(437, 132, 462, 105, { stroke: C.cobalt }) + arrow(523, 132, 498, 105, { stroke: C.cobalt });
  b += arrow(600, 165, 600, 95, { stroke: C.coral, w: 3 }) + text(612, 136, 'net dipole', { anchor: 'start', size: 13, fill: C.coral });
  b += text(480, 202, 'H₂O: bent', { size: 15, weight: 700 }) + text(480, 222, 'bond dipoles do not cancel: polar', { size: 12.5, fill: C.muted });
  b += text(350, 26, 'Bond dipole arrows point toward the more electronegative atom', { size: 13.5, fill: C.muted });
  return { w: W, h: H, title: 'Shape decides whether bond dipoles cancel', body: b };
}

/* ------------------------------------------------ question stimuli (inline SVG) */

const boxFrame = (x, y, w, h, name) => rect(x, y, w, h, { fill: '#FFFFFF', stroke: C.muted }) + text(x + w / 2, y + h + 20, name, { size: 14, weight: 700 });
const sub = d => `<tspan font-size="10" dy="3">${d}</tspan><tspan dy="-3"></tspan>`;

/* 2.1: three particle boxes: an ionic solid, a metal, a molecular element. */
export function stimBondBoxes() {
  let b = '';
  b += boxFrame(10, 10, 200, 160, 'Box 1') + boxFrame(230, 10, 200, 160, 'Box 2') + boxFrame(450, 10, 200, 160, 'Box 3');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const plus = (r + c) % 2 === 0; b += ball(34 + c * 38, 34 + r * 38, plus ? 11 : 16, plus ? C.cation : C.anion, plus ? '+' : '−', { size: 13 }); }
  const rnd = k => { const x = Math.sin(k * 78.233) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 26; i++) b += circle(240 + rnd(i + 3) * 180, 20 + rnd(i + 57) * 140, 2.8, { fill: C.cobalt, stroke: 'none' });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) b += ball(256 + c * 37, 34 + r * 38, 13, C.metal, '+', { size: 14 });
  const mols = [[490, 50, 20], [580, 40, -30], [520, 112, 70], [610, 105, 0], [480, 150, -10], [590, 152, 40]];
  for (const [x, y, d] of mols) { const t = d * Math.PI / 180, dx = Math.cos(t) * 12, dy = Math.sin(t) * 12; b += ball(x - dx, y - dy, 13, '#B7E0C2', '') + ball(x + dx, y + dy, 13, '#B7E0C2', ''); }
  b += text(330, 222, 'Key: blue + = cation, yellow − = anion, gray + = metal cation, blue dots = electrons, green = nonmetal atom', { size: 12, fill: C.muted });
  return svg({ w: 660, h: 232, label: 'Box 1: small positive and large negative ions alternating in a regular grid. Box 2: a grid of metal cations among scattered free electrons. Box 3: six separate units, each two identical nonmetal atoms joined together.', body: b });
}

/* 2.3: an ionic compound as a solid, as a melted liquid, and a wrong model. */
export function stimIonicBoxes() {
  let b = '';
  b += boxFrame(10, 10, 200, 160, 'Box 1') + boxFrame(230, 10, 200, 160, 'Box 2') + boxFrame(450, 10, 200, 160, 'Box 3');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const plus = (r + c) % 2 === 0; b += ball(34 + c * 38, 34 + r * 38, plus ? 11 : 16, plus ? C.cation : C.anion, plus ? '+' : '−', { size: 13 }); }
  const free = [[262, 40, 1], [330, 36, 0], [398, 52, 1], [286, 96, 0], [356, 88, 1], [404, 124, 0], [256, 146, 1], [318, 142, 0], [374, 156, 1], [300, 58, 0]];
  for (const [x, y, p] of free) b += ball(x, y, p ? 11 : 16, p ? C.cation : C.anion, p ? '+' : '−', { size: 13 });
  const pairs = [[490, 44], [590, 50], [500, 110], [600, 120], [550, 152]];
  for (const [x, y] of pairs) b += ball(x - 13, y, 11, C.cation, '+', { size: 13 }) + ball(x + 14, y, 16, C.anion, '−', { size: 13 });
  b += text(330, 222, 'Key: blue + = Na⁺, yellow − = Cl⁻', { size: 12.5, fill: C.muted });
  return svg({ w: 660, h: 232, label: 'Box 1: sodium and chloride ions alternating in a regular grid, every ion touching ions of opposite charge. Box 2: the same ions spread out irregularly with gaps between them. Box 3: five separate pairs, each one sodium ion stuck to one chloride ion.', body: b });
}

/* 2.4: a pure metal, an interstitial alloy and a substitutional alloy. */
export function stimAlloyBoxes() {
  let b = '';
  b += boxFrame(10, 10, 200, 170, 'Box W') + boxFrame(230, 10, 200, 170, 'Box X') + boxFrame(450, 10, 200, 170, 'Box Y');
  const grid = (x0, sw = []) => { let g = ''; for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const o = sw.some(([a, d]) => a === r && d === c); g += ball(x0 + c * 38, 38 + r * 38, 17, o ? C.other : C.metal, ''); } return g; };
  b += grid(34) + grid(254) + grid(474, [[0, 1], [1, 4], [2, 2], [3, 0], [3, 3]]);
  for (const [r, c] of [[0, 0], [0, 3], [1, 1], [2, 3], [1, 2], [2, 0]]) b += ball(273 + c * 38, 57 + r * 38, 6.5, C.small, '');
  b += text(330, 222, 'Key: gray = iron (Fe) atom, orange = atom of a second metal, small black = carbon (C) atom', { size: 12, fill: C.muted });
  return svg({ w: 660, h: 232, label: 'Box W: 20 identical iron atoms in rows. Box X: the same 20 iron atoms with 6 much smaller carbon atoms sitting in the gaps between them. Box Y: 20 atoms of the same size in rows, 15 iron and 5 of a second metal, each second-metal atom in a spot an iron atom would occupy.', body: b });
}

/* 2.5: four student-drawn Lewis diagrams (one with the wrong electron count). */
export function stimLewisCandidates() {
  let b = '';
  const cap = (x, s, f) => text(x, 168, s, { size: 14, weight: 700 }) + text(x, 188, f, { size: 13, fill: C.muted, raw: true });
  { const H = At(40, 90, 'H'), Cc = At(90, 90, 'C'), N = At(140, 90, 'N'); b += latom(H) + latom(Cc) + latom(N) + lbond(H, Cc) + lbond(Cc, N, 3) + lps(N, [0]); b += cap(90, 'Diagram 1', 'HCN'); }
  { const Cc = At(260, 100, 'C'), O = At(260, 46, 'O'), H1 = At(218, 128, 'H'), H2 = At(302, 128, 'H'); b += latom(Cc) + latom(O) + latom(H1) + latom(H2) + lbond(Cc, O, 2) + lbond(Cc, H1) + lbond(Cc, H2) + lps(O, [-150, -30]); b += cap(260, 'Diagram 2', 'H' + sub(2) + 'CO'); }
  { const A1 = At(405, 90, 'N'), A2 = At(465, 90, 'N'); b += latom(A1) + latom(A2) + lbond(A1, A2, 2) + lps(A1, [-130, 130]) + lps(A2, [-50, 50]); b += cap(435, 'Diagram 3', 'N' + sub(2)); }
  { const B = At(600, 96, 'B'), F1 = At(600, 44, 'F'), F2 = At(555, 122, 'F'), F3 = At(645, 122, 'F');
    b += latom(B) + [F1, F2, F3].map(f => latom(f) + lbond(B, f)).join('') + lps(F1, [-90, 180, 0]) + lps(F2, [90, 180, -150]) + lps(F3, [90, 0, -30]); b += cap(600, 'Diagram 4', 'BF' + sub(3)); }
  return svg({ w: 680, h: 200, label: 'Diagram 1, HCN: H single-bonded to C, C triple-bonded to N, one lone pair on N. Diagram 2, H2CO: C double-bonded to O and single-bonded to two H atoms, two lone pairs on O. Diagram 3, N2: two N atoms joined by a double bond, two lone pairs on each N. Diagram 4, BF3: B single-bonded to three F atoms, three lone pairs on each F, no lone pairs on B.', body: b });
}

/* 2.6: three candidate diagrams for the cyanate ion, OCN-, without formal charges. */
export function stimCyanate() {
  let b = '';
  const one = (x0, oOrder, nOrder, oLp, nLp, name) => {
    const O = At(x0, 80, 'O'), Cc = At(x0 + 56, 80, 'C'), N = At(x0 + 112, 80, 'N');
    let g = latom(O) + latom(Cc) + latom(N) + lbond(O, Cc, oOrder) + lbond(Cc, N, nOrder);
    g += lps(O, oLp) + lps(N, nLp);
    g += brackets(x0 - 32, 40, x0 + 144, 122, '−');
    g += text(x0 + 56, 160, name, { size: 14, weight: 700 });
    return g;
  };
  b += one(40, 2, 2, [-90, 90], [-90, 90], 'Structure I');
  b += one(270, 1, 3, [-90, 180, 90], [0], 'Structure II');
  b += one(500, 3, 1, [180], [-90, 0, 90], 'Structure III');
  return svg({ w: 690, h: 172, label: 'Three Lewis diagrams of the cyanate ion, each in brackets with a 1− charge and atoms in the order O, C, N. Structure I: O=C=N with two lone pairs on O and two on N. Structure II: O–C≡N with three lone pairs on O and one on N. Structure III: O≡C–N with one lone pair on O and three on N.', body: b });
}

/* 2.7: Lewis diagrams of four fluorides. */
export function stimFluorides() {
  let b = '';
  const cap = (x, name, f) => text(x, 196, name, { size: 14, weight: 700 }) + text(x, 214, f, { size: 13, fill: C.muted, raw: true });
  { const B = At(85, 104, 'B'), F1 = At(85, 50, 'F'), F2 = At(38, 132, 'F'), F3 = At(132, 132, 'F');
    b += latom(B) + latom(F1) + latom(F2) + latom(F3) + lbond(B, F1) + lbond(B, F2) + lbond(B, F3) + lps(F1, [-90, 180, 0]) + lps(F2, [90, 180, -150]) + lps(F3, [90, 0, -30]) + cap(85, 'Molecule 1', 'BF' + sub(3)); }
  { const N = At(255, 96, 'N'), F1 = At(205, 126, 'F'), F2 = At(305, 126, 'F'), F3 = At(255, 152, 'F');
    b += latom(N) + [F1, F2, F3].map(f => latom(f) + lbond(N, f)).join('') + lps(N, [-90]) + lps(F1, [180, -120, 120]) + lps(F2, [0, -60, 60]) + lps(F3, [90, 180, 0]) + cap(255, 'Molecule 2', 'NF' + sub(3)); }
  { const Cl = At(420, 100, 'Cl'), F1 = At(420, 46, 'F'), F2 = At(366, 100, 'F'), F3 = At(420, 154, 'F');
    b += latom(Cl) + lbond(Cl, F1, 1, { trimA: 17 }) + lbond(Cl, F2, 1, { trimA: 17 }) + lbond(Cl, F3, 1, { trimA: 17 }) + latom(F1) + latom(F2) + latom(F3) + lps(Cl, [-35, 35], { d: 23 }) + lps(F1, [-90, 180, 0]) + lps(F2, [180, -90, 90]) + lps(F3, [90, 180, 0]) + cap(420, 'Molecule 3', 'ClF' + sub(3)); }
  { const Xe = At(590, 100, 'Xe'), F1 = At(590, 44, 'F'), F2 = At(590, 156, 'F');
    b += latom(Xe) + lbond(Xe, F1, 1, { trimA: 17 }) + lbond(Xe, F2, 1, { trimA: 17 }) + latom(F1) + latom(F2) + lps(Xe, [180, -25, 25], { d: 25 }) + lps(F1, [-90, 180, 0]) + lps(F2, [90, 180, 0]) + cap(590, 'Molecule 4', 'XeF' + sub(2)); }
  return svg({ w: 680, h: 224, label: 'Lewis diagrams. Molecule 1, BF3: B bonded to three F, no lone pair on B. Molecule 2, NF3: N bonded to three F, one lone pair on N. Molecule 3, ClF3: Cl bonded to three F, two lone pairs on Cl. Molecule 4, XeF2: Xe bonded to two F, three lone pairs on Xe. Each F carries three lone pairs.', body: b });
}

/* 2.7: acrylonitrile, H2C=CH-C≡N, with its carbon atoms numbered. */
export function stimAcrylonitrile() {
  let b = '';
  const C1 = At(150, 100, 'C'), C2 = At(230, 100, 'C'), C3 = At(310, 100, 'C'), N = At(390, 100, 'N');
  const Ha = At(110, 56, 'H'), Hb = At(110, 144, 'H'), Hc = At(230, 150, 'H');
  b += [C1, C2, C3, N, Ha, Hb, Hc].map(a => latom(a)).join('');
  b += lbond(C1, C2, 2) + lbond(C2, C3) + lbond(C3, N, 3) + lbond(C1, Ha) + lbond(C1, Hb) + lbond(C2, Hc) + lps(N, [0]);
  b += text(150, 74, 'C1', { size: 12.5, fill: C.coral, weight: 700 }) + text(244, 74, 'C2', { size: 12.5, fill: C.coral, weight: 700 }) + text(310, 74, 'C3', { size: 12.5, fill: C.coral, weight: 700 });
  return svg({ w: 480, h: 180, label: 'Lewis diagram of acrylonitrile: carbon C1 bonded to two H atoms and double-bonded to carbon C2; C2 bonded to one H atom and single-bonded to carbon C3; C3 triple-bonded to N, which has one lone pair.', body: b });
}

/* 2.2: potential energy curves on a labelled grid. curves: [{ name, re, De, a, color }].
   mark: label the minimum's coordinates on the axes (used by the FRQ). */
export function peChart(curves, { label, mark = false, w = 640, h = 400 } = {}) {
  const L = 84, T = 24, pw = w - L - 24, ph = h - T - 70;
  const r0 = 0, r1 = 400, E0 = -500, E1 = 300;
  const sx = r => L + (r - r0) / (r1 - r0) * pw, sy = E => T + (E1 - E) / (E1 - E0) * ph;
  let b = rect(L, T, pw, ph, { fill: '#FFFFFF', stroke: C.line, r: 0, w: 1 });
  for (let E = E0; E <= E1; E += 50) b += line(L, sy(E), L + pw, sy(E), { stroke: E === 0 ? C.muted : '#E2E6EA', w: E === 0 ? 1.6 : 1 }) + (E % 100 === 0 ? text(L - 8, sy(E) + 5, String(E).replace('-', '−'), { size: 12.5, anchor: 'end' }) : '');
  for (let r = 0; r <= r1; r += 25) b += line(sx(r), T, sx(r), T + ph, { stroke: '#E2E6EA', w: 1 }) + (r % 50 === 0 ? text(sx(r), T + ph + 18, String(r), { size: 12.5 }) : '');
  b += line(L, T, L, T + ph, { w: 1.6 }) + line(L, T + ph, L + pw, T + ph, { w: 1.6 });
  b += text(L + pw / 2, T + ph + 44, 'Distance between the nuclei (pm)', { size: 14, weight: 700 });
  b += `<text x="22" y="${T + ph / 2}" font-size="14" font-weight="700" text-anchor="middle" transform="rotate(-90 22 ${T + ph / 2})">Potential energy (kJ/mol)</text>`;
  for (const c of curves) {
    const pts = [];
    for (let r = 20; r <= r1; r += 1) { const E = morse(r, c.De, c.re, c.a); if (E <= E1) pts.push(`${sx(r).toFixed(1)},${sy(E).toFixed(1)}`); }
    b += `<polyline points="${pts.join(' ')}" fill="none" stroke="${c.color}" stroke-width="3"${c.dash ? ` stroke-dasharray="${c.dash}"` : ''}/>`;
    b += circle(sx(c.re), sy(-c.De), 4.5, { fill: c.color, stroke: 'none' });
    if (c.name) b += text(sx(c.re) + (c.ldx ?? 8), sy(-c.De) + (c.ldy ?? 20), c.name, { size: 14, weight: 700, fill: c.color, anchor: c.ldx < 0 ? 'end' : 'start' });
    if (mark) {
      b += line(sx(c.re), sy(-c.De), sx(c.re), T + ph, { dash: '5 4', stroke: C.coral, w: 1.5 }) + line(L, sy(-c.De), sx(c.re), sy(-c.De), { dash: '5 4', stroke: C.coral, w: 1.5 });
      b += text(sx(c.re), T + ph - 6, `${c.re} pm`, { size: 12.5, weight: 700, fill: C.coral, anchor: 'start' }).replace(`x="${sx(c.re)}"`, `x="${sx(c.re) + 5}"`);
      b += text(L + 6, sy(-c.De) - 6, `−${c.De} kJ/mol`, { size: 12.5, weight: 700, fill: C.coral, anchor: 'start' });
    }
  }
  return svg({ w, h, label, body: b });
}

export function stimPeCurves() {
  return peChart([
    { name: 'Curve 1', re: 199, De: 243, a: 0.020, color: '#1D44A6' },
    { name: 'Curve 2', re: 74, De: 436, a: 0.0194, color: '#B4432F', ldx: -10, ldy: 6 },
    { name: 'Curve 3', re: 127, De: 431, a: 0.0187, color: '#2E7D4F', dash: '9 5' },
  ], { label: 'Graph of potential energy in kilojoules per mole against distance between the nuclei in picometers, for three diatomic molecules. Each curve falls from high positive energy at short distance to a minimum, then rises toward zero at long distance. Curve 1 has its minimum at about 199 picometers and minus 243 kilojoules per mole. Curve 2 has its minimum at about 74 picometers and minus 436. Curve 3 has its minimum at about 127 picometers and minus 431.' });
}

export function stimPeHBr() {
  return peChart([{ re: 141, De: 366, a: 0.0181, color: '#1D44A6' }], { mark: true, label: 'Graph of potential energy in kilojoules per mole against distance between the H and Br nuclei in picometers. The curve falls from high positive energy at short distance to a minimum at 141 picometers and minus 366 kilojoules per mole, then rises toward zero at long distance. The minimum is marked with dashed lines to both axes.' });
}

/* Inline stimulus SVGs by question-file key. Running this script writes each
   one into the matching stimulus's html (replacing its <svg>…</svg>, keeping
   any text after it). FRQ stimuli are keyed "frq:<id>". */
export const STIMULI = {
  'bond-types-s2': stimBondBoxes,
  'bond-potential-energy-s1': stimPeCurves,
  'ionic-solids-s2': stimIonicBoxes,
  'metals-alloys-s1': stimAlloyBoxes,
  'lewis-diagrams-s1': stimLewisCandidates,
  'resonance-formal-charge-s1': stimCyanate,
  'vsepr-hybridization-s1': stimFluorides,
  'vsepr-hybridization-s2': stimAcrylonitrile,
  'frq:frq-hbr-potential-energy': stimPeHBr,
};

export const FIGURES = {
  'bond-types-continuum': bondTypes,
  'metallic-bond-sea': metallicBond,
  'pe-curve-h2': peCurve,
  'carbon-single-double-triple': bondOrders,
  'ionic-layer-brittle': ionicLattice,
  'metal-alloy-types': alloys,
  'lewis-four-examples': lewisExamples,
  'nitrate-resonance': nitrate,
  'vsepr-shapes-2-4': vseprTwoToFour,
  'vsepr-shapes-5-6': vseprFiveSix,
  'molecular-polarity-co2-h2o': polarity,
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  mkdirSync(OUT, { recursive: true });
  for (const [id, f] of Object.entries(FIGURES)) {
    const { w, h, title, body } = f();
    writeFileSync(join(OUT, `${id}.svg`), svg({ w, h, label: title, title, body, standalone: true }) + '\n');
    console.log(`chem/figures/${id}.svg`);
  }
  const DATA = join(ROOT, 'chem', 'data');
  const put = (html, s) => (html && /<svg[\s\S]*<\/svg>/.test(html)) ? html.replace(/<svg[\s\S]*<\/svg>/, s) : s + (html || '');
  for (const [key, f] of Object.entries(STIMULI)) {
    const frq = key.startsWith('frq:');
    const file = frq ? join(DATA, 'frq', `${key.slice(4)}.json`) : join(DATA, 'questions', `${key.replace(/-s\d+$/, '')}.json`);
    if (!existsSync(file)) { console.log(`skip ${key}: no ${file}`); continue; }
    const d = JSON.parse(readFileSync(file, 'utf8'));
    const s = frq ? d.stimulus : d.stimuli && d.stimuli[key];
    if (!s || typeof s !== 'object') { console.log(`skip ${key}: no stimulus`); continue; }
    s.html = put(s.html, f());
    writeFileSync(file, JSON.stringify(d, null, 1) + '\n');
    console.log(`${key} -> ${file.slice(ROOT.length + 1)}`);
  }
}
