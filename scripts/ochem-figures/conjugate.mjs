/* Figures for the conjugate notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conjugate acids/bases sits in Acids & Bases, after skeletal structures, so
   carbon skeletons are drawn skeletally while every heteroatom, every
   hydrogen that moves, every lone pair and every charge is drawn. No figure
   here uses a pKa value: the pKa scale is the next topic, and this page only
   previews its numbers in prose.

   Several figures are 340 wide with their rows stacked, so the same drawing
   serves the notes page and the lesson (lesson figures must be 340 wide or
   less and use only fg-lbl and fg-tag text). */
import { atom, bond, arrow, lonePair, text, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers ---
   `at` walks from a point at a screen angle (0 east, 90 down). A molecule is
   { atoms, bonds, lp, charges }: atoms map an id to {x, y, l, k, r}; an atom
   with no label is a skeletal vertex (a carbon), and bonds stop short of
   labeled atoms only. Bonds are [a, b, order, cls]. `lp` is [id, angle];
   `charges` is [id, sign, angle, dist]. */
const at = (p, deg, len) => P(p.x + Math.cos(deg * Math.PI / 180) * len, p.y + Math.sin(deg * Math.PI / 180) * len);
const rad = (a) => a.r ?? (!a.l ? 0 : a.l === 'H' ? 11 : a.l.length === 1 ? 14 : 16);

function mol(m) {
  const A = m.atoms;
  let s = '';
  for (const [a, b, order = 1, cls] of m.bonds || []) {
    s += bond(A[a], A[b], { order, cls, rFrom: rad(A[a]), rTo: rad(A[b]), gap: 3.6 });
  }
  for (const [id, ang] of m.lp || []) {
    const a = A[id];
    const d = !a.l ? 14 : a.l === 'H' ? 18 : a.l === 'Cl' ? 23 : 21;
    s += lonePair(a.x, a.y, ang, { dist: d });
  }
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

/* Hydrogens on atom `id` at the given angles. `hi` lists the indices of the
   ones to highlight (the proton that is about to leave or has just arrived). */
function addH(m, id, angles, hi = [], len = 34) {
  angles.forEach((ang, i) => {
    const k = `${id}h${i}`;
    const isHi = hi.includes(i);
    m.atoms[k] = { ...at(m.atoms[id], ang, len), l: 'H', k: isHi ? 'hi' : undefined };
    m.bonds.push([id, k, 1, isHi ? 'fg-bond-hi' : undefined]);
  });
  return m;
}

const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const tg = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag', size: 11, anchor });
const good = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-good', size: 11, anchor });
const warn = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-warn', size: 11, anchor });
const mut = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-mut', size: 11, anchor });

/* A labeled reaction arrow: the line, then the label centered above it. */
function step(x1, x2, y, s, opts = {}) {
  return arrow(P(x1, y), P(x2, y), { muted: opts.muted }) + tg((x1 + x2) / 2, y - 9, s);
}

/* ------------------------------------------------------------ species ---
   Each returns a molecule positioned by its key atom `p`. `hiH` marks the
   hydrogen that is about to leave (drawn highlighted). */

/* H–Cl, H on the left; Cl carries three lone pairs. */
const hcl = (p) => addH({ atoms: { Cl: { ...p, l: 'Cl' } }, bonds: [], lp: [['Cl', 270], ['Cl', 0], ['Cl', 90]] }, 'Cl', [180], [0], 40);
/* Chloride: four lone pairs, minus between two of them. */
const chloride = (p) => ({ atoms: { Cl: { ...p, l: 'Cl' } }, bonds: [], lp: [['Cl', 270], ['Cl', 0], ['Cl', 90], ['Cl', 180]], charges: [['Cl', '−', 315, 31]] });

/* Hydronium: H up-left, up-right, and down (the one that leaves); one lone
   pair up; + down-right. */
const hydronium = (p, hiDown = true) => addH({ atoms: { O: { ...p, l: 'O' } }, bonds: [], lp: [['O', 270]], charges: [['O', '+', 35, 29]] }, 'O', [210, 330, 90], hiDown ? [2] : []);
/* Water: H up-left and up-right, two lone pairs below at clearly different angles. */
const water = (p, hi = []) => addH({ atoms: { O: { ...p, l: 'O' } }, bonds: [], lp: [['O', 55], ['O', 125]] }, 'O', [210, 330], hi);
/* Hydroxide: H up-left, three lone pairs, minus. */
const hydroxide = (p) => addH({ atoms: { O: { ...p, l: 'O' } }, bonds: [], lp: [['O', 330], ['O', 55], ['O', 125]], charges: [['O', '−', 272, 27]] }, 'O', [210]);

/* Ammonium: H left, right, up, and down (the one that leaves); + up-right. */
const ammonium = (p, hiIdx = 3) => addH({ atoms: { N: { ...p, l: 'N' } }, bonds: [], charges: [['N', '+', 315, 30]] }, 'N', [180, 0, 270, 90], [hiIdx]);
/* Ammonia: H left, right, up; lone pair down (where the fourth H was). */
const ammonia = (p, hi = []) => addH({ atoms: { N: { ...p, l: 'N' } }, bonds: [], lp: [['N', 90]] }, 'N', [180, 0, 270], hi);
/* Amide ion: H left and right; lone pairs up and down; minus up-right. */
const amide = (p) => addH({ atoms: { N: { ...p, l: 'N' } }, bonds: [], lp: [['N', 270], ['N', 90]], charges: [['N', '−', 315, 28]] }, 'N', [180, 0]);

/* Acetic acid / acetate, skeletal. `p` is the carbonyl carbon. The methyl
   is down-left, C=O straight up, and the single-bonded O down-right. */
function acetic(p, form = 'acid') {
  const m = { atoms: {}, bonds: [], lp: [], charges: [] };
  m.atoms.me = at(p, 150, 34);
  m.atoms.c = { ...p };
  m.atoms.o1 = { ...at(p, 270, 38), l: 'O' };
  m.atoms.o2 = { ...at(p, 30, 38), l: 'O' };
  m.bonds.push(['me', 'c'], ['c', 'o1', 2], ['c', 'o2']);
  m.lp.push(['o1', 200], ['o1', 340]);
  if (form === 'acid') {
    addH(m, 'o2', [330], [0], 32);
    m.lp.push(['o2', 75], ['o2', 255]);
  } else {
    m.lp.push(['o2', 330], ['o2', 75], ['o2', 255]);
    m.charges.push(['o2', '−', 25, 28]);
  }
  return m;
}

/* A two-carbon skeleton ending in a heteroatom X at `p`: the CH2 vertex is
   up-left of X and the CH3 vertex down-left of that. */
function ethylX(p, X) {
  const m = { atoms: {}, bonds: [], lp: [], charges: [] };
  m.atoms.x = { ...p, l: X };
  m.atoms.b = at(p, 210, 40);
  m.atoms.a = at(m.atoms.b, 150, 40);
  m.bonds.push(['a', 'b'], ['b', 'x']);
  return m;
}

/* =================================================== conj-pair-examples ===
   Four acids, each beside its conjugate base, with the leaving H highlighted
   and the lone pair it leaves behind drawn in the base. */
FIGURES.push({
  id: 'conj-pair-examples',
  section: 'conjugate',
  anchor: '<!-- conj-pair-examples -->',
  lessons: ['conjugate'],
  alt: 'Four rows, each an acid on the left and its conjugate base on the right, joined by an arrow labeled minus H plus. HCl becomes chloride ion with four lone pairs and a negative charge. Hydronium ion, H3O plus, becomes neutral water. Ammonium ion, NH4 plus, becomes neutral ammonia with a lone pair. Acetic acid becomes acetate ion with a negative charge on oxygen. In each acid the hydrogen that leaves is highlighted.',
  viewBox: '0 0 340 400',
  build() {
    let s = '';
    const ax = 88, bx = 268;
    s += tg(ax, 20, 'acid');
    s += tg(bx, 20, 'conjugate base');

    let y = 66;
    s += mol(hcl(P(ax + 20, y)));
    s += step(150, 206, y, '−H⁺');
    s += mol(chloride(P(bx, y)));
    s += rule(16, y + 40, 324, y + 40);

    y = 150;
    s += mol(hydronium(P(ax, y - 6)));
    s += step(150, 206, y, '−H⁺');
    s += mol(water(P(bx, y - 6)));
    s += rule(16, y + 44, 324, y + 44);

    y = 244;
    s += mol(ammonium(P(ax, y)));
    s += step(150, 206, y, '−H⁺');
    s += mol(ammonia(P(bx, y)));
    s += rule(16, y + 48, 324, y + 48);

    y = 350;
    s += mol(acetic(P(ax - 22, y), 'acid'));
    s += step(150, 206, y, '−H⁺');
    s += mol(acetic(P(bx - 26, y), 'base'));
    return s;
  },
  caption: 'In each row the highlighted hydrogen leaves as H⁺. The electron pair that held it stays behind as a lone pair, so every charge on the right is one lower than the charge beside it on the left.',
});

/* ===================================================== amphoteric-water ===
   Water in the middle: + H⁺ up to hydronium, − H⁺ down to hydroxide. */
FIGURES.push({
  id: 'amphoteric-water',
  section: 'conjugate',
  anchor: '<!-- amphoteric-water -->',
  lessons: ['conjugate'],
  alt: 'Water drawn in the middle. An arrow labeled plus H plus leads up to hydronium ion, H3O plus, where the new hydrogen sits on one of water\'s lone pairs. An arrow labeled minus H plus leads down to hydroxide ion, HO minus, with three lone pairs. Tags say water acts as a base going up and as an acid going down.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    const x = 116, tx = 172;
    /* hydronium, top: the new H points down, toward the water it came from */
    s += mol(hydronium(P(x, 52)));
    s += good(tx, 40, 'hydronium, H₃O⁺', 'start');
    s += tg(tx, 58, 'conjugate acid of water', 'start');

    /* arrow up: water gains a proton */
    s += arrow(P(44, 196), P(44, 110));
    s += tg(36, 158, '+H⁺', 'end');

    s += mol(water(P(x, 164)));
    s += good(tx, 160, 'water, H₂O', 'start');
    s += tg(tx, 178, 'a base going up,', 'start');
    s += tg(tx, 194, 'an acid going down', 'start');

    /* arrow down: water loses a proton */
    s += arrow(P(44, 214), P(44, 290));
    s += tg(36, 256, '−H⁺', 'end');

    s += mol(hydroxide(P(x, 282)));
    s += good(tx, 276, 'hydroxide, HO⁻', 'start');
    s += tg(tx, 294, 'conjugate base of water', 'start');
    return s;
  },
  caption: 'Hydronium and hydroxide sit two protons apart, with water between them, so they are not a conjugate pair.',
});

/* =========================================================== four-roles ===
   CH3COOH + NH3 ⇌ CH3COO− + NH4+, stacked so that each conjugate pair is a
   column: the reactants on top, the products underneath. */
FIGURES.push({
  id: 'four-roles',
  section: 'conjugate',
  anchor: '<!-- four-roles -->',
  lessons: ['conjugate'],
  alt: 'Acetic acid plus ammonia on the top row, an equilibrium arrow pointing down and up, and acetate plus ammonium on the bottom row. Acetic acid sits above acetate in a shaded column labeled pair 1; ammonia sits above ammonium in a second shaded column labeled pair 2. The labels read acid and base on top, conjugate base and conjugate acid below.',
  viewBox: '0 0 340 350',
  build() {
    let s = '';
    s += panel(12, 12, 146, 326);
    s += panel(206, 12, 122, 326);
    s += tg(85, 32, 'pair 1');
    s += tg(267, 32, 'pair 2');

    const top = 100, bot = 262;
    s += mol(acetic(P(72, top), 'acid'));
    s += lbl(182, top + 5, '+');
    s += mol(ammonia(P(267, top - 10)));
    s += warn(85, top + 56, 'acid');
    s += warn(267, top + 56, 'base');

    /* equilibrium: a down arrow and an up arrow side by side */
    s += arrow(P(176, 168), P(176, 212));
    s += arrow(P(188, 212), P(188, 168));

    s += mol(acetic(P(72, bot), 'base'));
    s += lbl(182, bot + 5, '+');
    s += mol(ammonium(P(267, bot - 14)));
    s += good(85, bot + 62, 'conjugate base', 'middle');
    s += good(267, bot + 62, 'conjugate acid', 'middle');
    return s;
  },
  caption: 'Read each pair down its column: acetic acid above acetate, ammonia above ammonium. The highlighted hydrogen is the one that moves. Acetate and ammonia also sit on opposite sides of the arrow, but they are different molecules, not one molecule with and without a proton.',
});

/* ====================================================== acid-base-ladder ===
   Four conjugate pairs ranked: acids weaken going down, bases strengthen. */
FIGURES.push({
  id: 'acid-base-ladder',
  section: 'conjugate',
  anchor: '<!-- acid-base-ladder -->',
  lessons: ['conjugate'],
  alt: 'A ranking of four conjugate pairs. Left column, acids from strongest to weakest: HCl, acetic acid, water, ammonia. Right column, their conjugate bases from weakest to strongest: chloride, acetate, hydroxide, amide ion. An arrow on the left points up, labeled stronger acid; an arrow on the right points down, labeled stronger base.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    const ax = 110, bx = 238;
    s += tg(ax, 22, 'acid');
    s += tg(bx, 22, 'conjugate base');
    const rows = [
      ['HCl', 'very strong acid', 'Cl⁻', 'barely basic'],
      ['CH₃COOH', 'weak acid', 'CH₃COO⁻', 'moderate base'],
      ['H₂O', 'very weak acid', 'HO⁻', 'strong base'],
      ['NH₃', 'extremely weak acid', '⁻NH₂', 'very strong base'],
    ];
    rows.forEach(([a, ad, b, bd], i) => {
      const y = 62 + i * 62;
      s += lbl(ax, y, a);
      s += mut(ax, y + 18, ad);
      s += arrow(P(ax + 64, y - 4), P(bx - 50, y - 4), { muted: true });
      s += lbl(bx, y, b);
      s += mut(bx, y + 18, bd);
      if (i < rows.length - 1) s += rule(44, y + 32, 304, y + 32);
    });
    /* left arrow: stronger acid, pointing up */
    s += arrow(P(24, 262), P(24, 44));
    s += warn(8, 288, '↑ stronger acid', 'start');
    /* right arrow: stronger base, pointing down */
    s += arrow(P(318, 44), P(318, 262));
    s += good(332, 288, 'stronger base ↓', 'end');
    return s;
  },
  caption: 'Each row is one conjugate pair. Read the left arrow for the acids and the right arrow for the bases.',
});

