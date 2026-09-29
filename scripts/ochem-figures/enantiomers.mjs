/* Figures for the enantiomers notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every enantiomer pair is drawn as a true reflection across a dashed mirror
   line, with its R/S descriptors written on the drawing. The descriptors were
   worked out from the drawn angles (lowest priority on the hash, so the
   1 -> 2 -> 3 turn is read as drawn), and the comment above each drawing
   records the check. */
import { atom as atom0, bond, wedge, hash, arrow, curve, lonePair, text, tag, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

const r2 = (v) => Math.round(v * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;
/* Screen point at `deg` (0 = east, counterclockwise) and distance `len`. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);

/* An atom disc that stays opaque in both themes. */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
const rOf = (l) => (l.length >= 4 ? 20 : l.length === 3 ? 17 : l === 'H' ? 12 : 15);
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const sm = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-sm', size: 10.5, anchor });
const tg = (x, y, s, anchor = 'middle', cls = 'fg-tag') => text(x, y, s, { cls, size: 11, anchor });

/* A group bonded to `from`. o.bond: 'wedge' | 'hash'; o.rFrom: radius of the
   atom it starts from (0 for a skeletal vertex). */
function arm(from, deg, len, l, o = {}) {
  const e = at(from, deg, len);
  const r = l ? (o.r ?? rOf(l)) : 0;
  const rFrom = o.rFrom ?? 16;
  let s = o.bond === 'wedge' ? wedge(from, e, { rFrom, rTo: r, width: 9 })
        : o.bond === 'hash' ? hash(from, e, { rFrom, rTo: r, width: 10, rungs: 5 })
        : bond(from, e, { rFrom, rTo: r, cls: o.cls });
  if (l) s += atom(e.x, e.y, l, { r, kind: o.kind });
  return s;
}
/* A skeletal bond between two bare vertices. */
const skb = (a, b) => bond(a, b, { rFrom: 0, rTo: 0 });
const vline = (x, y1, y2) => `<line class="fg-dash" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"></line>`;
const hline = (x1, x2, y) => `<line class="fg-dash" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"></line>`;

/* A stereocenter drawn with two groups in the plane (up and down) and one
   wedge and one hash to the sides. `right` is the group on the wedge when
   `wedgeRight` is true; the mirror image puts it on the left. */
function upright(c, top, bottom, wedged, hashed, wedgeRight) {
  let s = '';
  s += arm(c, 90, 54, top);
  s += arm(c, 270, 54, bottom);
  s += arm(c, wedgeRight ? 20 : 160, 52, wedged, { bond: 'wedge' });
  s += arm(c, wedgeRight ? 160 : 20, 44, hashed, { bond: 'hash' });
  s += atom(c.x, c.y, 'C');
  return s;
}

/* ------------------------------------------------------------------------
   1. The alanine pair. Priorities NH2 > COOH > CH3 > H, and H is on the hash.
   Left: NH2 at 20 deg, COOH at 90, CH3 at 270. Counterclockwise order of
   those angles is NH2 -> COOH -> CH3, so 1 -> 2 -> 3 turns counterclockwise:
   (S). The right-hand drawing is its reflection: (R). */
FIGURES.push({
  id: 'alanine-pair',
  section: 'enantiomers',
  lessons: ['enantiomers'],
  anchor: '<h3>The definition</h3>',
  alt: 'Two alanine molecules reflected across a dashed vertical mirror line. On the left, (S)-alanine: COOH up, CH3 down, NH2 on a wedge to the right and H on a hash to the left. On the right, (R)-alanine: the same drawing reflected, with H2N on a wedge to the left and H on a hash to the right.',
  viewBox: '0 0 340 232',
  build() {
    let s = '';
    s += upright(P(85, 122), 'COOH', 'CH₃', 'NH₂', 'H', true);
    s += upright(P(255, 122), 'COOH', 'CH₃', 'H₂N', 'H', false);
    s += vline(170, 44, 196);
    s += tg(85, 24, '(S)-alanine');
    s += tg(255, 24, '(R)-alanine');
    s += tg(170, 218, 'mirror', 'middle', 'fg-tag-mut');
    return s;
  },
  caption: 'Each drawing is the reflection of the other in the dashed mirror. Only NH₂ (on the wedge) and H (on the hash) swap sides; COOH and CH₃ stay put. That alone turns (S) into (R).',
});

/* ------------------------------------------------------------------------
   2. Two stereocenters: 3-bromobutan-2-ol.
   Left drawing, vertices C1 (70,140) C2 (108,118) C3 (146,140) C4 (184,118),
   OH on a wedge up from C2, Br on a wedge down from C3; each H is implicit
   and points back.
   C2: OH 90, C3 330, C1 210. Counterclockwise order is OH, C1, C3, so
       OH -> C3 -> C1 is clockwise: R.
   C3: Br 270, C2 150, C4 30. Counterclockwise order is C4, C2, Br, so
       Br -> C2 -> C4 is clockwise: R.
   The middle drawing is the reflection (2S,3S). The right drawing is the
   left one with only the Br moved to a hash, which inverts C3: (2R,3S). */
function bromobutanol(dx, mirror, brBond) {
  const X = (x) => (mirror ? 520 - x : x + dx);
  const C1 = P(X(70), 140), C2 = P(X(108), 118), C3 = P(X(146), 140), C4 = P(X(184), 118);
  let s = skb(C1, C2) + skb(C2, C3) + skb(C3, C4);
  s += arm(C2, 90, 48, 'OH', { bond: 'wedge', rFrom: 0 });
  s += arm(C3, 270, 48, 'Br', { bond: brBond, rFrom: 0 });
  return { s, C2, C3 };
}
FIGURES.push({
  id: 'two-centers',
  section: 'enantiomers',
  anchor: '<h3>The definition</h3>',
  alt: 'Three drawings of 3-bromobutan-2-ol. Left, (2R,3R) with OH and Br both on wedges. Middle, its reflection across a dashed mirror line, (2S,3S). Right, set apart, (2R,3S): the left drawing with only the Br moved to a hash. It is not a mirror image of the left drawing, so it is a diastereomer.',
  viewBox: '0 0 760 268',
  build() {
    let s = '';
    const A = bromobutanol(0, false, 'wedge');
    const B = bromobutanol(0, true, 'wedge');
    const C = bromobutanol(470, false, 'hash');
    s += A.s + B.s + C.s;
    const desc = (c, dx, dy, t, cls) => tg(c.x + dx, c.y + dy, t, 'middle', cls);
    s += desc(A.C2, -22, -8, 'R', 'fg-tag') + desc(A.C3, 22, 20, 'R', 'fg-tag');
    s += desc(B.C2, 22, -8, 'S', 'fg-tag') + desc(B.C3, -22, 20, 'S', 'fg-tag');
    s += desc(C.C2, -22, -8, 'R', 'fg-tag') + desc(C.C3, 22, 20, 'S', 'fg-tag');
    s += vline(260, 52, 206);
    s += tg(260, 226, 'mirror', 'middle', 'fg-tag-mut');
    s += tg(127, 226, '(2R,3R)');
    s += tg(393, 226, '(2S,3S)');
    s += tg(597, 226, '(2R,3S)');
    s += tg(260, 30, 'ENANTIOMERS: BOTH CENTERS INVERTED');
    s += `<line class="fg-rule" x1="520" y1="44" x2="520" y2="262"></line>`;
    s += tg(597, 30, 'ONLY C3 INVERTED');
    s += sm(597, 244, 'a diastereomer,');
    s += sm(597, 258, 'not a mirror image');
    s += sm(127, 244, 'OH and Br both on wedges');
    s += sm(393, 244, 'its reflection');
    return s;
  },
  caption: 'The letters beside each carbon are its descriptors. Across the mirror both letters change; in the drawing on the right only one does.',
});

/* ------------------------------------------------------------------------
   3. The polarimeter, drawn left to right for the notes. */
FIGURES.push({
  id: 'polarimeter',
  section: 'enantiomers',
  anchor: '<h3>Specific rotation</h3>',
  alt: 'A polarimeter drawn left to right: a sodium lamp emitting light vibrating in every plane, a polarizer that passes only the vertical plane, a sample tube of length l holding a solution of concentration c, the emerging plane tilted by an angle alpha, and an analyzer turned by alpha to find the new plane.',
  viewBox: '0 0 760 256',
  build() {
    let s = '';
    const beam = 150;
    // a bundle of vibration planes, drawn as short strokes across the beam
    const ticks = (x0, x1, degs, cls) => {
      let g = '';
      for (let x = x0; x <= x1; x += 18) {
        for (const d of degs) {
          const r = rad(d), L = 15;
          g += `<line class="${cls}" x1="${r2(x - Math.cos(r) * L)}" y1="${r2(beam - Math.sin(r) * L)}" x2="${r2(x + Math.cos(r) * L)}" y2="${r2(beam + Math.sin(r) * L)}"></line>`;
        }
      }
      return g;
    };
    s += atom(46, beam, '', { r: 22, kind: 'hi' });
    s += text(46, beam + 4, 'Na', { cls: 'fg-lbl', size: 12 });
    s += sm(46, 210, 'sodium lamp');
    s += sm(46, 226, '589 nm');

    s += ticks(84, 148, [0, 45, 90, 135], 'fg-bond-soft');
    s += sm(116, 100, 'every plane');

    s += bar(170, beam - 44, 14, 88, { kind: 'mut', r: 4 });
    s += sm(177, 212, 'polarizer');
    s += sm(177, 228, 'passes one plane');

    s += ticks(206, 250, [90], 'fg-bond-hi');
    s += text(228, 100, 'one plane', { cls: 'fg-tag-good', size: 10 });

    s += panel(268, beam - 40, 200, 80, { kind: 'hi' });
    s += text(368, beam - 6, 'sample solution', { cls: 'fg-lbl', size: 11 });
    s += sm(368, beam + 14, 'concentration c, in g/mL');
    s += arrow(P(268, 212), P(468, 212), { muted: true, size: 7 });
    s += arrow(P(468, 212), P(268, 212), { muted: true, size: 7 });
    s += text(368, 236, 'path length l, in decimeters', { cls: 'fg-tag', size: 10.5 });

    // the turned plane, with the original plane dashed behind it
    s += `<line class="fg-dash-hi" x1="510" y1="${beam - 46}" x2="510" y2="${beam + 46}"></line>`;
    s += `<line class="fg-bond-hi" x1="${r2(510 - Math.cos(Math.PI / 3) * 46)}" y1="${r2(beam - Math.sin(Math.PI / 3) * 46)}" x2="${r2(510 + Math.cos(Math.PI / 3) * 46)}" y2="${r2(beam + Math.sin(Math.PI / 3) * 46)}"></line>`;
    s += text(532, beam - 4, 'α', { cls: 'fg-tag-good', size: 14, anchor: 'start' });
    s += text(508, 76, 'plane now', { cls: 'fg-tag-good', size: 10 });
    s += text(508, 90, 'turned by α', { cls: 'fg-tag-good', size: 10 });

    s += bar(556, beam - 44, 14, 88, { kind: 'mut', r: 4 });
    s += sm(563, 212, 'analyzer');
    s += sm(563, 228, 'turned until light returns');

    s += atom(700, beam, '', { r: 22 });
    s += text(700, beam + 4, 'eye', { cls: 'fg-lbl', size: 12 });
    s += sm(700, 212, 'observer');

    s += tag(380, 40, 'THE INSTRUMENT MEASURES α');
    return s;
  },
  caption: 'Follow the light from left to right. The solid line after the sample is the plane the light now vibrates in; the dashed line is where it started, and the angle between them is α.',
});

/* The same instrument stacked top to bottom for the lesson. */
FIGURES.push({
  id: 'l-polarimeter',
  lessons: ['enantiomers'],
  alt: 'A polarimeter drawn top to bottom: a lamp giving light in every plane, a polarizer that passes one plane, a sample tube of length l, the plane coming out turned by an angle alpha from the dashed starting plane, and an analyzer turned until the light returns.',
  viewBox: '0 0 340 372',
  build() {
    let s = '';
    const x = 70;
    const ticks = (y0, y1, degs, cls) => {
      let g = '';
      for (let y = y0; y <= y1; y += 16) {
        for (const d of degs) {
          const r = rad(d), L = 14;
          g += `<line class="${cls}" x1="${r2(x - Math.cos(r) * L)}" y1="${r2(y - Math.sin(r) * L)}" x2="${r2(x + Math.cos(r) * L)}" y2="${r2(y + Math.sin(r) * L)}"></line>`;
        }
      }
      return g;
    };
    s += atom(x, 30, '', { r: 18, kind: 'hi' });
    s += lbl(x, 35, 'Na');
    s += lbl(118, 35, 'lamp', 'start');
    s += ticks(62, 78, [0, 45, 90, 135], 'fg-bond-soft');
    s += tg(118, 74, 'light in every plane', 'start', 'fg-tag-mut');
    s += bar(x - 40, 94, 80, 12, { kind: 'mut', r: 4 });
    s += lbl(118, 105, 'polarizer', 'start');
    s += ticks(122, 138, [0], 'fg-bond-hi');
    s += tg(118, 134, 'one plane only', 'start', 'fg-tag-good');
    s += panel(x - 34, 154, 68, 84, { kind: 'hi' });
    s += lbl(x, 201, 'sample', 'middle');
    s += lbl(118, 186, 'tube of sample', 'start');
    s += tg(118, 206, 'length l (dm)', 'start');
    s += tg(118, 224, 'concentration c (g/mL)', 'start');
    // turned plane
    s += `<line class="fg-dash-hi" x1="${x - 26}" y1="270" x2="${x + 26}" y2="270"></line>`;
    const r = rad(30), L = 28;
    s += `<line class="fg-bond-hi" x1="${r2(x - Math.cos(r) * L)}" y1="${r2(270 + Math.sin(r) * L)}" x2="${r2(x + Math.cos(r) * L)}" y2="${r2(270 - Math.sin(r) * L)}"></line>`;
    s += tg(x + 34, 262, 'α', 'start', 'fg-tag-good');
    s += tg(118, 276, 'plane turned by α', 'start', 'fg-tag-good');
    s += bar(x - 40, 300, 80, 12, { kind: 'mut', r: 4 });
    s += lbl(118, 311, 'analyzer', 'start');
    s += tg(118, 331, 'turned until light returns;', 'start', 'fg-tag-mut');
    s += tg(118, 349, 'the turn is α', 'start', 'fg-tag-mut');
    return s;
  },
  caption: 'Light travels down the page. The solid line under the sample is the new plane of vibration; the dashed line is where it started.',
});

/* ------------------------------------------------------------------------
   4. A flat carbocation meeting bromide from either face.
   Cation: CH3 in the plane at 180, C2H5 wedge at 330, H hash at 30.
   From above: Br 90, CH3 210, C2H5 wedge 300, H hash 350. Priorities
   Br > C2H5 > CH3 > H with H on the hash. Counterclockwise order of the
   three is Br (90), CH3 (210), C2H5 (300), so Br -> C2H5 -> CH3 runs
   clockwise: (R). From below is the reflection in the horizontal mirror: (S). */
FIGURES.push({
  id: 'racemization-faces',
  section: 'enantiomers',
  anchor: '<h3>Racemic mixtures</h3>',
  alt: 'The butan-2-yl cation seen edge-on, flat, with an empty p orbital above and below the carbon. A bromide ion above and one below each attack the carbon with a curved arrow from a lone pair. Attack from above gives (R)-2-bromobutane with Br up; attack from below gives (S)-2-bromobutane with Br down, its mirror image across a dashed horizontal line.',
  viewBox: '0 0 760 350',
  build() {
    let s = '';
    const c = P(200, 175);
    s += lobeE(c.x, c.y - 44, 20, 32);
    s += lobeE(c.x, c.y + 44, 20, 32);
    s += arm(c, 180, 66, 'H₃C');
    s += arm(c, 330, 66, 'C₂H₅', { bond: 'wedge', r: 20 });
    s += arm(c, 30, 50, 'H', { bond: 'hash' });
    s += atom(c.x, c.y, 'C', { kind: 'warn' });
    s += text(c.x - 22, c.y - 10, '+', { cls: 'fg-warn', size: 16 });
    s += sm(c.x - 28, c.y - 56, 'empty p orbital', 'end');
    const bromide = (p, pairDeg) => {
      let g = atom(p.x, p.y, 'Br');
      for (const d of [0, 90, 180, 270]) g += lonePair(p.x, p.y, d, { dist: 22, spread: 4.5, r: 2.3 });
      g += text(p.x + 24, p.y - 14, '−', { cls: 'fg-warn', size: 15 });
      return g;
    };
    const b1 = P(c.x, 44), b2 = P(c.x, 306);
    s += bromide(b1) + bromide(b2);
    s += curve(P(b1.x, b1.y + 26), P(c.x, c.y - 24), { bow: 12 });
    s += curve(P(b2.x, b2.y - 26), P(c.x, c.y + 24), { bow: -12 });
    s += sm(c.x + 36, 64, 'from above', 'start');
    s += sm(c.x + 36, 294, 'from below', 'start');
    s += tg(36, 28, 'FLAT CATION:', 'start');
    s += tg(36, 46, 'BOTH FACES OPEN', 'start');

    s += arrow(P(330, 150), P(420, 104), { muted: true });
    s += arrow(P(330, 200), P(420, 246), { muted: true });

    const A = P(510, 92);
    s += arm(A, 90, 46, 'Br', { kind: 'hi' });
    s += arm(A, 210, 58, 'H₃C');
    s += arm(A, 300, 56, 'C₂H₅', { bond: 'wedge', r: 20 });
    s += arm(A, 350, 46, 'H', { bond: 'hash' });
    s += atom(A.x, A.y, 'C');
    const B = P(510, 258);
    s += arm(B, 270, 46, 'Br', { kind: 'hi' });
    s += arm(B, 150, 58, 'H₃C');
    s += arm(B, 60, 56, 'C₂H₅', { bond: 'wedge', r: 20 });
    s += arm(B, 10, 46, 'H', { bond: 'hash' });
    s += atom(B.x, B.y, 'C');
    s += hline(430, 612, 175);
    s += sm(618, 179, 'mirror', 'start');
    s += tg(740, 90, '(R)-2-bromobutane', 'end');
    s += tg(740, 262, '(S)-2-bromobutane', 'end');
    s += tg(748, 202, '50 : 50, a racemic mixture', 'end');
    return s;
  },
  caption: 'The cation is flat, so bromide can bond to either face. Compare the two products across the dashed mirror: every group bends away from the side the bromide came from.',
});

/* ------------------------------------------------------------------------
   5. Two ways a racemate can crystallize. */
FIGURES.push({
  id: 'racemate-solids',
  section: 'enantiomers',
  anchor: '<h3>Racemic mixtures</h3>',
  alt: 'Left, a racemic compound: one crystal whose lattice alternates R and S molecules in a 1 to 1 pattern. Right, a conglomerate: two separate crystals, one containing only R molecules and the other only S molecules.',
  viewBox: '0 0 620 250',
  build() {
    let s = '';
    const grid = (x0, y0, cols, rows, pick) => {
      let g = '';
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const v = pick(i, j);
          g += text(x0 + i * 30, y0 + j * 28, v, { cls: v === 'R' ? 'fg-tag-good' : 'fg-tag-warn', size: 11 });
        }
      }
      return g;
    };
    s += tg(150, 28, 'RACEMIC COMPOUND');
    s += panel(40, 50, 220, 130, { kind: 'hi' });
    s += grid(65, 80, 7, 4, (i, j) => ((i + j) % 2 ? 'S' : 'R'));
    s += sm(150, 204, 'one kind of crystal,');
    s += sm(150, 220, 'R and S side by side in a 1 : 1 pattern');

    s += `<line class="fg-rule" x1="310" y1="40" x2="310" y2="230"></line>`;
    s += tg(465, 28, 'CONGLOMERATE');
    s += panel(350, 60, 116, 110, { kind: 'good' });
    s += grid(363, 90, 4, 3, () => 'R');
    s += panel(484, 60, 116, 110, { kind: 'warn' });
    s += grid(497, 90, 4, 3, () => 'S');
    s += sm(465, 204, 'two kinds of crystal,');
    s += sm(465, 220, 'each holding only R or only S');
    return s;
  },
  caption: 'Both solids hold equal numbers of R and S molecules. What differs is whether each single crystal holds both, or only one.',
});

