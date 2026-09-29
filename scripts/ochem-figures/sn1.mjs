/* Figures for the sn1 notes page. Built by scripts/build-ochem-figures.mjs;
   see the header there. SN1 has no lesson page (its walkthrough is
   ochem/mechanisms/sn1.html), so every figure here is a notes figure.

   Conventions, kept the same as the Carbocations page:
   - a curved arrow starts on electrons (a lone pair or the middle of a
     bond) and ends on the atom, or the bond, that receives them;
   - an orbital lobe is a pale ellipse (lobeE);
   - every atom a curved arrow touches is written out with its label, and
     skeletal chains are used only where the chain is long. */
import { atom as atom0, bond, wedge, hash, arrow, curve, lonePair, text, tag, rule, bar, P } from '../lib/ochem-figure.mjs';
import { skDouble, lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);

/* An atom disc that stays opaque in both themes. */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
const rOf = (l) => (l.length >= 3 ? 18 : l === 'H' ? 12 : l === 'C' || l === 'O' ? 15 : 15);
const chg = (p, s = '+') => text(p.x, p.y + 5, s, { cls: 'fg-warn', size: 16 });
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const sm = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-sm', size: 10.5, anchor });
const tg = (x, y, s, anchor = 'middle', cls = 'fg-tag') => text(x, y, s, { cls, size: 11, anchor });
/* A label whose first word is an italic prefix, such as tert-butyl. */
const itx = (x, y, pre, rest, cls = 'fg-sm', anchor = 'middle') =>
  text(x, y, 'XX', { cls, anchor }).replace('>XX<', `><tspan font-style="italic">${pre}</tspan>${rest}<`);
/* A lone pair on atom c, pointing along math angle deg. */
const lp = (c, deg, d = 22) => lonePair(c.x, c.y, -deg, { dist: d, spread: 4.5, r: 2.4 });
const lpTip = (c, deg, d = 29) => at(c, deg, d);

/* A group bonded to `from`. o.bond: 'wedge' | 'hash'; o.rFrom: radius of
   the atom it starts from (0 for a skeletal vertex). */
function arm(from, deg, len, l, o = {}) {
  const e = at(from, deg, len);
  const r = l ? (o.r ?? rOf(l)) : 0;
  const rFrom = o.rFrom ?? 15;
  let s = o.bond === 'wedge' ? wedge(from, e, { rFrom, rTo: r, width: 9 })
        : o.bond === 'hash' ? hash(from, e, { rFrom, rTo: r, width: 10, rungs: 5 })
        : bond(from, e, { rFrom, rTo: r, cls: o.cls });
  if (l) s += atom(e.x, e.y, l, { r, kind: o.kind, size: o.size });
  return { s, e };
}
/* A curved arrow that starts on the middle of bond a–b, pushed `off` px to
   the left of the direction a→b (negative: right), and ends at e. */
function fromBond(a, b, e, bow, off = 5) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  return curve(P(m.x + (dy / L) * off, m.y - (dx / L) * off), e, { bow, size: 7 });
}
const fromLp = (c, deg, e, bow) => curve(lpTip(c, deg), e, { bow, size: 7 });
/* Skeletal bond between two vertices (or a vertex and a labelled atom). */
const skb = (a, b, o = {}) => bond(a, b, { rFrom: o.rFrom ?? 0, rTo: o.rTo ?? 0, cls: o.cls });
const dot = (p) => atom(p.x, p.y, '', { kind: 'point' });

/* tert-Butyl with the fourth group on the right (angle 0). Returns the ink
   and the fourth atom's position. Methyls sit at 90, 180 and 270 so that
   nothing crowds the right-hand side, where the chemistry happens. */
function tBu(c, fourth) {
  let s = '';
  for (const d of [90, 180, 270]) s += arm(c, d, 50, 'CH₃', { r: 17, size: 10 }).s;
  const f = at(c, 0, 50);
  if (fourth) {
    s += bond(c, f, { rFrom: 15, rTo: fourth.r ?? 15 });
    s += atom(f.x, f.y, fourth.label, { r: fourth.r ?? 15, kind: fourth.kind });
  }
  s += atom(c.x, c.y, 'C');
  return { s, f };
}
/* The tert-butyl cation, flat: three methyls 120 degrees apart, the open
   side facing `open` (math degrees). */
