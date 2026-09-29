/* Figures for the conjugated-systems notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

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

export default FIGURES;
