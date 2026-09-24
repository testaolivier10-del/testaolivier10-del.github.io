/* Figures for the naming-rings-unsaturation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every numbering rule on this page is a claim about positions, so every
   example gets a drawn skeleton with its carbons numbered. Where the lesson
   ASKS a numbering question, it gets its own unnumbered drawing (the
   lesson-only figures at the bottom), so the picture is there but the answer
   is not.

   Every figure the lesson shows is 360 wide with its panels stacked, because
   a lesson card on a 420px phone is about that wide and anything wider
   scrolls sideways. The two notes-only figures keep the wide layout.

   Methyls are drawn one way throughout: a skeletal stub with the word
   "methyl" at its end. */
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
  const u = unit(c, p), e = along(p, u, opts.len ?? 28);
  return sk(p, e) + (opts.word === false ? '' : endWord(e, u, 'methyl'));
}
function ethyl(p, c, turn = 1) {
  const u = unit(c, p), e1 = along(p, u, 28);
  const u2 = rot(u, turn * 60), e2 = along(e1, u2, 28);
  return sk(p, e1) + sk(e1, e2) + endWord(e2, u2, 'ethyl');
}
function hetero(p, c, label, len = 36) {
  const u = unit(c, p), e = along(p, u, len);
  return bond(p, e, { rFrom: 0, rTo: 16 }) + atom(e.x, e.y, label, { kind: 'hi' });
}

/* A chain. `bonds` is [i, j, order, plain]; every bond is highlighted as the
   parent unless opts.hi is false or the bond's fourth entry is true. */
function chain(pts, bonds, opts = {}) {
  let s = '';
  for (const [i, j, order, plain] of bonds) {
    const cls = opts.hi === false || plain ? 'fg-bond' : 'fg-bond-hi';
    if (!order || order === 1) s += bond(pts[i], pts[j], { rFrom: 0, rTo: 0, cls });
    else s += bond(pts[i], pts[j], { order, rFrom: 0, rTo: 0, cls, gap: order === 2 ? 3.5 : 3 });
  }
  return s;
}

/* Locant numbers for a chain, each on the open side of its vertex. The
   direction chosen is the one furthest, in angle, from every bond that meets
   at that vertex (`extra` adds more neighbours, such as a branch end). */
function chainNums(pts, bonds, nums, extra = {}, d = 16) {
  let s = '';
  for (const [k, v] of Object.entries(nums)) {
    const i = +k, p = pts[i];
    const nb = [];
    for (const [a, b] of bonds) { if (a === i) nb.push(pts[b]); if (b === i) nb.push(pts[a]); }
    for (const q of extra[i] || []) nb.push(q);
    const angs = nb.map((q) => Math.atan2(q.y - p.y, q.x - p.x));
    let best = -Math.PI / 2, score = -1;
    for (let t = 0; t < 24; t++) {
      // Try every 15 degrees, preferring straight up or down on a tie.
      const a = -Math.PI / 2 + (t * Math.PI) / 12;
      let m = Math.PI;
      for (const b of angs) { let dlt = Math.abs(a - b) % (2 * Math.PI); if (dlt > Math.PI) dlt = 2 * Math.PI - dlt; m = Math.min(m, dlt); }
      if (m > score + 1e-6) { score = m; best = a; }
    }
    s += text(p.x + Math.cos(best) * d, p.y + Math.sin(best) * d + 4, String(v), { cls: 'fg-lbl', size: 11 });
  }
  return s;
}
const nameGood = (x, y, s) => text(x, y, s, { cls: 'fg-tag-good', size: 11.5 });
const nameWarn = (x, y, s) => text(x, y, s, { cls: 'fg-tag-warn', size: 11.5 });

/* The lesson-width layout: panels 344 wide, stacked. Each panel is
   { kind, tag, dh, draw(cx, top), name, bad, notes: [] }. `draw` gets the
   centre line and the top of a drawing area dh tall. Returns the SVG body
   and the height, so a figure can set its viewBox from it. */
const W = 360, CX = 180;
function stack(panels, foot = []) {
  let y = 8, s = '';
  for (const p of panels) {
    const notes = p.notes || [];
    const h = 28 + p.dh + 22 + notes.length * 16 + 10;
    s += panel(8, y, 344, h, p.kind ? { kind: p.kind } : {});
    if (p.tag) s += tag(CX, y + 20, p.tag);
    s += p.draw(CX, y + 30);
    let ty = y + 30 + p.dh + 16;
    if (p.name) s += (p.bad ? nameWarn : nameGood)(CX, ty, p.name);
    for (const n of notes) { ty += 16; s += typeof n === 'string' ? text(CX, ty, n, { cls: 'fg-sm' }) : n(CX, ty); }
    y += h + 10;
  }
  for (const f of foot) { y += 10; s += text(CX, y, f, { cls: 'fg-sm' }); y += 6; }
  return { s, h: Math.ceil(y + 6) };
}
/* A figure built from stack(): the viewBox follows the content. */
function stacked(def, panels, foot) {
  const L = stack(panels, foot);
  FIGURES.push({ ...def, viewBox: `0 0 ${W} ${L.h}`, build: () => L.s });
}

