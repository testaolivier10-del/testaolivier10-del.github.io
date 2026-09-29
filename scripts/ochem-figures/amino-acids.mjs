/* Figures for the amino-acids notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Alanine is the working example throughout: the same molecule is drawn
   with its parts named, in each of its three charge states, on a pH line,
   in a Fischer projection and in wedge-and-dash. Groups are drawn as
   labelled discs, with the carboxyl written out as C, =O and O so the
   proton that moves can be seen.

   Figures shown in the lesson are 340 wide or less and use only fg-lbl and
   fg-tag text. Where a notes figure is wide, a stacked copy with the prefix
   l- is drawn for the lesson from the same cell functions.

   Angles: armEnd() and center() take paper angles, counterclockwise from
   east. */
import { atom, bond, arrow, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { polyPts } from '../lib/ochem-skeletal.mjs';
import { center, armEnd } from '../lib/ochem-helpers.mjs';
import { benzene } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */

const rOf = (l) => (l.length >= 5 ? 22 : l.length >= 3 ? 19 : l.length === 2 ? 16 : l === 'H' ? 13 : 15);
const A = (p, l, o = {}) => atom(p.x, p.y, l, { r: o.r ?? rOf(l), ...o });
const B = (a, b, la, lb, o = {}) => bond(a, b, { rFrom: rOf(la), rTo: rOf(lb), ...o });
const Tag = (p, s, o = {}) => text(p.x, p.y, s, { cls: 'fg-tag', size: 11, ...o });
const Good = (p, s, o = {}) => text(p.x, p.y, s, { cls: 'fg-tag-good', size: 11, ...o });

/* Two straight arrows, forward above reverse: an equilibrium. */
const eqmH = (x1, x2, y) => arrow(P(x1, y - 5), P(x2, y - 5), { size: 7 }) + arrow(P(x2, y + 5), P(x1, y + 5), { size: 7 });
const eqmV = (x, y1, y2) => arrow(P(x - 5, y1), P(x - 5, y2), { size: 7 }) + arrow(P(x + 5, y2), P(x + 5, y1), { size: 7 });
/* An equilibrium lying far to the right (or down): long forward, short reverse. */
const eqmHRight = (x1, x2, y) => arrow(P(x1, y - 5), P(x2, y - 5), { size: 7 }) + arrow(P(x2 - 22, y + 5), P(x1 + 22, y + 5), { size: 7 });
const eqmVDown = (x, y1, y2) => arrow(P(x - 5, y1), P(x - 5, y2), { size: 7 }) + arrow(P(x + 5, y2 - 14), P(x + 5, y1 + 14), { size: 7 });

/* A circular arrow of radius r about c, from paper angle a0 to a1, drawn
   clockwise (cw) or counterclockwise on the page, with its head at a1. */
function arcArrow(c, r, a0, a1, cw) {
  const pt = (a) => P(c.x + r * Math.cos((a * Math.PI) / 180), c.y - r * Math.sin((a * Math.PI) / 180));
  const span = cw ? ((a0 - a1) % 360 + 360) % 360 : ((a1 - a0) % 360 + 360) % 360;
  const s0 = pt(a0);
  const size = 8;
  const back = (size / r) * (180 / Math.PI);          // stop the line short of the tip
  const aEnd = cw ? a1 + back : a1 - back;
  const e = pt(aEnd);
  const tip = pt(a1);
  const rad = (a1 * Math.PI) / 180;
  // Screen tangent: clockwise on paper means the angle decreases.
  let ux = cw ? Math.sin(rad) : -Math.sin(rad);
  let uy = cw ? Math.cos(rad) : -Math.cos(rad);
  const px = -uy, py = ux, h = size * 0.52;
  const bx = tip.x - ux * size, by = tip.y - uy * size;
  const f = (v) => (Math.round(v * 100) / 100).toString();
  const large = span - back > 180 ? 1 : 0;
  return `<path class="fg-arrow" d="M${f(s0.x)} ${f(s0.y)} A${f(r)} ${f(r)} 0 ${large} ${cw ? 1 : 0} ${f(e.x)} ${f(e.y)}"></path>` +
    `<path class="fg-head" d="M${f(tip.x)} ${f(tip.y)} L${f(bx + px * h)} ${f(by + py * h)} L${f(bx - px * h)} ${f(by - py * h)} Z"></path>`;
}

/* One alanine-style amino acid with its alpha carbon at c.
   acid: 'COOH' or 'COO-'; amine: 'NH2' or 'NH3+'. The carboxyl is drawn
   out (C, =O, O–H or O⁻); the amino group is one disc. hi lists the parts
   to highlight: 'acid', 'amine', 'side'. */
function aminoAcid(c, { acid = 'COO-', amine = 'NH3+', side = 'CH₃', alpha = 'CH', hi = [], showH = false } = {}) {
  const nLab = amine === 'NH3+' ? 'H₃N⁺' : 'H₂N';
  const oLab = acid === 'COOH' ? 'OH' : 'O⁻';
  const n = P(c.x - 58, c.y), cc = P(c.x + 56, c.y);
  const o1 = armEnd(cc, 60, 46), o2 = armEnd(cc, 300, 46);
  const sc = P(c.x, c.y + 54);
  const aR = alpha === 'C' ? 15 : 16;
  let s = '';
  s += bond(n, c, { rFrom: 19, rTo: aR }) + bond(c, cc, { rFrom: aR, rTo: 15 });
  s += bond(cc, o1, { rFrom: 15, rTo: 15, order: 2 }) + bond(cc, o2, { rFrom: 15, rTo: 16 });
  s += bond(c, sc, { rFrom: aR, rTo: rOf(side) });
  if (showH) {
    const h = P(c.x, c.y - 46);
    s += bond(c, h, { rFrom: aR, rTo: 13 }) + A(h, 'H');
  }
  s += A(n, nLab, { r: 19, kind: hi.includes('amine') ? 'hi' : undefined });
  s += A(cc, 'C') + A(o1, 'O') + A(o2, oLab, { r: 16, kind: hi.includes('acid') ? 'hi' : undefined });
  s += A(sc, side, { kind: hi.includes('side') ? 'hi' : undefined });
  s += A(c, alpha, { r: aR });
  return s;
}

/* ======================================================================
   1. Alanine with its parts named.
   ====================================================================== */
FIGURES.push({
  id: 'amino-acid-anatomy',
  section: 'amino-acids',
  anchor: '<h3>In water, an amino acid carries two charges</h3>',
  lessons: ['amino-acids'],
  alt: 'Alanine drawn with every group labelled. The alpha carbon in the middle carries a hydrogen above, an amino group H2N on the left, a carboxyl group C double-bonded to O and single-bonded to OH on the right, and a CH3 side chain below.',
  viewBox: '0 0 340 250',
  build() {
    const c = P(140, 118);
    let s = '';
    s += Tag(P(170, 22), 'alanine: an α-amino acid');
    s += aminoAcid(c, { acid: 'COOH', amine: 'NH2', alpha: 'C', showH: true, hi: ['side'] });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += Tag(P(116, 84), 'α carbon', { anchor: 'end' });
    s += Tag(P(72, 158), 'amino group');
    s += Tag(P(262, 214), 'carboxyl group');
    s += Tag(P(140, 214), 'side chain R');
    s += Tag(P(140, 234), '(here CH₃)');
    return s;
  },
  caption: 'Alanine. The highlighted α carbon holds all four parts: H, the amino group, the carboxyl group and the side chain R.',
});

/* ======================================================================
   2. The proton moves from O to N.
   ====================================================================== */
FIGURES.push({
  id: 'zwitterion-transfer',
  section: 'amino-acids',
  anchor: '<h3>In water, an amino acid carries two charges</h3>',
  lessons: ['amino-acids'],
  alt: 'Two drawings of alanine joined by an equilibrium that lies far toward the lower one. Above, the form with no charges: COOH and NH2, with the O–H highlighted. Below, the zwitterion: the carboxylate O minus and the ammonium H3N plus, both highlighted. A label says the proton moves from the oxygen to the nitrogen.',
  viewBox: '0 0 340 388',
  build() {
    let s = '';
    s += panel(8, 8, 324, 150);
    s += Tag(P(170, 30), 'no charges drawn: a tiny fraction');
    s += aminoAcid(P(140, 84), { acid: 'COOH', amine: 'NH2', hi: ['acid'] });
    s += eqmVDown(92, 170, 222);
    s += Tag(P(108, 192), 'H⁺ moves from O to N', { anchor: 'start' });
    s += Tag(P(108, 210), 'the pKa 2 acid protonates the amine', { anchor: 'start' });
    s += panel(8, 230, 324, 150, { kind: 'hi' });
    s += Tag(P(170, 252), 'zwitterion: net charge 0');
    s += aminoAcid(P(140, 306), { acid: 'COO-', amine: 'NH3+', hi: ['acid', 'amine'] });
    return s;
  },
  caption: 'The form you might draw first (top) and the form actually present in water and in the crystal (bottom).',
});

/* ======================================================================
   3. Alanine at three pH values. Notes: side by side. Lesson: stacked.
   ====================================================================== */
const STATES = [
  { title: 'pH 1: net +1', name: 'cation', acid: 'COOH', amine: 'NH3+', hi: ['amine'] },
  { title: 'pH 6: net 0', name: 'zwitterion', acid: 'COO-', amine: 'NH3+', hi: ['acid', 'amine'] },
  { title: 'pH 11: net −1', name: 'anion', acid: 'COO-', amine: 'NH2', hi: ['acid'] },
];
function stateCell(ox, oy, w, h, st, kind) {
  let s = panel(ox, oy, w, h, kind ? { kind } : {});
  s += Tag(P(ox + w / 2, oy + 22), st.title);
  s += aminoAcid(P(ox + w / 2 - 9, oy + 88), st);
  s += Good(P(ox + w / 2, oy + h - 12), st.name);
  return s;
}

FIGURES.push({
  id: 'amino-acid-charge-states',
  section: 'amino-acids',
  anchor: '<h3>Charge follows pH: three forms</h3>',
  alt: 'Alanine at three pH values. At pH 1 it is the cation, with COOH and H3N plus, net charge plus one. Past pKa 2.34 the carboxyl loses its proton and it becomes the zwitterion at pH 6, net charge zero. Past pKa 9.69 the ammonium loses its proton and it becomes the anion at pH 11, with carboxylate and H2N, net charge minus one.',
  viewBox: '0 0 760 206',
  build() {
    let s = '';
    const w = 200, h = 190, gap = 70;
    STATES.forEach((st, i) => {
      s += stateCell(8 + i * (w + gap), 8, w, h, st, i === 1 ? 'hi' : null);
    });
    for (const [i, pka] of [[0, 'pKa 2.34'], [1, 'pKa 9.69']]) {
      const x1 = 8 + w + i * (w + gap) + 8, x2 = x1 + gap - 16;
      s += eqmH(x1, x2, 100);
      s += Tag(P((x1 + x2) / 2, 80), pka);
      s += Tag(P((x1 + x2) / 2, 128), '−H⁺');
    }
    return s;
  },
  caption: 'Alanine at three pH values, read from left to right as base is added. The highlighted groups are the charged ones.',
});

FIGURES.push({
  id: 'l-charge-states',
  lessons: ['amino-acids'],
  alt: 'Alanine at three pH values, stacked. At pH 1 the cation with COOH and H3N plus, net plus one. Losing a proton at pKa 2.34 gives the zwitterion at pH 6, net zero. Losing a proton at pKa 9.69 gives the anion at pH 11, net minus one.',
  viewBox: '0 0 340 704',
  build() {
    let s = '';
    const h = 190, gap = 60;
    STATES.forEach((st, i) => {
      s += stateCell(8, 8 + i * (h + gap), 324, h, st, i === 1 ? 'hi' : null);
    });
    for (const [i, pka] of [[0, 'pKa 2.34'], [1, 'pKa 9.69']]) {
      const y1 = 8 + h + i * (h + gap) + 8, y2 = y1 + gap - 16;
      s += eqmV(150, y1, y2);
      s += Tag(P(168, (y1 + y2) / 2 - 3), pka, { anchor: 'start' });
      s += Tag(P(168, (y1 + y2) / 2 + 13), '−H⁺', { anchor: 'start' });
    }
    return s;
  },
  caption: 'Alanine at three pH values, read from top to bottom as base is added.',
});

/* ======================================================================
   4. Net charge against pH, with the pI at the midpoint.
   ====================================================================== */
FIGURES.push({
  id: 'zwitterion-ladder',
  section: 'amino-acids',
  anchor: '<h3>The isoelectric point</h3>',
  alt: 'A pH line from 0 to 14 for alanine. Below pKa 2.34 the molecule is mostly the cation, net plus one. Between 2.34 and 9.69 it is mostly the zwitterion, net zero. Above 9.69 it is mostly the anion, net minus one. The isoelectric point, 6.02, sits halfway between the two pKa values.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    const x = (pH) => 60 + (pH / 14) * 640;
    s += rule(60, 190, 700, 190);
    for (let pH = 0; pH <= 14; pH += 2) {
      s += rule(x(pH), 190, x(pH), 197);
      s += text(x(pH), 214, String(pH), { cls: 'fg-tag', size: 11 });
    }
    s += Tag(P(380, 238), 'pH');

    const zones = [
      { a: 0, b: 2.34, name: 'cation', charge: 'net +1', kind: 'fg-fill-warn' },
      { a: 2.34, b: 9.69, name: 'mostly zwitterion', charge: 'net 0 at the pI', kind: 'fg-fill-hi' },
      { a: 9.69, b: 14, name: 'mostly anion', charge: 'net −1', kind: 'fg-fill-warn' },
    ];
    for (const z of zones) {
      const x1 = x(z.a), x2 = x(z.b);
      s += `<rect class="${z.kind}" x="${x1.toFixed(2)}" y="120" width="${(x2 - x1).toFixed(2)}" height="56" rx="7" opacity="0.32"></rect>`;
    }
    s += text(x(1.17), 144, 'mostly', { cls: 'fg-lbl', size: 13 });
    s += text(x(1.17), 162, 'cation', { cls: 'fg-lbl', size: 13 });
    s += text(x(6.02), 144, 'mostly zwitterion', { cls: 'fg-lbl', size: 13 });
    s += Tag(P(x(6.02) + 0, 164), 'net charge near 0');
    s += text(x(11.85), 144, 'mostly anion', { cls: 'fg-lbl', size: 13 });
    s += Tag(P(x(11.85), 164), 'net charge −1');
    s += Tag(P(x(1.17), 110), 'net +1');

    for (const [pH, name] of [[2.34, 'pKa₁ 2.34'], [9.69, 'pKa₂ 9.69']]) {
      s += rule(x(pH), 94, x(pH), 190);
      s += Tag(P(x(pH), 86), name);
    }
    s += rule(x(6.02), 58, x(6.02), 120);
    s += Good(P(x(6.02), 50), 'pI = ½(2.34 + 9.69) = 6.02');
    s += Tag(P(x(6.02), 28), 'halfway between the two pKa values');
    return s;
  },
  caption: 'Alanine’s charge across the pH scale. The two pKa values are the only boundaries, and the pI sits halfway between them.',
});

