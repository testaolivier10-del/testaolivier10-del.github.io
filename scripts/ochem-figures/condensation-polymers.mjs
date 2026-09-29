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

/* Brackets on the two stub bonds of a repeat unit, and the subscript n.
   The left bracket sits 40% of the way along the first stub from its free
   end, the right one 60% along the last stub, so neither touches a group. */
function bracketed(c, h) {
  /* nl.nb[0] is the point the last stub leaves from: the previous node, or
     the exit corner of a ring when the stub comes straight off one. */
  const n = c.nodes, nl = c.last, pl = nl.nb[0];
  const L0 = P(n[0].x + (n[1].x - n[0].x) * 0.4, n[0].y + (n[1].y - n[0].y) * 0.4);
  const R0 = P(pl.x + (nl.x - pl.x) * 0.6, pl.y + (nl.y - pl.y) * 0.6);
  let s = brack(L0.x, L0.y, h, 1) + brack(R0.x, R0.y, h, -1);
  s += text(R0.x + 5, R0.y + h / 2 + 4, 'n', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
  return s;
}
/* Carbon numbers on the chosen vertices: outside the zigzag angle, or inside
   it when a group already sits outside. */
function numberC(c, idxs, d = 15) {
  let s = '';
  idxs.forEach((i, k) => {
    const nd = c.nodes[i];
    let ex = 0, ey = 0;
    for (const q of nd.nb) { const u = unit(nd, q); ex -= u.x; ey -= u.y; }
    const m = Math.hypot(ex, ey) || 1;
    const sgn = nd.sub ? -1 : 1;
    const dd = nd.sub ? d + 6 : d;
    s += text(nd.x + sgn * ex / m * dd, nd.y + sgn * ey / m * dd + 4, String(k + 1), { cls: 'fg-tag', size: 11 });
  });
  return s;
}

/* ------------------------------------------------ PET: build and bracket --- */
function terephthalicAcid(x, y, L, rr) {
  /* HO–C(=O)–[ring]–C(=O)–OH, left to right; the right OH is the one that leaves. */
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
  return chain({ x, y, l: '' }, [
    { d: 30, l: 'O', len: L * 1.5 },
    { d: -30, l: '' }, { d: 30, l: '' },
    { d: -30, l: 'O' },
    { d: 30, l: '', hi: true, sub: [O2()] },
    { d: -30, l: '', ring: true, sub: [O2()] },
    { d: 30, l: '', hi: true, len: L * 1.5 },
  ], { L, rr });
}

FIGURES.push({
  id: 'pet-build',
  section: 'condensation-polymers',
  viewBox: '0 0 760 400',
  alt: 'Terephthalic acid, a benzene ring with a COOH group at each end of the para axis, plus ethylene glycol, HO–CH2–CH2–OH. The OH of the acid and the H of the alcohol are colored as the atoms that leave as water. Below, the bracketed PET repeat unit: O–CH2–CH2–O–C(=O)–ring–C(=O), with the two acyl carbon to oxygen bonds highlighted as the new ester bonds.',
  build() {
    let s = '';
    s += tag(40, 30, 'TWO MONOMERS, EACH WITH TWO REACTIVE GROUPS', { anchor: 'start' });
    s += terephthalicAcid(84, 100, 30, 16).svg;
    s += text(160, 196, 'terephthalic acid', { cls: 'fg-lbl', size: 12.5 });
    s += text(160, 214, '(benzene-1,4-dicarboxylic acid)', { cls: 'fg-tag-mut', size: 11 });
    s += text(296, 104, '+', { cls: 'fg-lbl', size: 16 });
    s += ethyleneGlycol(340, 100, 30).svg;
    s += text(410, 196, 'ethylene glycol', { cls: 'fg-lbl', size: 12.5 });
    s += text(410, 214, '(ethane-1,2-diol)', { cls: 'fg-tag-mut', size: 11 });
    s += text(540, 96, 'coral: the acid’s OH and the', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(540, 112, 'alcohol’s H, which leave', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(540, 128, 'together as H₂O', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += rule(40, 234, 720, 234);
    s += arrow(P(60, 300), P(140, 300), { muted: true });
    s += text(100, 288, '− H₂O', { cls: 'fg-tag', size: 11 });
    s += text(100, 320, 'at every join', { cls: 'fg-tag-mut', size: 11 });
    const rep = petRepeat(180, 296, 30, 16);
    s += rep.svg + bracketed(rep, 50);
    s += text(560, 286, 'highlighted: the new', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(560, 302, 'ester bonds, each from', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(560, 318, 'an acyl C to an O', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(380, 386, 'the PET repeat unit: two esters, one ring, one CH₂CH₂', { cls: 'fg-lbl', size: 12.5 });
    return s;
  },
  caption: 'One ester forms at each end of the acid, and each join releases one water. The acyl carbon keeps its C=O and gains the alcohol oxygen, so the bond that forms is the acyl C–O bond.',
});

FIGURES.push({
  id: 'l-pet-build',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 380',
  alt: 'Terephthalic acid plus ethylene glycol, with the acid OH and the alcohol H colored as the atoms lost as water. Below, the bracketed PET repeat unit with the two new ester bonds highlighted.',
  build() {
    let s = '';
    s += terephthalicAcid(22, 60, 22, 12).svg;
    s += tag(78, 144, 'terephthalic acid');
    s += text(166, 64, '+', { cls: 'fg-lbl', size: 15 });
    s += ethyleneGlycol(190, 60, 22).svg;
    s += tag(250, 144, 'ethylene glycol');
    s += tag(165, 172, 'coral atoms leave together as H₂O', { cls: 'fg-tag-warn' });
    s += arrow(P(165, 186), P(165, 222), { muted: true });
    s += tag(178, 208, '− H₂O per join', { anchor: 'start' });
    const rep = petRepeat(34, 280, 22, 12);
    s += rep.svg + bracketed(rep, 40);
    s += tag(165, 366, 'highlighted: the two new ester bonds', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The PET repeat unit. The coral OH and H leave as water, and the highlighted bonds are the new esters.',
});

/* ---------------------------------------------- nylon 6,6: build, count --- */
function hexanediamine(x, y, L) {
  /* H2N–(CH2)6–NH–H; the last H is one of the two that can leave. */
  return chain({ x, y, l: 'H₂N' }, [
    ...run(['', '', '', '', '', ''], -30),
    { d: -30, l: 'NH' }, { d: 30, l: 'H', k: 'warn', len: L * 0.85 },
  ], { L });
}
function adipicAcid(x, y, L) {
  return chain({ x, y, l: 'HO', k: 'warn' }, [
    { d: -30, l: '', sub: [O2()] }, { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' },
    { d: 30, l: '', sub: [O2()] }, { d: -30, l: 'OH' },
  ], { L });
}
function nylon66Repeat(x, y, L) {
  /* stub–NH–(CH2)6–NH–C(=O)–(CH2)4–C(=O)–stub */
  const H = { l: 'H', len: L * 0.8 };
  return chain({ x, y, l: '' }, [
    { d: -30, l: 'N', sub: [H], len: L * 1.5 },
    { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' },
    { d: 30, l: 'N', sub: [H] },
    { d: -30, l: '', hi: true, sub: [O2()] },
    { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' },
    { d: 30, l: '', sub: [O2()] },
    { d: -30, l: '', hi: true, len: L * 1.5 },
  ], { L });
}

FIGURES.push({
  id: 'nylon66-build',
  section: 'condensation-polymers',
  viewBox: '0 0 760 380',
  alt: 'Hexamethylenediamine, H2N–(CH2)6–NH2, with its six carbons numbered, plus adipic acid, HOOC–(CH2)4–COOH, with its six carbons numbered from carboxyl carbon to carboxyl carbon. Below, the bracketed nylon 6,6 repeat unit, NH–(CH2)6–NH–C(=O)–(CH2)4–C(=O), with the two new amide C–N bonds highlighted.',
  build() {
    let s = '';
    s += tag(40, 30, 'SIX CARBONS IN THE DIAMINE, SIX IN THE DIACID', { anchor: 'start' });
    const dia = hexanediamine(66, 104, 30);
    s += dia.svg + numberC(dia, [1, 2, 3, 4, 5, 6]);
    s += text(170, 176, 'hexamethylenediamine', { cls: 'fg-lbl', size: 12.5 });
    s += text(170, 194, '(hexane-1,6-diamine)', { cls: 'fg-tag-mut', size: 11 });
    s += text(352, 108, '+', { cls: 'fg-lbl', size: 16 });
    const ac = adipicAcid(400, 104, 30);
    s += ac.svg + numberC(ac, [1, 2, 3, 4, 5, 6]);
    s += text(500, 176, 'adipic acid', { cls: 'fg-lbl', size: 12.5 });
    s += text(500, 194, '(hexanedioic acid)', { cls: 'fg-tag-mut', size: 11 });
    s += text(720, 98, 'coral: lost', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(720, 114, 'as H₂O', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += rule(40, 214, 720, 214);
    s += arrow(P(44, 290), P(112, 290), { muted: true });
    s += text(78, 278, '− H₂O', { cls: 'fg-tag', size: 11 });
    s += text(78, 310, 'per amide', { cls: 'fg-tag-mut', size: 11 });
    const rep = nylon66Repeat(138, 296, 30);
    s += rep.svg + bracketed(rep, 50);
    s += text(380, 368, 'the nylon 6,6 repeat unit; highlighted: the two new C–N amide bonds', { cls: 'fg-lbl', size: 12.5 });
    return s;
  },
  caption: 'The small numbers count each monomer’s carbons. Coral atoms leave as water, and the highlighted bonds in the repeat unit are the two new amides.',
});

FIGURES.push({
  id: 'l-nylon66-build',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 430',
  alt: 'Hexamethylenediamine and adipic acid, each with six numbered carbons, and below them the bracketed nylon 6,6 repeat unit with its two new amide bonds highlighted.',
  build() {
    let s = '';
    const dia = hexanediamine(40, 60, 26);
    s += dia.svg + numberC(dia, [1, 2, 3, 4, 5, 6], 13);
    s += tag(165, 112, 'hexamethylenediamine: 6 C');
    s += text(165, 140, '+', { cls: 'fg-lbl', size: 15 });
    const ac = adipicAcid(62, 196, 26);
    s += ac.svg + numberC(ac, [1, 2, 3, 4, 5, 6], 13);
    s += tag(165, 258, 'adipic acid: 6 C, both C=O included');
    s += arrow(P(165, 270), P(165, 302), { muted: true });
    s += tag(178, 292, '− H₂O per amide', { anchor: 'start' });
    const rep = nylon66Repeat(22, 360, 19);
    s += rep.svg + bracketed(rep, 38);
    s += tag(165, 420, 'highlighted: the new amide bonds', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Nylon 6,6: the diamine supplies the first 6 and the diacid the second. Coral atoms leave as water.',
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
    { d: -30, l: 'N', sub: [{ l: 'H', len: L * 0.8 }], len: L * 1.5 },
    { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' }, { d: -30, l: '' }, { d: 30, l: '' },
    { d: -30, l: '', sub: [O2()] }, { d: 30, l: '', hi: true, len: L * 1.5 },
  ], { L });
}
function lacticAcid(x, y, L) {
  return chain({ x, y, l: 'HO' }, [
    { d: -30, l: '', sub: [{ l: '', len: L }] }, { d: 30, l: '', sub: [O2()] }, { d: -30, l: 'OH', k: 'warn' },
  ], { L });
}
function plaRepeat(x, y, L) {
  return chain({ x, y, l: '' }, [
    { d: -30, l: 'O', len: L * 1.5 }, { d: 30, l: '', sub: [{ l: '', len: L }] }, { d: -30, l: '', sub: [O2()] }, { d: 30, l: '', hi: true, len: L * 1.5 },
  ], { L });
}

FIGURES.push({
  id: 'self-condensation',
  section: 'condensation-polymers',
  viewBox: '0 0 760 330',
  alt: 'Top row: 6-aminohexanoic acid, H2N–(CH2)5–COOH, loses water to give the nylon 6 repeat unit, NH–(CH2)5–C(=O), bracketed. Bottom row: lactic acid, HO–CH(CH3)–COOH, loses water to give the PLA repeat unit, O–CH(CH3)–C(=O), bracketed. In both repeat units the bond that crosses the right bracket, from the acyl carbon to the next unit, is highlighted.',
  build() {
    let s = '';
    s += tag(40, 30, 'AMINE AND ACID ON ONE MOLECULE', { anchor: 'start' });
    s += aminoHexanoic(66, 96, 30).svg;
    s += text(160, 156, '6-aminohexanoic acid', { cls: 'fg-lbl', size: 12.5 });
    s += arrow(P(318, 90), P(390, 90), { muted: true });
    s += text(354, 78, '− H₂O', { cls: 'fg-tag', size: 11 });
    const n6 = nylon6Repeat(416, 104, 30);
    s += n6.svg + bracketed(n6, 50);
    s += text(540, 156, 'nylon 6', { cls: 'fg-lbl', size: 12.5 });
    s += rule(40, 176, 720, 176);
    s += tag(40, 202, 'ALCOHOL AND ACID ON ONE MOLECULE', { anchor: 'start' });
    s += lacticAcid(110, 262, 30).svg;
    s += text(160, 316, 'lactic acid', { cls: 'fg-lbl', size: 12.5 });
    s += arrow(P(318, 256), P(390, 256), { muted: true });
    s += text(354, 244, '− H₂O', { cls: 'fg-tag', size: 11 });
    const pla = plaRepeat(416, 262, 30);
    s += pla.svg + bracketed(pla, 50);
    s += text(500, 316, 'PLA, poly(lactic acid)', { cls: 'fg-lbl', size: 12.5 });
    return s;
  },
  caption: 'In both rows the coral OH leaves with an H from the next molecule’s NH₂ or OH as water. The highlighted bond links each repeat unit to the next: an amide in nylon 6, an ester in PLA.',
});

FIGURES.push({
  id: 'l-self-condensation',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 450',
  alt: '6-aminohexanoic acid loses water to give the nylon 6 repeat unit; lactic acid loses water to give the PLA repeat unit.',
  build() {
    let s = '';
    s += aminoHexanoic(66, 50, 26).svg;
    s += tag(150, 108, '6-aminohexanoic acid');
    s += arrow(P(165, 118), P(165, 146), { muted: true });
    s += tag(178, 138, '− H₂O', { anchor: 'start' });
    const n6 = nylon6Repeat(66, 190, 26);
    s += n6.svg + bracketed(n6, 44);
    s += tag(165, 238, 'nylon 6');
    s += rule(20, 252, 310, 252);
    s += lacticAcid(90, 296, 26).svg;
    s += tag(250, 292, 'lactic acid');
    s += arrow(P(165, 334), P(165, 364), { muted: true });
    s += tag(178, 354, '− H₂O', { anchor: 'start' });
    const pla = plaRepeat(90, 420, 24);
    s += pla.svg + bracketed(pla, 40);
    s += tag(272, 420, 'PLA');
    return s;
  },
  caption: 'One monomer, both groups: it joins to copies of itself and loses one water per join.',
});

/* ------------------------------------ amide direction and chain registry --- */
/* Two chains in one plane, one above the other. Each chain is a planar
   zigzag; every N carries an H and every carbonyl carbon an O, pointing out
   of the zigzag. A hydrogen bond is drawn where the top chain's N–H (or C=O)
   points down at the bottom chain's C=O (or N–H) directly below it. For each
   pair of chains the bottom chain's offset and zigzag phase are searched,
   and the arrangement with the most such pairs is drawn: that is the best
   the two chains can do. The chain ends are trimmed back to a CH2. */
const NY6 = ['N', '', '', '', '', '', 'C'];
const NY66 = ['N', '', '', '', '', '', '', 'N', 'C', '', '', '', '', 'C'];
const seqAt = (seq, i) => seq[((i % seq.length) + seq.length) % seq.length];
function rowAtoms(seq, count, shift, phase, reverse) {
  const out = [];
  for (let j = 0; j < count; j++) {
    const kb = j + shift;
    const t = seqAt(seq, reverse ? seq.length * 8 - 1 - kb : kb);
    out.push({ j, t, up: (kb + phase) % 2 === 0 });
  }
  return out;
}
function bestFit(seq, count, reverse) {
  const A = rowAtoms(seq, count, 0, 0, false);
  let best = null;
  for (let s = 0; s < seq.length; s++) for (let pb = 0; pb < 2; pb++) {
    const B = rowAtoms(seq, count, s, pb, reverse);
    let hb = 0;
    for (let j = 1; j < count - 1; j++) if (A[j].t && B[j].t && A[j].t !== B[j].t && !A[j].up && B[j].up) hb++;
    if (!best || hb > best.hb) best = { s, pb, hb, A, B };
  }
  return best;
}
function twoChains(seq, count, reverse, x0, yA, gapY, dx) {
  const amp = dx * 0.29, subLen = 17;
  const fit = bestFit(seq, count, reverse);
  const place = (row, y) => row.map((a) => ({ ...a, x: x0 + a.j * dx, y: y + (a.up ? -amp : amp) }));
  const trim = (row) => {
    let i0 = 0, i1 = row.length - 1;
    while (row[i0].t) i0++;
    while (row[i1].t) i1--;
    return row.slice(i0, i1 + 1);
  };
  const A = trim(place(fit.A, yA)), B = trim(place(fit.B, yA + gapY));
  let s = '';
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
  let pairs = 0;
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
  }
  return { svg: s, pairs, A, B };
}

FIGURES.push({
  id: 'nylon-hbond-registry',
  section: 'condensation-polymers',
  viewBox: '0 0 760 518',
  alt: 'Three panels, each with two nylon chains drawn as zigzags one above the other, every N–H and C=O drawn, and hydrogen bonds as dashed lines between a downward N–H or C=O on the top chain and an upward C=O or N–H on the bottom chain. Nylon 6 with the chains running in opposite directions: every facing group is paired. Nylon 6 with both chains running the same way: at best half the facing groups are paired and the rest, colored, have no partner. Nylon 6,6: every facing group is paired, and because the chain reads the same from either end, flipping it changes nothing.',
  build() {
    let s = '';
    const dx = 18.5;
    const cell = (ox, oy, w, cnt, seq, reverse, title, sub, bad, arrows) => {
      let o = panel(ox, oy, w, 244, bad ? { kind: 'warn' } : {});
      o += tag(ox + w / 2, oy + 22, title);
      const x0 = ox + 10, yA = oy + 92;
      const r = twoChains(seq, cnt, reverse, x0, yA, 76, dx);
      o += r.svg;
      if (arrows) {
        const a1 = ox + w / 2 - 70, a2 = ox + w / 2 + 70;
        o += arrow(P(a1, oy + 42), P(a2, oy + 42), { muted: true, size: 6 });
        o += reverse ? arrow(P(a2, oy + 210), P(a1, oy + 210), { muted: true, size: 6 }) : arrow(P(a1, oy + 210), P(a2, oy + 210), { muted: true, size: 6 });
      }
      o += text(ox + w / 2, oy + 234, sub, { cls: bad ? 'fg-tag-warn' : 'fg-tag-good', size: 11 });
      return o;
    };
    s += cell(18, 10, 352, 19, NY6, true, 'nylon 6, chains in opposite directions', 'every facing N–H and C=O is paired', false, true);
    s += cell(390, 10, 352, 19, NY6, false, 'nylon 6, chains in the same direction', 'best fit: half the facing groups unpaired', true, true);
    let o = panel(18, 272, 724, 236);
    o += tag(380, 294, 'nylon 6,6, as in the figure above: flip either chain end to end and it is the same chain');
    const r = twoChains(NY66, 38, false, 32, 366, 76, dx);
    o += r.svg;
    o += text(380, 496, 'every facing N–H and C=O is paired, whichever way round the chains lie', { cls: 'fg-tag-good', size: 11 });
    s += o;
    return s;
  },
  caption: 'Each panel is the best fit two flat chains can find. The gray arrows point from each nylon 6 chain’s amine end to its acid end. Dashed lines are hydrogen bonds; a coral group faces the other chain with nothing to bond to. Each amide’s other group points away, toward the next chain in the sheet, which is not drawn.',
});

FIGURES.push({
  id: 'nylon-hbonds',
  section: 'condensation-polymers',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 210',
  alt: 'Two nylon 6,6 chains drawn as zigzags one above the other, with every N–H and C=O drawn and dashed hydrogen bonds from each downward-facing group on the top chain to the opposite group on the bottom chain.',
  build() {
    let s = '';
    s += tag(165, 22, 'two nylon 6,6 chains, side by side');
    const r = twoChains(NY66, 17, false, 17, 80, 76, 18.5);
    s += r.svg;
    s += tag(165, 200, 'dashed: N–H···O=C between the chains', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Each amide makes one hydrogen bond to this neighbor. Its other group bonds to the next chain on the far side, which is not drawn.',
});

/* ------------------------------------------------------------ Kevlar --- */
/* Rings lie with their para axis horizontal. Between two rings the amide is
   a horizontal ring–C (or ring–N) bond, a 60° C–N bond and another horizontal
   bond, so every angle is 120°. The 60° bond alternates up and down, so the
   chain as a whole runs straight. */
function kevlarChain(x0, y, { L = 22, rr = 14, units = 4, startWith = 'N', flip = 1 } = {}) {
  let s = '', ringInk = '';
  let p = P(x0, y);
  let type = startWith, up = -1 * flip;
  const atoms = [];
  s += bond(at(p, 180, L * 0.8), p, { rFrom: 0, rTo: 0 });
  for (let u = 0; u < units; u++) {
    ringInk += ring6(p.x + rr, p.y, rr, 0);
    p = P(p.x + 2 * rr, p.y);
    const X1 = { ...at(p, 0, L), t: type };
    const X2 = { ...at(X1, 60 * up, L), t: type === 'N' ? 'C' : 'N' };
    const next = at(X2, 0, L);
    for (const X of [X1, X2]) X.r = X.t === 'N' ? 9 : 0;
    s += bond(p, X1, { rFrom: 0, rTo: X1.r });
    s += bond(X1, X2, { rFrom: X1.r, rTo: X2.r });
    s += bond(X2, next, { rFrom: X2.r, rTo: 0 });
    for (const [X, a, b] of [[X1, p, X2], [X2, X1, next]]) {
      const u1 = unit(X, a), u2 = unit(X, b);
      const ex = -(u1.x + u2.x), ey = -(u1.y + u2.y), n = Math.hypot(ex, ey);
      const g = { x: X.x + ex / n * 20, y: X.y + ey / n * 20, l: X.t === 'N' ? 'H' : 'O', down: ey > 0 };
      s += bond(X, g, { rFrom: X.r, rTo: 8, order: X.t === 'C' ? 2 : 1, gap: 2.6 });
      X.g = g; atoms.push(X);
    }
    p = next;
    type = type === 'N' ? 'C' : 'N';
    up = -up;
  }
  ringInk += ring6(p.x + rr, p.y, rr, 0);
  const endp = P(p.x + 2 * rr, p.y);
  s += bond(endp, at(endp, 0, L * 0.8), { rFrom: 0, rTo: 0 });
  return { s, ringInk, atoms, end: endp };
}
function kevlarPair(x0, y, gap, opts) {
  const A = kevlarChain(x0, y, opts);
  /* The partner chain: the same chain, placed below and shifted until its
     upward groups sit under the top chain's downward groups of the other kind. */
  let best = null;
  for (let sh = -60; sh <= 60; sh += 0.5) for (const sw of ['N', 'C']) for (const fl of [1, -1]) {
    const B = kevlarChain(x0 + sh, y + gap, { ...opts, startWith: sw, flip: fl });
    const pairs = [];
    for (const a of A.atoms) {
      if (!a.g.down) continue;
      const b = B.atoms.find((q) => !q.g.down && q.t !== a.t && Math.abs(q.g.x - a.g.x) < 7);
      if (b) pairs.push([a, b]);
    }
    const tight = pairs.reduce((t, [a, b]) => t + Math.abs(a.g.x - b.g.x), 0) + Math.abs(sh) * 0.01;
    if (!best || pairs.length > best.pairs.length || (pairs.length === best.pairs.length && tight < best.tight)) best = { tight, B, pairs };
  }
  let s = A.s + best.B.s + A.ringInk + best.B.ringInk;
  for (const [a, b] of best.pairs) s += hbond(P(a.g.x, a.g.y + 8), P(b.g.x, b.g.y - 8));
  for (const X of [...A.atoms, ...best.B.atoms]) {
    if (X.t === 'N') s += atom(X.x, X.y, 'N', { r: 9, size: 11 });
    s += atom(X.g.x, X.g.y, X.g.l, { r: 8, size: 11 });
  }
  return { svg: s, pairs: best.pairs.length };
}

FIGURES.push({
  id: 'kevlar-sheet',
  section: 'condensation-polymers',
  viewBox: '0 0 760 300',
  alt: 'Two Kevlar chains drawn one above the other. Each chain is para-linked benzene rings joined by amide groups, NH–C(=O) and C(=O)–NH alternating, and runs dead straight from left to right. Dashed hydrogen bonds join each downward N–H or C=O of the top chain to the opposite group on the bottom chain along the whole length.',
  build() {
    let s = '';
    s += tag(40, 30, 'PARA RINGS KEEP THE CHAIN STRAIGHT, SO THE AMIDES LINE UP', { anchor: 'start' });
    s += kevlarPair(60, 104, 92, { L: 22, rr: 16, units: 5 }).svg;
    s += text(380, 262, 'rings: flat and rigid, joined at opposite corners (para)', { cls: 'fg-tag', size: 11 });
    s += text(380, 282, 'dashed: an N–H···O=C hydrogen bond at every amide along the chain', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Follow either chain from left to right: it never turns. Then follow the dashed lines, one at every amide.',
});

FIGURES.push({
  id: 'l-kevlar-sheet',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 270',
  alt: 'Two straight Kevlar chains of para-linked rings and amides, one above the other, with dashed hydrogen bonds between facing N–H and C=O groups.',
  build() {
    let s = '';
    s += tag(165, 22, 'two Kevlar chains, side by side');
    s += kevlarPair(22, 88, 88, { L: 19, rr: 14, units: 2 }).svg;
    s += tag(165, 236, 'para rings keep the chain straight');
    s += tag(165, 256, 'dashed: N–H···O=C between the chains', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Straight chains put every amide beside a partner on the next chain.',
});

/* -------------------------------------------------------- polycarbonate --- */
/* Bisphenol A drawn as a V: each ring's para axis runs along a zigzag bond,
   so the two rings leave the central sp3 carbon at an angle, and the two
   methyls point out of the V. */
const METHYLS = (L) => [{ l: '', deg: 55, len: L * 0.9 }, { l: '', deg: 125, len: L * 0.9 }];
function bpa(x, y, L, rr) {
  return chain({ x, y, l: 'HO' }, [
    { d: 30, l: '', ring: true, sub: METHYLS(L) },
    { d: -30, l: 'OH', ring: true },
  ], { L, rr });
}
function pcRepeat(x, y, L, rr) {
  /* stub–O–C(=O)–O–[ring]–C(CH3)2–[ring]–stub */
  return chain({ x, y, l: '' }, [
    { d: -30, l: 'O', len: L * 1.5 },
    { d: 30, l: '', hi: true, sub: [O2()] },
    { d: -30, l: 'O', hi: true },
    { d: 30, l: '', ring: true, sub: METHYLS(L) },
    { d: -30, l: '', ring: true, len: L * 1.5 },
  ], { L, rr });
}

FIGURES.push({
  id: 'polycarbonate-drawn',
  section: 'condensation-polymers',
  viewBox: '0 0 760 420',
  alt: 'Bisphenol A drawn as two para-substituted benzene rings, each ending in OH, joined through one carbon carrying two methyl groups, so the molecule forms a V. Plus phosgene, Cl–C(=O)–Cl. An arrow losing 2 HCl leads to the bracketed polycarbonate repeat unit, O–C(=O)–O–ring–C(CH3)2–ring, with the carbonate O–C(=O)–O labeled and the central carbon labeled as the bend.',
  build() {
    let s = '';
    s += tag(40, 30, 'BISPHENOL A AND PHOSGENE', { anchor: 'start' });
    const b = bpa(80, 70, 28, 16);
    s += b.svg;
    const cq = b.nodes[1];
    s += text(cq.x, cq.y + 50, 'bisphenol A: a diol', { cls: 'fg-lbl', size: 12.5 });
    s += text(cq.x, cq.y + 68, 'both OH on rings', { cls: 'fg-tag-mut', size: 11 });
    s += text(440, 104, '+', { cls: 'fg-lbl', size: 16 });
    const ph = chain({ x: 490, y: 108, l: 'Cl' }, [{ d: -30, l: '', sub: [O2()] }, { d: 30, l: 'Cl' }], { L: 28 });
    s += ph.svg;
    s += text(514, 160, 'phosgene', { cls: 'fg-lbl', size: 12.5 });
    s += text(514, 178, 'the diacid chloride of carbonic acid', { cls: 'fg-tag-mut', size: 11 });
    s += rule(40, 214, 720, 214);
    s += arrow(P(48, 300), P(118, 300), { muted: true });
    s += text(83, 288, '− 2 HCl', { cls: 'fg-tag', size: 11 });
    const rep = pcRepeat(150, 300, 30, 17);
    s += rep.svg + bracketed(rep, 50);
    const n = rep.nodes;
    s += text(n[2].x, 244, 'carbonate: O–C(=O)–O', { cls: 'fg-tag-good', size: 11 });
    s += text(n[2].x, 260, '(highlighted bonds)', { cls: 'fg-tag-good', size: 11 });
    const q = n[4];
    s += text(q.x + 44, q.y + 20, 'sp³ carbon: the two rings leave', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(q.x + 44, q.y + 36, 'it at an angle, and two CH₃', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(q.x + 44, q.y + 52, 'groups stick out', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(380, 404, 'Rigid rings make it stiff; the bend keeps the chains from packing in order.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The highlighted bonds mark the carbonate, O–C(=O)–O. Follow the chain through the central carbon to see where it turns.',
});

/* ------------------------------------------------------ polyurethane --- */
/* The one step-growth in the chapter that behaves differently, drawn arrow
   by arrow. */
FIGURES.push({
  id: 'urethane-addition',
  section: 'condensation-polymers',
  viewBox: '0 0 760 470',
  alt: 'Two steps of the urethane-forming addition: an alcohol oxygen adding to the carbon of an isocyanate while the carbon-nitrogen pi bond moves onto nitrogen, giving a zwitterion, and then the nitrogen taking the proton from the positively charged oxygen to give a neutral carbamate',
  build() {
    let s = '';
    const head2 = (y, a, b) => {
      s += tag(48, y - 100, a, { anchor: 'start' });
      s += text(48, y - 84, b, { cls: 'fg-sm', size: 10, anchor: 'start' });
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
    s += '<g transform="translate(0,-10)">';
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
    s += curve(P(350, 84), P(230, 100), { bow: -20 });
    s += curve(P(188, 110), P(162, 100), { bow: -12 });
    s += arrow(P(440, 120), P(478, 120), { muted: true });
    s += zwitter(500, 120);
    s += text(612, 180, 'every atom of both molecules, and two charges', { cls: 'fg-sm', size: 10 });
    s += '</g>';
    s += rule(40, 190, 720, 190);

    /* 2. The proton transfer that neutralises it. */
    s += '<g transform="translate(0,34)">';
    head2(320, 'STEP 2 — THE PROTON MOVES', 'nitrogen takes the proton from the positive oxygen');
    s += zwitter(170, 320);
    s += lonePair(226, 320, 250, { dist: 28 });
    s += curve(P(212, 285), P(330, 270), { bow: -56 });
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
    s += '</g>';
    s += rule(40, 430, 720, 430);
    s += text(380, 454, 'Nothing is expelled in either step.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Step 1 forms the new C–O bond and leaves nitrogen negative and oxygen positive. Step 2 moves one proton and cancels both charges.',
});

FIGURES.push({
  id: 'l-urethane',
  lessons: ['condensation-polymers'],
  viewBox: '0 0 330 300',
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
    const y2 = 206;
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
    s += tag(214, y2 + 40, 'a carbamate (urethane)');
    s += tag(165, 288, 'highlighted: the two new bonds', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The alcohol O bonds to the isocyanate carbon and its H moves to nitrogen. Every atom of both molecules is kept.',
});

export default FIGURES;
