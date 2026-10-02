/* Figures for the cyclopropanation notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure is drawn 360 wide with its panels stacked, so the same
   drawing serves the notes page and the lesson step it sits in. Alkenes are
   drawn with their C=C horizontal; each cyclopropane is a triangle with the
   two former alkene carbons along the bottom edge and the new carbon at the
   apex, so a carbon can be followed from alkene to ring by position. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, rule, P } from '../lib/ochem-figure.mjs';
import { polyPts, ringDouble } from '../lib/ochem-skeletal.mjs';
import { lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const r1 = (v) => Math.round(v * 10) / 10;
const RAD = Math.PI / 180;
const off = (p, deg, len) => P(r1(p.x + Math.cos(deg * RAD) * len), r1(p.y - Math.sin(deg * RAD) * len));
const sk = (a, b, cls) => bond(a, b, { rFrom: 0, rTo: 0, cls: cls || 'fg-bond' });

/* A labeled group on a skeletal vertex: plain bond, wedge or hash. */
function grp(p, deg, lbl, kind, len = 34) {
  const end = off(p, deg, len);
  const r = lbl.length > 2 ? 17 : 11;
  const b = kind === 'wedge' ? wedge(p, end, { rFrom: 0, rTo: r, width: 9 })
    : kind === 'hash' ? hash(p, end, { rFrom: 0, rTo: r, width: 10, rungs: 5 })
    : bond(p, end, { rFrom: 0, rTo: r });
  return b + atom(end.x, end.y, lbl, { r });
}

/* An alkene CH3–CH=CH–CH3 centered at (cx, cy); cis puts both methyls up. */
function butene(cx, cy, cis) {
  const a = P(cx - 22, cy), b = P(cx + 22, cy);
  let s = bond(a, b, { order: 2, rFrom: 0, rTo: 0 });
  s += grp(a, 120, 'CH₃');
  s += grp(b, cis ? 60 : -60, 'CH₃');
  s += grp(a, -120, 'H', null, 26) + grp(b, cis ? -60 : 60, 'H', null, 26);
  return s;
}

/* The ring: bottom edge a–b (the old alkene carbons), apex c (the new one). */
function ring(cx, cy, apex, cisMethyls) {
  const a = P(cx - 24, cy), b = P(cx + 24, cy), c = P(cx, cy - 40);
  let s = sk(a, b) + sk(b, c, 'fg-bond-hi') + sk(c, a, 'fg-bond-hi');
  if (apex) s += atom(c.x, c.y - 14, apex, { kind: 'point', size: 12 });
  s += grp(a, -135, 'CH₃', 'wedge');
  s += grp(b, -45, 'CH₃', cisMethyls ? 'wedge' : 'hash');
  return s;
}

function synRow(y, cis) {
  let s = butene(70, y, cis);
  s += text(70, y + 62, cis ? 'cis-but-2-ene' : 'trans-but-2-ene', { cls: 'fg-tag' });
  s += arrow(P(132, y + 2), P(206, y + 2), { size: 8 });
  s += text(169, y - 10, 'CH₂I₂', { cls: 'fg-tag-mut' });
  s += text(169, y + 20, 'Zn(Cu)', { cls: 'fg-tag-mut' });
  s += ring(282, y + 18, 'CH₂', cis);
  s += text(282, y + 72, cis ? 'cis ring, meso' : 'trans ring, racemic', { cls: cis ? 'fg-tag-good' : 'fg-tag' });
  return s;
}