/* ------------------------------------------------------------------------
   6. Enantiomeric excess as a bar: 90% (S) + 10% (R) is 80% excess (S)
   plus 20% racemate. */
FIGURES.push({
  id: 'ee-bar',
  section: 'enantiomers',
  lessons: ['enantiomers'],
  anchor: '<h3>Enantiomeric excess</h3>',
  alt: 'Two bars for a sample that is 90 percent (S) and 10 percent (R). The first bar is split 90 to 10. The second regroups the same sample as 80 percent excess (S) and 20 percent racemic mixture, made of 10 percent (S) paired with 10 percent (R). Underneath: ee = 90 minus 10 = 80 percent.',
  viewBox: '0 0 340 236',
  build() {
    let s = '';
    const X = 20, W = 300, px = (p) => X + (W * p) / 100;
    s += tg(170, 22, 'a sample: 90% (S), 10% (R)');
    s += bar(px(0), 36, px(90) - px(0) - 2, 30, { kind: 'good', opacity: 0.55, r: 4 });
    s += bar(px(90), 36, px(100) - px(90), 30, { kind: 'warn', opacity: 0.55, r: 4 });
    s += tg(px(45), 88, '(S) 90%', 'middle', 'fg-tag-good');
    s += tg(px(100), 88, '(R) 10%', 'end', 'fg-tag-warn');

    s += tg(170, 124, 'the same sample, regrouped');
    s += bar(px(0), 138, px(80) - px(0) - 2, 30, { kind: 'good', opacity: 0.55, r: 4 });
    s += bar(px(80), 138, px(90) - px(80) - 2, 30, { kind: 'good', opacity: 0.25, r: 4 });
    s += bar(px(90), 138, px(100) - px(90), 30, { kind: 'warn', opacity: 0.55, r: 4 });
    s += tg(px(40), 190, 'excess (S) 80%', 'middle', 'fg-tag-good');
    s += tg(px(100), 190, 'racemic 20%', 'end', 'fg-tag-mut');
    s += tg(170, 222, 'ee = 90 − 10 = 80%');
    return s;
  },
  caption: 'Both bars show the same sample. In the lower one, compare the pale block of (S) that pairs off with the (R) against the long block of (S) that has no partner.',
});

