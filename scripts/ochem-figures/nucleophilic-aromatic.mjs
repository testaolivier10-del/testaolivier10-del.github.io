/* Figures for the nucleophilic-aromatic notes page (and its lesson). Built by
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

/* ----------------------------------------------------------------- 43 ---
   Two mechanisms students routinely merge, and the thing that separates
   them is the ORDER of the two steps. Drawn as two tracks running opposite
   ways, the contrast is structural rather than a table to memorize. */
FIGURES.push({
  id: 'snar-vs-benzyne',
  section: 'nucleophilic-aromatic',
  anchor: '<h3>Telling them apart</h3>',
  viewBox: '0 0 760 330',
  alt: 'The SNAr track adding then eliminating through a Meisenheimer complex against the benzyne track eliminating then adding to give two products',
  build() {
    let s = '';
    const track = (y, title, a, b, out, kind) => {
      s += text(24, y - 22, title, { cls: 'fg-tag', anchor: 'start', size: 11 });
      const boxes = [['Ar–X', null], [a, kind], [b, kind], [out, 'ok']];
      boxes.forEach((bx, i) => {
        const x = 24 + i * 176;
        s += panel(x, y, 150, 44, { kind: bx[1] === 'ok' ? null : bx[1] });
        s += text(x + 75, y + 27, bx[0], { cls: 'fg-lbl', size: 11.5 });
        if (i) s += arrow(P(x - 24, y + 22), P(x - 4, y + 22));
      });
    };
    track(58,  'SₙAr — needs an EWG ortho or para', 'add the nucleophile',
          'Meisenheimer anion', 'ONE product', 'hi');
    track(178, 'Benzyne — needs only an ortho H', 'eliminate HX',
          'strained benzyne', 'TWO products', 'warn');

    s += text(400, 122, 'add first, then eliminate', { cls: 'fg-tag-good', size: 10.5 });
    s += text(400, 242, 'eliminate first, then add', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(24, 268, 700, 268);
    s += text(360, 292, 'The two steps are the same two steps, run in opposite orders — and that is what', { cls: 'fg-lbl', size: 12 });
    s += text(360, 314, 'decides whether the nucleophile can land anywhere except where the halide was.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The two routes to a nucleophile on a ring, which are mechanistic opposites. SₙAr adds first, through an anion the withdrawing groups stabilize, so the nucleophile arrives exactly where the halide was. Benzyne eliminates first, and because the strained bond it forms is symmetric, the nucleophile can land on either of two carbons.',
  note: 'Read the substrate before choosing. Withdrawing groups <b>ortho or para</b> to the halide mean SₙAr — a meta group helps only inductively, which is measurable and far too little, because only ortho and para reach the charge by resonance. A bare ring plus NaNH₂ means benzyne. A ring with neither activation nor an ortho hydrogen runs neither, which is the answer people skip past.',
});

/* The single most important missing picture in the chapter: the notes assert
   three times that the charge lands ortho and para and runs onto the nitro
   oxygens, and never show it. */
FIGURES.push({
  id: 'meisenheimer',
  section: 'nucleophilic-aromatic',
  anchor: 'the nitro groups pay for it by delocalizing the negative charge onto their own oxygens.</div>',
  alt: 'Four drawn frames. First, 1-chloro-2,4-dinitrobenzene with methoxide and a curved arrow from the methoxide oxygen to the carbon bearing the chlorine. Second, the Meisenheimer complex: the top carbon now sp3 carrying both OCH3 and Cl, only two carbon-carbon double bonds left in the ring, and a minus sign on the para carbon. Third, the same complex with two curved arrows moving that charge out onto an oxygen of the para nitro group. Fourth, the aromatic product with OCH3 where the chlorine was, both nitro groups still in place, plus chloride.',
  viewBox: '0 0 760 580',
  build() {
    const R = 40, K = hexKit(R);
    let s = '';
    s += tag(380, 26, 'ADDITION FIRST, ELIMINATION SECOND — DRAWN');

    /* Frame 1: the substrate and the attack. */
    const c1 = P(200, 150);
    s += K.ring(c1.x, c1.y, [0, 2, 4]);
    s += K.sub(c1.x, c1.y, 0, 'Cl', { r: 15 });
    s += K.sub(c1.x, c1.y, 1, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    s += K.sub(c1.x, c1.y, 3, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    s += atom(62, 96, 'CH₃O', { kind: 'hi', r: 21, size: 9.5 });
    s += text(86, 80, '−', { cls: 'fg-warn', size: 15 });
    s += lonePair(62, 96, 20, { dist: 27 });
    s += lonePair(62, 96, 340, { dist: 27 });
    s += curve(P(86, 104), P(176, 104), { bow: 26 });
    s += text(200, 262, 'attack at the carbon carrying the halide', { cls: 'fg-tag', size: 11 });

    s += arrow(P(306, 150), P(392, 150));
    s += text(349, 138, 'slow', { cls: 'fg-sm', size: 10.5 });

    /* Frame 2: the Meisenheimer complex. */
    const c2 = P(520, 150);
    s += K.ring(c2.x, c2.y, [1, 4]);
    s += wedge(K.V(c2.x, c2.y)[0], P(490, 80), { rFrom: 0, rTo: 19 });
    s += atom(490, 80, 'OCH₃', { kind: 'hi', r: 19, size: 9 });
    s += hash(K.V(c2.x, c2.y)[0], P(554, 84), { rFrom: 0, rTo: 14 });
    s += atom(554, 84, 'Cl', { r: 14, size: 11 });
    s += K.sub(c2.x, c2.y, 1, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    s += K.sub(c2.x, c2.y, 3, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    s += K.mark(c2.x, c2.y, 5, '−', { d: 20, size: 17 });
    s += text(520, 262, 'aromaticity gone — the anion is the price', { cls: 'fg-tag', size: 11 });
    s += text(596, 176, 'meta: no charge', { cls: 'fg-tag-mut', size: 10, anchor: 'start' });

    s += rule(24, 286, 736, 286);

    /* Frame 3: the charge moves onto a nitro oxygen. */
    const c3 = P(200, 392);
    s += K.ring(c3.x, c3.y, [1, 4]);
    s += wedge(K.V(c3.x, c3.y)[0], P(170, 322), { rFrom: 0, rTo: 19 });
    s += atom(170, 322, 'OCH₃', { kind: 'hi', r: 19, size: 9 });
    s += hash(K.V(c3.x, c3.y)[0], P(234, 326), { rFrom: 0, rTo: 14 });
    s += atom(234, 326, 'Cl', { r: 14, size: 11 });
    s += K.sub(c3.x, c3.y, 1, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    {
      const v3 = K.V(c3.x, c3.y)[3];
      const N = P(200, 486), OL = P(154, 516), OR = P(246, 516);
      s += bond(v3, N, { rFrom: 0, rTo: 15 });
      s += bond(N, OR, { rFrom: 15, rTo: 15, order: 2, gap: 3.4 });
      s += bond(N, OL, { rFrom: 15, rTo: 15 });
      s += atom(N.x, N.y, 'N', { kind: 'warn' });
      s += text(220, 474, '+', { cls: 'fg-warn', size: 13 });
      s += atom(OL.x, OL.y, 'O');
      s += text(128, 502, '−', { cls: 'fg-warn', size: 14 });
      s += atom(OR.x, OR.y, 'O', { kind: 'hi' });
      s += text(170, 444, '−', { cls: 'fg-warn', size: 17 });
      s += curve(P(180, 448), P(198, 464), { bow: -10, size: 7 });
      s += curve(P(218, 492), P(257, 505), { bow: -13, size: 7 });
      s += text(292, 492, 'neutral until', { cls: 'fg-sm', size: 9.5 });
      s += text(292, 506, 'the arrow lands', { cls: 'fg-sm', size: 9.5 });
    }
    s += text(200, 538, 'and this is what pays for it —', { cls: 'fg-tag', size: 11 });
    s += text(200, 556, 'only ortho and para reach an oxygen', { cls: 'fg-tag', size: 11 });

    /* Frame 4: back to aromatic. */
    s += arrow(P(310, 392), P(396, 392));
    s += text(353, 380, '– Cl⁻', { cls: 'fg-sm', size: 10.5 });
    const c4 = P(560, 392);
    s += K.ring(c4.x, c4.y, [0, 2, 4]);
    s += K.sub(c4.x, c4.y, 0, 'OCH₃', { kind: 'hi', r: 19, size: 9, d: 36 });
    s += K.sub(c4.x, c4.y, 1, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    s += K.sub(c4.x, c4.y, 3, 'NO₂', { kind: 'warn', r: 17, size: 9.5 });
    s += text(690, 398, '+ Cl⁻', { cls: 'fg-lbl', size: 12.5 });
    s += text(560, 552, 'aromatic again, one product, same position', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Addition then elimination, drawn out. The nucleophile adds first, the ring pays with its aromaticity, and the nitro groups hand that cost back by taking the charge onto their own oxygens. Follow the minus sign through frames 2 and 3: it never visits a meta carbon, which is the whole reason a meta nitro group is no help.',
  note: 'Count the electrons in frame 2. The ring has one sp&sup3; carbon, so the six-electron cycle is broken &mdash; the same structural situation as the arenium ion of electrophilic substitution, with the sign of the charge reversed. That symmetry is worth holding on to: EAS runs through a <b>cation</b> stabilized by donors, S<sub>N</sub>Ar through an <b>anion</b> stabilized by acceptors.',
});

/* The other pure-prose claim in the same section: two sp2 orbitals in the
   plane of the ring. The orbital vocabulary was already in the kit. */
FIGURES.push({
  id: 'benzyne-orbitals',
  section: 'nucleophilic-aromatic',
  anchor: 'so benzyne is strained, extremely reactive, and lasts only long enough to be attacked.</p>',
  alt: 'Three panels. Left, chlorobenzene with the ortho hydrogen drawn and curved arrows showing amide removing it and chloride leaving. Center, benzyne with two lobes drawn in the plane of the ring on adjacent carbons, pointing past each other, with the aromatic pi system drawn as separate lobes above and below for contrast. Right, two product rings, one with the nucleophile where the chlorine was and one with it on the neighboring carbon, marked roughly fifty-fifty.',
  viewBox: '0 0 760 420',
  build() {
    const R = 36, K = hexKit(R);
    let s = '';
    const lobe = (cx, cy, rx, ry, rot, cls) =>
      `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill-opacity="0.18" transform="rotate(${rot} ${cx} ${cy})"></ellipse>`;
    s += tag(380, 26, 'ELIMINATION FIRST, ADDITION SECOND');

    /* Left: making it. */
    const a = P(130, 178);
    s += K.ring(a.x, a.y, [0, 2, 4]);
    s += K.sub(a.x, a.y, 0, 'Cl', { r: 15, d: 32 });
    s += K.sub(a.x, a.y, 1, 'H', { r: 12, d: 30 });
    s += atom(48, 92, 'H₂N', { kind: 'hi', r: 19, size: 9.5 });
    s += text(70, 76, '−', { cls: 'fg-warn', size: 14 });
    s += lonePair(48, 92, 30, { dist: 26 });
    s += curve(P(66, 102), P(172, 137), { bow: 24 });
    s += curve(P(176, 152), P(146, 166), { bow: 16 });
    s += curve(P(130, 130), P(130, 116), { bow: 12 });
    s += text(130, 248, 'the base takes the ortho H,', { cls: 'fg-tag', size: 11 });
    s += text(130, 266, 'and chloride leaves', { cls: 'fg-tag', size: 11 });

    /* Centre: the thing itself. */
    const b = P(392, 178);
    s += K.ring(b.x, b.y, [2, 4]);
    {
      const v = K.V(b.x, b.y);
      s += bond(v[0], v[1], { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
      s += lobe(412, 136, 17, 9, 30, 'fg-orb');
      s += lobe(434, 149, 17, 9, 30, 'fg-orb-alt');
      s += text(506, 126, 'two sp² lobes,', { cls: 'fg-tag-warn', size: 10.5 });
      s += text(506, 142, 'in the ring plane', { cls: 'fg-tag-warn', size: 10.5 });
      s += lobe(392, 108, 26, 11, 0, 'fg-orb');
      s += lobe(392, 248, 26, 11, 0, 'fg-orb');
      s += text(392, 86, 'the aromatic π system, above and below', { cls: 'fg-tag-mut', size: 10 });
      s += text(392, 274, 'and untouched by any of this', { cls: 'fg-tag-mut', size: 10 });
    }
    s += text(392, 298, 'the extra bond is IN the ring plane —', { cls: 'fg-tag', size: 11 });
    s += text(392, 316, 'two sp² lobes that point past each other', { cls: 'fg-tag', size: 11 });

    /* Right: what attacks it, and where. */
    const R2 = 28, K2 = hexKit(R2);
    const c = P(618, 104), d = P(618, 262);
    s += K2.ring(c.x, c.y, [0, 2, 4]);
    s += K2.sub(c.x, c.y, 0, 'Nu', { kind: 'hi', r: 15, d: 28 });
    s += text(618, 152, 'where the Cl was', { cls: 'fg-tag', size: 10.5 });
    s += K2.ring(d.x, d.y, [0, 2, 4]);
    s += K2.sub(d.x, d.y, 1, 'Nu', { kind: 'hi', r: 15, d: 28 });
    s += text(618, 310, 'and one carbon along', { cls: 'fg-tag', size: 10.5 });
    s += text(618, 192, '≈ 50 : 50', { cls: 'fg-lbl', size: 12.5 });
    s += arrow(P(470, 178), P(536, 150), { muted: true });
    s += arrow(P(470, 178), P(536, 232), { muted: true });

    s += rule(24, 352, 736, 352);
    s += label(380, 382, 'The in-plane bond is not part of the aromatic sextet, so benzyne is still aromatic —');
    s += label(380, 406, 'just strained. That is why it survives long enough to be attacked at all.');
    return s;
  },
  caption: 'Benzyne drawn three ways: made, pictured, and used. The extra bond comes from two sp&sup2; orbitals lying <i>in</i> the ring plane, which is why it overlaps so badly, and the six π electrons above and below the ring are untouched throughout.',
  note: 'The right-hand panel is the whole experimental argument. The nucleophile has two carbons to choose between and no reason to prefer either, so the label splits &mdash; and a product with the nucleophile on a carbon that never carried the halide is something no direct displacement can produce. On a substituted ring the split stops being even, because the substituent votes on where the leftover carbanion may sit.',
});

export default FIGURES;