/* ======================================================================
   5. The pI ladders for lysine and aspartic acid.
   ====================================================================== */
function ladderRow(y0, title, species, pkas, zero, piText) {
  let s = '';
  const bw = 132, gap = 58, x0 = 22;
  s += text(x0, y0 + 14, title, { cls: 'fg-lbl', size: 13, anchor: 'start' });
  species.forEach((sp, i) => {
    const bx = x0 + i * (bw + gap), by = y0 + 26;
    s += panel(bx, by, bw, 64, i === zero ? { kind: 'good' } : {});
    s += text(bx + bw / 2, by + 22, sp[0], { cls: 'fg-lbl', size: 13 });
    s += text(bx + bw / 2, by + 40, sp[1], { cls: 'fg-sm', size: 10.5 });
    s += text(bx + bw / 2, by + 55, sp[2], { cls: 'fg-sm', size: 10.5 });
    if (i < pkas.length) {
      const ax = bx + bw + 6;
      s += arrow(P(ax, by + 38), P(ax + gap - 12, by + 38), { size: 7 });
      s += Tag(P(ax + (gap - 12) / 2, by + 26), pkas[i]);
    }
  });
  // bracket under the two pKa values that flank the zero
  const xa = x0 + zero * (bw + gap) - gap / 2, xb = x0 + (zero + 1) * (bw + gap) - gap / 2;
  const yb = y0 + 100;
  s += rule(xa, yb, xb, yb) + rule(xa, yb - 6, xa, yb) + rule(xb, yb - 6, xb, yb);
  s += Good(P((xa + xb) / 2, yb + 18), piText);
  return s;
}

