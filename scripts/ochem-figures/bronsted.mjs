/* Figures for the bronsted notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Acids & Bases comes after skeletal structures, so carbon chains are drawn
   skeletally and small inorganic species (ammonia, H–Cl, water) with every
   atom labeled. Every reaction is drawn whole: reactants, curved arrows where
   the page is about drawing them, a reaction arrow, and the products with
   every charge in place.

   Notes figures run up to 760 wide. The lesson copies (ids that start with
   l-) stack their rows at 340 wide and use only fg-lbl and fg-tag text. */
import { atom, bond, arrow, curve, lonePair, text, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers ---
   Copied from scripts/ochem-figures/curved-arrows.mjs so the two pages draw
   the same reaction the same way. `at` walks from a point at a screen angle
   (0 east, 90 down). A molecule is { atoms, bonds, lp, charges }: atoms map an
   id to {x, y, l, k, r}; an atom with no label is a skeletal vertex (a
   carbon). Bonds are [a, b, order, cls]; `lp` is [id, angle]; `charges` is
   [id, sign, angle, dist]. */
const at = (p, deg, len) => P(p.x + Math.cos(deg * Math.PI / 180) * len, p.y + Math.sin(deg * Math.PI / 180) * len);
const mid = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2);
const rad = (a) => a.r ?? (!a.l ? 0 : a.l === 'H' ? 11 : a.l.length === 1 ? 14 : 18);

function mol(m) {
  const A = m.atoms;
  let s = '';
  for (const [a, b, order = 1, cls] of m.bonds || []) {
    s += bond(A[a], A[b], { order, cls, rFrom: rad(A[a]), rTo: rad(A[b]), gap: 3.6 });
  }
  for (const [id, ang] of m.lp || []) s += lonePair(A[id].x, A[id].y, ang, { dist: A[id].l === 'Br' || A[id].l === 'Cl' ? 23 : 21 });
  for (const id of Object.keys(A)) {
    const a = A[id];
    if (a.l) s += atom(a.x, a.y, a.l, { kind: a.k, r: rad(a), size: a.l.length > 1 ? 11 : 12.5 });
  }
  for (const [id, sign, ang, dist = 27] of m.charges || []) {
    const p = at(A[id], ang, dist);
    s += text(p.x, p.y + 5, sign, { cls: sign === '+' ? 'fg-tag-warn' : 'fg-tag', size: 15 });
  }
  return s;
}

function addH(m, id, angles, len = 36, pre = id, k) {
  angles.forEach((ang, i) => {
    const key = `${pre}h${i}`;
    m.atoms[key] = { ...at(m.atoms[id], ang, len), l: 'H', k };
    m.bonds.push([id, key]);
  });
  return m;
}

const tg = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag', size: 11, anchor });
const good = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-good', size: 11, anchor });
const warn = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-warn', size: 11, anchor });
const mut = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-mut', size: 11, anchor });
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const plusSign = (x, y) => text(x, y + 5, '+', { cls: 'fg-lbl', size: 13 });
const num = (x, y, s) => text(x, y + 4, s, { cls: 'fg-tag', size: 11 });

/* Equilibrium arrows: a long forward arrow over a short, muted back one,
   which is how a drawing says which side is favored. `down` turns them
   vertical for the stacked lesson copy. */
function equil(x1, x2, y) {
  return arrow(P(x1, y - 4), P(x2, y - 4)) + arrow(P(x2 - 16, y + 4), P(x1 + 16, y + 4), { muted: true });
}
function equilDown(x, y1, y2) {
  return arrow(P(x - 4, y1), P(x - 4, y2)) + arrow(P(x + 4, y2 - 14), P(x + 4, y1 + 14), { muted: true });
}

/* ------------------------------------------------------------ species ---
   Each returns a molecule positioned by its key atom. */

/* Ammonia: H left, right and down; the lone pair points up. */
const ammonia = (n, pre = 'N') => addH({ atoms: { [pre]: { ...n, l: 'N' } }, bonds: [], lp: [[pre, 270]] }, pre, [180, 0, 90]);

