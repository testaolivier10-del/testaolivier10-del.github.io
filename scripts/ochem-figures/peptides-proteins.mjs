/* Figures for the peptides-proteins notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions, kept the same as the Foundations, Carbonyl and electrophiles
   pages:
   - every atom that a figure is about is written out in a disc; side chains
     and the rest of a chain may be condensed labels (CH₃, CH₂OH, R₁);
   - a full minus charge is teal (fg-hi), a full plus charge coral (fg-warn);
   - atoms that leave, or a group that takes part in a mechanism step, sit on
     a coral disc; the new bond is drawn in the highlight color;
   - a curved arrow starts on electrons (a lone pair or the middle of a bond)
     and ends where they go; lone pairs are drawn on O, N and S only where a
     figure moves them or where a charge depends on them.

   Figures that also appear in the lesson are 340 wide or less, stacked, and
   use only fg-lbl and fg-tag text. Wide notes figures that the lesson needs
   have a stacked copy with an l- prefix. */
import { atom as atom0, bond, wedge, hash, arrow, curve, lonePair, text, tag, rule, panel, bar, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
/* A lone pair pointing out along math angle `deg`. */
const lp = (c, deg, d = 21) => lonePair(c.x, c.y, -deg, { dist: d, spread: 4.5, r: 2.4 });
const lpTip = (c, deg, d = 28) => at(c, deg, d);

/* An atom disc that stays opaque in both themes (the tinted discs are
   translucent in the dark theme, so an opaque plain disc goes under them). */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
/* Disc radius from label length: fg-lbl is 13px, about 8px a character. */
const rOf = (l) => (l.length >= 5 ? 23 : l.length === 4 ? 20 : l.length === 3 ? 17 : l === 'H' ? 12 : 15);

/* A bond from c (a disc of radius rFrom) to a labeled group, plus the group. */
function arm(c, deg, len, l, o = {}) {
  const e = at(c, deg, len);
  const r = o.r ?? rOf(l);
  const opts = { rFrom: o.rFrom ?? 15, rTo: r };
  let s = o.kind === 'wedge' ? wedge(c, e, { ...opts, width: 9 })
        : o.kind === 'hash' ? hash(c, e, { ...opts, width: 10, rungs: 5 })
        : bond(c, e, { ...opts, order: o.order || 1, cls: o.cls });
  s += atom(e.x, e.y, l, { r, kind: o.atomKind });
  return { s, e };
}

/* A straight run of atoms (a backbone), with groups hanging off each one.
   nodes: { l, r?, kind?, dy?, next?: { order, cls }, subs?: [{ deg, l, len?, order?, kind?, cls? }] } */
function chain(x0, y, dx, nodes) {
  let s = '';
  const pts = nodes.map((nd, i) => P(x0 + i * dx, y + (nd.dy || 0)));
  const rr = (nd) => nd.r ?? rOf(nd.l);
  for (let i = 0; i < nodes.length - 1; i++) {
    const nx = nodes[i].next || {};
    s += bond(pts[i], pts[i + 1], { rFrom: rr(nodes[i]), rTo: rr(nodes[i + 1]), order: nx.order || 1, cls: nx.cls });
  }
  nodes.forEach((nd, i) => {
    for (const g of nd.subs || []) {
      s += arm(pts[i], g.deg, g.len ?? 46, g.l, { rFrom: rr(nd), order: g.order, atomKind: g.kind, cls: g.cls, r: g.r }).s;
    }
  });
  nodes.forEach((nd, i) => { s += atom(pts[i].x, pts[i].y, nd.l, { r: rr(nd), kind: nd.kind }); });
  return { s, pts };
}

const charge = (x, y, s, cls = 'fg-warn', size = 15) => text(x, y, s, { cls, size });
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const tg = (x, y, s, anchor = 'middle', cls = 'fg-tag') => text(x, y, s, { cls, size: 11, anchor });
const sm = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-sm', size: 10.5, anchor });

/* Resonance arrow: one line, a head at each end. */
function resArrow(a, b) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  return arrow(m, b, { size: 8 }) + arrow(m, a, { size: 8 });
}
/* A curved arrow that starts on the middle of bond a–b, pushed `off` px to
   the left of the direction a→b (negative: right), and ends at e. */
function fromBond(a, b, e, bow, off = 5) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  return curve(P(m.x + (dy / L) * off, m.y - (dx / L) * off), e, { bow, size: 7 });
}
/* A point on bond a–b at fraction f, pushed `off` px to the left of a→b. */
function onBond(a, b, f = 0.5, off = 0) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  return P(a.x + dx * f + (dy / L) * off, a.y + dy * f - (dx / L) * off);
}
/* A partial bond: one solid line plus one dashed line beside it. */
function partial(a, b, rA, rB, side = 1, gap = 4.5) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const px = (-dy / L) * gap * side, py = (dx / L) * gap * side;
  const ux = dx / L, uy = dy / L;
  const A = P(a.x + ux * rA, a.y + uy * rA), B = P(b.x - ux * rB, b.y - uy * rB);
  return `<line class="fg-bond" x1="${r2(A.x - px)}" y1="${r2(A.y - py)}" x2="${r2(B.x - px)}" y2="${r2(B.y - py)}"></line>` +
         `<line class="fg-dash" x1="${r2(A.x + px)}" y1="${r2(A.y + py)}" x2="${r2(B.x + px)}" y2="${r2(B.y + py)}"></line>`;
}
const hbond = (a, b) => `<line class="fg-dash-hi" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"></line>`;
/* A filled polygon through the given points (a shaded plane). */
const plane = (pts, cls = 'fg-fill-hi', op = 0.28) =>
  `<path class="${cls}" opacity="${op}" stroke-linejoin="round" d="M${pts.map((p) => `${r2(p.x)} ${r2(p.y)}`).join(' L')} Z"></path>`;
/* Push each point of a polygon `d` px away from its centroid. */
function grow(pts, d) {
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  return pts.map((p) => { const dx = p.x - cx, dy = p.y - cy, L = Math.hypot(dx, dy) || 1; return P(p.x + (dx / L) * d, p.y + (dy / L) * d); });
}

/* ------------------------------------------------ amino acids and dipeptide --- */
const H_UP = { deg: 90, l: 'H', len: 44, r: 12 };
const H_DN = { deg: 270, l: 'H', len: 44, r: 12 };
const O_UP = { deg: 90, l: 'O', len: 52, order: 2 };
const alanine = () => [
  { l: 'H₂N' },
  { l: 'C', subs: [H_UP, { deg: 270, l: 'CH₃', len: 50 }] },
  { l: 'C', subs: [O_UP] },
  { l: 'O', kind: 'warn' },
  { l: 'H', r: 12, kind: 'warn' },
];
const serine = () => [
  { l: 'H', r: 12, kind: 'warn' },
  { l: 'N', subs: [H_DN] },
  { l: 'C', subs: [H_UP, { deg: 270, l: 'CH₂OH', len: 54 }] },
  { l: 'C', subs: [O_UP] },
  { l: 'OH' },
];
const alaSer = () => [
  { l: 'H₂N' },
  { l: 'C', subs: [H_UP, { deg: 270, l: 'CH₃', len: 50 }] },
  { l: 'C', kind: 'hi', subs: [O_UP], next: { cls: 'fg-bond-hi' } },
  { l: 'N', kind: 'hi', subs: [H_DN] },
  { l: 'C', subs: [H_UP, { deg: 270, l: 'CH₂OH', len: 54 }] },
  { l: 'C', subs: [O_UP] },
  { l: 'OH' },
];

/* 1. The peptide bond, made. No curved arrow: a free amine and a free acid
   do not simply do this (the amine takes the acid's proton instead), so the
   figure shows the net change and the synthesis section draws the arrows. */
