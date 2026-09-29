/* Figures for the markovnikov notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions, kept the same as the carbocations and radical-halogenation
   pages:
   - a curved arrow starts on electrons (a lone pair, a bond, or a radical's
     single electron) and ends where they go;
   - every arrow in a radical step is a fishhook with ONE barb, because it
     moves one electron, and a radical's unpaired electron is one larger dot;
   - chapter 9, so rings are skeletal; every atom a curved arrow touches, and
     every group the text names, is written out with its label;
   - lesson copies (id prefix l-) are 340 wide or less, stacked, and use
     only fg-lbl and fg-tag text. */
import { atom as atom0, bond, wedge, hash, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { polyPts, polyRing, benzene } from '../lib/ochem-skeletal.mjs';
import { skDouble } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);

/* An atom disc that stays opaque in both themes. */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
const rOf = (l) => (l.length >= 3 ? 18 : l === 'H' ? 12 : l.length === 2 ? 16 : 15);
const A = (p, l, kind) => atom(p.x, p.y, l, { r: rOf(l), kind });
const B = (a, la, b, lb, o = {}) => bond(a, b, { rFrom: la ? rOf(la) : 0, rTo: lb ? rOf(lb) : 0, order: o.order || 1, cls: o.cls, gap: o.gap });
const chg = (x, y, s = '+') => text(x, y + 5, s, { cls: 'fg-warn', size: 16 });
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const sm = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-sm', size: 10.5, anchor });
const tg = (x, y, s, anchor = 'middle', cls = 'fg-tag') => text(x, y, s, { cls, size: 11, anchor });
const skb = (a, b) => bond(a, b, { rFrom: 0, rTo: 0 });
/* A label whose first word is an italic stereo prefix (cis, trans). */
const ital = (x, y, pre, rest, cls = 'fg-tag') =>
  `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="middle" font-size="11"><tspan font-style="italic">${pre}</tspan>${rest}</text>`;
/* The single dot that makes a species a radical. */
const dot = (p) => `<circle class="fg-lp" cx="${r2(p.x)}" cy="${r2(p.y)}" r="3.4"></circle>`;
/* A halogen with lone pairs at the given screen angles (0 east, 90 south). */
function hal(p, sym, lps) {
  let g = '';
  for (const a of lps) g += lonePair(p.x, p.y, a, { dist: 24 });
  return g + atom(p.x, p.y, sym, { kind: 'warn' });
}
/* A curved arrow that starts on the middle of bond a–b, pushed `off` px to
   the left of the direction a→b (negative: right), and ends at e. */
function fromBond(a, b, e, bow, off = 5) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  return curve(P(m.x + (dy / L) * off, m.y - (dx / L) * off), e, { bow, size: 7 });
}
/* A fishhook: one barb, because it carries one electron. `curve` in the kit
   draws a full two-barbed head, which in a radical mechanism says the wrong
   thing about how many electrons moved. */
function fishhook(a, b, opts = {}) {
  const f = (v) => (Math.round(v * 100) / 100);
  const bow = opts.bow ?? 30;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;
  let ux = b.x - cx, uy = b.y - cy;
  const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const size = opts.size ?? 9;
  const px = -uy, py = ux;
  const side = opts.side ?? 1;
  const bx = b.x - ux * size, by = b.y - uy * size;
  const h = size * 0.6 * side;
  return `<path class="fg-arrow" d="M${f(a.x)} ${f(a.y)} Q${f(cx)} ${f(cy)} ${f(bx)} ${f(by)}"></path>` +
         `<path class="fg-head" d="M${f(b.x)} ${f(b.y)} L${f(bx + px * h)} ${f(by + py * h)} L${f(bx)} ${f(by)} Z"></path>`;
}
/* A dashed partial bond (forming or breaking in a transition state). */
const partial = (a, la, b, lb) => bond(a, b, { rFrom: la ? rOf(la) : 0, rTo: lb ? rOf(lb) : 0, cls: 'fg-dash-hi' });

/* ======================================================================
   1. Propene + HBr: the proton can go to either end, and the two ends
      leave two different cations.
   ====================================================================== */
/* Propene with H–Br above it and the two arrows of the first step.
   c1 is the CH2 end; returns the ink. */
