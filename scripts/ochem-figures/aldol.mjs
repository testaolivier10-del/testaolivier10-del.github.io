/* Figures for the aldol notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ 4 ---
   Which bond forms in an aldol, and where the OH lands. This is the figure
   the "two carbons apart" wording needed. */
FIGURES.push({
  id: 'aldol-bond',
  section: 'aldol',
  anchor: '<h3>The aldol reaction, step by step</h3>',
  alt: 'The new carbon–carbon bond in an aldol, and the beta-hydroxy carbonyl product numbered',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    s += tag(160, 40, 'enolate (nucleophile)');
    s += tag(420, 40, 'carbonyl (electrophile)');

    // Enolate
    const ea = P(96, 130), eb = P(170, 130), eo = P(170, 76);
    s += bond(ea, eb, { order: 2 });
    s += bond(eb, eo);
    s += atom(eo.x, eo.y, 'O⁻', { kind: 'warn' });
    s += atom(eb.x, eb.y, 'C');
    s += atom(ea.x, ea.y, 'C', { kind: 'hi' });
    s += text(96, 168, 'alpha carbon', { cls: 'fg-tag', size: 10 });

    // Electrophile
    const fc = P(420, 130), fo = P(420, 76);
    s += bond(fc, fo, { order: 2 });
    s += atom(fo.x, fo.y, 'O');
    s += atom(fc.x, fc.y, 'C', { kind: 'hi' });
    s += text(420, 168, 'carbonyl carbon', { cls: 'fg-tag', size: 10 });

    // The bond that forms. The label goes above the curve's apex rather than
    // beside it, where it was landing on the enolate oxygen.
    s += curve(P(114, 120), P(404, 120), { bow: 56 });
    s += text(259, 96, 'the new C–C bond', { cls: 'fg-tag', size: 11 });

    s += arrow(P(300, 232), P(360, 232), { muted: true });

    // The product, numbered. The carbonyl is ONE call with order: 2 — drawing
    // a single bond and then a double bond over it renders three lines, which
    // reads as a triple bond.
    const p1 = P(430, 232), p2 = P(502, 232), p3 = P(574, 232);
    s += bond(p1, p2); s += bond(p2, p3);
    s += bond(p1, P(430, 186), { order: 2, rTo: 15 });
    s += atom(430, 186, 'O');
    s += bond(p3, P(574, 186), { rTo: 16 });
    s += atom(574, 186, 'OH');
    s += atom(p1.x, p1.y, 'C');
    s += atom(p2.x, p2.y, 'C');
    s += atom(p3.x, p3.y, 'C', { kind: 'hi' });
    // Numbering on two lines so three labels 72px apart stop colliding.
    const num = [[p1.x, 'C1', 'carbonyl'], [p2.x, 'C2', 'alpha'], [p3.x, 'C3', 'beta']];
    for (const [x, a, b] of num) {
      s += text(x, 266, a, { cls: 'fg-lbl', size: 11 });
      s += text(x, 282, b, { cls: 'fg-sm', size: 9.5 });
    }
    s += text(574, 300, 'the OH lands here', { cls: 'fg-tag-good', size: 10.5 });
    s += text(660, 232, 'beta-hydroxy', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(660, 248, 'carbonyl', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'Trace the bond and the product names itself. The alpha carbon of the enolate attacks the carbonyl carbon of the other molecule, and that is the only new bond in the reaction.',
  note: 'Count from the surviving carbonyl: it is C1, the alpha carbon that did the attacking is C2, and the new hydroxyl sits on C3 — the <b>beta</b> carbon. Hence beta-hydroxy carbonyl, and hence an alpha hydrogen sitting between two electron-withdrawing groups, which is exactly the setup the condensation step needs.',
});

/* ----------------------------------------------------------------- 89 ---
   The aldol's tetrahedral alkoxide: named in the prose, drawn nowhere, and it
   is the intermediate the whole reversibility argument turns on. */
FIGURES.push({
  id: 'aldol-tetrahedral-alkoxide',
  section: 'aldol',
  anchor: '<b>beta-hydroxy carbonyl</b>, with a new OH exactly two carbons from the retained carbonyl.</p>',
  viewBox: '0 0 720 330',
  alt: 'An enolate attacking a second aldehyde to give the tetrahedral alkoxide, which is then protonated',
  build() {
    let s = '';
    s += tag(112, 16, 'enolate — the nucleophile');
    s += tag(320, 34, 'a second aldehyde');

    const n1 = P(62, 112), n2 = P(126, 90), no = P(126, 46);
    s += bond(n1, n2, { order: 2 }); s += bond(n2, no);
    s += atom(n1.x, n1.y, 'CH₂', { kind: 'hi' }); s += atom(n2.x, n2.y, 'CH');
    s += atom(no.x, no.y, 'O⁻', { kind: 'warn' });
    s += lonePair(no.x, no.y, 180, { dist: 20 }); s += lonePair(no.x, no.y, 0, { dist: 20 });
    s += lonePair(no.x, no.y, 270, { dist: 20 });

    const m1 = P(244, 118), m2 = P(304, 96), mo = P(304, 50);
    s += bond(m1, m2); s += bond(m2, mo, { order: 2 });
    s += atom(m1.x, m1.y, 'CH₃'); s += atom(m2.x, m2.y, 'CH', { kind: 'hi' });
    s += atom(mo.x, mo.y, 'O');

    s += curve(P(76, 128), P(292, 114), { bow: 40 });
    s += text(184, 186, 'the only new bond in the reaction', { cls: 'fg-tag', size: 11 });
    s += curve(P(322, 76), P(324, 34), { bow: 16 });
    s += text(372, 56, 'pi electrons', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(372, 70, 'go to oxygen', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += arrow(P(410, 116), P(468, 116), { muted: true });

    const c = P(576, 116);
    const o = P(576, 62), me = P(524, 148), ch = P(640, 148);
    s += bond(c, o); s += bond(c, me); s += bond(c, ch, { rTo: 16 });
    s += atom(o.x, o.y, 'O⁻', { kind: 'warn' });
    s += lonePair(o.x, o.y, 180, { dist: 20 }); s += lonePair(o.x, o.y, 0, { dist: 20 });
    s += lonePair(o.x, o.y, 270, { dist: 20 });
    s += atom(me.x, me.y, 'CH₃'); s += atom(ch.x, ch.y, 'CH₂CHO', { r: 16 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(576, 190, 'tetrahedral alkoxide', { cls: 'fg-lbl', size: 12.5 });
    s += text(576, 208, 'sp³, and the charge is on O', { cls: 'fg-sm', size: 10.5 });

    s += rule(20, 236, 700, 236);
    s += text(24, 264, 'Water protonates it, hydroxide is handed back, and only then is it the product.', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(24, 290, '3-hydroxybutanal, CH₃–CH(OH)–CH₂–CHO — a beta-hydroxy aldehyde.', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(24, 314, 'Every arrow above is reversible, which is what makes the retro-aldol a real reaction.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The middle structure is the step students skip. The alpha carbon makes the bond, the pi electrons go up onto oxygen, and what you have at that moment is an <b>alkoxide</b> — not the product, and not yet neutral.',
  note: 'The protonation is the least interesting step and the one that decides whether the base was catalytic. Water hands a proton to the alkoxide and hydroxide comes back out, so the base is regenerated in the addition. Nothing here is irreversible, which is why the same conditions run the reaction backwards on a beta-hydroxy carbonyl.',
});

/* ----------------------------------------------------------------- 90 ---
   E1cb, the mechanism the chapter names and never draws. The carbanion in the
   middle is the whole reason hydroxide gets to leave. */
FIGURES.push({
  id: 'e1cb-dehydration',
  section: 'aldol',
  anchor: 'it is tolerable here because the enolate is doing the pushing.</p>',
  viewBox: '0 0 720 330',
  alt: 'The E1cb dehydration of an aldol product: deprotonation at the alpha carbon, then loss of hydroxide from the beta carbon',
  build() {
    let s = '';
    s += tag(180, 30, 'STEP 1 \u2014 take the \u03b1 hydrogen');
    s += tag(540, 30, 'STEP 2 \u2014 now hydroxide can go');

    // Panel 1: 3-hydroxybutanal, with hydroxide reaching for the alpha hydrogen
    const a0 = P(48, 140), a3 = P(106, 116), aoh = P(106, 70), a2 = P(164, 140), a1 = P(222, 116), ao = P(222, 70);
    s += bond(a0, a3); s += bond(a3, aoh, { rTo: 16 }); s += bond(a3, a2);
    s += bond(a2, a1); s += bond(a1, ao, { order: 2 });
    s += bond(a2, P(164, 192));
    s += atom(a0.x, a0.y, 'CH\u2083'); s += atom(a3.x, a3.y, 'CH'); s += atom(aoh.x, aoh.y, 'OH', { r: 16 });
    s += atom(a2.x, a2.y, 'CH', { kind: 'hi' }); s += atom(a1.x, a1.y, 'CH'); s += atom(ao.x, ao.y, 'O');
    s += atom(164, 192, 'H');
    s += text(196, 160, '\u03b1', { cls: 'fg-tag', size: 11 });
    s += text(78, 96, '\u03b2', { cls: 'fg-tag', size: 11 });
    s += text(248, 212, 'HO\u207b', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += curve(P(244, 206), P(182, 196), { bow: 18 });
    s += curve(P(156, 168), P(190, 132), { bow: -20 });
    s += curve(P(238, 92), P(244, 56), { bow: 12 });
    s += text(120, 216, 'three arrows, one step', { cls: 'fg-sm', size: 10 });

    s += arrow(P(292, 130), P(350, 130), { muted: true });

    // Panel 2: the enolate, still carrying the beta hydroxyl
    const b0 = P(392, 140), b3 = P(450, 116), boh = P(450, 70), b2 = P(508, 140), b1 = P(566, 116), bo = P(566, 70);
    s += bond(b0, b3); s += bond(b3, boh, { rTo: 16 }); s += bond(b3, b2);
    s += bond(b2, b1, { order: 2 }); s += bond(b1, bo);
    s += atom(b0.x, b0.y, 'CH\u2083'); s += atom(b3.x, b3.y, 'CH'); s += atom(boh.x, boh.y, 'OH', { r: 16 });
    s += atom(b2.x, b2.y, 'CH', { kind: 'hi' }); s += atom(b1.x, b1.y, 'CH'); s += atom(bo.x, bo.y, 'O\u207b', { kind: 'warn' });
    s += lonePair(bo.x, bo.y, 0, { dist: 20 }); s += lonePair(bo.x, bo.y, 180, { dist: 20 });
    s += lonePair(bo.x, bo.y, 270, { dist: 20 });
    s += curve(P(590, 58), P(576, 94), { bow: 14 });
    s += curve(P(534, 132), P(482, 130), { bow: 16 });
    s += curve(P(442, 100), P(434, 82), { bow: -10 });
    s += text(392, 176, 'and OH leaves', { cls: 'fg-sm', size: 10 });
    s += text(560, 196, 'a stabilized carbanion \u2014 the \u201ccb\u201d in E1cb', { cls: 'fg-tag-warn', size: 11 });

    s += rule(20, 236, 700, 236);
    s += text(24, 264, 'Deprotonate first, lose the leaving group second.', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(24, 290, 'Hydroxide would never leave on its own. The enolate is what pushes it out.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(24, 316, 'Product: (E)-but-2-enal \u2014 the new C=C conjugated with the old C=O.', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'The dehydration drawn out. It is not E1 and not E2: the proton comes off first, and the anion left behind is an enolate, which is the only reason a hydroxide is willing to leave from the carbon next door.',
  note: 'Check the bookkeeping on the left-hand structure before you start. The hydrogen that comes off is on the <b>alpha</b> carbon — alpha to the carbonyl, not to the hydroxyl — and the group that leaves is on the <b>beta</b> carbon. That is why the new double bond is always Cα=Cβ, and therefore always conjugated with the carbonyl. An aldol condensation that fails is never failing for lack of conjugation.',
});

/* ---------------------------------------------------------------- 192 ---
   The aldol section describes the acid route in a full paragraph — neutral
   enol in, protonated carbonyl out, and a dehydration with no cation in it —
   and drew none of it. A bank item had drifted into keying a beta carbocation
   "stabilized by conjugation with the carbonyl", which is the opposite of the
   truth, so the drawing has to say where the electrons actually go. */
FIGURES.push({
  id: 'acid-catalyzed-aldol',
  section: 'aldol',
  anchor: "The enol attacks the protonated carbonyl, and losing the enol's OH proton leaves the neutral beta-hydroxy carbonyl.</p>",
  viewBox: '0 0 760 500',
  alt: 'The acid-catalyzed aldol: a neutral enol attacking a protonated ketone, then the dehydration in which the enol pi bond pushes water off the beta carbon',
  build() {
    let s = '';
    s += tag(132, 42, 'ENOL — neutral, and the nucleophile');
    s += tag(430, 42, 'PROTONATED CARBONYL — the electrophile');

    // The enol
    const e1 = P(70, 150), e2 = P(130, 122), eo = P(130, 74), e3 = P(190, 150);
    s += bond(e1, e2, { order: 2 }); s += bond(e2, eo, { rTo: 16 }); s += bond(e2, e3, { rTo: 16 });
    s += atom(e1.x, e1.y, 'CH₂', { kind: 'hi' }); s += atom(e2.x, e2.y, 'C');
    s += atom(eo.x, eo.y, 'OH', { r: 16 });
    s += lonePair(eo.x, eo.y, 180, { dist: 21 }); s += lonePair(eo.x, eo.y, 0, { dist: 21 });
    s += atom(e3.x, e3.y, 'CH₃', { r: 16 });

    // Acetone with its oxygen protonated
    const m1 = P(360, 150), m2 = P(420, 122), mo = P(420, 74), m3 = P(480, 150);
    s += bond(m2, m1, { rTo: 16 }); s += bond(m2, mo, { order: 2, rTo: 18 }); s += bond(m2, m3, { rTo: 16 });
    s += atom(m1.x, m1.y, 'CH₃', { r: 16 }); s += atom(m2.x, m2.y, 'C', { kind: 'hi' });
    s += atom(mo.x, mo.y, 'OH⁺', { kind: 'warn', r: 18 });
    s += lonePair(mo.x, mo.y, 340, { dist: 23 });
    s += atom(m3.x, m3.y, 'CH₃', { r: 16 });

    s += curve(P(92, 142), P(418, 146), { bow: 44 });
    s += text(248, 212, 'the enol C=C makes the new C–C bond', { cls: 'fg-tag', size: 11 });
    s += curve(P(440, 104), P(442, 66), { bow: 14 });
    s += text(512, 96, 'the pi pair goes up,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(512, 110, 'leaving a neutral OH', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(380, 244, 'The attacking carbon has spent its pi pair, so its OWN oxygen is left as C=OH⁺ —', { cls: 'fg-lbl', size: 12.5 });
    s += text(380, 266, 'and handing that proton to the solvent gives the neutral beta-hydroxy ketone. The acid is back.', { cls: 'fg-sm', size: 10.5 });

    s += rule(24, 292, 736, 292);
    s += tag(392, 310, 'AND THE DEHYDRATION — still no cation');

    // The enol of the aldol product, with the beta hydroxyl protonated
    const d0 = P(66, 394), d3 = P(124, 366), dw = P(124, 314), d2 = P(182, 394), d1 = P(240, 366), dOH = P(240, 314);
    s += bond(d0, d3, { rTo: 16 }); s += bond(d3, dw, { rTo: 20 }); s += bond(d3, d2, { rTo: 16 });
    s += bond(d2, d1, { order: 2, rFrom: 16, rTo: 16 }); s += bond(d1, dOH, { rTo: 16 });
    s += atom(d0.x, d0.y, 'CH₃', { r: 16 }); s += atom(d3.x, d3.y, 'CH', { r: 16 });
    s += atom(dw.x, dw.y, 'OH₂⁺', { kind: 'warn', r: 20 });
    s += atom(d2.x, d2.y, 'CH', { kind: 'hi', r: 16 }); s += atom(d1.x, d1.y, 'CH', { r: 16 });
    s += atom(dOH.x, dOH.y, 'OH', { r: 16 });
    s += lonePair(dOH.x, dOH.y, 20, { dist: 21 });
    s += text(96, 340, 'β', { cls: 'fg-tag', size: 11 });
    s += text(216, 406, 'α', { cls: 'fg-tag', size: 11 });

    s += curve(P(262, 328), P(248, 346), { bow: 12 });
    s += curve(P(212, 368), P(156, 372), { bow: -30 });
    s += curve(P(130, 342), P(146, 320), { bow: -12 });
    s += text(150, 436, 'three arrows, one push —', { cls: 'fg-sm', size: 10 });
    s += text(150, 452, 'the water never leaves alone', { cls: 'fg-sm', size: 10 });

    s += arrow(P(310, 366), P(370, 366), { muted: true });
    s += text(340, 350, '−H⁺', { cls: 'fg-tag', size: 11 });

    const q0 = P(432, 394), q1 = P(490, 366), q2 = P(548, 394), q3 = P(606, 366), qo = P(606, 318);
    s += bond(q0, q1, { rTo: 16 }); s += bond(q1, q2, { order: 2, rFrom: 16, rTo: 16 });
    s += bond(q2, q3, { rTo: 16 }); s += bond(q3, qo, { order: 2, rFrom: 16 });
    s += atom(q0.x, q0.y, 'CH₃', { r: 16 }); s += atom(q1.x, q1.y, 'CH', { r: 16 });
    s += atom(q2.x, q2.y, 'CH', { r: 16 }); s += atom(q3.x, q3.y, 'CH', { r: 16 });
    s += atom(qo.x, qo.y, 'O');
    s += text(520, 444, '(E)-but-2-enal — conjugated, and it does not come back', { cls: 'fg-tag-good', size: 11 });

    s += text(380, 484, 'A cation on the beta carbon is not an option: it would sit two atoms from an electron-poor carbonyl.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The acid route with every charge accounted for. No enolate appears, because acid never makes a strong base, and no carbocation appears either — the neutral enol attacks a carbonyl that acid has made hungrier, and in the dehydration the enol pi bond shoves the water out as it goes.',
  note: 'Set this against the base-catalyzed drawings above and the symmetry is the point. Base improves the <b>nucleophile</b> by taking a proton off; acid improves the <b>electrophile</b> by putting one on. Neither route ever puts a positive charge on the beta carbon, and a mechanism that asks you to believe in one is asking for the least stable cation in the molecule.',
});

/* ---------------------------------------------------------------- 193 ---
   The hexanedial worked example asks the student to count a ring and then
   shows nothing, which is exactly the case where a picture does the work. */
FIGURES.push({
  id: 'intramolecular-aldol-ring',
  section: 'aldol',
  anchor: 'So work out every enolate the substrate can form, count the ring each one would close, and keep the five or the six.</p>',
  viewBox: '0 0 760 470',
  alt: 'Hexanedial numbered C1 to C6 with the C2 enolate reaching C6, and the five-membered ring product it gives',
  build() {
    let s = '';
    s += tag(240, 44, 'HEXANEDIAL — number it before you do anything else');

    const c1 = P(96, 152), o1 = P(96, 104), c2 = P(152, 180), c3 = P(208, 152),
          c4 = P(264, 180), c5 = P(320, 152), c6 = P(376, 180), o6 = P(376, 132);
    s += bond(c1, o1, { order: 2, rTo: 15 }); s += bond(c1, c2, { rFrom: 16, rTo: 17 });
    s += bond(c2, c3, { rFrom: 17, rTo: 17 }); s += bond(c3, c4, { rFrom: 17, rTo: 17 });
    s += bond(c4, c5, { rFrom: 17, rTo: 17 }); s += bond(c5, c6, { rFrom: 17, rTo: 16 });
    s += bond(c6, o6, { order: 2, rFrom: 16, rTo: 15 });
    s += atom(c1.x, c1.y, 'CH', { r: 16 }); s += atom(o1.x, o1.y, 'O');
    s += atom(c2.x, c2.y, 'CH₂', { kind: 'hi', r: 17 });
    s += atom(c3.x, c3.y, 'CH₂', { r: 17 }); s += atom(c4.x, c4.y, 'CH₂', { r: 17 });
    s += atom(c5.x, c5.y, 'CH₂', { r: 17 });
    s += atom(c6.x, c6.y, 'CH', { kind: 'hi', r: 16 }); s += atom(o6.x, o6.y, 'O');

    s += text(96, 74, 'C1', { cls: 'fg-tag', size: 11 });
    s += text(118, 202, 'C2', { cls: 'fg-tag', size: 11 });
    s += text(208, 120, 'C3', { cls: 'fg-tag', size: 11 });
    s += text(230, 202, 'C4', { cls: 'fg-tag', size: 11 });
    s += text(320, 120, 'C5', { cls: 'fg-tag', size: 11 });
    s += text(376, 102, 'C6', { cls: 'fg-tag', size: 11 });
    s += text(152, 226, 'the enolate', { cls: 'fg-sm', size: 10 });
    s += text(414, 208, 'the carbonyl it can reach', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += curve(P(166, 200), P(362, 200), { bow: 46 });
    s += text(264, 276, 'C2 attacks C6, and the ring that closes is C2·C3·C4·C5·C6 — five atoms', { cls: 'fg-tag-good', size: 11 });
    s += text(560, 250, 'C2 attacking C1 makes no ring —', { cls: 'fg-sm', size: 10 });
    s += text(560, 266, 'those two are already bonded.', { cls: 'fg-sm', size: 10 });

    s += rule(24, 302, 736, 302);

    // The five-membered ring, then the condensation product
    const pent = (cx, cy, r) => {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a = (-90 + i * 72) * Math.PI / 180;
        pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return pts;
    };
    const ringOf = (pts, skip) => {
      let g = '';
      for (let i = 0; i < 5; i++) {
        if (i === skip) continue;
        g += bond(pts[i], pts[(i + 1) % 5], { rFrom: 0, rTo: 0 });
      }
      return g;
    };

    const a = pent(150, 384, 46), ac = P(150, 384);
    s += ringOf(a, -1);
    s += bond(a[0], P(150, 306), { rFrom: 0, rTo: 16 });
    s += atom(150, 306, 'CHO', { r: 18 });
    s += bond(a[1], P(250, 344), { rFrom: 0, rTo: 16 });
    s += atom(250, 344, 'OH', { r: 16 });
    s += text(150, 452, '2-hydroxycyclopentane-1-carbaldehyde', { cls: 'fg-sm', size: 10 });

    s += arrow(P(300, 396), P(370, 396));
    s += text(336, 380, 'heat, −H₂O', { cls: 'fg-tag', size: 11 });

    const b = pent(470, 384, 46), bc = P(470, 384);
    s += ringOf(b, 0);
    s += ringDouble(b[0], b[1], bc);
    s += bond(b[0], P(470, 306), { rFrom: 0, rTo: 16 });
    s += atom(470, 306, 'CHO', { r: 18 });
    s += text(470, 452, 'cyclopent-1-ene-1-carbaldehyde', { cls: 'fg-sm', size: 10 });

    s += text(596, 372, 'A ring with an enone', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(596, 390, 'in it is the signature', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(596, 408, 'of this reaction.', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'Count the ring before you draw it. The C2 enolate can only reach C6, and the atoms it encloses on the way round — C2 through C6 — come to five, which is exactly the size that closes.',
  note: 'The habit worth building is to number the chain first and pick an enolate second. Most dicarbonyl substrates offer more than one, and it is the arithmetic rather than the mechanism that rules the others out: three and four are too strained, and seven and up ask two chain ends to find each other against entropy.',
});

/* ---------------------------------------------------------------- 195 ---
   "Draw that contributor once and both electrophilic sites are obvious" —
   and then the section did not draw it. */
FIGURES.push({
  id: 'enone-two-electrophiles',
  section: 'aldol',
  anchor: 'Draw that contributor once and both electrophilic sites are obvious.</p>',
  viewBox: '0 0 760 318',
  alt: 'An enone and its resonance contributor with positive charge on the beta carbon, marking the 1,2 and 1,4 sites',
  build() {
    let s = '';
    s += tag(160, 44, 'the enone as you normally draw it');
    s += tag(552, 44, 'the contributor worth drawing once');

    const b1 = P(70, 152), b2 = P(130, 122), b3 = P(190, 152), bo = P(190, 104), b4 = P(250, 182);
    s += bond(b1, b2, { order: 2 }); s += bond(b2, b3); s += bond(b3, bo, { order: 2 });
    s += bond(b3, b4, { rTo: 16 });
    s += atom(b1.x, b1.y, 'CH₂'); s += atom(b2.x, b2.y, 'CH'); s += atom(b3.x, b3.y, 'C');
    s += atom(bo.x, bo.y, 'O'); s += atom(b4.x, b4.y, 'CH₃', { r: 16 });
    s += curve(P(104, 126), P(156, 124), { bow: -22 });
    s += curve(P(208, 132), P(208, 92), { bow: 14 });

    s += arrow(P(320, 144), P(384, 144), { muted: true });
    s += arrow(P(384, 160), P(320, 160), { muted: true });

    const r1 = P(452, 152), r2 = P(512, 122), r3 = P(572, 152), ro = P(572, 104), r4 = P(632, 182);
    s += bond(r1, r2); s += bond(r2, r3, { order: 2 }); s += bond(r3, ro);
    s += bond(r3, r4, { rTo: 16 });
    s += atom(r1.x, r1.y, 'CH₂', { kind: 'warn' }); s += atom(r2.x, r2.y, 'CH');
    s += atom(r3.x, r3.y, 'C'); s += atom(ro.x, ro.y, 'O⁻', { kind: 'warn' });
    s += lonePair(ro.x, ro.y, 180, { dist: 21 }); s += lonePair(ro.x, ro.y, 0, { dist: 21 });
    s += lonePair(ro.x, ro.y, 270, { dist: 21 });
    s += atom(r4.x, r4.y, 'CH₃', { r: 16 });
    s += text(430, 137, '⊕', { cls: 'fg-warn', size: 14 });
    s += text(452, 194, 'the beta carbon is', { cls: 'fg-tag-warn', size: 11 });
    s += text(452, 210, 'the electron-poor one', { cls: 'fg-tag-warn', size: 11 });

    s += text(176, 220, 'carbonyl carbon — 1,2', { cls: 'fg-tag', size: 11 });
    s += text(66, 196, 'beta carbon — 1,4', { cls: 'fg-tag', size: 11 });

    s += rule(24, 240, 736, 240);
    s += text(24, 268, 'One molecule, two electrophilic carbons — and the right-hand drawing is why.', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(24, 294, 'Hard nucleophiles take the carbonyl carbon; soft, stabilized ones take the beta carbon.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Push the C=C electrons toward the carbonyl and the charge lands on the beta carbon. That single drawing is what turns "the beta carbon is electrophilic" from an assertion into something you can see.',
  note: 'Both contributors describe the same molecule, so both sites are electrophilic at the same time — the question is never which one the molecule offers, only which one a given nucleophile takes. Note also where the negative charge sits in the contributor: on oxygen, which is why the anion produced by conjugate addition is an enolate and can be trapped or alkylated rather than simply quenched.',
});

export default FIGURES;