function tBuCation(c, open = 0) {
  let s = '';
  for (const d of [open + 60, open + 180, open + 300]) s += arm(c, d, 50, 'CH₃', { r: 17, size: 10 }).s;
  s += atom(c.x, c.y, 'C', { kind: 'warn' });
  s += chg(at(c, open, 27));
  return s;
}
/* Water: O at p, H atoms at the given angles, lone pairs at the others. */
function water(p, hs, lps, o = {}) {
  let s = '';
  for (const d of hs) s += arm(p, d, 36, 'H', { r: 11, size: 11 }).s;
  for (const d of lps) s += lp(p, d, 21);
  s += atom(p.x, p.y, 'O', { kind: o.kind });
  return s;
}
/* A free bromide ion with four lone pairs and its charge. */
function bromide(p, chgDeg = 45) {
  let s = '';
  for (const d of [90, 0, 180, 270]) s += lp(p, d, 24);
  s += atom(p.x, p.y, 'Br', { kind: 'hi', r: 16 });
  s += chg(at(p, chgDeg, 31), '−');
  return s;
}

/* ======================================================================
   1. tert-Butyl bromide in water: the three steps, with every arrow.
   ====================================================================== */
FIGURES.push({
  id: 'solvolysis-three-steps',
  section: 'sn1',
  anchor: 'Out come the neutral alcohol and H<sub>3</sub>O<sup>+</sup>.</p>',
  alt: 'Three rows. Step 1, slow, with no nucleophile involved: in tert-butyl bromide a curved arrow runs from the carbon-bromine bond onto bromine, giving the flat tert-butyl cation and bromide ion with four lone pairs. Step 2, fast: a curved arrow runs from a lone pair on a water oxygen to the positive carbon, giving an oxonium ion whose oxygen has three bonds, one lone pair and a positive charge. Step 3, fast: a second water uses a lone pair to take one hydrogen from the oxonium oxygen while the oxygen-hydrogen bond moves back onto oxygen, giving tert-butanol and hydronium.',
  viewBox: '0 0 760 624',
  build() {
    let s = '';
    // ---- STEP 1: ionization ----
    s += tg(30, 26, 'STEP 1 — SLOW: THE C–Br BOND BREAKS, NO NUCLEOPHILE', 'start');
    const c1 = P(120, 112);
    const A = tBu(c1, { label: 'Br', kind: 'hi', r: 16 });
    s += A.s;
    for (const d of [60, 0, 300]) s += lp(A.f, d, 24);
    s += fromBond(c1, A.f, at(A.f, 115, 20), -34, 8);
    s += sm(140, 194, 'one arrow; nothing attacks');
    s += arrow(P(236, 112), P(300, 112), { muted: true });
    const c2 = P(400, 112);
    s += tBuCation(c2, 0);
    s += itx(410, 188, 'tert', '-butyl cation: flat,');
    s += sm(410, 204, 'six valence electrons on C');
    s += lbl(512, 117, '+');
    s += bromide(P(580, 112));
    s += sm(580, 188, 'bromide, Br⁻');
    s += rule(30, 218, 730, 218);

    // ---- STEP 2: water attacks the cation ----
    s += tg(30, 244, 'STEP 2 — FAST: WATER BONDS TO THE CATION', 'start');
    const c3 = P(120, 330);
    s += tBuCation(c3, 0);
    const w1 = P(226, 330);
    s += water(w1, [45, 315], [150, 210]);
    s += fromLp(w1, 150, at(c3, 20, 20), 12);
    s += sm(150, 408, 'a lone pair on O fills the empty orbital');
    s += arrow(P(292, 330), P(356, 330), { muted: true });
    const c4 = P(440, 330);
    const B = tBu(c4, { label: 'O', r: 15 });
    s += B.s;
    s += arm(B.f, 55, 36, 'H', { r: 11, size: 11, rFrom: 15 }).s;
    s += arm(B.f, 305, 36, 'H', { r: 11, size: 11, rFrom: 15 }).s;
    s += lp(B.f, 0, 21);
    s += chg(at(B.f, 110, 27));
    s += tg(600, 316, 'oxonium ion', 'start', 'fg-tag-warn');
    s += sm(600, 334, 'O: three bonds,', 'start');
    s += sm(600, 350, 'one lone pair, so +', 'start');
    s += rule(30, 428, 730, 428);

    // ---- STEP 3: a second water takes the proton ----
    s += tg(30, 454, 'STEP 3 — FAST: A SECOND WATER TAKES THE PROTON', 'start');
    const c5 = P(100, 530);
    const C = tBu(c5, { label: 'O', r: 15 });
    s += C.s;
    const hUp = arm(C.f, 55, 36, 'H', { r: 11, size: 11, rFrom: 15 });
    const hDn = arm(C.f, 305, 36, 'H', { r: 11, size: 11, rFrom: 15, kind: 'hi' });
    s += hUp.s + hDn.s;
    s += lp(C.f, 0, 21);
    s += chg(at(C.f, 110, 27));
    const w2 = P(262, 548);
    s += water(w2, [60, 300], [140, 220]);
    s += fromLp(w2, 220, P(hDn.e.x + 12, hDn.e.y + 7), -26);
    s += fromBond(C.f, hDn.e, at(C.f, 235, 18), -22, 6);
    s += arrow(P(310, 530), P(374, 530), { muted: true });
    const c6 = P(456, 530);
    const D = tBu(c6, { label: 'O', r: 15 });
    s += D.s;
    s += arm(D.f, 305, 36, 'H', { r: 11, size: 11, rFrom: 15 }).s;
    s += lp(D.f, 70, 21) + lp(D.f, 5, 21);
    s += itx(481, 612, 'tert', '-butanol', 'fg-tag-good');
    s += lbl(580, 535, '+');
    s += lbl(648, 535, 'H₃O⁺');
    return s;
  },
  caption: 'Follow the arrows and count the bonds on each atom they touch. The charge sits on carbon after step 1 and on oxygen after step 2.',
});

