/* Figures for the functional-group-interconversion notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Notes figures may be up to 760 wide. Every figure shown in the lesson is 340 wide or
   less, stacked vertically, and uses only fg-lbl and fg-tag text (ids start with l-). */
import { atom, bond, wedge, hash, arrow, text, tag, label, rule, P } from '../lib/ochem-figure.mjs';
import { polyPts, polyRing, ringDouble } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const T = 'functional-group-interconversion';

/* ---------------------------------------------------------------- helpers */

/* Skeletal bond between two unlabeled vertices. */
const sk = (a, b, opts = {}) => bond(a, b, { rFrom: 0, rTo: 0, ...opts });
/* Skeletal double bond, drawn as two lines either side of the axis. */
const sk2 = (a, b) => bond(a, b, { rFrom: 0, rTo: 0, order: 2, gap: 3.2 });
/* A labeled atom on the end of a skeletal bond. */
const het = (from, at, lbl, kind = 'plain', order = 1) =>
  bond(from, at, { rFrom: 0, rTo: kind === 'plain' ? 15 : 16, order, gap: 3.2 }) + atom(at.x, at.y, lbl, { kind });
/* Point at a screen angle (degrees, counterclockwise from east) and distance. */
const at = (p, deg, len = 30) => armEnd(p, deg, len);

