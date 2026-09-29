/* Figures for the carbon-carbon-bonds notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

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
    const skeleton = (cx, enone, hi) => {
      const b = P(cx - 66, 150), a = P(cx - 16, 178), k = P(cx + 34, 150);
      let g = '';
      g += bond(b, a, { order: enone ? 2 : 1 });
      g += bond(a, k);
      g += bond(k, P(cx + 34, 100), { order: 2 });
      g += bond(k, P(cx + 82, 178));
      g += atom(cx + 34, 100, 'O');
      g += atom(cx + 82, 178, 'R');
      /* The highlighted atom is the one the panel is about, not always the
         carbonyl carbon: a panel titled "at the alpha carbon" that rings the
         carbonyl carbon fights its own title. */
      g += atom(b.x, b.y, 'C', hi === 'b' ? { kind: 'hi' } : {});
      g += atom(a.x, a.y, 'C', hi === 'a' ? { kind: 'hi' } : {});
      g += atom(k.x, k.y, 'C', hi === 'k' ? { kind: 'hi' } : {});
      g += text(cx - 66, 124, '\u03B2', { cls: 'fg-lbl', size: 12 });
      g += text(cx - 44, 196, '\u03B1', { cls: 'fg-lbl', size: 12 });
      return g;
    };

    /* The three panels are pulled inside the left 90% of the canvas: at 512
       the third one's border, its R and the reagent line under it were all
       behind the reading column's horizontal scroll. */
    const col = (x, title, enone, reagents, product, hi) => {
      const cx = x + 108;
      s += panel(x, 52, 216, 244);
      s += tag(cx, 40, title);
      s += skeleton(cx, enone, hi);
      s += text(cx, 268, reagents, { cls: 'fg-sm', size: 10 });
      s += text(cx, 288, product, { cls: 'fg-tag-good', size: 10.5 });
      return cx;
    };

    // At the carbonyl carbon: the nucleophile comes in from outside.
    let cx = col(16, 'at the carbonyl carbon', false, 'RMgBr, RLi, \u207BCN, acetylide', 'an alcohol', 'k');
    s += curve(P(cx + 34, 232), P(cx + 34, 172), { bow: 14 });
    s += label(cx + 34, 248, 'Nu\u207B', { size: 12 });

    // At the alpha carbon: the molecule itself is the nucleophile.
    cx = col(240, 'at the \u03B1 carbon', false, 'base first, then RX or a carbonyl', 'alkylation, aldol, Claisen', 'a');
    s += curve(P(cx - 16, 196), P(cx - 16, 230), { bow: 12 });
    s += label(cx - 16, 250, 'E\u207A', { size: 12 });
    s += text(cx, 74, 'base takes an \u03B1 H first', { cls: 'fg-sm', size: 9 });

    // At the beta carbon: only an enone offers this one.
    cx = col(464, 'at the \u03B2 carbon', true, 'enolate + an enone (Michael)', '1,5-dicarbonyl', 'b');
    s += curve(P(cx - 66, 232), P(cx - 66, 172), { bow: 14 });
    s += label(cx - 66, 248, 'Nu\u207B', { size: 12 });

    s += text(350, 326, 'One carbonyl, three carbons to attach to. The reagent chooses which.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The same four atoms three times, with the new C\u2013C bond arriving in a different place each time. A nucleophile lands <b>on</b> the carbonyl carbon; an enolate makes the molecule itself the nucleophile and the bond forms <b>next to</b> it; conjugate addition to an enone lands <b>two carbons out</b>.',
  note: 'The middle panel is the one that reverses direction, and that is why it is easy to lose: in the other two the arrow points into the carbonyl compound, and in the aldol, Claisen and alkylation it points out of it. Note also that only the third panel is drawn with a C=C \u2014 conjugate addition is not an option a plain ketone offers, it is something the conjugation creates.',
});

/* ------------------------------------------------------------------ D7 ---
   The ten, as structures. The section's claim is that the list is short
   enough to learn as a list, and then it never draws a single member of it.
   A table of "joins" and "gives" says what a reaction does; it does not say
   what an acetylide alkylation LOOKS like, which is what a reader has to
   recognize in a target. */
