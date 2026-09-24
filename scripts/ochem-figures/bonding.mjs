/* Figures for the bonding notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Bonding sits in Foundations, before skeletal structures, so every drawing
   writes every atom out with its label. The orbital colours follow the
   Hybridization page: a hybrid orbital is grey, and a leftover p orbital is
   drawn in the two phase colours. Every figure here is 340 wide or less,
   stacked, and uses only fg-lbl and fg-tag text, so the same drawing can sit
   in the notes and in a lesson step. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
/* Screen direction for a math angle: 0 is east, 90 is up. */
const dir = (deg) => ({ x: Math.cos(rad(deg)), y: -Math.sin(rad(deg)) });
const at = (c, deg, len) => { const d = dir(deg); return P(c.x + d.x * len, c.y + d.y * len); };
const r2 = (v) => Math.round(v * 100) / 100;

function ell(cx, cy, rx, ry, deg, cls, extra = '') {
  return `<ellipse class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" transform="rotate(${r2(-deg)} ${r2(cx)} ${r2(cy)})"${extra}></ellipse>`;
}
/* A hybrid orbital: one big grey lobe pointing along `deg`, plus the small
   back lobe every hybrid has. `len` is how far the big lobe reaches. */
function hybrid(c, deg, len = 56, w = 14) {
  const d = dir(deg);
  const big = P(c.x + d.x * len * 0.54, c.y + d.y * len * 0.54);
  const small = P(c.x - d.x * len * 0.1, c.y - d.y * len * 0.1);
  return ell(small.x, small.y, len * 0.13, w * 0.5, deg, 'fg-fill-mut fg-bond-soft', ' fill-opacity="0.24"') +
         ell(big.x, big.y, len * 0.5, w, deg, 'fg-fill-mut fg-bond-soft', ' fill-opacity="0.24"');
}
/* A p orbital: two lobes on opposite sides of the nucleus, one in each
   phase colour. */
function pOrb(c, deg, len = 48, w = 13) {
  const d = dir(deg);
  const a = P(c.x + d.x * len * 0.52, c.y + d.y * len * 0.52);
  const b = P(c.x - d.x * len * 0.52, c.y - d.y * len * 0.52);
  return ell(a.x, a.y, len * 0.5, w, deg, 'fg-orb') + ell(b.x, b.y, len * 0.5, w, deg, 'fg-orb-alt');
}
/* The outline of one pi cloud: a dashed rounded box around two lobes. */
const cloud = (x1, y1, x2, y2) =>
  `<rect class="fg-dash-hi" x="${r2(x1)}" y="${r2(y1)}" width="${r2(x2 - x1)}" height="${r2(y2 - y1)}" rx="${r2(Math.min(24, (y2 - y1) / 2))}" fill="none"></rect>`;
/* A group label too long for an atom disc, drawn in a rounded box. */
const pill = (x, y, lbl, w) =>
  `<rect class="fg-atom" x="${r2(x - w / 2)}" y="${r2(y - 15)}" width="${w}" height="30" rx="15"></rect>` + atom(x, y, lbl, { kind: 'point' });
const dot = (x, y) => `<circle class="fg-lp" cx="${r2(x)}" cy="${r2(y)}" r="2.4"></circle>`;
const Hr = 11, Cr = 14;
const H = (p, kind) => atom(p.x, p.y, 'H', { r: Hr, ...(kind ? { kind } : {}) });
const C = (p, lbl = 'C') => atom(p.x, p.y, lbl, { r: Cr });
const sb = (a, b, ra = Cr, rb = Hr, o = {}) => bond(a, b, { rFrom: ra, rTo: rb, ...o });
/* A label with an italic prefix, e.g. <i>cis</i>-2-butene. */
const italicLabel = (x, y, it, rest) =>
  `<text class="fg-lbl" x="${x}" y="${y}" text-anchor="middle" font-size="13"><tspan font-style="italic">${it}</tspan>${rest}</text>`;

/* ------------------------------------------------------ sigma-overlaps ---
   The four head-on overlaps the Sigma section names, one per row, with the
   carbon's s-character beside each. Distances between nuclei are to scale
   (0.9 px per pm); the lobes shorten as s-character rises. */
