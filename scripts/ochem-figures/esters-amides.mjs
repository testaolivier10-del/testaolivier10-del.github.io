/* Figures for the esters-amides notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

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

export default FIGURES;
