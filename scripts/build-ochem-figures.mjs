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


/* ------------------------------------------------------------------ 1 ---
   Why acid derivatives only react downhill. The ladder is the organising
   fact of the whole chapter and the notes state it in words only. */
FIGURES.push({
  id: 'acyl-ladder',
  section: 'acyl-substitution',
  anchor: '<h3>Which group leaves?</h3>',
  alt: 'Acid derivative reactivity ladder from acyl chloride down to amide, against leaving-group stability',
  viewBox: '0 0 760 330',
  build() {
    const rows = [
      { y: 62,  name: 'Acyl chloride',  g: 'Cl',   lg: 'Cl⁻',   pka: 'pKa −7',  w: 300, kind: 'hi'   },
      { y: 124, name: 'Anhydride',      g: 'OCOR', lg: 'RCO₂⁻', pka: 'pKa 4.8', w: 224, kind: 'hi'   },
      { y: 186, name: 'Ester',          g: 'OR',   lg: 'RO⁻',   pka: 'pKa 16',  w: 128, kind: 'hi'   },
      { y: 248, name: 'Amide',          g: 'NR₂',  lg: 'R₂N⁻',  pka: 'pKa 38',  w: 44,  kind: 'warn' },
    ];
    let s = '';
    s += tag(176, 30, 'the group that leaves');
    s += tag(348, 30, 'how stable it is once it has left');
    s += tag(540, 30, 'reactivity');
    for (const r of rows) {
      s += label(8, r.y + 4, r.name, { anchor: 'start', size: 12 });
      s += text(176, r.y + 4, r.g, { cls: 'fg-lbl', size: 11.5 });
      s += text(276, r.y + 4, r.lg, { cls: 'fg-sm', size: 10.5 });
      s += text(356, r.y + 4, r.pka, { cls: 'fg-sm', size: 10 });
      s += bar(410, r.y - 8, r.w * 0.68, 16, { kind: r.kind === 'warn' ? 'warn' : 'hi', opacity: 0.3 + r.w / 440 });
    }
    // The one-way arrow down the ladder. Its label goes above it; hanging off
    // the side put half the words outside the viewBox.
    s += arrow(P(700, 78), P(700, 268));
    s += text(700, 64, 'only this way', { cls: 'fg-tag', size: 10.5 });
    s += rule(8, 42, 730, 42);
    return s;
  },
  caption: 'The ladder every acyl substitution runs down. A derivative reacts to give one <b>below</b> it and never one above, and the single reason is the column in the middle: the leaving group departs as an anion, and how willing it is to do that is how stable that anion is once formed.',
  note: 'Read the pKa column as the whole explanation. Cl⁻ is the conjugate base of a strong acid and perfectly happy alone; R₂N⁻ is the conjugate base of something barely acidic at all and is a ferociously strong base. That is why an acyl chloride converts to an amide on contact and an amide needs hours of hot aqueous acid to go anywhere.',
});




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


/* ------------------------------------------------------------------ 8 ---
   One molecule, three notations, so the rules can be read off by comparison
   rather than taken on trust. */
FIGURES.push({
  id: 'skeletal-notation',
  section: 'skeletal-structures',
  anchor: '<h3>Four rules, and the third is the one people get wrong</h3>',
  alt: 'Butan-1-ol drawn as a full Lewis structure, condensed, and skeletal, with the implied carbons and hydrogens marked',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    // ---- Lewis ----
    s += tag(130, 40, 'FULL LEWIS');
    const lx = [46, 102, 158, 214], ly = 104;
    for (let i = 0; i < 4; i++) {
      if (i) s += bond(P(lx[i - 1], ly), P(lx[i], ly), { rFrom: 13, rTo: 13 });
      s += atom(lx[i], ly, 'C', { r: 13, size: 11 });
      // Hydrogens above and below, and three on the first carbon.
      s += bond(P(lx[i], ly), P(lx[i], ly - 38), { rFrom: 13, rTo: 11 });
      s += atom(lx[i], ly - 38, 'H', { r: 11, size: 10 });
      s += bond(P(lx[i], ly), P(lx[i], ly + 38), { rFrom: 13, rTo: 11 });
      s += atom(lx[i], ly + 38, 'H', { r: 11, size: 10 });
    }
    s += bond(P(lx[0], ly), P(lx[0] - 40, ly), { rFrom: 13, rTo: 11 });
    s += atom(lx[0] - 40, ly, 'H', { r: 11, size: 10 });
    s += bond(P(lx[3], ly), P(lx[3] + 42, ly), { rFrom: 13, rTo: 13 });
    s += atom(lx[3] + 42, ly, 'O', { r: 13, size: 11 });
    s += bond(P(lx[3] + 42, ly), P(lx[3] + 42, ly - 38), { rFrom: 13, rTo: 11 });
    s += atom(lx[3] + 42, ly - 38, 'H', { r: 11, size: 10 });
    s += text(130, 176, '15 symbols to say one molecule', { cls: 'fg-sm', size: 10 });

    s += rule(300, 34, 300, 300);

    // ---- Condensed ----
    s += tag(400, 40, 'CONDENSED');
    s += label(400, 108, 'CH₃CH₂CH₂CH₂OH', { size: 15 });
    s += text(400, 140, 'shorter, but the shape is gone', { cls: 'fg-sm', size: 10 });

    s += rule(500, 34, 500, 300);

    // ---- Skeletal ----
    s += tag(630, 40, 'SKELETAL');
    const pts = [P(540, 118), P(576, 96), P(612, 118), P(648, 96), P(684, 118)];
    for (let i = 1; i < pts.length; i++) s += bond(pts[i - 1], pts[i], { rFrom: 0, rTo: i === pts.length - 1 ? 14 : 0 });
    s += atom(684, 118, 'OH', { r: 15, size: 10.5 });
    // Mark the implied carbons and their implied hydrogens.
    for (let i = 0; i < 4; i++) {
      s += atom(pts[i].x, pts[i].y, '', { kind: 'point' });
      const above = i % 2 === 1;
      s += text(pts[i].x, pts[i].y + (above ? -16 : 26), i === 0 ? 'CH₃' : 'CH₂', { cls: 'fg-sm', size: 9.5 });
    }
    // Centred on the column, and short enough that the rendered width stays
    // inside the canvas — the bounds test checks anchor points, not glyphs.
    s += text(618, 176, 'every corner and end is a carbon', { cls: 'fg-sm', size: 10 });
    s += text(618, 192, 'H = whatever is left of four', { cls: 'fg-sm', size: 10 });
    s += text(618, 214, 'the O and its H are always drawn', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(34, 244, 726, 244);
    s += text(380, 272, 'Same molecule, butan-1-ol. The hydrogens did not disappear — they became', { cls: 'fg-lbl', size: 12 });
    s += text(380, 294, 'something you work out, which is cheaper than something you read.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Butan-1-ol three ways. The skeletal drawing on the right contains exactly the same information as the Lewis structure on the left — it has simply moved the boring half of it into rules you apply rather than symbols you read.',
  note: 'Note what stayed visible. The oxygen is drawn and its hydrogen is drawn, while nine hydrogens on carbon are not. That is not inconsistency: an O–H hydrogen is acidic, hydrogen bonds, and gets removed by base, so it is part of the chemistry; a C–H hydrogen on a chain almost never is. The notation hides what does not matter and keeps what does.',
});


/* ------------------------------------------------------------------ 9 ---
   Reducing or not. The notes make the claim in a sentence — a hemiacetal
   opens, an acetal does not — and it is the single test the whole
   disaccharide section rests on. Drawn side by side, the difference is one
   substituent on one carbon, which is exactly the point. */
FIGURES.push({
  id: 'anomeric-test',
  section: 'carbohydrates',
  anchor: '<h3>The polysaccharides worth knowing</h3>',
  viewBox: '0 0 760 330',
  alt: 'A hemiacetal anomeric carbon opening to the open-chain aldehyde beside an acetal anomeric carbon that cannot open',
  build() {
    let s = '';
    const col = (x, title, kind) => {
      s += panel(x, 44, 330, 176, { kind });
      s += tag(x + 165, 30, title);
    };
    col(24, 'hemiacetal — one OR, one OH', null);
    col(406, 'acetal — two OR', 'warn');

    // Left: ring carbon with OH and ring O, opening to the aldehyde.
    const c1 = P(120, 116);
    s += atom(c1.x, c1.y, 'C', { kind: 'hi' });
    s += atom(120, 62, 'OH', { });
    s += atom(62, 148, 'O', { });
    s += bond(c1, P(120, 62));
    s += bond(c1, P(62, 148));
    s += text(62, 176, 'ring', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(176, 116), P(250, 116));
    s += text(213, 104, 'opens', { cls: 'fg-tag-good', size: 10.5 });
    s += atom(300, 116, 'CHO');
    s += text(300, 150, 'free aldehyde', { cls: 'fg-sm', size: 10 });
    s += text(189, 200, 'Tollens’ has something to oxidize', { cls: 'fg-tag-good', size: 10.5 });

    // Right: the same carbon with the OH replaced by OR.
    const c2 = P(502, 116);
    s += atom(c2.x, c2.y, 'C', { kind: 'warn' });
    s += atom(502, 62, 'OR', { });
    s += atom(444, 148, 'O', { });
    s += bond(c2, P(502, 62));
    s += bond(c2, P(444, 148));
    s += text(444, 176, 'ring', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(558, 116), P(632, 116), { muted: true });
    s += text(595, 104, 'stays shut', { cls: 'fg-tag', size: 10.5 });
    s += text(682, 120, 'no aldehyde', { cls: 'fg-sm', size: 10 });
    s += text(571, 200, 'nothing to oxidize, so no test', { cls: 'fg-tag', size: 10.5 });

    s += rule(34, 246, 726, 246);
    s += text(380, 274, 'One substituent on one carbon decides whether a sugar reduces Tollens’', { cls: 'fg-lbl', size: 12 });
    s += text(380, 296, 'reagent — and therefore whether maltose behaves like glucose or like sucrose.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The anomeric carbon, with and without a free OH. On the left it is a hemiacetal: the ring opens back to the open-chain aldehyde, and that aldehyde is what a reducing-sugar test oxidizes. On the right a second alcohol has capped it, making a full acetal — stable to base, so the ring never opens and no aldehyde is ever available.',
  note: 'This is why sucrose is the standard exception. Its glycosidic bond runs anomeric carbon to anomeric carbon, so both rings are acetals at once and neither end can open; maltose commits only one, which leaves the other free and keeps maltose reducing.',
});

/* ----------------------------------------------------------------- 10 ---
   Charge against pH. The notes give three species and two pKa values and
   expect the reader to assemble the picture; the picture is a number line,
   and drawing it makes the pI visibly the midpoint rather than a formula to
   memorize. */
FIGURES.push({
  id: 'zwitterion-ladder',
  section: 'amino-acids',
  anchor: '<h3>Stereochemistry: one carbon, one answer, two exceptions</h3>',
  viewBox: '0 0 760 310',
  alt: 'Glycine net charge plotted against pH, showing the cation below pKa 2.34, the zwitterion between, and the anion above pKa 9.60, with pI at 5.97',
  build() {
    let s = '';
    const x = (pH) => 70 + (pH / 14) * 620;
    s += rule(70, 196, 690, 196);
    for (let pH = 0; pH <= 14; pH += 2) {
      s += rule(x(pH), 196, x(pH), 203);
      s += text(x(pH), 218, String(pH), { cls: 'fg-sm', size: 10 });
    }
    s += text(380, 240, 'pH', { cls: 'fg-tag', size: 11 });

    const zones = [
      { a: 0,    b: 2.34, label: 'cation',     charge: '+1', kind: 'warn' },
      { a: 2.34, b: 9.60, label: 'zwitterion', charge: '0',  kind: 'hi'   },
      { a: 9.60, b: 14,   label: 'anion',      charge: '−1', kind: 'warn' },
    ];
    for (const z of zones) {
      const x1 = x(z.a), x2 = x(z.b);
      s += bar(x1, 128, x2 - x1, 52, { kind: z.kind === 'hi' ? 'hi' : 'warn', opacity: 0.32 });
      s += text((x1 + x2) / 2, 150, z.label, { cls: 'fg-lbl', size: 12 });
      s += text((x1 + x2) / 2, 168, 'net ' + z.charge, { cls: 'fg-sm', size: 10 });
    }

    for (const [pH, name] of [[2.34, 'pKₐ₁ 2.34'], [9.60, 'pKₐ₂ 9.60']]) {
      s += rule(x(pH), 104, x(pH), 196);
      s += text(x(pH), 96, name, { cls: 'fg-tag', size: 10.5 });
    }
    s += rule(x(5.97), 62, x(5.97), 128);
    s += text(x(5.97), 54, 'pI 5.97', { cls: 'fg-tag-good', size: 11 });
    s += text(x(5.97), 38, '½(2.34 + 9.60)', { cls: 'fg-sm', size: 10 });

    s += text(150, 272, 'below pI: cation → cathode', { cls: 'fg-sm', size: 10.5 });
    s += text(380, 272, 'at pI: no net charge, no migration', { cls: 'fg-tag-good', size: 10.5 });
    s += text(620, 272, 'above pI: anion → anode', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Glycine’s net charge against pH. The two pKa values are the only boundaries there are, so the molecule has exactly three states, and the isoelectric point sits at their midpoint because that is where the cation and anion populations are equal.',
  note: 'Reading the electrophoresis direction takes two inversions and they do not cancel: first compare the pH with the pI to get the sign, then remember that opposite charges attract. Getting one of the two backwards produces a confident wrong answer.',
});

/* ----------------------------------------------------------------- 11 ---
   One resonance structure, three consequences. The notes list them; the
   drawing puts the arrow that causes all three next to the properties it
   causes, which is the only way the list stops looking like three facts. */
FIGURES.push({
  id: 'amide-planarity',
  section: 'peptides-proteins',
  anchor: '<h3>Four levels of structure</h3>',
  viewBox: '0 0 760 320',
  alt: 'Amide resonance pushing the nitrogen lone pair into the carbonyl, with the resulting planar unit and its three consequences',
  build() {
    let s = '';
    const draw = (ox, dbl) => {
      const c = P(ox + 70, 112), o = P(ox + 70, 58), nAt = P(ox + 128, 142), ca = P(ox + 12, 142);
      let t = '';
      t += atom(ca.x, ca.y, 'Cα', { });
      t += atom(c.x, c.y, 'C', { kind: 'hi' });
      t += atom(o.x, o.y, 'O', { });
      t += atom(nAt.x, nAt.y, 'N', { kind: 'hi' });
      t += bond(ca, c);
      t += bond(c, o, { order: dbl ? 1 : 2 });
      t += bond(c, nAt, { order: dbl ? 2 : 1 });
      if (dbl) {
        t += text(o.x + 26, o.y - 4, '−', { cls: 'fg-lbl', size: 13 });
        t += text(nAt.x + 24, nAt.y - 12, '+', { cls: 'fg-lbl', size: 13 });
      } else {
        t += lonePair(nAt.x, nAt.y, 20);
      }
      return t;
    };
    s += draw(30, false);
    s += draw(400, true);
    s += curve(P(190, 136), P(130, 84), { bow: 26 });
    s += arrow(P(250, 112), P(330, 112));
    s += text(290, 100, 'resonance', { cls: 'fg-tag', size: 10.5 });
    s += text(160, 188, 'the lone pair is donated', { cls: 'fg-sm', size: 10 });
    s += text(530, 188, 'C–N is partly double', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(34, 214, 726, 214);
    const cons = [
      ['planar and rigid', 'six atoms in one plane; no free rotation'],
      ['nitrogen is not basic', 'that lone pair is already spent'],
      ['least reactive acyl derivative', 'hydrolysis wants hot acid or an enzyme'],
    ];
    cons.forEach((c, i) => {
      const cx = 150 + i * 230;
      s += text(cx, 246, c[0], { cls: 'fg-lbl', size: 12 });
      s += text(cx, 266, c[1], { cls: 'fg-sm', size: 10 });
    });
    s += text(380, 298, 'Three separate exam questions, one cause.', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'The second resonance structure of an amide, and what follows from it. Pushing the nitrogen lone pair into the carbonyl gives the C–N bond partial double-bond character, and planarity, low basicity and low reactivity all fall out of that one move.',
  note: 'The basicity consequence is the one that inverts against intuition. A lone pair on nitrogen looks like a base, and here it is the reason the nitrogen is not one — delocalization makes a lone pair less available, not more.',
});

/* ----------------------------------------------------------------- 12 ---
   Why one double bond changes the melting point by tens of degrees. This is
   a claim about SHAPE, which prose can assert and a drawing can show: three
   C18 chains, same length, drawn as they pack. */
FIGURES.push({
  id: 'chain-packing',
  section: 'lipids',
  anchor: '<h3>Triglycerides are triesters</h3>',
  viewBox: '0 0 700 380',
  alt: 'Three panels of C18 fatty acid chains: straight saturated chains packed close together, cis chains bent into a V at the double bond so they cannot touch, and trans chains that carry a double bond and stay straight',
  build() {
    let s = '';
    /* A chain as a list of BOND ANGLES, in degrees, y down. Two consecutive
       bonds differ by exactly 60 degrees, which is what makes every vertex a
       120 degree carbon — including the two sp2 carbons of a double bond.
       (The version this replaces walked an axis and then dropped the double
       bond in vertically, which left the alkene carbons with 180 degree
       bonds: the cis/trans geometry the whole figure exists to contrast was
       not actually drawn, and a viewer could not read it off the picture.) */
    const L = 25.5;
    const walk = (x, y, angles, dbl) => {
      let t = '', cx = x, cy = y;
      angles.forEach((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const nx = cx + Math.cos(a) * L, ny = cy + Math.sin(a) * L;
        t += bond(P(cx, cy), P(nx, ny), i === dbl
          ? { rFrom: 0, rTo: 0, order: 2, gap: 3.4 }
          : { rFrom: 0, rTo: 0 });
        cx = nx; cy = ny;
      });
      return t;
    };
    /* Straight chain: 60 and 120 alternating, so the chain axis is vertical.
       Put the double bond on bond 3 and the pattern carries straight on —
       the two chain halves end up on OPPOSITE sides of the C=C, which is
       what trans means. */
    const SAT  = [60, 120, 60, 120, 60, 120, 60];
    const TRANS = SAT;
    /* Cis: same first four bonds, then 180 instead of 60, which puts the two
       halves on the SAME side of the C=C. Everything after it is the same
       zigzag, tilted 60 degrees off the axis it started on — the kink. */
    const CIS  = [60, 120, 60, 120, 180, 120, 180];

    const col = (ox, title, sub, mp, kind, draw) => {
      s += panel(ox, 44, 214, 242, { kind });
      s += tag(ox + 107, 32, title);
      draw(ox);
      s += text(ox + 107, 304, sub, { cls: 'fg-sm' });
      s += text(ox + 107, 326, mp, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', size: 11 });
    };

    // Saturated: four chains, as close together as the drawing can put them.
    col(8, 'saturated (stearic, 18:0)', 'they lie flat against each other', 'mp 69 °C', null, (ox) => {
      for (let j = 0; j < 4; j++) s += walk(ox + 34 + j * 30, 70, SAT, -1);
    });

    // Cis: the chain leaves the double bond on the side it arrived on, so it
    // runs off at 60 degrees to the half above it. Three chains, set further
    // apart, because a bent chain cannot lie against its neighbour.
    col(238, 'one cis double bond (oleic)', 'the kink breaks the contact', 'mp 13 °C', 'warn', (ox) => {
      for (let j = 0; j < 3; j++) s += walk(ox + 82 + j * 52, 70, CIS, 3);
    });

    // Trans: it leaves on the opposite side, so the zigzag carries on. Same
    // C18, same one double bond, and the stack survives.
    col(468, 'one trans double bond (elaidic)', 'still essentially straight', 'mp 44 °C', null, (ox) => {
      for (let j = 0; j < 4; j++) s += walk(ox + 34 + j * 30, 70, TRANS, 3);
    });

    s += rule(20, 342, 680, 342);
    s += label(345, 364, 'All three are C18 — only the shape differs, and shape is what a melting point reads.');
    return s;
  },
  caption: 'Three eighteen-carbon fatty acids, drawn as they pack. Chain length is held constant, so the fifty-six degrees between stearic and oleic acid is entirely the bend that one cis double bond puts in the middle of the chain.',
  note: 'The trans column is what makes the rule precise. Elaidic acid is exactly as unsaturated as oleic acid and melts thirty degrees higher, because a trans double bond leaves the chain straight. “Unsaturated means low melting” is a shortcut that stops working the moment partial hydrogenation is in the room.',
});

/* ----------------------------------------------------------------- 13 ---
   The three parts and the two links. Built in order, the vocabulary stops
   needing to be memorized: nucleoside is the first two, nucleotide is all
   three, and both links are reactions the reader already has. */
FIGURES.push({
  id: 'nucleotide-parts',
  section: 'nucleic-acids',
  anchor: '<h3>The bases, in two families</h3>',
  viewBox: '0 0 760 300',
  alt: 'A nucleotide assembled from phosphate, sugar and base, showing the phosphate ester and N-glycoside links and where nucleoside and nucleotide begin',
  build() {
    let s = '';
    const box = (x, w, title, sub, kind) => {
      s += panel(x, 74, w, 76, { kind });
      s += text(x + w / 2, 108, title, { cls: 'fg-lbl', size: 12.5 });
      s += text(x + w / 2, 130, sub, { cls: 'fg-sm', size: 10 });
    };
    box(40, 170, 'phosphate', 'at the 5′ OH', 'warn');
    box(280, 200, 'sugar', 'ribose or 2-deoxyribose', null);
    box(560, 160, 'base', 'purine or pyrimidine', null);

    s += rule(210, 112, 280, 112);
    s += text(245, 100, 'ester', { cls: 'fg-tag', size: 10.5 });
    s += rule(480, 112, 560, 112);
    s += text(520, 100, 'N-glycoside', { cls: 'fg-tag', size: 10.5 });
    s += text(520, 138, 'at C1′, the anomeric carbon', { cls: 'fg-sm', size: 9.5 });

    s += rule(280, 176, 720, 176);
    s += text(500, 196, 'nucleoside', { cls: 'fg-tag-good', size: 11 });
    s += rule(40, 216, 720, 216);
    s += text(380, 236, 'nucleotide', { cls: 'fg-tag-good', size: 11 });

    s += rule(34, 256, 726, 256);
    s += text(380, 280, 'One phosphate is the entire difference between the two words.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'A nucleotide, assembled in the order that makes the names obvious. Sugar plus base is a nucleoside; adding the 5′ phosphate makes it a nucleotide, and the polymer is built by esterifying that phosphate to the 3′ OH of the next sugar.',
  note: 'Neither link is new. The base–sugar bond is an acetal formed at the anomeric carbon with nitrogen as the nucleophile, which is why warm aqueous acid cuts it and base does not; the backbone is two ester bonds to one phosphorus, which is all a phosphodiester is.',
});






/* ----------------------------------------------------------------- B1 ---
   The 15 kJ/mol is the one number in the section that is measured rather
   than asserted, and the argument behind it is a subtraction the prose asks
   the reader to perform in their head: double one heat of hydrogenation,
   compare it with another, and read the shortfall. Three bars do the
   subtraction on the page. */
FIGURES.push({
  id: 'delocalization-energy',
  section: 'conjugated-systems',
  anchor: '<h3>s-cis and s-trans: a conformation, not a configuration</h3>',
  alt: 'Heats of hydrogenation compared as bars: but-1-ene 127, penta-1,4-diene 254, buta-1,3-diene 239 kilojoules per mole, with the 15 kilojoule shortfall marked',
  viewBox: '0 0 760 356',
  build() {
    let s = '';
    // 1.7 px per kJ/mol, all three bars from the same origin, so the only
    // thing the eye has to compare is length.
    const x0 = 200, k = 1.7;
    const rows = [
      { y: 96,  name: 'But-1-ene',       sub: 'one C=C',              kJ: 127, kind: 'hi',   note: '' },
      { y: 166, name: 'Penta-1,4-diene', sub: 'two isolated C=C',     kJ: 254, kind: 'hi',   note: 'exactly twice 127 \u2014 the double bonds never meet' },
      { y: 236, name: 'Buta-1,3-diene',  sub: 'two conjugated C=C',   kJ: 239, kind: 'good', note: 'less heat out, so it started further down' },
    ];
    s += tag(430, 46, 'heat released on hydrogenation (kJ/mol)');
    s += rule(20, 62, 700, 62);
    for (const r of rows) {
      const w = r.kJ * k;
      s += label(20, r.y + 2, r.name, { anchor: 'start', size: 12 });
      s += text(20, r.y + 18, r.sub, { cls: 'fg-sm', size: 10, anchor: 'start' });
      s += bar(x0, r.y - 11, w, 22, { kind: r.kind, opacity: 0.34 });
      // The value sits inside its own bar, which keeps every label clear of
      // the vertical reference line at the right-hand end.
      s += text(x0 + w - 14, r.y + 4, `${r.kJ} kJ/mol`, { cls: 'fg-lbl', size: 11.5, anchor: 'end' });
      if (r.note) s += text(x0 + 6, r.y + 30, r.note, { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    }
    // Where two isolated double bonds would have put buta-1,3-diene.
    const xExp = x0 + 254 * k, xAct = x0 + 239 * k;
    s += rule(xExp, 70, xExp, 266);
    s += rule(xAct, 250, xAct, 266);
    s += rule(xAct, 266, xExp, 266);
    s += text((xAct + xExp) / 2, 288, '15 kJ/mol', { cls: 'fg-tag-good', size: 11 });
    /* Two lines: on one, the sentence ran past the right-hand edge of the
       part of the canvas the reading column shows without scrolling. */
    s += text(360, 316, 'The shortfall is the delocalization energy:', { cls: 'fg-lbl', size: 12 });
    s += text(360, 338, 'buta-1,3-diene began 15 kJ/mol lower down.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The measurement behind the claim. Hydrogenating one double bond in but-1-ene gives out 127 kJ/mol, and penta-1,4-diene \u2014 whose two double bonds are insulated from each other \u2014 gives out exactly twice that. Buta-1,3-diene gives out <b>less</b>.',
  note: 'Every bar ends at the same kind of product, a saturated alkane, so a shorter bar can only mean a starting material that was already lower in energy. That is the whole experiment: conjugation is not inferred from the drawing, it is weighed. The C2\u2013C3 bond length of 1.47 \u00c5 is the second, independent measurement of the same thing.',
});

/* ----------------------------------------------------------------- B2 ---
   The section's central surprise is that one flask gives two compounds and
   the ratio flips with temperature. Prose can give the four numbers; it
   cannot put the two products side by side so the reader sees that the
   difference between them is which end of one cation bromide landed on. */
FIGURES.push({
  id: 'diene-capture',
  section: 'diene-addition',
  anchor: '<h3>Why the 1,2-product forms faster</h3>',
  alt: 'The allylic cation from protonating buta-1,3-diene, bromide capturing at C2 or C4 to give 3-bromobut-1-ene or 1-bromobut-2-ene, with the 80:20 and 15:85 ratios at minus 80 and 40 degrees Celsius',
  viewBox: '0 0 760 366',
  build() {
    let s = '';
    // ---- the one intermediate ----
    s += tag(180, 44, 'one allylic cation, two electrophilic ends');
    const c = [P(60, 110), P(140, 110), P(220, 110), P(300, 110)];
    s += bond(c[0], c[1]);
    s += bond(c[1], c[2]);
    s += bond(c[2], c[3]);
    // Partial double-bond character drawn as a dashed line parallel to each
    // of the two delocalized bonds: the charge is shared, so neither bond is
    // honestly a single bond and neither is honestly a double one.
    s += bond(P(140, 96), P(220, 96), { cls: 'fg-dash', rFrom: 14, rTo: 14 });
    s += bond(P(220, 96), P(300, 96), { cls: 'fg-dash', rFrom: 14, rTo: 14 });
    s += atom(c[0].x, c[0].y, 'CH\u2083');
    s += atom(c[1].x, c[1].y, 'CH', { kind: 'warn' });
    s += atom(c[2].x, c[2].y, 'CH');
    s += atom(c[3].x, c[3].y, 'CH\u2082', { kind: 'warn' });
    s += text(140, 76, '\u03b4+', { cls: 'fg-lbl', size: 13 });
    s += text(300, 76, '\u03b4+', { cls: 'fg-lbl', size: 13 });
    ['C1', 'C2', 'C3', 'C4'].forEach((t, i) => s += text(c[i].x, 142, t, { cls: 'fg-sm', size: 10 }));
    s += text(140, 162, 'secondary form:', { cls: 'fg-sm', size: 9.5 });
    s += text(140, 176, 'most of the charge', { cls: 'fg-tag-good', size: 10 });
    s += text(300, 162, 'primary form:', { cls: 'fg-sm', size: 9.5 });
    s += text(300, 176, 'much less', { cls: 'fg-tag', size: 10 });

    // ---- the two captures ----
    s += arrow(P(350, 122), P(430, 92));
    // The lower arrow stops short of the product's bromine, which its head was
    // otherwise landing on top of.
    s += arrow(P(350, 140), P(416, 206));
    s += text(386, 84, 'Br\u207b at C2', { cls: 'fg-tag', size: 10 });
    s += text(350, 216, 'Br\u207b at C4', { cls: 'fg-tag', size: 10, anchor: 'start' });

    // 1,2-product: 3-bromobut-1-ene, CH2=CH-CHBr-CH3
    s += tag(560, 46, '1,2-addition');
    const p = [P(470, 96), P(506, 74), P(542, 96), P(578, 74)];
    s += bond(p[0], p[1], { order: 2, rFrom: 0, rTo: 0 });
    s += bond(p[1], p[2], { rFrom: 0, rTo: 0 });
    s += bond(p[2], p[3], { rFrom: 0, rTo: 0 });
    s += bond(p[2], P(542, 136), { rFrom: 0, rTo: 15 });
    s += atom(542, 136, 'Br');
    s += text(560, 164, '3-bromobut-1-ene', { cls: 'fg-lbl', size: 12 });
    s += text(560, 182, 'monosubstituted terminal alkene', { cls: 'fg-sm', size: 10 });

    // 1,4-product: 1-bromobut-2-ene, BrCH2-CH=CH-CH3
    s += tag(560, 214, '1,4-addition');
    const q = [P(470, 264), P(506, 242), P(542, 264), P(578, 242)];
    s += bond(q[0], q[1], { rFrom: 0, rTo: 0 });
    s += bond(q[1], q[2], { order: 2, rFrom: 0, rTo: 0 });
    s += bond(q[2], q[3], { rFrom: 0, rTo: 0 });
    s += bond(q[0], P(434, 242), { rFrom: 0, rTo: 15 });
    s += atom(434, 242, 'Br');
    s += text(560, 300, '1-bromobut-2-ene', { cls: 'fg-lbl', size: 12 });
    s += text(560, 318, 'disubstituted internal alkene', { cls: 'fg-sm', size: 10 });

    // ---- the ratio, twice ----
    s += tag(196, 214, 'same flask, two temperatures');
    const barW = 240, bx = 110;
    const ratio = (y, temp, pct12) => {
      const w1 = barW * pct12 / 100;
      let t = '';
      t += label(24, y + 4, temp, { anchor: 'start', size: 12 });
      t += bar(bx, y - 9, w1, 18, { kind: 'hi', opacity: 0.34 });
      t += bar(bx + w1, y - 9, barW - w1, 18, { kind: 'warn', opacity: 0.34 });
      /* A label wider than the segment it belongs to is drawn just above the
         bar instead of inside it. Centred on its own segment either way, so
         which share it names stays unambiguous — written inside, the two
         minority figures spilled onto the neighboring color and read as
         labels for it. */
      const put = (cxSeg, segW, txt) => {
        const wide = txt.length * 10.5 * 0.62;
        return text(cxSeg, wide <= segW - 8 ? y + 4 : y - 15, txt, { cls: 'fg-sm', size: 10 });
      };
      t += put(bx + w1 / 2, w1, `${pct12}% 1,2`);
      t += put(bx + w1 + (barW - w1) / 2, barW - w1, `${100 - pct12}% 1,4`);
      return t;
    };
    s += ratio(250, '\u221280 \u00b0C', 80);
    s += ratio(290, '40 \u00b0C', 15);
    s += text(196, 324, 'Same cation \u2014 only the temperature differs.', { cls: 'fg-sm', size: 10 });
    s += text(560, 336, 'Product names are numbered from their own chain,', { cls: 'fg-sm', size: 9.5 });
    s += text(560, 350, 'so C1 of a name is not C1 of the cation above.', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'One protonation, one cation, and then a choice. Bromide can land on C2 or on C4 \u2014 the two carbons the resonance forms put the charge on \u2014 and the two landings give compounds that differ in where the bromine sits and where the surviving double bond ended up.',
  note: 'Note what is <b>not</b> different between the two products: the bromine came from the same bromide and the hydrogen went to C1 in both cases. The double bond looks as though it moved, and it did not; the cation never had a double bond in one fixed place to begin with. The temperature rows are the finding \u2014 the mechanism is identical at both, which is exactly why the next section is about conditions rather than about arrows.',
});

/* ----------------------------------------------------------------- B3 ---
   The prose says "put the allylic cation at the top of an energy diagram
   with two routes down from it" and then does not draw one. The whole
   distinction is a claim about two heights and two depths that do not agree,
   which is the single clearest case in the book for a picture. */
FIGURES.push({
  id: 'kinetic-thermodynamic-wells',
  section: 'kinetic-thermodynamic',
  anchor: '<h3>Where else this appears</h3>',
  alt: 'Energy profile with one intermediate and two routes: a low barrier to a shallow well on the left and a higher barrier to a deeper well on the right',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    // Energy axis.
    s += arrow(P(52, 284), P(52, 46));
    s += text(62, 40, 'free energy', { cls: 'fg-tag', size: 11, anchor: 'start' });

    // The shared starting point, and the level it sits at.
    s += rule(220, 110, 550, 110);
    s += `<path class="fg-bond" fill="none" d="M330 110 C300 110 280 88 250 88 C218 88 202 196 150 196 L100 196"></path>`;
    s += `<path class="fg-bond" fill="none" d="M430 110 C460 110 490 62 520 62 C554 62 580 244 626 244 L678 244"></path>`;
    s += tag(380, 98, 'the allylic cation');

    // Barriers.
    s += text(250, 72, 'lower barrier', { cls: 'fg-tag-good', size: 11 });
    s += text(520, 46, 'higher barrier', { cls: 'fg-tag-warn', size: 11 });

    // Wells, and the comparison between their depths.
    s += rule(150, 196, 630, 196);
    s += rule(630, 196, 630, 244);
    s += text(566, 224, 'deeper', { cls: 'fg-tag-good', size: 10.5, anchor: 'end' });
    s += text(128, 218, '1,2-product', { cls: 'fg-lbl', size: 12 });
    s += text(128, 234, 'terminal alkene', { cls: 'fg-sm', size: 10 });
    s += text(678, 266, '1,4-product', { cls: 'fg-lbl', size: 12, anchor: 'end' });
    s += text(678, 282, 'internal, more substituted', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += tag(380, 272, 'reaction coordinate');

    s += rule(34, 296, 686, 296);
    s += text(186, 318, '\u221280 \u00b0C: no way back out \u2014 the barriers decide', { cls: 'fg-sm', size: 11 });
    s += text(508, 318, '40 \u00b0C: both wells empty back out \u2014 the depths decide', { cls: 'fg-sm', size: 11 });
    return s;
  },
  caption: 'Two routes down from one intermediate, and they disagree. The left route has the lower hill because bromide attacks the carbon carrying more positive charge; the right route ends in the deeper valley because its alkene is more substituted. Neither fact has anything to say about the other.',
  note: 'Temperature does not move a single line on this diagram. It decides only whether the system is allowed to climb back out of the shallow well on the left \u2014 and that is the entire content of "kinetic versus thermodynamic control." Read it as a test you can apply anywhere: if the first step cannot reverse, compare the hills; if it can, compare the valleys and ignore the hills completely.',
});

/* ----------------------------------------------------------------- B4 ---
   Which atoms end up bonded to which. The prose gives the bond arithmetic in
   a sentence and the reader has to reconstruct a ring from it; drawn with the
   diene carbons numbered on both sides, the arithmetic and the regiochemistry
   are the same picture. */
FIGURES.push({
  id: 'da-bond-accounting',
  section: 'diels-alder',
  anchor: '<h3>The diene must be able to reach s-cis</h3>',
  alt: 'An s-cis diene and a dienophile with three curved arrows going round a circle, giving a cyclohexene whose two new sigma bonds and new double bond are marked',
  viewBox: '0 0 760 350',
  build() {
    let s = '';
    // ---- the two partners, stacked the way they have to meet ----
    s += tag(195, 46, 'diene, held s-cis');
    const c1 = P(120, 180), c2 = P(160, 126), c3 = P(230, 126), c4 = P(270, 180);
    /* The second line of each double bond is drawn short and on the inside.
       Full length, it overhung C1 and C4 and crossed the dashed bonds that
       are forming there — which are the two marks the figure exists for. */
    const mid = P(195, 200);
    s += ringDouble(c1, c2, mid);
    s += bond(c2, c3, { rFrom: 0, rTo: 0 });
    s += ringDouble(c3, c4, mid);
    [[c1, 'C1', -18, 8], [c2, 'C2', -4, -14], [c3, 'C3', 4, -14], [c4, 'C4', 18, 8]].forEach(([p, t, dx, dy]) =>
      s += text(p.x + dx, p.y + dy, t, { cls: 'fg-sm', size: 10 }));
    const d1 = P(150, 272), d2 = P(240, 272);
    s += ringDouble(d1, d2, mid);
    s += tag(195, 300, 'dienophile');

    // The two bonds that are forming, drawn as the dashes they are in the
    // transition state rather than as bonds that already exist.
    s += bond(c1, d1, { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
    s += bond(c4, d2, { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });

    // Six electrons, three arrows, head to tail all the way round.
    s += curve(P(140, 153), P(135, 220), { bow: 22 });
    s += curve(P(195, 272), P(255, 222), { bow: 24 });
    s += curve(P(250, 153), P(197, 128), { bow: 22 });

    s += arrow(P(330, 200), P(400, 200));
    s += text(365, 186, 'one step', { cls: 'fg-tag', size: 10.5 });

    // ---- the product, with the same four carbons still numbered ----
    const r = 62, cx = 570, cy = 196, v = [];
    for (let i = 0; i < 6; i++) {
      const a = (-90 + i * 60) * Math.PI / 180;
      v.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
    // v5 v0 v1 v2 = diene C1 C2 C3 C4; v3 v4 = the dienophile carbons.
    s += bond(v[5], v[0], { rFrom: 0, rTo: 0 });
    s += ringDouble(v[0], v[1], P(cx, cy));
    s += bond(v[1], v[2], { rFrom: 0, rTo: 0 });
    s += bond(v[3], v[4], { rFrom: 0, rTo: 0 });
    s += bond(v[2], v[3], { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
    s += bond(v[4], v[5], { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
    for (const p of v) s += atom(p.x, p.y, '', { kind: 'point' });
    s += text(cx, 104, 'the new \u03c0 bond, C2 to C3', { cls: 'fg-tag-good', size: 10.5 });
    s += text(v[5].x - 26, v[5].y + 4, 'C1', { cls: 'fg-sm', size: 10 });
    s += text(v[0].x, v[0].y - 14, 'C2', { cls: 'fg-sm', size: 10 });
    s += text(v[1].x + 26, v[1].y + 4, 'C3', { cls: 'fg-sm', size: 10 });
    s += text(v[2].x + 26, v[2].y + 4, 'C4', { cls: 'fg-sm', size: 10 });
    s += text(cx, 290, 'the two new \u03c3 bonds', { cls: 'fg-tag-good', size: 11 });

    s += rule(34, 312, 686, 312);
    s += text(348, 334, 'Three \u03c0 bonds in; two \u03c3 bonds and one \u03c0 bond out \u2014 so it runs downhill unaided.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The whole reaction as one circle of six electrons. The diene\u2019s C1 and C4 reach the two ends of the dienophile, the arrows chase each other head to tail round the ring, and every bond that breaks and every bond that forms does so in the same instant.',
  note: 'Keep the numbering in view and the product is never a guess. C1 and C4 are where the new single bonds appear, so the new double bond has nowhere to be except between C2 and C3 \u2014 the bond that was single in the starting diene. And because the two new bonds form at once on one face of the dienophile, nothing has a chance to rotate in between, which is where the stereospecificity below comes from.',
});

/* ----------------------------------------------------------------- B5 ---
   The table gives four wavelengths; what the section is really claiming is
   that they march in one direction and eventually cross into visible light.
   A number line says both at once, and puts the 200 nm instrument limit and
   the 400 nm color threshold on the same axis as the data. */
FIGURES.push({
  id: 'lambda-ladder',
  section: 'uv-vis',
  anchor: '<h3>Why conjugation eventually produces color</h3>',
  alt: 'A wavelength axis from 150 to 500 nanometers marking ethene at 171, buta-1,3-diene at 217, hexa-1,3,5-triene at 258 and beta-carotene near 450, with the visible region beginning at 400',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    /* The axis stops short of the canvas edge on purpose: drawn to 700 the
       500 tick and the label under the visible band were both behind the
       reading column's horizontal scroll. */
    const x = (nm) => 40 + ((nm - 150) / 350) * 620;

    // The two regions that bound the useful range.
    s += bar(x(150), 200, x(200) - x(150), 20, { kind: 'warn', opacity: 0.26, r: 4 });
    s += bar(x(400), 200, x(500) - x(400), 20, { kind: 'good', opacity: 0.26, r: 4 });

    s += rule(x(150), 220, x(500), 220);
    for (let nm = 150; nm <= 500; nm += 50) {
      s += rule(x(nm), 220, x(nm), 227);
      s += text(x(nm), 242, String(nm), { cls: 'fg-sm', size: 10 });
    }
    s += tag(340, 268, 'wavelength absorbed, \u03bb\u2098\u2090\u2093 (nm)');

    // Three lines per compound, then the stem starts below them: a stem drawn
    // from the label down to the axis otherwise runs straight through its own
    // caption, which reads as a struck-out word.
    const marks = [
      { nm: 171, y: 100, name: 'Ethene',            n: '1 conjugated C=C' },
      { nm: 217, y: 146, name: 'Buta-1,3-diene',    n: '2' },
      { nm: 258, y: 100, name: 'Hexa-1,3,5-triene', n: '3' },
      { nm: 450, y: 100, name: '\u03b2-Carotene',   n: '11' },
    ];
    for (const m of marks) {
      s += rule(x(m.nm), m.y + 20, x(m.nm), 200);
      s += text(x(m.nm), m.y, m.name, { cls: 'fg-lbl', size: 12 });
      s += text(x(m.nm), m.y - 21, `${m.nm} nm`, { cls: 'fg-tag-good', size: 11 });
      s += text(x(m.nm), m.y + 14, m.n, { cls: 'fg-sm', size: 9.5 });
    }

    // The two band labels sit inside their bands, clear of the stems.
    s += text(x(175), 214, 'out of range', { cls: 'fg-tag-warn', size: 10 });
    s += text(x(455), 214, 'visible region', { cls: 'fg-tag-good', size: 10.5 });
    s += text(x(175), 268, 'a lone C=C absorbs here', { cls: 'fg-sm', size: 10 });
    s += text(x(450), 268, 'here the compound has a color', { cls: 'fg-sm', size: 10 });

    s += rule(20, 286, 670, 286);
    s += text(345, 308, 'Each double bond added to the conjugation narrows the gap, so \u03bb\u2098\u2090\u2093 moves right.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The four compounds from the table, placed on the axis they actually differ along. An isolated double bond absorbs off the left-hand end of the accessible range; each double bond joined to the conjugation moves the absorption to the right, and with eleven of them \u03b2-carotene has walked all the way into visible light.',
  note: 'The two shaded bands are why this technique is a conjugation detector rather than a general one. Below about 200 nm an ordinary instrument cannot look, so a lone alkene is invisible; past 400 nm the molecule is removing visible light and the compound has a color \u2014 \u03b2-carotene absorbs blue near 450 nm, which is why what reaches your eye is orange. A colorless organic compound is a compound whose \u03c0 system stopped short of the right-hand band.',
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

/* ------------------------------------------------------------------ C4 ---
   One alkyne, three sets of conditions, three different answers - two of
   which are stereoisomers. The prose can say "opposite geometries"; only a
   drawing says which two atoms ended up on which side. */
FIGURES.push({
  id: 'alkyne-three-ways',
  section: 'hydrogenation',
  anchor: '<h3>Heats of hydrogenation, as a measuring tool</h3>',
  alt: 'An internal alkyne reduced three ways: Lindlar to the cis alkene, sodium in ammonia to the trans alkene, and excess hydrogen over palladium on carbon to the alkane',
  viewBox: '0 0 760 390',
  build() {
    let s = '';
    // The starting alkyne, on the left, level with the middle branch.
    s += tag(150, 152, 'one internal alkyne');
    const a1 = P(126, 196), a2 = P(192, 196);
    s += bond(P(66, 196), a1, { rTo: 0 });
    s += bond(a1, a2, { order: 3, rFrom: 0, rTo: 0, gap: 4.5 });
    s += bond(a2, P(258, 196), { rFrom: 0 });
    s += atom(66, 196, 'R');
    s += atom(258, 196, 'R\u2032', { size: 11 });

    /* A bus and three stubs rather than a fan. Fanned out from one point the
       upper and lower arrows cut diagonally across the band the branch
       captions occupy, and two of the captions were struck through by a line
       and one product's H sat on top of another. Kept to x = 300..384,
       nothing the branches say has an arrow through it. */
    s += bond(P(276, 196), P(300, 196), { rFrom: 0, rTo: 0, cls: 'fg-arrow' });
    s += bond(P(300, 96), P(300, 296), { rFrom: 0, rTo: 0, cls: 'fg-arrow' });
    s += arrow(P(300, 96), P(384, 96));
    s += arrow(P(300, 196), P(384, 196));
    s += arrow(P(300, 296), P(384, 296));

    /* An alkene with both R groups up (cis) or one up and one down (trans).
       The two hydrogens are drawn as well, because the claim is about where
       the NEW bonds went, not only about where the R groups sit. */
    const alkene = (cx, cy, trans) => {
      const c1 = P(cx - 30, cy), c2 = P(cx + 30, cy);
      let g = '';
      g += bond(c1, c2, { order: 2, rFrom: 0, rTo: 0 });
      g += bond(c1, P(cx - 68, cy - 28), { rFrom: 0, rTo: 14 });
      g += bond(c1, P(cx - 68, cy + 28), { rFrom: 0, rTo: 13, cls: 'fg-bond-hi' });
      g += bond(c2, P(cx + 68, cy - 28), { rFrom: 0, rTo: trans ? 13 : 14, cls: trans ? 'fg-bond-hi' : 'fg-bond' });
      g += bond(c2, P(cx + 68, cy + 28), { rFrom: 0, rTo: trans ? 14 : 13, cls: trans ? 'fg-bond' : 'fg-bond-hi' });
      g += atom(cx - 68, cy - 28, 'R', { r: 14 });
      g += atom(cx - 68, cy + 28, 'H', { kind: 'hi', r: 13, size: 11 });
      g += atom(cx + 68, cy - 28, trans ? 'H' : 'R\u2032', { kind: trans ? 'hi' : 'plain', r: trans ? 13 : 14, size: 11 });
      g += atom(cx + 68, cy + 28, trans ? 'R\u2032' : 'H', { kind: trans ? 'plain' : 'hi', r: trans ? 14 : 13, size: 11 });
      return g;
    };

    // Branch 1: poisoned surface, syn delivery, cis product.
    s += text(500, 44, 'H\u2082, Lindlar \u2014 Pd/CaCO\u2083, Pb, quinoline', { cls: 'fg-lbl', size: 11.5 });
    s += alkene(500, 96, false);
    s += text(500, 146, 'both new H arrive on one face \u2014 syn addition on a surface', { cls: 'fg-sm', size: 10 });
    s += text(638, 68, 'cis (Z)', { cls: 'fg-tag-good', size: 11 });

    // Branch 2: dissolving metal, no surface, trans product.
    s += alkene(500, 196, true);
    s += text(500, 254, 'Na in NH\u2083(l) \u2014 no surface, radical anion route', { cls: 'fg-lbl', size: 11.5 });
    s += text(638, 168, 'trans (E)', { cls: 'fg-tag-good', size: 11 });

    // Branch 3: straight past the alkene.
    s += text(500, 286, 'H\u2082 in excess, Pd/C \u2014 nothing stops it', { cls: 'fg-lbl', size: 11.5 });
    s += label(500, 318, 'R\u2013CH\u2082\u2013CH\u2082\u2013R\u2032', { size: 14 });
    s += text(638, 318, 'alkane', { cls: 'fg-tag-warn', size: 11 });

    s += rule(30, 332, 700, 332);
    s += text(356, 354, 'The alkyne does not choose. The conditions do \u2014', { cls: 'fg-lbl', size: 12 });
    s += text(356, 376, 'and two of these choices are stereoisomers.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The same internal alkyne, three sets of conditions. Lindlar and sodium in ammonia both stop at the alkene and hand you <b>opposite geometries</b>; ordinary Pd/C does not stop at the alkene at all.',
  note: 'The split comes from where the hydrogens are delivered. Lindlar is a deliberately poisoned surface, and an alkene lying against a surface can only be reached from the face touching it, so both hydrogens arrive on that face and the product is cis. Sodium in ammonia never uses a surface: it adds an electron, then a proton, twice over, and the geometry is fixed at the <i>vinyl anion</i> formed by the second electron transfer, which is configurationally stable and sits with its two R groups apart. The radical before it inverts far too fast to decide anything. Same two hydrogens, same alkyne, opposite answers.',
});

/* ------------------------------------------------------------------ C5 ---
   The most examinable pair in the section is a claim about faces, and a face
   is the one thing a sentence cannot draw. Two routes from one alkene, with
   the stereochemistry shown as wedges and hashes rather than only named. */
FIGURES.push({
  id: 'syn-anti-diol',
  section: 'alkene-oxidation',
  anchor: 'and why that work won a Nobel Prize.</div>',
  alt: 'One alkene giving a syn diol with osmium tetroxide and an anti diol by way of the epoxide, drawn with wedges and hashes',
  viewBox: '0 0 760 372',
  build() {
    let s = '';
    // The shared starting alkene.
    s += tag(380, 36, 'one alkene');
    const c1 = P(350, 78), c2 = P(410, 78);
    s += bond(c1, c2, { order: 2, rFrom: 0, rTo: 0 });
    s += bond(c1, P(312, 52), { rFrom: 0, rTo: 14 });
    s += bond(c1, P(312, 104), { rFrom: 0, rTo: 13 });
    s += bond(c2, P(448, 52), { rFrom: 0, rTo: 14 });
    s += bond(c2, P(448, 104), { rFrom: 0, rTo: 13 });
    s += atom(312, 52, 'R', { r: 14 });
    s += atom(312, 104, 'H', { r: 13, size: 11 });
    s += atom(448, 52, 'R', { r: 14 });
    s += atom(448, 104, 'H', { r: 13, size: 11 });

    s += arrow(P(320, 128), P(232, 190));
    s += arrow(P(440, 128), P(528, 190));
    s += text(150, 140, 'OsO\u2084, then NaHSO\u2083', { cls: 'fg-lbl', size: 11.5 });
    s += text(150, 158, 'one cyclic osmate ester, so both', { cls: 'fg-sm', size: 10 });
    s += text(150, 174, 'oxygens are delivered at once', { cls: 'fg-sm', size: 10 });
    s += text(612, 140, 'mCPBA, then H\u2083O\u207A', { cls: 'fg-lbl', size: 11.5 });
    s += text(612, 158, 'the epoxide is opened by attack', { cls: 'fg-sm', size: 10 });
    s += text(612, 174, 'from the opposite face', { cls: 'fg-sm', size: 10 });

    /* The products. Each carbon keeps its R group; the OH and the H go on
       wedges and hashes, which is the only part of the drawing carrying the
       claim. `anti` flips the right-hand carbon and nothing else. */
    const diol = (cx, cy, anti) => {
      const a = P(cx - 32, cy), b = P(cx + 32, cy);
      let g = '';
      g += bond(a, b, { rFrom: 0, rTo: 0 });
      g += wedge(a, P(cx - 32, cy - 46), { rFrom: 0, rTo: 16 });
      g += hash(a, P(cx - 32, cy + 46), { rFrom: 0, rTo: 13 });
      // Anti flips nothing but the wedges on the right-hand carbon: the OH
      // stays drawn at the top, and it is toward the reader or away from it
      // that carries the stereochemistry.
      if (anti) {
        g += hash(b, P(cx + 32, cy - 46), { rFrom: 0, rTo: 16 });
        g += wedge(b, P(cx + 32, cy + 46), { rFrom: 0, rTo: 13 });
      } else {
        g += wedge(b, P(cx + 32, cy - 46), { rFrom: 0, rTo: 16 });
        g += hash(b, P(cx + 32, cy + 46), { rFrom: 0, rTo: 13 });
      }
      g += bond(a, P(cx - 80, cy + 26), { rFrom: 0, rTo: 14 });
      g += bond(b, P(cx + 80, cy + 26), { rFrom: 0, rTo: 14 });
      g += atom(cx - 80, cy + 26, 'R', { r: 14 });
      g += atom(cx + 80, cy + 26, 'R', { r: 14 });
      g += atom(cx - 32, cy - 46, 'OH', { kind: 'hi', r: 16, size: 10.5 });
      g += atom(cx + 32, cy - 46, 'OH', { kind: 'hi', r: 16, size: 10.5 });
      g += atom(cx - 32, cy + 46, 'H', { r: 13, size: 11 });
      g += atom(cx + 32, cy + 46, 'H', { r: 13, size: 11 });
      return g;
    };

    s += diol(190, 252, false);
    s += diol(570, 252, true);
    s += text(190, 322, 'syn (cis) diol', { cls: 'fg-tag-good', size: 11.5 });
    s += text(570, 322, 'anti (trans) diol', { cls: 'fg-tag-good', size: 11.5 });
    s += text(190, 342, 'both OH toward the reader \u2014 same face', { cls: 'fg-sm', size: 10 });
    s += text(570, 342, 'one wedge, one hash \u2014 opposite faces', { cls: 'fg-sm', size: 10 });
    s += rule(30, 356, 730, 356);
    return s;
  },
  caption: 'One alkene, two diols, and the same molecular formula in both products. The only difference is which face each hydroxyl arrived on &mdash; osmium delivers both oxygens together from one face, while the epoxide route delivers the second one from the other side.',
  note: 'Read it off the wedges rather than off the names. Osmium tetroxide forms a five-membered osmate ester spanning both carbons, so the two oxygens are tied to the same face before the ring is ever cut off; there is no step at which they could end up anywhere else. Epoxidation then hydrolysis has an extra step, and that step is what flips the answer: water attacks the protonated epoxide from the side opposite the C&ndash;O bond that is breaking, which is the same backside attack an S<sub>N</sub>2 makes.',
});

/* ------------------------------------------------------------------ D1 ---
   Three cuts at one carbon. The worked example says there are three valid
   disconnections at the carbinol carbon and that having several right
   answers is normal; that is a claim about a molecule's shape, and a reader
   who has never drawn a disconnection cannot see it in the name
   "2-phenylbutan-2-ol". Drawn side by side, the three cuts and the three
   different pairs of bottles they call for are one glance. */
FIGURES.push({
  id: 'three-disconnections',
  section: 'retrosynthesis',
  anchor: '<h3>Knowing when to stop</h3>',
  alt: 'The three carbon-carbon disconnections at the carbinol carbon of 2-phenylbutan-2-ol, each giving a different Grignard and ketone pair',
  viewBox: '0 0 760 376',
  build() {
    let s = '';
    s += tag(380, 28, '2-phenylbutan-2-ol \u2014 three C\u2013C bonds meet the carbinol carbon');

    // The target. The carbinol carbon is highlighted because every cut
    // below is a cut to it; the OH is drawn but never cut, since no
    // C-OH bond is made by an interconversion, not by joining two fragments.
    const c = P(380, 104);
    s += bond(c, P(380, 54));
    s += bond(c, P(300, 104));
    s += bond(c, P(470, 104), { rTo: 24 });
    s += bond(c, P(380, 158));
    s += atom(380, 54, 'OH');
    s += atom(300, 104, 'Ph');
    // The disc has to be big enough for six characters at the size the
    // stylesheet actually renders a label at, which is not the size the
    // drawing kit was asked for.
    s += atom(470, 104, 'CH\u2082CH\u2083', { r: 24 });
    s += atom(380, 158, 'CH\u2083');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });

    // The cut marks, drawn across the bonds rather than through the atoms.
    s += bond(P(340, 84), P(340, 124), { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
    s += bond(P(418, 84), P(418, 124), { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
    s += bond(P(358, 131), P(402, 131), { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
    s += tag(340, 76, 'a');
    s += tag(418, 76, 'c');
    // b goes on the far side of its own mark: directly under c's dashes it
    // read as a second label for c.
    s += tag(346, 136, 'b');

    s += rule(30, 178, 700, 178);
    s += text(380, 200, '\u21D2   reads \u201Ccould be made from\u201D', { cls: 'fg-tag', size: 12 });

    /* Three columns inside the left 90% of the canvas. At 224 wide starting
       at 512 the third panel's own border, and the pair of reagents in it,
       were past the edge of what the reading column shows. */
    const col = (x, cut, synthons, equivs) => {
      const cx = x + 105;
      s += panel(x, 212, 210, 124);
      s += tag(cx, 236, cut);
      s += text(cx, 258, 'synthons', { cls: 'fg-sm', size: 9.5 });
      s += label(cx, 278, synthons, { size: 11 });
      s += text(cx, 302, 'synthetic equivalents', { cls: 'fg-sm', size: 9.5 });
      s += text(cx, 324, equivs, { cls: 'fg-tag-good', size: 11 });
    };
    col(18,  'cut a', 'Ph\u207B  +  CH\u2083COCH\u2082CH\u2083', 'PhMgBr + butan-2-one');
    col(244, 'cut b', 'CH\u2083\u207B  +  PhCOCH\u2082CH\u2083', 'CH\u2083MgBr + propiophenone');
    col(470, 'cut c', 'CH\u2083CH\u2082\u207B  +  PhCOCH\u2083', 'CH\u2083CH\u2082MgBr + acetophenone');

    s += text(350, 362, 'All three are the same disconnection. Only the shopping list differs.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'One target, cut three ways. Every bond from the carbinol carbon to a carbon is a Grignard disconnection, so 2-phenylbutan-2-ol has three complete one-step routes and no rule of chemistry picks between them \u2014 availability does.',
  note: 'The bond to OH is not on the list, and that is the discipline the whole method rests on: a cut is only a disconnection if you can name the forward reaction that makes it. Not because nothing makes a C&ndash;O bond &mdash; hydration, hydroboration and an S<sub>N</sub>2 on a halide all do &mdash; but because those are functional group interconversions rather than ways of joining two pieces. A disconnection is for bonds that assemble the skeleton, and this one does not.',
});

/* ------------------------------------------------------------------ D2 ---
   The three attachment points around a carbonyl. The prose lists them as
   three bullets and calls keeping them straight "worth doing explicitly",
   which is exactly the admission that a list is the wrong form: the claim
   is geometric -- at, next to, two along -- and the reader needs to see the
   same skeleton with the bond arriving in three different places. */
FIGURES.push({
  id: 'carbonyl-three-sites',
  section: 'carbon-carbon-bonds',
  anchor: '<h3>Where the new bond can go relative to a carbonyl</h3>',
  alt: 'The same carbonyl skeleton with a new carbon-carbon bond forming at the carbonyl carbon, at the alpha carbon and at the beta carbon',
  viewBox: '0 0 760 344',
  build() {
    let s = '';
    /* One skeleton per panel: beta, alpha, carbonyl carbon, R. Panels 1 and 2
       are the same saturated ketone on purpose -- the difference between them
       is entirely the reagent, which is the point. */
    const skeleton = (cx, enone, hi) => {
      const b = P(cx - 66, 150), a = P(cx - 16, 178), k = P(cx + 34, 150);
      let g = '';
      g += bond(b, a, { order: enone ? 2 : 1 });
      g += bond(a, k);
      g += bond(k, P(cx + 34, 100), { order: 2 });
      g += bond(k, P(cx + 82, 178));
      g += atom(cx + 34, 100, 'O');
      g += atom(cx + 82, 178, 'R');
      /* The highlighted atom is the one the panel is about, not always the
         carbonyl carbon: a panel titled "at the alpha carbon" that rings the
         carbonyl carbon fights its own title. */
      g += atom(b.x, b.y, 'C', hi === 'b' ? { kind: 'hi' } : {});
      g += atom(a.x, a.y, 'C', hi === 'a' ? { kind: 'hi' } : {});
      g += atom(k.x, k.y, 'C', hi === 'k' ? { kind: 'hi' } : {});
      g += text(cx - 66, 124, '\u03B2', { cls: 'fg-lbl', size: 12 });
      g += text(cx - 44, 196, '\u03B1', { cls: 'fg-lbl', size: 12 });
      return g;
    };

    /* The three panels are pulled inside the left 90% of the canvas: at 512
       the third one's border, its R and the reagent line under it were all
       behind the reading column's horizontal scroll. */
    const col = (x, title, enone, reagents, product, hi) => {
      const cx = x + 108;
      s += panel(x, 52, 216, 244);
      s += tag(cx, 40, title);
      s += skeleton(cx, enone, hi);
      s += text(cx, 268, reagents, { cls: 'fg-sm', size: 10 });
      s += text(cx, 288, product, { cls: 'fg-tag-good', size: 10.5 });
      return cx;
    };

    // At the carbonyl carbon: the nucleophile comes in from outside.
    let cx = col(16, 'at the carbonyl carbon', false, 'RMgBr, RLi, \u207BCN, acetylide', 'an alcohol', 'k');
    s += curve(P(cx + 34, 232), P(cx + 34, 172), { bow: 14 });
    s += label(cx + 34, 248, 'Nu\u207B', { size: 12 });

    // At the alpha carbon: the molecule itself is the nucleophile.
    cx = col(240, 'at the \u03B1 carbon', false, 'base first, then RX or a carbonyl', 'alkylation, aldol, Claisen', 'a');
    s += curve(P(cx - 16, 196), P(cx - 16, 230), { bow: 12 });
    s += label(cx - 16, 250, 'E\u207A', { size: 12 });
    s += text(cx, 74, 'base takes an \u03B1 H first', { cls: 'fg-sm', size: 9 });

    // At the beta carbon: only an enone offers this one.
    cx = col(464, 'at the \u03B2 carbon', true, 'enolate + an enone (Michael)', '1,5-dicarbonyl', 'b');
    s += curve(P(cx - 66, 232), P(cx - 66, 172), { bow: 14 });
    s += label(cx - 66, 248, 'Nu\u207B', { size: 12 });

    s += text(350, 326, 'One carbonyl, three carbons to attach to. The reagent chooses which.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The same four atoms three times, with the new C\u2013C bond arriving in a different place each time. A nucleophile lands <b>on</b> the carbonyl carbon; an enolate makes the molecule itself the nucleophile and the bond forms <b>next to</b> it; conjugate addition to an enone lands <b>two carbons out</b>.',
  note: 'The middle panel is the one that reverses direction, and that is why it is easy to lose: in the other two the arrow points into the carbonyl compound, and in the aldol, Claisen and alkylation it points out of it. Note also that only the third panel is drawn with a C=C \u2014 conjugate addition is not an option a plain ketone offers, it is something the conjugation creates.',
});

/* ------------------------------------------------------------------ D3 ---
   The map the section says it is describing. The prose states outright that
   interconversions are "a map with two axes" and then gives a
   twenty-five-row table, which is a list. A reader cannot tell from the
   table that ester, acid and amide are the same height, or that alkene,
   halide and alcohol are -- and that height is the whole diagnostic. */
FIGURES.push({
  id: 'fgi-two-axes',
  section: 'functional-group-interconversion',
  anchor: '<h3>The moves worth knowing cold</h3>',
  alt: 'Functional group interconversions drawn as a grid: an oxidation ladder down the left and substitution moves across each level',
  viewBox: '0 0 760 416',
  build() {
    let s = '';
    s += tag(140, 44, 'up and down: oxidation level');
    s += tag(470, 44, 'across: same level, no redox reagent anywhere');

    // The ladder itself: two arrows, because the reagents differ by direction.
    s += arrow(P(44, 338), P(44, 92));
    s += arrow(P(80, 92), P(80, 338));
    s += tag(44, 80, '[O]');
    s += tag(80, 80, '[H]');

    const levels = [
      { y: 96,  name: 'carboxylic acid' },
      { y: 174, name: 'aldehyde / ketone' },
      { y: 252, name: 'alcohol' },
      { y: 330, name: 'alkane' },
    ];
    for (const l of levels) s += label(96, l.y + 4, l.name, { anchor: 'start', size: 12 });
    s += rule(240, 76, 240, 352);
    s += rule(244, 135, 700, 135);
    s += rule(244, 213, 700, 213);
    s += rule(244, 291, 700, 291);

    // Acid level: the acyl ladder, every step a substitution.
    s += label(252, 100, 'RCO\u2082H', { anchor: 'start', size: 12 });
    s += arrow(P(304, 96), P(348, 96));
    s += text(326, 84, 'SOCl\u2082', { cls: 'fg-sm', size: 9 });
    s += label(358, 100, 'RCOCl', { anchor: 'start', size: 12 });
    s += arrow(P(410, 96), P(454, 96));
    s += text(432, 84, 'R\u2032OH', { cls: 'fg-sm', size: 9 });
    s += label(464, 100, 'RCO\u2082R\u2032', { anchor: 'start', size: 12 });
    s += arrow(P(524, 96), P(568, 96));
    s += text(546, 84, 'R\u2082NH', { cls: 'fg-sm', size: 9 });
    s += label(578, 100, 'RCONR\u2082', { anchor: 'start', size: 12 });

    // Carbonyl level: the acetal, which is a sideways move and a mask.
    s += label(252, 178, 'R\u2082C=O', { anchor: 'start', size: 12 });
    s += arrow(P(312, 168), P(400, 168));
    s += text(356, 158, 'HOCH\u2082CH\u2082OH, H\u207A', { cls: 'fg-sm', size: 9 });
    s += arrow(P(400, 186), P(312, 186), { muted: true });
    s += text(356, 200, 'H\u2083O\u207A', { cls: 'fg-sm', size: 9 });
    s += label(412, 178, 'cyclic acetal', { anchor: 'start', size: 12 });
    s += text(412, 200, 'a sideways move, and a mask', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    // Alcohol level: alkene, halide and alcohol are one height.
    s += label(252, 256, 'R\u2013OH', { anchor: 'start', size: 12 });
    s += arrow(P(300, 252), P(352, 252));
    s += text(330, 240, 'PBr\u2083 or SOCl\u2082', { cls: 'fg-sm', size: 9 });
    s += label(362, 256, 'R\u2013X', { anchor: 'start', size: 12 });
    s += arrow(P(408, 252), P(470, 252));
    s += text(439, 240, 'bulky base (E2)', { cls: 'fg-sm', size: 9 });
    s += label(480, 256, 'alkene', { anchor: 'start', size: 12 });
    /* Started at x=480 while it read "H3O+ or BH3"; naming hydroboration's
       second step makes it long enough to run off the canvas from there. */
    s += text(396, 278, 'and back: H\u2083O\u207A, or BH\u2083 then H\u2082O\u2082/HO\u207B', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    s += label(252, 334, 'R\u2013H', { anchor: 'start', size: 12 });
    s += text(500, 334, 'nothing sideways from here \u2014 the only way out is up', { cls: 'fg-sm', size: 9.5 });

    s += text(380, 374, 'up: PCC, DMP, Jones     \u2022     down: NaBH\u2084, LiAlH\u2084, H\u2082 / Pd', { cls: 'fg-sm', size: 10 });
    s += text(380, 400, 'Every interconversion is one move: up, down, or across.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The table, drawn as the map it is. Height is oxidation level and needs an oxidant or a reductant to change; width is everything else, and costs no redox reagent at all. Asking which direction a step moves tells you which shelf the reagent comes from before you have named it.',
  note: 'The rows are worth reading for what shares a height. Ester, acid chloride, amide and acid are all one level, so interconverting them is substitution and never reduction \u2014 and an alkene, an alkyl halide and an alcohol are also one level, which is why the standard trick for moving an OH along a chain is to eliminate and add back, with no oxidation state changing anywhere in the two steps.',
});

/* ------------------------------------------------------------------ D4 ---
   What orthogonal actually means. The section defines it in a sentence and
   the sentence is not the hard part -- the hard part is believing that a
   reagent can remove one mask from a molecule and leave the other sitting
   there. That is a two-by-two claim, and a two-by-two claim wants a grid. */
FIGURES.push({
  id: 'orthogonal-grid',
  section: 'protecting-groups',
  anchor: '<h3>Orthogonality</h3>',
  alt: 'A grid crossing two protecting groups with two deprotection conditions, showing each condition removes one group and leaves the other',
  viewBox: '0 0 760 316',
  build() {
    let s = '';
    s += tag(380, 26, 'one molecule, two masks, two unrelated keys');

    s += panel(96, 40, 232, 62, { kind: 'hi' });
    s += label(212, 66, 'silyl ether', { size: 12.5 });
    s += text(212, 86, 'put on with TBSCl, imidazole', { cls: 'fg-sm', size: 9.5 });
    s += panel(432, 40, 232, 62, { kind: 'hi' });
    s += label(548, 66, 'cyclic acetal', { size: 12.5 });
    s += text(548, 86, 'put on with HOCH\u2082CH\u2082OH, H\u207A', { cls: 'fg-sm', size: 9.5 });
    s += rule(328, 78, 432, 78);
    s += text(380, 70, 'same molecule', { cls: 'fg-sm', size: 9 });

    s += rule(30, 124, 730, 124);
    s += rule(30, 192, 730, 192);
    s += rule(30, 260, 730, 260);
    s += rule(380, 124, 380, 260);

    s += label(30, 158, 'TBAF', { anchor: 'start', size: 12.5 });
    s += text(30, 174, 'fluoride', { cls: 'fg-sm', anchor: 'start', size: 9.5 });
    s += label(30, 226, 'H\u2083O\u207A', { anchor: 'start', size: 12.5 });
    s += text(30, 242, 'dilute, mild', { cls: 'fg-sm', anchor: 'start', size: 9.5 });

    s += text(212, 154, 'comes off \u2014 the O\u2013H is back', { cls: 'fg-tag-good', size: 11 });
    s += text(212, 174, 'Si\u2013F is exceptionally strong', { cls: 'fg-sm', size: 9.5 });
    s += text(548, 154, 'untouched', { cls: 'fg-tag-mut', size: 11 });
    s += text(548, 174, 'fluoride has nothing to do here', { cls: 'fg-sm', size: 9.5 });

    s += text(212, 222, 'survives if the acid is mild', { cls: 'fg-tag-mut', size: 11 });
    s += text(212, 242, 'harsher acid takes it off', { cls: 'fg-sm', size: 9.5 });
    s += text(548, 222, 'comes off \u2014 the C=O is back', { cls: 'fg-tag-good', size: 11 });
    s += text(548, 242, 'an equilibrium; water reverses it', { cls: 'fg-sm', size: 9.5 });

    s += text(380, 292, 'Each key spares the other mask (keep the acid mild), so they come off in either order.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Orthogonality is this grid having two blanks in it. The fluoride row is selective outright: fluoride has nothing to do with an acetal. The acid row is selective by degree: an acetal hydrolyzes under milder acid than a TBS ether needs, so with the acid kept mild and brief the silyl ether survives, and the molecule can carry both masks at once and be unmasked in whichever order the route needs.',
  note: 'The diagonal is what makes protecting groups plannable rather than a gamble. It also sets the trap the section warns about: because the acetal answers to aqueous acid, it cannot be carried through any later step that needs aqueous acid for its own reasons. And note that the silyl ether in the bottom-left cell is the bulky TBS one \u2014 a trimethylsilyl ether is small enough that mild aqueous acid takes it off too, and the grid would lose its blank. Even TBS only tolerates mild acid: acetic acid in aqueous THF, or HCl in methanol, is a standard way of removing it. Even TBS only tolerates mild acid: acetic acid in aqueous THF, or HCl in methanol, is a standard way of removing it.',
});

/* ------------------------------------------------------------------ D5 ---
   Two reactions, two orders, two different compounds. The section asserts
   that "nitration then bromination and bromination then nitration give
   different products" and leaves the reader to work out both. They are
   constitutional isomers of each other, which is a fact about where the
   substituents sit on a ring -- the one kind of claim a sentence is worst at
   and a drawing settles instantly. */
FIGURES.push({
  id: 'order-sets-pattern',
  section: 'multistep-synthesis',
  anchor: '<h3>Common failures worth recognizing in your own work</h3>',
  alt: 'Nitration then bromination of benzene giving the meta isomer, against bromination then nitration giving the para isomer',
  viewBox: '0 0 760 440',
  build() {
    let s = '';
    const R = 30, D = 58;
    const verts = (cx, cy) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
      }
      return pts;
    };
    /* An aromatic ring drawn the way the prose in this chapter talks about
       it -- as one delocalized ring rather than a fixed Kekule structure,
       since the whole point is that every position is the same until a
       substituent makes it different. */
    const ring = (cx, cy, subs) => {
      const pts = verts(cx, cy);
      let g = '';
      for (let i = 0; i < 6; i++) g += bond(pts[i], pts[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      g += `<circle class="fg-bond" cx="${cx}" cy="${cy}" r="17"></circle>`;
      for (const sb of subs) {
        const a = (-90 + sb.v * 60) * Math.PI / 180;
        const ox = cx + Math.cos(a) * D, oy = cy + Math.sin(a) * D;
        g += bond(pts[sb.v], P(ox, oy), { rFrom: 0, rTo: 15 });
        g += atom(ox, oy, sb.label, { kind: sb.kind || 'plain' });
      }
      return g;
    };

    /* The whole sequence is compressed left. The two product names are the
       answer this figure exists to give, and with the last ring centered at
       636 both of them ran past the right-hand edge of what the reading
       column shows without scrolling. */
    const row = (cy, first, second, mid, product, verdict, kind, drop) => {
      s += ring(130, cy, []);
      s += text(130, cy + 52, 'benzene', { cls: 'fg-sm', size: 9.5 });
      s += arrow(P(188, cy), P(300, cy));
      s += text(244, cy - 14, first, { cls: 'fg-sm', size: 10 });
      s += ring(352, cy, mid.subs);
      s += text(352, cy + 52, mid.name, { cls: 'fg-sm', size: 9.5 });
      s += arrow(P(410, cy), P(506, cy));
      s += text(458, cy - 14, second, { cls: 'fg-sm', size: 10 });
      s += ring(576, cy, product.subs);
      s += label(576, cy + drop, product.name, { size: 12 });
      s += text(576, cy + drop + 18, verdict, { cls: kind, size: 10.5 });
    };

    s += label(30, 126, 'A', { anchor: 'start', size: 15 });
    row(120, 'HNO\u2083, H\u2082SO\u2084', 'Br\u2082, FeBr\u2083',
      { name: 'nitrobenzene', subs: [{ v: 0, label: 'NO\u2082', kind: 'warn' }] },
      { name: '1-bromo-3-nitrobenzene', subs: [{ v: 0, label: 'NO\u2082', kind: 'warn' }, { v: 4, label: 'Br' }] },
      'NO\u2082 directs meta', 'fg-tag-warn', 62);

    s += rule(30, 210, 700, 210);

    s += label(30, 292, 'B', { anchor: 'start', size: 15 });
    row(286, 'Br\u2082, FeBr\u2083', 'HNO\u2083, H\u2082SO\u2084',
      { name: 'bromobenzene', subs: [{ v: 0, label: 'Br' }] },
      { name: '1-bromo-4-nitrobenzene', subs: [{ v: 0, label: 'Br' }, { v: 3, label: 'NO\u2082', kind: 'warn' }] },
      'Br directs ortho, para', 'fg-tag-good', 86);

    s += text(350, 412, 'Same two reactions, opposite order, two different compounds.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Nitration and bromination, run in both orders. The products are constitutional isomers of one another, and nothing about the reagents chose between them \u2014 the group installed <b>first</b> did, because by the time the second electrophile arrives there is already a director on the ring.',
  note: 'Route B is also the faster one, and for the same reason it is the <i>para</i> one: bromine deactivates the ring far less than a nitro group does, so it is route A\u2019s second step that has to be forced. Route B gives some of the <i>ortho</i> isomer alongside the <i>para</i>, and the two are separated. An ordering decision that looks arbitrary therefore settles both the substitution pattern and the rate, which is why \u201Cwhich group goes on first\u201D is usually the whole aromatic synthesis question rather than a detail inside it.',
});


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

/* ----------------------------------------------------------------- 35 ---
   Why one reaction stops at the ketone and the other does not. Both go
   through a tetrahedral intermediate; the difference is entirely whether
   that intermediate can collapse in the flask. */
FIGURES.push({
  id: 'dianion-stops',
  section: 'organolithium-reagents',
  anchor: '<h3>Deprotonation as the goal</h3>',
  viewBox: '0 0 760 320',
  alt: 'The tetrahedral intermediate from an ester, with curved arrows showing the alkoxide pushing back down and the OR group leaving, beside the dianion from a carboxylate where the same two arrows are drawn struck through because they would expel an oxide dianion',
  build() {
    let s = '';
    const col = (ox, title, charges, verdict, kind, out) => {
      s += panel(ox, 42, 330, 172, { kind });
      s += tag(ox + 165, 32, title);
      const c = P(ox + 165, 112);
      s += atom(c.x, c.y, 'C', { kind: kind === 'warn' ? 'warn' : 'hi' });
      s += atom(c.x, c.y - 48, 'O', { });
      s += atom(c.x - 58, c.y + 30, 'O', { });
      s += atom(c.x + 58, c.y + 30, 'R', { });
      s += atom(c.x, c.y + 54, 'R\u2032', { kind: 'hi' });
      s += bond(c, P(c.x, c.y - 48));
      s += bond(c, P(c.x - 58, c.y + 30));
      s += bond(c, P(c.x + 58, c.y + 30));
      s += bond(c, P(c.x, c.y + 54));
      s += text(c.x + 22, c.y - 52, charges[0], { cls: 'fg-lbl', size: 13 });
      s += text(c.x - 80, c.y + 26, charges[1], { cls: 'fg-lbl', size: 13 });
      s += text(c.x + 34, c.y + 62, 'from RLi', { cls: 'fg-sm', size: 9.5 });
      s += text(ox + 165, 202, verdict, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11 });
      s += text(ox + 165, 236, out, { cls: 'fg-sm', size: 10.5 });
    };
    col(24,  'from an ester',      ['−', 'R'], 'collapses in the flask', 'warn',
        'the ketone forms, and is attacked again');
    col(406, 'from a carboxylate', ['−', '−'], 'cannot collapse — two charges', null,
        'the ketone appears only on workup');

    /* The arrows are the argument. Drawn once on the left, where they are
       what happens, and again on the right struck through, where they are
       what would have to happen and cannot. A static pair of structures left
       the reader to supply the collapse from memory. */
    s += curve(P(165, 72), P(180, 96), { bow: 16 });
    s += curve(P(166, 134), P(108, 166), { bow: -16 });

    s += curve(P(547, 72), P(562, 96), { bow: 16, muted: true });
    s += curve(P(548, 134), P(490, 166), { bow: -16, muted: true });
    s += bond(P(542, 96), P(570, 68), { rFrom: 0, rTo: 0 });
    s += bond(P(506, 134), P(542, 162), { rFrom: 0, rTo: 0 });

    s += rule(34, 248, 726, 248);
    s += text(380, 274, 'Nothing protects the ketone in the second case. There is no ketone to protect', { cls: 'fg-lbl', size: 12 });
    s += text(380, 296, 'until the reagent has already been used up.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Why RLi takes a carboxylic acid to a ketone and stops, while a Grignard takes an ester past one. Both add to a carbonyl and both give a tetrahedral intermediate. The ester’s has an alkoxide to expel, so it collapses at once; the carboxylate’s is a dianion, and expelling anything from it would mean pushing charge onto an already charged center.',
  note: 'Two equivalents of RLi are needed here, and they do different jobs: the first is spent taking the acidic O–H proton, and only the second adds. The organolithium is doing something a Grignard cannot, which is attacking a carbonyl that already carries a full negative charge.',
});

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

/* ----------------------------------------------------------------- 37 ---
   A cycle drawn as a cycle. The three step names all describe what happens
   to the palladium, so putting the oxidation state on each arc turns four
   named reactions into one mechanism with a swappable partner. */
FIGURES.push({
  id: 'pd-cycle',
  section: 'cross-coupling',
  anchor: '<h3>The named reactions, by what the partner is</h3>',
  viewBox: '0 0 760 340',
  alt: 'The palladium catalytic cycle with oxidative addition, transmetalation and reductive elimination, and the palladium oxidation state marked on each stage',
  build() {
    let s = '';
    const cx = 300, cy = 164, r = 92;
    const nodes = [
      { ang: -90, lab: 'Pd(0)',        sub: 'the catalyst' },
      { ang:   0, lab: 'Ar–Pd–X', sub: 'Pd(II)' },
      { ang:  90, lab: 'Ar–Pd–R', sub: 'Pd(II)' },
    ];
    const pt = (ang) => P(cx + r * Math.cos(ang * Math.PI / 180), cy + r * Math.sin(ang * Math.PI / 180));
    for (const n of nodes) {
      const p = pt(n.ang);
      s += atom(p.x, p.y, '', { kind: 'point' });
      s += panel(p.x - 52, p.y - 20, 104, 40, { kind: n.ang === -90 ? null : 'hi' });
      s += text(p.x, p.y - 2, n.lab, { cls: 'fg-lbl', size: 12 });
      s += text(p.x, p.y + 14, n.sub, { cls: 'fg-sm', size: 9.5 });
    }
    s += arrow(P(cx + 58, cy - 66), P(cx + 84, cy - 26));
    s += text(cx + 132, cy - 58, 'oxidative addition', { cls: 'fg-tag', size: 10.5 });
    s += text(cx + 132, cy - 42, '0 → II', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(cx + 88, cy + 32), P(cx + 62, cy + 70));
    s += text(cx + 128, cy + 70, 'transmetalation', { cls: 'fg-tag', size: 10.5 });
    s += text(cx + 128, cy + 86, 'II → II', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(cx - 62, cy + 66), P(cx - 62, cy - 26));
    s += text(cx - 128, cy + 22, 'reductive elimination', { cls: 'fg-tag', size: 10.5 });
    s += text(cx - 128, cy + 38, 'II → 0, gives Ar–R', { cls: 'fg-sm', size: 9.5 });

    // The partner column: the only thing the named reactions differ in.
    s += rule(560, 56, 560, 272);
    s += tag(660, 48, 'what the partner is');
    const parts = [
      ['Suzuki', 'boronic acid + base'],
      ['Stille', 'stannane'],
      ['Negishi', 'organozinc'],
      ['Sonogashira', 'alkyne + Cu'],
      ['Heck', 'an alkene — no metal'],
    ];
    parts.forEach((p, i) => {
      const y = 92 + i * 36;
      s += text(600, y, p[0], { cls: 'fg-lbl', anchor: 'start', size: 12 });
      s += text(600, y + 16, p[1], { cls: 'fg-sm', anchor: 'start', size: 9.5 });
    });

    s += rule(34, 292, 726, 292);
    s += text(380, 318, 'Four names, one cycle. The Heck is the exception: no partner metal, so no transmetalation.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The palladium cycle, with the oxidation state on every stage. Pd(0) inserts into the aryl halide and is oxidized to Pd(II); the partner hands over its organic group without changing that; the two groups then join and leave, reducing the metal back to Pd(0).',
  note: 'Ending each turn exactly where it began is what makes palladium a catalyst rather than a reagent, and it is why a few mole percent can turn over thousands of times. It also explains the tolerance: the reactive carbon is bound to a metal for its whole life and never exists as a free carbanion, so ketones, esters and free alcohols elsewhere in the molecule survive.',
});






/* ----------------------------------------------------------------- 42 ---
   One reaction, one question: which group moves. Drawing the two possible
   products from the same ketone makes "read the product backwards to find
   the migrator" something the reader does rather than is told. */
FIGURES.push({
  id: 'which-migrates',
  section: 'baeyer-villiger',
  anchor: '<h3>Rings become lactones</h3>',
  viewBox: '0 0 760 320',
  alt: 'Acetophenone giving phenyl acetate by phenyl migration rather than methyl benzoate by methyl migration',
  build() {
    let s = '';
    s += panel(250, 42, 260, 62, { kind: 'hi' });
    s += text(380, 68, 'Ph–CO–CH₃', { cls: 'fg-lbl', size: 14 });
    s += text(380, 90, 'two groups, one moves', { cls: 'fg-sm', size: 10 });

    s += arrow(P(320, 110), P(200, 150));
    s += arrow(P(440, 110), P(560, 150));

    const out = (cx, formula, name, verdict, kind) => {
      s += panel(cx - 150, 156, 300, 84, { kind });
      s += text(cx, 184, formula, { cls: 'fg-lbl', size: 13.5 });
      s += text(cx, 208, name, { cls: 'fg-sm', size: 10.5 });
      s += text(cx, 232, verdict, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11 });
    };
    out(190, 'Ph–O–CO–CH₃', 'phenyl acetate — the phenyl moved', 'this is what forms', null);
    out(570, 'CH₃–O–CO–Ph', 'methyl benzoate — the methyl moved', 'this does not', 'warn');

    s += rule(34, 258, 726, 258);
    s += text(380, 282, 'Find the inserted oxygen and look at its far side: whatever is there is what migrated.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 304, 'tertiary  >  secondary, benzyl, aryl  >  primary  >  methyl', { cls: 'fg-tag-good', size: 11.5 });
    return s;
  },
  caption: 'Acetophenone gives phenyl acetate, not methyl benzoate. Reading the names tells you which group moved: in phenyl acetate the oxygen sits between the phenyl and the carbonyl, so the phenyl is what migrated onto it and the methyl stayed where it was.',
  note: 'The order is not a separate fact to memorize. Partway through the shift the migrating carbon is electron-poor, so whatever stabilizes a carbocation stabilizes this transition state — same ranking, arriving from a different direction. The practical shortcut: in a methyl ketone the methyl essentially never migrates, so the product is the acetate ester of whatever the other group was.',
});


/* ----------------------------------------------------------------- 43 ---
   Two mechanisms students routinely merge, and the thing that separates
   them is the ORDER of the two steps. Drawn as two tracks running opposite
   ways, the contrast is structural rather than a table to memorize. */
FIGURES.push({
  id: 'snar-vs-benzyne',
  section: 'nucleophilic-aromatic',
  anchor: '<h3>Telling them apart</h3>',
  viewBox: '0 0 760 330',
  alt: 'The SNAr track adding then eliminating through a Meisenheimer complex against the benzyne track eliminating then adding to give two products',
  build() {
    let s = '';
    const track = (y, title, a, b, out, kind) => {
      s += text(24, y - 22, title, { cls: 'fg-tag', anchor: 'start', size: 11 });
      const boxes = [['Ar–X', null], [a, kind], [b, kind], [out, 'ok']];
      boxes.forEach((bx, i) => {
        const x = 24 + i * 176;
        s += panel(x, y, 150, 44, { kind: bx[1] === 'ok' ? null : bx[1] });
        s += text(x + 75, y + 27, bx[0], { cls: 'fg-lbl', size: 11.5 });
        if (i) s += arrow(P(x - 24, y + 22), P(x - 4, y + 22));
      });
    };
    track(58,  'SₙAr — needs an EWG ortho or para', 'add the nucleophile',
          'Meisenheimer anion', 'ONE product', 'hi');
    track(178, 'Benzyne — needs only an ortho H', 'eliminate HX',
          'strained benzyne', 'TWO products', 'warn');

    s += text(400, 122, 'add first, then eliminate', { cls: 'fg-tag-good', size: 10.5 });
    s += text(400, 242, 'eliminate first, then add', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(24, 268, 700, 268);
    s += text(360, 292, 'The two steps are the same two steps, run in opposite orders — and that is what', { cls: 'fg-lbl', size: 12 });
    s += text(360, 314, 'decides whether the nucleophile can land anywhere except where the halide was.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The two routes to a nucleophile on a ring, which are mechanistic opposites. SₙAr adds first, through an anion the withdrawing groups stabilize, so the nucleophile arrives exactly where the halide was. Benzyne eliminates first, and because the strained bond it forms is symmetric, the nucleophile can land on either of two carbons.',
  note: 'Read the substrate before choosing. Withdrawing groups <b>ortho or para</b> to the halide mean SₙAr — a meta group helps only inductively, which is measurable and far too little, because only ortho and para reach the charge by resonance. A bare ring plus NaNH₂ means benzyne. A ring with neither activation nor an ortho hydrogen runs neither, which is the answer people skip past.',
});

/* ----------------------------------------------------------------- 44 ---
   Side-chain oxidation is the most predictable reaction in the section and
   its one exception is what reveals the mechanism, so the figure is three
   substrates with the benzylic C-H circled or absent. */
FIGURES.push({
  id: 'side-chain-cut',
  section: 'benzylic-reactivity',
  anchor: '<h3>Radical bromination, and the reagent that makes it selective</h3>',
  viewBox: '0 0 760 320',
  alt: 'Toluene and propylbenzene both giving benzoic acid with hot permanganate while tert-butylbenzene does not react',
  build() {
    let s = '';
    const row = (y, name, chain, hasH, out, kind) => {
      s += label(24, y + 4, name, { anchor: 'start', size: 12 });
      s += text(210, y + 4, chain, { cls: 'fg-sm', size: 11 });
      s += text(392, y + 4, hasH ? 'yes' : 'none', { cls: hasH ? 'fg-tag-good' : 'fg-tag', size: 11 });
      if (hasH) s += arrow(P(432, y), P(482, y));
      s += text(590, y + 4, out, { cls: kind === 'warn' ? 'fg-tag' : 'fg-lbl', size: 12 });
    };
    s += tag(90, 44, 'substrate');
    s += tag(210, 44, 'side chain');
    s += tag(392, 44, 'benzylic H?');
    s += tag(590, 44, 'hot KMnO₄ gives');
    s += rule(24, 56, 700, 56);
    row(92,  'Toluene',           '–CH₃',            true,  'benzoic acid', null);
    row(142, 'Propylbenzene',     '–CH₂CH₂CH₃', true,  'benzoic acid', null);
    row(192, 'Isopropylbenzene',  '–CH(CH₃)₂',     true,  'benzoic acid', null);
    row(242, 'tert-Butylbenzene', '–C(CH₃)₃',      false, 'no reaction',  'warn');

    s += rule(24, 268, 700, 268);
    s += text(360, 294, 'Chain length is irrelevant — everything past the benzylic carbon is cut away.', { cls: 'fg-lbl', size: 12 });
    s += text(360, 314, 'One hydrogen on the carbon touching the ring is the entire requirement.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Hot permanganate cuts any alkyl side chain back to a single carbon and oxidizes it to a carboxyl, so three different chains give the same benzoic acid. <i>tert</i>-Butylbenzene is the exception, and it is the one that tells you what the mechanism needs.',
  note: 'The ring itself survives conditions that would cleave an isolated alkene without hesitation, which is aromatic stabilization earning its name. Retrosynthetically the reaction is a route rather than a fact: a benzoic acid should make you ask which alkylbenzene it came from, because the oxidation does not care what the chain was and electrophilic substitution cannot deliver a carboxyl directly.',
});

/* ----------------------------------------------------------------- 45 ---
   The pKa numbers only mean something next to each other, and the pair of
   nitrophenols is the whole argument that POSITION beats presence. */
FIGURES.push({
  id: 'phenol-pka-scale',
  section: 'phenols',
  anchor: '<h3>The ring is strongly activated</h3>',
  viewBox: '0 0 760 312',
  alt: 'A pKa scale from 0 to 16 placing ethanol, phenol, the two nitrophenols, picric acid and acetic acid, with the bicarbonate cut marked',
  build() {
    let s = '';
    const x = (p) => 80 + ((16 - p) / 16) * 600;
    s += rule(72, 176, 688, 176);
    for (let p = 0; p <= 16; p += 4) {
      s += rule(x(p), 176, x(p), 183);
      s += text(x(p), 198, String(p), { cls: 'fg-sm', size: 10 });
    }
    s += text(380, 220, 'pKₐ  —  more acidic to the right', { cls: 'fg-tag', size: 11 });

    const mark = (p, name, up, kind) => {
      s += rule(x(p), up ? 96 : 132, x(p), 176);
      s += text(x(p), up ? 88 : 124, name, { cls: kind || 'fg-lbl', size: 11 });
    };
    mark(16,   'ethanol',        true,  null);
    mark(10,   'phenol',         true,  null);
    mark(8.4,  '3-nitro (meta)', false, 'fg-tag');
    mark(7.2,  '4-nitro (para)', true,  'fg-tag-good');
    mark(4.8,  'acetic acid',    false, null);
    mark(0.4,  'picric acid',    true,  null);

    // The bicarbonate cut: everything right of 6.4 is deprotonated by HCO3-.
    s += rule(x(6.4), 56, x(6.4), 176);
    s += text(x(6.4) + 4, 48, 'carbonic acid, 6.4', { cls: 'fg-tag', anchor: 'start', size: 10.5 });
    s += text(x(6.4) + 4, 66, 'NaHCO₃ deprotonates only past here', { cls: 'fg-sm', anchor: 'start', size: 9.5 });

    s += rule(24, 244, 700, 244);
    s += text(360, 268, 'The two nitrophenols are the same group on the same ring,', { cls: 'fg-lbl', size: 12 });
    s += text(360, 290, '1.2 pK\u2090 units apart on position alone.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Where a phenol sits. Six units below an alcohol because the phenoxide delocalizes into the ring, and moved further by substituents — but only by those that can reach the charge. The meta and para nitrophenols differ by 1.2 pKa units with the identical group on the identical ring.',
  note: 'The carbonic acid line is the practical one. Bicarbonate deprotonates anything more acidic than pKa 6.4, which means a carboxylic acid and not a phenol — so shaking a mixture with aqueous NaHCO₃ pulls the acid into the water layer and leaves the phenol behind. That is a pKa table being used rather than recited.',
});

/* ----------------------------------------------------------------- 46 ---
   The substituent rule inverts, and students memorize it as two unrelated
   rows. Drawing the carbanion in each case shows it is one question. */
FIGURES.push({
  id: 'birch-where-charge',
  section: 'birch-reduction',
  anchor: '<h3>Why you would want a 1,4-cyclohexadiene</h3>',
  viewBox: '0 0 760 330',
  alt: 'A donating group pushing the Birch carbanion away from its own carbon and a withdrawing group holding it there, giving opposite diene products',
  build() {
    let s = '';
    const col = (ox, title, sub, charge, verdict, product, kind) => {
      s += panel(ox, 48, 320, 150, { kind });
      s += tag(ox + 160, 36, title);
      s += text(ox + 160, 82, sub, { cls: 'fg-lbl', size: 13 });
      s += text(ox + 160, 112, charge, { cls: 'fg-sm', size: 10.5 });
      s += text(ox + 160, 146, verdict, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11 });
      s += text(ox + 160, 176, product, { cls: 'fg-sm', size: 10.5 });
    };
    col(24,  'donating — OCH₃, CH₃', 'pushes electrons in',
        'so the carbanion goes ELSEWHERE', 'that carbon is never protonated',
        'it stays on a double bond — the 1,4-diene', null);
    col(416, 'withdrawing — COOH, COR', 'pulls electrons out',
        'so the carbanion sits THERE', 'that carbon takes the proton',
        'it comes out sp³ — the 2,5-diene', 'warn');

    s += rule(24, 224, 700, 224);
    s += text(360, 250, 'One question, asked of the intermediate rather than the starting material:', { cls: 'fg-lbl', size: 12 });
    s += text(360, 272, 'where does the carbanion want to be? That carbon gets the proton, and ends up saturated.', { cls: 'fg-lbl', size: 12 });
    s += text(360, 306, 'Neither row has to be memorized once you ask it that way.', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Why the two substituent rules for a Birch reduction are one rule. The reaction alternates electrons and protons, and the carbon that gets the second proton is the one that ends up sp³ — so everything depends on where the carbanion is most stable.',
  note: 'The product is the <b>unconjugated</b> diene in both cases, which is the less stable of the two and the sign that this is kinetic control: protonation happens fastest at the central carbon of the delocalized anion, and stability never gets a vote. The same alternation of electron and proton runs the Na/NH₃ reduction of an alkyne to a <i>trans</i> alkene, back in the alkynes and hydrogenation chapters.',
});

/* ----------------------------------------------------------------- 47 ---
   The point of the section is that one intermediate reaches many products,
   several of which nothing else can. A hub is a picture, not a list. */
FIGURES.push({
  id: 'diazonium-hub-map',
  section: 'diazonium-chemistry',
  anchor: '<h3>Removing a group is a synthetic tool</h3>',
  viewBox: '0 0 760 340',
  alt: 'An aryl diazonium salt at the center with seven reagents radiating out to the chloride, bromide, nitrile, iodide, fluoride, phenol and arene',
  build() {
    let s = '';
    s += panel(286, 142, 190, 56, { kind: 'hi' });
    s += text(381, 168, 'Ar–N₂⁺', { cls: 'fg-lbl', size: 15 });
    s += text(381, 188, 'leaves as N₂ gas', { cls: 'fg-sm', size: 9.5 });

    const spoke = (x, y, reagent, product, anchorSide, novel) => {
      s += text(x, y, reagent, { cls: 'fg-tag', anchor: anchorSide, size: 10.5 });
      s += text(x, y + 17, product, { cls: novel ? 'fg-tag-good' : 'fg-lbl', anchor: anchorSide, size: 11.5 });
    };
    // Left column: the halides that EAS can also reach.
    spoke(246, 62,  'CuCl', 'Ar–Cl', 'end', false);
    spoke(246, 120, 'CuBr', 'Ar–Br', 'end', false);
    spoke(246, 236, 'KI',   'Ar–I',  'end', true);
    // Ar-H is the DELETION row. It is not a group EAS cannot install, so it
    // gets its own marker rather than sharing the "unreachable" one.
    // Right column: the ones it cannot.
    spoke(516, 62,  'CuCN',           'Ar–CN', 'start', true);
    spoke(516, 120, 'HBF₄, heat', 'Ar–F',  'start', true);
    spoke(516, 236, 'H₂O, warm',  'Ar–OH', 'start', true);
    spoke(516, 288, 'H₃PO₂', 'Ar–H',  'start', false);
    s += text(516, 306, 'deletes the substituent', { cls: 'fg-tag', anchor: 'start', size: 9.5 });

    s += arrow(P(282, 156), P(252, 104));
    s += arrow(P(282, 166), P(252, 140));
    s += arrow(P(282, 186), P(252, 224));
    s += arrow(P(480, 156), P(510, 104));
    s += arrow(P(480, 166), P(510, 140));
    s += arrow(P(480, 186), P(510, 224));
    s += arrow(P(480, 196), P(510, 276));

    s += text(170, 288, 'green = unreachable by', { cls: 'fg-tag-good', size: 10.5 });
    s += text(170, 304, 'electrophilic substitution', { cls: 'fg-sm', size: 10 });

    s += rule(24, 326, 700, 326);
    s += text(360, 338, 'Four reach groups no substitution can install. The fifth takes one away.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'One intermediate, seven products. The diazonium group leaves as nitrogen gas — stable, and a gas that escapes the solution — which is enough to make an aryl position substitutable when no aryl cation should be accessible at all.',
  note: 'The H₃PO₂ row looks like undoing your own work and is the most useful of the seven. An NH₂ group is a powerful ortho/para director, so it can be installed purely to <b>steer</b> the next substitution and then deleted — which is how 1,3,5-tribromobenzene gets made, since bromine itself directs ortho and para and can never reach that pattern. That is a protecting group in aromatic clothes.',
});


/* ----------------------------------------------------------------- 48 ---
   The chapter's first claim is that one count predicts the material. Three
   monomers, three outcomes, drawn as what each can connect to. */
FIGURES.push({
  id: 'sites-decide',
  section: 'polymer-basics',
  anchor: '<h3>Addition polymerization: one active end</h3>',
  viewBox: '0 0 760 300',
  alt: 'One reactive site giving a single bond, two giving a chain and three giving a cross-linked network',
  build() {
    let s = '';
    const col = (ox, n, title, out, kind) => {
      s += panel(ox, 48, 220, 130, { kind });
      s += tag(ox + 110, 36, title);
      const cx = ox + 110, cy = 110;
      s += atom(cx, cy, 'M', { kind: kind === 'warn' ? 'warn' : 'hi' });
      const dirs = [[0, -40], [0, 40], [-46, 26]];
      for (let i = 0; i < n; i++) {
        const [dx, dy] = dirs[i];
        s += bond(P(cx, cy), P(cx + dx, cy + dy), { rTo: 13 });
        s += atom(cx + dx, cy + dy, 'M', {});
      }
      s += text(ox + 110, 202, out, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11.5 });
    };
    col(24,  1, 'one reactive site',   'a small molecule, and it stops', 'warn');
    col(270, 2, 'two reactive sites',  'a chain — a thermoplastic', null);
    col(516, 3, 'three or more',       'a network — a thermoset',   null);

    s += rule(24, 232, 700, 232);
    s += text(360, 258, 'Counting the reactive groups on ONE monomer predicts the material,', { cls: 'fg-lbl', size: 12 });
    s += text(360, 280, 'before any mechanism has been written down.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The count that runs the whole chapter. One reactive site makes a single bond and stops; two extends a line; three or more ties the lines to each other in every direction, which is what a network is. Count one functional group per site for a step-growth monomer, and count one C=C as <b>two</b> sites for a chain-growth one — one of its carbons carries the chain arriving and the other becomes the new active center. Counted that way a vinyl monomer has two sites, and divinylbenzene, with two C=C, is the cross-linker.',
  note: 'The consequence reaches all the way to the end of the material’s life. Separate chains are held to each other by intermolecular forces, so heat lets them slide and a thermoplastic can be melted and remolded. A network is one covalent molecule, so heating it breaks bonds rather than loosening them — and a thermoset cannot be recycled by melting at all.',
});

/* ----------------------------------------------------------------- 49 ---
   Two samples with identical formula and identical repeat unit, and one is
   a bag and the other a pipe. Drawing the chains is the only way to make
   that believable. */
FIGURES.push({
  id: 'packing-architecture',
  section: 'addition-polymers',
  anchor: '<h3>Branching, and the two polyethylenes</h3>',
  viewBox: '0 0 760 320',
  alt: 'Linear chains lying flat against each other beside branched chains held apart, labeled HDPE and LDPE',
  build() {
    let s = '';
    // A run of chain as a shallow zigzag, optionally with a short branch.
    const chain = (x0, y, n, branchAt) => {
      let t = '', px = x0, py = y, up = true;
      for (let i = 0; i < n; i++) {
        const nx = px + 16, ny = up ? y - 6 : y + 6;
        t += `<line class="fg-bond" x1="${px}" y1="${py}" x2="${nx}" y2="${ny}"></line>`;
        if (branchAt && i === branchAt) {
          t += `<line class="fg-bond" x1="${nx}" y1="${ny}" x2="${nx + 8}" y2="${ny - 26}"></line>`;
          t += `<line class="fg-bond" x1="${nx + 8}" y1="${ny - 26}" x2="${nx + 22}" y2="${ny - 20}"></line>`;
        }
        px = nx; py = ny; up = !up;
      }
      return t;
    };
    const col = (ox, title, branched, label2, use, kind) => {
      s += panel(ox, 46, 330, 152, { kind });
      s += tag(ox + 165, 34, title);
      for (let r = 0; r < 4; r++) {
        s += chain(ox + 24, 78 + r * 30, 16, branched ? (r % 2 ? 4 : 9) : 0);
      }
      s += text(ox + 165, 220, label2, { cls: 'fg-lbl', size: 12 });
      s += text(ox + 165, 242, use, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11 });
    };
    col(24,  'linear — chains touch along their length', false,
        'HDPE: crystalline, dense, rigid', 'milk bottles and pipe', null);
    col(406, 'branched — held apart', true,
        'LDPE: less crystalline, less dense, floppy', 'plastic bags', 'warn');

    s += rule(24, 268, 700, 268);
    s += text(360, 294, 'Same monomer. Same repeat unit. Same molecular formula.', { cls: 'fg-lbl', size: 12 });
    s += text(360, 316, 'The difference is architecture, and it is the whole material.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The two polyethylenes. High-pressure radical polymerization lets a growing chain abstract a hydrogen from itself and continue from there, leaving branches; a Ziegler–Natta catalyst holds the chain end and suppresses it. Branches stop the chains touching, and everything else follows.',
  note: 'This is the fatty-acid argument from the biomolecules chapter, applied to a different molecule. Straight chains lie against their neighbors along their full length and the London forces add up; a bend or a branch breaks that contact and the melting point falls with it. Tacticity does the same job by a different route — atactic polypropylene cannot pack either, and it is a goo where the isotactic polymer is rope.',
});

/* ----------------------------------------------------------------- 50 ---
   1/(1-p) is the whole reason step-growth is run the way it is, and a
   number line makes the cliff at the end visible in a way a table does not. */
FIGURES.push({
  id: 'conversion-cliff',
  section: 'condensation-polymers',
  anchor: '<h3>Why the kinetics feel different</h3>',
  viewBox: '0 0 760 310',
  alt: 'Degree of polymerization plotted against conversion, showing 10 at 90 percent, 100 at 99 percent and 1000 at 99.9 percent',
  build() {
    let s = '';
    const rows = [
      { p: '50%',   dp: '2',     w: 6,   note: 'dimers',        kind: 'warn' },
      { p: '90%',   dp: '10',    w: 30,  note: 'an oil',        kind: 'warn' },
      { p: '99%',   dp: '100',   w: 120, note: 'barely a plastic', kind: 'warn' },
      { p: '99.9%', dp: '1,000', w: 400, note: 'a material',    kind: null },
    ];
    s += tag(92, 48, 'conversion');
    s += tag(210, 48, 'DP = 1/(1−p)');
    s += tag(470, 48, 'what you have');
    s += rule(24, 62, 700, 62);
    rows.forEach((r, i) => {
      const y = 96 + i * 44;
      s += label(92, y + 4, r.p, { size: 12.5 });
      s += text(210, y + 4, r.dp, { cls: 'fg-lbl', size: 12.5 });
      s += bar(268, y - 11, r.w, 22, { kind: r.kind === 'warn' ? 'warn' : 'hi', opacity: 0.34 });
      s += text(688, y + 4, r.note, { cls: r.kind === 'warn' ? 'fg-tag' : 'fg-tag-good', anchor: 'end', size: 11 });
    });
    s += rule(24, 282, 700, 282);
    s += text(360, 306, 'Ninety-nine percent conversion sounds finished and gives a chain of a hundred.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Why a step-growth polymerization is run to a completeness that would be absurd for making a single ester. Any two pieces can join, so the mixture is short fragments until almost every functional group has reacted — and the material only appears in the last fraction of a percent.',
  note: 'Three requirements follow, and none of them is fussiness. <b>Exact stoichiometry</b>, because an excess of one monomer caps every chain end with a group that cannot react with its own kind. <b>High purity</b>, because one monofunctional impurity terminates a chain permanently. And <b>continuous removal of the water</b>, because every join is an equilibrium and the reaction has to be driven the whole way.',
});

/* ----------------------------------------------------------------- 51 ---
   A polymer needs two transition temperatures where a small molecule needs
   one, and which regions each describes is the thing students merge. */
FIGURES.push({
  id: 'tg-and-tm',
  section: 'polymer-properties',
  anchor: '<h3>Thermoplastic against thermoset</h3>',
  viewBox: '0 0 760 370',
  alt: 'Stiffness plotted on a log scale against temperature for two polymers: an amorphous one whose modulus falls three decades at the glass transition and then flows, and a semicrystalline one that steps down only slightly at the glass transition, holds a long plateau, and collapses at the melting temperature',
  build() {
    let s = '';
    /* SVG has no subscript, so the symbol is a tspan dropped below the
       baseline. The prose writes T<sub>g</sub>; the figure has to match it
       or the reader is looking at a different symbol. */
    const T = (x, y, sub, cls, size) =>
      `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle" font-size="${size}">T<tspan dy="3.5" font-size="${size * 0.75}">${sub}</tspan></text>`;

    s += tag(380, 26, 'WHAT THE TWO TRANSITIONS DO TO STIFFNESS');
    const X0 = 96, X1 = 700, Y0 = 62, Y1 = 296;
    s += rule(X0, Y1, X1, Y1);
    s += rule(X0, Y1, X0, Y0);
    s += text(X0 + 6, Y0 - 10, 'stiffness (modulus), log scale', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(694, Y1 - 8, 'temperature →', { cls: 'fg-tag', size: 11, anchor: 'end' });

    const TG = 286, TM = 580;
    s += `<line class="fg-dash" x1="${TG}" y1="${Y0 + 6}" x2="${TG}" y2="${Y1}"></line>`;
    s += `<line class="fg-dash" x1="${TM}" y1="${Y0 + 6}" x2="${TM}" y2="${Y1}"></line>`;
    s += T(TG, Y0, 'g', 'fg-tag-good', 13);
    s += T(TM, Y0, 'm', 'fg-tag-good', 13);

    /* Amorphous: one cliff, at Tg, and then it flows. */
    s += `<path class="fg-bond-hi" fill="none" d="M110 96 L256 100 C276 102 272 212 300 216 L392 232 C424 238 432 290 460 294"></path>`;
    s += text(118, 84, 'amorphous — polystyrene', { cls: 'fg-tag-warn', size: 10, anchor: 'start' });
    s += text(196, 236, 'three decades, all at once', { cls: 'fg-sm', size: 9.5 });

    /* Semicrystalline: a step at Tg, a long plateau, a cliff at Tm. */
    s += `<path class="fg-bond" fill="none" d="M110 130 L258 134 C278 136 276 168 300 172 L556 184 C580 188 584 290 606 294"></path>`;
    s += text(336, 164, 'semicrystalline — HDPE', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(462, 212, 'the crystallites are still holding it together', { cls: 'fg-sm', size: 9.5 });

    s += text(180, Y1 + 24, 'glassy', { cls: 'fg-tag', size: 10.5 });
    s += text(430, Y1 + 24, 'rubbery, or tough and useful', { cls: 'fg-tag', size: 10.5 });
    s += text(648, Y1 + 24, 'flows or melts', { cls: 'fg-tag', size: 10.5 });

    s += rule(24, 328, 700, 328);
    s += text(360, 354, 'How much each transition matters depends on how crystalline the sample is.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The two transitions seen as what they actually do: change the stiffness. For a fully amorphous polymer the glass transition <i>is</i> the softening point &mdash; the modulus falls by a factor of a thousand there and the material is finished. For a semicrystalline one the same transition barely registers, because only the tangled fraction has softened. The axis is schematic and the two curves are stacked to compare their <i>shapes</i>: the shared T<sub>g</sub> line is not a claim that polystyrene and HDPE soften at the same temperature, since their real glass transitions are about 220&nbsp;&deg;C apart.',
  note: 'That second curve is the answer to a question the bare temperature axis cannot settle: why HDPE is rigid at room temperature although it is far above its T<sub>g</sub>. Its crystalline regions act as physical cross-links, tying the mobile chains together, and they hold the sample in one piece all the way to T<sub>m</sub> &mdash; where they finally come apart, and the stiffness falls off a cliff instead of a step. A fully amorphous polymer has no such cliff, because it has no T<sub>m</sub> to reach.',
});

/* ----------------------------------------------------------------- 52 ---
   The chapter ends on an argument rather than a fact, and the argument is
   visible in a recycling bin: one functional group decides everything. */
FIGURES.push({
  id: 'backbone-decides',
  section: 'polymer-design',
  anchor: '<h3>Biodegradable by design</h3>',
  viewBox: '0 0 760 320',
  alt: 'A polyester backbone with a cleavable ester bond beside a polyethylene backbone of identical C-C bonds',
  build() {
    let s = '';
    const col = (ox, title, kind) => { s += panel(ox, 46, 330, 128, { kind }); s += tag(ox + 165, 34, title); };
    col(24,  'an ester in the backbone', null);
    col(406, 'a C–C backbone', 'warn');

    // Left: ...C-C(=O)-O-C... with the cleavable bond marked.
    const pts = [P(70, 104), P(118, 104), P(166, 104), P(214, 104), P(262, 104)];
    s += atom(pts[0].x, pts[0].y, 'C', {});
    s += atom(pts[1].x, pts[1].y, 'C', { kind: 'hi' });
    s += atom(pts[2].x, pts[2].y, 'O', { kind: 'hi' });
    s += atom(pts[3].x, pts[3].y, 'C', {});
    s += atom(pts[4].x, pts[4].y, 'C', {});
    for (let i = 0; i < 4; i++) s += bond(pts[i], pts[i + 1]);
    s += atom(118, 58, 'O', {});
    s += bond(pts[1], P(118, 58), { order: 2 });
    s += text(142, 148, 'water can pick this bond out', { cls: 'fg-tag-good', size: 10.5 });

    // Right: an undifferentiated run of carbons.
    let px = 452;
    const cs = [];
    for (let i = 0; i < 5; i++) { cs.push(P(px, 104)); px += 48; }
    cs.forEach((c) => s += atom(c.x, c.y, 'C', {}));
    for (let i = 0; i < 4; i++) s += bond(cs[i], cs[i + 1]);
    s += text(548, 148, 'every bond is the same as every other', { cls: 'fg-tag', size: 10.5 });

    s += text(190, 196, 'PET, nylon, PLA', { cls: 'fg-lbl', size: 12 });
    s += text(190, 216, 'chemically recyclable; PLA composts', { cls: 'fg-sm', size: 10.5 });
    s += text(560, 196, 'polyethylene, polypropylene', { cls: 'fg-lbl', size: 12 });
    s += text(560, 216, 'melt-and-remold only, then landfill', { cls: 'fg-sm', size: 10.5 });

    s += rule(24, 246, 700, 246);
    s += text(360, 272, 'Both are thermoplastics, so both can be melted — but only one can be unmade.', { cls: 'fg-lbl', size: 12 });
    s += text(360, 294, 'The difference is one functional group, chosen with the monomer.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Why PET is the most recycled plastic and polyethylene the most landfilled. An ester in the backbone is a bond that hydrolysis can select out of all the others, so the polymer can be taken apart and rebuilt. A saturated C–C chain offers nothing to select.',
  note: 'The uncomfortable part is that this is not a failure of chemistry to solve. The properties that make a polyolefin cheap, inert and durable — an unreactive backbone with no functional group in it — are exactly the properties that make it permanent. Designing for degradability means deliberately building in a weakness, and the choice is made when someone picks the monomer, not at the recycling plant.',
});

/* ---------------------------------------------------------------------- */


/* ----------------------------------------------------------------- 55 ---
   The ladder is usually drawn as a list. Drawing it as a one-way staircase,
   with the acid sitting off to the side and one arrow climbing back up, says
   the thing the list cannot: there is exactly one way up, and you take it
   first. */
FIGURES.push({
  id: 'one-way-ladder',
  section: 'acyl-chlorides-anhydrides',
  anchor: '<h3>What an acid chloride then does</h3>',
  viewBox: '0 0 760 320',
  alt: 'Four acyl derivatives on descending steps with downward arrows between them, and a single upward arrow labeled SOCl2 from the carboxylic acid',
  build() {
    let s = '';
    const steps = [
      { y: 58,  lab: 'acid chloride', sub: 'leaving group: Cl\u207b' },
      { y: 116, lab: 'anhydride',     sub: 'leaving group: RCOO\u207b' },
      { y: 174, lab: 'ester',         sub: 'leaving group: RO\u207b' },
      { y: 232, lab: 'amide',         sub: 'leaving group: R\u2082N\u207b' },
    ];
    steps.forEach((st, i) => {
      s += panel(300 + i * 26, st.y - 22, 250, 44, { kind: i === 0 ? null : null });
      s += text(316 + i * 26, st.y - 4, st.lab, { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
      s += text(316 + i * 26, st.y + 14, st.sub, { cls: 'fg-sm', size: 10, anchor: 'start' });
      if (i < steps.length - 1) {
        s += arrow(P(560 + i * 26, st.y + 6), P(574 + i * 26, st.y + 36));
      }
    });
    s += text(650, 40, 'down, freely', { cls: 'fg-tag-good', size: 11 });

    // The acid, off to the side, and the one arrow back up.
    s += panel(24, 152, 210, 66, { kind: 'warn' });
    s += text(40, 176, 'carboxylic acid', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(40, 196, 'pK\u2090 4\u20135: it protonates', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(40, 210, 'the nucleophile instead', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += arrow(P(240, 160), P(296, 62));
    s += text(236, 118, 'SOCl\u2082', { cls: 'fg-tag-good', size: 12, anchor: 'start' });
    s += text(236, 134, 'the usual way up', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += rule(24, 262, 700, 262);
    s += text(24, 286, 'Every step down expels a leaving group more basic than the one before it.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 308, 'Nothing climbs, because that would mean expelling the WORSE of the two \u2014 hence the detour.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    return s;
  },
  caption: 'The ranking is read straight off the leaving group: chloride, then carboxylate, then alkoxide, then amide anion, each more basic and so less willing to go than the last. Going down means the tetrahedral intermediate expels the better of the two groups it holds, which is what it does anyway; going up would mean expelling the worse one, which is why the list is one-way and why almost every route out of a carboxylic acid opens with the same move.',
  note: 'The acid is drawn beside the ladder rather than on it because its problem is not really its position. On reactivity alone it would sit between the anhydride and the ester, but it carries a proton, and any nucleophile good enough to attack is basic enough to take that proton first. What you get is an ammonium carboxylate: the nucleophile protonated, the electrophile now anionic, and both halves of the reaction switched off by a proton transfer faster than anything else in the flask.',
});

/* ----------------------------------------------------------------- 56 ---
   Four reagents, four products, one starting material. Drawn as a hub so the
   carbon count can be written on each spoke, since the count is the thing
   students get wrong rather than the reagents. */
FIGURES.push({
  id: 'nitrile-four-ways',
  section: 'nitriles',
  anchor: '<h3>One carbon, four destinations</h3>',
  viewBox: '0 0 760 300',
  alt: 'A nitrile at the left with four labeled arrows to a carboxylic acid, a primary amine, an aldehyde and a ketone',
  build() {
    let s = '';
    s += panel(24, 116, 180, 62, { kind: 'warn' });
    s += text(114, 142, 'R\u2013C\u2261N', { cls: 'fg-lbl', size: 15 });
    s += text(114, 164, 'three bonds to N', { cls: 'fg-sm', size: 10 });

    const rows = [
      { y: 44,  rgt: 'H\u2083O\u207a or HO\u207b, heat',        prod: 'R\u2013COOH',                 note: 'via the amide \u00b7 same carbons' },
      { y: 108, rgt: 'LiAlH\u2084, then H\u2082O',              prod: 'R\u2013CH\u2082NH\u2082',   note: 'the CN carbon becomes the CH\u2082' },
      { y: 172, rgt: 'DIBAL-H, 1 eq, \u221278 \u00b0C',        prod: 'R\u2013CHO',                   note: 'stops at an imine anion' },
      { y: 236, rgt: "R\u2032MgX, then H\u2083O\u207a",        prod: "R\u2013CO\u2013R\u2032",    note: 'adds R\u2032 \u00b7 one addition only' },
    ];
    for (const r of rows) {
      s += arrow(P(216, 147), P(392, r.y + 6));
      s += text(400, r.y - 4, r.rgt, { cls: 'fg-tag', size: 11, anchor: 'start' });
      s += text(400, r.y + 16, r.prod, { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
      s += text(560, r.y + 16, r.note, { cls: 'fg-sm', size: 10, anchor: 'start' });
    }
    return s;
  },
  caption: 'One starting material, four destinations \u2014 only three of them a step off the rung, since hydrolysis to the acid is a sideways move. The carbon skeleton is the thing to watch. Only the Grignard row changes the carbon count, because only there does a new group arrive; the other three rearrange what the nitrile carbon already had.',
  note: 'The two reductions differ for a structural reason rather than a stoichiometric one. DIBAL-H adds a single hydride and the product of that addition is a metalated imine anion, which is not an electrophile, so nothing further can attack it however long you wait — the aldehyde appears only when water hydrolyzes it on workup. LiAlH\u2084 is not stopped by anything, so rationing it to one equivalent does not give you an aldehyde; it gives you a mixture. The reagent is crippled, not rationed.',
});



/* ----------------------------------------------------------------- 59 ---
   The section's argument is that every route is an escape from one failure, so
   the failure goes in the middle and the escapes radiate off it. The carbon
   count is on each spoke because that is the question that actually decides
   between them. */
FIGURES.push({
  id: 'escapes-from-overalkylation',
  section: 'amine-synthesis',
  anchor: '<h3>Reductive amination: build the C&ndash;N bond by reduction instead</h3>',
  viewBox: '0 0 760 320',
  alt: 'The over-alkylation problem in the center with six routes around it, each labeled with what it gives and whether the carbon count changes',
  build() {
    let s = '';
    s += panel(250, 132, 260, 74, { kind: 'warn' });
    s += text(380, 158, 'R\u2013X + NH\u2083', { cls: 'fg-lbl', size: 13 });
    s += text(380, 180, 'a mixture: 1\u00b0, 2\u00b0, 3\u00b0, 4\u00b0', { cls: 'fg-sm', size: 10.5 });
    s += text(380, 196, 'the first products outrun the ammonia', { cls: 'fg-sm', size: 10 });

    const rows = [
      { y: 46,  name: 'Gabriel',            gives: '1\u00b0 only',        c: 'same' },
      { y: 90,  name: 'azide, then reduce', gives: '1\u00b0 only',        c: 'same' },
      { y: 240, name: 'CN\u207b, then LiAlH\u2084', gives: '1\u00b0 only',   c: '+1' },
      { y: 284, name: 'amide, then LiAlH\u2084',  gives: '1\u00b0, 2\u00b0 or 3\u00b0', c: 'same' },
    ];
    for (const r of rows) {
      s += text(24, r.y, r.name, { cls: 'fg-lbl', size: 12, anchor: 'start' });
      s += text(24, r.y + 18, r.gives + '  \u00b7  carbons ' + r.c,
                { cls: r.c === 'same' ? 'fg-tag-good' : 'fg-tag', size: 10.5, anchor: 'start' });
    }
    s += text(540, 46, 'reductive amination', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(540, 64, '1\u00b0, 2\u00b0 or 3\u00b0 \u00b7 your choice', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    s += text(540, 82, 'no S\u2099\u00b2 limit on the halide', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(540, 262, 'Hofmann rearrangement', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(540, 280, '1\u00b0 only \u00b7 carbons \u22121', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(540, 298, 'that carbon leaves as CO\u2082', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += rule(24, 218, 700, 218);
    return s;
  },
  caption: 'One failure and six escapes from it. The three that run an S\u2099\u00b2 on a nitrogen surrogate \u2014 Gabriel, azide, cyanide \u2014 can only ever hand back a primary amine, and need a primary unhindered halide to do it. Reductive amination and amide reduction have neither limit, which is why they are the workhorses.',
  note: 'Read the right-hand column first. Butanamide is the compound to keep in mind: LiAlH\u2084 gives butylamine and Br\u2082/NaOH gives propylamine, so the same starting material and the same kind of product differ by a carbon depending only on the reagent. That is why the carbon count is the first question to ask of a proposed amine synthesis and not the last \u2014 a route can be flawless step by step and still arrive one carbon short.',
});

/* ----------------------------------------------------------------- 60 ---
   Two beta carbons, two alkenes, and the bulk of the leaving group choosing
   between them. Drawing the ammonium group oversized is the point of the
   figure: the steric argument is visible or it is just an assertion. */
FIGURES.push({
  id: 'hofmann-picks-the-open-side',
  section: 'hofmann-elimination',
  anchor: '<h3>Worked example: 2-aminobutane</h3>',
  viewBox: '0 0 760 300',
  alt: 'A sec-butyltrimethylammonium salt with its two beta carbons labeled, and the less substituted alkene marked as the major product',
  build() {
    let s = '';
    const c1 = P(140, 120), c2 = P(220, 150), c3 = P(300, 120), c4 = P(380, 150);
    [c1, c2, c3, c4].forEach((c, i) => s += atom(c.x, c.y, 'C', { kind: i === 1 ? 'hi' : undefined }));
    s += bond(c1, c2); s += bond(c2, c3); s += bond(c3, c4);
    s += atom(220, 88, 'N\u207a(CH\u2083)\u2083', { kind: 'warn' });
    s += bond(c2, P(220, 96));
    s += text(220, 62, 'very bulky', { cls: 'fg-tag', size: 11 });

    s += text(140, 152, 'C1 \u00b7 CH\u2083 \u00b7 3 H', { cls: 'fg-tag-good', size: 11 });
    s += text(140, 168, 'open', { cls: 'fg-sm', size: 10 });
    s += text(300, 96, 'C3 \u00b7 CH\u2082 \u00b7 2 H', { cls: 'fg-tag', size: 11 });
    s += text(300, 80, 'more substituted \u2014 carries C4', { cls: 'fg-sm', size: 10 });

    s += rule(24, 196, 700, 196);
    s += text(24, 222, 'H from C1  \u2192  but-1-ene, monosubstituted  \u2014  MAJOR', { cls: 'fg-tag-good', size: 12, anchor: 'start' });
    s += text(24, 244, 'H from C3  \u2192  but-2-ene, disubstituted and more stable  \u2014  minor', { cls: 'fg-tag', size: 12, anchor: 'start' });
    s += text(24, 272, 'Four carbons either way. Trimethylamine leaves alongside.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 294, 'The more stable alkene loses, because the base cannot reach the hydrogen that makes it.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    return s;
  },
  caption: 'Zaitsev would pick but-2-ene and this reaction does not, which is the whole point of drawing the ammonium group oversized. Hydroxide takes the hydrogen it can reach rather than the one that gives the better alkene, exactly as tert-butoxide does in the E2 chapter \u2014 only here the bulk is on the leaving group instead of the base.',
  note: 'Read the drawing as a question about reach rather than about stability. Hydroxide has to arrive at a β hydrogen, and the oversized group on C2 is what decides which of them it can get to — which is why the more stable alkene loses here, and would win if a small halide sat in the same position.',
});



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

/* ------------------------------------------------------------------ R5 ---
   Why hydrogenation is syn. The reason is physical rather than electronic -
   an alkene lying on a surface has one reachable face - and no figure in the
   section showed the surface at all. */
FIGURES.push({
  id: 'syn-on-surface',
  section: 'hydrogenation',
  anchor: 'Hydrogenation is therefore a <b>syn addition</b>: the two new C–H bonds form on the same face.</p>',
  alt: 'Three frames showing an alkene adsorbed face down on a palladium surface, both hydrogens delivered from that surface, and the syn product; below, 1,2-dimethylcyclohexene hydrogenated to cis-1,2-dimethylcyclohexane',
  viewBox: '0 0 760 500',
  build() {
    let s = '';
    s += text(60, 28, 'WHY SYN', { cls: 'fg-tag', size: 11 });

    /* The surface is the same object in the first two frames, so it is one
       function: a filled bar with the metal label under it. */
    const surface = (x, w, label) => bar(x, 176, w, 12, { kind: 'mut', r: 4 }) +
      text(x + w / 2, 206, label, { cls: 'fg-sm', size: 10 });

    // ---- Frame 1: adsorption ----
    s += panel(14, 44, 236, 186);
    s += tag(132, 62, 'adsorption');
    {
      const C1 = P(108, 128), C2 = P(158, 128);
      s += bond(C1, C2, { order: 2, gap: 5, rFrom: 14, rTo: 14 });
      s += bond(C1, P(84, 92), { rFrom: 14, rTo: 13 });
      s += bond(C2, P(182, 92), { rFrom: 14, rTo: 13 });
      s += atom(C1.x, C1.y, 'C', { r: 14 });
      s += atom(C2.x, C2.y, 'C', { r: 14 });
      s += atom(84, 92, 'R', { r: 13 });
      s += atom(182, 92, 'R', { r: 13 });
      s += atom(110, 162, 'H', { kind: 'hi', r: 12 });
      s += atom(156, 162, 'H', { kind: 'hi', r: 12 });
      s += surface(30, 204, 'metal surface (Pd)');
      s += text(132, 222, 'H–H splits here; the alkene lies flat', { cls: 'fg-sm', size: 9.5 });
    }
    // ---- Frame 2: delivery ----
    s += panel(258, 44, 236, 186);
    s += tag(376, 62, 'delivery');
    {
      const C1 = P(352, 128), C2 = P(402, 128);
      s += bond(C1, C2, { rFrom: 14, rTo: 14 });
      s += bond(C1, P(328, 92), { rFrom: 14, rTo: 13 });
      s += bond(C2, P(426, 92), { rFrom: 14, rTo: 13 });
      s += atom(C1.x, C1.y, 'C', { r: 14 });
      s += atom(C2.x, C2.y, 'C', { r: 14 });
      s += atom(328, 92, 'R', { r: 13 });
      s += atom(426, 92, 'R', { r: 13 });
      s += arrow(P(352, 160), P(352, 146), { size: 6 });
      s += arrow(P(402, 160), P(402, 146), { size: 6 });
      s += surface(274, 204, 'both H come off the metal');
      s += text(376, 222, 'there is no other side available', { cls: 'fg-sm', size: 10 });
    }
    // ---- Frame 3: the product ----
    s += panel(502, 44, 244, 186);
    s += tag(624, 62, 'SYN addition');
    {
      const C1 = P(600, 132), C2 = P(650, 132);
      s += bond(C1, C2, { rFrom: 14, rTo: 14 });
      s += hash(C1, P(576, 96), { rFrom: 14, rTo: 13 });
      s += hash(C2, P(674, 96), { rFrom: 14, rTo: 13 });
      s += wedge(C1, P(576, 170), { rFrom: 14, rTo: 12 });
      s += wedge(C2, P(674, 170), { rFrom: 14, rTo: 12 });
      s += atom(C1.x, C1.y, 'C', { r: 14 });
      s += atom(C2.x, C2.y, 'C', { r: 14 });
      s += atom(576, 96, 'R', { r: 13 });
      s += atom(674, 96, 'R', { r: 13 });
      s += atom(576, 170, 'H', { kind: 'hi', r: 12 });
      s += atom(674, 170, 'H', { kind: 'hi', r: 12 });
      s += text(624, 206, 'both new H on one face,', { cls: 'fg-tag-good', size: 11 });
      s += text(624, 222, 'both R groups left on the other', { cls: 'fg-sm', size: 10 });
    }

    s += rule(30, 248, 730, 248);
    s += text(58, 274, 'ON A RING', { cls: 'fg-tag', size: 11 });

    /* A hexagon from its center, vertex 0 at the top right, so the C1-C2 edge
       that carries the two methyls is the top edge in both drawings. */
    const hex = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = ((60 * i - 120) * Math.PI) / 180;
        v.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return v;
    };
    {
      const v = hex(150, 352, 44);
      let ring = '';
      for (let i = 0; i < 6; i++) ring += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      s += ring;
      s += ringDouble(v[0], v[1], P(150, 352));
      s += bond(v[0], P(v[0].x - 22, v[0].y - 32), { rFrom: 0, rTo: 16 });
      s += bond(v[1], P(v[1].x + 22, v[1].y - 32), { rFrom: 0, rTo: 16 });
      s += atom(v[0].x - 22, v[0].y - 32, 'CH₃', { r: 16, size: 9.5 });
      s += atom(v[1].x + 22, v[1].y - 32, 'CH₃', { r: 16, size: 9.5 });
      s += text(150, 424, '1,2-dimethylcyclohexene', { cls: 'fg-lbl', size: 11.5 });
    }
    s += arrow(P(240, 352), P(360, 352));
    s += text(300, 338, 'H₂, Pd/C', { cls: 'fg-sm', size: 10 });
    {
      const v = hex(450, 352, 44);
      let ring = '';
      for (let i = 0; i < 6; i++) ring += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      s += ring;
      s += wedge(v[0], P(v[0].x, v[0].y - 40), { rFrom: 0, rTo: 16 });
      s += wedge(v[1], P(v[1].x, v[1].y - 40), { rFrom: 0, rTo: 16 });
      s += hash(v[0], P(v[0].x - 36, v[0].y - 20), { rFrom: 0, rTo: 12 });
      s += hash(v[1], P(v[1].x + 36, v[1].y - 20), { rFrom: 0, rTo: 12 });
      s += atom(v[0].x, v[0].y - 40, 'CH₃', { r: 16, size: 9.5 });
      s += atom(v[1].x, v[1].y - 40, 'CH₃', { r: 16, size: 9.5 });
      s += atom(v[0].x - 36, v[0].y - 20, 'H', { kind: 'hi', r: 12 });
      s += atom(v[1].x + 36, v[1].y - 20, 'H', { kind: 'hi', r: 12 });
      s += text(450, 424, 'cis-1,2-dimethylcyclohexane', { cls: 'fg-lbl', size: 11.5 });
    }
    s += text(636, 320, 'both H arrived on the', { cls: 'fg-sm', size: 10 });
    s += text(636, 336, 'bottom face, so both', { cls: 'fg-sm', size: 10 });
    s += text(636, 352, 'methyls are left on top', { cls: 'fg-sm', size: 10 });
    s += text(636, 378, 'cis here is meso — achiral', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(30, 440, 730, 440);
    s += text(380, 462, 'Syn fixes which side, not which enantiomer: the alkene can lie down either way up.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The mechanism in one picture. Hydrogenation is syn for a physical reason rather than an electronic one &mdash; an alkene lying on a surface has only one reachable face, and both hydrogens come off that surface.',
  note: 'The ring makes it visible, which is why it is always the exam case: a cyclohexene cannot rotate its two halves relative to each other, so &ldquo;both H on the same face&rdquo; shows up directly as &ldquo;both methyls cis&rdquo;. On an open-chain alkene the same thing happens, but the result is stated as a relative relationship instead — one diastereomer, formed as a racemate because half the molecules adsorb with the other face down.',
});

/* ------------------------------------------------------------------ R6 ---
   The two cyclic intermediates the syn/anti rule is actually about. The
   section states the rule and draws the products; what was missing is the
   reason, which lives entirely in the shape of the intermediate. */
FIGURES.push({
  id: 'diol-intermediates',
  section: 'alkene-oxidation',
  anchor: 'so the two oxygens end up on <b>opposite faces</b>: an <b><i>anti</i> (trans) diol</b>.</li>\n</ul>',
  alt: 'The syn route through a five-membered cyclic osmate ester giving a cis diol, against the anti route through an epoxide opened by backside attack of water giving a trans diol',
  viewBox: '0 0 760 420',
  build() {
    let s = '';
    const alkene = (x, y) => {
      const C1 = P(x, y), C2 = P(x + 50, y);
      return bond(C1, C2, { order: 2, gap: 5, rFrom: 14, rTo: 14 }) +
        bond(C1, P(x - 24, y - 34), { rFrom: 14, rTo: 13 }) +
        bond(C2, P(x + 74, y - 34), { rFrom: 14, rTo: 13 }) +
        atom(C1.x, C1.y, 'C', { r: 14 }) + atom(C2.x, C2.y, 'C', { r: 14 }) +
        atom(x - 24, y - 34, 'R', { r: 13 }) + atom(x + 74, y - 34, 'R', { r: 13 });
    };

    // ================= SYN =================
    s += text(92, 28, 'SYN — the osmate ester', { cls: 'fg-tag', size: 11 });
    s += panel(14, 40, 732, 150);
    s += alkene(70, 118);
    s += atom(120, 66, 'OsO₄', { kind: 'warn', r: 22, size: 9.5 });
    s += curve(P(104, 84), P(78, 100), { bow: 10 });
    s += curve(P(138, 84), P(114, 100), { bow: -10 });
    s += arrow(P(210, 112), P(286, 112));
    {
      // the five-membered ring: C-C-O-Os-O
      const C1 = P(336, 132), C2 = P(386, 132), O1 = P(322, 86), O2 = P(400, 86), Os = P(361, 58);
      s += bond(C1, C2, { rFrom: 14, rTo: 14 });
      s += bond(C1, O1, { rFrom: 14, rTo: 14 });
      s += bond(C2, O2, { rFrom: 14, rTo: 14 });
      s += bond(O1, Os, { rFrom: 14, rTo: 18 });
      s += bond(O2, Os, { rFrom: 14, rTo: 18 });
      s += bond(C1, P(312, 166), { rFrom: 14, rTo: 13 });
      s += bond(C2, P(410, 166), { rFrom: 14, rTo: 13 });
      s += atom(C1.x, C1.y, 'C', { r: 14 });
      s += atom(C2.x, C2.y, 'C', { r: 14 });
      s += atom(O1.x, O1.y, 'O', { kind: 'hi', r: 14 });
      s += atom(O2.x, O2.y, 'O', { kind: 'hi', r: 14 });
      s += atom(Os.x, Os.y, 'Os', { kind: 'warn', r: 18, size: 11 });
      s += atom(312, 166, 'R', { r: 13 });
      s += atom(410, 166, 'R', { r: 13 });
      s += text(361, 182, 'both C–O bonds made at once, on one face', { cls: 'fg-sm', size: 10 });
    }
    s += arrow(P(440, 112), P(516, 112));
    s += text(478, 98, 'NaHSO₃', { cls: 'fg-sm', size: 10 });
    {
      const C1 = P(580, 122), C2 = P(630, 122);
      s += bond(C1, C2, { rFrom: 14, rTo: 14 });
      s += hash(C1, P(556, 88), { rFrom: 14, rTo: 13 });
      s += hash(C2, P(654, 88), { rFrom: 14, rTo: 13 });
      s += wedge(C1, P(556, 156), { rFrom: 14, rTo: 17 });
      s += wedge(C2, P(654, 156), { rFrom: 14, rTo: 17 });
      s += atom(C1.x, C1.y, 'C', { r: 14 });
      s += atom(C2.x, C2.y, 'C', { r: 14 });
      s += atom(556, 88, 'R', { r: 13 });
      s += atom(654, 88, 'R', { r: 13 });
      s += atom(556, 156, 'OH', { kind: 'hi', r: 17, size: 10 });
      s += atom(654, 156, 'OH', { kind: 'hi', r: 17, size: 10 });
      s += text(692, 122, 'syn diol', { cls: 'fg-tag-good', size: 11 });
    }

    // ================= ANTI =================
    s += text(156, 226, 'ANTI — the epoxide, then backside attack', { cls: 'fg-tag', size: 11 });
    s += panel(14, 238, 732, 150);
    s += alkene(70, 316);
    s += atom(150, 262, 'mCPBA', { kind: 'warn', r: 26, size: 9 });
    s += curve(P(134, 284), P(100, 302), { bow: 14 });
    s += text(166, 356, 'one concerted step — the alkene geometry survives', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(200, 316), P(268, 316));
    {
      // the protonated epoxide, with water arriving from the far side
      const C1 = P(320, 332), C2 = P(370, 332), O = P(345, 292);
      s += bond(C1, C2, { rFrom: 14, rTo: 14 });
      s += bond(C1, O, { rFrom: 14, rTo: 15 });
      s += bond(C2, O, { rFrom: 14, rTo: 15 });
      s += atom(C1.x, C1.y, 'C', { r: 14 });
      s += atom(C2.x, C2.y, 'C', { r: 14 });
      s += atom(O.x, O.y, 'O⁺H', { kind: 'warn', r: 15, size: 9.5 });
      s += atom(392, 380, 'H₂O', { kind: 'hi', r: 17, size: 10 });
      s += curve(P(384, 363), P(374, 348), { bow: 8, size: 7 });
      s += text(345, 258, 'attack comes from the face away from the oxygen', { cls: 'fg-sm', size: 10 });
      s += text(345, 274, 'the Sₙ₂2 geometry, on a strained ring', { cls: 'fg-sm', size: 9.5 });
    }
    s += arrow(P(438, 316), P(514, 316));
    s += text(476, 302, 'H₃O⁺', { cls: 'fg-sm', size: 10 });
    {
      const C1 = P(580, 320), C2 = P(630, 320);
      s += bond(C1, C2, { rFrom: 14, rTo: 14 });
      s += hash(C1, P(556, 286), { rFrom: 14, rTo: 13 });
      s += wedge(C2, P(654, 286), { rFrom: 14, rTo: 17 });
      s += wedge(C1, P(556, 354), { rFrom: 14, rTo: 17 });
      s += hash(C2, P(654, 354), { rFrom: 14, rTo: 13 });
      s += atom(C1.x, C1.y, 'C', { r: 14 });
      s += atom(C2.x, C2.y, 'C', { r: 14 });
      s += atom(556, 286, 'R', { r: 13 });
      s += atom(654, 286, 'OH', { kind: 'hi', r: 17, size: 10 });
      s += atom(556, 354, 'OH', { kind: 'hi', r: 17, size: 10 });
      s += atom(654, 354, 'R', { r: 13 });
      s += text(694, 320, 'anti diol', { cls: 'fg-tag-good', size: 11 });
    }

    s += rule(30, 396, 730, 396);
    s += text(380, 414, 'Both routes make two C–O bonds — the difference is when, and from which side.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The two intermediates the syn/anti rule is really about. Osmium ties both oxygens to one face before anything is released; the epoxide route makes the first C&ndash;O bond on one face and is then forced to make the second on the other.',
  note: 'The osmate ester is why syn dihydroxylation is stereospecific and not merely stereoselective: at no point in the sequence do the two oxygens have the freedom to be anywhere else, because they are joined to each other through osmium until the ring is cut. In the anti route, look at where the nucleophile has to come from — an epoxide carbon can only be attacked from the side away from its own oxygen, which is the S<sub>N</sub>2 geometry from <a class="chapter-ref" href="/ochem/learn.html#m-substitution-elimination">Substitution &amp; Elimination</a> applied to a strained ring.',
});


/* ------------------------------------------------------------------ R7 ---
   Ozonolysis had no figure at all: the section describes a two-stage
   mechanism and a branching workup entirely in prose, and "the workup, not
   the ozone, decides the product" is a claim about an intermediate nobody
   had been shown. Three panels for the mechanism, two for the branch. */
FIGURES.push({
  id: 'ozonolysis-mechanism',
  section: 'alkene-oxidation',
  anchor: 'and <i>that</i> is why the workup, not the ozone, decides the answer.</p>',
  alt: 'Ozonolysis in five drawings: ozone adding across a double bond to give the five-membered molozonide, its rearrangement into the ozonide, and then the two workups — dimethyl sulfide capping the fragments as a ketone and an aldehyde, hydrogen peroxide taking the aldehyde on to a carboxylic acid',
  viewBox: '0 0 760 486',
  build() {
    let s = '';

    // ---- Panel 1: ozone meets the alkene ----
    s += tag(132, 34, 'STEP 1 — ozone adds across the C=C');
    s += panel(14, 44, 236, 180);
    {
      const C1 = P(100, 128), C2 = P(164, 128);
      const Oa = P(96, 80), Ob = P(132, 60), Oc = P(168, 80);
      s += bond(C1, C2, { order: 2, gap: 5, rFrom: 15, rTo: 15 });
      s += bond(C1, P(64, 100), { rFrom: 15, rTo: 13 });
      s += bond(C1, P(64, 156), { rFrom: 15, rTo: 13 });
      s += bond(C2, P(200, 100), { rFrom: 15, rTo: 13 });
      s += bond(C2, P(200, 156), { rFrom: 15, rTo: 13 });
      s += bond(Oa, Ob, { rFrom: 14, rTo: 14 });
      s += bond(Ob, Oc, { order: 2, gap: 4, rFrom: 14, rTo: 14 });
      s += atom(C1.x, C1.y, 'C', { kind: 'hi' });
      s += atom(C2.x, C2.y, 'C', { kind: 'hi' });
      s += atom(64, 100, 'R', { r: 13 });
      s += atom(64, 156, 'R', { r: 13 });
      s += atom(200, 100, 'R', { r: 13 });
      s += atom(200, 156, 'R', { r: 13 });
      s += atom(Oa.x, Oa.y, 'O⁻', { kind: 'warn', r: 14, size: 10.5 });
      s += atom(Ob.x, Ob.y, 'O⁺', { kind: 'warn', r: 14, size: 10.5 });
      s += atom(Oc.x, Oc.y, 'O', { kind: 'warn', r: 14 });
      s += lonePair(Oa.x, Oa.y, 180);
      s += curve(P(80, 92), P(94, 114), { bow: 10 });
      s += curve(P(140, 120), P(160, 96), { bow: -12 });
      s += text(132, 194, 'a concerted 1,3-dipolar addition', { cls: 'fg-tag', size: 10.5 });
      s += text(132, 210, 'both new C–O bonds form at once', { cls: 'fg-sm', size: 9.5 });
    }

    /* The two rings are the same pentagon twice, so the vertices are computed
       once: radius 46 puts ~23px of visible bond between neighboring atoms,
       which is what stops a five-membered ring reading as a blob. */
    const ring = (cx, cy, r = 46) => [-90, -18, 54, 126, 198].map((d) => {
      const a = (d * Math.PI) / 180;
      return P(cx + r * Math.cos(a), cy + r * Math.sin(a));
    });

    // ---- Panel 2: the molozonide, C–C–O–O–O ----
    s += tag(380, 34, 'STEP 2 — the molozonide falls apart');
    s += panel(258, 44, 244, 180);
    {
      const [v0, v1, v2, v3, v4] = ring(380, 118);
      // v3 and v2 are the two former alkene carbons; v4, v0, v1 the ozone.
      s += bond(v3, v2, { rFrom: 17, rTo: 17, cls: 'fg-bond-hi' });
      s += bond(v2, v1, { rFrom: 17, rTo: 14 });
      s += bond(v1, v0, { rFrom: 14, rTo: 14, cls: 'fg-bond-hi' });
      s += bond(v0, v4, { rFrom: 14, rTo: 14 });
      s += bond(v4, v3, { rFrom: 14, rTo: 17 });
      s += atom(v3.x, v3.y, 'CR₂', { r: 17, size: 9.5 });
      s += atom(v2.x, v2.y, 'CR₂', { r: 17, size: 9.5 });
      s += atom(v1.x, v1.y, 'O', { kind: 'warn', r: 14 });
      s += atom(v0.x, v0.y, 'O', { kind: 'warn', r: 14 });
      s += atom(v4.x, v4.y, 'O', { kind: 'warn', r: 14 });
      s += text(380, 188, 'molozonide (1,2,3-trioxolane)', { cls: 'fg-tag' });
      s += text(380, 204, 'the bolder two bonds break,', { cls: 'fg-sm' });
      s += text(380, 218, 'and the pieces re-close', { cls: 'fg-sm' });
    }

    // ---- Panel 3: the ozonide, C–O–O–C–O ----
    s += tag(628, 34, 'STEP 3 — and re-forms as the ozonide');
    s += panel(510, 44, 236, 180);
    {
      const [v0, v1, v2, v3, v4] = ring(628, 118);
      // v3 and v1 are the carbons now; v4, v0 an O–O pair and v2 the bridge.
      s += bond(v3, v4, { rFrom: 17, rTo: 14 });
      s += bond(v4, v0, { rFrom: 14, rTo: 14 });
      s += bond(v0, v1, { rFrom: 14, rTo: 17 });
      s += bond(v1, v2, { rFrom: 17, rTo: 14 });
      s += bond(v2, v3, { rFrom: 14, rTo: 17 });
      s += atom(v3.x, v3.y, 'CR₂', { r: 17, size: 9.5 });
      s += atom(v1.x, v1.y, 'CR₂', { r: 17, size: 9.5 });
      s += atom(v4.x, v4.y, 'O', { kind: 'warn', r: 14 });
      s += atom(v0.x, v0.y, 'O', { kind: 'warn', r: 14 });
      s += atom(v2.x, v2.y, 'O', { kind: 'warn', r: 14 });
      s += text(628, 188, 'ozonide (1,2,4-trioxolane)', { cls: 'fg-tag' });
      s += text(628, 204, 'this is what is in the flask —', { cls: 'fg-sm' });
      s += text(628, 218, 'and not a C=O yet', { cls: 'fg-sm' });
    }

    s += rule(30, 240, 730, 240);
    s += text(380, 262, 'Now take (CH₃)₂C=CH–CH₃ through both workups — same cut, different caps.', { cls: 'fg-lbl', size: 12 });

    // ---- Panel 4: reductive workup ----
    s += panel(14, 276, 360, 150);
    s += tag(194, 298, 'REDUCTIVE WORKUP — Me₂S or Zn/AcOH');
    s += text(194, 320, 'each fragment stops at the carbonyl', { cls: 'fg-sm', size: 10 });
    s += label(120, 352, '(CH₃)₂C=O', { size: 13 });
    s += label(194, 352, '+', { size: 13 });
    s += label(268, 352, 'CH₃CHO', { size: 13 });
    s += text(120, 372, 'propanone', { cls: 'fg-tag-good', size: 10.5 });
    s += text(268, 372, 'ethanal', { cls: 'fg-tag-good', size: 10.5 });
    s += text(194, 398, 'the carbon with no hydrogen can only be a ketone;', { cls: 'fg-sm' });
    s += text(194, 414, 'the one that had a hydrogen becomes an aldehyde', { cls: 'fg-sm' });

    // ---- Panel 5: oxidative workup ----
    s += panel(386, 276, 360, 150);
    s += tag(566, 298, 'OXIDATIVE WORKUP — H₂O₂');
    s += text(566, 320, 'anything that would be an aldehyde climbs one more rung', { cls: 'fg-sm', size: 9.5 });
    s += label(492, 352, '(CH₃)₂C=O', { size: 13 });
    s += label(566, 352, '+', { size: 13 });
    s += label(640, 352, 'CH₃CO₂H', { size: 13 });
    s += text(492, 372, 'propanone, unchanged', { cls: 'fg-tag-good', size: 10.5 });
    s += text(640, 372, 'ethanoic acid', { cls: 'fg-tag-good', size: 10.5 });
    s += text(566, 398, 'a ketone has no hydrogen there for peroxide to take;', { cls: 'fg-sm' });
    s += text(566, 414, 'a =CH₂ end ends up as CO₂ and leaves the flask', { cls: 'fg-sm' });

    s += rule(30, 442, 730, 442);
    s += text(380, 462, 'Ozone builds the ring; the workup decides the caps.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 480, 'Rejoin the two carbonyl carbons and the alkene comes back — ozonolysis read backwards.', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Why ozonolysis is always written with two reagents over the arrow. Ozone alone does not make the carbonyls &mdash; it makes a ring, and the ring is what is in the flask when the ozone is switched off. The second reagent opens it, and that is where the two answers separate.',
  note: 'The two ring names are worth holding apart because the numbers say where the oxygens are: the <b>molozonide</b> is a 1,2,3-trioxolane, three oxygens in a row with the old C&ndash;C bond still intact, and it is too strained to last. It comes apart and the pieces re-close as the <b>ozonide</b>, a 1,2,4-trioxolane, in which the two carbons no longer touch each other at all &mdash; that is the moment the double bond is genuinely gone. After that the workup is a separate decision: Me₂S takes the extra oxygen away and leaves carbonyls, while H₂O₂ leaves an oxidant in the flask, so any fragment still carrying a hydrogen on its new carbonyl carbon keeps climbing. A terminal =CH₂ carries two, which is why it disappears as CO₂ rather than appearing in the product list.',
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


/* ---------------------------------------------------------------- 100 ---
   Skeletal structures taught the rule "subtract the drawn bonds from four"
   and then worked one example in prose. The count is the whole skill, and a
   count is exactly the kind of claim that is easier to check on a drawing
   than to follow in a sentence — especially the multiple-bond case, where
   the number of lines and the number of bonds stop being the same thing. */
FIGURES.push({
  id: 'skeletal-h-count',
  section: 'skeletal-structures',
  anchor: '<p>Put it together: CH₃–CH(OH)–CH₂–CH₂–CH₃, pentan-2-ol. The whole read is one pass, and the hydrogens were never guessed — they were subtracted.</p>',
  alt: 'Pentan-2-ol and 2-methylbut-2-ene drawn skeletally with the bond count and hydrogen count written under every carbon',
  viewBox: '0 0 760 290',
  build() {
    let s = '';

    // ---- Pentan-2-ol: single bonds only ----
    s += tag(174, 40, 'ALL SINGLE BONDS');
    const a = [P(70, 150), P(122, 122), P(174, 150), P(226, 122), P(278, 150)];
    for (let i = 1; i < a.length; i++) s += bond(a[i - 1], a[i], { rFrom: 0, rTo: 0 });
    s += bond(a[1], P(122, 74), { rFrom: 0, rTo: 15 });
    s += atom(122, 74, 'OH', { kind: 'hi', size: 10.5 });
    for (const pt of a) s += atom(pt.x, pt.y, '', { kind: 'point' });
    const aH = ['1 bond', '3 bonds', '2 bonds', '2 bonds', '1 bond'];
    const aN = ['CH₃', 'CH', 'CH₂', 'CH₂', 'CH₃'];
    for (let i = 0; i < a.length; i++) {
      s += text(a[i].x, 196, aH[i], { cls: 'fg-sm', size: 9.5 });
      s += text(a[i].x, 214, aN[i], { cls: 'fg-tag-good', size: 10.5 });
    }
    s += text(174, 242, 'C₅H₁₂O — the OH is one of that carbon’s four', { cls: 'fg-sm', size: 10 });

    s += rule(390, 34, 390, 262);

    // ---- 2-methylbut-2-ene: the double bond eats two of the four ----
    s += tag(530, 40, 'WITH A DOUBLE BOND');
    const b = [P(460, 150), P(512, 122), P(564, 122), P(616, 150)];
    s += bond(b[0], b[1], { rFrom: 0, rTo: 0 });
    s += bond(b[1], b[2], { rFrom: 0, rTo: 0, order: 2 });
    s += bond(b[2], b[3], { rFrom: 0, rTo: 0 });
    s += bond(b[1], P(512, 74), { rFrom: 0, rTo: 0 });
    for (const pt of b) s += atom(pt.x, pt.y, '', { kind: 'point' });
    s += atom(512, 74, '', { kind: 'point' });
    s += text(512, 62, '3 H', { cls: 'fg-tag-good', size: 10.5 });
    const bH = ['1 bond', '4 bonds', '3 bonds', '1 bond'];
    const bN = ['3 H', 'no H', '1 H', '3 H'];
    for (let i = 0; i < b.length; i++) {
      s += text(b[i].x, 196, bH[i], { cls: 'fg-sm', size: 9.5 });
      s += text(b[i].x, 214, bN[i], { cls: 'fg-tag-good', size: 10.5 });
    }
    s += text(530, 242, 'C₅H₁₀ — a C=C is two of the four', { cls: 'fg-sm', size: 10 });

    s += rule(34, 262, 726, 262);
    s += text(380, 282, 'Count bonds at the vertex, subtract from four, the rest is hydrogen.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The hydrogen count written out under every carbon of two molecules. Nothing here is remembered &mdash; each number is four minus the bonds you can see at that vertex.',
  note: 'The right-hand molecule is where the rule earns its keep. The carbon carrying the methyl has three lines drawn at it but four bonds, because one of those lines is a double bond; it therefore carries no hydrogen at all. Read lines and you get it wrong, read bonds and you get it right, and the difference only ever shows up at a multiple bond &mdash; which is to say, at every carbonyl and every alkene in the rest of the book.',
});


/* ---------------------------------------------------------------- 101 ---
   Rings, and the five-bond slip. The notes name a bare hexagon, a benzene
   and a pitfall in prose, and three bank questions depend on telling the
   first two apart. The pitfall in particular is a drawing error, so it is
   drawn: the wrong structure beside the right one, with the count. */
FIGURES.push({
  id: 'skeletal-rings',
  section: 'skeletal-structures',
  anchor: '<h3>Rings, and why they are the clearest case for the notation</h3>',
  alt: 'A bare hexagon read as cyclohexane, benzene drawn with alternating double bonds and with a circle, and a vertex carbon wrongly redrawn with five bonds',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const hex = (cx, cy, r) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const t = (Math.PI / 180) * (90 + i * 60);
        pts.push(P(cx + r * Math.cos(t), cy - r * Math.sin(t)));
      }
      return pts;
    };
    const ringSkeleton = (pts) => {
      let g = '';
      for (let i = 0; i < 6; i++) g += bond(pts[i], pts[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      for (const pt of pts) g += atom(pt.x, pt.y, '', { kind: 'point' });
      return g;
    };

    // ---- Cyclohexane ----
    s += tag(118, 44, 'A BARE HEXAGON');
    const h1 = hex(118, 140, 50);
    s += ringSkeleton(h1);
    s += text(118, 218, 'six corners, six carbons', { cls: 'fg-sm', size: 10 });
    s += text(118, 236, 'two H on each: C₆H₁₂', { cls: 'fg-tag-good', size: 10.5 });
    s += text(118, 256, 'cyclohexane', { cls: 'fg-lbl', size: 12 });

    s += rule(236, 34, 236, 274);

    // ---- Benzene, both conventions ----
    s += tag(378, 44, 'BENZENE, TWO WAYS');
    const h2 = hex(316, 140, 44);
    s += ringSkeleton(h2);
    for (const i of [0, 2, 4]) s += ringDouble(h2[i], h2[(i + 1) % 6], P(316, 140));
    const h3 = hex(440, 140, 44);
    s += ringSkeleton(h3);
    s += `<circle class="fg-bond" cx="440" cy="140" r="26" fill="none"></circle>`;
    s += text(378, 218, 'alternating double bonds, or a circle', { cls: 'fg-sm', size: 10 });
    s += text(378, 236, 'one H on each: C₆H₆', { cls: 'fg-tag-good', size: 10.5 });
    s += text(378, 256, 'same molecule, two conventions', { cls: 'fg-lbl', size: 12 });

    s += rule(520, 34, 520, 274);

    // ---- The five-bond slip ----
    s += tag(630, 44, 'THE FIVE-BOND SLIP');
    s += text(630, 78, '2 bonds + 2 H = 4 ✓', { cls: 'fg-tag-good', size: 10.5 });
    const ok = [P(586, 118), P(630, 94), P(674, 118)];
    for (let i = 1; i < ok.length; i++) s += bond(ok[i - 1], ok[i], { rFrom: 0, rTo: 0 });
    for (const pt of ok) s += atom(pt.x, pt.y, '', { kind: 'point' });
    const bad = [P(586, 178), P(630, 154), P(674, 178)];
    for (let i = 1; i < bad.length; i++) s += bond(bad[i - 1], bad[i], { rFrom: 0, rTo: i === 1 ? 15 : 0 });
    s += bond(bad[1], bad[2], { rFrom: 15, rTo: 0 });
    s += atom(586, 178, '', { kind: 'point' });
    s += atom(674, 178, '', { kind: 'point' });
    s += atom(630, 154, 'CH₃', { kind: 'warn', size: 9.5 });
    s += text(630, 202, '2 bonds + 3 H = 5 ✗', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(630, 228, 'the vertex is already a carbon,', { cls: 'fg-sm', size: 10 });
    s += text(630, 244, 'so writing CH₃ on it adds a bond', { cls: 'fg-sm', size: 10 });
    s += text(630, 260, 'that was never there', { cls: 'fg-sm', size: 10 });

    s += rule(34, 274, 726, 274);
    s += text(380, 292, 'A ring vertex is read exactly like a chain vertex.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Three things the prose can only assert: what a bare hexagon means, the two accepted ways of marking benzene, and what going wrong looks like.',
  note: 'The circle inside the ring is the honest drawing &mdash; benzene has no alternating single and double bonds, it has one delocalized system and six identical C&ndash;C bonds. The alternating-bond drawing survives because you can push arrows on it and because it lets you count hydrogens the ordinary way; the circle cannot do either. Both appear in exams, and neither is wrong to write.',
});


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


/* ---------------------------------------------------------------- 103 ---
   The four arrow-pushing patterns. The notes had shown two of them (a
   protonation and an SN2) and the practice bank was already testing a
   hydride shift and a lone departure, so a student met two patterns in
   prose and four in the questions. All four, drawn on real molecules with
   the charges worked out, is the whole vocabulary on one page. */
FIGURES.push({
  id: 'arrow-patterns',
  section: 'curved-arrows',
  anchor: '<h3>The four patterns, and that is the whole list</h3>',
  alt: 'Four arrow-pushing patterns drawn on real molecules: nucleophilic attack on a carbocation, loss of bromide from a tertiary bromide, proton transfer from HCl to hydroxide, and a 1,2-hydride shift',
  viewBox: '0 0 760 430',
  build() {
    let s = '';

    // ---- 1. Nucleophilic attack, one arrow, because the target has room ----
    s += tag(190, 42, '1 \u00b7 NUCLEOPHILIC ATTACK');
    s += atom(96, 116, 'HO\u207b', { kind: 'hi', size: 10.5 });
    for (const ang of [-150, -90, 150]) s += lonePair(96, 116, ang, { dist: 24 });
    s += atom(266, 116, 'C\u207a', { kind: 'warn', size: 11 });
    s += text(266, 148, '(CH\u2083)\u2083C\u207a', { cls: 'fg-sm', size: 9.5 });
    s += curve(P(120, 100), P(248, 108), { bow: -26 });
    s += text(190, 174, 'one arrow is the whole step:', { cls: 'fg-sm', size: 10 });
    s += text(190, 190, 'the carbon has an empty orbital,', { cls: 'fg-sm', size: 10 });
    s += text(190, 206, 'so nothing has to break', { cls: 'fg-sm', size: 10 });

    s += rule(380, 34, 380, 396);

    // ---- 2. Loss of a leaving group, one arrow, no attacker at all ----
    s += tag(560, 42, '2 \u00b7 LOSS OF A LEAVING GROUP');
    s += atom(492, 116, 'C', { size: 11 });
    s += text(492, 148, '(CH\u2083)\u2083C', { cls: 'fg-sm', size: 9.5 });
    s += atom(614, 116, 'Br', { size: 11 });
    s += bond(P(492, 116), P(614, 116));
    s += curve(P(553, 116), P(614, 96), { bow: -20 });
    s += text(560, 174, 'tail on the C\u2013Br bond, head on Br:', { cls: 'fg-sm', size: 10 });
    s += text(560, 190, 'carbon keeps three bonds and goes +1,', { cls: 'fg-sm', size: 10 });
    s += text(560, 206, 'bromine keeps the pair and goes \u22121', { cls: 'fg-sm', size: 10 });

    s += rule(34, 226, 726, 226);

    // ---- 3. Proton transfer, two arrows, always ----
    s += tag(190, 258, '3 \u00b7 PROTON TRANSFER');
    s += atom(86, 330, 'HO\u207b', { kind: 'hi', size: 10.5 });
    for (const ang of [-150, -90, 150]) s += lonePair(86, 330, ang, { dist: 24 });
    s += atom(212, 330, 'H', { size: 11 });
    s += atom(310, 330, 'Cl', { size: 11 });
    s += bond(P(212, 330), P(310, 330));
    s += curve(P(110, 314), P(196, 318), { bow: -22 });
    s += curve(P(261, 330), P(310, 310), { bow: -18 });
    s += text(190, 380, 'arrow 1 makes the new O\u2013H bond;', { cls: 'fg-sm', size: 10 });
    s += text(190, 396, 'arrow 2 breaks the old H\u2013Cl bond', { cls: 'fg-sm', size: 10 });

    // ---- 4. Rearrangement: a sigma bond is a legal electron source ----
    s += tag(560, 258, '4 \u00b7 1,2-HYDRIDE SHIFT');
    s += atom(492, 330, 'C', { size: 11 });
    s += atom(492, 282, 'H', { size: 10.5 });
    s += bond(P(492, 330), P(492, 282));
    s += atom(614, 330, 'C\u207a', { kind: 'warn', size: 11 });
    s += bond(P(492, 330), P(614, 330));
    s += curve(P(492, 306), P(600, 314), { bow: -30 });
    s += text(560, 380, 'the C\u2013H pair moves onto the cation;', { cls: 'fg-sm', size: 10 });
    s += text(560, 396, 'the + ends up where it came from', { cls: 'fg-sm', size: 10 });

    s += rule(34, 408, 726, 408);
    s += text(380, 424, 'Every mechanism in the course is these four, in some order.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The complete vocabulary. Two of these need a partner arrow and two do not, and the difference is only ever whether the destination already has a full valence shell.',
  note: 'Pattern 2 is the one to practice deliberately. It is the only pattern where nothing attacks anything &mdash; a bond just breaks, with both electrons going to one side &mdash; and because there is no attacker to point at, students often refuse to draw it and then cannot start an S<sub>N</sub>1 or an E1. The test is the same as always: name the pair the tail stands on. Here it is the C&ndash;Br bonding pair, which is a perfectly ordinary place for an arrow to begin.',
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





/* ---------------------------------------------------------------- 107 ---
   Chapter 4 had one drawn proton transfer, HCl + NH3, and not one organic
   one. The notes insist that "the second arrow is not optional" and then
   never show both arrows on a molecule a student will actually meet. */
FIGURES.push({
  id: 'organic-proton-transfer',
  section: 'bronsted',
  anchor: 'which is why carboxylate salts are trivially easy to make and why a carboxylic acid cannot survive in a flask containing an alkoxide.</p>',
  alt: 'Methoxide removing the O-H proton of acetic acid, drawn skeletally with both curved arrows: one from a methoxide lone pair to the hydrogen, one from the O-H bond back onto oxygen',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(250, 36, 'TWO ARROWS, ONE PROTON');

    // ---- acetic acid ----
    const me = P(120, 190), c = P(172, 160), o1 = P(172, 100), o2 = P(224, 190), h = P(272, 166);
    s += bond(me, c, { rFrom: 0, rTo: 0 });
    s += bond(c, o1, { rFrom: 0, rTo: 15, order: 2 });
    s += bond(c, o2, { rFrom: 0, rTo: 15 });
    s += bond(o2, h, { rFrom: 15, rTo: 15 });
    s += atom(me.x, me.y, '', { kind: 'point' });
    s += atom(c.x, c.y, '', { kind: 'point' });
    s += atom(o1.x, o1.y, 'O', { size: 11 });
    s += atom(o2.x, o2.y, 'O', { size: 11 });
    s += atom(h.x, h.y, 'H', { kind: 'warn', size: 11 });
    for (const ang of [-40, -140]) s += lonePair(o1.x, o1.y, ang, { dist: 24 });
    for (const ang of [60, 120]) s += lonePair(o2.x, o2.y, ang, { dist: 24 });
    s += text(160, 262, 'acetic acid, pKa 4.76', { cls: 'fg-sm', size: 10 });

    // ---- methoxide ----
    const mo = P(360, 126), mc = P(412, 96);
    s += bond(mo, mc, { rFrom: 16, rTo: 0 });
    s += atom(mo.x, mo.y, 'O', { kind: 'hi', size: 11 });
    s += atom(mc.x, mc.y, '', { kind: 'point' });
    s += text(386, 106, '−', { cls: 'fg-hi', size: 16 });
    for (const ang of [135, 180, 225]) s += lonePair(mo.x, mo.y, ang, { dist: 24 });
    s += text(392, 214, 'methoxide, CH₃O⁻', { cls: 'fg-sm', size: 10 });

    // ---- arrow 1: base to proton ----
    s += curve(P(338, 122), P(288, 156), { bow: -20 });
    s += tag(276, 70, '1 · the base takes the proton');

    // ---- arrow 2: the bonding pair stays behind ----
    s += curve(P(250, 180), P(222, 208), { bow: -18 });
    s += tag(318, 244, '2 · the bonding pair stays behind');

    s += rule(500, 40, 500, 268);
    s += text(524, 64, 'What you get', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(524, 88, 'methanol, CH₃OH', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 106, 'acetate, CH₃CO₂⁻', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 132, 'Charge in: −1 and 0', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 150, 'Charge out: 0 and −1', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 184, 'Acid used up: 4.76', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 202, 'Acid made: 15.5', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 228, 'Gap of 10.7 units, so', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    s += text(524, 246, 'it goes, completely.', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The same two arrows as the HCl figure, on an acid and a base you will meet in a real flask. Arrow one makes the new O–H bond out of a methoxide lone pair; arrow two leaves the old bonding pair behind on acetic acid’s oxygen, which is what makes the conjugate base negative.',
  note: 'Draw only arrow two and you have described acetic acid falling apart by itself, which it does not do. Draw only arrow one and the hydrogen ends up with two bonds. The pair of arrows is not decoration &mdash; it is the electron bookkeeping, and the charge check at the right is how you know it balances.',
});


/* ---------------------------------------------------------------- 108 ---
   "Which proton comes off, and which site gets protonated" is the most
   asked question on this topic and the chapter never ran it on a molecule
   with more than one candidate. */
FIGURES.push({
  id: 'acid-base-site-scan',
  section: 'bronsted',
  anchor: 'protonate this molecule with one equivalent of HCl and the proton goes to nitrogen every time, giving the ammonium salt and leaving the alcohol untouched.</p>',
  alt: 'A skeletal drawing of 4-aminobutan-1-ol with each kind of hydrogen labeled by pKa with the nitrogen lone pair marked as the basic site',
  viewBox: '0 0 760 290',
  build() {
    let s = '';
    s += tag(250, 36, 'ONE MOLECULE, TWO DIFFERENT ANSWERS');

    const n = P(104, 176), c1 = P(164, 142), c2 = P(224, 176), c3 = P(284, 142), c4 = P(344, 176), o = P(404, 142);
    s += bond(n, c1, { rFrom: 22, rTo: 0 });
    s += bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += bond(c2, c3, { rFrom: 0, rTo: 0 });
    s += bond(c3, c4, { rFrom: 0, rTo: 0 });
    s += bond(c4, o, { rFrom: 0, rTo: 19 });
    s += atom(n.x, n.y, 'H₂N', { kind: 'hi', r: 22, size: 10 });
    s += atom(o.x, o.y, 'OH', { kind: 'warn', r: 19, size: 10.5 });
    for (const pt of [c1, c2, c3, c4]) s += atom(pt.x, pt.y, '', { kind: 'point' });
    s += lonePair(n.x, n.y, 180, { dist: 30 });

    s += text(404, 96, 'O–H, pKa 16', { cls: 'fg-tag-warn', size: 11 });
    s += text(404, 78, 'most acidic proton', { cls: 'fg-sm', size: 10 });
    s += text(104, 222, 'N–H, pKa 38', { cls: 'fg-sm', size: 10 });
    s += text(104, 240, 'lone pair: most basic site', { cls: 'fg-tag-good', size: 10.5 });
    s += text(254, 226, 'C–H, pKa about 50', { cls: 'fg-sm', size: 10 });
    s += text(254, 244, 'never in the running', { cls: 'fg-sm', size: 10 });
    s += text(250, 268, '4-aminobutan-1-ol', { cls: 'fg-sm', size: 10 });

    s += rule(500, 40, 500, 272);
    s += text(524, 64, 'Add one equivalent of', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(524, 88, 'NaH → takes the O–H.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 106, 'It is 22 units below the', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 124, 'N–H, so nothing else', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 142, 'competes for the base.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 178, 'HCl → goes to nitrogen.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 196, 'Both atoms have pairs,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 214, 'but nitrogen holds its', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 232, 'more loosely and gives', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(524, 250, 'it up more willingly.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    return s;
  },
  caption: 'The scan run on a molecule that has an O–H, an N–H and six C–H bonds. The acid question and the base question have different answers, on opposite ends of the same molecule — which is why they have to be asked separately.',
  note: 'The order the scan runs in matters more than it looks. Check O–H and N–H first and you are done in one pass on most molecules; start with the carbons and you will spend the paper arguing about a proton that is thirty orders of magnitude out of contention.',
});


/* ---------------------------------------------------------------- 109 ---
   The notes said an acid in a mechanism "might be a protonated intermediate
   generated two steps earlier" and never drew one, so the commonest acids in
   the whole book went unillustrated. */
FIGURES.push({
  id: 'cation-acids',
  section: 'bronsted',
  anchor: 'protonation invents an acidic hydrogen where there was none.</p>',
  alt: 'Three cationic acids drawn side by side: hydronium, a protonated alcohol and a protonated carbonyl, each with its pKa and its neutral parent',
  viewBox: '0 0 760 268',
  build() {
    let s = '';
    s += tag(380, 36, 'THE ACID IS USUALLY A CATION');

    const panels = [
      { x: 140, name: 'hydronium', pka: 'pKa −1.7', from: 'from water, 15.7' },
      { x: 380, name: 'protonated alcohol', pka: 'pKa about −2', from: 'from an alcohol, 16' },
      { x: 620, name: 'protonated carbonyl', pka: 'pKa about −7', from: 'from a ketone, no O–H at all' },
    ];

    // --- hydronium ---
    {
      const o = P(140, 122), h1 = P(92, 152), h2 = P(188, 152), h3 = P(140, 76);
      s += bond(o, h1, { rTo: 12 }); s += bond(o, h2, { rTo: 12 }); s += bond(o, h3, { rTo: 12 });
      s += atom(o.x, o.y, 'O', { kind: 'warn', size: 12 });
      s += atom(h1.x, h1.y, 'H', { r: 12, size: 10 });
      s += atom(h2.x, h2.y, 'H', { r: 12, size: 10 });
      s += atom(h3.x, h3.y, 'H', { r: 12, size: 10 });
      s += text(172, 96, '+', { cls: 'fg-tag-warn', size: 14 });
      s += lonePair(o.x, o.y, 180, { dist: 24 });
    }
    // --- protonated alcohol ---
    {
      const o = P(380, 122), r = P(332, 152), h1 = P(428, 152), h2 = P(380, 76);
      s += bond(o, r, { rTo: 20 }); s += bond(o, h1, { rTo: 12 }); s += bond(o, h2, { rTo: 12 });
      s += atom(o.x, o.y, 'O', { kind: 'warn', size: 12 });
      s += atom(r.x, r.y, 'R', { r: 20, size: 11 });
      s += atom(h1.x, h1.y, 'H', { r: 12, size: 10 });
      s += atom(h2.x, h2.y, 'H', { r: 12, size: 10 });
      s += text(412, 96, '+', { cls: 'fg-tag-warn', size: 14 });
      s += lonePair(o.x, o.y, 180, { dist: 24 });
    }
    // --- protonated carbonyl ---
    {
      const c = P(596, 150), o = P(596, 92), h = P(648, 62), r1 = P(544, 180), r2 = P(648, 180);
      s += bond(c, o, { rFrom: 15, rTo: 15, order: 2 });
      s += bond(o, h, { rFrom: 15, rTo: 12 });
      s += bond(c, r1, { rFrom: 15, rTo: 18 });
      s += bond(c, r2, { rFrom: 15, rTo: 18 });
      s += atom(c.x, c.y, 'C', { size: 12 });
      s += atom(o.x, o.y, 'O', { kind: 'warn', size: 12 });
      s += atom(h.x, h.y, 'H', { r: 12, size: 10 });
      s += atom(r1.x, r1.y, 'R', { r: 18, size: 11 });
      s += atom(r2.x, r2.y, 'R', { r: 18, size: 11 });
      s += text(562, 70, '+', { cls: 'fg-tag-warn', size: 14 });
      s += lonePair(o.x, o.y, 180, { dist: 24 });
    }

    for (const p of panels) {
      s += text(p.x, 214, p.name, { cls: 'fg-sm', size: 10 });
      s += text(p.x, 232, p.pka, { cls: 'fg-tag-warn', size: 11 });
      s += text(p.x, 252, p.from, { cls: 'fg-sm', size: 10 });
    }
    return s;
  },
  caption: 'Three acids that appear in mechanisms constantly and in reagent bottles never. Each is made by protonating something neutral, and each gives that proton straight back to anything mildly basic — which is exactly what makes them useful intermediates rather than reagents.',
  note: 'The reason a full positive charge is worth seventeen or eighteen pK<sub>a</sub> units is visible in the drawing: when the proton leaves, the charge does not move somewhere else, it disappears. Every other acid on the ladder has to find a home for a negative charge it has just created. These three simply stop being charged.',
});


/* ---------------------------------------------------------------- 110 ---
   The Lewis section described three organic Lewis acid-base events in prose
   and drew none of them; the one worked example was BF3 + NH3, which is the
   one case with no carbon in it. */
FIGURES.push({
  id: 'carbocation-lewis-acid',
  section: 'lewis-acids',
  anchor: 'Students routinely draw this product neutral on both atoms, and the formal-charge count is what catches it.</p>',
  alt: 'The tert-butyl cation accepting a lone pair from water, drawn with one curved arrow and with the formal charge moving from carbon to oxygen',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    s += tag(250, 36, 'A LEWIS ACID–BASE STEP WITH NO PROTON IN IT');

    // ---- the cation ----
    const c = P(140, 146), m1 = P(88, 110), m2 = P(192, 110), m3 = P(140, 206);
    s += bond(c, m1, { rFrom: 16, rTo: 0 }); s += bond(c, m2, { rFrom: 16, rTo: 0 }); s += bond(c, m3, { rFrom: 16, rTo: 0 });
    s += atom(c.x, c.y, 'C', { kind: 'warn', size: 12 });
    for (const pt of [m1, m2, m3]) s += atom(pt.x, pt.y, '', { kind: 'point' });
    s += text(172, 118, '+', { cls: 'fg-tag-warn', size: 15 });
    s += text(140, 244, 'tert-butyl cation', { cls: 'fg-sm', size: 10 });
    s += text(140, 262, 'six electrons, empty p orbital', { cls: 'fg-sm', size: 10 });

    // ---- water ----
    const o = P(330, 106), wh1 = P(378, 78), wh2 = P(378, 136);
    s += bond(o, wh1, { rTo: 12 }); s += bond(o, wh2, { rTo: 12 });
    s += atom(o.x, o.y, 'O', { kind: 'hi', size: 12 });
    s += atom(wh1.x, wh1.y, 'H', { r: 12, size: 10 });
    s += atom(wh2.x, wh2.y, 'H', { r: 12, size: 10 });
    for (const ang of [160, 210]) s += lonePair(o.x, o.y, ang, { dist: 24 });
    s += text(330, 174, 'water, the Lewis base', { cls: 'fg-sm', size: 10 });

    // ---- the arrow ----
    s += curve(P(300, 100), P(162, 136), { bow: -34 });
    s += tag(240, 62, 'one arrow · no bond breaks');

    // ---- product ----
    s += rule(456, 40, 456, 264);
    const pc = P(556, 146), pm1 = P(504, 110), pm2 = P(556, 206), pm3 = P(500, 180), po = P(626, 118), ph1 = P(676, 88), ph2 = P(676, 148);
    s += bond(pc, pm1, { rFrom: 16, rTo: 0 });
    s += bond(pc, pm2, { rFrom: 16, rTo: 0 });
    s += bond(pc, pm3, { rFrom: 16, rTo: 0 });
    s += bond(pc, po, { rFrom: 16, rTo: 15 });
    s += bond(po, ph1, { rFrom: 15, rTo: 12 });
    s += bond(po, ph2, { rFrom: 15, rTo: 12 });
    s += atom(pc.x, pc.y, 'C', { size: 12 });
    s += atom(pm1.x, pm1.y, '', { kind: 'point' });
    s += atom(pm2.x, pm2.y, '', { kind: 'point' });
    s += atom(pm3.x, pm3.y, '', { kind: 'point' });
    s += atom(po.x, po.y, 'O', { kind: 'warn', size: 12 });
    s += atom(ph1.x, ph1.y, 'H', { r: 12, size: 10 });
    s += atom(ph2.x, ph2.y, 'H', { r: 12, size: 10 });
    s += lonePair(po.x, po.y, 250, { dist: 24 });
    s += text(658, 92, '+', { cls: 'fg-tag-warn', size: 15 });
    s += text(556, 244, 'an oxonium ion', { cls: 'fg-sm', size: 10 });
    s += text(596, 262, 'carbon neutral · oxygen +1', { cls: 'fg-tag-warn', size: 11 });
    return s;
  },
  caption: 'SN1’s second step, described honestly. The carbocation is the electron-pair acceptor and water is the donor, so this is a Lewis acid–base reaction — the same event as BF₃ plus ammonia, with carbon in place of boron.',
  note: 'Follow the charge rather than assuming it cancels. It started on carbon and ended on oxygen, because oxygen supplied both electrons of the new bond and got no share of them back. The neutral alcohol appears only after a second, Brønsted step removes that proton &mdash; two definitions, one mechanism, one step each.',
});


/* ---------------------------------------------------------------- 111 ---
   The bicarbonate separation is the classic exam and lab question and the
   notes taught it in three sentences with nothing to look at. */
FIGURES.push({
  id: 'bicarbonate-extraction',
  section: 'pka',
  anchor: '<p>This is a real laboratory separation, and it rests on nothing but two pKa comparisons.</p>',
  alt: 'A separatory funnel with an upper ether layer holding the neutral phenol and a lower aqueous layer holding the carboxylate salt, with the two pKa comparisons written beside it',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    s += tag(192, 36, 'ONE REAGENT, TWO LAYERS');

    // ---- the funnel: a body with two layers and a stem ----
    s += panel(56, 64, 272, 176, { r: 14 });
    s += bar(60, 68, 264, 82, { kind: 'mut', r: 10, opacity: 0.12 });
    s += bar(60, 152, 264, 84, { kind: 'hi', r: 10, opacity: 0.3 });
    s += rule(60, 150, 328, 150);
    s += rule(178, 240, 178, 278);
    s += rule(206, 240, 206, 278);

    s += text(192, 98, 'ORGANIC LAYER \u2014 ether, on top', { cls: 'fg-tag-mut', size: 11 });
    s += text(192, 122, 'PhOH', { cls: 'fg-lbl', size: 13 });
    s += text(192, 140, 'still neutral \u2014 stays put', { cls: 'fg-sm', size: 10 });

    s += text(192, 180, 'AQUEOUS LAYER \u2014 denser, below', { cls: 'fg-tag', size: 11 });
    s += text(192, 204, 'RCO\u2082\u207b Na\u207a', { cls: 'fg-lbl', size: 13 });
    s += text(192, 222, 'charged \u2014 dissolves in water', { cls: 'fg-sm', size: 10 });

    s += text(192, 300, 'run the bottom (aqueous) layer off', { cls: 'fg-sm', size: 10 });

    s += rule(376, 48, 376, 300);

    s += text(404, 74, 'The base is NaHCO\u2083.', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(404, 94, 'Its conjugate acid is carbonic acid, pKa 6.4,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 112, 'so it deprotonates anything below 6.4 and', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 130, 'nothing above it.', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(404, 168, 'RCO\u2082H, pKa 4.76', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(404, 186, '1.6 units below \u2014 deprotonated, goes ionic,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 204, 'and moves into the water.', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(404, 240, 'PhOH, pKa 10', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(404, 258, '3.6 units above \u2014 not touched, stays neutral,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(404, 276, 'and stays up in the ether.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    return s;
  },
  caption: 'Why the reagent is bicarbonate and not hydroxide. Hydroxide (conjugate acid water, pKa 15.7) is strong enough to deprotonate both compounds, so both would end up in the aqueous layer and nothing would be separated. Bicarbonate sits deliberately between the two pKa values.',
  note: 'This is the general shape of every extraction you will run: pick a base whose conjugate-acid pK<sub>a</sub> falls <i>between</i> the two compounds you want apart. Charged species go into water, neutral ones stay in the organic layer, and the funnel does the rest. Acidifying the aqueous layer afterwards puts the proton back and gives the carboxylic acid out clean.',
});


/* ---------------------------------------------------------------- 112 ---
   Every conjugate in this section was inorganic. The conjugates students are
   actually asked for are an alcohol's and an amine's, in both directions. */
FIGURES.push({
  id: 'organic-conjugates',
  section: 'conjugate',
  anchor: '<p><b>The same operation on the groups you will meet later:</b> the conjugate acid of a ketone is the protonated carbonyl C=OH⁺; the conjugate base of a ketone is the enolate; the conjugate base of a terminal alkyne is the acetylide. In each case, count one H and one unit of charge, and change nothing else.</p>',
  alt: 'Two rows showing ethanol and ethylamine each flanked by their conjugate acid on the left and conjugate base on the right, with pKa values under each',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    s += tag(380, 34, 'ONE PROTON EITHER SIDE OF THE MOLECULE YOU STARTED WITH');

    /* A two-carbon skeleton ending in a heteroatom, drawn at a given origin.
       `extra` is what hangs off the heteroatom, `charge` the sign to write. */
    const chain = (ox, oy, el, extra, charge, kind) => {
      let g = '';
      const a = P(ox, oy + 30), b = P(ox + 46, oy), x = P(ox + 92, oy + 30);
      g += bond(a, b, { rFrom: 0, rTo: 0 });
      g += bond(b, x, { rFrom: 0, rTo: 17 });
      g += atom(a.x, a.y, '', { kind: 'point' });
      g += atom(b.x, b.y, '', { kind: 'point' });
      g += atom(x.x, x.y, el, { kind, r: 17, size: el.length > 2 ? 9.5 : 11 });
      if (extra) g += text(x.x + 31, x.y + 5, extra, { cls: 'fg-lbl', size: 12, anchor: 'start' });
      if (charge) g += text(x.x + 6, x.y - 26, charge, { cls: kind === 'hi' ? 'fg-hi' : 'fg-warn', size: 15 });
      return g;
    };

    const row = (y, title, acid, acidPka, mid, base, basePka) => {
      let g = '';
      g += chain(60, y, acid[0], acid[1], '+', 'warn');
      g += chain(300, y, mid[0], mid[1], '', 'plain');
      g += chain(540, y, base[0], base[1], '−', 'hi');
      g += arrow(P(240, y + 30), P(288, y + 30), { muted: true });
      g += arrow(P(480, y + 30), P(528, y + 30), { muted: true });
      g += text(106, y + 74, acid[2], { cls: 'fg-sm', size: 10 });
      g += text(106, y + 92, acidPka, { cls: 'fg-tag-warn', size: 11 });
      g += text(346, y + 74, mid[2], { cls: 'fg-sm', size: 10 });
      g += text(346, y + 92, title, { cls: 'fg-tag', size: 11 });
      g += text(586, y + 74, base[2], { cls: 'fg-sm', size: 10 });
      g += text(586, y + 92, basePka, { cls: 'fg-tag-good', size: 11 });
      g += text(264, y + 8, '−H⁺', { cls: 'fg-sm', size: 10 });
      g += text(504, y + 8, '−H⁺', { cls: 'fg-sm', size: 10 });
      return g;
    };

    s += row(64, 'the alcohol',
      ['O', 'H₂', 'conjugate acid'], 'pKa about −2',
      ['O', 'H', 'ethanol'],
      ['O', '', 'conjugate base'], 'parent pKa 16');

    s += rule(40, 178, 720, 178);

    s += row(210, 'the amine',
      ['N', 'H₃', 'conjugate acid'], 'pKa about 10.7',
      ['N', 'H₂', 'ethylamine'],
      ['N', 'H', 'conjugate base'], 'parent pKa 38');
    return s;
  },
  caption: 'The operation, run forwards and backwards on the two functional groups exams ask about. Left of center you have added a proton and a positive charge; right of center you have removed a proton and gone down one unit of charge. Nothing else about the molecule changes.',
  note: 'Which of the two you will actually meet is decided by the numbers underneath. An ammonium ion at pK<sub>a</sub> 10.7 forms whenever an amine meets any ordinary acid; the amide anion beside it needs butyllithium, because its parent N&ndash;H is pK<sub>a</sub> 38. Same operation, wildly different difficulty.',
});


/* ---------------------------------------------------------------- 113 ---
   "Phenoxide delocalizes its charge into the aromatic ring" was a sentence
   with no picture, in a section whose own pitfall box says to draw both
   conjugate bases before reasoning. */
FIGURES.push({
  id: 'phenoxide-resonance',
  section: 'acidity-factors',
  anchor: 'Six units more acidic than an alcohol, five units less acidic than a carboxylic acid.</p>',
  alt: 'The four resonance structures of phenoxide: the charge on oxygen, then on the ortho, para and other ortho carbons of the ring',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(380, 34, 'WHERE PHENOXIDE’S CHARGE ACTUALLY GOES');

    /* Ring vertices, index 0 at the top (bearing the oxygen), then clockwise:
       1 and 5 are ortho, 2 and 4 are meta, 3 is para. When the charge moves
       off oxygen and onto a ring carbon, the C\u2013O bond becomes a C=O double
       bond \u2014 that is the bond the electrons came out of, and leaving it
       single is the commonest way this picture is drawn wrongly. */
    const drawRing = (cx, cy, r, chargeAt, doubles) => {
      let g = '';
      const onO = chargeAt === 'o';
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        v.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      const mid = P(cx, cy);
      for (let i = 0; i < 6; i++) {
        const a = v[i], b = v[(i + 1) % 6];
        if (doubles.includes(i)) g += ringDouble(a, b, mid, { gap: 4.4, inset: 9 });
        else g += bond(a, b, { rFrom: 0, rTo: 0 });
      }
      const o = P(cx, cy - r - 40);
      g += bond(v[0], o, { rFrom: 0, rTo: 15, order: onO ? 1 : 2 });
      g += atom(o.x, o.y, 'O', { kind: onO ? 'hi' : 'plain', size: 11 });
      for (const ang of onO ? [-40, -90, -140] : [-40, -140]) g += lonePair(o.x, o.y, ang, { dist: 23 });
      if (onO) g += text(o.x + 26, o.y - 4, '\u2212', { cls: 'fg-hi', size: 15 });
      for (let i = 0; i < 6; i++) {
        g += atom(v[i].x, v[i].y, '', { kind: 'point' });
        if (chargeAt === i) {
          const dx = v[i].x - cx, dy = v[i].y - cy;
          const len = Math.hypot(dx, dy) || 1;
          g += text(v[i].x + (dx / len) * 20, v[i].y + (dy / len) * 20 + 4, '\u2212', { cls: 'fg-hi', size: 15 });
        }
      }
      return g;
    };

    const cy = 170, r = 36;
    s += drawRing(96, cy, r, 'o', [0, 2, 4]);
    s += drawRing(288, cy, r, 1, [2, 4]);
    s += drawRing(480, cy, r, 3, [1, 4]);
    s += drawRing(672, cy, r, 5, [1, 3]);

    for (const x of [192, 384, 576]) {
      s += arrow(P(x - 20, cy), P(x + 20, cy), { muted: true });
      s += arrow(P(x + 20, cy + 12), P(x - 20, cy + 12), { muted: true });
    }

    s += text(96, 254, 'charge on oxygen', { cls: 'fg-tag-good', size: 10.5 });
    s += text(96, 272, 'the major contributor', { cls: 'fg-sm', size: 10 });
    s += text(288, 254, 'ortho carbon', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(480, 254, 'para carbon', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(672, 254, 'the other ortho', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(480, 272, 'three carbon contributors — real, but each worth less than the oxygen one', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Four contributors, and the reason phenol lands at pKa 10 rather than at an alcohol’s 16. The charge is genuinely shared with three ring carbons, which is worth six pKa units — and it is still not worth as much as acetate’s deal, where the other place to put the charge is a second oxygen.',
  note: 'Count which positions get the charge: ortho, para, ortho. The meta carbons never receive it, and that pattern is not a detail of this molecule &mdash; it is the same ortho/para bias that decides where substituents end up on a benzene ring later in the course. The arrows that delocalize a phenoxide and the arrows that direct an aromatic substitution are the same arrows.',
});


/* ---------------------------------------------------------------- 114 ---
   The 1,3-dicarbonyl worked example said "the anion now delocalizes onto two
   oxygens rather than one" and drew nothing, which is the one claim in the
   section a picture settles instantly. */
FIGURES.push({
  id: 'diketone-enolate',
  section: 'acidity-factors',
  anchor: '<p>That is roughly as acidic as phenol, and more acidic than ammonium — from a hydrogen on carbon. This is why 1,3-dicarbonyls are the workhorse nucleophiles of',
  alt: 'The three resonance structures of the pentane-2,4-dione anion, with the negative charge on the central carbon and then on each of the two oxygens',
  viewBox: '0 0 760 290',
  build() {
    let s = '';
    s += tag(380, 34, 'ONE CHARGE, THREE PLACES TO PUT IT');

    /* Left carbonyl, central carbon, right carbonyl. `on` says where the
       charge sits: 'c', 'left' or 'right'. */
    const unit = (ox, on) => {
      let g = '';
      const mL = P(ox, 168), cL = P(ox + 44, 138), oL = P(ox + 44, 84);
      const cc = P(ox + 88, 168);
      const cR = P(ox + 132, 138), oR = P(ox + 132, 84), mR = P(ox + 176, 168);
      g += bond(mL, cL, { rFrom: 0, rTo: 0 });
      g += bond(cL, oL, { rFrom: 0, rTo: 15, order: on === 'left' ? 1 : 2 });
      g += bond(cL, cc, { rFrom: 0, rTo: 0, order: on === 'left' ? 2 : 1 });
      g += bond(cc, cR, { rFrom: 0, rTo: 0, order: on === 'right' ? 2 : 1 });
      g += bond(cR, oR, { rFrom: 0, rTo: 15, order: on === 'right' ? 1 : 2 });
      g += bond(cR, mR, { rFrom: 0, rTo: 0 });
      for (const pt of [mL, cL, cc, cR, mR]) g += atom(pt.x, pt.y, '', { kind: 'point' });
      g += atom(oL.x, oL.y, 'O', { kind: on === 'left' ? 'hi' : 'plain', size: 11 });
      g += atom(oR.x, oR.y, 'O', { kind: on === 'right' ? 'hi' : 'plain', size: 11 });
      const pairs = (o, charged) => { let t = ''; for (const ang of charged ? [-40, -90, -140] : [-40, -140]) t += lonePair(o.x, o.y, ang, { dist: 23 }); return t; };
      g += pairs(oL, on === 'left');
      g += pairs(oR, on === 'right');
      if (on === 'left') g += text(oL.x - 26, oL.y - 4, '−', { cls: 'fg-hi', size: 15 });
      if (on === 'right') g += text(oR.x + 26, oR.y - 4, '−', { cls: 'fg-hi', size: 15 });
      if (on === 'c') g += text(cc.x, cc.y + 30, '−', { cls: 'fg-hi', size: 15 });
      return g;
    };

    s += unit(36, 'left');
    s += unit(292, 'c');
    s += unit(548, 'right');
    s += arrow(P(240, 150), P(276, 150), { muted: true });
    s += arrow(P(276, 162), P(240, 162), { muted: true });
    s += arrow(P(496, 150), P(532, 150), { muted: true });
    s += arrow(P(532, 162), P(496, 162), { muted: true });

    s += text(124, 218, 'charge on the left oxygen', { cls: 'fg-tag-good', size: 10.5 });
    s += text(380, 218, 'charge on carbon', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(636, 218, 'charge on the right oxygen', { cls: 'fg-tag-good', size: 10.5 });
    s += text(380, 248, 'pentane-2,4-dione, pKa 9 — as acidic as phenol, from a hydrogen on carbon', { cls: 'fg-sm', size: 10 });
    s += text(380, 270, 'a ketone with one carbonyl manages pKa 20; the second one is worth eleven more units', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The anion an ordinary base can make out of a C–H. The charge spends most of its time on the two oxygens and only a minority of it on the carbon between them — which is why a carbon acid ends up as acidic as a phenol.',
  note: 'The carbon-centered structure is the minor contributor and it is still the one that does the chemistry: it is the carbon, not the oxygen, that attacks an electrophile. A minor contributor is not a rare event &mdash; there is one real anion, and the carbon form is a permanent fraction of it.',
});


/* ---------------------------------------------------------------- 115 ---
   The induction figure showed one trichloroacetate with a text label. The
   claim the table and the prose both turn on is the DISTANCE fall-off, which
   nothing in the section drew. */
FIGURES.push({
  id: 'induction-distance',
  section: 'acidity-factors',
  anchor: 'Move the chlorine three carbons from the acid group and almost nothing is left of the effect.',
  alt: 'Three butanoic acids with the chlorine moved one, two and three carbons from the carboxyl group, with the pKa under each showing the effect fading with distance',
  viewBox: '0 0 760 292',
  build() {
    let s = '';
    s += tag(380, 34, 'INDUCTION FADES BOND BY BOND');

    /* Butanoic acid drawn skeletally, with the chlorine hung off carbon
       `pos` counted from the carboxyl carbon (1 = alpha). */
    const acid = (ox, pos) => {
      let g = '';
      const c1 = P(ox, 150), o1 = P(ox, 96), o2 = P(ox - 46, 180);
      const c2 = P(ox + 46, 180), c3 = P(ox + 92, 150), c4 = P(ox + 138, 180);
      g += bond(c1, o1, { rFrom: 0, rTo: 15, order: 2 });
      g += bond(c1, o2, { rFrom: 0, rTo: 19 });
      g += bond(c1, c2, { rFrom: 0, rTo: 0 });
      g += bond(c2, c3, { rFrom: 0, rTo: 0 });
      g += bond(c3, c4, { rFrom: 0, rTo: 0 });
      g += atom(o1.x, o1.y, 'O', { size: 11 });
      g += atom(o2.x, o2.y, 'OH', { r: 19, size: 10.5 });
      for (const pt of [c1, c2, c3, c4]) g += atom(pt.x, pt.y, '', { kind: 'point' });
      for (const ang of [-40, -140]) g += lonePair(o1.x, o1.y, ang, { dist: 23 });
      const host = [c2, c3, c4][pos - 1];
      const cl = P(host.x, host.y + 44);
      g += bond(host, cl, { rFrom: 0, rTo: 16 });
      g += atom(cl.x, cl.y, 'Cl', { kind: 'warn', size: 11 });
      return g;
    };

    s += acid(108, 1);
    s += acid(348, 2);
    s += acid(588, 3);

    const rows = [
      [108, 'on the alpha carbon', 'pKa 2.86 \u00b7 the full effect'],
      [348, 'one carbon further out', 'pKa 4.06 \u00b7 most of it gone'],
      [588, 'three carbons from the acid', 'pKa 4.52 \u00b7 all but gone'],
    ];
    for (const [x, where, pka] of rows) {
      s += text(x + 46, 254, pka, { cls: 'fg-tag-warn', size: 11 });
      s += text(x + 46, 274, where, { cls: 'fg-sm', size: 10 });
    }
    s += text(380, 66, 'butanoic acid itself is pKa 4.82 — read each number against that', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The same chlorine on the same acid, moved one bond at a time. Almost two pKa units on the alpha carbon, about three quarters of a unit one bond further out, and essentially nothing by the third.',
  note: 'That fall-off is what tells induction apart from resonance in an exam question. Resonance runs the length of a conjugated system losing very little &mdash; a nitro group four bonds away across a benzene ring still moves a phenol’s pK<sub>a</sub> by three units. Induction is gone in two.',
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

/* ---------------------------------------------------------------- ch5.1 ---
   The conversion the section describes and never performs. */
FIGURES.push({
  id: 'structure-to-newman',
  section: 'newman',
  anchor: '<p class="step-body">Practical advice: identify the bond you are looking down before you draw anything, and label the front and back atoms on the original structure. Most Newman errors are not drawing errors but bookkeeping errors — a substituent placed on the wrong carbon.</p>',
  alt: 'A skeletal drawing of butane with the C2 to C3 bond highlighted and the front and back carbons labeled, and beside it the anti Newman projection obtained by sighting down that bond',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(180, 34, 'STEP 1 — MARK THE BOND, AND WHICH END IS WHICH');
    const c1 = P(58, 178), c2 = P(116, 144), c3 = P(174, 178), c4 = P(232, 144);
    s += bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += bond(c2, c3, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(c3, c4, { rFrom: 0, rTo: 0 });
    for (const p of [c1, c2, c3, c4]) s += atom(p.x, p.y, '', { kind: 'point' });
    s += text(58, 200, 'C1', { cls: 'fg-sm', size: 10 });
    s += text(232, 166, 'C4', { cls: 'fg-sm', size: 10 });
    s += text(116, 122, 'C2', { cls: 'fg-tag-warn', size: 11 });
    s += text(174, 202, 'C3', { cls: 'fg-tag', size: 11 });
    s += text(116, 108, 'FRONT', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(174, 218, 'BACK', { cls: 'fg-tag', size: 10.5 });
    s += text(150, 252, 'C2 carries CH₃ + H + H', { cls: 'fg-sm', size: 10 });
    s += text(150, 268, 'C3 carries CH₃ + H + H', { cls: 'fg-sm', size: 10 });

    s += arrow(P(296, 170), P(368, 170), { muted: true });
    s += text(332, 152, 'put your eye', { cls: 'fg-sm', size: 9.5 });
    s += text(332, 192, 'on the red bond', { cls: 'fg-sm', size: 9.5 });
    s += rule(398, 56, 398, 268);

    s += tag(578, 34, 'STEP 2 — DRAW WHAT EACH CARBON CARRIES');
    s += newman(578, 160, 46,
      [[0, 'CH₃'], [120, 'H'], [240, 'H']],
      [[60, 'H'], [180, 'CH₃'], [300, 'H']]);
    s += text(578, 268, 'anti — the two CH₃ groups 180° apart', { cls: 'fg-tag-good', size: 10.5 });
    return s;
  },
  caption: 'The one conversion this section is examined on, done once slowly. Notice that <b>nothing is decided in the drawing</b>: step 1 is pure bookkeeping — which carbon is front, which is back, and what each of them carries besides the bond you are sighting down — and step 2 only writes that bookkeeping out at 120° intervals.',
  note: 'Run it backwards and it is the same list. A Newman with CH₃/H/H on the dot and CH₃/H/H on the circle <i>is</i> butane sighted down C2–C3, and you can redraw the skeleton from it. Almost every mistake in this topic is a group put on the wrong one of the two carbons, which is why labelling front and back on the original structure is worth the five seconds.',
});

/* ---------------------------------------------------------------- ch5.2 ---
   All four butane conformers. The energy curve names four and draws two. */
FIGURES.push({
  id: 'butane-four-conformers',
  section: 'newman',
  anchor: '<p class="step-body">By symmetry there are two equivalent gauche conformations and two equivalent methyl/hydrogen eclipsed ones. The <b>anti</b> conformation is the global minimum, and butane spends roughly 70% of its time there at room temperature, with most of the rest in the two gauche forms.</p>',
  alt: 'The four named conformations of butane drawn as Newman projections in order of energy: anti, gauche, methyl-hydrogen eclipsed and syn',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    s += tag(380, 30, 'ONE ROTATION, FOUR NAMES — IN ORDER OF ENERGY');
    const panels = [
      { x: 108, name: 'anti', deg: '180°', kind: 'staggered', e: '0 (reference)', cls: 'fg-tag-good',
        front: [[0, 'CH₃'], [120, 'H'], [240, 'H']], back: [[60, 'H'], [180, 'CH₃'], [300, 'H']] },
      { x: 289, name: 'gauche', deg: '60°', kind: 'staggered', e: '+0.9', cls: 'fg-tag-good',
        front: [[0, 'CH₃'], [120, 'H'], [240, 'H']], back: [[60, 'CH₃'], [180, 'H'], [300, 'H']] },
      { x: 470, name: 'eclipsed', deg: '120°', kind: 'eclipsed', e: '+3.6', cls: 'fg-tag-warn',
        front: [[0, 'CH₃'], [120, 'H'], [240, 'H']], back: [[7, 'H'], [127, 'CH₃'], [247, 'H']] },
      { x: 651, name: 'syn', deg: '0°', kind: 'eclipsed', e: '+4.5 to 6', cls: 'fg-tag-warn',
        front: [[0, 'CH₃'], [120, 'H'], [240, 'H']], back: [[7, 'CH₃'], [127, 'H'], [247, 'H']] },
    ];
    for (const p of panels) {
      s += newman(p.x, 158, 40, p.front, p.back);
      s += text(p.x, 262, p.name + ' — ' + p.deg, { cls: p.cls, size: 11 });
      s += text(p.x, 280, p.kind, { cls: 'fg-sm', size: 9.5 });
      s += text(p.x, 300, p.e + ' kcal/mol', { cls: 'fg-lbl', size: 11 });
    }
    for (const x of [198, 379, 560]) s += rule(x, 62, x, 290);
    return s;
  },
  caption: 'The four conformers the table names, actually drawn. Read them left to right as one continuous 180° turn of the back carbon: the two methyls start apart, come to 60°, pass through each other twice, and meet head-on. The two <b>staggered</b> forms are dips and the two <b>eclipsed</b> forms are peaks, so a real sample is essentially a mixture of the first two.',
  note: 'The gauche panel is the one to study. It is staggered — every front bond sits in a gap — and it still costs 0.9 kcal/mol, because the two methyls are only 60° apart and are bumping into each other. That is steric strain with no torsional strain anywhere near it, which is why this drawing is the cleanest definition of the difference in the chapter.',
});

/* ---------------------------------------------------------------- ch5.3 ---
   Drawing a chair. The most-needed picture in the chapter, described in
   words only, and every later section depends on being able to do it. */
FIGURES.push({
  id: 'draw-a-chair',
  section: 'cyclohexanes',
  anchor: '<p class="step-body">A drawable chair is a skill worth ten minutes of deliberate practice, because a badly drawn chair makes every axial/equatorial judgement afterwards unreliable. The reliable method: draw two parallel lines offset from each other, then connect their ends with two more pairs of parallel lines, so that the finished shape has <b>three sets of two parallel lines</b>. If your drawing does not have that property, it is not a chair, and the substituent directions will not come out right.</p>',
  alt: 'Four steps building a cyclohexane chair from three pairs of parallel lines, with the finished ring showing its raised and lowered ends',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const bases = [30, 215, 400, 585];
    const labels = [
      ['1 — two parallel lines,', 'offset from each other'],
      ['2 — a second pair,', 'parallel to each other'],
      ['3 — a third pair closes it', '— three pairs in all'],
      ['4 — check the two ends', 'point opposite ways'],
    ];
    bases.forEach((ox, n) => {
      const pts = chair(ox + 66, 168, 0.58);
      const pairs = [[1, 2], [4, 5]];   // drawn first: the shallow pair
      const drawn = [];
      if (n >= 0) drawn.push([1, 2], [4, 5]);
      if (n >= 1) drawn.push([0, 1], [3, 4]);
      if (n >= 2) drawn.push([2, 3], [5, 0]);
      for (const [i, j] of drawn) {
        const hot = (n === 0 && pairs.some(([a, b]) => a === i && b === j)) ||
                    (n === 1 && (i === 0 || i === 3)) ||
                    (n === 2 && (i === 2 || i === 5));
        s += bond(pts[i], pts[j], { rFrom: 0, rTo: 0, cls: hot ? 'fg-bond-hi' : 'fg-bond' });
      }
      if (n === 3) {
        for (const p of pts) s += atom(p.x, p.y, '', { kind: 'point' });
        // The two ends are the highest and lowest vertices, three bonds apart.
        s += bond(pts[2], P(pts[2].x, pts[2].y - 20), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
        s += text(pts[2].x, pts[2].y - 28, 'up end', { cls: 'fg-tag-good', size: 10 });
        s += bond(pts[5], P(pts[5].x, pts[5].y + 20), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
        s += text(pts[5].x, pts[5].y + 34, 'down end', { cls: 'fg-tag-good', size: 10 });
        s += text(ox + 66, 96, 'and four carbons between them', { cls: 'fg-sm', size: 9 });
      }
      s += text(ox + 66, 246, labels[n][0], { cls: 'fg-tag', size: 10.5 });
      s += text(ox + 66, 262, labels[n][1], { cls: 'fg-sm', size: 9.5 });
    });
    s += tag(380, 36, 'A CHAIR IS THREE PAIRS OF PARALLEL LINES — NOTHING ELSE');
    for (const x of [200, 385, 570]) s += rule(x, 62, x, 226);
    return s;
  },
  caption: 'Build it in pairs and it comes out right every time. Each step adds <b>two lines that are parallel to each other</b>, and after three steps the ring is closed and has no other property to check. A drawing that does not decompose into three such pairs is not a chair, and every axial/equatorial call made on it afterwards will be unreliable.',
  note: 'The last panel is the test worth doing on your own drawings: the two ends must point in opposite directions, one up and one down, with the other four carbons level between them. If both ends point the same way you have drawn a boat; if all six are level you have drawn a flat hexagon with a kink in it.',
});

/* ---------------------------------------------------------------- ch5.4 ---
   cis/trans on a ring, and the up-is-not-axial confusion, in one picture. */
FIGURES.push({
  id: 'cis-trans-on-rings',
  section: 'axial-equatorial',
  anchor: '<p class="step-body">That is a statement about the molecule, not about the drawing or the conformation. Getting from one face to the other would mean breaking a bond and remaking it, so cis stays cis for the life of the compound — which is why a cis and a trans ring are two different substances that can be bottled separately, while two chairs of the same compound cannot. (The general machinery for describing arrangements in space, and the rest of the names, belongs to <a class="chapter-ref" href="/ochem/learn.html#m-stereochemistry">Stereochemistry</a>; the up/down reading is all this chapter needs.)</p>',
  alt: 'Flat hexagons showing cis and trans 1,2-dimethylcyclohexane with wedge and hash bonds, and a chair of the cis isomer in which one up methyl is axial and the other up methyl is equatorial',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const hex = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (90 - i * 60) * Math.PI / 180;
        v.push(P(cx + r * Math.cos(a), cy - r * Math.sin(a)));
      }
      return v;
    };
    const drawHex = (cx, cy, kind) => {
      const v = hex(cx, cy, 46);
      let g = v.map((p, i) => bond(p, v[(i + 1) % 6], { rFrom: 0, rTo: 0 })).join('');
      for (const p of v) g += atom(p.x, p.y, '', { kind: 'point' });
      const t1 = P(v[0].x, v[0].y - 32);
      const t2 = P(v[1].x + 28, v[1].y - 16);
      g += wedge(v[0], t1, { rFrom: 0, rTo: 16 });
      g += (kind === 'cis' ? wedge : hash)(v[1], t2, { rFrom: 0, rTo: 16 });
      g += atom(t1.x, t1.y, 'CH₃', { r: 16, size: 9.5 });
      g += atom(t2.x, t2.y, 'CH₃', { r: 16, size: 9.5 });
      g += text(v[0].x - 22, v[0].y + 2, 'C1', { cls: 'fg-sm', size: 9 });
      g += text(v[1].x + 4, v[1].y + 20, 'C2', { cls: 'fg-sm', size: 9 });
      return g;
    };
    s += tag(240, 32, 'THE FLAT DRAWING SAYS WHICH FACE');
    s += drawHex(118, 152, 'trans');
    s += text(118, 238, 'trans — one wedge, one hash', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(118, 256, 'opposite faces: one up, one down', { cls: 'fg-sm', size: 9.5 });
    s += drawHex(330, 152, 'cis');
    s += text(330, 238, 'cis — two wedges', { cls: 'fg-tag-good', size: 10.5 });
    s += text(330, 256, 'same face: both up', { cls: 'fg-sm', size: 9.5 });
    s += text(244, 300, 'A face cannot change without breaking a bond, so this label is permanent.', { cls: 'fg-sm', size: 10 });
    s += rule(472, 54, 472, 300);

    s += tag(618, 32, 'THE CHAIR SAYS AXIAL OR EQUATORIAL');
    const pts = chair(600, 160, 0.72);
    s += chairRing(pts);
    for (const p of pts) s += atom(p.x, p.y, '', { kind: 'point' });
    // C1 = the carbon whose axial points DOWN, so its up bond is equatorial;
    // C2 = its neighbor, whose axial points UP. Both groups end up on the
    // same face, which is what makes the drawing cis.
    const eqUp = equatorialEnd(pts, 1, 34);
    s += bond(pts[1], eqUp, { rFrom: 0, rTo: 16 });
    s += atom(eqUp.x, eqUp.y, 'CH₃', { r: 16, size: 9 });
    const axUp = axialEnd(pts, 2, 36);
    s += bond(pts[2], axUp, { rFrom: 0, rTo: 16 });
    s += atom(axUp.x, axUp.y, 'CH₃', { r: 16, size: 9 });
    s += text(pts[1].x + 6, pts[1].y + 20, 'C1', { cls: 'fg-sm', size: 9 });
    s += text(pts[2].x + 20, pts[2].y + 14, 'C2', { cls: 'fg-sm', size: 9 });
    s += text(618, 250, 'the same cis compound, in one chair', { cls: 'fg-sm', size: 10 });
    s += text(618, 270, 'C1: up and EQUATORIAL', { cls: 'fg-tag', size: 10.5 });
    s += text(618, 286, 'C2: up and AXIAL', { cls: 'fg-tag', size: 10.5 });
    s += text(618, 308, 'both still up, so still cis', { cls: 'fg-tag-good', size: 10.5 });
    return s;
  },
  caption: 'Two different questions about the same two methyl groups. <b>Cis or trans</b> is answered by the flat drawing and is a fact about the compound: same face or opposite faces, fixed for good. <b>Axial or equatorial</b> is answered only by a chair and is a fact about the conformation, which reverses on every flip.',
  note: 'The chair on the right is the whole of the "up is not axial" trap in one picture. Both methyls are up — that is what makes the compound cis — and one of them is axial while the other is equatorial. Flip that ring and the two labels swap over; both groups are still up, and the compound is still cis.',
});




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

FIGURES.push({
  id: 'ring-flip-invariant',
  section: 'ring-flips',
  anchor: '<div class="notes-pitfall"><b>A ring flip is not a rotation of the drawing.</b> If you redraw a chair rotated on the page, up stays up and axial stays axial — nothing has happened. A genuine flip pushes the "up" end of the chair down and the "down" end up, which is why every axial/equatorial assignment reverses. The reliable test: after a correct flip, every substituent should have swapped axial/equatorial and kept its up/down face. If both changed, or neither did, the drawing is wrong.</div>',
  alt: 'Two cyclohexane chairs side by side. In the left chair the methyl-bearing carbon is the raised end and its methyl sits on a vertical bond pointing up, so it is axial. The right chair is the same ring reflected so that carbon is now the lowered end; the methyl sits on an outward bond that still angles upward, so it is equatorial and still on the upper face.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const K = 0.9, CY = 140, I = 2;          // I: the tracked carbon, the up-tip of the left chair

    // ---- left chair: the tracked carbon is the raised end, methyl axial-up ----
    const A = chair(200, CY, K);
    s += chairRing(A);
    for (const p of A) s += atom(p.x, p.y, '', { kind: 'point' });
    const aEnd = axialEnd(A, I, 36);
    s += bond(A[I], aEnd, { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' });
    s += atom(aEnd.x, aEnd.y, 'CH₃', { kind: 'hi', r: 17, size: 10 });
    s += text(A[I].x - 26, A[I].y + 4, 'C1', { cls: 'fg-tag-warn', size: 10 });
    s += tag(200, 26, 'one chair');
    s += text(200, 252, 'C1 is the raised end of this ring', { cls: 'fg-sm', size: 9.5 });
    s += text(200, 274, 'AXIAL — and pointing up', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(200, 294, 'crowded by two 1,3-diaxial hydrogens', { cls: 'fg-sm', size: 9.5 });

    // ---- right chair: the same ring reflected. C1 is now the lowered end ----
    const B = chairFlipped(562, CY, K);
    s += chairRing(B);
    for (const p of B) s += atom(p.x, p.y, '', { kind: 'point' });
    const bEnd = equatorialEndF(B, I, 34);
    s += bond(B[I], bEnd, { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' });
    s += atom(bEnd.x, bEnd.y, 'CH₃', { kind: 'hi', r: 17, size: 10 });
    s += text(B[I].x + 26, B[I].y + 11, 'C1', { cls: 'fg-tag', size: 10, anchor: 'start' });
    // its axial bond now points DOWN, which is why the up bond is the outward one
    s += bond(B[I], axialEndF(B, I, 26), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
    s += text(B[I].x + 18, B[I].y + 30, 'axial now points down', { cls: 'fg-sm', size: 9, anchor: 'start' });
    s += tag(562, 26, 'the other chair');
    s += text(562, 252, 'C1 is now the lowered end', { cls: 'fg-sm', size: 9.5 });
    s += text(562, 274, 'EQUATORIAL — and still pointing up', { cls: 'fg-tag-good', size: 11.5 });
    s += text(562, 294, 'out in the open, crowded by nothing', { cls: 'fg-sm', size: 9.5 });

    // ---- the flip itself ----
    s += arrow(P(330, 112), P(430, 112));
    s += arrow(P(430, 150), P(330, 150), { muted: true });
    s += text(380, 96, 'flip', { cls: 'fg-tag', size: 11.5 });
    s += text(380, 176, '~10⁵ times a second', { cls: 'fg-sm', size: 9 });
    return s;
  },
  caption: 'One methyl group, one carbon, two chairs. Follow it: it was axial and became equatorial, and through the whole motion it never stopped pointing <b>up</b>. That is the invariant that makes the vocabulary work. Which face of the ring a group is on is a fact about the molecule and cannot change without breaking a bond; axial versus equatorial is a fact about the conformation, and it reverses roughly a hundred thousand times a second.',
  note: 'Look at what had to change for that to be true: the <b>ring</b> is redrawn with its ends swapped, so C1 goes from the raised end to the lowered one and its axial direction turns over with it. The methyl then stays on the upper face by moving onto the outward bond. AXIAL and EQUATORIAL swapped; UP stayed UP. If your redrawn chair changed both, or neither, you rotated the page instead of flipping the ring.',
});


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

/* ---------------------------------------------------------------- ch6.1 ---
   The symmetry test, run. The section states the test and then goes to hands
   and screws without ever performing it on a molecule. */
FIGURES.push({
  id: 'symmetry-test-worked',
  section: 'chirality',
  anchor: 'This is the most common source of wrong answers in this section.</div>',
  alt: 'Two wedge-dash structures. 2-chloropropane has a methyl on each side of a vertical mirror line, so the line is a genuine plane of symmetry and the molecule is achiral. 2-chlorobutane has a methyl on one side and an ethyl on the other, so no such plane exists and the molecule is chiral.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const draw = (cx, left, right, ok) => {
      const c = P(cx, 154);
      const lr = left.length > 3 ? 23 : 17, rr = right.length > 3 ? 23 : 17;
      const lLen = left.length > 3 ? 78 : 66, rLen = right.length > 3 ? 78 : 66;
      // the candidate plane first, so the atoms sit on top of it
      let g = `<line class="fg-dash-hi" x1="${cx}" y1="64" x2="${cx}" y2="250"></line>`;
      g += center(c, [
        { deg: 160, len: lLen, rTo: lr },
        { deg: 20, len: rLen, rTo: rr },
        { deg: 270, len: 62, kind: 'wedge', rTo: 16 },
        { deg: 90, len: 62, kind: 'hash', rTo: 12 },
      ]);
      const L = armEnd(c, 160, lLen), R = armEnd(c, 20, rLen);
      const D = armEnd(c, 270, 62), U = armEnd(c, 90, 62);
      g += atom(c.x, c.y, 'C', { kind: 'hi' });
      g += atom(L.x, L.y, left, { r: lr, size: left.length > 3 ? 9 : 10 });
      g += atom(R.x, R.y, right, { r: rr, size: right.length > 3 ? 9 : 10 });
      g += atom(D.x, D.y, 'Cl', { kind: 'warn' });
      g += atom(U.x, U.y, 'H', { r: 12 });
      g += text(D.x + 24, D.y + 4, 'wedge', { cls: 'fg-sm', size: 9, anchor: 'start' });
      g += text(U.x + 20, U.y + 4, 'hash', { cls: 'fg-sm', size: 9, anchor: 'start' });
      g += text(cx, 54, ok ? 'a real plane of symmetry' : 'not a plane of symmetry',
        { cls: ok ? 'fg-tag-good' : 'fg-tag-warn', size: 11 });
      return g;
    };
    s += panel(24, 38, 340, 254, { kind: 'hi' });
    s += draw(194, 'CH₃', 'CH₃', true);
    s += text(194, 278, '2-chloropropane — ACHIRAL', { cls: 'fg-tag-good', size: 11 });
    s += text(194, 310, 'Reflect left into right: methyl onto methyl,', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 324, 'Cl onto Cl, H onto H. The molecule is unchanged.', { cls: 'fg-sm', size: 9.5 });

    s += panel(396, 38, 340, 254, { kind: 'warn' });
    s += draw(566, 'CH₃', 'CH₂CH₃', false);
    s += text(566, 278, '2-chlorobutane — CHIRAL', { cls: 'fg-tag-warn', size: 11 });
    s += text(566, 310, 'The same reflection sends methyl onto ethyl,', { cls: 'fg-sm', size: 9.5 });
    s += text(566, 324, 'which is a different molecule, not this one.', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'The test, run twice on almost the same molecule. Both drawings put Cl on a wedge and H on a hash, so both are mirror-symmetric about the vertical line <b>as far as those two go</b>. Everything turns on what sits left and right of the line: two methyls reflect onto each other and the plane is real, while a methyl and an ethyl do not, and no other plane exists in any conformation.',
  note: 'One carbon’s difference between the two, and it is the difference between a compound that has an enantiomer and one that does not. When you think you have found a plane, name the pair of groups it exchanges and check they are identical all the way out — that is the step that gets skipped.',
});

/* ---------------------------------------------------------------- ch6.2 ---
   Chirality with no stereocenter anywhere. The prose asks the reader to
   picture an allene's two perpendicular ends and a biaryl frozen by its
   ortho groups, which is precisely what prose cannot do. */
FIGURES.push({
  id: 'chirality-without-a-stereocenter',
  section: 'chirality',
  anchor: '<h3>Chirality without a stereocenter</h3>',
  alt: 'Penta-2,3-diene drawn twice as mirror images: the left end carries methyl and hydrogen in the plane of the page and the right end carries them on a wedge and a hash, perpendicular to the first pair. Beside them a biaryl whose second ring is drawn edge-on, with a carboxylic acid and a nitro group on each ring crowding the bond that joins them and blocking it from turning.',
  viewBox: '0 0 760 350',
  build() {
    let s = '';
    const allene = (cx, flip) => {
      const c1 = P(cx - 44, 150), c2 = P(cx, 150), c3 = P(cx + 44, 150);
      let g = bond(c1, c2, { order: 2, rFrom: 0, rTo: 0, gap: 4 });
      g += bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, gap: 4 });
      const lu = P(c1.x - 32, c1.y - 30), ld = P(c1.x - 32, c1.y + 30);
      g += bond(c1, lu, { rFrom: 0, rTo: 17 });
      g += bond(c1, ld, { rFrom: 0, rTo: 12 });
      const ru = P(c3.x + 32, c3.y - 30), rd = P(c3.x + 32, c3.y + 30);
      g += (flip ? hash : wedge)(c3, ru, { rFrom: 0, rTo: 17, width: 9, rungs: 4 });
      g += (flip ? wedge : hash)(c3, rd, { rFrom: 0, rTo: 12, width: 9, rungs: 4 });
      g += atom(lu.x, lu.y, 'CH₃', { r: 17, size: 10 });
      g += atom(ld.x, ld.y, 'H', { r: 12 });
      g += atom(ru.x, ru.y, 'CH₃', { r: 17, size: 10 });
      g += atom(rd.x, rd.y, 'H', { r: 12 });
      for (const q of [c1, c2, c3]) g += atom(q.x, q.y, '', { kind: 'point' });
      return g;
    };
    s += tag(238, 34, 'AN ALLENE: NO sp³ CARBON, NO STEREOCENTER');
    s += panel(20, 54, 196, 196, { kind: 'hi' });
    s += allene(118, false);
    s += text(118, 272, 'one enantiomer', { cls: 'fg-tag-good', size: 10.5 });
    s += text(238, 146, '↔', { cls: 'fg-hi', size: 22 });
    s += text(238, 172, 'mirror', { cls: 'fg-sm', size: 9 });
    s += panel(260, 54, 196, 196, { kind: 'hi' });
    s += allene(358, true);
    s += text(358, 272, 'the other', { cls: 'fg-tag-good', size: 10.5 });
    s += text(238, 302, 'The cumulated double bonds hold the two ends at 90° to', { cls: 'fg-sm', size: 9.5 });
    s += text(238, 320, 'each other, so the four groups sit at the corners of a', { cls: 'fg-sm', size: 9.5 });
    s += text(238, 338, 'twisted shape that no rotation superimposes on its mirror.', { cls: 'fg-sm', size: 9.5 });

    s += rule(478, 54, 478, 300);

    s += tag(618, 34, 'AN ATROPISOMER');
    const hex = (cx, cy, rx, ry) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (90 - i * 60) * Math.PI / 180;
        v.push(P(cx + rx * Math.cos(a), cy - ry * Math.sin(a)));
      }
      return v;
    };
    const A = hex(580, 150, 40, 40), B = hex(678, 150, 13, 40);
    for (const v of [A, B]) {
      for (let i = 0; i < 6; i++) s += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      for (let i = 0; i < 6; i += 2) s += bond(v[i], v[(i + 1) % 6], { rFrom: 7, rTo: 7, cls: 'fg-bond-soft' });
      for (const p of v) s += atom(p.x, p.y, '', { kind: 'point' });
    }
    s += bond(A[1], B[5], { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    for (const anchorPt of [A[2], B[4]]) {
      const co = P(anchorPt.x, anchorPt.y + 32);
      s += bond(anchorPt, co, { rFrom: 0, rTo: 17 });
      s += atom(co.x, co.y, 'CO₂H', { r: 17, size: 9.5, kind: 'hi' });
    }
    for (const anchorPt of [A[0], B[0]]) {
      const no = P(anchorPt.x, anchorPt.y - 32);
      s += bond(anchorPt, no, { rFrom: 0, rTo: 17 });
      s += atom(no.x, no.y, 'NO₂', { r: 17, size: 9.5, kind: 'hi' });
    }
    s += text(618, 228, 'the right ring is edge-on to the left one,', { cls: 'fg-sm', size: 9.5 });
    s += text(618, 246, 'and the four groups crowding the joint', { cls: 'fg-sm', size: 9.5 });
    s += text(618, 264, 'cannot slide past one another', { cls: 'fg-sm', size: 9.5 });
    s += text(618, 292, '6,6′-dinitro-2,2′-diphenic acid', { cls: 'fg-tag-good', size: 10 });
    s += text(618, 308, 'resolved into enantiomers in 1922', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Two molecules with no stereocenter anywhere and a left- and a right-handed form each. In the allene the two <b>cumulated</b> double bonds force the groups on one end into a plane at right angles to the groups on the other, and that twist is what has the handedness. In the biaryl the twist is the same idea held in place by bulk: four groups crowd the bond joining the rings, and for the rings to turn they would have to slide past one another, so the twist stays put and the molecule is not superimposable on its mirror image.',
  note: 'This is why “stereocenter” and “chiral” must not be treated as the same word. The stereocenter is the usual <i>cause</i> of chirality; chirality itself is a statement about the shape of the whole molecule, and a twist does the job just as well as a tetrahedral carbon. The modern workhorses of this type are BINOL and BINAP, two of the most used ligands in asymmetric catalysis. They are built on naphthalenes rather than benzenes, and the extra ring helps: each naphthalene has a hydrogen in the <i>peri</i> position tucked in beside the joint. Those hydrogens alone are not quite enough &mdash; plain binaphthyl slowly racemizes at room temperature &mdash; but with the OH or PPh<sub>2</sub> groups beside the joint as well, the twist is locked, and the same groups are what the metal binds.',
});

/* ---------------------------------------------------------------- ch6.3 ---
   Nitrogen inversion, which the section describes as an umbrella turning
   itself inside out and then does not draw. */
FIGURES.push({
  id: 'nitrogen-inversion',
  section: 'stereocenters',
  anchor: 'Quaternary ammonium salts, which have four groups and no lone pair, cannot invert and <i>are</i> genuine stereocenters.</div>',
  alt: 'An amine nitrogen shown pyramidal with its lone pair up, flattening through a planar transition state in which the lone pair occupies a p orbital, and arriving at the inverted pyramid with the lone pair down.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    const pyramid = (cx, down) => {
      const n = P(cx, 150);
      const sgn = down ? -1 : 1;
      const a = P(cx - 52, 150 + 26 * sgn), b = P(cx + 52, 150 + 26 * sgn), c = P(cx, 150 + 52 * sgn);
      let g = bond(n, a, { rTo: 14 });
      g += bond(n, b, { rTo: 14 });
      g += (sgn > 0 ? wedge : hash)(n, c, { rTo: 14, width: 9, rungs: 4 });
      g += atom(a.x, a.y, 'R¹', { r: 14, size: 10 });
      g += atom(b.x, b.y, 'R²', { r: 14, size: 10 });
      g += atom(c.x, c.y, 'R³', { r: 14, size: 10 });
      g += atom(n.x, n.y, 'N', { kind: 'hi' });
      g += lonePair(n.x, n.y, down ? 90 : -90, { dist: 24 });
      g += text(cx, down ? 202 : 106, down ? 'lone pair now points down' : 'lone pair points up', { cls: 'fg-sm', size: 9.5 });
      return g;
    };
    s += panel(20, 54, 200, 182, { kind: 'hi' });
    s += pyramid(120, false);
    s += text(120, 258, 'pyramidal', { cls: 'fg-tag-good', size: 11 });

    s += panel(280, 54, 200, 182, { kind: 'warn' });
    const n = P(380, 150);
    s += bond(n, P(324, 150), { rTo: 14 });
    s += bond(n, P(436, 150), { rTo: 14 });
    s += bond(n, P(380, 206), { rTo: 14 });
    s += atom(324, 150, 'R¹', { r: 14, size: 10 });
    s += atom(436, 150, 'R²', { r: 14, size: 10 });
    s += atom(380, 206, 'R³', { r: 14, size: 10 });
    s += atom(n.x, n.y, 'N', { kind: 'warn' });
    s += lonePair(n.x, n.y, -90, { dist: 24 });
    s += text(380, 88, 'all three groups flat,', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 102, 'lone pair in a p orbital', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 258, 'planar transition state', { cls: 'fg-tag-warn', size: 11 });

    s += panel(540, 54, 200, 182, { kind: 'hi' });
    s += pyramid(640, true);
    s += text(640, 258, 'pyramidal, inverted', { cls: 'fg-tag-good', size: 11 });

    s += arrow(P(232, 140), P(268, 140), { muted: true });
    s += arrow(P(268, 162), P(232, 162), { muted: true });
    s += arrow(P(492, 140), P(528, 140), { muted: true });
    s += arrow(P(528, 162), P(492, 162), { muted: true });

    s += text(380, 32, 'barrier ≈ 6 kcal/mol → about 10⁸–10⁹ inversions per second at room temperature', { cls: 'fg-tag', size: 11 });
    s += text(380, 296, 'One flip every few nanoseconds: cooling slows it, but never enough to bottle either pyramid.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Why an amine nitrogen with three different groups is not a usable stereocenter. It really is pyramidal, and the two pyramids really are mirror images — but the barrier between them is about 6 kcal/mol, so the molecule turns itself inside out like an umbrella in a gale, roughly 10<sup>8</sup>–10<sup>9</sup> times a second. What you have is not two separable substances; it is one substance spending half its time in each shape.',
  note: 'Take the lone pair away and the argument collapses with it. A quaternary ammonium ion, N<sup>+</sup> with four groups, has no lone pair to move into a p orbital and no planar transition state to pass through, so it cannot invert at all — and it is a perfectly ordinary stereocenter. The same is true of a sulfoxide, where the barrier is high enough that single enantiomers are sold as drugs.',
});

/* ---------------------------------------------------------------- ch6.4 ---
   The walk-both-ways test, which the section calls the reliable test for a
   ring carbon and then performs entirely in words. */
FIGURES.push({
  id: 'walk-both-ways',
  section: 'stereocenters',
  anchor: 'Walking both ways around the ring is the only reliable test.</div>',
  alt: 'Two cyclohexane rings. In 3-methylcyclohexan-1-ol, walking from C1 down the right-hand side reaches the methyl-bearing carbon after two carbons and walking down the left-hand side reaches it after four, so the two ring paths differ and C1 is a stereocenter. In 4-methylcyclohexan-1-ol both walks reach it after three carbons, so C1 is not.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const ring = (cx, meAt) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (90 - i * 60) * Math.PI / 180;
        v.push(P(cx + 54 * Math.cos(a), 152 - 54 * Math.sin(a)));
      }
      let g = '';
      for (let i = 0; i < 6; i++) g += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      for (const p of v) g += atom(p.x, p.y, '', { kind: 'point' });
      g += bond(v[0], P(v[0].x, v[0].y - 32), { rFrom: 0, rTo: 16 });
      g += atom(v[0].x, v[0].y - 32, 'OH', { r: 16, size: 10, kind: 'hi' });
      const m = v[meAt];
      const dx = m.x - cx, dy = m.y - 152, L = Math.hypot(dx, dy);
      const me = P(m.x + (dx / L) * 32, m.y + (dy / L) * 32);
      g += bond(m, me, { rFrom: 0, rTo: 17 });
      g += atom(me.x, me.y, 'CH₃', { r: 17, size: 10, kind: 'hi' });
      g += text(v[0].x - 20, v[0].y + 2, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
      return g;
    };
    s += panel(24, 40, 340, 232, { kind: 'hi' });
    s += ring(194, 2);
    s += text(194, 30, '3-methylcyclohexan-1-ol', { cls: 'fg-tag', size: 11 });
    s += text(118, 122, 'four carbons', { cls: 'fg-tag-warn', size: 10, anchor: 'end' });
    s += text(118, 138, 'this way', { cls: 'fg-tag-warn', size: 10, anchor: 'end' });
    s += text(270, 122, 'two carbons', { cls: 'fg-tag-good', size: 10, anchor: 'start' });
    s += text(270, 138, 'that way', { cls: 'fg-tag-good', size: 10, anchor: 'start' });
    s += text(194, 294, 'the two ring paths differ → C1 IS a stereocenter', { cls: 'fg-tag-good', size: 10.5 });

    s += panel(396, 40, 340, 232, { kind: 'warn' });
    s += ring(566, 3);
    s += text(566, 30, '4-methylcyclohexan-1-ol', { cls: 'fg-tag', size: 11 });
    s += text(490, 122, 'three carbons', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(490, 138, 'this way', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(642, 122, 'three carbons', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(642, 138, 'that way', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(566, 294, 'the two ring paths match → C1 is NOT a stereocenter', { cls: 'fg-tag-warn', size: 10.5 });

    s += text(380, 312, 'A ring carbon puts two of its four bonds into the ring itself.', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 326, 'The question is never “are these two bonds different” but “are these two WALKS different”.', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'The one test that works on a ring. C1 carries OH, H and two ring bonds, and the two ring bonds look identical — they are both C–C into the same ring. What decides is what you meet walking each way round, and the methyl group is the thing you meet. Two carbons one way against four the other is a genuine difference; three against three is not.',
  note: 'Do the walk in both directions and stop at the first point of difference, exactly as CIP rule 2 asks you to. The commonest error is not doing the walk at all — a ring carbon bearing an OH <i>looks</i> like a stereocenter, and in 4-methylcyclohexan-1-ol it is not one, because the ring reads the same from either side.',
});

/* ---------------------------------------------------------------- ch6.5 ---
   The polarimeter. The section gives the formula for [alpha] and uses it in a
   worked example without ever drawing the measurement the formula describes,
   which leaves l and c as symbols rather than parts of an instrument. */
FIGURES.push({
  id: 'polarimeter',
  section: 'enantiomers',
  anchor: '<h3>Specific rotation</h3>',
  alt: 'A polarimeter drawn left to right: a sodium lamp emitting light vibrating in every plane, a polarizer that passes only the vertical plane, a sample tube of length l holding a solution of concentration c, the emerging plane tilted by an angle alpha, and an analyzer turned by alpha to find the new plane.',
  viewBox: '0 0 760 316',
  build() {
    let s = '';
    const beam = 150;
    // a bundle of vibration planes, drawn as short strokes across the beam
    const ticks = (x0, x1, degs, cls) => {
      let g = '';
      for (let x = x0; x <= x1; x += 18) {
        for (const d of degs) {
          const r = (d * Math.PI) / 180, L = 15;
          g += `<line class="${cls}" x1="${(x - Math.cos(r) * L).toFixed(2)}" y1="${(beam - Math.sin(r) * L).toFixed(2)}" x2="${(x + Math.cos(r) * L).toFixed(2)}" y2="${(beam + Math.sin(r) * L).toFixed(2)}"></line>`;
        }
      }
      return g;
    };
    s += atom(46, beam, '', { r: 22, kind: 'hi' });
    s += text(46, beam + 4, 'Na', { cls: 'fg-lbl', size: 12 });
    s += text(46, 210, 'sodium lamp', { cls: 'fg-sm', size: 9.5 });
    s += text(46, 226, '589 nm', { cls: 'fg-sm', size: 9.5 });

    s += ticks(84, 148, [0, 45, 90, 135], 'fg-bond-soft');
    s += text(116, 100, 'every plane', { cls: 'fg-sm', size: 9.5 });

    s += bar(170, beam - 44, 14, 88, { kind: 'mut', r: 4 });
    s += text(177, 212, 'polarizer', { cls: 'fg-sm', size: 9.5 });
    s += text(177, 228, 'passes one plane', { cls: 'fg-sm', size: 9.5 });

    s += ticks(206, 250, [90], 'fg-bond-hi');
    s += text(228, 100, 'plane-polarized', { cls: 'fg-tag-good', size: 10 });

    s += panel(268, beam - 40, 200, 80, { kind: 'hi' });
    s += text(368, beam - 6, 'sample solution', { cls: 'fg-lbl', size: 11 });
    s += text(368, beam + 12, 'concentration c, in g/mL', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(268, 212), P(468, 212), { muted: true, size: 7 });
    s += arrow(P(468, 226), P(268, 226), { muted: true, size: 7 });
    s += text(368, 250, 'path length l, in decimeters', { cls: 'fg-tag', size: 10.5 });

    // the turned plane, with the original plane dashed behind it so the angle
    // the analyzer has to be turned through is the thing you can see
    s += `<line class="fg-dash-hi" x1="510" y1="${beam - 46}" x2="510" y2="${beam + 46}"></line>`;
    s += `<line class="fg-bond-hi" x1="${(510 - Math.cos(Math.PI / 3) * 46).toFixed(2)}" y1="${(beam - Math.sin(Math.PI / 3) * 46).toFixed(2)}" x2="${(510 + Math.cos(Math.PI / 3) * 46).toFixed(2)}" y2="${(beam + Math.sin(Math.PI / 3) * 46).toFixed(2)}"></line>`;
    s += text(530, beam - 4, 'α', { cls: 'fg-tag-good', size: 14, anchor: 'start' });
    s += text(508, 92, 'same plane,', { cls: 'fg-tag-good', size: 10 });
    s += text(508, 106, 'turned by α', { cls: 'fg-tag-good', size: 10 });

    s += bar(556, beam - 44, 14, 88, { kind: 'mut', r: 4 });
    s += text(563, 212, 'analyzer', { cls: 'fg-sm', size: 9.5 });
    s += text(563, 228, 'turned until light returns', { cls: 'fg-sm', size: 9.5 });

    s += atom(700, beam, '', { r: 22 });
    s += text(700, beam + 4, '◉', { cls: 'fg-lbl', size: 14 });
    s += text(700, 212, 'detector', { cls: 'fg-sm', size: 9.5 });

    s += text(380, 40, 'WHAT THE INSTRUMENT MEASURES IS α. WHAT YOU REPORT IS [α] = α / (l × c).', { cls: 'fg-tag', size: 11 });
    s += text(380, 282, 'Double the tube length, or double the concentration, and α doubles — the beam simply met twice as many molecules.', { cls: 'fg-sm', size: 10 });
    s += text(380, 300, 'That is why α on its own is not a property of the compound, and [α] is.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The measurement behind every number in this section. Light from the lamp vibrates in every plane at once; the polarizer throws away all but one. That single plane passes through the solution and comes out <b>turned</b>, and the analyzer is then rotated by hand until the light comes back — the angle it had to be turned through is α.',
  note: 'The two normalizations in the formula are the two things you could change about the experiment without changing the compound: how long a column of solution the light crossed (l, in decimeters, because a standard tube is 1 dm) and how much compound was in it (c, in g/mL). Divide them out and what is left is a constant of the substance, quoted with the temperature and wavelength because it depends mildly on both.',
});

/* ---------------------------------------------------------------- ch6.6 ---
   Resolution as a scheme. Three steps in one paragraph is three steps a
   student has to hold in their head. */
FIGURES.push({
  id: 'resolution-scheme',
  section: 'enantiomers',
  anchor: '<h3>Separating enantiomers</h3>',
  alt: 'A four-stage scheme: a racemic mixture of R and S acid, reacted with a single enantiomer of a chiral base, gives two diastereomeric salts with different solubilities; crystallization separates them; removing the resolving agent returns the two pure enantiomers.',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    const box = (x, y, w, h, kind, lines) => {
      let g = panel(x, y, w, h, { kind });
      lines.forEach((ln, i) => {
        g += text(x + w / 2, y + 26 + i * 19, ln[0], { cls: ln[1] || 'fg-lbl', size: ln[2] || 11.5 });
      });
      return g;
    };
    s += tag(380, 30, 'THE POINT IS TO TURN AN ENANTIOMERIC RELATIONSHIP INTO A DIASTEREOMERIC ONE');

    s += box(24, 60, 168, 96, 'warn', [
      ['(R)-acid', 'fg-lbl', 12],
      ['+  (S)-acid', 'fg-lbl', 12],
      ['inseparable', 'fg-tag-warn', 10.5],
    ]);
    s += text(108, 172, 'the racemate', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(200, 108), P(254, 108));
    s += text(227, 90, '+ (R)-base', { cls: 'fg-tag-good', size: 10 });
    s += text(214, 134, 'one enantiomer of', { cls: 'fg-sm', size: 9 });
    s += text(214, 148, 'a resolving agent', { cls: 'fg-sm', size: 9 });

    s += box(262, 46, 188, 60, 'hi', [
      ['(R)-acid · (R)-base', 'fg-lbl', 11.5],
      ['less soluble', 'fg-tag-good', 10],
    ]);
    s += box(262, 118, 188, 60, 'hi', [
      ['(S)-acid · (R)-base', 'fg-lbl', 11.5],
      ['more soluble', 'fg-tag-good', 10],
    ]);
    s += text(356, 196, 'two salts, and they are DIASTEREOMERS', { cls: 'fg-tag', size: 10.5 });
    s += text(356, 212, 'so their solubilities differ — ordinary crystallization separates them', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(458, 76), P(512, 76));
    s += arrow(P(458, 148), P(512, 148));
    s += text(485, 58, 'crystallize', { cls: 'fg-sm', size: 9 });

    s += box(520, 46, 216, 60, 'good', [
      ['(R)-acid, pure', 'fg-lbl', 11.5],
      ['after the base is washed out', 'fg-sm', 9.5],
    ]);
    s += box(520, 118, 216, 60, 'good', [
      ['(S)-acid, pure', 'fg-lbl', 11.5],
      ['after the base is washed out', 'fg-sm', 9.5],
    ]);

    s += rule(24, 238, 736, 238);
    s += text(380, 266, 'Step 2 is the whole trick: only the acid half is inverted between the two salts, not the base half,', { cls: 'fg-sm', size: 10 });
    s += text(380, 286, 'so they are diastereomers — different lattice energies, different solubilities, different melting points.', { cls: 'fg-sm', size: 10 });
    s += text(380, 314, 'Chiral chromatography does the same thing without isolating anything: the stationary phase is a single enantiomer.', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Resolution in four moves. Nothing in the first box can be separated, because every ordinary property of the two acids is identical. Add <b>one enantiomer</b> of a chiral base and the two salts that form are no longer mirror images — one is (R)&middot;(R) and the other (S)&middot;(R) — so they are diastereomers, and diastereomers crystallize apart.',
  note: 'Notice what the resolving agent has to be: a single enantiomer, not a racemate. Adding racemic base would give four salts in two enantiomeric pairs and leave you exactly where you started. Pasteur’s 1848 separation was the crude version of this — the two crystal forms of a tartrate salt happened to be visibly different, and he picked them apart with tweezers.',
});

/* ---------------------------------------------------------------- ch6.7 ---
   cis and trans 2-butene with their dipoles, which is the part of the
   diastereomers section that joins two previously separate ideas. */
FIGURES.push({
  id: 'cis-trans-are-diastereomers',
  section: 'diastereomers',
  anchor: '<h3>Cis/trans isomers are diastereomers</h3>',
  alt: 'cis-2-butene drawn with both methyls below the double bond, its two bond dipoles sharing an upward component and adding to a net dipole of 0.33 debye, and trans-2-butene with one methyl above and one below, its two dipoles pointing exactly opposite ways and cancelling to zero.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const butene = (cx, trans) => {
      const c2 = P(cx - 26, 150), c3 = P(cx + 26, 150);
      const m1 = P(cx - 66, 172), m2 = P(cx + 66, trans ? 128 : 172);
      const h1 = P(cx - 66, 128), h2 = P(cx + 66, trans ? 172 : 128);
      let g = bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 4 });
      g += bond(c2, m1, { rFrom: 0, rTo: 17 });
      g += bond(c3, m2, { rFrom: 0, rTo: 17 });
      g += bond(c2, h1, { rFrom: 0, rTo: 12 });
      g += bond(c3, h2, { rFrom: 0, rTo: 12 });
      g += atom(m1.x, m1.y, 'CH₃', { r: 17, size: 10 });
      g += atom(m2.x, m2.y, 'CH₃', { r: 17, size: 10 });
      g += atom(h1.x, h1.y, 'H', { r: 12 });
      g += atom(h2.x, h2.y, 'H', { r: 12 });
      g += atom(c2.x, c2.y, '', { kind: 'point' });
      g += atom(c3.x, c3.y, '', { kind: 'point' });
      return g;
    };
    /* The two C-CH3 bond dipoles redrawn from one origin, so their sum can be
       read off. Each points from the methyl toward the sp2 carbon it is on. */
    const dipoles = (cx, trans) => {
      const o = P(cx, 250);
      let g = arrow(o, P(o.x + 30, o.y - 20), { size: 7 });
      g += arrow(o, P(o.x - 30, trans ? o.y + 20 : o.y - 20), { size: 7 });
      if (!trans) g += arrow(o, P(o.x, o.y - 28), { muted: true, size: 7 });
      g += atom(o.x, o.y, '', { kind: 'point' });
      return g;
    };
    s += panel(24, 44, 340, 232, { kind: 'hi' });
    s += butene(194, false);
    s += text(194, 34, 'cis-2-butene', { cls: 'fg-tag', size: 11.5 });
    s += text(194, 96, 'both methyls on the same side', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 216, 'the two C–CH₃ bond dipoles', { cls: 'fg-sm', size: 9 });
    s += dipoles(194, false);
    s += text(194, 296, 'they share an upward component and ADD: μ = 0.33 D', { cls: 'fg-tag-good', size: 10 });
    s += text(194, 316, 'bp 3.7 °C', { cls: 'fg-sm', size: 10 });

    s += panel(396, 44, 340, 232, { kind: 'hi' });
    s += butene(566, true);
    s += text(566, 34, 'trans-2-butene', { cls: 'fg-tag', size: 11.5 });
    s += text(566, 96, 'one methyl up, one down', { cls: 'fg-sm', size: 9.5 });
    s += text(566, 216, 'the two C–CH₃ bond dipoles', { cls: 'fg-sm', size: 9 });
    s += dipoles(566, true);
    s += text(566, 296, 'they are exactly opposed and CANCEL: μ = 0', { cls: 'fg-tag-good', size: 10 });
    s += text(566, 316, 'bp 0.9 °C, and ≈ 1 kcal/mol more stable', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Two compounds, not two drawings of one — the C=C cannot rotate, so the methyls are stuck where they are. They are stereoisomers and neither is the mirror image of the other, which makes them <b>diastereomers</b> by the definition at the top of this section, and everything the definition predicts is measurable here: different dipole moment, different boiling point, different stability.',
  note: 'Count the stereocenters in either structure and you get zero. That is the point worth taking away: the diastereomer relationship is defined by “not mirror images”, not by a stereocenter count, and a double bond is a perfectly good source of stereoisomerism on its own. The arrows below each structure are the two C–CH₃ bond dipoles redrawn from one origin: in the cis isomer they share an upward component and add to a small net dipole, and in the trans isomer they are exactly opposed and the molecule has none.',
});

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

/* ---------------------------------------------------------------- ch6.8 ---
   The bromine result, drawn. This is the fix for the one outright chemistry
   error a review found in the chapter, and the reason it survived is that
   the two cases were only ever written down in words. */
FIGURES.push({
  id: 'bromine-cis-trans-outcomes',
  section: 'meso',
  anchor: '<h3>Why meso compounds matter in reactions</h3>',
  alt: 'Two rows. cis-2-butene plus bromine, adding anti, gives 2,3-dibromobutane with the two bromines on wedges pointing opposite ways - the chiral (2S,3S) form, accompanied by an equal amount of (2R,3R). trans-2-butene plus bromine gives the mirror-symmetric arrangement, the achiral meso form.',
  viewBox: '0 0 760 560',
  build() {
    let s = '';
    const alkene = (cx, cy, trans) => {
      const c2 = P(cx - 24, cy), c3 = P(cx + 24, cy);
      const m1 = P(cx - 62, cy + 22), m2 = P(cx + 62, trans ? cy - 22 : cy + 22);
      const h1 = P(cx - 62, cy - 22), h2 = P(cx + 62, trans ? cy + 22 : cy - 22);
      let g = bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 4 });
      g += bond(c2, m1, { rFrom: 0, rTo: 17 }) + bond(c3, m2, { rFrom: 0, rTo: 17 });
      g += bond(c2, h1, { rFrom: 0, rTo: 11 }) + bond(c3, h2, { rFrom: 0, rTo: 11 });
      g += atom(m1.x, m1.y, 'CH₃', { r: 17, size: 10 });
      g += atom(m2.x, m2.y, 'CH₃', { r: 17, size: 10 });
      g += atom(h1.x, h1.y, 'H', { r: 11 });
      g += atom(h2.x, h2.y, 'H', { r: 11 });
      g += atom(c2.x, c2.y, '', { kind: 'point' });
      g += atom(c3.x, c3.y, '', { kind: 'point' });
      return g;
    };
    /* The product: CH3 on top, two stereocenters, CH3 underneath. `bottomDeg`
       is where the lower center's bromine points, and it is the only thing
       that differs between the two rows. */
    const product = (cx, cy, bottomDeg, topTag, botTag) => {
      const top = P(cx, cy - 38), bot = P(cx, cy + 38);
      let g = bond(P(cx, cy - 82), top, { rFrom: 17, rTo: 15 });
      g += bond(top, bot, { rFrom: 15, rTo: 15 });
      g += bond(bot, P(cx, cy + 82), { rFrom: 15, rTo: 17 });
      g += atom(cx, cy - 82, 'CH₃', { r: 17, size: 10 });
      g += atom(cx, cy + 82, 'CH₃', { r: 17, size: 10 });
      g += chainCentre(top, 155, 'Br', 'H');
      g += chainCentre(bot, bottomDeg, 'Br', 'H');
      g += text(cx + 22, cy - 34, topTag, { cls: 'fg-tag-good', size: 12, anchor: 'start' });
      g += text(cx + 22, cy + 42, botTag, { cls: 'fg-tag-good', size: 12, anchor: 'start' });
      return g;
    };

    // ---------------- row 1: cis ----------------
    s += tag(70, 40, 'CIS', { anchor: 'start' });
    s += alkene(140, 150, false);
    s += text(140, 232, 'cis-2-butene', { cls: 'fg-tag', size: 11 });
    s += arrow(P(236, 150), P(330, 150));
    s += text(283, 132, 'Br₂', { cls: 'fg-tag-good', size: 11 });
    s += text(283, 172, 'anti addition', { cls: 'fg-sm', size: 9.5 });
    s += product(420, 150, 25, 'S', 'S');
    s += text(420, 262, '(2S,3S) — and (2R,3R) in exactly equal amount', { cls: 'fg-tag-good', size: 10.5 });
    s += panel(536, 78, 200, 144, { kind: 'warn' });
    s += text(636, 112, 'RACEMIC', { cls: 'fg-tag-warn', size: 12 });
    s += text(636, 138, 'two chiral compounds,', { cls: 'fg-sm', size: 10 });
    s += text(636, 156, '50:50, so α = 0', { cls: 'fg-sm', size: 10 });
    s += text(636, 184, 'separable in principle', { cls: 'fg-sm', size: 10 });
    s += text(636, 202, 'by resolution', { cls: 'fg-sm', size: 10 });

    s += rule(24, 292, 736, 292);

    // ---------------- row 2: trans ----------------
    s += tag(70, 326, 'TRANS', { anchor: 'start' });
    s += alkene(140, 420, true);
    s += text(140, 502, 'trans-2-butene', { cls: 'fg-tag', size: 11 });
    s += arrow(P(236, 420), P(330, 420));
    s += text(283, 402, 'Br₂', { cls: 'fg-tag-good', size: 11 });
    s += text(283, 442, 'anti addition', { cls: 'fg-sm', size: 9.5 });
    s += product(420, 420, 205, 'S', 'R');
    s += text(420, 532, 'one compound, with a mirror plane across the middle', { cls: 'fg-tag-good', size: 10.5 });
    s += panel(536, 348, 200, 144, { kind: 'hi' });
    s += text(636, 382, 'MESO', { cls: 'fg-tag-good', size: 12 });
    s += text(636, 408, 'one achiral compound,', { cls: 'fg-sm', size: 10 });
    s += text(636, 426, 'so α = 0', { cls: 'fg-sm', size: 10 });
    s += text(636, 454, 'nothing to separate —', { cls: 'fg-sm', size: 10 });
    s += text(636, 472, 'it has no enantiomer', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Same reagent, same mechanism, same <b>anti</b> stereochemistry — and opposite answers, because the alkene geometry decides which face each methyl ends up on. The <i>cis</i> alkene gives the chiral pair; the <i>trans</i> alkene gives meso. Both flasks read zero on a polarimeter, and for completely different reasons: one holds two compounds that cancel, the other holds one compound that never rotated anything.',
  note: 'Check the drawn products rather than trusting the label. In the lower product the two halves reflect through a horizontal plane — Br on a wedge to the left at both centers, H hashed to the right at both — so it is superimposable on its mirror image and has to be meso, and the descriptors come out opposite, S above and R below. In the upper product the lower center is turned over, the descriptors match, and no plane exists.',
});

/* ---------------------------------------------------------------- ch6.9 ---
   The two chairs of cis-1,2-dimethylcyclohexane, which the section calls the
   most subtle idea in the chapter and then asks the reader to imagine. */
FIGURES.push({
  id: 'cis-dimethyl-two-chairs',
  section: 'meso',
  anchor: '<h3>Meso compounds in rings</h3>',
  alt: 'Two chair conformations of cis-1,2-dimethylcyclohexane. In the first, C1 carries an axial methyl pointing up and C2 an equatorial methyl; the ring flip gives the second, in which C1 is equatorial and C2 axial. Both methyls stay on the upper face in both chairs, and the two chairs are mirror images of each other.',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    const flipPts = (cx, cy, k) => CHAIR_V.map((v) => P(cx + v.x * k, cy - v.y * k));
    const axUpFlip = (pts, i, L) => P(pts[i].x, pts[i].y - L);
    const eqFlip = (pts, i, L) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y - CHAIR_EQ[i].y * L);

    const methyl = (from, to) => bond(from, to, { rFrom: 0, rTo: 17 }) + atom(to.x, to.y, 'CH₃', { r: 17, size: 10 });

    // left chair: axial-up methyl on carbon 2, equatorial methyl on carbon 1
    const A = chair(180, 150, 0.78);
    s += chairRing(A);
    for (const p of A) s += atom(p.x, p.y, '', { kind: 'point' });
    s += methyl(A[2], axialEnd(A, 2, 40));
    s += methyl(A[1], equatorialEnd(A, 1, 38));
    s += text(A[2].x - 20, A[2].y + 16, 'C2', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(A[1].x + 8, A[1].y + 22, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(180, 244, 'C2 axial · C1 equatorial', { cls: 'fg-tag', size: 11 });

    // right chair: the ring flip. Same two carbons, faces unchanged.
    const B = flipPts(580, 150, 0.78);
    s += chairRing(B);
    for (const p of B) s += atom(p.x, p.y, '', { kind: 'point' });
    s += methyl(B[1], axUpFlip(B, 1, 40));
    s += methyl(B[2], eqFlip(B, 2, 38));
    s += text(B[2].x + 4, B[2].y - 14, 'C2', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(B[1].x + 10, B[1].y + 6, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(580, 244, 'C1 axial · C2 equatorial', { cls: 'fg-tag', size: 11 });

    s += arrow(P(320, 140), P(440, 140));
    s += arrow(P(440, 162), P(320, 162));
    s += text(380, 120, 'ring flip', { cls: 'fg-tag-good', size: 11 });
    s += text(380, 186, 'about 100,000 times', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 202, 'a second', { cls: 'fg-sm', size: 9.5 });

    s += tag(380, 36, 'BOTH METHYLS STAY ON THE UPPER FACE — THAT IS WHAT MAKES IT CIS');
    s += rule(24, 268, 736, 268);
    s += text(380, 294, 'Each chair on its own is chiral — neither has a mirror plane. But each is the MIRROR IMAGE of the other,', { cls: 'fg-sm', size: 10 });
    s += text(380, 314, 'and they trade places far faster than anything could tell them apart, so what you can bottle is achiral.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The subtlest claim in the chapter, drawn. A ring flip cannot move a group from one face to the other — it only swaps axial for equatorial — so both methyls are still up after the flip and the compound is still <i>cis</i>. What has changed is that the two chairs are reflections of each other, and a molecule that spends half its life as each is achiral on any timescale you can observe.',
  note: 'This is why the rule is written as “chirality is assessed over all accessible conformations” rather than “look at the drawing”. Freeze either chair and you have a chiral object; let it flip, roughly 10<sup>5</sup> times a second at room temperature, and the time-averaged molecule has a mirror plane. The flat hexagon drawing, with both methyls on wedges, shows that plane directly.',
});

/* --------------------------------------------------------------- ch6.10 ---
   A meso compound as a Fischer projection, which both this section and the
   Fischer section point at and neither draws. */
FIGURES.push({
  id: 'meso-in-a-fischer-projection',
  section: 'meso',
  anchor: 'A Fischer projection makes this especially easy, because the plane is usually just a horizontal line across the middle of the drawing.</p>',
  alt: 'Two Fischer projections of tartaric acid side by side. In the meso form both OH groups are on the right and both H on the left, so a horizontal line through the middle reflects the top half onto the bottom. In the (2R,3R) form one OH is on the right and one on the left, and no such line exists.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const fischer = (cx, cy, rights) => {
      let g = '';
      const top = P(cx, cy - 86), bot = P(cx, cy + 86);
      g += bond(top, bot, { rFrom: 16, rTo: 16 });
      g += atom(top.x, top.y, 'COOH', { r: 24, size: 9.5 });
      g += atom(bot.x, bot.y, 'COOH', { r: 24, size: 9.5 });
      [-40, 40].forEach((dy, i) => {
        const c = P(cx, cy + dy);
        const right = rights[i];
        const oh = P(cx + (right ? 64 : -64), c.y);
        const h = P(cx + (right ? -64 : 64), c.y);
        g += bond(oh, h, { rFrom: 18, rTo: 13 });
        g += atom(oh.x, oh.y, 'OH', { r: 18, size: 10.5, kind: 'hi' });
        g += atom(h.x, h.y, 'H', { r: 13, size: 11 });
        g += atom(c.x, c.y, '', { kind: 'point' });
      });
      return g;
    };
    s += panel(24, 44, 340, 224, { kind: 'hi' });
    s += fischer(194, 152, [true, true]);
    s += `<line class="fg-dash-hi" x1="60" y1="152" x2="328" y2="152"></line>`;
    s += text(336, 144, 'mirror', { cls: 'fg-tag-good', size: 9.5, anchor: 'end' });
    s += text(194, 34, 'both OH on the same side', { cls: 'fg-tag', size: 11 });
    s += text(194, 292, 'MESO — the line reflects the top half onto the bottom', { cls: 'fg-tag-good', size: 10.5 });
    s += text(194, 312, 'one achiral compound, [α] = 0', { cls: 'fg-sm', size: 10 });

    s += panel(396, 44, 340, 224, { kind: 'warn' });
    s += fischer(566, 152, [true, false]);
    s += `<line class="fg-dash-hi" x1="432" y1="152" x2="700" y2="152"></line>`;
    s += text(708, 144, 'not a mirror', { cls: 'fg-tag-warn', size: 9.5, anchor: 'end' });
    s += text(566, 34, 'OH on opposite sides', { cls: 'fg-tag', size: 11 });
    s += text(566, 292, 'CHIRAL — reflecting sends OH onto H', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(566, 312, '(2R,3R), with (2S,3S) as its enantiomer', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The fastest meso test there is, once you can read the notation. In a Fischer projection every horizontal bond points at you and every vertical bond away, so the two halves of a drawing like this really are in the same conformation as each other — which is exactly the condition under which an internal mirror plane shows up as a line on the page.',
  note: 'The left projection is <i>meso</i>-tartaric acid: reflect it through the dashed line and OH lands on OH, H on H, COOH on COOH. The right one is (2R,3R): the same reflection sends OH onto H, so it is not a symmetry of the molecule, and no other one exists. Fischer projections are covered properly in the next section; this is the one use of them worth borrowing early.',
});

/* --------------------------------------------------------------- ch6.11 ---
   The two worked examples the R/S section explicitly asks the reader to
   compare, finally drawn beside each other. */
FIGURES.push({
  id: 'same-trace-opposite-answer',
  section: 'rs-configuration',
  anchor: 'This is the single most common way to lose marks in stereochemistry: reading the rotation correctly and forgetting to check where priority 4 points.</div>',
  alt: 'Butan-2-ol and glyceraldehyde drawn in the same orientation, OH at the top and the two carbon groups lower left and lower right. Both trace 1 to 2 to 3 counterclockwise. Butan-2-ol has H on a hash and is S; glyceraldehyde has H on a wedge, so the answer is flipped and it is R.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const centerDraw = (cx, cy, g2, g3, hKind) => {
      const c = P(cx, cy);
      const oh = armEnd(c, 90, 62), a = armEnd(c, 200, 66), b = armEnd(c, 340, 66), h = armEnd(c, 270, 46);
      let g = bond(c, oh, { rTo: 17 });
      g += bond(c, a, { rTo: g2.length > 3 ? 22 : 17 });
      g += bond(c, b, { rTo: g3.length > 3 ? 22 : 17 });
      g += (hKind === 'wedge' ? wedge : hash)(c, h, { rTo: 12, width: 10, rungs: 4 });
      g += atom(oh.x, oh.y, 'OH', { r: 17, size: 10.5, kind: 'hi' });
      g += atom(a.x, a.y, g2, { r: g2.length > 3 ? 22 : 17, size: g2.length > 3 ? 9 : 10 });
      g += atom(b.x, b.y, g3, { r: g3.length > 3 ? 22 : 17, size: g3.length > 3 ? 9 : 10 });
      g += atom(h.x, h.y, 'H', { r: 12 });
      g += atom(c.x, c.y, 'C', { kind: 'hi' });
      g += text(oh.x + 24, oh.y - 6, '1', { cls: 'fg-tag-good', size: 13 });
      g += text(a.x - 4, a.y + 34, '2', { cls: 'fg-tag-good', size: 13 });
      g += text(b.x + 4, b.y + 34, '3', { cls: 'fg-tag-good', size: 13 });
      g += text(h.x + 22, h.y + 4, '4', { cls: 'fg-tag-warn', size: 13, anchor: 'start' });
      /* The 1 -> 2 -> 3 sweep as ONE arc, bowed out to the left so it passes
         the lower-left group on its way to the lower-right one. Drawing it as
         a short hop from 1 to 2 would leave the student to guess the rest. */
      g += curve(P(cx - 16, cy - 44), P(cx + 44, cy + 30), { bow: 74, size: 8 });
      return g;
    };
    s += panel(24, 40, 340, 214, { kind: 'hi' });
    s += centerDraw(194, 132, 'CH₂CH₃', 'CH₃', 'hash');
    s += text(194, 232, 'butan-2-ol · H on a HASH, pointing away', { cls: 'fg-sm', size: 10 });
    s += text(194, 278, '1→2→3 counterclockwise, no flip', { cls: 'fg-sm', size: 10 });
    s += text(194, 302, 'S', { cls: 'fg-tag-good', size: 18 });

    s += panel(396, 40, 340, 214, { kind: 'warn' });
    s += centerDraw(566, 132, 'CHO', 'CH₂OH', 'wedge');
    s += text(566, 232, 'glyceraldehyde · H on a WEDGE, pointing at you', { cls: 'fg-sm', size: 10 });
    s += text(566, 278, '1→2→3 counterclockwise, then FLIP', { cls: 'fg-sm', size: 10 });
    s += text(566, 302, 'R', { cls: 'fg-tag-warn', size: 18 });
    return s;
  },
  caption: 'Two molecules drawn in the same orientation, traced in the same direction, with <b>opposite</b> answers. Priorities run OH &gt; the more oxidized carbon &gt; the less oxidized carbon &gt; H in both: ethyl beats methyl on the left by (C,H,H) against (H,H,H), and CHO beats CH₂OH on the right by (O,O,H) against (O,H,H). Everything about the two readings is identical except which bond the hydrogen sits on.',
  note: 'Get into the habit of finding priority 4 <i>before</i> tracing, not after. The flip is not an optional refinement — skipping it does not give you a slightly wrong answer, it gives you the enantiomer, and it gives it to you every single time.',
});

/* --------------------------------------------------------------- ch6.12 ---
   The claim the Fischer section is built on: four stereocenters stacked up
   become a pattern you can match at a glance. Asserted, never shown. */
FIGURES.push({
  id: 'sugar-patterns',
  section: 'fischer',
  anchor: '<h3>Why Fischer projections are still used</h3>',
  alt: 'Fischer projections of D-glucose, D-mannose and D-galactose side by side. Each has CHO at the top and CH2OH at the bottom with four stereocenters between. D-glucose reads right, left, right, right; D-mannose differs only at C2 and D-galactose only at C4.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    const sugar = (cx, pattern, diff) => {
      let g = '';
      const topY = 76, botY = 316;
      g += bond(P(cx, topY), P(cx, botY), { rFrom: 17, rTo: 22 });
      g += atom(cx, topY, 'CHO', { r: 19, size: 9.5 });
      g += atom(cx, botY, 'CH₂OH', { r: 23, size: 9 });
      pattern.forEach((right, i) => {
        const y = 124 + i * 48;
        const oh = P(cx + (right ? 52 : -52), y), h = P(cx + (right ? -52 : 52), y);
        const hot = diff === i + 2;
        g += bond(oh, h, { rFrom: 18, rTo: 12, cls: hot ? 'fg-bond-hi' : 'fg-bond' });
        g += atom(oh.x, oh.y, 'OH', { r: 18, size: 10.5, kind: hot ? 'warn' : 'hi' });
        g += atom(h.x, h.y, 'H', { r: 12 });
        g += atom(cx, y, '', { kind: 'point' });
        g += text(cx - 78, y + 4, 'C' + (i + 2), { cls: 'fg-sm', size: 9 });
      });
      return g;
    };
    s += tag(380, 34, 'FOUR STEREOCENTERS, READ AS A PATTERN INSTEAD OF ANALYZED ONE BY ONE');
    s += sugar(150, [true, false, true, true], 0);
    s += text(150, 356, 'D-glucose', { cls: 'fg-tag-good', size: 12 });
    s += text(150, 376, 'right, left, right, right', { cls: 'fg-sm', size: 10 });

    s += sugar(380, [false, false, true, true], 2);
    s += text(380, 356, 'D-mannose', { cls: 'fg-tag-good', size: 12 });
    s += text(380, 376, 'differs from glucose at C2 only', { cls: 'fg-sm', size: 10 });

    s += sugar(614, [true, false, false, true], 4);
    s += text(614, 356, 'D-galactose', { cls: 'fg-tag-good', size: 12 });
    s += text(614, 376, 'differs from glucose at C4 only', { cls: 'fg-sm', size: 10 });

    s += text(380, 56, 'and in all three the bottom stereocenter, C5, has its OH on the right — which is what the D stands for', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Why the notation survived. All three are aldohexoses with four stereocenters, 2<sup>4</sup> = 16 of which exist; drawn with wedges and dashes they take real effort to tell apart, and stacked as Fischer projections they are three patterns you can compare in a second. Glucose reads <b>right, left, right, right</b>, and each of the others changes exactly one entry in that list.',
  note: 'A pair that differs at exactly one stereocenter is an <b>epimer</b> pair, so glucose and mannose are C2 epimers and glucose and galactose are C4 epimers. Note also where D comes from: it is set by the bottom stereocenter, C5, and by nothing else — all three sugars have that OH on the right, and all three are D even though their full descriptors are mixtures of R and S.',
});


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

/* ---------------------------------------------------------------- 8.1 ---
   The opening claim of the chapter — three sp2 orbitals in a plane, one p
   orbital perpendicular, overlap side by side — is carried entirely by
   prose, and the consequence (no rotation) is argued in prose too. Both are
   pictures. */
FIGURES.push({
  id: 'alkene-pi-overlap',
  section: 'alkene-structure',
  anchor: 'forming the <b>pi bond</b>.</p>',
  alt: 'Left: ethylene drawn flat, with the two leftover p orbitals aligned and overlapping as one pi cloud above the molecule and one below. Right: the same molecule with the right-hand carbon turned ninety degrees, so its p orbitals point toward and away from the reader while the left one still points up and down; the two no longer overlap and the pi bond is gone.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    const armsH = (c, up, dn) => bond(c, up, { rFrom: 15, rTo: 13 }) + bond(c, dn, { rFrom: 15, rTo: 13 });

    // ---- left panel: aligned
    s += panel(10, 14, 356, 246);
    s += tag(188, 40, 'aligned — the pi bond exists');
    const A = P(128, 150), B = P(248, 150);
    s += lobeE(188, 104, 88, 26);
    s += lobeE(188, 196, 88, 26);
    s += bond(A, B);
    const a1 = P(74, 118), a2 = P(74, 182), b1 = P(302, 118), b2 = P(302, 182);
    s += armsH(A, a1, a2) + armsH(B, b1, b2);
    s += atom(a1.x, a1.y, 'H', { r: 13 }) + atom(a2.x, a2.y, 'H', { r: 13 });
    s += atom(b1.x, b1.y, 'H', { r: 13 }) + atom(b2.x, b2.y, 'H', { r: 13 });
    s += atom(A.x, A.y, 'C') + atom(B.x, B.y, 'C');
    s += text(188, 234, 'both p orbitals point the same way, so they overlap', { cls: 'fg-sm', size: 9.5 });
    s += text(188, 250, '3 sigma bonds each, 120° apart, one plane', { cls: 'fg-sm', size: 9.5 });

    // ---- right panel: twisted 90 degrees
    s += panel(394, 14, 356, 246);
    s += tag(572, 40, 'turned 90° — the pi bond is gone');
    const C = P(512, 150), D = P(632, 150);
    s += lobeE(512, 108, 26, 22);
    s += lobeE(512, 192, 26, 22);
    s += lobeE(608, 122, 24, 20, 'fg-orb-alt');
    s += lobeE(656, 178, 24, 20, 'fg-orb-alt');
    s += text(596, 96, 'front', { cls: 'fg-sm', size: 9 });
    s += text(672, 208, 'behind', { cls: 'fg-sm', size: 9 });
    s += bond(C, D, { cls: 'fg-bond-soft' });
    const c1 = P(458, 118), c2 = P(458, 182), d1 = P(696, 130), d2 = P(696, 172);
    s += armsH(C, c1, c2) + armsH(D, d1, d2);
    s += atom(c1.x, c1.y, 'H', { r: 13 }) + atom(c2.x, c2.y, 'H', { r: 13 });
    s += atom(d1.x, d1.y, 'H', { r: 13 }) + atom(d2.x, d2.y, 'H', { r: 13 });
    s += atom(C.x, C.y, 'C') + atom(D.x, D.y, 'C');
    s += text(572, 234, 'perpendicular orbitals cannot overlap at all', { cls: 'fg-tag-warn', size: 10 });
    s += text(572, 250, 'the sigma bond survives; the pi bond does not', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(370, 150), P(390, 150), { muted: true });
    s += rule(30, 276, 730, 276);
    s += text(380, 300, 'Turning one carbon like that costs about 65 kcal/mol — the whole pi bond.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 318, 'That is why cis and trans alkenes are different compounds rather than two shapes of one.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'What "side-by-side overlap" looks like, and what rotation would do to it. On the left the two leftover p orbitals are parallel, and the shared cloud above and below the molecular plane is the pi bond. On the right one carbon has been turned a quarter turn: its orbitals now point at the reader and away, the other pair still points up and down, and two perpendicular orbitals have no overlap to share.',
  note: 'The sigma bond does not care. Its overlap is end-on and cylindrically symmetric about the bond axis, so turning one end changes nothing — which is exactly why single bonds rotate freely at room temperature and double bonds do not rotate at all.',
});

/* ---------------------------------------------------------------- 8.2 ---
   E/Z was defined and never performed. This is the assignment done on the
   compound the pitfall is about, with the two rankings kept visibly
   separate, because comparing across the double bond is the actual error. */
FIGURES.push({
  id: 'ez-worked',
  section: 'cis-trans-ez',
  anchor: 'outranks its methyl.</p>\n</div>',
  alt: '2-bromo-2-butene drawn skeletally with its two methyl groups on opposite sides of the double bond, which looks trans. The bromine on C2 outranks the methyl on C2, and the methyl on C3 outranks the hydrogen on C3. The two winners, bromine and the C4 methyl, are both above the double bond, so the compound is Z.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    s += tag(196, 38, 'drawn the way anyone would call "trans"');
    const p0 = P(112, 214), p1 = P(176, 172), p2 = P(240, 214), p3 = P(304, 172);
    s += sk(p0, p1);
    s += skDouble(p1, p2, P(208, 240));
    s += sk(p2, p3);
    const br = P(176, 104), h = P(240, 278);
    s += bond(p1, br, { rFrom: 0, rTo: 16 });
    s += bond(p2, h, { rFrom: 0, rTo: 13 });
    s += atom(br.x, br.y, 'Br', { kind: 'hi', r: 16 });
    s += atom(h.x, h.y, 'H', { r: 13 });
    s += text(96, 236, 'C1', { cls: 'fg-sm', size: 9.5 });
    s += text(176, 156, 'C2', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(248, 232, 'C3', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(320, 156, 'C4', { cls: 'fg-sm', size: 9.5 });
    s += text(196, 306, 'the two methyls, C1 and C4, are on opposite sides', { cls: 'fg-sm', size: 9.5 });

    s += rule(370, 60, 370, 290);

    s += tag(566, 38, 'but rank each carbon separately');
    const row = (y, head, win, lose, verdict) => {
      let g = text(408, y, head, { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
      g += text(408, y + 20, win, { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
      g += text(408, y + 38, lose, { cls: 'fg-sm', size: 10, anchor: 'start' });
      g += text(736, y + 20, verdict, { cls: 'fg-sm', size: 10, anchor: 'end' });
      return g;
    };
    s += row(96, 'On C2:  Br  against  CH₃', 'Br wins — atomic number 35 beats 6', 'nothing else is compared', 'points UP');
    s += row(176, 'On C3:  CH₃  against  H', 'CH₃ wins — carbon beats hydrogen', 'nothing else is compared', 'points UP');
    s += text(408, 234, 'Both winners on the same side:', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(566, 262, '(Z)-2-bromo-2-butene', { cls: 'fg-tag-good', size: 12.5 });

    s += rule(30, 290, 730, 290);
    s += text(380, 326, 'Same molecule, two labels: "trans" was reporting the methyls, E/Z reports the priorities.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'One assignment, done in full. Each alkene carbon is ranked on its own two groups and nothing else — the bromine on C2 is never weighed against the methyl on C3. Here both winners finish above the double bond, so the alkene is Z even though the carbon skeleton is drawn trans.',
  note: 'The error this drawing is built to prevent: comparing a group on one alkene carbon with a group on the other. That question has no meaning. E/Z asks two independent questions and then compares only the two answers.',
});

/* ---------------------------------------------------------------- 8.3 ---
   Three mechanistic steps in one paragraph, no arrows, for the reaction the
   section itself calls the bridge into the next chapter. */
FIGURES.push({
  id: 'hydration-three-steps',
  section: 'addition-reactions',
  anchor: '<h3>Acid-catalyzed hydration</h3>',
  alt: 'Acid-catalyzed hydration of propene in three panels. First the pi bond attacks a proton of hydronium, giving a secondary carbocation. Then a water molecule attacks the cation with one of its lone pairs, giving a positively charged oxonium ion. Finally a second water molecule removes a proton from that oxygen, giving propan-2-ol and regenerating hydronium.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const box = (x, title, sub) => panel(x, 16, 236, 216) + tag(x + 118, 40, title) + text(x + 118, 214, sub, { cls: 'fg-sm', size: 9.5 });

    // ---- step 1: protonation
    s += box(8, 'Step 1 · protonation', 'Markovnikov: the better cation wins');
    const a0 = P(64, 150), a1 = P(106, 126), a2 = P(148, 150);
    s += skDouble(a0, a1, P(106, 176));
    s += sk(a1, a2);
    const hp = P(96, 70);
    s += atom(hp.x, hp.y, 'H', { r: 13, kind: 'hi' });
    s += text(130, 66, 'from H₃O⁺', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += curve(P(85, 138), P(96, 86), { bow: 22 });
    s += text(44, 168, 'C1', { cls: 'fg-sm', size: 9 });
    s += text(168, 168, 'C3', { cls: 'fg-sm', size: 9 });
    s += text(106, 196, 'the H lands on C1', { cls: 'fg-sm', size: 9 });
    s += arrow(P(228, 130), P(252, 130), { muted: true });

    // ---- step 2: water attacks
    s += box(260, 'Step 2 · capture', 'water is the nucleophile');
    const b0 = P(316, 150), b1 = P(358, 126), b2 = P(400, 150);
    s += sk(b0, b1) + sk(b1, b2);
    s += plus(358, 104);
    s += text(358, 176, 'secondary cation', { cls: 'fg-tag-warn', size: 9.5 });
    const ow = P(440, 78);
    s += atom(ow.x, ow.y, 'O', { r: 14, kind: 'hi' });
    s += text(466, 62, 'H', { cls: 'fg-sm', size: 10 });
    s += text(466, 96, 'H', { cls: 'fg-sm', size: 10 });
    s += lonePair(ow.x, ow.y, 200, { dist: 24 });
    s += curve(P(420, 92), P(368, 116), { bow: 20 });
    s += arrow(P(480, 130), P(504, 130), { muted: true });

    // ---- step 3: deprotonation
    s += box(512, 'Step 3 · give the proton back', 'the catalyst comes back out');
    const c0 = P(568, 150), c1 = P(610, 126), c2 = P(652, 150);
    s += sk(c0, c1) + sk(c1, c2);
    const oo = P(610, 78);
    s += bond(c1, oo, { rFrom: 0, rTo: 14 });
    s += atom(oo.x, oo.y, 'O', { r: 14, kind: 'hi' });
    s += plus(610, 44);
    s += text(584, 60, 'H', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(638, 88, 'H', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(688, 62, 'H₂O', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += curve(P(684, 74), P(652, 84), { bow: -16 });
    s += text(610, 176, 'the oxonium ion', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(610, 192, 'lose that H⁺ and it is propan-2-ol', { cls: 'fg-sm', size: 9 });

    s += rule(30, 248, 730, 248);
    s += text(380, 274, 'The acid is a catalyst in the strict sense: consumed in step 1, handed back in step 3.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 294, 'Step 1 makes a free carbocation — so this route rearranges when a better cation is near.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Hydration with the arrows drawn. Every one of the three steps is a move you have already met: a pi bond taking a proton, a lone pair attacking a cation, and a base removing a proton from oxygen. The only thing worth memorizing is the order.',
  note: 'Notice what is NOT here: hydroxide. In acid the nucleophile is neutral water, and the extra proton it brings is removed afterwards. Drawing HO⁻ attacking in acidic solution is the most common way this mechanism is written wrong.',
});

/* ---------------------------------------------------------------- 8.4 ---
   "Every time you draw a carbocation, check for the shift" — with no shift
   drawn anywhere in the section. */
FIGURES.push({
  id: 'hydride-shift-worked',
  section: 'addition-reactions',
  anchor: 'Every time you draw a carbocation, check for the shift.</div>',
  alt: '3-methyl-1-butene plus HBr in four stages: protonation of the terminal carbon gives a secondary carbocation; a hydride on the neighboring carbon migrates with its pair of electrons, moving the positive charge to the tertiary carbon; bromide then captures that tertiary cation to give 2-bromo-2-methylbutane as the major product, with the unrearranged secondary bromide as the minor one.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    /* 3-methyl-1-butene, skeletal: C1=C2-C3(-CH3)-C4 */
    const stage = (x, mode) => {
      const v1 = P(x, 168), v2 = P(x + 40, 144), v3 = P(x + 80, 168), v4 = P(x + 120, 144);
      const me = P(x + 80, 214);
      let g = '';
      if (mode === 'alkene') g += skDouble(v1, v2, P(x + 20, 194));
      else g += sk(v1, v2);
      g += sk(v2, v3) + sk(v3, v4) + sk(v3, me);
      return { g, v1, v2, v3, v4, me };
    };

    // 1: the alkene + HBr
    let t = stage(24, 'alkene'); s += t.g;
    s += text(64, 122, 'H–Br', { cls: 'fg-lbl', size: 11 });
    s += curve(P(38, 152), P(58, 124), { bow: 16 });
    s += text(104, 240, '3-methyl-1-butene', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(168, 168), P(198, 168), { muted: true });

    // 2: secondary cation, hydride poised to shift
    t = stage(212, 'cation'); s += t.g;
    s += plus(252, 122);
    s += text(252, 108, '2°', { cls: 'fg-tag-warn', size: 9.5 });
    s += bond(t.v3, P(330, 192), { rFrom: 0, rTo: 12 });
    s += atom(330, 192, 'H', { r: 12, kind: 'hi' });
    s += curve(P(312, 186), P(262, 152), { bow: 22 });
    s += text(292, 240, 'hydride shifts, with its pair', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(360, 168), P(390, 168), { muted: true });

    // 3: tertiary cation
    t = stage(404, 'cation'); s += t.g;
    s += bond(t.v2, P(444, 106), { rFrom: 0, rTo: 12 });
    s += atom(444, 106, 'H', { r: 12, kind: 'hi' });
    s += plus(496, 152);
    s += text(484, 240, '3° cation — the more stable one', { cls: 'fg-tag-good', size: 9.5 });
    s += arrow(P(552, 168), P(582, 168), { muted: true });

    // 4: product
    t = stage(596, 'cation'); s += t.g;
    const brv = P(676, 108);
    s += bond(t.v3, brv, { rFrom: 0, rTo: 16 });
    s += atom(brv.x, brv.y, 'Br', { kind: 'hi', r: 16 });
    s += text(676, 240, '2-bromo-2-methylbutane', { cls: 'fg-tag-good', size: 9.5 });
    s += text(676, 256, 'the MAJOR product', { cls: 'fg-sm', size: 9 });

    s += rule(30, 270, 730, 270);
    s += text(380, 294, 'The shift is faster than bromide capture, so the rearranged bromide dominates.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The shift, drawn. A hydrogen on the carbon next door leaves with <b>both</b> of its bonding electrons and lands on the cationic carbon — which moves the positive charge the other way, from secondary to tertiary. Nothing else in the molecule changes.',
  note: 'The arrow starts at the C–H BOND, not at the hydrogen. That is the whole content of the word "hydride": H with its pair, not H⁺. If you draw the arrow from the hydrogen itself you have written a proton transfer, which would leave an alkene behind instead of a rearranged cation.',
});

/* ---------------------------------------------------------------- 8.5 ---
   Halohydrin regiochemistry was stated in one clause. It is the clause exams
   test, and it only makes sense if the bridged ion is drawn UNEVEN. */
FIGURES.push({
  id: 'halohydrin-uneven-bridge',
  section: 'addition-reactions',
  anchor: 'finish <b>anti</b> however unsymmetrical the ion was.</p>',
  alt: 'A bromonium ion from 2-methylpropene drawn with its two carbon-bromine bonds unequal: the bond to the more substituted carbon is long and dashed and that carbon carries a partial positive charge, while the bond to the CH2 end is short and full. Water attacks the more substituted carbon from the face opposite the bromine, giving a halohydrin with OH on the more substituted carbon and Br on the other, anti to each other.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += panel(10, 14, 420, 244);
    s += tag(220, 40, 'the bridged ion is not symmetrical');
    const cl = P(160, 176), cr = P(280, 176), brT = P(220, 104);
    s += bond(cl, cr, { rFrom: 15, rTo: 15 });
    s += bond(cl, brT, { rFrom: 15, rTo: 16 });
    s += `<line class="fg-dash-hi" x1="${268}" y1="${163}" x2="${230}" y2="${118}"></line>`;
    s += atom(brT.x, brT.y, 'Br', { kind: 'hi', r: 16 });
    s += plus(244, 92);
    s += atom(cl.x, cl.y, 'C');
    s += atom(cr.x, cr.y, 'C', { kind: 'warn' });
    s += text(302, 158, 'δ+', { cls: 'fg-warn', size: 12, anchor: 'start' });
    s += text(124, 214, 'CH₂ end', { cls: 'fg-sm', size: 9.5 });
    s += text(124, 230, 'short, tight C–Br', { cls: 'fg-sm', size: 9 });
    s += text(316, 214, 'two methyls here', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(316, 230, 'long, weak C–Br', { cls: 'fg-tag-warn', size: 9, anchor: 'start' });
    const w = P(312, 252);
    s += text(w.x + 26, w.y, 'H₂O', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += curve(P(330, 244), P(292, 196), { bow: -18 });
    s += text(220, 60, 'the carbon that can hold charge takes more of it', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(440, 150), P(478, 150));
    s += text(459, 134, 'anti', { cls: 'fg-sm', size: 9.5 });

    s += panel(492, 14, 258, 244);
    s += tag(621, 40, 'the halohydrin');
    const q1 = P(578, 132), q2 = P(660, 132);
    s += bond(q1, q2, { rFrom: 15, rTo: 15 });
    const ohv = P(660, 76), brv = P(578, 190);
    s += wedge(q2, ohv, { rFrom: 15, rTo: 16, width: 10 });
    s += hash(q1, brv, { rFrom: 15, rTo: 16, width: 12, rungs: 4 });
    s += atom(ohv.x, ohv.y, 'OH', { kind: 'hi', r: 16 });
    s += atom(brv.x, brv.y, 'Br', { r: 16 });
    s += atom(q1.x, q1.y, 'C') + atom(q2.x, q2.y, 'C');
    s += text(694, 126, 'CH₃', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(694, 146, 'CH₃', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(621, 226, 'OH on the more substituted carbon', { cls: 'fg-sm', size: 9.5 });
    s += text(621, 244, 'wedge and hash: opposite faces', { cls: 'fg-sm', size: 9 });

    s += rule(30, 270, 730, 270);
    s += text(380, 294, 'Charge says WHICH carbon; the blocked face says WHICH SIDE.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'Why water goes to the crowded carbon. Because that carbon is better able to carry positive charge, the bridge leans toward it: its bond to bromine stretches, it takes on real cationic character, and the barrier to attacking it drops below the barrier for attacking the tidy CH₂ end.',
  note: 'This is the one addition where the nucleophile lands on the MORE substituted carbon while the halogen ends up on the less substituted one. It is not an anti-Markovnikov reaction and it is not an SN2 preference — sterics would have sent water the other way, and charge overrules them.',
});

/* ---------------------------------------------------------------- 8.6 ---
   The peroxide route is a chain, and chains are examined in the initiation /
   propagation / termination form the radical chapter already taught. The
   section had it as two sentences. */
FIGURES.push({
  id: 'hbr-radical-chain',
  section: 'markovnikov',
  anchor: 'That one difference is the whole regiochemical story.</p>',
  alt: 'The radical chain for HBr addition to an alkene. Initiation: a peroxide splits into two alkoxy radicals, one of which takes a hydrogen from HBr to make a bromine radical. The two propagation steps are drawn as a cycle: the bromine radical adds to the less substituted carbon of the alkene leaving the more stable radical, and that carbon radical takes a hydrogen from HBr, regenerating the bromine radical.',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    s += panel(10, 14, 246, 250);
    s += tag(133, 40, 'INITIATION — happens once');
    s += text(133, 76, 'RO–OR', { cls: 'fg-lbl', size: 12 });
    s += arrow(P(133, 88), P(133, 118), { muted: true });
    s += text(133, 138, '2 RO·', { cls: 'fg-lbl', size: 12 });
    s += text(133, 160, 'the weak O–O bond breaks', { cls: 'fg-sm', size: 9 });
    s += text(133, 194, 'RO· + H–Br', { cls: 'fg-lbl', size: 12 });
    s += arrow(P(133, 206), P(133, 228), { muted: true });
    s += text(133, 248, 'RO–H + Br·', { cls: 'fg-tag-good', size: 12 });

    s += panel(272, 14, 478, 250);
    s += tag(511, 40, 'PROPAGATION — repeats thousands of times');

    // the cycle: two nodes, two curved arrows between them
    const left = P(378, 150), right = P(644, 150);
    s += text(left.x, left.y - 44, 'Br·', { cls: 'fg-lbl', size: 13 });
    s += text(left.x, left.y - 26, 'the chain carrier', { cls: 'fg-sm', size: 9 });
    s += text(right.x, right.y - 44, '·C–C–Br', { cls: 'fg-lbl', size: 13 });
    s += text(right.x, right.y - 26, 'the more stable radical', { cls: 'fg-sm', size: 9 });

    s += curve(P(left.x + 44, left.y - 8), P(right.x - 52, right.y - 8), { bow: -30 });
    s += text(511, 78, '1 · Br· adds to the LESS substituted carbon', { cls: 'fg-sm', size: 10 });
    s += text(511, 94, 'so the radical is left on the more substituted one', { cls: 'fg-sm', size: 9 });

    s += curve(P(right.x - 52, right.y + 12), P(left.x + 44, left.y + 12), { bow: -30 });
    s += text(511, 216, '2 · it takes H from H–Br and hands back a Br·', { cls: 'fg-sm', size: 10 });
    s += text(511, 232, 'which is why one initiation turns over thousands of molecules', { cls: 'fg-sm', size: 9 });

    s += text(378, 190, '+ alkene', { cls: 'fg-sm', size: 9.5 });
    s += text(644, 190, '+ H–Br', { cls: 'fg-sm', size: 9.5 });

    s += rule(30, 282, 730, 282);
    s += text(380, 306, 'TERMINATION: two carriers meet — Br· + Br·, or two carbon radicals — and that chain stops.', { cls: 'fg-sm', size: 10.5 });
    s += text(380, 330, 'Bromine adds FIRST — every difference from the ionic route follows.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The chain written out in the form an exam asks for. The two propagation steps are a closed loop — bromine radical in, bromine radical out — so the alkene and the HBr are consumed while the carrier is not, and a trace of peroxide converts a whole flask.',
  note: 'Every arrow in a radical mechanism is a fishhook, moving ONE electron, and the reason the regiochemistry flips is at the top of the loop: a bromine ATOM adds before any hydrogen does, so it takes the position a proton would have taken in the ionic route.',
});

/* ---------------------------------------------------------------- 8.7 ---
   The transition state that unifies "sterics" and "B-H polarity", and the
   wedge/dash picture the worked example's answer cannot be checked without. */
FIGURES.push({
  id: 'hydroboration-syn-ring',
  section: 'markovnikov',
  anchor: 'a geometric consequence of the transition state having a closed ring.</p>',
  alt: 'Left: the four-center transition state for hydroboration, with dashed partial bonds from boron to the less substituted carbon and from hydrogen to the more substituted one, a partial positive charge on the more substituted carbon and partial negative on boron. Right: 1-methylcyclohexene reacting to give trans-2-methylcyclohexan-1-ol, with the new hydrogen on C1 and the new OH on C2 both drawn on wedges, which puts the OH on the opposite face from the methyl.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    // ---- left: the four-center TS
    s += panel(10, 14, 336, 248);
    s += tag(178, 40, 'one closed ring, four atoms');
    const cA = P(126, 118), cB = P(230, 118), bB = P(230, 196), hH = P(126, 196);
    s += bond(cA, cB, { order: 2, gap: 4.6 });
    s += `<line class="fg-dash-hi" x1="${230}" y1="${133}" x2="${230}" y2="${181}"></line>`;
    s += `<line class="fg-dash-hi" x1="${141}" y1="${189}" x2="${180}" y2="${170}"></line>`;
    s += bond(bB, hH, { rFrom: 15, rTo: 13 });
    s += atom(cA.x, cA.y, 'C', { kind: 'warn' });
    s += atom(cB.x, cB.y, 'C');
    s += atom(bB.x, bB.y, 'B', { kind: 'hi' });
    s += atom(hH.x, hH.y, 'H', { r: 13 });
    s += text(100, 96, 'δ+', { cls: 'fg-warn', size: 12, anchor: 'end' });
    s += text(258, 196, 'δ−', { cls: 'fg-sm', size: 11, anchor: 'start' });
    s += text(96, 140, 'more', { cls: 'fg-sm', size: 9, anchor: 'end' });
    s += text(96, 154, 'substituted', { cls: 'fg-sm', size: 9, anchor: 'end' });
    s += text(262, 140, 'less', { cls: 'fg-sm', size: 9, anchor: 'start' });
    s += text(262, 154, 'hindered', { cls: 'fg-sm', size: 9, anchor: 'start' });
    s += text(178, 232, 'B takes the roomy carbon; H follows the charge', { cls: 'fg-sm', size: 9.5 });
    s += text(178, 248, 'the closed ring blocks the other face', { cls: 'fg-tag-warn', size: 9.5 });

    // ---- right: the ring result
    s += panel(360, 14, 390, 248);
    s += tag(555, 40, 'so, on a ring: syn ≠ cis product');
    const ring = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => {
      const a = (-90 + i * 60) * Math.PI / 180;
      return P(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    });
    const R1 = ring(462, 150, 50);
    for (let i = 0; i < 6; i++) s += sk(R1[i], R1[(i + 1) % 6]);
    s += skDouble(R1[0], R1[1], P(462, 150));
    s += sk(R1[0], P(462, 62));
    s += text(462, 56, 'CH₃', { cls: 'fg-sm', size: 9.5 });
    s += text(452, 226, '1-methylcyclohexene', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(534, 150), P(570, 150));
    s += text(552, 136, 'BH₃', { cls: 'fg-sm', size: 9 });
    s += text(552, 170, 'H₂O₂', { cls: 'fg-sm', size: 9 });

    const R2 = ring(654, 150, 50);
    for (let i = 0; i < 6; i++) s += sk(R2[i], R2[(i + 1) % 6]);
    // C1 = R2[0] (top), C2 = R2[1] (upper right)
    s += wedge(R2[0], P(R2[0].x - 34, R2[0].y - 20), { rFrom: 0, rTo: 13, width: 9 });
    s += hash(R2[0], P(R2[0].x + 34, R2[0].y - 20), { rFrom: 0, rTo: 16, width: 11, rungs: 4 });
    s += atom(R2[0].x - 34, R2[0].y - 20, 'H', { r: 13, kind: 'hi' });
    s += atom(R2[0].x + 34, R2[0].y - 20, 'CH₃', { r: 16 });
    s += wedge(R2[1], P(R2[1].x + 38, R2[1].y - 10), { rFrom: 0, rTo: 16, width: 9 });
    s += atom(R2[1].x + 38, R2[1].y - 10, 'OH', { r: 16, kind: 'hi' });
    s += text(640, 226, 'trans-2-methylcyclohexan-1-ol', { cls: 'fg-tag-good', size: 9.5 });
    s += text(640, 242, 'new H and new OH both on wedges', { cls: 'fg-sm', size: 9 });

    s += rule(30, 278, 730, 278);
    s += text(380, 302, '"Syn" describes the two groups ADDED — not the methyl already there.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 324, 'H lands on the front of C1, pushing its methyl back — so the OH finishes trans.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The transition state, and what it does to a ring. Boron and hydrogen are joined to the two carbons in one four-membered arrangement, so they cannot arrive from opposite faces — and the partial positive charge sitting on the more substituted carbon is what sends boron to the other one.',
  note: 'Students lose this mark by reading "syn addition" as "cis product". The two new groups are cis to each other; whether the product is called cis or trans depends on what else the ring was already carrying, which here is a methyl group on the same carbon as the new hydrogen.',
});

/* ---------------------------------------------------------------- 8.8 ---
   "cis alkene, trans alkene, or alkane, purely by reagent choice" is a claim
   about geometry, made in a section with no geometry drawn. */
FIGURES.push({
  id: 'alkyne-reduction-fork',
  section: 'alkynes',
  anchor: 'which is precisely why alkynes are so useful as synthetic intermediates. Alkene geometry is otherwise hard to control.</p>',
  alt: 'One internal alkyne, 2-butyne, with three arrows leading to three different products: hydrogen over Lindlar catalyst gives the cis alkene with both methyls on the same side; sodium in liquid ammonia gives the trans alkene with the methyls on opposite sides; hydrogen over ordinary palladium gives butane.',
  viewBox: '0 0 760 360',
  build() {
    let s = '';
    // starting alkyne
    const t1 = P(70, 180), t2 = P(130, 180);
    s += bond(t1, t2, { order: 3, rFrom: 0, rTo: 0, gap: 5 });
    s += sk(P(30, 202), t1) + sk(t2, P(170, 202));
    s += text(100, 148, '2-butyne', { cls: 'fg-lbl', size: 11.5 });
    s += text(100, 230, 'one starting material', { cls: 'fg-sm', size: 9.5 });

    const outcome = (y, reagent, sub, kind, mode, name, why) => {
      let g = bond(P(190, 180), P(238, y), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
      g += arrow(P(244, y), P(320, y));
      g += text(282, y - 16, reagent, { cls: 'fg-lbl', size: 11 });
      g += text(282, y + 22, sub, { cls: 'fg-sm', size: 9 });
      const a = P(392, y), b = P(452, y);
      if (mode === 'alkane') {
        g += sk(P(352, y + 22), a) + sk(a, b) + sk(b, P(492, y + 22));
      } else {
        g += bond(a, b, { order: 2, rFrom: 0, rTo: 0, gap: 4.6 });
        if (mode === 'cis') { g += sk(P(352, y - 24), a); g += sk(b, P(492, y - 24)); }
        else { g += sk(P(352, y + 24), a); g += sk(b, P(492, y - 24)); }
      }
      g += text(512, y - 4, name, { cls: kind, size: 12, anchor: 'start' });
      g += text(512, y + 16, why, { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      return g;
    };
    s += outcome(70, 'H₂ , Lindlar', 'Pd poisoned with Pb', 'fg-tag-good', 'cis',
      'cis (Z) alkene', 'both H from one metal surface');
    s += outcome(180, 'Na , NH₃ (l)', 'e⁻, H⁺, e⁻, H⁺', 'fg-tag-good', 'trans',
      'trans (E) alkene', 'the vinyl anion sets the shape');
    s += outcome(292, 'H₂ , Pd/C', 'no poison', 'fg-tag', 'alkane',
      'butane', 'both pi bonds gone');

    s += rule(30, 330, 730, 330);
    s += text(380, 354, 'Three reagents, three answers, one substrate — geometry chosen, not inherited.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The fork that makes alkynes worth building. A triple bond is the one place in this course where you can choose the geometry of a double bond outright: the same 2-butyne becomes the cis alkene, the trans alkene or the alkane depending only on what you put in the flask.',
  note: 'The two partial reductions differ in where the hydrogens come from. Lindlar hands both over from one metal surface at once, so they land on one face. Sodium in ammonia delivers them one at a time through free intermediates, and the roomier trans arrangement is the one that survives to be protonated the second time.',
});

/* ---------------------------------------------------------------- 8.9 ---
   The section goes out of its way to say tautomerization is not resonance,
   which is exactly the distinction real arrows settle. */
FIGURES.push({
  id: 'keto-enol-arrows',
  section: 'alkynes',
  anchor: 'giving a ketone.</p>',
  alt: 'Keto-enol tautomerization under acid in two steps. First the enol pi bond attacks a proton from hydronium, putting the hydrogen on the terminal carbon and giving a cation stabilized by the oxygen lone pair. Then a water molecule removes the proton from that oxygen, leaving a carbon-oxygen double bond: the ketone.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    const box = (x, w, title) => panel(x, 14, w, 218) + tag(x + w / 2, 40, title);

    // --- enol
    s += box(8, 238, 'the enol');
    const e1 = P(84, 170), e2 = P(140, 140), e3 = P(196, 170);
    s += skDouble(e1, e2, P(112, 196));
    s += sk(e2, e3);
    const eo = P(140, 88);
    s += bond(e2, eo, { rFrom: 0, rTo: 14 });
    s += atom(eo.x, eo.y, 'O', { r: 14, kind: 'hi' });
    s += text(166, 76, 'H', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += lonePair(eo.x, eo.y, 180, { dist: 24 });
    s += curve(P(100, 158), P(78, 200), { bow: 18 });
    s += text(70, 218, 'H₃O⁺', { cls: 'fg-sm', size: 10 });
    s += text(152, 210, 'the pi bond takes H⁺', { cls: 'fg-sm', size: 9 });
    s += arrow(P(256, 130), P(282, 130), { muted: true });

    // --- cation
    s += box(290, 200, 'oxygen holds the charge');
    const f1 = P(348, 170), f2 = P(404, 140), f3 = P(460, 170);
    s += sk(f1, f2) + sk(f2, f3);
    const fo = P(404, 88);
    s += bond(f2, fo, { order: 2, rFrom: 0, rTo: 14, gap: 4 });
    s += atom(fo.x, fo.y, 'O', { r: 14, kind: 'hi' });
    s += plus(428, 74);
    s += text(430, 100, 'H', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(340, 194, 'H added here', { cls: 'fg-sm', size: 9 });
    s += text(476, 78, 'H₂O', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += curve(P(474, 90), P(440, 96), { bow: -14 });
    s += arrow(P(500, 130), P(526, 130), { muted: true });

    // --- ketone
    s += box(534, 216, 'the ketone');
    const g1 = P(592, 170), g2 = P(648, 140), g3 = P(704, 170);
    s += sk(g1, g2) + sk(g2, g3);
    const go = P(648, 88);
    s += bond(g2, go, { order: 2, rFrom: 0, rTo: 14, gap: 4 });
    s += atom(go.x, go.y, 'O', { r: 14, kind: 'hi' });
    s += lonePair(go.x, go.y, 210, { dist: 24 });
    s += lonePair(go.x, go.y, 330, { dist: 24 });
    s += text(642, 206, 'acetone — the keto side', { cls: 'fg-tag-good', size: 9.5 });

    s += rule(30, 250, 730, 250);
    s += text(380, 274, 'A hydrogen moved from O to C — so these are two COMPOUNDS, not resonance forms.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 296, 'Resonance moves only electrons and is drawn ↔. This is drawn ⇌: both species are real.', { cls: 'fg-sm', size: 10 });
    s += text(380, 316, 'Keto wins by 10⁵ or more — a C=O is worth more than a C=C plus an O–H.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Tautomerization with the arrows drawn. Under the acidic conditions of an alkyne hydration it is two ordinary steps: the enol pi bond takes a proton onto carbon, and a water molecule then takes the proton off oxygen. The oxygen lone pair is what makes the intermediate cation affordable.',
  note: 'This is the fastest way to tell a tautomer from a resonance form. Cover the hydrogens and the two structures differ only in where a pi bond sits — that looks like resonance. Uncover them and a hydrogen has physically moved, which no resonance arrow is allowed to do.',
});


/* ----------------------------------------------------------------- B0a ---
   s-cis and s-trans are named, contrasted with cis/trans, declared the
   commonest reason a Diels-Alder fails and then carried through two more
   sections - without a picture anywhere. It is a three-dimensional idea about
   one rotation, which is the definition of something prose is bad at. */
FIGURES.push({
  id: 's-cis-s-trans',
  section: 'conjugated-systems',
  anchor: 'The prefix <i>s</i> is the only thing marking the difference in writing.</p>',
  alt: 'Buta-1,3-diene drawn s-trans with its two double bonds pointing opposite ways, a rotation arrow about the central single bond, and the same molecule s-cis with both double bonds pointing the same way and the two inner hydrogens crowding. Below, cyclopentadiene locked s-cis by its ring and a fused bicyclic diene locked s-trans.',
  viewBox: '0 0 760 420',
  build() {
    let s = '';
    const chain = (pts, hi) => {
      let t = '';
      t += bond(pts[0], pts[1], { order: 2, rFrom: 0, rTo: 0 });
      t += bond(pts[1], pts[2], { cls: hi ? 'fg-bond-hi' : 'fg-bond', rFrom: 0, rTo: 0 });
      t += bond(pts[2], pts[3], { order: 2, rFrom: 0, rTo: 0 });
      for (const q of pts) t += atom(q.x, q.y, '', { kind: 'point' });
      return t;
    };

    // ---- s-trans, the extended zig-zag most dienes sit in ----
    s += tag(155, 74, 's-trans');
    s += chain([P(80, 160), P(130, 126), P(180, 160), P(230, 126)], true);
    s += text(155, 196, 'the two C=C point opposite ways', { cls: 'fg-sm', size: 10 });
    s += text(155, 212, 'the usual conformer', { cls: 'fg-sm', size: 10 });

    // ---- the rotation between them ----
    s += curve(P(272, 132), P(438, 132), { bow: -30 });
    s += curve(P(438, 172), P(272, 172), { bow: -30 });
    s += text(355, 92, 'rotate about the highlighted', { cls: 'fg-tag', size: 10.5 });
    s += text(355, 108, 'C2–C3 single bond', { cls: 'fg-tag', size: 10.5 });
    s += text(355, 156, 'about 12 kJ/mol uphill', { cls: 'fg-sm', size: 10 });
    s += text(355, 200, 'no bond is broken,', { cls: 'fg-sm', size: 10 });
    s += text(355, 214, 'and no new compound made', { cls: 'fg-sm', size: 10 });

    // ---- s-cis, the one that reacts ----
    s += tag(554, 62, 's-cis');
    s += chain([P(486, 116), P(524, 166), P(584, 166), P(622, 116)], true);
    // The two inner hydrogens are the whole cost of this conformation, so they
    // are the only hydrogens drawn anywhere in the figure.
    s += bond(P(486, 116), P(534, 92), { rFrom: 0, rTo: 16 });
    s += bond(P(622, 116), P(574, 92), { rFrom: 0, rTo: 16 });
    s += atom(534, 92, 'H', { kind: 'warn' });
    s += atom(574, 92, 'H', { kind: 'warn' });
    s += text(554, 128, 'these two crowd', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(554, 196, 'both C=C point the same way', { cls: 'fg-sm', size: 10 });
    s += text(554, 212, 'the only one that can cyclize', { cls: 'fg-sm', size: 10 });

    s += rule(30, 234, 730, 234);

    // ---- locked s-cis: cyclopentadiene ----
    s += tag(170, 254, 'cyclopentadiene — locked s-cis');
    const pc = P(170, 314), r5 = 46, v = [];
    for (let i = 0; i < 5; i++) {
      const a = (-90 + i * 72) * Math.PI / 180;
      v.push(P(pc.x + Math.cos(a) * r5, pc.y + Math.sin(a) * r5));
    }
    // v2 is the sp3 CH2; the diene runs v3=v4 - v4-v0 - v0=v1.
    s += bond(v[1], v[2], { rFrom: 0, rTo: 0 });
    s += bond(v[2], v[3], { rFrom: 0, rTo: 0 });
    s += bond(v[4], v[0], { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
    s += ringDouble(v[0], v[1], pc);
    s += ringDouble(v[3], v[4], pc);
    for (const q of v) s += atom(q.x, q.y, '', { kind: 'point' });
    s += text(v[2].x + 30, v[2].y + 14, 'sp³ CH₂', { cls: 'fg-sm', size: 9.5 });
    s += text(170, 388, 'the ring holds both ends forward', { cls: 'fg-sm', size: 10 });
    s += text(170, 404, 'so reactive it dimerizes on standing', { cls: 'fg-sm', size: 10 });

    // ---- locked s-trans: a diene across a ring fusion ----
    s += tag(508, 254, 'fused ring — locked s-trans');
    const r6 = 44, k = r6 * Math.sqrt(3) / 2, cyA = 314;
    const cxA = 470, cxB = cxA + 2 * k;
    const hex = (cx) => ({
      e30: P(cx + k, cyA + r6 / 2), e90: P(cx, cyA + r6), e150: P(cx - k, cyA + r6 / 2),
      e210: P(cx - k, cyA - r6 / 2), e270: P(cx, cyA - r6), e330: P(cx + k, cyA - r6 / 2),
    });
    const A = hex(cxA), B = hex(cxB);
    // Ring A, then ring B, sharing the vertical edge A.e330-A.e30.
    for (const [a, b] of [[A.e30, A.e90], [A.e90, A.e150], [A.e150, A.e210], [A.e210, A.e270]]) s += bond(a, b, { rFrom: 0, rTo: 0 });
    for (const [a, b] of [[B.e90, B.e30], [B.e30, B.e330], [B.e330, B.e270], [B.e270, A.e330]]) s += bond(a, b, { rFrom: 0, rTo: 0 });
    s += bond(A.e330, A.e30, { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });   // the central single bond
    s += ringDouble(A.e270, A.e330, P(cxA, cyA));
    s += ringDouble(B.e90, A.e30, P(cxB, cyA));
    for (const q of [A.e30, A.e90, A.e150, A.e210, A.e270, A.e330, B.e30, B.e90, B.e270, B.e330]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += text(508, 388, 'the two C=C are held on opposite sides', { cls: 'fg-sm', size: 10 });
    s += text(508, 404, 'of that same bond, and cannot swing round', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'One bond, two conformations, and two rings that take the choice away. Rotating about the highlighted central single bond swings the two double bonds from opposite sides to the same side; nothing is broken and no new compound is made. The two structures underneath are dienes whose rings have already decided the question for them.',
  note: 'This is why the distinction from <i>cis</i> and <i>trans</i> matters in practice rather than as a naming point. A cis alkene and a trans alkene are two bottles on a shelf; s-cis and s-trans are the same bottle, and every open-chain diene spends a little of its time in each. Which is also why the locked cases are the interesting ones: a ring can take a diene permanently out of the reaction, and no amount of electronic tuning brings it back.',
});

/* ----------------------------------------------------------------- B0b ---
   HOMO, LUMO and pi* are used in three later sections and taught in none.
   This is the missing ladder: n p orbitals make n orbitals, the bottom half
   fill, and the two at the frontier are the two that do chemistry. The gap
   shrinking left to right is the UV-Vis section's whole argument, drawn once
   here so that section can measure it rather than assert it. */
FIGURES.push({
  id: 'butadiene-mo-ladder',
  section: 'conjugated-systems',
  anchor: 'the LUMO is the cheapest place to put electrons that arrive.</p>',
  alt: 'Molecular orbital energy ladders for ethene, buta-1,3-diene and hexa-1,3,5-triene side by side. Each has as many orbitals as p orbitals, the lower half filled with electron pairs, and the HOMO-LUMO gap marked; the gap shrinks from ethene to the triene. Below, the butadiene HOMO is drawn as four p orbitals whose lobes are largest at the two ends and change phase at a node between the middle carbons.',
  viewBox: '0 0 760 500',
  build() {
    let s = '';
    s += arrow(P(40, 300), P(40, 64));
    s += text(50, 58, 'energy', { cls: 'fg-tag', size: 11, anchor: 'start' });

    const col = (cx, name, sub, levels, homoAt) => {
      let t = '';
      levels.forEach((lv, i) => {
        t += rule(cx - 60, lv.y, cx + 60, lv.y);
        t += text(cx - 66, lv.y + 4, lv.name, { cls: 'fg-sm', size: 10, anchor: 'end' });
        if (i <= homoAt) {
          // two electrons, drawn as the pair of dots used for a lone pair
          t += `<circle class="fg-lp" cx="${cx - 13}" cy="${lv.y}" r="3.4"></circle>`;
          t += `<circle class="fg-lp" cx="${cx + 13}" cy="${lv.y}" r="3.4"></circle>`;
        }
      });
      const hi = levels[homoAt].y, lo = levels[homoAt + 1].y;
      t += text(cx + 66, hi + 4, 'HOMO', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
      t += text(cx + 66, lo + 4, 'LUMO', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
      t += arrow(P(cx, hi - 7), P(cx, lo + 7), { size: 7 });
      t += arrow(P(cx, lo + 7), P(cx, hi - 7), { size: 7 });
      t += text(cx + 8, (hi + lo) / 2 + 4, 'gap', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
      t += text(cx, 306, name, { cls: 'fg-lbl', size: 12 });
      t += text(cx, 322, sub, { cls: 'fg-sm', size: 9.5 });
      return t;
    };

    /* The heights are Huckel's, not free-hand: every level sits at
       alpha - 2*beta*cos(k*pi/(n+1)), drawn at 55 px per |beta| about a
       common alpha line at y = 180. That matters because the two claims the
       figure makes pull in opposite directions and both have to be visible:
       the ladder gets TALLER as it lengthens (the diene's top orbital is
       above ethene's pi*) while the frontier GAP still closes, because the
       extra rungs crowd in faster than the two ends spread out. Drawn level
       with pi*, as the top rung once was, the first claim silently fails. */
    s += col(170, 'Ethene', '2 p orbitals \u2192 2 orbitals',
      [{ name: 'π', y: 235 }, { name: 'π*', y: 125 }], 0);
    s += col(380, 'Buta-1,3-diene', '4 p orbitals \u2192 4 orbitals',
      [{ name: 'ψ₁', y: 269 }, { name: 'ψ₂', y: 214 }, { name: 'ψ₃', y: 146 }, { name: 'ψ₄', y: 91 }], 1);
    s += col(590, 'Hexa-1,3,5-triene', '6 p orbitals \u2192 6 orbitals',
      [{ name: 'ψ₁', y: 279 }, { name: 'ψ₂', y: 249 }, { name: 'ψ₃', y: 204 },
       { name: 'ψ₄', y: 156 }, { name: 'ψ₅', y: 111 }, { name: 'ψ₆', y: 81 }], 2);

    s += rule(30, 340, 730, 340);

    // ---- the butadiene HOMO drawn out ----
    s += text(240, 352, 'the HOMO of buta-1,3-diene, ψ₂', { cls: 'fg-tag', size: 11 });
    const y0 = 432, xs = [150, 210, 270, 330];
    const sizes = [[17, 23], [11, 16], [11, 16], [17, 23]];
    const tops = ['fg-orb', 'fg-orb', 'fg-orb-alt', 'fg-orb-alt'];
    xs.forEach((x, i) => {
      const [rx, ry] = sizes[i];
      s += lobeE(x, y0 - 18 - ry / 2, rx, ry, tops[i]);
      s += lobeE(x, y0 + 18 + ry / 2, rx, ry, tops[i] === 'fg-orb' ? 'fg-orb-alt' : 'fg-orb');
    });
    for (let i = 0; i < 3; i++) s += bond(P(xs[i], y0), P(xs[i + 1], y0), { cls: 'fg-bond-soft', rFrom: 0, rTo: 0 });
    xs.forEach((x, i) => {
      s += atom(x, y0, '', { kind: 'point' });
      s += text(x, y0 + 16, `C${i + 1}`, { cls: 'fg-sm', size: 9.5 });
    });
    s += `<line class="fg-orb-node" x1="240" y1="378" x2="240" y2="486"></line>`;
    s += text(240, 498, 'node', { cls: 'fg-sm', size: 9.5 });

    s += text(380, 382, 'Biggest at C1 and C4, least in the middle.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(380, 402, 'The phase flips once, between C2 and C3.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(380, 432, 'A partner meets this orbital where it', { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
    s += text(380, 452, 'is largest — so a diene reacts at C1', { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
    s += text(380, 472, 'and C4, and never in the middle.', { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
    return s;
  },
  caption: 'The ladder behind the vocabulary. Overlapping n parallel p orbitals makes n orbitals; the n electrons fill the bottom half; the top filled one is the HOMO and the first empty one is the LUMO. Adding conjugation stretches the ladder a little at both ends and adds rungs faster than it stretches, so the HOMO climbs, the LUMO drops, and the gap between them closes.',
  note: 'Both of the chapter’s later sections are read off this one picture. The gap narrowing left to right is what a UV-Vis spectrometer measures, and it is why a longer conjugated system absorbs longer-wavelength light. The shape of ψ₂ underneath is why the reaction chemistry happens at the ends: it is the same claim the resonance forms of an allylic cation make, drawn as one orbital instead of two structures.',
});


/* ----------------------------------------------------------------- B2a ---
   The section's existing figure starts at the allylic cation and ends at the
   two products, which leaves the mechanism itself undrawn: the proton is
   never seen arriving, the two resonance forms are described in words and
   never drawn beside each other, and bromide's attack is a straight reaction
   arrow rather than a pair of electrons leaving a lone pair. This is the
   arrows. */
FIGURES.push({
  id: 'diene-protonation-arrows',
  section: 'diene-addition',
  anchor: 'pick the end whose cation has the better <i>major</i> resonance form.</p>',
  alt: 'Buta-1,3-diene attacking H-Br with a curved arrow from the C1-C2 pi bond to the hydrogen and a second arrow from the H-Br bond onto bromine. The resulting allylic cation is drawn as two resonance structures, positive on C2 in one and on C4 in the other, with a bromide ion below sending a curved arrow from a lone pair to each of those two carbons.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';

    // ---- step 1: the pi bond takes the proton ----
    s += tag(175, 56, 'step 1 — the π bond takes the proton');
    const c1 = P(115, 120), c2 = P(165, 90), c3 = P(215, 120), c4 = P(265, 90);
    s += bond(c1, c2, { order: 2, rFrom: 0, rTo: 0 });
    s += bond(c2, c3, { rFrom: 0, rTo: 0 });
    s += bond(c3, c4, { order: 2, rFrom: 0, rTo: 0 });
    for (const q of [c1, c2, c3, c4]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += text(108, 140, 'C1', { cls: 'fg-sm', size: 9.5 });
    s += text(165, 76, 'C2', { cls: 'fg-sm', size: 9.5 });
    s += text(215, 140, 'C3', { cls: 'fg-sm', size: 9.5 });
    s += text(274, 76, 'C4', { cls: 'fg-sm', size: 9.5 });

    const H = P(90, 176), Br = P(38, 176);
    s += bond(H, Br);
    s += atom(H.x, H.y, 'H');
    s += atom(Br.x, Br.y, 'Br');
    for (const a of [120, 180, 240]) s += lonePair(Br.x, Br.y, a);
    s += curve(P(138, 106), P(93, 160), { bow: 22 });
    s += curve(P(64, 176), P(46, 157), { bow: 14 });
    s += text(175, 212, 'the charge lands on C2, next to C3=C4', { cls: 'fg-sm', size: 10 });

    s += arrow(P(310, 120), P(368, 120));

    // ---- step 2: the same cation, drawn both ways ----
    s += tag(528, 56, 'step 2 — one cation, two forms');
    const A = [P(385, 120), P(423, 94), P(461, 120), P(499, 94)];
    s += bond(A[0], A[1], { rFrom: 0, rTo: 0 });
    s += bond(A[1], A[2], { rFrom: 0, rTo: 0 });
    s += bond(A[2], A[3], { order: 2, rFrom: 0, rTo: 0 });
    for (const q of A) s += atom(q.x, q.y, '', { kind: 'point' });
    s += text(423, 74, 'C2', { cls: 'fg-sm', size: 9.5 });
    s += text(423, 88, '+', { cls: 'fg-lbl', size: 15 });

    s += text(528, 116, '↔', { cls: 'fg-lbl', size: 18 });

    const B = [P(557, 120), P(595, 94), P(633, 120), P(671, 94)];
    s += bond(B[0], B[1], { rFrom: 0, rTo: 0 });
    s += bond(B[1], B[2], { order: 2, rFrom: 0, rTo: 0 });
    s += bond(B[2], B[3], { rFrom: 0, rTo: 0 });
    for (const q of B) s += atom(q.x, q.y, '', { kind: 'point' });
    s += text(671, 74, 'C4', { cls: 'fg-sm', size: 9.5 });
    s += text(671, 88, '+', { cls: 'fg-lbl', size: 15 });

    // ---- step 3: bromide arrives, from a lone pair, at either end ----
    s += atom(528, 196, 'Br⁻');
    for (const a of [0, 90, 180, 270]) s += lonePair(528, 196, a);
    s += curve(P(506, 190), P(437, 104), { bow: 24 });
    s += curve(P(550, 190), P(657, 104), { bow: -24 });
    s += text(528, 232, 'one bromide, two carbons to land on', { cls: 'fg-sm', size: 10 });

    s += rule(30, 248, 706, 248);
    s += text(375, 272, 'Both arrows leave one bromide and land on one cation — only the carbon differs.', { cls: 'fg-lbl', size: 12 });
    s += text(375, 290, 'C2 gives 3-bromobut-1-ene; C4 gives 1-bromobut-2-ene.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The mechanism with its arrows drawn. The diene’s terminal π bond reaches for the proton and the H–Br bond collapses onto bromine, which leaves a cation whose charge is genuinely shared between C2 and C4 — the two structures on the right are one species, not two. Bromide then arrives from a lone pair at whichever of those carbons it lands on.',
  note: 'Two habits this figure is trying to build. An arrow starts where the electrons <b>are</b>: on the π bond, on the H–Br bond, on a bromide lone pair — never on a positive charge and never on the hydrogen itself. And the double-headed arrow between the two cation structures means they are one thing drawn twice; a student who treats them as two intermediates in equilibrium will look for a step that converts one into the other, and there is none.',
});


/* ----------------------------------------------------------------- B3a ---
   The section's existing figure is the diene case with real compounds in the
   wells, which is right for that argument and wrong for carrying the idea to
   enolates and sulfonation. This is the stripped version - two hills, two
   valleys, no chemistry - and it adds the thing no diagram in the chapter
   showed: the barriers back OUT, which are what temperature is actually
   deciding about. */
FIGURES.push({
  id: 'kinetic-thermodynamic-generic',
  section: 'kinetic-thermodynamic',
  anchor: 'It is changing <b>whether the system is allowed to find out</b>.</p>',
  alt: 'A generic energy profile: one intermediate in the middle, a low barrier on the left leading to a shallow well and a higher barrier on the right leading to a deeper well. Double-headed arrows mark the barrier back out of each well, small on the left and large on the right.',
  viewBox: '0 0 760 430',
  build() {
    let s = '';
    s += arrow(P(44, 330), P(44, 60));
    s += text(54, 54, 'free energy', { cls: 'fg-tag', size: 11, anchor: 'start' });

    s += rule(300, 150, 460, 150);
    s += tag(380, 140, 'the intermediate');
    s += `<path class="fg-bond" fill="none" d="M300 150 C270 150 252 116 222 116 C190 116 172 240 120 240 L80 240"></path>`;
    s += `<path class="fg-bond" fill="none" d="M460 150 C486 150 506 86 534 86 C566 86 584 310 624 310 L662 310"></path>`;
    s += text(222, 104, 'lower ΔG‡', { cls: 'fg-tag-good', size: 11 });
    s += text(534, 74, 'higher ΔG‡', { cls: 'fg-tag-warn', size: 11 });

    // the depth comparison
    s += rule(120, 240, 624, 240);
    s += rule(624, 240, 624, 310);
    s += text(548, 262, 'deeper well', { cls: 'fg-tag-good', size: 10.5 });

    // the barriers back OUT - the measure temperature is deciding about
    s += rule(100, 116, 222, 116);
    s += arrow(P(100, 232), P(100, 122), { size: 7 });
    s += arrow(P(100, 122), P(100, 232), { size: 7 });
    s += text(118, 108, 'small barrier out', { cls: 'fg-tag-good', size: 10.5 });
    s += rule(534, 86, 644, 86);
    s += arrow(P(644, 302), P(644, 92), { size: 7 });
    s += arrow(P(644, 92), P(644, 302), { size: 7 });
    s += text(606, 332, 'large barrier out', { cls: 'fg-tag-warn', size: 10.5 });

    s += text(160, 268, 'shallow well — forms faster', { cls: 'fg-lbl', size: 11.5 });
    s += text(606, 352, 'deep well — more stable', { cls: 'fg-lbl', size: 11.5 });
    s += tag(380, 350, 'reaction coordinate');

    s += rule(30, 378, 730, 378);
    s += text(375, 400, 'Kinetics compares the two hills. Thermodynamics compares the two valleys.', { cls: 'fg-lbl', size: 12 });
    s += text(375, 418, 'Warming empties the shallow well first, because that is the one with a small barrier out.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The same picture with the chemistry taken out, so it can be carried anywhere. One branch point, two routes, and the two comparisons that disagree: the left hill is lower, the right valley is deeper. Nothing about either fact predicts the other.',
  note: 'The two vertical double arrows are the part usually left out, and they are what temperature acts on. Getting <i>into</i> a well is the forward barrier; getting back <i>out</i> of it is the forward barrier plus the well depth. The shallow well on the left has a small barrier out, so it is the first to start emptying as the flask warms — and everything that leaves it is re-sorted through the branch point until it finds the deep well on the right and stays there.',
});


/* ----------------------------------------------------------------- B4a ---
   endo/exo is the chapter's purest three-dimensional idea and it was carried
   by two sentences of prose. Seen from the side, the whole argument is one
   picture: the dienophile lies under the diene either way, and the only
   question is whether its substituent points in under the diene or out away
   from it. */
FIGURES.push({
  id: 'endo-exo-stacked',
  section: 'diels-alder',
  anchor: 'nothing here is reversing at ordinary temperatures.</p>',
  alt: 'Two side-on views of a diene stacked above a dienophile. On the left, endo: the dienophile carbonyl points inward, underneath the diene, with a dotted secondary orbital contact to the diene above it. On the right, exo: the same carbonyl points outward and downward, away from the diene, with no such contact.',
  viewBox: '0 0 760 360',
  build() {
    let s = '';
    const stack = (x0, endo) => {
      let t = '';
      const dL = P(x0 + 60, 140), dR = P(x0 + 280, 140);
      const pL = P(x0 + 90, 214), pR = P(x0 + 250, 214);
      t += bond(dL, dR, { rFrom: 0, rTo: 0 });
      t += `<path class="fg-bond" fill="none" d="M${dL.x} 140 Q${x0 + 170} 104 ${dR.x} 140"></path>`;
      t += bond(pL, pR, { rFrom: 0, rTo: 0 });
      for (const q of [dL, dR, pL, pR]) t += atom(q.x, q.y, '', { kind: 'point' });
      t += bond(dL, pL, { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
      t += bond(dR, pR, { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
      const sub = endo ? P(x0 + 148, 188) : P(x0 + 124, 250);
      t += bond(pL, sub, { rFrom: 0, rTo: 15 });
      t += atom(sub.x, sub.y, 'C=O');
      if (endo) t += bond(sub, P(x0 + 158, 142), { cls: 'fg-dash', rFrom: 15, rTo: 0 });
      return t;
    };

    s += panel(20, 30, 330, 262);
    s += tag(185, 56, 'endo');
    s += text(185, 76, 'substituent tucked under the diene', { cls: 'fg-sm', size: 10 });
    s += text(185, 98, 'diene, seen edge-on', { cls: 'fg-sm', size: 9.5 });
    s += stack(35, true);
    s += text(185, 250, 'the dotted line is the secondary contact', { cls: 'fg-sm', size: 9.5 });
    s += text(185, 276, 'more crowded, and faster', { cls: 'fg-tag-good', size: 11 });

    s += panel(386, 30, 330, 262);
    s += tag(551, 56, 'exo');
    s += text(551, 76, 'substituent pointing away', { cls: 'fg-sm', size: 10 });
    s += text(551, 98, 'same two bonds forming', { cls: 'fg-sm', size: 9.5 });
    s += stack(401, false);
    s += text(551, 276, 'less crowded, and slower', { cls: 'fg-tag-warn', size: 11 });

    s += rule(30, 308, 706, 308);
    s += text(368, 330, 'Cyclopentadiene and maleic anhydride give the endo adduct, and give it faster.', { cls: 'fg-lbl', size: 12 });
    s += text(368, 348, 'The two new sigma bonds are identical in both stacks. Only the substituent has moved.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The two ways the same two molecules can stack, seen from the side. The dienophile lies under the diene either way and the two forming bonds — the dashed ones — are the same in both. What differs is where the dienophile’s carbonyl points: inward, underneath the diene, or outward and away from it.',
  note: 'The endo stack is plainly the more crowded of the two, and it is still the faster one, which is the point. Tucked underneath, the carbonyl’s π system sits directly below the π system the diene is using, and the two touch in the transition state without ever becoming a bond — a <b>secondary orbital interaction</b>. It lowers the barrier by more than the crowding raises it. Nothing about the product’s own stability is involved: endo is the kinetic answer, not the thermodynamic one.',
});


/* ----------------------------------------------------------------- B5a ---
   A UV-Vis section with no spectrum in it. The lambda-ladder figure puts
   compounds on a wavelength axis, which shows the RESULT of the argument;
   what the reader has never seen is the thing an instrument actually prints:
   an absorbance axis, a broad band, a peak you read lambda-max off, and a
   weak n->pi* transition sitting almost on the baseline beside it. */
FIGURES.push({
  id: 'uv-spectrum-trace',
  section: 'uv-vis',
  anchor: 'when you see a strongly colored organic compound, extended conjugation is the first thing to look for.</p>',
  alt: 'An absorbance-versus-wavelength plot from 180 to 400 nanometres. A tall broad band peaks at 217 nanometres for buta-1,3-diene, a second taller band peaks further right at 258 nanometres for hexa-1,3,5-triene, and a very small bump near 280 nanometers marks the weak n to pi-star transition of a ketone.',
  viewBox: '0 0 760 364',
  build() {
    let s = '';
    const X = (nm) => 90 + ((nm - 180) / 220) * 590;
    const trace = (mu, sig, amp, cls) => {
      let d = '';
      for (let nm = 180; nm <= 400; nm += 2) {
        const y = Math.max(72, 260 - amp * Math.exp(-((nm - mu) ** 2) / (2 * sig * sig)));
        d += (nm === 180 ? 'M' : 'L') + X(nm).toFixed(1) + ' ' + y.toFixed(1);
      }
      return `<path class="${cls}" fill="none" d="${d}"></path>`;
    };

    // axes
    s += arrow(P(90, 262), P(90, 68));
    s += text(96, 62, 'absorbance', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += rule(90, 260, 690, 260);
    for (let nm = 200; nm <= 400; nm += 50) {
      s += rule(X(nm), 260, X(nm), 267);
      s += text(X(nm), 280, String(nm), { cls: 'fg-sm', size: 10 });
    }
    s += tag(390, 302, 'wavelength (nm)');

    // the two pi -> pi* bands, and the weak n -> pi* one
    s += `<line class="fg-dash" x1="${X(217).toFixed(1)}" y1="100" x2="${X(217).toFixed(1)}" y2="260"></line>`;
    s += `<line class="fg-dash" x1="${X(258).toFixed(1)}" y1="85" x2="${X(258).toFixed(1)}" y2="260"></line>`;
    s += trace(280, 18, 12, 'fg-bond-soft');
    s += trace(217, 14, 160, 'fg-bond');
    s += trace(258, 16, 175, 'fg-bond-hi');

    /* Centred over its own peak: anchored at the left it ran back across the
       absorbance axis and the arrowhead sat inside the word. */
    s += text(X(217), 92, 'buta-1,3-diene, 217 nm', { cls: 'fg-lbl', size: 11.5 });
    s += text(X(258) + 10, 72, 'hexa-1,3,5-triene, 258 nm', { cls: 'fg-tag-good', size: 11.5, anchor: 'start' });
    /* The weak band is the ketone n → π* one, so it belongs at 280 nm, where
       the prose puts acetone. A leader runs from the label down to it, because
       at ε ≈ 20 the bump itself is a few pixels tall. */
    s += `<line class="fg-dash" x1="${X(280).toFixed(1)}" y1="216" x2="${X(280).toFixed(1)}" y2="248"></line>`;
    s += text(X(280) + 16, 192, 'n → π* of a ketone, 280 nm', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(X(280) + 16, 208, 'ε ≈ 20, so barely a ripple', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(566, 112, 'height is ε; position is λₘₐₓ', { cls: 'fg-tag', size: 11 });
    s += text(566, 130, 'and the two are independent', { cls: 'fg-sm', size: 10 });

    s += rule(30, 316, 706, 316);
    s += text(368, 338, 'Position says how long the conjugation is; height says how strongly it absorbs.', { cls: 'fg-lbl', size: 11.5 });
    s += text(368, 356, 'A UV band is broad because many vibrational levels take part in one transition.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'What the instrument actually prints. Each band is a single electronic transition, and λ<sub>max</sub> is read off the top of it. Adding one double bond to the conjugation moves the whole band 41 nm to the right — and, here, makes it taller as well.',
  note: 'The small bump near 280 nm is the part most students never meet, and it is the one that stops UV-Vis being read as "a long λ means a long chain". It is a lone pair on a carbonyl oxygen being promoted into the same π* orbital — an <b>n → π*</b> transition. It lands to the right of both π → π* bands here, and its ε is in the tens rather than the tens of thousands, because the two orbitals barely overlap. A big λ<sub>max</sub> with a tiny ε is a lone pair; a big λ<sub>max</sub> with a huge ε is a long conjugated system.',
});



/* ----------------------------------------------------------------- B0c ---
   The section argues that the ends of a conjugated system are where the
   chemistry happens, and rests that argument on allyl psi-2 having its node
   THROUGH C2 rather than between atoms. The MO figure above draws butadiene's
   psi-2, whose node falls between C2 and C3 — the other kind. The two node
   types are exactly what students mix up, and the one the prose needs was the
   one not drawn. This is it: three orbitals, three carbons, and the middle
   atom dropping out of the middle orbital. */
FIGURES.push({
  id: 'allyl-three-orbitals',
  section: 'conjugated-systems',
  anchor: 'The resonance drawing and the orbital drawing are the same statement made twice.</p>',
  alt: 'The three molecular orbitals of the allyl system, drawn as p orbital lobes on three carbons. In the lowest orbital every lobe has the same phase and the middle one is largest. In the middle orbital only C1 and C3 carry lobes, with opposite phases and a node drawn straight through C2. In the highest orbital all three carry lobes with the phase alternating and two nodes between the atoms.',
  viewBox: '0 0 760 430',
  build() {
    let s = '';
    const y0 = 176;

    /* One panel = one orbital. `coef` gives each carbon's lobe size, and a
       zero means the atom genuinely contributes nothing — which is the whole
       point of the middle orbital, so it is drawn as an absence rather than
       as a small lobe. `phase` alternates the two fill classes. */
    const orbital = (cx, title, sub, coef, phase, nodesAt, foot) => {
      let t = '';
      t += text(cx, 60, title, { cls: 'fg-lbl', size: 14 });
      t += text(cx, 80, sub, { cls: 'fg-sm', size: 9.5 });
      const xs = [cx - 58, cx, cx + 58];
      for (let i = 0; i < 2; i++) {
        t += bond(P(xs[i], y0), P(xs[i + 1], y0), { cls: 'fg-bond-soft', rFrom: 0, rTo: 0 });
      }
      xs.forEach((x, i) => {
        const rx = coef[i] === 0 ? 0 : coef[i] === 2 ? 16 : 13;
        const ry = coef[i] === 0 ? 0 : coef[i] === 2 ? 21 : 18;
        if (rx) {
          const top = phase[i] > 0 ? 'fg-orb' : 'fg-orb-alt';
          const bot = phase[i] > 0 ? 'fg-orb-alt' : 'fg-orb';
          t += lobeE(x, y0 - 18 - ry / 2, rx, ry, top);
          t += lobeE(x, y0 + 18 + ry / 2, rx, ry, bot);
        }
        t += atom(x, y0, '', { kind: 'point' });
        t += text(x, y0 + 16, `C${i + 1}`, { cls: 'fg-sm', size: 9.5 });
      });
      for (const nx of nodesAt) {
        t += `<line class="fg-orb-node" x1="${nx}" y1="124" x2="${nx}" y2="228"></line>`;
      }
      t += text(cx, 248, foot, { cls: 'fg-sm', size: 10 });
      return t;
    };

    s += panel(20, 30, 216, 250);
    s += orbital(128, 'ψ₁', 'lowest, every lobe in phase', [1, 2, 1], [1, 1, 1], [],
      'no node — fully bonding');
    s += panel(252, 30, 216, 250);
    s += orbital(360, 'ψ₂', 'the orbital the chemistry uses', [2, 0, 2], [1, 1, -1], [360],
      'node through C2 — nonbonding');
    s += text(360, 158, 'no lobe here', { cls: 'fg-sm', size: 9.5 });
    s += panel(484, 30, 216, 250);
    s += orbital(592, 'ψ₃', 'highest, empty in all three', [1, 2, 1], [1, -1, 1], [563, 621],
      'two nodes — antibonding');

    s += rule(30, 300, 710, 300);
    s += tag(370, 322, 'which of the three orbitals is occupied');
    s += text(370, 346, 'allyl cation — 2 electrons, ψ₁ only', { cls: 'fg-sm', size: 10.5 });
    s += text(370, 364, 'allyl radical — 3 electrons, one of them alone in ψ₂', { cls: 'fg-sm', size: 10.5 });
    s += text(370, 382, 'allyl anion — 4 electrons, ψ₁ and ψ₂ both full', { cls: 'fg-sm', size: 10.5 });
    s += rule(30, 396, 710, 396);
    s += text(370, 418, 'Whatever ψ₂ holds sits on C1 and C3 — which is what the resonance forms say.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Three p orbitals, three molecular orbitals, and a middle one that skips the middle atom. ψ₂ is the orbital whose occupancy changes between the allyl cation, radical and anion, and C2 contributes nothing to it: its node does not fall between two atoms, it falls on one.',
  note: 'Two kinds of node, and telling them apart is most of the work. Butadiene’s ψ₂ has its node <i>between</i> C2 and C3, so all four carbons still carry lobes. Allyl’s ψ₂ has its node <i>through</i> C2, so that carbon carries none — and since the cation, the radical and the anion differ only in what ψ₂ holds, all three keep their charge or their odd electron at the two ends. Count the p orbitals first: an odd number puts a node on an atom, an even number puts it in a gap.',
});

/* ----------------------------------------------------------------- B4b ---
   Regiochemistry was the section's most figure-hungry idea and had no
   figure: which substituent lands where on a new ring is a question about
   two structures, and the prose was asking the reader to build both in their
   head. Drawn, the rule is one dashed line between the two atoms that want
   each other, and the wrong answer is visibly the one that pairs like with
   like. */
FIGURES.push({
  id: 'da-regiochemistry',
  section: 'diels-alder',
  anchor: 'and it weakens as either partner becomes less polarized.</div>',
  alt: 'On the left, a 1-methoxy-substituted diene with a delta minus marked on its far terminus, drawn above propenal with a delta plus marked on the carbon that does not carry the aldehyde, and a dashed line pairing those two atoms. On the right, two cyclohexene rings: the ortho product with the methoxy and the aldehyde on adjacent carbons, labeled as the product, and the meta product with them 1,3 apart, labeled as never seen.',
  viewBox: '0 0 760 430',
  build() {
    let s = '';

    // ---- the two partners, each polarized ----
    s += tag(160, 52, 'polarize each partner');
    const c1 = P(88, 146), c2 = P(128, 96), c3 = P(198, 96), c4 = P(238, 146);
    const dmid = P(163, 150);
    s += ringDouble(c1, c2, dmid);
    s += bond(c2, c3, { rFrom: 0, rTo: 0 });
    s += ringDouble(c3, c4, dmid);
    for (const q of [c1, c2, c3, c4]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += bond(c1, P(52, 178), { rFrom: 0, rTo: 17 });
    s += atom(52, 178, 'OMe', { r: 17, size: 10 });
    s += text(72, 136, 'C1', { cls: 'fg-sm', size: 9.5 });
    s += text(256, 136, 'C4', { cls: 'fg-sm', size: 9.5 });
    s += text(250, 170, 'δ−', { cls: 'fg-lbl', size: 13 });

    const d1 = P(118, 250), d2 = P(188, 250);
    s += bond(d1, d2, { order: 2, rFrom: 0, rTo: 0 });
    for (const q of [d1, d2]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += bond(d2, P(228, 282), { rFrom: 0, rTo: 17 });
    s += atom(228, 282, 'CHO', { r: 17, size: 10 });
    s += text(104, 238, 'δ+', { cls: 'fg-lbl', size: 13 });

    // The pairing itself: not a bond yet, so it is drawn as one.
    s += bond(c4, d1, { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
    s += text(160, 330, 'δ− meets δ+, so C4 bonds to the CH₂ end', { cls: 'fg-tag-good', size: 10.5 });
    s += text(160, 348, 'and C1 is left to take the CHO carbon', { cls: 'fg-sm', size: 10 });

    s += arrow(P(316, 190), P(372, 190));
    s += text(344, 176, 'two ways to join', { cls: 'fg-tag', size: 10.5 });

    // ---- the two rings that answer the question ----
    const ring = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        v.push(P(Math.round((cx + Math.cos(a) * r) * 10) / 10, Math.round((cy + Math.sin(a) * r) * 10) / 10));
      }
      return v;
    };
    /* v5 v0 v1 v2 are the diene's C1..C4 and v3 v4 the dienophile's two
       carbons, the same mapping the bond-accounting figure uses, so the two
       drawings can be read against each other. */
    const drawRing = (cx, choCarbon) => {
      const v = ring(cx, 150, 52), ctr = P(cx, 150);
      let t = '';
      t += bond(v[5], v[0], { rFrom: 0, rTo: 0 });
      t += ringDouble(v[0], v[1], ctr);
      t += bond(v[1], v[2], { rFrom: 0, rTo: 0 });
      t += bond(v[2], v[3], { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
      t += bond(v[3], v[4], { rFrom: 0, rTo: 0 });
      t += bond(v[4], v[5], { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
      for (const q of v) t += atom(q.x, q.y, '', { kind: 'point' });
      const out = (p, dx, dy, lbl) => {
        const at = P(p.x + dx, p.y + dy);
        return bond(p, at, { rFrom: 0, rTo: 17 }) + atom(at.x, at.y, lbl, { r: 17, size: 10 });
      };
      t += out(v[5], -29.4, -17, 'OMe');
      t += choCarbon === 4 ? out(v[4], -29.4, 17, 'CHO') : out(v[3], 0, 34, 'CHO');
      return t;
    };
    s += drawRing(480, 4);
    s += text(480, 272, '"ortho" — 1,2', { cls: 'fg-tag-good', size: 11 });
    s += text(480, 290, 'this is the product', { cls: 'fg-sm', size: 10 });
    s += drawRing(630, 3);
    s += text(630, 272, '"meta" — 1,3', { cls: 'fg-tag-warn', size: 11 });
    s += text(630, 290, 'never seen', { cls: 'fg-sm', size: 10 });

    s += rule(30, 372, 710, 372);
    s += text(370, 394, 'Join the diene’s δ− end to the dienophile’s δ+ carbon; the ring closes itself.', { cls: 'fg-lbl', size: 12 });
    s += text(370, 412, 'Move the donor to C2 of the diene and the same rule gives the "para" product.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The rule as a picture rather than as two borrowed words. A donor on the diene’s C1 makes C4 the nucleophilic end; a withdrawing group on the dienophile makes the <i>other</i> carbon the electrophilic one. Pair those two, and the second bond has only one place left to go — which puts the two substituents next door to each other.',
  note: 'The ring on the right is what the other orientation would give, and it is worth looking at once so you can rule it out on sight: making it would mean bonding δ− to the carbon that is already electron-rich. Note also what the rule does <b>not</b> produce — the 1,3 arrangement is never the favored orientation, so "meta" is a distractor rather than the major product.',
});

/* ----------------------------------------------------------------- B4c ---
   Two claims in this section were made in words only, and they are the same
   drawing seen twice. The canonical worked example asks the reader to see
   that the anhydride ends up on the side of the two-carbon bridge in a
   bicyclic cage; the retro recipe asks where to put the scissors. Draw the
   adduct once, mark the two bonds that made it, and both are answered. */
FIGURES.push({
  id: 'norbornene-endo-retro',
  section: 'diels-alder',
  /* Hand-placed between the worked example and the retro heading, because it
     answers the last line of the one and the first line of the other; the
     anchor below is only the fallback if those markers are ever lost. */
  anchor: '<h3>Running it backwards</h3>',
  alt: 'The cyclopentadiene plus maleic anhydride adduct drawn as a six-membered ring with a one-carbon CH2 bridge crossing in front of it. The anhydride is attached by hashed bonds pointing back, away from that bridge, which is the endo arrangement. Two bonds of the ring are highlighted and marked cut, and an arrow labeled heat leads to the two fragments, cyclopentadiene and maleic anhydride.',
  viewBox: '0 0 760 450',
  build() {
    let s = '';
    /* Norbornene drawn the way a textbook draws it: the six-membered ring
       flat on the page with the one-carbon bridge crossing its middle, which
       reads as the bridge coming toward you. A substituent drawn hashed is
       therefore on the far side from that bridge — and the far side from the
       CH2 bridge is the side of the two-carbon C=C bridge. That is endo. */
    const C1 = P(110, 163), C2 = P(150, 221), C3 = P(240, 221),
          C4 = P(280, 163), C5 = P(240, 105), C6 = P(150, 105);
    const ctr = P(195, 163);

    s += tag(195, 60, 'the endo adduct');
    s += text(195, 90, 'the two-carbon C=C bridge', { cls: 'fg-tag', size: 11 });
    s += bond(C1, C2, { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
    s += bond(C2, C3, { rFrom: 0, rTo: 0 });
    s += bond(C3, C4, { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
    s += bond(C4, C5, { rFrom: 0, rTo: 0 });
    s += ringDouble(C5, C6, ctr);
    s += bond(C6, C1, { rFrom: 0, rTo: 0 });
    for (const q of [C1, C2, C3, C4, C5, C6]) s += atom(q.x, q.y, '', { kind: 'point' });

    const C7 = P(195, 178);
    s += bond(C1, C7, { rFrom: 0, rTo: 17 });
    s += bond(C4, C7, { rFrom: 0, rTo: 17 });
    s += atom(C7.x, C7.y, 'CH₂', { r: 17, size: 10 });
    s += text(195, 148, 'the one-carbon bridge', { cls: 'fg-sm', size: 9.5 });

    // the anhydride, hashed so it points away from that bridge
    const AA = P(130, 290), AB = P(260, 290), AO = P(195, 326);
    s += hash(C2, AA, { rFrom: 0, rTo: 17 });
    s += hash(C3, AB, { rFrom: 0, rTo: 17 });
    s += bond(AA, AO, { rFrom: 17, rTo: 15 });
    s += bond(AB, AO, { rFrom: 17, rTo: 15 });
    s += atom(AA.x, AA.y, 'C=O', { r: 17, size: 10 });
    s += atom(AB.x, AB.y, 'C=O', { r: 17, size: 10 });
    s += atom(AO.x, AO.y, 'O');

    // where the scissors go
    s += bond(P(140.7, 184.6), P(119.3, 199.4), { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
    s += bond(P(270.7, 199.4), P(249.3, 184.6), { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
    s += text(95, 186, 'cut', { cls: 'fg-tag-warn', size: 11 });
    s += text(295, 186, 'cut', { cls: 'fg-tag-warn', size: 11 });
    s += text(195, 362, 'the anhydride points away from the CH₂ bridge', { cls: 'fg-sm', size: 10 });
    s += text(195, 380, 'and the two cut bonds are the two it made', { cls: 'fg-sm', size: 10 });

    s += arrow(P(390, 200), P(452, 200));
    s += text(421, 186, 'heat', { cls: 'fg-tag', size: 10.5 });
    s += text(421, 218, 'retro-DA', { cls: 'fg-sm', size: 10 });

    // ---- the two pieces that fall out ----
    const penta = (cx, cy, r, start) => {
      const v = [];
      for (let i = 0; i < 5; i++) {
        const a = (start + i * 72) * Math.PI / 180;
        v.push(P(Math.round((cx + Math.cos(a) * r) * 100) / 100, Math.round((cy + Math.sin(a) * r) * 100) / 100));
      }
      return v;
    };

    const cp = penta(580, 120, 44, -90), cpc = P(580, 120);
    s += bond(cp[0], cp[1], { rFrom: 0, rTo: 0 });
    s += ringDouble(cp[1], cp[2], cpc);
    s += bond(cp[2], cp[3], { rFrom: 0, rTo: 0 });
    s += ringDouble(cp[3], cp[4], cpc);
    s += bond(cp[4], cp[0], { rFrom: 0, rTo: 0 });
    for (const q of cp) s += atom(q.x, q.y, '', { kind: 'point' });
    s += text(580, 66, 'CH₂', { cls: 'fg-sm', size: 9.5 });
    s += text(580, 186, 'cyclopentadiene', { cls: 'fg-lbl', size: 12 });
    s += text(580, 216, '+', { cls: 'fg-lbl', size: 16 });

    const ma = penta(580, 300, 44, 90), mac = P(580, 300);
    s += bond(ma[0], ma[1], { rFrom: 15, rTo: 0 });
    s += bond(ma[1], ma[2], { rFrom: 0, rTo: 0 });
    s += ringDouble(ma[2], ma[3], mac);
    s += bond(ma[3], ma[4], { rFrom: 0, rTo: 0 });
    s += bond(ma[4], ma[0], { rFrom: 0, rTo: 15 });
    for (const q of [ma[1], ma[2], ma[3], ma[4]]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += atom(ma[0].x, ma[0].y, 'O');
    const exo = (v, sx) => {
      const at = P(v.x + sx * 32.3, v.y + 10.5);
      return bond(v, at, { order: 2, rFrom: 0, rTo: 15 }) + atom(at.x, at.y, 'O');
    };
    s += exo(ma[1], -1);
    s += exo(ma[4], 1);
    s += text(580, 392, 'maleic anhydride', { cls: 'fg-lbl', size: 12 });

    s += rule(30, 408, 710, 408);
    s += text(370, 430, 'Cut the two bonds that built the ring and the pieces fall straight out.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'One drawing doing two jobs. The cage is the adduct of cyclopentadiene and maleic anhydride: six-membered ring on the page, the old CH₂ crossing in front of it as a one-carbon bridge, and the anhydride hashed — pointing back, away from that bridge and toward the side the C=C bridge is on. The two highlighted bonds are the two the cycloaddition made, and heating breaks exactly those.',
  note: 'Read the hashed bonds as the definition of <b>endo</b> rather than as decoration: endo is the orientation in which the dienophile’s substituent finishes up on the far side from the short bridge. Then read the same picture backwards. The alkene is the marker — step one carbon out from each of its ends and cut, and you are holding the diene and the dienophile you started from. Every retro-Diels–Alder disconnection is this, on a ring that usually has no bridge to help you find the right two bonds.',
});

/* ----------------------------------------------------------------- B2b ---
   The section names Br2 as its second electrophile and asserts a bromonium
   ion that "opens to an allylic cation" — a step with two arrows in it, a
   choice of which end opens, and two dibromides at the end of it, none of
   which was drawn. A hard bank item rests on it. */
FIGURES.push({
  id: 'bromonium-diene',
  section: 'diene-addition',
  anchor: 'Cold conditions favor the 1,2-product and warm conditions the 1,4-product, for exactly the reasons below.</p>',
  alt: 'Three stages. Buta-1,3-diene attacks bromine with a curved arrow from the C1-C2 pi bond and a second arrow releasing bromide. The bromonium ion that results bridges C1 and C2, and a curved arrow breaks its C2 to bromine bond. The allylic cation left over carries bromine on C1 and partial positive charge on C2 and C4. Below, the two products: 3,4-dibromobut-1-ene from capture at C2 and 1,4-dibromobut-2-ene from capture at C4.',
  viewBox: '0 0 760 470',
  build() {
    let s = '';

    // ---- stage 1: the pi bond reaches for Br2 ----
    s += tag(118, 56, 'Br₂ meets buta-1,3-diene');
    const a1 = P(58, 130), a2 = P(100, 104), a3 = P(142, 130), a4 = P(184, 104);
    s += bond(a1, a2, { order: 2, rFrom: 0, rTo: 0 });
    s += bond(a2, a3, { rFrom: 0, rTo: 0 });
    s += bond(a3, a4, { order: 2, rFrom: 0, rTo: 0 });
    for (const q of [a1, a2, a3, a4]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += text(48, 148, 'C1', { cls: 'fg-sm', size: 9.5 });
    s += text(194, 92, 'C4', { cls: 'fg-sm', size: 9.5 });
    const B1 = P(66, 192), B2 = P(118, 192);
    s += bond(B1, B2);
    s += atom(B1.x, B1.y, 'Br');
    s += atom(B2.x, B2.y, 'Br');
    for (const ang of [180, 240]) s += lonePair(B1.x, B1.y, ang);
    for (const ang of [0, 60, 300]) s += lonePair(B2.x, B2.y, ang);
    s += curve(P(78, 120), P(70, 176), { bow: 18 });
    s += curve(P(92, 192), P(140, 206), { bow: -16 });
    s += text(118, 234, 'the π bond attacks Br₂', { cls: 'fg-sm', size: 10 });
    s += text(118, 250, 'and bromide leaves', { cls: 'fg-sm', size: 10 });

    s += arrow(P(216, 140), P(268, 140));

    // ---- stage 2: the bromonium ion, and which end opens ----
    s += tag(372, 56, 'a bromonium ion across C1–C2');
    const b1 = P(314, 140), b2 = P(356, 114), b3 = P(398, 140), b4 = P(440, 114);
    s += bond(b1, b2, { rFrom: 0, rTo: 0 });
    s += bond(b2, b3, { rFrom: 0, rTo: 0 });
    s += bond(b3, b4, { order: 2, rFrom: 0, rTo: 0 });
    for (const q of [b1, b2, b3, b4]) s += atom(q.x, q.y, '', { kind: 'point' });
    const Bp = P(335, 76);
    s += bond(b1, Bp, { rFrom: 0, rTo: 16 });
    s += bond(b2, Bp, { rFrom: 0, rTo: 16 });
    s += atom(Bp.x, Bp.y, 'Br', { kind: 'warn' });
    s += text(358, 68, '+', { cls: 'fg-lbl', size: 15 });
    s += text(304, 158, 'C1', { cls: 'fg-sm', size: 9.5 });
    s += text(450, 102, 'C4', { cls: 'fg-sm', size: 9.5 });
    s += curve(P(350, 104), P(326, 86), { bow: 14 });
    s += text(372, 200, 'it opens at C2 — the end', { cls: 'fg-sm', size: 10 });
    s += text(372, 216, 'whose cation is allylic', { cls: 'fg-sm', size: 10 });

    s += arrow(P(478, 140), P(508, 140));

    // ---- stage 3: the allylic cation, with bromine already on C1 ----
    s += tag(600, 56, 'one cation, two δ+ ends');
    const g1 = P(530, 130), g2 = P(586, 130), g3 = P(634, 130), g4 = P(682, 130);
    s += bond(g1, g2, { rFrom: 19, rTo: 15 });
    s += bond(g2, g3);
    s += bond(g3, g4);
    s += bond(P(586, 114), P(634, 114), { cls: 'fg-dash', rFrom: 13, rTo: 13 });
    s += bond(P(634, 114), P(682, 114), { cls: 'fg-dash', rFrom: 13, rTo: 13 });
    s += atom(g1.x, g1.y, 'CH₂Br', { r: 19, size: 9.5 });
    s += atom(g2.x, g2.y, 'CH');
    s += atom(g3.x, g3.y, 'CH');
    s += atom(g4.x, g4.y, 'CH₂');
    s += text(586, 100, 'δ+', { cls: 'fg-lbl', size: 13 });
    s += text(682, 100, 'δ+', { cls: 'fg-lbl', size: 13 });
    s += text(530, 160, 'C1', { cls: 'fg-sm', size: 9.5 });
    s += text(586, 160, 'C2', { cls: 'fg-sm', size: 9.5 });
    s += text(682, 160, 'C4', { cls: 'fg-sm', size: 9.5 });
    s += text(600, 200, 'Br is fixed on C1; the charge', { cls: 'fg-sm', size: 10 });
    s += text(600, 216, 'is shared between C2 and C4', { cls: 'fg-sm', size: 10 });

    // ---- the two products ----
    s += rule(30, 262, 710, 262);
    s += tag(370, 288, 'bromide then lands on C2 or on C4');

    const p1 = P(150, 340), p2 = P(190, 316), p3 = P(230, 340), p4 = P(270, 316);
    s += bond(p1, p2, { rFrom: 0, rTo: 0 });
    s += bond(p2, p3, { rFrom: 0, rTo: 0 });
    s += bond(p3, p4, { order: 2, rFrom: 0, rTo: 0 });
    for (const q of [p1, p2, p3, p4]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += bond(p1, P(120, 364), { rFrom: 0, rTo: 15 });
    s += atom(120, 364, 'Br');
    s += bond(p2, P(190, 282), { rFrom: 0, rTo: 15 });
    s += atom(190, 282, 'Br');
    s += text(200, 400, '3,4-dibromobut-1-ene', { cls: 'fg-lbl', size: 12 });
    s += text(200, 418, 'from 1,2-addition — favored cold', { cls: 'fg-sm', size: 10 });

    const q1 = P(480, 340), q2 = P(520, 316), q3 = P(560, 340), q4 = P(600, 316);
    s += bond(q1, q2, { rFrom: 0, rTo: 0 });
    s += bond(q2, q3, { order: 2, rFrom: 0, rTo: 0 });
    s += bond(q3, q4, { rFrom: 0, rTo: 0 });
    for (const q of [q1, q2, q3, q4]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += bond(q1, P(450, 364), { rFrom: 0, rTo: 15 });
    s += atom(450, 364, 'Br');
    s += bond(q4, P(630, 292), { rFrom: 0, rTo: 15 });
    s += atom(630, 292, 'Br');
    s += text(540, 400, '1,4-dibromobut-2-ene', { cls: 'fg-lbl', size: 12 });
    s += text(540, 418, 'from 1,4-addition — favored warm', { cls: 'fg-sm', size: 10 });

    s += rule(30, 434, 710, 434);
    s += text(370, 456, 'Same cation, same two ends — bromine has simply replaced the proton.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Bromine taking the same route the proton took. The diene’s π bond attacks one bromine and displaces the other as bromide, which leaves a three-membered bromonium ion bridging C1 and C2. That ring then opens — at C2, not C1 — and what is left is an allylic cation with a bromine already parked on C1.',
  note: 'Why the ring opens at C2 is the whole reason this case behaves like the HBr one. Breaking the C1–Br bond would leave a bare primary cation on C1, insulated from C3=C4 by an sp³ carbon. Breaking the C2–Br bond leaves the charge next door to that double bond, so it delocalizes to C4 — and from there the story is identical: bromide lands at C2 or at C4, and the temperature decides which of the two you isolate.',
});

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










/* ------------------------------------------------------------- 10.4 ---
   The butterfly transition state and what "syn, stereospecific" buys you.
   Both epoxide figures in the section are about OPENING the ring; the one
   3D claim the section makes about forming it — one oxygen, one face, at
   once — was prose only, and it is examined three times in the bank. */
FIGURES.push({
  id: 'mcpba-butterfly-syn',
  section: 'alkene-oxidation',
  anchor: 'Reactions that convert stereochemistry into stereochemistry this predictably are called <b>stereospecific</b>.',
  alt: 'Top: the butterfly transition state, with mCPBA above an alkene, two dashed partial bonds running from the same peroxyacid oxygen down to both alkene carbons and the oxygen-oxygen bond drawn as breaking. Bottom left: cis-2-butene giving the cis epoxide, with both methyl groups on wedges and a mirror plane through the ring, labeled meso and achiral. Bottom right: trans-2-butene giving the trans epoxide, drawn as the two enantiomers 2R,3R and 2S,3S in equal amounts.',
  viewBox: '0 0 760 500',
  build() {
    let s = '';

    // ---------------- the transition state ----------------
    s += panel(8, 16, 744, 236);
    s += tag(380, 42, 'THE BUTTERFLY TRANSITION STATE — ONE OXYGEN, ONE FACE, ALL AT ONCE');

    const cL = P(300, 176), cR = P(380, 176);
    s += bond(cL, cR, { order: 2, rFrom: 15, rTo: 15 });
    s += bond(cL, armEnd(cL, 215, 42), { rTo: 13 }) + atom(armEnd(cL, 215, 42).x, armEnd(cL, 215, 42).y, 'R', { r: 13 });
    s += bond(cL, armEnd(cL, 145, 42), { rTo: 13 }) + atom(armEnd(cL, 145, 42).x, armEnd(cL, 145, 42).y, 'R', { r: 13 });
    s += bond(cR, armEnd(cR, 325, 42), { rTo: 13 }) + atom(armEnd(cR, 325, 42).x, armEnd(cR, 325, 42).y, 'R', { r: 13 });
    s += bond(cR, armEnd(cR, 35, 42), { rTo: 13 }) + atom(armEnd(cR, 35, 42).x, armEnd(cR, 35, 42).y, 'R', { r: 13 });
    s += atom(cL.x, cL.y, 'C', { kind: 'warn' });
    s += atom(cR.x, cR.y, 'C', { kind: 'warn' });

    const ot = P(340, 118), oi = P(408, 98), ca = P(468, 116), oc = P(468, 70);
    // the two bonds being made, drawn as partial bonds
    s += bond(ot, cL, { rFrom: 15, rTo: 16, cls: 'fg-dash-hi' });
    s += bond(ot, cR, { rFrom: 15, rTo: 16, cls: 'fg-dash-hi' });
    // the bond being broken
    s += bond(ot, oi, { rFrom: 15, rTo: 15, cls: 'fg-dash' });
    s += bond(oi, ca, { rTo: 15 });
    s += bond(ca, oc, { order: 2, rTo: 15 });
    s += bond(ca, armEnd(ca, 340, 46), { rTo: 13 }) + atom(armEnd(ca, 340, 46).x, armEnd(ca, 340, 46).y, 'R', { r: 13 });
    s += atom(oc.x, oc.y, 'O');
    s += atom(ca.x, ca.y, 'C');
    s += atom(oi.x, oi.y, 'O');
    s += atom(ot.x, ot.y, 'O', { kind: 'hi' });
    s += text(298, 100, 'this oxygen is', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(298, 114, 'the one delivered', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(556, 100, 'the weak O–O bond breaks', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(556, 114, 'in the same step, and the', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(556, 128, 'proton goes back to the acid', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(340, 222, 'Both C–O bonds form at once, from whichever face the peroxyacid sits on —', { cls: 'fg-sm', size: 9.5 });
    s += text(340, 238, 'and there is no intermediate for anything to rotate in.', { cls: 'fg-sm', size: 9.5 });

    // ---------------- the two stereochemical outcomes ----------------
    /* An epoxide drawn face-on: two carbons side by side, the oxygen bridging
       above them, and the two methyls on wedges or hashes to say which face
       they are on. */
    const epox = (x, y, leftUp, rightUp) => {
      const a = P(x, y), b = P(x + 60, y), o = P(x + 30, y - 46);
      let g = bond(a, b, { rFrom: 0, rTo: 0 });
      g += bond(a, o, { rFrom: 0, rTo: 15 }) + bond(b, o, { rFrom: 0, rTo: 15 });
      const mL = armEnd(a, 235, 44), mR = armEnd(b, 305, 44);
      g += (leftUp ? wedge : hash)(a, mL, { rFrom: 0, rTo: 18 });
      g += (rightUp ? wedge : hash)(b, mR, { rFrom: 0, rTo: 18 });
      g += atom(mL.x, mL.y, 'CH₃', { r: 18, size: 10 });
      g += atom(mR.x, mR.y, 'CH₃', { r: 18, size: 10 });
      g += atom(o.x, o.y, 'O');
      g += atom(a.x, a.y, '', { kind: 'point' });
      g += atom(b.x, b.y, '', { kind: 'point' });
      return g;
    };
    /* The alkene, drawn with both methyls on the same side (cis) or on
       opposite sides (trans). */
    const butene = (x, y, cis) => {
      const a = P(x, y), b = P(x + 60, y);
      let g = bond(a, b, { order: 2, rFrom: 0, rTo: 0 });
      const mL = armEnd(a, 215, 44), mR = cis ? armEnd(b, 325, 44) : armEnd(b, 35, 44);
      const hL = armEnd(a, 145, 40), hR = cis ? armEnd(b, 35, 40) : armEnd(b, 325, 40);
      g += bond(a, mL, { rFrom: 0, rTo: 18 }) + atom(mL.x, mL.y, 'CH₃', { r: 18, size: 10 });
      g += bond(b, mR, { rFrom: 0, rTo: 18 }) + atom(mR.x, mR.y, 'CH₃', { r: 18, size: 10 });
      g += bond(a, hL, { rFrom: 0, rTo: 12 }) + atom(hL.x, hL.y, 'H', { r: 12, size: 11 });
      g += bond(b, hR, { rFrom: 0, rTo: 12 }) + atom(hR.x, hR.y, 'H', { r: 12, size: 11 });
      g += atom(a.x, a.y, '', { kind: 'point' });
      g += atom(b.x, b.y, '', { kind: 'point' });
      return g;
    };

    s += panel(8, 268, 368, 206);
    s += tag(192, 294, 'cis-2-BUTENE');
    s += butene(52, 362, true);
    s += arrow(P(178, 356), P(218, 356), { muted: true });
    s += text(198, 342, 'mCPBA', { cls: 'fg-sm', size: 9.5 });
    s += epox(252, 370, true, true);
    s += text(192, 436, 'both methyls delivered to the same face:', { cls: 'fg-sm', size: 9.5 });
    s += text(192, 452, 'a MESO epoxide — achiral, one compound', { cls: 'fg-tag-good', size: 10.5 });

    s += panel(392, 268, 360, 206);
    s += tag(572, 294, 'trans-2-BUTENE');
    s += butene(428, 362, false);
    s += arrow(P(554, 356), P(594, 356), { muted: true });
    s += text(574, 342, 'mCPBA', { cls: 'fg-sm', size: 9.5 });
    s += epox(624, 370, true, false);
    s += text(572, 436, 'chiral — and the peroxyacid can sit on either face,', { cls: 'fg-sm', size: 9.5 });
    s += text(572, 452, 'so (2R,3R) and (2S,3S) come out 50:50: a RACEMATE', { cls: 'fg-tag-good', size: 10.5 });

    s += text(380, 492, 'Stereospecific: the alkene geometry sets the answer, not the reagent.', { cls: 'fg-lbl', size: 11 });
    return s;
  },
  caption: 'Why epoxidation is the cleanest stereochemistry in the chapter. One oxygen is handed to one face of the alkene in a single step, so the two new C–O bonds are <b>syn</b> and nothing in between exists long enough to rotate — which means the alkene’s geometry walks straight through into the product.',
  note: 'Work the two cases rather than memorizing them. <i>cis</i>-2-Butene puts both methyls on the same face of the ring, and that epoxide has an internal mirror plane, so the two faces of attack give the same achiral <b>meso</b> compound. <i>trans</i>-2-Butene puts them on opposite faces, and that epoxide is chiral — but a flat alkene offers mCPBA both faces equally, so you get equal amounts of the two enantiomers. Stereospecific does not mean enantioselective.',
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

/* ---------------------------------------------------------------- 165 ---
   The dimer. The prose asserts an eight-membered ring held by two hydrogen
   bonds at once and then explains a boiling point with it; that is a specific
   2D arrangement and the section had no picture of it. */
FIGURES.push({
  id: 'acid-dimer',
  section: 'carboxylic-acids',
  anchor: 'which is why the measured molecular weight of acetic acid vapor comes out close to double.</p>',
  viewBox: '0 0 760 360',
  alt: 'Two acetic acid molecules facing each other, each O-H hydrogen reaching across to the other molecule’s carbonyl oxygen, closing an eight-membered ring held by two hydrogen bonds',
  build() {
    let s = '';
    const meL = P(180, 180), cL = P(256, 180), o1L = P(330, 130), o2L = P(330, 230);
    const meR = P(580, 180), cR = P(504, 180), o1R = P(430, 230), o2R = P(430, 130);
    const hL = P(380, 244), hR = P(380, 116);

    s += bond(cL, o1L, { order: 2 });
    s += bond(cL, o2L);
    s += bond(cL, meL);
    s += bond(cR, o1R, { order: 2 });
    s += bond(cR, o2R);
    s += bond(cR, meR);
    s += bond(o2L, hL, { rTo: 10, cls: 'fg-bond' });
    s += bond(o2R, hR, { rTo: 10, cls: 'fg-bond' });
    // the two hydrogen bonds, drawn dashed
    s += bond(hL, o1R, { rFrom: 10, cls: 'fg-dash-hi' });
    s += bond(hR, o1L, { rFrom: 10, cls: 'fg-dash-hi' });

    s += atom(meL.x, meL.y, 'CH₃');
    s += atom(meR.x, meR.y, 'CH₃');
    s += atom(cL.x, cL.y, 'C', { kind: 'hi' });
    s += atom(cR.x, cR.y, 'C', { kind: 'hi' });
    s += atom(o1L.x, o1L.y, 'O'); s += lonePair(o1L.x, o1L.y, 250); s += lonePair(o1L.x, o1L.y, 190);
    s += atom(o1R.x, o1R.y, 'O'); s += lonePair(o1R.x, o1R.y, 110); s += lonePair(o1R.x, o1R.y, 170);
    s += atom(o2L.x, o2L.y, 'O'); s += lonePair(o2L.x, o2L.y, 110); s += lonePair(o2L.x, o2L.y, 300);
    s += atom(o2R.x, o2R.y, 'O'); s += lonePair(o2R.x, o2R.y, 250); s += lonePair(o2R.x, o2R.y, 70);
    s += atom(hL.x, hL.y, 'H', { r: 10 });
    s += atom(hR.x, hR.y, 'H', { r: 10 });

    s += tag(380, 92, 'hydrogen bond');
    s += tag(380, 276, 'hydrogen bond');

    s += rule(24, 296, 726, 296);
    s += text(24, 320, 'acetic acid · 60 g/mol · bp 118 °C', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(24, 342, 'acetone · 58 g/mol · bp 56 °C', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(700, 320, 'costs TWO hydrogen bonds', { cls: 'fg-lbl', size: 13, anchor: 'end' });
    s += text(700, 342, 'not one — hence the 62 °C', { cls: 'fg-sm', size: 10.5, anchor: 'end' });
    return s;
  },
  caption: 'Two carboxylic acids lock together through two hydrogen bonds at once, closing an eight-membered ring: each molecule donates its O–H to the other’s carbonyl oxygen. Breaking a dimer apart costs two hydrogen bonds rather than one, which is why acetic acid at 60 g/mol boils at 118 °C while acetone at 58 g/mol boils at 56 °C.',
  note: 'The pairing survives into the vapor, which is why a molecular-weight measurement on acetic acid vapor reads close to 120 rather than 60 — one of the older pieces of evidence that the dimer is a real species and not a way of drawing the liquid.',
});

/* ---------------------------------------------------------------- 166 ---
   The section asserts twice that the neutral acid’s OH donates into its own
   carbonyl, and draws only the anion. The claim that carries the second half
   of the section is the one with no picture. */
FIGURES.push({
  id: 'acid-donation-vs-ketone',
  section: 'carboxylic-acids',
  anchor: 'A carboxylic acid is therefore noticeably <i>less</i> reactive toward nucleophilic attack than a ketone.</p>',
  viewBox: '0 0 760 330',
  alt: 'Acetic acid with a curved arrow from the hydroxyl oxygen into the carbonyl and the resulting charge-separated contributor, beside acetone which has no lone-pair donor',
  build() {
    let s = '';
    s += tag(150, 44, 'acetic acid');
    const c1 = P(150, 140), o1 = P(150, 84), o2 = P(206, 174), h1 = P(252, 192), m1 = P(94, 174);
    s += bond(c1, o1, { order: 2 }); s += bond(c1, o2); s += bond(c1, m1);
    s += bond(o2, h1, { rTo: 10 });
    s += atom(m1.x, m1.y, 'CH₃');
    s += atom(o1.x, o1.y, 'O'); s += lonePair(o1.x, o1.y, 200);
    s += atom(o2.x, o2.y, 'O'); s += lonePair(o2.x, o2.y, 40); s += lonePair(o2.x, o2.y, 130);
    s += atom(h1.x, h1.y, 'H', { r: 10 });
    s += atom(c1.x, c1.y, 'C', { kind: 'hi' });
    s += curve(P(222, 190), P(182, 160), { bow: 24 });
    s += curve(P(168, 116), P(172, 94), { bow: 16 });

    s += arrow(P(266, 140), P(324, 140), { muted: true });
    s += text(295, 126, 'resonance', { cls: 'fg-tag', size: 10.5 });

    s += tag(404, 44, 'the contributor that matters');
    const c2 = P(404, 140), o3 = P(404, 84), o4 = P(460, 174), h2 = P(506, 192), m2 = P(348, 174);
    s += bond(c2, o3); s += bond(c2, o4, { order: 2 }); s += bond(c2, m2);
    s += bond(o4, h2, { rTo: 10 });
    s += atom(m2.x, m2.y, 'CH₃');
    s += atom(o3.x, o3.y, 'O', { kind: 'warn' }); s += text(430, 76, '−', { cls: 'fg-hi', size: 15 });
    s += atom(o4.x, o4.y, 'O', { kind: 'warn' }); s += text(486, 168, '+', { cls: 'fg-warn', size: 15 });
    s += atom(h2.x, h2.y, 'H', { r: 10 });
    s += atom(c2.x, c2.y, 'C', { kind: 'hi' });
    s += text(404, 214, 'carbon is no longer δ+', { cls: 'fg-sm', size: 10 });

    s += rule(536, 44, 536, 250);
    s += tag(616, 44, 'acetone');
    const c3 = P(616, 140), o5 = P(616, 84), m3 = P(560, 174), m4 = P(672, 174);
    s += bond(c3, o5, { order: 2 }); s += bond(c3, m3); s += bond(c3, m4);
    s += atom(m3.x, m3.y, 'CH₃'); s += atom(m4.x, m4.y, 'CH₃');
    s += atom(o5.x, o5.y, 'O'); s += lonePair(o5.x, o5.y, 200); s += lonePair(o5.x, o5.y, 340);
    s += atom(c3.x, c3.y, 'C', { kind: 'warn' });
    s += text(616, 214, 'no lone-pair donor', { cls: 'fg-sm', size: 10 });

    s += rule(24, 274, 726, 274);
    s += text(24, 300, 'The donation is happening in the NEUTRAL acid, before anything is removed.', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(24, 322, 'It cancels part of the carbonyl carbon’s δ+, so the acid is the worse electrophile.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The same lone pair, doing its other job. In the carboxylate this donation spreads a negative charge; here, in the neutral acid, it pushes electron density onto a carbon that was supposed to be electrophilic. Acetone has only alkyl groups attached and no lone pair to give, which is why its carbonyl is the hungrier of the two.',
  note: 'This is the half of the section students skip, because "the O–H is very acidic" and "the C=O is very electrophilic" sound like the same claim about a very polar molecule. They are opposite claims, and the drawing is why: the donation that makes the anion stable is the donation that makes the carbonyl dull.',
});

/* ---------------------------------------------------------------- 167 ---
   Beta-keto acid decarboxylation. The section makes the ring size the whole
   argument -- "one carbon closer or further and the ring the proton would
   have to close is the wrong size" -- and then draws nothing, so the reader
   has to build a six-membered transition state in their head from prose. It
   also names an enol as the immediate product, which is exactly the kind of
   intermediate a scheme drops if it is not drawn. */
FIGURES.push({
  id: 'beta-keto-decarboxylation',
  section: 'carboxylic-acids',
  anchor: 'A malonic acid, with two carboxyls on one carbon, does the same thing for the same reason, one of its carboxyls playing the part of the ketone.</p>',
  viewBox: '0 0 760 356',
  alt: 'A beta-keto acid drawn inside a six-membered cyclic transition state with three curved arrows, giving an enol plus carbon dioxide, and the enol tautomerizing to the ketone',
  build() {
    let s = '';
    // ---- panel 1: the cyclic transition state -------------------------
    const cK = P(107, 192), cA = P(152, 218), cC = P(197, 192);
    const oH = P(197, 140), h = P(152, 114), oK = P(107, 140);
    const me = P(62, 218), oC = P(242, 218);
    s += tag(152, 62, 'the six-membered ring, closing');
    s += bond(cK, oK, { order: 2 });
    s += bond(cK, cA); s += bond(cA, cC); s += bond(cC, oH);
    s += bond(oH, h, { rTo: 10 });
    s += bond(cC, oC, { order: 2 });
    s += bond(cK, me);
    s += `<line class="fg-dash-hi" x1="${145.2}" y1="${121.5}" x2="${115.8}" y2="${138.5}"></line>`;
    s += atom(me.x, me.y, 'CH₃'); s += atom(oC.x, oC.y, 'O');
    s += atom(oK.x, oK.y, 'O'); s += lonePair(oK.x, oK.y, 200);
    s += atom(oH.x, oH.y, 'O'); s += lonePair(oH.x, oH.y, 20);
    s += atom(h.x, h.y, 'H', { r: 10 });
    s += atom(cK.x, cK.y, 'C', { kind: 'hi' });
    s += atom(cA.x, cA.y, 'C', { kind: 'warn' });
    s += atom(cC.x, cC.y, 'C', { kind: 'hi' });
    // 1: ketone O grabs the proton. 2: the O-H pair becomes CO2's second pi
    // bond. 3: the C-C bond to the carboxyl becomes the enol's pi bond.
    s += curve(P(90, 124), P(140, 108), { bow: -14 });
    s += curve(P(172, 124), P(191, 167), { bow: 20 });
    s += curve(P(172, 202), P(132, 202), { bow: 22 });
    s += text(152, 262, '3-oxobutanoic acid', { cls: 'fg-sm', size: 10 });

    s += arrow(P(285, 168), P(335, 168), { muted: true });
    s += text(310, 152, 'warm', { cls: 'fg-tag', size: 10.5 });
    s += text(310, 192, '− CO₂', { cls: 'fg-tag-warn', size: 10.5 });

    // ---- panel 2: the enol ---------------------------------------------
    const c2 = P(410, 168), oh2 = P(410, 122), me2 = P(364, 194), ch2 = P(456, 194);
    s += bond(c2, oh2); s += bond(c2, me2); s += bond(c2, ch2, { order: 2 });
    s += atom(oh2.x, oh2.y, 'OH'); s += atom(me2.x, me2.y, 'CH₃');
    s += atom(ch2.x, ch2.y, 'CH₂'); s += atom(c2.x, c2.y, 'C', { kind: 'hi' });
    s += tag(410, 62, 'the immediate product is an enol');
    s += text(410, 262, 'C=C and an O–H, not a ketone yet', { cls: 'fg-sm', size: 10 });

    s += arrow(P(500, 168), P(550, 168), { muted: true });
    s += text(525, 152, 'tautomerize', { cls: 'fg-tag', size: 10.5 });

    // ---- panel 3: the ketone -------------------------------------------
    const c3 = P(620, 168), o3 = P(620, 122), me3 = P(574, 194), me4 = P(666, 194);
    s += bond(c3, o3, { order: 2 }); s += bond(c3, me3); s += bond(c3, me4);
    s += atom(o3.x, o3.y, 'O'); s += lonePair(o3.x, o3.y, 200);
    s += atom(me3.x, me3.y, 'CH₃'); s += atom(me4.x, me4.y, 'CH₃');
    s += atom(c3.x, c3.y, 'C', { kind: 'hi' });
    s += tag(620, 62, 'what you isolate');
    s += text(620, 262, 'acetone', { cls: 'fg-sm', size: 10 });

    s += rule(24, 288, 726, 288);
    s += text(24, 314, 'Count the ring: ketone O, ketone C, alpha C, carboxyl C, carboxyl O, and the moving H.', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(24, 338, 'One carbon nearer and that ring is five-membered, one further and it is seven — neither closes.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Three arrows going round one ring, all at once. The ketone oxygen reaches over and takes the carboxyl proton; the O–H electrons become the second pi bond of the departing CO₂; and the C–C bond that held the carboxyl on becomes the pi bond of an enol. Nothing else in the molecule has to move, which is why gentle warming is enough.',
  note: 'The enol is a real intermediate and not a bookkeeping device — the ring cannot deliver a ketone directly, because the proton it moved went onto the ketone oxygen. Tautomerization afterwards is fast and one-way, so what you isolate is the ketone, but a mechanism drawn straight from the ring to acetone has skipped a step a grader will look for. This is also the last step of the malonic and acetoacetic ester syntheses, where the same ring closes on a carboxyl or a ketone that was installed for exactly this purpose.',
});

/* ---------------------------------------------------------------- 168 ---
   Amide resonance in the section that teaches it. The peptide chapter already
   has a version of this picture; the ladder chapter, where the claim about
   restricted rotation is first made, had none. */
FIGURES.push({
  id: 'amide-rotation-locked',
  section: 'esters-amides',
  anchor: "The whole amide unit is planar, and the nitrogen is not pyramidal as an amine's would be.</p>",
  viewBox: '0 0 760 330',
  alt: 'Dimethylformamide with a curved arrow from the nitrogen lone pair into the carbonyl, and the resulting contributor with a C=N double bond, positive nitrogen and negative oxygen',
  build() {
    let s = '';
    const draw = (ox, dbl) => {
      const c = P(ox, 150), o = P(ox, 94), h = P(ox - 56, 184), nA = P(ox + 56, 184);
      const ma = P(ox + 112, 150), mb = P(ox + 56, 240);
      let t = '';
      t += bond(c, o, { order: dbl ? 1 : 2 });
      t += bond(c, nA, { order: dbl ? 2 : 1 });
      t += bond(c, h, { rTo: 10 });
      t += bond(nA, ma); t += bond(nA, mb);
      t += atom(ma.x, ma.y, 'CH₃'); t += atom(mb.x, mb.y, 'CH₃');
      t += atom(h.x, h.y, 'H', { r: 10 });
      t += atom(c.x, c.y, 'C', { kind: 'hi' });
      if (dbl) {
        t += atom(o.x, o.y, 'O', { kind: 'warn' });
        t += text(ox + 26, 86, '−', { cls: 'fg-hi', size: 15 });
        t += atom(nA.x, nA.y, 'N', { kind: 'warn' });
        t += text(ox + 82, 200, '+', { cls: 'fg-warn', size: 15 });
      } else {
        t += atom(o.x, o.y, 'O'); t += lonePair(o.x, o.y, 200); t += lonePair(o.x, o.y, 340);
        t += atom(nA.x, nA.y, 'N', { kind: 'hi' });
        t += lonePair(nA.x, nA.y, 135);
      }
      t += text(ma.x, ma.y + 32, 'Me(a)', { cls: 'fg-sm', size: 10 });
      t += text(mb.x + 46, mb.y + 4, 'Me(b)', { cls: 'fg-sm', size: 10 });
      return t;
    };
    s += draw(140, false);
    s += draw(500, true);
    s += curve(P(178, 168), P(166, 132), { bow: -22 });
    s += curve(P(160, 128), P(164, 108), { bow: 14 });
    s += arrow(P(320, 150), P(388, 150), { muted: true });
    s += text(354, 136, 'resonance', { cls: 'fg-tag', size: 10.5 });
    s += tag(140, 44, 'dimethylformamide');
    s += tag(520, 44, 'the contributor, at about 40%');

    s += rule(24, 274, 726, 274);
    s += text(24, 300, 'The C–N bond is partly double, so it does not rotate: the barrier is near 20 kcal/mol.', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(24, 322, 'One methyl sits beside the oxygen and one beside the H, and they never swap — two NMR signals.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The nitrogen lone pair is not sitting on nitrogen; it is in the pi system. That is why the C–N bond has partial double-bond character, why the six atoms of the O=C–N unit lie in one plane, and why the nitrogen is flat rather than pyramidal like an amine’s.',
  note: 'The NMR consequence is the one that can be checked in an afternoon. DMF’s two methyls look identical on paper, and at room temperature they give two separate ¹H signals, because the bond that would swap them cannot turn. Warm the sample enough and the two signals coalesce into one — which is how the 20 kcal/mol number was measured.',
});

/* ---------------------------------------------------------------- 168 ---
   Fischer esterification, which the section describes in five sentences of
   prose and every exam asks for as arrows. Two rows of panels, because five
   structures do not fit across one reading column. */
FIGURES.push({
  id: 'fischer-five-steps',
  section: 'acyl-substitution',
  anchor: 'Same protonation-as-activation strategy you have now seen in alcohol chemistry, ether cleavage, and acetal formation.</p>',
  viewBox: '0 0 760 430',
  alt: 'Five panels of Fischer esterification: protonating the carbonyl, methanol attacking, the neutral tetrahedral intermediate, loss of water after protonating an OH, and deprotonation to methyl acetate',
  build() {
    let s = '';
    // 1 - protonate the carbonyl
    let c = P(120, 116), o = P(120, 70), og = P(164, 144), hg = P(204, 162), me = P(76, 144);
    s += bond(c, o, { order: 2 }); s += bond(c, og); s += bond(c, me); s += bond(og, hg, { rTo: 10 });
    s += atom(me.x, me.y, 'Me'); s += atom(og.x, og.y, 'O'); s += atom(hg.x, hg.y, 'H', { r: 10 });
    s += atom(o.x, o.y, 'O'); s += lonePair(o.x, o.y, 200);
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(214, 66, 'H⁺', { cls: 'fg-lbl', size: 13 });
    s += curve(P(120, 46), P(200, 62), { bow: -18 });
    s += tag(130, 200, '1 · protonate the C=O');

    // 2 - methanol attacks
    c = P(380, 116); o = P(380, 70); og = P(424, 144); hg = P(464, 162); me = P(336, 144);
    s += bond(c, o, { order: 2 }); s += bond(c, og); s += bond(c, me); s += bond(og, hg, { rTo: 10 });
    s += atom(me.x, me.y, 'Me'); s += atom(og.x, og.y, 'O'); s += atom(hg.x, hg.y, 'H', { r: 10 });
    s += atom(o.x, o.y, 'O', { kind: 'warn' }); s += text(406, 62, '+', { cls: 'fg-warn', size: 15 });
    s += bond(o, P(380, 30), { rTo: 10 }); s += atom(380, 30, 'H', { r: 10 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += atom(288, 100, 'MeOH', { kind: 'hi' });
    s += curve(P(306, 112), P(362, 112), { bow: 20 });
    s += curve(P(400, 112), P(398, 90), { bow: 14 });
    s += tag(380, 200, '2 · methanol attacks');

    // 3 - the neutral tetrahedral intermediate
    c = P(630, 116);
    s += bond(c, P(630, 70)); s += bond(c, P(676, 144)); s += bond(c, P(584, 144)); s += bond(c, P(586, 84));
    s += atom(630, 70, 'OH'); s += atom(676, 144, 'OMe'); s += atom(584, 144, 'OH'); s += atom(586, 84, 'Me');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += tag(630, 200, '3 · tetrahedral, neutral');

    s += rule(24, 224, 726, 224);

    // 4 - protonate an OH and lose water
    c = P(210, 300);
    s += bond(c, P(210, 254), { order: 2 }); s += bond(c, P(254, 328)); s += bond(c, P(166, 328));
    s += atom(210, 254, 'O'); s += atom(254, 328, 'OMe'); s += atom(166, 328, 'Me');
    s += text(236, 246, '+', { cls: 'fg-warn', size: 15 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(322, 296, '− H₂O', { cls: 'fg-lbl', size: 13 });
    s += tag(230, 376, '4 · protonate an OH, lose water');

    // 5 - deprotonate
    c = P(560, 300);
    s += bond(c, P(560, 254), { order: 2 }); s += bond(c, P(604, 328)); s += bond(c, P(516, 328));
    s += atom(560, 254, 'O'); s += lonePair(560, 254, 200); s += lonePair(560, 254, 340);
    s += atom(604, 328, 'OMe'); s += atom(516, 328, 'Me');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += tag(560, 376, '5 · deprotonate — methyl acetate');

    s += text(380, 410, 'Every step is reversible: run it right to left with water and it is hydrolysis.', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Acid catalysis doing two different jobs with one proton. Step 1 makes a carbon electrophilic enough for a neutral alcohol to attack at all; step 4 turns an OH, which would never leave, into water, which will. Nothing anionic appears anywhere in the sequence, which is the test of whether a mechanism written under acid is written correctly.',
  note: 'Two proton transfers are carried by the panel labels rather than by arrows: methanol’s oxygen loses its proton between panels 2 and 3, and one OH picks one up between panels 3 and 4. Draw them in when a question asks for every step — they are real, and in acid they are the fastest events in the flask. Count the arrows that are not reversible: none. That is why the reaction settles near 65% conversion and has to be driven — excess alcohol, or water removed as it forms. It is also why the same five panels, read from the right with water in place of methanol, are acid-catalyzed ester hydrolysis rather than a separate mechanism to learn.',
});

/* ---------------------------------------------------------------- 169 ---
   Saponification, whose pitfall box turns on the exact order of three steps
   and which the section never drew. */
FIGURES.push({
  id: 'saponification-driving-step',
  section: 'acyl-substitution',
  anchor: 'and it is why saponification does not reverse while acid hydrolysis does.</div>',
  viewBox: '0 0 760 310',
  alt: 'Three panels of saponification: hydroxide attacking ethyl acetate, the tetrahedral alkoxide expelling ethoxide, and ethoxide deprotonating the acetic acid irreversibly',
  build() {
    let s = '';
    let c = P(150, 120);
    s += bond(c, P(150, 74), { order: 2 }); s += bond(c, P(196, 148)); s += bond(c, P(104, 148));
    s += atom(150, 74, 'O'); s += lonePair(150, 74, 200);
    s += atom(196, 148, 'OEt'); s += atom(104, 148, 'Me');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += atom(48, 92, 'HO', { kind: 'warn' }); s += text(74, 70, '−', { cls: 'fg-hi', size: 15 });
    s += curve(P(66, 104), P(132, 114), { bow: 18 });
    s += curve(P(166, 100), P(160, 84), { bow: 14 });
    s += tag(140, 196, '1 · hydroxide attacks');

    s += arrow(P(250, 120), P(306, 120), { muted: true });

    c = P(400, 120);
    s += bond(c, P(400, 74)); s += bond(c, P(446, 148)); s += bond(c, P(354, 148)); s += bond(c, P(356, 88));
    s += atom(400, 74, 'O', { kind: 'warn' }); s += text(426, 66, '−', { cls: 'fg-hi', size: 15 });
    s += atom(446, 148, 'OEt'); s += atom(354, 148, 'Me'); s += atom(356, 88, 'OH');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += curve(P(418, 90), P(408, 106), { bow: -14 });
    s += curve(P(420, 142), P(452, 168), { bow: 16 });
    s += tag(400, 196, '2 · ethoxide is expelled');

    s += arrow(P(500, 120), P(556, 120), { muted: true });

    c = P(626, 120);
    s += bond(c, P(626, 74), { order: 2 }); s += bond(c, P(672, 148)); s += bond(c, P(580, 148));
    s += atom(626, 74, 'O'); s += lonePair(626, 74, 200);
    s += atom(672, 148, 'O'); s += text(700, 154, '−', { cls: 'fg-hi', size: 15 });
    s += atom(580, 148, 'Me');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(626, 44, 'EtO⁻ takes the proton', { cls: 'fg-tag-good', size: 11 });
    s += tag(626, 196, '3 · irreversible');

    s += rule(24, 226, 726, 226);
    s += text(24, 254, 'Step 3 is the one that cannot run backwards: a carboxylate is a dead end.', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(24, 278, 'Acid hydrolysis has no step like it, which is why it settles at equilibrium.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Three steps, and the order is the whole answer. Addition first, then collapse, and only then — because only then does an acid exist — the proton transfer. That last step consumes the ethoxide just released and leaves a carboxylate no nucleophile wants to attack.',
  note: 'The proton transfer in panel 3 is stated rather than drawn; put an arrow on it (ethoxide’s lone pair to the acid’s O–H) if a question asks for a full mechanism, because it is the step the whole reaction turns on. This is why saponification is stoichiometric in hydroxide rather than catalytic: one equivalent of base is genuinely consumed, ending up on the product. It is also why the acid has to be recovered at the end with a separate acidification — what comes out of the flask is the salt.',
});

/* ---------------------------------------------------------------- 170 ---
   The chlorosulfite. The section hangs the whole activation argument on it and
   no structure of one appears anywhere in the course. */
FIGURES.push({
  id: 'chlorosulfite-self-destructs',
  section: 'acyl-chlorides-anhydrides',
  anchor: 'One reagent, one idea, two functional groups.</div>',
  viewBox: '0 0 760 400',
  alt: 'Thionyl chloride converting a carboxylic acid OH into a chlorosulfite, then chloride attacking the acyl carbon and the leaving group falling apart into sulfur dioxide and chloride',
  build() {
    let s = '';
    let c = P(150, 110);
    s += bond(c, P(150, 64), { order: 2 }); s += bond(c, P(194, 138)); s += bond(c, P(106, 138));
    s += bond(P(194, 138), P(234, 156), { rTo: 10 });
    s += atom(150, 64, 'O'); s += lonePair(150, 64, 200);
    s += atom(194, 138, 'O'); s += lonePair(194, 138, 60);
    s += atom(234, 156, 'H', { r: 10 }); s += atom(106, 138, 'R');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += bond(P(300, 110), P(300, 64), { order: 2 });
    s += bond(P(300, 110), P(344, 138), { rTo: 17 });
    s += bond(P(300, 110), P(256, 64), { rTo: 17 });
    s += atom(300, 64, 'O'); s += atom(344, 138, 'Cl', { r: 17 }); s += atom(256, 64, 'Cl', { r: 17 });
    s += atom(300, 110, 'S', { kind: 'warn' });
    s += curve(P(212, 124), P(282, 118), { bow: -22 });
    s += tag(230, 192, 'the OH oxygen attacks sulfur');

    s += arrow(P(390, 110), P(438, 110));

    c = P(500, 110);
    s += bond(c, P(500, 64), { order: 2 }); s += bond(c, P(544, 138)); s += bond(c, P(456, 138));
    s += bond(P(544, 138), P(588, 110));
    s += bond(P(588, 110), P(588, 64), { order: 2 });
    s += bond(P(588, 110), P(632, 138), { rTo: 17 });
    s += atom(500, 64, 'O'); s += atom(456, 138, 'R');
    s += atom(544, 138, 'O'); s += atom(588, 64, 'O'); s += atom(632, 138, 'Cl', { r: 17 });
    s += atom(588, 110, 'S', { kind: 'warn' });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += tag(560, 192, 'a chlorosulfite: an excellent leaving group');

    s += rule(24, 220, 726, 220);

    s += atom(60, 300, 'Cl', { kind: 'warn', r: 17 }); s += text(86, 280, '−', { cls: 'fg-hi', size: 15 });
    c = P(180, 300);
    s += bond(c, P(180, 254), { order: 2 }); s += bond(c, P(224, 328)); s += bond(c, P(136, 328));
    s += bond(P(224, 328), P(268, 300));
    s += bond(P(268, 300), P(268, 254), { order: 2 });
    s += bond(P(268, 300), P(312, 328), { rTo: 17 });
    s += atom(180, 254, 'O'); s += atom(136, 328, 'R'); s += atom(224, 328, 'O');
    s += atom(268, 254, 'O'); s += atom(312, 328, 'Cl', { r: 17 });
    s += atom(268, 300, 'S', { kind: 'warn' });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += curve(P(80, 292), P(162, 292), { bow: -22 });

    s += arrow(P(360, 300), P(428, 300));

    c = P(500, 300);
    s += bond(c, P(500, 254), { order: 2 }); s += bond(c, P(544, 328), { rTo: 17 }); s += bond(c, P(456, 328));
    s += atom(500, 254, 'O'); s += atom(456, 328, 'R'); s += atom(544, 328, 'Cl', { kind: 'hi', r: 17 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(646, 296, '+ SO₂ + Cl⁻', { cls: 'fg-lbl', size: 13 });

    s += tag(200, 382, 'chloride attacks; the intermediate collapses');
    s += tag(560, 382, 'acid chloride, and two gases');
    return s;
  },
  caption: 'Thionyl chloride does not replace the OH directly. It converts it into a chlorosulfite — a leaving group that destroys itself. When it departs it immediately falls apart into SO₂ gas and chloride, so there is nothing left in the flask that could put the OH back.',
  note: 'Compare this with the same reagent on an alcohol in the alcohols chapter and the two are one reaction: an OH that will not leave is converted into a group that will, and the driving force in both cases is a by-product that leaves as a gas. That is also why the workup is an evaporation rather than a separation.',
});

/* ---------------------------------------------------------------- 171 ---
   Aspirin. The section names it as the headline application and the exam
   question turns on WHICH of salicylic acid’s two oxygens is acetylated. */
FIGURES.push({
  id: 'aspirin-acetylates-the-phenol',
  section: 'acyl-chlorides-anhydrides',
  anchor: 'Two different acyl groups sharing the oxygen give a mixed anhydride, named for both.</p>',
  viewBox: '0 0 760 330',
  alt: 'Salicylic acid reacting with acetic anhydride, with the phenol OH highlighted as the group that is acetylated, giving aspirin plus acetic acid',
  build() {
    let s = '';
    const hex = (cx, cy, r) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return pts;
    };
    const drawRing = (pts, ctr) => {
      let t = '';
      for (let i = 0; i < 6; i++) {
        const a = pts[i], b = pts[(i + 1) % 6];
        t += (i % 2 === 0) ? ringDouble(a, b, ctr) : bond(a, b, { rFrom: 0, rTo: 0 });
      }
      return t;
    };

    // salicylic acid
    let ctr = P(150, 160);
    let p = hex(150, 160, 48);
    s += drawRing(p, ctr);
    // COOH on p1 (upper right), OH on p2 (lower right)
    s += bond(p[1], P(240, 108), { rFrom: 0 });
    s += bond(P(240, 108), P(240, 62), { order: 2 });
    s += bond(P(240, 108), P(284, 130), { rTo: 16 });
    s += atom(240, 62, 'O'); s += atom(284, 130, 'OH');
    s += atom(240, 108, 'C', { kind: 'hi' });
    s += bond(p[2], P(240, 212), { rFrom: 0, rTo: 16 });
    s += atom(240, 212, 'OH', { kind: 'warn' });
    s += text(250, 250, 'the phenol OH', { cls: 'fg-tag-warn', size: 11 });
    s += tag(130, 44, 'salicylic acid');

    s += arrow(P(330, 160), P(410, 160));
    s += text(370, 144, '(CH₃CO)₂O', { cls: 'fg-lbl', size: 13 });

    // aspirin
    ctr = P(490, 160);
    p = hex(490, 160, 48);
    s += drawRing(p, ctr);
    s += bond(p[1], P(580, 108), { rFrom: 0 });
    s += bond(P(580, 108), P(580, 62), { order: 2 });
    s += bond(P(580, 108), P(624, 130), { rTo: 16 });
    s += atom(580, 62, 'O'); s += atom(624, 130, 'OH');
    s += atom(580, 108, 'C');
    s += bond(p[2], P(580, 212), { rFrom: 0 });
    s += bond(P(580, 212), P(624, 236));
    s += bond(P(624, 236), P(624, 282), { order: 2 });
    s += bond(P(624, 236), P(668, 212));
    s += atom(580, 212, 'O', { kind: 'warn' });
    s += atom(624, 282, 'O'); s += atom(668, 212, 'CH₃');
    s += atom(624, 236, 'C', { kind: 'hi' });
    s += tag(486, 44, 'aspirin  ·  + acetic acid');

    s += rule(24, 296, 726, 296);
    s += text(24, 322, 'The carboxyl OH is untouched — it is the phenol that gets acetylated.', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    return s;
  },
  caption: 'Salicylic acid has two OH groups and only one of them reacts. Acetic anhydride acetylates the <b>phenol</b>, giving an ester there and leaving the carboxylic acid alone — which is why aspirin is still an acid, and still tastes like one.',
  note: 'Why the phenol and not the carboxyl? Because acylating a carboxylic acid would give a mixed anhydride, which is on the same rung of the ladder as the anhydride you started with and so gains nothing. Acylating the phenol gives an ester, which is a rung down. The reaction picks the direction the ladder allows.',
});

/* ---------------------------------------------------------------- 172 ---
   The nitrile’s "adds once and stops" argument turns on the intermediate
   being an anion rather than a carbonyl, and that species was never drawn. */
FIGURES.push({
  id: 'nitrile-stops-at-the-anion',
  section: 'nitriles',
  anchor: 'a nitrile never generates a carbonyl until the Grignard is gone.</p>',
  viewBox: '0 0 760 310',
  alt: 'A methyl Grignard adding once to a nitrile to give a metalated imine anion, which no second equivalent can attack, and the ketone that appears only on aqueous workup',
  build() {
    let s = '';
    const r1 = P(60, 140), c1 = P(124, 140), n1 = P(188, 140);
    s += bond(r1, c1); s += bond(c1, n1, { order: 3 });
    s += atom(r1.x, r1.y, 'R'); s += atom(n1.x, n1.y, 'N'); s += lonePair(n1.x, n1.y, 0);
    s += atom(c1.x, c1.y, 'C', { kind: 'hi' });
    s += text(124, 62, 'CH₃–MgBr', { cls: 'fg-lbl', size: 13 });
    s += curve(P(124, 76), P(124, 120), { bow: 22 });
    s += curve(P(156, 122), P(176, 120), { bow: -16 });
    s += tag(124, 196, 'the Grignard adds once');

    s += arrow(P(240, 140), P(300, 140));

    const c2 = P(390, 140), n2 = P(450, 140);
    s += bond(c2, n2, { order: 2 });
    s += bond(c2, P(334, 166)); s += bond(c2, P(334, 114));
    s += atom(334, 166, 'R'); s += atom(334, 114, 'CH₃');
    s += atom(n2.x, n2.y, 'N', { kind: 'warn' }); s += lonePair(n2.x, n2.y, 300);
    s += text(476, 132, '−', { cls: 'fg-hi', size: 15 });
    s += atom(c2.x, c2.y, 'C', { kind: 'hi' });
    s += text(462, 184, 'MgBr⁺', { cls: 'fg-sm', size: 10.5 });
    s += tag(390, 220, 'an anion — nothing here to attack');

    s += arrow(P(512, 140), P(568, 140));
    s += text(540, 124, 'H₃O⁺', { cls: 'fg-tag', size: 11 });

    const c3 = P(630, 140);
    s += bond(c3, P(630, 94), { order: 2 });
    s += bond(c3, P(586, 168)); s += bond(c3, P(674, 168));
    s += atom(630, 94, 'O'); s += lonePair(630, 94, 200);
    s += atom(586, 168, 'R'); s += atom(674, 168, 'CH₃');
    s += atom(c3.x, c3.y, 'C', { kind: 'hi' });
    s += tag(630, 220, 'the ketone');

    s += rule(24, 244, 726, 244);
    s += text(24, 270, 'An ester expels alkoxide and hands the Grignard a ketone, so it adds twice.', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(24, 294, 'A nitrile hands it an anion instead, and the reaction simply stops there.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'One addition, and then nothing. The Grignard’s carbon adds to the nitrile carbon and the pi electrons go onto nitrogen, giving a metalated imine — an <b>anion</b>, not a carbonyl. There is no electrophile left in the flask, so a second equivalent has nothing to do, however much of it is present.',
  note: 'This is the whole reason a nitrile gives a ketone where an ester gives a tertiary alcohol. The ester expels alkoxide half-way through and produces a ketone while the Grignard is still there, so the ketone is attacked in turn. The nitrile produces no carbonyl at all until water is added at the end, by which time the organometallic is gone.',
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

/* ---------------------------------------------------------------- 193 ---
   Four reaction types in the amine-reactions section and not one curved arrow
   anywhere in it. This is the acylation, which is also the section's thesis:
   the product nitrogen is switched off. */
FIGURES.push({
  id: 'amine-acylation-mechanism',
  section: 'amine-reactions',
  anchor: 'so it is no longer nucleophilic and no longer basic.</p>',
  viewBox: '0 0 760 430',
  alt: 'Ethylamine attacking acetyl chloride, the tetrahedral intermediate collapsing to expel chloride, deprotonation by triethylamine, and the amide product whose nitrogen lone pair is delocalized',
  build() {
    let s = '';
    /* 1 - the nitrogen attacks */
    let c = P(150, 124), o = P(150, 78), me = P(102, 156), x = P(198, 156);
    s += bond(c, o, { order: 2 }); s += bond(c, me); s += bond(c, x);
    s += atom(o.x, o.y, 'O'); s += lonePair(o.x, o.y, 200); s += lonePair(o.x, o.y, 340);
    s += atom(me.x, me.y, 'CH₃'); s += atom(x.x, x.y, 'Cl', { kind: 'warn' });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += atom(276, 84, 'EtNH₂', { kind: 'hi', r: 22 });
    s += lonePair(276, 84, 200, { dist: 28 });
    s += curve(P(248, 100), P(172, 112), { bow: 22 });
    s += curve(P(134, 104), P(132, 82), { bow: 14 });
    s += tag(160, 206, '1 · the lone pair adds');

    s += arrow(P(320, 124), P(372, 124));

    /* 2 - tetrahedral intermediate, chloride leaves */
    c = P(560, 124);
    s += bond(c, P(516, 84)); s += bond(c, P(608, 88)); s += bond(c, P(514, 166)); s += bond(c, P(606, 166));
    s += atom(516, 84, 'O⁻', { kind: 'warn' });
    s += lonePair(516, 84, 200, { dist: 20 });
    s += atom(608, 88, 'NH₂Et', { kind: 'hi' });
    s += text(646, 74, '⊕', { cls: 'fg-warn', size: 12 });
    s += atom(514, 166, 'CH₃'); s += atom(606, 166, 'Cl', { kind: 'warn' });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += curve(P(494, 70), P(534, 100), { bow: 18 });
    s += curve(P(588, 150), P(614, 184), { bow: -16 });
    s += tag(560, 206, '2 · kick the pair back down, chloride goes');

    s += rule(24, 230, 736, 230);

    /* 3 - deprotonation */
    c = P(150, 318); o = P(150, 272); me = P(102, 350); x = P(198, 350);
    s += bond(c, o, { order: 2 }); s += bond(c, me); s += bond(c, x);
    s += atom(o.x, o.y, 'O'); s += lonePair(o.x, o.y, 200);
    s += atom(me.x, me.y, 'CH₃');
    s += atom(x.x, x.y, 'NH₂Et', { kind: 'warn' });
    s += text(236, 336, '⊕', { cls: 'fg-warn', size: 12 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(268, 290, 'Et₃N', { cls: 'fg-lbl', size: 12.5 });
    s += curve(P(252, 302), P(218, 334), { bow: 16 });
    s += text(60, 274, 'Cl⁻', { cls: 'fg-sm', size: 10.5 });
    s += tag(160, 400, '3 · a base takes the proton');

    s += arrow(P(320, 318), P(372, 318));

    /* 4 - the amide, switched off */
    c = P(540, 318); o = P(540, 272); me = P(492, 350); x = P(588, 350);
    s += bond(c, o, { order: 2 }); s += bond(c, me); s += bond(c, x);
    s += atom(o.x, o.y, 'O'); s += lonePair(o.x, o.y, 200); s += lonePair(o.x, o.y, 340);
    s += atom(me.x, me.y, 'CH₃');
    s += atom(x.x, x.y, 'NHEt', { kind: 'hi' });
    s += lonePair(x.x, x.y, 55);
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += curve(P(606, 372), P(570, 344), { bow: 20 });
    s += curve(P(524, 298), P(522, 276), { bow: 14 });
    s += tag(540, 400, '4 · and the pair goes straight into the carbonyl');
    s += text(636, 306, 'no lone pair', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    s += text(636, 322, 'left to attack', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    s += text(636, 338, 'anything: it', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    s += text(636, 354, 'cannot go twice', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Addition then elimination &mdash; the acyl substitution pattern from the carboxylic acid derivatives chapter, unchanged &mdash; and then the reason this one self-terminates. The nitrogen that attacked in panel 1 is, by panel 4, delocalized into the very carbonyl it attacked.',
  note: 'Panel 2 is the step students most often skip. Chloride does not leave <i>as</i> the nitrogen arrives; the carbon goes tetrahedral first and the alkoxide then pushes the pair back down to expel it. That is why acyl substitution is addition&ndash;elimination and not S<sub>N</sub>2, and why an sp² carbon can be substituted at all. Panel 3 is also why a base is in the flask: without it that proton ends up on the next molecule of amine, and half your starting material sits out the reaction as its ammonium salt.',
});

/* ---------------------------------------------------------------- 194 ---
   Imine formation is named in three sections and drawn in none, although the
   hemiaminal is asked about in the practice bank. */
FIGURES.push({
  id: 'imine-formation',
  section: 'amine-reactions',
  anchor: 'so it loses an α C–H instead and gives an <b>enamine</b>.</p>',
  viewBox: '0 0 760 570',
  alt: 'The full imine formation sequence: attack, proton transfer to the hemiaminal, protonation of its OH, loss of water to the iminium ion, and deprotonation to the imine, with the enamine branch drawn below',
  build() {
    let s = '';
    const carbonyl = (cx, cy) => {
      let g = '';
      g += bond(P(cx, cy), P(cx, cy - 46), { order: 2 });
      g += bond(P(cx, cy), P(cx - 48, cy + 32));
      g += bond(P(cx, cy), P(cx + 48, cy + 32));
      g += atom(cx, cy - 46, 'O'); g += lonePair(cx, cy - 46, 200); g += lonePair(cx, cy - 46, 340);
      g += atom(cx - 48, cy + 32, 'R'); g += atom(cx + 48, cy + 32, 'R');
      g += atom(cx, cy, 'C', { kind: 'hi' });
      return g;
    };

    /* 1 - attack */
    s += carbonyl(120, 120);
    s += atom(244, 80, 'H₂NR′', { kind: 'hi', r: 22 });
    s += lonePair(244, 80, 200, { dist: 28 });
    s += curve(P(218, 96), P(142, 108), { bow: 22 });
    s += curve(P(104, 100), P(102, 78), { bow: 14 });
    s += tag(140, 196, '1 · the amine adds');

    /* 2 - zwitterion */
    s += bond(P(410, 124), P(366, 84)); s += bond(P(410, 124), P(458, 86));
    s += bond(P(410, 124), P(364, 166)); s += bond(P(410, 124), P(456, 166));
    s += atom(366, 84, 'O⁻', { kind: 'warn' }); s += lonePair(366, 84, 200, { dist: 20 });
    s += atom(458, 86, 'NH₂R′', { kind: 'hi' }); s += text(496, 72, '⊕', { cls: 'fg-warn', size: 12 });
    s += atom(364, 166, 'R'); s += atom(456, 166, 'R');
    s += atom(410, 124, 'C', { kind: 'hi' });
    s += curve(P(348, 70), P(444, 66), { bow: -26 });
    s += tag(410, 196, '2 · a proton moves across');

    /* 3 - the hemiaminal */
    s += bond(P(646, 124), P(602, 84)); s += bond(P(646, 124), P(694, 86));
    s += bond(P(646, 124), P(600, 166)); s += bond(P(646, 124), P(692, 166));
    s += atom(602, 84, 'OH'); s += atom(694, 86, 'NHR′', { kind: 'hi' });
    s += atom(600, 166, 'R'); s += atom(692, 166, 'R');
    s += atom(646, 124, 'C', { kind: 'hi' });
    s += tag(646, 196, '3 · HEMIAMINAL — rarely isolable');

    s += rule(24, 220, 736, 220);

    /* 4 - protonate the OH */
    s += bond(P(140, 324), P(96, 284)); s += bond(P(140, 324), P(188, 286));
    s += bond(P(140, 324), P(94, 366)); s += bond(P(140, 324), P(186, 366));
    s += atom(96, 284, 'OH₂', { kind: 'warn' }); s += text(66, 270, '⊕', { cls: 'fg-warn', size: 12 });
    s += atom(188, 286, 'NHR′', { kind: 'hi' }); s += lonePair(188, 286, 20, { dist: 20 });
    s += atom(94, 366, 'R'); s += atom(186, 366, 'R');
    s += atom(140, 324, 'C', { kind: 'hi' });
    s += curve(P(206, 306), P(162, 310), { bow: 16 });
    s += curve(P(122, 306), P(104, 300), { bow: 14 });
    s += tag(140, 400, '4 · H⁺ turns the OH into water');

    /* 5 - the iminium */
    s += bond(P(410, 324), P(410, 278), { order: 2 });
    s += bond(P(410, 324), P(362, 356)); s += bond(P(410, 324), P(458, 356));
    s += atom(410, 278, 'NHR′', { kind: 'warn' }); s += text(448, 264, '⊕', { cls: 'fg-warn', size: 12 });
    s += atom(362, 356, 'R'); s += atom(458, 356, 'R');
    s += atom(410, 324, 'C', { kind: 'hi' });
    s += text(312, 276, 'base', { cls: 'fg-tag', size: 10.5 });
    s += curve(P(330, 286), P(380, 272), { bow: 16 });
    s += tag(410, 400, '5 · IMINIUM ION, water gone');

    /* 6 - the imine */
    s += bond(P(646, 324), P(646, 278), { order: 2 });
    s += bond(P(646, 324), P(598, 356)); s += bond(P(646, 324), P(694, 356));
    s += atom(646, 278, 'NR′', { kind: 'hi' }); s += lonePair(646, 278, 340, { dist: 20 });
    s += atom(598, 356, 'R'); s += atom(694, 356, 'R');
    s += atom(646, 324, 'C', { kind: 'hi' });
    s += tag(646, 400, '6 · the IMINE');

    s += rule(24, 424, 736, 424);

    /* the enamine branch */
    s += text(24, 452, 'Branch — if the amine is SECONDARY, the iminium has no N–H to lose,', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(24, 474, 'so the base takes an α C–H instead and the C=C ends up outside the nitrogen:', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += bond(P(500, 512), P(560, 486), { order: 2 });
    s += bond(P(560, 486), P(620, 512));
    s += atom(500, 512, 'C', { kind: 'hi' }); s += atom(560, 486, 'C');
    s += atom(620, 512, 'NR′₂', { kind: 'hi' }); s += lonePair(620, 512, 20, { dist: 20 });
    s += text(560, 548, 'an ENAMINE — nucleophilic at the far carbon', { cls: 'fg-tag-good', size: 11 });
    s += text(210, 512, 'iminium + base', { cls: 'fg-sm', size: 10.5 });
    s += arrow(P(300, 512), P(460, 512), { muted: true });
    return s;
  },
  caption: 'Every step here is reversible, which is why imine formation is run at pH 4&ndash;5 and not at either extreme. Too basic and there is no acid to protonate the OH in panel 4, so the hemiaminal never dehydrates. Too acidic and the amine in panel 1 is protonated, has no lone pair, and never attacks at all.',
  note: 'Three later reactions are this sequence stopped at different points. Reductive amination reduces the panel-5 iminium before it can lose its proton. Enamine chemistry stops at the branch. And running the whole thing backwards with water is imine hydrolysis, which is how an imine used as a protecting group comes off. Note also where the new C&ndash;N bond is: on the old carbonyl carbon, every time.',
});

/* ---------------------------------------------------------------- 195 ---
   The synthesis section teaches seven routes and draws none of them. Gabriel
   is the one whose trick is invisible without a picture: what makes it work is
   a nitrogen that has nothing left to react with. */
FIGURES.push({
  id: 'gabriel-synthesis',
  section: 'amine-synthesis',
  anchor: 'Where the stereochemistry matters, that difference alone decides the route.</p>',
  viewBox: '0 0 760 486',
  alt: 'Phthalimide deprotonated by hydroxide, its anion doing an SN2 on a primary alkyl bromide, and hydrazine releasing the primary amine from the N-alkyl phthalimide',
  build() {
    let s = '';
    /* A phthalimide: benzene fused to the five-membered imide ring on its
       right-hand vertical edge. */
    const phthalimide = (cx, cy, nLabel, nKind, extra) => {
      let g = '';
      const r = 34;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      const mid = P(cx, cy);
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        if (i === 0 || i === 2 || i === 4) g += ringDouble(pts[i], pts[j], mid, { inset: 8 });
        else g += bond(pts[i], pts[j], { rFrom: 0, rTo: 0 });
      }
      const A = pts[1], B = pts[2];          // the fused edge, top and bottom
      const cTop = P(A.x + 40, A.y - 6), cBot = P(B.x + 40, B.y + 6), nn = P(A.x + 74, cy);
      g += bond(A, cTop, { rFrom: 0, rTo: 15 });
      g += bond(B, cBot, { rFrom: 0, rTo: 15 });
      g += bond(cTop, nn, { rFrom: 15, rTo: 16 });
      g += bond(cBot, nn, { rFrom: 15, rTo: 16 });
      g += bond(cTop, P(cTop.x + 6, cTop.y - 42), { order: 2, rTo: 15 });
      g += bond(cBot, P(cBot.x + 6, cBot.y + 42), { order: 2, rTo: 15 });
      g += atom(cTop.x + 6, cTop.y - 42, 'O');
      g += atom(cBot.x + 6, cBot.y + 42, 'O');
      g += atom(cTop.x, cTop.y, 'C', { kind: 'hi' });
      g += atom(cBot.x, cBot.y, 'C', { kind: 'hi' });
      g += atom(nn.x, nn.y, nLabel, { kind: nKind });
      if (extra) g += extra(nn);
      return g;
    };

    s += phthalimide(80, 124, 'NH', 'hi');
    s += text(40, 220, 'phthalimide', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(40, 238, 'pKₐ 8.3 — two carbonyls', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(40, 254, 'pulling on one N–H', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(228, 104, 'KOH', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += arrow(P(226, 124), P(292, 124));

    s += phthalimide(384, 124, 'N⁻', 'warn');
    s += text(500, 106, '⊖', { cls: 'fg-hi', size: 13 });
    s += lonePair(458, 124, 0, { dist: 22 });
    s += text(344, 238, 'the anion — flat, delocalized,', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(344, 254, 'and still a good nucleophile', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(600, 92, 'R–CH₂–Br', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += curve(P(506, 124), P(596, 112), { bow: -22 });
    s += text(520, 148, 'backside attack — inversion', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(520, 164, 'if the carbon is a stereocenter', { cls: 'fg-tag', size: 10.5, anchor: 'start' });

    s += rule(24, 278, 736, 278);

    s += phthalimide(110, 372, 'N', 'hi', (nn) => bond(nn, P(nn.x + 46, nn.y), { rFrom: 16, rTo: 18 }) + atom(nn.x + 46, nn.y, 'CH₂R', { r: 18 }));
    s += text(24, 468, 'no N–H left, and the pair is shared with BOTH carbonyls: it cannot alkylate again', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(392, 352, 'H₂NNH₂', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += arrow(P(390, 372), P(466, 372));

    s += atom(536, 372, 'R–CH₂–NH₂', { kind: 'hi', r: 46 });
    s += text(536, 440, 'a clean PRIMARY amine', { cls: 'fg-tag-good', size: 11 });
    s += text(644, 366, '+ phthal-', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(644, 382, 'hydrazide', { cls: 'fg-sm', size: 10, anchor: 'start' });
    return s;
  },
  caption: 'Gabriel in one line: build a nitrogen that can react exactly once, use it, then take it apart. The amine that comes out is clean because at no point in the sequence was there a nucleophilic amine sitting in a flask with an alkyl halide.',
  note: 'Two limits are visible in the drawing itself. The alkylation is an S<sub>N</sub>2 on the halide, so a secondary halide gives elimination instead and a tertiary one gives nothing but alkene &mdash; and whatever the nitrogen picks up, it picks up <b>once</b>, so the product is always a primary amine. If a secondary amine is the target, this route cannot reach it no matter what halide you feed it.',
});

/* ---------------------------------------------------------------- 196 ---
   The Hofmann rearrangement is stated as an outcome. The migration is the
   surprising part and nothing showed it happening. */
FIGURES.push({
  id: 'hofmann-rearrangement-mechanism',
  section: 'amine-synthesis',
  anchor: 'a stereocenter that migrates arrives with retention.</p>',
  viewBox: '0 0 760 470',
  alt: 'Butanamide deprotonated, brominated on nitrogen, deprotonated again, then rearranging as the propyl group migrates to nitrogen while bromide leaves, giving an isocyanate that hydrolyzes to propylamine and carbon dioxide',
  build() {
    let s = '';
    const amide = (cx, cy, nLabel, nKind) => {
      let g = '';
      g += bond(P(cx, cy), P(cx, cy - 46), { order: 2 });
      g += bond(P(cx, cy), P(cx - 50, cy + 32));
      g += bond(P(cx, cy), P(cx + 50, cy + 32));
      g += atom(cx, cy - 46, 'O'); g += lonePair(cx, cy - 46, 200);
      g += atom(cx - 50, cy + 32, 'Pr');
      g += atom(cx + 50, cy + 32, nLabel, { kind: nKind });
      g += atom(cx, cy, 'C', { kind: 'hi' });
      return g;
    };

    s += amide(120, 118, 'NH₂', 'hi');
    s += text(228, 92, 'HO⁻', { cls: 'fg-lbl', size: 12.5 });
    s += curve(P(218, 106), P(188, 138), { bow: 18 });
    s += tag(130, 196, '1 · take an N–H');

    s += amide(400, 118, 'NH', 'warn');
    s += text(478, 136, '⊖', { cls: 'fg-hi', size: 13 });
    s += lonePair(450, 150, 40, { dist: 20 });
    s += atom(508, 74, 'Br'); s += atom(556, 48, 'Br');
    s += bond(P(508, 74), P(556, 48));
    s += curve(P(468, 132), P(500, 90), { bow: 16 });
    s += curve(P(528, 58), P(566, 34), { bow: -14 });
    s += tag(410, 196, '2 · the anion takes a bromine');

    s += amide(660, 118, 'NHBr', 'warn');
    s += text(640, 196, '3 · the N-bromoamide — and HO⁻', { cls: 'fg-tag', size: 10.5 });
    s += text(640, 212, 'takes the last N–H', { cls: 'fg-tag', size: 10.5 });

    s += rule(24, 222, 736, 222);

    /* 4 - the migration */
    s += bond(P(150, 330), P(150, 284), { order: 2 });
    s += bond(P(150, 330), P(100, 362));
    s += bond(P(150, 330), P(200, 362));
    s += bond(P(200, 362), P(246, 392), { rFrom: 15, rTo: 15 });
    s += atom(150, 284, 'O'); s += lonePair(150, 284, 200);
    s += atom(100, 362, 'Pr', { kind: 'hi' });
    s += atom(200, 362, 'N', { kind: 'warn' });
    s += text(178, 392, '⊖', { cls: 'fg-hi', size: 12 });
    s += atom(246, 392, 'Br', { kind: 'warn' });
    s += atom(150, 330, 'C', { kind: 'hi' });
    s += curve(P(118, 344), P(182, 350), { bow: -20 });
    s += curve(P(224, 378), P(258, 412), { bow: -14 });
    s += text(158, 428, '4 · propyl moves to N as bromide', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(158, 444, 'leaves — one step, no free nitrene', { cls: 'fg-tag-warn', size: 10.5 });

    /* 5 - the isocyanate */
    s += bond(P(356, 330), P(408, 330), { order: 2, rFrom: 15, rTo: 16 });
    s += bond(P(408, 330), P(460, 330), { order: 2, rFrom: 16, rTo: 15 });
    s += bond(P(304, 330), P(356, 330), { rFrom: 15, rTo: 15 });
    s += atom(304, 330, 'Pr'); s += atom(356, 330, 'N'); s += atom(460, 330, 'O');
    s += atom(408, 330, 'C', { kind: 'hi' });
    s += text(408, 272, 'H₂O', { cls: 'fg-lbl', size: 12.5 });
    s += curve(P(408, 286), P(408, 310), { bow: 16 });
    s += tag(392, 392, '5 · an ISOCYANATE');

    /* 6 - the carbamic acid */
    s += bond(P(646, 330), P(646, 284), { order: 2 });
    s += bond(P(646, 330), P(596, 362));
    s += bond(P(646, 330), P(696, 362));
    s += atom(646, 284, 'O'); s += atom(596, 362, 'NHPr', { kind: 'hi' }); s += atom(696, 362, 'OH');
    s += atom(646, 330, 'C', { kind: 'hi' });
    s += tag(640, 400, '6 · carbamic acid');
    s += text(640, 428, 'falls apart on its own to CO₂', { cls: 'fg-sm', size: 10.5 });
    s += text(640, 444, 'and PrNH₂ — propylamine', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Four carbons in, three out, and the carbon that leaves is the one the nitrogen was attached to. Everything else in the chain is untouched &mdash; including a stereocenter, which migrates with its configuration intact.',
  note: 'Panel 4 is the step to draw carefully. The alkyl group and its bonding electrons move to nitrogen <i>while</i> bromide is leaving, in one step, which is why no electron-deficient nitrogen (a nitrene) is ever free and why nothing scrambles. The Curtius rearrangement joins this sequence at panel 5: heating an acyl azide expels N₂ and gives the same isocyanate, with the same migration and the same loss of the carbonyl carbon.',
});

/* ---------------------------------------------------------------- 197 ---
   "One step, anti-periplanar" was a sentence in a section whose only figure
   is a flat regiochemistry comparison. Anti-periplanarity is a 3-D claim. */
FIGURES.push({
  id: 'hofmann-e2-newman',
  section: 'hofmann-elimination',
  anchor: 'exactly as in the substitution and elimination chapter.</p>',
  viewBox: '0 0 760 410',
  alt: 'The E2 arrows of a Hofmann elimination on the left and a Newman projection showing the beta hydrogen anti-periplanar to the trimethylammonium group on the right',
  build() {
    let s = '';
    /* LEFT - the arrows */
    s += tag(40, 40, 'THE ARROWS', { anchor: 'start' });
    const c1 = P(90, 176), c2 = P(150, 146), c3 = P(210, 176), c4 = P(270, 146);
    s += bond(c1, c2, { rFrom: 0, rTo: 0 }); s += bond(c2, c3, { rFrom: 0, rTo: 0 }); s += bond(c3, c4, { rFrom: 0, rTo: 0 });
    s += bond(c2, P(150, 92), { rFrom: 0, rTo: 18 });
    s += atom(150, 92, 'N⁺(CH₃)₃', { kind: 'warn', r: 18 });
    s += bond(c1, P(72, 222), { rFrom: 0, rTo: 10 });
    s += atom(72, 222, 'H', { r: 10 });
    s += text(42, 276, 'HO⁻', { cls: 'fg-lbl', size: 12.5 });
    s += lonePair(42, 272, 0, { dist: 22 });
    s += curve(P(66, 266), P(70, 238), { bow: 14 });
    s += curve(P(84, 210), P(116, 168), { bow: 16 });
    s += curve(P(150, 118), P(150, 100), { bow: 12 });
    s += text(228, 214, 'all at once', { cls: 'fg-tag-warn', size: 11 });
    s += arrow(P(90, 292), P(150, 292));
    s += bond(P(196, 306), P(244, 280), { order: 2, rFrom: 0, rTo: 0 });
    s += bond(P(244, 280), P(292, 306), { rFrom: 0, rTo: 0 });
    s += bond(P(292, 306), P(340, 280), { rFrom: 0, rTo: 0 });
    s += text(268, 340, 'but-1-ene', { cls: 'fg-tag-good', size: 11 });
    s += text(268, 362, '+ H₂O + N(CH₃)₃ — leaves NEUTRAL,', { cls: 'fg-sm', size: 10 });
    s += text(268, 378, 'which is the whole trick', { cls: 'fg-sm', size: 10 });

    s += rule(392, 30, 392, 390);

    /* RIGHT - the Newman projection */
    s += tag(436, 40, 'THE GEOMETRY', { anchor: 'start' });
    const cx = 570, cy = 200, R = 58;
    s += atom(cx, cy, '', { r: R });
    // front carbon bonds: up, and two below
    s += bond(P(cx, cy), P(cx, cy - R), { rFrom: 0, rTo: 0 });
    s += bond(P(cx, cy), P(cx + R * 0.87, cy + R * 0.5), { rFrom: 0, rTo: 0 });
    s += bond(P(cx, cy), P(cx - R * 0.87, cy + R * 0.5), { rFrom: 0, rTo: 0 });
    s += atom(cx, cy - R - 20, 'H', { kind: 'hi', r: 13 });
    s += atom(cx + R * 0.87 + 26, cy + R * 0.5 + 16, 'H', { r: 12 });
    s += atom(cx - R * 0.87 - 26, cy + R * 0.5 + 16, 'H', { r: 12 });
    // back carbon bonds: down, and two above, drawn from the rim outward
    s += bond(P(cx, cy + R), P(cx, cy + R + 22), { rFrom: 0, rTo: 0 });
    s += bond(P(cx + R * 0.87, cy - R * 0.5), P(cx + R * 0.87 + 20, cy - R * 0.5 - 12), { rFrom: 0, rTo: 0 });
    s += bond(P(cx - R * 0.87, cy - R * 0.5), P(cx - R * 0.87 - 20, cy - R * 0.5 - 12), { rFrom: 0, rTo: 0 });
    s += atom(cx, cy + R + 40, 'N⁺(CH₃)₃', { kind: 'warn', r: 18 });
    s += atom(cx + R * 0.87 + 34, cy - R * 0.5 - 22, 'Et', { r: 14 });
    s += atom(cx - R * 0.87 - 34, cy - R * 0.5 - 22, 'H', { r: 12 });
    s += rule(cx, cy - R - 6, cx, cy + R + 20);
    s += text(cx + 96, cy - 6, 'anti-', { cls: 'fg-tag-warn', size: 11 });
    s += text(cx + 96, cy + 10, 'periplanar,', { cls: 'fg-tag-warn', size: 11 });
    s += text(cx + 96, cy + 26, '180°', { cls: 'fg-tag-warn', size: 11 });
    s += text(cx, 334, 'The C–H that breaks and the C–N that breaks', { cls: 'fg-sm', size: 10.5 });
    s += text(cx, 352, 'have to lie in one plane pointing opposite ways,', { cls: 'fg-sm', size: 10.5 });
    s += text(cx, 370, 'so their orbitals can overlap into the new pi bond.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The mechanism is an ordinary E2 and the geometry is the ordinary E2 geometry &mdash; nothing about a Hofmann elimination changes either. What is unusual is only the leaving group: a positively charged nitrogen that departs neutral, and a bulky one, which is what decides which β hydrogen hydroxide can reach.',
  note: 'Both bonds break in the same transition state, so both have to be lined up before anything happens. In an open chain that costs nothing &mdash; rotate about the C–C bond until they are anti and eliminate &mdash; but in a ring that cannot rotate, the available anti-periplanar hydrogen decides the product outright, which is the case the substitution and elimination chapter worked through.',
});

/* ---------------------------------------------------------------- 198 ---
   The cyclic case is the one that carried the structural information, and it
   was argued in words only. */
FIGURES.push({
  id: 'cyclic-amine-degradation',
  section: 'hofmann-elimination',
  anchor: 'a conclusion drawn from bottles and a balance.</p>',
  viewBox: '0 0 760 370',
  alt: 'Piperidine methylated twice, opened by a first Hofmann elimination to a dimethylamino pentene, then methylated and eliminated again to give penta-1,4-diene and trimethylamine',
  build() {
    let s = '';
    const ring = (cx, cy, nLabel, nKind) => {
      let g = '';
      const r = 40, pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        const rf = i === 0 ? 16 : 0, rt = j === 0 ? 16 : 0;
        g += bond(pts[i], pts[j], { rFrom: rf, rTo: rt });
      }
      g += atom(pts[0].x, pts[0].y, nLabel, { kind: nKind });
      return pts;
    };

    let pts = null;
    const draw = (cx, cy, nLabel, nKind) => {
      const r = 40, p = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        p.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      let g = '';
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        g += bond(p[i], p[j], { rFrom: i === 0 ? 16 : 0, rTo: j === 0 ? 16 : 0 });
      }
      g += atom(p[0].x, p[0].y, nLabel, { kind: nKind });
      return { g, p };
    };

    let d = draw(110, 130, 'NH', 'hi');
    s += d.g;
    s += text(110, 206, 'piperidine', { cls: 'fg-lbl', size: 12.5 });

    s += text(248, 100, '2 CH₃I, K₂CO₃', { cls: 'fg-tag', size: 11 });
    s += arrow(P(196, 130), P(300, 130));

    d = draw(400, 130, 'N', 'warn');
    s += d.g;
    s += bond(d.p[0], P(360, 62), { rFrom: 16, rTo: 16 });
    s += bond(d.p[0], P(440, 62), { rFrom: 16, rTo: 16 });
    s += atom(360, 62, 'CH₃'); s += atom(440, 62, 'CH₃');
    s += text(434, 108, '⊕', { cls: 'fg-warn', size: 13 });
    s += text(400, 206, 'the quaternary salt', { cls: 'fg-lbl', size: 12.5 });

    s += text(560, 100, 'Ag₂O, H₂O, Δ', { cls: 'fg-tag', size: 11 });
    s += arrow(P(500, 130), P(620, 130));
    s += text(690, 124, 'ring', { cls: 'fg-tag-warn', size: 11 });
    s += text(690, 140, 'opens', { cls: 'fg-tag-warn', size: 11 });

    s += rule(24, 232, 736, 232);

    /* the ring-opened amine */
    const a1 = P(50, 300), a2 = P(98, 274), a3 = P(146, 300), a4 = P(194, 274), a5 = P(242, 300);
    s += bond(a1, a2, { order: 2, rFrom: 0, rTo: 0 });
    s += bond(a2, a3, { rFrom: 0, rTo: 0 }); s += bond(a3, a4, { rFrom: 0, rTo: 0 });
    s += bond(a4, a5, { rFrom: 0, rTo: 0 });
    s += bond(a5, P(292, 274), { rFrom: 0, rTo: 20 });
    s += atom(292, 274, 'N(CH₃)₂', { kind: 'hi', r: 20 });
    s += text(170, 342, 'still attached — only ONE of the two C–N bonds broke', { cls: 'fg-sm', size: 10.5 });

    s += text(420, 262, 'CH₃I, then Ag₂O/Δ', { cls: 'fg-tag', size: 11 });
    s += arrow(P(360, 286), P(474, 286));

    const b1 = P(520, 300), b2 = P(566, 274), b3 = P(612, 300), b4 = P(658, 274), b5 = P(704, 300);
    s += bond(b1, b2, { order: 2, rFrom: 0, rTo: 0 });
    s += bond(b2, b3, { rFrom: 0, rTo: 0 }); s += bond(b3, b4, { rFrom: 0, rTo: 0 });
    s += bond(b4, b5, { order: 2, rFrom: 0, rTo: 0 });
    s += text(586, 342, 'penta-1,4-diene + N(CH₃)₃ — nitrogen finally free', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Two rounds, not one &mdash; and that was the evidence. A nitrogen held by two C&ndash;N bonds is still attached to the chain after the first elimination has opened the ring; only a second methylation and elimination cuts it loose.',
  note: 'This is what made the degradation worth its cost. The number of <i>rounds</i> reports the connectivity while the number of CH₃I equivalents reports the class, and the two are independent measurements on the same unknown. An alkaloid chemist reading &ldquo;two rounds&rdquo; concluded &ldquo;the nitrogen was in a ring&rdquo; without ever seeing the molecule.',
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

/* ------------------------------------------------------------------ IR ---
   Butanoic acid, because it carries the two bands the section spends the most
   words on at once — the acid O–H wall and the carbonyl spike — and because it
   shows both conventions that students get backwards: wavenumber runs
   backwards and the peaks point down. */
FIGURES.push({
  id: 'ir-spectrum-butanoic-acid',
  section: 'ir',
  anchor: 'pointing at the same conjugation.</p>\n</div>',
  alt: 'The infrared spectrum of butanoic acid drawn as a percent-transmittance trace. Wavenumber runs from 4000 on the left to 500 on the right and the peaks point downward. A very broad trough runs from about 3300 to 2500, with two small sharp dips at 2960 and 2875 sitting inside it. A deep narrow spike reaches almost to zero transmittance at 1710. Below 1500 the trace is a shaded tangle of peaks labeled the fingerprint region, and a dotted vertical line marks 3000.',
  viewBox: '0 0 760 432',
  build() {
    const X = (w) => 64 + ((4000 - w) / 3500) * 660;
    const Y = (t) => 70 + ((100 - t) / 100) * 240;
    let s = '';
    /* fingerprint shading first, so the trace draws over it */
    s += `<rect class="fg-fill-mut" x="${n2(X(1500))}" y="70" width="${n2(X(500) - X(1500))}" height="240" rx="6" opacity="0.10"></rect>`;
    s += rule(64, 310, 724, 310) + rule(64, 310, 64, 70);
    for (const w of [4000, 3500, 3000, 2500, 2000, 1500, 1000, 500]) {
      s += rule(X(w), 310, X(w), 316);
      s += text(X(w), 330, String(w), { cls: 'fg-sm', size: 9.5 });
    }
    for (const t of [100, 50, 0]) {
      s += rule(58, Y(t), 64, Y(t));
      s += text(54, Y(t) + 4, String(t), { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    }
    s += `<text class="fg-sm" x="24" y="190" text-anchor="middle" transform="rotate(-90 24 190)">% transmittance</text>`;
    s += text(394, 350, 'wavenumber (cm⁻¹) — high on the LEFT, exactly as a spectrum is printed', { cls: 'fg-sm', size: 10.5 });

    /* the 3000 line the section keeps referring to */
    s += `<line class="fg-dash" x1="${n2(X(3000))}" y1="70" x2="${n2(X(3000))}" y2="310"></line>`;
    s += text(X(3000), 88, '3000', { cls: 'fg-tag-mut', size: 10 });

    s += irTrace([
      { c: 3000, s: 255, d: 58 },   // the acid O–H wall, 3300 down to 2500
      { c: 2960, s: 13, d: 20 },    // sp3 C–H, riding inside it
      { c: 2875, s: 13, d: 16 },
      { c: 1710, s: 11, d: 90 },    // the acid C=O
      { c: 1415, s: 16, d: 26 },
      { c: 1285, s: 13, d: 52 },    // C–O
      { c: 1230, s: 12, d: 36 },
      { c: 1100, s: 14, d: 20 },
      { c: 935, s: 18, d: 34 },     // the dimer's O–H bend
      { c: 800, s: 16, d: 16 },
      { c: 640, s: 20, d: 14 },
    ], X, Y);

    /* O–H */
    s += text(88, 38, 'O–H of the acid — very broad,', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(88, 54, '3300 all the way down to 2500', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += `<line class="fg-dash-hi" x1="196" y1="60" x2="${n2(X(3150))}" y2="178"></line>`;
    /* sp3 C–H */
    s += text(330, 112, 'sp³ C–H, 2960 and 2875 —', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(330, 128, 'just below 3000, half buried', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += `<line class="fg-dash-hi" x1="326" y1="122" x2="${n2(X(2920))}" y2="232"></line>`;
    /* C=O */
    s += text(474, 244, 'C=O, 1710', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(474, 260, 'the carboxylic acid carbonyl', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += `<line class="fg-dash-hi" x1="478" y1="252" x2="${n2(X(1710) - 5)}" y2="276"></line>`;
    /* fingerprint */
    s += text(716, 248, 'fingerprint region', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });
    s += text(716, 264, 'below 1500 — match it, do not assign it', { cls: 'fg-sm', size: 9.5, anchor: 'end' });

    s += text(394, 380, 'Peaks point DOWN, because the axis is how much light got THROUGH.', { cls: 'fg-lbl', size: 12.5 });
    s += text(394, 400, 'Everything diagnostic is left of 1500; everything right of it is the fingerprint.', { cls: 'fg-sm', size: 10.5 });
    s += text(394, 420, 'butanoic acid, CH₃CH₂CH₂COOH', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'What all of the above actually looks like. Two conventions trip people up and both are visible here: wavenumber runs <b>backwards</b>, high on the left, and peaks point <b>down</b>, because the y-axis is transmittance &mdash; how much light got through &mdash; so an absorption is a trough. The acid&rsquo;s O&ndash;H is not a peak so much as a wall, sprawling from 3300 to 2500 and half-swallowing the sp³ C&ndash;H dips that sit inside it; the carbonyl at 1710 is the opposite, narrow and nearly to the floor.',
  note: 'Four features, read in the order of the thirty-second scan: the deep spike at 1710 says carbonyl; the broad wall from 3300 to 2500 says <b>carboxylic acid</b> specifically; the small dips just below 3000 say sp³ C&ndash;H; and the scribble below 1500 says nothing you should try to read.',
});

/* ------------------------------------------------------------- 1H NMR ---
   Ethyl acetate, which is the compound the section's own worked example
   solves — so the figure is the answer to the example, drawn. */
FIGURES.push({
  id: 'h-nmr-spectrum-ethyl-acetate',
  section: 'h-nmr',
  anchor: 'Assemble: CH₃–CO–O–CH₂CH₃, ethyl acetate. Every piece of data accounted for.</p>\n</div>',
  alt: 'The proton NMR spectrum of ethyl acetate. The chemical shift axis runs from 5 ppm on the left to 0 on the right. A four-line quartet stands at 4.1 ppm, a single line at 2.0 ppm, a three-line triplet at 1.3 ppm and a small TMS reference line at 0. A stepped integration trace above the peaks rises by two hydrogens at the quartet and by three at each of the other two signals, and a labeled bar underneath links the quartet and the triplet by their shared coupling constant of about 7 hertz.',
  viewBox: '0 0 760 444',
  build() {
    const X = (d) => 80 + (5 - d) * 124;
    const base = 300;
    let s = '';
    s += rule(70, base, 716, base);
    for (const d of [5, 4, 3, 2, 1, 0]) {
      s += rule(X(d), base, X(d), base + 6);
      s += text(X(d), base + 20, String(d), { cls: 'fg-sm', size: 9.5 });
    }
    s += text(394, 350, 'chemical shift δ (ppm) — δ decreasing to the right, as a spectrum is printed', { cls: 'fg-sm', size: 10.5 });

    /* the three multiplets. The line SPACING is drawn far wider than scale:
       7 Hz on a 300 MHz instrument is 0.023 ppm, about three pixels here, and
       at that size nobody could count the lines. */
    const mult = (d, heights, gap) => {
      let out = '';
      const x0 = X(d) - ((heights.length - 1) * gap) / 2;
      heights.forEach((h, i) => { out += stick(x0 + i * gap, base, h); });
      return out;
    };
    s += mult(4.1, [33.33, 100, 100, 33.33], 7);
    s += mult(2.0, [130], 7);
    s += mult(1.3, [60, 120, 60], 7);
    s += stick(X(0), base, 34, 'fg-bond-soft', 2.2);

    /* integration, drawn the way an instrument draws it: a trace that steps up
       by the area of each signal as it crosses it. */
    let step = 'M110 150';
    const risers = [[4.1, 20], [2.0, 30], [1.3, 30]];
    let y = 150;
    for (const [d, h] of risers) {
      step += ` L${n2(X(d) - 16)} ${n2(y)} L${n2(X(d) + 16)} ${n2(y - h)}`;
      y -= h;
    }
    step += ` L690 ${n2(y)}`;
    s += `<path class="fg-arrow-mut" d="${step}"></path>`;
    s += text(X(4.1) + 22, 142, '2H', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(X(2.0) + 22, 118, '3H', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(X(1.3) + 22, 88, '3H', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(96, 74, 'integration 2 : 3 : 3 — eight hydrogens, and C₄H₈O₂ has exactly eight', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });

    /* assignments, under the axis where there is room for two lines each */
    const assign = (d, a, b, dx = 0) => text(X(d), 374, a, { cls: 'fg-lbl', size: 12 }) + text(X(d) + dx, 390, b, { cls: 'fg-sm', size: 9.5 });
    s += assign(4.1, '–O–CH₂–', 'δ 4.1 · q · 2H');
    s += assign(2.0, 'CH₃–C=O', 'δ 2.0 · s · 3H', -14);
    s += assign(1.3, '–CH₃', 'δ 1.3 · t · 3H', 16);
    s += text(716, 374, 'TMS', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });
    s += text(716, 390, 'δ 0 by definition', { cls: 'fg-sm', size: 9.5, anchor: 'end' });

    s += text(X(2.7), 412, 'matching J ≈ 7 Hz — these two are coupled to each other', { cls: 'fg-tag', size: 11 });
    s += `<line class="fg-arrow" x1="${n2(X(4.1))}" y1="426" x2="${n2(X(1.3))}" y2="426"></line>`;
    s += `<line class="fg-arrow" x1="${n2(X(4.1))}" y1="420" x2="${n2(X(4.1))}" y2="432"></line>`;
    s += `<line class="fg-arrow" x1="${n2(X(1.3))}" y1="420" x2="${n2(X(1.3))}" y2="432"></line>`;
    s += text(680, 46, 'ethyl acetate, CH₃COOCH₂CH₃', { cls: 'fg-tag', size: 11, anchor: 'end' });
    return s;
  },
  caption: 'A real spectrum, with the three readings marked on it. The quartet at 4.1 and the triplet at 1.3 are an ethyl group, and their matching line spacing &mdash; the coupling constant J &mdash; is what proves they are neighbors rather than two unrelated signals that happen to look right. The 3H singlet at 2.0 has no neighbors at all, so its methyl must be attached to something carrying no hydrogens, which here is the carbonyl.',
  note: 'The line spacings are drawn much wider than scale on purpose: 7 Hz on a 300 MHz instrument is 0.023 ppm, about three pixels at this size, and a real printed multiplet is expanded before anyone tries to count its lines.',
});

/* ------------------------------------------- 1H NMR, the splitting tree ---
   Two neighbour sets, taken one at a time. Panel 1 is the case where the two
   J values match and the tree collapses; panel 2 is the case where they do
   not and every line survives. The prose can state that; only a picture can
   show it. */
FIGURES.push({
  id: 'h-nmr-splitting-tree',
  section: 'h-nmr',
  anchor: 'and only then ask what it looks like.</p>',
  alt: 'Two splitting trees side by side. On the left, one line splits into four equally spaced lines and each of those splits into three, and because both coupling constants are 7 hertz the twelve lines fall onto six positions, drawn underneath as a six-line multiplet with heights 1, 5, 10, 10, 5 and 1. On the right, one line splits into two lines 17.6 hertz apart and each of those splits into two lines 10.9 hertz apart, giving four separate lines of equal height drawn underneath.',
  viewBox: '0 0 760 440',
  build() {
    let s = '';
    const tier = (cx, y, positions, from) => {
      let out = '';
      for (const p of positions) {
        out += `<line class="fg-bond-soft" x1="${n2(from)}" y1="${n2(y - 34)}" x2="${n2(p)}" y2="${n2(y)}"></line>`;
        out += stick(p, y + 16, 16, 'fg-bond', 2.4);
      }
      return out;
    };
    /* ---- panel 1: equal J, the tree collapses ---- */
    const c1 = 196;
    s += text(c1, 36, 'CH₃–CH₂–CHBr–CH₃, the CHBr hydrogen', { cls: 'fg-lbl', size: 12 });
    s += text(c1, 52, 'two different neighbor sets, both J ≈ 7 Hz', { cls: 'fg-sm', size: 10 });
    s += stick(c1, 92, 16, 'fg-bond', 2.4);
    s += text(c1, 108, 'before any coupling', { cls: 'fg-sm', size: 9.5 });

    const g = 24;
    const q = [-1.5, -0.5, 0.5, 1.5].map((k) => c1 + k * g);
    s += tier(c1, 150, q, c1);
    s += text(c1, 186, 'split by the 3 H of the CH₃ — a quartet', { cls: 'fg-tag', size: 11 });

    const t2 = [];
    for (const p of q) for (const k of [-1, 0, 1]) t2.push(p + k * g);
    for (const p of q) {
      for (const k of [-1, 0, 1]) {
        s += `<line class="fg-bond-soft" x1="${n2(p)}" y1="${n2(206)}" x2="${n2(p + k * g)}" y2="${n2(236)}"></line>`;
      }
    }
    s += text(c1, 262, 'each line split again by the 2 H of the CH₂', { cls: 'fg-tag', size: 11 });
    s += text(c1, 278, 'twelve lines — but only six positions', { cls: 'fg-sm', size: 9.5 });

    const base1 = 370;
    s += rule(60, base1, 332, base1);
    const heights = [1, 5, 10, 10, 5, 1];
    [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].forEach((k, i) => {
      s += stick(c1 + k * g, base1, heights[i] * 7.2, 'fg-bond', 3);
    });
    s += text(c1, 392, 'what you see: a sextet', { cls: 'fg-lbl', size: 12 });
    s += text(c1, 408, '1 : 5 : 10 : 10 : 5 : 1 — equal J stacks the lines', { cls: 'fg-sm', size: 10 });

    /* ---- panel 2: unequal J, nothing collapses ---- */
    s += `<line class="fg-dash" x1="380" y1="30" x2="380" y2="412"></line>`;
    const c2 = 566;
    s += text(c2, 36, 'C₆H₅–CH=CH₂, the internal vinyl hydrogen', { cls: 'fg-lbl', size: 12 });
    s += text(c2, 52, 'two different neighbors, J = 17.6 and 10.9 Hz', { cls: 'fg-sm', size: 10 });
    s += stick(c2, 92, 16, 'fg-bond', 2.4);
    s += text(c2, 108, 'before any coupling', { cls: 'fg-sm', size: 9.5 });

    const gA = 52, gB = 22;
    const d1 = [-0.5, 0.5].map((k) => c2 + k * gA);
    s += tier(c2, 150, d1, c2);
    s += text(c2, 186, 'split by the trans partner — J = 17.6 Hz', { cls: 'fg-tag', size: 11 });
    const d2 = [];
    for (const p of d1) for (const k of [-0.5, 0.5]) d2.push(p + k * gB);
    for (const p of d1) for (const k of [-0.5, 0.5]) {
      s += `<line class="fg-bond-soft" x1="${n2(p)}" y1="206" x2="${n2(p + k * gB)}" y2="236"></line>`;
    }
    s += text(c2, 262, 'split again by the cis partner — J = 10.9 Hz', { cls: 'fg-tag', size: 11 });
    s += text(c2, 278, 'four lines, and all four survive', { cls: 'fg-sm', size: 9.5 });

    s += rule(430, base1, 702, base1);
    d2.forEach((p) => { s += stick(p, base1, 72, 'fg-bond', 3); });
    s += text(c2, 392, 'what you see: a doublet of doublets', { cls: 'fg-lbl', size: 12 });
    s += text(c2, 408, '1 : 1 : 1 : 1 — unequal J keeps every line apart', { cls: 'fg-sm', size: 10 });
    s += text(380, 432, 'Same procedure both times. Only the two J values decide what comes out.', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Splitting happens one neighbor set at a time, so draw the tree and read the bottom row &mdash; never try to guess the multiplet in a single step. On the left the two coupling constants are equal, the twelve lines land on six positions, and what prints is an ordinary sextet. On the right they are not equal, so nothing merges and you count four lines: a <b>doublet of doublets</b>, the pattern the n + 1 rule cannot produce.',
  note: 'The n + 1 rule is the special case of this drawing in which every neighbor has the same J. That is why it works so well on freely rotating chains, where all the vicinal couplings really are about 7 Hz, and fails the moment a hydrogen has neighbors of two different kinds &mdash; as any vinyl hydrogen does. One simplification is built into the left panel: C2 of 2-bromobutane is a stereocenter, so its two CH₂ hydrogens are strictly diastereotopic rather than equivalent, and a real spectrum is a little messier than the clean sextet drawn. The tree is drawn with them equivalent because the point being made is what two different J values do.',
});

/* ------------------------------------------------------------ 13C/DEPT ---
   Butan-2-one, the compound the section's own worked example solves, and the
   only way to show what "up", "down" and "absent" mean. */
FIGURES.push({
  id: 'c-nmr-dept-butanone',
  section: 'c-nmr',
  anchor: 'with no multiplets to untangle.</p>',
  alt: 'The carbon-13 and DEPT-135 spectra of butan-2-one drawn one above the other on a shared chemical shift axis running from 220 ppm on the left to 0 on the right. The upper decoupled spectrum has four lines, at 209, 37, 29 and 8 ppm, plus a small gray three-line solvent signal at 77. The lower DEPT spectrum has lines pointing up at 29 and 8 labeled CH3, a line pointing down at 37 labeled CH2, and a dashed gray ghost at 209 labeled absent, quaternary.',
  viewBox: '0 0 760 476',
  build() {
    const X = (d) => 80 + ((220 - d) / 220) * 620;
    let s = '';
    const top = 170;
    s += text(74, 54, 'standard proton-decoupled ¹³C — four lines, so four carbon environments', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += rule(70, top, 716, top);
    for (const [d, lbl] of [[209, '209'], [37, '37'], [29, '29'], [8, '8']]) {
      s += stick(X(d), top, 80, 'fg-bond', 3);
      s += text(X(d), top - 88, lbl, { cls: 'fg-lbl', size: 11.5 });
    }
    s += text(X(209) + 12, top - 62, 'C=O', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    /* the solvent line nobody warns you about */
    for (const k of [-5, 0, 5]) s += stick(X(77) + k, top, 24, 'fg-bond-soft', 2);
    s += text(X(77), top - 34, 'CDCl₃ — the solvent, 77 ppm. Ignore it.', { cls: 'fg-tag-mut', size: 10.5 });

    s += `<line class="fg-dash" x1="60" y1="212" x2="716" y2="212"></line>`;

    const mid = 322;
    s += text(74, 246, 'DEPT-135 — the same carbons, now with their hydrogen counts', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += rule(70, mid, 716, mid);
    s += stick(X(29), mid, 64, 'fg-bond', 3);
    s += stick(X(8), mid, 64, 'fg-bond', 3);
    s += text(X(29), mid - 74, 'CH₃', { cls: 'fg-tag', size: 11 });
    s += text(X(8), mid - 74, 'CH₃', { cls: 'fg-tag', size: 11 });
    s += stick(X(37), mid, -52, 'fg-bond', 3);
    s += text(X(37), mid + 68, 'CH₂', { cls: 'fg-tag', size: 11 });
    s += `<line class="fg-dash" x1="${n2(X(209))}" y1="${mid}" x2="${n2(X(209))}" y2="${mid - 52}"></line>`;
    s += text(X(209) + 10, mid - 62, 'absent — quaternary', { cls: 'fg-tag-mut', size: 10.5, anchor: 'start' });
    s += text(X(209) + 10, mid - 46, 'no attached H', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    const ax = 414;
    s += rule(70, ax, 716, ax);
    for (const d of [220, 200, 150, 100, 50, 0]) {
      s += rule(X(d), ax, X(d), ax + 6);
      s += text(X(d), ax + 20, String(d), { cls: 'fg-sm', size: 9.5 });
    }
    s += text(394, 450, 'chemical shift δ (ppm) — δ decreasing to the right', { cls: 'fg-sm', size: 10.5 });
    s += text(394, 470, 'butan-2-one, CH₃–CO–CH₂–CH₃', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'The same molecule twice. The top spectrum counts environments: four lines for four carbons, so there is no symmetry anywhere in the molecule. The bottom one puts hydrogens on them &mdash; two methyls pointing up, one CH₂ pointing down, and a gap where the carbonyl was. Together they give CH₃&ndash;CO&ndash;CH₂&ndash;CH₃ without a single multiplet to untangle.',
  note: 'Up for CH and CH₃, down for CH₂, missing for a carbon with no hydrogens. A peak present in the top spectrum and absent from the bottom one is how you find a quaternary carbon &mdash; and the gray line at 77 is the solvent, not your compound.',
});

/* ----------------------------------------------------------- mass spec ---
   Two spectra: one that shows what a base peak is and where it comes from,
   and one that shows the halogen isotope pattern on a real fragment pattern
   rather than as a two-bar cartoon. */
FIGURES.push({
  id: 'ms-spectra-butanone-bromoethane',
  section: 'mass-spec',
  anchor: 'applied to a different question.</div>',
  alt: 'Two mass spectra drawn as bar charts. The upper one, of 2-butanone, has its tallest bar at m/z 43 labeled base peak, a bar at about a quarter height at m/z 72 labeled molecular ion, smaller bars at 57 and 29, and a hairline at 73 labeled M+1. The lower one, of bromoethane, has its tallest bar at m/z 29 and a pair of bars of almost equal height at m/z 108 and 110, labeled M and M+2 for one bromine.',
  viewBox: '0 0 760 540',
  build() {
    let s = '';
    const panelA = (base, X, bars) => {
      let out = rule(70, base, 716, base) + rule(70, base, 70, base - 140);
      for (const t of [100, 50, 0]) {
        out += rule(64, base - t * 1.3, 70, base - t * 1.3);
        out += text(60, base - t * 1.3 + 4, String(t), { cls: 'fg-sm', size: 9.5, anchor: 'end' });
      }
      for (const b of bars) out += stick(X(b[0]), base, Math.max(b[1] * 1.3, 1.5), b[2] || 'fg-bond', 4);
      return out;
    };
    /* ---- 2-butanone ---- */
    const XA = (m) => 70 + ((m - 10) / 70) * 620;
    const baseA = 206;
    s += text(74, 40, '2-butanone, CH₃–CO–CH₂–CH₃ (M = 72)', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += panelA(baseA, XA, [[15, 6], [27, 16], [29, 24], [43, 100], [57, 8], [72, 25], [73, 1.1]]);
    for (const m of [20, 30, 40, 50, 60, 70, 80]) {
      s += rule(XA(m), baseA, XA(m), baseA + 6);
      s += text(XA(m), baseA + 20, String(m), { cls: 'fg-sm', size: 9.5 });
    }
    s += text(XA(45), baseA + 40, 'm/z', { cls: 'fg-sm', size: 10 });
    s += `<text class="fg-sm" x="30" y="140" text-anchor="middle" transform="rotate(-90 30 140)">relative abundance (%)</text>`;
    s += text(XA(43), 60, 'base peak — CH₃CO⁺ at 43,', { cls: 'fg-tag', size: 11 });
    s += text(XA(43), 76, 'left behind when the ethyl radical goes', { cls: 'fg-sm', size: 10 });
    s += `<line class="fg-dash-hi" x1="${n2(XA(43))}" y1="84" x2="${n2(XA(43))}" y2="${n2(baseA - 136)}"></line>`;
    s += text(XA(72), 126, 'M⁺• = 72', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(XA(72), 142, 'the molecular ion', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += `<line class="fg-dash-hi" x1="${n2(XA(72) - 2)}" y1="150" x2="${n2(XA(72) - 2)}" y2="${n2(baseA - 36)}"></line>`;
    s += text(XA(57), 182, '57, CH₃CH₂CO⁺', { cls: 'fg-sm', size: 10, anchor: 'middle' });
    s += text(XA(29), 150, '29, C₂H₅⁺', { cls: 'fg-sm', size: 10 });
    s += text(716, 108, 'M+1 at 73 — the ¹³C shadow, ~4% of M', { cls: 'fg-tag-mut', size: 10, anchor: 'end' });
    s += `<line class="fg-dash" x1="656" y1="114" x2="${n2(XA(73) + 3)}" y2="${n2(baseA - 8)}"></line>`;

    /* ---- bromoethane ---- */
    const XB = (m) => 70 + ((m - 10) / 110) * 620;
    const baseB = 470;
    s += text(74, 296, 'bromoethane, CH₃CH₂Br (M = 108)', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += panelA(baseB, XB, [[26, 10], [27, 52], [29, 100], [93, 5], [95, 5], [108, 45], [110, 44]]);
    for (const m of [20, 40, 60, 80, 100, 120]) {
      s += rule(XB(m), baseB, XB(m), baseB + 6);
      s += text(XB(m), baseB + 20, String(m), { cls: 'fg-sm', size: 9.5 });
    }
    s += text(XB(65), baseB + 38, 'm/z', { cls: 'fg-sm', size: 10 });
    s += `<text class="fg-sm" x="30" y="404" text-anchor="middle" transform="rotate(-90 30 404)">relative abundance (%)</text>`;
    s += text(XB(29), 314, 'base peak 29 — C₂H₅⁺, the bromine radical lost', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += `<line class="fg-dash-hi" x1="${n2(XB(29))}" y1="322" x2="${n2(XB(29))}" y2="${n2(baseB - 136)}"></line>`;
    s += text(XB(109), 372, 'M at 108 and M+2 at 110,', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(XB(109), 388, 'almost exactly equal — one bromine', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += `<line class="fg-dash-hi" x1="${n2(XB(109))}" y1="396" x2="${n2(XB(109))}" y2="${n2(baseB - 62)}"></line>`;
    s += text(394, 530, 'Highest mass is not tallest: 72 and 108 give the weight, 43 and 29 give the weakest bond.', { cls: 'fg-lbl', size: 12.5 });
    return s;
  },
  caption: 'One spectrum each, and in both of them the two peaks that matter are not the same peak. The <b>molecular ion</b> at the right-hand end of each trace gives the molecular weight &mdash; 72 and 108. The <b>base peak</b> is the tallest, and in both cases it is a fragment: the acylium ion left when 2-butanone loses its ethyl radical, and the ethyl cation left when bromoethane loses its bromine. Reading from high mass down is reading the molecule coming apart.',
  note: 'The bromoethane trace is what &ldquo;M and M+2, roughly 1:1&rdquo; looks like when it is not a cartoon: two bars of nearly equal height, two units apart, at the top of the spectrum. A single chlorine would give the same pair at 3:1 instead, and no halogen at all leaves M standing alone.',
});


/* ------------------------------------------------------------------ D6 ---
   The notational act itself. The section's other figure shows the OUTCOME of
   three cuts as text panels; a reader who has never drawn a disconnection has
   still never seen the squiggle, the open arrow and the charges that say
   which synthon attacks. Every textbook draws this before anything else. */
FIGURES.push({
  id: 'disconnection-notation',
  section: 'retrosynthesis',
  anchor: 'A disconnection that looks fine on paper and gives a mixture in the flask is still a wrong answer.</div>',
  alt: 'A beta-hydroxy ketone with a squiggly line through one carbon-carbon bond, an open retrosynthetic arrow, and the two synthons it gives',
  viewBox: '0 0 700 300',
  build() {
    let s = '';
    s += tag(350, 26, 'one disconnection, written the way it is written');

    /* 4-hydroxy-4-methylpentan-2-one, skeletal. Unlabeled vertices are
       carbons; only the two heteroatom labels are drawn. */
    const v1 = P(60, 175), v2 = P(95, 152), v3 = P(130, 175), v4 = P(165, 152);
    s += bond(v1, v2, { rFrom: 0, rTo: 0 });
    s += bond(v2, P(95, 108), { rFrom: 0, rTo: 15, order: 2 });
    s += bond(v2, v3, { rFrom: 0, rTo: 0 });
    s += bond(v3, v4, { rFrom: 0, rTo: 0 });
    s += bond(v4, P(165, 108), { rFrom: 0, rTo: 15 });
    s += bond(v4, P(202, 130), { rFrom: 0, rTo: 0 });
    s += bond(v4, P(202, 174), { rFrom: 0, rTo: 0 });
    s += atom(95, 108, 'O');
    s += atom(165, 108, 'OH');

    /* The squiggle, across the bond between the alpha carbon and the carbinol
       carbon. Drawn as a wave along the perpendicular so it reads as a cut
       through that one bond rather than as a bond of its own. */
    const mx = (v3.x + v4.x) / 2, my = (v3.y + v4.y) / 2;
    const L = Math.hypot(v4.x - v3.x, v4.y - v3.y);
    const ux = (v4.x - v3.x) / L, uy = (v4.y - v3.y) / L;   // along the bond
    const px = -uy, py = ux;                                // across it
    let d = '';
    for (let i = 0; i <= 8; i++) {
      const t = -20 + i * 5;
      const off = i % 2 === 0 ? 0 : (i % 4 === 1 ? 5 : -5);
      const x = mx + px * t + ux * off, y = my + py * t + uy * off;
      d += (i === 0 ? 'M' : 'L') + `${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100} `;
    }
    s += `<path class="fg-dash-hi" fill="none" d="${d.trim()}"></path>`;
    s += tag(147, 216, 'disconnect here');

    /* The open arrow, drawn rather than typed. A text arrow renders at the
       stylesheet's 13px whatever font-size the drawing asks for, which is too
       small to read as the notation it is. */
    s += `<line class="fg-arrow" x1="236" y1="148" x2="278" y2="148"></line>`;
    s += `<line class="fg-arrow" x1="236" y1="156" x2="278" y2="156"></line>`;
    s += `<path class="fg-head" d="M294 152 L276 143 L276 161 Z"></path>`;
    s += tag(262, 130, 'aldol');

    /* The two synthons. Both are acetone; only the charge drawn on them
       differs, which is the whole reason this example is worth drawing. */
    const acetone = (ax, cy) => {
      const a1 = P(ax, cy + 22), a2 = P(ax + 30, cy), a3 = P(ax + 60, cy + 22);
      let g = bond(a1, a2, { rFrom: 0, rTo: 0 });
      g += bond(a2, P(ax + 30, cy - 40), { rFrom: 0, rTo: 15, order: 2 });
      g += bond(a2, a3, { rFrom: 0, rTo: 0 });
      g += atom(ax + 30, cy - 40, 'O');
      return g;
    };
    s += panel(318, 76, 180, 150);
    s += tag(408, 98, 'synthon: enolate');
    s += acetone(370, 170);
    s += text(446, 186, '⁻', { cls: 'fg-lbl' });
    s += text(408, 214, 'nucleophilic α carbon', { cls: 'fg-sm' });

    s += panel(508, 76, 180, 150);
    s += tag(598, 98, 'synthon: electrophile');
    s += acetone(560, 170);
    /* The delta+ marks the CARBONYL carbon at (590,170), not the methyl it
       used to sit beside: a leader line takes it there, because there is no
       clear space adjacent to that carbon between the C=O and the two
       methyls. */
    s += text(640, 148, 'δ+', { cls: 'fg-lbl' });
    s += rule(630, 152, 604, 166);
    s += text(598, 214, 'electrophilic C=O carbon', { cls: 'fg-sm' });

    s += text(350, 262, 'synthetic equivalents: acetone + NaOH   ·   acetone', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'One disconnection, drawn the way it is written: a squiggle through the bond, an open arrow, and two synthons carrying the charges that say which one attacks. Both equivalents are the same compound here, which is why the forward reaction is simply acetone with base.',
  note: 'The squiggle is worth drawing every time. It records <i>which</i> bond you cut, and a large share of wrong retrosynthetic answers are wrong because the bond that was cut is not the bond the named reaction makes. Note also what is <i>not</i> cut: the C&ndash;OH bond. Plenty of reactions make a C&ndash;O bond, but they are interconversions rather than ways of joining two pieces, and a disconnection is for bonds that assemble the skeleton.',
});

/* ------------------------------------------------------------------ D7 ---
   The ten, as structures. The section's claim is that the list is short
   enough to learn as a list, and then it never draws a single member of it.
   A table of "joins" and "gives" says what a reaction does; it does not say
   what an acetylide alkylation LOOKS like, which is what a reader has to
   recognize in a target. */
FIGURES.push({
  id: 'the-ten-drawn-once',
  section: 'carbon-carbon-bonds',
  anchor: 'acylation does neither, which is why it is almost always the one to plan with.</div>',
  alt: 'Ten panels, one for each carbon-carbon bond-forming reaction, each showing the product with the newly formed bond picked out',
  viewBox: '0 0 700 760',
  build() {
    let s = '';
    s += tag(350, 26, 'each reaction once, with the bond it just made drawn in color');

    const PW = 334, PH = 140;
    const cols = [10, 356];
    const rows = [44, 186, 328, 470, 612];

    /* Half-width of a condensed formula. Every atom label renders at the
       stylesheet's 13px monospace regardless of what the drawing kit is
       asked for, so the disc has to be sized from the character count or the
       label hangs out of it -- which is exactly what the first draft did. */
    const hw = (t) => t.length * 4 + 6;
    const frag = (x, cy, t) => (t.length <= 5
      ? atom(x, cy, t, { r: Math.max(15, hw(t)) })
      : label(x, cy + 4.5, t));

    /* Two fragments and the bond that has just joined them: the shape of six
       of the ten. Centred on cx so the panel does not look lopsided. */
    const joinRow = (cx, cy, left, right) => {
      const lw = Math.max(15, hw(left)), rw = Math.max(15, hw(right));
      const total = lw * 2 + 44 + rw * 2;
      const lx = cx - total / 2 + lw, rx = cx + total / 2 - rw;
      return bond(P(lx, cy), P(rx, cy), { rFrom: lw + 3, rTo: rw + 3, cls: 'fg-bond-hi' })
        + frag(lx, cy, left) + frag(rx, cy, right);
    };

    const ring = (cx, cy, r, opts = {}) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = ((opts.start ?? -90) + i * 60) * Math.PI / 180;
        v.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
      }
      let g = '';
      for (let i = 0; i < 6; i++) {
        const cls = (opts.hiEdges || []).includes(i) ? 'fg-bond-hi' : 'fg-bond';
        const order = (opts.dblEdges || []).includes(i) ? 2 : 1;
        g += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0, cls, order, gap: 3.5 });
      }
      if (opts.aromatic) g += `<circle class="fg-bond" cx="${cx}" cy="${cy}" r="${Math.round(r * 0.58)}" fill="none"></circle>`;
      return { g, v };
    };

    const panels = [
      { t: 'Grignard or RLi + carbonyl', r: 'cyclohexanone + CH₃MgBr', n: '1-methylcyclohexan-1-ol',
        draw(cx, cy) {
          /* Both new groups hang off ONE ring carbon (v[0], placed at the
             east point of the ring), because the product is a tertiary
             alcohol: the carbon that was the C=O now carries the OH and the
             methyl. The first draft put them on adjacent carbons, which is
             2-methylcyclohexan-1-ol and a different reaction entirely. */
          const { g, v } = ring(cx - 38, cy, 19, { start: 0 });
          return g
            + bond(v[0], P(cx + 8, cy - 24), { rFrom: 0, rTo: 15 })
            + bond(v[0], P(cx + 8, cy + 24), { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' })
            + atom(cx + 8, cy - 24, 'OH')
            + atom(cx + 8, cy + 24, 'CH₃', { kind: 'hi', r: 17 });
        } },
      { t: 'Grignard + CO₂', r: 'CH₃CH₂MgBr + CO₂, then H₃O⁺', n: 'propanoic acid',
        draw: (cx, cy) => joinRow(cx, cy, 'CH₃CH₂', 'CO₂H') },
      { t: 'acetylide + alkyl halide', r: 'HC≡C⁻ Na⁺ + CH₃CH₂Br', n: 'but-1-yne',
        draw: (cx, cy) => joinRow(cx, cy, 'HC≡C', 'CH₂CH₃') },
      { t: 'cyanide + alkyl halide', r: 'CH₃CH₂Br + NaCN', n: 'propanenitrile',
        draw: (cx, cy) => joinRow(cx, cy, 'CH₃CH₂', 'C≡N') },
      { t: 'aldol', r: '2 × acetaldehyde, NaOH', n: '3-hydroxybutanal',
        draw: (cx, cy) => joinRow(cx, cy, 'CH₃CH(OH)', 'CH₂CHO') },
      { t: 'Claisen', r: '2 × ethyl acetate, NaOEt', n: 'ethyl acetoacetate',
        draw: (cx, cy) => joinRow(cx, cy, 'CH₃CO', 'CH₂CO₂Et') },
      { t: 'Michael (conjugate) addition', r: 'malonate enolate + but-3-en-2-one', n: 'a 1,5-keto-ester',
        draw: (cx, cy) => joinRow(cx, cy, '(EtO₂C)₂CH', 'CH₂CH₂COCH₃') },
      { t: 'Diels–Alder', r: 'butadiene + ethene, the simplest case', n: 'cyclohexene, two bonds at once',
        draw(cx, cy) {
          /* Ring carbons, clockwise from the top: the diene supplied the four
             at the top and left, the dienophile the two on the lower right,
             so the new sigma bonds are the two edges where they meet and the
             new pi bond is the middle of what was the diene. */
          const { g } = ring(cx, cy, 25, { dblEdges: [5], hiEdges: [1, 3] });
          return g;
        } },
      { t: 'Friedel–Crafts acylation', r: 'benzene + CH₃COCl / AlCl₃', n: 'acetophenone',
        draw(cx, cy) {
          const { g, v } = ring(cx - 45, cy, 20, { aromatic: true });
          return g
            + bond(v[1], P(cx + 8, cy - 16), { rFrom: 0, rTo: 26, cls: 'fg-bond-hi' })
            + atom(cx + 8, cy - 16, 'COCH₃', { kind: 'hi', r: 26 });
        } },
      { t: 'Wittig', r: 'cyclohexanone + Ph₃P=CH₂', n: 'methylenecyclohexane',
        draw(cx, cy) {
          const { g, v } = ring(cx - 40, cy, 20);
          return g
            + bond(v[1], P(cx + 8, cy - 16), { rFrom: 0, rTo: 17, cls: 'fg-bond-hi', order: 2, gap: 3.5 })
            + atom(cx + 8, cy - 16, 'CH₂', { kind: 'hi', r: 17 });
        } },
    ];

    panels.forEach((pn, i) => {
      const x = cols[i % 2], y = rows[Math.floor(i / 2)];
      const cx = x + PW / 2;
      s += panel(x, y, PW, PH);
      s += tag(cx, y + 20, pn.t);
      s += text(cx, y + 38, pn.r, { cls: 'fg-sm' });
      s += pn.draw(cx, y + 84);
      s += text(cx, y + 130, pn.n, { cls: 'fg-tag-good' });
    });
    return s;
  },
  caption: 'Each of the ten, once, with the bond it makes picked out. The table says what joins to what; this says what it looks like when it has.',
  note: 'Reading down the colored marks is the fastest way to internalize the list. Four attach the new carbon straight <b>onto</b> a carbonyl carbon, or onto the carbon that was one &mdash; the Grignard onto a ketone, the Grignard onto CO&#8322;, Friedel&ndash;Crafts acylation and the Wittig. Two run from an &alpha; carbon onto a carbonyl carbon at the other end, the aldol and the Claisen, and the Michael is the enolate that does not: it lands on the &beta; carbon, two carbons out from the enone&rsquo;s C=O. The remaining three &mdash; Diels&ndash;Alder, acetylide alkylation and cyanide alkylation &mdash; build a skeleton with no carbonyl in sight, the nitrile only becoming one if you hydrolyse it afterwards. The Diels&ndash;Alder panel is the only one with two colored bonds, which is the whole reason it is the highest-value move in the list.',
});

/* ------------------------------------------------------------------ D8 ---
   The section's signature trick, which is a three-structure transformation
   described in one sentence. "Eliminate, then add back with the opposite
   regiochemistry" is the kind of claim a reader agrees with and then cannot
   reproduce, because what decides the answer is which of two reagents comes
   second. */
FIGURES.push({
  id: 'move-the-group-along',
  section: 'functional-group-interconversion',
  anchor: 'Using acid-catalyzed hydration in step 2 would put the OH straight back where it started. The whole synthesis turns on choosing the anti-Markovnikov reagent, which is exactly the kind of pair the note above is about.</p>',
  alt: 'Propan-2-ol dehydrated to propene, then hydrated two ways: hydroboration gives propan-1-ol and acid gives propan-2-ol back',
  /* 660 wide: it sits inside a worked example, whose column is narrower. */
  viewBox: '0 0 660 330',
  build() {
    let s = '';
    s += tag(330, 26, 'the same alkene, two ways down');

    s += bond(P(44, 190), P(79, 168), { rFrom: 0, rTo: 0 });
    s += bond(P(79, 168), P(114, 190), { rFrom: 0, rTo: 0 });
    s += bond(P(79, 168), P(79, 124), { rFrom: 0, rTo: 15 });
    s += atom(79, 124, 'OH', { kind: 'hi' });
    s += text(79, 214, 'propan-2-ol', { cls: 'fg-sm' });

    s += arrow(P(146, 168), P(250, 168));
    s += text(198, 150, 'conc. H₂SO₄, heat (E1)', { cls: 'fg-sm' });

    s += bond(P(274, 190), P(309, 168), { rFrom: 0, rTo: 0, order: 2, gap: 3.5 });
    s += bond(P(309, 168), P(344, 190), { rFrom: 0, rTo: 0 });
    s += text(309, 214, 'propene', { cls: 'fg-sm' });

    // Upper branch: hydroboration moves the oxygen to the far carbon.
    s += arrow(P(376, 152), P(474, 110));
    s += text(436, 80, '1. BH₃   2. H₂O₂, HO⁻', { cls: 'fg-sm' });
    s += bond(P(500, 124), P(535, 102), { rFrom: 0, rTo: 0 });
    s += bond(P(535, 102), P(570, 124), { rFrom: 0, rTo: 0 });
    s += bond(P(570, 124), P(605, 102), { rFrom: 0, rTo: 15 });
    s += atom(605, 102, 'OH', { kind: 'hi' });
    s += text(528, 150, 'propan-1-ol', { cls: 'fg-sm' });
    s += text(556, 172, 'anti-Markovnikov — the OH moved', { cls: 'fg-tag-good' });

    // Lower branch: acid puts it straight back.
    s += arrow(P(376, 186), P(474, 230), { muted: true });
    s += text(424, 262, 'H₃O⁺', { cls: 'fg-sm' });
    s += bond(P(505, 244), P(540, 222), { rFrom: 0, rTo: 0 });
    s += bond(P(540, 222), P(575, 244), { rFrom: 0, rTo: 0 });
    s += bond(P(540, 222), P(540, 278), { rFrom: 0, rTo: 15 });
    s += atom(540, 278, 'OH', { kind: 'warn' });
    s += text(612, 222, 'propan-2-ol', { cls: 'fg-sm' });
    s += text(550, 314, 'Markovnikov — straight back to C2', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'The same alkene, two ways down. Eliminating is the easy half; the synthesis is decided entirely by which hydration reagent you pick afterwards.',
  note: 'Nothing is oxidized or reduced anywhere in this picture &mdash; alcohol and alkene sit on the same rung of the ladder &mdash; which is the tell that a "move the group along the chain" problem never needs a redox reagent. If you find yourself reaching for an oxidant, you have misread the question.',
});

/* ------------------------------------------------------------------ D9 ---
   What the two masks actually are. The section describes both in words and
   the page contains no structure at all, so a reader finishes it able to
   recite "silyl ether" and "acetal" without being able to draw either. */
FIGURES.push({
  id: 'two-masks-drawn',
  section: 'protecting-groups',
  anchor: '<td>NaOH, H₂O, then H₃O⁺</td></tr>\n</tbody>\n</table>\n</div>',
  alt: 'An alcohol converted to a silyl ether and back with fluoride, and a ketone converted to a cyclic acetal and back with aqueous acid',
  viewBox: '0 0 700 350',
  build() {
    let s = '';
    s += tag(350, 26, 'what the two masks actually are');

    // Top row: the alcohol, and the proton that is the whole problem.
    s += bond(P(56, 106), P(104, 106), { rFrom: 14, rTo: 13 });
    s += bond(P(104, 106), P(150, 106), { rFrom: 13, rTo: 13 });
    s += atom(56, 106, 'R', { r: 14 });
    s += atom(104, 106, 'O', { r: 13 });
    s += atom(150, 106, 'H', { kind: 'warn', r: 13 });
    s += text(26, 150, 'pKₐ ≈ 16 — the proton that destroys a Grignard', { cls: 'fg-sm', anchor: 'start' });

    s += arrow(P(200, 96), P(370, 96));
    s += text(285, 80, 'TBSCl, imidazole', { cls: 'fg-sm' });
    s += arrow(P(370, 118), P(200, 118), { muted: true });
    s += text(285, 136, 'TBAF (F⁻)', { cls: 'fg-sm' });

    s += bond(P(410, 106), P(456, 106), { rFrom: 14, rTo: 13 });
    s += bond(P(456, 106), P(502, 106), { rFrom: 13, rTo: 16 });
    s += bond(P(502, 106), P(502, 66), { rFrom: 16, rTo: 17 });
    s += bond(P(502, 106), P(502, 146), { rFrom: 16, rTo: 17 });
    s += bond(P(502, 106), P(570, 106), { rFrom: 16, rTo: 32 });
    s += atom(410, 106, 'R', { r: 14 });
    s += atom(456, 106, 'O', { r: 13 });
    s += atom(502, 106, 'Si', { kind: 'hi' });
    s += atom(502, 66, 'CH₃', { r: 17 });
    s += atom(502, 146, 'CH₃', { r: 17 });
    s += atom(570, 106, 'C(CH₃)₃', { r: 32 });
    s += text(556, 180, 'no acidic proton left', { cls: 'fg-tag-good' });

    s += rule(26, 200, 674, 200);

    // Bottom row: the ketone, and the acetal that hides its electrophilic carbon.
    s += bond(P(52, 286), P(92, 264), { rFrom: 0, rTo: 0 });
    s += bond(P(92, 264), P(132, 286), { rFrom: 0, rTo: 0 });
    s += bond(P(92, 264), P(92, 222), { rFrom: 0, rTo: 15, order: 2 });
    s += atom(92, 222, 'O');
    s += text(122, 250, 'δ+', { cls: 'fg-lbl' });
    s += text(92, 314, 'electrophilic carbon', { cls: 'fg-sm' });

    s += arrow(P(190, 254), P(360, 254));
    s += text(275, 238, 'HOCH₂CH₂OH, H⁺, −H₂O', { cls: 'fg-sm' });
    s += arrow(P(360, 276), P(190, 276), { muted: true });
    s += text(275, 294, 'H₃O⁺', { cls: 'fg-sm' });

    // The 1,3-dioxolane, drawn as a real five-membered ring.
    const cxr = 462, cyr = 272, rr = 28;
    const pv = [];
    for (let i = 0; i < 5; i++) {
      const a = (-90 + i * 72) * Math.PI / 180;
      pv.push(P(cxr + Math.cos(a) * rr, cyr + Math.sin(a) * rr));
    }
    // pv[0] is the acetal carbon at the top; pv[1] and pv[4] are the oxygens.
    s += bond(pv[0], pv[1], { rFrom: 0, rTo: 13 });
    s += bond(pv[1], pv[2], { rFrom: 13, rTo: 0 });
    s += bond(pv[2], pv[3], { rFrom: 0, rTo: 0 });
    s += bond(pv[3], pv[4], { rFrom: 0, rTo: 13 });
    s += bond(pv[4], pv[0], { rFrom: 13, rTo: 0 });
    s += atom(pv[1].x, pv[1].y, 'O', { r: 13 });
    s += atom(pv[4].x, pv[4].y, 'O', { r: 13 });
    s += bond(pv[0], P(cxr - 42, cyr - 50), { rFrom: 0, rTo: 14 });
    s += bond(pv[0], P(cxr + 42, cyr - 50), { rFrom: 0, rTo: 14 });
    s += atom(cxr - 42, cyr - 50, 'R', { r: 14 });
    s += atom(cxr + 42, cyr - 50, 'R', { r: 14 });
    s += text(600, 266, 'two single bonds to O,', { cls: 'fg-tag-good' });
    s += text(600, 284, 'no π system to attack', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'What the two masks actually are. Both replace a reactive feature with two ordinary single bonds, and both put it back unchanged when the key arrives.',
  note: 'Count the bonds at the protected atom in each case: nothing has been oxidized or reduced, which is why a protection&ndash;deprotection pair costs you steps but never costs you an oxidation level. Note too that the bulk drawn on the silicon is doing work &mdash; the <i>tert</i>-butyl group is what makes a TBS ether survive mild aqueous acid, where a plain trimethylsilyl ether would not.',
});

/* ----------------------------------------------------------------- D10 ---
   The section's worked routes are prose, and its only figure draws an
   ordering CONTRAST rather than a route. A four-step route with the carbon
   count written along the top is the picture the chapter's "count carbons,
   find the C-C steps" advice has been asking for throughout. */
FIGURES.push({
  id: 'four-step-route',
  section: 'multistep-synthesis',
  anchor: 'Every change in that number is a C–C step, and there are only two of them — the cyanide in step 2 and the double methylation in step 4. The other two steps are bookkeeping.</p>',
  alt: 'A four-step route from butan-1-ol to 2-methylhexan-2-ol with the carbon count written above each intermediate',
  /* 660 wide rather than the usual 700: this figure sits inside a worked
     example, whose column is narrower than the page's, and at 700 the
     product's OH was the part that scrolled off the right edge. */
  viewBox: '0 0 660 270',
  build() {
    let s = '';
    s += tag(330, 30, 'butan-1-ol to 2-methylhexan-2-ol, each step tagged by the kind of move it is');

    const Y = 150;
    const step = (x1, x2, reagent, kind, good) => {
      s += arrow(P(x1, Y), P(x2, Y));
      s += text((x1 + x2) / 2, 128, reagent, { cls: 'fg-sm' });
      s += text((x1 + x2) / 2, 180, kind, { cls: good ? 'fg-tag-good' : 'fg-tag-mut' });
    };

    s += atom(44, Y, 'C₄H₉OH', { r: 34 });
    step(82, 126, 'PBr₃', 'sideways', false);
    s += atom(158, Y, 'C₄H₉Br', { r: 30 });
    step(192, 236, 'NaCN', 'C–C bond', true);

    // Pentanenitrile, with the bond cyanide has just made picked out.
    s += bond(P(262, Y), P(308, Y), { rFrom: 22, rTo: 18, cls: 'fg-bond-hi' });
    s += atom(262, Y, 'C₄H₉', { r: 22 });
    s += atom(308, Y, 'C≡N', { r: 18 });
    step(330, 374, 'H₃O⁺; SOCl₂', 'sideways', false);

    s += bond(P(398, Y), P(444, Y), { rFrom: 22, rTo: 22 });
    s += atom(398, Y, 'C₄H₉', { r: 22 });
    s += atom(444, Y, 'COCl', { r: 22 });
    step(470, 514, '2 CH₃MgBr', 'C–C bond × 2', true);

    // The product: both new methyls colored, because the double addition is
    // the reaction being used rather than the accident being avoided.
    s += bond(P(540, Y), P(584, Y), { rFrom: 22, rTo: 14 });
    s += bond(P(584, Y), P(584, 110), { rFrom: 14, rTo: 17, cls: 'fg-bond-hi' });
    s += bond(P(584, Y), P(584, 190), { rFrom: 14, rTo: 17, cls: 'fg-bond-hi' });
    s += bond(P(584, Y), P(626, Y), { rFrom: 14, rTo: 15 });
    s += atom(540, Y, 'C₄H₉', { r: 22 });
    s += atom(584, Y, 'C', { r: 14 });
    s += atom(584, 110, 'CH₃', { kind: 'hi', r: 17 });
    s += atom(584, 190, 'CH₃', { kind: 'hi', r: 17 });
    s += atom(626, Y, 'OH', { r: 15 });

    for (const [x, c] of [[44, '4 C'], [158, '4 C'], [284, '5 C'], [420, '5 C'], [584, '7 C']]) s += tag(x, 74, c);
    for (const [x, nm] of [[44, 'butan-1-ol'], [158, '1-bromobutane'], [284, 'pentanenitrile'],
      [420, 'pentanoyl chloride'], [580, '2-methylhexan-2-ol']]) s += text(x, 224, nm, { cls: 'fg-sm' });

    s += text(330, 254, 'Two of the four steps make a C–C bond. The other two only move groups.', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'A four-step route with every step tagged by what kind of move it is. Two of the four make carbon–carbon bonds; the other two only shift functional groups around, which is the usual ratio.',
  note: 'Follow the carbon count along the top: 4, 4, 5, 5, 7. Every change in that number is a C&ndash;C step and there are only two of them &mdash; the rest of the route is bookkeeping, exactly as the chapter has claimed throughout. The last step is also the answer to "where is the protecting group?": there is none, because the only O&ndash;H in the route is created <i>by</i> the Grignard, after it has finished its job.',
});


/* ================================================================ B1 ===
   The chapter fix pass: Biomolecules had five figures and not one drawn
   molecule in any of them. Everything below draws a real structure.

   Fischer to Haworth. The notes used the words "Haworth", "up" and "down"
   without a drawing anywhere in the course that shows what a sugar ring
   looks like, so the conversion rule was three words a reader could only
   take on trust. Two panels of one molecule is the only honest way to make
   the claim, because the claim IS that the two drawings are the same
   compound. */
FIGURES.push({
  id: 'fischer-haworth',
  section: 'carbohydrates',
  anchor: 'wedges and dashes back in <a class="chapter-ref" href="/ochem/learn.html#m-stereochemistry">Stereochemistry</a>.</p>',
  viewBox: '0 0 700 412',
  alt: 'D-glucose drawn twice: the open-chain Fischer projection with OH right at C2, left at C3, right at C4 and right at C5, and beta-D-glucopyranose as a Haworth ring with the C1 OH up, C2 OH down, C3 OH up, C4 OH down and the C5 CH2OH up',
  build() {
    let s = '';

    /* ---- left: the Fischer projection ---- */
    s += panel(16, 44, 280, 300);
    s += tag(156, 32, 'open-chain D-glucose (Fischer)');

    const X = 116, XR = 166, XL = 66;
    const ys = [72, 120, 168, 216, 264, 312];
    // The chain, top to bottom. C1 is the aldehyde, C6 the primary alcohol,
    // and C2-C5 are bare crossings, which is what a Fischer projection is:
    // a vertex whose two horizontal bonds come out of the page at you.
    s += atom(X, ys[0], 'CHO');
    s += atom(X, ys[5], 'CH\u2082OH', { r: 20 });
    s += bond(P(X, ys[0]), P(X, ys[1]), { rTo: 0 });
    for (let i = 1; i < 4; i++) s += bond(P(X, ys[i]), P(X, ys[i + 1]), { rFrom: 0, rTo: 0 });
    s += bond(P(X, ys[4]), P(X, ys[5]), { rFrom: 0, rTo: 20 });

    // Right or left at each stereocenter is the entire content of the
    // drawing: OH right at C2, left at C3, right at C4, right at C5 is
    // D-glucose and no other sugar.
    const sub = (i, ohRight) => {
      const y = ys[i];
      const xo = ohRight ? XR : XL, xh = ohRight ? XL : XR;
      return bond(P(X, y), P(xo, y), { rFrom: 0 }) + bond(P(X, y), P(xh, y), { rFrom: 0 }) +
             atom(xo, y, 'OH') + atom(xh, y, 'H');
    };
    s += sub(1, true) + sub(2, false) + sub(3, true) + sub(4, true);
    for (let i = 0; i < 6; i++) s += text(40, ys[i] + 4, String(i + 1), { cls: 'fg-sm' });

    // Ring closure as one arrow: C5's oxygen reaching the C1 carbonyl.
    s += curve(P(184, 258), P(132, 84), { bow: 80 });
    s += tag(240, 168, 'C5 OH \u2192 C1');
    s += tag(240, 268, 'D is read here');

    /* ---- right: the same molecule as a Haworth ring ---- */
    s += panel(306, 44, 378, 300);
    s += tag(495, 32, '\u03b2-D-glucopyranose (Haworth)');

    const C1 = P(656, 200), C2 = P(606, 258), C3 = P(446, 258),
          C4 = P(396, 200), C5 = P(481, 145), O = P(571, 145);
    // The front edge is drawn heavy, because that is the whole of the
    // perspective: those are the bonds nearest the reader.
    s += bond(C4, C3, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(C3, C2, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(C2, C1, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(C5, C4, { rFrom: 0, rTo: 0 });
    s += bond(C5, O, { rFrom: 0, rTo: 15 });
    s += bond(C1, O, { rFrom: 0, rTo: 15 });
    s += atom(O.x, O.y, 'O');

    // Every substituent is a vertical stick. Up: C1 (which is what beta
    // means), C3, and the C5 CH2OH. Down: C2 and C4.
    const stick = (c, up, lab, opts = {}) => {
      const to = P(c.x, c.y + (up ? -48 : 48));
      return bond(c, to, { rFrom: 0, rTo: opts.r ?? 15 }) + atom(to.x, to.y, lab, opts);
    };
    s += stick(C1, true, 'OH');
    s += stick(C2, false, 'OH');
    s += stick(C3, true, 'OH');
    s += stick(C4, false, 'OH');
    s += stick(C5, true, 'CH\u2082OH', { r: 20 });
    // and the anomer nobody asked for, drawn faintly underneath C1.
    s += bond(C1, P(656, 248), { rFrom: 0, rTo: 15, cls: 'fg-bond-soft' });
    s += text(656, 252, 'OH', { cls: 'fg-sm' });
    s += tag(656, 128, '\u03b2');
    s += tag(656, 286, '\u03b1 anomer', { cls: 'fg-tag-mut' });

    // Locants sit inside the ring, the only empty space in the drawing:
    // outside, each one lands beside a substituent and reads as labelling it.
    for (const [x, y, n] of [[631, 205, '1'], [589, 240, '2'], [463, 240, '3'],
      [413, 178, '4'], [501, 168, '5'], [515, 93, '6']]) s += text(x, y, n, { cls: 'fg-sm' });

    /* ---- the rule, underneath, where it can be read as a rule ---- */
    s += rule(26, 356, 674, 356);
    s += tag(160, 378, 'right \u2192 down');
    s += tag(350, 378, 'left \u2192 up');
    s += tag(540, 378, 'D \u2192 CH\u2082OH up');
    s += label(350, 400, 'Same molecule, two drawings \u2014 the ring is C5\u2019s OH bonded to C1, nothing more.');
    return s;
  },
  caption: 'D-glucose twice. A Haworth projection is the ring seen edge-on with the ring oxygen at the back right, the anomeric carbon at the right, and every substituent drawn as a stick pointing straight up or straight down. Reading across, an OH on the <b>right</b> in the Fischer projection ends up pointing <b>down</b> in the ring, and one on the <b>left</b> points <b>up</b>.',
  note: 'Check the conversion on C3. It is the one OH that D-glucose draws on the left, so it is the one that points up in the ring — the fastest way to tell a correctly drawn glucose from a plausible-looking wrong one. Hydrogens on the ring carbons are left off, as they always are in a Haworth drawing.',
});


/* ---------------------------------------------------------------- B2 ---
   An amino acid, drawn. The section spent its length on zwitterions, pI
   and electrophoresis without a single structure on the page, so the one
   thing a reader could not do was picture the molecule the argument is
   about. Three structures and two protons is the whole of it. */
FIGURES.push({
  id: 'amino-acid-charge-states',
  section: 'amino-acids',
  anchor: 'Sketching that three-species ladder is how nearly every amino acid question is solved.</div>',
  viewBox: '0 0 700 300',
  alt: 'Alanine at three pH values: the cation with COOH and NH3+, the zwitterion with carboxylate and ammonium, and the anion with carboxylate and a neutral amine',
  build() {
    let s = '';
    // One alanine, three times. Only the two ends change; the alpha carbon
    // and its methyl are the same atoms throughout, which is the point.
    const form = (cx, left, right, leftKind, rightKind) => {
      const c = P(cx, 120);
      let t = bond(P(cx - 58, 120), c, { rFrom: 20, rTo: 15 });
      t += bond(c, P(cx + 58, 120), { rFrom: 15, rTo: 20 });
      t += bond(c, P(cx, 172), { rFrom: 15, rTo: 17 });
      t += atom(cx - 58, 120, left, { r: 20, kind: leftKind });
      t += atom(cx, 120, 'CH');
      t += atom(cx + 58, 120, right, { r: 20, kind: rightKind });
      t += atom(cx, 172, 'CH₃', { r: 17 });
      return t;
    };
    s += panel(262, 48, 176, 164, { kind: 'hi' });
    s += form(128, 'HOOC', 'NH₃⁺', null, 'warn');
    s += form(350, '⁻OOC', 'NH₃⁺', 'hi', 'warn');
    s += form(572, '⁻OOC', 'NH₂', 'hi', null);
    s += tag(128, 32, 'pH 1 · net +1');
    s += tag(350, 32, 'pH 6 · net 0 · zwitterion');
    s += tag(572, 32, 'pH 11 · net −1');

    // Each arrow moves exactly one proton, which is why there are three
    // species and not four.
    s += arrow(P(212, 112), P(262, 112));
    s += arrow(P(262, 130), P(212, 130), { muted: true });
    s += tag(237, 98, 'pKa 2.34');
    s += arrow(P(434, 112), P(488, 112));
    s += arrow(P(488, 130), P(434, 130), { muted: true });
    s += tag(461, 98, 'pKa 9.69');

    s += rule(26, 232, 674, 232);
    s += label(350, 256, 'The carboxyl gives up its proton first; the ammonium keeps its own the longest.');
    s += text(350, 280, 'Two protons, three species — and the middle one is the neutral form.', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Alanine at three pH values, with the charged groups on tinted discs. The middle structure is the one to internalize: the neutral form of an amino acid is not the form with two neutral groups, it is the form carrying two opposite charges at once.',
  note: 'Each arrow moves one proton and changes the net charge by exactly one, which is why an amino acid with a side chain that cannot ionize has three states and no more. Counting the states before reaching for a formula is what keeps a pI question from going wrong.',
});

/* ---------------------------------------------------------------- B3 ---
   L against D, drawn, because the rule the section now states is a rule
   about a picture and cannot be checked without one. */
FIGURES.push({
  id: 'l-and-d-alanine',
  section: 'amino-acids',
  anchor: 'reading CO–R–N clockwise gives L.</p>',
  viewBox: '0 0 700 310',
  alt: 'Two Fischer projections of alanine side by side, carboxyl at the top and methyl at the bottom, with the amino group on the left in L-alanine and on the right in D-alanine',
  build() {
    let s = '';
    const fischer = (cx, aminoLeft) => {
      const c = P(cx, 140);
      let t = bond(P(cx, 80), c, { rFrom: 20, rTo: 0 });
      t += bond(c, P(cx, 200), { rFrom: 0, rTo: 17 });
      t += bond(c, P(cx - 60, 140), { rFrom: 0, rTo: aminoLeft ? 17 : 15 });
      t += bond(c, P(cx + 60, 140), { rFrom: 0, rTo: aminoLeft ? 15 : 17 });
      t += atom(cx, 80, 'COOH', { r: 20 });
      t += atom(cx, 200, 'CH₃', { r: 17 });
      t += atom(cx - 60, 140, aminoLeft ? 'H₂N' : 'H', { r: aminoLeft ? 17 : 15, kind: aminoLeft ? 'hi' : null });
      t += atom(cx + 60, 140, aminoLeft ? 'H' : 'NH₂', { r: aminoLeft ? 15 : 17, kind: aminoLeft ? null : 'hi' });
      return t;
    };
    s += panel(40, 44, 300, 200, { kind: 'hi' });
    s += panel(360, 44, 300, 200);
    s += fischer(190, true);
    s += fischer(510, false);
    s += tag(190, 32, 'L-alanine — what biology uses');
    s += tag(510, 32, 'D-alanine — the mirror image');

    s += rule(50, 252, 650, 252);
    s += tag(190, 274, 'amino group on the left');
    s += tag(510, 274, 'amino group on the right');
    s += label(350, 298, 'Carboxyl up, side chain down, amino group left — that is all of the L assignment.');
    return s;
  },
  caption: 'The whole of the D/L assignment for an amino acid. Put the carboxyl at the top of a Fischer projection and the side chain at the bottom, then look at one bond: the amino group on the left is <b>L</b>, on the right is <b>D</b>. Nothing else in the drawing is consulted.',
  note: 'D/L is not R/S, and nothing here computes a CIP priority. That is why cysteine can be L like every other protein amino acid and still be assigned R — sulfur outranks the carboxyl carbon, so the priority order changes while the drawing does not.',
});


/* ---------------------------------------------------------------- B4 ---
   One amide, actually made. The section's only figure drew a generic amide
   with no side chains and no N–H; a reader was told that Gly-Ala and
   Ala-Gly are different compounds without ever seeing why the order is a
   structural statement. */
FIGURES.push({
  id: 'peptide-bond-formed',
  section: 'peptides-proteins',
  anchor: 'it is the same linkage as any amide, with the same consequences.</p>',
  viewBox: '0 0 700 430',
  alt: 'Alanine and serine condensing to the dipeptide Ala-Ser, with the serine nitrogen attacking the alanine carboxyl, loss of water, and the resulting amide shaded and labeled the peptide bond',
  build() {
    let s = '';
    // An amino acid, condensed: amine, alpha carbon, carboxyl, side chain
    // hanging below the alpha carbon where it belongs.
    const aa = (x, y, side, sideR) => {
      let t = bond(P(x, y), P(x + 60, y), { rFrom: 17, rTo: 15 });
      t += bond(P(x + 60, y), P(x + 126, y), { rFrom: 15, rTo: 20 });
      t += bond(P(x + 60, y), P(x + 60, y + 52), { rFrom: 15, rTo: sideR });
      t += atom(x, y, 'H₂N', { r: 17 });
      t += atom(x + 60, y, 'CH');
      t += atom(x + 126, y, 'COOH', { r: 20 });
      t += atom(x + 60, y + 52, side, { r: sideR });
      return t;
    };
    s += aa(70, 100, 'CH₃', 17);
    s += aa(300, 100, 'CH₂OH', 20);
    s += text(130, 190, 'alanine', { cls: 'fg-tag' });
    s += text(360, 190, 'serine', { cls: 'fg-tag' });
    // The bond that is about to be made, as the one arrow that makes it.
    s += curve(P(286, 86), P(216, 86), { bow: 18 });
    s += tag(251, 56, 'N attacks C');

    s += arrow(P(530, 200), P(530, 244));
    s += tag(572, 226, '− H₂O');

    /* the dipeptide, with the new amide shaded */
    s += bar(234, 214, 102, 96, { kind: 'hi', opacity: 0.22 });
    const y2 = 286;
    s += bond(P(142, y2), P(202, y2), { rFrom: 17, rTo: 15 });
    s += bond(P(202, y2), P(258, y2), { rFrom: 15, rTo: 15 });
    s += bond(P(258, y2), P(258, 238), { rFrom: 15, rTo: 15, order: 2 });
    s += bond(P(258, y2), P(314, y2), { rFrom: 15, rTo: 17 });
    s += bond(P(314, y2), P(374, y2), { rFrom: 17, rTo: 15 });
    s += bond(P(374, y2), P(440, y2), { rFrom: 15, rTo: 20 });
    s += bond(P(202, y2), P(202, 334), { rFrom: 15, rTo: 17 });
    s += bond(P(374, y2), P(374, 334), { rFrom: 15, rTo: 20 });
    s += atom(142, y2, 'H₂N', { r: 17 });
    s += atom(202, y2, 'CH');
    s += atom(258, y2, 'C', { kind: 'hi' });
    s += atom(258, 238, 'O');
    s += atom(314, y2, 'NH', { r: 17, kind: 'hi' });
    s += atom(374, y2, 'CH');
    s += atom(440, y2, 'COOH', { r: 20 });
    s += atom(202, 334, 'CH₃', { r: 17 });
    s += atom(374, 334, 'CH₂OH', { r: 20 });
    s += tag(142, 246, 'N-terminus');
    s += tag(440, 246, 'C-terminus');
    s += tag(285, 330, 'peptide bond');
    s += text(350, 380, 'Ala-Ser, written N to C', { cls: 'fg-tag-good', size: 11 });

    s += rule(26, 398, 674, 398);
    s += label(350, 420, 'Alanine gave the carboxyl, so alanine is the N-terminal residue.');
    return s;
  },
  caption: 'One amide, made the ordinary way. Alanine supplies the carboxyl and serine supplies the amine, so alanine ends up at the N-terminus and the name reads <b>Ala-Ser</b>. Swapping which molecule supplies which group gives Ser-Ala — a different compound, not a different name for this one.',
  note: 'Count the groups left over. The dipeptide still has a free amine at one end and a free carboxyl at the other, which is exactly why the uncontrolled reaction does not stop at a dipeptide, and why a deliberate synthesis has to cap one end of each partner before it starts.',
});

/* ---------------------------------------------------------------- B5 ---
   The two secondary structures, which are three-dimensional objects the
   section names twice and never draws. Both are one interaction arranged
   two ways, and that is only visible side by side. */
FIGURES.push({
  id: 'helix-and-sheet',
  section: 'peptides-proteins',
  anchor: '<b>Quaternary</b> — how two or more separate folded chains assemble. Hemoglobin\'s four subunits are the standard example; not every protein has this level.</li>',
  viewBox: '0 0 680 350',
  alt: 'An alpha helix drawn as a coil with dashed hydrogen bonds running parallel to its axis and side chains projecting outward, beside two antiparallel beta strands with four dashed hydrogen bonds running between them',
  build() {
    let s = '';
    s += panel(24, 52, 308, 220);
    s += panel(348, 52, 308, 220);
    s += tag(178, 38, 'α-helix');
    s += tag(502, 38, 'β-pleated sheet');

    /* The helix as its projection. The cosine term is what makes it read as
       a coil rather than a sine wave: it lifts the near half of each turn
       and drops the far half, which is what a spring looks like on paper. */
    const cx = 150, y0 = 74, span = 176, amp = 46, lift = 14;
    let d = '';
    for (let i = 0; i <= 180; i++) {
      const t = (i / 180) * 6 * Math.PI;
      const x = cx + amp * Math.sin(t), y = y0 + (i / 180) * span - lift * Math.cos(t);
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    s += `<path class="fg-bond" d="${d.trim()}"></path>`;
    // Hydrogen bonds run PARALLEL to the axis, which is the whole geometric
    // claim: the two partners are one turn - four residues - apart.
    for (const [a, b] of [[118, 177], [177, 236]]) {
      s += `<line class="fg-dash-hi" x1="${cx - amp}" y1="${a}" x2="${cx - amp}" y2="${b}"></line>`;
    }
    for (const [a, b] of [[89, 148], [148, 207]]) {
      s += `<line class="fg-dash-hi" x1="${cx + amp}" y1="${a}" x2="${cx + amp}" y2="${b}"></line>`;
    }
    // Side chains, as sticks leaving the coil: they take no part in either
    // pattern, which is why any sequence can form either.
    for (const y of [104, 163, 222]) s += bond(P(cx + amp, y), P(cx + amp + 28, y), { rFrom: 0, rTo: 0 });
    s += tag(108, 292, 'H-bonds run i to i+4');
    s += tag(252, 292, 'side chains point out');

    /* Two antiparallel strands, drawn as the pleats they are named for. */
    const strand = (x1, x2, yMid, down) => {
      let t = '', up = down;
      for (let x = x1; x < x2; x += 30) {
        t += `<line class="fg-bond" x1="${x}" y1="${yMid + (up ? 10 : -10)}" x2="${x + 30}" y2="${yMid + (up ? -10 : 10)}"></line>`;
        up = !up;
      }
      return t;
    };
    s += strand(372, 612, 110, true);
    s += strand(372, 612, 200, false);
    s += arrow(P(612, 100), P(640, 100));
    s += arrow(P(372, 210), P(344, 210));
    for (const x of [402, 462, 522, 582]) {
      s += `<line class="fg-dash-hi" x1="${x}" y1="128" x2="${x}" y2="182"></line>`;
    }
    s += tag(502, 292, 'H-bonds run between strands');

    s += rule(26, 312, 654, 312);
    s += label(340, 336, 'Both are one interaction: a backbone N–H to a backbone C=O.');
    return s;
  },
  caption: 'The two standard secondary structures, side by side. Each dashed line is a hydrogen bond from a backbone N–H to a backbone C=O. In a helix the two partners are four residues apart on the same chain, so the bonds run along the axis; in a sheet they are on neighboring strands, so the bonds run across.',
  note: 'Notice what is dashed and what is solid. Nothing holding either shape together is a covalent bond, which is why heat unfolds a protein without breaking a single bond in the chain — and why the side chains, which take no part in either pattern, are free to decide the fold at the next level up.',
});


/* ---------------------------------------------------------------- B6 ---
   The molecule the lipids section is about, drawn once. The prose
   introduced the triglyceride in a single sentence and the phospholipid in
   another, and a reader who had never seen either could not tell from the
   words that they are the same molecule with one group swapped. */
FIGURES.push({
  id: 'triglyceride-and-phospholipid',
  section: 'lipids',
  anchor: 'it is three Fischer esterifications, and everything an ester does, a triglyceride does.</p>',
  viewBox: '0 0 680 380',
  alt: 'A triglyceride: glycerol carrying three ester groups, the top and bottom chains straight and the middle one kinked by a cis double bond, with an arrow replacing the bottom chain by a phosphate and choline head to give a phospholipid',
  build() {
    let s = '';
    const rows = [90, 176, 262];
    // the three ester groups, shaded, because they are where every reaction
    // in the section happens.
    for (const y of rows) s += bar(128, y - 50, 96, 72, { kind: 'hi', opacity: 0.18 });

    // glycerol: three carbons, one oxygen each.
    s += bond(P(90, rows[0]), P(90, rows[1]), { rFrom: 17, rTo: 15 });
    s += bond(P(90, rows[1]), P(90, rows[2]), { rFrom: 15, rTo: 17 });
    s += atom(90, rows[0], 'CH₂', { r: 17 });
    s += atom(90, rows[1], 'CH');
    s += atom(90, rows[2], 'CH₂', { r: 17 });
    s += text(70, 310, 'glycerol', { cls: 'fg-tag' });
    s += tag(176, 310, 'three ester groups');

    /* A chain as a list of BOND ANGLES in degrees, y down. Consecutive bonds
       differ by 60 degrees, so every vertex — the two sp2 carbons included —
       is drawn at 120 degrees. That matters here because the middle chain's
       geometry is the claim the caption makes, and the version this replaces
       drew its alkene with a 180 degree bond, which reads as trans. */
    const CL = 27;
    const walk = (x, y, angles, dbl) => {
      let t = '', cx = x, cy = y;
      angles.forEach((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const nx = cx + Math.cos(a) * CL, ny = cy + Math.sin(a) * CL;
        t += bond(P(cx, cy), P(nx, ny), i === dbl
          ? { rFrom: 0, rTo: 0, order: 2, gap: 3.4 }
          : { rFrom: 0, rTo: 0 });
        cx = nx; cy = ny;
      });
      return t;
    };

    for (const y of rows) {
      s += bond(P(90, y), P(146, y), { rFrom: 17, rTo: 15 });
      s += bond(P(146, y), P(202, y), { rFrom: 15, rTo: 15 });
      s += bond(P(202, y), P(202, y - 34), { rFrom: 15, rTo: 15, order: 2 });
      s += atom(146, y, 'O');
      s += atom(202, y, 'C', { kind: 'hi' });
      s += atom(202, y - 34, 'O');
    }
    // Top and bottom chains: a plain zigzag, bonds at ±30° about a
    // horizontal axis. The middle one carries a cis double bond on bond 3:
    // the bond after it leaves on the SAME side the chain arrived on, which
    // is what cis means and what tilts the rest of the chain by 60°.
    s += walk(218, rows[0], [-30, 30, -30, 30, -30, 30], -1);
    s += walk(218, rows[2], [-30, 30, -30, 30, -30, 30], -1);
    s += walk(218, rows[1], [30, -30, 30, -30, -90, -30], 3);
    s += text(300, 64, 'saturated', { cls: 'fg-sm' });
    s += text(302, 222, 'one cis double bond', { cls: 'fg-sm' });
    s += text(300, 300, 'saturated', { cls: 'fg-sm' });

    /* one swap, and it is a membrane lipid instead of a fat */
    s += arrow(P(400, rows[2]), P(446, rows[2]));
    s += tag(430, 296, 'replace this chain');
    s += bond(P(470, 262), P(516, 262), { rFrom: 15, rTo: 15 });
    s += bond(P(516, 262), P(562, 262), { rFrom: 15, rTo: 15 });
    s += bond(P(516, 262), P(516, 222), { rFrom: 15, rTo: 15, order: 2 });
    s += bond(P(516, 262), P(516, 302), { rFrom: 15, rTo: 16 });
    s += bond(P(562, 262), P(618, 262), { rFrom: 15, rTo: 26 });
    s += atom(470, 262, 'O');
    s += atom(516, 262, 'P', { kind: 'warn' });
    s += atom(516, 222, 'O');
    s += atom(516, 302, 'O⁻', { r: 16, kind: 'warn' });
    s += atom(562, 262, 'O');
    s += atom(618, 262, 'choline', { r: 26 });
    s += tag(540, 196, 'phosphate + choline head');

    s += rule(20, 336, 660, 336);
    s += label(340, 360, 'One swap out of three, and a storage fat becomes a membrane lipid.');
    return s;
  },
  caption: 'A triglyceride is glycerol wearing three esters, and a phospholipid is the same molecule with one of them exchanged for a charged phosphate. Every <i>reaction</i> in this section happens at the shaded ester groups; everything <i>physical</i> happens out in the chains.',
  note: 'The middle chain is drawn kinked on purpose. A natural fat carries different acids on one backbone, which is why saponifying one gives a mixture of soaps rather than three copies of anything, and why a single fat can be part solid and part oil in its behavior.',
});

/* ---------------------------------------------------------------- B7 ---
   Micelle against bilayer: two spatial objects the section describes in
   words. One tail or two is the entire difference, and it decides the
   shape. */
FIGURES.push({
  id: 'micelle-and-bilayer',
  section: 'lipids',
  anchor: 'That bilayer is the cell membrane, and its existence is a direct consequence of one molecule having a polar end and a nonpolar end.</p>',
  viewBox: '0 0 680 330',
  alt: 'A micelle drawn as single-tailed molecules arranged in a circle with their tails pointing inward around a gray droplet, beside a bilayer drawn as two rows of double-tailed molecules with tails facing each other and heads facing the water',
  build() {
    let s = '';
    s += panel(16, 44, 300, 200);
    s += panel(348, 44, 300, 200);
    s += tag(166, 32, 'one tail → sphere');
    s += tag(498, 32, 'two tails → sheet');

    /* the micelle: heads out, tails in, grease in the middle */
    const cx = 166, cy = 144, R = 78;
    s += `<circle class="fg-fill-mut" cx="${cx}" cy="${cy}" r="30" opacity="0.5"></circle>`;
    s += text(cx, cy + 4, 'oil', { cls: 'fg-sm' });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 2 * Math.PI;
      const ux = Math.cos(a), uy = Math.sin(a);
      s += bond(P(cx + ux * (R - 10), cy + uy * (R - 10)), P(cx + ux * 34, cy + uy * 34), { rFrom: 0, rTo: 0 });
      s += atom(cx + ux * R, cy + uy * R, '', { kind: 'hi', r: 9 });
    }

    /* the bilayer: the same molecules, two tails each, in two rows */
    for (let i = 0; i < 10; i++) {
      const x = 376 + i * 27;
      for (const [hy, dir] of [[98, 1], [190, -1]]) {
        s += atom(x, hy, '', { kind: 'hi', r: 9 });
        s += bond(P(x - 4, hy + dir * 9), P(x - 4, hy + dir * 48), { rFrom: 0, rTo: 0 });
        s += bond(P(x + 4, hy + dir * 9), P(x + 4, hy + dir * 48), { rFrom: 0, rTo: 0 });
      }
    }
    s += text(498, 74, 'water', { cls: 'fg-sm' });
    s += text(498, 222, 'water', { cls: 'fg-sm' });

    s += tag(166, 272, 'micelle — what soap makes');
    s += tag(498, 272, 'bilayer — what a membrane is');
    s += rule(20, 290, 660, 290);
    s += label(340, 314, 'Both structures hide the same thing from the same solvent.');
    return s;
  },
  caption: 'Two ways of hiding a hydrocarbon from water, and the number of tails decides which one forms. One tail tapers to a wedge, and wedges tile a sphere; two tails make a molecule closer to a cylinder, and cylinders tile a flat sheet.',
  note: 'Neither structure involves a new kind of bond. It is the same hydrophobic effect that buries the nonpolar side chains inside a folded protein: the ordering forced on water around a hydrocarbon surface is what is being avoided, so the surfaces are put where the water cannot reach them.',
});


/* ---------------------------------------------------------------- B8 ---
   The base pairs. The section's central claim — that the pairing rules are
   geometry rather than convention — was made in prose beside a table of
   COUNTS, with no geometry anywhere on the page. Everything here is drawn
   atom by atom: the lactam forms of the bases, a Kekule structure that
   satisfies every valence, and hydrogen bonds that run between real donors
   and real acceptors. */
FIGURES.push({
  id: 'base-pairs-drawn',
  section: 'nucleic-acids',
  anchor: 'And because <b>G–C has three hydrogen bonds to A–T\'s two</b>, a GC-rich stretch of DNA takes more energy to separate, which is why GC content predicts melting temperature.</p>',
  viewBox: '0 0 680 392',
  alt: 'Adenine paired with thymine by two hydrogen bonds and guanine paired with cytosine by three, each pair drawn as a purine and a pyrimidine with their glycosidic bonds pointing outward and the two pairs spanning the same width',
  build() {
    let s = '';
    const hex = (cx, cy, r, k) => P(cx + r * Math.cos(k * Math.PI / 3), cy + r * Math.sin(k * Math.PI / 3));

    /* One pair. `g` true draws guanine-cytosine, false adenine-thymine;
       both use the same skeleton, so the two pairs come out the same width
       by construction, which is the claim the figure is making. */
    const pairAt = (dx, g) => {
      const P2 = (p) => P(p.x + dx, p.y);
      let t = '';
      /* ---- pyrimidine on the left: N1 C2 N3 C4 C5 C6 ---- */
      const py = (k) => P2(hex(110, 196, 34, k));
      const N1 = py(2), C2 = py(1), N3 = py(0), C4 = py(5), C5 = py(4), C6 = py(3);
      const O2 = P2(P(141, 249)), X4 = P2(P(141, 143)), Me = P2(P(79, 143));
      const pyc = P2(P(110, 196));
      t += bond(N1, C2, { rFrom: 15, rTo: 0 });
      t += bond(C2, N3, { rFrom: 0, rTo: g ? 15 : 17 });
      t += bond(C2, O2, { rFrom: 0, rTo: 15, order: 2 });
      t += g ? ringDouble(N3, C4, pyc) : bond(N3, C4, { rFrom: 17, rTo: 0 });
      t += bond(C4, X4, { rFrom: 0, rTo: g ? 18 : 15, order: g ? 1 : 2 });
      t += bond(C4, C5, { rFrom: 0, rTo: 0 });
      t += ringDouble(C5, C6, pyc);
      t += bond(C6, N1, { rFrom: 0, rTo: 15 });
      if (!g) t += bond(C5, Me, { rFrom: 0, rTo: 17 });
      t += atom(N1.x, N1.y, 'N');
      t += atom(N3.x, N3.y, g ? 'N' : 'NH', { r: g ? 15 : 17 });
      t += atom(O2.x, O2.y, 'O');
      t += atom(X4.x, X4.y, g ? 'NH₂' : 'O', { r: g ? 18 : 15 });
      if (!g) t += atom(Me.x, Me.y, 'CH₃', { r: 17 });
      // the bond to the sugar, which is what makes this a nucleoside
      const sug1 = P2(P(73, 260));
      t += bond(N1, sug1, { rFrom: 15, rTo: 0 });
      t += text(sug1.x - 10, sug1.y + 16, 'to sugar', { cls: 'fg-sm' });

      /* ---- purine on the right: six-ring N1 C2 N3 C4 C5 C6 ---- */
      const pu = (k) => P2(hex(250, 196, 34, k));
      const n1 = pu(3), c6 = pu(4), c5 = pu(5), c4 = pu(0), n3 = pu(1), c2 = pu(2);
      const X6 = P2(P(219, 143)), X2 = P2(P(219, 249));
      // the fused five-ring, placed on the C4-C5 edge
      const puc = P2(P(250, 196));
      const mid = P((c4.x + c5.x) / 2, (c4.y + c5.y) / 2);
      const ex = c4.x - c5.x, ey = c4.y - c5.y, el = Math.hypot(ex, ey);
      // outward normal: the perpendicular that points AWAY from the
      // six-ring, which is the half of this the first draft got wrong -
      // the pentagon fused inward and N7 landed on top of C4.
      let nx = -ey / el, ny = ex / el;
      if ((mid.x - puc.x) * nx + (mid.y - puc.y) * ny < 0) { nx = -nx; ny = -ny; }
      const pc = P(mid.x + nx * (el / (2 * Math.tan(Math.PI / 5))),
                   mid.y + ny * (el / (2 * Math.tan(Math.PI / 5))));
      const R5 = el / (2 * Math.sin(Math.PI / 5));
      const a5 = Math.atan2(c5.y - pc.y, c5.x - pc.x);
      const p5 = (j) => P(pc.x + R5 * Math.cos(a5 + j * 2 * Math.PI / 5),
                          pc.y + R5 * Math.sin(a5 + j * 2 * Math.PI / 5));
      const n7 = p5(1), c8 = p5(2), n9 = p5(3);

      t += g ? bond(n1, c6, { rFrom: 17, rTo: 0 }) : ringDouble(n1, c6, puc);
      t += bond(c6, c5, { rFrom: 0, rTo: 0 });
      t += ringDouble(c5, c4, puc);
      t += bond(c4, n3, { rFrom: 0, rTo: 15 });
      t += ringDouble(n3, c2, puc);
      t += bond(c2, n1, { rFrom: 0, rTo: g ? 17 : 15 });
      t += bond(c6, X6, { rFrom: 0, rTo: g ? 15 : 18, order: g ? 2 : 1 });
      if (g) t += bond(c2, X2, { rFrom: 0, rTo: 18 });
      t += bond(c5, n7, { rFrom: 0, rTo: 15 });
      t += ringDouble(n7, c8, pc);
      t += bond(c8, n9, { rFrom: 0, rTo: 15 });
      t += bond(n9, c4, { rFrom: 15, rTo: 0 });
      t += atom(n1.x, n1.y, g ? 'NH' : 'N', { r: g ? 17 : 15 });
      t += atom(n3.x, n3.y, 'N');
      t += atom(n7.x, n7.y, 'N');
      t += atom(n9.x, n9.y, 'N');
      t += atom(X6.x, X6.y, g ? 'O' : 'NH₂', { r: g ? 15 : 18 });
      if (g) t += atom(X2.x, X2.y, 'NH₂', { r: 18 });
      const sug2 = P(n9.x + 18, n9.y + 26);
      t += bond(n9, sug2, { rFrom: 15, rTo: 0 });
      t += text(n9.x - 4, n9.y + 48, 'to sugar', { cls: 'fg-sm' });

      /* ---- and the hydrogen bonds, donor to acceptor ---- */
      const hb = (a, b, ra, rb) => `<line class="fg-dash-hi" x1="${(a.x + ra).toFixed(1)}" y1="${a.y}" x2="${(b.x - rb).toFixed(1)}" y2="${b.y}"></line>`;
      t += hb(X4, X6, g ? 18 : 15, g ? 15 : 18);
      t += hb(N3, n1, g ? 15 : 17, g ? 17 : 15);
      if (g) t += hb(O2, X2, 15, 18);
      return t;
    };

    s += panel(8, 44, 332, 256);
    s += panel(348, 44, 324, 256);
    s += tag(174, 32, 'A–T · two hydrogen bonds');
    s += tag(510, 32, 'G–C · three hydrogen bonds');
    s += pairAt(0, false);
    s += pairAt(318, true);

    // the width both pairs share, measured between the two sugar bonds
    for (const [x1, x2] of [[73, 340], [391, 658]]) {
      s += rule(x1, 316, x2, 316);
      s += rule(x1, 310, x1, 322);
      s += rule(x2, 310, x2, 322);
    }
    s += tag(206, 338, 'same width');
    s += tag(524, 338, 'same width');
    s += rule(20, 354, 660, 354);
    s += label(340, 378, 'Every rung is one purine plus one pyrimidine, so every rung is the same width.');
    return s;
  },
  caption: 'The two pairs drawn out. Each dashed line joins a hydrogen-bond <b>donor</b> on one base to an <b>acceptor</b> on the other: A and T can line up two such partners, G and C three. The glycosidic bonds point outward to the backbones, and the two pairs span the same distance between them.',
  note: 'Try pairing A with G on paper. Two fused ring systems are far too wide to span the gap, and their donors end up facing donors — the rule fails twice over at once, which is why it never has to be memorized. The bases are drawn in their lactam (C=O, N–H) forms, which is the form that makes these donors and acceptors the ones they are.',
});


/* ---------------------------------------------------------------- B9 ---
   One nucleotide, with its sugar actually drawn. The section asserts 3'
   and 5' numbering, an N-glycoside at C1' and a phosphate ester at C5'
   without ever showing the ring those primes are counted round. */
FIGURES.push({
  id: 'nucleotide-drawn',
  section: 'nucleic-acids',
  anchor: 'The sugar is the difference between the two polymers. <b>RNA</b> uses <b>ribose</b>; <b>DNA</b> uses <b>2-deoxyribose</b>, which is ribose missing the OH at C2 — which is exactly what "deoxy" is saying.</p>',
  viewBox: '0 0 700 380',
  alt: 'A deoxyribose furanose ring drawn edge-on with the ring oxygen at the back, an N-glycosidic bond from C1 prime to the base, H at C2 prime with a ghosted OH marked RNA only, a free OH at C3 prime and a 5 prime CH2 joined through an oxygen to a phosphate',
  build() {
    let s = '';
    const O4 = P(300, 150), C1 = P(366, 180), C2 = P(340, 236), C3 = P(262, 236), C4 = P(236, 180);
    // front edge heavy: the furanose is drawn edge-on, same convention as
    // the pyranose in the carbohydrates section.
    s += bond(C3, C2, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(C4, C3, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(C2, C1, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(C4, O4, { rFrom: 0, rTo: 15 });
    s += bond(C1, O4, { rFrom: 0, rTo: 15 });
    s += atom(O4.x, O4.y, 'O');

    // C1' to the base: an N-glycoside at the anomeric carbon
    s += bond(C1, P(424, 150), { rFrom: 0, rTo: 15 });
    s += atom(424, 150, 'N', { kind: 'hi' });
    s += bond(P(424, 150), P(462, 150), { rFrom: 15, rTo: 0 });
    s += panel(462, 124, 116, 52, { kind: 'hi' });
    s += text(520, 155, 'adenine', { cls: 'fg-lbl' });
    s += tag(520, 110, 'N-glycoside at N9');

    // C2': H in DNA, and the OH that RNA keeps
    s += bond(C2, P(340, 290), { rFrom: 0, rTo: 15 });
    s += atom(340, 290, 'H');
    s += bond(C2, P(398, 268), { rFrom: 0, rTo: 15, cls: 'fg-bond-soft' });
    s += text(398, 272, 'OH', { cls: 'fg-sm' });
    s += tag(408, 298, 'RNA only', { cls: 'fg-tag-mut' });

    // C3': the free hydroxyl the next nucleotide is joined to
    s += bond(C3, P(262, 290), { rFrom: 0, rTo: 16 });
    s += atom(262, 290, 'OH', { r: 16, kind: 'warn' });
    s += tag(148, 250, 'next unit joins here');

    // C5': CH2 out to the phosphate ester
    s += bond(C4, P(196, 140), { rFrom: 0, rTo: 17 });
    s += atom(196, 140, 'CH₂', { r: 17 });
    s += bond(P(196, 140), P(150, 116), { rFrom: 17, rTo: 15 });
    s += atom(150, 116, 'O');
    s += bond(P(150, 116), P(90, 92), { rFrom: 15, rTo: 24 });
    s += atom(90, 92, 'PO₃²⁻', { r: 24, kind: 'warn' });
    s += tag(120, 56, 'phosphate ester');

    for (const [x, y, n] of [[390, 196, '1′'], [364, 262, '2′'], [238, 262, '3′'],
      [212, 196, '4′'], [172, 168, '5′']]) s += text(x, y, n, { cls: 'fg-sm' });

    s += rule(220, 320, 580, 320);
    s += label(400, 340, 'nucleoside = sugar + base');
    s += rule(64, 352, 580, 352);
    s += label(322, 372, 'nucleotide = nucleoside + the 5′ phosphate');
    return s;
  },
  caption: 'One nucleotide, drawn out. Two of its three links are reactions already in hand — an <b>N-glycoside</b> at C1′, which is the anomeric carbon of the sugar, and a <b>phosphate ester</b> at C5′ — and the free OH at C3′ is where the next unit is joined, which is what makes the chain run 5′ to 3′.',
  note: 'The primes are the whole reason for the numbering: the base has numbered atoms of its own, so the sugar\'s carbons are primed to keep the two sets apart. C2′ is where the two polymers differ, and it is drawn here as the H of deoxyribose with ribose\'s OH ghosted beside it.',
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

/* ---------------------------------------------------------------- C4 ---
   The acetylide does an S_N2, and three bank items test it, and nothing in
   the chapter draws a backside attack. The second panel is the limit: the
   same reagent on a secondary halide is a base. */
FIGURES.push({
  id: 'acetylide-substitutes-or-eliminates',
  section: 'organolithium-reagents',
  anchor: 'With a secondary or tertiary halide the acetylide is basic enough that E2 wins and you get an alkene instead of the coupled product. Primary or methyl only.</div>',
  viewBox: '0 0 700 466',
  alt: 'An acetylide attacking bromoethane from the side opposite bromine to give pent-2-yne, and the same acetylide instead removing a beta hydrogen from 2-bromopropane to give propene by E2',
  build() {
    let s = '';
    const acetylide = (x, y) => {
      let t = '';
      t += bond(P(x, y), P(x + 48, y), { rFrom: 17, rTo: 15 });
      t += bond(P(x + 48, y), P(x + 96, y), { order: 3, gap: 3.6, rFrom: 15, rTo: 15 });
      t += atom(x, y, 'CH₃', { r: 17 });
      t += atom(x + 48, y, 'C');
      t += atom(x + 96, y, 'C', { kind: 'hi' });
      t += text(x + 116, y - 12, '⊖', { cls: 'fg-lbl', size: 13 });
      t += lonePair(x + 96, y, 60);
      return t;
    };

    /* Substitution. */
    s += panel(24, 44, 652, 170);
    s += acetylide(80, 110);
    s += bond(P(300, 110), P(300, 158), { rFrom: 16, rTo: 17 });
    s += bond(P(300, 110), P(356, 110), { rFrom: 16, rTo: 15 });
    s += atom(300, 158, 'CH₃', { r: 17 });
    s += atom(356, 110, 'Br', { kind: 'warn' });
    s += atom(300, 110, 'CH₂', { kind: 'warn', r: 17 });
    s += curve(P(192, 124), P(278, 116), { bow: 22 });
    s += curve(P(334, 118), P(374, 140), { bow: -18 });
    s += arrow(P(420, 110), P(470, 110));
    s += label(566, 106, 'CH₃C≡C–CH₂CH₃');
    s += tag(566, 140, 'pent-2-yne, the product you wanted');
    s += text(130, 190, 'primary halide: substitution', { cls: 'fg-tag-good', size: 11 });

    /* Elimination. */
    s += panel(24, 232, 652, 170);
    s += acetylide(80, 298);
    s += bond(P(300, 300), P(352, 274), { rFrom: 16, rTo: 15 });
    s += bond(P(300, 300), P(300, 352), { rFrom: 16, rTo: 17 });
    s += bond(P(300, 300), P(248, 274), { rFrom: 16, rTo: 17 });
    s += bond(P(248, 274), P(206, 252), { rFrom: 17, rTo: 15 });
    s += atom(352, 274, 'Br', { kind: 'warn' });
    s += atom(300, 352, 'CH₃', { r: 17 });
    s += atom(248, 274, 'CH₂', { r: 17 });
    s += atom(206, 252, 'H', { kind: 'warn' });
    s += atom(300, 300, 'C', { kind: 'warn' });
    s += curve(P(192, 292), P(194, 266), { bow: -20 });
    s += curve(P(222, 258), P(268, 280), { bow: -20 });
    s += curve(P(322, 286), P(376, 250), { bow: 20 });
    s += arrow(P(420, 300), P(470, 300));
    s += label(552, 296, 'CH₃CH=CH₂  +  CH₃C≡CH');
    s += tag(552, 330, 'propene, and your alkyne back');
    s += text(130, 378, 'secondary halide: elimination', { cls: 'fg-tag-warn', size: 11 });

    s += rule(20, 420, 680, 420);
    s += label(350, 444, 'What the halide is decides which of the two roles the acetylide plays.');
    return s;
  },
  caption: 'An acetylide is a nucleophile and a strong base in the same molecule, and the halide decides which one it gets to be. On a primary carbon the backside is open and substitution wins; on a secondary carbon it is crowded, so the reagent takes a &beta; hydrogen instead and you isolate an alkene.',
  note: 'Notice where the arrow starts in each panel. In the top one it leaves the carbanion and arrives at <i>carbon</i>, opposite the leaving group; in the bottom one it leaves the same carbanion and arrives at a <b>hydrogen</b> two bonds away from the halide. Same reagent, same lone pair, different target &mdash; which is the whole of the substitution-versus-elimination question, met again with a carbon base.',
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

/* ---------------------------------------------------------------- C6 ---
   The one mechanism in the section that differs from the shared cycle, and
   the only one whose steps are geometric. Migratory insertion and syn
   beta-hydride elimination are both claims about WHICH FACE, which a
   sentence cannot make and a drawing can. */
FIGURES.push({
  id: 'heck-in-four',
  section: 'cross-coupling',
  anchor: 'So the Heck needs a full stoichiometric equivalent of base even though nothing in the substrate is ever deprotonated, and the by-product is the ammonium or carbonate salt. Track the oxidation states and the cycle only closes because of that last step.</p>',
  viewBox: '0 0 700 486',
  alt: 'Four frames of the Heck reaction: the alkene coordinating to an aryl palladium halide, migratory insertion putting the aryl group and the palladium on adjacent carbons, beta-hydride elimination giving the trans alkene and a palladium hydride, and the base removing HX to return palladium zero',
  build() {
    let s = '';

    /* 1 — coordination. */
    s += bond(P(80, 110), P(140, 110), { rFrom: 16, rTo: 16 });
    s += bond(P(140, 110), P(200, 110), { rFrom: 16, rTo: 15 });
    s += atom(80, 110, 'Ar', { kind: 'hi' });
    s += atom(140, 110, 'Pd', { kind: 'warn', r: 16 });
    s += atom(200, 110, 'X');
    s += text(140, 82, 'II', { cls: 'fg-sm', size: 10 });
    s += bond(P(262, 148), P(314, 148), { order: 2, rFrom: 17, rTo: 16 });
    s += bond(P(314, 148), P(352, 124), { rFrom: 16, rTo: 15 });
    s += atom(262, 148, 'CH₂', { r: 17 });
    s += atom(314, 148, 'CH', { r: 16 });
    s += atom(352, 124, 'R');
    s += `<line class="fg-dash-hi" x1="152" y1="124" x2="250" y2="146"></line>`;
    s += tag(196, 190, '1 · the alkene coordinates');

    /* 2 — migratory insertion. */
    s += bond(P(398, 104), P(450, 104), { rFrom: 16, rTo: 17 });
    s += bond(P(450, 104), P(502, 104), { rFrom: 17, rTo: 16 });
    s += bond(P(502, 104), P(554, 104), { rFrom: 16, rTo: 15 });
    s += bond(P(502, 104), P(502, 152), { rFrom: 16, rTo: 16 });
    s += bond(P(502, 152), P(554, 178), { rFrom: 16, rTo: 15 });
    s += atom(398, 104, 'Ar', { kind: 'hi' });
    s += atom(450, 104, 'CH₂', { r: 17 });
    s += atom(502, 104, 'CH', { r: 16 });
    s += atom(554, 104, 'R');
    s += atom(502, 152, 'Pd', { kind: 'warn', r: 16 });
    s += text(528, 144, 'II', { cls: 'fg-sm', size: 10 });
    s += atom(554, 178, 'X');
    s += tag(480, 214, '2 · migratory insertion, same face');

    s += rule(20, 240, 680, 240);

    /* 3 — syn beta-hydride elimination. */
    s += bond(P(70, 300), P(122, 300), { rFrom: 16, rTo: 15 });
    s += bond(P(122, 300), P(122, 254), { rFrom: 15, rTo: 15 });
    s += bond(P(122, 300), P(174, 300), { rFrom: 15, rTo: 15 });
    s += bond(P(174, 300), P(226, 300), { rFrom: 15, rTo: 15 });
    s += bond(P(174, 300), P(174, 348), { rFrom: 15, rTo: 16 });
    s += bond(P(174, 348), P(226, 374), { rFrom: 16, rTo: 15 });
    s += atom(70, 300, 'Ar', { kind: 'hi' });
    s += atom(122, 254, 'H', { kind: 'warn' });
    s += atom(122, 300, 'C');
    s += atom(174, 300, 'C');
    s += atom(226, 300, 'R');
    s += atom(174, 348, 'Pd', { kind: 'warn', r: 16 });
    s += text(150, 366, 'II', { cls: 'fg-sm', size: 10 });
    s += atom(226, 374, 'X');
    s += curve(P(134, 272), P(164, 332), { bow: -32 });
    s += curve(P(196, 336), P(150, 308), { bow: -22 });
    s += tag(150, 412, '3 · β-hydride elimination');

    /* 4 — and the base closes the cycle. */
    s += bond(P(400, 320), P(446, 296), { rFrom: 15, rTo: 0 });
    s += bond(P(446, 296), P(492, 320), { order: 2, rFrom: 0, rTo: 0, gap: 4 });
    s += bond(P(492, 320), P(538, 296), { rFrom: 0, rTo: 15 });
    s += atom(400, 320, 'Ar', { kind: 'hi' });
    s += atom(538, 296, 'R');
    s += tag(470, 264, 'trans, as drawn');
    s += bond(P(432, 374), P(478, 374), { rFrom: 15, rTo: 16 });
    s += bond(P(478, 374), P(524, 374), { rFrom: 16, rTo: 15 });
    s += atom(432, 374, 'H');
    s += atom(478, 374, 'Pd', { kind: 'warn', r: 16 });
    s += text(478, 346, 'II', { cls: 'fg-sm', size: 10 });
    s += atom(524, 374, 'X');
    s += arrow(P(556, 374), P(598, 374));
    s += tag(577, 356, '+ base');
    s += atom(640, 374, 'Pd(0)', { kind: 'hi', r: 22 });
    s += tag(480, 412, '4 · the base takes HX, and Pd(0) is back');

    s += rule(20, 440, 680, 440);
    s += label(350, 462, 'No transmetalation: the Heck inserts, then eliminates.');
    s += label(350, 482, 'The base is what closes the cycle, so it is needed in full.');
    return s;
  },
  caption: 'The Heck, step by step. There is no organometallic partner, so there is nothing to transmetalate: the alkene binds to the metal, <b>migratory insertion</b> puts Ar and Pd on adjacent carbons and on the same face, and <b>&beta;-hydride elimination</b> then hands the product back as an alkene.',
  note: 'Frame 4 is the one most summaries leave out, and without it the cycle does not balance. What comes off the elimination is H&ndash;Pd(II)&ndash;X, not Pd(0), so the catalyst is not yet regenerated &mdash; a stoichiometric base has to strip HX from it first. That is why a Heck needs a full equivalent of triethylamine or carbonate although nothing in the substrate is ever deprotonated.',
});

/* ---------------------------------------------------------------- C7 ---
   The Suzuki is called "the one to know properly" and then never appears as
   a structure. This is the worked example in the prose, drawn. */
FIGURES.push({
  id: 'suzuki-drawn',
  section: 'cross-coupling',
  anchor: 'The base is not optional: it converts the boronic acid to a borate, which is what transfers the R group in the transmetalation step.</p>',
  viewBox: '0 0 700 426',
  alt: 'Four-prime-bromoacetophenone and phenylboronic acid reacting under palladium tetrakis and aqueous sodium carbonate to give 4-acetylbiphenyl, with the ketone shaded to show it is untouched',
  build() {
    let s = '';
    const hex = (cx, cy) => [
      P(cx + 30, cy), P(cx + 15, cy + 26), P(cx - 15, cy + 26),
      P(cx - 30, cy), P(cx - 15, cy - 26), P(cx + 15, cy - 26),
    ];
    const ringAt = (cx, cy) => {
      const v = hex(cx, cy);
      let t = '';
      for (let i = 0; i < 6; i++) t += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0, order: i % 2 ? 2 : 1, gap: 4 });
      return { svg: t, v };
    };

    /* reactants */
    const a = ringAt(170, 110); s += a.svg;
    s += bond(a.v[3], P(110, 110), { rFrom: 0, rTo: 15 });
    s += atom(110, 110, 'Br', { kind: 'warn' });
    s += bar(198, 66, 92, 92, { kind: 'hi', opacity: 0.18 });
    s += bond(a.v[0], P(230, 110), { rFrom: 0, rTo: 16 });
    s += bond(P(230, 110), P(230, 70), { order: 2, rFrom: 16, rTo: 15 });
    s += bond(P(230, 110), P(266, 134), { rFrom: 16, rTo: 17 });
    s += atom(230, 70, 'O');
    s += atom(266, 134, 'CH₃', { r: 17 });
    s += atom(230, 110, 'C');
    s += label(330, 114, '+');
    const b = ringAt(420, 110); s += b.svg;
    s += bond(b.v[0], P(500, 110), { rFrom: 0, rTo: 30 });
    s += atom(500, 110, 'B(OH)₂', { kind: 'hi', r: 30 });
    s += tag(170, 184, '4′-bromoacetophenone');
    s += tag(450, 184, 'phenylboronic acid');

    s += arrow(P(300, 208), P(300, 240));
    s += tag(390, 216, 'Pd(PPh₃)₄, Na₂CO₃ (aq), heat');

    /* product */
    s += bar(96, 244, 96, 80, { kind: 'hi', opacity: 0.18 });
    const c = ringAt(216, 290); s += c.svg;
    const d = ringAt(306, 290); s += d.svg;
    s += bond(c.v[0], d.v[3], { rFrom: 0, rTo: 0 });
    s += bond(c.v[3], P(146, 290), { rFrom: 0, rTo: 16 });
    s += bond(P(146, 290), P(146, 250), { order: 2, rFrom: 16, rTo: 15 });
    s += bond(P(146, 290), P(110, 314), { rFrom: 16, rTo: 17 });
    s += atom(146, 250, 'O');
    s += atom(110, 314, 'CH₃', { r: 17 });
    s += atom(146, 290, 'C');
    s += text(275, 250, 'the bond palladium made', { cls: 'fg-tag-good', size: 11 });
    s += tag(216, 360, '4-acetylbiphenyl — the ketone never reacted');

    s += rule(20, 382, 680, 382);
    s += label(350, 406, 'A ketone sits in the flask throughout, and nothing happens to it.');
    return s;
  },
  caption: 'The Suzuki as a real equation. The aryl <b>bromide</b> is what palladium inserts into; the carbonate makes the four-coordinate borate that hands its phenyl over; the two rings then join and the metal is released as Pd(0).',
  note: 'Look at what is shaded. A phenyl Grignard put into this flask would add to that ketone and give you a tertiary alcohol, and you would have to protect it first. The boronic acid does not, because its aryl group is bound to boron and then to palladium for its whole life and is never a free carbanion — which is the tolerance argument stated as a picture rather than a claim.',
});





/* ---------------------------------------------------------------- B5 ---
   The Criegee intermediate is named four times in the section and drawn
   nowhere, and the whole reaction is in its collapse: three arrows at once,
   and a group that changes which atom it is bonded to without being free. */
FIGURES.push({
  id: 'criegee-collapse',
  section: 'baeyer-villiger',
  anchor: 'running here on a neutral intermediate.</p>',
  viewBox: '0 0 760 498',
  alt: 'The Baeyer-Villiger mechanism with curved arrows: the peroxyacid adding to the protonated ketone, the Criegee intermediate with its weak oxygen-oxygen bond and the migrating group drawn anti-periplanar to it, and the concerted collapse that inserts the oxygen and releases the carboxylic acid',
  build() {
    let s = '';

    /* 1 — addition. */
    s += tag(132, 36, '1 · the peroxyacid adds');
    s += panel(14, 44, 236, 248);
    {
      const C = P(96, 160), O = P(96, 108), R = P(48, 194), R2 = P(146, 194);
      s += bond(C, O, { order: 2, rFrom: 14, rTo: 18 });
      s += bond(C, R, { rFrom: 14, rTo: 13 });
      s += bond(C, R2, { rFrom: 14, rTo: 16 });
      s += atom(O.x, O.y, 'OH⁺', { kind: 'warn', r: 18, size: 10 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += atom(R2.x, R2.y, 'R′', { r: 16, size: 10.5 });
      s += atom(200, 128, 'O–H', { kind: 'hi', r: 20, size: 10 });
      s += atom(200, 184, 'O', { r: 14 });
      s += bond(P(200, 128), P(200, 184), { rFrom: 20, rTo: 14 });
      s += text(200, 216, '– C(=O)Ar', { cls: 'fg-sm', size: 10.5 });
      s += lonePair(200, 128, 200);
      s += curve(P(174, 138), P(120, 150), { bow: -14 });
      s += curve(P(108, 140), P(106, 122), { bow: -10 });
      s += text(132, 244, 'the terminal O attacks —', { cls: 'fg-sm', size: 10.5 });
      s += text(132, 264, 'the OH end, not the acyl end', { cls: 'fg-sm', size: 10.5 });
      s += text(132, 286, 'the ketone is protonated first', { cls: 'fg-tag', size: 11 });
    }

    /* 2 — the Criegee intermediate. */
    s += tag(380, 36, '2 · the Criegee intermediate');
    s += panel(262, 44, 236, 248);
    {
      /* The O–O is drawn folding back over the top so that R′ and the far
         oxygen end up on opposite sides of the C–O axis: that trans zig-zag
         IS the anti-periplanar arrangement the caption claims, rather than
         two groups sitting side by side with a label asserting otherwise. */
      const C = P(366, 160), OH = P(366, 108), R = P(312, 200), Rp = P(420, 200), O1 = P(432, 128), O2 = P(410, 86);
      s += bond(C, OH, { rFrom: 14, rTo: 16 });
      s += bond(C, R, { rFrom: 14, rTo: 13 });
      s += bond(C, Rp, { rFrom: 14, rTo: 16, cls: 'fg-bond-hi' });
      s += bond(C, O1, { rFrom: 14, rTo: 14 });
      s += bond(O1, O2, { rFrom: 14, rTo: 14, cls: 'fg-bond-hi' });
      s += atom(OH.x, OH.y, 'OH', { r: 16, size: 10.5 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += atom(Rp.x, Rp.y, 'R′', { kind: 'hi', r: 16, size: 10.5 });
      s += atom(O1.x, O1.y, 'O');
      s += atom(O2.x, O2.y, 'O', { kind: 'warn' });
      s += text(472, 116, 'weak', { cls: 'fg-tag-warn', size: 11 });
      s += `<line class="fg-dash-hi" x1="414" y1="184" x2="412" y2="112"></line>`;
      s += text(380, 240, 'R′ sits anti to the O–O bond,', { cls: 'fg-sm', size: 10.5 });
      s += text(380, 260, 'so R′ is the one that can move', { cls: 'fg-sm', size: 10.5 });
      s += text(380, 282, 'ArCO₂ is the leaving group', { cls: 'fg-tag', size: 11 });
    }

    /* 3 — the concerted collapse. */
    s += tag(620, 36, '3 · three arrows at once');
    s += panel(510, 44, 236, 248);
    {
      const C = P(596, 160), OH = P(596, 108), R = P(548, 200), Rp = P(650, 196), O1 = P(660, 132), O2 = P(638, 86);
      s += bond(C, OH, { rFrom: 14, rTo: 16 });
      s += bond(C, R, { rFrom: 14, rTo: 13 });
      s += bond(C, Rp, { rFrom: 14, rTo: 16, cls: 'fg-bond-hi' });
      s += bond(C, O1, { rFrom: 14, rTo: 14 });
      s += bond(O1, O2, { rFrom: 14, rTo: 14, cls: 'fg-bond-hi' });
      s += atom(OH.x, OH.y, 'OH', { r: 16, size: 10.5 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(R.x, R.y, 'R', { r: 13 });
      s += atom(Rp.x, Rp.y, 'R′', { kind: 'hi', r: 16, size: 10.5 });
      s += atom(O1.x, O1.y, 'O');
      s += atom(O2.x, O2.y, 'O', { kind: 'warn' });
      s += curve(P(582, 122), P(582, 144), { bow: -10 });
      s += curve(P(626, 180), P(646, 148), { bow: 14 });
      s += curve(P(640, 114), P(616, 90), { bow: -14 });
      s += text(614, 240, 'the OH makes the new C=O,', { cls: 'fg-sm', size: 10.5 });
      s += text(614, 260, 'R′ swings onto the near O,', { cls: 'fg-sm', size: 10.5 });
      s += text(614, 280, 'and the O–O breaks as it goes', { cls: 'fg-sm', size: 10.5 });
    }

    /* the products, and retention. */
    s += rule(24, 316, 736, 316);
    s += tag(196, 344, 'the products');
    s += panel(14, 356, 356, 96);
    s += text(192, 390, 'R–C(=O)–O–R′   the ester', { cls: 'fg-lbl', size: 13 });
    s += text(192, 414, 'the inserted oxygen sits between them', { cls: 'fg-sm', size: 10.5 });
    s += text(192, 438, '+  Ar–CO₂H, the acid left over', { cls: 'fg-tag', size: 11 });
    s += tag(568, 344, 'and at the migrating carbon');
    s += panel(390, 356, 356, 96);
    {
      const A = P(470, 402), B = P(640, 402);
      s += atom(A.x, A.y, 'C');
      s += wedge(A, P(446, 374), { rFrom: 14, rTo: 0 });
      s += hash(A, P(494, 374), { rFrom: 14, rTo: 0 });
      s += bond(A, P(470, 436), { rFrom: 14, rTo: 0 });
      s += arrow(P(520, 402), P(570, 402));
      s += atom(B.x, B.y, 'C');
      s += wedge(B, P(616, 374), { rFrom: 14, rTo: 0 });
      s += hash(B, P(664, 374), { rFrom: 14, rTo: 0 });
      s += bond(B, P(640, 436), { rFrom: 14, rTo: 0 });
      s += text(545, 380, 'retention', { cls: 'fg-tag-good', size: 11 });
    }
    s += label(380, 482, 'Nothing at the migrating carbon ever breaks, so nothing about it can change.');
    return s;
  },
  caption: 'One addition and one concerted collapse. Everything interesting is in the third panel, where three pairs of electrons move at once: the OH oxygen pushes down to make the new C=O, the C&ndash;R&prime; bond swings over onto the near oxygen of the O&ndash;O, and the O&ndash;O breaks onto the departing carboxylate.',
  note: 'Compare the third panel with a 1,2-shift in a carbocation rearrangement. There the electron sink is an empty p orbital on the neighboring carbon; here it is the &sigma;* orbital of the O&ndash;O bond. Same motion, same retention at the migrating carbon, a different hole for it to fall into &mdash; and one extra condition, because &sigma; overlap needs the migrating group lined up <i>anti</i> to the O&ndash;O bond, which is what a rigid ring can occasionally prevent.',
});


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

/* The single most important missing picture in the chapter: the notes assert
   three times that the charge lands ortho and para and runs onto the nitro
   oxygens, and never show it. */
FIGURES.push({
  id: 'meisenheimer',
  section: 'nucleophilic-aromatic',
  anchor: 'the nitro groups pay for it by delocalizing the negative charge onto their own oxygens.</div>',
  alt: 'Four drawn frames. First, 1-chloro-2,4-dinitrobenzene with methoxide and a curved arrow from the methoxide oxygen to the carbon bearing the chlorine. Second, the Meisenheimer complex: the top carbon now sp3 carrying both OCH3 and Cl, only two carbon-carbon double bonds left in the ring, and a minus sign on the para carbon. Third, the same complex with two curved arrows moving that charge out onto an oxygen of the para nitro group. Fourth, the aromatic product with OCH3 where the chlorine was, both nitro groups still in place, plus chloride.',
  viewBox: '0 0 760 580',
  build() {
    const R = 40, K = hexKit(R);
    let s = '';
    s += tag(380, 26, 'ADDITION FIRST, ELIMINATION SECOND — DRAWN');

    /* Frame 1: the substrate and the attack. */
    const c1 = P(200, 150);
    s += K.ring(c1.x, c1.y, [0, 2, 4]);
    s += K.sub(c1.x, c1.y, 0, 'Cl', { r: 15 });
    s += K.sub(c1.x, c1.y, 1, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    s += K.sub(c1.x, c1.y, 3, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    s += atom(62, 96, 'CH₃O', { kind: 'hi', r: 21, size: 9.5 });
    s += text(86, 80, '−', { cls: 'fg-warn', size: 15 });
    s += lonePair(62, 96, 20, { dist: 27 });
    s += lonePair(62, 96, 340, { dist: 27 });
    s += curve(P(86, 104), P(176, 104), { bow: 26 });
    s += text(200, 262, 'attack at the carbon carrying the halide', { cls: 'fg-tag', size: 11 });

    s += arrow(P(306, 150), P(392, 150));
    s += text(349, 138, 'slow', { cls: 'fg-sm', size: 10.5 });

    /* Frame 2: the Meisenheimer complex. */
    const c2 = P(520, 150);
    s += K.ring(c2.x, c2.y, [1, 4]);
    s += wedge(K.V(c2.x, c2.y)[0], P(490, 80), { rFrom: 0, rTo: 19 });
    s += atom(490, 80, 'OCH₃', { kind: 'hi', r: 19, size: 9 });
    s += hash(K.V(c2.x, c2.y)[0], P(554, 84), { rFrom: 0, rTo: 14 });
    s += atom(554, 84, 'Cl', { r: 14, size: 11 });
    s += K.sub(c2.x, c2.y, 1, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    s += K.sub(c2.x, c2.y, 3, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    s += K.mark(c2.x, c2.y, 5, '−', { d: 20, size: 17 });
    s += text(520, 262, 'aromaticity gone — the anion is the price', { cls: 'fg-tag', size: 11 });
    s += text(596, 176, 'meta: no charge', { cls: 'fg-tag-mut', size: 10, anchor: 'start' });

    s += rule(24, 286, 736, 286);

    /* Frame 3: the charge moves onto a nitro oxygen. */
    const c3 = P(200, 392);
    s += K.ring(c3.x, c3.y, [1, 4]);
    s += wedge(K.V(c3.x, c3.y)[0], P(170, 322), { rFrom: 0, rTo: 19 });
    s += atom(170, 322, 'OCH₃', { kind: 'hi', r: 19, size: 9 });
    s += hash(K.V(c3.x, c3.y)[0], P(234, 326), { rFrom: 0, rTo: 14 });
    s += atom(234, 326, 'Cl', { r: 14, size: 11 });
    s += K.sub(c3.x, c3.y, 1, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    {
      const v3 = K.V(c3.x, c3.y)[3];
      const N = P(200, 486), OL = P(154, 516), OR = P(246, 516);
      s += bond(v3, N, { rFrom: 0, rTo: 15 });
      s += bond(N, OR, { rFrom: 15, rTo: 15, order: 2, gap: 3.4 });
      s += bond(N, OL, { rFrom: 15, rTo: 15 });
      s += atom(N.x, N.y, 'N', { kind: 'warn' });
      s += text(220, 474, '+', { cls: 'fg-warn', size: 13 });
      s += atom(OL.x, OL.y, 'O');
      s += text(128, 502, '−', { cls: 'fg-warn', size: 14 });
      s += atom(OR.x, OR.y, 'O', { kind: 'hi' });
      s += text(170, 444, '−', { cls: 'fg-warn', size: 17 });
      s += curve(P(180, 448), P(198, 464), { bow: -10, size: 7 });
      s += curve(P(218, 492), P(257, 505), { bow: -13, size: 7 });
      s += text(292, 492, 'neutral until', { cls: 'fg-sm', size: 9.5 });
      s += text(292, 506, 'the arrow lands', { cls: 'fg-sm', size: 9.5 });
    }
    s += text(200, 538, 'and this is what pays for it —', { cls: 'fg-tag', size: 11 });
    s += text(200, 556, 'only ortho and para reach an oxygen', { cls: 'fg-tag', size: 11 });

    /* Frame 4: back to aromatic. */
    s += arrow(P(310, 392), P(396, 392));
    s += text(353, 380, '– Cl⁻', { cls: 'fg-sm', size: 10.5 });
    const c4 = P(560, 392);
    s += K.ring(c4.x, c4.y, [0, 2, 4]);
    s += K.sub(c4.x, c4.y, 0, 'OCH₃', { kind: 'hi', r: 19, size: 9, d: 36 });
    s += K.sub(c4.x, c4.y, 1, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    s += K.sub(c4.x, c4.y, 3, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    s += text(690, 398, '+ Cl⁻', { cls: 'fg-lbl', size: 12.5 });
    s += text(560, 552, 'aromatic again, one product, same position', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Addition then elimination, drawn out. The nucleophile adds first, the ring pays with its aromaticity, and the nitro groups hand that cost back by taking the charge onto their own oxygens. Follow the minus sign through frames 2 and 3: it never visits a meta carbon, which is the whole reason a meta nitro group is no help.',
  note: 'Count the electrons in frame 2. The ring has one sp&sup3; carbon, so the six-electron cycle is broken &mdash; the same structural situation as the arenium ion of electrophilic substitution, with the sign of the charge reversed. That symmetry is worth holding on to: EAS runs through a <b>cation</b> stabilized by donors, S<sub>N</sub>Ar through an <b>anion</b> stabilized by acceptors.',
});

/* The other pure-prose claim in the same section: two sp2 orbitals in the
   plane of the ring. The orbital vocabulary was already in the kit. */
FIGURES.push({
  id: 'benzyne-orbitals',
  section: 'nucleophilic-aromatic',
  anchor: 'so benzyne is strained, extremely reactive, and lasts only long enough to be attacked.</p>',
  alt: 'Three panels. Left, chlorobenzene with the ortho hydrogen drawn and curved arrows showing amide removing it and chloride leaving. Center, benzyne with two lobes drawn in the plane of the ring on adjacent carbons, pointing past each other, with the aromatic pi system drawn as separate lobes above and below for contrast. Right, two product rings, one with the nucleophile where the chlorine was and one with it on the neighboring carbon, marked roughly fifty-fifty.',
  viewBox: '0 0 760 420',
  build() {
    const R = 36, K = hexKit(R);
    let s = '';
    const lobe = (cx, cy, rx, ry, rot, cls) =>
      `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill-opacity="0.18" transform="rotate(${rot} ${cx} ${cy})"></ellipse>`;
    s += tag(380, 26, 'ELIMINATION FIRST, ADDITION SECOND');

    /* Left: making it. */
    const a = P(130, 178);
    s += K.ring(a.x, a.y, [0, 2, 4]);
    s += K.sub(a.x, a.y, 0, 'Cl', { r: 15, d: 32 });
    s += K.sub(a.x, a.y, 1, 'H', { r: 12, d: 30 });
    s += atom(48, 92, 'H₂N', { kind: 'hi', r: 19, size: 9.5 });
    s += text(70, 76, '−', { cls: 'fg-warn', size: 14 });
    s += lonePair(48, 92, 30, { dist: 26 });
    s += curve(P(66, 102), P(172, 137), { bow: 24 });
    s += curve(P(176, 152), P(146, 166), { bow: 16 });
    s += curve(P(130, 130), P(130, 116), { bow: 12 });
    s += text(130, 248, 'the base takes the ortho H,', { cls: 'fg-tag', size: 11 });
    s += text(130, 266, 'and chloride leaves', { cls: 'fg-tag', size: 11 });

    /* Centre: the thing itself. */
    const b = P(392, 178);
    s += K.ring(b.x, b.y, [2, 4]);
    {
      const v = K.V(b.x, b.y);
      s += bond(v[0], v[1], { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
      s += lobe(412, 136, 17, 9, 30, 'fg-orb');
      s += lobe(434, 149, 17, 9, 30, 'fg-orb-alt');
      s += text(506, 126, 'two sp² lobes,', { cls: 'fg-tag-warn', size: 10.5 });
      s += text(506, 142, 'in the ring plane', { cls: 'fg-tag-warn', size: 10.5 });
      s += lobe(392, 108, 26, 11, 0, 'fg-orb');
      s += lobe(392, 248, 26, 11, 0, 'fg-orb');
      s += text(392, 86, 'the aromatic π system, above and below', { cls: 'fg-tag-mut', size: 10 });
      s += text(392, 274, 'and untouched by any of this', { cls: 'fg-tag-mut', size: 10 });
    }
    s += text(392, 298, 'the extra bond is IN the ring plane —', { cls: 'fg-tag', size: 11 });
    s += text(392, 316, 'two sp² lobes that point past each other', { cls: 'fg-tag', size: 11 });

    /* Right: what attacks it, and where. */
    const R2 = 28, K2 = hexKit(R2);
    const c = P(618, 104), d = P(618, 262);
    s += K2.ring(c.x, c.y, [0, 2, 4]);
    s += K2.sub(c.x, c.y, 0, 'Nu', { kind: 'hi', r: 15, d: 28 });
    s += text(618, 152, 'where the Cl was', { cls: 'fg-tag', size: 10.5 });
    s += K2.ring(d.x, d.y, [0, 2, 4]);
    s += K2.sub(d.x, d.y, 1, 'Nu', { kind: 'hi', r: 15, d: 28 });
    s += text(618, 310, 'and one carbon along', { cls: 'fg-tag', size: 10.5 });
    s += text(618, 192, '≈ 50 : 50', { cls: 'fg-lbl', size: 12.5 });
    s += arrow(P(470, 178), P(536, 150), { muted: true });
    s += arrow(P(470, 178), P(536, 232), { muted: true });

    s += rule(24, 352, 736, 352);
    s += label(380, 382, 'The in-plane bond is not part of the aromatic sextet, so benzyne is still aromatic —');
    s += label(380, 406, 'just strained. That is why it survives long enough to be attacked at all.');
    return s;
  },
  caption: 'Benzyne drawn three ways: made, pictured, and used. The extra bond comes from two sp&sup2; orbitals lying <i>in</i> the ring plane, which is why it overlaps so badly, and the six π electrons above and below the ring are untouched throughout.',
  note: 'The right-hand panel is the whole experimental argument. The nucleophile has two carbons to choose between and no reason to prefer either, so the label splits &mdash; and a product with the nucleophile on a carbon that never carried the halide is something no direct displacement can produce. On a substituted ring the split stops being even, because the substituent votes on where the leftover carbanion may sit.',
});

/* Three species, one set of four positions. The section rests on this and
   its only figure was a table of permanganate outcomes. */
FIGURES.push({
  id: 'benzylic-delocalization',
  section: 'benzylic-reactivity',
  anchor: 'an allyl system has two, its two end carbons, while a benzylic system has four: the benzylic carbon plus both ortho positions and the para one.</div>',
  alt: 'Top row: four resonance structures of the benzyl cation, with the positive charge first on the exocyclic CH2 carbon and then on an ortho, the para and the other ortho ring carbon, connected by double-headed arrows. Bottom row: the same skeleton drawn with a single dot for the radical and with a minus sign and lone pair for the anion, and beside them an allyl cation drawn as its two resonance structures for comparison.',
  viewBox: '0 0 760 450',
  build() {
    const R = 32, K = hexKit(R);
    let s = '';
    s += tag(380, 26, 'THE SAME FOUR CARBONS, WHATEVER SITS ON THEM');

    const frames = [
      { cx: 100, doubles: [0, 2, 4], exo: 1, charge: null, lab: 'on the benzylic carbon' },
      { cx: 280, doubles: [2, 4], exo: 2, charge: 1, lab: 'on an ortho carbon' },
      { cx: 460, doubles: [1, 4], exo: 2, charge: 3, lab: 'on the para carbon' },
      { cx: 640, doubles: [1, 3], exo: 2, charge: 5, lab: 'on the other ortho' },
    ];
    const CY = 126;
    frames.forEach((f, i) => {
      s += K.ring(f.cx, CY, f.doubles);
      const v = K.V(f.cx, CY)[0];
      const p = K.out(f.cx, CY, 0, 32);
      s += bond(v, p, { rFrom: 0, rTo: 18, order: f.exo, gap: 3.4 });
      s += atom(p.x, p.y, 'CH₂', { kind: f.charge === null ? 'hi' : 'plain', r: 18, size: 9.5 });
      if (f.charge === null) s += text(p.x + 26, p.y - 8, '+', { cls: 'fg-warn', size: 16 });
      else s += K.mark(f.cx, CY, f.charge, '+', { d: 18 });
      s += text(f.cx, 196, f.lab, { cls: 'fg-tag', size: 10.5 });
      if (i < 3) {
        const x1 = f.cx + 44, x2 = frames[i + 1].cx - 44;
        s += arrow(P(x1, CY), P(x2, CY), { muted: true });
        s += arrow(P(x2, CY), P(x1, CY), { muted: true });
      }
    });
    s += text(190, 222, 'meta · never', { cls: 'fg-tag-mut', size: 10 });
    s += text(550, 222, 'meta · never', { cls: 'fg-tag-mut', size: 10 });
    s += rule(24, 244, 736, 244);

    /* The radical and the anion use the same skeleton. */
    const CY2 = 324;
    const two = [
      { cx: 110, kind: 'radical', lab: 'radical · one electron' },
      { cx: 300, kind: 'anion', lab: 'anion · a lone pair' },
    ];
    two.forEach((f) => {
      s += K.ring(f.cx, CY2, [0, 2, 4]);
      const v = K.V(f.cx, CY2)[0];
      const p = K.out(f.cx, CY2, 0, 32);
      s += bond(v, p, { rFrom: 0, rTo: 18 });
      s += atom(p.x, p.y, 'CH₂', { kind: 'hi', r: 18, size: 9.5 });
      if (f.kind === 'radical') s += `<circle class="fg-lp" cx="${p.x + 24}" cy="${p.y - 10}" r="3"></circle>`;
      else {
        s += lonePair(p.x, p.y, -90, { dist: 26 });
        s += text(p.x + 26, p.y - 8, '−', { cls: 'fg-warn', size: 15 });
      }
      s += text(f.cx, CY2 + 62, f.lab, { cls: 'fg-tag', size: 10.5 });
    });
    s += text(205, 288, 'same four', { cls: 'fg-tag-mut', size: 10 });

    /* The allyl comparison the text makes in words. */
    s += panel(420, 262, 282, 124);
    s += text(561, 284, 'an allyl cation, for comparison', { cls: 'fg-tag', size: 11 });
    {
      const A = P(452, 342), B = P(482, 322), C = P(512, 342);
      s += bond(A, B, { rFrom: 0, rTo: 0, order: 2, gap: 3.6 });
      s += bond(B, C, { rFrom: 0, rTo: 0 });
      s += text(522, 336, '+', { cls: 'fg-warn', size: 15 });
      const D = P(606, 342), E = P(636, 322), F = P(666, 342);
      s += bond(D, E, { rFrom: 0, rTo: 0 });
      s += bond(E, F, { rFrom: 0, rTo: 0, order: 2, gap: 3.6 });
      s += text(596, 336, '+', { cls: 'fg-warn', size: 15 });
      s += arrow(P(544, 312), P(576, 312), { muted: true, size: 7 });
      s += arrow(P(576, 312), P(544, 312), { muted: true, size: 7 });
      s += text(561, 372, 'two positions, not four', { cls: 'fg-tag-mut', size: 10.5 });
    }

    s += rule(24, 402, 736, 402);
    s += label(380, 430, 'An empty orbital, one electron or a lone pair — the ring does not care which.');
    return s;
  },
  caption: 'One set of resonance structures, three different species. Whatever sits on the benzylic carbon reaches the same four carbons: the benzylic one, both ortho positions and the para. The meta carbons never appear, which is the pattern the phenoxide and the Meisenheimer anion follow too.',
  note: 'Notice the cost in structures 2&ndash;4: the ring is drawn with the charge <i>inside</i> it, which breaks the six-electron cycle. That is why a benzylic cation is <i>about</i> as good as a tertiary one rather than dramatically better &mdash; the delocalization is real, and it is paid for.',
});

/* Six pKa units, drawn. */
FIGURES.push({
  id: 'phenoxide-resonance',
  section: 'phenols',
  anchor: 'Spreading charge stabilizes it, the conjugate base is more stable, and the acid is stronger.</p>',
  alt: 'Top row: four resonance structures of phenoxide, with the negative charge first on oxygen and then on an ortho, the para and the other ortho ring carbon, each connected by double-headed arrows. Bottom left: the hybrid drawn once, with partial negative marks on the oxygen and on three ring carbons and the two meta carbons marked never. Bottom right: ethoxide drawn as a two-carbon chain with the charge locked on its single oxygen.',
  viewBox: '0 0 760 460',
  build() {
    const R = 32, K = hexKit(R);
    let s = '';
    s += tag(380, 26, 'WHERE A PHENOXIDE PUTS ITS CHARGE');
    const CY = 122;
    const frames = [
      { cx: 100, doubles: [0, 2, 4], exo: 1, charge: null, lab: 'charge on oxygen' },
      { cx: 280, doubles: [2, 4], exo: 2, charge: 1, lab: 'on an ortho carbon' },
      { cx: 460, doubles: [1, 4], exo: 2, charge: 3, lab: 'on the para carbon' },
      { cx: 640, doubles: [1, 3], exo: 2, charge: 5, lab: 'on the other ortho' },
    ];
    frames.forEach((f, i) => {
      s += K.ring(f.cx, CY, f.doubles);
      const v = K.V(f.cx, CY)[0];
      const p = K.out(f.cx, CY, 0, 30);
      s += bond(v, p, { rFrom: 0, rTo: 15, order: f.exo, gap: 3.4 });
      s += atom(p.x, p.y, 'O', { kind: f.charge === null ? 'hi' : 'plain' });
      if (f.charge === null) {
        s += text(p.x + 22, p.y - 8, '−', { cls: 'fg-warn', size: 15 });
        s += lonePair(p.x, p.y, 180, { dist: 22 });
        s += lonePair(p.x, p.y, 0, { dist: 22 });
      } else {
        s += K.mark(f.cx, CY, f.charge, '−', { d: 18 });
      }
      s += text(f.cx, 192, f.lab, { cls: 'fg-tag', size: 10.5 });
      if (i < 3) {
        const x1 = f.cx + 44, x2 = frames[i + 1].cx - 44;
        s += arrow(P(x1, CY), P(x2, CY), { muted: true });
        s += arrow(P(x2, CY), P(x1, CY), { muted: true });
      }
    });
    s += rule(24, 214, 736, 214);

    /* The hybrid, and the alkoxide that has none of this. */
    const R3 = 40, K3 = hexKit(R3);
    const h = P(180, 312);
    s += K3.ring(h.x, h.y, [0, 2, 4]);
    s += K3.sub(h.x, h.y, 0, 'O', { kind: 'hi', r: 15, d: 32 });
    s += text(212, 258, 'δ−', { cls: 'fg-warn', size: 12 });
    for (const i of [1, 3, 5]) s += K3.mark(h.x, h.y, i, 'δ−', { d: 22, cls: 'fg-warn', size: 12, dy: 4 });
    s += text(268, 312, 'meta · never', { cls: 'fg-tag-mut', size: 10, anchor: 'start' });
    s += text(92, 312, 'never · meta', { cls: 'fg-tag-mut', size: 10, anchor: 'end' });
    s += text(180, 394, 'four atoms share it — pKa 10', { cls: 'fg-tag', size: 11 });

    s += panel(420, 246, 282, 132);
    {
      const A = P(478, 330), B = P(514, 310), O = P(558, 330);
      s += bond(A, B, { rFrom: 0, rTo: 0 });
      s += bond(B, O, { rFrom: 0, rTo: 15 });
      s += atom(O.x, O.y, 'O', { kind: 'warn' });
      s += text(582, 322, '−', { cls: 'fg-warn', size: 15 });
      s += lonePair(O.x, O.y, 90, { dist: 22 });
      s += lonePair(O.x, O.y, 30, { dist: 22 });
      s += text(460, 306, 'CH₃', { cls: 'fg-sm', size: 10.5 });
      s += text(612, 330, 'nowhere', { cls: 'fg-tag-mut', size: 10.5, anchor: 'start' });
      s += text(612, 348, 'to go', { cls: 'fg-tag-mut', size: 10.5, anchor: 'start' });
      s += text(561, 274, 'ethoxide: one atom holds all of it — pKa 16', { cls: 'fg-tag', size: 11 });
    }
    s += rule(24, 414, 736, 414);
    s += label(380, 442, 'Four atoms sharing a charge, against one atom keeping all of it — six pKa units.');
    return s;
  },
  caption: 'Six pKa units, drawn. The phenoxide charge reaches four atoms; the ethoxide charge reaches one. The two meta carbons are left out of every structure, which is why a meta substituent can only ever help inductively.',
  note: 'These are the same four positions as the benzyl cation in the last section and the same four as the Meisenheimer anion two sections back. Once you have drawn them once, ortho/para stops being a rule to memorize and becomes something you can read off the page. It also explains Kolbe&ndash;Schmitt: if the charge is genuinely on those ring carbons, those ring carbons are nucleophilic.',
});

/* Where the sp3 carbons end up is the entire examinable content, and the
   section's only figure was two labelled rectangles. */
FIGURES.push({
  id: 'birch-products',
  section: 'birch-reduction',
  anchor: '<td>1-substituted cyclohexa-2,5-diene</td></tr>\n</tbody>\n</table>\n</div>',
  alt: 'Top row: benzene, then the radical anion, then the cyclohexadienyl anion with one sp3 CH2 and partial negative marks on three carbons, then 1,4-cyclohexadiene with both CH2 groups drawn and labeled C1 and C4. Bottom row: anisole giving 1-methoxycyclohexa-1,4-diene with the methoxy-bearing carbon still on a double bond, and benzoic acid giving cyclohexa-2,5-diene-1-carboxylic acid with the carboxyl-bearing carbon drawn sp3 with its hydrogen.',
  viewBox: '0 0 760 490',
  build() {
    const R = 34, K = hexKit(R);
    let s = '';
    s += tag(380, 26, 'TWO ELECTRONS, TWO PROTONS, AND WHERE THEY LAND');
    const CY = 122;

    /* 1: benzene. */
    s += K.ring(100, CY, [0, 2, 4]);
    s += text(100, 190, 'benzene', { cls: 'fg-tag', size: 10.5 });

    /* 2: the radical anion. */
    s += K.ring(292, CY, [0, 2, 4]);
    s += text(292 + 48, CY - 30, '•−', { cls: 'fg-warn', size: 15 });
    s += text(292, 190, 'radical anion', { cls: 'fg-tag', size: 10.5 });
    s += arrow(P(146, CY), P(246, CY));
    s += text(196, CY - 12, 'e⁻', { cls: 'fg-sm', size: 10.5 });

    /* 3: the cyclohexadienyl anion. */
    s += K.ring(484, CY, [1, 4]);
    s += atom(K.V(484, CY)[0].x, K.V(484, CY)[0].y, 'CH₂', { kind: 'hi', r: 18, size: 9.5 });
    s += K.mark(484, CY, 3, '−', { d: 18 });
    s += K.mark(484, CY, 1, 'δ−', { d: 20, size: 11, dy: 4 });
    s += K.mark(484, CY, 5, 'δ−', { d: 20, size: 11, dy: 4 });
    s += text(484, 190, 'charge on three carbons,', { cls: 'fg-tag', size: 10.5 });
    s += text(484, 206, 'protonated across the ring', { cls: 'fg-tag', size: 10.5 });
    s += arrow(P(338, CY), P(438, CY));
    s += text(388, CY - 12, 'ROH, e⁻', { cls: 'fg-sm', size: 10.5 });

    /* 4: the 1,4-diene. */
    s += K.ring(668, CY, [1, 4]);
    s += atom(K.V(668, CY)[0].x, K.V(668, CY)[0].y, 'CH₂', { kind: 'hi', r: 18, size: 9.5 });
    s += atom(K.V(668, CY)[3].x, K.V(668, CY)[3].y, 'CH₂', { kind: 'hi', r: 18, size: 9.5 });
    s += text(706, CY - 36, 'C1', { cls: 'fg-tag-good', size: 10.5 });
    s += text(706, CY + 44, 'C4', { cls: 'fg-tag-good', size: 10.5 });
    s += text(636, 190, '1,4, and para to each other', { cls: 'fg-tag', size: 10.5 });
    s += arrow(P(530, CY), P(614, CY));
    s += text(572, CY - 12, 'ROH', { cls: 'fg-sm', size: 10.5 });

    s += rule(24, 228, 736, 228);

    /* Bottom: the two substituent cases, drawn. */
    const CY2 = 330;
    s += K.ring(96, CY2, [0, 2, 4]);
    s += K.sub(96, CY2, 0, 'OCH₃', { kind: 'hi', r: 19, size: 9, d: 32 });
    s += arrow(P(146, CY2), P(216, CY2));
    s += text(181, CY2 - 12, 'Na/NH₃', { cls: 'fg-sm', size: 10 });
    s += K.ring(286, CY2, [0, 3]);
    s += K.sub(286, CY2, 0, 'OCH₃', { kind: 'hi', r: 19, size: 9, d: 32 });
    s += atom(K.V(286, CY2)[2].x, K.V(286, CY2)[2].y, 'CH₂', { r: 18, size: 9.5 });
    s += atom(K.V(286, CY2)[5].x, K.V(286, CY2)[5].y, 'CH₂', { r: 18, size: 9.5 });
    s += text(190, 408, 'donor: its carbon stayed on a double bond', { cls: 'fg-tag', size: 10.5 });
    s += text(190, 426, '1-methoxycyclohexa-1,4-diene', { cls: 'fg-tag-good', size: 10.5 });

    s += K.ring(486, CY2, [0, 2, 4]);
    s += K.sub(486, CY2, 0, 'COOH', { kind: 'warn', r: 20, size: 8.5, d: 34 });
    s += arrow(P(536, CY2), P(606, CY2));
    s += text(571, CY2 - 12, 'Na/NH₃', { cls: 'fg-sm', size: 10 });
    s += K.ring(668, CY2, [1, 4]);
    s += K.sub(668, CY2, 0, 'COOH', { kind: 'warn', r: 20, size: 8.5, d: 34 });
    s += text(632, CY2 - 26, 'H', { cls: 'fg-tag-good', size: 11 });
    s += atom(K.V(668, CY2)[3].x, K.V(668, CY2)[3].y, 'CH₂', { r: 18, size: 9.5 });
    s += text(580, 408, 'acceptor: its carbon came out sp³', { cls: 'fg-tag', size: 10.5 });
    s += text(580, 426, 'cyclohexa-2,5-diene-1-carboxylic acid', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(24, 444, 736, 444);
    s += label(380, 472, 'Track the sp³ carbons: they took the protons, and they come out para.');
    return s;
  },
  caption: 'The same reduction on three substrates. Track the sp&sup3; carbons &mdash; they are the ones that took protons, they always come out para to each other, and which ones they are is decided entirely by whether the substituent wanted the carbanion nearby.',
  note: 'The third frame of the top row is the one to stare at. Three of the five delocalized carbons carry charge, in roughly equal shares, and protonating the middle one of the three is what makes the product 1,4 rather than 1,3. Every regiochemical statement in this section is that one picture.',
});

/* A section whose one figure was a text hub map, in a chapter where the
   diazonium is both made and used and neither was drawn. */
FIGURES.push({
  id: 'diazotize-and-couple',
  section: 'diazonium-chemistry',
  anchor: 'giving an <b>azo compound</b>, Ar&ndash;N=N&ndash;Ar&prime;.</p>',
  alt: 'Top row: aniline with its nitrogen lone pair and a curved arrow to the nitrosonium ion, then the N-nitrosoamine, then the aryl diazonium ion drawn with the triple bond to nitrogen and the positive charge, all at zero to five degrees. Bottom row: a phenoxide attacking the terminal nitrogen of the diazonium salt through its para carbon, the neutral arenium-type intermediate with the sp3 para carbon and its hydrogen, and the azo product drawn as two rings joined by a nitrogen-nitrogen double bond with a hydroxyl on the far ring.',
  viewBox: '0 0 760 650',
  build() {
    const R = 32, K = hexKit(R);
    let s = '';
    s += tag(380, 26, 'MADE FROM AN AMINE — AND THEN USED AS AN ELECTROPHILE');

    /* Row 1: diazotization. */
    const a = P(104, 150);
    s += K.ring(a.x, a.y, [0, 2, 4]);
    s += K.sub(a.x, a.y, 0, 'NH₂', { kind: 'hi', r: 17, size: 9.5, d: 32 });
    s += lonePair(104, 86, 270, { dist: 24 });
    s += text(236, 74, 'N≡O', { cls: 'fg-lbl', size: 13 });
    s += text(268, 64, '+', { cls: 'fg-warn', size: 13 });
    s += curve(P(118, 66), P(210, 70), { bow: -18 });
    s += text(104, 214, 'aniline + nitrosonium', { cls: 'fg-tag', size: 10.5 });

    s += arrow(P(258, 150), P(334, 150));
    s += text(296, 138, '0–5 °C', { cls: 'fg-sm', size: 10.5 });

    const b = P(410, 150);
    s += K.ring(b.x, b.y, [0, 2, 4]);
    s += bond(K.V(b.x, b.y)[0], P(410, 104), { rFrom: 0, rTo: 6 });
    s += text(410, 92, 'N(H)–N=O', { cls: 'fg-lbl', size: 12 });
    s += text(410, 214, 'the N-nitrosoamine', { cls: 'fg-tag', size: 10.5 });

    s += arrow(P(492, 150), P(560, 150));
    s += text(526, 138, 'H⁺, –H₂O', { cls: 'fg-sm', size: 10.5 });

    const c = P(644, 150);
    s += K.ring(c.x, c.y, [0, 2, 4]);
    s += bond(K.V(c.x, c.y)[0], P(644, 104), { rFrom: 0, rTo: 6 });
    s += text(644, 92, 'N≡N', { cls: 'fg-lbl', size: 13 });
    s += text(676, 82, '+', { cls: 'fg-warn', size: 13 });
    s += text(644, 214, 'the diazonium ion', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(24, 238, 736, 238);

    /* Row 2: azo coupling as an ordinary EAS. */
    const CY = 336;
    const d = P(78, CY);
    s += K.ring(d.x, d.y, [0, 2, 4]);
    s += bond(K.V(d.x, d.y)[0], P(78, CY - 46), { rFrom: 0, rTo: 6 });
    s += text(78, CY - 58, 'N≡N', { cls: 'fg-lbl', size: 12.5 });
    s += text(108, CY - 68, '+', { cls: 'fg-warn', size: 12 });

    const e = P(246, CY);
    s += K.ring(e.x, e.y, [0, 2, 4]);
    s += K.sub(e.x, e.y, 0, 'O', { kind: 'hi', r: 15, d: 30 });
    s += text(270, CY - 54, '−', { cls: 'fg-warn', size: 14 });
    s += K.mark(e.x, e.y, 3, 'δ−', { d: 21, size: 11, dy: 4 });
    s += curve(P(238, CY + 44), P(100, CY - 40), { bow: 44 });
    s += text(162, CY + 92, 'pH 8–10: the phenoxide is the nucleophile', { cls: 'fg-tag', size: 10.5 });
    s += text(162, CY + 108, 'and its para carbon is where the charge is', { cls: 'fg-tag', size: 10.5 });

    s += arrow(P(324, CY), P(398, CY));

    const f = P(480, CY);
    s += K.ring(f.x, f.y, [1, 4]);
    {
      const v = K.V(f.x, f.y);
      const O = K.out(f.x, f.y, 0, 30);
      s += bond(v[0], O, { rFrom: 0, rTo: 15, order: 2, gap: 3.4 });
      s += atom(O.x, O.y, 'O', { kind: 'hi' });
      s += atom(v[3].x, v[3].y, 'C', { kind: 'warn', r: 15 });
      s += text(444, CY + 48, 'H', { cls: 'fg-tag-good', size: 11 });
      s += bond(v[3], P(524, CY + 56), { rFrom: 15, rTo: 8 });
      s += text(534, CY + 62, 'N=N–Ar', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    }
    s += text(480, CY + 92, 'the same arenium ion as any other EAS — drawn', { cls: 'fg-tag', size: 10.5 });
    s += text(480, CY + 108, 'from the phenoxide, so it comes out neutral', { cls: 'fg-tag', size: 10.5 });

    s += rule(24, 476, 736, 476);

    /* Row 3: the dye. */
    const R2 = 26, K2 = hexKit(R2);
    const PY = 548;
    s += text(150, PY - 14, 'lose the para H,', { cls: 'fg-sm', size: 10.5 });
    s += arrow(P(118, PY + 4), P(186, PY + 4));
    s += text(150, PY + 26, 'rearomatize', { cls: 'fg-sm', size: 10.5 });
    s += K2.ring(268, PY, [0, 2, 4]);
    s += text(330, PY + 4, 'N=N', { cls: 'fg-lbl', size: 12 });
    s += bond(K2.V(268, PY)[1], P(306, PY + 4), { rFrom: 0, rTo: 12 });
    s += K2.ring(414, PY, [0, 2, 4]);
    s += bond(K2.V(414, PY)[4], P(354, PY + 4), { rFrom: 0, rTo: 12 });
    s += K2.sub(414, PY, 1, 'OH', { kind: 'hi', r: 15, size: 10.5, d: 26 });
    s += text(520, PY + 4, '4-(phenylazo)phenol — orange', { cls: 'fg-tag-good', size: 11, anchor: 'start' });

    s += rule(24, 600, 736, 600);
    s += label(380, 626, 'The bottom half is not a new mechanism: it is EAS with Ar–N₂⁺ as the electrophile.');
    return s;
  },
  caption: 'The two things a diazonium salt does, drawn. On the way in it is made from an amine and nitrosonium at 0&ndash;5 &deg;C; on the way out, if the other partner is activated enough, it is itself the electrophile of an ordinary electrophilic aromatic substitution &mdash; arenium ion and all.',
  note: 'What makes the bottom row possible is that the ring being attacked is a <b>phenoxide</b>: the δ&minus; marked on its para carbon is exactly the delocalization the phenols section drew. Run the same coupling below pH 8 and there is no phenoxide; run it above pH 10 and the diazonium ion is converted to an unreactive diazotate. Both ends of that window are examined.',
});

/* ----------------------------------------------------------------- 73 ---
   The chapter's central drawing operation — open the pi bond and bracket
   what is left, or join two groups and take the water out — was never once
   drawn. Three rows, monomer on the left and repeat unit on the right. */
FIGURES.push({
  id: 'monomer-to-repeat-unit',
  section: 'polymer-basics',
  anchor: '<p class="step-body">Regiochemistry follows the same rule it always has: whichever end of the alkene gives the more stable intermediate is where the chain attaches. For a monosubstituted alkene that gives <b>head-to-tail</b> linking, with all the substituents on alternating carbons.</p>',
  viewBox: '0 0 760 510',
  alt: 'Ethylene and propylene each drawn with their double bond beside the bracketed repeat unit they give, and adipic acid with ethylene glycol drawn beside the bracketed polyester repeat unit with two waters leaving',
  build() {
    let s = '';
    /* A polymer bracket: the upright with two short arms turned toward the
       repeat unit, which is how a repeat unit is written by hand. */
    const brack = (x, y, h, dir) => {
      const t = y - h / 2, b = y + h / 2;
      return `<path class="fg-bond" d="M${x + 10 * dir} ${t} L${x} ${t} L${x} ${b} L${x + 10 * dir} ${b}"></path>`;
    };
    s += tag(380, 26, 'MONOMER IN, REPEAT UNIT OUT');

    /* Row 1 — ethylene. */
    const y1 = 86;
    s += atom(110, y1, 'CH₂', { r: 18 });
    s += atom(186, y1, 'CH₂', { r: 18 });
    s += bond(P(110, y1), P(186, y1), { order: 2, rFrom: 18, rTo: 18 });
    s += arrow(P(232, y1), P(308, y1), { muted: true });
    s += brack(346, y1, 54, 1);
    s += atom(398, y1, 'CH₂', { r: 18 });
    s += atom(474, y1, 'CH₂', { r: 18 });
    s += bond(P(346, y1), P(398, y1), { rFrom: 0, rTo: 18 });
    s += bond(P(398, y1), P(474, y1), { rFrom: 18, rTo: 18 });
    s += bond(P(474, y1), P(526, y1), { rFrom: 18, rTo: 0 });
    s += brack(526, y1, 54, -1);
    s += text(538, y1 + 22, 'n', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(648, y1 - 4, 'polyethylene', { cls: 'fg-tag-good', size: 11 });
    s += text(648, y1 + 14, 'same atoms, nothing lost', { cls: 'fg-sm', size: 9.5 });
    s += text(270, y1 + 40, 'the π bond opens', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 148, 720, 148);

    /* Row 2 — propylene, and the carbon tacticity is about. */
    const y2 = 252;
    s += atom(110, y2, 'CH₂', { r: 18 });
    s += atom(186, y2, 'CH', { r: 16 });
    s += bond(P(110, y2), P(186, y2), { order: 2, rFrom: 18, rTo: 16 });
    s += atom(244, 196, 'CH₃', { r: 18 });
    s += bond(P(186, y2), P(244, 196), { rFrom: 16, rTo: 18 });
    s += arrow(P(300, y2), P(372, y2), { muted: true });
    s += brack(406, y2, 54, 1);
    s += atom(458, y2, 'CH₂', { r: 18 });
    s += atom(534, y2, 'CH', { kind: 'hi', r: 16 });
    s += atom(534, 196, 'CH₃', { r: 18 });
    s += bond(P(406, y2), P(458, y2), { rFrom: 0, rTo: 18 });
    s += bond(P(458, y2), P(534, y2), { rFrom: 18, rTo: 16 });
    s += bond(P(534, y2), P(534, 196), { rFrom: 16, rTo: 18 });
    s += bond(P(534, y2), P(586, y2), { rFrom: 16, rTo: 0 });
    s += brack(586, y2, 54, -1);
    s += text(598, y2 + 22, 'n', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(672, y2 - 4, 'polypropylene', { cls: 'fg-tag-good', size: 11 });
    s += text(380, y2 + 44, 'the highlighted carbon is the one whose orientation along the chain tacticity describes', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 314, 720, 314);

    /* Row 3 — a step-growth pair, and the water that leaves. */
    const y3 = 362;
    s += atom(96, y3, 'HO₂C', { kind: 'hi', r: 23, size: 9 });
    s += atom(180, y3, '(CH₂)₄', { r: 26, size: 9 });
    s += atom(266, y3, 'CO₂H', { kind: 'hi', r: 23, size: 9 });
    s += bond(P(96, y3), P(180, y3), { rFrom: 23, rTo: 26 });
    s += bond(P(180, y3), P(266, y3), { rFrom: 26, rTo: 23 });
    s += text(318, y3 + 5, '+', { cls: 'fg-lbl', size: 14 });
    s += atom(374, y3, 'HO', { kind: 'hi', r: 18 });
    s += atom(452, y3, 'CH₂CH₂', { r: 29, size: 9 });
    s += atom(528, y3, 'OH', { kind: 'hi', r: 18 });
    s += bond(P(374, y3), P(452, y3), { rFrom: 18, rTo: 29 });
    s += bond(P(452, y3), P(528, y3), { rFrom: 29, rTo: 18 });
    s += text(648, y3 - 4, 'adipic acid, ethylene glycol', { cls: 'fg-tag', size: 10.5 });
    s += text(648, y3 + 14, 'two sites on each monomer', { cls: 'fg-sm', size: 9.5 });

    const y4 = 434;
    s += arrow(P(56, y4), P(126, y4), { muted: true });
    s += text(91, y4 - 12, '− 2 H₂O', { cls: 'fg-sm', size: 10 });
    s += brack(160, y4, 54, 1);
    s += atom(200, y4, 'O', { r: 15 });
    s += atom(268, y4, 'CH₂CH₂', { r: 29, size: 9 });
    s += atom(338, y4, 'O', { r: 15 });
    s += atom(396, y4, 'CO', { kind: 'hi', r: 17 });
    s += atom(466, y4, '(CH₂)₄', { r: 26, size: 9 });
    s += atom(536, y4, 'CO', { kind: 'hi', r: 17 });
    s += bond(P(160, y4), P(200, y4), { rFrom: 0, rTo: 15 });
    s += bond(P(200, y4), P(268, y4), { rFrom: 15, rTo: 29 });
    s += bond(P(268, y4), P(338, y4), { rFrom: 29, rTo: 15 });
    s += bond(P(338, y4), P(396, y4), { rFrom: 15, rTo: 17 });
    s += bond(P(396, y4), P(466, y4), { rFrom: 17, rTo: 26 });
    s += bond(P(466, y4), P(536, y4), { rFrom: 26, rTo: 17 });
    s += bond(P(536, y4), P(580, y4), { rFrom: 17, rTo: 0 });
    s += brack(580, y4, 54, -1);
    s += text(592, y4 + 22, 'n', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(668, y4 - 4, 'a polyester', { cls: 'fg-tag-good', size: 11 });
    s += text(668, y4 + 14, 'lighter than its monomers', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 496, 'One water leaves per ester made, so the repeat unit no longer weighs what the monomers did.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The whole chapter’s drawing skill in three rows. For an alkene, open the π bond and bracket what is left; for a step-growth pair, join the two groups and take the water out. The bracket with a bond leaving each side is the notation: it means this piece continues in both directions.',
  note: 'Count the atoms across each arrow and the diagnostic falls out on its own. Rows one and two lose nothing, so the repeat unit weighs exactly what its monomer did. Row three is lighter than its two monomers by one water for every ester bond it contains — two of them, for this repeat unit — and that difference is the only evidence you need that a small molecule was expelled.',
});

/* ----------------------------------------------------------------- 74 ---
   The chapter's core mechanism was prose only, while the halogenation
   section three chapters back draws the identical anatomy. Same fishhooks,
   with a C=C in place of a C-H, and the two terminations drawn apart. */
FIGURES.push({
  id: 'polymer-chain-drawn',
  section: 'addition-polymers',
  anchor: 'Only the last of the three lowers the radical concentration, which is why adding a transfer agent shortens the chains without slowing the reaction down.</div>',
  viewBox: '0 0 760 752',
  alt: 'Six drawn steps of a radical polymerization with single-barbed fishhook arrows: homolysis of a peroxide, the first radical adding to a monomer, propagation, chain transfer to a thiol, termination by combination, and termination by disproportionation giving one saturated chain and one with a terminal double bond',
  build() {
    let s = '';
    const head2 = (y, a, b) => {
      s += tag(48, y - 48, a, { anchor: 'start' });
      s += text(48, y - 30, b, { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    };

    /* 1. Initiation: the peroxide splits. */
    head2(96, 'INITIATION', 'radicals 0 → 2');
    s += atom(160, 96, 'RO', { r: 18 });
    s += atom(236, 96, 'OR', { r: 18 });
    s += bond(P(160, 96), P(236, 96), { rFrom: 18, rTo: 18 });
    s += fishhook(P(190, 90), P(168, 70), { bow: 12 });
    s += fishhook(P(206, 90), P(228, 70), { bow: -12 });
    s += arrow(P(282, 96), P(350, 96), { muted: true });
    s += text(316, 84, 'Δ', { cls: 'fg-sm', size: 10 });
    s += atom(394, 96, 'RO', { r: 18 });
    s += dot(414, 82);
    s += text(440, 101, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(486, 96, 'RO', { r: 18 });
    s += dot(506, 82);
    s += text(380, 142, 'two fishhooks, one per electron: the weak O–O bond splits down the middle', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 166, 720, 166);

    /* 2. Initiation, second half: that radical adds to a monomer. */
    head2(216, 'FIRST ADDITION', 'radicals 1 → 1');
    s += atom(150, 216, 'RO', { r: 18 });
    s += dot(168, 203);
    s += text(200, 221, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(252, 216, 'CH₂', { r: 18 });
    s += atom(330, 216, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(252, 216), P(330, 216), { order: 2, rFrom: 18, rTo: 20 });
    s += fishhook(P(176, 209), P(230, 206), { bow: -16 });
    s += fishhook(P(294, 202), P(316, 192), { bow: -12 });
    s += arrow(P(378, 216), P(446, 216), { muted: true });
    s += atom(492, 216, 'RO', { r: 18 });
    s += atom(556, 216, 'CH₂', { r: 18 });
    s += atom(620, 216, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(492, 216), P(556, 216), { rFrom: 18, rTo: 18 });
    s += bond(P(556, 216), P(620, 216), { rFrom: 18, rTo: 20 });
    s += dot(634, 202);
    s += text(560, 262, 'the radical lands on the substituted carbon — head-to-tail', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 278, 720, 278);

    /* 3. Propagation. */
    head2(336, 'PROPAGATION', 'radicals 1 → 1');
    s += atom(140, 336, '~CH₂', { r: 23, size: 9 });
    s += atom(204, 336, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(140, 336), P(204, 336), { rFrom: 23, rTo: 20 });
    s += dot(218, 322);
    s += text(250, 341, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(300, 336, 'CH₂', { r: 18 });
    s += atom(366, 336, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(300, 336), P(366, 336), { order: 2, rFrom: 18, rTo: 20 });
    s += fishhook(P(226, 330), P(280, 330), { bow: -18 });
    s += fishhook(P(332, 322), P(352, 312), { bow: -12 });
    s += arrow(P(410, 336), P(470, 336), { muted: true });
    s += atom(518, 336, '~CH₂', { r: 23, size: 9 });
    s += atom(582, 336, 'CHX', { r: 20, size: 9.5 });
    s += atom(644, 336, 'CH₂', { r: 18 });
    s += atom(706, 336, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(518, 336), P(582, 336), { rFrom: 23, rTo: 20 });
    s += bond(P(582, 336), P(644, 336), { rFrom: 20, rTo: 18 });
    s += bond(P(644, 336), P(706, 336), { rFrom: 18, rTo: 20 });
    s += dot(720, 322);
    s += text(360, 384, 'one unit longer, one radical still at the end — repeat this a few thousand times', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 398, 720, 398);

    /* 4. Chain transfer. */
    head2(456, 'CHAIN TRANSFER', 'radicals 1 → 1');
    s += atom(140, 456, '~CH₂', { r: 23, size: 9 });
    s += atom(204, 456, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(140, 456), P(204, 456), { rFrom: 23, rTo: 20 });
    s += dot(218, 442);
    s += text(250, 461, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(302, 456, 'RS', { r: 18 });
    s += atom(368, 456, 'H', { r: 14 });
    s += bond(P(302, 456), P(368, 456), { rFrom: 18, rTo: 14 });
    s += fishhook(P(226, 448), P(352, 444), { bow: -24 });
    s += fishhook(P(346, 462), P(322, 462), { bow: 12 });
    s += arrow(P(410, 456), P(470, 456), { muted: true });
    s += atom(520, 456, '~CH₂', { r: 23, size: 9 });
    s += atom(592, 456, 'CH₂X', { r: 25, size: 9 });
    s += bond(P(520, 456), P(592, 456), { rFrom: 23, rTo: 25 });
    s += text(638, 461, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(684, 456, 'RS', { r: 18 });
    s += dot(702, 443);
    s += text(380, 504, 'that chain is dead, but a new radical carries on — the count never changed', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 518, 720, 518);

    /* 5. Termination by combination. */
    head2(576, 'TERMINATION — COMBINATION', 'radicals 2 → 0');
    s += atom(140, 576, '~CH₂', { r: 23, size: 9 });
    s += atom(204, 576, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(140, 576), P(204, 576), { rFrom: 23, rTo: 20 });
    s += dot(219, 563);
    s += text(250, 581, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(300, 576, 'XHC', { r: 20, size: 9.5 });
    s += atom(366, 576, 'CH₂~', { r: 23, size: 9 });
    s += bond(P(300, 576), P(366, 576), { rFrom: 20, rTo: 23 });
    s += dot(285, 563);
    s += fishhook(P(224, 568), P(248, 592), { bow: -14 });
    s += fishhook(P(280, 568), P(258, 592), { bow: 14 });
    s += arrow(P(414, 576), P(474, 576), { muted: true });
    s += atom(524, 576, '~CH₂', { r: 23, size: 9 });
    s += atom(588, 576, 'CHX', { r: 20, size: 9.5 });
    s += atom(652, 576, 'XHC', { r: 20, size: 9.5 });
    s += atom(716, 576, 'CH₂~', { r: 23, size: 9 });
    s += bond(P(524, 576), P(588, 576), { rFrom: 23, rTo: 20 });
    s += bond(P(588, 576), P(652, 576), { rFrom: 20, rTo: 20 });
    s += bond(P(652, 576), P(716, 576), { rFrom: 20, rTo: 23 });
    s += text(620, 622, 'one chain, of the two lengths added together', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 636, 720, 636);

    /* 6. Termination by disproportionation. */
    head2(696, 'TERMINATION — DISPROPORTIONATION', 'radicals 2 → 0');
    s += atom(124, 696, '~CH₂', { r: 23, size: 9 });
    s += atom(188, 696, 'CHX', { r: 20, size: 9.5 });
    s += bond(P(124, 696), P(188, 696), { rFrom: 23, rTo: 20 });
    s += dot(203, 683);
    s += text(232, 701, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(282, 696, 'XHC', { r: 20, size: 9.5 });
    s += atom(350, 696, 'CH₂', { r: 18 });
    s += atom(412, 696, '~', { r: 12, size: 12 });
    s += bond(P(282, 696), P(350, 696), { rFrom: 20, rTo: 18 });
    s += bond(P(350, 696), P(412, 696), { rFrom: 18, rTo: 12 });
    s += dot(268, 708);
    s += fishhook(P(210, 690), P(336, 682), { bow: -22 });
    s += fishhook(P(350, 720), P(332, 726), { bow: 10 });
    s += fishhook(P(274, 720), P(300, 726), { bow: -10 });
    s += text(352, 744, 'the β-H, and both single electrons, into the new C=C', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(446, 696), P(500, 696), { muted: true });
    s += atom(544, 696, '~CH₂', { r: 23, size: 9 });
    s += atom(614, 696, 'CH₂X', { r: 25, size: 9 });
    s += bond(P(544, 696), P(614, 696), { rFrom: 23, rTo: 25 });
    s += text(656, 701, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(688, 696, 'XHC', { r: 20, size: 9.5 });
    s += atom(740, 696, 'CH~', { r: 19, size: 9.5 });
    s += bond(P(688, 696), P(740, 696), { order: 2, gap: 3.4, rFrom: 20, rTo: 19 });
    s += text(590, 736, 'saturated', { cls: 'fg-tag-good', size: 9.5 });
    s += text(690, 736, 'a C=C at the end', { cls: 'fg-tag-good', size: 9.5 });
    return s;
  },
  caption: 'The same four-part anatomy as radical halogenation, with a C=C in place of a C–H. Every arrow here has <b>one barb</b>, because every arrow moves one electron, and nothing carries a charge at any point — if a step you have drawn produces a cation or an anion, it was not a radical step.',
  note: 'Read the left-hand column and the mechanism sorts itself. Initiation makes radicals, propagation and chain transfer conserve them, and only termination destroys them — which is why a chain adds thousands of units before two ends happen to meet. The two terminations are worth separating: combination fuses the two chains into one, while disproportionation hands back two dead chains, one of them carrying a double bond that was not in any monomer.',
});

/* ----------------------------------------------------------------- 75 ---
   Tacticity is a three-dimensional idea taught in words. Wedges and dashes
   are the only way to show that the three polymers differ in nothing else. */
FIGURES.push({
  id: 'three-polypropylenes',
  section: 'addition-polymers',
  anchor: 'Stereocontrol and the absence of branching both come out of that single fact: the chain end is held, so it can neither flip nor curl back onto itself.</p>',
  viewBox: '0 0 760 430',
  alt: 'Three identical eight-carbon zig-zag backbones with their methyl groups drawn on wedges and dashes: all wedges for isotactic, alternating for syndiotactic, and an irregular mixture for atactic',
  build() {
    let s = '';
    s += tag(380, 26, 'SAME CONNECTIVITY, SAME FORMULA, THREE MATERIALS');
    const chain = (y, pattern, name, note, kind) => {
      const xs = [], n = 8;
      for (let i = 0; i < n; i++) xs.push({ x: 146 + i * 44, y: i % 2 === 0 ? y : y - 28 });
      for (let i = 0; i < n - 1; i++) s += bond(P(xs[i].x, xs[i].y), P(xs[i + 1].x, xs[i + 1].y), { rFrom: 0, rTo: 0 });
      for (const p of xs) s += atom(p.x, p.y, '', { kind: 'point' });
      pattern.forEach((w, k) => {
        const p = xs[k * 2];
        const tip = P(p.x, p.y + 40);
        s += (w ? wedge : hash)(P(p.x, p.y), tip, { rFrom: 0, rTo: 17 });
        s += atom(tip.x, tip.y, 'CH₃', { r: 17, size: 9 });
      });
      s += text(62, y - 20, name, { cls: kind, size: 12, anchor: 'start' });
      s += text(466, y - 8, note[0], { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(466, y + 8, note[1], { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    };
    chain(104, [true, true, true, true], 'isotactic',
      ['every methyl on the same face:', 'chains register — crystalline, Tm ≈ 165 °C'], 'fg-tag-good');
    s += rule(40, 174, 720, 174);
    chain(240, [true, false, true, false], 'syndiotactic',
      ['a regular alternation is a pattern too,', 'so these chains pack as well'], 'fg-tag-good');
    s += rule(40, 310, 720, 310);
    chain(376, [true, true, false, true], 'atactic',
      ['no pattern: no two stretches of chain', 'match, so nothing packs — a goo'], 'fg-tag-warn');
    return s;
  },
  caption: 'Three polypropylenes, drawn with the wedge-and-dash convention from the stereochemistry chapter. Nothing differs but which face each methyl points to, and that is enough to separate a car bumper from a sticky goo.',
  note: 'The practical lesson is a drawing habit: put the backbone down flat as a zig-zag first, and only then decide, carbon by carbon, whether each methyl comes forward or goes back. Drawn any other way the three rows look identical \u2014 and that is exactly the trap, because no formula, no molecular weight and no spectrum of the monomer separates them, while the first is rope, the second a usable plastic and the third a goo.',
});

/* ----------------------------------------------------------------- 76 ---
   Seven polymers are named in the condensation section and none is drawn.
   Four backbones, one bracket each, with the by-product question kept
   deliberately unanswerable from the drawing. */
FIGURES.push({
  id: 'four-backbones',
  section: 'condensation-polymers',
  anchor: 'Nothing exotic is happening &mdash; it is amide hydrogen bonding, the same interaction that holds a beta sheet together, multiplied by perfect alignment.</p>',
  viewBox: '0 0 760 580',
  alt: 'Four polymer backbones drawn inside repeat-unit brackets: PET with its two esters, nylon 6,6 with dotted hydrogen bonds to a second chain above it, Kevlar drawn dead straight from two para-phenylene rings, and a polyurethane with its carbamate linkage boxed',
  build() {
    let s = '';
    const brack = (x, y, h, dir) => {
      const t = y - h / 2, b = y + h / 2;
      return `<path class="fg-bond" d="M${x + 10 * dir} ${t} L${x} ${t} L${x} ${b} L${x + 10 * dir} ${b}"></path>`;
    };
    /* A run of labelled groups joined left to right and bracketed at both
       ends. `gap` is the VISIBLE length of each bond, so the radii of the two
       groups it joins have to be added on top of it — get that wrong and a
       bond between two wide labels renders as a dot. */
    const GAP = 34;
    const place = (x0, items) => {
      const out = [];
      let x = x0;
      for (const it of items) {
        x = out.length ? x + out[out.length - 1].r + (it.gap ?? GAP) + it.r : x + it.r;
        out.push({ x, ...it });
      }
      return out;
    };
    const draw = (y, x0, items) => {
      const ps = place(x0, items);
      let out = brack(x0 - 30, y, 58, 1);
      out += bond(P(x0 - 30, y), P(ps[0].x, y), { rFrom: 0, rTo: ps[0].r });
      for (let i = 0; i < ps.length - 1; i++) out += bond(P(ps[i].x, y), P(ps[i + 1].x, y), { rFrom: ps[i].r, rTo: ps[i + 1].r });
      const last = ps[ps.length - 1];
      out += bond(P(last.x, y), P(last.x + last.r + 30, y), { rFrom: last.r, rTo: 0 });
      out += brack(last.x + last.r + 30, y, 58, -1);
      out += text(last.x + last.r + 42, y + 22, 'n', { cls: 'fg-lbl', size: 12, anchor: 'start' });
      for (const p of ps) out += atom(p.x, y, p.l, { r: p.r, size: p.size ?? (p.l.length > 3 ? 9 : p.l.length > 2 ? 9.5 : 12), kind: p.kind });
      return { html: out, ps };
    };

    /* (a) PET. */
    s += text(46, 62, 'PET, a polyester', { cls: 'fg-tag-good', size: 11.5, anchor: 'start' });
    s += draw(96, 120, [
      { l: 'O', r: 15 }, { l: 'CH₂CH₂', r: 29 }, { l: 'O', r: 15 },
      { l: 'CO', r: 17, kind: 'hi' }, { l: 'C₆H₄', r: 25 }, { l: 'CO', r: 17, kind: 'hi' },
    ]).html;
    s += text(380, 146, 'two esters in every repeat unit, and water can find both of them', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 166, 720, 166);

    /* (b) Nylon 6,6, with a neighbouring chain and the hydrogen bonds. */
    s += text(46, 200, 'nylon 6,6, a polyamide', { cls: 'fg-tag-good', size: 11.5, anchor: 'start' });
    s += bond(P(110, 224), P(600, 224), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
    s += text(138, 219, 'O=C', { cls: 'fg-sm', size: 9.5 });
    s += text(298, 219, 'O=C', { cls: 'fg-sm', size: 9.5 });
    s += text(525, 219, 'H–N', { cls: 'fg-sm', size: 9.5 });
    s += text(676, 224, 'a neighboring chain', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += draw(286, 120, [
      { l: 'NH', r: 18 }, { l: '(CH₂)₆', r: 28 }, { l: 'NH', r: 18 },
      { l: 'CO', r: 17, kind: 'hi' }, { l: '(CH₂)₄', r: 28 }, { l: 'CO', r: 17, kind: 'hi' },
    ]).html;
    for (const x of [138, 298, 525]) s += `<line class="fg-dash" x1="${x}" y1="232" x2="${x}" y2="264"></line>`;
    s += text(380, 334, 'N–H···O=C from every amide to the chain alongside — one residue of a β sheet, repeated', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 352, 720, 352);

    /* (c) Kevlar. */
    s += text(46, 388, 'Kevlar, also a polyamide', { cls: 'fg-tag-good', size: 11.5, anchor: 'start' });
    s += draw(430, 120, [
      { l: 'NH', r: 18 }, { l: 'C₆H₄', r: 25 }, { l: 'NH', r: 18 },
      { l: 'CO', r: 17, kind: 'hi' }, { l: 'C₆H₄', r: 25 }, { l: 'CO', r: 17, kind: 'hi' },
    ]).html;
    s += text(380, 478, 'both partners aromatic and para, so the chain can neither coil nor bend', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 496, 720, 496);

    /* (d) Polyurethane, with the carbamate boxed. */
    s += text(46, 508, 'a polyurethane', { cls: 'fg-tag-good', size: 11.5, anchor: 'start' });
    s += panel(112, 516, 170, 62, { kind: 'warn' });
    s += draw(547, 120, [
      { l: 'O', r: 15, gap: 26 }, { l: 'CO', r: 17, gap: 26 }, { l: 'NH', r: 18, gap: 26 },
      { l: 'R', r: 15, gap: 26 }, { l: 'NH', r: 18, gap: 26 }, { l: 'CO', r: 17, gap: 26 },
      { l: 'O', r: 15, gap: 26 }, { l: 'R′', r: 17, gap: 26 },
    ]).html;
    s += text(700, 508, 'the boxed carbamate: every atom of both monomers is still in it', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    return s;
  },
  caption: 'Four backbones, each inside the brackets that mark one repeat unit. Three of the four were made by expelling a small molecule and one was not — and you cannot tell which from the drawn chain, because what names the class is the <b>linkage</b>, not the by-product. To answer that you have to go back to the monomers.',
  note: 'Stare at the second and third rows together. They carry the same amide linkage and the same hydrogen bond, and the only difference is what sits between: a floppy run of CH₂ in nylon, a flat para-substituted ring in Kevlar. The ring cannot rotate the chain out of line, so every amide in a Kevlar chain sits where its neighbor’s can reach it, and the hydrogen bonds add up along the whole length instead of only where the chain happens to be straight.',
});

/* --------------------------------------------------------------- 76b ---
   The section describes three ways to start a chain and draws only the
   radical one, so the two ionic chain ends — the ones whose stability
   decides which monomers each method can touch — were prose. */
FIGURES.push({
  id: 'ionic-chain-ends',
  section: 'polymer-basics',
  anchor: 'and adding a second monomer afterwards extends every chain into a block copolymer.</li>\n</ul>',
  viewBox: '0 0 760 400',
  alt: 'Two propagation steps drawn with curved arrows: a carbocation chain end of polyisobutylene attacked by the double bond of another isobutylene to give a new tertiary cation, and a carbanion chain end stabilized by a nitrile adding to acrylonitrile to give a new stabilized carbanion',
  build() {
    let s = '';
    const head2 = (y, a, b) => {
      s += tag(48, y - 48, a, { anchor: 'start' });
      s += text(48, y - 30, b, { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    };

    /* 1. Cationic: the chain end is a tertiary carbocation. */
    head2(110, 'CATIONIC — THE END IS A CARBOCATION', 'isobutylene');
    s += atom(88, 110, '~CH₂', { r: 23, size: 9 });
    s += atom(160, 110, 'C(CH₃)₂', { r: 32, size: 9, kind: 'warn' });
    s += bond(P(88, 110), P(160, 110), { rFrom: 23, rTo: 32 });
    s += text(186, 78, '+', { cls: 'fg-tag-warn', size: 14 });
    s += text(218, 115, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(256, 110, 'CH₂', { r: 18 });
    s += atom(330, 110, 'C(CH₃)₂', { r: 32, size: 9 });
    s += bond(P(256, 110), P(330, 110), { order: 2, rFrom: 18, rTo: 32 });
    s += curve(P(293, 90), P(192, 92), { bow: -16 });
    s += arrow(P(388, 110), P(448, 110), { muted: true });
    s += atom(492, 110, '~CH₂', { r: 23, size: 9 });
    s += atom(564, 110, 'C(CH₃)₂', { r: 32, size: 9 });
    s += atom(632, 110, 'CH₂', { r: 18 });
    s += atom(704, 110, 'C(CH₃)₂', { r: 32, size: 9, kind: 'warn' });
    s += bond(P(492, 110), P(564, 110), { rFrom: 23, rTo: 32 });
    s += bond(P(564, 110), P(632, 110), { rFrom: 32, rTo: 18 });
    s += bond(P(632, 110), P(704, 110), { rFrom: 18, rTo: 32 });
    s += text(730, 78, '+', { cls: 'fg-tag-warn', size: 14 });
    s += text(380, 162, 'the π bond attacks the cation, and the cation that results is tertiary again — two methyls donating into it', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 186, 720, 186);

    /* 2. Anionic: the chain end is a carbanion the nitrile can hold. */
    head2(300, 'ANIONIC — THE END IS A CARBANION', 'acrylonitrile');
    s += atom(88, 300, '~CH₂', { r: 23, size: 9 });
    s += atom(154, 300, 'CHCN', { r: 25, size: 9, kind: 'warn' });
    s += bond(P(88, 300), P(154, 300), { rFrom: 23, rTo: 25 });
    s += text(180, 332, '−', { cls: 'fg-tag-warn', size: 15 });
    s += lonePair(154, 300, 300, { dist: 30 });
    s += text(206, 305, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(244, 300, 'CH₂', { r: 18 });
    s += atom(312, 300, 'CHCN', { r: 25, size: 9 });
    s += bond(P(244, 300), P(312, 300), { order: 2, rFrom: 18, rTo: 25 });
    s += curve(P(172, 284), P(238, 280), { bow: -14 });
    s += curve(P(278, 282), P(306, 272), { bow: -10 });
    s += arrow(P(378, 300), P(438, 300), { muted: true });
    s += atom(482, 300, '~CH₂', { r: 23, size: 9 });
    s += atom(548, 300, 'CHCN', { r: 25, size: 9 });
    s += atom(614, 300, 'CH₂', { r: 18 });
    s += atom(680, 300, 'CHCN', { r: 25, size: 9, kind: 'warn' });
    s += bond(P(482, 300), P(548, 300), { rFrom: 23, rTo: 25 });
    s += bond(P(548, 300), P(614, 300), { rFrom: 25, rTo: 18 });
    s += bond(P(614, 300), P(680, 300), { rFrom: 18, rTo: 25 });
    s += text(704, 270, '−', { cls: 'fg-tag-warn', size: 15 });
    s += text(380, 352, 'the carbanion adds to the CH₂ end, so the new negative charge lands next to the nitrile that can delocalize it', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 372, 720, 372);
    s += text(380, 394, 'Same anatomy as the radical chain — only the charge on the end differs.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The two ionic propagation steps, drawn with the full-headed arrows that move a <b>pair</b> of electrons — the difference from the radical figure is not cosmetic. Each new chain end is the same kind of ion the old one was, which is the whole requirement: the monomer has to be able to stabilize that charge, or the chain stops.',
  note: 'Read each row backwards to see why the monomer lists differ. A cation needs electron density pushed toward it, so isobutylene (two methyls) and vinyl ethers (an oxygen lone pair) work and acrylonitrile does not; an anion needs electron density pulled away, so acrylonitrile, methyl methacrylate and styrene work and isobutylene does not. Nothing terminates the second row on its own — two carbanions repel rather than pair — which is why the anionic chain end stays alive after the monomer is gone.',
});

/* --------------------------------------------------------------- 76c ---
   The one step-growth in the chapter that behaves differently is walked
   through in prose, arrow by arrow, and then drawn only as a finished
   carbamate in the backbones figure. */
FIGURES.push({
  id: 'urethane-addition',
  section: 'condensation-polymers',
  anchor: 'which is why the broader name for this class is <i>step-growth</i> rather than condensation.</p>',
  viewBox: '0 0 760 440',
  alt: 'Two steps of the urethane-forming addition: an alcohol oxygen adding to the carbon of an isocyanate while the carbon-nitrogen pi bond moves onto nitrogen, giving a zwitterion, and then the nitrogen taking the proton from the positively charged oxygen to give a neutral carbamate',
  build() {
    let s = '';
    const head2 = (y, a, b) => {
      s += tag(48, y - 48, a, { anchor: 'start' });
      s += text(48, y - 30, b, { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    };
    /* The zwitterion is drawn twice — as the product of step 1 and the
       starting material of step 2 — so it is built once here. Spacing is
       56, which leaves every bond about 25px of visible length. */
    const zwitter = (x0, y) => {
      let o = '';
      const xs = [0, 1, 2, 3, 4].map((i) => x0 + i * 56);
      o += atom(xs[0], y, 'R', { r: 15 });
      o += atom(xs[1], y, 'N', { r: 15, kind: 'warn' });
      o += atom(xs[2], y, 'C', { r: 15 });
      o += atom(xs[3], y, 'O', { r: 15, kind: 'warn' });
      o += atom(xs[4], y, 'R′', { r: 17 });
      for (let i = 0; i < 4; i++) o += bond(P(xs[i], y), P(xs[i + 1], y), { rFrom: 15, rTo: i === 3 ? 17 : 15 });
      o += atom(xs[2], y - 44, 'O', { r: 15 });
      o += bond(P(xs[2], y), P(xs[2], y - 44), { order: 2, rFrom: 15, rTo: 15 });
      o += atom(xs[3], y - 44, 'H', { r: 12, size: 10 });
      o += bond(P(xs[3], y), P(xs[3], y - 44), { rFrom: 15, rTo: 12 });
      o += text(xs[1] - 22, y - 12, '−', { cls: 'fg-tag-warn', size: 15 });
      o += text(xs[3] + 22, y - 12, '+', { cls: 'fg-tag-warn', size: 14 });
      return o;
    };

    /* 1. The addition itself. */
    head2(120, 'STEP 1 — THE ALCOHOL ADDS', 'nothing leaves, because nothing can');
    s += atom(96, 120, 'R', { r: 15 });
    s += atom(156, 120, 'N', { r: 15 });
    s += atom(216, 120, 'C', { r: 15, kind: 'hi' });
    s += atom(276, 120, 'O', { r: 15 });
    s += bond(P(96, 120), P(156, 120), { rFrom: 15, rTo: 15 });
    s += bond(P(156, 120), P(216, 120), { order: 2, rFrom: 15, rTo: 15 });
    s += bond(P(216, 120), P(276, 120), { order: 2, rFrom: 15, rTo: 15 });
    s += text(190, 162, 'an isocyanate: C between two electronegative atoms', { cls: 'fg-sm', size: 9.5 });
    s += text(316, 125, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(366, 120, 'R′O', { r: 22, size: 10 });
    s += atom(424, 120, 'H', { r: 12, size: 10 });
    s += bond(P(366, 120), P(424, 120), { rFrom: 22, rTo: 12 });
    s += lonePair(366, 120, 250, { dist: 30 });
    s += curve(P(352, 94), P(230, 100), { bow: -20 });
    s += curve(P(186, 104), P(160, 92), { bow: -12 });
    s += arrow(P(440, 120), P(478, 120), { muted: true });
    s += zwitter(500, 120);
    s += text(600, 180, 'every atom of both monomers, and both charges', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 200, 720, 200);

    /* 2. The proton transfer that neutralises it. */
    head2(320, 'STEP 2 — THE PROTON MOVES', 'nitrogen takes the proton');
    s += zwitter(170, 320);
    s += lonePair(226, 320, 250, { dist: 28 });
    s += curve(P(218, 298), P(330, 270), { bow: -56 });
    s += curve(P(350, 290), P(356, 310), { bow: 14 });
    s += arrow(P(440, 320), P(478, 320), { muted: true });
    s += atom(496, 320, 'R', { r: 15 });
    s += atom(556, 320, 'NH', { r: 18 });
    s += atom(618, 320, 'C', { r: 15 });
    s += atom(676, 320, 'O', { r: 15 });
    s += atom(730, 320, 'R′', { r: 17 });
    s += bond(P(496, 320), P(556, 320), { rFrom: 15, rTo: 18 });
    s += bond(P(556, 320), P(618, 320), { rFrom: 18, rTo: 15 });
    s += bond(P(618, 320), P(676, 320), { rFrom: 15, rTo: 15 });
    s += bond(P(676, 320), P(730, 320), { rFrom: 15, rTo: 17 });
    s += atom(618, 276, 'O', { r: 15 });
    s += bond(P(618, 320), P(618, 276), { order: 2, rFrom: 15, rTo: 15 });
    s += text(614, 376, 'a carbamate — the linkage O–CO–N', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 396, 720, 396);
    s += text(380, 418, 'Nothing is expelled anywhere in this figure: step-growth, but not a condensation.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The addition that builds a polyurethane, drawn arrow by arrow. The isocyanate carbon already carries both of its electronegative partners, so the alcohol can add to it without anything having to leave &mdash; the C=N &pi; bond simply becomes a lone pair on nitrogen, and the proton walks across afterwards.',
  note: 'This is the reason the class had to be renamed. Every other backbone in this section is built by expelling something &mdash; water, HCl &mdash; and the arithmetic of the repeat unit shows it. Here the repeat unit weighs exactly what the diol and the diisocyanate weighed together, and the only honest name for what happened is a step-growth <i>addition</i>.',
});

/* --------------------------------------------------------------- 76d ---
   Polycarbonate carries three questions in the bank and appears in the
   design section, and the whole of it — linkage, monomers, bent joint —
   was carried in prose. */
FIGURES.push({
  id: 'polycarbonate-drawn',
  section: 'condensation-polymers',
  anchor: 'Rigid but amorphous is exactly the combination safety glazing needs, which is why it makes safety glasses and bulletproof windows.</p>',
  viewBox: '0 0 760 360',
  alt: 'Bisphenol A drawn as two para-phenylene rings joined through a dimethyl carbon and capped with OH groups, beside phosgene, with an arrow losing two HCl to the bracketed polycarbonate repeat unit containing the O-CO-O carbonate linkage',
  build() {
    let s = '';
    s += tag(380, 30, 'ONE CARBONYL, TWO OXYGENS — THAT IS A CARBONATE');

    /* The two monomers. */
    s += atom(70, 110, 'HO', { r: 18, size: 10.5 });
    s += atom(135, 110, 'C₆H₄', { r: 25, size: 9 });
    s += atom(214, 110, 'C(CH₃)₂', { r: 32, size: 9, kind: 'warn' });
    s += atom(293, 110, 'C₆H₄', { r: 25, size: 9 });
    s += atom(358, 110, 'OH', { r: 18, size: 10.5 });
    const chainA = [[70, 18, 135, 25], [135, 25, 214, 32], [214, 32, 293, 25], [293, 25, 358, 18]];
    for (const [x1, r1, x2, r2] of chainA) s += bond(P(x1, 110), P(x2, 110), { rFrom: r1, rTo: r2 });
    s += text(214, 158, 'bisphenol A — a diol, both OH on rings', { cls: 'fg-sm', size: 9.5 });
    s += text(400, 115, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(440, 110, 'Cl', { r: 15, size: 10.5 });
    s += atom(494, 110, 'CO', { r: 17, kind: 'hi' });
    s += atom(548, 110, 'Cl', { r: 15, size: 10.5 });
    s += bond(P(440, 110), P(494, 110), { rFrom: 15, rTo: 17 });
    s += bond(P(494, 110), P(548, 110), { rFrom: 17, rTo: 15 });
    s += text(494, 176, 'phosgene — the diacid chloride of carbonic acid', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 196, 720, 196);

    /* The repeat unit. */
    s += arrow(P(96, 266), P(166, 266), { muted: true });
    s += text(131, 252, '− 2 HCl', { cls: 'fg-sm', size: 10 });
    const brack = (x, y, h, dir) => {
      const t = y - h / 2, b = y + h / 2;
      return `<path class="fg-bond" d="M${x + 10 * dir} ${t} L${x} ${t} L${x} ${b} L${x + 10 * dir} ${b}"></path>`;
    };
    s += brack(200, 266, 58, 1);
    s += atom(236, 266, 'O', { r: 15 });
    s += atom(294, 266, 'CO', { r: 17, kind: 'hi' });
    s += atom(352, 266, 'O', { r: 15 });
    s += atom(418, 266, 'C₆H₄', { r: 25, size: 9 });
    s += atom(501, 266, 'C(CH₃)₂', { r: 32, size: 9, kind: 'warn' });
    s += atom(584, 266, 'C₆H₄', { r: 25, size: 9 });
    s += bond(P(200, 266), P(236, 266), { rFrom: 0, rTo: 15 });
    const chainB = [[236, 15, 294, 17], [294, 17, 352, 15], [352, 15, 418, 25], [418, 25, 501, 32], [501, 32, 584, 25]];
    for (const [x1, r1, x2, r2] of chainB) s += bond(P(x1, 266), P(x2, 266), { rFrom: r1, rTo: r2 });
    s += bond(P(584, 266), P(635, 266), { rFrom: 25, rTo: 0 });
    s += brack(635, 266, 58, -1);
    s += text(647, 288, 'n', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(294, 316, 'the carbonate: O–CO–O', { cls: 'fg-tag-good', size: 10.5 });
    s += text(520, 316, 'the bent joint that stops it crystallizing', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(380, 344, 'Rigid rings give the stiffness; the kink at the quaternary carbon gives the transparency.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'Bisphenol A and phosgene, and the repeat unit they give. The linkage to look for is the middle three groups: one carbonyl carbon with an oxygen on <i>each</i> side, which is an ester of carbonic acid twice over and is what the name carbonate means.',
  note: 'The two highlighted features answer two different questions. The carbonate group is what a hydroxide or an amine attacks, so it is why polycarbonate can be depolymerized and why it slowly fails in hot alkali. The bent C(CH₃)₂ joint is why the chains cannot register with each other, so the material is amorphous — and an amorphous polymer well below its T<sub>g</sub> is both stiff and glass-clear, which is exactly what safety glazing needs.',
});

/* ----------------------------------------------------------------- 77 ---
   Cross-link density is the section's second big idea and was undrawn. The
   same four chains three times, with only the number of sulfur bridges
   changing, is the honest way to say "dial". */
FIGURES.push({
  id: 'crosslink-dial',
  section: 'polymer-properties',
  anchor: '<p class="step-body">Everything a rubber band does is set by where on that dial it sits, and the dial is turned by one number: how much sulfur went in.</p>',
  viewBox: '0 0 760 340',
  alt: 'The same four wavy polymer chains drawn three times: loose and staggered with no bridges, tied by three short sulfur bridges, and tied by a dense mesh of them',
  build() {
    let s = '';
    const wavy = (x0, y, len, amp) => {
      let d = `M${x0} ${y}`;
      for (let i = 1; i <= 8; i++) {
        const x = x0 + (len * i) / 8;
        d += ` Q${x0 + (len * (i - 0.5)) / 8} ${y + (i % 2 ? amp : -amp)} ${x} ${y}`;
      }
      return `<path class="fg-bond" fill="none" d="${d}"></path>`;
    };
    const YS = [76, 112, 148, 184];
    const panelAt = (ox, kind, title, stagger, bridges, out1, out2) => {
      let g = panel(ox, 56, 220, 152, { kind });
      g += tag(ox + 110, 44, title);
      YS.forEach((y, i) => { g += wavy(ox + 14 + (stagger ? i * 5 : 0), y, 178, 7); });
      for (const [bx, a, b] of bridges) {
        g += `<line class="fg-bond-hi" x1="${ox + bx}" y1="${YS[a] + 8}" x2="${ox + bx}" y2="${YS[b] - 8}"></line>`;
      }
      g += text(ox + 110, 232, out1, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', size: 11.5 });
      g += text(ox + 110, 250, out2, { cls: 'fg-sm', size: 9.5 });
      return g;
    };
    s += panelAt(24, 'warn', 'no cross-links', true, [],
      'it flows', 'chains slide past each other for good');
    s += panelAt(270, null, 'a few percent', false,
      [[56, 0, 1], [132, 1, 2], [92, 2, 3]],
      'elastic', 'it deforms, then comes back');
    s += panelAt(516, null, 'heavily cross-linked', false,
      [[40, 0, 1], [86, 0, 1], [132, 0, 1], [178, 0, 1],
       [52, 1, 2], [98, 1, 2], [144, 1, 2],
       [40, 2, 3], [86, 2, 3], [132, 2, 3], [178, 2, 3]],
      'hard and brittle', 'nothing can move at all: ebonite');
    s += text(380, 284, 'Each highlighted bridge is a short run of sulfur atoms, –S–S–, tying one chain to the next.', { cls: 'fg-lbl', size: 11.5 });
    s += rule(24, 302, 700, 302);
    s += text(380, 326, 'One variable — how much sulfur — and three materials come out of it.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Cross-linking as a dial rather than a switch. The chains are the same in all three panels and so is the chemistry; only the number of bridges between them changes, and that alone takes the material from a gum that flows to a tire and then to something you could make a bowling ball from.',
  note: 'The middle panel is where the entropy argument lives. Pull on it and the coiled chains straighten, which costs a great deal of conformational freedom; let go and that freedom is what pulls them back. Without the bridges the chains would simply slide past one another and stay where you left them, which is the left-hand panel; with too many of them nothing can straighten in the first place, which is the right.',
});


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

/* ------------------------------------------------------------- 30.1 ---
   Cis and trans on a ring, read straight off wedges and hashes. */
FIGURES.push({
  id: 'ring-cis-trans-faces',
  section: 'cis-trans-ez',
  anchor: 'and the locants say the rest.</p>',
  alt: 'Two flat hexagon drawings of 1,2-dimethylcyclohexane. On the left both methyl groups sit on bold wedges, so both are above the ring, which is the cis isomer. On the right one methyl is on a wedge and the other on a hashed bond, so one is above the ring and one below, which is the trans isomer.',
  viewBox: '0 0 760 330',
  build() {
    const verts = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = ((-90 + i * 60) * Math.PI) / 180;
        v.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return v;
    };
    const draw = (cx, cis) => {
      const v = verts(cx, 140, 58);
      let out = '';
      for (let i = 0; i < 6; i++) out += sk(v[i], v[(i + 1) % 6]);
      const c1 = v[2], c2 = v[3];
      const m1 = P(c1.x + 52, c1.y + 30), m2 = P(c2.x, c2.y + 58);
      out += wedge(c1, m1, { rFrom: 0, rTo: 18 });
      out += (cis ? wedge : hash)(c2, m2, { rFrom: 0, rTo: 18 });
      out += atom(m1.x, m1.y, 'CH₃', { r: 18 });
      out += atom(m2.x, m2.y, 'CH₃', { r: 18 });
      out += text(c1.x + 16, c1.y - 8, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      out += text(c2.x - 18, c2.y + 2, 'C2', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
      return out;
    };
    let s = '';
    s += panel(20, 36, 340, 242, { kind: 'hi' });
    s += tag(190, 26, 'both on a wedge — same face');
    s += draw(190, true);
    s += text(190, 300, 'cis-1,2-dimethylcyclohexane', { cls: 'fg-tag-good', size: 12 });
    s += panel(400, 36, 340, 242, { kind: 'warn' });
    s += tag(570, 26, 'one wedge, one hash — opposite faces');
    s += draw(570, false);
    s += text(570, 300, 'trans-1,2-dimethylcyclohexane', { cls: 'fg-tag-warn', size: 12 });
    s += text(380, 324, 'Wedge is above the ring, hash is below. Same face is cis, opposite faces trans.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Cis and trans on a ring, with nothing to compute. A wedge puts the group above the plane of the ring and a hash puts it below, so the question is only whether the two substituents are drawn on the same kind of bond. That reading is identical for a 1,2-, a 1,3- or a 1,4-disubstituted ring — the locants say how far apart the groups are, and the wedges say which face each one is on.',
  note: 'A chair flip does not touch this. Flipping exchanges axial for equatorial at every carbon, which changes the energy of the conformer; the group that was above the ring is still above the ring when the flip is finished. Configuration survives a ring flip, position does not.',
});

/* ------------------------------------------------------------- 30.2 ---
   Where the two words stop working, in one row of three. */
FIGURES.push({
  id: 'cis-trans-runs-out',
  section: 'cis-trans-ez',
  anchor: 'it has run out of definition, and the compound still has two distinct geometric isomers that need naming.</p>',
  alt: 'Three alkenes side by side. Cis-but-2-ene has its two methyl groups on the same side of the double bond and one hydrogen on each alkene carbon. Trans-but-2-ene has them on opposite sides. 3-methylpent-2-ene has a methyl and an ethyl group on the right-hand alkene carbon and no hydrogen there, so neither cis nor trans can be assigned to it.',
  viewBox: '0 0 760 316',
  build() {
    let s = '';
    const me = (x, y) => atom(x, y, 'CH₃', { r: 17 });

    s += panel(14, 36, 236, 200, { kind: 'hi' });
    s += bond(P(72, 182), P(114, 150), { rFrom: 17, rTo: 0 });
    s += skDouble(P(114, 150), P(158, 150), P(136, 192));
    s += bond(P(158, 150), P(200, 182), { rFrom: 0, rTo: 17 });
    s += bond(P(114, 150), P(114, 104), { rFrom: 0, rTo: 12 });
    s += bond(P(158, 150), P(158, 104), { rFrom: 0, rTo: 12 });
    s += me(72, 182); s += me(200, 182);
    s += atom(114, 104, 'H', { r: 12 }); s += atom(158, 104, 'H', { r: 12 });

    s += panel(262, 36, 236, 200, { kind: 'hi' });
    s += bond(P(320, 182), P(362, 150), { rFrom: 17, rTo: 0 });
    s += skDouble(P(362, 150), P(406, 150), P(384, 192));
    s += bond(P(406, 150), P(448, 118), { rFrom: 0, rTo: 17 });
    s += bond(P(362, 150), P(362, 104), { rFrom: 0, rTo: 12 });
    s += bond(P(406, 150), P(406, 196), { rFrom: 0, rTo: 12 });
    s += me(320, 182); s += me(448, 118);
    s += atom(362, 104, 'H', { r: 12 }); s += atom(406, 196, 'H', { r: 12 });

    s += panel(494, 36, 236, 200, { kind: 'warn' });
    s += bond(P(538, 182), P(580, 150), { rFrom: 17, rTo: 0 });
    s += skDouble(P(580, 150), P(620, 150), P(600, 192));
    s += bond(P(580, 150), P(580, 104), { rFrom: 0, rTo: 12 });
    s += bond(P(620, 150), P(662, 104), { rFrom: 0, rTo: 17 });
    s += bond(P(620, 150), P(678, 186), { rFrom: 0, rTo: 27 });
    s += me(538, 182); s += me(662, 104);
    s += atom(580, 104, 'H', { r: 12 });
    s += atom(678, 186, 'CH₂CH₃', { r: 27 });

    s += text(132, 256, 'cis-but-2-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(380, 256, 'trans-but-2-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(612, 256, '3-methylpent-2-ene', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(132, 278, 'one H, one CH₃ per carbon', { cls: 'fg-sm', size: 10 });
    s += text(380, 278, 'same test, other answer', { cls: 'fg-sm', size: 10 });
    s += text(612, 278, 'no H on the right carbon', { cls: 'fg-sm', size: 10 });
    s += rule(24, 292, 720, 292);
    s += text(380, 312, 'Cis/trans needs one hydrogen and one other group on EACH carbon of the C=C.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The condition on cis and trans, and the case that violates it. In the first two panels each alkene carbon carries one hydrogen and one methyl, so “the substituent” means something and the two words divide the cases cleanly. In the third the right-hand carbon carries a methyl <i>and</i> an ethyl: one of them is cis to the left-hand methyl and the other is trans, so the question has no answer.',
  note: 'The third compound is not an edge case without isomers — it has two, and they are different substances. What it lacks is a name for them in this vocabulary, which is exactly the gap E/Z was invented to fill.',
});

/* ------------------------------------------------------------- 30.3 ---
   A tie broken one sphere out, and the size instinct that gets it wrong. */
FIGURES.push({
  id: 'ez-tie-one-sphere',
  section: 'cis-trans-ez',
  anchor: 'never a head count and never a size estimate.</p>\n</div>',
  alt: 'An alkene whose right-hand carbon carries a chloromethyl group and an isopropyl group. Both branches begin with carbon, so the comparison moves one sphere out: the chloromethyl carbon holds chlorine, hydrogen and hydrogen, while the isopropyl carbon holds carbon, carbon and hydrogen. Chlorine beats carbon at the first term, so the smaller chloromethyl group is the higher priority.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(190, 30, 'both branches start with carbon');
    s += bond(P(104, 116), P(150, 150), { rFrom: 17, rTo: 0 });
    s += skDouble(P(150, 150), P(200, 150), P(175, 190));
    s += bond(P(150, 150), P(150, 204), { rFrom: 0, rTo: 12 });
    s += bond(P(200, 150), P(250, 110), { rFrom: 0, rTo: 22 });
    s += bond(P(200, 150), P(252, 202), { rFrom: 0, rTo: 35 });
    s += atom(104, 116, 'CH₃', { r: 17 });
    s += atom(150, 204, 'H', { r: 12 });
    s += atom(250, 110, 'CH₂Cl', { kind: 'hi', r: 22 });
    s += atom(252, 202, 'CH(CH₃)₂', { r: 35 });
    s += text(138, 132, 'C2', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(212, 132, 'C3', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(190, 266, '3-(chloromethyl)-4-methylpent-2-ene', { cls: 'fg-sm', size: 10.5 });

    s += rule(350, 40, 350, 262);

    s += tag(556, 34, 'so move one sphere out and compare');
    s += text(390, 92, '–CH₂Cl  →  (Cl, H, H)', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(390, 120, '–CH(CH₃)₂  →  (C, C, H)', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(390, 154, 'Highest against highest: Cl (17) beats C (6).', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(390, 176, 'First point of difference — stop there.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(556, 208, '–CH₂Cl is the higher priority', { cls: 'fg-tag-good', size: 12 });
    s += text(556, 228, 'although isopropyl is the bigger group', { cls: 'fg-sm', size: 10.5 });
    s += text(556, 252, 'drawn as here, both winners are up: (Z)', { cls: 'fg-tag-good', size: 11.5 });
    s += text(380, 290, 'Size does not decide a CIP comparison. The first point of difference does.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'A tie at the first atom, broken one sphere out. Both groups on C3 attach through carbon, so the first sphere says nothing and you list what each of those carbons holds. Chlorine appears at the head of one set and carbon at the head of the other, so the comparison is over at the first term &mdash; and the branch with three carbons in it loses to the branch with one. As drawn, the C2 methyl and the C3 chloromethyl are both up, so this particular isomer is <b>(Z)-3-(chloromethyl)-4-methylpent-2-ene</b>.',
  note: 'This is the comparison students most often decide by eye. Bulk, mass and the number of atoms in a branch are all irrelevant to CIP; the sets are ordered high to low and read position by position, and the moment they differ the ranking is fixed.',
});

/* ------------------------------------------------------------- 30.4 ---
   Duplicated atoms: the device that makes a double bond comparable with a
   branch, and the sphere where it actually settles something. */
FIGURES.push({
  id: 'ez-duplicate-vinyl',
  section: 'cis-trans-ez',
  anchor: 'Their whole job is to be counted once in the sphere where they appear.</p>\n</div>',
  alt: 'A vinyl group beside an isopropyl group. The vinyl group’s double bond is redrawn with a phantom duplicate carbon on each end, so its attachment carbon counts as carbon, carbon, hydrogen — exactly what the isopropyl attachment carbon holds. One sphere further out the tie breaks: the vinyl terminal carbon counts as carbon, hydrogen, hydrogen while each isopropyl methyl is only hydrogen, hydrogen, hydrogen.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += panel(24, 40, 340, 200, { kind: 'hi' });
    s += tag(194, 30, 'vinyl  –CH=CH₂');
    s += bond(P(150, 110), P(214, 110), { order: 2, rFrom: 15, rTo: 18 });
    s += bond(P(150, 110), P(150, 64), { rFrom: 15, rTo: 17 });
    s += bond(P(214, 110), P(214, 64), { rFrom: 18, rTo: 17 });
    s += bond(P(150, 110), P(104, 140), { rFrom: 15, rTo: 12 });
    s += atom(104, 140, 'H', { r: 12 });
    s += atom(150, 110, 'C');
    s += atom(214, 110, 'CH₂', { r: 18 });
    s += atom(150, 64, '(C)', { kind: 'warn', r: 17 });
    s += atom(214, 64, '(C)', { kind: 'warn', r: 17 });
    s += text(194, 168, 'first sphere:  (C, C, H)', { cls: 'fg-lbl', size: 12 });
    s += text(194, 192, 'that CH₂ then holds (C, H, H)', { cls: 'fg-sm', size: 10.5 });
    s += text(194, 218, 'so vinyl wins one sphere later', { cls: 'fg-tag-good', size: 11 });

    s += panel(396, 40, 340, 200);
    s += tag(566, 30, 'isopropyl  –CH(CH₃)₂');
    s += bond(P(540, 110), P(600, 74), { rFrom: 15, rTo: 17 });
    s += bond(P(540, 110), P(600, 146), { rFrom: 15, rTo: 17 });
    s += bond(P(540, 110), P(494, 110), { rFrom: 15, rTo: 12 });
    s += atom(540, 110, 'C');
    s += atom(600, 74, 'CH₃', { r: 17 });
    s += atom(600, 146, 'CH₃', { r: 17 });
    s += atom(494, 110, 'H', { r: 12 });
    s += text(566, 192, 'first sphere:  (C, C, H)', { cls: 'fg-lbl', size: 12 });
    s += text(566, 218, 'each CH₃ holds only (H, H, H)', { cls: 'fg-sm', size: 10.5 });

    s += rule(24, 254, 736, 254);
    s += text(380, 278, 'Duplication creates the tie; the next sphere out breaks it. Vinyl beats isopropyl.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'What a duplicated atom is for. The vinyl carbon really carries one carbon and one hydrogen, but its partner is doubly bonded, so CIP writes that partner in twice — once real, once as the parenthesized phantom — and the set becomes (C, C, H). That is the same set the isopropyl carbon genuinely holds, so the first sphere is an exact tie and the comparison has to go out one more.',
  note: 'A phantom has no substituents of its own, so when the search reaches one it is a dead end and loses. Duplication is a bookkeeping device that makes a multiple bond comparable with a branch; it is not a way of scoring extra points.',
});

/* ------------------------------------------------------------- 30.5 ---
   Two double bonds, two descriptors, and where the locants go. */
FIGURES.push({
  id: 'ez-diene-locants',
  section: 'cis-trans-ez',
  anchor: 'one label per stereogenic unit, each carrying its locant.</p>\n</div>',
  alt: 'Hexa-2,4-diene drawn as a skeleton with its six carbons numbered. The C2 to C3 double bond has the C1 methyl below it and the C4 chain above it, on opposite sides, which makes it E. The C4 to C5 double bond has the C3 chain and the C6 methyl both below it, on the same side, which makes it Z. As numbered here the name is 2E,4Z-hexa-2,4-diene; because the chain reads the same from either end, IUPAC numbers it from the other end so that Z gets the lower locant, and the preferred name is 2Z,4E-hexa-2,4-diene.',
  viewBox: '0 0 760 300',
  build() {
    const c1 = P(96, 208), c2 = P(142, 182), c3 = P(188, 182),
          c4 = P(234, 156), c5 = P(280, 156), c6 = P(326, 182);
    let s = '';
    s += sk(c1, c2);
    s += skDouble(c2, c3, P(165, 220));
    s += sk(c3, c4);
    s += skDouble(c4, c5, P(257, 118));
    s += sk(c5, c6);
    s += text(96, 230, '1', { cls: 'fg-sm', size: 10 });
    s += text(134, 172, '2', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(196, 172, '3', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(226, 142, '4', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(288, 142, '5', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(326, 204, '6', { cls: 'fg-sm', size: 10 });
    s += text(211, 262, 'CH₃–CH=CH–CH=CH–CH₃', { cls: 'fg-sm', size: 10.5 });

    s += rule(360, 40, 360, 268);

    s += tag(548, 34, 'one descriptor per double bond');
    s += text(396, 92, 'C2=C3:  CH₃ and the C4 chain', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(396, 114, 'sit on opposite sides', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(688, 104, 'E', { cls: 'fg-tag-good', size: 16 });
    s += text(396, 160, 'C4=C5:  the C3 chain and CH₃', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(396, 182, 'sit on the same side', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(688, 172, 'Z', { cls: 'fg-tag-good', size: 16 });
    s += text(548, 226, '(2E,4Z) as numbered here', { cls: 'fg-tag-good', size: 13 });
    s += text(548, 250, 'preferred: (2Z,4E), since Z takes the lower locant', { cls: 'fg-sm', size: 10.5 });
    s += text(380, 292, 'Two stereogenic double bonds, two letters, and both of them go in the name.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'A diene needs a descriptor for every stereogenic double bond it has, and each one carries the locant of the lower-numbered carbon it spans. Both bonds here have one hydrogen and one carbon chain on each of their carbons, so the chain is the higher priority every time and E/Z agrees with trans/cis — which is the ordinary case, not a rule.',
  note: 'The descriptors go inside one set of parentheses at the front of the name, in locant order, exactly as (2R,3S) does for two stereocenters. A name that omits one of them is incomplete, not merely informal.',
});

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


/* ------------------------------------------------------------- 30.6 ---
   The reading is the same for 1,3 and 1,4 as it is for 1,2 — which is easy
   to assert and easy to doubt, so it gets drawn — and the translation into
   axial/equatorial, which flips over on an odd spacing. */
FIGURES.push({
  id: 'ring-cis-trans-locants',
  section: 'cis-trans-ez',
  anchor: 'For naming, the only question asked here is same face or opposite face.</p>',
  alt: 'Two more flat ring drawings. On the left, 1,3-dimethylcyclohexane with both methyl groups on bold wedges, which is the cis isomer. On the right, 1,4-dimethylcyclohexane with one methyl on a wedge and one on a hashed bond, which is the trans isomer. Below them a three-row table giving, for 1,2-, 1,3- and 1,4-disubstituted rings, which of cis and trans puts the two groups one axial and one equatorial and which allows both axial or both equatorial.',
  viewBox: '0 0 760 470',
  build() {
    const verts = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = ((-90 + i * 60) * Math.PI) / 180;
        v.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return v;
    };
    let s = '';

    /* ---- left: cis-1,3, two wedges on carbons one apart ---- */
    s += panel(20, 36, 340, 250, { kind: 'hi' });
    s += tag(190, 26, 'both on a wedge — same face');
    {
      const v = verts(190, 158, 52);
      for (let i = 0; i < 6; i++) s += sk(v[i], v[(i + 1) % 6]);
      const c1 = v[0], c3 = v[2];
      const m1 = P(c1.x, c1.y - 46), m3 = P(c3.x + 40, c3.y + 24);
      s += wedge(c1, m1, { rFrom: 0, rTo: 18 });
      s += wedge(c3, m3, { rFrom: 0, rTo: 18 });
      s += atom(m1.x, m1.y, 'CH₃', { r: 18 });
      s += atom(m3.x, m3.y, 'CH₃', { r: 18 });
      s += text(c1.x - 26, c1.y - 2, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
      s += text(c3.x + 8, c3.y + 34, 'C3', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    }
    s += text(190, 306, 'cis-1,3-dimethylcyclohexane', { cls: 'fg-tag-good', size: 12 });

    /* ---- right: trans-1,4, a wedge and a hash across the ring ---- */
    s += panel(400, 36, 340, 250, { kind: 'warn' });
    s += tag(570, 26, 'one wedge, one hash — opposite faces');
    {
      const v = verts(570, 158, 52);
      for (let i = 0; i < 6; i++) s += sk(v[i], v[(i + 1) % 6]);
      const c1 = v[0], c4 = v[3];
      const m1 = P(c1.x, c1.y - 46), m4 = P(c4.x, c4.y + 46);
      s += wedge(c1, m1, { rFrom: 0, rTo: 18 });
      s += hash(c4, m4, { rFrom: 0, rTo: 18 });
      s += atom(m1.x, m1.y, 'CH₃', { r: 18 });
      s += atom(m4.x, m4.y, 'CH₃', { r: 18 });
      s += text(c1.x - 26, c1.y - 2, 'C1', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
      s += text(c4.x - 26, c4.y + 6, 'C4', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    }
    s += text(570, 306, 'trans-1,4-dimethylcyclohexane', { cls: 'fg-tag-warn', size: 12 });

    /* ---- the chair translation, which is the part that flips over ---- */
    s += rule(40, 330, 720, 330);
    s += text(40, 354, 'in a chair', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(250, 354, 'cis', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    s += text(500, 354, 'trans', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    const ROWS = [
      ['1,2-', 'one axial, one equatorial', 'both equatorial (or both axial)'],
      ['1,3-', 'both equatorial (or both axial)', 'one axial, one equatorial'],
      ['1,4-', 'one axial, one equatorial', 'both equatorial (or both axial)'],
    ];
    ROWS.forEach(([lab, a, b], i) => {
      const y = 382 + i * 26;
      s += text(40, y, lab, { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
      s += text(250, y, a, { cls: 'fg-sm', size: 11, anchor: 'start' });
      s += text(500, y, b, { cls: 'fg-sm', size: 11, anchor: 'start' });
    });
    s += text(380, 462, 'The 1,3- row is the one that trades places. Naming never uses this table — conformational analysis does.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The same wedge-and-hash reading on the two spacings the 1,2- figure did not draw. Two wedges are two groups on the same face, so the 1,3 compound on the left is <b>cis</b> however far apart its methyls are; a wedge and a hash are opposite faces, so the 1,4 compound on the right is <b>trans</b>. The locants change nothing about the test.',
  note: 'The table underneath is a different question, and the row that catches people is the middle one. Axial directions alternate around the ring, so on carbons an <i>even</i> number apart (1,3-) the two axial positions point the same way and cis can be diequatorial, while on carbons an <i>odd</i> number apart (1,2- and 1,4-) they point opposite ways and cis is forced into axial/equatorial. None of that changes cis or trans &mdash; it only decides which conformer is cheap.',
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

/* ------------------------------------------------------------- 230.1 ---
   Succinic anhydride and succinimide. The Cyclic anhydrides paragraph walks a
   diacid through two ring closures and a ring opening in three sentences and
   draws none of the four structures. */
FIGURES.push({
  id: 'succinic-anhydride-imide',
  section: 'acyl-chlorides-anhydrides',
  anchor: 'Heating that loses water again and closes the ring to the <b>imide</b>, as in succinimide and phthalimide.</p>',
  viewBox: '0 0 760 420',
  alt: 'Succinic acid drawn with its two carboxyl groups turned toward each other; heating removes water and closes a five-membered ring, succinic anhydride, with one oxygen between two carbonyls. Ammonia opens the ring at one carbonyl to give an open chain with an amide at one end and a carboxylic acid at the other. Heating again removes water and closes the five-membered ring on nitrogen, giving succinimide, with an N-H between two carbonyls.',
  build() {
    let s = '';
    /* Five ring positions, vertex 0 at the top and the rest clockwise. The
       open-chain compounds use vertices 1 to 4 only, so the four carbons sit
       exactly where they will sit in the ring they are about to close. */
    const five = (cx, cy, r) => Array.from({ length: 5 }, (_, i) => {
      const a = ((-90 + i * 72) * Math.PI) / 180;
      return P(cx + r * Math.cos(a), cy + r * Math.sin(a));
    });
    const out = (c, v, d) => {                      // a point d beyond v, away from the ring centre c
      const L = Math.hypot(v.x - c.x, v.y - c.y);
      return P(v.x + ((v.x - c.x) / L) * d, v.y + ((v.y - c.y) / L) * d);
    };
    const carbonylO = (c, v) => {
      const o = out(c, v, 34);
      return bond(v, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
    };

    /* A closed ring: heteroatom at the top, carbonyls either side of it. */
    const ring = (cx, cy, het, hetR) => {
      const c = P(cx, cy), v = five(cx, cy, 40);
      let g = '';
      g += bond(v[0], v[1], { rFrom: hetR, rTo: 0 });
      g += bond(v[1], v[2], { rFrom: 0, rTo: 0 });
      g += bond(v[2], v[3], { rFrom: 0, rTo: 0 });
      g += bond(v[3], v[4], { rFrom: 0, rTo: 0 });
      g += bond(v[4], v[0], { rFrom: 0, rTo: hetR });
      g += carbonylO(c, v[1]) + carbonylO(c, v[4]);
      for (const q of v.slice(1)) g += atom(q.x, q.y, '', { kind: 'point' });
      g += atom(v[0].x, v[0].y, het, { kind: 'hi', r: hetR });
      return g;
    };

    /* An open chain, C(=O)X–CH2–CH2–C(=O)Y, with X and Y turned inward. */
    const chain = (cx, cy, left, right) => {
      const c = P(cx, cy), v = five(cx, cy, 46);
      let g = '';
      g += bond(v[1], v[2], { rFrom: 0, rTo: 0 });
      g += bond(v[2], v[3], { rFrom: 0, rTo: 0 });
      g += bond(v[3], v[4], { rFrom: 0, rTo: 0 });
      g += carbonylO(c, v[1]) + carbonylO(c, v[4]);
      const a = (-62 * Math.PI) / 180;
      const xl = P(v[4].x + Math.cos(a) * 36, v[4].y + Math.sin(a) * 36);
      const xr = P(v[1].x - Math.cos(a) * 36, v[1].y + Math.sin(a) * 36);
      g += bond(v[4], xl, { rFrom: 0, rTo: left.r });
      g += bond(v[1], xr, { rFrom: 0, rTo: right.r });
      for (const q of v.slice(1)) g += atom(q.x, q.y, '', { kind: 'point' });
      g += atom(xl.x, xl.y, left.l, { r: left.r, kind: left.kind });
      g += atom(xr.x, xr.y, right.l, { r: right.r, kind: right.kind });
      return g;
    };

    const Y1 = 128;
    /* 1. succinic acid */
    s += tag(100, 36, 'SUCCINIC ACID');
    s += chain(100, Y1, { l: 'OH', r: 15 }, { l: 'OH', r: 15 });
    s += text(100, 198, 'a four-carbon diacid', { cls: 'fg-sm', size: 10 });

    s += arrow(P(200, Y1), P(256, Y1));
    s += text(228, Y1 - 12, 'heat', { cls: 'fg-tag', size: 10.5 });
    s += text(228, Y1 + 22, '− H₂O', { cls: 'fg-sm', size: 10 });

    /* 2. succinic anhydride */
    s += tag(346, 36, 'SUCCINIC ANHYDRIDE');
    s += ring(346, Y1 + 4, 'O', 15);
    s += text(346, 198, 'O between two C=O, in a ring', { cls: 'fg-sm', size: 10 });

    s += arrow(P(438, Y1), P(502, Y1));
    s += text(470, Y1 - 12, 'NH₃', { cls: 'fg-tag', size: 10.5 });
    s += text(470, Y1 + 22, 'opens one C=O', { cls: 'fg-sm', size: 10 });

    /* 3. the amic acid */
    s += tag(600, 36, 'THE AMIC ACID');
    s += chain(600, Y1, { l: 'H₂N', r: 17, kind: 'hi' }, { l: 'OH', r: 15 });
    s += text(600, 198, 'an amide and an acid, still tethered', { cls: 'fg-sm', size: 10 });

    /* 4. down to succinimide */
    s += arrow(P(600, 210), P(600, 258));
    s += text(614, 236, 'heat', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(614, 252, '− H₂O', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += ring(600, 318, 'NH', 17);
    s += tag(600, 386, 'SUCCINIMIDE');
    s += text(600, 404, 'N–H between two C=O, in a ring', { cls: 'fg-sm', size: 10 });

    /* The comparison, in the space the L-shaped path leaves. */
    s += panel(40, 238, 440, 124);
    s += text(60, 266, 'Anhydride and imide are the same five-membered ring.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(60, 290, 'Only the atom between the two carbonyls changes: O in the', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(60, 308, 'anhydride, N in the imide. The ring opening in between is an', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(60, 326, 'ordinary acyl substitution whose leaving group, a carboxylate,', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(60, 344, 'stays attached to the product.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The four structures of the paragraph above, in order. The two ring closures are both condensations, each losing one water, and each closes a five-membered ring: the four carbons of the chain plus one heteroatom. Unlabeled corners are CH₂ groups or carbonyl carbons.',
  note: 'Draw the open chains curled, as here, and the ring closure stops being a surprise: the two ends of a four-carbon chain already sit within reach of each other, and joining them through one more atom gives a five-membered ring with almost no strain. A primary amine R–NH₂ in place of ammonia runs the same sequence and gives the N-substituted imide, with R where the H is drawn.',
});

/* ------------------------------------------------------------- 230.2 ---
   The beta-lactam paragraph makes a structural argument (ring size, amide
   planarity, a serine acylated) about three molecules it never draws. */
FIGURES.push({
  id: 'beta-lactam-acylates',
  section: 'esters-amides',
  anchor: 'Penicillin is a β-lactam, and it kills bacteria by acylating a serine in the enzyme that cross-links their cell wall. A normal amide could not do that.</p>',
  viewBox: '0 0 760 566',
  alt: 'Top row: an ordinary amide with a curved arrow from the nitrogen lone pair into the carbonyl, drawn flat; the parent beta-lactam, a four-membered ring of three carbons and an N-H with a carbonyl in the ring, its ring angle marked near 90 degrees; and the penicillin core, the same four-membered ring fused at its nitrogen to a five-membered sulfur-containing ring carrying two methyl groups and a carboxylic acid, with an acylamino side chain on the four-membered ring. Bottom row: the oxygen of a serine side chain attacking the beta-lactam carbonyl with the carbon-nitrogen ring bond breaking, giving the ring-opened drug attached to the serine as an ester, the old ring nitrogen now an N-H in the five-membered ring.',
  build() {
    let s = '';

    /* The penicillin core, placed by its four-membered ring's top-left corner
       C6. The beta-lactam is a 44px square (C6, C5, N4, C7); the thiazolidine
       is a regular pentagon sharing the C5–N4 edge. Stereochemistry is left
       out on purpose — the note says so. */
    const penam = (x0, y0, open) => {
      let g = '';
      const C6 = P(x0, y0), C5 = P(x0 + 44, y0), N4 = P(x0 + 44, y0 + 44), C7 = P(x0, y0 + 44);
      const pc = P(x0 + 44 + 30.28, y0 + 22), R = 37.43;
      const at = (deg) => P(pc.x + R * Math.cos((deg * Math.PI) / 180), pc.y + R * Math.sin((deg * Math.PI) / 180));
      const S1 = at(288), C2 = at(0), C3 = at(72);
      const nR = open ? 17 : 15;
      // thiazolidine
      g += bond(C5, S1, { rFrom: 0, rTo: 15 });
      g += bond(S1, C2, { rFrom: 15, rTo: 0 });
      g += bond(C2, C3, { rFrom: 0, rTo: 0 });
      g += bond(C3, N4, { rFrom: 0, rTo: nR });
      g += bond(N4, C5, { rFrom: nR, rTo: 0 });
      // gem-dimethyl and the acid
      const m1 = P(C2.x + 34, C2.y - 26), m2 = P(C2.x + 34, C2.y + 26);
      g += bond(C2, m1, { rFrom: 0, rTo: 17 }) + atom(m1.x, m1.y, 'CH₃', { r: 17 });
      g += bond(C2, m2, { rFrom: 0, rTo: 17 }) + atom(m2.x, m2.y, 'CH₃', { r: 17 });
      const ac = P(C3.x + 12, C3.y + 40);
      g += bond(C3, ac, { rFrom: 0, rTo: 20 }) + atom(ac.x, ac.y, 'CO₂H', { r: 20 });
      // side chain on C6
      const sc = P(C6.x, C6.y - 42);
      g += bond(C6, sc, { rFrom: 0, rTo: 24 }) + atom(sc.x, sc.y, 'RCONH', { r: 24, size: 9 });
      if (!open) {
        g += bond(C6, C7, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
        g += bond(C7, N4, { rFrom: 0, rTo: nR, cls: 'fg-bond-hi' });
        g += bond(C5, N4, { rFrom: 0, rTo: nR, cls: 'fg-bond-hi' });
        g += bond(C6, C5, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
        const o = P(C7.x - 24, C7.y + 26);
        g += bond(C7, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
        for (const q of [C6, C5, C7, C2, C3]) g += atom(q.x, q.y, '', { kind: 'point' });
        g += atom(N4.x, N4.y, 'N', { kind: 'warn' });
      } else {
        g += bond(C6, C5, { rFrom: 0, rTo: 0 });
        for (const q of [C6, C5, C2, C3]) g += atom(q.x, q.y, '', { kind: 'point' });
        g += atom(N4.x, N4.y, 'NH', { r: 17, kind: 'hi' });
      }
      g += atom(S1.x, S1.y, 'S');
      return { html: g, C6, C5, N4, C7 };
    };

    /* ---- top row ---- */
    s += panel(16, 48, 216, 216);
    s += panel(244, 48, 216, 216, { kind: 'hi' });
    s += panel(472, 48, 264, 216, { kind: 'hi' });
    s += tag(124, 36, 'AN ORDINARY AMIDE');
    s += tag(352, 36, 'THE β-LACTAM RING');
    s += tag(604, 36, 'PENICILLIN');

    /* (a) An ordinary amide, drawn the way the resonance figure above draws
       DMF: flat, with the lone pair pushing into the carbonyl. */
    {
      const c = P(92, 128), o = P(92, 72), r = P(36, 162), nA = P(148, 162);
      const h = P(204, 128), rr = P(148, 218);
      s += bond(c, o, { order: 2 });
      s += bond(c, r); s += bond(c, nA);
      s += bond(nA, h, { rTo: 10 }); s += bond(nA, rr);
      s += atom(o.x, o.y, 'O'); s += lonePair(o.x, o.y, 200); s += lonePair(o.x, o.y, 340);
      s += atom(r.x, r.y, 'R');
      s += atom(h.x, h.y, 'H', { r: 10 });
      s += atom(rr.x, rr.y, 'R′', { r: 15 });
      s += atom(nA.x, nA.y, 'N', { kind: 'hi' });
      s += lonePair(nA.x, nA.y, 140);
      s += atom(c.x, c.y, 'C', { kind: 'hi' });
      s += curve(P(126, 182), P(118, 148), { bow: 14 });
      s += curve(P(102, 108), P(108, 86), { bow: -10 });
      s += text(124, 254, 'flat: the N lone pair is shared', { cls: 'fg-sm', size: 10 });
    }

    /* (b) Azetidin-2-one, the parent ring: C2 carbonyl bottom-left, N1–H
       bottom-right, the same corners the penicillin core uses. */
    {
      const C3 = P(330, 108), C4 = P(380, 108), N1 = P(380, 158), C2 = P(330, 158);
      s += bond(C3, C4, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
      s += bond(C4, N1, { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' });
      s += bond(N1, C2, { rFrom: 17, rTo: 0, cls: 'fg-bond-hi' });
      s += bond(C2, C3, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
      const o = P(C2.x - 26, C2.y + 26);
      s += bond(C2, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
      for (const q of [C3, C4, C2]) s += atom(q.x, q.y, '', { kind: 'point' });
      s += atom(N1.x, N1.y, 'NH', { r: 17 });
      // the ring angle at the carbonyl carbon
      s += `<path class="fg-dash-hi" fill="none" d="M${C2.x} ${C2.y - 14} A14 14 0 0 1 ${C2.x + 14} ${C2.y}"></path>`;
      s += text(356, 138, '≈90°', { cls: 'fg-tag-warn', size: 10.5 });
      s += text(352, 212, 'a four-membered cyclic amide', { cls: 'fg-sm', size: 10 });
      s += text(352, 230, 'the C=O carbon wants 120°', { cls: 'fg-sm', size: 10 });
      s += text(352, 244, 'and is held near 90°', { cls: 'fg-sm', size: 10 });
    }

    /* (c) The penicillin core. */
    {
      const p = penam(542, 120, false);
      s += p.html;
      s += text(604, 254, 'N is shared by both rings: pyramidal', { cls: 'fg-tag-warn', size: 10 });
    }

    s += rule(24, 282, 736, 282);

    /* ---- bottom row: the serine opens the ring ---- */
    s += tag(380, 306, 'THE ENZYME’S SERINE OPENS THE RING');
    {
      const p = penam(176, 386, false);
      s += p.html;
      // the serine: Enz–CH2–O–H, oxygen aimed at C7
      const oS = P(112, 420), hS = P(112, 378);
      s += text(86, 425, 'Enz–CH₂', { cls: 'fg-lbl', size: 12, anchor: 'end' });
      s += bond(P(88, 420), oS, { rFrom: 0, rTo: 15 });
      s += bond(oS, hS, { rFrom: 15, rTo: 10 });
      s += atom(hS.x, hS.y, 'H', { r: 10 });
      s += atom(oS.x, oS.y, 'O', { kind: 'hi' });
      s += lonePair(oS.x, oS.y, -10, { dist: 21 });
      s += curve(P(134, 414), P(170, 426), { bow: -12 });
      s += curve(P(190, 434), P(206, 440), { bow: 12 });
      s += text(176, 530, 'attack at the C=O; the ring C–N bond breaks', { cls: 'fg-sm', size: 10 });
      s += text(176, 546, '(through the tetrahedral intermediate, not drawn)', { cls: 'fg-sm', size: 9.5 });
    }
    s += arrow(P(350, 430), P(402, 430), { muted: true });

    {
      /* The acyl-enzyme: C7 now hangs off C6 as an ester carbonyl, and the
         old ring nitrogen has taken a proton. */
      const x1 = 566, y1 = 398;
      const p = penam(x1, y1, true);
      s += p.html;
      const C7 = P(x1 - 42, y1 + 24);
      s += bond(p.C6, C7, { rFrom: 0, rTo: 0 });
      const o = P(C7.x, C7.y + 44);
      s += bond(C7, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
      const oE = P(C7.x - 42, C7.y - 22);
      s += bond(C7, oE, { rFrom: 0, rTo: 15, cls: 'fg-bond-hi' }) + atom(oE.x, oE.y, 'O', { kind: 'hi' });
      s += atom(C7.x, C7.y, '', { kind: 'point' });
      s += text(oE.x - 18, oE.y + 5, 'Enz–CH₂', { cls: 'fg-lbl', size: 12, anchor: 'end' });
      s += text(566, 530, 'an ester on the serine: the enzyme is acylated,', { cls: 'fg-sm', size: 10 });
      s += text(566, 546, 'and this ester hydrolyzes only very slowly', { cls: 'fg-sm', size: 9.5 });
    }
    return s;
  },
  caption: 'Three amides, and why the last two are not like the first. An ordinary amide is flat so that the nitrogen lone pair can overlap the C=O &pi; system. The four-membered ring holds the carbonyl carbon near 90&deg; instead of its preferred 120&deg;, and in penicillin the nitrogen is also part of a second ring, which forces it pyramidal and turns its lone pair away from the carbonyl. The highlighted bonds are the four-membered ring.',
  note: 'Read the bottom row as ordinary acyl substitution with an unusual leaving group. The serine oxygen adds to the carbonyl, and the group expelled is the ring nitrogen, which stays attached because it is still part of the five-membered ring. Opening the ring releases its strain, which is what pays for expelling an amide nitrogen. Proton transfers are left out, and so is penicillin’s stereochemistry: it has three stereocenters, none of which changes here.',
});

/* ------------------------------------------------------------- 230.3 ---
   Reading a polymer backwards. The section gives three rules and a worked
   example in prose; this draws the rules, on polymers other than the one the
   worked example solves. */
FIGURES.push({
  id: 'polymer-disconnection',
  section: 'polymer-design',
  anchor: 'If the difference is not a whole number of waters, the disconnection is wrong.</div>',
  viewBox: '0 0 760 556',
  alt: 'Three polymers taken back to their monomers. Polypropylene: the repeat unit CH2–CH(CH3) in brackets, the two bonds that cross the brackets highlighted, and an open arrow to propene. PET: a stretch of chain with squiggles through the three carbonyl-to-oxygen bonds and a dashed mark labeled not here on an oxygen-to-CH2 bond; open arrows lead to ethylene glycol and terephthalic acid. Nylon 6,6: a stretch of chain with squiggles through the three carbonyl-to-nitrogen bonds; open arrows lead to hexamethylenediamine and adipic acid.',
  build() {
    let s = '';
    const brack = (x, y, h, dir) => {
      const t = y - h / 2, b = y + h / 2;
      return `<path class="fg-bond" d="M${x + 10 * dir} ${t} L${x} ${t} L${x} ${b} L${x + 10 * dir} ${b}"></path>`;
    };
    /* Labelled groups left to right; `gap` is the visible bond length. */
    const place = (x0, items, gap = 30) => {
      const out = [];
      let x = x0;
      for (const it of items) {
        x = out.length ? x + out[out.length - 1].r + gap + it.r : x + it.r;
        out.push({ x, ...it });
      }
      return out;
    };
    const run = (y, ps, cuts, ends) => {
      let o = '';
      o += text(ps[0].x - ps[0].r - 12, y + 5, '~', { cls: 'fg-lbl', size: 14, anchor: 'end' });
      o += text(ps[ps.length - 1].x + ps[ps.length - 1].r + 12, y + 5, '~', { cls: 'fg-lbl', size: 14, anchor: 'start' });
      for (let i = 0; i < ps.length - 1; i++) o += bond(P(ps[i].x, y), P(ps[i + 1].x, y), { rFrom: ps[i].r, rTo: ps[i + 1].r });
      for (const p of ps) o += atom(p.x, y, p.l, { r: p.r, size: p.size ?? (p.l.length > 3 ? 9 : p.l.length > 2 ? 9.5 : 12), kind: p.kind });
      for (const i of cuts) {
        const a = P(ps[i].x + ps[i].r, y), b = P(ps[i + 1].x - ps[i + 1].r, y);
        o += squiggle(a, b, { half: 18 });
      }
      return o;
    };

    /* ---- 1. addition: polypropylene back to propene ---- */
    s += tag(40, 36, 'ONLY CARBON IN THE BACKBONE', { anchor: 'start' });
    {
      const y = 80;
      s += brack(70, y, 56, 1);
      s += bond(P(56, y), P(112, y), { rFrom: 0, rTo: 18, cls: 'fg-bond-hi' });
      s += bond(P(112, y), P(176, y), { rFrom: 18, rTo: 15 });
      s += bond(P(176, y), P(232, y), { rFrom: 15, rTo: 0, cls: 'fg-bond-hi' });
      s += brack(218, y, 56, -1);
      s += text(228, y + 26, 'n', { cls: 'fg-lbl', size: 12, anchor: 'start' });
      s += bond(P(176, y), P(176, y + 44), { rFrom: 15, rTo: 17 });
      s += atom(112, y, 'CH₂', { r: 18 });
      s += atom(176, y, 'CH', { r: 15 });
      s += atom(176, y + 44, 'CH₃', { r: 17 });
      s += openArrow(P(270, y), P(334, y));
      s += bond(P(380, y), P(444, y), { order: 2, rFrom: 18, rTo: 15 });
      s += bond(P(444, y), P(444, y + 44), { rFrom: 15, rTo: 17 });
      s += atom(380, y, 'CH₂', { r: 18 });
      s += atom(444, y, 'CH', { r: 15 });
      s += atom(444, y + 44, 'CH₃', { r: 17 });
      s += text(412, y + 76, 'propene', { cls: 'fg-tag-good', size: 11 });
      s += text(500, y - 16, 'highlighted: the bonds that', { cls: 'fg-sm', size: 10, anchor: 'start' });
      s += text(500, y, 'cross the brackets, which', { cls: 'fg-sm', size: 10, anchor: 'start' });
      s += text(500, y + 16, 'the polymerization made.', { cls: 'fg-sm', size: 10, anchor: 'start' });
      s += text(500, y + 32, 'The bond between them was', { cls: 'fg-sm', size: 10, anchor: 'start' });
      s += text(500, y + 48, 'the C=C. Put it back.', { cls: 'fg-sm', size: 10, anchor: 'start' });
      s += text(144, y + 76, 'polypropylene', { cls: 'fg-sm', size: 10 });
    }
    s += rule(24, 176, 736, 176);

    /* ---- 2. a polyester: PET ---- */
    s += tag(40, 204, 'AN ESTER IN THE BACKBONE', { anchor: 'start' });
    {
      const y = 246;
      const ps = place(70, [
        { l: 'CO', r: 17 }, { l: 'O', r: 15 }, { l: 'CH₂CH₂', r: 29 }, { l: 'O', r: 15 },
        { l: 'CO', r: 17 }, { l: 'C₆H₄', r: 25 }, { l: 'CO', r: 17 }, { l: 'O', r: 15 },
      ]);
      s += run(y, ps, [0, 3, 6]);
      // the wrong cut: oxygen to CH2
      const wa = ps[1].x + ps[1].r, wb = ps[2].x - ps[2].r, wm = (wa + wb) / 2;
      s += `<line class="fg-dash" x1="${wm}" y1="${y - 18}" x2="${wm}" y2="${y + 18}"></line>`;
      s += text(wm, y - 26, 'not here', { cls: 'fg-tag-warn', size: 10 });
      s += text((ps[0].x + ps[1].x) / 2, y + 36, 'cut', { cls: 'fg-tag', size: 10 });
      s += text((ps[3].x + ps[4].x) / 2, y + 36, 'cut', { cls: 'fg-tag', size: 10 });
      s += text((ps[6].x + ps[7].x) / 2, y + 36, 'cut', { cls: 'fg-tag', size: 10 });
      s += text(ps[5].x, y + 36, 'para', { cls: 'fg-sm', size: 9.5 });
      const diolX = ps[2].x, acidX = ps[5].x;
      s += openArrow(P(diolX, y + 44), P(diolX, y + 80));
      s += openArrow(P(acidX, y + 44), P(acidX, y + 80));
      s += text(diolX, y + 102, 'HO–CH₂CH₂–OH', { cls: 'fg-lbl', size: 12 });
      s += text(diolX, y + 118, 'ethylene glycol, a diol', { cls: 'fg-tag-good', size: 10 });
      s += text(acidX, y + 102, 'HO₂C–C₆H₄–CO₂H', { cls: 'fg-lbl', size: 12 });
      s += text(acidX, y + 118, 'terephthalic acid, a diacid', { cls: 'fg-tag-good', size: 10 });
      s += text(736, 204, 'cut C(=O)–O: OH to the carbonyl, H to the O', { cls: 'fg-sm', size: 10, anchor: 'end' });
    }
    s += rule(24, 380, 736, 380);

    /* ---- 3. a polyamide: nylon 6,6 ---- */
    s += tag(40, 408, 'AN AMIDE IN THE BACKBONE', { anchor: 'start' });
    {
      const y = 444;
      const ps = place(70, [
        { l: 'CO', r: 17 }, { l: 'NH', r: 18 }, { l: '(CH₂)₆', r: 28 }, { l: 'NH', r: 18 },
        { l: 'CO', r: 17 }, { l: '(CH₂)₄', r: 28 }, { l: 'CO', r: 17 }, { l: 'NH', r: 18 },
      ], 26);
      s += run(y, ps, [0, 3, 6]);
      const amX = ps[2].x, acX = ps[5].x;
      s += openArrow(P(amX, y + 26), P(amX, y + 52));
      s += openArrow(P(acX, y + 26), P(acX, y + 52));
      s += text(amX, y + 74, 'H₂N–(CH₂)₆–NH₂', { cls: 'fg-lbl', size: 12 });
      s += text(amX, y + 90, 'hexamethylenediamine, a diamine', { cls: 'fg-tag-good', size: 10 });
      s += text(acX, y + 74, 'HO₂C–(CH₂)₄–CO₂H', { cls: 'fg-lbl', size: 12 });
      s += text(acX, y + 90, 'adipic acid, a diacid', { cls: 'fg-tag-good', size: 10 });
      s += text(736, 408, 'cut C(=O)–N: OH to the carbonyl, H to the N', { cls: 'fg-sm', size: 10, anchor: 'end' });
    }
    return s;
  },
  caption: 'Three polymers read backwards. For a carbon-only backbone, the bonds that cross the repeat-unit brackets are the ones the polymerization made, and the bond between them goes back to a C=C. For a polyester or polyamide, draw enough chain to show two full linkages, cut at every carbonyl-to-heteroatom bond, and check that each piece has two reactive ends.',
  note: 'The PET row repeats the arithmetic from the box above: the cut stretch contains two ester linkages per repeat unit, so the diol and the diacid together weigh two waters more than the repeat unit. The dashed mark shows the cut to avoid: cut every O–CH₂ bond instead and both oxygens stay with the acid piece, leaving a CH₂CH₂ piece with no oxygen on either end and so no reactive site at all. The nylon row is nylon 6,6, and its pieces are hexamethylenediamine and adipic acid.',
});


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