/* ------------------------------------------------------------- rings --- */

/* One and two substituents. With two, both short-way numberings give {1,3},
   so this is the case where the alphabet decides. */
{
  const R = 40;
  const ring = (order, withEthyl) => (cx, top) => {
    const v = hex(cx, top + 50, R);
    const r = ringBonds(v);
    let t = r.s + methyl(v[2], r.c);
    if (withEthyl) t += ethyl(v[4], r.c, -1);
    if (order) t += ringNums(v, r.c, order);
    return t;
  };
  stacked({
    id: 'ring-two-substituents',
    section: T,
    lessons: [T],
    anchor: 'the ethyl is the one that gets C1.</p>',
    alt: 'Three cyclohexane rings, stacked. Top: methylcyclohexane, with no numbers. Middle: an ethyl and a methyl with one ring carbon between them, numbered from the ethyl carbon, giving 1-ethyl-3-methylcyclohexane. Bottom: the same molecule numbered from the methyl carbon, which also gives the set 1,3 but loses on alphabetical order: 3-ethyl-1-methylcyclohexane.',
    caption: 'Follow the numbers round each ring. Both numberings of the ethyl–methyl ring start on a substituted carbon and take the short way to the other one, and both land on 1 and 3.',
  }, [
    { tag: 'one substituent', dh: 100, draw: ring(null, false), name: 'methylcyclohexane', notes: ['no number: every ring carbon is equivalent'] },
    { kind: 'hi', tag: 'start at the ethyl', dh: 128, draw: ring([5, 4, 3, 2, 1, 6], true), name: '1-ethyl-3-methylcyclohexane', notes: ['set {1,3}, and ethyl is first in the alphabet'] },
    { kind: 'warn', tag: 'start at the methyl', dh: 128, draw: ring([5, 6, 1, 2, 3, 4], true), name: '3-ethyl-1-methylcyclohexane', bad: true, notes: ['also {1,3}: a tie, lost on the alphabet'] },
  ]);
}

/* Three substituents. The ethyl is first in the alphabet but does not get
   C1, because the locant set is compared before the alphabet is. */
{
  const ring = (order) => (cx, top) => {
    const v = hex(cx, top + 56, 40);
    const r = ringBonds(v);
    return r.s + methyl(v[5], r.c) + ethyl(v[4], r.c, -1) + methyl(v[2], r.c) + ringNums(v, r.c, order);
  };
  stacked({
    id: 'ring-three-substituents',
    section: T,
    lessons: [T],
    anchor: 'The alphabet never gets a say here.</p>',
    alt: 'The same trisubstituted cyclohexane numbered two ways, stacked. Top: numbered from the ethyl carbon, giving the set 1,2,5 and the rejected name 1-ethyl-2,5-dimethylcyclohexane. Bottom: numbered from the neighboring methyl carbon, giving the set 1,2,4 and the correct name 2-ethyl-1,4-dimethylcyclohexane.',
    caption: 'One molecule, two numberings. Read the three ring numbers that carry a substituent in each panel; the second set is lower at its third term, so it wins even though it hands the ethyl a 2.',
  }, [
    { kind: 'warn', tag: 'ethyl takes C1', dh: 132, draw: ring([3, 4, 5, 6, 1, 2]), name: '1-ethyl-2,5-dimethylcyclohexane', bad: true, notes: ['substituents on {1, 2, 5}'] },
    { kind: 'hi', tag: 'lowest set of locants', dh: 132, draw: ring([6, 5, 4, 3, 2, 1]), name: '2-ethyl-1,4-dimethylcyclohexane', notes: ['substituents on {1, 2, 4}'] },
  ], ['Term by term: 1 = 1, then 2 = 2, then 4 beats 5.']);
}

