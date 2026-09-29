/* Figures for the hofmann-elimination notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* Shared drawing helpers, copied from the builder. */
/* A Newman projection. Angles are degrees clockwise from straight up, which
   is how a student reads a dihedral off the page. */
function newman(cx, cy, r, front, back, opts = {}) {
  const at = (a, R) => P(cx + R * Math.sin(a * Math.PI / 180), cy - R * Math.cos(a * Math.PI / 180));
  let s = '';
  // back spokes first, so the front circle and dot sit on top of them
  for (const [a, lab] of back) {
    const p1 = at(a, r), p2 = at(a, r + 21), p3 = at(a, r + 34);
    s += `<line class="fg-bond-soft" x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}"></line>`;
    s += text(p3.x, p3.y + 3.5, lab, { cls: 'fg-lbl', size: lab.length > 1 ? 9.5 : 11 });
  }
  s += `<circle class="fg-atom" cx="${cx}" cy="${cy}" r="${r}"></circle>`;
  for (const [a, lab] of front) {
    const p2 = at(a, r), p3 = at(a, r + 13);
    s += `<line class="fg-bond" x1="${cx}" y1="${cy}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}"></line>`;
    s += text(p3.x, p3.y + 3.5, lab, { cls: 'fg-lbl', size: lab.length > 1 ? 9.5 : 11 });
  }
  s += `<circle class="fg-lp-mut" cx="${cx}" cy="${cy}" r="4.5"></circle>`;
  return s;
}

const FIGURES = [];

/* ----------------------------------------------------------------- 60 ---
   Two beta carbons, two alkenes, and the bulk of the leaving group choosing
   between them. Drawing the ammonium group oversized is the point of the
   figure: the steric argument is visible or it is just an assertion. */