/* Ammonium: four N–H bonds, the new one (up) highlighted. */
function ammonium(n, pre = 'A') {
  const m = addH({ atoms: { [pre]: { ...n, l: 'N' } }, bonds: [], charges: [[pre, '+', 315, 28]] }, pre, [180, 0, 90]);
  m.atoms[pre + 'Hn'] = { ...at(n, 270, 36), l: 'H', k: 'hi' };
  m.bonds.push([pre, pre + 'Hn', 1, 'fg-bond-hi']);
  return m;
}

/* H–Cl with H on the left, highlighted because it is the proton that moves. */
function hcl(h, pre = 'x') {
  const m = { atoms: { [pre + 'H']: { ...h, l: 'H', k: 'hi' }, [pre]: { ...P(h.x + 58, h.y), l: 'Cl' } }, bonds: [[pre + 'H', pre]], lp: [] };
  for (const d of [270, 0, 90]) m.lp.push([pre, d]);
  return m;
}

/* Chloride: four lone pairs and a minus. */
const chloride = (p, pre = 'cl') => ({ atoms: { [pre]: { ...p, l: 'Cl' } }, bonds: [], lp: [[pre, 270], [pre, 0], [pre, 90], [pre, 180]], charges: [[pre, '−', 315, 31]] });

/* Acetic acid or acetate, skeletal: the methyl down-left, C=O up, the single-
   bonded oxygen down-right. With `acid`, that oxygen carries the O–H,
   pointing up-right toward whatever base sits there. */
function acetic(c, acid, pre = 'ac') {
  const o1 = at(c, 270, 56), o2 = at(c, 30, 54), me = at(c, 150, 54);
  const m = {
    atoms: { [pre + 'c']: { ...c, l: '' }, [pre + 'me']: { ...me, l: '' }, [pre + 'o1']: { ...o1, l: 'O' }, [pre + 'o2']: { ...o2, l: 'O' } },
    bonds: [[pre + 'c', pre + 'me'], [pre + 'c', pre + 'o1', 2], [pre + 'c', pre + 'o2']],
    lp: [[pre + 'o1', 210], [pre + 'o1', 330]],
    charges: [],
  };
  if (acid) {
    m.atoms[pre + 'h'] = { ...at(o2, 330, 62), l: 'H', k: 'hi' };
    m.bonds.push([pre + 'o2', pre + 'h']);
    m.lp.push([pre + 'o2', 75], [pre + 'o2', 145]);
  } else {
    m.lp.push([pre + 'o2', 330], [pre + 'o2', 60], [pre + 'o2', 140]);
    m.charges.push([pre + 'o2', '−', 20, 30]);
  }
  return m;
}

/* ============================================================== NOTES === */

