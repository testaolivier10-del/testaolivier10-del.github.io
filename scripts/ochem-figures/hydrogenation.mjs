/* Figures for the hydrogenation notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions used throughout:
   - every alkene and alkyne carbon that matters is a labelled C, so a radical
     dot, a lone pair or a charge has an atom to sit on;
   - a hydrogen the reaction adds is drawn highlighted (kind 'hi');
   - a radical's unpaired electron is one larger dot, a lone pair two dots;
   - lesson copies (id prefix l-) are 340 wide, stacked, and use only fg-lbl
     and fg-tag text. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { polyPts, ringDouble, benzene } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const f2 = (v) => (Math.round(v * 100) / 100).toString();

/* ------------------------------------------------------------ helpers --- */

/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${f2(x)}" cy="${f2(y)}" r="3.4"></circle>`;
/* A name with an italic stereodescriptor in front, e.g. (E)-... */
const eName = (x, y, rest, cls, size) =>
  `<text class="${cls}" x="${f2(x)}" y="${f2(y)}" text-anchor="middle"${size ? ` font-size="${size}"` : ''}>(<tspan font-style="italic">E</tspan>)-${rest}</text>`;
const minus = (x, y) => text(x, y, '−', { cls: 'fg-warn', size: 16 });

/* A two-carbon unit with two arms on each carbon, drawn at 120 degrees.
   `sub` gives the four arms: c2up (120 deg), c2dn (240), c3up (60), c3dn (300).
   Each arm is { t: 'CH3' | 'H' | 'Hnew' | 'rad' | 'lp' }. `order` is the C-C
   bond order (1, 2 or 3; 3 ignores the arms and draws a straight line). */
function twoCarbon(cx, cy, sub, opts = {}) {
  const half = opts.half ?? 30;
  const arm = opts.arm ?? 44;
  const c2 = P(cx - half, cy), c3 = P(cx + half, cy);
  let s = bond(c2, c3, { order: opts.order ?? 2, rFrom: 14, rTo: 14, gap: 4 });
  const place = (c, deg, a) => {
    if (!a) return '';
    const end = armEnd(c, deg, arm);
    if (a.t === 'rad') { const p = armEnd(c, deg, 21); return dot(p.x, p.y); }
    if (a.t === 'lp') {
      const toward0 = deg < 90 || deg > 270;
      const cc = armEnd(c, deg + (toward0 ? -30 : 30) * (deg < 180 ? 1 : -1), 35);
      return lonePair(c.x, c.y, -deg, { dist: 21 }) + minus(cc.x, cc.y + 5);
    }
    if (a.t === 'CH3') {
      return bond(c, end, { rFrom: 14, rTo: 17 }) + atom(end.x, end.y, deg > 90 && deg < 270 ? 'H₃C' : 'CH₃', { r: 17 });
    }
    const hi = a.t === 'Hnew';
    return bond(c, end, { rFrom: 14, rTo: 13, cls: hi ? 'fg-bond-hi' : 'fg-bond' }) +
      atom(end.x, end.y, 'H', { kind: hi ? 'hi' : 'plain', r: 13 });
  };
  s += place(c2, 120, sub.c2up) + place(c2, 240, sub.c2dn) + place(c3, 60, sub.c3up) + place(c3, 300, sub.c3dn);
  s += atom(c2.x, c2.y, 'C', { r: 14 }) + atom(c3.x, c3.y, 'C', { r: 14 });
  return s;
}

/* But-2-yne, H3C-C#C-CH3, drawn linear because both middle carbons are sp. */
function butyne(cx, cy) {
  const a = P(cx - 96, cy), b = P(cx - 32, cy), c = P(cx + 32, cy), d = P(cx + 96, cy);
  let s = bond(a, b, { rFrom: 17, rTo: 14 }) + bond(b, c, { order: 3, rFrom: 14, rTo: 14, gap: 3.6 }) + bond(c, d, { rFrom: 14, rTo: 17 });
  s += atom(a.x, a.y, 'H₃C', { r: 17 }) + atom(b.x, b.y, 'C', { r: 14 }) + atom(c.x, c.y, 'C', { r: 14 }) + atom(d.x, d.y, 'CH₃', { r: 17 });
  return s;
}

/* Butane as a skeletal zigzag, one line per C-C bond. */
function butaneSk(cx, cy) {
  const pts = [P(cx - 51, cy + 10), P(cx - 17, cy - 10), P(cx + 17, cy + 10), P(cx + 51, cy - 10)];
  let s = '';
  for (let i = 0; i < 3; i++) s += bond(pts[i], pts[i + 1], { rFrom: 0, rTo: 0 });
  return s;
}

const cisButene = (cx, cy) => twoCarbon(cx, cy, { c2up: { t: 'CH3' }, c2dn: { t: 'Hnew' }, c3up: { t: 'CH3' }, c3dn: { t: 'Hnew' } });
const transButene = (cx, cy) => twoCarbon(cx, cy, { c2up: { t: 'CH3' }, c2dn: { t: 'Hnew' }, c3up: { t: 'Hnew' }, c3dn: { t: 'CH3' } });

