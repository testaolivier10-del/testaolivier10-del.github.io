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
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, figure, P } from './lib/ochem-figure.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');

const FIGURES = [];

/* A double bond inside a ring, or on a skeleton whose ends carry something
   else. `bond(a, b, { order: 2 })` draws two full-length lines either side of
   the axis, which is right for an isolated C=C and wrong the moment the
   vertices are shared: the second line runs past the corner and hangs over
   the neighbouring bond, and where a dashed forming-bond arrives at the same
   vertex the two cross. A ring chemist draws the second line short and on the
   inside instead, so this does that — one full line along the bond, one
   inset line offset toward `inward`. */
function ringDouble(a, b, inward, opts = {}) {
  const gap = opts.gap ?? 4.6;
  const inset = opts.inset ?? 12;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  let px = -uy, py = ux;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  if ((inward.x - mx) * px + (inward.y - my) * py < 0) { px = -px; py = -py; }
  const A = P(a.x + ux * inset + px * gap, a.y + uy * inset + py * gap);
  const B = P(b.x - ux * inset + px * gap, b.y - uy * inset + py * gap);
  return bond(a, b, { rFrom: 0, rTo: 0, cls: opts.cls }) +
         bond(A, B, { rFrom: 0, rTo: 0, cls: opts.cls });
}

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
  note: 'This is why aldehydes and ketones give alcohols and esters and amides give other acid derivatives, and it is one fact rather than two: with nothing to expel, the alkoxide simply grabs a proton and the carbonyl is gone for good; with a leaving group attached, the oxygen pushes back down, kicks it out, and the C=O is restored. Everything in <a class="chapter-ref" href="/ochem/learn.html#m-carboxylic-acids">Carboxylic Acids &amp; Derivatives</a> is the right-hand branch.',
});

/* ------------------------------------------------------------------ 3 ---
   Where the enolate's nucleophilic character actually lives. */
