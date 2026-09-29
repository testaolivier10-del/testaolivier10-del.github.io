/* Figures for the curved-arrows notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Curved arrows comes straight after skeletal structures, so small species
   (ammonia, hydroxide, H–Cl, bromomethane) are drawn with every atom labeled,
   and larger carbon skeletons are drawn skeletally. Every drawing is a real
   reaction: reactants with their curved arrows, a reaction arrow, and the
   products with every charge in place, so the reader can check the charge
   bookkeeping against the picture.

   Notes figures run up to 760 wide. The lesson copies (ids that start with
   l-) stack their rows at 340 wide and use only fg-lbl and fg-tag text. */
import { atom, bond, arrow, curve, lonePair, text, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers ---
   `at` walks from a point at a screen angle (0 east, 90 down). A molecule is
   { atoms, bonds, lp, charges, notes }: atoms map an id to {x, y, l, k, r};
   an atom with no label is a skeletal vertex (a carbon), and bonds stop short
   of labeled atoms only. Bonds are [a, b, order, cls]. `lp` is [id, angle];
   `charges` is [id, sign, angle, dist]. */
const f2 = (v) => Math.round(v * 100) / 100;
const at = (p, deg, len) => P(p.x + Math.cos(deg * Math.PI / 180) * len, p.y + Math.sin(deg * Math.PI / 180) * len);
const mid = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2);
const rad = (a) => a.r ?? (!a.l ? 0 : a.l === 'H' ? 11 : a.l.length === 1 ? 14 : 16);

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

/* A merged molecule from several parts, so one call draws a whole side. */
const join = (...ms) => ({
  atoms: Object.assign({}, ...ms.map((m) => m.atoms)),
  bonds: ms.flatMap((m) => m.bonds || []),
  lp: ms.flatMap((m) => m.lp || []),
  charges: ms.flatMap((m) => m.charges || []),
});

/* Hydrogens on atom `id` of molecule m at the given angles. */
function addH(m, id, angles, len = 36, pre = id) {
  angles.forEach((ang, i) => {
    const k = `${pre}h${i}`;
    m.atoms[k] = { ...at(m.atoms[id], ang, len), l: 'H' };
    m.bonds.push([id, k]);
  });
  return m;
}

const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const tg = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag', size: 11, anchor });
const good = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-good', size: 11, anchor });
const warn = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-warn', size: 11, anchor });
const plusSign = (x, y) => text(x, y + 5, '+', { cls: 'fg-lbl', size: 13 });
const num = (x, y, s) => text(x, y + 4, s, { cls: 'fg-tag', size: 11 });

/* A resonance arrow: one line, a head at each end. */
function dbl(a, b) {
  return arrow(a, b) + arrow(b, a).replace(/<line[^>]*><\/line>/, '');
}

/* A fishhook: one barb, because it carries one electron. `curve` in the kit
   draws a full two-barbed head, which would say a pair moved. */
function fishhook(a, b, opts = {}) {
  const bow = opts.bow ?? 30;
  const m = mid(a, b);
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = m.x + (-dy / len) * bow, cy = m.y + (dx / len) * bow;
  let ux = b.x - cx, uy = b.y - cy;
  const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const size = 8, px = -uy, py = ux, side = opts.side ?? 1;
  const bx = b.x - ux * size, by = b.y - uy * size, h = size * 0.6 * side;
  return `<path class="fg-arrow" d="M${f2(a.x)} ${f2(a.y)} Q${f2(cx)} ${f2(cy)} ${f2(bx)} ${f2(by)}"></path>` +
         `<path class="fg-head" d="M${f2(b.x)} ${f2(b.y)} L${f2(bx + px * h)} ${f2(by + py * h)} L${f2(bx)} ${f2(by)} Z"></path>`;
}
const dot = (x, y) => `<circle class="fg-lp" cx="${f2(x)}" cy="${f2(y)}" r="3"></circle>`;

/* ------------------------------------------------------------ species ---
   Each returns a molecule positioned by its key atom. */

/* Ammonia: H left, right and down; the lone pair points up. */
const ammonia = (n) => addH({ atoms: { N: { ...n, l: 'N' } }, bonds: [], lp: [['N', 270]] }, 'N', [180, 0, 90]);

/* Ammonium: four N–H bonds, the new one (up) highlighted. */
function ammonium(n) {
  const m = addH({ atoms: { N: { ...n, l: 'N' } }, bonds: [], charges: [['N', '+', 315, 28]] }, 'N', [180, 0, 90]);
  m.atoms.Hn = { ...at(n, 270, 36), l: 'H', k: 'hi' };
  m.bonds.push(['N', 'Hn', 1, 'fg-bond-hi']);
  return m;
}

/* Hydroxide with its H at angle hDeg and three lone pairs on the other sides.
   The charge sits between two lone pairs. */
function hydroxide(o, hDeg = 180, pre = 'o') {
  const m = { atoms: { [pre]: { ...o, l: 'O' } }, bonds: [], lp: [], charges: [] };
  addH(m, pre, [hDeg], 36);
  for (const d of [90, 180, 270]) m.lp.push([pre, hDeg + d]);
  m.charges.push([pre, '−', hDeg + 225, 29]);
  return m;
}

/* H–X with H on the left. X gets three lone pairs away from H. */
function hx(h, X = 'Cl', len = 50, pre = 'x') {
  const m = { atoms: { [pre + 'H']: { ...h, l: 'H' }, [pre]: { ...P(h.x + len, h.y), l: X } }, bonds: [[pre + 'H', pre]], lp: [] };
  for (const d of [270, 0, 90]) m.lp.push([pre, d]);
  return m;
}