/* ------------------------------------------------------------------------
   7. One receptor, two enantiomers, seen from above with H toward you.
   With H toward the viewer, (S)-alanine shows NH2 -> COOH -> CH3 turning
   clockwise: NH2 at 90, COOH at 330, CH3 at 210. The reflection, (R), puts
   COOH at 210 and CH3 at 330, onto the wrong sites. */
FIGURES.push({
  id: 'chiral-partner',
  section: 'enantiomers',
  lessons: ['enantiomers'],
  anchor: '<h3>Why they behave differently in biology</h3>',
  alt: 'Two alanine molecules seen from above, each resting on the same receptor, which has three binding sites: one for NH2 at the top, one for COOH at lower right and one for CH3 at lower left. H points toward the viewer in both. (S)-alanine puts all three groups on their own sites. (R)-alanine, its mirror image, puts NH2 on its site but COOH and CH3 on each other’s sites.',
  viewBox: '0 0 340 244',
  build() {
    let s = '';
    s += tg(170, 18, 'same receptor; H points toward you', 'middle', 'fg-tag-mut');
    const site = { NH: 90, CO: 330, CH: 210 };
    const pane = (cx, groups, ok) => {
      const c = P(cx, 118);
      let g = panel(cx - 78, 38, 156, 170);
      for (const [k, deg] of Object.entries(site)) {
        const p = at(c, deg, 52);
        const good = groups[k] === k;
        g += `<rect class="${good ? 'fg-panel-good' : 'fg-panel-warn'}" x="${r2(p.x - 24)}" y="${r2(p.y - 17)}" width="48" height="34" rx="17"></rect>`;
      }
      const name = { NH: 'NH₂', CO: 'COOH', CH: 'CH₃' };
      for (const [k, deg] of Object.entries(site)) {
        const p = at(c, deg, 52);
        g += bond(c, p, { rFrom: 15, rTo: 18 });
        g += lbl(p.x, p.y + 5, name[groups[k]]);
      }
      g += atom(c.x, c.y, 'C');
      g += tg(cx, 224, ok ? '(S): all three sites' : '(R): two sites miss', 'middle', ok ? 'fg-tag-good' : 'fg-tag-warn');
      return g;
    };
    s += pane(84, { NH: 'NH', CO: 'CO', CH: 'CH' }, true);
    s += pane(256, { NH: 'NH', CO: 'CH', CH: 'CO' }, false);
    return s;
  },
  caption: 'Green sites hold the group they were built for; red sites hold the wrong one. Turning (R)-alanine only moves the mismatch to other sites.',
});

