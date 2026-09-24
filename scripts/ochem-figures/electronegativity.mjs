/* Figures for the electronegativity notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Electronegativity sits in Foundations, before skeletal structures, so every
   drawing writes every atom out with its label. Every figure here is 340 wide
   or less, stacked, and uses only fg-lbl and fg-tag text, so the same drawing
   can sit in the notes and in a lesson step. Partial charges follow the rest
   of the course: δ+ in the coral tag colour, δ− in the accent tag colour.

   Pauling values used (the same ones the notes table gives): H 2.20,
   Li 0.98, Be 1.57, B 2.04, C 2.55, N 3.04, O 3.44, F 3.98, Na 0.93,
   Mg 1.31, Al 1.61, Si 1.90, P 2.19, S 2.58, Cl 3.16, Br 2.96, I 2.66. */
import { atom, bond, wedge, hash, arrow, lonePair, text, rule, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* Screen point at a math angle (0 east, 90 up) from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
/* lonePair() takes a screen angle (clockwise); these helpers take math angles. */
const lp = (c, deg, dist = 24) => lonePair(c.x, c.y, -deg, { dist });
const tg = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-tag', ...o });
const tgMut = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-tag-mut', ...o });
const dPlus = (x, y, s = 'δ+') => text(x, y, s, { cls: 'fg-tag-warn' });
const dMinus = (x, y, s = 'δ−') => text(x, y, s, { cls: 'fg-tag' });
const Hr = 11, Cr = 14, Xr = 15;
const H = (p) => atom(p.x, p.y, 'H', { r: Hr });
const C = (p) => atom(p.x, p.y, 'C', { r: Cr });
const X = (p, s, kind) => atom(p.x, p.y, s, { r: Xr, ...(kind ? { kind } : {}) });

/* The electron cloud of one bond, drawn as the smooth outline around two
   circles of different size (the convex hull of the two). Equal radii give a
   symmetric capsule; a bigger right-hand circle gives a cloud that bulges
   toward the atom that holds the pair more of the time. */
function cloud(x1, x2, cy, r1, rr) {
  const d = x2 - x1;
  const phi = Math.acos((r1 - rr) / d);           // tangent angle, measured from A→B
  const ax = x1 + r1 * Math.cos(phi), ay = r1 * Math.sin(phi);
  const bx = x2 + rr * Math.cos(phi), by = rr * Math.sin(phi);
  const bigB = 2 * phi > Math.PI ? 1 : 0;
  const bigA = bigB ? 0 : 1;
  return `<path class="fg-orb" d="M${r2(ax)} ${r2(cy - ay)} L${r2(bx)} ${r2(cy - by)} ` +
    `A${r2(rr)} ${r2(rr)} 0 ${bigB} 1 ${r2(bx)} ${r2(cy + by)} L${r2(ax)} ${r2(cy + ay)} ` +
    `A${r2(r1)} ${r2(r1)} 0 ${bigA} 1 ${r2(ax)} ${r2(cy - ay)} Z"></path>`;
}

/* ---------------------------------------------------------- en-bond-share ---
   The same kind of bond, one shared pair, drawn twice: H–H, where both ends
   pull equally, and H–F, where fluorine pulls harder. */
FIGURES.push({
  id: 'en-bond-share',
  section: 'electronegativity',
  anchor: '<h3>What it is</h3>',
  lessons: ['electronegativity'],
  viewBox: '0 0 340 262',
  alt: 'Two bonds, each drawn as two labeled atoms joined by a line with a shaded cloud around the shared pair. Top: H–H. The cloud is the same size at both ends, and a label says the pair is shared evenly, with no partial charges. Bottom: H–F, with fluorine’s three lone pairs drawn. The cloud is small around hydrogen and bulges around fluorine. Hydrogen is marked δ+ and fluorine δ−. A label says fluorine pulls harder, so the pair spends more time near it.',
  build() {
    let s = '';
    // top: H–H
    s += tgMut(10, 20, 'H–H: two identical atoms', { anchor: 'start' });
    const a1 = P(130, 70), b1 = P(210, 70);
    s += cloud(a1.x, b1.x, a1.y, 26, 26);
    s += bond(a1, b1, { rFrom: Hr, rTo: Hr }) + H(a1) + H(b1);
    s += tg(170, 124, 'equal pull: the pair sits in the middle');
    s += tgMut(170, 140, 'no partial charges');
    s += rule(10, 156, 330, 156);
    // bottom: H–F
    s += tgMut(10, 176, 'H–F: fluorine pulls harder', { anchor: 'start' });
    const a2 = P(110, 214), b2 = P(200, 214);
    s += cloud(a2.x, b2.x, a2.y, 17, 34);
    s += bond(a2, b2, { rFrom: Hr, rTo: Xr });
    s += lp(b2, 90) + lp(b2, 0) + lp(b2, -90);
    s += H(a2) + X(b2, 'F', 'hi');
    s += dPlus(a2.x, a2.y - 24);
    s += dMinus(b2.x - 30, b2.y - 34);
    s += tg(290, 206, 'pair spends', { anchor: 'middle' });
    s += tg(290, 220, 'more time', { anchor: 'middle' });
    s += tg(290, 234, 'near F', { anchor: 'middle' });
    return s;
  },
  caption: 'The shaded cloud marks where the shared pair spends its time. Compare its two ends in each bond.',
});

/* --------------------------------------------------------------- en-trend ---
   A cut-down periodic table: groups 1, 2 and 13–17 for rows 1–3, plus
   bromine and iodine under chlorine. Shading deepens with the value. */
const TREND = [
  // [symbol, value, column 0-6, row 0-4]
  ['H', 2.20, 0, 0],
  ['Li', 0.98, 0, 1], ['Be', 1.57, 1, 1], ['B', 2.04, 2, 1], ['C', 2.55, 3, 1], ['N', 3.04, 4, 1], ['O', 3.44, 5, 1], ['F', 3.98, 6, 1],
  ['Na', 0.93, 0, 2], ['Mg', 1.31, 1, 2], ['Al', 1.61, 2, 2], ['Si', 1.90, 3, 2], ['P', 2.19, 4, 2], ['S', 2.58, 5, 2], ['Cl', 3.16, 6, 2],
  ['Br', 2.96, 6, 3],
  ['I', 2.66, 6, 4],
];
FIGURES.push({
  id: 'en-trend',
  section: 'electronegativity',
  anchor: 'the pull is felt more strongly.</p>',
  lessons: ['electronegativity'],
  viewBox: '0 0 340 316',
  alt: 'A cut-down periodic table with each cell showing an element symbol and its Pauling electronegativity, shaded darker for larger values. Columns are groups 1, 2 and 13 to 17. Row 1: H 2.20. Row 2: Li 0.98, Be 1.57, B 2.04, C 2.55, N 3.04, O 3.44, F 3.98. Row 3: Na 0.93, Mg 1.31, Al 1.61, Si 1.90, P 2.19, S 2.58, Cl 3.16. Under chlorine: Br 2.96 in row 4 and I 2.66 in row 5. An arrow along the bottom points right, labeled increases across a row. An arrow up the left side points up, labeled increases up a group. Fluorine, top right, is the darkest cell.',
  build() {
    let s = '';
    const x0 = 46, y0 = 40, w = 40, h = 40, gx = 2;
    const groups = ['1', '2', '13', '14', '15', '16', '17'];
    groups.forEach((g, i) => { s += tgMut(x0 + i * (w + gx) + w / 2, 28, g); });
    s += tgMut(x0 - 4, 14, 'group', { anchor: 'start' });
    for (const [sym, v, col, row] of TREND) {
      const x = x0 + col * (w + gx), y = y0 + row * (h + gx);
      const op = r2(0.06 + ((v - 0.9) / 3.1) * 0.5);
      s += `<rect class="fg-fill-hi" x="${x}" y="${y}" width="${w}" height="${h}" rx="5" opacity="${op}"></rect>`;
      s += `<rect class="fg-panel" x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill-opacity="0"></rect>`;
      s += text(x + w / 2, y + 17, sym, { cls: 'fg-lbl' });
      s += text(x + w / 2, y + 33, v.toFixed(2), { cls: 'fg-tag' });
    }
    // notes in the empty space
    s += tgMut(x0, y0 + 3 * (h + gx) + 16, 'rows 4 and 5: only', { anchor: 'start' });
    s += tgMut(x0, y0 + 3 * (h + gx) + 31, 'the halogens shown', { anchor: 'start' });
    s += tgMut(x0, y0 + 4 * (h + gx) + 16, 'group 18 (noble gases)', { anchor: 'start' });
    s += tgMut(x0, y0 + 4 * (h + gx) + 31, 'left out: no bonds', { anchor: 'start' });
    // arrows
    const yb = y0 + 5 * (h + gx) + 14;
    s += arrow(P(x0, yb), P(x0 + 7 * (w + gx) - gx, yb));
    s += tg(x0 + 3.5 * (w + gx), yb + 20, 'increases across a row →');
    s += arrow(P(24, y0 + 5 * (h + gx) - 4), P(24, y0));
    s += `<text class="fg-tag" x="14" y="${y0 + 2.5 * (h + gx)}" text-anchor="middle" transform="rotate(-90 14 ${y0 + 2.5 * (h + gx)})">increases up a group</text>`;
    return s;
  },
  caption: 'Darker cells pull harder. Follow row 2 from left to right, then the group 17 column from bottom to top.',
});

/* ------------------------------------------------------- en-chloromethane ---
   CH3Cl drawn in three dimensions (plain line in the page, wedge toward the
   reader, hash away), with the one polar bond picked out. */
FIGURES.push({
  id: 'en-chloromethane',
  section: 'electronegativity',
  anchor: 'Chloromethane, CH₃Cl',
  lessons: ['electronegativity'],
  viewBox: '0 0 340 250',
  alt: 'Chloromethane, CH3Cl, with every atom labeled. The carbon has one hydrogen in the page pointing up and to the left, one hydrogen on a solid wedge and one on a hashed wedge below, and a chlorine in the page to the right, with its three lone pairs drawn. The C–Cl bond is highlighted, with a shaded cloud bulging toward chlorine; chlorine is marked δ− and carbon δ+. A label by the upper hydrogen reads C–H, difference 0.35, treated as nonpolar. A label by the chlorine reads C–Cl, difference 0.61, polar. A label at the bottom reads the carbon is electron-poor.',
  build() {
    let s = '';
    const c = P(120, 122);
    const cl = P(212, 122);
    const hUp = at(c, 125, 62), hW = at(c, 240, 60), hH = at(c, 290, 60);
    s += cloud(c.x, cl.x, c.y, 14, 30);
    s += bond(c, hUp, { rFrom: Cr, rTo: Hr });
    s += wedge(c, hW, { rFrom: Cr, rTo: Hr, width: 9 });
    s += hash(c, hH, { rFrom: Cr, rTo: Hr, width: 10, rungs: 4 });
    s += bond(c, cl, { rFrom: Cr, rTo: Xr, cls: 'fg-bond-hi' });
    s += lp(cl, 90) + lp(cl, 0) + lp(cl, -90);
    s += H(hUp) + H(hW) + H(hH) + C(c) + X(cl, 'Cl', 'hi');
    s += dPlus(c.x - 26, c.y + 4);
    s += dMinus(cl.x + 30, cl.y - 24);
    s += tg(hUp.x + 18, hUp.y - 24, 'C–H: ΔEN 0.35', { anchor: 'start' });
    s += tgMut(hUp.x + 18, hUp.y - 10, 'treated as nonpolar', { anchor: 'start' });
    s += tg(252, 184, 'C–Cl: ΔEN 0.61', { anchor: 'start' });
    s += tg(252, 198, 'polar', { anchor: 'start' });
    s += tg(170, 238, 'the δ+ carbon is the electron-poor site');
    return s;
  },
  caption: 'Plain lines lie in the page, the solid wedge comes toward you and the hashed wedge goes away. Only the highlighted bond has a lopsided cloud.',
});

/* --------------------------------------------------------------- en-cancel ---
   Two molecules whose polar bonds cancel: CO2 (a straight line) and CCl4
   (four bonds pointing to the corners of a tetrahedron). Beside each polar
   bond, a short arrow shows the direction of the pull. */
FIGURES.push({
  id: 'en-cancel',
  section: 'electronegativity',
  anchor: 'Polar bonds do not guarantee a polar molecule.',
  viewBox: '0 0 340 380',
  alt: 'Two molecules made only of polar bonds, every atom labeled. Top: carbon dioxide drawn as a straight line, O=C=O, each oxygen with two lone pairs. Each oxygen is marked δ− and the carbon δ+. Under each C=O bond an arrow points from carbon out toward that oxygen. The two arrows are the same length and point in opposite directions, labeled equal and opposite: they cancel. Bottom: carbon tetrachloride, a carbon with four chlorines, two in the page, one on a solid wedge toward the reader and one on a hashed wedge away. Beside each C–Cl bond an arrow points out toward the chlorine. A label says four equal pulls, spread evenly in space, cancel. Both molecules are labeled no overall polarity.',
  build() {
    let s = '';
    // CO2
    s += tgMut(10, 20, 'carbon dioxide, CO₂: a straight line', { anchor: 'start' });
    const c = P(170, 72), o1 = P(96, 72), o2 = P(244, 72);
    s += bond(o1, c, { rFrom: Xr, rTo: Cr, order: 2 }) + bond(c, o2, { rFrom: Cr, rTo: Xr, order: 2 });
    s += lp(o1, 135) + lp(o1, 225) + lp(o2, 45) + lp(o2, -45);
    s += X(o1, 'O', 'hi') + C(c) + X(o2, 'O', 'hi');
    s += dPlus(c.x, c.y - 22);
    s += dMinus(o1.x - 34, o1.y + 4) + dMinus(o2.x + 34, o2.y + 4);
    s += arrow(P(158, 104), P(106, 104)) + arrow(P(182, 104), P(234, 104));
    s += tg(170, 128, 'equal and opposite: they cancel');
    s += tgMut(170, 144, 'no overall polarity');
    s += rule(10, 160, 330, 160);
    // CCl4
    s += tgMut(10, 180, 'carbon tetrachloride, CCl₄', { anchor: 'start' });
    const k = P(150, 270);
    const up = at(k, 90, 64), left = at(k, 200, 66), w = at(k, 305, 64), hs = at(k, 340, 72);
    s += bond(k, up, { rFrom: Cr, rTo: Xr });
    s += bond(k, left, { rFrom: Cr, rTo: Xr });
    s += wedge(k, w, { rFrom: Cr, rTo: Xr, width: 10 });
    s += hash(k, hs, { rFrom: Cr, rTo: Xr, width: 11, rungs: 4 });
    // pull arrows, offset to one side of each bond
    const pull = (end, side) => {
      const dx = end.x - k.x, dy = end.y - k.y, L = Math.hypot(dx, dy);
      const ux = dx / L, uy = dy / L, px = -uy * side, py = ux * side;
      return arrow(P(k.x + ux * 20 + px * 13, k.y + uy * 20 + py * 13), P(k.x + ux * (L - 22) + px * 13, k.y + uy * (L - 22) + py * 13), { size: 7 });
    };
    s += pull(up, -1) + pull(left, -1) + pull(w, 1) + pull(hs, -1);
    for (const p of [up, left, w, hs]) s += X(p, 'Cl', 'hi');
    s += C(k);
    s += tg(252, 214, 'four equal pulls,', { anchor: 'middle' });
    s += tg(252, 228, 'spread evenly', { anchor: 'middle' });
    s += tg(252, 242, 'in space: they cancel', { anchor: 'middle' });
    s += tgMut(170, 368, 'no overall polarity');
    return s;
  },
  caption: 'Each short arrow shows which way one bond’s shared electrons are pulled. In both molecules the arrows balance, so neither molecule has a positive end and a negative end. Lone pairs on the chlorines are left out to keep the arrows clear.',
});

/* ------------------------------------------------------------ en-induction ---
   Chloroacetic acid and 4-chlorobutanoic acid drawn with every atom. Short
   arrows over the C–C bonds show the pull toward chlorine, shrinking with
   each bond; the bonds from Cl to the COOH carbon are numbered. */
function acidRow(y0, nCH2) {
  let s = '';
  const step = 48;
  const cl = P(28, y0);
  const chain = [];
  for (let i = 0; i < nCH2; i++) chain.push(P(28 + step * (i + 1), y0));
  const c1 = P(28 + step * (nCH2 + 1), y0);
  const oh = P(c1.x + step, y0), h = P(oh.x + 40, y0);
  const oDbl = P(c1.x, y0 - 50);
  // bonds
  s += bond(cl, chain[0], { rFrom: Xr, rTo: Cr, cls: 'fg-bond-hi' });
  for (let i = 0; i < nCH2 - 1; i++) s += bond(chain[i], chain[i + 1], { rFrom: Cr, rTo: Cr });
  s += bond(chain[nCH2 - 1], c1, { rFrom: Cr, rTo: Cr });
  s += bond(c1, oDbl, { rFrom: Cr, rTo: Xr, order: 2 });
  s += bond(c1, oh, { rFrom: Cr, rTo: Xr }) + bond(oh, h, { rFrom: Xr, rTo: Hr });
  for (const p of chain) {
    const hu = P(p.x, p.y - 42), hd = P(p.x, p.y + 42);
    s += bond(p, hu, { rFrom: Cr, rTo: Hr }) + bond(p, hd, { rFrom: Cr, rTo: Hr }) + H(hu) + H(hd);
  }
  s += lp(oDbl, 45, 22) + lp(oDbl, 135, 22) + lp(oh, 60, 22) + lp(oh, -90, 22);
  s += lp(cl, 90, 22) + lp(cl, 180, 22) + lp(cl, -90, 22);
  s += X(cl, 'Cl', 'hi');
  chain.forEach((p) => { s += C(p); });
  s += C(c1) + X(oDbl, 'O') + X(oh, 'O') + H(h);
  // pull arrows over each bond between Cl and C1, pointing toward Cl,
  // shrinking as they get further away
  const pts = [cl, ...chain, c1];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i + 1], b = pts[i];
    const shrink = Math.min(i * 5, 12);
    const muted = i >= 2;
    s += arrow(P(a.x - 16 - shrink / 2, y0 - 20), P(b.x + 16 + shrink / 2, y0 - 20), { size: 6, muted });
    s += tgMut((a.x + b.x) / 2, y0 + 16, String(i + 1));
  }
  return { s, c1 };
}
FIGURES.push({
  id: 'en-induction',
  section: 'electronegativity',
  anchor: 'This is the <b>inductive effect</b>.',
  lessons: ['electronegativity'],
  viewBox: '0 0 340 362',
  alt: 'Two acids drawn with every atom labeled. Top: chloroacetic acid, Cl–CH2–C(=O)–O–H. The bonds from chlorine to the carbon of the COOH group are numbered 1 and 2, and a short arrow over each points back toward chlorine. A label reads pKa 2.86: the pull reaches the COOH group. Bottom: 4-chlorobutanoic acid, Cl–CH2–CH2–CH2–C(=O)–O–H. Its bonds from chlorine to the COOH carbon are numbered 1 to 4. The arrows over them shrink and fade with each bond away from chlorine. A label reads pKa 4.52, close to acetic acid’s 4.76: the pull has faded.',
  build() {
    let s = '';
    s += tgMut(10, 18, 'chloroacetic acid: Cl is 2 bonds from the COOH carbon', { anchor: 'start' });
    const top = acidRow(94, 1);
    s += top.s;
    s += tg(10, 166, 'pKa 2.86: the pull reaches the COOH group', { anchor: 'start' });
    s += rule(10, 178, 330, 178);
    s += tgMut(10, 198, '4-chlorobutanoic acid: 4 bonds away', { anchor: 'start' });
    const bot = acidRow(280, 3);
    s += bot.s;
    s += tg(10, 352, 'pKa 4.52, close to acetic acid’s 4.76: faded', { anchor: 'start' });
    return s;
  },
  caption: 'The arrows over the numbered bonds show the pull toward chlorine. In the lower acid they shrink and fade before they reach the COOH group.',
});