/* HCl + NH3, both arrows, every species named by its role. */
FIGURES.push({
  id: 'br-hcl-nh3',
  section: 'bronsted',
  anchor: '<span class="k">Worked example — HCl + NH₃</span>',
  viewBox: '0 56 760 212',
  alt: 'Ammonia and hydrogen chloride. Arrow 1 runs from the nitrogen lone pair to the hydrogen of H–Cl. Arrow 2 runs from the H–Cl bond onto chlorine. A reaction arrow leads to the ammonium ion, with a plus charge and its new N–H bond highlighted, and the chloride ion, with four lone pairs and a minus charge. Under each species is its role: ammonia is the base, hydrogen chloride the acid, ammonium the conjugate acid and chloride the conjugate base.',
  build() {
    let s = '';
    const y = 120;
    const n = P(80, y + 6);
    s += mol(ammonia(n));
    const h = P(180, y - 40);
    const m = hcl(h);
    s += mol(m);
    const cl = m.atoms.x;
    s += curve(P(n.x + 2, n.y - 27), P(h.x - 13, h.y + 2), { bow: -20 });
    s += num(118, y - 58, '1');
    const hm = mid(h, cl);
    s += curve(P(hm.x, hm.y + 3), P(cl.x - 11, cl.y + 13), { bow: 20 });
    s += num(hm.x + 6, hm.y + 34, '2');
    s += plusSign(146, 124);

    s += arrow(P(310, 110), P(380, 110));
    s += mol(ammonium(P(470, 116)));
    s += plusSign(560, 110);
    s += mol(chloride(P(640, 110)));

    s += tg(80, 196, 'ammonia');
    s += good(80, 214, 'base');
    s += tg(209, 196, 'hydrogen chloride');
    s += warn(209, 214, 'acid');
    s += tg(470, 196, 'ammonium');
    s += warn(470, 214, 'conjugate acid');
    s += tg(640, 196, 'chloride');
    s += good(640, 214, 'conjugate base');

    s += rule(24, 232, 736, 232);
    s += tg(200, 254, 'charge in: 0 + 0 = 0');
    s += tg(560, 254, 'charge out: +1 on N, −1 on Cl; sum 0');
    return s;
  },
  caption: 'Follow the highlighted hydrogen: it starts on chlorine and ends on nitrogen, and the role under each species follows from which way it moved.',
});

/* Methoxide takes the O–H proton of acetic acid. */
FIGURES.push({
  id: 'organic-proton-transfer',
  section: 'bronsted',
  anchor: '<span class="k">Worked example — sodium methoxide + acetic acid</span>',
  viewBox: '0 72 760 228',
  alt: 'Acetic acid, drawn skeletally with its O–H hydrogen highlighted, and methoxide, an oxygen with three lone pairs, a minus charge and a methyl line. Arrow 1 runs from a methoxide lone pair to the O–H hydrogen. Arrow 2 runs from the O–H bond onto the acetic acid oxygen. A reaction arrow leads to acetate, whose single-bonded oxygen now has three lone pairs and a minus charge, and methanol, whose new O–H bond is highlighted. Under each species is its role: acid, base, conjugate base and conjugate acid.',
  build() {
    let s = '';
    const a = acetic(P(100, 160), true, 'a');
    s += mol(a);
    const ah = a.atoms.ah, ao2 = a.atoms.ao2;

    /* methoxide: O with the methyl up-right, three pairs elsewhere */
    const mo = P(304, 110);
    s += mol({ atoms: { mo: { ...mo, l: 'O' }, mc: { ...at(mo, 330, 44), l: '' } }, bonds: [['mo', 'mc']],
      lp: [['mo', 180], ['mo', 90], ['mo', 250]], charges: [['mo', '−', 30, 28]] });

    s += curve(P(mo.x - 25, mo.y + 4), P(ah.x + 12, ah.y - 4), { bow: 16 });
    s += num(236, 104, '1');
    const bm = mid(ao2, ah);
    s += curve(P(bm.x + 3, bm.y + 5), P(ao2.x + 13, ao2.y + 12), { bow: 16 });
    s += num(bm.x + 22, bm.y + 26, '2');
    s += plusSign(262, 170);

    s += arrow(P(360, 150), P(420, 150));

    s += mol(acetic(P(500, 160), false, 'p'));
    s += plusSign(612, 150);
    const qo = P(690, 150);
    s += mol({ atoms: { qo: { ...qo, l: 'O' }, qc: { ...at(qo, 330, 44), l: '' }, qh: { ...at(qo, 210, 36), l: 'H', k: 'hi' } },
      bonds: [['qo', 'qc'], ['qo', 'qh', 1, 'fg-bond-hi']], lp: [['qo', 45], ['qo', 135]] });

    s += tg(110, 234, 'acetic acid');
    s += warn(110, 252, 'acid');
    s += tg(300, 234, 'methoxide');
    s += good(300, 252, 'base');
    s += tg(510, 234, 'acetate');
    s += good(510, 252, 'conjugate base');
    s += tg(690, 234, 'methanol');
    s += warn(690, 252, 'conjugate acid');

    s += rule(24, 266, 736, 266);
    s += tg(200, 288, 'charge in: 0 + (−1) = −1');
    s += tg(560, 288, 'charge out: (−1) + 0 = −1');
    return s;
  },
  caption: 'The same two arrows as the HCl example, on an organic acid. The −1 starts on methoxide’s oxygen and ends on acetate’s.',
});

