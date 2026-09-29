/* Figures for the sn1 notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

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


const FIGURES = [];

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

export default FIGURES;
