/* Figures for the naming-rings-unsaturation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every numbering rule on this page is a claim about positions, so every
   example gets a drawn skeleton with its carbons numbered. Where the lesson
   ASKS a numbering question, it gets its own unnumbered drawing (the
   lesson-only figures at the bottom), so the picture is there but the answer
   is not. */
import { atom, bond, wedge, hash, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { sk, ringDouble, zig } from '../lib/ochem-skeletal.mjs';

const T = 'naming-rings-unsaturation';
const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */

/* A six-membered ring, vertex 0 at the top and the rest going clockwise on
   screen: 1 upper right, 2 lower right, 3 bottom, 4 lower left, 5 upper left. */
const hex = (cx, cy, r, startDeg = -90) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = ((startDeg + i * 60) * Math.PI) / 180;
    return P(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  });
const poly = (cx, cy, n, r, startDeg) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((startDeg + (i * 360) / n) * Math.PI) / 180;
    return P(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  });
const unit = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; return P(dx / l, dy / l); };
const along = (p, u, d) => P(p.x + u.x * d, p.y + u.y * d);
const rot = (u, deg) => { const a = (deg * Math.PI) / 180; return P(u.x * Math.cos(a) - u.y * Math.sin(a), u.x * Math.sin(a) + u.y * Math.cos(a)); };

/* Ring bonds. `dbl` lists the indices i whose bond i -> i+1 is double; the
   second line goes inside the ring. */
function ringBonds(pts, opts = {}) {
  const n = pts.length;
  const c = P(pts.reduce((s, p) => s + p.x, 0) / n, pts.reduce((s, p) => s + p.y, 0) / n);
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const cls = opts.hi ? 'fg-bond-hi' : 'fg-bond';
    s += (opts.dbl || []).includes(i) ? ringDouble(a, b, c, { cls, inset: opts.inset ?? 10 }) : bond(a, b, { rFrom: 0, rTo: 0, cls });
  }
  return { s, c };
}

/* Ring locants, written inside the ring next to each vertex. `order` gives
   the locant for vertex 0, 1, 2 ... in turn. */
function ringNums(pts, c, order, frac = 0.6) {
  let s = '';
  pts.forEach((p, i) => {
    if (order[i] == null) return;
    s += text(c.x + (p.x - c.x) * frac, c.y + (p.y - c.y) * frac + 4, String(order[i]), { cls: 'fg-lbl', size: 11 });
  });
  return s;
}

/* A word placed just beyond the end of a bond, on the far side from where
   the bond came from, anchored so it grows away from the drawing. */
function endWord(end, u, word, cls = 'fg-sm') {
  const x = end.x + u.x * 7, y = end.y + u.y * 7;
  if (u.x > 0.35) return text(x + 1, y + 4, word, { cls, anchor: 'start' });
  if (u.x < -0.35) return text(x - 1, y + 4, word, { cls, anchor: 'end' });
  return text(x, u.y > 0 ? y + 11 : y - 2, word, { cls });
}

/* Substituents drawn skeletally off a ring vertex p (ring centre c). A methyl
   is one line; an ethyl is two, bent 60 degrees toward `turn` (+1 or -1). */
function methyl(p, c, opts = {}) {
  const u = unit(c, p), e = along(p, u, opts.len ?? 30);
  return sk(p, e) + (opts.word === false ? '' : endWord(e, u, 'methyl'));
}
function ethyl(p, c, turn = 1) {
  const u = unit(c, p), e1 = along(p, u, 30);
  const u2 = rot(u, turn * 60), e2 = along(e1, u2, 30);
  return sk(p, e1) + sk(e1, e2) + endWord(e2, u2, 'ethyl');
}
function hetero(p, c, label, len = 36) {
  const u = unit(c, p), e = along(p, u, len);
  return bond(p, e, { rFrom: 0, rTo: 16 }) + atom(e.x, e.y, label, { kind: 'hi' });
}

/* A chain. `bonds` is [i, j, order] over `pts`; `hi` highlights the parent.
   `nums` maps a vertex index to its locant; each number goes on the open
   side of its vertex, found from the bonds that meet there (`extra` lists
   more neighbor points, such as a branch end, for vertex i). */
function chain(pts, bonds, opts = {}) {
  let s = '';
  for (const [i, j, order] of bonds) {
    const cls = opts.hi === false ? 'fg-bond' : 'fg-bond-hi';
    if (!order || order === 1) s += bond(pts[i], pts[j], { rFrom: 0, rTo: 0, cls });
    else s += bond(pts[i], pts[j], { order, rFrom: 0, rTo: 0, cls, gap: order === 2 ? 3.5 : 3 });
  }
  return s;
}
function chainNums(pts, bonds, nums, extra = {}, d = 16) {
  let s = '';
  for (const [k, v] of Object.entries(nums)) {
    const i = +k, p = pts[i];
    const nb = [];
    for (const [a, b] of bonds) { if (a === i) nb.push(pts[b]); if (b === i) nb.push(pts[a]); }
    for (const q of extra[i] || []) nb.push(q);
    let sx = 0, sy = 0;
    for (const q of nb) { const u = unit(p, q); sx += u.x; sy += u.y; }
    let dir;
    if (nb.length === 1) dir = P(-sx, -sy);
    else if (Math.hypot(sx, sy) > 0.3) { const l = Math.hypot(sx, sy); dir = P(-sx / l, -sy / l); }
    else if (nb.length === 2) { const u = unit(p, nb[0]); dir = P(u.y, -u.x); if (dir.y > 0) dir = P(-dir.x, -dir.y); }
    else dir = P(0, 1);
    s += text(p.x + dir.x * d, p.y + dir.y * d + 4, String(v), { cls: 'fg-lbl', size: 11 });
  }
  return s;
}
const nameGood = (x, y, s) => text(x, y, s, { cls: 'fg-tag-good', size: 11.5 });
const nameWarn = (x, y, s) => text(x, y, s, { cls: 'fg-tag-warn', size: 11.5 });