FIGURES.push({
  id: 'sigma-overlaps',
  section: 'bonding',
  anchor: 'is <b>sp–sp</b>.</p>',
  lessons: ['bonding'],
  viewBox: '0 0 340 330',
  alt: 'Four sigma bonds, one per row, each drawn as two orbitals meeting end to end on a dashed line through both nuclei. Row 1: a gray sp3 lobe on carbon meets the round 1s orbital of hydrogen, for a C–H bond of methane. Row 2: two sp3 lobes meet, for the C–C bond of ethane. Row 3: two sp2 lobes meet, for the sigma part of the C=C bond of ethene. Row 4: two sp lobes meet, for the sigma part of the C≡C bond of ethyne. The carbons get closer together and the lobes shorter from row 2 to row 4. The s-character is written beside each row: 25, 25, 33 and 50 percent.',
  build() {
    let s = '';
    const rows = [
      { t: 'C–H of methane: sp³ meets 1s', d: 98, len: 80, h: true, sc: '25% s' },
      { t: 'C–C of ethane: sp³ meets sp³', d: 139, len: 86, sc: '25% s' },
      { t: 'σ part of ethene’s C=C: sp² meets sp²', d: 121, len: 75, sc: '33% s' },
      { t: 'σ part of ethyne’s C≡C: sp meets sp', d: 108, len: 67, sc: '50% s' },
    ];
    rows.forEach((r, i) => {
      const y = 18 + i * 82, cy = y + 34;
      const A = P(90, cy), B = P(90 + r.d, cy);
      s += text(10, y, r.t, { cls: 'fg-tag', anchor: 'start' });
      s += `<line class="fg-dash" x1="24" y1="${cy}" x2="262" y2="${cy}"></line>`;
      s += hybrid(A, 0, r.len, 15);
      if (r.h) {
        s += `<circle class="fg-orb" cx="${B.x}" cy="${cy}" r="26"></circle>`;
        s += C(A) + H(B);
        s += text(10, cy + 20, 'bond axis', { cls: 'fg-tag-mut', anchor: 'start' });
      } else {
        s += hybrid(B, 180, r.len, 15);
        s += C(A) + C(B);
      }
      s += text(332, cy + 4, r.sc, { cls: 'fg-tag', anchor: 'end' });
    });
    return s;
  },
  caption: 'Gray lobes are hybrid orbitals; the green disc is hydrogen’s 1s. In every row the overlap sits on the dashed line through both nuclei. The carbons in rows 3 and 4 sit closer mostly because of their π bonds, which are not drawn here; s-character adds a smaller part.',
});

/* ------------------------------------------------------ sigma-rotation ---
   Ethane side on, before and after the right-hand carbon turns half a
   turn. One hydrogen is highlighted so the turn can be followed; the grey
   head-on overlap between the carbons is drawn identically in both rows. */
