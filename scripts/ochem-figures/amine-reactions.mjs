/* Figures for the amine-reactions notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   The page is about one lone pair and three ways of controlling it, so the
   figures follow the same order: the alkylation that runs away, the imide
   that cannot, the acylation that switches itself off, the reductive
   amination that builds one bond on purpose, and what nitrous acid does to
   each class of amine. Lesson copies (id prefix l-) are 340 wide and stacked. */
import { atom, bond, arrow, curve, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';
import { ringDouble, polyPts } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- helpers */

/* A point `len` from c, at a screen angle in degrees (0 right, 90 down). */
const at = (c, deg, len) => {
  const a = (deg * Math.PI) / 180;
  return P(c.x + Math.cos(a) * len, c.y + Math.sin(a) * len);
};

/* An ethyl arm drawn skeletally from an atom disc: N–C1 along `deg`, then
   C1–C2 turned 60 degrees toward the horizontal, the way a zigzag runs. */
function ethylArm(c, deg, r = 16) {
  const c1 = at(c, deg, 42);
  const opts = [deg - 60, deg + 60];
  const horiz = (d) => Math.abs(Math.cos((d * Math.PI) / 180));
  const d2 = horiz(opts[0]) >= horiz(opts[1]) ? opts[0] : opts[1];
  const c2 = at(c1, d2, 28);
  return bond(c, c1, { rFrom: r, rTo: 0 }) + bond(c1, c2, { rFrom: 0, rTo: 0 });
}

/* The four amines of the ethyl series, nitrogen at c. */
function ethylAmine(c, degree) {
  let s = '';
  if (degree === 1) {
    s += ethylArm(c, 180, 17);
    s += atom(c.x, c.y, 'NH₂', { kind: 'hi', r: 17 });
    s += lonePair(c.x, c.y, 270, { dist: 23 });
  } else if (degree === 2) {
    s += ethylArm(c, 150) + ethylArm(c, 30);
    s += atom(c.x, c.y, 'NH', { kind: 'hi' });
    s += lonePair(c.x, c.y, 270, { dist: 22 });
  } else if (degree === 3) {
    s += ethylArm(c, 210) + ethylArm(c, 330) + ethylArm(c, 90);
    s += atom(c.x, c.y, 'N', { kind: 'hi' });
    s += lonePair(c.x, c.y, 270, { dist: 22 });
  } else {
    s += ethylArm(c, 45) + ethylArm(c, 135) + ethylArm(c, 225) + ethylArm(c, 315);
    s += atom(c.x, c.y, 'N⁺', { kind: 'warn' });
  }
  return s;
}

/* A hexagon with its vertex 0 at screen angle `start`, numbered clockwise. */
function hexKit(R, start = 0) {
  const V = (cx, cy) => Array.from({ length: 6 }, (_, i) => at(P(cx, cy), start + i * 60, R));
  const out = (cx, cy, i, d) => at(P(cx, cy), start + i * 60, R + d);
  const ring = (cx, cy, doubles) => {
    const v = V(cx, cy), mid = P(cx, cy);
    let g = '';
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      g += doubles.includes(i) ? ringDouble(v[i], v[j], mid, { inset: 6, gap: 4 }) : bond(v[i], v[j], { rFrom: 0, rTo: 0 });
    }
    return g;
  };
  return { V, out, ring };
}

/* -------------------------------------------------- alkylation runaway --- */

/* Row one of the notes figure: the first SN2, drawn atom by atom. */
function firstAlkylation(y) {
  let s = '';
  /* ethylamine */
  const me = P(46, y), ch2 = P(98, y), n = P(150, y);
  s += bond(me, ch2) + bond(ch2, n, { rTo: 16 });
  s += atom(me.x, me.y, 'CH₃'); s += atom(ch2.x, ch2.y, 'CH₂');
  const hU = P(150, y - 42), hD = P(150, y + 42);
  s += bond(n, hU, { rFrom: 16, rTo: 10 }) + bond(n, hD, { rFrom: 16, rTo: 10 });
  s += atom(hU.x, hU.y, 'H', { r: 10 }); s += atom(hD.x, hD.y, 'H', { r: 10 });
  s += atom(n.x, n.y, 'N', { kind: 'hi' });
  s += lonePair(n.x, n.y, 0, { dist: 22 });
  /* bromoethane */
  const c = P(244, y), cm = P(244, y - 50), br = P(300, y);
  s += bond(c, cm) + bond(c, br, { rTo: 16 });
  s += atom(cm.x, cm.y, 'CH₃');
  s += atom(c.x, c.y, 'CH₂', { kind: 'hi' });
  s += atom(br.x, br.y, 'Br', { kind: 'warn' });
  s += curve(P(177, y - 4), P(226, y - 6), { bow: -16 });
  s += curve(P(272, y + 3), P(296, y + 18), { bow: 12, size: 7 });
  s += tag(172, y + 76, '1 · the N lone pair attacks the carbon;');
  s += tag(172, y + 92, 'bromide leaves with the C–Br electrons');

  s += arrow(P(334, y), P(384, y));
  s += tag(359, y - 10, 'SN2');

  /* the ammonium salt */
  const a = P(414, y), b = P(464, y), nn = P(514, y), d = P(564, y), e = P(614, y);
  s += bond(a, b) + bond(b, nn, { rTo: 16 }) + bond(nn, d, { rFrom: 16 }) + bond(d, e);
  s += atom(a.x, a.y, 'CH₃'); s += atom(b.x, b.y, 'CH₂');
  s += atom(d.x, d.y, 'CH₂', { kind: 'hi' }); s += atom(e.x, e.y, 'CH₃');
  const h1 = P(514, y - 42), h2 = P(514, y + 42);
  s += bond(nn, h1, { rFrom: 16, rTo: 10 }) + bond(nn, h2, { rFrom: 16, rTo: 10 });
  s += atom(h1.x, h1.y, 'H', { r: 10 }); s += atom(h2.x, h2.y, 'H', { r: 10 });
  s += atom(nn.x, nn.y, 'N⁺', { kind: 'warn' });
  s += label(676, y + 5, 'Br⁻');
  s += tag(540, y + 76, '2 · another ethylamine takes an N–H proton,');
  s += tag(540, y + 92, 'which leaves diethylamine, (CH₃CH₂)₂NH');
  return s;
}

