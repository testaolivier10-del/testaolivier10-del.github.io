/* Figures for the grignard-reagents notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Organometallics comes long after skeletal structures, but these figures
   draw small molecules atom by atom (CH₃, CH₂, Et) so the reader can count
   the carbon groups on one carbon, which is what most of the page asks.

   Every figure here is 340 wide or less, stacked, and uses only fg-lbl and
   fg-tag text, so the lesson can show the same drawing the notes show. The
   one exception is alcohol-classes, which is notes-only and 700 wide. */
import { atom as atom0, bond, arrow, curve, lonePair, text, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
const mid = (a, b, f = 0.5) => P(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
/* A lone pair pointing out along math angle `deg`. */
const lp = (c, deg, d = 22) => lonePair(c.x, c.y, -deg, { dist: d, spread: 4.5, r: 2.4 });
/* An atom disc that stays opaque in both themes (the tinted discs are
   translucent in the dark theme, so an opaque plain disc goes under them). */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind !== 'plain'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
const A = (p, l, o = {}) => atom(p.x, p.y, l, o);
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const tg = (x, y, s, kind, anchor = 'middle') =>
  text(x, y, s, { cls: kind ? `fg-tag-${kind}` : 'fg-tag', size: 11, anchor });
const charge = (p, s = '+') => text(p.x, p.y + 5, s, { cls: 'fg-warn', size: 15 });
const B = (a, b, rFrom = 15, rTo = 15, o = {}) => bond(a, b, { rFrom, rTo, ...o });
const hiB = (a, b, rFrom = 15, rTo = 15, order = 1) => bond(a, b, { rFrom, rTo, order, cls: 'fg-bond-hi' });
const dbl = (a, b, rFrom = 15, rTo = 15) => bond(a, b, { rFrom, rTo, order: 2 });
/* A coordination bond (a lone pair shared with a metal): dashed. */
const dative = (a, b, rFrom = 15, rTo = 17) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  return `<line class="fg-dash-hi" x1="${r2(a.x + ux * rFrom)}" y1="${r2(a.y + uy * rFrom)}" x2="${r2(b.x - ux * rTo)}" y2="${r2(b.y - uy * rTo)}"></line>`;
};
/* H3C–MgBr drawn as two discs and a bond, so an arrow can start on the bond. */
function reagent(c, dir = 180, o = {}) {
  const mg = at(c, dir, o.len ?? 58);
  return {
    s: B(c, mg, 17, 22) + A(mg, 'MgBr', { r: 22 }) + A(c, o.label ?? 'H₃C', { r: 17, kind: 'hi' }),
    mg, bondMid: mid(c, mg, 0.45),
  };
}

/* ================================================== forming the reagent */
FIGURES.push({
  id: 'grignard-formation',
  section: 'grignard-reagents',
  anchor: '<p class="step-body" style="text-align:center;"><b>R&ndash;Br + Mg &rarr; R&ndash;MgBr</b></p>',
  alt: 'Top: bromoethane, H3C–CH2–Br, with the carbon–bromine bond highlighted, the carbon marked delta plus and the bromine delta minus, plus a magnesium atom. An arrow labeled dry ether points down. Bottom: ethylmagnesium bromide, H3C–CH2–Mg–Br, with magnesium now between carbon and bromine, the carbon marked delta minus and the magnesium delta plus.',
  viewBox: '0 0 340 250',
  build() {
    let s = '';
    const y1 = 62, y2 = 186;
    const c1 = P(44, y1), c2 = P(104, y1), br = P(166, y1), mg = P(250, y1);
    s += B(c1, c2, 17, 17) + hiB(c2, br, 17, 16);
    s += A(c1, 'H₃C', { r: 17 }) + A(c2, 'CH₂', { r: 17, kind: 'hi' }) + A(br, 'Br', { r: 16 });
    s += lbl(208, y1 + 5, '+') + A(mg, 'Mg', { r: 17 });
    s += tg(c2.x, y1 - 26, 'δ+', 'warn') + tg(br.x, y1 - 26, 'δ−');
    s += tg(135, y1 + 36, 'Mg goes in here');
    s += arrow(P(150, 108), P(150, 150), { size: 8 });
    s += tg(162, 133, 'dry ether', null, 'start');
    const d1 = P(44, y2), d2 = P(104, y2), m = P(170, y2), b2 = P(236, y2);
    s += B(d1, d2, 17, 17) + hiB(d2, m, 17, 18) + B(m, b2, 18, 16);
    s += A(d1, 'H₃C', { r: 17 }) + A(d2, 'CH₂', { r: 17, kind: 'hi' }) + A(m, 'Mg', { r: 18 }) + A(b2, 'Br', { r: 16 });
    s += tg(d2.x, y2 - 26, 'δ−', 'good') + tg(m.x, y2 - 26, 'δ+');
    s += tg(170, y2 + 42, 'the same carbon is now δ−: a nucleophile');
    return s;
  },
  caption: 'Bromoethane becomes ethylmagnesium bromide. Follow the highlighted CH₂: it ends up bonded to magnesium instead of bromine, and its partial charge flips.',
});

/* ======================================== the ether holding the magnesium */
FIGURES.push({
  id: 'ether-mg',
  section: 'grignard-reagents',
  lessons: ['grignard-reagents'],
  anchor: 'stable enough to use.</p>',
  alt: 'Ethylmagnesium bromide with two diethyl ether molecules. The magnesium sits in the middle, bonded to the ethyl group on the left and to bromine on the right. One ether oxygen sits above it and one below; a dashed line joins each oxygen to the magnesium, standing for one shared lone pair. Each oxygen keeps its second lone pair, pointing away from the metal.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    const mg = P(170, 150), et = P(92, 150), br = P(248, 150);
    const oT = P(170, 70), oB = P(170, 230);
    s += B(et, mg, 17, 18) + B(mg, br, 18, 16);
    s += dative(oT, mg, 15, 18) + dative(oB, mg, 15, 18);
    for (const [o, up] of [[oT, 1], [oB, -1]]) {
      const l = at(o, up > 0 ? 150 : 210, 48), r = at(o, up > 0 ? 30 : 330, 48);
      s += B(o, l, 15, 15) + B(o, r, 15, 15);
      s += A(l, 'Et', { r: 15 }) + A(r, 'Et', { r: 15 });
      s += lp(o, up > 0 ? 90 : 270, 22);
      s += A(o, 'O', { r: 15 });
    }
    s += A(et, 'Et', { r: 17, kind: 'hi' }) + A(mg, 'Mg', { r: 18 }) + A(br, 'Br', { r: 16 });
    s += tg(182, 114, 'one lone pair', null, 'start');
    s += tg(182, 196, 'one lone pair', null, 'start');
    s += tg(170, 20, 'diethyl ether');
    s += tg(170, 290, 'diethyl ether');
    return s;
  },
  caption: 'The dashed lines are the shared lone pairs. Each oxygen keeps its other lone pair. Et is short for ethyl, CH₂CH₃.',
});

