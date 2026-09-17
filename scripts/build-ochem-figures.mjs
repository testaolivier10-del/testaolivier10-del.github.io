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
   the neighboring bond, and where a dashed forming-bond arrives at the same
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
       centered over it, which is what had it sitting on the label. */
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
  note: 'The left-hand name is not a typo; it is what you get by applying the previous section\u2019s rule and nothing else, and the alcohol ends up as a <i>hydroxymethyl</i> prefix (a \u2013CH\u2082OH treated as a branch and named the way the previous section named (2-methylpropyl)). That is the tell. If the highest-priority group in your molecule has turned into a prefix and there was no group above it, you picked the parent chain before you ranked the groups.',
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

    /* The pair is centered on the part of the canvas the reading column
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
         minority figures spilled onto the neighboring colour and read as
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
  viewBox: '0 0 760 392',
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

    line(426, 124, 'needs the α protons ACIDIC', 'fg-tag');
    line(426, 146, 'the new halogen withdraws \u2192', 'fg-sm');
    line(426, 166, 'more acidic \u2192 faster', 'fg-tag');
    line(426, 186, 'KEEPS GOING while α-H remain', 'fg-tag');

    s += rule(24, 224, 700, 224);
    s += text(24, 250, 'The halogen does the same thing in both columns. Only the requirement differs.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 274, 'On a METHYL ketone the runaway is the point: CX\u2083 is a leaving group hydroxide can expel.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 296, 'Out come the carboxylate and CHX\u2083 \u2014 one carbon shorter than you started.', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'Two mechanisms, one substituent effect, opposite results. It is worth reading the two middle lines together: they are the same sentence, and everything after them diverges only because one route needs the substrate to be a base and the other needs it to be an acid.',
  note: 'The iodoform test rests on the right-hand column and on a distinction the name hides. It reports a CH\u2083CO or CH\u2083CH(OH) fragment, not a methyl group anywhere in the molecule \u2014 so 2-methylcyclohexanone, which has a methyl and is a ketone, is negative, because neither of its α carbons is that methyl. It brominates happily and simply never forms a CX\u2083 to expel.',
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
  viewBox: '0 0 760 500',
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


/* ================================================================ N1 ---
   Nomenclature, second pass. The chapter's whole job is structure <-> name
   and its first draft drew almost nothing: one traced skeleton per section.
   These nine put a drawing beside every worked example the prose walks
   through, and beside the two places a reader has to picture a shape
   (cis/trans, ortho/meta/para) or a fragment (the alkyl groups, the
   principal groups) that words only list. */

/* A zigzag chain: n carbons, even indices on the baseline y0 and odd ones
   raised by dy, the way a skeletal chain is drawn. */
const zig = (x0, y0, n, dx = 34, dy = 22) => Array.from({ length: n }, (_, i) => P(x0 + i * dx, y0 + (i % 2 ? -dy : 0)));
/* Skeletal bonds: vertices are unlabeled carbons, so nothing is trimmed. */
const sk = (a, b, hi) => bond(a, b, { rFrom: 0, rTo: 0, cls: hi ? 'fg-bond-hi' : 'fg-bond' });

/* ---------------------------------------------------------------- N1 ---
   Three drawings the parent-chain section walks through in words. The
   middle one is the trap (the ethyl IS the corner) and the right one is the
   same trap failing to fire (every route ties), and the reader who cannot
   tell them apart on sight is exactly who the counting rule is for. */
