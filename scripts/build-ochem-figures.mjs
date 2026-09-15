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

     node scripts/build-ochem-figures.mjs            write
     node scripts/build-ochem-figures.mjs --check    fail if stale (CI)
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atom, bond, arrow, curve, lonePair, text, tag, label, rule, panel, bar, figure, P } from './lib/ochem-figure.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');

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

/* ------------------------------------------------------------------ 2 ---
   The fork. This one idea joins Module 9 to Module 10, and neither section
   draws it. */
FIGURES.push({
  id: 'tetrahedral-fork',
  section: 'nucleophilic-addition',
  anchor: '<h3>The universal mechanism</h3>',
  alt: 'The tetrahedral intermediate branching to addition when there is no leaving group and to substitution when there is',
  viewBox: '0 0 730 380',
  build() {
    let s = '';
    // Starting carbonyl
    const c = P(120, 130), o = P(120, 74), lg = P(176, 158);
    s += bond(c, o, { order: 2 });
    s += atom(o.x, o.y, 'O');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += bond(c, lg, { rTo: 15 });
    s += atom(lg.x, lg.y, 'L');
    s += text(120, 176, 'L = anything', { cls: 'fg-sm', size: 9.5 });
    s += curve(P(56, 150), P(108, 140), { bow: -18 });
    s += text(40, 138, 'Nu⁻', { cls: 'fg-lbl', size: 12 });

    s += arrow(P(216, 130), P(276, 130));

    // The tetrahedral intermediate
    const tc = P(340, 130), to = P(340, 74), tl = P(396, 158);
    s += bond(tc, to);
    s += atom(to.x, to.y, 'O⁻', { kind: 'warn' });
    s += atom(tc.x, tc.y, 'C', { kind: 'hi' });
    s += bond(tc, tl, { rTo: 15 });
    s += atom(tl.x, tl.y, 'L');
    s += bond(tc, P(284, 158), { rTo: 14 });
    s += atom(284, 158, 'Nu');
    s += tag(340, 44, 'tetrahedral intermediate');

    s += rule(452, 40, 452, 360);

    // Branch A: no leaving group -> addition
    s += tag(586, 40, 'L cannot leave  →  ADDITION');
    const ac = P(560, 104);
    s += bond(ac, P(560, 62));
    s += atom(560, 62, 'OH');
    s += atom(ac.x, ac.y, 'C', { kind: 'hi' });
    s += bond(ac, P(508, 130), { rTo: 14 });
    s += atom(508, 130, 'Nu');
    s += text(566, 152, 'H⁺ picks up the O⁻ — the carbonyl is gone', { cls: 'fg-sm', size: 10 });
    s += text(566, 170, 'aldehydes and ketones', { cls: 'fg-tag-good', size: 10.5 });

    // Branch B: leaving group -> substitution
    s += tag(586, 214, 'L can leave  →  SUBSTITUTION');
    const bc = P(560, 276), bo = P(560, 234);
    s += bond(bc, bo, { order: 2 });
    s += atom(bo.x, bo.y, 'O');
    s += atom(bc.x, bc.y, 'C', { kind: 'hi' });
    s += bond(bc, P(508, 302), { rTo: 14 });
    s += atom(508, 302, 'Nu');
    s += curve(P(596, 292), P(640, 300), { bow: 16, muted: true });
    s += text(660, 306, 'L⁻', { cls: 'fg-sm', size: 11, anchor: 'start' });
    s += text(566, 332, 'the C=O comes back', { cls: 'fg-sm', size: 10 });
    s += text(566, 350, 'esters, amides, acid chlorides', { cls: 'fg-tag-good', size: 10.5 });
    return s;
  },
  caption: 'One mechanism, then a fork. Every nucleophile that meets a carbonyl does the same two things — attack the carbon, push the pi electrons onto oxygen — and arrives at the same <b>tetrahedral intermediate</b>. What happens next is decided entirely by whether the carbon is carrying a group that can leave.',
  note: 'This is why aldehydes and ketones give alcohols and esters and amides give other acid derivatives, and it is one fact rather than two: with nothing to expel, the alkoxide simply grabs a proton and the carbonyl is gone for good; with a leaving group attached, the oxygen pushes back down, kicks it out, and the C=O is restored. Everything in Module 10 is the right-hand branch.',
});

