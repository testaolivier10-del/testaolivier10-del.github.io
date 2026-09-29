/* Figures for the rs-configuration notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* --------------------------------------------------------------- ch6.11 ---
   The two worked examples the R/S section explicitly asks the reader to
   compare, finally drawn beside each other. */
FIGURES.push({
  id: 'same-trace-opposite-answer',
  section: 'rs-configuration',
  anchor: 'This is the single most common way to lose marks in stereochemistry: reading the rotation correctly and forgetting to check where priority 4 points.</div>',
  alt: 'Butan-2-ol and glyceraldehyde drawn in the same orientation, OH at the top and the two carbon groups lower left and lower right. Both trace 1 to 2 to 3 counterclockwise. Butan-2-ol has H on a hash and is S; glyceraldehyde has H on a wedge, so the answer is flipped and it is R.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const centerDraw = (cx, cy, g2, g3, hKind) => {
      const c = P(cx, cy);
      const oh = armEnd(c, 90, 62), a = armEnd(c, 200, 66), b = armEnd(c, 340, 66), h = armEnd(c, 270, 46);
      let g = bond(c, oh, { rTo: 17 });
      g += bond(c, a, { rTo: g2.length > 3 ? 22 : 17 });
      g += bond(c, b, { rTo: g3.length > 3 ? 22 : 17 });
      g += (hKind === 'wedge' ? wedge : hash)(c, h, { rTo: 12, width: 10, rungs: 4 });
      g += atom(oh.x, oh.y, 'OH', { r: 17, size: 10.5, kind: 'hi' });
      g += atom(a.x, a.y, g2, { r: g2.length > 3 ? 22 : 17, size: g2.length > 3 ? 9 : 10 });
      g += atom(b.x, b.y, g3, { r: g3.length > 3 ? 22 : 17, size: g3.length > 3 ? 9 : 10 });
      g += atom(h.x, h.y, 'H', { r: 12 });
      g += atom(c.x, c.y, 'C', { kind: 'hi' });
      g += text(oh.x + 24, oh.y - 6, '1', { cls: 'fg-tag-good', size: 13 });
      g += text(a.x - 4, a.y + 34, '2', { cls: 'fg-tag-good', size: 13 });
      g += text(b.x + 4, b.y + 34, '3', { cls: 'fg-tag-good', size: 13 });
      g += text(h.x + 22, h.y + 4, '4', { cls: 'fg-tag-warn', size: 13, anchor: 'start' });
      /* The 1 -> 2 -> 3 sweep as ONE arc, bowed out to the left so it passes
         the lower-left group on its way to the lower-right one. Drawing it as
         a short hop from 1 to 2 would leave the student to guess the rest. */
      g += curve(P(cx - 16, cy - 44), P(cx + 44, cy + 30), { bow: 74, size: 8 });
      return g;
    };
    s += panel(24, 40, 340, 214, { kind: 'hi' });
    s += centerDraw(194, 132, 'CH₂CH₃', 'CH₃', 'hash');
    s += text(194, 232, 'butan-2-ol · H on a HASH, pointing away', { cls: 'fg-sm', size: 10 });
    s += text(194, 278, '1→2→3 counterclockwise, no flip', { cls: 'fg-sm', size: 10 });
    s += text(194, 302, 'S', { cls: 'fg-tag-good', size: 18 });

    s += panel(396, 40, 340, 214, { kind: 'warn' });
    s += centerDraw(566, 132, 'CHO', 'CH₂OH', 'wedge');
    s += text(566, 232, 'glyceraldehyde · H on a WEDGE, pointing at you', { cls: 'fg-sm', size: 10 });
    s += text(566, 278, '1→2→3 counterclockwise, then FLIP', { cls: 'fg-sm', size: 10 });
    s += text(566, 302, 'R', { cls: 'fg-tag-warn', size: 18 });
    return s;
  },
  caption: 'Two molecules drawn in the same orientation, traced in the same direction, with <b>opposite</b> answers. Priorities run OH &gt; the more oxidized carbon &gt; the less oxidized carbon &gt; H in both: ethyl beats methyl on the left by (C,H,H) against (H,H,H), and CHO beats CH₂OH on the right by (O,O,H) against (O,H,H). Everything about the two readings is identical except which bond the hydrogen sits on.',
  note: 'Get into the habit of finding priority 4 <i>before</i> tracing, not after. The flip is not an optional refinement — skipping it does not give you a slightly wrong answer, it gives you the enantiomer, and it gives it to you every single time.',
});

export default FIGURES;
