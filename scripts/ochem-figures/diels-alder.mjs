/* Figures for the diels-alder notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   One geometry runs through every ring drawing on the page. The diene is
   drawn s-cis as the top four corners of a flat-topped hexagon (C1 left, C2
   and C3 along the top, C4 right) and the dienophile as the bottom edge
   (D1 under C1, D2 under C4). Before the reaction the dienophile sits a
   little lower; after it, the same six corners are the product ring, with
   the new double bond along the top edge and the two new sigma bonds on the
   lower left and lower right. So any atom can be followed from a starting
   material into the product by position alone.

   Most drawings are built as 340-wide rows. A notes figure sets two rows
   side by side; the lesson copy (id prefix l-) stacks them. Lesson figures
   use only fg-lbl and fg-tag text. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { zig, ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];
const RAD = Math.PI / 180;
const r1 = (v) => Math.round(v * 10) / 10;
const mid = (a, b) => P(r1((a.x + b.x) / 2), r1((a.y + b.y) / 2));
const off = (p, deg, len) => P(r1(p.x + Math.cos(deg * RAD) * len), r1(p.y + Math.sin(deg * RAD) * len));
const sk = (a, b, cls) => bond(a, b, { rFrom: 0, rTo: 0, cls: cls || 'fg-bond' });

/* The six corners. g pushes the dienophile down, away from the diene. */
function hexFlat(cx, cy, r = 40, g = 0) {
  const at = (deg, dy = 0) => P(r1(cx + Math.cos(deg * RAD) * r), r1(cy + Math.sin(deg * RAD) * r + dy));
  return { c1: at(180), c2: at(240), c3: at(300), c4: at(0), d2: at(60, g), d1: at(120, g), ctr: P(cx, cy) };
}
/* Exocyclic direction of each corner, in screen degrees. */
const OUT = { c1: 180, c2: 240, c3: 300, c4: 0, d2: 60, d1: 120 };
/* In the s-cis diene, the inward position at each end points into the
   mouth of the U, toward the other end. */
const INWARD = { c1: 60, c4: 120 };

/* The diene alone, drawn s-cis: C1=C2-C3=C4. */
function diene(h, cls) {
  return ringDouble(h.c1, h.c2, h.ctr, { cls }) + sk(h.c2, h.c3, cls) + ringDouble(h.c3, h.c4, h.ctr, { cls });
}
/* The product ring: double bond C2=C3 on top, new sigma bonds highlighted. */
function productRing(h, opts = {}) {
  let s = '';
  s += sk(h.c1, h.c2) + ringDouble(h.c2, h.c3, h.ctr, { cls: opts.piCls }) + sk(h.c3, h.c4);
  s += sk(h.c4, h.d2, opts.plainNew ? '' : 'fg-bond-hi');
  s += sk(h.d1, h.c1, opts.plainNew ? '' : 'fg-bond-hi');
  s += opts.bottomDouble ? ringDouble(h.d2, h.d1, h.ctr, { cls: opts.bottomCls }) : sk(h.d2, h.d1);
  return s;
}
/* A labeled substituent on a corner, along direction deg. */
function sub(p, deg, lbl, opts = {}) {
  const len = opts.len ?? 40, r = opts.r ?? 16;
  const at = off(p, deg, len);
  const b = opts.kind === 'wedge' ? wedge(p, at, { rFrom: 0, rTo: r, width: 8 })
    : opts.kind === 'hash' ? hash(p, at, { rFrom: 0, rTo: r, width: 9, rungs: 5 })
    : bond(p, at, { rFrom: 0, rTo: r });
  return b + atom(at.x, at.y, lbl, { r });
}
const numLbl = (p, deg, t, d = 15) => { const q = off(p, deg, d); return tag(q.x, q.y + 4, t, { cls: 'fg-tag-mut' }); };

/* A retrosynthesis arrow, read "is made from": two lines and an open head. */
const retro = (x, y, w = 30) =>
  `<line class="fg-bond" x1="${x}" y1="${y - 3}" x2="${x + w - 5}" y2="${y - 3}"></line>` +
  `<line class="fg-bond" x1="${x}" y1="${y + 3}" x2="${x + w - 5}" y2="${y + 3}"></line>` +
  `<path class="fg-bond" fill="none" d="M${x + w - 10} ${y - 9} L${x + w} ${y} L${x + w - 10} ${y + 9}"></path>`;
const down = (x, y1, y2) => arrow(P(x, y1), P(x, y2), { size: 8 });
const right = (y, x1, x2) => arrow(P(x1, y), P(x2, y), { size: 8 });

/* =====================================================================
   1. The reaction and its arrows. One 340-wide row per dienophile:
   ethene (with the three curved arrows) and ethyne (the second pi bond
   of the alkyne survives). */