/* =================================================== strong-base-parents ===
   Four strong bases, each drawn beside the extremely weak acid it comes from. */
function diisopropyl(p, form) {
  /* N at p; the two isopropyl CH vertices up-left and up-right, each with
     one methyl out to the side and one straight up. */
  const m = { atoms: { n: { ...p, l: 'N' } }, bonds: [], lp: [], charges: [] };
  m.atoms.cl = at(p, 210, 32);
  m.atoms.cr = at(p, 330, 32);
  m.atoms.ml1 = at(m.atoms.cl, 150, 30);
  m.atoms.ml2 = at(m.atoms.cl, 270, 30);
  m.atoms.mr1 = at(m.atoms.cr, 30, 30);
  m.atoms.mr2 = at(m.atoms.cr, 270, 30);
  m.bonds.push(['n', 'cl'], ['n', 'cr'], ['cl', 'ml1'], ['cl', 'ml2'], ['cr', 'mr1'], ['cr', 'mr2']);
  m.lp.push(['n', 270]);
  if (form === 'acid') addH(m, 'n', [90], [0], 32);
  else { m.lp.push(['n', 90]); m.charges.push(['n', '−', 35, 27]); }
  return m;
}
function butyl(p, form) {
  /* four-carbon zigzag ending at p (the carbon that loses the H) */
  const m = { atoms: {}, bonds: [], lp: [], charges: [] };
  m.atoms.c1 = { ...p };
  m.atoms.c2 = at(p, 210, 30);
  m.atoms.c3 = at(m.atoms.c2, 150, 30);
  m.atoms.c4 = at(m.atoms.c3, 210, 30);
  m.bonds.push(['c1', 'c2'], ['c2', 'c3'], ['c3', 'c4']);
  if (form === 'acid') addH(m, 'c1', [330], [0], 30);
  else { m.lp.push(['c1', 0]); m.charges.push(['c1', '−', 310, 24]); }
  return m;
}