/* A halide ion: four lone pairs and a minus. */
function halide(p, X = 'Cl', pre = 'hal') {
  return { atoms: { [pre]: { ...p, l: X } }, bonds: [], lp: [[pre, 270], [pre, 0], [pre, 90], [pre, 180]], charges: [[pre, '−', 315, 31]] };
}

/* Water, bent, H up-left and up-right, lone pairs down. */
function water(o, pre = 'w', rot = 0) {
  const m = { atoms: { [pre]: { ...o, l: 'O' } }, bonds: [], lp: [[pre, 55 + rot], [pre, 125 + rot]] };
  return addH(m, pre, [215 + rot, 325 + rot], 36);
}

/* Acetone, skeletal: C=O up from the carbonyl vertex, methyls down-left and
   down-right. `form` 'neutral' | 'split' (C+ and O− with three pairs). */
function acetone(c, form = 'neutral', pre = 'a') {
  const C = pre + 'C', O = pre + 'O';
  const m = {
    atoms: { [C]: { ...c, l: '' }, [O]: { ...at(c, 270, 46), l: 'O' },
      [pre + 'm1']: { ...at(c, 150, 38), l: '' }, [pre + 'm2']: { ...at(c, 30, 38), l: '' } },
    bonds: [[C, pre + 'm1'], [C, pre + 'm2']], lp: [], charges: [],
  };
  if (form === 'neutral') {
    m.bonds.push([C, O, 2]);
    m.lp.push([O, 210], [O, 330]);
  } else {
    m.bonds.push([C, O, 1]);
    m.lp.push([O, 180], [O, 270], [O, 0]);
    m.charges.push([O, '−', 315, 28], [C, '+', 90, 16]);
  }
  return m;
}

/* A skeletal carbon with three methyl lines (the (CH3)3C– unit). The open
   side, where the fourth group goes, is `open` degrees. */
function tbutyl(c, open = 180, pre = 't') {
  const m = { atoms: { [pre]: { ...c, l: '' } }, bonds: [] };
  [open + 120, open + 180, open + 240].forEach((d, i) => {
    m.atoms[pre + 'm' + i] = { ...at(c, d, 38), l: '' };
    m.bonds.push([pre, pre + 'm' + i]);
  });
  return m;
}

/* Bromomethane with Br to the right, H up, down-left and down-right.
   (The three H sit away from the side hydroxide approaches from.) */
function ch3br(c, pre = 'b') {
  const m = { atoms: { [pre]: { ...c, l: 'C' }, [pre + 'Br']: { ...at(c, 0, 56), l: 'Br' } }, bonds: [[pre, pre + 'Br']], lp: [] };
  addH(m, pre, [270, 110, 70]);
  for (const d of [270, 0, 90]) m.lp.push([pre + 'Br', d]);
  return m;
}

/* ============================================================== NOTES === */

/* The first arrow: ammonia takes a bare H+. */
function firstArrow(ox, oy) {
  let s = '';
  const n = P(ox + 70, oy + 70);
  s += mol(ammonia(n));
  const hp = P(ox + 190, oy + 34);
  s += atom(hp.x, hp.y, 'H', { r: 11, size: 12.5 });
  s += text(hp.x + 17, hp.y - 3, '+', { cls: 'fg-tag-warn', size: 15 });
  s += curve(P(n.x + 2, n.y - 27), P(hp.x - 13, hp.y), { bow: -24 });
  return { s, n, hp };
}

FIGURES.push({
  id: 'ca-first-arrow',
  section: 'curved-arrows',
  anchor: '<h3>One arrow, one pair of electrons</h3>',
  viewBox: '0 0 760 200',
  alt: 'Ammonia and a hydrogen ion. A curved arrow starts on the lone pair of the nitrogen and ends on the hydrogen ion. Labels mark the tail on the lone pair and the head on H+. A reaction arrow leads to the ammonium ion, whose new N–H bond is highlighted and whose nitrogen carries a plus charge.',
  build() {
    let s = '';
    const { s: d, n, hp } = firstArrow(40, 40);
    s += d;
    s += tg(n.x - 34, 34, 'tail: on the lone pair', 'start');
    s += tg(hp.x + 30, hp.y + 4, 'head: on H⁺', 'start');
    s += arrow(P(360, 110), P(440, 110));
    s += mol(ammonium(P(560, 116)));
    s += tg(560, 50, 'the pair is now the new N–H bond');
    s += rule(24, 172, 736, 172);
    s += tg(190, 190, 'charge in: 0 + (+1) = +1');
    s += tg(560, 190, 'charge out: +1 on N');
    return s;
  },
  caption: 'One arrow: the tail sits on the pair that moves, and the head sits on the atom it ends up bonded to.',
});

