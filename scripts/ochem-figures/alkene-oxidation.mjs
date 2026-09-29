/* Figures for the alkene-oxidation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

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

export default FIGURES;
