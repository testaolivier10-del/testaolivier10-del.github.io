/* Figures for the formal-charge notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Formal charge sits in Foundations, BEFORE skeletal structures, so every
   drawing is a full Lewis structure: every atom is a labeled circle (C, H, N,
   O), every lone pair is two dots, and every formal charge sits on the atom
   that carries it. Each worked count is written beside the drawing, atom by
   atom, so the reader can check the arithmetic against the picture.

   Notes figures lay their panels side by side. The lesson copies (ids that
   start with l-) stack the panels at 340 wide and use only fg-lbl and fg-tag
   text, so they stay readable on a phone. */
import { atom, bond, arrow, curve, lonePair, text, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers ---
   A small molecule drawer (the same one the lewis-structures module uses).
   `atoms` maps an id to {x, y, l (label), k (kind: 'hi' | 'warn'), r}. Bonds
   are [a, b, order, cls] and stop at each atom's circle. `lp` is [atom, angle]
   (screen degrees: 0 east, 90 down). `glow` puts a tinted disc behind a lone
   pair, to mark a pair the reader has just supplied. `charges` is [atom, sign,
   angle, dist]. `notes` is [atom, text, angle, dist, cls]. */
const rad = (a) => a.r ?? (a.l === 'H' ? 11 : a.l.length === 1 ? 14 : 17);
const at = (p, deg, len) => P(p.x + Math.cos(deg * Math.PI / 180) * len, p.y + Math.sin(deg * Math.PI / 180) * len);
const f2 = (v) => Math.round(v * 100) / 100;

function mol(m) {
  const A = m.atoms;
  let s = '';
  for (const [id, ang] of m.glow || []) {
    const c = at(A[id], ang, 22);
    s += `<circle class="fg-panel-hi" cx="${f2(c.x)}" cy="${f2(c.y)}" r="9"></circle>`;
  }
  for (const [a, b, order = 1, cls] of m.bonds || []) {
    s += bond(A[a], A[b], { order, cls, rFrom: rad(A[a]), rTo: rad(A[b]) });
  }
  for (const [id, ang, dist] of m.lp || []) s += lonePair(A[id].x, A[id].y, ang, dist ? { dist } : {});
  for (const id of Object.keys(A)) {
    const a = A[id];
    s += atom(a.x, a.y, a.l, { kind: a.k, r: rad(a) });
  }
  for (const [id, sign, ang, dist = 28] of m.charges || []) {
    const p = at(A[id], ang, dist);
    s += text(p.x, p.y + 5, sign, { cls: sign.includes('+') ? 'fg-tag-warn' : 'fg-tag', size: 15 });
  }
  for (const [id, t, ang, dist = 28, cls = 'fg-tag-good'] of m.notes || []) {
    const p = at(A[id], ang, dist);
    s += text(p.x, p.y + 4, t, { cls, size: 11 });
  }
  return s;
}

/* Hydrogens on atom `id` at the given angles, named id + 'h' + index. */
function hs(atoms, bonds, id, angles, len = 38) {
  angles.forEach((ang, i) => {
    const k = `${id}h${i}`;
    atoms[k] = { ...at(atoms[id], ang, len), l: 'H' };
    bonds.push([id, k]);
  });
}

const title = (x, y, s) => text(x, y, s, { cls: 'fg-lbl', size: 13 });
const good = (x, y, s) => text(x, y, s, { cls: 'fg-tag-good', size: 11 });
const warn = (x, y, s) => text(x, y, s, { cls: 'fg-tag-warn', size: 11 });
const plain = (x, y, s) => text(x, y, s, { cls: 'fg-tag', size: 11 });
/* A tag that starts with ! is a warning, = is plain ink, anything else is good. */
const say = (x, y, t) => (t[0] === '!' ? warn(x, y, t.slice(1)) : t[0] === '=' ? plain(x, y, t.slice(1)) : good(x, y, t));

/* Panels side by side (notes) or stacked (lessons). Each panel is
   { title, kind, draw(cx, cy), tags, dx }. `mcy` is the molecule centre's
   offset from the panel top; `tagY` is where the first tag line sits. */
function row(panels, { x0 = 14, y0 = 14, w, h, gap = 12, mcy, tagY }) {
  let s = '';
  panels.forEach((p, i) => {
    const x = x0 + i * (w + gap), cx = x + w / 2;
    s += panel(x, y0, w, h, p.kind ? { kind: p.kind } : {});
    if (p.title) s += title(cx, y0 + 24, p.title);
    s += p.draw(cx + (p.dx || 0), y0 + mcy);
    (p.tags || []).forEach((t, j) => { s += say(cx, y0 + tagY + j * 17, t); });
  });
  return s;
}
function stack(panels, { x0 = 10, y0 = 10, w = 320, h, gap = 10, mcy, tagY }) {
  let s = '';
  panels.forEach((p, i) => {
    const y = y0 + i * (h + gap), cx = x0 + w / 2;
    s += panel(x0, y, w, h, p.kind ? { kind: p.kind } : {});
    if (p.title) s += title(cx, y + 22, p.title);
    s += p.draw(cx + (p.dx || 0), y + mcy);
    (p.tags || []).forEach((t, j) => { s += say(cx, y + tagY + j * 17, t); });
  });
  return s;
}

/* ================================================== the molecules ===== */

/* Ownership view. The centre atom's bonds are drawn soft, with the bond's two
   electrons as dots on the line: the dot nearer the centre is the one it owns
   (accent), the far one belongs to the H (muted). A dashed loop rings every
   electron the centre atom owns. */
function owned(cx, cy, centre, hAngles, lpAngles, charge) {
  const C = P(cx, cy);
  let s = `<circle class="fg-dash-hi" cx="${cx}" cy="${cy}" r="32"></circle>`;
  for (const ang of hAngles) {
    const H = at(C, ang, 64);
    s += bond(C, H, { cls: 'fg-bond-soft', rFrom: 14, rTo: 11 });
    const a = at(C, ang, 25), b = at(C, ang, 42);
    s += `<circle class="fg-lp" cx="${f2(a.x)}" cy="${f2(a.y)}" r="2.6"></circle>`;
    s += `<circle class="fg-lp-mut" cx="${f2(b.x)}" cy="${f2(b.y)}" r="2.6"></circle>`;
    s += atom(H.x, H.y, 'H', { r: 11 });
  }
  for (const ang of lpAngles) s += lonePair(cx, cy, ang, { dist: 21 });
  s += atom(cx, cy, centre, { kind: charge ? 'warn' : undefined, r: 14 });
  if (charge) { const p = at(C, 315, 46); s += text(p.x, p.y + 5, charge, { cls: 'fg-tag-warn', size: 15 }); }
  return s;
}
const water = (cx, cy) => owned(cx, cy, 'O', [150, 30], [225, 315]);
const ammonium = (cx, cy) => owned(cx, cy, 'N', [270, 0, 90, 180], [], '+');

/* The three small ions, every atom drawn. */
function nh4(cx, cy) {
  const A = { N: { x: cx, y: cy, l: 'N', k: 'warn' } }, B = [];
  hs(A, B, 'N', [270, 0, 90, 180]);
  return mol({ atoms: A, bonds: B, charges: [['N', '+', 315, 30]] });
}
function oh(cx, cy) {
  const A = { O: { x: cx - 14, y: cy, l: 'O', k: 'hi' } }, B = [];
  hs(A, B, 'O', [0]);
  return mol({ atoms: A, bonds: B, lp: [['O', 180], ['O', 270], ['O', 90]], charges: [['O', '−', 225, 36]] });
}
function h3o(cx, cy) {
  const A = { O: { x: cx, y: cy, l: 'O', k: 'warn' } }, B = [];
  hs(A, B, 'O', [180, 0, 90]);
  return mol({ atoms: A, bonds: B, lp: [['O', 270]], charges: [['O', '+', 315, 30]] });
}

/* CH₃–X with every H drawn. X is O (methoxide) or N (methylammonium). */
function methoxide(cx, cy, opts = {}) {
  const A = { C: { x: cx - 30, y: cy, l: 'C' }, O: { x: cx + 26, y: cy, l: 'O', k: 'hi' } };
  const B = [['C', 'O']];
  hs(A, B, 'C', [180, 270, 90]);
  const m = { atoms: A, bonds: B, lp: [['O', 270], ['O', 0], ['O', 90]], charges: [['O', '−', 45, 32]] };
  if (opts.glow) m.glow = [['O', 270], ['O', 0], ['O', 90]];
  return mol(m);
}
function methylammonium(cx, cy) {
  const A = { C: { x: cx - 30, y: cy, l: 'C' }, N: { x: cx + 26, y: cy, l: 'N', k: 'warn' } };
  const B = [['C', 'N']];
  hs(A, B, 'C', [180, 270, 90]);
  hs(A, B, 'N', [270, 0, 90]);
  return mol({ atoms: A, bonds: B, charges: [['N', '+', 315, 30]] });
}
function methylamine(cx, cy) {
  const A = { C: { x: cx - 30, y: cy, l: 'C' }, N: { x: cx + 26, y: cy, l: 'N' } };
  const B = [['C', 'N']];
  hs(A, B, 'C', [180, 270, 90]);
  hs(A, B, 'N', [270, 90]);
  return mol({ atoms: A, bonds: B, lp: [['N', 0]], glow: [['N', 0]] });
}
/* The methyl cation and anion. The cation's empty orbital is a p orbital
   standing perpendicular to the page, so it is named in a tag, not drawn in
   the plane where a fourth bond would go. */
function methylIon(cx, cy, sign) {
  const A = { C: { x: cx, y: cy + 6, l: 'C', k: sign === '+' ? 'warn' : 'hi' } }, B = [];
  hs(A, B, 'C', [90, 210, 330]);
  const m = { atoms: A, bonds: B, charges: [['C', sign, 30, 34]] };
  if (sign !== '+') {
    m.lp = [['C', 270]];
    m.glow = [['C', 270]];
  }
  return mol(m);
}

/* Nitromethane with every H drawn. `wrong` gives N two double bonds;
   `ask` leaves N's charge off and puts a ? there instead. */
function nitromethane(cx, cy, opts = {}) {
  const A = {
    C: { x: cx - 44, y: cy, l: 'C' },
    N: { x: cx + 14, y: cy, l: 'N', k: opts.wrong || opts.ask ? undefined : 'warn' },
  };
  A.Ot = { ...at(A.N, 315, 56), l: 'O' };
  A.Ob = { ...at(A.N, 45, 56), l: 'O', k: opts.wrong ? undefined : 'hi' };
  const B = [['C', 'N'], ['N', 'Ot', 2], ['N', 'Ob', opts.wrong ? 2 : 1]];
  hs(A, B, 'C', [180, 270, 90]);
  const m = { atoms: A, bonds: B, lp: [['Ot', 255], ['Ot', 15]] };
  if (opts.wrong) m.lp.push(['Ob', 105], ['Ob', 345]);
  else {
    m.lp.push(['Ob', 315], ['Ob', 45], ['Ob', 135]);
    m.charges = [['Ob', '−', 0, 36]];
    if (opts.ask) m.notes = [['N', '?', 250, 30, 'fg-tag-warn']];
    else m.charges.push(['N', '+', 250, 28]);
  }
  return mol(m);
}

/* Acetone with every H drawn: O up, the two CH₃ carbons down-left and
   down-right. `ask` puts a ? beside the oxygen. */
function acetone(cx, cy, opts = {}) {
  const A = {
    C: { x: cx, y: cy, l: 'C' },
    O: { x: cx, y: cy - 54, l: 'O' },
  };
  A.L = { ...at(A.C, 150, 56), l: 'C' };
  A.R = { ...at(A.C, 30, 56), l: 'C' };
  const B = [['C', 'O', 2], ['C', 'L'], ['C', 'R']];
  hs(A, B, 'L', [60, 150, 240], 36);
  hs(A, B, 'R', [120, 30, 300], 36);
  const m = { atoms: A, bonds: B, lp: [['O', 210], ['O', 330]] };
  if (opts.ask) m.notes = [['O', '?', 0, 30, 'fg-tag-warn']];
  return mol(m);
}

/* Hydrogen cyanide, H–C≡N, drawn straight (the carbon is linear). */
function hcn(cx, cy) {
  const A = {
    H: { x: cx - 64, y: cy, l: 'H' },
    C: { x: cx - 12, y: cy, l: 'C' },
    N: { x: cx + 44, y: cy, l: 'N' },
  };
  return mol({ atoms: A, bonds: [['H', 'C'], ['C', 'N', 3]], lp: [['N', 0]], notes: [['N', '?', 270, 30, 'fg-tag-warn']] });
}

/* Diazomethane, CH₂N₂, in its two octet structures. A: H₂C=N⁺=N⁻.
   B: H₂C⁻–N⁺≡N. The C–N–N line is straight in both. */
function diazo(cx, cy, form) {
  const A = {
    C: { x: cx - 50, y: cy, l: 'C', k: form === 'B' ? 'hi' : undefined },
    N1: { x: cx + 6, y: cy, l: 'N', k: 'warn' },
    N2: { x: cx + 62, y: cy, l: 'N', k: form === 'A' ? 'hi' : undefined },
  };
  const B = form === 'A' ? [['C', 'N1', 2], ['N1', 'N2', 2]] : [['C', 'N1'], ['N1', 'N2', 3]];
  hs(A, B, 'C', [215, 145]);
  const m = { atoms: A, bonds: B, charges: [['N1', '+', 270, 27]] };
  if (form === 'A') {
    m.lp = [['N2', 300], ['N2', 60]];
    m.charges.push(['N2', '−', 0, 34]);
  } else {
    m.lp = [['C', 270], ['N2', 0]];
    m.charges.push(['C', '−', 90, 30]);
  }
  return mol(m);
}

/* The nine bond/lone-pair patterns, each on a real species. */
function species(cx, cy, centre, hAng, lpAng, sign, kind) {
  const A = { X: { x: cx, y: cy, l: centre, k: kind } }, B = [];
  hs(A, B, 'X', hAng, 34);
  const m = { atoms: A, bonds: B, lp: lpAng.map((a) => ['X', a]) };
  if (sign) m.charges = [['X', sign, hAng.length === 2 ? 0 : 315, 31]];
  return mol(m);
}

/* ============================================================ notes === */

/* The opening example: what an atom owns, before any formula. */
FIGURES.push({
  id: 'fc-ownership',
  section: 'formal-charge',
  anchor: '<h3>Start with two examples</h3>',
  viewBox: '0 0 760 298',
  alt: 'Water and the ammonium ion drawn with the two electrons of each bond shown as dots. A dashed loop around the central atom takes in its lone pairs and the one bond electron nearer to it. Oxygen in water owns six electrons and brought six, so it is neutral. Nitrogen in ammonium owns four and brought five, so it is plus one.',
  build() {
    return row([
      {
        title: 'water, H₂O', draw: water,
        tags: ['=O brings 6 valence electrons', '=O owns 4 (lone pairs) + 2 (one per bond) = 6', 'owns 6, brought 6: formal charge 0', '=each H: 1 − 0 − 1 = 0'],
      },
      {
        title: 'ammonium ion, NH₄⁺', draw: ammonium,
        tags: ['=N brings 5 valence electrons', '=N owns 0 (lone pairs) + 4 (one per bond) = 4', '!owns 4, brought 5: formal charge +1', '=each H: 1 − 0 − 1 = 0'],
      },
    ], { w: 360, h: 270, mcy: 112, tagY: 202 });
  },
  caption: 'Compare what sits inside each dashed loop with the number the atom brought.',
});

/* The bond term: a double bond counts 2. */
FIGURES.push({
  id: 'fc-bond-term',
  section: 'formal-charge',
  anchor: '<h3>Start with two examples</h3>',
  viewBox: '0 0 760 250',
  alt: 'Acetone drawn with every atom. The oxygen has two lone pairs and a double bond to the central carbon; each end carbon carries three hydrogens. The count beside it gives the oxygen 6 minus 4 minus 2 equals 0, every carbon 4 minus 0 minus 4 equals 0 and every hydrogen 0. Counting the double bond as one would wrongly give the oxygen plus one.',
  build() {
    let s = panel(14, 14, 300, 222);
    s += title(164, 38, 'acetone, (CH₃)₂C=O');
    s += acetone(164, 150);
    s += panel(326, 14, 420, 136, { kind: 'good' });
    s += text(346, 42, 'count the double bond as 2', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    [
      'O: 6 − 4 − 2 = 0',
      'middle C: 4 − 0 − 4 = 0 (two single bonds + one double)',
      'each end C: 4 − 0 − 4 = 0',
      'each H: 1 − 0 − 1 = 0',
      'sum: 0, and acetone is neutral ✓',
    ].forEach((t, i) => { s += text(346, 66 + i * 17, t, { cls: 'fg-tag', size: 11, anchor: 'start' }); });
    s += panel(326, 162, 420, 74, { kind: 'warn' });
    s += text(346, 190, 'count the double bond as 1', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(346, 214, 'O: 6 − 4 − 1 = +1, a charge acetone does not have ✗', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'Check each count against the lines and dots in the drawing. The middle carbon counts its double bond as 2 as well.',
});

/* Worked examples: the three small ions. */
FIGURES.push({
  id: 'fc-three-ions',
  section: 'formal-charge',
  anchor: '<span class="k">Worked examples — three small ions</span>',
  viewBox: '0 0 760 262',
  alt: 'The ammonium ion, hydroxide ion and hydronium ion drawn with every atom and lone pair, with the formal-charge count for each atom and the sum under each. Ammonium: nitrogen plus one, hydrogens zero, sum plus one. Hydroxide: oxygen minus one, hydrogen zero, sum minus one. Hydronium: oxygen plus one, hydrogens zero, sum plus one.',
  build() {
    return row([
      { title: 'NH₄⁺', draw: nh4, tags: ['=N: 5 − 0 − 4 = +1', '=each H: 1 − 0 − 1 = 0', 'sum +1 = the ion’s charge ✓'] },
      { title: 'OH⁻', draw: oh, tags: ['=O: 6 − 6 − 1 = −1', '=H: 1 − 0 − 1 = 0', 'sum −1 = the ion’s charge ✓'] },
      { title: 'H₃O⁺', draw: h3o, tags: ['=O: 6 − 2 − 3 = +1', '=each H: 1 − 0 − 1 = 0', 'sum +1 = the ion’s charge ✓'] },
    ], { w: 236, h: 234, mcy: 108, tagY: 186 });
  },
  caption: 'For each ion, count the lines and the dots on the central atom, then check the sum. On every figure on this page, a pink ring and sign mark a + atom and a teal ring and sign mark a − atom.',
});

/* Worked examples: the organic twins of OH⁻ and NH₄⁺. */
FIGURES.push({
  id: 'fc-organic-ions',
  section: 'formal-charge',
  anchor: '<span class="k">Worked examples — two organic ions</span>',
  viewBox: '0 0 760 250',
  alt: 'Methoxide and methylammonium drawn with every atom. Methoxide: oxygen with one bond and three lone pairs is minus one; carbon and hydrogens are zero. Methylammonium: nitrogen with four bonds and no lone pair is plus one; carbon and hydrogens are zero.',
  build() {
    return row([
      { title: 'methoxide, CH₃O⁻', draw: methoxide, tags: ['=O: 6 − 6 − 1 = −1', '=C: 4 − 0 − 4 = 0 · each H: 0', 'sum −1 ✓'] },
      { title: 'methylammonium, CH₃NH₃⁺', draw: methylammonium, tags: ['=N: 5 − 0 − 4 = +1', '=C: 4 − 0 − 4 = 0 · each H: 0', 'sum +1 ✓'] },
    ], { w: 360, h: 222, mcy: 104, tagY: 174 });
  },
  caption: 'Compare each charged atom with its match in OH⁻ and NH₄⁺ above.',
});

/* Nitromethane: the tempting structure and the one that works. */
FIGURES.push({
  id: 'nitro-group-charges',
  section: 'formal-charge',
  anchor: '<span class="k">Worked example — nitromethane, a neutral molecule with charges</span>',
  viewBox: '0 0 760 310',
  alt: 'Nitromethane drawn twice with every atom. On the left, the tempting structure with nitrogen double-bonded to both oxygens, marked impossible because nitrogen would have five bonds. On the right, the correct structure with one double bond and one single bond, a plus one on nitrogen and a minus one on the singly bonded oxygen, with the count for every atom and a sum of zero.',
  build() {
    return row([
      {
        title: 'the tempting structure', kind: 'warn', draw: (x, y) => nitromethane(x, y, { wrong: true }),
        tags: ['!N has 5 bonds = 10 electrons around it', '!a period-2 atom holds at most 8', '!so this structure cannot exist'],
      },
      {
        title: 'the structure that works', kind: 'good', draw: nitromethane,
        tags: ['=N: 5 − 0 − 4 = +1', '=top O: 6 − 4 − 2 = 0', '=lower O: 6 − 6 − 1 = −1', '=C: 4 − 0 − 4 = 0 · each H: 0', 'sum: +1 − 1 = 0, a neutral molecule ✓'],
      },
    ], { w: 360, h: 282, mcy: 110, tagY: 198 });
  },
  caption: 'Left: count the lines at nitrogen. Right: the count for every atom, then the sum.',
});

/* Running the formula backwards: supply the lone pairs. */
FIGURES.push({
  id: 'fc-fill-in',
  section: 'formal-charge',
  anchor: '<span class="k">Worked example — the formula run backwards</span>',
  viewBox: '0 0 760 250',
  alt: 'Four structures drawn with the charges given and the lone pairs supplied, each supplied pair on a tinted disc. Methoxide oxygen, one bond and minus one, gets three lone pairs. Methylamine nitrogen, three bonds and no charge, gets one. The methyl cation carbon, three bonds and plus one, gets none; its empty p orbital stands perpendicular to the page and is named, not drawn. The methyl anion carbon, three bonds and minus one, gets one.',
  build() {
    const cols = [
      { title: 'O, 1 bond, −1', draw: (x, y) => methoxide(x, y, { glow: true }), tags: ['=6 − 1 − (−1) = 6', '3 lone pairs'] },
      { title: 'N, 3 bonds, 0', draw: methylamine, tags: ['=5 − 3 − 0 = 2', '1 lone pair'] },
      { title: 'C, 3 bonds, +1', draw: (x, y) => methylIon(x, y, '+'), tags: ['=4 − 3 − 1 = 0', '!no lone pair', '=empty p orbital instead'] },
      { title: 'C, 3 bonds, −1', draw: (x, y) => methylIon(x, y, '−'), tags: ['=4 − 3 − (−1) = 2', '1 lone pair'] },
    ];
    return row(cols, { x0: 10, w: 176, gap: 8, h: 222, mcy: 106, tagY: 184 });
  },
  caption: 'Each tinted disc marks a lone pair the formula supplied. The methyl cation gets none; its empty p orbital points straight out of the page, above and below the plane of its three bonds.',
});

/* The nine patterns, each on a real species. */
FIGURES.push({
  id: 'fc-patterns',
  section: 'formal-charge',
  anchor: '<h3>Nine patterns worth memorizing</h3>',
  viewBox: '0 0 760 480',
  alt: 'A three by three grid. Oxygen row: hydronium, three bonds and one lone pair, plus one; water, two bonds and two lone pairs, zero; hydroxide, one bond and three lone pairs, minus one. Nitrogen row: ammonium, four bonds, plus one; ammonia, three bonds and one lone pair, zero; the amide ion, two bonds and two lone pairs, minus one. Carbon row: the methyl cation, three bonds and an empty p orbital (not drawn), plus one; methane, four bonds, zero; the methyl anion, three bonds and one lone pair, minus one.',
  build() {
    const cols = [230, 420, 610];
    const rows = [
      { name: 'oxygen', cells: [
        ['O', [180, 0, 90], [270], '+', 'warn', '3 bonds + 1 lone pair', 'H₃O⁺: +1'],
        ['O', [135, 45], [225, 315], '', undefined, '2 bonds + 2 lone pairs', 'H₂O: 0'],
        ['O', [90], [180, 270, 0], '−', 'hi', '1 bond + 3 lone pairs', 'OH⁻: −1'],
      ] },
      { name: 'nitrogen', cells: [
        ['N', [270, 0, 90, 180], [], '+', 'warn', '4 bonds', 'NH₄⁺: +1'],
        ['N', [180, 0, 90], [270], '', undefined, '3 bonds + 1 lone pair', 'NH₃: 0'],
        ['N', [135, 45], [225, 315], '−', 'hi', '2 bonds + 2 lone pairs', 'NH₂⁻: −1'],
      ] },
      { name: 'carbon', cells: [
        ['C', [180, 0, 90], [], '+', 'warn', '3 bonds, empty p orbital', 'CH₃⁺: +1'],
        ['C', [270, 0, 90, 180], [], '', undefined, '4 bonds', 'CH₄: 0'],
        ['C', [180, 0, 90], [270], '−', 'hi', '3 bonds + 1 lone pair', 'CH₃⁻: −1'],
      ] },
    ];
    let s = '';
    rows.forEach((r, i) => {
      const top = 12 + i * 156;
      if (i) s += rule(20, top - 6, 740, top - 6);
      s += text(64, top + 64, r.name, { cls: 'fg-tag', size: 11, anchor: 'start' });
      r.cells.forEach((c, j) => {
        const [el, h, lp, sign, kind, what, res] = c;
        s += species(cols[j], top + 58, el, h, lp, sign, kind);
        s += text(cols[j], top + 122, what, { cls: 'fg-sm', size: 10.5 });
        const cls = sign === '+' ? 'fg-tag-warn' : sign === '−' ? 'fg-tag' : 'fg-tag-mut';
        s += text(cols[j], top + 139, res, { cls, size: 11 });
      });
    });
    return s;
  },
  caption: 'Each row runs from +1 on the left, through the neutral species in the middle, to −1 on the right.',
});

/* The sum check across a reaction step. */
FIGURES.push({
  id: 'fc-charge-balance',
  section: 'formal-charge',
  anchor: '<h3>The built-in check: charges add up</h3>',
  viewBox: '0 0 760 230',
  alt: 'Ammonia plus a hydrogen ion gives the ammonium ion. A curved arrow runs from the nitrogen lone pair to the hydrogen ion, showing the pair becoming the new nitrogen-hydrogen bond. Under the left side the charges sum to plus one; under the right side they also sum to plus one.',
  build() {
    let s = '';
    const A = { N: { x: 150, y: 118, l: 'N' } }, B = [];
    hs(A, B, 'N', [180, 0, 90]);
    s += mol({ atoms: A, bonds: B, lp: [['N', 270]] });
    const Hp = P(272, 72);
    s += atom(Hp.x, Hp.y, 'H', { r: 11 });
    s += text(Hp.x + 16, Hp.y - 6, '+', { cls: 'fg-tag-warn', size: 15 });
    s += curve(P(154, 88), P(259, 70), { bow: -30 });
    s += text(216, 36, 'the lone pair becomes the new N–H bond', { cls: 'fg-tag', size: 11 });
    s += arrow(P(340, 118), P(420, 118));
    const C = { N: { x: 540, y: 118, l: 'N', k: 'warn' } }, D = [];
    hs(C, D, 'N', [270, 0, 90, 180]);
    s += mol({ atoms: C, bonds: D, charges: [['N', '+', 315, 30]] });
    s += rule(24, 178, 736, 178);
    s += text(196, 200, 'N: 5 − 2 − 3 = 0 · each H: 0 · H⁺: +1', { cls: 'fg-tag', size: 11 });
    s += text(196, 218, 'sum: +1', { cls: 'fg-tag-good', size: 11 });
    s += text(560, 200, 'N: 5 − 0 − 4 = +1 · each H: 0', { cls: 'fg-tag', size: 11 });
    s += text(560, 218, 'sum: +1 ✓ the charge is conserved', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'The + moves from H⁺ to the nitrogen. The total on each side stays +1.',
});

/* Diazomethane: the tiebreaker at work. */
const diazoPanels = [
  {
    title: 'A: H₂C=N⁺=N⁻', kind: 'good', draw: (x, y) => diazo(x, y, 'A'),
    tags: ['=C: 4 − 0 − 4 = 0 · each H: 0', '=middle N: 5 − 0 − 4 = +1', '=end N: 5 − 4 − 2 = −1', 'the − sits on N: better'],
  },
  {
    title: 'B: H₂C⁻–N⁺≡N', kind: 'warn', draw: (x, y) => diazo(x, y, 'B'),
    tags: ['=C: 4 − 2 − 3 = −1 · each H: 0', '=middle N: 5 − 0 − 4 = +1', '=end N: 5 − 2 − 3 = 0', '!the − sits on C: worse'],
  },
];
FIGURES.push({
  id: 'fc-diazomethane',
  section: 'formal-charge',
  anchor: '<span class="k">Worked example — diazomethane, CH₂N₂</span>',
  viewBox: '0 0 760 250',
  alt: 'Diazomethane drawn two ways with every atom and lone pair. Structure A, carbon double-bonded to nitrogen double-bonded to nitrogen, has plus one on the middle nitrogen and minus one on the end nitrogen. Structure B, carbon single-bonded to nitrogen triple-bonded to nitrogen, has minus one on carbon, a lone pair on carbon, and plus one on the middle nitrogen. The count for each atom is written under each. A is better because the negative charge sits on nitrogen.',
  build() {
    return row(diazoPanels, { w: 360, h: 222, mcy: 96, tagY: 150 });
  },
  caption: 'The green panel is the better structure. Compare where each one puts the −.',
});

/* ========================================================== lessons === */

FIGURES.push({
  id: 'l-fc-own-water',
  lessons: ['formal-charge'],
  viewBox: '0 0 340 268',
  alt: 'Water drawn with the two electrons of each O–H bond shown as dots. A dashed loop around oxygen takes in its two lone pairs and the one bond electron nearer to it on each side. Oxygen owns six electrons, the same six it brought, so its formal charge is zero.',
  build() {
    return stack([
      { title: 'water, H₂O', draw: water, tags: ['=O brings 6 valence electrons', '=owns 4 (lone pairs) + 2 (bonds) = 6', 'owns 6, brought 6: charge 0', '=each H: 1 − 0 − 1 = 0'] },
    ], { h: 248, mcy: 104, tagY: 180 });
  },
  caption: 'Everything inside the dashed loop belongs to the oxygen.',
});

FIGURES.push({
  id: 'l-fc-bond-term',
  lessons: ['formal-charge'],
  viewBox: '0 0 340 310',
  alt: 'Acetone drawn with every atom. The oxygen has two lone pairs and a double bond to the central carbon. Its count is 6 minus 4 minus 2 equals 0. Counting the double bond as one would wrongly give plus one.',
  build() {
    return stack([
      {
        title: 'acetone, (CH₃)₂C=O', draw: acetone,
        tags: ['O: 6 − 4 − 2 = 0 (double bond = 2)', '=every C: 4 − 0 − 4 = 0 · each H: 0', '!double bond as 1: 6 − 4 − 1 = +1 ✗'],
      },
    ], { h: 290, mcy: 138, tagY: 234 });
  },
  caption: 'Check each count against the lines and dots in the drawing.',
});

FIGURES.push({
  id: 'l-fc-hcn-ask',
  lessons: ['formal-charge'],
  viewBox: '0 0 340 130',
  alt: 'Hydrogen cyanide drawn straight: hydrogen, a single bond to carbon, a triple bond to nitrogen, and one lone pair on nitrogen. A question mark sits over the nitrogen.',
  build() {
    return stack([
      { title: 'hydrogen cyanide, HCN', draw: hcn, tags: ['=H–C single bond, C≡N triple bond'] },
    ], { h: 110, mcy: 66, tagY: 100 });
  },
  caption: 'The C≡N triple bond is three lines, and the lone pair is two dots.',
});

FIGURES.push({
  id: 'l-fc-diazomethane',
  lessons: ['formal-charge'],
  viewBox: '0 0 340 410',
  alt: 'Diazomethane drawn two ways, one above the other. Structure A has plus one on the middle nitrogen and minus one on the end nitrogen. Structure B has minus one on carbon and plus one on the middle nitrogen. A is better because the negative charge sits on nitrogen.',
  build() {
    const panels = [
      { ...diazoPanels[0], tags: ['=middle N: +1 · end N: 5 − 4 − 2 = −1', '=C: 4 − 0 − 4 = 0', 'the − sits on N: better'] },
      { ...diazoPanels[1], tags: ['=middle N: +1 · end N: 5 − 2 − 3 = 0', '=C: 4 − 2 − 3 = −1', '!the − sits on C: worse'] },
    ];
    return stack(panels, { h: 190, mcy: 88, tagY: 138 });
  },
  caption: 'The green panel is the better structure.',
});

FIGURES.push({
  id: 'l-fc-nitro-ask',
  lessons: ['formal-charge'],
  viewBox: '0 0 340 220',
  alt: 'Nitromethane drawn with every atom. Carbon carries three hydrogens and bonds to nitrogen. Nitrogen has a double bond to the upper oxygen and a single bond to the lower oxygen, which has three lone pairs and a minus one. Nitrogen has no lone pair, and a question mark sits beside it.',
  build() {
    return stack([
      { title: 'nitromethane, CH₃NO₂', draw: (x, y) => nitromethane(x, y, { ask: true }), tags: ['=the molecule as a whole is neutral'] },
    ], { h: 200, mcy: 104, tagY: 190 });
  },
  caption: 'Every lone pair is drawn; the nitrogen has none.',
});

export default FIGURES;
