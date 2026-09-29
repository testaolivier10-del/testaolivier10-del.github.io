/* Figures for the diazonium-chemistry notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, arrow, curve, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';
import { ringDouble, locant } from '../lib/ochem-skeletal.mjs';

/* A hexagon kit. `start` is the screen angle of vertex 0 in degrees (-90 puts
   it at the top, 0 at the right) and the numbering runs clockwise, so 1 and 5
   are ortho to vertex 0, 2 and 4 meta, 3 para. */
function hexKit(R, start = -90) {
  const V = (cx, cy) => {
    const v = [];
    for (let i = 0; i < 6; i++) {
      const a = (start + i * 60) * Math.PI / 180;
      v.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
    }
    return v;
  };
  /* A point `d` further out along the line from the ring centre through
     vertex i: where a substituent hangs. */
  const out = (cx, cy, i, d) => {
    const v = V(cx, cy)[i];
    return P(v.x + ((v.x - cx) / R) * d, v.y + ((v.y - cy) / R) * d);
  };
  const ring = (cx, cy, doubles, opts = {}) => {
    const v = V(cx, cy), mid = P(cx, cy);
    let g = '';
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      if (doubles.includes(i)) g += ringDouble(v[i], v[j], mid, { inset: opts.inset ?? 7, gap: opts.gap ?? 4 });
      else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
    }
    return g;
  };
  /* A substituent on vertex i: a bond out to a labelled disc. */
  const sub = (cx, cy, i, txt, o = {}) => {
    const p = out(cx, cy, i, o.d ?? 30);
    const r = o.r ?? 15;
    return bond(V(cx, cy)[i], p, { rFrom: 0, rTo: r, cls: o.bondCls, order: o.order, gap: 3.4 }) +
           atom(p.x, p.y, txt, { kind: o.kind || 'plain', r, size: o.size });
  };
  /* A locant number just inside vertex i. */
  const num = (cx, cy, i, value, o = {}) =>
    locant(V(cx, cy)[i], out(cx, cy, i, 10), value, { d: o.d ?? 12, cls: o.cls || 'fg-tag', size: 11 });
  return { V, out, ring, sub, num };
}

/* A fishhook: one barb, because it carries one electron. */
function fishhook(a, b, opts = {}) {
  const f = (v) => (Math.round(v * 100) / 100);
  const bow = opts.bow ?? 30;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;
  let ux = b.x - cx, uy = b.y - cy;
  const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const size = opts.size ?? 9;
  const px = -uy, py = ux;
  const side = opts.side ?? 1;
  const bx = b.x - ux * size, by = b.y - uy * size;
  const h = size * 0.6 * side;
  return `<path class="fg-arrow" d="M${f(a.x)} ${f(a.y)} Q${f(cx)} ${f(cy)} ${f(bx)} ${f(by)}"></path>` +
         `<path class="fg-head" d="M${f(b.x)} ${f(b.y)} L${f(bx + px * h)} ${f(by + py * h)} L${f(bx)} ${f(by)} Z"></path>`;
}

/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${x}" cy="${y}" r="3.4"></circle>`;

/* A diazonium group on vertex i of a ring: C–N⁺≡N drawn in a straight line,
   because both nitrogens are sp. The charge sits on the inner nitrogen, the
   one with four bonds. Returns the ink and the two nitrogen positions. */
function diazo(K, cx, cy, i, o = {}) {
  const d1 = o.d1 ?? 28, step = o.step ?? 36, r = o.r ?? 13;
  const n1 = K.out(cx, cy, i, d1), n2 = K.out(cx, cy, i, d1 + step);
  let s = bond(K.V(cx, cy)[i], n1, { rFrom: 0, rTo: r });
  s += bond(n1, n2, { rFrom: r, rTo: r, order: 3, gap: 3 });
  s += atom(n1.x, n1.y, 'N', { kind: 'hi', r, size: 11 });
  s += atom(n2.x, n2.y, 'N', { kind: o.kind2 || 'plain', r, size: 11 });
  const cp = o.chargeAt ?? P(n1.x + 13, n1.y - 13);
  s += text(cp.x, cp.y, '+', { cls: 'fg-warn', size: 14 });
  return { s, n1, n2 };
}

const FIGURES = [];

/* ---------------------------------------------------------------------------
   The route to the salt: three reactions the student already has. */
FIGURES.push({
  id: 'diazonium-route',
  section: 'diazonium-chemistry',
  anchor: '<h3>Three steps to the salt</h3>',
  viewBox: '0 0 760 236',
  alt: 'Benzene is nitrated with nitric and sulfuric acid to nitrobenzene, reduced with iron and hydrochloric acid then sodium hydroxide to aniline, and diazotized with sodium nitrite and hydrochloric acid at zero to five degrees to benzenediazonium chloride, whose carbon, nitrogen and nitrogen sit in a straight line with a triple bond between the two nitrogens and the positive charge on the inner one.',
  build() {
    const R = 28, K = hexKit(R);
    const CY = 150, xs = [64, 262, 460, 650];
    let s = '';
    s += K.ring(xs[0], CY, [0, 2, 4]);
    s += K.ring(xs[1], CY, [1, 3, 5]);
    s += K.sub(xs[1], CY, 0, 'NO₂', { r: 17, size: 10.5 });
    s += K.ring(xs[2], CY, [1, 3, 5]);
    s += K.sub(xs[2], CY, 0, 'NH₂', { kind: 'hi', r: 17, size: 10.5 });
    s += K.ring(xs[3], CY, [1, 3, 5]);
    s += diazo(K, xs[3], CY, 0, { d1: 26, step: 38 }).s;
    s += text(xs[3] + 58, 76, 'Cl⁻', { cls: 'fg-lbl', size: 13 });

    const names = ['benzene', 'nitrobenzene', 'aniline', 'benzenediazonium chloride'];
    xs.forEach((x, i) => { s += text(x, 214, names[i], { cls: i === 3 ? 'fg-tag-good' : 'fg-tag', size: 11 }); });

    const steps = [
      ['nitrate', 'HNO₃, H₂SO₄', null],
      ['reduce', 'Fe, HCl;', 'then NaOH'],
      ['diazotize', 'NaNO₂, HCl', '0–5 °C'],
    ];
    steps.forEach(([word, r1, r2], i) => {
      const a = xs[i] + R + 16, b = xs[i + 1] - R - 16;
      const m = (a + b) / 2;
      s += arrow(P(a, CY), P(b, CY));
      s += text(m, r2 ? CY - 26 : CY - 10, r1, { cls: 'fg-tag', size: 11 });
      if (r2) s += text(m, CY - 10, r2, { cls: 'fg-tag', size: 11 });
      s += text(m, CY + 20, word, { cls: 'fg-lbl', size: 13 });
    });
    s += tag(380, 24, 'BENZENE TO A DIAZONIUM SALT IN THREE STEPS');
    return s;
  },
  caption: 'Three reactions, all from earlier chapters. The nitrogen goes onto the ring in the first step and stays on the same carbon to the end.',
});

