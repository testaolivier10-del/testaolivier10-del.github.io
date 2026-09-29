/* Figures for the amine-synthesis notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Amines come after skeletal structures, so carbon chains and rings are
   drawn skeletally. Nitrogen is always labeled. A carbon that a route adds
   is highlighted (fg-atom-hi or fg-bond-hi); a carbon that a route removes is
   drawn in the warning color, so the carbon count can be read off each
   figure.

   The 340-wide figures are stacked in cells and use only fg-lbl and fg-tag
   text, so the same drawing serves the notes page and a lesson step. The
   Hofmann mechanism is 760 wide in the notes and has a stacked lesson copy
   (l-hofmann-rearrangement). */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { sk, polyPts, polyRing, benzene } from '../lib/ochem-skeletal.mjs';

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
/* A plain line with no arrowhead, in the arrow color (for a bracket). */
const line = (a, b) => `<line class="fg-arrow" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"></line>`;

/* A cell: a panel with a title tag at the top. */
function cell(ox, oy, w, h, title, draw, opts = {}) {
  const Q = (x, y) => P(ox + x, oy + y);
  let s = panel(ox, oy, w, h, opts.kind ? { kind: opts.kind } : {});
  if (title) s += tag(ox + w / 2, oy + 22, title, opts.titleCls ? { cls: opts.titleCls } : {});
  s += draw(Q);
  return s;
}

/* A skeletal zigzag from p0: even vertices on p0's line, odd ones 16 up. */
const zz = (p0, n, dx = 28, dy = 16) =>
  Array.from({ length: n }, (_, i) => P(p0.x + i * dx, p0.y - (i % 2 ? dy : 0)));
const chainInk = (v, hi) => v.slice(1).map((p, i) => sk(v[i], p, hi)).join('');

/* Phthalimide: a benzene ring fused on its right-hand edge to a
   five-membered imide ring (C=O, N, C=O). Returns the ink and the points
   a caller needs (N, the two carbonyl carbons and oxygens). */
function phthalimide(cx, cy, nLabel, opts = {}) {
  const r = 24;
  const { svg, pts } = benzene(cx, cy, r, { shift: 1 });
  const top = pts[5], bot = pts[4];            // the fused edge (30 and 330 degrees)
  const pc = P(top.x + 0.688 * r, cy), R5 = 0.851 * r;
  const at = (deg, d) => P(pc.x + Math.cos((deg * Math.PI) / 180) * d, pc.y - Math.sin((deg * Math.PI) / 180) * d);
  const c1 = at(72, R5), n = at(0, R5), c2 = at(-72, R5);
  const o1 = at(72, R5 + 30), o2 = at(-72, R5 + 30);
  const hiCO = opts.hiCO ? 'fg-bond-hi' : 'fg-bond';
  let s = svg;
  s += sk(top, c1) + sk(bot, c2);
  s += bond(c1, n, { rFrom: 0, rTo: rOf(nLabel) }) + bond(c2, n, { rFrom: 0, rTo: rOf(nLabel) });
  s += bond(c1, o1, { rFrom: 0, rTo: 14, order: 2, cls: hiCO }) + bond(c2, o2, { rFrom: 0, rTo: 14, order: 2, cls: hiCO });
  s += A(o1, 'O') + A(o2, 'O');
  s += A(n, nLabel, { kind: opts.nKind || 'plain' });
  return { svg: s, n, c1, c2, o1, o2 };
}

/* A cyclohexane ring whose attachment vertex points right (vertex 0). */
function ringRight(cx, cy, r = 20) {
  const pts = polyPts(cx, cy, 6, r, 0);
  return { svg: polyRing(pts), att: pts[0] };
}
/* A cyclohexane ring whose attachment vertex points up (vertex 0). */
function ringUp(cx, cy, r = 22) {
  const pts = polyPts(cx, cy, 6, r, 90);
  return { svg: polyRing(pts), att: pts[0] };
}

/* ===================================================================== 1
   The runaway: each product of the SN2 is itself a nucleophile, so the
   halide keeps going. The formulas are enough here; the point is the order
   and which step is faster. */