FIGURES.push({
  id: 'cp-syn-stereo',
  section: 'cyclopropanation',
  lessons: ['cyclopropanation'],
  anchor: 'Cyclopropanation is stereospecific',
  alt: 'Top: cis-but-2-ene, with both methyl groups on the upper side of the double bond, reacts with CH2I2 and Zn(Cu) to give a cyclopropane drawn as a triangle with the new CH2 at the apex and both methyls on wedges: the cis ring, which is meso. Bottom: trans-but-2-ene, with one methyl up and one down, gives the ring with one methyl on a wedge and one on a hashed bond: the trans ring, formed as a racemate. The two new ring bonds are in color.',
  viewBox: '0 0 360 300',
  build() {
    let s = synRow(70, true);
    s += rule(16, 150, 344, 150);
    s += synRow(214, false);
    return s;
  },
  caption: 'The two bonds in color are new. A cis alkene gives the cis ring and a trans alkene the trans ring: both bonds form in one step, so nothing rotates.',
});

/* ---------------------------------------------------------------------
   The singlet carbene: two bonds and a lone pair in the plane of the page,
   and an empty p orbital standing out of the page (drawn in perspective as
   two dashed lobes). */
function carbene(cx, cy, sub, title) {
  const C = P(cx, cy);
  let s = '';
  // the empty p orbital, toward and away from the reader
  const e = (x, y, deg) => `<ellipse class="fg-orb-node" cx="${r1(x)}" cy="${r1(y)}" rx="22" ry="9" transform="rotate(${deg} ${r1(x)} ${r1(y)})"></ellipse>`;
  s += e(cx - 25, cy + 9, -20) + e(cx + 25, cy - 9, -20);
  // the sp2 lone pair, pointing up in the plane
  s += lobeE(cx, cy - 34, 11, 20, 'fg-orb');
  s += lonePair(cx, cy - 34, 90, { dist: 0, spread: 5 });
  // two bonds, down-left and down-right
  s += grp(C, -130, sub, null, 40) + grp(C, -50, sub, null, 40);
  s += atom(cx, cy, 'C', { r: 13 });
  s += text(cx, 24, title, { cls: 'fg-lbl', size: 13 });
  return s;
}

FIGURES.push({
  id: 'cp-carbene-orbitals',
  section: 'cyclopropanation',
  lessons: ['cyclopropanation'],
  anchor: 'is called a <b>singlet carbene</b>.</p>',
  alt: 'Two singlet carbenes, methylene CH2 and dichlorocarbene CCl2. In each, the carbon has two bonds pointing down-left and down-right, a filled lobe pointing straight up holding two dots for the lone pair, and a dashed p orbital drawn in perspective, one lobe in front of the page and one behind, labeled empty.',
  viewBox: '0 0 360 220',
  build() {
    let s = carbene(90, 110, 'H', ':CH₂');
    s += carbene(270, 110, 'Cl', ':CCl₂');
    s += rule(180, 30, 180, 190);
    s += text(180, 206, 'filled lobe: the lone pair (sp²) · dashed lobes: the empty p orbital', { cls: 'fg-tag-mut', size: 10.5 });
    return s;
  },
  caption: 'Like a nucleophile, the carbon has a lone pair; like a carbocation, it has an empty p orbital. The dashed p orbital points out of the page, at right angles to the lone pair.',
});

/* ---------------------------------------------------------------------
   Dichlorocarbene from chloroform: deprotonation, then loss of chloride
   from the same carbon, then the carbene bridges cyclohexene. */
function trichloro(cx, cy, withH) {
  const C = P(cx, cy);
  let s = '';
  s += grp(C, 180, 'Cl', null, 36) + grp(C, 0, 'Cl', null, 36) + grp(C, -90, 'Cl', null, 36);
  if (withH) s += grp(C, 90, 'H', null, 32);
  s += atom(cx, cy, 'C', { r: 13 });
  return s;
}