/* The same route stacked for a phone-width lesson card. */
FIGURES.push({
  id: 'l-diazonium-route',
  lessons: ['diazonium-chemistry'],
  viewBox: '0 0 340 402',
  alt: 'Benzene to nitrobenzene with nitric and sulfuric acid, nitrobenzene to aniline with iron and hydrochloric acid then base, and aniline to benzenediazonium chloride with sodium nitrite and hydrochloric acid at zero to five degrees. The diazonium group is drawn with carbon, nitrogen and nitrogen in a straight line and the positive charge on the inner nitrogen.',
  build() {
    const R = 24, K = hexKit(R);
    let s = '';
    const Y1 = 104, Y2 = 330, xl = 62, xr = 268;
    s += K.ring(xl, Y1, [0, 2, 4]);
    s += K.ring(xr, Y1, [1, 3, 5]);
    s += K.sub(xr, Y1, 0, 'NO₂', { r: 17, size: 10.5, d: 26 });
    s += arrow(P(xl + R + 12, Y1), P(xr - R - 12, Y1));
    s += text(165, Y1 - 10, 'HNO₃, H₂SO₄', { cls: 'fg-tag', size: 11 });
    s += text(165, Y1 + 20, 'nitrate', { cls: 'fg-lbl', size: 13 });
    s += text(xl, Y1 + 50, 'benzene', { cls: 'fg-tag', size: 11 });
    s += text(xr, Y1 + 50, 'nitrobenzene', { cls: 'fg-tag', size: 11 });

    /* Wrap to the second row. */
    s += arrow(P(xr - 20, Y1 + 62), P(xl + 30, Y2 - 88));
    s += text(190, 206, 'reduce: Fe, HCl;', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(190, 222, 'then NaOH', { cls: 'fg-tag', size: 11, anchor: 'start' });

    s += K.ring(xl, Y2, [1, 3, 5]);
    s += K.sub(xl, Y2, 0, 'NH₂', { kind: 'hi', r: 17, size: 10.5, d: 26 });
    s += K.ring(xr, Y2, [1, 3, 5]);
    s += diazo(K, xr, Y2, 0, { d1: 24, step: 34, r: 12 }).s;
    s += text(xr + 44, Y2 - 88, 'Cl⁻', { cls: 'fg-lbl', size: 13 });
    s += arrow(P(xl + R + 12, Y2), P(xr - R - 12, Y2));
    s += text(165, Y2 - 26, 'NaNO₂, HCl', { cls: 'fg-tag', size: 11 });
    s += text(165, Y2 - 10, '0–5 °C', { cls: 'fg-tag', size: 11 });
    s += text(165, Y2 + 20, 'diazotize', { cls: 'fg-lbl', size: 13 });
    s += text(xl, Y2 + 50, 'aniline', { cls: 'fg-tag', size: 11 });
    s += text(xr, Y2 + 50, 'the diazonium salt', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Nitrate, reduce, diazotize. The nitrogen stays on the carbon where nitration put it.',
});

/* ---------------------------------------------------------------------------
   Diazotization, arrow by arrow. The Amines chapter tells it in words. */
FIGURES.push({
  id: 'diazotization-mechanism',
  section: 'diazonium-chemistry',
  anchor: '<h3>Three steps to the salt</h3>',
  viewBox: '0 0 760 340',
  alt: 'Top row: the lone pair on aniline nitrogen attacks the nitrogen of the nitrosonium ion while one pi bond of N triple-bond O moves onto oxygen; loss of a proton gives the N-nitrosoamine, Ar–NH–N=O; a hydrogen then moves from nitrogen to oxygen by two proton transfers, giving Ar–N=N–OH. Bottom row: the OH is protonated; the lone pair on the first nitrogen forms a third bond to the second nitrogen as the N–O bond breaks and water leaves, giving the linear diazonium ion Ar–N⁺≡N.',
  build() {
    let s = '';
    s += tag(380, 22, 'DIAZOTIZATION: THE AMINE NITROGEN BECOMES N₂⁺');
    const Y = 118, r = 13;

    /* Aniline, drawn with the ring on its side so the NH2 points right. */
    const R = 24, K = hexKit(R, 0);
    s += K.ring(58, Y, [1, 3, 5]);
    const N = K.out(58, Y, 0, 30);
    s += bond(K.V(58, Y)[0], N, { rFrom: 0, rTo: 16 });
    s += atom(N.x, N.y, 'NH₂', { kind: 'hi', r: 16, size: 10.5 });
    s += lonePair(N.x, N.y, 270, { dist: 22 });

    /* The nitrosonium ion. The + belongs on O, which has three bonds and one
       lone pair; N has three bonds and one lone pair too, and is neutral. */
    const nN = P(200, 78), nO = P(242, 78);
    s += bond(nN, nO, { rFrom: r, rTo: r, order: 3, gap: 3 });
    s += atom(nN.x, nN.y, 'N', { r, size: 11 });
    s += atom(nO.x, nO.y, 'O', { r, size: 11 });
    s += lonePair(nN.x, nN.y, 180, { dist: 19 });
    s += lonePair(nO.x, nO.y, 0, { dist: 19 });
    s += text(nO.x + 20, nO.y - 12, '+', { cls: 'fg-warn', size: 14 });
    s += curve(P(N.x + 6, N.y - 25), P(nN.x - 12, nN.y - 8), { bow: -22 });
    s += curve(P(221, 72), P(nO.x - 2, nO.y - 14), { bow: -12, size: 7 });
    s += text(221, 132, 'nitrosonium ion', { cls: 'fg-tag', size: 11 });
    s += text(221, 148, '(from NaNO₂ + HCl)', { cls: 'fg-tag', size: 11 });

    s += arrow(P(282, Y), P(344, Y));
    s += text(313, Y - 10, '–H⁺', { cls: 'fg-tag', size: 11 });

    /* A small zigzag chain: Ar–N–N–O. */
    const chain = (x0, y0, labels, o = {}) => {
      const dx = 34, dy = 20;
      const pts = labels.map((_, i) => P(x0 + i * dx, y0 + (i % 2 ? -dy : 0)));
      return pts;
    };
    const drawAtoms = (pts, labels, kinds = []) => labels.map((l, i) =>
      atom(pts[i].x, pts[i].y, l, { kind: kinds[i] || 'plain', r: l === 'Ar' ? 14 : r, size: 11 })).join('');

    /* N-nitrosoamine. */
    {
      const L = ['Ar', 'N', 'N', 'O'];
      const p = chain(372, Y + 8, L);
      s += bond(p[0], p[1], { rFrom: 14, rTo: r });
      s += bond(p[1], p[2], { rFrom: r, rTo: r });
      s += bond(p[2], p[3], { rFrom: r, rTo: r, order: 2, gap: 3 });
      const H = P(p[1].x, p[1].y - 36);
      s += bond(p[1], H, { rFrom: r, rTo: 9 });
      s += text(H.x, H.y + 4, 'H', { cls: 'fg-lbl', size: 13 });
      s += drawAtoms(p, L);
      s += text(p[1].x + 17, 158, 'N-nitrosoamine', { cls: 'fg-tag', size: 11 });
    }

    s += arrow(P(510, Y), P(600, Y));
    s += text(555, Y - 26, 'H moves from', { cls: 'fg-tag', size: 11 });
    s += text(555, Y - 10, 'N to O', { cls: 'fg-tag', size: 11 });
    s += text(555, Y + 20, 'two proton', { cls: 'fg-tag', size: 11 });
    s += text(555, Y + 36, 'transfers', { cls: 'fg-tag', size: 11 });

    /* Ar–N=N–OH. */
    {
      const L = ['Ar', 'N', 'N', 'O'];
      const p = chain(622, Y + 8, L);
      s += bond(p[0], p[1], { rFrom: 14, rTo: r });
      s += bond(p[1], p[2], { rFrom: r, rTo: r, order: 2, gap: 3 });
      s += bond(p[2], p[3], { rFrom: r, rTo: r });
      const H = P(p[3].x, p[3].y + 36);
      s += bond(p[3], H, { rFrom: r, rTo: 9 });
      s += text(H.x, H.y + 4, 'H', { cls: 'fg-lbl', size: 13 });
      s += drawAtoms(p, L);
    }

    s += rule(24, 186, 736, 186);

    /* Row 2: protonate the OH, then water leaves. */
    const Y2 = 262;
    s += arrow(P(28, Y2), P(92, Y2));
    s += text(60, Y2 - 10, '+H⁺', { cls: 'fg-tag', size: 11 });
    {
      const L = ['Ar', 'N', 'N', 'O'];
      const p = chain(126, Y2 + 8, L);
      s += bond(p[0], p[1], { rFrom: 14, rTo: r });
      s += bond(p[1], p[2], { rFrom: r, rTo: r, order: 2, gap: 3 });
      s += bond(p[2], p[3], { rFrom: r, rTo: r });
      const H1 = P(p[3].x + 30, p[3].y - 16), H2 = P(p[3].x + 30, p[3].y + 18);
      s += bond(p[3], H1, { rFrom: r, rTo: 8 });
      s += bond(p[3], H2, { rFrom: r, rTo: 8 });
      s += text(H1.x + 4, H1.y + 4, 'H', { cls: 'fg-lbl', size: 13 });
      s += text(H2.x + 4, H2.y + 4, 'H', { cls: 'fg-lbl', size: 13 });
      s += text(p[3].x + 2, p[3].y + 30, '+', { cls: 'fg-warn', size: 14 });
      s += drawAtoms(p, L, [null, 'hi']);
      /* The lone pair on the first N makes the third N–N bond... */
      s += lonePair(p[1].x, p[1].y, 270, { dist: 19 });
      s += curve(P(p[1].x + 7, p[1].y - 21), P((p[1].x + p[2].x) / 2 + 7, (p[1].y + p[2].y) / 2 - 5), { bow: -14, size: 7 });
      /* ...as the N–O bond breaks and water takes both electrons. */
      s += curve(P((p[2].x + p[3].x) / 2, (p[2].y + p[3].y) / 2 - 4), P(p[3].x - 4, p[3].y - 15), { bow: -14, size: 7 });
      s += text(p[2].x, 322, 'water is the leaving group', { cls: 'fg-tag', size: 11 });
    }

    s += arrow(P(318, Y2), P(392, Y2));
    s += text(355, Y2 - 10, '–H₂O', { cls: 'fg-tag', size: 11 });

    /* Ar–N⁺≡N, straight. */
    {
      const a = P(430, Y2), n1 = P(474, Y2), n2 = P(516, Y2);
      s += bond(a, n1, { rFrom: 14, rTo: r });
      s += bond(n1, n2, { rFrom: r, rTo: r, order: 3, gap: 3 });
      s += atom(a.x, a.y, 'Ar', { r: 14, size: 11 });
      s += atom(n1.x, n1.y, 'N', { kind: 'hi', r, size: 11 });
      s += atom(n2.x, n2.y, 'N', { r, size: 11 });
      s += text(n1.x, n1.y - 18, '+', { cls: 'fg-warn', size: 14 });
      s += lonePair(n2.x, n2.y, 0, { dist: 19 });
      s += text(474, 302, 'aryl diazonium ion', { cls: 'fg-tag-good', size: 11 });
      s += text(474, 318, 'C, N and N in a straight line', { cls: 'fg-tag', size: 11 });
    }
    s += text(690, Y2 - 8, 'Ar = the', { cls: 'fg-tag', size: 11 });
    s += text(690, Y2 + 8, 'benzene ring', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Follow the amine nitrogen: it starts as NH<sub>2</sub>, gains a second nitrogen from NO<sup>+</sup>, and ends as the inner, positively charged nitrogen of Ar&ndash;N<sup>+</sup>&equiv;N.',
});

/* ---------------------------------------------------------------------------
   Which bond breaks, and why the cation left behind is so poor. */
FIGURES.push({
  id: 'aryl-cation',
  section: 'diazonium-chemistry',
  anchor: '<h3>Why N<sub>2</sub><sup>+</sup> is such a good leaving group</h3>',
  lessons: ['diazonium-chemistry'],
  viewBox: '0 0 340 452',
  alt: 'Top: benzenediazonium ion with a curved arrow showing the pair of electrons in the carbon–nitrogen bond moving onto nitrogen. Middle: the products, a phenyl cation and a molecule of nitrogen gas. Bottom: the phenyl cation drawn in perspective, with the p orbitals of the ring standing above and below the ring plane and the empty sp2 orbital of the charged carbon lying in the ring plane, at right angles to them.',
  build() {
    let s = '';
    const R = 24, K = hexKit(R, 0);
    /* Row 1: the C–N bond breaks, and both of its electrons go with N. */
    const Y1 = 62, cx1 = 70;
    s += K.ring(cx1, Y1, [1, 3, 5]);
    const d = diazo(K, cx1, Y1, 0, { d1: 30, step: 38, r: 13, chargeAt: P(cx1 + R + 30, Y1 + 32) });
    s += d.s;
    const c0 = K.V(cx1, Y1)[0];
    s += curve(P((c0.x + d.n1.x) / 2 - 1, Y1 - 3), P(d.n1.x - 6, d.n1.y - 13), { bow: -12, size: 7 });
    s += text(235, Y1 + 5, 'the C–N bond', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(235, Y1 + 21, 'breaks; N takes', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(235, Y1 + 37, 'both electrons', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += arrow(P(cx1, Y1 + 40), P(cx1, Y1 + 84));
    s += text(cx1 + 14, Y1 + 67, 'warm', { cls: 'fg-tag', size: 11, anchor: 'start' });

    /* Row 2: the phenyl cation and N2. */
    const Y2 = 186;
    s += K.ring(cx1, Y2, [1, 3, 5]);
    s += text(cx1 + R + 11, Y2 + 5, '+', { cls: 'fg-warn', size: 16 });
    s += text(cx1, Y2 + 44, 'phenyl cation', { cls: 'fg-tag-warn', size: 11 });
    s += text(150, Y2 + 5, '+', { cls: 'fg-lbl', size: 16 });
    {
      const a = P(196, Y2), b = P(236, Y2);
      s += bond(a, b, { rFrom: 13, rTo: 13, order: 3, gap: 3 });
      s += atom(a.x, a.y, 'N', { r: 13, size: 11 });
      s += atom(b.x, b.y, 'N', { r: 13, size: 11 });
      s += lonePair(a.x, a.y, 180, { dist: 19 });
      s += lonePair(b.x, b.y, 0, { dist: 19 });
      s += text(216, Y2 + 44, 'N₂ gas escapes', { cls: 'fg-tag-good', size: 11 });
    }
    s += rule(16, 256, 324, 256);

    /* Row 3: the orbital picture, ring tilted back. */
    const cx = 104, cy = 362, rx = 66, ry = 30;
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * 60) * Math.PI / 180;
      pts.push(P(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry));
    }
    /* Back p lobes first, then the ring, then the front ones. */
    const lobe = (p, up) => {
      const y = up ? p.y - 14 : p.y + 14;
      return `<ellipse class="fg-orb" cx="${p.x.toFixed(2)}" cy="${y.toFixed(2)}" rx="5.5" ry="13" fill-opacity="0.18"></ellipse>`;
    };
    for (const i of [4, 5, 3, 0, 2, 1]) s += lobe(pts[i], true);
    for (let i = 0; i < 6; i++) s += bond(pts[i], pts[(i + 1) % 6], { rFrom: 0, rTo: 0 });
    for (const i of [4, 5, 3, 0, 2, 1]) s += lobe(pts[i], false);
    /* The empty sp2 orbital on C1: in the plane, pointing straight out. */
    const c = pts[0];
    s += `<ellipse class="fg-orb-node" cx="${(c.x + 30).toFixed(2)}" cy="${c.y.toFixed(2)}" rx="26" ry="9"></ellipse>`;
    s += text(c.x + 30, c.y + 5, '+', { cls: 'fg-warn', size: 15 });
    s += text(170, 284, 'the π cloud: p orbitals above', { cls: 'fg-tag', size: 11 });
    s += text(170, 300, 'and below the ring plane', { cls: 'fg-tag', size: 11 });
    s += text(206, 396, 'empty sp² orbital,', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(206, 412, 'in the ring plane', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(170, 442, 'at 90° to the π cloud: the ring cannot help', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Two things to see: the C&ndash;N bond pair leaves with the nitrogen, and the empty orbital left on carbon points out sideways, in the ring plane, where the ring&rsquo;s &pi; electrons cannot reach it.',
});

/* ---------------------------------------------------------------------------
   The menu as structures: what replaces the N2+, and which of those products
   electrophilic substitution cannot make. */
FIGURES.push({
  id: 'diazonium-hub-map',
  section: 'diazonium-chemistry',
  anchor: '<h3>The substitution menu</h3>',
  viewBox: '0 0 760 420',
  alt: 'Benzenediazonium ion in the center with seven arrows to seven products: chlorobenzene with copper(I) chloride, bromobenzene with copper(I) bromide, iodobenzene with potassium iodide, benzonitrile with copper(I) cyanide, fluorobenzene with HBF4 then heat, phenol with warm aqueous acid, and benzene with hypophosphorous acid. Benzonitrile, fluorobenzene and phenol are marked as products electrophilic substitution cannot make; iodobenzene as one it makes only with an added oxidant; benzene as the product that removes the group.',
  build() {
    let s = '';
    const R = 26, K = hexKit(R);
    const C = P(380, 216);
    s += panel(318, 116, 124, 146, { kind: 'hi' });
    s += K.ring(C.x, C.y, [1, 3, 5]);
    s += diazo(K, C.x, C.y, 0, { d1: 22, step: 34, r: 12 }).s;
    s += text(C.x, 252 + 2, '', { cls: 'fg-tag' });

    const r = 18, k = hexKit(r);
    /* A product: ring, substituent on top, reagent and verdict beside it. */
    const prod = (x, y, subst, name, verdict, vcls) => {
      let g = k.ring(x, y, [1, 3, 5]);
      if (subst === 'CN') {
        const c1 = k.out(x, y, 0, 18), n1 = k.out(x, y, 0, 46);
        g += bond(k.V(x, y)[0], c1, { rFrom: 0, rTo: 10 });
        g += bond(c1, n1, { rFrom: 10, rTo: 11, order: 3, gap: 2.6 });
        g += atom(c1.x, c1.y, 'C', { r: 10, size: 11 });
        g += atom(n1.x, n1.y, 'N', { r: 11, size: 11, kind: 'hi' });
      } else if (subst) {
        g += k.sub(x, y, 0, subst, { r: subst.length > 1 ? 14 : 12, size: 11, d: 20, kind: 'hi' });
      }
      g += text(x, y + r + 20, name, { cls: 'fg-lbl', size: 13 });
      if (verdict) g += text(x, y + r + 36, verdict, { cls: vcls, size: 11 });
      return g;
    };
    const spoke = (to, reagent, rx, ry, anchor = 'middle') => {
      s += arrow(to[0], to[1]);
      s += text(rx, ry, reagent, { cls: 'fg-tag', size: 11, anchor });
    };
    /* Left column: the halogens. */
    s += prod(92, 74, 'Cl', 'chlorobenzene', null);
    s += prod(92, 214, 'Br', 'bromobenzene', null);
    s += prod(92, 350, 'I', 'iodobenzene', 'EAS: only with an oxidant', 'fg-tag');
    spoke([P(312, 150), P(146, 84)], 'CuCl', 228, 104);
    spoke([P(312, 210), P(146, 210)], 'CuBr', 228, 202);
    spoke([P(312, 250), P(146, 340)], 'KI', 206, 282);
    /* Right column. */
    s += prod(668, 74, 'CN', 'benzonitrile', 'EAS cannot', 'fg-tag-good');
    s += prod(668, 214, 'F', 'fluorobenzene', 'EAS cannot', 'fg-tag-good');
    s += prod(668, 350, 'OH', 'phenol', 'EAS cannot', 'fg-tag-good');
    spoke([P(448, 150), P(614, 84)], 'CuCN', 532, 104);
    spoke([P(448, 210), P(614, 210)], 'HBF₄, then heat', 532, 202);
    spoke([P(448, 250), P(614, 340)], 'H₂O, H⁺, warm', 566, 280);
    /* Bottom: the deletion. */
    s += prod(380, 352, null, 'benzene', 'the group is removed', 'fg-tag-warn');
    spoke([P(380, 266), P(380, 316)], 'H₃PO₂', 392, 296, 'start');
    return s;
  },
  caption: 'One salt, seven products. Every product keeps the ring and the carbon; only the group on that carbon changes.',
});

/* ---------------------------------------------------------------------------
   Sandmeyer: copper passes one electron over, then takes it back. */
FIGURES.push({
  id: 'sandmeyer-copper',
  section: 'diazonium-chemistry',
  anchor: '<h3>The substitution menu</h3>',
  viewBox: '0 0 760 292',
  alt: 'Top row: benzenediazonium ion plus copper(I) bromide; copper hands one electron to the diazonium ion, nitrogen gas leaves, and a phenyl radical forms with its unpaired electron on the ring carbon, while the copper becomes copper(II), which picks up bromide to give CuBr2. Bottom row: the phenyl radical and Br–Cu–Br with two single-barbed arrows, one from the radical electron and one from the Br–Cu bond, meeting between carbon and bromine; the products are bromobenzene and copper(I) bromide, ready to start again.',
  build() {
    let s = '';
    const R = 22, K = hexKit(R, 0);
    s += tag(28, 26, '1  COPPER(I) HANDS OVER ONE ELECTRON', { anchor: 'start' });
    const Y1 = 84;
    s += K.ring(52, Y1, [1, 3, 5]);
    s += diazo(K, 52, Y1, 0, { d1: 26, step: 34, r: 12, chargeAt: P(52 + R + 26, Y1 - 18) }).s;
    s += text(186, Y1 + 5, '+', { cls: 'fg-lbl', size: 16 });
    s += text(236, Y1 + 5, 'Cu(I)Br', { cls: 'fg-lbl', size: 13 });
    s += arrow(P(284, Y1), P(360, Y1));
    s += text(322, Y1 - 10, 'e⁻ moves', { cls: 'fg-tag', size: 11 });
    s += text(322, Y1 + 20, 'Cu → ring', { cls: 'fg-tag', size: 11 });
    /* The aryl radical: the odd electron sits in the sp2 orbital on C1. */
    s += K.ring(400, Y1, [1, 3, 5]);
    s += dot(400 + R + 9, Y1);
    s += text(400, Y1 + 42, 'phenyl radical', { cls: 'fg-tag', size: 11 });
    s += text(456, Y1 + 5, '+', { cls: 'fg-lbl', size: 16 });
    s += text(494, Y1 + 5, 'N₂', { cls: 'fg-lbl', size: 13 });
    s += text(494, Y1 + 42, 'gas', { cls: 'fg-tag-good', size: 11 });
    s += text(528, Y1 + 5, '+', { cls: 'fg-lbl', size: 16 });
    s += text(606, Y1 + 5, 'Cu(II)Br₂', { cls: 'fg-lbl', size: 13 });
    s += text(606, Y1 + 42, 'takes Br⁻ from', { cls: 'fg-tag', size: 11 });
    s += text(606, Y1 + 58, 'the solution', { cls: 'fg-tag', size: 11 });

    s += rule(24, 160, 736, 160);
    s += tag(28, 186, '2  THE RADICAL TAKES A BROMINE ATOM FROM COPPER(II)', { anchor: 'start' });
    const Y2 = 240;
    s += K.ring(52, Y2, [1, 3, 5]);
    const c1 = K.V(52, Y2)[0];
    const dt = P(c1.x + 9, Y2);
    s += dot(dt.x, dt.y);
    const br1 = P(c1.x + 66, Y2), cu = P(br1.x + 44, Y2), br2 = P(cu.x + 44, Y2);
    s += bond(br1, cu, { rFrom: 14, rTo: 14 });
    s += bond(cu, br2, { rFrom: 14, rTo: 14 });
    s += atom(br1.x, br1.y, 'Br', { kind: 'hi', r: 14, size: 11 });
    s += atom(cu.x, cu.y, 'Cu', { r: 14, size: 11 });
    s += atom(br2.x, br2.y, 'Br', { r: 14, size: 11 });
    const meet = P((dt.x + br1.x) / 2 + 2, Y2 - 8);
    s += fishhook(P(dt.x + 3, dt.y - 5), P(meet.x - 3, meet.y - 3), { bow: -12, size: 8 });
    s += fishhook(P((br1.x + cu.x) / 2, Y2 - 5), P(meet.x + 5, meet.y - 3), { bow: 14, size: 8, side: -1 });
    s += arrow(P(304, Y2), P(372, Y2));
    s += K.ring(410, Y2, [1, 3, 5]);
    s += K.sub(410, Y2, 0, 'Br', { kind: 'hi', r: 14, size: 11, d: 22 });
    s += text(410, Y2 + 42, 'bromobenzene', { cls: 'fg-tag-good', size: 11 });
    s += text(500, Y2 + 5, '+', { cls: 'fg-lbl', size: 16 });
    s += text(560, Y2 + 5, 'Cu(I)Br', { cls: 'fg-lbl', size: 13 });
    s += text(560, Y2 + 42, 'back to the start', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Follow the copper: Cu(I) in step 1, Cu(II) after it gives up an electron, Cu(I) again once it hands over a bromine atom. A single-barbed arrow moves one electron.',
});

/* ---------------------------------------------------------------------------
   The aryl nitrile route, followed into the Nitriles chapter. */
FIGURES.push({
  id: 'aryl-nitrile-route',
  section: 'diazonium-chemistry',
  anchor: '<h3>The substitution menu</h3>',
  viewBox: '0 0 760 330',
  alt: '4-Methylaniline is diazotized with sodium nitrite and hydrochloric acid at zero to five degrees, and the salt is treated with copper(I) cyanide to give 4-methylbenzonitrile, with the cyano group drawn as a straight C triple-bond N. From the nitrile, hot aqueous acid gives 4-methylbenzoic acid, and lithium aluminum hydride then water gives 4-methylbenzylamine.',
  build() {
    let s = '';
    const R = 24, K = hexKit(R, 0);
    const Y = 92;
    const me = (cx, cy) => K.sub(cx, cy, 3, 'CH₃', { r: 16, size: 10.5, d: 24 });
    /* 4-methylaniline */
    s += K.ring(96, Y, [1, 3, 5]) + me(96, Y);
    s += K.sub(96, Y, 0, 'NH₂', { kind: 'hi', r: 16, size: 10.5, d: 24 });
    s += text(96, Y + 48, '4-methylaniline', { cls: 'fg-tag', size: 11 });
    s += arrow(P(172, Y), P(236, Y));
    s += text(204, Y - 26, 'NaNO₂, HCl', { cls: 'fg-tag', size: 11 });
    s += text(204, Y - 10, '0–5 °C', { cls: 'fg-tag', size: 11 });
    /* the salt */
    s += K.ring(304, Y, [1, 3, 5]) + me(304, Y);
    s += diazo(K, 304, Y, 0, { d1: 24, step: 34, r: 12, chargeAt: P(304 + R + 24, Y - 18) }).s;
    s += arrow(P(410, Y), P(474, Y));
    s += text(442, Y - 10, 'CuCN', { cls: 'fg-tag', size: 11 });
    /* the nitrile */
    const nx = 542;
    s += K.ring(nx, Y, [1, 3, 5]) + me(nx, Y);
    {
      const c1 = K.out(nx, Y, 0, 24), n1 = K.out(nx, Y, 0, 60);
      s += bond(K.V(nx, Y)[0], c1, { rFrom: 0, rTo: 12 });
      s += bond(c1, n1, { rFrom: 12, rTo: 12, order: 3, gap: 3 });
      s += atom(c1.x, c1.y, 'C', { kind: 'hi', r: 12, size: 11 });
      s += atom(n1.x, n1.y, 'N', { kind: 'hi', r: 12, size: 11 });
    }
    s += text(nx + 12, Y + 48, '4-methylbenzonitrile', { cls: 'fg-tag-good', size: 11 });

    /* Two ways on, from the Nitriles chapter. */
    const Y2 = 250;
    s += arrow(P(nx - 30, Y + 64), P(300, Y2 - 34));
    s += text(412, 176, 'H₃O⁺, heat', { cls: 'fg-tag', size: 11, anchor: 'end' });
    s += arrow(P(nx + 24, Y + 64), P(nx + 40, Y2 - 34));
    s += text(nx + 44, 176, 'LiAlH₄; then H₂O', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += K.ring(250, Y2, [1, 3, 5]) + me(250, Y2);
    s += K.sub(250, Y2, 0, 'COOH', { kind: 'hi', r: 20, size: 10.5, d: 28 });
    s += text(250, Y2 + 48, '4-methylbenzoic acid', { cls: 'fg-tag', size: 11 });
    s += K.ring(nx + 40, Y2, [1, 3, 5]) + me(nx + 40, Y2);
    {
      const c1 = K.out(nx + 40, Y2, 0, 26);
      s += bond(K.V(nx + 40, Y2)[0], c1, { rFrom: 0, rTo: 17 });
      s += atom(c1.x, c1.y, 'CH₂', { kind: 'hi', r: 17, size: 10.5 });
      const n1 = P(c1.x + 44, c1.y);
      s += bond(c1, n1, { rFrom: 17, rTo: 17 });
      s += atom(n1.x, n1.y, 'NH₂', { r: 17, size: 10.5 });
    }
    s += text(nx + 52, Y2 + 48, '4-methylbenzylamine', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'The CN carbon is the one CuCN brings in. Once the nitrile is on the ring, the Nitriles chapter takes over.',
});

/* ---------------------------------------------------------------------------
   1,3,5-tribromobenzene: why direct bromination cannot, and the amine can. */
FIGURES.push({
  id: 'tribromo-route',
  section: 'diazonium-chemistry',
  anchor: '<span class="k">Worked example &mdash; 1,3,5-tribromobenzene from benzene</span>',
  viewBox: '0 0 760 440',
  alt: 'Top row, marked as failing: benzene is brominated with Br2 and FeBr3 to bromobenzene, then to 1,4-dibromobenzene, then to 1,2,4-tribromobenzene, because each bromine sends the next one ortho or para. Bottom row, marked as working: aniline with bromine water gives 2,4,6-tribromoaniline, with the three bromines on carbons 2, 4 and 6 and each meta to the other two; diazotization and then hypophosphorous acid replace the NH2 with H, and renumbering the ring gives 1,3,5-tribromobenzene.',
  build() {
    let s = '';
    const R = 24, K = hexKit(R);
    const br = (cx, cy, i) => K.sub(cx, cy, i, 'Br', { r: 13, size: 11, d: 20 });
    const KN = hexKit(30);
    const brN = (cx, cy, i) => KN.sub(cx, cy, i, 'Br', { r: 13, size: 11, d: 18 });
    s += tag(28, 24, 'DIRECT: EACH Br SENDS THE NEXT ONE ORTHO OR PARA', { anchor: 'start', cls: 'fg-tag-warn' });
    const Y1 = 112, xs = [66, 256, 446, 636];
    s += K.ring(xs[0], Y1, [0, 2, 4]);
    s += K.ring(xs[1], Y1, [1, 3, 5]) + br(xs[1], Y1, 0);
    s += K.ring(xs[2], Y1, [1, 3, 5]) + br(xs[2], Y1, 0) + br(xs[2], Y1, 3);
    s += K.ring(xs[3], Y1, [1, 3, 5]) + br(xs[3], Y1, 0) + br(xs[3], Y1, 1) + br(xs[3], Y1, 3);
    [0, 1, 2].forEach((i) => {
      const a = xs[i] + R + 22, b = xs[i + 1] - R - 22;
      s += arrow(P(a, Y1), P(b, Y1));
      s += text((a + b) / 2, Y1 - 10, 'Br₂, FeBr₃', { cls: 'fg-tag', size: 11 });
    });
    s += text(xs[1], Y1 + 72, 'bromobenzene', { cls: 'fg-tag', size: 11 });
    s += text(xs[2], Y1 + 72, '1,4-dibromobenzene', { cls: 'fg-tag', size: 11 });
    s += text(xs[3], Y1 + 72, '1,2,4-tribromobenzene ✗', { cls: 'fg-tag-warn', size: 11 });

    s += rule(24, 206, 736, 206);
    s += tag(28, 232, 'WITH AN AMINE: NH₂ PUTS ALL THREE WHERE THEY NEED TO BE', { anchor: 'start', cls: 'fg-tag-good' });
    const Y2 = 330, ys = [86, 346, 636];
    s += K.ring(ys[0], Y2, [1, 3, 5]);
    s += K.sub(ys[0], Y2, 0, 'NH₂', { kind: 'hi', r: 16, size: 10.5, d: 24 });
    s += text(ys[0], Y2 + 72, 'aniline', { cls: 'fg-tag', size: 11 });
    s += text(ys[0], Y2 + 88, '(nitrate, then reduce)', { cls: 'fg-tag', size: 11 });

    s += KN.ring(ys[1], Y2, [1, 3, 5]);
    s += KN.sub(ys[1], Y2, 0, 'NH₂', { kind: 'hi', r: 16, size: 10.5, d: 22 });
    s += brN(ys[1], Y2, 1) + brN(ys[1], Y2, 3) + brN(ys[1], Y2, 5);
    for (const [i, n] of [[0, '1'], [1, '2'], [3, '4'], [5, '6']]) s += KN.num(ys[1], Y2, i, n, { d: 17 });
    s += text(ys[1], Y2 + 72, '2,4,6-tribromoaniline', { cls: 'fg-tag', size: 11 });
    s += text(ys[1], Y2 + 88, 'every Br is meta to the other two', { cls: 'fg-tag', size: 11 });

    s += KN.ring(ys[2], Y2, [1, 3, 5]);
    s += brN(ys[2], Y2, 1) + brN(ys[2], Y2, 3) + brN(ys[2], Y2, 5);
    for (const [i, n] of [[1, '1'], [3, '3'], [5, '5']]) s += KN.num(ys[2], Y2, i, n, { d: 17 });
    s += text(ys[2], Y2 + 72, '1,3,5-tribromobenzene ✓', { cls: 'fg-tag-good', size: 11 });
    s += text(ys[2], Y2 + 88, 'same carbons, numbered again', { cls: 'fg-tag', size: 11 });

    const a1 = ys[0] + R + 30, b1 = ys[1] - R - 30;
    s += arrow(P(a1, Y2), P(b1, Y2));
    s += text((a1 + b1) / 2, Y2 - 10, 'Br₂, H₂O', { cls: 'fg-tag', size: 11 });
    s += text((a1 + b1) / 2, Y2 + 20, 'no catalyst', { cls: 'fg-tag', size: 11 });
    const a2 = ys[1] + R + 34, b2 = ys[2] - R - 34;
    s += arrow(P(a2, Y2), P(b2, Y2));
    s += text((a2 + b2) / 2, Y2 - 26, '1. NaNO₂, HCl, 0–5 °C', { cls: 'fg-tag', size: 11 });
    s += text((a2 + b2) / 2, Y2 - 10, '2. H₃PO₂', { cls: 'fg-tag', size: 11 });
    s += text((a2 + b2) / 2, Y2 + 20, 'NH₂ becomes H', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Compare the two right-hand products. The top route puts two bromines next to each other; the bottom route keeps every bromine one carbon apart from the next.',
});

/* The bottom row of that figure, stacked for the lesson's last step. */
FIGURES.push({
  id: 'l-tribromo-route',
  lessons: ['diazonium-chemistry'],
  viewBox: '0 0 340 368',
  alt: 'Aniline with bromine water gives 2,4,6-tribromoaniline, with the ring carbons numbered 1 at the NH2 and 2, 4 and 6 at the bromines. Diazotization and then hypophosphorous acid replace the NH2 with H, and the same ring renumbered is 1,3,5-tribromobenzene.',
  build() {
    let s = '';
    const R = 24, K = hexKit(R), KN = hexKit(30);
    const br = (cx, cy, i) => KN.sub(cx, cy, i, 'Br', { r: 13, size: 11, d: 18 });
    const Y1 = 84, Y2 = 272, xl = 64, xr = 250;
    s += K.ring(xl, Y1, [1, 3, 5]);
    s += K.sub(xl, Y1, 0, 'NH₂', { kind: 'hi', r: 16, size: 10.5, d: 22 });
    s += text(xl, Y1 + 50, 'aniline', { cls: 'fg-tag', size: 11 });
    s += arrow(P(xl + R + 14, Y1), P(xr - 30 - 36, Y1));
    s += text(146, Y1 - 10, 'Br₂, H₂O', { cls: 'fg-tag', size: 11 });
    s += KN.ring(xr, Y1, [1, 3, 5]);
    s += KN.sub(xr, Y1, 0, 'NH₂', { kind: 'hi', r: 16, size: 10.5, d: 20 });
    s += br(xr, Y1, 1) + br(xr, Y1, 3) + br(xr, Y1, 5);
    for (const [i, n] of [[0, '1'], [1, '2'], [3, '4'], [5, '6']]) s += KN.num(xr, Y1, i, n, { d: 17 });
    s += text(xr, Y1 + 78, '2,4,6-tribromoaniline', { cls: 'fg-tag', size: 11 });

    s += arrow(P(xr, Y1 + 88), P(xr, Y2 - 72));
    s += text(xr - 14, Y1 + 104, '1. NaNO₂, HCl, 0–5 °C', { cls: 'fg-tag', size: 11, anchor: 'end' });
    s += text(xr - 14, Y1 + 120, '2. H₃PO₂', { cls: 'fg-tag', size: 11, anchor: 'end' });

    s += KN.ring(xr, Y2, [1, 3, 5]);
    s += br(xr, Y2, 1) + br(xr, Y2, 3) + br(xr, Y2, 5);
    for (const [i, n] of [[1, '1'], [3, '3'], [5, '5']]) s += KN.num(xr, Y2, i, n, { d: 17 });
    s += text(xr, Y2 + 78, '1,3,5-tribromobenzene', { cls: 'fg-tag-good', size: 11 });
    s += text(84, Y2 - 8, 'the same three', { cls: 'fg-tag', size: 11 });
    s += text(84, Y2 + 8, 'carbons, renumbered', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'The bromines sit on carbons 2, 4 and 6 of the aniline. With the NH<sub>2</sub> gone, the same carbons are numbered 1, 3 and 5.',
});

/* ---------------------------------------------------------------------------
   A removable director, the smaller example: 3,5-dibromotoluene. */
FIGURES.push({
  id: 'dibromotoluene-route',
  section: 'diazonium-chemistry',
  anchor: '<h3>Removing a group is a synthetic tool</h3>',
  viewBox: '0 0 340 372',
  alt: '4-Methylaniline with bromine water gives 2,6-dibromo-4-methylaniline, with both bromines ortho to the NH2 because the para position already carries the methyl group. Diazotization and then hypophosphorous acid replace the NH2 with H, giving 3,5-dibromotoluene, in which both bromines are meta to the methyl group.',
  build() {
    let s = '';
    const R = 24, K = hexKit(R);
    const br = (cx, cy, i) => K.sub(cx, cy, i, 'Br', { r: 13, size: 11, d: 20 });
    const me = (cx, cy) => K.sub(cx, cy, 3, 'CH₃', { r: 16, size: 10.5, d: 22 });
    const Y1 = 84, Y2 = 272, xl = 64, xr = 250;
    s += K.ring(xl, Y1, [1, 3, 5]) + me(xl, Y1);
    s += K.sub(xl, Y1, 0, 'NH₂', { kind: 'hi', r: 16, size: 10.5, d: 22 });
    s += text(xl, Y1 + 88, '4-methylaniline', { cls: 'fg-tag', size: 11 });
    s += arrow(P(xl + R + 14, Y1), P(xr - R - 34, Y1));
    s += text(146, Y1 - 10, 'Br₂, H₂O', { cls: 'fg-tag', size: 11 });
    s += K.ring(xr, Y1, [1, 3, 5]) + me(xr, Y1);
    s += K.sub(xr, Y1, 0, 'NH₂', { kind: 'hi', r: 16, size: 10.5, d: 22 });
    s += br(xr, Y1, 1) + br(xr, Y1, 5);
    s += text(xr - 10, Y1 + 88, 'Br ortho to NH₂', { cls: 'fg-tag', size: 11 });

    s += arrow(P(xr, Y1 + 100), P(xr, Y2 - 66));
    s += text(xr - 14, Y1 + 118, '1. NaNO₂, HCl, 0–5 °C', { cls: 'fg-tag', size: 11, anchor: 'end' });
    s += text(xr - 14, Y1 + 134, '2. H₃PO₂', { cls: 'fg-tag', size: 11, anchor: 'end' });

    s += K.ring(xr, Y2, [1, 3, 5]) + me(xr, Y2);
    s += br(xr, Y2, 1) + br(xr, Y2, 5);
    s += text(xr, Y2 + 86, '3,5-dibromotoluene', { cls: 'fg-tag-good', size: 11 });
    s += text(96, Y2 - 8, 'both Br meta', { cls: 'fg-tag', size: 11 });
    s += text(96, Y2 + 8, 'to the CH₃', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'The NH<sub>2</sub> decides where both bromines go, then leaves. The methyl alone would have sent them ortho and para to itself.',
});

/* The target of the lesson's last step, drawn so the question is about a
   structure and not a name. */
FIGURES.push({
  id: 'l-dibromotoluene-target',
  lessons: ['diazonium-chemistry'],
  viewBox: '0 0 340 168',
  alt: 'Toluene on the left, an arrow with a question mark, and 3,5-dibromotoluene on the right, with both bromines meta to the methyl group.',
  build() {
    let s = '';
    const R = 24, K = hexKit(R);
    const Y = 84, xl = 70, xr = 250;
    const me = (cx) => K.sub(cx, Y, 0, 'CH₃', { r: 16, size: 10.5, d: 22 });
    s += K.ring(xl, Y, [1, 3, 5]) + me(xl);
    s += text(xl, Y + 50, 'toluene', { cls: 'fg-tag', size: 11 });
    s += arrow(P(xl + R + 20, Y), P(xr - R - 34, Y));
    s += text(146, Y - 10, '?', { cls: 'fg-lbl', size: 13 });
    s += K.ring(xr, Y, [1, 3, 5]) + me(xr);
    s += K.sub(xr, Y, 2, 'Br', { r: 13, size: 11, d: 20 }) + K.sub(xr, Y, 4, 'Br', { r: 13, size: 11, d: 20 });
    s += text(xr, Y + 78, '3,5-dibromotoluene', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'The target: both bromines meta to the methyl group.',
});

/* ---------------------------------------------------------------------------
   A blocker, for contrast: SO3H holds the para position. */
FIGURES.push({
  id: 'sulfonic-blocker',
  section: 'diazonium-chemistry',
  anchor: '<h3>Removing a group is a synthetic tool</h3>',
  viewBox: '0 0 760 250',
  alt: 'Toluene is sulfonated at its para position to 4-methylbenzenesulfonic acid. Nitration then puts the nitro group ortho to the methyl group, because the para position is occupied. Heating with dilute aqueous acid removes the sulfonic acid group, giving 2-nitrotoluene.',
  build() {
    let s = '';
    const R = 24, K = hexKit(R);
    const Y = 124, xs = [72, 272, 472, 672];
    const me = (cx) => K.sub(cx, Y, 0, 'CH₃', { r: 16, size: 10.5, d: 22 });
    const so3h = (cx) => K.sub(cx, Y, 3, 'SO₃H', { kind: 'warn', r: 19, size: 10, d: 24 });
    const no2 = (cx) => K.sub(cx, Y, 1, 'NO₂', { kind: 'hi', r: 16, size: 10.5, d: 20 });
    s += K.ring(xs[0], Y, [1, 3, 5]) + me(xs[0]);
    s += K.ring(xs[1], Y, [1, 3, 5]) + me(xs[1]) + so3h(xs[1]);
    s += K.ring(xs[2], Y, [1, 3, 5]) + me(xs[2]) + so3h(xs[2]) + no2(xs[2]);
    s += K.ring(xs[3], Y, [1, 3, 5]) + me(xs[3]) + no2(xs[3]);
    const lab = [['SO₃, H₂SO₄', 'block para'], ['HNO₃, H₂SO₄', 'nitrate'], ['H₂O, H⁺, heat', 'unblock']];
    lab.forEach(([r1, w], i) => {
      const a = xs[i] + R + 34, b = xs[i + 1] - R - 26;
      s += arrow(P(a, Y), P(b, Y));
      s += text((a + b) / 2, Y - 10, r1, { cls: 'fg-tag', size: 11 });
      s += text((a + b) / 2, Y + 20, w, { cls: 'fg-lbl', size: 13 });
    });
    const names = ['toluene', 'para seat taken', 'NO₂ goes ortho', '2-nitrotoluene'];
    xs.forEach((x, i) => { s += text(x, 232, names[i], { cls: i === 3 ? 'fg-tag-good' : 'fg-tag', size: 11 }); });
    s += tag(380, 22, 'A BLOCKER SITS ON A POSITION; IT DOES NOT STEER');
    return s;
  },
  caption: 'The SO<sub>3</sub>H group holds the para carbon while the nitration happens, then comes off. What is left is the methyl group and the nitro group ortho to it.',
});

/* ---------------------------------------------------------------------------
   Azo coupling: an electrophilic aromatic substitution with Ar–N2+ as the
   electrophile. The arrows start from the para-carbon lone pair of the
   phenoxide resonance form the Phenols section drew. */
function azoMechanism(s0, o) {
  let s = s0;
  const R = 26, K = hexKit(R);
  const { px, py } = o;
  /* Phenoxide, in its resonance form with the charge on the para carbon:
     C=O at the top, ring double bonds at 1–2 and 4–5, lone pair at C4. */
  s += K.ring(px, py, [1, 4]);
  s += K.sub(px, py, 0, 'O', { r: 14, size: 12, d: 24, order: 2 });
  const Op = K.out(px, py, 0, 24);
  s += lonePair(Op.x, Op.y, 210, { dist: 20 });
  s += lonePair(Op.x, Op.y, 330, { dist: 20 });
  const c4 = K.V(px, py)[3];
  s += lonePair(c4.x, c4.y, 90, { dist: 9 });
  s += text(c4.x - 14, c4.y + 14, '−', { cls: 'fg-warn', size: 15 });
  /* Diazonium, lying flat below and to the right. */
  const nT = P(o.nx, o.ny), nI = P(o.nx + 40, o.ny);
  s += bond(nT, nI, { rFrom: 13, rTo: 13, order: 3, gap: 3 });
  s += atom(nT.x, nT.y, 'N', { kind: 'hi', r: 13, size: 11 });
  s += atom(nI.x, nI.y, 'N', { r: 13, size: 11 });
  s += text(nI.x + 2, nI.y - 17, '+', { cls: 'fg-warn', size: 14 });
  const Rb = 20, Kb = hexKit(Rb, 0);
  const bx = nI.x + 13 + 12 + Rb;
  s += Kb.ring(bx, o.ny, [0, 2, 4]);
  s += bond(nI, Kb.V(bx, o.ny)[3], { rFrom: 13, rTo: 0 });
  /* Arrow 1: the C4 lone pair to the terminal N. Arrow 2: one N≡N pi bond
     onto the charged N. */
  s += curve(P(c4.x + 5, c4.y + 14), P(nT.x - 12, nT.y - 6), { bow: 18 });
  s += curve(P(nT.x + 20, nT.y + 5), P(nI.x - 2, nI.y + 15), { bow: 12, size: 7 });
  return s;
}

FIGURES.push({
  id: 'azo-coupling',
  section: 'diazonium-chemistry',
  anchor: '<h3>Azo coupling, and why dyes are colored</h3>',
  viewBox: '0 0 760 432',
  alt: 'Top left: phenoxide drawn in the resonance form with a C=O and the negative charge and lone pair on the para carbon; a curved arrow runs from that lone pair to the terminal nitrogen of benzenediazonium, and a second arrow moves one N≡N pi bond onto the positively charged nitrogen. Top right: the neutral intermediate, a cyclohexadienone whose para carbon is sp3 and carries both a hydrogen and an N=N–phenyl group. Bottom: a base removes that hydrogen and the ring is aromatic again, giving 4-(phenylazo)phenol, drawn as two rings joined by a bent N=N bridge.',
  build() {
    let s = '';
    s += tag(380, 22, 'THE DIAZONIUM ION IS THE ELECTROPHILE');
    s = azoMechanism(s, { px: 96, py: 104, nx: 152, ny: 212 });
    s += text(140, 92, 'phenoxide, with the', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(140, 108, 'charge on the para C', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += arrow(P(318, 118), P(390, 118));
    s += text(354, 108, 'C–N bond', { cls: 'fg-tag', size: 11 });
    s += text(354, 138, 'forms', { cls: 'fg-tag', size: 11 });

    /* Intermediate. */
    const R = 26, K = hexKit(R);
    const ix = 470, iy = 104;
    s += K.ring(ix, iy, [1, 4]);
    s += K.sub(ix, iy, 0, 'O', { r: 14, size: 12, d: 24, order: 2 });
    const c4 = K.V(ix, iy)[3];
    s += atom(c4.x, c4.y, 'C', { kind: 'warn', r: 12, size: 11 });
    const H = P(c4.x - 30, c4.y + 22);
    s += bond(c4, H, { rFrom: 12, rTo: 9 });
    s += text(H.x - 2, H.y + 5, 'H', { cls: 'fg-lbl', size: 13 });
    const n1 = P(c4.x + 30, c4.y + 22), n2 = P(n1.x + 34, n1.y - 20);
    s += bond(c4, n1, { rFrom: 12, rTo: 12 });
    s += bond(n1, n2, { rFrom: 12, rTo: 12, order: 2, gap: 3 });
    s += atom(n1.x, n1.y, 'N', { r: 12, size: 11 });
    s += atom(n2.x, n2.y, 'N', { r: 12, size: 11 });
    const Rb = 20, Kb = hexKit(Rb, 0);
    s += Kb.ring(n2.x + 12 + 16 + Rb, n2.y, [0, 2, 4]);
    s += bond(n2, Kb.V(n2.x + 12 + 16 + Rb, n2.y)[3], { rFrom: 12, rTo: 0 });
    s += text(ix + 46, 70, 'the attacked carbon is sp³,', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(ix + 46, 86, 'and nothing is charged', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(H.x - 4, H.y + 26, 'this H leaves next', { cls: 'fg-tag-warn', size: 11 });

    s += rule(24, 272, 736, 272);
    /* Product. */
    const Y = 348;
    s += arrow(P(40, Y), P(150, Y));
    s += text(95, Y - 26, 'base takes', { cls: 'fg-tag', size: 11 });
    s += text(95, Y - 10, 'the H⁺', { cls: 'fg-tag', size: 11 });
    s += text(95, Y + 20, 'aromatic again', { cls: 'fg-tag', size: 11 });
    const K2 = hexKit(24, 0);
    const ax = 220;
    s += K2.ring(ax, Y, [1, 3, 5]);
    s += K2.sub(ax, Y, 3, 'HO', { kind: 'hi', r: 15, size: 10.5, d: 22 });
    const a1 = K2.V(ax, Y)[0];
    const m1 = P(a1.x + 26, Y - 18), m2 = P(m1.x + 34, Y);
    s += bond(a1, m1, { rFrom: 0, rTo: 12 });
    s += bond(m1, m2, { rFrom: 12, rTo: 12, order: 2, gap: 3 });
    s += atom(m1.x, m1.y, 'N', { r: 12, size: 11 });
    s += atom(m2.x, m2.y, 'N', { r: 12, size: 11 });
    const bx2 = m2.x + 12 + 14 + 24;
    s += K2.ring(bx2, Y + 14, [0, 2, 4]);
    s += bond(m2, K2.V(bx2, Y + 14)[3], { rFrom: 12, rTo: 0 });
    s += text(290, Y + 66, '4-(phenylazo)phenol, orange', { cls: 'fg-tag-good', size: 11 });
    s += text(540, Y - 16, 'two rings joined by N=N:', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(540, Y, 'one long conjugated', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(540, Y + 16, 'π system', { cls: 'fg-tag', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'The steps are those of any electrophilic aromatic substitution: the ring attacks the electrophile, the attacked carbon becomes sp<sup>3</sup>, and losing H<sup>+</sup> restores the ring.',
});

/* The same coupling, stacked for the lesson card. */
FIGURES.push({
  id: 'l-azo-coupling',
  lessons: ['diazonium-chemistry'],
  viewBox: '0 0 340 452',
  alt: 'Phenoxide drawn with the negative charge and lone pair on the para carbon; a curved arrow runs from that lone pair to the terminal nitrogen of benzenediazonium, and a second arrow moves one N≡N pi bond onto the charged nitrogen. After a base removes the hydrogen from the attacked carbon, the product is 4-(phenylazo)phenol, two rings joined by a bent N=N bridge.',
  build() {
    let s = '';
    s = azoMechanism(s, { px: 90, py: 76, nx: 140, ny: 176 });
    s += text(250, 60, 'phenoxide,', { cls: 'fg-tag', size: 11 });
    s += text(250, 76, 'charge on', { cls: 'fg-tag', size: 11 });
    s += text(250, 92, 'the para C', { cls: 'fg-tag', size: 11 });
    s += arrow(P(170, 222), P(170, 290));
    s += text(184, 246, 'C–N bond forms, then', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(184, 262, 'a base takes the H⁺', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(184, 278, 'from that carbon', { cls: 'fg-tag', size: 11, anchor: 'start' });
    const K2 = hexKit(22, 0);
    const Y = 342, ax = 70;
    s += K2.ring(ax, Y, [1, 3, 5]);
    s += K2.sub(ax, Y, 3, 'HO', { kind: 'hi', r: 15, size: 10.5, d: 20 });
    const a1 = K2.V(ax, Y)[0];
    const m1 = P(a1.x + 24, Y - 17), m2 = P(m1.x + 32, Y);
    s += bond(a1, m1, { rFrom: 0, rTo: 12 });
    s += bond(m1, m2, { rFrom: 12, rTo: 12, order: 2, gap: 3 });
    s += atom(m1.x, m1.y, 'N', { r: 12, size: 11 });
    s += atom(m2.x, m2.y, 'N', { r: 12, size: 11 });
    const bx2 = m2.x + 12 + 12 + 22;
    s += K2.ring(bx2, Y + 13, [0, 2, 4]);
    s += bond(m2, K2.V(bx2, Y + 13)[3], { rFrom: 12, rTo: 0 });
    s += text(170, 408, '4-(phenylazo)phenol, orange', { cls: 'fg-tag-good', size: 11 });
    s += text(170, 430, 'one long conjugated π system', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Ordinary electrophilic aromatic substitution, with the diazonium ion as the electrophile and the phenoxide as the ring.',
});

/* ---------------------------------------------------------------------------
   Where coupling goes: para, else ortho, else nowhere. */
FIGURES.push({
  id: 'azo-where',
  section: 'diazonium-chemistry',
  anchor: '<h3>Azo coupling, and why dyes are colored</h3>',
  viewBox: '0 0 760 244',
  alt: 'Three phenols, each with its OH at the top. Phenol couples at the para carbon. 4-Methylphenol, whose para carbon carries a methyl, couples at a carbon ortho to the OH. 2,4,6-Trimethylphenol has both ortho carbons and the para carbon taken and does not couple.',
  build() {
    let s = '';
    const R = 26, K = hexKit(R);
    const Y = 104, xs = [126, 380, 634];
    const oh = (cx) => K.sub(cx, Y, 0, 'OH', { kind: 'hi', r: 15, size: 10.5, d: 22 });
    const me = (cx, i) => K.sub(cx, Y, i, 'CH₃', { r: 16, size: 10.5, d: 22 });
    const azo = (cx, i) => {
      const v = K.V(cx, Y)[i], p = K.out(cx, Y, i, 24);
      return bond(v, p, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' }) +
        text(p.x + (i === 3 ? 0 : -6), p.y + (i === 3 ? 16 : 4), 'N=N–Ar', { cls: 'fg-tag-good', size: 11, anchor: i === 3 ? 'middle' : 'end' });
    };
    s += K.ring(xs[0], Y, [1, 3, 5]) + oh(xs[0]) + azo(xs[0], 3);
    s += K.ring(xs[1], Y, [1, 3, 5]) + oh(xs[1]) + me(xs[1], 3) + azo(xs[1], 5);
    s += K.ring(xs[2], Y, [1, 3, 5]) + oh(xs[2]) + me(xs[2], 1) + me(xs[2], 3) + me(xs[2], 5);
    s += text(xs[0], 206, 'phenol: para', { cls: 'fg-lbl', size: 13 });
    s += text(xs[1], 206, '4-methylphenol: ortho', { cls: 'fg-lbl', size: 13 });
    s += text(xs[2], 206, '2,4,6-trimethylphenol', { cls: 'fg-lbl', size: 13 });
    s += text(xs[2], 224, 'no seat free: no coupling', { cls: 'fg-tag-warn', size: 11 });
    s += text(xs[1], 224, 'para is taken', { cls: 'fg-tag', size: 11 });
    s += text(xs[0], 224, 'the first choice', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'The new N=N bond goes para to the OH when it can, ortho when para is taken, and nowhere when both are.',
});

export default FIGURES;
