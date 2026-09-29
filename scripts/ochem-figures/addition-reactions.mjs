/* Figures for the addition-reactions notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Two drawing styles are used. Chains that only need to show which bond
   forms are skeletal. Anything that has to show a FACE of the alkene uses a
   perspective drawing: the alkene's plane is seen edge-on from slightly above,
   so the C=C runs across the page, the group on each carbon that points
   toward the reader is a wedge and the one pointing away is a hash, "top
   face" is up the page and "bottom face" is down the page.

   Every perspective drawing that carries an R/S label also records its atoms
   in CHECKS (z toward the reader for a wedge, away for a hash). A script
   outside the site rebuilds each molecule in 3D and compares the CIP label
   RDKit assigns with the label drawn. Nothing on the site uses CHECKS.

   Lesson copies (id prefix l-) are 340 wide or less, stacked, and use only
   fg-lbl and fg-tag text. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, rule, panel, P } from '../lib/ochem-figure.mjs';
import { sk, polyPts } from '../lib/ochem-skeletal.mjs';
import { skDouble, lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const r2 = (v) => Math.round(v * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
const SIZE = { 'fg-lbl': 13, 'fg-sm': 10.5 };
const T = (x, y, s, cls = 'fg-tag', anchor = 'middle') =>
  text(x, y, s, { cls, size: SIZE[cls] ?? 11, anchor });
/* A text line whose parts may be italic: a part starting with '*' is set in
   italic (cis, trans, meso). */
function rich(x, y, parts, cls = 'fg-tag', anchor = 'middle') {
  const body = parts.map((p) => (p[0] === '*'
    ? `<tspan font-style="italic">${p.slice(1)}</tspan>` : p.replace(/&/g, '&amp;'))).join('');
  return `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" font-size="${SIZE[cls] ?? 11}">${body}</text>`;
}
const rOf = (l) => (l === 'H' ? 12 : [...l].length <= 2 ? 15 : [...l].length === 3 ? 17 : 21);
const stereo = (kind, a, b, rTo, rFrom = 0) => (kind === 'w'
  ? wedge(a, b, { rFrom, rTo, width: 9 })
  : kind === 'h' ? hash(a, b, { rFrom, rTo, width: 11, rungs: 5 })
  : bond(a, b, { rFrom, rTo }));
/* A group on a bond of the given kind ('w', 'h' or 'p'), from carbon c. */
function grp(c, deg, len, label, kind, o = {}) {
  const p = at(c, deg, len);
  return { p, s: stereo(kind, c, p, rOf(label), o.rFrom ?? 0) + atom(p.x, p.y, label, { r: rOf(label), kind: o.hi ? 'hi' : 'plain' }) };
}
const charge = (x, y, sign = '+') => T(x, y, sign === '+' ? '+' : '−', 'fg-tag-warn');
const dashLine = (a, b, cls = 'fg-dash-hi') =>
  `<line class="${cls}" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"></line>`;
/* A labelled carbon in a perspective drawing: a small disc with a C. */
const C = (p, kind = 'plain') => atom(p.x, p.y, 'C', { r: 12, kind });

/* ------------------------------------------------ the 3D check record --- */
export const CHECKS = [];
let CUR = null;
function molStart(name) { CUR = { name, atoms: [], bonds: [], claims: {} }; CHECKS.push(CUR); }
function A(el, p, z = 0) { CUR.atoms.push({ el, x: r2(p.x), y: r2(p.y), z: r2(z) }); return CUR.atoms.length - 1; }
function B(i, j, o = 1) { CUR.bonds.push([i, j, o]); }
const claim = (i, s) => { CUR.claims[i] = s; };
const Z = { w: 26, h: -26, p: 0 };

/* =================================================== pi-bond-exposed ===
   Ethene seen edge-on: the sigma framework in the plane, the pi electrons
   above and below it, and an H-Br coming in from above. */
function piExposed() {
  let s = '';
  const c1 = P(130, 150), c2 = P(210, 150);
  s += lobeE(170, 112, 60, 24) + lobeE(170, 188, 60, 24);
  s += bond(c1, c2, { rFrom: 13, rTo: 13 });
  s += C(c1) + C(c2);
  for (const [c, deg] of [[c1, 165], [c1, 200], [c2, 15], [c2, -20]]) {
    const p = at(c, deg, 44);
    s += bond(c, p, { rFrom: 13, rTo: 11 }) + atom(p.x, p.y, 'H', { r: 11 });
  }
  s += T(60, 104, 'π electrons', 'fg-tag-good');
  s += T(60, 118, 'above', 'fg-tag-good');
  s += T(60, 200, 'π electrons', 'fg-tag-good');
  s += T(60, 214, 'below', 'fg-tag-good');
  s += T(170, 246, 'σ bonds: all in one plane', 'fg-tag');
  /* H-Br above the pi cloud */
  const h = P(238, 58), br = P(292, 40);
  s += bond(h, br, { rFrom: 12, rTo: 15 });
  s += atom(h.x, h.y, 'H', { r: 12, kind: 'hi' }) + atom(br.x, br.y, 'Br', { r: 15 });
  s += curve(P(196, 92), P(230, 69), { bow: 12 });
  s += curve(P(266, 46), P(292, 24), { bow: -12 });
  s += T(170, 22, 'ethene, seen edge-on', 'fg-lbl');
  return s;
}
FIGURES.push({
  id: 'pi-bond-exposed',
  section: 'addition-reactions',
  anchor: '<h3>The alkene is the nucleophile now</h3>',
  viewBox: '0 0 340 260',
  alt: 'Ethene seen edge-on. The two carbons and four hydrogens lie in one plane, drawn as a horizontal row. The pi electrons form one cloud above that plane and one below it. An H–Br molecule sits above the upper cloud: a curved arrow runs from the upper pi cloud to the H, and a second curved arrow runs from the H–Br bond to the Br.',
  build: piExposed,
  caption: 'Ethene seen along the edge of its plane. The two shaded clouds are the two halves of one π bond.',
});

/* ================================================ HBr + but-1-ene ===
   Three steps: the pi bond takes the proton (two arrows), bromide captures
   the secondary cation, and the flat cation gives both enantiomers. Each
   panel draws inside a 240 x 200 area whose top-left corner is (ox, oy). */
