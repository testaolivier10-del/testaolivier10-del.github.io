/* Figures for the reaction-heavy half of the ochem textbook.

   Figure density across the book, counted before this file existed:

     Foundations                     2.8 per section
     Organic Structure               2.7
     Alkanes & Conformations         2.4
     ...
     Carbonyl Chemistry              1.3
     Aromatic Chemistry              1.3
     Carboxylic Acids & Derivatives  1.0
     Enolate Chemistry               1.0
     Amines                          1.0

   Exactly backwards. The front of the book is where a picture is a nice
   extra — a p orbital, a chair — and the back is where it is the only honest
   way to state the claim, because a reaction IS which bond broke and which
   formed. Prose can assert that; a drawing shows it.

   Each figure below names the section it belongs to and an anchor — a string
   already in that section's prose — and is written in after it. The generated
   block sits between markers so the prose around it stays hand-edited:

     <!-- fig:id:start -->  ...generated...  <!-- fig:id:end -->

   The markers live inside the prose, which build-notes-pages.mjs copies
   through untouched, so the two generators compose without knowing about
   each other.

   Figures can also live in scripts/ochem-figures/<topic>.mjs (one module per
   topic, default-exporting an array of definitions), and a definition can
   list `lessons: [...]` to show the same figure inside lesson steps, between
   the same markers placed in a step's HTML string.

     node scripts/build-ochem-figures.mjs                 write
     node scripts/build-ochem-figures.mjs --only=<topic>  write one module's figures
     node scripts/build-ochem-figures.mjs --check         fail if stale (CI)
*/
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, figure, P } from './lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing } from './lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from './lib/ochem-helpers.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
/* --only=<module> builds just the figures in scripts/ochem-figures/<module>.mjs
   and touches no other page, so two people working on two chapters' figures
   at once cannot overwrite each other's pages. */
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).replace(/\.mjs$/, '');

const FIGURES = [];






/* ------------------------------------------------------------------ 5 ---
   Where the charge goes in the sigma complex. The hardest idea in Module 13
   and the one most obviously a picture. */
FIGURES.push({
  id: 'directing-charge',
  section: 'directing-effects',
  anchor: '<h3>The question</h3>',
  alt: 'Positive charge positions in the sigma complex for ortho, meta and para attack',
  viewBox: '0 0 760 356',
  build() {
    let s = '';
    const ring = (cx, cy, r) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
      }
      return pts;
    };
    /* Vertex 0 is the top and carries G. The electrophile adds at `attacked`,
       making that carbon sp3; the cation is then shared over the three
       carbons ortho and para TO THE ATTACKED ONE. Working those out from the
       attack position rather than hard-coding them is what keeps the meta
       panel honest — and G gets its own position outside the ring, because
       drawing it on the vertex put the substituent on top of a + sign. */
    const panels = [
      { x: 150, title: 'attack ORTHO', attacked: 1 },
      { x: 380, title: 'attack META',  attacked: 2 },
      { x: 610, title: 'attack PARA',  attacked: 3 },
    ];
    panels.forEach((p) => {
      const pts = ring(p.x, 166, 48);
      const charged = [(p.attacked + 1) % 6, (p.attacked + 3) % 6, (p.attacked + 5) % 6];
      const hitsG = charged.includes(0);
      s += tag(p.x, 66, p.title);
      for (let i = 0; i < 6; i++) s += bond(pts[i], pts[(i + 1) % 6], { rFrom: 14, rTo: 14 });
      for (let i = 0; i < 6; i++) {
        if (i === p.attacked) {
          s += atom(pts[i].x, pts[i].y, 'sp³', { kind: 'plain', r: 15, size: 9.5 });
        } else if (charged.includes(i)) {
          s += atom(pts[i].x, pts[i].y, '+', { kind: 'warn', r: 14 });
        }
      }
      // G hangs off vertex 0 on a bond of its own.
      s += bond(pts[0], P(p.x, 166 - 48 - 36), { rFrom: 14, rTo: 15 });
      s += atom(p.x, 166 - 48 - 36, 'G', { kind: 'hi', r: 15 });
      // And the electrophile hangs off the carbon it added to.
      const a = pts[p.attacked];
      const ux = (a.x - p.x) / 48, uy = (a.y - 166) / 48;
      s += bond(a, P(a.x + ux * 34, a.y + uy * 34), { rFrom: 15, rTo: 13, cls: 'fg-bond-hi' });
      s += atom(a.x + ux * 34, a.y + uy * 34, 'E', { kind: 'hi', r: 13, size: 11 });
      s += text(p.x, 284, hitsG ? '+ reaches the G carbon' : '+ never reaches it',
        { cls: hitsG ? 'fg-tag-good' : 'fg-tag-mut', size: 10.5 });
    });
    s += text(380, 318, 'A donating G is happy next to a +, so it steers the attack ortho and para.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 340, 'A withdrawing G cannot bear one, and meta is the only attack that avoids it.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Directing effects are one observation about geography. In the sigma complex, the positive charge is shared over three ring carbons — and which three depends on where the electrophile attacked.',
  note: 'Attack ortho or para and one of the charged carbons is the one carrying the substituent. Attack meta and none of them is. So a group that <b>donates</b> wants the charge next to it and steers the electrophile ortho and para; a group that <b>withdraws</b> cannot bear a positive charge on its own carbon, and meta is the only attack that avoids putting one there. Nothing about this is memorized — it is read off the picture.',
});




















/* ------------------------------------------------------------------ C1 ---
   The ladder the section describes in a table of one-carbon compounds. The
   table gives the rungs; what it cannot show is the width of a rung - that
   five named families sit on the acid rung together, which is the whole
   reason acyl substitution is not redox chemistry. The figure adds that
   second axis. */