FIGURES.push({
  id: 'alkylation-runaway',
  section: 'amine-reactions',
  anchor: 'difficult to separate and wasteful of material.</p>',
  viewBox: '0 0 760 420',
  alt: 'Top row: the nitrogen lone pair of ethylamine attacks the CH2 carbon of bromoethane while bromide leaves, giving diethylammonium bromide; a second ethylamine then removes an N–H proton to give diethylamine. Bottom row: ethylamine, diethylamine, triethylamine and the tetraethylammonium ion, each made from the one before by another bromoethane. The first three keep a lone pair on nitrogen; the last has four ethyl groups, a positive charge and no lone pair.',
  build() {
    let s = '';
    s += firstAlkylation(96);
    s += rule(24, 206, 736, 206);
    s += tag(380, 232, '3 · each product still has its lone pair, so it attacks CH₃CH₂Br again');
    const y = 300, xs = [92, 290, 488, 676];
    s += ethylAmine(P(xs[0], y), 1);
    s += ethylAmine(P(xs[1], y), 2);
    s += ethylAmine(P(xs[2], y), 3);
    s += ethylAmine(P(xs[3], y), 4);
    for (let i = 0; i < 3; i++) {
      const x1 = xs[i] + (i === 0 ? 30 : 64), x2 = xs[i + 1] - (i === 2 ? 66 : 64);
      s += arrow(P(x1, y), P(x2, y));
      s += tag((x1 + x2) / 2, y - 12, i === 0 ? '+ CH₃CH₂Br' : '+ again');
    }
    s += tag(xs[0] - 10, y + 72, 'primary');
    s += tag(xs[1], y + 72, 'secondary');
    s += tag(xs[2], y + 72, 'tertiary');
    s += label(xs[3], y - 40, 'Br⁻');
    s += text(xs[3], y + 72, 'quaternary salt:', { cls: 'fg-tag-warn', size: 11 });
    s += text(xs[3], y + 88, 'no lone pair, so it stops', { cls: 'fg-tag-warn', size: 11 });
    s += tag(380, 408, 'each zigzag arm is an ethyl group, CH₃CH₂');
    return s;
  },
  caption: 'Follow the nitrogen. It gains one ethyl group per bromoethane and keeps its lone pair until the fourth arrives.',
});

FIGURES.push({
  id: 'l-alkylation-chain',
  lessons: ['amine-reactions'],
  viewBox: '0 0 340 372',
  alt: 'Ethylamine gives diethylamine, then triethylamine, then the tetraethylammonium ion, each step adding one ethyl group from bromoethane. The first three keep a lone pair on nitrogen; the last has none.',
  build() {
    let s = '';
    const A = P(84, 88), B = P(262, 88), C = P(262, 244), D = P(76, 244);
    s += ethylAmine(A, 1); s += ethylAmine(B, 2); s += ethylAmine(C, 3); s += ethylAmine(D, 4);
    s += arrow(P(112, 88), P(194, 88));
    s += tag(153, 76, '+ CH₃CH₂Br');
    s += arrow(P(262, 124), P(262, 200));
    s += tag(254, 166, '+ again', { anchor: 'end' });
    s += arrow(P(198, 244), P(146, 244));
    s += tag(172, 232, '+ again');
    s += tag(70, 140, 'primary');
    s += tag(274, 148, 'secondary', { anchor: 'start' });
    s += tag(262, 330, 'tertiary');
    s += text(76, 312, 'quaternary:', { cls: 'fg-tag-warn', size: 11 });
    s += text(76, 328, 'no lone pair', { cls: 'fg-tag-warn', size: 11 });
    s += tag(170, 362, 'each zigzag arm is CH₃CH₂');
    return s;
  },
  caption: 'Each amine in the chain attacks the next bromoethane.',
});

/* ------------------------------------------------------- phthalimide --- */

/* Phthalimide drawn skeletally: benzene fused to a five-membered ring whose
   nitrogen sits between two C=O carbons. Returns the svg and the N position. */
