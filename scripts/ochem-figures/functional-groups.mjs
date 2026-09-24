/* Figures for the functional-groups notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   This topic sits in Foundations, BEFORE skeletal structures are taught, so
   every drawing here is a full structural formula: every atom carries a
   label (C, H, O, N, or a CH₃/CH₂ group label, or R for "any carbon chain"),
   and nothing is a bare vertex or a zigzag. The benzene rings are Kekulé
   rings with all six carbons written in. */
import { atom, bond, lonePair, text, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers ---
   A small molecule drawer. `atoms` maps an id to {x, y, l (label), k (kind:
   'hi' | 'warn'), r (radius)}. Bonds stop at each atom's circle. Highlight
   blobs are drawn first, behind everything: a tinted disc behind each atom
   of a group and a tinted band along each of its bonds, so the group reads
   as one shaded shape without hiding any label. */
const rad = (a) => a.r ?? (a.l === 'H' ? 11 : a.l.length === 1 ? 14 : a.l.length === 2 ? 15 : 17);
const f2 = (v) => Math.round(v * 100) / 100;
const at = (p, deg, len) => P(p.x + Math.cos(deg * Math.PI / 180) * len, p.y + Math.sin(deg * Math.PI / 180) * len);

function band(a, b, w, cls) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const px = -dy / L * w, py = dx / L * w;
  return `<path class="${cls}" d="M${f2(a.x + px)} ${f2(a.y + py)} L${f2(b.x + px)} ${f2(b.y + py)} L${f2(b.x - px)} ${f2(b.y - py)} L${f2(a.x - px)} ${f2(a.y - py)} Z"></path>`;
}

function mol(m) {
  const A = m.atoms;
  let back = '', s = '';
  for (const h of m.hl || []) {
    const cls = `fg-panel-${h.kind || 'hi'}`;
    for (const [a, b] of h.bonds || []) back += band(A[a], A[b], h.w ?? 17, cls);
    for (const id of h.atoms) back += `<circle class="${cls}" cx="${f2(A[id].x)}" cy="${f2(A[id].y)}" r="${h.r ?? 23}"></circle>`;
  }
  for (const [a, b, order = 1, cls] of m.bonds) {
    s += bond(A[a], A[b], { order, cls, rFrom: rad(A[a]), rTo: rad(A[b]) });
  }
  for (const [id, ang, dist] of m.lp || []) s += lonePair(A[id].x, A[id].y, ang, dist ? { dist } : {});
  for (const id of Object.keys(A)) {
    const a = A[id];
    s += atom(a.x, a.y, a.l, { kind: a.k, r: rad(a) });
  }
  for (const [id, sign, ang, dist = 24] of m.charges || []) {
    const p = at(A[id], ang, dist);
    s += text(p.x, p.y + 5, sign, { cls: sign === '+' ? 'fg-tag' : 'fg-tag-warn', size: 14 });
  }
  return back + s;
}

/* A benzene ring as six labelled carbons with alternating double bonds (a
   Kekulé drawing). `rot` is the angle of vertex 0 from the centre. Returns
   the atoms and bonds to merge into a mol() spec, keyed r0..r5, and a list of
   the vertex angles so substituents can be sent straight outward. */
function ring(cx, cy, R, rot, opts = {}) {
  const atoms = {}, bonds = [], angle = [];
  for (let i = 0; i < 6; i++) {
    const a = rot + 60 * i;
    angle.push(a);
    const p = at(P(cx, cy), a, R);
    atoms['r' + i] = { x: p.x, y: p.y, l: 'C', r: opts.r ?? 13, k: opts.kind };
  }
  for (let i = 0; i < 6; i++) bonds.push(['r' + i, 'r' + ((i + 1) % 6), i % 2 === 0 ? 2 : 1]);
  return { atoms, bonds, angle };
}

/* Hydrogens on every ring carbon not listed in `skip`. */
function ringH(rg, skip, len = 38, hr) {
  const atoms = {}, bonds = [];
  for (let i = 0; i < 6; i++) {
    if (skip.includes(i)) continue;
    const p = at(rg.atoms['r' + i], rg.angle[i], len);
    atoms['h' + i] = { x: p.x, y: p.y, l: 'H', r: hr };
    bonds.push(['r' + i, 'h' + i]);
  }
  return { atoms, bonds };
}

/* A hexagonal tint behind a ring, used to mark "this is the aromatic ring". */
function ringTint(cx, cy, R, rot, cls = 'fg-panel-good') {
  const pts = [];
  for (let i = 0; i < 6; i++) { const p = at(P(cx, cy), rot + 60 * i, R); pts.push(`${f2(p.x)} ${f2(p.y)}`); }
  return `<path class="${cls}" d="M${pts.join(' L')} Z"></path>`;
}

const title = (x, y, s) => text(x, y, s, { cls: 'fg-lbl', size: 12.5 });
const good = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-tag-good', size: 10.5, ...o });
const small = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-sm', size: 10, ...o });

/* ------------------------------------------------------ condensed-read ---
   The third notation convention (an O written straight after a carbonyl
   carbon is the double-bonded one) is a claim about which atom is bonded to
   which, so it is drawn: each condensed formula above its full structure. */
FIGURES.push({
  id: 'condensed-read',
  section: 'functional-groups',
  anchor: '<h3>First: reading the notation</h3>',
  viewBox: '0 0 760 250',
  alt: 'Three condensed formulas, each drawn out beneath it. CH3COOH is a carbon bonded to a CH3, double-bonded to one oxygen and single-bonded to a second oxygen that carries the H. CH3COOCH3 is the same carbon with the second oxygen carrying a CH3. CH3CHO is a carbon bonded to a CH3, double-bonded to an oxygen, and carrying an H of its own.',
  build() {
    let s = '';
    const panels = [
      { f: 'CH₃COOH', right: 'O', tail: 'H', l1: 'first O: double bond to C', l2: 'second O: carries the H' },
      { f: 'CH₃COOCH₃', right: 'O', tail: 'CH₃', l1: 'first O: double bond to C', l2: 'second O: joins C to CH₃' },
      { f: 'CH₃CHO', right: 'H', tail: null, l1: 'the H sits on the carbon', l2: 'the O has no H: not an OH' },
    ];
    panels.forEach((p, i) => {
      const x = 14 + i * 248, cx = x + 118;
      s += panel(x, 16, 236, 222);
      s += title(cx, 40, p.f);
      const C = P(cx - 16, 146);
      const A = {
        C: { ...C, l: 'C', k: 'hi' },
        M: { ...at(C, 210, 50), l: 'CH₃' },
        Od: { ...at(C, 270, 50), l: 'O', k: 'hi' },
      };
      const B = [['C', 'M'], ['C', 'Od', 2]];
      const lp = [['Od', 210], ['Od', 330]];
      if (p.right === 'O') {
        A.Os = { ...at(C, 330, 50), l: 'O', k: 'warn' };
        B.push(['C', 'Os']);
        A.T = { ...at(A.Os, 30, p.tail === 'H' ? 40 : 50), l: p.tail };
        B.push(['Os', 'T']);
        lp.push(['Os', 270], ['Os', 90]);
      } else {
        A.H = { ...at(C, 330, 44), l: 'H', k: 'warn' };
        B.push(['C', 'H']);
      }
      s += mol({ atoms: A, bonds: B, lp });
      s += good(cx, 206, p.l1);
      s += good(cx, 224, p.l2);
    });
    return s;
  },
  caption: 'Each condensed formula drawn out. In CH₃COOH and CH₃COOCH₃ the first O after the carbonyl carbon is the double-bonded one, and the second O (circled in coral) continues the chain. In CH₃CHO the atom after the C is an H on that carbon.',
});