/* A cyclohexane ring with a flat top edge. v[2] is C1 (top left), v[1] C2
   (top right). */
const hexTop = (cx, cy, r) => polyPts(cx, cy, 6, r, 0);
const pentTop = (cx, cy, r) => polyPts(cx, cy, 5, r, 90 - 36);

function ringBonds(v, dbl, center) {
  let s = '';
  for (let i = 0; i < v.length; i++) {
    const a = v[i], b = v[(i + 1) % v.length];
    const isD = dbl && ((a === dbl[0] && b === dbl[1]) || (a === dbl[1] && b === dbl[0]));
    s += isD ? ringDouble(a, b, center) : bond(a, b, { rFrom: 0, rTo: 0 });
  }
  return s;
}

/* 1,2-dimethylcycloalkene: methyls straight out from C1 and C2 of the top edge. */
function dimethylEne(v, c1, c2, center) {
  let s = ringBonds(v, [c1, c2], center);
  const o1 = P(c1.x - 20, c1.y - 34), o2 = P(c2.x + 20, c2.y - 34);
  s += bond(c1, o1, { rFrom: 0, rTo: 17 }) + bond(c2, o2, { rFrom: 0, rTo: 17 });
  s += atom(o1.x, o1.y, 'H₃C', { r: 17 }) + atom(o2.x, o2.y, 'CH₃', { r: 17 });
  return s;
}

/* The syn product on a ring: each of C1 and C2 carries one group on a wedge
   (toward the reader) and one on a hash (away). `up` picks which pair is
   wedged: 'me' puts the methyls (or `g1`/`g2`) on wedges and the new H on
   hashes, 'h' the other way round. */
function synRing(v, c1, c2, center, up, g1 = 'H₃C', g2 = 'CH₃') {
  let s = ringBonds(v, null, center);
  const top1 = P(c1.x, c1.y - 40), top2 = P(c2.x, c2.y - 40);
  const side1 = P(c1.x - 38, c1.y - 16), side2 = P(c2.x + 38, c2.y - 16);
  // The methyls go up; the hydrogens go out to the side.
  const meW = up === 'me';
  s += (meW ? wedge : hash)(c1, top1, { rFrom: 0, rTo: 17 });
  s += (meW ? wedge : hash)(c2, top2, { rFrom: 0, rTo: 17 });
  s += (meW ? hash : wedge)(c1, side1, { rFrom: 0, rTo: 13 });
  s += (meW ? hash : wedge)(c2, side2, { rFrom: 0, rTo: 13 });
  s += atom(top1.x, top1.y, g1, { r: 17 }) + atom(top2.x, top2.y, g2, { r: 17 });
  s += atom(side1.x, side1.y, 'H', { kind: 'hi', r: 13 }) + atom(side2.x, side2.y, 'H', { kind: 'hi', r: 13 });
  return s;
}

/* The metal surface: a filled bar with its label under it. `cls` sets the
   label class so the lesson copy can use fg-lbl. */
const surface = (x, y, w, lbl, cls = 'fg-sm') =>
  bar(x, y, w, 12, { kind: 'mut', r: 4 }) + (lbl ? text(x + w / 2, y + 30, lbl, { cls }) : '');

/* One frame of the surface mechanism, drawn edge-on: the alkene lies flat on
   the metal, so each carbon's two groups point up and out, one toward the
   reader (wedge) and one away (hash).
   stage 0: alkene on the metal, two H atoms beside it on the metal.
   stage 1: left carbon has its new C-H; right carbon is still held by the metal.
   stage 2: both new C-H bonds made; the alkane lifts off. */
function surfaceFrame(cx, top, stage) {
  let s = '';
  const cy = stage === 0 ? top + 78 : top + 58;
  const c1 = P(cx - 26, cy), c2 = P(cx + 26, cy);
  const mY = top + 108; // top of the metal bar
  s += bond(c1, c2, { order: stage === 0 ? 2 : 1, rFrom: 14, rTo: 14, gap: 4 });
  const R = (c, deg, kind) => {
    const e = armEnd(c, deg, stage === 0 ? 46 : 40);
    const f = kind === 'w' ? wedge : hash;
    return f(c, e, { rFrom: 14, rTo: 13 }) + atom(e.x, e.y, 'R', { r: 13 });
  };
  /* Flat alkene: its groups lie almost level, in the plane of the C=C.
     Once a carbon has its new H it is tetrahedral, and its groups bend up,
     away from the metal. */
  const flat = stage === 0;
  s += R(c1, flat ? 190 : 158, 'w') + R(c1, flat ? 146 : 112, 'h') + R(c2, flat ? -10 : 22, 'w') + R(c2, flat ? 34 : 68, 'h');
  s += atom(c1.x, c1.y, 'C', { r: 14 }) + atom(c2.x, c2.y, 'C', { r: 14 });
  const hOnMetal = (x) => atom(x, mY - 14, 'H', { kind: 'hi', r: 12 });
  if (stage === 0) {
    // the pi bond held against the metal
    s += bond(c1, P(c1.x, mY), { rFrom: 14, rTo: 0, cls: 'fg-dash' }) + bond(c2, P(c2.x, mY), { rFrom: 14, rTo: 0, cls: 'fg-dash' });
    s += hOnMetal(cx - 104) + hOnMetal(cx + 104);
  } else if (stage === 1) {
    const h = P(c1.x, cy + 38);
    s += bond(c1, h, { rFrom: 14, rTo: 12, cls: 'fg-bond-hi' }) + atom(h.x, h.y, 'H', { kind: 'hi', r: 12 });
    s += bond(c2, P(c2.x, mY), { rFrom: 14, rTo: 0, cls: 'fg-bond-soft' });
    s += hOnMetal(cx + 62);
  } else {
    const h1 = P(c1.x, cy + 38), h2 = P(c2.x, cy + 38);
    s += bond(c1, h1, { rFrom: 14, rTo: 12, cls: 'fg-bond-hi' }) + atom(h1.x, h1.y, 'H', { kind: 'hi', r: 12 });
    s += bond(c2, h2, { rFrom: 14, rTo: 12, cls: 'fg-bond-hi' }) + atom(h2.x, h2.y, 'H', { kind: 'hi', r: 12 });
  }
  return s;
}