function phthalimide(cx, cy) {
  const r = 26;
  const v = polyPts(cx, cy, 6, r, 30);        // v[0] upper right, v[5] lower right
  let s = '';
  const mid = P(cx, cy);
  for (let i = 0; i < 6; i++) {
    const a = v[i], b = v[(i + 1) % 6];
    s += (i % 2 === 1) ? ringDouble(a, b, mid, { inset: 6, gap: 4 }) : bond(a, b, { rFrom: 0, rTo: 0 });
  }
  const pc = P(cx + 22.5 + 17.9, cy);
  const ca = P(pc.x + 6.8, cy - 21), cb = P(pc.x + 6.8, cy + 21), n = P(pc.x + 22.1, cy);
  const oa = P(ca.x + 9.2, ca.y - 28.5), ob = P(cb.x + 9.2, cb.y + 28.5);
  s += bond(v[0], ca, { rFrom: 0, rTo: 0 }) + bond(v[5], cb, { rFrom: 0, rTo: 0 });
  s += bond(ca, n, { rFrom: 0, rTo: 14 }) + bond(cb, n, { rFrom: 0, rTo: 14 });
  s += bond(ca, oa, { rFrom: 0, rTo: 13, order: 2, gap: 3 }) + bond(cb, ob, { rFrom: 0, rTo: 13, order: 2, gap: 3 });
  s += atom(oa.x, oa.y, 'O', { r: 13 }); s += atom(ob.x, ob.y, 'O', { r: 13 });
  s += atom(n.x, n.y, 'N', { kind: 'hi', r: 14 });
  return { s, n };
}

FIGURES.push({
  id: 'phthalimide-once',
  section: 'amine-reactions',
  anchor: 'so it cannot be alkylated a second time.</p>',
  viewBox: '0 0 760 250',
  alt: 'Left: phthalimide, a benzene ring fused to a five-membered ring in which the N–H nitrogen sits between two C=O groups. An arrow labeled KOH, then bromoethane leads to N-ethylphthalimide on the right, where the nitrogen carries an ethyl group and no hydrogen.',
  build() {
    let s = '';
    const L = phthalimide(96, 118);
    s += L.s;
    const h = P(L.n.x + 38, L.n.y);
    s += bond(L.n, h, { rFrom: 14, rTo: 10 });
    s += atom(h.x, h.y, 'H', { kind: 'warn', r: 10 });
    s += tag(140, 196, 'phthalimide: its N–H sits between');
    s += tag(140, 212, 'two C=O groups, so KOH removes it');

    s += arrow(P(262, 118), P(392, 118));
    s += tag(327, 104, 'KOH, then');
    s += tag(327, 140, 'CH₃CH₂Br (SN2)');

    const R = phthalimide(470, 118);
    s += R.s;
    const c1 = P(R.n.x + 40, R.n.y), c2 = at(c1, -60, 28);
    s += bond(R.n, c1, { rFrom: 14, rTo: 0, cls: 'fg-bond-hi' }) + bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += text(560, 196, 'no N–H left, and the lone pair is shared', { cls: 'fg-tag-good', size: 11 });
    s += text(560, 212, 'with both C=O groups: it cannot attack again', { cls: 'fg-tag-good', size: 11 });
    s += tag(c2.x + 8, c2.y - 10, 'ethyl', { anchor: 'start' });
    return s;
  },
  caption: 'The new C–N bond is highlighted. The nitrogen that made it is an imide nitrogen, not an amine.',
});

/* --------------------------------------------------------- acylation --- */

/* Acetyl-group pieces reused by several panels. `o` is 'dbl' for C=O with two
   lone pairs, 'neg' for C–O⁻ with three. */
function acylCore(c, oKind = 'dbl') {
  let s = '';
  const O = P(c.x, c.y - 48), me = P(c.x - 44, c.y + 26);
  s += bond(c, O, { order: oKind === 'neg' ? 1 : 2, rTo: 15 });
  s += bond(c, me);
  s += atom(me.x, me.y, 'CH₃');
  if (oKind === 'neg') {
    s += atom(O.x, O.y, 'O⁻', { kind: 'warn' });
    s += lonePair(O.x, O.y, 180, { dist: 21 }); s += lonePair(O.x, O.y, 270, { dist: 21 }); s += lonePair(O.x, O.y, 0, { dist: 21 });
  } else {
    s += atom(O.x, O.y, 'O');
    s += lonePair(O.x, O.y, 200, { dist: 21 }); s += lonePair(O.x, O.y, 340, { dist: 21 });
  }
  return { s, O };
}

/* The nitrogen of the acylated amine with its ethyl ("Et") and H. */
function amideN(n, lbl, kind) {
  let s = '';
  const et = P(n.x + 44, n.y - 26), h = P(n.x, n.y + 46);
  s += bond(n, et, { rFrom: 16 }) + bond(n, h, { rFrom: 16, rTo: 10 });
  s += atom(et.x, et.y, 'Et');
  s += atom(h.x, h.y, 'H', { r: 10 });
  s += atom(n.x, n.y, lbl, { kind });
  return { s, h };
}