/* Where a head can land: three outcomes, one row each. */
function headRows(narrow) {
  /* x positions of reactant centre, reaction arrow, product centre, tag */
  const L = narrow
    ? { r: 80, a1: 176, a2: 214, p: 272, top: 0, rowH: 150, tagX: 170 }
    : { r: 130, a1: 262, a2: 320, p: 420, top: 0, rowH: 128, tagX: 530 };
  const rows = [];

  /* Row 1: hydroxide + methyl cation -> methanol. Head on another atom. */
  rows.push({
    title: 'head on another atom: a new bond',
    draw(y) {
      let s = '';
      const oh = P(L.r - (narrow ? 38 : 50), y);
      s += mol(hydroxide(oh, 180, 'o1'));
      const c = P(L.r + (narrow ? 44 : 58), y);
      const m = addH({ atoms: { c: { ...c, l: 'C' } }, bonds: [], charges: [['c', '+', 0, 26]] }, 'c', [270, 145, 215], 34);
      s += mol(m);
      s += curve(P(oh.x + 21, oh.y - 6), P(c.x - 16, c.y + 2), { bow: narrow ? -10 : -14 });
      s += arrow(P(L.a1, y), P(L.a2, y));
      /* product: methanol, C–O bond highlighted */
      const pc = P(L.p + (narrow ? 22 : 18), y), po = at(pc, 180, 50);
      const pm = { atoms: { c: { ...pc, l: 'C' }, o: { ...po, l: 'O', k: 'hi' } }, bonds: [['c', 'o', 1, 'fg-bond-hi']], lp: [['o', 90], ['o', 270]] };
      addH(pm, 'c', [300, 60, 0], 34);
      pm.atoms.oh = { ...at(po, 180, 34), l: 'H' }; pm.bonds.push(['o', 'oh']);
      s += mol(pm);
      return s;
    },
  });

  /* Row 2: acetone C=O pi bond onto its own oxygen. Head on an atom of the same bond. */
  rows.push({
    title: 'head on an atom of the same bond: a new lone pair',
    draw(y) {
      let s = '';
      const c = P(L.r, y + 14);
      const m = acetone(c, 'neutral', 'k');
      s += mol(m);
      const o = m.atoms.kO;
      s += curve(P(c.x + 5, c.y - 22), P(o.x + 16, o.y + 4), { bow: 12 });
      s += arrow(P(L.a1, y), P(L.a2, y));
      s += mol(acetone(P(L.p, y + 14), 'split', 'q'));
      return s;
    },
  });

  /* Row 3: the reverse: an O− lone pair into the C–O bond. Head on a bond. */
  rows.push({
    title: 'head on the middle of a bond: a new π bond',
    draw(y) {
      let s = '';
      const c = P(L.r, y + 14);
      const m = acetone(c, 'split', 'r');
      s += mol(m);
      const o = m.atoms.rO;
      s += curve(P(o.x - 23, o.y - 5), P(c.x - 5, c.y - 22), { bow: 14 });
      s += arrow(P(L.a1, y), P(L.a2, y));
      s += mol(acetone(P(L.p, y + 14), 'neutral', 's'));
      return s;
    },
  });
  return { rows, L };
}

FIGURES.push({
  id: 'ca-heads',
  section: 'curved-arrows',
  anchor: '<h3>One arrow, one pair of electrons</h3>',
  viewBox: '0 0 760 420',
  alt: 'Three rows. Row 1: a lone pair on hydroxide moves to a methyl cation carbon, giving methanol with a new C–O bond. Row 2: in acetone, the pi bond of C=O moves onto the oxygen, leaving carbon with a plus charge and oxygen with three lone pairs and a minus charge. Row 3: the reverse: a lone pair on that negative oxygen moves into the C–O bond, making the C=O double bond again.',
  build() {
    const { rows } = headRows(false);
    let s = '';
    rows.forEach((r, i) => {
      const y0 = 10 + i * 136;
      s += panel(14, y0, 732, 126);
      s += lbl(530, y0 + 58, r.title.split(': ')[0] + ':');
      s += lbl(530, y0 + 78, r.title.split(': ')[1]);
      s += r.draw(y0 + 64);
    });
    return s;
  },
  caption: 'Where the head lands tells you what forms. Rows 2 and 3 are the same arrow run in opposite directions.',
});

/* NH3 + H–Cl: two arrows at once. */
function nh3hcl(x0, y) {
  let s = '';
  const n = P(x0 + 50, y + 6);
  s += mol(ammonia(n));
  const h = P(x0 + 150, y - 40);
  const m = hx(h, 'Cl', 58, 'x');
  s += mol(m);
  const cl = m.atoms.x;
  s += curve(P(n.x + 2, n.y - 27), P(h.x - 13, h.y + 2), { bow: -20 });
  s += num(x0 + 88, y - 58, '1');
  s += curve(mid(h, cl), P(cl.x + 4, cl.y - 16), { bow: -18 });
  s += num(x0 + 190, y - 82, '2');
  return { s, n, h, cl };
}

FIGURES.push({
  id: 'ca-nh3-hcl',
  section: 'curved-arrows',
  anchor: '<span class="k">Worked example — ammonia takes the proton from H–Cl</span>',
  viewBox: '0 0 760 220',
  alt: 'Ammonia and hydrogen chloride. Arrow 1 runs from the nitrogen lone pair to the hydrogen of H–Cl. Arrow 2 runs from the H–Cl bond onto the chlorine. The products are the ammonium ion, with a plus charge on nitrogen, and the chloride ion, with four lone pairs and a minus charge.',
  build() {
    let s = '';
    s += nh3hcl(30, 110).s;
    s += arrow(P(320, 110), P(390, 110));
    s += mol(ammonium(P(490, 116)));
    s += plusSign(580, 110);
    s += mol(halide(P(650, 110), 'Cl'));
    s += rule(24, 178, 736, 178);
    s += tg(170, 200, 'arrow 1 makes N–H; arrow 2 breaks H–Cl');
    s += tg(570, 200, 'charge out: +1 on N, −1 on Cl; sum 0');
    return s;
  },
  caption: 'Arrow 1 alone would give the hydrogen two bonds. Arrow 2 takes the old H–Cl pair onto chlorine at the same moment.',
});