function propeneHBr(c1) {
  let s = '';
  const c2 = P(c1.x + 70, c1.y);
  const c3 = at(c2, -30, 60);
  s += B(c1, 'H₂C', c2, 'CH', { order: 2 });
  s += B(c2, 'CH', c3, 'CH₃');
  s += A(c1, 'H₂C') + A(c2, 'CH') + A(c3, 'CH₃');
  const h = P(c1.x + 35, c1.y - 82);
  const br = P(h.x + 66, h.y);
  s += bond(h, br, { rFrom: 12, rTo: 16 });
  s += hal(br, 'Br', [-90, 0, 90]);
  s += atom(h.x, h.y, 'H', { r: 12, kind: 'hi' });
  // the pi bond reaches for the proton; the H–Br pair leaves with bromine
  s += curve(P(h.x, c1.y - 8), P(h.x, h.y + 15), { bow: -16, size: 7 });
  s += fromBond(h, br, P(br.x - 12, br.y - 13), -14, 6);
  return { s, c2, c3 };
}
/* A three-carbon chain written out in labelled groups, left to right. */
function chain3(x, y, labels, kinds = [], dx = 65) {
  let s = '';
  const p = labels.map((_, i) => P(x + i * dx, y));
  for (let i = 0; i < 2; i++) s += B(p[i], labels[i], p[i + 1], labels[i + 1]);
  labels.forEach((l, i) => { s += A(p[i], l, kinds[i]); });
  return { s, p };
}

FIGURES.push({
  id: 'propene-two-cations',
  section: 'markovnikov',
  anchor: '',
  alt: 'Propene and H–Br, with curved arrows from the pi bond to the hydrogen and from the H–Br bond to bromine. Top route: the hydrogen adds to C1, the CH2 end, leaving a secondary cation on C2 with two alkyl groups beside it; bromide then bonds there to give 2-bromopropane, the product. Bottom route: the hydrogen adds to C2, leaving a primary cation on C1 with one alkyl group; this route would give 1-bromopropane, and hardly any forms.',
  viewBox: '0 0 760 350',
  build() {
    let s = '';
    s += tg(110, 50, 'PROPENE + HBr');
    const k = propeneHBr(P(50, 200));
    s += k.s;
    s += tg(50, 236, 'C1') + tg(120, 236, 'C2');

    // the fork
    s += arrow(P(204, 178), P(282, 112));
    s += tg(250, 164, 'H to C1', 'start');
    s += arrow(P(204, 222), P(282, 280), { muted: true });
    s += tg(250, 232, 'H to C2', 'start', 'fg-tag-mut');

    // top: the secondary cation, then 2-bromopropane
    let c = chain3(320, 100, ['H₃C', 'CH', 'CH₃'], ['hi', 'warn']);
    s += c.s + chg(c.p[1].x + 16, c.p[1].y - 24);
    s += tg(385, 146, '2° cation: more stable', 'middle', 'fg-tag-good');
    s += arrow(P(480, 100), P(540, 100));
    s += sm(510, 90, 'Br⁻');
    c = chain3(575, 100, ['H₃C', 'CH', 'CH₃']);
    s += c.s;
    const br1 = P(640, 46);
    s += bond(c.p[1], br1, { rFrom: 16, rTo: 16 }) + hal(br1, 'Br', [180, -90, 0]);
    s += tg(640, 146, '2-bromopropane: the product', 'middle', 'fg-tag-good');

    // bottom: the primary cation, then 1-bromopropane (barely formed)
    c = chain3(320, 290, ['H₂C', 'CH₂', 'CH₃'], ['warn', 'hi']);
    s += c.s + chg(c.p[0].x - 4, c.p[0].y - 30);
    s += tg(385, 336, '1° cation: less stable', 'middle', 'fg-tag-warn');
    s += arrow(P(480, 290), P(540, 290), { muted: true });
    s += sm(510, 280, 'Br⁻');
    c = chain3(575, 290, ['H₂C', 'CH₂', 'CH₃']);
    s += c.s;
    const br2 = P(575, 236);
    s += bond(c.p[0], br2, { rFrom: 16, rTo: 16 }) + hal(br2, 'Br', [180, -90, 0]);
    s += tg(640, 336, '1-bromopropane: hardly any', 'middle', 'fg-tag-mut');
    return s;
  },
  caption: 'The proton can land on either end of the double bond. The highlighted group is the carbon that took it, and the other carbon is left with the positive charge.',
});

