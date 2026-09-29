/* Figures for the enantiomers notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- ch6.5 ---
   The polarimeter. The section gives the formula for [alpha] and uses it in a
   worked example without ever drawing the measurement the formula describes,
   which leaves l and c as symbols rather than parts of an instrument. */
FIGURES.push({
  id: 'polarimeter',
  section: 'enantiomers',
  anchor: '<h3>Specific rotation</h3>',
  alt: 'A polarimeter drawn left to right: a sodium lamp emitting light vibrating in every plane, a polarizer that passes only the vertical plane, a sample tube of length l holding a solution of concentration c, the emerging plane tilted by an angle alpha, and an analyzer turned by alpha to find the new plane.',
  viewBox: '0 0 760 316',
  build() {
    let s = '';
    const beam = 150;
    // a bundle of vibration planes, drawn as short strokes across the beam
    const ticks = (x0, x1, degs, cls) => {
      let g = '';
      for (let x = x0; x <= x1; x += 18) {
        for (const d of degs) {
          const r = (d * Math.PI) / 180, L = 15;
          g += `<line class="${cls}" x1="${(x - Math.cos(r) * L).toFixed(2)}" y1="${(beam - Math.sin(r) * L).toFixed(2)}" x2="${(x + Math.cos(r) * L).toFixed(2)}" y2="${(beam + Math.sin(r) * L).toFixed(2)}"></line>`;
        }
      }
      return g;
    };
    s += atom(46, beam, '', { r: 22, kind: 'hi' });
    s += text(46, beam + 4, 'Na', { cls: 'fg-lbl', size: 12 });
    s += text(46, 210, 'sodium lamp', { cls: 'fg-sm', size: 9.5 });
    s += text(46, 226, '589 nm', { cls: 'fg-sm', size: 9.5 });

    s += ticks(84, 148, [0, 45, 90, 135], 'fg-bond-soft');
    s += text(116, 100, 'every plane', { cls: 'fg-sm', size: 9.5 });

    s += bar(170, beam - 44, 14, 88, { kind: 'mut', r: 4 });
    s += text(177, 212, 'polarizer', { cls: 'fg-sm', size: 9.5 });
    s += text(177, 228, 'passes one plane', { cls: 'fg-sm', size: 9.5 });

    s += ticks(206, 250, [90], 'fg-bond-hi');
    s += text(228, 100, 'plane-polarized', { cls: 'fg-tag-good', size: 10 });

    s += panel(268, beam - 40, 200, 80, { kind: 'hi' });
    s += text(368, beam - 6, 'sample solution', { cls: 'fg-lbl', size: 11 });
    s += text(368, beam + 12, 'concentration c, in g/mL', { cls: 'fg-sm', size: 9.5 });
    s += arrow(P(268, 212), P(468, 212), { muted: true, size: 7 });
    s += arrow(P(468, 226), P(268, 226), { muted: true, size: 7 });
    s += text(368, 250, 'path length l, in decimeters', { cls: 'fg-tag', size: 10.5 });

    // the turned plane, with the original plane dashed behind it so the angle
    // the analyzer has to be turned through is the thing you can see
    s += `<line class="fg-dash-hi" x1="510" y1="${beam - 46}" x2="510" y2="${beam + 46}"></line>`;
    s += `<line class="fg-bond-hi" x1="${(510 - Math.cos(Math.PI / 3) * 46).toFixed(2)}" y1="${(beam - Math.sin(Math.PI / 3) * 46).toFixed(2)}" x2="${(510 + Math.cos(Math.PI / 3) * 46).toFixed(2)}" y2="${(beam + Math.sin(Math.PI / 3) * 46).toFixed(2)}"></line>`;
    s += text(530, beam - 4, 'α', { cls: 'fg-tag-good', size: 14, anchor: 'start' });
    s += text(508, 92, 'same plane,', { cls: 'fg-tag-good', size: 10 });
    s += text(508, 106, 'turned by α', { cls: 'fg-tag-good', size: 10 });

    s += bar(556, beam - 44, 14, 88, { kind: 'mut', r: 4 });
    s += text(563, 212, 'analyzer', { cls: 'fg-sm', size: 9.5 });
    s += text(563, 228, 'turned until light returns', { cls: 'fg-sm', size: 9.5 });

    s += atom(700, beam, '', { r: 22 });
    s += text(700, beam + 4, '◉', { cls: 'fg-lbl', size: 14 });
    s += text(700, 212, 'detector', { cls: 'fg-sm', size: 9.5 });

    s += text(380, 40, 'WHAT THE INSTRUMENT MEASURES IS α. WHAT YOU REPORT IS [α] = α / (l × c).', { cls: 'fg-tag', size: 11 });
    s += text(380, 282, 'Double the tube length, or double the concentration, and α doubles — the beam simply met twice as many molecules.', { cls: 'fg-sm', size: 10 });
    s += text(380, 300, 'That is why α on its own is not a property of the compound, and [α] is.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The measurement behind every number in this section. Light from the lamp vibrates in every plane at once; the polarizer throws away all but one. That single plane passes through the solution and comes out <b>turned</b>, and the analyzer is then rotated by hand until the light comes back — the angle it had to be turned through is α.',
  note: 'The two normalizations in the formula are the two things you could change about the experiment without changing the compound: how long a column of solution the light crossed (l, in decimeters, because a standard tube is 1 dm) and how much compound was in it (c, in g/mL). Divide them out and what is left is a constant of the substance, quoted with the temperature and wavelength because it depends mildly on both.',
});

/* ---------------------------------------------------------------- ch6.6 ---
   Resolution as a scheme. Three steps in one paragraph is three steps a
   student has to hold in their head. */
FIGURES.push({
  id: 'resolution-scheme',
  section: 'enantiomers',
  anchor: '<h3>Separating enantiomers</h3>',
  alt: 'A four-stage scheme: a racemic mixture of R and S acid, reacted with a single enantiomer of a chiral base, gives two diastereomeric salts with different solubilities; crystallization separates them; removing the resolving agent returns the two pure enantiomers.',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    const box = (x, y, w, h, kind, lines) => {
      let g = panel(x, y, w, h, { kind });
      lines.forEach((ln, i) => {
        g += text(x + w / 2, y + 26 + i * 19, ln[0], { cls: ln[1] || 'fg-lbl', size: ln[2] || 11.5 });
      });
      return g;
    };
    s += tag(380, 30, 'THE POINT IS TO TURN AN ENANTIOMERIC RELATIONSHIP INTO A DIASTEREOMERIC ONE');

    s += box(24, 60, 168, 96, 'warn', [
      ['(R)-acid', 'fg-lbl', 12],
      ['+  (S)-acid', 'fg-lbl', 12],
      ['inseparable', 'fg-tag-warn', 10.5],
    ]);
    s += text(108, 172, 'the racemate', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(200, 108), P(254, 108));
    s += text(227, 90, '+ (R)-base', { cls: 'fg-tag-good', size: 10 });
    s += text(214, 134, 'one enantiomer of', { cls: 'fg-sm', size: 9 });
    s += text(214, 148, 'a resolving agent', { cls: 'fg-sm', size: 9 });

    s += box(262, 46, 188, 60, 'hi', [
      ['(R)-acid · (R)-base', 'fg-lbl', 11.5],
      ['less soluble', 'fg-tag-good', 10],
    ]);
    s += box(262, 118, 188, 60, 'hi', [
      ['(S)-acid · (R)-base', 'fg-lbl', 11.5],
      ['more soluble', 'fg-tag-good', 10],
    ]);
    s += text(356, 196, 'two salts, and they are DIASTEREOMERS', { cls: 'fg-tag', size: 10.5 });
    s += text(356, 212, 'so their solubilities differ — ordinary crystallization separates them', { cls: 'fg-sm', size: 9.5 });

    s += arrow(P(458, 76), P(512, 76));
    s += arrow(P(458, 148), P(512, 148));
    s += text(485, 58, 'crystallize', { cls: 'fg-sm', size: 9 });

    s += box(520, 46, 216, 60, 'good', [
      ['(R)-acid, pure', 'fg-lbl', 11.5],
      ['after the base is washed out', 'fg-sm', 9.5],
    ]);
    s += box(520, 118, 216, 60, 'good', [
      ['(S)-acid, pure', 'fg-lbl', 11.5],
      ['after the base is washed out', 'fg-sm', 9.5],
    ]);

    s += rule(24, 238, 736, 238);
    s += text(380, 266, 'Step 2 is the whole trick: only the acid half is inverted between the two salts, not the base half,', { cls: 'fg-sm', size: 10 });
    s += text(380, 286, 'so they are diastereomers — different lattice energies, different solubilities, different melting points.', { cls: 'fg-sm', size: 10 });
    s += text(380, 314, 'Chiral chromatography does the same thing without isolating anything: the stationary phase is a single enantiomer.', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Resolution in four moves. Nothing in the first box can be separated, because every ordinary property of the two acids is identical. Add <b>one enantiomer</b> of a chiral base and the two salts that form are no longer mirror images — one is (R)&middot;(R) and the other (S)&middot;(R) — so they are diastereomers, and diastereomers crystallize apart.',
  note: 'Notice what the resolving agent has to be: a single enantiomer, not a racemate. Adding racemic base would give four salts in two enantiomeric pairs and leave you exactly where you started. Pasteur’s 1848 separation was the crude version of this — the two crystal forms of a tartrate salt happened to be visibly different, and he picked them apart with tweezers.',
});

export default FIGURES;
