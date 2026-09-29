/* Figures for the cis-trans-ez notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure here is 340 wide or less, stacked, and labelled only with
   fg-lbl and fg-tag text, so the same drawing can sit in the notes and in a
   lesson step. The one exception is ring-flip-keeps-face (760 wide, notes
   only); its lesson copy is l-ring-flip.

   Every E/Z drawing puts the C=C horizontal with its four groups at 120
   degrees, so "same side" means "both above the double bond" or "both below
   it". Where a figure assigns E or Z, each alkene carbon's two groups are
   tagged higher and lower. The question figures (l-ez-practice, l-ez-read)
   leave the tags off, because the tags are the answer. */
import { atom, bond, wedge, hash, arrow, text, tag, rule, P } from '../lib/ochem-figure.mjs';
import { sk } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const r2 = (v) => Math.round(v * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;
/* A point `len` from c at a math angle: 0 is east, 90 is up. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
/* A text line with an italic prefix, e.g. <i>cis</i>-but-2-ene. */
const itext = (x, y, it, rest, cls = 'fg-tag', anchor = 'middle') =>
  `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" font-size="11"><tspan font-style="italic">${it}</tspan>${rest}</text>`;
/* Disc radius that fits a group label. */
const gr = (t) => Math.max(12, Math.round(3.3 * [...t].length + 7));
const Cr = 13;

/* An alkene with the C=C horizontal. `g` has up to four groups: lu and ld
   on the left carbon (up-left, down-left), ru and rd on the right carbon.
   Each group is { t: label, pri: 'hi' | 'lo' (optional) }. `names` labels
   the two carbons, e.g. ['C2', 'C3']. */
function alkene(cx, cy, g, o = {}) {
  const half = o.half ?? 30;
  const L = P(cx - half, cy), R = P(cx + half, cy);
  let s = bond(L, R, { order: 2, rFrom: Cr, rTo: Cr });
  const spots = { lu: [L, 120, 'end'], ld: [L, 240, 'end'], ru: [R, 60, 'start'], rd: [R, 300, 'start'] };
  for (const k of Object.keys(spots)) {
    const grp = g[k];
    if (!grp) continue;
    const [c, deg, anchor] = spots[k];
    const r = gr(grp.t);
    const len = grp.len ?? (Cr + r + (o.gap ?? 20));
    const p = at(c, deg, len);
    s += bond(c, p, { rFrom: Cr, rTo: r, cls: grp.pri === 'hi' ? 'fg-bond-hi' : 'fg-bond' });
    s += atom(p.x, p.y, grp.t, { r, kind: grp.pri === 'hi' ? 'hi' : 'plain' });
    if (grp.pri) {
      const dx = anchor === 'end' ? -(r + 5) : r + 5;
      s += text(p.x + dx, p.y + 4, grp.pri === 'hi' ? 'higher' : 'lower', { cls: grp.pri === 'hi' ? 'fg-tag-good' : 'fg-tag-mut', anchor });
    }
  }
  s += atom(L.x, L.y, 'C', { r: Cr }) + atom(R.x, R.y, 'C', { r: Cr });
  if (o.names) {
    s += text(L.x - Cr - 4, L.y + 4, o.names[0], { cls: 'fg-tag-mut', anchor: 'end' });
    s += text(R.x + Cr + 4, R.y + 4, o.names[1], { cls: 'fg-tag-mut', anchor: 'start' });
  }
  return s;
}

/* p orbitals, as the Bonding page draws them: two lobes in the two phase
   colours for a p orbital lying in the page, a disc for one pointing out. */
function ell(cx, cy, rx, ry, deg, cls) {
  return `<ellipse class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" transform="rotate(${r2(-deg)} ${r2(cx)} ${r2(cy)})"></ellipse>`;
}
function pOrb(c, deg, len = 44, w = 13) {
  const a = at(c, deg, len * 0.52), b = at(c, deg + 180, len * 0.52);
  return ell(a.x, a.y, len * 0.5, w, deg, 'fg-orb') + ell(b.x, b.y, len * 0.5, w, deg, 'fg-orb-alt');
}
const disc = (c) => `<circle class="fg-orb" cx="${r2(c.x)}" cy="${r2(c.y)}" r="23"></circle>`;
const cloud = (x1, y1, x2, y2) =>
  `<rect class="fg-dash-hi" x="${r2(x1)}" y="${r2(y1)}" width="${r2(x2 - x1)}" height="${r2(y2 - y1)}" rx="24" fill="none"></rect>`;

/* A flat hexagon, first vertex at the top, going clockwise. */
function hexVerts(cx, cy, r) {
  const v = [];
  for (let i = 0; i < 6; i++) v.push(at(P(cx, cy), 90 - i * 60, r));
  return v;
}
const hexRing = (v) => v.map((p, i) => sk(p, v[(i + 1) % 6])).join('');

/* The chair, taken from build-ochem-figures.mjs (the axial-equatorial
   twelve-position figure), so it cannot disagree with the chair the
   Alkanes & Conformations chapter draws. Axial is vertical and alternates:
   up on the even carbons, down on the odd ones. The flipped chair negates
   every height, which turns every axial direction over, exactly as
   ring-flip-invariant does in that chapter. */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
const CHAIR_EQ = [
  P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104),
  P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104),
];
const chair = (cx, cy, k, flip) => CHAIR_V.map((v) => P(cx + v.x * k, cy + (flip ? -v.y : v.y) * k));
const chairRing = (pts) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0 })).join('');
/* Which way carbon i's axial bond points: -1 is up the page. */
const axSign = (i, flip) => ((i % 2 === 0) !== !!flip ? -1 : 1);
const axialEnd = (pts, i, flip, L = 34) => P(pts[i].x, pts[i].y + axSign(i, flip) * L);
const equatorialEnd = (pts, i, flip, L = 32) =>
  P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y + (flip ? -CHAIR_EQ[i].y : CHAIR_EQ[i].y) * L);