/* Ring against chain: which one is the parent. One ring radius throughout. */
{
  const R = 28;
  stacked({
    id: 'ring-or-chain',
    section: T,
    lessons: [T],
    anchor: 'most course exams still count carbons.)</p>',
    alt: 'Three molecules with the parent highlighted, stacked. Methylcyclohexane: the six-carbon ring beats the one-carbon methyl. 1-Cyclohexyloctane: the eight-carbon chain, numbered 1 to 8, beats the six-carbon ring. Pentylcyclopentane: a five-carbon ring and a five-carbon chain tie, and the ring is the parent.',
    caption: 'Count the ring carbons and the chain carbons in each molecule before looking at which part is highlighted.',
  }, [
    { kind: 'hi', tag: 'ring 6, chain 1', dh: 72, name: 'methylcyclohexane', notes: ['the ring wins'],
      draw: (cx, top) => { const v = hex(cx - 10, top + 36, R); const r = ringBonds(v, { hi: true }); return r.s + methyl(v[2], r.c, { word: false }); } },
    { kind: 'hi', tag: 'ring 6, chain 8', dh: 80, name: '1-cyclohexyloctane', notes: ['the chain wins'],
      draw: (cx, top) => {
        const v = hex(cx - 124, top + 50, R, 0);           // vertex 0 points right
        let t = ringBonds(v).s;
        const c = Array.from({ length: 8 }, (_, i) => P(v[0].x + 24 + i * 28, top + (i % 2 === 0 ? 34 : 50)));
        t += sk(v[0], c[0]);
        const bonds = c.slice(1).map((_, i) => [i, i + 1, 1]);
        t += chain(c, bonds);
        const nums = {}; c.forEach((_, i) => { nums[i] = i + 1; });
        return t + chainNums(c, bonds, nums, { 0: [v[0]] });
      } },
    { kind: 'hi', tag: 'ring 5, chain 5', dh: 72, name: 'pentylcyclopentane', notes: ['a tie goes to the ring'],
      draw: (cx, top) => {
        const v = poly(cx - 72, top + 40, 5, R, 0);
        let t = ringBonds(v, { hi: true }).s;
        const c = Array.from({ length: 5 }, (_, i) => P(v[0].x + 24 + i * 28, top + (i % 2 === 0 ? 26 : 40)));
        t += sk(v[0], c[0]);
        for (let i = 0; i < 4; i++) t += sk(c[i], c[i + 1]);
        return t;
      } },
  ], ['Highlighted bonds are the parent.']);
}

/* Phenyl against benzyl. */
{
  const ring = (cx, cy) => {
    const pts = hex(cx, cy, 30, 0);
    let g = '';
    for (let i = 0; i < 6; i++) g += sk(pts[i], pts[(i + 1) % 6]);
    g += `<circle class="fg-bond" cx="${cx}" cy="${cy}" r="18"></circle>`;
    return { g, right: pts[0] };
  };
  stacked({
    id: 'phenyl-vs-benzyl',
    section: T,
    lessons: [T],
    anchor: 'Confusing the two changes the molecule by a carbon, and both words are in constant use.</div>',
    alt: 'Two benzene rings as substituents, stacked. Phenyl is the ring attached directly through one of its own carbons, six carbons in all. Benzyl is the same ring attached through a CH2 carbon that sits between the ring and the parent, seven carbons in all; the extra carbon is highlighted.',
    caption: 'Phenyl and benzyl, one above the other. Find the carbon that bonds to the rest of the molecule: in phenyl it is a ring carbon, in benzyl it is the extra CH₂.',
    note: 'The reason the words matter beyond spelling is that the CH₂ in a benzyl group is the benzylic carbon, and the chemistry at that carbon (in <a class="chapter-ref" href="/ochem/learn.html#m-aromatic-breadth">Aromatic Follow-Through</a>) is nothing like the chemistry at a ring carbon. Benzyl alcohol is PhCH₂OH, a primary alcohol; phenol is PhOH, and is not an alcohol at all.',
  }, [
    { tag: 'phenyl: the ring itself', dh: 70, name: 'phenyl', notes: ['C₆H₅–, six carbons'],
      draw: (cx, top) => {
        const r = ring(cx - 20, top + 36);
        const A = P(r.right.x + 40, top + 36);
        return r.g + sk(r.right, A, true) + atom(A.x, A.y, '', { kind: 'hi', r: 5 });
      } },
    { tag: 'benzyl: the ring plus one CH₂', dh: 80, name: 'benzyl', notes: ['C₆H₅CH₂–, seven carbons'],
      draw: (cx, top) => {
        const cy = top + 46;
        const r = ring(cx - 36, cy);
        const ch2 = P(r.right.x + 30, cy - 18), A = P(ch2.x + 30, cy);
        return r.g + sk(r.right, ch2) + sk(ch2, A, true) + atom(A.x, A.y, '', { kind: 'hi', r: 5 }) +
          atom(ch2.x, ch2.y, '', { kind: 'warn', r: 6 }) + text(ch2.x + 2, ch2.y - 13, 'CH₂', { cls: 'fg-tag-warn', size: 10 });
      } },
  ], ['The dot is the bond to the rest of the molecule.']);
}

/* ---------------------------------------------------- multiple bonds --- */