/* ======================================================================
   2. (R)-3-bromo-3-methylhexane: the stereocenter goes flat, then both
      faces are attacked.
   ====================================================================== */
/* A stereocenter drawn with `top` straight up and the other three below. */
function center4(c, top, topKind, flip) {
  let s = '';
  const t = flip ? 270 : 90;
  const pr = flip ? 30 : 330, et = flip ? 160 : 200, me = flip ? 110 : 250;
  s += arm(c, t, 50, top, { kind: topKind }).s;
  s += arm(c, pr, 58, 'C₃H₇', { r: 19, size: 10 }).s;
  s += arm(c, et, 52, 'C₂H₅', { r: 19, size: 10, bond: 'wedge' }).s;
  s += arm(c, me, 50, 'CH₃', { r: 17, size: 10, bond: 'hash' }).s;
  s += atom(c.x, c.y, 'C');
  return s;
}
FIGURES.push({
  id: 'racemization-drawn',
  section: 'sn1',
  anchor: '<p><b>Answer:</b> (R)- and (S)-3-methylhexan-3-ol in nearly equal amounts: a largely racemic product.</p>',
  alt: 'Left: (R)-3-bromo-3-methylhexane, with bromine straight up, propyl down to the right, ethyl on a wedge and methyl on a hash. Middle: after bromide leaves, the cation seen edge-on, its three groups in one horizontal plane and an empty p orbital with one lobe above and one below; one water molecule attacks the top lobe and another the bottom lobe. Right: attack from the top puts OH where bromine was, giving (R)-3-methylhexan-3-ol by retention; attack from the bottom gives the mirror image, (S)-3-methylhexan-3-ol, by inversion.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    // ---- the starting material ----
    const a = P(96, 196);
    s += center4(a, 'Br', 'hi', false);
    s += tg(100, 292, '(R)-3-bromo-3-methylhexane', 'middle');
    s += arrow(P(172, 196), P(232, 196), { muted: true });
    s += sm(202, 184, '− Br⁻');

    // ---- the flat cation, attacked from both faces ----
    const c = P(350, 200);
    s += lobeE(c.x, c.y - 44, 19, 30);
    s += lobeE(c.x, c.y + 44, 19, 30);
    s += arm(c, 0, 62, 'C₃H₇', { r: 19, size: 10 }).s;
    s += arm(c, 205, 58, 'C₂H₅', { r: 19, size: 10, bond: 'wedge' }).s;
    s += arm(c, 158, 56, 'CH₃', { r: 17, size: 10, bond: 'hash' }).s;
    s += atom(c.x, c.y, 'C', { kind: 'warn' });
    s += chg(at(c, 322, 33));
    const wTop = P(350, 60), wBot = P(350, 342);
    s += atom(wTop.x, wTop.y, 'H₂O', { r: 19, size: 10 });
    s += lp(wTop, 220, 25) + lp(wTop, 320, 25);
    s += fromLp(wTop, 320, P(c.x + 4, c.y - 78), -12);
    s += atom(wBot.x, wBot.y, 'H₂O', { r: 19, size: 10 });
    s += lp(wBot, 40, 25) + lp(wBot, 140, 25);
    s += fromLp(wBot, 40, P(c.x + 4, c.y + 78), 12);
    s += sm(384, 52, 'top face', 'start');
    s += sm(384, 356, 'bottom face', 'start');
    s += tg(236, 104, 'FLAT CATION:', 'middle');
    s += tg(236, 120, 'BOTH FACES OPEN', 'middle');

    // ---- the two products ----
    s += arrow(P(442, 168), P(502, 120), { muted: true });
    s += arrow(P(442, 232), P(502, 280), { muted: true });
    const top = P(580, 106), bot = P(580, 294);
    s += center4(top, 'OH', 'hi', false);
    s += center4(bot, 'OH', 'hi', true);
    s += `<line class="fg-dash" x1="520" y1="200" x2="650" y2="200"></line>`;
    s += sm(656, 204, 'mirror', 'start');
    s += tg(748, 92, '(R)-alcohol', 'end', 'fg-tag-good');
    s += sm(748, 110, 'top face: retention', 'end');
    s += tg(748, 300, '(S)-alcohol', 'end', 'fg-tag-good');
    s += sm(748, 318, 'bottom face: inversion', 'end');
    return s;
  },
  caption: 'Follow bromine&rsquo;s position on the left into the OH of each product. The wedge and hash on each drawing show which groups point toward you and which point away.',
});

