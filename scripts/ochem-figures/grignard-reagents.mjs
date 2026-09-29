/* Figures for the grignard-reagents notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 34 ---
   The table in the prose lists seven electrophiles. What it cannot show is
   that they sort into three product classes by one thing: how many carbon
   groups were already on the carbonyl carbon. */
FIGURES.push({
  id: 'grignard-products',
  section: 'grignard-reagents',
  anchor: '<h3>The ester problem</h3>',
  viewBox: '0 0 760 330',
  alt: 'Four electrophiles sorted by how many carbon groups end up on the carbinol carbon, giving primary, secondary and tertiary alcohols',
  build() {
    let s = '';
    const rows = [
      { y: 70,  e: 'Formaldehyde',  had: '0 C groups', out: '1° alcohol',  w: 70,  k: 'hi' },
      { y: 128, e: 'Other aldehyde', had: '1 C group',  out: '2° alcohol', w: 150, k: 'hi' },
      { y: 186, e: 'Ketone',        had: '2 C groups', out: '3° alcohol',  w: 230, k: 'hi' },
      { y: 244, e: 'Ester',         had: '1 C group, but adds twice', out: '3° alcohol', w: 230, k: 'warn' },
    ];
    s += tag(130, 44, 'electrophile');
    s += tag(340, 44, 'carbon groups already there');
    s += tag(610, 44, 'product');
    for (const r of rows) {
      s += label(24, r.y + 4, r.e, { anchor: 'start', size: 12 });
      s += text(340, r.y + 4, r.had, { cls: 'fg-sm', size: 10.5 });
      s += bar(470, r.y - 10, r.w, 20, { kind: r.k, opacity: 0.34 });
      s += text(610, r.y + 4, r.out, { cls: r.k === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11 });
    }
    s += rule(34, 276, 726, 276);
    s += text(380, 302, 'Three of these are a counting exercise. The fourth needs a mechanism:', { cls: 'fg-lbl', size: 12 });
    s += text(380, 322, 'the ester expels alkoxide to a ketone that is hungrier than the ester was.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'What comes out of a Grignard addition, sorted by how many carbon groups the electrophile already carried. Formaldehyde has none and gives a primary alcohol, any other aldehyde has one and gives a secondary, a ketone has two and gives a tertiary.',
  note: 'The ester is the row that breaks the pattern, and it is the one people get wrong. It starts with one carbon group like an aldehyde, but the first addition expels the alkoxide to leave a ketone — and a ketone has no electron-donating OR group, so it is a better electrophile than the ester was. A second equivalent attacks before you can stop it, which is why limiting the stoichiometry does not help.',
});

/* ---------------------------------------------------------------- C2 ---
   The chapter's central mechanism, which the prose asserts three times and
   nothing draws: the first addition makes a BETTER electrophile than the one
   it consumed, so rationing the reagent cannot help. */
FIGURES.push({
  id: 'ester-adds-twice',
  section: 'grignard-reagents',
  anchor: 'It is still reactive enough to be attacked as fast as it forms, which is enough to spoil the selectivity.</p>',
  viewBox: '0 0 700 520',
  alt: 'Three panels: methylmagnesium bromide adding to ethyl propanoate, the tetrahedral alkoxide expelling ethoxide to give a ketone, and a second equivalent adding to that ketone to give 2-methylbutan-2-ol with its two identical methyl groups highlighted',
  build() {
    let s = '';

    /* 1 — the addition. */
    s += panel(24, 44, 320, 200);
    s += bond(P(196, 120), P(196, 80), { order: 2, rFrom: 16, rTo: 15 });
    s += bond(P(196, 120), P(248, 152), { rFrom: 16, rTo: 15 });
    s += bond(P(196, 120), P(144, 152), { rFrom: 16, rTo: 15 });
    s += atom(196, 80, 'O');
    s += atom(248, 152, 'OEt', { kind: 'warn' });
    s += atom(144, 152, 'Et');
    s += atom(196, 120, 'C', { kind: 'hi' });
    s += lonePair(196, 80, 210);
    s += atom(82, 96, 'CH₃MgBr', { kind: 'hi', r: 34 });
    s += curve(P(120, 112), P(180, 116), { bow: 22 });
    s += curve(P(208, 102), P(210, 84), { bow: 14 });
    s += tag(184, 220, '1 · the Grignard adds');

    /* 2 — collapse. */
    s += panel(364, 44, 312, 200);
    s += bond(P(520, 120), P(520, 76), { rFrom: 16, rTo: 16 });
    s += bond(P(520, 120), P(572, 150), { rFrom: 16, rTo: 15 });
    s += bond(P(520, 120), P(468, 150), { rFrom: 16, rTo: 15 });
    s += bond(P(520, 120), P(576, 92), { rFrom: 16, rTo: 15 });
    s += atom(520, 76, 'O⁻', { kind: 'warn' });
    s += atom(572, 150, 'OEt', { kind: 'warn' });
    s += atom(468, 150, 'Et');
    s += atom(576, 92, 'CH₃', { kind: 'hi' });
    s += atom(520, 120, 'C', { kind: 'hi' });
    s += lonePair(520, 76, 200);
    s += curve(P(494, 86), P(512, 102), { bow: 18 });
    s += curve(P(548, 138), P(594, 170), { bow: -20 });
    s += text(620, 190, 'EtO⁻ goes', { cls: 'fg-tag-warn', size: 11 });
    s += tag(500, 220, '2 · the alkoxide is expelled');

    /* 3 — and the ketone is a hungrier electrophile than the ester was. */
    s += panel(24, 268, 652, 200);
    s += bond(P(240, 340), P(240, 300), { order: 2, rFrom: 16, rTo: 15 });
    s += bond(P(240, 340), P(188, 372), { rFrom: 16, rTo: 15 });
    s += bond(P(240, 340), P(292, 372), { rFrom: 16, rTo: 15 });
    s += atom(240, 300, 'O');
    s += atom(188, 372, 'Et');
    s += atom(292, 372, 'CH₃', { kind: 'hi' });
    s += atom(240, 340, 'C', { kind: 'warn' });
    s += lonePair(240, 300, 210);
    s += atom(120, 316, 'CH₃MgBr', { kind: 'hi', r: 34 });
    s += curve(P(158, 332), P(224, 336), { bow: 22 });
    s += curve(P(252, 322), P(254, 304), { bow: 14 });
    s += arrow(P(360, 340), P(430, 340));
    s += tag(395, 324, 'then H₃O⁺');
    s += bond(P(540, 340), P(540, 300), { rFrom: 16, rTo: 15 });
    s += bond(P(540, 340), P(488, 372), { rFrom: 16, rTo: 15 });
    s += bond(P(540, 340), P(592, 372), { rFrom: 16, rTo: 15 });
    s += bond(P(540, 340), P(596, 316), { rFrom: 16, rTo: 15 });
    s += atom(540, 300, 'OH');
    s += atom(488, 372, 'Et');
    s += atom(592, 372, 'CH₃', { kind: 'hi' });
    s += atom(596, 316, 'CH₃', { kind: 'hi' });
    s += atom(540, 340, 'C');
    s += tag(300, 440, '3 · the second equivalent adds, giving the tertiary alcohol');

    s += rule(20, 484, 680, 484);
    s += label(350, 508, 'Rationing the reagent cannot help: the intermediate wants it more than the ester did.');
    return s;
  },
  caption: 'Why an ester cannot be stopped at the ketone. The first addition expels ethoxide and leaves a <b>ketone</b> &mdash; and a ketone has no electron-donating OR group, so it is a better electrophile than the ester ever was. The second equivalent is consumed faster than the first.',
  note: 'Compare panel 2 with the carboxylate dianion in the next section. There, nothing can be expelled at all, so no ketone ever forms in the flask &mdash; and that single difference is the whole reason one reaction stops at the ketone and this one does not. The two highlighted methyls in the product are identical because both came from the same reagent, which is how you spot this case in a question.',
});

/* ---------------------------------------------------------------- C3 ---
   The two-carbon extension, drawn once. Three separate places test the
   regiochemistry of the opening and none of them shows it. */
FIGURES.push({
  id: 'epoxide-two-carbons',
  section: 'grignard-reagents',
  anchor: 'Add water at any point before the epoxide and there is no reagent left to do anything with.</p>\n</div>',
  viewBox: '0 0 700 266',
  alt: 'A Grignard reagent attacking ethylene oxide at a ring carbon from the side opposite the oxygen, the carbon-oxygen bond breaking, and after acidic workup a primary alcohol two carbons longer',
  build() {
    let s = '';
    s += bond(P(56, 150), P(116, 150), { rFrom: 16, rTo: 22 });
    s += atom(56, 150, 'R', { kind: 'hi' });
    s += atom(116, 150, 'MgBr', { r: 22 });

    s += bond(P(250, 108), P(224, 156), { rFrom: 15, rTo: 15 });
    s += bond(P(250, 108), P(276, 156), { rFrom: 15, rTo: 15 });
    s += bond(P(224, 156), P(276, 156), { rFrom: 15, rTo: 15 });
    s += atom(250, 108, 'O');
    s += atom(224, 156, 'CH₂', { kind: 'hi' });
    s += atom(276, 156, 'CH₂');
    s += lonePair(250, 108, 300);

    s += curve(P(146, 162), P(206, 166), { bow: 26 });
    s += curve(P(230, 136), P(238, 112), { bow: -16 });
    s += tag(170, 212, 'backside attack, at the less hindered carbon');

    s += arrow(P(330, 150), P(390, 150));
    s += tag(360, 132, 'then H₃O⁺');

    s += bond(P(430, 150), P(486, 150), { rFrom: 16, rTo: 17 });
    s += bond(P(486, 150), P(542, 150), { rFrom: 17, rTo: 17 });
    s += bond(P(542, 150), P(598, 150), { rFrom: 17, rTo: 16 });
    s += atom(430, 150, 'R', { kind: 'hi' });
    s += atom(486, 150, 'CH₂', { kind: 'hi', r: 17 });
    s += atom(542, 150, 'CH₂', { kind: 'hi', r: 17 });
    s += atom(598, 150, 'OH', { r: 16 });
    s += tag(514, 196, 'two new carbons');

    s += rule(20, 222, 680, 222);
    s += label(350, 244, 'The OH ends up two carbons away from the new C–C bond.');
    return s;
  },
  caption: 'An epoxide opening under a Grignard. There is no acid present, so nothing protonates the ring oxygen and no carbocation character develops: the attack is a plain S<sub>N</sub>2 at the <i>less hindered</i> carbon, from the side opposite the C&ndash;O bond that breaks.',
  note: 'Ethylene oxide is symmetrical, so the regiochemistry does not change the answer here &mdash; which is exactly why it is worth drawing before a substituted epoxide turns up, where it decides the answer completely. Under acid the rule inverts, because the protonated epoxide opens with the positive charge developing at the carbon best able to carry it.',
});

export default FIGURES;
