/* Figures for the radical-halogenation notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions used throughout:
   - a radical's unpaired electron is one larger dot (`dot`), a lone pair is
     two small ones, so a Cl• carries three pairs and one single dot;
   - every arrow in a radical step is a fishhook with ONE barb, because it
     moves one electron; a bond that breaks or forms needs two of them;
   - figures shown in the lesson are 340 wide, stacked, and use only
     fg-lbl / fg-tag text. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];
const f2 = (v) => (Math.round(v * 100) / 100);

/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${f2(x)}" cy="${f2(y)}" r="3.4"></circle>`;

/* A fishhook: one barb, because it carries one electron. `curve` in the kit
   draws a full two-barbed head, which in a radical mechanism says the wrong
   thing about how many electrons moved. */
function fishhook(a, b, opts = {}) {
  const bow = opts.bow ?? 30;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;
  let ux = b.x - cx, uy = b.y - cy;
  const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const size = opts.size ?? 9;
  const px = -uy, py = ux;
  const side = opts.side ?? 1;
  const bx = b.x - ux * size, by = b.y - uy * size;
  const h = size * 0.6 * side;
  return `<path class="fg-arrow" d="M${f2(a.x)} ${f2(a.y)} Q${f2(cx)} ${f2(cy)} ${f2(bx)} ${f2(by)}"></path>` +
         `<path class="fg-head" d="M${f2(b.x)} ${f2(b.y)} L${f2(bx + px * h)} ${f2(by + py * h)} L${f2(bx)} ${f2(by)} Z"></path>`;
}

/* A halogen atom with its lone pairs at the given angles and, optionally,
   its unpaired electron at `dotAt` degrees (screen angles, 0 = east,
   90 = south). */
function hal(x, y, sym, lps, dotAt = null) {
  let g = '';
  for (const a of lps) g += lonePair(x, y, a, { dist: 24 });
  g += atom(x, y, sym, { kind: 'warn' });
  if (dotAt !== null) {
    const r = (dotAt * Math.PI) / 180;
    g += dot(x + Math.cos(r) * 23, y + Math.sin(r) * 23);
  }
  return g;
}
/* A methyl group written H₃C, with its unpaired electron on the right if
   it is a radical. */
function me(x, y, radical = false) {
  return atom(x, y, 'H₃C', { r: 18 }) + (radical ? dot(x + 25, y) : '');
}
const hAtom = (x, y) => atom(x, y, 'H', { r: 13 });
const plusSign = (x, y) => text(x, y + 5, '+', { cls: 'fg-lbl', size: 13 });

/* ------------------------------------------------------------------------
   Heterolysis against homolysis, one bond each, drawn with the arrows
   that describe them. */
function heteroPanel(ox, oy) {
  let s = '';
  const Y = oy + 92;
  s += tag(ox + 170, oy + 22, 'HETEROLYSIS');
  s += text(ox + 170, oy + 42, 'one arrow with a two-barbed head', { cls: 'fg-tag-mut', size: 11 });
  s += bond(P(ox + 40, Y), P(ox + 110, Y), { rFrom: 13, rTo: 16 });
  s += hAtom(ox + 40, Y);
  s += hal(ox + 110, Y, 'Br', [-90, 90, 0]);
  s += curve(P(ox + 72, Y - 5), P(ox + 97, Y - 13), { bow: -12 });
  s += arrow(P(ox + 150, Y), P(ox + 196, Y), { muted: true });
  s += hAtom(ox + 220, Y);
  s += text(ox + 236, Y - 12, '+', { cls: 'fg-warn', size: 15 });
  s += hal(ox + 292, Y, 'Br', [-135, -45, 45, 135]);
  s += text(ox + 318, Y - 14, '−', { cls: 'fg-warn', size: 15 });
  s += label(ox + 170, oy + 150, 'both electrons go to Br', { size: 13 });
  s += label(ox + 170, oy + 170, 'products: H⁺ and Br⁻, both charged', { size: 13 });
  return s;
}
function homoPanel(ox, oy) {
  let s = '';
  const Y = oy + 92;
  s += tag(ox + 170, oy + 22, 'HOMOLYSIS');
  s += text(ox + 170, oy + 42, 'two fishhooks, one barb each', { cls: 'fg-tag-mut', size: 11 });
  s += bond(P(ox + 45, Y), P(ox + 115, Y), { rFrom: 16, rTo: 16 });
  s += hal(ox + 45, Y, 'Br', [180, 115, -115]);
  s += hal(ox + 115, Y, 'Br', [0, 65, -65]);
  s += fishhook(P(ox + 76, Y - 5), P(ox + 55, Y - 16), { bow: 8 });
  s += fishhook(P(ox + 84, Y - 5), P(ox + 105, Y - 16), { bow: -8 });
  s += arrow(P(ox + 150, Y), P(ox + 196, Y), { muted: true });
  s += label(ox + 173, Y - 10, 'light', { size: 13 });
  s += hal(ox + 222, Y, 'Br', [180, 90, -90], -40);
  s += plusSign(ox + 258, Y);
  s += hal(ox + 300, Y, 'Br', [0, 90, -90], -140);
  s += label(ox + 170, oy + 150, 'one electron goes to each Br', { size: 13 });
  s += label(ox + 170, oy + 170, 'products: two Br•, neither charged', { size: 13 });
  return s;
}

