/* Figures for the wittig-reaction notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 38 ---
   The argument for the Wittig is a comparison, and prose can only assert it:
   an elimination lets Zaitsev choose where the C=C goes, and a Wittig does
   not. One substrate, two routes, two different alkenes. */
FIGURES.push({
  id: 'zaitsev-vs-wittig',
  section: 'wittig-reaction',
  anchor: '<h3>Geometry, which is the one thing it does not fully control</h3>',
  viewBox: '0 0 760 320',
  alt: 'An elimination route giving the more substituted endocyclic alkene against a Wittig giving the exocyclic one from the same ring',
  build() {
    let s = '';
    // A hexagon, drawn small, used as the shared skeleton in both panels.
    const ring = (cx, cy, r) => {
      let t = '', pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 - 90) * Math.PI / 180;
        pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      for (let i = 0; i < 6; i++) t += bond(pts[i], pts[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      return { svg: t, pts };
    };

    const col = (ox, title, sub, kind) => {
      s += panel(ox, 44, 300, 150, { kind });
      s += tag(ox + 150, 32, title);
      s += text(ox + 150, 214, sub, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11 });
    };
    col(30,  'elimination — Zaitsev picks', 'the more substituted alkene', 'warn');
    col(430, 'Wittig — you pick', 'the exocyclic alkene', null);

    let g = ring(180, 118, 42); s += g.svg;
    // Endocyclic double bond: a second line just inside the top-right edge.
    s += bond(g.pts[0], g.pts[1], { rFrom: 10, rTo: 10, cls: 'fg-bond' });
    // The methyl is the whole point of the comparison, so it has to be drawn:
    // without it the left panel is cyclohexene and the label is a different
    // compound from the structure.
    s += bond(g.pts[0], P(180, 52), { rFrom: 0, rTo: 13 });
    s += atom(180, 46, 'CH\u2083', { r: 13 });
    s += text(180, 124, 'in the ring', { cls: 'fg-sm', size: 9.5 });
    s += text(180, 176, '1-methylcyclohexene', { cls: 'fg-lbl', size: 11.5 });

    g = ring(580, 118, 42); s += g.svg;
    s += bond(g.pts[0], P(580, 46), { rFrom: 0, rTo: 6, order: 2 });
    s += atom(580, 40, 'CH₂', { kind: 'hi', r: 15 });
    s += text(580, 124, 'outside it', { cls: 'fg-sm', size: 9.5 });
    s += text(580, 176, 'methylenecyclohexane', { cls: 'fg-lbl', size: 11.5 });

    s += rule(34, 240, 700, 240);
    s += text(360, 266, 'Both start from the same ring. The elimination route cannot reach the one on the right,', { cls: 'fg-lbl', size: 12 });
    s += text(360, 288, 'because Zaitsev votes for the alkene inside the ring and wins.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The reason a Wittig is worth the phosphine. An elimination forms the C=C between two carbons that were already bonded, so Zaitsev decides which, and on a ring that means the endocyclic alkene. A Wittig puts the double bond where the carbonyl carbon was, which here is pointing out of the ring.',
  note: 'Note that the Wittig product is the <i>less</i> stable of the two. That is the point: it is not that the reaction prefers the exocyclic alkene, it is that no other position is available to it, so stability never gets a vote. Where regiochemistry is concerned, having only one option is better than having a preference.',
});

/* ---------------------------------------------------------------- B1 ---
   Five mechanisms in this chapter and, until now, not one curved arrow in
   it. Each of the five figures below draws the electrons: a reaction is a
   claim about which pair moved where, and prose can only assert that. */
FIGURES.push({
  id: 'wittig-mechanism',
  section: 'wittig-reaction',
  anchor: '<b>R<sub>2</sub>C=O + Ph<sub>3</sub>P=CR&prime;<sub>2</sub> &rarr; R<sub>2</sub>C=CR&prime;<sub>2</sub> + Ph<sub>3</sub>P=O</b></p>',
  viewBox: '0 0 760 574',
  alt: 'The four stages of the Wittig reaction drawn with curved arrows: triphenylphosphine displacing iodide and the phosphonium salt being deprotonated, the two resonance forms of the ylide, the [2+2] that closes the oxaphosphetane, and the retro-[2+2] that releases the alkene and triphenylphosphine oxide',
  build() {
    let s = '';

    /* 1 — the ylide is built by two reactions the student already has. */
    s += tag(192, 36, '1 · making the ylide');
    s += panel(14, 44, 356, 216);
    {
      const P3 = P(74, 92), C = P(186, 92), I = P(252, 92);
      s += bond(C, I, { rFrom: 18, rTo: 14 });
      s += atom(P3.x, P3.y, 'Ph₃P', { r: 24, size: 10 });
      s += atom(C.x, C.y, 'CH₃', { r: 18, size: 10 });
      s += atom(I.x, I.y, 'I', { kind: 'warn', r: 14 });
      s += lonePair(P3.x, P3.y, 0);
      s += curve(P(106, 86), P(166, 86), { bow: -14 });
      s += curve(P(220, 92), P(246, 72), { bow: 14 });
      s += text(192, 132, 'Ph₃P⁺–CH₃   I⁻', { cls: 'fg-tag', size: 11 });
    }
    {
      const Pp = P(72, 186), C = P(158, 186), H = P(206, 212), B = P(272, 194);
      s += bond(Pp, C, { rFrom: 22, rTo: 17 });
      s += bond(C, H, { rFrom: 17, rTo: 12, cls: 'fg-bond-hi' });
      s += atom(Pp.x, Pp.y, 'Ph₃P⁺', { r: 22, size: 10 });
      s += atom(C.x, C.y, 'CH₂', { kind: 'hi', r: 17 });
      s += atom(H.x, H.y, 'H', { kind: 'warn', r: 12 });
      s += atom(B.x, B.y, 'n-Bu⁻', { r: 22, size: 9.5 });
      s += curve(P(250, 204), P(220, 210), { bow: 12 });
      s += curve(P(186, 202), P(166, 198), { bow: -12 });
      s += text(192, 248, 'Ph₃P⁺–CH₂⁻   the ylide', { cls: 'fg-tag-good', size: 11 });
    }

    /* 2 — the two drawings of one molecule. */
    s += tag(568, 36, '2 · one molecule, two drawings');
    s += panel(390, 44, 356, 216);
    {
      s += bond(P(452, 120), P(528, 120), { rFrom: 22, rTo: 20 });
      s += atom(452, 120, 'Ph₃P⁺', { r: 22, size: 10 });
      s += atom(528, 120, 'CH₂⁻', { kind: 'hi', r: 20, size: 10 });
      s += arrow(P(572, 120), P(616, 120));
      s += arrow(P(616, 120), P(572, 120));
      s += bond(P(656, 120), P(720, 120), { order: 2, rFrom: 20, rTo: 17 });
      s += atom(656, 120, 'Ph₃P', { r: 20, size: 10 });
      s += atom(720, 120, 'CH₂', { kind: 'hi', r: 17 });
      s += text(568, 174, 'The carbon is the nucleophile.', { cls: 'fg-sm', size: 10.5 });
      s += text(568, 196, 'Both charges are real and next to each other,', { cls: 'fg-sm', size: 10.5 });
      s += text(568, 216, 'and P=CH₂ is shorthand for the same thing.', { cls: 'fg-sm', size: 10.5 });
    }

    /* 3 — the cycloaddition. */
    s += tag(192, 292, '3 · [2+2] — the ring closes');
    s += panel(14, 300, 356, 216);
    {
      const Pp = P(74, 356), Cy = P(146, 356), Cc = P(146, 424), O = P(74, 424);
      s += bond(Pp, Cy, { order: 2, rFrom: 20, rTo: 14 });
      s += bond(O, Cc, { order: 2, rFrom: 14, rTo: 14 });
      s += atom(Pp.x, Pp.y, 'Ph₃P', { r: 20, size: 10 });
      s += atom(Cy.x, Cy.y, 'C', { kind: 'hi' });
      s += atom(Cc.x, Cc.y, 'C', { kind: 'hi' });
      s += atom(O.x, O.y, 'O');
      s += lonePair(O.x, O.y, 180);
      s += curve(P(160, 372), P(160, 408), { bow: 16 });
      s += curve(P(56, 408), P(56, 372), { bow: 16 });
      s += arrow(P(210, 390), P(252, 390));
      const a = P(292, 356), bq = P(348, 356), c = P(348, 424), d = P(292, 424);
      s += bond(a, bq, { rFrom: 14, rTo: 14 });
      s += bond(bq, c, { rFrom: 14, rTo: 14 });
      s += bond(c, d, { rFrom: 14, rTo: 14 });
      s += bond(d, a, { rFrom: 14, rTo: 14 });
      s += atom(a.x, a.y, 'P', { kind: 'warn' });
      s += atom(bq.x, bq.y, 'C', { kind: 'hi' });
      s += atom(c.x, c.y, 'C', { kind: 'hi' });
      s += atom(d.x, d.y, 'O');
      s += text(192, 472, 'the oxaphosphetane — strained, and neutral', { cls: 'fg-sm', size: 10.5 });
      s += text(192, 494, 'nothing is charged; nothing has rearranged', { cls: 'fg-sm', size: 10.5 });
    }

    /* 4 — and the same loop run backwards. */
    s += tag(568, 292, '4 · retro-[2+2] — the ring breaks');
    s += panel(390, 300, 356, 216);
    {
      const a = P(452, 356), bq = P(508, 356), c = P(508, 424), d = P(452, 424);
      s += bond(a, bq, { rFrom: 14, rTo: 14 });
      s += bond(bq, c, { rFrom: 14, rTo: 14 });
      s += bond(c, d, { rFrom: 14, rTo: 14 });
      s += bond(d, a, { rFrom: 14, rTo: 14 });
      s += atom(a.x, a.y, 'P', { kind: 'warn' });
      s += atom(bq.x, bq.y, 'C', { kind: 'hi' });
      s += atom(c.x, c.y, 'C', { kind: 'hi' });
      s += atom(d.x, d.y, 'O');
      s += curve(P(480, 410), P(508, 384), { bow: 14 });
      s += curve(P(480, 370), P(452, 396), { bow: 14 });
      s += arrow(P(552, 390), P(592, 390));
      s += text(668, 366, 'R₂C=CH₂', { cls: 'fg-lbl', size: 13 });
      s += text(668, 394, '+   Ph₃P=O', { cls: 'fg-lbl', size: 13 });
      s += text(668, 420, '≈130–140 kcal/mol', { cls: 'fg-tag-good', size: 11 });
      s += text(568, 472, 'the strong P=O is the driving force', { cls: 'fg-sm', size: 10.5 });
      s += text(568, 494, 'and the reason phosphorus is worth throwing away', { cls: 'fg-sm', size: 10.5 });
    }

    s += rule(24, 528, 736, 528);
    s += label(380, 552, 'Going in, the loop of arrows makes the two new σ bonds of the ring.');
    s += label(380, 572, 'Coming out, the same loop reversed makes the C=C and the P=O.');
    return s;
  },
  caption: 'The whole reaction is one loop of arrows run forwards and then backwards. The first pair of arrows makes the two new &sigma; bonds of the four-membered ring; the second pair, running the other way round the same loop, breaks the other two and hands back the alkene and Ph<sub>3</sub>P=O.',
  note: 'Notice which two atoms become the alkene: the carbonyl carbon and the ylide carbon, and nothing else in either molecule moves at all. That is why a Wittig cannot rearrange and cannot put the double bond anywhere but where the C=O was &mdash; there is no carbocation, and no stage at which any other carbon is involved. The older stepwise picture inserts a betaine, Ph<sub>3</sub>P⁺&ndash;C&ndash;C&ndash;O⁻, between panels 2 and 3; it reaches the same ring, so it changes nothing about the product.',
});

export default FIGURES;