FIGURES.push({
  id: 'strong-base-parents',
  section: 'conjugate',
  anchor: '<!-- strong-base-parents -->',
  lessons: ['conjugate'],
  alt: 'Four rows, each an extremely weak acid on the left and the strong base made from it on the right, joined by an arrow labeled minus H plus. Diisopropylamine gives the diisopropylamide anion of LDA, with lithium ion. Ammonia gives amide ion of sodium amide, with sodium ion. Hydrogen, H2, gives hydride ion of sodium hydride, with sodium ion. Butane gives the butyl anion that butyllithium supplies, with lithium ion. The hydrogen that leaves is highlighted in each acid.',
  viewBox: '0 0 340 440',
  build() {
    let s = '';
    const ax = 80, bx = 250;
    s += tg(ax, 20, 'extremely weak acid');
    s += tg(bx, 20, 'very strong base');

    /* diisopropylamine → LDA */
    let y = 82;
    s += mol(diisopropyl(P(ax, y), 'acid'));
    s += step(146, 190, y, '−H⁺');
    s += mol(diisopropyl(P(bx, y), 'base'));
    s += lbl(bx + 72, y + 5, 'Li⁺');
    s += mut(ax, y + 60, 'diisopropylamine');
    s += good(bx, y + 60, 'in LDA');
    s += rule(16, y + 74, 324, y + 74);

    /* ammonia → amide ion */
    y = 212;
    s += mol(ammonia(P(ax, y - 6), [1]));
    s += step(146, 190, y, '−H⁺');
    s += mol(amide(P(bx, y - 6)));
    s += lbl(bx + 72, y - 1, 'Na⁺');
    s += mut(ax, y + 44, 'ammonia');
    s += good(bx, y + 44, 'in NaNH₂');
    s += rule(16, y + 56, 324, y + 56);

    /* H2 → hydride */
    y = 294;
    s += mol({ atoms: { h1: { ...P(ax - 22, y), l: 'H' }, h2: { ...P(ax + 22, y), l: 'H', k: 'hi' } }, bonds: [['h1', 'h2', 1, 'fg-bond-hi']] });
    s += step(146, 190, y, '−H⁺');
    s += mol({ atoms: { h: { ...P(bx, y), l: 'H' } }, bonds: [], lp: [['h', 180]], charges: [['h', '−', 315, 24]] });
    s += lbl(bx + 72, y + 5, 'Na⁺');
    s += mut(ax, y + 34, 'hydrogen, H₂');
    s += good(bx, y + 34, 'in NaH');
    s += rule(16, y + 48, 324, y + 48);

    /* butane → butyl anion */
    y = 382;
    s += mol(butyl(P(ax + 14, y), 'acid'));
    s += step(146, 190, y, '−H⁺');
    s += mol(butyl(P(bx + 20, y), 'base'));
    s += lbl(bx + 72, y + 5, 'Li⁺');
    s += mut(ax, y + 44, 'butane');
    s += good(bx, y + 44, 'in butyllithium');
    return s;
  },
  caption: 'The highlighted hydrogen is the proton each acid would lose. The metal ion only balances the charge. Butyllithium really has a polar C–Li bond rather than a free anion, but it reacts as if it carried the butyl anion.',
});