FIGURES.push({
  id: 'peptide-bond-formed',
  section: 'peptides-proteins',
  anchor: '',
  viewBox: '0 0 760 486',
  alt: 'Alanine, H2N–CH(CH3)–COOH, plus serine, H2N–CH(CH2OH)–COOH. The OH of alanine’s carboxyl and one H of serine’s amino group are shaded coral. An arrow marked minus H2O leads to the dipeptide Ala-Ser, H2N–CH(CH3)–C(=O)–NH–CH(CH2OH)–COOH, with the new C–N bond highlighted and labeled the peptide bond, the free NH2 end labeled N-terminus and the free COOH end labeled C-terminus, plus one H2O.',
  build() {
    let s = '';
    s += chain(60, 110, 58, alanine()).s;
    s += charge(340, 116, '+', 'fg-lbl', 16);
    s += chain(388, 110, 58, serine()).s;
    s += tg(340, 158, 'leave as water', 'middle', 'fg-tag-warn');
    s += tg(118, 208, 'alanine');
    s += tg(504, 208, 'serine');

    s += arrow(P(380, 226), P(380, 268));
    s += tg(398, 252, '− H₂O', 'start');

    s += bar(248, 256, 114, 138, { kind: 'hi', opacity: 0.2 });
    s += chain(150, 330, 62, alaSer()).s;
    s += charge(584, 336, '+', 'fg-lbl', 16);
    s += atom(636, 330, 'H₂O', { r: 18, kind: 'warn' });
    s += tg(305, 426, 'peptide bond (an amide)');
    s += tg(150, 294, 'N-terminus');
    s += tg(522, 294, 'C-terminus');

    s += rule(26, 446, 734, 446);
    s += lbl(380, 472, 'Ala-Ser: alanine keeps the free NH₂, serine keeps the free COOH.');
    return s;
  },
  caption: 'Follow the coral atoms: alanine’s OH and one H from serine’s nitrogen leave as water, and the new C–N bond (highlighted) is the peptide bond.',
});

FIGURES.push({
  id: 'l-peptide-bond-formed',
  lessons: ['peptides-proteins'],
  viewBox: '0 0 340 630',
  alt: 'Stacked: alanine, then serine, with alanine’s carboxyl OH and one H of serine’s nitrogen shaded coral. An arrow marked minus H2O leads to Ala-Ser, H2N–CH(CH3)–C(=O)–NH–CH(CH2OH)–COOH, with the new C–N bond highlighted as the peptide bond and the two ends labeled N-terminus and C-terminus.',
  build() {
    let s = '';
    s += chain(40, 74, 58, alanine()).s;
    s += tg(98, 160, 'alanine');
    s += charge(170, 184, '+', 'fg-lbl', 16);
    s += chain(40, 250, 58, serine()).s;
    s += tg(98, 342, 'serine');
    s += tg(236, 338, 'coral atoms leave', 'middle', 'fg-tag-warn');
    s += arrow(P(262, 356), P(262, 400));
    s += tg(276, 384, '− H₂O', 'start');
    s += bar(98, 408, 96, 136, { kind: 'hi', opacity: 0.2 });
    s += chain(26, 480, 48, alaSer()).s;
    s += tg(146, 400, 'peptide bond');
    s += tg(44, 584, 'N-terminus');
    s += tg(296, 584, 'C-terminus');
    s += lbl(170, 616, 'Ala-Ser');
    return s;
  },
  caption: 'Alanine’s OH and one H from serine’s nitrogen leave as water. The highlighted C–N bond is the peptide bond.',
});

/* 2. Gly-Ala against Ala-Gly: the same two residues, the other way round. */
function dipeptide(y, first) {
  const gly = (hi) => ({ l: 'C', subs: [H_UP, { ...H_DN }] });
  const ala = () => ({ l: 'C', subs: [H_UP, { deg: 270, l: 'CH₃', len: 50 }] });
  const nodes = [
    { l: 'H₂N' },
    first === 'Gly' ? gly() : ala(),
    { l: 'C', subs: [O_UP] },
    { l: 'N', subs: [H_DN] },
    first === 'Gly' ? ala() : gly(),
    { l: 'COOH' },
  ];
  let s = '';
  const second = first === 'Gly' ? 'Ala' : 'Gly';
  const fill = (n) => (n === 'Gly' ? 'hi' : 'good');
  s += bar(10, y - 70, 152, 142, { kind: fill(first), opacity: 0.22 });
  s += bar(168, y - 70, 162, 142, { kind: fill(second), opacity: 0.22 });
  s += chain(30, y, 54, nodes.slice(0, 5)).s;
  // The C-terminal carboxyl sits a little further out: its label is wider.
  s += bond(P(246, y), P(304, y), { rFrom: 15, rTo: 20 }) + atom(304, y, 'COOH', { r: 20 });
  const name = (n) => (n === 'Gly' ? 'glycine' : 'alanine');
  s += tg(86, y - 58, name(first));
  s += tg(270, y - 58, name(second));
  s += tg(42, y + 86, 'N-terminus');
  s += tg(296, y + 86, 'C-terminus');
  return s;
}
FIGURES.push({
  id: 'dipeptide-direction',
  section: 'peptides-proteins',
  lessons: ['peptides-proteins'],
  anchor: '',
  viewBox: '0 0 340 410',
  alt: 'Top: Gly-Ala, H2N–CH2–C(=O)–NH–CH(CH3)–COOH, with the glycine residue shaded teal on the left and the alanine residue shaded green on the right; the free NH2 is on glycine (N-terminus) and the free COOH on alanine (C-terminus). Bottom: Ala-Gly, H2N–CH(CH3)–C(=O)–NH–CH2–COOH, with the shading swapped: alanine now carries the free NH2 and glycine the free COOH.',
  build() {
    let s = '';
    s += lbl(170, 22, 'Gly-Ala');
    s += dipeptide(106, 'Gly');
    s += rule(16, 212, 324, 212);
    s += lbl(170, 238, 'Ala-Gly');
    s += dipeptide(322, 'Ala');
    return s;
  },
  caption: 'Same two residues, opposite order. Look at which residue sits on the left, where the free NH₂ is: that residue is named first.',
});

/* 3. The two resonance structures of one peptide unit. */
function peptideUnit(c, ionic, { arrows = false } = {}) {
  let s = '';
  const o = at(c, 90, 62);
  const caL = at(c, 210, 64);
  const n = at(c, 330, 66);
  const h = at(n, 270, 50);
  const caR = at(n, 30, 64);
  s += bond(c, caL, { rFrom: 16, rTo: 15 }) + atom(caL.x, caL.y, 'Cα');
  s += bond(c, o, { order: ionic ? 1 : 2, rFrom: 16, rTo: 15 });
  s += bond(c, n, { order: ionic ? 2 : 1, rFrom: 16, rTo: 16, cls: 'fg-bond' });
  s += bond(n, h, { rFrom: 16, rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12 });
  s += bond(n, caR, { rFrom: 16, rTo: 15 }) + atom(caR.x, caR.y, 'Cα');
  if (ionic) {
    s += lp(o, 150) + lp(o, 90) + lp(o, 30);
    s += atom(o.x, o.y, 'O', { kind: 'hi' });
    s += charge(o.x + 25, o.y + 13, '−', 'fg-hi');
    s += atom(n.x, n.y, 'N', { kind: 'warn' });
    s += charge(n.x + 2, n.y - 24, '+');
  } else {
    s += lp(o, 150) + lp(o, 30);
    s += atom(o.x, o.y, 'O');
    s += lp(n, 90);
    s += atom(n.x, n.y, 'N', { kind: 'hi' });
    if (arrows) {
      s += curve(lpTip(n, 90, 27), onBond(c, n, 0.45, 8), { bow: 16, size: 7 });
      s += curve(onBond(c, o, 0.5, -8), P(o.x + 18, o.y + 5), { bow: -16, size: 7 });
    }
  }
  s += atom(c.x, c.y, 'C');
  return s;
}
FIGURES.push({
  id: 'amide-resonance',
  section: 'peptides-proteins',
  anchor: '',
  viewBox: '0 0 760 250',
  alt: 'Left: a peptide unit, Cα–C(=O)–N(H)–Cα, with a lone pair on nitrogen and two on oxygen. One curved arrow runs from the nitrogen lone pair into the C–N bond, a second from the C=O double bond onto the oxygen. A double-headed resonance arrow leads to the right-hand structure: C–O single with three lone pairs and a minus charge on oxygen, C=N double with a plus charge on nitrogen.',
  build() {
    let s = '';
    s += peptideUnit(P(200, 116), false, { arrows: true });
    s += resArrow(P(338, 124), P(428, 124));
    s += peptideUnit(P(540, 116), true);
    s += tg(210, 238, 'lone pair on N, C=O double');
    s += tg(550, 238, 'C=N double, + on N, − on O');
    return s;
  },
  caption: 'Follow the two curved arrows from the left structure to the right one, then compare the charges.',
});
FIGURES.push({
  id: 'l-amide-resonance',
  lessons: ['peptides-proteins'],
  viewBox: '0 0 340 490',
  alt: 'Top: a peptide unit, Cα–C(=O)–N(H)–Cα, with curved arrows from the nitrogen lone pair into the C–N bond and from the C=O bond onto oxygen. A vertical double-headed resonance arrow leads down to the second structure, with C=N double, a plus charge on nitrogen and a minus charge on oxygen.',
  build() {
    let s = '';
    s += peptideUnit(P(136, 96), false, { arrows: true });
    s += tg(170, 218, 'lone pair on N, C=O double');
    s += resArrow(P(170, 230), P(170, 272));
    s += peptideUnit(P(136, 352), true);
    s += tg(170, 474, 'C=N double, + on N, − on O');
    return s;
  },
  caption: 'Follow the two curved arrows from the top structure to the bottom one, then compare the charges.',
});