/* ======================================================================
   3. The ion pair: the leaving bromide screens the face it left.
   ====================================================================== */
function cationEdge(c) {
  let s = '';
  s += lobeE(c.x, c.y - 42, 18, 28);
  s += lobeE(c.x, c.y + 42, 18, 28);
  s += arm(c, 0, 60, 'C₃H₇', { r: 19, size: 10 }).s;
  s += arm(c, 205, 56, 'C₂H₅', { r: 19, size: 10, bond: 'wedge' }).s;
  s += arm(c, 158, 54, 'CH₃', { r: 17, size: 10, bond: 'hash' }).s;
  s += atom(c.x, c.y, 'C', { kind: 'warn' });
  s += chg(at(c, 322, 32));
  return s;
}
FIGURES.push({
  id: 'ion-pair',
  section: 'sn1',
  anchor: 'Once solvent molecules slip between the two ions, both faces are equally open again.</p>',
  alt: 'Two panels. Left, the ion pair: bromide sits just above the flat cation, on the face it left, and partly blocks it; water attacks the open bottom face, which gives the inverted product. Right, a moment later: solvent molecules have moved between the ions, bromide is farther off, and water can attack the top and bottom faces equally.',
  viewBox: '0 0 760 360',
  build() {
    let s = '';
    s += tg(190, 24, 'JUST AFTER IONIZATION: AN ION PAIR');
    const c = P(190, 196);
    s += cationEdge(c);
    s += bromide(P(190, 94), 20);
    s += sm(236, 90, 'bromide still beside', 'start');
    s += sm(236, 106, 'the face it left', 'start');
    const w = P(190, 326);
    s += atom(w.x, w.y, 'H₂O', { r: 19, size: 10 });
    s += lp(w, 40, 25) + lp(w, 140, 25);
    s += fromLp(w, 40, P(c.x + 4, c.y + 74), 12);
    s += sm(236, 318, 'the open face:', 'start');
    s += sm(236, 334, 'inversion', 'start');

    s += `<line class="fg-rule" x1="380" y1="40" x2="380" y2="340"></line>`;

    s += tg(570, 24, 'A MOMENT LATER: IONS SEPARATED');
    const d = P(560, 196);
    s += cationEdge(d);
    s += bromide(P(700, 70), 225);
    s += sm(700, 116, 'solvent now between');
    s += sm(700, 132, 'the ions');
    const w1 = P(560, 66), w2 = P(560, 326);
    s += atom(w1.x, w1.y, 'H₂O', { r: 19, size: 10 });
    s += lp(w1, 220, 25) + lp(w1, 320, 25);
    s += fromLp(w1, 320, P(d.x + 4, d.y - 74), -12);
    s += atom(w2.x, w2.y, 'H₂O', { r: 19, size: 10 });
    s += lp(w2, 40, 25) + lp(w2, 140, 25);
    s += fromLp(w2, 40, P(d.x + 4, d.y + 74), 12);
    s += sm(606, 334, 'both faces equally open', 'start');
    return s;
  },
  caption: 'Compare where the bromide sits in the two panels, and which faces water can reach.',
});