/* ------------------------------------------------------------------------
   8. Resolving racemic ibuprofen with one enantiomer of an amine.
   Ibuprofen's stereocenter: COOH > Ar > CH3 > H, H on the hash.
   Left drawing: COOH 90, Ar 20 (wedge), CH3 270. Counterclockwise order is
   Ar, COOH, CH3, so COOH -> Ar -> CH3 runs clockwise: (R). The reflection
   is (S). */
FIGURES.push({
  id: 'resolution-scheme',
  section: 'enantiomers',
  anchor: '<h3>Separating enantiomers</h3>',
  alt: 'Resolution of racemic ibuprofen. Top row: (R)- and (S)-ibuprofen drawn as mirror images; adding (S)-1-phenylethylamine gives two salts, (R)-acid with (S)-amine and (S)-acid with (S)-amine, which are diastereomers with different solubilities. Bottom row: the less soluble salt crystallizes and is filtered off; adding aqueous HCl to it frees ibuprofen enriched in one enantiomer (recrystallizing the salt first makes it essentially pure). The more soluble salt stays in solution; HCl frees ibuprofen enriched in the other enantiomer.',
  viewBox: '0 0 760 392',
  build() {
    let s = '';
    s += tg(160, 28, 'RACEMIC IBUPROFEN');
    s += upright(P(90, 122), 'COOH', 'CH₃', 'Ar', 'H', true);
    s += upright(P(230, 122), 'COOH', 'CH₃', 'Ar', 'H', false);
    s += vline(160, 50, 196);
    s += tg(90, 214, '(R)');
    s += tg(230, 214, '(S)');
    s += sm(160, 232, 'mirror images: same solubility');

    s += arrow(P(318, 122), P(404, 122));
    s += tg(361, 106, '+ (S)-amine', 'middle', 'fg-tag-good');
    s += sm(361, 142, 'one enantiomer');

    s += panel(420, 56, 300, 52, { kind: 'hi' });
    s += lbl(570, 87, '(R)-acid · (S)-amine salt');
    s += panel(420, 136, 300, 52, { kind: 'hi' });
    s += lbl(570, 167, '(S)-acid · (S)-amine salt');
    s += tg(570, 214, 'not mirror images: diastereomers');
    s += sm(570, 232, 'so their solubilities differ');

    s += rule(24, 252, 736, 252);
    s += panel(24, 270, 236, 44, { kind: 'good' });
    s += lbl(142, 297, 'less soluble salt: crystals');
    s += panel(24, 326, 236, 44, {});
    s += lbl(142, 353, 'more soluble salt: solution');
    s += arrow(P(270, 292), P(380, 292));
    s += arrow(P(270, 348), P(380, 348));
    s += tg(325, 282, '+ HCl(aq)');
    s += tg(325, 338, '+ HCl(aq)');
    s += panel(392, 270, 344, 44, { kind: 'good' });
    s += lbl(564, 297, 'ibuprofen enriched in one enantiomer');
    s += panel(392, 326, 344, 44, {});
    s += lbl(564, 353, 'ibuprofen rich in the other enantiomer');
    s += sm(380, 386, 'Ar = the 4-(2-methylpropyl)phenyl ring;  (S)-amine = (S)-1-phenylethylamine');
    return s;
  },
  caption: 'The top row makes the two salts. The bottom row takes each salt apart again.',
});

