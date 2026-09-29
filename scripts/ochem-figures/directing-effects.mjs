/* Figures for the directing-effects notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ 5 ---
   Where the charge goes in the sigma complex. The hardest idea in Module 13
   and the one most obviously a picture. */
FIGURES.push({
  id: 'directing-charge',
  section: 'directing-effects',
  anchor: '<h3>The question</h3>',
  alt: 'Positive charge positions in the sigma complex for ortho, meta and para attack',
  viewBox: '0 0 760 356',
  build() {
    let s = '';
    const ring = (cx, cy, r) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
      }
      return pts;
    };
    /* Vertex 0 is the top and carries G. The electrophile adds at `attacked`,
       making that carbon sp3; the cation is then shared over the three
       carbons ortho and para TO THE ATTACKED ONE. Working those out from the
       attack position rather than hard-coding them is what keeps the meta
       panel honest — and G gets its own position outside the ring, because
       drawing it on the vertex put the substituent on top of a + sign. */
    const panels = [
      { x: 150, title: 'attack ORTHO', attacked: 1 },
      { x: 380, title: 'attack META',  attacked: 2 },
      { x: 610, title: 'attack PARA',  attacked: 3 },
    ];
    panels.forEach((p) => {
      const pts = ring(p.x, 166, 48);
      const charged = [(p.attacked + 1) % 6, (p.attacked + 3) % 6, (p.attacked + 5) % 6];
      const hitsG = charged.includes(0);
      s += tag(p.x, 66, p.title);
      for (let i = 0; i < 6; i++) s += bond(pts[i], pts[(i + 1) % 6], { rFrom: 14, rTo: 14 });
      for (let i = 0; i < 6; i++) {
        if (i === p.attacked) {
          s += atom(pts[i].x, pts[i].y, 'sp³', { kind: 'plain', r: 15, size: 9.5 });
        } else if (charged.includes(i)) {
          s += atom(pts[i].x, pts[i].y, '+', { kind: 'warn', r: 14 });
        }
      }
      // G hangs off vertex 0 on a bond of its own.
      s += bond(pts[0], P(p.x, 166 - 48 - 36), { rFrom: 14, rTo: 15 });
      s += atom(p.x, 166 - 48 - 36, 'G', { kind: 'hi', r: 15 });
      // And the electrophile hangs off the carbon it added to.
      const a = pts[p.attacked];
      const ux = (a.x - p.x) / 48, uy = (a.y - 166) / 48;
      s += bond(a, P(a.x + ux * 34, a.y + uy * 34), { rFrom: 15, rTo: 13, cls: 'fg-bond-hi' });
      s += atom(a.x + ux * 34, a.y + uy * 34, 'E', { kind: 'hi', r: 13, size: 11 });
      s += text(p.x, 284, hitsG ? '+ reaches the G carbon' : '+ never reaches it',
        { cls: hitsG ? 'fg-tag-good' : 'fg-tag-mut', size: 10.5 });
    });
    s += text(380, 318, 'A donating G is happy next to a +, so it steers the attack ortho and para.', { cls: 'fg-lbl', size: 12 });
    s += text(380, 340, 'A withdrawing G cannot bear one, and meta is the only attack that avoids it.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Directing effects are one observation about geography. In the sigma complex, the positive charge is shared over three ring carbons — and which three depends on where the electrophile attacked.',
  note: 'Attack ortho or para and one of the charged carbons is the one carrying the substituent. Attack meta and none of them is. So a group that <b>donates</b> wants the charge next to it and steers the electrophile ortho and para; a group that <b>withdraws</b> cannot bear a positive charge on its own carbon, and meta is the only attack that avoids putting one there. Nothing about this is memorized — it is read off the picture.',
});

/* The octet-complete contributor is the section's central claim and was made
   in a sentence. Drawn, ortho/para versus meta stops being a rule. */
