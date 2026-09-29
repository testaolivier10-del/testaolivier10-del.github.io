/* Figures for the retrosynthesis notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* Shared drawing helpers, copied from the builder. */
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

const FIGURES = [];

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

/* ------------------------------------------------------------------ D6 ---
   The notational act itself. The section's other figure shows the OUTCOME of
   three cuts as text panels; a reader who has never drawn a disconnection has
   still never seen the squiggle, the open arrow and the charges that say
   which synthon attacks. Every textbook draws this before anything else. */
FIGURES.push({
  id: 'disconnection-notation',
  section: 'retrosynthesis',
  anchor: 'A disconnection that looks fine on paper and gives a mixture in the flask is still a wrong answer.</div>',
  alt: 'A beta-hydroxy ketone with a squiggly line through one carbon-carbon bond, an open retrosynthetic arrow, and the two synthons it gives',
  viewBox: '0 0 700 300',
  build() {
    let s = '';
    s += tag(350, 26, 'one disconnection, written the way it is written');

    /* 4-hydroxy-4-methylpentan-2-one, skeletal. Unlabeled vertices are
       carbons; only the two heteroatom labels are drawn. */
    const v1 = P(60, 175), v2 = P(95, 152), v3 = P(130, 175), v4 = P(165, 152);
    s += bond(v1, v2, { rFrom: 0, rTo: 0 });
    s += bond(v2, P(95, 108), { rFrom: 0, rTo: 15, order: 2 });
    s += bond(v2, v3, { rFrom: 0, rTo: 0 });
    s += bond(v3, v4, { rFrom: 0, rTo: 0 });
    s += bond(v4, P(165, 108), { rFrom: 0, rTo: 15 });
    s += bond(v4, P(202, 130), { rFrom: 0, rTo: 0 });
    s += bond(v4, P(202, 174), { rFrom: 0, rTo: 0 });
    s += atom(95, 108, 'O');
    s += atom(165, 108, 'OH');

    /* The squiggle, across the bond between the alpha carbon and the carbinol
       carbon. Drawn as a wave along the perpendicular so it reads as a cut
       through that one bond rather than as a bond of its own. */
    const mx = (v3.x + v4.x) / 2, my = (v3.y + v4.y) / 2;
    const L = Math.hypot(v4.x - v3.x, v4.y - v3.y);
    const ux = (v4.x - v3.x) / L, uy = (v4.y - v3.y) / L;   // along the bond
    const px = -uy, py = ux;                                // across it
    let d = '';
    for (let i = 0; i <= 8; i++) {
      const t = -20 + i * 5;
      const off = i % 2 === 0 ? 0 : (i % 4 === 1 ? 5 : -5);
      const x = mx + px * t + ux * off, y = my + py * t + uy * off;
      d += (i === 0 ? 'M' : 'L') + `${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100} `;
    }
    s += `<path class="fg-dash-hi" fill="none" d="${d.trim()}"></path>`;
    s += tag(147, 216, 'disconnect here');

    /* The open arrow, drawn rather than typed. A text arrow renders at the
       stylesheet's 13px whatever font-size the drawing asks for, which is too
       small to read as the notation it is. */
    s += `<line class="fg-arrow" x1="236" y1="148" x2="278" y2="148"></line>`;
    s += `<line class="fg-arrow" x1="236" y1="156" x2="278" y2="156"></line>`;
    s += `<path class="fg-head" d="M294 152 L276 143 L276 161 Z"></path>`;
    s += tag(262, 130, 'aldol');

    /* The two synthons. Both are acetone; only the charge drawn on them
       differs, which is the whole reason this example is worth drawing. */
    const acetone = (ax, cy) => {
      const a1 = P(ax, cy + 22), a2 = P(ax + 30, cy), a3 = P(ax + 60, cy + 22);
      let g = bond(a1, a2, { rFrom: 0, rTo: 0 });
      g += bond(a2, P(ax + 30, cy - 40), { rFrom: 0, rTo: 15, order: 2 });
      g += bond(a2, a3, { rFrom: 0, rTo: 0 });
      g += atom(ax + 30, cy - 40, 'O');
      return g;
    };
    s += panel(318, 76, 180, 150);
    s += tag(408, 98, 'synthon: enolate');
    s += acetone(370, 170);
    s += text(446, 186, '⁻', { cls: 'fg-lbl' });
    s += text(408, 214, 'nucleophilic α carbon', { cls: 'fg-sm' });

    s += panel(508, 76, 180, 150);
    s += tag(598, 98, 'synthon: electrophile');
    s += acetone(560, 170);
    /* The delta+ marks the CARBONYL carbon at (590,170), not the methyl it
       used to sit beside: a leader line takes it there, because there is no
       clear space adjacent to that carbon between the C=O and the two
       methyls. */
    s += text(640, 148, 'δ+', { cls: 'fg-lbl' });
    s += rule(630, 152, 604, 166);
    s += text(598, 214, 'electrophilic C=O carbon', { cls: 'fg-sm' });

    s += text(350, 262, 'synthetic equivalents: acetone + NaOH   ·   acetone', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'One disconnection, drawn the way it is written: a squiggle through the bond, an open arrow, and two synthons carrying the charges that say which one attacks. Both equivalents are the same compound here, which is why the forward reaction is simply acetone with base.',
  note: 'The squiggle is worth drawing every time. It records <i>which</i> bond you cut, and a large share of wrong retrosynthetic answers are wrong because the bond that was cut is not the bond the named reaction makes. Note also what is <i>not</i> cut: the C&ndash;OH bond. Plenty of reactions make a C&ndash;O bond, but they are interconversions rather than ways of joining two pieces, and a disconnection is for bonds that assemble the skeleton.',
});

export default FIGURES;