/* ----------------------------------------------------------- en-pka-ladder ---
   The measured pKa values, with a bar for acid strength. Lower pKa is the
   stronger acid, so the bar grows as the pKa falls. */
FIGURES.push({
  id: 'en-pka-ladder',
  section: 'electronegativity',
  anchor: 'dies off with distance',
  lessons: ['electronegativity'],
  viewBox: '0 0 340 290',
  alt: 'Five acids in a table, each with its formula, its name, its pKa and a bar that grows as the acid gets stronger. Acetic acid, CH3–COOH, pKa 4.76, short bar. Chloroacetic acid, ClCH2–COOH, pKa 2.86, longer bar. Dichloroacetic acid, Cl2CH–COOH, pKa 1.29, longer still. Trichloroacetic acid, Cl3C–COOH, pKa 0.65, longest bar. Set apart below: 4-chlorobutanoic acid, Cl–CH2CH2CH2–COOH, pKa 4.52, a short muted bar almost the same as acetic acid.',
  build() {
    let s = '';
    s += tgMut(10, 20, 'acid', { anchor: 'start' });
    s += tgMut(206, 20, 'pKa', { anchor: 'end' });
    s += tgMut(218, 20, 'stronger acid →', { anchor: 'start' });
    const rows = [
      { f: 'CH₃–COOH', n: 'acetic acid', p: 4.76, y: 50 },
      { f: 'ClCH₂–COOH', n: 'chloroacetic acid', p: 2.86, y: 98 },
      { f: 'Cl₂CH–COOH', n: 'dichloroacetic acid', p: 1.29, y: 146 },
      { f: 'Cl₃C–COOH', n: 'trichloroacetic acid', p: 0.65, y: 194 },
      { f: 'Cl–CH₂CH₂CH₂–COOH', n: '4-chlorobutanoic acid', p: 4.52, y: 262, mut: true },
    ];
    for (const r of rows) {
      s += text(10, r.y, r.f, { cls: 'fg-lbl', anchor: 'start' });
      s += tgMut(10, r.y + 15, r.n, { anchor: 'start' });
      s += text(206, r.y + 4, r.p.toFixed(2), { cls: 'fg-lbl', anchor: 'end' });
      const w = 14 + ((4.9 - r.p) / 4.25) * 96;
      s += `<rect class="${r.mut ? 'fg-fill-mut' : 'fg-fill-hi'}" x="218" y="${r.y - 8}" width="${r2(w)}" height="14" rx="6" opacity="${r.mut ? 0.45 : r2(0.35 + (4.9 - r.p) / 4.25 * 0.6)}"></rect>`;
    }
    s += rule(10, 226, 330, 226);
    s += tgMut(10, 244, 'the same chlorine, moved two bonds further off:', { anchor: 'start' });
    return s;
  },
  caption: 'Read the pKa column down the first four rows: each chlorine lowers it, by a smaller step each time. Then compare the last row with acetic acid.',
});