FIGURES.push({
  id: 'ethyl-branch-three-ways',
  section: 'naming-parent-chain',
  anchor: '<h3>Check every end, not just the one you started from</h3>',
  alt: 'Three branched alkanes side by side. A six-carbon row with a methyl on the third carbon, where the row is the parent and the name is 3-methylhexane. A four-carbon row with an ethyl on the second carbon, where the longest path turns into the ethyl and the name is 3-methylpentane. A five-carbon row with an ethyl on the middle carbon, where every route is five carbons and the name is 3-ethylpentane.',
  viewBox: '0 0 720 340',
  build() {
    let s = '';
    const draw = (links, traced) => {
      let t = '';
      for (const [a, b] of links) t += sk(a, b, false);
      for (const [a, b, k] of links) if (traced.includes(k)) t += sk(a, b, true);
      return t;
    };
    const num = (x, y, v) => text(x, y, v, { cls: 'fg-lbl', size: 11 });
    const head = (x, kind, heading) => { s += panel(x, 44, 224, 206, { kind }); s += tag(x + 112, 32, heading); };
    const verdict = (x, sub, name, cls, note) => {
      s += text(x + 112, 274, sub, { cls: 'fg-sm', size: 10 });
      s += text(x + 112, 296, name, { cls, size: 11.5 });
      s += text(x + 112, 316, note, { cls: 'fg-sm', size: 9.5 });
    };

    // A. 3-methylhexane: the row is the parent.
    {
      const x = 12; head(x, 'hi', 'the row is the parent');
      const r = zig(x + 27, 176, 6);
      const m = P(r[2].x, r[2].y + 34);
      s += draw([[r[0], r[1], 'a'], [r[1], r[2], 'b'], [r[2], r[3], 'c'], [r[3], r[4], 'd'], [r[4], r[5], 'e'], [r[2], m, 'm']], ['a', 'b', 'c', 'd', 'e']);
      r.forEach((p, i) => {
        if (i === 2) s += num(p.x, p.y - 12, '3');
        else s += num(p.x, i % 2 ? p.y - 10 : p.y + 20, String(i + 1));
      });
      s += text(m.x + 8, m.y + 4, 'methyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      verdict(x, 'six in the row, nothing longer', '3-methylhexane', 'fg-tag-good', 'the methyl is a real branch');
    }
    // B. Four-carbon row with an ethyl on C2: the ethyl is the corner.
    {
      const x = 248; head(x, 'warn', 'the row is not the parent');
      const r = zig(x + 50, 186, 4);
      const e1 = P(r[1].x, r[1].y - 34), e2 = P(r[1].x + 30, e1.y - 18);
      s += draw([[r[0], r[1], 'a'], [r[1], r[2], 'b'], [r[2], r[3], 'c'], [r[1], e1, 'd'], [e1, e2, 'e']], ['b', 'c', 'd', 'e']);
      s += num(e2.x + 12, e2.y + 4, '1');
      s += num(e1.x + 12, e1.y + 4, '2');
      s += num(r[1].x, r[1].y + 18, '3');
      s += num(r[2].x, r[2].y + 20, '4');
      s += num(r[3].x, r[3].y - 10, '5');
      s += text(r[0].x, r[0].y + 20, 'methyl', { cls: 'fg-sm', size: 9.5 });
      verdict(x, 'row four; through the ethyl, five', '3-methylpentane', 'fg-tag-good', '"2-ethylbutane" names the drawing');
    }
    // C. Five-carbon row with an ethyl on C3: every route is five.
    {
      const x = 484; head(x, 'hi', 'every route ties');
      const r = zig(x + 44, 160, 5);
      const e1 = P(r[2].x, r[2].y + 34), e2 = P(r[2].x + 30, e1.y + 18);
      s += draw([[r[0], r[1], 'a'], [r[1], r[2], 'b'], [r[2], r[3], 'c'], [r[3], r[4], 'd'], [r[2], e1, 'e'], [e1, e2, 'f']], ['a', 'b', 'c', 'd']);
      r.forEach((p, i) => {
        if (i === 2) s += num(p.x, p.y - 12, '3');
        else s += num(p.x, i % 2 ? p.y - 10 : p.y + 20, String(i + 1));
      });
      s += text(e2.x + 8, e2.y + 4, 'ethyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      verdict(x, 'row five, either corner five', '3-ethylpentane', 'fg-tag-good', 'a tie changes nothing here');
    }
    return s;
  },
  caption: 'Three drawings that look alike and are named by three different arguments. On the left the row is the parent. In the middle the ethyl is the corner the parent turns: two ethyl carbons, then the rest of the row, is five, and the row is only four. On the right the row and both corner routes are all five carbons, so the drawing was honest and the ethyl is a real ethyl.',
  note: 'The three drawings differ by one carbon in the row and nothing else, and the eye does not reliably see one carbon. Write the route lengths down before you write a name: with three ends there are only three routes to count, and the longest of them is the parent whatever the drawing suggests.',
});

/* ---------------------------------------------------------------- N2 ---
   The six alkyl groups the section defines in words. Every textbook draws
   these side by side, because a reader who has only read "attaches through
   the second carbon of a four-chain" cannot tell isobutyl from sec-butyl. */
FIGURES.push({
  id: 'alkyl-group-gallery',
  section: 'naming-substituents',
  anchor: 'Learn both directions and use whichever the question uses.</p>',
  alt: 'Six alkyl groups drawn as skeletal fragments: propyl, isopropyl, butyl, sec-butyl, isobutyl and tert-butyl. In each the bond to the parent chain is highlighted and ends in a dot, and the carbons are numbered as in the systematic name, so the attached carbon is C2 in propan-2-yl and butan-2-yl.',
  viewBox: '0 0 720 420',
  build() {
    let s = '';
    const dot = (p) => atom(p.x, p.y, '', { kind: 'hi', r: 5 });
    const n = (p, v, where) => {
      const at = where === 'above' ? [p.x, p.y - 9] : where === 'below' ? [p.x, p.y + 16]
        : where === 'right' ? [p.x + 12, p.y + 4] : where === 'left' ? [p.x - 12, p.y + 4] : [p.x + 11, p.y - 9];
      return text(at[0], at[1], v, { cls: 'fg-sm', size: 9.5 });
    };
    const groups = [
      { common: 'propyl', sys: 'propan-1-yl', draw(x, y) {
        const A = P(x, y), c1 = P(x + 30, y - 18), c2 = P(x + 60, y), c3 = P(x + 90, y - 18);
        return sk(A, c1, true) + sk(c1, c2) + sk(c2, c3) + dot(A) + n(c1, '1', 'above') + n(c2, '2', 'below') + n(c3, '3', 'above');
      } },
      { common: 'isopropyl', sys: 'propan-2-yl', draw(x, y) {
        const A = P(x, y + 10), c = P(x + 30, y - 8), m1 = P(x + 60, y + 10), m3 = P(x + 30, y - 44);
        return sk(A, c, true) + sk(c, m1) + sk(c, m3) + dot(A) + n(m3, '1', 'right') + n(c, '2', 'diag') + n(m1, '3', 'below');
      } },
      { common: 'butyl', sys: 'butan-1-yl', draw(x, y) {
        const A = P(x, y), c1 = P(x + 30, y - 18), c2 = P(x + 60, y), c3 = P(x + 90, y - 18), c4 = P(x + 120, y);
        return sk(A, c1, true) + sk(c1, c2) + sk(c2, c3) + sk(c3, c4) + dot(A) + n(c1, '1', 'above') + n(c2, '2', 'below') + n(c3, '3', 'above') + n(c4, '4', 'below');
      } },
      { common: 'sec-butyl', sys: 'butan-2-yl', draw(x, y) {
        const A = P(x, y + 10), c2 = P(x + 30, y - 8), c1 = P(x + 30, y - 44), c3 = P(x + 60, y + 10), c4 = P(x + 90, y - 8);
        return sk(A, c2, true) + sk(c2, c1) + sk(c2, c3) + sk(c3, c4) + dot(A) + n(c1, '1', 'right') + n(c2, '2', 'diag') + n(c3, '3', 'below') + n(c4, '4', 'above');
      } },
      { common: 'isobutyl', sys: '2-methylpropyl', draw(x, y) {
        const A = P(x, y), c1 = P(x + 30, y - 18), c2 = P(x + 60, y), c3 = P(x + 90, y - 18), m = P(x + 60, y + 36);
        return sk(A, c1, true) + sk(c1, c2) + sk(c2, c3) + sk(c2, m) + dot(A) + n(c1, '1', 'above') + n(c2, '2', 'diag') + n(c3, '3', 'above') + text(m.x + 8, m.y + 4, 'methyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      } },
      { common: 'tert-butyl', sys: '2-methylpropan-2-yl', draw(x, y) {
        const A = P(x, y), c = P(x + 36, y), m1 = P(x + 36, y - 36), m2 = P(x + 36, y + 36), m3 = P(x + 72, y);
        return sk(A, c, true) + sk(c, m1) + sk(c, m2) + sk(c, m3) + dot(A) + n(m1, '1', 'right') + n(c, '2', 'diag') + n(m3, '3', 'right') + text(m2.x + 8, m2.y + 4, 'methyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      } },
    ];
    groups.forEach((g, i) => {
      const px = 12 + (i % 3) * 236, py = 36 + Math.floor(i / 3) * 190;
      s += panel(px, py, 224, 170);
      s += text(px + 112, py + 24, g.common, { cls: 'fg-lbl', size: 12.5 });
      s += text(px + 112, py + 42, g.sys, { cls: 'fg-sm', size: 10 });
      s += g.draw(px + 46, py + 112);
    });
    s += text(360, 408, 'The dot is the bond to the parent chain; the numbers are the group’s own, as in its systematic name.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The six alkyl groups you will be asked to recognize, drawn. Each pair — propyl and isopropyl, then the four butyls — shares a carbon count; what changes is which carbon carries the bond to the parent. The systematic name says exactly that: <i>propan-2-yl</i> is a three-carbon group attached through its second carbon, <i>2-methylpropyl</i> is a three-carbon group attached through its first with a methyl on its second.',
  note: 'Two of these are the ones people confuse. <i>sec</i>-Butyl and isobutyl are both four carbons and both branched, and the difference is whether the branch point is the attached carbon (<i>sec</i>) or the one next to it (iso). Cover the names, look at where the dot sits, and say which is which; if you can do that, the words will stick.',
});

/* ---------------------------------------------------------------- N3 ---
   The section's two worked names, drawn with their numbering, including the
   one thing about a complex substituent that prose cannot show: the branch
   has its own C1 and its own count. */
FIGURES.push({
  id: 'substituent-worked-pair',
  section: 'naming-substituents',
  anchor: 'so (2-methylpropyl) files under <b>m</b>.</p>',
  alt: 'Two numbered skeletal structures. Left: a heptane chain numbered one to seven with a methyl on carbon 2, an ethyl on carbon 4 and a chlorine on carbon 5, named 5-chloro-4-ethyl-2-methylheptane. Right: a nonane chain with a 2-methylpropyl branch on carbon 5, the branch carbons numbered 1, 2, 3 from the attachment point in a second color, named 5-(2-methylpropyl)nonane.',
  viewBox: '0 0 720 336',
  build() {
    let s = '';
    const num = (x, y, v, cls = 'fg-lbl') => text(x, y, v, { cls, size: 11 });
    // Left: 5-chloro-4-ethyl-2-methylheptane
    {
      const x = 12; s += panel(x, 44, 344, 216, { kind: 'hi' }); s += tag(x + 172, 32, 'three simple substituents');
      const r = zig(x + 44, 176, 7, 40, 24);
      for (let i = 0; i < 6; i++) s += sk(r[i], r[i + 1]);
      const m = P(r[1].x, r[1].y - 36);
      const e1 = P(r[3].x, r[3].y - 36), e2 = P(r[3].x + 30, e1.y - 18);
      const cl = P(r[4].x, r[4].y + 42);
      s += sk(r[1], m) + sk(r[3], e1) + sk(e1, e2);
      s += bond(r[4], cl, { rFrom: 0, rTo: 15 }) + atom(cl.x, cl.y, 'Cl');
      r.forEach((p, i) => {
        const up = i % 2 === 1;
        if (i === 1 || i === 3) s += num(p.x, p.y + 18, String(i + 1));
        else if (i === 4) s += num(p.x, p.y - 12, '5');
        else s += num(p.x, up ? p.y - 10 : p.y + 20, String(i + 1));
      });
      s += text(m.x + 8, m.y + 4, 'methyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(e2.x + 8, e2.y + 4, 'ethyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(x + 172, 286, '5-chloro-4-ethyl-2-methylheptane', { cls: 'fg-tag-good', size: 11.5 });
      s += text(x + 172, 306, 'numbered left to right: {2, 4, 5} beats {3, 4, 6}', { cls: 'fg-sm', size: 9.5 });
    }
    // Right: 5-(2-methylpropyl)nonane
    {
      const x = 364; s += panel(x, 44, 344, 216, { kind: 'hi' }); s += tag(x + 172, 32, 'one branched substituent');
      const r = zig(x + 30, 150, 9, 34, 22);
      for (let i = 0; i < 8; i++) s += sk(r[i], r[i + 1]);
      const b1 = P(r[4].x, r[4].y + 34), b2 = P(r[4].x + 30, b1.y + 18), b3 = P(b2.x + 30, b2.y - 18), bm = P(b2.x, b2.y + 36);
      s += sk(r[4], b1) + sk(b1, b2) + sk(b2, b3) + sk(b2, bm);
      r.forEach((p, i) => {
        const up = i % 2 === 1;
        if (i === 4) s += num(p.x, p.y - 12, '5');
        else s += num(p.x, up ? p.y - 10 : p.y + 20, String(i + 1));
      });
      s += num(b1.x - 12, b1.y + 4, '1', 'fg-tag-good');
      s += num(b2.x - 12, b2.y + 6, '2', 'fg-tag-good');
      s += num(b3.x + 12, b3.y + 4, '3', 'fg-tag-good');
      s += text(bm.x + 8, bm.y + 4, 'methyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(x + 172, 286, '5-(2-methylpropyl)nonane', { cls: 'fg-tag-good', size: 11.5 });
      s += text(x + 172, 306, 'the green numbers belong to the branch', { cls: 'fg-sm', size: 9.5 });
    }
    return s;
  },
  caption: 'The two worked names, drawn. On the left the numbers were settled by the structure and the words by the alphabet, which is why 5 comes before 4 before 2 in the name. On the right the branch is numbered a second time, from the carbon that attaches it, and that count goes inside the parentheses.',
  note: 'The parentheses are doing a job. In 5-(2-methylpropyl)nonane the 2 counts along the branch and the 5 along the parent; write it without the brackets and a reader cannot tell which chain the 2 belongs to. The same group is also called isobutyl, and it files under <b>i</b> under that name and under <b>m</b> under this one, so which name you use changes where it sits in a longer name.',
});

/* ---------------------------------------------------------------- N4 ---
   The priority list as fragments. The section ranks ten groups by name and
   never shows one; a student who has to decide "which of these two is the
   suffix" from a drawing has to be able to see the group first. */
FIGURES.push({
  id: 'principal-group-fragments',
  section: 'naming-functional-groups',
  anchor: 'the three groups on the second line cannot be suffixes at all.</p>',
  alt: 'Ten skeletal fragments in priority order, five per row, each with the suffix it takes: carboxylic acid (-oic acid), ester (-oate), amide (-amide), nitrile (-nitrile), aldehyde (-al), ketone (-one), alcohol (-ol), amine (-amine), alkene (-ene), alkyne (-yne).',
  viewBox: '0 0 720 372',
  build() {
    let s = '';
    const acyl = (cx, cy, X) => {
      const C = P(cx - 8, cy + 6), O = P(cx - 8, cy - 30), Xp = P(cx + 26, cy + 24), R = P(cx - 40, cy + 24);
      return sk(R, C) + bond(C, O, { order: 2, rFrom: 0, rTo: 15 }) + atom(O.x, O.y, 'O') +
             bond(C, Xp, { rFrom: 0, rTo: 15 }) + atom(Xp.x, Xp.y, X, { kind: 'hi' });
    };
    const groups = [
      { name: 'carboxylic acid', suffix: '-oic acid', draw: (cx, cy) => acyl(cx, cy, 'OH') },
      { name: 'ester', suffix: 'alkyl …-oate', draw: (cx, cy) => acyl(cx, cy, 'OR′') },
      { name: 'amide', suffix: '-amide', draw: (cx, cy) => acyl(cx, cy, 'NH₂') },
      { name: 'nitrile', suffix: '-nitrile', draw(cx, cy) {
        const R = P(cx - 44, cy + 4), C = P(cx - 10, cy + 4), N = P(cx + 30, cy + 4);
        return sk(R, C) + bond(C, N, { order: 3, rFrom: 0, rTo: 15 }) + atom(N.x, N.y, 'N', { kind: 'hi' });
      } },
      { name: 'aldehyde', suffix: '-al', draw: (cx, cy) => acyl(cx, cy, 'H') },
      { name: 'ketone', suffix: '-one', draw(cx, cy) {
        const C = P(cx, cy + 6), O = P(cx, cy - 30), R1 = P(cx - 32, cy + 24), R2 = P(cx + 32, cy + 24);
        return sk(R1, C) + sk(C, R2) + bond(C, O, { order: 2, rFrom: 0, rTo: 15 }) + atom(O.x, O.y, 'O', { kind: 'hi' });
      } },
      { name: 'alcohol', suffix: '-ol', draw(cx, cy) {
        const R = P(cx - 40, cy + 20), C = P(cx - 10, cy + 2), X = P(cx + 26, cy + 20);
        return sk(R, C) + bond(C, X, { rFrom: 0, rTo: 15 }) + atom(X.x, X.y, 'OH', { kind: 'hi' });
      } },
      { name: 'amine', suffix: '-amine', draw(cx, cy) {
        const R = P(cx - 40, cy + 20), C = P(cx - 10, cy + 2), X = P(cx + 26, cy + 20);
        return sk(R, C) + bond(C, X, { rFrom: 0, rTo: 15 }) + atom(X.x, X.y, 'NH₂', { kind: 'hi' });
      } },
      { name: 'alkene', suffix: '-ene', draw(cx, cy) {
        const a = P(cx - 42, cy + 16), b = P(cx - 14, cy - 2), c = P(cx + 14, cy + 16), d = P(cx + 42, cy - 2);
        return sk(a, b) + bond(b, c, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.5 }) + sk(c, d);
      } },
      { name: 'alkyne', suffix: '-yne', draw(cx, cy) {
        const a = P(cx - 44, cy + 6), b = P(cx - 16, cy + 6), c = P(cx + 16, cy + 6), d = P(cx + 44, cy + 6);
        return sk(a, b) + bond(b, c, { order: 3, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.2 }) + sk(c, d);
      } },
    ];
    s += tag(360, 24, 'priority falls left to right along the top row, then along the bottom row');
    groups.forEach((g, i) => {
      const px = 12 + (i % 5) * 142, py = 40 + Math.floor(i / 5) * 166, cx = px + 66;
      s += panel(px, py, 132, 150, { kind: i < 4 ? 'hi' : undefined });
      s += text(cx, py + 22, g.name, { cls: 'fg-lbl', size: 12 });
      s += g.draw(cx, py + 80);
      s += text(cx, py + 136, g.suffix, { cls: 'fg-tag-good', size: 10.5 });
    });
    return s;
  },
  caption: 'The priority list, as the fragments you would actually see in a drawing. The four shaded panels are the acid and its derivatives, and every one of them has three bonds from the functional carbon to oxygen or nitrogen; the aldehyde and ketone have two; the alcohol and amine one. The multiple bonds have none, and rank last.',
  note: 'Use it as a lookup in both directions. Given a drawing, find the highest panel that matches something in it: that group is the suffix and everything else is a prefix. Given a name, the suffix tells you which fragment to draw at the carbon the locant names, and the root tells you how long the chain around it is.',
});

/* ---------------------------------------------------------------- N5 ---
   Encode and decode, side by side. The keto acid is the section's worked
   example and was text only; the aldehyde is the direction the chapter never
   modelled, reading a name back into a structure. */
FIGURES.push({
  id: 'keto-acid-and-decode',
  section: 'naming-functional-groups',
  anchor: '<h3>Reading a name back into a structure</h3>',
  alt: 'Left: 4-bromo-3-oxopentanoic acid drawn as a numbered five-carbon chain, with the acid carbon as C1 carrying a double-bonded O and an OH, a ketone oxygen on C3 and a bromine on C4. Right: 3-hydroxybutanal drawn as a four-carbon chain with the aldehyde carbon as C1 and an OH on C3, with the three decoding steps listed.',
  viewBox: '0 0 720 336',
  build() {
    let s = '';
    const num = (x, y, v) => text(x, y, v, { cls: 'fg-lbl', size: 11 });
    // Left: structure -> name
    {
      const x = 12; s += panel(x, 44, 344, 216, { kind: 'hi' }); s += tag(x + 172, 32, 'structure → name');
      const r = zig(x + 70, 170, 5, 40, 24);
      for (let i = 0; i < 4; i++) s += sk(r[i], r[i + 1]);
      const o1 = P(r[0].x, r[0].y + 40), ho = P(r[0].x - 34, r[0].y - 18);
      s += bond(r[0], o1, { order: 2, rFrom: 0, rTo: 15 }) + atom(o1.x, o1.y, 'O');
      s += bond(r[0], ho, { rFrom: 0, rTo: 16 }) + atom(ho.x, ho.y, 'HO');
      const o3 = P(r[2].x, r[2].y + 40);
      s += bond(r[2], o3, { order: 2, rFrom: 0, rTo: 15 }) + atom(o3.x, o3.y, 'O');
      const br = P(r[3].x, r[3].y - 40);
      s += bond(r[3], br, { rFrom: 0, rTo: 15 }) + atom(br.x, br.y, 'Br');
      s += num(r[0].x + 19, r[0].y + 12, '1');
      s += num(r[1].x, r[1].y - 10, '2');
      s += num(r[2].x, r[2].y - 12, '3');
      s += num(r[3].x, r[3].y + 18, '4');
      s += num(r[4].x, r[4].y + 20, '5');
      s += text(x + 18, 70, 'acid outranks ketone: suffix -oic acid, C1 fixed', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(x + 18, 86, 'ketone demoted to oxo-, bromine is bromo-', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(x + 172, 286, '4-bromo-3-oxopentanoic acid', { cls: 'fg-tag-good', size: 11.5 });
      s += text(x + 172, 306, 'prefixes alphabetical: bromo before oxo', { cls: 'fg-sm', size: 9.5 });
    }
    // Right: name -> structure
    {
      const x = 364; s += panel(x, 44, 344, 216, { kind: 'hi' }); s += tag(x + 172, 32, 'name → structure');
      s += text(x + 18, 70, '-al: an aldehyde, so C1 is a CHO', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(x + 18, 86, 'butan: four carbons in the parent', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      s += text(x + 18, 102, '3-hydroxy: an OH on C3', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      const r = zig(x + 96, 176, 4, 40, 24);
      for (let i = 0; i < 3; i++) s += sk(r[i], r[i + 1]);
      const o1 = P(r[0].x, r[0].y + 40), h = P(r[0].x - 34, r[0].y - 18);
      s += bond(r[0], o1, { order: 2, rFrom: 0, rTo: 15 }) + atom(o1.x, o1.y, 'O');
      s += bond(r[0], h, { rFrom: 0, rTo: 15 }) + atom(h.x, h.y, 'H');
      const oh = P(r[2].x, r[2].y + 40);
      s += bond(r[2], oh, { rFrom: 0, rTo: 15 }) + atom(oh.x, oh.y, 'OH', { kind: 'hi' });
      s += num(r[0].x + 19, r[0].y + 12, '1');
      s += num(r[1].x, r[1].y - 10, '2');
      s += num(r[2].x, r[2].y - 12, '3');
      s += num(r[3].x, r[3].y - 10, '4');
      s += text(x + 172, 286, '3-hydroxybutanal', { cls: 'fg-tag-good', size: 11.5 });
      s += text(x + 172, 306, 'suffix first, then root, then prefixes', { cls: 'fg-sm', size: 9.5 });
    }
    return s;
  },
  caption: 'The same procedure run in both directions. Encoding starts by ranking the groups, because the winner fixes both the suffix and where C1 is; decoding starts from the suffix, because it says which fragment sits at C1 (or at the locant given), and only then is the chain drawn around it.',
  note: 'Decoding is the direction exams use for "draw the structure of", and the commonest error is reading a name left to right. Read it from the end: the suffix, then the root, then each prefix with its number. In 3-hydroxybutanal that order puts the CHO down first and the OH two carbons along from it; read left to right, students draw the OH first and then have to guess where the aldehyde goes.',
});

/* ---------------------------------------------------------------- N6 ---
   "The parent must contain the double bond" is the multiple-bond version of
   "the parent must contain the principal group", and the section stated the
   second and not the first. Same two-trace layout, so the reader sees it is
   the same rule. */
FIGURES.push({
  id: 'alkene-parent-contains',
  section: 'naming-rings-unsaturation',
  anchor: '<h3>The parent chain must contain the double bond</h3>',
  alt: 'One alkene traced twice. Left: the six-carbon chain, the longest in the molecule, with the C=CH2 hanging off its third carbon; named 3-methylidenehexane and marked as not the textbook answer. Right: the five-carbon chain that starts at the CH2 of the double bond, numbered so the double bond is C1 to C2 and the ethyl is on C2; named 2-ethylpent-1-ene.',
  viewBox: '0 0 720 390',
  build() {
    let s = '';
    const skeleton = (ox, traced, nums, extra) => {
      const a = zig(ox + 50, 174, 6, 36, 22);
      const ch2 = P(a[2].x, a[2].y + 44);
      const links = [['a0', a[0], a[1]], ['a1', a[1], a[2]], ['a2', a[2], a[3]], ['a3', a[3], a[4]], ['a4', a[4], a[5]]];
      let t = '';
      for (const [, p, q] of links) t += sk(p, q);
      for (const [k, p, q] of links) if (traced.includes(k)) t += sk(p, q, true);
      t += bond(a[2], ch2, { order: 2, rFrom: 0, rTo: 0, cls: traced.includes('db') ? 'fg-bond-hi' : 'fg-bond', gap: 3.5 });
      for (const [x, y, v] of nums) t += text(ox + x, y, v, { cls: 'fg-lbl', size: 11 });
      for (const [x, y, v, anchor] of extra) t += text(ox + x, y, v, { cls: 'fg-sm', size: 9.5, anchor: anchor || 'middle' });
      return t;
    };
    s += panel(20, 64, 300, 224, { kind: 'warn' });
    s += tag(170, 52, 'the longest chain in the molecule');
    s += skeleton(26, ['a0', 'a1', 'a2', 'a3', 'a4'],
      [[50, 130, '1'], [86, 130, '2'], [122, 130, '3'], [158, 130, '4'], [194, 130, '5'], [230, 130, '6']],
      [[144, 224, 'the C=C is off the chain', 'start']]);

    s += panel(370, 64, 300, 224, { kind: 'hi' });
    s += tag(520, 52, 'the longest chain through the C=C');
    s += skeleton(376, ['a2', 'a3', 'a4', 'db'],
      [[122, 130, '2'], [158, 130, '3'], [194, 130, '4'], [230, 130, '5'], [104, 224, '1']],
      [[68, 130, 'ethyl']]);

    s += rule(20, 300, 670, 300);
    s += text(170, 322, 'six carbons — but the double bond is a branch', { cls: 'fg-sm', size: 10 });
    s += text(170, 344, '3-methylidenehexane', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(170, 364, 'not what a textbook or exam expects', { cls: 'fg-sm', size: 9.5 });
    s += text(520, 322, 'five carbons — shorter, and it contains the C=C', { cls: 'fg-sm', size: 10 });
    s += text(520, 344, '2-ethylpent-1-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(520, 364, 'the double bond takes the suffix and C1', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'One alkene, two candidate parents. The six-carbon chain is the longest path through the skeleton and the textbook rule still rejects it, because the double bond is not on it. The five-carbon chain that starts at the CH₂ is the parent, the double bond takes C1, and the two carbons left over are an ethyl.',
  note: 'This is the same shape of argument as the alcohol that lost its longest chain in the previous section, and it is worth seeing that it is the same rule: the feature that sets the suffix has to be on the parent. The 2013 IUPAC recommendations relaxed this for multiple bonds (they now let chain length win, which is where the left-hand name comes from), but every current textbook and exam still applies it, so apply it.',
});

/* ---------------------------------------------------------------- N7 ---
   cis and trans but-2-ene, which the prose describes as "methyls on the same
   side" and "on opposite sides" without a drawing. It is a geometric claim. */
FIGURES.push({
  id: 'cis-trans-but-2-ene',
  section: 'naming-rings-unsaturation',
  anchor: 'The name so far cannot tell them apart.</p>',
  alt: 'Two skeletal drawings of but-2-ene. In cis-but-2-ene both methyl carbons sit below the double bond, on the same side; in trans-but-2-ene one sits below and one above, on opposite sides.',
  viewBox: '0 0 720 262',
  build() {
    let s = '';
    const butene = (cx, cy, trans) => {
      const c1 = P(cx - 52, cy + 22), c2 = P(cx - 18, cy + 2), c3 = P(cx + 18, cy + 2), c4 = P(cx + 52, trans ? cy - 18 : cy + 22);
      let t = sk(c1, c2) + bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.5 }) + sk(c3, c4);
      t += text(c1.x - 4, c1.y + 18, 'methyl', { cls: 'fg-sm', size: 9.5 });
      t += text(c4.x + 4, trans ? c4.y - 8 : c4.y + 18, 'methyl', { cls: 'fg-sm', size: 9.5 });
      t += text(c2.x, c2.y - 12, '2', { cls: 'fg-lbl', size: 11 });
      t += text(c3.x, c3.y - 12, '3', { cls: 'fg-lbl', size: 11 });
      return t;
    };
    s += panel(40, 44, 300, 150, { kind: 'hi' });
    s += tag(190, 32, 'same side');
    s += butene(190, 110, false);
    s += text(190, 216, 'cis-but-2-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(190, 236, 'both methyls below the C=C', { cls: 'fg-sm', size: 9.5 });

    s += panel(380, 44, 300, 150, { kind: 'hi' });
    s += tag(530, 32, 'opposite sides');
    s += butene(530, 110, true);
    s += text(530, 216, 'trans-but-2-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(530, 236, 'one methyl below, one above', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Two compounds that the name but-2-ene does not distinguish. The double bond between C2 and C3 cannot rotate, so a methyl drawn below it stays below it, and "both below" and "one below, one above" are different molecules with different boiling points, not two drawings of one.',
  note: 'Read the prefix off the drawing: find the two groups that are not hydrogen, one on each alkene carbon, and ask whether they are on the same side of the double bond. Same side is <i>cis</i>, opposite is <i>trans</i>. When one of the alkene carbons carries two groups that are not hydrogen the words stop being enough, which is what the E/Z system is for.',
});

/* ---------------------------------------------------------------- N8 ---
   ortho, meta, para: three hexagons is all it needs, and the prose had
   none. Drawn as the xylenes, which is the example the text uses. */
FIGURES.push({
  id: 'ortho-meta-para',
  section: 'naming-rings-unsaturation',
  anchor: 'and the words mean exactly what they mean here.</p>',
  alt: 'Three benzene rings, each with two methyl groups: adjacent (ortho, 1,2-dimethylbenzene), separated by one ring carbon (meta, 1,3-dimethylbenzene), and directly across the ring (para, 1,4-dimethylbenzene).',
  viewBox: '0 0 720 280',
  build() {
    let s = '';
    const R = 36, D = 60;
    const ring = (cx, cy, subs) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
      }
      let g = '';
      for (let i = 0; i < 6; i++) g += sk(pts[i], pts[(i + 1) % 6]);
      g += `<circle class="fg-bond" cx="${cx}" cy="${cy}" r="21"></circle>`;
      for (const sb of subs) {
        const a = (-90 + sb.v * 60) * Math.PI / 180;
        const ox = cx + Math.cos(a) * D, oy = cy + Math.sin(a) * D;
        g += bond(pts[sb.v], P(ox, oy), { rFrom: 0, rTo: 16 });
        g += atom(ox, oy, 'CH₃', { kind: 'hi' });
        // The locant sits beside the substituent bond rather than on it:
        // 30 degrees round from the bond, just outside the ring.
        const b = a + Math.PI / 6;
        g += text(cx + Math.cos(b) * 50, cy + Math.sin(b) * 50 + 4, sb.n, { cls: 'fg-lbl', size: 11 });
      }
      return g;
    };
    const cases = [
      { cx: 124, word: 'ortho', pos: '1,2', name: 'o-xylene = 1,2-dimethylbenzene', subs: [{ v: 0, n: '1' }, { v: 1, n: '2' }] },
      { cx: 360, word: 'meta', pos: '1,3', name: 'm-xylene = 1,3-dimethylbenzene', subs: [{ v: 0, n: '1' }, { v: 2, n: '3' }] },
      { cx: 596, word: 'para', pos: '1,4', name: 'p-xylene = 1,4-dimethylbenzene', subs: [{ v: 0, n: '1' }, { v: 3, n: '4' }] },
    ];
    for (const c of cases) {
      s += panel(c.cx - 112, 28, 224, 200);
      s += ring(c.cx, 114, c.subs);
      s += text(c.cx, 214, `${c.word}  (${c.pos})`, { cls: 'fg-tag-good', size: 11 });
      s += text(c.cx, 252, c.name, { cls: 'fg-sm', size: 10 });
    }
    return s;
  },
  caption: 'The three ways to put two groups on a benzene ring, shown for two methyls. <i>ortho</i> is next door, <i>meta</i> has one ring carbon between them, <i>para</i> is straight across; the locant pairs 1,2, 1,3 and 1,4 say the same thing in numbers, and both forms are in constant use.',
  note: 'There are only three because the ring is symmetric: a 1,5 relationship is the same as 1,3 counted the other way round, and 1,6 is 1,2. Whichever of the two groups you call C1, the other lands on 2, 3 or 4, and that is the whole vocabulary.',
});

/* ---------------------------------------------------------------- N9 ---
   Phenyl against benzyl. "Changes the molecule by a carbon" is the whole
   claim, and one extra vertex on a drawing makes it in a glance. */
FIGURES.push({
  id: 'phenyl-vs-benzyl',
  section: 'naming-rings-unsaturation',
  anchor: 'Confusing the two changes the molecule by a carbon, and both words are in constant use.</div>',
  alt: 'Two benzene rings as substituents. Phenyl is the ring attached directly through one of its own carbons, six carbons in all. Benzyl is the same ring attached through a CH2 carbon that sits between the ring and the parent, seven carbons in all; the extra carbon is highlighted.',
  viewBox: '0 0 720 250',
  build() {
    let s = '';
    const R = 34;
    const ring = (cx, cy) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * 60) * Math.PI / 180;
        pts.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
      }
      let g = '';
      for (let i = 0; i < 6; i++) g += sk(pts[i], pts[(i + 1) % 6]);
      g += `<circle class="fg-bond" cx="${cx}" cy="${cy}" r="20"></circle>`;
      return { g, right: pts[0] };
    };
    // Phenyl
    {
      const cx = 166, cy = 116; s += panel(40, 40, 300, 150);
      s += tag(190, 28, 'phenyl: the ring itself');
      const r = ring(cx, cy); s += r.g;
      const A = P(r.right.x + 40, cy);
      s += sk(r.right, A, true) + atom(A.x, A.y, '', { kind: 'hi', r: 5 });
      s += text(190, 212, 'phenyl, C₆H₅–  ·  six carbons', { cls: 'fg-tag-good', size: 11 });
    }
    // Benzyl
    {
      const cx = 484, cy = 116; s += panel(380, 40, 300, 150);
      s += tag(530, 28, 'benzyl: the ring plus one CH₂');
      const r = ring(cx, cy); s += r.g;
      const ch2 = P(r.right.x + 34, cy - 20), A = P(ch2.x + 34, cy);
      s += sk(r.right, ch2) + sk(ch2, A, true) + atom(A.x, A.y, '', { kind: 'hi', r: 5 });
      s += atom(ch2.x, ch2.y, '', { kind: 'warn', r: 6 });
      s += text(ch2.x + 2, ch2.y - 14, 'CH₂', { cls: 'fg-tag-warn', size: 10 });
      s += text(530, 212, 'benzyl, C₆H₅CH₂–  ·  seven carbons', { cls: 'fg-tag-good', size: 11 });
    }
    s += text(360, 240, 'The dot is the bond to the rest of the molecule.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Phenyl and benzyl, which are one carbon apart and are both used constantly. Phenyl is the benzene ring bonded directly through a ring carbon. Benzyl is the ring plus a CH₂, bonded through that CH₂, so the ring is one bond further away from whatever it is attached to.',
  note: 'The reason the words matter beyond spelling is that the CH₂ in a benzyl group is the benzylic carbon, and the chemistry at that carbon (in <a class="chapter-ref" href="/ochem/learn.html#m-aromatic-breadth">Aromatic Follow-Through</a>) is nothing like the chemistry at a ring carbon. Benzyl alcohol is PhCH₂OH, a primary alcohol; phenol is PhOH, and is not an alcohol at all.',
});


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

/* ---------------------------------------------------------------- F1 ---
   Four organic molecules as Lewis structures, with every lone pair drawn and
   each atom's quota written under it. The valence-rule method the section
   now teaches is a table; this is the table applied four times. */
FIGURES.push({
  id: 'organic-lewis-structures',
  section: 'lewis-structures',
  anchor: '<h3>The general-chemistry recipe, for molecules with a real center</h3>',
  viewBox: '0 0 760 300',
  alt: 'Four Lewis structures drawn side by side: ethanol, methylamine, acetic acid and the methoxide ion, each with every lone pair shown as a pair of dots and each heavy atom labeled with how many bonds and lone pairs it carries.',
  build() {
    let s = '';
    const quota = (x, y, t) => text(x, y, t, { cls: 'fg-tag-good', size: 10.5 });

    // Ethanol, CH3-CH2-O-H
    {
      const x = 14; s += panel(x, 16, 176, 200);
      s += text(x + 88, 40, 'ethanol', { cls: 'fg-lbl', size: 12.5 });
      const C1 = P(x + 34, 104), C2 = P(x + 88, 104), O = P(x + 142, 104), H = P(x + 142, 156);
      s += bond(C1, C2); s += bond(C2, O); s += bond(O, H);
      s += atom(C1.x, C1.y, 'CH₃'); s += atom(C2.x, C2.y, 'CH₂');
      s += atom(O.x, O.y, 'O', { kind: 'hi' }); s += atom(H.x, H.y, 'H');
      s += lonePair(O.x, O.y, 270); s += lonePair(O.x, O.y, 40);
      s += quota(x + 88, 186, 'O: 2 bonds + 2 pairs = 4');
      s += quota(x + 88, 202, 'both C: 4 bonds, no pair');
    }
    // Methylamine, CH3-NH2
    {
      const x = 204; s += panel(x, 16, 176, 200);
      s += text(x + 88, 40, 'methylamine', { cls: 'fg-lbl', size: 12.5 });
      const C = P(x + 44, 104), N = P(x + 104, 104), H1 = P(x + 148, 74), H2 = P(x + 148, 138);
      s += bond(C, N); s += bond(N, H1); s += bond(N, H2);
      s += atom(C.x, C.y, 'CH₃');
      s += atom(N.x, N.y, 'N', { kind: 'hi' });
      s += atom(H1.x, H1.y, 'H'); s += atom(H2.x, H2.y, 'H');
      s += lonePair(N.x, N.y, 270);
      s += quota(x + 88, 186, 'N: 3 bonds + 1 pair = 4');
      s += quota(x + 88, 202, 'that pair is all of amine chemistry');
    }
    // Acetic acid, CH3-C(=O)-O-H
    {
      const x = 394; s += panel(x, 16, 186, 200);
      s += text(x + 93, 40, 'acetic acid', { cls: 'fg-lbl', size: 12.5 });
      const CM = P(x + 34, 122), C = P(x + 94, 122), Od = P(x + 94, 70), Os = P(x + 150, 122), H = P(x + 150, 172);
      s += bond(CM, C); s += bond(C, Od, { order: 2 }); s += bond(C, Os); s += bond(Os, H);
      s += atom(CM.x, CM.y, 'CH₃'); s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(Od.x, Od.y, 'O'); s += atom(Os.x, Os.y, 'O'); s += atom(H.x, H.y, 'H');
      s += lonePair(Od.x, Od.y, 200); s += lonePair(Od.x, Od.y, 340);
      s += lonePair(Os.x, Os.y, 20); s += lonePair(Os.x, Os.y, 300);
      s += quota(x + 93, 186, 'middle C: 4 bonds — the C=O counts twice');
      s += quota(x + 93, 202, 'each O: 2 bonds + 2 pairs');
    }
    // Methoxide, CH3-O(-)
    {
      const x = 594; s += panel(x, 16, 152, 200);
      s += text(x + 76, 40, 'methoxide ion', { cls: 'fg-lbl', size: 12.5 });
      const C = P(x + 44, 110), O = P(x + 108, 110);
      s += bond(C, O);
      s += atom(C.x, C.y, 'CH₃');
      s += atom(O.x, O.y, 'O', { kind: 'warn' });
      s += lonePair(O.x, O.y, 45); s += lonePair(O.x, O.y, 315); s += lonePair(O.x, O.y, 0, { dist: 28 });
      s += text(x + 108, 78, '−', { cls: 'fg-tag-warn', size: 14 });
      s += quota(x + 76, 186, 'O: 1 bond + 3 pairs');
      s += quota(x + 76, 202, 'one short of quota → −1');
    }
    s += rule(14, 240, 746, 240);
    s += text(380, 262, 'bonds + lone pairs = 4 for C, N, O and the halogens', { cls: 'fg-lbl', size: 12 });
    s += text(380, 284, 'Every departure from the quota is a formal charge — and none of this needed a central atom.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The valence rule applied four times. Each heavy atom takes its quota of bonds, lone pairs fill the rest of the octet, and the only atom that departs from its quota — methoxide’s oxygen, one bond short — is the only atom carrying a charge. Read the lone pairs on the oxygens and nitrogen especially: they are drawn in every structure in this course, and leaving them off is how charges get lost later.',
  note: 'Acetic acid is the one to study. The two oxygens in <b>CH₃COOH</b> are not a chain of two oxygens: the first is doubly bonded to the carbon and the second carries the hydrogen, which is why the middle carbon reaches four bonds and the formula is not read left to right like the rest.',
});

/* ---------------------------------------------------------------- F2 ---
   Four impossible structures beside their corrections. A wrong/right pair
   teaches a trap better than a sentence about it, because the reader has to
   look at the wrong one to see what is wrong with it. */
FIGURES.push({
  id: 'four-wrong-structures',
  section: 'lewis-structures',
  anchor: '<h3>Three real exceptions to the octet rule</h3>',
  viewBox: '0 0 760 250',
  alt: 'Four pairs of drawings. In each pair an impossible structure is shown on the left and its correction on the right: a five-bonded carbon corrected to four bonds, a nitrogen with four bonds and no charge corrected to carry a plus one, an oxygen with three bonds and no charge corrected to carry a plus one, and a hydrogen drawn bridging two carbons corrected to a single bond.',
  build() {
    let s = '';
    const cell = (x, title) => { s += panel(x, 16, 176, 172); s += text(x + 88, 40, title, { cls: 'fg-lbl', size: 12 }); };

    // 1. five-bonded carbon
    {
      const x = 14; cell(x, 'C: 5 bonds');
      const C = P(x + 60, 104);
      [[0, -42], [0, 42], [-42, 0], [30, -30], [30, 30]].forEach(([dx, dy]) =>
        s += bond(C, P(C.x + dx, C.y + dy), { rTo: 9 }));
      s += atom(C.x, C.y, 'C', { kind: 'warn' });
      s += text(x + 88, 160, '10 electrons, period 2', { cls: 'fg-tag-warn', size: 10 });
      s += text(x + 88, 176, 'no orbital holds them', { cls: 'fg-sm', size: 10 });
    }
    // 2. neutral four-bond nitrogen
    {
      const x = 204; cell(x, 'N: 4 bonds, no charge');
      const N = P(x + 70, 104);
      [[0, -42], [0, 42], [-42, 0], [42, 0]].forEach(([dx, dy]) =>
        s += bond(N, P(N.x + dx, N.y + dy), { rTo: 9 }));
      s += atom(N.x, N.y, 'N', { kind: 'warn' });
      s += text(x + 88, 160, '5 − 0 − 4 = +1', { cls: 'fg-tag-warn', size: 10 });
      s += text(x + 88, 176, 'legal — but write the +', { cls: 'fg-sm', size: 10 });
    }
    // 3. neutral three-bond oxygen
    {
      const x = 394; cell(x, 'O: 3 bonds, no charge');
      const O = P(x + 70, 104);
      [[0, -42], [-40, 24], [40, 24]].forEach(([dx, dy]) =>
        s += bond(O, P(O.x + dx, O.y + dy), { rTo: 9 }));
      s += atom(O.x, O.y, 'O', { kind: 'warn' });
      s += lonePair(O.x, O.y, 160);
      s += text(x + 88, 160, '6 − 2 − 3 = +1', { cls: 'fg-tag-warn', size: 10 });
      s += text(x + 88, 176, 'the arrow-pushing slip', { cls: 'fg-sm', size: 10 });
    }
    // 4. bridging hydrogen
    {
      const x = 584; cell(x, 'H: 2 bonds');
      const A = P(x + 40, 104), H = P(x + 88, 104), B = P(x + 136, 104);
      s += bond(A, H); s += bond(H, B);
      s += atom(A.x, A.y, 'C'); s += atom(B.x, B.y, 'C');
      s += atom(H.x, H.y, 'H', { kind: 'warn' });
      s += text(x + 88, 160, 'one shell, one pair', { cls: 'fg-tag-warn', size: 10 });
      s += text(x + 88, 176, 'H bonds to one thing', { cls: 'fg-sm', size: 10 });
    }
    s += rule(14, 208, 746, 208);
    s += text(380, 230, 'Two can never be drawn at all; two are correct structures missing their charge.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The four structures a first course draws most often and cannot draw. The first and the last are impossible outright: a period-2 atom has four orbitals and hydrogen has one, so ten electrons on carbon and four on hydrogen have nowhere to sit. The middle two are perfectly good structures that are simply missing their charge — four-bonded nitrogen and three-bonded oxygen exist everywhere in this course, and neither is ever neutral.',
  note: 'The valence rule catches all four in about two seconds each: work out what the atom’s quota is (C 4 bonds, N 3 + 1 pair, O 2 + 2 pairs, H 1), compare it to what is drawn, and if there is a difference either write the charge the arithmetic gives or redraw the bond.',
});

/* ---------------------------------------------------------------- F3 ---
   A neutral molecule that must be drawn with charges inside it. The section
   works nitromethane in prose; a reader who has only ever seen charges on
   ions needs to see the + and the - sitting on a molecule with none. */
FIGURES.push({
  id: 'nitro-group-charges',
  section: 'formal-charge',
  anchor: '<h3>The built-in check</h3>',
  viewBox: '0 0 760 250',
  alt: 'Nitromethane drawn twice. On the left, the tempting structure with nitrogen double-bonded to both oxygens, marked impossible because nitrogen would have five bonds. On the right, the correct structure with one double bond and one single bond, a plus one on nitrogen and a minus one on the singly bonded oxygen, summing to zero.',
  build() {
    let s = '';
    // Left: the tempting, impossible structure.
    {
      const C = P(110, 130), N = P(186, 130), O1 = P(252, 86), O2 = P(252, 174);
      s += text(186, 40, 'what most people draw first', { cls: 'fg-tag-warn', size: 11.5 });
      s += bond(C, N); s += bond(N, O1, { order: 2 }); s += bond(N, O2, { order: 2 });
      s += atom(C.x, C.y, 'CH₃');
      s += atom(N.x, N.y, 'N', { kind: 'warn' });
      s += atom(O1.x, O1.y, 'O'); s += atom(O2.x, O2.y, 'O');
      s += lonePair(O1.x, O1.y, 20); s += lonePair(O1.x, O1.y, 330);
      s += lonePair(O2.x, O2.y, 30); s += lonePair(O2.x, O2.y, 340);
      s += text(186, 214, 'no charges anywhere — and 5 bonds on N', { cls: 'fg-tag-warn', size: 11 });
      s += text(186, 232, 'ten electrons on a period-2 atom: impossible', { cls: 'fg-sm', size: 10.5 });
    }
    s += rule(380, 40, 380, 236);
    // Right: the real structure.
    {
      const C = P(470, 130), N = P(546, 130), O1 = P(612, 86), O2 = P(612, 174);
      s += text(546, 40, 'the structure that works', { cls: 'fg-tag-good', size: 11.5 });
      s += bond(C, N); s += bond(N, O1, { order: 2 }); s += bond(N, O2);
      s += atom(C.x, C.y, 'CH₃');
      s += atom(N.x, N.y, 'N', { kind: 'hi' });
      s += atom(O1.x, O1.y, 'O'); s += atom(O2.x, O2.y, 'O', { kind: 'warn' });
      s += lonePair(O1.x, O1.y, 20); s += lonePair(O1.x, O1.y, 330);
      s += lonePair(O2.x, O2.y, 30); s += lonePair(O2.x, O2.y, 90); s += lonePair(O2.x, O2.y, 340);
      s += text(546, 104, '+', { cls: 'fg-tag-warn', size: 14 });
      s += text(640, 160, '−', { cls: 'fg-tag-warn', size: 14 });
      s += text(546, 214, 'N: 5 − 0 − 4 = +1   ·   lower O: 6 − 6 − 1 = −1', { cls: 'fg-tag-good', size: 11 });
      s += text(546, 232, 'sum = 0, and the molecule is neutral', { cls: 'fg-sm', size: 10.5 });
    }
    return s;
  },
  caption: 'Nitromethane is a neutral molecule that cannot be drawn without charges in it. The tidy-looking structure on the left gives nitrogen five bonds, which period 2 cannot do; forcing it down to four leaves the arithmetic no choice, and a +1 on nitrogen appears beside a −1 on the singly bonded oxygen. They cancel, which is why the molecule is neutral overall.',
  note: 'This is the trap the worked examples in this section are built around: “neutral molecule” is a statement about the <i>sum</i> of the formal charges, not about each atom. Any nitro group you meet from here on — in a nitrated aromatic ring, in TNT, in a nitroalkane — is drawn exactly this way, and one without the charges is wrong.',
});

/* ---------------------------------------------------------------- F4 ---
   The section's three worked examples are drugs given as condensed formulas
   and the reader is asked to "circle each group". Nothing is drawn, so
   there is nothing to circle. This draws them. */
FIGURES.push({
  id: 'three-drugs-groups-named',
  section: 'functional-groups',
  anchor: '<h3>What carries forward</h3>',
  viewBox: '0 0 760 356',
  alt: 'Aspirin, acetaminophen and ibuprofen drawn as condensed formulas around a benzene ring, with every functional group boxed and named: carboxylic acid and ester on aspirin, phenol and amide on acetaminophen, carboxylic acid and two alkyl branches on ibuprofen.',
  build() {
    let s = '';
    /* A benzene ring drawn as a hexagon with the inner circle, which is what
       C6H4 and C6H5 stand for in the condensed formulas the section uses. */
    const ring = (cx, cy, R = 30) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 - 90) * Math.PI / 180;
        pts.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
      }
      let g = '';
      for (let i = 0; i < 6; i++) g += bond(pts[i], pts[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      g += `<circle class="fg-bond" cx="${cx}" cy="${cy}" r="${R * 0.56}" fill="none"></circle>`;
      return { g, pts };
    };
    /* A group written as a tinted chip rather than a circle: the labels here
       are whole condensed fragments, and a disc big enough to hold one is big
       enough to collide with everything around it. */
    const chip = (cx, cy, lab, kind) => {
      const w = lab.length * 7.4 + 16;
      return { g: panel(cx - w / 2, cy - 13, w, 26, { kind, r: 9 }) +
                  text(cx, cy + 4, lab, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag', size: 11 }),
               half: w / 2 };
    };
    const link = (a, b, stop) => bond(a, b, { rFrom: 0, rTo: stop });

    const panels = [
      {
        x: 14, name: 'aspirin', cx: 82, cy: 150,
        groups: [
          { at: 0, to: P(82, 80),  lab: 'COOH', kind: 'warn', stop: 16 },
          { at: 1, to: P(186, 146), lab: 'OCOCH₃', kind: 'warn', stop: 36 },
        ],
        lines: ['COOH = carboxylic acid', 'O–CO–CH₃ = ester', 'plus the ring — an aromatic'],
      },
      {
        x: 268, name: 'acetaminophen', cx: 336, cy: 150,
        groups: [
          { at: 0, to: P(336, 80), lab: 'OH', kind: 'warn', stop: 16 },
          { at: 3, to: P(400, 212), lab: 'NHCOCH₃', kind: 'warn', stop: 40 },
        ],
        lines: ['OH on the ring = phenol', 'NH–CO–CH₃ = amide', 'no carboxylic acid anywhere'],
      },
      {
        x: 522, name: 'ibuprofen', cx: 610, cy: 150,
        groups: [
          { at: 0, to: P(610, 80), lab: 'CH(CH₃)COOH', kind: 'warn', stop: 16 },
          { at: 3, to: P(610, 216), lab: 'CH₂CH(CH₃)₂', kind: null, stop: 16 },
        ],
        lines: ['COOH = carboxylic acid', 'the rest is spectator carbon', 'acid + ring, six spectator carbons'],
      },
    ];
    for (const p of panels) {
      s += panel(p.x, 16, 226, 236);
      s += text(p.x + 113, 40, p.name, { cls: 'fg-lbl', size: 12.5 });
      const r = ring(p.cx, p.cy); s += r.g;
      for (const g of p.groups) {
        const c = chip(g.to.x, g.to.y, g.lab, g.kind);
        s += link(r.pts[g.at], g.to, g.stop);
        s += c.g;
      }
      p.lines.forEach((t, i) =>
        s += text(p.x + 113, 276 + i * 17, t, { cls: i === 2 ? 'fg-sm' : 'fg-tag-good', size: i === 2 ? 10 : 10.5 }));
    }
    s += rule(14, 256, 746, 256);
    s += text(380, 344, 'Three drugs, five groups between them, and every other atom is skeleton.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The three molecules the worked examples run through, with the groups marked. Aspirin carries a carboxylic acid and an ester on the same ring; acetaminophen carries a phenol and an amide, and no acid at all despite the name most people expect; ibuprofen carries one carboxylic acid; of its other twelve carbons, six are the aromatic ring and six are genuinely spectator.',
  note: 'Compare the two O–CO patterns. In aspirin the ring oxygen leads to a carbonyl, which makes it an <b>ester</b>; in acetaminophen a ring nitrogen leads to a carbonyl, which makes it an <b>amide</b>. One atom apart, and the difference decides how each one is broken down in the body — which is why aspirin hydrolyzes in the stomach and acetaminophen does not.',
});

/* ---------------------------------------------------------------- F5 ---
   The degree trap, drawn. The same tert-butyl skeleton twice: counting on
   the carbon for the alcohol, on the nitrogen for the amine. */
FIGURES.push({
  id: 'degree-counted-twice',
  section: 'functional-groups',
  anchor: '<h3>Why polarity tells you where a group will react</h3>',
  viewBox: '0 0 760 250',
  alt: 'Two structures built on the same tert-butyl group. On the left the OH version, whose central carbon carries three methyl groups, is labeled a tertiary alcohol. On the right the NH2 version, whose nitrogen carries one carbon, is labeled a primary amine.',
  build() {
    let s = '';
    const skeleton = (cx, cy, tail, kind) => {
      const C = P(cx, cy), X = P(cx + 72, cy);
      let g = '';
      [[-52, -34], [-52, 34], [0, 52]].forEach(([dx, dy]) => {
        const m = P(cx + dx, cy + dy);
        g += bond(C, m, { rTo: 17 });
        g += atom(m.x, m.y, 'CH₃', { r: 17 });
      });
      g += bond(C, X, { rTo: 17 });
      g += atom(C.x, C.y, 'C', { kind: 'hi' });
      g += atom(X.x, X.y, tail, { kind: kind, r: 17 });
      return { g, X };
    };
    {
      const x = 150, y = 116;
      s += text(x + 20, 40, '(CH₃)₃C–OH', { cls: 'fg-lbl', size: 13 });
      const a = skeleton(x, y, 'OH', 'warn'); s += a.g;
      s += lonePair(a.X.x, a.X.y, 320, { dist: 24 }); s += lonePair(a.X.x, a.X.y, 40, { dist: 24 });
      s += text(x + 20, 190, 'count the carbons on the CARBON: 3', { cls: 'fg-tag-good', size: 11 });
      s += text(x + 20, 212, 'tertiary alcohol', { cls: 'fg-lbl', size: 12.5 });
      s += text(x + 20, 234, 'the OH sits on a carbon with no H of its own', { cls: 'fg-sm', size: 10 });
    }
    s += rule(392, 40, 392, 236);
    {
      const x = 528, y = 116;
      s += text(x + 20, 40, '(CH₃)₃C–NH₂', { cls: 'fg-lbl', size: 13 });
      const b = skeleton(x, y, 'NH₂', 'warn'); s += b.g;
      s += lonePair(b.X.x, b.X.y, 320, { dist: 26 });
      s += text(x + 20, 190, 'count the carbons on the NITROGEN: 1', { cls: 'fg-tag-good', size: 11 });
      s += text(x + 20, 212, 'primary amine', { cls: 'fg-lbl', size: 12.5 });
      s += text(x + 20, 234, 'the same skeleton, the opposite answer', { cls: 'fg-sm', size: 10 });
    }
    return s;
  },
  caption: 'The same tert-butyl group with two different groups on it, and two opposite answers. For an alcohol or an alkyl halide you count the carbons attached to the carbon bearing the group, and this one has three: tertiary. For an amine you count the carbons attached to the nitrogen, and this one has one: primary.',
  note: 'The rule is not arbitrary. Degree exists to say how crowded the reacting atom is, and the reacting atom is different in the two cases: an alcohol reacts at its carbon, so the carbon’s neighbors are what matter, while an amine reacts through the lone pair on its nitrogen, so the nitrogen’s neighbors are. Both structures reduce to that one question.',
});

/* ---------------------------------------------------------------- F6 ---
   The fill order as a ladder. The section argues 4s below 3d in prose and
   gives a reader nothing to look at; this is the argument as a picture,
   with the n=2 count that the octet rule rests on marked on it. */
FIGURES.push({
  id: 'orbital-energy-ladder',
  section: 'orbitals',
  anchor: '<h3>Why the periodic table has that stair-step shape</h3>',
  viewBox: '0 0 760 340',
  alt: 'An energy ladder of orbitals from 1s at the bottom to 3d at the top, with each subshell drawn as its boxes: one box for each s, three for each p, five for 3d. The 4s rung is drawn below the 3d rung, and the 2s and 2p rungs are bracketed together and labeled as the four orbitals that make the octet.',
  build() {
    let s = '';
    const rungs = [
      { y: 300, name: '1s', boxes: 1 },
      { y: 254, name: '2s', boxes: 1 },
      { y: 216, name: '2p', boxes: 3 },
      { y: 166, name: '3s', boxes: 1 },
      { y: 130, name: '3p', boxes: 3 },
      { y: 86,  name: '4s', boxes: 1 },
      { y: 52,  name: '3d', boxes: 5 },
    ];
    s += arrow(P(60, 318), P(60, 36));
    s += text(36, 176, 'energy', { cls: 'fg-tag', size: 11, anchor: 'middle' });
    for (const r of rungs) {
      const w = 26, gap = 5, x0 = 150;
      for (let i = 0; i < r.boxes; i++) {
        s += `<rect class="fg-panel" x="${x0 + i * (w + gap)}" y="${r.y - 12}" width="${w}" height="22" rx="4"></rect>`;
      }
      s += text(126, r.y + 4, r.name, { cls: 'fg-lbl', size: 12.5, anchor: 'end' });
      s += text(x0 + r.boxes * (w + gap) + 8, r.y + 4,
                r.boxes === 1 ? '1 orbital · holds 2' : r.boxes + ' orbitals · hold ' + (r.boxes * 2),
                { cls: 'fg-sm', size: 10, anchor: 'start' });
    }
    // The n = 2 bracket: four orbitals, eight electrons, the octet.
    s += `<rect class="fg-fill-hi" x="140" y="200" width="200" height="70" rx="8" opacity="0.14"></rect>`;
    s += text(414, 232, 'n = 2: one 2s + three 2p = 4 orbitals, 8 electrons', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(414, 250, 'this, and nothing else, is the octet rule', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    // The inversion.
    s += text(414, 72, '4s sits BELOW 3d — an s electron penetrates', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(414, 90, 'closer to the nucleus, so it is shielded less', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(414, 108, 'and held harder. Potassium fills 4s first.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += rule(60, 326, 740, 326);
    s += text(400, 338, 'Fill from the bottom, one electron per box across a rung before any box doubles up.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The filling order as a ladder rather than a sentence. Two things are worth reading off it. The n = 2 shell is four boxes wide — one 2s and three 2p — and four boxes hold eight electrons, which is the whole of the octet rule. And the 4s rung sits below the 3d rung even though 4 is larger than 3, which is why the d-block starts in row 4.',
  note: 'The rung widths are the part to remember. An s subshell is always one orbital, a p always three, a d always five, whatever shell they belong to — so the maximum occupancy of any subshell is just twice its width, and a shell’s capacity is the sum of its rungs: 2 for n = 1, 8 for n = 2, 18 for n = 3.',
});

/* ---------------------------------------------------------------- F7 ---
   What a covalent bond IS, in the shell picture the section is already
   using. The prose says "sharing electrons is precisely what a covalent
   bond is" with nothing beside it, and the whole idea is that ONE pair is
   counted by BOTH atoms, which is exactly the kind of claim a drawing can
   make and a sentence cannot. */
FIGURES.push({
  id: 'shared-pair-counts-twice',
  section: 'atomic-structure',
  anchor: '<h3>Transfer or share: the two ways to satisfy an octet</h3>',
  viewBox: '0 0 760 280',
  alt: 'Two overlapping shell diagrams for a hydrogen molecule and, beside them, a sodium and a chlorine drawn separately as ions. In the shared picture one pair of electrons sits in the overlap and is counted by both atoms; in the transferred picture the electron has moved completely from sodium to chlorine and the two carry full charges.',
  build() {
    let s = '';
    // Left: sharing.
    {
      s += text(190, 40, 'SHARING — a covalent bond', { cls: 'fg-tag-good', size: 12 });
      const A = P(140, 140), B = P(240, 140);
      s += `<circle class="fg-orb-node" cx="${A.x}" cy="${A.y}" r="56"></circle>`;
      s += `<circle class="fg-orb-node" cx="${B.x}" cy="${B.y}" r="56"></circle>`;
      s += atom(A.x, A.y, 'H'); s += atom(B.x, B.y, 'H');
      // the shared pair, in the overlap
      s += `<circle class="fg-lp" cx="186" cy="140" r="4.6"></circle>`;
      s += `<circle class="fg-lp" cx="200" cy="140" r="4.6"></circle>`;
      s += text(190, 118, 'one pair', { cls: 'fg-tag-good', size: 10.5 });
      s += text(190, 216, 'the pair sits in the overlap, and BOTH', { cls: 'fg-sm', size: 10.5 });
      s += text(190, 232, 'atoms count it toward a full shell', { cls: 'fg-sm', size: 10.5 });
      s += text(190, 256, 'neither atom pays for a charge', { cls: 'fg-tag-good', size: 11 });
    }
    s += rule(380, 40, 380, 266);
    // Right: transfer.
    {
      s += text(570, 40, 'TRANSFER — an ionic bond', { cls: 'fg-tag', size: 12 });
      const A = P(500, 140), B = P(646, 140);
      s += `<circle class="fg-orb-node" cx="${A.x}" cy="${A.y}" r="42"></circle>`;
      s += `<circle class="fg-orb-node" cx="${B.x}" cy="${B.y}" r="56"></circle>`;
      s += atom(A.x, A.y, 'Na', { kind: 'warn' }); s += atom(B.x, B.y, 'Cl', { kind: 'warn' });
      s += text(500, 86, '+', { cls: 'fg-tag-warn', size: 15 });
      s += text(646, 74, '−', { cls: 'fg-tag-warn', size: 15 });
      s += arrow(P(546, 140), P(584, 140));
      s += `<circle class="fg-lp" cx="612" cy="140" r="4.6"></circle>`;
      s += text(565, 118, 'the electron', { cls: 'fg-sm', size: 10 });
      s += text(570, 216, 'the electron has moved across entirely;', { cls: 'fg-sm', size: 10.5 });
      s += text(570, 232, 'nothing is shared, and the ions attract', { cls: 'fg-sm', size: 10.5 });
      s += text(570, 256, 'both atoms now carry a full charge', { cls: 'fg-tag', size: 11 });
    }
    return s;
  },
  caption: 'The two ways to fill a shell, side by side. On the left one pair of electrons sits between the two hydrogens and each atom counts that same pair toward its own full shell — which is why sharing is cheap and why two atoms can both be satisfied by two electrons. On the right the electron has gone across completely: sodium is left a cation, chlorine an anion, and nothing is shared at all.',
  note: 'Carbon can do neither trick on its own terms. Four electrons is too many to give away and too many to take on, so every bond carbon makes is the left-hand picture — which is the reason organic chemistry is a covalent subject from end to end, and why the ions you do meet (a sodium beside a carboxylate, a lithium beside an alkoxide) sit at the edges of a molecule rather than inside it.',
});

/* ---------------------------------------------------------------- F8 ---
   A triple bond's two pi bonds, drawn perpendicular. The notes say "a
   triple bond is not three of the same thing" and the acetonitrile figure
   labels "1 sigma + 2 pi" without drawing the second overlap, which is
   exactly the thing a reader cannot picture. */
FIGURES.push({
  id: 'triple-bond-two-pi',
  section: 'bonding',
  anchor: '<h3>Bond length and strength</h3>',
  viewBox: '0 0 760 280',
  alt: 'A carbon-carbon triple bond drawn in three panels: the sigma bond along the axis, the first pi bond from p orbitals above and below the axis, and the second pi bond from p orbitals in front of and behind it, perpendicular to the first.',
  build() {
    let s = '';
    const lobe = (cx, cy, rx, ry, cls) =>
      `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill-opacity="0.18"></ellipse>`;
    const panels = [
      { x: 14,  title: 'the σ bond', sub: 'head-on, along the axis' },
      { x: 262, title: 'the first π', sub: 'p orbitals above and below' },
      { x: 510, title: 'the second π', sub: 'p orbitals in front and behind' },
    ];
    panels.forEach((p, i) => {
      s += panel(p.x, 16, 236, 200);
      const cx = p.x + 118;
      s += text(cx, 40, p.title, { cls: 'fg-lbl', size: 12.5 });
      const A = P(cx - 44, 124), B = P(cx + 44, 124);
      if (i === 0) {
        s += lobe(cx, 124, 46, 18, 'fg-orb');
        s += bond(A, B);
      } else if (i === 1) {
        s += lobe(cx, 96, 44, 20, 'fg-orb');
        s += lobe(cx, 152, 44, 20, 'fg-orb');
        s += bond(A, B, { cls: 'fg-bond-soft' });
      } else {
        // perpendicular: drawn as two lobes offset on the other diagonal, so
        // the reader sees a different pair of lobes in a different place.
        s += lobe(cx - 24, 100, 28, 24, 'fg-orb');
        s += lobe(cx + 24, 148, 28, 24, 'fg-orb');
        s += text(cx - 76, 96, 'front', { cls: 'fg-sm', size: 9.5 });
        s += text(cx + 76, 152, 'behind', { cls: 'fg-sm', size: 9.5 });
        s += bond(A, B, { cls: 'fg-bond-soft' });
      }
      s += atom(A.x, A.y, 'C'); s += atom(B.x, B.y, 'C');
      s += text(cx, 190, p.sub, { cls: 'fg-sm', size: 10.5 });
    });
    s += rule(14, 234, 746, 234);
    s += text(380, 254, 'Three bonds, three different overlaps.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 274, 'Only the sigma holds the carbons end-on, and the two pi bonds sit at right angles.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'A triple bond taken apart. One sigma, made head-on along the axis, plus two pi bonds made sideways from two perpendicular pairs of p orbitals. Drawing them separately is the point: a triple bond is not three copies of the same thing, and the increments in the strength table (64 kcal/mol for the first pi, 53 for the second) are measuring three different overlaps.',
  note: 'The right angle between the two pi bonds is forced. Each sp carbon has exactly two leftover p orbitals, and those two are perpendicular to each other and to the bond axis — so the second pi bond has nowhere else to go. It also explains why nothing can rotate: turning one carbon would break both pi bonds at once.',
});



/* ---------------------------------------------------------------- F9 ---
   Lone pairs are electron groups, and the group-count worked examples for
   ammonia and water are the two where a reader forgets that. Drawing the
   pair in the fourth corner is the whole argument. */
FIGURES.push({
  id: 'lone-pairs-are-groups',
  section: 'hybridization',
  anchor: '<h3>The shortcut you will actually use</h3>',
  viewBox: '0 0 760 250',
  alt: 'Methane, ammonia and water drawn side by side, each with four electron groups around the central atom. Methane has four bonds, ammonia three bonds and one lone pair drawn in the fourth corner, water two bonds and two lone pairs, and all three are labeled sp3.',
  build() {
    let s = '';
    const cases = [
      { x: 14,  name: 'methane, CH₄',  el: 'C', bonds: 4, count: '4 bonds + 0 pairs' },
      { x: 268, name: 'ammonia, NH₃',  el: 'N', bonds: 3, count: '3 bonds + 1 pair' },
      { x: 522, name: 'water, H₂O',    el: 'O', bonds: 2, count: '2 bonds + 2 pairs' },
    ];
    /* Four tetrahedral directions, drawn flat: two up, two down. Whichever
       corners are not bonds are drawn as a lone pair in the same place, so
       the reader sees that a pair occupies a corner exactly as a bond does. */
    const dirs = [[-52, -40], [52, -40], [-52, 44], [52, 44]];
    for (const c of cases) {
      s += panel(c.x, 16, 226, 176);
      const cx = c.x + 113, cy = 108;
      s += text(cx, 40, c.name, { cls: 'fg-lbl', size: 12.5 });
      dirs.forEach(([dx, dy], i) => {
        const at = P(cx + dx, cy + dy);
        if (i < c.bonds) {
          s += bond(P(cx, cy), at, { rFrom: 16, rTo: 13 });
          s += atom(at.x, at.y, 'H', { r: 13 });
        } else {
          s += `<circle class="fg-orb" cx="${at.x}" cy="${at.y}" r="15" fill-opacity="0.16"></circle>`;
          s += text(at.x, at.y + 4, 'lp', { cls: 'fg-sm', size: 9.5 });
          s += bond(P(cx, cy), at, { rFrom: 16, rTo: 16, cls: 'fg-dash' });
        }
      });
      s += atom(cx, cy, c.el, { kind: 'hi' });
      s += text(cx, 182, c.count + ' = 4 groups', { cls: 'fg-tag-good', size: 11 });
    }
    s += rule(14, 208, 746, 208);
    s += text(380, 228, 'Four groups every time, so all three are sp³ and all three are built on a tetrahedron.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 246, 'What changes is how many corners hold an atom — which is the shape, not the hybridization.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The three worked examples with the lone pairs drawn. Counting groups means counting corners, and a lone pair occupies a corner exactly as a bonded atom does — so ammonia and water have the same four groups methane has, and all three are sp³. Forgetting the pairs always answers one step too unsaturated: sp² for ammonia, sp for water.',
  note: 'Keep hybridization and shape apart. All three are sp³, because all three have four groups; their <i>shapes</i> differ — tetrahedral, trigonal pyramidal, bent — because shape describes where the atoms are and ignores the pairs. Molecular Geometry is about that second question.',
});

/* --------------------------------------------------------------- F10 ---
   The section's own worked examples say "the molecule has a shape at every
   atom" and then list the shapes in prose. This is that sentence drawn: two
   molecules with the geometry written at each heavy atom. */
FIGURES.push({
  id: 'shape-at-every-atom',
  section: 'molecular-geometry',
  anchor: '<h3>Drawing three dimensions on paper</h3>',
  viewBox: '0 0 760 260',
  alt: 'Ethanol and acetic acid drawn as condensed structures with the geometry written under each heavy atom: tetrahedral at both carbons of ethanol and bent at its oxygen, and tetrahedral at the methyl carbon of acetic acid, trigonal planar at its carbonyl carbon, trigonal planar at the carbonyl oxygen and bent at the OH oxygen.',
  build() {
    let s = '';
    const note = (x, y, a, b) => text(x, y, a, { cls: 'fg-tag-good', size: 10.5 }) +
                                 text(x, y + 16, b, { cls: 'fg-sm', size: 10 });
    // Ethanol
    {
      s += panel(14, 16, 352, 150);
      s += text(190, 40, 'ethanol, CH₃CH₂OH', { cls: 'fg-lbl', size: 12.5 });
      const C1 = P(84, 96), C2 = P(172, 96), O = P(260, 96), H = P(312, 130);
      s += bond(C1, C2, { rFrom: 20, rTo: 20 }); s += bond(C2, O, { rFrom: 20, rTo: 15 }); s += bond(O, H, { rFrom: 15, rTo: 12 });
      s += atom(C1.x, C1.y, 'CH₃', { r: 20 }); s += atom(C2.x, C2.y, 'CH₂', { r: 20 });
      s += atom(O.x, O.y, 'O', { kind: 'hi' }); s += atom(H.x, H.y, 'H', { r: 12 });
      s += lonePair(O.x, O.y, 250); s += lonePair(O.x, O.y, 300);
      s += note(84, 138, '4 groups', 'tetrahedral');
      s += note(172, 138, '4 groups', 'tetrahedral');
      s += note(262, 138, '4 groups', 'bent, 104.5°');
    }
    // Acetic acid
    {
      s += panel(394, 16, 352, 150);
      s += text(570, 40, 'acetic acid, CH₃COOH', { cls: 'fg-lbl', size: 12.5 });
      const CM = P(452, 104), C = P(540, 104), Od = P(540, 56), Os = P(628, 104), H = P(676, 132);
      s += bond(CM, C, { rFrom: 20, rTo: 15 }); s += bond(C, Od, { order: 2, gap: 5, rFrom: 15, rTo: 14 });
      s += bond(C, Os, { rFrom: 15, rTo: 14 }); s += bond(Os, H, { rFrom: 14, rTo: 12 });
      s += atom(CM.x, CM.y, 'CH₃', { r: 20 });
      s += atom(Od.x, Od.y, 'O', { r: 14 }); s += atom(Os.x, Os.y, 'O', { kind: 'hi', r: 14 });
      s += atom(H.x, H.y, 'H', { r: 12 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += lonePair(Od.x, Od.y, 200); s += lonePair(Od.x, Od.y, 340);
      s += lonePair(Os.x, Os.y, 250); s += lonePair(Os.x, Os.y, 20);
      s += note(452, 138, '4 groups', 'tetrahedral');
      s += note(540, 138, '3 groups', 'trigonal planar');
      s += note(632, 138, '4 groups', 'bent');
      s += text(660, 52, '3 groups \u2014 in the plane', { cls: 'fg-tag-good', size: 10.5 });
    }
    s += rule(14, 186, 746, 186);
    s += text(380, 206, 'A molecule has a shape at every atom, read one atom at a time.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 226, 'The carbonyl carbon and its three neighbors are flat; the methyl beside it is not, and spins freely.', { cls: 'fg-sm', size: 10.5 });
    s += text(380, 246, 'Note the double bond counts once: the carbonyl carbon has three groups, not four.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The exam question this section is really preparing you for: given a molecule, give the geometry at every heavy atom. Run the group count once per atom and read the answer off the table. The oxygens are the ones people skip — they have shapes too, and both of acetic acid’s are different from each other.',
  note: 'Watch the two oxygens of acetic acid. The one carrying the hydrogen has two bonds and two lone pairs — four groups, so bent, like water. The doubly bonded one has one group from the double bond plus two lone pairs — three groups, so it sits in the plane of the carbonyl. Same element, same molecule, different count.',
});

/* --------------------------------------------------------------- F11 ---
   Where cis/trans comes from, drawn. The section makes the claim in prose
   and points forward; a reader who has not met alkene naming still needs to
   see that the two drawings are different substances. */
FIGURES.push({
  id: 'locked-rotation-cis-trans',
  section: 'bonding',
  anchor: '<h3>Bond strength is not the same as reactivity</h3>',
  viewBox: '0 0 760 250',
  alt: 'The two forms of 2-butene drawn side by side as condensed structures: cis, with both methyl groups on the same side of the locked double bond, and trans, with one on each side. A note says the single bond of butane by contrast rotates freely, so it has no such pair.',
  build() {
    let s = '';
    const alkene = (cx, cy, sameSide) => {
      const A = P(cx - 40, cy), B = P(cx + 40, cy);
      let g = bond(A, B, { order: 2, rFrom: 15, rTo: 15 });
      const m1 = P(cx - 84, cy - 42);
      const m2 = sameSide ? P(cx + 84, cy - 42) : P(cx + 84, cy + 42);
      const h1 = P(cx - 84, cy + 42);
      const h2 = sameSide ? P(cx + 84, cy + 42) : P(cx + 84, cy - 42);
      g += bond(A, m1, { rFrom: 15, rTo: 20 }) + atom(m1.x, m1.y, 'CH₃', { kind: 'hi', r: 20 });
      g += bond(B, m2, { rFrom: 15, rTo: 20 }) + atom(m2.x, m2.y, 'CH₃', { kind: 'hi', r: 20 });
      g += bond(A, h1, { rFrom: 15, rTo: 12 }) + atom(h1.x, h1.y, 'H', { r: 12 });
      g += bond(B, h2, { rFrom: 15, rTo: 12 }) + atom(h2.x, h2.y, 'H', { r: 12 });
      g += atom(A.x, A.y, 'C') + atom(B.x, B.y, 'C');
      return g;
    };
    s += panel(14, 16, 352, 176);
    s += text(190, 40, 'cis-2-butene', { cls: 'fg-lbl', size: 12.5 });
    s += alkene(190, 112, true);
    s += text(190, 182, 'both methyls on the same side', { cls: 'fg-tag-good', size: 11 });

    s += panel(394, 16, 352, 176);
    s += text(570, 40, 'trans-2-butene', { cls: 'fg-lbl', size: 12.5 });
    s += alkene(570, 112, false);
    s += text(570, 182, 'one methyl on each side', { cls: 'fg-tag-good', size: 11 });

    s += rule(14, 208, 746, 208);
    s += text(380, 228, 'Two different substances, not two drawings of one.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 248, 'They have different boiling points and different dipoles. Butane, on a single bond, spins freely and has no such pair.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'What a locked double bond buys. Because the pi bond stops the two carbons twisting past each other, the methyl groups cannot swap sides, and the two arrangements are separate compounds that can be bottled apart. Put the same four carbons on a single bond, as in butane, and the two ends spin freely millions of times a second — there is nothing to separate.',
  note: 'This is the first place in the course where a drawing carries information that a formula does not: both structures here are C₄H₈, and both are “CH₃CH=CHCH₃” written out. <a class="chapter-ref" href="/ochem/learn.html#m-alkenes-alkynes">Alkenes &amp; Alkynes</a> gives the pair their systematic names and the rule for when cis/trans applies at all.',
});


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
      g += bond(c2, me, { rFrom: 0, rTo: 0 });
      g += bond(c2, c3, { rFrom: 0, rTo: 0 });
      g += bond(c3, c4, { rFrom: 0, rTo: 0 });
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
    s += text(566, 338, 'hot hydroxide then takes the C–H off, and the carbanion', { cls: 'fg-sm' });
    s += text(566, 354, 'pushes out N₂ — a gas, so it never comes back', { cls: 'fg-sm' });
    s += text(566, 380, 'USE IT WHEN', { cls: 'fg-tag', size: 10 });
    s += text(566, 400, 'the rest of the molecule survives strong base', { cls: 'fg-sm', size: 9.5 });

    s += rule(30, 432, 730, 432);
    s += text(380, 452, 'Whichever conditions your substrate tolerates, one of the two routes is open.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The reduction that goes two rungs instead of one. A hydride reagent takes a ketone to an alcohol and stops; these two take the oxygen off altogether and leave a CH<sub>2</sub> &mdash; and they are learned as a pair because one needs strong acid and the other needs strong base.',
  note: 'The only thing you have to decide in an exam question is which half of the molecule you are protecting: acid-sensitive substrate &rarr; Wolff&ndash;Kishner, base-sensitive substrate &rarr; Clemmensen. The mechanisms are not symmetric even though the outcomes are &mdash; the Clemmensen happens on the zinc surface and is not well described by arrows on paper, while the Wolff&ndash;Kishner is drawable all the way through and is therefore the one asked about: hydrazone, deprotonation, carbanion, loss of N<sub>2</sub>. That last step is the engine. A gas escaping the flask cannot react backwards, so the equilibrium in front of it is dragged forward however unfavorable it looked.',
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


/* ---------------------------------------------------------------- 104 ---
   The two nucleophilicity trends run in opposite directions on the periodic
   table, and one of them changes sign with the solvent. The notes asked the
   reader to hold all of that in their head at once with no picture. Two
   strips of the table, one horizontal and one vertical, is the picture. */
FIGURES.push({
  id: 'nucleophile-trends',
  section: 'nucleophiles',
  anchor: '<h3>Two words worth pinning down: protic, and polarizable</h3>',
  alt: 'A row of the periodic table showing nucleophilicity falling from carbanion to fluoride, and a column showing halide nucleophilicity rising down the group in protic solvent and reversing in aprotic solvent',
  viewBox: '0 0 760 330',
  build() {
    let s = '';

    // ---- Across a row ----
    s += tag(200, 40, 'ACROSS A ROW');
    const row = ['H\u2083C\u207b', 'H\u2082N\u207b', 'HO\u207b', 'F\u207b'];
    for (let i = 0; i < 4; i++) {
      const x = 84 + i * 76;
      s += panel(x, 84, 60, 60, { kind: i === 0 ? 'hi' : i === 3 ? 'warn' : null, r: 8 });
      s += label(x + 30, 120, row[i], { size: 13 });
    }
    s += arrow(P(84, 176), P(348, 176), { muted: true });
    s += text(216, 166, 'electronegativity rises', { cls: 'fg-sm', size: 10 });
    s += text(216, 200, 'nucleophilicity FALLS', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(216, 226, 'a more electronegative atom holds its', { cls: 'fg-sm', size: 10 });
    s += text(216, 242, 'pair tighter and shares it less readily', { cls: 'fg-sm', size: 10 });
    s += text(216, 268, 'this trend does not care about solvent', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(392, 34, 392, 306);

    // ---- Down a column ----
    s += tag(570, 40, 'DOWN A COLUMN');
    const col = ['F\u207b', 'Cl\u207b', 'Br\u207b', 'I\u207b'];
    for (let i = 0; i < 4; i++) {
      const y = 70 + i * 56;
      s += panel(452, y, 56, 46, { kind: i === 3 ? 'hi' : i === 0 ? 'warn' : null, r: 8 });
      s += label(480, y + 29, col[i], { size: 13 });
    }
    s += arrow(P(428, 76), P(428, 288), { muted: true });
    s += text(528, 96, 'IN WATER OR METHANOL', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(528, 114, 'the order rises downward:', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(528, 130, 'I\u207b is big and barely', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(528, 146, 'solvated; F\u207b is caged', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(528, 186, 'IN DMSO OR DMF', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(528, 204, 'no cage to strip, so the', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(528, 220, 'order flips back:', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(528, 240, 'F\u207b > Cl\u207b > Br\u207b > I\u207b', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(528, 268, 'and every anion is', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(528, 284, 'stronger than in water', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += rule(34, 306, 726, 306);
    s += text(380, 324, 'A halide ranking with no solvent named is not an answer to anything.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Two strips of the periodic table. The horizontal trend is a property of the atoms and never changes; the vertical one is a property of the atoms <i>and their solvent</i>, and changes sign when the solvent does.',
  note: 'Exam questions on this topic are usually testing whether you noticed the solvent in the stem. Protic &mdash; water, methanol, ethanol, acetic acid &mdash; means the anions are hydrogen-bonded into a shell, the small ones worst, so iodide wins. Aprotic &mdash; DMSO, DMF, acetone, acetonitrile &mdash; means no shell, so the intrinsic order returns and fluoride wins. If no solvent is given, the question is either incomplete or is asking about the row rather than the column.',
});


/* ---------------------------------------------------------------- 105 ---
   The electrophiles section worked one example, a ketone, with exactly one
   candidate atom in it. Real questions hand you a molecule with four
   carbons and ask which one, so here is that molecule, drawn skeletally
   (this chapter teaches skeletal notation and then stops using it), with
   every carbon argued rather than the answer asserted. */
FIGURES.push({
  id: 'electrophile-scan',
  section: 'electrophiles',
  anchor: '<h3>Ranking electrophiles</h3>',
  alt: 'A skeletal drawing of 4-chlorobutan-2-one with its four carbons numbered, beside a list saying why each one is or is not the electrophilic site',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(210, 40, 'FOUR CARBONS, ONE ANSWER');

    const cl = P(96, 176), c1 = P(154, 142), c2 = P(212, 176), c3 = P(270, 142), o = P(270, 82), c4 = P(328, 176);
    s += bond(cl, c1, { rFrom: 15, rTo: 0 });
    s += bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += bond(c2, c3, { rFrom: 0, rTo: 0 });
    s += bond(c3, o, { rFrom: 0, rTo: 15, order: 2 });
    s += bond(c3, c4, { rFrom: 0, rTo: 0 });
    s += atom(cl.x, cl.y, 'Cl', { size: 11 });
    s += atom(o.x, o.y, 'O', { size: 11 });
    for (const ang of [-40, -140, 180]) s += lonePair(cl.x, cl.y, ang, { dist: 24 });
    for (const ang of [-40, -140]) s += lonePair(o.x, o.y, ang, { dist: 24 });
    for (const pt of [c1, c2, c3, c4]) s += atom(pt.x, pt.y, '', { kind: 'point' });

    s += text(154, 120, '1', { cls: 'fg-tag', size: 12 });
    s += text(212, 202, '2', { cls: 'fg-tag', size: 12 });
    s += text(292, 120, '3', { cls: 'fg-tag', size: 12 });
    s += text(328, 202, '4', { cls: 'fg-tag', size: 12 });
    s += text(210, 240, 'ClCH\u2082\u2013CH\u2082\u2013CO\u2013CH\u2083', { cls: 'fg-lbl', size: 12 });
    s += text(210, 262, '4-chlorobutan-2-one', { cls: 'fg-sm', size: 10 });

    s += rule(376, 34, 376, 288);

    const lines = [
      ['1', 'CH\u2082Cl carbon: \u03b4+ from Cl, and Cl will leave.', 'a real target', true],
      ['2', 'middle CH\u2082: two bonds from either puller,', 'and nothing on it to leave', false],
      ['3', 'carbonyl carbon: two bonds to oxygen, and the', '\u03c0 can break instead of a group leaving', true],
      ['4', 'methyl: nothing withdrawing, nothing to leave', '', false],
    ];
    let y = 72;
    for (const [num, a, b, good] of lines) {
      s += text(404, y, num, { cls: good ? 'fg-tag-good' : 'fg-tag-mut', size: 12, anchor: 'start' });
      s += text(424, y, a, { cls: 'fg-sm', size: 10, anchor: 'start' });
      if (b) s += text(424, y + 16, b, { cls: 'fg-sm', size: 10, anchor: 'start' });
      y += b ? 54 : 44;
    }
    s += text(404, 264, 'Most electrophilic: 3. Also attackable: 1.', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(404, 282, 'Two sites is normal; the question is which wins.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    return s;
  },
  caption: 'The scan the prose describes, run on a molecule with more than one candidate. Each carbon gets an argument, and two of them survive it.',
  note: 'Notice what separates the two survivors. Carbon 1 needs its chloride to leave before anything can happen, so its reactivity is limited by how good that leaving group is. Carbon 3 needs nothing to leave at all &mdash; the C=O pi bond simply breaks onto the oxygen, which is delighted to hold the charge &mdash; so a nucleophile can attack it with no leaving group anywhere in sight. That is why carbonyl chemistry and substitution chemistry feel so different even though both are a nucleophile hitting a &delta;+ carbon.',
});


/* ---------------------------------------------------------------- 106 ---
   Three routes out of an alcohol, named in the prose and drawn nowhere.
   The tosylate in particular was discussed for a paragraph and never
   shown, so a student was asked to believe a charge is spread over three
   oxygens of a group they had not seen. */
FIGURES.push({
  id: 'alcohol-activation',
  section: 'leaving-groups',
  anchor: '<h3>Activating an alcohol</h3>',
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
  note: 'The reagents on the arrows belong to <a class="chapter-ref" href="/ochem/learn.html#m-alcohols-ethers">Alcohols, Ethers &amp; Related Chemistry</a> and are worth recognizing rather than memorizing at this stage. What is worth taking now is the shape of the move: when a substitution refuses to go, the fix is almost never a better nucleophile. It is an activation step that replaces a strong-base leaving group with a weak-base one.',
});


/* ---------------------------------------------------------------- 107 ---
   The chapter's closing habit, run on a molecule that contains both halves
   of a reaction. Drawn skeletally and with every lone pair on the page,
   which is what the first section of this chapter promised the rest of it
   would look like. */
FIGURES.push({
  id: 'rich-poor-scan',
  section: 'electron-rich-poor',
  anchor: '<p><b>The verdict</b>: the nitrogen is the nucleophile, the carbonyl carbon is the electrophile, and the molecule has no leaving group anywhere. Since the two reactive sites are in the same molecule and four atoms apart, the prediction almost makes itself — the nitrogen will attack that carbonyl and close a ring. (Count it: N, C4, C3, C2 make a strained four-membered ring, so in practice chemists use the chain one CH₂ longer, which closes a comfortable five-membered ring; the logic of who attacks whom is identical.) You are not expected to know the product; you are expected to be able to say which two atoms bond.</p>',
  alt: 'A skeletal drawing of 4-aminobutan-2-one with lone pairs drawn on nitrogen and oxygen, the nitrogen marked electron-rich, the carbonyl carbon marked electron-poor, and a dashed arrow showing which bond forms',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(212, 38, 'ONE MOLECULE, BOTH HALVES OF A REACTION');

    const n = P(96, 186), c1 = P(154, 152), c2 = P(212, 186), c3 = P(270, 152), o = P(270, 92), c4 = P(328, 186);
    s += bond(n, c1, { rFrom: 20, rTo: 0 });
    s += bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += bond(c2, c3, { rFrom: 0, rTo: 0 });
    s += bond(c3, o, { rFrom: 0, rTo: 15, order: 2 });
    s += bond(c3, c4, { rFrom: 0, rTo: 0 });
    s += atom(n.x, n.y, 'H\u2082N', { kind: 'hi', r: 20, size: 10 });
    s += atom(o.x, o.y, 'O', { size: 11 });
    s += lonePair(n.x, n.y, 150, { dist: 28 });
    for (const ang of [-40, -140]) s += lonePair(o.x, o.y, ang, { dist: 24 });
    for (const pt of [c1, c2, c3, c4]) s += atom(pt.x, pt.y, '', { kind: 'point' });
    s += atom(c3.x, c3.y, '', { kind: 'warn', r: 15 });

    s += text(96, 226, 'RICH \u2014 lone pair', { cls: 'fg-tag-good', size: 10.5 });
    s += text(96, 242, 'the nucleophile', { cls: 'fg-sm', size: 10 });
    s += text(288, 68, '\u03b4\u2212', { cls: 'fg-sm', size: 11 });
    s += text(300, 226, 'POOR \u2014 \u03b4+', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(300, 242, 'the electrophile', { cls: 'fg-sm', size: 10 });
    s += curve(P(112, 162), P(256, 140), { bow: 46, muted: true });
    s += text(196, 108, 'the bond that forms', { cls: 'fg-sm', size: 10 });
    s += text(212, 268, 'H\u2082N\u2013CH\u2082\u2013CH\u2082\u2013CO\u2013CH\u2083', { cls: 'fg-lbl', size: 12 });

    s += rule(404, 34, 404, 278);
    s += text(430, 78, 'The other three carbons fail', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 94, 'for two different reasons:', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 124, 'the one next to N is \u03b4+, but', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 140, '\u207bNH\u2082 never leaves \u2014 \u03b4+ with', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 156, 'no exit is not a reaction site', { cls: 'fg-tag-warn', size: 10.5, anchor: 'start' });
    s += text(430, 186, 'the middle CH\u2082 and the methyl', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 202, 'are two bonds from anything', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 218, 'polarizing, so induction has', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 234, 'already faded to nothing', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(430, 264, 'No leaving group anywhere.', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The three-step scan on a molecule that answers it twice. Lone pairs are drawn here because the scan is a hunt for them, and a hunt is easier when the quarry is on the page.',
  note: 'The oxygen is electron-rich too, and it is worth saying why it is not the nucleophile of interest. Its lone pairs sit on a small, very electronegative atom and are held tightly, so as a nucleophile it is feeble next to the nitrogen; what it does readily instead is pick up a proton, which is why acid catalysis works on carbonyls at all. Rich and poor are the first cut, not the last word &mdash; among rich atoms, the loosely held pairs are the reactive ones.',
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
   own reference. Offsets are relative to the ring centre; axial is vertical
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

/* ---------------------------------------------------------------- ch5.5 ---
   The mechanism, on a real molecule, with the arrows that carry one
   electron each. The section drew a generic X–X/R–H scheme and nothing else. */
FIGURES.push({
  id: 'radical-mechanism-drawn',
  section: 'radical-halogenation',
  anchor: '<p class="step-body"><b>Termination</b> is any step where two radicals find each other and pair up: X&middot; + X&middot;, R&middot; + X&middot;, or R&middot; + R&middot;. These consume two radicals and make none, which is what ends the chain. They are rare while the reaction runs, because the radical concentration is always tiny — two radicals have to collide, and there are very few of them in the flask at any moment.</p>',
  alt: 'The bromination of 2-methylpropane drawn in full: homolysis of bromine with two fishhook arrows, abstraction of the tertiary hydrogen, attack of the tertiary radical on bromine, and a termination step',
  viewBox: '0 0 760 620',
  build() {
    let s = '';
    /* tert-butyl group: central carbon, three methyl vertices, and either an
       H or an unpaired electron on the fourth position. */
    const tBu = (cx, cy, tip) => {
      const q = P(cx, cy);
      const m = [P(cx, cy - 40), P(cx - 36, cy + 22), P(cx + 36, cy + 22)];
      let g = '';
      for (const p of m) { g += bond(q, p, { rFrom: 0, rTo: 0 }); g += atom(p.x, p.y, '', { kind: 'point' }); }
      g += atom(q.x, q.y, '', { kind: 'point' });
      if (tip) { g += bond(q, tip.at, { rFrom: 0, rTo: tip.r ?? 14 }); }
      return g;
    };
    const HPOS = (cx, cy) => P(cx + 42, cy - 22);

    // ---- INITIATION ----
    s += tag(70, 34, 'INITIATION', { anchor: 'start' });
    s += text(70, 52, 'radicals 0 → 2', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    const b1 = P(150, 92), b2 = P(226, 92);
    s += bond(b1, b2);
    s += atom(b1.x, b1.y, 'Br', { kind: 'warn' });
    s += atom(b2.x, b2.y, 'Br', { kind: 'warn' });
    for (const a of [150, 210, 270]) s += lonePair(b1.x, b1.y, a, { dist: 24 });
    for (const a of [30, -30, -90]) s += lonePair(b2.x, b2.y, a, { dist: 24 });
    s += fishhook(P(184, 86), P(160, 66), { bow: 12 });
    s += fishhook(P(192, 86), P(216, 66), { bow: -12 });
    s += arrow(P(266, 92), P(340, 92), { muted: true });
    s += text(303, 76, 'hv', { cls: 'fg-sm', size: 10 });
    s += atom(376, 92, 'Br', { kind: 'warn' }); s += dot(396, 78);
    s += text(414, 97, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(450, 92, 'Br', { kind: 'warn' }); s += dot(470, 78);
    s += text(650, 86, 'two fishhooks, one per electron:', { cls: 'fg-sm', size: 10 });
    s += text(650, 102, 'the bond splits down the middle', { cls: 'fg-sm', size: 10 });
    s += rule(40, 140, 720, 140);

    // ---- PROPAGATION 1 ----
    s += tag(70, 176, 'PROPAGATION 1', { anchor: 'start' });
    s += text(70, 194, 'radicals 1 → 1', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    const c1 = P(190, 248);
    const h1 = HPOS(c1.x, c1.y);
    s += tBu(c1.x, c1.y, { at: h1, r: 13 });
    s += atom(h1.x, h1.y, 'H', { r: 13, size: 11 });
    s += atom(296, 200, 'Br', { kind: 'warn' }); s += dot(316, 186);
    for (const a of [150, 210, 270]) s += lonePair(296, 200, a, { dist: 24 });
    // C–H homolysis: one electron to the carbon, one to the bromine
    s += fishhook(P(212, 236), P(196, 222), { bow: 10 });
    s += fishhook(P(224, 228), P(276, 206), { bow: -18 });
    s += arrow(P(346, 238), P(416, 238), { muted: true });
    const c2 = P(478, 248);
    s += tBu(c2.x, c2.y, null);
    s += dot(c2.x + 20, c2.y - 12);
    s += text(c2.x + 50, c2.y - 6, '3° radical', { cls: 'fg-tag', size: 10, anchor: 'start' });
    s += text(578, 262, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(622, 258, 'H'); s += atom(664, 258, 'Br', { kind: 'warn' });
    s += bond(P(622, 258), P(664, 258));
    s += text(628, 198, 'the tertiary C–H is taken because it', { cls: 'fg-sm', size: 9.5 });
    s += text(628, 214, 'leaves the most stable radical', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 316, 720, 316);

    // ---- PROPAGATION 2 ----
    s += tag(70, 352, 'PROPAGATION 2', { anchor: 'start' });
    s += text(70, 370, 'radicals 1 → 1', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    const c3 = P(190, 424);
    s += tBu(c3.x, c3.y, null);
    s += dot(c3.x + 20, c3.y - 12);
    const d1 = P(288, 388), d2 = P(354, 388);
    s += bond(d1, d2);
    s += atom(d1.x, d1.y, 'Br', { kind: 'warn' });
    s += atom(d2.x, d2.y, 'Br', { kind: 'warn' });
    for (const a of [-90, 210] ) s += lonePair(d1.x, d1.y, a, { dist: 24 });
    for (const a of [30, -30, -90]) s += lonePair(d2.x, d2.y, a, { dist: 24 });
    s += fishhook(P(216, 414), P(270, 392), { bow: -18 });
    s += fishhook(P(316, 382), P(300, 366), { bow: 12 });
    s += fishhook(P(326, 382), P(344, 366), { bow: -12 });
    s += arrow(P(392, 414), P(456, 414), { muted: true });
    const c4 = P(518, 424);
    const br4 = P(c4.x + 46, c4.y - 26);
    s += tBu(c4.x, c4.y, { at: br4, r: 16 });
    s += atom(br4.x, br4.y, 'Br', { kind: 'warn' });
    s += text(632, 436, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(672, 432, 'Br', { kind: 'warn' }); s += dot(692, 418);
    s += text(744, 350, '2-bromo-2-methylpropane,', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += text(744, 366, 'and a fresh Br• to run it again', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
    s += rule(40, 494, 720, 494);

    // ---- TERMINATION ----
    s += tag(70, 530, 'TERMINATION', { anchor: 'start' });
    s += text(70, 548, 'radicals 2 → 0', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    const c5 = P(200, 566);
    s += tBu(c5.x, c5.y - 4, null);
    s += dot(c5.x + 20, c5.y - 16);
    s += atom(300, 560, 'Br', { kind: 'warn' }); s += dot(282, 546);
    s += fishhook(P(226, 550), P(258, 542), { bow: -14 });
    s += fishhook(P(282, 556), P(250, 562), { bow: -14 });
    s += arrow(P(342, 556), P(406, 556), { muted: true });
    const c6 = P(468, 566);
    const br6 = P(c6.x + 46, c6.y - 26);
    s += tBu(c6.x, c6.y - 4, { at: br6, r: 16 });
    s += atom(br6.x, br6.y, 'Br', { kind: 'warn' });
    s += text(650, 550, 'same product, but the chain', { cls: 'fg-sm', size: 9.5 });
    s += text(650, 566, 'stops here — count the radicals', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Bromination of 2-methylpropane, drawn out. Every arrow here has <b>one barb</b>, because every arrow moves one electron, and two of them are needed wherever a bond breaks or forms. Nothing carries a charge at any point — if a step you have drawn produces a cation or an anion, it was not a radical step.',
  note: 'The last two rows make the same molecule and are not the same stage. Propagation 2 hands back a bromine radical, so the chain carries on; the termination step below it consumes both radicals and stops. That is why the stage is read off the radical count and never off the product.',
});

/* ---------------------------------------------------------------- ch5.6 ---
   Why the sluggish reagent is the selective one. The argument is about
   where along the coordinate the barrier sits, which is a picture. */
FIGURES.push({
  id: 'early-late-transition-state',
  section: 'radical-halogenation',
  anchor: '<p class="step-body">Put the two together. Chlorine’s abstraction is exothermic, so its transition state is early and reactant-like: the C–H has barely stretched, the radical has barely formed, and a difference in radical stability of a couple of kcal/mol has almost nothing to act on. Bromine’s abstraction is endothermic, so its transition state is late and product-like: the radical is essentially fully formed by the time the barrier is reached, and every bit of its stability is already showing up in the barrier height. The gap between a 3° and a 1° radical is the same 5 kcal/mol either way — 101 for a primary C–H against 96 for a tertiary — and bromine collects nearly all of it while chlorine collects almost none.</p>',
  alt: 'Two reaction-energy diagrams for hydrogen abstraction, one downhill with an early transition state for chlorine and one uphill with a late transition state for bromine',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    const panel1 = (ox, title, y0, y1, peakX, peakY, cls, tsLabel, dh) => {
      let g = '';
      const x0 = ox + 30, x1 = ox + 280;
      g += rule(x0, 250, x1, 250);
      g += rule(x0, 250, x0, 74);
      g += text(ox + 155, 44, title, { cls, size: 11.5 });
      const px = x0 + (x1 - x0) * peakX;
      g += `<path class="fg-bond-hi" d="M${x0} ${y0} C${x0 + (px - x0) * 0.55} ${y0} ${px - 26} ${peakY} ${px} ${peakY} C${px + 26} ${peakY} ${x1 - (x1 - px) * 0.55} ${y1} ${x1} ${y1}"></path>`;
      g += `<line class="fg-dash" x1="${px}" y1="${peakY}" x2="${px}" y2="250"></line>`;
      g += text(px, 268, tsLabel, { cls: 'fg-tag', size: 10 });
      g += text(x0 + 4, y0 - 12, 'R–H + X•', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      g += text(x1 - 4, y1 + (y1 > y0 ? 18 : -12), 'R• + H–X', { cls: 'fg-sm', size: 9.5, anchor: 'end' });
      g += text(ox + 155, 296, dh, { cls: 'fg-lbl', size: 11 });
      g += text(ox + 155, 316, 'reaction coordinate →', { cls: 'fg-sm', size: 9 });
      return g;
    };
    s += panel1(40, 'CHLORINE — DOWNHILL, EARLY TS', 170, 212, 0.30, 118, 'fg-tag-warn', 'peak sits early', 'ΔH ≈ −5 · selectivity 3°:1° ≈ 5 : 1');
    s += rule(390, 60, 390, 300);
    s += panel1(420, 'BROMINE — UPHILL, LATE TS', 212, 158, 0.72, 92, 'fg-tag-good', 'peak sits late', 'ΔH ≈ +11 · selectivity 3°:1° ≈ 1600 : 1');
    s += text(380, 336, 'Hammond: a transition state resembles whichever side it is closer to in energy.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The selectivity argument is a claim about <i>where</i> the barrier sits, so it is easier to see than to say. Chlorine\'s abstraction runs downhill, so the peak comes early and the structure at the top still looks like the alkane — the radical has barely begun to form, so how stable it would be barely matters.',
  note: 'Bromine\'s runs uphill, so the peak comes late and the structure at the top already looks like the radical. Every kcal/mol of radical stability is therefore already priced into the barrier, which is why a 5 kcal/mol gap between a tertiary and a primary radical becomes a factor of over a thousand in rate for bromine and a factor of five for chlorine.',
});

/* ---------------------------------------------------------------- ch5.7 ---
   For chapter 2: the worked example that runs R–OH + HBr in prose, drawn. */
FIGURES.push({
  id: 'alcohol-to-bromide-steps',
  section: 'leaving-groups',
  anchor: '<p><b>Step 3 — bromide attacks.</b> The bromide already in solution bonds to the carbon as water departs, giving 1-bromobutane.</p>',
  alt: '1-butanol converted to 1-bromobutane by HBr in three drawn steps: an oxygen lone pair takes the proton from HBr, bromide attacks the carbon from the far side, and water leaves, giving 1-bromobutane',
  viewBox: '0 0 760 480',
  build() {
    let s = '';
    /* 1-butanol and its relatives, drawn skeletally with the heteroatom on
       the left, so the carbon under attack is the first chain vertex. */
    const chain = (hx, hy, hLabel, charge) => {
      const big = hLabel.length > 2;
      const r = big ? 19 : 15;
      const o = P(hx, hy), c1 = P(hx + 40, hy + 22), c2 = P(hx + 80, hy),
            c3 = P(hx + 120, hy + 22), c4 = P(hx + 160, hy);
      let g = bond(o, c1, { rFrom: r, rTo: 0 });
      g += bond(c1, c2, { rFrom: 0, rTo: 0 });
      g += bond(c2, c3, { rFrom: 0, rTo: 0 });
      g += bond(c3, c4, { rFrom: 0, rTo: 0 });
      for (const q of [c1, c2, c3, c4]) g += atom(q.x, q.y, '', { kind: 'point' });
      g += atom(o.x, o.y, hLabel, { r, size: big ? 10 : 12, kind: hLabel === 'Br' ? 'warn' : 'plain' });
      if (charge) g += text(o.x + r + 5, o.y - r + 4, charge, { cls: 'fg-tag-warn', size: 13 });
      return { g, o, c1, r };
    };

    // ---------- STEP 1: protonate ----------
    s += tag(40, 40, 'STEP 1 \u2014 PROTONATE THE OXYGEN', { anchor: 'start' });
    const brA = P(56, 150), hA = P(112, 150);
    s += bond(brA, hA);
    s += atom(brA.x, brA.y, 'Br', { kind: 'warn' });
    s += atom(hA.x, hA.y, 'H');
    for (const ang of [90, 180, 270]) s += lonePair(brA.x, brA.y, ang, { dist: 24 });
    const A = chain(168, 128, 'HO', null);
    s += A.g;
    for (const ang of [135, 225]) s += lonePair(A.o.x, A.o.y, ang, { dist: 24 });
    s += curve(P(146, 140), P(126, 146), { bow: 16 });      // lone pair \u2192 H
    s += curve(P(92, 142), P(70, 134), { bow: 14 });        // H\u2013Br bond \u2192 Br
    s += arrow(P(376, 142), P(438, 142), { muted: true });
    const B = chain(478, 128, 'H\u2082O', '+');
    s += B.g;
    s += text(716, 146, '+  Br\u207b', { cls: 'fg-lbl', size: 12, anchor: 'end' });
    s += text(380, 206, 'One lone pair takes the proton and the H\u2013Br pair goes to bromide \u2014 two arrows, one step.', { cls: 'fg-sm', size: 10 });
    s += text(380, 226, 'What has to leave is now neutral water, not hydroxide.', { cls: 'fg-tag-good', size: 10.5 });
    s += rule(40, 252, 720, 252);

    // ---------- STEPS 2 AND 3: displacement ----------
    s += tag(40, 288, 'STEPS 2 AND 3 \u2014 WATER LEAVES AS BROMIDE ARRIVES', { anchor: 'start' });
    const C = chain(150, 344, 'H\u2082O', '+');
    s += C.g;
    const nu = P(C.c1.x + 26, C.c1.y + 58);
    s += atom(nu.x, nu.y, 'Br', { kind: 'warn' });
    s += text(nu.x + 20, nu.y - 11, '\u2212', { cls: 'fg-tag-warn', size: 14 });
    for (const ang of [90, 150, 30]) s += lonePair(nu.x, nu.y, ang, { dist: 24 });
    s += curve(P(nu.x - 4, nu.y - 18), P(C.c1.x + 4, C.c1.y + 12), { bow: 14 });
    s += curve(P(C.c1.x - 16, C.c1.y - 10), P(C.o.x + 10, C.o.y + 18), { bow: -14 });
    s += arrow(P(376, 358), P(438, 358), { muted: true });
    const D = chain(478, 344, 'Br', null);
    s += D.g;
    s += text(560, 416, '1-bromobutane  +  H\u2082O', { cls: 'fg-tag-good', size: 11 });
    s += text(380, 452, 'Bromide arrives on the far side of the carbon at the same moment the C\u2013O bond breaks:', { cls: 'fg-sm', size: 10 });
    s += text(380, 470, 'one concerted step, because a primary carbon has no cation worth forming.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The same flask twice over. With NaBr there is no step 1, so the only way forward would be to push HO<sup>−</sup> off a carbon, and that step does not happen. HBr supplies a proton first, and once the oxygen is protonated the group that has to leave is <b>neutral water</b> rather than hydroxide — seventeen pK<sub>a</sub> units of difference, from one proton.',
  note: 'Steps 2 and 3 are drawn together on purpose. On a primary carbon like this one there is no carbocation worth forming, so water does not depart and wait — the bromide arrives on the far side of the carbon at the same moment the C–O bond breaks. Draw it as two separate events and you have quietly invented a primary carbocation, which is the commonest way this mechanism is written wrongly.',
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

/* A tetrahedral centre drawn the way this chapter draws them: bonds at the
   given screen angles (0 is east, measured counterclockwise), with `kind`
   choosing plain, wedge or hash. Returns the bond ink; the caller places the
   labels, because a label's radius depends on how long its text is. */
function centre(c, arms) {
  let s = '';
  for (const a of arms) {
    const rad = (-a.deg * Math.PI) / 180;
    const end = P(c.x + Math.cos(rad) * a.len, c.y + Math.sin(rad) * a.len);
    const opts = { rFrom: a.rFrom ?? 15, rTo: a.rTo ?? 0 };
    s += a.kind === 'wedge' ? wedge(c, end, { ...opts, width: 9 })
       : a.kind === 'hash' ? hash(c, end, { ...opts, width: 11, rungs: 4 })
       : bond(c, end, opts);
  }
  return s;
}
const armEnd = (c, deg, len) => P(c.x + Math.cos((-deg * Math.PI) / 180) * len,
                                  c.y + Math.sin((-deg * Math.PI) / 180) * len);

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
      g += centre(c, [
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
  note: 'This is why “stereocenter” and “chiral” must not be treated as the same word. The stereocenter is the usual <i>cause</i> of chirality; chirality itself is a statement about the shape of the whole molecule, and a twist does the job just as well as a tetrahedral carbon. The modern workhorses of this type are BINOL and BINAP, two of the most used ligands in asymmetric catalysis. They are built on naphthalenes rather than benzenes, and there no added blocking groups are needed at all: each naphthalene has a hydrogen in the <i>peri</i> position tucked in beside the joint, and those hydrogens alone hold the twist. The OH or PPh<sub>2</sub> groups are what the metal binds, not what does the locking.',
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

    s += text(380, 32, 'barrier ≈ 6 kcal/mol → about 10¹¹ inversions per second at room temperature', { cls: 'fg-tag', size: 11 });
    s += text(380, 296, 'Roughly a hundred flips per nanosecond: there is no temperature at which you could bottle one of the two pyramids.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Why an amine nitrogen with three different groups is not a usable stereocenter. It really is pyramidal, and the two pyramids really are mirror images — but the barrier between them is about 6 kcal/mol, so the molecule turns itself inside out like an umbrella in a gale, roughly 10<sup>11</sup> times a second. What you have is not two separable substances; it is one substance spending half its time in each shape.',
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
       is where the lower centre's bromine points, and it is the only thing
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
  note: 'The left projection is <i>meso</i>-tartaric acid: reflect it through the dashed line and OH lands on OH, H on H, COOH on COOH. The right one is (2R,3R): the same reflection sends OH onto H, so it is not a symmetry of the molecule, and no other one exists. Fischer projections are covered properly in the last section of this chapter; this is the one use of them worth borrowing early.',
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
    const centreDraw = (cx, cy, g2, g3, hKind) => {
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
    s += centreDraw(194, 132, 'CH₂CH₃', 'CH₃', 'hash');
    s += text(194, 232, 'butan-2-ol · H on a HASH, pointing away', { cls: 'fg-sm', size: 10 });
    s += text(194, 278, '1→2→3 counterclockwise, no flip', { cls: 'fg-sm', size: 10 });
    s += text(194, 302, 'S', { cls: 'fg-tag-good', size: 18 });

    s += panel(396, 40, 340, 214, { kind: 'warn' });
    s += centreDraw(566, 132, 'CHO', 'CH₂OH', 'wedge');
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
  viewBox: '0 0 760 392',
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
  note: 'Now count what would have happened without the shift. Eliminating straight from the original secondary cation gives a disubstituted alkene on the original skeleton; after the shift the best available alkene is tetrasubstituted and sits between two different carbons. Same starting material, different answer — which is why "check for a rearrangement" comes before "apply Zaitsev".',
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

/* A skeletal double bond between two unlabeled vertices: one full line plus
   one inset line on the side `inward` points to, so nothing overhangs the
   neighboring bond the way a plain order-2 bond does at a shared vertex. */
const skDouble = (a, b, inward) => ringDouble(a, b, inward, { inset: 7, gap: 4.6 });
const plus = (x, y) => text(x, y, '+', { cls: 'fg-warn', size: 15 });
const lobeE = (cx, cy, rx, ry, cls = 'fg-orb') =>
  `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill-opacity="0.18"></ellipse>`;

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
  section: 'alkene-structure',
  anchor: 'rank them and trust the ranking.</div>',
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
    // ---- left: the four-centre TS
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
      'trans (E) alkene', 'the radical picks its shape first');
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
  note: 'The ring on the right is what the other orientation would give, and it is worth looking at once so you can rule it out on sight: making it would mean bonding δ− to the carbon that is already electron-rich. Note also what the rule does <b>not</b> produce — there is no arrangement of these two partners that separates the substituents by two carbons and then a gap on both sides, so "meta" is always a distractor and never an answer.',
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
   Alcohol dehydration, with its arrows. The section's centrepiece was
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
    s += text(104, 226, 'the neighbor has no H to give,', { cls: 'fg-sm', size: 9.5 });
    s += text(104, 242, 'so a whole METHYL migrates instead', { cls: 'fg-tag-warn', size: 10.5 });

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


/* ------------------------------------------------------------- 11.1 ---
   The acid-catalyzed order, drawn. The notes name three species and the
   section's two other figures are both the basic pathway, so the mechanism
   that every later chapter reuses had no picture at all. */
FIGURES.push({
  id: 'acid-catalyzed-addition',
  section: 'nucleophilic-addition',
  anchor: 'Count the protons across the whole sequence and the catalyst comes back out, which is what makes it catalytic.</p>',
  alt: 'Four panels showing acid-catalyzed addition to a ketone. First a lone pair on the carbonyl oxygen takes a proton. Second, the resulting cation is drawn as two resonance contributors, the protonated carbonyl and the oxocarbenium ion with the positive charge on carbon. Third, a neutral alcohol attacks that carbon with a lone pair, giving a positively charged oxygen on the added group. Fourth, a base removes that proton, giving the neutral addition product and handing the catalyst back.',
  viewBox: '0 0 760 528',
  build() {
    let s = '';
    const cell = (x, y, t) => panel(x, y, 360, 208) + tag(x + 180, y + 28, t);

    /* One carbonyl unit: the carbon, its two R groups, and the oxygen above
       it. `order` is 2 for a C=O and 1 once the pi bond has been used up. */
    const unit = (c, order, oLabel, degs) => {
      const o = armEnd(c, 90, 56);
      const d = degs || [214, 326];
      const r1 = armEnd(c, d[0], 46), r2 = armEnd(c, d[1], 46);
      let g = bond(c, o, { order, rTo: 15 });
      g += bond(c, r1, { rTo: 13 }) + atom(r1.x, r1.y, 'R', { r: 13 });
      g += bond(c, r2, { rTo: 13 }) + atom(r2.x, r2.y, 'R', { r: 13 });
      g += atom(o.x, o.y, oLabel || 'O');
      g += atom(c.x, c.y, 'C', { kind: 'warn' });
      return { g, o, r1, r2 };
    };

    // ---- 1. protonate the oxygen ----
    s += cell(8, 16, 'STEP 1 · ACID PROTONATES THE OXYGEN');
    const c1 = P(118, 146);
    const u1 = unit(c1, 2);
    s += u1.g;
    s += lonePair(u1.o.x, u1.o.y, 232, { dist: 23 }) + lonePair(u1.o.x, u1.o.y, 308, { dist: 23 });
    const hp = P(262, 96);
    s += atom(hp.x, hp.y, 'H', { r: 13, kind: 'hi' });
    s += text(hp.x + 22, hp.y - 12, '+', { cls: 'fg-warn', size: 15 });
    s += curve(P(u1.o.x + 18, u1.o.y - 12), P(hp.x - 14, hp.y - 4), { bow: -20 });
    s += text(188, 210, 'the basic site is the oxygen, not the carbon', { cls: 'fg-sm', size: 9.5 });

    // ---- 2. the activated cation, two contributors ----
    s += cell(392, 16, 'STEP 2 · ONE CATION, TWO CONTRIBUTORS');
    const c2 = P(482, 146);
    const u2 = unit(c2, 2, 'O');
    s += u2.g;
    s += text(u2.o.x + 24, u2.o.y - 12, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += text(u2.o.x - 22, u2.o.y - 14, '+', { cls: 'fg-warn', size: 15 });
    s += curve(P(c2.x + 14, c2.y - 34), P(u2.o.x + 14, u2.o.y + 16), { bow: -18 });
    s += text(578, 146, '↔', { cls: 'fg-lbl', size: 20 });
    const c3 = P(660, 146);
    const u3 = unit(c3, 1, 'O');
    s += u3.g;
    s += text(u3.o.x + 24, u3.o.y - 12, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += lonePair(u3.o.x, u3.o.y, 232, { dist: 23 });
    s += text(c3.x - 26, c3.y - 14, '+', { cls: 'fg-warn', size: 15 });
    s += text(482, 210, 'protonated carbonyl', { cls: 'fg-sm', size: 9.5 });
    s += text(660, 210, 'oxocarbenium — this is', { cls: 'fg-tag-warn', size: 10 });
    s += text(660, 224, 'what gets attacked', { cls: 'fg-tag-warn', size: 10 });

    // ---- 3. the neutral nucleophile adds ----
    s += cell(8, 248, 'STEP 3 · A NEUTRAL ALCOHOL ADDS');
    const c4 = P(118, 380);
    const u4 = unit(c4, 1, 'O', [200, 268]);
    s += u4.g;
    s += text(u4.o.x + 24, u4.o.y - 12, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += text(c4.x - 26, c4.y - 14, '+', { cls: 'fg-warn', size: 15 });
    const nu = P(268, 404);
    s += atom(nu.x, nu.y, 'O', { kind: 'hi' });
    s += text(nu.x + 22, nu.y - 14, 'H', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(nu.x + 22, nu.y + 22, 'R', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += lonePair(nu.x, nu.y, 186, { dist: 23 });
    s += curve(P(nu.x - 24, nu.y - 6), P(c4.x + 18, c4.y + 6), { bow: 20 });
    s += text(188, 444, 'no alkoxide anywhere — in acid the', { cls: 'fg-sm', size: 9.5 });
    s += text(188, 458, 'nucleophile arrives neutral', { cls: 'fg-sm', size: 9.5 });

    // ---- 4. lose the proton ----
    s += cell(392, 248, 'STEP 4 · LOSE THE EXTRA PROTON');
    const c5 = P(502, 380);
    const u5 = unit(c5, 1, 'O', [200, 268]);
    s += u5.g;
    s += text(u5.o.x + 24, u5.o.y - 12, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    const op = armEnd(c5, 20, 62);
    s += bond(c5, op, { rTo: 15 });
    s += atom(op.x, op.y, 'O', { kind: 'hi' });
    s += text(op.x + 22, op.y - 6, '+', { cls: 'fg-warn', size: 15 });
    s += text(op.x + 4, op.y + 30, 'R', { cls: 'fg-sm', size: 10, anchor: 'middle' });
    const hx = armEnd(op, 60, 42);
    s += bond(op, hx, { rTo: 12 }) + atom(hx.x, hx.y, 'H', { r: 12, kind: 'warn' });
    const base = P(hx.x - 54, hx.y - 30);
    s += text(base.x, base.y, 'ROH', { cls: 'fg-sm', size: 10 });
    s += curve(P(base.x + 20, base.y + 8), P(hx.x - 6, hx.y - 12), { bow: -14 });
    s += text(572, 444, 'a second alcohol takes it, and the acid', { cls: 'fg-sm', size: 9.5 });
    s += text(572, 458, 'is handed back — it was a catalyst', { cls: 'fg-sm', size: 9.5 });

    s += rule(30, 474, 730, 474);
    s += text(380, 496, 'BASE activates the nucleophile, and protonates at the end.', { cls: 'fg-lbl', size: 11 });
    s += text(380, 512, 'ACID activates the electrophile, and deprotonates at the end.', { cls: 'fg-lbl', size: 11 });
    return s;
  },
  caption: 'The order reversed, with arrows. Under base a charged nucleophile hits a neutral carbonyl and the alkoxide is protonated afterwards; under acid the proton goes on <i>first</i>, and what a weak neutral nucleophile then attacks is the oxocarbenium contributor, where the positive charge is on carbon and the octet is complete on oxygen.',
  note: 'Learn the shape rather than the four pictures: <b>protonate, add, deprotonate</b>. Acetal formation is this run twice, imine formation is this plus a dehydration, and ester hydrolysis is this with a leaving group on the carbon. The proton count is the tell that something has gone wrong in a mechanism — if the catalyst does not come back out, a step is missing.',
});


/* ------------------------------------------------------------- 11.2 ---
   Hydride and Grignard, drawn on the SAME aldehyde. Four paragraphs of
   reagent prose and the chapter's most important C–C bond had no drawn
   example anywhere; putting both on propanal also makes the counting
   argument visible instead of asserted. */
FIGURES.push({
  id: 'hydride-vs-grignard',
  section: 'nucleophilic-addition',
  anchor: 'Derived this way the rule survives a substrate you have never seen.</p>',
  alt: 'Two rows, both starting from propanal. In the top row a hydride from sodium borohydride attacks the carbonyl carbon while the pi bond moves onto oxygen; the alkoxide is protonated on workup to give propan-1-ol, a primary alcohol. In the bottom row a methyl group from methylmagnesium bromide attacks the same carbon, making a new carbon-carbon bond, and workup gives butan-2-ol, a secondary alcohol.',
  viewBox: '0 0 760 500',
  build() {
    let s = '';

    /* Propanal drawn skeletally, with the carbonyl carbon labeled because
       every arrow in the figure starts or ends on it. `top` is what sits on
       the oxygen: a double bond before attack, a single bond after. */
    const propanal = (X, Y, opts = {}) => {
      const c = P(X + 84, Y), o = P(X + 84, Y - 52);
      const v1 = P(X + 42, Y + 26), me = P(X, Y);
      let g = bond(me, v1, { rFrom: 17, rTo: 0 }) + bond(v1, c, { rFrom: 0, rTo: 15 });
      g += atom(v1.x, v1.y, '', { kind: 'point' });
      g += atom(me.x, me.y, 'CH₃', { r: 17, size: 10 });
      g += bond(c, o, { order: opts.single ? 1 : 2, rTo: 15 });
      const h = P(X + 126, Y + 26);
      g += bond(c, h, { rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12 });
      g += atom(o.x, o.y, 'O', { kind: opts.oKind || 'plain' });
      g += atom(c.x, c.y, 'C', { kind: 'warn' });
      return { g, c, o, h };
    };

    const row = (Y, cfg) => {
      let g = '';
      g += tag(18, Y - 86, cfg.title, { anchor: 'start' });

      // --- frame 1: the attack, with both arrows ---
      const A = propanal(28, Y);
      g += A.g;
      const nu = P(A.c.x - 4, A.c.y + 74);
      g += atom(nu.x, nu.y, cfg.nu, { kind: 'hi', r: cfg.nu.length > 1 ? 18 : 15 });
      g += text(nu.x + (cfg.nu.length > 1 ? 24 : 20), nu.y - 12, '−', { cls: 'fg-hi', size: 15 });
      g += curve(P(nu.x - 6, nu.y - (cfg.nu.length > 1 ? 20 : 17)), P(A.c.x - 8, A.c.y + 17), { bow: 14 });
      g += curve(P(A.c.x + 16, A.c.y - 20), P(A.o.x + 16, A.o.y + 16), { bow: -26 });
      g += text(112, Y + 106, cfg.reagent, { cls: 'fg-sm', size: 9.5 });

      g += arrow(P(228, Y - 6), P(276, Y - 6), { muted: true });

      // --- frame 2: the alkoxide ---
      const B = propanal(302, Y, { single: true, oKind: 'hi' });
      g += B.g;
      g += text(B.o.x + 22, B.o.y - 10, '−', { cls: 'fg-hi', size: 15 });
      const nb = P(B.c.x - 4, B.c.y + 52);
      g += bond(B.c, nb, { rTo: cfg.nu.length > 1 ? 17 : 13 });
      g += atom(nb.x, nb.y, cfg.nu, { r: cfg.nu.length > 1 ? 17 : 13, size: cfg.nu.length > 1 ? 10 : 11, kind: 'hi' });
      g += text(386, Y + 106, 'tetrahedral alkoxide', { cls: 'fg-sm', size: 9.5 });

      g += arrow(P(502, Y - 6), P(550, Y - 6), { muted: true });
      g += text(526, Y - 22, 'H₃O⁺', { cls: 'fg-sm', size: 9.5 });

      // --- frame 3: the alcohol ---
      const C = propanal(576, Y, { single: true });
      g += C.g;
      const oh = P(C.o.x + 26, C.o.y - 4);
      g += text(oh.x, oh.y, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
      const nc = P(C.c.x - 4, C.c.y + 52);
      g += bond(C.c, nc, { rTo: cfg.nu.length > 1 ? 17 : 13 });
      g += atom(nc.x, nc.y, cfg.nu, { r: cfg.nu.length > 1 ? 17 : 13, size: cfg.nu.length > 1 ? 10 : 11 });
      g += text(648, Y + 106, cfg.product, { cls: 'fg-tag-good', size: 10.5 });
      g += text(648, Y + 122, cfg.count, { cls: 'fg-sm', size: 9.5 });
      return g;
    };

    s += row(120, {
      title: 'HYDRIDE — THE NUCLEOPHILE THAT BRINGS NO CARBON',
      nu: 'H', reagent: '1. NaBH₄ (or LiAlH₄)  2. H₃O⁺',
      product: 'propan-1-ol · 1° alcohol',
      count: 'carbinol carbon: ONE carbon',
    });
    s += rule(30, 268, 730, 268);
    s += row(360, {
      title: 'GRIGNARD — THE NUCLEOPHILE THAT BRINGS ONE',
      nu: 'CH₃', reagent: '1. CH₃MgBr, dry ether  2. H₃O⁺',
      product: 'butan-2-ol · 2° alcohol',
      count: 'carbinol carbon: TWO carbons',
    });
    return s;
  },
  caption: 'One aldehyde, two nucleophiles, and the only difference in the mechanism is what the nucleophile carries in with it. Both rows are the same two arrows — nucleophile to carbon, pi bond up onto oxygen — and both stop at an alkoxide that needs the workup step to become an alcohol.',
  note: 'Read the last column rather than memorizing the rule. Propanal’s carbonyl carbon starts with one carbon substituent; hydride adds none, so the product carbon still has one and the alcohol is primary; the Grignard adds one, so the product carbon has two and the alcohol is secondary. Do that arithmetic on any carbonyl and the 1°/2°/3° rule falls out, including for substrates the rule was never stated for.',
});


/* ------------------------------------------------------------- 11.3 ---
   Acetal formation, every elementary step, with the electron arrows. The
   section's only figure shows the four SPECIES joined by equilibrium heads
   and contains no curved arrows at all — and this is the mechanism students
   are most often asked to produce in full. */
FIGURES.push({
  id: 'acetal-seven-steps',
  section: 'acetals',
  anchor: '<h3>Step one: hemiacetal formation</h3>',
  alt: 'Seven panels drawing the acid-catalyzed formation of an acetal from a ketone. Protonation of the carbonyl oxygen; attack by the first alcohol on the carbonyl carbon; loss of a proton to give the hemiacetal; protonation of the hemiacetal hydroxyl; loss of water to give the oxocarbenium ion; attack by the second alcohol; and loss of the final proton to give the acetal. Every step carries curved arrows, and every arrow is reversible.',
  viewBox: '0 0 760 742',
  build() {
    let s = '';
    const W = 236, H = 208;
    const frame = (x, y, n, t) => panel(x, y, W, H) + tag(x + 118, y + 26, n + ' · ' + t);

    /* The shared core: the carbon, its two R groups, an oxygen above it and
       optionally one to its right. Everything in this mechanism happens on
       those two oxygens, so keeping them in the same two places across all
       seven frames is most of what makes the sequence readable. */
    const core = (c, o) => {
      const r1 = armEnd(c, 216, 42), r2 = armEnd(c, 324, 42);
      let g = bond(c, r1, { rTo: 13 }) + atom(r1.x, r1.y, 'R', { r: 13 });
      g += bond(c, r2, { rTo: 13 }) + atom(r2.x, r2.y, 'R', { r: 13 });
      const top = armEnd(c, 90, 54);
      let right = null;
      if (o.top) {
        g += bond(c, top, { order: o.topOrder || 1, rTo: 15 });
      }
      if (o.right) {
        right = armEnd(c, 16, 62);
        g += bond(c, right, { order: o.rightOrder || 1, rTo: 15 });
      }
      if (o.top) g += atom(top.x, top.y, 'O', { kind: o.topKind || 'plain' });
      if (o.right) g += atom(right.x, right.y, 'O', { kind: o.rightKind || 'plain' });
      g += atom(c.x, c.y, 'C', { kind: 'warn' });
      return { g, top, right };
    };
    const plusAt = (x, y) => text(x, y, '+', { cls: 'fg-warn', size: 15 });
    const sub = (x, y, t, cls) => text(x, y, t, { cls: cls || 'fg-sm', size: 9.5 });

    // ---- 1 protonate the carbonyl ----
    s += frame(8, 16, '1', 'PROTONATE THE C=O');
    let c = P(96, 132);
    let k = core(c, { top: 1, topOrder: 2 });
    s += k.g;
    s += lonePair(k.top.x, k.top.y, 232, { dist: 23 }) + lonePair(k.top.x, k.top.y, 308, { dist: 23 });
    let h = P(186, 74);
    s += atom(h.x, h.y, 'H', { r: 12, kind: 'hi' }) + plusAt(h.x + 18, h.y - 10);
    s += curve(P(k.top.x + 18, k.top.y - 12), P(h.x - 13, h.y + 2), { bow: -16 });
    s += sub(126, 202, 'acid activates the electrophile');

    // ---- 2 first alcohol attacks ----
    s += frame(260, 16, '2', 'FIRST ROH ATTACKS C');
    c = P(342, 132);
    k = core(c, { top: 1, topOrder: 2, topKind: 'hi' });
    s += k.g;
    s += text(k.top.x + 22, k.top.y - 10, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += plusAt(k.top.x - 20, k.top.y - 12);
    let nu = P(444, 168);
    s += atom(nu.x, nu.y, 'O', { kind: 'hi' });
    s += text(nu.x + 20, nu.y - 12, 'H', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(nu.x + 20, nu.y + 20, 'R', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += lonePair(nu.x, nu.y, 186, { dist: 23 });
    s += curve(P(nu.x - 22, nu.y - 6), P(c.x + 16, c.y + 8), { bow: 18 });
    s += sub(378, 202, 'the nucleophile is NEUTRAL');

    // ---- 3 deprotonate, giving the hemiacetal ----
    s += frame(512, 16, '3', 'LOSE H⁺ → HEMIACETAL');
    c = P(596, 132);
    k = core(c, { top: 1, right: 1, rightKind: 'hi' });
    s += k.g;
    s += text(k.top.x - 22, k.top.y - 8, 'H', { cls: 'fg-lbl', size: 11, anchor: 'end' });
    s += plusAt(k.right.x + 4, k.right.y - 24);
    s += text(k.right.x + 4, k.right.y + 28, 'R', { cls: 'fg-sm', size: 10 });
    h = P(k.right.x + 42, k.right.y - 6);
    s += bond(k.right, h, { rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12, kind: 'warn' });
    s += sub(600, 202, 'one OH and one OR: the hemiacetal');
    s += curve(P(h.x + 22, h.y - 34), P(h.x + 4, h.y - 14), { bow: 12 });

    // ---- 4 protonate the OH ----
    s += frame(8, 240, '4', 'PROTONATE THAT OH');
    c = P(96, 356);
    k = core(c, { top: 1, right: 1 });
    s += k.g;
    s += text(k.top.x + 22, k.top.y - 8, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += lonePair(k.top.x, k.top.y, 200, { dist: 23 });
    s += text(k.right.x + 4, k.right.y - 24, 'R', { cls: 'fg-sm', size: 10 });
    h = P(24, 300);
    s += atom(h.x, h.y, 'H', { r: 12, kind: 'hi' }) + plusAt(h.x - 4, h.y - 22);
    s += curve(P(k.top.x - 20, k.top.y - 8), P(h.x + 12, h.y + 2), { bow: 16 });
    s += sub(126, 202 + 224, 'a hopeless leaving group becomes water');

    // ---- 5 water leaves ----
    s += frame(260, 240, '5', 'LOSE WATER → OXOCARBENIUM');
    c = P(348, 356);
    k = core(c, { top: 1, right: 1, topKind: 'warn' });
    s += k.g;
    s += text(k.top.x - 26, k.top.y - 14, 'H', { cls: 'fg-sm', size: 10 });
    s += text(k.top.x + 22, k.top.y - 14, 'H', { cls: 'fg-sm', size: 10 });
    s += plusAt(k.top.x + 2, k.top.y - 30);
    s += text(k.right.x + 4, k.right.y - 24, 'R', { cls: 'fg-sm', size: 10 });
    s += curve(P(c.x - 14, c.y - 24), P(k.top.x - 14, k.top.y + 16), { bow: 18 });
    s += sub(378, 202 + 224, 'the C–O bond leaves WITH the oxygen');

    // ---- 6 second alcohol attacks the oxocarbenium ----
    s += frame(512, 240, '6', 'SECOND ROH ATTACKS');
    c = P(596, 356);
    k = core(c, { right: 1, rightOrder: 2, rightKind: 'hi' });
    s += k.g;
    s += plusAt(k.right.x + 4, k.right.y - 24);
    s += text(k.right.x + 4, k.right.y + 28, 'R', { cls: 'fg-sm', size: 10 });
    nu = P(c.x - 4, c.y - 62);
    s += atom(nu.x, nu.y, 'O', { kind: 'hi' });
    s += text(nu.x - 22, nu.y - 12, 'H', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(nu.x + 20, nu.y - 12, 'R', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += lonePair(nu.x, nu.y, 110, { dist: 23 });
    s += curve(P(nu.x + 12, nu.y + 20), P(c.x + 8, c.y - 18), { bow: -14 });
    s += sub(600, 202 + 224, 'flat, and open from both faces');

    // ---- 7 deprotonate, giving the acetal ----
    s += frame(8, 464, '7', 'LOSE H⁺ → ACETAL');
    c = P(96, 590);
    k = core(c, { top: 1, right: 1, topKind: 'hi' });
    s += k.g;
    s += plusAt(k.top.x + 2, k.top.y - 24);
    s += text(k.top.x - 22, k.top.y - 8, 'R', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(k.right.x + 4, k.right.y - 24, 'R', { cls: 'fg-sm', size: 10 });
    h = P(k.top.x + 40, k.top.y - 4);
    s += bond(k.top, h, { rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12, kind: 'warn' });
    s += curve(P(h.x + 22, h.y - 32), P(h.x + 4, h.y - 14), { bow: 12 });
    s += sub(126, 202 + 448, 'two OR groups, no carbonyl left');

    // the running commentary, beside the last frame
    s += text(272, 512, 'Every one of the seven is an equilibrium.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(272, 540, 'Read left to right with the water pulled out by a Dean–Stark', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 558, 'trap and you are protecting a carbonyl. Read right to left in', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 576, 'dilute aqueous acid and you are deprotecting it. The steps do', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 594, 'not change — only which side you flood.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 626, 'Count the protons: one in at step 1, one out at step 3, one in', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 644, 'at step 4, one out at step 7. The acid is a catalyst, and a', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 662, 'mechanism that does not balance that way has a step missing.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });

    s += rule(30, 696, 730, 696);
    s += text(380, 722, 'protonate · add · deprotonate   —   then protonate · lose water · add · deprotonate', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The whole mechanism as elementary steps, which is how an exam asks for it. Two halves of three and four: an ordinary acid-catalyzed addition gives the hemiacetal, then the hemiacetal’s OH is turned into water, ionizes, and is replaced by a second alcohol. The oxocarbenium ion in the middle is what makes the second half possible at all.',
  note: 'Two steps carry the difficulty. Step 5 is where the arrow starts on the <b>C–O bond</b> and ends on the oxygen — the leaving group departs with the electron pair, exactly as in any SN1 — and step 6 is where a flat, positively charged carbon is attacked from either face. Everything else is a proton moving on or off an oxygen.',
});


/* ------------------------------------------------------------- 11.4 ---
   The section names a gem-diol, a cyanohydrin and a bisulfite adduct, and
   then a whole fan-out of products from the nitrile, and draws none of
   them — the one figure it has is a bar chart. Row one makes the "same
   addition, three nucleophiles" claim visible; row two settles the
   alpha/beta bookkeeping that the labels alone never explain. */
FIGURES.push({
  id: 'three-nucleophiles-one-addition',
  section: 'hydrates-cyanohydrins',
  anchor: '<h3>Cyanohydrins: addition of cyanide</h3>',
  alt: 'Top row: the same ketone drawn three times after addition, giving a gem-diol from water, a cyanohydrin from cyanide and a bisulfite adduct from sodium bisulfite, each with an OH and the new group on one carbon. Bottom row: a cyanohydrin fanning out to an alpha-hydroxy carboxylic acid on hydrolysis and to a beta-amino alcohol on reduction, with the numbering that makes one alpha and the other beta marked on each product.',
  viewBox: '0 0 760 556',
  build() {
    let s = '';

    /* One adduct: the former carbonyl carbon, its two R groups, the OH that
       was the carbonyl oxygen, and whatever the nucleophile left behind. */
    const adduct = (c, right, opts = {}) => {
      const r1 = armEnd(c, 250, 44), r2 = armEnd(c, 290, 44);
      let g = bond(c, r1, { rTo: 13 }) + atom(r1.x, r1.y, 'R', { r: 13 });
      g += bond(c, r2, { rTo: 13 }) + atom(r2.x, r2.y, 'R', { r: 13 });
      const oh = armEnd(c, 140, 56), nu = armEnd(c, 40, 56);
      g += bond(c, oh, { rTo: 17 }) + atom(oh.x, oh.y, 'OH', { r: 17, size: 10 });
      g += bond(c, nu, { rTo: opts.r || 20 }) + atom(nu.x, nu.y, right, { r: opts.r || 20, size: opts.size || 9.5, kind: opts.kind || 'hi' });
      g += atom(c.x, c.y, 'C', { kind: 'warn' });
      return { g, oh, nu };
    };

    const cell = (x, t, sub) => panel(x, 16, 236, 204) + tag(x + 118, 40, t) + text(x + 118, 208, sub, { cls: 'fg-sm', size: 9.5 });

    s += cell(8, 'WATER', 'reversible, and usually far to the left');
    s += adduct(P(118, 120), 'OH', { r: 17, size: 10 }).g;
    s += text(118, 194, 'a gem-diol (hydrate)', { cls: 'fg-tag-good', size: 10.5 });

    s += cell(260, 'HCN + cat. CN⁻', 'the only one that builds a skeleton');
    s += adduct(P(370, 120), 'C≡N', { r: 20, size: 10 }).g;
    s += text(370, 194, 'a cyanohydrin', { cls: 'fg-tag-good', size: 10.5 });

    s += cell(512, 'NaHSO₃', 'crystalline, soluble, reversible');
    s += adduct(P(622, 120), 'SO₃⁻', { r: 20, size: 10 }).g;
    s += text(622, 194, 'a bisulfite adduct', { cls: 'fg-tag-good', size: 10.5 });

    // ---------- row 2: what the nitrile becomes, and where the letters start ----------
    s += panel(8, 244, 744, 268);
    s += tag(140, 268, 'WHERE THE α AND β LABELS COME FROM');

    const cy = P(96, 376);
    const A = adduct(cy, 'C≡N', { r: 20, size: 10 });
    s += A.g;
    s += text(96, 436, 'the cyanohydrin', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(186, 348), P(250, 328), { muted: true });
    s += text(218, 314, 'H₃O⁺, heat', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(186, 404), P(250, 424), { muted: true });
    s += text(218, 450, 'LiAlH₄', { cls: 'fg-sm', size: 9.5 });

    /* Upper branch: the acid's letters start AFTER the carboxyl carbon, so
       the carbon carrying the OH is alpha. */
    const ac = P(360, 318);
    const B = adduct(ac, 'COOH', { r: 24, size: 9.5 });
    s += B.g;
    s += text(B.nu.x + 30, B.nu.y - 2, 'C1', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(ac.x + 30, ac.y + 14, 'α', { cls: 'fg-tag-warn', size: 14 });
    s += text(470, 300, 'an α-hydroxy acid', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    s += text(470, 318, 'the acid counts from the carboxyl', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(470, 334, 'carbon, so its neighbor is α', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    /* Lower branch: an alcohol's letters start ON the carbinol carbon, so the
       carbon beside it is beta. */
    const bc = P(360, 440);
    const C = adduct(bc, 'CH₂NH₂', { r: 26, size: 9 });
    s += C.g;
    s += text(bc.x - 30, bc.y + 14, 'α', { cls: 'fg-tag-warn', size: 14 });
    s += text(C.nu.x + 32, C.nu.y - 2, 'β', { cls: 'fg-tag-warn', size: 14, anchor: 'start' });
    s += text(470, 422, 'a β-amino alcohol', { cls: 'fg-tag-good', size: 10.5, anchor: 'start' });
    s += text(470, 440, 'the alcohol counts from the carbinol', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(470, 456, 'carbon itself, so its neighbor is β', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    s += rule(30, 524, 730, 524);
    s += text(380, 546, 'Same skeleton both times. The letter changes because the group that owns the numbering does.', { cls: 'fg-lbl', size: 11 });
    return s;
  },
  caption: 'Three nucleophiles, one mechanism, three adducts that differ only in what is sitting beside the OH. Water gives the gem-diol, cyanide gives the cyanohydrin — the only one of the three that makes a carbon–carbon bond — and bisulfite gives a salt you can filter off and then take apart again.',
  note: 'The lower half is the part that gets marked wrong, and it is a naming convention rather than a chemical difference. A carboxylic acid\u2019s Greek letters start <b>after</b> the carboxyl carbon, so the carbon holding the OH is α. An alcohol\u2019s start <b>on</b> the carbinol carbon, so that same carbon is α there and the CH₂NH₂ beside it is β. One fragment, two reference points, two letters.',
});


/* ------------------------------------------------------------- 10.4 ---
   The butterfly transition state and what "syn, stereospecific" buys you.
   Both epoxide figures in the section are about OPENING the ring; the one
   3D claim the section makes about forming it — one oxygen, one face, at
   once — was prose only, and it is examined three times in the bank. */
FIGURES.push({
  id: 'mcpba-butterfly-syn',
  section: 'epoxides',
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

    /* One stereocentre, drawn twice per row: before attack with the oxygen on
       the right, and after attack with the halide on the left, so the
       umbrella has visibly turned inside out. */
    const centre = (c, x, opts = {}) => {
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
      const A = centre(c1, 'O', { xkind: 'hi' });
      g += A.g;
      g += lonePair(A.xp.x, A.xp.y, 300, { dist: 22 });
      g += text(A.xp.x - 4, A.xp.y - 26, 'H', { cls: 'fg-sm', size: 10 });
      const z = P(A.xp.x + 78, A.xp.y - 8);
      g += atom(z.x, z.y, cfg.centreAtom, { kind: 'warn' });
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
      const B = centre(c2, 'O', { flip: true, xkind: 'hi' });
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
      centreAtom: 'S', topGroup: 'O', x: 'Cl', leaving: 'S(=O)Cl',
      n1: 'chloride leaves sulfur, and the oxygen is left',
      n1b: 'carrying –SOCl: an alkyl chlorosulfite',
      t2: 'SOCl₂ · STEP 2 — BACKSIDE ATTACK BY Cl⁻',
      n2: 'it departs as SO₂ and Cl⁻, with no cation anywhere',
      n2b: '2-chlorobutane, configuration INVERTED',
    });
    s += row(276, {
      t1: 'PBr₃ · STEP 1 — THE OXYGEN ATTACKS PHOSPHORUS',
      centreAtom: 'P', topGroup: 'Br', x: 'Br', leaving: 'PBr₂',
      n1: 'bromide leaves phosphorus, and the oxygen is left',
      n1b: 'carrying –PBr₂',
      t2: 'PBr₃ · STEP 2 — BACKSIDE ATTACK BY Br⁻',
      n2: 'again no positive charge on carbon at any stage',
      n2b: '2-bromobutane, configuration INVERTED',
    });

    s += text(380, 508, 'Both reagents work at S or P, never at carbon — which is the whole reason neither one rearranges.', { cls: 'fg-lbl', size: 11 });
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
    s += atom(o2L.x, o2L.y, 'O'); s += lonePair(o2L.x, o2L.y, 110);
    s += atom(o2R.x, o2R.y, 'O'); s += lonePair(o2R.x, o2R.y, 250);
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
    s += atom(o2.x, o2.y, 'O'); s += lonePair(o2.x, o2.y, 40);
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
    s += text(24, 300, 'The C–N bond is partly double, so it does not rotate: the barrier is near 18 kcal/mol.', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(24, 322, 'One methyl sits beside the oxygen and one beside the H, and they never swap — two NMR signals.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The nitrogen lone pair is not sitting on nitrogen; it is in the pi system. That is why the C–N bond has partial double-bond character, why the six atoms of the O=C–N unit lie in one plane, and why the nitrogen is flat rather than pyramidal like an amine’s.',
  note: 'The NMR consequence is the one that can be checked in an afternoon. DMF’s two methyls look identical on paper, and at room temperature they give two separate ¹H signals, because the bond that would swap them cannot turn. Warm the sample enough and the two signals coalesce into one — which is how the 18 kcal/mol number was measured.',
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
  note: 'Count the arrows that are not reversible: none. That is why the reaction settles near 65% conversion and has to be driven — excess alcohol, or water removed as it forms. It is also why the same five panels, read from the right with water in place of methanol, are acid-catalyzed ester hydrolysis rather than a separate mechanism to learn.',
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
  note: 'This is why saponification is stoichiometric in hydroxide rather than catalytic: one equivalent of base is genuinely consumed, ending up on the product. It is also why the acid has to be recovered at the end with a separate acidification — what comes out of the flask is the salt.',
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
  note: 'Why the phenol and not the carboxyl? Because acylating a carboxylic acid would give a mixed anhydride, which is one rung up the ladder from the anhydride you started with and so goes nowhere. Acylating the phenol gives an ester, which is a rung down. The reaction picks the direction the ladder allows.',
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