FIGURES.push({
  id: 'l-propene-two-cations',
  lessons: ['markovnikov'],
  anchor: '',
  alt: 'Top: propene and H–Br, with curved arrows from the pi bond to the hydrogen and from the H–Br bond to bromine. Middle: if the hydrogen adds to C1, the positive charge sits on C2, a secondary cation, which is more stable. Bottom: if the hydrogen adds to C2, the charge sits on C1, a primary cation, which is less stable.',
  viewBox: '0 0 340 454',
  build() {
    let s = '';
    s += tg(170, 20, 'PROPENE + HBr');
    const k = propeneHBr(P(90, 150));
    s += k.s;
    s += tg(90, 186, 'C1') + tg(160, 186, 'C2');
    s += rule(20, 208, 320, 208);
    s += tg(170, 234, 'H TO C1');
    let c = chain3(105, 278, ['H₃C', 'CH', 'CH₃'], ['hi', 'warn']);
    s += c.s + chg(c.p[1].x + 16, c.p[1].y - 24);
    s += tg(170, 320, '2° CATION: MORE STABLE', 'middle', 'fg-tag-good');
    s += rule(20, 338, 320, 338);
    s += tg(170, 364, 'H TO C2', 'middle', 'fg-tag-mut');
    c = chain3(105, 406, ['H₂C', 'CH₂', 'CH₃'], ['warn', 'hi']);
    s += c.s + chg(c.p[0].x - 4, c.p[0].y - 30);
    s += tg(170, 446, '1° CATION: LESS STABLE', 'middle', 'fg-tag-warn');
    return s;
  },
  caption: 'The highlighted group took the proton. The positive charge sits on the other alkene carbon.',
});

/* ======================================================================
   2. Resonance beats alkyl groups: styrene, and 1-phenylpropene, where
      "more hydrogens" has nothing to say.
   ====================================================================== */
/* The benzylic cation as one Kekulé structure with a δ+ on each carbon
   that shares the charge (the outside carbon, both ortho carbons and the
   para carbon). The ring-circle notation is taught later, in Aromatic
   Chemistry, so it is not used here. */
const par = (a, b, off) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const px = (-dy / L) * off, py = (dx / L) * off;
  return bond(P(a.x + px, a.y + py), P(b.x + px, b.y + py), { rFrom: 8, rTo: 8, cls: 'fg-dash-hi' });
};
function benzylCation(ctr, r = 32) {
  let s = '';
  const bz = benzene(ctr.x, ctr.y, r);          // pts: 0 top, 1 upper-left, 2 lower-left, 3 bottom, 4 lower-right, 5 upper-right
  const R = bz.pts;
  s += bz.svg;
  const exo = at(R[5], 30, 36);
  s += skb(R[5], exo);
  const d = (p, dx, dy, anchor = 'middle') => text(p.x + dx, p.y + dy, 'δ+', { cls: 'fg-warn', size: 13, anchor });
  s += d(exo, 10, 16, 'start');
  s += d(R[0], 0, -9);
  s += d(R[4], 8, 20);
  s += d(R[2], -9, 4, 'end');
  return { s, R, exo };
}

FIGURES.push({
  id: 'benzylic-cation-wins',
  section: 'markovnikov',
  anchor: '',
  alt: 'Left: styrene, a benzene ring carrying CH=CH2, takes a proton on its CH2 end. The cation formed is benzylic: the outside carbon, which now carries a methyl group, shares its positive charge with three ring carbons, drawn as partial charges on each. Right: 1-phenylpropene, a benzene ring carrying CH=CH–CH3, with one hydrogen on each alkene carbon. Protonating the far carbon gives a benzylic cation, which wins; protonating the near carbon gives an ordinary secondary cation with no ring beside it.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    // ---- left: styrene
    s += tg(185, 30, 'STYRENE + HBr');
    const bz = benzene(70, 150, 32);
    s += bz.svg;
    const ca = at(bz.pts[5], 30, 34), cb = at(ca, -30, 34);
    s += skDouble(ca, cb, P(ca.x, ca.y + 30));
    s += skb(bz.pts[5], ca);
    s += arrow(P(172, 150), P(222, 150));
    s += sm(197, 140, 'H⁺');
    const cat = benzylCation(P(274, 168));
    s += cat.s;
    const me = P(cat.exo.x, cat.exo.y - 46);
    s += bond(cat.exo, me, { rFrom: 0, rTo: 18 }) + A(me, 'CH₃', 'hi');
    s += tg(185, 262, 'benzylic cation: four carbons share the +', 'middle', 'fg-tag-good');
    s += sm(185, 284, 'Br bonds to the carbon next to the ring');
    s += rule(380, 40, 380, 290);

    // ---- right: 1-phenylpropene
    s += tg(575, 30, '1-PHENYLPROPENE + HBr');
    const bz2 = benzene(500, 108, 24);
    s += bz2.svg;
    const pa = at(bz2.pts[5], 30, 32), pb = at(pa, -30, 32), pc = at(pb, 30, 32);
    s += skb(bz2.pts[5], pa) + skDouble(pa, pb, P(pa.x, pa.y + 30)) + skb(pb, pc);
    const ha = at(pa, 90, 34), hb = at(pb, -90, 34);
    s += bond(pa, ha, { rFrom: 0, rTo: 12 }) + atom(ha.x, ha.y, 'H', { r: 12 });
    s += bond(pb, hb, { rFrom: 0, rTo: 12 }) + atom(hb.x, hb.y, 'H', { r: 12 });
    s += sm(pc.x + 8, pc.y - 4, 'CH₃', 'start');
    s += tg(pa.x - 12, pa.y - 6, 'C1', 'end') + tg(pb.x + 14, pb.y + 22, 'C2', 'start');
    s += sm(700, 104, 'one H on each', 'middle');
    s += sm(700, 120, 'alkene carbon', 'middle');

    s += arrow(P(520, 158), P(484, 184));
    s += tg(494, 160, 'H⁺ to C2', 'end');
    s += arrow(P(604, 158), P(640, 184), { muted: true });
    s += tg(632, 160, 'H⁺ to C1', 'start', 'fg-tag-mut');

    // benzylic cation (wins): ring, C+, then CH2–CH3
    const bz3 = benzene(430, 236, 22);
    s += bz3.svg;
    const q1 = at(bz3.pts[5], 30, 30), q2 = at(q1, -30, 30), q3 = at(q2, 30, 30);
    s += skb(bz3.pts[5], q1) + skb(q1, q2) + skb(q2, q3);
    s += chg(q1.x, q1.y - 16);
    s += tg(468, 290, 'benzylic cation: wins', 'middle', 'fg-tag-good');

    // ordinary secondary cation (loses): ring, CH2, C+, CH3
    const bz4 = benzene(606, 236, 22);
    s += bz4.svg;
    const w1 = at(bz4.pts[5], 30, 30), w2 = at(w1, -30, 30), w3 = at(w2, 30, 30);
    s += skb(bz4.pts[5], w1) + skb(w1, w2) + skb(w2, w3);
    s += chg(w2.x, w2.y + 16);
    s += tg(650, 290, '2° cation, no ring beside it', 'middle', 'fg-tag-mut');
    return s;
  },
  caption: 'The highlighted CH₃ is the carbon that took the proton, and &delta;+ marks the carbons that share the charge. Right: each alkene carbon has one H, but only one choice gives a benzylic cation.',
});