const BUT = (ox, oy) => [P(ox + 50, oy + 150), P(ox + 90, oy + 126), P(ox + 130, oy + 150), P(ox + 170, oy + 126)];
function hbr1(ox, oy) {
  let s = '';
  const [c1, c2, c3, c4] = BUT(ox, oy);
  s += skDouble(c1, c2, P(ox + 72, oy + 170)) + sk(c2, c3) + sk(c3, c4);
  const h = P(ox + 82, oy + 66), br = P(ox + 140, oy + 66);
  s += bond(h, br, { rFrom: 12, rTo: 15 });
  s += atom(h.x, h.y, 'H', { r: 12, kind: 'hi' }) + atom(br.x, br.y, 'Br', { r: 15 });
  s += curve(P(ox + 66, oy + 132), P(ox + 78, oy + 81), { bow: -14 });
  s += curve(P(ox + 110, oy + 62), P(ox + 136, oy + 48), { bow: -12 });
  s += T(c1.x - 8, c1.y + 20, 'C1') + T(c2.x, c2.y + 30, 'C2');
  return s;
}
function hbr2(ox, oy) {
  let s = '';
  const [c1, c2, c3, c4] = BUT(ox, oy);
  s += bond(c1, c2, { rFrom: 17, rTo: 0 }) + sk(c2, c3) + sk(c3, c4);
  s += atom(c1.x, c1.y, 'CH₃', { r: 17, kind: 'hi' }) + T(c1.x + 4, c1.y + 32, 'C1 got the H');
  s += charge(c2.x, c2.y - 12);
  const br = P(ox + 178, oy + 62);
  s += atom(br.x, br.y, 'Br', { r: 15 });
  s += charge(br.x + 31, br.y + 2, '-');
  for (const a of [148, 238, 328, 58]) s += lonePair(br.x, br.y, a, { dist: 21 });
  s += curve(P(br.x - 22, br.y + 13), P(c2.x + 8, c2.y - 6), { bow: 16 });
  return s;
}
/* 2-Bromobutane with the Br on C2 on a wedge ('w') or a hash ('h'). */
function bromobutane(x0, y0, kind) {
  let s = '';
  const c = [P(x0, y0 + 24), P(x0 + 32, y0), P(x0 + 64, y0 + 24), P(x0 + 96, y0)];
  s += sk(c[0], c[1]) + sk(c[1], c[2]) + sk(c[2], c[3]);
  s += grp(c[1], 90, 46, 'Br', kind, { hi: true }).s;
  return s;
}
function hbr3(ox, oy) {
  let s = '';
  s += bromobutane(ox + 10, oy + 128, 'w');
  s += bromobutane(ox + 130, oy + 128, 'h');
  s += T(ox + 58, oy + 186, 'Br in front') + T(ox + 178, oy + 186, 'Br behind');
  return s;
}
const HBR_TITLES = ['1 · the π bond takes the H', '2 · bromide meets the cation', '3 · two faces, two products'];
const HBR_TAGS = ['but-1-ene + HBr', 'a secondary cation on C2', '50 : 50, a racemic mixture'];
FIGURES.push({
  id: 'hbr-addition',
  section: 'addition-reactions',
  anchor: '<h3>Hydrohalogenation (HX addition)</h3>',
  viewBox: '0 0 760 270',
  alt: 'HBr adding to but-1-ene in three panels. Panel 1: one curved arrow runs from the C1=C2 double bond to the H of H–Br, and a second runs from the H–Br bond to the Br. Panel 2: C1 is now a CH3 group and C2 carries a positive charge, a secondary carbocation; a curved arrow runs from a lone pair on bromide ion to C2. Panel 3: two products, 2-bromobutane with the Br on a wedge and 2-bromobutane with the Br on a hash, formed 50:50 as a racemic mixture.',
  build() {
    let s = '';
    [hbr1, hbr2, hbr3].forEach((f, i) => {
      const ox = 10 + i * 250;
      s += panel(ox, 8, 240, 254);
      s += T(ox + 120, 32, HBR_TITLES[i], 'fg-tag-good');
      s += f(ox, 28);
      s += T(ox + 120, 250, HBR_TAGS[i]);
    });
    s += arrow(P(242, 150), P(268, 150), { muted: true }) + arrow(P(492, 150), P(518, 150), { muted: true });
    return s;
  },
  caption: 'Follow the arrows: each one starts on a pair of electrons and ends where that pair makes its new bond.',
});
FIGURES.push({
  id: 'l-hbr-addition',
  lessons: ['addition-reactions'],
  viewBox: '0 0 340 690',
  alt: 'HBr adding to but-1-ene in three stacked panels. Top: curved arrows from the C1=C2 double bond to the H of H–Br and from the H–Br bond to the Br. Middle: a secondary carbocation on C2, with C1 now a CH3 group, and a curved arrow from a lone pair of bromide ion to C2. Bottom: the two enantiomers of 2-bromobutane, Br on a wedge and Br on a hash, formed 50:50.',
  build() {
    let s = '';
    [hbr1, hbr2, hbr3].forEach((f, i) => {
      const oy = 6 + i * 228;
      s += panel(10, oy, 320, 216);
      s += T(170, oy + 24, HBR_TITLES[i], 'fg-tag-good');
      s += f(50, oy + [10, 10, -14][i]);
      s += T(170, oy + 206, HBR_TAGS[i]);
    });
    return s;
  },
  caption: 'Read the panels from top to bottom.',
});

/* ================================================ hydride-shift-worked ===
   3-Methylbut-1-ene + HCl. The chain is drawn the same way in every stage:
   C1 and C3 on the baseline, C2 and C4 raised, the C3 methyl straight down,
   and whatever C3 gains or loses at its lower right. */
