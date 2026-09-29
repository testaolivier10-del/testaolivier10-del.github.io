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


















































































/* ---------------------------------------------------------------- 200 ---
   Chapter 16 had 1.3 figures per section and makes four of its central
   claims in prose alone: where 4n + 2 comes from, which nitrogen lone pair
   is in the pi system, why the first EAS step is the slow one, and which
   three carbons the arenium charge actually reaches. Each of those is a
   picture the student is currently asked to build in their head. */









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
