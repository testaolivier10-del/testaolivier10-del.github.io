/* Figures for the resonance notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 102 ---
   Ranking contributors was five rules with nothing drawn to apply them to.
   These are the two pairs the rules were written for, and they disagree
   about which rule wins: the enolate is decided by where the charge sits,
   the protonated carbonyl by whose octet is short. Drawn together, the
   order of the rules is the thing you can see. */
FIGURES.push({
  id: 'resonance-ranking',
  section: 'resonance',
  anchor: '<p class="step-body">None of the valid structures is "wrong" to draw \u2014 each contributes something. These rules only say which contributes more.</p>',
  alt: 'Two pairs of resonance contributors with formal charges marked: an enolate ranked by which atom holds the negative charge, and a protonated carbonyl ranked by which structure has full octets',
  viewBox: '0 0 760 340',
  build() {
    let s = '';

    // ---- Row 1: the enolate, decided by which atom holds the minus ----
    s += tag(290, 38, 'RANKED BY WHERE THE CHARGE SITS');
    const drawEnolate = (ox, onO) => {
      let g = '';
      const ca = P(ox, 104), cb = P(ox + 72, 104), o = P(ox + 122, 70);
      g += bond(ca, cb, { order: onO ? 2 : 1 });
      g += bond(cb, o, { order: onO ? 1 : 2 });
      g += atom(ca.x, ca.y, onO ? 'CH\u2082' : '\u207bCH\u2082', { kind: onO ? 'plain' : 'hi', size: 9.5 });
      g += atom(cb.x, cb.y, 'CH', { size: 10.5 });
      g += atom(o.x, o.y, onO ? 'O\u207b' : 'O', { kind: onO ? 'hi' : 'plain', size: 10.5 });
      for (const ang of onO ? [40, 90, 140] : [40, 140]) g += lonePair(o.x, o.y, -ang, { dist: 24 });
      return g;
    };
    s += drawEnolate(66, true);
    s += drawEnolate(356, false);
    s += arrow(P(254, 100), P(316, 100), { muted: true });
    s += arrow(P(316, 108), P(254, 108), { muted: true });
    s += text(130, 150, 'MAJOR \u2014 \u2212 on oxygen', { cls: 'fg-tag-good', size: 10.5 });
    s += text(420, 150, 'minor \u2014 \u2212 on carbon', { cls: 'fg-tag-warn', size: 10.5 });

    s += rule(556, 40, 556, 312);
    s += text(654, 86, 'Both have full octets', { cls: 'fg-sm', size: 10 });
    s += text(654, 102, 'and one charge each,', { cls: 'fg-sm', size: 10 });
    s += text(654, 118, 'so rule 3 decides it:', { cls: 'fg-sm', size: 10 });
    s += text(654, 138, 'O beats C for \u2212', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(34, 176, 530, 176);

    // ---- Row 2: the protonated carbonyl, decided by the octet ----
    s += tag(290, 208, 'RANKED BY WHOSE OCTET IS SHORT');
    const drawProt = (ox, onO) => {
      let g = '';
      const me = P(ox, 268), c = P(ox + 82, 268), o = P(ox + 132, 234);
      g += bond(me, c, { rFrom: 26, rTo: 15 });
      g += atom(me.x, me.y, '(CH\u2083)\u2082', { r: 26, size: 9.5 });
      g += bond(c, o, { order: onO ? 2 : 1 });
      g += atom(c.x, c.y, onO ? 'C' : 'C\u207a', { kind: onO ? 'plain' : 'hi', size: 10.5 });
      g += atom(o.x, o.y, onO ? 'OH\u207a' : 'OH', { kind: onO ? 'hi' : 'plain', size: 9.5 });
      for (const ang of onO ? [40, 140] : [40, 90, 140]) g += lonePair(o.x, o.y, -ang, { dist: 24 });
      return g;
    };
    s += drawProt(66, true);
    s += drawProt(356, false);
    s += arrow(P(254, 264), P(316, 264), { muted: true });
    s += arrow(P(316, 272), P(254, 272), { muted: true });
    s += text(130, 314, 'MAJOR \u2014 every octet full', { cls: 'fg-tag-good', size: 10.5 });
    s += text(420, 314, 'minor \u2014 carbon has six', { cls: 'fg-tag-warn', size: 10.5 });

    s += text(654, 212, 'Rule 3 would prefer', { cls: 'fg-sm', size: 10 });
    s += text(654, 228, 'the + on carbon \u2014 but', { cls: 'fg-sm', size: 10 });
    s += text(654, 244, 'rule 1 comes first:', { cls: 'fg-sm', size: 10 });
    s += text(654, 264, 'octets outrank charge', { cls: 'fg-tag-good', size: 10.5 });
    s += text(654, 290, 'and that minor form is', { cls: 'fg-sm', size: 10 });
    s += text(654, 306, 'the carbon\u2019s \u03b4+', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Two ranked pairs, with the formal charges worked out on the drawing. The rules are the same both times; which rule does the deciding is not.',
  note: 'Read the minor structures rather than dismissing them. The carbon-centered enolate form is where an enolate\u2019s reactivity lives, and the carbon-centered protonated-carbonyl form is where a carbonyl carbon gets the partial positive charge that nucleophiles attack. A minor contributor is not a rare event &mdash; there is only one real structure, and a minor contributor is a permanent fraction of it.',
});

export default FIGURES;
