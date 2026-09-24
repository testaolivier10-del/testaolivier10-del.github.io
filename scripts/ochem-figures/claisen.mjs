/* Figures for the claisen notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 91 ---
   The tetrahedral intermediate is the entire difference between a Claisen and
   an aldol, and the section's only figure labeled it in passing. */
FIGURES.push({
  id: 'claisen-tetrahedral',
  section: 'claisen',
  anchor: 'The intermediate collapses, expelling the alkoxide and reforming the carbonyl. The product is a <b>beta-ketoester</b>.</p>',
  viewBox: '0 0 720 400',
  alt: 'An ester enolate attacking a second ester, the tetrahedral intermediate drawn in full, and the beta-ketoester it collapses to',
  build() {
    let s = '';
    s += tag(118, 34, 'ester enolate');
    s += tag(344, 34, 'a second ester');

    const n1 = P(58, 116), n2 = P(122, 94), no = P(122, 50), noe = P(186, 122);
    s += bond(n1, n2, { order: 2 }); s += bond(n2, no); s += bond(n2, noe, { rTo: 16 });
    s += atom(n1.x, n1.y, 'CH₂', { kind: 'hi' }); s += atom(n2.x, n2.y, 'C');
    s += atom(no.x, no.y, 'O⁻', { kind: 'warn' }); s += atom(noe.x, noe.y, 'OEt', { r: 16 });

    const m1 = P(274, 134), m2 = P(334, 112), mo = P(334, 66), moe = P(396, 134);
    s += bond(m1, m2); s += bond(m2, mo, { order: 2 }); s += bond(m2, moe, { rTo: 16 });
    s += atom(m1.x, m1.y, 'CH₃'); s += atom(m2.x, m2.y, 'C', { kind: 'hi' });
    s += atom(mo.x, mo.y, 'O'); s += atom(moe.x, moe.y, 'OEt', { r: 16 });

    s += curve(P(72, 132), P(330, 134), { bow: 44 });
    s += text(200, 190, 'the new C–C bond', { cls: 'fg-tag', size: 11 });
    s += curve(P(352, 92), P(354, 50), { bow: 16 });

    s += arrow(P(438, 112), P(492, 112), { muted: true });

    const c = P(596, 112);
    s += bond(c, P(596, 58)); s += bond(c, P(542, 144), { rTo: 16 }); s += bond(c, P(652, 144), { rTo: 16 });
    s += bond(c, P(540, 78), { rTo: 16 });
    s += atom(596, 58, 'O⁻', { kind: 'warn' });
    s += atom(542, 144, 'CH₃'); s += atom(652, 144, 'OEt', { r: 16 });
    s += atom(540, 78, 'CH₂CO₂Et', { r: 16 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(600, 186, 'tetrahedral intermediate', { cls: 'fg-lbl', size: 12.5 });
    s += text(600, 204, 'this one has an OEt to expel', { cls: 'fg-tag-warn', size: 11 });

    s += rule(20, 224, 700, 224);
    s += text(24, 252, 'An aldol’s alkoxide has nothing to lose, so it gets protonated. This one collapses.', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });

    const p1 = P(58, 334), p2 = P(116, 312), po = P(116, 274), p3 = P(174, 334), p4 = P(232, 312), po2 = P(232, 274), p5 = P(294, 334);
    s += bond(p1, p2); s += bond(p2, po, { order: 2 }); s += bond(p2, p3);
    s += bond(p3, p4); s += bond(p4, po2, { order: 2 }); s += bond(p4, p5, { rTo: 16 });
    s += atom(p1.x, p1.y, 'CH₃'); s += atom(p2.x, p2.y, 'C'); s += atom(po.x, po.y, 'O');
    s += atom(p3.x, p3.y, 'CH₂', { kind: 'hi' }); s += atom(p4.x, p4.y, 'C'); s += atom(po2.x, po2.y, 'O');
    s += atom(p5.x, p5.y, 'OEt', { r: 16 });
    s += text(174, 372, 'pKₐ 11 — the most acidic thing in the flask', { cls: 'fg-tag-good', size: 11 });

    s += text(346, 374, 'EtO⁻', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += curve(P(344, 368), P(186, 348), { bow: 22 });
    s += text(400, 350, 'takes it, and does not give it back —', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(400, 368, 'which is why you need a full equivalent.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Follow the middle structure and the aldol comparison makes itself. Both reactions build the same bond with the same nucleophile and arrive at a tetrahedral carbon; only this one is carrying a group worth expelling, so only this one restores a carbonyl.',
  note: 'The last line of the drawing is the step that makes the reaction go. Everything before it is reversible and roughly thermoneutral; the product, once formed, is deprotonated between its two carbonyls and cannot go back until the acidic workup. That is also the arithmetic behind the stoichiometry — one equivalent of alkoxide is locked up per equivalent of product.',
});

/* ---------------------------------------------------------------- 194 ---
   The Dieckmann worked example counts a ring in prose, in a chapter whose
   whole argument is that a reaction is a claim about which bond forms. */
FIGURES.push({
  id: 'dieckmann-ring',
  section: 'claisen',
  anchor: 'five- and six-membered rings form readily and larger or smaller ones do not, because the transition state has to bring the two ends together without strain.</p>',
  viewBox: '0 0 760 470',
  alt: 'Diethyl adipate numbered C1 to C6 with the C2 enolate reaching C6, and the five-membered beta-ketoester it closes to',
  build() {
    let s = '';
    s += tag(240, 44, 'DIETHYL ADIPATE — six carbons, two of them ester carbonyls');

    const oe1 = P(40, 122), c1 = P(96, 152), o1 = P(96, 104), c2 = P(152, 180),
          c3 = P(208, 152), c4 = P(264, 180), c5 = P(320, 152), c6 = P(376, 180),
          o6 = P(376, 132), oe6 = P(432, 152);
    s += bond(oe1, c1, { rFrom: 16, rTo: 15 });
    s += bond(c1, o1, { order: 2, rTo: 15 }); s += bond(c1, c2, { rTo: 17 });
    s += bond(c2, c3, { rFrom: 17, rTo: 17 }); s += bond(c3, c4, { rFrom: 17, rTo: 17 });
    s += bond(c4, c5, { rFrom: 17, rTo: 17 }); s += bond(c5, c6, { rFrom: 17 });
    s += bond(c6, o6, { order: 2, rTo: 15 }); s += bond(c6, oe6, { rTo: 16 });
    s += atom(oe1.x, oe1.y, 'EtO', { r: 16 }); s += atom(c1.x, c1.y, 'C');
    s += atom(o1.x, o1.y, 'O'); s += atom(c2.x, c2.y, 'CH₂', { kind: 'hi', r: 17 });
    s += atom(c3.x, c3.y, 'CH₂', { r: 17 }); s += atom(c4.x, c4.y, 'CH₂', { r: 17 });
    s += atom(c5.x, c5.y, 'CH₂', { r: 17 }); s += atom(c6.x, c6.y, 'C', { kind: 'hi' });
    s += atom(o6.x, o6.y, 'O'); s += atom(oe6.x, oe6.y, 'OEt', { r: 16 });

    s += text(96, 74, 'C1', { cls: 'fg-tag', size: 11 });
    s += text(118, 202, 'C2', { cls: 'fg-tag', size: 11 });
    s += text(208, 120, 'C3', { cls: 'fg-tag', size: 11 });
    s += text(230, 202, 'C4', { cls: 'fg-tag', size: 11 });
    s += text(320, 120, 'C5', { cls: 'fg-tag', size: 11 });
    s += text(376, 102, 'C6', { cls: 'fg-tag', size: 11 });
    s += text(508, 180, 'this OEt is the', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(508, 196, 'one that leaves', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += curve(P(166, 200), P(362, 200), { bow: 46 });
    s += text(264, 276, 'C2 attacks C6 — the ring is C2·C3·C4·C5·C6, five atoms, so it goes', { cls: 'fg-tag-good', size: 11 });

    s += rule(24, 300, 736, 300);

    const pent = (cx, cy, r) => {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const ang = (-90 + i * 72) * Math.PI / 180;
        pts.push(P(cx + r * Math.cos(ang), cy + r * Math.sin(ang)));
      }
      return pts;
    };
    const p = pent(150, 378, 46);
    for (let i = 0; i < 5; i++) s += bond(p[i], p[(i + 1) % 5], { rFrom: 0, rTo: 0 });
    s += bond(p[0], P(150, 300), { rFrom: 0, rTo: 15, order: 2 });
    s += atom(150, 300, 'O');
    s += bond(p[4], P(56, 342), { rFrom: 0, rTo: 20 });
    s += atom(56, 342, 'CO₂Et', { r: 20 });
    s += bond(p[4], P(92, 418), { rFrom: 0, rTo: 11 });
    s += atom(92, 418, 'H', { kind: 'hi', r: 11 });
    s += text(150, 458, 'ethyl 2-oxocyclopentane-1-carboxylate', { cls: 'fg-sm', size: 10 });

    s += text(272, 332, 'That hydrogen sits between a ring ketone and', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(272, 354, 'an ester — pKa about 11 — and the ethoxide takes it', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 374, 'and keeps it. The closure is driven by the same last', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 394, 'step as any other Claisen.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 426, 'Diethyl glutarate, one carbon shorter, would have to', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(272, 444, 'close a four-membered ring, and does not react at all.', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'A Dieckmann is a Claisen with both partners tied into one molecule, so the only new question is the ring. Number the chain, pick the enolate, and count what the new bond encloses.',
  note: 'Check that the driving step survives the closure, because that is what a Dieckmann question is really testing. The carbon that attacked ends up between the new ring ketone and the ester it kept, so it still carries an acidic hydrogen for the ethoxide to remove. A substrate whose product has no hydrogen in that position has the same trouble as an ester with only one alpha hydrogen: nothing pulls the equilibrium across.',
});

export default FIGURES;