/* The same resolution stacked for the lesson. */
FIGURES.push({
  id: 'l-resolution',
  lessons: ['enantiomers'],
  alt: 'Resolution stacked top to bottom: racemic ibuprofen, a mix of (R) and (S) acid with the same solubility; add one enantiomer of an amine; two salts, (R)-acid with (S)-amine and (S)-acid with (S)-amine, which are diastereomers; crystallize and add acid; the crystals give mostly one enantiomer of ibuprofen, and the solution is rich in the other.',
  viewBox: '0 0 340 420',
  build() {
    let s = '';
    s += panel(60, 12, 220, 56, { kind: 'warn' });
    s += lbl(170, 36, '(R)-acid + (S)-acid');
    s += tg(170, 56, 'mirror images: same solubility', 'middle', 'fg-tag-mut');
    s += arrow(P(170, 74), P(170, 116));
    s += tg(180, 100, '+ (S)-amine', 'start', 'fg-tag-good');
    s += panel(12, 124, 152, 60, { kind: 'hi' });
    s += lbl(88, 149, '(R)-acid ·');
    s += lbl(88, 169, '(S)-amine');
    s += panel(176, 124, 152, 60, { kind: 'hi' });
    s += lbl(252, 149, '(S)-acid ·');
    s += lbl(252, 169, '(S)-amine');
    s += tg(170, 206, 'diastereomers: solubilities differ');
    s += arrow(P(88, 216), P(88, 262));
    s += arrow(P(252, 216), P(252, 262));
    s += tg(170, 236, 'crystallize,', 'middle', 'fg-tag-mut');
    s += tg(170, 252, 'then add HCl', 'middle', 'fg-tag-mut');
    s += panel(12, 270, 152, 60, { kind: 'good' });
    s += lbl(88, 290, 'from crystals:');
    s += lbl(88, 306, 'mostly one');
    s += lbl(88, 322, 'enantiomer');
    s += panel(176, 270, 152, 60, {});
    s += lbl(252, 290, 'from solution:');
    s += lbl(252, 306, 'rich in');
    s += lbl(252, 322, 'the other');
    s += tg(170, 356, 'the amine is recovered and reused', 'middle', 'fg-tag-mut');
    s += tg(170, 386, 'acid = ibuprofen', 'middle', 'fg-tag-mut');
    s += tg(170, 404, 'amine = (S)-1-phenylethylamine', 'middle', 'fg-tag-mut');
    return s;
  },
  caption: 'The amine is a single enantiomer, so the two salts are not mirror images. That difference is what crystallization can act on.',
});