/* ---------------------------------------------------------- l-chlorobutane ---
   Lesson only: 2-chlorobutane with every atom drawn and its four carbons
   lettered a to d, so the question can name them. */
FIGURES.push({
  id: 'l-chlorobutane',
  lessons: ['electronegativity'],
  viewBox: '0 0 340 190',
  alt: '2-Chlorobutane with every atom labeled: four carbons in a row, lettered a, b, c and d from left to right. Carbon a carries three hydrogens, carbon b carries one hydrogen and a chlorine (below it, with three lone pairs), carbon c carries two hydrogens and carbon d three hydrogens.',
  build() {
    let s = '';
    const y = 72, xs = [80, 146, 212, 278];
    const cs = xs.map((x) => P(x, y));
    for (let i = 0; i < 3; i++) s += bond(cs[i], cs[i + 1], { rFrom: Cr, rTo: Cr });
    const hs = [];
    cs.forEach((p, i) => {
      hs.push(P(p.x, p.y - 44));
      if (i !== 1) hs.push(P(p.x, p.y + 44));
    });
    hs.push(P(cs[0].x - 46, y), P(cs[3].x + 46, y));
    const cl = P(cs[1].x, y + 58);
    hs.forEach((h) => {
      const c = cs.reduce((best, p) => (Math.hypot(p.x - h.x, p.y - h.y) < Math.hypot(best.x - h.x, best.y - h.y) ? p : best));
      s += bond(c, h, { rFrom: Cr, rTo: Hr });
    });
    s += bond(cs[1], cl, { rFrom: Cr, rTo: Xr, cls: 'fg-bond-hi' });
    s += lp(cl, 0, 22) + lp(cl, 180, 22) + lp(cl, -90, 22);
    hs.forEach((h) => { s += H(h); });
    cs.forEach((p) => { s += C(p); });
    s += X(cl, 'Cl', 'hi');
    ['a', 'b', 'c', 'd'].forEach((l, i) => { s += tg(cs[i].x + 20, cs[i].y - 14, l); });
    return s;
  },
  caption: 'Four carbons in a row, lettered a to d. The chlorine hangs below carbon b.',
});

export default FIGURES;