/* Two proton transfers, each with the pKa of the acid on either side. */
function eqRow(y0, L, R, lp, rp, gap) {
  let s = '';
  s += panel(14, y0, 732, 118);
  const y = y0 + 44;
  s += lbl(96, y + 5, L[0]); s += plusSign(170, y); s += lbl(236, y + 5, L[1]);
  s += equil(300, 410, y);
  s += lbl(488, y + 5, R[0]); s += plusSign(562, y); s += lbl(636, y + 5, R[1]);
  s += warn(96, y + 30, `pKa ${lp}`);
  s += mut(96, y + 46, 'the stronger acid');
  s += good(636, y + 30, `pKa ${rp}`);
  s += mut(636, y + 46, 'the weaker acid');
  s += tg(355, y + 30, gap[0]);
  s += tg(355, y + 46, gap[1]);
  return s;
}

FIGURES.push({
  id: 'br-equilibrium',
  section: 'bronsted',
  anchor: '<h3>Which side does the equilibrium favor?</h3>',
  viewBox: '0 0 760 272',
  alt: 'Two proton-transfer equilibria, each drawn with a long forward arrow and a short back arrow to show that the right side is favored. Top: acetic acid plus methoxide gives acetate plus methanol; acetic acid has pKa 4.76 and methanol 15.5, a gap of 10.7 units, about 5 times 10 to the 10th to one. Bottom: acetic acid plus ammonia gives acetate plus ammonium; the pKa values are 4.76 and 9.2, a gap of 4.5 units, about 3 times 10 to the 4th to one.',
  build() {
    let s = '';
    s += eqRow(10, ['CH₃CO₂H', 'CH₃O⁻'], ['CH₃CO₂⁻', 'CH₃OH'], '4.76', '15.5', ['gap 10.7 units', 'about 5 × 10¹⁰ to 1']);
    s += eqRow(144, ['CH₃CO₂H', 'NH₃'], ['CH₃CO₂⁻', 'NH₄⁺'], '4.76', '9.2', ['gap 4.5 units', 'about 3 × 10⁴ to 1']);
    return s;
  },
  caption: 'In each row the long arrow points toward the side that holds the weaker acid. Compare the two gaps and the two ratios.',
});

/* 4-aminobutan-1-ol: where the acidic proton is, where the basic site is,
   and what each reagent does. */
function chainProduct(n0, nLabel, end) {
  let s = '';
  const pts = [n0];
  for (let i = 0; i < 5; i++) pts.push(at(pts[i], i % 2 ? 30 : 330, 38));
  const [N, c1, c2, c3, c4, O] = pts;
  s += bond(N, c1, { rFrom: 20, rTo: 0 });
  s += bond(c1, c2, { rFrom: 0, rTo: 0 });
  s += bond(c2, c3, { rFrom: 0, rTo: 0 });
  s += bond(c3, c4, { rFrom: 0, rTo: 0 });
  s += bond(c4, O, { rFrom: 0, rTo: end === 'OH' ? 19 : 14 });
  s += atom(N.x, N.y, nLabel, { kind: nLabel === 'H₃N' ? 'warn' : 'plain', r: 20, size: 11 });
  if (end === 'OH') {
    s += atom(O.x, O.y, 'OH', { r: 19, size: 11 });
  } else {
    s += atom(O.x, O.y, 'O', { kind: 'warn', r: 14, size: 12.5 });
    for (const d of [250, 330, 60]) s += lonePair(O.x, O.y, d, { dist: 21 });
    const c = at(O, 290, 30);
    s += text(c.x + 4, c.y + 5, '−', { cls: 'fg-tag', size: 15 });
  }
  if (nLabel === 'H₃N') s += text(N.x + 14, N.y - 20, '+', { cls: 'fg-tag-warn', size: 15 });
  return s;
}

