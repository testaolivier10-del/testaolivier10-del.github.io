/* Figures for the organometallic-bonding notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 33 ---
   The chapter's premise in one picture. The prose says the polarity flips
   and a reader nods; put the two bonds side by side with their Pauling
   numbers and the claim becomes arithmetic. */
FIGURES.push({
  id: 'polarity-flip',
  section: 'organometallic-bonding',
  anchor: '<h3>The family, in order of reactivity</h3>',
  viewBox: '0 0 760 320',
  alt: 'The same carbon drawn bonded to chlorine and to magnesium, with the partial charges on carbon reversed between the two',
  build() {
    let s = '';
    const pair = (ox, partner, pe, dc, kind, role, note) => {
      s += panel(ox, 48, 330, 148, { kind });
      const c = P(ox + 110, 122), x = P(ox + 220, 122);
      s += atom(c.x, c.y, 'C', { kind: kind === 'warn' ? 'warn' : 'hi' });
      s += atom(x.x, x.y, partner, { });
      s += bond(c, x);
      s += text(c.x, c.y - 30, dc, { cls: 'fg-lbl', size: 14 });
      s += text(x.x, x.y - 30, dc === 'δ+' ? 'δ−' : 'δ+', { cls: 'fg-lbl', size: 14 });
      s += text(c.x, c.y + 40, '2.55', { cls: 'fg-sm', size: 10 });
      s += text(x.x, x.y + 40, pe, { cls: 'fg-sm', size: 10 });
      s += text(ox + 165, 176, role, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11.5 });
      s += text(ox + 165, 222, note, { cls: 'fg-sm', size: 10.5 });
    };
    pair(24,  'Cl', '3.16', 'δ+', 'warn', 'carbon is the electrophile', 'gets attacked — every SN1, SN2 and E2');
    pair(406, 'Mg', '1.31', 'δ−', null,   'carbon is the nucleophile', 'does the attacking — builds the skeleton');
    s += arrow(P(356, 122), P(400, 122));
    s += text(378, 108, '+ Mg', { cls: 'fg-tag', size: 10.5 });

    s += rule(34, 248, 726, 248);
    s += text(380, 274, 'The same carbon, in the halide and in the reagent made from it.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 296, 'Nothing was added and nothing left — only the partner’s electronegativity changed.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Why a metal makes carbon nucleophilic. Chlorine at 3.16 outranks carbon, so the electrons go to chlorine and the carbon is attacked; magnesium at 1.31 does not, so the electrons stay on carbon and that carbon now attacks. The deliberate reversal is called umpolung.',
  note: 'Note which quantity is doing the work here. What changed between the two bonds is not how many electrons carbon has in total but which side of one bond the shared pair sits on \u2014 and that is set by a single number for each partner. Everything else about the molecule is untouched, which is why the reversal costs exactly one step.',
});

/* ---------------------------------------------------------------- C1 ---
   The chapter's most-tested failure, drawn. The section calls the acid–base
   quench "the single most common way a synthesis on paper fails" and then
   never shows it: both fates start at the SAME bond, which is the whole
   reason one crowds the other out. */
FIGURES.push({
  id: 'quench-or-add',
  section: 'organometallic-bonding',
  anchor: '&ldquo;Make the Grignard from this&rdquo; is only a legal instruction when the halide is otherwise inert.</p>',
  viewBox: '0 0 700 372',
  alt: 'One Grignard reagent with curved arrows leaving the same carbon-magnesium bond in two directions: left to the hydrogen of an alcohol, giving R-H and a magnesium alkoxide, and right to the carbonyl carbon of a ketone, giving the magnesium alkoxide of the addition product',
  build() {
    let s = '';
    /* The reagent, once, in the middle. Everything below branches off the
       one bond, which is the claim. */
    s += bond(P(318, 84), P(380, 84), { rFrom: 16, rTo: 22 });
    s += atom(318, 84, 'R', { kind: 'hi' });
    s += atom(380, 84, 'MgBr', { r: 22 });
    s += tag(349, 50, 'one C–Mg bond, two fates');

    /* Left: the proton transfer. */
    s += bond(P(84, 214), P(140, 214), { rFrom: 15, rTo: 15 });
    s += bond(P(140, 214), P(192, 214), { rFrom: 15, rTo: 15 });
    s += atom(84, 214, 'R′');
    s += atom(140, 214, 'O');
    s += atom(192, 214, 'H', { kind: 'warn' });
    s += lonePair(140, 214, 228);
    s += lonePair(140, 214, 312);
    s += curve(P(342, 94), P(206, 200), { bow: 44 });
    s += curve(P(166, 228), P(146, 234), { bow: 16 });
    s += label(140, 278, 'R–H  +  R′O⁻ ⁺MgBr');
    s += text(140, 302, 'one equivalent, spent', { cls: 'fg-tag-warn', size: 11 });
    s += text(236, 132, 'faster', { cls: 'fg-tag-warn', size: 11 });

    /* Right: the addition you actually wanted. */
    s += bond(P(556, 214), P(556, 170), { order: 2, rFrom: 16, rTo: 15 });
    s += bond(P(556, 214), P(520, 250), { rFrom: 16, rTo: 15 });
    s += bond(P(556, 214), P(592, 250), { rFrom: 16, rTo: 15 });
    s += atom(556, 170, 'O');
    s += atom(520, 250, 'R′');
    s += atom(592, 250, 'R′');
    s += atom(556, 214, 'C', { kind: 'hi' });
    s += lonePair(556, 170, 200);
    s += lonePair(556, 170, 340);
    s += curve(P(354, 94), P(534, 202), { bow: -44 });
    s += curve(P(572, 196), P(574, 176), { bow: 16 });
    s += label(556, 278, 'the magnesium alkoxide');
    s += text(556, 302, 'what you wanted', { cls: 'fg-tag-good', size: 11 });
    s += text(452, 132, 'only if no acidic H is there', { cls: 'fg-tag', size: 11 });

    s += rule(20, 322, 680, 322);
    s += label(350, 346, 'Both arrows start in the same place: the C–Mg bond.');
    s += label(350, 366, 'The left one is faster, which is why it happens first.');
    return s;
  },
  caption: 'The same reagent, the same bond, two things it can do. On the left the carbanion takes a proton and leaves as R&ndash;H; on the right it adds to a carbonyl. Nothing about the right-hand reaction is difficult &mdash; it simply never gets a turn while an acidic hydrogen is in the flask.',
  note: 'This is why &ldquo;how many equivalents?&rdquo; is a real question rather than bookkeeping. Every acidic proton in the substrate consumes one equivalent before any addition happens, so a molecule with one O&ndash;H needs two equivalents to give a product at all &mdash; and a student who writes one gets their starting material back, which is a legitimate exam answer.',
});

export default FIGURES;