FIGURES.push({
  id: 'homolysis-vs-heterolysis',
  section: 'radical-halogenation',
  anchor: '<h3>Homolysis, and the arrow that moves one electron</h3>',
  alt: 'Left: H–Br breaking heterolytically. One curved arrow with a two-barbed head moves both bonding electrons onto bromine, giving H+ and Br− with four lone pairs. Right: Br–Br breaking homolytically under light. Two single-barbed fishhook arrows send one electron to each bromine, giving two neutral bromine radicals, each with three lone pairs and one unpaired electron.',
  viewBox: '0 0 760 190',
  build() {
    return heteroPanel(20, 0) + rule(380, 12, 380, 178) + homoPanel(400, 0);
  },
  caption: 'Count the barbs on each arrow, then count the charges on the products.',
});
FIGURES.push({
  id: 'l-homolysis-vs-heterolysis',
  lessons: ['radical-halogenation'],
  alt: 'Top: H–Br breaking heterolytically. One two-barbed arrow moves both bonding electrons onto bromine, giving H+ and Br−. Bottom: Br–Br breaking homolytically under light. Two single-barbed fishhooks send one electron to each bromine, giving two neutral bromine radicals.',
  viewBox: '0 0 340 380',
  build() {
    return panel(2, 2, 336, 184) + heteroPanel(0, 4) + panel(2, 194, 336, 184) + homoPanel(0, 196);
  },
  caption: 'Two barbs move a pair; one barb moves a single electron.',
});

/* ------------------------------------------------------------------------
   The chain, drawn as a chain: the two propagation steps loop, the other
   two stages only start and stop it. */
FIGURES.push({
  id: 'radical-chain',
  section: 'radical-halogenation',
  anchor: '<h3>Three stages, and only one of them repeats</h3>',
  alt: 'The chlorination of methane in three columns. Initiation: Cl–Cl splits into two Cl radicals under light or heat, radicals 0 to 2. Propagation: two boxed steps joined by arrows into a loop, Cl• plus CH4 giving •CH3 plus HCl, and •CH3 plus Cl2 giving CH3Cl plus Cl•, each using one radical and making one; net CH4 plus Cl2 gives CH3Cl plus HCl. Termination: three steps in which two radicals pair up, radicals 2 to 0.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    s += tag(112, 44, 'INITIATION');
    s += label(112, 92, 'Cl–Cl', { size: 14 });
    s += arrow(P(112, 108), P(112, 150));
    s += text(124, 134, 'light or heat', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += label(112, 176, 'Cl•  +  Cl•', { size: 14 });
    s += text(112, 214, 'radicals: 0 → 2', { cls: 'fg-tag-good', size: 10.5 });
    s += rule(224, 40, 224, 300);

    s += tag(400, 44, 'PROPAGATION');
    s += panel(272, 82, 256, 44, { kind: 'hi' });
    s += panel(272, 194, 256, 44, { kind: 'hi' });
    s += label(400, 109, 'Cl•  +  H–CH₃  →  •CH₃  +  H–Cl', { size: 12.5 });
    s += label(400, 221, '•CH₃  +  Cl–Cl  →  CH₃–Cl  +  Cl•', { size: 12.5 });
    s += curve(P(532, 104), P(532, 216), { bow: -34 });
    s += curve(P(268, 216), P(268, 104), { bow: -34 });
    s += text(400, 164, 'each step uses one radical', { cls: 'fg-sm', size: 10 });
    s += text(400, 178, 'and makes one', { cls: 'fg-sm', size: 10 });
    s += text(400, 266, 'radicals: 1 → 1, so the loop keeps going', { cls: 'fg-tag-good', size: 10.5 });
    s += text(400, 292, 'net:  CH₄  +  Cl₂  →  CH₃Cl  +  HCl', { cls: 'fg-lbl', size: 12 });
    s += rule(576, 40, 576, 300);

    s += tag(668, 44, 'TERMINATION');
    s += label(668, 96, 'Cl•  +  Cl•  →  Cl–Cl', { size: 11.5 });
    s += label(668, 130, '•CH₃  +  Cl•  →  CH₃–Cl', { size: 11.5 });
    s += label(668, 164, '•CH₃ + •CH₃ → CH₃–CH₃', { size: 11.5 });
    s += text(668, 214, 'radicals: 2 → 0', { cls: 'fg-tag-warn', size: 10.5 });
    return s;
  },
  caption: 'Read each column by its <b>radical count</b>. Only the middle column is a loop.',
});

/* ------------------------------------------------------------------------
   The same chain with every electron shown. Each bond that breaks or forms
   gets two fishhooks, one per electron. */
