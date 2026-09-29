/* Figures for the gilman-reagents notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 36 ---
   The most testable fact in the chapter, and one a drawing settles faster
   than a paragraph: the same enone, the same R group, two products, chosen
   by the metal alone. */
FIGURES.push({
  id: 'twelve-fourteen',
  section: 'gilman-reagents',
  anchor: '<h3>Two: coupling with alkyl halides</h3>',
  viewBox: '0 0 760 330',
  alt: 'One enone attacked at the carbonyl carbon by a Grignard to give an allylic alcohol, and at the beta carbon by a cuprate to give a beta-substituted ketone',
  build() {
    let s = '';
    // The shared enone: beta = alpha = carbonyl.
    const b = P(300, 108), a = P(360, 142), c = P(420, 108), o = P(420, 52);
    s += atom(b.x, b.y, 'β', { kind: 'hi' });
    s += atom(a.x, a.y, 'α', { });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += atom(o.x, o.y, 'O', { });
    s += bond(b, a, { order: 2 });
    s += bond(a, c);
    s += bond(c, o, { order: 2 });
    s += text(360, 40, 'one enone, two electrophilic carbons', { cls: 'fg-tag', size: 11 });

    // Hard nucleophile, to the carbonyl.
    s += curve(P(560, 92), P(444, 96), { bow: -24 });
    s += text(600, 86, 'RMgX — hard', { cls: 'fg-lbl', size: 12 });
    s += text(600, 106, 'charge control', { cls: 'fg-sm', size: 10 });
    s += text(600, 132, '1,2 → allylic alcohol', { cls: 'fg-tag-good', size: 11 });

    // Soft nucleophile, to the beta carbon.
    s += curve(P(150, 128), P(276, 118), { bow: -24 });
    s += text(112, 86, 'R₂CuLi — soft', { cls: 'fg-lbl', size: 12 });
    s += text(112, 106, 'orbital control', { cls: 'fg-sm', size: 10 });
    s += text(112, 132, '1,4 → β-alkyl ketone', { cls: 'fg-tag-good', size: 11 });

    s += rule(34, 196, 726, 196);
    s += text(380, 224, 'The substrate is identical. The R group is identical. The conditions are identical.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 246, 'Only the metal differs, and the metal is the whole answer.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 286, 'A hard nucleophile goes where the charge is largest — the carbonyl carbon.', { cls: 'fg-sm', size: 10.5 });
    s += text(380, 306, 'A soft one goes where the orbital coefficient is largest — the β carbon.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'One enone and two nucleophiles carrying the same R group. The hard, charge-dense Grignard adds at the carbonyl carbon; the soft, polarizable cuprate adds at the β carbon, and the enolate it forms protonates on workup to give the ketone back with the new group installed.',
  note: 'The carbonyl carbon still carries the larger partial positive charge — that is exactly why the Grignard picks it, and why saying the cuprate “prefers the more electrophilic site” gets the reasoning backwards. The metal is the dominant factor rather than the only one \u2014 a catalytic copper salt added to a Grignard will switch it to 1,4, which is the same argument arriving by a different route. What does not move it is temperature.',
});

/* ---------------------------------------------------------------- C5 ---
   1,4-addition is stated everywhere in the section and the enolate it goes
   through is drawn nowhere, although three bank items hinge on it. Drawn
   skeletal, which this far past chapter 2 is how a ring should look. */
FIGURES.push({
  id: 'conjugate-addition-enolate',
  section: 'gilman-reagents',
  anchor: '<p><b>What the question is really testing</b> is whether you notice that the carbonyl reappears without the nucleophile ever having touched it.</p>\n</div>',
  viewBox: '0 0 700 372',
  alt: 'Cyclohexenone drawn as a ring in three frames: a cuprate delivering a methyl group to the beta carbon with arrows pushing the charge onto oxygen, the enolate that results with its negative oxygen and a carbon-carbon double bond next to the former carbonyl, and the saturated ketone after protonation at the alpha carbon',
  build() {
    let s = '';
    /* A hexagon of unlabelled vertices: v0 is the carbonyl carbon at the top
       and the numbering runs anticlockwise, so v5 is alpha and v4 is beta. */
    const ring = (cx, cy) => [
      P(cx, cy - 42), P(cx + 36.4, cy - 21), P(cx + 36.4, cy + 21),
      P(cx, cy + 42), P(cx - 36.4, cy + 21), P(cx - 36.4, cy - 21),
    ];
    const skeleton = (v, opts) => {
      let t = '';
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        const order = (i === 4 && opts.ene === 'ab') || (i === 5 && opts.ene === 'enol') ? 2 : 1;
        t += bond(v[i], v[j], { rFrom: 0, rTo: 0, order, gap: 4 });
      }
      return t;
    };

    const frame = (cx, opts) => {
      const v = ring(cx, 150);
      s += panel(cx - 98, 44, 196, 230, opts.kind);
      s += skeleton(v, opts);
      // the carbonyl or the enolate oxygen, above the top vertex
      s += bond(v[0], P(cx, 66), { rFrom: 0, rTo: 15, order: opts.co, gap: 4 });
      s += atom(cx, 66, opts.o, opts.o === 'O⁻' ? { kind: 'warn' } : {});
      if (opts.r) {
        s += bond(v[4], P(cx - 80, 196), { rFrom: 0, rTo: 17 });
        s += atom(cx - 80, 196, 'CH₃', { kind: 'hi', r: 17 });
      }
      return v;
    };

    /* 1 — the cuprate delivers a methyl to beta. */
    let v = frame(122, { o: 'O', co: 2, ene: 'ab' });
    s += atom(152, 238, 'R₂CuLi', { kind: 'hi', r: 30 });
    s += curve(P(130, 218), P(94, 182), { bow: -18 });
    s += curve(P(72, 150), P(96, 118), { bow: -20 });
    s += curve(P(138, 92), P(140, 74), { bow: 14 });
    s += text(64, 190, 'β', { cls: 'fg-tag', size: 11 });
    s += text(64, 118, 'α', { cls: 'fg-tag', size: 11 });
    s += tag(122, 292, '1 · the cuprate adds at β');

    s += arrow(P(228, 150), P(256, 150));

    /* 2 — the enolate, drawn explicitly. */
    frame(360, { o: 'O⁻', co: 1, ene: 'enol', r: true, kind: { kind: 'warn' } });
    s += text(384, 56, '⊖', { cls: 'fg-lbl', size: 13 });
    s += tag(360, 292, '2 · what forms is the enolate');

    s += arrow(P(466, 150), P(494, 150));
    s += tag(480, 132, 'H₃O⁺');

    /* 3 — protonation at alpha gives the ketone back. */
    frame(598, { o: 'O', co: 2, ene: null, r: true });
    s += bond(P(561.6, 129), P(524, 110), { rFrom: 0, rTo: 15 });
    s += atom(524, 110, 'H', { kind: 'hi' });
    s += tag(598, 292, '3 · workup protonates at α');

    s += rule(20, 312, 680, 312);
    s += label(350, 336, 'The nucleophile never touches the carbonyl carbon.');
    s += label(350, 358, 'The carbonyl still comes back, because what forms first is an enolate.');
    return s;
  },
  caption: 'Conjugate addition in three frames. The cuprate arrives at the &beta; carbon, the &pi; electrons move up onto oxygen, and what sits in the flask is an <b>enolate</b> &mdash; not a ketone. The ketone appears only when workup puts a proton on the &alpha; carbon.',
  note: 'This is why the reaction reads as though nothing happened to the carbonyl. It did change: the C=O became C&ndash;O⁻ and a new C=C appeared next to it, and both changes are undone on workup. A Grignard, being hard, attacks the top vertex instead and the C=O never comes back at all &mdash; it ends as the alcohol.',
});

export default FIGURES;
