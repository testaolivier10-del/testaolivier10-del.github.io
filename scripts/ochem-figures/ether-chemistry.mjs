/* Figures for the ether-chemistry notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Ethers come after skeletal structures, so carbon chains and rings are
   drawn skeletally. Every heteroatom is labeled, and so is any carbon that a
   curved arrow starts or ends on, because an arrow needs a visible target.

   The 340-wide figures (williamson-mechanism, williamson-tbme, cleavage-sn2,
   cleavage-sn1) are stacked in cells and use only fg-lbl and fg-tag text, so
   the same drawing serves the notes page and a lesson step. The others are
   notes-only. */
import { atom, bond, wedge, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { sk, polyPts, polyRing } from '../lib/ochem-skeletal.mjs';
import { lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const r2 = (v) => Math.round(v * 100) / 100;

/* ------------------------------------------------------------ helpers --- */

/* A labeled atom with a disc sized to its label, and a bond that stops at
   the edge of each disc. An empty label is an unlabeled skeletal vertex. */
const rOf = (l) => (l === '' ? 0 : l.length >= 3 ? 19 : l.length === 2 ? 16 : 14);
const A = (p, l, o = {}) => atom(p.x, p.y, l, { r: rOf(l), ...o });
const B = (a, b, la, lb, o = {}) => bond(a, b, { rFrom: rOf(la), rTo: rOf(lb), ...o });
const charge = (x, y, s) => text(x, y, s, { cls: 'fg-warn', size: 15 });
const mid = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2);
const it = (s) => `<tspan font-style="italic">${s}</tspan>`;
/* Text that may carry an italic tspan. The string is trusted markup. */
const rich = (x, y, html, cls = 'fg-tag', anchor = 'middle') =>
  `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" font-size="${cls === 'fg-lbl' ? 12.5 : 11}">${html}</text>`;
/* A dashed line (a partial bond or a hydrogen bond). */
const dash = (a, b, cls = 'fg-dash') =>
  `<line class="${cls}" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"></line>`;
/* A polyline of skeletal bonds through the given vertices. */
const chain = (v, hi) => v.slice(1).map((p, i) => sk(v[i], p, hi)).join('');
/* Several lone pairs on one atom, at the given screen angles. */
const lps = (p, angles, dist = 21) => angles.map((a) => lonePair(p.x, p.y, a, { dist })).join('');

/* The curved arrow for a bond that breaks toward atom b: it starts at the
   middle of the a–b bond and ends on the edge of b's disc, bowed to one
   side (side = 1 or -1) so it clears the bond line. */
function b2a(a, b, rb, side = 1) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L, nx = -uy * side, ny = ux * side;
  const m = mid(a, b);
  const start = P(m.x + nx * 5, m.y + ny * 5);
  // a point on b's disc, 60 degrees round from the bond, on the arrow's side
  const c60 = 0.5, s60 = 0.866;
  const ex = -ux * c60 + nx * s60, ey = -uy * c60 + ny * s60;
  const end = P(b.x + ex * (rb + 3), b.y + ey * (rb + 3));
  return curve(start, end, { bow: 10 * side });
}

/* A cell: a panel with a title at the top. `title` is trusted markup. */
function cell(ox, oy, w, h, title, draw, opts = {}) {
  const Q = (x, y) => P(ox + x, oy + y);
  let s = panel(ox, oy, w, h, opts.kind ? { kind: opts.kind } : {});
  if (title) s += rich(ox + w / 2, oy + 22, title, opts.titleCls || 'fg-tag');
  s += draw(Q);
  return s;
}

/* ===================================================================== 1
   Names. Each ether is drawn once, with its IUPAC name and its common name
   under it, so the two naming systems can be matched to one structure. */
FIGURES.push({
  id: 'ether-names',
  section: 'ether-chemistry',
  anchor: 'so learn to read both.</p>',
  viewBox: '0 0 760 196',
  alt: 'Four ethers drawn skeletally, each with two names. Methoxyethane, also called ethyl methyl ether: a two-carbon chain, then O, then one carbon. Methoxycyclohexane, also called cyclohexyl methyl ether: a six-membered ring bonded to O, which carries a methyl. Ethoxyethane, also called diethyl ether: two-carbon chains on both sides of O. Oxolane, better known as THF or tetrahydrofuran: a five-membered ring of four carbons and one oxygen.',
  build() {
    let s = '';
    const names = [
      ['methoxyethane', 'ethyl methyl ether'],
      ['methoxycyclohexane', 'cyclohexyl methyl ether'],
      ['ethoxyethane', 'diethyl ether'],
      ['oxolane', 'THF (tetrahydrofuran)'],
    ];
    names.forEach(([iupac, common], i) => {
      const ox = 8 + i * 188;
      s += panel(ox, 8, 180, 180);
      s += text(ox + 90, 150, iupac, { cls: 'fg-lbl' });
      s += text(ox + 90, 170, common, { cls: 'fg-tag' });
    });
    // methoxyethane: C–C–O–C
    {
      const c1 = P(44, 96), c2 = P(72, 80), o = P(102, 96), c3 = P(132, 80);
      s += sk(c1, c2) + B(c2, o, '', 'O') + B(o, c3, 'O', '') + A(o, 'O', { kind: 'hi' });
    }
    // methoxycyclohexane: ring, O, CH3
    {
      const pts = polyPts(250, 92, 6, 26, 0);
      const o = P(pts[0].x + 32, 92), c = P(o.x + 28, 76);
      s += polyRing(pts) + B(pts[0], o, '', 'O') + B(o, c, 'O', '') + A(o, 'O', { kind: 'hi' });
    }
    // ethoxyethane
    {
      const o = P(478, 96);
      const l1 = P(450, 80), l2 = P(422, 96), r1 = P(506, 80), r2p = P(534, 96);
      s += sk(l2, l1) + B(l1, o, '', 'O') + B(o, r1, 'O', '') + sk(r1, r2p) + A(o, 'O', { kind: 'hi' });
    }
    // THF: five-membered ring, O at the bottom
    {
      const pts = polyPts(658, 88, 5, 30, -90);
      const o = pts[0];
      s += bond(o, pts[1], { rFrom: 14, rTo: 0 }) + sk(pts[1], pts[2]) + sk(pts[2], pts[3]) + sk(pts[3], pts[4]) +
        bond(pts[4], o, { rFrom: 0, rTo: 14 }) + A(o, 'O', { kind: 'hi' });
    }
    return s;
  },
  caption: 'Bold names are IUPAC names; the names in green are the common ones.',
});

/* ===================================================================== 2
   Hydrogen bonding: the alcohol donates and accepts, the ether can only
   accept. The boiling points and the water solubility are the evidence. */
