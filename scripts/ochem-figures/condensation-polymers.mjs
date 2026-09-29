/* Figures for the condensation-polymers notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every backbone is drawn skeletal: carbons are unlabeled vertices, N, O and
   Cl are labeled, and a para-phenylene ring sits on the chain with its 1,4
   axis along the bond it replaces, so a para-linked chain stays straight. A
   chain is built one bond at a time from its bond angles (see `chain`), and
   the groups on a vertex (C=O, N–H) point straight out of the zigzag, which
   is where they really point.

   Lesson copies (id prefix l-) are no wider than 340, stack their panels in
   one column and use only fg-lbl and fg-tag text. */
import { atom, bond, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { ringDouble, polyPts } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
/* Point at distance d from p in screen direction deg (0 = right, 90 = down). */
const at = (p, deg, d) => P(p.x + Math.cos((deg * Math.PI) / 180) * d, p.y + Math.sin((deg * Math.PI) / 180) * d);
const rad = (l) => (!l ? 0 : l === 'H' ? 9 : l.length === 1 ? 10 : l.length === 2 ? 13 : 4 + l.length * 4);
const unit = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1; return P(dx / n, dy / n); };
/* A bracket across a horizontal-ish stub bond. dir 1 opens right, -1 opens left. */
const brack = (x, y, h, dir) => {
  const t = y - h / 2, b = y + h / 2;
  return `<path class="fg-bond" d="M${x + 7 * dir} ${t} L${x} ${t} L${x} ${b} L${x + 7 * dir} ${b}"></path>`;
};
const hbond = (a, b, cls = 'fg-dash-hi') =>
  `<line class="${cls}" x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}"></line>`;
/* A Kekulé benzene whose inner double-bond lines scale with the ring, so a
   small ring still shows three clear inner lines. Vertex 0 points along screen
   angle `deg`. */
function ring6(cx, cy, rr, deg = 0) {
  const pts = polyPts(cx, cy, 6, rr, -deg);
  const c = P(cx, cy);
  let o = '';
  for (let i = 0; i < 6; i++) {
    const a = pts[i], b = pts[(i + 1) % 6];
    o += i % 2 === 0 ? ringDouble(a, b, c, { inset: rr * 0.24, gap: rr * 0.24 }) : bond(a, b, { rFrom: 0, rTo: 0 });
  }
  return o;
}

/* A skeletal chain, built bond by bond.
   start: { x, y, l } — the first node (l '' for a carbon vertex or a stub end).
   steps: [{ d, l, k, ring, hi, sub }] — each step adds one bond leaving at screen
   angle d and ending on a node labeled l ('' = carbon vertex). ring: true
   puts a para-phenylene ring on this step, drawn along d with the bond into
   it, the ring and the bond out of it all collinear. hi highlights the bond
   into the node (hiOut: the bond out of the ring). sub lists groups on the
   node: { l, order, k, deg, len } — deg defaults to straight out of the
   zigzag. Returns the ink and the nodes (each with its substituent atoms). */
function chain(start, steps, { L = 28, rr = 15 } = {}) {
  const first = { x: start.x, y: start.y, l: start.l || '', k: start.k, r: start.r ?? rad(start.l || ''), nb: [] };
  const nodes = [first];
  let s = '', ringInk = '';
  let cur = first;
  for (const st of steps) {
    let from = cur;
    if (st.ring) {
      const A = at(from, st.d, L), c = at(A, st.d, rr), B = at(A, st.d, 2 * rr);
      s += bond(from, A, { rFrom: from.r, rTo: 0, cls: st.hiIn ? 'fg-bond-hi' : 'fg-bond' });
      from.nb.push(A);
      ringInk += ring6(c.x, c.y, rr, st.d);
      from = { x: B.x, y: B.y, r: 0, nb: [] };
    }
    const p = at(from, st.d, st.len ?? L);
    const nd = { x: p.x, y: p.y, l: st.l || '', k: st.k, r: st.r ?? rad(st.l || ''), sub: st.sub, nb: [from], subs: [] };
    if (!st.ring) from.nb.push(nd);
    s += bond(from, nd, { rFrom: from.r, rTo: nd.r, cls: st.hi ? 'fg-bond-hi' : st.cls || 'fg-bond' });
    nodes.push(nd);
    cur = nd;
  }
  /* Substituents, pointing straight out of the angle their two bonds make. */
  for (const nd of nodes) {
    if (!nd.sub) continue;
    let ex = 0, ey = 0;
    for (const q of nd.nb) { const u = unit(nd, q); ex -= u.x; ey -= u.y; }
    const base = Math.atan2(ey, ex) * 180 / Math.PI;
    for (const g of nd.sub) {
      const deg = g.deg ?? base + (g.turn || 0);
      const q = at(nd, deg, g.len ?? L * 0.95);
      const a = { x: q.x, y: q.y, l: g.l, k: g.k, r: g.r ?? rad(g.l), deg };
      s += bond(nd, a, { rFrom: nd.r, rTo: a.r, order: g.order || 1, gap: 3.2, cls: g.hi ? 'fg-bond-hi' : 'fg-bond' });
      nd.subs.push(a);
    }
  }
  let atoms = '';
  for (const nd of nodes) {
    if (nd.l) atoms += atom(nd.x, nd.y, nd.l, { r: nd.r, kind: nd.k });
    for (const a of nd.subs || []) if (a.l) atoms += atom(a.x, a.y, a.l, { r: a.r, kind: a.k });
  }
  return { svg: s + ringInk + atoms, nodes, last: cur };
}
/* Alternating zigzag directions: dir(i) for bond i, starting up (-30) or down (+30). */
const zz = (i, first = -30) => (i % 2 ? -first : first);
/* Steps for a plain run of labels along a zigzag. */
const run = (labels, first = -30, extra = {}) => labels.map((l, i) => ({ d: zz(i, first), l, ...(extra[i] || {}) }));
const O2 = (k) => ({ l: 'O', order: 2, k });

/* ------------------------------------------------ PET: build and bracket --- */
/* Terephthalic acid, ethylene glycol and the PET repeat unit. Shared by the
   notes figure and its stacked lesson copy; `o` sets the scale. */
function terephthalicAcid(x, y, L, rr) {
  /* HO–C(=O)–[ring]–C(=O)–OH, left to right. */
  return chain({ x, y, l: 'HO' }, [
    { d: -30, l: '', sub: [O2()] },
    { d: 30, l: '', ring: true, sub: [O2()] },
    { d: -30, l: 'OH', k: 'warn' },
  ], { L, rr });
}
function ethyleneGlycol(x, y, L) {
  /* H–O–CH2–CH2–O–H, with the H that leaves drawn on its own. */
  return chain({ x, y, l: 'H', k: 'warn' }, [
    { d: 0, l: 'O' }, { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: 'OH' },
  ], { L });
}
function petRepeat(x, y, L, rr) {
  /* stub–O–CH2–CH2–O–C(=O)–[ring]–C(=O)–stub */
  const c = chain({ x, y, l: '' }, [
    { d: 30, l: 'O', hi: true },
    { d: -30, l: '' }, { d: 30, l: '' },
    { d: -30, l: 'O' },
    { d: 30, l: '', hi: true, sub: [O2()] },
    { d: -30, l: '', ring: true, sub: [O2()] },
    { d: 30, l: '', hi: true },
  ], { L, rr });
  return c;
}