FIGURES.push({
  id: 'pi-ladders',
  section: 'amino-acids',
  anchor: '<span class="k">Worked example — pI when the side chain ionizes</span>',
  alt: 'Two charge ladders. Lysine: net plus 2, then plus 1 after pKa 2.18, then 0 after pKa 8.95, then minus 1 after pKa 10.53; the neutral species is bracketed by 8.95 and 10.53, so the pI is 9.74. Aspartic acid: plus 1, then 0 after pKa 1.88, then minus 1 after pKa 3.65, then minus 2 after pKa 9.60; the neutral species is bracketed by 1.88 and 3.65, so the pI is 2.77.',
  viewBox: '0 0 760 270',
  build() {
    let s = '';
    s += ladderRow(6, 'Lysine: a basic side chain', [
      ['+2', 'α-COOH, α-NH₃⁺', 'side chain NH₃⁺'],
      ['+1', 'α-COO⁻, α-NH₃⁺', 'side chain NH₃⁺'],
      ['0', 'α-COO⁻, α-NH₂', 'side chain NH₃⁺'],
      ['−1', 'α-COO⁻, α-NH₂', 'side chain NH₂'],
    ], ['2.18', '8.95', '10.53'], 2, 'pI = ½(8.95 + 10.53) = 9.74');
    s += ladderRow(140, 'Aspartic acid: an acidic side chain', [
      ['+1', 'α-COOH, α-NH₃⁺', 'side chain COOH'],
      ['0', 'α-COO⁻, α-NH₃⁺', 'side chain COOH'],
      ['−1', 'α-COO⁻, α-NH₃⁺', 'side chain COO⁻'],
      ['−2', 'α-COO⁻, α-NH₂', 'side chain COO⁻'],
    ], ['1.88', '3.65', '9.60'], 1, 'pI = ½(1.88 + 3.65) = 2.77');
    return s;
  },
  caption: 'Each arrow removes one proton, at the pKa written above it. The green box is the species with no net charge, and the pI averages the two pKa values on either side of it.',
});

