/* Figures for the alkynes notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 8.8 ---
   "cis alkene, trans alkene, or alkane, purely by reagent choice" is a claim
   about geometry, made in a section with no geometry drawn. */
FIGURES.push({
  id: 'alkyne-reduction-fork',
  section: 'alkynes',
  anchor: 'which is precisely why alkynes are so useful as synthetic intermediates. Alkene geometry is otherwise hard to control.</p>',
  alt: 'One internal alkyne, 2-butyne, with three arrows leading to three different products: hydrogen over Lindlar catalyst gives the cis alkene with both methyls on the same side; sodium in liquid ammonia gives the trans alkene with the methyls on opposite sides; hydrogen over ordinary palladium gives butane.',
  viewBox: '0 0 760 360',
  build() {
    let s = '';
    // starting alkyne
    const t1 = P(70, 180), t2 = P(130, 180);
    s += bond(t1, t2, { order: 3, rFrom: 0, rTo: 0, gap: 5 });
    s += sk(P(30, 202), t1) + sk(t2, P(170, 202));
    s += text(100, 148, '2-butyne', { cls: 'fg-lbl', size: 11.5 });
    s += text(100, 230, 'one starting material', { cls: 'fg-sm', size: 9.5 });

    const outcome = (y, reagent, sub, kind, mode, name, why) => {
      let g = bond(P(190, 180), P(238, y), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
      g += arrow(P(244, y), P(320, y));
      g += text(282, y - 16, reagent, { cls: 'fg-lbl', size: 11 });
      g += text(282, y + 22, sub, { cls: 'fg-sm', size: 9 });
      const a = P(392, y), b = P(452, y);
      if (mode === 'alkane') {
        g += sk(P(352, y + 22), a) + sk(a, b) + sk(b, P(492, y + 22));
      } else {
        g += bond(a, b, { order: 2, rFrom: 0, rTo: 0, gap: 4.6 });
        if (mode === 'cis') { g += sk(P(352, y - 24), a); g += sk(b, P(492, y - 24)); }
        else { g += sk(P(352, y + 24), a); g += sk(b, P(492, y - 24)); }
      }
      g += text(512, y - 4, name, { cls: kind, size: 12, anchor: 'start' });
      g += text(512, y + 16, why, { cls: 'fg-sm', size: 9.5, anchor: 'start' });
      return g;
    };
    s += outcome(70, 'H₂ , Lindlar', 'Pd poisoned with Pb', 'fg-tag-good', 'cis',
      'cis (Z) alkene', 'both H from one metal surface');
    s += outcome(180, 'Na , NH₃ (l)', 'e⁻, H⁺, e⁻, H⁺', 'fg-tag-good', 'trans',
      'trans (E) alkene', 'the vinyl anion sets the shape');
    s += outcome(292, 'H₂ , Pd/C', 'no poison', 'fg-tag', 'alkane',
      'butane', 'both pi bonds gone');

    s += rule(30, 330, 730, 330);
    s += text(380, 354, 'Three reagents, three answers, one substrate — geometry chosen, not inherited.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The fork that makes alkynes worth building. A triple bond is the one place in this course where you can choose the geometry of a double bond outright: the same 2-butyne becomes the cis alkene, the trans alkene or the alkane depending only on what you put in the flask.',
  note: 'The two partial reductions differ in where the hydrogens come from. Lindlar hands both over from one metal surface at once, so they land on one face. Sodium in ammonia delivers them one at a time through free intermediates, and the roomier trans arrangement is the one that survives to be protonated the second time.',
});

/* ---------------------------------------------------------------- 8.9 ---
   The section goes out of its way to say tautomerization is not resonance,
   which is exactly the distinction real arrows settle. */
FIGURES.push({
  id: 'keto-enol-arrows',
  section: 'alkynes',
  anchor: 'giving a ketone.</p>',
  alt: 'Keto-enol tautomerization under acid in two steps. First the enol pi bond attacks a proton from hydronium, putting the hydrogen on the terminal carbon and giving a cation stabilized by the oxygen lone pair. Then a water molecule removes the proton from that oxygen, leaving a carbon-oxygen double bond: the ketone.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    const box = (x, w, title) => panel(x, 14, w, 218) + tag(x + w / 2, 40, title);

    // --- enol
    s += box(8, 238, 'the enol');
    const e1 = P(84, 170), e2 = P(140, 140), e3 = P(196, 170);
    s += skDouble(e1, e2, P(112, 196));
    s += sk(e2, e3);
    const eo = P(140, 88);
    s += bond(e2, eo, { rFrom: 0, rTo: 14 });
    s += atom(eo.x, eo.y, 'O', { r: 14, kind: 'hi' });
    s += text(166, 76, 'H', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += lonePair(eo.x, eo.y, 180, { dist: 24 });
    s += curve(P(100, 158), P(78, 200), { bow: 18 });
    s += text(70, 218, 'H₃O⁺', { cls: 'fg-sm', size: 10 });
    s += text(152, 210, 'the pi bond takes H⁺', { cls: 'fg-sm', size: 9 });
    s += arrow(P(256, 130), P(282, 130), { muted: true });

    // --- cation
    s += box(290, 200, 'oxygen holds the charge');
    const f1 = P(348, 170), f2 = P(404, 140), f3 = P(460, 170);
    s += sk(f1, f2) + sk(f2, f3);
    const fo = P(404, 88);
    s += bond(f2, fo, { order: 2, rFrom: 0, rTo: 14, gap: 4 });
    s += atom(fo.x, fo.y, 'O', { r: 14, kind: 'hi' });
    s += plus(428, 74);
    s += text(430, 100, 'H', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(340, 194, 'H added here', { cls: 'fg-sm', size: 9 });
    s += text(476, 78, 'H₂O', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += curve(P(474, 90), P(440, 96), { bow: -14 });
    s += arrow(P(500, 130), P(526, 130), { muted: true });

    // --- ketone
    s += box(534, 216, 'the ketone');
    const g1 = P(592, 170), g2 = P(648, 140), g3 = P(704, 170);
    s += sk(g1, g2) + sk(g2, g3);
    const go = P(648, 88);
    s += bond(g2, go, { order: 2, rFrom: 0, rTo: 14, gap: 4 });
    s += atom(go.x, go.y, 'O', { r: 14, kind: 'hi' });
    s += lonePair(go.x, go.y, 210, { dist: 24 });
    s += lonePair(go.x, go.y, 330, { dist: 24 });
    s += text(642, 206, 'acetone — the keto side', { cls: 'fg-tag-good', size: 9.5 });

    s += rule(30, 250, 730, 250);
    s += text(380, 274, 'A hydrogen moved from O to C — so these are two COMPOUNDS, not resonance forms.', { cls: 'fg-lbl', size: 11.5 });
    s += text(380, 296, 'Resonance moves only electrons and is drawn ↔. This is drawn ⇌: both species are real.', { cls: 'fg-sm', size: 10 });
    s += text(380, 316, 'Keto wins by 10⁵ or more — a C=O is worth more than a C=C plus an O–H.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Tautomerization with the arrows drawn. Under the acidic conditions of an alkyne hydration it is two ordinary steps: the enol pi bond takes a proton onto carbon, and a water molecule then takes the proton off oxygen. The oxygen lone pair is what makes the intermediate cation affordable.',
  note: 'This is the fastest way to tell a tautomer from a resonance form. Cover the hydrogens and the two structures differ only in where a pi bond sits — that looks like resonance. Uncover them and a hydrogen has physically moved, which no resonance arrow is allowed to do.',
});

export default FIGURES;