function mechRows(L) {
  /* L is a layout: { x: shift, rows: [...y], lesson } — the notes version
     puts each step on one line; the lesson version puts products under the
     reactants, so it is drawn by its own function below. */
  let s = '';
  const note = (Y, str) => text(740, Y - 50, str, { cls: 'fg-sm', size: 10, anchor: 'end' });
  const head = (Y, name, count) =>
    tag(40, Y - 50, name, { anchor: 'start' }) + text(40, Y - 33, count, { cls: 'fg-sm', size: 10, anchor: 'start' });

  // Initiation
  let Y = L[0];
  s += head(Y, 'INITIATION', 'radicals 0 → 2');
  s += note(Y, 'the Cl–Cl bond splits evenly: one electron to each atom');
  s += bond(P(230, Y), P(300, Y), { rFrom: 16, rTo: 16 });
  s += hal(230, Y, 'Cl', [180, 115, -115]);
  s += hal(300, Y, 'Cl', [0, 65, -65]);
  s += fishhook(P(261, Y - 5), P(240, Y - 16), { bow: 8 });
  s += fishhook(P(269, Y - 5), P(290, Y - 16), { bow: -8 });
  s += arrow(P(350, Y), P(420, Y), { muted: true });
  s += text(385, Y - 10, 'light or heat', { cls: 'fg-sm', size: 10 });
  s += hal(470, Y, 'Cl', [180, 90, -90], 0);
  s += plusSign(520, Y);
  s += hal(570, Y, 'Cl', [180, 90, -90], 0);
  s += rule(40, Y + 45, 720, Y + 45);

  // Propagation 1
  Y = L[1];
  s += head(Y, 'PROPAGATION 1', 'radicals 1 → 1');
  s += note(Y, 'the C–H bond splits: one electron stays on carbon, one pairs with chlorine’s');
  s += bond(P(200, Y), P(268, Y), { rFrom: 18, rTo: 13 });
  s += me(200, Y);
  s += hAtom(268, Y);
  s += hal(370, Y, 'Cl', [-90, 90, 0], 180);
  s += fishhook(P(236, Y + 5), P(213, Y + 15), { bow: -8 });
  s += fishhook(P(240, Y - 5), P(312, Y - 12), { bow: -22 });
  s += fishhook(P(345, Y - 5), P(323, Y - 12), { bow: 8 });
  s += arrow(P(410, Y), P(470, Y), { muted: true });
  s += me(510, Y, true);
  s += plusSign(565, Y);
  s += bond(P(605, Y), P(655, Y), { rFrom: 13, rTo: 16 });
  s += hAtom(605, Y);
  s += hal(655, Y, 'Cl', [-90, 90, 0]);
  s += rule(40, Y + 45, 720, Y + 45);

  // Propagation 2
  Y = L[2];
  s += head(Y, 'PROPAGATION 2', 'radicals 1 → 1');
  s += note(Y, 'the product forms, and a fresh Cl• carries the chain on');
  s += me(190, Y, true);
  s += bond(P(300, Y), P(370, Y), { rFrom: 16, rTo: 16 });
  s += hal(300, Y, 'Cl', [180, 115, -115]);
  s += hal(370, Y, 'Cl', [0, 60, -60]);
  s += fishhook(P(218, Y - 4), P(246, Y - 10), { bow: -8 });
  s += fishhook(P(333, Y + 5), P(252, Y + 8), { bow: -46 });
  s += fishhook(P(339, Y - 5), P(359, Y - 15), { bow: -8 });
  s += arrow(P(415, Y), P(470, Y), { muted: true });
  s += bond(P(510, Y), P(578, Y), { rFrom: 18, rTo: 16 });
  s += me(510, Y);
  s += hal(578, Y, 'Cl', [-90, 90, 0]);
  s += plusSign(628, Y);
  s += hal(675, Y, 'Cl', [-90, 90, 180], 0);
  s += rule(40, Y + 45, 720, Y + 45);

  // Termination
  Y = L[3];
  s += head(Y, 'TERMINATION', 'radicals 2 → 0');
  s += note(Y, 'two radicals pair their electrons, and the chain stops');
  s += me(210, Y, true);
  s += hal(320, Y, 'Cl', [-90, 90, 0], 180);
  s += fishhook(P(238, Y - 4), P(262, Y - 11), { bow: -7 });
  s += fishhook(P(294, Y - 4), P(270, Y - 11), { bow: 7 });
  s += arrow(P(365, Y), P(425, Y), { muted: true });
  s += bond(P(475, Y), P(543, Y), { rFrom: 18, rTo: 16 });
  s += me(475, Y);
  s += hal(543, Y, 'Cl', [-90, 90, 0]);
  return s;
}