/* Hydroxide takes the O–H proton of ethanol. */
FIGURES.push({
  id: 'ca-deprotonation',
  section: 'curved-arrows',
  anchor: '<span class="k">Worked example — hydroxide takes the proton from ethanol</span>',
  viewBox: '0 0 760 210',
  alt: 'Hydroxide and ethanol, with ethanol drawn skeletally as a two-carbon zigzag ending in O–H. Arrow 1 runs from a hydroxide lone pair to the hydrogen of the O–H. Arrow 2 runs from the O–H bond onto the ethanol oxygen. The products are water and ethoxide, whose oxygen has three lone pairs and a minus charge.',
  build() {
    let s = '';
    const y = 120;
    const oh = P(70, y);
    s += mol(hydroxide(oh, 180, 'hy'));
    /* ethanol: skeletal C–C, then O, then H on the left of O */
    const h = P(150, y - 30), o = P(206, y - 30);
    const c1 = at(o, 30, 44), c2 = at(c1, 330, 38);
    const et = { atoms: { eh: { ...h, l: 'H' }, eo: { ...o, l: 'O' }, c1: { ...c1, l: '' }, c2: { ...c2, l: '' } },
      bonds: [['eh', 'eo'], ['eo', 'c1'], ['c1', 'c2']], lp: [['eo', 270], ['eo', 120]] };
    s += mol(et);
    s += curve(P(oh.x + 21, oh.y - 6), P(h.x - 11, h.y + 7), { bow: 10 });
    s += num(100, y - 52, '1');
    s += curve(mid(h, o), P(o.x - 3, o.y - 18), { bow: -16 });
    s += num(172, y - 72, '2');
    s += arrow(P(330, y - 10), P(400, y - 10));
    s += mol(water(P(470, y - 4)));
    s += plusSign(530, y - 10);
    const po = P(600, y - 10), pc1 = at(po, 30, 44), pc2 = at(pc1, 330, 38);
    s += mol({ atoms: { po: { ...po, l: 'O' }, pc1: { ...pc1, l: '' }, pc2: { ...pc2, l: '' } },
      bonds: [['po', 'pc1'], ['pc1', 'pc2']], lp: [['po', 270], ['po', 180], ['po', 110]], charges: [['po', '−', 225, 29]] });
    s += rule(24, 170, 736, 170);
    s += tg(190, 192, 'charge in: −1 on hydroxide O');
    s += tg(570, 192, 'charge out: −1 on the ethoxide O');
    return s;
  },
  caption: 'The same two arrows as the ammonia example. This time the oxygen that loses the proton keeps the O–H pair.',
});

/* HO− + CH3Br: one arrow is not enough. */
function sn2Row(ox, y, both) {
  let s = '';
  const oh = P(ox + 34, y);
  s += mol(hydroxide(oh, 180, 'sh'));
  const c = P(ox + 140, y);
  const m = ch3br(c, 'sb');
  s += mol(m);
  const br = m.atoms.sbBr;
  s += curve(P(oh.x + 21, oh.y - 6), P(c.x - 16, c.y - 4), { bow: -14 });
  if (both) s += curve(mid(c, br), P(br.x + 2, br.y - 18), { bow: -16 });
  return s;
}

FIGURES.push({
  id: 'ca-two-arrows',
  section: 'curved-arrows',
  anchor: '<span class="k">Worked example — hydroxide and bromomethane</span>',
  viewBox: '0 0 760 330',
  alt: 'Two rows. Top row, marked wrong: one arrow from hydroxide to the carbon of bromomethane gives a carbon with five bonds, to O, Br and three H. Bottom row, marked right: the same arrow plus a second arrow from the C–Br bond onto bromine gives methanol and a bromide ion with four lone pairs and a minus charge.',
  build() {
    let s = '';
    /* top: wrong */
    s += panel(14, 10, 732, 146, { kind: 'warn' });
    s += warn(30, 32, 'one arrow only', 'start');
    s += sn2Row(24, 96, false);
    s += arrow(P(300, 96), P(360, 96));
    const c5 = P(510, 96);
    const w = { atoms: { c: { ...c5, l: 'C', k: 'warn' }, o: { ...at(c5, 180, 54), l: 'O' }, br: { ...at(c5, 0, 56), l: 'Br' } },
      bonds: [['c', 'o'], ['c', 'br']], lp: [['o', 90], ['o', 270], ['br', 270], ['br', 0], ['br', 90]] };
    addH(w, 'c', [270, 110, 70]);
    w.atoms.oh = { ...at(w.atoms.o, 180, 34), l: 'H' }; w.bonds.push(['o', 'oh']);
    s += mol(w);
    s += warn(660, 60, 'five bonds', 'middle');
    s += warn(660, 76, 'on carbon:', 'middle');
    s += warn(660, 92, 'impossible', 'middle');
    /* bottom: right */
    s += panel(14, 170, 732, 150, { kind: 'good' });
    s += good(30, 192, 'two arrows at once', 'start');
    s += sn2Row(24, 262, true);
    s += num(118, 222, '1');
    s += num(206, 222, '2');
    s += arrow(P(300, 262), P(360, 262));
    const pc = P(490, 262), po = at(pc, 180, 52);
    const pm = { atoms: { c: { ...pc, l: 'C' }, o: { ...po, l: 'O' } }, bonds: [['c', 'o', 1, 'fg-bond-hi']], lp: [['o', 90], ['o', 270]] };
    addH(pm, 'c', [270, 0, 90]);
    pm.atoms.oh = { ...at(po, 180, 34), l: 'H' }; pm.bonds.push(['o', 'oh']);
    s += mol(pm);
    s += plusSign(580, 262);
    s += mol(halide(P(650, 262), 'Br'));
    return s;
  },
  caption: 'Arrow 1 fills the carbon with a fifth bond; arrow 2 empties it again by sending the C–Br pair onto bromine.',
});