function mbStage(x, mode) {
  const c1 = P(x, 168), c2 = P(x + 36, 146), c3 = P(x + 72, 168), c4 = P(x + 108, 146), me = P(x + 72, 212);
  let g = mode === 'alkene' ? skDouble(c1, c2, P(x + 20, 190)) : sk(c1, c2);
  g += sk(c2, c3) + sk(c3, c4) + sk(c3, me);
  return { g, c1, c2, c3, c4, me, lr: P(x + 104, 194) };
}
function hydrideShift() {
  let s = '';
  // 1: alkene + HCl
  let t = mbStage(30, 'alkene'); s += t.g;
  const h = P(58, 88), cl = P(110, 88);
  s += bond(h, cl, { rFrom: 12, rTo: 15 }) + atom(h.x, h.y, 'H', { r: 12, kind: 'hi' }) + atom(cl.x, cl.y, 'Cl', { r: 15 });
  s += curve(P(46, 154), P(55, 103), { bow: -12 });
  s += curve(P(84, 84), P(108, 70), { bow: -12 });
  s += T(84, 240, '3-methylbut-1-ene');
  s += T(84, 256, '+ HCl');
  s += arrow(P(160, 168), P(192, 168), { muted: true });
  // 2: secondary cation, hydride about to move
  t = mbStage(214, 'cation'); s += t.g;
  s += charge(t.c2.x, t.c2.y - 12);
  s += bond(t.c3, t.lr, { rFrom: 0, rTo: 11 }) + atom(t.lr.x, t.lr.y, 'H', { r: 11, kind: 'hi' });
  s += curve(P(t.c3.x + 17, t.c3.y + 14), P(t.c2.x + 6, t.c2.y + 8), { bow: 30 });
  s += T(268, 240, '2° cation on C2', 'fg-tag-warn');
  s += T(268, 256, 'H moves with its bond pair');
  s += arrow(P(344, 168), P(376, 168), { muted: true });
  // 3: tertiary cation; chloride arrives
  t = mbStage(398, 'cation'); s += t.g;
  const hn = P(t.c2.x, t.c2.y - 42);
  s += bond(t.c2, hn, { rFrom: 0, rTo: 11 }) + atom(hn.x, hn.y, 'H', { r: 11, kind: 'hi' });
  s += charge(t.c3.x - 14, t.c3.y + 24);
  const clm = P(t.c3.x + 64, t.c3.y + 44);
  s += atom(clm.x, clm.y, 'Cl', { r: 15 }) + charge(clm.x + 31, clm.y + 2, '-');
  for (const a of [202, 292, 22, 112]) s += lonePair(clm.x, clm.y, a, { dist: 21 });
  s += curve(P(clm.x - 20, clm.y - 7), P(t.c3.x + 8, t.c3.y + 8), { bow: -12 });
  s += T(452, 240, '3° cation on C3', 'fg-tag-good');
  s += T(452, 256, 'more stable');
  s += arrow(P(536, 168), P(568, 168), { muted: true });
  // 4: product
  t = mbStage(592, 'cation'); s += t.g;
  s += bond(t.c3, t.lr, { rFrom: 0, rTo: 15 }) + atom(t.lr.x, t.lr.y, 'Cl', { r: 15, kind: 'hi' });
  s += T(646, 240, '2-chloro-2-methylbutane', 'fg-tag-good');
  s += T(646, 256, 'the rearranged chloride');
  s += T(380, 28, 'A hydride shift can turn the 2° cation into a 3° cation before chloride arrives.', 'fg-lbl');
  s += T(380, 288, 'Chloride also catches some 2° cation before it shifts, which gives 2-chloro-3-methylbutane.');
  return s;
}
FIGURES.push({
  id: 'hydride-shift-worked',
  section: 'addition-reactions',
  anchor: 'Every time you draw a carbocation, check for the shift.</div>',
  viewBox: '0 0 760 300',
  alt: '3-Methylbut-1-ene plus HCl in four stages. First, curved arrows run from the C1=C2 double bond to the H of H–Cl and from the H–Cl bond to the Cl. Second, the secondary cation on C2; a curved arrow starts on the C3–H bond and ends at C2, moving that hydrogen with its bonding pair. Third, the H now sits on C2 and the positive charge on C3, a tertiary cation; a curved arrow runs from a lone pair of chloride ion to C3. Fourth, the product, 2-chloro-2-methylbutane. A note says chloride also catches some of the secondary cation before it shifts, giving 2-chloro-3-methylbutane.',
  build: hydrideShift,
  caption: 'In stage 2, note where the curved arrow starts: on the C&ndash;H bond, not on the H. The H moves with its bonding pair, as a hydride; an arrow drawn from the H itself would mean a proton transfer, which would leave an alkene instead of a rearranged cation.',
});

/* ============================================ bromination, perspective ===
   cis- or trans-but-2-ene, the bromonium ion, and the products. C2 is on
   the left, C3 on the right. C2's methyl is always the front group; C3's
   methyl is in front for cis and behind for trans. */
const FRONT3 = (cis) => (cis ? 'CH₃' : 'H');
const BACK3 = (cis) => (cis ? 'H' : 'CH₃');
function alkeneP(cx, cy, cis) {
  const c2 = P(cx - 28, cy), c3 = P(cx + 28, cy);
  let s = bond(c2, c3, { order: 2, rFrom: 12, rTo: 12, gap: 3 });
  s += grp(c2, 215, 44, 'CH₃', 'w', { rFrom: 12 }).s + grp(c2, 150, 40, 'H', 'h', { rFrom: 12 }).s;
  s += grp(c3, 325, 44, FRONT3(cis), 'w', { rFrom: 12 }).s + grp(c3, 30, 44, BACK3(cis), 'h', { rFrom: 12 }).s;
  s += C(c2) + C(c3);
  return { s, c2, c3 };
}
function bromoniumP(cx, cy, cis, o = {}) {
  const c2 = P(cx - 30, cy), c3 = P(cx + 30, cy), br = P(cx, cy - 54);
  let s = bond(c2, c3, { rFrom: 12, rTo: 12 });
  s += bond(c2, br, { rFrom: 12, rTo: 15 }) + bond(c3, br, { rFrom: 12, rTo: 15 });
  s += grp(c2, 222, 44, 'CH₃', 'w', { rFrom: 12 }).s + grp(c2, 168, 40, 'H', 'h', { rFrom: 12 }).s;
  s += grp(c3, 318, 44, FRONT3(cis), 'w', { rFrom: 12 }).s + grp(c3, 12, 44, BACK3(cis), 'h', { rFrom: 12 }).s;
  s += C(c2) + C(c3) + atom(br.x, br.y, 'Br', { r: 15, kind: 'hi' });
  s += charge(br.x + 20, br.y - 10);
  return { s, c2, c3, br };
}
/* The dibromide as it forms. path 'C3': bromide attacked C3 from below, so
   the bridging Br stays on C2 (up) and the new Br is on C3 (down). path
   'C2': the reverse. rs: [C2 label, C3 label], or null for no labels. */