/* 4. The hybrid: what the peptide unit really looks like. */
FIGURES.push({
  id: 'amide-hybrid',
  section: 'peptides-proteins',
  lessons: ['peptides-proteins'],
  anchor: '',
  viewBox: '0 0 340 300',
  alt: 'The resonance hybrid of a peptide unit. Both the C–O and the C–N bonds are drawn as one solid line plus one dashed line. Oxygen carries delta minus and nitrogen delta plus. A shaded plane covers the six atoms Cα, C, O, N, H and the second Cα, and the two Cα atoms sit on opposite sides of the C–N bond. Labels give the C–N bond as 1.33 Å, against 1.47 Å for a plain C–N single bond.',
  build() {
    let s = '';
    const c = P(140, 132);
    const o = at(c, 90, 56), caL = at(c, 210, 58), n = at(c, 330, 58);
    const h = at(n, 270, 46), caR = at(n, 30, 58);
    s += plane(grow([caL, o, caR, h], 24));
    s += bond(c, caL, { rFrom: 15, rTo: 15 }) + atom(caL.x, caL.y, 'Cα');
    s += partial(c, o, 15, 15, -1);
    s += partial(c, n, 15, 15, -1);
    s += bond(n, h, { rFrom: 15, rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12 });
    s += bond(n, caR, { rFrom: 15, rTo: 15 }) + atom(caR.x, caR.y, 'Cα');
    s += atom(o.x, o.y, 'O');
    s += text(o.x + 28, o.y + 5, 'δ−', { cls: 'fg-hi', size: 13 });
    s += atom(n.x, n.y, 'N');
    s += text(n.x + 24, n.y + 24, 'δ+', { cls: 'fg-warn', size: 13 });
    s += atom(c.x, c.y, 'C');
    s += tg(c.x + 4, c.y + 48, 'C–N: 1.33 Å');
    s += tg(170, 258, 'shaded: one flat plane, six atoms');
    s += tg(170, 280, 'a plain C–N single bond is 1.47 Å');
    return s;
  },
  caption: 'Each solid-plus-dashed pair is a partial double bond. The shaded plane holds all six atoms.',
});

/* 5. The backbone as a chain of flat plates hinged at the α carbons. */
FIGURES.push({
  id: 'backbone-plates',
  section: 'peptides-proteins',
  lessons: ['peptides-proteins'],
  anchor: '',
  viewBox: '0 0 340 270',
  alt: 'Three residues of a backbone drawn as a zigzag: Cα, C, N, Cα, C, N, Cα. Each C carries a double-bonded O and each N an H, on opposite sides. Each amide unit, from one Cα to the next, is covered by a shaded flat plate. Each Cα carries an R group and an H. Small curved arrows at the middle Cα mark the two bonds that can rotate.',
  build() {
    let s = '';
    const xs = [34, 80, 126, 172, 218, 264, 310];
    const lo = 150, hi = 120;
    const ys = [lo, hi, lo, hi, lo, hi, lo];
    const p = xs.map((x, i) => P(x, ys[i]));
    const [ca1, c1, n1, ca2, c2, n2, ca3] = p;
    const o1 = at(c1, 90, 50), h1 = at(n1, 270, 44), o2 = at(c2, 270, 50), h2 = at(n2, 90, 44);
    s += plane(grow([ca1, o1, ca2, h1], 14));
    s += plane(grow([ca2, h2, ca3, o2], 14), 'fg-fill-good');
    // chain continues off both ends
    s += bond(ca1, at(ca1, 150, 34), { rFrom: 15, rTo: 0 });
    s += bond(ca3, at(ca3, 30, 34), { rFrom: 15, rTo: 0 });
    for (let i = 0; i < 6; i++) s += bond(p[i], p[i + 1], { rFrom: 15, rTo: 15 });
    s += bond(c1, o1, { order: 2, rFrom: 15, rTo: 15 }) + atom(o1.x, o1.y, 'O');
    s += bond(c2, o2, { order: 2, rFrom: 15, rTo: 15 }) + atom(o2.x, o2.y, 'O');
    s += bond(n1, h1, { rFrom: 15, rTo: 12 }) + atom(h1.x, h1.y, 'H', { r: 12 });
    s += bond(n2, h2, { rFrom: 15, rTo: 12 }) + atom(h2.x, h2.y, 'H', { r: 12 });
    s += arm(ca1, 250, 42, 'R', { r: 12 }).s + arm(ca1, 310, 42, 'H', { r: 12 }).s;
    s += arm(ca2, 60, 42, 'R', { r: 12 }).s + arm(ca2, 120, 42, 'H', { r: 12 }).s;
    s += arm(ca3, 230, 42, 'H', { r: 12 }).s + arm(ca3, 290, 42, 'R', { r: 12 }).s;
    for (const q of [ca1, ca2, ca3]) s += atom(q.x, q.y, 'Cα', { kind: 'warn' });
    for (const q of [c1, c2]) s += atom(q.x, q.y, 'C');
    for (const q of [n1, n2]) s += atom(q.x, q.y, 'N');
    // rotation marks on the two bonds at the middle alpha carbon
    for (const [a, b] of [[n1, ca2], [ca2, c2]]) {
      const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
      const px = -dy / L, py = dx / L;
      s += curve(P(m.x + px * 14, m.y + py * 14), P(m.x - px * 14, m.y - py * 14), { bow: 12, size: 7 });
    }
    s += tg(170, 24, 'rotation only at each Cα', 'middle', 'fg-tag-warn');
    s += tg(170, 250, 'shaded: rigid, flat amide plates');
    return s;
  },
  caption: 'Each shaded plate is one amide unit. The curved arrows sit on the two bonds at the middle α carbon.',
});