/* ==================================================== organic-conjugates ===
   Ethanol and ethylamine, each with its conjugate acid (left) and conjugate
   base (right). The proton is added at a lone pair and removed from an X–H. */
FIGURES.push({
  id: 'organic-conjugates',
  section: 'conjugate',
  anchor: '<!-- organic-conjugates -->',
  alt: 'Two rows. Top row: ethanol in the middle; an arrow labeled plus H plus leads left to its conjugate acid, CH3CH2OH2 plus, with the new hydrogen on oxygen highlighted; an arrow labeled minus H plus leads right to its conjugate base, ethoxide, with three lone pairs on a negatively charged oxygen. Bottom row: ethylamine in the middle; plus H plus leads left to the ethylammonium ion; minus H plus leads right to the amide anion CH3CH2NH minus with two lone pairs.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const L = 150, M = 400, R = 650;
    s += warn(L - 20, 24, 'conjugate acid');
    s += tg(M - 20, 24, 'the neutral molecule');
    s += good(R - 20, 24, 'conjugate base');

    const row = (y, X, name, parts) => {
      let g = '';
      g += mol(parts.acid(ethylX(P(L, y), X)));
      g += step(M - 110, L + 70, y, '+H⁺');
      g += mol(parts.mid(ethylX(P(M, y), X)));
      g += step(M + 70, R - 110, y, '−H⁺');
      g += mol(parts.base(ethylX(P(R, y), X)));
      g += lbl(L - 20, y + 62, parts.names[0]);
      g += lbl(M - 20, y + 62, name);
      g += lbl(R - 20, y + 62, parts.names[1]);
      return g;
    };

    /* O: bond to carbon at 210. H at 330, lone pairs below. */
    s += row(96, 'O', 'ethanol', {
      mid: (m) => { addH(m, 'x', [330]); m.lp.push(['x', 60], ['x', 125]); return m; },
      acid: (m) => { addH(m, 'x', [330, 90], [1]); m.lp.push(['x', 270]); m.charges.push(['x', '+', 30, 29]); return m; },
      base: (m) => { m.lp.push(['x', 330], ['x', 90], ['x', 270]); m.charges.push(['x', '−', 30, 29]); return m; },
      names: ['an oxonium ion', 'ethoxide ion'],
    });

    s += rule(30, 188, 730, 188);

    /* N: bond to carbon at 210. Ethylamine: H at 330 and 90, lone pair up. */
    s += row(246, 'N', 'ethylamine', {
      mid: (m) => { addH(m, 'x', [330, 90]); m.lp.push(['x', 270]); return m; },
      acid: (m) => { addH(m, 'x', [330, 90, 270], [2]); m.charges.push(['x', '+', 30, 29]); return m; },
      base: (m) => { addH(m, 'x', [330]); m.lp.push(['x', 90], ['x', 270]); m.charges.push(['x', '−', 30, 29]); return m; },
      names: ['an ammonium ion', 'an amide anion'],
    });
    return s;
  },
  caption: 'In each conjugate acid, the highlighted hydrogen has bonded to one of the neutral molecule’s lone pairs. Compare the lone pairs and the charge in each drawing with the neutral molecule in the middle.',
});