function ethylO(o, leftUp = true) {
  // An ether oxygen with an ethyl group on each side, drawn bent.
  const l1 = P(o.x - 28, o.y + 16), l2 = P(o.x - 56, o.y);
  const r1 = P(o.x + 28, o.y + 16), r2p = P(o.x + 56, o.y);
  return sk(l2, l1) + B(l1, o, '', 'O') + B(o, r1, 'O', '') + sk(r1, r2p) + A(o, 'O', { kind: 'hi' }) +
    (leftUp ? lps(o, [235, 305]) : '');
}
FIGURES.push({
  id: 'ether-hbond',
  section: 'ether-chemistry',
  anchor: 'dissolve polar and nonpolar compounds alike.</p>',
  viewBox: '0 0 760 262',
  alt: 'Three panels. Left: two molecules of butan-1-ol, boiling point 118 °C; the O–H hydrogen of one points at an oxygen lone pair of the other, joined by a dashed hydrogen bond. Middle: two molecules of diethyl ether, boiling point 35 °C, the same formula, C4H10O; neither has an O–H, so no hydrogen bond joins them. Right: a water molecule donates one of its hydrogens to a lone pair on the oxygen of diethyl ether, shown by a dashed hydrogen bond.',
  build() {
    let s = '';
    // ---- butan-1-ol pair ----
    s += panel(8, 8, 240, 246);
    s += tag(128, 30, 'BUTAN-1-OL · bp 118 °C');
    {
      const z = [P(28, 92), P(54, 76), P(80, 92), P(106, 76)];
      const o = P(134, 92), h = P(158, 112);
      s += chain(z) + B(z[3], o, '', 'O') + B(o, h, 'O', 'H', { cls: 'fg-bond-hi' }) + A(o, 'O', { kind: 'hi' }) + A(h, 'H', { kind: 'warn' });
      s += lps(o, [250, 310]);
      const o2 = P(152, 170), h2 = P(190, 178);
      const z2 = [P(124, 186), P(96, 170), P(68, 186), P(40, 170)];
      s += B(o2, z2[0], 'O', '') + chain(z2) + B(o2, h2, 'O', 'H') + A(o2, 'O', { kind: 'hi' }) + A(h2, 'H');
      s += lps(o2, [262, 80]);
      s += dash(P(157, 126), P(153, 142), 'fg-dash-hi');
    }
    s += tag(128, 232, 'molecules held by O–H···O bonds');
    // ---- diethyl ether pair ----
    s += panel(260, 8, 240, 246);
    s += tag(380, 30, 'DIETHYL ETHER · bp 35 °C');
    s += ethylO(P(380, 86));
    s += ethylO(P(380, 170));
    s += tag(380, 214, 'same formula, C₄H₁₀O');
    s += tag(380, 232, 'no O–H: nothing to donate', { cls: 'fg-tag-warn' });
    // ---- ether and water ----
    s += panel(512, 8, 240, 246);
    s += tag(632, 30, 'DIETHYL ETHER + WATER');
    {
      const o = P(632, 176);
      const l1 = P(604, 192), l2 = P(576, 176), r1 = P(660, 192), r2p = P(688, 176);
      s += sk(l2, l1) + B(l1, o, '', 'O') + B(o, r1, 'O', '') + sk(r1, r2p) + A(o, 'O', { kind: 'hi' });
      s += lps(o, [270, 90]);
      const ow = P(632, 84), h1 = P(632, 124), h2 = P(596, 66);
      s += B(ow, h1, 'O', 'H', { cls: 'fg-bond-hi' }) + B(ow, h2, 'O', 'H') + A(ow, 'O') + A(h1, 'H', { kind: 'warn' }) + A(h2, 'H');
      s += lps(ow, [330, 20]);
      s += dash(P(632, 139), P(632, 150), 'fg-dash-hi');
    }
    s += tag(632, 232, 'the ether accepts a hydrogen bond');
    return s;
  },
  caption: 'Dashed lines are hydrogen bonds. Each one runs from an O–H hydrogen to a lone pair on another oxygen.',
});

/* ===================================================================== 3
   The Williamson synthesis as two arrow-pushing steps. */
FIGURES.push({
  id: 'williamson-mechanism',
  section: 'ether-chemistry',
  lessons: ['ether-chemistry'],
  anchor: 'completes the ether.</p>',
  viewBox: '0 0 340 452',
  alt: 'Two stacked steps. Step 1: hydride from sodium hydride uses its lone pair to take the O–H hydrogen of ethanol, and the O–H bonding pair moves onto oxygen; the products are ethoxide ion, with three lone pairs and a negative charge on oxygen, and hydrogen gas. Step 2: an ethoxide lone pair attacks the CH3 carbon of iodomethane from the side opposite the iodine, and the C–I bonding pair leaves with iodine; the products are methoxyethane and iodide ion.',
  build() {
    let s = '';
    s += cell(8, 8, 324, 214, 'STEP 1 · NaH TAKES THE O–H PROTON', (Q) => {
      let t = '';
      const c1 = Q(22, 96), c2 = Q(50, 80), o = Q(84, 96), h = Q(140, 70);
      t += sk(c1, c2) + B(c2, o, '', 'O') + B(o, h, 'O', 'H', { cls: 'fg-bond-hi' });
      t += A(o, 'O', { kind: 'hi' }) + A(h, 'H', { kind: 'warn' });
      t += lps(o, [110, 170]);
      const hy = Q(246, 70);
      t += A(hy, 'H', { kind: 'hi' }) + charge(hy.x + 12, hy.y - 20, '−');
      t += lonePair(hy.x, hy.y, 180, { dist: 20 });
      t += text(hy.x + 42, hy.y + 5, 'Na⁺', { cls: 'fg-lbl' });
      t += curve(P(hy.x - 24, hy.y - 4), P(h.x + 16, h.y - 6), { bow: 18 });
      t += b2a(h, o, 14, 1);
      t += tag(hy.x, hy.y + 36, 'hydride, H⁻');
      t += arrow(Q(162, 124), Q(162, 146));
      const d1 = Q(22, 176), d2 = Q(50, 160), od = Q(84, 176);
      t += sk(d1, d2) + B(d2, od, '', 'O') + A(od, 'O', { kind: 'hi' });
      t += lps(od, [340, 60, 270]) + charge(od.x + 22, od.y - 20, '−');
      t += text(Q(128, 0).x, od.y + 5, '+  H–H  +  Na⁺', { cls: 'fg-lbl', anchor: 'start' });
      t += tag(Q(44, 0).x, Q(0, 206).y, 'ethoxide ion');
      t += tag(Q(224, 0).x, Q(0, 206).y, 'H₂ gas bubbles off', { cls: 'fg-tag-good' });
      return t;
    });
    s += cell(8, 230, 324, 214, 'STEP 2 · SN2 AT THE CH₃ OF CH₃–I', (Q) => {
      let t = '';
      const c1 = Q(18, 84), c2 = Q(46, 68), o = Q(78, 84);
      t += sk(c1, c2) + B(c2, o, '', 'O') + A(o, 'O', { kind: 'hi' });
      t += lps(o, [90, 280, 10]) + charge(o.x + 18, o.y - 22, '−');
      const c = Q(172, 84), io = Q(252, 84);
      t += B(c, io, 'CH₃', 'I', { cls: 'fg-bond-hi' });
      t += A(c, 'CH₃', { kind: 'hi' }) + A(io, 'I', { kind: 'warn' });
      t += lps(io, [330, 30, 90]);
      t += curve(P(o.x + 25, o.y + 1), P(c.x - 21, c.y + 2), { bow: -16 });
      t += b2a(c, io, 14, -1);
      t += tag(c.x, c.y + 38, 'attacked from the back');
      t += arrow(Q(162, 128), Q(162, 150));
      const e1 = Q(40, 180), e2 = Q(68, 164), oe = Q(100, 180), m = Q(130, 164);
      t += sk(e1, e2) + B(e2, oe, '', 'O') + B(oe, m, 'O', '', { cls: 'fg-bond-hi' }) + A(oe, 'O', { kind: 'hi' });
      t += text(Q(160, 0).x, oe.y + 5, '+  I⁻  +  Na⁺', { cls: 'fg-lbl', anchor: 'start' });
      t += tag(Q(84, 0).x, Q(0, 206).y, 'methoxyethane', { cls: 'fg-tag-good' });
      return t;
    });
    return s;
  },
  caption: 'Step 1 makes the nucleophile. Step 2 forms the new C–O bond, highlighted in the product.',
});