{
  const drawChain = (n, dbl) => (cx, top) => {
    const w = (n - 1) * 40;
    const pts = zig(cx - w / 2, top + 50, n, 40, 26);
    const bonds = pts.slice(1).map((_, i) => [i, i + 1, dbl.includes(i) ? 2 : 1]);
    const nums = {}; pts.forEach((_, i) => { nums[i] = i + 1; });
    return chain(pts, bonds) + chainNums(pts, bonds, nums);
  };
  stacked({
    id: 'alkene-locants',
    section: T,
    lessons: [T],
    anchor: 'Number from the end nearer the double bond.</p>',
    alt: 'Three numbered chains, stacked. But-2-ene: the double bond joins C2 and C3, so its locant is 2. But-1-ene: the double bond joins C1 and C2, so its locant is 1. Penta-1,3-diene: double bonds join C1 to C2 and C3 to C4, so the locants are 1 and 3.',
    caption: 'Each double bond joins two numbered carbons. The name cites only the lower of the two.',
  }, [
    { kind: 'hi', dh: 70, draw: drawChain(4, [1]), name: 'but-2-ene', notes: ['C2=C3, written as 2'] },
    { kind: 'hi', dh: 70, draw: drawChain(4, [0]), name: 'but-1-ene', notes: ['C1=C2, written as 1'] },
    { kind: 'hi', dh: 70, draw: drawChain(5, [0, 2]), name: 'penta-1,3-diene', notes: ['C1=C2 and C3=C4, written as 1,3'] },
  ]);
}

/* 4-methylpent-2-ene and 4-methylpent-1-yne, each numbered from both ends. */
{
  // Vertex 3 carries the methyl, straight up.
  const alkene = (order) => (cx, top) => {
    const pts = zig(cx - 72, top + 70, 5, 36, 22);
    const br = P(pts[3].x, pts[3].y - 36);
    const bonds = [[0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 1]];
    const nums = {}; pts.forEach((_, i) => { nums[i] = order[i]; });
    return chain(pts, bonds) + sk(pts[3], br) + text(br.x + 6, br.y + 4, 'methyl', { cls: 'fg-sm', anchor: 'start' }) +
      chainNums(pts, bonds, nums, { 3: [br] });
  };
  // C1, C2 and C3 sit on one straight line: a triple bond is linear.
  const alkyne = (order) => (cx, top) => {
    const x0 = cx - 68, y0 = top + 74;
    const pts = [P(x0, y0 - 44), P(x0 + 34, y0 - 22), P(x0 + 68, y0), P(x0 + 102, y0 - 22), P(x0 + 136, y0)];
    const br = P(pts[3].x, pts[3].y - 36);
    const bonds = [[0, 1, 3], [1, 2, 1], [2, 3, 1], [3, 4, 1]];
    const nums = {}; pts.forEach((_, i) => { nums[i] = order[i]; });
    return chain(pts, bonds) + sk(pts[3], br) + text(br.x + 6, br.y + 4, 'methyl', { cls: 'fg-sm', anchor: 'start' }) +
      chainNums(pts, bonds, nums, { 3: [br] });
  };
  stacked({
    id: 'multiple-bond-first',
    section: T,
    lessons: [T],
    anchor: 'and the methyl gets what is left.</p>',
    alt: 'Two chains, each numbered from both ends, four panels stacked. Numbering the alkene for the methyl gives the methyl 2 and the double bond 3 (rejected, 2-methylpent-3-ene); numbering it for the double bond gives the double bond 2 and the methyl 4 (4-methylpent-2-ene). The same for a triple bond at the end of a chain: the correct name is 4-methylpent-1-yne and the rejected one is 2-methylpent-4-yne.',
    caption: 'Two molecules, each numbered from both ends. In each pair the first numbering gives the methyl the lower number and the second gives it to the multiple bond; the second is correct.',
  }, [
    { kind: 'warn', tag: 'numbered for the methyl', dh: 92, draw: alkene([5, 4, 3, 2, 1]), name: '2-methylpent-3-ene', bad: true, notes: ['methyl 2, double bond 3'] },
    { kind: 'hi', tag: 'numbered for the double bond', dh: 92, draw: alkene([1, 2, 3, 4, 5]), name: '4-methylpent-2-ene', notes: ['double bond 2, methyl 4'] },
    { kind: 'warn', tag: 'numbered for the methyl', dh: 96, draw: alkyne([5, 4, 3, 2, 1]), name: '2-methylpent-4-yne', bad: true, notes: ['methyl 2, triple bond 4'] },
    { kind: 'hi', tag: 'numbered for the triple bond', dh: 96, draw: alkyne([1, 2, 3, 4, 5]), name: '4-methylpent-1-yne', notes: ['triple bond 1, methyl 4'] },
  ]);
}