FIGURES.push({
  id: 'alkylation-runaway',
  section: 'amine-synthesis',
  lessons: ['amine-synthesis'],
  anchor: 'faster again.</p>',
  viewBox: '0 0 340 376',
  alt: 'A ladder of five boxes joined by arrows labeled plus R–Br, where R is CH3CH2 from bromoethane. Ammonia, the first nucleophile, gives the primary amine RNH2, which reacts faster than ammonia. It gives the secondary amine R2NH, faster again. That gives the tertiary amine R3N, slower because it is more crowded. That gives the quaternary ammonium salt R4N+ Br−, which has no lone pair left and stops. All five end up in the same flask.',
  build() {
    let s = tag(170, 20, 'BROMOETHANE ON AMMONIA · R = CH₃CH₂');
    const rows = [
      ['NH₃', 'ammonia', 'the first nucleophile', 'fg-tag'],
      ['RNH₂', 'primary amine', 'reacts faster than NH₃', 'fg-tag-warn'],
      ['R₂NH', 'secondary amine', 'faster again', 'fg-tag-warn'],
      ['R₃N', 'tertiary amine', 'slower: more crowded', 'fg-tag'],
      ['R₄N⁺ Br⁻', 'quaternary ammonium salt', 'no lone pair left: stops', 'fg-tag'],
    ];
    rows.forEach(([f, name, note, cls], i) => {
      const y = 56 + i * 66;
      s += panel(20, y - 17, 104, 34, i === 0 ? {} : { kind: 'hi' });
      s += text(72, y + 5, f, { cls: 'fg-lbl' });
      s += text(140, y - 2, name, { cls: 'fg-lbl', anchor: 'start' });
      s += text(140, y + 15, note, { cls, anchor: 'start' });
      if (i < rows.length - 1) {
        s += arrow(P(72, y + 19), P(72, y + 47));
        s += tag(84, y + 37, '+ R–Br', { anchor: 'start' });
      }
    });
    s += text(170, 364, 'all five end up in the same flask', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Each arrow is one more S<sub>N</sub>2 on bromoethane. The two orange notes mark the steps that outrun ammonia.',
});

/* ===================================================================== 2
   Gabriel: the nitrogen reacts once because the product has no N–H and its
   lone pair is pulled into both carbonyls. */
FIGURES.push({
  id: 'gabriel-synthesis',
  section: 'amine-synthesis',
  lessons: ['amine-synthesis'],
  anchor: 'also releases the amine.</p>',
  viewBox: '0 0 340 610',
  alt: 'The Gabriel synthesis in four stacked panels. Panel 1: phthalimide, a benzene ring fused to a five-membered ring holding C=O, N–H and C=O; the N–H hydrogen has pKa 8.3 and KOH removes it. Panel 2: the phthalimide anion, N minus with two lone pairs, attacks the CH2 of R–CH2–Br; curved arrows run from the nitrogen lone pair to the carbon and from the C–Br bond to bromine. Panel 3: the N-alkylphthalimide, with N bonded to CH2R and no N–H; its lone pair and both C=O bonds are highlighted, because the pair is shared with both carbonyls, so it is not a nucleophile. Panel 4: hydrazine, H2N–NH2, frees R–CH2–NH2, one primary amine, with phthalhydrazide as the by-product.',
  build() {
    let s = '';
    /* Panel 1: phthalimide */
    s += cell(8, 8, 324, 150, '1 · PHTHALIMIDE: ONE N–H, TWO C=O', (Q) => {
      const m = phthalimide(Q(58, 0).x, Q(0, 92).y, 'N');
      const h = P(m.n.x + 36, m.n.y);
      let t = m.svg + B(m.n, h, 'N', 'H', { cls: 'fg-bond-hi' }) + A(h, 'H', { kind: 'hi' });
      t += tag(Q(188, 0).x, Q(0, 76).y, 'this H: pKₐ 8.3', { anchor: 'start' });
      t += tag(Q(188, 0).x, Q(0, 94).y, 'both C=O pull on it', { anchor: 'start' });
      t += tag(Q(188, 0).x, Q(0, 112).y, 'KOH removes it', { anchor: 'start', cls: 'fg-tag-warn' });
      return t;
    });
    /* Panel 2: the anion does one SN2 */
    s += cell(8, 166, 324, 150, '2 · THE ANION ATTACKS R–CH₂–Br (SN2)', (Q) => {
      const m = phthalimide(Q(58, 0).x, Q(0, 88).y, 'N', { nKind: 'warn' });
      let t = m.svg + charge(m.n.x + 11, m.n.y - 15, '−');
      t += lonePair(m.n.x, m.n.y, 0, { dist: 21 }) + lonePair(m.n.x, m.n.y, 70, { dist: 21 });
      const c = P(m.n.x + 86, m.n.y), r = P(c.x, c.y - 44), br = P(c.x + 56, c.y);
      t += B(c, r, 'CH₂', 'R') + B(c, br, 'CH₂', 'Br');
      t += A(c, 'CH₂') + A(r, 'R') + A(br, 'Br');
      t += curve(P(m.n.x + 27, m.n.y + 1), P(c.x - 21, c.y + 2), { bow: 14 });
      const bm = mid(c, br);
      t += curve(P(bm.x, bm.y + 4), P(br.x - 2, br.y + 16), { bow: 12, size: 7 });
      t += tag(Q(236, 0).x, Q(0, 126).y, 'N attacks C from the', { anchor: 'middle' });
      t += tag(Q(236, 0).x, Q(0, 142).y, 'side opposite the Br', { anchor: 'middle' });
      return t;
    });
    /* Panel 3: the product cannot react again */
    s += cell(8, 324, 324, 150, '3 · N-ALKYLPHTHALIMIDE: IT STOPS HERE', (Q) => {
      const m = phthalimide(Q(58, 0).x, Q(0, 88).y, 'N', { nKind: 'hi', hiCO: true });
      const c = P(m.n.x + 46, m.n.y);
      let t = m.svg + B(m.n, c, 'N', 'CH₂R') + A(c, 'CH₂R');
      t += lonePair(m.n.x, m.n.y, -60, { dist: 21 });
      t += tag(Q(184, 0).x, Q(0, 62).y, 'no N–H left', { anchor: 'start' });
      t += tag(Q(184, 0).x, Q(0, 80).y, 'its lone pair is', { anchor: 'start' });
      t += tag(Q(184, 0).x, Q(0, 96).y, 'pulled into both C=O', { anchor: 'start' });
      t += tag(Q(184, 0).x, Q(0, 114).y, 'not a nucleophile', { anchor: 'start', cls: 'fg-tag-good' });
      return t;
    });
    /* Panel 4: release */
    s += cell(8, 482, 324, 120, '4 · HYDRAZINE FREES THE AMINE', (Q) => {
      let t = tag(Q(162, 0).x, Q(0, 44).y, 'H₂N–NH₂ (hydrazine), heat');
      const r = Q(56, 76), c = Q(106, 76), n = Q(160, 76);
      t += B(r, c, 'R', 'CH₂') + B(c, n, 'CH₂', 'NH₂');
      t += A(r, 'R') + A(c, 'CH₂') + A(n, 'NH₂', { kind: 'hi' });
      t += tag(Q(196, 0).x, Q(0, 80).y, 'one primary amine', { anchor: 'start', cls: 'fg-tag-good' });
      t += tag(Q(162, 0).x, Q(0, 108).y, 'by-product: phthalhydrazide', { cls: 'fg-tag-mut' });
      return t;
    });
    return s;
  },
  caption: 'Follow the nitrogen. It picks up one carbon in panel 2, and in panel 3 it has nothing left to attack with.',
});

/* ===================================================================== 3
   Azide: the nucleophile is not an amine, so the SN2 product cannot attack
   again. The azide ion is drawn linear, with its charges. */
FIGURES.push({
  id: 'azide-route',
  section: 'amine-synthesis',
  anchor: 'in fewer steps.</p>',
  viewBox: '0 0 340 368',
  alt: 'Three stacked panels. Panel 1: the azide ion, three nitrogens in a straight line, drawn N minus, double bond, N plus, double bond, N minus. Panel 2: 1-bromobutane with sodium azide gives 1-azidobutane, the chain ending in N=N+=N−; it is not an amine and does not attack the next alkyl halide. Panel 3: LiAlH4, or H2 over Pd, reduces the azide to butan-1-amine and releases N2.',
  build() {
    let s = '';
    const n3 = (p0, dx, first = '') => {
      const a = p0, b = P(p0.x + dx, p0.y), c = P(p0.x + 2 * dx, p0.y);
      let t = B(a, b, first || 'N', 'N', { order: 2 }) + B(b, c, 'N', 'N', { order: 2 });
      t += A(a, 'N') + A(b, 'N', { kind: 'hi' }) + A(c, 'N');
      t += charge(b.x + 10, b.y - 16, '+') + charge(c.x + 11, c.y - 15, '−');
      return { svg: t, first: a };
    };
    s += cell(8, 8, 324, 96, '1 · AZIDE ION, N₃⁻: A STRAIGHT LINE', (Q) => {
      const m = n3(Q(110, 62), 50);
      return m.svg + charge(m.first.x - 11, m.first.y - 15, '−');
    });
    s += cell(8, 112, 324, 128, '2 · NaN₃, SN2 → 1-AZIDOBUTANE', (Q) => {
      const v = zz(Q(24, 78), 4);
      let t = chainInk(v);
      const m = n3(P(v[3].x + 30, v[3].y + 16), 42);
      t += bond(v[3], m.first, { rFrom: 0, rTo: 14 }) + m.svg;
      t += tag(Q(162, 0).x, Q(0, 116).y, 'not an amine: it cannot attack R–Br', { cls: 'fg-tag-good' });
      return t;
    });
    s += cell(8, 248, 324, 112, '3 · LiAlH₄ (OR H₂, Pd) → BUTAN-1-AMINE', (Q) => {
      const v = zz(Q(60, 66), 4);
      const n = P(v[3].x + 30, v[3].y + 16);
      let t = chainInk(v) + bond(v[3], n, { rFrom: 0, rTo: 19 }) + A(n, 'NH₂', { kind: 'hi' });
      t += tag(Q(250, 0).x, Q(0, 64).y, '+ N₂ (gas)', { anchor: 'start', cls: 'fg-tag-mut' });
      t += tag(Q(162, 0).x, Q(0, 104).y, 'four carbons in, four out', { cls: 'fg-tag' });
      return t;
    });
    return s;
  },
  caption: 'The nitrogen that ends up on carbon is the first one of the three. The other two leave as N<sub>2</sub> gas.',
});

/* ===================================================================== 4
   Reductive amination, one example: cyclohexanone + methylamine. */
FIGURES.push({
  id: 'reductive-amination',
  section: 'amine-synthesis',
  lessons: ['amine-synthesis'],
  anchor: 'into a C&ndash;N single bond.</p>',
  viewBox: '0 0 340 520',
  alt: 'Reductive amination in three stacked panels. Panel 1: cyclohexanone plus methylamine, H2N–CH3. An arrow labeled mild acid, minus water, then plus H+, leads to panel 2: the iminium ion, the ring carbon double-bonded to N+, which carries H and CH3. A curved arrow brings hydride from NaBH3CN to the ring carbon, and a second arrow moves the C=N pi electrons onto nitrogen. Panel 3: N-methylcyclohexylamine, with the nitrogen on the old carbonyl carbon, which gained one hydrogen from the hydride.',
  build() {
    let s = '';
    s += cell(8, 8, 324, 128, '1 · CYCLOHEXANONE + METHYLAMINE', (Q) => {
      const ring = ringUp(Q(80, 0).x, Q(0, 94).y);
      const o = P(ring.att.x, ring.att.y - 34);
      let t = ring.svg + bond(ring.att, o, { rFrom: 0, rTo: 14, order: 2, cls: 'fg-bond-hi' }) + A(o, 'O');
      t += text(Q(146, 0).x, Q(0, 82).y, '+', { cls: 'fg-warn', size: 15 });
      const n = Q(190, 78), me = Q(240, 78);
      t += B(n, me, 'H₂N', 'CH₃') + A(n, 'H₂N', { kind: 'hi' }) + A(me, 'CH₃');
      t += tag(Q(214, 0).x, Q(0, 112).y, 'the amine', { cls: 'fg-tag-mut' });
      return t;
    });
    s += arrow(P(40, 140), P(40, 170));
    s += tag(54, 159, 'mild acid: − H₂O, then + H⁺', { anchor: 'start' });
    s += cell(8, 174, 324, 170, '2 · THE IMINIUM ION TAKES H⁻', (Q) => {
      const ring = ringUp(Q(80, 0).x, Q(0, 142).y);
      const n = P(ring.att.x, ring.att.y - 40);
      const h = P(n.x, n.y - 36), me = P(n.x + 46, n.y);
      let t = ring.svg + bond(ring.att, n, { rFrom: 0, rTo: 16, order: 2, cls: 'fg-bond-hi' });
      t += B(n, h, 'N', 'H') + bond(n, me, { rFrom: 16, rTo: 19 });
      t += A(n, 'N', { kind: 'warn' }) + A(h, 'H') + A(me, 'CH₃');
      t += charge(n.x - 20, n.y - 14, '+');
      /* hydride in, pi electrons out onto N */
      const hy = Q(190, 130);
      t += text(hy.x, hy.y + 5, 'H⁻', { cls: 'fg-lbl' });
      t += tag(hy.x, hy.y + 28, 'from NaBH₃CN');
      t += curve(P(hy.x - 14, hy.y), P(ring.att.x + 8, ring.att.y + 2), { bow: 16 });
      const bm = mid(ring.att, n);
      t += curve(P(bm.x - 8, bm.y + 8), P(n.x - 15, n.y + 8), { bow: -12, size: 7 });
      return t;
    });
    s += arrow(P(40, 348), P(40, 378));
    s += tag(54, 367, 'the C=N becomes a C–N', { anchor: 'start' });
    s += cell(8, 382, 324, 130, '3 · N-METHYLCYCLOHEXYLAMINE', (Q) => {
      const ring = ringUp(Q(80, 0).x, Q(0, 104).y);
      const n = P(ring.att.x, ring.att.y - 34);
      const me = P(n.x + 50, n.y);
      let t = ring.svg + bond(ring.att, n, { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' });
      t += B(n, me, 'NH', 'CH₃') + A(n, 'NH', { kind: 'hi' }) + A(me, 'CH₃');
      t += tag(Q(184, 0).x, Q(0, 80).y, 'N sits on the old', { anchor: 'start' });
      t += tag(Q(184, 0).x, Q(0, 96).y, 'C=O carbon, which', { anchor: 'start' });
      t += tag(Q(184, 0).x, Q(0, 112).y, 'gained one H', { anchor: 'start' });
      return t;
    });
    return s;
  },
  caption: 'The highlighted bond follows the carbonyl carbon: C=O, then C=N, then the new C&ndash;N bond.',
});

/* Text with italic parts: parts is a list of [string, italic?]. */
function itext(x, y, parts, cls = 'fg-tag', anchor = 'middle') {
  const size = cls === 'fg-lbl' ? 12.5 : 11;
  const body = parts.map(([s, it]) => (it ? `<tspan font-style="italic">${s}</tspan>` : s)).join('');
  return `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" font-size="${size}">${body}</text>`;
}

/* ===================================================================== 5
   Stereochemistry at the new C–N carbon: SN2 inverts it, hydride on a flat
   C=N gives both configurations. */
FIGURES.push({
  id: 'amine-stereo',
  section: 'amine-synthesis',
  anchor: 'decides the route.</p>',
  viewBox: '0 0 340 512',
  alt: 'Two panels. Panel 1, the SN2 route: (R)-2-bromobutane, bromine on a wedge, treated with NaN3 and then LiAlH4, gives (S)-butan-2-amine with NH2 on a hashed bond; the configuration is inverted. Panel 2, reductive amination of butan-2-one with NH3, NaBH3CN and mild acid: the flat iminium ion, C=NH2+, can take hydride from the front or from the back, so the product is a 50:50 mixture of (R)-butan-2-amine, NH2 on a wedge, and (S)-butan-2-amine, NH2 on a hash: a racemic mixture.',
  build() {
    let s = '';
    const butane = (p0, grp, kind, lbl) => {
      const v = zz(p0, 4, 30, 18);
      const g = P(v[1].x, v[1].y - 36);
      let t = chainInk(v);
      t += kind === 'wedge' ? wedge(v[1], g, { rFrom: 0, rTo: rOf(grp), width: 9 })
                            : hash(v[1], g, { rFrom: 0, rTo: rOf(grp), width: 10, rungs: 5 });
      t += A(g, grp, { kind: 'hi' });
      t += itext(v[0].x + 45, p0.y + 26, lbl);
      return t;
    };
    s += cell(8, 8, 324, 176, 'SN2 ROUTE: INVERSION', (Q) => {
      let t = butane(Q(14, 118), 'Br', 'wedge', [['(', 0], ['R', 1], [')-2-bromobutane', 0]]);
      t += tag(Q(166, 0).x, Q(0, 76).y, '1. NaN₃');
      t += tag(Q(166, 0).x, Q(0, 92).y, '2. LiAlH₄');
      t += arrow(Q(134, 104), Q(198, 104));
      t += butane(Q(212, 118), 'NH₂', 'hash', [['(', 0], ['S', 1], [')-butan-2-amine', 0]]);
      t += tag(Q(162, 0).x, Q(0, 168).y, 'N arrives opposite Br: the carbon inverts', { cls: 'fg-tag-warn' });
      return t;
    });
    s += cell(8, 192, 324, 312, 'REDUCTIVE AMINATION OF BUTAN-2-ONE', (Q) => {
      /* The flat iminium ion. */
      const v = zz(Q(117, 126), 4, 30, 18);
      const n = P(v[1].x, v[1].y - 40);
      let t = chainInk(v) + bond(v[1], n, { rFrom: 0, rTo: 19, order: 2 });
      t += A(n, 'NH₂', { kind: 'warn' }) + charge(n.x + 24, n.y - 12, '+');
      t += tag(Q(250, 0).x, Q(0, 64).y, 'NH₃, NaBH₃CN,', { cls: 'fg-tag-mut' });
      t += tag(Q(250, 0).x, Q(0, 80).y, 'mild acid', { cls: 'fg-tag-mut' });
      t += tag(Q(162, 0).x, Q(0, 152).y, 'H⁻ adds to this flat C=N from');
      t += tag(Q(162, 0).x, Q(0, 168).y, 'the front or from the back');
      t += butane(Q(12, 258), 'NH₂', 'wedge', [['(', 0], ['R', 1], [')', 0]]);
      t += butane(Q(186, 258), 'NH₂', 'hash', [['(', 0], ['S', 1], [')', 0]]);
      t += tag(Q(162, 0).x, Q(0, 250).y, '50 : 50', { cls: 'fg-tag-warn' });
      t += tag(Q(162, 0).x, Q(0, 302).y, 'a racemic mixture', { cls: 'fg-tag-warn' });
      return t;
    });
    return s;
  },
  caption: 'Top: one configuration in, the opposite one out. Bottom: a flat carbon in, both configurations out.',
});

/* ===================================================================== 6
   Nitro reduction keeps the nitrogen on the carbon the nitro group was on,
   so the nitro group's directing effect decides where the amine ends up. */
FIGURES.push({
  id: 'nitro-reduction',
  section: 'amine-synthesis',
  anchor: 'decide where the amine ends up.</p>',
  viewBox: '0 0 760 196',
  alt: 'Nitrobenzene, with Br2 and FeBr3, gives 1-bromo-3-nitrobenzene because the nitro group directs meta. Fe and HCl, then NaOH, reduce the nitro group to NH2 on the same ring carbon, giving 3-bromoaniline. Brominating aniline instead would put bromine ortho and para.',
  build() {
    let s = '';
    const ringAt = (cx, cy, top, br) => {
      const { svg, pts } = benzene(cx, cy, 30);
      let t = svg;
      if (top === 'NO2') {
        const n = P(pts[0].x, pts[0].y - 32);
        const o1 = P(n.x - 32, n.y - 18), o2 = P(n.x + 32, n.y - 18);
        t += bond(pts[0], n, { rFrom: 0, rTo: 14 }) + B(n, o1, 'N', 'O', { order: 2 }) + B(n, o2, 'N', 'O');
        t += A(n, 'N', { kind: 'hi' }) + A(o1, 'O') + A(o2, 'O');
        t += charge(n.x + 21, n.y + 8, '+') + charge(o2.x + 12, o2.y - 12, '−');
      } else {
        const n = P(pts[0].x, pts[0].y - 34);
        t += bond(pts[0], n, { rFrom: 0, rTo: 19, cls: 'fg-bond-hi' }) + A(n, 'NH₂', { kind: 'hi' });
      }
      if (br) {
        const p = pts[4], b = P(p.x + 30 * 0.866, p.y + 30 * 0.5);
        t += bond(p, b, { rFrom: 0, rTo: 16 }) + A(b, 'Br');
      }
      return t;
    };
    s += ringAt(110, 116, 'NO2', false);
    s += tag(110, 180, 'nitrobenzene');
    s += arrow(P(186, 110), P(306, 110));
    s += tag(246, 96, 'Br₂, FeBr₃');
    s += tag(246, 132, 'NO₂ directs meta', { cls: 'fg-tag-mut' });
    s += ringAt(380, 116, 'NO2', true);
    s += tag(380, 180, '1-bromo-3-nitrobenzene');
    s += arrow(P(470, 110), P(590, 110));
    s += tag(530, 96, 'Fe, HCl; then NaOH');
    s += tag(530, 132, 'NO₂ becomes NH₂', { cls: 'fg-tag-mut' });
    s += ringAt(660, 116, 'NH2', true);
    s += tag(660, 180, '3-bromoaniline');
    return s;
  },
  caption: 'The highlighted nitrogen never leaves its ring carbon. Brominating aniline instead would put the bromine ortho and para, because NH<sub>2</sub> directs there.',
});

/* ===================================================================== 7
   The Hofmann rearrangement, butanamide to propan-1-amine. The carbonyl carbon
   (the one that leaves as CO2) carries an orange dot throughout. `k` scales
   a drawing, so the lesson copy can draw the key step larger. */
const PROPYL = (c, k = 1) => [P(c.x - 90 * k, c.y + 18 * k), P(c.x - 60 * k, c.y), P(c.x - 30 * k, c.y + 18 * k)];
const dot = (p) => atom(p.x, p.y, '', { kind: 'warn', r: 5 });
/* Propyl chain ending at the carbonyl carbon c, with C=O up and an N. */
function acylN(c, nLabel, nKind, k = 1, hiCC = false) {
  const v = PROPYL(c, k);
  const o = P(c.x, c.y - 36 * k), n = P(c.x + 32 * k, c.y + 18 * k);
  let t = chainInk(v) + sk(v[2], c, hiCC);
  t += bond(c, o, { rFrom: 0, rTo: 14, order: 2 }) + bond(c, n, { rFrom: 0, rTo: rOf(nLabel) });
  t += A(o, 'O') + A(n, nLabel, { kind: nKind || 'plain' }) + dot(c);
  return { svg: t, v, o, n };
}
/* The key step: the N-bromoamide anion rearranging. */
function migration(c, k = 1) {
  const m = acylN(c, 'N', 'warn', k, true);
  const n = m.n, br = P(n.x + 34 * k, n.y + 22 * k);
  let t = m.svg + B(n, br, 'N', 'Br') + A(br, 'Br');
  t += charge(n.x + 2, n.y + 32, '−');
  t += lonePair(n.x, n.y, -75, { dist: 21 });
  /* The C–C bond shifts to N: the propyl group migrates ... */
  const cc = mid(m.v[2], c);
  t += curve(P(cc.x + 2, cc.y + 6), P(n.x - 15, n.y + 8), { bow: 16, size: 7 });
  /* ... the N lone pair becomes the new C=N pi bond ... */
  const lp = P(n.x + 5, n.y - 26);
  t += curve(P(lp.x - 6, lp.y - 2), P((c.x + n.x) / 2 + 2, (c.y + n.y) / 2 - 6), { bow: 10, size: 7 });
  /* ... and bromide leaves with the N–Br electrons. */
  const nb = mid(n, br);
  t += curve(P(nb.x + 5, nb.y - 5), P(br.x + 8, br.y - 15), { bow: -10, size: 7 });
  return t;
}
/* Propyl–N=C=O, with the N=C=O unit in a straight line (an sp carbon). */
function isocyanate(n) {
  const v = [P(n.x - 90, n.y + 18), P(n.x - 60, n.y), P(n.x - 30, n.y + 18)];
  const c = P(n.x + 40, n.y), o = P(n.x + 80, n.y);
  let t = chainInk(v) + bond(v[2], n, { rFrom: 0, rTo: 14 });
  t += bond(n, c, { rFrom: 14, rTo: 6, order: 2 }) + bond(c, o, { rFrom: 6, rTo: 14, order: 2 });
  t += A(n, 'N') + A(o, 'O') + dot(c);
  return { svg: t, n, c, o };
}
/* Water adds to the isocyanate carbon; the C=N pi electrons go to N. */
function waterAdds(m) {
  const w = P(m.c.x, m.c.y - 56);
  let t = A(w, 'H₂O');
  t += curve(P(w.x - 4, w.y + 19), P(m.c.x - 2, m.c.y - 9), { bow: 8, size: 7 });
  t += curve(P(m.c.x - 18, m.c.y + 6), P(m.n.x + 6, m.n.y + 15), { bow: 8, size: 7 });
  return t;
}
function propanamine(p0) {
  const v = zz(p0, 3, 30, 18);
  const n = P(v[2].x + 32, v[2].y - 18);
  return { svg: chainInk(v) + bond(v[2], n, { rFrom: 0, rTo: 19 }) + A(n, 'NH₂', { kind: 'hi' }), n };
}
function co2(c) {
  const o1 = P(c.x - 34, c.y), o2 = P(c.x + 34, c.y);
  return bond(o1, c, { rFrom: 14, rTo: 6, order: 2 }) + bond(c, o2, { rFrom: 6, rTo: 14, order: 2 }) +
    A(o1, 'O') + A(o2, 'O') + dot(c);
}

FIGURES.push({
  id: 'hofmann-rearrangement-mechanism',
  section: 'amine-synthesis',
  anchor: 'The same carbonyl carbon is lost.</p>',
  viewBox: '0 0 760 620',
  alt: 'The Hofmann rearrangement of butanamide in six panels, plus a Curtius strip. An orange dot marks the carbonyl carbon throughout. Panel 1: the amide anion, N minus with one H, attacks Br2; arrows run from the nitrogen lone pair to bromine and from the Br–Br bond to the far bromine. Panel 2: the N-bromoamide; hydroxide takes the remaining N–H. Panel 3: the N-bromoamide anion rearranges in one step: the C–C bond to the propyl group shifts to nitrogen, the nitrogen lone pair forms a C=N bond, and bromide leaves. Panel 4: the isocyanate, propyl–N=C=O, with N=C=O in a straight line; water adds to its carbon. Panel 5: the carbamic acid, propyl–NH–C(=O)–OH, which keeps its N–H and loses CO2 on its own. Panel 6: propan-1-amine, three carbons, and CO2 carrying the old carbonyl carbon. Bottom strip, the Curtius route: butanoyl chloride with NaN3 gives an acyl azide, which on heating loses N2 and gives the same isocyanate.',
  build() {
    let s = '';
    const W = 240, H = 196;
    s += cell(8, 8, W, H, '1 · THE AMIDE ANION ATTACKS Br₂', (Q) => {
      const c = Q(102, 104);
      const m = acylN(c, 'N', 'warn');
      const n = m.n, h = P(n.x, n.y + 40);
      let t = m.svg + B(n, h, 'N', 'H') + A(h, 'H');
      t += charge(n.x - 20, n.y + 14, '−');
      t += lonePair(n.x, n.y, -40, { dist: 21 }) + lonePair(n.x, n.y, 30, { dist: 21 });
      const b1 = P(n.x + 46, n.y - 30), b2 = P(n.x + 94, n.y - 30);
      t += B(b1, b2, 'Br', 'Br') + A(b1, 'Br') + A(b2, 'Br');
      t += curve(P(n.x + 20, n.y - 16), P(b1.x - 15, b1.y + 6), { bow: 8, size: 7 });
      const bb = mid(b1, b2);
      t += curve(P(bb.x, bb.y - 4), P(b2.x - 4, b2.y - 17), { bow: -12, size: 7 });
      t += tag(Q(W / 2, 0).x, Q(0, 186).y, 'HO⁻ first took one N–H');
      return t;
    });
    s += cell(260, 8, W, H, '2 · HO⁻ TAKES THE OTHER N–H', (Q) => {
      const c = Q(102, 96);
      const m = acylN(c, 'N', 'plain');
      const n = m.n, h = P(n.x, n.y + 44), br = P(n.x + 42, n.y - 26);
      let t = m.svg + B(n, h, 'N', 'H') + A(h, 'H') + B(n, br, 'N', 'Br') + A(br, 'Br');
      const ho = P(n.x + 66, n.y + 44);
      t += A(ho, 'HO') + charge(ho.x + 17, ho.y - 15, '−');
      t += curve(P(ho.x - 17, ho.y + 2), P(h.x + 15, h.y + 2), { bow: -10, size: 7 });
      const nh = mid(n, h);
      t += curve(P(nh.x + 5, nh.y + 2), P(n.x + 12, n.y + 12), { bow: 8, size: 7 });
      t += tag(Q(W / 2, 0).x, Q(0, 186).y, 'the N-bromoamide');
      return t;
    });
    s += cell(512, 8, W, H, '3 · PROPYL MOVES TO N', (Q) => {
      let t = migration(Q(112, 92));
      t += tag(Q(W / 2, 0).x, Q(0, 168).y, 'as Br⁻ leaves: one step,', { cls: 'fg-tag-warn' });
      t += tag(Q(W / 2, 0).x, Q(0, 184).y, 'no free nitrene', { cls: 'fg-tag-warn' });
      return t;
    }, { kind: 'warn' });
    s += cell(8, 212, W, H, '4 · AN ISOCYANATE, R–N=C=O', (Q) => {
      const m = isocyanate(Q(118, 110));
      let t = m.svg + waterAdds(m);
      t += tag(Q(W / 2, 0).x, Q(0, 160).y, 'N=C=O is a straight line');
      t += tag(Q(W / 2, 0).x, Q(0, 178).y, 'water adds to its carbon');
      return t;
    });
    s += cell(260, 212, W, H, '5 · A CARBAMIC ACID', (Q) => {
      const n = Q(118, 118);
      const v = [P(n.x - 90, n.y - 18), P(n.x - 60, n.y), P(n.x - 30, n.y - 18)];
      const c = P(n.x + 30, n.y - 18), o = P(c.x, c.y - 36), oh = P(c.x + 32, c.y + 18);
      let t = chainInk(v) + bond(v[2], n, { rFrom: 0, rTo: 16 });
      t += bond(n, c, { rFrom: 16, rTo: 0 }) + bond(c, o, { rFrom: 0, rTo: 14, order: 2 }) + bond(c, oh, { rFrom: 0, rTo: 16 });
      t += A(n, 'NH', { kind: 'hi' }) + A(o, 'O') + A(oh, 'OH') + dot(c);
      t += tag(Q(W / 2, 0).x, Q(0, 164).y, 'it keeps its N–H, and loses');
      t += tag(Q(W / 2, 0).x, Q(0, 182).y, 'CO₂ on its own');
      return t;
    });
    s += cell(512, 212, W, H, '6 · PROPAN-1-AMINE + CO₂', (Q) => {
      const m = propanamine(Q(22, 100));
      let t = m.svg + co2(Q(186, 90));
      t += tag(Q(66, 0).x, Q(0, 140).y, 'three carbons', { cls: 'fg-tag-good' });
      t += tag(Q(186, 0).x, Q(0, 124).y, 'the old C=O', { cls: 'fg-tag-warn' });
      t += tag(Q(186, 0).x, Q(0, 140).y, 'carbon', { cls: 'fg-tag-warn' });
      return t;
    }, { kind: 'good' });
    s += cell(8, 416, 744, 196, 'CURTIUS: THE SAME ISOCYANATE FROM AN ACYL AZIDE', (Q) => {
      /* butanoyl chloride */
      const c1 = Q(116, 110);
      const v1 = PROPYL(c1), o1 = P(c1.x, c1.y - 36), cl = P(c1.x + 32, c1.y + 18);
      let t = chainInk(v1) + sk(v1[2], c1) + bond(c1, o1, { rFrom: 0, rTo: 14, order: 2 }) + bond(c1, cl, { rFrom: 0, rTo: 16 });
      t += A(o1, 'O') + A(cl, 'Cl') + dot(c1);
      t += tag(Q(90, 0).x, Q(0, 172).y, 'butanoyl chloride');
      t += arrow(Q(170, 110), Q(216, 110));
      t += tag(Q(193, 0).x, Q(0, 96).y, 'NaN₃');
      /* acyl azide */
      const c2 = Q(330, 104);
      const v2 = PROPYL(c2), o2 = P(c2.x, c2.y - 36);
      const na = P(c2.x + 32, c2.y + 18), nb = P(na.x + 40, na.y), nc = P(nb.x + 40, nb.y);
      t += chainInk(v2) + sk(v2[2], c2) + bond(c2, o2, { rFrom: 0, rTo: 14, order: 2 }) + bond(c2, na, { rFrom: 0, rTo: 14 });
      t += B(na, nb, 'N', 'N', { order: 2 }) + B(nb, nc, 'N', 'N', { order: 2 });
      t += A(o2, 'O') + A(na, 'N') + A(nb, 'N') + A(nc, 'N') + dot(c2);
      t += charge(nb.x + 10, nb.y - 16, '+') + charge(nc.x + 11, nc.y - 15, '−');
      t += tag(Q(322, 0).x, Q(0, 172).y, 'an acyl azide');
      t += arrow(Q(460, 110), Q(520, 110));
      t += tag(Q(490, 0).x, Q(0, 96).y, 'heat');
      t += tag(Q(490, 0).x, Q(0, 132).y, '− N₂', { cls: 'fg-tag-mut' });
      t += isocyanate(Q(626, 110)).svg;
      t += tag(Q(640, 0).x, Q(0, 172).y, 'the isocyanate of panel 4');
      return t;
    });
    return s;
  },
  caption: 'The orange dot marks the carbonyl carbon. In panel 3 the propyl group leaves it for the nitrogen, and in panel 6 it leaves as CO<sub>2</sub>. In panel 3 only the nitrogen lone pair that reacts is drawn.',
});

/* The lesson copy: the three panels that show where the carbon goes, with
   the key step drawn larger. */
FIGURES.push({
  id: 'l-hofmann-rearrangement',
  lessons: ['amine-synthesis'],
  viewBox: '0 0 340 520',
  alt: 'Three stacked panels from the Hofmann rearrangement of butanamide, with an orange dot on the carbonyl carbon. Panel 1: the N-bromoamide anion; the C–C bond to the propyl group shifts to nitrogen, the nitrogen lone pair forms a C=N bond, and bromide leaves. Panel 2: the isocyanate, propyl–N=C=O, with N=C=O in a straight line; water adds to its carbon. Panel 3: propan-1-amine, three carbons, plus CO2 carrying the old carbonyl carbon.',
  build() {
    let s = '';
    s += cell(8, 8, 324, 196, 'THE PROPYL GROUP MOVES TO N', (Q) => {
      let t = migration(Q(150, 88), 1.3);
      t += tag(Q(162, 0).x, Q(0, 184).y, 'as Br⁻ leaves, in one step', { cls: 'fg-tag-warn' });
      return t;
    }, { kind: 'warn' });
    s += cell(8, 212, 324, 170, 'AN ISOCYANATE; WATER ADDS', (Q) => {
      const m = isocyanate(Q(150, 112));
      let t = m.svg + waterAdds(m);
      t += tag(Q(162, 0).x, Q(0, 156).y, 'then the carbamic acid loses CO₂');
      return t;
    });
    s += cell(8, 390, 324, 122, 'PROPAN-1-AMINE + CO₂', (Q) => {
      const m = propanamine(Q(30, 76));
      let t = m.svg + co2(Q(250, 66));
      t += tag(Q(76, 0).x, Q(0, 106).y, 'three carbons', { cls: 'fg-tag-good' });
      t += tag(Q(250, 0).x, Q(0, 100).y, 'the old C=O carbon', { cls: 'fg-tag-warn' });
      return t;
    }, { kind: 'good' });
    return s;
  },
  caption: 'The orange dot is the carbon that started as the amide C=O. In the top panel only the nitrogen lone pair that reacts is drawn.',
});

/* ===================================================================== 8
   Five routes to one amine, sorted by what they do to the carbon count. */
FIGURES.push({
  id: 'carbon-count-routes',
  section: 'amine-synthesis',
  anchor: 'use reductive amination or amide reduction.</div>',
  viewBox: '0 0 760 432',
  alt: 'Five starting materials, each with its carbon count, lead to the same product, butan-1-amine, four carbons. 1-Bromopropane, three carbons, with NaCN then LiAlH4: plus one carbon. 1-Bromobutane, four carbons, by Gabriel or by NaN3 then LiAlH4: count unchanged. Butanamide, four carbons, with LiAlH4: unchanged. Butanal, four carbons, with excess NH3 and NaBH3CN: unchanged. Pentanamide, five carbons, with Br2 and NaOH: minus one carbon.',
  build() {
    let s = tag(380, 20, 'FIVE WAYS TO BUTAN-1-AMINE');
    const rows = [
      ['1-bromopropane', 3, 'NaCN; then LiAlH₄', '+1 carbon', 'fg-tag-good'],
      ['1-bromobutane', 4, 'Gabriel, or NaN₃ then LiAlH₄', 'no change', 'fg-tag-mut'],
      ['butanamide', 4, 'LiAlH₄', 'no change', 'fg-tag-mut'],
      ['butanal', 4, 'excess NH₃, NaBH₃CN', 'no change', 'fg-tag-mut'],
      ['pentanamide', 5, 'Br₂, NaOH', '−1 carbon', 'fg-tag-warn'],
    ];
    const draw = (i, y) => {
      const v = zz(P(24, y), i === 4 || i === 3 ? 4 : 3);
      let t = chainInk(v);
      const last = v[v.length - 1];
      const nx = P(last.x + 28, last.y + (v.length % 2 ? -16 : 16));
      if (i === 0) t += bond(last, nx, { rFrom: 0, rTo: 16 }) + A(nx, 'Br');
      if (i === 1) {
        const c4 = nx, br = P(c4.x + 28, c4.y + 16);
        t += sk(last, c4) + bond(c4, br, { rFrom: 0, rTo: 16 }) + A(br, 'Br');
      }
      if (i === 2 || i === 4) {
        const c = nx, up = c.y < last.y;
        const o = P(c.x, c.y + (up ? -32 : 32)), n = P(c.x + 30, last.y);
        t += sk(last, c) + bond(c, o, { rFrom: 0, rTo: 14, order: 2 }) + bond(c, n, { rFrom: 0, rTo: 19 });
        t += A(o, 'O') + A(n, 'NH₂');
        if (i === 4) t += atom(c.x, c.y, '', { kind: 'warn', r: 5 });
      }
      if (i === 3) t += bond(last, nx, { rFrom: 0, rTo: 14, order: 2 }) + A(nx, 'O');
      return t;
    };
    rows.forEach(([name, n, reag, change, cls], i) => {
      const y = 72 + i * 76;
      s += draw(i, y);
      s += text(196, y - 10, name, { cls: 'fg-lbl', anchor: 'start' });
      s += tag(196, y + 8, n + ' carbons', { anchor: 'start', cls: 'fg-tag-mut' });
      s += line(P(330, y - 4), P(540, y - 4));
      s += tag(435, y - 12, reag);
      s += tag(435, y + 12, change, { cls });
    });
    s += line(P(540, 68), P(540, 372));
    s += arrow(P(540, 220), P(590, 220));
    const v = zz(P(606, 228), 4);
    const n = P(v[3].x + 28, v[3].y + 16);
    s += chainInk(v) + bond(v[3], n, { rFrom: 0, rTo: 19 }) + A(n, 'NH₂', { kind: 'hi' });
    s += tag(660, 264, 'butan-1-amine');
    s += tag(660, 282, '4 carbons', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Each count is measured from the named starting material; NH<sub>3</sub> brings no carbon. Only the top row adds a carbon, and only the bottom row loses one; the orange dot marks the carbon it loses.',
});

/* ===================================================================== 9
   Worked example 2: the attempts at N-methylcyclohexylamine that need a
   drawing (reductive amination both ways, and acylation both ways). */
function cyAmine(cx, cy, sub) {
  const ring = ringRight(cx, cy);
  let t = ring.svg;
  if (sub === 'O') {
    const o = P(ring.att.x + 30, cy);
    return t + bond(ring.att, o, { rFrom: 0, rTo: 14, order: 2 }) + A(o, 'O');
  }
  if (sub === 'NH2') {
    const n = P(ring.att.x + 32, cy);
    return t + bond(ring.att, n, { rFrom: 0, rTo: 19 }) + A(n, 'NH₂');
  }
  const nl = sub === 'NMe2' ? 'N' : 'NH';
  const n = P(ring.att.x + 30, cy);
  t += bond(ring.att, n, { rFrom: 0, rTo: rOf(nl) }) + A(n, nl);
  if (sub === 'NHMe' || sub === 'NMe2') {
    const me = P(n.x + 42, cy);
    t += B(n, me, nl, 'CH₃') + A(me, 'CH₃', { kind: 'hi' });
  }
  if (sub === 'NMe2') {
    const me2 = P(n.x, cy + 40);
    t += B(n, me2, nl, 'CH₃') + A(me2, 'CH₃', { kind: 'warn' });
  }
  if (sub === 'NHEt') {
    const c1 = P(n.x + 30, cy - 18), c2 = P(n.x + 58, cy);
    t += bond(n, c1, { rFrom: 16, rTo: 0, cls: 'fg-bond-hi' }) + sk(c1, c2) + atom(c2.x, c2.y, '', { kind: 'warn', r: 5 });
  }
  if (sub === 'NHAc' || sub === 'NHCHO') {
    const c = P(n.x + 30, cy - 18), o = P(c.x, c.y - 32), end = P(c.x + 28, cy);
    t += bond(n, c, { rFrom: 16, rTo: 0 }) + bond(c, o, { rFrom: 0, rTo: 14, order: 2 }) + A(o, 'O');
    if (sub === 'NHAc') t += sk(c, end, true);
    else t += bond(c, end, { rFrom: 0, rTo: 14 }) + A(end, 'H');
    t += atom(c.x, c.y, '', { kind: 'hi', r: 5 });
  }
  return t;
}
FIGURES.push({
  id: 'methylcyclohexylamine-routes',
  section: 'amine-synthesis',
  anchor: 'whose single carbon becomes the methyl.</p>',
  viewBox: '0 0 760 548',
  alt: 'Four rows. Attempt C, first way: cyclohexanone with methylamine and NaBH3CN gives N-methylcyclohexylamine, the target, cleanly. Attempt C, second way: cyclohexylamine with formaldehyde and NaBH3CN gives the target, but formaldehyde reacts again and gives N,N-dimethylcyclohexylamine. Attempt D with acetyl chloride: cyclohexylamine gives the acetamide, and LiAlH4 gives N-ethylcyclohexylamine, one carbon too many. Attempt D with ethyl formate: cyclohexylamine gives the formamide, and LiAlH4 turns its single carbon into the N-methyl group of the target.',
  build() {
    let s = '';
    const rows = [
      { y: 72, head: 'ATTEMPT C · CYCLOHEXANONE + METHYLAMINE', steps: ['O', 'NHMe'], reag: ['CH₃NH₂, NaBH₃CN'], verdict: ['the target, cleanly', 'fg-tag-good'] },
      { y: 204, head: 'ATTEMPT C · CYCLOHEXYLAMINE + FORMALDEHYDE', steps: ['NH2', 'NHMe', 'NMe2'], reag: ['H₂C=O, NaBH₃CN', 'H₂C=O again'], verdict: ['goes on to N,N-dimethyl', 'fg-tag-warn'] },
      { y: 352, head: 'ATTEMPT D · ACETYL CHLORIDE, THEN LiAlH₄', steps: ['NH2', 'NHAc', 'NHEt'], reag: ['CH₃COCl', 'LiAlH₄'], verdict: ['N-ethyl: one carbon too many', 'fg-tag-warn'] },
      { y: 482, head: 'ATTEMPT D · ETHYL FORMATE, THEN LiAlH₄', steps: ['NH2', 'NHCHO', 'NHMe'], reag: ['HCOOCH₂CH₃', 'LiAlH₄'], verdict: ['the target', 'fg-tag-good'] },
    ];
    const X = [50, 320, 590];
    rows.forEach((r) => {
      s += tag(16, r.y - 44, r.head, { anchor: 'start' });
      r.steps.forEach((st, j) => {
        const x = r.steps.length === 2 && j === 1 ? X[2] : X[j];
        s += cyAmine(x, r.y, st);
      });
      const gaps = r.steps.length === 2 ? [[134, 556]] : [[134, 288], [448, 556]];
      gaps.forEach(([a, b], j) => {
        s += arrow(P(a, r.y), P(b, r.y));
        s += tag((a + b) / 2, r.y - 10, r.reag[j]);
      });
      s += tag(X[2] + 50, r.y + (r.steps[2] === 'NMe2' ? 76 : 44), r.verdict[0], { cls: r.verdict[1] });
    });
    return s;
  },
  caption: 'Highlighted: the carbon that ends up bonded to the nitrogen, and where it came from. Orange: an extra carbon you did not want.',
});

export default FIGURES;