/* 6. The alpha helix: residue i to residue i+4. */
FIGURES.push({
  id: 'helix-hbonds',
  section: 'peptides-proteins',
  lessons: ['peptides-proteins'],
  anchor: '',
  viewBox: '0 0 340 446',
  alt: 'An alpha helix drawn as a coil running down the page, with eleven residues marked as numbered discs, 1 at the top (the N-terminal end). Dashed lines join residue 1 to 5, 2 to 6, 3 to 7 and so on, each running roughly parallel to the helix axis. Short sticks labeled R point outward from the coil.',
  build() {
    let s = '';
    const cx = 160, amp = 72, lift = 7, y0 = 62, rise = 31;
    const pos = (k) => {
      const t = rad(k * 100);
      return { p: P(cx + amp * Math.sin(t), y0 + k * rise - lift * Math.cos(t)), front: Math.cos(t) < 0, sin: Math.sin(t) };
    };
    // the coil itself, back half faint and front half solid
    const seg = (k0, k1) => {
      let d = '';
      for (let i = 0; i <= 12; i++) {
        const k = k0 + ((k1 - k0) * i) / 12;
        const q = pos(k).p;
        d += (i ? 'L' : 'M') + r2(q.x) + ' ' + r2(q.y) + ' ';
      }
      return d.trim();
    };
    for (let k = -0.3; k < 10.3; k += 0.1) {
      const mid = pos(k + 0.05);
      s += `<path class="${mid.front ? 'fg-bond' : 'fg-bond-soft'}" d="${seg(k, Math.min(k + 0.1, 10.3))}"></path>`;
    }
    const res = Array.from({ length: 11 }, (_, k) => pos(k));
    // side chains: short sticks from the residues at the edges of the coil
    res.forEach((r, k) => {
      if (Math.abs(r.sin) > 0.75) {
        const dir = r.sin > 0 ? 1 : -1;
        const e = P(r.p.x + dir * 42, r.p.y);
        s += bond(r.p, e, { rFrom: 11, rTo: 10, cls: 'fg-bond-soft' });
        s += text(e.x + dir * 2, e.y + 4.5, 'R', { cls: 'fg-lbl', size: 13 });
      }
    });
    for (let k = 0; k + 4 < 11; k++) {
      const a = res[k].p, b = res[k + 4].p;
      const L = Math.hypot(b.x - a.x, b.y - a.y), ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
      const line = `x1="${r2(a.x + ux * 12)}" y1="${r2(a.y + uy * 12)}" x2="${r2(b.x - ux * 12)}" y2="${r2(b.y - uy * 12)}"`;
      s += k === 0 ? `<line class="fg-dash-hi" ${line}></line>` : `<line class="fg-dash" ${line}></line>`;
    }
    res.forEach((r, k) => {
      s += `<circle class="${k === 0 || k === 4 ? 'fg-atom-hi' : 'fg-atom'}" cx="${r2(r.p.x)}" cy="${r2(r.p.y)}" r="11"${r.front ? '' : ' opacity="0.75"'}></circle>`;
      s += text(r.p.x, r.p.y + 4.5, String(k + 1), { cls: 'fg-lbl', size: 13 });
    });
    s += tg(cx, 26, 'residue 1: N-terminal end');
    s += tg(170, 412, 'C=O of residue 1 ··· H–N of residue 5');
    s += tg(170, 432, '3.6 residues per turn');
    return s;
  },
  caption: 'Numbered discs are residues and each dashed line is one hydrogen bond. The highlighted one joins residue 1 to residue 5.',
});

/* 7. An antiparallel beta sheet, atom by atom. */
function strand(x0, dx, yNear, yFar, towardDown, order) {
  // order: labels left to right, 'N' | 'C' | 'A' (alpha carbon)
  let s = '';
  const pts = order.map((t, i) => P(x0 + i * dx, i % 2 === 0 ? yNear : yFar));
  const r = (t) => (t === 'A' ? 17 : 13);
  for (let i = 0; i < pts.length - 1; i++) s += bond(pts[i], pts[i + 1], { rFrom: r(order[i]), rTo: r(order[i + 1]) });
  const out = [];
  order.forEach((t, i) => {
    if (t === 'A') return;
    const near = i % 2 === 0;
    const down = near ? towardDown : !towardDown;
    const e = P(pts[i].x, pts[i].y + (down ? 1 : -1) * (t === 'C' ? 36 : 32));
    if (t === 'C') { s += bond(pts[i], e, { order: 2, rFrom: 13, rTo: 13 }); s += atom(e.x, e.y, 'O', { r: 13 }); }
    else { s += bond(pts[i], e, { rFrom: 13, rTo: 11 }); s += atom(e.x, e.y, 'H', { r: 11 }); }
    out.push({ i, t, e, near });
  });
  order.forEach((t, i) => { s += atom(pts[i].x, pts[i].y, t === 'A' ? 'CHR' : t, { r: r(t) }); });
  return { s, out };
}
FIGURES.push({
  id: 'sheet-hbonds',
  section: 'peptides-proteins',
  lessons: ['peptides-proteins'],
  anchor: '',
  viewBox: '0 0 340 340',
  alt: 'Two strands of backbone atoms, N, CHR and C repeating, one above the other. The top strand runs N to C from left to right, the bottom strand from right to left. Each C carries a double-bonded O and each N an H. Where an N–H of one strand faces a C=O of the other, a dashed hydrogen bond joins them: four dashed lines run straight across the gap between the strands.',
  build() {
    let s = '';
    const x0 = 26, dx = 36;
    const top = strand(x0, dx, 114, 94, true, ['N', 'A', 'C', 'N', 'A', 'C', 'N', 'A', 'C']);
    const bot = strand(x0, dx, 226, 246, false, ['C', 'A', 'N', 'C', 'A', 'N', 'C', 'A', 'N']);
    s += top.s + bot.s;
    // hydrogen bonds between the facing groups
    const facingTop = top.out.filter((g) => g.near);
    const facingBot = bot.out.filter((g) => g.near);
    for (const g of facingTop) {
      const m = facingBot.find((b) => b.i === g.i);
      if (m) s += hbond(P(g.e.x, g.e.y + (g.t === 'C' ? 13 : 11)), P(m.e.x, m.e.y - (m.t === 'C' ? 13 : 11)));
    }
    s += arrow(P(250, 30), P(318, 30));
    s += tg(242, 34, 'N → C', 'end');
    s += arrow(P(90, 314), P(22, 314));
    s += tg(98, 318, 'N → C', 'start');
    return s;
  },
  caption: 'The arrows give each strand’s N-to-C direction, and the dashed lines are hydrogen bonds. CHR is an α carbon with its H and side chain.',
});

/* 8. The disulfide: two thiols oxidized to one S–S bond. */
function cysPair(cx, bonded) {
  let s = '';
  const topY = 60, botY = 320;
  const topC = P(cx, topY), botC = P(cx, botY);
  // top chain: –NH–CH–C(=O)–, side chain hanging down
  s += chain(cx - 60, topY, 60, [{ l: 'NH' }, { l: 'CH' }, { l: 'C', subs: [{ deg: 90, l: 'O', len: 44, order: 2 }] }]).s;
  s += bond(P(cx - 100, topY), P(cx - 75, topY), { rFrom: 0, rTo: 0 }) + bond(P(cx + 75, topY), P(cx + 100, topY), { rFrom: 0, rTo: 0 });
  s += chain(cx - 60, botY, 60, [{ l: 'C', subs: [{ deg: 270, l: 'O', len: 44, order: 2 }] }, { l: 'CH' }, { l: 'NH' }]).s;
  s += bond(P(cx - 100, botY), P(cx - 75, botY), { rFrom: 0, rTo: 0 }) + bond(P(cx + 75, botY), P(cx + 100, botY), { rFrom: 0, rTo: 0 });
  const t2 = P(cx, 112), b2 = P(cx, 268);
  s += bond(topC, t2, { rFrom: 15, rTo: 17 }) + atom(t2.x, t2.y, 'CH₂');
  s += bond(botC, b2, { rFrom: 15, rTo: 17 }) + atom(b2.x, b2.y, 'CH₂');
  if (bonded) {
    const sa = P(cx, 162), sb = P(cx, 218);
    s += bond(t2, sa, { rFrom: 17, rTo: 15 }) + bond(b2, sb, { rFrom: 17, rTo: 15 });
    s += bond(sa, sb, { rFrom: 15, rTo: 15, cls: 'fg-bond-hi' });
    s += atom(sa.x, sa.y, 'S', { kind: 'hi' }) + atom(sb.x, sb.y, 'S', { kind: 'hi' });
  } else {
    const sa = P(cx, 162), sb = P(cx, 218);
    s += bond(t2, sa, { rFrom: 17, rTo: 15 }) + bond(b2, sb, { rFrom: 17, rTo: 15 });
    s += atom(sa.x, sa.y, 'SH') + atom(sb.x, sb.y, 'SH');
  }
  return s;
}
FIGURES.push({
  id: 'disulfide',
  section: 'peptides-proteins',
  anchor: '',
  viewBox: '0 0 760 416',
  alt: 'Left: two stretches of backbone, one above the other, each with a cysteine side chain, CH2–SH, pointing toward the other. Right: the same two stretches joined by an S–S bond between the two sulfurs. A forward arrow between them is labeled oxidation, loses 2 H; a reverse arrow is labeled reduction, adds 2 H.',
  build() {
    let s = '';
    s += cysPair(180, false);
    s += cysPair(580, true);
    s += arrow(P(310, 170), P(450, 170));
    s += tg(380, 158, 'oxidation (−2 H)');
    s += arrow(P(450, 210), P(310, 210), { muted: true });
    s += tg(380, 232, 'reduction (+2 H)');
    s += tg(180, 404, 'two cysteine thiols, S–H');
    s += tg(580, 404, 'one disulfide bond, S–S');
    return s;
  },
  caption: 'Compare the sulfurs: two S–H groups on the left, one S–S bond (highlighted) on the right. The two cysteines can be far apart in the sequence.',
});