FIGURES.push({
  id: 'enolate-resonance',
  section: 'alpha-hydrogens',
  anchor: '<h3>Why: delocalization into the carbonyl</h3>',
  alt: 'The two resonance forms of an enolate, with the carbon-centered form doing the chemistry',
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
  note: 'This is the single most useful thing to hold onto in <a class="chapter-ref" href="/ochem/learn.html#m-enolate-chemistry">Enolate Chemistry</a>. Every enolate reaction — aldol, Claisen, alkylation — is the alpha carbon attacking something, even though a charge drawn on oxygen is the more stable picture. More stable and more reactive point in opposite directions here, and the reactive end is the one that shows up in the products.',
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
  alt: 'Initiation, the two propagation steps drawn as a cycle, and termination, labeled by what each does to the radical count',
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
  viewBox: '0 0 760 320',
  alt: 'Three C18 fatty acid chains drawn as they pack: straight saturated chains, kinked cis chains that cannot stack, and near-straight trans chains',
  build() {
    let s = '';
    // A zigzag chain from (x, y) running down, optionally kinked at the middle.
    const chain = (x, y, kink) => {
      let t = '', px = x, py = y, dir = 1;
      for (let i = 0; i < 12; i++) {
        let nx = px + dir * 9, ny = py + 13;
        if (kink && i === 6) { x += 26; nx = px + dir * 9 + 26; }
        t += `<line class="fg-bond" x1="${px}" y1="${py}" x2="${nx}" y2="${ny}"></line>`;
        px = nx; py = ny; dir = -dir;
      }
      return t;
    };
    const col = (ox, title, sub, kink, mp, kind) => {
      s += panel(ox, 40, 216, 184, { kind });
      s += tag(ox + 108, 30, title);
      for (let j = 0; j < 4; j++) s += chain(ox + 40 + j * 34, 58, kink);
      s += text(ox + 108, 242, sub, { cls: 'fg-sm', size: 10 });
      s += text(ox + 108, 264, mp, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11 });
    };
    col(24,  'saturated', 'chains lie flat against each other', 'melts near 69 °C', false, null);
    col(272, 'one cis double bond', 'the kink breaks the contact', 'melts near 13 °C', true, 'warn');
    col(520, 'one trans double bond', 'still essentially straight', 'melts near 44 °C', false, null);

    s += rule(34, 282, 726, 282);
    s += text(380, 306, 'All three are C18. Only the shape differs — and the shape is what the melting point reads.', { cls: 'fg-lbl', size: 12 });
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


/* ------------------------------------------------------------------ A1 ---
   The trap the prose names but cannot show: the longest chain is very often
   not the row lying across the page. Two traces of one skeleton is the only
   honest way to make that claim, because the reader who cannot already see
   the seven-carbon path is exactly the reader the sentence is for. */
FIGURES.push({
  id: 'parent-chain-trace',
  section: 'naming-parent-chain',
  anchor: '<h3>When two chains tie</h3>',
  alt: 'One eight-carbon skeleton traced two ways: the horizontal five-carbon row, and the seven-carbon path that turns a corner',
  viewBox: '0 0 760 360',
  build() {
    let s = '';
    /* One skeleton, drawn twice at the same coordinates so the two traces are
       comparable at a glance. `ox` shifts the whole thing into its panel. */
    const skeleton = (ox, traced, nums, branchLabel) => {
      const R = [P(ox + 50, 210), P(ox + 92, 186), P(ox + 134, 210), P(ox + 176, 186), P(ox + 218, 210)];
      /* The branch leans back over the start of the row rather than arcing
         across it. Drawn the other way its third carbon ended up one bond
         length above C4, and the skeleton read as a closed six-membered ring
         — a reader could see cyclohexane where there is none. */
      const B = [P(ox + 92, 138), P(ox + 54, 112), P(ox + 54, 64)];
      const links = [
        ['R0R1', R[0], R[1]], ['R1R2', R[1], R[2]], ['R2R3', R[2], R[3]], ['R3R4', R[3], R[4]],
        ['R1B1', R[1], B[0]], ['B1B2', B[0], B[1]], ['B2B3', B[1], B[2]],
      ];
      let t = '';
      // Every bond in plain ink first, then the traced ones over the top.
      for (const [, a, b] of links) t += bond(a, b, { rFrom: 0, rTo: 0 });
      for (const [k, a, b] of links) {
        if (traced.includes(k)) t += bond(a, b, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
      }
      // Locants ride on one line above the skeleton so none of them lands on
      // a bond; the branch carbons get theirs above the branch.
      for (const [x, y, v] of nums) t += text(ox + x, y, v, { cls: 'fg-lbl', size: 11 });
      t += text(ox + 50, 236, branchLabel[0], { cls: 'fg-sm', size: 9.5 });
      t += text(ox + 150, 92, branchLabel[1], { cls: 'fg-sm', size: 9.5 });
      return t;
    };

    s += panel(24, 44, 250, 224, { kind: 'warn' });
    s += tag(149, 32, 'the row you can see');
    s += skeleton(30, ['R0R1', 'R1R2', 'R2R3', 'R3R4'],
      [[50, 236, '1'], [92, 212, '2'], [134, 236, '3'], [176, 212, '4'], [218, 236, '5']],
      ['', 'a three-carbon branch']);

    s += panel(396, 44, 250, 224, { kind: 'hi' });
    s += tag(521, 32, 'the path that turns a corner');
    s += skeleton(402, ['B2B3', 'B1B2', 'R1B1', 'R1R2', 'R2R3', 'R3R4'],
      [[30, 68, '1'], [30, 116, '2'], [64, 146, '3'], [92, 212, '4'], [134, 236, '5'], [176, 212, '6'], [218, 236, '7']],
      ['methyl', '']);

    s += text(149, 292, 'five carbons, one propyl branch', { cls: 'fg-sm', size: 10 });
    s += text(149, 314, '2-propylpentane', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(149, 332, 'no such compound name \u2014 a longer chain exists', { cls: 'fg-sm', size: 9.5 });
    s += text(521, 292, 'seven carbons, one methyl branch', { cls: 'fg-sm', size: 10 });
    s += text(521, 314, '4-methylheptane', { cls: 'fg-tag-good', size: 11.5 });
    s += text(521, 332, 'correct \u2014 nothing longer runs through the molecule', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'The same eight carbons, traced twice. The five-carbon row is what the drawing puts in front of you; the seven-carbon parent runs up into the branch and back along the row, and it is a longer continuous path through exactly the same skeleton.',
  note: 'Both traces are legal paths \u2014 neither jumps a gap or reuses a carbon \u2014 so the rule is not "is this a chain?" but "is anything longer?". The check that catches it is to start at every end carbon in turn and count the longest route out. There are three ends here, and only one pair of them is seven carbons apart.',
});

/* ------------------------------------------------------------------ A2 ---
   Alphabetical order is the one rule in the section that produces a
   silently wrong answer, because a list sorted the obvious way still looks
   sorted. A before/after strip is the comparison: the same five names,
   filed by the letter you see and filed by the letter that counts. */
FIGURES.push({
  id: 'alphabetize-filing',
  section: 'naming-substituents',
  anchor: '<h3>The order in which the rules apply</h3>',
  alt: 'Five substituent names with the letter each files under, then the same five sorted by first letter and sorted correctly',
  viewBox: '0 0 760 350',
  build() {
    let s = '';
    const cols = [
      { x: 84,  name: 'tert-butyl',       rule: 'tert- is ignored',   letter: 'b', counts: false },
      { x: 220, name: 'dimethyl',         rule: 'di- is ignored',     letter: 'm', counts: false },
      { x: 356, name: 'ethyl',            rule: 'nothing to strip',   letter: 'e', counts: true  },
      { x: 492, name: 'isopropyl',        rule: 'iso is part of it',  letter: 'i', counts: true  },
      { x: 628, name: 'cyclohexyl',       rule: 'cyclo is part of it', letter: 'c', counts: true },
    ];
    s += tag(380, 36, 'what each name files under');
    for (const c of cols) {
      s += label(c.x, 74, c.name, { size: 12.5 });
      s += text(c.x, 96, c.rule, { cls: c.counts ? 'fg-tag-good' : 'fg-tag-warn', size: 9.5 });
      s += atom(c.x, 128, c.letter, { kind: 'hi', r: 15 });
    }
    s += rule(34, 160, 726, 160);

    // The same five names, sorted two ways. The rows are the whole figure:
    // both look sorted, and only one is.
    const row = (y, heading, order, kind) => {
      s += text(70, y, heading, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', size: 10.5, anchor: 'start' });
      order.forEach((nm, i) => {
        s += label(150 + i * 124, y + 30, nm, { size: 12 });
        if (i) s += text(150 + i * 124 - 62, y + 30, '\u00b7', { cls: 'fg-sm', size: 12 });
      });
    };
    row(196, 'sorted by the first letter printed', ['cyclohexyl', 'dimethyl', 'ethyl', 'isopropyl', 'tert-butyl'], 'warn');
    row(276, 'sorted by the letter it files under', ['tert-butyl', 'cyclohexyl', 'ethyl', 'isopropyl', 'dimethyl'], 'good');
    return s;
  },
  caption: 'Five substituents, filed. A multiplying prefix (<i>di-</i>) and an italic structural prefix (<i>tert-</i>) are stripped before the name is alphabetized; <i>iso</i> and <i>cyclo</i> are not, because they are joined to the word rather than hyphenated off it.',
  note: 'The two rows are the reason this matters. Both are in alphabetical order by some reading, both look finished, and only the lower one is right \u2014 <i>tert</i>-butyl moves from last to first and dimethyl from second to last. The typography is the tell: if the prefix is hyphenated and italic, cross it out before you sort.',
});

/* ------------------------------------------------------------------ A3 ---
   "Priority beats length" is stated in one sentence and is the hardest
   consequence of the priority order to believe, because it asks the reader
   to reject the longest chain after having spent a whole section learning
   to find it. Two traces of one molecule settle it. */
FIGURES.push({
  id: 'parent-must-contain',
  section: 'naming-functional-groups',
  anchor: '<h3>The common names that never went away</h3>',
  alt: 'One alcohol traced twice: the six-carbon chain that misses the OH, and the five-carbon chain through it that is the real parent',
  viewBox: '0 0 760 390',
  build() {
    let s = '';
    const skeleton = (ox, traced, nums, extra, extraAnchor = 'middle') => {
      const a = [P(ox + 50, 174), P(ox + 86, 152), P(ox + 122, 174), P(ox + 158, 152), P(ox + 194, 174), P(ox + 230, 152)];
      const b1 = P(ox + 122, 216), oh = P(ox + 122, 258);
      const links = [
        ['a0', a[0], a[1]], ['a1', a[1], a[2]], ['a2', a[2], a[3]], ['a3', a[3], a[4]], ['a4', a[4], a[5]],
        ['br', a[2], b1],
      ];
      let t = '';
      for (const [, p, q] of links) t += bond(p, q, { rFrom: 0, rTo: 0 });
      for (const [k, p, q] of links) {
        if (traced.includes(k)) t += bond(p, q, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
      }
      // The OH is drawn on both sides; it is the same molecule twice.
      t += bond(b1, oh, { rFrom: 0, rTo: 15, cls: traced.includes('oh') ? 'fg-bond-hi' : 'fg-bond' });
      t += atom(oh.x, oh.y, 'OH', { kind: traced.includes('oh') ? 'hi' : 'plain' });
      for (const [x, y, v] of nums) t += text(ox + x, y, v, { cls: 'fg-lbl', size: 11 });
      for (const [x, y, v] of extra) t += text(ox + x, y, v, { cls: 'fg-sm', size: 9.5, anchor: extraAnchor });
      return t;
    };

    /* Both panels sit inside the left 90% of the canvas: the right-hand one
       carries the answer, and past that the reading column has scrolled it
       off. The OH note is anchored to the right of its own disc rather than
       centred over it, which is what had it sitting on the label. */
    s += panel(20, 64, 300, 224, { kind: 'warn' });
    s += tag(170, 52, 'the longest chain in the molecule');
    s += skeleton(26, ['a0', 'a1', 'a2', 'a3', 'a4'],
      [[50, 130, '1'], [86, 130, '2'], [122, 130, '3'], [158, 130, '4'], [194, 130, '5'], [230, 130, '6']],
      [[144, 250, 'the OH is off the chain']], 'start');

    s += panel(370, 64, 300, 224, { kind: 'hi' });
    s += tag(520, 52, 'the longest chain through the OH');
    s += skeleton(376, ['br', 'a2', 'a3', 'a4', 'oh'],
      [[122, 130, '2'], [158, 130, '3'], [194, 130, '4'], [230, 130, '5'], [96, 220, '1']],
      [[68, 130, 'ethyl']]);

    s += rule(20, 300, 670, 300);
    s += text(170, 322, 'six carbons \u2014 the longest path there is', { cls: 'fg-sm', size: 10 });
    s += text(170, 344, '3-(hydroxymethyl)hexane', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(170, 364, 'demotes the alcohol to a prefix, which is not allowed', { cls: 'fg-sm', size: 9.5 });
    s += text(520, 322, 'five carbons \u2014 shorter, and it contains the OH', { cls: 'fg-sm', size: 10 });
    s += text(520, 344, '2-ethylpentan-1-ol', { cls: 'fg-tag-good', size: 11.5 });
    s += text(520, 364, 'the alcohol takes the suffix and C1', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'One molecule, two candidate parents. The six-carbon chain on the left is genuinely the longest path through the skeleton and it is still the wrong parent, because it does not pass through the carbon carrying the \u2013OH.',
  note: 'The left-hand name is not a typo; it is what you get by applying the previous section\u2019s rule and nothing else, and the alcohol ends up as a <i>hydroxymethyl</i> prefix. That is the tell. If the highest-priority group in your molecule has turned into a prefix and there was no group above it, you picked the parent chain before you ranked the groups.',
});

/* ------------------------------------------------------------------ A4 ---
   Numbering a ring has no left end to start from, and the section says so
   and then asks the reader to go round "in whichever direction gives the
   lowest locants". Two rings numbered in opposite directions is that
   sentence made checkable. */
FIGURES.push({
  id: 'ring-numbering-direction',
  section: 'naming-rings-unsaturation',
  anchor: '<h3>Cis, trans, E and Z \u2014 a forward reference</h3>',
  alt: 'One methylcyclohexene numbered clockwise and counterclockwise, both giving the double bond carbons 1 and 2 and the methyl 3 or 6',
  viewBox: '0 0 760 376',
  build() {
    let s = '';
    /* Vertex 0 is the top; the double bond runs from vertex 0 to vertex 1 and
       the methyl sits on vertex 2, so it is adjacent to an alkene carbon.
       `order` lists which locant each vertex receives, which is the only
       thing that differs between the two panels. */
    const ring = (cx, order) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const ang = (-90 + i * 60) * Math.PI / 180;
        v.push(P(cx + Math.cos(ang) * 56, 170 + Math.sin(ang) * 56));
      }
      let t = '';
      for (let i = 0; i < 6; i++) {
        if (i === 0) t += ringDouble(v[i], v[1], P(cx, 170));
        else t += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      }
      // The methyl stub points straight out from the center.
      const m = v[2];
      const ux = (m.x - cx) / 56, uy = (m.y - 170) / 56;
      t += bond(m, P(m.x + ux * 38, m.y + uy * 38), { rFrom: 0, rTo: 16 });
      t += atom(m.x + ux * 38, m.y + uy * 38, 'CH\u2083', { r: 16 });
      // Locants sit inside the ring, where the methyl cannot collide with them.
      for (let i = 0; i < 6; i++) {
        const ux2 = (v[i].x - cx) / 56, uy2 = (v[i].y - 170) / 56;
        t += text(cx + ux2 * 33, 170 + uy2 * 33 + 4, String(order[i]), { cls: 'fg-lbl', size: 11 });
      }
      return t;
    };

    /* The pair is centred on the part of the canvas the reading column
       actually shows, not on the canvas: the right-hand panel carries the
       answer and past about 0.9 of the width it is behind a scroll. */
    s += panel(44, 76, 248, 196, { kind: 'warn' });
    s += tag(168, 64, 'round one way');
    s += ring(168, [2, 1, 6, 5, 4, 3]);

    s += panel(404, 76, 248, 196, { kind: 'hi' });
    s += tag(528, 64, 'round the other');
    s += ring(528, [1, 2, 3, 4, 5, 6]);

    s += text(168, 298, 'methyl lands on C6', { cls: 'fg-sm', size: 10 });
    s += text(168, 320, '6-methylcyclohex-1-ene', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(528, 298, 'methyl lands on C3', { cls: 'fg-sm', size: 10 });
    s += text(528, 320, '3-methylcyclohex-1-ene', { cls: 'fg-tag-good', size: 11.5 });

    s += rule(34, 336, 662, 336);
    s += text(348, 360, 'Both give the double bond 1 and 2. Only the methyl separates them, and 3 beats 6.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The same methylcyclohexene, numbered in both directions. A ring has no end to start from, so the double bond is placed first \u2014 it takes C1 and C2 either way \u2014 and the direction is then settled by whichever substituent is left.',
  note: 'Note the order of operations, which is the same one chains use. The double bond is the senior feature present, so it fixes the locant pair before the methyl is consulted at all; the methyl only chooses between the two numberings that survive. Had the ring carried an \u2013OH, the OH would have taken C1 and the double bond would have had to accept whatever locant followed.',
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
         minority figures spilled onto the neighbouring colour and read as
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
  anchor: '<h3>Why 3\u00B0 alcohols cannot be oxidized</h3>',
  alt: 'The carbon oxidation ladder, with the one-carbon example, the count of bonds to heteroatoms, and the functional group families sharing each rung',
  viewBox: '0 0 760 392',
  build() {
    let s = '';
    const rows = [
      { y: 84,  n: '4', ex: 'CO\u2082',   ox: '+4',      fam: 'CO\u2082   \u00B7   CCl\u2084' },
      { y: 140, n: '3', ex: 'HCO\u2082H', ox: '+2',      fam: 'carboxylic acid \u00B7 ester \u00B7 amide \u00B7 acid chloride \u00B7 nitrile' },
      { y: 196, n: '2', ex: 'CH\u2082O',  ox: '0',       fam: 'aldehyde \u00B7 ketone \u00B7 acetal \u00B7 imine' },
      { y: 252, n: '1', ex: 'CH\u2083OH', ox: '\u22122', fam: 'alcohol \u00B7 ether \u00B7 alkyl halide \u00B7 amine', hi: true },
      { y: 308, n: '0', ex: 'CH\u2084',   ox: '\u22124', fam: 'alkane' },
    ];
    /* The families column is the widest thing here and the acid rung's list
       is the widest row in it, so it is set from a left edge rather than
       centred: centred, it started underneath the oxidation-state column and
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
  anchor: '<h3>Ozonolysis: cutting the double bond in half</h3>',
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
    const skeleton = (cx, enone) => {
      const b = P(cx - 66, 150), a = P(cx - 16, 178), k = P(cx + 34, 150);
      let g = '';
      g += bond(b, a, { order: enone ? 2 : 1 });
      g += bond(a, k);
      g += bond(k, P(cx + 34, 100), { order: 2 });
      g += bond(k, P(cx + 82, 178));
      g += atom(cx + 34, 100, 'O');
      g += atom(cx + 82, 178, 'R');
      g += atom(b.x, b.y, 'C');
      g += atom(a.x, a.y, 'C');
      g += atom(k.x, k.y, 'C', { kind: 'hi' });
      g += text(cx - 66, 124, '\u03B2', { cls: 'fg-lbl', size: 12 });
      g += text(cx - 44, 196, '\u03B1', { cls: 'fg-lbl', size: 12 });
      return g;
    };

    /* The three panels are pulled inside the left 90% of the canvas: at 512
       the third one's border, its R and the reagent line under it were all
       behind the reading column's horizontal scroll. */
    const col = (x, title, enone, reagents, product) => {
      const cx = x + 108;
      s += panel(x, 52, 216, 244);
      s += tag(cx, 40, title);
      s += skeleton(cx, enone);
      s += text(cx, 268, reagents, { cls: 'fg-sm', size: 10 });
      s += text(cx, 288, product, { cls: 'fg-tag-good', size: 10.5 });
      return cx;
    };

    // At the carbonyl carbon: the nucleophile comes in from outside.
    let cx = col(16, 'at the carbonyl carbon', false, 'RMgBr, RLi, \u207BCN, acetylide', 'an alcohol');
    s += curve(P(cx + 34, 232), P(cx + 34, 172), { bow: 14 });
    s += label(cx + 34, 248, 'Nu\u207B', { size: 12 });

    // At the alpha carbon: the molecule itself is the nucleophile.
    cx = col(240, 'at the \u03B1 carbon', false, 'base first, then RX or a carbonyl', 'alkylation, aldol, Claisen');
    s += curve(P(cx - 16, 196), P(cx - 16, 230), { bow: 12 });
    s += label(cx - 16, 250, 'E\u207A', { size: 12 });
    s += text(cx, 74, 'base takes an \u03B1 H first', { cls: 'fg-sm', size: 9 });

    // At the beta carbon: only an enone offers this one.
    cx = col(464, 'at the \u03B2 carbon', true, 'enolate + an enone (Michael)', '1,5-dicarbonyl');
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
    s += text(480, 278, 'and back with H\u2083O\u207A or BH\u2083', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

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
    s += text(30, 242, 'dilute, warm', { cls: 'fg-sm', anchor: 'start', size: 9.5 });

    s += text(212, 154, 'comes off \u2014 the O\u2013H is back', { cls: 'fg-tag-good', size: 11 });
    s += text(212, 174, 'Si\u2013F is exceptionally strong', { cls: 'fg-sm', size: 9.5 });
    s += text(548, 154, 'untouched', { cls: 'fg-tag-mut', size: 11 });
    s += text(548, 174, 'fluoride has nothing to do here', { cls: 'fg-sm', size: 9.5 });

    s += text(212, 222, 'untouched', { cls: 'fg-tag-mut', size: 11 });
    s += text(212, 242, 'wants fluoride, not acid', { cls: 'fg-sm', size: 9.5 });
    s += text(548, 222, 'comes off \u2014 the C=O is back', { cls: 'fg-tag-good', size: 11 });
    s += text(548, 242, 'an equilibrium; water reverses it', { cls: 'fg-sm', size: 9.5 });

    s += text(380, 292, 'Each key ignores the other mask \u2014 so they come off in whichever order you need.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Orthogonality is this grid having two blanks in it. Neither deprotection is selective by being gentle; they are selective because fluoride and aqueous acid have nothing in common, so a molecule can carry both masks at once and be unmasked in whichever order the route needs.',
  note: 'The diagonal is what makes protecting groups plannable rather than a gamble. It also sets the trap the section warns about: because the acetal answers to aqueous acid, it cannot be carried through any later step that needs aqueous acid for its own reasons. And note that the silyl ether in the bottom-left cell is the bulky TBS one \u2014 a trimethylsilyl ether is small enough that mild aqueous acid takes it off too, and the grid would lose its blank.',
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
       answer this figure exists to give, and with the last ring centred at
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
  alt: 'The tetrahedral intermediate from an ester collapsing to a ketone in the flask, against the dianion from a carboxylate which cannot collapse until workup',
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

/* ----------------------------------------------------------------- 39 ---
   Two products from one mechanism, split by a count. Drawing the shared
   cation once and branching from it shows that nothing differs until the
   very last proton. */
FIGURES.push({
  id: 'imine-or-enamine',
  section: 'imines-enamines',
  anchor: '<h3>Why the pH has to be about 4.5</h3>',
  viewBox: '0 0 760 340',
  alt: 'One iminium cation branching to an imine when a hydrogen remains on nitrogen and to an enamine when the proton must come from the alpha carbon',
  build() {
    let s = '';
    s += panel(250, 44, 260, 76, { kind: 'hi' });
    s += text(380, 76, 'C=N⁺  —  the shared cation', { cls: 'fg-lbl', size: 12.5 });
    s += text(380, 100, 'identical for both amines', { cls: 'fg-sm', size: 10 });

    s += arrow(P(320, 126), P(200, 172));
    s += arrow(P(440, 126), P(560, 172));

    const branch = (cx, title, from, prod, note, kind) => {
      s += panel(cx - 150, 178, 300, 94, { kind });
      s += text(cx, 202, title, { cls: 'fg-tag', size: 11 });
      s += text(cx, 226, from, { cls: 'fg-sm', size: 10.5 });
      s += text(cx, 250, prod, { cls: 'fg-lbl', size: 13 });
      s += text(cx, 292, note, { cls: 'fg-sm', size: 10 });
    };
    branch(190, 'primary amine — one H left on N', 'lose the proton from nitrogen', 'C=N–R   an imine',
           'the nitrogen still had one to give', null);
    branch(570, 'secondary amine — none left', 'lose it from the α carbon instead', 'C=C–NR₂   an enamine',
           'so the double bond lands between carbons', 'hi');

    s += rule(34, 308, 726, 308);
    s += text(380, 330, 'A tertiary amine reaches neither: with no N–H at all there is no way out of the cation.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Both amines give the same iminium cation, and everything up to that point is identical. What separates the two products is where the last proton can come from — the nitrogen, if it still has one, and otherwise the α carbon.',
  note: 'This is why the answer is a count rather than a mechanism. You do not need to run the steps: look at how many hydrogens the nitrogen brought and subtract the one it spends reaching the cation. Two becomes one, so a primary amine gives an imine; one becomes none, so a secondary amine has to take the alpha proton instead. A tertiary amine brings none, which is why it can add and still give nothing, and why tertiary amines appear in these reactions as bases.',
});

/* ----------------------------------------------------------------- 40 ---
   Three condensations that students memorize separately are one skill:
   count the gap. Putting the three products on one line, aligned by their
   oxygen-bearing carbons, makes the spacing the visible thing. */
FIGURES.push({
  id: 'condensation-spacing',
  section: 'michael-robinson',
  anchor: '<h3>Why a doubly stabilized donor</h3>',
  viewBox: '0 0 760 330',
  alt: 'The products of an aldol, a Claisen and a Michael addition aligned to show their one, three and five carbon spacings',
  build() {
    let s = '';
    const chain = (y, n, marks, name, tag2, kind) => {
      const x0 = 150, dx = 52;
      for (let i = 0; i < n; i++) {
        const p = P(x0 + i * dx, y);
        const m = marks[i];
        s += atom(p.x, p.y, m || '', { kind: m ? (kind === 'warn' ? 'warn' : 'hi') : 'point', r: m ? 15 : 0 });
        if (i) s += bond(P(x0 + (i - 1) * dx, y), p, { rFrom: marks[i - 1] ? 15 : 0, rTo: m ? 15 : 0 });
      }
      s += label(30, y + 4, name, { anchor: 'start', size: 12 });
      s += text(x0 + (n - 1) * dx + 70, y + 4, tag2, { cls: 'fg-tag-good', size: 11 });
    };
    s += tag(300, 46, 'the two oxygen-bearing carbons, and the gap between them');
    chain(96,  3, ['O', null, 'OH'], 'Aldol',   'β-hydroxy', null);
    chain(160, 3, ['O', null, 'O'],  'Claisen', '1,3', null);
    chain(224, 5, ['O', null, null, null, 'O'], 'Michael', '1,5', null);

    s += rule(34, 258, 726, 258);
    s += text(380, 284, 'Count the carbons between them and the reaction names itself — forwards to predict', { cls: 'fg-lbl', size: 12 });
    s += text(380, 306, 'a product, backwards to disconnect one. A 1,5-dicarbonyl is the Michael retron.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Three condensations, three spacings. An aldol’s nucleophile hits a carbonyl carbon and the oxygen stays as an alcohol; a Claisen’s hits an ester and the alkoxide leaves; a Michael’s hits a β carbon, two positions further along, which is what pushes the two carbonyls to 1,5.',
  note: 'Spacing survives every change of conditions, which is what makes it worth learning instead of the conditions. It is also what makes a Robinson annulation predictable: a 1,5-dicarbonyl has its ends exactly far enough apart to close a six-membered ring, so the product is a cyclohexenone without anyone having chosen the ring size.',
});

/* ----------------------------------------------------------------- 41 ---
   The whole point of these two syntheses is a pKa difference, and a number
   line makes twelve orders of magnitude look like twelve orders of
   magnitude rather than like two numbers. */
FIGURES.push({
  id: 'activating-pka',
  section: 'ester-syntheses',
  anchor: '<h3>Malonic ester synthesis &rarr; a carboxylic acid</h3>',
  viewBox: '0 0 760 300',
  alt: 'A pKa scale from 10 to 26 showing an ester at 25 and malonate and acetoacetate near 11 to 13, with the base each one needs',
  build() {
    let s = '';
    const x = (pka) => 90 + ((26 - pka) / 16) * 580;
    s += rule(80, 186, 690, 186);
    for (let p = 10; p <= 26; p += 4) {
      s += rule(x(p), 186, x(p), 193);
      s += text(x(p), 208, String(p), { cls: 'fg-sm', size: 10 });
    }
    s += text(385, 230, 'α pKₐ', { cls: 'fg-tag', size: 11 });

    const mark = (pka, name, base, kind, up) => {
      const px = x(pka);
      s += rule(px, up ? 92 : 132, px, 186);
      s += panel(px - 84, up ? 56 : 96, 168, 36, { kind });
      s += text(px, up ? 74 : 114, name, { cls: 'fg-lbl', size: 11.5 });
      s += text(px, up ? 46 : 86, base, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 10.5 });
    };
    mark(25, 'a plain ester',       'needs LDA, and it fights back', 'warn', true);
    mark(13, 'diethyl malonate',    'NaOEt is enough', null, true);
    mark(11, 'ethyl acetoacetate',  'NaOEt is enough', null, false);

    s += rule(34, 248, 726, 248);
    s += text(380, 274, 'Twelve orders of magnitude, bought with one extra carbonyl — which is then thrown away.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'What the second carbonyl is for. An ester’s α hydrogen sits at pKa 25, where the only bases strong enough will also attack the ester; flanking that carbon with a second carbonyl delocalizes the carbanion onto a second oxygen and drops it to 11 to 13, where the alkoxide matching your solvent does the job.',
  note: 'The carbonyl that made this possible is gone from the product. It was installed to acidify one hydrogen and is removed by hydrolysis and decarboxylation once the alkylation is done — which is what an activating group is, and the clearest example of one in the course. Note also that the decarboxylation works only because the intermediate is a β-keto acid, able to reach a six-membered cyclic transition state.',
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
  note: 'The product is the <b>unconjugated</b> diene in both cases, which is the less stable of the two and the sign that this is kinetic control: protonation happens fastest where the charge density is highest, and stability never gets a vote. The same alternation of electron and proton runs the Na/NH₃ reduction of an alkyne to a <i>trans</i> alkene, one chapter earlier.',
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
  caption: 'The count that runs the whole chapter. One reactive site makes a single bond and stops; two extends a line; three or more ties the lines to each other in every direction, which is what a network is. Count one functional group per site for a step-growth monomer and one C=C for a chain-growth one — counted that way, a vinyl monomer has two sites and divinylbenzene, with two C=C, is the cross-linker.',
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
  viewBox: '0 0 760 300',
  alt: 'A temperature axis with the glass transition below the melting temperature, marking the glassy, rubbery and molten regions',
  build() {
    let s = '';
    const zones = [
      { x: 40,  w: 210, lab: 'glassy',  sub: 'amorphous regions frozen',   kind: 'warn' },
      { x: 250, w: 230, lab: 'rubbery or tough', sub: 'amorphous regions mobile', kind: 'hi' },
      { x: 480, w: 220, lab: 'molten',  sub: 'crystalline regions melted', kind: 'hi'   },
    ];
    for (const z of zones) {
      s += bar(z.x, 96, z.w, 56, { kind: z.kind, opacity: 0.3 });
      s += text(z.x + z.w / 2, 122, z.lab, { cls: 'fg-lbl', size: 13 });
      s += text(z.x + z.w / 2, 142, z.sub, { cls: 'fg-sm', size: 10 });
    }
    s += arrow(P(40, 180), P(700, 180));
    s += text(370, 204, 'temperature', { cls: 'fg-tag', size: 11 });

    s += rule(250, 66, 250, 180);
    s += text(250, 58, 'Tₑ — the glass transition', { cls: 'fg-tag-good', size: 11 });
    s += rule(480, 66, 480, 180);
    s += text(480, 58, 'Tₘ — melting', { cls: 'fg-tag-good', size: 11 });

    s += rule(24, 230, 700, 230);
    s += text(360, 254, 'Essentially every polymer has a Tₑ: some of the sample is always amorphous.', { cls: 'fg-lbl', size: 12 });
    s += text(360, 276, 'Only a semicrystalline one also has a Tₘ.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Two transitions, describing two different parts of the same sample. The glass transition is where the tangled amorphous regions stop being frozen; the melting temperature is where the packed crystalline regions come apart. A fully amorphous polymer simply has no Tₘ.',
  note: 'How soft it gets above Tₑ depends on how much crystallinity is left holding the sample: with little of it you get rubber, while HDPE, PET and nylon are all far above their Tₑ at room temperature and stay rigid, because the crystallites act as physical cross-links up to Tₘ. Natural rubber is the clean case — cool it in liquid nitrogen, take it below Tₑ, and the same material shatters like glass because its chains can no longer move.',
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
/* ----------------------------------------------------------------- 53 ---
   The hydration table is four numbers spanning four orders of magnitude, and
   a bar chart is the only honest way to show that: 0.1 against 99.9 is not a
   difference a table communicates. The two causes are written under the axis
   because every bar is explained by some mixture of them. */
FIGURES.push({
  id: 'hydration-spread',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Why the hydrate matters even though it is a minor species</h3>',
  viewBox: '0 0 760 320',
  alt: 'Four bars of increasing length showing percent hydrate for acetone, acetaldehyde, formaldehyde and chloral',
  build() {
    let s = '';
    // A log-ish scale: linear in percent would make the first two invisible.
    const rows = [
      { lab: 'acetone, (CH\u2083)\u2082C=O', pct: '0.1%',   w: 14,  why: 'two methyls: crowded and fed',      kind: 'warn' },
      { lab: 'acetaldehyde, CH\u2083CHO',    pct: '~50%',   w: 210, why: 'one methyl',                        kind: null   },
      { lab: 'formaldehyde, H\u2082C=O',     pct: '~99.9%', w: 400, why: 'no alkyl group at all',             kind: null   },
      { lab: 'chloral, CCl\u2083CHO',        pct: '~100%',  w: 430, why: 'three chlorines pulling; isolable', kind: null   },
    ];
    let y = 62;
    for (const r of rows) {
      s += text(24, y + 4, r.lab, { cls: 'fg-lbl', size: 12, anchor: 'start' });
      s += bar(250, y - 11, r.w, 18, { kind: r.kind === 'warn' ? 'warn' : 'hi', opacity: 0.3 + r.w / 700 });
      s += text(250 + r.w + 8, y + 4, r.pct, { cls: 'fg-tag-good', size: 11, anchor: 'start' });
      s += text(24, y + 22, r.why, { cls: 'fg-sm', size: 10.5, anchor: 'start' });
      y += 52;
    }
    s += rule(24, 262, 700, 262);
    s += text(360, 286, 'Sterics: the sp\u00b2 carbon becomes sp\u00b3, and 120\u00b0 closes to 109\u00b0.', { cls: 'fg-lbl', size: 12 });
    s += text(360, 308, 'Electronics: alkyl groups feed the C=O; withdrawing groups starve it.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The reactivity order of the chapter, with numbers on it. Aldehyde beats ketone toward every nucleophile, and hydration is where you can see how large the gap actually is \u2014 three orders of magnitude between acetone and formaldehyde, from nothing more than removing two methyl groups.',
  note: 'The two causes usually agree, which is what makes the trend so reliable \u2014 and the interesting cases are the ones where they do not. Hexafluoroacetone is more crowded than acetone and essentially completely hydrated, because six fluorines outweigh the crowding. Cyclopropanone is fully hydrated for the opposite reason again: the ring already strains the sp\u00b2 carbon, so addition relieves strain instead of creating it, and the steric argument runs backwards.',
});

/* ----------------------------------------------------------------- 54 ---
   The point students miss is that the oxidant never sees the carbonyl. Drawing
   the hydrate on the path, with the fork for wet against dry conditions,
   turns the Jones/PCC rule from something memorized into something read. */
FIGURES.push({
  id: 'oxidant-sees-the-hydrate',
  section: 'aldehyde-oxidation',
  anchor: '<h3>Tollens\' reagent and the silver mirror</h3>',
  viewBox: '0 0 760 300',
  alt: 'Three boxes in a row: an aldehyde, then its hydrate, then the carboxylic acid, with the wet and dry conditions listed beneath',
  build() {
    let s = '';
    const box = (x, w, kind, title, sub) => {
      s += panel(x, 58, w, 74, { kind });
      s += text(x + w / 2, 88, title, { cls: 'fg-lbl', size: 13 });
      s += text(x + w / 2, 110, sub, { cls: 'fg-sm', size: 10.5 });
    };
    box(24,  190, null,   'R\u2013CHO',        'no O\u2013H to grip');
    box(286, 190, 'warn', 'R\u2013CH(OH)\u2082', 'an alcohol, in effect');
    box(548, 188, null,   'R\u2013COOH',       'oxidized a second time');

    s += arrow(P(214, 95), P(286, 95));
    s += text(250, 78, '+ H\u2082O', { cls: 'fg-tag', size: 11 });
    s += arrow(P(476, 95), P(548, 95));
    s += text(512, 78, '[O]', { cls: 'fg-tag', size: 11 });

    s += rule(24, 168, 700, 168);
    s += text(24, 196, 'Jones, Cr(VI) in aqueous acid', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 216, 'water present \u2192 the hydrate keeps re-forming \u2192 runs to the acid', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(24, 244, 'PCC in anhydrous CH\u2082Cl\u2082', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 264, 'no water \u2192 no hydrate \u2192 nothing left to attack, so it stops', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(24, 292, 'A ketone stops at the first box: its carbonyl carbon has no hydrogen to remove.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    return s;
  },
  caption: 'The step everyone skips. An oxidant needs an O\u2013H and a C\u2013H on the same carbon, and a C=O offers neither \u2014 so what is actually attacked is the hydrate. That single box is the whole difference between a reagent that stops at the aldehyde and one that does not.',
  note: 'The same argument explains a sugar. A cyclic hemiacetal holds only a trace of the open-chain aldehyde, and yet glucose gives a full silver mirror, because the equilibrium delivers that trace continuously and the oxidant consumes it as fast as it appears. A species can be present in traces and still control the product, provided it is the only form that can react.',
});

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

/* ----------------------------------------------------------------- 57 ---
   The whole section is one substituent effect read in two directions, which is
   a thing a diagram can show and a paragraph has to assert. Two columns, the
   same halogen in both, opposite arrows out of it. */
FIGURES.push({
  id: 'one-effect-two-directions',
  section: 'alpha-halogenation',
  anchor: '<h3>The haloform reaction</h3>',
  viewBox: '0 0 760 300',
  alt: 'Two columns comparing the acid route through the enol, which stops, with the base route through the enolate, which does not',
  build() {
    let s = '';
    const col = (x, kind, title, sub) => {
      s += panel(x, 46, 330, 150, { kind });
      s += text(x + 165, 74, title, { cls: 'fg-lbl', size: 13 });
      s += text(x + 165, 94, sub, { cls: 'fg-sm', size: 10.5 });
    };
    col(24,  null,   'ACID \u2014 through the enol', 'slow step: making the enol');
    col(406, 'warn', 'BASE \u2014 through the enolate', 'slow step: removing the proton');

    const line = (x, y, t, cls) => s += text(x, y, t, { cls, size: 11, anchor: 'start' });
    line(44,  124, 'needs the carbonyl to be BASIC', 'fg-tag');
    line(44,  146, 'the new halogen withdraws \u2192', 'fg-sm');
    line(44,  166, 'harder to protonate \u2192 slower', 'fg-tag-good');
    line(44,  186, 'STOPS at one halogen', 'fg-tag-good');

    line(426, 124, 'needs the \u03b1 protons ACIDIC', 'fg-tag');
    line(426, 146, 'the new halogen withdraws \u2192', 'fg-sm');
    line(426, 166, 'more acidic \u2192 faster', 'fg-tag');
    line(426, 186, 'KEEPS GOING while \u03b1-H remain', 'fg-tag');

    s += rule(24, 224, 700, 224);
    s += text(24, 250, 'The halogen does the same thing in both columns. Only the requirement differs.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 274, 'On a METHYL ketone the runaway is the point: CX\u2083 is a leaving group hydroxide can expel.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 296, 'Out come the carboxylate and CHX\u2083 \u2014 one carbon shorter than you started.', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'Two mechanisms, one substituent effect, opposite results. It is worth reading the two middle lines together: they are the same sentence, and everything after them diverges only because one route needs the substrate to be a base and the other needs it to be an acid.',
  note: 'The iodoform test rests on the right-hand column and on a distinction the name hides. It reports a CH\u2083CO or CH\u2083CH(OH) fragment, not a methyl group anywhere in the molecule \u2014 so 2-methylcyclohexanone, which has a methyl and is a ketone, is negative, because neither of its \u03b1 carbons is that methyl. It brominates happily and simply never forms a CX\u2083 to expel.',
});

/* ----------------------------------------------------------------- 58 ---
   Students memorize the kinetic recipe as a list of four conditions. Drawing
   the molecule with an arrow to each side, and the conditions attached to the
   arrows rather than listed underneath, makes the recipe read as a
   consequence of which side you want. */
FIGURES.push({
  id: 'which-alpha-carbon',
  section: 'enolate-regiochemistry',
  anchor: '<h3>The same switch, one step earlier</h3>',
  viewBox: '0 0 760 300',
  alt: 'An unsymmetrical ketone in the middle with arrows to the less substituted enolate on one side and the more substituted enolate on the other',
  build() {
    let s = '';
    s += panel(286, 116, 190, 70, {});
    s += text(381, 144, '2-methylcyclohexanone', { cls: 'fg-lbl', size: 12 });
    s += text(381, 166, 'C6 open \u00b7 C2 carries the methyl', { cls: 'fg-sm', size: 10 });

    s += arrow(P(280, 140), P(200, 88));
    s += arrow(P(482, 140), P(562, 88));

    s += panel(24, 40, 220, 92, {});
    s += text(40, 64, 'KINETIC \u2014 at C6', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(40, 84, 'LDA, 1 eq, \u221278 \u00b0C, THF', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(40, 102, 'ketone added to the base', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(40, 122, 'less substituted C=C', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += panel(518, 40, 220, 92, { kind: 'warn' });
    s += text(534, 64, 'THERMODYNAMIC \u2014 at C2', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(534, 84, 'NaOEt or NaH', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(534, 102, 'room temperature or warmer', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(534, 122, 'more substituted C=C', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += rule(24, 218, 700, 218);
    s += text(24, 244, 'The easier proton and the more stable anion are on OPPOSITE sides of the molecule.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 268, 'One question settles every case: can the two enolates trade a proton?', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 290, 'If they can, the mixture finds the stabler one. If not, you keep whichever formed first.', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'Nothing about the ketone settles which enolate you get, which is why the conditions are written out in full rather than abbreviated to a reagent name. Each item in the kinetic column blocks one route back: the base is strong enough not to reverse, bulky enough to pick the open proton, cold enough not to equilibrate, and added first so no free ketone is left to shuttle protons.',
  note: 'The test is whether the two enolates can trade a proton, and there are three ways they can. The deprotonation reverses \u2014 ethoxide. Free ketone shuttles it \u2014 which is why NaH, whose deprotonation is as irreversible as LDA\u2019s, is a thermodynamic base: it is slow enough that un-ionized ketone is always present. Or the amine the base generated shuttles it, which is what erodes a lithium enolate on warming. Each item in the kinetic column closes one of the three, which is why missing any single one is enough to lose the regiochemistry.',
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
  note: 'Run the picture backwards and it becomes an assay. Counting how many equivalents of CH\u2083I an unknown amine swallowed said whether it was primary, secondary or tertiary, and identifying the alkene said what sat around the nitrogen \u2014 which is how alkaloid skeletons were argued for decades, at the cost of the whole sample and several weeks per compound.',
});

/* ----------------------------------------------------------------- 61 ---
   The carbonyl family, drawn as seven copies of the same C=O with one atom
   swapped. The notes say "read the other two things attached to the C=O";
   this makes that literal: the carbon and the oxygen are identical in every
   panel, the polar bond is marked identically in every panel, and the only
   thing that moves is the highlighted atom on the right. Condensed and Lewis
   drawing only, since this sits in Foundations before skeletal notation. */
FIGURES.push({
  id: 'carbonyl-family-gallery',
  section: 'functional-groups',
  anchor: '<h3>The carbonyl family: what is attached to the C=O</h3>',
  viewBox: '0 0 760 470',
  alt: 'Seven small panels, each showing a carbon double-bonded to an oxygen with the carbon marked delta plus and the oxygen delta minus. The carbon carries an R group on the left and, highlighted on the right, the atom that names the group: H for aldehyde, a second R for ketone, OH for carboxylic acid, OR for ester, NH2 for amide, Cl for acid chloride, and an oxygen bridging to a second C=O for anhydride.',
  build() {
    let s = '';
    // One carbonyl: C highlighted, O above with its two lone pairs, R to the
    // lower left, and the naming atom to the lower right.
    const carbonyl = (cx, cy, X, opts = {}) => {
      const C = P(cx, cy), O = P(cx, cy - 54), R = P(cx - 48, cy + 34), Xp = P(cx + 48, cy + 34);
      let g = '';
      g += bond(C, O, { order: 2, rFrom: 16, rTo: 15 });
      g += bond(C, R, { rFrom: 16, rTo: 15 });
      g += bond(C, Xp, { rFrom: 16, rTo: 16 });
      g += atom(O.x, O.y, 'O');
      g += lonePair(O.x, O.y, 210); g += lonePair(O.x, O.y, 330);
      g += atom(R.x, R.y, opts.rLabel || 'R');
      g += atom(Xp.x, Xp.y, X, { kind: 'warn' });
      g += atom(C.x, C.y, 'C', { kind: 'hi' });
      g += text(cx + 23, cy - 8, 'δ+', { cls: 'fg-warn', size: 11 });
      g += text(cx + 24, cy - 60, 'δ−', { cls: 'fg-hi', size: 11 });
      return g;
    };
    const top = [
      { name: 'Aldehyde',        X: 'H',    what: 'attached: H' },
      { name: 'Ketone',          X: 'R′', what: 'attached: a second carbon' },
      { name: 'Carboxylic acid', X: 'OH',   what: 'attached: OH' },
      { name: 'Ester',           X: 'OR′', what: 'attached: O–carbon' },
    ];
    top.forEach((t, i) => {
      const x = 20 + i * 182, cx = x + 85;
      s += panel(x, 16, 170, 196);
      s += text(cx, 40, t.name, { cls: 'fg-lbl', size: 12.5 });
      s += carbonyl(cx, 116, t.X);
      s += text(cx, 194, t.what, { cls: 'fg-tag-good', size: 10.5 });
    });
    const bottom = [
      { name: 'Amide',         X: 'NH₂', what: 'attached: N  (NH₂, NHR′ or NR′₂)' },
      { name: 'Acid chloride', X: 'Cl',   what: 'attached: Cl' },
    ];
    bottom.forEach((t, i) => {
      const x = 20 + i * 245, cx = x + 115;
      s += panel(x, 228, 230, 196);
      s += text(cx, 252, t.name, { cls: 'fg-lbl', size: 12.5 });
      s += carbonyl(cx, 328, t.X);
      s += text(cx, 406, t.what, { cls: 'fg-tag-good', size: 10.5 });
    });
    // Anhydride: two carbonyls sharing one oxygen, so the naming atom is an
    // oxygen that continues to a second C=O.
    {
      const x = 510, cx = x + 115;
      s += panel(x, 228, 230, 196);
      s += text(cx, 252, 'Anhydride', { cls: 'fg-lbl', size: 12.5 });
      const C1 = P(x + 70, 328), O1 = P(x + 70, 274), R1 = P(x + 30, 362), Ob = P(x + 118, 362);
      const C2 = P(x + 166, 328), O2 = P(x + 166, 274), R2 = P(x + 206, 362);
      s += bond(C1, O1, { order: 2, rFrom: 16, rTo: 15 });
      s += bond(C1, R1, { rFrom: 16, rTo: 15 });
      s += bond(C1, Ob, { rFrom: 16, rTo: 16 });
      s += bond(Ob, C2, { rFrom: 16, rTo: 15 });
      s += bond(C2, O2, { order: 2, rFrom: 15, rTo: 15 });
      s += bond(C2, R2, { rFrom: 15, rTo: 15 });
      s += atom(O1.x, O1.y, 'O'); s += lonePair(O1.x, O1.y, 210); s += lonePair(O1.x, O1.y, 330);
      s += atom(O2.x, O2.y, 'O'); s += lonePair(O2.x, O2.y, 210); s += lonePair(O2.x, O2.y, 330);
      s += atom(R1.x, R1.y, 'R'); s += atom(R2.x, R2.y, 'R');
      s += atom(Ob.x, Ob.y, 'O', { kind: 'warn' });
      s += atom(C2.x, C2.y, 'C');
      s += atom(C1.x, C1.y, 'C', { kind: 'hi' });
      s += text(C1.x + 23, C1.y - 8, 'δ+', { cls: 'fg-warn', size: 11 });
      s += text(C1.x + 24, C1.y - 60, 'δ−', { cls: 'fg-hi', size: 11 });
      s += text(cx, 406, 'attached: O that leads to a second C=O', { cls: 'fg-tag-good', size: 10.5 });
    }
    s += rule(24, 440, 736, 440);
    s += text(380, 446, 'The C=O is the same in all seven: carbon δ+, oxygen δ− with two lone pairs.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 464, 'Only the atom on the right changes, and it is the whole name.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'Seven groups, one carbonyl. Find the C=O, then read the atom on its right: H, a carbon, OH, OR′, N, Cl, or an oxygen that continues to another C=O. That one atom is the entire difference between an aldehyde and an ester, and it is what every "identify the functional group" question is really asking.',
  note: 'The polar bond is marked identically in every panel because it is identical in every one: the carbonyl carbon is the most electron-poor carbon in the whole table, for the electronegativity reason of the previous section, doubled by the second bond to oxygen. What the right-hand atom changes is not whether that carbon is attacked but what happens afterward, which is the story of three later chapters.',
});

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