/* The four patterns, each as a reaction. */
function patternRows() {
  return [
    {
      title: '1 · a lone pair makes a new bond to an electron-poor atom',
      draw(y) {
        let s = '';
        const oh = P(90, y);
        s += mol(hydroxide(oh, 180, 'p1'));
        const c = P(210, y);
        const t = tbutyl(c, 180, 'p1t');
        s += mol(t);
        s += plusSign(c.x + 2, c.y - 16);
        s += curve(P(oh.x + 21, oh.y - 6), P(c.x - 6, c.y - 3), { bow: -14 });
        s += arrow(P(310, y), P(370, y));
        const pc = P(520, y), po = at(pc, 180, 44);
        const pm = join(tbutyl(pc, 180, 'q1t'), { atoms: { po: { ...po, l: 'O' }, ph: { ...at(po, 180, 34), l: 'H' } }, bonds: [['q1t', 'po', 1, 'fg-bond-hi'], ['po', 'ph']], lp: [['po', 90], ['po', 270]] });
        s += mol(pm);
        return s;
      },
      note: 'one arrow: the C⁺ has room',
    },
    {
      title: '2 · a bond breaks, and one atom keeps both electrons',
      draw(y) {
        let s = '';
        const c = P(150, y);
        const t = tbutyl(c, 0, 'p2t');
        t.atoms.br = { ...at(c, 0, 56), l: 'Br' };
        t.bonds.push(['p2t', 'br']);
        t.lp = [['br', 270], ['br', 0], ['br', 90]];
        s += mol(t);
        s += curve(mid(c, t.atoms.br), P(t.atoms.br.x - 4, t.atoms.br.y - 18), { bow: -16 });
        s += arrow(P(310, y), P(370, y));
        const pc = P(460, y);
        s += mol(tbutyl(pc, 0, 'q2t'));
        s += plusSign(pc.x + 16, pc.y);
        s += plusSign(530, y);
        s += mol(halide(P(590, y), 'Br', 'q2b'));
        return s;
      },
      note: 'one arrow: no new bond forms',
    },
    {
      title: '3 · proton transfer',
      draw(y) {
        let s = '';
        const oh = P(70, y);
        s += mol(hydroxide(oh, 180, 'p3'));
        const h = P(150, y - 18);
        const m = hx(h, 'Cl', 56, 'p3x');
        s += mol(m);
        s += curve(P(oh.x + 21, oh.y - 6), P(h.x - 12, h.y + 3), { bow: -10 });
        s += curve(mid(h, m.atoms.p3x), P(m.atoms.p3x.x + 2, m.atoms.p3x.y - 18), { bow: -16 });
        s += arrow(P(310, y), P(370, y));
        s += mol(water(P(440, y + 4), 'p3w'));
        s += plusSign(510, y);
        s += mol(halide(P(580, y), 'Cl', 'p3c'));
        return s;
      },
      note: 'two arrows: H can hold one bond',
    },
    {
      title: '4 · a neighboring C–H bond shifts (a 1,2-hydride shift)',
      draw(y) {
        let s = '';
        /* 3-methylbutan-2-yl cation: C1-C2(+)-C3(H)(CH3)-C4 */
        const c1 = P(50, y + 14), c2 = P(88, y - 8), c3 = P(126, y + 14), c4 = P(164, y - 8), me = P(126, y + 58);
        const hh = at(c3, 270, 0);
        const m = { atoms: { c1: { ...c1, l: '' }, c2: { ...c2, l: '' }, c3: { ...c3, l: '' }, c4: { ...c4, l: '' }, me: { ...me, l: '' },
          h: { ...P(c3.x + 30, c3.y + 20), l: 'H', k: 'hi' } },
          bonds: [['c1', 'c2'], ['c2', 'c3'], ['c3', 'c4'], ['c3', 'me'], ['c3', 'h', 1, 'fg-bond-hi']] };
        s += mol(m);
        s += plusSign(c2.x, c2.y - 16);
        void hh;
        s += curve(mid(c3, m.atoms.h), P(c2.x + 6, c2.y + 8), { bow: 26 });
        s += arrow(P(310, y), P(370, y));
        /* 2-methylbutan-2-yl cation: H now on C2, + on C3 */
        const d1 = P(430, y + 14), d2 = P(468, y - 8), d3 = P(506, y + 14), d4 = P(544, y - 8), dm = P(506, y + 58);
        const p = { atoms: { d1: { ...d1, l: '' }, d2: { ...d2, l: '' }, d3: { ...d3, l: '' }, d4: { ...d4, l: '' }, dm: { ...dm, l: '' },
          h: { ...P(d2.x - 2, d2.y - 38), l: 'H', k: 'hi' } },
          bonds: [['d1', 'd2'], ['d2', 'd3'], ['d3', 'd4'], ['d3', 'dm'], ['d2', 'h', 1, 'fg-bond-hi']] };
        s += mol(p);
        s += plusSign(d3.x + 16, d3.y + 2);
        return s;
      },
      note: 'one arrow: H moves with its pair',
    },
  ];
}

