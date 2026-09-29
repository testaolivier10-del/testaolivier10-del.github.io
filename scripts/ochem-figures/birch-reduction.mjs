/* Figures for the birch-reduction notes page (and its lesson). Built by
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

/* ----------------------------------------------------------------- 46 ---
   The substituent rule inverts, and students memorize it as two unrelated
   rows. Drawing the carbanion in each case shows it is one question. */
FIGURES.push({
  id: 'birch-where-charge',
  section: 'birch-reduction',
  anchor: '<h3>Why you would want a 1,4-cyclohexadiene</h3>',
  viewBox: '0 0 760 330',
  alt: 'A donating group pushing the Birch carbanion away from its own carbon and a withdrawing group holding it there, giving opposite diene products',
  build() {
    let s = '';
    const col = (ox, title, sub, charge, verdict, product, kind) => {
      s += panel(ox, 48, 320, 150, { kind });
      s += tag(ox + 160, 36, title);
      s += text(ox + 160, 82, sub, { cls: 'fg-lbl', size: 13 });
      s += text(ox + 160, 112, charge, { cls: 'fg-sm', size: 10.5 });
      s += text(ox + 160, 146, verdict, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11 });
      s += text(ox + 160, 176, product, { cls: 'fg-sm', size: 10.5 });
    };
    col(24,  'donating — OCH₃, CH₃', 'pushes electrons in',
        'so the carbanion goes ELSEWHERE', 'that carbon is never protonated',
        'it stays on a double bond — the 1,4-diene', null);
    col(416, 'withdrawing — COOH, COR', 'pulls electrons out',
        'so the carbanion sits THERE', 'that carbon takes the proton',
        'it comes out sp³ — the 2,5-diene', 'warn');

    s += rule(24, 224, 700, 224);
    s += text(360, 250, 'One question, asked of the intermediate rather than the starting material:', { cls: 'fg-lbl', size: 12 });
    s += text(360, 272, 'where does the carbanion want to be? That carbon gets the proton, and ends up saturated.', { cls: 'fg-lbl', size: 12 });
    s += text(360, 306, 'Neither row has to be memorized once you ask it that way.', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Why the two substituent rules for a Birch reduction are one rule. The reaction alternates electrons and protons, and the carbon that gets the second proton is the one that ends up sp³ — so everything depends on where the carbanion is most stable.',
  note: 'The product is the <b>unconjugated</b> diene in both cases, which is the less stable of the two and the sign that this is kinetic control: protonation happens fastest at the central carbon of the delocalized anion, and stability never gets a vote. The same alternation of electron and proton runs the Na/NH₃ reduction of an alkyne to a <i>trans</i> alkene, back in the alkynes and hydrogenation chapters.',
});

/* Where the sp3 carbons end up is the entire examinable content, and the
   section's only figure was two labelled rectangles. */
FIGURES.push({
  id: 'birch-products',
  section: 'birch-reduction',
  anchor: '<td>1-substituted cyclohexa-2,5-diene</td></tr>\n</tbody>\n</table>\n</div>',
  alt: 'Top row: benzene, then the radical anion, then the cyclohexadienyl anion with one sp3 CH2 and partial negative marks on three carbons, then 1,4-cyclohexadiene with both CH2 groups drawn and labeled C1 and C4. Bottom row: anisole giving 1-methoxycyclohexa-1,4-diene with the methoxy-bearing carbon still on a double bond, and benzoic acid giving cyclohexa-2,5-diene-1-carboxylic acid with the carboxyl-bearing carbon drawn sp3 with its hydrogen.',
  viewBox: '0 0 760 490',
  build() {
    const R = 34, K = hexKit(R);
    let s = '';
    s += tag(380, 26, 'TWO ELECTRONS, TWO PROTONS, AND WHERE THEY LAND');
    const CY = 122;

    /* 1: benzene. */
    s += K.ring(100, CY, [0, 2, 4]);
    s += text(100, 190, 'benzene', { cls: 'fg-tag', size: 10.5 });

    /* 2: the radical anion. */
    s += K.ring(292, CY, [0, 2, 4]);
    s += text(292 + 48, CY - 30, '•−', { cls: 'fg-warn', size: 15 });
    s += text(292, 190, 'radical anion', { cls: 'fg-tag', size: 10.5 });
    s += arrow(P(146, CY), P(246, CY));
    s += text(196, CY - 12, 'e⁻', { cls: 'fg-sm', size: 10.5 });

    /* 3: the cyclohexadienyl anion. */
    s += K.ring(484, CY, [1, 4]);
    s += atom(K.V(484, CY)[0].x, K.V(484, CY)[0].y, 'CH₂', { kind: 'hi', r: 18, size: 9.5 });
    s += K.mark(484, CY, 3, '−', { d: 18 });
    s += K.mark(484, CY, 1, 'δ−', { d: 20, size: 11, dy: 4 });
    s += K.mark(484, CY, 5, 'δ−', { d: 20, size: 11, dy: 4 });
    s += text(484, 190, 'charge on three carbons,', { cls: 'fg-tag', size: 10.5 });
    s += text(484, 206, 'protonated across the ring', { cls: 'fg-tag', size: 10.5 });
    s += arrow(P(338, CY), P(438, CY));
    s += text(388, CY - 12, 'ROH, e⁻', { cls: 'fg-sm', size: 10.5 });

    /* 4: the 1,4-diene. */
    s += K.ring(668, CY, [1, 4]);
    s += atom(K.V(668, CY)[0].x, K.V(668, CY)[0].y, 'CH₂', { kind: 'hi', r: 18, size: 9.5 });
    s += atom(K.V(668, CY)[3].x, K.V(668, CY)[3].y, 'CH₂', { kind: 'hi', r: 18, size: 9.5 });
    s += text(706, CY - 36, 'C1', { cls: 'fg-tag-good', size: 10.5 });
    s += text(706, CY + 44, 'C4', { cls: 'fg-tag-good', size: 10.5 });
    s += text(636, 190, '1,4, and para to each other', { cls: 'fg-tag', size: 10.5 });
    s += arrow(P(530, CY), P(614, CY));
    s += text(572, CY - 12, 'ROH', { cls: 'fg-sm', size: 10.5 });

    s += rule(24, 228, 736, 228);

    /* Bottom: the two substituent cases, drawn. */
    const CY2 = 330;
    s += K.ring(96, CY2, [0, 2, 4]);
    s += K.sub(96, CY2, 0, 'OCH₃', { kind: 'hi', r: 19, size: 9, d: 32 });
    s += arrow(P(146, CY2), P(216, CY2));
    s += text(181, CY2 - 12, 'Na/NH₃', { cls: 'fg-sm', size: 10 });
    s += K.ring(286, CY2, [0, 3]);
    s += K.sub(286, CY2, 0, 'OCH₃', { kind: 'hi', r: 19, size: 9, d: 32 });
    s += atom(K.V(286, CY2)[2].x, K.V(286, CY2)[2].y, 'CH₂', { r: 18, size: 9.5 });
    s += atom(K.V(286, CY2)[5].x, K.V(286, CY2)[5].y, 'CH₂', { r: 18, size: 9.5 });
    s += text(190, 408, 'donor: its carbon stayed on a double bond', { cls: 'fg-tag', size: 10.5 });
    s += text(190, 426, '1-methoxycyclohexa-1,4-diene', { cls: 'fg-tag-good', size: 10.5 });

    s += K.ring(486, CY2, [0, 2, 4]);
    s += K.sub(486, CY2, 0, 'COOH', { kind: 'warn', r: 20, size: 8.5, d: 34 });
    s += arrow(P(536, CY2), P(606, CY2));
    s += text(571, CY2 - 12, 'Na/NH₃', { cls: 'fg-sm', size: 10 });
    s += K.ring(668, CY2, [1, 4]);
    s += K.sub(668, CY2, 0, 'COOH', { kind: 'warn', r: 20, size: 8.5, d: 34 });
    s += text(632, CY2 - 26, 'H', { cls: 'fg-tag-good', size: 11 });
    s += atom(K.V(668, CY2)[3].x, K.V(668, CY2)[3].y, 'CH₂', { r: 18, size: 9.5 });
    s += text(580, 408, 'acceptor: its carbon came out sp³', { cls: 'fg-tag', size: 10.5 });
    s += text(580, 426, 'cyclohexa-2,5-diene-1-carboxylic acid', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(24, 444, 736, 444);
    s += label(380, 472, 'Track the sp³ carbons: they took the protons, and they come out para.');
    return s;
  },
  caption: 'The same reduction on three substrates. Track the sp&sup3; carbons &mdash; they are the ones that took protons, they always come out para to each other, and which ones they are is decided entirely by whether the substituent wanted the carbanion nearby.',
  note: 'The third frame of the top row is the one to stare at. Three of the five delocalized carbons carry charge, in roughly equal shares, and protonating the middle one of the three is what makes the product 1,4 rather than 1,3. Every regiochemical statement in this section is that one picture.',
});

export default FIGURES;