/* 9. Nonpolar core, polar surface. */
FIGURES.push({
  id: 'hydrophobic-core',
  section: 'peptides-proteins',
  lessons: ['peptides-proteins'],
  anchor: '',
  viewBox: '0 0 340 332',
  alt: 'A folded protein drawn as an oval. Inside it, the nonpolar side chains Leu, Val, Phe and Ile are packed together. Around its edge, the polar and charged side chains Asp minus, Lys plus, Ser, Glu minus, Arg plus and Thr point outward, and H2O molecules sit outside next to them.',
  build() {
    let s = '';
    const c = P(170, 144), rx = 112, ry = 90;
    s += `<ellipse class="fg-panel" cx="${c.x}" cy="${c.y}" rx="${rx}" ry="${ry}"></ellipse>`;
    const core = [['Leu', 138, 122], ['Val', 202, 118], ['Phe', 142, 168], ['Ile', 204, 166]];
    s += `<ellipse class="fg-fill-warn" opacity="0.25" cx="172" cy="144" rx="62" ry="46"></ellipse>`;
    for (const [l, x, y] of core) s += atom(x, y, l, { r: 18 });
    const rim = [['Asp⁻', 30], ['Lys⁺', 100], ['Ser', 158], ['Glu⁻', 212], ['Arg⁺', 270], ['Thr', 330]];
    for (const [l, deg] of rim) {
      const p = P(c.x + (rx - 4) * Math.cos(rad(deg)), c.y - (ry - 4) * Math.sin(rad(deg)));
      s += atom(p.x, p.y, l, { r: 20, kind: 'hi' });
      const w = P(c.x + (rx + 34) * Math.cos(rad(deg)), c.y - (ry + 30) * Math.sin(rad(deg)));
      s += text(w.x, w.y + 4, 'H₂O', { cls: 'fg-tag-mut', size: 11 });
    }
    s += tg(170, 300, 'inside: nonpolar side chains');
    s += tg(170, 320, 'surface: polar and charged, facing water');
    return s;
  },
  caption: 'Plain discs on the coral patch are nonpolar side chains. Teal discs are polar or charged ones.',
});

/* 10. Reading Cys-Leu-Asp-Lys-Val-Cys. */
FIGURES.push({
  id: 'loop-peptide',
  section: 'peptides-proteins',
  anchor: '',
  viewBox: '0 0 340 360',
  alt: 'The peptide Cys-Leu-Asp-Lys-Val-Cys drawn as six residue discs joined in order around a loop. The two Cys discs sit side by side at the bottom, and their sulfur atoms are joined by an S–S bond. The Asp side chain, COO minus, and the Lys side chain, NH3 plus, point up toward each other with a dashed line between them labeled salt bridge. Leu and Val face each other across the middle, labeled nonpolar. The N-terminus, H3N plus, hangs off the first Cys and the C-terminus, COO minus, off the last.',
  build() {
    let s = '';
    const c = P(170, 176), R = 80;
    const names = ['Cys', 'Leu', 'Asp', 'Lys', 'Val', 'Cys'];
    const degs = [240, 180, 120, 60, 0, 300];
    const p = degs.map((d) => P(c.x + R * Math.cos(rad(d)), c.y - R * Math.sin(rad(d))));
    for (let i = 0; i < 5; i++) s += bond(p[i], p[i + 1], { rFrom: 20, rTo: 20 });
    const sa = P(p[0].x, p[0].y + 60), sb = P(p[5].x, p[5].y + 60);
    s += bond(p[0], sa, { rFrom: 20, rTo: 15 }) + bond(p[5], sb, { rFrom: 20, rTo: 15 });
    s += bond(sa, sb, { rFrom: 15, rTo: 15, cls: 'fg-bond-hi' });
    s += atom(sa.x, sa.y, 'S', { kind: 'hi' }) + atom(sb.x, sb.y, 'S', { kind: 'hi' });
    s += tg(170, sa.y + 32, 'disulfide closes the loop');
    // termini
    s += arm(p[0], 210, 64, 'H₃N⁺', { rFrom: 20, r: 22 }).s;
    s += arm(p[5], 330, 64, 'COO⁻', { rFrom: 20, r: 22 }).s;
    // salt bridge
    const a1 = P(p[2].x, p[2].y - 62), k1 = P(p[3].x, p[3].y - 62);
    s += bond(p[2], a1, { rFrom: 20, rTo: 22 }) + atom(a1.x, a1.y, 'COO⁻', { r: 22, kind: 'hi' });
    s += bond(p[3], k1, { rFrom: 20, rTo: 22 }) + atom(k1.x, k1.y, 'NH₃⁺', { r: 22, kind: 'warn' });
    s += hbond(P(a1.x + 23, a1.y), P(k1.x - 23, k1.y));
    s += tg(170, a1.y - 28, 'salt bridge');
    s += `<ellipse class="fg-fill-warn" opacity="0.25" cx="${c.x}" cy="${c.y}" rx="${R + 30}" ry="32"></ellipse>`;
    names.forEach((n, i) => { s += atom(p[i].x, p[i].y, n, { r: 20 }); });
    s += tg(170, c.y - 4, 'Leu and Val:');
    s += tg(170, c.y + 12, 'nonpolar');
    return s;
  },
  caption: 'The six residues in order, with the disulfide, the salt bridge and the nonpolar pair marked. The loop is a sketch of which side chains meet, not a real shape.',
});