/* 3-methylidenehexane against 2-ethylpent-1-ene. Vertex 6 is the =CH2
   carbon, hanging below vertex 2. */
{
  const skel = (plain, nums, note) => (cx, top) => {
    const a = zig(cx - 90, top + 44, 6, 36, 22);
    const pts = [...a, P(a[2].x, a[2].y + 42)];
    const bonds = [[0, 1, 1, plain.includes(0)], [1, 2, 1, plain.includes(1)], [2, 3, 1, plain.includes(2)],
      [3, 4, 1, plain.includes(3)], [4, 5, 1, plain.includes(4)], [2, 6, 2, plain.includes(6)]];
    return chain(pts, bonds) + chainNums(pts, bonds, nums) + note(pts);
  };
  stacked({
    id: 'alkene-parent-contains',
    section: T,
    lessons: [T],
    anchor: 'used as a substituent).</p>',
    alt: 'One alkene traced twice, stacked. First: the six-carbon chain, the longest in the molecule, numbered 1 to 6, with the C=CH2 hanging off its third carbon; named 3-methylidenehexane and marked as not the textbook answer. Second: the five-carbon chain that starts at the CH2 of the double bond, numbered so the double bond is C1 to C2 and the ethyl is on C2; named 2-ethylpent-1-ene.',
    caption: 'One alkene, two candidate parents. Compare the highlighted chains: the first is longer but misses the double bond; the second runs through it, so the double bond gets C1 and the two carbons left over are an ethyl.',
  }, [
    { kind: 'warn', tag: 'the longest chain in the molecule', dh: 108, name: '3-methylidenehexane', bad: true,
      notes: ['six carbons, but the C=C hangs off it', 'not what a textbook or exam expects'],
      draw: skel([6], { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }, (p) => text(p[6].x + 8, p[6].y + 4, 'the C=C is off the chain', { cls: 'fg-sm', anchor: 'start' })) },
    { kind: 'hi', tag: 'the longest chain through the C=C', dh: 108, name: '2-ethylpent-1-ene',
      notes: ['five carbons, and the C=C is on the chain', 'the double bond takes the suffix and C1'],
      draw: skel([0, 1], { 6: 1, 2: 2, 3: 3, 4: 4, 5: 5 }, (p) => text(p[0].x - 6, p[0].y + 4, 'ethyl', { cls: 'fg-sm', anchor: 'end' })) },
  ]);
}