/* =========================================== which class of alcohol forms */
/* A carbonyl compound: C with =O up and two groups below. */
function carbonyl(c, g1, g2, o = {}) {
  const O = P(c.x, c.y - 42), a = at(c, 215, 44), b = at(c, 325, 44);
  let s = dbl(c, O, 16, 15) + B(c, a, 16, o.r1 ?? 15) + B(c, b, 16, o.r2 ?? 15);
  s += A(O, 'O') + A(a, g1, { r: o.r1 ?? 15 }) + A(b, g2, { r: o.r2 ?? 15 });
  s += A(c, 'C', { kind: 'hi' });
  return s;
}
/* The alcohol: OH up, the carbonyl compound's two groups left and down,
   and the new CH3 from the reagent on the right. */
function carbinol(c, g1, g2) {
  const oh = P(c.x, c.y - 44), a = P(c.x - 46, c.y), b = P(c.x, c.y + 44), n = P(c.x + 48, c.y);
  let s = B(c, oh, 16, 16) + B(c, a, 16, 15) + B(c, b, 16, 15) + hiB(c, n, 16, 17);
  s += A(oh, 'OH', { r: 16 }) + A(a, g1) + A(b, g2) + A(n, 'CH₃', { r: 17, kind: 'hi' });
  s += A(c, 'C', { kind: 'hi' });
  return s;
}