/* 11. Protect, couple, deprotect: making Gly-Ala on purpose. */
function block(x, y, w, l, kind) {
  return panel(x, y - 15, w, 30, { kind, r: 7 }) + lbl(x + w / 2, y + 4.5, l);
}
FIGURES.push({
  id: 'synthesis-plan',
  section: 'peptides-proteins',
  anchor: '',
  viewBox: '0 0 760 350',
  alt: 'Row 1: Boc–Gly–COOH plus H2N–Ala–OCH3, arrow labeled DCC, giving Boc–Gly–Ala–OCH3. An arrow down labeled TFA, acid, removes Boc gives H2N–Gly–Ala–OCH3. A note beside it says that to add another residue, couple the next Boc amino acid to this free NH2 and repeat. An arrow down labeled aqueous base, then acid, removes the ester gives H2N–Gly–Ala–COOH, the dipeptide Gly-Ala.',
  build() {
    let s = '';
    const y1 = 60;
    s += block(24, y1, 54, 'Boc', 'warn') + block(82, y1, 54, 'Gly', 'hi');
    s += lbl(140, y1 + 4.5, '–COOH', 'start');
    s += charge(212, y1 + 6, '+', 'fg-lbl', 16);
    s += lbl(276, y1 + 4.5, 'H₂N–', 'end');
    s += block(278, y1, 54, 'Ala', 'hi') + block(336, y1, 64, 'OCH₃', 'warn');
    s += arrow(P(414, y1), P(488, y1));
    s += tg(451, y1 - 12, 'DCC');
    s += block(500, y1, 54, 'Boc', 'warn') + block(558, y1, 54, 'Gly', 'hi') + block(616, y1, 54, 'Ala', 'hi') + block(674, y1, 64, 'OCH₃', 'warn');
    s += tg(140, y1 + 36, 'only COOH free', 'start', 'fg-tag-mut');
    s += tg(278, y1 + 36, 'only NH₂ free', 'start', 'fg-tag-mut');

    const y2 = 180;
    s += arrow(P(620, y1 + 24), P(620, y2 - 24));
    s += tg(606, 124, 'TFA (acid) removes Boc', 'end');
    s += lbl(556, y2 + 4.5, 'H₂N–', 'end');
    s += block(558, y2, 54, 'Gly', 'hi') + block(616, y2, 54, 'Ala', 'hi') + block(674, y2, 64, 'OCH₃', 'warn');
    s += tg(24, y2 - 8, 'For a longer chain: couple the next Boc amino acid', 'start', 'fg-tag-mut');
    s += tg(24, y2 + 10, 'to this free NH₂ with DCC, then remove Boc again.', 'start', 'fg-tag-mut');

    const y3 = 300;
    s += arrow(P(620, y2 + 24), P(620, y3 - 24));
    s += tg(606, 236, 'aqueous base, then acid,', 'end');
    s += tg(606, 252, 'removes the ester', 'end');
    s += lbl(556, y3 + 4.5, 'H₂N–', 'end');
    s += block(558, y3, 54, 'Gly', 'hi') + block(616, y3, 54, 'Ala', 'hi');
    s += lbl(674, y3 + 4.5, '–COOH', 'start');
    s += tg(480, y3 + 5, 'the dipeptide Gly-Ala', 'end', 'fg-tag-good');
    return s;
  },
  caption: 'Coral blocks are the protecting groups. Each coupling joins the one free COOH to the one free NH₂, so only one product can form.',
});

/* 12. How DCC couples an acid to an amine. The carbodiimide half is drawn in
   full once; after that the leaving group is written as a condensed group. */
const LG = 'C(=NCy)NHCy';
/* The tetrahedral intermediate of panels 2 and 3: C with O⁻ up, R′NH₂⁺ at
   upper left, R at lower left and the O–LG leaving group at lower right. */
function tetrahedral(c, { arrows = false } = {}) {
  let s = '';
  const o = at(c, 90, 56), n = at(c, 150, 58), r = at(c, 210, 56), og = at(c, 330, 56);
  s += bond(c, o, { rFrom: 16, rTo: 16 }) + lp(o, 150) + lp(o, 90) + lp(o, 30);
  s += atom(o.x, o.y, 'O', { kind: 'hi' }) + charge(o.x + 26, o.y + 14, '−', 'fg-hi');
  s += bond(c, r, { rFrom: 16, rTo: 15 }) + atom(r.x, r.y, 'R');
  s += bond(c, n, { rFrom: 16, rTo: 16 });
  s += arm(n, 90, 42, 'H', { r: 12, rFrom: 16 }).s + arm(n, 170, 46, 'R′', { rFrom: 16 }).s + arm(n, 230, 42, 'H', { r: 12, rFrom: 16 }).s;
  s += atom(n.x, n.y, 'N') + charge(at(n, 300, 25).x, at(n, 300, 25).y + 5, '+');
  s += bond(c, og, { rFrom: 16, rTo: 16 }) + atom(og.x, og.y, 'O', { kind: arrows ? 'warn' : undefined });
  s += bond(og, P(og.x + 40, og.y), { rFrom: 16, rTo: 0 }) + lbl(og.x + 43, og.y + 4.5, LG, 'start');
  s += atom(c.x, c.y, 'C');
  if (arrows) {
    s += curve(lpTip(o, 150, 27), onBond(c, o, 0.45, 8), { bow: 14, size: 7 });
    s += fromBond(c, og, P(og.x - 6, og.y + 19), 12, -6);
  }
  return s;
}
FIGURES.push({
  id: 'dcc-coupling',
  section: 'peptides-proteins',
  anchor: '',
  viewBox: '0 0 760 800',
  alt: 'Three panels. Panel 1, DCC activates the acid: a carboxylate oxygen lone pair attacks the central carbon of protonated DCC, Cy–N=C=N+(H)–Cy, while one C=N double bond moves onto the positive nitrogen, giving an O-acylisourea, R–C(=O)–O–C(=NCy)NHCy. Panel 2, the amine adds: the nitrogen lone pair of R′–NH2 attacks the carbonyl carbon while the C=O pi bond moves onto oxygen, giving a tetrahedral carbon carrying O minus, N+H2R′, R and the O–C(=NCy)NHCy group. Panel 3, the carbonyl reforms: an oxygen lone pair moves back to make C=O, and the C–O bond to the leaving group breaks. The products are the amide R–C(=O)–NH–R′ and dicyclohexylurea.',
  build() {
    let s = '';
    /* Panel 1 */
    s += panel(16, 12, 728, 256);
    s += tg(380, 34, '1 · DCC ACTIVATES THE ACID');
    const c1 = P(100, 136);
    const o1 = at(c1, 90, 56), r1 = at(c1, 210, 56), om = at(c1, 330, 56);
    s += bond(c1, o1, { order: 2, rFrom: 16, rTo: 15 }) + lp(o1, 150) + lp(o1, 30) + atom(o1.x, o1.y, 'O');
    s += bond(c1, r1, { rFrom: 16, rTo: 15 }) + atom(r1.x, r1.y, 'R');
    s += bond(c1, om, { rFrom: 16, rTo: 16 }) + lp(om, 40) + lp(om, 280) + lp(om, 340);
    s += atom(om.x, om.y, 'O', { kind: 'hi' }) + charge(om.x - 20, om.y + 26, '−', 'fg-hi');
    s += atom(c1.x, c1.y, 'C');
    // protonated DCC, drawn upright: Cy–N=C=N⁺(H)–Cy (the central carbon is sp, so N=C=N is straight)
    const cd = P(270, 136), na = P(270, 82), nb = P(270, 190);
    s += bond(cd, na, { order: 2, rFrom: 16, rTo: 15 }) + bond(cd, nb, { order: 2, rFrom: 16, rTo: 16 });
    s += arm(na, 30, 46, 'Cy').s + lp(na, 150);
    s += arm(nb, 330, 46, 'Cy', { rFrom: 16 }).s + arm(nb, 210, 44, 'H', { r: 12, rFrom: 16 }).s;
    s += atom(na.x, na.y, 'N') + atom(nb.x, nb.y, 'N', { kind: 'warn' }) + charge(nb.x + 22, nb.y - 16, '+');
    s += atom(cd.x, cd.y, 'C', { kind: 'warn' });
    s += curve(lpTip(om, 40, 27), P(cd.x - 19, cd.y + 3), { bow: 16, size: 7 });
    s += fromBond(cd, nb, P(nb.x - 18, nb.y - 7), 12, 7);
    s += tg(100, 250, 'carboxylate');
    s += tg(270, 250, 'protonated DCC');
    s += arrow(P(350, 136), P(412, 136));
    // O-acylisourea
    const c2 = P(470, 136);
    const o2 = at(c2, 90, 56), r2p = at(c2, 210, 56), og2 = at(c2, 330, 56);
    s += bond(c2, o2, { order: 2, rFrom: 16, rTo: 15 }) + atom(o2.x, o2.y, 'O');
    s += bond(c2, r2p, { rFrom: 16, rTo: 15 }) + atom(r2p.x, r2p.y, 'R');
    s += bond(c2, og2, { rFrom: 16, rTo: 16 });
    const ci = at(og2, 30, 56);
    s += bond(og2, ci, { rFrom: 16, rTo: 16, cls: 'fg-bond-hi' });
    const ni = at(ci, 90, 52), nj = at(ci, 330, 56);
    s += bond(ci, ni, { order: 2, rFrom: 16, rTo: 15 }) + arm(ni, 30, 46, 'Cy').s + atom(ni.x, ni.y, 'N');
    s += bond(ci, nj, { rFrom: 16, rTo: 15 }) + arm(nj, 30, 46, 'Cy').s + arm(nj, 270, 42, 'H', { r: 12 }).s + atom(nj.x, nj.y, 'N');
    s += atom(og2.x, og2.y, 'O', { kind: 'warn' }) + atom(ci.x, ci.y, 'C', { kind: 'warn' }) + atom(c2.x, c2.y, 'C');
    s += tg(572, 250, 'O-acylisourea: a good leaving group');

    /* Panel 2 */
    s += panel(16, 282, 728, 246);
    s += tg(380, 304, '2 · THE AMINE ADDS TO THE C=O');
    const c3 = P(200, 420);
    const o3 = at(c3, 90, 56), r3 = at(c3, 210, 56), og3 = at(c3, 330, 56);
    s += bond(c3, o3, { order: 2, rFrom: 16, rTo: 15 }) + lp(o3, 150) + lp(o3, 30) + atom(o3.x, o3.y, 'O');
    s += bond(c3, r3, { rFrom: 16, rTo: 15 }) + atom(r3.x, r3.y, 'R');
    s += bond(c3, og3, { rFrom: 16, rTo: 16 }) + atom(og3.x, og3.y, 'O', { kind: 'warn' });
    s += bond(og3, P(og3.x + 40, og3.y), { rFrom: 16, rTo: 0 }) + lbl(og3.x + 43, og3.y + 4.5, LG, 'start');
    const nA = P(86, 370);
    s += arm(nA, 90, 42, 'H', { r: 12 }).s + arm(nA, 210, 42, 'H', { r: 12 }).s + arm(nA, 150, 46, 'R′').s;
    s += lp(nA, 340) + atom(nA.x, nA.y, 'N', { kind: 'hi' });
    s += atom(c3.x, c3.y, 'C', { kind: 'warn' });
    s += curve(lpTip(nA, 340, 27), P(c3.x - 19, c3.y - 6), { bow: 10, size: 7 });
    s += curve(onBond(c3, o3, 0.5, -8), P(o3.x + 18, o3.y + 5), { bow: -16, size: 7 });
    s += arrow(P(412, 420), P(470, 420));
    s += tetrahedral(P(560, 428));
    s += tg(572, 514, 'tetrahedral intermediate');

    /* Panel 3 */
    s += panel(16, 542, 728, 246);
    s += tg(380, 564, '3 · THE C=O REFORMS AND THE LEAVING GROUP GOES');
    s += tetrahedral(P(150, 688), { arrows: true });
    s += arrow(P(342, 688), P(384, 688));
    const c6 = P(470, 680);
    const o6 = at(c6, 90, 56), r6 = at(c6, 210, 56), n6 = at(c6, 330, 58);
    s += bond(c6, o6, { order: 2, rFrom: 16, rTo: 15 }) + atom(o6.x, o6.y, 'O');
    s += bond(c6, r6, { rFrom: 16, rTo: 15 }) + atom(r6.x, r6.y, 'R');
    s += bond(c6, n6, { rFrom: 16, rTo: 15, cls: 'fg-bond-hi' });
    s += arm(n6, 30, 46, 'R′').s + arm(n6, 270, 40, 'H', { r: 12 }).s + atom(n6.x, n6.y, 'N');
    s += atom(c6.x, c6.y, 'C');
    s += tg(490, 774, 'the amide (after N loses H⁺)');
    s += lbl(592, 638, '+ CyNH–C(=O)–NHCy', 'start');
    s += tg(608, 660, 'dicyclohexylurea', 'start');
    s += tg(608, 678, '(after it gains H⁺)', 'start');
    return s;
  },
  caption: 'Cy is cyclohexyl, C₆H₁₁. Follow the coral atoms from panel to panel. The highlighted bond in panel 1 is the new bond from the acid’s oxygen to DCC. Proton transfers are not drawn.',
});