FIGURES.push({
  id: 'hofmann-picks-the-open-side',
  section: 'hofmann-elimination',
  anchor: '<h3>Worked example: 2-aminobutane</h3>',
  viewBox: '0 0 760 300',
  alt: 'A sec-butyltrimethylammonium salt with its two beta carbons labeled, and the less substituted alkene marked as the major product',
  build() {
    let s = '';
    const c1 = P(140, 120), c2 = P(220, 150), c3 = P(300, 120), c4 = P(380, 150);
    [c1, c2, c3, c4].forEach((c, i) => s += atom(c.x, c.y, 'C', { kind: i === 1 ? 'hi' : undefined }));
    s += bond(c1, c2); s += bond(c2, c3); s += bond(c3, c4);
    s += atom(220, 88, 'N\u207a(CH\u2083)\u2083', { kind: 'warn' });
    s += bond(c2, P(220, 96));
    s += text(220, 62, 'very bulky', { cls: 'fg-tag', size: 11 });

    s += text(140, 152, 'C1 \u00b7 CH\u2083 \u00b7 3 H', { cls: 'fg-tag-good', size: 11 });
    s += text(140, 168, 'open', { cls: 'fg-sm', size: 10 });
    s += text(300, 96, 'C3 \u00b7 CH\u2082 \u00b7 2 H', { cls: 'fg-tag', size: 11 });
    s += text(300, 80, 'more substituted \u2014 carries C4', { cls: 'fg-sm', size: 10 });

    s += rule(24, 196, 700, 196);
    s += text(24, 222, 'H from C1  \u2192  but-1-ene, monosubstituted  \u2014  MAJOR', { cls: 'fg-tag-good', size: 12, anchor: 'start' });
    s += text(24, 244, 'H from C3  \u2192  but-2-ene, disubstituted and more stable  \u2014  minor', { cls: 'fg-tag', size: 12, anchor: 'start' });
    s += text(24, 272, 'Four carbons either way. Trimethylamine leaves alongside.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 294, 'The more stable alkene loses, because the base cannot reach the hydrogen that makes it.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    return s;
  },
  caption: 'Zaitsev would pick but-2-ene and this reaction does not, which is the whole point of drawing the ammonium group oversized. Hydroxide takes the hydrogen it can reach rather than the one that gives the better alkene, exactly as tert-butoxide does in the E2 chapter \u2014 only here the bulk is on the leaving group instead of the base.',
  note: 'Read the drawing as a question about reach rather than about stability. Hydroxide has to arrive at a β hydrogen, and the oversized group on C2 is what decides which of them it can get to — which is why the more stable alkene loses here, and would win if a small halide sat in the same position.',
});

/* ---------------------------------------------------------------- 197 ---
   "One step, anti-periplanar" was a sentence in a section whose only figure
   is a flat regiochemistry comparison. Anti-periplanarity is a 3-D claim. */
FIGURES.push({
  id: 'hofmann-e2-newman',
  section: 'hofmann-elimination',
  anchor: 'exactly as in the substitution and elimination chapter.</p>',
  viewBox: '0 0 760 410',
  alt: 'The E2 arrows of a Hofmann elimination on the left and a Newman projection showing the beta hydrogen anti-periplanar to the trimethylammonium group on the right',
  build() {
    let s = '';
    /* LEFT - the arrows */
    s += tag(40, 40, 'THE ARROWS', { anchor: 'start' });
    const c1 = P(90, 176), c2 = P(150, 146), c3 = P(210, 176), c4 = P(270, 146);
    s += bond(c1, c2, { rFrom: 0, rTo: 0 }); s += bond(c2, c3, { rFrom: 0, rTo: 0 }); s += bond(c3, c4, { rFrom: 0, rTo: 0 });
    s += bond(c2, P(150, 92), { rFrom: 0, rTo: 18 });
    s += atom(150, 92, 'N⁺(CH₃)₃', { kind: 'warn', r: 18 });
    s += bond(c1, P(72, 222), { rFrom: 0, rTo: 10 });
    s += atom(72, 222, 'H', { r: 10 });
    s += text(42, 276, 'HO⁻', { cls: 'fg-lbl', size: 12.5 });
    s += lonePair(42, 272, 0, { dist: 22 });
    s += curve(P(66, 266), P(70, 238), { bow: 14 });
    s += curve(P(84, 210), P(116, 168), { bow: 16 });
    s += curve(P(150, 118), P(150, 100), { bow: 12 });
    s += text(228, 214, 'all at once', { cls: 'fg-tag-warn', size: 11 });
    s += arrow(P(90, 292), P(150, 292));
    s += bond(P(196, 306), P(244, 280), { order: 2, rFrom: 0, rTo: 0 });
    s += bond(P(244, 280), P(292, 306), { rFrom: 0, rTo: 0 });
    s += bond(P(292, 306), P(340, 280), { rFrom: 0, rTo: 0 });
    s += text(268, 340, 'but-1-ene', { cls: 'fg-tag-good', size: 11 });
    s += text(268, 362, '+ H₂O + N(CH₃)₃ — leaves NEUTRAL,', { cls: 'fg-sm', size: 10 });
    s += text(268, 378, 'which is the whole trick', { cls: 'fg-sm', size: 10 });

    s += rule(392, 30, 392, 390);

    /* RIGHT - the Newman projection */
    s += tag(436, 40, 'THE GEOMETRY', { anchor: 'start' });
    const cx = 570, cy = 200, R = 58;
    s += atom(cx, cy, '', { r: R });
    // front carbon bonds: up, and two below
    s += bond(P(cx, cy), P(cx, cy - R), { rFrom: 0, rTo: 0 });
    s += bond(P(cx, cy), P(cx + R * 0.87, cy + R * 0.5), { rFrom: 0, rTo: 0 });
    s += bond(P(cx, cy), P(cx - R * 0.87, cy + R * 0.5), { rFrom: 0, rTo: 0 });
    s += atom(cx, cy - R - 20, 'H', { kind: 'hi', r: 13 });
    s += atom(cx + R * 0.87 + 26, cy + R * 0.5 + 16, 'H', { r: 12 });
    s += atom(cx - R * 0.87 - 26, cy + R * 0.5 + 16, 'H', { r: 12 });
    // back carbon bonds: down, and two above, drawn from the rim outward
    s += bond(P(cx, cy + R), P(cx, cy + R + 22), { rFrom: 0, rTo: 0 });
    s += bond(P(cx + R * 0.87, cy - R * 0.5), P(cx + R * 0.87 + 20, cy - R * 0.5 - 12), { rFrom: 0, rTo: 0 });
    s += bond(P(cx - R * 0.87, cy - R * 0.5), P(cx - R * 0.87 - 20, cy - R * 0.5 - 12), { rFrom: 0, rTo: 0 });
    s += atom(cx, cy + R + 40, 'N⁺(CH₃)₃', { kind: 'warn', r: 18 });
    s += atom(cx + R * 0.87 + 34, cy - R * 0.5 - 22, 'Et', { r: 14 });
    s += atom(cx - R * 0.87 - 34, cy - R * 0.5 - 22, 'H', { r: 12 });
    s += rule(cx, cy - R - 6, cx, cy + R + 20);
    s += text(cx + 96, cy - 6, 'anti-', { cls: 'fg-tag-warn', size: 11 });
    s += text(cx + 96, cy + 10, 'periplanar,', { cls: 'fg-tag-warn', size: 11 });
    s += text(cx + 96, cy + 26, '180°', { cls: 'fg-tag-warn', size: 11 });
    s += text(cx, 334, 'The C–H that breaks and the C–N that breaks', { cls: 'fg-sm', size: 10.5 });
    s += text(cx, 352, 'have to lie in one plane pointing opposite ways,', { cls: 'fg-sm', size: 10.5 });
    s += text(cx, 370, 'so their orbitals can overlap into the new pi bond.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The mechanism is an ordinary E2 and the geometry is the ordinary E2 geometry &mdash; nothing about a Hofmann elimination changes either. What is unusual is only the leaving group: a positively charged nitrogen that departs neutral, and a bulky one, which is what decides which β hydrogen hydroxide can reach.',
  note: 'Both bonds break in the same transition state, so both have to be lined up before anything happens. In an open chain that costs nothing &mdash; rotate about the C–C bond until they are anti and eliminate &mdash; but in a ring that cannot rotate, the available anti-periplanar hydrogen decides the product outright, which is the case the substitution and elimination chapter worked through.',
});

/* ---------------------------------------------------------------- 198 ---
   The cyclic case is the one that carried the structural information, and it
   was argued in words only. */
FIGURES.push({
  id: 'cyclic-amine-degradation',
  section: 'hofmann-elimination',
  anchor: 'a conclusion drawn from bottles and a balance.</p>',
  viewBox: '0 0 760 370',
  alt: 'Piperidine methylated twice, opened by a first Hofmann elimination to a dimethylamino pentene, then methylated and eliminated again to give penta-1,4-diene and trimethylamine',
  build() {
    let s = '';
    const ring = (cx, cy, nLabel, nKind) => {
      let g = '';
      const r = 40, pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        const rf = i === 0 ? 16 : 0, rt = j === 0 ? 16 : 0;
        g += bond(pts[i], pts[j], { rFrom: rf, rTo: rt });
      }
      g += atom(pts[0].x, pts[0].y, nLabel, { kind: nKind });
      return pts;
    };

    let pts = null;
    const draw = (cx, cy, nLabel, nKind) => {
      const r = 40, p = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        p.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      let g = '';
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        g += bond(p[i], p[j], { rFrom: i === 0 ? 16 : 0, rTo: j === 0 ? 16 : 0 });
      }
      g += atom(p[0].x, p[0].y, nLabel, { kind: nKind });
      return { g, p };
    };

    let d = draw(110, 130, 'NH', 'hi');
    s += d.g;
    s += text(110, 206, 'piperidine', { cls: 'fg-lbl', size: 12.5 });

    s += text(248, 100, '2 CH₃I, K₂CO₃', { cls: 'fg-tag', size: 11 });
    s += arrow(P(196, 130), P(300, 130));

    d = draw(400, 130, 'N', 'warn');
    s += d.g;
    s += bond(d.p[0], P(360, 62), { rFrom: 16, rTo: 16 });
    s += bond(d.p[0], P(440, 62), { rFrom: 16, rTo: 16 });
    s += atom(360, 62, 'CH₃'); s += atom(440, 62, 'CH₃');
    s += text(434, 108, '⊕', { cls: 'fg-warn', size: 13 });
    s += text(400, 206, 'the quaternary salt', { cls: 'fg-lbl', size: 12.5 });

    s += text(560, 100, 'Ag₂O, H₂O, Δ', { cls: 'fg-tag', size: 11 });
    s += arrow(P(500, 130), P(620, 130));
    s += text(690, 124, 'ring', { cls: 'fg-tag-warn', size: 11 });
    s += text(690, 140, 'opens', { cls: 'fg-tag-warn', size: 11 });

    s += rule(24, 232, 736, 232);

    /* the ring-opened amine */
    const a1 = P(50, 300), a2 = P(98, 274), a3 = P(146, 300), a4 = P(194, 274), a5 = P(242, 300);
    s += bond(a1, a2, { order: 2, rFrom: 0, rTo: 0 });
    s += bond(a2, a3, { rFrom: 0, rTo: 0 }); s += bond(a3, a4, { rFrom: 0, rTo: 0 });
    s += bond(a4, a5, { rFrom: 0, rTo: 0 });
    s += bond(a5, P(292, 274), { rFrom: 0, rTo: 20 });
    s += atom(292, 274, 'N(CH₃)₂', { kind: 'hi', r: 20 });
    s += text(170, 342, 'still attached — only ONE of the two C–N bonds broke', { cls: 'fg-sm', size: 10.5 });

    s += text(420, 262, 'CH₃I, then Ag₂O/Δ', { cls: 'fg-tag', size: 11 });
    s += arrow(P(360, 286), P(474, 286));

    const b1 = P(520, 300), b2 = P(566, 274), b3 = P(612, 300), b4 = P(658, 274), b5 = P(704, 300);
    s += bond(b1, b2, { order: 2, rFrom: 0, rTo: 0 });
    s += bond(b2, b3, { rFrom: 0, rTo: 0 }); s += bond(b3, b4, { rFrom: 0, rTo: 0 });
    s += bond(b4, b5, { order: 2, rFrom: 0, rTo: 0 });
    s += text(586, 342, 'penta-1,4-diene + N(CH₃)₃ — nitrogen finally free', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Two rounds, not one &mdash; and that was the evidence. A nitrogen held by two C&ndash;N bonds is still attached to the chain after the first elimination has opened the ring; only a second methylation and elimination cuts it loose.',
  note: 'This is what made the degradation worth its cost. The number of <i>rounds</i> reports the connectivity while the number of CH₃I equivalents reports the class, and the two are independent measurements on the same unknown. An alkaloid chemist reading &ldquo;two rounds&rdquo; concluded &ldquo;the nitrogen was in a ring&rdquo; without ever seeing the molecule.',
});

export default FIGURES;