FIGURES.push({
  id: 'arrow-patterns',
  section: 'curved-arrows',
  anchor: '<h3>Four patterns</h3>',
  alt: 'Four reactions, one per row. 1: hydroxide gives a lone pair to a carbocation carbon bonded to three methyl groups, giving an alcohol. 2: the C–Br bond of the matching bromide breaks with both electrons going to bromine, giving that carbocation and bromide. 3: hydroxide takes the proton from H–Cl with two arrows, giving water and chloride. 4: in a five-carbon cation, the C–H bond on the carbon next to the positive carbon moves over with its pair, so the hydrogen ends up on the carbon that was positive and the positive charge moves to the carbon that lost the hydrogen.',
  viewBox: '0 0 760 560',
  build() {
    let s = '';
    patternRows().forEach((r, i) => {
      const y0 = 10 + i * 138;
      s += panel(14, y0, 732, 128);
      s += lbl(30, y0 + 24, r.title, 'start');
      s += r.draw(y0 + 76);
      s += tg(690, y0 + 80, r.note.split(': ')[0] + ':', 'middle');
      s += tg(690, y0 + 96, r.note.split(': ')[1], 'middle');
    });
    return s;
  },
  caption: 'Four reactions, one per row. Count the arrows in each, and check that the charges on each side add up to the same total.',
});

/* Four invalid arrows, one per check. */
function badRows() {
  return [
    {
      title: 'tail on a positive charge',
      draw(y) {
        let s = '';
        const c = P(120, y);
        s += mol(tbutyl(c, 0, 'v1t'));
        s += plusSign(c.x + 14, c.y - 12);
        const oh = P(260, y);
        s += mol(hydroxide(oh, 0, 'v1'));
        s += curve(P(c.x + 20, c.y - 16), P(oh.x - 18, oh.y - 8), { bow: -18 });
        return s;
      },
      why: ['C⁺ has no pair to give;', 'it can only receive one'],
    },
    {
      title: 'an atom with too many bonds',
      draw(y) {
        let s = '';
        const n = P(90, y + 10);
        s += mol(ammonia(n));
        const h = P(190, y - 30);
        const m = hx(h, 'Cl', 56, 'v2x');
        m.atoms.v2xH.k = 'warn';
        s += mol(m);
        s += curve(P(n.x + 2, n.y - 27), P(h.x - 13, h.y + 2), { bow: -20 });
        return s;
      },
      why: ['H would end with two bonds;', 'the H–Cl bond must break too'],
    },
    {
      title: 'charges that do not balance',
      draw(y) {
        let s = '';
        const oh = P(60, y);
        s += mol(hydroxide(oh, 180, 'v3'));
        const h = P(130, y - 18);
        s += mol(hx(h, 'Cl', 52, 'v3x'));
        s += arrow(P(236, y), P(280, y));
        s += mol(water(P(330, y + 4), 'v3w'));
        s += plusSign(378, y);
        s += mol({ atoms: { cl: { x: 428, y, l: 'Cl', k: 'warn' } }, bonds: [], lp: [['cl', 270], ['cl', 0], ['cl', 90], ['cl', 180]] });
        return s;
      },
      why: ['in: −1, out: 0;', 'the product Cl needs its −'],
    },
    {
      title: 'a pair pushed toward the δ+ end',
      draw(y) {
        let s = '';
        const c = P(150, y + 14);
        const m = acetone(c, 'neutral', 'v4');
        s += mol(m);
        s += tg(c.x - 22, c.y - 12, 'δ+');
        s += tg(m.atoms.v4O.x - 32, m.atoms.v4O.y + 4, 'δ−');
        s += curve(P(c.x + 5, c.y - 22), P(c.x + 8, c.y + 4), { bow: -18 });
        return s;
      },
      why: ['the π pair goes onto the δ+ C,', 'away from the δ− O: backwards'],
    },
  ];
}

FIGURES.push({
  id: 'ca-invalid',
  section: 'curved-arrows',
  anchor: '<h3>Spotting invalid arrows</h3>',
  viewBox: '0 0 760 560',
  alt: 'Four wrong arrows, one per row, each with the reason. 1: an arrow starts on a carbocation plus charge and points at hydroxide. 2: an arrow from ammonia to the hydrogen of H–Cl with no second arrow, which would give hydrogen two bonds. 3: hydroxide and H–Cl give water and a chlorine with no charge, so the charge goes from minus one to zero. 4: in acetone an arrow moves the C=O pi pair onto the partially positive carbon instead of the partially negative oxygen.',
  build() {
    let s = '';
    badRows().forEach((r, i) => {
      const y0 = 10 + i * 138;
      s += panel(14, y0, 732, 128, { kind: 'warn' });
      s += warn(30, y0 + 24, `${i + 1} · ${r.title}`, 'start');
      s += r.draw(y0 + 76);
      s += tg(620, y0 + 66, r.why[0]);
      s += tg(620, y0 + 84, r.why[1]);
    });
    return s;
  },
  caption: 'One broken rule per row. Each of these arrows is a common mistake.',
});

