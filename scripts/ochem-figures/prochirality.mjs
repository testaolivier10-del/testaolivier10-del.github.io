/* Figures for the prochirality notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 78 ---
   Prochirality. The whole section is one decision procedure, and a decision
   procedure drawn as a flowchart is the one place a picture beats prose
   outright: three branches, three names, three consequences. */
FIGURES.push({
  id: 'topicity-flowchart',
  section: 'prochirality',
  anchor: 'whose only job is to break the tie between two things that currently look alike.</p>',
  viewBox: '0 0 760 352',
  alt: 'A flowchart for two groups on one atom: replace one, replace the other, compare the products, and branch to homotopic, enantiotopic or diastereotopic',
  build() {
    let s = '';
    s += panel(212, 20, 336, 40);
    s += text(380, 45, 'Two identical-looking groups on one atom', { cls: 'fg-lbl', size: 11.5 });
    s += arrow(P(380, 62), P(380, 88));
    s += panel(170, 88, 420, 50, { kind: 'hi' });
    s += text(380, 110, 'Replace one with D. Undo it. Replace the other.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 128, 'Now compare the two products.', { cls: 'fg-sm', size: 10.5 });
    s += arrow(P(380, 140), P(380, 156));
    s += bond(P(130, 158), P(630, 158), { rFrom: 0, rTo: 0 });
    const cols = [
      { x: 130, q: 'the SAME compound', name: 'homotopic', kind: null,
        ex: 'the CH₂ of propane', f1: 'one NMR signal,', f2: 'and nothing can tell them apart' },
      { x: 380, q: 'ENANTIOMERS', name: 'enantiotopic', kind: 'hi',
        ex: 'the CH₂ of ethanol', f1: 'one NMR signal, but a chiral', f2: 'environment picks one out' },
      { x: 630, q: 'DIASTEREOMERS', name: 'diastereotopic', kind: 'warn',
        ex: 'the C3 H₂ of 2-bromobutane', f1: 'TWO NMR signals, and they', f2: 'split each other' },
    ];
    for (const c of cols) {
      s += arrow(P(c.x, 158), P(c.x, 182));
      s += text(c.x, 202, c.q, { cls: 'fg-tag', size: 10.5 });
      s += panel(c.x - 115, 212, 230, 44, c.kind ? { kind: c.kind } : {});
      s += text(c.x, 240, c.name, { cls: 'fg-lbl', size: 14 });
      s += text(c.x, 278, c.ex, { cls: 'fg-sm', size: 10 });
      s += text(c.x, 308, c.f1, { cls: c.kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', size: 10 });
      s += text(c.x, 324, c.f2, { cls: c.kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', size: 10 });
    }
    s += text(380, 348, 'Two questions decide it: does a stereocenter appear, and was anything already stereogenic?', { cls: 'fg-lbl', size: 11 });
    return s;
  },
  caption: 'The whole section as one procedure. Everything else here — the pro-R and pro-S labels, the Re and Si faces, the NMR consequences — is vocabulary hung on these three branches.',
  note: 'The bottom row is what the classification buys you. Homotopic and enantiotopic groups are indistinguishable to an ordinary spectrometer; only diastereotopic ones can show up separately, which is why that branch is the one an NMR problem cares about.',
});

/* ----------------------------------------------------------------- 79 ---
   The homotopic case, done first because it is the one students get right
   for the wrong reason ("same carbon, same hydrogen"). Showing both products
   side by side as literally the same drawing is the point. */
FIGURES.push({
  id: 'propane-homotopic',
  section: 'prochirality',
  anchor: 'but you did not need to find that axis to get the answer.</p>',
  viewBox: '0 0 760 316',
  alt: 'The substitution test on the CH2 of propane: replacing either hydrogen with deuterium gives the identical compound, so the two hydrogens are homotopic',
  build() {
    let s = '';
    const c = P(380, 74);
    const meL = P(306, 104), meR = P(454, 104), ha = P(342, 32), hb = P(418, 32);
    s += bond(c, meL, { rFrom: 16, rTo: 22 });
    s += bond(c, meR, { rFrom: 16, rTo: 22 });
    s += wedge(c, ha, { rFrom: 16, rTo: 12 });
    s += hash(c, hb, { rFrom: 16, rTo: 12 });
    s += atom(meL.x, meL.y, 'CH₃', { r: 22, size: 9.5 });
    s += atom(meR.x, meR.y, 'CH₃', { r: 22, size: 9.5 });
    s += atom(ha.x, ha.y, 'Ha', { r: 12, size: 10.5 });
    s += atom(hb.x, hb.y, 'Hb', { r: 12, size: 10.5 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(380, 132, 'propane — C2 carries two hydrogens and two methyls', { cls: 'fg-sm', size: 10 });

    s += arrow(P(320, 146), P(230, 176));
    s += text(214, 170, 'replace Ha', { cls: 'fg-tag', size: 10, anchor: 'end' });
    s += arrow(P(440, 146), P(530, 176));
    s += text(546, 170, 'replace Hb', { cls: 'fg-tag', size: 10, anchor: 'start' });

    const product = (cx) => {
      const k = P(cx, 232);
      let g = panel(cx - 140, 188, 280, 104);
      g += bond(k, P(cx - 68, 232), { rFrom: 16, rTo: 22 });
      g += bond(k, P(cx + 68, 232), { rFrom: 16, rTo: 22 });
      g += bond(k, P(cx, 200), { rFrom: 16, rTo: 12 });
      g += bond(k, P(cx, 268), { rFrom: 16, rTo: 12 });
      g += atom(cx - 68, 232, 'CH₃', { r: 22, size: 9.5 });
      g += atom(cx + 68, 232, 'CH₃', { r: 22, size: 9.5 });
      g += atom(cx, 200, 'H', { r: 12 });
      g += atom(cx, 268, 'D', { r: 12, kind: 'warn' });
      g += atom(k.x, k.y, 'C', { kind: 'hi' });
      return g;
    };
    s += product(180);
    s += product(580);
    s += text(380, 228, '=', { cls: 'fg-lbl', size: 22 });
    s += text(380, 256, 'identical', { cls: 'fg-tag-good', size: 11 });
    s += text(180, 310, 'CH₃–CHD–CH₃', { cls: 'fg-lbl', size: 12 });
    s += text(580, 310, 'CH₃–CHD–CH₃', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Why the labeled carbon never becomes a stereocenter: it is left holding <b>two identical methyl groups</b>, so there is only one 2-deuteriopropane and both routes arrive at it. That is what <b>homotopic</b> means.',
  note: 'A methyl group behaves the same way for the same reason, which is why a CH₃ in a spectrum is a clean three-hydrogen signal and never argues with itself. Homotopic is the easy branch — the trouble starts when substitution <i>does</i> create a stereocenter.',
});

/* ----------------------------------------------------------------- 80 ---
   The enantiotopic case. Two products drawn as actual mirror images across a
   mirror line, because "the products are enantiomers" is a claim about a
   picture and the reader should be able to check it. */
FIGURES.push({
  id: 'ethanol-substitution-test',
  section: 'prochirality',
  anchor: 'enantiotopic hydrogens live on perfectly ordinary achiral molecules.</p>',
  viewBox: '0 0 760 404',
  alt: 'The substitution test on the CH2 of ethanol: the two deuterated products are mirror images, so the two hydrogens are enantiotopic',
  build() {
    let s = '';
    const c = P(380, 84);
    const oh = P(380, 42), me = P(318, 122), ha = P(440, 108), hb = P(414, 136);
    s += bond(c, oh, { rFrom: 16, rTo: 15 });
    s += bond(c, me, { rFrom: 16, rTo: 22 });
    s += wedge(c, ha, { rFrom: 16, rTo: 12 });
    s += hash(c, hb, { rFrom: 16, rTo: 12 });
    s += atom(oh.x, oh.y, 'OH', { kind: 'hi', size: 10.5 });
    s += atom(me.x, me.y, 'CH₃', { r: 22, size: 9.5 });
    s += atom(ha.x, ha.y, 'Ha', { r: 12, size: 10.5 });
    s += atom(hb.x, hb.y, 'Hb', { r: 12, size: 10.5 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(380, 168, 'ethanol — C1 carries OH, CH₃ and two hydrogens', { cls: 'fg-sm', size: 10 });

    s += arrow(P(320, 180), P(232, 208));
    s += text(216, 202, 'replace Ha', { cls: 'fg-tag', size: 10, anchor: 'end' });
    s += arrow(P(440, 180), P(528, 208));
    s += text(544, 202, 'replace Hb', { cls: 'fg-tag', size: 10, anchor: 'start' });

    // Mirror images across x = 380: the left one splays CH3 to the lower
    // left, the right one to the lower right, everything else following.
    const product = (cx, sign, kind) => {
      const k = P(cx, 282);
      let g = panel(cx - 150, 222, 300, 126, { kind });
      const o = P(cx, 246), m = P(cx - 52 * sign, 314), d = P(cx + 54 * sign, 306), h = P(cx + 32 * sign, 330);
      g += bond(k, o, { rFrom: 16, rTo: 15 });
      g += bond(k, m, { rFrom: 16, rTo: 22 });
      g += wedge(k, d, { rFrom: 16, rTo: 12 });
      g += hash(k, h, { rFrom: 16, rTo: 12 });
      g += atom(o.x, o.y, 'OH', { kind: 'hi', size: 10.5 });
      g += atom(m.x, m.y, 'CH₃', { r: 22, size: 9.5 });
      g += atom(d.x, d.y, 'D', { r: 12, kind: 'warn' });
      g += atom(h.x, h.y, 'H', { r: 12 });
      g += atom(k.x, k.y, 'C', { kind: 'hi' });
      return g;
    };
    s += product(190, 1, 'hi');
    s += product(570, -1, 'warn');
    s += rule(380, 222, 380, 348);
    s += text(380, 216, 'mirror', { cls: 'fg-tag', size: 10 });
    s += text(190, 366, '(S)-1-deuterioethanol', { cls: 'fg-tag-good', size: 11.5 });
    s += text(570, 366, '(R)-1-deuterioethanol', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(380, 396, 'mirror images ⇒ the two hydrogens are enantiotopic', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Substitution turns C1 into a stereocenter, because OH, CH₃, D and H are four different groups — deuterium outranks ordinary hydrogen on mass number, which is the rule that makes the test work at all. The two products are mirror images, so the hydrogens are <b>enantiotopic</b>.',
  note: 'Ethanol itself has no stereocenter and is not chiral, and that is the point worth taking away: a molecule does not need a stereocenter to carry enantiotopic groups. It needs one only for the <i>diastereotopic</i> case.',
});

/* ----------------------------------------------------------------- 81 ---
   The diastereotopic case, which is the one the NMR payoff rests on. Drawn
   as skeletons so the untouched stereocenter at C2 is visibly untouched. */
FIGURES.push({
  id: 'bromobutane-c3-test',
  section: 'prochirality',
  anchor: 'that difference is the whole reason this classification earns a section.</p>',
  viewBox: '0 0 760 420',
  alt: 'The substitution test on C3 of 2-bromobutane: the two deuterated products are the 2R,3R and 2R,3S diastereomers, so the C3 hydrogens are diastereotopic',
  build() {
    let s = '';
    // Parent: zig-zag C1..C4 with Br on a wedge at C2 and both C3 hydrogens shown.
    const v1 = P(300, 104), v2 = P(340, 78), v3 = P(380, 104), v4 = P(420, 78);
    const br = P(340, 30), ha = P(352, 150), hb = P(412, 150);
    s += bond(v1, v2, { rFrom: 0, rTo: 0 });
    s += bond(v2, v3, { rFrom: 0, rTo: 0 });
    s += bond(v3, v4, { rFrom: 0, rTo: 0 });
    s += wedge(v2, br, { rFrom: 0, rTo: 15, width: 11 });
    s += wedge(v3, ha, { rFrom: 0, rTo: 12, width: 11 });
    s += hash(v3, hb, { rFrom: 0, rTo: 12, width: 11 });
    s += atom(br.x, br.y, 'Br', { kind: 'hi', size: 10.5 });
    s += atom(ha.x, ha.y, 'Ha', { r: 12, size: 10.5 });
    s += atom(hb.x, hb.y, 'Hb', { r: 12, size: 10.5 });
    s += text(322, 72, 'C2', { cls: 'fg-tag', size: 9.5, anchor: 'end' });
    s += text(398, 100, 'C3', { cls: 'fg-tag', size: 9.5, anchor: 'start' });
    s += text(380, 182, '(R)-2-bromobutane — C2 is already a stereocenter', { cls: 'fg-sm', size: 10 });

    s += arrow(P(320, 192), P(240, 208));
    s += text(224, 204, 'replace Ha', { cls: 'fg-tag', size: 10, anchor: 'end' });
    s += arrow(P(440, 192), P(520, 208));
    s += text(536, 204, 'replace Hb', { cls: 'fg-tag', size: 10, anchor: 'start' });

    const product = (cx, front, name, kind) => {
      let g = panel(cx - 150, 218, 300, 142, { kind });
      const w1 = P(cx - 60, 302), w2 = P(cx - 20, 278), w3 = P(cx + 20, 302), w4 = P(cx + 60, 278);
      const b = P(cx - 20, 240), d = P(cx + 46, 340);
      g += bond(w1, w2, { rFrom: 0, rTo: 0 });
      g += bond(w2, w3, { rFrom: 0, rTo: 0 });
      g += bond(w3, w4, { rFrom: 0, rTo: 0 });
      g += wedge(w2, b, { rFrom: 0, rTo: 14, width: 11 });
      g += (front ? wedge : hash)(w3, d, { rFrom: 0, rTo: 12, width: 11 });
      g += atom(b.x, b.y, 'Br', { kind: 'hi', r: 14, size: 10.5 });
      g += atom(d.x, d.y, 'D', { r: 12, kind: 'warn' });
      g += text(cx, 380, name, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', size: 13 });
      return g;
    };
    s += product(190, true, '(2R,3R)', 'hi');
    s += product(570, false, '(2R,3S)', 'warn');
    s += text(380, 380, 'C2 the same in both, C3 opposite', { cls: 'fg-tag-good', size: 11 });
    s += text(380, 408, '⇒ the two products are diastereomers', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The stereocenter that was already there is what changes the answer. C2 is untouched by either substitution and stays R; C3 becomes a new stereocenter with opposite configurations in the two products. One center matching and one inverted is the definition of <b>diastereomers</b>, so the C3 hydrogens are <b>diastereotopic</b>.',
  note: 'Diastereomers are different compounds — different melting points, different spectra, different reaction rates. That is the whole reason this branch of the flowchart matters, and it is why these two hydrogens can and usually do appear as two separate signals in a proton spectrum.',
});

/* ----------------------------------------------------------------- 82 ---
   The pro-R / pro-S rule. One drawing, one worked assignment beside it, so
   the reader can see that the promotion trick is the entire method. */
FIGURES.push({
  id: 'pro-r-pro-s',
  section: 'prochirality',
  anchor: 'naming one hydrogen names both.</p>',
  viewBox: '0 0 760 300',
  alt: 'Ethanol with its two C1 hydrogens labeled pro-R and pro-S, beside the four-step assignment that names them',
  build() {
    let s = '';
    const c = P(196, 150);
    const oh = P(196, 108), me = P(142, 186), hw = P(254, 180), hh = P(238, 206);
    s += bond(c, oh, { rFrom: 16, rTo: 15 });
    s += bond(c, me, { rFrom: 16, rTo: 22 });
    s += wedge(c, hw, { rFrom: 16, rTo: 12 });
    s += hash(c, hh, { rFrom: 16, rTo: 12 });
    s += atom(oh.x, oh.y, 'OH', { kind: 'hi', size: 10.5 });
    s += atom(me.x, me.y, 'CH₃', { r: 22, size: 9.5 });
    s += atom(hw.x, hw.y, 'H', { r: 12 });
    s += atom(hh.x, hh.y, 'H', { r: 12, kind: 'warn' });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(284, 174, 'pro-S', { cls: 'fg-tag-good', size: 12, anchor: 'start' });
    s += text(268, 224, 'pro-R', { cls: 'fg-tag-warn', size: 12, anchor: 'start' });
    s += text(196, 60, 'ethanol, C1', { cls: 'fg-tag', size: 11 });
    s += text(196, 262, 'the wedged H comes at you;', { cls: 'fg-sm', size: 9.5 });
    s += text(196, 278, 'the hashed H goes back', { cls: 'fg-sm', size: 9.5 });
    s += rule(348, 40, 348, 272);

    const lines = [
      ['1', 'Pick one hydrogen — here the hashed one.'],
      ['2', 'Promote it just above its twin in priority.'],
      ['3', 'Priorities: OH > CH₃ > this H > the other H.'],
      ['4', 'The other H is on the wedge, pointing at you,'],
      ['', 'so trace 1→2→3 as drawn, then reverse it.'],
      ['5', 'It reads counterclockwise, so the center is R:'],
      ['', 'this hydrogen is pro-R, its partner pro-S.'],
    ];
    s += text(362, 62, 'HOW THE LABEL IS ASSIGNED', { cls: 'fg-tag', size: 11, anchor: 'start' });
    lines.forEach((ln, i) => {
      const y = 96 + i * 26;
      if (ln[0]) s += text(362, y, ln[0] + '.', { cls: 'fg-tag', size: 11, anchor: 'start' });
      s += text(380, y, ln[1], { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    });
    return s;
  },
  caption: 'The rule in full: <b>promote the hydrogen you are naming just above its twin</b>, change nothing else, and assign the center the way you always do. The descriptor that comes out is the hydrogen’s name.',
  note: 'You never run the assignment twice. Promoting the other hydrogen instead reverses exactly one priority relationship, which reverses the descriptor — so one calculation labels both. Note also that the molecule is achiral: pro-R and pro-S name hydrogens, not compounds.',
});

/* ----------------------------------------------------------------- 83 ---
   Faces. Two things a reader cannot get from prose: which rotation defines
   Re, and why a flat carbon gives a 50:50 mixture. */
FIGURES.push({
  id: 're-si-faces',
  section: 'prochirality',
  anchor: 'so labeling one labels the other.</p>',
  viewBox: '0 0 760 364',
  alt: 'The Re and Si faces of acetaldehyde, and an edge-on view showing a nucleophile attacking a flat trigonal carbon from either face to give both enantiomers',
  build() {
    let s = '';
    s += tag(190, 34, 'NAMING THE FACE YOU ARE LOOKING AT');
    // CH3 on the RIGHT and H on the LEFT, so that O (1) -> CH3 (2) -> H (3)
    // really does sweep clockwise on the page. Drawn the other way round the
    // same three groups trace counterclockwise, which is the Si face, and the
    // figure would be teaching the opposite of what its caption says.
    const c = P(190, 146);
    const o = P(190, 86), me = P(254, 186), h = P(126, 186);
    s += bond(c, o, { order: 2, rFrom: 16, rTo: 15 });
    s += bond(c, me, { rFrom: 16, rTo: 22 });
    s += bond(c, h, { rFrom: 16, rTo: 12 });
    s += lonePair(o.x, o.y, -140);
    s += lonePair(o.x, o.y, -40);
    s += atom(o.x, o.y, 'O', { kind: 'hi' });
    s += atom(me.x, me.y, 'CH\u2083', { r: 22, size: 9.5 });
    s += atom(h.x, h.y, 'H', { r: 12 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(166, 80, '1', { cls: 'fg-tag-good', size: 13, anchor: 'end' });
    s += text(280, 216, '2', { cls: 'fg-tag-good', size: 13 });
    s += text(108, 182, '3', { cls: 'fg-tag-good', size: 13, anchor: 'end' });
    s += curve(P(220, 52), P(96, 210), { bow: -190 });
    s += text(190, 252, '1\u21922\u21923 runs clockwise from this side,', { cls: 'fg-lbl', size: 11 });
    s += text(190, 270, 'so you are looking at the Re face.', { cls: 'fg-tag-good', size: 11.5 });
    s += text(190, 294, 'The far side is the Si face.', { cls: 'fg-sm', size: 10 });

    s += rule(370, 26, 370, 306);

    s += tag(566, 34, 'WHY A FLAT CARBON GIVES A MIXTURE');
    s += bond(P(470, 160), P(662, 160), { rFrom: 0, rTo: 0 });
    s += text(474, 180, 'the sp\u00b2 plane, seen edge-on', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += arrow(P(566, 80), P(566, 142));
    s += arrow(P(566, 250), P(566, 186));
    s += text(566, 66, 'Nu\u207b from the Re face', { cls: 'fg-tag', size: 10.5 });
    s += text(566, 270, 'Nu\u207b from the Si face', { cls: 'fg-tag', size: 10.5 });
    s += text(590, 112, '\u2192 one enantiomer', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(590, 222, '\u2192 the mirror image', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(566, 290, 'Nothing achiral prefers one side, so both', { cls: 'fg-lbl', size: 11 });
    s += text(566, 308, 'happen equally and the product is racemic.', { cls: 'fg-lbl', size: 11 });
    s += text(380, 338, 'Put a stereocenter elsewhere and the two faces stop being equivalent \u2014', { cls: 'fg-lbl', size: 11 });
    s += text(380, 356, 'the two products then come out in unequal amounts.', { cls: 'fg-lbl', size: 11 });
    return s;
  },
  caption: 'Left: the face label is just a CIP trace done from one side — clockwise for 1 → 2 → 3 is <b>Re</b>, counterclockwise is <b>Si</b>, and the opposite side automatically gets the other name. Right: what the labels are for.',
  note: 'The right-hand panel is also the picture behind racemization at a carbocation. A trigonal carbon is flat, a nucleophile reaches it from either side with equal ease when nothing biases the approach, and a 50:50 mixture is the unavoidable result — not an experimental accident but a consequence of the geometry.',
});

/* ------------------------------------------------------------- 31.7 ---
   The two claims the prochirality section leans on hardest and never drew:
   that a ring alone makes a CH2 diastereotopic, and what that does to a
   spectrum. */
FIGURES.push({
  id: 'ring-diastereotopic-nmr',
  section: 'prochirality',
  anchor: 'Note that methylcyclohexane contains no stereocenter at all, which is worth holding on to — the ring alone was enough.</p>',
  alt: 'On the left, methylcyclohexane drawn as a flat ring with a methyl group on C1 and the two hydrogens of C2 drawn separately, one on a bold wedge and one on a hashed bond; replacing the wedged hydrogen with deuterium gives the cis product and replacing the hashed one gives the trans product, and those are diastereomers. On the right, two sketched NMR traces: one peak if the two hydrogens were equivalent, and two separate peaks that also split each other if they are diastereotopic.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    const verts = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = ((-90 + i * 60) * Math.PI) / 180;
        v.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return v;
    };

    /* ---- left: the ring, and the two products of the substitution test ---- */
    s += tag(196, 32, 'METHYLCYCLOHEXANE — NO STEREOCENTER');
    const v = verts(160, 140, 52);
    for (let i = 0; i < 6; i++) s += sk(v[i], v[(i + 1) % 6]);
    const c1 = v[3], c2 = v[2];
    s += bond(c1, P(c1.x, c1.y + 44), { rFrom: 0, rTo: 17 });
    s += atom(c1.x, c1.y + 44, 'CH₃', { r: 17 });
    s += wedge(c2, P(c2.x + 46, c2.y + 22), { rFrom: 0, rTo: 14 });
    s += hash(c2, P(c2.x + 46, c2.y - 22), { rFrom: 0, rTo: 14 });
    s += atom(c2.x + 46, c2.y + 22, 'Ha', { r: 14, size: 10.5 });
    s += atom(c2.x + 46, c2.y - 22, 'Hb', { r: 14, size: 10.5 });
    s += text(c1.x - 24, c1.y + 12, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(c2.x + 8, c2.y - 14, 'C2', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    s += text(40, 276, 'Ha → D  gives the D cis to the methyl', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += text(40, 298, 'Hb → D  gives the D trans to it', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += text(40, 322, 'cis and trans are diastereomers,', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(40, 342, 'so Ha and Hb are DIASTEREOTOPIC', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });

    s += rule(376, 40, 376, 360);

    /* ---- right: what that does to a spectrum ---- */
    s += tag(566, 32, 'A PREVIEW: WHAT A SPECTRUM SHOWS');
    const peak = (x, h, base, cls) =>
      `<path class="${cls}" fill="none" d="M${x - 18} ${base} Q${x - 7} ${base} ${x} ${base - h} Q${x + 7} ${base} ${x + 18} ${base}"></path>`;

    s += rule(410, 150, 730, 150);
    s += peak(566, 78, 150, 'fg-bond-soft');
    s += text(508, 96, 'one signal', { cls: 'fg-sm', size: 10.5, anchor: 'end' });
    s += text(410, 172, 'if the two were equivalent', { cls: 'fg-sm', size: 10.5, anchor: 'start' });

    s += rule(410, 300, 730, 300);
    s += peak(510, 62, 300, 'fg-bond-hi');
    s += peak(618, 62, 300, 'fg-bond-hi');
    s += text(510, 226, 'Ha', { cls: 'fg-tag-warn', size: 11 });
    s += text(618, 226, 'Hb', { cls: 'fg-tag-warn', size: 11 });
    s += text(410, 322, 'diastereotopic: two shifts, splitting each other', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    s += text(566, 348, 'Two different environments need not match.', { cls: 'fg-sm', size: 10.5 });

    s += rule(40, 372, 720, 372);
    s += text(380, 392, 'A ring gives a molecule a top and a bottom — that is all the test ever needs.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The two claims this section makes that a drawing settles faster than a sentence. <b>Left:</b> methylcyclohexane has no stereocenter, yet the two hydrogens on C2 are diastereotopic, because the ring gives the molecule a face to be on &mdash; one substitution puts the label cis to the methyl and the other puts it trans, and those are diastereomers. <b>Right:</b> the consequence, sketched.',
  note: 'The right-hand panel is a <b>preview of <a class="chapter-ref" href="/ochem/learn.html#m-spectroscopy">Spectroscopy</a></b> and is drawn only to the level this section needs: diastereotopic hydrogens may give two signals rather than one, and because they are inequivalent they also couple to each other. How much they are separated is not predictable from topicity &mdash; sometimes the two shifts happen to coincide and the pair looks equivalent. Topicity tells you they are <i>allowed</i> to differ, never by how much.',
});

export default FIGURES;