/* ------------------------------------------------------------------ 3 ---
   Where the enolate's nucleophilic character actually lives. */
FIGURES.push({
  id: 'enolate-resonance',
  section: 'alpha-hydrogens',
  anchor: '<h3>Why: delocalization into the carbonyl</h3>',
  alt: 'The two resonance forms of an enolate, with the carbon-centred form doing the chemistry',
  viewBox: '0 0 660 250',
  build() {
    let s = '';
    const draw = (ox, negOnO) => {
      const ca = P(ox, 150), cb = P(ox + 74, 150), o = P(ox + 74, 92);
      let g = '';
      g += bond(ca, cb, { order: negOnO ? 2 : 1 });
      g += bond(cb, o, { order: negOnO ? 1 : 2 });
      g += atom(o.x, o.y, negOnO ? 'O⁻' : 'O', { kind: negOnO ? 'warn' : 'plain' });
      g += atom(cb.x, cb.y, 'C');
      g += atom(ca.x, ca.y, negOnO ? 'C' : 'C⁻', { kind: negOnO ? 'plain' : 'warn' });
      g += text(ox, 196, negOnO ? 'charge on oxygen' : 'charge on carbon', { cls: 'fg-sm', size: 10.5 });
      return g;
    };
    s += tag(140, 48, 'the form that is more stable');
    s += tag(500, 48, 'the form that does the chemistry');
    s += draw(100, true);
    s += draw(460, false);

    // Double-headed resonance arrow
    s += arrow(P(300, 140), P(352, 140), { muted: true });
    s += arrow(P(352, 140), P(300, 140), { muted: true });

    s += text(140, 218, 'oxygen is more electronegative,', { cls: 'fg-sm', size: 10 });
    s += text(140, 232, 'so it holds the charge better', { cls: 'fg-sm', size: 10 });
    s += text(500, 218, 'carbon is the better nucleophile,', { cls: 'fg-sm', size: 10 });
    s += text(500, 232, 'so this is the end that attacks', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'An enolate is one species with its charge spread over two atoms, and the two resonance forms are not equally useful. The oxygen form is the better description of where the electrons <b>are</b>; the carbon form is the better description of what the enolate <b>does</b>.',
  note: 'This is the single most useful thing to hold onto in Module 11. Every enolate reaction — aldol, Claisen, alkylation — is the alpha carbon attacking something, even though a charge drawn on oxygen is the more stable picture. More stable and more reactive point in opposite directions here, and the reactive end is the one that shows up in the products.',
});

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
      { x: 560, name: 'Amide',      sub: 'R(C=O)–NH₂', pkb: 'conj. acid pKa ≈ 0', verdict: 'pulled onto oxygen', kind: 'warn', w: 20 },
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

/* ------------------------------------------------------------------ 7 ---
   The chain, drawn as a chain. The reason propagation is a cycle and
   termination is not is a fact about radical counts, and a loop says it
   better than three paragraphs can. */
FIGURES.push({
  id: 'radical-chain',
  section: 'radical-halogenation',
  anchor: '<h3>Three stages, and only one of them repeats</h3>',
  alt: 'Initiation, the two propagation steps drawn as a cycle, and termination, labelled by what each does to the radical count',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    // Initiation
    s += tag(112, 44, 'INITIATION');
    s += label(112, 92, 'X–X', { size: 14 });
    s += arrow(P(112, 108), P(112, 150));
    s += text(150, 132, 'hv or heat', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += label(112, 176, 'X•  +  X•', { size: 14 });
    s += text(112, 214, 'radicals: 0 → 2', { cls: 'fg-tag-good', size: 10.5 });
    s += text(112, 236, 'happens rarely, and', { cls: 'fg-sm', size: 9.5 });
    s += text(112, 250, 'only has to happen once', { cls: 'fg-sm', size: 9.5 });
    s += rule(224, 40, 224, 300);

    // Propagation, as a cycle
    s += tag(400, 44, 'PROPAGATION');
    const a = P(400, 104), b = P(400, 216);
    s += panel(288, 82, 224, 44, { kind: 'hi' });
    s += panel(288, 194, 224, 44, { kind: 'hi' });
    s += label(400, 109, 'X•  +  R–H  →  R•  +  H–X', { size: 12.5 });
    s += label(400, 221, 'R•  +  X–X  →  R–X  +  X•', { size: 12.5 });
    // The loop: down the right, back up the left.
    s += curve(P(516, 104), P(516, 216), { bow: -40 });
    s += curve(P(284, 216), P(284, 104), { bow: -40 });
    s += text(400, 168, 'each step uses one radical and makes one', { cls: 'fg-sm', size: 10 });
    s += text(400, 268, 'radicals: 2 → 2, so the cycle never stops itself', { cls: 'fg-tag-good', size: 10.5 });
    s += text(400, 292, 'net:  R–H  +  X₂  →  R–X  +  H–X', { cls: 'fg-lbl', size: 12 });
    s += rule(576, 40, 576, 300);

    // Termination
    s += tag(668, 44, 'TERMINATION');
    s += label(668, 96, 'X•  +  X•  →  X–X', { size: 11.5 });
    s += label(668, 130, 'R•  +  X•  →  R–X', { size: 11.5 });
    s += label(668, 164, 'R•  +  R•  →  R–R', { size: 11.5 });
    s += text(668, 214, 'radicals: 2 → 0', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(668, 236, 'rare while it runs —', { cls: 'fg-sm', size: 9.5 });
    s += text(668, 250, 'two radicals have to meet', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Sort the steps by what each does to the <b>number of radicals in the flask</b>, and the three stages name themselves. Up from zero is initiation, unchanged is propagation, down to zero is termination.',
  note: 'The middle panel is the reaction; the other two only start and stop it. Because each propagation step consumes one radical and produces one, the pair runs as a loop, and a single initiation event can turn over thousands of molecules before two radicals happen to collide and end it. That is also why the second propagation step is not termination even though the product appears there — the product is not what distinguishes the stages, the radical count is.',
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

/* ---------------------------------------------------------------------- */
const START = (id) => `<!-- fig:${id}:start -->`;
const END = (id) => `<!-- fig:${id}:end -->`;

let wrote = 0;
const stale = [];
for (const def of FIGURES) {
  const file = join(ROOT, 'ochem', 'notes', `${def.section}.html`);
  if (!existsSync(file)) {
    console.error(`FAIL: ${def.id} targets ochem/notes/${def.section}.html, which does not exist.`);
    process.exit(1);
  }
  const current = readFileSync(file, 'utf8');
  const html = figure({
    viewBox: def.viewBox,
    alt: def.alt,
    caption: def.caption,
    note: def.note,
    body: def.build(),
  });
  const block = `${START(def.id)}\n${html}\n${END(def.id)}`;

  let next;
  const a = current.indexOf(START(def.id));
  const b = current.indexOf(END(def.id));
  if (a !== -1 && b !== -1) {
    next = current.slice(0, a) + block + current.slice(b + END(def.id).length);
  } else {
    const at = current.indexOf(def.anchor);
    if (at === -1) {
      console.error(`FAIL: ${def.id} could not find its anchor in ochem/notes/${def.section}.html: ${def.anchor}`);
      process.exit(1);
    }
    const insert = at + def.anchor.length;
    next = current.slice(0, insert) + '\n' + block + current.slice(insert);
  }

  if (next === current) continue;
  if (check) { stale.push(def.id); continue; }
  writeFileSync(file, next);
  wrote++;
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
