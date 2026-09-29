/* Figures for the multistep-synthesis notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

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

/* ----------------------------------------------------------------- D10 ---
   The section's worked routes are prose, and its only figure draws an
   ordering CONTRAST rather than a route. A four-step route with the carbon
   count written along the top is the picture the chapter's "count carbons,
   find the C-C steps" advice has been asking for throughout. */
FIGURES.push({
  id: 'four-step-route',
  section: 'multistep-synthesis',
  anchor: 'Every change in that number is a C–C step, and there are only two of them — the cyanide in step 2 and the double methylation in step 4. The other two steps are bookkeeping.</p>',
  alt: 'A four-step route from butan-1-ol to 2-methylhexan-2-ol with the carbon count written above each intermediate',
  /* 660 wide rather than the usual 700: this figure sits inside a worked
     example, whose column is narrower than the page's, and at 700 the
     product's OH was the part that scrolled off the right edge. */
  viewBox: '0 0 660 270',
  build() {
    let s = '';
    s += tag(330, 30, 'butan-1-ol to 2-methylhexan-2-ol, each step tagged by the kind of move it is');

    const Y = 150;
    const step = (x1, x2, reagent, kind, good) => {
      s += arrow(P(x1, Y), P(x2, Y));
      s += text((x1 + x2) / 2, 128, reagent, { cls: 'fg-sm' });
      s += text((x1 + x2) / 2, 180, kind, { cls: good ? 'fg-tag-good' : 'fg-tag-mut' });
    };

    s += atom(44, Y, 'C₄H₉OH', { r: 34 });
    step(82, 126, 'PBr₃', 'sideways', false);
    s += atom(158, Y, 'C₄H₉Br', { r: 30 });
    step(192, 236, 'NaCN', 'C–C bond', true);

    // Pentanenitrile, with the bond cyanide has just made picked out.
    s += bond(P(262, Y), P(308, Y), { rFrom: 22, rTo: 18, cls: 'fg-bond-hi' });
    s += atom(262, Y, 'C₄H₉', { r: 22 });
    s += atom(308, Y, 'C≡N', { r: 18 });
    step(330, 374, 'H₃O⁺; SOCl₂', 'sideways', false);

    s += bond(P(398, Y), P(444, Y), { rFrom: 22, rTo: 22 });
    s += atom(398, Y, 'C₄H₉', { r: 22 });
    s += atom(444, Y, 'COCl', { r: 22 });
    step(470, 514, '2 CH₃MgBr', 'C–C bond × 2', true);

    // The product: both new methyls colored, because the double addition is
    // the reaction being used rather than the accident being avoided.
    s += bond(P(540, Y), P(584, Y), { rFrom: 22, rTo: 14 });
    s += bond(P(584, Y), P(584, 110), { rFrom: 14, rTo: 17, cls: 'fg-bond-hi' });
    s += bond(P(584, Y), P(584, 190), { rFrom: 14, rTo: 17, cls: 'fg-bond-hi' });
    s += bond(P(584, Y), P(626, Y), { rFrom: 14, rTo: 15 });
    s += atom(540, Y, 'C₄H₉', { r: 22 });
    s += atom(584, Y, 'C', { r: 14 });
    s += atom(584, 110, 'CH₃', { kind: 'hi', r: 17 });
    s += atom(584, 190, 'CH₃', { kind: 'hi', r: 17 });
    s += atom(626, Y, 'OH', { r: 15 });

    for (const [x, c] of [[44, '4 C'], [158, '4 C'], [284, '5 C'], [420, '5 C'], [584, '7 C']]) s += tag(x, 74, c);
    for (const [x, nm] of [[44, 'butan-1-ol'], [158, '1-bromobutane'], [284, 'pentanenitrile'],
      [420, 'pentanoyl chloride'], [580, '2-methylhexan-2-ol']]) s += text(x, 224, nm, { cls: 'fg-sm' });

    s += text(330, 254, 'Two of the four steps make a C–C bond. The other two only move groups.', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'A four-step route with every step tagged by what kind of move it is. Two of the four make carbon–carbon bonds; the other two only shift functional groups around, which is the usual ratio.',
  note: 'Follow the carbon count along the top: 4, 4, 5, 5, 7. Every change in that number is a C&ndash;C step and there are only two of them &mdash; the rest of the route is bookkeeping, exactly as the chapter has claimed throughout. The last step is also the answer to "where is the protecting group?": there is none, because the only O&ndash;H in the route is created <i>by</i> the Grignard, after it has finished its job.',
});

export default FIGURES;
