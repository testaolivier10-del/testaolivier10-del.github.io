/* Figures for the mass-spec notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* A stick, for the three spectra that are line spectra rather than traces. */
function stick(x, yBase, h, cls = 'fg-bond', w = 2.6) {
  return `<line class="${cls}" x1="${n2(x)}" y1="${n2(yBase)}" x2="${n2(x)}" y2="${n2(yBase - h)}" stroke-width="${w}"></line>`;
}


const FIGURES = [];

/* ----------------------------------------------------------- mass spec ---
   Two spectra: one that shows what a base peak is and where it comes from,
   and one that shows the halogen isotope pattern on a real fragment pattern
   rather than as a two-bar cartoon. */
FIGURES.push({
  id: 'ms-spectra-butanone-bromoethane',
  section: 'mass-spec',
  anchor: 'applied to a different question.</div>',
  alt: 'Two mass spectra drawn as bar charts. The upper one, of 2-butanone, has its tallest bar at m/z 43 labeled base peak, a bar at about a quarter height at m/z 72 labeled molecular ion, smaller bars at 57 and 29, and a hairline at 73 labeled M+1. The lower one, of bromoethane, has its tallest bar at m/z 29 and a pair of bars of almost equal height at m/z 108 and 110, labeled M and M+2 for one bromine.',
  viewBox: '0 0 760 540',
  build() {
    let s = '';
    const panelA = (base, X, bars) => {
      let out = rule(70, base, 716, base) + rule(70, base, 70, base - 140);
      for (const t of [100, 50, 0]) {
        out += rule(64, base - t * 1.3, 70, base - t * 1.3);
        out += text(60, base - t * 1.3 + 4, String(t), { cls: 'fg-sm', size: 9.5, anchor: 'end' });
      }
      for (const b of bars) out += stick(X(b[0]), base, Math.max(b[1] * 1.3, 1.5), b[2] || 'fg-bond', 4);
      return out;
    };
    /* ---- 2-butanone ---- */
    const XA = (m) => 70 + ((m - 10) / 70) * 620;
    const baseA = 206;
    s += text(74, 40, '2-butanone, CH₃–CO–CH₂–CH₃ (M = 72)', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += panelA(baseA, XA, [[15, 6], [27, 16], [29, 24], [43, 100], [57, 8], [72, 25], [73, 1.1]]);
    for (const m of [20, 30, 40, 50, 60, 70, 80]) {
      s += rule(XA(m), baseA, XA(m), baseA + 6);
      s += text(XA(m), baseA + 20, String(m), { cls: 'fg-sm', size: 9.5 });
    }
    s += text(XA(45), baseA + 40, 'm/z', { cls: 'fg-sm', size: 10 });
    s += `<text class="fg-sm" x="30" y="140" text-anchor="middle" transform="rotate(-90 30 140)">relative abundance (%)</text>`;
    s += text(XA(43), 60, 'base peak — CH₃CO⁺ at 43,', { cls: 'fg-tag', size: 11 });
    s += text(XA(43), 76, 'left behind when the ethyl radical goes', { cls: 'fg-sm', size: 10 });
    s += `<line class="fg-dash-hi" x1="${n2(XA(43))}" y1="84" x2="${n2(XA(43))}" y2="${n2(baseA - 136)}"></line>`;
    s += text(XA(72), 126, 'M⁺• = 72', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(XA(72), 142, 'the molecular ion', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += `<line class="fg-dash-hi" x1="${n2(XA(72) - 2)}" y1="150" x2="${n2(XA(72) - 2)}" y2="${n2(baseA - 36)}"></line>`;
    s += text(XA(57), 182, '57, CH₃CH₂CO⁺', { cls: 'fg-sm', size: 10, anchor: 'middle' });
    s += text(XA(29), 150, '29, C₂H₅⁺', { cls: 'fg-sm', size: 10 });
    s += text(716, 108, 'M+1 at 73 — the ¹³C shadow, ~4% of M', { cls: 'fg-tag-mut', size: 10, anchor: 'end' });
    s += `<line class="fg-dash" x1="656" y1="114" x2="${n2(XA(73) + 3)}" y2="${n2(baseA - 8)}"></line>`;

    /* ---- bromoethane ---- */
    const XB = (m) => 70 + ((m - 10) / 110) * 620;
    const baseB = 470;
    s += text(74, 296, 'bromoethane, CH₃CH₂Br (M = 108)', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += panelA(baseB, XB, [[26, 10], [27, 52], [29, 100], [93, 5], [95, 5], [108, 45], [110, 44]]);
    for (const m of [20, 40, 60, 80, 100, 120]) {
      s += rule(XB(m), baseB, XB(m), baseB + 6);
      s += text(XB(m), baseB + 20, String(m), { cls: 'fg-sm', size: 9.5 });
    }
    s += text(XB(65), baseB + 38, 'm/z', { cls: 'fg-sm', size: 10 });
    s += `<text class="fg-sm" x="30" y="404" text-anchor="middle" transform="rotate(-90 30 404)">relative abundance (%)</text>`;
    s += text(XB(29), 314, 'base peak 29 — C₂H₅⁺, the bromine radical lost', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += `<line class="fg-dash-hi" x1="${n2(XB(29))}" y1="322" x2="${n2(XB(29))}" y2="${n2(baseB - 136)}"></line>`;
    s += text(XB(109), 372, 'M at 108 and M+2 at 110,', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(XB(109), 388, 'almost exactly equal — one bromine', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += `<line class="fg-dash-hi" x1="${n2(XB(109))}" y1="396" x2="${n2(XB(109))}" y2="${n2(baseB - 62)}"></line>`;
    s += text(394, 530, 'Highest mass is not tallest: 72 and 108 give the weight, 43 and 29 give the weakest bond.', { cls: 'fg-lbl', size: 12.5 });
    return s;
  },
  caption: 'One spectrum each, and in both of them the two peaks that matter are not the same peak. The <b>molecular ion</b> at the right-hand end of each trace gives the molecular weight &mdash; 72 and 108. The <b>base peak</b> is the tallest, and in both cases it is a fragment: the acylium ion left when 2-butanone loses its ethyl radical, and the ethyl cation left when bromoethane loses its bromine. Reading from high mass down is reading the molecule coming apart.',
  note: 'The bromoethane trace is what &ldquo;M and M+2, roughly 1:1&rdquo; looks like when it is not a cartoon: two bars of nearly equal height, two units apart, at the top of the spectrum. A single chlorine would give the same pair at 3:1 instead, and no halogen at all leaves M standing alone.',
});

export default FIGURES;