/* Put a methyl on carbon i on the given face ('up' or 'down'). Returns the
   ink and whether that methyl came out axial. */
function chairMethyl(pts, i, face, flip) {
  const axialUp = axSign(i, flip) === -1;
  const axial = (face === 'up') === axialUp;
  const end = axial ? axialEnd(pts, i, flip, 36) : equatorialEnd(pts, i, flip, 36);
  let s = bond(pts[i], end, { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' });
  s += atom(end.x, end.y, 'CH₃', { r: 17, kind: 'hi' });
  return { s, axial };
}
/* One chair carrying methyls. `subs` is a list of [carbon index, face,
   name]. The name tag sits beside the ring carbon, on the side away from
   the methyl. Returns the ink and the axial/equatorial reading per methyl. */
function methylChair(cx, cy, k, flip, subs, tagAt) {
  const pts = chair(cx, cy, k, flip);
  let s = chairRing(pts);
  const read = [];
  for (const [i, face, name] of subs) {
    const m = chairMethyl(pts, i, face, flip);
    s += m.s;
    const off = tagAt[name];
    s += text(pts[i].x + off.x, pts[i].y + off.y, name, { cls: 'fg-tag', anchor: off.a || 'middle' });
    read.push([name, m.axial ? 'axial' : 'equatorial', face]);
  }
  return { s, read };
}

/* ------------------------------------------------------------ pi-twist ---
   Why the two but-2-enes do not interconvert. The molecule lies flat in
   the page, so each p orbital points straight out at the reader (a disc).
   A quarter turn of the right carbon stands its p orbital up in the page,
   at right angles to the left one, and its groups go onto a wedge and a
   hash. A second quarter turn would give the trans isomer. */
function butenePage(cy, state) {
  const C1 = P(120, cy), C2 = P(206, cy);
  let s = disc(C1);
  const me1 = at(C1, 145, 58), h1 = at(C1, 215, 50);
  if (state === 'twist') {
    s += pOrb(C2, 90, 46, 13);
    s += bond(C1, C2, { rFrom: Cr, rTo: Cr });
    const me = P(262, cy + 26), h = P(258, cy - 26);
    s += wedge(C2, me, { rFrom: Cr, rTo: 17, width: 9 }) + atom(me.x, me.y, 'CH₃', { r: 17, kind: 'hi' });
    s += hash(C2, h, { rFrom: Cr, rTo: 11, width: 10, rungs: 4 }) + atom(h.x, h.y, 'H', { r: 11 });
  } else {
    s += disc(C2);
    s += cloud(90, cy - 29, 236, cy + 29);
    s += bond(C1, C2, { order: 2, rFrom: Cr, rTo: Cr });
    const up = state === 'cis';
    const me = at(C2, up ? 35 : 325, 58), h = at(C2, up ? 325 : 35, 50);
    s += bond(C2, me, { rFrom: Cr, rTo: 17 }) + atom(me.x, me.y, 'CH₃', { r: 17, kind: 'hi' });
    s += bond(C2, h, { rFrom: Cr, rTo: 11 }) + atom(h.x, h.y, 'H', { r: 11 });
  }
  s += bond(C1, me1, { rFrom: Cr, rTo: 17 }) + atom(me1.x, me1.y, 'CH₃', { r: 17, kind: 'hi' });
  s += bond(C1, h1, { rFrom: Cr, rTo: 11 }) + atom(h1.x, h1.y, 'H', { r: 11 });
  s += atom(C1.x, C1.y, 'C', { r: Cr }) + atom(C2.x, C2.y, 'C', { r: Cr });
  return s;
}
FIGURES.push({
  id: 'pi-twist',
  section: 'cis-trans-ez',
  lessons: ['cis-trans-ez'],
  anchor: 'Bonding shows the orbitals in detail.</p>',
  viewBox: '0 0 340 462',
  alt: 'But-2-ene drawn three times, flat in the page, with every atom labeled. Top: cis-but-2-ene. Both methyl groups are on the upper side of the double bond, each carbon carries a disc for its p orbital pointing out of the page, and a dashed outline around both discs marks the pi bond. Middle: the right carbon has turned a quarter turn. Its methyl is on a wedge and its hydrogen on a hash, its p orbital now lies up and down in the page at right angles to the left one, and the carbons are joined by a single line: no pi bond. Bottom: after another quarter turn the right methyl is on the lower side, which is trans-but-2-ene, with the pi bond back.',
  build() {
    let s = '';
    s += itext(10, 18, 'cis', '-but-2-ene: p orbitals parallel', 'fg-tag', 'start');
    s += butenePage(84, 'cis');
    s += text(163, 138, 'π bond (dashed)', { cls: 'fg-tag' });
    s += rule(10, 152, 330, 152);
    s += text(10, 174, 'turn the right carbon a quarter turn', { cls: 'fg-tag', anchor: 'start' });
    s += butenePage(236, 'twist');
    s += text(170, 298, 'p orbitals at 90°: no overlap, no π bond', { cls: 'fg-tag-warn' });
    s += rule(10, 312, 330, 312);
    s += text(10, 334, 'another quarter turn', { cls: 'fg-tag', anchor: 'start' });
    s += butenePage(392, 'trans');
    s += itext(170, 452, 'trans', '-but-2-ene: π bond back', 'fg-tag');
    return s;
  },
  caption: 'Follow the right-hand methyl. Getting it from the upper side to the lower side means passing through the middle drawing, where the π bond is broken.',
});

/* ------------------------------------------------ ring-cis-trans-faces ---
   cis- and trans-1,2-dimethylcyclohexane as flat hexagons. */
function ringPair(cy, a, b, faceA, faceB) {
  const v = hexVerts(170, cy, 46);
  let s = hexRing(v);
  const put = (i, face, name, nameOff) => {
    const c = v[i];
    const out = at(c, 90 - i * 60, 46);
    let g = (face === 'up' ? wedge : hash)(c, out, { rFrom: 0, rTo: 17, width: 9 });
    g += atom(out.x, out.y, 'CH₃', { r: 17, kind: 'hi' });
    g += text(c.x + nameOff.x, c.y + nameOff.y, name, { cls: 'fg-tag', anchor: nameOff.a || 'middle' });
    return g;
  };
  s += put(a[0], faceA, a[1], a[2]) + put(b[0], faceB, b[1], b[2]);
  return s;
}
FIGURES.push({
  id: 'ring-cis-trans-faces',
  section: 'cis-trans-ez',
  lessons: ['cis-trans-ez'],
  anchor: 'Two hashes would also be cis, with both groups on the bottom face.</p>',
  viewBox: '0 0 340 384',
  alt: 'Two flat hexagon drawings of 1,2-dimethylcyclohexane, stacked. Top: both methyl groups sit on bold wedges on neighboring carbons C1 and C2, so both are above the ring; this is cis-1,2-dimethylcyclohexane. Bottom: the methyl on C1 is on a wedge and the methyl on C2 is on a hashed bond, so one is above the ring and one below; this is trans-1,2-dimethylcyclohexane.',
  build() {
    let s = '';
    s += text(170, 18, 'two wedges: both above the ring', { cls: 'fg-tag' });
    s += ringPair(100, [1, 'C1', { x: -8, y: 14, a: 'end' }], [2, 'C2', { x: -8, y: -4, a: 'end' }], 'up', 'up');
    s += itext(170, 180, 'cis', '-1,2-dimethylcyclohexane', 'fg-tag-good');
    s += rule(10, 196, 330, 196);
    s += text(170, 218, 'one wedge, one hash: one above, one below', { cls: 'fg-tag' });
    s += ringPair(292, [1, 'C1', { x: -8, y: 14, a: 'end' }], [2, 'C2', { x: -8, y: -4, a: 'end' }], 'up', 'down');
    s += itext(170, 374, 'trans', '-1,2-dimethylcyclohexane', 'fg-tag-warn');
    return s;
  },
  caption: 'Compare the two bonds to the methyl groups: the same kind of bond in the top drawing, different kinds in the bottom one.',
});

/* ---------------------------------------------- ring-cis-trans-locants ---
   The same reading on 1,3 and 1,4 rings. */
FIGURES.push({
  id: 'ring-cis-trans-locants',
  section: 'cis-trans-ez',
  lessons: ['cis-trans-ez'],
  anchor: 'the wedges and hashes say which face each group is on.</p>',
  viewBox: '0 0 340 436',
  alt: 'Two more flat hexagon drawings, stacked. Top: 1,3-dimethylcyclohexane with both methyl groups on bold wedges, on carbons C1 and C3 with one carbon between them; this is the cis isomer. Bottom: 1,4-dimethylcyclohexane with the methyl on C1 on a wedge and the methyl on C4, across the ring, on a hashed bond; this is the trans isomer.',
  build() {
    let s = '';
    s += text(170, 18, 'two wedges, one carbon apart', { cls: 'fg-tag' });
    s += ringPair(96, [1, 'C1', { x: -10, y: 14, a: 'end' }], [3, 'C3', { x: 0, y: -12 }], 'up', 'up');
    s += itext(170, 226, 'cis', '-1,3-dimethylcyclohexane', 'fg-tag-good');
    s += rule(10, 240, 330, 240);
    s += text(170, 262, 'a wedge and a hash, across the ring', { cls: 'fg-tag' });
    s += ringPair(336, [1, 'C1', { x: -10, y: 14, a: 'end' }], [4, 'C4', { x: 10, y: -2, a: 'start' }], 'up', 'down');
    s += itext(170, 428, 'trans', '-1,4-dimethylcyclohexane', 'fg-tag-warn');
    return s;
  },
  caption: 'The spacing changes, and the reading does not: same kind of bond is cis, a wedge and a hash is trans.',
});

/* ------------------------------------------------ ring-flip-keeps-face ---
   Both 1,2-dimethylcyclohexanes, each in its two chairs. Axial and
   equatorial swap on the flip; up and down do not. Notes only (760 wide). */
const CIS12 = [[0, 'up', 'C1'], [5, 'up', 'C2']];
const TRANS12 = [[0, 'down', 'C1'], [5, 'up', 'C2']];
const TAGS = { C1: { x: 10, y: 20, a: 'start' }, C2: { x: -8, y: 20, a: 'end' } };
function chairRow(cxA, cxB, cy, k, subs, dy = 58, arrowGap = 110) {
  const A = methylChair(cxA, cy, k, false, subs, TAGS);
  const B = methylChair(cxB, cy, k, true, subs, TAGS);
  let s = A.s + B.s;
  const line = (cx, read, y) => read.forEach(([n, pos, face], j) => {
    s += text(cx, y + j * 18, `${n}: ${pos}, ${face}`, { cls: 'fg-tag' });
  });
  line(cxA, A.read, cy + dy);
  line(cxB, B.read, cy + dy);
  const mid = (cxA + cxB) / 2;
  s += arrow(P(mid - arrowGap / 2, cy - 8), P(mid + arrowGap / 2, cy - 8));
  s += arrow(P(mid + arrowGap / 2, cy + 8), P(mid - arrowGap / 2, cy + 8), { muted: true });
  s += text(mid, cy - 20, 'ring flip', { cls: 'fg-tag' });
  return s;
}
FIGURES.push({
  id: 'ring-flip-keeps-face',
  section: 'cis-trans-ez',
  anchor: 'The compound is still cis.</p>',
  viewBox: '0 0 760 440',
  alt: 'Two rows of cyclohexane chairs, each row showing one compound in its two chairs with ring-flip arrows between them. Top row, cis-1,2-dimethylcyclohexane: in the left chair the C1 methyl is axial and points up and the C2 methyl is equatorial and points up; in the flipped chair on the right the C1 methyl is equatorial and up and the C2 methyl is axial and up. Bottom row, trans-1,2-dimethylcyclohexane: in the left chair both methyls are equatorial, C1 pointing down and C2 pointing up; in the flipped chair both are axial, C1 down and C2 up.',
  build() {
    let s = '';
    s += itext(20, 22, 'cis', '-1,2-dimethylcyclohexane', 'fg-tag-good', 'start');
    s += chairRow(190, 570, 110, 0.78, CIS12);
    s += rule(20, 222, 740, 222);
    s += itext(20, 246, 'trans', '-1,2-dimethylcyclohexane', 'fg-tag-warn', 'start');
    s += chairRow(190, 570, 330, 0.78, TRANS12);
    return s;
  },
  caption: 'Read the tags under each chair. From one chair to the other, axial and equatorial swap, while up and down stay the same.',
});

/* Lesson copy: the cis compound only, the two chairs stacked. */
FIGURES.push({
  id: 'l-ring-flip',
  lessons: ['cis-trans-ez'],
  viewBox: '0 0 340 452',
  alt: 'cis-1,2-dimethylcyclohexane in two chairs, one above the other, with ring-flip arrows between them. In the upper chair the C1 methyl is axial and points up and the C2 methyl is equatorial and points up. In the lower, flipped chair the C1 methyl is equatorial and up and the C2 methyl is axial and up.',
  build() {
    let s = '';
    s += itext(170, 18, 'cis', '-1,2-dimethylcyclohexane', 'fg-tag-good');
    const A = methylChair(170, 96, 0.78, false, CIS12, TAGS);
    s += A.s;
    A.read.forEach(([n, pos, face], j) => { s += text(170, 158 + j * 18, `${n}: ${pos}, ${face}`, { cls: 'fg-tag' }); });
    s += arrow(P(150, 196), P(150, 238));
    s += arrow(P(190, 238), P(190, 196), { muted: true });
    s += text(206, 222, 'ring flip', { cls: 'fg-tag', anchor: 'start' });
    const B = methylChair(170, 318, 0.78, true, CIS12, TAGS);
    s += B.s;
    B.read.forEach(([n, pos, face], j) => { s += text(170, 408 + j * 18, `${n}: ${pos}, ${face}`, { cls: 'fg-tag' }); });
    return s;
  },
  caption: 'Axial and equatorial swap on the flip. Both methyls point up in both chairs.',
});

/* Lesson question: cis-1,4-dimethylcyclohexane in one chair. */
FIGURES.push({
  id: 'l-cis14-chair',
  lessons: ['cis-trans-ez'],
  viewBox: '0 0 340 220',
  alt: 'cis-1,4-dimethylcyclohexane in one chair. The methyl on C1, at the right end of the chair, is axial and points up. The methyl on C4, at the left end, is equatorial and angles up.',
  build() {
    let s = '';
    const T = { C1: { x: 8, y: 22, a: 'start' }, C4: { x: -2, y: 24, a: 'middle' } };
    const A = methylChair(170, 120, 0.9, false, [[0, 'up', 'C1'], [3, 'up', 'C4']], T);
    s += A.s;
    s += text(170, 206, 'C1: axial, up    C4: equatorial, up', { cls: 'fg-tag' });
    return s;
  },
  caption: 'One chair of the cis compound, before the flip.',
});

/* --------------------------------------------------- cis-trans-runs-out ---
   The condition on cis and trans, and the alkene that breaks it. */
FIGURES.push({
  id: 'cis-trans-runs-out',
  section: 'cis-trans-ez',
  lessons: ['cis-trans-ez'],
  anchor: 'So &ldquo;cis or trans?&rdquo; has no answer.</p>',
  viewBox: '0 0 340 450',
  alt: 'Three alkenes stacked, each with the double bond horizontal. First, cis-but-2-ene: each alkene carbon carries one hydrogen and one methyl, and the two methyls are both above the double bond. Second, trans-but-2-ene: the left methyl is above and the right methyl below. Third, 3-methylpent-2-ene: the left carbon carries a methyl and a hydrogen, but the right carbon carries a methyl and an ethyl group and no hydrogen, so neither cis nor trans can be assigned.',
  build() {
    let s = '';
    s += alkene(170, 66, { lu: { t: 'CH₃' }, ld: { t: 'H' }, ru: { t: 'CH₃' }, rd: { t: 'H' } });
    s += itext(170, 130, 'cis', '-but-2-ene: methyls on the same side', 'fg-tag-good');
    s += rule(10, 144, 330, 144);
    s += alkene(170, 212, { lu: { t: 'CH₃' }, ld: { t: 'H' }, ru: { t: 'H' }, rd: { t: 'CH₃' } });
    s += itext(170, 276, 'trans', '-but-2-ene: methyls on opposite sides', 'fg-tag-good');
    s += rule(10, 290, 330, 290);
    s += alkene(170, 360, { lu: { t: 'CH₃' }, ld: { t: 'H' }, ru: { t: 'CH₃' }, rd: { t: 'CH₂CH₃' } });
    s += text(170, 424, '3-methylpent-2-ene: no H on the right carbon', { cls: 'fg-tag-warn' });
    s += text(170, 442, 'so neither cis nor trans fits', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Count the hydrogens on each alkene carbon. The first two drawings have one per carbon. The third has none on the right-hand carbon.',
});

/* --------------------------------------------------------- ez-worked ---
   2-bromobut-2-ene: drawn "trans", named Z. */
FIGURES.push({
  id: 'ez-worked',
  section: 'cis-trans-ez',
  lessons: ['cis-trans-ez'],
  anchor: 'so the compound is <b>(Z)-2-bromobut-2-ene</b>.</p>\n</div>',
  viewBox: '0 0 340 270',
  alt: '2-bromobut-2-ene with the double bond horizontal. The left carbon, C2, carries bromine up-left, tagged higher, and a methyl down-left, tagged lower. The right carbon, C3, carries a methyl up-right, tagged higher, and a hydrogen down-right, tagged lower. The two methyl groups are on opposite sides, but the two higher-priority groups, bromine and the C3 methyl, are both above the double bond, so the compound is Z.',
  build() {
    let s = '';
    s += text(170, 18, 'the two methyls are on opposite sides', { cls: 'fg-tag' });
    s += alkene(170, 102, { lu: { t: 'Br', pri: 'hi' }, ld: { t: 'CH₃', pri: 'lo' }, ru: { t: 'CH₃', pri: 'hi' }, rd: { t: 'H', pri: 'lo' } }, { names: ['C2', 'C3'] });
    s += rule(10, 174, 330, 174);
    s += text(170, 196, 'On C2: Br beats CH₃ (35 against 6)', { cls: 'fg-tag' });
    s += text(170, 216, 'On C3: CH₃ beats H (6 against 1)', { cls: 'fg-tag' });
    s += text(170, 236, 'Both higher groups are above the C=C', { cls: 'fg-tag' });
    s += text(170, 260, '(Z)-2-bromobut-2-ene', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Look only at the two groups tagged higher. They are on the same side, whatever the methyls do.',
});

/* Lesson question: 2-chlorobut-2-ene, methyls on the same side. No tags. */
FIGURES.push({
  id: 'l-ez-practice',
  lessons: ['cis-trans-ez'],
  viewBox: '0 0 340 190',
  alt: '2-chlorobut-2-ene with the double bond horizontal. The left carbon, C2, carries a methyl up-left and a chlorine down-left. The right carbon, C3, carries a methyl up-right and a hydrogen down-right. The two methyl groups are both above the double bond.',
  build() {
    let s = '';
    s += alkene(170, 90, { lu: { t: 'CH₃' }, ld: { t: 'Cl' }, ru: { t: 'CH₃' }, rd: { t: 'H' } }, { names: ['C2', 'C3'] });
    s += text(170, 176, '2-chlorobut-2-ene', { cls: 'fg-tag' });
    return s;
  },
  caption: 'Both methyls are drawn above the double bond.',
});

/* ------------------------------------------------- ez-tie-one-sphere ---
   A tie at the first atom, broken one atom further out. */
FIGURES.push({
  id: 'ez-tie-one-sphere',
  section: 'cis-trans-ez',
  lessons: ['cis-trans-ez'],
  anchor: '<b>(Z)-3-(chloromethyl)-4-methylpent-2-ene</b>.</p>\n</div>',
  viewBox: '0 0 340 318',
  alt: '3-(chloromethyl)-4-methylpent-2-ene with the double bond horizontal. The left carbon, C2, carries a methyl up-left, tagged higher, and a hydrogen down-left, tagged lower. The right carbon, C3, carries a chloromethyl group up-right, tagged higher, and an isopropyl group down-right, tagged lower. Below, the tie on C3 is broken: the chloromethyl carbon holds chlorine, hydrogen and hydrogen, the isopropyl carbon holds carbon, carbon and hydrogen, and chlorine beats carbon at the first term. Both higher groups are above the double bond, so the isomer is Z.',
  build() {
    let s = '';
    s += alkene(150, 96, { lu: { t: 'CH₃', pri: 'hi' }, ld: { t: 'H', pri: 'lo' }, ru: { t: 'CH₂Cl', pri: 'hi' }, rd: { t: 'CH(CH₃)₂', pri: 'lo' } }, { names: ['C2', 'C3'], gap: 14 });
    s += rule(10, 186, 330, 186);
    s += text(170, 208, 'On C3 both groups start with C: a tie.', { cls: 'fg-tag' });
    s += text(170, 228, 'CH₂Cl carbon holds (Cl, H, H)', { cls: 'fg-tag' });
    s += text(170, 246, 'CH(CH₃)₂ carbon holds (C, C, H)', { cls: 'fg-tag' });
    s += text(170, 266, 'Cl beats C at the first term', { cls: 'fg-tag' });
    s += text(170, 290, 'both higher groups above the C=C: Z', { cls: 'fg-tag-good' });
    s += text(170, 310, '(Z)-3-(chloromethyl)-4-methylpent-2-ene', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The smaller group wins on C3. Chlorine settles it at the first term of the two sets.',
});

/* Lesson question: 3-methylpent-2-ene, no tags. */
const PENTENE = { lu: { t: 'CH₃' }, ld: { t: 'H' }, ru: { t: 'CH₂CH₃' }, rd: { t: 'CH₃' } };
FIGURES.push({
  id: 'l-ez-read',
  lessons: ['cis-trans-ez'],
  viewBox: '0 0 340 196',
  alt: '3-methylpent-2-ene with the double bond horizontal. The left carbon, C2, carries a methyl up-left and a hydrogen down-left. The right carbon, C3, carries an ethyl group up-right and a methyl down-right.',
  build() {
    let s = '';
    s += alkene(160, 92, PENTENE, { names: ['C2', 'C3'], gap: 16 });
    s += text(170, 184, '3-methylpent-2-ene', { cls: 'fg-tag' });
    return s;
  },
  caption: 'C2 carries CH₃ and H. C3 carries CH₂CH₃ and CH₃.',
});

/* Explanation after that question: the same drawing, tagged. */
FIGURES.push({
  id: 'l-ez-read-marked',
  lessons: ['cis-trans-ez'],
  viewBox: '0 0 340 296',
  alt: 'The same 3-methylpent-2-ene with priorities tagged. On C2 the methyl, up-left, is higher and the hydrogen is lower. On C3 the ethyl group, up-right, is higher and the methyl, down-right, is lower. Below: on C3 the ethyl carbon holds carbon, hydrogen, hydrogen against the methyl carbon\'s hydrogen, hydrogen, hydrogen. Both higher groups are above the double bond, so the compound is Z.',
  build() {
    let s = '';
    s += alkene(160, 92, {
      lu: { t: 'CH₃', pri: 'hi' }, ld: { t: 'H', pri: 'lo' },
      ru: { t: 'CH₂CH₃', pri: 'hi' }, rd: { t: 'CH₃', pri: 'lo' },
    }, { names: ['C2', 'C3'], gap: 16 });
    s += rule(10, 176, 330, 176);
    s += text(170, 198, 'On C2: CH₃ beats H', { cls: 'fg-tag' });
    s += text(170, 218, 'On C3: both start with C, a tie', { cls: 'fg-tag' });
    s += text(170, 238, 'one atom out: (C, H, H) beats (H, H, H)', { cls: 'fg-tag' });
    s += text(170, 262, 'both higher groups above the C=C', { cls: 'fg-tag' });
    s += text(170, 286, '(Z)-3-methylpent-2-ene', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The ethyl group wins on C3, one atom out from the double bond.',
});

/* ------------------------------------------------- ez-duplicate-vinyl ---
   A duplicate atom creates the tie; the next atom out breaks it. */
function vinylGroup(y, x0) {
  // x0: where the bond to the rest of the molecule starts
  const A = P(x0 + 56, y), B = P(x0 + 136, y);
  let s = bond(P(x0, y), A, { rFrom: 0, rTo: Cr });
  s += text(x0 - 4, y + 4, 'to C=C', { cls: 'fg-tag-mut', anchor: 'end' });
  s += bond(A, B, { order: 2, rFrom: Cr, rTo: 17 });
  const hA = at(A, 270, 44), dA = at(A, 90, 44);
  s += bond(A, hA, { rFrom: Cr, rTo: 11 }) + atom(hA.x, hA.y, 'H', { r: 11 });
  s += bond(A, dA, { rFrom: Cr, rTo: 16, cls: 'fg-bond-soft' }) + atom(dA.x, dA.y, '(C)', { r: 16, kind: 'warn' });
  const dB = at(B, 90, 44);
  s += bond(B, dB, { rFrom: 17, rTo: 16, cls: 'fg-bond-soft' }) + atom(dB.x, dB.y, '(C)', { r: 16, kind: 'warn' });
  s += atom(A.x, A.y, 'C', { r: Cr }) + atom(B.x, B.y, 'CH₂', { r: 17 });
  return { s, A, B };
}
FIGURES.push({
  id: 'ez-duplicate-vinyl',
  section: 'cis-trans-ez',
  anchor: 'They count once, in the set where they appear, and nowhere else.</p>\n</div>',
  viewBox: '0 0 340 420',
  alt: 'Top: a vinyl group, CH=CH2, with its double bond partners each given a duplicate carbon in brackets. Its attachment carbon then holds carbon, carbon and hydrogen, and its CH2 holds carbon, hydrogen and hydrogen. Middle: an isopropyl group. Its attachment carbon holds carbon, carbon and hydrogen, and each methyl holds hydrogen, hydrogen and hydrogen. Bottom: the first atom out ties, and the next atom out goes to vinyl.',
  build() {
    let s = '';
    s += text(170, 18, 'vinyl, –CH=CH₂', { cls: 'fg-tag' });
    const v = vinylGroup(92, 90);
    s += v.s;
    s += text(v.A.x, 164, '(C, C, H)', { cls: 'fg-tag' });
    s += text(v.B.x + 8, 164, '(C, H, H)', { cls: 'fg-tag-good' });
    s += text(300, 64, 'duplicates', { cls: 'fg-tag-warn', anchor: 'middle' });
    s += rule(10, 180, 330, 180);
    s += text(170, 202, 'isopropyl, –CH(CH₃)₂', { cls: 'fg-tag' });
    const A = P(146, 270);
    s += bond(P(90, 270), A, { rFrom: 0, rTo: Cr });
    s += text(86, 274, 'to C=C', { cls: 'fg-tag-mut', anchor: 'end' });
    const m1 = at(A, 35, 64), m2 = at(A, 325, 64), h = at(A, 90, 42);
    s += bond(A, m1, { rFrom: Cr, rTo: 17 }) + atom(m1.x, m1.y, 'CH₃', { r: 17 });
    s += bond(A, m2, { rFrom: Cr, rTo: 17 }) + atom(m2.x, m2.y, 'CH₃', { r: 17 });
    s += bond(A, h, { rFrom: Cr, rTo: 11 }) + atom(h.x, h.y, 'H', { r: 11 });
    s += atom(A.x, A.y, 'C', { r: Cr });
    s += text(A.x, 322, '(C, C, H)', { cls: 'fg-tag' });
    s += text(m1.x + 22, m1.y + 4, '(H, H, H)', { cls: 'fg-tag-mut', anchor: 'start' });
    s += text(m2.x + 22, m2.y + 4, '(H, H, H)', { cls: 'fg-tag-mut', anchor: 'start' });
    s += rule(10, 340, 330, 340);
    s += text(170, 362, 'first atom out: (C, C, H) against (C, C, H), a tie', { cls: 'fg-tag' });
    s += text(170, 382, 'next atom out: (C, H, H) beats (H, H, H)', { cls: 'fg-tag' });
    s += text(170, 406, 'vinyl outranks isopropyl', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The bracketed carbons are the duplicates. They make the first sets tie, and the CH₂ of the vinyl group then wins at the next atom out.',
});

/* Lesson: vinyl against ethyl, settled at the first atom out. */
FIGURES.push({
  id: 'l-duplicate',
  lessons: ['cis-trans-ez'],
  viewBox: '0 0 340 326',
  alt: 'Top: a vinyl group with its double bond partners each given a duplicate carbon in brackets, so its attachment carbon holds carbon, carbon and hydrogen. Middle: an ethyl group, whose attachment carbon holds carbon, hydrogen and hydrogen. Bottom: carbon, carbon, hydrogen beats carbon, hydrogen, hydrogen at the second term, so vinyl outranks ethyl.',
  build() {
    let s = '';
    s += text(170, 18, 'vinyl, –CH=CH₂', { cls: 'fg-tag' });
    const v = vinylGroup(92, 90);
    s += v.s;
    s += text(v.A.x, 164, '(C, C, H)', { cls: 'fg-tag-good' });
    s += text(300, 64, 'duplicates', { cls: 'fg-tag-warn', anchor: 'middle' });
    s += rule(10, 180, 330, 180);
    s += text(170, 202, 'ethyl, –CH₂CH₃', { cls: 'fg-tag' });
    const A = P(146, 240), B = P(226, 240);
    s += bond(P(90, 240), A, { rFrom: 0, rTo: Cr });
    s += text(86, 244, 'to C=C', { cls: 'fg-tag-mut', anchor: 'end' });
    s += bond(A, B, { rFrom: 17, rTo: 17 }) + atom(B.x, B.y, 'CH₃', { r: 17 });
    s += atom(A.x, A.y, 'CH₂', { r: 17 });
    s += text(A.x, 278, '(C, H, H)', { cls: 'fg-tag' });
    s += rule(10, 292, 330, 292);
    s += text(170, 314, 'C beats H at the second term: vinyl wins', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The duplicate gives the vinyl carbon a second C in its set.',
});

/* -------------------------------------------------- ez-diene-locants ---
   Hexa-2,4-diene, one descriptor per double bond. */
FIGURES.push({
  id: 'ez-diene-locants',
  section: 'cis-trans-ez',
  anchor: 'so the preferred name is <b>(2Z,4E)-hexa-2,4-diene</b>.</p>\n</div>',
  viewBox: '0 0 340 330',
  alt: 'Hexa-2,4-diene with every carbon and the four alkene hydrogens drawn, and the carbons numbered 1 to 6. The higher-priority group on each alkene carbon is highlighted: C1 and C4 across the C2=C3 bond, and C3 and C6 across the C4=C5 bond. C1 is below the C2=C3 bond and C4 above it, so that bond is E. C3 and C6 are both below the C4=C5 bond, so that bond is Z. As numbered the name is (2E,4Z); numbering from the other end gives the preferred (2Z,4E)-hexa-2,4-diene.',
  build() {
    const c1 = P(42, 150), c2 = P(88, 124), c3 = P(140, 124), c4 = P(186, 98), c5 = P(238, 98), c6 = P(284, 124);
    let s = '';
    s += text(170, 18, 'highlighted: the higher group on each alkene C', { cls: 'fg-tag' });
    s += bond(c1, c2, { rFrom: 17, rTo: Cr, cls: 'fg-bond-hi' });
    s += bond(c2, c3, { order: 2, rFrom: Cr, rTo: Cr });
    s += bond(c3, c4, { rFrom: Cr, rTo: Cr, cls: 'fg-bond-hi' });
    s += bond(c4, c5, { order: 2, rFrom: Cr, rTo: Cr });
    s += bond(c5, c6, { rFrom: Cr, rTo: 17, cls: 'fg-bond-hi' });
    const hs = [[c2, 104.5], [c3, 284.5], [c4, 104.5], [c5, 75.5]];
    for (const [c, d] of hs) {
      const h = at(c, d, 40);
      s += bond(c, h, { rFrom: Cr, rTo: 11 }) + atom(h.x, h.y, 'H', { r: 11 });
    }
    s += atom(c1.x, c1.y, 'CH₃', { r: 17, kind: 'hi' }) + atom(c6.x, c6.y, 'CH₃', { r: 17, kind: 'hi' });
    for (const c of [c2, c3, c4, c5]) s += atom(c.x, c.y, 'C', { r: Cr });
    const num = (c, dx, dy, n) => text(c.x + dx, c.y + dy, n, { cls: 'fg-tag-mut' });
    s += num(c1, 0, 32, '1') + num(c2, 0, 30, '2') + num(c3, -4, -18, '3');
    s += num(c4, 0, 30, '4') + num(c5, 0, 30, '5') + num(c6, 0, 32, '6');
    s += rule(10, 200, 330, 200);
    s += text(170, 222, 'C2=C3: C1 below, C4 above, so E', { cls: 'fg-tag' });
    s += text(170, 242, 'C4=C5: C3 and C6 both below, so Z', { cls: 'fg-tag' });
    s += text(170, 266, 'as numbered: (2E,4Z)', { cls: 'fg-tag' });
    s += text(170, 286, 'numbered from the other end, Z gets 2', { cls: 'fg-tag' });
    s += text(170, 312, '(2Z,4E)-hexa-2,4-diene', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Check each double bond on its own: the two highlighted groups across C2=C3, then the two across C4=C5.',
});

/* ---------------------------------------------------- geometry-costs ---
   Crowding, dipoles and chain shape, one row each. */
function miniAlkene(cx, cy, lu, ld, ru, rd, hiKind) {
  return alkene(cx, cy, {
    lu: { t: lu, len: 44 }, ld: { t: ld, len: 40 }, ru: { t: ru, len: 44 }, rd: { t: rd, len: 40 },
  }, { half: 24 });
}
/* A skeletal chain of n bonds with one C=C at bond index `db`. Bond angles
   are 120 degrees; at a trans C=C the zigzag carries straight on, and at a
   cis C=C the turn repeats, which bends the chain. */
function chainPts(x0, y0, n, db, cis, L = 24) {
  const pts = [P(x0, y0)];
  let head = 30, turn = -60;
  for (let i = 0; i < n; i++) {
    const p = pts[pts.length - 1];
    pts.push(at(p, head, L));
    if (!(cis && i === db)) turn = -turn;
    head += turn;
  }
  return pts;
}
function drawChain(pts, db) {
  let s = '';
  for (let i = 0; i < pts.length - 1; i++) {
    if (i === db) {
      const a = pts[i], b = pts[i + 1];
      s += bond(a, b, { rFrom: 0, rTo: 0, order: 2, gap: 2.6, cls: 'fg-bond-hi' });
    } else s += sk(pts[i], pts[i + 1]);
  }
  return s;
}
FIGURES.push({
  id: 'geometry-costs',
  section: 'cis-trans-ez',
  lessons: ['cis-trans-ez'],
  anchor: 'so trans has no net dipole.</p>',
  viewBox: '0 0 340 520',
  alt: 'Three rows. Row one: cis-but-2-ene with its two methyl groups close together above the double bond, tagged crowded, beside trans-but-2-ene with its methyls on opposite sides, tagged apart; trans is lower in energy by about 1 kcal/mol. Row two: cis-1,2-dichloroethene with both chlorines above the double bond and an arrow for the net dipole pointing up between them, beside trans-1,2-dichloroethene, whose two C–Cl dipoles cancel. Row three: a long carbon chain with a trans double bond in the middle runs nearly straight, while the same chain with a cis double bond bends at the double bond.',
  build() {
    let s = '';
    s += text(170, 18, 'stability: bulky groups apart', { cls: 'fg-tag' });
    s += miniAlkene(88, 98, 'CH₃', 'H', 'CH₃', 'H');
    s += text(88, 42, 'crowded', { cls: 'fg-tag-warn' });
    s += itext(88, 150, 'cis', '', 'fg-tag');
    s += miniAlkene(252, 98, 'CH₃', 'H', 'H', 'CH₃');
    s += text(252, 42, 'apart', { cls: 'fg-tag-good' });
    s += itext(252, 150, 'trans', '', 'fg-tag');
    s += text(170, 172, 'trans is lower in energy, by about 1 kcal/mol', { cls: 'fg-tag' });
    s += rule(10, 186, 330, 186);

    s += text(170, 208, 'polarity: C–Cl dipoles add or cancel', { cls: 'fg-tag' });
    s += miniAlkene(88, 282, 'Cl', 'H', 'Cl', 'H');
    s += arrow(P(88, 274), P(88, 232), { size: 7 });
    s += text(88, 334, 'net dipole', { cls: 'fg-tag-warn' });
    s += miniAlkene(252, 282, 'Cl', 'H', 'H', 'Cl');
    s += text(252, 334, 'no net dipole', { cls: 'fg-tag-good' });
    s += itext(88, 352, 'cis', '', 'fg-tag') + itext(252, 352, 'trans', '', 'fg-tag');
    s += rule(10, 366, 330, 366);

    s += text(170, 388, 'shape: a cis C=C bends a long chain', { cls: 'fg-tag' });
    const t = chainPts(40, 426, 10, 4, false);
    s += drawChain(t, 4);
    s += text(300, 420, 'trans', { cls: 'fg-tag', anchor: 'start' });
    const c = chainPts(40, 480, 10, 4, true);
    s += drawChain(c, 4);
    s += text(40, 512, 'cis', { cls: 'fg-tag', anchor: 'start' });
    return s;
  },
  caption: 'Row by row: where the two methyls sit, which way the two C–Cl bonds point, and how straight each chain runs.',
});

export default FIGURES;
