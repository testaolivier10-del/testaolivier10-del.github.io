/* Figures for the kinetic-thermodynamic notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   The page calls a barrier a "hill" and the free energy of a product a
   "valley", and every label here uses the same two words. Notes figures are
   up to 760 wide. Lesson copies (id prefix l-) are 340 wide or less and use
   fg-lbl / fg-tag text only. */
import { atom, bond, arrow, lonePair, text, tag, rule, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

/* ------------------------------------------------------------ helpers --- */

/* An energy profile through a list of nodes, each a minimum or a maximum,
   with a horizontal tangent at every node, so a valley looks like a valley
   rather than a corner. A node with `flat` runs level to that x after it. */
function profile(nodes, cls = 'fg-bond') {
  let d = `M${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1], b = nodes[i];
    if (a.flat !== undefined) d += ` L${a.flat} ${a.y}`;
    const ax = a.flat ?? a.x, h = (b.x - ax) * 0.5;
    d += ` C${ax + h} ${a.y} ${b.x - h} ${b.y} ${b.x} ${b.y}`;
  }
  const last = nodes[nodes.length - 1];
  if (last.flat !== undefined) d += ` L${last.flat} ${last.y}`;
  return `<path class="${cls}" fill="none" d="${d}"></path>`;
}

/* A vertical double-headed arrow: the height of a climb. */
function measure(x, yTop, yBottom) {
  return arrow(P(x, yBottom), P(x, yTop), { size: 7 }) + arrow(P(x, yTop), P(x, yBottom), { size: 7 });
}

const T = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-tag', size: 11, ...o });
const L = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-lbl', size: 13, ...o });

/* 3-bromobut-1-ene (the 1,2-product): C1=C2–C3(Br)–C4, skeletal. */
function bromobutene12(x0, y0) {
  const c = zig(x0, y0, 4, 30, 18);
  let s = bond(c[0], c[1], { order: 2, rFrom: 0, rTo: 0 });
  s += sk(c[1], c[2]) + sk(c[2], c[3]);
  const br = P(c[2].x, c[2].y + 32);
  s += bond(c[2], br, { rFrom: 0, rTo: 15 }) + atom(br.x, br.y, 'Br', { r: 15 });
  return s;
}

/* 1-bromobut-2-ene (the 1,4-product): Br–C1–C2=C3–C4, skeletal. */
function bromobutene14(x0, y0) {
  const c = zig(x0, y0, 4, 30, 18);
  const br = P(c[0].x - 30, c[0].y - 18);
  let s = bond(c[0], br, { rFrom: 0, rTo: 15 }) + atom(br.x, br.y, 'Br', { r: 15 });
  s += sk(c[0], c[1]) + ringDouble(c[1], c[2], P(c[1].x, c[2].y), { inset: 5 }) + sk(c[2], c[3]);
  return s;
}

const FIGURES = [];

/* ================================================================ 1 ===
   The diene case: one allylic cation, two routes down. The lower hill leads
   to the 1,2-product; the deeper valley holds the 1,4-product. */
FIGURES.push({
  id: 'kinetic-thermodynamic-wells',
  section: 'kinetic-thermodynamic',
  anchor: 'but it ends in a deeper valley.</p>',
  alt: 'Energy diagram for HBr and buta-1,3-diene after protonation. The allylic cation sits in the middle. The route to the left climbs a lower hill and ends at the 1,2-product, 3-bromobut-1-ene, drawn skeletally. The route to the right climbs a higher hill and ends in a deeper valley at the 1,4-product, (E)-1-bromobut-2-ene.',
  viewBox: '0 0 760 404',
  build() {
    let s = '';
    s += arrow(P(52, 372), P(52, 46));
    s += arrow(P(52, 372), P(744, 372));
    s += T(398, 394, 'reaction coordinate');
    s += T(62, 40, 'free energy', { anchor: 'start' });

    s += rule(220, 110, 550, 110);
    s += profile([{ x: 430, y: 110, flat: 330 }, { x: 250, y: 88 }, { x: 150, y: 196, flat: 90 }]);
    s += profile([{ x: 430, y: 110 }, { x: 520, y: 62 }, { x: 604, y: 244, flat: 700 }]);
    s += T(380, 98, 'the allylic cation');
    s += T(250, 72, 'lower hill: forms faster', { cls: 'fg-tag-good' });
    s += T(520, 46, 'higher hill', { cls: 'fg-tag-warn' });

    // The depth comparison.
    s += rule(150, 196, 724, 196);
    s += measure(716, 196, 244);
    s += T(706, 216, 'deeper valley:', { cls: 'fg-tag-good', anchor: 'end' });
    s += T(706, 232, 'more stable', { cls: 'fg-tag-good', anchor: 'end' });

    // The two products, named and drawn.
    s += L(125, 222, '1,2-product');
    s += bromobutene12(80, 270);
    s += text(125, 334, '3-bromobut-1-ene', { cls: 'fg-sm', size: 10.5 });
    s += L(655, 268, '1,4-product');
    s += bromobutene14(630, 316);
    s += '<text class="fg-sm" x="660" y="356" text-anchor="middle" font-size="10.5">(<tspan font-style="italic">E</tspan>)-1-bromobut-2-ene</text>';
    return s;
  },
  caption: 'Follow each route down from the cation. The lower hill and the deeper valley belong to different products.',
});

/* The same diagram, stacked narrow for the lesson. */
FIGURES.push({
  id: 'l-diene-wells',
  lessons: ['kinetic-thermodynamic'],
  alt: 'Energy diagram for HBr and buta-1,3-diene. The allylic cation sits in the middle. The route to the left climbs a lower hill to the 1,2-product, which forms faster. The route to the right climbs a higher hill to a deeper valley, the 1,4-product, which is more stable.',
  viewBox: '0 0 340 290',
  build() {
    let s = '';
    s += arrow(P(10, 266), P(10, 24));
    s += arrow(P(10, 266), P(334, 266));
    s += T(18, 20, 'free energy', { anchor: 'start' });
    s += rule(120, 104, 220, 104);
    s += profile([{ x: 190, y: 104, flat: 150 }, { x: 110, y: 70 }, { x: 70, y: 176, flat: 30 }]);
    s += profile([{ x: 190, y: 104 }, { x: 234, y: 44 }, { x: 280, y: 214, flat: 322 }]);
    s += T(170, 124, 'allylic cation');
    s += T(110, 56, 'lower hill', { cls: 'fg-tag-good' });
    s += T(234, 30, 'higher hill', { cls: 'fg-tag-warn' });
    s += rule(70, 176, 330, 176);
    s += L(64, 198, '1,2-product');
    s += T(64, 214, 'forms faster', { cls: 'fg-tag-good' });
    s += L(282, 236, '1,4-product');
    s += T(282, 252, 'more stable', { cls: 'fg-tag-good' });
    s += T(172, 284, 'reaction coordinate');
    return s;
  },
  caption: 'The lower hill and the deeper valley belong to different products.',
});

/* ================================================================ 2 ===
   The general picture, with the climbs back OUT of each valley marked:
   those are what temperature acts on. */
FIGURES.push({
  id: 'kinetic-thermodynamic-generic',
  section: 'kinetic-thermodynamic',
  anchor: 'what reaches the deep valley tends to stay there.</p>',
  alt: 'A general energy diagram: one intermediate in the middle, a lower hill on the left leading to a shallow valley, the kinetic product, and a higher hill on the right leading to a deeper valley, the thermodynamic product. Double-headed arrows mark the climb from each product back up to its hill: short on the left, long on the right.',
  viewBox: '0 0 760 404',
  build() {
    let s = '';
    s += arrow(P(44, 372), P(44, 60));
    s += arrow(P(44, 372), P(744, 372));
    s += T(394, 394, 'reaction coordinate');
    s += T(54, 54, 'free energy', { anchor: 'start' });

    s += rule(300, 150, 460, 150);
    s += T(380, 140, 'the intermediate');
    s += profile([{ x: 460, y: 150, flat: 300 }, { x: 222, y: 116 }, { x: 140, y: 240, flat: 80 }]);
    s += profile([{ x: 460, y: 150 }, { x: 534, y: 86 }, { x: 624, y: 310, flat: 680 }]);
    s += T(222, 104, 'lower hill (smaller ΔG‡)', { cls: 'fg-tag-good' });
    s += T(534, 74, 'higher hill (larger ΔG‡)', { cls: 'fg-tag-warn' });

    // The climbs back out.
    s += rule(98, 116, 222, 116);
    s += measure(106, 116, 240);

    s += rule(534, 86, 712, 86);
    s += measure(704, 86, 310);


    s += L(110, 266, 'kinetic product');
    s += T(110, 283, 'short climb back out', { cls: 'fg-tag-good' });
    s += L(640, 336, 'thermodynamic product');
    s += T(640, 353, 'long climb back out', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'The double arrows measure the climb from each product back up to its hill.',
});

FIGURES.push({
  id: 'l-barriers-out',
  lessons: ['kinetic-thermodynamic'],
  alt: 'The general energy diagram. A lower hill on the left leads to a shallow valley, the kinetic product, with a short climb back out. A higher hill on the right leads to a deep valley, the thermodynamic product, with a long climb back out.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    s += arrow(P(8, 274), P(8, 24));
    s += arrow(P(8, 274), P(336, 274));
    s += T(16, 20, 'free energy', { anchor: 'start' });
    s += rule(120, 104, 220, 104);
    s += T(170, 124, 'intermediate');
    s += profile([{ x: 190, y: 104, flat: 150 }, { x: 110, y: 70 }, { x: 70, y: 176, flat: 34 }]);
    s += profile([{ x: 190, y: 104 }, { x: 234, y: 44 }, { x: 280, y: 214, flat: 314 }]);
    s += T(110, 56, 'lower hill', { cls: 'fg-tag-good' });
    s += T(234, 30, 'higher hill', { cls: 'fg-tag-warn' });

    s += rule(36, 70, 110, 70);
    s += measure(44, 70, 176);
    s += rule(234, 44, 336, 44);
    s += measure(328, 44, 214);

    s += L(64, 200, 'kinetic');
    s += T(64, 216, 'short climb out', { cls: 'fg-tag-good' });
    s += L(262, 238, 'thermodynamic');
    s += T(262, 254, 'long climb out', { cls: 'fg-tag-warn' });
    s += T(172, 292, 'reaction coordinate');
    return s;
  },
  caption: 'Each double arrow is the climb from a product back up to its hill.',
});

/* ================================================================ 3 ===
   Preview: the two enolates of 2-methylcyclohexanone. The ring helper is a
   copy of the one in enolate-regiochemistry.mjs (C1 at the top; C2 upper
   right, C6 upper left). */
const rOf = (l) => (l === 'H' ? 11 : l.length >= 3 ? 17 : l.length === 2 ? 15 : 14);
const A = (p, l, o = {}) => atom(p.x, p.y, l, { r: rOf(l), ...o });
const chg = (x, y, s = '−') => text(x, y, s, { cls: 'fg-warn', size: 15 });
const LP = (p, deg, d = 20) => lonePair(p.x, p.y, -deg, { dist: d });

function ring(c, o = {}) {
  const r = o.r ?? 34;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    return P(c.x + r * Math.cos(a), c.y + r * Math.sin(a));
  });
  const dbl = o.dbl || 'CO';
  const hi = o.hi || [];
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = pts[i], b = pts[(i + 1) % 6];
    const isD = (dbl === 'C1C2' && i === 0) || (dbl === 'C1C6' && i === 5);
    const cls = hi.includes(i) ? 'fg-bond-hi' : undefined;
    s += isD ? ringDouble(a, b, c, { cls, inset: 9 }) : bond(a, b, { rFrom: 0, rTo: 0, cls });
  }
  const top = P(pts[0].x, pts[0].y - 44);
  s += bond(pts[0], top, { rFrom: 0, rTo: rOf('O'), order: dbl === 'CO' ? 2 : 1 });
  s += A(top, 'O');
  for (const q of o.subs || []) {
    const from = pts[q.at - 1];
    const end = armEnd(from, q.deg, 44);
    s += bond(from, end, { rFrom: 0, rTo: rOf(q.label), cls: q.bondCls });
    s += A(end, q.label, { kind: q.kind });
  }
  for (const k of o.loc || []) {
    const p = pts[k - 1];
    s += text(p.x + (c.x - p.x) * 0.42, p.y + (c.y - p.y) * 0.42 + 4, String(k), { cls: 'fg-tag-mut', size: 11 });
  }
  return { s, top };
}
const enolateO = (o) => LP(o, 90) + LP(o, 160) + LP(o, 20) + chg(o.x + 25, o.y - 19);
const ketoneO = (o) => LP(o, 150) + LP(o, 30);

/* ================================================================ 4 ===
   Preview: sulfonation of naphthalene. C1 and C8 point the same way, so a
   group on C1 crowds the hydrogen on C8; a group on C2 does not. */
function naphthalene(cx, cy, r, sub) {
  const w = r * Math.cos(Math.PI / 6);
  const R = polyPts(cx + w, cy, 6, r, 90);   // 0 top, 1 upper-left, 2 lower-left, 3 bottom, 4 lower-right, 5 upper-right
  const Lr = polyPts(cx - w, cy, 6, r, 90);
  const cR = P(cx + w, cy), cL = P(cx - w, cy);
  const C = { 1: R[0], 2: R[5], 3: R[4], 4: R[3], '4a': R[2], '8a': R[1], 5: Lr[3], 6: Lr[2], 7: Lr[1], 8: Lr[0] };
  const plain = (a, b) => bond(a, b, { rFrom: 0, rTo: 0 });
  let s = '';
  s += ringDouble(C[1], C[2], cR, { inset: 7 }) + plain(C[2], C[3]) + ringDouble(C[3], C[4], cR, { inset: 7 });
  s += plain(C[4], C['4a']) + ringDouble(C['4a'], C['8a'], cR, { inset: 7 }) + plain(C['8a'], C[1]);
  s += plain(C['4a'], C[5]) + ringDouble(C[5], C[6], cL, { inset: 7 }) + plain(C[6], C[7]);
  s += ringDouble(C[7], C[8], cL, { inset: 7 }) + plain(C[8], C['8a']);
  const num = (k, c) => text(C[k].x + (c.x - C[k].x) * 0.4, C[k].y + (c.y - C[k].y) * 0.4 + 4, String(k), { cls: 'fg-tag-mut', size: 11 });
  s += num(1, cR) + num(2, cR) + num(8, cL);
  if (sub === 1) {
    const g = P(C[1].x, C[1].y - 42);
    s += bond(C[1], g, { rFrom: 0, rTo: 19 }) + atom(g.x, g.y, 'SO₃H', { r: 19, kind: 'hi' });
    const h = P(C[8].x, C[8].y - 30);
    s += bond(C[8], h, { rFrom: 0, rTo: 11 }) + atom(h.x, h.y, 'H', { r: 11, kind: 'warn' });
    s += `<line class="fg-dash-hi" x1="${h.x + 13}" y1="${h.y - 2}" x2="${g.x - 21}" y2="${g.y + 4}"></line>`;
  } else {
    const g = armEnd(C[2], 30, 44);
    s += bond(C[2], g, { rFrom: 0, rTo: 19 }) + atom(g.x, g.y, 'SO₃H', { r: 19, kind: 'hi' });
  }
  return s;
}

FIGURES.push({
  id: 'kinetic-thermodynamic-naphthalene',
  section: 'kinetic-thermodynamic',
  anchor: 'where it does not crowd the hydrogen on C8: the thermodynamic product.</p>',
  alt: 'Preview. Left: naphthalene-1-sulfonic acid, formed at about 80 degrees Celsius, the kinetic product. Its SO3H group on C1 points the same way as the hydrogen on C8, and a dashed line marks the crowding between them. An arrow labeled 160 degrees, comes off and goes back on, leads right to naphthalene-2-sulfonic acid, the thermodynamic product, with SO3H on C2, pointing away from the other ring.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += naphthalene(190, 140, 34, 1);
    s += T(190, 22, '80 °C: kinetic product', { cls: 'fg-tag-good' });
    s += text(190, 212, 'naphthalene-1-sulfonic acid', { cls: 'fg-sm', size: 10.5 });
    s += T(126, 76, 'crowded', { cls: 'fg-tag-warn', anchor: 'end' });
    s += arrow(P(318, 140), P(442, 140));
    s += T(380, 128, 'heat to 160 °C');
    s += T(380, 162, 'comes off, goes back on', { cls: 'fg-tag-mut' });
    s += naphthalene(560, 140, 34, 2);
    s += T(560, 22, '160 °C: thermodynamic product');
    s += text(560, 212, 'naphthalene-2-sulfonic acid', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Preview only. C1 and C8 point the same way, so a group on C1 sits close to the hydrogen on C8. A group on C2 has no such neighbor.',
});

export default FIGURES;