FIGURES.push({
  id: 'acid-base-site-scan',
  section: 'bronsted',
  anchor: '<span class="k">Worked example — 4-aminobutan-1-ol</span>',
  viewBox: '0 0 760 300',
  alt: 'Left: 4-aminobutan-1-ol drawn skeletally, with the nitrogen and oxygen hydrogens drawn out. The O–H is marked pKa 16, the most acidic hydrogen; the N–H bonds pKa 38; the C–H bonds about 50; the nitrogen lone pair is marked as the most basic site. Right, top: with one equivalent of sodium hydride the O–H proton is removed, giving an O minus with three lone pairs. Right, bottom: with one equivalent of HCl the nitrogen is protonated, giving H3N plus while the O–H stays.',
  build() {
    let s = '';
    const n = P(92, 164);
    const c1 = at(n, 330, 46), c2 = at(c1, 30, 46), c3 = at(c2, 330, 46), c4 = at(c3, 30, 46), o = at(c4, 330, 46);
    const m = {
      atoms: { n: { ...n, l: 'N', k: 'hi' }, c1: { ...c1, l: '' }, c2: { ...c2, l: '' }, c3: { ...c3, l: '' }, c4: { ...c4, l: '' }, o: { ...o, l: 'O' } },
      bonds: [['n', 'c1'], ['c1', 'c2'], ['c2', 'c3'], ['c3', 'c4'], ['c4', 'o']],
      lp: [['n', 215], ['o', 240], ['o', 300]],
    };
    addH(m, 'n', [150, 90], 36, 'nh');
    addH(m, 'o', [30], 36, 'oh', 'warn');
    s += mol(m);

    s += good(64, 108, 'lone pair:');
    s += good(64, 124, 'most basic site');
    s += tg(80, 214, 'N–H, pKa 38', 'end');
    s += warn(352, 210, 'O–H, pKa 16:');
    s += warn(352, 226, 'most acidic H');
    s += mut(212, 194, 'C–H, pKa about 50');
    s += tg(200, 276, '4-aminobutan-1-ol');

    s += rule(400, 30, 400, 280);
    s += tg(420, 50, 'one equivalent of NaH', 'start');
    s += tg(420, 66, 'takes the O–H proton:', 'start');
    s += chainProduct(P(456, 116), 'H₂N', 'O');
    s += tg(420, 176, 'one equivalent of HCl', 'start');
    s += tg(420, 192, 'protonates the nitrogen:', 'start');
    s += chainProduct(P(456, 242), 'H₃N', 'OH');
    return s;
  },
  caption: 'Left: the pKa of each kind of hydrogen, and the most basic site. Right: what each reagent does to the molecule.',
});