FIGURES.push({
  id: 'alcohol-classes',
  section: 'grignard-reagents',
  anchor: 'and that number is the class of the alcohol.</p>',
  alt: 'Three rows. Formaldehyde, whose carbonyl carbon carries two hydrogens, gives ethanol, a primary alcohol. Acetaldehyde, with one hydrogen and one methyl, gives propan-2-ol, a secondary alcohol. Acetone, with two methyls, gives 2-methylpropan-2-ol, a tertiary alcohol. In each product the carbinol carbon and the new methyl from CH3MgBr are highlighted.',
  viewBox: '0 0 700 420',
  build() {
    let s = '';
    const rows = [
      { y: 80, g: ['H', 'H'], name: 'formaldehyde', prod: 'ethanol', cls: '1° alcohol', n: 'carbinol C has 1 carbon group' },
      { y: 210, g: ['H', 'CH₃'], name: 'acetaldehyde', prod: 'propan-2-ol', cls: '2° alcohol', n: 'carbinol C has 2 carbon groups' },
      { y: 340, g: ['CH₃', 'CH₃'], name: 'acetone', prod: '2-methylpropan-2-ol', cls: '3° alcohol', n: 'carbinol C has 3 carbon groups' },
    ];
    for (const r of rows) {
      const c = P(100, r.y);
      s += carbonyl(c, r.g[0], r.g[1], { r1: r.g[0].length > 1 ? 17 : 13, r2: r.g[1].length > 1 ? 17 : 13 });
      s += tg(100, r.y + 62, r.name);
      s += arrow(P(180, r.y), P(318, r.y), { size: 8 });
      s += tg(249, r.y - 12, '1. CH₃MgBr');
      s += tg(249, r.y + 20, '2. H₃O⁺');
      s += carbinol(P(420, r.y), r.g[0], r.g[1]);
      s += lbl(500, r.y - 8, r.prod, 'start');
      s += tg(500, r.y + 12, r.cls, 'good', 'start');
      s += tg(500, r.y + 30, r.n, null, 'start');
    }
    return s;
  },
  caption: 'Each product keeps the two groups its carbonyl carbon already had and gains the highlighted CH₃.',
});