/* ---------------------------------------------------- benzene-notation ---
   C6H5– and –C6H4– are a ring described in words. Draw it: benzene with
   every C and H, the same ring with one H swapped for a CH3, and the same
   ring with two H swapped for Cl in each of the three ways two carbons of a
   ring can be related. */
/* One benzene panel. `type` is 'benzene', 'toluene', or the index (1, 2, 3)
   of the second Cl for ortho, meta and para. `g` holds the ring geometry, so
   the same panel can be drawn full size for the notes and compact for the
   phone-width lesson. `txt` is [title, subtitle, tag, note]. */
const BZ = {
  wide:   { R: 44, cr: 13, hl: 38, hr: 11, xl: 42, ml: 50, num: 23 },
  narrow: { R: 38, cr: 12, hl: 33, hr: 10, xl: 38, ml: 44, num: 20 },
};
function benzenePanel(type, x, y, w, h, g, txt, sideLabel) {
  let s = panel(x, y, w, h);
  const cx = x + w / 2;
  s += title(cx, y + 22, txt[0]);
  if (txt[1]) s += small(cx, y + 38, txt[1]);
  const top0 = y + (txt[1] ? 46 : 34), bot0 = y + h - 44;
  const Hx = g.R + g.hl + g.hr, Xx = g.R + g.xl + 14, Mx = g.R + g.ml + 17;
  const T = type === 'benzene' ? Hx : type === 'toluene' ? Mx : Xx;
  const Bm = type === 3 ? Xx : Hx;
  const cy = (top0 + T + bot0 - Bm) / 2;
  const rg = ring(cx, cy, g.R, -90, { r: g.cr });
  const skip = type === 'benzene' ? [] : type === 'toluene' ? [0] : [0, type];
  const hs = ringH(rg, skip, g.hl, g.hr);
  const A = { ...rg.atoms, ...hs.atoms }, B = [...rg.bonds, ...hs.bonds];
  if (type === 'toluene') {
    rg.atoms.r0.k = 'hi';
    A.M = { ...at(rg.atoms.r0, -90, g.ml), l: 'CH₃', k: 'warn' };
    B.push(['r0', 'M', 1, 'fg-bond-hi']);
    if (sideLabel) s += text(A.M.x + 26, A.M.y + 4, sideLabel, { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
  } else if (type !== 'benzene') {
    for (const k of [0, type]) {
      rg.atoms['r' + k].k = 'hi';
      A['x' + k] = { ...at(rg.atoms['r' + k], rg.angle[k], g.xl), l: 'Cl', k: 'warn' };
      B.push(['r' + k, 'x' + k]);
    }
  }
  s += mol({ atoms: A, bonds: B });
  if (typeof type === 'number') {
    // Ring numbers inside the ring, counted from the first Cl.
    for (let k = 0; k < 6; k++) {
      const p = at(P(cx, cy), -90 + 60 * k, g.num);
      s += text(p.x, p.y + 4, String(k + 1), { cls: 'fg-tag', size: 10 });
    }
  }
  s += good(cx, y + h - 24, txt[2]);
  if (txt[3]) s += small(cx, y + h - 8, txt[3]);
  return s;
}

const BENZ_ALT = 'Benzene drawn as a six-membered ring of carbons with alternating single and double bonds and one H on each carbon, labeled C6H6. The same ring with the top H replaced by a CH3 group, labeled C6H5–CH3, five H left. Then three rings, each with two chlorines replacing two hydrogens, four H left, labeled Cl–C6H4–Cl: the chlorines on neighboring carbons (ortho, 1,2), on carbons one apart (meta, 1,3), and on opposite carbons (para, 1,4). The ring carbons in those three are numbered 1 to 6 starting from the first chlorine.';

FIGURES.push({
  id: 'benzene-notation',
  section: 'functional-groups',
  anchor: '<h3>The groups this course uses</h3>',
  viewBox: '0 0 760 600',
  alt: BENZ_ALT,
  build() {
    const g = BZ.wide;
    let s = '';
    s += benzenePanel('benzene', 14, 16, 360, 276, g, ['benzene, C₆H₆', null, '6 carbons in a ring, one H on each', 'single and double bonds alternate']);
    s += benzenePanel('toluene', 386, 16, 360, 276, g, ['C₆H₅–CH₃: one H removed', null, 'five H left: C₆H₅, one group attached', null], 'where the sixth H was');
    [[1, 'ortho: 1,2', 'neighboring carbons'], [2, 'meta: 1,3', 'one carbon between them'], [3, 'para: 1,4', 'straight across the ring']]
      .forEach(([k, n, l], i) => { s += benzenePanel(k, 14 + i * 250, 306, 234, 284, g, ['Cl–C₆H₄–Cl, ' + n, null, 'four H left', l]); });
    return s;
  },
  caption: 'Every ring carbon is written as C, and the hydrogens are counted. Six H is benzene itself. Five H means one H has been swapped for a group. Four H means two groups, and the formula alone does not say which two carbons carry them: the three Cl–C₆H₄–Cl panels show the three possibilities, numbered around the ring from the first Cl.',
});

FIGURES.push({
  id: 'benzene-notation-m',
  lessons: ['functional-groups'],
  viewBox: '0 0 360 842',
  alt: BENZ_ALT,
  build() {
    const g = BZ.narrow, h = 272;
    let s = '';
    s += benzenePanel('benzene', 4, 4, 172, h, g, ['benzene, C₆H₆', null, '6 C in a ring, 1 H on each', 'double bonds alternate']);
    s += benzenePanel('toluene', 184, 4, 172, h, g, ['C₆H₅–CH₃', null, 'five H left: C₆H₅–', 'CH₃ where the 6th H was']);
    s += benzenePanel(1, 4, 284, 172, h, g, ['ortho: 1,2', 'Cl–C₆H₄–Cl', 'four H left', 'neighboring carbons']);
    s += benzenePanel(2, 184, 284, 172, h, g, ['meta: 1,3', 'Cl–C₆H₄–Cl', 'four H left', 'one carbon between']);
    s += benzenePanel(3, 94, 564, 172, h, g, ['para: 1,4', 'Cl–C₆H₄–Cl', 'four H left', 'straight across']);
    return s;
  },
  caption: 'Every ring carbon is written as C, and the hydrogens are counted. Six H is benzene itself. Five H means one H has been swapped for a group. Four H means two groups, and the formula alone does not say which two carbons carry them: the three Cl–C₆H₄–Cl panels show the three possibilities, numbered around the ring from the first Cl.',
});

/* ---------------------------------------------- groups-multiple-bonds ---
   The hydrocarbon rows of the table, plus the nitrile, drawn atom by atom:
   the alkane has no group at all, and each of the others is a multiple
   bond. */
FIGURES.push({
  id: 'groups-multiple-bonds',
  section: 'functional-groups',
  anchor: '<h3>The groups this course uses</h3>',
  viewBox: '0 0 760 452',
  alt: 'Four panels with every atom drawn. Alkane: propane, three carbons in a row with eight hydrogens, only C–C and C–H bonds, so no functional group. Alkene: ethylene, two carbons joined by a highlighted double bond, each carrying two H. Alkyne: acetylene, H–C triple bond C–H in a straight line, the triple bond highlighted. Nitrile: acrylonitrile, CH2=CH–C triple bond N, with the carbon–nitrogen triple bond highlighted and a lone pair on the nitrogen; a tag notes that its C=C is also an alkene group.',
  build() {
    let s = '';
    const box = (x, y, name, ex) => {
      s += panel(x, y, 360, 206);
      s += title(x + 180, y + 24, name);
      s += small(x + 180, y + 42, ex);
    };
    // Alkane: propane with all eight H.
    {
      const x = 14, y = 16, cy = y + 112, cx = x + 180;
      box(x, y, 'Alkane', 'propane, CH₃CH₂CH₃');
      const C1 = P(cx - 62, cy), C2 = P(cx, cy), C3 = P(cx + 62, cy);
      const A = { a: { ...C1, l: 'C' }, b: { ...C2, l: 'C' }, c: { ...C3, l: 'C' } };
      const B = [['a', 'b'], ['b', 'c']];
      const hs = [['a', 270], ['a', 90], ['a', 180], ['b', 270], ['b', 90], ['c', 270], ['c', 90], ['c', 0]];
      hs.forEach(([id, ang], i) => { A['h' + i] = { ...at(A[id], ang, 42), l: 'H' }; B.push([id, 'h' + i]); });
      s += mol({ atoms: A, bonds: B });
      s += text(cx, y + 196, 'only C–C and C–H bonds: no group', { cls: 'fg-tag-mut', size: 10.5 });
    }
    // Alkene: ethylene.
    {
      const x = 386, y = 16, cy = y + 112, cx = x + 180;
      box(x, y, 'Alkene', 'ethylene, CH₂=CH₂');
      const A = { a: { x: cx - 30, y: cy, l: 'C', k: 'hi' }, b: { x: cx + 30, y: cy, l: 'C', k: 'hi' } };
      const B = [['a', 'b', 2, 'fg-bond-hi']];
      [['a', 150], ['a', 210], ['b', 30], ['b', 330]].forEach(([id, ang], i) => { A['h' + i] = { ...at(A[id], ang, 44), l: 'H' }; B.push([id, 'h' + i]); });
      s += mol({ atoms: A, bonds: B, hl: [{ atoms: ['a', 'b'], bonds: [['a', 'b']] }] });
      s += good(cx, y + 196, 'the C=C double bond is the group');
    }
    // Alkyne: acetylene.
    {
      const x = 14, y = 234, cy = y + 116, cx = x + 180;
      box(x, y, 'Alkyne', 'acetylene, HC≡CH');
      const A = {
        a: { x: cx - 30, y: cy, l: 'C', k: 'hi' }, b: { x: cx + 30, y: cy, l: 'C', k: 'hi' },
        h1: { x: cx - 76, y: cy, l: 'H' }, h2: { x: cx + 76, y: cy, l: 'H' },
      };
      s += mol({ atoms: A, bonds: [['a', 'b', 3, 'fg-bond-hi'], ['a', 'h1'], ['b', 'h2']], hl: [{ atoms: ['a', 'b'], bonds: [['a', 'b']] }] });
      s += good(cx, y + 196, 'the C≡C triple bond is the group');
    }
    // Nitrile: acrylonitrile, CH2=CH–C≡N.
    {
      const x = 386, y = 234, cx = x + 180, cy = y + 106;
      box(x, y, 'Nitrile', 'acrylonitrile, CH₂=CHCN');
      const C1 = P(cx - 96, cy + 12), C2 = at(C1, -30, 50), C3 = at(C2, 30, 50), N = at(C3, 30, 64);
      const A = {
        a: { ...C1, l: 'C' }, b: { ...C2, l: 'C' }, c: { ...C3, l: 'C', k: 'hi' }, n: { ...N, l: 'N', k: 'hi' },
        h1: { ...at(C1, 90, 40), l: 'H' }, h2: { ...at(C1, 210, 40), l: 'H' }, h3: { ...at(C2, 270, 40), l: 'H' },
      };
      s += mol({
        atoms: A,
        bonds: [['a', 'b', 2], ['b', 'c'], ['c', 'n', 3, 'fg-bond-hi'], ['a', 'h1'], ['a', 'h2'], ['b', 'h3']],
        lp: [['n', 30]],
        hl: [{ atoms: ['c', 'n'], bonds: [['c', 'n']] }],
      });
      s += good(cx, y + 196, 'the C≡N is the group (its C=C is an alkene)');
    }
    return s;
  },
  caption: 'Three hydrocarbons and the nitrile, every atom drawn. Propane has nothing to highlight. In the other three the group is a double or triple bond, shown shaded.',
});

/* ------------------------------------------------ groups-single-bonds ---
   Carbon single-bonded to a halogen, O, S or N. Each one drawn with its
   lone pairs, because the lone pairs are half the reason the group reacts. */
FIGURES.push({
  id: 'groups-single-bonds',
  section: 'functional-groups',
  anchor: '<h3>The groups this course uses</h3>',
  viewBox: '0 0 760 420',
  alt: 'Top row, four panels: alkyl halide R–X with three lone pairs on X; alcohol R–O–H with two lone pairs on the bent oxygen; ether R–O–R prime with two lone pairs on the oxygen; thiol R–S–H with two lone pairs on sulfur. The heteroatom is shaded in each. Bottom panel: three amines, each a nitrogen with one lone pair: R–NH2 with one carbon on N, R2NH with two, R3N with three.',
  build() {
    let s = '';
    const top = [
      { name: 'Alkyl halide', ex: 'e.g. CH₂Cl₂', ex2: 'X = F, Cl, Br or I', X: 'X', tail: null },
      { name: 'Alcohol', ex: 'e.g. CH₃CH₂OH', X: 'O', tail: 'H' },
      { name: 'Ether', ex: 'e.g. CH₃CH₂OCH₂CH₃', X: 'O', tail: 'R′' },
      { name: 'Thiol', ex: 'e.g. CH₃CH₂SH', X: 'S', tail: 'H' },
    ];
    top.forEach((t, i) => {
      const x = 14 + i * 186, cx = x + 88, cy = 112;
      s += panel(x, 16, 176, 190);
      s += title(cx, 40, t.name);
      const A = {}, B = [], lp = [];
      if (!t.tail) {
        A.r = { x: cx - 34, y: cy, l: 'R' }; A.x = { x: cx + 22, y: cy, l: t.X, k: 'hi' };
        B.push(['r', 'x']);
        lp.push(['x', 270], ['x', 0], ['x', 90]);
      } else {
        A.x = { x: cx, y: cy - 10, l: t.X, k: 'hi' };
        A.r = { ...at(A.x, 150, 50), l: 'R' };
        A.t = { ...at(A.x, 30, t.tail === 'H' ? 42 : 50), l: t.tail };
        B.push(['r', 'x'], ['x', 't']);
        lp.push(['x', 225], ['x', 315]);
      }
      s += mol({ atoms: A, bonds: B, lp, hl: [{ atoms: ['x'] }] });
      s += small(cx, 172, t.ex);
      if (t.ex2) s += small(cx, 188, t.ex2);
    });
    // Amines.
    {
      const y = 218;
      s += panel(14, y, 732, 190);
      s += title(380, y + 24, 'Amine: a nitrogen with one lone pair and one, two or three carbons');
      const forms = [
        { subs: ['R', 'H', 'H'], f: 'R–NH₂', l: 'one carbon on N', ex: 'e.g. CH₃NH₂' },
        { subs: ['R', 'R′', 'H'], f: 'R₂NH', l: 'two carbons on N', ex: 'e.g. (CH₃)₂NH' },
        { subs: ['R', 'R′', 'R″'], f: 'R₃N', l: 'three carbons on N', ex: 'e.g. (CH₃)₃N' },
      ];
      forms.forEach((fm, i) => {
        const cx = 140 + i * 240, N = P(cx, y + 92);
        const A = { n: { ...N, l: 'N', k: 'hi' } }, B = [];
        [210, 330, 90].forEach((ang, j) => {
          A['s' + j] = { ...at(N, ang, fm.subs[j] === 'H' ? 42 : 48), l: fm.subs[j] };
          B.push(['n', 's' + j]);
        });
        s += mol({ atoms: A, bonds: B, lp: [['n', 270]], hl: [{ atoms: ['n'] }] });
        s += good(cx, y + 164, fm.f + ': ' + fm.l);
        s += small(cx, y + 180, fm.ex);
      });
    }
    return s;
  },
  caption: 'Carbon single-bonded to a halogen, oxygen, sulfur or nitrogen. R, R′ and R″ each stand for a carbon chain. The shaded atom is the group, and its lone pairs are drawn: three on a halogen, two on O or S, one on N.',
});

/* --------------------------------------------------- groups-ring-nitro ---
   Phenol and the nitro group, the two rows whose condensed formulas hide the
   most. The nitro panel carries its formal-charge arithmetic. */
FIGURES.push({
  id: 'groups-ring-nitro',
  section: 'functional-groups',
  anchor: '<h3>The groups this course uses</h3>',
  viewBox: '0 0 760 318',
  alt: 'Left: phenol, a benzene ring with every carbon and hydrogen drawn, carrying an O–H directly on one ring carbon; the ring is shaded as the aromatic ring and the OH as the phenol group. Right: the nitro group, R bonded to a nitrogen that is double-bonded to one oxygen and single-bonded to another. The nitrogen carries a plus charge and the single-bonded oxygen, with three lone pairs, a minus charge. Notes beneath give the formal-charge count for each atom.',
  build() {
    let s = '';
    // Phenol.
    {
      const x = 14, cx = x + 180, cy = 184, R = 44;
      s += panel(x, 16, 360, 290);
      s += title(cx, 40, 'Phenol: an OH on a ring carbon');
      const rg = ring(cx, cy, R, -90), hs = ringH(rg, [0]);
      const O = at(rg.atoms.r0, -90, 46), H = at(O, -30, 38);
      const A = { ...rg.atoms, ...hs.atoms, o: { ...O, l: 'O', k: 'hi' }, hh: { ...H, l: 'H' } };
      s += ringTint(cx, cy, R + 20, -90);
      s += mol({ atoms: A, bonds: [...rg.bonds, ...hs.bonds, ['r0', 'o'], ['o', 'hh']], lp: [['o', 140], ['o', 230]], hl: [{ atoms: ['o', 'hh'], bonds: [['o', 'hh']] }] });
      s += text(cx - 72, 94, 'phenol OH', { cls: 'fg-tag', size: 11, anchor: 'end' });
      s += good(cx, 294, 'shaded hexagon: the aromatic ring');
    }
    // Nitro.
    {
      const x = 386, cx = x + 180;
      s += panel(x, 16, 360, 290);
      s += title(cx, 40, 'Nitro group, R–NO₂');
      const N = P(cx - 20, 140);
      const A = {
        n: { ...N, l: 'N', k: 'hi' },
        r: { ...at(N, 180, 56), l: 'R' },
        o1: { ...at(N, -60, 54), l: 'O', k: 'hi' },
        o2: { ...at(N, 60, 54), l: 'O', k: 'warn' },
      };
      s += mol({
        atoms: A,
        bonds: [['n', 'r'], ['n', 'o1', 2], ['n', 'o2']],
        lp: [['o1', 240], ['o1', 0], ['o2', 330], ['o2', 60], ['o2', 150]],
        charges: [['n', '+', 0, 24], ['o2', '−', 15, 34]],
        hl: [{ atoms: ['n', 'o1', 'o2'], bonds: [['n', 'o1'], ['n', 'o2']] }],
      });
      s += good(cx, 244, 'N: 4 bonds, no lone pair → +1');
      s += good(cx, 262, 'lower O: 1 bond, 3 lone pairs → −1');
      s += small(cx, 280, 'upper O: 2 bonds, 2 lone pairs → 0; total 0');
    }
    return s;
  },
  caption: 'Phenol: the OH is bonded straight to a carbon of the ring. The nitro group is drawn with both of its formal charges: the plus on nitrogen and the minus on the single-bonded oxygen always come together.',
});

/* ----------------------------------------------------------------- 61 ---
   The carbonyl family, drawn as seven copies of the same C=O with one atom
   swapped. The carbon and the oxygen are identical in every panel and the
   only thing that moves is the highlighted atom on the right, which carries
   its own lone pairs. Lewis drawing only, since this sits in Foundations
   before skeletal notation. Drawn wide for the notes and as a two-column
   stack for the phone-width lesson. */
const CARB = [
  { name: 'Aldehyde',        X: 'H',   what: 'attached: H',               lp: [] },
  { name: 'Ketone',          X: 'R′',  what: 'attached: a second carbon', lp: [] },
  { name: 'Carboxylic acid', X: 'OH',  what: 'attached: OH',              lp: [335, 95] },
  { name: 'Ester',           X: 'OR′', what: 'attached: O–carbon',        lp: [335, 95] },
  { name: 'Amide',           X: 'NH₂', what: 'attached: N',               lp: [95], more: 'NH₂, NHR′ or NR′₂' },
  { name: 'Acid chloride',   X: 'Cl',  what: 'attached: Cl',              lp: [305, 35, 125] },
];
function carbonyl(cx, cy, c) {
  const C = P(cx, cy), O = P(cx, cy - 54), R = P(cx - 48, cy + 34), Xp = P(cx + 48, cy + 34);
  let g = '';
  g += bond(C, O, { order: 2, rFrom: 16, rTo: 15 });
  g += bond(C, R, { rFrom: 16, rTo: 15 });
  g += bond(C, Xp, { rFrom: 16, rTo: 16 });
  g += atom(O.x, O.y, 'O');
  g += lonePair(O.x, O.y, 210); g += lonePair(O.x, O.y, 330);
  g += atom(R.x, R.y, 'R');
  g += atom(Xp.x, Xp.y, c.X, { kind: 'warn' });
  for (const a of c.lp) g += lonePair(Xp.x, Xp.y, a, { dist: 24 });
  g += atom(C.x, C.y, 'C', { kind: 'hi' });
  g += text(cx + 23, cy - 8, 'δ+', { cls: 'fg-warn', size: 11 });
  g += text(cx + 38, cy - 50, 'δ−', { cls: 'fg-hi', size: 11 });
  return g;
}
function anhydride(x, cy) {
  // Two carbonyls sharing one oxygen; x is the left edge of a 230-wide cell.
  let s = '';
  const C1 = P(x + 70, cy), O1 = P(x + 70, cy - 54), R1 = P(x + 30, cy + 34), Ob = P(x + 118, cy + 34);
  const C2 = P(x + 166, cy), O2 = P(x + 166, cy - 54), R2 = P(x + 206, cy + 34);
  s += bond(C1, O1, { order: 2, rFrom: 16, rTo: 15 });
  s += bond(C1, R1, { rFrom: 16, rTo: 15 });
  s += bond(C1, Ob, { rFrom: 16, rTo: 16 });
  s += bond(Ob, C2, { rFrom: 16, rTo: 15 });
  s += bond(C2, O2, { order: 2, rFrom: 15, rTo: 15 });
  s += bond(C2, R2, { rFrom: 15, rTo: 15 });
  s += atom(O1.x, O1.y, 'O'); s += lonePair(O1.x, O1.y, 210); s += lonePair(O1.x, O1.y, 330);
  s += atom(O2.x, O2.y, 'O'); s += lonePair(O2.x, O2.y, 210); s += lonePair(O2.x, O2.y, 330);
  s += atom(R1.x, R1.y, 'R'); s += atom(R2.x, R2.y, 'R');
  s += atom(Ob.x, Ob.y, 'O', { kind: 'warn' });
  s += lonePair(Ob.x, Ob.y, 45, { dist: 24 }); s += lonePair(Ob.x, Ob.y, 135, { dist: 24 });
  s += atom(C2.x, C2.y, 'C');
  s += atom(C1.x, C1.y, 'C', { kind: 'hi' });
  s += text(C1.x + 23, C1.y - 8, 'δ+', { cls: 'fg-warn', size: 11 });
  s += text(C1.x + 38, C1.y - 50, 'δ−', { cls: 'fg-hi', size: 11 });
  return s;
}
const CARB_ALT = 'Seven small panels, each showing a carbon double-bonded to an oxygen with the carbon marked delta plus and the oxygen delta minus, and two lone pairs on that oxygen. The carbon carries an R group on the left and, highlighted on the right with its own lone pairs, the atom that names the group: H for aldehyde, a second R for ketone, OH for carboxylic acid, OR for ester, NH2 for amide, Cl for acid chloride, and an oxygen bridging to a second C=O for anhydride.';
const CARB_CAPTION = 'Seven groups, one carbonyl. Find the C=O, then read the atom on its right: H, a carbon, OH, OR′, N, Cl, or an oxygen that continues to another C=O.';
const CARB_NOTE = 'Every C=O here is polar the same way, carbon δ+ and oxygen δ−. The atom on the right changes how easily that carbon is attacked, and what happens next; that is the story of three later chapters.';

FIGURES.push({
  id: 'carbonyl-family-gallery',
  section: 'functional-groups',
  anchor: '<h3>The carbonyl family: what is attached to the C=O</h3>',
  viewBox: '0 0 760 500',
  alt: CARB_ALT,
  build() {
    let s = '';
    CARB.slice(0, 4).forEach((c, i) => {
      const x = 20 + i * 182, cx = x + 85;
      s += panel(x, 16, 170, 196);
      s += title(cx, 40, c.name);
      s += carbonyl(cx, 116, c);
      s += good(cx, 194, c.what);
    });
    CARB.slice(4).forEach((c, i) => {
      const x = 20 + i * 245, cx = x + 115;
      s += panel(x, 228, 230, 196);
      s += title(cx, 252, c.name);
      s += carbonyl(cx, 328, c);
      s += good(cx, 398, c.what);
      if (c.more) s += small(cx, 414, c.more);
    });
    s += panel(510, 228, 230, 196);
    s += title(625, 252, 'Anhydride');
    s += anhydride(510, 328);
    s += good(625, 406, 'attached: O, then a second C=O');
    s += rule(24, 440, 736, 440);
    s += text(380, 464, 'Every C=O here: carbon δ+, oxygen δ− with two lone pairs.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 484, 'The atom on the right is what names the group.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: CARB_CAPTION,
  note: CARB_NOTE,
});

FIGURES.push({
  id: 'carbonyl-family-gallery-m',
  lessons: ['functional-groups'],
  viewBox: '0 0 360 870',
  alt: CARB_ALT,
  build() {
    let s = '';
    const h = 204;
    CARB.forEach((c, i) => {
      const x = 4 + (i % 2) * 180, y = 4 + Math.floor(i / 2) * (h + 8), cx = x + 86;
      s += panel(x, y, 172, h);
      s += title(cx, y + 22, c.name);
      s += carbonyl(cx, y + 110, c);
      s += good(cx, y + 180, c.what);
      if (c.more) s += small(cx, y + 196, c.more);
    });
    const y = 4 + 3 * (h + 8);
    s += panel(4, y, 352, h);
    s += title(180, y + 22, 'Anhydride');
    s += anhydride(65, y + 110);
    s += good(180, y + 188, 'attached: O, then a second C=O');
    return s;
  },
  caption: CARB_CAPTION,
  note: CARB_NOTE,
});

/* -------------------------------------------- three-formulas-one-atom ---
   The worked example's three formulas, drawn: a ketone, an ester and an
   ether, with the one oxygen that separates the first two marked. `cell`
   gives each panel's box, so the notes lay them side by side and the lesson
   stacks them. */
function threeFormulas(cell) {
  let s = '';
  const pan = (i, f, l1) => {
    const [x, y, w, h] = cell(i), cx = x + w / 2;
    s += panel(x, y, w, h);
    s += title(cx, y + 24, f);
    s += good(cx, y + h - 14, l1);
    return [cx, y + h / 2 + 14];
  };
  {
    const [cx, cy] = pan(0, 'CH₃COCH₃', 'ketone: carbon on both sides');
    const C = P(cx, cy + 10);
    const A = { c: { ...C, l: 'C', k: 'hi' }, o: { ...at(C, 270, 50), l: 'O', k: 'hi' }, a: { ...at(C, 210, 52), l: 'CH₃' }, b: { ...at(C, 330, 52), l: 'CH₃' } };
    s += mol({ atoms: A, bonds: [['c', 'o', 2], ['c', 'a'], ['c', 'b']], lp: [['o', 210], ['o', 330]] });
  }
  {
    const [cx, cy] = pan(1, 'CH₃COOCH₃', 'ester: C=O next to an O–C');
    const C = P(cx - 36, cy + 10);
    const O2 = at(C, 330, 50);
    const A = { c: { ...C, l: 'C', k: 'hi' }, o: { ...at(C, 270, 50), l: 'O', k: 'hi' }, a: { ...at(C, 210, 52), l: 'CH₃' }, o2: { ...O2, l: 'O', k: 'warn' }, b: { ...at(O2, 30, 52), l: 'CH₃' } };
    s += mol({ atoms: A, bonds: [['c', 'o', 2], ['c', 'a'], ['c', 'o2'], ['o2', 'b']], lp: [['o', 210], ['o', 330], ['o2', 270], ['o2', 90]], hl: [{ kind: 'warn', atoms: ['o2'] }] });
    s += text(O2.x + 24, O2.y - 26, 'the extra O', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
  }
  {
    const [cx, cy] = pan(2, 'CH₃OCH₃', 'ether: C–O–C, no C=O');
    const O = P(cx, cy - 8);
    const A = { o: { ...O, l: 'O', k: 'warn' }, a: { ...at(O, 150, 54), l: 'CH₃' }, b: { ...at(O, 30, 54), l: 'CH₃' } };
    s += mol({ atoms: A, bonds: [['o', 'a'], ['o', 'b']], lp: [['o', 225], ['o', 315]] });
  }
  return s;
}
const THREE_ALT = 'Three structures. Acetone, CH3COCH3: a C=O carbon with a CH3 on each side, labeled ketone. Methyl acetate, CH3COOCH3: a C=O carbon with a CH3 on one side and an oxygen on the other that leads to a second CH3; that extra oxygen is marked, labeled ester. Dimethyl ether, CH3OCH3: an oxygen with a CH3 on each side and no C=O, labeled ether.';
const THREE_CAPTION = 'Put the three side by side and the ester is the ketone with one oxygen slipped in beside the C=O, while the ether keeps that oxygen and loses the C=O.';
FIGURES.push({
  id: 'three-formulas-one-atom',
  section: 'functional-groups',
  anchor: 'Worked example &mdash; three formulas that differ by one atom',
  viewBox: '0 0 760 232',
  alt: THREE_ALT,
  build() { return threeFormulas((i) => [14 + i * 248, 16, 236, 204]); },
  caption: THREE_CAPTION,
});
FIGURES.push({
  id: 'three-formulas-one-atom-m',
  lessons: ['functional-groups'],
  viewBox: '0 0 360 596',
  alt: THREE_ALT,
  build() { return threeFormulas((i) => [4, 4 + i * 198, 352, 190]); },
  caption: THREE_CAPTION,
});

/* ------------------------------------------------------ degree helpers ---
   A centre atom with its neighbours at left, top and bottom (and a group to
   the right). Carbon neighbours are marked in coral so they can be counted. */
function degreePanel(cx, cy, centre, subs, right) {
  const C = P(cx, cy);
  const A = { c: { ...C, l: centre, k: 'hi' } }, B = [];
  const angs = [180, 270, 90];
  subs.forEach((l, j) => {
    A['s' + j] = { ...at(C, angs[j], l === 'H' ? 42 : 52), l, k: l === 'H' ? undefined : 'warn' };
    B.push(['c', 's' + j]);
  });
  if (right) {
    A.g = { ...at(C, 0, right.l === 'H' ? 42 : 54), l: right.l, k: right.k };
    B.push(['c', 'g']);
  }
  return { A, B, C };
}

/* ------------------------------------------------------ degree-alcohols ---
   1°, 2°, 3° alcohols, and the 4° carbon that can never carry an OH. */
const ALC = [
  { f: 'CH₃CH₂OH', subs: ['CH₃', 'H', 'H'], n: 1, d: 'primary (1°) alcohol' },
  { f: '(CH₃)₂CHOH', subs: ['CH₃', 'CH₃', 'H'], n: 2, d: 'secondary (2°) alcohol' },
  { f: '(CH₃)₃COH', subs: ['CH₃', 'CH₃', 'CH₃'], n: 3, d: 'tertiary (3°) alcohol' },
  { f: 'C(CH₃)₄', subs: ['CH₃', 'CH₃', 'CH₃'], n: 4, d: 'quaternary (4°) carbon' },
];
function degreeAlcohols(cell) {
  let s = '';
  ALC.forEach((r, i) => {
    const [x, y, w] = cell(i);
    s += panel(x, y, w, 234);
    s += title(x + w / 2, y + 24, r.f);
    const right = r.n === 4 ? { l: 'CH₃', k: 'warn' } : { l: 'OH' };
    const { A, B } = degreePanel(x + w / 2 - (r.n === 4 ? 0 : 2), y + 112, 'C', r.subs, right);
    s += mol({ atoms: A, bonds: B });
    s += good(x + w / 2, y + 200, `${r.n} carbon${r.n > 1 ? 's' : ''} on this C`);
    s += small(x + w / 2, y + 218, r.d);
  });
  return s;
}
const ALC_ALT = 'Four panels. CH3CH2OH: the carbon carrying the OH is bonded to one other carbon and two H, labeled primary. (CH3)2CHOH: that carbon is bonded to two carbons and one H, labeled secondary. (CH3)3COH: bonded to three carbons and no H, labeled tertiary. C(CH3)4: a carbon bonded to four carbons, labeled quaternary, with no bond left for an OH.';
const ALC_CAPTION = 'The shaded carbon is the one being classified; its carbon neighbors are in coral. Count the coral atoms. The C(CH₃)₄ panel is why no alcohol is ever 4°: a carbon with four carbon neighbors has no bond left for an OH.';
FIGURES.push({
  id: 'degree-alcohols',
  section: 'functional-groups',
  anchor: '<h3>Primary, secondary, tertiary</h3>',
  viewBox: '0 0 760 262',
  alt: ALC_ALT,
  build() { return degreeAlcohols((i) => [14 + i * 186, 16, 176]); },
  caption: ALC_CAPTION,
});
FIGURES.push({
  id: 'degree-alcohols-m',
  lessons: ['functional-groups'],
  viewBox: '0 0 360 488',
  alt: ALC_ALT,
  build() { return degreeAlcohols((i) => [4 + (i % 2) * 180, 4 + Math.floor(i / 2) * 242, 172]); },
  caption: ALC_CAPTION,
});

/* ------------------------------------------------------- degree-amines ---
   1°, 2°, 3° amines, counted on the nitrogen. */
const AMN = [
  { f: 'CH₃NH₂', subs: ['CH₃', 'H', 'H'], n: 1, d: 'primary (1°) amine' },
  { f: '(CH₃)₂NH', subs: ['CH₃', 'CH₃', 'H'], n: 2, d: 'secondary (2°) amine' },
  { f: '(CH₃)₃N', subs: ['CH₃', 'CH₃', 'CH₃'], n: 3, d: 'tertiary (3°) amine' },
];
function degreeAmines(cell) {
  let s = '';
  AMN.forEach((r, i) => {
    const [x, y, w] = cell(i), N = P(x + w / 2, y + 102);
    s += panel(x, y, w, 216);
    s += title(x + w / 2, y + 24, r.f);
    const A = { n: { ...N, l: 'N', k: 'hi' } }, B = [];
    [210, 330, 90].forEach((ang, j) => {
      const l = r.subs[j];
      A['s' + j] = { ...at(N, ang, l === 'H' ? 42 : 52), l, k: l === 'H' ? undefined : 'warn' };
      B.push(['n', 's' + j]);
    });
    s += mol({ atoms: A, bonds: B, lp: [['n', 270]] });
    s += good(x + w / 2, y + 184, `${r.n} carbon${r.n > 1 ? 's' : ''} on the N`);
    s += small(x + w / 2, y + 202, r.d);
  });
  return s;
}
const AMN_ALT = 'Three panels. CH3NH2: the nitrogen is bonded to one carbon and two H, labeled primary. (CH3)2NH: bonded to two carbons and one H, labeled secondary. (CH3)3N: bonded to three carbons, labeled tertiary. Each nitrogen carries one lone pair.';
const AMN_CAPTION = 'For an amine the shaded atom is the nitrogen, and its carbon neighbors are in coral. One, two or three coral atoms: primary, secondary, tertiary.';
FIGURES.push({
  id: 'degree-amines',
  section: 'functional-groups',
  anchor: '<h3>Primary, secondary, tertiary</h3>',
  viewBox: '0 0 760 244',
  alt: AMN_ALT,
  build() { return degreeAmines((i) => [14 + i * 248, 16, 236]); },
  caption: AMN_CAPTION,
});
FIGURES.push({
  id: 'degree-amines-m',
  lessons: ['functional-groups'],
  viewBox: '0 0 360 456',
  alt: AMN_ALT,
  build() { return degreeAmines((i) => [i < 2 ? 4 + i * 180 : 94, 4 + Math.floor(i / 2) * 226, 172]); },
  caption: AMN_CAPTION,
});

/* ---------------------------------------------------------------- F5 ---
   The degree trap, drawn. The same tert-butyl group twice: counting on the
   carbon for the alcohol, on the nitrogen for the amine. */
function tertButyl(x, w, right, opts = {}) {
  const C = P(x + w / 2 - 40, 124);
  const A = {
    c: { ...C, l: 'C', k: opts.plain ? undefined : right === 'OH' ? 'hi' : 'warn' },
    m1: { ...at(C, 180, 52), l: 'CH₃', k: opts.plain ? undefined : right === 'OH' ? 'warn' : undefined },
    m2: { ...at(C, 270, 52), l: 'CH₃', k: opts.plain ? undefined : right === 'OH' ? 'warn' : undefined },
    m3: { ...at(C, 90, 52), l: 'CH₃', k: opts.plain ? undefined : right === 'OH' ? 'warn' : undefined },
  };
  const B = [['c', 'm1'], ['c', 'm2'], ['c', 'm3']];
  const lp = [];
  const X = at(C, 0, 54);
  if (right === 'OH') {
    A.x = { ...X, l: 'O' }; A.h = { ...at(X, -60, 40), l: 'H' };
    B.push(['c', 'x'], ['x', 'h']);
    lp.push(['x', 60], ['x', 240]);
  } else {
    A.x = { ...X, l: 'N', k: opts.plain ? undefined : 'hi' };
    A.h1 = { ...at(X, -60, 40), l: 'H' }; A.h2 = { ...at(X, 60, 40), l: 'H' };
    B.push(['c', 'x'], ['x', 'h1'], ['x', 'h2']);
    lp.push(['x', 0]);
  }
  return mol({ atoms: A, bonds: B, lp });
}

FIGURES.push({
  id: 'degree-counted-twice',
  section: 'functional-groups',
  anchor: '<h3>Why polarity tells you where a group will react</h3>',
  viewBox: '0 0 760 262',
  alt: 'Two structures built on the same tert-butyl group. On the left, (CH3)3C–OH: the central carbon is shaded and its three CH3 neighbors are marked, labeled tertiary alcohol. On the right, (CH3)3C–NH2: the nitrogen is shaded and its single carbon neighbor is marked, labeled primary amine.',
  build() {
    let s = '';
    s += panel(14, 16, 360, 234);
    s += title(194, 40, '(CH₃)₃C–OH');
    s += tertButyl(14, 360, 'OH');
    s += good(194, 214, 'count carbons on the C–OH carbon: 3');
    s += text(194, 234, 'tertiary alcohol', { cls: 'fg-lbl', size: 12.5 });
    s += panel(386, 16, 360, 234);
    s += title(566, 40, '(CH₃)₃C–NH₂');
    s += tertButyl(386, 360, 'NH2');
    s += good(566, 214, 'count carbons on the N: 1');
    s += text(566, 234, 'primary amine', { cls: 'fg-lbl', size: 12.5 });
    return s;
  },
  caption: 'The same tert-butyl group, (CH₃)₃C–, carrying an OH in one panel and an NH₂ in the other. The shaded atom is the one you count around; the coral atoms are the carbons you count.',
  note: 'Degree says how crowded the reacting atom is. Many alcohol reactions happen at the carbon, so the carbon’s neighbors matter. An amine reacts through the lone pair on its nitrogen, so the nitrogen’s neighbors matter.',
});

FIGURES.push({
  id: 'tert-butylamine-drawn',
  lessons: ['functional-groups'],
  viewBox: '80 0 280 210',
  alt: 'tert-Butylamine drawn out: a central carbon bonded to three CH3 groups and to a nitrogen; the nitrogen carries two H and one lone pair.',
  build() {
    let s = '';
    s += title(210, 30, '(CH₃)₃C–NH₂');
    s += tertButyl(30, 360, 'NH2', { plain: true });
    return s;
  },
  caption: 'tert-Butylamine, (CH₃)₃C–NH₂, with every atom drawn.',
});

/* ------------------------------------------------------------- drugs ---
   The three worked-example drugs, each drawn in full beside its worked
   example. Ring carbons are written as C with their H, so "C6H4" can be
   counted off the drawing. `labels: false` gives the plain structure the
   lesson asks about, with no group names on it. */
function aspirin(labels) {
  let s = '';
  const cx = 290, cy = 200, R = 44;
  const rg = ring(cx, cy, R, -90), hs = ringH(rg, [0, 1]);
  const V0 = rg.atoms.r0, V1 = rg.atoms.r1;
  const Ca = at(V0, -90, 50), Oa = at(Ca, 210, 48), Oh = at(Ca, 330, 48), Ha = at(Oh, 30, 38);
  const Oe = at(V1, -30, 50), Ce = at(Oe, 30, 50), Oe2 = at(Ce, 90, 48), Me = at(Ce, -30, 52);
  const A = {
    ...rg.atoms, ...hs.atoms,
    ca: { ...Ca, l: 'C' }, oa: { ...Oa, l: 'O' }, oh: { ...Oh, l: 'O' }, ha: { ...Ha, l: 'H' },
    oe: { ...Oe, l: 'O' }, ce: { ...Ce, l: 'C' }, oe2: { ...Oe2, l: 'O' }, me: { ...Me, l: 'CH₃' },
  };
  if (labels) s += ringTint(cx, cy, R + 20, -90);
  s += mol({
    atoms: A,
    bonds: [...rg.bonds, ...hs.bonds, ['r0', 'ca'], ['ca', 'oa', 2], ['ca', 'oh'], ['oh', 'ha'], ['r1', 'oe'], ['oe', 'ce'], ['ce', 'oe2', 2], ['ce', 'me']],
    lp: [['oa', 150], ['oa', 270], ['oh', 270], ['oh', 90], ['oe', 270], ['oe', 90], ['oe2', 30], ['oe2', 150]],
    hl: labels ? [
      { kind: 'warn', atoms: ['ca', 'oa', 'oh', 'ha'], bonds: [['ca', 'oa'], ['ca', 'oh'], ['oh', 'ha']] },
      { kind: 'hi', atoms: ['oe', 'ce', 'oe2'], bonds: [['oe', 'ce'], ['ce', 'oe2']] },
    ] : [],
  });
  if (labels) {
    s += text(Oa.x - 30, Oa.y + 4, 'carboxylic acid', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(Oe2.x + 34, Oe2.y + 4, 'ester', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(cx - 88, cy + 4, 'aromatic ring', { cls: 'fg-tag-good', size: 11, anchor: 'end' });
  }
  return s;
}

function acetaminophen(labels) {
  let s = '';
  const cx = 230, cy = 170, R = 44;
  const rg = ring(cx, cy, R, 0), hs = ringH(rg, [0, 3]);
  const V0 = rg.atoms.r0, V3 = rg.atoms.r3;
  const O = at(V3, 180, 48), Ho = at(O, 240, 38);
  const N = at(V0, 0, 48), Hn = at(N, 60, 38), Ca = at(N, -60, 50), Od = at(Ca, 240, 48), Me = at(Ca, 0, 52);
  const A = {
    ...rg.atoms, ...hs.atoms,
    o: { ...O, l: 'O' }, ho: { ...Ho, l: 'H' },
    n: { ...N, l: 'N' }, hn: { ...Hn, l: 'H' }, ca: { ...Ca, l: 'C' }, od: { ...Od, l: 'O' }, me: { ...Me, l: 'CH₃' },
  };
  if (labels) s += ringTint(cx, cy, R + 20, 0);
  s += mol({
    atoms: A,
    bonds: [...rg.bonds, ...hs.bonds, ['r3', 'o'], ['o', 'ho'], ['r0', 'n'], ['n', 'hn'], ['n', 'ca'], ['ca', 'od', 2], ['ca', 'me']],
    lp: [['o', 120], ['o', 300], ['n', 0], ['od', 180], ['od', 300]],
    hl: labels ? [
      { kind: 'warn', atoms: ['o', 'ho'], bonds: [['o', 'ho']] },
      { kind: 'hi', atoms: ['n', 'hn', 'ca', 'od'], bonds: [['n', 'hn'], ['n', 'ca'], ['ca', 'od']] },
    ] : [],
  });
  if (labels) {
    s += text(O.x - 6, O.y + 46, 'phenol', { cls: 'fg-tag-warn', size: 11 });
    s += text(Me.x + 26, Me.y + 4, 'amide', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(cx, cy + 108, 'aromatic ring', { cls: 'fg-tag-good', size: 11 });
  }
  return s;
}

function ibuprofen(labels) {
  let s = '';
  const cx = 300, cy = 164, R = 44;
  const rg = ring(cx, cy, R, 0), hs = ringH(rg, [0, 3]);
  const V0 = rg.atoms.r0, V3 = rg.atoms.r3;
  const C2 = at(V3, 180, 50), C1 = at(C2, 210, 52), M1 = at(C1, 150, 52), M2 = at(C1, 270, 52);
  const Cx = at(V0, 0, 50), Mx = at(Cx, 60, 52), Cc = at(Cx, -60, 52), Od = at(Cc, 240, 48), Oh = at(Cc, 0, 48), Hh = at(Oh, -60, 38);
  const A = {
    ...rg.atoms, ...hs.atoms,
    c2: { ...C2, l: 'CH₂' }, c1: { ...C1, l: 'CH' }, m1: { ...M1, l: 'CH₃' }, m2: { ...M2, l: 'CH₃' },
    cx: { ...Cx, l: 'CH' }, mx: { ...Mx, l: 'CH₃' }, cc: { ...Cc, l: 'C' }, od: { ...Od, l: 'O' }, oh: { ...Oh, l: 'O' }, hh: { ...Hh, l: 'H' },
  };
  if (labels) s += ringTint(cx, cy, R + 20, 0);
  s += mol({
    atoms: A,
    bonds: [...rg.bonds, ...hs.bonds, ['r3', 'c2'], ['c2', 'c1'], ['c1', 'm1'], ['c1', 'm2'], ['r0', 'cx'], ['cx', 'mx'], ['cx', 'cc'], ['cc', 'od', 2], ['cc', 'oh'], ['oh', 'hh']],
    lp: [['od', 180], ['od', 300], ['oh', 90], ['oh', 180 + 60]],
    hl: labels ? [{ kind: 'warn', atoms: ['cc', 'od', 'oh', 'hh'], bonds: [['cc', 'od'], ['cc', 'oh'], ['oh', 'hh']] }] : [],
  });
  if (labels) {
    s += text(Oh.x + 26, Oh.y + 22, 'carboxylic acid', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(cx, cy + 104, 'aromatic ring', { cls: 'fg-tag-good', size: 11 });
    s += text(C1.x - 4, C1.y + 86, 'spectator: C and H only', { cls: 'fg-tag-mut', size: 10.5 });
    s += text(Mx.x + 26, Mx.y + 6, 'spectator too', { cls: 'fg-tag-mut', size: 10.5, anchor: 'start' });
  }
  return s;
}

FIGURES.push({
  id: 'aspirin-groups',
  section: 'functional-groups',
  anchor: 'Worked example &mdash; aspirin',
  viewBox: '0 0 760 312',
  alt: 'Aspirin drawn with every atom: a benzene ring of six labeled carbons carrying four H. On the top carbon, a COOH (a carbon double-bonded to one O and single-bonded to an O–H), shaded as the carboxylic acid. On the neighboring carbon, an oxygen bonded to a C=O that carries a CH3, shaded as the ester. The ring is shaded as the aromatic ring. The two groups sit on neighboring ring carbons.',
  build() {
    let s = aspirin(true);
    s += text(530, 60, 'aspirin', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += small(530, 80, 'HOOC–C₆H₄–O–CO–CH₃', { anchor: 'start' });
    s += good(530, 236, 'four ring H: two groups attached', { anchor: 'start' });
    s += good(530, 254, 'on neighboring carbons (ortho)', { anchor: 'start' });
    return s;
  },
  caption: 'Aspirin with every atom drawn and each group shaded and named on the drawing.',
});

FIGURES.push({
  id: 'acetaminophen-groups',
  section: 'functional-groups',
  anchor: 'Worked example &mdash; acetaminophen',
  viewBox: '0 0 760 300',
  alt: 'Acetaminophen drawn with every atom: a benzene ring of six labeled carbons carrying four H. On the left carbon an O–H, shaded as a phenol. On the opposite carbon an N–H whose nitrogen is bonded to a C=O carrying a CH3, shaded as the amide. The ring is shaded as the aromatic ring. The two groups sit on opposite ring carbons.',
  build() {
    let s = acetaminophen(true);
    s += text(520, 60, 'acetaminophen', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += small(520, 80, 'HO–C₆H₄–NH–CO–CH₃', { anchor: 'start' });
    s += good(520, 236, 'four ring H: two groups attached', { anchor: 'start' });
    s += good(520, 254, 'on opposite carbons (para)', { anchor: 'start' });
    return s;
  },
  caption: 'Acetaminophen with every atom drawn. The OH sits directly on a ring carbon, so it is a phenol, and the nitrogen sits on a C=O, so it is an amide.',
});

FIGURES.push({
  id: 'ibuprofen-groups',
  section: 'functional-groups',
  anchor: 'Worked example &mdash; ibuprofen',
  viewBox: '0 0 760 300',
  alt: 'Ibuprofen drawn with every atom: a benzene ring of six labeled carbons carrying four H. On the left carbon a CH2 leading to a CH that carries two CH3 groups, marked as spectator carbon and hydrogen. On the opposite carbon a CH carrying a CH3, also marked spectator, and a COOH, shaded as the carboxylic acid. The ring is shaded as the aromatic ring.',
  build() {
    let s = ibuprofen(true);
    s += text(530, 60, 'ibuprofen', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += small(530, 80, '(CH₃)₂CHCH₂–C₆H₄–CH(CH₃)–COOH', { anchor: 'start' });
    s += good(530, 236, 'four ring H: two groups attached', { anchor: 'start' });
    s += good(530, 254, 'on opposite carbons (para)', { anchor: 'start' });
    return s;
  },
  caption: 'Ibuprofen with every atom drawn. Apart from the carboxylic acid and the aromatic ring, every atom is carbon or hydrogen.',
});

FIGURES.push({
  id: 'aspirin-drawn',
  lessons: ['functional-groups'],
  viewBox: '200 36 320 270',
  alt: 'Aspirin drawn with every atom: a benzene ring of six labeled carbons with four H. The top carbon carries a carbon that is double-bonded to one oxygen and single-bonded to an O–H. The neighboring ring carbon carries an oxygen bonded to a carbon that is double-bonded to an oxygen and carries a CH3.',
  build() { return aspirin(false); },
  caption: 'Aspirin, HOOC–C₆H₄–O–CO–CH₃, with every atom drawn.',
});

FIGURES.push({
  id: 'acetaminophen-drawn',
  lessons: ['functional-groups'],
  viewBox: '90 40 350 220',
  alt: 'Acetaminophen drawn with every atom: a benzene ring of six labeled carbons with four H. The left ring carbon carries an O–H. The opposite ring carbon carries a nitrogen with one H, and that nitrogen is bonded to a carbon that is double-bonded to an oxygen and carries a CH3.',
  build() { return acetaminophen(false); },
  caption: 'Acetaminophen, HO–C₆H₄–NH–CO–CH₃, with every atom drawn.',
});

export default FIGURES;
