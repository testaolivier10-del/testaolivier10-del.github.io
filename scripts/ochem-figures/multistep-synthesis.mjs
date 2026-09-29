/* Figures for the multistep-synthesis notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every notes figure here has a lesson copy (id prefix l-) that is 340 wide,
   with its panels stacked and every label in fg-lbl or fg-tag. The drawing
   helpers take an origin, so the notes and lesson versions share them. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';
import { polyPts, ringDouble, benzene } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const r2 = (v) => (Math.round(v * 100) / 100).toString();
/* A point `len` from c, at `deg` measured counterclockwise from east. */
const at = (c, deg, len) => P(c.x + Math.cos((deg * Math.PI) / 180) * len, c.y - Math.sin((deg * Math.PI) / 180) * len);
const sk = (a, b, cls = 'fg-bond') => bond(a, b, { rFrom: 0, rTo: 0, cls });
const T = (x, y, s, cls = 'fg-tag', anchor = 'middle') => text(x, y, s, { cls, anchor, size: cls === 'fg-lbl' ? 12.5 : 11 });
/* Text with italic runs: parts beginning with '*' are set in italic. */
function rich(x, y, parts, cls = 'fg-tag', anchor = 'middle') {
  const body = parts.map((p) => (p[0] === '*'
    ? `<tspan font-style="italic">${p.slice(1)}</tspan>` : p.replace(/&/g, '&amp;'))).join('');
  return `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" font-size="${cls === 'fg-lbl' ? 12.5 : 11}">${body}</text>`;
}
const charge = (x, y, sign) => text(x, y, sign, { cls: 'fg-warn', size: 15 });
/* A down arrow with a reagent label beside it (lesson figures). */
function downStep(x, y1, y2, lines, kind, kindCls = 'fg-tag') {
  let s = arrow(P(x, y1), P(x, y2));
  const mid = (y1 + y2) / 2;
  lines.forEach((l, i) => { s += T(x + 14, mid - 4 + (i - (lines.length - 1) / 2) * 15, l, 'fg-tag', 'start'); });
  if (kind) s += T(x + 14, mid + 10 + (lines.length - 1) * 7.5, kind, kindCls, 'start');
  return s;
}

/* A Kekule benzene with its first vertex at the top. Vertex i sits at
   90 + 60i degrees: 0 top, 1 upper left, 2 lower left, 3 bottom, 4 lower
   right, 5 upper right. `subs` are labeled groups on vertices. */
function ring(cx, cy, r, subs = []) {
  const b = benzene(cx, cy, r);
  let s = b.svg;
  for (const sb of subs) {
    const v = b.pts[sb.v];
    const deg = 90 + 60 * sb.v;
    const end = at(v, deg, sb.len ?? 30);
    s += bond(v, end, { rFrom: 0, rTo: sb.r ?? 15 });
    s += atom(end.x, end.y, sb.label, { kind: sb.kind || 'plain', r: sb.r });
  }
  return { svg: s, pts: b.pts };
}

/* ======================================================= order-sets-pattern
   Nitration and bromination of benzene, in both orders. */
const NITRO = { label: 'NO₂', kind: 'warn', r: 16 };
const BROMO = { label: 'Br', r: 14 };
function orderRow(xs, cy, first, second, mid, product, verdict, vcls, nameDrop) {
  let s = '';
  const [x0, x1, x2] = xs;
  if (x0 !== null) {
    s += ring(x0, cy, 26).svg + T(x0, cy + 48, 'benzene');
    s += arrow(P(x0 + 44, cy), P(x1 - 60, cy));
    s += T((x0 + x1) / 2 - 8, cy - 12, first);
  }
  s += ring(x1, cy, 26, mid.subs).svg + T(x1, cy + 48, mid.name);
  s += arrow(P(x1 + 50, cy), P(x2 - 56, cy));
  s += T((x1 + x2) / 2 - 3, cy - 12, second);
  s += ring(x2, cy, 26, product.subs).svg;
  s += T(x2, cy + nameDrop, product.name, 'fg-lbl');
  s += rich(x2, cy + nameDrop + 18, verdict, vcls);
  return s;
}
const ROUTE_A = {
  mid: { name: 'nitrobenzene', subs: [{ v: 0, ...NITRO }] },
  product: { name: '1-bromo-3-nitrobenzene', subs: [{ v: 0, ...NITRO }, { v: 4, ...BROMO }] },
  verdict: ['NO₂ directs ', '*meta'],
};
const ROUTE_B = {
  mid: { name: 'bromobenzene', subs: [{ v: 0, ...BROMO }] },
  product: { name: '1-bromo-4-nitrobenzene', subs: [{ v: 0, ...BROMO }, { v: 3, ...NITRO }] },
  verdict: ['Br directs ', '*ortho', ', ', '*para'],
};
FIGURES.push({
  id: 'order-sets-pattern',
  section: 'multistep-synthesis',
  anchor: '<!-- fig:order-sets-pattern:start -->',
  alt: 'Two routes from benzene. Route A: nitric and sulfuric acid give nitrobenzene, then bromine and iron tribromide give 1-bromo-3-nitrobenzene, with the bromine meta to the nitro group. Route B: bromine and iron tribromide give bromobenzene, then nitric and sulfuric acid give 1-bromo-4-nitrobenzene, with the nitro group para to the bromine.',
  viewBox: '0 0 700 436',
  build() {
    let s = '';
    s += T(20, 24, 'A · nitrate first', 'fg-lbl', 'start');
    s += orderRow([90, 330, 580], 110, 'HNO₃, H₂SO₄', 'Br₂, FeBr₃', ROUTE_A.mid, ROUTE_A.product, ROUTE_A.verdict, 'fg-tag-warn', 64);
    s += rule(20, 200, 680, 200);
    s += T(20, 226, 'B · brominate first', 'fg-lbl', 'start');
    s += orderRow([90, 330, 580], 300, 'Br₂, FeBr₃', 'HNO₃, H₂SO₄', ROUTE_B.mid, ROUTE_B.product, ROUTE_B.verdict, 'fg-tag-good', 92);
    s += rich(580, 424, ['plus some of the ', '*ortho', ' isomer, separated off'], 'fg-tag-mut');
    return s;
  },
  caption: 'Same two reactions in opposite orders. Look at where the second group lands in each product.',
  note: 'Route A&rsquo;s second step is the slow one: nitro deactivates the ring far more than bromine does, so the bromination has to be forced. Route B&rsquo;s nitration runs easily.',
});
FIGURES.push({
  id: 'l-order-sets-pattern',
  lessons: ['multistep-synthesis'],
  alt: 'Route A: nitrobenzene, made from benzene with nitric and sulfuric acid, is brominated with bromine and iron tribromide to 1-bromo-3-nitrobenzene, bromine meta to the nitro group. Route B: bromobenzene, made from benzene with bromine, is nitrated to 1-bromo-4-nitrobenzene, nitro para to bromine.',
  viewBox: '0 0 340 420',
  build() {
    let s = '';
    s += T(10, 20, 'A · nitrate benzene first', 'fg-lbl', 'start');
    s += orderRow([null, 80, 250], 98, '', 'Br₂, FeBr₃', ROUTE_A.mid, ROUTE_A.product, ROUTE_A.verdict, 'fg-tag-warn', 62);
    s += rule(10, 190, 330, 190);
    s += T(10, 214, 'B · brominate benzene first', 'fg-lbl', 'start');
    s += orderRow([null, 80, 250], 290, '', 'HNO₃, H₂SO₄', ROUTE_B.mid, ROUTE_B.product, ROUTE_B.verdict, 'fg-tag-good', 90);
    s += rich(250, 412, ['plus some ', '*ortho', ' isomer'], 'fg-tag-mut');
    return s;
  },
  caption: 'Look at where the second group lands in each product.',
});