/* ======================================================= ester, twice */
FIGURES.push({
  id: 'ester-adds-twice',
  section: 'grignard-reagents',
  lessons: ['grignard-reagents'],
  anchor: 'the ketone is consumed faster than it forms.</p>',
  alt: 'Four stacked panels. 1: CH3MgBr adds to ethyl propanoate; one curved arrow runs from the C–Mg bond to the carbonyl carbon and a second from the C=O double bond onto oxygen. 2: the tetrahedral intermediate, with O minus, the new CH3, an ethyl and an ethoxy group on one carbon; an arrow from an oxygen lone pair re-forms the C=O and a second arrow sends the C–OEt bond electrons onto the ethoxy oxygen, which leaves as ethoxide. 3: the ketone butan-2-one meets a second CH3MgBr, with the same two arrows. 4: after H3O+ workup, 2-methylbutan-2-ol, with both CH3 groups from the reagent highlighted.',
  viewBox: '0 0 340 696',
  build() {
    let s = '';
    const X = 16, W = 308;
    /* A carbonyl carbon under attack from H3C–MgBr, with its two arrows. */
    const attack = (T, g1, g2, o = {}) => {
      let t = '';
      const c = P(222, T + 112), O = P(222, T + 68), a = at(c, 215, 46), b = at(c, 325, 46);
      t += dbl(c, O, 16, 15) + B(c, a, 16, o.r1 ?? 15) + (o.hi2 ? hiB(c, b, 16, 17) : B(c, b, 16, 17));
      t += A(O, 'O') + A(a, g1, { r: o.r1 ?? 15 }) + A(b, g2, { r: 17, kind: o.hi2 ? 'hi' : undefined });
      t += A(c, 'C', { kind: o.kc ?? 'hi' });
      t += lp(O, 150) + lp(O, 30);
      const g = reagent(P(118, T + 76), 180, { len: 58 });
      t += g.s;
      t += curve(P(g.bondMid.x, g.bondMid.y + 9), P(c.x - 18, c.y - 3), { bow: 24 });
      t += curve(P(c.x + 8, c.y - 24), P(O.x + 17, O.y + 7), { bow: 9, size: 7 });
      return t;
    };

    /* 1: the first addition. */
    s += panel(X, 8, W, 160);
    s += tg(X + 12, 28, '1 · the first CH₃ adds to the ester', null, 'start');
    s += attack(8, 'Et', 'OEt');

    /* 2: collapse, and ethoxide leaves. */
    s += panel(X, 178, W, 176);
    s += tg(X + 12, 198, '2 · ethoxide leaves: now a ketone', null, 'start');
    {
      const T = 178;
      const c = P(170, T + 110), O = P(170, T + 64), me = P(122, T + 110), et = P(170, T + 154), oe = P(222, T + 110);
      s += B(c, O, 16, 16) + hiB(c, me, 16, 17) + B(c, et, 16, 15) + B(c, oe, 16, 17);
      s += A(O, 'O', { r: 16 }) + A(me, 'CH₃', { r: 17, kind: 'hi' }) + A(et, 'Et') + A(oe, 'OEt', { r: 17, kind: 'warn' });
      s += A(c, 'C', { kind: 'hi' });
      s += lp(O, 90) + lp(O, 180) + lp(O, 0);
      s += charge(at(O, 45, 28), '−');
      s += tg(O.x + 42, O.y + 4, '⁺MgBr', null, 'start');
      s += curve(P(O.x - 25, O.y + 7), P(c.x - 7, c.y - 22), { bow: 12, size: 7 });
      s += curve(P(mid(c, oe).x, mid(c, oe).y + 7), P(oe.x - 4, oe.y + 20), { bow: 12, size: 7 });
      s += tg(oe.x + 10, oe.y + 44, 'EtO⁻ leaves', 'warn');
    }

    /* 3: the ketone meets a second equivalent. */
    s += panel(X, 364, W, 160);
    s += tg(X + 12, 384, '3 · a second CH₃ adds to the ketone', null, 'start');
    s += attack(364, 'Et', 'CH₃', { hi2: true, kc: 'warn' });

    /* 4: the product, after workup. */
    s += panel(X, 534, W, 154);
    s += tg(X + 12, 554, '4 · then H₃O⁺', null, 'start');
    {
      const T = 534;
      const c = P(204, T + 90), oh = P(204, T + 46), me1 = P(156, T + 90), et = P(204, T + 134), me2 = P(252, T + 90);
      s += B(c, oh, 16, 16) + hiB(c, me1, 16, 17) + B(c, et, 16, 15) + hiB(c, me2, 16, 17);
      s += A(oh, 'OH', { r: 16 }) + A(me1, 'CH₃', { r: 17, kind: 'hi' }) + A(et, 'Et') + A(me2, 'CH₃', { r: 17, kind: 'hi' });
      s += A(c, 'C');
      s += tg(X + 12, T + 122, 'both CH₃ groups', null, 'start');
      s += tg(X + 12, T + 136, 'came from the reagent', null, 'start');
    }
    return s;
  },
  caption: 'Ethyl propanoate and two CH₃MgBr give 2-methylbutan-2-ol. Panel 2 shows the C–OEt bond that breaks. Follow the two highlighted CH₃ groups into the product.',
});

