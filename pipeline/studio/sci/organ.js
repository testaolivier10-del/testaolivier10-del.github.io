/* LevlPrep sci kit: organs as soft bodies driven by a physiological timeline (2026-10-21). Needs common.js.

   new LPHeart(svgGroup, opts)   4 chamber frontal cross section (viewer's left = patient's right)
     opts: {x, y, scale, rotate, bpm: 75, cycleSec: 3 (display seconds per beat; null = real time), cells: 130, seed,
            t0: 0 (display time where the first atrial systole starts), colors: {...}}
     heart.draw(t) -> {c (s into the cycle, physiological), phase: {key, name}, V: {LV, RV, LA, RA} mL, valves: {tri, pul, mit, ao} 0..1 open}
     heart.toScreen(x, y) -> screen point of a local point (for labels); heart.anchors: named local points (labels)
     LPHeart.PHASES: the phase table (Wiggers), for timelines

   new LPLungs(svgGroup, opts)    lungs, airways and diaphragm breathing
     opts: {x, y, scale, rate: 12 (breaths/min), ie: 0.4 (inspiration fraction), cycleSec (display s per breath), tidal: 0.5 L}
     lungs.draw(t) -> {phase: "inspiration" | "expiration", c (0..1 diaphragm contraction), V (L above FRC)}

   HEART MODEL (Wiggers diagram, 75 bpm, T = 0.8 s, t = 0 at the start of atrial systole):
     atrial systole 0 to 0.10; isovolumetric contraction 0.10 to 0.15 (mitral then tricuspid close: S1);
     ejection 0.15 to 0.36 (pulmonic opens just before aortic); isovolumetric relaxation 0.36 to 0.45 (aortic then
     pulmonic close: S2, physiological A2 before P2); rapid filling 0.45 to 0.60 (tricuspid opens just before mitral);
     diastasis 0.60 to 0.80 (AV leaflets float partly closed). Right side offsets 10 to 15 ms as in the literature.
     Ventricular volume: EDV 120 mL, ESV 50 mL (SV 70, EF 58%), atrial kick ~20 mL, rapid filling ~40 mL.
     Atrial volume follows from mass balance with a steady venous return (Q = SV / T): it rises while the AV valves
     are shut (v wave) and empties in rapid filling and atrial systole.
     Shape: short axis scales as (V/EDV)^0.5 (end systolic / end diastolic diameter ~0.64, like 3.2 vs 5.0 cm),
     the AV plane descends toward a fixed apex in systole (long axis shortening), walls thicken as cavities shrink,
     the RV free wall moves toward the septum (bellows), atria scale as V^(1/3).
     Blood: every parcel carries a volume label; its position comes from the cumulative flow through each valve,
     so flow is incompressible and one way, parcels stand still when both valves of a chamber are shut
     (isovolumetric phases) and move fastest at peak ejection/filling. Plug flow (first in, first out) along a
     U shaped path in each ventricle (inflow down the lateral wall to the apex, out along the septum), which is the
     real LV filling vortex direction. Everything is a closed form function of t (no integration).
     Simplifications: 2D, one AV plane for both sides, red cells drawn hugely oversized (schematic), no papillary
     muscle motion, no coronary flow, venous return taken as steady (no a/c/v reversal), right and left volumes equal.
     Colors: deoxygenated blood dark red with a purple cast, oxygenated bright red (blood is never blue); vessel
     walls follow the textbook convention (blue tint for vessels carrying deoxygenated blood, red for oxygenated).

   LUNG MODEL: quiet breathing. Inspiration is active (diaphragm contracts, dome flattens and descends ~1.5 cm per
     500 mL, ribs move up and out a little), expiration is passive recoil (exponential). Airflow parcels use the same
     volume label method so air moves in exactly as the lungs expand. Simplifications: 2D, pleura not drawn
     separately, no intercostal muscles, lung tissue drawn as a solid spongy fill.                                  */