function dibromideP(cx, cy, cis, path, rs, check) {
  const c2 = P(cx - 32, cy), c3 = P(cx + 32, cy);
  const ang = path === 'C3'
    ? { br2: 90, f2: 230, b2: 180, br3: 270, f3: 0, b3: 50, t2: 285, t3: 105 }
    : { br2: 270, f2: 180, b2: 130, br3: 90, f3: 310, b3: 0, t2: 75, t3: 255 };
  let s = bond(c2, c3, { rFrom: 12, rTo: 12 });
  const g = [
    [c2, ang.br2, 'Br', 'p', true], [c2, ang.f2, 'CH₃', 'w'], [c2, ang.b2, 'H', 'h'],
    [c3, ang.br3, 'Br', 'p', true], [c3, ang.f3, FRONT3(cis), 'w'], [c3, ang.b3, BACK3(cis), 'h'],
  ];
  const pts = g.map(([c, d, l, k, hi]) => {
    const r = grp(c, d, l === 'H' ? 40 : 44, l, k, { rFrom: 12, hi });
    s += r.s;
    return r.p;
  });
  s += C(c2) + C(c3);
  if (rs) {
    const p2 = at(c2, ang.t2, 26), p3 = at(c3, ang.t3, 26);
    s += T(p2.x, p2.y + 4, '2' + rs[0], 'fg-tag-good') + T(p3.x, p3.y + 4, '3' + rs[1], 'fg-tag-good');
    molStart(check);
    const i2 = A('C', c2), i3 = A('C', c3);
    B(i2, i3);
    g.forEach(([c, , l, k], j) => {
      const el = l === 'Br' ? 'Br' : l === 'H' ? 'H' : 'C';
      B(c === c2 ? i2 : i3, A(el, pts[j], Z[k]));
    });
    claim(i2, rs[0]); claim(i3, rs[1]);
  }
  return s;
}
/* One panel of the mechanism, drawn in a 240 x 200 area. */
function brom1(ox, oy) {
  const cx = ox + 120, cy = oy + 140;
  let { s, c2 } = alkeneP(cx, cy, true);
  const ba = P(cx, cy - 62), bb = P(cx + 58, cy - 92);
  s += bond(ba, bb, { rFrom: 15, rTo: 15 });
  s += atom(ba.x, ba.y, 'Br', { r: 15, kind: 'hi' }) + atom(bb.x, bb.y, 'Br', { r: 15 });
  s += lonePair(ba.x, ba.y, 160, { dist: 20 });
  s += curve(P(cx + 6, cy - 6), P(cx + 6, cy - 45), { bow: 10 });
  s += curve(P(ba.x - 20, ba.y + 7), P(c2.x - 4, c2.y - 13), { bow: 12 });
  s += curve(P(cx + 30, cy - 78), P(bb.x + 2, bb.y - 17), { bow: -14 });
  return s;
}
function brom2(ox, oy) {
  const cx = ox + 120, cy = oy + 104;
  let { s, c3, br } = bromoniumP(cx, cy, true);
  const bm = P(cx + 40, cy + 70);
  s += atom(bm.x, bm.y, 'Br', { r: 15 }) + charge(bm.x + 30, bm.y + 2, '-');
  for (const a of [250, 340, 70, 160]) s += lonePair(bm.x, bm.y, a, { dist: 20 });
  s += curve(P(bm.x - 7, bm.y - 20), P(c3.x + 2, c3.y + 13), { bow: -8 });
  s += curve(P(cx + 18, cy - 24), P(br.x + 15, br.y + 4), { bow: 14 });
  return s;
}
function brom3(ox, oy) {
  return dibromideP(ox + 120, oy + 110, true, 'C3', null);
}
const BROM_TITLES = ['1 · the π bond attacks Br₂', '2 · bromide attacks from below', '3 · one Br on each face'];
FIGURES.push({
  id: 'bromonium-mechanism',
  section: 'addition-reactions',
  anchor: '<h3>Halogenation: no carbocation, no rearrangement</h3>',
  viewBox: '0 0 760 270',
  alt: 'Br2 adding to cis-but-2-ene, drawn in perspective with the C=C across the page, the methyl groups on wedges toward the reader and the hydrogens on hashes. Panel 1: a Br–Br molecule stands above the double bond; curved arrows run from the pi bond to the lower Br, from a lone pair on that Br to C2, and from the Br–Br bond to the upper Br. Panel 2: the bromonium ion, a three-membered ring with a positive bromine above the C2–C3 bond; a bromide ion below the molecule attacks C3 from underneath, and a curved arrow from the C3–Br bond back to the bromine opens the ring. Panel 3: the product, with one Br pointing up from C2 and the other pointing down from C3.',
  build() {
    let s = '';
    [brom1, brom2, brom3].forEach((f, i) => {
      const ox = 10 + i * 250;
      s += panel(ox, 8, 240, 254);
      s += T(ox + 120, 32, BROM_TITLES[i], 'fg-tag-good');
      s += f(ox, 40);
    });
    s += arrow(P(242, 150), P(268, 150), { muted: true }) + arrow(P(492, 150), P(518, 150), { muted: true });
    s += rich(130, 250, ['*cis', '-but-2-ene + Br₂']);
    s += T(380, 250, 'the bromonium ion', 'fg-tag-warn');
    s += T(630, 250, 'one Br on top, one below: anti');
    return s;
  },
  caption: 'The alkene is drawn edge-on, seen from slightly above: wedges point toward you, hashes away, and the top face is up the page.',
});
FIGURES.push({
  id: 'l-bromonium-mechanism',
  lessons: ['addition-reactions'],
  viewBox: '0 0 340 700',
  alt: 'Br2 adding to cis-but-2-ene in three stacked panels, drawn in perspective with the methyl groups on wedges and the hydrogens on hashes. Top: curved arrows from the pi bond to the lower Br of Br–Br, from a lone pair on that Br to C2, and from the Br–Br bond to the upper Br. Middle: the bromonium ion with the positive bromine above the ring; a bromide ion below attacks C3 from underneath, and a curved arrow from the C3–Br bond to the bromine opens the ring. Bottom: the product, one Br up from C2 and one Br down from C3.',
  build() {
    let s = '';
    const tags = [['*cis', '-but-2-ene + Br₂'], ['the bromonium ion'], ['one Br up, one Br down: anti']];
    [brom1, brom2, brom3].forEach((f, i) => {
      const oy = 6 + i * 232;
      s += panel(10, oy, 320, 222);
      s += T(170, oy + 24, BROM_TITLES[i], 'fg-tag-good');
      s += f(50, oy + [8, 1, 6][i]);
      s += rich(170, oy + 212, tags[i]);
    });
    return s;
  },
  caption: 'Wedges point toward you and hashes away. The top face of the alkene is up the page.',
});