/* ========================================================= propyl-routes
   Friedel-Crafts alkylation rearranges; acylation then reduction does not. */
/* Side chains grow upward from a ring's top vertex T. */
function isopropyl(T0, L) {
  const ch = at(T0, 90, L);
  return sk(T0, ch) + sk(ch, at(ch, 30, L)) + sk(ch, at(ch, 150, L));
}
function propyl(T0, L, acyl) {
  const c1 = at(T0, 90, L), c2 = at(c1, 30, L), c3 = at(c2, 90, L);
  let s = sk(T0, c1, acyl ? 'fg-bond-hi' : 'fg-bond') + sk(c1, c2) + sk(c2, c3);
  if (acyl) {
    const o = at(c1, 150, L + 2);
    s += bond(c1, o, { order: 2, rFrom: 0, rTo: 12 }) + atom(o.x, o.y, 'O', { r: 12 });
  }
  return s;
}
/* A primary propyl cation with the migrating H drawn, then the secondary
   cation it becomes. `sp` is the spacing between the three carbons. */
function hydrideShift(x0, y, sp, arrowLen, notes) {
  let s = '';
  const a = P(x0, y), b = P(x0 + sp, y), c = P(x0 + 2 * sp, y);
  const hu = P(b.x, y - 38), hd = P(b.x, y + 38);
  s += bond(a, b, { rFrom: 17, rTo: 12 }) + bond(b, c, { rFrom: 12, rTo: 17 });
  s += bond(b, hu, { rFrom: 12, rTo: 10, cls: 'fg-bond-hi' }) + bond(b, hd, { rFrom: 12, rTo: 10 });
  s += atom(a.x, a.y, 'CH₃', { r: 17 }) + atom(b.x, b.y, 'C', { r: 12 }) + atom(c.x, c.y, 'CH₂', { r: 17, kind: 'warn' });
  s += atom(hu.x, hu.y, 'H', { r: 10, kind: 'hi' }) + atom(hd.x, hd.y, 'H', { r: 10 });
  s += charge(c.x + 20, c.y - 16, '+');
  s += curve(P(b.x + 5, y - 22), P(c.x - 6, c.y - 18), { bow: -14 });
  const ax = c.x + 30;
  s += arrow(P(ax, y), P(ax + arrowLen, y));
  s += T(ax + arrowLen / 2, y + 20, notes ? 'hydride shift' : 'H shifts');
  const d = P(ax + arrowLen + 30, y), e = P(d.x + sp * 0.85, y), f = P(d.x + sp * 1.7, y);
  s += bond(d, e, { rFrom: 17, rTo: 15 }) + bond(e, f, { rFrom: 15, rTo: 17 });
  s += atom(d.x, d.y, 'CH₃', { r: 17 }) + atom(e.x, e.y, 'CH', { r: 15, kind: 'warn' }) + atom(f.x, f.y, 'CH₃', { r: 17 });
  s += charge(e.x, e.y - 20, '+');
  s += T(b.x, y + 64, 'primary cation', 'fg-tag-warn') + T(e.x, y + 64, 'secondary cation', 'fg-tag-good');
  return s;
}
FIGURES.push({
  id: 'propyl-routes',
  section: 'multistep-synthesis',
  anchor: '<!-- fig:propyl-routes:start -->',
  alt: 'Row A: benzene with 1-bromopropane and aluminum chloride gives isopropylbenzene. Below it, the reason: the primary propyl cation, CH3–CH2–CH2 plus, moves a hydrogen with its bonding pair from the middle carbon to the end carbon, giving the secondary cation CH3–CH plus–CH3. Row B: benzene with propanoyl chloride and aluminum chloride gives propiophenone, whose new ring-to-carbon bond is highlighted; zinc amalgam and HCl reduce it to propylbenzene; bromine and iron tribromide give 1-bromo-4-propylbenzene.',
  viewBox: '0 0 740 600',
  build() {
    let s = '';
    s += T(20, 24, 'A · alkylate: the chain rearranges', 'fg-lbl', 'start');
    const ya = 120;
    s += ring(80, ya, 24).svg + T(80, ya + 46, 'benzene');
    s += arrow(P(120, ya), P(250, ya));
    s += T(185, ya - 12, 'CH₃CH₂CH₂Br, AlCl₃');
    const ip = ring(310, ya, 24);
    s += ip.svg + isopropyl(ip.pts[0], 24);
    s += T(310, ya + 46, 'isopropylbenzene', 'fg-lbl');
    s += T(310, ya + 64, 'the major product', 'fg-tag-warn');
    s += T(400, 212, 'why: the primary cation shifts to a more stable one', 'fg-tag', 'middle');
    s += hydrideShift(250, 272, 58, 80, true);
    s += rule(20, 360, 720, 360);
    s += T(20, 386, 'B · acylate, reduce, then brominate', 'fg-lbl', 'start');
    const yb = 500;
    s += ring(60, yb, 22).svg + T(60, yb + 44, 'benzene');
    s += arrow(P(94, yb), P(196, yb));
    s += T(145, yb - 26, 'CH₃CH₂COCl,') + T(145, yb - 12, 'AlCl₃');
    const pp = ring(245, yb, 22);
    s += pp.svg + propyl(pp.pts[0], 24, true) + T(245, yb + 44, 'propiophenone');
    s += arrow(P(290, yb), P(390, yb));
    s += T(340, yb - 12, 'Zn(Hg), HCl');
    const pb = ring(440, yb, 22);
    s += pb.svg + propyl(pb.pts[0], 24, false) + T(440, yb + 44, 'propylbenzene');
    s += arrow(P(485, yb), P(585, yb));
    s += T(535, yb - 12, 'Br₂, FeBr₃');
    const bp = ring(640, yb, 22, [{ v: 3, ...BROMO, len: 26 }]);
    s += bp.svg + propyl(bp.pts[0], 24, false);
    s += T(640, 578, '1-bromo-4-propylbenzene', 'fg-lbl');
    s += T(245, yb + 62, 'new ring–carbon bond highlighted', 'fg-tag-good');
    return s;
  },
  caption: 'Row A ends with the wrong chain; row B keeps the straight one. The middle row shows where A goes wrong.',
});
FIGURES.push({
  id: 'l-propyl-routes',
  lessons: ['multistep-synthesis'],
  alt: 'Top: benzene with 1-bromopropane and aluminum chloride gives isopropylbenzene. Middle: the primary propyl cation moves a hydrogen from the middle carbon to the end carbon and becomes the secondary cation CH3–CH plus–CH3. Bottom: benzene with propanoyl chloride and aluminum chloride gives propiophenone, and zinc amalgam with HCl reduces it to propylbenzene.',
  viewBox: '0 0 340 470',
  build() {
    let s = '';
    s += T(10, 20, 'alkylate', 'fg-lbl', 'start');
    s += ring(50, 100, 20).svg;
    s += arrow(P(84, 100), P(214, 100));
    s += T(149, 74, 'CH₃CH₂CH₂Br,') + T(149, 89, 'AlCl₃');
    const ip = ring(270, 110, 20);
    s += ip.svg + isopropyl(ip.pts[0], 22);
    s += T(270, 152, 'isopropylbenzene', 'fg-tag-warn');
    s += T(170, 184, 'why: the cation rearranges', 'fg-tag');
    s += hydrideShift(28, 238, 44, 40, false);
    s += rule(10, 318, 330, 318);
    s += T(10, 340, 'acylate, then reduce', 'fg-lbl', 'start');
    const yb = 420;
    s += ring(36, yb, 18).svg;
    s += arrow(P(62, yb), P(128, yb));
    s += T(96, yb - 30, 'CH₃CH₂COCl,') + T(96, yb - 15, 'AlCl₃');
    const pp = ring(170, yb, 18);
    s += pp.svg + propyl(pp.pts[0], 22, true);
    s += arrow(P(204, yb), P(262, yb));
    s += T(233, yb - 30, 'Zn(Hg),') + T(233, yb - 15, 'HCl');
    const pb = ring(298, yb, 18);
    s += pb.svg + propyl(pb.pts[0], 22, false);
    s += T(170, yb + 40, 'propiophenone') + T(290, yb + 40, 'propylbenzene', 'fg-tag-good');
    return s;
  },
  caption: 'Compare the chain on each final product.',
});