/* ======================================================================
   6. Which way it moves in an electric field.
   ====================================================================== */
FIGURES.push({
  id: 'electrophoresis-strip',
  section: 'amino-acids',
  anchor: '<span class="k">Worked example — which way does it move in an electric field?</span>',
  lessons: ['amino-acids'],
  alt: 'An electrophoresis strip with the negative cathode on the left and the positive anode on the right. Three lanes of alanine, pI 6.0, each starting at the center. At pH 3, below the pI, it is net positive and moves left to the cathode. At pH 6.0, the pI, it has no net charge and stays put. At pH 9, above the pI, it is net negative and moves right to the anode.',
  viewBox: '0 0 340 250',
  build() {
    let s = '';
    s += `<rect class="fg-fill-warn" x="10" y="44" width="12" height="190" rx="3" opacity="0.6"></rect>`;
    s += `<rect class="fg-fill-hi" x="318" y="44" width="12" height="190" rx="3" opacity="0.6"></rect>`;
    s += Tag(P(10, 26), 'cathode (−)', { anchor: 'start' });
    s += Tag(P(330, 26), 'anode (+)', { anchor: 'end' });
    const lanes = [
      { y: 86, t: 'pH 3, below the pI: net +', dir: -1 },
      { y: 150, t: 'pH 6.0, at the pI: no net charge', dir: 0 },
      { y: 214, t: 'pH 9, above the pI: net −', dir: 1 },
    ];
    for (const l of lanes) {
      s += rule(30, l.y, 310, l.y);
      s += Tag(P(170, l.y - 20), l.t);
      if (l.dir === 0) {
        s += `<circle class="fg-atom-hi" cx="170" cy="${l.y}" r="7"></circle>`;
      } else {
        const end = l.dir < 0 ? 52 : 288;
        s += `<circle class="fg-atom" cx="170" cy="${l.y}" r="5"></circle>`;
        s += `<circle class="fg-atom-hi" cx="${end + (l.dir < 0 ? 12 : -12)}" cy="${l.y}" r="7"></circle>`;
        s += arrow(P(l.dir < 0 ? 162 : 178, l.y + 12), P(l.dir < 0 ? 64 : 276, l.y + 12), { size: 7 });
      }
    }
    return s;
  },
  caption: 'Alanine (pI 6.0) started at the center of the strip in three buffers. The small dot marks the start and the larger one where it ends up.',
});

/* ======================================================================
   7. One side chain from each class.
   ====================================================================== */
/* The backbone as it is at pH 7, with the side chain hanging from the
   alpha carbon; `chain` draws the side chain below point p. */