/* ========================================== butene-bromination-stereo ===
   Each row: the bromonium ion in the middle, and the product from bromide
   attacking each carbon from below. */
function stereoRow(y, cis) {
  let s = '';
  s += bromoniumP(380, y + 20, cis).s;
  s += arrow(P(286, y + 20), P(224, y + 20));
  s += arrow(P(474, y + 20), P(536, y + 20));
  s += T(255, y - 12, 'Br⁻ attacks C2') + T(255, y + 44, 'from below');
  s += T(505, y - 12, 'Br⁻ attacks C3') + T(505, y + 44, 'from below');
  const lab = cis ? ['cis', 'cis'] : ['trans', 'trans'];
  const a = cis ? ['S', 'S'] : ['S', 'R'];
  const b = cis ? ['R', 'R'] : ['R', 'S'];
  s += dibromideP(120, y + 20, cis, 'C2', a, `${lab[0]} path C2`);
  s += dibromideP(640, y + 20, cis, 'C3', b, `${lab[1]} path C3`);
  return s;
}
FIGURES.push({
  id: 'butene-bromination-stereo',
  section: 'addition-reactions',
  anchor: 'which is exactly what "stereospecific" means.</p>',
  viewBox: '0 0 760 440',
  alt: 'Two rows, both drawn in perspective with wedges toward the reader. Top row, trans-but-2-ene: the bromonium ion in the middle, bromine on the top face. Bromide attacking C2 from below gives, on the left, a dibromide labeled C2 S and C3 R. Bromide attacking C3 from below gives, on the right, a dibromide labeled C2 R and C3 S. (2S,3R) and (2R,3S) are the same compound, meso-2,3-dibromobutane. Bottom row, cis-but-2-ene: attack at C2 gives the (2S,3S) dibromide and attack at C3 gives the (2R,3R) dibromide, a pair of enantiomers formed in equal amounts.',
  build() {
    let s = '';
    s += rich(20, 26, ['*trans', '-but-2-ene: bromonium ion on the top face'], 'fg-lbl', 'start');
    s += stereoRow(96, false);
    s += rich(380, 204, ['(2S,3R) and (2R,3S) are one compound, ', '*meso', '-2,3-dibromobutane'], 'fg-tag-good');
    s += rule(20, 220, 740, 220);
    s += rich(20, 248, ['*cis', '-but-2-ene: bromonium ion on the top face'], 'fg-lbl', 'start');
    s += stereoRow(318, true);
    s += T(380, 426, '(2S,3S) and (2R,3R): enantiomers, 50 : 50', 'fg-tag-good');
    return s;
  },
  caption: 'In each row, compare the R/S labels on the left product with those on the right one.',
});

/* ============================================ halohydrin-uneven-bridge ===
   The bromonium ion from 2-methylpropene, drawn in perspective with the
   bridge leaning toward the CH2 end, water attacking the other carbon from
   below, and the product. */
function halohydrin() {
  let s = '';
  s += panel(10, 8, 430, 254);
  s += T(225, 32, 'the bridge leans toward C1', 'fg-tag-good');
  const c1 = P(180, 150), c2 = P(270, 150), br = P(206, 88);
  s += bond(c1, c2, { rFrom: 12, rTo: 12 });
  s += bond(c1, br, { rFrom: 12, rTo: 15 });
  s += dashLine(at(c2, 124, 14), at(br, 304, 17));
  s += grp(c1, 222, 40, 'H', 'w', { rFrom: 12 }).s + grp(c1, 168, 40, 'H', 'h', { rFrom: 12 }).s;
  s += grp(c2, 318, 44, 'CH₃', 'w', { rFrom: 12 }).s + grp(c2, 12, 44, 'CH₃', 'h', { rFrom: 12 }).s;
  s += C(c1) + C(c2, 'warn') + atom(br.x, br.y, 'Br', { r: 15, kind: 'hi' });
  s += charge(br.x + 20, br.y - 10);
  s += T(c2.x - 32, c2.y + 24, 'δ+', 'fg-tag-warn');
  s += T(c1.x, c1.y - 22, 'C1', 'fg-tag') + T(c2.x + 8, c2.y - 24, 'C2', 'fg-tag');
  s += T(118, 96, 'short, strong', 'fg-tag') + T(118, 110, 'C1–Br', 'fg-tag');
  s += T(318, 80, 'long, weak', 'fg-tag-warn') + T(318, 94, 'C2–Br', 'fg-tag-warn');
  const o = P(262, 216);
  s += atom(o.x, o.y, 'O', { r: 14, kind: 'hi' });
  s += bond(o, at(o, 180, 34), { rFrom: 14, rTo: 11 }) + atom(o.x - 34, o.y, 'H', { r: 11 });
  s += bond(o, at(o, 0, 34), { rFrom: 14, rTo: 11 }) + atom(o.x + 34, o.y, 'H', { r: 11 });
  s += lonePair(o.x, o.y, 270, { dist: 20 }) + lonePair(o.x, o.y, 90, { dist: 20 });
  s += curve(P(o.x - 4, o.y - 21), P(c2.x - 4, c2.y + 13), { bow: -8 });
  s += T(225, 254, 'water attacks C2 from below');

  s += arrow(P(448, 150), P(492, 150));
  s += T(470, 172, '−H⁺');
  s += panel(500, 8, 250, 254);
  s += T(625, 32, 'the halohydrin', 'fg-tag-good');
  const d1 = P(588, 138), d2 = P(668, 138);
  s += bond(d1, d2, { rFrom: 12, rTo: 12 });
  s += grp(d1, 90, 46, 'Br', 'p', { rFrom: 12, hi: true }).s;
  s += grp(d1, 230, 40, 'H', 'w', { rFrom: 12 }).s + grp(d1, 180, 40, 'H', 'h', { rFrom: 12 }).s;
  s += grp(d2, 270, 46, 'OH', 'p', { rFrom: 12, hi: true }).s;
  s += grp(d2, 0, 44, 'CH₃', 'w', { rFrom: 12 }).s + grp(d2, 50, 44, 'CH₃', 'h', { rFrom: 12 }).s;
  s += C(d1) + C(d2);
  s += T(625, 234, 'OH on C2, Br on C1');
  s += T(625, 250, '1-bromo-2-methylpropan-2-ol');
  return s;
}
FIGURES.push({
  id: 'halohydrin-uneven-bridge',
  section: 'addition-reactions',
  anchor: 'finish <b>anti</b> however unsymmetrical the ion was.</p>',
  viewBox: '0 0 760 270',
  alt: 'Left: the bromonium ion from 2-methylpropene in perspective. The bromine above the ring sits closer to C1, the CH2 carbon, with a short solid C1–Br bond, and its bond to C2, the carbon carrying two methyl groups, is long and dashed. C2 carries a partial positive charge. A water molecule below C2 attacks it from underneath. Right, after loss of a proton: 1-bromo-2-methylpropan-2-ol, with the Br pointing up from C1 and the OH pointing down from C2.',
  build: halohydrin,
  caption: 'Compare the two bonds to bromine: the dashed one, to the carbon with two methyls, is the one that breaks.',
});