/* ====================================================== later-conjugates ===
   Preview: a ketone's conjugate acid and conjugate base, and a terminal
   alkyne's conjugate base. */
function acetone(p, form) {
  /* carbonyl vertex p, O straight up, methyls down-left and down-right. */
  const m = { atoms: {}, bonds: [], lp: [], charges: [] };
  m.atoms.c = { ...p };
  m.atoms.o = { ...at(p, 270, 38), l: 'O' };
  m.atoms.ml = at(p, 150, 36);
  m.atoms.mr = at(p, 30, 36);
  m.bonds.push(['c', 'o', 2], ['c', 'ml'], ['c', 'mr']);
  if (form === 'acid') {
    addH(m, 'o', [330], [0], 32);
    m.lp.push(['o', 200]);
    m.charges.push(['o', '+', 250, 27]);
  } else {
    m.lp.push(['o', 200], ['o', 340]);
  }
  if (form === 'base') {
    m.lp.push(['mr', 330]);
    m.charges.push(['mr', '−', 60, 20]);
  }
  return m;
}
function propyne(p, form) {
  /* linear: CH3 vertex, C≡C, then H (or the lone pair) at 180°. p is the end carbon. */
  const m = { atoms: {}, bonds: [], lp: [], charges: [] };
  m.atoms.c1 = { ...p };
  m.atoms.c2 = at(p, 180, 38);
  m.atoms.c3 = at(m.atoms.c2, 180, 38);
  m.bonds.push(['c3', 'c2'], ['c2', 'c1', 3]);
  if (form === 'acid') addH(m, 'c1', [0], [0], 32);
  else { m.lp.push(['c1', 0]); m.charges.push(['c1', '−', 300, 22]); }
  return m;
}

