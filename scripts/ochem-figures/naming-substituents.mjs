/* Figures for the naming-substituents notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Almost every figure here is the same kind of drawing: a zigzag parent chain
   (highlighted), its substituents, and the chain's numbers written on the
   carbons. The helpers below draw that once, so every numbered chain on the
   page looks the same, and a "numbered both ways" figure is simply the same
   chain drawn twice with the numbers reversed.

   The figures are drawn 360 wide and stack their panels vertically. A
   side-by-side pair at 760 wide scrolls sideways on a phone, and a comparison
   you have to scroll between is not a comparison. */
import { atom, bond, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { zig, sk } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */

/* Numbers on carbons are what the reader compares, so they are set larger
   than the CSS default for their class (an inline style beats the class). */
const numeral = (x, y, v, cls = 'fg-lbl', px = 15) =>
  text(x, y, v, { cls, size: px }).replace('>', ` style="font-size:${px}px">`);

const W = 360;                   // canvas width for every figure here
const PX = 12, PW = 336;         // panel x and width
const CX = PX + PW / 2;          // horizontal center
const DY = 24;                   // zigzag rise

/* How far a chain's drawing reaches above and below its baseline y0, so a
   panel can be sized to fit it. A substituent on a raised (odd) vertex
   points up; on a lower (even) vertex it points down. */
const UP = { me: 82, X: 82, et: 98 };
const DOWN = { me: 56, X: 58, et: 72, ibu: 108, sbu: 76, sbuC: 76 };
function extents(subs) {
  let up = 46, down = 26;
  for (const q of subs) {
    if (q.i % 2 === 1) up = Math.max(up, UP[q.kind] || 46);
    else down = Math.max(down, DOWN[q.kind] || 26);
  }
  return { up, down };
}

/* A skeletal chain with substituents and numbers.
   n       carbons in the parent chain
   subs    [{ i, kind, ang, name }]; i is the 0-based vertex from the left.
           kind: 'me' | 'et' | 'X' (a halogen, name = its symbol) | 'ibu' (2-methylpropyl)
           | 'sbu' (butan-2-yl). ibu and sbu are only drawn downward.
           ang tilts a methyl (degrees, + toward the right).
   opts.from  'left' | 'right' | null: which end is C1 (null draws no numbers)
   opts.names false leaves the group names off; opts.branchNums false leaves
              the branch's own green numbers off. */
function chain(x0, y0, n, subs = [], opts = {}) {
  const dx = opts.dx || 40;
  const r = zig(x0, y0, n, dx, DY);
  let s = '';
  for (let i = 0; i < n - 1; i++) s += sk(r[i], r[i + 1], true);
  const has = new Set(subs.map((q) => q.i));
  const showNames = opts.names !== false;
  const green = (x, y, v) => numeral(x, y, v, 'fg-tag-good', 13);
  for (const q of subs) {
    const p = r[q.i];
    const up = q.i % 2 === 1;
    const a = ((q.ang || 0) * Math.PI) / 180;
    const v = P(Math.sin(a), up ? -Math.cos(a) : Math.cos(a));
    const nameAt = (end) => (showNames && q.name
      ? text(end.x, end.y + (up ? -9 : 17), q.name, { cls: 'fg-sm', size: 10 }) : '');
    if (q.kind === 'me') {
      const m = P(p.x + v.x * 38, p.y + v.y * 38);
      s += sk(p, m) + nameAt(m);
    } else if (q.kind === 'et') {
      const e1 = P(p.x + v.x * 36, p.y + v.y * 36);
      const e2 = P(e1.x + 31, e1.y + (up ? -18 : 18));
      s += sk(p, e1) + sk(e1, e2) + nameAt(e2);
    } else if (q.kind === 'X') {
      const x = P(p.x + v.x * 42, p.y + v.y * 42);
      s += bond(p, x, { rFrom: 0, rTo: 14 }) + atom(x.x, x.y, q.name);
    } else if (q.kind === 'ibu') {
      const b1 = P(p.x, p.y + 36), b2 = P(b1.x + 31, b1.y + 18), b3 = P(b2.x + 31, b2.y - 18), bm = P(b2.x, b2.y + 36);
      s += sk(p, b1) + sk(b1, b2) + sk(b2, b3) + sk(b2, bm);
      if (opts.branchNums !== false) s += green(b1.x - 11, b1.y + 8, '1') + green(b2.x - 11, b2.y + 14, '2') + green(b3.x + 11, b3.y + 8, '3');
      if (showNames) s += text(bm.x, bm.y + 17, 'methyl', { cls: 'fg-sm', size: 10 });
    } else if (q.kind === 'sbuC') {
      // the same branch as 'sbu', numbered in the classic style: the attached
      // carbon is C1 and the chain runs out along the ethyl
      const c1 = P(p.x, p.y + 36), m = P(c1.x - 31, c1.y + 18), c2 = P(c1.x + 31, c1.y + 18), c3 = P(c2.x + 31, c2.y - 18);
      s += sk(p, c1) + sk(c1, m) + sk(c1, c2) + sk(c2, c3);
      if (opts.branchNums !== false) s += green(c1.x + 12, c1.y - 4, '1') + green(c2.x, c2.y + 19, '2') + green(c3.x + 11, c3.y + 4, '3');
      if (showNames) s += text(m.x, m.y + 17, 'methyl', { cls: 'fg-sm', size: 10 });
    } else if (q.kind === 'sbu') {
      const c2 = P(p.x, p.y + 36), c1 = P(c2.x - 31, c2.y + 18), c3 = P(c2.x + 31, c2.y + 18), c4 = P(c3.x + 31, c3.y - 18);
      s += sk(p, c2) + sk(c2, c1) + sk(c2, c3) + sk(c3, c4);
      if (opts.branchNums !== false) s += green(c1.x, c1.y + 18, '1') + green(c2.x + 12, c2.y - 4, '2') + green(c3.x, c3.y + 18, '3') + green(c4.x + 11, c4.y + 4, '4');
    }
  }
  if (opts.from) {
    r.forEach((p, i) => {
      const up = i % 2 === 1;
      const num = String(opts.from === 'left' ? i + 1 : n - i);
      // The number goes on the side of the carbon that is free: opposite a
      // substituent, otherwise outside the zigzag.
      const above = has.has(i) ? !up : up;
      s += numeral(p.x, above ? p.y - 10 : p.y + 22, num);
    });
  }
  return s;
}

/* Locants of the substituents under a given numbering, sorted. */
const locantSet = (n, subs, from) => subs.map((q) => (from === 'left' ? q.i + 1 : n - q.i)).sort((a, b) => a - b);
const fmtSet = (set) => '{' + set.join(', ') + '}';

/* The same chain in two stacked panels, numbered from each end.
   verdict: { left: 'good'|'warn'|'tie', right: ..., name, notes } or null for a
   question figure that must not give the answer away. Returns { svg, h }. */
function bothWays({ n, subs, verdict = null, dx = 40 }) {
  const { up, down } = extents(subs);
  const y0rel = 34 + up;                            // baseline, from the panel top
  const setRel = y0rel + down + 24;
  const Hp = setRel + (verdict ? 30 : 14);
  const notes = (verdict && verdict.notes) || {};
  const chainW = (n - 1) * dx;
  let s = '';
  ['left', 'right'].forEach((from, k) => {
    const py = 12 + k * (Hp + 12);
    const v = verdict ? verdict[from] : null;
    s += panel(PX, py, PW, Hp, { kind: v === 'good' ? 'good' : v === 'warn' ? 'warn' : undefined });
    s += tag(CX, py + 24, from === 'left' ? 'C1 at the left end' : 'C1 at the right end');
    s += chain(CX - chainW / 2, py + y0rel, n, subs, { from, dx });
    s += text(CX, py + setRel, 'substituents at ' + fmtSet(locantSet(n, subs, from)), { cls: 'fg-lbl', size: 12 });
    if (v) {
      const words = notes[from] || (v === 'good' ? 'lower at the first difference' : 'higher at the first difference');
      s += text(CX, py + setRel + 20, words, { cls: v === 'good' ? 'fg-tag-good' : v === 'warn' ? 'fg-tag-warn' : 'fg-tag-mut', size: 11 });
    }
  });
  let h = 12 + 2 * Hp + 12 + 4;
  if (verdict && verdict.name) { s += text(CX, h + 18, verdict.name, { cls: 'fg-lbl', size: 13 }); h += 30; }
  return { svg: s, h };
}

/* A single numbered chain in one panel, with an optional name under it. */
function single({ n, subs, from = 'left', name = '', note = '', names, branchNums, dx = 40 }) {
  const { up, down } = extents(subs);
  const y0 = 12 + 20 + up;
  let bottom = y0 + down + 10;
  let s = '';
  const chainW = (n - 1) * dx;
  s += chain(CX - chainW / 2, y0, n, subs, { from, names, branchNums, dx });
  if (name) { s += text(CX, bottom + 14, name, { cls: 'fg-lbl', size: 13 }); bottom += 22; }
  if (note) { s += text(CX, bottom + 14, note, { cls: 'fg-sm', size: 10 }); bottom += 20; }
  const Hp = bottom + 6 - 12;
  return { svg: panel(PX, 12, PW, Hp) + s, h: Hp + 24 };
}

/* A figure definition from a builder that reports its own height. */
function sized(def, make) {
  const { svg, h } = make();
  return { ...def, viewBox: `0 0 ${W} ${Math.ceil(h)}`, build: () => svg };
}

/* ------------------------------------------------ the alkyl groups --- */
FIGURES.push({
  id: 'alkyl-group-gallery',
  section: 'naming-substituents',
  lessons: ['naming-substituents'],
  anchor: 'fig-alkyl-group-gallery',
  alt: 'Seven alkyl groups drawn as skeletal fragments: propyl and isopropyl (three carbons), butyl, sec-butyl, isobutyl and tert-butyl (four carbons) and neopentyl (five carbons). In each the bond to the parent chain is highlighted and ends in a dot, and the group’s own carbons are numbered as in its systematic name.',
  viewBox: '0 0 360 810',
  build() {
    let s = '';
    const dot = (p) => atom(p.x, p.y, '', { kind: 'hi', r: 5 });
    const num = (p, v, dx, dy) => numeral(p.x + dx, p.y + dy, v, 'fg-tag-good', 13);
    const me = (p, dx = 0, dy = 17) => text(p.x + dx, p.y + dy, 'methyl', { cls: 'fg-sm', size: 10 });
    const groups = [
      { common: 'propyl', sys: 'propan-1-yl', draw(x, y) {
        const A = P(x, y), c1 = P(x + 31, y - 18), c2 = P(x + 62, y), c3 = P(x + 93, y - 18);
        return sk(A, c1, true) + sk(c1, c2) + sk(c2, c3) + dot(A) + num(c1, '1', 0, -9) + num(c2, '2', 0, 19) + num(c3, '3', 0, -9);
      } },
      { common: 'isopropyl', sys: 'propan-2-yl', draw(x, y) {
        const A = P(x + 10, y + 12), c = P(x + 41, y - 6), m1 = P(x + 72, y + 12), m3 = P(x + 41, y - 42);
        return sk(A, c, true) + sk(c, m1) + sk(c, m3) + dot(A) + num(m3, '1', 12, 4) + num(c, '2', 13, 2) + num(m1, '3', 0, 19);
      } },
      { common: 'butyl', sys: 'butan-1-yl', draw(x, y) {
        const A = P(x - 12, y), c1 = P(x + 19, y - 18), c2 = P(x + 50, y), c3 = P(x + 81, y - 18), c4 = P(x + 112, y);
        return sk(A, c1, true) + sk(c1, c2) + sk(c2, c3) + sk(c3, c4) + dot(A) + num(c1, '1', 0, -9) + num(c2, '2', 0, 19) + num(c3, '3', 0, -9) + num(c4, '4', 0, 19);
      } },
      { common: 'sec-butyl', sys: 'butan-2-yl', draw(x, y) {
        const A = P(x - 6, y + 12), c2 = P(x + 25, y - 6), c1 = P(x + 25, y - 42), c3 = P(x + 56, y + 12), c4 = P(x + 87, y - 6);
        return sk(A, c2, true) + sk(c2, c1) + sk(c2, c3) + sk(c3, c4) + dot(A) + num(c1, '1', 12, 4) + num(c2, '2', 13, 2) + num(c3, '3', 0, 19) + num(c4, '4', 0, -9);
      } },
      { common: 'isobutyl', sys: '2-methylpropyl', draw(x, y) {
        const A = P(x - 6, y - 8), c1 = P(x + 25, y - 26), c2 = P(x + 56, y - 8), c3 = P(x + 87, y - 26), m = P(x + 56, y + 28);
        return sk(A, c1, true) + sk(c1, c2) + sk(c2, c3) + sk(c2, m) + dot(A) + num(c1, '1', 0, -9) + num(c2, '2', 13, 16) + num(c3, '3', 0, -9) + me(m);
      } },
      { common: 'tert-butyl', sys: '2-methylpropan-2-yl', draw(x, y) {
        // attachment bond from the lower left, methyls up, down-right and down
        const A = P(x, y + 8), c = P(x + 31, y - 10), m1 = P(c.x, c.y - 34), m3 = P(c.x + 31, c.y + 18), m2 = P(c.x, c.y + 36);
        return sk(A, c, true) + sk(c, m1) + sk(c, m2) + sk(c, m3) + dot(A) + num(m1, '1', 12, 6) + num(c, '2', 13, -4) + num(m3, '3', 10, -4) + me(m2, 30, 4);
      } },
      { common: 'neopentyl', sys: '2,2-dimethylpropyl', draw(x, y) {
        const A = P(x - 6, y - 8), c1 = P(x + 25, y - 26), c2 = P(x + 56, y - 8), c3 = P(x + 87, y - 26), ma = P(x + 56, y + 28), mb = P(x + 87, y + 10);
        return sk(A, c1, true) + sk(c1, c2) + sk(c2, c3) + sk(c2, ma) + sk(c2, mb) + dot(A) + num(c1, '1', 0, -9) + num(c2, '2', -11, 19) + num(c3, '3', 0, -9) + me(ma) + me(mb, 6, 17);
      } },
    ];
    // Rows: 3 carbons, 4 carbons (two rows), 5 carbons.
    const rows = [
      { label: 'three carbons', items: [0, 1] },
      { label: 'four carbons', items: [2, 3] },
      { label: null, items: [4, 5] },
      { label: 'five carbons', items: [6] },
    ];
    let y = 8;
    for (const row of rows) {
      if (row.label) { s += tag(CX, y + 14, row.label); y += 22; }
      row.items.forEach((gi, k) => {
        const g = groups[gi];
        const px = row.items.length === 1 ? CX - 82 : PX + k * 172;
        s += panel(px, y, 164, 164);
        s += text(px + 82, y + 22, g.common, { cls: 'fg-lbl', size: 12.5 });
        s += text(px + 82, y + 40, g.sys, { cls: 'fg-sm', size: 10 });
        s += g.draw(px + 36, y + 110);
      });
      y += 172;
    }
    s += text(CX, y + 8, 'The open circle stands for the parent chain.', { cls: 'fg-sm', size: 10 });
    s += text(CX, y + 24, 'Green numbers follow the systematic name.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Each pair comes from one alkane: propyl and isopropyl from propane, butyl and <i>sec</i>-butyl from butane, isobutyl and <i>tert</i>-butyl from 2-methylpropane. Within a pair the carbons are the same; only the carbon that carries the highlighted bond changes.',
  note: '<i>sec</i>-Butyl and isobutyl are the pair people confuse. In <i>sec</i>-butyl the highlighted bond lands on the branch point itself. In isobutyl it lands one carbon before the branch point. Cover the names, look at the highlighted bond, and say which is which.',
});

/* --------------------------------------- a halogen competes as an equal --- */
const HEX_CL = { n: 6, subs: [{ i: 1, kind: 'me', name: 'methyl' }, { i: 3, kind: 'X', name: 'Cl' }] };
FIGURES.push(sized({
  id: 'halogen-equal-standing',
  section: 'naming-substituents',
  lessons: ['naming-substituents'],
  anchor: 'fig-halogen-equal-standing',
  alt: 'The same hexane drawn twice, carrying a methyl and a chlorine. Numbered from the left, the methyl is on C2 and the chlorine on C4, set {2, 4}. Numbered from the right, the chlorine is on C3 and the methyl on C5, set {3, 5}. The left numbering wins, giving 4-chloro-2-methylhexane.',
  caption: 'Same molecule, two numberings. Read the two sets term by term: 2 against 3 settles it at the first term.',
}, () => bothWays({ ...HEX_CL, verdict: { left: 'good', right: 'warn', name: '4-chloro-2-methylhexane' } })));

/* ------------------------------------------ common names of simple halides --- */
FIGURES.push({
  id: 'halide-common-names',
  section: 'naming-substituents',
  anchor: 'fig-halide-common-names',
  alt: 'Three alkyl halides with both names. Isopropyl bromide: a three-carbon chain with bromine on the middle carbon, 2-bromopropane. tert-Butyl chloride: a central carbon bearing three methyl carbons and a chlorine, 2-chloro-2-methylpropane. Ethyl iodide: a two-carbon chain with iodine on C1, iodoethane. In each the alkyl group is highlighted.',
  viewBox: '0 0 360 574',
  build() {
    let s = '';
    const num = (x, y, v) => numeral(x, y, v);
    const H = 178;
    const pan = (k, common, sys) => {
      const py = 12 + k * (H + 10);
      s += panel(PX, py, PW, H);
      s += text(CX, py + 24, common, { cls: 'fg-tag', size: 11 });
      s += text(CX, py + H - 14, sys, { cls: 'fg-lbl', size: 12.5 });
      return py;
    };
    // isopropyl bromide = 2-bromopropane
    {
      const py = pan(0, 'isopropyl bromide', '2-bromopropane');
      const c1 = P(CX - 40, py + 114), c2 = P(CX, py + 90), c3 = P(CX + 40, py + 114), br = P(CX, py + 54);
      s += sk(c1, c2, true) + sk(c2, c3, true) + bond(c2, br, { rFrom: 0, rTo: 15 }) + atom(br.x, br.y, 'Br');
      s += num(c1.x, c1.y + 22, '1') + num(c2.x, c2.y + 22, '2') + num(c3.x, c3.y + 22, '3');
    }
    // tert-butyl chloride = 2-chloro-2-methylpropane
    {
      const py = pan(1, 'tert-butyl chloride', '2-chloro-2-methylpropane');
      // Cl up; C1 lower left, C3 lower right, the methyl straight down
      const c2 = P(CX, py + 94), c1 = P(CX - 31, py + 112), c3 = P(CX + 31, py + 112), m = P(CX, py + 128), cl = P(CX, py + 54);
      s += sk(c1, c2, true) + sk(c2, c3, true) + sk(c2, m, true) + bond(c2, cl, { rFrom: 0, rTo: 15 }) + atom(cl.x, cl.y, 'Cl');
      s += num(c1.x - 12, c1.y + 5, '1') + num(c2.x + 14, c2.y - 2, '2') + num(c3.x + 12, c3.y + 5, '3');
      s += text(m.x + 8, m.y + 6, 'methyl', { cls: 'fg-sm', size: 10, anchor: 'start' });
    }
    // ethyl iodide = iodoethane
    {
      const py = pan(2, 'ethyl iodide', 'iodoethane');
      const c1 = P(CX, py + 96), c2 = P(CX + 40, py + 72), io = P(CX - 36, py + 74);
      s += sk(c1, c2, true) + bond(c1, io, { rFrom: 0, rTo: 15 }) + atom(io.x, io.y, 'I');
      s += num(c1.x, c1.y + 22, '1') + num(c2.x, c2.y + 22, '2');
    }
    return s;
  },
  caption: 'Each common name reads as the highlighted alkyl group, then the halide. The systematic name counts along the same carbons.',
});

/* --------------------------------------------- one number per group --- */
FIGURES.push(sized({
  id: 'dimethylpentane-pair',
  section: 'naming-substituents',
  lessons: ['naming-substituents'],
  anchor: 'fig-dimethylpentane-pair',
  alt: 'Two numbered pentanes. Top: both methyls on C2, named 2,2-dimethylpentane. Bottom: one methyl on C2 and one on C3, named 2,3-dimethylpentane.',
  caption: 'Two methyls each time, so two locants each time. Only the numbers show whether the methyls share a carbon.',
}, () => {
  const a = single({ n: 5, subs: [{ i: 1, kind: 'me', ang: -38, name: 'methyl' }, { i: 1, kind: 'me', ang: 38, name: 'methyl' }],
    name: '2,2-dimethylpentane', note: 'both methyls on C2: the 2 is written twice' });
  const b = single({ n: 5, subs: [{ i: 1, kind: 'me', name: 'methyl' }, { i: 2, kind: 'me', name: 'methyl' }],
    name: '2,3-dimethylpentane', note: 'one methyl on C2, one on C3' });
  return { svg: a.svg + `<g transform="translate(0 ${a.h - 4})">${b.svg}</g>`, h: a.h - 4 + b.h };
}));

/* ------------------------------------------ alphabetical order, drawn --- */
FIGURES.push(sized({
  id: 'alphabet-example',
  section: 'naming-substituents',
  lessons: ['naming-substituents'],
  anchor: 'fig-alphabet-example',
  alt: 'A hexane numbered from the left with two methyls on C2 and an ethyl on C4. The name 4-ethyl-2,2-dimethylhexane is written under it, with ethyl filed under e and dimethyl filed under m.',
  caption: 'The numbers come from the drawing. The order of the words comes from the alphabet, so the 4 is written before the 2,2.',
}, () => single({ n: 6, subs: [
  { i: 1, kind: 'me', ang: -38, name: 'methyl' }, { i: 1, kind: 'me', ang: 38, name: 'methyl' },
  { i: 3, kind: 'et', name: 'ethyl' },
], name: '4-ethyl-2,2-dimethylhexane', note: 'ethyl files under e, dimethyl under m' })));

/* ------------------------------------------------------------------ A2 ---
   Alphabetical order is the one rule in the section that produces a
   silently wrong answer, because a list sorted the obvious way still looks
   sorted. The same five names, filed by the letter you see and filed by the
   letter that counts. */
FIGURES.push({
  id: 'alphabetize-filing',
  section: 'naming-substituents',
  lessons: ['naming-substituents'],
  anchor: 'fig-alphabetize-filing',
  alt: 'Five substituent names with the letter each files under: tert-butyl under b, dimethyl under m, ethyl under e, isopropyl under i, cyclohexyl under c. Below, the same five sorted by the first letter printed (wrong) and by the letter each files under (right).',
  viewBox: '0 0 360 440',
  build() {
    let s = '';
    const rows = [
      { name: 'tert-butyl', rule: 'tert- is ignored', letter: 'b', counts: false },
      { name: 'dimethyl', rule: 'di- is ignored', letter: 'm', counts: false },
      { name: 'ethyl', rule: 'nothing to strip', letter: 'e', counts: true },
      { name: 'isopropyl', rule: 'iso is part of it', letter: 'i', counts: true },
      { name: 'cyclohexyl', rule: 'cyclo is part of it', letter: 'c', counts: true },
    ];
    s += tag(CX, 24, 'what each name files under');
    rows.forEach((r, k) => {
      const y = 58 + k * 38;
      s += text(24, y + 4, r.name, { cls: 'fg-lbl', size: 12, anchor: 'start' });
      s += text(262, y + 4, r.rule, { cls: r.counts ? 'fg-tag-good' : 'fg-tag-warn', size: 10, anchor: 'end' });
      s += atom(316, y, r.letter, { kind: 'hi', r: 14 });
    });
    s += rule(20, 250, 340, 250);
    const col = (x, heading, order, kind) => {
      s += text(x, 276, heading, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', size: 11 });
      order.forEach((nm, i) => { s += text(x - 62, 306 + i * 30, `${i + 1}. ${nm}`, { cls: 'fg-lbl', size: 12, anchor: 'start' }); });
    };
    col(96, 'wrong: first letter', ['cyclohexyl', 'dimethyl', 'ethyl', 'isopropyl', 'tert-butyl'], 'warn');
    col(268, 'right: filed letter', ['tert-butyl', 'cyclohexyl', 'ethyl', 'isopropyl', 'dimethyl'], 'good');
    return s;
  },
  caption: 'Five substituents, filed. Strip <i>di-</i> and <i>tert-</i> first, keep <i>iso</i> and <i>cyclo</i>, then sort.',
  note: 'Both lists look sorted. Only the right-hand one is correct: <i>tert</i>-butyl moves from last to first, and dimethyl from second to last.',
});

/* ------------------------------- three substituents, numbered both ways --- */
const HEPT3 = { n: 7, subs: [{ i: 1, kind: 'me', name: 'methyl' }, { i: 3, kind: 'et', name: 'ethyl' }, { i: 4, kind: 'X', name: 'Cl' }] };
FIGURES.push(sized({
  id: 'three-substituents-both-ways',
  section: 'naming-substituents',
  anchor: 'fig-three-substituents-both-ways',
  alt: 'The same heptane drawn twice with a methyl, an ethyl and a chlorine. Numbered from the left the substituents sit at {2, 4, 5}: methyl C2, ethyl C4, chlorine C5. Numbered from the right they sit at {3, 4, 6}. The left numbering wins, and the name is 5-chloro-4-ethyl-2-methylheptane.',
  caption: 'The first terms, 2 and 3, already differ, so the left numbering wins before the alphabet is consulted.',
}, () => bothWays({ ...HEPT3, verdict: { left: 'good', right: 'warn', name: '5-chloro-4-ethyl-2-methylheptane' } })));

/* ------------------------------------------ the one alphabet tie-break --- */
const HEPT_TIE = { n: 7, subs: [{ i: 2, kind: 'et', name: 'ethyl' }, { i: 4, kind: 'me', name: 'methyl' }] };
FIGURES.push(sized({
  id: 'alphabet-tie-break',
  section: 'naming-substituents',
  anchor: 'fig-alphabet-tie-break',
  alt: 'The same heptane drawn twice with an ethyl and a methyl. Numbered from the left, ethyl C3 and methyl C5. Numbered from the right, methyl C3 and ethyl C5. Both give {3, 5}, a tie, so ethyl, first in the alphabet, takes the 3: 3-ethyl-5-methylheptane.',
  caption: 'Both numberings give {3, 5}. Only here does the alphabet choose the direction: ethyl files before methyl, so ethyl takes the 3.',
}, () => bothWays({ ...HEPT_TIE, verdict: {
  left: 'good', right: 'tie', name: '3-ethyl-5-methylheptane',
  notes: { left: 'a tie, and ethyl (e) gets the 3', right: 'a tie, but methyl (m) would get the 3' },
} })));

/* ------------------------------------------------ complex substituents --- */
/* Three panels. The top branch is named the same way under every
   convention. The lower two are one molecule, its branch numbered in the
   classic style (attached carbon = C1) and in the IUPAC 2013 style (longest
   chain, attached carbon as low as it can go). */
FIGURES.push(sized({
  id: 'complex-substituent',
  section: 'naming-substituents',
  lessons: ['naming-substituents'],
  anchor: 'fig-complex-substituent',
  alt: 'Three nonanes, each with a four-carbon branch on C5, the branch carbons numbered in green. Top: the branch attaches through the end of a three-carbon chain whose middle carbon carries a methyl; numbered 1, 2, 3 from the attached carbon, it is 2-methylpropyl in both styles, giving 5-(2-methylpropyl)nonane. Middle: a branch attached through a carbon that carries a methyl and an ethyl, numbered in the classic style with the attached carbon as 1 and the chain running along the ethyl: 5-(1-methylpropyl)nonane. Bottom: the same molecule numbered in the IUPAC 2013 style, along the whole four-carbon chain with the attached carbon as 2: 5-(butan-2-yl)nonane.',
  caption: 'Black numbers count the parent chain. Green numbers count the branch, and they are the ones written inside the parentheses. The lower two drawings are one molecule, named in the two styles.',
}, () => {
  const part = (kind, head, name, note) => {
    const sub = [{ i: 4, kind }];
    const { up, down } = extents(sub);
    const y0 = 12 + 42 + up;
    let s = tag(CX, 36, head);
    s += chain(CX - 4 * 38, y0, 9, sub, { from: 'left', dx: 38 });
    const nameY = y0 + down + 26;
    s += text(CX, nameY, name, { cls: 'fg-lbl', size: 13 }) + text(CX, nameY + 20, note, { cls: 'fg-sm', size: 10 });
    const Hp = nameY + 32 - 12;
    return { svg: panel(PX, 12, PW, Hp) + s, h: Hp + 22 };
  };
  const parts = [
    part('ibu', 'attached at the end of its chain: both styles', '5-(2-methylpropyl)nonane', 'the attached carbon is C1 either way'),
    part('sbuC', 'attached mid-chain, classic style', '5-(1-methylpropyl)nonane', 'the attached carbon is always C1'),
    part('sbu', 'the same branch, IUPAC 2013 style', '5-(butan-2-yl)nonane', 'longest chain; attached carbon as low as it goes: 2'),
  ];
  let svg = '', h = 0;
  for (const q of parts) { svg += `<g transform="translate(0 ${h})">${q.svg}</g>`; h += q.h - 8; }
  return { svg, h: h + 8 };
}));

/* ============================== lesson-only figures ============================== */

FIGURES.push(sized({
  id: 'q-dimethylhexane',
  lessons: ['naming-substituents'],
  alt: 'A hexane numbered 1 to 6 from the left, with two methyl groups on C3.',
  caption: 'The molecule the student tried to name. Count the methyls, then count the numbers in the name.',
}, () => single({ n: 6, subs: [{ i: 2, kind: 'me', ang: -38, name: 'methyl' }, { i: 2, kind: 'me', ang: 38, name: 'methyl' }] })));

FIGURES.push(sized({
  id: 'lesson-bromo-both-ways',
  lessons: ['naming-substituents'],
  alt: 'The same pentane drawn twice with a methyl and a bromine. Numbered from the left, methyl C2 and bromine C3, set {2, 3}. Numbered from the right, bromine C3 and methyl C4, set {3, 4}. The left numbering wins: 3-bromo-2-methylpentane.',
  caption: 'Bromo comes first in the alphabet, yet it gets the higher number. The numbers were settled by {2, 3} beating {3, 4}.',
}, () => bothWays({ n: 5, subs: [{ i: 1, kind: 'me', name: 'methyl' }, { i: 2, kind: 'X', name: 'Br' }],
  verdict: { left: 'good', right: 'warn', name: '3-bromo-2-methylpentane' } })));

FIGURES.push(sized({
  id: 'q-heptane-both-ways',
  lessons: ['naming-substituents'],
  alt: 'A heptane with a methyl, an ethyl and a chlorine, drawn twice. Numbered from the left the substituents sit at {2, 4, 5}, with chlorine on C5. Numbered from the right they sit at {3, 4, 6}.',
  caption: 'One heptane, numbered from each end.',
}, () => bothWays({ ...HEPT3 })));

FIGURES.push(sized({
  id: 'q-heptane-numbered',
  lessons: ['naming-substituents'],
  alt: 'A heptane numbered 1 to 7 from the left, with a methyl on C2, an ethyl on C4 and a chlorine on C5.',
  caption: 'The numbering is already settled: C1 is at the left end.',
}, () => single({ ...HEPT3 })));

FIGURES.push(sized({
  id: 'lesson-tie-both-ways',
  lessons: ['naming-substituents'],
  alt: 'The same pentane drawn twice with a bromine and a methyl. Numbered from the left, bromine C2 and methyl C4. Numbered from the right, methyl C2 and bromine C4. Both give {2, 4}, a tie, so bromo, first in the alphabet, takes the 2: 2-bromo-4-methylpentane.',
  caption: 'Both numberings give {2, 4}, so the structure cannot choose. Bromo files before methyl and takes the 2.',
}, () => bothWays({ n: 5, subs: [{ i: 1, kind: 'X', name: 'Br' }, { i: 3, kind: 'me', name: 'methyl' }],
  verdict: { left: 'good', right: 'tie', name: '2-bromo-4-methylpentane',
    notes: { left: 'a tie, and bromo (b) gets the 2', right: 'a tie, but methyl (m) would get the 2' } } })));

FIGURES.push(sized({
  id: 'q-decane-branch',
  lessons: ['naming-substituents'],
  alt: 'An unnumbered ten-carbon chain with one branch on its fifth carbon from the left: the branch is a CH2 attached to the chain, then a carbon carrying a methyl, then one more carbon.',
  caption: 'A ten-carbon parent chain with one branch. Number the chain yourself, then name the branch.',
}, () => single({ n: 10, subs: [{ i: 4, kind: 'ibu' }], from: null, names: false, branchNums: false, dx: 34 })));

FIGURES.push(sized({
  id: 'q-tie-heptane',
  lessons: ['naming-substituents'],
  alt: 'A heptane with an ethyl and a methyl, drawn twice. Numbered from the left, ethyl C3 and methyl C5. Numbered from the right, methyl C3 and ethyl C5.',
  caption: 'One heptane, numbered from each end.',
}, () => bothWays({ ...HEPT_TIE })));

/* sec- and tert- are italic in print, and the filing rule depends on it, so
   every sec/tert in a drawing is set in an italic tspan. */
const italicPrefixes = (svg) => svg.replace(/(<text[^>]*>[^<]*?)\b(sec|tert)-/g, '$1<tspan font-style="italic">$2</tspan>-');
for (const def of FIGURES) { const b = def.build; def.build = () => italicPrefixes(b.call(def)); }

export default FIGURES;