/* ===================================================================== 4
   Which half becomes the alkoxide: tert-butyl methyl ether two ways. */
FIGURES.push({
  id: 'williamson-tbme',
  section: 'ether-chemistry',
  lessons: ['ether-chemistry'],
  anchor: 'Put the crowded group on the alkoxide and the unhindered group on the halide.</div>',
  viewBox: '0 0 340 484',
  alt: 'Two stacked routes to tert-butyl methyl ether. Top, the route that works: tert-butoxide, an oxygen anion on a carbon carrying three methyl groups, attacks the CH3 of iodomethane, and iodide leaves, giving tert-butyl methyl ether by SN2. Bottom, the route that fails: methoxide takes a hydrogen from a methyl group of tert-butyl bromide; that C–H bonding pair becomes a new C=C bond, and bromide leaves. This is E2, and it gives 2-methylpropene, methanol and bromide, not the ether.',
  build() {
    let s = '';
    s += cell(8, 8, 324, 210, `WORKS: ${it('tert')}-BUTOXIDE + CH₃–I`, (Q) => {
      let t = '';
      const c = Q(56, 84), o = Q(92, 84);
      t += sk(c, Q(56, 54)) + sk(c, Q(26, 84)) + sk(c, Q(56, 114));
      t += B(c, o, '', 'O') + A(o, 'O', { kind: 'hi' });
      t += lps(o, [270, 90, 10]) + charge(o.x + 20, o.y - 20, '−');
      const m = Q(176, 84), io = Q(256, 84);
      t += B(m, io, 'CH₃', 'I', { cls: 'fg-bond-hi' }) + A(m, 'CH₃', { kind: 'hi' }) + A(io, 'I', { kind: 'warn' });
      t += lps(io, [330, 30, 90]);
      t += curve(P(o.x + 25, o.y + 1), P(m.x - 21, m.y + 2), { bow: -16 });
      t += b2a(m, io, 14, -1);
      t += arrow(Q(162, 126), Q(162, 146));
      const c2 = Q(92, 170), o2 = Q(128, 170), mm = Q(156, 154);
      t += sk(c2, Q(92, 142)) + sk(c2, Q(62, 170)) + sk(c2, Q(92, 198));
      t += B(c2, o2, '', 'O') + B(o2, mm, 'O', '', { cls: 'fg-bond-hi' }) + A(o2, 'O', { kind: 'hi' });
      t += tag(Q(238, 0).x, Q(0, 166).y, 'clean SN2', { cls: 'fg-tag-good' });
      t += tag(Q(238, 0).x, Q(0, 184).y, 'CH₃ has no β-H', { cls: 'fg-tag-good' });
      return t;
    }, { kind: 'good' });
    s += cell(8, 226, 324, 250, `FAILS: CH₃O⁻ + ${it('tert')}-BUTYL BROMIDE`, (Q) => {
      let t = '';
      const om = Q(52, 76), mo = Q(24, 56);
      t += B(om, mo, 'O', '') + A(om, 'O', { kind: 'hi' });
      t += lps(om, [20, 110, 190]) + charge(om.x + 4, om.y - 24, '−');
      const hb = Q(128, 76), cb = Q(150, 128), ca = Q(212, 128), br = Q(282, 128);
      t += B(hb, cb, 'H', 'CH₂', { cls: 'fg-bond-hi' }) + B(cb, ca, 'CH₂', 'C') + B(ca, br, 'C', 'Br', { cls: 'fg-bond-hi' });
      const mu = Q(212, 78), md = Q(212, 178);
      t += B(ca, mu, 'C', 'CH₃') + B(ca, md, 'C', 'CH₃');
      t += A(hb, 'H', { kind: 'warn' }) + A(cb, 'CH₂') + A(ca, 'C') + A(br, 'Br', { kind: 'warn' });
      t += A(mu, 'CH₃') + A(md, 'CH₃');
      t += lps(br, [300, 30, 90], 22);
      t += curve(P(om.x + 26, om.y + 6), P(hb.x - 16, hb.y + 2), { bow: -14 });
      t += curve(P(mid(hb, cb).x + 6, mid(hb, cb).y - 2), P(mid(cb, ca).x, mid(cb, ca).y - 6), { bow: -22 });
      t += b2a(ca, br, 16, -1);
      t += tag(Q(162, 0).x, Q(0, 222).y, 'E2: 2-methylpropene + CH₃OH + Br⁻', { cls: 'fg-tag-warn' });
      t += tag(Q(162, 0).x, Q(0, 240).y, 'no ether forms', { cls: 'fg-tag-warn' });
      return t;
    }, { kind: 'warn' });
    return s;
  },
  caption: 'Both routes aim at the same ether. Only the top one gives the alkoxide a carbon it can reach.',
});

/* ===================================================================== 5
   The worked example: ethoxycyclohexane, two plans. */