FIGURES.push({
  id: 'pet-build',
  section: 'condensation-polymers',
  viewBox: '0 0 760 330',
  alt: 'Terephthalic acid, a benzene ring with a COOH group at each end of the para axis, plus ethylene glycol, HO–CH2–CH2–OH. The OH of the acid and the H of the alcohol are colored as the atoms that leave as water. Below, the bracketed PET repeat unit: O–CH2–CH2–O–C(=O)–ring–C(=O), with the two acyl carbon to oxygen bonds highlighted as the new ester bonds.',
  build() {
    let s = '';
    s += tag(40, 30, 'TWO MONOMERS, EACH WITH TWO REACTIVE GROUPS', { anchor: 'start' });
    const acid = terephthalicAcid(90, 104, 30, 16);
    s += acid.svg;
    s += text(186, 168, 'terephthalic acid', { cls: 'fg-lbl', size: 12.5 });
    s += text(186, 186, '(benzene-1,4-dicarboxylic acid)', { cls: 'fg-tag-mut', size: 11 });
    s += text(345, 108, '+', { cls: 'fg-lbl', size: 16 });
    const gly = ethyleneGlycol(390, 104, 30);
    s += gly.svg;
    s += text(470, 168, 'ethylene glycol', { cls: 'fg-lbl', size: 12.5 });
    s += text(470, 186, '(ethane-1,2-diol)', { cls: 'fg-tag-mut', size: 11 });
    s += text(560, 92, 'coral: the OH and the H', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(560, 108, 'that leave together as H₂O', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += rule(40, 206, 720, 206);
    s += arrow(P(70, 262), P(150, 262), { muted: true });
    s += text(110, 250, '− H₂O', { cls: 'fg-tag', size: 11 });
    s += text(110, 282, 'at every join', { cls: 'fg-tag-mut', size: 11 });
    const rep = petRepeat(186, 262, 30, 16);
    s += rep.svg;
    const n0 = rep.nodes[0], nl = rep.last;
    s += brack((n0.x + rep.nodes[1].x) / 2, (n0.y + rep.nodes[1].y) / 2, 64, 1);
    const bx = (nl.x + rep.nodes[rep.nodes.length - 2].x) / 2 + 4;
    s += brack(bx, (nl.y + rep.nodes[rep.nodes.length - 2].y) / 2, 64, -1);
    s += text(bx + 8, (nl.y + rep.nodes[rep.nodes.length - 2].y) / 2 + 30, 'n', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(600, 244, 'highlighted: the', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(600, 260, 'new ester bonds,', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(600, 276, 'acyl C to O', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(380, 318, 'the PET repeat unit: two esters, one ring, one CH₂CH₂', { cls: 'fg-lbl', size: 12.5 });
    return s;
  },
  caption: 'One ester forms at each end of the acid, and each join releases one water. The acyl carbon keeps its C=O and gains the alcohol oxygen, so the bond that forms is the acyl C–O bond, highlighted in the repeat unit.',
});

FIGURES.push({
  id: 'l-pet-build',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 330',
  alt: 'Terephthalic acid plus ethylene glycol, with the acid OH and the alcohol H colored as the atoms lost as water. Below, the bracketed PET repeat unit with the two new ester bonds highlighted.',
  build() {
    let s = '';
    const acid = terephthalicAcid(22, 70, 22, 13);
    s += acid.svg;
    s += tag(88, 124, 'terephthalic acid');
    s += text(186, 74, '+', { cls: 'fg-lbl', size: 15 });
    const gly = ethyleneGlycol(208, 70, 22);
    s += gly.svg;
    s += tag(262, 124, 'ethylene glycol');
    s += tag(165, 152, 'coral atoms leave together as H₂O', { cls: 'fg-tag-warn' });
    s += arrow(P(165, 166), P(165, 204), { muted: true });
    s += tag(178, 190, '− H₂O per join', { anchor: 'start' });
    const rep = petRepeat(26, 250, 23, 13);
    s += rep.svg;
    const n0 = rep.nodes[0], nl = rep.last, pl = rep.nodes[rep.nodes.length - 2];
    s += brack((n0.x + rep.nodes[1].x) / 2, (n0.y + rep.nodes[1].y) / 2, 56, 1);
    const bx = (nl.x + pl.x) / 2 + 3;
    s += brack(bx, (nl.y + pl.y) / 2, 56, -1);
    s += text(bx + 6, (nl.y + pl.y) / 2 + 26, 'n', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += tag(165, 318, 'highlighted: the two new ester bonds', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The PET repeat unit. The coral OH and H leave as water, and the highlighted bonds are the new esters.',
});

/* ---------------------------------------------- nylon 6,6: build, count --- */
function hexanediamine(x, y, L, numbered) {
  const c = chain({ x, y, l: 'H₂N' }, run(['', '', '', '', '', '', 'NH₂'], -30, { 6: { k: 'warn' } }), { L });
  let s = c.svg;
  if (numbered) c.nodes.slice(1, 7).forEach((nd, i) => { s += text(nd.x, nd.y + (i % 2 ? 20 : -12), String(i + 1), { cls: 'fg-tag', size: 11 }); });
  return { svg: s, c };
}
function adipicAcid(x, y, L, numbered) {
  const c = chain({ x, y, l: 'HO', k: 'warn' }, [
    { d: -30, l: '', sub: [O2()] }, { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' },
    { d: 30, l: '', sub: [O2()] }, { d: -30, l: 'OH' },
  ], { L });
  let s = c.svg;
  if (numbered) c.nodes.slice(1, 7).forEach((nd, i) => {
    const up = i % 2 === 0;
    s += text(nd.x + (i === 0 || i === 5 ? 12 : 0), nd.y + (up ? (i === 0 ? 20 : -12) : (i === 5 ? -10 : 20)), String(i + 1), { cls: 'fg-tag', size: 11 });
  });
  return { svg: s, c };
}
function nylon66Repeat(x, y, L) {
  /* stub–NH–(CH2)6–NH–C(=O)–(CH2)4–C(=O)–stub */
  const H = { l: 'H', len: L * 0.8 };
  return chain({ x, y, l: '' }, [
    { d: -30, l: 'N', sub: [H] },
    { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' },
    { d: 30, l: 'N', sub: [H] },
    { d: -30, l: '', hi: true, sub: [O2()] },
    { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' },
    { d: 30, l: '', sub: [O2()] },
    { d: -30, l: '', hi: true },
  ], { L });
}

FIGURES.push({
  id: 'nylon66-build',
  section: 'condensation-polymers',
  viewBox: '0 0 760 350',
  alt: 'Hexamethylenediamine, H2N–(CH2)6–NH2, with its six carbons numbered, plus adipic acid, HOOC–(CH2)4–COOH, with its six carbons numbered from carboxyl carbon to carboxyl carbon. Below, the bracketed nylon 6,6 repeat unit, NH–(CH2)6–NH–C(=O)–(CH2)4–C(=O), with the two new amide C–N bonds highlighted.',
  build() {
    let s = '';
    s += tag(40, 30, 'SIX CARBONS IN THE DIAMINE, SIX IN THE DIACID', { anchor: 'start' });
    const dia = hexanediamine(70, 104, 30, true);
    s += dia.svg;
    s += text(160, 160, 'hexamethylenediamine', { cls: 'fg-lbl', size: 12.5 });
    s += text(160, 178, '(hexane-1,6-diamine)', { cls: 'fg-tag-mut', size: 11 });
    s += text(345, 108, '+', { cls: 'fg-lbl', size: 16 });
    const ac = adipicAcid(395, 104, 30, true);
    s += ac.svg;
    s += text(502, 168, 'adipic acid', { cls: 'fg-lbl', size: 12.5 });
    s += text(502, 186, '(hexanedioic acid)', { cls: 'fg-tag-mut', size: 11 });
    s += text(690, 92, 'coral: lost', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(690, 108, 'as H₂O', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += rule(40, 206, 720, 206);
    s += arrow(P(50, 272), P(118, 272), { muted: true });
    s += text(84, 260, '− H₂O', { cls: 'fg-tag', size: 11 });
    s += text(84, 292, 'per amide', { cls: 'fg-tag-mut', size: 11 });
    const rep = nylon66Repeat(150, 276, 30);
    s += rep.svg;
    const n = rep.nodes, nl = rep.last, pl = n[n.length - 2];
    s += brack((n[0].x + n[1].x) / 2, (n[0].y + n[1].y) / 2, 64, 1);
    const bx = (nl.x + pl.x) / 2 + 4;
    s += brack(bx, (nl.y + pl.y) / 2, 64, -1);
    s += text(bx + 8, (nl.y + pl.y) / 2 + 30, 'n', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(380, 338, 'the nylon 6,6 repeat unit — highlighted: the two new C–N amide bonds', { cls: 'fg-lbl', size: 12.5 });
    return s;
  },
  caption: 'Count the carbons in each monomer, including the two carboxyl carbons of the acid. The diamine gives the first 6 of the name and the diacid the second.',
});

FIGURES.push({
  id: 'l-nylon66-build',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 400',
  alt: 'Hexamethylenediamine and adipic acid, each with six numbered carbons, and below them the bracketed nylon 6,6 repeat unit with its two new amide bonds highlighted.',
  build() {
    let s = '';
    const dia = hexanediamine(70, 60, 26, true);
    s += dia.svg;
    s += tag(165, 104, 'hexamethylenediamine: 6 C');
    s += text(165, 134, '+', { cls: 'fg-lbl', size: 15 });
    const ac = adipicAcid(62, 186, 26, true);
    s += ac.svg;
    s += tag(165, 244, 'adipic acid: 6 C, both C=O included');
    s += arrow(P(165, 258), P(165, 290), { muted: true });
    s += tag(178, 280, '− H₂O per amide', { anchor: 'start' });
    const rep = nylon66Repeat(14, 348, 19.5);
    s += rep.svg;
    const n = rep.nodes, nl = rep.last, pl = n[n.length - 2];
    s += brack((n[0].x + n[1].x) / 2, (n[0].y + n[1].y) / 2, 50, 1);
    const bx = (nl.x + pl.x) / 2 + 3;
    s += brack(bx, (nl.y + pl.y) / 2, 50, -1);
    s += text(bx + 5, (nl.y + pl.y) / 2 + 24, 'n', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += tag(165, 392, 'highlighted: the new amide bonds', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Nylon 6,6: the diamine supplies the first 6, the diacid the second. Coral atoms leave as water.',
});

/* ----------------------------------------- one monomer carrying both ends --- */
function aminoHexanoic(x, y, L) {
  return chain({ x, y, l: 'H₂N' }, [
    { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' },
    { d: 30, l: '', sub: [O2()] }, { d: -30, l: 'OH', k: 'warn' },
  ], { L });
}
function nylon6Repeat(x, y, L) {
  return chain({ x, y, l: '' }, [
    { d: -30, l: 'N', sub: [{ l: 'H', len: L * 0.8 }] },
    { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' },
    { d: -30, l: '', sub: [O2()] }, { d: 30, l: '', hi: true },
  ], { L });
}
function lacticAcid(x, y, L) {
  return chain({ x, y, l: 'HO' }, [
    { d: -30, l: '', sub: [{ l: '', len: L }] }, { d: 30, l: '', sub: [O2()] }, { d: -30, l: 'OH', k: 'warn' },
  ], { L });
}
function plaRepeat(x, y, L) {
  return chain({ x, y, l: '' }, [
    { d: -30, l: 'O' }, { d: 30, l: '', sub: [{ l: '', len: L }] }, { d: -30, l: '', sub: [O2()] }, { d: 30, l: '', hi: true },
  ], { L });
}
function bracketed(c, h, nOff = 0) {
  const n = c.nodes, nl = c.last, pl = n[n.length - 2];
  let s = brack((n[0].x + n[1].x) / 2, (n[0].y + n[1].y) / 2, h, 1);
  const bx = (nl.x + pl.x) / 2 + 3;
  s += brack(bx, (nl.y + pl.y) / 2, h, -1);
  s += text(bx + 6, (nl.y + pl.y) / 2 + h / 2 - 4 + nOff, 'n', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
  return s;
}

FIGURES.push({
  id: 'self-condensation',
  section: 'condensation-polymers',
  viewBox: '0 0 760 300',
  alt: 'Top row: 6-aminohexanoic acid, H2N–(CH2)5–COOH, loses water to give the nylon 6 repeat unit, NH–(CH2)5–C(=O), bracketed. Bottom row: lactic acid, HO–CH(CH3)–COOH, loses water to give the PLA repeat unit, O–CH(CH3)–C(=O), bracketed. In both repeat units the bond that crosses the right bracket, from the acyl carbon to the next unit, is highlighted.',
  build() {
    let s = '';
    s += tag(40, 30, 'AMINE AND ACID ON ONE MOLECULE', { anchor: 'start' });
    s += aminoHexanoic(66, 96, 30).svg;
    s += text(160, 146, '6-aminohexanoic acid', { cls: 'fg-lbl', size: 12.5 });
    s += arrow(P(318, 90), P(390, 90), { muted: true });
    s += text(354, 78, '− H₂O', { cls: 'fg-tag', size: 11 });
    const n6 = nylon6Repeat(420, 96, 30);
    s += n6.svg + bracketed(n6, 60);
    s += text(545, 146, 'nylon 6', { cls: 'fg-lbl', size: 12.5 });
    s += rule(40, 164, 720, 164);
    s += tag(40, 190, 'ALCOHOL AND ACID ON ONE MOLECULE', { anchor: 'start' });
    s += lacticAcid(96, 250, 30).svg;
    s += text(160, 288, 'lactic acid', { cls: 'fg-lbl', size: 12.5 });
    s += arrow(P(318, 244), P(390, 244), { muted: true });
    s += text(354, 232, '− H₂O', { cls: 'fg-tag', size: 11 });
    const pla = plaRepeat(430, 250, 30);
    s += pla.svg + bracketed(pla, 60);
    s += text(496, 288, 'PLA, poly(lactic acid)', { cls: 'fg-lbl', size: 12.5 });
    s += text(720, 232, 'coral OH + an H from', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(720, 248, 'the next molecule’s', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(720, 264, 'NH₂ or OH = H₂O', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    return s;
  },
  caption: 'A monomer that carries both partners joins head to tail with copies of itself. The highlighted bond is the new amide or ester that links each repeat unit to the next.',
});

FIGURES.push({
  id: 'l-self-condensation',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 380',
  alt: '6-aminohexanoic acid loses water to give the nylon 6 repeat unit; lactic acid loses water to give the PLA repeat unit.',
  build() {
    let s = '';
    s += aminoHexanoic(66, 56, 26).svg;
    s += tag(150, 100, '6-aminohexanoic acid');
    s += arrow(P(165, 110), P(165, 138), { muted: true });
    s += tag(178, 130, '− H₂O', { anchor: 'start' });
    const n6 = nylon6Repeat(84, 178, 26);
    s += n6.svg + bracketed(n6, 52);
    s += tag(165, 220, 'nylon 6');
    s += rule(20, 236, 310, 236);
    s += lacticAcid(96, 280, 26).svg;
    s += tag(250, 270, 'lactic acid');
    s += arrow(P(165, 302), P(165, 326), { muted: true });
    s += tag(178, 318, '− H₂O', { anchor: 'start' });
    const pla = plaRepeat(114, 360, 24);
    s += pla.svg + bracketed(pla, 46);
    s += tag(262, 352, 'PLA');
    return s;
  },
  caption: 'One monomer, both groups: it joins to copies of itself and loses one water per join.',
});

/* --------------------------------------------- caprolactam ring-opening --- */
FIGURES.push({
  id: 'caprolactam-opening',
  section: 'condensation-polymers',
  viewBox: '0 0 760 250',
  alt: 'Caprolactam, a seven-membered ring containing an N–H and a C=O next to each other, with its ring C(=O)–N bond highlighted as the bond that breaks. Plus a chain ending in NH2. Arrow to the longer chain: chain–NH–C(=O)–(CH2)5–NH2, with the new C(=O)–N bond to the old chain end highlighted and the former ring nitrogen now the NH2 at the new chain end.',
  build() {
    let s = '';
    s += tag(40, 30, 'THE RING OPENS ONTO THE CHAIN END, AND NOTHING LEAVES', { anchor: 'start' });
    /* The seven-membered ring: vertex 0 carries the N–H, vertex 1 the C=O. */
    const c = P(120, 128), R = 40;
    const pts = polyPts(c.x, c.y, 7, R, 90 + 360 / 14);
    const N = { x: pts[0].x, y: pts[0].y, r: 10 };
    const C = { x: pts[6].x, y: pts[6].y, r: 0 };
    for (let i = 0; i < 7; i++) {
      const a = pts[i], b = pts[(i + 1) % 7];
      const isBreak = (i === 6); // pts[6]–pts[0]: the C(=O)–N bond
      s += bond(a, b, { rFrom: i === 0 ? 10 : 0, rTo: (i + 1) % 7 === 0 ? 10 : 0, cls: isBreak ? 'fg-bond-hi' : 'fg-bond' });
    }
    const Hp = at(N, Math.atan2(N.y - c.y, N.x - c.x) * 180 / Math.PI, 26);
    s += bond(N, Hp, { rFrom: 10, rTo: 9 });
    s += atom(Hp.x, Hp.y, 'H', { r: 9 });
    const Op = at(C, Math.atan2(C.y - c.y, C.x - c.x) * 180 / Math.PI, 28);
    s += bond(C, Op, { rFrom: 0, rTo: 10, order: 2, gap: 3.2 });
    s += atom(Op.x, Op.y, 'O', { r: 10 });
    s += atom(N.x, N.y, 'N', { r: 10 });
    s += text(120, 206, 'caprolactam', { cls: 'fg-lbl', size: 12.5 });
    s += text(120, 224, 'coral bond: the one that breaks', { cls: 'fg-tag-warn', size: 11 });
    s += text(196, 132, '+', { cls: 'fg-lbl', size: 16 });
    /* The growing chain's amine end. */
    s += text(236, 132, 'chain', { cls: 'fg-tag-mut', size: 11 });
    s += bond(P(258, 128), P(284, 128), { rFrom: 0, rTo: 14 });
    s += atom(298, 128, 'NH₂', { r: 15 });
    s += arrow(P(334, 128), P(396, 128), { muted: true });
    /* The product: chain–NH–C(=O)–(CH2)5–NH2. */
    s += text(430, 142, 'chain', { cls: 'fg-tag-mut', size: 11 });
    const p = chain({ x: 452, y: 138, l: '' }, [
      { d: -30, l: 'N', sub: [{ l: 'H', len: 24 }] },
      { d: 30, l: '', hi: true, sub: [O2()] },
      { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' },
      { d: 30, l: 'NH₂', k: 'warn' },
    ], { L: 30 });
    s += p.svg;
    s += text(520, 206, 'highlighted: the new C(=O)–N bond', { cls: 'fg-tag-good', size: 11 });
    s += text(520, 224, 'to the old chain end', { cls: 'fg-tag-good', size: 11 });
    s += text(690, 206, 'the ring N is now', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(690, 224, 'the new chain end', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    return s;
  },
  caption: 'One ring bond breaks and one new bond forms, so every atom of the ring stays in the chain. The unit it adds is the same –NH(CH₂)₅CO– unit that 6-aminohexanoic acid gives.',
});

/* ------------------------------------ amide direction and chain registry --- */
/* Two chains in one plane, one above the other. Each chain is a planar
   zigzag; every N carries an H and every carbonyl carbon an O, pointing out
   of the zigzag. A hydrogen bond is drawn where the top chain's N–H (or C=O)
   points down at the bottom chain's C=O (or N–H) directly below it. For each
   pair the bottom chain's offset and zigzag phase are searched, and the
   arrangement with the most such pairs is drawn: that is the best the two
   chains can do. */
const NY6 = ['N', '', '', '', '', '', 'C'];
const NY66 = ['N', '', '', '', '', '', '', 'N', 'C', '', '', '', '', 'C'];
function zigRow(seq, count, x0, y, dx, amp, phase) {
  /* atom k at x0 + k*dx; up vertex when (k + phase) is even. */
  const out = [];
  for (let k = 0; k < count; k++) {
    const t = seq[((k % seq.length) + seq.length) % seq.length];
    const up = (k + phase) % 2 === 0;
    out.push({ x: x0 + k * dx, y: y + (up ? -amp : amp), up, t });
  }
  return out;
}
function pairUp(seq, count, reverse) {
  let best = null;
  for (let s = 0; s < seq.length; s++) for (let pb = 0; pb < 2; pb++) {
    const A = Array.from({ length: count }, (_, k) => ({ t: seq[k % seq.length], down: k % 2 === 1 }));
    let hb = 0;
    for (let k = 0; k < count; k++) {
      const kb = k + s; if (kb >= count + seq.length) continue;
      const idx = reverse ? (seq.length * 8 - 1 - kb) : kb;
      const tb = seq[((idx % seq.length) + seq.length) % seq.length];
      const bUp = (kb + pb) % 2 === 0;
      if (A[k].t && tb && A[k].t !== tb && A[k].down && bUp) hb++;
    }
    if (!best || hb > best.hb) best = { s, pb, hb };
  }
  return best;
}
function twoChains(seq, count, reverse, x0, yA, gapY, dx, opts = {}) {
  const amp = dx * 0.29;
  const fit = pairUp(seq, count, reverse);
  const A = zigRow(seq, count, x0, yA, dx, amp, 0);
  /* The bottom chain, shifted so its atom kb sits under the top chain's atom kb - s. */
  const B = [];
  for (let j = 0; j < count; j++) {
    const kb = j + fit.s;
    const idx = reverse ? (seq.length * 8 - 1 - kb) : kb;
    const t = seq[((idx % seq.length) + seq.length) % seq.length];
    const up = (kb + fit.pb) % 2 === 0;
    B.push({ x: x0 + j * dx, y: yA + gapY + (up ? -amp : amp), up, t });
  }
  let s = '';
  const subLen = opts.subLen ?? 17;
  const draw = (row, top) => {
    let o = '';
    for (let i = 0; i < row.length - 1; i++) o += bond(row[i], row[i + 1], { rFrom: row[i].t === 'N' ? 8 : 0, rTo: row[i + 1].t === 'N' ? 8 : 0 });
    for (const a of row) {
      if (!a.t) continue;
      const dir = a.up ? -1 : 1;
      a.g = { x: a.x, y: a.y + dir * subLen, l: a.t === 'N' ? 'H' : 'O', faces: top ? dir > 0 : dir < 0 };
      o += bond(a, a.g, { rFrom: a.t === 'N' ? 8 : 0, rTo: 8, order: a.t === 'C' ? 2 : 1, gap: 2.6 });
    }
    return o;
  };
  s += draw(A, true) + draw(B, false);
  /* Hydrogen bonds: facing groups of opposite kind directly across. */
  let pairs = 0, lonely = [];
  for (const a of A) {
    if (!a.t || !a.g.faces) continue;
    const b = B.find((q) => q.t && q.g.faces && Math.abs(q.x - a.x) < 1 && q.t !== a.t);
    if (b) { s += hbond(P(a.g.x, a.g.y + 8), P(b.g.x, b.g.y - 8)); pairs++; b.g.paired = true; a.g.paired = true; }
  }
  for (const row of [A, B]) for (const a of row) {
    if (!a.t) continue;
    if (a.t === 'N') s += atom(a.x, a.y, 'N', { r: 8, size: 11 });
    const warn = a.g.faces && !a.g.paired;
    s += atom(a.g.x, a.g.y, a.g.l, { r: 8, size: 11, kind: warn ? 'warn' : undefined });
    if (warn) lonely.push(a.g);
  }
  return { svg: s, pairs, lonely, A, B };
}
/* Chain-direction arrow beside a nylon 6 chain: it points from the N end of
   each amide toward its C=O end. */
const dirArrow = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { muted: true, size: 6 });

FIGURES.push({
  id: 'nylon-hbond-registry',
  section: 'condensation-polymers',
  viewBox: '0 0 760 470',
  alt: 'Four panels, each with two nylon chains drawn as zigzags one above the other, every N–H and C=O drawn, and hydrogen bonds as dashed lines between a downward N–H or C=O on the top chain and an upward C=O or N–H on the bottom chain. Nylon 6 with the chains running in opposite directions: every facing group is paired. Nylon 6 with both chains running the same way: at best half the facing groups are paired and the rest, colored, have no partner. Nylon 6,6 with the chains either way round: every facing group is paired.',
  build() {
    let s = '';
    const dx = 18.5, cnt = 18;
    const cell = (ox, oy, seq, reverse, title, sub, bad, arrows) => {
      let o = panel(ox, oy, 352, 206, bad ? { kind: 'warn' } : {});
      o += tag(ox + 176, oy + 22, title);
      const x0 = ox + 18, yA = oy + 76;
      const r = twoChains(seq, cnt, reverse, x0, yA, 76, dx);
      o += r.svg;
      if (arrows) {
        o += dirArrow(ox + 110, ox + 250, oy + 40);
        o += reverse ? dirArrow(ox + 250, ox + 110, oy + 184) : dirArrow(ox + 110, ox + 250, oy + 184);
      }
      o += text(ox + 176, oy + 200, sub, { cls: bad ? 'fg-tag-warn' : 'fg-tag-good', size: 11 });
      return { o, r };
    };
    const a = cell(18, 14, NY6, true, 'nylon 6, chains in opposite directions', 'every facing N–H and C=O is paired', false, true);
    const b = cell(390, 14, NY6, false, 'nylon 6, chains in the same direction', 'best fit: half the facing groups unpaired', true, true);
    const c = cell(18, 240, NY66, false, 'nylon 6,6, one way round', 'every facing N–H and C=O is paired', false, false);
    const d = cell(390, 240, NY66, true, 'nylon 6,6, the other way round', 'every facing N–H and C=O is paired', false, false);
    s += a.o + b.o + c.o + d.o;
    return s;
  },
  caption: 'Each panel is the best fit two chains can find. The gray arrows give a nylon 6 chain’s direction, from the N end of each amide to its C=O end. Dashed lines are hydrogen bonds; a coral group faces the other chain with nothing to bond to. Each amide’s other group points away, toward the next chain in the sheet, which is not drawn.',
});

FIGURES.push({
  id: 'nylon-hbonds',
  section: 'condensation-polymers',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 200',
  alt: 'Two nylon 6,6 chains drawn as zigzags one above the other, with every N–H and C=O drawn and dashed hydrogen bonds from each downward-facing group on the top chain to the opposite group on the bottom chain.',
  build() {
    let s = '';
    s += tag(165, 22, 'two nylon 6,6 chains, side by side');
    const r = twoChains(NY66, 17, false, 17, 74, 76, 18.5);
    s += r.svg;
    s += tag(165, 190, 'dashed: N–H···O=C between the chains', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Every amide sends one hydrogen bond to its neighbor here, and its other group bonds to the next chain on the far side.',
});

/* ------------------------------------------------------------ Kevlar --- */
/* Rings lie with their para axis horizontal. Between two rings the amide is
   a horizontal ring–C (or ring–N) bond, a 60° C–N bond and another horizontal
   bond, so every angle is 120°. The 60° bond alternates up and down, so the
   chain as a whole runs straight. */
function kevlarChain(x0, y, { L = 22, rr = 14, units = 4, startWith = 'N', flip = 1 } = {}) {
  /* Units alternate: ring–NH–C(=O)–ring and ring–C(=O)–NH–ring. */
  let s = '', ringInk = '';
  const groups = [];
  let p = P(x0, y);
  let type = startWith, up = -1 * flip;
  const atoms = [];
  const stub = at(p, 180, L * 0.8);
  s += bond(stub, p, { rFrom: 0, rTo: 0 });
  for (let u = 0; u < units; u++) {
    /* ring along 0 degrees */
    const c = P(p.x + rr, p.y);
    ringInk += benzene(c.x, c.y, rr, { rot: 0 }).svg;
    p = P(p.x + 2 * rr, p.y);
    /* linker: horizontal bond to X1, 60° bond to X2, horizontal bond to next ring */
    const X1 = { ...at(p, 0, L), t: type };
    const X2 = { ...at(X1, 60 * up, L), t: type === 'N' ? 'C' : 'N' };
    const next = at(X2, 0, L);
    for (const X of [X1, X2]) X.r = X.t === 'N' ? 9 : 0;
    s += bond(p, X1, { rFrom: 0, rTo: X1.r });
    s += bond(X1, X2, { rFrom: X1.r, rTo: X2.r });
    s += bond(X2, next, { rFrom: X2.r, rTo: 0 });
    /* substituents straight out of each 120° angle */
    for (const [X, a, b] of [[X1, p, X2], [X2, X1, next]]) {
      const u1 = unit(X, a), u2 = unit(X, b);
      const ex = -(u1.x + u2.x), ey = -(u1.y + u2.y), n = Math.hypot(ex, ey);
      const g = { x: X.x + ex / n * 20, y: X.y + ey / n * 20, l: X.t === 'N' ? 'H' : 'O', down: ey > 0 };
      s += bond(X, g, { rFrom: X.r, rTo: 8, order: X.t === 'C' ? 2 : 1, gap: 2.6 });
      X.g = g; atoms.push(X);
    }
    groups.push(X1, X2);
    p = next;
    type = type === 'N' ? 'C' : 'N';
    up = -up;
  }
  const c = P(p.x + rr, p.y);
  ringInk += benzene(c.x, c.y, rr, { rot: 0 }).svg;
  const endp = P(p.x + 2 * rr, p.y);
  s += bond(endp, at(endp, 0, L * 0.8), { rFrom: 0, rTo: 0 });
  return { s, ringInk, atoms, end: endp };
}
function kevlarPair(x0, y, gap, opts) {
  const A = kevlarChain(x0, y, opts);
  /* The partner chain: same chain, placed below and shifted until its upward
     groups sit under the top chain's downward groups of the other kind. */
  let best = null;
  for (let sh = -60; sh <= 60; sh += 0.5) for (const sw of ['N', 'C']) for (const fl of [1, -1]) {
    const B = kevlarChain(x0 + sh, y + gap, { ...opts, startWith: sw, flip: fl });
    let score = 0, pairs = [];
    for (const a of A.atoms) {
      if (!a.g.down) continue;
      const b = B.atoms.find((q) => !q.g.down && q.t !== a.t && Math.abs(q.g.x - a.g.x) < 7);
      if (b) { score++; pairs.push([a, b]); }
    }
    const tight = pairs.reduce((t, [a, b]) => t + Math.abs(a.g.x - b.g.x), 0);
    if (!best || score > best.score || (score === best.score && tight < best.tight)) best = { score, tight, B, pairs, sh };
  }
  let s = A.s + best.B.s + A.ringInk + best.B.ringInk;
  for (const [a, b] of best.pairs) s += hbond(P(a.g.x, a.g.y + 8), P(b.g.x, b.g.y - 8));
  for (const X of [...A.atoms, ...best.B.atoms]) {
    if (X.t === 'N') s += atom(X.x, X.y, 'N', { r: 9, size: 11 });
    s += atom(X.g.x, X.g.y, X.g.l, { r: 8, size: 11 });
  }
  return { svg: s, pairs: best.pairs.length, A, B: best.B };
}

FIGURES.push({
  id: 'kevlar-sheet',
  section: 'condensation-polymers',
  viewBox: '0 0 760 300',
  alt: 'Two Kevlar chains drawn one above the other. Each chain is para-linked benzene rings joined by amide groups, NH–C(=O) and C(=O)–NH alternating, and runs dead straight from left to right. Dashed hydrogen bonds join each downward N–H or C=O of the top chain to the opposite group on the bottom chain along the whole length.',
  build() {
    let s = '';
    s += tag(40, 30, 'PARA RINGS KEEP THE CHAIN STRAIGHT, SO THE AMIDES LINE UP', { anchor: 'start' });
    const r = kevlarPair(60, 104, 92, { L: 22, rr: 15, units: 5 });
    s += r.svg;
    s += text(380, 262, 'rings: flat and rigid, joined at opposite corners (para)', { cls: 'fg-tag', size: 11 });
    s += text(380, 282, 'dashed: an N–H···O=C hydrogen bond at every amide along the chain', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Two Kevlar chains side by side. Every ring leaves by the corner opposite the one it came in by, so neither chain can bend, and each amide on one chain meets the opposite group on the other.',
});

FIGURES.push({
  id: 'l-kevlar-sheet',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 250',
  alt: 'Two straight Kevlar chains of para-linked rings and amides, one above the other, with dashed hydrogen bonds between facing N–H and C=O groups.',
  build() {
    let s = '';
    s += tag(165, 22, 'two Kevlar chains, side by side');
    const r = kevlarPair(22, 88, 88, { L: 19, rr: 13, units: 2 });
    s += r.svg;
    s += tag(165, 216, 'para rings: the chain cannot bend');
    s += tag(165, 236, 'dashed: N–H···O=C between the chains', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Straight chains put every amide beside a partner on the next chain.',
});

/* -------------------------------------------------------- polycarbonate --- */
/* Bisphenol A drawn as a V: each ring's para axis runs along a zigzag bond,
   so the two rings leave the central sp3 carbon at an angle, and the two
   methyls point out of the V. */
function bpa(x, y, L, rr, { ends = ['HO', 'OH'], endK } = {}) {
  const c = chain({ x, y, l: ends[0], k: endK }, [
    { d: 30, l: '', ring: true, sub: [{ l: '', deg: 50, len: L * 0.9 }, { l: '', deg: 130, len: L * 0.9 }] },
    { d: -30, l: ends[1], ring: true, k: endK },
  ], { L, rr });
  return c;
}
function pcRepeat(x, y, L, rr) {
  /* stub–O–C(=O)–O–[ring]–C(CH3)2–[ring]–stub */
  return chain({ x, y, l: '' }, [
    { d: -30, l: 'O', hi: true },
    { d: 30, l: '', sub: [O2()] },
    { d: -30, l: 'O', hi: true },
    { d: 30, l: '', ring: true, sub: [{ l: '', deg: 50, len: L * 0.9 }, { l: '', deg: 130, len: L * 0.9 }] },
    { d: -30, l: '', ring: true },
  ], { L, rr });
}

FIGURES.push({
  id: 'polycarbonate-drawn',
  section: 'condensation-polymers',
  viewBox: '0 0 760 400',
  alt: 'Bisphenol A drawn as two para-substituted benzene rings, each ending in OH, joined through one carbon carrying two methyl groups, so the molecule forms a V. Plus phosgene, Cl–C(=O)–Cl. An arrow losing 2 HCl leads to the bracketed polycarbonate repeat unit, O–C(=O)–O–ring–C(CH3)2–ring, with the carbonate O–C(=O)–O labeled and the central carbon labeled as the bend.',
  build() {
    let s = '';
    s += tag(40, 30, 'BISPHENOL A AND PHOSGENE', { anchor: 'start' });
    const b = bpa(70, 66, 26, 15, { endK: undefined });
    s += b.svg;
    const cq = b.nodes[1];
    s += text(cq.x, cq.y + 44, 'bisphenol A: a diol', { cls: 'fg-lbl', size: 12.5 });
    s += text(cq.x, cq.y + 62, 'both OH on rings', { cls: 'fg-tag-mut', size: 11 });
    s += text(420, 96, '+', { cls: 'fg-lbl', size: 16 });
    const ph = chain({ x: 466, y: 100, l: 'Cl' }, [{ d: -30, l: '', sub: [O2()] }, { d: 30, l: 'Cl' }], { L: 28 });
    s += ph.svg;
    s += text(490, 150, 'phosgene', { cls: 'fg-lbl', size: 12.5 });
    s += text(490, 168, 'the diacid chloride of carbonic acid', { cls: 'fg-tag-mut', size: 11 });
    s += rule(40, 200, 720, 200);
    s += arrow(P(50, 290), P(120, 290), { muted: true });
    s += text(85, 278, '− 2 HCl', { cls: 'fg-tag', size: 11 });
    const rep = pcRepeat(150, 262, 26, 15);
    s += rep.svg + bracketed(rep, 64, 6);
    const n = rep.nodes;
    const mid = P((n[1].x + n[3].x) / 2, n[2].y);
    s += text(mid.x, 232, 'carbonate: O–C(=O)–O', { cls: 'fg-tag-good', size: 11 });
    const q = n[4];
    s += text(q.x, q.y + 54, 'sp³ carbon: the chain turns here', { cls: 'fg-tag-warn', size: 11 });
    s += text(q.x, q.y + 70, 'and two CH₃ groups stick out', { cls: 'fg-tag-warn', size: 11 });
    s += text(380, 384, 'Rigid rings make it stiff; the bend at the central carbon keeps the chains from packing in order.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The repeat unit has one carbonate group, with a carbonyl carbon between two oxygens, and one bisphenol A unit. The two rings leave the central carbon at an angle, so the chain cannot run straight.',
});

/* ------------------------------------------------------ polyurethane --- */
/* The one step-growth in the chapter that behaves differently, drawn arrow
   by arrow. */
FIGURES.push({
  id: 'urethane-addition',
  section: 'condensation-polymers',
  viewBox: '0 0 760 440',
  alt: 'Two steps of the urethane-forming addition: an alcohol oxygen adding to the carbon of an isocyanate while the carbon-nitrogen pi bond moves onto nitrogen, giving a zwitterion, and then the nitrogen taking the proton from the positively charged oxygen to give a neutral carbamate',
  build() {
    let s = '';
    const head2 = (y, a, b) => {
      s += tag(48, y - 48, a, { anchor: 'start' });
      s += text(48, y - 30, b, { cls: 'fg-sm', size: 10, anchor: 'start' });
    };
    /* The zwitterion is drawn twice — as the product of step 1 and the
       starting material of step 2 — so it is built once here. */
    const zwitter = (x0, y) => {
      let o = '';
      const xs = [0, 1, 2, 3, 4].map((i) => x0 + i * 56);
      o += atom(xs[0], y, 'R', { r: 15 });
      o += atom(xs[1], y, 'N', { r: 15, kind: 'warn' });
      o += atom(xs[2], y, 'C', { r: 15 });
      o += atom(xs[3], y, 'O', { r: 15, kind: 'warn' });
      o += atom(xs[4], y, 'R′', { r: 17 });
      for (let i = 0; i < 4; i++) o += bond(P(xs[i], y), P(xs[i + 1], y), { rFrom: 15, rTo: i === 3 ? 17 : 15 });
      o += atom(xs[2], y - 44, 'O', { r: 15 });
      o += bond(P(xs[2], y), P(xs[2], y - 44), { order: 2, rFrom: 15, rTo: 15 });
      o += atom(xs[3], y - 44, 'H', { r: 12, size: 10 });
      o += bond(P(xs[3], y), P(xs[3], y - 44), { rFrom: 15, rTo: 12 });
      o += text(xs[1] - 22, y - 12, '−', { cls: 'fg-tag-warn', size: 15 });
      o += text(xs[3] + 22, y - 12, '+', { cls: 'fg-tag-warn', size: 14 });
      return o;
    };

    /* 1. The addition itself. */
    head2(120, 'STEP 1 — THE ALCOHOL ADDS', 'the O lone pair attacks C; the C=N π bond moves onto N');
    s += atom(96, 120, 'R', { r: 15 });
    s += atom(156, 120, 'N', { r: 15 });
    s += atom(216, 120, 'C', { r: 15, kind: 'hi' });
    s += atom(276, 120, 'O', { r: 15 });
    s += bond(P(96, 120), P(156, 120), { rFrom: 15, rTo: 15 });
    s += bond(P(156, 120), P(216, 120), { order: 2, rFrom: 15, rTo: 15 });
    s += bond(P(216, 120), P(276, 120), { order: 2, rFrom: 15, rTo: 15 });
    s += text(186, 162, 'an isocyanate: C between two electronegative atoms', { cls: 'fg-sm', size: 10 });
    s += text(316, 125, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(366, 120, 'R′O', { r: 22, size: 10 });
    s += atom(424, 120, 'H', { r: 12, size: 10 });
    s += bond(P(366, 120), P(424, 120), { rFrom: 22, rTo: 12 });
    s += lonePair(366, 120, 250, { dist: 30 });
    s += curve(P(352, 94), P(230, 100), { bow: -20 });
    s += curve(P(186, 104), P(160, 92), { bow: -12 });
    s += arrow(P(440, 120), P(478, 120), { muted: true });
    s += zwitter(500, 120);
    s += text(612, 180, 'every atom of both molecules, and two charges', { cls: 'fg-sm', size: 10 });
    s += rule(40, 200, 720, 200);

    /* 2. The proton transfer that neutralises it. */
    head2(320, 'STEP 2 — THE PROTON MOVES', 'nitrogen takes the proton from the positive oxygen');
    s += zwitter(170, 320);
    s += lonePair(226, 320, 250, { dist: 28 });
    s += curve(P(218, 298), P(330, 270), { bow: -56 });
    s += curve(P(350, 290), P(356, 310), { bow: 14 });
    s += arrow(P(440, 320), P(478, 320), { muted: true });
    s += atom(496, 320, 'R', { r: 15 });
    s += atom(556, 320, 'NH', { r: 18 });
    s += atom(618, 320, 'C', { r: 15 });
    s += atom(676, 320, 'O', { r: 15 });
    s += atom(730, 320, 'R′', { r: 17 });
    s += bond(P(496, 320), P(556, 320), { rFrom: 15, rTo: 18 });
    s += bond(P(556, 320), P(618, 320), { rFrom: 18, rTo: 15 });
    s += bond(P(618, 320), P(676, 320), { rFrom: 15, rTo: 15 });
    s += bond(P(676, 320), P(730, 320), { rFrom: 15, rTo: 17 });
    s += atom(618, 276, 'O', { r: 15 });
    s += bond(P(618, 320), P(618, 276), { order: 2, rFrom: 15, rTo: 15 });
    s += text(614, 376, 'a carbamate: the linkage O–C(=O)–NH', { cls: 'fg-sm', size: 10 });
    s += rule(40, 396, 720, 396);
    s += text(380, 418, 'Nothing is expelled in either step.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The addition that builds each link of a polyurethane, drawn arrow by arrow. The isocyanate carbon is attacked, the C=N π bond becomes a lone pair on nitrogen, and a proton then moves from oxygen to nitrogen.',
});

FIGURES.push({
  id: 'l-urethane',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 250',
  alt: 'An isocyanate, R–N=C=O, plus an alcohol, H–O–R′, give a carbamate, R–NH–C(=O)–O–R′. The new O–C bond and the new N–H bond are highlighted, and nothing else is formed.',
  build() {
    let s = '';
    const y1 = 60;
    s += atom(26, y1, 'R', { r: 12 });
    s += atom(72, y1, 'N', { r: 12 });
    s += atom(118, y1, 'C', { r: 12, kind: 'hi' });
    s += atom(164, y1, 'O', { r: 12 });
    s += bond(P(26, y1), P(72, y1), { rFrom: 12, rTo: 12 });
    s += bond(P(72, y1), P(118, y1), { order: 2, rFrom: 12, rTo: 12 });
    s += bond(P(118, y1), P(164, y1), { order: 2, rFrom: 12, rTo: 12 });
    s += tag(95, 96, 'an isocyanate');
    s += text(196, y1 + 5, '+', { cls: 'fg-lbl', size: 15 });
    s += atom(226, y1, 'H', { r: 10, kind: 'warn' });
    s += atom(266, y1, 'O', { r: 12 });
    s += atom(306, y1, 'R′', { r: 12 });
    s += bond(P(226, y1), P(266, y1), { rFrom: 10, rTo: 12 });
    s += bond(P(266, y1), P(306, y1), { rFrom: 12, rTo: 12 });
    s += tag(266, 96, 'an alcohol');
    s += arrow(P(165, 112), P(165, 150), { muted: true });
    s += tag(178, 136, 'nothing lost', { anchor: 'start' });
    const y2 = 200;
    s += atom(40, y2, 'R', { r: 12 });
    s += atom(90, y2, 'N', { r: 12 });
    s += atom(90, y2 + 36, 'H', { r: 10, kind: 'warn' });
    s += atom(140, y2, 'C', { r: 12, kind: 'hi' });
    s += atom(140, y2 - 42, 'O', { r: 12 });
    s += atom(190, y2, 'O', { r: 12 });
    s += atom(240, y2, 'R′', { r: 12 });
    s += bond(P(40, y2), P(90, y2), { rFrom: 12, rTo: 12 });
    s += bond(P(90, y2), P(90, y2 + 36), { rFrom: 12, rTo: 10, cls: 'fg-bond-hi' });
    s += bond(P(90, y2), P(140, y2), { rFrom: 12, rTo: 12 });
    s += bond(P(140, y2), P(140, y2 - 42), { order: 2, rFrom: 12, rTo: 12 });
    s += bond(P(140, y2), P(190, y2), { rFrom: 12, rTo: 12, cls: 'fg-bond-hi' });
    s += bond(P(190, y2), P(240, y2), { rFrom: 12, rTo: 12 });
    s += tag(282, y2 - 10, 'a carbamate');
    s += tag(282, y2 + 8, '(urethane)');
    s += tag(165, 246, 'highlighted: the two new bonds', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The alcohol O bonds to the isocyanate carbon and its H moves to nitrogen. Every atom of both molecules is kept.',
});

/* ------------------------------------------------ the conversion cliff --- */
/* Degree of polymerization against conversion. Bar length is proportional
   to DP, so the last bar really is ten times the one above it. */
const CLIFF = [
  { p: '50%', dp: 2, note: 'dimers' },
  { p: '90%', dp: 10, note: 'an oil' },
  { p: '99%', dp: 100, note: 'barely a plastic' },
  { p: '99.9%', dp: 1000, note: 'a useful material', good: true },
];
FIGURES.push({
  id: 'conversion-cliff',
  section: 'condensation-polymers',
  viewBox: '0 0 760 300',
  alt: 'Degree of polymerization at four conversions, drawn as bars to scale: 2 at 50 percent, 10 at 90 percent, 100 at 99 percent and 1000 at 99.9 percent. The first two bars are barely visible and the last is ten times the third.',
  build() {
    let s = '';
    s += tag(70, 40, 'conversion, p');
    s += tag(170, 40, 'DP = 1/(1 − p)');
    s += tag(470, 40, 'bar length ∝ DP');
    s += rule(24, 54, 736, 54);
    CLIFF.forEach((r, i) => {
      const y = 88 + i * 44;
      s += label(70, y + 4, r.p);
      s += text(170, y + 4, r.dp.toLocaleString('en-US'), { cls: 'fg-lbl', size: 12.5 });
      s += bar(236, y - 11, Math.max(3, r.dp * 0.4), 22, { kind: r.good ? 'hi' : 'warn', opacity: 0.4 });
      s += text(r.dp > 500 ? 690 : 236 + Math.max(3, r.dp * 0.4) + 10, y + 4, r.note, { cls: r.good ? 'fg-tag-good' : 'fg-tag', size: 11, anchor: r.dp > 500 ? 'end' : 'start' });
    });
    s += rule(24, 264, 736, 264);
    s += text(380, 288, 'Ninety-nine percent conversion sounds finished and gives a chain of only a hundred units.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Any two pieces can join, so the mixture stays short fragments until almost every group has reacted. The long chains appear only in the last fraction of a percent.',
});

FIGURES.push({
  id: 'l-conversion-cliff',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 250',
  alt: 'Degree of polymerization at 50, 90, 99 and 99.9 percent conversion, drawn to scale as bars of length 2, 10, 100 and 1000.',
  build() {
    let s = '';
    s += tag(40, 24, 'p');
    s += tag(110, 24, 'DP');
    s += tag(240, 24, 'bar length ∝ DP');
    s += rule(10, 36, 320, 36);
    CLIFF.forEach((r, i) => {
      const y = 66 + i * 40;
      s += label(40, y + 4, r.p);
      s += text(110, y + 4, r.dp.toLocaleString('en-US'), { cls: 'fg-lbl', size: 12.5 });
      const w = Math.max(3, r.dp * 0.17);
      s += bar(146, y - 10, w, 20, { kind: r.good ? 'hi' : 'warn', opacity: 0.4 });
      if (!r.good) s += tag(146 + w + 8, y + 4, r.note, { anchor: 'start' });
    });
    s += tag(232, 236, 'a useful material', { cls: 'fg-tag-good' });
    s += rule(10, 212, 320, 212);
    return s;
  },
  caption: 'Degree of polymerization climbs steeply only at the very end.',
});

export default FIGURES;