FIGURES.push({
  id: 'radical-mechanism-drawn',
  section: 'radical-halogenation',
  anchor: '<h3>Three stages, and only one of them repeats</h3>',
  alt: 'The chlorination of methane drawn with fishhook arrows. Initiation: two fishhooks split Cl–Cl into two chlorine radicals. Propagation 1: three fishhooks break a C–H bond of H3C–H, one electron going to carbon and one meeting the chlorine radical’s electron to make H–Cl, leaving the methyl radical. Propagation 2: three fishhooks let the methyl radical take one chlorine from Cl2, making CH3Cl and a new chlorine radical. Termination: two fishhooks pair a methyl radical with a chlorine radical to give CH3Cl.',
  viewBox: '0 0 760 540',
  build() { return mechRows([100, 230, 360, 490]); },
  caption: 'Every arrow has <b>one barb</b>, and nothing on the page carries a charge.',
});

/* Lesson copy: each step in its own panel, products under the reactants. */
FIGURES.push({
  id: 'l-radical-mechanism',
  lessons: ['radical-halogenation'],
  alt: 'The chlorination of methane in four stacked panels, drawn with single-barbed fishhook arrows. Initiation: Cl–Cl splits into two chlorine radicals, 0 to 2 radicals. Propagation 1: a chlorine radical takes a hydrogen from methane, giving the methyl radical and H–Cl, 1 to 1. Propagation 2: the methyl radical takes a chlorine from Cl2, giving CH3Cl and a new chlorine radical, 1 to 1. Termination: a methyl radical and a chlorine radical pair up to give CH3Cl, 2 to 0.',
  viewBox: '0 0 340 740',
  build() {
    let s = '';
    const H = 182;
    const box = (i, title) => {
      const oy = i * (H + 4);
      return { oy, Y1: oy + 72, Y2: oy + 152, g: panel(2, oy + 2, 336, H) + tag(170, oy + 24, title) };
    };
    const down = (oy, lbl) => arrow(P(170, oy + 100), P(170, oy + 128), { muted: true }) +
      (lbl ? label(182, oy + 119, lbl, { anchor: 'start', size: 13 }) : '');

    // Initiation
    let b = box(0, 'INITIATION · RADICALS 0 → 2');
    s += b.g;
    s += bond(P(135, b.Y1), P(205, b.Y1), { rFrom: 16, rTo: 16 });
    s += hal(135, b.Y1, 'Cl', [180, 115, -115]);
    s += hal(205, b.Y1, 'Cl', [0, 65, -65]);
    s += fishhook(P(166, b.Y1 - 5), P(145, b.Y1 - 16), { bow: 8 });
    s += fishhook(P(174, b.Y1 - 5), P(195, b.Y1 - 16), { bow: -8 });
    s += down(b.oy, 'light');
    s += hal(112, b.Y2, 'Cl', [180, 90, -90], 0);
    s += plusSign(170, b.Y2);
    s += hal(228, b.Y2, 'Cl', [0, 90, -90], 180);

    // Propagation 1
    b = box(1, 'PROPAGATION 1 · RADICALS 1 → 1');
    s += b.g;
    s += bond(P(80, b.Y1), P(148, b.Y1), { rFrom: 18, rTo: 13 });
    s += me(80, b.Y1);
    s += hAtom(148, b.Y1);
    s += hal(250, b.Y1, 'Cl', [-90, 90, 0], 180);
    s += fishhook(P(116, b.Y1 + 5), P(93, b.Y1 + 15), { bow: -8 });
    s += fishhook(P(120, b.Y1 - 5), P(192, b.Y1 - 12), { bow: -22 });
    s += fishhook(P(225, b.Y1 - 5), P(203, b.Y1 - 12), { bow: 8 });
    s += down(b.oy);
    s += me(90, b.Y2, true);
    s += plusSign(150, b.Y2);
    s += bond(P(195, b.Y2), P(245, b.Y2), { rFrom: 13, rTo: 16 });
    s += hAtom(195, b.Y2);
    s += hal(245, b.Y2, 'Cl', [-90, 90, 0]);

    // Propagation 2
    b = box(2, 'PROPAGATION 2 · RADICALS 1 → 1');
    s += b.g;
    s += me(55, b.Y1, true);
    s += bond(P(165, b.Y1), P(235, b.Y1), { rFrom: 16, rTo: 16 });
    s += hal(165, b.Y1, 'Cl', [180, 115, -115]);
    s += hal(235, b.Y1, 'Cl', [0, 60, -60]);
    s += fishhook(P(83, b.Y1 - 4), P(111, b.Y1 - 10), { bow: -8 });
    s += fishhook(P(198, b.Y1 + 5), P(117, b.Y1 + 8), { bow: -46 });
    s += fishhook(P(204, b.Y1 - 5), P(224, b.Y1 - 15), { bow: -8 });
    s += down(b.oy);
    s += bond(P(70, b.Y2), P(138, b.Y2), { rFrom: 18, rTo: 16 });
    s += me(70, b.Y2);
    s += hal(138, b.Y2, 'Cl', [-90, 90, 0]);
    s += plusSign(195, b.Y2);
    s += hal(245, b.Y2, 'Cl', [-90, 90, 180], 0);

    // Termination
    b = box(3, 'TERMINATION · RADICALS 2 → 0');
    s += b.g;
    s += me(110, b.Y1, true);
    s += hal(220, b.Y1, 'Cl', [-90, 90, 0], 180);
    s += fishhook(P(138, b.Y1 - 4), P(162, b.Y1 - 11), { bow: -7 });
    s += fishhook(P(194, b.Y1 - 4), P(170, b.Y1 - 11), { bow: 7 });
    s += down(b.oy);
    s += bond(P(136, b.Y2), P(204, b.Y2), { rFrom: 18, rTo: 16 });
    s += me(136, b.Y2);
    s += hal(204, b.Y2, 'Cl', [-90, 90, 0]);
    return s;
  },
  caption: 'Each arrow has one barb and moves one electron.',
});