/* ======================================================================
   4. Substrate class: SN1 and SN2 run in opposite directions.
   ====================================================================== */
FIGURES.push({
  id: 'sn1-sn2-by-class',
  section: 'sn1',
  anchor: 'That is why substrate class is the first thing to check when you decide between the two.</p>',
  alt: 'A chart with four rows: methyl (CH3Br), primary (CH3CH2Br), secondary ((CH3)2CHBr) and tertiary ((CH3)3CBr). For SN1 the bars grow from none, none, slow to fast, because the cation gets more stable down the rows. For SN2 the bars shrink from fastest, fast, slow to none, because the back of the carbon gets more crowded.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tg(250, 30, 'SN1: HOW EASILY THE CATION FORMS');
    s += tg(560, 30, 'SN2: HOW OPEN THE BACK IS');
    const rows = [
      ['methyl', 'CH₃Br', 0, 'no', 1.0, 'fastest'],
      ['1°', 'CH₃CH₂Br', 0, 'no', 0.8, 'fast'],
      ['2°', '(CH₃)₂CHBr', 0.35, 'slow', 0.25, 'slow'],
      ['3°', '(CH₃)₃CBr', 1.0, 'fast', 0, 'no'],
    ];
    rows.forEach(([cls, f, v1, w1, v2, w2], i) => {
      const y = 70 + i * 56;
      s += lbl(24, y + 5, cls, 'start');
      s += sm(24, y + 22, f, 'start');
      if (v1 > 0) s += bar(160, y - 7, 180 * v1, 16, { kind: 'good' });
      else s += `<line class="fg-dash" x1="160" y1="${y + 1}" x2="186" y2="${y + 1}"></line>`;
      s += sm(v1 > 0 ? 168 + 180 * v1 : 194, y + 5, w1, 'start');
      if (v2 > 0) s += bar(470, y - 7, 180 * v2, 16, { kind: 'hi' });
      else s += `<line class="fg-dash" x1="470" y1="${y + 1}" x2="496" y2="${y + 1}"></line>`;
      s += sm(v2 > 0 ? 478 + 180 * v2 : 504, y + 5, w2, 'start');
    });
    s += rule(24, 268, 736, 268);
    s += sm(380, 290, 'More alkyl groups on the carbon: a more stable cation, and a more crowded back side.');
    return s;
  },
  caption: 'Read each row across. The bars show the trend in rate only; they are not to scale.',
});

/* ======================================================================
   5. An allylic cation: two carbons share the charge, two products form.
   ====================================================================== */
/* A square bracket from y1 to y2 at x; dir 1 opens to the right. */
const bracket = (x, y1, y2, dir) =>
  `<path class="fg-bond" fill="none" d="M${x + 8 * dir} ${y1} L${x} ${y1} L${x} ${y2} L${x + 8 * dir} ${y2}"></path>`;