FIGURES.push({
  id: 'the-ten-drawn-once',
  section: 'carbon-carbon-bonds',
  anchor: 'acylation does neither, which is why it is almost always the one to plan with.</div>',
  alt: 'Ten panels, one for each carbon-carbon bond-forming reaction, each showing the product with the newly formed bond picked out',
  viewBox: '0 0 700 760',
  build() {
    let s = '';
    s += tag(350, 26, 'each reaction once, with the bond it just made drawn in color');

    const PW = 334, PH = 140;
    const cols = [10, 356];
    const rows = [44, 186, 328, 470, 612];

    /* Half-width of a condensed formula. Every atom label renders at the
       stylesheet's 13px monospace regardless of what the drawing kit is
       asked for, so the disc has to be sized from the character count or the
       label hangs out of it -- which is exactly what the first draft did. */
    const hw = (t) => t.length * 4 + 6;
    const frag = (x, cy, t) => (t.length <= 5
      ? atom(x, cy, t, { r: Math.max(15, hw(t)) })
      : label(x, cy + 4.5, t));

    /* Two fragments and the bond that has just joined them: the shape of six
       of the ten. Centred on cx so the panel does not look lopsided. */
    const joinRow = (cx, cy, left, right) => {
      const lw = Math.max(15, hw(left)), rw = Math.max(15, hw(right));
      const total = lw * 2 + 44 + rw * 2;
      const lx = cx - total / 2 + lw, rx = cx + total / 2 - rw;
      return bond(P(lx, cy), P(rx, cy), { rFrom: lw + 3, rTo: rw + 3, cls: 'fg-bond-hi' })
        + frag(lx, cy, left) + frag(rx, cy, right);
    };

    const ring = (cx, cy, r, opts = {}) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = ((opts.start ?? -90) + i * 60) * Math.PI / 180;
        v.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
      }
      let g = '';
      for (let i = 0; i < 6; i++) {
        const cls = (opts.hiEdges || []).includes(i) ? 'fg-bond-hi' : 'fg-bond';
        const order = (opts.dblEdges || []).includes(i) ? 2 : 1;
        g += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0, cls, order, gap: 3.5 });
      }
      if (opts.aromatic) g += `<circle class="fg-bond" cx="${cx}" cy="${cy}" r="${Math.round(r * 0.58)}" fill="none"></circle>`;
      return { g, v };
    };

    const panels = [
      { t: 'Grignard or RLi + carbonyl', r: 'cyclohexanone + CH₃MgBr', n: '1-methylcyclohexan-1-ol',
        draw(cx, cy) {
          /* Both new groups hang off ONE ring carbon (v[0], placed at the
             east point of the ring), because the product is a tertiary
             alcohol: the carbon that was the C=O now carries the OH and the
             methyl. The first draft put them on adjacent carbons, which is
             2-methylcyclohexan-1-ol and a different reaction entirely. */
          const { g, v } = ring(cx - 38, cy, 19, { start: 0 });
          return g
            + bond(v[0], P(cx + 8, cy - 24), { rFrom: 0, rTo: 15 })
            + bond(v[0], P(cx + 8, cy + 24), { rFrom: 0, rTo: 17, cls: 'fg-bond-hi' })
            + atom(cx + 8, cy - 24, 'OH')
            + atom(cx + 8, cy + 24, 'CH₃', { kind: 'hi', r: 17 });
        } },
      { t: 'Grignard + CO₂', r: 'CH₃CH₂MgBr + CO₂, then H₃O⁺', n: 'propanoic acid',
        draw: (cx, cy) => joinRow(cx, cy, 'CH₃CH₂', 'CO₂H') },
      { t: 'acetylide + alkyl halide', r: 'HC≡C⁻ Na⁺ + CH₃CH₂Br', n: 'but-1-yne',
        draw: (cx, cy) => joinRow(cx, cy, 'HC≡C', 'CH₂CH₃') },
      { t: 'cyanide + alkyl halide', r: 'CH₃CH₂Br + NaCN', n: 'propanenitrile',
        draw: (cx, cy) => joinRow(cx, cy, 'CH₃CH₂', 'C≡N') },
      { t: 'aldol', r: '2 × acetaldehyde, NaOH', n: '3-hydroxybutanal',
        draw: (cx, cy) => joinRow(cx, cy, 'CH₃CH(OH)', 'CH₂CHO') },
      { t: 'Claisen', r: '2 × ethyl acetate, NaOEt', n: 'ethyl acetoacetate',
        draw: (cx, cy) => joinRow(cx, cy, 'CH₃CO', 'CH₂CO₂Et') },
      { t: 'Michael (conjugate) addition', r: 'malonate enolate + but-3-en-2-one', n: 'a 1,5-keto-ester',
        draw: (cx, cy) => joinRow(cx, cy, '(EtO₂C)₂CH', 'CH₂CH₂COCH₃') },
      { t: 'Diels–Alder', r: 'butadiene + ethene, the simplest case', n: 'cyclohexene, two bonds at once',
        draw(cx, cy) {
          /* Ring carbons, clockwise from the top: the diene supplied the four
             at the top and left, the dienophile the two on the lower right,
             so the new sigma bonds are the two edges where they meet and the
             new pi bond is the middle of what was the diene. */
          const { g } = ring(cx, cy, 25, { dblEdges: [5], hiEdges: [1, 3] });
          return g;
        } },
      { t: 'Friedel–Crafts acylation', r: 'benzene + CH₃COCl / AlCl₃', n: 'acetophenone',
        draw(cx, cy) {
          const { g, v } = ring(cx - 45, cy, 20, { aromatic: true });
          return g
            + bond(v[1], P(cx + 8, cy - 16), { rFrom: 0, rTo: 26, cls: 'fg-bond-hi' })
            + atom(cx + 8, cy - 16, 'COCH₃', { kind: 'hi', r: 26 });
        } },
      { t: 'Wittig', r: 'cyclohexanone + Ph₃P=CH₂', n: 'methylenecyclohexane',
        draw(cx, cy) {
          const { g, v } = ring(cx - 40, cy, 20);
          return g
            + bond(v[1], P(cx + 8, cy - 16), { rFrom: 0, rTo: 17, cls: 'fg-bond-hi', order: 2, gap: 3.5 })
            + atom(cx + 8, cy - 16, 'CH₂', { kind: 'hi', r: 17 });
        } },
    ];

    panels.forEach((pn, i) => {
      const x = cols[i % 2], y = rows[Math.floor(i / 2)];
      const cx = x + PW / 2;
      s += panel(x, y, PW, PH);
      s += tag(cx, y + 20, pn.t);
      s += text(cx, y + 38, pn.r, { cls: 'fg-sm' });
      s += pn.draw(cx, y + 84);
      s += text(cx, y + 130, pn.n, { cls: 'fg-tag-good' });
    });
    return s;
  },
  caption: 'Each of the ten, once, with the bond it makes picked out. The table says what joins to what; this says what it looks like when it has.',
  note: 'Reading down the colored marks is the fastest way to internalize the list. Four attach the new carbon straight <b>onto</b> a carbonyl carbon, or onto the carbon that was one &mdash; the Grignard onto a ketone, the Grignard onto CO&#8322;, Friedel&ndash;Crafts acylation and the Wittig. Two run from an &alpha; carbon onto a carbonyl carbon at the other end, the aldol and the Claisen, and the Michael is the enolate that does not: it lands on the &beta; carbon, two carbons out from the enone&rsquo;s C=O. The remaining three &mdash; Diels&ndash;Alder, acetylide alkylation and cyanide alkylation &mdash; build a skeleton with no carbonyl in sight, the nitrile only becoming one if you hydrolyse it afterwards. The Diels&ndash;Alder panel is the only one with two colored bonds, which is the whole reason it is the highest-value move in the list.',
});

export default FIGURES;