/* ======================================================================
   3. One alkene, two alcohols: acid-catalyzed hydration against
      hydroboration–oxidation. Replaces a 1046-wide hand-written SVG.
   ====================================================================== */
function propeneSk(c3) {
  const c2 = at(c3, 30, 36), c1 = at(c2, -30, 36);
  return { c1, c2, c3 };
}
FIGURES.push({
  id: 'propene-two-hydrations',
  section: 'markovnikov',
  anchor: '',
  alt: 'Propene in the middle. Left arrow, H3O+: propan-2-ol, with OH on the middle carbon, the more substituted one; labeled Markovnikov, through a carbocation. Right arrow, first BH3 then H2O2 and NaOH: propan-1-ol, with OH on the end carbon, the less substituted one; labeled anti-Markovnikov, no carbocation.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += tg(380, 30, 'ONE ALKENE, TWO ALCOHOLS');
    // propene in the middle
    const m = propeneSk(P(350, 140));
    s += skb(m.c3, m.c2) + skDouble(m.c2, m.c1, P(m.c2.x, m.c2.y + 40));
    s += tg(m.c1.x + 12, m.c1.y + 4, '1', 'start') + tg(m.c2.x, m.c2.y - 10, '2') + tg(m.c3.x - 12, m.c3.y + 4, '3', 'end');
    s += tg(380, 186, 'propene');

    // left: H3O+
    s += arrow(P(310, 128), P(222, 128));
    s += sm(266, 118, 'H₃O⁺');
    const l = propeneSk(P(100, 150));
    s += skb(l.c3, l.c2) + skb(l.c2, l.c1);
    const oh1 = at(l.c2, 90, 44);
    s += bond(l.c2, oh1, { rFrom: 0, rTo: 16 }) + A(oh1, 'OH', 'hi');
    s += tg(118, 196, 'propan-2-ol');
    s += sm(118, 216, 'OH on the more substituted carbon');
    s += tg(118, 238, 'MARKOVNIKOV · through a cation', 'middle', 'fg-tag-good');

    // right: hydroboration–oxidation
    s += arrow(P(452, 128), P(540, 128));
    s += sm(496, 110, '1. BH₃');
    s += sm(496, 148, '2. H₂O₂, NaOH');
    const r = propeneSk(P(588, 150));
    s += skb(r.c3, r.c2) + skb(r.c2, r.c1);
    const oh2 = at(r.c1, 30, 44);
    s += bond(r.c1, oh2, { rFrom: 0, rTo: 16 }) + A(oh2, 'OH', 'hi');
    s += tg(636, 196, 'propan-1-ol');
    s += sm(636, 216, 'OH on the less substituted carbon');
    s += tg(636, 238, 'ANTI-MARKOVNIKOV · no cation', 'middle', 'fg-tag-good');
    return s;
  },
  caption: 'Follow the OH: on the middle carbon at the left, on the end carbon at the right.',
});

