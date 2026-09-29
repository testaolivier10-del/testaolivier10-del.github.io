/* Figures for the alcohol-reactions notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

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

export default FIGURES;