/* A four-carbon zigzag C1 low, C2 high, C3 low, C4 high. */
const chain = (x, y) => [P(x, y + 20), P(x + 38, y - 2), P(x + 76, y + 20), P(x + 114, y - 2)];
FIGURES.push({
  id: 'allylic-two-products',
  section: 'sn1',
  anchor: 'Both alcohols come from the same cation, so the reaction gives a mixture of the two.</p>',
  alt: 'Top row: 3-chlorobut-1-ene, with the chlorine on C3 and a double bond from C1 to C2, loses chloride. The cation that forms is drawn as two resonance structures in brackets: in the first the positive charge is on C3 and the double bond is C1=C2, and a curved arrow moves the pi electrons toward C3; in the second the charge is on C1 and the double bond is C2=C3. Bottom row: water bonding to C3 gives but-3-en-2-ol; water bonding to C1 gives but-2-en-1-ol, in which the double bond has moved.',
  viewBox: '0 0 760 360',
  build() {
    let s = '';
    const num = (p, n, dy = 18) => text(p.x, p.y + dy, n, { cls: 'fg-sm', size: 10.5 });
    // ---- substrate ----
    const S = chain(28, 70);
    s += skDouble(S[0], S[1], P(S[0].x + 30, S[0].y + 30)) + skb(S[1], S[2]) + skb(S[2], S[3]);
    s += arm(S[2], 270, 38, 'Cl', { rFrom: 0, r: 14 }).s;
    s += num(S[0], '1') + num(S[1], '2', -10) + text(S[2].x - 14, S[2].y + 10, '3', { cls: 'fg-sm', size: 10.5 }) + num(S[3], '4', -10);
    s += tg(85, 24, '3-chlorobut-1-ene');
    s += arrow(P(160, 82), P(214, 82), { muted: true });
    s += sm(187, 70, '− Cl⁻');

    // ---- the cation, two resonance structures in brackets ----
    s += bracket(242, 44, 120, 1);
    const A = chain(262, 70);
    s += skDouble(A[0], A[1], P(A[0].x + 30, A[0].y + 30)) + skb(A[1], A[2]) + skb(A[2], A[3]);
    s += chg(P(A[2].x, A[2].y + 22));
    s += num(A[0], '1') + num(A[1], '2', -10) + text(A[2].x - 14, A[2].y + 10, '3', { cls: 'fg-sm', size: 10.5 }) + num(A[3], '4', -10);
    /* the pi pair of C1=C2 moves over to the C2–C3 bond */
    s += curve(P((A[0].x + A[1].x) / 2 - 6, (A[0].y + A[1].y) / 2 - 8), P((A[1].x + A[2].x) / 2 + 4, (A[1].y + A[2].y) / 2 - 8), { bow: -16, size: 7 });
    s += arrow(P(392, 90), P(428, 90)) + arrow(P(428, 90), P(392, 90));
    const B = chain(440, 70);
    s += skb(B[0], B[1]) + skDouble(B[1], B[2], P(B[1].x, B[1].y + 40)) + skb(B[2], B[3]);
    s += chg(P(B[0].x - 4, B[0].y + 22));
    s += num(B[0], '1', -12) + num(B[1], '2', -10) + num(B[2], '3') + num(B[3], '4', -10);
    s += bracket(578, 44, 120, -1);
    s += tg(410, 24, 'ONE CATION, CHARGE SHARED BY C1 AND C3');

    // ---- the two products ----
    s += arrow(P(320, 136), P(250, 210), { muted: true });
    s += sm(236, 168, 'H₂O bonds', 'end');
    s += sm(236, 184, 'to C3', 'end');
    s += arrow(P(500, 136), P(570, 210), { muted: true });
    s += sm(584, 168, 'H₂O bonds', 'start');
    s += sm(584, 184, 'to C1', 'start');
    const X = chain(120, 236);
    s += skDouble(X[0], X[1], P(X[0].x + 30, X[0].y + 30)) + skb(X[1], X[2]) + skb(X[2], X[3]);
    s += arm(X[2], 270, 38, 'OH', { rFrom: 0, r: 15, kind: 'hi' }).s;
    s += tg(178, 344, 'but-3-en-2-ol', 'middle', 'fg-tag-good');
    const Y = chain(520, 236);
    s += skb(Y[0], Y[1]) + skDouble(Y[1], Y[2], P(Y[1].x, Y[1].y + 40)) + skb(Y[2], Y[3]);
    s += arm(Y[0], 200, 38, 'HO', { rFrom: 0, r: 15, kind: 'hi' }).s;
    s += tg(560, 344, 'but-2-en-1-ol', 'middle', 'fg-tag-good');
    s += sm(560, 322, 'the double bond has moved');
    s += sm(178, 322, 'OH where Cl was');
    return s;
  },
  caption: 'Track where the + sits in each bracketed structure, then which carbon carries the OH in each product.',
});

/* ======================================================================
   6. 3-Methylbutan-2-ol with HBr: a hydride shift before capture.
   ====================================================================== */
