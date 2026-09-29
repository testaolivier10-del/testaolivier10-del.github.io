/* Figures for the amine-structure notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ 6 ---
   Why an amide is not a base. */
FIGURES.push({
  id: 'amine-lone-pair',
  section: 'amine-structure',
  anchor: '<h3>Resonance donation: the dramatic basicity killer</h3>',
  alt: 'Lone pair availability compared across an alkylamine, an arylamine and an amide',
  viewBox: '0 0 800 290',
  build() {
    let s = '';
    const cases = [
      { x: 100, name: 'Alkylamine', sub: 'R–NH₂', pkb: 'conj. acid pKa ≈ 10.6', verdict: 'lone pair stays put', kind: 'good', w: 186 },
      { x: 330, name: 'Arylamine',  sub: 'Ph–NH₂', pkb: 'conj. acid pKa ≈ 4.6', verdict: 'shared with the ring', kind: 'hi', w: 96 },
      { x: 560, name: 'Amide',      sub: 'R(C=O)–NH₂', pkb: 'conj. acid pKa ≈ −1', verdict: 'pulled onto oxygen', kind: 'warn', w: 20 },
    ];
    for (const c of cases) {
      s += tag(c.x, 48, c.name);
      s += label(c.x, 96, c.sub, { size: 13 });
      s += atom(c.x, 140, 'N', { kind: c.kind === 'good' ? 'hi' : 'plain' });
      s += lonePair(c.x, 140, -90, { muted: c.kind !== 'good', dist: 26 });
      s += text(c.x, 186, c.pkb, { cls: 'fg-sm', size: 10 });
      s += text(c.x, 204, c.verdict, { cls: c.kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', size: 10.5 });
    }
    // The delocalization arrows for the two that lose the pair. An arrow has
    // to arrive somewhere: pointing one into blank space says the lone pair
    // goes away rather than saying where it goes.
    s += curve(P(344, 126), P(398, 112), { bow: 14, muted: true });
    s += text(404, 116, 'into the ring', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += curve(P(574, 126), P(628, 112), { bow: 14, muted: true });
    s += text(634, 116, 'onto the C=O oxygen', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    s += tag(330, 240, 'how much of the lone pair is still available to a proton');
    for (const c of cases) s += bar(c.x - c.w / 2, 254, c.w, 16, { kind: c.kind === 'warn' ? 'warn' : 'hi', opacity: 0.35 + c.w / 420 });
    return s;
  },
  caption: 'Basicity in amines is one question asked three times: is the nitrogen lone pair still there to donate? A lone pair that is delocalized somewhere else is not available to pick up a proton, and every drop in the row below is that and nothing else.',
  note: 'The amide is the case worth remembering, because the collapse is enormous — around ten orders of magnitude from an ordinary alkylamine. The lone pair is conjugated into the carbonyl and spends its time on oxygen, which is also why an amide C–N bond is short, planar and does not rotate freely. An amide nitrogen is not a weak base; it is not usefully a base at all.',
});

/* ---------------------------------------------------------------- 191 ---
   The amines chapter opens by asserting twice that a lone pair is
   "delocalized" and never draws the delocalization, in a book that has spent
   fourteen chapters teaching that a resonance claim is a pair of structures
   and an arrow. */
FIGURES.push({
  id: 'lone-pair-delocalization',
  section: 'amine-structure',
  anchor: 'the nitrogen is even less basic than that number suggests.</p>',
  viewBox: '0 0 760 470',
  alt: 'Two rows of resonance structures: acetamide pushing its nitrogen lone pair into the carbonyl, and aniline pushing its lone pair into the benzene ring',
  build() {
    let s = '';
    const resonanceArrow = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { muted: true }) + arrow(P(x2, y), P(x1, y), { muted: true });

    /* Row A - the amide */
    s += tag(36, 40, 'AN AMIDE (acetamide)', { anchor: 'start' });
    let c = P(150, 116), o = P(150, 70), me = P(102, 148), nn = P(198, 148);
    s += bond(c, o, { order: 2 }); s += bond(c, me); s += bond(c, nn);
    s += atom(o.x, o.y, 'O'); s += lonePair(o.x, o.y, 200); s += lonePair(o.x, o.y, 340);
    s += atom(me.x, me.y, 'CH₃');
    s += atom(nn.x, nn.y, 'NH₂', { kind: 'hi' });
    s += lonePair(nn.x, nn.y, 55);
    s += curve(P(214, 168), P(180, 140), { bow: 20 });
    s += curve(P(134, 96), P(132, 74), { bow: 14 });
    s += text(150, 202, 'the lone pair pushes in', { cls: 'fg-sm', size: 10 });

    s += resonanceArrow(266, 336, 116);

    c = P(452, 116); o = P(452, 70); me = P(404, 148); nn = P(500, 148);
    s += bond(c, o); s += bond(c, me); s += bond(c, nn, { order: 2 });
    s += atom(o.x, o.y, 'O', { kind: 'warn' });
    s += lonePair(o.x, o.y, 200); s += lonePair(o.x, o.y, 340); s += lonePair(o.x, o.y, 90);
    s += text(480, 62, '⊖', { cls: 'fg-hi', size: 13 });
    s += atom(me.x, me.y, 'CH₃');
    s += atom(nn.x, nn.y, 'NH₂', { kind: 'warn' });
    s += text(534, 168, '⊕', { cls: 'fg-warn', size: 13 });
    s += text(452, 202, 'no lone pair left on nitrogen', { cls: 'fg-sm', size: 10 });
    s += text(596, 110, 'the charge that the', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(596, 126, 'push created sits on', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(596, 142, 'OXYGEN, not nitrogen', { cls: 'fg-tag', size: 10.5, anchor: 'start' });

    s += rule(24, 226, 736, 226);

    /* Row B - aniline */
    s += tag(36, 254, 'ANILINE', { anchor: 'start' });
    const hex = (cx, cy, r) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return pts;   // 0 = top (ipso), 1 = ortho, 2 = meta, 3 = para, 4 = meta, 5 = ortho
    };
    const ringBonds = (pts, doubles) => {
      let g = '';
      const mid = P((pts[0].x + pts[3].x) / 2, (pts[0].y + pts[3].y) / 2);
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        if (doubles.includes(i)) g += ringDouble(pts[i], pts[j], mid, { inset: 9 });
        else g += bond(pts[i], pts[j], { rFrom: 0, rTo: 0 });
      }
      return g;
    };
    let ring = hex(150, 372, 44);
    s += ringBonds(ring, [0, 2, 4]);
    s += bond(ring[0], P(150, 300), { rFrom: 0, rTo: 16 });
    s += atom(150, 300, 'NH₂', { kind: 'hi' });
    s += lonePair(150, 300, 250);
    s += curve(P(120, 288), P(140, 322), { bow: 16 });
    s += curve(P(174, 330), P(200, 342), { bow: -14 });
    s += text(150, 442, 'push the pair into the ring', { cls: 'fg-sm', size: 10 });

    s += resonanceArrow(266, 336, 372);

    ring = hex(452, 372, 44);
    s += ringBonds(ring, [2, 4]);
    s += bond(ring[0], P(452, 300), { rFrom: 0, rTo: 16, order: 2 });
    s += atom(452, 300, 'NH₂', { kind: 'warn' });
    s += text(486, 292, '⊕', { cls: 'fg-warn', size: 13 });
    s += text(516, 356, '⊖', { cls: 'fg-hi', size: 13 });
    s += text(452, 442, 'the pair is now on a ring carbon', { cls: 'fg-sm', size: 10 });
    s += text(546, 352, 'three such structures exist', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(546, 368, 'at both ortho carbons and', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(546, 384, 'at para, and protonating N', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(546, 400, 'cancels all three at once', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The two &ldquo;resonance kills basicity&rdquo; claims of this section, drawn. In the amide the pair ends up in the C&ndash;N pi bond with the negative charge parked on oxygen; in aniline it ends up on ring carbons. A proton arriving at either nitrogen has to pay for cancelling these structures, and that bill is what six (aniline) and eleven (amide) orders of magnitude of lost basicity buys.',
  note: 'Read the right-hand structures as where the electrons actually spend part of their time, not as something that happens afterward. The amide&rsquo;s nitrogen is drawn <b>⊕</b> and flat for the same reason its C&ndash;N bond does not rotate: the pair is in a pi bond, not on nitrogen. Count the arrows, too, and read each one for what it moves: two start on a nitrogen lone pair and end in a bond, and two start on a pi bond and end on the atom that keeps the pair &mdash; exactly the notation the resonance chapter set up.',
});

/* ---------------------------------------------------------------- 192 ---
   Nitrogen inversion is a 3-D claim made in one sentence of a pitfall box, in
   a course that taught wedges and dashes eight chapters earlier. */
FIGURES.push({
  id: 'nitrogen-inversion',
  section: 'amine-structure',
  anchor: 'cannot invert and is a genuine stereocenter.</div>',
  viewBox: '0 0 760 390',
  alt: 'A pyramidal amine flipping through a planar transition state to its mirror image, with a quaternary ammonium ion beside it that cannot flip',
  build() {
    let s = '';
    const equilibrium = (x1, x2, y) => arrow(P(x1, y - 7), P(x2, y - 7), { muted: true }) + arrow(P(x2, y + 7), P(x1, y + 7), { muted: true });

    /* left pyramid */
    let n = P(118, 140);
    s += bond(n, P(118, 198));
    s += wedge(n, P(64, 108));
    s += hash(n, P(172, 108));
    s += atom(118, 198, 'a'); s += atom(64, 108, 'b'); s += atom(172, 108, 'c');
    s += atom(n.x, n.y, 'N', { kind: 'hi' });
    s += lonePair(n.x, n.y, 270, { dist: 26 });
    s += text(118, 244, 'one pyramidal form', { cls: 'fg-tag-good', size: 11 });

    s += equilibrium(206, 296, 140);

    /* planar transition state, in brackets */
    s += rule(316, 62, 316, 218); s += rule(316, 62, 330, 62); s += rule(316, 218, 330, 218);
    s += rule(492, 62, 492, 218); s += rule(478, 62, 492, 62); s += rule(478, 218, 492, 218);
    s += text(500, 74, '‡', { cls: 'fg-warn', size: 15 });
    n = P(404, 140);
    s += bond(n, P(404, 84));
    s += bond(n, P(350, 178));
    s += bond(n, P(458, 178));
    s += atom(404, 84, 'b'); s += atom(350, 178, 'a'); s += atom(458, 178, 'c');
    s += atom(n.x, n.y, 'N', { kind: 'warn' });
    s += text(404, 244, 'planar transition state, ≈ 6 kcal/mol', { cls: 'fg-tag-warn', size: 11 });
    s += text(404, 262, 'the pair is now in a p orbital, perpendicular to the page', { cls: 'fg-sm', size: 10 });

    s += equilibrium(512, 602, 140);

    /* right pyramid - the mirror image */
    n = P(660, 140);
    s += bond(n, P(660, 198));
    s += hash(n, P(606, 108));
    s += wedge(n, P(714, 108));
    s += atom(660, 198, 'a'); s += atom(606, 108, 'b'); s += atom(714, 108, 'c');
    s += atom(n.x, n.y, 'N', { kind: 'hi' });
    s += lonePair(n.x, n.y, 270, { dist: 26 });
    s += text(660, 244, 'its mirror image', { cls: 'fg-tag-good', size: 11 });

    s += rule(24, 288, 736, 288);
    s += text(24, 320, '≈ 10⁸–10⁹ times a second at room temperature.', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(24, 344, 'Far too fast to separate the two forms, so an amine with', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(24, 364, 'three different groups is not a resolvable stereocenter.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });

    /* the quaternary case, which cannot do any of this */
    s += panel(430, 296, 306, 84, { kind: 'warn' });
    n = P(516, 338);
    s += bond(n, P(516, 300));
    s += bond(n, P(470, 362));
    s += wedge(n, P(562, 362));
    s += hash(n, P(562, 312));
    s += atom(516, 300, 'a', { r: 12 }); s += atom(470, 362, 'b', { r: 12 });
    s += atom(562, 362, 'c', { r: 12 }); s += atom(562, 312, 'd', { r: 12 });
    s += atom(n.x, n.y, 'N', { kind: 'warn' });
    s += text(492, 322, '⊕', { cls: 'fg-warn', size: 12 });
    s += text(588, 330, 'quaternary: no lone', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(588, 346, 'pair, nothing to invert', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(588, 362, 'through — a real center', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'What &ldquo;nitrogen inversion&rdquo; actually looks like: the pyramid turns inside out through a flat transition state, like an umbrella in the wind, and comes out as its own mirror image. The barrier is about 6 kcal/mol, which at room temperature is no barrier at all.',
  note: 'The comparison worth holding onto is with carbon. A carbon stereocenter would have to break a bond to invert, which costs about 80 kcal/mol, so it never happens and the two enantiomers can be bottled separately. Nitrogen has a lone pair instead of a fourth bond, and moving a lone pair through a plane costs almost nothing. Take the lone pair away by making a fourth bond — the quaternary salt — and nitrogen behaves exactly like carbon again.',
});

export default FIGURES;
