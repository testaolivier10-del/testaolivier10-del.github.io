/* LevlPrep studio face rig (2026-10-21, studio system section 5).
   A parametric 2D face in style B: brows (raise, inner tilt), upper and lower lids (blink, half close),
   irises and pupils that track a target and dart (saccades), cheeks that lift with a smile or wince, and a mouth
   built from parameters so every shape blends smoothly into the next (no snapping between drawings).

   Mouth shapes come from Rhubarb Lip Sync cues (A..H, X) read from the narration audio.
   Expressions are named parameter sets blended over time; acting rules are built in:
   eyes move before the head, a blink when an expression changes, expressions build, hold and settle.

   new LPFace(group, design, timeline)
     design:   positions and colors for this character (see DEFAULT_DESIGN)
     timeline: {mouth: [{start, end, value}], expr: [[t, name, blendSeconds]], look: [[t, x, y]], seed, blinkEvery}
   face.draw(t) -> updates the group; place the group on the head bone with LPRig.attach. */
(function (G) {
  const NS = "http://www.w3.org/2000/svg";
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = (u) => u * u * (3 - 2 * u);

  // Rhubarb shapes as mouth parameters: width, open, round (pucker), smile, teeth (0..1), tongue (0..1)
  const VIS = {
    X: { w: 1.00, o: 0.00, r: 0.0, s: 0.10, te: 0.0, to: 0.0 },   // rest
    A: { w: 0.96, o: 0.00, r: 0.0, s: 0.00, te: 0.0, to: 0.0 },   // M B P: lips pressed
    B: { w: 1.02, o: 0.22, r: 0.0, s: 0.10, te: 1.0, to: 0.0 },   // most consonants: slightly open, teeth
    C: { w: 1.08, o: 0.45, r: 0.0, s: 0.10, te: 0.8, to: 0.0 },   // EH AE
    D: { w: 1.06, o: 0.85, r: 0.0, s: 0.00, te: 0.5, to: 0.3 },   // AA: wide open
    E: { w: 0.80, o: 0.55, r: 0.6, s: 0.00, te: 0.2, to: 0.0 },   // AO ER: rounded
    F: { w: 0.62, o: 0.28, r: 1.0, s: 0.00, te: 0.0, to: 0.0 },   // UW OW W: puckered
    G: { w: 1.00, o: 0.16, r: 0.0, s: 0.00, te: 1.0, to: 0.0 },   // F V: teeth on lip
    H: { w: 1.02, o: 0.42, r: 0.0, s: 0.05, te: 0.6, to: 1.0 },   // L: tongue up
  };
  // expressions: brow raise (+up), brow inner tilt (+ worried, - angry), upper lid (0 open..1 closed), lower lid lift,
  // smile, cheek lift, mouth corner tension
  const EXPR = {
    neutral:   { br: 0.0, bt: 0.0, ul: 0.12, ll: 0.0, sm: 0.10, ch: 0.0 },
    focused:   { br: -0.25, bt: -0.15, ul: 0.28, ll: 0.25, sm: 0.0, ch: 0.1 },
    concerned: { br: 0.35, bt: 0.75, ul: 0.10, ll: 0.10, sm: -0.25, ch: 0.0 },
    worried:   { br: 0.55, bt: 1.0, ul: 0.0, ll: 0.0, sm: -0.4, ch: 0.0 },
    relieved:  { br: 0.25, bt: 0.2, ul: 0.32, ll: 0.2, sm: 0.45, ch: 0.4 },
    warm:      { br: 0.15, bt: 0.1, ul: 0.22, ll: 0.3, sm: 0.6, ch: 0.6 },
    surprised: { br: 1.0, bt: 0.2, ul: -0.15, ll: 0.0, sm: 0.0, ch: 0.0 },
    wince:     { br: -0.4, bt: 0.6, ul: 0.65, ll: 0.5, sm: -0.5, ch: 0.7 },
  };
  const DEFAULT_DESIGN = {
    eyeL: [-48, 0], eyeR: [48, 0], eyeW: 36, eyeH: 21, iris: 11, pupil: 5,
    browY: -34, browW: 40, mouthY: 70, mouthW: 46, cheekY: 40,
    skin: "#cf9068", skinD: "#a96d4c", lid: "#c07f5b", lash: "#2a1d1a", white: "#f7f1ea", irisC: "#4a2c1e",
    pupilC: "#140b08", brow: "#2a1d1a", lip: "#9c4b42", lipD: "#6e2e2a", inner: "#3a1418", teeth: "#f6f2ea",
    tongue: "#c75b5b", blush: "#e07c6a",
  };

  // deterministic random from a seed
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  class Face {
    constructor(group, design, tl) {
      this.g = group; this.D = Object.assign({}, DEFAULT_DESIGN, design || {}); this.tl = tl || {};
      const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); group.appendChild(e); return e; };
      const D = this.D;
      this.el = {};
      for (const side of ["L", "R"]) {
        const cp = document.createElementNS(NS, "clipPath"); cp.id = (this.tl.id || "f") + "_eye" + side;
        const cpath = document.createElementNS(NS, "path"); cp.appendChild(cpath);
        group.appendChild(cp);
        this.el["clip" + side] = cpath;
        this.el["white" + side] = mk("path", { fill: D.white });
        const ig = mk("g", { "clip-path": `url(#${cp.id})` });
        this.el["iris" + side] = document.createElementNS(NS, "circle"); this.el["iris" + side].setAttribute("fill", D.irisC); ig.appendChild(this.el["iris" + side]);
        this.el["pupil" + side] = document.createElementNS(NS, "circle"); this.el["pupil" + side].setAttribute("fill", D.pupilC); ig.appendChild(this.el["pupil" + side]);
        this.el["glint" + side] = document.createElementNS(NS, "circle"); this.el["glint" + side].setAttribute("fill", "#fff"); ig.appendChild(this.el["glint" + side]);
        this.el["ulid" + side] = mk("path", { fill: D.lid });
        this.el["lash" + side] = mk("path", { fill: "none", stroke: D.lash, "stroke-width": 4.5, "stroke-linecap": "round" });
        this.el["llid" + side] = mk("path", { fill: D.lid, opacity: 0.9 });
        this.el["brow" + side] = mk("path", { fill: D.brow });
        this.el["cheek" + side] = mk("ellipse", { fill: D.blush, opacity: 0 });
      }
      this.el.mouthIn = mk("path", { fill: D.inner });
      this.el.teeth = mk("path", { fill: D.teeth });
      this.el.tongue = mk("path", { fill: D.tongue });
      this.el.lips = mk("path", { fill: D.lip });
      this.el.lipLine = mk("path", { fill: "none", stroke: D.lipD, "stroke-width": 3, "stroke-linecap": "round" });
      // procedural schedules: blinks and saccades, deterministic
      const r = rng(this.tl.seed || 7); this.blinks = []; this.darts = [];
      let t = 0.6 + r() * 1.5;
      while (t < 600) { this.blinks.push(t); t += (this.tl.blinkEvery || 3.2) * (0.55 + r() * 0.9); }
      for (const e of this.tl.expr || []) this.blinks.push(e[0] - 0.05);     // a blink when the thought changes
      this.blinks.sort((a, b) => a - b);
      t = 0.3; while (t < 600) { this.darts.push([t, (r() - 0.5) * 3.2, (r() - 0.5) * 2.2]); t += 0.6 + r() * 1.8; }
    }

    exprAt(t) {
      const ex = this.tl.expr || [["0", "neutral", 0]]; let cur = EXPR.neutral, prev = EXPR.neutral, u = 1;
      for (let i = 0; i < ex.length; i++) {
        if (t >= ex[i][0]) { prev = i ? EXPR[ex[i - 1][1]] : EXPR.neutral; cur = EXPR[ex[i][1]]; u = sm(Math.min(1, (t - ex[i][0]) / Math.max(0.01, ex[i][2] || 0.4))); }
      }
      const o = {}; for (const k in cur) o[k] = lerp(prev[k], cur[k], u); return o;
    }

    mouthAt(t) {
      const cues = this.tl.mouth || []; let i = cues.findIndex((c) => t >= c.start && t < c.end);
      if (i < 0) return VIS.X;
      const c = cues[i], next = cues[i + 1];
      const cur = VIS[c.value] || VIS.X;
      // blend into the next shape over the last 70 ms (co-articulation), out of the previous over the first 50
      const out = {}; const k2 = next ? VIS[next.value] || VIS.X : cur;
      const u = next ? sm(Math.max(0, Math.min(1, (t - (c.end - 0.07)) / 0.07))) : 0;
      for (const k in cur) out[k] = lerp(cur[k], k2[k], u);
      return out;
    }

    blinkAt(t) {                               // 0 open .. 1 closed: fast close, slower open
      let b = 0;
      for (const s of this.blinks) {
        const d = t - s; if (d < -0.01 || d > 0.32) continue;
        b = Math.max(b, d < 0.07 ? sm(d / 0.07) : 1 - sm((d - 0.07) / 0.25));
      }
      return b;
    }

    lookAt(t) {
      let base = [0, 0];
      const lk = this.tl.look; if (lk && lk.length) {
        for (let i = 0; i < lk.length; i++) if (t >= lk[i][0]) {
          const nx = lk[i]; const pv = i ? lk[i - 1] : [0, 0, 0];
          const u = sm(Math.min(1, (t - nx[0]) / 0.12));          // eyes move fast, before the head
          base = [lerp(pv[1], nx[1], u), lerp(pv[2], nx[2], u)];
        }
      }
      let dx = 0, dy = 0;
      for (const d of this.darts) if (t >= d[0]) { dx = d[1]; dy = d[2]; }
      return [base[0] + dx, base[1] + dy];
    }

    draw(t) {
      const D = this.D, e = this.exprAt(t), m = this.mouthAt(t), bl = this.blinkAt(t), lk = this.lookAt(t);
      for (const side of ["L", "R"]) {
        const s = side === "L" ? -1 : 1; const [cx, cy] = side === "L" ? D.eyeL : D.eyeR;
        const w = D.eyeW, h = D.eyeH;
        const eye = `M${cx - w} ${cy} C${cx - w * 0.6} ${cy - h * 1.15} ${cx + w * 0.6} ${cy - h * 1.15} ${cx + w} ${cy} C${cx + w * 0.6} ${cy + h} ${cx - w * 0.6} ${cy + h} ${cx - w} ${cy}Z`;
        this.el["white" + side].setAttribute("d", eye); this.el["clip" + side].setAttribute("d", eye);
        const ix = cx + lk[0] * 4.2, iy = cy + lk[1] * 3.2;
        this.el["iris" + side].setAttribute("cx", ix); this.el["iris" + side].setAttribute("cy", iy); this.el["iris" + side].setAttribute("r", D.iris);
        this.el["pupil" + side].setAttribute("cx", ix); this.el["pupil" + side].setAttribute("cy", iy); this.el["pupil" + side].setAttribute("r", D.pupil);
        this.el["glint" + side].setAttribute("cx", ix - 4); this.el["glint" + side].setAttribute("cy", iy - 4); this.el["glint" + side].setAttribute("r", 2.6);
        // upper lid: closes from the top; its edge curves like the eye
        const close = Math.max(0, Math.min(1, e.ul + bl * (1 - e.ul) - lk[1] * 0.04));
        const edgeY = lerp(cy - h * 1.15, cy + h * 0.95, close);
        const lidCurve = lerp(-h * 0.9, h * 0.15, close);
        const ul = `M${cx - w - 6} ${cy - h * 2.2} L${cx + w + 6} ${cy - h * 2.2} L${cx + w + 2} ${cy} C${cx + w * 0.55} ${edgeY + lidCurve} ${cx - w * 0.55} ${edgeY + lidCurve} ${cx - w - 2} ${cy}Z`;
        this.el["ulid" + side].setAttribute("d", ul);
        this.el["lash" + side].setAttribute("d", `M${cx - w} ${cy} C${cx - w * 0.55} ${edgeY + lidCurve} ${cx + w * 0.55} ${edgeY + lidCurve} ${cx + w + 3} ${cy - 2}`);
        const llift = e.ll * h * 0.7 + e.ch * 3;
        const ll = `M${cx - w - 2} ${cy} C${cx - w * 0.55} ${cy + h * 0.95 - llift} ${cx + w * 0.55} ${cy + h * 0.95 - llift} ${cx + w + 2} ${cy} L${cx + w + 6} ${cy + h * 1.6} L${cx - w - 6} ${cy + h * 1.6}Z`;
        this.el["llid" + side].setAttribute("d", ll);
        // brow: raise moves it up, inner tilt lifts the inner end (worry) or drops it (anger)
        const by = cy + D.browY - e.br * 10 - bl * 2;
        const inner = cx - s * D.browW * 0.9, outer = cx + s * D.browW;
        const innerY = by - e.bt * 9, outerY = by + e.bt * 3;
        const th = 7.5;
        const brow = `M${inner} ${innerY} C${lerp(inner, outer, 0.35)} ${lerp(innerY, outerY, 0.35) - 10} ${lerp(inner, outer, 0.7)} ${lerp(innerY, outerY, 0.7) - 9} ${outer} ${outerY + 2}` +
          ` C${lerp(inner, outer, 0.7)} ${lerp(innerY, outerY, 0.7) - 9 + th} ${lerp(inner, outer, 0.35)} ${lerp(innerY, outerY, 0.35) - 10 + th * 1.2} ${inner} ${innerY + th}Z`;
        this.el["brow" + side].setAttribute("d", brow);
        const ck = this.el["cheek" + side];
        ck.setAttribute("cx", cx + s * 8); ck.setAttribute("cy", cy + D.cheekY - e.ch * 6); ck.setAttribute("rx", 22); ck.setAttribute("ry", 12);
        ck.setAttribute("opacity", 0.18 + 0.22 * e.ch);
      }
      // mouth from parameters: smile lifts the corners, round narrows and pushes the lips out
      const W = D.mouthW * m.w * (1 - 0.25 * m.r) * (1 + 0.08 * e.sm), H = 26 * m.o, my = D.mouthY;
      const smile = (e.sm + m.s) * 8;
      const lx = -W, rx = W, cy0 = my - smile;
      const upper = my - H * 0.35 - 2, lower = my + H * 0.65 + 2;
      const lipT = 6 + 3 * m.r, lipB = 8 + 3 * m.r;
      // inner opening
      const inner = `M${lx * 0.92} ${cy0} C${lx * 0.5} ${upper} ${rx * 0.5} ${upper} ${rx * 0.92} ${cy0} C${rx * 0.5} ${lower} ${lx * 0.5} ${lower} ${lx * 0.92} ${cy0}Z`;
      this.el.mouthIn.setAttribute("d", H > 0.5 ? inner : "");
      const tw = W * 0.62 * m.te;
      this.el.teeth.setAttribute("d", m.te > 0.05 && H > 0.5 ? `M${-tw} ${upper + 1} L${tw} ${upper + 1} L${tw * 0.92} ${upper + Math.min(9, H * 0.5 + 2)} L${-tw * 0.92} ${upper + Math.min(9, H * 0.5 + 2)}Z` : "");
      this.el.tongue.setAttribute("d", m.to > 0.05 && H > 4 ? `M${-W * 0.45} ${lower - 1} C${-W * 0.3} ${lower - H * 0.45 * m.to - 4} ${W * 0.3} ${lower - H * 0.45 * m.to - 4} ${W * 0.45} ${lower - 1}Z` : "");
      // lips ring: outer contour minus inner opening (evenodd)
      const outer = `M${lx - 3} ${cy0} C${lx * 0.6} ${upper - lipT - 4} ${-6} ${upper - lipT} 0 ${upper - lipT + 3} C${6} ${upper - lipT} ${rx * 0.6} ${upper - lipT - 4} ${rx + 3} ${cy0}` +
        ` C${rx * 0.6} ${lower + lipB} ${lx * 0.6} ${lower + lipB} ${lx - 3} ${cy0}Z`;
      this.el.lips.setAttribute("d", outer + " " + inner);
      this.el.lips.setAttribute("fill-rule", "evenodd");
      this.el.lipLine.setAttribute("d", H <= 0.5 ? `M${lx} ${cy0} C${lx * 0.5} ${my - 1} ${rx * 0.5} ${my - 1} ${rx} ${cy0}` : "");
      return e;
    }
  }
  G.LPFace = Face; G.LPFaceExpr = EXPR;
})(window);