/* The skeleton C1 low, C2 high, C3 low, C4 high, with the C3 methyl down
   and to the left. Returns the vertices. */
function skel(x, y) {
  const c = [P(x, y + 22), P(x + 40, y), P(x + 80, y + 22), P(x + 120, y)];
  const me = at(c[2], 240, 40);
  return { c, me, g: skb(c[0], c[1]) + skb(c[1], c[2]) + skb(c[2], c[3]) + skb(c[2], me) };
}
FIGURES.push({
  id: 'hydride-shift-drawn',
  section: 'sn1',
  anchor: 'so the product is <b>2-bromo-2-methylbutane</b>, not 2-bromo-3-methylbutane.</p>',
  alt: 'Four skeletal structures in two rows. First, 3-methylbutan-2-ol, with OH on C2 and a hydrogen drawn on C3. After the OH is protonated and water leaves, a secondary cation sits on C2; a curved arrow runs from the C3–H bond to C2. After the shift the hydrogen is on C2 and the positive charge is on C3, now a tertiary cation. Bromide bonds to C3, giving 2-bromo-2-methylbutane.',
  viewBox: '0 0 760 392',
  build() {
    let s = '';
    /* locants: C1 below-left, C2 above-left of its vertex, C3 below-right, C4 below-right */
    const nums = (k, skip = []) => {
      const off = [[-10, 16], [-18, -6], [16, 16], [10, 16]];
      let g = '';
      k.c.forEach((p, i) => { if (!skip.includes(i)) g += text(p.x + off[i][0], p.y + off[i][1], String(i + 1), { cls: 'fg-sm', size: 10.5 }); });
      return g;
    };
    // ---- row 1: alcohol → 2° cation with the shift arrow ----
    s += tg(120, 24, '3-methylbutan-2-ol');
    const A = skel(60, 100);
    s += A.g;
    s += arm(A.c[1], 90, 40, 'OH', { rFrom: 0, r: 15 }).s;
    s += arm(A.c[2], 90, 36, 'H', { rFrom: 0, r: 11, size: 11 }).s;
    s += nums(A);
    s += arrow(P(222, 120), P(318, 120), { muted: true });
    s += sm(270, 106, 'H⁺ on O,');
    s += sm(270, 144, 'then H₂O leaves');

    s += tg(420, 24, '2° CATION AT C2', 'middle', 'fg-tag-warn');
    const B = skel(360, 100);
    s += B.g;
    const h = arm(B.c[2], 90, 36, 'H', { rFrom: 0, r: 11, size: 11, kind: 'hi' });
    s += h.s;
    s += chg(P(B.c[1].x - 4, B.c[1].y - 24));
    s += fromBond(B.c[2], h.e, P(B.c[1].x + 9, B.c[1].y - 11), 12, 5);
    s += nums(B);
    s += sm(530, 110, 'the arrow starts on', 'start');
    s += sm(530, 126, 'the C3–H bond', 'start');
    s += rule(30, 208, 730, 208);

    // ---- row 2: 3° cation → product ----
    s += arrow(P(40, 300), P(100, 300), { muted: true });
    s += sm(70, 286, 'shift');
    s += tg(190, 380, '3° CATION AT C3', 'middle', 'fg-tag-good');
    const C = skel(130, 280);
    s += C.g;
    s += arm(C.c[1], 90, 36, 'H', { rFrom: 0, r: 11, size: 11, kind: 'hi' }).s;
    s += chg(P(C.c[2].x + 22, C.c[2].y - 4));
    s += nums(C, [2]) + text(C.c[2].x + 10, C.c[2].y + 28, '3', { cls: 'fg-sm', size: 10.5 });
    s += arrow(P(290, 300), P(386, 300), { muted: true });
    s += sm(338, 286, 'Br⁻ bonds to C3');
    const D = skel(430, 280);
    s += D.g;
    s += arm(D.c[2], 300, 40, 'Br', { rFrom: 0, r: 15, kind: 'hi' }).s;
    s += tg(490, 380, '2-bromo-2-methylbutane', 'middle', 'fg-tag-good');
    s += sm(660, 292, 'not 2-bromo-3-methylbutane,');
    s += sm(660, 308, 'the product of a direct swap');
    return s;
  },
  caption: 'Watch the hydrogen on C3 and the + sign: after the shift, each has moved to the other carbon.',
});

export default FIGURES;