function scCell(ox, oy, w, h, title, name, foot, chain) {
  const cx = ox + w / 2, cy = oy + 76;
  let s = panel(ox, oy, w, h);
  s += Tag(P(cx, oy + 20), title);
  s += Good(P(cx, oy + 38), name);
  const n = P(cx - 52, cy), c = P(cx, cy), cc = P(cx + 52, cy);
  s += B(n, c, 'H₃N⁺', 'CH') + B(c, cc, 'CH', 'COO⁻');
  s += A(n, 'H₃N⁺') + A(cc, 'COO⁻') + A(c, 'CH');
  s += chain(c);
  s += Tag(P(cx, oy + h - 12), foot);
  return s;
}
const down = (p, d = 50) => P(p.x, p.y + d);
function vChain(c, labels, kinds = []) {
  let s = '', prev = c, prevL = 'CH';
  labels.forEach((l, i) => {
    const q = down(prev, i === 0 ? 50 : 48);
    s += B(prev, q, prevL, l) + A(q, l, { kind: kinds[i] });
    prev = q; prevL = l;
  });
  return { s, end: prev };
}
const SIDE = [
  ['Nonpolar', 'phenylalanine', 'hydrophobic', (c) => {
    const v = vChain(c, ['CH₂'], ['hi']);
    const top = P(v.end.x, v.end.y + 34), ctr = P(v.end.x, v.end.y + 58);
    const bz = benzene(ctr.x, ctr.y, 24, { cls: 'fg-bond-hi' });
    return v.s + bond(v.end, bz.pts[0], { rFrom: 16, rTo: 0, cls: 'fg-bond' }) + bz.svg;
  }],
  ['Polar, uncharged', 'serine', 'forms hydrogen bonds', (c) => vChain(c, ['CH₂', 'OH'], ['hi', 'hi']).s],
  ['Acidic', 'aspartate', 'negative at pH 7.4', (c) => {
    const v = vChain(c, ['CH₂'], ['hi']);
    const k = down(v.end, 46);
    const o1 = armEnd(k, 225, 40), o2 = armEnd(k, 315, 40);
    return v.s + B(v.end, k, 'CH₂', 'C') + bond(k, o1, { rFrom: 15, rTo: 15, order: 2 }) + bond(k, o2, { rFrom: 15, rTo: 16 }) +
      A(k, 'C', { kind: 'hi' }) + A(o1, 'O', { kind: 'hi' }) + A(o2, 'O⁻', { kind: 'warn' });
  }],
  ['Basic', 'lysine', 'positive at pH 7.4', (c) => vChain(c, ['(CH₂)₄', 'NH₃⁺'], ['hi', 'warn']).s],
];

FIGURES.push({
  id: 'side-chain-classes',
  section: 'amino-acids',
  anchor: '<h3>Side chains sort into four classes</h3>',
  alt: 'Four amino acids drawn as they are at pH 7, each with the same backbone H3N plus, CH, COO minus and a different side chain hanging below. Nonpolar: phenylalanine, a CH2 and a benzene ring, hydrophobic. Polar, uncharged: serine, CH2 then OH, forms hydrogen bonds. Acidic: aspartate, CH2 then a carboxylate, negative at pH 7.4. Basic: lysine, four CH2 groups then NH3 plus, positive at pH 7.4.',
  viewBox: '0 0 760 262',
  build() {
    let s = '';
    const w = 178, h = 246;
    SIDE.forEach(([t, n, f, ch], i) => { s += scCell(8 + i * (w + 8), 8, w, h, t, n, f, ch); });
    return s;
  },
  caption: 'One amino acid from each class. The backbone is the same in all four; only the highlighted side chain changes.',
});

FIGURES.push({
  id: 'l-side-chain-classes',
  lessons: ['amino-acids'],
  alt: 'Four amino acids as they are at pH 7, in a two-by-two grid, each with the same backbone and a different side chain. Nonpolar phenylalanine with a benzene ring; polar serine with CH2OH; acidic aspartate with a carboxylate; basic lysine with four CH2 groups and NH3 plus.',
  viewBox: '0 0 340 512',
  build() {
    let s = '';
    const w = 160, h = 246;
    SIDE.forEach(([t, n, f, ch], i) => {
      s += scCell(8 + (i % 2) * (w + 4), 8 + Math.floor(i / 2) * (h + 8), w, h, t, n, f, ch);
    });
    return s;
  },
  caption: 'One amino acid from each class. Only the highlighted side chain changes.',
});

/* ======================================================================
   8. Proline: the side chain closes a ring onto the nitrogen.
   ====================================================================== */
FIGURES.push({
  id: 'proline-ring',
  section: 'amino-acids',
  anchor: '<p class="step-body"><b>Proline</b>',
  lessons: ['amino-acids'],
  alt: 'Proline as a zwitterion. A five-membered ring: the nitrogen, drawn as H2N plus, the alpha carbon CH, and three CH2 groups of the side chain, the last of which bonds back to the nitrogen. A carboxylate hangs off the alpha carbon. The nitrogen is bonded to two carbons, so it is a secondary amine.',
  viewBox: '0 0 340 250',
  build() {
    let s = '';
    const pts = polyPts(150, 118, 5, 50, 90);
    // pts: 0 top, 1 upper left, 2 lower left, 3 lower right, 4 upper right
    const lab = ['CH₂', 'CH₂', 'H₂N⁺', 'CH', 'CH₂'];
    const kinds = ['hi', 'hi', 'warn', undefined, 'hi'];
    for (let i = 0; i < 5; i++) {
      const a = pts[i], b = pts[(i + 1) % 5];
      s += B(a, b, lab[i], lab[(i + 1) % 5], i === 1 ? { cls: 'fg-bond-hi' } : {});
    }
    const ca = pts[3], coo = armEnd(ca, 300, 58);
    s += B(ca, coo, 'CH', 'COO⁻');
    for (let i = 0; i < 5; i++) s += A(pts[i], lab[i], { kind: kinds[i] });
    s += A(coo, 'COO⁻');
    s += Tag(P(150, 22), 'proline');
    s += Tag(P(64, 106), 'side chain', { anchor: 'end' });
    s += Tag(P(64, 122), 'bonds back', { anchor: 'end' });
    s += Tag(P(64, 138), 'to N', { anchor: 'end' });
    s += Tag(P(214, 118), 'α carbon', { anchor: 'start' });
    s += Tag(P(170, 218), 'N bonded to two carbons:');
    s += Tag(P(170, 236), 'a secondary amine');
    return s;
  },
  caption: 'Proline. Its three side-chain CH₂ groups (highlighted) close a five-membered ring through the nitrogen.',
});