FIGURES.push({
  id: 'cp-dichlorocarbene',
  section: 'cyclopropanation',
  lessons: ['cyclopropanation'],
  anchor: 'which is a &beta;-elimination and makes a C=C instead.</p>',
  alt: 'Three rows. Row 1: chloroform, a carbon with one hydrogen and three chlorines, and tert-butoxide; a curved arrow runs from the oxygen lone pair to the hydrogen and a second from the C–H bond onto the carbon, giving the trichloromethyl anion and tert-butanol. Row 2: the trichloromethyl anion, with a lone pair on carbon, loses chloride; a curved arrow runs from one C–Cl bond onto the chlorine, leaving dichlorocarbene with its lone pair. Row 3: dichlorocarbene adds to cyclohexene to give 7,7-dichlorobicyclo[4.1.0]heptane, a six-membered ring fused to a three-membered ring whose apex carbon carries two chlorines.',
  viewBox: '0 0 360 420',
  build() {
    let s = '';
    // Row 1: deprotonation
    s += text(180, 20, '1. The base takes the H', { cls: 'fg-lbl', size: 13 });
    s += trichloro(70, 90, true);
    s += atom(160, 58, '⁻OC(CH₃)₃', { kind: 'point', size: 11 });
    s += lonePair(122, 60, 180, { dist: 0 });
    s += curve(P(124, 66), P(84, 58), { bow: -14 });
    s += curve(P(76, 72), P(80, 92), { bow: -12 });
    s += arrow(P(204, 90), P(244, 90), { size: 8 });
    s += trichloro(300, 90, false);
    s += lonePair(300, 90, -90, { dist: 20 }) + text(316, 76, '−', { cls: 'fg-warn', size: 15 });
    s += text(300, 46, 'Cl₃C⁻', { cls: 'fg-tag' });
    s += rule(16, 150, 344, 150);
    // Row 2: alpha-elimination
    s += text(180, 170, '2. The same carbon loses Cl⁻ (α-elimination)', { cls: 'fg-lbl', size: 13 });
    s += trichloro(70, 225, false);
    s += lonePair(70, 225, -90, { dist: 20 }) + text(86, 211, '−', { cls: 'fg-warn', size: 15 });
    s += curve(P(88, 228), P(104, 222), { bow: 10 });
    s += arrow(P(140, 225), P(186, 225), { size: 8 });
    // :CCl2
    const D = P(250, 225);
    s += grp(D, -130, 'Cl', null, 36) + grp(D, -50, 'Cl', null, 36);
    s += atom(D.x, D.y, 'C', { r: 13 });
    s += lonePair(D.x, D.y, -90, { dist: 20 });
    s += text(306, 212, ':CCl₂', { cls: 'fg-tag-good' });
    s += text(306, 244, '+ Cl⁻', { cls: 'fg-lbl', size: 12.5 });
    s += rule(16, 284, 344, 284);
    // Row 3: addition to cyclohexene
    s += text(180, 304, '3. One syn step across the C=C', { cls: 'fg-lbl', size: 13 });
    const h1 = polyPts(70, 362, 6, 30, 90);
    for (let i = 0; i < 6; i++) {
      const a = h1[i], b = h1[(i + 1) % 6];
      s += i === 4 ? ringDouble(a, b, P(70, 362), { inset: 6 }) : sk(a, b);
    }
    s += arrow(P(118, 362), P(172, 362), { size: 8 });
    s += text(145, 350, ':CCl₂', { cls: 'fg-tag-mut' });
    const h2 = polyPts(240, 362, 6, 30, 90);
    for (let i = 0; i < 6; i++) s += sk(h2[i], h2[(i + 1) % 6]);
    // h2[4] and h2[5] are the lower-right edge; bridge them with the new carbon
    const x = P(r1((h2[4].x + h2[5].x) / 2 + 28), r1((h2[4].y + h2[5].y) / 2));
    s += sk(h2[4], x, 'fg-bond-hi') + sk(h2[5], x, 'fg-bond-hi');
    s += grp(x, 35, 'Cl', null, 30) + grp(x, -35, 'Cl', null, 30);
    s += text(240, 412, '7,7-dichlorobicyclo[4.1.0]heptane', { cls: 'fg-tag' });
    return s;
  },
  caption: 'Steps 1 and 2 make the carbene from chloroform; step 3 is the cyclopropanation. Both new ring bonds (in color) form at once.',
});

export default FIGURES;