/* 13. Edman degradation, step by step. */
function ring5(c, R, rot = 90) {
  // vertices counterclockwise from angle rot
  return [0, 1, 2, 3, 4].map((i) => at(c, rot + i * 72, R));
}
FIGURES.push({
  id: 'edman',
  section: 'peptides-proteins',
  anchor: '',
  viewBox: '0 0 760 830',
  alt: 'Three panels. Panel 1, coupling: the lone pair of the N-terminal NH2 of a peptide attacks the central carbon of phenyl isothiocyanate, S=C=N–Ph, while the C=N double bond moves onto nitrogen; after a proton moves, the product is a phenylthiourea, Ph–NH–C(=S)–NH–CH(R1)–C(=O)–NH–peptide. Panel 2, in acid: the thiourea sulfur attacks the carbonyl carbon of the first peptide bond, closing a five-membered ring, while the C=O pi bond moves onto oxygen; then the oxygen lone pair reforms C=O and the C–N bond to the rest of the chain breaks. Panel 3: the ring leaves as an anilinothiazolinone, ATZ, and the peptide, one residue shorter, has a new free NH2. In aqueous acid the ATZ rearranges to the phenylthiohydantoin, PTH, which is identified.',
  build() {
    let s = '';
    /* Panel 1: coupling */
    s += panel(16, 12, 728, 250);
    s += tg(380, 34, '1 · COUPLING (MILDLY BASIC): THE AMINE ADDS TO PhN=C=S');
    const s1 = P(40, 96), ct = P(98, 96), nt = P(156, 96);
    s += bond(s1, ct, { order: 2, rFrom: 15, rTo: 16 }) + bond(ct, nt, { order: 2, rFrom: 16, rTo: 15 });
    s += arm(nt, 30, 46, 'Ph').s + lp(nt, 285, 21);
    s += lp(s1, 90) + lp(s1, 270);
    s += atom(s1.x, s1.y, 'S') + atom(nt.x, nt.y, 'N') + atom(ct.x, ct.y, 'C', { kind: 'warn' });
    const pep = chain(98, 182, 58, [
      { l: 'H₂N', kind: 'hi' },
      { l: 'CH', dy: 26, subs: [{ deg: 270, l: 'R₁', len: 44 }] },
      { l: 'C', subs: [{ deg: 90, l: 'O', len: 50, order: 2 }] },
      { l: 'N', dy: 26, subs: [{ deg: 270, l: 'H', len: 40, r: 12 }] },
    ]);
    s += pep.s;
    s += bond(pep.pts[3], P(pep.pts[3].x + 46, 182), { rFrom: 15, rTo: 0 });
    s += lbl(pep.pts[3].x + 50, 186.5, 'peptide', 'start');
    s += lp(pep.pts[0], 90, 25);
    s += curve(lpTip(pep.pts[0], 90, 31), P(ct.x, ct.y + 19), { bow: -10, size: 7 });
    s += fromBond(ct, nt, P(nt.x - 4, nt.y - 18), -14, 7);
    s += arrow(P(380, 150), P(430, 150));
    s += lbl(446, 146, 'Ph–NH–C(=S)–NH–CH(R₁)–C(=O)–NH–peptide', 'start');
    s += tg(446, 172, 'a phenylthiourea (after one proton moves)', 'start');

    /* Panel 2: cyclization and cleavage */
    s += panel(16, 276, 728, 290);
    s += tg(380, 298, '2 · IN ACID: SULFUR ATTACKS THE FIRST C=O, THEN THE CHAIN LEAVES');
    const drawRing = (c, stage) => {
      // stage 0: thiourea folded (no S–C bond yet); 1: tetrahedral intermediate
      let t = '';
      const [S1, C2, N3, C4, C5] = ring5(c, 50, 90);
      t += bond(S1, C2, { order: 2, rFrom: 16, rTo: 16 });
      t += bond(C2, N3, { rFrom: 16, rTo: 15 }) + bond(N3, C4, { rFrom: 15, rTo: 15 }) + bond(C4, C5, { rFrom: 15, rTo: 16 });
      if (stage === 1) t += bond(S1, C5, { rFrom: 16, rTo: 16, cls: 'fg-bond-hi' });
      t += arm(C2, 162, 58, 'PhNH', { rFrom: 16, r: 21 }).s;
      t += arm(N3, 234, 40, 'H', { r: 12 }).s;
      t += arm(C4, 306, 44, 'R₁').s;
      const o = at(C5, 60, 52);
      const np = at(C5, -24, 54);
      t += bond(C5, o, { order: stage === 0 ? 2 : 1, rFrom: 16, rTo: 16 });
      t += bond(C5, np, { rFrom: 16, rTo: 15 });
      t += arm(np, 30, 40, 'H', { r: 12 }).s;
      t += bond(np, at(np, 290, 40), { rFrom: 15, rTo: 0 });
      t += lbl(at(np, 290, 40).x + 4, at(np, 290, 40).y + 16, 'peptide', 'start');
      if (stage === 0) {
        t += lp(S1, 30, 21) + lp(S1, 150, 21) + lp(o, 150) + lp(o, 0);
        t += atom(o.x, o.y, 'O');
        t += atom(S1.x, S1.y, 'S', { kind: 'hi' });
        t += curve(lpTip(S1, 30, 27), P(C5.x - 6, C5.y - 18), { bow: -12, size: 7 });
        t += curve(onBond(C5, o, 0.5, -8), P(o.x + 18, o.y + 6), { bow: -12, size: 7 });
      } else {
        t += lp(S1, 90, 21) + lp(o, 160) + lp(o, 80) + lp(o, 0);
        t += atom(o.x, o.y, 'O', { kind: 'hi' }) + charge(at(o, 215, 28).x, at(o, 215, 28).y + 5, '−', 'fg-hi');
        t += atom(S1.x, S1.y, 'S', { kind: 'warn' }) + charge(S1.x - 26, S1.y - 4, '+');
        t += curve(lpTip(o, 0, 27), onBond(C5, o, 0.5, -8), { bow: -14, size: 7 });
        t += fromBond(C5, np, P(np.x - 12, np.y + 16), 14, -7);
      }
      t += atom(np.x, np.y, 'N', { kind: stage === 1 ? 'warn' : undefined });
      t += atom(N3.x, N3.y, 'N') + atom(C4.x, C4.y, 'CH') + atom(C2.x, C2.y, 'C') + atom(C5.x, C5.y, 'C', { kind: 'warn' });
      return t;
    };
    s += drawRing(P(190, 420), 0);
    s += arrow(P(352, 420), P(398, 420));
    s += drawRing(P(556, 420), 1);
    s += tg(190, 550, 'the thiourea, folded');
    s += tg(556, 550, 'ring closed; now the C=O reforms');

    /* Panel 3: products and the conversion to PTH */
    s += panel(16, 580, 728, 238);
    s += tg(380, 602, '3 · THE FIRST RESIDUE LEAVES AS AN ATZ, WHICH BECOMES THE PTH');
    {
      const [S1, C2, N3, C4, C5] = ring5(P(170, 700), 46, 90);
      let t = '';
      t += bond(S1, C2, { rFrom: 16, rTo: 16 }) + bond(C2, N3, { order: 2, rFrom: 16, rTo: 15 }) + bond(N3, C4, { rFrom: 15, rTo: 15 });
      t += bond(C4, C5, { rFrom: 15, rTo: 16 }) + bond(C5, S1, { rFrom: 16, rTo: 16 });
      t += arm(C2, 162, 58, 'PhNH', { rFrom: 16, r: 21 }).s;
      t += arm(C4, 306, 42, 'R₁').s;
      t += arm(C5, 18, 44, 'O', { order: 2, rFrom: 16 }).s;
      t += atom(S1.x, S1.y, 'S') + atom(N3.x, N3.y, 'N') + atom(C4.x, C4.y, 'CH') + atom(C2.x, C2.y, 'C') + atom(C5.x, C5.y, 'C');
      s += t;
      s += tg(170, 802, 'ATZ (anilinothiazolinone)');
    }
    s += lbl(300, 660, '+ H₂N–peptide', 'start');
    s += tg(300, 682, 'one residue shorter', 'start');
    s += arrow(P(456, 716), P(516, 716));
    s += tg(486, 738, 'aqueous acid');
    {
      const [C4, C5, N1, C2, N3] = ring5(P(630, 706), 44, 90);
      let t = '';
      t += bond(C4, C5, { rFrom: 16, rTo: 15 }) + bond(C5, N1, { rFrom: 15, rTo: 15 }) + bond(N1, C2, { rFrom: 15, rTo: 16 });
      t += bond(C2, N3, { rFrom: 16, rTo: 15 }) + bond(N3, C4, { rFrom: 15, rTo: 16 });
      t += arm(C4, 90, 42, 'O', { order: 2, rFrom: 16 }).s;
      t += arm(C5, 162, 42, 'R₁').s;
      t += arm(N1, 234, 38, 'H', { r: 12 }).s;
      t += arm(C2, 306, 42, 'S', { order: 2, rFrom: 16 }).s;
      t += arm(N3, 18, 44, 'Ph').s;
      t += atom(C4.x, C4.y, 'C') + atom(C5.x, C5.y, 'CH') + atom(N1.x, N1.y, 'N') + atom(C2.x, C2.y, 'C') + atom(N3.x, N3.y, 'N');
      s += t;
      s += tg(620, 802, 'PTH (phenylthiohydantoin)', 'middle', 'fg-tag-good');
    }
    return s;
  },
  caption: 'Ph is phenyl, C₆H₅. Follow the coral carbon in each panel: first the carbon of PhN=C=S, then the carbonyl carbon that sulfur attacks. Proton transfers are not drawn.',
});