/* ========================================================= four-step-route
   Butan-1-ol to 2-methylhexan-2-ol, drawn skeletally. Every chain runs
   left to right, ending at the carbon that reacts. */
const BL = 24;
const zigP = (x0, y0, n, up0 = 0) =>
  Array.from({ length: n }, (_, i) => P(x0 + i * BL * Math.cos(Math.PI / 6), y0 - ((i + up0) % 2 ? BL / 2 : 0)));
const chain = (pts, hiFrom = -1) => pts.slice(1).map((p, i) => sk(pts[i], p, i === hiFrom ? 'fg-bond-hi' : 'fg-bond')).join('');
/* Each builder takes the left end of the chain on the baseline. */
const MOLS = {
  butanol(x, y) {
    const p = zigP(x, y, 4);
    const o = at(p[3], 330, BL);
    return chain(p) + bond(p[3], o, { rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'OH');
  },
  bromobutane(x, y) {
    const p = zigP(x, y, 4);
    const o = at(p[3], 330, BL);
    return chain(p) + bond(p[3], o, { rFrom: 0, rTo: 14 }) + atom(o.x, o.y, 'Br', { r: 14 });
  },
  nitrile(x, y) {
    const p = zigP(x, y, 5);
    const n = at(p[4], 330, BL);
    return chain(p, 3) + bond(p[4], n, { order: 3, rFrom: 0, rTo: 13, gap: 3 }) + atom(n.x, n.y, 'N', { r: 13 });
  },
  acyl(x, y, g) {
    const p = zigP(x, y, 5, 1);
    const o = at(p[4], 90, BL), z = at(p[4], 330, BL);
    return chain(p) + bond(p[4], o, { order: 2, rFrom: 0, rTo: 13 }) + atom(o.x, o.y, 'O', { r: 13 }) +
      bond(p[4], z, { rFrom: 0, rTo: 15 }) + atom(z.x, z.y, g);
  },
  product(x, y) {
    const p = zigP(x, y, 5, 1);
    const m1 = at(p[4], 90, BL), m2 = at(p[4], 330, BL), o = at(p[4], 270, BL + 2);
    return chain(p) + sk(p[4], m1, 'fg-bond-hi') + sk(p[4], m2, 'fg-bond-hi') +
      bond(p[4], o, { rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'OH');
  },
};
FIGURES.push({
  id: 'four-step-route',
  section: 'multistep-synthesis',
  anchor: '<!-- fig:four-step-route:start -->',
  alt: 'Six skeletal structures in two rows. Row 1: butan-1-ol, 4 carbons; phosphorus tribromide gives 1-bromobutane, 4 carbons; sodium cyanide gives pentanenitrile, 5 carbons, with the new carbon–carbon bond highlighted. An elbow arrow labeled aqueous acid and heat leads down to row 2: pentanoic acid, 5 carbons; thionyl chloride gives pentanoyl chloride, 5 carbons; two equivalents of methylmagnesium bromide, then aqueous acid, give 2-methylhexan-2-ol, 7 carbons, with its two new methyl bonds highlighted.',
  viewBox: '0 0 700 302',
  build() {
    let s = '';
    const y1 = 70, y2 = 232;
    const step = (x1, x2, y, lines, kind, good) => {
      s += arrow(P(x1, y - 6), P(x2, y - 6));
      lines.forEach((l, i) => { s += T((x1 + x2) / 2, y - 18 - (lines.length - 1 - i) * 14, l); });
      s += T((x1 + x2) / 2, y + 12, kind, good ? 'fg-tag-good' : 'fg-tag-mut');
    };
    s += MOLS.butanol(40, y1) + T(85, y1 + 44, 'butan-1-ol · 4 C');
    step(160, 236, y1, ['PBr₃'], 'no new C–C', false);
    s += MOLS.bromobutane(256, y1) + T(300, y1 + 44, '1-bromobutane · 4 C');
    step(372, 452, y1, ['NaCN, DMSO'], 'new C–C', true);
    s += MOLS.nitrile(468, y1) + T(520, y1 + 44, 'pentanenitrile · 5 C');
    // Elbow from the end of row 1 down to the start of row 2.
    s += `<path class="fg-arrow" d="M602 64 L640 64 L640 156 L70 156 L70 188" fill="none"></path>`;
    s += `<path class="fg-head" d="M70 196 L65.84 188 L74.16 188 Z"></path>`;
    s += T(355, 148, 'H₃O⁺, heat') + T(355, 174, 'no new C–C', 'fg-tag-mut');
    s += MOLS.acyl(40, y2, 'OH') + T(95, y2 + 44, 'pentanoic acid · 5 C');
    step(178, 244, y2, ['SOCl₂'], 'no new C–C', false);
    s += MOLS.acyl(262, y2, 'Cl') + T(320, y2 + 44, 'pentanoyl chloride · 5 C');
    step(404, 510, y2, ['1. 2 CH₃MgBr', '2. H₃O⁺'], 'new C–C × 2', true);
    s += MOLS.product(528, y2) + T(590, y2 + 58, '2-methylhexan-2-ol · 7 C');
    return s;
  },
  caption: 'Follow the carbon count after each name, and the green tag under each arrow.',
});
FIGURES.push({
  id: 'l-four-step-route',
  lessons: ['multistep-synthesis'],
  alt: 'A vertical route in skeletal structures: butan-1-ol, 4 carbons; with PBr3, 1-bromobutane, 4 carbons; with NaCN, pentanenitrile, 5 carbons, new C–C bond highlighted; with aqueous acid and heat, pentanoic acid, 5 carbons; with SOCl2, pentanoyl chloride, 5 carbons; with two equivalents of CH3MgBr then aqueous acid, 2-methylhexan-2-ol, 7 carbons, its two new methyl bonds highlighted.',
  viewBox: '0 0 340 590',
  build() {
    let s = '';
    const X = 64, NX = 196;
    const ys = [44, 140, 236, 344, 440, 536];
    const names = [['butan-1-ol', '4 C'], ['1-bromobutane', '4 C'], ['pentanenitrile', '5 C'],
      ['pentanoic acid', '5 C'], ['pentanoyl chloride', '5 C'], ['2-methylhexan-2-ol', '7 C']];
    s += MOLS.butanol(X, ys[0]) + MOLS.bromobutane(X, ys[1]) + MOLS.nitrile(X, ys[2]) +
      MOLS.acyl(X, ys[3], 'OH') + MOLS.acyl(X, ys[4], 'Cl') + MOLS.product(X, ys[5]);
    names.forEach(([nm, c], i) => { s += T(NX, ys[i] - 8, nm, 'fg-lbl', 'start') + T(NX, ys[i] + 10, c, 'fg-tag', 'start'); });
    const gaps = [[['PBr₃'], 'no new C–C', 'fg-tag-mut'], [['NaCN, DMSO'], 'new C–C', 'fg-tag-good'],
      [['H₃O⁺, heat'], 'no new C–C', 'fg-tag-mut'], [['SOCl₂'], 'no new C–C', 'fg-tag-mut'],
      [['1. 2 CH₃MgBr', '2. H₃O⁺'], 'new C–C × 2', 'fg-tag-good']];
    gaps.forEach(([l, k, c], i) => {
      const top = ys[i] + (i === 2 ? 30 : 20), bot = ys[i + 1] - (i >= 2 ? 44 : 22);
      s += downStep(28, top, bot, l, k, c);
    });
    return s;
  },
  caption: 'Follow the carbon count beside each name.',
});

/* ============================================================ stereo-faces
   Three stereospecific additions on six-membered rings. The ring is flat
   in the page; a wedge points toward you and a hash away. The two top
   vertices are the alkene carbons: i1 at the upper right, i2 upper left. */
function hexRing(cx, cy, r, alkene) {
  const pts = polyPts(cx, cy, 6, r, 0);
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = pts[i], b = pts[(i + 1) % 6];
    s += (alkene && i === 1) ? ringDouble(a, b, P(cx, cy), { inset: r * 0.16, gap: 4.2 }) : sk(a, b);
  }
  return { s, c1: pts[1], c2: pts[2] };
}
/* One substituent: kind 'w' wedge, 'h' hash, 'p' plain. */
function subst(from, deg, len, lab, kind, r = 15, hi = false) {
  const end = at(from, deg, len);
  const o = { rFrom: 0, rTo: r };
  const ink = kind === 'w' ? wedge(from, end, { ...o, width: 8 })
    : kind === 'h' ? hash(from, end, { ...o, width: 9, rungs: 4 })
      : bond(from, end, o);
  return ink + atom(end.x, end.y, lab, { r, kind: hi ? 'hi' : 'plain' });
}
const RING_CASES = {
  br2: {
    mode: 'anti', sm: 'cyclohexene', reagent: 'Br₂', short: 'Br₂',
    smSubs: () => '',
    prods: [[['Br', 'w'], ['Br', 'h']], [['Br', 'h'], ['Br', 'w']]],
    name: ['*trans', '-1,2-dibromocyclohexane'], verdict: ['two enantiomers, 50 : 50'],
  },
  os: {
    mode: 'syn', sm: '1-methylcyclohexene', reagent: 'OsO₄, NMO', short: 'OsO₄',
    smSubs: (c1, L) => subst(c1, 60, L, 'CH₃', 'p', 16),
    prods: [[['OH', 'w'], ['OH', 'w'], ['CH₃', 'h']], [['OH', 'h'], ['OH', 'h'], ['CH₃', 'w']]],
    name: ['1-methylcyclohexane-1,2-diol, OH groups ', '*cis'], verdict: ['two enantiomers, 50 : 50'],
  },
  h2: {
    mode: 'syn', sm: '1,2-dimethylcyclohexene', reagent: 'H₂, Pt', short: 'H₂, Pt',
    smSubs: (c1, L, c2) => subst(c1, 60, L, 'CH₃', 'p', 16) + subst(c2, 120, L, 'CH₃', 'p', 16),
    prods: [[['CH₃', 'w'], ['CH₃', 'w'], null, true]],
    name: ['*cis', '-1,2-dimethylcyclohexane'], verdict: ['one compound (', '*meso', ')'],
  },
};
/* Draw one product ring. spec: [c1 group, c2 group, extra c1 group, H2 case].
   r is the ring radius and L the substituent bond length. */
function ringProduct(cx, cy, r, L, spec) {
  const ring0 = hexRing(cx, cy, r, false);
  let s = ring0.s;
  const [g1, g2, g3, hyd] = spec;
  if (hyd) {
    s += subst(ring0.c1, 60, L, g1[0], g1[1], 16) + subst(ring0.c2, 120, L, g2[0], g2[1], 16);
    s += subst(ring0.c1, 0, L - 6, 'H', 'h', 10, true) + subst(ring0.c2, 180, L - 6, 'H', 'h', 10, true);
  } else if (g3) {
    s += subst(ring0.c1, 90, L, g1[0], g1[1], 15, true) + subst(ring0.c2, 150, L, g2[0], g2[1], 15, true);
    s += subst(ring0.c1, 20, L, g3[0], g3[1], 16);
  } else {
    s += subst(ring0.c1, 60, L, g1[0], g1[1], 14, true) + subst(ring0.c2, 120, L, g2[0], g2[1], 14, true);
  }
  return s;
}
/* One row: the alkene, the arrow and the product(s), with the product
   name and verdict under the products. */
function stereoRow(k, top, W, o) {
  const c = RING_CASES[k];
  let s = panel(o.pad, top, W - 2 * o.pad, o.h);
  const cy = top + o.cy;
  const sm = hexRing(o.smX, cy, o.r, true);
  s += sm.s + c.smSubs(sm.c1, o.smL ?? o.L, sm.c2);
  if (o.smName) s += T(o.smX, cy + o.r + 22, c.sm);
  s += arrow(P(o.a1, cy), P(o.a2, cy));
  s += T((o.a1 + o.a2) / 2, o.below ? cy + 20 : cy - 10, c.reagent);
  s += T((o.a1 + o.a2) / 2, o.below ? cy - 10 : cy + 18, c.mode, 'fg-tag-good');
  if (c.prods.length === 2) {
    s += ringProduct(o.p1, cy, o.r, o.L, c.prods[0]) + ringProduct(o.p2, cy, o.r, o.L, c.prods[1]);
    if (o.and) s += T((o.p1 + o.p2) / 2, cy + 4, 'and', 'fg-tag-mut');
  } else {
    s += ringProduct((o.p1 + o.p2) / 2, cy, o.r, o.L, c.prods[0]);
  }
  s += rich(o.nameX, top + o.h - 30, c.name, o.nameCls);
  s += rich(o.nameX, top + o.h - 12, c.verdict, 'fg-tag-good');
  return s;
}
FIGURES.push({
  id: 'stereo-faces',
  section: 'multistep-synthesis',
  anchor: '<!-- fig:stereo-faces:start -->',
  alt: 'Three rows, each an alkene ring, an arrow and the product. Row 1: cyclohexene with Br2 gives trans-1,2-dibromocyclohexane, drawn as a pair of mirror images, one Br on a wedge and one on a hash in each, formed 50 to 50. Row 2: 1-methylcyclohexene with OsO4 and NMO gives 1-methylcyclohexane-1,2-diol with its two OH groups cis, drawn as a pair of mirror images, both OH groups on wedges in one and both on hashes in the other, formed 50 to 50. Row 3: 1,2-dimethylcyclohexene with H2 over platinum gives cis-1,2-dimethylcyclohexane, both methyls on wedges and both new hydrogens on hashes; it is meso, a single compound.',
  viewBox: '0 0 760 516',
  build() {
    let s = '';
    const o = { pad: 8, h: 164, cy: 86, r: 26, L: 34, smX: 110, smName: true, a1: 180, a2: 290,
      p1: 390, p2: 560, and: true, nameX: 475, nameCls: 'fg-lbl' };
    ['br2', 'os', 'h2'].forEach((k, i) => { s += stereoRow(k, 6 + i * 170, 760, o); });
    return s;
  },
  caption: 'Wedges point toward you, hashes away. In each product, compare the faces the two new groups sit on.',
});
FIGURES.push({
  id: 'l-stereo-faces',
  lessons: ['multistep-synthesis'],
  alt: 'Three rows. Cyclohexene with Br2 gives trans-1,2-dibromocyclohexane as a 50 to 50 pair of mirror images, one Br wedged and one hashed. 1-Methylcyclohexene with OsO4 gives 1-methylcyclohexane-1,2-diol, OH groups cis, as a 50 to 50 pair, both OH wedged in one and both hashed in the other. 1,2-Dimethylcyclohexene with H2 over platinum gives cis-1,2-dimethylcyclohexane, both methyls wedged and both new hydrogens hashed, a single meso compound.',
  viewBox: '0 0 340 516',
  build() {
    let s = '';
    const o = { pad: 4, h: 164, cy: 76, r: 18, L: 28, smL: 24, smX: 50, smName: false, a1: 76, a2: 128, below: true,
      p1: 170, p2: 284, and: false, nameX: 170, nameCls: 'fg-tag' };
    ['br2', 'os', 'h2'].forEach((k, i) => { s += stereoRow(k, 6 + i * 170, 340, o); });
    return s;
  },
  caption: 'Wedges point toward you, hashes away.',
});

/* ============================================================ hexyne-route
   Acetylene to hex-3-yne by two acetylide alkylations. sp carbons are
   drawn in a straight line. */
function acetylene(x, y) {
  const h1 = P(x, y), c1 = P(x + 34, y), c2 = P(x + 80, y), h2 = P(x + 114, y);
  return bond(h1, c1, { rFrom: 10, rTo: 12 }) + bond(c1, c2, { order: 3, rFrom: 12, rTo: 12, gap: 3 }) +
    bond(c2, h2, { rFrom: 12, rTo: 10 }) +
    atom(h1.x, h1.y, 'H', { r: 10 }) + atom(c1.x, c1.y, 'C', { r: 12 }) +
    atom(c2.x, c2.y, 'C', { r: 12 }) + atom(h2.x, h2.y, 'H', { r: 10 });
}
function butyne(x, y) {
  const h = P(x, y), c1 = P(x + 30, y), c2 = P(x + 60, y), c3 = P(x + 88, y), c4 = at(c3, 300, 26);
  return bond(h, c1, { rFrom: 10, rTo: 0 }) + bond(c1, c2, { order: 3, rFrom: 0, rTo: 0, gap: 3 }) +
    sk(c2, c3, 'fg-bond-hi') + sk(c3, c4) + atom(h.x, h.y, 'H', { r: 10 });
}
function hexyne(x, y) {
  const c2 = P(x, y), c1 = at(c2, 120, 26), c3 = P(x + 28, y), c4 = P(x + 58, y), c5 = P(x + 86, y), c6 = at(c5, 300, 26);
  return sk(c1, c2) + sk(c2, c3, 'fg-bond-hi') + bond(c3, c4, { order: 3, rFrom: 0, rTo: 0, gap: 3 }) +
    sk(c4, c5, 'fg-bond-hi') + sk(c5, c6);
}
FIGURES.push({
  id: 'hexyne-route',
  section: 'multistep-synthesis',
  anchor: '<!-- fig:hexyne-route:start -->',
  alt: 'Ethyne, H–C≡C–H, 2 carbons. Sodium amide then bromoethane give but-1-yne, 4 carbons, with the new carbon–carbon bond highlighted. Sodium amide then bromoethane again give hex-3-yne, 6 carbons, with both bonds that the two alkylations made highlighted. The triple-bond carbons and their neighbors are drawn in a straight line.',
  viewBox: '0 0 720 140',
  build() {
    let s = '';
    const y = 66;
    s += acetylene(20, y) + T(77, y + 46, 'ethyne (acetylene) · 2 C');
    s += arrow(P(158, y), P(276, y));
    s += T(217, y - 30, '1. NaNH₂') + T(217, y - 14, '2. CH₃CH₂Br') + T(217, y + 20, 'new C–C', 'fg-tag-good');
    s += butyne(300, y) + T(350, y + 46, 'but-1-yne · 4 C');
    s += arrow(P(430, y), P(548, y));
    s += T(489, y - 30, '1. NaNH₂') + T(489, y - 14, '2. CH₃CH₂Br') + T(489, y + 20, 'new C–C', 'fg-tag-good');
    s += hexyne(600, y) + T(640, y + 46, 'hex-3-yne · 6 C');
    return s;
  },
  caption: 'The highlighted bonds are the ones the two alkylations made.',
});
FIGURES.push({
  id: 'l-hexyne-route',
  lessons: ['multistep-synthesis'],
  alt: 'Top to bottom: ethyne, H–C≡C–H; sodium amide then bromoethane give but-1-yne, with the new carbon–carbon bond highlighted; the same two reagents again give hex-3-yne, with both new carbon–carbon bonds highlighted.',
  viewBox: '0 0 340 290',
  build() {
    let s = '';
    s += acetylene(30, 34) + T(170, 38, 'ethyne · 2 C', 'fg-tag', 'start');
    s += downStep(80, 54, 116, ['1. NaNH₂', '2. CH₃CH₂Br'], 'new C–C', 'fg-tag-good');
    s += butyne(30, 146) + T(170, 150, 'but-1-yne · 4 C', 'fg-tag', 'start');
    s += downStep(80, 176, 238, ['1. NaNH₂', '2. CH₃CH₂Br'], 'new C–C', 'fg-tag-good');
    s += hexyne(50, 266) + T(170, 270, 'hex-3-yne · 6 C', 'fg-tag', 'start');
    return s;
  },
  caption: 'The highlighted bonds are the ones the alkylations made.',
});

/* ======================================================= hexene-bromination
   The alkene drawn edge-on, seen from slightly above, as in the Addition
   reactions figures: the C=C runs across the page, a wedge points toward
   you, a hash away, and the top face of the alkene is up the page.
   Checked with RDKit from these coordinates: the trans row gives
   (3R,4S), meso; the cis row gives (3R,4R), and its mirror image (3S,4S). */
const GRP_R = { Et: 13, H: 10, Br: 14 };
function persp(cx, cy, g, o = {}) {
  const d = o.half ?? 28, L = o.len ?? 36, m = o.mirror ? -1 : 1;
  const c3 = P(cx - d * m, cy), c4 = P(cx + d * m, cy);
  const ang = (deg) => (m === 1 ? deg : 180 - deg);
  let s = '';
  const put = (c, deg, lab, kind, hi) => {
    const end = at(c, ang(deg), L);
    const r = GRP_R[lab];
    const opt = { rFrom: 11, rTo: r };
    s += kind === 'w' ? wedge(c, end, { ...opt, width: 8 }) : kind === 'h' ? hash(c, end, { ...opt, width: 9, rungs: 4 }) : bond(c, end, opt);
    s += atom(end.x, end.y, lab, { r, kind: hi ? 'hi' : 'plain' });
  };
  if (o.stage === 'alkene') {
    s += bond(c3, c4, { order: 2, rFrom: 11, rTo: 11 });
    put(c3, 215, g[0], 'w'); put(c3, 150, g[1], 'h'); put(c4, 325, g[2], 'w'); put(c4, 30, g[3], 'h');
  } else if (o.stage === 'bromonium') {
    s += bond(c3, c4, { rFrom: 11, rTo: 11 });
    put(c3, 215, g[0], 'w'); put(c3, 160, g[1], 'h'); put(c4, 325, g[2], 'w'); put(c4, 20, g[3], 'h');
    const br = P(cx, cy - 50);
    s += bond(c3, br, { rFrom: 11, rTo: 15 }) + bond(c4, br, { rFrom: 11, rTo: 15 });
    s += atom(br.x, br.y, 'Br', { r: 15, kind: 'hi' }) + charge(br.x, br.y - 24, '+');
    s += lonePair(br.x, br.y, 190, { dist: 20 }) + lonePair(br.x, br.y, 350, { dist: 20 });
    const bm = P(c4.x + 12, cy + 64);
    s += atom(bm.x, bm.y, 'Br', { r: 15 }) + charge(bm.x + 24, bm.y - 12, '−');
    for (const a of [270, 180, 90]) s += lonePair(bm.x, bm.y, a, { dist: 20 });
    s += lonePair(bm.x, bm.y, 0, { dist: 20 });
    s += curve(P(bm.x - 2, bm.y - 26), P(c4.x + 1, c4.y + 14), { bow: -10 });
    const mid = P((c4.x + br.x) / 2 + 4, (c4.y + br.y) / 2 + 2);
    s += curve(mid, P(br.x + 15, br.y + 8), { bow: 12 });
  } else {
    s += bond(c3, c4, { rFrom: 11, rTo: 11 });
    put(c3, 90, 'Br', 'p', true); put(c3, 230, g[0], 'w'); put(c3, 180, g[1], 'h');
    put(c4, 270, 'Br', 'p', true); put(c4, 0, g[2], 'w'); put(c4, 50, g[3], 'h');
  }
  s += atom(c3.x, c3.y, 'C', { r: 11 }) + atom(c4.x, c4.y, 'C', { r: 11 });
  return s;
}
const TRANS = ['Et', 'H', 'H', 'Et'], CIS = ['Et', 'H', 'Et', 'H'];
FIGURES.push({
  id: 'hexene-bromination',
  section: 'multistep-synthesis',
  anchor: '<!-- fig:hexene-bromination:start -->',
  alt: 'Two rows, with each alkene drawn edge-on: wedges toward the reader, hashes away, top face up the page. Row 1: (E)-hex-3-ene, ethyl groups on opposite sides, reacts with Br2 to give a bromonium ion with the positive bromine bridging both carbons on the top face; a bromide ion below attacks C4 from underneath while the C4–Br bond breaks. The product has one Br up from C3 and one Br down from C4, and is meso-3,4-dibromohexane, (3R,4S). Row 2: (Z)-hex-3-ene, ethyl groups on the same side, adds Br2 the same anti way to give (3R,4R)-3,4-dibromohexane and its mirror image (3S,4S), formed 50 to 50.',
  viewBox: '0 0 760 462',
  build() {
    let s = '';
    s += rich(20, 24, ['*trans', ' alkene, from Na in NH₃'], 'fg-lbl', 'start');
    const y1 = 118;
    s += persp(100, y1, TRANS, { stage: 'alkene' });
    s += rich(100, 222, ['(', '*E', ')-hex-3-ene']);
    s += arrow(P(186, y1), P(254, y1)) + T(220, y1 - 10, 'Br₂');
    s += persp(340, y1, TRANS, { stage: 'bromonium' });
    s += T(340, 222, 'Br⁻ attacks from below');
    s += arrow(P(430, y1), P(500, y1));
    s += persp(590, y1, TRANS, { stage: 'product' });
    s += rich(590, 204, ['*meso', '-3,4-dibromohexane'], 'fg-lbl');
    s += rich(590, 222, ['(3', '*R', ',4', '*S', '): one compound'], 'fg-tag-good');
    s += rule(20, 244, 740, 244);
    s += rich(20, 270, ['*cis', ' alkene, from H₂ over Lindlar catalyst'], 'fg-lbl', 'start');
    const y2 = 342;
    s += persp(100, y2, CIS, { stage: 'alkene' });
    s += rich(100, 412, ['(', '*Z', ')-hex-3-ene']);
    s += arrow(P(186, y2), P(290, y2)) + T(238, y2 - 10, 'Br₂');
    s += persp(400, y2, CIS, { stage: 'product' });
    s += persp(600, y2, CIS, { stage: 'product', mirror: true });
    s += T(500, y2 + 4, 'and', 'fg-tag-mut');
    s += T(500, 414, '3,4-dibromohexane', 'fg-lbl');
    s += rich(400, 432, ['(3', '*R', ',4', '*R', ')'], 'fg-tag') + rich(600, 432, ['(3', '*S', ',4', '*S', ')'], 'fg-tag');
    s += T(500, 452, 'mirror images formed 50 : 50, a racemic pair', 'fg-tag-good');
    s += T(740, 24, 'Et = CH₂CH₃', 'fg-tag-mut', 'end');
    return s;
  },
  caption: 'Wedges point toward you and hashes away; the top face of each alkene is up the page. Compare where the two ethyl groups start in each row.',
});
FIGURES.push({
  id: 'l-hexene-trans',
  lessons: ['multistep-synthesis'],
  alt: '(E)-hex-3-ene drawn edge-on, wedges toward the reader, reacts with Br2. The bromonium ion has the positive bromine bridging both carbons on the top face, and a bromide ion below attacks C4 from underneath while the C4–Br bond breaks. The product has one Br up from C3 and one Br down from C4: meso-3,4-dibromohexane, (3R,4S).',
  viewBox: '0 0 340 546',
  build() {
    let s = '';
    s += T(10, 18, 'Et = CH₂CH₃', 'fg-tag-mut', 'start');
    s += persp(170, 70, TRANS, { stage: 'alkene' });
    s += rich(290, 74, ['(', '*E', ')-hex-3-ene'], 'fg-tag');
    s += downStep(170, 114, 160, ['Br₂'], null);
    s += persp(170, 250, TRANS, { stage: 'bromonium' });
    s += T(330, 250, 'Br⁻ attacks', 'fg-tag', 'end') + T(330, 266, 'from below', 'fg-tag', 'end');
    s += arrow(P(170, 346), P(170, 394));
    s += persp(170, 444, TRANS, { stage: 'product' });
    s += rich(170, 518, ['*meso', '-3,4-dibromohexane'], 'fg-lbl');
    s += rich(170, 536, ['(3', '*R', ',4', '*S', ')'], 'fg-tag-good');
    return s;
  },
  caption: 'Wedges point toward you, hashes away; the top face is up the page.',
});
FIGURES.push({
  id: 'l-hexene-cis',
  lessons: ['multistep-synthesis'],
  alt: '(Z)-hex-3-ene drawn edge-on, both ethyl groups on wedges, adds Br2 anti to give (3R,4R)-3,4-dibromohexane and its mirror image (3S,4S), formed 50 to 50.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    s += T(10, 18, 'Et = CH₂CH₃', 'fg-tag-mut', 'start');
    s += persp(170, 70, CIS, { stage: 'alkene' });
    s += rich(290, 74, ['(', '*Z', ')-hex-3-ene'], 'fg-tag');
    s += downStep(170, 118, 170, ['Br₂'], null);
    s += persp(86, 222, CIS, { stage: 'product', half: 24, len: 32 });
    s += persp(256, 222, CIS, { stage: 'product', half: 24, len: 32, mirror: true });
    s += T(170, 288, '3,4-dibromohexane', 'fg-lbl');
    s += rich(86, 306, ['(3', '*R', ',4', '*R', ')']) + rich(256, 306, ['(3', '*S', ',4', '*S', ')']);
    s += T(170, 322, 'mirror images, 50 : 50', 'fg-tag-good');
    return s;
  },
  caption: 'Wedges point toward you, hashes away.',
});

export default FIGURES;
