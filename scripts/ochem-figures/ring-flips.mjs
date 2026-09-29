/* Figures for the ring-flips notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, arrow, text, tag, rule, P } from '../lib/ochem-figure.mjs';

/* ------------------------------------------------------------ geometry ---
   The chair, taken from build-ochem-figures.mjs (the axial-equatorial
   twelve-position figure). It is an exact orthographic view of a real
   cyclohexane chair (all C-C-C angles 110-111 degrees), seen from about 20
   degrees above the ring's mean plane:
     screen x =  89.8 * X,   screen y = -30.71 * Y - 84.47 * Z
   with the ring atoms at radius 1.26 in X/Y and Z the height above the mean
   plane. Index 0, the far-right carbon, is the headrest (the up end) and
   index 3, the far-left carbon, is the footrest (the down end), as on the
   cyclohexanes page. Axial is vertical: up on the even carbons, down on the
   odd ones. C1 is index 0 in every chair on this page. */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
const CHAIR_EQ = [
  P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104),
  P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104),
];

/* The flipped chair. Every height reverses, so the outline is the first
   chair reflected top to bottom: the headrest (C1) goes down and the
   footrest (C4) comes up. A plain reflection would also reverse the
   direction the carbons run round the ring, which for a chiral compound
   draws the mirror-image molecule. So the two ends keep their places and
   the four middle carbons trade places in pairs (index j sits where index
   6 - j sat). The result is exactly the true flipped chair, seen from the
   same viewpoint as the first: the same molecule, numbered the same way
   round. */
const SIG = (j) => (6 - j) % 6;

/* One chair. Returns its six points and the bond ends for every carbon. */
function ring(cx, cy, k = 1, flipped = false) {
  const src = (j) => (flipped ? SIG(j) : j);
  const pts = [0, 1, 2, 3, 4, 5].map((j) => {
    const v = CHAIR_V[src(j)];
    return P(cx + v.x * k, cy + (flipped ? -v.y : v.y) * k);
  });
  /* Is carbon j's axial bond the one that points up? */
  const axUp = (j) => (j % 2 === 0) !== flipped;
  const ax = (j, L = 34) => P(pts[j].x, pts[j].y + (axUp(j) ? -L : L));
  const eq = (j, L = 32) => {
    const e = CHAIR_EQ[src(j)];
    return P(pts[j].x + e.x * L, pts[j].y + (flipped ? -e.y : e.y) * L);
  };
  /* The bond on a given face: 'up' or 'down'. */
  const onFace = (j, face, L = 34) => {
    const axial = (face === 'up') === axUp(j);
    return { axial, end: axial ? ax(j, L) : eq(j, L) };
  };
  return { pts, axUp, ax, eq, onFace };
}
const outline = (pts, cls = 'fg-bond') =>
  pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls })).join('');
const dots = (pts) => pts.map((p) => atom(p.x, p.y, '', { kind: 'point' })).join('');

/* A substituent on carbon j of chair r, on a given face. */
function group(r, j, face, lbl, opts = {}) {
  const L = opts.L ?? 36, rad = opts.r ?? 17;
  const { axial, end } = r.onFace(j, face, L);
  let s = bond(r.pts[j], end, { rFrom: 0, rTo: rad, cls: 'fg-bond-hi' });
  s += atom(end.x, end.y, lbl, { kind: opts.kind || 'hi', r: rad });
  return { s, axial, end };
}
/* Carbon-number tags. Each sits `d` px from its carbon, outward from the
   ring's centre, or inward for the carbons listed in `inward` (the ones
   whose outside is taken by a substituent). */
function numbers(r, names, inward = [], over = {}, d = 18, cls = 'fg-tag') {
  const cx = r.pts.reduce((a, p) => a + p.x, 0) / 6, cy = r.pts.reduce((a, p) => a + p.y, 0) / 6;
  return names.map((nm, j) => {
    if (!nm) return '';
    const p = r.pts[j], dx = p.x - cx, dy = p.y - cy, len = Math.hypot(dx, dy) || 1;
    if (over[j]) return text(p.x + over[j][0], p.y + over[j][1], nm, { cls, anchor: over[j][2] || 'middle' });
    const sgn = inward.includes(j) ? -1 : 1;
    return text(p.x + sgn * dx / len * d, p.y + sgn * dy / len * d + 4, nm, { cls });
  }).join('');
}
/* The two flip arrows between two chairs. */
function flipArrows(x1, x2, y, word = 'ring flip', gap = 8) {
  let s = arrow(P(x1, y - gap), P(x2, y - gap));
  s += arrow(P(x2, y + gap), P(x1, y + gap), { muted: true });
  if (word) s += text((x1 + x2) / 2, y - gap - 10, word, { cls: 'fg-tag' });
  return s;
}
const FIGURES = [];

/* -------------------------------------------------------- flip-all-twelve ---
   Cyclohexane itself. The six axial hydrogens are drawn in the highlight
   colour; after the flip the same six hydrogens (same carbon, same face)
   are the equatorial ones. */
