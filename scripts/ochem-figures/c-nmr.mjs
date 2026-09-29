/* Figures for the c-nmr notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* A stick, for the three spectra that are line spectra rather than traces. */
function stick(x, yBase, h, cls = 'fg-bond', w = 2.6) {
  return `<line class="${cls}" x1="${n2(x)}" y1="${n2(yBase)}" x2="${n2(x)}" y2="${n2(yBase - h)}" stroke-width="${w}"></line>`;
}


const FIGURES = [];

/* ------------------------------------------------------------ 13C/DEPT ---
   Butan-2-one, the compound the section's own worked example solves, and the
   only way to show what "up", "down" and "absent" mean. */
FIGURES.push({
  id: 'c-nmr-dept-butanone',
  section: 'c-nmr',
  anchor: 'with no multiplets to untangle.</p>',
  alt: 'The carbon-13 and DEPT-135 spectra of butan-2-one drawn one above the other on a shared chemical shift axis running from 220 ppm on the left to 0 on the right. The upper decoupled spectrum has four lines, at 209, 37, 29 and 8 ppm, plus a small gray three-line solvent signal at 77. The lower DEPT spectrum has lines pointing up at 29 and 8 labeled CH3, a line pointing down at 37 labeled CH2, and a dashed gray ghost at 209 labeled absent, quaternary.',
  viewBox: '0 0 760 476',
  build() {
    const X = (d) => 80 + ((220 - d) / 220) * 620;
    let s = '';
    const top = 170;
    s += text(74, 54, 'standard proton-decoupled ¹³C — four lines, so four carbon environments', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += rule(70, top, 716, top);
    for (const [d, lbl] of [[209, '209'], [37, '37'], [29, '29'], [8, '8']]) {
      s += stick(X(d), top, 80, 'fg-bond', 3);
      s += text(X(d), top - 88, lbl, { cls: 'fg-lbl', size: 11.5 });
    }
    s += text(X(209) + 12, top - 62, 'C=O', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    /* the solvent line nobody warns you about */
    for (const k of [-5, 0, 5]) s += stick(X(77) + k, top, 24, 'fg-bond-soft', 2);
    s += text(X(77), top - 34, 'CDCl₃ — the solvent, 77 ppm. Ignore it.', { cls: 'fg-tag-mut', size: 10.5 });

    s += `<line class="fg-dash" x1="60" y1="212" x2="716" y2="212"></line>`;

    const mid = 322;
    s += text(74, 246, 'DEPT-135 — the same carbons, now with their hydrogen counts', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += rule(70, mid, 716, mid);
    s += stick(X(29), mid, 64, 'fg-bond', 3);
    s += stick(X(8), mid, 64, 'fg-bond', 3);
    s += text(X(29), mid - 74, 'CH₃', { cls: 'fg-tag', size: 11 });
    s += text(X(8), mid - 74, 'CH₃', { cls: 'fg-tag', size: 11 });
    s += stick(X(37), mid, -52, 'fg-bond', 3);
    s += text(X(37), mid + 68, 'CH₂', { cls: 'fg-tag', size: 11 });
    s += `<line class="fg-dash" x1="${n2(X(209))}" y1="${mid}" x2="${n2(X(209))}" y2="${mid - 52}"></line>`;
    s += text(X(209) + 10, mid - 62, 'absent — quaternary', { cls: 'fg-tag-mut', size: 10.5, anchor: 'start' });
    s += text(X(209) + 10, mid - 46, 'no attached H', { cls: 'fg-sm', size: 9.5, anchor: 'start' });

    const ax = 414;
    s += rule(70, ax, 716, ax);
    for (const d of [220, 200, 150, 100, 50, 0]) {
      s += rule(X(d), ax, X(d), ax + 6);
      s += text(X(d), ax + 20, String(d), { cls: 'fg-sm', size: 9.5 });
    }
    s += text(394, 450, 'chemical shift δ (ppm) — δ decreasing to the right', { cls: 'fg-sm', size: 10.5 });
    s += text(394, 470, 'butan-2-one, CH₃–CO–CH₂–CH₃', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'The same molecule twice. The top spectrum counts environments: four lines for four carbons, so there is no symmetry anywhere in the molecule. The bottom one puts hydrogens on them &mdash; two methyls pointing up, one CH₂ pointing down, and a gap where the carbonyl was. Together they give CH₃&ndash;CO&ndash;CH₂&ndash;CH₃ without a single multiplet to untangle.',
  note: 'Up for CH and CH₃, down for CH₂, missing for a carbon with no hydrogens. A peak present in the top spectrum and absent from the bottom one is how you find a quaternary carbon &mdash; and the gray line at 77 is the solvent, not your compound.',
});

export default FIGURES;
