/* Figures for the diazonium-chemistry notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

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

const FIGURES = [];

/* ----------------------------------------------------------------- 47 ---
   The point of the section is that one intermediate reaches many products,
   several of which nothing else can. A hub is a picture, not a list. */
FIGURES.push({
  id: 'diazonium-hub-map',
  section: 'diazonium-chemistry',
  anchor: '<h3>Removing a group is a synthetic tool</h3>',
  viewBox: '0 0 760 340',
  alt: 'An aryl diazonium salt at the center with seven reagents radiating out to the chloride, bromide, nitrile, iodide, fluoride, phenol and arene',
  build() {
    let s = '';
    s += panel(286, 142, 190, 56, { kind: 'hi' });
    s += text(381, 168, 'Ar–N₂⁺', { cls: 'fg-lbl', size: 15 });
    s += text(381, 188, 'leaves as N₂ gas', { cls: 'fg-sm', size: 9.5 });

    const spoke = (x, y, reagent, product, anchorSide, novel) => {
      s += text(x, y, reagent, { cls: 'fg-tag', anchor: anchorSide, size: 10.5 });
      s += text(x, y + 17, product, { cls: novel ? 'fg-tag-good' : 'fg-lbl', anchor: anchorSide, size: 11.5 });
    };
    // Left column: the halides that EAS can also reach.
    spoke(246, 62,  'CuCl', 'Ar–Cl', 'end', false);
    spoke(246, 120, 'CuBr', 'Ar–Br', 'end', false);
    spoke(246, 236, 'KI',   'Ar–I',  'end', true);
    // Ar-H is the DELETION row. It is not a group EAS cannot install, so it
    // gets its own marker rather than sharing the "unreachable" one.
    // Right column: the ones it cannot.
    spoke(516, 62,  'CuCN',           'Ar–CN', 'start', true);
    spoke(516, 120, 'HBF₄, heat', 'Ar–F',  'start', true);
    spoke(516, 236, 'H₂O, warm',  'Ar–OH', 'start', true);
    spoke(516, 288, 'H₃PO₂', 'Ar–H',  'start', false);
    s += text(516, 306, 'deletes the substituent', { cls: 'fg-tag', anchor: 'start', size: 9.5 });

    s += arrow(P(282, 156), P(252, 104));
    s += arrow(P(282, 166), P(252, 140));
    s += arrow(P(282, 186), P(252, 224));
    s += arrow(P(480, 156), P(510, 104));
    s += arrow(P(480, 166), P(510, 140));
    s += arrow(P(480, 186), P(510, 224));
    s += arrow(P(480, 196), P(510, 276));

    s += text(170, 288, 'green = unreachable by', { cls: 'fg-tag-good', size: 10.5 });
    s += text(170, 304, 'electrophilic substitution', { cls: 'fg-sm', size: 10 });

    s += rule(24, 326, 700, 326);
    s += text(360, 338, 'Four reach groups no substitution can install. The fifth takes one away.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'One intermediate, seven products. The diazonium group leaves as nitrogen gas — stable, and a gas that escapes the solution — which is enough to make an aryl position substitutable when no aryl cation should be accessible at all.',
  note: 'The H₃PO₂ row looks like undoing your own work and is the most useful of the seven. An NH₂ group is a powerful ortho/para director, so it can be installed purely to <b>steer</b> the next substitution and then deleted — which is how 1,3,5-tribromobenzene gets made, since bromine itself directs ortho and para and can never reach that pattern. That is a protecting group in aromatic clothes.',
});

/* A section whose one figure was a text hub map, in a chapter where the
   diazonium is both made and used and neither was drawn. */
FIGURES.push({
  id: 'diazotize-and-couple',
  section: 'diazonium-chemistry',
  anchor: 'giving an <b>azo compound</b>, Ar&ndash;N=N&ndash;Ar&prime;.</p>',
  alt: 'Top row: aniline with its nitrogen lone pair and a curved arrow to the nitrosonium ion, then the N-nitrosoamine, then the aryl diazonium ion drawn with the triple bond to nitrogen and the positive charge, all at zero to five degrees. Bottom row: a phenoxide attacking the terminal nitrogen of the diazonium salt through its para carbon, the neutral arenium-type intermediate with the sp3 para carbon and its hydrogen, and the azo product drawn as two rings joined by a nitrogen-nitrogen double bond with a hydroxyl on the far ring.',
  viewBox: '0 0 760 650',
  build() {
    const R = 32, K = hexKit(R);
    let s = '';
    s += tag(380, 26, 'MADE FROM AN AMINE — AND THEN USED AS AN ELECTROPHILE');

    /* Row 1: diazotization. */
    const a = P(104, 150);
    s += K.ring(a.x, a.y, [0, 2, 4]);
    s += K.sub(a.x, a.y, 0, 'NH₂', { kind: 'hi', r: 17, size: 9.5, d: 32 });
    s += lonePair(104, 86, 270, { dist: 24 });
    s += text(236, 74, 'N≡O', { cls: 'fg-lbl', size: 13 });
    s += text(268, 64, '+', { cls: 'fg-warn', size: 13 });
    s += curve(P(118, 66), P(210, 70), { bow: -18 });
    s += text(104, 214, 'aniline + nitrosonium', { cls: 'fg-tag', size: 10.5 });

    s += arrow(P(258, 150), P(334, 150));
    s += text(296, 138, '0–5 °C', { cls: 'fg-sm', size: 10.5 });

    const b = P(410, 150);
    s += K.ring(b.x, b.y, [0, 2, 4]);
    s += bond(K.V(b.x, b.y)[0], P(410, 104), { rFrom: 0, rTo: 6 });
    s += text(410, 92, 'N(H)–N=O', { cls: 'fg-lbl', size: 12 });
    s += text(410, 214, 'the N-nitrosoamine', { cls: 'fg-tag', size: 10.5 });

    s += arrow(P(492, 150), P(560, 150));
    s += text(526, 138, 'H⁺, –H₂O', { cls: 'fg-sm', size: 10.5 });

    const c = P(644, 150);
    s += K.ring(c.x, c.y, [0, 2, 4]);
    s += bond(K.V(c.x, c.y)[0], P(644, 104), { rFrom: 0, rTo: 6 });
    s += text(644, 92, 'N≡N', { cls: 'fg-lbl', size: 13 });
    s += text(676, 82, '+', { cls: 'fg-warn', size: 13 });
    s += text(644, 214, 'the diazonium ion', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(24, 238, 736, 238);

    /* Row 2: azo coupling as an ordinary EAS. */
    const CY = 336;
    const d = P(78, CY);
    s += K.ring(d.x, d.y, [0, 2, 4]);
    s += bond(K.V(d.x, d.y)[0], P(78, CY - 46), { rFrom: 0, rTo: 6 });
    s += text(78, CY - 58, 'N≡N', { cls: 'fg-lbl', size: 12.5 });
    s += text(108, CY - 68, '+', { cls: 'fg-warn', size: 12 });

    const e = P(246, CY);
    s += K.ring(e.x, e.y, [0, 2, 4]);
    s += K.sub(e.x, e.y, 0, 'O', { kind: 'hi', r: 15, d: 30 });
    s += text(270, CY - 54, '−', { cls: 'fg-warn', size: 14 });
    s += K.mark(e.x, e.y, 3, 'δ−', { d: 21, size: 11, dy: 4 });
    s += curve(P(238, CY + 44), P(100, CY - 40), { bow: 44 });
    s += text(162, CY + 92, 'pH 8–10: the phenoxide is the nucleophile', { cls: 'fg-tag', size: 10.5 });
    s += text(162, CY + 108, 'and its para carbon is where the charge is', { cls: 'fg-tag', size: 10.5 });

    s += arrow(P(324, CY), P(398, CY));

    const f = P(480, CY);
    s += K.ring(f.x, f.y, [1, 4]);
    {
      const v = K.V(f.x, f.y);
      const O = K.out(f.x, f.y, 0, 30);
      s += bond(v[0], O, { rFrom: 0, rTo: 15, order: 2, gap: 3.4 });
      s += atom(O.x, O.y, 'O', { kind: 'hi' });
      s += atom(v[3].x, v[3].y, 'C', { kind: 'warn', r: 15 });
      s += text(444, CY + 48, 'H', { cls: 'fg-tag-good', size: 11 });
      s += bond(v[3], P(524, CY + 56), { rFrom: 15, rTo: 8 });
      s += text(534, CY + 62, 'N=N–Ar', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    }
    s += text(480, CY + 92, 'the same arenium ion as any other EAS — drawn', { cls: 'fg-tag', size: 10.5 });
    s += text(480, CY + 108, 'from the phenoxide, so it comes out neutral', { cls: 'fg-tag', size: 10.5 });

    s += rule(24, 476, 736, 476);

    /* Row 3: the dye. */
    const R2 = 26, K2 = hexKit(R2);
    const PY = 548;
    s += text(150, PY - 14, 'lose the para H,', { cls: 'fg-sm', size: 10.5 });
    s += arrow(P(118, PY + 4), P(186, PY + 4));
    s += text(150, PY + 26, 'rearomatize', { cls: 'fg-sm', size: 10.5 });
    s += K2.ring(268, PY, [0, 2, 4]);
    s += text(330, PY + 4, 'N=N', { cls: 'fg-lbl', size: 12 });
    s += bond(K2.V(268, PY)[1], P(306, PY + 4), { rFrom: 0, rTo: 12 });
    s += K2.ring(414, PY, [0, 2, 4]);
    s += bond(K2.V(414, PY)[4], P(354, PY + 4), { rFrom: 0, rTo: 12 });
    s += K2.sub(414, PY, 1, 'OH', { kind: 'hi', r: 15, size: 10.5, d: 26 });
    s += text(520, PY + 4, '4-(phenylazo)phenol — orange', { cls: 'fg-tag-good', size: 11, anchor: 'start' });

    s += rule(24, 600, 736, 600);
    s += label(380, 626, 'The bottom half is not a new mechanism: it is EAS with Ar–N₂⁺ as the electrophile.');
    return s;
  },
  caption: 'The two things a diazonium salt does, drawn. On the way in it is made from an amine and nitrosonium at 0&ndash;5 &deg;C; on the way out, if the other partner is activated enough, it is itself the electrophile of an ordinary electrophilic aromatic substitution &mdash; arenium ion and all.',
  note: 'What makes the bottom row possible is that the ring being attacked is a <b>phenoxide</b>: the δ&minus; marked on its para carbon is exactly the delocalization the phenols section drew. Run the same coupling below pH 8 and there is no phenoxide; run it above pH 10 and the diazonium ion is converted to an unreactive diazotate. Both ends of that window are examined.',
});

export default FIGURES;