/* Resonance versus mechanism: the same C=O arrow in both. */
FIGURES.push({
  id: 'ca-resonance-mechanism',
  section: 'curved-arrows',
  anchor: '<h3>Arrows in resonance and arrows in a mechanism</h3>',
  viewBox: '0 0 760 330',
  alt: 'Two rows. Top, resonance: acetone and its charge-separated drawing with C plus and O minus, joined by a double-headed arrow; one curved arrow moves the C=O pi pair onto oxygen. Bottom, mechanism: hydroxide and acetone joined by a single-headed reaction arrow to a product in which hydroxide is bonded to the former C=O carbon and the oxygen carries a minus charge; one arrow runs from a hydroxide lone pair to that carbon and a second moves the pi pair onto oxygen.',
  build() {
    let s = '';
    s += panel(14, 10, 732, 140);
    s += lbl(30, 34, 'resonance: one molecule, two drawings', 'start');
    const c = P(260, 100);
    const m = acetone(c, 'neutral', 'ra');
    s += mol(m);
    s += curve(P(c.x + 5, c.y - 22), P(m.atoms.raO.x + 16, m.atoms.raO.y + 4), { bow: 12 });
    s += dbl(P(340, 90), P(410, 90));
    s += mol(acetone(P(490, 100), 'split', 'rb'));
    s += tg(650, 80, '↔: no atom moves,');
    s += tg(650, 96, 'nothing new bonds');

    s += panel(14, 164, 732, 156);
    s += lbl(30, 188, 'mechanism: one species becomes another', 'start');
    const y = 262;
    const oh = P(90, y);
    s += mol(hydroxide(oh, 180, 'mo'));
    const k = P(200, y + 14);
    const km = acetone(k, 'neutral', 'mk');
    s += mol(km);
    s += curve(P(oh.x + 21, oh.y - 6), P(k.x - 8, k.y - 5), { bow: 10 });
    s += curve(P(k.x + 5, k.y - 22), P(km.atoms.mkO.x + 16, km.atoms.mkO.y + 4), { bow: 12 });
    s += arrow(P(300, y), P(370, y));
    /* product: tetrahedral carbon with O− up, OH left, methyls down */
    const pc = P(490, y + 14);
    const pm = { atoms: { c: { ...pc, l: '' }, o: { ...at(pc, 270, 44), l: 'O' }, ho: { ...at(pc, 180, 46), l: 'O' },
      m1: { ...at(pc, 120, 38), l: '' }, m2: { ...at(pc, 45, 38), l: '' } },
      bonds: [['c', 'o'], ['c', 'ho', 1, 'fg-bond-hi'], ['c', 'm1'], ['c', 'm2']],
      lp: [['o', 180], ['o', 270], ['o', 0], ['ho', 120], ['ho', 240]], charges: [['o', '−', 315, 28]] };
    pm.atoms.hh = { ...at(pm.atoms.ho, 180, 34), l: 'H' }; pm.bonds.push(['ho', 'hh']);
    s += mol(pm);
    s += tg(650, 246, '→: a new C–O bond,');
    s += tg(650, 262, 'a new species');
    return s;
  },
  caption: 'The arrow that moves the C=O pair onto oxygen appears in both rows. Only the arrow between the drawings says which job it is doing.',
});

/* Fishhooks. */
function fishRows(narrow) {
  const k = narrow ? 0.62 : 1;
  const x = (v) => v * k;
  return [
    {
      title: 'two barbs: two electrons move together',
      draw(y, x0) {
        let s = '';
        const c = P(x0 + x(80), y);
        const t = tbutyl(c, 0, 'f1t');
        t.atoms.br = { ...at(c, 0, 54), l: 'Br' };
        t.bonds.push(['f1t', 'br']);
        t.lp = [['br', 270], ['br', 0], ['br', 90]];
        s += mol(t);
        s += curve(mid(c, t.atoms.br), P(t.atoms.br.x - 4, t.atoms.br.y - 18), { bow: -16 });
        return s;
      },
      product(y, x0) {
        let s = '';
        const pc = P(x0, y);
        s += mol(tbutyl(pc, 0, 'g1t'));
        s += plusSign(pc.x + 16, pc.y);
        s += mol(halide(P(pc.x + 74, y), 'Br', 'g1b'));
        return s;
      },
    },
    {
      title: 'one barb: one electron each way',
      draw(y, x0) {
        let s = '';
        const a = P(x0 + x(70), y), b = P(x0 + x(70) + 58, y);
        const m = { atoms: { a: { ...a, l: 'Cl' }, b: { ...b, l: 'Cl' } }, bonds: [['a', 'b']], lp: [['a', 180], ['a', 90], ['b', 0], ['b', 90]] };
        s += mol(m);
        const md = mid(a, b);
        s += fishhook(P(md.x - 3, md.y - 3), P(a.x + 2, a.y - 18), { bow: 12, side: -1 });
        s += fishhook(P(md.x + 3, md.y - 3), P(b.x - 2, b.y - 18), { bow: -12, side: 1 });
        return s;
      },
      product(y, x0) {
        let s = '';
        const a = P(x0, y), b = P(x0 + 84, y);
        s += mol({ atoms: { a: { ...a, l: 'Cl' }, b: { ...b, l: 'Cl' } }, bonds: [], lp: [['a', 180], ['a', 90], ['a', 270], ['b', 0], ['b', 90], ['b', 270]] });
        s += dot(a.x + 21, a.y) + dot(b.x - 21, b.y);
        return s;
      },
    },
  ];
}

FIGURES.push({
  id: 'ca-fishhook',
  section: 'curved-arrows',
  anchor: '<h3>Fishhook arrows move one electron</h3>',
  viewBox: '0 0 760 300',
  alt: 'Two rows. Top: a full two-barbed arrow moves the C–Br bonding pair onto bromine, giving a carbocation and bromide. Bottom: two single-barbed fishhook arrows split the Cl–Cl bond, one electron to each chlorine, giving two chlorine atoms that each carry one unpaired electron, shown as a single dot.',
  build() {
    let s = '';
    fishRows(false).forEach((r, i) => {
      const y0 = 10 + i * 144;
      s += panel(14, y0, 732, 134);
      s += lbl(30, y0 + 26, r.title, 'start');
      s += r.draw(y0 + 84, 70);
      s += arrow(P(330, y0 + 84), P(400, y0 + 84));
      s += r.product(y0 + 84, 480);
    });
    return s;
  },
  caption: 'Count the barbs on each head. The dot on each chlorine in the bottom row is its unpaired electron.',
});

/* ============================================================= LESSON === */
/* Stacked copies at 340 wide, fg-lbl and fg-tag text only. */

