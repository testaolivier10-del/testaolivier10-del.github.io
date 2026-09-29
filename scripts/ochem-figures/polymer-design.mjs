/* Figures for the polymer-design notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

/* Shared drawing helpers, copied from the builder. */
/* An open retrosynthetic arrow between two points: a double shaft and a
   filled head, the way the retrosynthesis figure draws it by hand. */
function openArrow(a, b, opts = {}) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, px = -uy, py = ux;
  const g = opts.gap ?? 4, hl = opts.head ?? 16, hw = opts.width ?? 9;
  const r = (v) => Math.round(v * 100) / 100;
  const ex = b.x - ux * (hl - 2), ey = b.y - uy * (hl - 2);
  let o = '';
  for (const k of [-g, g]) {
    o += `<line class="fg-arrow" x1="${r(a.x + px * k)}" y1="${r(a.y + py * k)}" x2="${r(ex + px * k)}" y2="${r(ey + py * k)}"></line>`;
  }
  const bx = b.x - ux * hl, by = b.y - uy * hl;
  o += `<path class="fg-head" d="M${r(b.x)} ${r(b.y)} L${r(bx + px * hw)} ${r(by + py * hw)} L${r(bx - px * hw)} ${r(by - py * hw)} Z"></path>`;
  return o;
}

/* The squiggle that marks a disconnection, drawn across a bond at its
   midpoint so it reads as a cut through that bond and not as a bond. */
function squiggle(a, b, opts = {}) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L, px = -uy, py = ux;
  const half = opts.half ?? 20;
  let d = '';
  for (let i = 0; i <= 8; i++) {
    const t = -half + (i * half) / 4;
    const off = i % 2 === 0 ? 0 : (i % 4 === 1 ? 5 : -5);
    const x = mx + px * t + ux * off, y = my + py * t + uy * off;
    d += (i === 0 ? 'M' : 'L') + `${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100} `;
  }
  return `<path class="${opts.cls || 'fg-dash-hi'}" fill="none" d="${d.trim()}"></path>`;
}

const FIGURES = [];

/* ----------------------------------------------------------------- 52 ---
   The chapter ends on an argument rather than a fact, and the argument is
   visible in a recycling bin: one functional group decides everything. */
