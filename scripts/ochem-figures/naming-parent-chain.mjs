/* Figures for the naming-parent-chain notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure here that chooses a chain or numbers one draws the skeleton,
   highlights the parent and numbers every parent carbon. The locant numbers
   are placed by `nums` below, which puts each number in the widest open gap
   between the bonds at its carbon, so no number can land on a bond. */
import { bond, text, tag, panel, rule, P } from '../lib/ochem-figure.mjs';
import { zig, ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ----------------------------------------------------------- helpers --- */

/* A skeleton: `nodes` maps a key to a point (a point with `lbl` is a
   heteroatom drawn as text, and bonds stop short of it). `bonds` is a list of
   [a, b] or [a, b, { order: 2, inward }] pairs. `path` is the parent chain as
   an ordered list of keys; its bonds are drawn highlighted. */
function skel(nodes, bonds, path = []) {
  const onPath = new Set();
  for (let i = 0; i + 1 < path.length; i++) onPath.add([path[i], path[i + 1]].sort().join('|'));
  let s = '';
  const draw = (hi) => {
    for (const [a, b, o = {}] of bonds) {
      const isHi = onPath.has([a, b].sort().join('|'));
      if (hi && !isHi) continue;
      const cls = hi ? 'fg-bond-hi' : 'fg-bond';
      const A = nodes[a], B = nodes[b];
      if (o.order === 2) s += ringDouble(A, B, o.inward, { cls, inset: 6, gap: 5 });
      else s += bond(A, B, { rFrom: A.lbl ? 11 : 0, rTo: B.lbl ? 11 : 0, cls });
    }
  };
  draw(false);
  draw(true);
  for (const k of Object.keys(nodes)) {
    const p = nodes[k];
    if (p.lbl) s += text(p.x, p.y + 4.5, p.lbl, { cls: 'fg-lbl', size: 13 });
  }
  return s;
}

/* The direction (unit vector) of the widest gap between the bonds at `k`. */
function freeDir(nodes, bonds, k) {
  const p = nodes[k];
  const angs = [];
  for (const [a, b] of bonds) {
    const o = a === k ? b : b === k ? a : null;
    if (o) angs.push(Math.atan2(nodes[o].y - p.y, nodes[o].x - p.x));
  }
  if (!angs.length) return { x: 0, y: -1 };
  if (angs.length === 1) return { x: -Math.cos(angs[0]), y: -Math.sin(angs[0]) };
  angs.sort((u, v) => u - v);
  let best = -1, mid = 0;
  for (let i = 0; i < angs.length; i++) {
    const a0 = angs[i], a1 = i + 1 < angs.length ? angs[i + 1] : angs[0] + 2 * Math.PI;
    if (a1 - a0 > best) { best = a1 - a0; mid = (a0 + a1) / 2; }
  }
  return { x: Math.cos(mid), y: Math.sin(mid) };
}

/* Locant numbers: `map` is { key: '1', ... }. `force` overrides the direction
   for a key when the widest gap is not the best place (rare). */
function nums(nodes, bonds, map, opts = {}) {
  const d = opts.d ?? 16;
  let s = '';
  for (const [k, v] of Object.entries(map)) {
    const u = (opts.force && opts.force[k]) || freeDir(nodes, bonds, k);
    const p = nodes[k];
    s += text(p.x + u.x * d, p.y + u.y * d + 4.5, v, { cls: opts.cls || 'fg-lbl', size: 13 });
  }
  return s;
}

/* A word label next to carbon `k`, pushed out along the free direction and
   anchored so it grows away from the carbon. */
function note(nodes, bonds, k, words, opts = {}) {
  const u = opts.dir || freeDir(nodes, bonds, k);
  const d = opts.d ?? 12;
  const p = nodes[k];
  const anchor = u.x > 0.35 ? 'start' : u.x < -0.35 ? 'end' : 'middle';
  const dy = u.y > 0.35 ? 12 : u.y < -0.35 ? -4 : 4;
  return text(p.x + u.x * d, p.y + u.y * d + dy, words, { cls: 'fg-sm', size: 10.5, anchor });
}

/* Bond length. Wide notes-only figures use 40; the figures the lesson also
   shows use LN, and set it at the top of build(). */
let L = 40;
const LN = 36;
const DX = () => L * 0.865;                     // horizontal step of a zigzag bond
const DY = () => L * 0.5;                       // vertical step of a zigzag bond
const up = (p, f = 1) => P(p.x, p.y - L * f);
const down = (p, f = 1) => P(p.x, p.y + L * f);
const off = (p, dx, dy) => P(p.x + dx, p.y + dy);
const diag = (p, sx, sy) => P(p.x + sx * DX(), p.y + sy * DY());

/* Layout for figures the lesson shows: 340 wide, one full-width panel per
   row, so a 420px phone never scrolls them sideways. */
const W = 340, CX = 170, PX = 10, PW = 320;

/* A straight chain as nodes c1..cn plus its bonds. */
function chain(x0, y0, n, prefix = 'c') {
  const pts = zig(x0, y0, n, DX(), DY());
  const nodes = {};
  const bonds = [];
  pts.forEach((p, i) => { nodes[prefix + (i + 1)] = p; if (i) bonds.push([prefix + i, prefix + (i + 1)]); });
  return { nodes, bonds, keys: pts.map((_, i) => prefix + (i + 1)) };
}

/* Three lines under a panel: what was counted, the name, a short verdict. */
function verdict(cx, y, sub, name, good, why) {
  let s = '';
  s += text(cx, y, sub, { cls: 'fg-sm', size: 10.5 });
  s += text(cx, y + 22, name, { cls: good ? 'fg-tag-good' : 'fg-tag-warn', size: 11 });
  if (why) s += text(cx, y + 42, why, { cls: 'fg-sm', size: 10.5 });
  return s;
}

/* Figures the lesson also shows are drawn 340 wide with their panels
   stacked (see W above). The notes-only figures keep the wide layout. */

/* ------------------------------------------------------------ anatomy ---
   The opening paragraph splits 2-methylbutan-1-ol into prefix, root and
   suffix. Drawing it shows where the 2 and the 1 actually are. */
FIGURES.push({
  id: 'name-anatomy',
  section: 'naming-parent-chain',
  lessons: ['naming-parent-chain'],
  anchor: '<h3>The roots: ten words that do most of the work</h3>',
  alt: 'Skeletal structure of 2-methylbutan-1-ol with its four-carbon parent chain highlighted and numbered 1 to 4 from the carbon bearing OH, a methyl on carbon 2. Below it the name is split into four boxes: 2-methyl, the prefix, a methyl on C2; but, the root, four carbons; an, the bond type, all single; -1-ol, the suffix, OH on C1.',
  viewBox: `0 0 ${W} 385`,
  build() {
    L = LN;
    let s = '';
    s += tag(CX, 24, 'the molecule');
    s += panel(PX, 34, PW, 150, { kind: 'hi' });
    const m = chain(CX - DX(), 130, 4);
    const n = m.nodes;
    n.o = { ...diag(n.c1, -1, -1), lbl: 'HO' };
    n.me = up(n.c2);
    const bonds = [...m.bonds, ['c1', 'o'], ['c2', 'me']];
    s += skel(n, bonds, m.keys);
    s += nums(n, bonds, { c1: '1', c2: '2', c3: '3', c4: '4' });
    s += note(n, bonds, 'me', 'methyl', { dir: { x: 1, y: 0 }, d: 8 });
    s += text(CX, 172, 'parent chain: four carbons', { cls: 'fg-sm', size: 10.5 });

    s += tag(CX, 214, 'the name, piece by piece');
    const boxes = [
      { t: '2-methyl', a: 'prefix', b: 'methyl', c: 'on C2' },
      { t: 'but', a: 'root', b: 'four', c: 'carbons' },
      { t: 'an', a: 'bond type', b: 'all', c: 'single' },
      { t: '-1-ol', a: 'suffix', b: 'OH', c: 'on C1' },
    ];
    boxes.forEach((bx, i) => {
      const x = PX + i * 82;
      s += panel(x, 224, 74, 104, { kind: i === 1 ? 'good' : undefined });
      s += text(x + 37, 250, bx.t, { cls: 'fg-lbl', size: 13 });
      s += rule(x + 8, 262, x + 66, 262);
      s += text(x + 37, 280, bx.a, { cls: 'fg-tag', size: 11 });
      s += text(x + 37, 298, bx.b, { cls: 'fg-sm', size: 10.5 });
      s += text(x + 37, 314, bx.c, { cls: 'fg-sm', size: 10.5 });
    });
    s += text(CX, 354, '2-methylbutan-1-ol', { cls: 'fg-tag-good', size: 11 });
    s += text(CX, 374, 'branch, chain length, bonds, group', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Match each number in the name to a carbon in the drawing. The 2 in <i>2-methyl</i> points at C2, where the methyl hangs. The 1 in <i>-1-ol</i> points at C1, which carries the OH.',
});

/* --------------------------------------------------------- A1 (redrawn) ---
   Rule 1's trap: the longest chain is not the row across the page. One
   skeleton, traced twice. 4-methylheptane: a five-carbon row with a
   three-carbon branch on its second carbon. */
function heptaneSkeleton(x0, y0) {
  const m = chain(x0, y0, 5, 'r');
  const n = m.nodes;
  n.b1 = up(n.r2);
  n.b2 = diag(n.b1, -1, -1);
  n.b3 = up(n.b2);
  const bonds = [...m.bonds, ['r2', 'b1'], ['b1', 'b2'], ['b2', 'b3']];
  return { n, bonds };
}
FIGURES.push({
  id: 'parent-chain-trace',
  section: 'naming-parent-chain',
  lessons: ['naming-parent-chain'],
  anchor: 'That is Rule 1.',
  alt: 'One eight-carbon skeleton traced twice. Top: the five-carbon row across the page is highlighted and numbered 1 to 5, leaving a three-carbon branch on carbon 2; this gives the wrong name 2-propylpentane. Bottom: the seven-carbon path that runs down the branch and along the row is highlighted and numbered 1 to 7, leaving one methyl on carbon 4; this gives the correct name 4-methylheptane.',
  viewBox: `0 0 ${W} 580`,
  build() {
    L = LN;
    let s = '';
    const x0 = CX - 2 * DX();
    s += tag(CX, 24, 'the row across the page');
    s += panel(PX, 34, PW, 180, { kind: 'warn' });
    {
      const { n, bonds } = heptaneSkeleton(x0, 188);
      s += skel(n, bonds, ['r1', 'r2', 'r3', 'r4', 'r5']);
      s += nums(n, bonds, { r1: '1', r2: '2', r3: '3', r4: '4', r5: '5' });
      s += note(n, bonds, 'b2', 'three-carbon branch', { dir: { x: 1, y: 0 }, d: 40 });
      s += verdict(CX, 236, 'five in the row, three left over', '2-propylpentane', false, 'wrong: a longer chain exists');
    }
    s += tag(CX, 310, 'the path that turns a corner');
    s += panel(PX, 320, PW, 180, { kind: 'hi' });
    {
      const { n, bonds } = heptaneSkeleton(x0, 474);
      s += skel(n, bonds, ['b3', 'b2', 'b1', 'r2', 'r3', 'r4', 'r5']);
      s += nums(n, bonds, { b3: '1', b2: '2', b1: '3', r2: '4', r3: '5', r4: '6', r5: '7' });
      s += note(n, bonds, 'r1', 'methyl', { dir: { x: -1, y: 0.2 }, d: 10 });
      s += verdict(CX, 522, 'seven on the path, one left over', '4-methylheptane', true, 'right: nothing longer runs through it');
    }
    return s;
  },
  caption: 'The same eight carbons in both panels. Both traces are legal chains; the question is which is longer. In the top panel the highlighted bonds stop at five; in the bottom one they climb the branch and run along the row for seven. The carbon left over at the bottom is the methyl on C4.',
});

/* ---------------------------------------------------------------- N1 ---
   Three look-alike drawings: the row is the parent; the ethyl is the corner
   the parent turns; every route ties. Numbers are placed by `nums`, which
   keeps the middle panel's "2" off the ethyl bond. */
FIGURES.push({
  id: 'ethyl-branch-three-ways',
  section: 'naming-parent-chain',
  anchor: '<div class="notes-example">',
  alt: 'Three branched alkanes side by side. A six-carbon row with a methyl on the third carbon, where the row is the parent and the name is 3-methylhexane. A four-carbon row with an ethyl on the second carbon, where the longest path turns into the ethyl and the name is 3-methylpentane. A five-carbon row with an ethyl on the middle carbon, where every route is five carbons and the name is 3-ethylpentane.',
  viewBox: '0 0 720 330',
  build() {
    L = 40;
    let s = '';
    const head = (x, kind, heading) => { s += panel(x, 34, 224, 200, { kind }); s += tag(x + 112, 24, heading); };

    // A. 3-methylhexane: the row is the parent.
    {
      const x = 12; head(x, 'hi', 'the row is the parent');
      const m = chain(x + 26, 150, 6);
      const n = m.nodes;
      n.me = down(n.c3);
      const bonds = [...m.bonds, ['c3', 'me']];
      s += skel(n, bonds, m.keys);
      s += nums(n, bonds, { c1: '1', c2: '2', c3: '3', c4: '4', c5: '5', c6: '6' });
      s += note(n, bonds, 'me', 'methyl', { dir: { x: 1, y: 0 }, d: 8 });
      s += verdict(x + 112, 258, 'six in the row, nothing longer', '3-methylhexane', true, 'the methyl is a real branch');
    }
    // B. Four-carbon row with an ethyl on its C2: the ethyl is the corner.
    {
      const x = 248; head(x, 'warn', 'the row is not the parent');
      const m = chain(x + 60, 190, 4, 'r');
      const n = m.nodes;
      n.e1 = up(n.r2);
      n.e2 = diag(n.e1, 1, -1);
      const bonds = [...m.bonds, ['r2', 'e1'], ['e1', 'e2']];
      s += skel(n, bonds, ['e2', 'e1', 'r2', 'r3', 'r4']);
      s += nums(n, bonds, { e2: '1', e1: '2', r2: '3', r3: '4', r4: '5' });
      s += note(n, bonds, 'r1', 'methyl', { dir: { x: -0.6, y: 0.8 }, d: 10 });
      s += verdict(x + 112, 258, 'row four; through the ethyl, five', '3-methylpentane', true, '"2-ethylbutane" names the drawing');
    }
    // C. Five-carbon row with an ethyl on its C3: every route is five.
    {
      const x = 484; head(x, 'hi', 'every route ties');
      const m = chain(x + 43, 130, 5);
      const n = m.nodes;
      n.e1 = down(n.c3);
      n.e2 = diag(n.e1, 1, 1);
      const bonds = [...m.bonds, ['c3', 'e1'], ['e1', 'e2']];
      s += skel(n, bonds, m.keys);
      s += nums(n, bonds, { c1: '1', c2: '2', c3: '3', c4: '4', c5: '5' });
      s += note(n, bonds, 'e2', 'ethyl', { dir: { x: 1, y: 0 }, d: 8 });
      s += verdict(x + 112, 258, 'row five, either corner five', '3-ethylpentane', true, 'the ethyl is a real ethyl');
    }
    return s;
  },
  caption: 'The highlighted bonds are the parent in each drawing. Only in the middle one does the parent leave the row, and there it climbs through the ethyl.',
});

/* --------------------------------------------------------- tie (new) ---
   When two chains tie in length, take the one with more substituents.
   3-ethyl-2-methylheptane, not 3-isopropylheptane: one skeleton, two
   seven-carbon parents. */
function tieSkeleton(x0, y0) {
  const m = chain(x0, y0, 7, 'a');
  const n = m.nodes;
  n.i1 = down(n.a3);
  n.m1 = diag(n.i1, -1, 1);
  n.m2 = diag(n.i1, 1, 1);
  const bonds = [...m.bonds, ['a3', 'i1'], ['i1', 'm1'], ['i1', 'm2']];
  return { n, bonds };
}
FIGURES.push({
  id: 'tie-more-substituents',
  section: 'naming-parent-chain',
  lessons: ['naming-parent-chain'],
  anchor: 'The second path is the parent',
  alt: 'One ten-carbon skeleton traced two ways, both seven carbons long. Top: the seven-carbon row, numbered 1 to 7, carries one three-carbon branch attached by its middle carbon at carbon 3; the name would be 3-isopropylheptane, marked as not chosen. Bottom: a seven-carbon path that starts at one end of that branch, numbered 1 to 7, carries a methyl on carbon 2 and an ethyl on carbon 3; the name is 3-ethyl-2-methylheptane, marked as the parent.',
  viewBox: `0 0 ${W} 545`,
  build() {
    L = LN;
    let s = '';
    const x0 = CX - 3 * DX();
    s += tag(CX, 24, 'seven carbons, one substituent');
    s += panel(PX, 34, PW, 164, { kind: 'warn' });
    {
      const { n, bonds } = tieSkeleton(x0, 100);
      s += skel(n, bonds, ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7']);
      s += nums(n, bonds, { a1: '1', a2: '2', a3: '3', a4: '4', a5: '5', a6: '6', a7: '7' });
      s += text(CX, 186, 'one branch, attached by its middle carbon', { cls: 'fg-sm', size: 10.5 });
      s += verdict(CX, 220, 'one substituent (isopropyl)', '3-isopropylheptane', false, 'not chosen');
    }
    s += tag(CX, 294, 'seven carbons, two substituents');
    s += panel(PX, 304, PW, 164, { kind: 'hi' });
    {
      const { n, bonds } = tieSkeleton(x0, 370);
      s += skel(n, bonds, ['m1', 'i1', 'a3', 'a4', 'a5', 'a6', 'a7']);
      s += nums(n, bonds, { m1: '1', i1: '2', a3: '3', a4: '4', a5: '5', a6: '6', a7: '7' });
      s += note(n, bonds, 'm2', 'methyl', { dir: { x: 1, y: 0 }, d: 8 });
      s += note(n, bonds, 'a1', 'ethyl', { dir: { x: 0, y: -1 }, d: 12 });
      s += verdict(CX, 490, 'two substituents: ethyl and methyl', '3-ethyl-2-methylheptane', true, 'the parent');
    }
    return s;
  },
  caption: 'Count the highlighted carbons in each panel: seven and seven. Then count what is left hanging off each chain. The bottom chain leaves two branches, so it is the parent. Starting from the other end of the three-carbon branch gives the same name.',
});

/* ------------------------------------------- numbering direction (new) ---
   3-methylhexane numbered from each end. */
FIGURES.push({
  id: 'number-both-ways',
  section: 'naming-parent-chain',
  lessons: ['naming-parent-chain'],
  anchor: 'That is Rule 2.',
  alt: 'The same 3-methylhexane skeleton numbered twice. Top, numbered from the left end: the methyl sits on carbon 3. Bottom, numbered from the right end: the methyl sits on carbon 4. The left numbering wins because 3 is lower than 4.',
  viewBox: `0 0 ${W} 485`,
  build() {
    L = LN;
    let s = '';
    const one = (py, fromLeft) => {
      s += tag(CX, py - 10, fromLeft ? 'numbered from the left end' : 'numbered from the right end');
      s += panel(PX, py, PW, 134, { kind: fromLeft ? 'hi' : 'warn' });
      const m = chain(CX - 2.5 * DX(), py + 62, 6);
      const n = m.nodes;
      n.me = down(n.c3);
      const bonds = [...m.bonds, ['c3', 'me']];
      s += skel(n, bonds, m.keys);
      const map = {};
      m.keys.forEach((k, i) => { map[k] = String(fromLeft ? i + 1 : 6 - i); });
      s += nums(n, bonds, map);
      s += note(n, bonds, 'me', 'methyl', { dir: { x: 1, y: 0 }, d: 8 });
      s += verdict(CX, py + 156, fromLeft ? 'methyl on C3' : 'methyl on C4', fromLeft ? '3-methylhexane' : '4-methylhexane', fromLeft, fromLeft ? '3 is lower: use this' : '4 is higher: reject');
    };
    one(34, true);
    one(274, false);
    return s;
  },
  caption: 'One molecule, two directions. The methyl is the only thing that needs a number, so compare its two locants: 3 from the left, 4 from the right.',
});

/* A straight chain carrying methyls at the listed carbons (numbered from
   the left), each drawn on the open side of its carbon. */
function methylChain(x0, y0, len, at) {
  const m = chain(x0, y0, len);
  const n = m.nodes;
  const bonds = [...m.bonds];
  for (const i of at) {
    const k = 'c' + i;
    n['s' + i] = i % 2 === 0 ? up(n[k]) : down(n[k]);
    bonds.push([k, 's' + i]);
  }
  return { m, n, bonds };
}
/* A locant set with one term coloured, drawn as one line of text. */
const setLine = (cx, y, terms, at, cls) =>
  `<text class="fg-lbl" x="${cx}" y="${y}" text-anchor="middle" font-size="13">{` +
  terms.map((t, i) => (i === at ? `<tspan class="${cls}">${t}</tspan>` : String(t))).join(', ') +
  `}</text>`;

/* ----------------------------------------- first point of difference ---
   2,3,6-trimethylheptane: {2,3,6} from the left against {2,5,6} from the
   right. The sets agree at the first term and differ at the second. */
FIGURES.push({
  id: 'first-point-of-difference',
  section: 'naming-parent-chain',
  lessons: ['naming-parent-chain'],
  anchor: 'The sets agree at the first term',
  alt: 'The same 2,3,6-trimethylheptane skeleton numbered twice. From the left the three methyls sit on carbons 2, 3 and 6. From the right they sit on carbons 2, 5 and 6. The two sets agree at the first term, 2, and differ at the second, 3 against 5, so the left numbering wins.',
  viewBox: `0 0 ${W} 505`,
  build() {
    L = LN;
    let s = '';
    const one = (py, fromLeft) => {
      s += tag(CX, py - 10, fromLeft ? 'numbered from the left' : 'numbered from the right');
      s += panel(PX, py, PW, 144, { kind: fromLeft ? 'hi' : 'warn' });
      const { m, n, bonds } = methylChain(CX - 3 * DX(), py + 82, 7, [2, 3, 6]);
      s += skel(n, bonds, m.keys);
      const map = {};
      m.keys.forEach((k, i) => { map[k] = String(fromLeft ? i + 1 : 7 - i); });
      s += nums(n, bonds, map);
      s += setLine(CX, py + 170, fromLeft ? [2, 3, 6] : [2, 5, 6], 1, fromLeft ? 'fg-hi' : 'fg-warn');
      s += text(CX, py + 192, fromLeft ? '2,3,6-trimethylheptane' : 'not 2,5,6-trimethylheptane', { cls: fromLeft ? 'fg-tag-good' : 'fg-tag-warn', size: 11 });
    };
    one(34, true);
    one(276, false);
    s += text(CX, 496, 'first terms tie; at the second, 3 beats 5', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Read the two sets one term at a time, left to right. Stop at the first place they differ. That term decides the numbering; the terms after it do not matter.',
});

/* ------------------------------------------------------ sum trap (new) ---
   2,7,8-trimethyldecane: the first point of difference and the sum pick
   opposite directions. A ten-carbon chain is the widest drawing here, so
   its bonds are drawn a little shorter to fit the phone width. */
FIGURES.push({
  id: 'sum-is-not-the-rule',
  section: 'naming-parent-chain',
  lessons: ['naming-parent-chain'],
  anchor: 'Counted from the left, the decane',
  alt: 'A 2,7,8-trimethyldecane skeleton numbered twice. From the left the methyls sit on carbons 2, 7 and 8, which add up to 17. From the right they sit on 3, 4 and 9, which add up to 16. The lower sum points to the right-hand numbering, but the first point of difference, 2 against 3, picks the left, and the left is correct.',
  viewBox: `0 0 ${W} 505`,
  build() {
    L = 32;
    let s = '';
    const one = (py, fromLeft) => {
      s += tag(CX, py - 10, fromLeft ? 'numbered from the left' : 'numbered from the right');
      s += panel(PX, py, PW, 128, { kind: fromLeft ? 'hi' : 'warn' });
      const { m, n, bonds } = methylChain(CX - 4.5 * DX(), py + 74, 10, [2, 7, 8]);
      s += skel(n, bonds, m.keys);
      const map = {};
      m.keys.forEach((k, i) => { map[k] = String(fromLeft ? i + 1 : 10 - i); });
      s += nums(n, bonds, map);
      s += setLine(CX, py + 152, fromLeft ? [2, 7, 8] : [3, 4, 9], 0, fromLeft ? 'fg-hi' : 'fg-warn');
      s += text(CX, py + 172, fromLeft ? 'adds to 17' : 'adds to 16', { cls: 'fg-sm', size: 10.5 });
    };
    one(34, true);
    one(250, false);
    s += text(CX, 450, 'lower sum points right; first term points left', { cls: 'fg-sm', size: 10.5 });
    s += text(CX, 474, '2,7,8-trimethyldecane', { cls: 'fg-tag-good', size: 11 });
    s += text(CX, 494, 'the first term decides', { cls: 'fg-sm', size: 10.5 });
    L = LN;
    return s;
  },
  caption: 'Compare the first terms: 2 against 3. The left numbering wins there, even though its locants add up to more.',
});

/* ----------------------------------------------- locant placement (new) ---
   Where the locant goes in the name: right before the part it numbers. */
FIGURES.push({
  id: 'locant-before-its-part',
  section: 'naming-parent-chain',
  lessons: ['naming-parent-chain'],
  anchor: 'Older books write the same two compounds',
  alt: 'Two four-carbon chains, each numbered 1 to 4. Butan-1-ol carries OH on carbon 1; the 1 sits just before -ol in the name, and the older name is 1-butanol. But-2-ene has a double bond from carbon 2 to carbon 3; the 2 sits just before -ene, and the older name is 2-butene.',
  viewBox: `0 0 ${W} 410`,
  build() {
    L = LN;
    let s = '';
    s += tag(CX, 24, 'an OH on C1');
    s += panel(PX, 34, PW, 100, { kind: 'hi' });
    {
      const m = chain(CX - DX(), 96, 4);
      const n = m.nodes;
      n.o = { ...diag(n.c1, -1, -1), lbl: 'HO' };
      const bonds = [...m.bonds, ['c1', 'o']];
      s += skel(n, bonds, m.keys);
      s += nums(n, bonds, { c1: '1', c2: '2', c3: '3', c4: '4' });
      s += text(CX, 156, 'butan-1-ol', { cls: 'fg-tag-good', size: 11 });
      s += text(CX, 176, 'the 1 sits right before -ol', { cls: 'fg-sm', size: 10.5 });
      s += text(CX, 194, 'older style: 1-butanol', { cls: 'fg-sm', size: 10.5 });
    }
    s += tag(CX, 228, 'a C=C from C2 to C3');
    s += panel(PX, 238, PW, 100, { kind: 'hi' });
    {
      const m = chain(CX - 1.5 * DX(), 300, 4);
      const n = m.nodes;
      const bonds = [['c1', 'c2'], ['c2', 'c3', { order: 2, inward: P((n.c2.x + n.c3.x) / 2 - 8, 330) }], ['c3', 'c4']];
      s += skel(n, bonds, m.keys);
      s += nums(n, bonds, { c1: '1', c2: '2', c3: '3', c4: '4' });
      s += text(CX, 360, 'but-2-ene', { cls: 'fg-tag-good', size: 11 });
      s += text(CX, 380, 'the 2 sits right before -ene', { cls: 'fg-sm', size: 10.5 });
      s += text(CX, 398, 'older style: 2-butene', { cls: 'fg-sm', size: 10.5 });
    }
    return s;
  },
  caption: 'In each name, find the number, then look at the word part right after it. That part is what sits on the numbered carbon.',
});

/* ------------------------------------------ what carries forward (new) ---
   The parent must contain the principal group, even at the cost of length:
   2-ethylpentan-1-ol, not a hydroxymethylhexane. */
FIGURES.push({
  id: 'parent-contains-oh',
  section: 'naming-parent-chain',
  anchor: 'So a functional group outranks',
  alt: 'One alcohol traced two ways. Left: the six-carbon chain, the longest in the molecule, is highlighted and numbered 1 to 6, but the CH2OH hangs off carbon 3 and is not on the chain; this is marked as not the parent. Right: a five-carbon chain that starts at the carbon bearing OH is highlighted and numbered 1 to 5, with an ethyl on carbon 2; the name is 2-ethylpentan-1-ol.',
  viewBox: '0 0 720 255',
  build() {
    L = 40;
    let s = '';
    const sk6 = (x0) => {
      const m = chain(x0, 100, 6, 'a');
      const n = m.nodes;
      n.c = down(n.a3);
      n.o = { ...diag(n.c, 1, 1), lbl: 'OH' };
      return { n, bonds: [...m.bonds, ['a3', 'c'], ['c', 'o']] };
    };
    s += panel(12, 34, 336, 150, { kind: 'warn' });
    s += tag(180, 24, 'the longest chain');
    {
      const { n, bonds } = sk6(94);
      s += skel(n, bonds, ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']);
      s += nums(n, bonds, { a1: '1', a2: '2', a3: '3', a4: '4', a5: '5', a6: '6' });
      s += verdict(180, 210, 'six carbons, but the OH is off the chain', 'not the parent', false);
    }
    s += panel(372, 34, 336, 150, { kind: 'hi' });
    s += tag(540, 24, 'the longest chain that holds the OH');
    {
      const { n, bonds } = sk6(454);
      s += skel(n, bonds, ['c', 'a3', 'a4', 'a5', 'a6']);
      s += nums(n, bonds, { c: '1', a3: '2', a4: '3', a5: '4', a6: '5' });
      s += note(n, bonds, 'a1', 'ethyl', { dir: { x: 0, y: -1 }, d: 12 });
      s += verdict(540, 210, 'five carbons, OH on C1, ethyl on C2', '2-ethylpentan-1-ol', true);
    }
    return s;
  },
  caption: 'Find the OH first, then the longest chain that includes its carbon. That chain is one carbon shorter than the row on the left, and it is still the parent.',
});

/* ===================================================== lesson-only =====
   Lesson question figures. Like every figure the lesson shows, they are
   drawn 340 wide with stacked panels so nothing scrolls sideways on a
   phone. */

/* Step 5 question: two eight-carbon paths through one skeleton (octane
   with a sec-butyl on C4). Path B, 3-methyl-4-propyloctane, carries two
   substituents; path A carries one. The figure names neither. */
function octSkeleton(x0, y0) {
  const m = chain(x0, y0, 8, 'a');
  const n = m.nodes;
  n.s1 = up(n.a4);
  n.sm = diag(n.s1, -1, -1);
  n.e1 = diag(n.s1, 1, -1);
  n.e2 = up(n.e1);
  const bonds = [...m.bonds, ['a4', 's1'], ['s1', 'sm'], ['s1', 'e1'], ['e1', 'e2']];
  return { n, bonds };
}
FIGURES.push({
  id: 'tie-question',
  lessons: ['naming-parent-chain'],
  alt: 'One skeleton traced two ways. Path A is the eight-carbon row across the page, numbered 1 to 8, with one four-carbon branch on carbon 4. Path B is also eight carbons, numbered 1 to 8: it starts at the top of the branch, comes down through the branch to the row and runs to the right-hand end, leaving a methyl and a three-carbon piece of the row as branches.',
  viewBox: `0 0 ${W} 450`,
  build() {
    L = LN;
    let s = '';
    const one = (y, label, path, map) => {
      s += panel(PX, y, PW, 180);
      s += tag(CX, y - 10, label);
      const { n, bonds } = octSkeleton(CX - 3.5 * DX(), y + 140);
      s += skel(n, bonds, path);
      s += nums(n, bonds, map);
    };
    one(34, 'path A: eight carbons', ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'],
      { a1: '1', a2: '2', a3: '3', a4: '4', a5: '5', a6: '6', a7: '7', a8: '8' });
    one(258, 'path B: eight carbons', ['e2', 'e1', 's1', 'a4', 'a5', 'a6', 'a7', 'a8'],
      { e2: '1', e1: '2', s1: '3', a4: '4', a5: '5', a6: '6', a7: '7', a8: '8' });
    return s;
  },
  caption: 'Count the branches each path leaves behind.',
});

/* Step 8 question: 2,6,6-trimethyloctane numbered both ways. The sum and
   the first point of difference disagree. */
FIGURES.push({
  id: 'locant-set-question',
  lessons: ['naming-parent-chain'],
  alt: 'An eight-carbon chain with methyls, numbered twice. Numbering A, from the left: methyls on carbons 2, 6 and 6. Numbering B, from the right: methyls on carbons 3, 3 and 7.',
  viewBox: `0 0 ${W} 380`,
  build() {
    L = LN;
    let s = '';
    const row = (y, fromLeft) => {
      s += panel(PX, y, PW, 146);
      s += tag(CX, y - 10, fromLeft ? 'numbering A: from the left' : 'numbering B: from the right');
      const m = chain(CX - 3.5 * DX(), y + 84, 8);
      const n = m.nodes;
      n.s2 = up(n.c2);
      n.s6a = off(n.c6, -0.55 * L, -0.8 * L);
      n.s6b = off(n.c6, 0.55 * L, -0.8 * L);
      const bonds = [...m.bonds, ['c2', 's2'], ['c6', 's6a'], ['c6', 's6b']];
      s += skel(n, bonds, m.keys);
      const map = {};
      m.keys.forEach((k, i) => { map[k] = String(fromLeft ? i + 1 : 8 - i); });
      s += nums(n, bonds, map, { force: { c6: { x: 0, y: 1.35 } } });
      s += text(CX, y + 134, fromLeft ? 'methyls on {2, 6, 6}' : 'methyls on {3, 3, 7}', { cls: 'fg-lbl', size: 13 });
    };
    row(34, true);
    row(220, false);
    return s;
  },
  caption: 'The same molecule both times. Write each set in order and compare.',
});

/* Step 10 question: a seven-carbon row with a methyl on its fifth carbon
   from the left (3-methylheptane). Nothing is numbered: that is the task. */
FIGURES.push({
  id: 'name-question',
  lessons: ['naming-parent-chain'],
  alt: 'A seven-carbon zigzag chain with a single methyl branch hanging down from the fifth carbon counting from the left, which is the third counting from the right.',
  viewBox: `0 0 ${W} 150`,
  build() {
    L = LN;
    let s = '';
    s += panel(PX, 14, PW, 126);
    const m = chain(CX - 3 * DX() - 14, 70, 7);
    const n = m.nodes;
    n.me = down(n.c5);
    const bonds = [...m.bonds, ['c5', 'me']];
    s += skel(n, bonds);
    s += note(n, bonds, 'me', 'methyl', { dir: { x: 1, y: 0 }, d: 8 });
    return s;
  },
  caption: 'Find the parent, number it, and name it.',
});

/* Final challenge: the drawing the student named 2-ethylbutane, with the
   student's numbering along the row. */
FIGURES.push({
  id: 'challenge-drawing',
  lessons: ['naming-parent-chain'],
  alt: 'A four-carbon zigzag row numbered 1 to 4 from the left, with a two-carbon ethyl branch rising from carbon 2. A student has named it 2-ethylbutane.',
  viewBox: `0 0 ${W} 210`,
  build() {
    L = LN;
    let s = '';
    s += panel(PX, 34, PW, 150);
    s += tag(CX, 24, 'the student’s numbering');
    const m = chain(CX - 1.5 * DX() - 10, 150, 4, 'r');
    const n = m.nodes;
    n.e1 = up(n.r2);
    n.e2 = diag(n.e1, 1, -1);
    const bonds = [...m.bonds, ['r2', 'e1'], ['e1', 'e2']];
    s += skel(n, bonds, ['r1', 'r2', 'r3', 'r4']);
    s += nums(n, bonds, { r1: '1', r2: '2', r3: '3', r4: '4' });
    s += note(n, bonds, 'e2', 'ethyl', { dir: { x: 1, y: 0 }, d: 8 });
    s += text(CX, 202, 'student’s name: 2-ethylbutane', { cls: 'fg-tag-warn', size: 11 });
    return s;
  },
  caption: 'The highlighted row is the chain the student chose.',
});

export default FIGURES;