/* ------------------------------------------------------------- rings --- */

/* One and two substituents. With two, both short-way numberings give {1,3},
   so this is the case where the alphabet decides. */
FIGURES.push({
  id: 'ring-two-substituents',
  section: T,
  lessons: [T],
  anchor: 'the ethyl is the one that gets C1.</p>',
  alt: 'Three cyclohexane rings. Left: methylcyclohexane, with no numbers. Middle: an ethyl and a methyl with one ring carbon between them, numbered from the ethyl carbon, giving 1-ethyl-3-methylcyclohexane. Right: the same molecule numbered from the methyl carbon, which also gives the set 1,3 but loses on alphabetical order: 3-ethyl-1-methylcyclohexane.',
  viewBox: '0 0 760 306',
  build() {
    let s = '';
    const cy = 128, R = 42;
    const cols = [
      { cx: 130, px: 12, kind: null, tagText: 'one substituent' },
      { cx: 380, px: 262, kind: 'hi', tagText: 'start at the ethyl' },
      { cx: 630, px: 512, kind: 'warn', tagText: 'start at the methyl' },
    ];
    cols.forEach((col, k) => {
      s += panel(col.px, 44, 236, 188, col.kind ? { kind: col.kind } : {});
      s += tag(col.cx, 32, col.tagText);
      const v = hex(col.cx, cy, R);
      const r = ringBonds(v);
      s += r.s;
      s += methyl(v[2], r.c);
      if (k > 0) s += ethyl(v[4], r.c, -1);
      if (k === 1) s += ringNums(v, r.c, [5, 4, 3, 2, 1, 6]);
      if (k === 2) s += ringNums(v, r.c, [5, 6, 1, 2, 3, 4]);
    });
    s += nameGood(130, 254, 'methylcyclohexane');
    s += text(130, 274, 'no number: every ring carbon', { cls: 'fg-sm' });
    s += text(130, 290, 'is equivalent', { cls: 'fg-sm' });
    s += nameGood(380, 254, '1-ethyl-3-methylcyclohexane');
    s += text(380, 274, 'set {1,3}, and ethyl comes', { cls: 'fg-sm' });
    s += text(380, 290, 'first in the alphabet', { cls: 'fg-sm' });
    s += nameWarn(630, 254, '3-ethyl-1-methylcyclohexane');
    s += text(630, 274, 'also {1,3}: a tie,', { cls: 'fg-sm' });
    s += text(630, 290, 'lost on the alphabet', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Follow the numbers round each ring. Both numberings of the ethyl–methyl ring start on a substituted carbon and take the short way to the other one, and both land on 1 and 3.',
});

/* Three substituents. The ethyl is first in the alphabet but does not get
   C1, because the locant set is compared before the alphabet is. */
FIGURES.push({
  id: 'ring-three-substituents',
  section: T,
  lessons: [T],
  anchor: 'The alphabet never gets a say here.</p>',
  alt: 'The same trisubstituted cyclohexane numbered two ways. Left: numbered from the ethyl carbon, giving the set 1,2,5 and the rejected name 1-ethyl-2,5-dimethylcyclohexane. Right: numbered from the neighboring methyl carbon, giving the set 1,2,4 and the correct name 2-ethyl-1,4-dimethylcyclohexane.',
  viewBox: '0 0 760 336',
  build() {
    let s = '';
    const cy = 120, R = 42;
    const draw = (cx, order) => {
      const v = hex(cx, cy, R);
      const r = ringBonds(v);
      let t = r.s;
      t += methyl(v[5], r.c);
      t += ethyl(v[4], r.c, -1);
      t += methyl(v[2], r.c);
      t += ringNums(v, r.c, order);
      return t;
    };
    s += panel(12, 44, 360, 214, { kind: 'warn' });
    s += tag(192, 32, 'ethyl takes C1');
    s += draw(192, [3, 4, 5, 6, 1, 2]);
    s += text(192, 244, 'substituents on {1, 2, 5}', { cls: 'fg-lbl', size: 12 });

    s += panel(388, 44, 360, 214, { kind: 'hi' });
    s += tag(568, 32, 'lowest set of locants');
    s += draw(568, [6, 5, 4, 3, 2, 1]);
    s += text(568, 244, 'substituents on {1, 2, 4}', { cls: 'fg-lbl', size: 12 });

    s += nameWarn(192, 280, '1-ethyl-2,5-dimethylcyclohexane');
    s += nameGood(568, 280, '2-ethyl-1,4-dimethylcyclohexane');
    s += rule(12, 298, 748, 298);
    s += text(380, 322, 'Compare term by term: 1 = 1, then 2 = 2, then 4 beats 5.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'One molecule, two numberings. Read the three ring numbers that carry a substituent in each panel; the right-hand set is lower at its third term, so it wins even though it hands the ethyl a 2.',
});

/* Ring against chain: which one is the parent. */
FIGURES.push({
  id: 'ring-or-chain',
  section: T,
  lessons: [T],
  anchor: 'exams count carbons.)</p>',
  alt: 'Three molecules with the parent highlighted. Methylcyclohexane: the six-carbon ring beats the one-carbon methyl. 1-Cyclohexyloctane: the eight-carbon chain, numbered 1 to 8, beats the six-carbon ring. Pentylcyclopentane: a five-carbon ring and a five-carbon chain tie, and the ring is the parent.',
  viewBox: '0 0 760 290',
  build() {
    let s = '';
    // 1. methylcyclohexane
    s += panel(8, 44, 176, 176, { kind: 'hi' });
    s += tag(96, 32, 'ring 6, chain 1');
    {
      const v = hex(90, 124, 34);
      const r = ringBonds(v, { hi: true });
      s += r.s + methyl(v[2], r.c, { word: false });
      s += text(96, 206, 'the ring wins', { cls: 'fg-sm' });
    }
    s += nameGood(96, 244, 'methylcyclohexane');

    // 2. 1-cyclohexyloctane
    s += panel(194, 44, 344, 176, { kind: 'hi' });
    s += tag(366, 32, 'ring 6, chain 8');
    {
      const v = hex(236, 136, 26, 0);            // vertex 0 points right
      s += ringBonds(v).s;
      const c = Array.from({ length: 8 }, (_, i) => P(v[0].x + 26 + i * 30, i % 2 === 0 ? 120 : 136));
      s += sk(v[0], c[0], true);
      const bonds = c.slice(1).map((_, i) => [i, i + 1, 1]);
      s += chain(c, bonds);
      const nums = {}; c.forEach((_, i) => { nums[i] = i + 1; });
      s += chainNums(c, bonds, nums, { 0: [v[0]] });
      s += text(366, 206, 'the chain wins', { cls: 'fg-sm' });
    }
    s += nameGood(366, 244, '1-cyclohexyloctane');

    // 3. pentylcyclopentane
    s += panel(548, 44, 204, 176, { kind: 'hi' });
    s += tag(650, 32, 'ring 5, chain 5');
    {
      const v = poly(588, 136, 5, 26, 0);        // vertex 0 points right
      s += ringBonds(v, { hi: true }).s;
      const c = Array.from({ length: 5 }, (_, i) => P(v[0].x + 24 + i * 26, i % 2 === 0 ? 120 : 136));
      s += sk(v[0], c[0]);
      for (let i = 0; i < 4; i++) s += sk(c[i], c[i + 1]);
      s += text(650, 206, 'a tie goes to the ring', { cls: 'fg-sm' });
    }
    s += nameGood(650, 244, 'pentylcyclopentane');
    s += text(380, 276, 'Highlighted bonds are the parent.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Count the ring carbons and the chain carbons in each molecule before looking at which part is highlighted.',
});

/* ---------------------------------------------------- multiple bonds --- */

FIGURES.push({
  id: 'alkene-locants',
  section: T,
  lessons: [T],
  anchor: 'The locant is the lower number of the pair.</p>',
  alt: 'Three numbered chains. But-1-ene: the double bond joins C1 and C2, so its locant is 1. But-2-ene: the double bond joins C2 and C3, so its locant is 2. Penta-1,3-diene: double bonds join C1 to C2 and C3 to C4, so the locants are 1 and 3.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    const cases = [
      { cx: 128, n: 4, dbl: [0], name: 'but-1-ene', read: 'C1=C2, written as 1' },
      { cx: 380, n: 4, dbl: [1], name: 'but-2-ene', read: 'C2=C3, written as 2' },
      { cx: 632, n: 5, dbl: [0, 2], name: 'penta-1,3-diene', read: 'C1=C2 and C3=C4: 1,3' },
    ];
    for (const k of cases) {
      s += panel(k.cx - 118, 40, 236, 150, { kind: 'hi' });
      const w = (k.n - 1) * 40;
      const pts = zig(k.cx - w / 2, 124, k.n, 40, 26);
      const bonds = pts.slice(1).map((_, i) => [i, i + 1, k.dbl.includes(i) ? 2 : 1]);
      s += chain(pts, bonds);
      const nums = {}; pts.forEach((_, i) => { nums[i] = i + 1; });
      s += chainNums(pts, bonds, nums);
      s += text(k.cx, 176, k.read, { cls: 'fg-sm' });
      s += nameGood(k.cx, 214, k.name);
    }
    return s;
  },
  caption: 'Each double bond joins two numbered carbons. The name cites only the lower of the two.',
});

/* 4-methylpent-2-ene and 4-methylpent-1-yne, each numbered from both ends. */
FIGURES.push({
  id: 'multiple-bond-first',
  section: T,
  lessons: [T],
  anchor: 'and the methyl gets what is left.</p>',
  alt: 'Two chains, each numbered from both ends. Top: numbering from the right gives the methyl 2 and the double bond 3 (rejected, 2-methylpent-3-ene); numbering from the left gives the double bond 2 and the methyl 4 (4-methylpent-2-ene). Bottom: the same for a triple bond at the end of the chain; the correct name is 4-methylpent-1-yne and the rejected one is 2-methylpent-4-yne.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    s += tag(192, 24, 'numbered for the methyl');
    s += tag(568, 24, 'numbered for the multiple bond');
    // Row 1: 4-methylpent-2-ene. Vertex 3 carries the methyl, straight up.
    const alkene = (cx, y0, order) => {
      const pts = zig(cx - 72, y0, 5, 36, 22);
      const br = P(pts[3].x, pts[3].y - 38);
      const bonds = [[0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 1]];
      let t = chain(pts, bonds) + sk(pts[3], br);
      t += text(br.x + 6, br.y + 4, 'methyl', { cls: 'fg-sm', anchor: 'start' });
      const nums = {}; pts.forEach((_, i) => { nums[i] = order[i]; });
      t += chainNums(pts, bonds, nums, { 3: [br] });
      return t;
    };
    s += panel(12, 36, 360, 168, { kind: 'warn' });
    s += alkene(192, 120, [5, 4, 3, 2, 1]);
    s += text(192, 166, 'methyl 2, double bond 3', { cls: 'fg-sm' });
    s += nameWarn(192, 190, '2-methylpent-3-ene');
    s += panel(388, 36, 360, 168, { kind: 'hi' });
    s += alkene(568, 120, [1, 2, 3, 4, 5]);
    s += text(568, 166, 'double bond 2, methyl 4', { cls: 'fg-sm' });
    s += nameGood(568, 190, '4-methylpent-2-ene');

    // Row 2: 4-methylpent-1-yne. C1, C2 and C3 sit on one straight line,
    // because the two carbons of a triple bond are linear.
    const alkyne = (cx, y0, order) => {
      const x0 = cx - 68;
      const pts = [P(x0, y0 - 44), P(x0 + 34, y0 - 22), P(x0 + 68, y0), P(x0 + 102, y0 - 22), P(x0 + 136, y0)];
      const br = P(pts[3].x, pts[3].y - 38);
      const bonds = [[0, 1, 3], [1, 2, 1], [2, 3, 1], [3, 4, 1]];
      let t = chain(pts, bonds) + sk(pts[3], br);
      t += text(br.x + 6, br.y + 4, 'methyl', { cls: 'fg-sm', anchor: 'start' });
      const nums = {}; pts.forEach((_, i) => { nums[i] = order[i]; });
      t += chainNums(pts, bonds, nums, { 3: [br] });
      return t;
    };
    s += panel(12, 222, 360, 168, { kind: 'warn' });
    s += alkyne(192, 306, [5, 4, 3, 2, 1]);
    s += text(192, 352, 'methyl 2, triple bond 4', { cls: 'fg-sm' });
    s += nameWarn(192, 376, '2-methylpent-4-yne');
    s += panel(388, 222, 360, 168, { kind: 'hi' });
    s += alkyne(568, 306, [1, 2, 3, 4, 5]);
    s += text(568, 352, 'triple bond 1, methyl 4', { cls: 'fg-sm' });
    s += nameGood(568, 376, '4-methylpent-1-yne');
    return s;
  },
  caption: 'Each row is one molecule numbered from both ends. The left column gives the methyl the lower number; the right column gives it to the multiple bond, and the right column is correct.',
});

/* 3-methylidenehexane against 2-ethylpent-1-ene. */
FIGURES.push({
  id: 'alkene-parent-contains',
  section: T,
  lessons: [T],
  anchor: 'and not a methylidene-hexane.',
  alt: 'One alkene traced twice. Left: the six-carbon chain, the longest in the molecule, with the C=CH2 hanging off its third carbon; named 3-methylidenehexane and marked as not the textbook answer. Right: the five-carbon chain that starts at the CH2 of the double bond, numbered so the double bond is C1 to C2 and the ethyl is on C2; named 2-ethylpent-1-ene.',
  viewBox: '0 0 720 390',
  build() {
    let s = '';
    const skeleton = (ox, traced, nums, extra) => {
      const a = zig(ox + 50, 174, 6, 36, 22);
      const ch2 = P(a[2].x, a[2].y + 44);
      const links = [['a0', a[0], a[1]], ['a1', a[1], a[2]], ['a2', a[2], a[3]], ['a3', a[3], a[4]], ['a4', a[4], a[5]]];
      let t = '';
      for (const [, p, q] of links) t += sk(p, q);
      for (const [k, p, q] of links) if (traced.includes(k)) t += sk(p, q, true);
      t += bond(a[2], ch2, { order: 2, rFrom: 0, rTo: 0, cls: traced.includes('db') ? 'fg-bond-hi' : 'fg-bond', gap: 3.5 });
      for (const [x, y, v] of nums) t += text(ox + x, y, v, { cls: 'fg-lbl', size: 11 });
      for (const [x, y, v, anchor] of extra) t += text(ox + x, y, v, { cls: 'fg-sm', size: 9.5, anchor: anchor || 'middle' });
      return t;
    };
    s += panel(20, 64, 300, 224, { kind: 'warn' });
    s += tag(170, 52, 'the longest chain in the molecule');
    s += skeleton(26, ['a0', 'a1', 'a2', 'a3', 'a4'],
      [[50, 130, '1'], [86, 130, '2'], [122, 130, '3'], [158, 130, '4'], [194, 130, '5'], [230, 130, '6']],
      [[122, 242, 'the C=C is off the chain']]);

    s += panel(370, 64, 300, 224, { kind: 'hi' });
    s += tag(520, 52, 'the longest chain through the C=C');
    s += skeleton(376, ['a2', 'a3', 'a4', 'db'],
      [[122, 130, '2'], [158, 130, '3'], [194, 130, '4'], [230, 130, '5'], [104, 224, '1']],
      [[68, 130, 'ethyl']]);

    s += rule(20, 300, 670, 300);
    s += text(170, 322, 'six carbons, but the double bond is a branch', { cls: 'fg-sm', size: 10 });
    s += text(170, 344, '3-methylidenehexane', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(170, 364, 'not what a textbook or exam expects', { cls: 'fg-sm', size: 9.5 });
    s += text(520, 322, 'five carbons: shorter, and it contains the C=C', { cls: 'fg-sm', size: 10 });
    s += text(520, 344, '2-ethylpent-1-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(520, 364, 'the double bond takes the suffix and C1', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'One alkene, two candidate parents. Compare the highlighted chains: the left one is longer but misses the double bond; the right one runs through it, so the double bond gets C1 and the two carbons left over are an ethyl.',
});

/* hex-5-en-1-ol against hex-1-en-6-ol. */
FIGURES.push({
  id: 'hexenol-numbering',
  section: T,
  lessons: [T],
  anchor: 'even though the second gives the <i>double bond</i> the lower number.</p>',
  alt: 'A six-carbon chain with an OH on one end carbon and a double bond at the other end, numbered two ways. Left: numbered from the double bond, giving the double bond 1 and the OH 6: hex-1-en-6-ol, rejected. Right: numbered from the OH carbon, giving the OH 1 and the double bond 5: hex-5-en-1-ol, correct.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    const draw = (cx, order) => {
      const pts = zig(cx - 120, 132, 7, 40, 24);    // vertex 0 is the O
      const bonds = [[1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 2]];
      let t = bond(pts[1], pts[0], { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' }) + atom(pts[0].x, pts[0].y, 'OH', { kind: 'hi' });
      t += chain(pts, bonds);
      const nums = {}; for (let i = 1; i <= 6; i++) nums[i] = order[i - 1];
      t += chainNums(pts, bonds, nums, { 1: [pts[0]] });
      return t;
    };
    s += panel(12, 40, 360, 150, { kind: 'warn' });
    s += tag(192, 28, 'numbered from the double bond');
    s += draw(192, [6, 5, 4, 3, 2, 1]);
    s += text(192, 178, 'C=C gets 1, OH gets 6', { cls: 'fg-sm' });
    s += nameWarn(192, 214, 'hex-1-en-6-ol');

    s += panel(388, 40, 360, 150, { kind: 'hi' });
    s += tag(568, 28, 'numbered from the OH');
    s += draw(568, [1, 2, 3, 4, 5, 6]);
    s += text(568, 178, 'OH gets 1, C=C gets 5', { cls: 'fg-sm' });
    s += nameGood(568, 214, 'hex-5-en-1-ol');
    s += text(380, 240, 'The OH is the principal group, so it claims the 1.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'The same chain numbered from each end. Find the OH carbon and the pair of double-bond carbons in each panel.',
});

/* pent-3-en-1-yne and pent-1-en-4-yne, each numbered from both ends. */
FIGURES.push({
  id: 'enyne-numbering',
  section: T,
  lessons: [T],
  anchor: 'Only a tie hands the 1 to the double bond.</p>',
  alt: 'Two five-carbon chains that each contain one double bond and one triple bond, each numbered from both ends. Top: from the left the bonds sit at 2 and 4; from the right at 1 and 3, which is lower, so the name is pent-3-en-1-yne. Bottom: both directions give 1 and 4, a tie, so the double bond takes the 1: pent-1-en-4-yne, not pent-4-en-1-yne.',
  viewBox: '0 0 760 420',
  build() {
    let s = '';
    const draw = (cx, y0, dblAt, order) => {
      const x0 = cx - 68;
      // a-b-c zigzag; c-d-e straight, because d and e are the triple bond.
      const pts = [P(x0, y0), P(x0 + 34, y0 - 22), P(x0 + 68, y0), P(x0 + 102, y0 - 22), P(x0 + 136, y0 - 44)];
      const bonds = [[0, 1, dblAt === 0 ? 2 : 1], [1, 2, dblAt === 1 ? 2 : 1], [2, 3, 1], [3, 4, 3]];
      const nums = {}; pts.forEach((_, i) => { nums[i] = order[i]; });
      return chain(pts, bonds) + chainNums(pts, bonds, nums);
    };
    s += tag(192, 24, 'one direction');
    s += tag(568, 24, 'the other direction');
    // Row 1: CH3-CH=CH-C≡CH
    s += panel(12, 36, 360, 168, { kind: 'warn' });
    s += draw(192, 118, 1, [1, 2, 3, 4, 5]);
    s += text(192, 168, 'double bond 2, triple bond 4: {2, 4}', { cls: 'fg-sm' });
    s += nameWarn(192, 190, 'pent-2-en-4-yne');
    s += panel(388, 36, 360, 168, { kind: 'hi' });
    s += draw(568, 118, 1, [5, 4, 3, 2, 1]);
    s += text(568, 168, 'triple bond 1, double bond 3: {1, 3}', { cls: 'fg-sm' });
    s += nameGood(568, 190, 'pent-3-en-1-yne');
    // Row 2: CH2=CH-CH2-C≡CH
    s += panel(12, 222, 360, 168, { kind: 'warn' });
    s += draw(192, 304, 0, [5, 4, 3, 2, 1]);
    s += text(192, 354, 'triple bond 1, double bond 4: {1, 4}', { cls: 'fg-sm' });
    s += nameWarn(192, 376, 'pent-4-en-1-yne');
    s += panel(388, 222, 360, 168, { kind: 'hi' });
    s += draw(568, 304, 0, [1, 2, 3, 4, 5]);
    s += text(568, 354, 'double bond 1, triple bond 4: {1, 4}', { cls: 'fg-sm' });
    s += nameGood(568, 376, 'pent-1-en-4-yne');
    s += text(380, 410, 'Top row: {1, 3} beats {2, 4}. Bottom row: a tie, so the double bond gets the 1.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Each row is one molecule numbered from both ends. The straight run of three carbons at the right-hand end is the triple bond and its neighbor: a triple bond holds its carbons in a line.',
});

/* ------------------------------------------------------ rings with C=C --- */
/* Numbering a ring has no left end to start from. Two rings numbered in
   opposite directions make that checkable. */
FIGURES.push({
  id: 'ring-numbering-direction',
  section: T,
  lessons: [T],
  anchor: 'as 3-methylcyclohexene.</p>',
  alt: 'One methylcyclohexene numbered clockwise and counterclockwise, both giving the double bond carbons 1 and 2 and the methyl 3 or 6',
  viewBox: '0 0 760 376',
  build() {
    let s = '';
    /* Vertex 0 is the top; the double bond runs from vertex 0 to vertex 1 and
       the methyl sits on vertex 2, so it is adjacent to an alkene carbon.
       `order` lists which locant each vertex receives, which is the only
       thing that differs between the two panels. */
    const ring = (cx, order) => {
      const v = hex(cx, 170, 56);
      let t = '';
      for (let i = 0; i < 6; i++) {
        if (i === 0) t += ringDouble(v[i], v[1], P(cx, 170));
        else t += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      }
      const m = v[2];
      const u = unit(P(cx, 170), m);
      t += bond(m, along(m, u, 38), { rFrom: 0, rTo: 16 });
      const e = along(m, u, 38);
      t += atom(e.x, e.y, 'CH₃', { r: 16 });
      t += ringNums(v, P(cx, 170), order, 0.59);
      return t;
    };
    s += panel(44, 76, 248, 196, { kind: 'warn' });
    s += tag(168, 64, 'round one way');
    s += ring(168, [2, 1, 6, 5, 4, 3]);

    s += panel(404, 76, 248, 196, { kind: 'hi' });
    s += tag(528, 64, 'round the other');
    s += ring(528, [1, 2, 3, 4, 5, 6]);

    s += text(168, 298, 'methyl lands on C6', { cls: 'fg-sm', size: 10 });
    s += text(168, 320, '6-methylcyclohex-1-ene', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(528, 298, 'methyl lands on C3', { cls: 'fg-sm', size: 10 });
    s += text(528, 320, '3-methylcyclohex-1-ene', { cls: 'fg-tag-good', size: 11.5 });

    s += rule(34, 336, 662, 336);
    s += text(348, 360, 'Both give the double bond 1 and 2. Only the methyl separates them, and 3 beats 6.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The same methylcyclohexene, numbered in both directions. In each panel, check that the numbering runs from C1 to C2 straight across the double bond before it reaches the methyl.',
});

/* cyclohex-2-en-1-ol: the OH outranks the ring's double bond. */
FIGURES.push({
  id: 'cyclohexenol-numbering',
  section: T,
  anchor: 'the double bond takes the lowest locants left.</p>',
  alt: 'A cyclohexene ring with an OH on the carbon next to the double bond, numbered two ways. Left: the double bond takes C1 and C2 and the OH is on C3, giving cyclohex-1-en-3-ol, rejected. Right: the OH carbon is C1 and the numbering runs toward the double bond, which becomes C2 to C3: cyclohex-2-en-1-ol, correct.',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    const draw = (cx, order) => {
      const v = hex(cx, 128, 44);
      const r = ringBonds(v, { dbl: [2] });
      return r.s + hetero(v[1], r.c, 'OH') + ringNums(v, r.c, order, 0.54);
    };
    s += panel(12, 40, 360, 180, { kind: 'warn' });
    s += tag(192, 28, 'double bond takes C1 and C2');
    s += draw(192, [4, 3, 2, 1, 6, 5]);
    s += text(192, 206, 'OH lands on C3', { cls: 'fg-sm' });
    s += nameWarn(192, 244, 'cyclohex-1-en-3-ol');
    s += panel(388, 40, 360, 180, { kind: 'hi' });
    s += tag(568, 28, 'OH takes C1');
    s += draw(568, [6, 1, 2, 3, 4, 5]);
    s += text(568, 206, 'double bond on C2 and C3', { cls: 'fg-sm' });
    s += nameGood(568, 244, 'cyclohex-2-en-1-ol');
    s += text(380, 272, 'The OH is the principal group, so it outranks the double bond here too.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'One ring alcohol, two numberings. Find C1 in each panel, then find where the double bond falls.',
});

/* cis and trans 1,2-dimethylcyclohexane. Wedges have not been taught yet
   (Stereochemistry), so the figure carries its own key. */
FIGURES.push({
  id: 'cis-trans-ring',
  section: T,
  anchor: 'is often incomplete without cis or trans.</p>',
  alt: 'Two drawings of 1,2-dimethylcyclohexane. In the cis compound both methyls are drawn on solid wedges, so both point toward the viewer, on the same face of the ring. In the trans compound one methyl is on a wedge and the other on a hashed bond, so they point to opposite faces.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const draw = (cx, trans) => {
      const v = hex(cx, 128, 42);
      const r = ringBonds(v);
      let t = r.s;
      for (const [i, back] of [[1, false], [2, trans]]) {
        const u = unit(r.c, v[i]), e = along(v[i], u, 42);
        t += back ? hash(v[i], e, { rFrom: 0, rTo: 16, width: 8 }) : wedge(v[i], e, { rFrom: 0, rTo: 16, width: 8 });
        t += atom(e.x, e.y, 'CH₃');
      }
      t += ringNums(v, r.c, [null, 1, 2, null, null, null]);
      return t;
    };
    s += panel(12, 40, 360, 178, { kind: 'hi' });
    s += tag(192, 28, 'same face');
    s += draw(176, false);
    s += text(192, 204, 'both methyls toward you', { cls: 'fg-sm' });
    s += nameGood(192, 240, 'cis-1,2-dimethylcyclohexane');
    s += panel(388, 40, 360, 178, { kind: 'hi' });
    s += tag(568, 28, 'opposite faces');
    s += draw(552, true);
    s += text(568, 204, 'one toward you, one away', { cls: 'fg-sm' });
    s += nameGood(568, 240, 'trans-1,2-dimethylcyclohexane');
    s += rule(12, 258, 748, 258);
    s += text(380, 282, 'Key: a solid wedge points toward you; a hashed bond points away from you.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Picture the ring lying flat on the page. The wedge and the hashed bond say which side of that flat ring each methyl is on.',
});

/* cis and trans but-2-ene. */
FIGURES.push({
  id: 'cis-trans-but-2-ene',
  section: T,
  lessons: [T],
  anchor: 'The name so far cannot tell them apart.</p>',
  alt: 'Two skeletal drawings of but-2-ene. In cis-but-2-ene both methyl carbons sit below the double bond, on the same side; in trans-but-2-ene one sits below and one above, on opposite sides.',
  viewBox: '0 0 720 262',
  build() {
    let s = '';
    const butene = (cx, cy, trans) => {
      const c1 = P(cx - 52, cy + 22), c2 = P(cx - 18, cy + 2), c3 = P(cx + 18, cy + 2), c4 = P(cx + 52, trans ? cy - 18 : cy + 22);
      let t = sk(c1, c2) + bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.5 }) + sk(c3, c4);
      t += text(c1.x - 4, c1.y + 18, 'methyl', { cls: 'fg-sm', size: 9.5 });
      t += text(c4.x + 4, trans ? c4.y - 8 : c4.y + 18, 'methyl', { cls: 'fg-sm', size: 9.5 });
      t += text(c2.x, c2.y - 12, '2', { cls: 'fg-lbl', size: 11 });
      t += text(c3.x, c3.y - 12, '3', { cls: 'fg-lbl', size: 11 });
      return t;
    };
    s += panel(40, 44, 300, 150, { kind: 'hi' });
    s += tag(190, 32, 'same side');
    s += butene(190, 110, false);
    s += text(190, 216, 'cis-but-2-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(190, 236, 'both methyls below the C=C', { cls: 'fg-sm', size: 9.5 });

    s += panel(380, 44, 300, 150, { kind: 'hi' });
    s += tag(530, 32, 'opposite sides');
    s += butene(530, 110, true);
    s += text(530, 216, 'trans-but-2-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(530, 236, 'one methyl below, one above', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Two compounds that the name but-2-ene does not distinguish. A methyl drawn below the double bond stays below it, so these are two different molecules with different boiling points, not two drawings of one.',
  note: 'Read the prefix off the drawing: find the two groups that are not hydrogen, one on each alkene carbon, and ask whether they are on the same side of the double bond. Same side is <i>cis</i>, opposite is <i>trans</i>. When one of the alkene carbons carries two groups that are not hydrogen the words stop being enough, which is what the E/Z system is for.',
});

/* ---------------------------------------------------------- benzene --- */

FIGURES.push({
  id: 'ortho-meta-para',
  section: T,
  lessons: [T],
  anchor: 'and the words mean exactly what they mean here.</p>',
  alt: 'Three benzene rings, each with two methyl groups and all six ring carbons numbered. Ortho: methyls on C1 and C2, adjacent. Meta: methyls on C1 and C3, with one ring carbon between them. Para: methyls on C1 and C4, directly across the ring.',
  viewBox: '0 0 760 290',
  build() {
    let s = '';
    const R = 40;
    const cases = [
      { cx: 128, word: 'ortho', pos: '1,2', name: '1,2-dimethylbenzene', common: 'o-xylene', at: 1 },
      { cx: 380, word: 'meta', pos: '1,3', name: '1,3-dimethylbenzene', common: 'm-xylene', at: 2 },
      { cx: 632, word: 'para', pos: '1,4', name: '1,4-dimethylbenzene', common: 'p-xylene', at: 3 },
    ];
    for (const k of cases) {
      s += panel(k.cx - 118, 28, 236, 196, { kind: 'hi' });
      const v = hex(k.cx, 118, R);
      const r = ringBonds(v, { dbl: [0, 2, 4], inset: 8 });
      s += r.s;
      for (const i of [0, k.at]) {
        const u = unit(r.c, v[i]);
        s += sk(v[i], along(v[i], u, 30));
      }
      s += ringNums(v, r.c, [1, 2, 3, 4, 5, 6], 0.52);
      s += text(k.cx, 210, `${k.word}  (${k.pos})`, { cls: 'fg-tag-good', size: 11 });
      s += text(k.cx, 248, k.name, { cls: 'fg-lbl', size: 12 });
      s += text(k.cx, 268, `also called ${k.common}`, { cls: 'fg-sm' });
    }
    return s;
  },
  caption: 'Two methyls on a benzene ring, in each of the three possible positions. Count the ring carbons from one methyl to the other.',
  note: 'There are only three because the ring is symmetric: a 1,5 relationship is the same as 1,3 counted the other way round, and 1,6 is 1,2. Whichever of the two groups you call C1, the other lands on 2, 3 or 4, and that is the whole vocabulary.',
});

/* Phenyl against benzyl. */
FIGURES.push({
  id: 'phenyl-vs-benzyl',
  section: T,
  lessons: [T],
  anchor: 'Confusing the two changes the molecule by a carbon, and both words are in constant use.</div>',
  alt: 'Two benzene rings as substituents. Phenyl is the ring attached directly through one of its own carbons, six carbons in all. Benzyl is the same ring attached through a CH2 carbon that sits between the ring and the parent, seven carbons in all; the extra carbon is highlighted.',
  viewBox: '0 0 720 250',
  build() {
    let s = '';
    const R = 34;
    const ring = (cx, cy) => {
      const pts = hex(cx, cy, R, 0);
      let g = '';
      for (let i = 0; i < 6; i++) g += sk(pts[i], pts[(i + 1) % 6]);
      g += `<circle class="fg-bond" cx="${cx}" cy="${cy}" r="20"></circle>`;
      return { g, right: pts[0] };
    };
    {
      const cx = 166, cy = 116; s += panel(40, 40, 300, 150);
      s += tag(190, 28, 'phenyl: the ring itself');
      const r = ring(cx, cy); s += r.g;
      const A = P(r.right.x + 40, cy);
      s += sk(r.right, A, true) + atom(A.x, A.y, '', { kind: 'hi', r: 5 });
      s += text(190, 212, 'phenyl, C₆H₅–  ·  six carbons', { cls: 'fg-tag-good', size: 11 });
    }
    {
      const cx = 484, cy = 116; s += panel(380, 40, 300, 150);
      s += tag(530, 28, 'benzyl: the ring plus one CH₂');
      const r = ring(cx, cy); s += r.g;
      const ch2 = P(r.right.x + 34, cy - 20), A = P(ch2.x + 34, cy);
      s += sk(r.right, ch2) + sk(ch2, A, true) + atom(A.x, A.y, '', { kind: 'hi', r: 5 });
      s += atom(ch2.x, ch2.y, '', { kind: 'warn', r: 6 });
      s += text(ch2.x + 2, ch2.y - 14, 'CH₂', { cls: 'fg-tag-warn', size: 10 });
      s += text(530, 212, 'benzyl, C₆H₅CH₂–  ·  seven carbons', { cls: 'fg-tag-good', size: 11 });
    }
    s += text(360, 240, 'The dot is the bond to the rest of the molecule.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Phenyl and benzyl side by side. Find the carbon that bonds to the rest of the molecule: in phenyl it is a ring carbon, in benzyl it is the extra CH₂.',
  note: 'The reason the words matter beyond spelling is that the CH₂ in a benzyl group is the benzylic carbon, and the chemistry at that carbon (in <a class="chapter-ref" href="/ochem/learn.html#m-aromatic-breadth">Aromatic Follow-Through</a>) is nothing like the chemistry at a ring carbon. Benzyl alcohol is PhCH₂OH, a primary alcohol; phenol is PhOH, and is not an alcohol at all.',
});

/* ------------------------------------------- lesson-only question art ---
   Unnumbered on purpose: the question asks for the numbering. */

FIGURES.push({
  id: 'q-ring-bromo-dimethyl',
  lessons: [T],
  alt: 'A cyclohexane ring carrying two methyl groups on neighboring carbons and a bromine two carbons further round from one of them. The ring is not numbered.',
  viewBox: '0 0 420 230',
  build() {
    const v = hex(210, 110, 44);
    const r = ringBonds(v);
    return r.s + methyl(v[1], r.c) + methyl(v[2], r.c) + hetero(v[4], r.c, 'Br');
  },
  caption: 'Find every numbering that starts on a substituted carbon, and write down its locant set.',
});

FIGURES.push({
  id: 'q-hexene',
  lessons: [T],
  alt: 'A six-carbon zigzag chain with a double bond between the second and third carbons counted from the right-hand end. The chain is not numbered.',
  viewBox: '0 0 420 150',
  build() {
    const pts = zig(110, 96, 6, 40, 26);
    const bonds = [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 2], [4, 5, 1]];
    return chain(pts, bonds, { hi: false });
  },
  caption: 'Number the chain from the end that reaches the double bond first.',
});

FIGURES.push({
  id: 'q-enyne',
  lessons: [T],
  alt: 'A six-carbon chain. At the left end a methyl carbon joins a double bond; in the middle is a CH2; at the right end is a triple bond, drawn with its carbons in a straight line. The chain is not numbered.',
  viewBox: '0 0 420 160',
  build() {
    const x0 = 110, y0 = 90;
    const pts = [P(x0, y0), P(x0 + 34, y0 - 22), P(x0 + 68, y0), P(x0 + 102, y0 - 22), P(x0 + 136, y0), P(x0 + 170, y0 + 22)];
    const bonds = [[0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 1], [4, 5, 3]];
    return chain(pts, bonds, { hi: false });
  },
  caption: 'Number it both ways and write down the pair of locants each direction gives.',
});

FIGURES.push({
  id: 'q-pentenol',
  lessons: [T],
  alt: 'A five-carbon chain with a double bond at the left end and an OH on the second carbon from the right end. The chain is not numbered.',
  viewBox: '0 0 420 170',
  build() {
    const pts = zig(130, 126, 5, 40, 26);
    const bonds = [[0, 1, 2], [1, 2, 1], [2, 3, 1], [3, 4, 1]];
    const o = P(pts[3].x, pts[3].y - 44);
    return chain(pts, bonds, { hi: false }) + bond(pts[3], o, { rFrom: 0, rTo: 16 }) + atom(o.x, o.y, 'OH', { kind: 'hi' });
  },
  caption: 'Find the principal characteristic group before you number.',
});

FIGURES.push({
  id: 'q-benzene-pair',
  lessons: [T],
  alt: 'A benzene ring with a chlorine on one carbon and a methyl on the carbon directly across the ring from it. The ring is not numbered.',
  viewBox: '0 0 420 240',
  build() {
    const v = hex(210, 116, 42);
    const r = ringBonds(v, { dbl: [0, 2, 4], inset: 8 });
    return r.s + hetero(v[1], r.c, 'Cl') + methyl(v[4], r.c);
  },
  caption: 'Count the ring carbons from one substituent round to the other.',
});

FIGURES.push({
  id: 'q-ring-chain-oh',
  lessons: [T],
  alt: 'A cyclohexane ring bonded to the end of an eight-carbon zigzag chain; the far end of the chain carries an OH.',
  viewBox: '0 0 460 170',
  build() {
    const v = hex(56, 100, 26, 0);
    let s = ringBonds(v).s;
    const c = Array.from({ length: 8 }, (_, i) => P(v[0].x + 26 + i * 32, i % 2 === 0 ? 84 : 100));
    s += sk(v[0], c[0]);
    for (let i = 0; i < 7; i++) s += sk(c[i], c[i + 1]);
    const o = P(c[7].x + 30, c[7].y - 16);
    s += bond(c[7], o, { rFrom: 0, rTo: 16 }) + atom(o.x, o.y, 'OH', { kind: 'hi' });
    return s;
  },
  caption: 'Count the ring carbons and the chain carbons, and find the OH.',
});

export default FIGURES;
