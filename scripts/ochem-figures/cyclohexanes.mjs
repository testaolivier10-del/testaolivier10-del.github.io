/* Figures for the cyclohexanes notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* Shared drawing helpers, copied from the builder. */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
const CHAIR_EQ = [
  P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104),
  P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104),
];
function chair(cx, cy, k = 1) {
  return CHAIR_V.map((v) => P(cx + v.x * k, cy + v.y * k));
}
const chairRing = (pts, cls) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls })).join('');
/* Axial: straight up on the even carbons, straight down on the odd ones. */
const axialEnd = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? -L : L));
/* Equatorial: outward, and tilted the other way from that carbon's axial. */
const equatorialEnd = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y + CHAIR_EQ[i].y * L);

const FIGURES = [];

/* ---------------------------------------------------------------- ch5.3 ---
   Drawing a chair. The most-needed picture in the chapter, described in
   words only, and every later section depends on being able to do it. */
FIGURES.push({
  id: 'draw-a-chair',
  section: 'cyclohexanes',
  anchor: '<p class="step-body">A drawable chair is a skill worth ten minutes of deliberate practice, because a badly drawn chair makes every axial/equatorial judgement afterwards unreliable. The reliable method: draw two parallel lines offset from each other, then connect their ends with two more pairs of parallel lines, so that the finished shape has <b>three sets of two parallel lines</b>. If your drawing does not have that property, it is not a chair, and the substituent directions will not come out right.</p>',
  alt: 'Four steps building a cyclohexane chair from three pairs of parallel lines, with the finished ring showing its raised and lowered ends',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const bases = [30, 215, 400, 585];
    const labels = [
      ['1 — two parallel lines,', 'offset from each other'],
      ['2 — a second pair,', 'parallel to each other'],
      ['3 — a third pair closes it', '— three pairs in all'],
      ['4 — check the two ends', 'point opposite ways'],
    ];
    bases.forEach((ox, n) => {
      const pts = chair(ox + 66, 168, 0.58);
      const pairs = [[1, 2], [4, 5]];   // drawn first: the shallow pair
      const drawn = [];
      if (n >= 0) drawn.push([1, 2], [4, 5]);
      if (n >= 1) drawn.push([0, 1], [3, 4]);
      if (n >= 2) drawn.push([2, 3], [5, 0]);
      for (const [i, j] of drawn) {
        const hot = (n === 0 && pairs.some(([a, b]) => a === i && b === j)) ||
                    (n === 1 && (i === 0 || i === 3)) ||
                    (n === 2 && (i === 2 || i === 5));
        s += bond(pts[i], pts[j], { rFrom: 0, rTo: 0, cls: hot ? 'fg-bond-hi' : 'fg-bond' });
      }
      if (n === 3) {
        for (const p of pts) s += atom(p.x, p.y, '', { kind: 'point' });
        // The two ends are the highest and lowest vertices, three bonds apart.
        s += bond(pts[2], P(pts[2].x, pts[2].y - 20), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
        s += text(pts[2].x, pts[2].y - 28, 'up end', { cls: 'fg-tag-good', size: 10 });
        s += bond(pts[5], P(pts[5].x, pts[5].y + 20), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
        s += text(pts[5].x, pts[5].y + 34, 'down end', { cls: 'fg-tag-good', size: 10 });
        s += text(ox + 66, 96, 'and four carbons between them', { cls: 'fg-sm', size: 9 });
      }
      s += text(ox + 66, 246, labels[n][0], { cls: 'fg-tag', size: 10.5 });
      s += text(ox + 66, 262, labels[n][1], { cls: 'fg-sm', size: 9.5 });
    });
    s += tag(380, 36, 'A CHAIR IS THREE PAIRS OF PARALLEL LINES — NOTHING ELSE');
    for (const x of [200, 385, 570]) s += rule(x, 62, x, 226);
    return s;
  },
  caption: 'Build it in pairs and it comes out right every time. Each step adds <b>two lines that are parallel to each other</b>, and after three steps the ring is closed and has no other property to check. A drawing that does not decompose into three such pairs is not a chair, and every axial/equatorial call made on it afterwards will be unreliable.',
  note: 'The last panel is the test worth doing on your own drawings: the two ends must point in opposite directions, one up and one down, with the other four carbons level between them. If both ends point the same way you have drawn a boat; if all six are level you have drawn a flat hexagon with a kink in it.',
});

export default FIGURES;