FIGURES.push({
  id: 'l-ca-first-arrow',
  lessons: ['curved-arrows'],
  viewBox: '0 0 340 330',
  alt: 'Ammonia and a hydrogen ion. A curved arrow starts on the nitrogen lone pair and ends on H+. Below, a reaction arrow leads to the ammonium ion, with the new N–H bond highlighted and a plus charge on nitrogen.',
  build() {
    let s = '';
    const { s: d, n, hp } = firstArrow(20, 40);
    s += d;
    s += tg(n.x - 30, 34, 'tail: the lone pair', 'start');
    s += tg(hp.x, hp.y + 32, 'head: H⁺');
    s += arrow(P(170, 170), P(170, 214));
    s += mol(ammonium(P(170, 276)));
    s += tg(250, 244, 'new N–H', 'start');
    s += tg(250, 260, 'bond', 'start');
    return s;
  },
  caption: 'Tail on the lone pair, head on H⁺.',
});

FIGURES.push({
  id: 'l-ca-bad-tail',
  lessons: ['curved-arrows'],
  viewBox: '0 0 340 150',
  alt: 'A carbocation, a carbon bonded to three methyl groups and carrying a plus charge, next to hydroxide. A curved arrow starts on the plus charge of the carbon and ends on the hydroxide oxygen.',
  build() {
    let s = '';
    s += panel(8, 8, 324, 134, { kind: 'warn' });
    const c = P(90, 90);
    s += mol(tbutyl(c, 0, 'bt'));
    s += plusSign(c.x + 14, c.y - 12);
    const oh = P(240, 90);
    s += mol(hydroxide(oh, 0, 'bo'));
    s += curve(P(c.x + 20, c.y - 16), P(oh.x - 18, oh.y - 8), { bow: -18 });
    s += warn(170, 30, 'the arrow drawn');
    return s;
  },
  caption: 'The tail sits on the + of the carbon.',
});

FIGURES.push({
  id: 'l-ca-heads',
  lessons: ['curved-arrows'],
  viewBox: '0 0 340 500',
  alt: 'Three rows. Row 1: a lone pair on hydroxide moves to a methyl cation carbon, giving methanol with a new C–O bond. Row 2: in acetone, the C=O pi pair moves onto oxygen, giving C plus and O minus with three lone pairs. Row 3: the reverse: an O minus lone pair moves into the C–O bond and remakes C=O.',
  build() {
    const { rows } = headRows(true);
    let s = '';
    rows.forEach((r, i) => {
      const y0 = 8 + i * 164;
      s += panel(4, y0, 332, 154);
      s += lbl(170, y0 + 22, r.title.split(': ')[0] + ':');
      s += lbl(170, y0 + 40, r.title.split(': ')[1]);
      s += r.draw(y0 + 104);
    });
    return s;
  },
  caption: 'Rows 2 and 3 run the same arrow in opposite directions.',
});

FIGURES.push({
  id: 'l-ca-nh3-hcl',
  lessons: ['curved-arrows'],
  viewBox: '0 0 340 300',
  alt: 'Ammonia and H–Cl. Arrow 1 runs from the nitrogen lone pair to the hydrogen. Arrow 2 runs from the H–Cl bond onto chlorine. Below, the products: ammonium with a plus charge and chloride with a minus charge.',
  build() {
    let s = '';
    s += nh3hcl(20, 120).s;
    s += arrow(P(170, 160), P(170, 200));
    s += mol(ammonium(P(110, 256)));
    s += plusSign(185, 250);
    s += mol(halide(P(250, 250), 'Cl'));
    return s;
  },
  caption: 'Arrow 1 makes N–H. Arrow 2 breaks H–Cl.',
});

FIGURES.push({
  id: 'l-ca-fishhook',
  lessons: ['curved-arrows'],
  viewBox: '0 0 340 420',
  alt: 'Two panels. Top: a full two-barbed arrow moves the C–Br pair onto bromine, giving a carbocation and bromide. Bottom: two single-barbed fishhooks split Cl–Cl, one electron to each chlorine, giving two chlorine atoms with one unpaired electron each.',
  build() {
    let s = '';
    fishRows(true).forEach((r, i) => {
      const y0 = 8 + i * 206;
      s += panel(4, y0, 332, 196);
      s += lbl(170, y0 + 24, r.title);
      s += r.draw(y0 + 74, 60);
      s += arrow(P(170, y0 + 104), P(170, y0 + 134));
      s += r.product(y0 + 164, i === 0 ? 120 : 128);
    });
    return s;
  },
  caption: 'Count the barbs. The dot on each chlorine is one unpaired electron.',
});

FIGURES.push({
  id: 'l-ca-carbanion',
  lessons: ['curved-arrows'],
  viewBox: '0 0 340 170',
  alt: 'A methyl carbanion, a carbon with three hydrogens, a lone pair and a minus charge, next to acetone drawn skeletally with its C=O carbon marked partially positive.',
  build() {
    let s = '';
    const c = P(80, 100);
    const m = addH({ atoms: { c: { ...c, l: 'C' } }, bonds: [], lp: [['c', 0]], charges: [['c', '−', 315, 28]] }, 'c', [270, 180, 90], 36);
    s += mol(m);
    s += tg(80, 30, 'CH₃⁻');
    const k = P(240, 110);
    s += mol(acetone(k, 'neutral', 'ck'));
    s += tg(k.x + 24, k.y + 4, 'δ+', 'start');
    return s;
  },
  caption: 'The carbanion carries a lone pair. The C=O carbon is δ+.',
});

export default FIGURES;