/* ===================================================== the Weinreb chelate */
FIGURES.push({
  id: 'weinreb-chelate',
  section: 'grignard-reagents',
  anchor: 'is <b>chelated</b>.</p>',
  alt: 'Left: the Weinreb amide of propanoic acid, an ethyl group on a C=O carbon whose other bond goes to a nitrogen carrying a methyl and a methoxy group, meeting CH3MgBr. Middle: the chelate. The old carbonyl carbon now carries ethyl, the new methyl, an oxygen bonded to magnesium, and the nitrogen. The methoxy oxygen shares a lone pair with the same magnesium (dashed line). The five ring atoms, carbon, oxygen, magnesium, oxygen and nitrogen, are numbered 1 to 5. Right: after H3O+ the ring opens and butan-2-one is released.',
  viewBox: '0 0 700 300',
  build() {
    let s = '';
    /* Left: the Weinreb amide. */
    s += panel(12, 30, 206, 240);
    {
      const c = P(90, 150), O = P(90, 106), et = P(46, 176), n = P(138, 176);
      const nMe = P(138, 224), oMe = P(184, 150), me = P(184, 104);
      s += dbl(c, O, 16, 15) + B(c, et, 16, 15) + B(c, n, 16, 15) + B(n, nMe, 15, 17) + B(n, oMe, 15, 15) + B(oMe, me, 15, 17);
      s += A(O, 'O') + A(et, 'Et') + A(n, 'N') + A(nMe, 'CH₃', { r: 17 }) + A(oMe, 'O', { kind: 'hi' }) + A(me, 'CH₃', { r: 17 });
      s += A(c, 'C', { kind: 'hi' });
      s += tg(115, 56, 'Weinreb amide');
      s += tg(115, 258, '+ CH₃MgBr');
    }
    s += arrow(P(226, 150), P(262, 150), { size: 8 });

    /* Middle: the chelate ring, a regular pentagon. */
    s += panel(270, 12, 250, 276, { kind: 'hi' });
    {
      const cx = 400, cy = 150, R = 50;
      const pts = [90, 162, 234, 306, 18].map((d) => at(P(cx, cy), d, R));
      /* pts: 0 top = Mg, 1 upper-left = O (alkoxide), 2 lower-left = C,
         3 lower-right = N, 4 upper-right = O (methoxy). */
      const [mg, oA, c, n, oM] = pts;
      s += B(mg, oA, 18, 15) + B(oA, c, 15, 16) + B(c, n, 16, 15) + B(n, oM, 15, 15);
      s += dative(oM, mg, 15, 18);
      const br = at(mg, 90, 50), et = at(c, 196, 50), me = at(c, 266, 50);
      const nMe = at(n, 300, 48), oMeC = at(oM, 10, 48);
      s += B(mg, br, 18, 16) + B(c, et, 16, 15) + hiB(c, me, 16, 17) + B(n, nMe, 15, 17) + B(oM, oMeC, 15, 17);
      s += A(br, 'Br') + A(et, 'Et') + A(me, 'CH₃', { r: 17, kind: 'hi' }) + A(nMe, 'CH₃', { r: 17 }) + A(oMeC, 'CH₃', { r: 17 });
      s += A(mg, 'Mg', { r: 18 }) + A(oA, 'O') + A(c, 'C', { kind: 'hi' }) + A(n, 'N') + A(oM, 'O', { kind: 'hi' });
      /* Ring numbers, inside the ring. */
      const ctr = P(cx, cy);
      [c, oA, mg, oM, n].forEach((p, i) => {
        const q = mid(p, ctr, 0.5);
        s += tg(q.x, q.y + 4, String(i + 1), 'good');
      });
      s += tg(cx, 38, 'five-membered chelate');
      s += tg(cx, 276, 'stable until water is added');
    }
    s += arrow(P(528, 150), P(578, 150), { size: 8 });
    s += tg(553, 138, 'H₃O⁺');

    /* Right: the ketone. */
    {
      const c = P(636, 170), O = P(636, 126), et = at(c, 215, 44), me = at(c, 325, 44);
      s += dbl(c, O, 16, 15) + B(c, et, 16, 15) + hiB(c, me, 16, 17);
      s += A(O, 'O') + A(et, 'Et') + A(me, 'CH₃', { r: 17, kind: 'hi' }) + A(c, 'C', { kind: 'hi' });
      s += tg(640, 240, 'butan-2-one');
    }
    return s;
  },
  caption: 'The Weinreb amide of propanoic acid with CH₃MgBr. The numbers trace the chelate ring (shaded), and the dashed line is the methoxy oxygen&rsquo;s lone pair on the magnesium.',
});

/* ================================================= opening an epoxide */
function epoxideRing(o, c1, c2, l1, l2, o2 = {}) {
  let s = B(o, c1, 15, 17) + B(o, c2, 15, 17) + B(c1, c2, 17, 17);
  s += A(o, 'O') + A(c1, l1, { r: 17, kind: 'hi' }) + A(c2, l2, { r: 17, kind: o2.k2 });
  s += lp(o, 125) + lp(o, 55);
  return s;
}