function mechRow(ox, oy, alkyne) {
  let s = '';
  const g = 30;
  const R = hexFlat(ox + 78, oy + 70, 40, g);
  s += diene(R);
  if (alkyne) {
    s += bond(R.d1, R.d2, { order: 3, rFrom: 0, rTo: 0, gap: 3.6 });
    s += bond(R.d1, off(R.d1, 180, 30), { rFrom: 0, rTo: 9 }) + atom(R.d1.x - 30, R.d1.y, 'H', { r: 9 });
    s += bond(R.d2, off(R.d2, 0, 30), { rFrom: 0, rTo: 9 }) + atom(R.d2.x + 30, R.d2.y, 'H', { r: 9 });
  } else {
    s += bond(R.d1, R.d2, { order: 2, rFrom: 0, rTo: 0 });
  }
  s += sk(R.c1, R.d1, 'fg-dash-hi') + sk(R.c4, R.d2, 'fg-dash-hi');
  if (!alkyne) {
    // six electrons, three arrows, head to tail
    s += curve(off(mid(R.c1, R.c2), 150, 4), off(mid(R.c1, R.d1), 180, 3), { bow: 16 });
    s += curve(off(mid(R.d1, R.d2), 90, 6), off(mid(R.d2, R.c4), 0, 3), { bow: 16 });
    s += curve(off(mid(R.c3, R.c4), 30, 4), off(mid(R.c2, R.c3), 270, 4), { bow: 16 });
  }
  s += numLbl(R.c1, 200, 'C1', 18) + numLbl(R.c2, 240, 'C2', 16) + numLbl(R.c3, 300, 'C3', 16) + numLbl(R.c4, 340, 'C4', 18);
  s += tag(ox + 78, oy + 12, 'diene, s-cis');
  s += tag(ox + 78, oy + (alkyne ? 164 : 160), alkyne ? 'ethyne' : 'ethene');

  s += right(oy + 88, ox + 158, ox + 196);

  const Q = hexFlat(ox + 268, oy + 88, 40);
  s += productRing(Q, alkyne ? { bottomDouble: true, bottomCls: 'fg-bond-hi', plainNew: false } : {});
  s += numLbl(Q.c1, 200, 'C1', 18) + numLbl(Q.c2, 240, 'C2', 16) + numLbl(Q.c3, 300, 'C3', 16) + numLbl(Q.c4, 340, 'C4', 18);
  s += tag(ox + 268, oy + 30, alkyne ? 'cyclohexa-1,4-diene' : 'cyclohexene');
  if (alkyne) s += tag(ox + 268, oy + 150, 'second π bond kept', { cls: 'fg-tag-good' });
  else s += tag(ox + 268, oy + 150, 'new σ bonds in color', { cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'da-bond-accounting',
  section: 'diels-alder',
  anchor: '<h3>The diene must be able to reach s-cis</h3>',
  alt: 'Left: buta-1,3-diene drawn s-cis with its carbons numbered C1 to C4, and ethene below it. Dashed lines join C1 and C4 to the two ethene carbons. Three curved arrows run head to tail: from the C1=C2 bond to the C1 dashed bond, from the ethene double bond to the C4 dashed bond, and from the C3=C4 bond to the C2–C3 bond. An arrow leads to cyclohexene, with the double bond now between C2 and C3 and the two new sigma bonds in color. Right: the same diene with ethyne below it gives cyclohexa-1,4-diene, and the double bond left over from the alkyne is marked as kept.',
  viewBox: '0 0 760 200',
  build() {
    let s = mechRow(20, 10, false);
    s += `<line class="fg-rule" x1="380" y1="20" x2="380" y2="180"></line>`;
    s += mechRow(400, 10, true);
    return s;
  },
  caption: 'Left: the three curved arrows for buta-1,3-diene and ethene. Right: with ethyne, one of the alkyne’s two π bonds is used and the other stays in the ring. Dashed lines are bonds in the middle of forming.',
});

FIGURES.push({
  id: 'l-da-arrows',
  lessons: ['diels-alder'],
  alt: 'Top: buta-1,3-diene drawn s-cis with its carbons numbered C1 to C4, above ethene, with dashed lines from C1 and C4 to the ethene carbons and three curved arrows running head to tail round the ring. An arrow leads to cyclohexene with the double bond between C2 and C3 and the two new sigma bonds in color. Bottom: the same diene with ethyne gives cyclohexa-1,4-diene, with the leftover alkyne pi bond marked as kept.',
  viewBox: '0 0 340 380',
  build() {
    let s = mechRow(0, 0, false);
    s += rule(10, 188, 330, 188);
    s += mechRow(0, 196, true);
    return s;
  },
  caption: 'C1 and C4 form the new σ bonds, so the new π bond has to be C2–C3.',
});

/* =====================================================================
   2. The s-cis requirement: a diene locked s-cis, one locked s-trans, and
   an open-chain diene whose inward methyl clashes. Panels 180 wide. */
function cyclopentadiene(cx, cy, r = 36) {
  // CH2 at the top; C1..C4 of the diene are the other four corners.
  const v = [0, 1, 2, 3, 4].map((i) => off(P(cx, cy), -90 + i * 72, r));
  const c = P(cx, cy);
  let s = sk(v[0], v[1]) + ringDouble(v[1], v[2], c) + sk(v[2], v[3]) + ringDouble(v[3], v[4], c) + sk(v[4], v[0]);
  return { s, v };
}
function cpPanel(ox, oy) {
  let s = '';
  const { s: ring, v } = cyclopentadiene(ox + 90, oy + 78);
  s += ring;
  s += tag(ox + 90, oy + 28, 'CH₂', { cls: 'fg-tag-mut' });
  s += `<circle class="fg-fill-good" cx="${v[1].x}" cy="${v[1].y}" r="5"></circle><circle class="fg-fill-good" cx="${v[4].x}" cy="${v[4].y}" r="5"></circle>`;
  s += tag(ox + 90, oy + 142, 'cyclopentadiene');
  s += tag(ox + 90, oy + 160, 'locked s-cis: fast', { cls: 'fg-tag-good' });
  return s;
}
/* 2,3,4,4a,5,6-hexahydronaphthalene: C1=C8a-C8=C7, held s-trans by the
   two rings. Shared edge C8a (top) to C4a (bottom). */
function transPanel(ox, oy, bare) {
  let s = '';
  const r = 30, cy = oy + 80, sx = ox + 90;
  const A = [30, 90, 150, 210, 270, 330].map((a) => off(P(sx - r * 0.866, cy), a - 60, r));
  const Bc = P(sx + r * 0.866, cy);
  const B = [30, 90, 150, 210, 270, 330].map((a) => off(Bc, a - 60, r));
  // Left ring vertices by angle: find the two on the shared edge (x = sx).
  const near = (pts, want) => pts.reduce((b, p) => (Math.hypot(p.x - want.x, p.y - want.y) < Math.hypot(b.x - want.x, b.y - want.y) ? p : b));
  const c8a = P(sx, cy - r / 2), c4a = P(sx, cy + r / 2);
  const c1 = near(A, P(sx - r * 0.866, cy - r)), c2 = near(A, P(sx - 2 * r * 0.866, cy - r / 2));
  const c3 = near(A, P(sx - 2 * r * 0.866, cy + r / 2)), c4 = near(A, P(sx - r * 0.866, cy + r));
  const c8 = near(B, P(sx + r * 0.866, cy - r)), c7 = near(B, P(sx + 2 * r * 0.866, cy - r / 2));
  const c6 = near(B, P(sx + 2 * r * 0.866, cy + r / 2)), c5 = near(B, P(sx + r * 0.866, cy + r));
  const cA = P(sx - r * 0.866, cy);
  s += ringDouble(c1, c8a, cA) + sk(c1, c2) + sk(c2, c3) + sk(c3, c4) + sk(c4, c4a) + sk(c4a, c8a);
  s += sk(c8a, c8) + ringDouble(c8, c7, Bc) + sk(c7, c6) + sk(c6, c5) + sk(c5, c4a);
  if (bare) return s;
  s += `<circle class="fg-fill-warn" cx="${c1.x}" cy="${c1.y}" r="5"></circle><circle class="fg-fill-warn" cx="${c7.x}" cy="${c7.y}" r="5"></circle>`;
  s += tag(ox + 90, oy + 28, 'the two ends point apart', { cls: 'fg-tag-mut' });
  s += tag(ox + 90, oy + 142, 'a fused-ring diene');
  s += tag(ox + 90, oy + 160, 'locked s-trans: no reaction', { cls: 'fg-tag-warn' });
  return s;
}
/* Penta-1,3-diene held s-cis: E puts the methyl outward, Z puts it inward,
   where it runs into the inward H on the other end. */
function pentaPanel(ox, oy, Z) {
  let s = '';
  const R = hexFlat(ox + 96, oy + 72, 34);
  s += diene(R);
  // methyl on C1 of the diene unit (the IUPAC C4 of penta-1,3-diene)
  if (Z) {
    s += sub(R.c1, INWARD.c1, 'CH₃', { len: 34, r: 16 });
  } else {
    s += sub(R.c1, OUT.c1, 'CH₃', { len: 36, r: 16 });
  }
  // the inward H on the far end
  s += sub(R.c4, INWARD.c4, 'H', { len: 28, r: 9 });
  if (Z) {
    const a = off(R.c1, INWARD.c1, 34), b = off(R.c4, INWARD.c4, 28);
    s += `<path class="fg-arrow" fill="none" stroke-dasharray="3 3" d="M${a.x + 14} ${a.y + 8} Q${r1((a.x + b.x) / 2)} ${a.y + 24} ${b.x - 6} ${b.y + 10}"></path>`;
    s += tag(ox + 92, oy + 142, '(Z): CH₃ inward', { cls: 'fg-tag' });
    s += tag(ox + 92, oy + 160, 'clashes with the H: slow', { cls: 'fg-tag-warn' });
  } else {
    s += tag(ox + 92, oy + 142, '(E): CH₃ outward', { cls: 'fg-tag' });
    s += tag(ox + 92, oy + 160, 'no clash: normal rate', { cls: 'fg-tag-good' });
  }
  return s;
}

FIGURES.push({
  id: 'da-scis',
  section: 'diels-alder',
  anchor: 'slow it down badly.</li>\n</ul>',
  alt: 'Four dienes. First, cyclopentadiene, a five-membered ring with a CH2 at the top and two double bonds; the two ends of its diene are marked and sit close together, locked s-cis, labeled fast. Second, a diene built into two fused six-membered rings, one double bond in each ring; its two ends are marked and point away from each other, locked s-trans, labeled no reaction. Third, penta-1,3-diene drawn s-cis as the E isomer, with its methyl pointing outward, labeled no clash. Fourth, the Z isomer drawn s-cis, with its methyl pointing inward into the mouth of the diene, where a dashed line marks its clash with the inward hydrogen on the other end, labeled slow.',
  viewBox: '0 0 760 180',
  build() {
    let s = '';
    s += cpPanel(0, 0);
    s += transPanel(190, 0);
    s += pentaPanel(380, 0, false);
    s += pentaPanel(570, 0, true);
    s += `<line class="fg-rule" x1="376" y1="20" x2="376" y2="170"></line>`;
    return s;
  },
  caption: 'The dots mark the two ends of each diene, the atoms that must reach the dienophile. Right half: the same diene drawn s-cis as each geometric isomer.',
});

FIGURES.push({
  id: 'l-da-scis',
  lessons: ['diels-alder'],
  alt: 'Top: cyclopentadiene, locked s-cis by its ring, with the two ends of its diene marked close together, labeled fast. Bottom: (Z)-penta-1,3-diene drawn s-cis, with its methyl pointing inward into the mouth of the diene, where a dashed line marks its clash with the inward hydrogen on the other end, labeled slow.',
  viewBox: '0 0 340 180',
  build() {
    return cpPanel(-10, 0) + pentaPanel(160, 0, true);
  },
  caption: 'The ring holds cyclopentadiene s-cis. An inward methyl makes s-cis crowded.',
});

/* The four candidates for the lesson's sort, A to D. */
FIGURES.push({
  id: 'l-diene-sort',
  lessons: ['diels-alder'],
  alt: 'Four molecules labeled A to D. A: cyclopentadiene, a five-membered ring with two double bonds. B: buta-1,3-diene drawn as an open zigzag chain. C: a diene built into two fused six-membered rings, one double bond in each ring, with its two ends pointing away from each other. D: penta-1,4-diene, two double bonds separated by a CH2.',
  viewBox: '0 0 340 290',
  build() {
    let s = '';
    s += tag(16, 24, 'A', { cls: 'fg-lbl', anchor: 'start' });
    s += cyclopentadiene(85, 72, 34).s;
    s += tag(85, 132, 'cyclopentadiene');
    s += tag(186, 24, 'B', { cls: 'fg-lbl', anchor: 'start' });
    const b = zig(206, 84, 4, 34, 22);
    s += bond(b[0], b[1], { order: 2, rFrom: 0, rTo: 0 }) + sk(b[1], b[2]) + bond(b[2], b[3], { order: 2, rFrom: 0, rTo: 0 });
    s += tag(257, 132, 'buta-1,3-diene');
    s += tag(16, 166, 'C', { cls: 'fg-lbl', anchor: 'start' });
    // reuse the fused diene without its panel labels
    s += transPanel(-5, 140, true);
    s += tag(85, 274, 'fused-ring diene');
    s += tag(186, 166, 'D', { cls: 'fg-lbl', anchor: 'start' });
    const d = zig(196, 226, 5, 32, 22);
    s += bond(d[0], d[1], { order: 2, rFrom: 0, rTo: 0 }) + sk(d[1], d[2]) + sk(d[2], d[3]) + bond(d[3], d[4], { order: 2, rFrom: 0, rTo: 0 });
    s += tag(260, 274, 'penta-1,4-diene');
    return s;
  },
  caption: 'Ask two things of each: is it conjugated, and can it reach s-cis?',
});

/* =====================================================================
   3. Resonance forms that locate the charge. Notes only. */
const lpAt = (p, deg, d = 19) => lonePair(p.x, p.y, deg, { dist: d });
const chg = (p, dx, dy, t) => text(p.x + dx, p.y + dy, t, { cls: 'fg-lbl' });

function methoxy1(ox, oy, form) {
  // H3C-O-C1=C2-C3=C4 as a zigzag; O is raised.
  const z = zig(ox, oy, 6, 42, 24);
  const [me, o, c1, c2, c3, c4] = z;
  let s = '';
  const inward = (a, b) => P((a.x + b.x) / 2, oy + 30);
  s += bond(me, o, { rFrom: 17, rTo: 12 }) + atom(me.x, me.y, 'H₃C', { r: 17 });
  s += atom(o.x, o.y, 'O', { r: 12 });
  if (form === 0) {
    s += bond(o, c1, { rFrom: 12, rTo: 0 });
    s += ringDouble(c1, c2, inward(c1, c2)) + sk(c2, c3) + ringDouble(c3, c4, inward(c3, c4));
    s += lpAt(o, -125) + lpAt(o, -55);
    s += curve(off(o, -55, 25), mid(o, c1), { bow: -18 });
    s += curve(off(mid(c1, c2), -90, 4), off(mid(c2, c3), -90, 3), { bow: -16 });
    s += curve(off(mid(c3, c4), -90, 4), off(c4, -20, 12), { bow: -14 });
    s += tag(c1.x, c1.y + 22, 'C1', { cls: 'fg-tag-mut' }) + tag(c4.x + 18, c4.y + 14, 'C4', { cls: 'fg-tag-mut' });
  } else {
    s += bond(o, c1, { order: 2, rFrom: 12, rTo: 0 });
    s += sk(c1, c2) + ringDouble(c2, c3, inward(c2, c3)) + sk(c3, c4);
    s += lpAt(o, -90) + chg(o, -15, -12, '+');
    s += lpAt(c4, -40, 14) + chg(c4, 16, 14, '−');
    s += tag(c4.x + 2, c4.y + 48, 'δ− at C4', { cls: 'fg-tag-good' });
  }
  return s;
}
function methoxy2(ox, oy, form) {
  // C1=C2(OMe)-C3=C4; C2 is raised, OMe points up from it.
  const z = zig(ox, oy + 12, 4, 42, 24);
  const [c1, c2, c3, c4] = z;
  const o = P(c2.x, c2.y - 38), me = P(c2.x + 36, c2.y - 58);
  let s = '';
  const inward = (a, b) => P((a.x + b.x) / 2, oy + 44);
  s += bond(o, me, { rFrom: 12, rTo: 17 }) + atom(me.x, me.y, 'CH₃', { r: 17 });
  s += atom(o.x, o.y, 'O', { r: 12 });
  if (form === 0) {
    s += bond(c2, o, { rFrom: 0, rTo: 12 });
    s += ringDouble(c1, c2, inward(c1, c2)) + sk(c2, c3) + ringDouble(c3, c4, inward(c3, c4));
    s += lpAt(o, 180) + lpAt(o, -120);
    s += curve(off(o, 180, 25), off(mid(o, c2), 180, 2), { bow: 14 });
    s += curve(off(mid(c1, c2), -150, 5), off(c1, -170, 13), { bow: 14 });
    s += tag(c1.x - 4, c1.y + 22, 'C1', { cls: 'fg-tag-mut' }) + tag(c2.x + 18, c2.y + 4, 'C2', { cls: 'fg-tag-mut' });
  } else {
    s += bond(c2, o, { order: 2, rFrom: 0, rTo: 12 });
    s += sk(c1, c2) + sk(c2, c3) + ringDouble(c3, c4, inward(c3, c4));
    s += lpAt(o, 180) + chg(o, -14, -14, '+');
    s += lpAt(c1, 200, 14) + chg(c1, -6, 22, '−');
    s += tag(c1.x - 4, c1.y + 44, 'δ− at C1', { cls: 'fg-tag-good' });
  }
  return s;
}
function propenal(ox, oy, form) {
  // CH2=CH-CH=O; the CH2 is on the left, O is raised on the right.
  const z = zig(ox, oy, 4, 42, 24);
  const [a, b, c, o] = z;
  let s = '';
  const inward = (p, q) => P((p.x + q.x) / 2, oy + 30);
  s += atom(o.x, o.y, 'O', { r: 12 });
  if (form === 0) {
    s += ringDouble(a, b, inward(a, b)) + sk(b, c) + bond(c, o, { order: 2, rFrom: 0, rTo: 12 });
    s += lpAt(o, -100) + lpAt(o, 10);
    s += curve(off(mid(a, b), -90, 4), off(mid(b, c), -90, 3), { bow: -16 });
    s += curve(off(mid(c, o), 90, 6), off(o, 70, 14), { bow: 14 });
    s += tag(a.x - 4, a.y + 22, 'CH₂ end', { cls: 'fg-tag-mut' });
  } else {
    s += sk(a, b) + ringDouble(b, c, P((b.x + c.x) / 2, oy + 30)) + bond(c, o, { rFrom: 0, rTo: 12 });
    s += lpAt(o, -100) + lpAt(o, 10) + lpAt(o, 80);
    s += chg(o, 16, -14, '−');
    s += chg(a, -10, 0, '+');
    s += tag(a.x - 14, a.y + 22, 'δ+ at the CH₂', { cls: 'fg-tag-good', anchor: 'start' });
  }
  return s;
}
/* A resonance arrow: one line, a head at each end. */
const reso = (x, y) => `<line class="fg-arrow" x1="${x - 16}" y1="${y}" x2="${x + 16}" y2="${y}"></line>` +
  `<path class="fg-head" d="M${x - 24} ${y} L${x - 15} ${y - 5} L${x - 15} ${y + 5} Z"></path>` +
  `<path class="fg-head" d="M${x + 24} ${y} L${x + 15} ${y - 5} L${x + 15} ${y + 5} Z"></path>`;

FIGURES.push({
  id: 'da-polarize',
  section: 'diels-alder',
  anchor: 'the two atoms with the biggest appetite for each other make one of the new bonds.</p>',
  alt: 'Three molecules, each shown as two resonance forms. Top: 1-methoxybuta-1,3-diene. Curved arrows move an oxygen lone pair into the O–C1 bond, the C1=C2 pi bond into C2–C3, and the C3=C4 pi bond onto C4. The second form has O plus doubly bonded to C1 and a negative charge with a lone pair on C4, labeled delta minus at C4. Middle: propenal. Curved arrows move the C=C pi bond toward the carbonyl carbon and the C=O pi bond onto oxygen. The second form has a positive charge on the CH2 carbon and O minus, labeled delta plus at the CH2. Bottom: 2-methoxybuta-1,3-diene. Curved arrows move an oxygen lone pair into the O–C2 bond and the C1=C2 pi bond onto C1. The second form has O plus doubly bonded to C2 and a negative charge on C1, labeled delta minus at C1.',
  viewBox: '0 0 760 470',
  build() {
    let s = '';
    s += tag(20, 22, '1-methoxybuta-1,3-diene', { anchor: 'start' });
    s += methoxy1(56, 90, 0) + reso(378, 80) + methoxy1(440, 90, 1);
    s += rule(20, 150, 740, 150);
    s += tag(20, 174, 'propenal', { anchor: 'start' });
    s += propenal(120, 236, 0) + reso(378, 226) + propenal(470, 236, 1);
    s += rule(20, 286, 740, 286);
    s += tag(20, 310, '2-methoxybuta-1,3-diene', { anchor: 'start' });
    s += methoxy2(150, 390, 0) + reso(378, 396) + methoxy2(530, 390, 1);
    return s;
  },
  caption: 'Each right-hand form is a minor contributor. It is drawn only to show which atom carries a little extra charge in the real molecule.',
});

/* =====================================================================
   4. Regiochemistry: join the delta-minus end to the delta-plus carbon.
   One 340-wide row per diene. */
function regioRow(ox, oy, donorAt) {
  let s = '';
  const g = 30;
  const R = hexFlat(ox + 86, oy + 72, 36, g);
  s += diene(R);
  s += bond(R.d1, R.d2, { order: 2, rFrom: 0, rTo: 0 });
  const donor = donorAt === 1 ? R.c1 : R.c2;
  s += sub(donor, donorAt === 1 ? OUT.c1 : OUT.c2, 'OMe', { len: 28, r: 15 });
  // delta-minus end of the diene, delta-plus end of the dienophile
  const minus = donorAt === 1 ? R.c4 : R.c1;
  const plusC = donorAt === 1 ? R.d2 : R.d1;
  const choC = donorAt === 1 ? R.d1 : R.d2;
  s += sub(choC, donorAt === 1 ? 180 : 0, 'CHO', { len: 30, r: 15 });
  s += sk(R.c1, R.d1, 'fg-dash') + sk(R.c4, R.d2, 'fg-dash');
  s += sk(minus, plusC, 'fg-dash-hi');
  const sx = donorAt === 1 ? 1 : -1, an = donorAt === 1 ? 'start' : 'end';
  s += text(minus.x + sx * 10, minus.y - 8, 'δ−', { cls: 'fg-lbl', anchor: an });
  s += text(plusC.x + sx * 8, plusC.y + 20, 'δ+', { cls: 'fg-lbl', anchor: an });
  s += tag(ox + 86, oy + 184, donorAt === 1 ? 'OMe on C1' : 'OMe on C2');

  s += right(oy + 92, ox + 160, ox + 188);

  const Q = hexFlat(ox + 262, oy + 92, 32);
  s += productRing(Q);
  if (donorAt === 1) {
    s += sub(Q.c1, OUT.c1, 'OMe', { len: 26, r: 15 });
    s += sub(Q.d1, OUT.d1, 'CHO', { len: 26, r: 15 });
    s += tag(ox + 262, oy + 184, '1,2: "ortho"', { cls: 'fg-tag-good' });
  } else {
    s += sub(Q.c2, OUT.c2, 'OMe', { len: 26, r: 15 });
    s += sub(Q.d2, OUT.d2, 'CHO', { len: 26, r: 15 });
    s += tag(ox + 262, oy + 184, '1,4: "para"', { cls: 'fg-tag-good' });
  }
  return s;
}

FIGURES.push({
  id: 'da-regiochemistry',
  section: 'diels-alder',
  anchor: '<!-- regio-figure -->',
  alt: 'Left: 1-methoxybuta-1,3-diene drawn s-cis above propenal. C4 of the diene is marked delta minus and the CH2 carbon of propenal delta plus, and a highlighted dashed line joins them. The product is a cyclohexene with the methoxy and aldehyde groups on neighboring carbons, labeled 1,2, ortho. Right: 2-methoxybuta-1,3-diene above propenal, turned the other way round. C1 of the diene is marked delta minus and joins the CH2 carbon of propenal. The product has the methoxy and aldehyde groups across the ring from each other, labeled 1,4, para.',
  viewBox: '0 0 760 200',
  build() {
    let s = regioRow(20, 4, 1);
    s += `<line class="fg-rule" x1="380" y1="20" x2="380" y2="186"></line>`;
    s += regioRow(400, 4, 2);
    return s;
  },
  caption: 'The highlighted dashed line pairs the diene’s δ− end with the dienophile’s δ+ carbon. The other dashed line is the second bond, which has only one place to go. Only positions are shown; stereochemistry comes later on the page.',
});

FIGURES.push({
  id: 'l-da-regio',
  lessons: ['diels-alder'],
  alt: 'Top: 1-methoxybuta-1,3-diene above propenal, with the diene C4 marked delta minus and the propenal CH2 marked delta plus, joined by a highlighted dashed line; the product has methoxy and aldehyde on neighboring ring carbons, labeled 1,2, ortho. Bottom: 2-methoxybuta-1,3-diene above propenal, with the diene C1 marked delta minus joined to the propenal CH2; the product has methoxy and aldehyde across the ring, labeled 1,4, para.',
  viewBox: '0 0 340 400',
  build() {
    let s = regioRow(0, 0, 1);
    s += rule(10, 198, 330, 198);
    s += regioRow(0, 204, 2);
    return s;
  },
  caption: 'Join δ− to δ+. The second new bond has only one place to go.',
});

/* =====================================================================
   5. Stereochemistry from the dienophile: cis in, cis out. */
function dienophileStereo(ox, oy, cis, stacked) {
  let s = '';
  // the dienophile, drawn flat: C=C with two CO2Me groups
  const a = P(ox + 64, oy + 60), b = P(ox + 108, oy + 60);
  s += bond(a, b, { order: 2, rFrom: 0, rTo: 0 });
  s += sub(a, 120, 'CO₂Me', { len: 36, r: 23 });
  s += sub(b, cis ? 60 : -60, 'CO₂Me', { len: 36, r: 23 });
  s += sub(a, -120, 'H', { len: 26, r: 9 });
  s += sub(b, cis ? -60 : 60, 'H', { len: 26, r: 9 });
  s += tag(ox + 86, oy + 136, cis ? 'dimethyl maleate' : 'dimethyl fumarate');
  s += tag(ox + 86, oy + 154, cis ? 'esters cis' : 'esters trans', { cls: 'fg-tag-mut' });
  if (stacked) {
    s += down(ox + 86, oy + 166, oy + 196);
    s += tag(ox + 100, oy + 186, '+ butadiene', { anchor: 'start', cls: 'fg-tag-mut' });
  } else {
    s += right(oy + 80, ox + 172, ox + 206);
    s += tag(ox + 189, oy + 70, '+ diene', { cls: 'fg-tag-mut' });
  }
  const Q = stacked ? hexFlat(ox + 86, oy + 232, 34) : hexFlat(ox + 282, oy + 60, 34);
  s += productRing(Q);
  s += sub(Q.d1, OUT.d1, 'CO₂Me', { len: 38, r: 23, kind: 'wedge' });
  s += sub(Q.d2, OUT.d2, 'CO₂Me', { len: 38, r: 23, kind: cis ? 'wedge' : 'hash' });
  const ly = stacked ? oy + 320 : oy + 150;
  s += tag(stacked ? ox + 86 : ox + 282, ly, cis ? 'cis on the ring' : 'trans on the ring', { cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'da-dienophile-stereo',
  section: 'diels-alder',
  anchor: '<!-- dienophile-stereo-figure -->',
  alt: 'Left: dimethyl maleate, with its two CO2Me groups on the same side of the C=C, reacts with a diene to give a cyclohexene whose two CO2Me groups are both on wedges, cis on the ring. Right: dimethyl fumarate, with its CO2Me groups on opposite sides of the C=C, gives the ring with one CO2Me on a wedge and one on a hashed bond, trans on the ring.',
  viewBox: '0 0 760 170',
  build() {
    let s = dienophileStereo(0, 4, true, false);
    s += `<line class="fg-rule" x1="376" y1="16" x2="376" y2="160"></line>`;
    s += dienophileStereo(380, 4, false, false);
    return s;
  },
  caption: 'The diene is buta-1,3-diene. Compare the two esters before and after: cis stays cis, trans stays trans.',
});

FIGURES.push({
  id: 'l-da-dienophile-stereo',
  lessons: ['diels-alder'],
  alt: 'Left column: dimethyl maleate, esters cis across the C=C, reacts with butadiene to give a cyclohexene with both CO2Me groups on wedges, cis on the ring. Right column: dimethyl fumarate, esters trans, gives the ring with one CO2Me on a wedge and one hashed, trans on the ring.',
  viewBox: '0 0 340 330',
  build() {
    return dienophileStereo(-6, 0, true, true) + dienophileStereo(164, 0, false, true);
  },
  caption: 'Cis in, cis out. Trans in, trans out.',
});

/* =====================================================================
   6. Stereochemistry from the diene: outward groups come out cis. */
function dieneStereo(ox, oy, EZ) {
  let s = '';
  const R = hexFlat(ox + 76, oy + 70, 32);
  s += diene(R);
  // C1 end: methyl outward, H inward (E)
  s += sub(R.c1, OUT.c1, 'CH₃', { len: 28, r: 14 });
  s += sub(R.c1, INWARD.c1, 'H', { len: 24, r: 9 });
  if (EZ) {
    // C4 end: methyl inward, H outward (Z)
    s += sub(R.c4, INWARD.c4, 'CH₃', { len: 30, r: 14 });
    s += sub(R.c4, OUT.c4, 'H', { len: 24, r: 9 });
  } else {
    s += sub(R.c4, OUT.c4, 'CH₃', { len: 28, r: 14 });
    s += sub(R.c4, INWARD.c4, 'H', { len: 24, r: 9 });
  }
  s += tag(ox + 76, oy + 16, EZ ? '(2E,4Z)-hexa-2,4-diene' : '(2E,4E)-hexa-2,4-diene');
  s += tag(ox + 76, oy + 146, EZ ? 'one out, one in' : 'both CH₃ outward', { cls: 'fg-tag-mut' });

  s += right(oy + 70, ox + 158, ox + 188);
  s += tag(ox + 173, oy + 92, '+ ethene', { cls: 'fg-tag-mut' });

  const Q = hexFlat(ox + 264, oy + 70, 32);
  s += productRing(Q, { plainNew: true });
  s += sub(Q.c1, OUT.c1, 'CH₃', { len: 26, r: 14, kind: 'wedge' });
  s += sub(Q.c4, OUT.c4, 'CH₃', { len: 26, r: 14, kind: EZ ? 'hash' : 'wedge' });
  s += tag(ox + 264, oy + 146, EZ ? 'trans on the ring' : 'cis on the ring', { cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'da-diene-stereo',
  section: 'diels-alder',
  anchor: '<!-- diene-stereo-figure -->',
  alt: 'Left: (2E,4E)-hexa-2,4-diene drawn s-cis. At each end the methyl points outward, away from the other end, and a hydrogen points inward. With ethene it gives 3,6-dimethylcyclohexene with both methyls on wedges, cis on the ring. Right: (2E,4Z)-hexa-2,4-diene drawn s-cis, with one methyl outward and the other inward. It gives the ring with one methyl on a wedge and one hashed, trans on the ring.',
  viewBox: '0 0 760 160',
  build() {
    let s = dieneStereo(4, 4, false);
    s += `<line class="fg-rule" x1="378" y1="16" x2="378" y2="150"></line>`;
    s += dieneStereo(400, 4, true);
    return s;
  },
  caption: 'Look at where each methyl points in the s-cis diene, then at the ring. Two outward methyls come out cis; one outward and one inward come out trans.',
});

FIGURES.push({
  id: 'l-da-diene-stereo',
  lessons: ['diels-alder'],
  alt: 'Top: (2E,4E)-hexa-2,4-diene drawn s-cis with both methyls pointing outward and both inner positions carrying hydrogen; with ethene it gives the ring with both methyls on wedges, cis. Bottom: (2E,4Z)-hexa-2,4-diene with one methyl outward and one inward gives the ring with one methyl wedged and one hashed, trans.',
  viewBox: '0 0 340 320',
  build() {
    let s = dieneStereo(0, 0, false);
    s += rule(10, 160, 330, 160);
    s += dieneStereo(0, 164, true);
    return s;
  },
  caption: 'Both outward: cis. One outward, one inward: trans.',
});

/* =====================================================================
   7. Endo and exo, seen from the side. The diene is edge-on above, the
   dienophile below; the only difference is where the C=O points. */
function stackPanel(x0, y0, endo) {
  let t = '';
  t += panel(x0, y0, 330, 196, endo ? { kind: 'good' } : {});
  t += tag(x0 + 165, y0 + 24, endo ? 'endo' : 'exo', { cls: endo ? 'fg-tag-good' : 'fg-tag' });
  const dL = P(x0 + 70, y0 + 74), dR = P(x0 + 260, y0 + 74);
  const pL = P(x0 + 100, y0 + 140), pR = P(x0 + 230, y0 + 140);
  t += sk(dL, dR);
  t += `<path class="fg-bond" fill="none" d="M${dL.x} ${dL.y} Q${x0 + 165} ${y0 + 44} ${dR.x} ${dR.y}"></path>`;
  t += tag(x0 + 165, y0 + 50, 'diene, edge-on', { cls: 'fg-tag-mut' });
  t += sk(pL, pR);
  t += sk(dL, pL, 'fg-dash-hi') + sk(dR, pR, 'fg-dash-hi');
  t += tag(pR.x + 12, pR.y + 18, 'dienophile', { anchor: 'start', cls: 'fg-tag-mut' });
  if (endo) {
    const c = P(x0 + 150, y0 + 116);
    t += bond(pL, c, { rFrom: 0, rTo: 16 });
    t += atom(c.x, c.y, 'C=O', { r: 20 });
    t += `<line class="fg-dash" x1="${c.x + 6}" y1="${c.y - 20}" x2="${c.x + 12}" y2="${y0 + 78}"></line>`;
    t += tag(x0 + 165, y0 + 182, 'C=O under the diene', { cls: 'fg-tag' });
  } else {
    const c = P(x0 + 70, y0 + 166);
    t += bond(pL, c, { rFrom: 0, rTo: 20 });
    t += atom(c.x, c.y, 'C=O', { r: 20 });
    t += tag(x0 + 165, y0 + 182, 'C=O points away', { cls: 'fg-tag' });
  }
  return t;
}

FIGURES.push({
  id: 'endo-exo-stacked',
  section: 'diels-alder',
  anchor: '<!-- endo-exo-figure -->',
  alt: 'Two side-on views of a diene, drawn edge-on, stacked above a dienophile, with dashed bonds forming at both ends. Left, endo: the C=O group on the dienophile points inward, under the diene, and a thin dotted line marks its contact with the diene above. Right, exo: the same C=O points down and outward, away from the diene, with no contact.',
  viewBox: '0 0 700 210',
  build() {
    return stackPanel(10, 6, true) + stackPanel(360, 6, false);
  },
  caption: 'The dashed bonds are the same in both. Only the C=O has moved. The thin dotted line in the endo panel is the extra contact with the diene’s π system.',
});

FIGURES.push({
  id: 'l-endo-exo',
  lessons: ['diels-alder'],
  alt: 'Top, endo: a diene seen edge-on above a dienophile, with the dienophile C=O pointing inward under the diene and a dotted contact line to it. Bottom, exo: the same C=O pointing down and away from the diene.',
  viewBox: '0 0 340 410',
  build() {
    return stackPanel(5, 4, true) + stackPanel(5, 208, false);
  },
  caption: 'Same two forming bonds. Endo tucks the C=O under the diene.',
});

/* =====================================================================
   8. The endo adduct of cyclopentadiene and maleic anhydride, in the
   usual 3D drawing of the bicyclic ring. Notes only. */
function norb(o, k) {
  const q = (dx, dy) => P(r1(o.x + dx * k), r1(o.y + dy * k));
  return { n1: q(-50, 0), n2: q(-22, 30), n3: q(22, 30), n4: q(50, 0), n5: q(22, -12), n6: q(-22, -12), n7: q(0, -46) };
}

FIGURES.push({
  id: 'da-endo-adduct',
  section: 'diels-alder',
  anchor: '<!-- endo-adduct-figure -->',
  alt: 'The endo adduct of cyclopentadiene and maleic anhydride drawn in 3D as a bicyclic cage. A CH2 bridge arches over the top. The two-carbon bridge at the back carries the new C=C. The two carbons at the front each carry a hydrogen pointing outward and share the anhydride ring, which hangs down, away from the CH2 bridge. The two bonds made in the reaction, from each bridgehead to the front carbons, are highlighted.',
  viewBox: '0 0 460 300',
  build() {
    let s = '';
    const n = norb(P(210, 124), 1.9);
    s += sk(n.n1, n.n2, 'fg-bond-hi') + sk(n.n2, n.n3) + sk(n.n3, n.n4, 'fg-bond-hi');
    s += sk(n.n4, n.n5) + ringDouble(n.n5, n.n6, P(210, 144)) + sk(n.n6, n.n1);
    s += sk(n.n1, n.n7) + sk(n.n7, n.n4);
    s += tag(n.n7.x, n.n7.y - 12, 'CH₂ bridge', { cls: 'fg-tag-mut' });
    s += tag(210, n.n5.y - 12, 'C=C bridge', { cls: 'fg-tag-mut' });
    // exo hydrogens, pointing outward
    s += sub(n.n2, 185, 'H', { len: 28, r: 9 }) + sub(n.n3, -5, 'H', { len: 28, r: 9 });
    // the anhydride, hanging down (endo)
    const ca = P(n.n2.x + 4, n.n2.y + 46), cb = P(n.n3.x - 4, n.n3.y + 46), ob = P(210, n.n2.y + 80);
    s += sk(n.n2, ca) + sk(n.n3, cb);
    s += bond(ca, ob, { rFrom: 0, rTo: 12 }) + bond(cb, ob, { rFrom: 0, rTo: 12 }) + atom(ob.x, ob.y, 'O', { r: 12 });
    const oa = off(ca, 200, 30), oc = off(cb, -20, 30);
    s += bond(ca, oa, { order: 2, rFrom: 0, rTo: 12 }) + atom(oa.x, oa.y, 'O', { r: 12 });
    s += bond(cb, oc, { order: 2, rFrom: 0, rTo: 12 }) + atom(oc.x, oc.y, 'O', { r: 12 });
    s += tag(300, n.n2.y + 60, 'anhydride points down,', { cls: 'fg-tag-good', anchor: 'start' });
    s += tag(300, n.n2.y + 78, 'away from the CH₂ bridge', { cls: 'fg-tag-good', anchor: 'start' });
    s += tag(210, 290, 'highlighted: the two bonds the reaction made', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'The endo adduct of cyclopentadiene and maleic anhydride. The anhydride sits on the far side from the CH₂ bridge, which is what endo means in a bicyclic product.',
});

/* =====================================================================
   9. Running it backwards: 4-methylcyclohex-3-ene-1-carbaldehyde. Used in
   the notes and the lesson. */
function retroRow(ox, oy) {
  let s = '';
  // the target, numbered as named
  const T = hexFlat(ox + 72, oy + 84, 38);
  s += sk(T.c1, T.c2) + ringDouble(T.c2, T.c3, T.ctr, { cls: 'fg-bond-hi' }) + sk(T.c3, T.c4) + sk(T.d2, T.d1);
  s += sk(T.c4, T.d2, 'fg-dash-hi') + sk(T.d1, T.c1, 'fg-dash-hi');
  s += sub(T.c3, OUT.c3, 'CH₃', { len: 28, r: 14 });
  s += sub(T.d1, OUT.d1, 'CHO', { len: 28, r: 15 });
  s += numLbl(T.d1, 20, '1', 14) + numLbl(T.c1, 180, '2', 13) + numLbl(T.c2, 240, '3', 14);
  s += numLbl(T.c3, 262, '4', 16) + numLbl(T.c4, 0, '5', 13) + numLbl(T.d2, 60, '6', 14);
  s += tag(ox + 72, oy + 176, 'cut the dashed bonds', { cls: 'fg-tag-warn' });

  s += retro(ox + 140, oy + 84, 34);

  // the pieces: isoprene above propenal, in the same positions
  const R = hexFlat(ox + 256, oy + 70, 38, 28);
  s += diene(R);
  s += sub(R.c3, OUT.c3, 'CH₃', { len: 28, r: 14 });
  s += bond(R.d1, R.d2, { order: 2, rFrom: 0, rTo: 0 });
  s += sub(R.d1, OUT.d1, 'CHO', { len: 28, r: 15 });
  s += tag(ox + 256, oy + 176, 'isoprene + propenal', { cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'da-retro',
  section: 'diels-alder',
  lessons: ['diels-alder'],
  anchor: '<!-- retro-figure -->',
  alt: 'Left: the target, 4-methylcyclohex-3-ene-1-carbaldehyde, drawn as a cyclohexene numbered 1 to 6, with CHO on C1, the double bond between C3 and C4 highlighted, and a methyl on C4. The bonds C1–C2 and C5–C6 are dashed and marked for cutting. A retrosynthesis arrow leads to the two pieces in the same positions: isoprene, CH2=C(CH3)–CH=CH2, drawn s-cis above propenal, CH2=CH–CHO.',
  viewBox: '0 0 340 190',
  build() {
    return retroRow(0, 0);
  },
  caption: 'The double-lined arrow means “is made from”. The two dashed bonds are the ones next to the ends of the ring’s double bond, one carbon out.',
});

export default FIGURES;
