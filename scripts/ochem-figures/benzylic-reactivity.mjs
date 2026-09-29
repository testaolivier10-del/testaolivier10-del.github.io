/* Figures for the benzylic-reactivity notes page (and its lesson). Built by
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

/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${x}" cy="${y}" r="3.4"></circle>`;

const FIGURES = [];

/* ----------------------------------------------------------------- 44 ---
   Side-chain oxidation is the most predictable reaction in the section and
   its one exception is what reveals the mechanism, so the figure is three
   substrates with the benzylic C-H circled or absent. */
FIGURES.push({
  id: 'side-chain-cut',
  section: 'benzylic-reactivity',
  anchor: '<h3>Radical bromination, and the reagent that makes it selective</h3>',
  viewBox: '0 0 760 320',
  alt: 'Toluene and propylbenzene both giving benzoic acid with hot permanganate while tert-butylbenzene does not react',
  build() {
    let s = '';
    const row = (y, name, chain, hasH, out, kind) => {
      s += label(24, y + 4, name, { anchor: 'start', size: 12 });
      s += text(210, y + 4, chain, { cls: 'fg-sm', size: 11 });
      s += text(392, y + 4, hasH ? 'yes' : 'none', { cls: hasH ? 'fg-tag-good' : 'fg-tag', size: 11 });
      if (hasH) s += arrow(P(432, y), P(482, y));
      s += text(590, y + 4, out, { cls: kind === 'warn' ? 'fg-tag' : 'fg-lbl', size: 12 });
    };
    s += tag(90, 44, 'substrate');
    s += tag(210, 44, 'side chain');
    s += tag(392, 44, 'benzylic H?');
    s += tag(590, 44, 'hot KMnO₄ gives');
    s += rule(24, 56, 700, 56);
    row(92,  'Toluene',           '–CH₃',            true,  'benzoic acid', null);
    row(142, 'Propylbenzene',     '–CH₂CH₂CH₃', true,  'benzoic acid', null);
    row(192, 'Isopropylbenzene',  '–CH(CH₃)₂',     true,  'benzoic acid', null);
    row(242, 'tert-Butylbenzene', '–C(CH₃)₃',      false, 'no reaction',  'warn');

    s += rule(24, 268, 700, 268);
    s += text(360, 294, 'Chain length is irrelevant — everything past the benzylic carbon is cut away.', { cls: 'fg-lbl', size: 12 });
    s += text(360, 314, 'One hydrogen on the carbon touching the ring is the entire requirement.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Hot permanganate cuts any alkyl side chain back to a single carbon and oxidizes it to a carboxyl, so three different chains give the same benzoic acid. <i>tert</i>-Butylbenzene is the exception, and it is the one that tells you what the mechanism needs.',
  note: 'The ring itself survives conditions that would cleave an isolated alkene without hesitation, which is aromatic stabilization earning its name. Retrosynthetically the reaction is a route rather than a fact: a benzoic acid should make you ask which alkylbenzene it came from, because the oxidation does not care what the chain was and electrophilic substitution cannot deliver a carboxyl directly.',
});

/* Three species, one set of four positions. The section rests on this and
   its only figure was a table of permanganate outcomes. */
FIGURES.push({
  id: 'benzylic-delocalization',
  section: 'benzylic-reactivity',
  anchor: 'an allyl system has two, its two end carbons, while a benzylic system has four: the benzylic carbon plus both ortho positions and the para one.</div>',
  alt: 'Top row: four resonance structures of the benzyl cation, with the positive charge first on the exocyclic CH2 carbon and then on an ortho, the para and the other ortho ring carbon, connected by double-headed arrows. Bottom row: the same skeleton drawn with a single dot for the radical and with a minus sign and lone pair for the anion, and beside them an allyl cation drawn as its two resonance structures for comparison.',
  viewBox: '0 0 760 450',
  build() {
    const R = 32, K = hexKit(R);
    let s = '';
    s += tag(380, 26, 'THE SAME FOUR CARBONS, WHATEVER SITS ON THEM');

    const frames = [
      { cx: 100, doubles: [0, 2, 4], exo: 1, charge: null, lab: 'on the benzylic carbon' },
      { cx: 280, doubles: [2, 4], exo: 2, charge: 1, lab: 'on an ortho carbon' },
      { cx: 460, doubles: [1, 4], exo: 2, charge: 3, lab: 'on the para carbon' },
      { cx: 640, doubles: [1, 3], exo: 2, charge: 5, lab: 'on the other ortho' },
    ];
    const CY = 126;
    frames.forEach((f, i) => {
      s += K.ring(f.cx, CY, f.doubles);
      const v = K.V(f.cx, CY)[0];
      const p = K.out(f.cx, CY, 0, 32);
      s += bond(v, p, { rFrom: 0, rTo: 18, order: f.exo, gap: 3.4 });
      s += atom(p.x, p.y, 'CH₂', { kind: f.charge === null ? 'hi' : 'plain', r: 18, size: 9.5 });
      if (f.charge === null) s += text(p.x + 26, p.y - 8, '+', { cls: 'fg-warn', size: 16 });
      else s += K.mark(f.cx, CY, f.charge, '+', { d: 18 });
      s += text(f.cx, 196, f.lab, { cls: 'fg-tag', size: 10.5 });
      if (i < 3) {
        const x1 = f.cx + 44, x2 = frames[i + 1].cx - 44;
        s += arrow(P(x1, CY), P(x2, CY), { muted: true });
        s += arrow(P(x2, CY), P(x1, CY), { muted: true });
      }
    });
    s += text(190, 222, 'meta · never', { cls: 'fg-tag-mut', size: 10 });
    s += text(550, 222, 'meta · never', { cls: 'fg-tag-mut', size: 10 });
    s += rule(24, 244, 736, 244);

    /* The radical and the anion use the same skeleton. */
    const CY2 = 324;
    const two = [
      { cx: 110, kind: 'radical', lab: 'radical · one electron' },
      { cx: 300, kind: 'anion', lab: 'anion · a lone pair' },
    ];
    two.forEach((f) => {
      s += K.ring(f.cx, CY2, [0, 2, 4]);
      const v = K.V(f.cx, CY2)[0];
      const p = K.out(f.cx, CY2, 0, 32);
      s += bond(v, p, { rFrom: 0, rTo: 18 });
      s += atom(p.x, p.y, 'CH₂', { kind: 'hi', r: 18, size: 9.5 });
      if (f.kind === 'radical') s += `<circle class="fg-lp" cx="${p.x + 24}" cy="${p.y - 10}" r="3"></circle>`;
      else {
        s += lonePair(p.x, p.y, -90, { dist: 26 });
        s += text(p.x + 26, p.y - 8, '−', { cls: 'fg-warn', size: 15 });
      }
      s += text(f.cx, CY2 + 62, f.lab, { cls: 'fg-tag', size: 10.5 });
    });
    s += text(205, 288, 'same four', { cls: 'fg-tag-mut', size: 10 });

    /* The allyl comparison the text makes in words. */
    s += panel(420, 262, 282, 124);
    s += text(561, 284, 'an allyl cation, for comparison', { cls: 'fg-tag', size: 11 });
    {
      const A = P(452, 342), B = P(482, 322), C = P(512, 342);
      s += bond(A, B, { rFrom: 0, rTo: 0, order: 2, gap: 3.6 });
      s += bond(B, C, { rFrom: 0, rTo: 0 });
      s += text(522, 336, '+', { cls: 'fg-warn', size: 15 });
      const D = P(606, 342), E = P(636, 322), F = P(666, 342);
      s += bond(D, E, { rFrom: 0, rTo: 0 });
      s += bond(E, F, { rFrom: 0, rTo: 0, order: 2, gap: 3.6 });
      s += text(596, 336, '+', { cls: 'fg-warn', size: 15 });
      s += arrow(P(544, 312), P(576, 312), { muted: true, size: 7 });
      s += arrow(P(576, 312), P(544, 312), { muted: true, size: 7 });
      s += text(561, 372, 'two positions, not four', { cls: 'fg-tag-mut', size: 10.5 });
    }

    s += rule(24, 402, 736, 402);
    s += label(380, 430, 'An empty orbital, one electron or a lone pair — the ring does not care which.');
    return s;
  },
  caption: 'One set of resonance structures, three different species. Whatever sits on the benzylic carbon reaches the same four carbons: the benzylic one, both ortho positions and the para. The meta carbons never appear, which is the pattern the phenoxide and the Meisenheimer anion follow too.',
  note: 'Notice the cost in structures 2&ndash;4: the ring is drawn with the charge <i>inside</i> it, which breaks the six-electron cycle. That is why a benzylic cation is <i>about</i> as good as a tertiary one rather than dramatically better &mdash; the delocalization is real, and it is paid for.',
});

export default FIGURES;