(function (G) {
  const S = G.LPSci, mk = S.mk;
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------------------------------------------------------------- geometry helpers
  function polyInfo(P) { const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return L; }
  function polyAt(P, L, f) {                         // point and unit tangent at fraction f of the length
    const s = Math.max(0, Math.min(1, f)) * L[L.length - 1];
    let i = 1; while (i < L.length - 1 && L[i] < s) i++;
    const a = P[i - 1], b = P[i], seg = (L[i] - L[i - 1]) || 1, u = (s - L[i - 1]) / seg;
    const tx = (b[0] - a[0]) / seg, ty = (b[1] - a[1]) / seg;
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, tx, ty, i - 1 + u];
  }
  function resample(P, n) { const L = polyInfo(P), out = []; for (let i = 0; i < n; i++) { const q = polyAt(P, L, i / (n - 1)); out.push([q[0], q[1]]); } return out; }
  function area(P) { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }
  function offset(P, thick) {                         // closed polygon offset outward by thick(i) per point
    const n = P.length, sgn = area(P) > 0 ? -1 : 1, out = [];
    for (let i = 0; i < n; i++) {
      const a = P[(i - 1 + n) % n], b = P[(i + 1) % n]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const w = typeof thick === "function" ? thick(i, P[i]) : thick; out.push([P[i][0] - ty * w * sgn, P[i][1] + tx * w * sgn]);
    }
    return out;
  }
  function tube(P, r) {                              // filled tube outline around an open centerline
    const n = P.length, Lf = [], Rt = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const rr = typeof r === "function" ? r(i) : r; Lf.push([P[i][0] - ty * rr, P[i][1] + tx * rr]); Rt.push([P[i][0] + ty * rr, P[i][1] - tx * rr]);
    }
    return S.smooth(Lf, false, 0.5) + S.smooth(Rt.reverse(), false, 0.5).replace("M", "L") + "Z";
  }
  const pathD = (P) => S.smooth(P, true, 0.45);

  // ---------------------------------------------------------------- physiology (closed form)
  const PHASES = [
    { key: "as", name: "Atrial systole", a: 0.0, b: 0.10 },
    { key: "ivc", name: "Isovolumetric contraction", a: 0.10, b: 0.15 },
    { key: "ej", name: "Ventricular ejection", a: 0.15, b: 0.36 },
    { key: "ivr", name: "Isovolumetric relaxation", a: 0.36, b: 0.45 },
    { key: "rf", name: "Rapid filling", a: 0.45, b: 0.60 },
    { key: "ds", name: "Diastasis (slow filling)", a: 0.60, b: 0.80 },
  ];
  // valve event times (s into the cycle, from the start of left atrial systole)
  const SIDE = {
    L: { aS: 0.000, avClose: 0.100, svOpen: 0.150, svClose: 0.360, avOpen: 0.450, rfEnd: 0.600 },
    R: { aS: -0.012, avClose: 0.112, svOpen: 0.140, svClose: 0.375, avOpen: 0.440, rfEnd: 0.590 },   // RA activates first (SA node)
  };
  const EDV = 120, ESV = 50, PRE = 100, MID = 90, SV = EDV - ESV, VA0 = 45, Vv = 40, Vart = 70;
  function ventricle(c, B, T) {
    // returns {V, Mcum, Acum} within one cycle (c in [0, T)), times relative to B.aS
    const x = ((c - B.aS) % T + T) % T, aE = B.avClose - B.aS, so = B.svOpen - B.aS, sc = B.svClose - B.aS, ao = B.avOpen - B.aS, rf = B.rfEnd - B.aS;
    let V, M, A;
    if (x < aE) { const u = x / aE; V = PRE + (EDV - PRE) * Math.sin(u * Math.PI / 2) ** 2; M = V - PRE; A = 0; }          // atrial kick
    else if (x < so) { V = EDV; M = EDV - PRE; A = 0; }                                                                       // isovolumetric contraction
    else if (x < sc) { const u = (x - so) / (sc - so); V = EDV - SV * (1 - Math.pow(1 - u, 2.2)); M = EDV - PRE; A = EDV - V; } // ejection: fast early
    else if (x < ao) { V = ESV; M = EDV - PRE; A = SV; }                                                                      // isovolumetric relaxation
    else if (x < rf) { const u = (x - ao) / (rf - ao); V = ESV + (MID - ESV) * (1 - Math.pow(1 - u, 2)); M = EDV - PRE + V - ESV; A = SV; } // rapid filling
    else { const u = (x - rf) / (T - rf); V = MID + (PRE - MID) * u; M = EDV - PRE + V - ESV; A = SV; }                     // diastasis
    return { V, M, A, x };
  }
  function valveOpen(x, o, c, T, ramp) {              // smooth open fraction for an interval [o, c) on a cycle of T (x relative)
    const d = (a) => ((a % T) + T) % T, inOpen = d(x - o) < d(c - o);
    const sinceO = d(x - o), sinceC = d(x - c);
    if (inOpen) return sm(0, ramp, sinceO);
    return 1 - sm(0, ramp * 0.8, sinceC);
  }

  // ---------------------------------------------------------------- reference geometry (end diastole, AV plane y = 0)
  const R = {
    lvCx: 135, lvApex: 400, lvW: 110, rvTip: 330,
    ann: { tri: [[-300, 0], [-150, 0]], mit: [[112, 0], [245, 0]], pul: [[-135, -70], [-62, -70]], ao: [[28, -32], [102, -32]] },
    RA: [[-150, 8], [-112, -125], [-165, -262], [-268, -292], [-372, -228], [-398, -95], [-318, 8]],
    LA: [[116, 8], [118, -138], [168, -248], [272, -258], [345, -185], [355, -62], [255, 8]],
    vein: { svc: [[-430, -760], [-365, -560], [-300, -400], [-262, -262]], ivc: [[-500, 760], [-490, 320], [-462, 90], [-385, -70]],
            pvU: [[760, -210], [500, -200], [340, -180]], pvL: [[760, -60], [500, -78], [350, -88]] },
    art: { pt: [[-98, -70], [-98, -290]], rpa: [[-98, -290], [-185, -425], [-262, -565], [-330, -760]], lpa: [[-98, -290], [0, -335], [200, -322], [420, -285], [760, -262]],
           ao: [[65, -32], [65, -380], [120, -455], [200, -480], [330, -455], [520, -436], [760, -446]] },
    rad: { svc: 33, ivc: 37, pvU: 22, pvL: 22, pt: 34, rpa: 26, lpa: 26, ao: 38 },
    path: { RA: [[-250, -130], [-225, 4]], RV: [[-225, 0], [-232, 120], [-160, 262], [-62, 250], [-55, 120], [-72, 18], [-98, -70]],
            LA: [[238, -130], [178, 4]], LV: [[178, 0], [208, 150], [168, 335], [105, 255], [70, 120], [65, -32]] },
    pw: { RA: [36, 85, 55], RV: [55, 60, 42, 34, 38, 34, 26], LA: [18, 80, 52], LV: [54, 52, 30, 40, 42, 30] },
  };

  const HCOL = { muscle: "#c4505c", muscleD: "#8f2c3d", muscleL: "#e2797a", fat: "#f2d08a", deoxy: "#7d1f40", deoxyL: "#a2365a", oxy: "#d0172f", oxyL: "#ff5a5f",
    veinWall: "#5b66c8", veinWallL: "#8a93e6", artWall: "#d24c56", artWallL: "#f08080", valve: "#f6e6cf", valveD: "#d8bf9d", chord: "#f3e2c8",
    rbcDeoxy: "#8e2048", rbcDeoxyD: "#5a1030", rbcOxy: "#e2283c", rbcOxyD: "#9e1427" };

  class Heart {
    constructor(group, opts) {
      const o = this.o = Object.assign({ x: 960, y: 560, scale: 1, rotate: -12, bpm: 75, cycleSec: 3, cells: 130, seed: 4, t0: 0 }, opts || {});
      o.colors = Object.assign({}, HCOL, (opts || {}).colors || {}); const C = o.colors;
      this.T = 60 / o.bpm; S.defs(group); this.g = group;
      const outer = mk("g", { transform: `translate(${o.x} ${o.y}) rotate(${o.rotate}) scale(${o.scale})` }, group);
      this.uid = "h" + (Heart.count = (Heart.count || 0) + 1);
      if (o.fade !== 0) {                              // vessels dissolve softly into the body instead of hitting the frame edge
        const fr = o.fade || 640, d0 = S.defs(group), gid = this.uid + "_fg", mid = this.uid + "_fm";
        const rg = mk("radialGradient", { id: gid, gradientUnits: "userSpaceOnUse", cx: 0, cy: -60, r: fr }, d0);
        mk("stop", { offset: 0.72, "stop-color": "#fff" }, rg); mk("stop", { offset: 1, "stop-color": "#000" }, rg);
        const m = mk("mask", { id: mid, maskUnits: "userSpaceOnUse", maskContentUnits: "userSpaceOnUse", x: -2000, y: -2000, width: 4000, height: 4000 }, d0);
        mk("rect", { x: -2000, y: -2000, width: 4000, height: 4000, fill: `url(#${gid})` }, m);
        outer.setAttribute("mask", `url(#${mid})`);
      }
      const root = this.root = mk("g", {}, outer);
      const layer = (f) => mk("g", f ? { filter: f } : {}, root);
      const sideLayers = () => ({ vWall: layer("url(#sciRim)"), lumen: layer(), cells: layer(), valves: layer("url(#sciRimOnly)") });
      this.Lw = layer("url(#sciRim)");                     // heart muscle (both sides, merged)
      this.side = { L: sideLayers(), R: sideLayers() };
      // muscle
      this.wall = {}; for (const k of ["RA", "LA", "RV", "LV"]) this.wall[k] = mk("path", { fill: S.lin(root, C.muscleL, C.muscleD, 70) }, this.Lw);
      this.sheen = mk("path", { fill: "#ffffff", opacity: 0.08 }, this.Lw);
      // vessels and cavities per side
      const deoxyG = S.lin(root, C.deoxyL, C.deoxy, 90), oxyG = S.lin(root, C.oxyL, C.oxy, 90);
      this.vessel = {};
      const vess = (k, side, wallC, wallL) => { const L = this.side[side];
        this.vessel[k] = { wall: mk("path", { fill: S.lin(root, wallL, wallC, 0) }, L.vWall), lumen: mk("path", { id: `${this.uid}_${k}`, fill: side === "R" ? deoxyG : oxyG }, L.lumen) }; };
      vess("svc", "R", C.veinWall, C.veinWallL); vess("ivc", "R", C.veinWall, C.veinWallL); vess("pt", "R", C.veinWall, C.veinWallL);
      vess("rpa", "R", C.veinWall, C.veinWallL); vess("lpa", "R", C.veinWall, C.veinWallL);
      vess("pvU", "L", C.artWall, C.artWallL); vess("pvL", "L", C.artWall, C.artWallL); vess("ao", "L", C.artWall, C.artWallL);
      this.cav = {};
      for (const [k, side] of [["RA", "R"], ["RV", "R"], ["LA", "L"], ["LV", "L"]]) this.cav[k] = mk("path", { id: `${this.uid}_${k}`, fill: side === "R" ? deoxyG : oxyG }, this.side[side].lumen);
      // inner shadow on cavities (depth): a darker copy offset down-right, clipped to the cavity
      // clip cells to each side's blood spaces
      const defs = S.defs(root);
      for (const [side, ks] of [["R", ["RA", "RV", "svc", "ivc", "pt", "rpa", "lpa"]], ["L", ["LA", "LV", "pvU", "pvL", "ao"]]]) {
        const cp = mk("clipPath", { id: `${this.uid}_clip${side}` }, defs);
        ks.forEach((k) => mk("use", { href: `#${this.uid}_${k}` }, cp));
        this.side[side].cells.setAttribute("clip-path", `url(#${this.uid}_clip${side})`);
      }
      // valves: two leaflets each (tricuspid drawn as two in section), chordae for AV valves
      this.pap = { R: [0, 1].map(() => mk("path", { fill: S.lin(root, C.muscleL, C.muscle, 90) }, this.side.R.valves)),
                   L: [0, 1].map(() => mk("path", { fill: S.lin(root, C.muscleL, C.muscle, 90) }, this.side.L.valves)) };
      this.valveEl = {};
      for (const [k, side] of [["tri", "R"], ["pul", "R"], ["mit", "L"], ["ao", "L"]]) {
        const g = this.side[side].valves;
        this.valveEl[k] = { ch: mk("path", { fill: "none", stroke: C.chord, "stroke-width": 2.2, opacity: k === "tri" || k === "mit" ? 0.85 : 0 }, g),
          a: mk("path", { fill: S.lin(root, C.valve, C.valveD, 90) }, g), b: mk("path", { fill: S.lin(root, C.valve, C.valveD, 90) }, g) };
      }
      // cells
      const r = S.rng(o.seed); this.cells = { L: [], R: [] }; this.K = 320;
      for (const side of ["L", "R"]) for (let i = 0; i < o.cells; i++) {
        const cell = { u0: (i + r() * 0.8) * this.K / o.cells, lat: (r() * 2 - 1) * 0.85, inV: r() < 0.5 ? 0 : 1, outV: r() < 0.5 ? 0 : 1, ph: r() * 6.28, spin: 0.6 + r() * 1.6 };
        const g = mk("g", {}, this.side[side].cells), base = side === "R" ? C.rbcDeoxy : C.rbcOxy, dk = side === "R" ? C.rbcDeoxyD : C.rbcOxyD;
        mk("ellipse", { fill: S.sphere(root, base, { flat: 0.3 }) }, g); mk("ellipse", { fill: dk, opacity: 0.55 }, g); mk("ellipse", { fill: S.lighten(base, 0.5), opacity: 0.45 }, g);
        cell.el = g; this.cells[side].push(cell);
      }
      this.anchors = { RA: [-262, -150], RV: [-190, 120], LA: [240, -150], LV: [165, 170], svc: [-345, -500], ivc: [-480, 360], pt: [-98, -220], ao: [70, -300],
        pvU: [520, -140], lpa: [520, -250], rpa: [-250, -560], aoOut: [480, -500] };
    }
    phys(t) {                                         // display time -> physiological time
      const o = this.o, k = o.cycleSec ? this.T / o.cycleSec : 1; return Math.max(0, (t - o.t0) * k);
    }
    state(t) {
      const T = this.T, tau = this.phys(t), n = Math.floor(tau / T), c = tau - n * T, st = { tau, c, n };
      for (const s of ["L", "R"]) {
        const B = SIDE[s], v = ventricle(c, B, T), Qin = SV / T, lag = v.x;
        const cyc = Math.floor((tau - B.aS) / T + 1e-9);            // completed cycles on this side
        const Mc = SV * cyc + v.M;                                  // cumulative volume through the AV valve
        const P = Qin * (tau - B.aS) + VA0;                         // cumulative venous inflow (+ initial atrial volume)
        const VA = P - Mc;                                          // atrial volume by mass balance
        // volume label boundaries: vein entrance, atrial inlet, AV valve, semilunar valve, artery exit
        const sd = st[s] = { V: v.V, VA, x: lag, b: [P + Vv, P, Mc, Mc - v.V, Mc - v.V - Vart], k: (EDV - v.V) / SV };
        const aE = B.avClose - B.aS, rfE = B.rfEnd - B.aS;
        if (lag < aE) sd.av = lerp(0.58, 1, sm(0, 0.04, lag)) * (1 - sm(aE - 0.025, aE, lag));     // atrial kick pushes leaflets wide, then they snap shut
        else { sd.av = valveOpen(lag, B.avOpen - B.aS, aE, T, 0.03); if (lag >= rfE) sd.av *= 1 - 0.42 * sm(0, 0.12, lag - rfE); }  // float partly closed in diastasis
        sd.sv = valveOpen(lag, B.svOpen - B.aS, B.svClose - B.aS, T, 0.025);
        sd.aSys = lag < 0.1 ? Math.sin(lag / 0.1 * Math.PI) : 0;     // atrial wall thickening while it contracts
      }
      st.baseY = 46 * (st.L.k + st.R.k) / 2;
      const ph = PHASES.find((p) => c >= p.a && c < p.b) || PHASES[PHASES.length - 1];
      st.phase = ph; return st;
    }

    // ---- deformations (reference -> current)
    defLV(st, x, y) { const k = st.L.k, sx = Math.sqrt(st.L.V / EDV), base = st.baseY, ap = R.lvApex;
      if (y <= 0) return [R.lvCx + (x - R.lvCx) * (1 - 0.1 * k), y + base];
      const u = y / ap, s = lerp(1 - 0.1 * k, sx, sm(0, 0.3, u)); return [R.lvCx + (x - R.lvCx) * s, base + y * (ap - base) / ap]; }
    defRV(st, x, y, sep) {                            // sep: current septal x at this height (RV contracts toward it)
      const k = st.R.k, s = Math.pow(st.R.V / EDV, 0.6), base = st.baseY, ap = R.lvApex;
      if (y <= 0) return [x + (sep - x) * 0.1 * k, y + base];
      const u = y / R.rvTip, ss = lerp(1 - 0.1 * k, s, sm(0, 0.3, u)); return [sep + (x - sep) * ss, base + y * (ap - base) / ap]; }
    defA(st, side, x, y) {
      const sd = st[side], sA = Math.cbrt(sd.VA / 55), ax = side === "R" ? -225 : 178, k = sd.k, sAnn = 1 - 0.1 * k;
      const s = lerp(sAnn, sA, sm(0, -90, y)); return [ax + (x - ax) * s, st.baseY + y * lerp(1, sA, sm(0, -90, y))]; }
    sepX(st, y) {                                     // outer (RV facing) surface of the septum at reference depth y
      const P = this.lvLeft; for (let i = 1; i < P.length; i++) if (P[i][2] >= y) { const a = P[i - 1], b = P[i], u = (y - a[2]) / ((b[2] - a[2]) || 1); return lerp(a[0], b[0], u) - this.septW; }
      return P[P.length - 1][0] - this.septW;
    }

    geometry(st) {
      const N = 26, ap = R.lvApex, G = {};
      // LV cavity
      const wprof = (u) => R.lvW * Math.pow(Math.max(0, 1 - Math.pow(u, 2.4)), 0.55);
      const cxu = (u) => R.lvCx + 12 * u;
      const right = [], left = [];
      for (let i = 0; i <= N; i++) { const u = i / N, y = u * ap; right.push([cxu(u) + wprof(u), y]); left.push([cxu(u) - wprof(u), y]); }
      left[0][0] = 25; right[0][0] = 245;
      const kL = st.L.k; this.septW = 40 * (1 + 0.45 * kL); const lvFree = 46 * (1 + 0.6 * kL), rvFree = 16 * (1 + 0.4 * st.R.k);
      const lvLeftCur = left.map((p) => { const q = this.defLV(st, p[0], p[1]); return [q[0], q[1], p[1]]; });
      this.lvLeft = lvLeftCur;
      const LV = [...right.map((p) => this.defLV(st, p[0], p[1])), ...left.slice().reverse().map((p) => this.defLV(st, p[0], p[1])),
        this.defLV(st, R.ann.ao[0][0], R.ann.ao[0][1]), this.defLV(st, R.ann.ao[1][0], R.ann.ao[1][1]), this.defLV(st, 112, 0)];
      G.LV = LV;
      // RV cavity (crescent on the septum)
      const M = 22, free = [], sept = [], s0 = this.sepX(st, 0);
      for (let i = 0; i <= M; i++) { const v = i / M, y = v * R.rvTip, sx = this.sepX(st, y), wRef = (s0 + 300 + 30 * Math.sin(v * Math.PI)) * Math.pow(Math.max(0, 1 - Math.pow(v, 1.7)), 0.75);
        free.push(this.defRV(st, sx - wRef, y, sx)); sept.push([sx, this.defRV(st, sx, y, sx)[1]]); }
      free[0] = this.defRV(st, -300, 0, s0);
      const RV = [...free, ...sept.slice(1).reverse(), this.defRV(st, R.ann.pul[1][0], R.ann.pul[1][1], s0), this.defRV(st, R.ann.pul[0][0], R.ann.pul[0][1], s0), this.defRV(st, -150, 0, s0)];
      G.RV = RV;
      G.RA = R.RA.map((p) => this.defA(st, "R", p[0], p[1]));
      G.LA = R.LA.map((p) => this.defA(st, "L", p[0], p[1]));
      // valves (annulus endpoints)
      G.ann = { tri: R.ann.tri.map((p) => this.defRV(st, p[0], p[1], s0)), pul: R.ann.pul.map((p) => this.defRV(st, p[0], p[1], s0)),
                mit: R.ann.mit.map((p) => this.defLV(st, p[0], p[1])), ao: R.ann.ao.map((p) => this.defLV(st, p[0], p[1])) };
      // walls: thickness per point
      G.wLV = offset(LV, (i, p) => (p[1] <= st.baseY + 2 || i > 2 * N + 1 ? 14 : i <= N ? lvFree : this.septW));
      G.wRV = offset(RV, (i, p) => (p[1] <= st.baseY + 2 ? 12 : rvFree));
      G.wRA = offset(G.RA, 12 * (1 + 0.5 * st.R.aSys)); G.wLA = offset(G.LA, 12 * (1 + 0.5 * st.L.aSys));
      // vessels: the end touching the heart follows the chamber or annulus
      const mid = (a) => [(a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2];
      G.v = {
        svc: [...R.vein.svc.slice(0, -1), this.defA(st, "R", ...R.vein.svc[3])], ivc: [...R.vein.ivc.slice(0, -1), this.defA(st, "R", ...R.vein.ivc[3])],
        pvU: [...R.vein.pvU.slice(0, -1), this.defA(st, "L", ...R.vein.pvU[2])], pvL: [...R.vein.pvL.slice(0, -1), this.defA(st, "L", ...R.vein.pvL[2])],
        pt: [[mid(G.ann.pul)[0], mid(G.ann.pul)[1] + 14], ...R.art.pt.slice(1)], rpa: R.art.rpa, lpa: R.art.lpa,
        ao: [[mid(G.ann.ao)[0], mid(G.ann.ao)[1] + 14], ...R.art.ao.slice(1)],
      };
      // blood paths through chambers (current)
      G.p = {
        RA: [null, this.defA(st, "R", ...R.path.RA[0]), mid(G.ann.tri)],
        RV: R.path.RV.map((p, i) => (i === 0 ? mid(G.ann.tri) : i === R.path.RV.length - 1 ? mid(G.ann.pul) : this.defRV(st, p[0], p[1], this.sepX(st, Math.max(0, p[1]))))),
        LA: [null, this.defA(st, "L", ...R.path.LA[0]), mid(G.ann.mit)],
        LV: R.path.LV.map((p, i) => (i === 0 ? mid(G.ann.mit) : i === R.path.LV.length - 1 ? mid(G.ann.ao) : this.defLV(st, p[0], p[1]))),
      };
      G.p.RA[0] = null; G.p.LA[0] = null;
      return G;
    }

    drawValve(el, A, B, open, down, kind, chordTo) {
      // leaflets hinge at A and B; closed: they meet in the middle (AV valves bulge slightly toward the atrium,
      // semilunar cusps sag toward the ventricle); open: they swing downstream, parallel to the flow.
      const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, w = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / w, uy = (B[1] - A[1]) / w;
      let nx = -uy, ny = ux; if (nx * down[0] + ny * down[1] < 0) { nx = -nx; ny = -ny; }       // n points downstream
      const av = kind === "av", len = w * (av ? 0.56 : 0.52), th = av ? 9 : 8;
      const leaf = (H, sgn) => {                     // sgn +1 for A (points toward B when closed)
        const closedDir = [ux * sgn, uy * sgn], bulge = av ? -0.22 : 0.3;
        const cd = [closedDir[0] + nx * bulge, closedDir[1] + ny * bulge], cl = Math.hypot(cd[0], cd[1]);
        const dx = lerp(cd[0] / cl, nx, open), dy = lerp(cd[1] / cl, ny, open), dl = Math.hypot(dx, dy);
        const tip = [H[0] + dx / dl * len, H[1] + dy / dl * len];
        const px = -dy / dl, py = dx / dl, c1 = [H[0] + dx / dl * len * 0.5 + px * th * 0.9 * sgn + nx * (av ? 6 : -4) * (1 - open), H[1] + dy / dl * len * 0.5 + py * th * 0.9 * sgn + ny * (av ? 6 : -4) * (1 - open)];
        const f = (v) => v.toFixed(1);
        return { d: `M${f(H[0] - px * th)} ${f(H[1] - py * th)}Q${f(c1[0])} ${f(c1[1])} ${f(tip[0])} ${f(tip[1])}Q${f(c1[0] - px * th * 1.3)} ${f(c1[1] - py * th * 1.3)} ${f(H[0] + px * th)} ${f(H[1] + py * th)}Z`, tip };
      };
      const a = leaf(A, 1), b = leaf(B, -1);
      el.a.setAttribute("d", a.d); el.b.setAttribute("d", b.d);
      if (chordTo) { const f = (v) => v.toFixed(1); let d = "";
        for (const [tip, pm] of [[a.tip, chordTo[0]], [b.tip, chordTo[1]]]) for (const o of [-6, 0, 6]) d += `M${f(tip[0])} ${f(tip[1])}L${f(pm[0] + o)} ${f(pm[1])}`;
        el.ch.setAttribute("d", d); }
    }

    draw(t) {
      const st = this.state(t), G = this.geometry(st), C = this.o.colors;
      // muscle
      this.wall.LV.setAttribute("d", pathD(G.wLV)); this.wall.RV.setAttribute("d", pathD(G.wRV));
      this.wall.RA.setAttribute("d", pathD(G.wRA)); this.wall.LA.setAttribute("d", pathD(G.wLA));
      // cavities
      for (const k of ["LV", "RV", "RA", "LA"]) this.cav[k].setAttribute("d", pathD(G[k]));
      // vessels
      for (const k in this.vessel) { const P = G.v[k], r = R.rad[k];
        this.vessel[k].wall.setAttribute("d", tube(P, r + 9)); this.vessel[k].lumen.setAttribute("d", tube(P, r)); }
      // valves: papillary muscles sit on the ventricular walls about halfway down
      const pmR = [this.defRV(st, -268, 175, this.sepX(st, 175)), this.defRV(st, -175, 225, this.sepX(st, 225))];
      const pmL = [this.defLV(st, 92, 262), this.defLV(st, 222, 240)];
      const papD = (P, wallP, w) => { const dx = P[0] - wallP[0], dy = P[1] - wallP[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * w, ny = dx / L * w, f = (v) => v.toFixed(1);
        return `M${f(wallP[0] + nx * 1.6)} ${f(wallP[1] + ny * 1.6)}Q${f(P[0] + nx * 1.2)} ${f(P[1] + ny * 1.2)} ${f(P[0])} ${f(P[1])}Q${f(P[0] - nx * 1.2)} ${f(P[1] - ny * 1.2)} ${f(wallP[0] - nx * 1.6)} ${f(wallP[1] - ny * 1.6)}Z`; };
      // papillary muscles rise from the wall (base on the wall side, tip where the chordae attach)
      const pmBaseR = [this.defRV(st, -330, 215, this.sepX(st, 215)), this.defRV(st, -215, 290, this.sepX(st, 290))], pmBaseL = [this.defLV(st, 50, 320), this.defLV(st, 250, 300)];
      [0, 1].forEach((i) => { this.pap.R[i].setAttribute("d", papD(pmR[i], pmBaseR[i], 13)); this.pap.L[i].setAttribute("d", papD(pmL[i], pmBaseL[i], 17)); });
      this.drawValve(this.valveEl.tri, G.ann.tri[0], G.ann.tri[1], st.R.av, [0, 1], "av", [pmR[0], pmR[1]]);
      this.drawValve(this.valveEl.mit, G.ann.mit[0], G.ann.mit[1], st.L.av, [0, 1], "av", [pmL[0], pmL[1]]);
      this.drawValve(this.valveEl.pul, G.ann.pul[0], G.ann.pul[1], st.R.sv, [0, -1], "sl");
      this.drawValve(this.valveEl.ao, G.ann.ao[0], G.ann.ao[1], st.L.sv, [0, -1], "sl");
      // blood cells: volume labels -> compartment -> path position
      const comp = { R: [["svc", "ivc"], "RA", "RV", ["pt", "rpa", "lpa"]], L: [["pvU", "pvL"], "LA", "LV", ["ao"]] };
      for (const side of ["L", "R"]) {
        const b = st[side].b, cells = this.cells[side];
        const paths = {}, pinfo = (key, P) => paths[key] || (paths[key] = { P, L: polyInfo(P) });
        for (const cl of cells) {
          let u = cl.u0 + this.K * Math.ceil((b[4] - cl.u0) / this.K); if (u > b[4] + this.K) u -= this.K;
          if (u > b[0]) { cl.el.setAttribute("display", "none"); continue; }
          cl.el.removeAttribute("display");
          let k = 0; while (k < 3 && u < b[k + 1]) k++;
          const f = (b[k] - u) / Math.max(1e-6, b[k] - b[k + 1]);
          let P, W, key;
          const cs = comp[side];
          if (k === 0) { key = cs[0][cl.inV]; P = G.v[key]; W = () => R.rad[key] * 0.75; }
          else if (k === 1) { key = cs[1] + cl.inV; const pp = G.p[cs[1]].slice(); const vin = G.v[cs[0][cl.inV]]; pp[0] = vin[vin.length - 1]; P = pp; const pw = R.pw[cs[1]]; W = (seg) => lerp(pw[Math.floor(seg)], pw[Math.min(pw.length - 1, Math.floor(seg) + 1)], seg % 1); }
          else if (k === 2) { key = cs[2]; P = G.p[cs[2]]; const pw = R.pw[cs[2]]; const sx = side === "L" ? Math.sqrt(st.L.V / EDV) : Math.pow(st.R.V / EDV, 0.6); W = (seg) => lerp(pw[Math.floor(seg)], pw[Math.min(pw.length - 1, Math.floor(seg) + 1)], seg % 1) * sx; }
          else { if (side === "R") { key = cl.outV ? "lpa" : "rpa"; P = [...G.v.pt, ...G.v[key].slice(1)]; } else { key = "ao"; P = G.v.ao; } W = () => 22; }
          const info = pinfo(key + k, P), q = polyAt(info.P, info.L, f), wd = W(q[4]);
          const wob = Math.sin(t * 2.1 + cl.ph) * 0.12;
          const x = q[0] - q[3] * (cl.lat + wob) * wd, y = q[1] + q[2] * (cl.lat + wob) * wd;
          const ang = Math.atan2(q[3], q[2]) * 57.3 + Math.sin(cl.ph + t * cl.spin) * 30, tumble = 0.35 + 0.65 * Math.abs(Math.cos(cl.ph + t * cl.spin * 0.7)), s = 11;
          cl.el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
          const [e0, e1, e2] = cl.el.childNodes;
          e0.setAttribute("rx", (s * tumble).toFixed(1)); e0.setAttribute("ry", s); e1.setAttribute("rx", (s * tumble * 0.45).toFixed(1)); e1.setAttribute("ry", (s * 0.45).toFixed(1));
          e2.setAttribute("rx", (s * tumble * 0.25).toFixed(1)); e2.setAttribute("ry", (s * 0.28).toFixed(1)); e2.setAttribute("cx", (-s * tumble * 0.35).toFixed(1)); e2.setAttribute("cy", (-s * 0.45).toFixed(1));
        }
      }
      return { c: st.c, n: st.n, phase: st.phase, V: { LV: st.L.V, RV: st.R.V, LA: st.L.VA, RA: st.R.VA }, valves: { tri: st.R.av, pul: st.R.sv, mit: st.L.av, ao: st.L.sv }, st };
    }
    toScreen(x, y) { const o = this.o, a = o.rotate * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [o.x + o.scale * (x * c - y * s), o.y + o.scale * (x * s + y * c)]; }
  }
  Heart.PHASES = PHASES; Heart.SIDE = SIDE;

  // ================================================================ lungs
  const LCOL = { lung: "#ec8f9b", lungD: "#b65468", lungL: "#ffc3c5", airway: "#f1e4d8", airwayD: "#c9b39d", dia: "#c4505c", diaD: "#8f2c3d", air: "#dff4ff", body: "#2a3466" };
  class Lungs {
    constructor(group, opts) {
      const o = this.o = Object.assign({ x: 960, y: 120, scale: 1, rate: 12, ie: 0.4, cycleSec: null, tidal: 0.5, seed: 9 }, opts || {});
      o.colors = Object.assign({}, LCOL, (opts || {}).colors || {}); const C = o.colors; S.defs(group);
      const root = this.root = mk("g", { transform: `translate(${o.x} ${o.y}) scale(${o.scale})` }, group);
      this.cavity = mk("path", { fill: S.lin(root, "#33407a", "#1e2752", 90) }, root);          // thoracic cavity behind
      this.lungG = mk("g", { filter: "url(#sciRim)" }, root);
      this.lung = [mk("path", { fill: S.lin(root, C.lungL, C.lungD, 80) }, this.lungG), mk("path", { fill: S.lin(root, C.lungL, C.lungD, 100) }, this.lungG)];
      this.fiss = mk("path", { fill: "none", stroke: C.lungD, "stroke-width": 4, "stroke-linecap": "round", opacity: 0.55 }, root);
      this.tree = mk("path", { fill: "none", stroke: C.airway, "stroke-width": 7, "stroke-linecap": "round", opacity: 0.55 }, root);
      this.airwayG = mk("g", { filter: "url(#sciRimOnly)" }, root);
      this.trachea = mk("path", { fill: S.lin(root, C.airway, C.airwayD, 0) }, this.airwayG);
      this.rings = mk("path", { fill: "none", stroke: C.airwayD, "stroke-width": 5, opacity: 0.7 }, this.airwayG);
      this.lumen = mk("path", { fill: "#5b2a3e", opacity: 0.85 }, this.airwayG);
      this.airG = mk("g", { opacity: 0.85 }, root);
      this.dia = mk("path", { fill: S.lin(root, C.dia, C.diaD, 90), filter: "url(#sciRim)" }, root);
      const r = S.rng(o.seed); this.air = [];
      for (let i = 0; i < 70; i++) this.air.push({ u0: i / 70, lat: r() * 2 - 1, side: r() < 0.5 ? 0 : 1, ph: r() * 6.28, el: mk("ellipse", { fill: C.air }, this.airG) });
    }
    T() { return 60 / this.o.rate; }
    phys(t) { const o = this.o; return o.cycleSec ? t * this.T() / o.cycleSec : t; }
    state(t) {
      const T = this.T(), tau = this.phys(t), n = Math.floor(tau / T), x = tau / T - n, ti = this.o.ie;
      let c, insp;
      if (x < ti) { c = 0.5 - 0.5 * Math.cos(Math.PI * x / ti); insp = true; }                          // active, smooth
      else { const u = (x - ti) / (1 - ti); c = (Math.exp(-4.5 * u) - Math.exp(-4.5)) / (1 - Math.exp(-4.5)); insp = false; }   // passive recoil
      return { c, insp, V: c * this.o.tidal, cum: n * this.o.tidal * 2 + (insp ? c * this.o.tidal : this.o.tidal * 2 - c * this.o.tidal), x };
    }
    draw(t) {
      const st = this.state(t), c = st.c, f = (v) => v.toFixed(1);
      // diaphragm: two domes (right higher, liver below), flattening and descending with contraction
      const domeR = 575 - 75 * c, domeL = 600 - 75 * c, edge = 760, flat = 1 - 0.35 * c, xs = [];
      const diaY = (x) => { const dR = Math.exp(-Math.pow((x + 190) / (190 * (1 + 0.25 * c)), 2)), dL = Math.exp(-Math.pow((x - 200) / (180 * (1 + 0.25 * c)), 2));
        const cen = Math.exp(-Math.pow(x / 70, 2)); return edge - (edge - domeR) * dR * flat - (edge - domeL) * dL * flat - 0 * cen + 30 * cen * (1 - c) * 0; };
      for (let x = -390; x <= 390; x += 15) xs.push([x, diaY(x)]);
      const top = xs, bot = xs.map((p) => [p[0], p[1] + 34 - 8 * c]);
      this.dia.setAttribute("d", S.smooth(top, false) + S.smooth(bot.reverse(), false).replace("M", "L") + "Z");
      // lungs: lateral wall moves out a little with the ribs, bases sit on the diaphragm
      const ex = 1 + 0.05 * c;
      const lungPts = (sgn) => {
        const P = [], apexY = 300 - 6 * c;
        P.push([sgn * 62, apexY + 40]); P.push([sgn * 120 * ex, apexY - 10]); P.push([sgn * 225 * ex, apexY + 55]); P.push([sgn * 322 * ex, apexY + 175]);
        P.push([sgn * 365 * ex, 560]);
        for (let x = 350; x >= 50; x -= 40) P.push([sgn * x * (x > 300 ? ex : 1), diaY(sgn * x) - 10]);
        if (sgn > 0) { P.push([60, 560]); P.push([110, 470 + 20 * c]); P.push([70, 420]); }            // cardiac notch (left lung)
        else { P.push([-58, 520]); P.push([-48, 420]); }
        return P;
      };
      this.lung[0].setAttribute("d", pathD(lungPts(-1))); this.lung[1].setAttribute("d", pathD(lungPts(1)));
      // fissures: right oblique + horizontal, left oblique
      // oblique fissures (both lungs) and the right horizontal fissure, from the lateral edge inward
      this.fiss.setAttribute("d", `M${f(-268 * ex)} 392Q-200 ${f(480 + 20 * c)} -130 ${f(diaY(-130) - 16)}M${f(-318 * ex)} 488Q-262 476 -214 ${f(450 + 10 * c)}M${f(272 * ex)} 400Q215 ${f(480 + 20 * c)} 175 ${f(diaY(175) - 16)}`);
      // bronchial tree inside (scales with expansion)
      const br = (x0, y0, a, L, d) => { if (d === 0) return ""; const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L * (1 + 0.12 * c);
        return `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}` + br(x1, y1, a - 0.45, L * 0.72, d - 1) + br(x1, y1, a + 0.4, L * 0.72, d - 1); };
      this.tree.setAttribute("d", br(-110, 330, 1.95, 90, 4) + br(110, 330, 1.19, 90, 4));
      // airway: trachea and main bronchi (the right bronchus is wider and more vertical)
      const tw = 34, trach = [[0, -40], [0, 280]], bR = [[0, 280], [-60, 320], [-120, 360]], bL = [[0, 280], [70, 315], [135, 345]];
      this.trachea.setAttribute("d", tube(trach, tw) + tube(bR, 26) + tube(bL, 22));
      this.lumen.setAttribute("d", tube(trach, tw - 9) + tube(bR, 18) + tube(bL, 15));
      let rd = ""; for (let y = -20; y < 270; y += 26) rd += `M${-tw + 4} ${y}Q0 ${y + 9} ${tw - 4} ${y}`; this.rings.setAttribute("d", rd);
      // air parcels: label in [0, 1) of a 2*tidal loop; the airway holds the dead space, parcels move with cum volume
      const dead = 0.15, span = 0.3;                   // parcels are spaced 0.3 L / 70 apart along the airway volume
      for (const a of this.air) {
        const pos = ((a.u0 * span + st.V) % span + span) % span;   // inspiration (V up) carries parcels down the airway
        const show = pos < dead;
        if (!show) { a.el.setAttribute("opacity", 0); continue; }
        const fr = pos / dead, path = fr < 0.75 ? null : null;
        let x, y;
        if (fr < 0.72) { x = a.lat * (tw - 14); y = -40 + fr / 0.72 * 320; }
        else { const g = (fr - 0.72) / 0.28, B = a.side ? bL : bR; x = lerp(B[0][0], B[2][0], g) + a.lat * 10; y = lerp(B[0][1], B[2][1], g) + a.lat * 8; }
        const ang = fr < 0.72 ? 0 : Math.atan2(((a.side ? bL : bR)[2][0] - 0), ((a.side ? bL : bR)[2][1] - 280)) * -57.3;
        a.el.setAttribute("opacity", 0.5); a.el.setAttribute("transform", `translate(${f(x)} ${f(y)}) rotate(${f(ang)})`); a.el.setAttribute("rx", 4.5); a.el.setAttribute("ry", 15);
      }
      this.cavity.setAttribute("d", `M-380 ${f(diaY(-380) + 10)}C-420 400 -330 230 -150 220H150C330 230 420 400 380 ${f(diaY(380) + 10)}Z`);
      return { phase: st.insp ? "inspiration" : "expiration", c, V: st.V };
    }
  }

  G.LPHeart = Heart; G.LPLungs = Lungs;
})(window);