FIGURES.push({
  id: 'williamson-cyclohexyl',
  section: 'ether-chemistry',
  anchor: 'only one order works.</p>',
  viewBox: '0 0 760 250',
  alt: 'Two routes to ethoxycyclohexane. Route A: sodium cyclohexoxide, a cyclohexane ring carrying O minus, plus bromoethane, a primary halide, gives ethoxycyclohexane by SN2. Route B: sodium ethoxide plus bromocyclohexane, a secondary halide on the ring, gives mostly cyclohexene by E2.',
  build() {
    let s = '';
    const ring = (cx, cy) => {
      const pts = polyPts(cx, cy, 6, 24, 0);
      return { ink: polyRing(pts), att: pts[0] };
    };
    // Route A
    s += panel(8, 8, 744, 112, { kind: 'good' });
    s += tag(24, 30, 'ROUTE A · the ring is the alkoxide', { anchor: 'start', cls: 'fg-tag-good' });
    {
      const r = ring(70, 72), o = P(r.att.x + 32, 72);
      s += r.ink + B(r.att, o, '', 'O') + A(o, 'O', { kind: 'hi' }) + charge(o.x + 16, o.y - 14, '−');
      s += text(170, 77, '+', { cls: 'fg-lbl' });
      const b1 = P(196, 80), b2 = P(222, 64), br = P(256, 80);
      s += sk(b1, b2) + B(b2, br, '', 'Br') + A(br, 'Br', { kind: 'warn' });
      s += tag(226, 108, 'primary halide');
      s += arrow(P(300, 72), P(380, 72));
      s += tag(340, 62, 'SN2');
      const r2x = ring(430, 72), o2 = P(r2x.att.x + 32, 72), e1 = P(o2.x + 28, 56), e2 = P(o2.x + 56, 72);
      s += r2x.ink + B(r2x.att, o2, '', 'O') + B(o2, e1, 'O', '') + sk(e1, e2) + A(o2, 'O', { kind: 'hi' });
      s += text(560, 72, 'ethoxycyclohexane', { cls: 'fg-lbl', anchor: 'start' });
      s += tag(560, 92, 'the target ✓', { anchor: 'start', cls: 'fg-tag-good' });
    }
    // Route B
    s += panel(8, 130, 744, 112, { kind: 'warn' });
    s += tag(24, 152, 'ROUTE B · the ring carries the halide', { anchor: 'start', cls: 'fg-tag-warn' });
    {
      const e1 = P(36, 202), e2 = P(62, 186), o = P(94, 202);
      s += sk(e1, e2) + B(e2, o, '', 'O') + A(o, 'O', { kind: 'hi' }) + charge(o.x + 16, o.y - 14, '−');
      s += text(134, 207, '+', { cls: 'fg-lbl' });
      const r = ring(182, 196), br = P(r.att.x + 34, 196);
      s += r.ink + B(r.att, br, '', 'Br') + A(br, 'Br', { kind: 'warn' });
      s += tag(200, 234, 'secondary halide');
      s += arrow(P(300, 196), P(380, 196));
      s += tag(340, 186, 'E2 wins');
      const pts = polyPts(430, 196, 6, 24, 0);
      s += polyRing(pts);
      const c = P(430, 196);
      const a = pts[0], b = pts[1];
      const ux = (b.x - a.x), uy = (b.y - a.y), L = Math.hypot(ux, uy);
      const px = -uy / L, py = ux / L;
      const sgn = ((c.x - (a.x + b.x) / 2) * px + (c.y - (a.y + b.y) / 2) * py) > 0 ? 1 : -1;
      s += sk(P(a.x + ux * 0.18 + px * 4.6 * sgn, a.y + uy * 0.18 + py * 4.6 * sgn), P(b.x - ux * 0.18 + px * 4.6 * sgn, b.y - uy * 0.18 + py * 4.6 * sgn));
      s += text(560, 196, 'mostly cyclohexene', { cls: 'fg-lbl', anchor: 'start' });
      s += tag(560, 216, 'little ether ✗', { anchor: 'start', cls: 'fg-tag-warn' });
    }
    return s;
  },
  caption: 'The two routes join the same two pieces. What differs is which carbon the alkoxide has to attack.',
});

/* ===================================================================== 6
   Alkoxymercuration: the bridge, the backside opening at the more
   substituted carbon, and the product after NaBH4. */
FIGURES.push({
  id: 'alkoxymercuration',
  section: 'ether-chemistry',
  anchor: 'so the overall reaction is not stereospecific.</p>',
  viewBox: '0 0 760 300',
  alt: 'Three stages for 2-methylpropene with mercuric acetate in methanol, then sodium borohydride. First, the mercurinium ion: mercury, carrying an acetate, bridges C1 and C2 from the top face, with a short bond to C1 and a long dashed bond to C2, which carries a partial positive charge. Methanol, below the plane, uses an oxygen lone pair to attack C2 from the bottom face. Second, after loss of a proton, the HgOAc group sits on C1 on the top face and the OCH3 group sits on C2 on the bottom face: an anti addition. Third, sodium borohydride replaces the mercury with hydrogen, giving tert-butyl methyl ether.',
  build() {
    let s = '';
    // ---- stage 1 ----
    s += panel(8, 8, 300, 284);
    s += tag(158, 30, 'THE MERCURINIUM ION');
    const c1 = P(92, 160), c2 = P(170, 160), hg = P(131, 98), ac = P(76, 72);
    s += B(c1, c2, 'CH₂', 'C');
    s += B(hg, c1, 'Hg', 'CH₂', { cls: 'fg-bond-hi' });
    s += dash(P(hg.x + 11, hg.y + 12), P(c2.x - 9, c2.y - 11), 'fg-dash-hi');
    s += B(hg, ac, 'Hg', 'OAc');
    const m1 = P(222, 132), m2 = P(222, 188);
    s += B(c2, m1, 'C', 'CH₃') + B(c2, m2, 'C', 'CH₃');
    s += A(c1, 'CH₂') + A(c2, 'C') + A(hg, 'Hg', { kind: 'hi' }) + A(ac, 'OAc') + A(m1, 'CH₃') + A(m2, 'CH₃');
    s += charge(hg.x + 22, hg.y - 6, '+');
    s += text(c2.x + 2, c2.y + 30, 'δ+', { cls: 'fg-tag-warn' });
    const om = P(150, 238), mh = P(104, 254), hh = P(196, 254);
    s += B(om, mh, 'O', 'CH₃') + B(om, hh, 'O', 'H') + A(om, 'O', { kind: 'hi' }) + A(mh, 'CH₃') + A(hh, 'H');
    s += lonePair(om.x, om.y, 300, { dist: 21 }) + lonePair(om.x, om.y, 230, { dist: 21 });
    s += curve(P(om.x + 13, om.y - 22), P(c2.x - 6, c2.y + 14), { bow: -10 });
    s += text(166, 76, 'top face', { cls: 'fg-sm', anchor: 'start' });
    s += text(40, 282, 'CH₃OH attacks C2 from the bottom face', { cls: 'fg-sm', anchor: 'start' });
    s += text(c1.x, c1.y + 30, 'C1', { cls: 'fg-sm' });
    s += text(c2.x - 26, c2.y + 30, 'C2', { cls: 'fg-sm' });
    // arrow 1
    s += arrow(P(314, 150), P(352, 150));
    s += text(333, 140, '−H⁺', { cls: 'fg-sm' });
    // ---- stage 2 ----
    s += panel(358, 8, 204, 284);
    s += tag(460, 30, 'ANTI ADDITION');
    const d1 = P(420, 150), d2 = P(494, 150);
    const hgo = P(420, 92), od = P(494, 208), mo = P(538, 236);
    s += B(d1, d2, 'CH₂', 'C') + B(d1, hgo, 'CH₂', 'HgOAc') + B(d2, od, 'C', 'O', { cls: 'fg-bond-hi' }) + B(od, mo, 'O', 'CH₃');
    const u1 = P(538, 124), u2 = P(494, 94);
    s += B(d2, u1, 'C', 'CH₃') + B(d2, u2, 'C', 'CH₃');
    s += A(d1, 'CH₂') + A(d2, 'C') + atom(hgo.x, hgo.y, 'HgOAc', { r: 26 }) + A(od, 'O', { kind: 'hi' }) + A(mo, 'CH₃') + A(u1, 'CH₃') + A(u2, 'CH₃');
    s += text(460, 262, 'HgOAc on top, OCH₃ below', { cls: 'fg-sm' });
    // arrow 2
    s += arrow(P(568, 150), P(606, 150));
    s += text(587, 140, 'NaBH₄', { cls: 'fg-sm' });
    // ---- stage 3 ----
    s += panel(612, 8, 140, 284, { kind: 'good' });
    s += tag(682, 30, 'THE ETHER', { cls: 'fg-tag-good' });
    const cc = P(668, 150), oo = P(704, 150), me = P(732, 134);
    s += sk(cc, P(668, 120)) + sk(cc, P(640, 150)) + sk(cc, P(668, 180)) + B(cc, oo, '', 'O') + B(oo, me, 'O', '') + A(oo, 'O', { kind: 'hi' });
    s += rich(682, 224, `${it('tert')}-butyl`, 'fg-lbl');
    s += text(682, 242, 'methyl ether', { cls: 'fg-lbl' });
    s += text(682, 270, 'Hg replaced by H', { cls: 'fg-sm' });
    return s;
  },
  caption: 'The mercury blocks the top face, so methanol can only come in from below. The δ+ marks the carbon that holds more of the positive charge.',
});

