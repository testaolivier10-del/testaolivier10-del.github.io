/* Figures for the orbitals notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- F6 ---
   The fill order as a ladder. The section argues 4s below 3d in prose and
   gives a reader nothing to look at; this is the argument as a picture,
   with the n=2 count that the octet rule rests on marked on it. */
FIGURES.push({
  id: 'orbital-energy-ladder',
  section: 'orbitals',
  anchor: '<h3>Why the periodic table has that stair-step shape</h3>',
  viewBox: '0 0 760 340',
  alt: 'An energy ladder of orbitals from 1s at the bottom to 3d at the top, with each subshell drawn as its boxes: one box for each s, three for each p, five for 3d. The 4s rung is drawn below the 3d rung, and the 2s and 2p rungs are bracketed together and labeled as the four orbitals that make the octet.',
  build() {
    let s = '';
    const rungs = [
      { y: 300, name: '1s', boxes: 1 },
      { y: 254, name: '2s', boxes: 1 },
      { y: 216, name: '2p', boxes: 3 },
      { y: 166, name: '3s', boxes: 1 },
      { y: 130, name: '3p', boxes: 3 },
      { y: 86,  name: '4s', boxes: 1 },
      { y: 52,  name: '3d', boxes: 5 },
    ];
    s += arrow(P(60, 318), P(60, 36));
    s += text(36, 176, 'energy', { cls: 'fg-tag', size: 11, anchor: 'middle' });
    for (const r of rungs) {
      const w = 26, gap = 5, x0 = 150;
      for (let i = 0; i < r.boxes; i++) {
        s += `<rect class="fg-panel" x="${x0 + i * (w + gap)}" y="${r.y - 12}" width="${w}" height="22" rx="4"></rect>`;
      }
      s += text(126, r.y + 4, r.name, { cls: 'fg-lbl', size: 12.5, anchor: 'end' });
      s += text(x0 + r.boxes * (w + gap) + 8, r.y + 4,
                r.boxes === 1 ? '1 orbital · holds 2' : r.boxes + ' orbitals · hold ' + (r.boxes * 2),
                { cls: 'fg-sm', size: 10, anchor: 'start' });
    }
    // The n = 2 bracket: four orbitals, eight electrons, the octet.
    s += `<rect class="fg-fill-hi" x="140" y="200" width="200" height="70" rx="8" opacity="0.14"></rect>`;
    s += text(414, 232, 'n = 2: one 2s + three 2p = 4 orbitals, 8 electrons', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += text(414, 250, 'this, and nothing else, is the octet rule', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    // The inversion.
    s += text(414, 72, '4s sits BELOW 3d — an s electron penetrates', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    s += text(414, 90, 'closer to the nucleus, so it is shielded less', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(414, 108, 'and held harder. Potassium fills 4s first.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += rule(60, 326, 740, 326);
    s += text(400, 338, 'Fill from the bottom, one electron per box across a rung before any box doubles up.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The filling order as a ladder rather than a sentence. Two things are worth reading off it. The n = 2 shell is four boxes wide — one 2s and three 2p — and four boxes hold eight electrons, which is the whole of the octet rule. And the 4s rung sits below the 3d rung even though 4 is larger than 3, which is why the d-block starts in row 4.',
  note: 'The rung widths are the part to remember. An s subshell is always one orbital, a p always three, a d always five, whatever shell they belong to — so the maximum occupancy of any subshell is just twice its width, and a shell’s capacity is the sum of its rungs: 2 for n = 1, 8 for n = 2, 18 for n = 3.',
});

export default FIGURES;
