/* Figures for the michael-robinson notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   One numbering runs through every Robinson figure on this page: the six
   atoms of the NEW ring are 1 to 6, in the order they end up around it.
     1  the donor's carbonyl carbon (the one the aldol attacks later)
     2  the donor's alpha carbon (it makes the Michael bond)
     3  the acceptor's beta carbon (the CH2 end of methyl vinyl ketone)
     4  the acceptor's alpha carbon
     5  the acceptor's carbonyl carbon
     6  the acceptor's methyl carbon (the alpha-prime carbon)
   So the Michael bond is 2-3, the aldol bond is 6-1, the new C=C is 1=6,
   and the two carbonyls of the Michael product sit at 1 and 5: the 1,5 in
   "1,5-dicarbonyl" is these same numbers. These are not IUPAC locants.

   Every panel is 320 wide, so the notes figures lay panels side by side and
   the lesson copies stack the same panels, drawn by the same functions. The
   lesson copies use only fg-lbl and fg-tag text. */
import { atom, bond, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { sk, ringDouble, polyPts } from '../lib/ochem-skeletal.mjs';
import { skDouble } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const PW = 320;

/* ------------------------------------------------------------ helpers --- */
/* An atom with a label (or a bare skeletal vertex when lbl is empty). The
   radius follows the label: fg-lbl is 13px, about 8px a character. */
const A = (x, y, lbl = '', kind = 'plain', r) => ({
  x, y, lbl, kind,
  r: r ?? (lbl ? Math.max(14, Math.ceil(lbl.replace(/[₀-₉⁺⁻]/g, '').length * 4.2 + (lbl.match(/[₀-₉⁺⁻]/g) || []).length * 2.6 + 6)) : 0),
});
const draw = (...as) => as.map((a) => (a.lbl ? atom(a.x, a.y, a.lbl, { kind: a.kind, r: a.r }) : '')).join('');
const bd = (a, b, o = {}) => bond(a, b, { rFrom: a.r, rTo: b.r, ...o });
const mid = (a, b, t = 0.5) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const toward = (a, b, d) => { const L = Math.hypot(b.x - a.x, b.y - a.y) || 1; return P(a.x + (b.x - a.x) / L * d, a.y + (b.y - a.y) / L * d); };
const num = (x, y, s, cls = 'fg-tag-good') => text(x, y + 4, s, { cls, size: 11 });
const dashLine = (a, b, cls = 'fg-dash-hi', ra = 0, rb = 0) => {
  const p = toward(a, b, ra), q = toward(b, a, rb);
  return `<line class="${cls}" x1="${p.x.toFixed(2)}" y1="${p.y.toFixed(2)}" x2="${q.x.toFixed(2)}" y2="${q.y.toFixed(2)}"></line>`;
};
/* A number placed a distance d from vertex p, pushed toward `c` (usually a
   ring centre, so the number sits inside the ring). */
const numIn = (p, c, s, d = 15, cls) => { const q = toward(p, c, d); return num(q.x, q.y, s, cls); };
/* A panel with its title along the top. */
const frame = (ox, oy, h, title, kind) => panel(ox, oy, PW, h, kind ? { kind } : {}) + tag(ox + PW / 2, oy + 20, title);
const down = (x, y1, y2) => arrow(P(x, y1), P(x, y2), { size: 7 });
const right = (y, x1, x2) => arrow(P(x1, y), P(x2, y), { size: 7 });
/* A retrosynthesis arrow: two lines and an open chevron, read "comes from". */
const retro = (x, y, w = 18) =>
  `<line class="fg-bond" x1="${x}" y1="${y - 3}" x2="${x + w - 4}" y2="${y - 3}"></line>` +
  `<line class="fg-bond" x1="${x}" y1="${y + 3}" x2="${x + w - 4}" y2="${y + 3}"></line>` +
  `<path class="fg-bond" fill="none" d="M${x + w - 9} ${y - 8} L${x + w} ${y} L${x + w - 9} ${y + 8}"></path>`;

/* ============================================ the Michael mechanism ===== */
const MH = 232;

/* 1 · ethoxide takes a proton from the middle carbon of pentane-2,4-dione. */
function mDeprot(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  let s = frame(ox, oy, MH, '1 · ethoxide takes an H from the middle');
  const C3 = A(ox + 170, oy + 118, 'CH', 'hi'), H = A(ox + 170, oy + 166, 'H', 'warn', 12);
  const c2 = o(130, 95), c4 = o(210, 95), c1 = o(92, 118), c5 = o(248, 118);
  const O2 = A(ox + 130, oy + 52, 'O'), O4 = A(ox + 210, oy + 52, 'O');
  const B = A(ox + 70, oy + 176, 'EtO⁻', 'plain', 20);
  s += sk(c1, c2) + bond(c2, C3, { rFrom: 0, rTo: C3.r }) + bond(C3, c4, { rFrom: C3.r, rTo: 0 }) + sk(c4, c5);
  s += bond(c2, O2, { order: 2, rFrom: 0, rTo: O2.r }) + bond(c4, O4, { order: 2, rFrom: 0, rTo: O4.r });
  s += bd(C3, H, { cls: 'fg-bond-hi' });
  s += lonePair(B.x, B.y, 0, { dist: 25 });
  s += draw(C3, H, O2, O4, B);
  s += curve(o(98, 172), o(155, 170), { bow: -14 });
  s += curve(o(176, 146), o(186, 128), { bow: 9 });
  s += tag(ox + PW / 2, oy + 218, 'that H sits between two C=O groups');
  return s;
}

/* 2 · the anion adds to the beta carbon of methyl vinyl ketone. */
function mAdd(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  let s = frame(ox, oy, MH, '2 · the anion adds to the β carbon', 'hi');
  const D = A(ox + 76, oy + 124, 'C⁻', 'hi'), DH = A(ox + 76, oy + 78, 'H', 'plain', 12);
  const Ac1 = A(ox + 34, oy + 94, 'CH₃CO', 'plain', 23), Ac2 = A(ox + 34, oy + 170, 'CH₃CO', 'plain', 23);
  const Cb = A(ox + 146, oy + 124, 'CH₂', 'warn'), Ca = A(ox + 194, oy + 150, 'CH');
  const Cc = A(ox + 242, oy + 124, 'C'), Ox = A(ox + 242, oy + 76, 'O'), Me = A(ox + 288, oy + 150, 'CH₃');
  s += bd(D, DH) + bd(D, Ac1) + bd(D, Ac2);
  s += bd(Cb, Ca, { order: 2 }) + bd(Ca, Cc) + bd(Cc, Ox, { order: 2 }) + bd(Cc, Me);
  s += lonePair(D.x, D.y, 0, { dist: 23 });
  s += draw(D, DH, Ac1, Ac2, Cb, Ca, Cc, Ox, Me);
  s += curve(o(102, 120), o(128, 120), { bow: -9 });
  s += curve(mid(Cb, Ca), mid(Ca, Cc), { bow: -18 });
  s += curve(mid(Cc, Ox), o(262, 64), { bow: 10 });
  s += tag(ox + 146, oy + 96, 'β');
  s += tag(ox + 194, oy + 184, 'α');
  s += tag(ox + PW / 2, oy + 218, 'the π electrons move up onto O');
  return s;
}

/* 3 · the enolate that forms takes a proton on carbon. */
function mProt(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  let s = frame(ox, oy, MH, '3 · the enolate picks up a proton');
  const R = A(ox + 40, oy + 150, 'R');
  const Cb = A(ox + 92, oy + 124, 'CH₂'), Ca = A(ox + 144, oy + 150, 'CH', 'hi');
  const Cc = A(ox + 196, oy + 124, 'C'), Om = A(ox + 196, oy + 74, 'O⁻', 'warn'), Me = A(ox + 248, oy + 150, 'CH₃');
  const H = A(ox + 144, oy + 190, 'H', 'warn', 12), OEt = A(ox + 212, oy + 190, 'OEt');
  s += bd(R, Cb) + bd(Cb, Ca) + bd(Ca, Cc, { order: 2 }) + bd(Cc, Om) + bd(Cc, Me) + bd(H, OEt);
  s += draw(R, Cb, Ca, Cc, Om, Me, H, OEt);
  s += curve(mid(Ca, Cc), o(154, 178), { bow: 14 });
  s += curve(mid(H, OEt), o(196, 176), { bow: -10 });
  s += tag(ox + 270, oy + 64, 'R = the donor,', { anchor: 'middle' });
  s += tag(ox + 270, oy + 80, '(CH₃CO)₂CH');
  s += tag(ox + PW / 2, oy + 222, 'ethanol puts H on the α carbon');
  return s;
}

/* 4 · the product, pentane-2,4-dione joined to MVK: a 1,5-dicarbonyl. */
function mProduct(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  let s = frame(ox, oy, MH, '4 · the product: a 1,5-dicarbonyl', 'good');
  const c2 = o(120, 116), c1 = o(84, 94), m1 = o(48, 116), c3 = o(156, 94), c4 = o(192, 116), c5 = o(228, 94), c6 = o(264, 116);
  const ca = o(120, 158), ma = o(154, 180);
  const O1 = A(ox + 84, oy + 52, 'O'), O5 = A(ox + 228, oy + 52, 'O'), Oa = A(ox + 86, oy + 180, 'O');
  s += sk(m1, c1) + sk(c1, c2) + sk(c2, c3, true) + sk(c3, c4) + sk(c4, c5) + sk(c5, c6) + sk(c2, ca) + sk(ca, ma);
  s += bond(c1, O1, { order: 2, rFrom: 0, rTo: O1.r }) + bond(c5, O5, { order: 2, rFrom: 0, rTo: O5.r }) + bond(ca, Oa, { order: 2, rFrom: 0, rTo: Oa.r });
  s += draw(O1, O5, Oa);
  s += num(84, 0, '') ;
  s += num(ox + 84, oy + 114, '1') + num(ox + 136, oy + 138, '2') + num(ox + 156, oy + 76, '3') + num(ox + 192, oy + 136, '4') + num(ox + 228, oy + 114, '5');
  s += tag(ox + 250, oy + 160, 'new bond: 2–3', { cls: 'fg-tag-good' });
  s += tag(ox + PW / 2, oy + 218, 'C=O at 1 and 5, three carbons between');
  return s;
}

FIGURES.push({
  id: 'michael-mechanism',
  section: 'michael-robinson',
  anchor: '<h3>The Michael reaction</h3>',
  viewBox: '0 0 688 512',
  alt: 'Four panels. 1: ethoxide removes a proton from the middle CH2 of pentane-2,4-dione, the carbon between the two C=O groups. 2: the resulting carbanion adds to the CH2 end (the beta carbon) of methyl vinyl ketone; the C=C pi electrons shift toward the carbonyl and the C=O pi electrons move onto oxygen. 3: the enolate that forms takes a proton from ethanol on its alpha carbon. 4: the product, 3-acetylheptane-2,6-dione, with the carbons numbered 1 to 5 from one C=O carbon to the other; the new bond is between carbons 2 and 3.',
  build() {
    let s = mDeprot(12, 6) + mAdd(356, 6) + mProt(12, 262) + mProduct(356, 262);
    s += right(122, 334, 354);
    s += right(378, 334, 354);
    return s;
  },
  caption: 'Pentane-2,4-dione and methyl vinyl ketone with ethoxide. Follow the arrows in panel 2: one makes the new C–C bond at the β carbon, and the next two pass the electrons along to the oxygen.',
});

FIGURES.push({
  id: 'l-michael-steps',
  lessons: ['michael-robinson'],
  viewBox: '0 0 340 488',
  alt: 'Two stacked panels. Top: the anion of pentane-2,4-dione adds to the CH2 end (the beta carbon) of methyl vinyl ketone; the C=C pi electrons shift toward the carbonyl and the C=O pi electrons move onto oxygen. Bottom: the product after protonation, 3-acetylheptane-2,6-dione, with carbons 1 to 5 numbered from one C=O carbon to the other; the new bond is 2–3.',
  build() {
    return mAdd(10, 6) + down(170, 240, 254) + mProduct(10, 256);
  },
  caption: 'Top: the new bond forms at the β carbon. Bottom: count from one C=O carbon to the other.',
});

/* ===================================== the spacing of three products === */
/* Each row draws one product in skeletal form, numbers the carbons from one
   oxygen-bearing carbon to the other, and names the reaction. */
function spacingRows(ox, oy) {
  let s = '';
  const dx = 26, dy = 15;
  const row = (y, name, verts, ups, extra, nums, t1, t2) => {
    /* verts: x offsets along a zigzag; ups: which vertices are raised. */
    const pts = verts.map((i) => P(ox + 22 + i * dx, oy + y + (ups.includes(i) ? -dy : 0)));
    s += tag(ox + 12, oy + y - 58, name, { anchor: 'start', cls: 'fg-tag' });
    s += extra(pts);
    for (const [i, lbl] of nums) {
      const p = pts[i];
      const up = ups.includes(verts[i]);
      s += num(p.x, up ? p.y + 18 : p.y + 16, lbl);
    }
    s += text(ox + 272, oy + y - 18, t1, { cls: 'fg-lbl', size: 13 });
    s += text(ox + 272, oy + y + 2, t2, { cls: 'fg-tag-good', size: 11 });
  };
  const O = (p) => { const a = A(p.x, p.y - 40, 'O'); return bond(p, a, { order: 2, rFrom: 0, rTo: a.r }) + draw(a); };
  const chain = (pts, hi = []) => pts.slice(1).map((p, i) => sk(pts[i], p, hi.includes(i))).join('');

  /* Aldol: 3-hydroxybutanal, O=CH-CH2-CH(OH)-CH3. */
  row(84, 'aldol product', [0, 1, 2, 3], [0, 2], (p) => {
    const OH = A(p[2].x, p[2].y - 40, 'OH', 'hi');
    return chain(p) + O(p[0]) + bond(p[2], OH, { rFrom: 0, rTo: OH.r }) + draw(OH);
  }, [[0, '1'], [1, '2'], [2, '3']], 'aldol', 'C=O and OH at 1,3');

  /* Claisen: ethyl 3-oxobutanoate, CH3-CO-CH2-CO-O-CH2CH3. */
  row(196, 'Claisen product', [0, 1, 2, 3, 4, 5, 6], [1, 3, 5], (p) => {
    const Oe = A(p[4].x, p[4].y, 'O');
    return sk(p[0], p[1]) + sk(p[1], p[2]) + sk(p[2], p[3]) + bond(p[3], Oe, { rFrom: 0, rTo: Oe.r }) + bond(Oe, p[5], { rFrom: Oe.r, rTo: 0 }) + sk(p[5], p[6]) +
      O(p[1]) + O(p[3]) + draw(Oe);
  }, [[1, '1'], [2, '2'], [3, '3']], 'Claisen', 'two C=O at 1,3');

  /* Michael: heptane-2,6-dione, CH3-CO-CH2CH2CH2-CO-CH3. */
  row(308, 'Michael product', [0, 1, 2, 3, 4, 5, 6], [1, 3, 5], (p) => chain(p) + O(p[1]) + O(p[5]),
    [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], 'Michael', 'two C=O at 1,5');
  return s;
}

FIGURES.push({
  id: 'condensation-spacing',
  section: 'michael-robinson',
  lessons: ['michael-robinson'],
  anchor: '<h3>Recognize the product by counting</h3>',
  viewBox: '0 0 340 340',
  alt: 'Three products drawn in skeletal form, each with its carbons numbered from one oxygen-bearing carbon to the other. Aldol: 3-hydroxybutanal, with the C=O carbon 1 and the C–OH carbon 3. Claisen: ethyl 3-oxobutanoate, with the ketone carbon 1 and the ester carbon 3. Michael: heptane-2,6-dione, with the two C=O carbons at 1 and 5.',
  build() {
    return spacingRows(0, 0);
  },
  caption: 'Start at one carbon that carries oxygen and count to the other. An aldol and a Claisen both give 1,3; the second oxygen tells them apart. A Michael gives 1,5.',
});

/* ================================= the lesson's sorting exercise ======= */
FIGURES.push({
  id: 'l-spacing-sort',
  lessons: ['michael-robinson'],
  viewBox: '0 0 340 318',
  alt: 'Three molecules to sort, in skeletal form. A: ethyl 5-oxohexanoate, a ketone and an ester with three CH2 groups between their carbonyl carbons. B: 4-hydroxy-4-methylpentan-2-one, a ketone with an OH on the carbon two positions along. C: ethyl 2-methyl-3-oxopentanoate, a ketone and an ester with one CH carrying a methyl between their carbonyl carbons.',
  build() {
    const dx = 28, dy = 16;
    let s = '';
    const Ob = (p) => { const a = A(p.x, p.y - 40, 'O'); return bond(p, a, { order: 2, rFrom: 0, rTo: a.r }) + draw(a); };
    const zz = (x0, y0, n) => Array.from({ length: n }, (_, i) => P(x0 + i * dx, y0 + (i % 2 ? -dy : 0)));
    const chainTo = (pts, from, to) => { let t = ''; for (let i = from; i < to; i++) t += sk(pts[i], pts[i + 1]); return t; };
    /* Ester tail: C(=O)-O-CH2-CH3 starting from carbonyl vertex index k. */
    const esterTail = (pts, k) => {
      const Oe = A(pts[k + 1].x, pts[k + 1].y, 'O');
      return bond(pts[k], Oe, { rFrom: 0, rTo: Oe.r }) + bond(Oe, pts[k + 2], { rFrom: Oe.r, rTo: 0 }) + sk(pts[k + 2], pts[k + 3]) + draw(Oe);
    };
    /* A: ethyl 5-oxohexanoate. CH3-C(=O)-CH2-CH2-CH2-C(=O)-O-CH2-CH3: nine positions. */
    {
      const p = zz(40, 92, 9);
      s += tag(14, 30, 'A', { anchor: 'start', cls: 'fg-tag-good' });
      s += chainTo(p, 0, 5) + Ob(p[1]) + Ob(p[5]) + esterTail(p, 5);
    }
    /* B: 4-hydroxy-4-methylpentan-2-one. CH3-C(=O)-CH2-C(OH)(CH3)-CH3. */
    {
      const p = zz(80, 196, 5);
      s += tag(14, 134, 'B', { anchor: 'start', cls: 'fg-tag-good' });
      const OH = A(p[3].x, p[3].y - 40, 'OH');
      const me = P(p[3].x + 20, p[3].y - 30);
      s += chainTo(p, 0, 4) + Ob(p[1]) + bond(p[3], OH, { rFrom: 0, rTo: OH.r }) + draw(OH);
      s += sk(p[3], P(p[3].x + 28, p[3].y + 4 - 0));
      void me;
    }
    /* C: ethyl 2-methyl-3-oxopentanoate. CH3-CH2-C(=O)-CH(CH3)-C(=O)-O-CH2-CH3. */
    {
      const p = zz(40, 296, 8);
      s += tag(14, 238, 'C', { anchor: 'start', cls: 'fg-tag-good' });
      s += chainTo(p, 0, 4) + Ob(p[1] === undefined ? p[1] : p[2 - 1 + 0] && p[1]) ;
      s += '';
      /* p[0] CH3, p[1] CH2, p[2] C=O, p[3] CH(CH3), p[4] C(=O)O */
      s = s; // placeholder, replaced below
    }
    return s;
  },
  caption: 'Find the two carbons that carry oxygen in each molecule, then count the gap.',
});

export default FIGURES;