/* ======================================================================
   4. Hydroboration: the arrows, the four-center transition state, and the
      alkylborane it gives.
   ====================================================================== */
/* One square of four atoms: C2 (the CH carrying CH3) bottom left, C1 (the
   CH2) bottom right, H top left, B top right. `mode` is 'start', 'ts' or
   'end'. */
function hbSquare(o, mode) {
  let s = '';
  const c2 = P(o.x, o.y), c1 = P(o.x + 84, o.y), h = P(o.x, o.y - 88), b = P(o.x + 84, o.y - 88);
  const me = at(c2, 225, 52);
  s += B(c2, 'CH', me, 'CH₃') + A(me, 'CH₃');
  if (mode === 'start') {
    s += B(c2, 'CH', c1, 'CH₂', { order: 2 });
    s += bond(h, b, { rFrom: 12, rTo: 18 });
    // the pi bond donates into boron's empty orbital; the B–H pair moves to C2
    s += curve(P(o.x + 50, o.y - 8), P(b.x - 4, b.y + 20), { bow: 18, size: 7 });
    s += fromBond(h, b, P(c2.x + 6, c2.y - 18), 20, -6);
  } else if (mode === 'ts') {
    s += B(c2, 'CH', c1, 'CH₂');
    s += par(c2, c1, 7);
    s += partial(h, 'H', b, 'BH₂');
    s += partial(h, 'H', c2, 'CH');
    s += partial(b, 'BH₂', c1, 'CH₂');
    s += text(c2.x - 22, c2.y - 14, 'δ+', { cls: 'fg-warn', size: 13, anchor: 'end' });
    s += text(b.x + 24, b.y - 12, 'δ−', { cls: 'fg-lbl', size: 13, anchor: 'start' });
  } else {
    s += B(c2, 'CH', c1, 'CH₂');
    s += B(h, 'H', c2, 'CH');
    s += B(b, 'BH₂', c1, 'CH₂');
  }
  s += A(c2, 'CH', mode === 'ts' ? 'warn' : undefined) + A(c1, 'CH₂') + atom(h.x, h.y, 'H', { r: 12, kind: 'hi' }) + A(b, 'BH₂', 'hi');
  return s;
}
const bracket = (x1, x2, y1, y2) => {
  const l = `<path class="fg-bond" d="M${x1 + 8} ${y1} L${x1} ${y1} L${x1} ${y2} L${x1 + 8} ${y2}" fill="none"></path>`;
  const r = `<path class="fg-bond" d="M${x2 - 8} ${y1} L${x2} ${y1} L${x2} ${y2} L${x2 - 8} ${y2}" fill="none"></path>`;
  return l + r + text(x2 + 4, y1 + 10, '‡', { cls: 'fg-lbl', size: 15, anchor: 'start' });
};

FIGURES.push({
  id: 'hydroboration-ts',
  section: 'markovnikov',
  anchor: '',
  alt: 'Three stages of hydroboration of propene. Left: the C=C of propene sits under H–BH2, with boron above the CH2 end; one curved arrow runs from the pi bond to boron, another from the B–H bond to the CH carbon. Middle, in brackets: the four-center transition state, with dashed partial bonds from boron to CH2, from hydrogen to CH, and between H and B, a partial double bond between the carbons, a partial positive charge on the CH carbon and a partial negative charge on boron. Right: the alkylborane, with BH2 bonded to the CH2 end and the new hydrogen on the CH carbon, both on the same side.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tg(110, 30, 'THE ARROWS');
    s += hbSquare(P(70, 190), 'start');
    s += arrow(P(205, 146), P(250, 146));
    s += tg(380, 30, 'FOUR-CENTER TRANSITION STATE');
    s += bracket(290, 470, 72, 236);
    s += hbSquare(P(338, 190), 'ts');
    s += arrow(P(504, 146), P(549, 146));
    s += tg(650, 30, 'AN ALKYLBORANE');
    s += hbSquare(P(608, 190), 'end');
    s += rule(30, 256, 730, 256);
    s += lbl(380, 284, 'B and H arrive together, from the same side of the alkene: syn addition.');
    return s;
  },
  caption: 'Dashed lines are bonds partly made or partly broken.',
});