/* hex-5-en-1-ol against hex-1-en-6-ol. */
{
  const draw = (order) => (cx, top) => {
    const pts = zig(cx - 114, top + 50, 7, 38, 24);    // vertex 0 is the O
    const bonds = [[1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 2]];
    let t = bond(pts[1], pts[0], { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' }) + atom(pts[0].x, pts[0].y, 'OH', { kind: 'hi' });
    const nums = {}; for (let i = 1; i <= 6; i++) nums[i] = order[i - 1];
    return t + chain(pts, bonds) + chainNums(pts, bonds, nums, { 1: [pts[0]] });
  };
  stacked({
    id: 'hexenol-numbering',
    section: T,
    lessons: [T],
    anchor: 'even though the second gives the <i>double bond</i> the lower number.</p>',
    alt: 'A six-carbon chain with an OH on one end carbon and a double bond at the other end, numbered two ways, stacked. First: numbered from the double bond, giving the double bond 1 and the OH 6: hex-1-en-6-ol, rejected. Second: numbered from the OH carbon, giving the OH 1 and the double bond 5: hex-5-en-1-ol, correct.',
    caption: 'The same chain numbered from each end. Find the OH carbon and the pair of double-bond carbons in each panel.',
  }, [
    { kind: 'warn', tag: 'numbered from the double bond', dh: 70, draw: draw([6, 5, 4, 3, 2, 1]), name: 'hex-1-en-6-ol', bad: true, notes: ['C=C gets 1, OH gets 6'] },
    { kind: 'hi', tag: 'numbered from the OH', dh: 70, draw: draw([1, 2, 3, 4, 5, 6]), name: 'hex-5-en-1-ol', notes: ['OH gets 1, C=C gets 5'] },
  ], ['The OH is the principal group, so it claims the 1.']);
}

/* pent-3-en-1-yne and pent-1-en-4-yne, each numbered from both ends. */
{
  const draw = (dblAt, order) => (cx, top) => {
    const x0 = cx - 68, y0 = top + 70;
    // a-b-c zigzag; c-d-e straight, because d and e are the triple bond.
    const pts = [P(x0, y0), P(x0 + 34, y0 - 22), P(x0 + 68, y0), P(x0 + 102, y0 - 22), P(x0 + 136, y0 - 44)];
    const bonds = [[0, 1, dblAt === 0 ? 2 : 1], [1, 2, dblAt === 1 ? 2 : 1], [2, 3, 1], [3, 4, 3]];
    const nums = {}; pts.forEach((_, i) => { nums[i] = order[i]; });
    return chain(pts, bonds) + chainNums(pts, bonds, nums);
  };
  stacked({
    id: 'enyne-numbering',
    section: T,
    lessons: [T],
    anchor: 'Only a tie hands the 1 to the double bond.</p>',
    alt: 'Two five-carbon chains that each contain one double bond and one triple bond, each numbered from both ends, four panels stacked. CH3-CH=CH-C≡CH: from the CH3 end the bonds sit at 2 and 4; from the other end at 1 and 3, which is lower, so the name is pent-3-en-1-yne. CH2=CH-CH2-C≡CH: both directions give 1 and 4, a tie, so the double bond takes the 1: pent-1-en-4-yne, not pent-4-en-1-yne.',
    caption: 'Two molecules, each numbered from both ends. The straight run of three carbons at the right-hand end is the triple bond and its neighbor: a triple bond holds its carbons in a line.',
  }, [
    { kind: 'warn', tag: 'first molecule, one way', dh: 84, draw: draw(1, [1, 2, 3, 4, 5]), name: 'pent-2-en-4-yne', bad: true, notes: ['double bond 2, triple bond 4: {2, 4}'] },
    { kind: 'hi', tag: 'first molecule, the other way', dh: 84, draw: draw(1, [5, 4, 3, 2, 1]), name: 'pent-3-en-1-yne', notes: ['triple bond 1, double bond 3: {1, 3}'] },
    { kind: 'warn', tag: 'second molecule, one way', dh: 84, draw: draw(0, [5, 4, 3, 2, 1]), name: 'pent-4-en-1-yne', bad: true, notes: ['triple bond 1, double bond 4: {1, 4}'] },
    { kind: 'hi', tag: 'second molecule, the other way', dh: 84, draw: draw(0, [1, 2, 3, 4, 5]), name: 'pent-1-en-4-yne', notes: ['double bond 1, triple bond 4: {1, 4}', 'a tie, so the double bond gets the 1'] },
  ], ['First molecule: {1, 3} beats {2, 4}.']);
}

/* CH2=CH-CH2-CH(CH3)-C≡CH: the multiple bonds tie at {1,5}, the double bond
   takes the 1, and only then does the methyl get its number. Notes only. */
{
  const draw = (order) => (cx, top) => {
    const x0 = cx - 86, y0 = top + 60;
    const pts = [P(x0, y0), P(x0 + 34, y0 - 22), P(x0 + 68, y0), P(x0 + 102, y0 - 22), P(x0 + 136, y0), P(x0 + 170, y0 + 22)];
    const br = P(pts[3].x, pts[3].y - 34);
    const bonds = [[0, 1, 2], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 3]];
    const nums = {}; pts.forEach((_, i) => { nums[i] = order[i]; });
    return chain(pts, bonds) + sk(pts[3], br) + text(br.x + 6, br.y + 4, 'methyl', { cls: 'fg-sm', anchor: 'start' }) +
      chainNums(pts, bonds, nums, { 3: [br] });
  };
  stacked({
    id: 'enyne-tie-then-substituent',
    section: T,
    anchor: 'before the methyl is considered at all.</p>',
    alt: 'A six-carbon chain with a double bond at one end, a triple bond at the other and a methyl on the fourth carbon from the double-bond end, numbered both ways, stacked. From the triple-bond end the bonds are at 1 and 5 and the methyl at 3: 3-methylhex-5-en-1-yne, rejected. From the double-bond end the bonds are also at 1 and 5 and the methyl at 4: 4-methylhex-1-en-5-yne, correct.',
    caption: 'Both numberings give the multiple bonds {1, 5}. The double bond settles the tie, so the methyl has to take the 4.',
  }, [
    { kind: 'warn', tag: 'numbered from the triple bond', dh: 96, draw: draw([6, 5, 4, 3, 2, 1]), name: '3-methylhex-5-en-1-yne', bad: true, notes: ['multiple bonds {1, 5}, methyl 3'] },
    { kind: 'hi', tag: 'numbered from the double bond', dh: 96, draw: draw([1, 2, 3, 4, 5, 6]), name: '4-methylhex-1-en-5-yne', notes: ['multiple bonds {1, 5}, methyl 4'] },
  ]);
}

/* ------------------------------------------------------ rings with C=C --- */
/* Numbering a ring has no left end to start from. Two rings numbered in
   opposite directions make that checkable. Vertex 0 is the top; the double
   bond runs from vertex 0 to vertex 1 and the methyl sits on vertex 2. */
{
  const ring = (order) => (cx, top) => {
    const v = hex(cx - 16, top + 52, 44);
    const r = ringBonds(v, { dbl: [0] });
    return r.s + methyl(v[2], r.c) + ringNums(v, r.c, order, 0.58);
  };
  stacked({
    id: 'ring-numbering-direction',
    section: T,
    lessons: [T],
    anchor: 'as 3-methylcyclohexene.</p>',
    alt: 'One methylcyclohexene numbered counterclockwise and clockwise, stacked. Both give the double bond carbons 1 and 2; the methyl lands on C6 one way and on C3 the other.',
    caption: 'The same methylcyclohexene, numbered in both directions. In each panel, check that the numbering runs from C1 to C2 straight across the double bond before it reaches the methyl.',
  }, [
    { kind: 'warn', tag: 'round one way', dh: 106, draw: ring([2, 1, 6, 5, 4, 3]), name: '6-methylcyclohex-1-ene', bad: true, notes: ['methyl lands on C6'] },
    { kind: 'hi', tag: 'round the other', dh: 106, draw: ring([1, 2, 3, 4, 5, 6]), name: '3-methylcyclohex-1-ene', notes: ['methyl lands on C3'] },
  ], ['Both give the double bond 1 and 2; then 3 beats 6.']);
}

/* cyclohex-2-en-1-ol: the OH outranks the ring's double bond. Notes only. */
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

/* cis and trans 1,2-dimethylcyclohexane, with the solid and dashed wedges
   the course introduced in Molecular geometry. Notes only. */
FIGURES.push({
  id: 'cis-trans-ring',
  section: T,
  anchor: 'is often incomplete without cis or trans.</p>',
  alt: 'Two drawings of 1,2-dimethylcyclohexane. In the cis compound both methyls are drawn on solid wedges, so both point toward the viewer, on the same face of the ring. In the trans compound one methyl is on a solid wedge and the other on a dashed wedge, so they point to opposite faces.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const draw = (cx, trans) => {
      const v = hex(cx, 128, 42);
      const r = ringBonds(v);
      let t = r.s;
      for (const [i, back] of [[1, false], [2, trans]]) {
        const u = unit(r.c, v[i]), e = along(v[i], u, 36);
        t += back ? hash(v[i], e, { rFrom: 0, rTo: 0, width: 8 }) : wedge(v[i], e, { rFrom: 0, rTo: 0, width: 8 });
        t += endWord(e, u, 'methyl');
      }
      t += ringNums(v, r.c, [null, 1, 2, null, null, null]);
      return t;
    };
    s += panel(12, 40, 360, 178, { kind: 'hi' });
    s += tag(192, 28, 'same face');
    s += draw(170, false);
    s += text(192, 204, 'both methyls toward you', { cls: 'fg-sm' });
    s += nameGood(192, 240, 'cis-1,2-dimethylcyclohexane');
    s += panel(388, 40, 360, 178, { kind: 'hi' });
    s += tag(568, 28, 'opposite faces');
    s += draw(546, true);
    s += text(568, 204, 'one toward you, one away', { cls: 'fg-sm' });
    s += nameGood(568, 240, 'trans-1,2-dimethylcyclohexane');
    s += rule(12, 258, 748, 258);
    s += text(380, 282, 'Key: a solid wedge points toward you; a dashed wedge points away from you.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Picture the ring lying flat on the page. The solid and dashed wedges say which side of that flat ring each methyl is on.',
});

/* cis and trans but-2-ene. */
{
  const butene = (trans) => (cx, top) => {
    const cy = top + 40;
    const c1 = P(cx - 52, cy + 22), c2 = P(cx - 18, cy + 2), c3 = P(cx + 18, cy + 2), c4 = P(cx + 52, trans ? cy - 18 : cy + 22);
    let t = sk(c1, c2) + bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.5 }) + sk(c3, c4);
    t += text(c1.x - 6, c1.y + 4, 'methyl', { cls: 'fg-sm', anchor: 'end' });
    t += text(c4.x + 6, c4.y + 4, 'methyl', { cls: 'fg-sm', anchor: 'start' });
    t += text(c2.x, c2.y - 12, '2', { cls: 'fg-lbl', size: 11 });
    t += text(c3.x, c3.y - 12, '3', { cls: 'fg-lbl', size: 11 });
    return t;
  };
  stacked({
    id: 'cis-trans-but-2-ene',
    section: T,
    lessons: [T],
    anchor: 'The name so far cannot tell them apart.</p>',
    alt: 'Two skeletal drawings of but-2-ene, stacked. In cis-but-2-ene both methyl carbons sit below the double bond, on the same side; in trans-but-2-ene one sits below and one above, on opposite sides.',
    caption: 'Two compounds that the name but-2-ene does not distinguish. A methyl drawn below the double bond stays below it, so these are two different molecules with different boiling points, not two drawings of one.',
    note: 'Read the prefix off the drawing: find the two groups that are not hydrogen, one on each alkene carbon, and ask whether they are on the same side of the double bond. Same side is <i>cis</i>, opposite is <i>trans</i>. When one of the alkene carbons carries two groups that are not hydrogen the words stop being enough, which is what the E/Z system is for.',
  }, [
    { kind: 'hi', tag: 'same side', dh: 72, draw: butene(false), name: 'cis-but-2-ene', notes: ['both methyls below the C=C'] },
    { kind: 'hi', tag: 'opposite sides', dh: 72, draw: butene(true), name: 'trans-but-2-ene', notes: ['one methyl below, one above'] },
  ]);
}