/* The racemization picture stacked into 340 for the lesson. Same geometry
   and the same R/S checks as racemization-faces. */
FIGURES.push({
  id: 'l-racemization-faces',
  lessons: ['enantiomers'],
  alt: 'A flat butan-2-yl cation with an empty p orbital above and below the carbon. Bromide ions above and below attack with curved arrows. Attack from above gives (R)-2-bromobutane with Br up; attack from below gives (S)-2-bromobutane with Br down, its mirror image across a dashed line. The two form 50:50, a racemic mixture.',
  viewBox: '0 0 340 404',
  build() {
    let s = '';
    const c = P(88, 200);
    s += lobeE(c.x, c.y - 44, 20, 32);
    s += lobeE(c.x, c.y + 44, 20, 32);
    s += arm(c, 180, 58, 'H₃C');
    s += arm(c, 330, 62, 'C₂H₅', { bond: 'wedge', r: 20 });
    s += arm(c, 30, 48, 'H', { bond: 'hash' });
    s += atom(c.x, c.y, 'C', { kind: 'warn' });
    s += text(c.x - 22, c.y - 10, '+', { cls: 'fg-warn', size: 16 });
    const bromide = (p) => {
      let g = atom(p.x, p.y, 'Br');
      for (const d of [0, 90, 180, 270]) g += lonePair(p.x, p.y, d, { dist: 22, spread: 4.5, r: 2.3 });
      g += text(p.x + 24, p.y - 14, '−', { cls: 'fg-warn', size: 15 });
      return g;
    };
    const b1 = P(c.x, 68), b2 = P(c.x, 332);
    s += bromide(b1) + bromide(b2);
    s += curve(P(b1.x, b1.y + 26), P(c.x, c.y - 24), { bow: 12 });
    s += curve(P(b2.x, b2.y - 26), P(c.x, c.y + 24), { bow: -12 });
    s += tg(8, 18, 'FLAT CATION: BOTH FACES OPEN', 'start');

    s += arrow(P(152, 132), P(190, 112), { muted: true });
    s += arrow(P(168, 244), P(194, 262), { muted: true });

    const A = P(262, 112);
    s += arm(A, 90, 46, 'Br', { kind: 'hi' });
    s += arm(A, 210, 52, 'H₃C');
    s += arm(A, 300, 52, 'C₂H₅', { bond: 'wedge', r: 20 });
    s += arm(A, 350, 42, 'H', { bond: 'hash' });
    s += atom(A.x, A.y, 'C');
    const B = P(262, 288);
    s += arm(B, 270, 46, 'Br', { kind: 'hi' });
    s += arm(B, 150, 52, 'H₃C');
    s += arm(B, 60, 52, 'C₂H₅', { bond: 'wedge', r: 20 });
    s += arm(B, 10, 42, 'H', { bond: 'hash' });
    s += atom(B.x, B.y, 'C');
    s += hline(196, 336, 200);
    s += tg(336, 194, 'mirror', 'end', 'fg-tag-mut');
    s += tg(262, 42, '(R)-2-bromobutane');
    s += tg(262, 370, '(S)-2-bromobutane');
    s += tg(170, 396, '50 : 50, a racemic mixture');
    return s;
  },
  caption: 'Follow each bromide to the product it gives. The dashed line is the mirror between them.',
});

export default FIGURES;