/* ===================================================== ring-halohydrin ===
   Worked example (b): 1-methylcyclohexene + Br2 in water. Flat ring drawn
   in the page, so the top face is toward the reader (wedges). */
function ring(cx, cy) {
  const p = polyPts(cx, cy, 6, 36, 90);
  return { p, c1: p[5], c2: p[0] };
}
function ringHalohydrin() {
  let s = '';
  // panel 1: bromonium on the front face, water from the back
  s += panel(10, 8, 240, 254);
  s += T(130, 32, 'bromonium ion on the front face', 'fg-tag-good');
  let r = ring(110, 150);
  for (let i = 0; i < 6; i++) if (i !== 5) s += sk(r.p[i], r.p[(i + 1) % 6]);
  s += sk(r.c1, r.c2);
  const mid = P((r.c1.x + r.c2.x) / 2, (r.c1.y + r.c2.y) / 2);
  const br = at(mid, 60, 40);
  s += wedge(r.c1, br, { rFrom: 0, rTo: 15, width: 8 }) + wedge(r.c2, br, { rFrom: 0, rTo: 15, width: 8 });
  s += atom(br.x, br.y, 'Br', { r: 15, kind: 'hi' }) + charge(br.x + 20, br.y - 10);
  const me = at(r.c1, 10, 40);
  s += bond(r.c1, me, { rFrom: 0, rTo: 17 }) + atom(me.x, me.y, 'CH₃', { r: 17 });
  s += T(r.c1.x + 22, r.c1.y + 24, 'C1 δ+', 'fg-tag-warn', 'start');
  const w = P(r.c1.x + 52, r.c1.y + 62);
  s += waterAt(w, [-30, 210], [60, 120]);
  s += curve(P(w.x - 10, w.y - 18), P(r.c1.x + 7, r.c1.y + 12), { bow: -10 });
  s += T(r.c2.x - 16, r.c2.y - 8, 'C2', 'fg-tag', 'end');
  s += T(130, 234, 'H₂O attacks C1', 'fg-tag');
  s += T(130, 250, 'from the back face', 'fg-tag');
  s += arrow(P(252, 150), P(282, 150));
  // panel 2 and 3: the two enantiomers
  const prod = (ox, front) => {
    let g = '';
    const q = ring(ox + 104, 150);
    for (let i = 0; i < 6; i++) g += sk(q.p[i], q.p[(i + 1) % 6]);
    const brp = at(q.c2, 90, 44), ohp = at(q.c1, -10, 44), mep = at(q.c1, 50, 40);
    g += stereo(front ? 'w' : 'h', q.c2, brp, 15) + atom(brp.x, brp.y, 'Br', { r: 15, kind: 'hi' });
    g += stereo(front ? 'h' : 'w', q.c1, ohp, 15) + atom(ohp.x, ohp.y, 'OH', { r: 15, kind: 'hi' });
    g += bond(q.c1, mep, { rFrom: 0, rTo: 17 }) + atom(mep.x, mep.y, 'CH₃', { r: 17 });
    return g;
  };
  s += panel(290, 8, 220, 254);
  s += T(400, 32, 'Br in front, OH behind', 'fg-tag-good');
  s += prod(290, true);
  s += T(400, 234, 'trans: OH and Br', 'fg-tag');
  s += T(400, 250, 'on opposite faces', 'fg-tag');
  s += T(520, 150, '+', 'fg-lbl');
  s += panel(530, 8, 220, 254);
  s += T(640, 32, 'from a bromonium on the back face', 'fg-tag-good');
  s += prod(530, false);
  s += T(640, 234, 'the mirror image,', 'fg-tag');
  s += T(640, 250, 'formed just as often', 'fg-tag');
  return s;
}
FIGURES.push({
  id: 'ring-halohydrin',
  section: 'addition-reactions',
  anchor: '<span class="k">Worked example — predicting the product, stereochemistry included</span>',
  viewBox: '0 0 760 270',
  alt: 'Left: 1-methylcyclohexene after bromine has bridged C1 and C2 on the front face of the ring, drawn as two wedge bonds from C1 and C2 to a positive Br; C1, which carries the methyl group, is marked delta plus, and water attacks C1 from the back face. Middle: the product, 2-bromo-1-methylcyclohexan-1-ol, with the Br on a wedge at C2 and the OH on a hash at C1. Right: its mirror image, Br on a hash and OH on a wedge, which forms when the bromonium ion is on the back face.',
  build: ringHalohydrin,
  caption: 'In both products the OH and the Br sit on opposite faces of the ring: one on a wedge, the other on a hash.',
});