FIGURES.push({
  id: 'l-hydroboration-ts',
  lessons: ['markovnikov'],
  anchor: '',
  alt: 'Hydroboration of propene in three stacked panels. Top: curved arrows from the pi bond to boron and from the B–H bond to the CH carbon. Middle: the four-center transition state in brackets, with dashed partial bonds, a partial positive charge on the CH carbon and a partial negative charge on boron. Bottom: the alkylborane, BH2 on the CH2 end and the new H on the CH carbon, on the same side.',
  viewBox: '0 0 340 648',
  build() {
    let s = '';
    s += tg(170, 20, 'THE ARROWS');
    s += hbSquare(P(128, 150), 'start');
    s += arrow(P(170, 180), P(170, 208), { muted: true });
    s += tg(170, 232, 'FOUR-CENTER TRANSITION STATE');
    s += bracket(66, 270, 256, 412);
    s += hbSquare(P(128, 370), 'ts');
    s += arrow(P(170, 420), P(170, 446), { muted: true });
    s += tg(170, 470, 'AN ALKYLBORANE: B AND H ON ONE SIDE');
    s += hbSquare(P(128, 590), 'end');
    return s;
  },
  caption: 'Dashed lines are bonds partly made or partly broken. The δ+ sits on the more substituted carbon.',
});

/* ======================================================================
   5. 1-Methylcyclohexene, two hydrations: regiochemistry and, on the
      right, what syn addition does to a ring.
   ====================================================================== */
function mchRing(ctr, r = 38) {
  const R = polyPts(ctr.x, ctr.y, 6, r, 90);   // 0 top, 5 upper-right
  return { R, s: polyRing(R, 'fg-bond') };
}
FIGURES.push({
  id: 'hydroboration-syn-ring',
  section: 'markovnikov',
  anchor: '',
  alt: '1-Methylcyclohexene in the middle, with its double bond between C1, which carries the methyl, and C2. Left, with H3O+: 1-methylcyclohexan-1-ol, OH and methyl on the same ring carbon. Right, with BH3 then H2O2 and NaOH: trans-2-methylcyclohexan-1-ol. The new hydrogen on the old C1 and the new OH on the old C2 are both drawn on wedges, so the methyl on C1 is on a hashed bond, on the opposite face from the OH.',
  viewBox: '0 0 760 266',
  build() {
    let s = '';
    // middle: the alkene
    const m = mchRing(P(380, 150));
    s += m.s + skDouble(m.R[0], m.R[5], P(380, 150));
    const me = at(m.R[0], 90, 42);
    s += bond(m.R[0], me, { rFrom: 0, rTo: 18 }) + A(me, 'CH₃');
    s += tg(m.R[0].x - 12, m.R[0].y + 2, '1', 'end') + tg(m.R[5].x + 10, m.R[5].y + 2, '2', 'start');
    s += tg(380, 222, '1-methylcyclohexene');

    // left: acid-catalyzed hydration
    s += arrow(P(330, 150), P(258, 150));
    s += sm(294, 140, 'H₃O⁺');
    const l = mchRing(P(160, 160));
    s += l.s;
    const lme = at(l.R[0], 135, 42), loh = at(l.R[0], 45, 42);
    s += bond(l.R[0], lme, { rFrom: 0, rTo: 18 }) + A(lme, 'CH₃');
    s += bond(l.R[0], loh, { rFrom: 0, rTo: 16 }) + A(loh, 'OH', 'hi');
    s += tg(160, 232, '1-methylcyclohexan-1-ol');
    s += sm(160, 252, 'OH on the more substituted carbon');

    // right: hydroboration–oxidation
    s += arrow(P(432, 150), P(512, 150));
    s += sm(472, 132, '1. BH₃');
    s += sm(472, 170, '2. H₂O₂, NaOH');
    const r = mchRing(P(600, 160));
    s += r.s;
    const nh = at(r.R[0], 145, 38), rme = at(r.R[0], 60, 42), noh = at(r.R[5], 10, 42);
    s += wedge(r.R[0], nh, { rFrom: 0, rTo: 12, width: 9 }) + atom(nh.x, nh.y, 'H', { r: 12, kind: 'hi' });
    s += hash(r.R[0], rme, { rFrom: 0, rTo: 18, width: 11, rungs: 5 }) + A(rme, 'CH₃');
    s += wedge(r.R[5], noh, { rFrom: 0, rTo: 16, width: 9 }) + A(noh, 'OH', 'hi');
    s += tg(r.R[5].x - 12, r.R[5].y + 14, '1', 'end') + tg(r.R[0].x, r.R[0].y + 22, '2');
    s += ital(610, 232, 'trans', '-2-methylcyclohexan-1-ol');
    s += sm(610, 252, 'new H and new OH both on wedges');
    return s;
  },
  caption: 'Left, the Markovnikov alcohol. Right, the anti-Markovnikov alcohol, where the highlighted H and OH are the two groups added.',
});