/* Three cationic acids. */
FIGURES.push({
  id: 'cation-acids',
  section: 'bronsted',
  anchor: '<h3>The acid is often a cation</h3>',
  alt: 'Three cationic acids drawn side by side: hydronium, a protonated alcohol and a protonated ketone. Each oxygen has three bonds, one lone pair and a plus charge. Under each are its name, its pKa and the pKa of its neutral parent.',
  viewBox: '0 0 760 268',
  build() {
    let s = '';
    const panels = [
      { x: 140, name: 'hydronium', pka: 'pKa −1.7', from: 'water: 15.7' },
      { x: 380, name: 'protonated alcohol', pka: 'pKa about −2', from: 'alcohol: 16' },
      { x: 620, name: 'protonated ketone', pka: 'pKa about −7', from: 'ketone: no O–H at all' },
    ];

    // --- hydronium and the protonated alcohol: O with three groups, the pair down ---
    for (const [cx, first] of [[140, 'H'], [380, 'R']]) {
      const o = P(cx, 110);
      const g1 = at(o, 150, first === 'R' ? 44 : 36), g2 = at(o, 30, 36), g3 = at(o, 270, 36);
      const mm = { atoms: { o: { ...o, l: 'O', k: 'warn' }, g1: { ...g1, l: first, r: first === 'R' ? 16 : 11 }, g2: { ...g2, l: 'H' }, g3: { ...g3, l: 'H' } },
        bonds: [['o', 'g1'], ['o', 'g2'], ['o', 'g3']], lp: [['o', 90]], charges: [['o', '+', 330, 30]] };
      s += mol(mm);
    }
    // --- protonated ketone ---
    {
      const c = P(610, 150), o = at(c, 270, 52), h = at(o, 330, 36), r1 = at(c, 150, 46), r2 = at(c, 30, 46);
      s += mol({ atoms: { c: { ...c, l: 'C' }, o: { ...o, l: 'O', k: 'warn' }, h: { ...h, l: 'H' }, r1: { ...r1, l: 'R', r: 16 }, r2: { ...r2, l: 'R', r: 16 } },
        bonds: [['c', 'o', 2], ['o', 'h'], ['c', 'r1'], ['c', 'r2']], lp: [['o', 210]], charges: [['o', '+', 280, 30]] });
    }

    for (const p of panels) {
      s += tg(p.x, 214, p.name);
      s += warn(p.x, 232, p.pka);
      s += mut(p.x, 250, p.from);
    }
    return s;
  },
  caption: 'Each oxygen has three bonds, one lone pair and a +1 charge. Compare the pKa under each cation with the value for its neutral parent below it.',
});

/* ============================================================= LESSON === */

/* HCl + NH3 before and after, no curved arrows (the next step draws them). */
FIGURES.push({
  id: 'l-br-transfer',
  lessons: ['bronsted'],
  viewBox: '0 0 340 296',
  alt: 'Top: hydrogen chloride, with its hydrogen highlighted, and ammonia, with a lone pair on nitrogen. A downward reaction arrow leads to the bottom row: ammonium, with the highlighted hydrogen now bonded to nitrogen and a plus charge, and chloride, with four lone pairs and a minus charge.',
  build() {
    let s = '';
    s += mol(hcl(P(46, 66)));
    s += plusSign(160, 66);
    s += mol(ammonia(P(250, 72)));
    s += tg(75, 134, 'hydrogen chloride');
    s += tg(250, 134, 'ammonia');
    s += arrow(P(170, 146), P(170, 180));
    s += mol(ammonium(P(90, 224)));
    s += plusSign(170, 218);
    s += mol(chloride(P(246, 218)));
    s += tg(90, 286, 'ammonium');
    s += tg(246, 286, 'chloride');
    return s;
  },
  caption: 'The highlighted hydrogen moves from chlorine to nitrogen.',
});

/* Acetic acid + hydroxide as an equilibrium, stacked. */
FIGURES.push({
  id: 'l-br-equilibrium',
  lessons: ['bronsted'],
  viewBox: '0 0 340 262',
  alt: 'Acetic acid plus hydroxide on top, acetate plus water below, joined by a long downward arrow and a short upward one to show the lower side is favored. Acetic acid is labeled pKa 4.76, the stronger acid; water is labeled pKa 15.7, the weaker acid.',
  build() {
    let s = '';
    s += lbl(96, 40, 'CH₃CO₂H'); s += plusSign(176, 35); s += lbl(246, 40, 'HO⁻');
    s += warn(96, 64, 'pKa 4.76');
    s += tg(96, 80, 'stronger acid');
    s += equilDown(176, 96, 162);
    s += good(196, 134, 'favored', 'start');
    s += lbl(96, 196, 'CH₃CO₂⁻'); s += plusSign(176, 191); s += lbl(246, 196, 'H₂O');
    s += good(246, 220, 'pKa 15.7');
    s += tg(246, 236, 'weaker acid');
    return s;
  },
  caption: 'The long arrow points to the side with the weaker acid.',
});

export default FIGURES;
