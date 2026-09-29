/* Figures for the stereocenters notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- ch6.3 ---
   Nitrogen inversion, which the section describes as an umbrella turning
   itself inside out and then does not draw. */
FIGURES.push({
  id: 'nitrogen-inversion',
  section: 'stereocenters',
  anchor: 'Quaternary ammonium salts, which have four groups and no lone pair, cannot invert and <i>are</i> genuine stereocenters.</div>',
  alt: 'An amine nitrogen shown pyramidal with its lone pair up, flattening through a planar transition state in which the lone pair occupies a p orbital, and arriving at the inverted pyramid with the lone pair down.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    const pyramid = (cx, down) => {
      const n = P(cx, 150);
      const sgn = down ? -1 : 1;
      const a = P(cx - 52, 150 + 26 * sgn), b = P(cx + 52, 150 + 26 * sgn), c = P(cx, 150 + 52 * sgn);
      let g = bond(n, a, { rTo: 14 });
      g += bond(n, b, { rTo: 14 });
      g += (sgn > 0 ? wedge : hash)(n, c, { rTo: 14, width: 9, rungs: 4 });
      g += atom(a.x, a.y, 'R¹', { r: 14, size: 10 });
      g += atom(b.x, b.y, 'R²', { r: 14, size: 10 });
      g += atom(c.x, c.y, 'R³', { r: 14, size: 10 });
      g += atom(n.x, n.y, 'N', { kind: 'hi' });
      g += lonePair(n.x, n.y, down ? 90 : -90, { dist: 24 });
      g += text(cx, down ? 202 : 106, down ? 'lone pair now points down' : 'lone pair points up', { cls: 'fg-sm', size: 9.5 });
      return g;
    };
    s += panel(20, 54, 200, 182, { kind: 'hi' });
    s += pyramid(120, false);
    s += text(120, 258, 'pyramidal', { cls: 'fg-tag-good', size: 11 });

    s += panel(280, 54, 200, 182, { kind: 'warn' });
    const n = P(380, 150);
    s += bond(n, P(324, 150), { rTo: 14 });
    s += bond(n, P(436, 150), { rTo: 14 });
    s += bond(n, P(380, 206), { rTo: 14 });
    s += atom(324, 150, 'R¹', { r: 14, size: 10 });
    s += atom(436, 150, 'R²', { r: 14, size: 10 });
    s += atom(380, 206, 'R³', { r: 14, size: 10 });
    s += atom(n.x, n.y, 'N', { kind: 'warn' });
    s += lonePair(n.x, n.y, -90, { dist: 24 });
    s += text(380, 88, 'all three groups flat,', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 102, 'lone pair in a p orbital', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 258, 'planar transition state', { cls: 'fg-tag-warn', size: 11 });

    s += panel(540, 54, 200, 182, { kind: 'hi' });
    s += pyramid(640, true);
    s += text(640, 258, 'pyramidal, inverted', { cls: 'fg-tag-good', size: 11 });

    s += arrow(P(232, 140), P(268, 140), { muted: true });
    s += arrow(P(268, 162), P(232, 162), { muted: true });
    s += arrow(P(492, 140), P(528, 140), { muted: true });
    s += arrow(P(528, 162), P(492, 162), { muted: true });

    s += text(380, 32, 'barrier ≈ 6 kcal/mol → about 10⁸–10⁹ inversions per second at room temperature', { cls: 'fg-tag', size: 11 });
    s += text(380, 296, 'One flip every few nanoseconds: cooling slows it, but never enough to bottle either pyramid.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Why an amine nitrogen with three different groups is not a usable stereocenter. It really is pyramidal, and the two pyramids really are mirror images — but the barrier between them is about 6 kcal/mol, so the molecule turns itself inside out like an umbrella in a gale, roughly 10<sup>8</sup>–10<sup>9</sup> times a second. What you have is not two separable substances; it is one substance spending half its time in each shape.',
  note: 'Take the lone pair away and the argument collapses with it. A quaternary ammonium ion, N<sup>+</sup> with four groups, has no lone pair to move into a p orbital and no planar transition state to pass through, so it cannot invert at all — and it is a perfectly ordinary stereocenter. The same is true of a sulfoxide, where the barrier is high enough that single enantiomers are sold as drugs.',
});