/* ------------------------------------------------------------------------
   Equivalent hydrogens, marked set by set, with the carbons written out so
   the hydrogens can be counted. */
function hSetMolecule(atoms, bonds) {
  let s = '';
  for (const [i, j] of bonds) s += bond(atoms[i], atoms[j], { rFrom: 18, rTo: 18 });
  for (const a of atoms) {
    s += atom(a.x, a.y, a.lbl, { r: 18, kind: a.kind });
    s += text(a.lx ?? a.x, a.ly ?? a.y + 36, a.set, { cls: 'fg-tag', size: 11 });
  }
  return s;
}
FIGURES.push({
  id: 'radical-h-sets',
  section: 'radical-halogenation',
  lessons: ['radical-halogenation'],
  anchor: '<h3>Count the hydrogens</h3>',
  alt: 'Three alkanes with each carbon written out and its hydrogens sorted into sets. Propane: the two end CH3 groups are set a, six primary hydrogens; the middle CH2 is set b, two secondary hydrogens; two sets, two monochlorides. 2-Methylpropane: the three CH3 groups are set a, nine primary hydrogens; the central CH is set b, one tertiary hydrogen. Butane: the two end CH3 groups are set a, six primary hydrogens; the two CH2 groups are set b, four secondary hydrogens; two sets, two monochlorides.',
  viewBox: '0 0 340 560',
  build() {
    let s = '';
    const A = (x, y, lbl, set, kind, extra = {}) => ({ x, y, lbl, set, kind, ...extra });
    // Propane
    s += tag(170, 22, 'PROPANE');
    s += hSetMolecule([A(80, 66, 'CH₃', 'a', 'hi'), A(170, 66, 'CH₂', 'b', 'warn'), A(260, 66, 'CH₃', 'a', 'hi')], [[0, 1], [1, 2]]);
    s += label(170, 132, 'a: 6 primary H   b: 2 secondary H', { size: 13 });
    s += label(170, 152, 'two sets, so two monochlorides', { size: 13 });
    s += rule(20, 172, 320, 172);
    // 2-Methylpropane
    s += tag(170, 196, '2-METHYLPROPANE');
    s += hSetMolecule([
      A(170, 290, 'CH', 'b', 'warn', { lx: 170, ly: 326 }),
      A(80, 290, 'CH₃', 'a', 'hi'), A(260, 290, 'CH₃', 'a', 'hi'),
      A(170, 226, 'CH₃', 'a', 'hi', { lx: 200, ly: 230 }),
    ], [[0, 1], [0, 2], [0, 3]]);
    s += label(170, 356, 'a: 9 primary H   b: 1 tertiary H', { size: 13 });
    s += label(170, 376, 'two sets, so two monochlorides', { size: 13 });
    s += rule(20, 396, 320, 396);
    // Butane
    s += tag(170, 420, 'BUTANE');
    s += hSetMolecule([A(44, 464, 'CH₃', 'a', 'hi'), A(128, 464, 'CH₂', 'b', 'warn'), A(212, 464, 'CH₂', 'b', 'warn'), A(296, 464, 'CH₃', 'a', 'hi')], [[0, 1], [1, 2], [2, 3]]);
    s += label(170, 530, 'a: 6 primary H   b: 4 secondary H', { size: 13 });
    s += label(170, 550, 'two sets, so two monochlorides', { size: 13 });
    return s;
  },
  caption: 'Carbons with the same letter carry equivalent hydrogens.',
});
FIGURES.push({
  id: 'l-methylbutane-h-sets',
  lessons: ['radical-halogenation'],
  alt: '2-Methylbutane with each carbon written out. The two CH3 groups on C2 are set a, six primary hydrogens. The C2 CH is set b, one tertiary hydrogen. The C3 CH2 is set c, two secondary hydrogens. The C4 CH3 is set d, three primary hydrogens.',
  viewBox: '0 0 340 200',
  build() {
    let s = '';
    const A = (x, y, lbl, set, kind, extra = {}) => ({ x, y, lbl, set, kind, ...extra });
    s += tag(170, 20, '2-METHYLBUTANE');
    s += hSetMolecule([
      A(44, 110, 'CH₃', 'a', 'hi'), A(128, 110, 'CH', 'b', 'warn'),
      A(212, 110, 'CH₂', 'c', 'warn'), A(296, 110, 'CH₃', 'd', 'hi'),
      A(128, 48, 'CH₃', 'a', 'hi', { lx: 158, ly: 52 }),
    ], [[0, 1], [1, 2], [2, 3], [1, 4]]);
    s += label(170, 172, 'a: 6 H, 1°   b: 1 H, 3°', { size: 13 });
    s += label(170, 192, 'c: 2 H, 2°   d: 3 H, 1°', { size: 13 });
    return s;
  },
  caption: 'Four sets of hydrogens, so four possible monobromides.',
});