/* ===================================================================== 7
   Cleavage, primary and methyl: protonate, then SN2 at the methyl. */
FIGURES.push({
  id: 'cleavage-sn2',
  section: 'ether-chemistry',
  lessons: ['ether-chemistry'],
  anchor: 'which is the methyl carbon.</p>',
  viewBox: '0 0 340 470',
  alt: 'Methyl propyl ether cleaved by HI in two stacked steps. Step 1: a lone pair on the ether oxygen takes the proton of H–I, and the H–I bonding pair leaves with iodine as iodide. The oxygen now carries the H and a positive charge. Step 2: iodide attacks the CH3 carbon from the side opposite the oxygen, and the C–O bonding pair moves onto oxygen. The products are iodomethane and propan-1-ol; the propyl carbons keep every bond they had.',
  build() {
    let s = '';
    s += cell(8, 8, 324, 224, '1 · HI PROTONATES THE OXYGEN', (Q) => {
      let t = '';
      const me = Q(34, 104), o = Q(96, 104);
      const p1 = Q(124, 120), p2 = Q(152, 104), p3 = Q(180, 120);
      t += B(me, o, 'H₃C', 'O') + B(o, p1, 'O', '') + chain([p1, p2, p3]);
      t += A(me, 'H₃C') + A(o, 'O', { kind: 'hi' });
      t += lps(o, [240, 300]);
      const h = Q(170, 52), io = Q(250, 52);
      t += B(h, io, 'H', 'I', { cls: 'fg-bond-hi' }) + A(h, 'H', { kind: 'warn' }) + A(io, 'I', { kind: 'warn' });
      t += lps(io, [330, 30, 90]);
      t += curve(P(o.x + 12, o.y - 24), P(h.x - 15, h.y + 5), { bow: -14 });
      t += b2a(h, io, 14, -1);
      t += arrow(Q(162, 138), Q(162, 158));
      const me2 = Q(34, 190), o2 = Q(96, 190), hh = Q(96, 154);
      const q1 = Q(124, 206), q2 = Q(152, 190), q3 = Q(180, 206);
      t += B(me2, o2, 'H₃C', 'O') + B(o2, q1, 'O', '') + chain([q1, q2, q3]) + B(o2, hh, 'O', 'H');
      t += A(me2, 'H₃C') + A(o2, 'O', { kind: 'hi' }) + A(hh, 'H', { kind: 'warn' });
      t += lonePair(o2.x, o2.y, 115, { dist: 21 }) + charge(o2.x + 20, o2.y - 16, '+');
      t += text(Q(214, 0).x, o2.y + 5, '+  I⁻', { cls: 'fg-lbl', anchor: 'start' });
      return t;
    });
    s += cell(8, 240, 324, 222, '2 · I⁻ ATTACKS THE CH₃ FROM THE BACK', (Q) => {
      let t = '';
      const io = Q(30, 92), me = Q(104, 92), o = Q(176, 92), hh = Q(176, 54);
      const p1 = Q(204, 108), p2 = Q(232, 92), p3 = Q(260, 108);
      t += B(me, o, 'H₃C', 'O', { cls: 'fg-bond-hi' }) + B(o, p1, 'O', '') + chain([p1, p2, p3]) + B(o, hh, 'O', 'H');
      t += A(io, 'I', { kind: 'hi' }) + A(me, 'H₃C', { kind: 'hi' }) + A(o, 'O', { kind: 'hi' }) + A(hh, 'H', { kind: 'warn' });
      t += lps(io, [0, 90, 180, 270]) + charge(io.x + 20, io.y - 20, '−');
      t += lonePair(o.x, o.y, 115, { dist: 21 }) + charge(o.x + 20, o.y - 16, '+');
      t += curve(P(io.x + 25, io.y - 3), P(me.x - 21, me.y - 3), { bow: -12 });
      t += b2a(me, o, 14, -1);
      t += arrow(Q(162, 138), Q(162, 160));
      t += text(Q(162, 0).x, Q(0, 186).y, 'CH₃–I  +  HO–CH₂CH₂CH₃', { cls: 'fg-lbl' });
      t += tag(Q(162, 0).x, Q(0, 208).y, 'iodomethane + propan-1-ol', { cls: 'fg-tag-good' });
      return t;
    });
    return s;
  },
  caption: 'Step 1 makes the leaving group. In step 2 the highlighted C–O bond breaks as the new C–I bond forms.',
});

/* ===================================================================== 8
   Cleavage with a tertiary carbon: the C–O bond breaks first, SN1. */