/* Text with an italic prefix, e.g. itext(x, y, 'cis', '-but-2-ene'). */
function itext(x, y, it, rest, cls = 'fg-tag', anchor = 'middle', pre = '') {
  return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${pre}<tspan font-style="italic">${it}</tspan>${rest}</text>`;
}

/* A short labeled reaction arrow: reagent text above (and optionally below). */
function rxn(a, b, above, below, cls = 'fg-tag', muted = false) {
  let s = arrow(a, b, { muted });
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  if (above) s += text(mx, my - 9, above, { cls });
  if (below) s += text(mx, my + 19, below, { cls });
  return s;
}

/* ---- molecules, drawn around a reference point ---- */

/* but-2-yne, linear (sp carbons are 180 degrees). c = center. */
function butyne(c, d = 28) {
  const p = [-1.5, -0.5, 0.5, 1.5].map((k) => P(c.x + k * d, c.y));
  return sk(p[0], p[1]) + bond(p[1], p[2], { rFrom: 0, rTo: 0, order: 3, gap: 3.4 }) + sk(p[2], p[3]);
}

/* but-2-ene, cis or trans. c = midpoint of the C=C. */
function butene(c, cis, d = 28) {
  const c2 = P(c.x - d / 2, c.y), c3 = P(c.x + d / 2, c.y);
  const c1 = at(c2, 120, d);
  const c4 = cis ? at(c3, 60, d) : at(c3, -60, d);
  return sk(c1, c2) + sk2(c2, c3) + sk(c3, c4);
}

/* cyclohexene or a cyclohexane-1,2-diol. c = ring center, ring vertex 0 at the top.
   The C=C (or the two C–OH carbons) is the right-hand edge, v5 (upper right) and
   v4 (lower right). stereo: null (alkene), 'cis' or 'trans'. */
function sixRing(c, stereo, r = 24) {
  const v = polyPts(c.x, c.y, 6, r, 90);
  let s = '';
  if (!stereo) {
    for (let i = 0; i < 6; i++) if (i !== 4) s += sk(v[i], v[(i + 1) % 6]);
    s += ringDouble(v[4], v[5], c, { inset: 5, gap: 4.2 });
    return s;
  }
  s += polyRing(v);
  const o1 = at(v[5], 30, 32), o2 = at(v[4], -30, 32);
  s += wedge(v[5], o1, { rFrom: 0, rTo: 16, width: 8 });
  s += stereo === 'cis' ? wedge(v[4], o2, { rFrom: 0, rTo: 16, width: 8 })
                        : hash(v[4], o2, { rFrom: 0, rTo: 16, width: 10, rungs: 5 });
  s += atom(o1.x, o1.y, 'OH', { kind: 'hi' }) + atom(o2.x, o2.y, 'OH', { kind: 'hi' });
  return s;
}

/* A three-carbon chain ending in a group at C1. p0 = C3 (left end).
   end: 'OH' (propan-1-ol), 'CHO' (propanal), 'CO2H' (propanoic acid), 'Br', 'Cl'. */
function propyl(p0, end, d = 28) {
  const c3 = p0, c2 = at(c3, 30, d), c1 = at(c2, -30, d);
  let s = sk(c3, c2) + sk(c2, c1);
  if (end === 'OH' || end === 'Br' || end === 'Cl') {
    s += het(c1, at(c1, 30, d + 4), end, 'hi');
  } else if (end === 'CHO') {
    s += het(c1, at(c1, 30, d + 2), 'O', 'hi', 2);
    s += het(c1, at(c1, 270, d - 4), 'H');
  } else if (end === 'CO2H') {
    s += het(c1, at(c1, 30, d + 2), 'O', 'hi', 2);
    s += het(c1, at(c1, 270, d), 'OH', 'hi');
  }
  return s;
}

/* A four-carbon chain for the ester example. p0 = C4 (left end).
   end: 'ester' (methyl butanoate), 'CHO' (butanal), 'OH' (butan-1-ol). */
function butyl(p0, end, d = 28) {
  const c4 = p0, c3 = at(c4, 30, d), c2 = at(c3, -30, d), c1 = at(c2, 30, d);
  let s = sk(c4, c3) + sk(c3, c2) + sk(c2, c1);
  if (end === 'OH') {
    s += het(c1, at(c1, -30, d + 4), 'OH', 'hi');
  } else if (end === 'CHO') {
    s += het(c1, at(c1, 90, d - 2), 'O', 'hi', 2);
    s += het(c1, at(c1, -30, d - 4), 'H');
  } else if (end === 'ester') {
    s += het(c1, at(c1, 90, d - 2), 'O', 'hi', 2);
    const o = at(c1, -30, d + 2);
    s += het(c1, o, 'O');
    s += bond(o, at(o, 30, d + 2), { rFrom: 15, rTo: 0 });
  }
  return s;
}

/* propene, propan-2-ol and the 2-substituted propanes. c = C2. */
function propene(c, d = 30) {
  const c1 = at(c, 150, d), c3 = at(c, 30, d);
  return bond(c1, c, { rFrom: 0, rTo: 0, order: 2, gap: 3.2 }) + sk(c, c3);
}
function propan2ol(c, kind = 'hi', d = 30) {
  const c1 = at(c, 210, d), c3 = at(c, -30, d);
  return sk(c1, c) + sk(c, c3) + het(c, at(c, 90, d + 4), 'OH', kind);
}

/* The 2-methylbutane skeleton with a group on C2. c = C2. C1 up-left, C3 up-right,
   C4 down-right of C3. sub: 'OH', 'Br', 'ene2' (C2=C3), 'ene1' (C2=CH2), or 'OH1'
   (2-methylbutan-1-ol: the OH on the methyl carbon, which is then C1). */
function methylbutane(c, sub, d = 28) {
  const c1 = at(c, 150, d), c3 = at(c, 30, d), c4 = at(c3, -30, d);
  let s = sk(c3, c4);
  if (sub === 'OH' || sub === 'Br') {
    s += sk(c1, c) + sk(c, c3);
    s += sk(c, at(c, 240, d));
    s += het(c, at(c, 300, d + 8), sub, 'hi');
  } else if (sub === 'ene2') {
    s += sk(c1, c) + bond(c, c3, { rFrom: 0, rTo: 0, order: 2, gap: 3.2 });
    s += sk(c, at(c, 270, d));
  } else if (sub === 'ene1') {
    s += sk(c1, c) + sk(c, c3);
    s += bond(c, at(c, 270, d), { rFrom: 0, rTo: 0, order: 2, gap: 3.2 });
  } else if (sub === 'OH1') {
    s += sk(c1, c) + sk(c, c3);
    const m = at(c, 270, d);
    s += sk(c, m) + het(m, at(m, -30, d + 4), 'OH', 'hi');
  }
  return s;
}

/* =====================================================================
   1. The ladder with every group on its rung. The prose places the halide,
      ether and alkene on the alcohol rung, the alkyne, acetal and imine on
      the ketone rung, and the acid derivatives and the nitrile on the acid
      rung; this draws all of them, plus one sideways move per rung and the
      two-rung drop from nitrile to amine. */
FIGURES.push({
  id: 'fgi-two-axes',
  section: T,
  anchor: 'So nitrile &rarr; primary amine needs LiAlH₄ and drops two rungs.</p>',
  alt: 'The oxidation ladder drawn as four rungs, with the members of each rung listed and one sideways move shown on each. Carboxylic acid rung: acid, ester, amide, acyl chloride, anhydride, nitrile; RCO2H to RCOCl with SOCl2, to an ester with an alcohol, to an amide with an amine. Aldehyde and ketone rung: aldehyde, ketone, acetal, imine, alkyne; a ketone to a cyclic acetal with ethylene glycol and acid, and back with aqueous acid. Alcohol rung: alcohol, alkyl halide, ether, amine, alkene; ROH to RX with PBr3 or SOCl2, to an alkene with a bulky base, and back with aqueous acid or hydroboration. Alkane rung: nothing sideways. A long arrow on the right shows a nitrile reduced by LiAlH4 to a primary amine, down two rungs.',
  viewBox: '0 0 760 470',
  build() {
    let s = '';
    s += tag(150, 22, 'UP OR DOWN: needs [O] or [H]');
    s += tag(470, 22, 'SIDEWAYS: same rung, no redox reagent');

    // The ladder: [O] goes up, [H] goes down.
    s += arrow(P(30, 420), P(30, 62));
    s += arrow(P(56, 62), P(56, 420));
    s += tag(30, 50, '[O]') + tag(56, 50, '[H]');

    const rows = [
      { y: 96, name: 'carboxylic acid', n: '3 bonds to O, N or halogen' },
      { y: 202, name: 'aldehyde / ketone', n: '2 bonds to O, N or halogen' },
      { y: 308, name: 'alcohol', n: '1 bond to O, N or halogen' },
      { y: 400, name: 'alkane', n: 'no bond to O, N or halogen' },
    ];
    for (const r of rows) {
      s += label(74, r.y, r.name, { anchor: 'start', size: 13 });
      s += text(74, r.y + 18, r.n, { cls: 'fg-sm', anchor: 'start' });
    }
    s += rule(244, 40, 244, 440);
    for (const y of [150, 256, 360]) s += rule(74, y, 740, y);

    // Carboxylic acid rung.
    s += text(258, 76, 'acid · ester · amide · acyl chloride · anhydride · nitrile', { cls: 'fg-tag', anchor: 'start' });
    s += label(258, 126, 'RCO₂H', { anchor: 'start' });
    s += rxn(P(308, 122), P(352, 122), 'SOCl₂', null, 'fg-sm');
    s += label(358, 126, 'RCOCl', { anchor: 'start' });
    s += rxn(P(406, 122), P(450, 122), 'R′OH', null, 'fg-sm');
    s += label(456, 126, 'RCO₂R′', { anchor: 'start' });
    s += rxn(P(512, 122), P(556, 122), 'R₂NH', null, 'fg-sm');
    s += label(562, 126, 'RCONR₂', { anchor: 'start' });
    s += label(690, 126, 'RC≡N');

    // Aldehyde / ketone rung.
    s += text(258, 182, 'aldehyde · ketone · acetal · imine · alkyne', { cls: 'fg-tag', anchor: 'start' });
    s += label(258, 226, 'R₂C=O', { anchor: 'start' });
    s += arrow(P(310, 216), P(402, 216));
    s += text(356, 207, 'HOCH₂CH₂OH, H⁺', { cls: 'fg-sm' });
    s += arrow(P(402, 230), P(310, 230), { muted: true });
    s += text(356, 246, 'H₃O⁺', { cls: 'fg-sm' });
    s += label(410, 226, 'cyclic acetal', { anchor: 'start' });

    // Alcohol rung.
    s += text(258, 288, 'alcohol · alkyl halide · ether · amine · alkene', { cls: 'fg-tag', anchor: 'start' });
    s += label(258, 324, 'R–OH', { anchor: 'start' });
    s += rxn(P(300, 320), P(372, 320), 'PBr₃ or SOCl₂', null, 'fg-sm');
    s += label(378, 324, 'R–X', { anchor: 'start' });
    s += rxn(P(410, 320), P(498, 320), 'bulky base (E2)', null, 'fg-sm');
    s += label(504, 324, 'alkene', { anchor: 'start' });
    s += text(258, 346, 'and from the alkene back to R–OH: H₃O⁺, or BH₃ then H₂O₂/HO⁻', { cls: 'fg-sm', anchor: 'start' });
    s += label(690, 324, 'RCH₂NH₂');

    // The two-rung drop on the right.
    s += arrow(P(690, 136), P(690, 306));
    s += text(682, 214, 'LiAlH₄:', { cls: 'fg-tag', anchor: 'end' });
    s += text(682, 230, 'two rungs down', { cls: 'fg-tag', anchor: 'end' });

    // Alkane rung.
    s += text(258, 404, 'nothing sideways from here: the only way out is up', { cls: 'fg-sm', anchor: 'start' });

    s += text(430, 460, 'up: PCC, DMP, Jones     •     down: NaBH₄, LiAlH₄, H₂ with Pd', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Read each row as one rung. The top line of a row lists its members, and the arrows under it show a sideways move. The long arrow on the right is the one move drawn here that changes rung.',
});

/* The same ladder for the lesson: four rungs, members only. */
FIGURES.push({
  id: 'l-fgi-rungs',
  lessons: [T],
  anchor: '',
  alt: 'Four rungs of the oxidation ladder, top to bottom. Carboxylic acid rung: acid, ester, amide, acyl chloride, anhydride, nitrile. Aldehyde and ketone rung: aldehyde, ketone, acetal, imine, alkyne. Alcohol rung: alcohol, alkyl halide, ether, amine, alkene. Alkane rung: alkane. An arrow labeled [O] points up and one labeled [H] points down.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    s += arrow(P(20, 310), P(20, 30));
    s += arrow(P(44, 30), P(44, 310));
    s += tag(20, 18, '[O]') + tag(44, 18, '[H]');
    const rows = [
      { y: 44, name: 'CARBOXYLIC ACID RUNG', a: 'acid · ester · amide', b: 'acyl chloride · anhydride · nitrile' },
      { y: 124, name: 'ALDEHYDE / KETONE RUNG', a: 'aldehyde · ketone · acetal', b: 'imine · alkyne' },
      { y: 204, name: 'ALCOHOL RUNG', a: 'alcohol · alkyl halide · ether', b: 'amine · alkene' },
      { y: 284, name: 'ALKANE RUNG', a: 'alkane', b: '' },
    ];
    for (const r of rows) {
      s += tag(62, r.y, r.name, { anchor: 'start' });
      s += label(62, r.y + 22, r.a, { anchor: 'start', size: 13 });
      if (r.b) s += label(62, r.y + 42, r.b, { anchor: 'start', size: 13 });
    }
    for (const y of [98, 178, 258]) s += rule(62, y, 330, y);
    return s;
  },
  caption: 'Groups on one rung interconvert without an oxidant or a reductant. Moving between rungs needs one.',
});

/* =====================================================================
   2. Three reagent pairs that start from one compound and give opposite
      outcomes. The Markovnikov pair is drawn in the worked example below. */
function pairPanel(kind, cx, y0) {
  let s = '';
  const L = P(cx - 64, y0 + 192), R = P(cx + 64, y0 + 192);
  const start = P(cx, y0 + 62);
  const t1 = y0 + 270, t2 = y0 + 288;
  const arrows = (top = 100) =>
    arrow(P(cx - 12, y0 + top), P(cx - 50, y0 + 146)) + arrow(P(cx + 12, y0 + top), P(cx + 50, y0 + 146));
  if (kind === 'alkyne') {
    s += tag(cx, y0 + 16, 'ALKYNE TO ALKENE');
    s += butyne(start);
    s += tag(cx, y0 + 90, 'but-2-yne');
    s += arrows();
    s += tag(cx - 48, y0 + 120, 'H₂, Lindlar', { anchor: 'end' });
    s += tag(cx + 48, y0 + 120, 'Na, NH₃(l)', { anchor: 'start' });
    s += butene(P(L.x, L.y + 14), true);
    s += butene(P(R.x, R.y), false);
    s += itext(L.x, t1, 'cis', '-but-2-ene');
    s += itext(R.x, t1, 'trans', '-but-2-ene');
    s += tag(L.x, t2, 'same side', { cls: 'fg-tag-good' });
    s += tag(R.x, t2, 'opposite sides', { cls: 'fg-tag-good' });
  } else if (kind === 'diol') {
    s += tag(cx, y0 + 16, 'ALKENE TO DIOL');
    s += sixRing(P(cx - 8, start.y));
    s += tag(cx, y0 + 102, 'cyclohexene');
    s += arrows(110);
    s += tag(cx - 50, y0 + 126, 'OsO₄, NMO', { anchor: 'end' });
    s += tag(cx + 50, y0 + 122, '1. mCPBA', { anchor: 'start' });
    s += tag(cx + 50, y0 + 137, '2. H₃O⁺', { anchor: 'start' });
    s += sixRing(P(L.x - 16, L.y + 2), 'cis');
    s += sixRing(P(R.x - 16, R.y + 2), 'trans');
    s += itext(L.x, t1, 'cis', '-diol (syn)');
    s += itext(R.x, t1, 'trans', '-diol (anti)');
    s += tag(L.x, t2, 'both wedges', { cls: 'fg-tag-good' });
    s += tag(R.x, t2, 'wedge and dash', { cls: 'fg-tag-good' });
  } else if (kind === 'acid') {
    s += tag(cx, y0 + 16, 'PRIMARY ALCOHOL, OXIDIZED');
    s += propyl(P(start.x - 44, start.y + 8), 'OH');
    s += tag(cx, y0 + 96, 'propan-1-ol');
    s += arrows();
    s += tag(cx - 48, y0 + 120, 'PCC', { anchor: 'end' });
    s += tag(cx + 48, y0 + 120, 'Jones', { anchor: 'start' });
    s += propyl(P(L.x - 46, L.y - 6), 'CHO');
    s += propyl(P(R.x - 46, R.y - 6), 'CO2H');
    s += tag(L.x, t1, 'propanal');
    s += tag(R.x, t1, 'propanoic acid');
    s += tag(L.x, t2, 'one rung up', { cls: 'fg-tag-good' });
    s += tag(R.x, t2, 'two rungs up', { cls: 'fg-tag-good' });
  }
  return s;
}

FIGURES.push({
  id: 'fgi-pairs',
  section: T,
  anchor: 'because only you can make those choices.</div>',
  alt: 'Three reagent pairs. Left: but-2-yne with H2 and Lindlar catalyst gives cis-but-2-ene, and with sodium in liquid ammonia gives trans-but-2-ene. Middle: cyclohexene with OsO4 and NMO gives the cis-1,2-diol with both OH groups on wedges, and with mCPBA then aqueous acid gives the trans-1,2-diol with one OH on a wedge and one on a dash. Right: propan-1-ol with PCC gives propanal, and with Jones reagent gives propanoic acid.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += pairPanel('alkyne', 128, 0);
    s += rule(254, 10, 254, 292);
    s += pairPanel('diol', 380, 0);
    s += rule(506, 10, 506, 292);
    s += pairPanel('acid', 632, 0);
    return s;
  },
  caption: 'Each panel starts from one compound. The two reagents under it give different products, and the tags say what differs.',
});

FIGURES.push({
  id: 'l-fgi-pairs',
  lessons: [T],
  anchor: '',
  alt: 'Two reagent pairs, stacked. Top: but-2-yne with H2 and Lindlar catalyst gives cis-but-2-ene, and with sodium in liquid ammonia gives trans-but-2-ene. Bottom: cyclohexene with OsO4 and NMO gives the cis-1,2-diol with both OH groups on wedges, and with mCPBA then aqueous acid gives the trans-1,2-diol with one OH on a wedge and one on a dash.',
  viewBox: '0 0 340 604',
  build() {
    let s = '';
    s += pairPanel('alkyne', 170, 0);
    s += rule(10, 300, 330, 300);
    s += pairPanel('diol', 170, 304);
    return s;
  },
  caption: 'One starting compound, two reagents, two different products.',
});

/* =====================================================================
   3. Choosing where the alkene goes: acid gives the Zaitsev alkene; making
      the bromide and eliminating with a bulky base gives mostly the other. */
FIGURES.push({
  id: 'fgi-choose-alkene',
  section: T,
  anchor: 'the less substituted alkene, 2-methylbut-1-ene.</p>',
  alt: '2-Methylbutan-2-ol, two routes. Upper route: concentrated sulfuric acid and heat give 2-methylbut-2-ene, the more substituted alkene. Lower route: HBr gives 2-bromo-2-methylbutane, and tert-butoxide, a bulky base, then gives mostly 2-methylbut-1-ene, the less substituted alkene.',
  viewBox: '0 40 760 280',
  build() {
    let s = '';
    const st = P(90, 160);
    s += methylbutane(st, 'OH');
    s += tag(96, 224, '2-methylbutan-2-ol');

    // Upper route: acid.
    s += arrow(P(170, 138), P(300, 84));
    s += tag(196, 90, 'conc. H₂SO₄, heat');
    const z = P(360, 86);
    s += methylbutane(z, 'ene2');
    s += tag(370, 140, '2-methylbut-2-ene');
    s += tag(370, 158, 'more substituted C=C (Zaitsev)', { cls: 'fg-tag-warn' });

    // Lower route: bromide, then a bulky base.
    s += arrow(P(170, 186), P(300, 232));
    s += tag(250, 196, 'HBr');
    const br = P(360, 222);
    s += methylbutane(br, 'Br');
    s += tag(366, 288, '2-bromo-2-methylbutane');
    s += arrow(P(446, 230), P(546, 230));
    s += itext(496, 221, 't', '-BuO⁻ (bulky base)', 'fg-tag', 'middle');
    const h = P(604, 222);
    s += methylbutane(h, 'ene1');
    s += tag(614, 288, '2-methylbut-1-ene (mostly)');
    s += tag(614, 306, 'less substituted C=C', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'One alcohol, two alkenes. Acid gives whichever alkene the carbocation prefers; going through the bromide lets the base decide.',
});

FIGURES.push({
  id: 'l-fgi-choose-alkene',
  lessons: [T],
  anchor: '',
  alt: '2-Methylbutan-2-ol, two routes. Right: concentrated sulfuric acid and heat give 2-methylbut-2-ene, the more substituted alkene. Down: HBr gives 2-bromo-2-methylbutane, and tert-butoxide, a bulky base, then gives mostly 2-methylbut-1-ene, the less substituted alkene.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    const st = P(64, 64);
    s += methylbutane(st, 'OH');
    s += tag(70, 128, '2-methylbutan-2-ol');
    s += arrow(P(140, 60), P(206, 60));
    s += tag(173, 36, 'H₂SO₄,');
    s += tag(173, 50, 'heat');
    const z = P(244, 64);
    s += methylbutane(z, 'ene2');
    s += tag(256, 112, '2-methylbut-2-ene');
    s += tag(256, 128, 'more substituted', { cls: 'fg-tag-warn' });

    s += arrow(P(70, 140), P(70, 188));
    s += tag(82, 168, 'HBr', { anchor: 'start' });
    const br = P(64, 226);
    s += methylbutane(br, 'Br');
    s += tag(70, 290, '2-bromo-2-methyl-');
    s += tag(70, 305, 'butane');
    s += arrow(P(140, 222), P(206, 222));
    s += itext(173, 212, 't', '-BuO⁻', 'fg-tag', 'middle');
    const h = P(244, 226);
    s += methylbutane(h, 'ene1');
    s += tag(256, 284, '2-methylbut-1-ene');
    s += tag(256, 300, 'less substituted', { cls: 'fg-tag-good' });
    s += tag(256, 315, '(mostly)', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Acid lets the carbocation choose the alkene. The bulky base, acting on the bromide, chooses the other one.',
});

/* =====================================================================
   4. The anti-Markovnikov halide: one step for a bromide, two for a chloride. */
FIGURES.push({
  id: 'fgi-anti-m-halide',
  section: T,
  anchor: 'then SOCl₂ turns it into 1-chloropropane.</p>',
  alt: 'Two rows starting from propene. Top: HBr with a peroxide gives 1-bromopropane in one step. Bottom: BH3, then H2O2 and hydroxide, give propan-1-ol, and SOCl2 turns that into 1-chloropropane.',
  viewBox: '0 0 760 230',
  build() {
    let s = '';
    s += tag(60, 22, 'A BROMIDE: ONE STEP', { anchor: 'start' });
    s += propene(P(90, 78));
    s += tag(90, 104, 'propene');
    s += rxn(P(150, 70), P(300, 70), 'HBr, ROOR (a peroxide)', null);
    s += propyl(P(330, 84), 'Br');
    s += tag(372, 110, '1-bromopropane');

    s += rule(20, 128, 740, 128);
    s += tag(60, 150, 'A CHLORIDE: GO AROUND', { anchor: 'start' });
    s += propene(P(90, 196));
    s += tag(90, 222, 'propene');
    s += rxn(P(150, 188), P(300, 188), '1. BH₃   2. H₂O₂, HO⁻', null);
    s += propyl(P(330, 202), 'OH');
    s += tag(372, 226, 'propan-1-ol');
    s += rxn(P(452, 188), P(540, 188), 'SOCl₂', null);
    s += propyl(P(570, 202), 'Cl');
    s += tag(612, 226, '1-chloropropane');
    return s;
  },
  caption: 'In both rows the new group lands on the end carbon. Only the bromide has a one-step route.',
});

/* =====================================================================
   5. An aldehyde from an ester: one careful step, or down and back up. */
FIGURES.push({
  id: 'fgi-ester-aldehyde',
  section: T,
  anchor: 'The second route takes two steps and uses only reagents from the tables.</p>',
  alt: 'Methyl butanoate, two routes to butanal. Top: one equivalent of DIBAL-H at minus 78 degrees gives butanal directly. Bottom: LiAlH4 reduces the ester all the way to butan-1-ol, and PCC oxidizes that back up to butanal.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    const est = P(24, 130);
    s += butyl(est, 'ester');
    s += tag(88, 176, 'methyl butanoate');

    s += arrow(P(186, 106), P(300, 62));
    s += tag(232, 58, 'DIBAL-H (1 equiv),');
    s += tag(232, 72, '−78 °C');
    s += butyl(P(330, 74), 'CHO');
    s += tag(384, 112, 'butanal');

    s += arrow(P(186, 150), P(300, 190));
    s += tag(256, 160, 'LiAlH₄');
    s += butyl(P(330, 208), 'OH');
    s += tag(384, 238, 'butan-1-ol');
    s += rxn(P(452, 196), P(540, 196), 'PCC', null);
    s += butyl(P(566, 208), 'CHO');
    s += tag(620, 238, 'butanal');
    return s;
  },
  caption: 'Both routes end at butanal. The lower one goes one rung too far down and then climbs back up.',
});

/* =====================================================================
   6. Moving the OH along the chain: eliminate, then add water back the
      other way round. */
FIGURES.push({
  id: 'move-the-group-along',
  section: T,
  anchor: 'would put the OH straight back on C2.</p>',
  alt: 'Propan-2-ol dehydrated to propene with concentrated sulfuric acid and heat, then hydrated two ways: hydroboration gives propan-1-ol, and aqueous acid gives propan-2-ol back',
  viewBox: '0 76 660 252',
  build() {
    let s = '';
    s += propan2ol(P(79, 178));
    s += tag(79, 214, 'propan-2-ol');

    s += rxn(P(140, 168), P(250, 168), 'conc. H₂SO₄, heat', null);
    s += propene(P(309, 176));
    s += tag(309, 214, 'propene');

    // Upper branch: hydroboration puts the oxygen on the end carbon.
    s += arrow(P(376, 152), P(474, 110));
    s += tag(420, 96, '1. BH₃', { anchor: 'end' });
    s += tag(420, 112, '2. H₂O₂, HO⁻', { anchor: 'end' });
    s += propyl(P(492, 118), 'OH');
    s += tag(540, 146, 'propan-1-ol');
    s += tag(540, 166, 'OH on C1: it moved', { cls: 'fg-tag-good' });

    // Lower branch: acid puts it straight back.
    s += arrow(P(376, 186), P(474, 230), { muted: true });
    s += tag(412, 236, 'H₃O⁺', { anchor: 'end' });
    s += propan2ol(P(540, 262), 'warn');
    s += tag(540, 298, 'propan-2-ol');
    s += tag(540, 318, 'OH back on C2', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Eliminating is the easy half. The hydration reagent chosen afterwards decides where the OH ends up.',
});

FIGURES.push({
  id: 'l-move-the-group-along',
  lessons: [T],
  anchor: '',
  alt: 'Propan-2-ol dehydrated to propene with concentrated sulfuric acid and heat. Propene is then hydrated two ways: BH3 then H2O2 and hydroxide give propan-1-ol, with the OH on C1; aqueous acid gives propan-2-ol back, with the OH on C2.',
  viewBox: '0 0 340 312',
  build() {
    let s = '';
    s += propan2ol(P(60, 74));
    s += tag(60, 106, 'propan-2-ol');
    s += arrow(P(118, 70), P(210, 70));
    s += tag(164, 46, 'conc. H₂SO₄,');
    s += tag(164, 60, 'heat');
    s += propene(P(262, 78));
    s += tag(262, 106, 'propene');

    s += arrow(P(236, 120), P(128, 190));
    s += tag(114, 150, '1. BH₃', { anchor: 'end' });
    s += tag(114, 166, '2. H₂O₂, HO⁻', { anchor: 'end' });
    s += propyl(P(36, 250), 'OH');
    s += tag(88, 282, 'propan-1-ol');
    s += tag(88, 300, 'OH on C1: it moved', { cls: 'fg-tag-good' });

    s += arrow(P(284, 120), P(284, 192), { muted: true });
    s += tag(294, 160, 'H₃O⁺', { anchor: 'start' });
    s += propan2ol(P(262, 252), 'warn');
    s += tag(262, 282, 'propan-2-ol');
    s += tag(262, 300, 'OH back on C2', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'The first step is the same either way. The second reagent decides the carbon.',
});

/* =====================================================================
   7. The lesson's challenge: start and target only. */
FIGURES.push({
  id: 'l-fgi-challenge',
  lessons: [T],
  anchor: '',
  alt: '2-Methylbutan-2-ol, with its OH on the branch carbon, and the target 2-methylbutan-1-ol, with the OH on the end of the methyl branch. A question mark sits on the arrow between them.',
  viewBox: '0 0 340 156',
  build() {
    let s = '';
    s += methylbutane(P(56, 58), 'OH');
    s += tag(62, 146, '2-methylbutan-2-ol');
    s += arrow(P(134, 64), P(196, 64));
    s += label(165, 54, '?', { size: 14 });
    s += methylbutane(P(244, 58), 'OH1');
    s += tag(262, 146, '2-methylbutan-1-ol');
    return s;
  },
  caption: 'Start on the left, target on the right. The OH has to move from the branch carbon to the carbon beside it.',
});

export default FIGURES;