/* 14. Trypsin and chymotrypsin fragments, and how they overlap. */
FIGURES.push({
  id: 'fragments',
  section: 'peptides-proteins',
  anchor: '',
  viewBox: '0 0 760 260',
  alt: 'The hexapeptide Gly-Lys-Ala-Phe-Arg-Ser as six boxes. Trypsin row: cuts after Lys and after Arg give Gly-Lys, Ala-Phe-Arg and Ser. Chymotrypsin row: a cut after Phe gives Gly-Lys-Ala-Phe and Arg-Ser. The fragment Ala-Phe-Arg overlaps both chymotrypsin fragments, which fixes the order.',
  build() {
    let s = '';
    const names = ['Gly', 'Lys', 'Ala', 'Phe', 'Arg', 'Ser'];
    const w = 58, x0 = 220;
    const row = (y, cuts, kindOf) => {
      let t = '', x = x0;
      names.forEach((n, i) => {
        t += block(x, y, w - 4, n, kindOf(i));
        x += w;
        if (cuts.includes(i)) {
          t += `<line class="fg-dash-hi" x1="${x + 6}" y1="${y - 22}" x2="${x + 6}" y2="${y + 22}"></line>`;
          x += 16;
        }
      });
      return t;
    };
    s += lbl(200, 54.5, 'the peptide', 'end');
    s += row(50, [], () => 'hi');
    s += lbl(200, 124.5, 'trypsin', 'end');
    s += tg(200, 142, 'cuts after Lys, Arg', 'end', 'fg-tag-mut');
    s += row(120, [1, 4], (i) => (i >= 2 && i <= 4 ? 'good' : undefined));
    s += lbl(200, 204.5, 'chymotrypsin', 'end');
    s += tg(200, 222, 'cuts after Phe, Tyr, Trp', 'end', 'fg-tag-mut');
    s += row(200, [3], (i) => (i >= 2 && i <= 4 ? 'good' : undefined));
    s += tg(420, 250, 'Ala-Phe-Arg spans the chymotrypsin cut', 'start', 'fg-tag-good');
    return s;
  },
  caption: 'Each dashed line is a cut. The green residues are the trypsin fragment Ala-Phe-Arg, marked in both rows.',
});

export default FIGURES;