/* ------------------------------------------------------------ 1 ---------
   The surface mechanism, in three frames. */
FIGURES.push({
  id: 'syn-on-surface',
  section: 'hydrogenation',
  anchor: '<!-- fig:syn-on-surface:start -->',
  alt: 'Three frames of an alkene on a palladium surface, seen edge-on. First, the alkene lies flat on the metal with two hydrogen atoms beside it. Second, one hydrogen has moved onto the left carbon while the right carbon is still bonded to the metal. Third, the second hydrogen has moved onto the right carbon; both new C–H bonds point down, toward the metal, and all four R groups point up.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    const frames = [
      ['1 · both lie on the metal', 'H₂ has split into H atoms', 0],
      ['2 · one H moves across', 'right C still bonded to metal', 1],
      ['3 · the second H follows', 'both new C–H face the metal', 2],
    ];
    frames.forEach(([t, lbl, st], i) => {
      const x = 14 + i * 248;
      s += panel(x, 20, 236, 216);
      s += tag(x + 118, 42, t);
      s += surfaceFrame(x + 118, 44, st);
      s += surface(x + 16, 152, 204, 'metal surface (Pd)');
      s += text(x + 118, 212, lbl, { cls: 'fg-sm' });
    });
    return s;
  },
  caption: 'Watch the highlighted hydrogens. Both start on the metal, and both end up on the lower face of the carbons, the face that was lying on the metal.',
});

FIGURES.push({
  id: 'l-syn-surface',
  lessons: ['hydrogenation'],
  alt: 'Three frames stacked, an alkene on a palladium surface seen edge-on. First, the alkene lies flat on the metal beside two hydrogen atoms. Second, one hydrogen has moved onto the left carbon. Third, the second hydrogen has moved onto the right carbon, so both new C–H bonds point down toward the metal.',
  viewBox: '0 0 340 600',
  build() {
    let s = '';
    const frames = [
      ['1 · BOTH LIE ON THE METAL', 'H\u2082 split into H atoms', 0],
      ['2 · ONE H MOVES ACROSS', 'right C still held by the metal', 1],
      ['3 · THE SECOND H FOLLOWS', 'both new C\u2013H face the metal', 2],
    ];
    frames.forEach(([t, lbl, st], i) => {
      const y = 8 + i * 198;
      s += panel(10, y, 320, 186);
      s += tag(170, y + 22, t);
      s += surfaceFrame(170, y + 26, st);
      s += surface(40, y + 134, 260, '', 'fg-lbl');
      s += text(170, y + 172, lbl, { cls: 'fg-lbl' });
    });
    return s;
  },
  caption: 'Both highlighted hydrogens come from the metal, so both end up on the face that was lying on it.',
});

/* ------------------------------------------------------------ 2 ---------
   Syn addition made visible on a ring. */