/* =============================================== hydration-three-steps ===
   Propene in aqueous acid. Each step fills a 240 x 200 area. */
const PROP = (ox, oy) => [P(ox + 60, oy + 150), P(ox + 100, oy + 126), P(ox + 140, oy + 150)];
/* A water or hydronium oxygen with two H's drawn out at the given angles. */
function waterAt(o, hAngles, lpAngles, kind = 'plain') {
  let s = atom(o.x, o.y, 'O', { r: 14, kind });
  for (const a of hAngles) { const h = at(o, a, 32); s += bond(o, h, { rFrom: 14, rTo: 11 }) + atom(h.x, h.y, 'H', { r: 11 }); }
  for (const a of lpAngles) s += lonePair(o.x, o.y, -a, { dist: 20 });
  return s;
}
function hyd1(ox, oy) {
  let s = '';
  const [c1, c2, c3] = PROP(ox, oy);
  s += skDouble(c1, c2, P(ox + 80, oy + 170)) + sk(c2, c3);
  const h = P(ox + 92, oy + 72), o = P(ox + 146, oy + 66);
  s += bond(h, o, { rFrom: 11, rTo: 14 }) + atom(h.x, h.y, 'H', { r: 11, kind: 'hi' });
  s += waterAt(o, [30, -30], [270]);
  s += charge(o.x + 2, o.y - 22);
  s += curve(P(ox + 76, oy + 132), P(ox + 88, oy + 86), { bow: -12 });
  s += curve(P(ox + 119, oy + 70), P(o.x - 8, o.y + 13), { bow: 12 });
  s += T(c1.x - 8, c1.y + 20, 'C1') + T(c2.x, c2.y + 30, 'C2');
  return s;
}
function hyd2(ox, oy) {
  let s = '';
  const [c1, c2, c3] = PROP(ox, oy);
  s += bond(c1, c2, { rFrom: 17, rTo: 0 }) + sk(c2, c3);
  s += atom(c1.x, c1.y, 'CH₃', { r: 17, kind: 'hi' }) + T(c1.x + 4, c1.y + 32, 'C1 got the H');
  s += charge(c2.x, c2.y - 12);
  const o = P(ox + 176, oy + 74);
  s += waterAt(o, [60, -10], [200, 130]);
  s += curve(P(o.x - 22, o.y + 11), P(c2.x + 8, c2.y - 8), { bow: 14 });
  return s;
}
function hyd3(ox, oy) {
  let s = '';
  const [c1, c2, c3] = PROP(ox, oy);
  s += sk(c1, c2) + sk(c2, c3);
  const o = P(c2.x, c2.y - 50);
  s += bond(c2, o, { rFrom: 0, rTo: 14 });
  s += atom(o.x, o.y, 'O', { r: 14, kind: 'hi' }) + charge(o.x - 21, o.y + 16);
  const hl = at(o, 150, 32), hr = at(o, 30, 44);
  s += bond(o, hl, { rFrom: 14, rTo: 11 }) + atom(hl.x, hl.y, 'H', { r: 11 });
  s += bond(o, hr, { rFrom: 14, rTo: 11 }) + atom(hr.x, hr.y, 'H', { r: 11, kind: 'hi' });
  s += lonePair(o.x, o.y, 270, { dist: 20 });
  const w = P(ox + 196, oy + 56);
  s += waterAt(w, [0, -60], [150, 90]);
  s += curve(P(w.x - 20, w.y - 8), P(hr.x + 10, hr.y - 4), { bow: 10 });
  s += curve(P((o.x + hr.x) / 2 + 4, (o.y + hr.y) / 2 + 5), P(o.x + 16, o.y + 8), { bow: -16 });
  return s;
}
const HYD_TITLES = ['1 · the π bond takes a proton', '2 · water attacks the cation', '3 · water takes a proton back'];
const HYD_TAGS = ['propene + H₃O⁺', 'a secondary cation on C2', 'an oxonium ion'];
FIGURES.push({
  id: 'hydration-three-steps',
  section: 'addition-reactions',
  anchor: '<h3>Acid-catalyzed hydration</h3>',
  viewBox: '0 0 760 300',
  alt: 'Acid-catalyzed hydration of propene in three panels. Panel 1: curved arrows from the C1=C2 double bond to an H of hydronium ion and from that H–O bond to the positive oxygen. Panel 2: C1 is now CH3 and C2 carries a positive charge; a curved arrow runs from a lone pair on a water molecule to C2. Panel 3: the oxygen now bonded to C2 carries two hydrogens and a positive charge, an oxonium ion; a curved arrow runs from a lone pair of a second water molecule to one of those hydrogens, and another from that O–H bond back to the oxygen. The products are propan-2-ol and hydronium ion.',
  build() {
    let s = '';
    [hyd1, hyd2, hyd3].forEach((f, i) => {
      const ox = 10 + i * 250;
      s += panel(ox, 8, 240, 250);
      s += T(ox + 120, 32, HYD_TITLES[i], 'fg-tag-good');
      s += f(ox, 30);
      s += T(ox + 120, 246, HYD_TAGS[i]);
    });
    s += arrow(P(242, 150), P(268, 150), { muted: true }) + arrow(P(492, 150), P(518, 150), { muted: true });
    s += T(380, 288, 'Products: propan-2-ol and H₃O⁺. The acid used in step 1 comes back in step 3.', 'fg-lbl');
    return s;
  },
  caption: 'Every water molecule in this mechanism is neutral. There is no hydroxide ion anywhere in it.',
});
FIGURES.push({
  id: 'l-hydration-three-steps',
  lessons: ['addition-reactions'],
  viewBox: '0 0 340 712',
  alt: 'Acid-catalyzed hydration of propene in three stacked panels. Top: curved arrows from the C=C to an H of hydronium and from that H–O bond to the oxygen. Middle: the secondary cation on C2, with a curved arrow from a lone pair of water to C2. Bottom: the oxonium ion, with a second water molecule taking one of its hydrogens; this gives propan-2-ol and hydronium ion.',
  build() {
    let s = '';
    [hyd1, hyd2, hyd3].forEach((f, i) => {
      const oy = 6 + i * 228;
      s += panel(10, oy, 320, 216);
      s += T(170, oy + 24, HYD_TITLES[i], 'fg-tag-good');
      s += f(50, oy + 6);
      s += T(170, oy + 206, HYD_TAGS[i]);
    });
    s += T(170, 702, 'Products: propan-2-ol and H₃O⁺', 'fg-lbl');
    return s;
  },
  caption: 'Read the panels from top to bottom.',
});