FIGURES.push({
  id: 'later-conjugates',
  section: 'conjugate',
  anchor: '<!-- later-conjugates -->',
  alt: 'Preview. Top row: acetone in the middle; plus H plus leads left to its conjugate acid, with a hydrogen on the carbonyl oxygen and a positive charge; minus H plus leads right to its conjugate base, with a lone pair and negative charge on a carbon next to the C=O, labeled enolate. Bottom row: propyne, a linear CH3-C≡C-H, loses its end hydrogen to give the acetylide ion, with a lone pair and negative charge on the end carbon.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const L = 150, M = 400, R = 650;
    s += warn(L, 24, 'conjugate acid');
    s += tg(M, 24, 'the neutral molecule');
    s += good(R, 24, 'conjugate base');

    let y = 110;
    s += mol(acetone(P(L, y), 'acid'));
    s += step(M - 90, L + 90, y, '+H⁺');
    s += mol(acetone(P(M, y), 'neutral'));
    s += step(M + 90, R - 90, y, '−H⁺');
    s += mol(acetone(P(R, y), 'base'));
    s += lbl(L, y + 56, 'protonated carbonyl');
    s += lbl(M, y + 56, 'acetone, a ketone');
    s += lbl(R, y + 56, 'enolate (preview)');

    s += rule(30, 190, 730, 190);

    y = 240;
    s += mol(propyne(P(M + 20, y), 'acid'));
    s += step(M + 90, R - 70, y, '−H⁺');
    s += mol(propyne(P(R + 36, y), 'base'));
    s += lbl(M - 20, y + 40, 'propyne, a terminal alkyne');
    s += lbl(R - 4, y + 40, 'acetylide (preview)');
    return s;
  },
  caption: 'The same one-proton operation on a ketone and on a terminal alkyne. The negative charge in the enolate is also shared with the oxygen by resonance; Enolate Chemistry draws both forms.',
});

export default FIGURES;
