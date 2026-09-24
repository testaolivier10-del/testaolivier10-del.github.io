/* Figures for the enolate-regiochemistry notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 58 ---
   Students memorize the kinetic recipe as a list of four conditions. Drawing
   the molecule with an arrow to each side, and the conditions attached to the
   arrows rather than listed underneath, makes the recipe read as a
   consequence of which side you want. */
FIGURES.push({
  id: 'which-alpha-carbon',
  section: 'enolate-regiochemistry',
  anchor: '<h3>The same switch, one step earlier</h3>',
  viewBox: '0 0 760 300',
  alt: 'An unsymmetrical ketone in the middle with arrows to the less substituted enolate on one side and the more substituted enolate on the other',
  build() {
    let s = '';
    s += panel(286, 116, 190, 70, {});
    s += text(381, 144, '2-methylcyclohexanone', { cls: 'fg-lbl', size: 12 });
    s += text(381, 166, 'C6 open \u00b7 C2 carries the methyl', { cls: 'fg-sm', size: 10 });

    s += arrow(P(280, 140), P(200, 88));
    s += arrow(P(482, 140), P(562, 88));

    s += panel(24, 40, 220, 92, {});
    s += text(40, 64, 'KINETIC \u2014 at C6', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(40, 84, 'LDA, 1 eq, \u221278 \u00b0C, THF', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(40, 102, 'ketone added to the base', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(40, 122, 'less substituted C=C', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += panel(518, 40, 220, 92, { kind: 'warn' });
    s += text(534, 64, 'THERMODYNAMIC \u2014 at C2', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(534, 84, 'NaOEt or NaH', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(534, 102, 'room temperature or warmer', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(534, 122, 'more substituted C=C', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += rule(24, 218, 700, 218);
    s += text(24, 244, 'The easier proton and the more stable anion are on OPPOSITE sides of the molecule.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 268, 'One question settles every case: can the two enolates trade a proton?', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 290, 'If they can, the mixture finds the stabler one. If not, you keep whichever formed first.', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'Nothing about the ketone settles which enolate you get, which is why the conditions are written out in full rather than abbreviated to a reagent name. Each item in the kinetic column blocks one route back: the base is strong enough not to reverse, bulky enough to pick the open proton, cold enough not to equilibrate, and added first so no free ketone is left to shuttle protons.',
  note: 'The test is whether the two enolates can trade a proton, and there are three ways they can. The deprotonation reverses \u2014 ethoxide. Free ketone shuttles it \u2014 which is why NaH, whose deprotonation is as irreversible as LDA\u2019s, is a thermodynamic base: it is slow enough that un-ionized ketone is always present. Or the amine the base generated shuttles it, which is what erodes a lithium enolate on warming. Each item in the kinetic column closes one of the three, which is why missing any single one is enough to lose the regiochemistry.',
});

/* ----------------------------------------------------------------- 95 ---
   The section spends its whole length on which side of a molecule gets
   deprotonated, and never drew the molecule or either enolate. */
FIGURES.push({
  id: 'two-enolates-drawn',
  section: 'enolate-regiochemistry',
  anchor: 'That conflict is settled by conditions, not by the ketone.</p>',
  viewBox: '0 0 720 412',
  alt: '2-methylcyclohexanone in the center with the kinetic enolate at C6 on the left and the thermodynamic enolate at C2 on the right',
  build() {
    let s = '';
    const hex = (cx, cy, r) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return pts;   // 0 = C1 (top), 1 = C2, 2 = C3, 3 = C4, 4 = C5, 5 = C6
    };
    const ring = (pts, skip) => {
      let g = '';
      for (let i = 0; i < 6; i++) {
        if (i === skip) continue;
        g += bond(pts[i], pts[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      }
      return g;
    };

    // Centre: the ketone itself
    const c = hex(360, 112, 42), cc = P(360, 112);
    s += ring(c, -1);
    s += bond(c[0], P(360, 40), { rFrom: 0, rTo: 15, order: 2 });
    s += atom(360, 40, 'O');
    s += bond(c[1], P(446, 70), { rFrom: 0, rTo: 16 });
    s += atom(446, 70, 'CH₃', { r: 16 });
    s += text(300, 70, 'C6', { cls: 'fg-tag', size: 11 });
    s += text(420, 118, 'C2', { cls: 'fg-tag', size: 11 });
    s += text(360, 186, '2-methylcyclohexanone', { cls: 'fg-lbl', size: 12.5 });
    s += text(250, 152, 'two H, open', { cls: 'fg-sm', size: 10 });
    s += text(478, 140, 'one H, crowded', { cls: 'fg-sm', size: 10 });

    s += arrow(P(296, 204), P(212, 250));
    s += text(206, 202, 'LDA, 1 eq, −78 °C', { cls: 'fg-tag', size: 11 });
    s += arrow(P(424, 204), P(508, 250));
    s += text(516, 202, 'NaOEt, EtOH, rt', { cls: 'fg-tag-warn', size: 11 });

    // Left: kinetic enolate, C1=C6
    const k = hex(160, 312, 42), kc = P(160, 312);
    s += ring(k, 5);
    s += ringDouble(k[5], k[0], kc);
    s += bond(k[0], P(160, 240), { rFrom: 0, rTo: 16 });
    s += atom(160, 240, 'O⁻', { kind: 'warn' });
    s += bond(k[1], P(246, 270), { rFrom: 0, rTo: 16 });
    s += atom(246, 270, 'CH₃', { r: 16 });
    s += text(160, 382, 'KINETIC — C1=C6', { cls: 'fg-tag-good', size: 11 });
    s += text(160, 402, 'CH₃I gives 2,6-dimethylcyclohexanone', { cls: 'fg-sm', size: 10 });

    // Right: thermodynamic enolate, C1=C2
    const t = hex(560, 312, 42), tc = P(560, 312);
    s += ring(t, 0);
    s += ringDouble(t[0], t[1], tc);
    s += bond(t[0], P(560, 240), { rFrom: 0, rTo: 16 });
    s += atom(560, 240, 'O⁻', { kind: 'warn' });
    s += bond(t[1], P(650, 276), { rFrom: 0, rTo: 16 });
    s += atom(650, 276, 'CH₃', { r: 16 });
    s += text(560, 382, 'THERMODYNAMIC — C1=C2', { cls: 'fg-tag-warn', size: 11 });
    s += text(560, 402, 'CH₃I gives 2,2-dimethylcyclohexanone', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The two enolates, drawn. Deprotonating C6 gives a double bond with two carbon substituents on it; deprotonating C2 gives one with three, because the methyl is already sitting on a carbon that is now part of the C=C. That is the whole stability difference, and it is the same count that ranks Zaitsev products.',
  note: 'Check where the methyl is in each drawing and the alkylation products follow without memorizing anything. The nucleophilic carbon is the one at the far end of the C=C from the oxygen, so the kinetic enolate delivers the electrophile to C6 and the thermodynamic one to C2 — the carbon that already carries a methyl, which is how you end up building a quaternary center.',
});

export default FIGURES;