/* ======================================================================
   9. Two cysteines joined by a disulfide bond.
   ====================================================================== */
FIGURES.push({
  id: 'disulfide',
  section: 'amino-acids',
  anchor: 'cross-link',
  lessons: ['amino-acids'],
  alt: 'Two cysteine side chains, each CH2–SH hanging from an alpha carbon of a protein chain, face each other. An arrow labelled oxidation, two hydrogens removed, leads down to the same two side chains joined as CH2–S–S–CH2, a disulfide bond.',
  viewBox: '0 0 340 250',
  build() {
    let s = '';
    const row = (y, mid) => {
      let t = '';
      const pts = [P(34, y), P(92, y), ...mid.map(([x]) => P(x, y)), P(248, y), P(306, y)];
      const labs = ['CH', 'CH₂', ...mid.map(([, l]) => l), 'CH₂', 'CH'];
      for (let i = 0; i < pts.length - 1; i++) {
        if (mid.length === 2 && i === 2 && labs[2] === 'SH') continue; // two SH groups are not bonded
        t += B(pts[i], pts[i + 1], labs[i], labs[i + 1], (labs[i] === 'S' && labs[i + 1] === 'S') ? { cls: 'fg-bond-hi' } : {});
      }
      labs.forEach((l, i) => { t += A(pts[i], l, { kind: l.includes('S') ? 'hi' : undefined }); });
      return t;
    };
    s += Tag(P(63, 24), 'cysteine');
    s += Tag(P(277, 24), 'cysteine');
    s += row(62, [[146, 'SH'], [194, 'HS']]);
    s += Tag(P(34, 96), 'α C') + Tag(P(306, 96), 'α C');
    s += arrow(P(170, 100), P(170, 158), { size: 7 });
    s += Tag(P(182, 126), 'oxidation', { anchor: 'start' });
    s += Tag(P(182, 142), '(2 H removed)', { anchor: 'start' });
    s += row(192, [[148, 'S'], [192, 'S']]);
    s += Tag(P(34, 226), 'α C') + Tag(P(306, 226), 'α C');
    s += Good(P(170, 232), 'disulfide bond');
    return s;
  },
  caption: 'Two cysteine side chains before and after oxidation. The new S–S bond (highlighted) ties two parts of a chain together.',
});

/* ======================================================================
   10. L and D in a Fischer projection.
   ====================================================================== */
FIGURES.push({
  id: 'l-and-d-alanine',
  section: 'amino-acids',
  anchor: '<h3>One stereocenter, and biology uses L</h3>',
  lessons: ['amino-acids'],
  alt: 'Two Fischer projections of alanine side by side, each with COOH at the top and CH3 at the bottom. In L-alanine the amino group H2N is on the left and H on the right. In D-alanine the NH2 is on the right and H on the left.',
  viewBox: '0 0 340 250',
  build() {
    let s = '';
    const fischer = (cx, left) => {
      const c = P(cx, 128);
      const top = P(cx, 72), bot = P(cx, 184), l = P(cx - 52, 128), r = P(cx + 52, 128);
      const lL = left ? 'H₂N' : 'H', rL = left ? 'H' : 'NH₂';
      let t = bond(c, top, { rFrom: 0, rTo: 20 }) + bond(c, bot, { rFrom: 0, rTo: 19 });
      t += bond(c, l, { rFrom: 0, rTo: rOf(lL) }) + bond(c, r, { rFrom: 0, rTo: rOf(rL) });
      t += A(top, 'COOH', { r: 20 }) + A(bot, 'CH₃');
      t += A(l, lL, { kind: left ? 'hi' : undefined }) + A(r, rL, { kind: left ? undefined : 'hi' });
      return t;
    };
    s += panel(8, 36, 158, 172, { kind: 'hi' });
    s += panel(174, 36, 158, 172);
    s += fischer(87, true);
    s += fischer(253, false);
    s += Tag(P(87, 24), 'L-alanine');
    s += Tag(P(253, 24), 'D-alanine');
    s += Tag(P(87, 226), 'NH₂ on the left');
    s += Tag(P(253, 226), 'NH₂ on the right');
    s += Tag(P(87, 242), 'in proteins');
    s += Tag(P(253, 242), 'the mirror image');
    return s;
  },
  caption: 'Alanine in Fischer projection, carboxyl at the top and side chain at the bottom. Only the side the amino group sits on differs.',
});

/* ======================================================================
   11. CORN, read with the H toward you and then away from you.
   ====================================================================== */
/* L-alanine drawn two ways. In pose 'toward', COOH is up and H2N lower
   left in the plane, CH3 on a hash and H on a wedge. In pose 'away', COOH
   is up and the side chain lower left in the plane, NH2 on a wedge and H
   on a hash. Both are the S (L) enantiomer. */
function tetra(c, pose, sideLab, marks) {
  const L = 56;
  const g = pose === 'toward'
    ? [{ deg: 90, lab: 'COOH', kind: 'plain', key: 'co' }, { deg: 210, lab: 'H₂N', kind: 'plain', key: 'n' },
       { deg: 290, lab: sideLab, kind: 'hash', key: 'r' }, { deg: 340, lab: 'H', kind: 'wedge', key: 'h' }]
    : [{ deg: 90, lab: 'COOH', kind: 'plain', key: 'co' }, { deg: 210, lab: sideLab, kind: 'plain', key: 'r' },
       { deg: 340, lab: 'NH₂', kind: 'wedge', key: 'n' }, { deg: 290, lab: 'H', kind: 'hash', key: 'h' }];
  let s = center(c, g.map((a) => ({ deg: a.deg, len: L, kind: a.kind === 'plain' ? undefined : a.kind, rFrom: 15, rTo: a.kind === 'plain' ? rOf(a.lab) : 0 })));
  for (const a of g) {
    const p = armEnd(c, a.deg, L);
    s += A(p, a.lab, { kind: a.key === 'h' ? 'hi' : undefined });
    if (marks && marks[a.key]) {
      const q = armEnd(c, a.deg, L + 30);
      s += text(q.x, q.y + 4, marks[a.key], { cls: 'fg-tag-good', size: 11 });
    }
  }
  s += A(c, 'C');
  return { s, deg: Object.fromEntries(g.map((a) => [a.key, a.deg])) };
}