FIGURES.push({
  id: 'cleavage-sn1',
  section: 'ether-chemistry',
  lessons: ['ether-chemistry'],
  anchor: 'Being easy to reach has nothing to do with it.</p>',
  viewBox: '0 0 340 510',
  alt: 'tert-Butyl methyl ether cleaved by HI, after the oxygen has been protonated, in two stacked steps. Step 1: the bond between the tertiary carbon and oxygen breaks on its own, with the bonding pair moving onto oxygen; this gives a flat tertiary carbocation, with three methyl groups at 120 degrees, and methanol. Step 2: iodide uses a lone pair to bond to the cation, giving 2-iodo-2-methylpropane. Iodide ends up on the more crowded carbon.',
  build() {
    let s = '';
    s += cell(8, 8, 324, 290, '1 · THE C–O BOND BREAKS ON ITS OWN', (Q) => {
      let t = '';
      t += tag(Q(162, 0).x, Q(0, 42).y, '(the oxygen is already protonated)');
      const c = Q(82, 114), o = Q(156, 114), hh = Q(156, 76), me = Q(222, 114);
      const mu = Q(82, 70), ml = Q(30, 114), md = Q(82, 158);
      t += B(c, mu, 'C', 'CH₃') + B(c, ml, 'C', 'CH₃') + B(c, md, 'C', 'CH₃');
      t += B(c, o, 'C', 'O', { cls: 'fg-bond-hi' }) + B(o, hh, 'O', 'H') + B(o, me, 'O', 'CH₃');
      t += A(c, 'C') + A(mu, 'CH₃') + A(ml, 'CH₃') + A(md, 'CH₃');
      t += A(o, 'O', { kind: 'hi' }) + A(hh, 'H', { kind: 'warn' }) + A(me, 'CH₃');
      t += lonePair(o.x, o.y, 90, { dist: 21 }) + charge(o.x + 20, o.y - 18, '+');
      t += b2a(c, o, 14, -1);
      t += arrow(Q(162, 184), Q(162, 206));
      const cp = Q(82, 244), a1 = Q(82, 202), a2 = Q(46, 265), a3 = Q(118, 265);
      t += B(cp, a1, 'C', 'CH₃') + B(cp, a2, 'C', 'CH₃') + B(cp, a3, 'C', 'CH₃');
      t += A(cp, 'C', { kind: 'warn' }) + A(a1, 'CH₃') + A(a2, 'CH₃') + A(a3, 'CH₃');
      t += charge(cp.x + 20, cp.y - 12, '+');
      t += text(Q(170, 0).x, cp.y + 5, '+  CH₃OH', { cls: 'fg-lbl', anchor: 'start' });
      t += tag(Q(234, 0).x, cp.y + 26, 'methanol');
      return t;
    });
    s += cell(8, 306, 324, 196, '2 · I⁻ CAPTURES THE CATION', (Q) => {
      let t = '';
      const io = Q(36, 86), cp = Q(124, 86), a1 = Q(124, 46), a2 = Q(89, 106), a3 = Q(159, 106);
      t += B(cp, a1, 'C', 'CH₃') + B(cp, a2, 'C', 'CH₃') + B(cp, a3, 'C', 'CH₃');
      t += A(io, 'I', { kind: 'hi' }) + A(cp, 'C', { kind: 'warn' }) + A(a1, 'CH₃') + A(a2, 'CH₃') + A(a3, 'CH₃');
      t += lps(io, [0, 90, 180, 270]) + charge(io.x + 20, io.y - 20, '−');
      t += charge(cp.x + 20, cp.y - 12, '+');
      t += curve(P(io.x + 25, io.y - 3), P(cp.x - 16, cp.y - 5), { bow: -14 });
      t += arrow(Q(196, 86), Q(226, 86));
      t += text(Q(236, 0).x, Q(0, 91).y, '(CH₃)₃C–I', { cls: 'fg-lbl', anchor: 'start' });
      t += tag(Q(162, 0).x, Q(0, 152).y, '2-iodo-2-methylpropane + methanol', { cls: 'fg-tag-good' });
      t += tag(Q(162, 0).x, Q(0, 174).y, 'iodide ends on the MORE crowded carbon');
      return t;
    });
    return s;
  },
  caption: 'Nothing attacks the tertiary carbon while it still holds the oxygen. The bond breaks first, and iodide arrives afterward.',
});

/* ===================================================================== 9
   The worked example: the stereocenter's C–O bond is never touched. */
FIGURES.push({
  id: 'cleavage-stereocenter',
  section: 'ether-chemistry',
  anchor: 'the alcohol is (<i>R</i>)-butan-2-ol.</p>',
  viewBox: '0 0 760 220',
  alt: '(R)-2-methoxybutane, drawn as a zigzag with the OCH3 group on a wedge at C2, reacts with one mole of HI. The bond from oxygen to the CH3 group is highlighted as the bond that breaks; the bond from C2 to oxygen is marked as untouched. The products are (R)-butan-2-ol, with its OH on a wedge in the same position, and iodomethane.',
  build() {
    let s = '';
    const skel = (x0) => {
      const c1 = P(x0, 150), c2 = P(x0 + 32, 132), c3 = P(x0 + 64, 150), c4 = P(x0 + 96, 132);
      return { ink: chain([c1, c2, c3, c4]), c2 };
    };
    s += panel(8, 8, 300, 204);
    s += rich(158, 30, `(${it('R')})-2-methoxybutane`, 'fg-tag');
    {
      const k = skel(60), o = P(k.c2.x, 84), me = P(o.x + 58, 64);
      s += k.ink + wedge(k.c2, o, { rFrom: 0, rTo: 14, width: 9 });
      s += B(o, me, 'O', 'CH₃', { cls: 'fg-bond-hi' }) + A(o, 'O', { kind: 'hi' }) + A(me, 'CH₃', { kind: 'hi' });
      s += text(k.c2.x, k.c2.y + 30, 'C2', { cls: 'fg-sm' });
      s += text(128, 104, 'this bond breaks', { cls: 'fg-tag-warn', anchor: 'start' });
      s += text(82, 104, 'C2–O bond:', { cls: 'fg-tag-good', anchor: 'end' }) + text(82, 120, 'untouched', { cls: 'fg-tag-good', anchor: 'end' });
      s += text(158, 196, 'one CH₃ and one secondary carbon on O', { cls: 'fg-sm' });
    }
    s += arrow(P(318, 110), P(420, 110));
    s += text(369, 98, 'HI (one mole)', { cls: 'fg-tag' });
    s += text(369, 130, 'SN2 at the CH₃', { cls: 'fg-sm' });
    s += panel(430, 8, 322, 204, { kind: 'good' });
    s += rich(591, 30, `(${it('R')})-butan-2-ol  +  CH₃–I`, 'fg-tag-good');
    {
      const k = skel(470), o = P(k.c2.x, 84);
      s += k.ink + wedge(k.c2, o, { rFrom: 0, rTo: 16, width: 9 }) + A(o, 'OH', { kind: 'hi' });
      s += text(k.c2.x, k.c2.y + 30, 'C2', { cls: 'fg-sm' });
      s += text(620, 116, '+   CH₃–I', { cls: 'fg-lbl', anchor: 'start' });
      s += text(591, 196, 'same arrangement at C2, so still R', { cls: 'fg-sm' });
    }
    return s;
  },
  caption: 'Iodide takes the methyl carbon, so the oxygen stays on C2 and C2 keeps its configuration.',
});

/* ===================================================================== 10
   Peroxides: why the alpha C–H is weak, and the chain that follows. */