FIGURES.push({
  id: 'epoxide-two-carbons',
  section: 'grignard-reagents',
  lessons: ['grignard-reagents'],
  anchor: 'slowly and cold.</p>\n</div>',
  alt: 'Two stacked panels. Top: R–MgBr attacks a CH2 carbon of ethylene oxide from the side opposite the ring oxygen; one curved arrow runs from the C–Mg bond to that carbon and a second from the C–O bond onto oxygen. After H3O+ the product is R–CH2–CH2–OH, with the new C–C bond highlighted and the OH two carbons from it. Bottom: 2-methyloxirane, where the reagent attacks the CH2 end, labeled less hindered, and not the CH that carries the methyl. The product is R–CH2–CH(OH)–CH3.',
  viewBox: '0 0 340 552',
  build() {
    let s = '';
    const X = 12, W = 316;
    /* Top: ethylene oxide. */
    s += panel(X, 8, W, 246);
    {
      const o = P(170, 52), c1 = P(142, 100), c2 = P(198, 100);
      s += epoxideRing(o, c1, c2, 'CH₂', 'CH₂');
      /* The nucleophile comes in opposite the C1–O bond, i.e. down and left. */
      const r = at(c1, 240, 62), mg = at(r, 180, 56);
      s += B(r, mg, 15, 22) + A(mg, 'MgBr', { r: 22 }) + A(r, 'R', { kind: 'hi' });
      s += curve(mid(r, mg, 0.4), P(c1.x - 12, c1.y + 12), { bow: -22, size: 7 });
      s += curve(mid(c1, o, 0.5), P(o.x - 18, o.y + 2), { bow: -12, size: 7 });
      s += tg(236, 150, 'attack opposite', null, 'start');
      s += tg(236, 164, 'the C–O bond', null, 'start');
      s += arrow(P(170, 170), P(170, 196), { size: 7 });
      s += tg(180, 188, 'then H₃O⁺', null, 'start');
      const y = 222, p1 = P(56, y), p2 = P(116, y), p3 = P(176, y), p4 = P(236, y);
      s += hiB(p1, p2, 15, 17) + B(p2, p3, 17, 17) + B(p3, p4, 17, 16);
      s += A(p1, 'R', { kind: 'hi' }) + A(p2, 'CH₂', { r: 17, kind: 'hi' }) + A(p3, 'CH₂', { r: 17 }) + A(p4, 'OH', { r: 16 });
      s += tg(270, y + 4, '2 new C', null, 'start');
    }
    /* Bottom: 2-methyloxirane. */
    s += panel(X, 266, W, 278);
    {
      const o = P(170, 310), c1 = P(142, 358), c2 = P(198, 358), me = at(c2, 330, 50);
      s += B(c2, me, 17, 17) + A(me, 'CH₃', { r: 17 });
      s += epoxideRing(o, c1, c2, 'CH₂', 'CH', { k2: 'warn' });
      const r = at(c1, 240, 62), mg = at(r, 180, 56);
      s += B(r, mg, 15, 22) + A(mg, 'MgBr', { r: 22 }) + A(r, 'R', { kind: 'hi' });
      s += curve(mid(r, mg, 0.4), P(c1.x - 12, c1.y + 12), { bow: -22, size: 7 });
      s += curve(mid(c1, o, 0.5), P(o.x - 18, o.y + 2), { bow: -12, size: 7 });
      s += tg(40, 302, 'less hindered:', 'good', 'start');
      s += tg(40, 316, 'attacked', 'good', 'start');
      s += tg(300, 310, 'more hindered', 'warn', 'end');
      s += arrow(P(170, 428), P(170, 454), { size: 7 });
      s += tg(180, 446, 'then H₃O⁺', null, 'start');
      const y = 480, p1 = P(56, y), p2 = P(116, y), p3 = P(176, y), p4 = P(236, y), oh = P(176, y + 42);
      s += hiB(p1, p2, 15, 17) + B(p2, p3, 17, 17) + B(p3, p4, 17, 17) + B(p3, oh, 17, 16);
      s += A(p1, 'R', { kind: 'hi' }) + A(p2, 'CH₂', { r: 17, kind: 'hi' }) + A(p4, 'CH₃', { r: 17 });
      s += A(p3, 'CH', { r: 17, kind: 'warn' }) + A(oh, 'OH', { r: 16 });
    }
    return s;
  },
  caption: 'Top: ethylene oxide. Bottom: 2-methyloxirane. In both, the reagent approaches the ring carbon from the side opposite the C–O bond that breaks. For R = propyl the products are pentan-1-ol and hexan-2-ol.',
});