FIGURES.push({
  id: 'l-methylcyclohexene',
  lessons: ['markovnikov'],
  anchor: '',
  alt: '1-Methylcyclohexene: a six-membered ring with a double bond between C1, which carries a methyl group, and C2, which carries only a hydrogen.',
  viewBox: '0 0 340 190',
  build() {
    let s = '';
    const m = mchRing(P(170, 118), 40);
    s += m.s + skDouble(m.R[0], m.R[5], P(170, 118));
    const me = at(m.R[0], 90, 40);
    s += bond(m.R[0], me, { rFrom: 0, rTo: 18 }) + A(me, 'CH₃');
    s += tg(m.R[0].x - 12, m.R[0].y + 4, 'C1', 'end') + tg(m.R[5].x + 10, m.R[5].y + 2, 'C2', 'start');
    s += tg(170, 184, '1-METHYLCYCLOHEXENE');
    return s;
  },
  caption: 'C1 carries the methyl group. C2 carries only a hydrogen.',
});

FIGURES.push({
  id: 'l-methylpropene',
  lessons: ['markovnikov'],
  anchor: '',
  alt: '2-Methylpropene: C1, a CH2 group, double-bonded to C2, which carries two methyl groups.',
  viewBox: '0 0 340 150',
  build() {
    let s = '';
    const c1 = P(120, 74), c2 = P(196, 74);
    const m1 = at(c2, 35, 54), m2 = at(c2, -35, 54);
    s += B(c1, 'H₂C', c2, 'C', { order: 2 });
    s += B(c2, 'C', m1, 'CH₃') + B(c2, 'C', m2, 'CH₃');
    s += A(c1, 'H₂C') + A(c2, 'C') + A(m1, 'CH₃') + A(m2, 'CH₃');
    s += tg(c1.x, 112, 'C1') + tg(c2.x, 112, 'C2');
    s += tg(170, 142, '2-METHYLPROPENE');
    return s;
  },
  caption: 'C1 is the CH₂ end. C2 carries the two methyl groups.',
});

/* ======================================================================
   6. Radical HBr addition: the two propagation steps with every electron
      shown.
   ====================================================================== */
/* Br· with three lone pairs and its unpaired electron at screen angle `d`. */
function brRad(p, d, lps) {
  const r = rad(d);
  return hal(p, 'Br', lps) + dot(P(p.x + Math.cos(r) * 24, p.y + Math.sin(r) * 24));
}
/* Propagation 1: Br· + propene -> Br–CH2–ĊH–CH3. Reactants at (x, y). */
function prop1Reactants(x, y) {
  let s = '';
  const br = P(x, y), c1 = P(x + 104, y), c2 = P(x + 174, y), c3 = at(c2, -30, 58);
  s += brRad(br, 0, [180, -90, 90]);
  s += B(c1, 'H₂C', c2, 'CH', { order: 2 }) + B(c2, 'CH', c3, 'CH₃');
  s += A(c1, 'H₂C') + A(c2, 'CH') + A(c3, 'CH₃');
  // Br's electron and one pi electron meet between Br and C1; the other pi
  // electron moves onto C2
  s += fishhook(P(br.x + 26, br.y - 4), P(br.x + 50, br.y - 12), { bow: -8 });
  s += fishhook(P(c1.x + 32, c1.y - 6), P(br.x + 58, br.y - 12), { bow: 22 });
  s += fishhook(P(c1.x + 38, c1.y + 6), P(c2.x - 8, c2.y + 16), { bow: 10 });
  return s;
}
/* Br–CH2–ĊH–CH3, with the radical dot on the CH at screen angle `d`. */
function bromoRadical(x, y, d, meDeg = -30) {
  let s = '';
  const br = P(x, y), c1 = P(x + 66, y), c2 = P(x + 132, y), c3 = at(c2, meDeg, 56);
  s += bond(br, c1, { rFrom: 16, rTo: 16 }) + B(c1, 'CH₂', c2, 'CH') + B(c2, 'CH', c3, 'CH₃');
  s += hal(br, 'Br', [180, -90, 90]);
  s += A(c1, 'CH₂') + A(c2, 'CH', 'warn') + A(c3, 'CH₃');
  const r = rad(d);
  s += dot(P(c2.x + Math.cos(r) * 24, c2.y + Math.sin(r) * 24));
  return { s, c2 };
}
/* Propagation 2: the radical takes H from H–Br. */
function prop2Reactants(x, y, meDeg = -90) {
  let s = '';
  const k = bromoRadical(x, y, 0, meDeg);
  s += k.s;
  const h = P(k.c2.x + 72, y), br = P(h.x + 66, y);
  s += bond(h, br, { rFrom: 12, rTo: 16 });
  s += atom(h.x, h.y, 'H', { r: 12, kind: 'hi' });
  s += hal(br, 'Br', [-90, 0, 90]);
  s += fishhook(P(k.c2.x + 27, y - 4), P(k.c2.x + 44, y - 12), { bow: -8 });
  s += fishhook(P(h.x + 32, y - 6), P(k.c2.x + 50, y - 12), { bow: 18 });
  s += fishhook(P(h.x + 34, y + 6), P(br.x - 10, br.y + 16), { bow: 10 });
  return s;
}
/* 1-bromopropane written out. */
function bromopropane(x, y) {
  let s = '';
  const br = P(x, y), c1 = P(x + 66, y), c2 = P(x + 132, y), c3 = P(x + 132, y + 56);
  s += bond(br, c1, { rFrom: 16, rTo: 16 }) + B(c1, 'CH₂', c2, 'CH₂') + B(c2, 'CH₂', c3, 'CH₃');
  s += hal(br, 'Br', [180, -90, 90]);
  s += A(c1, 'CH₂') + A(c2, 'CH₂', 'hi') + A(c3, 'CH₃');
  return s;
}