FIGURES.push({
  id: 'donor-octet-structure',
  section: 'directing-effects',
  anchor: 'these groups are both <b>ortho/para directors</b> and <b>activators</b>.</p>',
  alt: 'Aniline arenium ions compared. The top row shows para attack in three structures: the charge on an ortho carbon, then on the carbon bearing the NH2 group with a curved arrow from the nitrogen lone pair, then a highlighted structure with a carbon-nitrogen double bond, the positive charge on nitrogen and every atom holding a complete octet. The bottom row shows meta attack in three structures where the charge never reaches the nitrogen-bearing carbon, followed by an empty crossed-out box.',
  viewBox: '0 0 760 512',
  build() {
    let s = '';
    const verts = (cx, cy, R) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        v.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
      }
      return v;   // 0 carries NH2, 1 & 5 ortho, 2 & 4 meta, 3 para
    };
    /* `hit` is the carbon the electrophile added to; `pos` is where the
       positive charge sits in this contributor; `nDouble` swaps the C-N bond
       for the octet-complete structure. */
    const unit = (cx, cy, R, hit, pos, doubles, nDouble) => {
      const v = verts(cx, cy, R), mid = P(cx, cy);
      let g = '';
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        if (doubles.includes(i)) g += ringDouble(v[i], v[j], mid, { inset: 9 });
        else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
      }
      const nh = P(cx, cy - R - 32);
      g += bond(v[0], nh, { rFrom: 0, rTo: 16, order: nDouble ? 2 : 1, gap: 3.6 });
      g += atom(nh.x, nh.y, 'NH₂', { kind: nDouble ? 'warn' : 'hi', r: 16, size: 10 });
      if (!nDouble) g += lonePair(nh.x, nh.y, 180, { dist: 24 });
      else g += text(nh.x + 25, nh.y - 10, '+', { cls: 'fg-warn', size: 16 });
      /* The attacked carbon goes sp3 and picks up the electrophile. */
      g += atom(v[hit].x, v[hit].y, 'sp³', { r: 14, size: 9.5 });
      const ux = (v[hit].x - cx) / R, uy = (v[hit].y - cy) / R;
      const e = P(v[hit].x + ux * 32, v[hit].y + uy * 32);
      g += bond(v[hit], e, { rFrom: 14, rTo: 13, cls: 'fg-bond-hi' });
      g += atom(e.x, e.y, 'E', { kind: 'hi', r: 13, size: 11 });
      if (pos !== null) {
        const p = v[pos];
        /* Straight out from the center, except on the carbon that carries the
           NH2 — there "out" is under the substituent, so the sign goes beside
           it instead of vanishing behind it. */
        if (pos === 0) g += text(cx - 26, cy - R + 6, '+', { cls: 'fg-warn', size: 17 });
        else {
          const px = (p.x - cx) / R, py = (p.y - cy) / R;
          g += text(p.x + px * 19, p.y + py * 19 + 5, '+', { cls: 'fg-warn', size: 17 });
        }
      }
      return g;
    };
    const dbl = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { muted: true }) + arrow(P(x2, y), P(x1, y), { muted: true });

    /* ---- row 1: attack PARA, and the charge can reach the nitrogen ---- */
    s += text(24, 42, 'ATTACK PARA (or ortho) — the charge reaches the nitrogen', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    s += panel(532, 50, 176, 198, { kind: 'hi' });
    const CY = 146, R1 = 44;
    s += unit(140, CY, R1, 3, 2, [0, 4], false);
    s += curve(P(162, 107), P(188, 142), { bow: -13 });
    s += unit(380, CY, R1, 3, 0, [1, 4], false);
    s += curve(P(352, 86), P(371, 99), { bow: -11 });
    s += unit(620, CY, R1, 3, null, [1, 4], true);
    s += dbl(216, 306, CY);
    s += dbl(444, 524, CY);
    s += text(140, 256, 'charge on an ortho carbon', { cls: 'fg-tag', size: 11 });
    s += text(380, 256, 'charge on the NH₂ carbon', { cls: 'fg-tag', size: 11 });
    s += text(620, 256, 'every atom octet-complete', { cls: 'fg-tag-good', size: 11 });
    s += rule(24, 280, 736, 280);

    /* ---- row 2: attack META, and it never does ---- */
    s += text(24, 304, 'ATTACK META — it never does', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });
    const CY2 = 396, R2 = 38;
    s += unit(140, CY2, R2, 2, 1, [3, 5], false);
    s += unit(340, CY2, R2, 2, 3, [0, 4], false);
    s += unit(540, CY2, R2, 2, 5, [0, 3], false);
    s += dbl(206, 274, CY2);
    s += dbl(406, 474, CY2);
    s += panel(618, 358, 78, 78);
    s += `<line class="fg-dash" x1="618" y1="358" x2="696" y2="436"></line>`;
    s += `<line class="fg-dash" x1="696" y1="358" x2="618" y2="436"></line>`;
    s += text(657, 456, 'no such', { cls: 'fg-tag-mut', size: 11 });
    s += text(657, 472, 'structure exists', { cls: 'fg-tag-mut', size: 11 });
    s += text(340, 500, 'three contributors, and the charge never once lands on the NH₂ carbon', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The whole of ortho/para direction is one extra box. Attack para (or ortho) and the positive charge can reach the carbon bearing the nitrogen &mdash; at which point the nitrogen&rsquo;s lone pair swings in, the C&ndash;N bond becomes a double bond, and <b>every atom in the molecule has a complete octet</b>. That structure is far lower in energy than any all-carbon cation, and it is why aniline brominates about 10⁵ times faster than benzene. Attack meta and the charge never reaches that carbon, so the box stays empty.',
  note: 'Do not count resonance structures &mdash; three against three is a tie, and the tie is exactly why counting fails here. Count the GOOD one. Ortho and para each get a fourth structure with full octets; meta gets none, and that single structure decides the question. The same drawing with NO₂ in place of NH₂ inverts it: there the charge reaching the substituted carbon is the disaster, and meta becomes the only tolerable attack.',
});

export default FIGURES;