function cornCell(ox, oy, w, h, pose) {
  const c = P(ox + w / 2, oy + 132);
  let s = panel(ox, oy, w, h, pose === 'toward' ? { kind: 'hi' } : {});
  s += Tag(P(ox + w / 2, oy + 22), pose === 'toward' ? 'H toward you (wedge)' : 'H away from you (hash)');
  const t = tetra(c, pose, 'CH₃', { co: 'CO', r: 'R', n: 'N' });
  s += t.s;
  if (pose === 'toward') s += arcArrow(c, 104, 80, 222, true);
  else s += arcArrow(c, 104, 100, 330, false);
  s += Good(P(ox + w / 2, oy + h - 30), pose === 'toward' ? 'CO → R → N clockwise' : 'CO → R → N counterclockwise');
  s += Tag(P(ox + w / 2, oy + h - 12), 'L-alanine both times');
  return s;
}

FIGURES.push({
  id: 'corn-rule',
  section: 'amino-acids',
  anchor: 'CORN',
  alt: 'L-alanine drawn twice in wedge and dash. Left, with the H on a wedge pointing toward the viewer: COOH at the top, CH3 lower right on a hash, H2N lower left; a clockwise arrow runs from CO to R to N. Right, the same molecule turned so the H is on a hash pointing away: now CO to R to N runs counterclockwise.',
  viewBox: '0 0 680 316',
  build() {
    return cornCell(8, 8, 324, 300, 'toward') + cornCell(348, 8, 324, 300, 'away');
  },
  caption: 'The CORN reading for L-alanine. The direction flips when you view the same molecule from the other side.',
});

/* ======================================================================
   12. L-alanine is S; L-cysteine is R.
   ====================================================================== */
function rsCell(ox, oy, w, h, which) {
  const c = P(ox + w / 2, oy + 134);
  const ala = which === 'ala';
  let s = panel(ox, oy, w, h, ala ? {} : { kind: 'hi' });
  s += Tag(P(ox + w / 2, oy + 22), ala ? 'L-alanine' : 'L-cysteine');
  const t = tetra(c, 'away', ala ? 'CH₃' : 'CH₂SH', ala ? { n: '1', co: '2', r: '3' } : { n: '1', r: '2', co: '3' });
  s += t.s;
  // 1 → 2 → 3, with H (4) on the hash pointing away
  if (ala) s += arcArrow(c, 106, 320, 105, false);
  else s += arcArrow(c, 106, 320, 225, true);
  s += Good(P(ox + w / 2, oy + h - 30), ala ? '1 → 2 → 3 counterclockwise: S' : '1 → 2 → 3 clockwise: R');
  s += Tag(P(ox + w / 2, oy + h - 12), ala ? 'COOH (O, O, O) beats CH₃' : 'CH₂SH (S, H, H) beats COOH');
  return s;
}

FIGURES.push({
  id: 'alanine-cysteine-rs',
  section: 'amino-acids',
  anchor: 'cysteine',
  alt: 'L-alanine and L-cysteine drawn in the same pose, with the H on a hash pointing away. In alanine the priorities are NH2 1, COOH 2, CH3 3, and 1 to 2 to 3 runs counterclockwise, so it is S. In cysteine the CH2SH group outranks COOH because sulfur beats oxygen, so the priorities are NH2 1, CH2SH 2, COOH 3, and 1 to 2 to 3 runs clockwise, so it is R.',
  viewBox: '0 0 680 316',
  build() {
    return rsCell(8, 8, 324, 300, 'ala') + rsCell(348, 8, 324, 300, 'cys');
  },
  caption: 'The same shape, two different R/S labels. The green numbers are CIP priorities; H is priority 4 and points away.',
});

FIGURES.push({
  id: 'l-alanine-cysteine-rs',
  lessons: ['amino-acids'],
  alt: 'L-alanine above and L-cysteine below, in the same pose with the H pointing away. Alanine: NH2 1, COOH 2, CH3 3, counterclockwise, S. Cysteine: NH2 1, CH2SH 2, COOH 3, clockwise, R.',
  viewBox: '0 0 340 624',
  build() {
    return rsCell(8, 8, 324, 300, 'ala') + rsCell(8, 316, 324, 300, 'cys');
  },
  caption: 'The same shape, two different R/S labels. The green numbers are CIP priorities; H is priority 4 and points away.',
});

/* ======================================================================
   13–15. Three laboratory routes to racemic alanine.
   ====================================================================== */
/* A three-carbon unit drawn as discs: left – middle – right, with an
   optional group hanging below the middle. */
function trio(c, left, mid, right, below, hi = []) {
  const l = P(c.x - 52, c.y), r = P(c.x + 54, c.y), b = P(c.x, c.y + 48);
  let s = B(l, c, left, mid) + B(c, r, mid, right);
  if (below) s += B(c, b, mid, below) + A(b, below, { kind: hi.includes('below') ? 'hi' : undefined });
  s += A(l, left) + A(c, mid, { kind: hi.includes('mid') ? 'hi' : undefined }) + A(r, right, { kind: hi.includes('right') ? 'hi' : undefined });
  return s;
}
const step = (x1, x2, y, top, bot) =>
  arrow(P(x1, y), P(x2, y), { size: 7 }) + Tag(P((x1 + x2) / 2, y - 12), top) + (bot ? Tag(P((x1 + x2) / 2, y + 20), bot) : '');
