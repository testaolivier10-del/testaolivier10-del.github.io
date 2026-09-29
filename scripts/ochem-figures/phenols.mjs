/* Figures for the phenols notes page (and its lesson). Built by
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

/* ----------------------------------------------------------------- 45 ---
   The pKa numbers only mean something next to each other, and the pair of
   nitrophenols is the whole argument that POSITION beats presence. */
FIGURES.push({
  id: 'phenol-pka-scale',
  section: 'phenols',
  anchor: '<h3>The ring is strongly activated</h3>',
  viewBox: '0 0 760 312',
  alt: 'A pKa scale from 0 to 16 placing ethanol, phenol, the two nitrophenols, picric acid and acetic acid, with the bicarbonate cut marked',
  build() {
    let s = '';
    const x = (p) => 80 + ((16 - p) / 16) * 600;
    s += rule(72, 176, 688, 176);
    for (let p = 0; p <= 16; p += 4) {
      s += rule(x(p), 176, x(p), 183);
      s += text(x(p), 198, String(p), { cls: 'fg-sm', size: 10 });
    }
    s += text(380, 220, 'pKₐ  —  more acidic to the right', { cls: 'fg-tag', size: 11 });

    const mark = (p, name, up, kind) => {
      s += rule(x(p), up ? 96 : 132, x(p), 176);
      s += text(x(p), up ? 88 : 124, name, { cls: kind || 'fg-lbl', size: 11 });
    };
    mark(16,   'ethanol',        true,  null);
    mark(10,   'phenol',         true,  null);
    mark(8.4,  '3-nitro (meta)', false, 'fg-tag');
    mark(7.2,  '4-nitro (para)', true,  'fg-tag-good');
    mark(4.8,  'acetic acid',    false, null);
    mark(0.4,  'picric acid',    true,  null);

    // The bicarbonate cut: everything right of 6.4 is deprotonated by HCO3-.
    s += rule(x(6.4), 56, x(6.4), 176);
    s += text(x(6.4) + 4, 48, 'carbonic acid, 6.4', { cls: 'fg-tag', anchor: 'start', size: 10.5 });
    s += text(x(6.4) + 4, 66, 'NaHCO₃ deprotonates only past here', { cls: 'fg-sm', anchor: 'start', size: 9.5 });

    s += rule(24, 244, 700, 244);
    s += text(360, 268, 'The two nitrophenols are the same group on the same ring,', { cls: 'fg-lbl', size: 12 });
    s += text(360, 290, '1.2 pK\u2090 units apart on position alone.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Where a phenol sits. Six units below an alcohol because the phenoxide delocalizes into the ring, and moved further by substituents — but only by those that can reach the charge. The meta and para nitrophenols differ by 1.2 pKa units with the identical group on the identical ring.',
  note: 'The carbonic acid line is the practical one. Bicarbonate deprotonates anything more acidic than pKa 6.4, which means a carboxylic acid and not a phenol — so shaking a mixture with aqueous NaHCO₃ pulls the acid into the water layer and leaves the phenol behind. That is a pKa table being used rather than recited.',
});

/* Six pKa units, drawn. */
FIGURES.push({
  id: 'phenoxide-resonance',
  section: 'phenols',
  anchor: 'Spreading charge stabilizes it, the conjugate base is more stable, and the acid is stronger.</p>',
  alt: 'Top row: four resonance structures of phenoxide, with the negative charge first on oxygen and then on an ortho, the para and the other ortho ring carbon, each connected by double-headed arrows. Bottom left: the hybrid drawn once, with partial negative marks on the oxygen and on three ring carbons and the two meta carbons marked never. Bottom right: ethoxide drawn as a two-carbon chain with the charge locked on its single oxygen.',
  viewBox: '0 0 760 460',
  build() {
    const R = 32, K = hexKit(R);
    let s = '';
    s += tag(380, 26, 'WHERE A PHENOXIDE PUTS ITS CHARGE');
    const CY = 122;
    const frames = [
      { cx: 100, doubles: [0, 2, 4], exo: 1, charge: null, lab: 'charge on oxygen' },
      { cx: 280, doubles: [2, 4], exo: 2, charge: 1, lab: 'on an ortho carbon' },
      { cx: 460, doubles: [1, 4], exo: 2, charge: 3, lab: 'on the para carbon' },
      { cx: 640, doubles: [1, 3], exo: 2, charge: 5, lab: 'on the other ortho' },
    ];
    frames.forEach((f, i) => {
      s += K.ring(f.cx, CY, f.doubles);
      const v = K.V(f.cx, CY)[0];
      const p = K.out(f.cx, CY, 0, 30);
      s += bond(v, p, { rFrom: 0, rTo: 15, order: f.exo, gap: 3.4 });
      s += atom(p.x, p.y, 'O', { kind: f.charge === null ? 'hi' : 'plain' });
      if (f.charge === null) {
        s += text(p.x + 22, p.y - 8, '−', { cls: 'fg-warn', size: 15 });
        s += lonePair(p.x, p.y, 180, { dist: 22 });
        s += lonePair(p.x, p.y, 0, { dist: 22 });
      } else {
        s += K.mark(f.cx, CY, f.charge, '−', { d: 18 });
      }
      s += text(f.cx, 192, f.lab, { cls: 'fg-tag', size: 10.5 });
      if (i < 3) {
        const x1 = f.cx + 44, x2 = frames[i + 1].cx - 44;
        s += arrow(P(x1, CY), P(x2, CY), { muted: true });
        s += arrow(P(x2, CY), P(x1, CY), { muted: true });
      }
    });
    s += rule(24, 214, 736, 214);

    /* The hybrid, and the alkoxide that has none of this. */
    const R3 = 40, K3 = hexKit(R3);
    const h = P(180, 312);
    s += K3.ring(h.x, h.y, [0, 2, 4]);
    s += K3.sub(h.x, h.y, 0, 'O', { kind: 'hi', r: 15, d: 32 });
    s += text(212, 258, 'δ−', { cls: 'fg-warn', size: 12 });
    for (const i of [1, 3, 5]) s += K3.mark(h.x, h.y, i, 'δ−', { d: 22, cls: 'fg-warn', size: 12, dy: 4 });
    s += text(268, 312, 'meta · never', { cls: 'fg-tag-mut', size: 10, anchor: 'start' });
    s += text(92, 312, 'never · meta', { cls: 'fg-tag-mut', size: 10, anchor: 'end' });
    s += text(180, 394, 'four atoms share it — pKa 10', { cls: 'fg-tag', size: 11 });

    s += panel(420, 246, 282, 132);
    {
      const A = P(478, 330), B = P(514, 310), O = P(558, 330);
      s += bond(A, B, { rFrom: 0, rTo: 0 });
      s += bond(B, O, { rFrom: 0, rTo: 15 });
      s += atom(O.x, O.y, 'O', { kind: 'warn' });
      s += text(582, 322, '−', { cls: 'fg-warn', size: 15 });
      s += lonePair(O.x, O.y, 90, { dist: 22 });
      s += lonePair(O.x, O.y, 30, { dist: 22 });
      s += text(460, 306, 'CH₃', { cls: 'fg-sm', size: 10.5 });
      s += text(612, 330, 'nowhere', { cls: 'fg-tag-mut', size: 10.5, anchor: 'start' });
      s += text(612, 348, 'to go', { cls: 'fg-tag-mut', size: 10.5, anchor: 'start' });
      s += text(561, 274, 'ethoxide: one atom holds all of it — pKa 16', { cls: 'fg-tag', size: 11 });
    }
    s += rule(24, 414, 736, 414);
    s += label(380, 442, 'Four atoms sharing a charge, against one atom keeping all of it — six pKa units.');
    return s;
  },
  caption: 'Six pKa units, drawn. The phenoxide charge reaches four atoms; the ethoxide charge reaches one. The two meta carbons are left out of every structure, which is why a meta substituent can only ever help inductively.',
  note: 'These are the same four positions as the benzyl cation in the last section and the same four as the Meisenheimer anion two sections back. Once you have drawn them once, ortho/para stops being a rule to memorize and becomes something you can read off the page. It also explains Kolbe&ndash;Schmitt: if the charge is genuinely on those ring carbons, those ring carbons are nucleophilic.',
});

export default FIGURES;