/* ===================================================== two-hydrations ===
   3,3-Dimethylbut-1-ene hydrated two ways. The tert-butyl carbon C3 is
   drawn as an X: C2 up-left, and methyls up-right, down-left, down-right. */
function dmb(x, y, o = {}) {
  const c1 = P(x, y), c2 = P(x + 36, y - 22), c3 = P(x + 72, y);
  const mUR = at(c3, 30, 40), mDL = at(c3, 225, 40), mDR = at(c3, 315, 40);
  let s = o.alkene ? skDouble(c1, c2, P(x + 20, y + 20)) : sk(c1, c2);
  s += sk(c2, c3) + (o.noUR ? '' : sk(c3, mUR)) + sk(c3, mDL) + sk(c3, mDR);
  return { s, c1, c2, c3, mUR, mDL, mDR };
}
function twoHydrations() {
  let s = '';
  // the alkene, once, at the left
  const a = dmb(30, 200, { alkene: true });
  s += a.s;
  s += T(84, 262, '3,3-dimethyl-') + T(84, 276, 'but-1-ene');
  s += T(a.c1.x - 6, a.c1.y + 20, 'C1') + T(a.c2.x, a.c2.y - 12, 'C2') + T(a.c3.x, a.c3.y - 12, 'C3');
  s += arrow(P(140, 172), P(186, 104));
  s += arrow(P(140, 226), P(186, 294));
  s += T(146, 124, 'H₃O⁺', 'fg-tag', 'end');
  s += T(180, 322, 'Hg(OAc)₂, H₂O', 'fg-tag', 'end');
  s += T(180, 336, 'then NaBH₄', 'fg-tag', 'end');

  // row 1: acid
  s += panel(196, 8, 556, 190);
  s += T(474, 30, 'H₃O⁺: a free cation, which rearranges', 'fg-tag-warn');
  let t = dmb(220, 120);
  s += t.s + charge(t.c2.x, t.c2.y - 12);
  s += curve(at(t.c3, 30, 20), P(t.c2.x + 6, t.c2.y + 4), { bow: 22 });
  s += T(292, 178, '2° cation', 'fg-tag-warn');
  s += T(292, 192, 'a CH₃ shifts', 'fg-tag');
  s += arrow(P(348, 110), P(384, 110), { muted: true });
  t = dmb(398, 120, { noUR: true });
  s += t.s + sk(t.c2, at(t.c2, 90, 38)) + charge(t.c3.x + 4, t.c3.y - 14);
  s += T(470, 178, '3° cation', 'fg-tag-good');
  s += arrow(P(524, 110), P(560, 110), { muted: true });
  s += T(542, 96, 'H₂O');
  s += T(542, 134, '−H⁺');
  t = dmb(578, 120, { noUR: true });
  s += t.s + sk(t.c2, at(t.c2, 90, 38));
  const oh = at(t.c3, 30, 44);
  s += bond(t.c3, oh, { rFrom: 0, rTo: 15 }) + atom(oh.x, oh.y, 'OH', { r: 15, kind: 'hi' });
  s += T(662, 178, '2,3-dimethylbutan-2-ol', 'fg-tag-good');
  s += T(662, 192, 'rearranged skeleton', 'fg-tag');

  // row 2: oxymercuration
  s += panel(196, 206, 556, 176);
  s += T(474, 228, 'Hg(OAc)₂: a bridged ion, no rearrangement', 'fg-tag-good');
  t = dmb(262, 318);
  s += t.s;
  const hg = P((t.c1.x + t.c2.x) / 2 - 8, t.c2.y - 44);
  s += bond(t.c1, hg, { rFrom: 0, rTo: 21 });
  s += dashLine(at(t.c2, 110, 4), at(hg, 290 + 20, 22));
  s += atom(hg.x, hg.y, 'HgOAc', { r: 25, kind: 'hi' }) + charge(hg.x + 30, hg.y - 14);
  s += T(t.c2.x + 16, t.c2.y - 4, 'δ+', 'fg-tag-warn', 'start');
  s += T(310, 374, 'mercurinium ion: water opens it at C2', 'fg-tag');
  s += arrow(P(420, 310), P(520, 310), { muted: true });
  s += T(470, 296, 'H₂O, −H⁺');
  s += T(470, 330, 'then NaBH₄');
  t = dmb(578, 318);
  s += t.s;
  const oh2 = at(t.c2, 90, 42);
  s += bond(t.c2, oh2, { rFrom: 0, rTo: 15 }) + atom(oh2.x, oh2.y, 'OH', { r: 15, kind: 'hi' });
  s += T(662, 360, '3,3-dimethylbutan-2-ol', 'fg-tag-good');
  s += T(662, 374, 'skeleton unchanged', 'fg-tag');
  return s;
}
FIGURES.push({
  id: 'two-hydrations',
  section: 'addition-reactions',
  anchor: '<h3>Oxymercuration–demercuration: Markovnikov without the rearrangement</h3>',
  viewBox: '0 0 760 390',
  alt: '3,3-Dimethylbut-1-ene, a C1=C2 double bond with C3 carrying three methyl groups, hydrated two ways. Top row, H3O+: protonation of C1 gives a secondary cation on C2; a curved arrow moves a methyl group from C3 to C2 with its bonding pair, giving a tertiary cation on C3, and water then gives 2,3-dimethylbutan-2-ol, with a rearranged carbon skeleton. Bottom row, mercuric acetate and water, then sodium borohydride: a mercurinium ion bridges C1 and C2, with a short bond from mercury to C1, a long dashed bond to C2, and a partial positive charge on C2; water opens it at C2, and sodium borohydride then replaces the mercury with hydrogen, giving 3,3-dimethylbutan-2-ol with the skeleton unchanged.',
  build: twoHydrations,
  caption: 'Same alkene, same Markovnikov placement of the OH. Compare the carbon skeletons of the two products.',
});

export default FIGURES;