function ringCis(ox, oy, stacked) {
  let s = '';
  const r = 40;
  const A = stacked ? P(ox + 170, oy + 92) : P(ox + 150, oy + 108);
  const B = stacked ? P(ox + 170, oy + 332) : P(ox + 470, oy + 108);
  const v1 = hexTop(A.x, A.y, r), v2 = hexTop(B.x, B.y, r);
  s += dimethylEne(v1, v1[2], v1[1], A);
  s += synRing(v2, v2[2], v2[1], B, 'me');
  const lcls = stacked ? 'fg-lbl' : 'fg-lbl';
  if (stacked) {
    s += text(A.x, A.y + 64, '1,2-dimethylcyclohexene', { cls: lcls, size: 12 });
    s += arrow(P(170, oy + 172), P(170, oy + 232));
    s += text(184, oy + 207, 'H₂, Pt', { cls: 'fg-lbl', anchor: 'start' });
    s += text(B.x, B.y + 64, 'cis-1,2-dimethylcyclohexane', { cls: lcls, size: 12 });
    s += text(B.x, B.y + 86, 'both H on the far face', { cls: 'fg-tag' });
  } else {
    s += text(A.x, A.y + 66, '1,2-dimethylcyclohexene', { cls: lcls, size: 12 });
    s += arrow(P(240, oy + 108), P(360, oy + 108));
    s += text(300, oy + 96, 'H₂, Pt', { cls: 'fg-sm' });
    s += text(B.x, B.y + 66, 'cis-1,2-dimethylcyclohexane', { cls: lcls, size: 12 });
    s += text(650, oy + 84, 'both new H hashed:', { cls: 'fg-sm' });
    s += text(650, oy + 100, 'they went in on the far face', { cls: 'fg-sm' });
    s += text(650, oy + 124, 'both CH₃ wedged: cis', { cls: 'fg-tag-good' });
  }
  return s;
}

FIGURES.push({
  id: 'ring-cis',
  section: 'hydrogenation',
  anchor: '<!-- fig:ring-cis:start -->',
  alt: '1,2-Dimethylcyclohexene is hydrogenated over platinum to cis-1,2-dimethylcyclohexane. In the product both new hydrogens are on hashed bonds and both methyls are on wedges.',
  viewBox: '0 0 760 200',
  build() { return ringCis(0, 0, false); },
  caption: 'Compare where the new H and the methyls sit.',
});

FIGURES.push({
  id: 'l-ring-cis',
  lessons: ['hydrogenation'],
  alt: '1,2-Dimethylcyclohexene, top, is hydrogenated over platinum to cis-1,2-dimethylcyclohexane, bottom, with both new hydrogens hashed and both methyls wedged.',
  viewBox: '0 0 340 440',
  build() { return ringCis(0, 0, true); },
  caption: 'Compare where the new H and the methyls sit.',
});