/* ---------------------------------------------------------- benzene --- */

{
  const ring = (at) => (cx, top) => {
    const v = hex(cx, top + 66, 38);
    const r = ringBonds(v, { dbl: [0, 2, 4], inset: 8 });
    let t = r.s;
    for (const i of [0, at]) t += methyl(v[i], r.c, { word: false, len: 26 });
    return t + ringNums(v, r.c, [1, 2, 3, 4, 5, 6], 0.52);
  };
  // The common name, with its o/m/p letter in italics, as the prose writes it.
  const common = (letter) => (x, y) =>
    `<text class="fg-sm" x="${x}" y="${y}" text-anchor="middle" font-size="10">also called <tspan font-style="italic">${letter}</tspan>-xylene</text>`;
  stacked({
    id: 'ortho-meta-para',
    section: T,
    lessons: [T],
    anchor: 'and the three give <b>1,2-</b>, <b>1,3-</b> and <b>1,4-dimethylbenzene</b>.</p>',
    alt: 'Three benzene rings, stacked, each with two methyl groups and all six ring carbons numbered. Ortho: methyls on C1 and C2, adjacent. Meta: methyls on C1 and C3, with one ring carbon between them. Para: methyls on C1 and C4, directly across the ring.',
    caption: 'Two methyls on a benzene ring, in each of the three possible positions. Count the ring carbons from one methyl to the other.',
    note: 'There are only three because the ring is symmetric: a 1,5 relationship is the same as 1,3 counted the other way round, and 1,6 is 1,2. Whichever of the two groups you call C1, the other lands on 2, 3 or 4, and that is the whole vocabulary.',
  }, [
    { kind: 'hi', tag: 'ortho (1,2)', dh: 132, draw: ring(1), name: '1,2-dimethylbenzene', notes: [common('o')] },
    { kind: 'hi', tag: 'meta (1,3)', dh: 132, draw: ring(2), name: '1,3-dimethylbenzene', notes: [common('m')] },
    { kind: 'hi', tag: 'para (1,4)', dh: 132, draw: ring(3), name: '1,4-dimethylbenzene', notes: [common('p')] },
  ]);
}