/* ============================================ the acidic proton wins */
FIGURES.push({
  id: 'acidic-h-first',
  section: 'grignard-reagents',
  lessons: ['grignard-reagents'],
  anchor: 'explained why the proton wins.</p>',
  alt: '4-hydroxybutan-2-one drawn atom by atom: H–O–CH2–CH2–C(=O)–CH3. The O–H hydrogen is highlighted and labeled "CH3MgBr takes this H first". The ketone C=O is labeled "never reached". Below, the result: methane, CH4, and the magnesium alkoxide, with the ketone unchanged.',
  viewBox: '0 0 340 250',
  build() {
    let s = '';
    const y = 110;
    const h = P(22, y), o = P(66, y), c1 = P(118, y), c2 = P(172, y), c3 = P(226, y), me = P(284, y), O = P(226, y - 46);
    s += B(h, o, 12, 15) + B(o, c1, 15, 17) + B(c1, c2, 17, 17) + B(c2, c3, 17, 16) + B(c3, me, 16, 17) + dbl(c3, O, 16, 15);
    s += A(h, 'H', { r: 12, kind: 'warn' }) + A(o, 'O') + A(c1, 'CH₂', { r: 17 }) + A(c2, 'CH₂', { r: 17 });
    s += A(c3, 'C', { kind: 'hi' }) + A(me, 'CH₃', { r: 17 }) + A(O, 'O');
    s += lp(o, 90) + lp(o, 270);
    s += lp(O, 150) + lp(O, 30);
    s += tg(14, 60, 'CH₃MgBr takes', 'warn', 'start');
    s += tg(14, 74, 'this H first', 'warn', 'start');
    s += tg(290, 80, 'never reached');
    s += arrow(P(170, 146), P(170, 176), { size: 7 });
    s += tg(180, 166, 'CH₃MgBr', null, 'start');
    s += lbl(170, 206, 'CH₄  +  ⁻O–CH₂CH₂–CO–CH₃  ⁺MgBr');
    s += tg(170, 236, 'the ketone is untouched');
    return s;
  },
  caption: '4-Hydroxybutan-2-one with one equivalent of CH₃MgBr. Workup would simply return the starting material.',
});

/* ======================================== lesson: the four electrophiles */
FIGURES.push({
  id: 'l-sort-substrates',
  lessons: ['grignard-reagents'],
  alt: 'Four carbonyl compounds in a two-by-two grid, each with its carbonyl carbon highlighted: formaldehyde (two hydrogens), propanal (a hydrogen and an ethyl), propanone (two methyls) and ethyl propanoate (an ethyl and an ethoxy group).',
  viewBox: '0 0 340 314',
  build() {
    let s = '';
    const cells = [
      { c: P(85, 66), g: ['H', 'H'], n: 'formaldehyde' },
      { c: P(255, 66), g: ['H', 'Et'], n: 'propanal' },
      { c: P(85, 212), g: ['CH₃', 'CH₃'], n: 'propanone' },
      { c: P(255, 212), g: ['Et', 'OEt'], n: 'ethyl propanoate' },
    ];
    for (const k of cells) {
      const rr = (g) => (g.length > 2 ? 17 : g.length > 1 ? 15 : 13);
      s += carbonyl(k.c, k.g[0], k.g[1], { r1: rr(k.g[0]), r2: rr(k.g[1]) });
      s += tg(k.c.x, k.c.y + 66, k.n);
    }
    s += tg(170, 304, 'Et = CH₂CH₃');
    return s;
  },
  caption: 'The four electrophiles in the sort. The highlighted carbon is the one the Grignard attacks.',
});

export default FIGURES;
