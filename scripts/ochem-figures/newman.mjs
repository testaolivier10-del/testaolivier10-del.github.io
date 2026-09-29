/* Figures for the newman notes page (and its lesson). Built by
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

/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${x}" cy="${y}" r="3.4"></circle>`;

const FIGURES = [];

/* ---------------------------------------------------------------- ch5.1 ---
   The conversion the section describes and never performs. */
FIGURES.push({
  id: 'structure-to-newman',
  section: 'newman',
  anchor: '<p class="step-body">Practical advice: identify the bond you are looking down before you draw anything, and label the front and back atoms on the original structure. Most Newman errors are not drawing errors but bookkeeping errors — a substituent placed on the wrong carbon.</p>',
  alt: 'A skeletal drawing of butane with the C2 to C3 bond highlighted and the front and back carbons labeled, and beside it the anti Newman projection obtained by sighting down that bond',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(180, 34, 'STEP 1 — MARK THE BOND, AND WHICH END IS WHICH');
    const c1 = P(58, 178), c2 = P(116, 144), c3 = P(174, 178), c4 = P(232, 144);
    s += bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += bond(c2, c3, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(c3, c4, { rFrom: 0, rTo: 0 });
    for (const p of [c1, c2, c3, c4]) s += atom(p.x, p.y, '', { kind: 'point' });
    s += text(58, 200, 'C1', { cls: 'fg-sm', size: 10 });
    s += text(232, 166, 'C4', { cls: 'fg-sm', size: 10 });
    s += text(116, 122, 'C2', { cls: 'fg-tag-warn', size: 11 });
    s += text(174, 202, 'C3', { cls: 'fg-tag', size: 11 });
    s += text(116, 108, 'FRONT', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(174, 218, 'BACK', { cls: 'fg-tag', size: 10.5 });
    s += text(150, 252, 'C2 carries CH₃ + H + H', { cls: 'fg-sm', size: 10 });
    s += text(150, 268, 'C3 carries CH₃ + H + H', { cls: 'fg-sm', size: 10 });

    s += arrow(P(296, 170), P(368, 170), { muted: true });
    s += text(332, 152, 'put your eye', { cls: 'fg-sm', size: 9.5 });
    s += text(332, 192, 'on the red bond', { cls: 'fg-sm', size: 9.5 });
    s += rule(398, 56, 398, 268);

    s += tag(578, 34, 'STEP 2 — DRAW WHAT EACH CARBON CARRIES');
    s += newman(578, 160, 46,
      [[0, 'CH₃'], [120, 'H'], [240, 'H']],
      [[60, 'H'], [180, 'CH₃'], [300, 'H']]);
    s += text(578, 268, 'anti — the two CH₃ groups 180° apart', { cls: 'fg-tag-good', size: 10.5 });
    return s;
  },
  caption: 'The one conversion this section is examined on, done once slowly. Notice that <b>nothing is decided in the drawing</b>: step 1 is pure bookkeeping — which carbon is front, which is back, and what each of them carries besides the bond you are sighting down — and step 2 only writes that bookkeeping out at 120° intervals.',
  note: 'Run it backwards and it is the same list. A Newman with CH₃/H/H on the dot and CH₃/H/H on the circle <i>is</i> butane sighted down C2–C3, and you can redraw the skeleton from it. Almost every mistake in this topic is a group put on the wrong one of the two carbons, which is why labelling front and back on the original structure is worth the five seconds.',
});

/* ---------------------------------------------------------------- ch5.2 ---
   All four butane conformers. The energy curve names four and draws two. */
FIGURES.push({
  id: 'butane-four-conformers',
  section: 'newman',
  anchor: '<p class="step-body">By symmetry there are two equivalent gauche conformations and two equivalent methyl/hydrogen eclipsed ones. The <b>anti</b> conformation is the global minimum, and butane spends roughly 70% of its time there at room temperature, with most of the rest in the two gauche forms.</p>',
  alt: 'The four named conformations of butane drawn as Newman projections in order of energy: anti, gauche, methyl-hydrogen eclipsed and syn',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    s += tag(380, 30, 'ONE ROTATION, FOUR NAMES — IN ORDER OF ENERGY');
    const panels = [
      { x: 108, name: 'anti', deg: '180°', kind: 'staggered', e: '0 (reference)', cls: 'fg-tag-good',
        front: [[0, 'CH₃'], [120, 'H'], [240, 'H']], back: [[60, 'H'], [180, 'CH₃'], [300, 'H']] },
      { x: 289, name: 'gauche', deg: '60°', kind: 'staggered', e: '+0.9', cls: 'fg-tag-good',
        front: [[0, 'CH₃'], [120, 'H'], [240, 'H']], back: [[60, 'CH₃'], [180, 'H'], [300, 'H']] },
      { x: 470, name: 'eclipsed', deg: '120°', kind: 'eclipsed', e: '+3.6', cls: 'fg-tag-warn',
        front: [[0, 'CH₃'], [120, 'H'], [240, 'H']], back: [[7, 'H'], [127, 'CH₃'], [247, 'H']] },
      { x: 651, name: 'syn', deg: '0°', kind: 'eclipsed', e: '+4.5 to 6', cls: 'fg-tag-warn',
        front: [[0, 'CH₃'], [120, 'H'], [240, 'H']], back: [[7, 'CH₃'], [127, 'H'], [247, 'H']] },
    ];
    for (const p of panels) {
      s += newman(p.x, 158, 40, p.front, p.back);
      s += text(p.x, 262, p.name + ' — ' + p.deg, { cls: p.cls, size: 11 });
      s += text(p.x, 280, p.kind, { cls: 'fg-sm', size: 9.5 });
      s += text(p.x, 300, p.e + ' kcal/mol', { cls: 'fg-lbl', size: 11 });
    }
    for (const x of [198, 379, 560]) s += rule(x, 62, x, 290);
    return s;
  },
  caption: 'The four conformers the table names, actually drawn. Read them left to right as one continuous 180° turn of the back carbon: the two methyls start apart, come to 60°, pass through each other twice, and meet head-on. The two <b>staggered</b> forms are dips and the two <b>eclipsed</b> forms are peaks, so a real sample is essentially a mixture of the first two.',
  note: 'The gauche panel is the one to study. It is staggered — every front bond sits in a gap — and it still costs 0.9 kcal/mol, because the two methyls are only 60° apart and are bumping into each other. That is steric strain with no torsional strain anywhere near it, which is why this drawing is the cleanest definition of the difference in the chapter.',
});

export default FIGURES;