/* ------------------------------------------------------------------------
   Hammond, applied: in each panel the dark curve runs to the 1° radical and
   the teal curve to the 3° radical, which lies 5 kcal/mol lower. What
   differs is how much of that gap reaches the peak. */
function hill(x0, y0, px, py, x1, y1, cls) {
  return `<path class="${cls}" fill="none" d="M${f2(x0)} ${f2(y0)} C${f2(x0 + (px - x0) * 0.55)} ${f2(y0)} ${f2(px - 24)} ${f2(py)} ${f2(px)} ${f2(py)} C${f2(px + 24)} ${f2(py)} ${f2(x1 - (x1 - px) * 0.55)} ${f2(y1)} ${f2(x1)} ${f2(y1)}"></path>`;
}
function tsPanel(ox, oy, k) {
  let s = '';
  const x0 = ox + 34, x1 = ox + 300, yb = oy + 230;
  const cl = k === 'cl';
  s += text(ox + 170, oy + 22, cl ? 'CHLORINE: DOWNHILL, EARLY PEAK' : 'BROMINE: UPHILL, LATE PEAK',
    { cls: cl ? 'fg-tag-warn' : 'fg-tag-good', size: 11 });
  s += `<line class="fg-rule" x1="${x0 - 10}" y1="${yb}" x2="${x1 + 10}" y2="${yb}"></line>`;
  s += `<line class="fg-rule" x1="${x0 - 10}" y1="${yb}" x2="${x0 - 10}" y2="${oy + 44}"></line>`;
  s += text(x0 - 4, oy + 50, 'energy', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
  const y0 = cl ? oy + 120 : oy + 190;
  const p1 = cl ? oy + 160 : oy + 116;
  const p3 = cl ? oy + 186 : oy + 142;
  const px = x0 + (x1 - x0) * (cl ? 0.3 : 0.72);
  const pk1 = cl ? oy + 88 : oy + 74;
  const pk3 = cl ? oy + 84 : oy + 94;
  s += hill(x0, y0, px, pk1, x1, p1, 'fg-bond');
  s += hill(x0, y0, px, pk3, x1, p3, 'fg-bond-hi');
  s += label(x0 + 2, y0 + 20, cl ? 'R–H + Cl•' : 'R–H + Br•', { anchor: 'start', size: 13 });
  s += label(x1 + 6, p1 + 5, '1°', { anchor: 'start', size: 13 });
  s += label(x1 + 6, p3 + 5, '3°', { anchor: 'start', size: 13 });
  if (cl) {
    s += label(px + 16, pk3 - 8, 'peaks almost level', { anchor: 'start', size: 13 });
    s += label(x1, p3 + 24, 'R• + H–Cl', { anchor: 'end', size: 13 });
  } else {
    s += `<line class="fg-dash" x1="${f2(px + 10)}" y1="${pk1}" x2="${f2(px + 10)}" y2="${pk3}"></line>`;
    s += label(px - 14, pk1 + 2, '3° peak', { anchor: 'end', size: 13 });
    s += label(px - 14, pk1 + 20, 'far lower', { anchor: 'end', size: 13 });
    s += label(x1, p3 + 24, 'R• + H–Br', { anchor: 'end', size: 13 });
  }
  s += text(x1 + 10, yb + 16, 'reaction progress →', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });
  s += label(ox + 170, yb + 40, cl ? 'ΔH ≈ −5 kcal/mol' : 'ΔH ≈ +11 kcal/mol', { size: 13 });
  s += label(ox + 170, yb + 58, cl ? 'per H, 3° : 1° ≈ 5 : 1' : 'per H, 3° : 1° ≈ 1600 : 1', { size: 13 });
  return s;
}
const TS_ALT = 'Two energy diagrams for hydrogen abstraction. In each, a dark curve runs to the primary radical and a teal curve to the tertiary radical, which ends lower. Chlorine: the step runs downhill, the peaks sit early, near the reactants, and the two peaks are almost level; ΔH about −5 kcal/mol and 3° to 1° selectivity about 5 to 1. Bromine: the step runs uphill, the peaks sit late, near the products, and the tertiary peak is far lower; ΔH about +11 kcal/mol and selectivity about 1600 to 1.';
FIGURES.push({
  id: 'early-late-transition-state',
  section: 'radical-halogenation',
  anchor: '<h3>Why bromine is choosy and chlorine is not</h3>',
  alt: TS_ALT,
  viewBox: '0 0 760 330',
  build() {
    return tsPanel(20, 0, 'cl') + rule(380, 12, 380, 300) + tsPanel(400, 0, 'br') +
      label(380, 322, 'dark curve: toward the 1° radical    teal curve: toward the 3° radical', { size: 13 });
  },
  caption: 'Compare the two peaks in each panel, not the two ends.',
});
FIGURES.push({
  id: 'l-early-late-transition-state',
  lessons: ['radical-halogenation'],
  alt: TS_ALT,
  viewBox: '0 0 340 650',
  build() {
    return tsPanel(0, 0, 'cl') + rule(20, 300, 320, 300) + tsPanel(0, 306, 'br') +
      label(170, 626, 'dark: toward the 1° radical', { size: 13 }) +
      label(170, 644, 'teal: toward the 3° radical', { size: 13 });
  },
  caption: 'Compare the two peaks in each panel, not the two ends.',
});