/* ------------------------------------------- lesson-only question art ---
   Unnumbered on purpose: the question asks for the numbering. */

FIGURES.push({
  id: 'q-ring-bromo-dimethyl',
  lessons: [T],
  alt: 'A cyclohexane ring carrying two methyl groups on neighboring carbons and a bromine two carbons further round from one of them. The ring is not numbered.',
  viewBox: '0 0 360 190',
  build() {
    const v = hex(170, 96, 44);
    const r = ringBonds(v);
    return r.s + methyl(v[1], r.c) + methyl(v[2], r.c) + hetero(v[4], r.c, 'Br');
  },
  caption: 'Find every numbering that starts on a substituted carbon, and write down its locant set.',
});

FIGURES.push({
  id: 'q-hexene',
  lessons: [T],
  alt: 'A six-carbon zigzag chain with a double bond between the second and third carbons counted from the right-hand end. The chain is not numbered.',
  viewBox: '0 0 360 110',
  build() {
    const pts = zig(80, 72, 6, 40, 26);
    const bonds = [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 2], [4, 5, 1]];
    return chain(pts, bonds, { hi: false });
  },
  caption: 'Number the chain from the end that reaches the double bond first.',
});

FIGURES.push({
  id: 'q-enyne',
  lessons: [T],
  alt: 'A six-carbon chain. At the left end a methyl carbon joins a double bond; in the middle is a CH2; at the right end is a triple bond, drawn with its carbons in a straight line. The chain is not numbered.',
  viewBox: '0 0 360 120',
  build() {
    const x0 = 95, y0 = 56;
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
  viewBox: '0 0 360 150',
  build() {
    const pts = zig(100, 112, 5, 40, 26);
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
  viewBox: '0 0 360 190',
  build() {
    const v = hex(186, 94, 42);
    const r = ringBonds(v, { dbl: [0, 2, 4], inset: 8 });
    return r.s + hetero(v[1], r.c, 'Cl') + methyl(v[4], r.c);
  },
  caption: 'Count the ring carbons from one substituent round to the other.',
});

FIGURES.push({
  id: 'q-ring-chain-oh',
  lessons: [T],
  alt: 'A cyclohexane ring bonded to the end of an eight-carbon zigzag chain; the far end of the chain carries an OH.',
  viewBox: '0 0 360 110',
  build() {
    const v = hex(34, 64, 24, 0);
    let s = ringBonds(v).s;
    const c = Array.from({ length: 8 }, (_, i) => P(v[0].x + 22 + i * 30, i % 2 === 0 ? 50 : 64));
    s += sk(v[0], c[0]);
    for (let i = 0; i < 7; i++) s += sk(c[i], c[i + 1]);
    const o = P(c[7].x + 26, c[7].y - 14);
    s += bond(c[7], o, { rFrom: 0, rTo: 16 }) + atom(o.x, o.y, 'OH', { kind: 'hi' });
    return s;
  },
  caption: 'Count the ring carbons and the chain carbons, and find the OH.',
});

export default FIGURES;