/* ---------------------------------------------------------------- ch6.4 ---
   The walk-both-ways test, which the section calls the reliable test for a
   ring carbon and then performs entirely in words. */
FIGURES.push({
  id: 'walk-both-ways',
  section: 'stereocenters',
  anchor: 'Walking both ways around the ring is the only reliable test.</div>',
  alt: 'Two cyclohexane rings. In 3-methylcyclohexan-1-ol, walking from C1 down the right-hand side reaches the methyl-bearing carbon after two carbons and walking down the left-hand side reaches it after four, so the two ring paths differ and C1 is a stereocenter. In 4-methylcyclohexan-1-ol both walks reach it after three carbons, so C1 is not.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const ring = (cx, meAt) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (90 - i * 60) * Math.PI / 180;
        v.push(P(cx + 54 * Math.cos(a), 152 - 54 * Math.sin(a)));
      }
      let g = '';
      for (let i = 0; i < 6; i++) g += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      for (const p of v) g += atom(p.x, p.y, '', { kind: 'point' });
      g += bond(v[0], P(v[0].x, v[0].y - 32), { rFrom: 0, rTo: 16 });
      g += atom(v[0].x, v[0].y - 32, 'OH', { r: 16, size: 10, kind: 'hi' });
      const m = v[meAt];
      const dx = m.x - cx, dy = m.y - 152, L = Math.hypot(dx, dy);
      const me = P(m.x + (dx / L) * 32, m.y + (dy / L) * 32);
      g += bond(m, me, { rFrom: 0, rTo: 17 });
      g += atom(me.x, me.y, 'CH₃', { r: 17, size: 10, kind: 'hi' });
      g += text(v[0].x - 20, v[0].y + 2, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
      return g;
    };
    s += panel(24, 40, 340, 232, { kind: 'hi' });
    s += ring(194, 2);
    s += text(194, 30, '3-methylcyclohexan-1-ol', { cls: 'fg-tag', size: 11 });
    s += text(118, 122, 'four carbons', { cls: 'fg-tag-warn', size: 10, anchor: 'end' });
    s += text(118, 138, 'this way', { cls: 'fg-tag-warn', size: 10, anchor: 'end' });
    s += text(270, 122, 'two carbons', { cls: 'fg-tag-good', size: 10, anchor: 'start' });
    s += text(270, 138, 'that way', { cls: 'fg-tag-good', size: 10, anchor: 'start' });
    s += text(194, 294, 'the two ring paths differ → C1 IS a stereocenter', { cls: 'fg-tag-good', size: 10.5 });

    s += panel(396, 40, 340, 232, { kind: 'warn' });
    s += ring(566, 3);
    s += text(566, 30, '4-methylcyclohexan-1-ol', { cls: 'fg-tag', size: 11 });
    s += text(490, 122, 'three carbons', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(490, 138, 'this way', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(642, 122, 'three carbons', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(642, 138, 'that way', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(566, 294, 'the two ring paths match → C1 is NOT a stereocenter', { cls: 'fg-tag-warn', size: 10.5 });

    s += text(380, 312, 'A ring carbon puts two of its four bonds into the ring itself.', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 326, 'The question is never “are these two bonds different” but “are these two WALKS different”.', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'The one test that works on a ring. C1 carries OH, H and two ring bonds, and the two ring bonds look identical — they are both C–C into the same ring. What decides is what you meet walking each way round, and the methyl group is the thing you meet. Two carbons one way against four the other is a genuine difference; three against three is not.',
  note: 'Do the walk in both directions and stop at the first point of difference, exactly as CIP rule 2 asks you to. The commonest error is not doing the walk at all — a ring carbon bearing an OH <i>looks</i> like a stereocenter, and in 4-methylcyclohexan-1-ol it is not one, because the ring reads the same from either side.',
});

export default FIGURES;