FIGURES.push({
  id: 'ether-peroxide',
  section: 'ether-chemistry',
  anchor: 'which carries the chain on.</p>',
  viewBox: '0 0 760 300',
  alt: 'Left: the radical left when an alpha hydrogen is removed from diethyl ether. The alpha carbon holds a p orbital with one electron, drawn as two lobes above and below it. The oxygen next to it holds a lone pair in a p orbital parallel to it. The two orbitals overlap side by side, which spreads the unpaired electron over carbon and oxygen. Right: the two repeating steps of the chain. The alpha radical adds O2 to give a peroxyl radical, C–O–O dot. The peroxyl radical takes an alpha hydrogen from another ether molecule, giving a hydroperoxide, C–O–O–H, and a new alpha radical, which goes back to the first step.',
  build() {
    let s = '';
    s += panel(8, 8, 360, 284);
    s += tag(188, 30, 'WHY THE α C–H IS WEAK');
    const c = P(146, 150), o = P(236, 150);
    // p orbitals, drawn first so the atoms sit on top
    s += lobeE(c.x, c.y - 38, 13, 26) + lobeE(c.x, c.y + 38, 13, 26, 'fg-orb-alt');
    s += lobeE(o.x, o.y - 38, 13, 26) + lobeE(o.x, o.y + 38, 13, 26, 'fg-orb-alt');
    s += `<circle class="fg-lp" cx="${c.x}" cy="${c.y - 42}" r="3"></circle>`;
    s += `<circle class="fg-lp" cx="${o.x - 4}" cy="${o.y - 42}" r="3"></circle><circle class="fg-lp" cx="${o.x + 4}" cy="${o.y - 42}" r="3"></circle>`;
    const me = P(80, 132), h = P(96, 196), e1 = P(280, 172), e2 = P(312, 150);
    s += B(c, me, 'C', 'CH₃') + B(c, h, 'C', 'H') + B(c, o, 'C', 'O') + B(o, e1, 'O', '') + sk(e1, e2);
    s += A(c, 'C', { kind: 'warn' }) + A(me, 'CH₃') + A(h, 'H') + A(o, 'O', { kind: 'hi' });
    s += text(c.x, 84, 'one electron', { cls: 'fg-tag-warn' });
    s += text(o.x + 10, 84, 'O lone pair', { cls: 'fg-tag' });
    s += text(188, 244, 'the orbitals overlap side by side,', { cls: 'fg-sm' });
    s += text(188, 262, 'so the odd electron spreads over C and O', { cls: 'fg-sm' });
    s += text(188, 282, 'α carbon = the carbon bonded to O', { cls: 'fg-tag' });

    s += panel(380, 8, 372, 284);
    s += tag(566, 30, 'THE CHAIN THAT MAKES PEROXIDES');
    s += text(400, 56, 'R–H = the ether; R· = its α radical', { cls: 'fg-sm', anchor: 'start' });
    s += tag(400, 108, 'STEP 1', { anchor: 'start' });
    s += text(460, 108, 'R·  +  O₂  →  R–O–O·', { cls: 'fg-lbl', anchor: 'start' });
    s += text(460, 128, 'O₂ bonds to the carbon radical', { cls: 'fg-sm', anchor: 'start' });
    s += tag(400, 178, 'STEP 2', { anchor: 'start' });
    s += text(460, 178, 'R–O–O·  +  H–R  →  R–O–O–H  +  R·', { cls: 'fg-lbl', anchor: 'start' });
    s += text(460, 198, 'takes an α H from another ether', { cls: 'fg-sm', anchor: 'start' });
    s += text(460, 216, 'molecule: a hydroperoxide forms', { cls: 'fg-sm', anchor: 'start' });
    // the new R· loops back to the start of step 1
    s += '<path class="fg-arrow" fill="none" d="M726 166 C 746 160, 744 80, 712 80 L 478 80"></path>';
    s += '<path class="fg-head" d="M468 80 L478 75.8 L478 84.2 Z"></path>';
    s += text(566, 256, 'the new R· starts step 1 again,', { cls: 'fg-tag-warn' });
    s += text(566, 274, 'so peroxide builds up while air is present', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Left: the orbital picture behind the weak α C–H bond. Right: the two steps that repeat once the first radical has formed.',
});

/* ===================================================================== 11
   BF3 etherate: the ether oxygen as a Lewis base. */
FIGURES.push({
  id: 'bf3-etherate',
  section: 'ether-chemistry',
  anchor: 'yet it hands the BF₃ over to a stronger donor when one is present.</p>',
  viewBox: '0 0 340 270',
  alt: 'Top: diethyl ether uses one oxygen lone pair to bond to the boron of BF3, which has an empty p orbital and only six electrons. Bottom: the product, BF3 etherate, in which the oxygen carries a positive formal charge and the boron a negative one.',
  build() {
    let s = '';
    s += panel(8, 8, 324, 254);
    s += text(170, 30, 'Lewis base  +  Lewis acid', { cls: 'fg-tag' });
    const o = P(96, 116);
    s += sk(P(40, 116), P(68, 132)) + B(P(68, 132), o, '', 'O') + B(o, P(124, 132), 'O', '') + sk(P(124, 132), P(152, 116));
    s += A(o, 'O', { kind: 'hi' }) + lps(o, [235, 305]);
    const b = P(262, 96);
    const f1 = P(b.x + 22, b.y - 38), f2 = P(b.x - 44, b.y), f3 = P(b.x + 22, b.y + 38);
    s += B(b, f1, 'B', 'F') + B(b, f2, 'B', 'F') + B(b, f3, 'B', 'F');
    s += A(b, 'B', { kind: 'warn' }) + A(f1, 'F') + A(f2, 'F') + A(f3, 'F');
    s += curve(P(o.x + 14, o.y - 24), P(b.x - 10, b.y - 14), { bow: -34 });
    s += text(262, 156, 'empty p orbital', { cls: 'fg-tag-warn' });
    s += arrow(P(170, 162), P(170, 182));
    const o2 = P(130, 214), b2 = P(196, 214);
    s += sk(P(74, 214), P(102, 198)) + B(P(102, 198), o2, '', 'O');
    s += B(o2, P(112, 242), 'O', '') + sk(P(112, 242), P(84, 256));
    s += B(o2, b2, 'O', 'B', { cls: 'fg-bond-hi' });
    const g1 = P(232, 190), g2 = P(238, 226), g3 = P(196, 254);
    s += B(b2, g1, 'B', 'F') + B(b2, g2, 'B', 'F');
    s += A(o2, 'O', { kind: 'hi' }) + A(b2, 'B', { kind: 'warn' }) + A(g1, 'F') + A(g2, 'F');
    s += B(b2, P(180, 176), 'B', 'F') + A(P(180, 176), 'F');
    s += charge(o2.x + 16, o2.y + 24, '+') + charge(b2.x + 4, b2.y + 28, '−');
    s += lonePair(o2.x, o2.y, 270, { dist: 21 });
    s += text(294, 252, 'BF₃·OEt₂', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'The new O–B bond, highlighted, is made from an oxygen lone pair.',
});

/* ===================================================================== 12
   The crown ether, drawn. The right-hand panel draws the three diameters
   to scale, because the selectivity argument is a comparison of sizes. */
FIGURES.push({
  id: 'crown-ether-cavity',
  section: 'ether-chemistry',
  anchor: 'a crown ether is one such additive.</p>',
  alt: 'Left: 18-crown-6 drawn as an eighteen-membered ring of six oxygens separated by pairs of CH2 groups, with one lone pair from each oxygen pointing inward at a potassium ion in the middle of the cavity. Right, top: the three diameters drawn to scale: the cavity at about 2.7 angstroms, potassium at 2.66, which fills it, and sodium at 1.9, which is too small to touch all six oxygens. Right, bottom: potassium fluoride dissolving in benzene as a crowned cation and a naked, unsolvated fluoride.',
  viewBox: '0 0 760 430',
  build() {
    let s = '';

    // ---------------- the macrocycle ----------------
    s += panel(8, 16, 368, 398);
    s += tag(192, 42, '18-CROWN-6, WITH K⁺ IN THE MIDDLE');

    const CX = 192, CY = 216, RO = 92, RC = 108;
    const at = (deg, r) => P(CX + Math.cos((deg * Math.PI) / 180) * r, CY + Math.sin((deg * Math.PI) / 180) * r);
    const os = [];
    for (let i = 0; i < 6; i++) os.push({ deg: -90 + i * 60, p: at(-90 + i * 60, RO) });
    let ring = '';
    for (let i = 0; i < 6; i++) {
      const a = os[i], b = os[(i + 1) % 6];
      const ca = at(a.deg + 20, RC), cb = at(a.deg + 40, RC);
      ring += bond(a.p, ca, { rFrom: 14, rTo: 0 });
      ring += bond(ca, cb, { rFrom: 0, rTo: 0 });
      ring += bond(cb, b.p, { rFrom: 0, rTo: 14 });
    }
    s += ring;
    for (const o of os) {
      s += lonePair(o.p.x, o.p.y, o.deg + 180, { dist: 22 }) + lonePair(o.p.x, o.p.y, o.deg, { dist: 22, muted: true });
      s += atom(o.p.x, o.p.y, 'O', { r: 14, kind: 'hi' });
    }
    s += atom(CX, CY, 'K', { r: 22, kind: 'warn', size: 13 });
    s += text(CX + 26, CY - 16, '+', { cls: 'fg-warn', size: 15 });
    s += text(192, 352, 'each corner between two O atoms is a CH₂', { cls: 'fg-sm' });
    s += text(192, 370, 'one lone pair on each O points at K⁺', { cls: 'fg-sm' });
    s += text(192, 396, '18 ring atoms, 6 of them oxygen', { cls: 'fg-tag' });

    // ---------------- the sizes, drawn to scale ----------------
    s += panel(392, 16, 360, 220);
    s += tag(572, 42, 'WHY IT PICKS K⁺ AND NOT Na⁺');
    const SCALE = 26;   // pixels per angstrom of DIAMETER
    const circleAt = (x, y, dia, label, kind) => {
      const r = (dia * SCALE) / 2;
      let g = kind === 'cavity'
        ? `<circle class="fg-dash" cx="${x}" cy="${y}" r="${r}" fill="none"></circle>`
        : `<circle class="${kind === 'k' ? 'fg-fill-warn' : 'fg-fill-hi'}" cx="${x}" cy="${y}" r="${r}" opacity="0.5"></circle>`;
      g += text(x, y + 4, label, { cls: 'fg-lbl', size: 11 });
      return g;
    };
    s += circleAt(470, 128, 2.7, '', 'cavity');
    s += text(470, 132, 'cavity', { cls: 'fg-sm', size: 9.5 });
    s += text(470, 186, 'about 2.7 Å', { cls: 'fg-sm', size: 9.5 });
    s += circleAt(572, 128, 2.66, 'K⁺', 'k');
    s += text(572, 186, '2.66 Å: fits', { cls: 'fg-tag-good', size: 10 });
    s += circleAt(672, 128, 1.9, 'Na⁺', 'na');
    s += text(672, 186, '1.9 Å: too small', { cls: 'fg-tag-warn', size: 10 });
    s += text(572, 212, 'Diameters, drawn to the same scale.', { cls: 'fg-sm', size: 9.5 });

    // ---------------- what it is for ----------------
    s += panel(392, 252, 360, 162);
    s += tag(572, 278, 'WHAT THAT MAKES POSSIBLE');
    s += text(572, 306, 'KF does not dissolve in benzene.', { cls: 'fg-lbl', size: 11.5 });
    s += text(572, 330, 'With 18-crown-6 around the K⁺,', { cls: 'fg-sm', size: 10 });
    s += text(572, 348, 'the whole ion pair dissolves, and the F⁻', { cls: 'fg-sm', size: 10 });
    s += text(572, 366, 'is neither solvated nor held by K⁺.', { cls: 'fg-sm', size: 10 });
    s += text(572, 392, 'a NAKED anion: a far better nucleophile', { cls: 'fg-tag-good', size: 10.5 });
    return s;
  },
  caption: 'Left: the ring holds K⁺ the way a shell of solvent molecules would. Top right: compare the three circles by size.',
});

/* ===================================================================== 13
   The epoxide's strain, in one comparison of angles. */
FIGURES.push({
  id: 'epoxide-angle',
  section: 'ether-chemistry',
  anchor: 'the next section, is devoted to it.</p>',
  viewBox: '0 0 340 190',
  alt: 'Left: diethyl ether, an open-chain ether, with a C–O–C angle of about 110 degrees. Right: oxirane, the simplest epoxide, a three-membered ring of two CH2 carbons and one oxygen, whose ring angles are about 60 degrees, far from the preferred angle, so the ring is strained.',
  build() {
    let s = '';
    s += panel(8, 8, 158, 174);
    s += tag(87, 30, 'DIETHYL ETHER');
    const o = P(87, 86);
    s += sk(P(31, 86), P(59, 102)) + B(P(59, 102), o, '', 'O') + B(o, P(115, 102), 'O', '') + sk(P(115, 102), P(143, 86));
    s += A(o, 'O', { kind: 'hi' });
    s += tag(87, 144, 'C–O–C about 110°');
    s += tag(87, 164, 'no strain', { cls: 'fg-tag-good' });
    s += panel(174, 8, 158, 174, { kind: 'warn' });
    s += tag(253, 30, 'OXIRANE (AN EPOXIDE)');
    const oo = P(253, 64), ca = P(226, 110), cb = P(280, 110);
    s += B(oo, ca, 'O', '') + B(oo, cb, 'O', '') + sk(ca, cb) + A(oo, 'O', { kind: 'hi' });
    s += tag(253, 144, 'ring angles about 60°');
    s += tag(253, 164, 'strained', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Both are ethers. Only the three-membered ring forces its angles far below the usual value.',
});

export default FIGURES;