FIGURES.push({
  id: 'amine-acylation-mechanism',
  section: 'amine-reactions',
  anchor: '<p class="step-body">Ethylamine and acetyl chloride give <b>N-ethylacetamide</b>',
  viewBox: '0 0 760 452',
  alt: 'Panel 1: the nitrogen lone pair of ethylamine attacks the carbonyl carbon of acetyl chloride and the C=O pi electrons move onto oxygen. Panel 2: in the tetrahedral intermediate an oxygen lone pair moves back down to re-form C=O and chloride leaves. Panel 3: triethylamine removes the proton from the positively charged nitrogen. Panel 4: N-ethylacetamide drawn as two resonance contributors, one neutral and one with O minus and a C=N plus double bond, showing the nitrogen lone pair shared with the carbonyl.',
  build() {
    let s = '';
    s += panel(14, 10, 356, 204); s += panel(390, 10, 356, 204);
    s += panel(14, 234, 256, 208); s += panel(290, 234, 456, 208, { kind: 'good' });

    /* 1 - the lone pair adds */
    s += tag(192, 34, '1 · the N lone pair adds to the C=O carbon');
    {
      const n = P(78, 132), et = P(40, 108), h = P(78, 176);
      s += bond(n, et, { rFrom: 16 }) + bond(n, h, { rFrom: 16, rTo: 10 });
      s += atom(et.x, et.y, 'Et'); s += atom(h.x, h.y, 'H', { r: 10 });
      const h2 = P(40, 158);
      s += bond(n, h2, { rFrom: 16, rTo: 10 }); s += atom(h2.x, h2.y, 'H', { r: 10 });
      s += atom(n.x, n.y, 'N', { kind: 'hi' });
      s += lonePair(n.x, n.y, 0, { dist: 22 });
      const c = P(236, 140);
      const k = acylCore(c, 'dbl'); s += k.s;
      const cl = P(c.x + 44, c.y + 26);
      s += bond(c, cl, { rTo: 16 }); s += atom(cl.x, cl.y, 'Cl', { kind: 'warn' });
      s += atom(c.x, c.y, 'C', { kind: 'hi' });
      s += curve(P(105, 128), P(218, 136), { bow: -20 });
      s += curve(P(241, 114), P(254, 96), { bow: -10, size: 7 });
    }

    /* 2 - C=O re-forms, chloride leaves */
    s += tag(568, 34, '2 · the C=O re-forms and Cl⁻ leaves');
    {
      const c = P(596, 140);
      const k = acylCore(c, 'neg'); s += k.s;
      const n = P(536, 116), cl = P(648, 166);
      s += bond(c, n, { rTo: 16 }); s += bond(c, cl, { rTo: 16 });
      const et = P(494, 90), h1 = P(500, 142), h2 = P(544, 70);
      s += bond(n, et, { rFrom: 16 }) + bond(n, h1, { rFrom: 16, rTo: 10 }) + bond(n, h2, { rFrom: 16, rTo: 10 });
      s += atom(et.x, et.y, 'Et'); s += atom(h1.x, h1.y, 'H', { r: 10 }); s += atom(h2.x, h2.y, 'H', { r: 10 });
      s += atom(n.x, n.y, 'N⁺', { kind: 'warn' });
      s += atom(cl.x, cl.y, 'Cl', { kind: 'warn' });
      s += atom(c.x, c.y, 'C', { kind: 'hi' });
      s += curve(P(574, 90), P(590, 114), { bow: 12, size: 7 });
      s += curve(P(620, 158), P(639, 180), { bow: 10, size: 7 });
    }

    /* 3 - the base takes the proton */
    s += tag(142, 258, '3 · Et₃N takes the N–H proton');
    {
      const c = P(94, 348);
      const k = acylCore(c, 'dbl'); s += k.s;
      const n = P(146, 374);
      s += bond(c, n, { rTo: 16 });
      const h2 = P(138, 326);
      s += bond(n, h2, { rFrom: 16, rTo: 10 }); s += atom(h2.x, h2.y, 'H', { r: 10 });
      const a = amideN(n, 'N⁺', 'warn'); s += a.s;
      s += atom(c.x, c.y, 'C', { kind: 'hi' });
      s += label(56, 424, 'Et₃N');
      s += lonePair(56, 419, 0, { dist: 27 });
      s += curve(P(88, 414), P(133, 414), { bow: -10, size: 7 });
      s += curve(P(153, 400), P(163, 386), { bow: -8, size: 7 });
      s += tag(222, 424, 'Cl⁻');
    }

    /* 4 - the amide, drawn as two contributors */
    s += text(518, 258, '4 · N-ethylacetamide: the lone pair is shared with the C=O', { cls: 'fg-tag-good', size: 11 });
    {
      const c = P(380, 348);
      const k = acylCore(c, 'dbl'); s += k.s;
      const n = P(432, 374);
      s += bond(c, n, { rTo: 16 });
      const a = amideN(n, 'N', 'hi'); s += a.s;
      s += lonePair(n.x, n.y, 150, { dist: 22 });
      s += atom(c.x, c.y, 'C', { kind: 'hi' });
      s += curve(P(410, 390), P(404, 364), { bow: 10, size: 7 });
      s += curve(P(385, 324), P(397, 306), { bow: -10, size: 7 });

      s += arrow(P(500, 348), P(546, 348)); s += arrow(P(546, 348), P(500, 348));

      const c2 = P(612, 348);
      const k2 = acylCore(c2, 'neg'); s += k2.s;
      const n2 = P(664, 374);
      s += bond(c2, n2, { rTo: 16, order: 2 });
      const a2 = amideN(n2, 'N⁺', 'warn'); s += a2.s;
      s += atom(c2.x, c2.y, 'C', { kind: 'hi' });
    }
    return s;
  },
  caption: 'Ethylamine and acetyl chloride (Et is an ethyl group, CH<sub>3</sub>CH<sub>2</sub>). Panels 1 to 3 are the addition&ndash;elimination of nucleophilic acyl substitution: the carbon goes tetrahedral before chloride leaves. Panel 4 shows why the product stops there.',
});

