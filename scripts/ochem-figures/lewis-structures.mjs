/* Figures for the lewis-structures notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   This topic sits in Foundations, BEFORE skeletal structures are taught, so
   every drawing is a full Lewis structure: every atom carries a label (C, H,
   O, N, a halogen, or a CH₃ group label where the page is about branching),
   every lone pair is drawn as two dots, and every formal charge is written
   on the atom that carries it. Nothing is a bare vertex or a zigzag.

   Notes figures lay their panels side by side. The lesson copies (ids that
   start with l-) stack the same panels vertically at 340 wide, and use only
   fg-lbl and fg-tag text, so they stay readable on a phone. */
import { atom, bond, wedge, hash, arrow, lonePair, text, rule, panel, P } from '../lib/ochem-figure.mjs';
import { lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers ---
   A small molecule drawer. `atoms` maps an id to {x, y, l (label), k (kind:
   'hi' | 'warn'), r (radius)}. Bonds are [a, b, order, cls] and stop at each
   atom's circle. `lp` is [atom, angle] (screen degrees: 0 east, 90 down).
   `dot` is a single unpaired electron. `charges` is [atom, sign, angle,
   dist]. `glow` puts a tinted disc behind a lone pair, to mark the pair that
   is about to move. */
const rad = (a) => a.r ?? (a.l === 'H' ? 11 : a.l.length === 1 ? 14 : a.l.length === 2 ? 15 : 17);
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
  for (const [id, ang] of m.dot || []) {
    const c = at(A[id], ang, 22);
    s += `<circle class="fg-lp" cx="${f2(c.x)}" cy="${f2(c.y)}" r="2.6"></circle>`;
  }
  for (const id of Object.keys(A)) {
    const a = A[id];
    s += atom(a.x, a.y, a.l, { kind: a.k, r: rad(a) });
  }
  for (const [id, sign, ang, dist = 28] of m.charges || []) {
    const p = at(A[id], ang, dist);
    s += text(p.x, p.y + 5, sign, { cls: sign.includes('+') ? 'fg-tag' : 'fg-tag-warn', size: 14 });
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
const say = (x, y, t) => (t[0] === '!' ? warn(x, y, t.slice(1)) : t[0] === '=' ? plain(x, y, t.slice(1)) : good(x, y, t));

/* Panel layouts. Each panel is { title, kind, draw(cx, cy), tags }; a tag that
   starts with ! is drawn as a warning, one that starts with = in plain ink.
   row() puts panels side by side (notes); stack() puts them one above the
   other (lessons). `mol` is the molecule centre's offset from the panel top. */
function row(panels, { x0 = 14, y0 = 16, w, h, gap = 12, mcy, tagY }) {
  let s = '';
  panels.forEach((p, i) => {
    const x = x0 + i * (w + gap), cx = x + w / 2;
    s += panel(x, y0, w, h, p.kind ? { kind: p.kind } : {});
    if (p.title) s += title(cx + (p.tdx || 0), y0 + 24, p.title);
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

/* Ethanol, every H drawn. stage 1: skeleton; 2: bond counts written on each
   heavy atom; 3: lone pairs on O. `bare` leaves O's lone pairs off (used for
   the ethoxide question, with `anion` removing the O–H). */
function ethanol(cx, cy, stage = 3, opts = {}) {
  const A = {
    C1: { x: cx - 54, y: cy, l: 'C' },
    C2: { x: cx, y: cy, l: 'C' },
    O: { x: cx + 54, y: cy, l: 'O', k: stage === 3 || opts.anion ? 'hi' : undefined },
  };
  const B = [['C1', 'C2'], ['C2', 'O']];
  hs(A, B, 'C1', [180, 270, 90]);
  hs(A, B, 'C2', [270, 90]);
  if (!opts.anion) { A.HO = { ...at(A.O, 300, 38), l: 'H' }; B.push(['O', 'HO']); }
  const m = { atoms: A, bonds: B };
  if (stage === 2) {
    m.notes = [['C1', '4', 225, 26], ['C2', '4', 225, 26], ['O', '2', 240, 27]];
  }
  if (stage === 3 && !opts.bare) m.lp = [['O', 30], ['O', 120]];
  if (opts.ask) m.notes = [['O', '?', 45, 30, 'fg-tag-warn']];
  return mol(m);
}

/* Methylamine (lp on N, pointing right) or methylammonium (an H there). */
function methylamine(cx, cy, protonated = false, opts = {}) {
  const A = {
    C: { x: cx - 30, y: cy, l: 'C' },
    N: { x: cx + 24, y: cy, l: 'N', k: protonated ? 'warn' : 'hi' },
  };
  const B = [['C', 'N']];
  hs(A, B, 'C', [180, 270, 90]);
  hs(A, B, 'N', protonated ? [270, 90, 0] : [270, 90]);
  const m = { atoms: A, bonds: B };
  if (protonated) m.charges = [['N', '+', 315, 27]];
  else if (opts.ask) m.notes = [['N', '?', 0, 30, 'fg-tag-warn']];
  else m.lp = [['N', 0]];
  return mol(m);
}

/* Methylamine's nitrogen in 3D: a low pyramid with the lone pair on top. */
function pyramid(cx, cy) {
  const N = P(cx + 6, cy - 8);
  const Cm = at(N, 160, 54), Ha = at(N, 75, 44), Hb = at(N, 25, 46);
  let s = '';
  s += bond(N, Cm, { rFrom: 14, rTo: 17 });
  s += wedge(N, Ha, { rFrom: 14, rTo: 11, width: 9 });
  s += hash(N, Hb, { rFrom: 14, rTo: 11, width: 10, rungs: 4 });
  s += lonePair(N.x, N.y, 270);
  s += atom(N.x, N.y, 'N', { kind: 'hi', r: 14 });
  s += atom(Cm.x, Cm.y, 'CH₃', { r: 17 });
  s += atom(Ha.x, Ha.y, 'H', { r: 11 });
  s += atom(Hb.x, Hb.y, 'H', { r: 11 });
  return s;
}

/* Acetic acid (full H) or acetate. */
function acetic(cx, cy, anion = false) {
  const A = {
    Cm: { x: cx - 50, y: cy, l: 'C' },
    C: { x: cx + 4, y: cy, l: 'C', k: anion ? undefined : 'hi' },
    Od: { x: cx + 4, y: cy - 50, l: 'O' },
    Os: { x: cx + 56, y: cy, l: 'O', k: anion ? 'warn' : undefined },
  };
  const B = [['Cm', 'C'], ['C', 'Od', 2], ['C', 'Os']];
  hs(A, B, 'Cm', [180, 270, 90]);
  const m = { atoms: A, bonds: B, lp: [['Od', 225], ['Od', 315]] };
  if (anion) {
    m.lp.push(['Os', 270], ['Os', 0], ['Os', 90]);
    m.charges = [['Os', '−', 45, 30]];
  } else {
    A.H = { ...at(A.Os, 300, 38), l: 'H' }; B.push(['Os', 'H']);
    m.lp.push(['Os', 60], ['Os', 130]);
  }
  return mol(m);
}

/* Methoxide, CH₃O⁻, every H drawn. */
function methoxide(cx, cy) {
  const A = { C: { x: cx - 30, y: cy, l: 'C' }, O: { x: cx + 24, y: cy, l: 'O', k: 'warn' } };
  const B = [['C', 'O']];
  hs(A, B, 'C', [180, 270, 90]);
  return mol({ atoms: A, bonds: B, lp: [['O', 270], ['O', 0], ['O', 90]], charges: [['O', '−', 45, 30]] });
}

/* CO₂ at the four stages of the central-atom recipe. */
function co2(cx, cy, stage) {
  const A = {
    L: { x: cx - 46, y: cy, l: 'O' },
    C: { x: cx, y: cy, l: 'C', k: stage === 3 ? 'warn' : stage === 4 ? 'hi' : undefined },
    R: { x: cx + 46, y: cy, l: 'O' },
  };
  const m = { atoms: A, bonds: [] };
  if (stage === 1) {
    m.notes = [['L', '6', 90, 26], ['C', '4', 90, 26], ['R', '6', 90, 26]];
  }
  if (stage === 2) m.bonds = [['L', 'C'], ['C', 'R']];
  if (stage === 3) {
    m.bonds = [['L', 'C'], ['C', 'R']];
    m.lp = [['L', 180], ['L', 270], ['L', 90], ['R', 0], ['R', 270], ['R', 90]];
    m.glow = [['L', 90], ['R', 90]];
  }
  if (stage === 4) {
    m.bonds = [['L', 'C', 2, 'fg-bond-hi'], ['C', 'R', 2, 'fg-bond-hi']];
    m.lp = [['L', 135], ['L', 225], ['R', 45], ['R', 315]];
  }
  return mol(m);
}

/* The losing CO₂ structure: one single and one triple bond. */
function co2Triple(cx, cy) {
  const A = {
    L: { x: cx - 46, y: cy, l: 'O', k: 'warn' },
    C: { x: cx, y: cy, l: 'C' },
    R: { x: cx + 46, y: cy, l: 'O', k: 'warn' },
  };
  return mol({
    atoms: A,
    bonds: [['L', 'C'], ['C', 'R', 3]],
    lp: [['L', 180], ['L', 270], ['L', 90], ['R', 0]],
    charges: [['L', '−', 225, 31], ['R', '+', 305, 27]],
  });
}

/* Nitrate with the double bond to oxygen `dbl` ('T', 'R' or 'L'). */
function nitrate(cx, cy, dbl) {
  const N = { x: cx, y: cy, l: 'N', k: 'hi' };
  const A = { N, T: { ...at(N, 270, 52), l: 'O' }, R: { ...at(N, 30, 52), l: 'O' }, L: { ...at(N, 150, 52), l: 'O' } };
  const three = { T: [180, 270, 0], R: [300, 30, 120], L: [60, 150, 240] };
  const two = { T: [210, 330], R: [330, 90], L: [210, 90] };
  const minus = { T: 315, R: 75, L: 105 };
  const m = { atoms: A, bonds: [], lp: [], charges: [['N', '+', 90, 24]] };
  for (const o of ['T', 'R', 'L']) {
    if (o === dbl) {
      m.bonds.push(['N', o, 2, 'fg-bond-hi']);
      two[o].forEach((a) => m.lp.push([o, a]));
    } else {
      m.bonds.push(['N', o]);
      three[o].forEach((a) => m.lp.push([o, a]));
      m.charges.push([o, '−', minus[o], 31]);
      A[o].k = 'warn';
    }
  }
  return mol(m);
}

/* BF₃ from above: flat, every F with three lone pairs. */
function bf3(cx, cy) {
  const B0 = { x: cx, y: cy, l: 'B', k: 'warn' };
  const A = { B: B0, T: { ...at(B0, 270, 52), l: 'F' }, R: { ...at(B0, 30, 52), l: 'F' }, L: { ...at(B0, 150, 52), l: 'F' } };
  const lp = [];
  for (const [o, d] of [['T', 270], ['R', 30], ['L', 150]]) [d - 90, d, d + 90].forEach((a) => lp.push([o, a]));
  return mol({ atoms: A, bonds: [['B', 'T'], ['B', 'R'], ['B', 'L']], lp });
}

/* BF₃ tilted: the plane seen from slightly above, the empty 2p orbital
   standing up and down through boron. */
function bf3Side(cx, cy) {
  const B0 = P(cx, cy);
  const Fl = at(B0, 180, 60), Ff = at(B0, 30, 52), Fb = at(B0, 335, 52);
  let s = '';
  s += lobeE(cx, cy - 38, 12, 22, 'fg-orb-node');
  s += lobeE(cx, cy + 38, 12, 22, 'fg-orb-node');
  s += bond(B0, Fl, { rFrom: 16, rTo: 14 });
  s += wedge(B0, Ff, { rFrom: 16, rTo: 14, width: 9 });
  s += hash(B0, Fb, { rFrom: 16, rTo: 14, width: 10, rungs: 4 });
  s += atom(cx, cy, 'B', { kind: 'warn' });
  s += atom(Fl.x, Fl.y, 'F', { r: 14 });
  s += atom(Ff.x, Ff.y, 'F', { r: 14 });
  s += atom(Fb.x, Fb.y, 'F', { r: 14 });
  s += text(cx - 18, cy - 48, 'empty', { cls: 'fg-tag', size: 11, anchor: 'end' });
  s += text(cx - 18, cy - 34, '2p orbital', { cls: 'fg-tag', size: 11, anchor: 'end' });
  return s;
}

/* A central atom with n halogens drawn flat, each with three lone pairs. */
function star(cx, cy, center, lig, angles, len = 62) {
  const C0 = { x: cx, y: cy, l: center, k: 'hi' };
  const A = { X: C0 };
  const B = [], lp = [];
  angles.forEach((d, i) => {
    const k = 'L' + i;
    A[k] = { ...at(C0, d, len), l: lig };
    B.push(['X', k]);
    [d - 85, d, d + 85].forEach((a) => lp.push([k, a, lig.length > 1 ? 24 : 22]));
  });
  return mol({ atoms: A, bonds: B, lp });
}

/* H₂SO₄ drawn two ways. */
function sulfuric(cx, cy, separated) {
  const S0 = { x: cx, y: cy, l: 'S', k: 'hi' };
  const A = {
    S: S0,
    T: { ...at(S0, 270, 54), l: 'O', k: separated ? 'warn' : undefined },
    D: { ...at(S0, 90, 54), l: 'O', k: separated ? 'warn' : undefined },
    OL: { ...at(S0, 180, 56), l: 'O' },
    OR: { ...at(S0, 0, 56), l: 'O' },
  };
  A.HL = { ...at(A.OL, 210, 38), l: 'H' };
  A.HR = { ...at(A.OR, 330, 38), l: 'H' };
  const B = [['S', 'OL'], ['S', 'OR'], ['OL', 'HL'], ['OR', 'HR']];
  const lp = [['OL', 60], ['OL', 120], ['OR', 60], ['OR', 120]];
  const m = { atoms: A, bonds: B, lp };
  if (separated) {
    B.push(['S', 'T'], ['S', 'D']);
    lp.push(['T', 180], ['T', 270], ['T', 0], ['D', 180], ['D', 90], ['D', 0]);
    m.charges = [['S', '2+', 315, 30], ['T', '−', 315, 32], ['D', '−', 45, 32]];
  } else {
    B.push(['S', 'T', 2, 'fg-bond-hi'], ['S', 'D', 2, 'fg-bond-hi']);
    lp.push(['T', 210], ['T', 330], ['D', 150], ['D', 30]);
  }
  return mol(m);
}

/* Nitric oxide: N=O with one unpaired electron on N. */
function nitricOxide(cx, cy) {
  const A = { N: { x: cx - 26, y: cy, l: 'N', k: 'warn' }, O: { x: cx + 26, y: cy, l: 'O' } };
  return mol({ atoms: A, bonds: [['N', 'O', 2]], lp: [['N', 180], ['O', 300], ['O', 60]], dot: [['N', 270]] });
}

/* Methyl radical: three C–H bonds and one unpaired electron. */
function methylRadical(cx, cy) {
  const A = { C: { x: cx, y: cy, l: 'C', k: 'warn' } };
  const B = [];
  hs(A, B, 'C', [180, 0, 90], 38);
  return mol({ atoms: A, bonds: B, dot: [['C', 270]] });
}

/* Formaldehyde as the recipe first leaves it: single bonds only, O with
   three pairs, carbon with six electrons. */
function formaldehydeTry(cx, cy) {
  const A = { C: { x: cx - 20, y: cy, l: 'C', k: 'warn' }, O: { x: cx + 34, y: cy, l: 'O' } };
  const B = [['C', 'O']];
  hs(A, B, 'C', [215, 145], 40);
  return mol({ atoms: A, bonds: B, lp: [['O', 270], ['O', 0], ['O', 90]] });
}

/* Cyanate, three candidate structures. */
function cyanate(cx, cy, which) {
  const A = {
    N: { x: cx - 50, y: cy, l: 'N' },
    C: { x: cx, y: cy, l: 'C' },
    O: { x: cx + 50, y: cy, l: 'O' },
  };
  const m = { atoms: A };
  if (which === 'A') {
    m.bonds = [['N', 'C', 3], ['C', 'O']];
    m.lp = [['N', 180], ['O', 270], ['O', 0], ['O', 90]];
    m.charges = [['O', '−', 45, 31]];
  } else if (which === 'B') {
    m.bonds = [['N', 'C', 2], ['C', 'O', 2]];
    m.lp = [['N', 135], ['N', 225], ['O', 45], ['O', 315]];
    m.charges = [['N', '−', 90, 28]];
  } else {
    m.bonds = [['N', 'C'], ['C', 'O', 3]];
    m.lp = [['N', 180], ['N', 270], ['N', 90], ['O', 0]];
    m.charges = [['N', '2−', 135, 32], ['O', '+', 305, 27]];
  }
  return mol(m);
}

/* ========================================================= figures ===== */

const ETH = [
  { title: '1. Skeleton', draw: (x, y) => ethanol(x - 8, y, 1),
    tags: ['C–C–O, in written order', 'each H on the atom before it'] },
  { title: '2. Count bonds', draw: (x, y) => ethanol(x - 8, y, 2),
    tags: ['C: 4, C: 4, O: 2, each H: 1', 'single bonds meet every quota'] },
  { title: '3. Lone pairs, charges', kind: 'hi', draw: (x, y) => ethanol(x - 8, y, 3),
    tags: ['O: 2 bonds, so 2 lone pairs', 'all at quota: every charge 0'] },
];

FIGURES.push({
  id: 'ethanol-steps',
  section: 'lewis-structures',
  anchor: '<span class="k">Worked example — ethanol, CH₃CH₂OH</span>',
  viewBox: '0 0 760 212',
  alt: 'Ethanol built in three panels. Panel 1: carbon, carbon, oxygen joined in a row, three H on the first carbon, two H on the second, one H on the oxygen. Panel 2: the same skeleton with the bond count written beside each heavy atom: 4 on each carbon, 2 on the oxygen. Panel 3: two lone pairs added on the oxygen; every atom is at its quota, so every formal charge is zero.',
  build() { return row(ETH, { w: 236, h: 184, mcy: 84, tagY: 154 }); },
  caption: 'Ethanol built by the valence rule. The only step that adds anything after the skeleton is step 3, and it adds lone pairs only to the oxygen.',
});

FIGURES.push({
  id: 'l-ethanol-steps',
  lessons: ['lewis-structures'],
  viewBox: '0 0 340 580',
  alt: 'Ethanol built in three stacked panels: the skeleton with every H; the bond counts, 4 on each carbon and 2 on the oxygen; then two lone pairs on the oxygen, with every formal charge zero.',
  build() { return stack(ETH, { h: 180, mcy: 82, tagY: 150 }); },
  caption: 'Ethanol, CH₃CH₂OH, in three steps.',
});

FIGURES.push({
  id: 'condensed-branches',
  section: 'lewis-structures',
  anchor: '<h3>Reading a condensed formula</h3>',
  viewBox: '0 0 760 252',
  alt: 'Three condensed formulas, each drawn out. (CH3)2CHOH: one carbon bonded to two CH3 groups, one H and an O–H. (CH3)3COH: one carbon bonded to three CH3 groups and an O–H, with no H of its own. CH3COOCH3: a carbon bonded to a CH3, double-bonded to one oxygen, and single-bonded to a second oxygen that carries a CH3.',
  build() {
    const panels = [
      { title: '(CH₃)₂CHOH', draw: (cx, cy) => {
        const C = { x: cx - 20, y: cy, l: 'C', k: 'hi' };
        const A = { C, M1: { ...at(C, 180, 52), l: 'CH₃' }, M2: { ...at(C, 90, 50), l: 'CH₃' }, H: { ...at(C, 270, 40), l: 'H' }, O: { ...at(C, 0, 52), l: 'O' } };
        A.HO = { ...at(A.O, 330, 38), l: 'H' };
        return mol({ atoms: A, bonds: [['C', 'M1'], ['C', 'M2'], ['C', 'H'], ['C', 'O'], ['O', 'HO']], lp: [['O', 60], ['O', 130]] });
      }, tags: ['two CH₃ groups on one carbon', 'that carbon keeps one H'] },
      { title: '(CH₃)₃COH', draw: (cx, cy) => {
        const C = { x: cx - 20, y: cy, l: 'C', k: 'hi' };
        const A = { C, M1: { ...at(C, 180, 52), l: 'CH₃' }, M2: { ...at(C, 90, 50), l: 'CH₃' }, M3: { ...at(C, 270, 50), l: 'CH₃' }, O: { ...at(C, 0, 52), l: 'O' } };
        A.HO = { ...at(A.O, 330, 38), l: 'H' };
        return mol({ atoms: A, bonds: [['C', 'M1'], ['C', 'M2'], ['C', 'M3'], ['C', 'O'], ['O', 'HO']], lp: [['O', 60], ['O', 130]] });
      }, tags: ['three CH₃ groups on one carbon', 'no H left on that carbon'] },
      { title: 'CH₃COOCH₃', draw: (cx, cy) => {
        const C = { x: cx - 30, y: cy + 4, l: 'C', k: 'hi' };
        const A = { C, M: { ...at(C, 180, 50), l: 'CH₃' }, Od: { ...at(C, 270, 50), l: 'O', k: 'hi' }, Os: { ...at(C, 0, 52), l: 'O', k: 'warn' } };
        A.T = { ...at(A.Os, 60, 50), l: 'CH₃' };
        return mol({ atoms: A, bonds: [['C', 'M'], ['C', 'Od', 2], ['C', 'Os'], ['Os', 'T']], lp: [['Od', 225], ['Od', 315], ['Os', 300], ['Os', 120]] });
      }, tags: ['first O: double bond to the C', 'second O: links C to CH₃'] },
    ];
    return row(panels, { w: 236, h: 222, mcy: 110, tagY: 190 });
  },
  caption: 'Each condensed formula drawn out. The circled carbon is the one the parentheses hang the groups on. In CH₃COOCH₃ the first O takes the double bond and the second (coral) continues the chain.',
});

FIGURES.push({
  id: 'methylamine-protonated',
  section: 'lewis-structures',
  anchor: '<span class="k">Worked example — methylamine, CH₃NH₂</span>',
  viewBox: '0 0 760 222',
  alt: 'Three panels. Methylamine: a carbon with three H bonded to a nitrogen with two H and one lone pair. An arrow labeled plus H+ leads to methylammonium, where the lone pair has become a fourth N–H bond and the nitrogen carries a plus charge. A third panel shows the nitrogen in 3D: its lone pair points up, and its three bonds (to CH3, and to two H drawn as a wedge and a hashed bond) point down, like a low pyramid.',
  build() {
    let s = '';
    s += panel(14, 16, 220, 194);
    s += title(124, 40, 'methylamine');
    s += methylamine(122, 102, false);
    s += good(124, 170, 'N: 3 bonds + 1 lone pair');
    s += good(124, 187, 'at quota: charge 0');
    s += text(266, 94, '+ H⁺', { cls: 'fg-tag', size: 11 });
    s += arrow(P(242, 104), P(290, 104));
    s += panel(298, 16, 220, 194, { kind: 'hi' });
    s += title(408, 40, 'methylammonium');
    s += methylamine(406, 102, true);
    s += warn(408, 170, 'N: 4 bonds, no lone pair');
    s += warn(408, 187, '5 − 0 − 4 = +1');
    s += panel(530, 16, 216, 194);
    s += title(638, 40, 'methylamine in 3D');
    s += pyramid(646, 104);
    s += plain(638, 162, 'wedge: toward you');
    s += plain(638, 179, 'hashes: away from you');
    s += good(638, 196, 'lone pair on top');
    return s;
  },
  caption: 'The lone pair on nitrogen is where the H⁺ bonds; nothing else in the drawing changes. The right panel is the same neutral molecule drawn with its real shape.',
});

FIGURES.push({
  id: 'acetic-acid-acetate',
  section: 'lewis-structures',
  anchor: '<span class="k">Worked example — acetic acid, CH₃COOH</span>',
  viewBox: '0 0 760 230',
  alt: 'Acetic acid and acetate. Acetic acid: a CH3 carbon (three H drawn) bonded to a middle carbon, which is double-bonded to one oxygen and single-bonded to a second oxygen that carries an H. Each oxygen has two lone pairs. An arrow labeled minus H+ leads to acetate, where the second oxygen has lost its H, carries three lone pairs and a minus charge.',
  build() {
    let s = '';
    s += panel(14, 16, 300, 202);
    s += title(164, 40, 'acetic acid, CH₃COOH');
    s += acetic(158, 124, false);
    s += good(164, 188, 'middle C: 4 bonds (C=O counts 2)');
    s += good(164, 205, 'each O: 2 bonds + 2 lone pairs');
    s += text(380, 112, '− H⁺', { cls: 'fg-tag', size: 11 });
    s += arrow(P(330, 122), P(430, 122));
    s += panel(446, 16, 300, 202, { kind: 'hi' });
    s += title(596, 40, 'acetate, CH₃COO⁻');
    s += acetic(590, 124, true);
    s += warn(596, 188, 'this O: 1 bond + 3 lone pairs');
    s += warn(596, 205, '6 − 6 − 1 = −1');
    return s;
  },
  caption: 'Removing H⁺ takes the proton and leaves both electrons of the O–H bond on the oxygen. That oxygen goes from 2 bonds to 1, so it gains a lone pair and a −1.',
});

FIGURES.push({
  id: 'methoxide-ion',
  section: 'lewis-structures',
  anchor: '<span class="k">Worked example — an organic ion, methoxide CH₃O⁻</span>',
  viewBox: '0 0 340 200',
  alt: 'The methoxide ion: a carbon with three H bonded to an oxygen that carries three lone pairs and a minus charge.',
  build() {
    let s = '';
    s += panel(10, 10, 320, 180);
    s += title(170, 34, 'methoxide, CH₃O⁻');
    s += methoxide(172, 98);
    s += warn(170, 160, 'O: 1 bond + 3 lone pairs');
    s += warn(170, 177, '6 − 6 − 1 = −1, on the O');
    return s;
  },
  caption: 'The −1 is written on the oxygen, the atom that is one bond short of its quota.',
});

FIGURES.push({
  id: 'l-charge-departures',
  lessons: ['lewis-structures'],
  viewBox: '0 0 340 390',
  alt: 'Two stacked panels. Methylammonium: a carbon with three H bonded to a nitrogen with three H and a plus charge, no lone pair. Methoxide: a carbon with three H bonded to an oxygen with three lone pairs and a minus charge.',
  build() {
    return stack([
      { title: 'methylammonium, CH₃NH₃⁺', draw: (x, y) => methylamine(x - 2, y, true),
        tags: ['!N: 4 bonds, one above quota', '!5 − 0 − 4 = +1'] },
      { title: 'methoxide, CH₃O⁻', draw: (x, y) => methoxide(x + 2, y),
        tags: ['!O: 1 bond, one below quota', '!6 − 6 − 1 = −1'] },
    ], { h: 180, mcy: 82, tagY: 150 });
  },
  caption: 'One bond above quota gives +1; one bond below gives −1.',
});

FIGURES.push({
  id: 'l-methylamine-q',
  lessons: ['lewis-structures'],
  viewBox: '0 0 340 136',
  alt: 'Methylamine drawn without its lone pairs: a carbon with three H bonded to a nitrogen with two H. A question mark sits beside the nitrogen.',
  build() { return methylamine(160, 58, false, { ask: true }) + plain(170, 126, 'CH₃NH₂, lone pairs not yet drawn'); },
  caption: 'Methylamine, CH₃NH₂.',
});

FIGURES.push({
  id: 'l-ethoxide-q',
  lessons: ['lewis-structures'],
  viewBox: '0 0 340 136',
  alt: 'Ethoxide drawn without lone pairs or charge: a carbon with three H, bonded to a carbon with two H, bonded to an oxygen that has no other bond. A question mark sits beside the oxygen.',
  build() { return ethanol(160, 58, 1, { anion: true, ask: true }) + plain(170, 126, 'CH₃CH₂O⁻, pairs and charge not yet drawn'); },
  caption: 'Ethoxide, CH₃CH₂O⁻.',
});

const CO2 = [
  { title: '1. Count', draw: (x, y) => co2(x, y, 1), tags: ['4 + 6 + 6 = 16', '=electrons to place'] },
  { title: '2. Single bonds', draw: (x, y) => co2(x, y, 2), tags: ['2 bonds use 4', '=12 left'] },
  { title: '3. Fill the O’s', draw: (x, y) => co2(x, y, 3), tags: ['the O’s take all 12', '!C: only 4 electrons'] },
  { title: '4. Move 2 pairs', kind: 'hi', draw: (x, y) => co2(x, y, 4), tags: ['C: 4 bonds = 8 electrons', 'every formal charge 0'] },
];

FIGURES.push({
  id: 'co2-recipe',
  section: 'lewis-structures',
  anchor: '<span class="k">Worked example — CO₂</span>',
  viewBox: '0 0 760 200',
  alt: 'CO2 built by the central-atom recipe in four panels. 1: O, C, O with 6, 4 and 6 valence electrons, 16 in all. 2: O–C–O joined by single bonds. 3: three lone pairs on each oxygen; carbon has only four electrons, and one lone pair on each oxygen is highlighted. 4: those two pairs have become second bonds, giving O=C=O with two lone pairs on each oxygen and every formal charge zero.',
  build() { return row(CO2, { w: 176, h: 172, mcy: 88, tagY: 136 }); },
  caption: 'The recipe run on CO₂. The highlighted pairs in panel 3 are the ones that become the second bonds in panel 4. No electron is added or removed after panel 1.',
});

FIGURES.push({
  id: 'l-co2-recipe',
  lessons: ['lewis-structures'],
  viewBox: '0 0 340 604',
  alt: 'CO2 built in four stacked panels: count 16 electrons; join O–C–O with single bonds; give each O three lone pairs, leaving carbon with four electrons; move one pair from each O into a second bond, giving O=C=O with every formal charge zero.',
  build() { return stack(CO2, { h: 140, gap: 8, mcy: 58, tagY: 114 }); },
  caption: 'The central-atom recipe, run on CO₂.',
});

FIGURES.push({
  id: 'nitrate-three',
  section: 'lewis-structures',
  anchor: '<span class="k">Worked example — a charged species, NO₃⁻</span>',
  viewBox: '0 0 760 246',
  alt: 'Nitrate drawn three times. In each drawing nitrogen carries a plus charge and is bonded to three oxygens. One oxygen, a different one each time, has a double bond and two lone pairs; the other two have single bonds, three lone pairs and a minus charge.',
  build() {
    return row([
      { title: 'top O double-bonded', draw: (x, y) => nitrate(x, y, 'T') },
      { title: 'right O double-bonded', draw: (x, y) => nitrate(x, y, 'R') },
      { title: 'left O double-bonded', draw: (x, y) => nitrate(x, y, 'L') },
    ].map((p) => ({ ...p, tags: ['N +1; single-bonded O’s −1 each', '=sum: +1 − 1 − 1 = −1'] })),
    { w: 236, h: 218, mcy: 112, tagY: 190 });
  },
  caption: 'Nitrate, drawn three times. The three drawings differ only in which oxygen holds the double bond.',
});

const TIE = [
  { title: 'O=C=O', kind: 'good', draw: (x, y) => co2(x, y, 4), tags: ['every formal charge 0', '=the better structure'] },
  { title: 'O–C≡O', kind: 'warn', draw: (x, y) => co2Triple(x, y), tags: ['!left O −1, right O +1', '=same octets, more charge'] },
];

FIGURES.push({
  id: 'co2-tiebreak',
  section: 'lewis-structures',
  anchor: '<h3>Using formal charge as the tiebreaker</h3>',
  viewBox: '0 0 560 180',
  alt: 'Two structures for CO2. Left: O=C=O, two lone pairs on each oxygen, every formal charge zero. Right: an oxygen with one single bond and three lone pairs carrying minus one, the carbon, and an oxygen with a triple bond and one lone pair carrying plus one.',
  build() { return row(TIE, { w: 260, h: 152, gap: 12, mcy: 76, tagY: 122 }); },
  caption: 'Two structures that both give every atom an octet. Only the charges differ.',
});

FIGURES.push({
  id: 'l-co2-tiebreak',
  lessons: ['lewis-structures'],
  viewBox: '0 0 340 318',
  alt: 'Two stacked structures for CO2: O=C=O with every formal charge zero, and O–C≡O with minus one on the single-bonded oxygen and plus one on the triple-bonded oxygen.',
  build() { return stack(TIE, { h: 144, mcy: 70, tagY: 112 }); },
  caption: 'Both obey the octet rule. Compare the charges.',
});

FIGURES.push({
  id: 'l-cyanate-q',
  lessons: ['lewis-structures'],
  viewBox: '0 0 340 384',
  alt: 'Three structures for the cyanate ion, NCO minus. A: N triple-bonded to C, C single-bonded to O; N has one lone pair; O has three lone pairs and minus one. B: N=C=O; N has two lone pairs and minus one; O has two lone pairs. C: N single-bonded to C, C triple-bonded to O; N has three lone pairs and minus two; O has one lone pair and plus one.',
  build() {
    return stack([
      { title: 'A', draw: (x, y) => cyanate(x, y, 'A'), tags: ['=N 0, C 0, O −1'] },
      { title: 'B', draw: (x, y) => cyanate(x, y, 'B'), tags: ['=N −1, C 0, O 0'] },
      { title: 'C', draw: (x, y) => cyanate(x, y, 'C'), tags: ['=N −2, C 0, O +1'] },
    ], { h: 114, gap: 8, mcy: 58, tagY: 102 });
  },
  caption: 'Three octet-satisfying structures for cyanate, NCO⁻.',
});

const BF3 = [
  { title: 'BF₃ from above', draw: (x, y) => bf3(x, y + 4), tags: ['!B: 3 bonds, no lone pair', '!6 electrons: 2 short of 8'] },
  { title: 'tilted to show the plane', draw: (x, y) => bf3Side(x - 10, y), tags: ['=wedge: toward you; hashes: away', 'nothing in the orbital'] },
];

FIGURES.push({
  id: 'bf3-empty-orbital',
  section: 'lewis-structures',
  anchor: '<b>Incomplete octets.</b>',
  viewBox: '0 0 560 258',
  alt: 'BF3 in two panels. Left: boron at the center bonded to three fluorines, each fluorine with three lone pairs; boron has no lone pair and six electrons. Right: the same molecule tilted, with one F drawn as a wedge and one as a hashed bond, and a dashed, empty p orbital standing above and below the boron, perpendicular to the plane of the three bonds.',
  build() { return row(BF3, { w: 260, h: 230, gap: 12, mcy: 116, tagY: 202 }); },
  caption: 'Boron in BF₃ stops at six electrons. The dashed lobes are its empty 2p orbital, the space an incoming lone pair can fill.',
});

FIGURES.push({
  id: 'l-bf3-empty-orbital',
  lessons: ['lewis-structures'],
  viewBox: '0 0 340 458',
  alt: 'BF3 stacked in two panels: from above, boron bonded to three fluorines with three lone pairs each and no lone pair of its own; tilted, with a dashed, empty p orbital above and below the boron.',
  build() { return stack(BF3, { h: 214, mcy: 104, tagY: 184 }); },
  caption: 'BF₃: six electrons on boron, and an empty orbital.',
});

const EXP = [
  { title: 'PCl₅', draw: (x, y) => star(x, y, 'P', 'Cl', [270, 342, 54, 126, 198]),
    tags: ['P: 5 bonds = 10 electrons', '=each Cl: 1 bond + 3 lone pairs'] },
  { title: 'SF₆', draw: (x, y) => star(x, y, 'S', 'F', [0, 60, 120, 180, 240, 300]),
    tags: ['S: 6 bonds = 12 electrons', '=each F: 1 bond + 3 lone pairs'] },
];

FIGURES.push({
  id: 'expanded-octets',
  section: 'lewis-structures',
  anchor: '<b>Expanded octets.</b>',
  viewBox: '0 0 760 300',
  alt: 'Two Lewis structures drawn flat. PCl5: phosphorus bonded to five chlorines, each with three lone pairs, so phosphorus has ten electrons. SF6: sulfur bonded to six fluorines, each with three lone pairs, so sulfur has twelve electrons.',
  build() { return row(EXP, { w: 360, h: 272, gap: 12, mcy: 138, tagY: 240 }); },
  caption: 'Two period-3 atoms past eight. These flat drawings show which atoms are bonded, not the 3D shape.',
});

FIGURES.push({
  id: 'l-expanded-octets',
  lessons: ['lewis-structures'],
  viewBox: '0 0 340 540',
  alt: 'PCl5 and SF6 stacked: phosphorus with five bonds to chlorine, ten electrons; sulfur with six bonds to fluorine, twelve electrons. Every halogen has three lone pairs.',
  build() { return stack(EXP, { h: 255, mcy: 130, tagY: 222 }); },
  caption: 'Phosphorus and sulfur, drawn past eight.',
});

FIGURES.push({
  id: 'sulfuric-two-ways',
  section: 'lewis-structures',
  anchor: 'the central atom is not really sharing a full covalent pair with each one',
  viewBox: '0 0 760 286',
  alt: 'Sulfuric acid drawn two ways. Left: sulfur double-bonded to two oxygens and single-bonded to two O–H groups, with every formal charge zero and twelve electrons on sulfur. Right: sulfur single-bonded to all four oxygens with a 2+ charge; the two oxygens without H each carry three lone pairs and a minus charge; every atom has an octet.',
  build() {
    return row([
      { title: 'two S=O bonds', draw: (x, y) => sulfuric(x, y, false), tags: ['S: 6 bonds = 12 electrons', '=every formal charge 0'] },
      { title: 'all single bonds', draw: (x, y) => sulfuric(x, y, true), tags: ['every atom has an octet', '!S +2; two O’s −1 each'] },
    ], { w: 360, h: 258, gap: 12, mcy: 130, tagY: 224 });
  },
  caption: 'Both drawings are in use for H₂SO₄. Most courses grade the left one; bonding calculations favor the right one.',
});

const RAD = [
  { title: 'nitric oxide, NO', draw: (x, y) => nitricOxide(x, y), tags: ['5 + 6 = 11 electrons', '!one unpaired, drawn on N'] },
  { title: 'methyl radical, CH₃•', draw: (x, y) => methylRadical(x, y - 8), tags: ['C: 3 bonds + 1 electron', '!7 electrons: short of 8'] },
];

FIGURES.push({
  id: 'odd-electron',
  section: 'lewis-structures',
  anchor: '<b>Odd-electron species.</b>',
  viewBox: '0 0 560 204',
  alt: 'Two radicals. Nitric oxide: N double-bonded to O; N has one lone pair and one single unpaired dot; O has two lone pairs. Methyl radical: a carbon with three H and one single dot.',
  build() { return row(RAD, { w: 260, h: 176, gap: 12, mcy: 88, tagY: 146 }); },
  caption: 'A single dot is one unpaired electron. An odd total leaves one, whatever you do.',
});

FIGURES.push({
  id: 'l-odd-electron',
  lessons: ['lewis-structures'],
  viewBox: '0 0 340 358',
  alt: 'Nitric oxide, N double-bonded to O with one unpaired dot on N, and the methyl radical, a carbon with three H and one unpaired dot, stacked.',
  build() { return stack(RAD, { h: 164, mcy: 76, tagY: 134 }); },
  caption: 'Two radicals: each has one unpaired electron.',
});

FIGURES.push({
  id: 'four-wrong-structures',
  section: 'lewis-structures',
  anchor: '<h3>Four structures that are wrong</h3>',
  viewBox: '0 0 760 352',
  alt: 'Four boxes, each with a wrong structure on the left and the fix on the right. 1: a carbon with five H, corrected to CH4. 2: NH4 drawn with no charge, corrected by writing plus one on N. 3: H3O drawn with no charge, corrected by writing plus one on O. 4: an H drawn bonded to two CH3 groups, corrected to CH3–CH3 with every H at an end.',
  build() {
    let s = '';
    const cell = (x, y, head, wrongDraw, rightDraw, wt, rt) => {
      s += panel(x, y, 360, 156);
      s += title(x + 180, y + 22, head);
      s += wrongDraw(x + 90, y + 84);
      s += arrow(P(x + 160, y + 84), P(x + 200, y + 84));
      s += rightDraw(x + 270, y + 84);
      s += warn(x + 90, y + 146, wt);
      s += good(x + 270, y + 146, rt);
    };
    const centre = (l, angles, len, extra = {}) => (cx, cy) => {
      const A = { X: { x: cx, y: cy, l, k: extra.k } };
      const B = [];
      hs(A, B, 'X', angles, len);
      return mol({ atoms: A, bonds: B, lp: (extra.lp || []).map((a) => ['X', a]), charges: extra.ch ? [['X', '+', extra.ch, 26]] : [] });
    };
    cell(14, 16, 'C with five bonds',
      centre('C', [270, 342, 54, 126, 198], 42, { k: 'warn' }), centre('C', [270, 0, 90, 180], 38),
      '10 electrons on C', 'CH₄: 8 electrons');
    cell(386, 16, 'N with four bonds, no charge',
      centre('N', [270, 0, 90, 180], 38, { k: 'warn' }), centre('N', [270, 0, 90, 180], 38, { ch: 315 }),
      '5 − 0 − 4 = +1, not 0', 'charge written');
    cell(14, 184, 'O with three bonds, no charge',
      centre('O', [180, 0, 90], 38, { k: 'warn', lp: [270] }), centre('O', [180, 0, 90], 38, { lp: [270], ch: 320 }),
      '6 − 2 − 3 = +1, not 0', 'charge written');
    cell(386, 184, 'H with two bonds',
      (cx, cy) => {
        const A = { a: { x: cx - 48, y: cy, l: 'CH₃' }, h: { x: cx, y: cy, l: 'H', k: 'warn' }, b: { x: cx + 48, y: cy, l: 'CH₃' } };
        return mol({ atoms: A, bonds: [['a', 'h'], ['h', 'b']] });
      },
      (cx, cy) => {
        const A = { a: { x: cx - 26, y: cy, l: 'CH₃' }, b: { x: cx + 26, y: cy, l: 'CH₃' } };
        return mol({ atoms: A, bonds: [['a', 'b']] });
      },
      'H holds one pair only', 'every H at an end');
    return s;
  },
  caption: 'Left of each arrow, the error; right, the fix. The top-left and bottom-right errors describe no real molecule. The other two are real ions missing their charge.',
});

FIGURES.push({
  id: 'l-formaldehyde',
  lessons: ['lewis-structures'],
  viewBox: '0 0 340 150',
  alt: 'Formaldehyde as the recipe first leaves it: a carbon with two H single-bonded to an oxygen with three lone pairs. The carbon is marked as having only six electrons.',
  build() {
    return formaldehydeTry(166, 62) +
      plain(170, 124, 'all 12 electrons placed') +
      warn(170, 141, 'C: 3 bonds = 6 electrons');
  },
  caption: 'Formaldehyde, H₂CO, after the first four steps of the recipe.',
});

export default FIGURES;