const ALA = (c) => trio(c, 'CH₃', 'CH', 'COO⁻', 'NH₃⁺', ['below']);

FIGURES.push({
  id: 'synth-hvz',
  section: 'amino-acids',
  anchor: 'Hell–Volhard–Zelinsky',
  alt: 'Propanoic acid, CH3–CH2–COOH, reacts with Br2 and PBr3 then water to give 2-bromopropanoic acid, with Br on the alpha carbon. Excess NH3 then displaces the bromide to give alanine, with NH3 plus on the alpha carbon.',
  viewBox: '0 0 760 150',
  build() {
    let s = '';
    s += trio(P(86, 56), 'CH₃', 'CH₂', 'COOH');
    s += Tag(P(86, 120), 'propanoic acid');
    s += step(170, 290, 56, 'Br₂, PBr₃', 'then H₂O');
    s += trio(P(376, 56), 'CH₃', 'CH', 'COOH', 'Br', ['below']);
    s += Tag(P(376, 136), 'α-bromo acid');
    s += step(462, 578, 56, 'NH₃ (excess)', 'Sₙ2');
    s += ALA(P(664, 56));
    s += Good(P(664, 136), 'alanine (racemic)');
    return s;
  },
  caption: 'Route 1: bromine goes onto the α carbon, then ammonia replaces it.',
});

FIGURES.push({
  id: 'synth-gabriel-malonic',
  section: 'amino-acids',
  anchor: 'Gabriel–malonic',
  alt: 'Diethyl phthalimidomalonate: a central CH carrying a phthalimide nitrogen, written PhthN, and two CO2Et groups. Treatment with NaOEt then CH3I puts a methyl on the central carbon. Hot aqueous acid then hydrolyzes the esters and the phthalimide and removes one carboxyl as CO2, giving alanine.',
  viewBox: '0 0 760 170',
  build() {
    let s = '';
    s += trio(P(90, 56), 'PhthN', 'CH', 'CO₂Et', 'CO₂Et');
    s += Tag(P(90, 140), 'phthalimidomalonate');
    s += step(176, 290, 56, '1. NaOEt', '2. CH₃I');
    s += trio(P(378, 56), 'PhthN', 'C', 'CO₂Et', 'CO₂Et');
    s += A(P(378, 14), 'CH₃', { kind: 'hi' }) + B(P(378, 56), P(378, 14), 'C', 'CH₃');
    s += step(464, 578, 56, 'H₃O⁺, heat', '− CO₂');
    s += ALA(P(664, 56));
    s += Good(P(664, 140), 'alanine (racemic)');
    s += Tag(P(378, 140), 'methyl added');
    return s;
  },
  caption: 'Route 2: the side chain arrives as an alkyl halide, and hot acid then strips off everything that is not alanine.',
});

FIGURES.push({
  id: 'synth-strecker',
  section: 'amino-acids',
  anchor: 'Strecker',
  alt: 'Acetaldehyde, CH3–CHO, with NH3 forms an imine, CH3–CH=NH. Cyanide adds to the imine carbon to give an alpha-amino nitrile, CH3–CH(NH2)–C≡N. Hot aqueous acid hydrolyzes the nitrile to the carboxylic acid, giving alanine.',
  viewBox: '0 0 760 160',
  build() {
    let s = '';
    // acetaldehyde: CH3–C(=O)H drawn with the O above
    const a = P(64, 76);
    s += B(P(22, 76), a, 'CH₃', 'CH') + A(P(22, 76), 'CH₃');
    s += bond(a, P(a.x, 30), { rFrom: 16, rTo: 15, order: 2 }) + A(P(a.x, 30), 'O');
    s += A(a, 'CH', { kind: 'hi' });
    s += Tag(P(46, 136), 'acetaldehyde');
    s += step(96, 170, 76, 'NH₃');
    const im = P(234, 76);
    s += B(P(192, 76), im, 'CH₃', 'CH') + A(P(192, 76), 'CH₃');
    s += bond(im, P(im.x, 30), { rFrom: 16, rTo: 16, order: 2 }) + A(P(im.x, 30), 'NH', { kind: 'hi' });
    s += A(im, 'CH', { kind: 'hi' });
    s += Tag(P(216, 136), 'imine');
    s += step(270, 364, 76, 'HCN');
    const nc = P(436, 60);
    s += B(P(386, 60), nc, 'CH₃', 'CH') + A(P(386, 60), 'CH₃');
    s += B(nc, P(nc.x, 108), 'CH', 'NH₂') + A(P(nc.x, 108), 'NH₂');
    s += bond(nc, P(nc.x + 50, 60), { rFrom: 16, rTo: 15 }) + A(P(nc.x + 50, 60), 'C', { kind: 'hi' });
    s += bond(P(nc.x + 50, 60), P(nc.x + 94, 60), { rFrom: 15, rTo: 15, order: 3 }) + A(P(nc.x + 94, 60), 'N', { kind: 'hi' });
    s += A(nc, 'CH');
    s += Tag(P(452, 146), 'α-amino nitrile');
    s += step(548, 612, 60, 'H₃O⁺', 'heat');
    s += ALA(P(686, 60));
    s += Good(P(686, 146), 'alanine (racemic)');
    return s;
  },
  caption: 'Route 3: the aldehyde and ammonia form an imine, cyanide adds to it, and hydrolysis turns the C≡N into the carboxyl.',
});

export default FIGURES;