FIGURES.push({
  id: 'l-amide-lone-pair',
  lessons: ['amine-reactions'],
  viewBox: '0 0 340 480',
  alt: 'Ethylamine plus acetyl chloride gives N-ethylacetamide and HCl, which the base takes. N-ethylacetamide is drawn as two resonance contributors, one above the other: the nitrogen lone pair moves into the C–N bond and the C=O pi electrons move onto oxygen, giving O minus and C=N plus.',
  build() {
    let s = '';
    s += label(170, 28, 'EtNH₂ + CH₃COCl → amide + HCl');
    s += tag(170, 48, 'Et = CH₃CH₂; a base takes the HCl');
    const c = P(120, 150);
    const k = acylCore(c, 'dbl'); s += k.s;
    const n = P(172, 176);
    s += bond(c, n, { rTo: 16 });
    const a = amideN(n, 'N', 'hi'); s += a.s;
    s += lonePair(n.x, n.y, 150, { dist: 22 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += curve(P(150, 192), P(144, 166), { bow: 10, size: 7 });
    s += curve(P(125, 126), P(137, 108), { bow: -10, size: 7 });
    s += arrow(P(120, 232), P(120, 272)); s += arrow(P(120, 272), P(120, 232));
    const c2 = P(120, 356);
    const k2 = acylCore(c2, 'neg'); s += k2.s;
    const n2 = P(172, 382);
    s += bond(c2, n2, { rTo: 16, order: 2 });
    const a2 = amideN(n2, 'N⁺', 'warn'); s += a2.s;
    s += atom(c2.x, c2.y, 'C', { kind: 'hi' });
    s += tag(170, 454, 'the N lone pair is shared with the C=O,');
    s += tag(170, 470, 'so it cannot attack a second time');
    return s;
  },
  caption: 'Top: N-ethylacetamide. Bottom: the same molecule with the nitrogen lone pair drawn in the C=N bond.',
});

/* ------------------------------------------------ reductive amination --- */

function acetone(c) {
  let s = '';
  const O = P(c.x, c.y - 48), a = P(c.x - 44, c.y + 26), b = P(c.x + 44, c.y + 26);
  s += bond(c, O, { order: 2 }) + bond(c, a) + bond(c, b);
  s += atom(O.x, O.y, 'O'); s += lonePair(O.x, O.y, 200, { dist: 21 }); s += lonePair(O.x, O.y, 340, { dist: 21 });
  s += atom(a.x, a.y, 'CH₃'); s += atom(b.x, b.y, 'CH₃');
  s += atom(c.x, c.y, 'C', { kind: 'hi' });
  return s;
}

function methylamine(n) {
  let s = '';
  const m = P(n.x + 50, n.y);
  s += bond(n, m, { rFrom: 17 });
  s += atom(m.x, m.y, 'CH₃');
  s += atom(n.x, n.y, 'H₂N', { kind: 'hi', r: 17 });
  s += lonePair(n.x, n.y, 270, { dist: 23 });
  return s;
}

/* The iminium ion with C on the left and N on the right. With `hydride`, the
   B–H of cyanoborohydride sits above C and the two curved arrows are drawn. */
function iminium(c, hydride) {
  let s = '';
  const a = P(c.x - 44, c.y - 26), b = P(c.x - 44, c.y + 26), n = P(c.x + 54, c.y);
  const h = P(n.x + 26, n.y + 40), m = P(n.x + 44, n.y - 26);
  s += bond(c, a) + bond(c, b) + bond(c, n, { order: 2, rTo: 16 });
  s += bond(n, h, { rFrom: 16, rTo: 10 }) + bond(n, m, { rFrom: 16 });
  s += atom(a.x, a.y, 'CH₃'); s += atom(b.x, b.y, 'CH₃');
  s += atom(h.x, h.y, 'H', { r: 10 }); s += atom(m.x, m.y, 'CH₃');
  s += atom(n.x, n.y, 'N⁺', { kind: 'warn' });
  s += atom(c.x, c.y, 'C', { kind: 'hi' });
  if (hydride) {
    const hh = P(c.x, c.y - 52), bb = P(c.x, c.y - 92);
    s += bond(hh, bb, { rFrom: 10, rTo: 15 });
    s += atom(hh.x, hh.y, 'H', { kind: 'hi', r: 10 });
    s += atom(bb.x, bb.y, 'B⁻', { kind: 'warn' });
    s += tag(bb.x + 22, bb.y + 4, 'from NaBH₃CN', { anchor: 'start' });
    s += curve(P(c.x - 4, c.y - 72), P(c.x - 8, c.y - 18), { bow: 20, size: 7 });
    s += curve(P(c.x + 28, c.y - 5), P(n.x - 8, n.y - 16), { bow: -10, size: 7 });
  }
  return s;
}

/* The product amine, (CH3)2CH–NH–CH3, with the new C–H highlighted. */
function isopropylMethylamine(c) {
  let s = '';
  const hh = P(c.x, c.y - 46), a = P(c.x - 44, c.y - 26), b = P(c.x - 44, c.y + 26), n = P(c.x + 54, c.y);
  const h = P(n.x + 26, n.y + 40), m = P(n.x + 44, n.y - 26);
  s += bond(c, hh, { rTo: 10, cls: 'fg-bond-hi' }) + bond(c, a) + bond(c, b) + bond(c, n, { rTo: 16 });
  s += bond(n, h, { rFrom: 16, rTo: 10 }) + bond(n, m, { rFrom: 16 });
  s += atom(hh.x, hh.y, 'H', { kind: 'hi', r: 10 });
  s += atom(a.x, a.y, 'CH₃'); s += atom(b.x, b.y, 'CH₃');
  s += atom(h.x, h.y, 'H', { r: 10 }); s += atom(m.x, m.y, 'CH₃');
  s += atom(n.x, n.y, 'N', { kind: 'hi' });
  s += lonePair(n.x, n.y, 125, { dist: 22 });
  s += atom(c.x, c.y, 'C', { kind: 'hi' });
  return s;
}

FIGURES.push({
  id: 'iminium-reduction',
  section: 'amine-reactions',
  anchor: 'in the same flask.</p>',
  viewBox: '0 0 760 440',
  alt: 'Top row: acetone plus methylamine, with mild acid and loss of water, gives the iminium ion (CH3)2C=N+H–CH3. Bottom row: a hydride from cyanoborohydride adds to the iminium carbon while the C=N pi electrons move onto nitrogen, giving N-methylpropan-2-amine, (CH3)2CH–NH–CH3, with the new C–H bond highlighted.',
  build() {
    let s = '';
    s += tag(380, 24, '1 · the amine and the ketone condense to an iminium ion');
    s += acetone(P(80, 124));
    s += label(160, 128, '+');
    s += methylamine(P(210, 124));
    s += arrow(P(310, 124), P(420, 124));
    s += tag(365, 112, 'mild acid (H⁺)');
    s += tag(365, 144, '–H₂O');
    s += iminium(P(500, 124), false);
    s += tag(530, 186, 'iminium ion');
    s += rule(24, 206, 736, 206);
    s += tag(380, 228, '2 · hydride adds to the carbon, and the C=N π electrons go to nitrogen');
    s += iminium(P(110, 350), true);
    s += arrow(P(270, 350), P(380, 350));
    s += isopropylMethylamine(P(470, 350));
    s += tag(500, 422, 'N-methylpropan-2-amine');
    s += text(486, 310, 'new C–H', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'Acetone and methylamine with NaBH<sub>3</sub>CN. The nitrogen ends up on the old carbonyl carbon, and the hydrogen on that carbon came from boron.',
});

FIGURES.push({
  id: 'l-reductive-amination',
  lessons: ['amine-reactions'],
  viewBox: '0 0 340 520',
  alt: 'Acetone plus methylamine gives, with acid and loss of water, the iminium ion. Hydride from cyanoborohydride adds to its carbon, giving N-methylpropan-2-amine with the new C–H highlighted.',
  build() {
    let s = '';
    s += acetone(P(62, 82));
    s += label(128, 86, '+');
    s += methylamine(P(176, 86));
    s += arrow(P(150, 128), P(150, 186));
    s += tag(160, 152, 'H⁺, –H₂O', { anchor: 'start' });
    s += iminium(P(110, 316), true);
    s += arrow(P(150, 356), P(150, 412));
    s += tag(160, 390, 'NaBH₃CN', { anchor: 'start' });
    s += isopropylMethylamine(P(110, 470));
    s += text(126, 430, 'new C–H', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'Top to bottom: condense, then reduce the iminium ion.',
});

/* ---------------------------------------------------- nitrous acid --- */

function nitrosonium(n) {
  let s = '';
  const o = P(n.x + 42, n.y);
  s += bond(n, o, { rFrom: 14, rTo: 14, order: 3, gap: 3 });
  s += atom(n.x, n.y, 'N', { kind: 'hi', r: 14 }); s += atom(o.x, o.y, 'O', { r: 14 });
  s += lonePair(n.x, n.y, 180, { dist: 20 }); s += lonePair(o.x, o.y, 0, { dist: 20 });
  s += text(o.x + 20, o.y - 14, '+', { cls: 'fg-warn', size: 14 });
  return s;
}

/* Ar–N⁺≡N with the ring on the left. */
function diazonium(cx, cy, K) {
  let s = '';
  s += K.ring(cx, cy, [1, 3, 5]);
  const v0 = K.V(cx, cy)[0];
  const n1 = P(v0.x + 36, cy), n2 = P(v0.x + 78, cy);
  s += bond(v0, n1, { rFrom: 0, rTo: 14 });
  s += bond(n1, n2, { rFrom: 14, rTo: 14, order: 3, gap: 3 });
  s += atom(n1.x, n1.y, 'N', { kind: 'hi', r: 14 }); s += atom(n2.x, n2.y, 'N', { r: 14 });
  s += text(n1.x, n1.y - 20, '+', { cls: 'fg-warn', size: 14 });
  s += lonePair(n2.x, n2.y, 0, { dist: 20 });
  return s;
}

function aniline(cx, cy, K) {
  let s = '';
  s += K.ring(cx, cy, [1, 3, 5]);
  const v0 = K.V(cx, cy)[0];
  const n = P(v0.x + 40, cy);
  s += bond(v0, n, { rFrom: 0, rTo: 17 });
  s += atom(n.x, n.y, 'NH₂', { kind: 'hi', r: 17 });
  s += lonePair(n.x, n.y, 270, { dist: 23 });
  return s;
}

FIGURES.push({
  id: 'nitrous-acid-outcomes',
  section: 'amine-reactions',
  anchor: 'which is why nitrite levels in cured meat are regulated.</p>',
  viewBox: '0 0 760 420',
  alt: 'Top: NaNO2 and HCl give nitrous acid, which acid turns into the nitrosonium ion, N triple-bonded to O with a positive charge. Below, three columns. A primary aryl amine, aniline, gives the benzenediazonium ion, with C, N and N in a line. A primary alkyl amine gives an alkyl diazonium ion that loses N2 at once to a carbocation. A secondary amine, dimethylamine, gives the N-nitrosamine (CH3)2N–N=O.',
  build() {
    let s = '';
    const K = hexKit(22, 0);
    /* making the electrophile */
    s += label(70, 64, 'NaNO₂ + HCl');
    s += arrow(P(130, 60), P(176, 60));
    {
      const h = P(196, 60), o = P(232, 60), n = P(274, 60), o2 = P(316, 60);
      s += bond(h, o, { rFrom: 10, rTo: 14 }) + bond(o, n, { rFrom: 14, rTo: 14 }) + bond(n, o2, { rFrom: 14, rTo: 14, order: 2, gap: 3 });
      s += atom(h.x, h.y, 'H', { r: 10 }); s += atom(o.x, o.y, 'O', { r: 14 });
      s += atom(n.x, n.y, 'N', { r: 14 }); s += atom(o2.x, o2.y, 'O', { r: 14 });
      s += tag(256, 96, 'nitrous acid');
    }
    s += arrow(P(350, 60), P(440, 60));
    s += tag(395, 48, 'H⁺, –H₂O');
    s += nitrosonium(P(480, 60));
    s += tag(500, 96, 'nitrosonium ion, NO⁺');
    s += tag(474, 114, '↑ the amine N attacks this N', { anchor: 'start' });

    s += panel(14, 120, 236, 290); s += panel(262, 120, 236, 290); s += panel(510, 120, 236, 290);
    s += tag(132, 144, 'primary aryl amine');
    s += tag(380, 144, 'primary alkyl amine');
    s += tag(628, 144, 'secondary amine');

    /* aryl */
    s += aniline(80, 196, K);
    s += arrow(P(132, 232), P(132, 276));
    s += diazonium(66, 316, K);
    s += text(132, 368, 'aryl diazonium ion: kept', { cls: 'fg-tag-good', size: 11 });
    s += text(132, 384, 'cold, it is stable enough to use', { cls: 'fg-tag-good', size: 11 });

    /* alkyl */
    {
      const r = P(336, 196), n = P(386, 196);
      s += bond(r, n, { rTo: 17 });
      s += atom(r.x, r.y, 'R'); s += atom(n.x, n.y, 'NH₂', { kind: 'hi', r: 17 });
      s += lonePair(n.x, n.y, 270, { dist: 23 });
      s += arrow(P(380, 232), P(380, 276));
      const r2 = P(318, 316), n1 = P(360, 316), n2 = P(402, 316);
      s += bond(r2, n1, { rTo: 14 }) + bond(n1, n2, { rFrom: 14, rTo: 14, order: 3, gap: 3 });
      s += atom(r2.x, r2.y, 'R');
      s += atom(n1.x, n1.y, 'N', { kind: 'hi', r: 14 }); s += atom(n2.x, n2.y, 'N', { r: 14 });
      s += text(n1.x, n1.y - 20, '+', { cls: 'fg-warn', size: 14 });
      s += lonePair(n2.x, n2.y, 0, { dist: 20 });
      s += text(380, 368, 'loses N₂ at once, leaving R⁺:', { cls: 'fg-tag-warn', size: 11 });
      s += text(380, 384, 'a mixture of products', { cls: 'fg-tag-warn', size: 11 });
      s += tag(452, 206, 'R = alkyl', { anchor: 'middle' });
    }

    /* secondary */
    {
      const n = P(628, 196), a = P(584, 218), b = P(672, 218);
      s += bond(n, a, { rFrom: 16 }) + bond(n, b, { rFrom: 16 });
      s += atom(a.x, a.y, 'CH₃'); s += atom(b.x, b.y, 'CH₃');
      s += atom(n.x, n.y, 'NH', { kind: 'hi' });
      s += lonePair(n.x, n.y, 270, { dist: 22 });
      s += arrow(P(628, 240), P(628, 276));
      const n1 = P(600, 318), n2 = P(646, 318), o = P(686, 296);
      const a2 = P(560, 296), b2 = P(560, 340);
      s += bond(n1, a2, { rFrom: 16 }) + bond(n1, b2, { rFrom: 16 });
      s += bond(n1, n2, { rFrom: 16, rTo: 14 }) + bond(n2, o, { rFrom: 14, rTo: 14, order: 2, gap: 3 });
      s += atom(a2.x, a2.y, 'CH₃'); s += atom(b2.x, b2.y, 'CH₃');
      s += atom(n1.x, n1.y, 'N', { kind: 'hi' });
      s += atom(n2.x, n2.y, 'N', { r: 14 }); s += atom(o.x, o.y, 'O', { r: 14 });
      s += lonePair(n1.x, n1.y, 285, { dist: 22 });
      s += lonePair(n2.x, n2.y, 90, { dist: 20 });
      s += lonePair(o.x, o.y, 290, { dist: 20 }); s += lonePair(o.x, o.y, 20, { dist: 20 });
      s += text(628, 368, 'N-nitrosamine: no N–H', { cls: 'fg-tag-warn', size: 11 });
      s += text(628, 384, 'left to lose, so it stops', { cls: 'fg-tag-warn', size: 11 });
    }
    return s;
  },
  caption: 'One reagent, three outcomes. In every column the amine nitrogen is the one highlighted, and it ends up bonded to the nitrogen of NO<sup>+</sup>.',
});

FIGURES.push({
  id: 'l-diazonium-ion',
  lessons: ['amine-reactions'],
  viewBox: '0 0 340 250',
  alt: 'Aniline, treated with NaNO2 and HCl at 0 to 5 degrees C, gives the benzenediazonium ion, in which the ring carbon, the positive nitrogen and the end nitrogen lie in a straight line.',
  build() {
    let s = '';
    const K = hexKit(24, 0);
    s += aniline(110, 60, K);
    s += arrow(P(150, 100), P(150, 150));
    s += tag(160, 122, 'NaNO₂, HCl', { anchor: 'start' });
    s += tag(160, 138, '0–5 °C', { anchor: 'start' });
    s += diazonium(96, 190, K);
    s += tag(170, 238, 'benzenediazonium ion: C, N, N in a line');
    return s;
  },
  caption: 'The NH<sub>2</sub> nitrogen becomes the inner, positive nitrogen of the N<sub>2</sub><sup>+</sup> group.',
});

/* ------------------------------------------------ two routes compared --- */

function cyclohexyl(cx, cy, K) {
  let s = '';
  const v = K.V(cx, cy);
  for (let i = 0; i < 6; i++) s += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
  return { s, v0: v[0] };
}

FIGURES.push({
  id: 'two-routes',
  section: 'amine-reactions',
  anchor: '<span class="k">Worked example — two routes to N-ethylcyclohexylamine</span>',
  viewBox: '0 0 760 260',
  alt: 'Cyclohexylamine at the left. The upper arrow, bromoethane, leads to a mixture of secondary, tertiary and quaternary products with unreacted amine. The lower arrow, acetaldehyde with NaBH3CN, leads to N-ethylcyclohexylamine: a cyclohexane ring carrying an NH group, with an ethyl group on the nitrogen and the new C–N bond highlighted.',
  build() {
    let s = '';
    const K = hexKit(24, 0);
    const A = cyclohexyl(70, 130, K); s += A.s;
    const n = P(A.v0.x + 40, 130);
    s += bond(A.v0, n, { rFrom: 0, rTo: 17 });
    s += atom(n.x, n.y, 'NH₂', { kind: 'hi', r: 17 });
    s += tag(84, 186, 'cyclohexylamine');

    s += arrow(P(160, 112), P(300, 60));
    s += tag(214, 66, 'Route A: CH₃CH₂Br');
    s += text(318, 56, 'a mixture: secondary, tertiary and', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(318, 72, 'quaternary products, plus unreacted amine', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });

    s += arrow(P(160, 148), P(300, 196));
    s += tag(196, 214, 'Route B: CH₃CHO,', { anchor: 'start' });
    s += tag(196, 230, 'NaBH₃CN', { anchor: 'start' });
    const B = cyclohexyl(372, 196, K); s += B.s;
    const n2 = P(B.v0.x + 40, 196);
    s += bond(B.v0, n2, { rFrom: 0, rTo: 16 });
    const c1 = P(n2.x + 42, 196), c2 = at(c1, -60, 28);
    s += bond(n2, c1, { rFrom: 16, rTo: 0, cls: 'fg-bond-hi' }) + bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += atom(n2.x, n2.y, 'NH', { kind: 'hi' });
    s += lonePair(n2.x, n2.y, 90, { dist: 22 });
    s += text(560, 190, 'N-ethylcyclohexylamine,', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(560, 206, 'new C–N bond highlighted', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'The same target from the same amine. Only Route B gives it as the main product.',
});

export default FIGURES;