FIGURES.push({
  id: 'hbr-radical-chain',
  section: 'markovnikov',
  anchor: '',
  alt: 'The two propagation steps of radical HBr addition to propene, drawn with single-barbed fishhook arrows. Step 1: a bromine radical and propene. One fishhook from the bromine radical and one from the pi bond meet between bromine and the CH2 carbon, forming the C–Br bond; a third fishhook sends the other pi electron to the CH carbon. The product is Br–CH2–CH–CH3 with the unpaired electron on the CH carbon, a secondary radical. Step 2: that radical takes a hydrogen from H–Br. One fishhook from the radical and one from the H–Br bond form the new C–H bond; a third sends the other H–Br electron to bromine. The products are 1-bromopropane and a new bromine radical, which starts step 1 again.',
  viewBox: '0 0 760 380',
  build() {
    let s = '';
    s += tg(24, 34, 'PROPAGATION 1 · Br• ADDS TO THE CH₂ END', 'start');
    s += prop1Reactants(56, 104);
    s += arrow(P(318, 104), P(376, 104), { muted: true });
    s += bromoRadical(420, 104, -90).s;
    s += tg(552, 172, 'a 2° radical', 'middle', 'fg-tag-good');
    s += rule(24, 196, 736, 196);

    s += tg(24, 226, 'PROPAGATION 2 · THE RADICAL TAKES H FROM H–Br', 'start');
    s += prop2Reactants(46, 280, -30);
    s += arrow(P(372, 280), P(420, 280), { muted: true });
    s += bromopropane(452, 280);
    s += text(620, 285, '+', { cls: 'fg-lbl', size: 14 });
    s += brRad(P(680, 280), 180, [-90, 0, 90]);
    s += tg(518, 360, '1-bromopropane', 'middle', 'fg-tag-good');
    s += tg(680, 336, 'starts propagation 1');
    return s;
  },
  caption: 'Every arrow has one barb. Follow the Br• made at the end of propagation 2: it is the one that starts propagation 1 again.',
});

FIGURES.push({
  id: 'l-hbr-radical',
  lessons: ['markovnikov'],
  anchor: '',
  alt: 'Radical HBr addition to propene in two stacked panels drawn with fishhook arrows. Step 1: a bromine radical adds to the CH2 end of propene, leaving the unpaired electron on the CH carbon, a secondary radical. Step 2: that radical takes a hydrogen from H–Br, giving 1-bromopropane and a new bromine radical.',
  viewBox: '0 0 340 556',
  build() {
    let s = '';
    s += tg(170, 20, 'PROPAGATION 1 · Br• ADDS TO THE CH₂ END');
    s += prop1Reactants(46, 84);
    s += arrow(P(170, 136), P(170, 164), { muted: true });
    s += bromoRadical(70, 204, -90).s;
    s += tg(202, 262, 'A 2° RADICAL', 'middle', 'fg-tag-good');
    s += rule(20, 282, 320, 282);
    s += tg(170, 302, 'PROPAGATION 2 · IT TAKES H FROM H–Br');
    // stacked: the radical on the left, H–Br to its right, drawn tighter
    s += prop2Reactants(30, 356, -30);
    s += arrow(P(120, 402), P(120, 436), { muted: true });
    s += bromopropane(40, 476);
    s += text(222, 481, '+', { cls: 'fg-lbl', size: 14 });
    s += brRad(P(270, 476), 180, [-90, 0, 90]);
    return s;
  },
  caption: 'Every arrow has one barb: each moves a single electron.',
});

export default FIGURES;