FIGURES.push({
  id: 'backbone-decides',
  section: 'polymer-design',
  anchor: '<h3>Biodegradable by design</h3>',
  viewBox: '0 0 760 320',
  alt: 'A polyester backbone with a cleavable ester bond beside a polyethylene backbone of identical C-C bonds',
  build() {
    let s = '';
    const col = (ox, title, kind) => { s += panel(ox, 46, 330, 128, { kind }); s += tag(ox + 165, 34, title); };
    col(24,  'an ester in the backbone', null);
    col(406, 'a C–C backbone', 'warn');

    // Left: ...C-C(=O)-O-C... with the cleavable bond marked.
    const pts = [P(70, 104), P(118, 104), P(166, 104), P(214, 104), P(262, 104)];
    s += atom(pts[0].x, pts[0].y, 'C', {});
    s += atom(pts[1].x, pts[1].y, 'C', { kind: 'hi' });
    s += atom(pts[2].x, pts[2].y, 'O', { kind: 'hi' });
    s += atom(pts[3].x, pts[3].y, 'C', {});
    s += atom(pts[4].x, pts[4].y, 'C', {});
    for (let i = 0; i < 4; i++) s += bond(pts[i], pts[i + 1]);
    s += atom(118, 58, 'O', {});
    s += bond(pts[1], P(118, 58), { order: 2 });
    s += text(142, 148, 'water can pick this bond out', { cls: 'fg-tag-good', size: 10.5 });

    // Right: an undifferentiated run of carbons.
    let px = 452;
    const cs = [];
    for (let i = 0; i < 5; i++) { cs.push(P(px, 104)); px += 48; }
    cs.forEach((c) => s += atom(c.x, c.y, 'C', {}));
    for (let i = 0; i < 4; i++) s += bond(cs[i], cs[i + 1]);
    s += text(548, 148, 'every bond is the same as every other', { cls: 'fg-tag', size: 10.5 });

    s += text(190, 196, 'PET, nylon, PLA', { cls: 'fg-lbl', size: 12 });
    s += text(190, 216, 'chemically recyclable; PLA composts', { cls: 'fg-sm', size: 10.5 });
    s += text(560, 196, 'polyethylene, polypropylene', { cls: 'fg-lbl', size: 12 });
    s += text(560, 216, 'melt-and-remold only, then landfill', { cls: 'fg-sm', size: 10.5 });

    s += rule(24, 246, 700, 246);
    s += text(360, 272, 'Both are thermoplastics, so both can be melted — but only one can be unmade.', { cls: 'fg-lbl', size: 12 });
    s += text(360, 294, 'The difference is one functional group, chosen with the monomer.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Why PET is the most recycled plastic and polyethylene the most landfilled. An ester in the backbone is a bond that hydrolysis can select out of all the others, so the polymer can be taken apart and rebuilt. A saturated C–C chain offers nothing to select.',
  note: 'The uncomfortable part is that this is not a failure of chemistry to solve. The properties that make a polyolefin cheap, inert and durable — an unreactive backbone with no functional group in it — are exactly the properties that make it permanent. Designing for degradability means deliberately building in a weakness, and the choice is made when someone picks the monomer, not at the recycling plant.',
});

/* ------------------------------------------------------------- 230.3 ---
   Reading a polymer backwards. The section gives three rules and a worked
   example in prose; this draws the rules, on polymers other than the one the
   worked example solves. */
FIGURES.push({
  id: 'polymer-disconnection',
  section: 'polymer-design',
  anchor: 'If the difference is not a whole number of waters, the disconnection is wrong.</div>',
  viewBox: '0 0 760 556',
  alt: 'Three polymers taken back to their monomers. Polypropylene: the repeat unit CH2–CH(CH3) in brackets, the two bonds that cross the brackets highlighted, and an open arrow to propene. PET: a stretch of chain with squiggles through the three carbonyl-to-oxygen bonds and a dashed mark labeled not here on an oxygen-to-CH2 bond; open arrows lead to ethylene glycol and terephthalic acid. Nylon 6,6: a stretch of chain with squiggles through the three carbonyl-to-nitrogen bonds; open arrows lead to hexamethylenediamine and adipic acid.',
  build() {
    let s = '';
    const brack = (x, y, h, dir) => {
      const t = y - h / 2, b = y + h / 2;
      return `<path class="fg-bond" d="M${x + 10 * dir} ${t} L${x} ${t} L${x} ${b} L${x + 10 * dir} ${b}"></path>`;
    };
    /* Labelled groups left to right; `gap` is the visible bond length. */
    const place = (x0, items, gap = 30) => {
      const out = [];
      let x = x0;
      for (const it of items) {
        x = out.length ? x + out[out.length - 1].r + gap + it.r : x + it.r;
        out.push({ x, ...it });
      }
      return out;
    };
    const run = (y, ps, cuts, ends) => {
      let o = '';
      o += text(ps[0].x - ps[0].r - 12, y + 5, '~', { cls: 'fg-lbl', size: 14, anchor: 'end' });
      o += text(ps[ps.length - 1].x + ps[ps.length - 1].r + 12, y + 5, '~', { cls: 'fg-lbl', size: 14, anchor: 'start' });
      for (let i = 0; i < ps.length - 1; i++) o += bond(P(ps[i].x, y), P(ps[i + 1].x, y), { rFrom: ps[i].r, rTo: ps[i + 1].r });
      for (const p of ps) o += atom(p.x, y, p.l, { r: p.r, size: p.size ?? (p.l.length > 3 ? 9 : p.l.length > 2 ? 9.5 : 12), kind: p.kind });
      for (const i of cuts) {
        const a = P(ps[i].x + ps[i].r, y), b = P(ps[i + 1].x - ps[i + 1].r, y);
        o += squiggle(a, b, { half: 18 });
      }
      return o;
    };

    /* ---- 1. addition: polypropylene back to propene ---- */
    s += tag(40, 36, 'ONLY CARBON IN THE BACKBONE', { anchor: 'start' });
    {
      const y = 80;
      s += brack(70, y, 56, 1);
      s += bond(P(56, y), P(112, y), { rFrom: 0, rTo: 18, cls: 'fg-bond-hi' });
      s += bond(P(112, y), P(176, y), { rFrom: 18, rTo: 15 });
      s += bond(P(176, y), P(232, y), { rFrom: 15, rTo: 0, cls: 'fg-bond-hi' });
      s += brack(218, y, 56, -1);
      s += text(228, y + 26, 'n', { cls: 'fg-lbl', size: 12, anchor: 'start' });
      s += bond(P(176, y), P(176, y + 44), { rFrom: 15, rTo: 17 });
      s += atom(112, y, 'CH₂', { r: 18 });
      s += atom(176, y, 'CH', { r: 15 });
      s += atom(176, y + 44, 'CH₃', { r: 17 });
      s += openArrow(P(270, y), P(334, y));
      s += bond(P(380, y), P(444, y), { order: 2, rFrom: 18, rTo: 15 });
      s += bond(P(444, y), P(444, y + 44), { rFrom: 15, rTo: 17 });
      s += atom(380, y, 'CH₂', { r: 18 });
      s += atom(444, y, 'CH', { r: 15 });
      s += atom(444, y + 44, 'CH₃', { r: 17 });
      s += text(412, y + 76, 'propene', { cls: 'fg-tag-good', size: 11 });
      s += text(500, y - 16, 'highlighted: the bonds that', { cls: 'fg-sm', size: 10, anchor: 'start' });
      s += text(500, y, 'cross the brackets, which', { cls: 'fg-sm', size: 10, anchor: 'start' });
      s += text(500, y + 16, 'the polymerization made.', { cls: 'fg-sm', size: 10, anchor: 'start' });
      s += text(500, y + 32, 'The bond between them was', { cls: 'fg-sm', size: 10, anchor: 'start' });
      s += text(500, y + 48, 'the C=C. Put it back.', { cls: 'fg-sm', size: 10, anchor: 'start' });
      s += text(144, y + 76, 'polypropylene', { cls: 'fg-sm', size: 10 });
    }
    s += rule(24, 176, 736, 176);

    /* ---- 2. a polyester: PET ---- */
    s += tag(40, 204, 'AN ESTER IN THE BACKBONE', { anchor: 'start' });
    {
      const y = 246;
      const ps = place(70, [
        { l: 'CO', r: 17 }, { l: 'O', r: 15 }, { l: 'CH₂CH₂', r: 29 }, { l: 'O', r: 15 },
        { l: 'CO', r: 17 }, { l: 'C₆H₄', r: 25 }, { l: 'CO', r: 17 }, { l: 'O', r: 15 },
      ]);
      s += run(y, ps, [0, 3, 6]);
      // the wrong cut: oxygen to CH2
      const wa = ps[1].x + ps[1].r, wb = ps[2].x - ps[2].r, wm = (wa + wb) / 2;
      s += `<line class="fg-dash" x1="${wm}" y1="${y - 18}" x2="${wm}" y2="${y + 18}"></line>`;
      s += text(wm, y - 26, 'not here', { cls: 'fg-tag-warn', size: 10 });
      s += text((ps[0].x + ps[1].x) / 2, y + 36, 'cut', { cls: 'fg-tag', size: 10 });
      s += text((ps[3].x + ps[4].x) / 2, y + 36, 'cut', { cls: 'fg-tag', size: 10 });
      s += text((ps[6].x + ps[7].x) / 2, y + 36, 'cut', { cls: 'fg-tag', size: 10 });
      s += text(ps[5].x, y + 36, 'para', { cls: 'fg-sm', size: 9.5 });
      const diolX = ps[2].x, acidX = ps[5].x;
      s += openArrow(P(diolX, y + 44), P(diolX, y + 80));
      s += openArrow(P(acidX, y + 44), P(acidX, y + 80));
      s += text(diolX, y + 102, 'HO–CH₂CH₂–OH', { cls: 'fg-lbl', size: 12 });
      s += text(diolX, y + 118, 'ethylene glycol, a diol', { cls: 'fg-tag-good', size: 10 });
      s += text(acidX, y + 102, 'HO₂C–C₆H₄–CO₂H', { cls: 'fg-lbl', size: 12 });
      s += text(acidX, y + 118, 'terephthalic acid, a diacid', { cls: 'fg-tag-good', size: 10 });
      s += text(736, 204, 'cut C(=O)–O: OH to the carbonyl, H to the O', { cls: 'fg-sm', size: 10, anchor: 'end' });
    }
    s += rule(24, 380, 736, 380);

    /* ---- 3. a polyamide: nylon 6,6 ---- */
    s += tag(40, 408, 'AN AMIDE IN THE BACKBONE', { anchor: 'start' });
    {
      const y = 444;
      const ps = place(70, [
        { l: 'CO', r: 17 }, { l: 'NH', r: 18 }, { l: '(CH₂)₆', r: 28 }, { l: 'NH', r: 18 },
        { l: 'CO', r: 17 }, { l: '(CH₂)₄', r: 28 }, { l: 'CO', r: 17 }, { l: 'NH', r: 18 },
      ], 26);
      s += run(y, ps, [0, 3, 6]);
      const amX = ps[2].x, acX = ps[5].x;
      s += openArrow(P(amX, y + 26), P(amX, y + 52));
      s += openArrow(P(acX, y + 26), P(acX, y + 52));
      s += text(amX, y + 74, 'H₂N–(CH₂)₆–NH₂', { cls: 'fg-lbl', size: 12 });
      s += text(amX, y + 90, 'hexamethylenediamine, a diamine', { cls: 'fg-tag-good', size: 10 });
      s += text(acX, y + 74, 'HO₂C–(CH₂)₄–CO₂H', { cls: 'fg-lbl', size: 12 });
      s += text(acX, y + 90, 'adipic acid, a diacid', { cls: 'fg-tag-good', size: 10 });
      s += text(736, 408, 'cut C(=O)–N: OH to the carbonyl, H to the N', { cls: 'fg-sm', size: 10, anchor: 'end' });
    }
    return s;
  },
  caption: 'Three polymers read backwards. For a carbon-only backbone, the bonds that cross the repeat-unit brackets are the ones the polymerization made, and the bond between them goes back to a C=C. For a polyester or polyamide, draw enough chain to show two full linkages, cut at every carbonyl-to-heteroatom bond, and check that each piece has two reactive ends.',
  note: 'The PET row repeats the arithmetic from the box above: the cut stretch contains two ester linkages per repeat unit, so the diol and the diacid together weigh two waters more than the repeat unit. The dashed mark shows the cut to avoid: cut every O–CH₂ bond instead and both oxygens stay with the acid piece, leaving a CH₂CH₂ piece with no oxygen on either end and so no reactive site at all. The nylon row is nylon 6,6, and its pieces are hexamethylenediamine and adipic acid.',
});

export default FIGURES;