/* ------------------------------------------------------------------------
   The flat radical and its two faces. */
const dir = (deg) => ({ x: Math.cos((deg * Math.PI) / 180), y: -Math.sin((deg * Math.PI) / 180) });
function lobe(c, deg, len, w, cls) {
  const d = dir(deg);
  const p = { x: -d.y, y: d.x };
  const at = (k, m) => P(c.x + d.x * len * k + p.x * w * m, c.y + d.y * len * k + p.y * w * m);
  const tip = at(1, 0), a1 = at(0.32, 0.62), a2 = at(1, 0.95), b2 = at(1, -0.95), b1 = at(0.32, -0.62);
  const pt = (q) => `${f2(q.x)} ${f2(q.y)}`;
  return `<path class="${cls}" fill-opacity="0.35" d="M${pt(c)} C${pt(a1)} ${pt(a2)} ${pt(tip)} C${pt(b2)} ${pt(b1)} ${pt(c)} Z"></path>`;
}
/* A tetrahedral 2-bromobutane drawn from the radical's point of view. */
function bromobutane(c, up) {
  const sg = up ? 1 : -1;
  const at = (deg, len) => P(c.x + Math.cos((deg * Math.PI) / 180) * len, c.y - Math.sin((deg * Math.PI) / 180) * len);
  const br = at(90 * sg, 48);
  const hPos = up ? at(200, 44) : at(160, 44);
  const meP = up ? at(-40, 46) : at(40, 46);
  const etP = up ? at(18, 54) : at(-18, 54);
  let s = '';
  s += bond(c, br, { rFrom: 0, rTo: 16 });
  s += bond(c, hPos, { rFrom: 0, rTo: 13 });
  s += wedge(c, meP, { rFrom: 0, rTo: 18, width: 9 });
  s += hash(c, etP, { rFrom: 0, rTo: 26, width: 10, rungs: 4 });
  s += atom(br.x, br.y, 'Br', { kind: 'warn' });
  s += hAtom(hPos.x, hPos.y);
  s += atom(meP.x, meP.y, 'CH₃', { r: 18 });
  s += atom(etP.x, etP.y, 'CH₂CH₃', { r: 26 });
  return s;
}
FIGURES.push({
  id: 'planar-radical',
  section: 'radical-halogenation',
  lessons: ['radical-halogenation'],
  anchor: '<h3>The radical is flat</h3>',
  alt: 'The radical formed at C2 of butane. The carbon and its three groups, H, CH3 and CH2CH3, lie in one flat plane, and a p orbital stands at right angles to it, one lobe above and one below, holding the unpaired electron. Br2 can reach the top lobe or the bottom lobe. Attack from the top face gives one 2-bromobutane with Br pointing up; attack from the bottom face gives its mirror image with Br pointing down. The two form in equal amounts, a racemic mixture.',
  viewBox: '0 0 340 500',
  build() {
    let s = '';
    s += tag(170, 20, 'RADICAL AT C2 OF BUTANE');
    const c = P(170, 150);
    s += lobe(c, 90, 58, 18, 'fg-orb');
    s += lobe(c, -90, 58, 18, 'fg-orb-alt');
    const hP = P(108, 160), meP = P(222, 182), etP = P(236, 124);
    s += bond(c, hP, { rFrom: 0, rTo: 13 });
    s += wedge(c, meP, { rFrom: 0, rTo: 18, width: 9 });
    s += hash(c, etP, { rFrom: 0, rTo: 26, width: 10, rungs: 4 });
    s += hAtom(hP.x, hP.y);
    s += atom(meP.x, meP.y, 'CH₃', { r: 18 });
    s += atom(etP.x, etP.y, 'CH₂CH₃', { r: 26 });
    s += `<circle class="fg-fill-mut" cx="${c.x}" cy="${c.y}" r="3.5"></circle>`;
    s += dot(170, 112);
    s += label(150, 84, 'p orbital,', { anchor: 'end', size: 13 });
    s += label(150, 102, 'one electron', { anchor: 'end', size: 13 });
    s += label(230, 52, 'Br₂', { anchor: 'start', size: 13 });
    s += label(230, 70, 'top face', { anchor: 'start', size: 13 });
    s += arrow(P(224, 60), P(188, 88));
    s += label(262, 236, 'Br₂', { anchor: 'start', size: 13 });
    s += label(262, 254, 'bottom face', { anchor: 'start', size: 13 });
    s += arrow(P(256, 240), P(190, 212));
    s += arrow(P(140, 250), P(100, 286), { muted: true });
    s += arrow(P(200, 250), P(240, 286), { muted: true });
    s += bromobutane(P(85, 370), true);
    s += bromobutane(P(255, 360), false);
    s += label(85, 448, 'from the top', { size: 13 });
    s += label(255, 448, 'from the bottom', { size: 13 });
    s += label(170, 474, 'mirror images, formed 50 : 50:', { size: 13 });
    s += label(170, 492, 'a racemic mixture', { size: 13 });
    return s;
  },
  caption: 'Both lobes are equally open, so both faces are attacked equally often.',
});