/* The substrate for the lesson's guided question. */
FIGURES.push({
  id: 'l-q-cyclopentene',
  lessons: ['hydrogenation'],
  alt: '1,2-Dimethylcyclopentene: a five-membered ring whose top edge is a C=C, with a methyl on each of those two carbons.',
  viewBox: '0 0 340 170',
  build() {
    const c = P(170, 92);
    const v = pentTop(c.x, c.y, 38);
    // pentTop puts vertices 0 and 4 on the flat top edge.
    let s = dimethylEne(v, v[1], v[0], c);
    s += text(170, 158, '1,2-dimethylcyclopentene', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'The substrate. Its C=C is the top edge of the ring.',
});

/* ------------------------------------------------------------ 3 ---------
   Relative, not absolute: the two faces give mirror images. */
FIGURES.push({
  id: 'two-faces',
  section: 'hydrogenation',
  anchor: '<!-- fig:two-faces:start -->',
  alt: '1-Ethyl-2-methylcyclohexene in the middle. Lying on the metal with one face down, it gives cis-1-ethyl-2-methylcyclohexane with both hydrogens hashed. Lying with the other face down, it gives the same cis compound with both hydrogens wedged. The two products are mirror images, formed in equal amounts.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    const C = P(380, 120), r = 38;
    const v = hexTop(C.x, C.y, r);
    s += ringBonds(v, [v[2], v[1]], C);
    // Ethyl on C1 (skeletal: a CH2 vertex, then CH3), methyl on C2.
    const e1 = P(v[2].x - 18, v[2].y - 32), e2 = P(e1.x - 30, e1.y - 18);
    s += bond(v[2], e1, { rFrom: 0, rTo: 0 }) + bond(e1, e2, { rFrom: 0, rTo: 17 }) + atom(e2.x, e2.y, 'H₃C', { r: 17 });
    const m = P(v[1].x + 20, v[1].y - 34);
    s += bond(v[1], m, { rFrom: 0, rTo: 17 }) + atom(m.x, m.y, 'CH₃', { r: 17 });
    s += text(380, 190, '1-ethyl-2-methylcyclohexene', { cls: 'fg-lbl', size: 12 });

    // Left and right products: the same drawing with wedges and hashes swapped.
    const prod = (cx, up) => {
      const P0 = P(cx, 132);
      const w = hexTop(P0.x, P0.y, r);
      let g = ringBonds(w, null, P0);
      const c1 = w[2], c2 = w[1];
      const t1 = P(c1.x, c1.y - 36), t1b = P(t1.x - 30, t1.y - 18), t2 = P(c2.x, c2.y - 40);
      const s1 = P(c1.x - 38, c1.y - 12), s2 = P(c2.x + 38, c2.y - 12);
      const gW = up === 'g';
      g += (gW ? wedge : hash)(c1, t1, { rFrom: 0, rTo: 0 }) + bond(t1, t1b, { rFrom: 0, rTo: 17 }) + atom(t1b.x, t1b.y, 'H₃C', { r: 17 });
      g += (gW ? wedge : hash)(c2, t2, { rFrom: 0, rTo: 17 }) + atom(t2.x, t2.y, 'CH₃', { r: 17 });
      g += (gW ? hash : wedge)(c1, s1, { rFrom: 0, rTo: 13 }) + atom(s1.x, s1.y, 'H', { kind: 'hi', r: 13 });
      g += (gW ? hash : wedge)(c2, s2, { rFrom: 0, rTo: 13 }) + atom(s2.x, s2.y, 'H', { kind: 'hi', r: 13 });
      return g;
    };
    s += prod(110, 'g');
    s += prod(650, 'h');
    s += arrow(P(318, 128), P(206, 128));
    s += arrow(P(442, 128), P(554, 128));
    s += text(262, 116, 'H₂, Pt', { cls: 'fg-sm' });
    s += text(498, 116, 'H₂, Pt', { cls: 'fg-sm' });
    s += text(262, 148, 'far face down', { cls: 'fg-sm' });
    s += text(498, 148, 'near face down', { cls: 'fg-sm' });
    s += text(110, 206, 'H hashed', { cls: 'fg-tag' });
    s += text(650, 206, 'H wedged', { cls: 'fg-tag' });
    s += rule(30, 222, 730, 222);
    s += text(380, 242, 'both products cis; mirror images of each other, formed 1 : 1', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Compare the two products.',
});

/* ------------------------------------------------------------ 4 ---------
   One alkyne, three sets of conditions. */
FIGURES.push({
  id: 'alkyne-three-ways',
  section: 'hydrogenation',
  anchor: '<!-- fig:alkyne-three-ways:start -->',
  alt: 'But-2-yne reduced three ways. Hydrogen over Lindlar catalyst gives cis-but-2-ene. Sodium in liquid ammonia gives trans-but-2-ene. Excess hydrogen over palladium on carbon gives butane.',
  viewBox: '0 0 760 390',
  build() {
    let s = '';
    s += butyne(126, 200);
    s += text(126, 236, 'but-2-yne', { cls: 'fg-lbl', size: 12 });
    // A bus and three stubs, so no arrow crosses a label.
    s += bond(P(242, 200), P(270, 200), { rFrom: 0, rTo: 0, cls: 'fg-arrow' });
    s += bond(P(270, 66), P(270, 334), { rFrom: 0, rTo: 0, cls: 'fg-arrow' });
    const rows = [
      [66, 'H₂, Lindlar catalyst', 'syn, on a surface', (x, y) => cisButene(x, y), 'cis-but-2-ene', 'cis (Z)', 'fg-tag-good'],
      [200, 'Na, NH₃ (liquid)', 'no surface', (x, y) => transButene(x, y), 'trans-but-2-ene', 'trans (E)', 'fg-tag-good'],
      [334, 'H₂ (excess), Pd/C', 'does not stop', (x, y) => butaneSk(x, y), 'butane', 'alkane', 'fg-tag-warn'],
    ];
    for (const [y, top, under, draw, name, t, tcls] of rows) {
      s += arrow(P(270, y), P(446, y));
      s += text(358, y - 10, top, { cls: 'fg-lbl', size: 12 });
      s += text(358, y + 20, under, { cls: 'fg-sm' });
      s += draw(540, y);
      s += text(690, y - 4, t, { cls: tcls });
      s += text(690, y + 14, name, { cls: 'fg-sm' });
    }
    return s;
  },
  caption: 'Follow the two highlighted hydrogens in each alkene, and compare the top two rows.',
});

FIGURES.push({
  id: 'l-alkyne-three-ways',
  lessons: ['hydrogenation'],
  alt: 'But-2-yne at the top. Below it, three results stacked: hydrogen over Lindlar catalyst gives cis-but-2-ene, sodium in liquid ammonia gives trans-but-2-ene, and excess hydrogen over Pd/C gives butane.',
  viewBox: '0 0 340 510',
  build() {
    let s = '';
    s += butyne(170, 34);
    s += text(170, 70, 'but-2-yne', { cls: 'fg-lbl' });
    s += rule(20, 86, 320, 86);
    const rows = [
      [110, 'H₂, LINDLAR', (x, y) => cisButene(x, y), 'cis (Z)', 'fg-tag-good'],
      [276, 'Na, NH₃ (LIQUID)', (x, y) => transButene(x, y), 'trans (E)', 'fg-tag-good'],
      [442, 'H₂ (EXCESS), Pd/C', (x, y) => butaneSk(x, y), 'butane', 'fg-tag-warn'],
    ];
    for (const [y, t, draw, res, cls] of rows) {
      s += tag(170, y, t);
      const dy = y > 400 ? 40 : 66;
      s += draw(150, y + dy);
      s += text(290, y + dy + 4, res, { cls });
      if (y < 400) s += rule(20, y + 146, 320, y + 146);
    }
    return s;
  },
  caption: 'Follow the highlighted hydrogens: same side after Lindlar, opposite sides after Na/NH₃.',
});

/* ------------------------------------------------------------ 5 ---------
   Sodium in ammonia, step by step. The structures sit on a row with the
   reagent above each reaction arrow; the two proton transfers carry curved
   arrows. */
const RA = { c2up: { t: 'CH3' }, c2dn: { t: 'rad' }, c3up: { t: 'lp' }, c3dn: { t: 'CH3' } };
const VR = { c2up: { t: 'CH3' }, c2dn: { t: 'rad' }, c3up: { t: 'Hnew' }, c3dn: { t: 'CH3' } };
const VA = { c2up: { t: 'CH3' }, c2dn: { t: 'lp' }, c3up: { t: 'Hnew' }, c3dn: { t: 'CH3' } };

/* An H-NH2 molecule with its H at `h`, the N further along direction `deg`,
   and the two curved arrows of a proton transfer: carbanion lone pair onto
   H, and the H-N bond onto N. `lp` is where the lone pair sits. */
function protonate(lp, h, n, side = 1, bow1 = 16) {
  let s = bond(h, n, { rFrom: 12, rTo: 17 });
  s += atom(h.x, h.y, 'H', { r: 12 }) + atom(n.x, n.y, 'NH₂', { r: 17 });
  // arrow 1: lone pair onto the H, stopping at the edge of its circle
  const dx = lp.x - h.x, dy = lp.y - h.y, L = Math.hypot(dx, dy);
  s += curve(lp, P(h.x + dx / L * 15, h.y + dy / L * 15), { bow: bow1, size: 7 });
  // arrow 2: the H-N bond onto N, drawn on one side of the bond
  const ux = (n.x - h.x), uy = (n.y - h.y), M = Math.hypot(ux, uy);
  const px = -uy / M * side, py = ux / M * side;
  const mid = P((h.x + n.x) / 2 + px * 4, (h.y + n.y) / 2 + py * 4);
  const end = P(n.x - ux / M * 12 + px * 14, n.y - uy / M * 12 + py * 14);
  s += curve(mid, end, { bow: 12 * side, size: 7 });
  return s;
}

const VRcis = { c2up: { t: 'rad' }, c2dn: { t: 'CH3' }, c3up: { t: 'Hnew' }, c3dn: { t: 'CH3' } };
const TRANS = { c2up: { t: 'CH3' }, c2dn: { t: 'Hnew' }, c3up: { t: 'Hnew' }, c3dn: { t: 'CH3' } };

/* Two half-arrows for an equilibrium, centered on (x, y). */
const equil = (x, y, w = 36) =>
  arrow(P(x - w / 2, y - 5), P(x + w / 2, y - 5), { size: 6 }) + arrow(P(x + w / 2, y + 5), P(x - w / 2, y + 5), { size: 6 });

FIGURES.push({
  id: 'dissolving-metal',
  section: 'hydrogenation',
  anchor: '<!-- fig:dissolving-metal:start -->',
  alt: 'Sodium in ammonia reduces but-2-yne. Row 1: an electron from sodium gives a radical anion, with the unpaired electron on one carbon and a lone pair and negative charge on the other; the lone pair takes a proton from ammonia, giving a vinyl radical. Row 2: the vinyl radical flips quickly between a cis shape and a trans shape, and the trans shape, with the methyls apart, is favored. Row 3: a second electron turns the trans vinyl radical into a vinyl anion, which keeps the trans shape; its lone pair takes a proton from ammonia, giving trans-but-2-ene.',
  viewBox: '0 0 760 600',
  build() {
    let s = '';
    // ---- row 1 ----
    s += tag(30, 26, '1 · FIRST ELECTRON, FIRST PROTON', { anchor: 'start' });
    s += butyne(118, 132);
    s += arrow(P(236, 132), P(292, 132));
    s += text(264, 120, '+ e⁻', { cls: 'fg-lbl', size: 12 });
    s += text(264, 152, 'from Na', { cls: 'fg-sm' });
    s += twoCarbon(370, 132, RA);
    {
      const c3 = P(400, 132);
      const lp = armEnd(c3, 60, 26);
      s += protonate(P(lp.x - 2, lp.y - 5), P(452, 66), P(510, 66), -1, -16);
    }
    s += text(370, 206, 'radical anion', { cls: 'fg-tag' });
    s += arrow(P(530, 132), P(592, 132));
    s += text(561, 120, '+ H⁺', { cls: 'fg-lbl', size: 12 });
    s += text(561, 152, 'from NH₃', { cls: 'fg-sm' });
    s += twoCarbon(670, 132, VR);
    s += text(670, 206, 'vinyl radical', { cls: 'fg-tag' });
    s += rule(30, 226, 730, 226);

    // ---- row 2: the radical flips ----
    s += tag(30, 250, '2 · THE VINYL RADICAL FLIPS FAST', { anchor: 'start' });
    s += twoCarbon(250, 320, VRcis);
    s += text(250, 396, 'cis shape: methyls crowded', { cls: 'fg-sm' });
    s += equil(380, 320, 60);
    s += text(380, 300, 'fast', { cls: 'fg-sm' });
    s += twoCarbon(510, 320, VR);
    s += text(510, 396, 'trans shape: methyls apart', { cls: 'fg-tag-good' });
    s += text(680, 314, 'most radicals', { cls: 'fg-sm' });
    s += text(680, 330, 'are trans', { cls: 'fg-sm' });
    s += rule(30, 414, 730, 414);

    // ---- row 3: second electron, second proton ----
    s += tag(30, 438, '3 · SECOND ELECTRON, SECOND PROTON', { anchor: 'start' });
    s += twoCarbon(110, 500, VR);
    s += arrow(P(186, 500), P(246, 500));
    s += text(216, 488, '+ e⁻', { cls: 'fg-lbl', size: 12 });
    s += text(216, 520, 'from Na', { cls: 'fg-sm' });
    s += twoCarbon(340, 500, VA);
    {
      const c2 = P(310, 500);
      const lp = armEnd(c2, 240, 26);
      s += protonate(P(lp.x + 4, lp.y + 3), P(286, 566), P(228, 566), 1, 16);
    }
    s += text(340, 592, 'vinyl anion: keeps the trans shape', { cls: 'fg-tag-good' });
    s += arrow(P(440, 500), P(500, 500));
    s += text(470, 488, '+ H⁺', { cls: 'fg-lbl', size: 12 });
    s += text(470, 520, 'from NH₃', { cls: 'fg-sm' });
    s += twoCarbon(590, 500, TRANS);
    s += text(590, 576, 'trans-but-2-ene', { cls: 'fg-tag' });
    s += text(708, 484, 'the two', { cls: 'fg-sm' });
    s += text(708, 500, 'new H end up', { cls: 'fg-sm' });
    s += text(708, 516, 'on opposite sides', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Follow the methyls: the radical in row 2 can take either shape, and the anion in row 3 locks in the one it was given.',
});

FIGURES.push({
  id: 'l-dissolving-metal',
  lessons: ['hydrogenation'],
  alt: 'Sodium in ammonia on but-2-yne, stacked top to bottom: an electron gives a radical anion; a proton from ammonia gives a vinyl radical, which flips quickly between a cis and a trans shape, trans favored; a second electron gives a vinyl anion that keeps the trans shape; a second proton gives trans-but-2-ene.',
  viewBox: '0 0 340 740',
  build() {
    let s = '';
    const step = (y, t) => arrow(P(170, y), P(170, y + 40)) + text(184, y + 26, t, { cls: 'fg-lbl', anchor: 'start' });
    s += butyne(170, 26);
    s += step(46, '+ e⁻ from Na');
    s += twoCarbon(150, 146, RA);
    s += text(290, 150, 'radical', { cls: 'fg-tag' });
    s += text(290, 166, 'anion', { cls: 'fg-tag' });
    s += step(196, '+ H⁺ from NH₃');
    s += twoCarbon(76, 300, VRcis);
    s += equil(170, 300, 34);
    s += twoCarbon(264, 300, VR);
    s += text(170, 370, 'VINYL RADICAL: FLIPS FAST', { cls: 'fg-tag' });
    s += text(170, 388, 'trans shape favored', { cls: 'fg-tag-good' });
    s += step(398, '+ e⁻ from Na');
    s += twoCarbon(150, 498, VA);
    s += text(290, 494, 'vinyl', { cls: 'fg-tag-good' });
    s += text(290, 510, 'anion', { cls: 'fg-tag-good' });
    s += text(170, 570, 'keeps the trans shape', { cls: 'fg-tag-good' });
    s += step(582, '+ H⁺ from NH₃');
    s += twoCarbon(150, 682, TRANS);
    s += text(290, 686, 'trans', { cls: 'fg-tag' });
    return s;
  },
  caption: 'The radical flips; the anion keeps the trans shape until the last proton arrives.',
});

/* ------------------------------------------------------------ 6 ---------
   The worked example: 4-phenylbut-3-en-2-one three ways, drawn. */
/* The chain C4=C3-C2(=O)-C1 off a phenyl ring. `state` says what is left:
   'enone' (C=C and C=O), 'ketone' (C=O only), 'alcohol' (neither),
   'allylic' (C=C only, OH on C2). */
function phenylChain(x0, y0, state) {
  let s = '';
  const ring = benzene(x0, y0, 22, { rot: 0 });
  s += ring.svg;
  const a = ring.pts[0];               // ring carbon that carries the chain
  const c4 = P(a.x + 26, a.y - 15), c3 = P(c4.x + 30, c4.y + 17), c2 = P(c3.x + 30, c3.y - 17), c1 = P(c2.x + 30, c2.y + 17);
  s += bond(a, c4, { rFrom: 0, rTo: 0 });
  const cc = state === 'enone' || state === 'allylic';
  s += cc ? ringDouble(c4, c3, P(c3.x - 6, c3.y - 40), { inset: 5 }) : bond(c4, c3, { rFrom: 0, rTo: 0 });
  s += bond(c3, c2, { rFrom: 0, rTo: 0 });
  s += bond(c2, c1, { rFrom: 0, rTo: 0 });
  const o = P(c2.x, c2.y - 34);
  const co = state === 'enone' || state === 'ketone';
  if (co) {
    s += bond(c2, o, { order: 2, rFrom: 0, rTo: 12, gap: 3 }) + atom(o.x, o.y, 'O', { r: 12 });
  } else {
    s += bond(c2, o, { rFrom: 0, rTo: 14, cls: 'fg-bond-hi' }) + atom(o.x, o.y, 'OH', { kind: 'hi', r: 14, size: 10.5 });
  }
  return s;
}

FIGURES.push({
  id: 'enone-three-ways',
  section: 'hydrogenation',
  anchor: '<!-- fig:enone-three-ways:start -->',
  alt: '(E)-4-Phenylbut-3-en-2-one, a benzene ring joined to a C=C that is joined to a ketone, reduced three ways. H2 over Pd/C at 1 atm gives 4-phenylbutan-2-one: the C=C is gone, the C=O and ring remain. H2 over PtO2 at high pressure gives 4-phenylbutan-2-ol: both the C=C and the C=O are reduced. NaBH4 in methanol gives (E)-4-phenylbut-3-en-2-ol: the C=O is reduced and the C=C remains.',
  viewBox: '0 0 760 360',
  build() {
    let s = '';
    s += phenylChain(58, 180, 'enone');
    s += eName(108, 232, '4-phenylbut-3-en-2-one', 'fg-lbl', 11);
    s += bond(P(206, 180), P(222, 180), { rFrom: 0, rTo: 0, cls: 'fg-arrow' });
    s += bond(P(222, 60), P(222, 300), { rFrom: 0, rTo: 0, cls: 'fg-arrow' });
    const rows = [
      [60, 'H₂, Pd/C, 1 atm', 'ketone', '4-phenylbutan-2-one', 'C=C only', 'fg-tag-good'],
      [180, 'H₂, PtO₂, high pressure', 'alcohol', '4-phenylbutan-2-ol', 'C=C and C=O', 'fg-tag-warn'],
      [300, 'NaBH₄, CH₃OH', 'allylic', '(E)-4-phenylbut-3-en-2-ol', 'C=O only', 'fg-tag-good'],
    ];
    for (const [y, cond, st, name, t, tcls] of rows) {
      s += arrow(P(222, y), P(430, y));
      s += text(330, y - 10, cond, { cls: 'fg-lbl', size: 11.5 });
      s += phenylChain(470, y + 14, st);
      s += text(690, y - 4, t, { cls: tcls });
      s += text(690, y + 14, 'reduced', { cls: 'fg-sm' });
      s += name.startsWith('(E)-') ? eName(560, y + 44, name.slice(4), 'fg-sm', 10) : text(560, y + 44, name, { cls: 'fg-sm' });
    }
    return s;
  },
  caption: 'In each product, check two places: the C=C next to the ring, and the oxygen. A double-bonded O is a ketone that survived, and a highlighted OH is one that was reduced.',
});

/* ------------------------------------------------------------ 7 ---------
   Lesson: the heats-of-hydrogenation ladder, three butenes to one butane. */
FIGURES.push({
  id: 'l-heat-ladder',
  lessons: ['hydrogenation'],
  alt: 'An energy ladder with energy increasing upward. Each level is an alkene plus H2. But-1-ene plus H2 is highest, cis-but-2-ene plus H2 a little lower, trans-but-2-ene plus H2 lowest. All three drop to the same level, butane. But-1-ene releases 30.3 kcal/mol, cis-but-2-ene 28.6 and trans-but-2-ene 27.6.',
  viewBox: '0 0 340 320',
  build() {
    let s = '';
    const yB = 280;                         // butane
    const lv = [
      ['but-1-ene', 30.3, 82],
      ['cis-but-2-ene', 28.6, 178],
      ['trans-but-2-ene', 27.6, 272],
    ];
    s += arrow(P(16, yB), P(16, 40), { size: 7 });
    s += text(26, 30, 'ENERGY', { cls: 'fg-tag', anchor: 'start' });
    s += text(210, 30, 'EACH ALKENE + H₂', { cls: 'fg-tag' });
    s += bond(P(34, yB), P(330, yB), { rFrom: 0, rTo: 0 });
    s += text(182, yB + 26, 'butane (all three end here)', { cls: 'fg-lbl' });
    for (const [n, h, x] of lv) {
      // Drawn from 22 kcal/mol up, so the small gaps between the alkenes show.
      const top = yB - (h - 22) * 22;
      s += `<line class="fg-bond" x1="${x - 34}" y1="${f2(top)}" x2="${x + 34}" y2="${f2(top)}"></line>`;
      s += text(x, top - 28, n, { cls: 'fg-lbl' });
      s += text(x, top - 10, h.toFixed(1), { cls: 'fg-tag' });
      s += arrow(P(x, top + 6), P(x, yB - 4), { muted: true });
    }
    return s;
  },
  caption: 'Heat released, in kcal/mol; the gaps between the three alkenes are stretched so they show. The lowest starting point releases the least.',
});

export default FIGURES;
