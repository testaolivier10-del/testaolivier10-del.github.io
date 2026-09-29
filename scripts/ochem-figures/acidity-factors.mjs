/* Figures for the acidity-factors notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Acids & Bases comes after Drawing Molecules, so carbon skeletons are drawn
   skeletally. Every charged atom shows its lone pairs and its charge; a lone
   pair on a carbanion carbon is drawn too, so the pair the text talks about is
   always visible. Lesson copies (id prefix l-) are 340 wide or less, stacked,
   and use only fg-lbl and fg-tag text. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
/* A point `len` from c in math-angle direction deg (0 east, 90 up). */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
const r2 = (v) => Math.round(v * 100) / 100;
const minus = (x, y, cls = 'fg-hi') => text(x, y, '−', { cls, size: 15 });
/* A double-headed resonance arrow. */
const resArrow = (a, b) => arrow(a, b, { muted: true }) + arrow(b, a, { muted: true });
/* Lone pairs at screen angles (degrees, y down). */
const pairs = (o, angs, dist = 23) => angs.map((a) => lonePair(o.x, o.y, a, { dist })).join('');
/* A skeletal bond between two unlabelled vertices. */
const sk = (a, b, o = {}) => bond(a, b, { rFrom: 0, rTo: 0, ...o });
const ellipse = (cx, cy, rx, ry, deg, cls = 'fg-orb') =>
  `<ellipse class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" rx="${rx}" ry="${ry}" transform="rotate(${r2(-deg)} ${r2(cx)} ${r2(cy)})"></ellipse>`;
const dot = (x, y) => `<circle class="fg-lp" cx="${r2(x)}" cy="${r2(y)}" r="2.6"></circle>`;

/* A carbanion carbon in a skeleton: its lone pair and charge, placed along
   `out` (a unit direction away from the bonds). */
function carbanion(v, out, { pd = 12, cd = 25, side = 1 } = {}) {
  const ang = Math.atan2(out.y, out.x) * 180 / Math.PI;
  const px = -out.y * side, py = out.x * side;
  return lonePair(v.x, v.y, ang, { dist: pd }) +
    minus(v.x + out.x * cd + px * 10, v.y + out.y * cd + py * 10 + 5);
}
const unit = (from, to) => { const dx = to.x - from.x, dy = to.y - from.y, l = Math.hypot(dx, dy) || 1; return { x: dx / l, y: dy / l }; };

/* ============================================================ ATOM ====== */
/* Anions as discs. Across a row the discs are one size; down the halogen
   column they are scaled to ionic radius (F⁻ 133, Cl⁻ 181, Br⁻ 196, I⁻ 220 pm). */
const ACROSS = [
  { ion: 'CH₃⁻', acid: 'CH₄', pka: '50' },
  { ion: 'NH₂⁻', acid: 'NH₃', pka: '38' },
  { ion: 'HO⁻', acid: 'H₂O', pka: '15.7' },
  { ion: 'F⁻', acid: 'HF', pka: '3.2' },
];
const DOWN = [
  { ion: 'F⁻', acid: 'HF', pka: '3.2', pm: 133 },
  { ion: 'Cl⁻', acid: 'HCl', pka: '−7', pm: 181 },
  { ion: 'Br⁻', acid: 'HBr', pka: '−9', pm: 196 },
  { ion: 'I⁻', acid: 'HI', pka: '−10', pm: 220 },
];