/* ------------------------------------------------------------------------
   The allylic radical from 1-butene, its two resonance forms, and the two
   bromides they lead to. */
FIGURES.push({
  id: 'allylic-radical-resonance',
  section: 'radical-halogenation',
  lessons: ['radical-halogenation'],
  anchor: '<h3>Looking ahead: allylic bromination</h3>',
  alt: 'Top: 1-butene, carbons numbered 1 to 4, with a hydrogen on C3 marked as the allylic hydrogen. A bromine radical removes it. Middle: the allylic radical drawn two ways, joined by a double-headed resonance arrow: with the double bond at C1–C2 and the unpaired electron on C3, and with the double bond at C2–C3 and the unpaired electron on C1. Bottom: Br2 gives 3-bromo-1-butene from the first form and 1-bromo-2-butene from the second.',
  viewBox: '0 0 340 450',
  build() {
    let s = '';
    const sk = (a, b, order = 1) => bond(a, b, { rFrom: 0, rTo: 0, order, gap: 3 });
    s += tag(170, 20, '1-BUTENE, NBS, LIGHT');
    // 1-butene
    const t = [P(110, 80), P(150, 58), P(190, 80), P(230, 58)];
    s += sk(t[0], t[1], 2) + sk(t[1], t[2]) + sk(t[2], t[3]);
    s += label(98, 98, '1', { size: 13 }) + label(150, 46, '2', { size: 13 });
    s += label(176, 100, '3', { size: 13 }) + label(230, 46, '4', { size: 13 });
    s += bond(t[2], P(190, 116), { rFrom: 0, rTo: 12 });
    s += atom(190, 128, 'H', { r: 12, kind: 'hi' });
    s += label(208, 132, 'allylic H', { anchor: 'start', size: 13 });
    s += arrow(P(150, 128), P(150, 170));
    s += label(140, 154, 'Br• takes it', { anchor: 'end', size: 13 });
    // the two resonance forms
    const A = [P(25, 232), P(65, 210), P(105, 232), P(145, 210)];
    const B = [P(195, 232), P(235, 210), P(275, 232), P(315, 210)];
    s += sk(A[0], A[1], 2) + sk(A[1], A[2]) + sk(A[2], A[3]);
    s += dot(105, 248);
    s += sk(B[0], B[1]) + sk(B[1], B[2], 2) + sk(B[2], B[3]);
    s += dot(186, 246);
    s += arrow(P(160, 220), P(182, 220), { size: 7 }) + arrow(P(180, 220), P(158, 220), { size: 7 });
    s += label(85, 276, 'radical on C3', { size: 13 });
    s += label(255, 276, 'radical on C1', { size: 13 });
    s += arrow(P(85, 288), P(85, 318), { muted: true });
    s += label(95, 308, 'Br₂', { anchor: 'start', size: 13 });
    s += arrow(P(255, 288), P(255, 318), { muted: true });
    s += label(265, 308, 'Br₂', { anchor: 'start', size: 13 });
    // products
    const a = [P(25, 356), P(65, 334), P(105, 356), P(145, 334)];
    const b = [P(195, 356), P(235, 334), P(275, 356), P(315, 334)];
    s += sk(a[0], a[1], 2) + sk(a[1], a[2]) + sk(a[2], a[3]);
    s += bond(a[2], P(105, 386), { rFrom: 0, rTo: 16 }) + atom(105, 400, 'Br', { kind: 'warn' });
    s += sk(b[0], b[1]) + sk(b[1], b[2], 2) + sk(b[2], b[3]);
    s += bond(b[0], P(195, 386), { rFrom: 0, rTo: 16 }) + atom(195, 400, 'Br', { kind: 'warn' });
    s += label(85, 440, '3-bromo-1-butene', { size: 13 });
    s += label(255, 440, '1-bromo-2-butene', { size: 13 });
    return s;
  },
  caption: 'One radical, two ends it can use: bromine lands at C3 or at C1.',
});

export default FIGURES;