function twelve(cx, cy, k, flipped) {
  const r = ring(cx, cy, k, flipped);
  let s = '';
  for (let j = 0; j < 6; j++) {
    /* The hydrogen that is axial in the FIRST chair points up on even
       carbons and down on odd ones. Keep that face in both drawings. */
    const face = j % 2 === 0 ? 'up' : 'down';
    const other = face === 'up' ? 'down' : 'up';
    const a = r.onFace(j, face, 30).end, b = r.onFace(j, other, 28).end;
    s += bond(r.pts[j], b, { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
    s += bond(r.pts[j], a, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += atom(a.x, a.y, 'H', { kind: 'hi', r: 9, size: 10 });
  }
  s += outline(r.pts) + dots(r.pts);
  return s;
}
FIGURES.push({
  id: 'flip-all-twelve',
  section: 'ring-flips',
  anchor: 'every equatorial hydrogen becomes axial.</p>',
  alt: 'Cyclohexane drawn as a chair twice, with ring-flip arrows between. In the left chair the six axial hydrogens are highlighted: three point straight up and three straight down. In the right chair, the flipped one, the same six highlighted hydrogens stick outward around the rim: they are now equatorial, and each still angles toward the same face, up or down, as before.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += tag(176, 22, 'one chair');
    s += twelve(176, 124, 0.85, false);
    s += text(176, 222, 'highlighted H: all six axial', { cls: 'fg-tag-warn' });
    s += flipArrows(334, 426, 124);
    s += tag(584, 22, 'the other chair');
    s += twelve(584, 124, 0.85, true);
    s += text(584, 222, 'the same six H: all equatorial', { cls: 'fg-tag-good' });
    s += text(380, 244, 'Gray bonds: the other six H, equatorial on the left and axial on the right.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Follow the highlighted hydrogens from left to right. Each one stays on its carbon and keeps pointing toward the same face of the ring.',
});

/* ------------------------------------------------------ ring-flip-invariant ---
   One methyl group, followed through a flip. Kept from the first version of
   this page; the chairs now come from ring(). */
function methylPanel(cx, cy, k, flipped) {
  const r = ring(cx, cy, k, flipped);
  let s = outline(r.pts) + dots(r.pts);
  const g = group(r, 0, 'up', 'CH₃', { L: 36 });
  s += g.s;
  if (flipped) {
    s += bond(r.pts[0], r.ax(0, 26), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
  }
  return { s, r };
}
FIGURES.push({
  id: 'ring-flip-invariant',
  section: 'ring-flips',
  anchor: 'That is the test for a correct flip.</p>',
  alt: 'Methylcyclohexane in two chairs side by side, with ring-flip arrows between. In the left chair the methyl-bearing carbon, C1, is the headrest, the far-right carbon that tips up, and its methyl sits on a vertical bond pointing up: axial. In the right chair C1 is the footrest, tipped down; its axial bond, drawn in gray, now points down, and the methyl sits on the outward bond that angles up: equatorial, and still on the upper face.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const A = methylPanel(200, 140, 0.9, false);
    s += A.s;
    s += text(A.r.pts[0].x + 12, A.r.pts[0].y + 16, 'C1', { cls: 'fg-tag-warn', anchor: 'start' });
    s += tag(200, 26, 'one chair');
    s += text(200, 252, 'C1 is the headrest, the up end', { cls: 'fg-sm' });
    s += text(200, 274, 'methyl AXIAL, pointing up', { cls: 'fg-tag-warn' });
    s += text(200, 294, 'crowded by two 1,3-diaxial hydrogens', { cls: 'fg-sm' });

    const B = methylPanel(562, 140, 0.9, true);
    s += B.s;
    s += text(B.r.pts[0].x - 10, B.r.pts[0].y + 18, 'C1', { cls: 'fg-tag', anchor: 'end' });
    s += text(B.r.pts[0].x + 4, B.r.pts[0].y + 44, 'axial now points down', { cls: 'fg-sm', anchor: 'end' });
    s += tag(562, 26, 'the other chair');
    s += text(562, 252, 'C1 is now the footrest, the down end', { cls: 'fg-sm' });
    s += text(562, 274, 'methyl EQUATORIAL, still pointing up', { cls: 'fg-tag-good' });
    s += text(562, 294, 'out in the open, crowded by nothing', { cls: 'fg-sm' });

    s += flipArrows(330, 430, 131, 'ring flip', 19);
    return s;
  },
  caption: 'Compare the bond that carries the methyl in the two chairs: vertical on the left, outward on the right, and pointing up in both.',
});

/* Lesson copies for the interactive flip: one chair each, 340 wide. */
function lessonMethyl(flipped) {
  const r = ring(170, 138, 0.95, flipped);
  let s = outline(r.pts) + dots(r.pts);
  const g = group(r, 0, 'up', 'CH₃', { L: 38 });
  s += g.s;
  if (!flipped) {
    s += text(r.pts[0].x + 10, r.pts[0].y + 18, 'C1', { cls: 'fg-tag', anchor: 'start' });
    s += text(170, 22, 'C1 is the headrest (up end)', { cls: 'fg-tag' });
    s += text(170, 236, 'methyl: axial, pointing up', { cls: 'fg-tag-warn' });
  } else {
    s += bond(r.pts[0], r.ax(0, 26), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
    s += text(r.pts[0].x - 10, r.pts[0].y + 18, 'C1', { cls: 'fg-tag', anchor: 'end' });
    s += text(r.pts[0].x + 4, r.pts[0].y + 44, 'axial now points down', { cls: 'fg-tag', anchor: 'end' });
    s += text(170, 22, 'C1 is now the footrest (down end)', { cls: 'fg-tag' });
    s += text(170, 236, 'methyl: equatorial, still up', { cls: 'fg-tag-good' });
  }
  return s;
}
FIGURES.push({
  id: 'l-flip-before',
  lessons: ['ring-flips'],
  alt: 'Methylcyclohexane in one chair. C1, the headrest at the far right, carries the methyl on a vertical bond pointing up, so the methyl is axial.',
  viewBox: '0 0 340 246',
  build() { return lessonMethyl(false); },
  caption: 'Before the flip.',
});
FIGURES.push({
  id: 'l-flip-after',
  lessons: ['ring-flips'],
  alt: 'The same methylcyclohexane after the ring flip. C1 is now the footrest, tipped down, and its axial bond, drawn in gray, points down. The methyl sits on the outward bond from C1 that angles up, so it is equatorial and still on the upper face.',
  viewBox: '0 0 340 246',
  build() { return lessonMethyl(true); },
  caption: 'After the flip: the same methyl on the same carbon.',
});

/* Lesson copy of flip-all-twelve, stacked. */
FIGURES.push({
  id: 'l-all-twelve',
  lessons: ['ring-flips'],
  alt: 'Cyclohexane in two chairs, one above the other, with ring-flip arrows between. In the upper chair the six highlighted hydrogens are axial, three pointing straight up and three straight down. In the lower, flipped chair the same six hydrogens stick outward around the rim: equatorial, each still toward its own face.',
  viewBox: '0 0 340 430',
  build() {
    let s = '';
    s += twelve(170, 100, 0.9, false);
    s += text(170, 196, 'highlighted H: all six axial', { cls: 'fg-tag-warn' });
    s += arrow(P(150, 214), P(150, 250));
    s += arrow(P(190, 250), P(190, 214), { muted: true });
    s += text(206, 237, 'ring flip', { cls: 'fg-tag', anchor: 'start' });
    s += twelve(170, 330, 0.9, true);
    s += text(170, 422, 'the same six H: all equatorial', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Each highlighted hydrogen keeps its carbon and its face.',
});

/* ---------------------------------------------------------- flip-worked ---
   The worked example: cis-1-bromo-2-methylcyclohexane. C1 is index 0 (the
   headrest), C2 index 1, and so on round the ring. Every carbon is
   numbered in both chairs so the reader can see the numbering run the same
   way round. */
const NAMES = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
function workedChair(cx, cy, k, flipped, num = true) {
  const r = ring(cx, cy, k, flipped);
  let s = outline(r.pts) + dots(r.pts);
  const br = group(r, 0, 'up', 'Br', { L: 44, r: 15, kind: 'warn' });
  const me = group(r, 1, 'up', 'CH₃', { L: 36 });
  s += br.s + me.s;
  if (num) s += numbers(r, NAMES, [], flipped ? { 0: [8, 20, 'start'], 1: [14, 4, 'start'], 5: [6, 20, 'start'] } : { 0: [10, 18, 'start'], 1: [-4, 20] });
  return { s, br, me };
}
FIGURES.push({
  id: 'flip-worked',
  section: 'ring-flips',
  anchor: 'Both labels flipped; neither face did.</p>',
  alt: 'cis-1-Bromo-2-methylcyclohexane in two chairs, with every ring carbon numbered C1 to C6 in both. Left chair: C1 is the headrest at the far right; its bromine is axial and points up. C2, next along the top of the ring, carries the methyl on its equatorial bond, which angles up. Right chair, after the flip: C1 is the footrest, with the bromine on its equatorial bond angling up; C2, now the top corner, carries the methyl on a vertical axial bond pointing up. The numbers run the same way round the ring in both chairs.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(196, 22, 'the chair you are given');
    const A = workedChair(196, 150, 0.95, false);
    s += A.s;
    s += text(196, 252, 'Br: axial, up', { cls: 'fg-tag-warn' });
    s += text(196, 272, 'CH₃: equatorial, up', { cls: 'fg-tag' });
    s += flipArrows(334, 426, 150);
    s += tag(564, 22, 'the other chair');
    const B = workedChair(564, 150, 0.95, true);
    s += B.s;
    s += text(564, 252, 'Br: equatorial, still up', { cls: 'fg-tag-good' });
    s += text(564, 272, 'CH₃: axial, still up', { cls: 'fg-tag-good' });
    s += text(380, 294, 'C1 → C2 → C3 runs the same way round in both chairs.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Compare the tags under the two chairs. Both labels changed. Both faces stayed up.',
});
FIGURES.push({
  id: 'l-worked',
  lessons: ['ring-flips'],
  alt: 'cis-1-Bromo-2-methylcyclohexane in two chairs, one above the other, every ring carbon numbered. Upper chair: bromine axial and up on C1, the headrest; methyl equatorial and angling up on C2. Lower chair, after the flip: bromine equatorial and angling up on C1, now the footrest; methyl axial and pointing up on C2.',
  viewBox: '0 0 340 520',
  build() {
    let s = '';
    const A = workedChair(170, 108, 0.95, false);
    s += A.s;
    s += text(170, 212, 'Br: axial, up', { cls: 'fg-tag-warn' });
    s += text(170, 232, 'CH₃: equatorial, up', { cls: 'fg-tag' });
    s += arrow(P(150, 248), P(150, 284));
    s += arrow(P(190, 284), P(190, 248), { muted: true });
    s += text(206, 271, 'ring flip', { cls: 'fg-tag', anchor: 'start' });
    const B = workedChair(170, 380, 0.95, true);
    s += B.s;
    s += text(170, 488, 'Br: equatorial, still up', { cls: 'fg-tag-good' });
    s += text(170, 508, 'CH₃: axial, still up', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Both labels changed. Both faces stayed up.',
});

/* ------------------------------------------------------ axial-alternation ---
   One chair, C1 to C3, each with its axial and equatorial bond tagged up or
   down. Shared by the notes and the lesson, so 340 wide. */
FIGURES.push({
  id: 'axial-alternation',
  section: 'ring-flips',
  lessons: ['ring-flips'],
  anchor: 'which is what makes this problem drawable in the first place.</p>',
  alt: 'One cyclohexane chair with three neighboring carbons labeled C1, C2 and C3, running along the top of the ring from right to left. C1, the headrest at the far right, has a vertical axial bond pointing up and an equatorial bond angling slightly down. C2 has an axial bond pointing down and an equatorial bond angling up. C3, the top-left corner, has an axial bond pointing up and an equatorial bond angling down. Each bond end is tagged up or down.',
  viewBox: '0 0 340 204',
  build() {
    let s = '';
    const r = ring(160, 124, 0.9, false);
    s += outline(r.pts) + dots(r.pts);
    const put = (j, kind, L, lblOff) => {
      const end = kind === 'ax' ? r.ax(j, L) : r.eq(j, L);
      const up = end.y < r.pts[j].y;
      s += bond(r.pts[j], end, { rFrom: 0, rTo: 0, cls: kind === 'ax' ? 'fg-bond-hi' : 'fg-bond' });
      s += text(end.x + lblOff[0], end.y + lblOff[1], `${kind === 'ax' ? 'axial' : 'eq'} ${up ? 'up' : 'down'}`,
        { cls: up ? 'fg-tag-good' : 'fg-tag-warn', anchor: lblOff[2] || 'middle' });
    };
    put(0, 'ax', 40, [0, -8]);
    put(0, 'eq', 24, [-2, 16]);
    put(1, 'ax', 26, [-6, 0, 'end']);
    put(1, 'eq', 26, [-6, -4, 'end']);
    put(2, 'ax', 40, [0, -8]);
    put(2, 'eq', 40, [-4, 4, 'end']);
    s += text(r.pts[0].x + 8, r.pts[0].y - 6, 'C1', { cls: 'fg-tag', anchor: 'start' });
    s += text(r.pts[1].x + 8, r.pts[1].y + 18, 'C2', { cls: 'fg-tag', anchor: 'start' });
    s += text(r.pts[2].x + 8, r.pts[2].y + 20, 'C3', { cls: 'fg-tag', anchor: 'start' });
    return s;
  },
  caption: 'Read the tags from C1 to C3. Highlighted bonds are axial; eq marks the equatorial ones.',
});

/* ------------------------------------------------------------ cis13-flip ---
   cis-1,3-Dimethylcyclohexane: C1 (index 2) and C3 (index 4) share an axial
   direction, so the two methyls are both axial or both equatorial. */
function cis13(cx, cy, k, flipped) {
  const r = ring(cx, cy, k, flipped);
  let s = outline(r.pts) + dots(r.pts);
  const a = group(r, 0, 'up', 'CH₃', { L: 36 });
  const b = group(r, 2, 'up', 'CH₃', { L: 36 });
  s += a.s + b.s;
  return { s, r, a, b };
}
FIGURES.push({
  id: 'cis13-flip',
  section: 'ring-flips',
  anchor: 'never one axial and one equatorial.</p>',
  alt: 'cis-1,3-Dimethylcyclohexane in two chairs with ring-flip arrows between. Left: the methyls on C1 and C3 both sit on vertical axial bonds pointing up, over the same face of the ring. Right, after the flip: both methyls are equatorial, each on an outward bond angling up.',
  viewBox: '0 0 760 270',
  build() {
    let s = '';
    const A = cis13(200, 140, 0.95, false);
    s += A.s;
    s += text(A.r.pts[0].x + 8, A.r.pts[0].y + 16, 'C1', { cls: 'fg-tag', anchor: 'start' });
    s += text(A.r.pts[2].x - 14, A.r.pts[2].y + 16, 'C3', { cls: 'fg-tag', anchor: 'end' });
    s += text(200, 240, 'both methyls axial, both up', { cls: 'fg-tag-warn' });
    s += flipArrows(336, 424, 140);
    const B = cis13(560, 140, 0.95, true);
    s += B.s;
    s += text(B.r.pts[0].x - 4, B.r.pts[0].y + 22, 'C1', { cls: 'fg-tag' });
    s += text(B.r.pts[2].x + 4, B.r.pts[2].y + 22, 'C3', { cls: 'fg-tag', anchor: 'start' });
    s += text(560, 240, 'both methyls equatorial, both up', { cls: 'fg-tag-good' });
    s += text(380, 26, 'cis-1,3-dimethylcyclohexane: both methyls on the upper face', { cls: 'fg-tag' });
    return s;
  },
  caption: 'Both methyls change label together, because C1 and C3 have the same axial direction.',
});

/* ------------------------------------------------------ flip-path-shapes ---
   The ring on its way from one chair to the other, from the same viewpoint
   as every chair above. The shapes are Cremer-Pople puckered rings
   (puckering amplitude matched to the chair), relaxed to equal C-C bond
   lengths and projected with the chair's own view:
     chair       theta 0
     half-chair  theta 50.8, phi 150  (C5, C6, C1, C2 coplanar)
     twist-boat  theta 90,   phi 150
     boat        theta 90,   phi 180  (C1 and C4 both below the other four)
     other chair theta 180
   Index 0 is C1 (the headrest) and index 3 is C4 (the footrest). The last
   frame is exactly the flipped chair drawn everywhere else on the page. */
const SHAPES = {
  chair: [[113.1, -18.2], [56.6, -15.3], [-56.6, -51.7], [-113.1, 18.2], [-56.6, 15.3], [56.6, 51.7]],
  half: [[117.6, 5.5], [53.2, -23.1], [-58.2, -60.6], [-109.5, 27.4], [-61.2, 21.6], [58.1, 29.2]],
  twist: [[114.2, 23.2], [57.9, -34.3], [-59.3, -55.7], [-114.2, 21.4], [-57.9, 34.3], [59.3, 11.1]],
  boat: [[113.7, 25.8], [59.8, -46.6], [-59.8, -46.6], [-113.7, 25.7], [-59.8, 20.8], [59.8, 20.8]],
  other: [[113.1, 18.2], [56.6, -51.7], [-56.6, -15.3], [-113.1, -18.2], [-56.6, 51.7], [56.6, 15.3]],
};
const PLANE = { half: [4, 5, 0, 1] };
function shape(name, cx, cy, k) {
  const pts = SHAPES[name].map(([x, y]) => P(cx + x * k, cy + y * k));
  const hi = PLANE[name] || [];
  let s = '';
  pts.forEach((p, i) => {
    const j = (i + 1) % 6;
    s += bond(p, pts[j], { rFrom: 0, rTo: 0, cls: hi.includes(i) && hi.includes(j) ? 'fg-bond-hi' : 'fg-bond' });
  });
  s += `<circle class="fg-atom-warn" cx="${pts[0].x.toFixed(2)}" cy="${pts[0].y.toFixed(2)}" r="5"></circle>`;
  s += `<circle class="fg-atom-hi" cx="${pts[3].x.toFixed(2)}" cy="${pts[3].y.toFixed(2)}" r="5"></circle>`;
  return { s, pts };
}
/* C1 and C4 tags, placed just outside the ring, away from its centre. */
function shapeTags(pts) {
  const cx = pts.reduce((a, p) => a + p.x, 0) / 6, cy = pts.reduce((a, p) => a + p.y, 0) / 6;
  let s = '';
  for (const [i, nm, cls] of [[0, 'C1', 'fg-tag-warn'], [3, 'C4', 'fg-tag']]) {
    const dx = pts[i].x - cx, dy = pts[i].y - cy, len = Math.hypot(dx, dy) || 1;
    s += text(pts[i].x + dx / len * 16, pts[i].y + dy / len * 16 + 4, nm, { cls });
  }
  return s;
}
const FRAMES = [
  ['chair', 'chair', 'C1 up, C4 down'],
  ['half', 'half-chair', '4 C in one plane'],
  ['twist', 'twist-boat', 'a shallow dip'],
  ['boat', 'boat', 'C1 and C4 both down'],
  ['other', 'the other chair', 'C1 down, C4 up'],
];
FIGURES.push({
  id: 'flip-path-shapes',
  section: 'ring-flips',
  anchor: 'C1 has to travel down past its neighbors, and C4 has to travel up.</p>',
  alt: 'Five drawings of one cyclohexane ring on its way from one chair to the other, left to right, all from the same viewpoint, with C1 marked by a red dot and C4 by a green dot. 1, the chair: C1 is the headrest at the far right, tipped up, and C4 the footrest at the far left, tipped down. 2, the half-chair: C1 has come down level with C2, C5 and C6, and those four carbons, joined by highlighted bonds, lie in one plane. 3, the twist-boat. 4, the boat: C1 and C4 both sit below the other four carbons. 5, the other chair, reached through a second twist-boat and half-chair as C4 rises: C1 is now tipped down at the far right and C4 tipped up at the far left.',
  viewBox: '0 0 760 236',
  build() {
    let s = '';
    const k = 0.42, cy = 110;
    const xs = [76, 228, 380, 532, 684];
    FRAMES.forEach(([nm, title, note], i) => {
      const sh = shape(nm, xs[i], cy, k);
      s += sh.s + shapeTags(sh.pts);
      s += tag(xs[i], 36, title);
      s += text(xs[i], 176, note, { cls: 'fg-sm' });
    });
    for (let i = 0; i < 4; i++) {
      const m = (xs[i] + xs[i + 1]) / 2, a = m - 18, b = m + 18, y = cy + 40;
      if (i === 2) {
        s += arrow(P(a, y - 5), P(b, y - 5));
        s += arrow(P(b, y + 5), P(a, y + 5), { muted: true });
      } else {
        s += arrow(P(a, y), P(b, y));
      }
    }
    s += text(608, 204, '(through a second twist-boat and half-chair)', { cls: 'fg-sm' });
    s += text(380, 228, 'No bond breaks at any stage. The ring only twists about its C–C bonds.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Follow the red dot. C1 comes down first, and the green dot, C4, goes up last.',
});
FIGURES.push({
  id: 'l-shapes',
  lessons: ['ring-flips'],
  alt: 'Four shapes of the cyclohexane ring in a two-by-two grid, with C1 marked by a red dot and C4 by a green dot. Top left, the chair: C1 up, C4 down. Top right, the half-chair: the four carbons joined by highlighted bonds, C5, C6, C1 and C2, lie in one plane. Bottom left, the twist-boat. Bottom right, the boat: C1 and C4 both below the other four carbons.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    const k = 0.5;
    const cells = [[0, 88, 84], [1, 252, 84], [2, 88, 228], [3, 252, 228]];
    for (const [f, x, y] of cells) {
      const [nm, title, note] = FRAMES[f];
      const sh = shape(nm, x, y, k);
      s += sh.s + shapeTags(sh.pts);
      s += tag(x, y - 58, title);
      s += tag(x, y + 58, note, { cls: 'fg-tag-mut' });
    }
    s += rule(170, 20, 170, 290) + rule(10, 156, 330, 156);
    return s;
  },
  caption: 'The half-chair is the top of the climb. The twist-boat is a shallow resting point.',
});

/* ---------------------------------------------------- flip-energy-profile ---
   Energies from the chair (kcal/mol): half-chair about 10.8, twist-boat
   about 5.5, boat about 6.5. */
function profile(nodes, cls = 'fg-bond-hi') {
  let d = `M${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1], b = nodes[i], h = (b.x - a.x) * 0.5;
    d += ` C${a.x + h} ${a.y} ${b.x - h} ${b.y} ${b.x} ${b.y}`;
  }
  return `<path class="${cls}" d="${d}"></path>`;
}
function energyProfile(W, opts) {
  const { x0, x1, base, per, lesson } = opts;
  const E = { chair: 0, half: 10.8, twist: 5.5, boat: 6.5 };
  const seq = ['chair', 'half', 'twist', 'boat', 'twist', 'half', 'chair'];
  const step = (x1 - x0) / 6;
  const pts = seq.map((nm, i) => P(x0 + i * step, base - E[nm] * per));
  let s = '';
  s += `<line class="fg-arrow" x1="${x0 - 28}" y1="${base + 6}" x2="${x0 - 28}" y2="${base - 11 * per - 18}"></line>`;
  s += `<path class="fg-head" d="M${x0 - 28} ${base - 11 * per - 26} L${x0 - 24} ${base - 11 * per - 18} L${x0 - 32} ${base - 11 * per - 18} Z"></path>`;
  s += rule(x0 - 28, base, x1 + 20, base);
  s += profile(pts);
  pts.forEach((p) => { s += `<circle class="fg-atom-hi" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4"></circle>`; });
  const cls = lesson ? 'fg-tag' : 'fg-sm';
  /* labels */
  s += tag(pts[0].x, base + 20, 'chair', { cls: 'fg-tag-good' });
  s += tag(pts[6].x, base + 20, 'chair', { cls: 'fg-tag-good' });
  s += text(pts[0].x, base + 36, '0', { cls });
  s += text(pts[6].x, base + 36, '0', { cls });
  for (const i of [1, 5]) {
    s += tag(pts[i].x, pts[i].y - 26, 'half-chair', { cls: 'fg-tag-warn' });
    s += text(pts[i].x, pts[i].y - 12, lesson ? '≈10.8, the top' : 'about 10.8 · the top of the barrier', { cls });
  }
  s += tag(pts[3].x, pts[3].y - 26, 'boat');
  s += text(pts[3].x, pts[3].y - 12, lesson ? '≈6.5' : 'about 6.5 · a small peak', { cls });
  for (const i of [2, 4]) {
    s += tag(pts[i].x, pts[i].y + 22, 'twist-boat');
    s += text(pts[i].x, pts[i].y + 37, lesson ? '≈5.5' : 'about 5.5 · a dip', { cls });
  }
  s += text(x0 - 36, base - 11 * per - (lesson ? 44 : 30), 'energy, kcal/mol', { cls: 'fg-tag', anchor: 'start' });
  return s;
}
FIGURES.push({
  id: 'flip-energy-profile',
  section: 'ring-flips',
  anchor: 'The boat is the small peak between the two twist-boats.</p>',
  alt: 'An energy diagram for the ring flip. From the chair at 0 the curve climbs to a tall peak labeled half-chair at about 10.8 kcal/mol, drops into a dip labeled twist-boat at about 5.5, rises over a small peak labeled boat at about 6.5, drops into a second twist-boat dip, climbs over a second half-chair peak and falls to the other chair at 0.',
  viewBox: '0 0 760 330',
  build() {
    let s = energyProfile(760, { x0: 90, x1: 690, base: 270, per: 18, lesson: false });
    s += text(390, 322, 'one chair → half-chair → twist-boat → boat → twist-boat → half-chair → the other chair', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Peaks are shapes the ring passes through without stopping. Dips are shapes it can rest in briefly.',
});
FIGURES.push({
  id: 'l-profile',
  lessons: ['ring-flips'],
  alt: 'An energy diagram for the ring flip. From the chair at 0 the curve climbs to a tall peak, the half-chair at about 10.8 kcal/mol, drops into a twist-boat dip at about 5.5, rises over a small boat peak at about 6.5, drops into a second twist-boat dip, climbs over a second half-chair peak and falls to the other chair at 0.',
  viewBox: '0 0 340 320',
  build() {
    return energyProfile(340, { x0: 50, x1: 314, base: 270, per: 16, lesson: true });
  },
  caption: 'Energies in kcal/mol, measured from the chair.',
});

/* ------------------------------------------------------ methyl-equilibrium ---
   Methylcyclohexane: the two chairs in a 5 : 95 ratio. */
FIGURES.push({
  id: 'methyl-equilibrium',
  section: 'ring-flips',
  anchor: 'about 95% of the molecules are in the chair that has the methyl equatorial.</p>',
  alt: 'Methylcyclohexane in its two chairs, joined by equilibrium arrows. The left chair, with the methyl axial, is labeled about 5 percent of molecules. The right chair, with the methyl equatorial, is labeled about 95 percent. The arrow pointing toward the equatorial chair is longer.',
  viewBox: '0 0 760 232',
  build() {
    let s = '';
    const A = methylPanel(200, 128, 0.85, false);
    const B = methylPanel(562, 128, 0.85, true);
    s += A.s + B.s;
    s += text(200, 220, 'methyl axial: about 5%', { cls: 'fg-tag-warn' });
    s += text(562, 220, 'methyl equatorial: about 95%', { cls: 'fg-tag-good' });
    s += arrow(P(318, 116), P(446, 116));
    s += arrow(P(410, 136), P(354, 136), { muted: true });
    s += text(382, 100, 'A-value 1.7 kcal/mol', { cls: 'fg-tag' });
    return s;
  },
  caption: 'The longer arrow points to the chair the molecules spend most of their time in.',
});

/* ------------------------------------------------------------ decalin-lock ---
   trans-Decalin. Ring B is ring A translated so that it shares the edge
   A0-A1 (B4 = A0, B3 = A1). Both of ring B's bonds leave ring A through
   equatorial bonds, and the two fusion hydrogens are axial, one up and one
   down: trans. Flip ring A and the bonds ring B needs become axial on
   adjacent carbons, one straight up and one straight down. */
FIGURES.push({
  id: 'decalin-lock',
  section: 'ring-flips',
  anchor: 'so the flip cannot happen and the system is rigid.</p>',
  alt: 'Two panels. Left, trans-decalin: two chairs fused along a shared bond. At the two shared carbons, the fusion hydrogens are axial, one pointing up and one pointing down, and the two bonds into the second ring, highlighted, are equatorial. Right, what flipping the first ring would require: in the flipped chair the two shared carbons now have their axial bonds, drawn as dashed highlighted lines, one pointing straight up and one straight down. The second ring would have to join the ends of those two bonds, which point in opposite directions, and a cross marks that it cannot.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const k = 0.72;
    /* ---- left: trans-decalin ---- */
    const A = ring(150, 170, k, false);
    const t = P((CHAIR_V[0].x - CHAIR_V[4].x) * k, (CHAIR_V[0].y - CHAIR_V[4].y) * k);
    const Bp = CHAIR_V.map((v) => P(150 + v.x * k + t.x, 170 + v.y * k + t.y));
    s += outline(A.pts);
    /* ring B's own bonds; the two that leave ring A are highlighted */
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      if ((i === 3 && j === 4)) continue;          // the shared bond, already drawn
      const leaves = (i === 4 && j === 5) || (i === 2 && j === 3);
      s += bond(Bp[i], Bp[j], { rFrom: 0, rTo: 0, cls: leaves ? 'fg-bond-hi' : 'fg-bond' });
    }
    s += dots(A.pts) + dots(Bp);
    const h0 = A.ax(0, 26), h1 = A.ax(1, 22);
    s += bond(A.pts[0], h0, { rFrom: 0, rTo: 9 }) + atom(h0.x, h0.y, 'H', { r: 9, size: 10 });
    s += bond(A.pts[1], h1, { rFrom: 0, rTo: 9 }) + atom(h1.x, h1.y, 'H', { r: 9, size: 10 });
    s += text(h0.x + 12, h0.y + 8, 'H up', { cls: 'fg-tag', anchor: 'start' });
    s += text(h1.x - 12, h1.y + 4, 'H down', { cls: 'fg-tag', anchor: 'end' });
    s += text(110, 106, 'ring A', { cls: 'fg-tag-mut' });
    s += text(300, 208, 'ring B', { cls: 'fg-tag-mut' });
    s += tag(210, 30, 'trans-decalin');
    s += text(210, 276, 'ring B joins ring A through', { cls: 'fg-tag-good' });
    s += text(210, 294, 'two equatorial bonds', { cls: 'fg-tag-good' });

    s += rule(400, 40, 400, 300);

    /* ---- right: ring A flipped ---- */
    const F = ring(560, 170, k * 1.1, true);
    s += outline(F.pts) + dots(F.pts);
    const u0 = F.ax(0, 58), u1 = F.ax(1, 58);
    s += `<line class="fg-dash-hi" x1="${F.pts[0].x}" y1="${F.pts[0].y}" x2="${u0.x}" y2="${u0.y}"></line>`;
    s += `<line class="fg-dash-hi" x1="${F.pts[1].x}" y1="${F.pts[1].y}" x2="${u1.x}" y2="${u1.y}"></line>`;
    const e0 = F.eq(0, 28), e1 = F.eq(1, 28);
    s += bond(F.pts[0], e0, { rFrom: 0, rTo: 9 }) + atom(e0.x, e0.y, 'H', { r: 9, size: 10 });
    s += bond(F.pts[1], e1, { rFrom: 0, rTo: 9 }) + atom(e1.x, e1.y, 'H', { r: 9, size: 10 });
    const top = u0.y < u1.y ? u0 : u1, bot = u0.y < u1.y ? u1 : u0;
    s += text(top.x - 10, top.y + 4, 'ring B bond: straight up', { cls: 'fg-tag-warn', anchor: 'end' });
    s += text(bot.x - 10, bot.y + 4, 'ring B bond: straight down', { cls: 'fg-tag-warn', anchor: 'end' });
    s += tag(580, 30, 'ring A flipped');
    s += text(580, 276, 'both bonds would be axial, 180° apart:', { cls: 'fg-tag-warn' });
    s += text(580, 294, 'ring B cannot reach across ✗', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Left: the two highlighted bonds are equatorial on ring A. Right: after a flip of ring A they would have to be axial, pointing in opposite directions.',
});

/* ------------------------------------------------------ lesson questions ---
   One chair each, drawn before the flip; the reader works out the flip. */
FIGURES.push({
  id: 'l-q-oh',
  lessons: ['ring-flips'],
  alt: 'A cyclohexane chair. C1, the footrest at the far left, carries an OH group on a vertical axial bond pointing down.',
  viewBox: '0 0 340 230',
  build() {
    let s = '';
    const r = ring(170, 96, 0.95, false);
    s += outline(r.pts) + dots(r.pts);
    s += group(r, 3, 'down', 'OH', { L: 38, r: 16, kind: 'warn' }).s;
    s += text(r.pts[3].x - 10, r.pts[3].y - 6, 'C1', { cls: 'fg-tag', anchor: 'end' });
    s += text(170, 222, 'OH: axial, pointing down', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Before the flip.',
});
FIGURES.push({
  id: 'l-q-trans',
  lessons: ['ring-flips'],
  alt: 'trans-1-Chloro-2-methylcyclohexane in one chair. C1, the headrest at the far right, carries Cl on its equatorial bond, which angles down. C2, next along the top of the ring, carries the methyl on its equatorial bond, which angles up.',
  viewBox: '0 0 340 240',
  build() {
    let s = '';
    const r = ring(170, 110, 0.95, false);
    s += outline(r.pts) + dots(r.pts);
    s += group(r, 0, 'down', 'Cl', { L: 36, r: 15, kind: 'warn' }).s;
    s += group(r, 1, 'up', 'CH₃', { L: 36 }).s;
    s += text(r.pts[0].x + 4, r.pts[0].y - 12, 'C1', { cls: 'fg-tag', anchor: 'start' });
    s += text(r.pts[1].x - 8, r.pts[1].y + 22, 'C2', { cls: 'fg-tag' });
    s += text(170, 212, 'Cl: equatorial, down', { cls: 'fg-tag-warn' });
    s += text(170, 232, 'CH₃: equatorial, up', { cls: 'fg-tag' });
    return s;
  },
  caption: 'Before the flip.',
});
FIGURES.push({
  id: 'l-q-final',
  lessons: ['ring-flips'],
  alt: 'cis-1,3-Dimethylcyclohexane in one chair. The methyls on C1, the headrest at the far right, and on C3, the top-left corner, both sit on vertical axial bonds pointing up.',
  viewBox: '0 0 340 230',
  build() {
    let s = '';
    const r = ring(170, 118, 0.95, false);
    s += outline(r.pts) + dots(r.pts);
    s += group(r, 0, 'up', 'CH₃', { L: 36 }).s + group(r, 2, 'up', 'CH₃', { L: 36 }).s;
    s += text(r.pts[0].x + 8, r.pts[0].y + 16, 'C1', { cls: 'fg-tag', anchor: 'start' });
    s += text(r.pts[2].x - 14, r.pts[2].y + 16, 'C3', { cls: 'fg-tag', anchor: 'end' });
    s += text(170, 222, 'both methyls: axial, pointing up', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Before the flip.',
});

export default FIGURES;
