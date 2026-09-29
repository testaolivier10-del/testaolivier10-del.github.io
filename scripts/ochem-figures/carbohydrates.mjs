/* Figures for the carbohydrates notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* A stick, for the three spectra that are line spectra rather than traces. */
function stick(x, yBase, h, cls = 'fg-bond', w = 2.6) {
  return `<line class="${cls}" x1="${n2(x)}" y1="${n2(yBase)}" x2="${n2(x)}" y2="${n2(yBase - h)}" stroke-width="${w}"></line>`;
}


/* ------------------------------------------------------------------ 9 ---
   Reducing or not. The notes make the claim in a sentence — a hemiacetal
   opens, an acetal does not — and it is the single test the whole
   disaccharide section rests on. Drawn side by side, the difference is one
   substituent on one carbon, which is exactly the point. */
FIGURES.push({
  id: 'anomeric-test',
  section: 'carbohydrates',
  anchor: '<h3>The polysaccharides worth knowing</h3>',
  viewBox: '0 0 760 330',
  alt: 'A hemiacetal anomeric carbon opening to the open-chain aldehyde beside an acetal anomeric carbon that cannot open',
  build() {
    let s = '';
    const col = (x, title, kind) => {
      s += panel(x, 44, 330, 176, { kind });
      s += tag(x + 165, 30, title);
    };
    col(24, 'hemiacetal — one OR, one OH', null);
    col(406, 'acetal — two OR', 'warn');

    // Left: ring carbon with OH and ring O, opening to the aldehyde.
    const c1 = P(120, 116);
    s += atom(c1.x, c1.y, 'C', { kind: 'hi' });
    s += atom(120, 62, 'OH', { });
    s += atom(62, 148, 'O', { });
    s += bond(c1, P(120, 62));
    s += bond(c1, P(62, 148));
    s += text(62, 176, 'ring', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(176, 116), P(250, 116));
    s += text(213, 104, 'opens', { cls: 'fg-tag-good', size: 10.5 });
    s += atom(300, 116, 'CHO');
    s += text(300, 150, 'free aldehyde', { cls: 'fg-sm', size: 10 });
    s += text(189, 200, 'Tollens’ has something to oxidize', { cls: 'fg-tag-good', size: 10.5 });

    // Right: the same carbon with the OH replaced by OR.
    const c2 = P(502, 116);
    s += atom(c2.x, c2.y, 'C', { kind: 'warn' });
    s += atom(502, 62, 'OR', { });
    s += atom(444, 148, 'O', { });
    s += bond(c2, P(502, 62));
    s += bond(c2, P(444, 148));
    s += text(444, 176, 'ring', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(558, 116), P(632, 116), { muted: true });
    s += text(595, 104, 'stays shut', { cls: 'fg-tag', size: 10.5 });
    s += text(682, 120, 'no aldehyde', { cls: 'fg-sm', size: 10 });
    s += text(571, 200, 'nothing to oxidize, so no test', { cls: 'fg-tag', size: 10.5 });

    s += rule(34, 246, 726, 246);
    s += text(380, 274, 'One substituent on one carbon decides whether a sugar reduces Tollens’', { cls: 'fg-lbl', size: 12 });
    s += text(380, 296, 'reagent — and therefore whether maltose behaves like glucose or like sucrose.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The anomeric carbon, with and without a free OH. On the left it is a hemiacetal: the ring opens back to the open-chain aldehyde, and that aldehyde is what a reducing-sugar test oxidizes. On the right a second alcohol has capped it, making a full acetal — stable to base, so the ring never opens and no aldehyde is ever available.',
  note: 'This is why sucrose is the standard exception. Its glycosidic bond runs anomeric carbon to anomeric carbon, so both rings are acetals at once and neither end can open; maltose commits only one, which leaves the other free and keeps maltose reducing.',
});

/* ================================================================ B1 ===
   The chapter fix pass: Biomolecules had five figures and not one drawn
   molecule in any of them. Everything below draws a real structure.

   Fischer to Haworth. The notes used the words "Haworth", "up" and "down"
   without a drawing anywhere in the course that shows what a sugar ring
   looks like, so the conversion rule was three words a reader could only
   take on trust. Two panels of one molecule is the only honest way to make
   the claim, because the claim IS that the two drawings are the same
   compound. */
FIGURES.push({
  id: 'fischer-haworth',
  section: 'carbohydrates',
  anchor: 'wedges and dashes back in <a class="chapter-ref" href="/ochem/learn.html#m-stereochemistry">Stereochemistry</a>.</p>',
  viewBox: '0 0 700 412',
  alt: 'D-glucose drawn twice: the open-chain Fischer projection with OH right at C2, left at C3, right at C4 and right at C5, and beta-D-glucopyranose as a Haworth ring with the C1 OH up, C2 OH down, C3 OH up, C4 OH down and the C5 CH2OH up',
  build() {
    let s = '';

    /* ---- left: the Fischer projection ---- */
    s += panel(16, 44, 280, 300);
    s += tag(156, 32, 'open-chain D-glucose (Fischer)');

    const X = 116, XR = 166, XL = 66;
    const ys = [72, 120, 168, 216, 264, 312];
    // The chain, top to bottom. C1 is the aldehyde, C6 the primary alcohol,
    // and C2-C5 are bare crossings, which is what a Fischer projection is:
    // a vertex whose two horizontal bonds come out of the page at you.
    s += atom(X, ys[0], 'CHO');
    s += atom(X, ys[5], 'CH\u2082OH', { r: 20 });
    s += bond(P(X, ys[0]), P(X, ys[1]), { rTo: 0 });
    for (let i = 1; i < 4; i++) s += bond(P(X, ys[i]), P(X, ys[i + 1]), { rFrom: 0, rTo: 0 });
    s += bond(P(X, ys[4]), P(X, ys[5]), { rFrom: 0, rTo: 20 });

    // Right or left at each stereocenter is the entire content of the
    // drawing: OH right at C2, left at C3, right at C4, right at C5 is
    // D-glucose and no other sugar.
    const sub = (i, ohRight) => {
      const y = ys[i];
      const xo = ohRight ? XR : XL, xh = ohRight ? XL : XR;
      return bond(P(X, y), P(xo, y), { rFrom: 0 }) + bond(P(X, y), P(xh, y), { rFrom: 0 }) +
             atom(xo, y, 'OH') + atom(xh, y, 'H');
    };
    s += sub(1, true) + sub(2, false) + sub(3, true) + sub(4, true);
    for (let i = 0; i < 6; i++) s += text(40, ys[i] + 4, String(i + 1), { cls: 'fg-sm' });

    // Ring closure as one arrow: C5's oxygen reaching the C1 carbonyl.
    s += curve(P(184, 258), P(132, 84), { bow: 80 });
    s += tag(240, 168, 'C5 OH \u2192 C1');
    s += tag(240, 268, 'D is read here');

    /* ---- right: the same molecule as a Haworth ring ---- */
    s += panel(306, 44, 378, 300);
    s += tag(495, 32, '\u03b2-D-glucopyranose (Haworth)');

    const C1 = P(656, 200), C2 = P(606, 258), C3 = P(446, 258),
          C4 = P(396, 200), C5 = P(481, 145), O = P(571, 145);
    // The front edge is drawn heavy, because that is the whole of the
    // perspective: those are the bonds nearest the reader.
    s += bond(C4, C3, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(C3, C2, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(C2, C1, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(C5, C4, { rFrom: 0, rTo: 0 });
    s += bond(C5, O, { rFrom: 0, rTo: 15 });
    s += bond(C1, O, { rFrom: 0, rTo: 15 });
    s += atom(O.x, O.y, 'O');

    // Every substituent is a vertical stick. Up: C1 (which is what beta
    // means), C3, and the C5 CH2OH. Down: C2 and C4.
    const stick = (c, up, lab, opts = {}) => {
      const to = P(c.x, c.y + (up ? -48 : 48));
      return bond(c, to, { rFrom: 0, rTo: opts.r ?? 15 }) + atom(to.x, to.y, lab, opts);
    };
    s += stick(C1, true, 'OH');
    s += stick(C2, false, 'OH');
    s += stick(C3, true, 'OH');
    s += stick(C4, false, 'OH');
    s += stick(C5, true, 'CH\u2082OH', { r: 20 });
    // and the anomer nobody asked for, drawn faintly underneath C1.
    s += bond(C1, P(656, 248), { rFrom: 0, rTo: 15, cls: 'fg-bond-soft' });
    s += text(656, 252, 'OH', { cls: 'fg-sm' });
    s += tag(656, 128, '\u03b2');
    s += tag(656, 286, '\u03b1 anomer', { cls: 'fg-tag-mut' });

    // Locants sit inside the ring, the only empty space in the drawing:
    // outside, each one lands beside a substituent and reads as labelling it.
    for (const [x, y, n] of [[631, 205, '1'], [589, 240, '2'], [463, 240, '3'],
      [413, 178, '4'], [501, 168, '5'], [515, 93, '6']]) s += text(x, y, n, { cls: 'fg-sm' });

    /* ---- the rule, underneath, where it can be read as a rule ---- */
    s += rule(26, 356, 674, 356);
    s += tag(160, 378, 'right \u2192 down');
    s += tag(350, 378, 'left \u2192 up');
    s += tag(540, 378, 'D \u2192 CH\u2082OH up');
    s += label(350, 400, 'Same molecule, two drawings \u2014 the ring is C5\u2019s OH bonded to C1, nothing more.');
    return s;
  },
  caption: 'D-glucose twice. A Haworth projection is the ring seen edge-on with the ring oxygen at the back right, the anomeric carbon at the right, and every substituent drawn as a stick pointing straight up or straight down. Reading across, an OH on the <b>right</b> in the Fischer projection ends up pointing <b>down</b> in the ring, and one on the <b>left</b> points <b>up</b>.',
  note: 'Check the conversion on C3. It is the one OH that D-glucose draws on the left, so it is the one that points up in the ring — the fastest way to tell a correctly drawn glucose from a plausible-looking wrong one. Hydrogens on the ring carbons are left off, as they always are in a Haworth drawing.',
});

export default FIGURES;