function ethaneSide(cy, turned) {
  const A = P(110, cy), B = P(210, cy);
  let s = hybrid(A, 0, 66, 13) + hybrid(B, 180, 66, 13);
  // left carbon: up (in page), lower left (toward you), below (away)
  const L = [[P(96, cy - 46), 'b'], [P(64, cy + 24), 'w'], [P(96, cy + 46), 'h']];
  const R = turned
    ? [[P(224, cy + 46), 'b', 'hi'], [P(256, cy - 24), 'h'], [P(224, cy - 46), 'w']]
    : [[P(224, cy - 46), 'b', 'hi'], [P(256, cy + 24), 'w'], [P(224, cy + 46), 'h']];
  const draw = (c, [p, k, kind]) => {
    const o = { rFrom: Cr, rTo: Hr };
    return (k === 'w' ? wedge(c, p, { ...o, width: 8 }) : k === 'h' ? hash(c, p, { ...o, width: 9, rungs: 4 }) : bond(c, p, o)) + H(p, kind);
  };
  L.forEach((h) => { s += draw(A, h); });
  R.forEach((h) => { s += draw(B, h); });
  s += C(A) + C(B);
  return s;
}
FIGURES.push({
  id: 'sigma-rotation',
  section: 'bonding',
  anchor: 'rotation around a single bond is free</b>.</p>',
  lessons: ['bonding'],
  viewBox: '0 0 340 316',
  alt: 'Ethane drawn side on twice, with its C–C sigma bond shown as two gray hybrid lobes meeting head-on between the carbons. Each carbon carries three labeled hydrogens: one in the page, one on a solid wedge and one on a hashed wedge. In the top drawing the highlighted hydrogen on the right carbon points up; a curved arrow shows the right carbon turning about the bond axis. In the bottom drawing it has turned half a turn: the highlighted hydrogen points down and the wedge and hash have swapped places. The overlap between the carbons is drawn the same in both.',
  build() {
    let s = '';
    s += text(10, 18, 'before', { cls: 'fg-tag-mut', anchor: 'start' });
    s += ethaneSide(84, false);
    s += curve(P(292, 60), P(292, 108), { bow: -16, size: 7 });
    s += text(322, 88, 'turn', { cls: 'fg-tag' });
    s += rule(10, 150, 330, 150);
    s += text(10, 170, 'after half a turn of the right carbon', { cls: 'fg-tag-mut', anchor: 'start' });
    s += ethaneSide(228, true);
    s += text(170, 306, 'σ overlap unchanged: rotation is free', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Follow the highlighted hydrogen: it has moved from top to bottom. The gray overlap between the two carbons has not changed at all.',
});

/* --------------------------------------------------------- pi-overlap ---
   Ethene in perspective. The dashed parallelogram is the plane that holds
   both carbons and all four hydrogens; the p orbitals stand straight up
   through it, and the two dashed outlines are the two clouds of the one
   pi bond. Screen position of a point (u along C–C, v across the plane):
   x = 170 + u + 0.15 v, y = 140 − 0.4 v. */
const pv = (u, v, y0 = 140) => P(170 + u + 0.15 * v, y0 - 0.4 * v);
function ethenePerspective(y0) {
  let s = '';
  const C1 = pv(-40, 0, y0), C2 = pv(40, 0, y0);
  const hs = [[C1, pv(-84, 60, y0)], [C1, pv(-84, -60, y0)], [C2, pv(84, 60, y0)], [C2, pv(84, -60, y0)]];
  s += `<path class="fg-dash" d="M${pv(-130, -85, y0).x} ${pv(-130, -85, y0).y} L${pv(130, -85, y0).x} ${pv(130, -85, y0).y} L${pv(130, 85, y0).x} ${pv(130, 85, y0).y} L${pv(-130, 85, y0).x} ${pv(-130, 85, y0).y} Z"></path>`;
  hs.forEach(([c, h]) => { s += sb(c, h); });
  s += sb(C1, C2, Cr, Cr);
  s += pOrb(C1, 90, 58, 13) + pOrb(C2, 90, 58, 13);
  s += cloud(112, y0 - 64, 228, y0 - 8) + cloud(112, y0 + 8, 228, y0 + 64);
  hs.forEach(([, h]) => { s += H(h); });
  s += C(C1) + C(C2);
  return s;
}
FIGURES.push({
  id: 'pi-overlap',
  section: 'bonding',
  anchor: 'Nothing of it lies on the bond axis itself.</p>',
  lessons: ['bonding'],
  viewBox: '0 0 340 252',
  alt: 'Ethene drawn in perspective. A dashed parallelogram marks one flat plane holding both carbons and all four hydrogens, every atom labeled. On each carbon a p orbital stands straight up through the plane, one lobe above and one below. The two upper lobes sit side by side inside one dashed outline labeled upper pi cloud, and the two lower lobes inside another labeled lower pi cloud. A label at the bottom says the pi bond is both clouds together.',
  build() {
    let s = ethenePerspective(140);
    s += text(56, 90, 'p orbital', { cls: 'fg-tag' });
    s += `<line class="fg-bond-soft" x1="90" y1="92" x2="118" y2="104"></line>`;
    s += text(288, 90, 'upper π cloud', { cls: 'fg-tag' });
    s += text(288, 214, 'lower π cloud', { cls: 'fg-tag' });
    s += text(60, 214, 'the plane', { cls: 'fg-tag-mut' });
    s += text(170, 244, 'one π bond = both clouds together', { cls: 'fg-tag' });
    return s;
  },
  caption: 'The dashed parallelogram is the flat plane of the six atoms. The two dashed outlines mark the two clouds of the one π bond. The two shades mark the two halves (phases) of each p orbital.',
});

/* --------------------------------------------------------- pi-rotation ---
   Ethene drawn flat in the page, so each p orbital points straight out at
   the reader (a disc). After a quarter turn of the right carbon its p
   orbital lies up-and-down in the page and its hydrogens point toward and
   away from the reader: the two p orbitals are now at right angles. */
function ethenePage(cy, turned) {
  const C1 = P(125, cy), C2 = P(215, cy);
  let s = '';
  const h1 = [at(C1, 150, 50), at(C1, 210, 50)];
  s += `<circle class="fg-orb" cx="${C1.x}" cy="${cy}" r="23"></circle>`;
  if (!turned) {
    s += `<circle class="fg-orb" cx="${C2.x}" cy="${cy}" r="23"></circle>`;
    s += cloud(96, cy - 30, 244, cy + 30);
    s += sb(C1, C2, Cr, Cr, { order: 2 });
    const h2 = [at(C2, 30, 50), at(C2, 330, 50)];
    h2.forEach((h) => { s += sb(C2, h) + H(h); });
  } else {
    s += pOrb(C2, 90, 44, 13);
    s += sb(C1, C2, Cr, Cr);
    const hw = P(262, cy + 18), hh = P(262, cy - 18);
    s += wedge(C2, hw, { rFrom: Cr, rTo: Hr, width: 8 }) + H(hw);
    s += hash(C2, hh, { rFrom: Cr, rTo: Hr, width: 9, rungs: 4 }) + H(hh);
  }
  h1.forEach((h) => { s += sb(C1, h) + H(h); });
  s += C(C1) + C(C2);
  return s;
}
FIGURES.push({
  id: 'pi-rotation',
  section: 'bonding',
  anchor: 'So the two ends of a double bond stay locked.</p>',
  lessons: ['bonding'],
  viewBox: '0 0 340 304',
  alt: 'Ethene drawn twice, flat in the page, every atom labeled. Top: each carbon carries a disc, its p orbital pointing straight out of the page at the reader; a dashed outline around both discs marks their overlap, the pi bond, and the carbons are joined by a double bond. Bottom: the right carbon has turned a quarter turn. Its two hydrogens now sit on a wedge and a hash, and its p orbital lies up and down in the page, while the left carbon still has a disc pointing out of the page. The two p orbitals are at right angles, the carbons are joined by a single line, and a label says there is no overlap and no pi bond.',
  build() {
    let s = '';
    s += text(10, 18, 'before: both p orbitals point out of the page', { cls: 'fg-tag-mut', anchor: 'start' });
    s += ethenePage(82, false);
    s += text(170, 134, 'π overlap (dashed)', { cls: 'fg-tag' });
    s += rule(10, 150, 330, 150);
    s += text(10, 172, 'after a quarter turn of the right carbon', { cls: 'fg-tag-mut', anchor: 'start' });
    s += ethenePage(226, true);
    s += curve(P(304, 202), P(304, 250), { bow: -14, size: 7 });
    s += text(170, 294, 'p orbitals at 90°: no overlap, no π bond', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Top: the discs are p orbitals seen end-on, pointing at you. Bottom: the right carbon’s p orbital now runs up and down the page, at right angles to the left one.',
});

/* ------------------------------------------------------ l-click-bond ---
   Lesson only: the clickable version of a C=C. The head-on sigma overlap
   on the axis and the two pi clouds are separate .hit groups, so the
   lesson can ask which one breaks when a carbon is twisted. */
FIGURES.push({
  id: 'l-click-bond',
  lessons: ['bonding'],
  viewBox: '0 0 340 230',
  alt: 'Ethene in perspective, every atom labeled, with a dashed parallelogram for the plane of its six atoms. The three parts of the bonding between the carbons are drawn separately so each can be tapped: a gray head-on overlap on the axis between the carbons, a cloud above the plane touching both carbons, and a cloud below it.',
  build() {
    const cy = 112;
    const C1 = pv(-50, 0, cy), C2 = pv(50, 0, cy);
    const hs = [[C1, pv(-94, 60, cy)], [C1, pv(-94, -60, cy)], [C2, pv(94, 60, cy)], [C2, pv(94, -60, cy)]];
    const q = (u, v) => { const p = pv(u, v, cy); return `${r2(p.x)} ${r2(p.y)}`; };
    let s = `<path class="fg-dash" d="M${q(-115, -85)} L${q(115, -85)} L${q(115, 85)} L${q(-115, 85)} Z"></path>`;
    hs.forEach(([c, h]) => { s += sb(c, h); });
    s += `<g class="hit" data-key="sigma" style="cursor:pointer">${hybrid(C1, 0, 80, 12)}${hybrid(C2, 180, 80, 12)}` +
         `<rect x="136" y="${cy - 10}" width="68" height="20" fill="transparent"></rect></g>`;
    s += `<g class="hit" data-key="pi" style="cursor:pointer">${ell(170, cy - 26, 70, 20, 0, 'fg-orb')}</g>`;
    s += `<g class="hit" data-key="pi" style="cursor:pointer">${ell(170, cy + 26, 70, 20, 0, 'fg-orb-alt')}</g>`;
    hs.forEach(([, h]) => { s += H(h); });
    s += C(C1) + C(C2);
    s += text(170, cy - 52, 'above', { cls: 'fg-tag' });
    s += text(292, cy + 4, 'on axis', { cls: 'fg-tag', anchor: 'start' });
    s += text(170, cy + 64, 'below', { cls: 'fg-tag' });
    s += text(170, 196, 'dashed: the plane of the six atoms', { cls: 'fg-tag-mut' });
    s += text(170, 220, 'tap one part', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Three regions of electron density hold the two carbons together.',
});

/* ---------------------------------------------------- acetonitrile-count ---
   CH3–C≡N with every atom drawn: three C–H, one C–C, one triple bond, the
   hybridization under each heavy atom and nitrogen's lone pair on the axis. */
FIGURES.push({
  id: 'acetonitrile-count',
  section: 'bonding',
  anchor: 'pointing straight out along that axis.</p>',
  viewBox: '0 0 340 214',
  alt: 'Acetonitrile with every atom labeled. A carbon carrying three hydrogens (one in the page, one on a wedge, one on a hash) is joined by a single line to a second carbon, which is joined by a triple line to nitrogen. Nitrogen carries a lone pair of two dots pointing straight out along the same line. Labels: 3 C–H bonds, 3 sigma; 1 sigma over the C–C bond; 1 sigma plus 2 pi over the triple bond; sp3, sp and sp under the three heavy atoms. The C, C and N lie on one straight line.',
  build() {
    const C1 = P(96, 100), C2 = P(176, 100), N = P(250, 100);
    const ha = at(C1, 110, 48), hb = at(C1, 200, 48), hc = at(C1, 250, 48);
    let s = '';
    s += sb(C1, ha) + wedge(C1, hb, { rFrom: Cr, rTo: Hr, width: 8 }) + hash(C1, hc, { rFrom: Cr, rTo: Hr, width: 9, rungs: 4 });
    s += sb(C1, C2, Cr, Cr) + sb(C2, N, Cr, Cr, { order: 3 });
    s += H(ha) + H(hb) + H(hc) + C(C1) + C(C2) + atom(N.x, N.y, 'N', { r: Cr });
    s += lonePair(N.x, N.y, 0, { dist: 22 });
    s += text(10, 30, '3 C–H bonds: 3 σ', { cls: 'fg-tag', anchor: 'start' });
    s += text(136, 88, '1 σ', { cls: 'fg-tag' });
    s += text(213, 82, '1 σ + 2 π', { cls: 'fg-tag' });
    s += text(282, 132, 'sp lone pair', { cls: 'fg-tag' });
    s += text(96, 176, 'sp³', { cls: 'fg-tag-mut' });
    s += text(176, 176, 'sp', { cls: 'fg-tag-mut' });
    s += text(250, 176, 'sp', { cls: 'fg-tag-mut' });
    s += text(170, 206, 'C–C≡N: one straight line', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Every connection and every extra line counted.',
});

/* ------------------------------------------------------- propene-plane ---
   Propene drawn with the page as the plane of the C=C. The methyl group is
   drawn in its usual position, with one hydrogen in the plane (lined up
   with the C=C) and two leaving it on a wedge and a hash. */
FIGURES.push({
  id: 'propene-plane',
  section: 'bonding',
  anchor: 'the methyl group spins about its single bond.</p>',
  viewBox: '0 0 340 246',
  alt: 'Propene with every atom labeled, drawn on a shaded panel that stands for the page. The CH3 carbon, the two carbons of the C=C and the three hydrogens on those two carbons are all drawn in the page. The CH3 carbon carries one more hydrogen in the page and two hydrogens that leave the plane, one on a wedge and one on a hash, labeled as leaving the plane. Hybridization labels read sp3 for the CH3 carbon and sp2 for both carbons of the double bond.',
  build() {
    const Ca = P(80, 146), Cb = P(160, 100), Cc = P(240, 146);
    const hb = P(160, 50), hc1 = at(Cc, 30, 50), hc2 = at(Cc, 270, 50);
    const ha = P(89, 195), hw = P(30, 152), hh = P(44, 108);
    let s = panel(8, 26, 324, 196, { kind: 'hi' });
    s += text(10, 16, 'the shaded panel is the page', { cls: 'fg-tag-mut', anchor: 'start' });
    s += sb(Ca, Cb, Cr, Cr) + sb(Cb, Cc, Cr, Cr, { order: 2 });
    s += sb(Cb, hb) + sb(Cc, hc1) + sb(Cc, hc2) + sb(Ca, ha);
    s += wedge(Ca, hw, { rFrom: Cr, rTo: Hr, width: 8 }) + hash(Ca, hh, { rFrom: Cr, rTo: Hr, width: 9, rungs: 4 });
    [hb, hc1, hc2, ha].forEach((h) => { s += H(h); });
    s += H(hw, 'warn') + H(hh, 'warn');
    s += C(Ca) + C(Cb) + C(Cc);
    s += text(14, 84, 'leave the plane', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(108, 172, 'sp³', { cls: 'fg-tag-mut' });
    s += text(160, 132, 'sp²', { cls: 'fg-tag-mut' });
    s += text(210, 176, 'sp²', { cls: 'fg-tag-mut' });
    s += text(170, 240, 'always in plane: 3 C + 3 H on the C=C carbons', { cls: 'fg-tag' });
    return s;
  },
  caption: 'The two coral hydrogens leave the plane of the page. The CH₃ group spins; in the position drawn, its third hydrogen happens to lie in the plane.',
});

/* ---------------------------------------------------- propenal-p-row ---
   Propenal flat, then edge-on with one p orbital on each of C, C, C and O,
   all parallel: the continuous row the worked example describes. */
FIGURES.push({
  id: 'propenal-p-row',
  section: 'bonding',
  anchor: 'all four p orbitals stand parallel in one continuous row.</p>',
  viewBox: '0 0 340 392',
  alt: 'Two drawings of propenal. Top: the molecule flat in the page with every atom labeled: a CH2 carbon double-bonded to a CH carbon, single-bonded to a CH carbon that is double-bonded to oxygen, which carries two lone pairs. Bottom: the same four heavy atoms, C, C, C and O, seen edge-on in a row with the hydrogens left out. Each carries a p orbital standing straight up and down, all four parallel, with a dashed outline joining the four upper lobes and another joining the four lower lobes.',
  build() {
    let s = '';
    const C1 = P(60, 94), C2 = P(130, 134), C3 = P(200, 94), O = P(270, 134);
    s += text(10, 16, 'propenal, flat in the page', { cls: 'fg-tag-mut', anchor: 'start' });
    const h1 = P(60, 46), h2 = at(C1, 210, 48), h3 = P(130, 182), h4 = P(200, 46);
    s += sb(C1, C2, Cr, Cr, { order: 2 }) + sb(C2, C3, Cr, Cr) + sb(C3, O, Cr, Cr, { order: 2 });
    s += sb(C1, h1) + sb(C1, h2) + sb(C2, h3) + sb(C3, h4);
    [h1, h2, h3, h4].forEach((h) => { s += H(h); });
    s += C(C1) + C(C2) + C(C3) + atom(O.x, O.y, 'O', { r: Cr });
    s += lonePair(O.x, O.y, -30, { dist: 22 }) + lonePair(O.x, O.y, 90, { dist: 22 });
    s += rule(10, 206, 330, 206);
    s += text(10, 226, 'the same molecule edge-on (H atoms left out)', { cls: 'fg-tag-mut', anchor: 'start' });
    const y = 304, xs = [60, 130, 200, 270], lbl = ['C', 'C', 'C', 'O'];
    s += `<line class="fg-bond-soft" x1="60" y1="${y}" x2="270" y2="${y}"></line>`;
    xs.forEach((x) => { s += pOrb(P(x, y), 90, 50, 20); });
    s += cloud(32, y - 58, 298, y - 8) + cloud(32, y + 8, 298, y + 58);
    xs.forEach((x, i) => { s += atom(x, y, lbl[i], { r: Cr }); });
    s += text(170, 384, 'four parallel p orbitals in one row', { cls: 'fg-tag' });
    return s;
  },
  caption: 'Top: every atom, in the plane of the page. Bottom: the four p orbitals, one on each carbon and one on oxygen, stand side by side and parallel.',
});

/* ------------------------------------------------- triple-bond-two-pi ---
   Ethyne taken apart: the sigma bond, the first pi bond (side view), and an
   end-on view down the axis showing both pi bonds at right angles. */
FIGURES.push({
  id: 'triple-bond-two-pi',
  section: 'bonding',
  anchor: 'at right angles to the first.</p>',
  lessons: ['bonding'],
  viewBox: '0 0 340 412',
  alt: 'Ethyne, H–C≡C–H, every atom labeled, in three rows. Row 1: the sigma bond between the carbons as two gray sp lobes meeting head-on on the axis. Row 2: the first pi bond, a p orbital standing up and down on each carbon, with a dashed outline around the two upper lobes and another around the two lower lobes. Row 3: the view straight down the H–C≡C–H axis, with one carbon in the middle and four lobes around it: up and down for the first pi bond, left and right for the second, at right angles to each other.',
  build() {
    let s = '';
    const row = (cy) => ({ H1: P(40, cy), C1: P(125, cy), C2: P(215, cy), H2: P(300, cy) });
    // row 1: sigma
    s += text(10, 18, 'the σ bond: sp meets sp on the axis', { cls: 'fg-tag', anchor: 'start' });
    const a = row(58);
    s += hybrid(a.C1, 0, 62, 14) + hybrid(a.C2, 180, 62, 14);
    s += sb(a.C1, a.H1) + sb(a.C2, a.H2);
    s += H(a.H1) + H(a.H2) + C(a.C1) + C(a.C2);
    s += rule(10, 96, 330, 96);
    // row 2: first pi
    s += text(10, 118, 'the first π: p orbitals above and below', { cls: 'fg-tag', anchor: 'start' });
    const b = row(178);
    s += sb(b.C1, b.C2, Cr, Cr, { cls: 'fg-bond-soft' }) + sb(b.C1, b.H1) + sb(b.C2, b.H2);
    s += pOrb(b.C1, 90, 46, 13) + pOrb(b.C2, 90, 46, 13);
    s += cloud(104, 178 - 54, 236, 178 - 8) + cloud(104, 178 + 8, 236, 178 + 54);
    s += H(b.H1) + H(b.H2) + C(b.C1) + C(b.C2);
    s += rule(10, 248, 330, 248);
    // row 3: end-on
    s += text(10, 270, 'looking straight down the H–C≡C–H axis', { cls: 'fg-tag', anchor: 'start' });
    const c = P(170, 336);
    s += pOrb(c, 90, 50, 13) + pOrb(c, 0, 50, 13);
    s += C(c);
    s += text(196, 298, 'first π', { cls: 'fg-tag', anchor: 'start' });
    s += text(230, 322, 'second π', { cls: 'fg-tag', anchor: 'start' });
    s += text(12, 404, 'the second C and both H sit straight behind', { cls: 'fg-tag-mut', anchor: 'start' });
    return s;
  },
  caption: 'Rows 1 and 2 are side views. Row 3 turns the molecule to look along the axis, which shows the second π bond: its lobes point left and right, at 90° to the first.',
});

/* ------------------------------------------------- bond-length-strength ---
   The three carbon–carbon bonds, with the distance between the carbons
   drawn to scale (1 px per pm) and a bar for the energy to break each one,
   split into the sigma part and the rough share of each pi bond. */
FIGURES.push({
  id: 'bond-length-strength',
  section: 'bonding',
  anchor: 'are 347, 614 and 839 kJ/mol.</p>',
  lessons: ['bonding'],
  viewBox: '0 0 340 330',
  alt: 'Three rows: an average carbon–carbon single, double and triple bond. In each, the two carbons are drawn with the distance between them to scale: 154, 134 and 120 picometers. Under each is a bar for the energy needed to break the bond: 83 kcal/mol for the single bond, all sigma; 147 for the double bond, split into sigma 83 and pi about 64; 200 for the triple bond, split into sigma 83, pi about 64 and a second pi about 53.',
  build() {
    let s = '';
    const rows = [
      { t: 'average C–C bond: 83 kcal/mol to break', a: 'C', b: 'C', d: 154, order: 1, segs: [83] },
      { t: 'average C=C bond: 147 kcal/mol to break', a: 'C', b: 'C', d: 134, order: 2, segs: [83, 64] },
      { t: 'average C≡C bond: 200 kcal/mol to break', a: 'C', b: 'C', d: 120, order: 3, segs: [83, 64, 53] },
    ];
    const K = 1.5, x0 = 16;
    const segLbl = ['σ 83', 'π ≈64', 'π ≈53'];
    const segCls = ['fg-fill-hi', 'fg-fill-good', 'fg-fill-good'];
    rows.forEach((r, i) => {
      const y = 16 + i * 110, my = y + 30;
      s += text(10, y, r.t, { cls: 'fg-tag', anchor: 'start' });
      const A = P(36, my), B = P(36 + r.d, my);
      s += bond(A, B, { order: r.order, rFrom: 18, rTo: 18 });
      s += atom(A.x, A.y, r.a, { r: 18 }) + atom(B.x, B.y, r.b, { r: 18 });
      s += text(332, my + 5, `${r.d} pm`, { cls: 'fg-lbl', anchor: 'end' });
      let x = x0;
      r.segs.forEach((v, j) => {
        const w = v * K;
        s += `<rect class="${segCls[j]}" x="${r2(x)}" y="${my + 26}" width="${r2(w - 2)}" height="12" rx="3"${j === 2 ? ' opacity="0.6"' : ''}></rect>`;
        s += text(x + w / 2, my + 56, segLbl[j], { cls: 'fg-tag' });
        x += w;
      });
    });
    return s;
  },
  caption: 'The carbon–carbon distances are drawn to scale. Each bar is the average energy to break that kind of bond, split into the σ bond and the rough share of each π bond.',
});

/* ------------------------------------------------------ bond-cleavage ---
   Homolysis of ethane's C–C bond and heterolysis of (CH3)3C–Cl, with the
   shared pair drawn as two dots so the reader sees where each electron
   goes. */
FIGURES.push({
  id: 'bond-cleavage',
  section: 'bonding',
  anchor: 'structure</a> forms.</p>',
  viewBox: '0 0 340 262',
  alt: 'Two ways to break a bond, with the shared pair drawn as two dots. Top, homolysis: H3C, two dots, CH3 goes to H3C with one dot plus one dot with CH3, two radicals. Bottom, heterolysis: (CH3)3C, two dots, Cl with three lone pairs goes to a (CH3)3C cation with no dot plus a chloride anion carrying four lone pairs.',
  build() {
    let s = '';
    // homolysis
    s += text(10, 18, 'homolysis of ethane’s C–C bond', { cls: 'fg-tag', anchor: 'start' });
    const y1 = 58;
    s += atom(36, y1, 'H₃C', { r: 18 }) + dot(66, y1) + dot(76, y1) + atom(106, y1, 'CH₃', { r: 18 });
    s += arrow(P(138, y1), P(178, y1));
    s += atom(208, y1, 'H₃C', { r: 18 }) + dot(232, y1);
    s += text(252, y1 + 5, '+', { cls: 'fg-lbl' });
    s += dot(272, y1) + atom(296, y1, 'CH₃', { r: 18 });
    s += text(170, 98, 'each CH₃ keeps one electron: two radicals', { cls: 'fg-tag-good' });
    s += rule(10, 114, 330, 114);
    // heterolysis
    s += text(10, 136, 'heterolysis of a C–Cl bond', { cls: 'fg-tag', anchor: 'start' });
    const y2 = 180;
    s += pill(38, y2, '(CH₃)₃C', 64) + dot(79, y2) + dot(88, y2) + atom(112, y2, 'Cl', { r: 14 });
    s += lonePair(112, y2, -90, { dist: 22 }) + lonePair(112, y2, 90, { dist: 22 }) + lonePair(112, y2, 0, { dist: 22 });
    s += arrow(P(143, y2), P(172, y2));
    s += pill(210, y2, '(CH₃)₃C⁺', 72);
    s += text(256, y2 + 5, '+', { cls: 'fg-lbl' });
    s += atom(298, y2, 'Cl⁻', { r: 15 });
    [0, 90, 180, 270].forEach((a) => { s += lonePair(298, y2, a, { dist: 23 }); });
    s += text(170, 226, 'Cl takes both electrons: a cation and an anion', { cls: 'fg-tag-good' });
    s += text(170, 252, 'each CH₃ stands for one C with three H', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'The two dots between the atoms are the shared pair. Follow them: in the top row they split one each way, in the bottom row both go to chlorine.',
});

/* ---------------------------------------------------------- cis-trans ---
   The two 2-butenes, stacked. The pi bond stops either carbon turning, so
   the CH3 groups cannot change sides. */
function butene(cy, sameSide) {
  const A = P(130, cy), B = P(210, cy);
  const m1 = at(A, 150, 56), h1 = at(A, 210, 50);
  const m2 = sameSide ? at(B, 30, 56) : at(B, 330, 56);
  const h2 = sameSide ? at(B, 330, 50) : at(B, 30, 50);
  let s = sb(A, B, Cr, Cr, { order: 2 });
  s += sb(A, m1, Cr, 18) + sb(B, m2, Cr, 18) + sb(A, h1) + sb(B, h2);
  s += atom(m1.x, m1.y, 'CH₃', { kind: 'hi', r: 18 }) + atom(m2.x, m2.y, 'CH₃', { kind: 'hi', r: 18 });
  s += H(h1) + H(h2) + C(A) + C(B);
  return s;
}
FIGURES.push({
  id: 'cis-trans-butene',
  section: 'bonding',
  anchor: 'can change into the other.</p>',
  lessons: ['bonding'],
  viewBox: '0 0 340 332',
  alt: 'The two forms of 2-butene, every atom labeled, stacked. Top, cis-2-butene: both highlighted CH3 groups on the upper side of the C=C, both hydrogens on the lower side. Bottom, trans-2-butene: one CH3 up on the left carbon and one down on the right carbon. A label says the pi bond stops either one turning into the other.',
  build() {
    let s = '';
    s += italicLabel(170, 20, 'cis', '-2-butene');
    s += butene(84, true);
    s += text(170, 138, 'both CH₃ on the same side', { cls: 'fg-tag' });
    s += rule(10, 152, 330, 152);
    s += italicLabel(170, 174, 'trans', '-2-butene');
    s += butene(238, false);
    s += text(170, 294, 'the CH₃ groups on opposite sides', { cls: 'fg-tag' });
    s += text(170, 322, 'each CH₃ circle is one C with three H', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Look at which side of the C=C each highlighted CH₃ sits on.',
});

/* ----------------------------------------------------------- l-butene ---
   Lesson only: but-1-ene, CH2=CH–CH2–CH3, every atom drawn, for the
   independent counting question. */
FIGURES.push({
  id: 'l-butene',
  lessons: ['bonding'],
  viewBox: '0 0 340 200',
  alt: 'A four-carbon molecule with every atom labeled: a carbon with two hydrogens double-bonded to a carbon with one hydrogen, single-bonded to a carbon with two hydrogens (one on a wedge, one on a hash), single-bonded to a carbon with three hydrogens (one in the page, one on a wedge, one on a hash).',
  build() {
    const C1 = P(70, 130), C2 = P(140, 90), C3 = P(210, 130), C4 = P(280, 90);
    const h1a = at(C1, 150, 50), h1b = at(C1, 270, 50), h2 = at(C2, 90, 50);
    const h3w = P(193, 177), h3h = P(227, 177);
    const h4 = at(C4, 90, 50), h4w = P(325, 111), h4h = P(327, 73);
    const o = { rFrom: Cr, rTo: Hr };
    let s = sb(C1, C2, Cr, Cr, { order: 2 }) + sb(C2, C3, Cr, Cr) + sb(C3, C4, Cr, Cr);
    s += sb(C1, h1a) + sb(C1, h1b) + sb(C2, h2) + sb(C4, h4);
    s += wedge(C3, h3w, { ...o, width: 8 }) + hash(C3, h3h, { ...o, width: 9, rungs: 4 });
    s += wedge(C4, h4w, { ...o, width: 8 }) + hash(C4, h4h, { ...o, width: 9, rungs: 4 });
    [h1a, h1b, h2, h3w, h3h, h4, h4w, h4h].forEach((h) => { s += H(h); });
    s += C(C1) + C(C2) + C(C3) + C(C4);
    return s;
  },
  caption: 'Every atom and every bond is drawn.',
});

/* ------------------------------------------------------------ l-enyne ---
   Lesson only: H–C≡C–CH=CH2 with every atom, for the final count. */
FIGURES.push({
  id: 'l-enyne',
  lessons: ['bonding'],
  viewBox: '0 0 340 228',
  alt: 'A molecule with every atom labeled: H single-bonded to C, triple-bonded to C, single-bonded to a CH carbon that is double-bonded to a carbon carrying two hydrogens. The hydrogen on the left and the first three carbons lie on one straight line.',
  build() {
    const Hl = P(26, 96), C1 = P(88, 96), C2 = P(158, 96), C3 = P(228, 96);
    const h3 = at(C3, 60, 50), C4 = at(C3, 300, 64);
    const h4a = at(C4, 0, 50), h4b = at(C4, 240, 50);
    let s = sb(C1, Hl) + sb(C1, C2, Cr, Cr, { order: 3 }) + sb(C2, C3, Cr, Cr) + sb(C3, h3) + sb(C3, C4, Cr, Cr, { order: 2 });
    s += sb(C4, h4a) + sb(C4, h4b);
    [Hl, h3, h4a, h4b].forEach((h) => { s += H(h); });
    s += C(C1) + C(C2) + C(C3) + C(C4);
    return s;
  },
  caption: 'Every atom and every bond is drawn; count each one.',
});

export default FIGURES;