FIGURES.push({
  id: 'oxidation-ladder',
  section: 'oxidation-states',
  anchor: 'the number depends on what else is attached.</p>',
  alt: 'The carbon oxidation ladder, with the one-carbon example, the count of bonds to heteroatoms, and the functional group families sharing each rung',
  viewBox: '0 0 760 404',
  build() {
    let s = '';
    const rows = [
      { y: 84,  n: '4', ex: 'CO\u2082',   ox: '+4',      fam: 'CO\u2082   \u00B7   CCl\u2084' },
      { y: 140, n: '3', ex: 'HCO\u2082H', ox: '+2',      fam: 'carboxylic acid \u00B7 ester \u00B7 amide \u00B7 acid chloride \u00B7 nitrile', sub: '(RCO\u2082H is +3)' },
      { y: 196, n: '2', ex: 'CH\u2082O',  ox: '0',       fam: 'aldehyde \u00B7 ketone \u00B7 acetal \u00B7 imine' },
      { y: 252, n: '1', ex: 'CH\u2083OH', ox: '\u22122', fam: 'alcohol \u00B7 ether \u00B7 alkyl halide \u00B7 amine', hi: true },
      { y: 308, n: '0', ex: 'CH\u2084',   ox: '\u22124', fam: 'alkane' },
    ];
    /* The families column is the widest thing here and the acid rung's list
       is the widest row in it, so it is set from a left edge rather than
       centered: centered, it started underneath the oxidation-state column and
       ended past the right of what the reading column shows. The direction
       arrow moves to the left margin for the same reason — its label was
       the other casualty. */
    s += tag(110, 50, 'one-carbon case');
    s += tag(200, 50, 'bonds to O/N/X');
    s += tag(276, 50, 'that C\u2019s state');
    s += text(318, 50, 'everything that shares the rung', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += rule(30, 62, 700, 62);
    // The highlight goes down first, so the row's own labels sit on top of it.
    for (const r of rows) if (r.hi) s += panel(72, r.y - 20, 628, 40, { kind: 'hi' });
    for (const r of rows) {
      s += label(110, r.y + 4, r.ex, { size: 13 });
      s += text(200, r.y + 4, r.n, { cls: 'fg-lbl', size: 12.5 });
      s += text(282, r.y + 4, r.ox, { cls: 'fg-lbl', size: 12.5 });
      s += text(318, r.y + 4, r.fam, { cls: 'fg-sm', size: 10, anchor: 'start' });
      if (r.sub) s += text(282, r.y + 20, r.sub, { cls: 'fg-sm', size: 8 });
      if (r.y !== 308) s += rule(30, r.y + 28, 700, r.y + 28);
    }
    // Direction of travel, in the left margin where nothing else is drawn.
    s += arrow(P(46, 300), P(46, 92));
    s += text(46, 78, 'oxidation', { cls: 'fg-tag', size: 10.5 });
    s += rule(30, 330, 700, 330);
    s += text(350, 354, 'Along a rung is substitution.', { cls: 'fg-lbl', size: 12 });
    s += text(350, 376, 'Up a rung is a two-electron oxidation, and needs an oxidant.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The ladder with its second dimension drawn in. A rung is not one compound but a whole set of them &mdash; everything whose carbon carries the same number of bonds to oxygen, nitrogen or halogen &mdash; and moving <b>sideways</b> along a rung costs no oxidant at all.',
  note: 'This is why an alcohol and an alkyl halide interconvert with nothing more than a nucleophile, and why an ester, an amide and a nitrile interconvert with each other but never with an aldehyde. The oxidation-state column is the one-carbon case, so formic acid reads +2 here because that carbon still carries an H; put an alkyl group there instead and a carboxylic acid is +3. The rung is the durable fact, not the number.',
});

/* ------------------------------------------------------------------ C2 ---
   The section's central claim is that one variable - water - decides between
   an aldehyde and a carboxylic acid, and the reason is a structure that never
   appears in the product. Prose has to describe the hydrate; drawing it makes
   "it is an alcohol again" something the reader can check rather than accept. */
FIGURES.push({
  id: 'chromium-water',
  section: 'alcohol-oxidation',
  anchor: '<h3>The reagents worth knowing</h3>',
  alt: 'Anhydrous oxidation of a primary alcohol stopping at the aldehyde, against aqueous oxidation running through the hydrate on to the carboxylic acid',
  viewBox: '0 0 760 362',
  build() {
    let s = '';
    // ---- Anhydrous ----
    s += tag(118, 50, 'ANHYDROUS \u2014 PCC, Swern, DMP');
    s += panel(30, 62, 670, 96);
    s += label(76, 116, 'R\u2013CH\u2082OH', { size: 13 });
    s += arrow(P(126, 112), P(200, 112));
    s += text(163, 98, '[O]', { cls: 'fg-sm', size: 10 });
    s += text(163, 132, 'no water', { cls: 'fg-sm', size: 9.5 });
    s += label(238, 116, 'R\u2013CHO', { size: 13 });
    s += arrow(P(280, 112), P(324, 112), { muted: true });
    s += text(340, 116, 'no water, so no hydrate \u2014 nothing left to grip', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(596, 140, 'stops at the aldehyde', { cls: 'fg-tag-good', size: 11 });

    // ---- Aqueous ----
    s += tag(122, 176, 'AQUEOUS \u2014 Jones, CrO\u2083/H\u2082SO\u2084');
    s += panel(30, 188, 670, 118);
    s += label(76, 240, 'R\u2013CH\u2082OH', { size: 13 });
    s += arrow(P(126, 236), P(192, 236));
    s += text(159, 222, '[O]', { cls: 'fg-sm', size: 10 });
    s += label(226, 240, 'R\u2013CHO', { size: 13 });
    s += arrow(P(264, 236), P(320, 236));
    s += text(292, 222, '+ H\u2082O', { cls: 'fg-sm', size: 9.5 });

    /* The hydrate, drawn out. The point of drawing it rather than naming it
       is that this carbon has an OH and an H on it, which is the definition
       of something a Cr(VI) reagent oxidizes - so the second oxidation needs
       no new explanation at all. */
    const c = P(400, 236);
    const oh1 = P(400, 198), oh2 = P(400, 274), r = P(352, 236), h = P(448, 236);
    s += bond(c, oh1, { rTo: 16 });
    s += bond(c, oh2, { rTo: 16 });
    s += bond(c, r, { rTo: 14 });
    s += bond(c, h, { rTo: 13, cls: 'fg-bond-hi' });
    s += atom(oh1.x, oh1.y, 'OH', { r: 16, size: 10.5 });
    s += atom(oh2.x, oh2.y, 'OH', { r: 16, size: 10.5 });
    s += atom(r.x, r.y, 'R', { r: 14 });
    s += atom(h.x, h.y, 'H', { kind: 'warn', r: 13, size: 11 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(400, 300, 'the hydrate: an OH and an H on one carbon \u2014 an alcohol again', { cls: 'fg-tag-good', size: 10.5 });

    s += arrow(P(474, 236), P(534, 236));
    s += text(504, 222, '[O] again', { cls: 'fg-sm', size: 9.5 });
    s += label(578, 240, 'R\u2013CO\u2082H', { size: 13 });
    // Under the product rather than beside it: beside it, the name of the
    // thing this whole panel is about sat past the right-hand edge.
    s += text(578, 264, 'carboxylic acid', { cls: 'fg-tag-good', size: 11 });

    s += text(356, 330, 'Same oxidant, same substrate, same carbinol C\u2013H.', { cls: 'fg-lbl', size: 12 });
    s += text(356, 352, 'The water is the entire difference.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Why a chromium oxidation stops in one flask and not in the other. Both runs make the aldehyde first; only in water does that aldehyde turn back into something carrying an OH and a hydrogen on the same carbon &mdash; which is exactly what the oxidant attacked the first time.',
  note: 'The hydrate is never isolated and never appears in the answer, which is why this step is so easy to miss, and it is the reason the rule is about water rather than about strength. Using less Jones reagent or a shorter reaction time does not reliably stop the oxidation at the aldehyde, because the hydrate forms as fast as the aldehyde does. The Swern and DMP reach the same aldehyde by a route with no water anywhere in it.',
});

/* ------------------------------------------------------------------ C3 ---
   Why the same hydride stops once with a ketone and runs twice with an ester.
   The prose states it correctly and in order, but the fork is a fact about
   what is attached to the tetrahedral carbon, and that is a picture, not a
   sentence. */
FIGURES.push({
  id: 'hydride-once-twice',
  section: 'carbonyl-reduction',
  anchor: '<h3>Reduction to a methylene</h3>',
  alt: 'A ketone stopping after one hydride because its tetrahedral intermediate has no leaving group, against an ester expelling alkoxide and taking a second hydride',
  viewBox: '0 0 760 378',
  build() {
    let s = '';
    /* A tetrahedral center drawn as a cross. The substituent positions are
       what the figure is about, so they get equal weight rather than being
       squeezed into a condensed formula. */
    const tet = (cx, cy, right, rightKind) => {
      const c = P(cx, cy), o = P(cx, cy - 42), l = P(cx - 46, cy), rr = P(cx + 46, cy), h = P(cx, cy + 42);
      let g = '';
      g += bond(c, o, { rTo: 16 });
      g += bond(c, l, { rTo: 14 });
      g += bond(c, rr, { rTo: 16 });
      g += bond(c, h, { rTo: 13, cls: 'fg-bond-hi' });
      g += atom(o.x, o.y, 'O\u207B', { kind: 'warn', r: 16, size: 11 });
      g += atom(l.x, l.y, 'R', { r: 14 });
      g += atom(rr.x, rr.y, right, { kind: rightKind, r: 16, size: right.length > 1 ? 10.5 : 12 });
      g += atom(h.x, h.y, 'H', { kind: 'hi', r: 13, size: 11 });
      g += atom(c.x, c.y, 'C');
      return g;
    };

    // ---- Ketone: one hydride ----
    s += tag(128, 48, 'KETONE \u2014 one hydride');
    s += label(66, 130, 'R\u2082C=O', { size: 13 });
    s += arrow(P(104, 126), P(228, 126));
    s += text(166, 112, 'H\u207B', { cls: 'fg-lbl', size: 12 });
    s += tet(300, 126, 'R', 'plain');
    s += text(300, 186, 'R\u207B is not a leaving group \u2014 nothing can be expelled', { cls: 'fg-sm', size: 10 });
    s += arrow(P(382, 126), P(444, 126));
    s += text(413, 112, 'H\u2083O\u207A', { cls: 'fg-sm', size: 10 });
    s += label(492, 130, 'R\u2082CH\u2013OH', { size: 13 });
    s += text(628, 130, '2\u00B0 alcohol \u2014 it stops', { cls: 'fg-tag-good', size: 11 });

    s += rule(30, 212, 730, 212);

    // ---- Ester: two hydrides ----
    s += tag(136, 244, 'ESTER \u2014 two hydrides');
    s += label(66, 292, 'RCO\u2082R\u2032', { size: 13 });
    s += arrow(P(110, 288), P(228, 288));
    s += text(169, 274, 'first H\u207B', { cls: 'fg-lbl', size: 11 });
    s += tet(300, 288, 'OR\u2032', 'warn');
    s += text(300, 348, 'R\u2032O\u207B is a leaving group \u2014 the C=O comes back', { cls: 'fg-sm', size: 10 });
    s += arrow(P(382, 288), P(444, 288));
    s += text(413, 274, 'R\u2032O\u207B leaves', { cls: 'fg-sm', size: 10 });
    s += label(482, 292, 'R\u2013CHO', { size: 13 });
    s += text(482, 314, 'more electrophilic than the ester was', { cls: 'fg-tag-warn', size: 10 });
    s += arrow(P(524, 288), P(586, 288));
    s += text(555, 274, 'second H\u207B', { cls: 'fg-sm', size: 10 });
    s += label(646, 292, 'R\u2013CH\u2082OH', { size: 13 });
    return s;
  },
  caption: 'One hydride or two, settled by the question that settles every carbonyl reaction: does the tetrahedral intermediate have anything it can throw out? A ketone&rsquo;s does not, so it stops. An ester&rsquo;s has an alkoxide &mdash; and what it collapses to is an aldehyde.',
  note: 'The reason you cannot stop an ester at that aldehyde is in the bottom row: the aldehyde is a better electrophile than the ester it came from, so it is consumed faster than it accumulates. Stopping there means crippling the reagent rather than rationing it, which is what DIBAL-H at low temperature is for. The same reading runs down the table above &mdash; an acid chloride and an ester both give tetrahedral intermediates with an alkoxide or chloride to expel, which is why LiAlH<sub>4</sub> takes them past the aldehyde every time. An amide is the one that does not fit, and it is worth keeping separate: R<sub>2</sub>N&minus; is far too strong a base to leave, so the intermediate expels its <i>oxygen</i> instead and the product is an amine.',
});
































/* ---------------------------------------------------------------------- */










/* The nomenclature and functional-group figures live in scripts/ochem-figures/. */











/* ================================================================ F1 ---
   Foundations, second pass. The reviewer's count: the Lewis-structures
   section draws no organic molecule at all, the functional-groups section
   runs 2,500 words on one figure, and the three places a first reader most
   often draws something impossible (five-bond carbon, neutral four-bond
   nitrogen, a nitro group with no charges) are text only. These eight put a
   picture where the prose asks the reader to picture something.

   Everything here is condensed or Lewis notation on purpose: skeletal
   drawing is taught at the start of the next chapter, so a Foundations
   figure that used it would be showing a reader a notation they have not
   met. Lone pairs are drawn everywhere, because "the group is where the
   lone pairs are" is the argument these sections are making. */















/* ------------------------------------------------------------------ R1 ---
   The redox-neutral case, which the section asserts in a sentence and which
   is the single thing students get wrong. It is pure arithmetic on a drawing:
   run two tallies, and only when they disagree has anything been oxidized. */
FIGURES.push({
  id: 'redox-neutral',
  section: 'oxidation-states',
  anchor: 'a fast way to check you have not mislabeled something.</p>',
  alt: 'Three columns comparing an oxidation, a reduction and a redox-neutral addition by counting bonds to hydrogen against bonds to oxygen or halogen',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const cols = [
      {
        cx: 145, head: 'OXIDATION', sm: 'CH₃CH₂OH', rg: '[O]', pr: 'CH₃CHO',
        counts: ['start — on that C: 2 H, 1 O', 'product — on that C: 1 H, 2 O'],
        lines: ['H count down 1, O count up 1:', 'the two tallies disagree.', 'OXIDATION (+2 states)'],
        kind: 'fg-tag-good',
      },
      {
        cx: 385, head: 'REDUCTION', sm: 'CH₃CHO', rg: '[H]', pr: 'CH₃CH₂OH',
        counts: ['start — on that C: 1 H, 2 O', 'product — on that C: 2 H, 1 O'],
        lines: ['H count up 1, O count down 1:', 'they disagree the other way.', 'REDUCTION (−2 states)'],
        kind: 'fg-tag-good',
      },
      {
        cx: 620, head: 'NEITHER', sm: 'CH₂=CH₂', rg: 'HBr', pr: 'CH₃CH₂Br',
        counts: ['that C: 2 H, no O or X', 'that C: 2 H, 1 Br', 'the other C: gained 1 H'],
        lines: ['One carbon gained Br (up 1).', 'The other gained H (down 1).', 'They cancel — REDOX-NEUTRAL.'],
        kind: 'fg-tag-warn',
      },
    ];
    for (const c of cols) {
      s += tag(c.cx, 40, c.head);
      s += label(c.cx - 74, 80, c.sm, { size: 12.5 });
      s += arrow(P(c.cx - 34, 76), P(c.cx + 34, 76));
      s += text(c.cx, 64, c.rg, { cls: 'fg-sm', size: 10 });
      s += label(c.cx + 74, 80, c.pr, { size: 12.5 });
      c.counts.forEach((t, i) => { s += text(c.cx, 108 + i * 16, t, { cls: 'fg-sm', size: 10 }); });
      c.lines.forEach((t, i) => { s += text(c.cx, 170 + i * 20, t, { cls: i === 2 ? c.kind : 'fg-lbl', size: i === 2 ? 11 : 11 }); });
    }
    s += rule(260, 58, 260, 240);
    s += rule(505, 58, 505, 240);
    s += rule(30, 250, 730, 250);
    s += text(380, 272, 'Do the two counts separately, then compare.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 292, 'An addition that brings one H and one heteroatom lands in the third column.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The three answers, with the arithmetic shown rather than asserted. Count bonds to hydrogen and bonds to O/N/halogen as two separate tallies; only when they disagree is there a redox change at all.',
  note: 'The third column is the one that catches people, because HBr addition <i>looks</i> like something happened — and it did, just not a redox something. But do not turn that into “additions are neutral”: run the two counts and the alkene reactions you already know sort into three groups. <b>Redox-neutral</b> — hydration, hydrohalogenation, oxymercuration and hydroboration–oxidation, because each carbon gains one of the pair and the two tallies move together. <b>Oxidations</b> — halogenation, halohydrin formation, epoxidation and dihydroxylation, because <i>both</i> carbons gain a bond to an electronegative atom and neither gains a hydrogen. <b>A reduction</b> — hydrogenation, where both carbons gain an H. Halohydrin formation is the one students put in the wrong column: the OH lands on one carbon and the Br on the other, so both carbons gain a heteroatom and neither gains a hydrogen — the tallies move apart, and that is an oxidation.',
});

/* ------------------------------------------------------------------ R2 ---
   Where "the carbinol C-H" goes. The section names the chromate ester and
   never draws it, so the 1/2/3 alcohol rule reads as a rule rather than as
   the consequence of an elimination that needs a hydrogen to take. */
FIGURES.push({
  id: 'chromate-ester',
  section: 'alcohol-oxidation',
  anchor: 'the gem-diol formed by water adding across the C=O.</p>',
  alt: 'A chromium oxidation in three panels: the alcohol oxygen attacking chromic acid to form a chromate ester, an E2-like collapse in which a base removes the carbinol hydrogen while chromium leaves, and the aldehyde product with chromium reduced from six to three',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    // ---- Panel 1: the chromate ester forms ----
    s += tag(132, 34, 'STEP 1 — the chromate ester forms');
    s += panel(14, 44, 236, 226);
    {
      const C = P(96, 158), O = P(152, 158), H = P(196, 186), Cr = P(190, 96);
      s += bond(C, O, { rFrom: 22, rTo: 15 });
      s += bond(O, H, { rFrom: 15, rTo: 12 });
      s += atom(C.x, C.y, 'RCH₂', { r: 22, size: 9.5 });
      s += atom(O.x, O.y, 'O', { kind: 'hi' });
      s += atom(H.x, H.y, 'H', { r: 12 });
      s += lonePair(O.x, O.y, 200);
      s += lonePair(O.x, O.y, 285);
      s += atom(Cr.x, Cr.y, 'H₂CrO₄', { kind: 'warn', r: 22, size: 9 });
      s += text(132, 66, 'chromic acid — CrO₃ in water', { cls: 'fg-sm' });
      s += curve(P(160, 138), P(180, 118), { bow: 10 });
      s += text(132, 216, 'the alcohol oxygen attacks chromium', { cls: 'fg-sm', size: 10 });
      s += text(132, 232, 'and water leaves from the metal', { cls: 'fg-sm', size: 10 });
      s += text(132, 254, 'gives R–CH₂–O–CrO₂–OH', { cls: 'fg-tag', size: 10.5 });
    }
    // ---- Panel 2: the E2-like collapse ----
    s += tag(380, 34, 'STEP 2 — an E2-like collapse');
    s += panel(258, 44, 244, 226);
    {
      const C = P(348, 152), H = P(348, 104), O = P(404, 152), Cr = P(452, 116), R = P(304, 192);
      s += bond(C, H, { rFrom: 15, rTo: 13, cls: 'fg-bond-hi' });
      s += bond(C, O, { rFrom: 15, rTo: 14 });
      s += bond(O, Cr, { rFrom: 14, rTo: 22 });
      s += bond(C, R, { rFrom: 15, rTo: 13 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(H.x, H.y, 'H', { kind: 'warn', r: 13 });
      s += atom(O.x, O.y, 'O', { r: 14 });
      s += atom(Cr.x, Cr.y, 'CrO₂OH', { kind: 'warn', r: 22, size: 9 });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += atom(292, 104, 'B:', { r: 14, size: 10.5 });
      s += curve(P(306, 100), P(332, 100), { bow: -10 });
      s += curve(P(348, 128), P(376, 148), { bow: 12 });
      s += curve(P(428, 134), P(452, 94), { bow: 16 });
      s += text(380, 222, 'the base takes the hydrogen on the C', { cls: 'fg-sm', size: 10 });
      s += text(380, 238, 'while chromium leaves from the O —', { cls: 'fg-sm', size: 10 });
      s += text(380, 254, 'two bonds break at once, as in an E2', { cls: 'fg-sm', size: 10 });
    }
    // ---- Panel 3: the product ----
    s += tag(624, 34, 'THE PRODUCT');
    s += panel(510, 44, 236, 226);
    {
      const C = P(600, 152), O = P(600, 104), H = P(560, 190), R = P(644, 190);
      s += bond(C, O, { order: 2, gap: 5, rFrom: 15, rTo: 14 });
      s += bond(C, H, { rFrom: 15, rTo: 12 });
      s += bond(C, R, { rFrom: 15, rTo: 13 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(O.x, O.y, 'O', { r: 14 });
      s += atom(H.x, H.y, 'H', { r: 12 });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += text(624, 224, 'an aldehyde — R–CHO', { cls: 'fg-tag-good', size: 11 });
      s += text(624, 244, 'Cr(VI) → Cr(III)', { cls: 'fg-lbl', size: 12 });
      s += text(624, 260, 'orange → green', { cls: 'fg-sm', size: 10 });
    }
    s += rule(30, 286, 730, 286);
    s += text(380, 304, 'The reaction needs a hydrogen ON the carbinol carbon, because step 2 takes it.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 322, 'That is the whole 1°/2°/3° rule.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Where &ldquo;the carbinol C&ndash;H&rdquo; actually goes. The alcohol first hangs itself on chromium, and then the collapse is an elimination: a base removes the hydrogen on the carbon while chromium leaves from the oxygen, and the electrons between them become the second C&ndash;O bond.',
  note: 'The chromium electrophile is drawn as H₂CrO₄ because that is what CrO₃ becomes the moment it meets the aqueous acid of a Jones oxidation, and it is the OH on chromium that leaves as water when the ester forms; CrO₃ itself has no OH to lose. PCC and PDC reach the same chromate ester in dry solvent by a different first step, and everything after that is identical. Reading step 2 as an E2 explains two things at once. A tertiary alcohol forms the chromate ester perfectly well — it just has no hydrogen for the base to take, so the ester sits there and nothing happens; the reaction fails at the <i>second</i> step, not the first. (E2-<i>like</i> is the claim: a C–H and a C–O break in the same step. Unlike a real E2 there is no anti-periplanar requirement to satisfy, so do not go looking for one.) And the chromium is reduced by two here, Cr(VI) to Cr(IV) and on to Cr(III) through further steps, which is the other half of the trade: the carbon went up two, so something had to come down.',
});

/* ------------------------------------------------------------------ R3 ---
   The section's whole content on one named molecule, drawn skeletally: one
   substrate, two destinations, and the reagents sorted by which they reach. */
FIGURES.push({
  id: 'one-alcohol-two-destinations',
  section: 'alcohol-oxidation',
  anchor: 'it tells them apart by position (allylic/benzylic) rather than by class.</p>',
  alt: 'Skeletal 2-methylbutan-1-ol with two arrows: anhydrous oxidants give 2-methylbutanal, aqueous oxidants give 2-methylbutanoic acid',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    /* The skeleton is the same four carbons three times, so it is drawn once
       and shifted: only the group on C1 changes. */
    const chain = (x, y, head) => {
      let g = '';
      const c1 = P(x + 36, y - 20), c2 = P(x + 72, y + 2), me = P(x + 72, y + 44),
            c3 = P(x + 108, y - 20), c4 = P(x + 144, y + 2);
      g += bond(c1, c2, { rFrom: 0, rTo: 0 });
      if (head === 'OH') {
        g += bond(c2, me, { rFrom: 0, rTo: 0 });
        g += bond(c2, c3, { rFrom: 0, rTo: 0 });
        g += bond(c3, c4, { rFrom: 0, rTo: 0 });
      } else {
        /* The drawn head carbon is C1 here, so the branch sits on the next
           vertex and the chain is one vertex shorter: still five carbons. */
        g += bond(c1, P(x + 36, y - 52), { rFrom: 0, rTo: 0 });
        g += bond(c2, c3, { rFrom: 0, rTo: 0 });
      }
      if (head === 'OH') {
        g += bond(P(x, y + 2), c1, { rFrom: 18, rTo: 0 });
        g += atom(x, y + 2, 'HO', { r: 18, size: 10.5 });
      } else if (head === 'CHO') {
        g += bond(P(x, y + 2), c1, { rFrom: 14, rTo: 0 });
        g += bond(P(x, y + 2), P(x - 4, y - 40), { order: 2, gap: 4, rFrom: 14, rTo: 14 });
        g += atom(x, y + 2, 'C', { r: 14 });
        g += atom(x - 4, y - 40, 'O', { r: 14 });
        g += atom(x - 34, y + 24, 'H', { r: 12 });
        g += bond(P(x, y + 2), P(x - 34, y + 24), { rFrom: 14, rTo: 12 });
      } else {
        g += bond(P(x, y + 2), c1, { rFrom: 14, rTo: 0 });
        g += bond(P(x, y + 2), P(x - 4, y - 40), { order: 2, gap: 4, rFrom: 14, rTo: 14 });
        g += atom(x, y + 2, 'C', { r: 14 });
        g += atom(x - 4, y - 40, 'O', { r: 14 });
        g += bond(P(x, y + 2), P(x - 40, y + 26), { rFrom: 14, rTo: 18 });
        g += atom(x - 40, y + 26, 'OH', { r: 18, size: 10.5 });
      }
      return g;
    };

    s += tag(150, 40, 'START');
    s += panel(14, 52, 244, 220);
    s += chain(70, 150, 'OH');
    s += text(136, 246, '2-methylbutan-1-ol', { cls: 'fg-lbl', size: 12 });

    s += arrow(P(266, 130), P(400, 104));
    s += text(336, 92, '[O], no water', { cls: 'fg-sm', size: 10 });
    s += arrow(P(266, 196), P(400, 232));
    s += text(336, 258, '[O], in water', { cls: 'fg-sm', size: 10 });

    s += tag(590, 40, 'PCC, PDC, Swern or DMP');
    s += panel(410, 52, 336, 96);
    s += chain(482, 108, 'CHO');
    s += text(676, 130, '2-methylbutanal', { cls: 'fg-tag-good', size: 11 });

    s += tag(590, 176, 'Jones, CrO₃/H₂SO₄ or hot KMnO₄');
    s += panel(410, 188, 336, 96);
    s += chain(486, 244, 'CO2H');
    s += text(676, 266, '2-methylbutanoic acid', { cls: 'fg-tag-good', size: 11 });

    s += rule(30, 300, 730, 300);
    s += text(380, 324, 'One substrate, two destinations. The reagent list only ever answers: does it stop at the first?', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The section on one molecule. Every reagent in the list lands on one of these two products, and which one it lands on is decided by whether there is water in the flask &mdash; not by how strong it is.',
  note: 'Draw the substrate once and ask the two questions in order. The carbinol carbon here carries two hydrogens, so two rungs are available: that sets the ceiling. Then read the reagent for water, which says whether the reaction climbs one rung or both. A secondary alcohol would put a single product in both boxes, and a tertiary one would put nothing in either.',
});

/* ------------------------------------------------------------------ R4 ---
   The chapter's central mechanism, with the arrows it was missing. The
   species were already drawn in fig:hydride-once-twice; what was absent is
   which electrons move, which is the part a student has to reproduce. */
FIGURES.push({
  id: 'hydride-arrows',
  section: 'carbonyl-reduction',
  anchor: 'The whole subject is which reagent delivers that hydride, and to what.</p>',
  alt: 'Hydride addition to a ketone drawn with curved arrows: hydride attacking the carbonyl carbon while the pi electrons move onto oxygen, the tetrahedral alkoxide, and protonation on workup to the alcohol',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    // ---- Panel 1 ----
    s += tag(132, 34, 'STEP 1 — hydride attacks the carbon');
    s += panel(14, 44, 236, 212);
    {
      const C = P(132, 146), O = P(132, 98), R1 = P(88, 184), R2 = P(176, 184), H = P(66, 122);
      s += bond(C, O, { order: 2, gap: 5, rFrom: 15, rTo: 14 });
      s += bond(C, R1, { rFrom: 15, rTo: 13 });
      s += bond(C, R2, { rFrom: 15, rTo: 13 });
      s += atom(O.x, O.y, 'O', { r: 14 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(R1.x, R1.y, 'R', { r: 13 });
      s += atom(R2.x, R2.y, 'R', { r: 13 });
      s += lonePair(O.x, O.y, 200);
      s += lonePair(O.x, O.y, 340);
      s += atom(H.x, H.y, 'H⁻', { kind: 'hi', r: 15, size: 11 });
      s += lonePair(H.x, H.y, 180, { dist: 20 });
      s += curve(P(82, 130), P(114, 142), { bow: 10 });
      s += curve(P(140, 122), P(146, 82), { bow: 14 });
      s += text(132, 200, 'the π electrons go up onto oxygen,', { cls: 'fg-sm', size: 10 });
      s += text(132, 214, 'carbon cannot hold five bonds', { cls: 'fg-sm', size: 10 });
      s += text(132, 232, 'H⁻ source: Na⁺[BH₄]⁻ or Li⁺[AlH₄]⁻', { cls: 'fg-sm', size: 9.5 });
      s += text(132, 246, 'really the B–H bond attacks, not H⁻', { cls: 'fg-sm' });
    }
    // ---- Panel 2 ----
    s += tag(380, 34, 'the tetrahedral alkoxide');
    s += panel(258, 44, 244, 212);
    {
      const C = P(374, 150), O = P(374, 100), R1 = P(322, 182), R2 = P(426, 182), H = P(374, 200);
      s += bond(C, O, { rFrom: 15, rTo: 16 });
      s += bond(C, R1, { rFrom: 15, rTo: 13 });
      s += bond(C, R2, { rFrom: 15, rTo: 13 });
      s += bond(C, H, { rFrom: 15, rTo: 13, cls: 'fg-bond-hi' });
      s += atom(O.x, O.y, 'O⁻', { kind: 'hi', r: 16, size: 11 });
      s += atom(C.x, C.y, 'C', { r: 15 });
      s += atom(R1.x, R1.y, 'R', { r: 13 });
      s += atom(R2.x, R2.y, 'R', { r: 13 });
      s += atom(H.x, H.y, 'H', { kind: 'warn', r: 13 });
      s += lonePair(O.x, O.y, 180);
      s += lonePair(O.x, O.y, 0);
      s += lonePair(O.x, O.y, 270);
      s += text(380, 226, 'flat → tetrahedral. Nothing here is', { cls: 'fg-sm', size: 10 });
      s += text(380, 242, 'a leaving group, so it stops.', { cls: 'fg-sm', size: 10 });
    }
    // ---- Panel 3 ----
    s += tag(624, 34, 'STEP 2 — workup protonates it');
    s += panel(510, 44, 236, 212);
    {
      const O = P(578, 118), C = P(530, 146), Hp = P(650, 138);
      s += bond(C, O, { rFrom: 20, rTo: 16 });
      s += atom(C.x, C.y, 'R₂CH', { r: 20, size: 9.5 });
      s += atom(O.x, O.y, 'O⁻', { kind: 'hi', r: 16, size: 11 });
      s += lonePair(O.x, O.y, 40);
      s += atom(Hp.x, Hp.y, 'H–OH₂⁺', { kind: 'warn', r: 26, size: 9 });
      s += curve(P(594, 128), P(626, 134), { bow: -10 });
      s += text(624, 190, 'R₂CH–OH', { cls: 'fg-lbl', size: 13 });
      s += text(624, 210, 'a 2° alcohol, after acid is added', { cls: 'fg-tag-good', size: 10.5 });
      s += text(624, 234, 'no proton source, no alcohol', { cls: 'fg-sm', size: 10 });
    }
    s += rule(30, 274, 730, 274);
    s += text(380, 298, 'Identical to the Grignard mechanism you have already drawn — H⁻ in place of R⁻.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 322, 'Two moves in step 1: the hydride comes in, the π pair goes up.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The mechanism, with the arrows. The hydride is a nucleophile and the carbonyl carbon is the electrophile, so the attack happens there and the &pi; pair has nowhere to go but onto oxygen.',
  note: 'Three things to carry from the drawing. <b>The hydride attacks carbon, not oxygen</b> — it is a nucleophile, and the electrophile is the δ+ carbon. <b>The alkoxide is the product until workup</b>, which is why &ldquo;NaBH₄&rdquo; in an exam answer is incomplete without &ldquo;then H₃O⁺&rdquo;. And <b>the free H⁻ in panel 1 is a simplification</b>, drawn that way so the two arrows stay legible: there is no naked hydride in the flask. In a full mechanism the arrow starts at a <b>B–H (or Al–H) σ bond</b> of the [BH₄]⁻ or [AlH₄]⁻ ion and ends at the carbonyl carbon — that is the arrow Klein, Wade and Clayden all draw, and it is the one to reproduce on an exam. The mistake to avoid is starting the arrow at the <b>boron or aluminum itself</b>, which has no lone pair to give; the electrons come from the bond.',
});





/* ------------------------------------------------------------------ R8 ---
   Both figures in carbonyl-reduction show hydride addition, so "C=O to CH₂"
   - a different depth of reduction, reached by two reactions that exist only
   because they tolerate opposite conditions - was prose only. */
FIGURES.push({
  id: 'carbonyl-to-methylene',
  section: 'carbonyl-reduction',
  anchor: 'N₂ leaving is irreversible and enormously favorable, and it is what drags the whole sequence forward.</p>',
  alt: 'A ketone reduced all the way to a methylene group, with the two routes side by side: the Clemmensen in zinc amalgam and strong acid, and the Wolff-Kishner through a hydrazone that loses nitrogen gas under hot hydroxide',
  viewBox: '0 0 760 466',
  build() {
    let s = '';
    s += text(380, 24, 'ONE TRANSFORMATION, TWO SETS OF CONDITIONS', { cls: 'fg-tag', size: 11 });

    // ---- The shared start and finish ----
    {
      const C = P(310, 92), O = P(310, 56);
      s += bond(C, O, { order: 2, gap: 5, rFrom: 15, rTo: 14 });
      s += bond(C, P(274, 120), { rFrom: 15, rTo: 13 });
      s += bond(C, P(346, 120), { rFrom: 15, rTo: 13 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(O.x, O.y, 'O', { r: 14 });
      s += atom(274, 120, 'R', { r: 13 });
      s += atom(346, 120, 'R', { r: 13 });
      s += arrow(P(376, 92), P(440, 92));
      s += text(408, 80, '4 e⁻, 4 H⁺', { cls: 'fg-sm' });
    }
    {
      const C = P(480, 92);
      s += bond(C, P(452, 60), { rFrom: 15, rTo: 12, cls: 'fg-bond-hi' });
      s += bond(C, P(508, 60), { rFrom: 15, rTo: 12, cls: 'fg-bond-hi' });
      s += bond(C, P(444, 120), { rFrom: 15, rTo: 13 });
      s += bond(C, P(516, 120), { rFrom: 15, rTo: 13 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(452, 60, 'H', { kind: 'warn', r: 12 });
      s += atom(508, 60, 'H', { kind: 'warn', r: 12 });
      s += atom(444, 120, 'R', { r: 13 });
      s += atom(516, 120, 'R', { r: 13 });
      s += text(470, 150, 'the oxygen is gone entirely — two rungs, not one', { cls: 'fg-tag-good' });
    }
    s += rule(30, 160, 730, 160);

    // ---- The acidic route ----
    s += panel(14, 176, 360, 240);
    s += tag(194, 198, 'CLEMMENSEN — Zn(Hg), conc. HCl');
    s += text(194, 218, 'strongly ACIDIC', { cls: 'fg-tag-warn', size: 10.5 });
    {
      s += label(104, 258, 'R₂C=O', { size: 13 });
      s += arrow(P(150, 254), P(240, 254));
      s += text(195, 242, 'Zn(Hg), HCl, Δ', { cls: 'fg-sm', size: 9.5 });
      s += label(286, 258, 'R₂CH₂', { size: 13 });
    }
    s += text(194, 292, 'the electrons come off the zinc surface,', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 308, 'in acid, and no free carbanion is ever made', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 336, 'USE IT WHEN', { cls: 'fg-tag', size: 10 });
    s += text(194, 356, 'the rest of the molecule survives strong acid', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 388, 'Neither route touches an ester or an amide:', { cls: 'fg-sm' });
    s += text(194, 404, 'those carbonyls expel a leaving group instead', { cls: 'fg-sm' });

    // ---- The basic route ----
    s += panel(386, 176, 360, 240);
    s += tag(566, 198, 'WOLFF–KISHNER — H₂NNH₂, then hot KOH');
    s += text(566, 218, 'strongly BASIC', { cls: 'fg-tag-warn', size: 10.5 });
    {
      const C = P(470, 262), N1 = P(516, 262), N2 = P(556, 262);
      s += bond(C, N1, { order: 2, gap: 5, rFrom: 15, rTo: 14 });
      s += bond(N1, N2, { rFrom: 14, rTo: 16 });
      s += bond(C, P(436, 234), { rFrom: 15, rTo: 13 });
      s += bond(C, P(436, 290), { rFrom: 15, rTo: 13 });
      s += atom(C.x, C.y, 'C', { r: 15 });
      s += atom(N1.x, N1.y, 'N', { kind: 'hi', r: 14 });
      s += atom(N2.x, N2.y, 'NH₂', { kind: 'hi', r: 16, size: 9.5 });
      s += atom(436, 234, 'R', { r: 13 });
      s += atom(436, 290, 'R', { r: 13 });
      s += lonePair(N1.x, N1.y, 270);
      s += arrow(P(590, 262), P(660, 262));
      s += text(625, 250, 'KOH, Δ', { cls: 'fg-sm', size: 9.5 });
      s += label(700, 266, 'R₂CH₂', { size: 13 });
      s += text(700, 288, '+ N₂ ↑', { cls: 'fg-tag-good', size: 10.5 });
      s += text(536, 298, 'the hydrazone', { cls: 'fg-tag' });
    }
    s += text(566, 322, 'hydrazine condenses on first, exactly as an imine does;', { cls: 'fg-sm' });
    s += text(566, 338, 'hot hydroxide then takes the N–H protons off, and N₂ leaves', { cls: 'fg-sm' });
    s += text(566, 354, 'as a gas, giving the carbanion — it never comes back', { cls: 'fg-sm' });
    s += text(566, 380, 'USE IT WHEN', { cls: 'fg-tag', size: 10 });
    s += text(566, 400, 'the rest of the molecule survives strong base', { cls: 'fg-sm', size: 9.5 });

    s += rule(30, 432, 730, 432);
    s += text(380, 452, 'Whichever conditions your substrate tolerates, one of the two routes is open.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The reduction that goes two rungs instead of one. A hydride reagent takes a ketone to an alcohol and stops; these two take the oxygen off altogether and leave a CH<sub>2</sub> &mdash; and they are learned as a pair because one needs strong acid and the other needs strong base.',
  note: 'The only thing you have to decide in an exam question is which half of the molecule you are protecting: acid-sensitive substrate &rarr; Wolff&ndash;Kishner, base-sensitive substrate &rarr; Clemmensen. The mechanisms are not symmetric even though the outcomes are &mdash; the Clemmensen happens on the zinc surface and is not well described by arrows on paper, while the Wolff&ndash;Kishner is drawable all the way through and is therefore the one asked about: hydrazone, deprotonation, loss of N<sub>2</sub>, carbanion. The N<sub>2</sub> loss is the engine. A gas escaping the flask cannot react backwards, so the equilibrium in front of it is dragged forward however unfavorable it looked.',
});














/* ---------------------------------------------------------------- 106 ---
   Three routes out of an alcohol, named in the prose and drawn nowhere.
   The tosylate in particular was discussed for a paragraph and never
   shown, so a student was asked to believe a charge is spread over three
   oxygens of a group they had not seen. */
FIGURES.push({
  id: 'alcohol-activation',
  section: 'alcohol-reactions',
  anchor: 'the figure below sets all three side by side.</p>',
  alt: 'Three routes that turn an alcohol into a substrate with a good leaving group: protonation to an oxonium, tosylation with the tosylate structure drawn out, and conversion to a halide with thionyl chloride or phosphorus tribromide',
  viewBox: '0 0 760 350',
  build() {
    let s = '';
    s += tag(210, 36, 'THREE WAYS OUT OF AN ALCOHOL');

    // ---- 1. Protonate ----
    s += label(104, 88, 'R\u2014OH', { size: 14 });
    s += arrow(P(158, 84), P(268, 84));
    s += text(213, 68, 'H\u2082SO\u2084 or HBr', { cls: 'fg-sm', size: 10 });
    s += text(213, 104, 'strong acid', { cls: 'fg-sm', size: 9.5 });
    s += label(318, 88, 'R\u2014OH\u2082\u207a', { size: 14 });
    s += text(470, 76, 'what leaves is neutral water,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(470, 92, 'pKaH \u22121.7 instead of 15.7', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    s += text(470, 110, 'cost: everything else meets acid', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    s += rule(34, 130, 726, 130);

    // ---- 2. Tosylate, drawn properly ----
    s += label(104, 196, 'R\u2014OH', { size: 14 });
    s += arrow(P(158, 192), P(250, 192));
    s += text(204, 176, 'TsCl, pyridine', { cls: 'fg-sm', size: 10 });
    s += text(204, 212, 'mild, neutral', { cls: 'fg-sm', size: 9.5 });
    const rr = P(288, 192), oo = P(340, 192), ss = P(396, 192), ar = P(452, 192);
    s += bond(rr, oo); s += bond(oo, ss); s += bond(ss, ar);
    s += bond(ss, P(396, 146), { order: 2 });
    s += bond(ss, P(396, 238), { order: 2 });
    s += atom(rr.x, rr.y, 'R'); s += atom(oo.x, oo.y, 'O'); s += atom(ss.x, ss.y, 'S');
    s += atom(ar.x, ar.y, 'Ar'); s += atom(396, 146, 'O'); s += atom(396, 238, 'O');
    s += text(470, 176, 'once it leaves, the charge is', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(470, 192, 'shared by three oxygens:', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(470, 210, '\u2212\u2153 on each, pKaH \u22122.8', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    s += text(470, 228, 'the C\u2013O bond never breaks here', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    s += rule(34, 262, 726, 262);

    // ---- 3. Straight to the halide ----
    s += label(104, 312, 'R\u2014OH', { size: 14 });
    s += arrow(P(158, 308), P(268, 308));
    s += text(213, 292, 'SOCl\u2082 or PBr\u2083', { cls: 'fg-sm', size: 10 });
    s += text(213, 328, 'one step', { cls: 'fg-sm', size: 9.5 });
    s += label(330, 312, 'R\u2014Cl  or  R\u2014Br', { size: 14 });
    s += text(470, 300, 'a good halide leaving group', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(470, 318, 'with no strong acid anywhere', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The same problem solved three ways. In every one of them the carbon is barely changed &mdash; what changed is the identity of the group that has to walk away.',
  note: 'Read the three rows by what they cost rather than by what they give. All three end with a good leaving group on the same carbon; they differ in what else the molecule has to survive, and in what happens to a stereocenter at that carbon &mdash; retention for the middle row, inversion for the bottom one, and racemization for the top one whenever the cation is good enough to form.',
});























/* ================================================================== ch5 ===
   Alkanes & Conformations, plus one for leaving-groups. Added after a review
   found the chapter asserting in prose the four things it is actually
   examined on: turning a structure into a Newman, drawing a chair, telling
   cis/trans on a ring from up/down, and the radical mechanism itself. */

/* A fishhook: one barb, because it carries one electron. `curve` in the kit
   draws a full two-barbed head, which in a radical mechanism says the wrong
   thing about how many electrons moved. */
function fishhook(a, b, opts = {}) {
  const f = (v) => (Math.round(v * 100) / 100);
  const bow = opts.bow ?? 30;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;
  let ux = b.x - cx, uy = b.y - cy;
  const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const size = opts.size ?? 9;
  const px = -uy, py = ux;
  const side = opts.side ?? 1;
  const bx = b.x - ux * size, by = b.y - uy * size;
  const h = size * 0.6 * side;
  return `<path class="fg-arrow" d="M${f(a.x)} ${f(a.y)} Q${f(cx)} ${f(cy)} ${f(bx)} ${f(by)}"></path>` +
         `<path class="fg-head" d="M${f(b.x)} ${f(b.y)} L${f(bx + px * h)} ${f(by + py * h)} L${f(bx)} ${f(by)} Z"></path>`;
}

/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${x}" cy="${y}" r="3.4"></circle>`;

/* A Newman projection. Angles are degrees clockwise from straight up, which
   is how a student reads a dihedral off the page. */
function newman(cx, cy, r, front, back, opts = {}) {
  const at = (a, R) => P(cx + R * Math.sin(a * Math.PI / 180), cy - R * Math.cos(a * Math.PI / 180));
  let s = '';
  // back spokes first, so the front circle and dot sit on top of them
  for (const [a, lab] of back) {
    const p1 = at(a, r), p2 = at(a, r + 21), p3 = at(a, r + 34);
    s += `<line class="fg-bond-soft" x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}"></line>`;
    s += text(p3.x, p3.y + 3.5, lab, { cls: 'fg-lbl', size: lab.length > 1 ? 9.5 : 11 });
  }
  s += `<circle class="fg-atom" cx="${cx}" cy="${cy}" r="${r}"></circle>`;
  for (const [a, lab] of front) {
    const p2 = at(a, r), p3 = at(a, r + 13);
    s += `<line class="fg-bond" x1="${cx}" y1="${cy}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}"></line>`;
    s += text(p3.x, p3.y + 3.5, lab, { cls: 'fg-lbl', size: lab.length > 1 ? 9.5 : 11 });
  }
  s += `<circle class="fg-lp-mut" cx="${cx}" cy="${cy}" r="4.5"></circle>`;
  return s;
}

/* The chair, taken from the one already drawn in axial-equatorial (the
   twelve-position figure), so a new drawing cannot disagree with the book's
   own reference. Offsets are relative to the ring center; axial is vertical
   and alternates, and each equatorial unit vector is the one that figure
   uses, which is parallel to the ring bond two carbons round and tilted
   OPPOSITE to that carbon's axial. Getting that tilt backwards is the
   classic bad chair, so it is measured here rather than re-derived. */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
const CHAIR_EQ = [
  P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104),
  P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104),
];
function chair(cx, cy, k = 1) {
  return CHAIR_V.map((v) => P(cx + v.x * k, cy + v.y * k));
}
const chairRing = (pts, cls) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls })).join('');
/* Axial: straight up on the even carbons, straight down on the odd ones. */
const axialEnd = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? -L : L));
/* Equatorial: outward, and tilted the other way from that carbon's axial. */
const equatorialEnd = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y + CHAIR_EQ[i].y * L);








/* ---------------------------------------------------------------- ch5.8 ---
   The figure the whole ring-flips section turns on. The hand-drawn version it
   replaces reused the SAME ring outline for "the other chair" and merely moved
   the methyl from the vertical bond to the outward one — which, on an
   unchanged outline, moves the group to the other FACE, the exact mistake the
   prose beside it warns against. A flip is a reflection of the ring, so the
   right-hand chair is drawn by negating every vertex's height (and with it the
   axial and equatorial directions), which is what the ring-flips lesson does. */
const chairFlipped = (cx, cy, k = 1) => CHAIR_V.map((v) => P(cx + v.x * k, cy - v.y * k));
/* In the reflected ring every axial reverses: the even carbons now point down. */
const axialEndF = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? L : -L));
const equatorialEndF = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y - CHAIR_EQ[i].y * L);



/* ================================================================== ch6 ===
   Stereochemistry. The chapter was carrying its three-dimensional claims in
   prose — allenes held perpendicular, a nitrogen turning itself inside out,
   two chair conformers that are each other's mirror image, a plane of
   polarization being rotated — and a claim about shape that you cannot look
   at is a claim a student has to take on trust. Every figure below draws one
   of those, and each one was checked by assigning CIP priorities to the
   coordinates that are actually emitted rather than to the molecule that was
   meant. */

/* (moved to lib/ochem-helpers.mjs) */








/* A stereocenter on a vertical chain, drawn the way this chapter's tartaric
   acid figure draws them: the chain runs up and down in the plane of the
   page, and the other two groups sit on a wedge and a hash at `deg` and
   180-deg. `left` is the group on the wedge. */
function chainCentre(c, deg, wedgeLabel, hashLabel) {
  const w = armEnd(c, deg, 46), h = armEnd(c, 180 - deg, 46);
  let g = wedge(c, w, { rFrom: 15, rTo: 15, width: 10 });
  g += hash(c, h, { rFrom: 15, rTo: 13, width: 13, rungs: 4 });
  g += atom(w.x, w.y, wedgeLabel, { r: 15, size: 10, kind: 'hi' });
  g += atom(h.x, h.y, hashLabel, { r: 13, size: 11 });
  g += atom(c.x, c.y, 'C', { r: 15 });
  return g;
}







/* ================================================================== ch7 ===
   Substitution & elimination. The chapter carried its hardest claims in
   prose: a transition state that is not an intermediate (asserted four times,
   drawn never), two rearrangements called "the commonest source of wrong
   products" with no picture of a group moving, the two arrows of an E1
   deprotonation, and the two three-dimensional arguments the E2 section rests
   on — menthyl's ring flip and the stereospecific pair. Every figure below
   draws one of those. */

/* An energy profile through a list of nodes, each a minimum or a maximum,
   with a horizontal tangent at every node — which is what makes a well look
   like a well rather than a corner. */
function profile(nodes, cls = 'fg-bond-hi') {
  let d = `M${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1], b = nodes[i], h = (b.x - a.x) * 0.5;
    d += ` C${a.x + h} ${a.y} ${b.x - h} ${b.y} ${b.x} ${b.y}`;
  }
  return `<path class="${cls}" d="${d}"></path>`;
}

FIGURES.push({
  id: 'one-hump-two-humps',
  section: 'sn2',
  anchor: '<p class="step-body">In the transition state the carbon is momentarily bonded to five things: three fully, and two partially — a partial bond forming to the nucleophile and a partial bond breaking to the leaving group. It is sp²-hybridized at that instant, with the three spectator groups arranged in a plane and the nucleophile and leaving group on the axis perpendicular to it. This is a transition state, not an intermediate: it sits at an energy maximum and has no lifetime.</p>',
  alt: 'Two reaction-energy diagrams side by side. The SN2 diagram rises to a single maximum and falls to product, with no minimum in between. The SN1 or E1 diagram rises to a tall first maximum, drops into a shallow well labeled carbocation intermediate, then rises over a smaller second maximum to product.',
  viewBox: '0 0 760 404',
  build() {
    let s = '';
    const base = 296, top = 72;
    const frame = (x0, x1, title, cls) => {
      let g = rule(x0, base, x1, base) + rule(x0, base, x0, top);
      g += text((x0 + x1) / 2, 44, title, { cls, size: 11.5 });
      g += text((x0 + x1) / 2, base + 22, 'reaction coordinate →', { cls: 'fg-sm', size: 9 });
      return g;
    };

    // ---- SN2: one maximum ----
    s += frame(46, 342, 'SN2 — ONE STEP', 'fg-tag-warn');
    const aStart = P(56, 232), aTop = P(194, 108), aEnd = P(332, 252);
    s += profile([aStart, aTop, aEnd]);
    s += `<line class="fg-dash" x1="${aTop.x}" y1="${aTop.y}" x2="${aTop.x}" y2="${base}"></line>`;
    s += text(58, 256, 'R–Br + Nu⁻', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(336, 276, 'R–Nu + Br⁻', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(194, 94, '‡', { cls: 'fg-tag-warn', size: 15 });
    s += text(194, 78, 'five groups on one carbon', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 352, 'no minimum anywhere', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(194, 372, 'nothing exists at the top', { cls: 'fg-sm', size: 9.5 });

    // ---- SN1 / E1: two maxima and a well ----
    s += rule(378, 60, 378, 330);
    s += frame(414, 716, 'SN1 / E1 — TWO STEPS', 'fg-tag-good');
    const bStart = P(424, 248), b1 = P(506, 88), well = P(570, 190), b2 = P(636, 152), bEnd = P(706, 258);
    s += profile([bStart, b1, well, b2, bEnd]);
    s += `<line class="fg-dash" x1="${well.x}" y1="${well.y}" x2="${well.x}" y2="${base}"></line>`;
    s += text(420, 272, 'R–Br', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(720, 282, 'R–Nu  or  alkene', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(506, 72, '‡', { cls: 'fg-tag-good', size: 15 });
    s += text(500, 118, 'the taller barrier', { cls: 'fg-sm', size: 9, anchor: 'end' });
    s += text(500, 132, 'sets the rate', { cls: 'fg-sm', size: 9, anchor: 'end' });
    s += text(636, 136, '‡', { cls: 'fg-tag-good', size: 13 });
    s += text(578, 214, 'R⁺ + Br⁻', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += text(565, 352, 'a minimum — so a real species', { cls: 'fg-tag-good', size: 10.5 });
    s += text(565, 372, 'with a lifetime, which can rearrange', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'The distinction this section keeps making, drawn once. A <b>transition state</b> is a maximum: the molecule is passing through it and cannot stop, which is why SN2 has no intermediate, never rearranges, and cannot lose track of which face the nucleophile came in on. An <b>intermediate</b> is a minimum — a dip the molecule can sit in — and everything odd about SN1 and E1 comes from what happens while it sits there.',
  note: 'Read the right-hand diagram for the rate too: with two barriers, the reaction can only go as fast as the taller one lets it, and here that is the first. This is why the SN1 rate law contains the substrate and nothing else — the nucleophile only turns up in the second hump, after the race has already been decided.',
});

/* The skeleton of 3-methylbutan-2-ol's cation, drawn three times. */
FIGURES.push({
  id: 'hydride-shift-drawn',
  section: 'sn1',
  anchor: '<p><b>Product: 2-bromo-2-methylbutane</b>, (CH₃)₂CBr–CH₂CH₃ — not the 2-bromo-3-methylbutane you get by simply swapping OH for Br. The skeleton is rearranged, and a student who never drew the cation has no way to see it coming.</p>',
  alt: 'Three skeletal frames. In the first, a secondary carbocation carries a hydrogen on the neighboring carbon and a curved arrow runs from that carbon-hydrogen bond to the positive carbon. In the second, the hydrogen has moved and the positive charge now sits on the neighboring, more substituted carbon. In the third, bromide has bonded to that carbon, giving 2-bromo-2-methylbutane.',
  viewBox: '0 0 760 352',
  build() {
    let s = '';
    /* c1..c4 zig-zag with the branch carbon c3 at a peak, so its two extra
       groups can be drawn splayed upward without crossing the chain. */
    const skeleton = (ox, oy) => {
      const c1 = P(ox, oy + 22), c2 = P(ox + 40, oy + 44), c3 = P(ox + 80, oy + 22), c4 = P(ox + 120, oy + 44);
      let g = bond(c1, c2, { rFrom: 0, rTo: 0 }) + bond(c2, c3, { rFrom: 0, rTo: 0 }) + bond(c3, c4, { rFrom: 0, rTo: 0 });
      for (const p of [c1, c2, c3, c4]) g += atom(p.x, p.y, '', { kind: 'point' });
      return { g, c1, c2, c3, c4, me: P(ox + 52, oy - 22), up: P(ox + 108, oy - 22) };
    };

    // ---- frame 1: the secondary cation, and the H that is about to move ----
    s += tag(148, 44, '2° CATION — THE H WORTH MOVING');
    const A = skeleton(70, 96);
    s += A.g;
    s += bond(A.c3, A.me, { rFrom: 0, rTo: 15 });
    s += atom(A.me.x, A.me.y, 'CH₃', { r: 17, size: 10 });
    s += bond(A.c3, A.up, { rFrom: 0, rTo: 14, cls: 'fg-bond-hi' });
    s += atom(A.up.x, A.up.y, 'H', { kind: 'hi', r: 14 });
    s += text(A.c2.x - 10, A.c2.y + 26, '+', { cls: 'fg-tag-warn', size: 17 });
    s += text(A.c2.x, A.c2.y + 46, '2°', { cls: 'fg-sm', size: 10 });
    s += curve(P(A.up.x - 14, A.up.y + 10), P(A.c2.x + 12, A.c2.y - 12), { bow: -30 });
    s += text(148, 216, 'the arrow starts on the C–H BOND', { cls: 'fg-sm', size: 9.5 });
    s += text(148, 234, 'the H leaves with both electrons', { cls: 'fg-tag-warn', size: 10 });

    s += arrow(P(258, 140), P(310, 140), { muted: true });

    // ---- frame 2: the tertiary cation ----
    s += tag(400, 44, 'NOW 3° — SO IT HAPPENS');
    const B = skeleton(330, 96);
    s += B.g;
    s += bond(B.c3, B.me, { rFrom: 0, rTo: 15 });
    s += atom(B.me.x, B.me.y, 'CH₃', { r: 17, size: 10 });
    s += text(B.c3.x, B.c3.y - 22, '+', { cls: 'fg-tag-warn', size: 17 });
    s += text(B.c3.x + 4, B.c3.y - 40, '3°', { cls: 'fg-sm', size: 10 });
    s += bond(B.c2, P(B.c2.x - 6, B.c2.y + 32), { rFrom: 0, rTo: 12, cls: 'fg-bond-hi' });
    s += atom(B.c2.x - 6, B.c2.y + 32, 'H', { kind: 'hi', r: 12, size: 11 });
    s += text(400, 216, 'the H landed here, and the charge', { cls: 'fg-sm', size: 9.5 });
    s += text(400, 234, 'went the other way', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(518, 140), P(570, 140), { muted: true });

    // ---- frame 3: bromide captures the rearranged cation ----
    s += tag(650, 44, 'BROMIDE ATTACKS');
    const C = skeleton(590, 96);
    s += C.g;
    s += bond(C.c3, C.me, { rFrom: 0, rTo: 15 });
    s += atom(C.me.x, C.me.y, 'CH₃', { r: 17, size: 10 });
    s += bond(C.c3, C.up, { rFrom: 0, rTo: 15, cls: 'fg-bond-hi' });
    s += atom(C.up.x, C.up.y, 'Br', { kind: 'warn', r: 15 });
    s += bond(C.c2, P(C.c2.x - 6, C.c2.y + 32), { rFrom: 0, rTo: 12 });
    s += atom(C.c2.x - 6, C.c2.y + 32, 'H', { r: 12, size: 11 });
    s += text(650, 216, '2-bromo-2-methylbutane', { cls: 'fg-tag-good', size: 10.5 });
    s += text(650, 234, 'not 2-bromo-3-methylbutane', { cls: 'fg-sm', size: 9.5 });

    s += rule(60, 262, 700, 262);
    s += text(380, 292, 'Check every carbocation against its neighbors: if moving one H — or one CH₃ — with its bonding pair', { cls: 'fg-sm', size: 10 });
    s += text(380, 310, 'would put the charge on a more substituted carbon, assume it moves before the nucleophile ever arrives.', { cls: 'fg-sm', size: 10 });
    s += text(380, 338, 'The carbon skeleton of the product is then NOT the carbon skeleton of the starting material.', { cls: 'fg-tag-warn', size: 10.5 });
    return s;
  },
  caption: 'A 1,2-shift, drawn slowly. What moves is a <b>hydride</b> — a hydrogen and the two electrons that were holding it on — so the arrow is drawn from the C–H bond, and the positive charge ends up on the carbon the hydrogen left. The whole thing takes one step and is fast, which is why it happens before a nucleophile has any chance to attack the secondary cation.',
  note: 'Both carbons flanking the charge carry hydrogens, so what decides the shift is not reach but reward. A hydride from the methyl on the left could migrate — it is bonded straight onto the cation — but it would leave the charge on a primary carbon, so it never does. The hydride on the right leaves a tertiary cation, so it goes. The hydrogens two carbons out are out of range entirely, and moving one of the methyls would give a secondary cation again — no gain, no shift. Ask what each shift would MAKE, and the product falls out.',
});

/* tert-Butyl and its relatives: a central carbon with three methyls and,
   optionally, a fourth group at the given angle. */
function tBu(c, fourth, opts = {}) {
  let g = '';
  for (const deg of [120, 180, 240]) {
    const e = armEnd(c, deg, 46);
    g += bond(c, e, { rFrom: 15, rTo: 17 });
    g += atom(e.x, e.y, 'CH₃', { r: 17, size: 10 });
  }
  if (fourth) {
    const e = armEnd(c, 0, 46);
    g += bond(c, e, { rFrom: 15, rTo: fourth.r ?? 15, cls: fourth.cls });
    g += atom(e.x, e.y, fourth.label, { r: fourth.r ?? 15, size: fourth.size ?? 12, kind: fourth.kind });
  }
  g += atom(c.x, c.y, 'C', { kind: opts.kind });
  if (opts.charge) g += text(c.x + 2, c.y - 22, opts.charge, { cls: 'fg-tag-warn', size: 16 });
  return g;
}

FIGURES.push({
  id: 'solvolysis-three-steps',
  section: 'sn1',
  anchor: '<p>Three steps, one of which matters for the rate. When the solvent is also the nucleophile, as here, the reaction is called <b>solvolysis</b> — which is the normal way SN1 is run, since a weak nucleophile is required anyway.</p>',
  alt: 'Three drawn steps of tert-butyl bromide in water. Step one: an arrow from the carbon-bromine bond onto bromine gives a planar cation and bromide. Step two: an arrow from a water lone pair to the cationic carbon gives a positively charged oxonium ion. Step three: a second water takes the proton, giving tert-butanol and hydronium.',
  viewBox: '0 0 760 560',
  build() {
    let s = '';
    // ---- STEP 1 ----
    s += tag(40, 40, 'STEP 1 — SLOW. THE BOND BREAKS ON ITS OWN.', { anchor: 'start' });
    const c1 = P(160, 120);
    s += tBu(c1, { label: 'Br', kind: 'warn' });
    const br = armEnd(c1, 0, 46);
    for (const a of [30, 330]) s += lonePair(br.x, br.y, a, { dist: 23 });
    s += curve(P(c1.x + 24, c1.y - 4), P(br.x + 4, br.y - 24), { bow: -26 });
    s += arrow(P(300, 120), P(360, 120), { muted: true });
    const c2 = P(470, 120);
    s += tBu(c2, null, { charge: '+' });
    s += text(600, 112, '+   Br⁻', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(470, 190, 'flat, sp², six valence electrons on that carbon', { cls: 'fg-sm', size: 9.5 });
    s += text(160, 190, 'one arrow, and nothing attacks', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 214, 720, 214);

    // ---- STEP 2 ----
    s += tag(40, 250, 'STEP 2 — FAST. WATER ATTACKS EITHER FACE.', { anchor: 'start' });
    const c3 = P(170, 330);
    s += tBu(c3, null, { charge: '+' });
    const w = P(280, 386);
    s += atom(w.x, w.y, 'H₂O', { r: 19, size: 10 });
    for (const a of [220, 300]) s += lonePair(w.x, w.y, a, { dist: 26 });
    s += curve(P(w.x - 14, w.y - 14), P(c3.x + 22, c3.y + 12), { bow: 20 });
    s += arrow(P(330, 330), P(390, 330), { muted: true });
    const c4 = P(500, 330);
    s += tBu(c4, { label: 'OH₂', r: 19, size: 10 });
    const ox = armEnd(c4, 0, 46);
    s += text(ox.x + 24, ox.y - 12, '+', { cls: 'fg-tag-warn', size: 16 });
    s += text(556, 392, 'an OXONIUM ion: three bonds on O, so it is positive', { cls: 'fg-tag-warn', size: 10.5, anchor: 'middle' });
    s += text(556, 410, 'writing the neutral alcohol here is the usual slip', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 432, 720, 432);

    // ---- STEP 3 ----
    s += tag(40, 466, 'STEP 3 — FAST. A SECOND WATER TAKES THE PROTON.', { anchor: 'start' });
    s += text(120, 522, '(CH₃)₃C–OH₂⁺', { cls: 'fg-lbl', size: 13 });
    s += text(224, 522, '+  H₂O', { cls: 'fg-sm', size: 11, anchor: 'start' });
    s += arrow(P(320, 518), P(380, 518), { muted: true });
    s += text(470, 522, '(CH₃)₃C–OH', { cls: 'fg-tag-good', size: 13 });
    s += text(566, 522, '+  H₃O⁺', { cls: 'fg-sm', size: 11, anchor: 'start' });
    s += text(160, 546, 'tert-butanol, at last', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    return s;
  },
  caption: 'Three steps, drawn with their arrows and their charges. Only the first one is slow, and only the first one appears in the rate law — but leaving out the other two is how a mechanism answer loses marks, because the species you would otherwise hand in as the product, the <b>oxonium</b> ion, is still carrying a positive charge.',
  note: 'Count electrons at each stage and the charges are forced, not remembered. Bromine leaves with both electrons of the bond, so it is Br⁻ and the carbon is C⁺. Oxygen spends a lone pair making a bond, so oxygen becomes positive. A base takes that proton back off, and everything is neutral again.',
});

FIGURES.push({
  id: 'e1-both-arrows',
  section: 'e1',
  anchor: '<p>And running alongside both, ethanol can attack the cation directly, giving the SN1 ether. All three products come out of the same flask.</p>',
  alt: 'Two drawn steps of E1 on 2-bromo-2-methylbutane. Step one shows one curved arrow from the carbon-bromine bond onto bromine, giving a tertiary carbocation. Step two shows two curved arrows: one from an ethanol lone pair to a beta hydrogen, and one from that carbon-hydrogen bond into the bond between the beta carbon and the cationic carbon, giving 2-methyl-2-butene.',
  viewBox: '0 0 760 500',
  build() {
    let s = '';
    /* The substrate skeleton: Ca carries two methyls (drawn up-left and
       down-left) and the ethyl chain runs right through Cb to a terminal CH3. */
    const frame = (ox, oy) => {
      const ca = P(ox, oy), cb = P(ox + 46, oy + 26), ct = P(ox + 92, oy);
      let g = bond(ca, cb, { rFrom: 15, rTo: 0 }) + bond(cb, ct, { rFrom: 0, rTo: 17 });
      g += atom(cb.x, cb.y, '', { kind: 'point' });
      g += atom(ct.x, ct.y, 'CH₃', { r: 17, size: 10 });
      for (const deg of [120, 210]) {
        const e = armEnd(ca, deg, 44);
        g += bond(ca, e, { rFrom: 15, rTo: 17 });
        g += atom(e.x, e.y, 'CH₃', { r: 17, size: 10 });
      }
      return { g, ca, cb, ct };
    };

    // ---- STEP 1 ----
    s += tag(40, 42, 'STEP 1 — SLOW. IONIZATION, EXACTLY AS IN SN1.', { anchor: 'start' });
    const A = frame(190, 130);
    s += A.g;
    const brEnd = armEnd(A.ca, 40, 48);
    s += bond(A.ca, brEnd, { rFrom: 15, rTo: 15 });
    s += atom(brEnd.x, brEnd.y, 'Br', { kind: 'warn' });
    for (const a of [30, 330]) s += lonePair(brEnd.x, brEnd.y, a, { dist: 23 });
    s += atom(A.ca.x, A.ca.y, 'C');
    s += curve(P(A.ca.x + 16, A.ca.y - 12), P(brEnd.x - 11, brEnd.y + 11), { bow: -24 });
    s += arrow(P(330, 132), P(392, 132), { muted: true });
    const B = frame(500, 130);
    s += B.g;
    s += atom(B.ca.x, B.ca.y, 'C');
    s += text(B.ca.x + 6, B.ca.y - 22, '+', { cls: 'fg-tag-warn', size: 17 });
    s += text(626, 118, '+  Br⁻', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(540, 206, '3° carbocation', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 234, 720, 234);

    // ---- STEP 2 ----
    s += tag(40, 268, 'STEP 2 — FAST. TWO ARROWS, AND NEITHER IS OPTIONAL.', { anchor: 'start' });
    const C = frame(150, 340);
    s += C.g;
    s += atom(C.ca.x, C.ca.y, 'C');
    s += text(C.ca.x + 6, C.ca.y - 22, '+', { cls: 'fg-tag-warn', size: 17 });
    const hb = P(C.cb.x + 4, C.cb.y + 48);
    s += bond(C.cb, hb, { rFrom: 0, rTo: 13, cls: 'fg-bond-hi' });
    s += atom(hb.x, hb.y, 'H', { kind: 'hi', r: 13 });
    s += text(C.cb.x - 18, C.cb.y + 20, 'β', { cls: 'fg-tag', size: 11 });
    const base = P(hb.x + 92, hb.y);
    s += atom(base.x, base.y, 'EtOH', { r: 21, size: 9.5 });
    s += lonePair(base.x, base.y, 180, { dist: 27 });
    s += curve(P(base.x - 32, base.y - 2), P(hb.x + 17, hb.y - 2), { bow: 14 });
    const mid = P((C.ca.x + C.cb.x) / 2, (C.ca.y + C.cb.y) / 2);
    s += curve(P(hb.x - 12, hb.y - 26), P(mid.x + 3, mid.y + 8), { bow: -26 });
    s += text(150, 462, 'arrow 1: the base takes the β-H', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(150, 480, 'arrow 2: that C–H bond becomes the π bond', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += arrow(P(392, 366), P(454, 366), { muted: true });
    const da = P(548, 340), db = P(594, 366), dt = P(640, 340);
    s += bond(da, db, { rFrom: 15, rTo: 0, order: 2, gap: 4.4 });
    s += bond(db, dt, { rFrom: 0, rTo: 17 });
    s += atom(db.x, db.y, '', { kind: 'point' });
    s += atom(dt.x, dt.y, 'CH₃', { r: 17, size: 10 });
    for (const deg of [120, 210]) {
      const e = armEnd(da, deg, 44);
      s += bond(da, e, { rFrom: 15, rTo: 17 });
      s += atom(e.x, e.y, 'CH₃', { r: 17, size: 10 });
    }
    s += atom(da.x, da.y, 'C');
    s += text(596, 462, '2-methyl-2-butene — trisubstituted', { cls: 'fg-tag-good', size: 10.5 });
    return s;
  },
  caption: 'The step that makes it an elimination rather than a substitution, drawn with both of its arrows. The base never touches the positive carbon: it takes a hydrogen from the carbon <i>next door</i>, and the pair of electrons left behind slides into the gap between the two carbons to become the π bond. Nothing here requires any particular geometry, because the leaving group left in step 1 and is no longer part of the argument.',
  note: 'The base is ethanol — the solvent. It does not have to be strong, because the target is a hydrogen next to a full positive charge, which is far more acidic than an ordinary C–H. That is the whole reason E1 needs no added base, and the reason it turns up uninvited whenever you try to run an SN1.',
});

FIGURES.push({
  id: 'e1-shift-then-eliminate',
  section: 'e1',
  anchor: '<p><b>The point.</b> The alkene you get has its double bond in a position you cannot reach by eliminating from the original C–Br carbon at all. When a cation can rearrange, do the rearrangement <i>first</i> and apply Zaitsev to the rearranged cation — applying Zaitsev to the original skeleton gives the wrong answer with complete confidence.</p>',
  alt: 'Three frames. A secondary carbocation next to a quaternary carbon, with a curved arrow taking a methyl group with its bonding pair across to the positive carbon; the resulting tertiary carbocation; and the tetrasubstituted alkene 2,3-dimethylbut-2-ene that follows from removing a beta hydrogen.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    const skel = (ox, oy) => {
      const q = P(ox, oy), c = P(ox + 50, oy + 28);
      let g = bond(q, c, { rFrom: 15, rTo: 15 });
      return { q, c, g };
    };
    const methyls = (c, degs, cls) => degs.map((d) => {
      const e = armEnd(c, d, 44);
      return bond(c, e, { rFrom: 15, rTo: 17, cls }) + atom(e.x, e.y, 'CH₃', { r: 17, size: 10 });
    }).join('');

    // frame 1 — the 2° cation and the methyl that migrates
    s += tag(140, 40, '2° CATION, AND NO HYDROGEN NEXT DOOR');
    const A = skel(110, 100);
    s += A.g + methyls(A.q, [90, 180]);
    const mig = armEnd(A.q, 270, 46);
    s += bond(A.q, mig, { rFrom: 15, rTo: 17, cls: 'fg-bond-hi' });
    s += atom(mig.x, mig.y, 'CH₃', { r: 17, size: 10, kind: 'hi' });
    s += methyls(A.c, [0]);
    s += atom(A.q.x, A.q.y, 'C');
    s += atom(A.c.x, A.c.y, 'C');
    s += text(A.c.x - 4, A.c.y + 30, '+', { cls: 'fg-tag-warn', size: 17 });
    s += text(140, 216, 'the neighbor is quaternary: no H to shift,', { cls: 'fg-sm', size: 9.5 });
    s += text(140, 232, 'so a whole METHYL moves instead', { cls: 'fg-tag-warn', size: 10.5 });
    s += curve(P(mig.x + 16, mig.y - 6), P(A.c.x - 12, A.c.y + 12), { bow: -22 });

    s += arrow(P(272, 140), P(324, 140), { muted: true });

    // frame 2 — the 3° cation
    s += tag(430, 40, 'NOW 3°');
    const B = skel(400, 100);
    s += B.g + methyls(B.q, [90, 180]);
    s += methyls(B.c, [30, 300]);
    s += atom(B.q.x, B.q.y, 'C');
    s += atom(B.c.x, B.c.y, 'C');
    s += text(B.q.x - 2, B.q.y - 24, '+', { cls: 'fg-tag-warn', size: 17 });
    const hB = armEnd(B.c, 240, 38);
    s += bond(B.c, hB, { rFrom: 15, rTo: 12, cls: 'fg-bond-hi' });
    s += atom(hB.x, hB.y, 'H', { r: 12, size: 11, kind: 'hi' });
    s += text(430, 216, 'the charge moved the other way;', { cls: 'fg-sm', size: 9.5 });
    s += text(430, 232, 'this β-H gives the best alkene', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(540, 140), P(592, 140), { muted: true });

    // frame 3 — the product alkene
    s += tag(672, 40, 'ELIMINATE');
    const d1 = P(628, 118), d2 = P(678, 146);
    s += bond(d1, d2, { rFrom: 15, rTo: 15, order: 2, gap: 4.4 });
    s += methyls(d1, [90, 180]);
    s += methyls(d2, [10, 300]);
    s += atom(d1.x, d1.y, 'C');
    s += atom(d2.x, d2.y, 'C');
    s += text(672, 216, '2,3-dimethylbut-2-ene', { cls: 'fg-tag-good', size: 10.5 });
    s += text(672, 232, 'tetrasubstituted', { cls: 'fg-sm', size: 9.5 });

    s += rule(60, 258, 700, 258);
    s += text(380, 286, 'Rearrange first, then apply Zaitsev to the cation you actually have.', { cls: 'fg-sm', size: 10 });
    s += text(380, 308, 'The double bond in the product is not even on the carbon that held the bromine.', { cls: 'fg-tag-warn', size: 10.5 });
    return s;
  },
  caption: 'A <b>methyl shift</b>, which is the same move as a hydride shift with a bigger passenger: the group leaves with its bonding pair, so the positive charge ends up where the group came from. It happens for the same reason — the cation it produces is tertiary rather than secondary — and it happens faster than the weak base can reach a hydrogen.',
  note: 'Now count what would have happened without the shift. Eliminating straight from the original secondary cation gives a monosubstituted alkene on the original skeleton; after the shift the best available alkene is tetrasubstituted and sits between two different carbons. Same starting material, different answer — which is why "check for a rearrangement" comes before "apply Zaitsev".',
});

FIGURES.push({
  id: 'menthyl-two-chairs',
  section: 'e2',
  anchor: '<p>In menthyl chloride the favored chair has everything equatorial, including chlorine. To eliminate at all the ring must flip into a strained triaxial chair, which is why it is slow; and in that chair only one neighboring carbon carries an axial hydrogen, the one giving the less substituted alkene. Geometry overrides the usual product preference completely.</p>',
  alt: 'Three cyclohexane chairs. In neomenthyl chloride the favored chair has chlorine axial and an axial hydrogen on each neighboring carbon. In menthyl chloride the favored chair has chlorine, the isopropyl group and the methyl all equatorial, so no elimination is possible. Its ring-flipped chair puts all three axial, and only one neighboring carbon still has an axial hydrogen.',
  viewBox: '0 0 760 372',
  build() {
    let s = '';
    /* Ring indices, chosen so that every bond this figure has to draw lands
       in open space: C1 is the right-hand vertex, C2 the bottom tip (which
       carries the isopropyl), C5 the top tip (the methyl) and C6 the middle
       carbon whose only job is one axial hydrogen. */
    const C1 = 0, C2 = 5, C5 = 2, C6 = 1;
    const K = 0.62, CY = 150;
    const dot = (pts) => pts.map((p) => atom(p.x, p.y, '', { kind: 'point' })).join('');
    const put = (a, b, lab, o = {}) =>
      bond(a, b, { rFrom: 0, rTo: o.r ?? 15, cls: o.cls }) +
      atom(b.x, b.y, lab, { r: o.r ?? 15, size: o.size ?? 11, kind: o.kind });

    // ---- 1. neomenthyl: Cl axial, an axial H on each neighbor ----
    const A = chair(128, CY, K);
    s += chairRing(A) + dot(A);
    s += put(A[C1], axialEnd(A, C1, 34), 'Cl', { r: 14, kind: 'warn', cls: 'fg-bond-hi' });
    s += put(A[C2], axialEnd(A, C2, 30), 'H', { r: 11, size: 10, kind: 'hi', cls: 'fg-bond-hi' });
    const aH6 = axialEnd(A, C6, 20);
    s += bond(A[C6], aH6, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += text(aH6.x - 11, aH6.y + 4, 'H', { cls: 'fg-tag-good', size: 11 });
    s += put(A[C2], equatorialEnd(A, C2, 32), 'iPr', { r: 15, size: 10 });
    s += put(A[C5], equatorialEnd(A, C5, 28), 'CH₃', { r: 15, size: 9.5 });
    s += tag(128, 44, 'NEOMENTHYL — Cl ALREADY AXIAL');
    s += text(128, 252, 'axial H on BOTH neighbors', { cls: 'fg-tag-good', size: 10.5 });
    s += text(128, 270, 'fast, and free to pick the', { cls: 'fg-sm', size: 9.5 });
    s += text(128, 286, 'more substituted alkene', { cls: 'fg-sm', size: 9.5 });

    s += rule(256, 60, 256, 300);

    // ---- 2. menthyl, favored chair: everything equatorial ----
    const B = chair(384, CY, K);
    s += chairRing(B) + dot(B);
    s += put(B[C1], equatorialEnd(B, C1, 32), 'Cl', { r: 14, kind: 'warn' });
    s += put(B[C2], equatorialEnd(B, C2, 32), 'iPr', { r: 15, size: 10 });
    s += put(B[C5], equatorialEnd(B, C5, 28), 'CH₃', { r: 15, size: 9.5 });
    s += tag(384, 44, 'MENTHYL — ALL THREE EQUATORIAL');
    s += text(384, 252, 'Cl is equatorial, so NOTHING', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(384, 270, 'is anti-periplanar to it.', { cls: 'fg-sm', size: 9.5 });
    s += text(384, 286, 'This chair cannot react at all.', { cls: 'fg-sm', size: 9.5 });

    s += rule(512, 60, 512, 300);

    // ---- 3. menthyl, flipped: triaxial ----
    const C = chairFlipped(640, CY, K);
    s += chairRing(C) + dot(C);
    s += put(C[C1], axialEndF(C, C1, 34), 'Cl', { r: 14, kind: 'warn', cls: 'fg-bond-hi' });
    s += put(C[C2], axialEndF(C, C2, 30), 'iPr', { r: 15, size: 10 });
    s += put(C[C5], axialEndF(C, C5, 30), 'CH₃', { r: 15, size: 9.5 });
    const cH6 = axialEndF(C, C6, 20);
    s += bond(C[C6], cH6, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += text(cH6.x - 11, cH6.y + 2, 'H', { cls: 'fg-tag-good', size: 11 });
    s += tag(640, 44, 'MENTHYL, FLIPPED — AND STRAINED');
    s += text(640, 252, 'now Cl is axial — but C2\u2019s axial', { cls: 'fg-sm', size: 9.5 });
    s += text(640, 270, 'slot is taken by the iPr,', { cls: 'fg-sm', size: 9.5 });
    s += text(640, 286, 'so there is only ONE axial H', { cls: 'fg-tag-warn', size: 10.5 });

    s += rule(60, 316, 700, 316);
    s += text(380, 342, 'Two diastereomers, a 200-fold rate difference — and the slower one gives the LESS substituted alkene,', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 362, 'because the only hydrogen it can reach is the one Zaitsev would not have chosen.', { cls: 'fg-tag-warn', size: 10.5 });
    return s;
  },
  caption: 'The two chairs the worked example asks you to build, built. Everything in this comparison follows from one rule — the hydrogen and the chlorine must both be <b>axial</b> — applied to rings that differ only in which face the chlorine sits on. Neomenthyl already satisfies it; menthyl has to pay for a ring flip first, which is where its two-hundred-fold slower rate comes from.',
  note: 'The second half is the part worth remembering. In the flipped menthyl chair, the isopropyl group is occupying the axial position on one of the two neighboring carbons, so that carbon has no axial hydrogen left to give up. The only axial hydrogen available is on the plain CH₂ on the other side — and eliminating there gives the less substituted alkene. Geometry outranks Zaitsev, every time.',
});

FIGURES.push({
  id: 'stereospecific-pair',
  section: 'e2',
  anchor: 'the reverse is not true.</p></div>',
  alt: 'Two Newman projections of 1-bromo-1,2-diphenylpropane, each with the bromine on the front carbon anti to the hydrogen on the back carbon. In the first the back phenyl sits upper left and the methyl upper right, and the alkene produced has the two phenyl groups on opposite sides, the E isomer. In the second the back phenyl and methyl are swapped and the alkene produced has both phenyls on the same side, the Z isomer.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    const alkene = (cx, cy, leftUp, rightUp, leftDown, rightDown) => {
      const a = P(cx - 34, cy), b = P(cx + 34, cy);
      let g = bond(a, b, { rFrom: 15, rTo: 15, order: 2, gap: 4.6 });
      const put = (c, deg, lab) => {
        const e = armEnd(c, deg, 42);
        const r = lab.length > 2 ? 17 : lab.length > 1 ? 16 : 13;
        return bond(c, e, { rFrom: 15, rTo: r }) + atom(e.x, e.y, lab, { r, size: lab.length > 2 ? 10 : 11.5 });
      };
      g += put(a, 130, leftUp) + put(a, 230, leftDown);
      g += put(b, 50, rightUp) + put(b, 310, rightDown);
      g += atom(a.x, a.y, 'C') + atom(b.x, b.y, 'C');
      return g;
    };

    const panel = (ox, title, backUpLeft, backUpRight, alk, verdict, vcls) => {
      let g = tag(ox + 190, 40, title);
      g += newman(ox + 80, 150, 44,
        [[0, 'Br'], [120, 'Ph'], [240, 'H']],
        [[180, 'H'], [60, backUpRight], [300, backUpLeft]]);
      g += text(ox + 80, 252, 'Br anti to the β-H', { cls: 'fg-sm', size: 9.5 });
      g += text(ox + 80, 268, 'nothing else reacts', { cls: 'fg-sm', size: 9.5 });
      g += arrow(P(ox + 136, 150), P(ox + 176, 150), { muted: true });
      g += alk;
      g += text(ox + 256, 252, verdict, { cls: vcls, size: 11 });
      return g;
    };

    // Diastereomer 1: back phenyl upper-LEFT, methyl upper-RIGHT.
    // The front phenyl (lower right) ends up cis to whatever is upper right,
    // so the two phenyls finish on opposite sides: E.
    s += panel(16, '(1S,2R) AND ITS MIRROR IMAGE', 'Ph', 'CH₃',
      alkene(272, 150, 'Ph', 'CH₃', 'H', 'Ph'),
      '(E)-1,2-diphenylprop-1-ene', 'fg-tag-good');
    s += text(272, 268, 'the two Ph end up trans', { cls: 'fg-sm', size: 9.5 });

    s += rule(392, 60, 392, 300);

    // Diastereomer 2: the two back groups swapped.
    s += panel(404, '(1S,2S) AND ITS MIRROR IMAGE', 'CH₃', 'Ph',
      alkene(660, 150, 'Ph', 'Ph', 'H', 'CH₃'),
      '(Z)-1,2-diphenylprop-1-ene', 'fg-tag-good');
    s += text(660, 268, 'the two Ph end up cis', { cls: 'fg-sm', size: 9.5 });

    s += rule(60, 318, 700, 318);
    s += text(380, 344, 'Same reagent, same mechanism, same rate — two different alkenes, decided by which diastereomer went in.', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 370, 'Only ONE conformation of each can react, so only one geometry is reachable from each.', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(380, 392, 'That is what stereospecific means, and the best evidence that E2 is one concerted step.', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Why the geometric requirement has a visible consequence. Rotate each diastereomer until the bromine and the β-hydrogen are anti — that is the only conformation that can eliminate — then flatten the picture: the two groups that sat on the <i>right</i> of the Newman, front and back, finish on the same side of the new double bond, and so do the two on the left. Different starting diastereomer, different arrangement across that bond.',
  note: 'This is the experiment that rules out a stepwise alternative. If the C–H broke first, or the C–Br broke first, the intermediate could rotate and both diastereomers would give the same mixture. They do not, so nothing rotates between the two events — the three arrows really are simultaneous.',
});


/* ================================================================== ch8 ===
   The alkene/alkyne chapter had 1.25 figures per section and four separate
   places where the only statement of a geometric fact was a sentence. These
   nine draw the ones a student cannot check without a picture: which way the
   p orbitals point, which groups E/Z is actually ranking, where a proton
   goes and where the charge lands, and what "syn" does to a ring. */

/* (moved to lib/ochem-helpers.mjs) */



























/* ------------------------------------------------------------- 10.1 ---
   Alcohol dehydration, with its arrows. The section's centerpiece was
   described in words only: "ionizes to a carbocation and then loses a beta
   hydrogen" is the whole of E1 and none of the drawing. */
FIGURES.push({
  id: 'alcohol-e1-arrows',
  section: 'alcohol-reactions',
  anchor: '<p class="step-body">Reactivity follows 3° &gt; 2° &gt; 1°, matching carbocation stability. Primary alcohols are reluctant and, when forced, proceed by a concerted E2-like pathway rather than through a primary cation.</p>',
  alt: 'Two drawn steps of the acid-catalyzed dehydration of butan-2-ol. In the first, one curved arrow runs from the carbon-oxygen bond of the protonated alcohol onto oxygen, releasing water and leaving a secondary carbocation. In the second, two curved arrows show a water molecule taking a beta hydrogen from C3 while that carbon-hydrogen bond becomes the pi bond of but-2-ene.',
  viewBox: '0 0 760 462',
  build() {
    let s = '';
    /* The butan-2-ol skeleton as a zigzag: C1 and C4 are labeled methyls,
       C2 carries the oxygen and C3 is a plain vertex. */
    const chain = (ox, oy) => {
      const c1 = P(ox, oy + 30), c2 = P(ox + 58, oy), c3 = P(ox + 116, oy + 30), c4 = P(ox + 174, oy);
      let g = bond(c1, c2, { rFrom: 17, rTo: 15 }) + bond(c2, c3, { rFrom: 15, rTo: 0 }) + bond(c3, c4, { rFrom: 0, rTo: 17 });
      g += atom(c3.x, c3.y, '', { kind: 'point' });
      g += atom(c1.x, c1.y, 'CH₃', { r: 17, size: 10 });
      g += atom(c4.x, c4.y, 'CH₃', { r: 17, size: 10 });
      return { g, c1, c2, c3, c4 };
    };

    // ---- STEP 1: water leaves ----
    s += tag(36, 40, 'STEP 1 — THE ACID HAS ALREADY PROTONATED THE OH. NOW WATER GOES.', { anchor: 'start' });
    const A = chain(70, 120);
    s += A.g;
    const o = P(A.c2.x, A.c2.y - 58);
    s += bond(A.c2, o, { rFrom: 15, rTo: 17 });
    s += atom(o.x, o.y, 'OH₂', { r: 17, size: 10, kind: 'hi' });
    s += text(o.x + 26, o.y - 14, '+', { cls: 'fg-tag-warn', size: 16 });
    s += atom(A.c2.x, A.c2.y, 'C');
    s += curve(P(A.c2.x + 14, A.c2.y - 14), P(o.x + 13, o.y + 14), { bow: -20 });
    s += text(A.c2.x, A.c2.y + 84, 'the leaving group is WATER, not hydroxide', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(320, 122), P(382, 122), { muted: true });
    s += text(351, 106, '– H₂O', { cls: 'fg-sm', size: 9.5 });

    const B = chain(440, 120);
    s += B.g;
    s += atom(B.c2.x, B.c2.y, 'C');
    s += text(B.c2.x + 4, B.c2.y - 24, '+', { cls: 'fg-tag-warn', size: 17 });
    s += text(556, B.c2.y + 84, 'a 2° carbocation — every carbocation rule now applies', { cls: 'fg-sm', size: 9.5 });
    s += rule(36, 240, 724, 240);

    // ---- STEP 2: lose a beta hydrogen ----
    s += tag(36, 274, 'STEP 2 — A WEAK BASE TAKES A β-HYDROGEN. TWO ARROWS.', { anchor: 'start' });
    const C = chain(70, 330);
    s += C.g;
    s += atom(C.c2.x, C.c2.y, 'C');
    s += text(C.c2.x + 4, C.c2.y - 24, '+', { cls: 'fg-tag-warn', size: 17 });
    const hb = P(C.c3.x, C.c3.y + 46);
    s += bond(C.c3, hb, { rFrom: 0, rTo: 13, cls: 'fg-bond-hi' });
    s += atom(hb.x, hb.y, 'H', { kind: 'hi', r: 13 });
    s += text(C.c3.x + 22, C.c3.y + 20, 'β', { cls: 'fg-tag', size: 11 });
    const base = P(hb.x + 88, hb.y + 4);
    s += atom(base.x, base.y, 'H₂O', { r: 21, size: 9.5 });
    s += lonePair(base.x, base.y, 180, { dist: 27 });
    s += curve(P(base.x - 32, base.y - 2), P(hb.x + 16, hb.y + 2), { bow: 14 });
    const mid = P((C.c2.x + C.c3.x) / 2, (C.c2.y + C.c3.y) / 2);
    s += curve(P(hb.x - 12, hb.y - 24), P(mid.x + 4, mid.y + 10), { bow: -24 });
    s += text(190, 440, 'taking the H from C3 gives the more substituted alkene', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(386, 344), P(448, 344), { muted: true });
    const d2 = P(560, 330), d3 = P(618, 360);
    s += bond(P(502, 360), d2, { rFrom: 17, rTo: 0 });
    s += bond(d2, d3, { rFrom: 0, rTo: 0, order: 2, gap: 4.4 });
    s += bond(d3, P(676, 330), { rFrom: 0, rTo: 17 });
    s += atom(502, 360, 'CH₃', { r: 17, size: 10 });
    s += atom(676, 330, 'CH₃', { r: 17, size: 10 });
    s += atom(d2.x, d2.y, '', { kind: 'point' });
    s += atom(d3.x, d3.y, '', { kind: 'point' });
    s += text(590, 440, 'but-2-ene — the Zaitsev product', { cls: 'fg-tag-good', size: 10.5 });
    return s;
  },
  caption: 'The same two-step shape as any E1, with the alcohol supplying the leaving group once acid has protonated it. Step 1 is slow and sets the rate; step 2 is fast and decides the product. Note what the base is — a water molecule, the solvent — because E1 needs nothing stronger: the hydrogen it removes sits next to a full positive charge.',
  note: 'The arrow in step 1 is the one worth rehearsing, because the common error is to draw hydroxide leaving. It cannot: HO⁻ is a strong base. Protonation is what converts that leaving group into water, and the arrow starts on the C–O <b>bond</b> and ends on <b>oxygen</b> — the electronegative atom keeps the pair, which is why the carbon is left positive.',
});

/* ------------------------------------------------------------- 10.2 ---
   The rearrangement trap, drawn. The notes named it and then dropped it,
   which leaves a student unable to reproduce the single most-tested result
   in the section. */
FIGURES.push({
  id: 'hbr-shift-vs-pbr3',
  section: 'alcohol-reactions',
  anchor: '<p><b>The habit to build:</b> whenever an acid route leaves a 1° or 2° cation next to a more substituted carbon, check for a shift <i>before</i> you write the product. If the question hands you PBr₃ or SOCl₂ instead, that check is exactly what it is telling you to skip.</p>\n</div>',
  alt: 'Three frames. A secondary carbocation from 3,3-dimethylbutan-2-ol, with a curved arrow carrying a methyl group and its bonding pair from the neighboring quaternary carbon across to the positive carbon; the resulting tertiary carbocation, with a curved arrow from bromide; and the product 2-bromo-2,3-dimethylbutane, with the bromine on the carbon that never held the hydroxyl.',
  viewBox: '0 0 700 336',
  build() {
    let s = '';
    const pair = (ox, oy) => {
      const q = P(ox, oy), c = P(ox + 52, oy + 30);
      return { q, c, g: bond(q, c, { rFrom: 15, rTo: 15 }) };
    };
    const arms = (c, degs, cls) => degs.map((d) => {
      const e = armEnd(c, d, 44);
      return bond(c, e, { rFrom: 15, rTo: 17, cls }) + atom(e.x, e.y, 'CH₃', { r: 17, size: 10 });
    }).join('');
    const hArm = (c, deg) => {
      const e = armEnd(c, deg, 40);
      return bond(c, e, { rFrom: 15, rTo: 12 }) + atom(e.x, e.y, 'H', { r: 12, size: 11 });
    };

    // frame 1 — the 2° cation, with the methyl that moves
    s += tag(20, 40, '2° CATION, QUATERNARY NEIGHBOR', { anchor: 'start' });
    const A = pair(78, 104);
    s += A.g + arms(A.q, [90, 180]);
    const mig = armEnd(A.q, 270, 46);
    s += bond(A.q, mig, { rFrom: 15, rTo: 17, cls: 'fg-bond-hi' });
    s += atom(mig.x, mig.y, 'CH₃', { r: 17, size: 10, kind: 'hi' });
    s += arms(A.c, [0]);
    s += hArm(A.c, 300);
    s += atom(A.q.x, A.q.y, 'C');
    s += atom(A.c.x, A.c.y, 'C');
    s += text(A.c.x + 4, A.c.y - 26, '+', { cls: 'fg-tag-warn', size: 17 });
    s += curve(P(mig.x + 16, mig.y - 8), P(A.c.x - 14, A.c.y + 12), { bow: -22 });
    s += text(120, 226, 'the neighbor has no H to give,', { cls: 'fg-sm', size: 9.5 });
    s += text(120, 242, 'so a METHYL migrates instead', { cls: 'fg-tag-warn', size: 10.5 });

    s += arrow(P(216, 140), P(264, 140), { muted: true });

    // frame 2 — the 3° cation, captured by bromide
    s += tag(360, 40, '3° NOW, AND BROMIDE ARRIVES');
    const B = pair(330, 104);
    s += B.g + arms(B.q, [90, 180]);
    s += arms(B.c, [0, 300]);
    s += hArm(B.c, 240);
    s += atom(B.q.x, B.q.y, 'C');
    s += atom(B.c.x, B.c.y, 'C');
    s += text(B.q.x - 2, B.q.y - 24, '+', { cls: 'fg-tag-warn', size: 17 });
    const br = armEnd(B.q, 250, 64);
    s += atom(br.x, br.y, 'Br', { kind: 'warn' });
    s += text(br.x - 22, br.y + 6, '−', { cls: 'fg-tag-warn', size: 15 });
    s += curve(P(br.x + 6, br.y - 15), P(B.q.x - 6, B.q.y + 16), { bow: -12 });
    s += text(356, 226, 'the charge has moved to the carbon', { cls: 'fg-sm', size: 9.5 });
    s += text(356, 242, 'that never carried the OH', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(466, 140), P(514, 140), { muted: true });

    // frame 3 — the product
    s += tag(604, 40, 'PRODUCT');
    const C = pair(566, 104);
    s += C.g + arms(C.q, [90, 180]);
    s += arms(C.c, [0, 300]);
    s += hArm(C.c, 240);
    const br2 = armEnd(C.q, 270, 46);
    s += bond(C.q, br2, { rFrom: 15, rTo: 16, cls: 'fg-bond-hi' });
    s += atom(br2.x, br2.y, 'Br', { kind: 'hi' });
    s += atom(C.q.x, C.q.y, 'C');
    s += atom(C.c.x, C.c.y, 'C');
    s += text(600, 226, '2-bromo-2,3-dimethylbutane', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(40, 268, 660, 268);
    s += text(350, 294, 'PBr₃ on the same alcohol never makes a cation, so nothing shifts:', { cls: 'fg-lbl', size: 11.5 });
    s += text(350, 316, 'bromide attacks the carbon that held the OH, from the back, and inverts it.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Why the reagent, not the substrate, decides this answer. Under HBr the alcohol becomes a secondary cation, and a methyl group crosses from the quaternary carbon <b>with its bonding pair</b> — which moves the positive charge to where the methyl came from. Bromide then captures a carbon that never carried the hydroxyl.',
  note: 'Check the two products against each other. The HBr route puts bromine on C2 of a rearranged skeleton; PBr₃ puts it on the original carbinol carbon with inversion. Both are "the bromide from that alcohol", and they are different compounds — which is exactly why an exam specifies the reagent rather than saying "convert the alcohol to the bromide".',
});

/* ------------------------------------------------------------- 10.3 ---
   Ether cleavage. The section's second half had no figure at all, and its
   whole content is a fork: which carbon, by which mechanism. */
FIGURES.push({
  id: 'ether-cleavage-two-branches',
  section: 'ether-chemistry',
  anchor: '<p class="step-body">With excess HI the initially formed alcohol is itself converted to a second alkyl halide, so an ether ends up as two alkyl halides. HCl does not work well — chloride is too poor a nucleophile for the SN2 case.</p>',
  alt: 'Two panels, each starting from a protonated ether. On the left, methyl propyl ether: iodide attacks the methyl carbon from the back in an SN2, giving methyl iodide and propan-1-ol. On the right, tert-butyl methyl ether: a curved arrow from the carbon-oxygen bond to oxygen ionizes the tertiary carbon to a carbocation, which iodide then captures, giving tert-butyl iodide and methanol.',
  viewBox: '0 0 700 340',
  build() {
    let s = '';
    // ---------- left: both carbons primary, so SN2 ----------
    s += tag(196, 38, 'NEITHER CARBON CAN HOLD A CHARGE → SN2');
    const oL = P(196, 150);
    const meL = P(112, 150);
    s += bond(meL, oL, { rFrom: 17, rTo: 15 });
    s += atom(meL.x, meL.y, 'CH₃', { r: 17, size: 10 });
    const hL = P(196, 96);
    s += bond(oL, hL, { rFrom: 15, rTo: 12 });
    s += atom(hL.x, hL.y, 'H', { r: 12, size: 11, kind: 'warn' });
    const p1 = P(254, 180), p2 = P(312, 150);
    s += bond(oL, p1, { rFrom: 15, rTo: 0 }) + bond(p1, p2, { rFrom: 0, rTo: 17 });
    s += atom(p1.x, p1.y, '', { kind: 'point' });
    s += atom(p2.x, p2.y, 'CH₃', { r: 17, size: 10 });
    s += atom(oL.x, oL.y, 'O', { kind: 'hi' });
    s += text(oL.x + 26, oL.y - 18, '+', { cls: 'fg-tag-warn', size: 16 });
    const iL = P(64, 232);
    s += atom(iL.x, iL.y, 'I', { kind: 'hi' });
    s += text(iL.x + 20, iL.y - 14, '−', { cls: 'fg-hi', size: 15 });
    s += curve(P(iL.x + 6, iL.y - 16), P(meL.x - 10, meL.y + 14), { bow: -14 });
    s += curve(P(meL.x + 22, meL.y - 12), P(oL.x - 14, oL.y - 12), { bow: -20 });
    s += text(196, 272, 'iodide attacks the carbon it can reach —', { cls: 'fg-sm', size: 9.5 });
    s += text(196, 288, 'the methyl — and the oxygen leaves as an alcohol', { cls: 'fg-sm', size: 9.5 });
    s += text(196, 312, 'CH₃I  +  propan-1-ol', { cls: 'fg-tag-good', size: 11 });

    s += rule(356, 60, 356, 300);

    // ---------- right: one tertiary carbon, so SN1 ----------
    s += tag(528, 38, 'ONE CARBON IS TERTIARY → SN1');
    const oR = P(546, 150);
    const meR = P(622, 150);
    s += bond(oR, meR, { rFrom: 15, rTo: 17 });
    s += atom(meR.x, meR.y, 'CH₃', { r: 17, size: 10 });
    const hR = P(546, 96);
    s += bond(oR, hR, { rFrom: 15, rTo: 12 });
    s += atom(hR.x, hR.y, 'H', { r: 12, size: 11, kind: 'warn' });
    const tC = P(462, 150);
    s += bond(tC, oR, { rFrom: 15, rTo: 15 });
    for (const deg of [120, 180, 240]) {
      const e = armEnd(tC, deg, 44);
      s += bond(tC, e, { rFrom: 15, rTo: 17 }) + atom(e.x, e.y, 'CH₃', { r: 17, size: 10 });
    }
    s += atom(tC.x, tC.y, 'C');
    s += atom(oR.x, oR.y, 'O', { kind: 'hi' });
    s += text(oR.x + 26, oR.y - 18, '+', { cls: 'fg-tag-warn', size: 16 });
    s += curve(P(tC.x + 20, tC.y - 12), P(oR.x - 14, oR.y - 12), { bow: -20 });
    s += text(528, 272, 'the C–O bond breaks on its own: a 3° cation,', { cls: 'fg-sm', size: 9.5 });
    s += text(528, 288, 'plus methanol — and iodide captures the cation', { cls: 'fg-sm', size: 9.5 });
    s += text(528, 312, '(CH₃)₃CI  +  methanol', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'One protonation, two different second steps, and the substrate decides which. On the left nothing can carry a positive charge, so iodide has to do the work itself and does it where the approach is clear — the methyl. On the right the tertiary carbon ionizes without help, and the iodide simply waits for the cation. The <b>most hindered</b> carbon is attacked in the second case precisely because no backside attack is involved.',
  note: 'Both panels start the same way, and that first step is the whole reason ethers can be cleaved at all: protonation converts RO⁻, a strong base that would never leave, into a neutral alcohol that will. Ask which mechanism is running before asking which carbon reacts — answering in the other order is what makes this question feel like two unrelated rules.',
});

/* ------------------------------------------------------------- 10.4 ---
   Anti opening. "Both products are anti" is the section's stereochemical
   punchline, and nothing was drawn for it. */
FIGURES.push({
  id: 'epoxide-anti-opening',
  section: 'epoxides',
  anchor: 'that is the same geometric argument as the anti addition of bromine to an alkene, and for the same reason — a three-membered ring blocks one face completely.</div>',
  alt: 'On the left, an epoxide with the oxygen bridging two carbons from above and a hydroxide ion approaching the right-hand carbon from below, opposite the ring, with curved arrows for the attack and for the carbon-oxygen bond breaking. On the right, the product trans-1,2-cyclohexanediol drawn on a hexagon with one hydroxyl on a wedge and the other on a hash.',
  viewBox: '0 0 700 348',
  build() {
    let s = '';
    // ---------- left: why the two groups end up anti ----------
    s += tag(196, 40, 'ONE FACE IS BLOCKED BY THE RING');
    const ca = P(150, 170), cb = P(242, 170), ox = P(196, 112);
    s += bond(ca, cb, { rFrom: 15, rTo: 15 });
    s += bond(ca, ox, { rFrom: 15, rTo: 15 });
    s += bond(cb, ox, { rFrom: 15, rTo: 15 });
    const ra = armEnd(ca, 150, 44), rb = armEnd(cb, 30, 44);
    s += bond(ca, ra, { rFrom: 15, rTo: 13 }) + atom(ra.x, ra.y, 'R', { r: 13, size: 11 });
    s += bond(cb, rb, { rFrom: 15, rTo: 13 }) + atom(rb.x, rb.y, 'R', { r: 13, size: 11 });
    s += atom(ca.x, ca.y, 'C');
    s += atom(cb.x, cb.y, 'C');
    s += atom(ox.x, ox.y, 'O', { kind: 'hi' });
    s += lonePair(ox.x, ox.y, 270, { dist: 24 });
    const nu = P(316, 254);
    s += atom(nu.x, nu.y, 'HO', { r: 19, size: 10, kind: 'hi' });
    s += text(nu.x + 24, nu.y - 14, '−', { cls: 'fg-hi', size: 15 });
    s += curve(P(nu.x - 12, nu.y - 16), P(cb.x + 14, cb.y + 14), { bow: 16 });
    s += curve(P(cb.x - 2, cb.y - 18), P(ox.x + 16, ox.y + 12), { bow: -16 });
    s += text(196, 296, 'the nucleophile arrives opposite the C–O bond it breaks,', { cls: 'fg-sm', size: 9.5 });
    s += text(196, 312, 'so the new bond and the oxygen end up on opposite faces', { cls: 'fg-tag', size: 10.5 });

    s += rule(360, 62, 360, 306);

    // ---------- right: the cyclohexene oxide case ----------
    s += tag(534, 40, 'CYCLOHEXENE OXIDE + H₂O, ACID OR BASE');
    const cx = 536, cy = 168, r = 60;
    const v = [];
    for (let i = 0; i < 6; i++) {
      const a = ((60 * i - 30) * Math.PI) / 180;
      v.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
    for (let i = 0; i < 6; i++) s += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
    for (const pt of v) s += atom(pt.x, pt.y, '', { kind: 'point' });
    const w = P(v[2].x - 8, v[2].y + 58), h = P(v[1].x + 44, v[1].y + 48);
    s += wedge(v[2], w, { rFrom: 0, rTo: 17, width: 9 });
    s += hash(v[1], h, { rFrom: 0, rTo: 17, width: 9 });
    s += atom(w.x, w.y, 'OH', { r: 17, size: 10 });
    s += atom(h.x, h.y, 'OH', { r: 17, size: 10 });
    s += text(534, 306, 'trans-1,2-cyclohexanediol: one wedge, one hash,', { cls: 'fg-sm', size: 9.5 });
    s += text(534, 324, 'and the cis isomer is not formed at all', { cls: 'fg-tag', size: 10.5 });
    return s;
  },
  caption: 'What "anti" looks like when you draw it. The oxygen bridges one face of the two carbons, so a nucleophile physically cannot arrive on that side: the only approach is from underneath, along the axis of the bond that is breaking. The new group and the oxygen therefore end on opposite faces, and on a ring that is the difference between a <i>trans</i> diol and a <i>cis</i> one.',
  note: 'This is the same geometry as the bromonium ion in <i>Alkenes &amp; Alkynes</i>, and it is worth seeing them as one idea rather than two rules: a three-membered ring on one face is a blocked face, and a blocked face forces anti. Note also that this argument never mentioned acid or base — which is why the stereochemistry is anti under both, even though the regiochemistry flips.',
});


/* ------------------------------------------------------------- 10.5 ---
   The acid/base switch. The figure this replaces drew H and H on the
   right-hand carbon — isobutylene oxide — directly under a worked example
   about 2-methyl-2,3-epoxybutane, so the substrate changed silently between
   two adjacent things on the page. Same figure, same claim, matching
   substrate, and the attacked carbon marked in each panel. */
FIGURES.push({
  id: 'epoxide-acid-base-switch',
  section: 'epoxides',
  anchor: '<h3>Same substrate, opposite regiochemistry</h3>',
  alt: 'Two panels showing 2-methyl-2,3-epoxybutane. Under basic conditions an anionic nucleophile attacks the less substituted carbon, the one bearing a methyl and a hydrogen, from the face opposite the oxygen. Under acidic conditions the oxygen is protonated and a neutral nucleophile attacks the more substituted carbon, the one bearing two methyls, again from the opposite face.',
  viewBox: '0 0 700 344',
  build() {
    let s = '';
    /* One drawing routine, used twice, so the two panels cannot drift apart:
       the more substituted carbon is always on the left with two methyls,
       the less substituted one on the right with a methyl and a hydrogen. */
    const epoxide = (cmx, hit) => {
      const cm = P(cmx, 170), cl = P(cmx + 76, 170), o = P(cmx + 38, 114);
      let g = bond(cm, cl, { rFrom: 15, rTo: 15 }) +
              bond(cm, o, { rFrom: 15, rTo: 15 }) +
              bond(cl, o, { rFrom: 15, rTo: 15 });
      const me = (from, to) => bond(from, to, { rFrom: 15, rTo: 17 }) + atom(to.x, to.y, 'CH₃', { r: 17, size: 10 });
      g += me(cm, P(cmx - 56, 158));
      g += me(cm, P(cmx, 226));
      g += me(cl, P(cmx + 132, 158));
      g += bond(cl, P(cmx + 76, 226), { rFrom: 15, rTo: 12 }) + atom(cmx + 76, 226, 'H', { r: 12, size: 11 });
      g += atom(cm.x, cm.y, 'C', { kind: hit === 'cm' ? 'warn' : 'plain' });
      g += atom(cl.x, cl.y, 'C', { kind: hit === 'cl' ? 'warn' : 'plain' });
      return { g, cm, cl, o };
    };

    // ---------- basic ----------
    s += text(196, 38, 'BASIC — a strong, anionic nucleophile', { cls: 'fg-tag', size: 11.5 });
    const A = epoxide(152, 'cl');
    s += A.g;
    s += atom(A.o.x, A.o.y, 'O', { kind: 'hi' });
    const nuA = P(316, 272);
    s += atom(nuA.x, nuA.y, 'Nu', { r: 16, size: 10.5, kind: 'hi' });
    s += text(nuA.x + 22, nuA.y - 12, '−', { cls: 'fg-hi', size: 15 });
    s += arrow(P(302, 250), P(246, 192));
    s += text(196, 302, 'no activation, so this is a plain SN2 —', { cls: 'fg-sm', size: 9.5 });
    s += text(196, 318, 'attack goes to the LESS hindered carbon', { cls: 'fg-tag', size: 10.5 });

    s += rule(356, 60, 356, 306);

    // ---------- acidic ----------
    s += text(524, 38, 'ACIDIC — a weak one, often the solvent', { cls: 'fg-tag-warn', size: 11.5 });
    const B = epoxide(486, 'cm');
    s += B.g;
    s += atom(B.o.x, B.o.y, 'O', { kind: 'hi' });
    s += bond(B.o, P(B.o.x, 62), { rFrom: 15, rTo: 13 });
    s += atom(B.o.x, 62, 'H', { r: 13, size: 11, kind: 'warn' });
    s += text(B.o.x + 26, 96, '+', { cls: 'fg-tag-warn', size: 15 });
    const nuB = P(398, 272);
    s += atom(nuB.x, nuB.y, 'Nu', { r: 16, size: 10.5, kind: 'hi' });
    s += bond(nuB, P(nuB.x - 34, nuB.y), { rFrom: 16, rTo: 11 });
    s += atom(nuB.x - 34, nuB.y, 'H', { r: 11, size: 10 });
    s += arrow(P(418, 250), P(470, 194));
    s += text(524, 302, 'protonation puts positive charge on the carbon', { cls: 'fg-sm', size: 9.5 });
    s += text(524, 318, 'that holds it best — the MORE substituted one', { cls: 'fg-tag-warn', size: 10.5 });
    return s;
  },
  caption: 'The reason epoxides get a section of their own, on the substrate from the worked example above. Under <b>base</b>, nothing has activated the ring, so a strong nucleophile does what SN2 always does and attacks the carbon it can reach — the less hindered one. Under <b>acid</b>, protonating the oxygen stretches the C–O bond on whichever side can better support a partial positive charge, which is the <i>more</i> substituted carbon, and the nucleophile follows the charge. Same epoxide, opposite product.',
  note: 'One substrate, two conditions, OPPOSITE ends. Nothing else in the course lets you choose the regiochemistry this cleanly, and it is worth understanding rather than memorizing: under base you are doing sterics, and under acid you are doing carbocation stability with the ring still half attached. Note what does <i>not</i> change — the nucleophile arrives from the face the ring does not block in both panels, so both products are anti.',
});












/* ------------------------------------------------------------- 10.5 ---
   SOCl2 and PBr3, drawn. The section's thesis is that the activation
   happens at sulfur or phosphorus and never at carbon — which is exactly
   the kind of claim a diagram settles and prose only asserts. The existing
   figure carries the HBr rearrangement and gives PBr3 one caption line. */
FIGURES.push({
  id: 'socl2-pbr3-mechanisms',
  section: 'alcohol-reactions',
  anchor: 'PBr₃ runs the same play: the oxygen attacks phosphorus to give R–O–PBr₂, and bromide displaces the phosphorus-bearing oxygen from the back.</p>',
  alt: 'Two rows, each in two panels. In the top row the oxygen of butan-2-ol attacks the sulfur of thionyl chloride and a chloride is expelled, giving an alkyl chlorosulfite; then that chloride attacks the carbon from the opposite side while the carbon-oxygen bond breaks, so the leaving group departs as sulfur dioxide and chloride and the configuration is inverted. The bottom row repeats the same two steps with PBr3, through R-O-PBr2, giving the inverted bromide.',
  viewBox: '0 0 760 520',
  build() {
    let s = '';

    /* One stereocenter, drawn twice per row: before attack with the oxygen on
       the right, and after attack with the halide on the left, so the
       umbrella has visibly turned inside out. */
    const center = (c, x, opts = {}) => {
      const flip = !!opts.flip;
      const et = armEnd(c, flip ? 0 : 180, 48);
      const me = armEnd(c, flip ? 290 : 250, 44);
      const h = armEnd(c, flip ? 240 : 300, 42);
      const xp = armEnd(c, flip ? 140 : 40, 54);
      let g = bond(c, et, { rTo: 15 }) + atom(et.x, et.y, 'Et', { r: 15, size: 11 });
      g += wedge(c, me, { rFrom: 15, rTo: 18 }) + atom(me.x, me.y, 'CH₃', { r: 18, size: 10 });
      g += hash(c, h, { rFrom: 15, rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12, size: 11 });
      g += bond(c, xp, { rTo: opts.xr || 15 });
      g += atom(xp.x, xp.y, x, { r: opts.xr || 15, size: opts.xs || 12, kind: opts.xkind || 'plain' });
      g += atom(c.x, c.y, 'C', { kind: 'warn' });
      return { g, xp, et, me, h };
    };

    const row = (Y, cfg) => {
      let g = '';
      // ---- panel 1: the oxygen attacks sulfur (or phosphorus) ----
      g += panel(8, Y, 368, 216) + tag(192, Y + 26, cfg.t1);
      const c1 = P(96, Y + 124);
      const A = center(c1, 'O', { xkind: 'hi' });
      g += A.g;
      g += lonePair(A.xp.x, A.xp.y, 300, { dist: 22 });
      g += text(A.xp.x - 4, A.xp.y - 26, 'H', { cls: 'fg-sm', size: 10 });
      const z = P(A.xp.x + 78, A.xp.y - 8);
      g += atom(z.x, z.y, cfg.centerAtom, { kind: 'warn' });
      const zo = armEnd(z, 44, 46);
      g += bond(z, zo, { order: 2, rTo: 14 }) + atom(zo.x, zo.y, cfg.topGroup, { r: 14, size: 11 });
      const lg = armEnd(z, 304, 52);
      g += bond(z, lg, { rTo: 15, cls: 'fg-bond-hi' }) + atom(lg.x, lg.y, cfg.x, { kind: 'hi' });
      g += curve(P(A.xp.x + 16, A.xp.y - 10), P(z.x - 16, z.y - 2), { bow: -16 });
      g += curve(P(z.x + 14, z.y + 10), P(lg.x - 4, lg.y - 18), { bow: -14 });
      g += text(192, Y + 190, cfg.n1, { cls: 'fg-sm', size: 9.5 });
      g += text(192, Y + 206, cfg.n1b, { cls: 'fg-sm', size: 9.5 });

      // ---- panel 2: the halide comes in from the back ----
      g += panel(392, Y, 360, 216) + tag(572, Y + 26, cfg.t2);
      const c2 = P(576, Y + 128);
      const B = center(c2, 'O', { flip: true, xkind: 'hi' });
      g += B.g;
      const z2 = P(B.xp.x - 26, B.xp.y - 34);
      g += bond(B.xp, z2, { rFrom: 15, rTo: 15 });
      g += atom(z2.x, z2.y, cfg.leaving, { r: 22, size: 9, kind: 'warn' });
      const nuc = P(c2.x + 74, c2.y + 32);
      g += atom(nuc.x, nuc.y, cfg.x, { kind: 'hi' });
      g += text(nuc.x + 20, nuc.y - 12, '−', { cls: 'fg-hi', size: 15 });
      g += curve(P(nuc.x - 18, nuc.y - 8), P(c2.x + 18, c2.y + 6), { bow: 16 });
      g += curve(P(c2.x - 10, c2.y - 18), P(B.xp.x + 12, B.xp.y + 12), { bow: -14 });
      g += text(572, Y + 190, cfg.n2, { cls: 'fg-sm', size: 9.5 });
      g += text(572, Y + 206, cfg.n2b, { cls: 'fg-tag-good', size: 10.5 });
      return g;
    };

    s += row(16, {
      t1: 'SOCl₂ · STEP 1 — THE OXYGEN ATTACKS SULFUR',
      centerAtom: 'S', topGroup: 'O', x: 'Cl', leaving: 'S(=O)Cl',
      n1: 'chloride leaves sulfur, and the oxygen is left',
      n1b: 'carrying –SOCl: an alkyl chlorosulfite',
      t2: 'SOCl₂ · STEP 2 — BACKSIDE ATTACK BY Cl⁻',
      n2: 'it departs as SO₂ and Cl⁻, with no cation anywhere',
      n2b: '2-chlorobutane, configuration INVERTED',
    });
    s += row(276, {
      t1: 'PBr₃ · STEP 1 — THE OXYGEN ATTACKS PHOSPHORUS',
      centerAtom: 'P', topGroup: 'Br', x: 'Br', leaving: 'PBr₂',
      n1: 'bromide leaves phosphorus, and the oxygen is left',
      n1b: 'carrying –PBr₂',
      t2: 'PBr₃ · STEP 2 — BACKSIDE ATTACK BY Br⁻',
      n2: 'again no positive charge on carbon at any stage',
      n2b: '2-bromobutane, configuration INVERTED',
    });

    s += text(380, 508, 'Both reagents act at S or P, never at carbon, so neither one rearranges.', { cls: 'fg-lbl', size: 11 });
    return s;
  },
  caption: 'The two reagents that convert an alcohol into a halide without ever making a carbocation, drawn as the two steps they actually are. The alcohol’s <b>oxygen</b> is the nucleophile in step 1, attacking sulfur or phosphorus; only in step 2 does anything happen at carbon, and when it does it is an ordinary backside SN2.',
  note: 'Compare the leaving groups with the HBr route. There the OH became water and left the carbon on its own, which is what gives a cation time to rearrange. Here it becomes –OSOCl or –OPBr₂ and departs only as the halide arrives from the opposite side, so the carbon is never electron-deficient and the skeleton cannot move. The price is that the configuration <b>must</b> invert — with SOCl₂ that is the pyridine case; run without a base it can collapse internally and retain instead.',
});


/* ------------------------------------------------------------- 10.6 ---
   The crown ether, drawn. "Six oxygens, one cation, a 2.7 Å hole" is an
   inherently spatial claim, and the section made it in prose only. The
   right-hand panel draws the three diameters to scale, because the whole
   selectivity argument is a comparison of sizes. */
FIGURES.push({
  id: 'crown-ether-cavity',
  section: 'ether-chemistry',
  anchor: 'A "naked" anion like that is a dramatically better nucleophile than the same anion in water, where every lone pair is hydrogen-bonded to a solvent molecule.</p>',
  alt: 'Left: 18-crown-6 drawn as an eighteen-membered ring of six oxygens separated by pairs of CH2 groups, with every oxygen lone pair pointing inward at a potassium ion sitting in the middle of the cavity. Right: the three diameters drawn to scale — the cavity at 2.7 angstroms, potassium at 2.66 which fills it, and sodium at 1.9 which leaves a gap — above a line showing potassium fluoride dissolving in benzene as a crowned cation and a naked, unsolvated fluoride.',
  viewBox: '0 0 760 430',
  build() {
    let s = '';

    // ---------------- the macrocycle ----------------
    s += panel(8, 16, 368, 398);
    s += tag(192, 42, '18-CROWN-6, WITH K⁺ IN THE MIDDLE');

    const CX = 192, CY = 224, RO = 92, RC = 108;
    const at = (deg, r) => P(CX + Math.cos((deg * Math.PI) / 180) * r, CY + Math.sin((deg * Math.PI) / 180) * r);
    const os = [];
    for (let i = 0; i < 6; i++) os.push({ deg: -90 + i * 60, p: at(-90 + i * 60, RO) });
    let ring = '';
    for (let i = 0; i < 6; i++) {
      const a = os[i], b = os[(i + 1) % 6];
      const ca = at(a.deg + 20, RC), cb = at(a.deg + 40, RC);
      ring += bond(a.p, ca, { rFrom: 14, rTo: 0 });
      ring += bond(ca, cb, { rFrom: 0, rTo: 0 });
      ring += bond(cb, b.p, { rFrom: 0, rTo: 14 });
      ring += atom(ca.x, ca.y, '', { kind: 'point' });
      ring += atom(cb.x, cb.y, '', { kind: 'point' });
    }
    s += ring;
    for (const o of os) {
      s += lonePair(o.p.x, o.p.y, o.deg + 180, { dist: 22 });
      s += atom(o.p.x, o.p.y, 'O', { r: 14, kind: 'hi' });
    }
    s += atom(CX, CY, 'K', { r: 22, kind: 'warn', size: 13 });
    s += text(CX + 26, CY - 16, '+', { cls: 'fg-warn', size: 15 });
    s += text(192, 356, 'every vertex between two oxygens is a CH₂', { cls: 'fg-sm', size: 9.5 });
    s += text(192, 374, 'six lone pairs, all pointing at the same ion', { cls: 'fg-sm', size: 9.5 });
    s += text(192, 396, 'the ring is a solvent shell you can weigh out', { cls: 'fg-tag', size: 10.5 });

    // ---------------- the sizes, drawn to scale ----------------
    s += panel(392, 16, 360, 220);
    s += tag(572, 42, 'WHY IT PICKS K⁺ AND NOT Na⁺');
    const SCALE = 26;   // pixels per angstrom of DIAMETER
    const circleAt = (x, y, dia, label, kind) => {
      const r = (dia * SCALE) / 2;
      let g = kind === 'cavity'
        ? `<circle class="fg-dash" cx="${x}" cy="${y}" r="${r}" fill="none"></circle>`
        : `<circle class="${kind === 'k' ? 'fg-fill-warn' : 'fg-fill-hi'}" cx="${x}" cy="${y}" r="${r}" opacity="0.5"></circle>`;
      g += text(x, y + 4, label, { cls: 'fg-lbl', size: 11 });
      return g;
    };
    s += circleAt(470, 128, 2.7, '', 'cavity');
    s += text(470, 132, 'cavity', { cls: 'fg-sm', size: 9.5 });
    s += text(470, 186, '≈ 2.7 Å across', { cls: 'fg-sm', size: 9.5 });
    s += circleAt(572, 128, 2.66, 'K⁺', 'k');
    s += text(572, 186, '2.66 Å — fills it', { cls: 'fg-tag-good', size: 10 });
    s += circleAt(672, 128, 1.9, 'Na⁺', 'na');
    s += text(672, 186, '1.9 Å — rattles', { cls: 'fg-tag-warn', size: 10 });
    s += text(572, 212, 'Diameters, drawn to the same scale.', { cls: 'fg-sm', size: 9.5 });

    // ---------------- what it is for ----------------
    s += panel(392, 252, 360, 162);
    s += tag(572, 278, 'AND WHAT THAT BUYS YOU');
    s += text(572, 306, 'KF is insoluble in benzene.', { cls: 'fg-lbl', size: 11.5 });
    s += text(572, 330, 'Crown the K⁺ and the ion pair dissolves —', { cls: 'fg-sm', size: 10 });
    s += text(572, 348, 'and the fluoride comes with it, neither', { cls: 'fg-sm', size: 10 });
    s += text(572, 366, 'solvated nor held to its cation.', { cls: 'fg-sm', size: 10 });
    s += text(572, 392, 'a NAKED anion: a far better nucleophile', { cls: 'fg-tag-good', size: 10.5 });
    return s;
  },
  caption: 'What "size-selective" actually looks like. Six ether oxygens held in one ring point all of their lone pairs into the middle, and an ion of the right size is wrapped by the lot of them at once — the ring doing, as a single molecule, the job a shell of solvent molecules normally does.',
  note: 'The middle panel is the argument, and the numbers in it are <b>diameters</b>: a 2.7 Å hole against a 2.66 Å potassium ion and a 1.9 Å sodium one. Potassium fills the cavity and contacts all six oxygens; sodium sits in a hole too big for it and touches fewer of them at a time, which is why the binding is so much weaker. The payoff is the anion left behind: unsolvated, uncoupled from its cation, and far more nucleophilic than the same ion in water.',
});




































/* ---------------------------------------------------------------- 200 ---
   Chapter 16 had 1.3 figures per section and makes four of its central
   claims in prose alone: where 4n + 2 comes from, which nitrogen lone pair
   is in the pi system, why the first EAS step is the slow one, and which
   three carbons the arenium charge actually reaches. Each of those is a
   picture the student is currently asked to build in their head. */

/* Frost's circle: inscribe the ring in a circle, vertex at the bottom, and
   every touching point is an orbital at that height. The MO filling pattern
   the notes assert in words is read straight off the geometry. */
FIGURES.push({
  id: 'frost-circles',
  section: 'aromaticity',
  anchor: '<b>Third</b>, count. The bottom orbital takes 2 electrons. Each degenerate pair above it takes 4 more. The counts that leave nothing half-filled are 2, then 6, then 10, then 14 — exactly what 4n + 2 generates. Hückel\'s rule is the arithmetic of leaving no half-filled shell.</p>',
  alt: 'Three Frost circles side by side. Benzene: a hexagon inscribed in a circle with one vertex at the bottom, six energy levels at the vertex heights, the lowest and the two below the center line each holding a pair of electrons and the top three empty. Cyclobutadiene: a square, with the lowest level paired and the two levels on the center line each holding one unpaired electron. Cyclopentadienyl anion: a pentagon, with the lowest level and the two below the center line all paired.',
  viewBox: '0 0 760 358',
  build() {
    let s = '';
    const CY = 152, R = 58;
    const panels = [
      { cx: 136, n: 6, title: 'benzene', pi: '6 π electrons',
        fill: [2, 2, 2, 0, 0, 0], detail: 'every bonding level full', verdict: 'AROMATIC', kind: 'fg-tag-good' },
      { cx: 380, n: 4, title: 'cyclobutadiene', pi: '4 π electrons',
        fill: [2, 1, 1, 0], detail: 'two unpaired electrons', verdict: 'ANTIAROMATIC', kind: 'fg-tag-warn' },
      { cx: 624, n: 5, title: 'cyclopentadienyl anion', pi: '6 π electrons',
        fill: [2, 2, 2, 0, 0], detail: 'every bonding level full', verdict: 'AROMATIC', kind: 'fg-tag-good' },
    ];
    for (const p of panels) {
      s += tag(p.cx, 42, p.title);
      s += `<circle class="fg-orb-node" cx="${p.cx}" cy="${CY}" r="${R}" fill="none"></circle>`;
      /* Vertex 0 at the bottom, then round the circle. The y of each vertex
         IS the orbital energy — that is the whole trick. */
      const v = [];
      for (let i = 0; i < p.n; i++) {
        const a = (90 + i * 360 / p.n) * Math.PI / 180;
        v.push(P(p.cx + Math.cos(a) * R, CY + Math.sin(a) * R));
      }
      for (let i = 0; i < p.n; i++) s += bond(v[i], v[(i + 1) % p.n], { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
      s += `<line class="fg-dash" x1="${p.cx - 78}" y1="${CY}" x2="${p.cx + 78}" y2="${CY}"></line>`;
      /* Levels lowest-first, so the fill array reads bottom to top. */
      const order = v.map((pt, i) => ({ pt, i })).sort((a, b) => b.pt.y - a.pt.y);
      order.forEach((o, rank) => {
        s += `<line class="fg-bond" x1="${(o.pt.x - 17).toFixed(2)}" y1="${o.pt.y.toFixed(2)}" x2="${(o.pt.x + 17).toFixed(2)}" y2="${o.pt.y.toFixed(2)}"></line>`;
        const e = p.fill[rank];
        if (e) s += text(o.pt.x, o.pt.y - 6, e === 2 ? '↑↓' : '↑', { cls: 'fg-hi', size: 12 });
      });
      s += label(p.cx, 248, p.pi, { size: 12.5 });
      s += text(p.cx, 270, p.detail, { cls: 'fg-sm', size: 10.5 });
      s += text(p.cx, 294, p.verdict, { cls: p.kind, size: 11 });
    }
    s += rule(258, 60, 258, 308);
    s += rule(502, 60, 502, 308);
    s += text(380, 336, 'Below the dashed line an orbital is bonding; on it, nonbonding; above it, antibonding.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Frost&rsquo;s circle turns the filling pattern into geometry. Inscribe the ring in a circle with <b>one vertex at the bottom</b>, and every point where the polygon touches the circle is a molecular orbital at that height. The single lowest orbital and the degenerate pairs above it are not asserted here &mdash; they are read off the drawing. Fill from the bottom, and 4n + 2 is exactly the count that leaves no pair half-filled.',
  note: 'Vertex at the BOTTOM, every time &mdash; that is the only rule, and getting it wrong inverts the whole diagram. Cyclobutadiene is the case worth staring at: its two middle electrons land in separate nonbonding orbitals with parallel spins, which is not a stabilized arrangement at all. That is what <b>antiaromatic</b> means, and it is why the count matters rather than just the delocalization.',
});

/* The pyrrole/pyridine lone pair, drawn edge-on. The notes call this "that
   single decision" and then describe a 3-D orbital orientation in a
   sentence. Seen from the side, the two cases are simply different. */
FIGURES.push({
  id: 'pyrrole-pyridine-lone-pairs',
  section: 'aromaticity',
  anchor: 'so both are aromatic, and both keep one lone pair available for ordinary chemistry.</p>',
  alt: 'Pyrrole and pyridine compared. Each is drawn as a skeletal ring and again edge-on, as a row of atoms along the ring plane with a p orbital above and below each one. Pyrrole\'s nitrogen has its lone pair drawn as two dots inside the upper p-orbital lobe; pyridine\'s nitrogen has its lone pair drawn as two dots on the ring-plane line, pointing outward away from the ring.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    const lobe = (cx, cy, op) => `<ellipse class="fg-orb" cx="${cx}" cy="${cy}" rx="11" ry="22" fill-opacity="${op}"></ellipse>`;
    const cases = [
      { cx: 190, n: 5, name: 'PYRROLE', nh: true, kind: 'fg-tag-good',
        l1: 'the lone pair IS the p orbital', l2: '2 C=C + that pair = 6 π · aromatic', l3: 'so the nitrogen is NOT basic' },
      { cx: 570, n: 6, name: 'PYRIDINE', nh: false, kind: 'fg-tag-good',
        l1: 'the lone pair is in the ring plane', l2: '3 ring double bonds = 6 π · aromatic', l3: 'so the nitrogen IS basic' },
    ];
    for (const c of cases) {
      s += tag(c.cx, 36, c.name);
      /* The skeletal ring, nitrogen at the bottom vertex. */
      const RC = P(c.cx, 106), R = 40, v = [];
      for (let i = 0; i < c.n; i++) {
        const a = (90 + i * 360 / c.n) * Math.PI / 180;
        v.push(P(RC.x + Math.cos(a) * R, RC.y + Math.sin(a) * R));
      }
      /* Pyrrole: N1-C2=C3-C4=C5. Pyridine: N1=C2-C3=C4-C5=C6. */
      const doubles = c.n === 5 ? [1, 3] : [0, 2, 4];
      for (let i = 0; i < c.n; i++) {
        const a = v[i], b = v[(i + 1) % c.n];
        const rFrom = i === 0 ? 15 : 0, rTo = (i + 1) % c.n === 0 ? 15 : 0;
        /* A double bond that lands on the nitrogen has to stop at its circle,
           which ringDouble (built for unlabeled ring vertices) does not do. */
        if (doubles.includes(i) && (rFrom || rTo)) s += bond(a, b, { order: 2, rFrom, rTo, gap: 3.6 });
        else if (doubles.includes(i)) s += ringDouble(a, b, RC, { inset: 10 });
        else s += bond(a, b, { rFrom, rTo });
      }
      s += atom(v[0].x, v[0].y, 'N', { kind: 'hi' });
      if (c.nh) {
        s += bond(v[0], P(c.cx, v[0].y + 32), { rFrom: 16, rTo: 11 });
        s += atom(c.cx, v[0].y + 32, 'H', { r: 11 });
      }
      /* The same ring seen edge-on: the plane is a line, and every p orbital
         stands up off it. */
      s += text(c.cx, 214, 'the same ring, seen edge-on', { cls: 'fg-sm', size: 10.5 });
      const BY = 278, step = c.n === 5 ? 44 : 40;
      const x0 = c.cx - step * (c.n - 1) / 2;
      s += `<line class="fg-bond-soft" x1="${x0 - 22}" y1="${BY}" x2="${x0 + step * (c.n - 1) + 22}" y2="${BY}"></line>`;
      for (let i = 0; i < c.n; i++) {
        const x = x0 + i * step;
        const strong = i === 0 && c.nh;
        s += lobe(x, BY - 26, strong ? 0.4 : 0.16);
        s += lobe(x, BY + 26, strong ? 0.4 : 0.16);
      }
      for (let i = 0; i < c.n; i++) {
        const x = x0 + i * step;
        s += atom(x, BY, i === 0 ? 'N' : 'C', { kind: i === 0 ? 'hi' : 'plain', r: 13, size: 11 });
      }
      if (c.nh) s += lonePair(x0, BY, -90, { dist: 26 });
      else s += lonePair(x0, BY, 180, { dist: 26 });
      s += label(c.cx, 346, c.l1, { size: 12.5 });
      s += text(c.cx, 366, c.l2, { cls: 'fg-sm', size: 10.5 });
      s += text(c.cx, 388, c.l3, { cls: c.kind, size: 11 });
    }
    s += rule(380, 56, 380, 392);
    return s;
  },
  caption: 'Both rings are aromatic with six pi electrons, and they get there by opposite routes. Pyrrole&rsquo;s nitrogen has no ring double bond, so its lone pair is the one standing up in the p orbital &mdash; spent on the sextet, and therefore not available to a proton. Pyridine&rsquo;s nitrogen already has a C=N supplying its two electrons, so its lone pair lies in an sp² orbital in the plane of the ring, pointing outward, untouched by the pi system and free to act as a base.',
  note: 'Ask one question of every heteroatom in a ring: <b>does it already have a double bond in the ring?</b> If it does, its lone pair is in the plane and contributes 0. If it does not, its lone pair is in the p orbital and contributes 2. That one question settles pyrrole, pyridine, furan, thiophene and both nitrogens of imidazole.',
});


/* The whole "why substitution" argument is energetic and nothing was drawn.
   Two barriers, one shallow well, and a grayed branch showing where addition
   would have gone. */
FIGURES.push({
  id: 'eas-energy-profile',
  section: 'eas',
  anchor: 'stabilizes the transition state leading to it, and therefore speeds the reaction up.</div>',
  alt: 'A reaction-energy diagram for electrophilic aromatic substitution. From benzene plus an electrophile the curve rises steeply over a tall first transition state, drops into a shallow well labeled arenium ion that is well above the starting level, rises over a much smaller second transition state, and falls to a product plateau below the start. A gray dashed branch leaves the arenium well, rises over a barrier and ends on a plateau above the starting level, labeled addition product.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    const base = 320;
    s += rule(56, base, 692, base) + rule(56, base, 56, 60);
    s += text(62, 44, 'free energy', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(380, 344, 'reaction coordinate →', { cls: 'fg-sm', size: 10.5 });

    const start = P(70, 252), ts1 = P(196, 92), well = P(300, 198), ts2 = P(392, 158), prod = P(580, 288);
    /* The branch benzene does not take: addition, which never gets the
       aromaticity back and so ends UPHILL of the starting material. */
    s += profile([well, P(430, 120), P(664, 226)], 'fg-dash');
    s += profile([start, ts1, well, ts2, prod]);
    s += `<line class="fg-dash" x1="${well.x}" y1="${well.y}" x2="${well.x}" y2="${base}"></line>`;

    s += text(72, 272, 'benzene + E⁺', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(196, 76, '‡', { cls: 'fg-tag-warn', size: 15 });
    s += text(196, 60, 'TS1 · aromaticity being lost', { cls: 'fg-tag-warn', size: 11 });
    s += text(392, 152, '‡', { cls: 'fg-tag', size: 13 });
    s += text(362, 136, 'TS2 · H⁺ leaving', { cls: 'fg-tag', size: 11, anchor: 'end' });
    s += text(308, 230, 'arenium ion', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(308, 248, 'the 36 kcal/mol is gone', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(548, 310, 'substituted benzene — aromatic again', { cls: 'fg-sm', size: 10.5 });
    s += text(668, 250, 'addition product ✗', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });

    s += text(380, 368, 'Two barriers and one intermediate — and the first barrier is the taller one.', { cls: 'fg-lbl', size: 12.5 });
    s += text(380, 388, 'Anything that lowers the arenium ion lowers TS1 with it, which is the whole of the next section.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The first barrier is tall because aromaticity has to be paid for up front; the second is small because losing a proton hands it straight back. That asymmetry is the reason the <b>first</b> step is rate-determining &mdash; and since the rate-determining step is the one every directing-effect argument is about, everything in the next section is really an argument about the height of TS1.',
  note: 'Look at where the gray branch ends: <b>above</b> the starting material. Addition to benzene is uphill overall, and that, not anything about the first step, is what makes EAS a substitution. An alkene&rsquo;s version of this diagram has the gray branch running downhill instead, which is why an alkene adds.',
});

/* Three contributors and a hybrid. The notes assert the three-carbon
   delocalization in one sentence, and the whole of the next section is read
   off it. */
FIGURES.push({
  id: 'arenium-resonance-three',
  section: 'eas',
  anchor: 'since conjugation is still broken.</p>',
  alt: 'Three resonance structures of the arenium ion in a row, each a benzene ring with an sp3 carbon at the top bearing E on a wedge and H on a hash. The positive charge is on an ortho carbon in the first, on the para carbon in the second and on the other ortho carbon in the third, with curved arrows connecting them. Below, the hybrid is drawn with a dashed arc over the five remaining carbons and a delta-plus on only three of them.',
  viewBox: '0 0 760 470',
  build() {
    let s = '';
    const R = 46;
    const verts = (cx, cy) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        v.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
      }
      return v;   // 0 top (sp3), 1 ortho, 2 meta, 3 para, 4 meta, 5 ortho
    };
    const ringOf = (cx, cy, doubles) => {
      const v = verts(cx, cy), mid = P(cx, cy);
      let g = '';
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        if (doubles.includes(i)) g += ringDouble(v[i], v[j], mid, { inset: 10 });
        else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
      }
      /* The sp3 carbon carries both groups: E toward the reader, H away. */
      g += wedge(v[0], P(cx - 28, cy - R - 38), { rFrom: 0, rTo: 14 });
      g += atom(cx - 28, cy - R - 38, 'E', { kind: 'hi', r: 14 });
      g += hash(v[0], P(cx + 28, cy - R - 38), { rFrom: 0, rTo: 12 });
      g += atom(cx + 28, cy - R - 38, 'H', { r: 12 });
      return g;
    };
    const plus = (cx, cy, i) => {
      const v = verts(cx, cy)[i];
      const ux = (v.x - cx) / R, uy = (v.y - cy) / R;
      return text(v.x + ux * 19, v.y + uy * 19 + 5, '+', { cls: 'fg-warn', size: 17 });
    };

    const CY = 140;
    s += tag(380, 28, 'THE THREE ARENIUM CONTRIBUTORS');
    // 1: charge on an ortho carbon; the meta-side C=C is about to shift.
    s += ringOf(140, CY, [2, 4]);
    s += plus(140, CY, 1);
    s += curve(P(166, 177), P(187, 141), { bow: -13 });
    // 2: charge on the para carbon.
    s += ringOf(380, CY, [1, 4]);
    s += plus(380, CY, 3);
    s += curve(P(333, 141), P(354, 177), { bow: -13 });
    // 3: charge on the other ortho carbon.
    s += ringOf(620, CY, [1, 3]);
    s += plus(620, CY, 5);

    const dbl = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { muted: true }) + arrow(P(x2, y), P(x1, y), { muted: true });
    s += dbl(218, 302, CY);
    s += dbl(458, 542, CY);
    s += text(140, 232, 'charge on an ortho carbon', { cls: 'fg-tag', size: 11 });
    s += text(380, 232, 'charge on the para carbon', { cls: 'fg-tag', size: 11 });
    s += text(620, 232, 'charge on the other ortho', { cls: 'fg-tag', size: 11 });
    s += rule(24, 258, 736, 258);

    /* The hybrid: one drawing, with the charge marked only where it is. */
    const HY = 342;
    const v = verts(380, HY);
    for (let i = 0; i < 6; i++) s += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
    s += wedge(v[0], P(352, HY - R - 38), { rFrom: 0, rTo: 14 });
    s += atom(352, HY - R - 38, 'E', { kind: 'hi', r: 14 });
    s += hash(v[0], P(408, HY - R - 38), { rFrom: 0, rTo: 12 });
    s += atom(408, HY - R - 38, 'H', { r: 12 });
    const arcR = 30;
    const a1 = P(380 + (v[1].x - 380) / R * arcR, HY + (v[1].y - HY) / R * arcR);
    const a5 = P(380 + (v[5].x - 380) / R * arcR, HY + (v[5].y - HY) / R * arcR);
    s += `<path class="fg-dash-hi" d="M${a1.x.toFixed(2)} ${a1.y.toFixed(2)} A${arcR} ${arcR} 0 1 1 ${a5.x.toFixed(2)} ${a5.y.toFixed(2)}"></path>`;
    for (const i of [1, 3, 5]) {
      const p = v[i];
      const ux = (p.x - 380) / R, uy = (p.y - HY) / R;
      s += text(p.x + ux * 22, p.y + uy * 22 + 4, 'δ+', { cls: 'fg-warn', size: 12 });
    }
    s += text(452, 366, 'meta · no charge, ever', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
    s += text(308, 366, 'meta · no charge, ever', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });
    s += label(380, 438, 'the hybrid: partial + on THREE carbons, none on the other two', { size: 12.5 });
    s += text(380, 458, 'and the two bare carbons are exactly the meta positions', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Three structures, three carbons. The charge lands <b>ortho, para, ortho</b> with respect to the carbon the electrophile attacked, and never on the two carbons meta to it. The hybrid underneath shows where the charge actually is: partial positive on three carbons and none on two.',
  note: 'Count the marked carbons: THREE, not five. Everything in the next section is read off this one picture &mdash; a substituent sitting on a δ+ carbon can help or hurt, and a substituent sitting on a bare carbon can do neither. The two unmarked carbons are the meta positions, which is the entire reason meta directors exist.',
});


/* One fully drawn example of each of the five reactions. The notes give the
   other four as table rows only. */
FIGURES.push({
  id: 'five-eas-reactions',
  section: 'eas',
  anchor: 'because one of them has serious problems and the other does not.</p>',
  alt: 'Five rows, each showing benzene, an arrow carrying the reagents, and the product ring with its new substituent: bromobenzene from bromine and iron tribromide, nitrobenzene from nitric and sulfuric acid, benzenesulfonic acid from sulfur trioxide with a reverse arrow underneath, ethylbenzene from chloroethane and aluminum trichloride with a faint second ethyl group, and acetophenone from acetyl chloride and aluminum trichloride.',
  viewBox: '0 0 760 430',
  build() {
    let s = '';
    /* A flat-right hexagon so the substituent can hang off horizontally. */
    const hex = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * 60) * Math.PI / 180;
        v.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
      }
      return v;
    };
    const ring = (cx, cy) => {
      const v = hex(cx, cy, 24), mid = P(cx, cy);
      let g = '';
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        if ([0, 2, 4].includes(i)) g += ringDouble(v[i], v[j], mid, { inset: 6, gap: 3.4 });
        else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
      }
      return g;
    };
    const rows = [
      { y: 72,  rgt: 'Br₂, FeBr₃',      sub: 'Br',     r: 15, name: 'bromobenzene',          note: 'FeBr₃ is catalytic — a trace is enough' },
      { y: 152, rgt: 'HNO₃, H₂SO₄',     sub: 'NO₂',    r: 18, name: 'nitrobenzene',          note: 'later reduced to NH₂ — the way onto aromatic amines' },
      { y: 232, rgt: 'SO₃, H₂SO₄',      sub: 'SO₃H',   r: 21, name: 'benzenesulfonic acid',  note: 'the only one of the five that also runs backwards' },
      { y: 312, rgt: 'CH₃CH₂Cl, AlCl₃', sub: 'CH₂CH₃', r: 25, name: 'ethylbenzene',         note: 'ethyl activates the ring, so it happens again' },
      { y: 392, rgt: 'CH₃COCl, AlCl₃',  sub: 'COCH₃',  r: 23, name: 'acetophenone',          note: 'the ketone deactivates, so it stops at one' },
    ];
    s += tag(380, 28, 'THE FIVE REACTIONS, EACH DRAWN ONCE');
    rows.forEach((row, i) => {
      const y = row.y;
      s += ring(70, y);
      if (i === 2) {
        s += arrow(P(106, y - 6), P(196, y - 6));
        s += arrow(P(196, y + 12), P(106, y + 12), { muted: true });
        s += text(151, y - 16, row.rgt, { cls: 'fg-sm', size: 10.5 });
        s += text(151, y + 30, 'H₂O, H⁺, Δ', { cls: 'fg-sm', size: 10.5 });
      } else {
        s += arrow(P(106, y), P(196, y));
        s += text(151, y - 10, row.rgt, { cls: 'fg-sm', size: 10.5 });
      }
      s += ring(248, y);
      const v = hex(248, y, 24);
      s += bond(v[0], P(248 + 24 + 32, y), { rFrom: 0, rTo: row.r });
      s += atom(248 + 24 + 32, y, row.sub, { kind: 'hi', r: row.r, size: row.sub.length > 3 ? 8.5 : 10 });
      if (i === 3) {
        /* The second alkylation, drawn faint: this is the whole problem. */
        s += bond(v[2], P(248 - 34, y + 42), { rFrom: 0, rTo: 13, cls: 'fg-bond-soft' });
        s += text(248 - 34, y + 46, 'Et', { cls: 'fg-mut', size: 11 });
      }
      s += label(356, y - 4, row.name, { size: 12.5, anchor: 'start' });
      s += text(356, y + 16, row.note, { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    });
    return s;
  },
  caption: 'Each of the five, once, with a real product on the end of the arrow. Only rows 4 and 5 make a carbon&ndash;carbon bond; only row 3 runs backwards; only row 4 keeps going after the first substitution. Those three facts are most of what the rest of this section is about.',
  note: 'Row 3&rsquo;s reverse arrow and row 4&rsquo;s faint second ethyl are the two features worth memorizing. One of them is the blocking-group trick that makes an ortho product reachable; the other is the reason Friedel&ndash;Crafts acylation exists at all.',
});

/* The octet-complete contributor is the section's central claim and was made
   in a sentence. Drawn, ortho/para versus meta stops being a rule. */
FIGURES.push({
  id: 'donor-octet-structure',
  section: 'directing-effects',
  anchor: 'these groups are both <b>ortho/para directors</b> and <b>activators</b>.</p>',
  alt: 'Aniline arenium ions compared. The top row shows para attack in three structures: the charge on an ortho carbon, then on the carbon bearing the NH2 group with a curved arrow from the nitrogen lone pair, then a highlighted structure with a carbon-nitrogen double bond, the positive charge on nitrogen and every atom holding a complete octet. The bottom row shows meta attack in three structures where the charge never reaches the nitrogen-bearing carbon, followed by an empty crossed-out box.',
  viewBox: '0 0 760 512',
  build() {
    let s = '';
    const verts = (cx, cy, R) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        v.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
      }
      return v;   // 0 carries NH2, 1 & 5 ortho, 2 & 4 meta, 3 para
    };
    /* `hit` is the carbon the electrophile added to; `pos` is where the
       positive charge sits in this contributor; `nDouble` swaps the C-N bond
       for the octet-complete structure. */
    const unit = (cx, cy, R, hit, pos, doubles, nDouble) => {
      const v = verts(cx, cy, R), mid = P(cx, cy);
      let g = '';
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        if (doubles.includes(i)) g += ringDouble(v[i], v[j], mid, { inset: 9 });
        else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
      }
      const nh = P(cx, cy - R - 32);
      g += bond(v[0], nh, { rFrom: 0, rTo: 16, order: nDouble ? 2 : 1, gap: 3.6 });
      g += atom(nh.x, nh.y, 'NH₂', { kind: nDouble ? 'warn' : 'hi', r: 16, size: 10 });
      if (!nDouble) g += lonePair(nh.x, nh.y, 180, { dist: 24 });
      else g += text(nh.x + 25, nh.y - 10, '+', { cls: 'fg-warn', size: 16 });
      /* The attacked carbon goes sp3 and picks up the electrophile. */
      g += atom(v[hit].x, v[hit].y, 'sp³', { r: 14, size: 9.5 });
      const ux = (v[hit].x - cx) / R, uy = (v[hit].y - cy) / R;
      const e = P(v[hit].x + ux * 32, v[hit].y + uy * 32);
      g += bond(v[hit], e, { rFrom: 14, rTo: 13, cls: 'fg-bond-hi' });
      g += atom(e.x, e.y, 'E', { kind: 'hi', r: 13, size: 11 });
      if (pos !== null) {
        const p = v[pos];
        /* Straight out from the center, except on the carbon that carries the
           NH2 — there "out" is under the substituent, so the sign goes beside
           it instead of vanishing behind it. */
        if (pos === 0) g += text(cx - 26, cy - R + 6, '+', { cls: 'fg-warn', size: 17 });
        else {
          const px = (p.x - cx) / R, py = (p.y - cy) / R;
          g += text(p.x + px * 19, p.y + py * 19 + 5, '+', { cls: 'fg-warn', size: 17 });
        }
      }
      return g;
    };
    const dbl = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { muted: true }) + arrow(P(x2, y), P(x1, y), { muted: true });

    /* ---- row 1: attack PARA, and the charge can reach the nitrogen ---- */
    s += text(24, 42, 'ATTACK PARA (or ortho) — the charge reaches the nitrogen', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += panel(532, 50, 176, 198, { kind: 'hi' });
    const CY = 146, R1 = 44;
    s += unit(140, CY, R1, 3, 2, [0, 4], false);
    s += curve(P(162, 107), P(188, 142), { bow: -13 });
    s += unit(380, CY, R1, 3, 0, [1, 4], false);
    s += curve(P(352, 86), P(371, 99), { bow: -11 });
    s += unit(620, CY, R1, 3, null, [1, 4], true);
    s += dbl(216, 306, CY);
    s += dbl(444, 524, CY);
    s += text(140, 256, 'charge on an ortho carbon', { cls: 'fg-tag', size: 11 });
    s += text(380, 256, 'charge on the NH₂ carbon', { cls: 'fg-tag', size: 11 });
    s += text(620, 256, 'every atom octet-complete', { cls: 'fg-tag-good', size: 11 });
    s += rule(24, 280, 736, 280);

    /* ---- row 2: attack META, and it never does ---- */
    s += text(24, 304, 'ATTACK META — it never does', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    const CY2 = 396, R2 = 38;
    s += unit(140, CY2, R2, 2, 1, [3, 5], false);
    s += unit(340, CY2, R2, 2, 3, [0, 4], false);
    s += unit(540, CY2, R2, 2, 5, [0, 3], false);
    s += dbl(206, 274, CY2);
    s += dbl(406, 474, CY2);
    s += panel(618, 358, 78, 78);
    s += `<line class="fg-dash" x1="618" y1="358" x2="696" y2="436"></line>`;
    s += `<line class="fg-dash" x1="696" y1="358" x2="618" y2="436"></line>`;
    s += text(657, 456, 'no such', { cls: 'fg-tag-mut', size: 11 });
    s += text(657, 472, 'structure exists', { cls: 'fg-tag-mut', size: 11 });
    s += text(340, 500, 'three contributors, and the charge never once lands on the NH₂ carbon', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The whole of ortho/para direction is one extra box. Attack para (or ortho) and the positive charge can reach the carbon bearing the nitrogen &mdash; at which point the nitrogen&rsquo;s lone pair swings in, the C&ndash;N bond becomes a double bond, and <b>every atom in the molecule has a complete octet</b>. That structure is far lower in energy than any all-carbon cation, and it is why aniline brominates about 10⁵ times faster than benzene. Attack meta and the charge never reaches that carbon, so the box stays empty.',
  note: 'Do not count resonance structures &mdash; three against three is a tie, and the tie is exactly why counting fails here. Count the GOOD one. Ortho and para each get a fourth structure with full octets; meta gets none, and that single structure decides the question. The same drawing with NO₂ in place of NH₂ inverts it: there the charge reaching the substituted carbon is the disaster, and meta becomes the only tolerable attack.',
});

/* ------------------------------------------------------------ Spectroscopy ---
   The chapter taught four techniques and showed no spectrum. A region map is
   not a spectrum, a range chart is not a spectrum, and three structures are
   not a spectrum: a student could finish the chapter having never seen the
   thing every exam question in the subject puts in front of them. These five
   figures are the missing pictures. Every peak position drawn below is a real
   textbook value for the named compound. */

/* A % transmittance trace. Absorptions are Gaussian dips from a 100 %T
   baseline, which is what an IR trace actually is, and the sampling step
   tightens near a sharp band so a narrow spike does not come out triangular. */
function irTrace(peaks, X, Y) {
  const T = (w) => {
    let t = 100;
    for (const p of peaks) t -= p.d * Math.exp(-Math.pow((w - p.c) / p.s, 2) / 2);
    return Math.max(t, 3);
  };
  const near = (w) => peaks.some((p) => p.s < 40 && Math.abs(w - p.c) < 90);
  const pts = [];
  let w = 4000;
  while (w >= 500) {
    pts.push(`${n2(X(w))} ${n2(Y(T(w)))}`);
    w -= near(w) ? 3 : 14;
  }
  pts.push(`${n2(X(500))} ${n2(Y(T(500)))}`);
  return `<path class="fg-bond" d="M${pts.join(' L')}"></path>`;
}
/* (moved to lib/ochem-helpers.mjs) */

/* A stick, for the three spectra that are line spectra rather than traces. */
function stick(x, yBase, h, cls = 'fg-bond', w = 2.6) {
  return `<line class="${cls}" x1="${n2(x)}" y1="${n2(yBase)}" x2="${n2(x)}" y2="${n2(yBase - h)}" stroke-width="${w}"></line>`;
}








































/* ---------------------------------------------------------------- 22 ---
   Chapter 22 drew no molecules at all: five sections of reagent-and-product
   material whose central claims — a Meisenheimer complex, a benzyne, a
   benzylic resonance set, a phenoxide, a Birch intermediate, a diazotization
   — were made in prose and never shown. These six draw them. */

/* A hexagon kit the six figures below share. Vertex 0 is the top and the
   numbering runs clockwise, so 1 and 5 are ortho, 2 and 4 meta, 3 para. */
function hexKit(R) {
  const V = (cx, cy) => {
    const v = [];
    for (let i = 0; i < 6; i++) {
      const a = (-90 + i * 60) * Math.PI / 180;
      v.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
    }
    return v;
  };
  /* A point `d` further out along the line from the ring centre through
     vertex i — where a substituent hangs. */
  const out = (cx, cy, i, d) => {
    const v = V(cx, cy)[i];
    return P(v.x + ((v.x - cx) / R) * d, v.y + ((v.y - cy) / R) * d);
  };
  const ring = (cx, cy, doubles, opts = {}) => {
    const v = V(cx, cy), mid = P(cx, cy);
    let g = '';
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      if (doubles.includes(i)) g += ringDouble(v[i], v[j], mid, { inset: opts.inset ?? 9, gap: opts.gap ?? 4 });
      else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
    }
    return g;
  };
  /* A substituent on vertex i: a bond out to a labelled disc. */
  const sub = (cx, cy, i, txt, o = {}) => {
    const p = out(cx, cy, i, o.d ?? 34);
    const r = o.r ?? 16;
    return bond(V(cx, cy)[i], p, { rFrom: 0, rTo: r, cls: o.bondCls }) +
           atom(p.x, p.y, txt, { kind: o.kind || 'plain', r, size: o.size });
  };
  /* A charge or dot sitting just outside vertex i. */
  const mark = (cx, cy, i, txt, o = {}) => {
    const p = out(cx, cy, i, o.d ?? 19);
    return text(p.x, p.y + (o.dy ?? 5), txt, { cls: o.cls || 'fg-warn', size: o.size ?? 15 });
  };
  return { V, out, ring, sub, mark };
}
















/* ---------------------------------------------------------------- ch7.5 ---
   Energy diagrams & the Hammond postulate. Four figures, all of them the
   same object — a curve over a free-energy axis — because the whole section
   is about reading one picture in four different ways. The shared helpers
   below draw the axis, a smooth hill between two plateaus, and the two
   measuring arrows (a barrier and a plateau-to-plateau gap), so the four
   definitions differ only in the numbers, which is the honest way to show
   that only the numbers differ. */

/* A vertical double-headed arrow with its own short guide lines: the way a
   textbook marks a height on one of these diagrams. */
function measure(x, yTop, yBottom, opts = {}) {
  const c = opts.cls || 'fg-arrow';
  const h = opts.head || 'fg-head';
  let g = `<line class="${c}" x1="${x}" y1="${yBottom - 6}" x2="${x}" y2="${yTop + 7}"></line>`;
  g += `<path class="${h}" d="M${x} ${yTop} L${x + 3.6} ${yTop + 7} L${x - 3.6} ${yTop + 7} Z"></path>`;
  g += `<line class="${c}" x1="${x}" y1="${yTop + 6}" x2="${x}" y2="${yBottom - 7}"></line>`;
  g += `<path class="${h}" d="M${x} ${yBottom} L${x - 3.6} ${yBottom - 7} L${x + 3.6} ${yBottom - 7} Z"></path>`;
  return g;
}

/* One hill: a plateau, a rise to a peak at `peakX`, a fall to a second
   plateau. Returned as a path so the caller can pick the stroke class. */
function hill(xA, yA, xP, yP, xB, yB, cls = 'fg-bond-hi') {
  const lead = (xP - xA) * 0.55, tail = (xB - xP) * 0.55;
  return `<path class="${cls}" fill="none" d="M${xA} ${yA} C${xA + lead} ${yA} ${xP - lead * 0.45} ${yP} ${xP} ${yP} ` +
         `C${xP + tail * 0.45} ${yP} ${xB - tail} ${yB} ${xB} ${yB}"></path>`;
}





/* ---------------------------------------------------------------- 78 ---
   The Carbocations section of How Reactions Happen. It owns the general
   teaching that SN1 used to re-derive: the shape and the empty orbital, the
   hyperconjugation picture, the stability ladder, why vinyl and aryl are
   excluded, and the 1,2-shifts. Every one of those is a claim about geometry
   or about an ordering, which is exactly what prose cannot show. */








/* ---------------------------------------------------------------- 30 ---
   Cis/trans and E/Z. Five drawings for a section whose whole subject is a
   spatial relationship: which face of a ring a group sits on, which side of
   a double bond, and which of two branches outranks the other. Prose can
   assert all three and a reader still has to picture them. */















/* --------------------------------------------------------------- 230 ---
   The three figures the self-study pass deferred. Each is a structure the
   prose names and the reader has never been shown: a five-membered ring with
   one heteroatom between two carbonyls, a four-membered amide, and a polymer
   taken apart at its linkages. */

/* An open retrosynthetic arrow between two points: a double shaft and a
   filled head, the way the retrosynthesis figure draws it by hand. */
function openArrow(a, b, opts = {}) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, px = -uy, py = ux;
  const g = opts.gap ?? 4, hl = opts.head ?? 16, hw = opts.width ?? 9;
  const r = (v) => Math.round(v * 100) / 100;
  const ex = b.x - ux * (hl - 2), ey = b.y - uy * (hl - 2);
  let o = '';
  for (const k of [-g, g]) {
    o += `<line class="fg-arrow" x1="${r(a.x + px * k)}" y1="${r(a.y + py * k)}" x2="${r(ex + px * k)}" y2="${r(ey + py * k)}"></line>`;
  }
  const bx = b.x - ux * hl, by = b.y - uy * hl;
  o += `<path class="fg-head" d="M${r(b.x)} ${r(b.y)} L${r(bx + px * hw)} ${r(by + py * hw)} L${r(bx - px * hw)} ${r(by - py * hw)} Z"></path>`;
  return o;
}

/* The squiggle that marks a disconnection, drawn across a bond at its
   midpoint so it reads as a cut through that bond and not as a bond. */
function squiggle(a, b, opts = {}) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L, px = -uy, py = ux;
  const half = opts.half ?? 20;
  let d = '';
  for (let i = 0; i <= 8; i++) {
    const t = -half + (i * half) / 4;
    const off = i % 2 === 0 ? 0 : (i % 4 === 1 ? 5 : -5);
    const x = mx + px * t + ux * off, y = my + py * t + uy * off;
    d += (i === 0 ? 'M' : 'L') + `${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100} `;
  }
  return `<path class="${opts.cls || 'fg-dash-hi'}" fill="none" d="${d.trim()}"></path>`;
}





/* Figure modules. A figure written for one topic can live in its own file
   under scripts/ochem-figures/, which default-exports an array of figure
   definitions in the same shape as the ones above. This keeps a rewrite of
   one chapter's figures out of everyone else's way. */
const MOD_DIR = join(ROOT, 'scripts', 'ochem-figures');
if (existsSync(MOD_DIR)) {
  for (const f of readdirSync(MOD_DIR).filter((f) => f.endsWith('.mjs') && (!only || f === `${only}.mjs`)).sort()) {
    const mod = await import(pathToFileURL(join(MOD_DIR, f)).href);
    for (const def of mod.default) FIGURES.push({ ...def, from: f });
  }
}
{
  const seen = new Set();
  for (const def of FIGURES) {
    // One id per page: two figures on different pages may share an id, since
    // each page carries its own markers (nitrogen-inversion does).
    for (const page of [def.section, ...(def.lessons || []).map((l) => 'lesson:' + l)].filter(Boolean)) {
      const key = `${def.id}@${page}`;
      if (seen.has(key)) { console.error(`FAIL: two figures share the id ${def.id} on ${page}.`); process.exit(1); }
      seen.add(key);
    }
  }
}

const START = (id) => `<!-- fig:${id}:start -->`;
const END = (id) => `<!-- fig:${id}:end -->`;

/* A figure can also be shown in a lesson. A lesson's steps are HTML inside
   single-quoted JavaScript strings, so the lesson carries the markers inside
   one of those strings, where its author wants the figure, and the block
   written there is one line with every quote and backslash made safe for
   that string. The words and the drawing are the same ones the notes page
   shows, so the two cannot drift. A lesson listed in `lessons` must already
   carry the markers: where a figure sits in a lesson is the author's call. */
const forJsString = (html) => html.replace(/\\/g, '\\\\').replace(/'/g, '&#39;').replace(/\n/g, ' ');

let wrote = 0;
const stale = [];
function place(file, rel, def, block, anchorOk) {
  const current = readFileSync(file, 'utf8');
  let next;
  const a = current.indexOf(START(def.id));
  const b = current.indexOf(END(def.id));
  if (a !== -1 && b !== -1) {
    next = current.slice(0, a) + block + current.slice(b + END(def.id).length);
  } else {
    const at = anchorOk && def.anchor ? current.indexOf(def.anchor) : -1;
    if (at === -1) {
      console.error(`FAIL: ${def.id} has no markers in ${rel}` + (anchorOk ? ` and could not find its anchor: ${def.anchor}` : '.'));
      process.exit(1);
    }
    const insert = at + def.anchor.length;
    next = current.slice(0, insert) + '\n' + block + current.slice(insert);
  }
  if (next === current) return;
  if (check) { stale.push(`${def.id} (${rel})`); return; }
  writeFileSync(file, next);
  wrote++;
}

for (const def of FIGURES) {
  if (only && def.from !== `${only}.mjs`) continue;
  const html = figure({
    viewBox: def.viewBox,
    alt: def.alt,
    caption: def.caption,
    note: def.note,
    body: def.build(),
  });
  if (def.section) {
    const rel = `ochem/notes/${def.section}.html`;
    const file = join(ROOT, rel);
    if (!existsSync(file)) {
      console.error(`FAIL: ${def.id} targets ${rel}, which does not exist.`);
      process.exit(1);
    }
    place(file, rel, def, `${START(def.id)}\n${html}\n${END(def.id)}`, true);
  }
  for (const lesson of def.lessons || []) {
    const rel = `ochem/lessons/${lesson}.html`;
    const file = join(ROOT, rel);
    if (!existsSync(file)) {
      console.error(`FAIL: ${def.id} targets ${rel}, which does not exist.`);
      process.exit(1);
    }
    place(file, rel, def, `${START(def.id)}${forJsString(html)}${END(def.id)}`, false);
  }
}

if (check) {
  if (stale.length) {
    console.error(`FAIL: ${stale.length} figure(s) are stale or missing: ${stale.join(', ')}`);
    console.error('Run: node scripts/build-ochem-figures.mjs');
    process.exit(1);
  }
  console.log(`OK — all ${FIGURES.length} generated figures are up to date.`);
} else {
  console.log(`Wrote ${wrote} of ${FIGURES.length} figures.`);
}