FIGURES.push({
  id: 'atom-trends',
  section: 'acidity-factors',
  anchor: 'Both arguments describe the same trend.</p>',
  alt: 'Left panel, across a row: the anions CH3−, NH2−, HO− and F− drawn as discs of about the same size, with the pKa of each parent acid, 50, 38, 15.7 and 3.2, and an arrow saying electronegativity and acidity both rise to the right. Right panel, down a group: F−, Cl−, Br− and I− drawn to scale, growing from left to right, with pKa 3.2, −7, −9 and −10, and arrows saying size and acidity rise while electronegativity falls.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += panel(10, 12, 360, 226);
    s += panel(390, 12, 360, 226);
    s += tag(190, 36, 'ACROSS A ROW: ELECTRONEGATIVITY DECIDES');
    s += tag(570, 36, 'DOWN A GROUP: SIZE DECIDES');
    ACROSS.forEach((a, i) => {
      const x = 55 + i * 90;
      s += atom(x, 104, a.ion, { kind: 'hi', r: 26, size: 12 });
      s += text(x, 152, 'from ' + a.acid, { cls: 'fg-sm', size: 10.5 });
      s += text(x, 170, 'pKa ' + a.pka, { cls: 'fg-tag', size: 11 });
    });
    s += arrow(P(40, 196), P(340, 196));
    s += text(190, 222, 'electronegativity rises → acidity rises', { cls: 'fg-tag-good', size: 11 });
    let x = 404;
    DOWN.forEach((d) => {
      const r = d.pm * 0.16;
      x += r;
      s += atom(x, 104, d.ion, { kind: 'hi', r, size: 12 });
      s += text(x, 152, 'from ' + d.acid, { cls: 'fg-sm', size: 10.5 });
      s += text(x, 170, 'pKa ' + d.pka, { cls: 'fg-tag', size: 11 });
      x += r + 26;
    });
    s += arrow(P(420, 196), P(720, 196));
    s += text(570, 214, 'size rises → acidity rises', { cls: 'fg-tag-good', size: 11 });
    s += text(570, 230, 'even though electronegativity falls', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Left: four anions of about the same size, ranked by how strongly the atom pulls on electrons. Right: the four halide ions drawn to scale.',
});

FIGURES.push({
  id: 'l-atom-trends',
  lessons: ['acidity-factors'],
  alt: 'Top: CH3−, NH2−, HO− and F− as discs of the same size, parent-acid pKa 50, 38, 15.7 and 3.2; electronegativity rises to the right. Bottom: F−, Cl−, Br− and I− drawn to scale, getting bigger, parent-acid pKa 3.2, −7, −9 and −10; size rises to the right.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    s += tag(170, 20, 'ACROSS A ROW');
    ACROSS.forEach((a, i) => {
      const x = 46 + i * 82;
      s += atom(x, 64, a.ion, { kind: 'hi', r: 22, size: 11 });
      s += tag(x, 108, a.acid + ' ' + a.pka);
    });
    s += arrow(P(30, 128), P(310, 128));
    s += tag(170, 148, 'more electronegative: stronger acid', { cls: 'fg-tag-good' });
    s += rule(10, 164, 330, 164);
    s += tag(170, 186, 'DOWN A GROUP (to scale)');
    let x = 14;
    DOWN.forEach((d) => {
      const r = d.pm * 0.135;
      x += r;
      s += atom(x, 236, d.ion, { kind: 'hi', r, size: 11 });
      s += tag(x, 286, d.acid + ' ' + d.pka);
      x += r + 22;
    });
    s += tag(170, 318, 'bigger ion: stronger acid', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Across a row the ions are about the same size. Down a group they grow.',
});

/* ======================================================= RESONANCE ====== */
/* Acetate contributor. `neg` is 'up' or 'down': which oxygen carries the
   charge. c is the carboxyl carbon; the methyl goes down-left. */
function acetate(c, neg, { arrows = false, lesson = false } = {}) {
  let g = '';
  const m = P(c.x - 46, c.y + 26);
  const oU = P(c.x, c.y - 52);
  const oD = P(c.x + 45, c.y + 26);
  g += sk(m, c);
  g += bond(c, oU, { rFrom: 0, rTo: 15, order: neg === 'up' ? 1 : 2 });
  g += bond(c, oD, { rFrom: 0, rTo: 15, order: neg === 'down' ? 1 : 2 });
  g += atom(oU.x, oU.y, 'O', { kind: neg === 'up' ? 'hi' : 'plain', size: 11 });
  g += atom(oD.x, oD.y, 'O', { kind: neg === 'down' ? 'hi' : 'plain', size: 11 });
  if (neg === 'up') { g += pairs(oU, [-150, -90, -30]); g += minus(oU.x + 36, oU.y + 14); }
  else g += pairs(oU, [-140, -40]);
  if (neg === 'down') { g += pairs(oD, [-60, 30, 120]); g += minus(oD.x + 31, oD.y - 7); }
  else g += pairs(oD, [-30, 90]);
  if (arrows && neg === 'down') {
    /* lone pair on the lower O into the C–O bond; the C=O pi pair onto the upper O */
    g += curve(P(oD.x - 14, oD.y + 26), P(c.x + 18, c.y + 18), { bow: -22 });
    g += curve(P(c.x - 7, c.y - 22), P(oU.x - 16, oU.y + 8), { bow: -14 });
  }
  return g;
}

function ethoxide(o) {
  let g = '';
  const c2 = P(o.x - 45, o.y - 26), c1 = P(o.x - 90, o.y);
  g += sk(c1, c2) + bond(c2, o, { rFrom: 0, rTo: 15 });
  g += atom(o.x, o.y, 'O', { kind: 'hi', size: 11 });
  g += pairs(o, [-60, 30, 120]);
  g += minus(o.x + 31, o.y - 7);
  return g;
}

FIGURES.push({
  id: 'ethoxide-acetate',
  section: 'acidity-factors',
  anchor: 'so the real ion carries half the charge on each oxygen.</p>',
  alt: 'Left: ethoxide, CH3CH2O−, with the whole negative charge and three lone pairs on its one oxygen; from ethanol, pKa 16. Right: the two resonance structures of acetate joined by a double-headed arrow. In the first the lower oxygen carries the charge, and curved arrows move one of its lone pairs into the C–O bond and the C=O pi bond onto the upper oxygen; in the second the upper oxygen carries the charge. From acetic acid, pKa 4.76.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += tag(130, 30, 'ETHOXIDE: ONE OXYGEN');
    s += ethoxide(P(170, 128));
    s += text(130, 196, 'the whole charge on one oxygen', { cls: 'fg-tag-warn', size: 11 });
    s += text(130, 216, 'from ethanol, pKa 16', { cls: 'fg-sm', size: 10.5 });
    s += rule(262, 24, 262, 226);
    s += tag(510, 30, 'ACETATE: TWO OXYGENS SHARE IT');
    s += acetate(P(420, 118), 'down', { arrows: true });
    s += resArrow(P(506, 118), P(546, 118));
    s += acetate(P(620, 118), 'up');
    s += text(510, 196, 'half the charge on each oxygen', { cls: 'fg-tag-good', size: 11 });
    s += text(510, 216, 'from acetic acid, pKa 4.76', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The same O–H proton is lost in both. Follow the two curved arrows: they turn the first acetate structure into the second.',
});

FIGURES.push({
  id: 'l-ethoxide-acetate',
  lessons: ['acidity-factors'],
  alt: 'Top: ethoxide, with the whole negative charge on its one oxygen, from ethanol, pKa 16. Bottom: the two equivalent resonance structures of acetate, the charge on one oxygen and then on the other, from acetic acid, pKa 4.76.',
  viewBox: '0 0 340 362',
  build() {
    let s = '';
    s += tag(170, 20, 'ETHOXIDE (ethanol, pKa 16)');
    s += ethoxide(P(210, 90));
    s += tag(170, 146, 'whole charge on one oxygen', { cls: 'fg-tag-warn' });
    s += rule(10, 162, 330, 162);
    s += tag(170, 184, 'ACETATE (acetic acid, pKa 4.76)');
    s += acetate(P(80, 282), 'down');
    s += resArrow(P(134, 252), P(180, 252));
    s += acetate(P(240, 282), 'up');
    s += tag(170, 350, 'half the charge on each oxygen', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Same O–H proton lost; different anion left behind.',
});

/* Phenoxide: ring vertex 0 at the top (bearing the oxygen), then clockwise:
   1 and 5 are ortho, 2 and 4 are meta, 3 is para. When the charge moves off
   oxygen onto a ring carbon, the C–O bond becomes C=O. */
function phenoxideRing(cx, cy, r, chargeAt, doubles) {
  let g = '';
  const onO = chargeAt === 'o';
  const v = [];
  for (let i = 0; i < 6; i++) v.push(at(P(cx, cy), 90 - i * 60, r));
  const mid = P(cx, cy);
  for (let i = 0; i < 6; i++) {
    const a = v[i], b = v[(i + 1) % 6];
    if (doubles.includes(i)) g += ringDouble(a, b, mid, { gap: 4.4, inset: 9 });
    else g += sk(a, b);
  }
  const o = P(cx, cy - r - 40);
  g += bond(v[0], o, { rFrom: 0, rTo: 15, order: onO ? 1 : 2 });
  g += atom(o.x, o.y, 'O', { kind: onO ? 'hi' : 'plain', size: 11 });
  if (onO) { g += pairs(o, [-150, -90, -30]); g += minus(o.x + 36, o.y + 14); }
  else g += pairs(o, [-140, -40]);
  if (typeof chargeAt === 'number') g += carbanion(v[chargeAt], unit(mid, v[chargeAt]), { side: chargeAt === 3 ? 1 : (chargeAt === 1 ? 1 : -1) });
  return g;
}
const PHEN = [['o', [0, 2, 4]], [1, [2, 4]], [3, [1, 4]], [5, [1, 3]]];

FIGURES.push({
  id: 'phenoxide-resonance',
  section: 'acidity-factors',
  anchor: 'and five units less acidic than acetic acid.</p>',
  alt: 'The four resonance structures of phenoxide: the charge on oxygen, then on the ortho carbon, the para carbon and the other ortho carbon of the ring, each carbon charge drawn with its lone pair.',
  viewBox: '0 0 760 290',
  build() {
    let s = '';
    s += tag(380, 30, 'WHERE PHENOXIDE’S CHARGE GOES');
    const cy = 170, r = 36;
    [96, 288, 480, 672].forEach((x, i) => { s += phenoxideRing(x, cy, r, PHEN[i][0], PHEN[i][1]); });
    for (const x of [192, 384, 576]) s += resArrow(P(x - 20, cy), P(x + 20, cy));
    s += text(96, 254, 'charge on oxygen', { cls: 'fg-tag-good', size: 11 });
    s += text(288, 254, 'ortho carbon', { cls: 'fg-tag-warn', size: 11 });
    s += text(480, 254, 'para carbon', { cls: 'fg-tag-warn', size: 11 });
    s += text(672, 254, 'the other ortho carbon', { cls: 'fg-tag-warn', size: 11 });
    s += text(96, 274, 'the major contributor', { cls: 'fg-sm', size: 10.5 });
    s += text(480, 274, 'three carbon contributors: real, but each worth less than the oxygen one', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Count the ring positions that take the charge: ortho, para, ortho. The meta carbons never do.',
  note: 'A preview: the same ortho and para positions decide where new groups attach to a benzene ring in <a class="chapter-ref" href="/ochem/learn.html#m-aromatic-chemistry">Aromatic Chemistry</a>.',
});

FIGURES.push({
  id: 'l-phenoxide',
  lessons: ['acidity-factors'],
  alt: 'The four resonance structures of phenoxide in two rows: the charge on oxygen, then on an ortho carbon; below, on the para carbon, then on the other ortho carbon. Each carbon charge is drawn with its lone pair.',
  viewBox: '0 0 340 400',
  build() {
    let s = '';
    const r = 30;
    const spots = [[80, 110], [256, 110], [256, 320], [80, 320]];
    const tags = [['on oxygen', 'fg-tag-good'], ['ortho carbon', 'fg-tag-warn'], ['para carbon', 'fg-tag-warn'], ['other ortho', 'fg-tag-warn']];
    spots.forEach(([x, y], i) => {
      s += phenoxideRing(x, y, r, PHEN[i][0], PHEN[i][1]);
      s += tag(x, y + (i === 2 ? 70 : 52), tags[i][0], { cls: tags[i][1] });
    });
    s += resArrow(P(150, 110), P(186, 110));
    s += resArrow(P(256, 172), P(256, 212));
    s += resArrow(P(150, 320), P(186, 320));
    return s;
  },
  caption: 'Read the four structures in order: the charge moves from oxygen to three ring carbons.',
});

/* Cyclopentadiene and its anion (a preview). Pentagon vertex 0 at the top,
   then clockwise. */
function pentagon(cx, cy, r) {
  const v = [];
  for (let i = 0; i < 5; i++) v.push(at(P(cx, cy), 90 - i * 72, r));
  return v;
}
function cpAnion(cx, cy, r, k) {
  let g = '';
  const v = pentagon(cx, cy, r), mid = P(cx, cy);
  const dbl = [(k + 1) % 5, (k + 3) % 5];
  for (let i = 0; i < 5; i++) {
    if (dbl.includes(i)) g += ringDouble(v[i], v[(i + 1) % 5], mid, { gap: 4, inset: 7 });
    else g += sk(v[i], v[(i + 1) % 5]);
  }
  g += carbanion(v[k], unit(mid, v[k]), { pd: 10, cd: 21, side: k >= 3 ? -1 : 1 });
  return g;
}

FIGURES.push({
  id: 'cyclopentadienyl',
  section: 'acidity-factors',
  anchor: 'expect its acid to be far stronger than the formula suggests.</p>',
  alt: 'Preview. Left: cyclopentadiene, a five-carbon ring with two C=C bonds and a CH2 at the top whose two hydrogens are drawn; pKa 16. An arrow labelled minus H+ leads to the five equivalent resonance structures of the cyclopentadienyl anion, the charge and lone pair on a different ring carbon in each.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(380, 26, 'A PREVIEW: CHARGE SHARED BY ALL FIVE CARBONS');
    const c0 = P(250, 96), r = 30;
    const v = pentagon(c0.x, c0.y, r);
    s += sk(v[0], v[1]) + ringDouble(v[1], v[2], c0, { gap: 4, inset: 7 }) + sk(v[2], v[3]) +
         ringDouble(v[3], v[4], c0, { gap: 4, inset: 7 }) + sk(v[4], v[0]);
    const hL = at(v[0], 150, 32), hR = at(v[0], 30, 32);
    s += bond(v[0], hL, { rFrom: 0, rTo: 10 }) + bond(v[0], hR, { rFrom: 0, rTo: 10 });
    s += atom(hL.x, hL.y, 'H', { r: 10, size: 11 });
    s += atom(hR.x, hR.y, 'H', { kind: 'warn', r: 10, size: 11 });
    s += text(160, 92, 'cyclopentadiene', { cls: 'fg-tag', size: 11 });
    s += text(160, 110, 'pKa 16', { cls: 'fg-tag-warn', size: 11 });
    s += arrow(P(310, 96), P(380, 96));
    s += text(345, 84, '− H⁺', { cls: 'fg-sm', size: 10.5 });
    s += text(530, 92, 'the cyclopentadienyl anion:', { cls: 'fg-tag', size: 11 });
    s += text(530, 110, 'five equivalent structures, below', { cls: 'fg-sm', size: 10.5 });
    const xs = [84, 232, 380, 528, 676];
    xs.forEach((x, k) => { s += cpAnion(x, 196, 28, k); });
    for (let i = 0; i < 4; i++) s += resArrow(P(xs[i] + 62, 196), P(xs[i + 1] - 62, 196));
    s += text(380, 262, 'each ring carbon holds one fifth of the charge', { cls: 'fg-tag-good', size: 11 });
    s += text(380, 282, 'a flat ring with six π electrons: aromatic, as Aromatic Chemistry explains', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Removing one CH₂ hydrogen from cyclopentadiene leaves an anion whose charge visits every ring carbon.',
});

/* 1,3-diketone enolate. `on` says where the charge sits: 'c', 'left', 'right'.
   ox, oy: the left methyl end; the unit is 176 wide. */
function diketone(ox, oy, on) {
  let g = '';
  const mL = P(ox, oy), cL = P(ox + 44, oy - 30), oL = P(ox + 44, oy - 84);
  const cc = P(ox + 88, oy);
  const cR = P(ox + 132, oy - 30), oR = P(ox + 132, oy - 84), mR = P(ox + 176, oy);
  g += sk(mL, cL);
  g += bond(cL, oL, { rFrom: 0, rTo: 15, order: on === 'left' ? 1 : 2 });
  g += on === 'left' ? ringDouble(cL, cc, P(ox + 88, oy - 60), { gap: 4.4, inset: 6 }) : sk(cL, cc);
  g += on === 'right' ? ringDouble(cc, cR, P(ox + 88, oy - 60), { gap: 4.4, inset: 6 }) : sk(cc, cR);
  g += bond(cR, oR, { rFrom: 0, rTo: 15, order: on === 'right' ? 1 : 2 });
  g += sk(cR, mR);
  g += atom(oL.x, oL.y, 'O', { kind: on === 'left' ? 'hi' : 'plain', size: 11 });
  g += atom(oR.x, oR.y, 'O', { kind: on === 'right' ? 'hi' : 'plain', size: 11 });
  g += on === 'left' ? pairs(oL, [-150, -90, -30]) + minus(oL.x - 36, oL.y + 14) : pairs(oL, [-140, -40]);
  g += on === 'right' ? pairs(oR, [-150, -90, -30]) + minus(oR.x + 36, oR.y + 14) : pairs(oR, [-140, -40]);
  if (on === 'c') g += carbanion(cc, { x: 0, y: 1 }, { pd: 12, cd: 22, side: 1 });
  return g;
}

FIGURES.push({
  id: 'diketone-enolate',
  section: 'acidity-factors',
  anchor: 'Its conjugate base shares the charge with <i>two</i> oxygens instead of one.</p>',
  alt: 'The three resonance structures of the pentane-2,4-dione anion: the negative charge on the left oxygen, then on the central carbon with its lone pair, then on the right oxygen.',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    s += tag(380, 30, 'ONE CHARGE, THREE PLACES TO PUT IT');
    s += diketone(36, 168, 'left');
    s += diketone(292, 168, 'c');
    s += diketone(548, 168, 'right');
    s += resArrow(P(236, 150), P(276, 150));
    s += resArrow(P(492, 150), P(532, 150));
    s += text(124, 226, 'charge on the left oxygen', { cls: 'fg-tag-good', size: 11 });
    s += text(380, 226, 'charge on the central carbon', { cls: 'fg-tag-warn', size: 11 });
    s += text(636, 226, 'charge on the right oxygen', { cls: 'fg-tag-good', size: 11 });
    s += text(380, 256, 'pentane-2,4-dione, pKa 9; a ketone with one C=O is pKa 20, so the second C=O is worth eleven units', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Most of the charge sits on the two oxygens, and a smaller share on the carbon between them.',
  note: 'The carbon form is the minor contributor, yet it is the carbon, not the oxygen, that later forms new bonds (a preview of <a class="chapter-ref" href="/ochem/learn.html#m-enolate-chemistry">Enolate Chemistry</a>). There is one real anion, and the carbon form is always part of it.',
});

FIGURES.push({
  id: 'l-diketone',
  lessons: ['acidity-factors'],
  alt: 'The three resonance structures of the pentane-2,4-dione anion, stacked: the charge on the left oxygen, on the central carbon, and on the right oxygen.',
  viewBox: '0 0 340 470',
  build() {
    let s = '';
    const rows = [['left', 'left oxygen', 'fg-tag-good'], ['c', 'central carbon', 'fg-tag-warn'], ['right', 'right oxygen', 'fg-tag-good']];
    rows.forEach(([on, t, cls], i) => {
      const y = 116 + i * 156;
      s += diketone(10, y, on);
      s += tag(272, y - 30, 'charge on', { cls });
      s += tag(272, y - 14, t, { cls });
    });
    s += resArrow(P(206, 128), P(206, 178));
    s += resArrow(P(206, 284), P(206, 334));
    return s;
  },
  caption: 'Pentane-2,4-dione, pKa 9: one charge shared by two oxygens and a carbon.',
});

/* ======================================================= INDUCTION ===== */
/* A carboxylate or carboxylic acid on a skeletal chain. c1 is the carboxyl
   carbon; the chain runs right. `cl` is the chain carbon (1 = the one next to
   C1) that carries a chlorine, or 0. `n` chain carbons after C1. */
function acidChain(c1, n, cl, { anion = false, clUp = false } = {}) {
  let g = '';
  const o1 = P(c1.x, c1.y - 54), o2 = P(c1.x - 46, c1.y + 30);
  const chain = [];
  for (let i = 1; i <= n; i++) chain.push(P(c1.x + 46 * i, c1.y + (i % 2 ? 30 : 0)));
  g += bond(c1, o1, { rFrom: 0, rTo: 15, order: 2 });
  g += bond(c1, o2, { rFrom: 0, rTo: anion ? 15 : 19 });
  let prev = c1;
  for (const p of chain) { g += sk(prev, p); prev = p; }
  g += atom(o1.x, o1.y, 'O', { size: 11 });
  g += pairs(o1, [-140, -40]);
  if (anion) {
    g += atom(o2.x, o2.y, 'O', { kind: 'hi', size: 11 });
    g += pairs(o2, [-150, 90, 150]);
    g += minus(o2.x - 8, o2.y - 24);
  } else {
    g += atom(o2.x, o2.y, 'OH', { r: 19, size: 10.5 });
  }
  if (cl) {
    const host = chain[cl - 1];
    const down = cl % 2 === 1;
    const x = P(host.x, host.y + (down ? 44 : -44) * (clUp ? -1 : 1));
    g += bond(host, x, { rFrom: 0, rTo: 16 });
    g += atom(x.x, x.y, 'Cl', { kind: 'warn', size: 11 });
  }
  return { svg: g, chain, o2 };
}

FIGURES.push({
  id: 'chloroacetate-pull',
  section: 'acidity-factors',
  anchor: 'and the pKa falls from 4.76 to 2.86.</p>',
  alt: 'Left: acetate, the carboxylate anion with the negative charge on oxygen and a plain CH3 next to the carboxyl carbon; from acetic acid, pKa 4.76. Right: chloroacetate, the same anion with a chlorine on the carbon next to the carboxyl carbon. Arrows along the Cl–C and C–C bonds point toward the chlorine, marked delta minus, showing it pulling electron density away from the charged end; from chloroacetic acid, pKa 2.86.',
  viewBox: '0 0 600 250',
  build() {
    let s = '';
    s += tag(150, 28, 'ACETATE');
    let a = acidChain(P(140, 120), 1, 0, { anion: true });
    s += a.svg;
    s += text(150, 212, 'from acetic acid, pKa 4.76', { cls: 'fg-sm', size: 10.5 });
    s += rule(300, 20, 300, 230);
    s += tag(450, 28, 'CHLOROACETATE');
    a = acidChain(P(420, 120), 1, 0, { anion: true });
    s += a.svg;
    const ca = a.chain[0], cl = at(ca, 30, 50);
    s += bond(ca, cl, { rFrom: 0, rTo: 16 });
    s += atom(cl.x, cl.y, 'Cl', { kind: 'warn', size: 11 });
    /* the pull: small arrows alongside the C1–C2 and C2–Cl bonds, pointing toward Cl */
    s += arrow(P(428, 146), P(452, 160), { size: 7 });
    s += arrow(P(478, 164), P(500, 151), { size: 7 });
    s += text(cl.x + 4, cl.y - 22, 'δ−', { cls: 'fg-warn', size: 13 });
    s += text(ca.x - 4, ca.y + 28, 'δ+', { cls: 'fg-hi', size: 13 });
    s += text(450, 212, 'from chloroacetic acid, pKa 2.86', { cls: 'fg-sm', size: 10.5 });
    s += text(450, 232, 'Cl pulls density away from the charge', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Where the chlorine sits: on the carbon right next to the carboxylate carbon. The two small arrows show the pull through the σ bonds.',
});

const BUTANOIC = [
  { pos: 1, name: '2-chlorobutanoic acid', pka: '2.86', how: 'nearly two units' },
  { pos: 2, name: '3-chlorobutanoic acid', pka: '4.06', how: 'three quarters of a unit' },
  { pos: 3, name: '4-chlorobutanoic acid', pka: '4.52', how: 'only 0.3 of a unit' },
];

FIGURES.push({
  id: 'induction-distance',
  section: 'acidity-factors',
  anchor: 'two carbons further out by only 0.3.</p>',
  alt: 'Three butanoic acids with the chlorine on C2, C3 and C4, named 2-, 3- and 4-chlorobutanoic acid, with pKa 2.86, 4.06 and 4.52 under them. Butanoic acid itself is pKa 4.82, so the effect fades from nearly two units to 0.3 as the chlorine moves away from the COOH group.',
  viewBox: '0 0 760 316',
  build() {
    let s = '';
    s += tag(380, 26, 'INDUCTION FADES BOND BY BOND');
    s += text(380, 48, 'butanoic acid itself is pKa 4.82: read each number against that', { cls: 'fg-sm', size: 10.5 });
    BUTANOIC.forEach((b, i) => {
      const x = 104 + i * 240;
      const a = acidChain(P(x, 146), 3, b.pos);
      s += a.svg;
      s += text(x + 46, 262, b.name, { cls: 'fg-sm', size: 10.5 });
      s += text(x + 46, 282, 'pKa ' + b.pka, { cls: 'fg-tag-warn', size: 11 });
      s += text(x + 46, 302, 'lowered by ' + b.how, { cls: 'fg-sm', size: 10.5 });
    });
    return s;
  },
  caption: 'The same chlorine on the same acid, moved one carbon at a time away from the COOH group.',
});

FIGURES.push({
  id: 'l-induction-distance',
  lessons: ['acidity-factors'],
  alt: '2-, 3- and 4-chlorobutanoic acid stacked, the chlorine one carbon further from the COOH group each time, with pKa 2.86, 4.06 and 4.52. Butanoic acid itself is 4.82.',
  viewBox: '0 0 340 450',
  build() {
    let s = '';
    s += tag(170, 20, 'butanoic acid itself: pKa 4.82');
    BUTANOIC.forEach((b, i) => {
      const y = 106 + i * 136;
      const a = acidChain(P(66, y), 3, b.pos);
      s += a.svg;
      s += tag(292, y - 16, 'Cl on C' + (b.pos + 1));
      s += tag(292, y + 2, 'pKa ' + b.pka, { cls: 'fg-tag-warn' });
    });
    return s;
  },
  caption: 'The further the chlorine from the COOH group, the smaller its effect.',
});

FIGURES.push({
  id: 'l-chloropropanoic',
  lessons: ['acidity-factors'],
  alt: 'Two acids. A: 3-chloropropanoic acid, the chlorine on the carbon furthest from the COOH group. B: 2-chloropropanoic acid, the chlorine on the carbon next to the COOH group.',
  viewBox: '0 0 340 350',
  build() {
    let s = '';
    [['A', '3-chloropropanoic acid', 2], ['B', '2-chloropropanoic acid', 1]].forEach(([k, name, pos], i) => {
      const y = 104 + i * 150;
      s += label(20, y - 50, k, { anchor: 'start', size: 16 });
      const a = acidChain(P(110, y), 2, pos);
      s += a.svg;
      s += tag(pos === 1 ? 260 : 170, pos === 1 ? y + 40 : y + 60, name);
    });
    return s;
  },
  caption: 'Same atoms, same chlorine. Only its position differs.',
});

/* ========================================================= ORBITAL ===== */
/* A carbanion carbon with its lone pair in a hybrid lobe. The lobe is drawn
   longer for more p-character, shorter for more s-character. */
function lobe(c, deg, len) {
  const mid = at(c, deg, 13 + len / 2);
  const d1 = at(c, deg, 13 + len * 0.62);
  const perp = deg + 90;
  return ellipse(mid.x, mid.y, len / 2 + 2, 9, deg, 'fg-orb') +
    dot(at(d1, perp, 3.6).x, at(d1, perp, 3.6).y) + dot(at(d1, perp, -3.6).x, at(d1, perp, -3.6).y);
}

FIGURES.push({
  id: 'orbital-anions',
  section: 'acidity-factors',
  lessons: ['acidity-factors'],
  anchor: 'in the same hybrid orbital that the C–H bond used.</p>',
  alt: 'Three carbanions, each with its lone pair drawn inside a hybrid orbital lobe. Top: the ethyl anion from ethane, an sp3 carbon with three bonds and the lone pair in a long lobe; 25% s; pKa of ethane about 50. Middle: the vinyl anion from ethene, an sp2 carbon at 120 degrees with a shorter lobe; 33% s; pKa about 44. Bottom: the acetylide from ethyne, H–C≡C with the lone pair in a short lobe straight along the axis; 50% s; pKa about 25.',
  viewBox: '0 0 340 380',
  build() {
    let s = '';
    const rows = [
      { y: 70, h: 'sp³ · 25% s', src: 'ethane, pKa ≈ 50' },
      { y: 190, h: 'sp² · 33% s', src: 'ethene, pKa ≈ 44' },
      { y: 310, h: 'sp · 50% s', src: 'ethyne, pKa ≈ 25' },
    ];
    /* sp3: CH3 left, H wedge down-right, H hash down-left, lobe up-right */
    let c = P(96, rows[0].y + 10);
    let m = at(c, 200, 50);
    s += bond(c, m, { rFrom: 15, rTo: 17 }) + atom(m.x, m.y, 'CH₃', { r: 17, size: 10.5 });
    let h1 = at(c, 290, 42), h2 = at(c, 250, 42);
    s += wedge(c, h1, { rFrom: 14, rTo: 10, width: 9 }) + atom(h1.x, h1.y, 'H', { r: 10, size: 11 });
    s += hash(c, h2, { rFrom: 14, rTo: 10, width: 10, rungs: 4 }) + atom(h2.x, h2.y, 'H', { r: 10, size: 11 });
    s += lobe(c, 40, 40);
    s += atom(c.x, c.y, 'C', { kind: 'hi', size: 12 });
    s += tag(250, rows[0].y - 6, rows[0].h);
    s += tag(250, rows[0].y + 12, rows[0].src);
    s += tag(250, rows[0].y + 30, 'pair held far out', { cls: 'fg-tag-mut' });
    s += rule(10, 136, 330, 136);
    /* sp2: =CH2 left, H down-right at 300, lobe up-right at 60 */
    c = P(110, rows[1].y);
    m = at(c, 180, 56);
    s += bond(c, m, { rFrom: 15, rTo: 18, order: 2 }) + atom(m.x, m.y, 'CH₂', { r: 18, size: 10.5 });
    h1 = at(c, 300, 42);
    s += bond(c, h1, { rFrom: 15, rTo: 10 }) + atom(h1.x, h1.y, 'H', { r: 10, size: 11 });
    s += lobe(c, 60, 32);
    s += atom(c.x, c.y, 'C', { kind: 'hi', size: 12 });
    s += tag(250, rows[1].y - 6, rows[1].h);
    s += tag(250, rows[1].y + 12, rows[1].src);
    s += rule(10, 250, 330, 250);
    /* sp: H–C≡C, lobe straight right */
    c = P(120, rows[2].y);
    const c2 = at(c, 180, 50), h = at(c2, 180, 38);
    s += bond(c, c2, { rFrom: 15, rTo: 15, order: 3, gap: 3.4 });
    s += bond(c2, h, { rFrom: 15, rTo: 10 });
    s += atom(c2.x, c2.y, 'C', { size: 12 }) + atom(h.x, h.y, 'H', { r: 10, size: 11 });
    s += lobe(c, 0, 24);
    s += atom(c.x, c.y, 'C', { kind: 'hi', size: 12 });
    s += tag(250, rows[2].y - 6, rows[2].h);
    s += tag(250, rows[2].y + 12, rows[2].src);
    s += tag(250, rows[2].y + 30, 'pair held closest', { cls: 'fg-tag-good' });
    s += tag(120, rows[2].y + 50, 'the pair points along the C≡C axis', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'The lone pair each C–H leaves behind, drawn in its hybrid orbital. The more s-character, the closer to the carbon it sits.',
});

FIGURES.push({
  id: 'pyridine-methylamine',
  section: 'acidity-factors',
  anchor: 'methylammonium ion has pKa 10.6.</p>',
  alt: 'Left: pyridine, a six-membered ring with one nitrogen, its lone pair in an sp2 lobe pointing outward in the plane of the ring; 33% s; pKaH 5.2. Right: methylamine, CH3NH2, a pyramidal nitrogen with its lone pair in a longer sp3 lobe; 25% s; pKaH 10.6.',
  viewBox: '0 0 600 250',
  build() {
    let s = '';
    s += tag(150, 28, 'PYRIDINE');
    const cx = 120, cy = 118, r = 38;
    const v = [];
    for (let i = 0; i < 6; i++) v.push(at(P(cx, cy), -i * 60, r));
    const ctr = P(cx, cy);
    for (let i = 0; i < 6; i++) {
      const a = v[i], b = v[(i + 1) % 6];
      if (i === 2 || i === 4) { s += ringDouble(a, b, ctr, { gap: 5, inset: 8 }); continue; }
      s += bond(a, b, { rFrom: i === 0 ? 13 : 0, rTo: (i + 1) % 6 === 0 ? 13 : 0 });
    }
    /* the N=C double bond: an inner line, trimmed clear of the N disc */
    const inA = at(ctr, 0, r - 7), inB = at(ctr, -60, r - 7);
    s += bond(inA, inB, { rFrom: 13, rTo: 6 });
    s += atom(v[0].x, v[0].y, '', { r: 13 });
    s += lobe(v[0], 0, 26);
    s += atom(v[0].x, v[0].y, 'N', { kind: 'hi', r: 13, size: 12 });
    s += text(150, 192, 'lone pair in an sp² orbital (33% s)', { cls: 'fg-sm', size: 10.5 });
    s += text(150, 212, 'pKaH 5.2: the weaker base', { cls: 'fg-tag-good', size: 11 });
    s += rule(300, 20, 300, 230);
    s += tag(450, 28, 'METHYLAMINE');
    const n = P(430, 124);
    const m = at(n, 200, 52);
    s += bond(n, m, { rFrom: 15, rTo: 17 }) + atom(m.x, m.y, 'CH₃', { r: 17, size: 10.5 });
    const h1 = at(n, 290, 42), h2 = at(n, 250, 42);
    s += wedge(n, h1, { rFrom: 14, rTo: 10, width: 9 }) + atom(h1.x, h1.y, 'H', { r: 10, size: 11 });
    s += hash(n, h2, { rFrom: 14, rTo: 10, width: 10, rungs: 4 }) + atom(h2.x, h2.y, 'H', { r: 10, size: 11 });
    s += lobe(n, 40, 40);
    s += atom(n.x, n.y, 'N', { kind: 'hi', size: 12 });
    s += text(450, 212 - 20, 'lone pair in an sp³ orbital (25% s)', { cls: 'fg-sm', size: 10.5 });
    s += text(450, 212, 'pKaH 10.6: the stronger base', { cls: 'fg-tag-warn', size: 11 });
    return s;
  },
  caption: 'Both lone pairs sit on nitrogen. Pyridine’s sp² pair is held closer to the nucleus, so it takes a proton less readily.',
});

/* ================================================ WORKED EXAMPLE ======= */
/* 4-Hydroxybutan-2-one, skeletal, C1–C4 numbered. */
function hydroxybutanone(x0, y0, dx = 60, dy = 34) {
  const c1 = P(x0, y0), c2 = P(x0 + dx, y0 - dy), c3 = P(x0 + 2 * dx, y0), c4 = P(x0 + 3 * dx, y0 - dy), o = P(x0 + 4 * dx, y0);
  const ok = P(c2.x, c2.y - 56);
  let g = '';
  g += sk(c1, c2) + sk(c2, c3) + sk(c3, c4) + bond(c4, o, { rFrom: 0, rTo: 19 });
  g += bond(c2, ok, { rFrom: 0, rTo: 15, order: 2 });
  g += atom(ok.x, ok.y, 'O', { size: 11 }) + pairs(ok, [-140, -40]);
  g += atom(o.x, o.y, 'OH', { kind: 'hi', r: 19, size: 10.5 });
  return { svg: g, c1, c2, c3, c4, o, ok };
}

FIGURES.push({
  id: 'hydroxybutanone-sites',
  section: 'acidity-factors',
  anchor: 'There are four kinds of hydrogen on it.</p>',
  alt: '4-Hydroxybutan-2-one drawn skeletally with C1 to C4 numbered and each kind of hydrogen labelled with its pKa: C1 hydrogens about 20, C3 hydrogens about 20, C4 hydrogens near 50, and the O–H about 16, marked as the most acidic.',
  viewBox: '0 0 600 214',
  build() {
    let s = '';
    const m = hydroxybutanone(130, 130, 70, 38);
    s += m.svg;
    s += text(m.c1.x - 22, m.c1.y + 4, 'C1', { cls: 'fg-tag', size: 11 });
    s += text(m.c2.x + 22, m.c2.y + 4, 'C2', { cls: 'fg-tag', size: 11 });
    s += text(m.c3.x, m.c3.y - 16, 'C3', { cls: 'fg-tag', size: 11 });
    s += text(m.c4.x, m.c4.y + 26, 'C4', { cls: 'fg-tag', size: 11 });
    s += text(m.c1.x, m.c1.y + 34, 'C1–H: pKa ≈ 20', { cls: 'fg-tag-warn', size: 11 });
    s += text(m.c1.x, m.c1.y + 52, 'alpha to C=O', { cls: 'fg-sm', size: 10.5 });
    s += text(m.c3.x, m.c3.y + 34, 'C3–H: pKa ≈ 20', { cls: 'fg-tag-warn', size: 11 });
    s += text(m.c3.x, m.c3.y + 52, 'alpha to C=O', { cls: 'fg-sm', size: 10.5 });
    s += text(m.c4.x, m.c4.y - 20, 'C4–H: near 50', { cls: 'fg-tag-mut', size: 11 });
    s += text(m.o.x + 10, m.o.y + 40, 'O–H: pKa ≈ 16', { cls: 'fg-tag-good', size: 11 });
    s += text(m.o.x + 10, m.o.y + 58, 'the most acidic', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Four kinds of hydrogen, labelled with the pKa each would have. The two alpha positions tie, and the O–H beats them both.',
});

FIGURES.push({
  id: 'l-hydroxybutanone',
  lessons: ['acidity-factors'],
  alt: '4-Hydroxybutan-2-one drawn skeletally with its carbons numbered C1 to C4: C1 is the methyl, C2 carries the C=O, C3 and C4 are CH2 groups, and C4 carries the OH.',
  viewBox: '0 0 340 190',
  build() {
    let s = '';
    const m = hydroxybutanone(40, 130, 60, 34);
    s += m.svg;
    s += tag(m.c1.x, m.c1.y + 24, 'C1');
    s += tag(m.c2.x + 20, m.c2.y + 4, 'C2', { anchor: 'start' });
    s += tag(m.c3.x, m.c3.y + 24, 'C3');
    s += tag(m.c4.x, m.c4.y - 14, 'C4');
    return s;
  },
  caption: '4-Hydroxybutan-2-one. Every carbon but C2 carries hydrogens, and so does the oxygen.',
});

export default FIGURES;
