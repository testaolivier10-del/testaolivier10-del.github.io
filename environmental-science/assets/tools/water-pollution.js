/* Water pollution trainer page, v2 (docs/tools-v2-water-pollution-brief.md: the flagship of the v2 tool pattern;
   docs/apenv-spec.md section 6). OWNED BY THIS TOOL ONLY. Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.waterPollution (environmental-science/assets/tools/math/water-pollution.js), the content
   environmental-science/data/tools/water-pollution.json. Built from the shared v2 kit (assets/course/tool-kit2.js).

   Two modes (owner round 2026-11-16, the rule for every tool): EXPLORE is for playing with it, TEST YOURSELF is
   where you get quizzed.
   Explore: nothing locked, nothing graded, no side panel. The stage, full width: big chapter tabs, a purpose line
   of about 8 words (PURPOSE) with a small "Show me how" link, the scene with its controls ON it, each named in 1 to 3
   words ("Fertilizer", "Lake temperature", "Hot water", the tank names), the time bar with a small "Watch it happen"
   button, one line under the picture and a simple graph (oxygen is the one axis; algae a faint shape).
   INSTANT RESPONSE (owner round 3, 2026-11-17, from the PhET interview studies, Red Blob Games and Bret Victor):
   changing a control changes the lake and the graph that instant, with no Play. While a control is dragged, and after
   it is let go until the time bar is touched, the scene shows that run's worst day (the lowest oxygen; run.worst) and
   the graph its whole curve; the setting before the change stays as a faint line ("before: 2 sacks") and the oxygen
   card says "was 6.3". The line under the picture is then the CAUSE LINE, the chain in a few words with one colour
   per idea ("4 sacks → big bloom → dead algae rot → oxygen 0.0 → dead zone 21 days"); a step's caption shows only
   while the time bar is dragged or the run plays, and a takeaway (TAKE) when a run ends. One optional, ungraded
   teaser sits beside it (TZ). A first visit gets ONE cue at the first control ("Drag the fertilizer", K.cue), gone at
   the first interaction; the three step tour (K.tour) opens only from "Show me how" and from "?". Runs are cached
   (lakeRun, sewRun), so a drag never recomputes one.
     1 Fertilizer runoff  drag the fertilizer sacks (0 to 5) or the lake's thermometer (10 to 30 °C): the instant
                          view. The time bar (or Watch it happen, or a drag along the graph): rain washes the fertilizer
                          in, the surface turns green, the algae die, turn brown and sink, decomposers multiply, the
                          bottom water's oxygen falls (one number on the lake with its status word), the fish rise,
                          gasp and leave below 2 mg/L, and come back as the air puts oxygen back.
     2 Hot water          drag the handle on the outflow pipe (+0 to +15 °C): the plume warms the river; a gauge
                          each side shows what the water can hold (USGS); the trout stay or swim up out of it.
     3 Sewage             tap a tank to make it the last stage used; the lake below runs the chapter 1 model with
                          the N, P and organic matter left (SEW_LEVEL, BOD).
   Test yourself: a dropdown on the stage picks the chapter's questions on the picture or the practice problems
   (the drill). Questions, one at a time on the same scene: the predictions (then the run plays), the challenges
   (most sacks, warmer lake, which link uses the oxygen, the steps in order, why late, trout, percent, after
   secondary, fewest stages), each with the hint ladder and "Show the answer" after a try; a chapter ends with a
   card: the recap and the first tries. Finding a limit is graded by committed checks (Check) on both sides of it.
   "?": how the model works, the sources, the tables and the setting, as a sheet over the stage.
   One colour per idea, everywhere (scene, card, graph, labels, cause line): oxygen blue, algae green, dead matter
   and the bacteria that eat it brown, fertilizer and nutrients amber, heat vermillion, and red for the dead zone
   only (Okabe-Ito, lighter in dark mode). Every value is also written, so color is never the only cue. Nothing in
   the picture is decoration a student could misread: no sun, light rays, glints or steam; the only bubbles are
   oxygen (blue, fewer as it falls, none in a dead zone).
   Reduced motion: no ambient motion; each Play press goes to the next step. */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath, K = window.LevlKit2;
  if(!T || !M || !M.waterPollution) return;
  var W = M.waterPollution, esc = T.esc;
  function F(x, d){ return T.F(x, d == null ? 1 : d); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, f){ return a + (b - a) * f; }
  function sstep(a, b, x){ var f = clamp((x - a) / (b - a), 0, 1); return f * f * (3 - 2 * f); }
  function n1(v){ return (+v).toFixed(1); }

  /* New numbers (sources in "?" and in docs/tools-v2-water-pollution-brief.md, Build notes):
     HEALTHY  5 mg/L: most aquatic animals need about 5 mg/L or more to thrive (Chesapeake Bay Program,
              "Dissolved oxygen"). Below it the readout says Stressed; below W.HYPOXIC (2 mg/L), Dead zone.
     TROUT    9.5 mg/L: EPA's 1986 dissolved oxygen criteria for coldwater fish, early life stages (7-day mean
              in the water column; EPA factsheet on dissolved oxygen, 2021). What young trout NEED is oxygen in
              the water; the tool compares it with the most the water can HOLD (saturation, read to 0.1 mg/L):
              where even full water holds less than 9.5 mg/L, trout cannot breed there.
     SEW_LEVEL the lake below the plant: the share of nitrogen and phosphorus left after the last stage (W.SEWAGE,
              EPA typical values) scaled to the chapter 1 runoff level, raw sewage = the heaviest level, 5; and the
              organic matter (BOD) left goes in as an oxygen demand on day 0 (W.lake's third argument, W.BOD_D).
              A teaching mapping, not a measured one ("?" says so). */
  var HEALTHY = 5, TROUT = 9.5, SEW_T = 20, ALG_MAX = 160, Y_MAX = 12;
  function SEW_LEVEL(i){ return 5 * W.SEWAGE.stages[i].left.nutrients / 100; }
  var SEW_RUNS = {};   // runs are cached: a drag never recomputes one it has already shown
  function sewRun(i){ return SEW_RUNS[i] || (SEW_RUNS[i] = prep(W.lake(SEW_LEVEL(i), SEW_T, W.SEWAGE.stages[i].left.bod))); }
  var CH = [{ value: 'fert', label: 'Fertilizer runoff', short: 'Fertilizer' }, { value: 'heat', label: 'Hot water' }, { value: 'sew', label: 'Sewage' }];
  var STEPS = [{ name: 'Runoff' }, { name: 'Algae bloom' }, { name: 'Algae die' }, { name: 'Decomposers feed' }, { name: 'Oxygen drops' }, { name: 'Dead zone', tone: 'bad' }];
  var STEP_NAMES = STEPS.map(function(x){ return x.name; });
  var STEP_LONG = ['Rain washes fertilizer off the field. Nitrate and phosphate reach the lake.',
    'Nitrate and phosphate usually limit algae. With more of them, algae multiply and turn the surface green.',
    'The bloom shades itself and runs out of nutrients. Huge numbers of algae die, turn brown and sink.',
    'Aerobic bacteria break down the dead algae on the bottom. They use oxygen as they respire.',
    'Decomposers use oxygen faster than the air can put it back into the bottom water.',
    'Below 2 mg/L the water is hypoxic: fish leave or die. This is a dead zone.'];
  var SEW_STEPS = ['Outfall', 'Algae bloom', 'Algae die', 'Decomposers feed', 'Oxygen drops', 'Dead zone'];
  var SEW_LONG = ['Treated water leaves the plant for the lake, with whatever N, P and organic matter the plant left in it.',
    STEP_LONG[1], STEP_LONG[2],
    'Aerobic bacteria break down the dead algae, and any organic matter (BOD) the plant left, using oxygen as they respire.',
    STEP_LONG[4], STEP_LONG[5]];
  var REC_LONG = 'Most of the dead algae are gone, so decomposers slow down and the air puts oxygen back into the water.';
  var SEW_NAMES = ['No treatment', 'Primary', 'Secondary', 'Tertiary', 'Disinfection'];
  var SEW_DOES = ['', 'solids settle', 'bacteria eat waste', 'removes N and P', 'kills germs'];
  var SEW_DOES_S = ['', 'solids', 'organic', 'N and P', 'germs'];

  function status(o){ return o < W.HYPOXIC ? { status: 'Dead zone', tone: 'bad' } : o < HEALTHY ? { status: 'Stressed', tone: 'warn' } : { status: 'Healthy', tone: 'good' }; }
  function dark(){ return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function sk(n){ return n + (n === 1 ? ' sack' : ' sacks'); }
  /* Oxygen as written everywhere (readout, scene, graph, words): one decimal, but two right around the 2 mg/L line,
     so a value just under it never reads "2.0" next to "Dead zone". */
  function fO(o){ return o >= 1.95 && o < 2.05 ? T.F(o, 2) : T.F(o, 1); }

  /* Colors for the picture (the CSS role colors are in water-pollution.css; these are the blends JS computes). */
  var PAL = {
    light: { sky0: '#BFE0F2', sky1: '#EEF6FA', far: '#B7D2B4', near: '#94BE86', grass: '#78AE48', grass2: '#5C8F35', soil: '#B88C5C', soil2: '#8F6A44', soil3: '#6F5236',
      top: [118, 189, 226], deep: [44, 108, 156], green: [92, 158, 40], mat: [70, 140, 30], murky: [74, 70, 48], bed: '#8C7656', bed2: '#6A583F', silt: '#A08A66',
      alg: [86, 150, 44], algHi: [150, 205, 90], brown: [120, 84, 44], nut: '#E69F00', bac: '#B5509A', bub: 'rgba(255,255,255,.95)', sun: '#F6C445',
      cloud: '#8E9A99', cloud2: '#A9B4B2', rain: '#5A9CCB', conc: '#C9CED0', conc2: '#A4ABAD', steel: '#7B8A90', brick: '#B5654A', roof: '#7A4A3A', warm: [230, 120, 60] },
    dark: { sky0: '#18324A', sky1: '#203A4E', far: '#2D4A3F', near: '#2B4636', grass: '#4E7F33', grass2: '#3D6A28', soil: '#6A5238', soil2: '#53402B', soil3: '#3E3020',
      top: [52, 120, 160], deep: [22, 60, 94], green: [74, 140, 40], mat: [84, 150, 44], murky: [44, 42, 30], bed: '#4E4231', bed2: '#3A3024', silt: '#5E5038',
      alg: [92, 170, 60], algHi: [150, 215, 100], brown: [150, 108, 64], nut: '#F3C04F', bac: '#E08CC8', bub: 'rgba(225,242,255,.9)', sun: '#E8E2C8',
      cloud: '#4C5A60', cloud2: '#5E6C72', rain: '#7FB6DE', conc: '#5A6468', conc2: '#465054', steel: '#8A9AA0', brick: '#9A5A44', roof: '#6A4436', warm: [240, 140, 80] }
  };
  function mix(a, b, f){ f = clamp(f, 0, 1); return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * f) + ',' + Math.round(a[1] + (b[1] - a[1]) * f) + ',' + Math.round(a[2] + (b[2] - a[2]) * f) + ')'; }
  function mixA(a, b, f){ f = clamp(f, 0, 1); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  function rnd(seed, n){ var r = M.rng(seed), out = []; for(var i = 0; i < n; i++) out.push([r(), r(), r(), r()]); return out; }
  var R_ALG = rnd(7, 90), R_BAC = rnd(13, 44), R_BUB = rnd(19, 22), R_NUT = rnd(23, 30), R_PLANT = rnd(29, 14), R_PEB = rnd(31, 26), R_RAIN = rnd(37, 40);

  /* A model value on a fractional day (straight lines between the model's daily values). */
  function at(arr, d){ var i = Math.floor(d), f = d - i; if(i >= arr.length - 1) return arr[arr.length - 1]; if(i < 0) return arr[0]; return arr[i] + (arr[i + 1] - arr[i]) * f; }

  /* Per run: what the picture needs beyond the model's own arrays (when each algae clump dies, the largest dead pool). */
  function prep(run){
    var peakA = run.peakA, nA = Math.round(clamp(peakA / 30, 0.08, 1.3) * 64), deaths = [];
    for(var k = 0; k < nA; k++){
      var thr = peakA * (1 - (k + 0.5) / nA), dd = null;
      for(var i = Math.max(1, Math.round(run.peakDay)); i < run.days.length; i++) if(run.A[i] < thr){ var a0 = run.A[i - 1], a1 = run.A[i]; dd = i - 1 + (a0 - thr) / ((a0 - a1) || 1); break; }
      deaths.push(dd);
    }
    var Dmax = 0; run.D.forEach(function(v){ if(v > Dmax) Dmax = v; });
    run.nA = nA; run.deaths = deaths; run.Dmax = Dmax;
    var fh = -1; for(var j = 0; j < run.O.length; j++) if(run.O[j] < W.HYPOXIC){ fh = j; break; }
    run.firstHyp = fh;
    // the day the instant view shows: the lowest oxygen; on a floor of 0 mg/L, a few days into the dead zone (the
    // oxygen is just as low there), so what the dead zone does to the fish is in the picture
    var wd = run.stages[0] == null ? 0 : run.minDay;
    if(fh > -1){ var w3 = Math.min(W.LAKE_DAYS, Math.max(wd, fh + 3)); if(run.O[w3] - run.min < 0.05) wd = w3; }
    run.worst = wd;
    return run;
  }
  /* The step a run is in on a day, with recovery: once the low is past and the water is back above 2 mg/L, the
     scene, the timeline and the readout all say the lake is recovering (one rule, so they agree). */
  function phase(r, d){
    var cur = W.stageAt(r, d), o = at(r.O, d);
    var rec = cur >= 4 && d > r.minDay + 0.5 && o >= W.HYPOXIC && o > r.min + 0.4;
    return { cur: cur, rec: rec, o: o };
  }

  /* A fertilizer bag: a plump filled sack with a gathered, stitched top, shading on its right side, a shadow on the
     ground and a printed orange label (N-P-K) under a green band, so it reads as a bag of fertilizer at any size. */
  function sack(x, y, w, P0){
    var h = w * 1.22, lab = w >= 31;
    function P(a, b){ return n1(a) + ' ' + n1(b); }
    var body = 'M' + P(-w * 0.5, 0) + ' C' + P(-w * 0.62, -h * 0.3) + ' ' + P(-w * 0.55, -h * 0.72) + ' ' + P(-w * 0.42, -h * 0.86) +
      ' L' + P(w * 0.42, -h * 0.86) + ' C' + P(w * 0.55, -h * 0.72) + ' ' + P(w * 0.62, -h * 0.3) + ' ' + P(w * 0.5, 0) + ' Q' + P(0, h * 0.06) + ' ' + P(-w * 0.5, 0) + 'Z';
    return '<g class="wp2-sack" transform="translate(' + n1(x) + ' ' + n1(y) + ')">' +
      '<ellipse class="wp2-sack-sh" cx="' + n1(w * 0.06) + '" cy="1" rx="' + n1(w * 0.62) + '" ry="' + n1(Math.max(2, w * 0.09)) + '"/>' +
      '<path class="wp2-sack-bag" d="' + body + '"/>' +
      '<path class="wp2-sack-shade" d="M' + P(w * 0.2, -h * 0.86) + ' L' + P(w * 0.42, -h * 0.86) + ' C' + P(w * 0.55, -h * 0.72) + ' ' + P(w * 0.62, -h * 0.3) + ' ' + P(w * 0.5, 0) + ' Q' + P(w * 0.36, h * 0.035) + ' ' + P(w * 0.24, h * 0.03) + ' C' + P(w * 0.36, -h * 0.3) + ' ' + P(w * 0.32, -h * 0.66) + ' ' + P(w * 0.2, -h * 0.86) + 'Z"/>' +
      '<path class="wp2-sack-top" d="M' + P(-w * 0.42, -h * 0.85) + ' L' + P(-w * 0.5, -h) + ' Q' + P(-w * 0.32, -h * 0.94) + ' ' + P(-w * 0.16, -h * 1.0) + ' Q' + P(0, -h * 0.93) + ' ' + P(w * 0.16, -h * 1.0) + ' Q' + P(w * 0.32, -h * 0.94) + ' ' + P(w * 0.5, -h) + ' L' + P(w * 0.42, -h * 0.85) + 'Z"/>' +
      '<path class="wp2-sack-st" d="M' + P(-w * 0.42, -h * 0.88) + ' H' + n1(w * 0.42) + '"/>' +
      '<rect class="wp2-sack-g" x="' + n1(-w * 0.36) + '" y="' + n1(-h * 0.68) + '" width="' + n1(w * 0.72) + '" height="' + n1(h * 0.09) + '" rx="1.5"/>' +
      '<rect class="wp2-sack-b" x="' + n1(-w * 0.36) + '" y="' + n1(-h * 0.58) + '" width="' + n1(w * 0.72) + '" height="' + n1(h * 0.32) + '" rx="2.5"/>' +
      (lab ? '<text class="wp2-sack-t" x="0" y="' + n1(-h * 0.36) + '" text-anchor="middle" font-size="' + n1(Math.min(11, w * 0.24)) + '">N-P-K</text>'
        : '<text class="wp2-sack-t" x="0" y="' + n1(-h * 0.36) + '" text-anchor="middle" font-size="' + n1(w * 0.3) + '">NPK</text>') + '</g>';
  }
  /* One tank in cutaway; on: used; i: 0 raw inflow, 1 primary, 2 secondary, 3 tertiary, 4 disinfection. */
  function tankArt0(tk, i, on, t, P0, ph, moving, noDoes){
    var out = [], x0 = tk.x, x1 = tk.x + tk.w, y0 = tk.y, y1 = tk.y + tk.h, wl = y0 + tk.h * 0.16, cx = (x0 + x1) / 2, ww = x1 - x0;
    var lf = i ? W.SEWAGE.stages[i].left : W.SEWAGE.stages[0].left, dirt = clamp((lf.solids * 0.5 + lf.bod * 0.5) / 100, 0, 1);
    var water = mixA(P0.top, P0.murky, dirt * 0.9);
    out.push('<g class="wp2-tank' + (on ? '' : ' is-off') + '">');
    out.push('<rect class="wp2-tank-in" x="' + n1(x0) + '" y="' + n1(y0) + '" width="' + n1(ww) + '" height="' + n1(tk.h) + '" rx="4"/>');
    out.push('<rect x="' + n1(x0 + 3) + '" y="' + n1(wl) + '" width="' + n1(ww - 6) + '" height="' + n1(y1 - wl - 3) + '" fill="' + mix(water, water, 0) + '"/>');
    var mv = on && moving ? t : 0;
    if(i === 0){
      for(var k = 0; k < 7; k++){ var px = x0 + 6 + (k * 13 % Math.max(8, ww - 12)), py = wl + 6 + ((k * 17 + mv * 10) % Math.max(8, y1 - wl - 12)); out.push('<circle cx="' + n1(px) + '" cy="' + n1(py) + '" r="' + n1(1.6 + k % 3) + '" fill="' + P0.soil2 + '"/>'); }
    } else if(i === 1){
      out.push('<path fill="' + P0.soil2 + '" d="M' + n1(x0 + 3) + ' ' + n1(y1 - tk.h * 0.2) + ' Q' + n1(cx) + ' ' + n1(y1 - tk.h * 0.05) + ' ' + n1(x1 - 3) + ' ' + n1(y1 - tk.h * 0.2) + ' V' + n1(y1 - 3) + ' H' + n1(x0 + 3) + 'Z"/>');
      for(var a = 0; a < 4; a++){ var ax = x0 + ww * (0.2 + a * 0.2), ay = wl + 8 + ((a * 9 + mv * 8) % Math.max(10, tk.h * 0.45)); out.push('<circle cx="' + n1(ax) + '" cy="' + n1(ay) + '" r="2.4" fill="' + P0.soil2 + '"/>'); }
    } else if(i === 2){
      out.push('<path stroke="' + P0.steel + '" stroke-width="3" d="M' + n1(x0 + 6) + ' ' + n1(y1 - 7) + ' H' + n1(x1 - 6) + '"/>');
      for(var c = 0; c < 4; c++) for(var b = 0; b < 4; b++){ var by = y1 - 12 - ((b * (tk.h * 0.18) + mv * 26) % (y1 - wl - 16)); out.push('<circle cx="' + n1(x0 + ww * (0.15 + c * 0.23) + (b % 2 ? 2 : -2)) + '" cy="' + n1(by) + '" r="' + n1(2 + b % 2) + '" class="wp2-bub"/>'); }
      for(var r = 0; r < 6; r++) out.push('<rect class="wp2-bac" x="' + n1(x0 + 8 + (r * 23 % Math.max(10, ww - 18)) + Math.sin(mv * 2 + r) * 2) + '" y="' + n1(wl + 10 + (r * 19 % Math.max(10, y1 - wl - 26))) + '" width="5.2" height="2.2" rx="1.1"/>');
    } else if(i === 3){
      var fT = wl + (y1 - wl) * 0.45;
      out.push('<rect fill="' + P0.silt + '" x="' + n1(x0 + 3) + '" y="' + n1(fT) + '" width="' + n1(ww - 6) + '" height="' + n1(y1 - fT - 3) + '"/>');
      for(var gq = 0; gq < 12; gq++) out.push('<circle cx="' + n1(x0 + 6 + (gq * 17 % Math.max(8, ww - 12))) + '" cy="' + n1(fT + 5 + (gq * 7 % Math.max(4, y1 - fT - 10))) + '" r="2" fill="' + P0.bed2 + '"/>');
      for(var nq = 0; nq < 6; nq++) out.push('<circle cx="' + n1(x0 + 8 + (nq * 29 % Math.max(10, ww - 16))) + '" cy="' + n1(fT + 2 + (nq % 3) * 3) + '" r="2" fill="' + P0.nut + '"/>');
    } else if(i === 4){
      for(var u = 0; u < 3; u++){ var uy = wl + (y1 - wl) * (0.25 + u * 0.27); out.push('<rect class="wp2-uv" x="' + n1(x0 + 7) + '" y="' + n1(uy - 3) + '" width="' + n1(ww - 14) + '" height="6" rx="3"/>'); }
    }
    out.push('<path class="wp2-wall" d="M' + n1(x0) + ' ' + n1(y0) + ' V' + n1(y1) + ' H' + n1(x1) + ' V' + n1(y0) + '"/>');
    out.push('<rect class="wp2-rim" x="' + n1(x0 - 4) + '" y="' + n1(y0 - 3) + '" width="' + n1(ww + 8) + '" height="6" rx="2"/>');
    out.push('</g>');
    // names under the tank (and what it does)
    var nm = i ? SEW_NAMES[i] : (ph ? 'Raw' : 'Raw sewage'), nmS = ph && i === 4 ? 'Disinfect' : nm;
    out.push('<text class="wp2-tname' + (on ? '' : ' is-off') + (ph ? ' is-ph' : '') + '" x="' + n1(cx) + '" y="' + n1(y1 + (ph ? 16 : 18)) + '" text-anchor="middle">' + esc(nmS) + '</text>');
    // what the tank does, dark text on a white pill (readable on the green bank, and on a skipped tank too)
    if(i && !noDoes){
      var dt = ph ? SEW_DOES_S[i] : SEW_DOES[i], pw = Math.min(ww + (ph ? 6 : 8), dt.length * (ph ? 6.6 : 7) + 14), py = y1 + (ph ? 22 : 25);
      out.push('<rect class="wp2-tpill' + (on ? '' : ' is-off') + '" x="' + n1(cx - pw / 2) + '" y="' + n1(py) + '" width="' + n1(pw) + '" height="' + (ph ? 17 : 19) + '" rx="' + (ph ? 8.5 : 9.5) + '"/>' +
        '<text class="wp2-tdoes' + (on ? '' : ' is-off') + '" x="' + n1(cx) + '" y="' + n1(py + (ph ? 12.5 : 14)) + '" text-anchor="middle">' + esc(dt) + '</text>');
    }
    return out.join('');
  }
  /* --------------------------------------------------------------- mount */
  T.mount('water-pollution', function(app, data){
    var ex = null, modes = null;
    modes = T.modes(app, { slug: 'water-pollution',
      explore: function(host){ ex = explore(host, data, function(){ return modes; }); },
      quiz: function(host){ ex.quiz(host, data); },
      onShow: function(m){ if(ex) ex.shown(m); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* Captions: one sentence each, at most about 15 words (owner round: play vs quiz). */
  var CAP = ['Rain washes fertilizer off the field and into the lake.',
    'Nitrate and phosphate feed algae; they multiply and turn the surface green.',
    'The bloom runs out of nutrients; the algae die, turn brown and sink.',
    'Bacteria on the bottom break down the dead algae and use oxygen.',
    'Decomposers use oxygen faster than the air can put it back.',
    'Below 2 mg/L the water is a dead zone: fish leave or die.'];
  var REC_CAP = 'The dead algae are used up, so oxygen comes back from the air.';
  var SEW_CAP = ['Treated water carries leftover nitrogen, phosphorus and organic matter into the lake.'].concat(CAP.slice(1));
  var SEW_BOD_CAP = 'Bacteria eat the sewage’s organic matter, so oxygen falls before any bloom.';
  /* What to understand (owner round 2: clarity): one plain purpose line per chapter, and one takeaway sentence when a
     run reaches its end. */
  var PURPOSE = { fert: 'How farm fertilizer kills a lake’s fish', heat: 'How heat alone drives trout from a river', sew: 'Which sewage treatment step saves the lake below' };
  var SEW_STOP = ['No treatment', 'Stops after primary', 'Stops after secondary', 'Stops after tertiary', 'All 4 tanks'];
  var TAKE = { fert: 'The fish left or died because bacteria breaking down the dead algae used up most of the oxygen.',
    fertMid: 'A smaller bloom: decomposers pulled the oxygen down, but not into a dead zone.',
    fertLow: 'This little fertilizer makes only a small bloom, so the fish stay healthy.',
    heat: 'Heat alone made the river hold less oxygen, too little for young trout, so they moved away.',
    sec: 'Nitrogen and phosphorus left after secondary fed a bloom, and its decay used up most of the oxygen.',
    sewBad: 'Bacteria breaking down the leftover sewage and dead algae used up most of the lake’s oxygen.',
    sewOk: 'Tertiary treatment removed most nitrogen and phosphorus, so the lake below stayed healthy.' };

  /* ================================================================ Explore (free play) and the questions on it */
  function explore(host, data, getModes){
    var S = { ch: 'fert', sacks: 1, tLake: 20, inst: true, day: 0, seen: 0, up: 10, warm: 0, stage: 4, sday: 0, sseen: 0, clock: 0, mode: 'explore', q: null, blank: false };
    try{ var q0 = new URLSearchParams(location.search).get('ch'); if(q0 === 'heat' || q0 === 'sew') S.ch = q0; }catch(e){}
    var RUNS = {};
    function lakeRun(n, t){ var k = n + '|' + t; return RUNS[k] || (RUNS[k] = prep(W.lake(n, t))); }
    var run = lakeRun(S.sacks, S.tLake), sew = sewRun(S.stage);
    var LS = null, visible = true, nid = T.nid('wp'), QZ = null, fast = false;
    function inQuiz(){ return S.mode === 'quiz' && !!S.q; }

    /* ---- the stage: tabs, the scene with its controls on it, Play and the progress line, one caption, the graph */
    var stage = document.createElement('div'); stage.className = 'wp2-stage';
    var tabs = K.tabs({ label: 'Chapters', items: CH, value: S.ch, big: true, onChange: function(v){ setCh(v); } });
    stage.appendChild(tabs.el);
    // what to understand: one plain purpose line per chapter, and the "Show me how" tour link beside it
    var head = document.createElement('div'); head.className = 'wp2-head';
    var purpose = document.createElement('p'); purpose.className = 'wp2-purpose';
    var howB = document.createElement('button'); howB.type = 'button'; howB.className = 'tk2-how'; howB.textContent = 'Show me how';
    howB.addEventListener('click', function(){ startTour(true); });
    head.appendChild(purpose); head.appendChild(howB);
    stage.appendChild(head);
    var sceneBox = document.createElement('div'); sceneBox.className = 'wp2-scene'; sceneBox.id = nid + '-sc';
    sceneBox.innerHTML = '<svg class="wp2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="wp2-static"></g><g class="wp2-dyn"></g></svg>';
    stage.appendChild(sceneBox);
    var svg = sceneBox.querySelector('svg'), gStatic = svg.querySelector('.wp2-static'), gDyn = svg.querySelector('.wp2-dyn');
    var layer = K.layer(sceneBox);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
    var bar = document.createElement('div'); bar.className = 'wp2-bar';
    function rNow(){ return S.ch === 'sew' ? sew : run; }
    var player = K.player({ min: 0, max: W.LAKE_DAYS, hold: 2,
      speed: function(v){ var r = rNow(), end = r.firstHyp > -1 ? r.firstHyp + 2 : (r.stages[4] != null ? r.stages[4] + 4 : 18); return v < end ? 1.15 : 6; },
      // a short hold at each step's day (and one just after day 0 for the runoff itself), so each link can be seen
      stops: function(){ var r = rNow(); if(r.stages[0] == null) return []; return [0.6].concat(r.stages.filter(function(d){ return d != null && d > 0.6; })).filter(function(d, i, a){ return a.indexOf(d) === i; }); },
      get: function(){ return S.ch === 'sew' ? S.sday : S.day; },
      set: function(v){ if(S.ch === 'sew') setSday(v, 'play'); else setDay(v, 'play'); },
      onHold: function(v){ words(); var i = W.stageAt(rNow(), v), nm = S.ch === 'sew' ? SEW_STEPS : STEP_NAMES; if(i >= 0 && !S.blank) say(nm[i] + '. ' + (S.ch === 'sew' ? SEW_CAP : CAP)[i]); },
      before: function(){ tourDid('play'); if(instOn()){ S.inst = false; if(S.ch === 'sew') setSday(0, 'tap'); else setDay(0, 'tap'); player.reset(); } }, labels: { play: 'Watch it happen', pause: 'Pause', again: 'Watch again' }, onEnd: function(){ if(S.ch === 'sew') setSday(W.LAKE_DAYS, 'play'); else setDay(W.LAKE_DAYS, 'play'); afterRun(); } });
    player.el.classList.add('is-sm');
    var prog = K.progress({ big: true, label: 'Day, 0 to 60', min: 0, max: W.LAKE_DAYS, step: 1, value: 0,
      valuetext: function(v){ return dayText(v); }, onStart: function(){ player.stop(); },
      onInput: function(v){ if(S.ch === 'sew') setSday(v, 'prog'); else setDay(v, 'prog'); } });
    bar.appendChild(prog.el); bar.appendChild(player.el);
    stage.appendChild(bar);
    // under the picture: the cause line (instant view) or the step's caption (time view), and one optional teaser
    var lines = document.createElement('div'); lines.className = 'wp2-lines';
    var cap = document.createElement('p'); cap.className = 'wp2-cap';
    var tease = document.createElement('p'); tease.className = 'wp2-tz'; tease.hidden = true;
    tease.innerHTML = '<span class="wp2-tz-t"></span><span class="wp2-tz-ok" role="img" aria-label="Done" hidden>' + K.icon('check') + '</span><button type="button" class="wp2-tz-x" aria-label="Hide this challenge">\u00d7</button>';
    lines.appendChild(cap); lines.appendChild(tease);
    stage.appendChild(lines);
    var graphBox = document.createElement('div'); graphBox.className = 'wp2-graph';
    graphBox.innerHTML = '<svg class="wp2-gsvg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"></svg>';
    stage.appendChild(graphBox);
    var gsvg = graphBox.querySelector('svg');
    // the graph follows a drag too (pointer only: the progress line, or the handle on the pipe, is the keyboard's)
    var scrub = K.scrub(graphBox, { knob: false, label: 'Day on the graph', min: 0, max: W.LAKE_DAYS, step: 1, value: 0, rect: [0, 0, 10, 10],
      onStart: function(){ player.stop(); }, onInput: function(v){ onScrub(v); }, onEnd: function(){ if(S.ch === 'heat') gEnd(); } });
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
    stage.appendChild(live);
    host.appendChild(stage);

    /* ---- on-picture controls (placed by each scene's layout). Each one's label on the picture says what it is and
       how to use it ("Fertilizer: drag to add more"), so the kit's one-off "Drag" / "Tap" chip is not needed. */
    var cSacks = K.drag(layer, { key: 'apenv-wp-sacks', label: 'Fertilizer sacks on the field', min: 0, max: 5, step: 1, value: S.sacks, track: [0, 0, 1, 0], chip: false,
      valuetext: function(v){ return sk(v) + ' of fertilizer'; }, tag: function(v){ return sk(v); },
      onInput: function(v){ gBegin(); player.stop(); S.sacks = v; newRun(); tourDid('sacks'); }, onEnd: function(){ gEnd(); } });
    // the lake's thermometer: a plain knob at the top of its column, named on the picture ("Lake temperature: drag")
    var cTemp = K.drag(layer, { label: 'Lake temperature', min: 10, max: 30, step: 1, value: S.tLake, track: [0, 1, 0, 0],
      valuetext: function(v){ return 'Lake at ' + v + ' degrees Celsius'; }, tag: function(v){ return S.q && S.q.loudTemp ? v + ' °C' : ''; },
      onInput: function(v){ gBegin(); player.stop(); S.tLake = v; newRun(); }, onEnd: function(){ if(QZ) QZ.changed('temp'); gEnd(); } });
    var cWarm = K.drag(layer, { key: 'apenv-wp-warm', label: 'Hot water: how much warmer the outflow makes the river downstream', min: 0, max: 15, step: 1, value: S.warm, track: [0, 1, 0, 0], chip: false,
      valuetext: function(v){ return 'Downstream ' + v + ' degrees warmer, ' + (S.up + v) + ' degrees Celsius'; }, tag: function(v){ return '+' + v + ' °C'; }, tagSide: 'left',
      onInput: function(v){ gBegin(); S.warm = v; heatChanged(); }, onEnd: function(){ tourDid('warm'); gEnd(); } });
    var cTanks = [0, 1, 2, 3, 4].map(function(i){
      return K.tap(layer, { key: i === 1 ? 'apenv-wp-tank' : null, label: i ? 'Stop after ' + SEW_NAMES[i].toLowerCase() + ' treatment' : 'No treatment: raw sewage to the lake', box: [0, 0, 1, 1], pressed: i === S.stage, chip: false,
        onClick: function(){ gBegin(); setStage(i); tourDid('tank'); gEnd(); } });
    });

    /* ---- what to do: "Show me how", three pointers per chapter at the real controls, once per device (K.tour) */
    function knobOf(c){ return c.el.querySelector('.tk2-knob'); }
    function inSvg(sel){ return function(){ var e = sceneBox.querySelector(sel); return e || sceneBox; }; }
    var TOURS = {
      fert: [{ id: 'sacks', text: 'Drag the fertilizer. The lake and the graph change at once.', target: function(){ return knobOf(cSacks); } },
        { id: 'time', text: 'Drag the time bar to move through the 60 days, or press Watch it happen.', target: function(){ return prog.el; } },
        { id: 'watch', text: 'Read the oxygen here. Fish need 5 or more.', target: inSvg('.wp2-chip rect') }],
      heat: [{ id: 'warm', text: 'Drag the hot water handle up to warm the river.', target: function(){ return knobOf(cWarm); } },
        { id: 'look', text: 'Compare how much oxygen the water can hold upstream and downstream.', target: inSvg('.wp2-panel.is-dn') },
        { id: 'graph', text: 'The curve: the warmer the water, the less oxygen it can hold.', target: function(){ return graphBox; } }],
      sew: [{ id: 'tank', text: 'Tap a tank to stop treatment there. The lake below changes at once.', target: function(){ return cTanks[2].el; } },
        { id: 'time', text: 'Drag the time bar to move through the 60 days, or press Watch it happen.', target: function(){ return prog.el; } },
        { id: 'watch', text: 'Read the lake\u2019s oxygen here. Fish need 5 or more.', target: inSvg('.wp2-chip rect') }]
    };
    var tours = {};
    ['fert', 'heat', 'sew'].forEach(function(c){ tours[c] = K.tour({ key: 'apenv-wp-' + c, label: 'Show me how', steps: TOURS[c], onClose: function(had){ draw(); if(had) try{ howB.focus({ preventScroll: true }); }catch(e){} } }); });
    function tourDid(id){ var t = tours[S.ch]; if(t && t.active()) t.did(id); }
    function stopTours(){ Object.keys(tours).forEach(function(c){ tours[c].stop(); }); }
    function startTour(force){
      if(S.mode !== 'explore' || inQuiz()) return;
      stopTours();
      // owner round 3: the tour opens only on request (its link, or "?"); a first visit gets the one cue instead
      if(force){ hideCue(false); tours[S.ch].start(true); draw(); return; }
      showCue();
    }
    /* ---- the one cue (K.cue): a still message at the first control, gone for good at the first interaction */
    var cues = {
      fert: K.cue(layer, { key: 'apenv-wp-fert', text: 'Drag the fertilizer', side: 'below', at: function(){ var f = S.sacks / 5; return G.pile ? [lerp(G.kx0, G.sx1, f), G.plat + 30] : [lerp(G.kx0, G.sx1, f), G.plat - 2]; } }),
      heat: K.cue(layer, { key: 'apenv-wp-heat', text: 'Drag the hot water', side: 'below', at: function(){ return [G.vX, lerp(G.vY0, G.vY1, S.warm / 15)]; } }),
      sew: K.cue(layer, { key: 'apenv-wp-sew', text: 'Tap a tank', side: 'above', at: function(){ var tk = G.tanks[2]; return [tk.x + tk.w / 2, tk.y + 22]; } })
    };
    function showCue(){
      Object.keys(cues).forEach(function(c){ if(c !== S.ch) cues[c].hide(false); });
      if(S.mode !== 'explore' || inQuiz() || !G || tours[S.ch].active()){ cues[S.ch].hide(false); return; }
      cues[S.ch].show(); cues[S.ch].place();
    }
    function hideCue(usedIt){ Object.keys(cues).forEach(function(c){ cues[c].hide(usedIt && c === S.ch); }); }
    [sceneBox, bar].forEach(function(n){ ['pointerdown', 'input', 'click'].forEach(function(ev){ n.addEventListener(ev, function(){ if(S.mode === 'explore') hideCue(true); }, true); }); });

    /* ---- instant view (owner round 3). While a control is dragged, and after it is let go until the time bar is
       touched, the lake shows that run's worst day (the lowest oxygen) and the graph its whole curve: change a thing,
       see what it does, no Play needed. The setting before the change stays as a faint line ("before: 2 sacks"). */
    function expl(){ return S.mode === 'explore' && !inQuiz(); }
    function instOn(){ return expl() && S.inst && S.ch !== 'heat'; }
    function worstDay(r){ return r.worst; }
    function pin(){
      if(!instOn()) return;
      var d = worstDay(rNow());
      if(S.ch === 'sew'){ S.sday = d; S.sseen = W.LAKE_DAYS; } else { S.day = d; S.seen = W.LAKE_DAYS; }
      prog.value(d); scrub.value(d); player.paint();
    }
    var prev = null, gest = null;
    function snap(){
      return S.ch === 'heat' ? { key: 'h' + S.warm + '|' + S.up, warm: S.warm, up: S.up, label: '+' + S.warm + ' \u00b0C' }
        : S.ch === 'sew' ? { key: 's' + S.stage, run: sew, label: S.stage === 4 ? 'all 4 tanks' : SEW_NAMES[S.stage].toLowerCase() }
        : { key: S.sacks + '|' + S.tLake, run: run, sacks: S.sacks, t: S.tLake };
    }
    // a change starts (the first input of a drag, a key press, a tap): remember the setting it started from
    function gBegin(){ if(!expl()) return; if(!gest){ tzNext(); gest = snap(); } prev = gest; }
    function gEnd(){ if(!gest) return; gest = null; refHtml(); if(!expl()) return; tzCheck(); say(causeText() + (tzLoad(S.ch).done ? ' Challenge done.' : '')); }
    function prevOn(){ return prev && expl() && prev.key !== snap().key ? prev : null; }
    function prevLabel(p){ return 'before: ' + (p.label || (p.sacks !== S.sacks ? sk(p.sacks) : p.t + ' \u00b0C')); }

    /* ---- the cause line: the chain for this setting in a few words, each idea in its one colour */
    function bloomWord(r){ return r.peakA < 2 ? 'no bloom' : r.peakA < 12 ? 'small bloom' : r.peakA < 22 ? 'bloom' : r.peakA < 34 ? 'big bloom' : 'huge bloom'; }
    function oxySeg(r){ return { t: 'oxygen ' + fO(r.min), role: 'oxy', say: 'oxygen ' + fO(r.min) + ' milligrams per liter' }; }
    function endSeg(r){ return r.hypoxicDays > 0 ? { t: 'dead zone ' + r.hypoxicDays + (r.hypoxicDays === 1 ? ' day' : ' days'), role: 'bad' } : { t: r.min < HEALTHY ? 'fish stressed' : 'fish healthy', role: 'ink' }; }
    function cause(){
      var c = S.ch, out = [];
      if(c === 'heat'){ var h = heatPts(); return [{ t: '+' + S.warm + ' \u00b0C', role: 'heat' }, { t: 'river holds ' + F(h.d1) + ' mg/L', role: 'oxy', say: 'the river can hold ' + F(h.d1) + ' milligrams of oxygen per liter' }, { t: h.d1 < TROUT ? 'too little for trout' : 'trout stay', role: 'ink' }]; }
      if(c === 'sew'){
        out.push({ t: SEW_STOP[S.stage], role: 'ink' });
        if(S.stage <= 1) out.push({ t: 'sewage rots', role: 'dead' });
        else out.push({ t: S.stage >= 3 ? 'nutrients removed' : 'nutrients left', role: 'nut' });
        out.push({ t: bloomWord(sew), role: 'alg' });
        if(S.stage === 2) out.push({ t: 'dead algae rot', role: 'dead' });
        out.push(oxySeg(sew), endSeg(sew));
        return out;
      }
      out.push({ t: sk(S.sacks), role: 'nut' });
      if(S.tLake !== 20) out.push({ t: S.tLake + ' \u00b0C lake', role: 'heat', join: '+' });
      out.push({ t: bloomWord(run), role: 'alg' });
      if(run.peakA >= 2) out.push({ t: 'dead algae rot', role: 'dead' });
      out.push(oxySeg(run), endSeg(run));
      return out;
    }
    function causeText(){ return cause().map(function(x, i){ return (i ? (x.join === '+' ? ' and ' : ', then ') : '') + (x.say || x.t); }).join('') + '.'; }
    function causeHtml(){ return cause().map(function(x, i){ return (i ? '<span class="wp2-cz-a" aria-hidden="true">' + (x.join === '+' ? '+' : '\u2192') + '</span>' : '') + '<span class="wp2-cz is-' + x.role + '">' + esc(x.t) + '</span>'; }).join(''); }

    /* ---- teasers: one optional, ungraded line per chapter (at most three, one at a time). Nothing is locked and
       nothing is scored: a quiet check mark when it is met, the next one at the next change, a cross to hide them.
       Each is reachable in the model (checked in the brief): 4 sacks without a dead zone needs a lake of 14 °C or
       cooler; 2 sacks make a dead zone from 25 °C up; 5 sacks give 28 days or more from 21 °C up; young trout hold on to
       +8 °C and the river holds a fifth less from +11 °C (upstream 10 °C); tertiary is the fewest tanks, and raw or
       primary effluent makes a dead zone by day 8 or 9. */
    var TZ = {
      fert: [{ text: 'Can you keep the fish alive with 4 sacks?', ok: function(){ return S.sacks >= 4 && run.hypoxicDays === 0; } },
        { text: 'Can just 2 sacks make a dead zone?', ok: function(){ return S.sacks >= 1 && S.sacks <= 2 && run.hypoxicDays > 0; } },
        { text: 'Make a dead zone that lasts 4 weeks.', ok: function(){ return run.hypoxicDays >= 28; } }],
      heat: [{ text: 'Find the warmest outflow the trout can take.', can: function(){ return trBest() >= 0; }, ok: function(){ return S.warm === trBest(); } },
        { text: 'Make the river hold a fifth less oxygen.', ok: function(){ return pctLess(heatPts()) >= 20; } }],
      sew: [{ text: 'Find the fewest tanks that keep the fish alive.', ok: function(){ return S.stage === fewest(); } },
        { text: 'Make a dead zone in the first 10 days.', ok: function(){ return sew.firstHyp > -1 && sew.firstHyp <= 10; } }]
    };
    var tz = {}, tzT = tease.querySelector('.wp2-tz-t'), tzOk = tease.querySelector('.wp2-tz-ok');
    function tzLoad(c){
      if(tz[c]) return tz[c];
      var st = { i: 0, done: false, off: false };
      try{ var v = localStorage.getItem('wp2tz:' + c); if(v === 'x') st.off = true; else if(v) st.i = +v || 0; }catch(e){}
      return (tz[c] = st);
    }
    function tzSave(c, v){ try{ localStorage.setItem('wp2tz:' + c, v); }catch(e){} }
    function tzPaint(){
      var st = tzLoad(S.ch), it = TZ[S.ch][st.i], show = expl() && !st.off && !!it && (!it.can || it.can());
      tease.hidden = !show; if(!show) return;
      tzT.textContent = it.text; tease.classList.toggle('is-done', st.done); tzOk.hidden = !st.done;
    }
    function tzCheck(){ var st = tzLoad(S.ch), it = TZ[S.ch][st.i]; if(!it || st.off || st.done || tease.hidden || !it.ok()) return; st.done = true; tzSave(S.ch, String(st.i + 1)); tzPaint(); }
    function tzNext(){ var st = tzLoad(S.ch); if(!st.done) return; st.done = false; st.i++; tzPaint(); }
    tease.querySelector('.wp2-tz-x').addEventListener('click', function(){ var st = tzLoad(S.ch); st.off = true; tzSave(S.ch, 'x'); tzPaint(); say('Challenges hidden.'); });

    /* ---- "?": the reference for the chapter, and the setting */
    var ref = document.createElement('div'); ref.className = 'ls-sec wp2-ref';
    host.appendChild(ref);
    ref.addEventListener('click', function(e){ if(e.target.closest('[data-how]')){ if(LS && LS.close) LS.close(); setTimeout(function(){ startTour(true); }, 280); } });
    var sUp = T.slider({ label: 'River temperature upstream', min: 5, max: 20, step: 1, value: S.up, unit: '°C', onInput: function(v){ S.up = v; heatChanged(); } });
    var setBox = document.createElement('div'); setBox.className = 'wp2-set'; setBox.appendChild(sUp.el);

    /* ------------------------------------------------------- state changes */
    function newRun(){
      run = lakeRun(S.sacks, S.tLake);
      // Explore jumps to the instant view (the run's worst day, its whole curve); a question starts its run from day 0
      if(inQuiz()){ S.seen = 0; S.day = 0; player.reset(); prog.value(0); }
      else if(S.mode === 'explore'){ S.inst = true; player.reset(); pin(); }
      if(S.ch === 'fert') prog.marks(run.stages.filter(function(d){ return d != null; }));
      dirtyG = true; words(); if(!gest) refHtml(); if(QZ) QZ.changed('run'); draw();   // mid drag the "?" sheet waits for gEnd
      // Explore says the cause line once, when the drag ends (gEnd), not at every step of it
      if(!expl()) say(sk(S.sacks) + ', lake at ' + S.tLake + ' °C. ' + dayLine());
    }
    function setDay(v, how){
      S.day = clamp(v, 0, W.LAKE_DAYS); S.inst = false;
      if(S.day > S.seen) S.seen = S.day;
      if(how !== 'scrub') scrub.value(Math.round(S.day));
      if(how !== 'prog') prog.value(S.day);
      dirtyG = true; words();
      if(S.seen >= W.LAKE_DAYS - 1e-9 && QZ) QZ.changed('seen');
      if(how !== 'play'){ say(dayLine()); if(!player.playing()) player.paint(); }
      if(!looping) draw();
    }
    function setSday(v, how){
      S.sday = clamp(v, 0, W.LAKE_DAYS); S.inst = false;
      if(S.sday > S.sseen) S.sseen = S.sday;
      if(how !== 'scrub') scrub.value(Math.round(S.sday));
      if(how !== 'prog') prog.value(S.sday);
      dirtyG = true; words();
      if(S.sseen >= W.LAKE_DAYS - 1e-9 && QZ) QZ.changed('seen');
      if(how !== 'play'){ say(sewDayLine()); if(!player.playing()) player.paint(); }
      if(!looping) draw();
    }
    function afterRun(){ tourDid('watch'); var r = rNow(); say((S.ch === 'sew' ? sewDayLine() : dayLine()) + ' Lowest ' + F(r.min) + ' mg/L on day ' + r.minDay + '.'); }
    function onScrub(v){
      if(S.ch === 'fert') setDay(v, 'scrub');
      else if(S.ch === 'heat'){ var w = clamp(Math.round(v - S.up), 0, 15); if(w !== S.warm && !(S.q && S.q.hideWarm)){ gBegin(); S.warm = w; cWarm.value(w); heatChanged(); } }
      else setSday(v, 'scrub');
    }
    function heatChanged(){ dirtyG = true; words(); if(!gest) refHtml(); if(QZ) QZ.changed('warm'); if(!gest) say(expl() ? causeText() : heatLine()); if(!looping) draw(); }
    function setStage(i){
      S.stage = i;
      sew = sewRun(i); player.stop(); player.reset();
      if(expl()){ S.inst = true; pin(); } else { S.sday = 0; S.sseen = 0; prog.value(0); }
      if(S.ch === 'sew') prog.marks(sew.stages.filter(function(d){ return d != null; }));
      cTanks.forEach(function(t, k){ t.pressed(k === i); });
      dirtyG = true; words(); refHtml(); if(QZ) QZ.changed('stage'); if(!expl()) say(sewLine()); if(!looping) draw();
    }
    // Check (Test yourself): play the run to day 60 at once and show its worst day
    function revealRun(){
      player.stop();
      if(S.ch === 'sew'){ S.sseen = W.LAKE_DAYS; setSday(sew.minDay, 'tap'); }
      else { S.seen = W.LAKE_DAYS; setDay(run.minDay, 'tap'); }
    }
    function setCh(v){
      if(v === S.ch) return;
      player.stop(); player.reset(); S.ch = v; stopTours(); prev = null; gest = null; S.inst = true; pin(); layoutNow(); syncCh(); showCue();
      say({ fert: 'Chapter 1, fertilizer runoff. ', heat: 'Chapter 2, hot water. ', sew: 'Chapter 3, sewage. ' }[v] + causeText());
    }
    function syncCh(){
      var c = S.ch, q = S.q || {};
      stage.setAttribute('data-ch', c);
      purpose.textContent = PURPOSE[c];
      if(tabs.value() !== c) tabs.value(c);
      bar.hidden = c === 'heat' || !!q.hideTime;
      cSacks.hide(c !== 'fert' || !!q.hideSacks);
      // in a question the lake's temperature is fixed, except where the question is about it
      cTemp.hide(c !== 'fert' || (inQuiz() && !q.loudTemp));
      cTemp.el.classList.toggle('is-quiet', inQuiz() && !q.loudTemp);
      cWarm.hide(c !== 'heat' || !!q.hideWarm);
      cTanks.forEach(function(t){ t.el.hidden = c !== 'sew' || !!q.hideTaps; });
      var r = rNow();
      prog.marks(c === 'heat' ? [] : r.stages.filter(function(d){ return d != null; }));
      prog.value(c === 'sew' ? S.sday : S.day);
      prog.input.setAttribute('aria-label', c === 'sew' ? 'Day in the lake below, 0 to 60' : 'Day, 0 to 60');
      var sp = c === 'heat' ? { min: S.up, max: S.up + 15, v: S.up + S.warm } : { min: 0, max: W.LAKE_DAYS, v: Math.round(c === 'sew' ? S.sday : S.day) };
      scrub.place(null, sp.min, sp.max); scrub.value(sp.v);
      if(LS && LS.detailsTitle) LS.detailsTitle(c === 'fert' ? 'How the lake works' : c === 'heat' ? 'How the river works' : 'How the plant works');
      try{ if(S.mode === 'explore'){ var u = new URL(location.href); if(c === 'fert') u.searchParams.delete('ch'); else u.searchParams.set('ch', c); history.replaceState(history.state, '', u); } }catch(e){}
      tzPaint();
      dirtyG = true; words(); refHtml(); draw();
    }

    /* ------------------------------------------------------- words: the progress line's name, the caption, announcements */
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 20); }
    function oNow(){ return at(run.O, S.day); }
    function dayText(v){ var o = at(rNow().O, v); return (S.ch === 'sew' ? 'Lake below, day ' : 'Day ') + Math.round(v) + ', bottom water ' + fO(o) + ' milligrams per liter, ' + status(o).status.toLowerCase(); }
    function dayLine(){ var o = oNow(), st = status(o); return 'Day ' + Math.round(S.day) + ': bottom water ' + fO(o) + ' mg/L, ' + st.status.toLowerCase() + '.'; }
    function heatPts(){ var t0 = S.up, t1 = S.up + S.warm; return { t0: t0, t1: t1, d0: r1(W.osat(t0)), d1: r1(W.osat(t1)) }; }
    function pctLess(h){ return Math.abs(M.Calc().percentChange(h.d0, h.d1)); }
    function heatLine(){ var h = heatPts(); return 'Upstream ' + h.t0 + ' °C holds up to ' + F(h.d0) + ' mg/L. Downstream ' + h.t1 + ' °C holds up to ' + F(h.d1) + ' mg/L.' + (h.d1 < TROUT ? ' Less than young trout need.' : ''); }
    function sewLine(){ var lf = W.SEWAGE.stages[S.stage].left; return (S.stage ? 'Treated through ' + SEW_NAMES[S.stage].toLowerCase() : 'No treatment') + ': ' + lf.nutrients + '% of the nitrogen and phosphorus and ' + lf.bod + '% of the organic matter left.'; }
    function sewDayLine(){ var o = at(sew.O, S.sday); return 'Lake below, day ' + Math.round(S.sday) + ': bottom water ' + fO(o) + ' mg/L, ' + status(o).status.toLowerCase() + '.'; }
    function heatCap(){
      var h = heatPts();
      if(S.q && S.q.hideWarm) return '';
      if(S.warm === 0) return '';
      if(!inQuiz() && h.d1 < TROUT) return TAKE.heat;
      return 'Warmer water holds less oxygen: ' + F(pctLess(h), 0) + '% less downstream' + (h.d1 < TROUT ? ', too little for young trout.' : '.');
    }
    /* The takeaway: once a run reaches its end (the recovery after the low, or day 60), one sentence in place of the
       caption says what the student should have understood (Explore only: in a question it would give answers away). */
    function takeaway(c, r){
      if(c === 'sew') return r.hypoxicDays > 0 ? (S.stage === 2 ? TAKE.sec : TAKE.sewBad) : TAKE.sewOk;
      return r.hypoxicDays > 0 ? TAKE.fert : r.min < HEALTHY ? TAKE.fertMid : TAKE.fertLow;
    }
    function words(){
      var c = S.ch, nm = '', line = '', take = false, d0 = c === 'sew' ? S.sday : S.day;
      // Explore, instant view (and chapter 2, which has no time): the cause line for this setting
      var cz = expl() && (c === 'heat' || instOn());
      cap.classList.toggle('is-cause', cz);
      if(cz){
        var hz = causeHtml();
        if(words.last !== hz){ words.last = hz; cap.innerHTML = hz; }
        cap.classList.remove('is-take', 'is-bad', 'is-empty'); words.took = false;
        var rz = rNow();
        prog.name(c === 'heat' ? '' : 'Day ' + Math.round(d0) + (rz.stages[0] == null ? '' : ': lowest oxygen'));
        if(c !== 'heat') prog.input.setAttribute('aria-valuetext', dayText(d0));
        return;
      }
      if(c === 'heat'){ line = heatCap(); take = line === TAKE.heat; }
      else {
        var r = rNow(), d = c === 'sew' ? S.sday : S.day, ph = phase(r, d), names = c === 'sew' ? SEW_STEPS : STEP_NAMES, caps = c === 'sew' ? SEW_CAP : CAP;
        var end = !inQuiz() && d > 0.01 && (ph.rec || d >= W.LAKE_DAYS - 0.01);
        if(c === 'fert' && S.sacks === 0){ nm = ''; line = 'No fertilizer, so nothing feeds the algae and the chain never starts.'; }
        else if(d < 0.01 && !player.playing()){ nm = ''; line = ''; }
        else if(end){ nm = ph.rec ? 'Recovery' : ph.cur >= 0 ? names[ph.cur] : ''; line = takeaway(c, r); take = true; }
        else if(ph.rec){ nm = 'Recovery'; line = REC_CAP; }
        else if(ph.cur < 0){ nm = ''; }
        else { nm = names[ph.cur]; line = c === 'sew' && ph.cur < 2 && r.bod > 30 ? SEW_BOD_CAP : caps[ph.cur]; }
      }
      // putting the steps in order (Test yourself): nothing on the stage names them
      if(S.blank){ nm = ''; line = ''; take = false; }
      prog.name(expl() && c !== 'heat' ? 'Day ' + Math.round(d0) + (nm ? ': ' + nm : '') : nm);
      if(words.last !== line){ words.last = line; cap.textContent = line; }
      cap.classList.toggle('is-take', take);
      cap.classList.toggle('is-bad', !take && !S.blank && c !== 'heat' && phase(rNow(), c === 'sew' ? S.sday : S.day).o < W.HYPOXIC);
      cap.classList.toggle('is-empty', !line);
      if(take && !words.took){ words.took = true; tourDid('watch'); }
      if(!take) words.took = false;
      prog.input.setAttribute('aria-valuetext', dayText(c === 'sew' ? S.sday : S.day));
    }

    /* ======================================================= Test yourself: the questions on the picture
       One question at a time on the same scene (the chapter tabs step aside; the dropdown at the stage's top left
       picks the chapter's questions or the practice problems). Each has the hint ladder; "Show the answer" opens
       after one try; a wrong choice is crossed out with its reason; the first try is kept for the chapter's card. */
    var runsWarm = {};   // the warm question: days in a dead zone per temperature, from runs checked to day 60
    function maxSafe(Tc){ var best = -1; for(var l = 0; l <= 5; l++) if(W.lake(l, Tc).hypoxicDays === 0) best = l; else break; return best; }
    function trBest(){ var best = -1; for(var w = 0; w <= 15; w++) if(r1(W.osat(S.up + w)) >= TROUT) best = w; return best; }
    function fewest(){ for(var k = 0; k <= 4; k++) if(sewRun(k).hypoxicDays === 0) return k; return 4; }
    function note(html, info){ return '<p class="tk2-note' + (info ? ' is-info' : '') + '">' + html + '</p>'; }
    function btn(label, onClick, cls){ var b = document.createElement('button'); b.type = 'button'; b.className = 'tk2-btn' + (cls ? ' ' + cls : ''); b.innerHTML = label; b.addEventListener('click', function(){ onClick(b); }); return b; }
    function setSacks(n){ S.sacks = n; cSacks.value(n); }
    function setTemp(t){ S.tLake = t; cTemp.value(t); }
    function setWarm(w){ S.warm = w; cWarm.value(w); }
    var ORDER_NAMES = STEP_NAMES.slice();
    /* A question: { id, name (for the card), text, todo, flags, setup(), build(box, api), sync(what), hints, answer() -> html } */
    var QS = {
      fert: [
        { id: 'predict', name: 'Your prediction', text: 'Heavy fertilizer runoff (4 sacks) reaches the lake. Three weeks later, the fish...', todo: 'Pick one. Then watch the run.',
          flags: { hideTime: true, hideSacks: true },
          setup: function(){ setSacks(4); setTemp(20); newRun(); },
          build: function(box, api){ api.mc([{ v: 'better', label: 'do better: more food' }, { v: 'same', label: 'stay about the same' }, { v: 'leave', label: 'leave or die' }], 'leave',
            { better: 'Fertilizer feeds algae, not fish. What happens to the water when that much algae dies?', same: 'The bloom does not last. Its death changes the bottom water a lot.' },
            function(){ return predFert(); }); },
          after: function(){ S.q.hideTime = false; syncCh(); setDay(0, 'tap'); player.reset(); player.start(); },
          hints: ['Fertilizer is food for algae, not for fish.', 'A huge bloom dies within days. Think about what breaking down all those dead algae uses up.'],
          answer: function(){ return predFert(); } },
        { id: 'safe', name: 'The most sacks', text: 'Find the most fertilizer the lake can take without a dead zone.', todo: 'Set the sacks on the field, then press Check.',
          setup: function(){ setTemp(20); newRun(); TRf.clear(); },
          build: function(box, api){
            var cb = btn('', function(){ checkSafe(api); }, 'tk2-btn-pri'); api.own.check = cb; box.appendChild(cb); box.appendChild(TRf.el); },
          sync: function(api){ if(api.own.check) api.own.check.textContent = 'Check ' + sk(S.sacks); },
          hints: ['Check an amount. A dead zone means too many sacks; none means the lake can take it.', 'You need two checks side by side: the most sacks with no dead zone, and one more sack that makes one.'],
          answer: function(){ var b = maxSafe(20); setSacks(b); newRun(); revealRun(); return safeText(b, 20); } },
        { id: 'warm', name: 'Longer or shorter when warm', text: 'Keep 3 sacks. Is the dead zone longer or shorter in a 30 °C lake than in a 20 °C lake?', todo: 'Drag the thermometer on the lake to 20 °C, press Check, then 30 °C.',
          flags: { hideSacks: true, loudTemp: true },
          setup: function(){ setSacks(3); setTemp(20); newRun(); runsWarm = {}; },
          build: function(box, api){
            var cw = btn('', function(){ if(S.tLake !== 20 && S.tLake !== 30) return; revealRun(); runsWarm[S.tLake] = run.hypoxicDays; api.attempt(true); api.sync(); }, 'tk2-btn-pri'); api.own.check = cw; box.appendChild(cw);
            var slots = document.createElement('ul'); slots.className = 'tk2-tries wp2-slots'; api.own.slots = slots; box.appendChild(slots);
            var q = document.createElement('div'); q.className = 'wp2-q'; q.hidden = true; api.own.q = q; box.appendChild(q);
            q.appendChild(api.mc([{ v: 'longer', label: 'Longer' }, { v: 'shorter', label: 'Shorter' }], 'longer',
              { shorter: 'Not shorter. Compare your two runs: how many days below 2 mg/L at 20 °C, and at 30 °C?' },
              function(){ return warmText(); }, true)); },
          sync: function(api){
            var o = api.own, both = runsWarm[20] != null && runsWarm[30] != null, done_ = runsWarm[S.tLake] != null;
            var had = !!o.check && document.activeElement === o.check;
            if(o.check){ o.check.hidden = both; o.check.disabled = (S.tLake !== 20 && S.tLake !== 30) || done_; o.check.textContent = S.tLake !== 20 && S.tLake !== 30 ? 'Set 20 °C or 30 °C' : done_ ? 'Already checked at ' + S.tLake + ' °C' : 'Check this run (' + S.tLake + ' °C)'; }
            if(o.slots) o.slots.innerHTML = [20, 30].map(function(t){ var v = runsWarm[t]; return '<li class="is-info">' + K.icon(v == null ? 'arrows' : 'dot') + '<span><b>' + t + ' °C:</b> ' + (v == null ? 'not checked yet' : v + ' days in a dead zone') + '</span></li>'; }).join('');
            if(o.q && o.q.hidden && both){ o.q.hidden = false; var f = o.q.querySelector('button'); if(f && (had || document.activeElement === document.body)) f.focus(); } },
          hints: ['Drag the thermometer on the lake to 20 °C and press Check. Then do the same at 30 °C.', 'Compare the days below 2 mg/L in your two runs.'],
          answer: function(){ runsWarm[20] = W.lake(3, 20).hypoxicDays; runsWarm[30] = W.lake(3, 30).hypoxicDays; setTemp(30); newRun(); revealRun(); return warmText(); } },
        { id: 'warmWhy', name: 'Why longer when warm', text: 'Why is the dead zone longer at 30 °C?', todo: 'Pick one.',
          flags: { hideSacks: true },
          setup: function(){ setSacks(3); setTemp(30); newRun(); revealRun(); },
          build: function(box, api){ api.mc([{ v: 'b', label: 'Warm water washes more of the fertilizer down into the lake.' }, { v: 'a', label: 'Warm water holds less oxygen; decomposers use it faster.' }, { v: 'c', label: 'Heat kills the bacteria that break down the dead algae.' }], 'a',
            { b: 'Both runs had 3 sacks, so the fertilizer was the same. What does heat do to oxygen and to bacteria?', c: 'Heat speeds decomposers up. And how much oxygen can warm water hold?' },
            function(){ return WHY_WARM; }); },
          hints: ['Both runs had the same 3 sacks, so the fertilizer is not the difference.', 'How much oxygen can warm water hold? Do bacteria work faster or slower when warm?'],
          answer: function(){ return WHY_WARM; } },
        { id: 'link', name: 'Which link uses the oxygen', text: 'Which link in the chain uses up most of the oxygen?', todo: 'Tap a step. The lake shows that step.',
          setup: function(){ setSacks(4); setTemp(20); newRun(); revealRun(); setDay(0, 'tap'); },
          build: function(box, api){
            var why = ['Runoff brings the nutrients. Nitrate and phosphate do not use up oxygen themselves.',
              'Living algae mostly make oxygen by day (a dense bloom uses some at night). The big drop comes later.',
              'Close. Dead algae sink, but the oxygen is used by what breaks them down next.', '',
              'That is the result. Which step causes the drop?', 'That is the end of the chain. Which step uses up the oxygen?'];
            var mc = api.mc(STEP_NAMES.map(function(n, i){ return { v: String(i), label: n }; }), '3', { 0: why[0], 1: why[1], 2: why[2], 4: why[4], 5: why[5] },
              function(){ return LINK_TEXT; }, false, function(v){ var dd = run.stages[+v]; if(dd != null){ player.stop(); setDay(dd, 'tap'); } });
            mc.classList.add('wp2-linkb'); },
          hints: ['Living algae make oxygen by day. The drop comes after they die.', 'What breaks the dead algae down on the bottom, and what does it use as it respires?'],
          answer: function(){ setDay(run.stages[3], 'tap'); return LINK_TEXT; } },
        { id: 'order', name: 'The six steps in order', text: 'Put the six steps of the chain in order.', todo: 'From memory: tap the first step, then the next.',
          blank: true,
          setup: function(){ setSacks(4); setTemp(20); newRun(); },
          build: function(box, api){
            var wrong = false;
            var ord = K.order({ items: ORDER_NAMES, why: function(i, pos){ wrong = true; api.attempt(); return ORDER_NAMES[i] + ' comes later. ' + (pos ? 'What happens right after ' + ORDER_NAMES[pos - 1].toLowerCase() + '?' : 'What starts the chain?'); },
              onDone: function(){ api.first(!wrong); S.blank = false; words(); draw(); api.finish(ORDER_TEXT); } });
            box.appendChild(ord.el); },
          hints: ['It starts on the field and ends with the fish.', 'Algae must bloom before they can die, and die before decomposers can feed on them.'],
          answer: function(){ S.blank = false; words(); draw(); return ORDER_TEXT; } },
        { id: 'cause', name: 'Why the low comes late', text: 'Why does the oxygen low come days after the bloom?', todo: 'Pick one.',
          setup: function(){ setSacks(4); setTemp(20); newRun(); revealRun(); },
          build: function(box, api){ api.mc([{ v: 'b', label: 'The fertilizer takes days to sink from the surface to the bottom water.' }, { v: 'a', label: 'The algae die first; then decomposers use oxygen breaking them down.' }, { v: 'c', label: 'The fish use it up over the weeks as more of them crowd together.' }], 'a',
            { b: 'The nutrients feed algae near the surface, and nitrate and phosphate do not use oxygen. What uses it, and when can that start?', c: 'Fish use a little, but they leave as it falls. Which living things multiply on the bottom after the die off?' },
            function(){ return CAUSE_TEXT; }); },
          hints: ['Look at the graph: the algae peak first, the oxygen low comes later.', 'Something has to happen to the algae before the bacteria on the bottom have food.'],
          answer: function(){ return CAUSE_TEXT; } }
      ],
      heat: [
        { id: 'predict', name: 'Your prediction', text: 'The plant adds only heat, no chemicals. Downstream, the river can hold...', todo: 'Pick one. Then watch the outflow warm the river.',
          flags: { hideWarm: true },
          setup: function(){ setWarm(0); heatChanged(); },
          build: function(box, api){ api.mc([{ v: 'more', label: 'more oxygen' }, { v: 'same', label: 'the same oxygen' }, { v: 'less', label: 'less oxygen' }], 'less',
            { more: 'Warm water does not gain gas. Think of a warm soda: does it keep its fizz?', same: 'Heat alone changes how much gas water can hold, with nothing added.' },
            function(){ return predHeat(); }); },
          after: function(){ S.q.hideWarm = false; setWarm(10); syncCh(); heatChanged(); },
          hints: ['Think of a warm soda: does it keep its gas?', 'Saturation is the most oxygen water can hold. It changes with temperature.'],
          answer: function(){ return predHeat(); } },
        { id: 'trout', name: 'Warmest outflow for trout', text: 'Find the warmest outflow that keeps the river below the plant liveable for young trout.', todo: 'Drag the handle on the outflow pipe, then press Check.',
          setup: function(){ setWarm(0); heatChanged(); TRh.clear(); },
          build: function(box, api){ var cb = btn('', function(){ checkTrout(api); }, 'tk2-btn-pri'); api.own.check = cb; box.appendChild(cb); box.appendChild(TRh.el); },
          sync: function(api){ if(api.own.check) api.own.check.textContent = 'Check +' + S.warm + ' °C'; },
          hints: ['Young trout need at least ' + TROUT + ' mg/L. Read the Downstream gauge after each Check.', 'You need two checks one degree apart: the warmest that is enough, and one degree warmer that is not.'],
          answer: function(){ var b = trBest(); setWarm(Math.max(0, b)); heatChanged(); return troutText(b); } },
        { id: 'pct', name: 'Percent less', text: 'The outflow is set to +10 °C. By about what percent does the oxygen the river can hold fall?', todo: 'Read both gauges, then pick.',
          flags: { hideWarm: true },
          setup: function(){ setWarm(10); heatChanged(); },
          build: function(box, api){
            var h = heatPts(), pc = pctLess(h), right = Math.round(pc / 5) * 5;
            var lo = Math.max(5, Math.round(right / 2 / 5) * 5); if(lo === right) lo = Math.max(5, right - 10);
            var hi = Math.round(right * 2.5 / 5) * 5; if(hi === right) hi = right + 15;
            var opts = [right, lo, hi].map(function(v){ return { v: String(v), label: 'About ' + v + '% less' }; }).sort(function(a, b){ return a.v - b.v; }), wr = {};
            opts.forEach(function(o){ if(+o.v !== right) wr[o.v] = 'Not ' + o.v + '%. Put the two gauge values in: (' + F(h.d1) + ' − ' + F(h.d0) + ') / ' + F(h.d0) + ' × 100.'; });
            api.mc(opts, String(right), wr, function(){ return pctText(); }); },
          hints: ['Percent change = (new − old) / old × 100.', 'Use the Upstream and Downstream gauge values.'],
          answer: function(){ return pctText(); } }
      ],
      sew: [
        { id: 'predict', name: 'Your prediction', text: 'Which stage removes most of the nitrogen and phosphorus?', todo: 'Pick one. Then see what each tank leaves.',
          flags: { hideDoes: true, hideTaps: true, hideTime: true },
          setup: function(){ setStage(4); },
          build: function(box, api){ api.mc([{ v: '1', label: 'Primary' }, { v: '2', label: 'Secondary' }, { v: '3', label: 'Tertiary' }], '3',
            { 1: 'Primary lets solids settle out. Nitrate and phosphate are dissolved, so they stay in the water.', 2: 'Secondary bacteria eat organic matter (BOD), but most of the N and P passes through.' },
            function(){ return predSew(); }); },
          after: function(){ S.q.hideDoes = false; S.q.hideTaps = false; S.q.hideTime = false; setStage(3); syncCh(); },
          hints: ['Primary settles solids; secondary uses bacteria on organic matter.', 'Which stage is there to remove the nutrients that feed algae?'],
          answer: function(){ return predSew(); } },
        { id: 'secondary', name: 'After secondary', text: 'The plant stops after secondary treatment. What happens in the lake below?', todo: 'Press Play to watch the lake below, then pick.',
          flags: { hideTaps: true },
          setup: function(){ setStage(2); },
          build: function(box, api){ api.mc([{ v: 'ok', label: 'It stays healthy' }, { v: 'fast', label: 'Oxygen falls at once, with no bloom' }, { v: 'dead', label: 'A bloom, then a dead zone' }], 'dead',
            { ok: 'Look at the lake’s oxygen line: where does it go after the bloom?', fast: 'That is what organic matter (BOD) does, and secondary removed most of it. What do the N and P left do?' },
            function(){ return secText(); }); },
          hints: ['Secondary removes most organic matter but little N and P.', 'N and P feed algae. What did that do in chapter 1?'],
          answer: function(){ S.sseen = W.LAKE_DAYS; setSday(sew.minDay, 'tap'); return secText(); } },
        { id: 'fewest', name: 'Fewest stages', text: 'Use the fewest stages that keep the lake below out of a dead zone.', todo: 'Tap a tank to stop there, then press Check.',
          setup: function(){ setStage(1); TRs.clear(); },
          build: function(box, api){ var cb = btn('', function(){ checkFewest(api); }, 'tk2-btn-pri'); api.own.check = cb; box.appendChild(cb); box.appendChild(TRs.el); },
          sync: function(api){ if(api.own.check) api.own.check.textContent = S.stage ? 'Check: stop after ' + SEW_NAMES[S.stage].toLowerCase() : 'Check: no treatment'; },
          hints: ['Start with few stages and add one until there is no dead zone.', 'You need the fewest stages with no dead zone, and one fewer that makes one.'],
          answer: function(){ var f = fewest(); setStage(f); revealRun(); return fewText(f); } }
      ]
    };
    var TRf = K.tries({ label: 'Runs you checked' }), TRh = K.tries({ label: 'Outflows you checked' }), TRs = K.tries({ label: 'Plants you checked' });
    var WHY_WARM = 'Warm water holds less oxygen to start with, and decomposers work faster, so they use it up sooner.';
    var LINK_TEXT = 'Decomposers. Aerobic bacteria use most of the oxygen as they break down the dead algae, so the low comes days after the bloom.';
    var ORDER_TEXT = 'Runoff, algae bloom, algae die, decomposers feed, oxygen drops, dead zone.';
    var CAUSE_TEXT = 'The algae have to die first. Decomposers then use the oxygen as they break them down, so the low comes days after the bloom.';
    function predFert(){ return 'Leave or die. Watch the run: the bloom dies, decomposers use up the oxygen, and the bottom water falls below 2 mg/L, a dead zone.'; }
    function safeText(best, Tc){ var rb = W.lake(best, Tc), rn = best < 5 ? W.lake(best + 1, Tc) : null; return sk(best) + ' is the most. With ' + sk(best) + ' the oxygen bottoms out at ' + F(rb.min) + ' mg/L; ' + (rn ? 'with ' + sk(best + 1) + ' it falls below 2 mg/L for ' + rn.hypoxicDays + ' days.' : 'even the most runoff here makes no dead zone.'); }
    function warmText(){ return 'Longer: ' + runsWarm[30] + ' days in a dead zone at 30 °C, against ' + runsWarm[20] + ' at 20 °C.'; }
    function predHeat(){ var h = { t0: S.up, t1: S.up + 10, d0: r1(W.osat(S.up)), d1: r1(W.osat(S.up + 10)) }; return 'Less oxygen. At ' + h.t1 + ' °C the river can hold only ' + F(h.d1) + ' mg/L, ' + F(pctLess(h), 0) + '% less than at ' + h.t0 + ' °C: warmer water holds less gas.'; }
    function troutText(b){ if(b < 0) return 'None: even with no warm water, a river at ' + S.up + ' °C cannot hold ' + TROUT + ' mg/L.'; return '+' + b + ' °C is the warmest: at ' + (S.up + b) + ' °C full water holds ' + F(r1(W.osat(S.up + b))) + ' mg/L, just enough.' + (b < 15 ? ' At +' + (b + 1) + ' °C it holds ' + F(r1(W.osat(S.up + b + 1))) + ', less than young trout need.' : ''); }
    function pctText(){ var h = heatPts(); return 'About ' + Math.round(pctLess(h) / 5) * 5 + '% less. (' + F(h.d1) + ' − ' + F(h.d0) + ') / ' + F(h.d0) + ' × 100 = ' + T.F(M.Calc().percentChange(h.d0, h.d1), 1) + '%.'; }
    function predSew(){ var L = W.SEWAGE.stages; return 'Tertiary. It takes N and P from ' + L[2].left.nutrients + '% left to ' + L[3].left.nutrients + '%. Primary and secondary leave most of them to feed algae downstream.'; }
    function secText(){ var L = W.SEWAGE.stages[2].left, r = sewRun(2); return 'A bloom, then a dead zone. Secondary removed most of the organic matter (' + L.bod + '% left), but ' + L.nutrients + '% of the N and P reached the lake: algae bloomed and died, and decomposers pulled the bottom water down to ' + F(r.min) + ' mg/L.'; }
    function fewText(f){ return SEW_NAMES[f] + ': ' + f + ' stages. It takes N and P down to ' + W.SEWAGE.stages[f].left.nutrients + '%, and the lake below stays above 2 mg/L (lowest ' + F(sewRun(f).min) + ' mg/L). Stopping one stage sooner still gave a dead zone.'; }
    function checkSafe(api){
      revealRun();
      var Tc = S.tLake, key = S.sacks + '@' + Tc, dead = run.hypoxicDays > 0;
      TRf.add(key, '<b>' + sk(S.sacks) + ':</b> ' + (dead ? 'a dead zone for ' + run.hypoxicDays + ' days' : 'lowest ' + F(run.min) + ' mg/L, no dead zone'), dead ? 'bad' : 'good');
      var best = maxSafe(Tc), a = TRf.get(best + '@' + Tc), b = TRf.get((best + 1) + '@' + Tc);
      if(best >= 0 && a && (best === 5 || b)){ api.first(true); api.finish(safeText(best, Tc)); return; }
      api.attempt(true);
      if(dead) api.msg('That made a dead zone. Try fewer sacks.');
      else if(S.sacks < best) api.msg('No dead zone with ' + sk(S.sacks) + '. Can the lake take more?', true);
      else api.msg('No dead zone. Is it the most? Check one more sack.', true);
    }
    function checkTrout(api){
      var h = heatPts(), ok = h.d1 >= TROUT, best = trBest();
      TRh.add(String(S.warm), '<b>+' + S.warm + ' °C (' + h.t1 + ' °C):</b> holds ' + F(h.d1) + ' mg/L, ' + (ok ? 'enough for young trout' : 'less than young trout need'), ok ? 'good' : 'bad');
      if(best < 0){ api.first(true); api.finish(troutText(best)); return; }
      if(TRh.has(String(best)) && (best === 15 || TRh.has(String(best + 1)))){ api.first(true); api.finish(troutText(best)); return; }
      api.attempt(true);
      api.msg(ok ? (S.warm < best ? 'Still enough. Can the river take warmer water?' : 'Enough. Is it the warmest? Check one degree warmer.') : 'Too warm for young trout. Try a cooler outflow.', ok);
    }
    function checkFewest(api){
      revealRun();
      var i = S.stage, dead = sew.hypoxicDays > 0, few = fewest();
      TRs.add(String(i), '<b>' + esc(SEW_NAMES[i]) + ':</b> ' + (dead ? 'a dead zone for ' + sew.hypoxicDays + ' days' : 'lowest ' + F(sew.min) + ' mg/L, no dead zone'), dead ? 'bad' : 'good');
      if(TRs.has(String(few)) && TRs.has(String(few - 1))){ api.first(true); api.finish(fewText(few)); return; }
      api.attempt(true);
      api.msg(dead ? 'Still a dead zone below. Add a stage.' : i > few ? 'No dead zone, but can you use fewer stages?' : 'No dead zone. Is it the fewest? Check one stage less.', !dead);
    }
    var RECAP = { fert: 'Fertilizer feeds an algal bloom; when the algae die, decomposers use up the oxygen breaking them down, and below 2 mg/L the lake is a dead zone.',
      heat: 'Heat alone, with no chemical added, lowers the oxygen water can hold, so cold water fish such as trout lose the river below the plant.',
      sew: 'Sewage brings the same N and P as fertilizer, plus organic matter that uses oxygen directly: secondary treatment removes the organic matter, tertiary the N and P.' };
    var CHN = { fert: '1 Fertilizer runoff', heat: '2 Hot water', sew: '3 Sewage' };

    function runner(dr, view0){
      var card = document.createElement('div'); card.className = 'wp2-qcard';
      if(LS) LS.add('dock', card, { mode: 'quiz' }); else host.appendChild(card);
      var view = view0, ch = S.ch, idx = { fert: 0, heat: 0, sew: 0 }, firsts = { fert: {}, heat: {}, sew: {} }, cur = null;
      function setView(v){ view = v; if(LS){ LS.root.setAttribute('data-wpq', v); LS.root.classList.toggle('tk2-qs', v === 'scene'); } }
      setView(view);
      function clearQ(){ player.stop(); S.q = null; S.blank = false; }
      function open(c){
        setView('scene'); ch = c; S.mode = 'quiz'; visible = true;
        if(dr && dr.picker) dr.picker.value('q:' + c);
        if(S.ch !== c){ player.stop(); player.reset(); S.ch = c; tabs.value(c); }
        layoutNow(); loop(true);
        if(idx[c] >= QS[c].length) finishCard(c); else show(c, idx[c]);
      }
      function toDrill(){ setView('drill'); clearQ(); cur = null; card.innerHTML = ''; visible = false; loop(false); }
      function show(c, i){
        var q = QS[c][i];
        clearQ();
        S.q = Object.assign({}, q.flags || {}); S.blank = !!q.blank;
        if(LS){ LS.done(false, 'quiz'); LS.pills([], 'left', 'quiz'); LS.caption('', 'quiz');
          LS.task({ kicker: 'Question ' + (i + 1) + ' of ' + QS[c].length, title: esc(q.text), todo: esc(q.todo) }, 'quiz'); }
        card.innerHTML = '';
        var body = document.createElement('div'); body.className = 'wp2-qb';
        var msgEl = document.createElement('div'); msgEl.className = 'wp2-msg'; msgEl.setAttribute('role', 'status');
        var okEl = document.createElement('div'); okEl.className = 'wp2-qok';
        var act = document.createElement('div'); act.className = 'wp2-qact';
        var lad = LS ? LS.hints({ hints: q.hints, answer: { label: 'Show the answer', onShow: function(){ reveal(); return ''; } } }) : null;
        card.appendChild(body); card.appendChild(msgEl); if(lad) card.appendChild(lad.card); card.appendChild(okEl); if(lad) card.appendChild(lad.row); card.appendChild(act);
        cur = { q: q, c: c, i: i, done: false, lad: lad, body: body, msg: msgEl, ok: okEl, act: act };
        var api = cur.api = {
          own: {},
          first: function(ok){ if(firsts[c][q.id] == null) firsts[c][q.id] = !!ok; },
          attempt: function(neutral){ if(!neutral) api.first(false); if(lad) lad.attempt(); },
          msg: function(html, info){ msgEl.innerHTML = html ? note(html, info) : ''; },
          sync: function(){ if(q.sync) q.sync(api); },
          finish: function(html){ finish(html); },
          // choices: a wrong one is crossed out with its reason; the right one finishes the question
          mc: function(list, right, why, text, keep, onPick){
            var row = document.createElement('div'); row.className = 'tk2-row wp2-mc'; row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Choices'); row.setAttribute('data-ls-allchips', '');
            list.forEach(function(x){
              var b = btn(esc(x.label), function(){
                if(cur.done || b.disabled) return;
                if(onPick) onPick(x.v);
                if(x.v === right){ api.first(true); finish(text()); return; }
                api.attempt(); b.disabled = true; b.classList.add('is-no'); b.setAttribute('aria-label', x.label + ', not right');
                api.msg((why[x.v] || 'Not this one.') + ' Try another.');
              });
              b.setAttribute('data-v', x.v); row.appendChild(b);
            });
            if(!keep) body.appendChild(row);
            return row;
          }
        };
        if(q.setup) q.setup();
        syncCh(); layoutNow();
        q.build(body, api);
        api.sync();
      }
      function reveal(){
        if(!cur || cur.done) return;
        cur.api.first(false);
        finish(cur.q.answer(), true);
      }
      function finish(html, shown){
        if(!cur || cur.done) return;
        var q = cur.q, c = cur.c, i = cur.i;
        cur.done = true;
        cur.body.querySelectorAll('button').forEach(function(b){ b.disabled = true; });
        cur.msg.innerHTML = '';
        if(cur.lad){ cur.lad.row.hidden = true; cur.lad.card.hidden = true; }
        cur.ok.innerHTML = '<p class="tk2-ok-t" tabindex="-1">' + K.icon('check') + '<span>' + (shown ? '<b>The answer.</b> ' : '') + html + '</span></p>';
        var last = i + 1 >= QS[c].length;
        var nx = btn(last ? 'Finish' : 'Next question', function(){ idx[c] = i + 1; if(last) finishCard(c); else show(c, i + 1); }, 'tk2-btn-pri');
        cur.act.innerHTML = ''; cur.act.appendChild(nx);
        var t = cur.ok.querySelector('.tk2-ok-t'); if(t) try{ t.focus({ preventScroll: true }); }catch(e){}
        if(q.after) q.after();
      }
      function finishCard(c){
        clearQ(); cur = null; card.innerHTML = '';
        syncCh();
        var ks = QS[c].map(function(q){ return q.id; }).filter(function(k){ return firsts[c][k] != null; }), n = ks.filter(function(k){ return firsts[c][k]; }).length;
        var list = QS[c].filter(function(q){ return firsts[c][q.id] != null; }).map(function(q){ var ok = firsts[c][q.id]; return '<i class="is-' + (ok ? 'ok' : 'no') + '">' + (ok ? '✓' : '✗') + '</i> ' + esc(q.name); }).join(', ');
        var nextC = c === 'fert' ? 'heat' : c === 'heat' ? 'sew' : null;
        if(LS){
          LS.task(null, 'quiz');
          LS.done({ kicker: 'Done', title: 'Right on the first try: ' + n + ' of ' + ks.length + '.', text: esc(RECAP[c]) + (list ? '<span class="tk2-more">' + list + '.</span>' : ''),
            next: nextC ? { label: 'Next: ' + CHN[nextC] + ' questions', onClick: function(){ open(nextC); } } : { label: 'Practice problems', onClick: function(){ if(dr && dr.picker) dr.picker.value(''); toDrill(); if(dr) dr.fresh(); } },
            links: [{ label: 'Do these questions again', onClick: function(){ idx[c] = 0; firsts[c] = {}; open(c); } }] }, 'quiz');
        }
      }
      return {
        open: open, toDrill: toDrill,
        scene: function(){ return view === 'scene'; },
        enter: function(){ if(view === 'scene') open(ch); },
        leave: function(){ clearQ(); },
        changed: function(){ if(cur && !cur.done && S.mode === 'quiz') cur.api.sync(); }
      };
    }
    function quiz(qhost, d){
      var view = /[?&]seed=/.test(location.search) ? 'drill' : 'scene';
      var dr = drill(qhost, d, { label: 'What to practice', value: view === 'scene' ? 'q:' + S.ch : '', drillGroup: 'Practice problems',
        groups: [{ label: 'Questions on the picture', items: [{ value: 'q:fert', label: '1 Fertilizer runoff' }, { value: 'q:heat', label: '2 Hot water' }, { value: 'q:sew', label: '3 Sewage' }] }],
        own: function(v){ return /^q:/.test(String(v)); }, onPick: function(v){ QZ.open(String(v).slice(2)); }, onDrill: function(){ QZ.toDrill(); } });
      QZ = runner(dr, view);
    }
    /* ======================================================= the picture */
    var G = null, GG = null, dirtyG = true, looping = false, raf = 0, lastT = 0, FISH = {};
    function box(el){ var r = el.getBoundingClientRect(); return [Math.max(300, Math.round(r.width) || 640), Math.max(200, Math.round(r.height) || 380)]; }
    function layoutNow(){
      var wh = box(sceneBox), Wd = wh[0], H = wh[1], P0 = PAL[dark() ? 'dark' : 'light'];
      svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + H); svg.setAttribute('width', Wd); svg.setAttribute('height', H);
      G = S.ch === 'fert' ? geoFert(Wd, H) : S.ch === 'heat' ? geoHeat(Wd, H) : geoSew(Wd, H);
      G.P = P0;
      gStatic.innerHTML = S.ch === 'fert' ? staticFert(G) : S.ch === 'heat' ? staticHeat(G) : staticSew(G);
      if(S.ch === 'fert'){
        // phone: the sacks stand in a pile, so the knob runs along the soil just under the field (tag to its right)
        if(G.pile) cSacks.place([G.kx0, G.plat + 30, G.sx1, G.plat + 30], 'right'); else cSacks.place([G.kx0, G.plat - 2, G.sx1, G.plat - 2], null);
        cTemp.place([G.thX, G.thY10, G.thX, G.thY30]);
      } else if(S.ch === 'heat') cWarm.place([G.vX, G.vY0, G.vX, G.vY1]);
      else G.tanks.forEach(function(tk, i){ cTanks[i].place([tk.x - 3, tk.y - 3, tk.w + 6, tk.h + 6]); });
      // the graph's own box, whatever its height (a short one must not be letterboxed: the cursor would miss the curve)
      var gr = graphBox.getBoundingClientRect(), gw = [Math.max(300, Math.round(gr.width) || 640), Math.max(110, Math.round(gr.height) || 200)];
      gsvg.setAttribute('viewBox', '0 0 ' + gw[0] + ' ' + gw[1]); gsvg.setAttribute('width', gw[0]); gsvg.setAttribute('height', gw[1]);
      GG = { W: gw[0], H: gw[1] };
      dirtyG = true; draw();
      if(cues[S.ch].active()) cues[S.ch].place();
    }
    function draw(){
      if(!G) return;
      var t = S.clock;
      gDyn.innerHTML = S.ch === 'fert' ? dynFert(G, t) : S.ch === 'heat' ? dynHeat(G, t) : dynSew(G, t);
      var al = S.ch === 'fert' ? 'A farm field above a lake. ' + (instOn() ? causeText() : dayLine() + (S.blank ? '' : ' ' + STEP_LONG[Math.max(0, W.stageAt(run, S.day))]))
        : S.ch === 'heat' ? 'A power plant on a trout river, upstream on the left, downstream on the right. ' + heatLine() : 'A town, a sewage plant and the lake below. ' + sewLine() + (instOn() ? ' ' + causeText() : '');
      if(draw.al !== al){ draw.al = al; svg.setAttribute('aria-label', al); }
      if(dirtyG){ dirtyG = false; graph(); }
    }
    function tick(ts){
      if(!looping) return;
      var dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0; lastT = ts;
      S.clock += dt; ease(dt); draw();
      raf = requestAnimationFrame(tick);
    }
    function loop(on){
      on = on && visible && !K.reduced() && !document.hidden;
      if(on === looping) return;
      looping = on; lastT = 0;
      if(on) raf = requestAnimationFrame(tick); else { cancelAnimationFrame(raf); ease(10); draw(); }
    }
    document.addEventListener('visibilitychange', function(){ loop(true); });

    /* --------------------------------------------------- shared art */
    function skyAndHills(g, Wd, H, horizon){
      var P0 = g.P;
      return '<linearGradient id="wpSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.sky0 + '"/><stop offset="1" stop-color="' + P0.sky1 + '"/></linearGradient>' +
        '<radialGradient id="wpSun"><stop offset="0" stop-color="' + P0.sun + '" stop-opacity=".55"/><stop offset="1" stop-color="' + P0.sun + '" stop-opacity="0"/></radialGradient>' +
        // light rays under the surface: bright at the top, gone by the bottom
        '<linearGradient id="wpRay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="wpHaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.sky1 + '" stop-opacity="0"/><stop offset="1" stop-color="' + P0.sky1 + '" stop-opacity=".55"/></linearGradient>';
    }
    /* Soft fair weather clouds (static), a few per scene. */
    function clouds(Wd, y, P0, list){
      var c = dark() ? '#3A5266' : '#FFFFFF', op = dark() ? 0.35 : 0.6;
      return list.map(function(q){
        var x = Wd * q[0], yy = y * q[1], k = q[2];
        return '<g opacity="' + op + '" fill="' + c + '"><ellipse cx="' + n1(x) + '" cy="' + n1(yy) + '" rx="' + n1(26 * k) + '" ry="' + n1(8 * k) + '"/>' +
          '<ellipse cx="' + n1(x - 12 * k) + '" cy="' + n1(yy - 5 * k) + '" rx="' + n1(13 * k) + '" ry="' + n1(9 * k) + '"/><ellipse cx="' + n1(x + 7 * k) + '" cy="' + n1(yy - 8 * k) + '" rx="' + n1(15 * k) + '" ry="' + n1(11 * k) + '"/></g>';
      }).join('');
    }
    function hills(Wd, horizon, P0, H){
      var a = horizon, out = '';
      // three layers: a pale far ridge, the hills, and a dark tree line along the far shore
      out += '<path fill="' + P0.far + '" opacity=".75" d="M0 ' + n1(a - H * 0.1) + ' C' + n1(Wd * 0.12) + ' ' + n1(a - H * 0.17) + ' ' + n1(Wd * 0.3) + ' ' + n1(a - H * 0.08) + ' ' + n1(Wd * 0.46) + ' ' + n1(a - H * 0.14) + ' S' + n1(Wd * 0.78) + ' ' + n1(a - H * 0.2) + ' ' + Wd + ' ' + n1(a - H * 0.11) + ' V' + n1(a + 2) + ' H0Z"/>';
      out += '<path fill="' + P0.far + '" d="M0 ' + n1(a - H * 0.06) + ' C' + n1(Wd * 0.18) + ' ' + n1(a - H * 0.12) + ' ' + n1(Wd * 0.32) + ' ' + n1(a - H * 0.03) + ' ' + n1(Wd * 0.5) + ' ' + n1(a - H * 0.08) + ' S' + n1(Wd * 0.82) + ' ' + n1(a - H * 0.13) + ' ' + Wd + ' ' + n1(a - H * 0.06) + ' V' + n1(a + 2) + ' H0Z"/>';
      out += '<rect y="' + n1(a - H * 0.2) + '" width="' + Wd + '" height="' + n1(H * 0.2) + '" fill="url(#wpHaze)"/>';
      out += '<path fill="' + P0.near + '" d="M0 ' + n1(a - H * 0.015) + ' C' + n1(Wd * 0.22) + ' ' + n1(a - H * 0.06) + ' ' + n1(Wd * 0.4) + ' ' + n1(a + 1) + ' ' + n1(Wd * 0.62) + ' ' + n1(a - H * 0.04) + ' S' + n1(Wd * 0.9) + ' ' + n1(a - H * 0.02) + ' ' + Wd + ' ' + n1(a - H * 0.03) + ' V' + n1(a + 2) + ' H0Z"/>';
      // rounded trees along the far shore, in two greens, smaller toward the back
      var r = M.rng(41), n = Math.round(Wd / 34);
      for(var i = 0; i < n; i++){
        var x = Wd * (0.36 + 0.64 * r()), y = a + 1 - r() * H * 0.012, s = 4 + r() * 5, tc = r() > 0.5 ? P0.grass2 : P0.grass;
        out += '<path fill="' + tc + '" opacity=".9" d="M' + n1(x) + ' ' + n1(y - s * 2.4) + ' C' + n1(x + s * 1.1) + ' ' + n1(y - s * 2.2) + ' ' + n1(x + s * 1.2) + ' ' + n1(y - s * 0.4) + ' ' + n1(x) + ' ' + n1(y) + ' C' + n1(x - s * 1.2) + ' ' + n1(y - s * 0.4) + ' ' + n1(x - s * 1.1) + ' ' + n1(y - s * 2.2) + ' ' + n1(x) + ' ' + n1(y - s * 2.4) + 'Z"/>';
      }
      return out;
    }
    /* The sun by day (light theme); a moon in the dark theme, so the night sky never has a sun in it. */
    function sunOrMoon(x, y, P0){
      if(!dark()) return '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="44" fill="url(#wpSun)"/><circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="15" fill="' + P0.sun + '"/>';
      return '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="30" fill="url(#wpSun)" opacity=".45"/><circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="13" fill="' + P0.sun + '"/><circle cx="' + n1(x + 6) + '" cy="' + n1(y - 4) + '" r="11.5" fill="' + P0.sky0 + '"/>' +
        [[-60, -6], [40, -14], [-28, 18], [70, 12], [-90, 20]].map(function(p){ return '<circle cx="' + n1(x + p[0]) + '" cy="' + n1(Math.max(6, y + p[1])) + '" r="1.2" fill="#E8EEF4" opacity=".75"/>'; }).join('');
    }
    function fishDefs(){
      return '<linearGradient id="wpFish" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="wp2-f0"/><stop offset=".55" class="wp2-f1"/><stop offset="1" class="wp2-f2"/></linearGradient>' +
        '<linearGradient id="wpTrout" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="wp2-t0"/><stop offset=".5" class="wp2-t1"/><stop offset="1" class="wp2-t2"/></linearGradient>';
    }
    /* A fish seen from the side, facing right at scale 1 (about 36 by 16): body, forked tail that beats, dorsal and
       pectoral fins, gill line and eye. sx is the turn (negative faces left; near 0 it is end on). */
    function fishSvg(x, y, s, sx, tail, tilt, kind, op){
      var trout = kind === 'trout';
      return '<g class="wp2-fish' + (trout ? ' is-trout' : '') + '" transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + n1(tilt) + ') scale(' + (s * sx).toFixed(3) + ' ' + s.toFixed(3) + ')" opacity="' + op.toFixed(2) + '">' +
        '<path class="wp2-fin" d="M-15 0 L-26 -8 C-23.5 -3 -23.5 3 -26 8 Z" transform="rotate(' + n1(tail) + ' -15 0)"/>' +
        '<path class="wp2-fin" d="M-3 -7.5 C0 -13 7 -12.5 9 -7 Z"/>' +
        '<path class="wp2-fb" d="M18 0 C14 -7.5 2 -9.5 -8 -6.5 C-13 -4.5 -16 -2 -17 0 C-16 2 -13 4.5 -8 6.5 C2 9.5 14 7.5 18 0 Z" fill="url(#' + (trout ? 'wpTrout' : 'wpFish') + ')"/>' +
        (trout ? '<path class="wp2-stripe" d="M15 0.5 C6 -0.5 -6 -0.5 -15 0.6" /><g class="wp2-spots"><circle cx="2" cy="-4" r=".9"/><circle cx="-4" cy="-3" r=".9"/><circle cx="-9" cy="-2.6" r=".8"/><circle cx="6" cy="-4.6" r=".8"/></g>' : '') +
        '<path class="wp2-gill" d="M9 -4.5 C7 -1.5 7 1.5 9 4.5"/>' +
        '<path class="wp2-fin wp2-pec" d="M5 2.5 C3 6.5 -1 7.5 -3.5 6.5 C-1 5 1.5 3.5 5 2.5Z"/>' +
        '<circle class="wp2-eye" cx="12.6" cy="-1.8" r="2.1"/><circle class="wp2-pupil" cx="13" cy="-1.8" r="1.1"/></g>';
    }
    /* Eased fish state: depth (0 surface to 1 bed), out (0 here to 1 gone), so a scrub or a jump is followed smoothly. */
    function fishState(key, n){ if(!FISH[key]){ FISH[key] = []; for(var i = 0; i < n; i++) FISH[key].push({ d: null, o: null, gx: 0 }); } return FISH[key]; }
    function ease(dt){
      var k = 1 - Math.exp(-dt * 2.2);
      Object.keys(FISH).forEach(function(key){ FISH[key].forEach(function(st){ if(st.td != null) st.d += (st.td - st.d) * k; if(st.to != null) st.o += (st.to - st.o) * k * 0.6; }); });
    }

    /* The lake: water in two layers, light, nutrients, algae clumps that grow, die, sink and settle, the dead layer
       on the bed, decomposers, oxygen bubbles, plants and fish. L: the geometry; r: a prepped run; d: the day. */
    function lakeBasin(x0, x1, surf, bed, Wd){
      var w = x1 - x0, dep = bed - surf;
      return 'M' + n1(x0) + ' ' + n1(surf) + ' C' + n1(x0 + w * 0.04) + ' ' + n1(surf + dep * 0.5) + ' ' + n1(x0 + w * 0.07) + ' ' + n1(bed - 2) + ' ' + n1(x0 + w * 0.17) + ' ' + n1(bed) +
        ' C' + n1(x0 + w * 0.35) + ' ' + n1(bed + 3) + ' ' + n1(x0 + w * 0.55) + ' ' + n1(bed - 4) + ' ' + n1(x0 + w * 0.72) + ' ' + n1(bed - 1) + ' S' + n1(x1 - 10) + ' ' + n1(bed - 6) + ' ' + n1(x1 + 2) + ' ' + n1(bed - 5) +
        ' V' + n1(surf) + ' Z';
    }
    function bedY(L, x){ // the bed's height under x (close to the basin curve)
      var w = L.x1 - L.x0, f = (x - L.x0) / w;
      if(f < 0.17) return L.surf + (L.bed - L.surf) * sstep(0, 0.17, f);
      return L.bed - 2 + Math.sin(f * 9) * 2 - (f > 0.8 ? (f - 0.8) * 20 : 0);
    }
    function lakeStatic(L, P0, id){
      var out = '<clipPath id="' + id + '"><path d="' + L.basin + '"/></clipPath>';
      // the bed: silt over darker sediment, pebbles and two rocks
      out += '<path fill="' + P0.bed2 + '" d="' + L.basin + '" transform="translate(0 6)"/>';
      out += '<g clip-path="url(#' + id + ')"><rect x="' + n1(L.x0 - 4) + '" y="' + n1(L.surf) + '" width="' + n1(L.x1 - L.x0 + 8) + '" height="' + n1(L.bed - L.surf + 10) + '" class="wp2-wbase"/></g>';
      return out;
    }
    function bedArt(L, P0){
      var out = '', w = L.x1 - L.x0;
      // silt band along the bed
      // bands that follow the basin from the shore down and across (no straight edges)
      var pts = [], i, x;
      for(i = 0; i <= 48; i++){ x = L.x0 + w * (0.005 + 0.995 * i / 48); pts.push([x, bedY(L, x)]); }
      function band(t0, t1){ return 'M' + pts.map(function(p){ return n1(p[0]) + ' ' + n1(p[1] + t0); }).join(' L') + ' L' + n1(L.x1 + 2) + ' ' + n1(pts[pts.length - 1][1] + t1) + ' L' + pts.slice().reverse().map(function(p){ return n1(p[0]) + ' ' + n1(p[1] + t1); }).join(' L') + 'Z'; }
      out += '<path fill="' + P0.silt + '" d="' + band(-3, 10) + '"/>';
      out += '<path fill="' + P0.bed + '" d="' + band(1, 16) + '"/>';
      // sand speckles in the silt
      for(i = 0; i < Math.round(w / 9); i++){ var sx2 = L.x0 + w * (0.08 + 0.9 * ((i * 0.618) % 1)), sy2 = bedY(L, sx2) + 3 + (i % 4) * 2.5; out += '<circle cx="' + n1(sx2) + '" cy="' + n1(sy2) + '" r="' + (0.8 + (i % 3) * 0.4) + '" fill="' + P0.bed2 + '" opacity=".6"/>'; }
      R_PEB.forEach(function(p, k){
        var px = L.x0 + w * (0.12 + 0.86 * p[0]), py = bedY(L, px) + 1 + p[1] * 3, rx = 1.6 + p[2] * 3.2;
        out += '<ellipse cx="' + n1(px) + '" cy="' + n1(py) + '" rx="' + n1(rx) + '" ry="' + n1(rx * 0.62) + '" fill="' + (k % 3 ? P0.bed2 : P0.soil) + '" opacity=".85"/>';
      });
      [0.32, 0.66].forEach(function(f, k){
        var rx = L.x0 + w * f, ry = bedY(L, rx), s = k ? 12 : 16;
        out += '<path fill="' + P0.conc2 + '" d="M' + n1(rx - s) + ' ' + n1(ry + 2) + ' C' + n1(rx - s) + ' ' + n1(ry - s * 0.7) + ' ' + n1(rx + s * 0.6) + ' ' + n1(ry - s * 0.9) + ' ' + n1(rx + s) + ' ' + n1(ry + 2) + 'Z"/>' +
          '<path fill="' + P0.conc + '" opacity=".6" d="M' + n1(rx - s * 0.6) + ' ' + n1(ry - s * 0.35) + ' C' + n1(rx - s * 0.2) + ' ' + n1(ry - s * 0.75) + ' ' + n1(rx + s * 0.4) + ' ' + n1(ry - s * 0.7) + ' ' + n1(rx + s * 0.55) + ' ' + n1(ry - s * 0.4) + 'Z"/>';
      });
      return out;
    }
    function lakeDyn(L, r, d, t, P0, id, fk, nFish){
      var out = [], w = L.x1 - L.x0, o = at(r.O, d), A = at(r.A, d), Dd = at(r.D, d), N = at(r.N, d), Os = r.osat, res = { brown: false, bac: null, bubPt: null };
      // film: how green the surface is (the bloom); browned: how much of it has died back after the peak
      var film = Math.pow(clamp((A - r.A[0]) / 12, 0, 1), 0.8), browned = d > r.peakDay ? clamp(1 - A / (r.peakA || 1), 0, 1) : 0, murk = Math.pow(clamp(1 - o / Math.max(Os, 1), 0, 1), 1.3);
      var green = mixA(P0.green, P0.brown, browned * 0.55);
      var top = mixA(P0.top, green, film * 0.92), mid = mixA(P0.deep, mixA(green, P0.murky, 0.4), film * 0.6), bot = mixA(P0.deep, P0.murky, murk * 0.92);
      out.push('<defs><linearGradient id="' + id + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + mix(top, top, 0) + '"/><stop offset=".3" stop-color="' + mix(top, mid, 0.5) + '"/><stop offset=".5" stop-color="' + mix(mid, mid, 0) + '"/><stop offset=".64" stop-color="' + mix(bot, bot, 0) + '"/><stop offset="1" stop-color="' + mix(bot, P0.murky, murk * 0.4) + '"/></linearGradient></defs>');
      out.push('<g clip-path="url(#' + id + ')">');
      out.push('<rect x="' + n1(L.x0 - 4) + '" y="' + n1(L.surf) + '" width="' + n1(w + 8) + '" height="' + n1(L.bed - L.surf + 12) + '" fill="url(#' + id + 'w)"/>');
      // oxygen in the bottom water: round bubbles with a shine, fewer as it falls (none in a dead zone)
      var nb = Math.round(Math.pow(clamp((o - 1.5) / 7, 0, 1), 1.25) * 20), span = L.bed - L.mid - 6, br = L.small ? 0.95 : 1.5;
      for(var b = 0; b < nb; b++){
        var p = R_BUB[b], bx = L.x0 + w * (0.2 + 0.72 * p[0]) + Math.sin(t * 1.5 + b) * 3, by = L.bed - 10 - ((t * (7 + p[1] * 7) + p[2] * span) % span), rr0 = (2.6 + p[3] * 2) * br;
        out.push('<circle class="wp2-bub" cx="' + n1(bx) + '" cy="' + n1(by) + '" r="' + n1(rr0) + '"/><circle class="wp2-bub-s" cx="' + n1(bx - rr0 * 0.35) + '" cy="' + n1(by - rr0 * 0.35) + '" r="' + n1(rr0 * 0.28) + '"/>');
        if(b === 2) res.bubPt = [bx, by];
      }
      // nutrients washed in: orange specks spreading from the shore, taken up by algae
      var entry = sstep(0, 3, d), nn = Math.round(clamp((N - 0.1) / 5, 0, 1) * 26 * entry);
      for(var q = 0; q < nn; q++){
        var pn = R_NUT[q], nx = L.x0 + 8 + pn[0] * w * clamp(0.15 + d / 4, 0, 0.95) + Math.sin(t + q) * 2, ny = L.surf + 4 + pn[1] * (L.mid - L.surf) * 0.9;
        out.push('<circle cx="' + n1(nx) + '" cy="' + n1(ny) + '" r="1.9" fill="' + P0.nut + '" opacity=".95"/>');
      }
      // the dead layer on the bed (dead algae waiting to be decomposed)
      var dl = clamp(Dd / 24, 0, 1.3) * (L.small ? 13 : 20);
      if(dl > 0.6){
        var pts = [], i, x;
        for(i = 0; i <= 30; i++){ x = L.x0 + w * (0.15 + 0.85 * i / 30); pts.push([x, bedY(L, x) - 2 - dl * (0.75 + 0.25 * Math.sin(i * 1.7)) * sstep(0, 3, i)]); }
        out.push('<path class="wp2-deadl" d="M' + n1(L.x0 + w * 0.15) + ' ' + n1(bedY(L, L.x0 + w * 0.15)) + ' L' + pts.map(function(pp){ return n1(pp[0]) + ' ' + n1(pp[1]); }).join(' L') + ' L' + n1(L.x1 + 2) + ' ' + n1(L.bed + 14) + ' L' + n1(L.x0 + w * 0.15) + ' ' + n1(L.bed + 14) + 'Z"/>');
        // its top: a fluffy edge of dead algae flakes, more as it thickens
        for(i = 0; i < Math.round(dl * 3.2); i++){ var fp = R_PEB[i % R_PEB.length], fx2 = L.x0 + w * (0.2 + 0.78 * ((fp[0] + i * 0.37) % 1)), fy2 = bedY(L, fx2) - 2 - dl * (0.6 + 0.35 * fp[1]);
          out.push('<ellipse class="wp2-deadf" cx="' + n1(fx2) + '" cy="' + n1(fy2) + '" rx="' + n1(1.4 + fp[2] * 2) + '" ry="' + n1(1 + fp[3]) + '"/>'); }
        res.deadPt = [L.x0 + w * (L.small ? 0.8 : 0.74), bedY(L, L.x0 + w * (L.small ? 0.8 : 0.74)) - 2 - dl];
      }
      // decomposers (aerobic bacteria): more where there is more to eat, faster in warm water
      var fT = Math.pow(1.07, r.T - 20), nd = Math.round(clamp(Dd * fT / 28, 0, 1.25) * 34), bestB = null;
      for(var c = 0; c < nd; c++){
        var pb = R_BAC[c], cx = L.x0 + w * (0.12 + 0.86 * pb[0]) + Math.sin(t * 2.3 + c * 1.7) * 2.5, cy0 = bedY(L, cx) - 4 - dl - pb[1] * (L.bed - L.mid) * 0.45, cy = cy0 + Math.cos(t * 1.9 + c) * 1.5;
        out.push('<rect class="wp2-bac" x="' + n1(cx - 3.2) + '" y="' + n1(cy - 1.4) + '" width="6.4" height="2.8" rx="1.4" transform="rotate(' + Math.round(pb[2] * 180) + ' ' + n1(cx) + ' ' + n1(cy) + ')"/>');
        var tx0 = L.x0 + w * 0.5; if(!bestB || Math.abs(cx - tx0) < Math.abs(bestB[0] - tx0)) bestB = [cx, cy];
      }
      if(nd >= 5) res.bac = bestB;
      // plants on the bed, swaying
      R_PLANT.slice(0, Math.round(w / 60)).forEach(function(p, k){
        var px = L.x0 + w * (0.14 + 0.82 * p[0]), py = bedY(L, px) + 1, h = 18 + p[1] * 26, sw = Math.sin(t * 0.9 + k) * 4;
        out.push('<path class="wp2-weed" d="M' + n1(px) + ' ' + n1(py) + ' C' + n1(px - 3) + ' ' + n1(py - h * 0.4) + ' ' + n1(px + 3 + sw * 0.5) + ' ' + n1(py - h * 0.7) + ' ' + n1(px + sw) + ' ' + n1(py - h) + '"/>');
      });
      // algae clumps: grow toward the peak near the surface, then die one by one, turn brown, sink and settle
      var alg = P0.alg, bro = P0.brown;
      for(var a = 0; a < r.nA; a++){
        var pa = R_ALG[a % R_ALG.length], ax = L.x0 + w * 0.13 + pa[0] * (w * 0.87 - 52), ay0 = L.surf + 4 + pa[1] * pa[1] * pa[1] * (L.mid - L.surf - 8), dd = r.deaths[a], vis, col, ay = ay0, op = 1;
        if(d <= r.peakDay) vis = A >= r.peakA * (a + 0.5) / r.nA;
        else vis = true;
        if(!vis) continue;
        var sinkP = dd != null && d > dd ? clamp((d - dd) / 2.5, 0, 1) : 0, dying = dd != null && d > dd - 1.4 ? clamp((d - dd + 1.4) / 1.2, 0, 1) : 0;
        if(sinkP > 0){ ay = lerp(ay0, bedY(L, ax) - 5 - dl * 0.6 - pa[2] * 4, Math.pow(sinkP, 1.4)); }
        if(sinkP >= 1) op = clamp(Dd / (r.Dmax * 0.45 || 1), 0, 1);
        if(op < 0.05) continue;
        if(dying > 0.5 && sinkP < 1) res.brown = true;
        if(dying < 0.2 && sinkP === 0 && ax > L.x0 + w * 0.3 && ax < L.x0 + w * 0.62 && (!res.algPt || ay < res.algPt[1])) res.algPt = [ax, ay];
        if(sinkP > 0.3 && sinkP < 0.85 && ax > L.x0 + w * 0.32 && ax < L.x0 + w * 0.7) res.sinkPt = [ax, ay];
        col = mixA(alg, bro, dying);
        var sc = (L.small ? 0.8 : 1) * (0.8 + pa[3] * 0.6), wob = sinkP > 0 && sinkP < 1 ? Math.sin(t * 3 + a) * 2 : Math.sin(t * 0.8 + a) * 1.2;
        var c1 = mix(col, col, 0), c2 = mix(mixA(col, [20, 60, 20], 0.35 * (1 - dying)), col, 0), hi = mix(mixA(P0.algHi, bro, dying), P0.algHi, 0);
        out.push('<g transform="translate(' + n1(ax + wob) + ' ' + n1(ay) + ') rotate(' + Math.round(pa[2] * 360) + ') scale(' + sc.toFixed(2) + ')" opacity="' + op.toFixed(2) + '">' +
          (a % 3 === 0 ? '<path d="M-9 1 C-5 -3 -2 4 2 0 S8 -3 10 1" fill="none" stroke="' + c2 + '" stroke-width="1.6" stroke-linecap="round"/>' : '') +
          '<circle cx="-3.2" cy=".8" r="3.6" fill="' + c2 + '"/><circle cx="2.6" cy="-.6" r="4" fill="' + c1 + '"/><circle cx="0" cy="3" r="3.2" fill="' + c1 + '"/><circle cx="-1.4" cy="-3" r="2.8" fill="' + c1 + '"/>' +
          (dying < 0.5 ? '<circle cx="1.8" cy="-1.8" r="1.4" fill="' + hi + '" opacity=".85"/><circle cx="-2.6" cy="1.6" r=".9" fill="' + hi + '" opacity=".6"/>' : '') + '</g>');
      }
      // fish: spread out while the water is healthy, crowd the surface and gasp when it is low, leave below 2 mg/L
      var fs = fishState(fk, nFish), tDepth, tOut, fR = L.fishR || 0.8;
      tOut = 1 - sstep(1.4, 2.4, o);
      fs.forEach(function(st, i){
        var rr = R_RAIN[i + 3], base = 0.25 + rr[0] * 0.6;
        tDepth = o >= HEALTHY ? base : o >= 2.6 ? lerp(0.06 + rr[1] * 0.08, base, sstep(2.6, HEALTHY, o)) : 0.04;
        st.td = tDepth; st.to = tOut; if(st.d == null || !looping){ st.d = tDepth; st.o = tOut; }
        // the fish's swimming range ends short of the thermometer (if the lake has one), so they never bunch there
        var u = t * (0.17 + rr[2] * 0.1) + rr[3] * 6.28, ax2 = w * (0.08 + rr[1] * 0.08), xR = L.noGo ? Math.min(L.x0 + w * fR, L.noGo[0] - 26) : L.x0 + w * fR;
        var cxF = L.x0 + w * 0.24 + ax2 + Math.max(0, xR - (L.x0 + w * 0.24) - 2 * ax2) * rr[0];
        var cu = Math.cos(u), out_ = st.o, fx = cxF + ax2 * Math.sin(u) + out_ * (w * 0.75 + 60), turn = Math.tanh(cu * 5), dir = out_ > 0.25 ? 1 : (turn >= 0 ? 1 : -1);
        var sx = out_ > 0.25 ? 1 : dir * Math.max(0.16, Math.abs(turn));
        var bob = t * 0.9 + i * 2, depthY = L.surf + 10 + st.d * (bedY(L, fx) - L.surf - 26), fy = depthY + Math.sin(bob) * 3;
        // leaving: each fish drops to its own lane below the thermometer's bulb and swims out at the right edge
        if(L.noGo && out_ > 0.02){ var by_ = bedY(L, Math.min(fx, L.x1 - 4)), lane = L.noGo[1] + 8 + i * Math.max(4, Math.min(9, (by_ - L.noGo[1] - 24) / 5)); fy = lerp(fy, Math.min(lane, by_ - 14), sstep(0, 0.25, out_)); }
        var gasp = o < 3.2 && st.d < 0.15;
        var tail = Math.sin(t * (gasp ? 10 : 4.5 + 3 * Math.abs(cu)) + i) * (5 + 7 * Math.abs(cu)), tilt = gasp ? -16 * dir : -Math.cos(bob) * 5 * dir;
        var s = L.small ? 0.62 : (0.75 + rr[2] * 0.25) * (L.fishS || 1);
        if(fx < L.x1 + 30) out.push(fishSvg(fx, fy, s, sx, tail, tilt, 'fish', 1));
        if(gasp && fx < L.x1){ var rp = (t * 0.9 + i * 0.37) % 1; out.push('<ellipse cx="' + n1(fx + 14 * s * dir) + '" cy="' + n1(L.surf + 1) + '" rx="' + n1(3 + rp * 10) + '" ry="' + n1(1 + rp * 2) + '" fill="none" stroke="#fff" stroke-width="1.2" opacity="' + (0.8 * (1 - rp)).toFixed(2) + '"/>'); }
      });
      // one fish that did not get out lies belly up on the bed while the water is a dead zone (and after)
      if(r.firstHyp > -1 && d > r.firstHyp + 1){
        var dfx = L.x0 + w * 0.46, dfy = bedY(L, dfx) - 6 - dl * 0.8, dop = clamp((d - r.firstHyp - 1) / 2, 0, 1);
        out.push('<g class="wp2-deadfish" opacity="' + dop.toFixed(2) + '" transform="translate(' + n1(dfx) + ' ' + n1(dfy) + ') scale(1 -1)">' + fishSvg(0, 0, L.small ? 0.6 : 0.85 * (L.fishS || 1), 1, 0, -6, 'fish', 1) + '</g>');
        // a long dead zone: more fish did not get out (one more from 20 days, another from 26)
        [[20, 0.7, -1, 5], [26, 0.3, 1, -8]].forEach(function(q2, qi){
          if(r.hypoxicDays < q2[0] || d < r.firstHyp + 2 + qi) return;
          var x2 = L.x0 + w * q2[1], y2 = bedY(L, x2) - 6 - dl * 0.8;
          out.push('<g class="wp2-deadfish" opacity="' + dop.toFixed(2) + '" transform="translate(' + n1(x2) + ' ' + n1(y2) + ') scale(' + q2[2] + ' -1)">' + fishSvg(0, 0, L.small ? 0.52 : 0.75 * (L.fishS || 1), 1, 0, q2[3], 'fish', 1) + '</g>');
        });
      }
      // the algae mat on the surface: thick and green at the bloom, thinning and browning as it dies back
      if(film > 0.04){
        var mp = [], up = [], j, th = film * (1 - browned * 0.4) * (L.small ? 17 : 38) * (0.7 + 0.6 * clamp(r.peakA / 40, 0, 1)), cov = clamp(film * 1.25, 0, 1) * (1 - browned * 0.35);
        // the mat covers more of the lake as it thickens (from the inflow side), and sits a little proud of the surface
        var mx1 = L.x0 + w * (0.08 + 0.92 * cov);
        for(j = 0; j <= 44; j++){ var xx = L.x0 + (mx1 - L.x0) * j / 44, edge = sstep(0, 0.12, j / 44) * (1 - sstep(0.86, 1, j / 44));
          var wob = Math.sin(j * 2.3 + t * 0.5) * Math.sin(j * 0.7);
          mp.push(n1(xx) + ' ' + n1(L.surf + 1 + th * edge * (0.65 + 0.35 * wob)));
          up.push(n1(xx) + ' ' + n1(L.surf - th * 0.16 * edge * (0.5 + 0.5 * Math.sin(j * 1.9 + 1)))); }
        var matC = mixA(P0.mat, P0.brown, browned * 0.8), matD = mixA(matC, [20, 40, 10], 0.35), matH = mixA(P0.algHi, P0.brown, browned * 0.7);
        out.push('<path fill="' + mix(matD, matD, 0) + '" opacity="' + (0.6 + film * 0.35).toFixed(2) + '" d="M' + up[0] + ' L' + mp.join(' L') + ' L' + up.slice().reverse().join(' L') + 'Z"/>');
        out.push('<path fill="' + mix(matC, matC, 0) + '" opacity="' + (0.7 + film * 0.3).toFixed(2) + '" d="M' + up[0] + ' L' + mp.map(function(q){ var a = q.split(' '); return a[0] + ' ' + n1(L.surf + (+a[1] - L.surf) * 0.62); }).join(' L') + ' L' + up.slice().reverse().join(' L') + 'Z"/>');
        // strands hanging under the mat
        for(j = 0; j < Math.round(film * 16); j++){ var sp0 = R_ALG[(j * 11) % R_ALG.length], hx = L.x0 + 10 + sp0[0] * (mx1 - L.x0 - 20), hl = th * (0.6 + sp0[1]);
          out.push('<path fill="none" stroke="' + mix(matC, matC, 0) + '" stroke-width="1.6" stroke-linecap="round" opacity=".7" d="M' + n1(hx) + ' ' + n1(L.surf + th * 0.5) + ' q' + n1(Math.sin(t + j) * 3) + ' ' + n1(hl * 0.5) + ' 0 ' + n1(hl) + '"/>'); }
        for(j = 0; j < Math.round(film * (1 - browned * 0.5) * 50); j++){ var sp = R_ALG[(j * 7) % R_ALG.length]; out.push('<circle cx="' + n1(L.x0 + 6 + sp[0] * (mx1 - L.x0 - 10)) + '" cy="' + n1(L.surf - th * 0.08 + sp[1] * th * 0.5) + '" r="' + n1(1.2 + sp[2] * 2) + '" fill="' + mix(matH, matH, 0) + '" opacity=".8"/>'); }
        if(film > 0.25) res.matPt = [L.x0 + (mx1 - L.x0) * 0.5, L.surf - th * 0.2];
        res.browned = browned;
      }
      out.push('</g>');
      // the surface line, with a glint
      var wv = [], nW = Math.max(8, Math.round(w / 26));
      for(var z = 0; z <= nW; z++){ var wx = L.x0 + w * z / nW; wv.push(n1(wx) + ' ' + n1(L.surf + Math.sin(z * 1.7 + t * 1.2) * 0.9)); }
      out.push('<path class="wp2-surf" d="M' + wv.join(' L') + '"/>');
      res.svg = out.join('');
      return res;
    }

    /* --------------------------------------------------- chapter 1: field and lake */
    function geoFert(Wd, H){
      var ph = Wd < 560, g = { W: Wd, H: H, ph: ph };
      g.surf = Math.round(H * 0.4);
      g.lakeL = Math.round(Wd * (ph ? 0.42 : 0.36));
      g.bed = H - (ph ? 10 : 14);
      g.plat = g.surf - Math.round(H * (ph ? 0.12 : 0.14));
      g.platR = g.lakeL - Math.round(Wd * (ph ? 0.07 : 0.075));
      // the fish keep to the middle of the lake, clear of the thermometer at its right edge
      g.L = { x0: g.lakeL, x1: Wd, surf: g.surf, bed: g.bed, mid: g.surf + (g.bed - g.surf) * 0.42, fishS: ph ? 1 : 1.35, fishR: ph ? 0.72 : 0.8 };
      g.L.basin = lakeBasin(g.lakeL, Wd, g.surf, g.bed, Wd);
      g.sx0 = ph ? 10 : 14; g.sx1 = g.platR - (ph ? 8 : 22);
      g.pile = ph || g.sx1 - g.sx0 < 240;
      g.kx0 = g.pile ? 28 : 38;   // the knob's track starts clear of the picture's edge, so 0 sacks is whole   // a narrow field: the sacks stand in a pile and the knob runs in the soil under it
      g.thX = Wd - (ph ? 22 : 36); g.thTop = g.surf - Math.round(H * 0.2); g.thBulb = g.surf + Math.round((g.bed - g.surf) * 0.28);
      g.thY10 = g.thBulb - 16; g.thY30 = g.thTop + 8;
      g.L.noGo = [g.thX - (ph ? 30 : 40), g.thBulb + (ph ? 18 : 24)];   // fish keep out of the box round the thermometer
      g.slope = [g.platR, g.plat, g.platR + (g.lakeL - g.platR) * 0.55, g.plat, g.lakeL - (g.lakeL - g.platR) * 0.3, g.surf, g.lakeL, g.surf];
      return g;
    }
    function staticFert(g){
      var P0 = g.P, Wd = g.W, H = g.H, s = g.slope, out = '<defs>' + skyAndHills(g, Wd, H) + fishDefs() +
        '<linearGradient id="wpSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.soil + '"/><stop offset=".55" stop-color="' + P0.soil2 + '"/><stop offset="1" stop-color="' + P0.soil3 + '"/></linearGradient>';
      // the field in cross-section: soil under a planted plateau that slopes down to the shore
      var soil = 'M0 ' + n1(g.plat) + ' H' + n1(s[0]) + ' C' + s.slice(2).map(n1).join(' ') + ' C' + n1(g.lakeL + (Wd - g.lakeL) * 0.04) + ' ' + n1(g.surf + (g.bed - g.surf) * 0.5) + ' ' + n1(g.lakeL + (Wd - g.lakeL) * 0.07) + ' ' + n1(g.bed - 2) + ' ' + n1(g.lakeL + (Wd - g.lakeL) * 0.17) + ' ' + n1(g.bed) + ' V' + H + ' H0Z';
      out += '<clipPath id="wpSoilC"><path d="' + soil + '"/></clipPath></defs>';
      out += '<rect width="' + Wd + '" height="' + (g.surf + 4) + '" fill="url(#wpSky)"/>';
      out += clouds(Wd, g.surf, P0, g.ph ? [[0.88, 0.2, 0.7]] : [[0.56, 0.2, 1], [0.92, 0.3, 0.8]]);
      out += hills(Wd, g.surf, P0, H);
      out += lakeStatic(g.L, P0, 'wpLk1');
      out += bedArt(g.L, P0);
      out += '<path d="' + soil + '" fill="url(#wpSoil)"/>';
      out += '<g clip-path="url(#wpSoilC)">';
      // topsoil: a dark band under the field, then wavy layers, stones and a few roots
      out += '<path fill="' + P0.soil3 + '" opacity=".38" d="M0 ' + n1(g.plat) + ' H' + n1(s[0]) + ' C' + s.slice(2).map(n1).join(' ') + ' V' + n1(g.surf + 14) + ' C' + n1(s[4]) + ' ' + n1(s[5] + 16) + ' ' + n1(s[2]) + ' ' + n1(s[3] + 16) + ' ' + n1(s[0] - 10) + ' ' + n1(g.plat + 16) + ' H0Z"/>';
      // layers of soil, each a wavy band: topsoil, a sandy layer, clay, then stony subsoil (depth you can read)
      var bands = [[0.2, P0.silt, 0.32], [0.46, P0.soil3, 0.22], [0.72, P0.bed2, 0.3]], X1 = Wd;
      bands.forEach(function(bd, k){ var y = g.plat + 18 + (H - g.plat - 18) * bd[0], hh = (H - g.plat) * 0.13;
        out += '<path fill="' + bd[1] + '" opacity="' + bd[2] + '" d="M0 ' + n1(y) + ' C' + n1(X1 * 0.3) + ' ' + n1(y - 6) + ' ' + n1(X1 * 0.6) + ' ' + n1(y + 7) + ' ' + n1(X1) + ' ' + n1(y + 1) + ' V' + n1(y + hh + 4) + ' C' + n1(X1 * 0.6) + ' ' + n1(y + hh + 10) + ' ' + n1(X1 * 0.3) + ' ' + n1(y + hh - 4) + ' 0 ' + n1(y + hh) + 'Z"/>'; });
      for(var k = 1; k < 5; k++){ var y = g.plat + 16 + (H - g.plat - 16) * k / 5; out += '<path d="M0 ' + n1(y) + ' C' + n1(Wd * 0.3) + ' ' + n1(y - 5) + ' ' + n1(Wd * 0.62) + ' ' + n1(y + 6) + ' ' + n1(Wd) + ' ' + n1(y + 1) + '" fill="none" stroke="' + P0.soil3 + '" stroke-width="1.2" stroke-dasharray="' + (k % 2 ? '14 6' : '30 8 4 8') + '" opacity=".4"/>'; }
      var rr = M.rng(53);
      for(var q = 0; q < Math.round(g.lakeL / 7); q++){ var px = rr() * (g.lakeL + 20), py = g.plat + 22 + rr() * (H - g.plat - 24), pr = (1.5 + rr() * 3.6) * (1 + (py - g.plat) / (H - g.plat) * 0.8);
        out += '<ellipse cx="' + n1(px) + '" cy="' + n1(py) + '" rx="' + n1(pr) + '" ry="' + n1(pr * 0.66) + '" fill="' + (q % 3 ? P0.soil3 : P0.silt) + '" opacity="' + (q % 3 ? 0.5 : 0.75) + '"/>'; }
      for(var x = 8; x < g.platR - 10; x += (g.ph ? 22 : 26)){ out += '<path class="wp2-root" d="M' + x + ' ' + n1(g.plat + 2) + ' q-3 8 -1 16 M' + x + ' ' + n1(g.plat + 6) + ' q5 6 7 11 M' + x + ' ' + n1(g.plat + 5) + ' q-6 4 -9 8"/>'; }
      out += '</g>';
      // the surface: tilled furrows, then the grass edge down the slope
      out += '<path d="M0 ' + n1(g.plat + 2) + ' H' + n1(s[0] - 4) + '" fill="none" stroke="' + P0.soil3 + '" stroke-width="5" stroke-dasharray="9 5" opacity=".55"/>';
      out += '<path d="M' + n1(s[0] - 8) + ' ' + n1(g.plat) + ' H' + n1(s[0]) + ' C' + s.slice(2).map(n1).join(' ') + '" fill="none" stroke="' + P0.grass + '" stroke-width="6" stroke-linecap="round"/>';
      out += '<path d="M0 ' + n1(g.plat - 1) + ' H' + n1(s[0]) + '" fill="none" stroke="' + P0.grass2 + '" stroke-width="2" opacity=".5"/>';
      // crop rows: a paler back row, then the front row of young corn with leaves
      var gap = g.ph ? 12 : 15;
      for(x = 6 + gap / 2; x < g.platR - 4; x += gap){ var hb = (g.ph ? 12 : 16) + ((x * 5) % 5); out += '<g class="wp2-crop is-back"><path d="M' + n1(x) + ' ' + n1(g.plat - 4) + ' V' + n1(g.plat - 4 - hb) + ' M' + n1(x) + ' ' + n1(g.plat - 4 - hb * 0.5) + ' q-6 -2 -8 -8 M' + n1(x) + ' ' + n1(g.plat - 4 - hb * 0.7) + ' q6 -2 8 -8"/></g>'; }
      for(x = 8; x < g.platR - 6; x += gap){
        var hh = (g.ph ? 16 : 21) + ((x * 7) % 7);
        out += '<g class="wp2-crop"><path d="M' + x + ' ' + n1(g.plat - 1) + ' V' + n1(g.plat - hh) + '"/><path d="M' + x + ' ' + n1(g.plat - hh * 0.4) + ' q-8 -2 -11 -10 M' + x + ' ' + n1(g.plat - hh * 0.62) + ' q8 -3 10 -11 M' + x + ' ' + n1(g.plat - hh * 0.84) + ' q-5 -3 -6 -9"/></g>';
      }
      return out;
    }
    function cubic(s, f){ var u = 1 - f; return [u * u * u * s[0] + 3 * u * u * f * s[2] + 3 * u * f * f * s[4] + f * f * f * s[6], u * u * u * s[1] + 3 * u * u * f * s[3] + 3 * u * f * f * s[5] + f * f * f * s[7]]; }
    function dynFert(g, t){
      var P0 = g.P, out = [], d = S.day, s = g.slope, lab = !S.blank, iv = instOn(), pv = prevOn();
      // storm: a cloud over the field, rain while the runoff runs
      var rain = d > 0 && d < 5 ? 1 : d >= 5 && d < 7 ? 1 - (d - 5) / 2 : 0, cloudOp = d > 0 && d < 7 ? sstep(0, 0.4, d) * (1 - sstep(5, 7, d)) : 0;
      if(cloudOp > 0.01){
        var cx = Math.max(64, g.platR * 0.42), cy = Math.max(26, g.plat * 0.3), cw = g.ph ? 0.8 : 1.15;
        out.push('<g opacity="' + cloudOp.toFixed(2) + '">');
        if(rain > 0) R_RAIN.forEach(function(p, k){ var rx = cx - 52 * cw + p[0] * 104 * cw, ry = cy + 10 + ((t * 160 + p[1] * 120) % Math.max(20, g.plat - cy - 6)); out.push('<path stroke="' + P0.rain + '" stroke-width="1.6" stroke-linecap="round" opacity="' + (0.8 * rain).toFixed(2) + '" d="M' + n1(rx) + ' ' + n1(ry) + ' l-2.4 8"/>'); });
        out.push('<g fill="' + P0.cloud + '" transform="translate(' + n1(cx) + ' ' + n1(cy) + ') scale(' + cw + ')"><ellipse cx="0" cy="0" rx="46" ry="16"/><ellipse cx="-28" cy="4" rx="24" ry="13"/><ellipse cx="30" cy="5" rx="22" ry="12"/><ellipse cx="-6" cy="-10" rx="25" ry="15" fill="' + P0.cloud2 + '"/><ellipse cx="16" cy="-6" rx="16" ry="11" fill="' + P0.cloud2 + '"/></g></g>');
      }
      // fertilizer granules scattered on the field, washed off by the rain
      var left = iv ? 0.6 : 1 - sstep(0.3, 4, d), ng = Math.round(S.sacks * 9 * left);
      for(var k = 0; k < ng; k++){ var p = R_NUT[k % R_NUT.length], gx = 10 + ((p[0] + k * 0.13) % 1) * (g.platR - 8), gy = g.plat + 0.5 + p[1] * 3; out.push('<circle cx="' + n1(gx) + '" cy="' + n1(gy) + '" r="1.9" fill="' + P0.nut + '"/>'); }
      // the sacks: a row on the field (a pile on a phone)
      var span = g.sx1 - g.sx0, sw;
      if(g.pile){
        sw = g.ph ? 34 : 38;
        for(var i = 0; i < S.sacks; i++){ var row = i < 3 ? 0 : 1, col = row ? i - 3 : i; out.push(sack(g.sx0 + sw * 0.5 + col * (sw + 3) + row * (sw + 3) * 0.5, g.plat - 1 - row * sw * 1.08, sw, P0)); }
      } else {
        sw = Math.min(46, span / 5 * 0.88);
        for(var j = 0; j < S.sacks; j++) out.push(sack(g.sx0 + sw * 0.5 + (span - sw) * j / 5, g.plat - 1, sw, P0));
      }
      // runoff: water carrying fertilizer runs across the field and down the slope into the lake, thicker with more sacks
      // (the instant view keeps the stream running, so what the sacks do to the lake stays in the picture)
      var ro = S.sacks > 0 ? (iv ? 1 : sstep(0, 0.6, d) * (1 - sstep(4.5, 7, d))) : 0;
      if(ro > 0.02){
        var path = 'M' + n1(s[0] - 4) + ' ' + n1(s[1] - 1) + ' C' + n1(s[2]) + ' ' + n1(s[3] - 1) + ' ' + n1(s[4]) + ' ' + n1(s[5] - 1) + ' ' + n1(s[6] + 8) + ' ' + n1(s[7] + 1);
        var wide = 4 + S.sacks * 2.2;
        out.push('<path d="M0 ' + n1(g.plat - 1) + ' H' + n1(s[0]) + '" fill="none" stroke="' + P0.rain + '" stroke-width="3" opacity="' + (0.55 * ro).toFixed(2) + '"/>');
        out.push('<path d="M0 ' + n1(g.plat - 1) + ' H' + n1(s[0]) + '" fill="none" stroke="' + P0.nut + '" stroke-width="2" stroke-dasharray="2 10" stroke-dashoffset="' + n1(-t * 40) + '" opacity="' + (0.9 * ro).toFixed(2) + '"/>');
        out.push('<path d="' + path + '" fill="none" stroke="' + mix(P0.top, P0.top, 0) + '" stroke-width="' + n1(wide + 2) + '" stroke-linecap="round" opacity="' + (0.95 * ro).toFixed(2) + '"/>');
        out.push('<path d="' + path + '" fill="none" stroke="' + P0.nut + '" stroke-width="' + n1(Math.max(2, wide * 0.45)) + '" stroke-linecap="round" stroke-dasharray="3 9" stroke-dashoffset="' + n1(-t * 60) + '" opacity="' + (0.95 * ro).toFixed(2) + '"/>');
        // fertilizer specks riding the flow
        var nP = 6 + S.sacks * 3;
        for(var q = 0; q < nP; q++){ var f = (t * 0.45 + q / nP) % 1, pt = cubic([s[0] - 4, s[1] - 1, s[2], s[3] - 1, s[4], s[5] - 1, s[6] + 8, s[7] + 1], f), off = (R_NUT[q % R_NUT.length][1] - 0.5) * wide * 0.6;
          out.push('<circle cx="' + n1(pt[0]) + '" cy="' + n1(pt[1] + off) + '" r="2" fill="' + P0.nut + '" opacity="' + ro.toFixed(2) + '"/>'); }
        // where it enters: a muddy plume fanning out under the surface
        var pl = ro * (0.35 + S.sacks * 0.09), px0 = s[6] + 6, pw = (g.W - g.lakeL) * (0.18 + 0.05 * S.sacks) * sstep(0, 2, d);
        out.push('<path fill="' + P0.nut + '" opacity="' + (0.3 * pl).toFixed(2) + '" d="M' + n1(px0) + ' ' + n1(g.surf + 1) + ' C' + n1(px0 + pw * 0.4) + ' ' + n1(g.surf + 2) + ' ' + n1(px0 + pw * 0.8) + ' ' + n1(g.surf + 8) + ' ' + n1(px0 + pw) + ' ' + n1(g.surf + 4) + ' C' + n1(px0 + pw * 0.7) + ' ' + n1(g.surf + 22) + ' ' + n1(px0 + pw * 0.3) + ' ' + n1(g.surf + 26) + ' ' + n1(px0 + 4) + ' ' + n1(g.surf + 18) + 'Z"/>');
      }
      var lk = lakeDyn(g.L, run, d, t, P0, 'wpLk1', 'f1', g.ph ? 3 : 5);
      out.push(lk.svg);
      // reeds at the near shore, swaying
      for(var rd = 0; rd < (g.ph ? 4 : 7); rd++){ var rx2 = g.lakeL + 6 + rd * (g.ph ? 5 : 6), rh = (g.ph ? 16 : 24) + (rd % 3) * 6, sw2 = Math.sin(t * 0.8 + rd) * 2.5;
        out.push('<path class="wp2-reed" d="M' + n1(rx2) + ' ' + n1(g.surf + 6) + ' Q' + n1(rx2 + sw2 * 0.5) + ' ' + n1(g.surf - rh * 0.5) + ' ' + n1(rx2 + sw2) + ' ' + n1(g.surf - rh) + '"/>' + (rd % 2 ? '<ellipse class="wp2-reedh" cx="' + n1(rx2 + sw2) + '" cy="' + n1(g.surf - rh + 4) + '" rx="1.8" ry="5"/>' : '')); }
      // the lake thermometer, and its label: what it is and how to use it
      var tf = (S.tLake - 10) / 20, ty = lerp(g.thY10, g.thY30, tf);
      out.push('<g class="wp2-thermo"><rect x="' + n1(g.thX - 5) + '" y="' + n1(g.thTop) + '" width="10" height="' + n1(g.thBulb - g.thTop) + '" rx="5"/><circle cx="' + n1(g.thX) + '" cy="' + n1(g.thBulb) + '" r="9"/>' +
        '<rect class="wp2-thermo-c" x="' + n1(g.thX - 2.2) + '" y="' + n1(ty) + '" width="4.4" height="' + n1(g.thBulb - ty) + '"/><circle class="wp2-thermo-c" cx="' + n1(g.thX) + '" cy="' + n1(g.thBulb) + '" r="6.4"/></g>');
      if(!(S.q && S.q.loudTemp)){
        var tlx = g.thX - (g.ph ? 24 : 28), tly = g.thTop + 8;
        out.push(inQuiz() ? '<text class="wp2-lab" x="' + n1(tlx) + '" y="' + n1(tly) + '" text-anchor="end">Lake ' + S.tLake + ' °C</text>'
          : ctl(tlx + 4, tly - 4, 'Lake temperature', 'end', 'heat') + '<text class="wp2-lab is-val is-heat" x="' + n1(tlx) + '" y="' + n1(tly + 26) + '" text-anchor="end">' + S.tLake + ' °C</text>');
      }
      // the fertilizer's label, attached to its control (in the soil under the field, clear of the sacks)
      if(!inQuiz()) out.push(ctl(g.sx0 - 4, g.pile ? g.plat + 64 : g.plat + 38, 'Fertilizer', 'start', 'nut'));
      // the bottom water's oxygen, on the lake (anchored to the bed), with what fish need
      var ph = phase(run, d), o = ph.o, st = status(o), L = g.L, w = L.x1 - L.x0, cx2 = L.x0 + w * (g.ph ? 0.6 : 0.56);
      var bx = L.x0 + w * (g.ph ? 0.12 : 0.16), byB = bedY(L, bx + 30);
      var was = iv && pv && pv.run && fO(pv.run.min) !== fO(o) ? 'was ' + fO(pv.run.min) : '';
      out.push(chip(bx, byB - (g.ph ? 56 : 64) - (was ? 7 : 0), 'Oxygen', fO(o) + ' mg/L', st.tone, g.ph, [bx + 30, byB - 10], st.status, 'fish need 5+', was));
      // small names on the things themselves, only while they are there: runoff, algae, dead algae, bacteria
      if(lab && iv){
        // instant view: the worst day, with the few names that carry the chain
        if(ro > 0.3 && !g.ph) out.push(tag(s[4] + 10, s[5] - 16, 'runoff', 'start', 'nut'));
        if(lk.matPt && lk.browned < 0.5) out.push(tag(g.ph ? L.x0 + w * 0.66 : lk.matPt[0], lk.matPt[1] - 10, 'algae', 'middle', 'alg'));
        if(lk.deadPt) out.push(tag(lk.deadPt[0], lk.deadPt[1] - 8, 'dead algae', 'middle', 'dead'));
        var hyp = o < W.HYPOXIC;
        if(lk.bac && o < HEALTHY && !g.ph){
          var lx2 = L.x0 + w * (g.ph ? 0.62 : 0.68), ly2 = L.mid + (L.bed - L.mid) * (g.ph ? 0.1 : 0.42);
          out.push('<path class="wp2-lead" d="M' + n1(lx2) + ' ' + n1(ly2 + 4) + ' L' + n1(lk.bac[0]) + ' ' + n1(lk.bac[1]) + '"/><circle class="wp2-lead-d" cx="' + n1(lk.bac[0]) + '" cy="' + n1(lk.bac[1]) + '" r="2.4"/>');
          out.push(callout(lx2, ly2, 'bacteria use up oxygen', 'dead', 'middle', g.ph));
        }
        if(hyp) out.push(callout(g.ph ? L.x0 + w * 0.42 : cx2, L.mid - (g.ph ? 6 : 10), g.ph ? 'Dead zone' : 'Dead zone: fish leave or die', 'bad', 'middle', g.ph));
        else if(lk.bubPt && o >= HEALTHY && !g.ph) out.push(tag(lk.bubPt[0] + 12, lk.bubPt[1] - 14, 'oxygen', 'start', 'oxy'));
      } else if(lab && S.sacks > 0 && d > 0){
        var cur = ph.cur;
        if(ro > 0.3) out.push(tag(s[4] + 10, s[5] - 16, 'runoff', 'start', 'nut'));
        if(!ph.rec && cur <= 2 && lk.matPt && !lk.brown) out.push(tag(g.ph ? L.x0 + w * 0.66 : lk.matPt[0], lk.matPt[1] - 10, 'algae', 'middle', 'alg'));
        // fixed spot (it used to follow one sinking clump and jumped as clumps changed)
        if(lk.brown && cur <= 3) out.push(tag(L.x0 + w * (g.ph ? 0.6 : 0.5), g.ph ? L.mid - 4 : L.mid + (L.bed - L.mid) * 0.42, 'dead algae sink \u2193', 'middle', 'dead'));
        else if(lk.deadPt && !ph.rec && cur >= 3 && cur <= 4) out.push(tag(lk.deadPt[0], lk.deadPt[1] - 8, 'dead algae', 'middle', 'dead'));
        if((cur === 3 || cur === 4) && lk.bac && !ph.rec){
          var lx = cx2, ly = L.mid + (L.bed - L.mid) * 0.18;
          out.push('<path class="wp2-lead" d="M' + n1(lx) + ' ' + n1(ly + 4) + ' L' + n1(lk.bac[0]) + ' ' + n1(lk.bac[1]) + '"/><circle class="wp2-lead-d" cx="' + n1(lk.bac[0]) + '" cy="' + n1(lk.bac[1]) + '" r="2.4"/>');
          out.push(callout(lx, ly, 'bacteria use up oxygen', 'dead', 'middle', g.ph));
        }
        if(cur === 5 && !ph.rec && o < W.HYPOXIC) out.push(callout(g.ph ? L.x0 + w * 0.42 : cx2, g.ph || w < 640 ? L.mid - 6 : L.mid + (L.bed - L.mid) * 0.3, g.ph ? 'Dead zone' : 'Dead zone: fish leave or die', 'bad', 'middle', g.ph));
      }
      return out.join('');
    }
    /* A small name on a thing in the picture ("algae"), in its role colour, with a halo. */
    function tag(x, y, text, anchor, role){
      return pill(x, y, text, anchor, 'wp2-name is-' + role, 6.9, 20);
    }
    /* A control's name, attached to it: 1 to 3 words on a pill, in the idea's colour. */
    function ctl(x, y, text, anchor, role){ return pill(x, y, text, anchor, 'wp2-ctl is-' + role, 8.3, 25); }
    /* A label on a soft pill, so it stays clean over fish, algae or water. y is the text's middle. */
    function pill(x, y, text, anchor, cls, cw, h){
      var w = Math.round(text.length * cw + 16), x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
      if(G) x0 = clamp(x0, 4, G.W - w - 4);
      return '<g class="wp2-pill ' + cls + '"><rect x="' + n1(x0) + '" y="' + n1(y - h / 2) + '" width="' + w + '" height="' + h + '" rx="' + n1(h / 2) + '"/>' +
        '<text x="' + n1(x0 + w / 2) + '" y="' + n1(y + h * 0.17) + '" text-anchor="middle">' + esc(text) + '</text></g>';
    }
    /* A value card in the scene (the readout's number, the same value); lead: [x, y] a short line to what it measures. */
    function chip(x, y, k, v, tone, ph, lead, stw, hint, was){
      // the status word sits right after the value; a third, small line says what fish need
      var vw = v.length * (ph ? 8.6 : 9.6), sw = stw ? stw.length * (ph ? 6.9 : 7.2) : 0, kw = k.length * (ph ? 7.6 : 8.2), hw = hint ? hint.length * (ph ? 6 : 6.3) : 0;
      var w = Math.round(Math.max(ph ? 96 : 112, 18 + vw + (stw ? 8 + sw : 0), 18 + kw, 18 + hw)), h = (ph ? 40 : 46) + (hint ? (ph ? 14 : 15) : 0) + (was ? 15 : 0), y0 = y - h / 2, out = '<g class="wp2-chip">';
      if(lead) out += '<path class="wp2-lead" d="M' + n1(x + w * 0.5) + ' ' + n1(y + h / 2) + ' L' + n1(lead[0]) + ' ' + n1(lead[1]) + '"/><circle class="wp2-lead-d" cx="' + n1(lead[0]) + '" cy="' + n1(lead[1]) + '" r="2.6"/>';
      var vy = y0 + (ph ? 33 : 38);
      return out + '<rect x="' + n1(x) + '" y="' + n1(y0) + '" width="' + w + '" height="' + h + '" rx="9"/>' +
        '<text class="wp2-chip-k" x="' + n1(x + 9) + '" y="' + n1(y0 + (ph ? 15 : 17)) + '">' + esc(k) + '</text>' +
        '<text class="wp2-chip-v' + (tone === 'bad' ? ' is-bad' : '') + '" x="' + n1(x + 9) + '" y="' + n1(vy) + '">' + esc(v) + '</text>' +
        (stw ? '<text class="wp2-chip-s is-' + tone + '" x="' + n1(x + 9 + vw + 8) + '" y="' + n1(vy) + '">' + esc(stw) + '</text>' : '') +
        (hint ? '<text class="wp2-chip-h" x="' + n1(x + 9) + '" y="' + n1(vy + (ph ? 14 : 15)) + '">' + esc(hint) + '</text>' : '') +
        (was ? '<text class="wp2-chip-w" x="' + n1(x + 9) + '" y="' + n1(vy + (ph ? 14 : 15) + (hint ? 15 : 0)) + '">' + esc(was) + '</text>' : '') + '</g>';
    }
    function callout(x, y, text, tone, anchor, ph){
      var bad = tone === 'bad';
      return pill(x, y - (bad ? 6 : 5), text, anchor, 'wp2-call' + (tone ? ' is-' + tone : '') + (ph ? ' is-ph' : ''), bad ? (ph ? 8.4 : 9.4) : (ph ? 7.4 : 8.2), bad ? (ph ? 26 : 30) : (ph ? 23 : 26));
    }

    /* --------------------------------------------------- chapter 2: a power plant on a trout river */
    function geoHeat(Wd, H){
      var ph = Wd < 560, g = { W: Wd, H: H, ph: ph };
      g.hor = Math.round(H * (ph ? 0.24 : 0.26)); g.surf = Math.round(H * (ph ? 0.66 : 0.58)); g.bed = H - (ph ? 8 : 12); g.bank = g.surf - (ph ? 8 : 12);
      g.pcx = Math.round(Wd * (ph ? 0.47 : 0.46)); g.bw = Math.round(Wd * (ph ? 0.2 : 0.13)); g.bh = Math.round(H * (ph ? 0.13 : 0.16));
      g.bx0 = g.pcx - g.bw / 2; g.bx1 = g.pcx + g.bw / 2; g.btop = g.bank - g.bh;
      g.pipeX = g.bx1 + Math.round(Wd * (ph ? 0.06 : 0.035)); g.pipeY = g.btop + g.bh * 0.45;
      // the handle's scale stands on the outflow pipe's elbow, so the handle is ON the pipe it sets
      g.vX = g.pipeX; g.vY0 = g.pipeY - 12; g.vY1 = Math.max(ph ? 146 : 16, g.vY0 - Math.min(ph ? 96 : 130, H * 0.34));
      g.pw = ph ? 132 : 176; g.pH = ph ? 116 : 130;
      g.up = { x0: 0, x1: g.bx0 - (ph ? 26 : 50), inst: Math.round(ph ? 8 + g.pw / 2 : Wd * 0.14) };
      g.dn = { x0: g.pipeX + 12, x1: Wd, inst: Math.round(ph ? Wd - 8 - g.pw / 2 : Wd * 0.84) };
      return g;
    }
    function staticHeat(g){
      var P0 = g.P, Wd = g.W, H = g.H, out = '<defs>' + skyAndHills(g, Wd, H) + fishDefs() +
        '<linearGradient id="wpBank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.near + '"/><stop offset="1" stop-color="' + P0.grass2 + '"/></linearGradient>' +
        '<linearGradient id="wpRiv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + mix(P0.top, P0.top, 0) + '"/><stop offset="1" stop-color="' + mix(P0.deep, P0.deep, 0) + '"/></linearGradient>' +
        '<linearGradient id="wpTow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="wp2-tw0"/><stop offset=".4" class="wp2-tw1"/><stop offset="1" class="wp2-tw2"/></linearGradient></defs>';
      out += '<rect width="' + Wd + '" height="' + (g.hor + 4) + '" fill="url(#wpSky)"/>';
      out += clouds(Wd, g.hor, P0, g.ph ? [[0.5, 0.45, 0.6]] : [[0.3, 0.4, 0.9], [0.74, 0.5, 0.7]]);
      out += hills(Wd, g.hor, P0, H);
      // a power line on pylons across the far hills (where the plant's electricity goes)
      var py0 = g.hor - H * 0.02, pyl = function(x, s){ return '<path class="wp2-pylon" d="M' + n1(x - 7 * s) + ' ' + n1(py0) + ' L' + n1(x) + ' ' + n1(py0 - 34 * s) + ' L' + n1(x + 7 * s) + ' ' + n1(py0) + ' M' + n1(x - 4.5 * s) + ' ' + n1(py0 - 12 * s) + ' L' + n1(x + 4.5 * s) + ' ' + n1(py0 - 12 * s) + ' M' + n1(x - 10 * s) + ' ' + n1(py0 - 26 * s) + ' H' + n1(x + 10 * s) + ' M' + n1(x - 3 * s) + ' ' + n1(py0 - 22 * s) + ' L' + n1(x + 5 * s) + ' ' + n1(py0 - 12 * s) + '"/>'; };
      if(!g.ph){ var pxs = [Wd * 0.66, Wd * 0.8, Wd * 0.94]; out += pxs.map(function(x, i){ return pyl(x, 1 - i * 0.12); }).join('') + '<path class="wp2-wire" d="M' + n1(g.bx1) + ' ' + n1(g.btop - 6) + ' Q' + n1((g.bx1 + pxs[0]) / 2) + ' ' + n1(py0 - 14) + ' ' + n1(pxs[0] + 10) + ' ' + n1(py0 - 26) + ' Q' + n1((pxs[0] + pxs[1]) / 2) + ' ' + n1(py0 - 16) + ' ' + n1(pxs[1] + 8.8) + ' ' + n1(py0 - 23) + ' Q' + n1((pxs[1] + pxs[2]) / 2) + ' ' + n1(py0 - 14) + ' ' + n1(pxs[2] + 7.6) + ' ' + n1(py0 - 20) + '"/>'; }
      out += '<rect y="' + n1(g.hor) + '" width="' + Wd + '" height="' + n1(g.surf - g.hor + 2) + '" fill="url(#wpBank)"/>';
      // grass tufts along the bank top and its edge
      for(var gt = 0; gt < Math.round(Wd / 22); gt++){ var gx = (gt * 47.3 + 11) % Wd, gy = g.hor + 10 + ((gt * 29) % Math.max(10, g.bank - g.hor - 20));
        if(gx > g.bx0 - g.bw * 0.6 && gx < g.pipeX + 20 && gy > g.btop - 10) continue;
        out += '<path class="wp2-tuft" d="M' + n1(gx - 4) + ' ' + n1(gy) + ' l2 -6 M' + n1(gx) + ' ' + n1(gy) + ' l0 -8 M' + n1(gx + 4) + ' ' + n1(gy) + ' l-2 -6"/>'; }
      // the river in cutaway: water, then its stony bed
      out += '<rect y="' + n1(g.surf) + '" width="' + Wd + '" height="' + n1(g.bed - g.surf) + '" fill="url(#wpRiv)"/>';
      out += '<rect y="' + n1(g.surf) + '" width="' + Wd + '" height="' + n1((g.bed - g.surf) * 0.22) + '" fill="#fff" opacity="' + (dark() ? 0.05 : 0.12) + '"/>';
      out += '<path fill="' + P0.grass2 + '" d="M0 ' + n1(g.surf + 1) + ' H' + Wd + ' V' + n1(g.surf - 5) + ' C' + n1(Wd * 0.7) + ' ' + n1(g.surf - 2) + ' ' + n1(Wd * 0.3) + ' ' + n1(g.surf - 7) + ' 0 ' + n1(g.surf - 4) + 'Z"/>';
      out += '<path fill="' + P0.bed + '" d="M0 ' + n1(g.bed - 4) + ' C' + n1(Wd * 0.25) + ' ' + n1(g.bed - 9) + ' ' + n1(Wd * 0.5) + ' ' + n1(g.bed + 1) + ' ' + n1(Wd * 0.75) + ' ' + n1(g.bed - 6) + ' S' + n1(Wd * 0.95) + ' ' + n1(g.bed - 2) + ' ' + Wd + ' ' + n1(g.bed - 5) + ' V' + H + ' H0Z"/>';
      for(var k = 0; k < Math.round(Wd / 18); k++){ var x = (k * 37.3) % Wd, r = 2 + (k * 13 % 5); out += '<ellipse cx="' + n1(x) + '" cy="' + n1(g.bed - 3 + (k % 3)) + '" rx="' + r + '" ry="' + n1(r * 0.6) + '" fill="' + (k % 2 ? P0.bed2 : P0.conc2) + '"/>'; }
      // the plant: building, cooling tower, intake (upstream) and outflow (downstream) pipes
      var tw = g.bw * 0.62, tx = g.bx0 - tw * 0.15, th = g.bh * 1.55;
      out += '<path class="wp2-tower" d="M' + n1(tx - tw / 2) + ' ' + n1(g.bank) + ' C' + n1(tx - tw * 0.28) + ' ' + n1(g.bank - th * 0.5) + ' ' + n1(tx - tw * 0.3) + ' ' + n1(g.bank - th * 0.8) + ' ' + n1(tx - tw * 0.36) + ' ' + n1(g.bank - th) +
        ' H' + n1(tx + tw * 0.36) + ' C' + n1(tx + tw * 0.3) + ' ' + n1(g.bank - th * 0.8) + ' ' + n1(tx + tw * 0.28) + ' ' + n1(g.bank - th * 0.5) + ' ' + n1(tx + tw / 2) + ' ' + n1(g.bank) + 'Z"/>';
      // a chimney stack with red and white bands, then the turbine hall
      var stx = g.bx1 - g.bw * 0.2, sth = g.bh * 0.9;
      out += '<rect class="wp2-stack" x="' + n1(stx - 5) + '" y="' + n1(g.btop - sth) + '" width="10" height="' + n1(sth) + '"/>' + [0.08, 0.3].map(function(f){ return '<rect class="wp2-stackb" x="' + n1(stx - 5) + '" y="' + n1(g.btop - sth * (1 - f)) + '" width="10" height="' + n1(sth * 0.1) + '"/>'; }).join('');
      out += '<rect class="wp2-bldg" x="' + n1(g.bx0) + '" y="' + n1(g.btop) + '" width="' + n1(g.bw) + '" height="' + n1(g.bh) + '" rx="3"/>';
      for(var bl = 1; bl < 6; bl++) out += '<path class="wp2-bline" d="M' + n1(g.bx0 + 2) + ' ' + n1(g.btop + g.bh * bl / 6) + ' H' + n1(g.bx1 - 2) + '"/>';
      out += '<rect class="wp2-door" x="' + n1(g.bx1 - g.bw * 0.2) + '" y="' + n1(g.btop + g.bh * 0.62) + '" width="' + n1(g.bw * 0.12) + '" height="' + n1(g.bh * 0.38) + '" rx="1.5"/>';
      out += '<path class="wp2-roof" d="M' + n1(g.bx0 - 3) + ' ' + n1(g.btop) + ' H' + n1(g.bx1 + 3) + ' V' + n1(g.btop + 6) + ' H' + n1(g.bx0 - 3) + 'Z"/>';
      for(var wi = 0; wi < 3; wi++) out += '<rect class="wp2-win" x="' + n1(g.bx0 + g.bw * (0.14 + wi * 0.27)) + '" y="' + n1(g.btop + g.bh * 0.3) + '" width="' + n1(g.bw * 0.16) + '" height="' + n1(g.bh * 0.22) + '" rx="1.5"/>';
      // a narrow building: the sign starts at its left edge, clear of the handle's first time "Drag" chip
      var signL = g.bw < 140;
      out += '<text class="wp2-lab' + (g.ph ? ' is-sm' : '') + '" x="' + n1(signL ? g.bx0 + 4 : g.pcx) + '" y="' + n1(g.btop + g.bh * 0.86) + '" text-anchor="' + (signL ? 'start' : 'middle') + '">Power plant</text>';
      var ix = g.bx0 + g.bw * 0.2;
      out += '<path class="wp2-pipe" d="M' + n1(ix) + ' ' + n1(g.bank - 2) + ' V' + n1(g.surf + 18) + '"/>';
      out += '<path class="wp2-pipe is-warm" d="M' + n1(g.bx1) + ' ' + n1(g.pipeY) + ' H' + n1(g.pipeX) + ' V' + n1(g.surf + 10) + '"/>';
      // the handle's scale on the outflow pipe: +0 to +15 °C, with its name at the top
      out += '<path class="wp2-pipe is-warm" d="M' + n1(g.vX) + ' ' + n1(g.pipeY) + ' V' + n1(g.vY0 + 2) + '" stroke-width="4"/>';
      out += '<rect class="wp2-vscale" x="' + n1(g.vX - 5) + '" y="' + n1(g.vY1) + '" width="10" height="' + n1(g.vY0 - g.vY1) + '" rx="5"/>';
      [0, 5, 10, 15].forEach(function(v){ var y = lerp(g.vY0, g.vY1, v / 15); out += '<path class="wp2-tick" d="M' + n1(g.vX + 8) + ' ' + n1(y) + ' h6"/><text class="wp2-tk" x="' + n1(g.vX + 17) + '" y="' + n1(y + 4) + '">+' + v + '</text>'; });
      // its label: what it is and how to use it (right of the scale's numbers)
      var hlx = g.vX + (g.ph ? 44 : 48), hly = g.vY1 + 10;
      if(!inQuiz()) out += ctl(hlx - 4, hly - 4, 'Hot water', 'start', 'heat');
      // zone names on the bank
      // flow arrow on the water: the river runs left to right
      out += '<path class="wp2-flowa" d="M' + n1(Wd * 0.03) + ' ' + n1(g.surf + 16) + ' h' + (g.ph ? 26 : 36) + ' m-7 -5 l7 5 l-7 5"/>';
      // weeds and stones on the river bed
      for(var q = 0; q < Math.round(Wd / 90); q++){ var wx = (q * 83.7 + 30) % Wd, wh = 14 + (q * 7 % 12); out += '<path class="wp2-weed" d="M' + n1(wx) + ' ' + n1(g.bed - 4) + ' C' + n1(wx - 3) + ' ' + n1(g.bed - wh * 0.5) + ' ' + n1(wx + 4) + ' ' + n1(g.bed - wh * 0.7) + ' ' + n1(wx + 1) + ' ' + n1(g.bed - wh) + '"/>'; }
      return out;
    }
    /* A monitoring station on the bank, its probe in the river: the water's temperature, and a bar for the most
       oxygen it can hold with the line young trout need. */
    function station(x, g, name, tC, cap, warm, was){
      var pw = g.pw, ph_ = g.pH, x0 = x - pw / 2, y0 = g.ph ? 8 : Math.max(g.hor + 6, g.bank - ph_ - 10), out = '', gx0 = x0 + 12, gx1 = x0 + pw - 12, gy = y0 + ph_ - 64, bh = g.ph ? 14 : 16;
      var gv = function(v){ return gx0 + (gx1 - gx0) * clamp(v / 14, 0, 1); }, low = cap < TROUT;
      out += '<path class="wp2-post" d="M' + n1(x) + ' ' + n1(y0 + ph_) + ' V' + n1(g.bed - 6) + '"/><circle class="wp2-probe" cx="' + n1(x) + '" cy="' + n1(g.bed - 10) + '" r="4"/>';
      out += '<rect class="wp2-panel' + (low ? ' is-low' : '') + (warm != null && name === 'Downstream' ? ' is-dn' : '') + '" x="' + n1(x0) + '" y="' + n1(y0) + '" width="' + pw + '" height="' + ph_ + '" rx="12"/>';
      out += '<text class="wp2-pk' + (g.ph ? ' is-sm' : '') + '" x="' + n1(x0 + (g.ph ? 9 : 12)) + '" y="' + n1(y0 + 19) + '">' + esc(name) + '</text>';
      // thermometer glyph and the temperature, top right
      var tx = x0 + pw - 66, tt = y0 + 7, tb = y0 + 22;
      if(!g.ph) out += '<rect class="wp2-tg" x="' + n1(tx - 3.5) + '" y="' + n1(tt) + '" width="7" height="' + n1(tb - tt) + '" rx="3.5"/><circle class="wp2-tg" cx="' + n1(tx) + '" cy="' + n1(tb) + '" r="5"/>' +
        '<rect class="wp2-thermo-c' + (warm ? ' is-warm' : '') + '" x="' + n1(tx - 1.5) + '" y="' + n1(lerp(tb, tt + 2, clamp(tC / 35, 0, 1))) + '" width="3" height="' + n1(tb - lerp(tb, tt + 2, clamp(tC / 35, 0, 1))) + '"/><circle class="wp2-thermo-c' + (warm ? ' is-warm' : '') + '" cx="' + n1(tx) + '" cy="' + n1(tb) + '" r="3.4"/>';
      out += '<text class="wp2-pv is-heat' + (g.ph ? ' is-sm' : '') + '" x="' + n1(x0 + pw - (g.ph ? 9 : 12)) + '" y="' + n1(y0 + 21) + '" text-anchor="end">' + tC + ' °C</text>';
      // the most oxygen it can hold: a big bar, with young trout's need marked on it (a tall tick and a trout)
      out += '<text class="wp2-pk2" x="' + n1(gx0) + '" y="' + n1(gy - 9) + '">Can hold</text>';
      out += '<rect class="wp2-gbar" x="' + n1(gx0) + '" y="' + n1(gy) + '" width="' + n1(gx1 - gx0) + '" height="' + bh + '" rx="' + bh / 2 + '"/>';
      out += '<rect class="wp2-gbar-f' + (low ? ' is-low' : '') + '" x="' + n1(gx0) + '" y="' + n1(gy) + '" width="' + n1(gv(cap) - gx0) + '" height="' + bh + '" rx="' + bh / 2 + '"/>';
      out += '<path class="wp2-troutl" d="M' + n1(gv(TROUT)) + ' ' + n1(gy - 6) + ' V' + n1(gy + bh + 6) + '"/>' + fishSvg(gv(TROUT) + 12, gy - 11, 0.42, 1, 0, 0, 'trout', 1);
      out += '<text class="wp2-pv is-oxy' + (low ? ' is-bad' : '') + '" x="' + n1(gx0) + '" y="' + n1(gy + bh + 22) + '">' + F(cap) + ' mg/L</text>';
      if(!g.ph) out += '<text class="wp2-pk2' + (low ? ' is-bad' : '') + '" x="' + n1(gx1) + '" y="' + n1(gy + bh + 21) + '" text-anchor="end">' + (low ? 'too little' : 'trout OK') + '</text>';
      if(was) out += '<text class="wp2-chip-w" x="' + n1(gx0) + '" y="' + n1(gy + bh + 38) + '">' + esc(was) + '</text>';
      return out;
    }
    function dynHeat(g, t){
      var P0 = g.P, out = [], Wd = g.W, h = heatPts(), wf = S.warm / 15;
      // the warm plume: warm water is lighter, so it spreads along the surface downstream
      if(S.warm > 0){
        var c0 = mix(P0.warm, P0.warm, 0), dep = g.bed - g.surf;
        out.push('<defs><linearGradient id="wpPl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c0 + '" stop-opacity="' + (0.2 + wf * 0.5).toFixed(2) + '"/><stop offset="1" stop-color="' + c0 + '" stop-opacity="0"/></linearGradient></defs>');
        out.push('<path fill="url(#wpPl)" d="M' + n1(g.pipeX - 10) + ' ' + n1(g.surf) + ' C' + n1(g.pipeX - 6) + ' ' + n1(g.surf + dep * 0.55) + ' ' + n1(g.pipeX + 40) + ' ' + n1(g.surf + dep * (0.35 + wf * 0.25)) + ' ' + n1(Wd * 0.75) + ' ' + n1(g.surf + dep * (0.25 + wf * 0.2)) + ' S' + n1(Wd) + ' ' + n1(g.surf + dep * (0.22 + wf * 0.18)) + ' ' + n1(Wd + 2) + ' ' + n1(g.surf + dep * (0.22 + wf * 0.18)) + ' V' + n1(g.surf) + 'Z"/>');
        for(var k = 0; k < 4; k++){ var ph2 = ((t * 0.3 + k / 4) % 1); out.push('<path d="M' + n1(g.pipeX + 10 + k * 22 + ph2 * 30) + ' ' + n1(g.surf - 2 - ph2 * 12) + ' q4 -5 0 -10" fill="none" stroke="' + c0 + '" stroke-width="1.6" stroke-linecap="round" opacity="' + (wf * 0.8 * (1 - ph2)).toFixed(2) + '"/>'); }
      }
      // flow: soft ripples drifting downstream
      for(var f = 0; f < 7; f++){ var fy = g.surf + (g.bed - g.surf) * (0.18 + (f % 4) * 0.2), fx = ((t * (16 + f * 3) + f * 173) % (Wd + 120)) - 60; out.push('<path class="wp2-flow" d="M' + n1(fx) + ' ' + n1(fy) + ' q12 -4 24 0 t24 0"/>'); }
      // trout: two above the plant, two below; below the plant they swim up out of water that cannot hold enough
      var fs = fishState('h', 4), ok0 = h.d0 >= TROUT, ok1 = h.d1 >= TROUT;
      fs.forEach(function(st, i){
        var rr = R_RAIN[i + 11], down = i >= 2, zone = down ? g.dn : g.up;
        var target = down ? (ok1 ? 0 : ok0 ? 1 : 2) : (ok0 ? 0 : 2);   // 0 stay, 1 swim upstream, 2 leave the picture
        st.to = target; if(st.o == null || !looping) st.o = target;
        var u = t * (0.3 + rr[2] * 0.15) + rr[3] * 6.28, cu = Math.cos(u), span = Math.max(30, (zone.x1 - zone.x0) * 0.32);
        var homeX = zone.x0 + (zone.x1 - zone.x0) * (i % 2 ? 0.62 : 0.28) + rr[0] * 20, upX = g.up.x0 + (g.up.x1 - g.up.x0) * (i % 2 ? 0.75 : 0.45) + rr[1] * 16, goneX = -60;
        var o = st.o, cx = o <= 1 ? lerp(homeX, upX, o) : lerp(upX, goneX, o - 1);
        var moving = Math.abs(o - target) > 0.05, x = cx + (moving ? 0 : span * 0.5 * Math.sin(u)), dir = moving ? (target > o ? -1 : 1) : (cu >= 0 ? 1 : -1);
        var sx = dir * (moving ? 1 : Math.max(0.28, Math.sqrt(Math.abs(cu)))), y = g.surf + (g.bed - g.surf) * (0.35 + rr[1] * 0.35) + Math.sin(t * 1.2 + i) * 2;
        if(x > -40) out.push(fishSvg(x, y, g.ph ? 0.8 : 1.15, sx, Math.sin(t * 7 + i) * 12, Math.sin(u * 2) * 3, 'trout', 1));
      });
      // the downstream water is empty once it cannot hold what trout need: say so where they were
      if(expl() && ok0 && !ok1) out.push(callout((g.dn.x0 + g.dn.x1) / 2 + (g.ph ? 10 : 0), g.surf + (g.bed - g.surf) * 0.55, 'trout left', '', 'middle', g.ph));
      out.push(station(g.up.inst, g, 'Upstream', h.t0, h.d0, false));
      var pvs = prevOn(), wasD = pvs && pvs.warm != null ? r1(W.osat(pvs.up + pvs.warm)) : null;
      out.push(station(g.dn.inst, g, 'Downstream', h.t1, h.d1, S.warm > 0, wasD != null && F(wasD) !== F(h.d1) ? 'was ' + F(wasD) : ''));
      out.push('<path class="wp2-surf" d="M0 ' + n1(g.surf) + ' H' + Wd + '"/>');
      return out.join('');
    }

    /* --------------------------------------------------- chapter 3: town, plant, lake below */
    function geoSew(Wd, H){
      var ph = Wd < 560, g = { W: Wd, H: H, ph: ph };
      g.hor = Math.round(H * (ph ? 0.12 : 0.2));
      if(ph){
        g.tTop = Math.round(H * 0.25); g.tH = Math.round(H * 0.25); g.px0 = 6; g.px1 = Wd - 24;
        g.lake = { x0: Math.round(Wd * 0.16), x1: Wd, surf: Math.round(H * 0.7), bed: H - 8, small: true };
      } else {
        g.tTop = Math.round(H * 0.33); g.tH = Math.round(H * 0.38); g.px0 = Math.round(Wd * 0.025); g.px1 = Math.round(Wd * 0.585);
        g.lake = { x0: Math.round(Wd * 0.645), x1: Wd, surf: Math.round(H * 0.44), bed: H - 12, small: true };
      }
      g.lake.mid = g.lake.surf + (g.lake.bed - g.lake.surf) * 0.42; g.lake.basin = lakeBasin(g.lake.x0, g.lake.x1, g.lake.surf, g.lake.bed, Wd);
      var rawW = ph ? 40 : 60, gap = ph ? 8 : 16, n = 4, tw = (g.px1 - g.px0 - rawW - gap * n) / n;
      g.tanks = [{ x: g.px0, y: g.tTop + g.tH * 0.18, w: rawW, h: g.tH * 0.82, raw: true }];
      for(var i = 0; i < n; i++) g.tanks.push({ x: g.px0 + rawW + gap * (i + 1) + tw * i, y: g.tTop, w: tw, h: g.tH });
      g.pipeY = g.tTop + g.tH * 0.3;
      g.outX = ph ? Wd - 12 : g.px1 + Math.round(Wd * 0.025);
      return g;
    }
    function staticSew(g){
      var P0 = g.P, Wd = g.W, H = g.H, out = '<defs>' + skyAndHills(g, Wd, H) + fishDefs() + '<linearGradient id="wpBank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.near + '"/><stop offset="1" stop-color="' + P0.grass2 + '"/></linearGradient></defs>';
      out += '<rect width="' + Wd + '" height="' + (g.hor + 4) + '" fill="url(#wpSky)"/>';
      out += clouds(Wd, g.hor, P0, g.ph ? [[0.62, 0.5, 0.6]] : [[0.42, 0.45, 0.9], [0.84, 0.55, 0.7]]);
      out += hills(Wd, g.hor, P0, H);
      out += '<rect y="' + n1(g.hor) + '" width="' + Wd + '" height="' + n1(H - g.hor) + '" fill="url(#wpBank)"/>';
      // the plant's yard: a paved strip the tanks stand on
      var yard0 = g.tTop + g.tH + (g.ph ? 2 : 4);
      out += '<rect class="wp2-yard" x="' + n1(g.px0 - 4) + '" y="' + n1(g.tTop + g.tH * 0.5) + '" width="' + n1(g.px1 - g.px0 + 8) + '" height="' + n1(yard0 - g.tTop - g.tH * 0.5 + 6) + '" rx="6"/>';
      // town: houses in a few colours with chimneys, and trees between them
      var hx = g.ph ? 10 : 16, hy = g.hor + (g.ph ? 20 : 26), HC = ['#E8DCC8', '#D9E4EC', '#F0D9C4', '#E2E8D0'], RC = ['#B5654A', '#6F7F8E', '#9C5A3C', '#7E6A52'];
      for(var k = 0; k < (g.ph ? 3 : 4); k++){
        var x = hx + k * (g.ph ? 26 : 30), w = g.ph ? 20 : 24, h = (g.ph ? 14 : 18) + (k % 2) * 4, y = hy - (k % 2) * 3;
        if(k % 2 === 0) out += '<rect class="wp2-chim" x="' + n1(x + w * 0.66) + '" y="' + n1(y - h - w * 0.42) + '" width="' + n1(w * 0.14) + '" height="' + n1(w * 0.3) + '"/>';
        out += '<rect class="wp2-house" x="' + x + '" y="' + n1(y - h) + '" width="' + w + '" height="' + h + '" style="fill:' + (dark() ? '#8C8070' : HC[k % 4]) + '"/><path class="wp2-hroof" style="fill:' + RC[k % 4] + '" d="M' + (x - 3) + ' ' + n1(y - h) + ' L' + n1(x + w / 2) + ' ' + n1(y - h - w * 0.5) + ' L' + (x + w + 3) + ' ' + n1(y - h) + 'Z"/>' +
          '<rect class="wp2-win" x="' + n1(x + w * 0.35) + '" y="' + n1(y - h * 0.65) + '" width="' + n1(w * 0.3) + '" height="' + n1(h * 0.3) + '"/>';
        if(k < (g.ph ? 2 : 3)){ var tx2 = x + w + (g.ph ? 3 : 3), ts = g.ph ? 4 : 5; out += '<path fill="' + P0.grass2 + '" d="M' + n1(tx2) + ' ' + n1(y - ts * 3.2) + ' C' + n1(tx2 + ts) + ' ' + n1(y - ts * 3) + ' ' + n1(tx2 + ts * 1.2) + ' ' + n1(y - ts * 0.6) + ' ' + n1(tx2) + ' ' + n1(y) + ' C' + n1(tx2 - ts * 1.2) + ' ' + n1(y - ts * 0.6) + ' ' + n1(tx2 - ts) + ' ' + n1(y - ts * 3) + ' ' + n1(tx2) + ' ' + n1(y - ts * 3.2) + 'Z"/>'; }
      }
      out += '<text class="wp2-lab" x="' + n1(hx + (g.ph ? 84 : 124)) + '" y="' + n1(hy - (g.ph ? 26 : 30)) + '">Town</text>';
      // sewer from the town down to the plant
      var raw = g.tanks[0];
      out += '<path class="wp2-pipe is-sew" d="M' + n1(hx + 40) + ' ' + n1(hy) + ' V' + n1(g.pipeY - (g.ph ? 16 : 22)) + ' H' + n1(raw.x + raw.w * 0.5) + ' V' + n1(raw.y + 4) + '"/>';
      // the lake below: water and bed (its life is drawn each frame)
      // the lake below sits in a cut of earth (cross-section), under the bank
      var LK = g.lake;
      out += '<linearGradient id="wpSoil3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.soil + '"/><stop offset="1" stop-color="' + P0.soil3 + '"/></linearGradient>';
      out += '<path fill="url(#wpSoil3)" d="M' + n1(LK.x0 - 26) + ' ' + n1(LK.surf - 1) + ' C' + n1(LK.x0 - 16) + ' ' + n1(LK.surf + (LK.bed - LK.surf) * 0.4) + ' ' + n1(LK.x0 - 40) + ' ' + n1(H - 30) + ' ' + n1(LK.x0 - 58) + ' ' + H + ' H' + Wd + ' V' + n1(LK.surf - 1) + 'Z"/>';
      out += '<path fill="none" stroke="' + P0.grass + '" stroke-width="4" stroke-linecap="round" d="M' + n1(LK.x0 - 40) + ' ' + n1(LK.surf - 1) + ' H' + n1(LK.x0 + 4) + '"/>';
      out += lakeStatic(g.lake, P0, 'wpLk3') + bedArt(g.lake, P0);
      out += '<text class="wp2-lab" x="' + n1(g.lake.x0 + (g.lake.x1 - g.lake.x0) * 0.55) + '" y="' + n1(g.lake.surf - 10) + '" text-anchor="middle">Lake below</text>';
      return out;
    }
    function tankArt(tk, i, on, t, P0, ph){ return tankArt0(tk, i, on, t, P0, ph, looping, !!(S.q && S.q.hideDoes)); }
    function dynSew(g, t){
      var P0 = g.P, out = [], last = S.stage, tk = g.tanks;
      // pipes between used tanks; the bypass over the skipped ones
      for(var i = 0; i < tk.length; i++){
        out.push(tankArt(tk[i], i, i <= last, t, P0, g.ph));
        if(i < tk.length - 1){ var a = tk[i], b = tk[i + 1]; out.push('<path class="wp2-pipe' + (i < last ? ' is-sew' : ' is-off') + '" d="M' + n1(a.x + a.w) + ' ' + n1(g.pipeY) + ' H' + n1(b.x) + '"/>'); }
      }
      var from = tk[last], by = g.tTop - (g.ph ? 12 : 16), outY = g.ph ? g.lake.surf - 26 : g.pipeY;
      var outPath = last < 4 ? 'M' + n1(from.x + from.w * 0.5) + ' ' + n1(from.y) + ' V' + n1(by) + ' H' + n1(g.outX) + ' V' + n1(outY) : 'M' + n1(from.x + from.w) + ' ' + n1(g.pipeY) + ' H' + n1(g.outX) + ' V' + n1(outY);
      out.push('<path class="wp2-pipe is-sew' + (last < 4 ? ' is-bypass' : '') + '" d="' + outPath + '"/>');
      out.push('<path class="wp2-flowp" d="' + outPath + '" stroke-dashoffset="' + n1(-t * 24) + '"/>');
      if(last < 4) out.push('<text class="wp2-tk wp2-bylab" x="' + n1((from.x + from.w * 0.5 + g.outX) / 2) + '" y="' + n1(by - 6) + '" text-anchor="middle">' + (last ? 'skips the rest' : 'skips the plant') + '</text>');
      // the river from the outfall into the lake below
      var L = g.lake, rv = g.ph ? 'M' + n1(g.outX) + ' ' + n1(outY) + ' V' + n1(L.surf + 3)
        : 'M' + n1(g.outX) + ' ' + n1(outY) + ' V' + n1(L.surf - 8) + ' C' + n1(g.outX) + ' ' + n1(L.surf) + ' ' + n1(L.x0) + ' ' + n1(L.surf) + ' ' + n1(L.x0 + 30) + ' ' + n1(L.surf + 3);
      var nut = W.SEWAGE.stages[last].left.nutrients / 100;
      out.push('<path d="' + rv + '" fill="none" stroke="' + mix(P0.top, P0.murky, nut * 0.5) + '" stroke-width="' + (g.ph ? 7 : 9) + '" stroke-linecap="round"/>');
      out.push('<path d="' + rv + '" fill="none" stroke="' + P0.nut + '" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="2 9" stroke-dashoffset="' + n1(-t * 24) + '" opacity="' + clamp(nut * 1.4, 0, 1).toFixed(2) + '"/>');
      var lk = lakeDyn(L, sew, S.sday, t, P0, 'wpLk3', 's3', 3);
      out.push(lk.svg);
      var ph = phase(sew, S.sday), o = ph.o, st = status(o), cxL = L.x0 + (L.x1 - L.x0) * (g.ph ? 0.32 : 0.24), byL = bedY(L, cxL + 30);
      var pv = prevOn(), was = instOn() && pv && pv.run && fO(pv.run.min) !== fO(o) ? 'was ' + fO(pv.run.min) : '';
      out.push(chip(cxL, byL - (g.ph ? 56 : 62) - (was ? 7 : 0), 'Oxygen', fO(o) + ' mg/L', st.tone, g.ph, [cxL + 30, byL - 8], st.status, 'fish need 5+', was));
      if(S.sday > 0 && ph.cur === 5 && o < W.HYPOXIC) out.push(callout(L.x0 + (L.x1 - L.x0) * (g.ph ? 0.5 : 0.66), L.surf + (L.bed - L.surf) * (g.ph ? 0.14 : 0.24), 'Dead zone', 'bad', 'middle', true));
      return out.join('');
    }

    /* ======================================================= the graph (shares the cursor with the scene) */
    function graph(){
      if(!GG) return;
      var Wg = GG.W, Hg = GG.H, ph = Wg < 560, L = ph ? 30 : 40, R = Wg - (ph ? 12 : 18), top = 28, bot = Hg - 26, out = [];
      function ln(x1, y1, x2, y2, cls){ return '<line class="' + cls + '" x1="' + n1(x1) + '" y1="' + n1(y1) + '" x2="' + n1(x2) + '" y2="' + n1(y2) + '"/>'; }
      function tx(x, y, s, cls, a){ return '<text class="' + cls + '" x="' + n1(x) + '" y="' + n1(y) + '"' + (a ? ' text-anchor="' + a + '"' : '') + '>' + s + '</text>'; }
      if(S.ch !== 'heat'){
        /* One axis, oxygen (0 to 12 mg/L for every run). The algae are a faint shape with no scale, so the lag between
           the bloom and the oxygen low shows. Explore draws the whole run (faint after the day); a question shows only
           the days already played, so it never gives an answer away. */
        var r = rNow(), cur = S.ch === 'sew' ? S.sday : S.day, seen = S.ch === 'sew' ? S.sseen : S.seen, upto = inQuiz() ? Math.min(seen, W.LAKE_DAYS) : W.LAKE_DAYS;
        var yMax = Y_MAX, x = function(d){ return L + d / W.LAKE_DAYS * (R - L); }, y = function(v){ return bot - clamp(v, 0, yMax) / yMax * (bot - top); };
        var aMax = Math.max(r.peakA, r.A[0] * 4), ya = function(v){ return bot - clamp(v / aMax, 0, 1) * (bot - top) * 0.6; };
        out.push('<rect class="wp2-g-hyp" x="' + n1(L) + '" y="' + n1(y(2)) + '" width="' + n1(R - L) + '" height="' + n1(bot - y(2)) + '"/>');
        for(var v = 0; v <= yMax; v += 4) out.push(ln(L, y(v), R, y(v), 'wp2-g-grid') + tx(L - 6, y(v) + 4, v, 'wp2-g-tk', 'end'));
        for(var dd = 0; dd <= 60; dd += 20) out.push(tx(x(dd), bot + 16, dd === 60 ? '60 days' : dd, 'wp2-g-tk', dd === 60 ? 'end' : 'middle'));
        var n = Math.floor(upto), ap = [], op = [], of = [];
        for(var i = 0; i <= n; i++){ ap.push(n1(x(i)) + ',' + n1(ya(r.A[i]))); }
        if(upto > n){ ap.push(n1(x(upto)) + ',' + n1(ya(at(r.A, upto)))); }
        if(upto > 0) out.push('<polygon class="wp2-g-alg" points="' + n1(x(0)) + ',' + n1(bot) + ' ' + ap.join(' ') + ' ' + n1(x(upto)) + ',' + n1(bot) + '"/>');
        // Explore: the setting before the last change stays as a faint line with a tiny label, to compare
        var iv = instOn(), ex = expl(), pv = prevOn(), cd = Math.min(cur, upto), solidTo = iv ? W.LAKE_DAYS : cd;
        if(ex && pv && pv.run){
          var pr = pv.run, pp = pr.O.map(function(v2, i2){ return n1(x(i2)) + ',' + n1(y(v2)); }), pd = 30, gap = 0;
          // its label sits where the two curves are furthest apart, on the side away from the current one
          for(var i3 = 3; i3 <= 54; i3++){ var g3 = Math.abs(pr.O[i3] - r.O[i3]); if(g3 > gap + 1e-9){ gap = g3; pd = i3; } }
          var up2 = pr.O[pd] >= r.O[pd], py = y(pr.O[pd]) + (up2 ? -9 : 16);
          out.push('<polyline class="wp2-g-prev" points="' + pp.join(' ') + '"/>');
          out.push(tx(clamp(x(pd), L + 50, R - 50), clamp(py, top + 10, bot - 10), prevLabel(pv), 'wp2-g-prevt', 'middle'));
        }
        // oxygen: the whole curve in the instant view; in the time view solid up to the day, faint after it
        for(var j = 0; j <= Math.floor(solidTo); j++) op.push(n1(x(j)) + ',' + n1(y(r.O[j])));
        if(solidTo > Math.floor(solidTo)) op.push(n1(x(solidTo)) + ',' + n1(y(at(r.O, solidTo))));
        of.push(n1(x(cd)) + ',' + n1(y(at(r.O, cd))));
        for(var k = Math.floor(cd) + 1; k <= n; k++) of.push(n1(x(k)) + ',' + n1(y(r.O[k])));
        if(!iv && upto > cd + 1e-9 && of.length > 1) out.push('<polyline class="wp2-g-do is-fut' + (ex ? ' is-ghost' : '') + '" points="' + of.join(' ') + '"/>');
        if(op.length > 1) out.push('<polyline class="wp2-g-do" points="' + op.join(' ') + '"/>');
        // the dead zone (below 2 mg/L): that part of the curve in red, and a red bar along the days it lasts
        if(ex){
          var i0 = -1;
          for(var q2 = 0; q2 <= W.LAKE_DAYS + 1; q2++){
            var low = q2 <= W.LAKE_DAYS && r.O[q2] < W.HYPOXIC;
            if(low && i0 < 0) i0 = q2;
            if(!low && i0 >= 0){
              var i1 = q2 - 1, xs0 = i0 > 0 ? i0 - 1 + (r.O[i0 - 1] - 2) / ((r.O[i0 - 1] - r.O[i0]) || 1) : 0, xe0 = i1 < W.LAKE_DAYS ? i1 + (2 - r.O[i1]) / ((r.O[i1 + 1] - r.O[i1]) || 1) : W.LAKE_DAYS, xe1 = Math.min(xe0, solidTo);
              if(xe1 > xs0){
                var dz = [n1(x(xs0)) + ',' + n1(y(2))];
                for(var q3 = i0; q3 <= i1 && q3 <= xe1; q3++) dz.push(n1(x(q3)) + ',' + n1(y(r.O[q3])));
                dz.push(n1(x(xe1)) + ',' + n1(y(xe1 < xe0 ? at(r.O, xe1) : 2)));
                out.push('<polyline class="wp2-g-do is-dz" points="' + dz.join(' ') + '"/>');
                out.push('<rect class="wp2-g-dzbar" x="' + n1(x(xs0)) + '" y="' + n1(bot - 7) + '" width="' + n1(Math.max(2, x(xe1) - x(xs0))) + '" height="7" rx="2"/>');
              }
              i0 = -1;
            }
          }
        }
        if(inQuiz() && seen < W.LAKE_DAYS) out.push('<rect class="wp2-g-fog" x="' + n1(x(Math.max(seen, 0)) + 1) + '" y="' + n1(top) + '" width="' + n1(Math.max(0, R - x(Math.max(seen, 0)) - 1)) + '" height="' + n1(bot - top) + '"/>');
        var hypY = y(2);
        out.push(tx(R - 4, hypY - 5, ex ? 'dead zone' : '2 mg/L: dead zone', 'wp2-g-hypt', 'end'));
        out.push(ln(L, bot, R, bot, 'wp2-g-axis') + ln(L, top, L, bot, 'wp2-g-axis'));
        out.push('<circle class="wp2-g-dot' + (ex && at(r.O, cd) < W.HYPOXIC ? ' is-dz' : '') + '" cx="' + n1(x(cd)) + '" cy="' + n1(y(at(r.O, cd))) + '" r="' + (ex ? 6 : 5) + '"/>');
        out.push(tx(L, 16, ex ? 'Oxygen (mg/L)' : (S.ch === 'sew' ? 'Oxygen at the bottom of the lake below, day by day' : 'Oxygen at the bottom of the lake, day by day'), 'wp2-g-ax is-oxy'));
        scrub.place([L, top, R, bot], 0, W.LAKE_DAYS); scrub.value(Math.round(cur));
        gsvg.setAttribute('aria-label', (S.ch === 'sew' ? 'Lake below the plant: ' : '') + 'bottom-water oxygen over 60 days on a 0 to 12 mg/L scale, with the algae as a faint shape and a line at 2 mg/L. ' +
          (upto > 0 ? 'Lowest ' + F(Math.min.apply(null, r.O.slice(0, Math.floor(upto) + 1))) + ' mg/L.' : 'Not played yet.'));
      } else {
        var h = heatPts(), xs = function(t){ return L + t / 35 * (R - L); }, ys = function(v){ return bot - v / 16 * (bot - top); };
        for(var a = 0; a <= 16; a += 4) out.push(ln(L, ys(a), R, ys(a), 'wp2-g-grid') + tx(L - 6, ys(a) + 4, a, 'wp2-g-tk', 'end'));
        for(var b = 0; b <= 35; b += 5) out.push(tx(xs(b), bot + 16, b === 35 ? '35 °C' : b, 'wp2-g-tk', b === 35 ? 'end' : 'middle'));
        var exh = expl(), pvh = prevOn();
        out.push(ln(L, ys(TROUT), R, ys(TROUT), 'wp2-g-trout') + tx(R - 4, ys(TROUT) - 6, exh ? 'trout need ' + TROUT : 'Young trout need ' + TROUT + ' mg/L', 'wp2-g-troutt', 'end'));
        out.push('<polyline class="wp2-g-osat" points="' + W.OSAT.map(function(q){ return n1(xs(q[0])) + ',' + n1(ys(q[1])); }).join(' ') + '"/>');
        out.push(ln(L, bot, R, bot, 'wp2-g-axis') + ln(L, top, L, bot, 'wp2-g-axis'));
        if(exh && pvh && pvh.warm != null && pvh.up === S.up && pvh.warm > 0){
          var pt = pvh.up + pvh.warm, pdv = r1(W.osat(pt));
          out.push('<circle class="wp2-g-pv" cx="' + n1(xs(pt)) + '" cy="' + n1(ys(pdv)) + '" r="5.5"/>' + tx(xs(pt) - 8, ys(pdv) + 17, prevLabel(pvh), 'wp2-g-prevt', 'end'));
        }
        out.push('<circle class="wp2-g-up" cx="' + n1(xs(h.t0)) + '" cy="' + n1(ys(h.d0)) + '" r="6"/>');
        out.push(tx(xs(h.t0) + 9, ys(h.d0) - 11, 'Upstream ' + F(h.d0), 'wp2-g-val is-oxy', 'start'));
        if(S.warm > 0){
          out.push('<circle class="wp2-g-dn' + (h.d1 < TROUT ? ' is-bad' : '') + '" cx="' + n1(xs(h.t1)) + '" cy="' + n1(ys(h.d1)) + '" r="6"/>');
          out.push(tx(xs(h.t1) + (xs(h.t1) > R - 130 ? -10 : 12), ys(h.d1) + 22, 'Downstream ' + F(h.d1), 'wp2-g-val is-heat', xs(h.t1) > R - 130 ? 'end' : 'start'));
        }
        out.push(tx(L, 16, exh ? 'Oxygen the river can hold (mg/L)' : 'Most oxygen the river can hold, by temperature', 'wp2-g-ax is-oxy'));
        scrub.place([xs(h.t0), top, xs(h.t0 + 15), bot], h.t0, h.t0 + 15);
        scrub.value(h.t1);
        gsvg.setAttribute('aria-label', 'Saturation curve: the most oxygen fresh water can hold against temperature (USGS). Upstream ' + h.t0 + ' °C, ' + F(h.d0) + ' mg/L; downstream ' + h.t1 + ' °C, ' + F(h.d1) + ' mg/L. Young trout need ' + TROUT + ' mg/L.');
      }
      gsvg.innerHTML = out.join('');
    }

    /* ======================================================= "?": how it works, sources, tables, settings */
    function refHtml(){
      var c = S.ch, h = '';
      var src = '<h3 class="ls-title-l">Sources</h3><ul class="wp2-src">' +
        '<li>Oxygen fresh water can hold at each temperature: USGS dissolved oxygen solubility tables, sea level, rounded to 0.1 mg/L.</li>' +
        '<li>Below 2 mg/L the water is hypoxic, a dead zone: USGS, “Dissolved oxygen and water” (citing CENR 2000).</li>' +
        '<li>About 5 mg/L or more for most aquatic animals to thrive (the “Healthy” line): Chesapeake Bay Program, “Dissolved oxygen”.</li>' +
        (c !== 'fert' ? '<li>Young trout need 9.5 mg/L: EPA freshwater criteria for coldwater fish, early life stages, 7 day mean (EPA 1986; EPA factsheet on dissolved oxygen, 2021). Adult trout: 6.5 mg/L, 30 day mean.</li>' : '') +
        (c === 'sew' ? '<li>What each treatment stage leaves: typical rounded values from EPA, “How wastewater treatment plants work”. Real plants vary.</li>' +
          '<li>Organic matter (BOD) uses oxygen as bacteria break it down: USGS, “Biological oxygen demand (BOD) and water”; EPA, “Indicators: dissolved oxygen”.</li>' : '') + '</ul>';
      if(c === 'fert'){
        var rows = [0, 5, 10, 15, 20, 30, 40, 50, 60].map(function(d){ return '<tr' + (Math.round(S.day) === d ? ' class="hl"' : '') + '><th scope="row">' + d + '</th><td class="r">' + F(run.N[d], 2) + '</td><td class="r">' + F(run.A[d] / run.A[0]) + '×</td><td class="r">' + F(run.D[d]) + '</td><td class="r">' + F(run.O[d]) + '</td></tr>'; }).join('');
        h = '<p>A small model of one lake after one storm washes fertilizer in, solved day by day: nutrients feed algae; algae that run out of nutrients die and sink; aerobic decomposers break the dead algae down and use oxygen; oxygen from the air mixes back in toward the most the water can hold. It shows the order and the shape of the chain. It is a teaching model, not a forecast for a real lake.</p>' +
          '<h3 class="ls-title-l">The chain</h3><ol class="wp2-chain">' + STEPS.map(function(s, i){ return '<li><b>' + esc(s.name) + '.</b> ' + esc(STEP_LONG[i]) + '</li>'; }).join('') + '</ol>' +
          '<p><b>Why the oxygen falls late.</b> Living algae make oxygen by day. Most of the drop comes after they die, when bacteria decompose them on the bottom, and the bottom water mixes little with the air. A dense bloom also uses some oxygen at night (it respires in the dark), which can cause night time dips; this model leaves that out and counts the decomposers, which use most of it.</p>' +
          '<p><b>Warm lakes suffer more.</b> At ' + S.tLake + ' °C water holds at most ' + F(run.osat) + ' mg/L, and decomposers work faster when it is warm.</p>' +
          '<p><b>Do not mix up.</b> Fertilizers (nitrate, phosphate) cause eutrophication; pesticides are a different pollutant. Thermal pollution is heat (chapter 2).</p>' +
          '<h3 class="ls-title-l">The lake, day by day</h3><p class="bt-small">' + sk(S.sacks) + ', lake at ' + S.tLake + ' °C. Nutrients and dead algae in relative units; algae as times its day 0 amount; oxygen in mg/L.</p>' +
          '<div class="table-wrap" tabindex="0" role="region" aria-label="Lake model by day"><table class="ls-tbl"><thead><tr><th scope="col">Day</th><th scope="col">Nutrients</th><th scope="col">Algae</th><th scope="col">Dead algae</th><th scope="col">Bottom oxygen</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '<p class="bt-small">Lowest bottom oxygen ' + F(run.min) + ' mg/L on day ' + run.minDay + '. Days below 2 mg/L: ' + run.hypoxicDays + '.</p>' + src;
      } else if(c === 'heat'){
        var hp = heatPts();
        h = '<p><b>Heat, not chemicals.</b> A power plant takes in river water to cool its machines and returns it warmer. Nothing else is added.</p>' +
          '<p><b>Warm water holds less gas.</b> The curve is the most oxygen fresh water can hold at each temperature (saturation). Real rivers often hold less than that, never more.</p>' +
          '<p><b>Fish are hit twice.</b> Fish are ectotherms: warm water speeds up their metabolism, so they need more oxygen just as the water holds less. Some species cannot survive above a temperature (thermal shock).</p>' +
          '<p><b>What trout need, and what the water can hold.</b> Young trout need at least ' + TROUT + ' mg/L of dissolved oxygen. Above about 18 °C, the river cannot hold that much even when it is full of oxygen, so trout cannot breed there. (The tool reads the curve to 0.1 mg/L.)</p>' +
          '<h3 class="ls-title-l wp2-set-h">Settings</h3>' +
          '<h3 class="ls-title-l">Oxygen fresh water can hold (USGS, sea level)</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Oxygen saturation by temperature"><table class="ls-tbl"><thead><tr><th scope="col">Temperature</th><th scope="col">Most it can hold</th></tr></thead><tbody>' +
          W.OSAT.map(function(p){ return '<tr><th scope="row">' + p[0] + ' °C</th><td class="r">' + F(p[1]) + ' mg/L</td></tr>'; }).join('') + '</tbody></table></div>' +
          '<p class="bt-small">Between rows the tool reads the curve by straight lines. ' + hp.t0 + ' °C to ' + hp.t1 + ' °C: (' + F(hp.d1) + ' − ' + F(hp.d0) + ') / ' + F(hp.d0) + ' × 100 = ' + T.F(M.Calc().percentChange(hp.d0, hp.d1), 1) + '%.</p>' + src;
      } else {
        h = '<p><b>Why treat sewage?</b> Raw sewage carries solids, organic matter (bacteria use oxygen as they break it down, which is what BOD, biochemical oxygen demand, measures), nitrogen and phosphorus that feed algae, and pathogens.</p>' +
          '<h3 class="ls-title-l">The stages</h3><ol class="wp2-stages">' + W.SEWAGE.stages.slice(1).map(function(s){ return '<li><b>' + esc(s.name) + '.</b> ' + esc(s.how) + '</li>'; }).join('') + '</ol>' +
          '<p><b>Each stage removes a share of what is left,</b> so percentages multiply.</p>' +
          '<h3 class="ls-title-l">The lake below</h3><ul class="wp2-src">' +
            '<li>It runs the chapter 1 lake model at ' + SEW_T + ' °C, the same chain, played the same way.</li>' +
            '<li><b>Nitrogen and phosphorus</b> left after the last stage are scaled so raw sewage counts as the heaviest fertilizer level (5 sacks): ' + W.SEWAGE.stages.map(function(s, i){ return esc(SEW_NAMES[i].toLowerCase()) + ' ' + s.left.nutrients + '%, level ' + F(SEW_LEVEL(i), 2); }).join('; ') + '.</li>' +
            '<li><b>Organic matter (BOD)</b> left goes in on day 0 as dead organic matter for the decomposers, ' + W.BOD_D + ' relative units for raw sewage: ' + W.SEWAGE.stages.map(function(s, i){ return esc(SEW_NAMES[i].toLowerCase()) + ' ' + s.left.bod + '%'; }).join(', ') + '. Bacteria start using oxygen at once, so raw and primary effluent pull the oxygen down within days, before any bloom; secondary removes most of it.</li>' +
            '<li>These scalings are teaching choices, not measurements: the order of the stages and the shape of the result are what to take away.</li></ul>' +
          '<h3 class="ls-title-l">Share of the raw load still in the water</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Sewage treatment by stage"><table class="ls-tbl"><thead><tr><th scope="col">After</th>' + W.SEWAGE.parts.map(function(p){ return '<th scope="col">' + esc(p.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          W.SEWAGE.stages.map(function(s, i){ return '<tr' + (i === S.stage ? ' class="hl"' : '') + '><th scope="row">' + esc(s.name) + '</th>' + W.SEWAGE.parts.map(function(p){ return '<td class="r">' + (s.left[p.k] < 1 ? s.left[p.k] : Math.round(s.left[p.k])) + '%</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' + src;
      }
      ref.innerHTML = '<p class="wp2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use this chapter, step by step.</p>' + h;
      if(c === 'heat'){ var hs = ref.querySelector('.wp2-set-h'); if(hs) hs.parentNode.insertBefore(setBox, hs.nextSibling); }
      else if(setBox.parentNode) setBox.parentNode.removeChild(setBox);
    }

    /* ======================================================= placing it in the studio */
    function speedItem(){ return { icon: 'sliders', label: fast ? 'Play at normal speed' : 'Play twice as fast', onClick: function(){ fast = !fast; player.rate(fast ? 2 : 1); if(LS) LS.menu({ items: [speedItem()] }); } }; }
    function studio(pane, s){
      LS = s;
      K.on(s);
      // Explore: the stage alone, full width (no side panel). Test yourself's questions use the same stage and "?".
      s.add('stage', stage, { mode: 'explore' });
      s.add('details', ref, { mode: 'explore' });
      stage.setAttribute('data-ls-only', 'explore quiz'); ref.setAttribute('data-ls-only', 'explore quiz');
      var ab = pane.querySelector('details.tool-about, .tool-about'); if(ab) s.add('about', ab, { mode: 'explore' });
      s.menu({ items: [speedItem()] });
      s.mode(s.mode());
      syncCh(); layoutNow();
      if(window.ResizeObserver){ var tm = null, re = function(){ clearTimeout(tm); tm = setTimeout(layoutNow, 50); }; new ResizeObserver(re).observe(sceneBox); new ResizeObserver(re).observe(graphBox); }
      try{ new MutationObserver(function(){ layoutNow(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
      loop(true);
      startTour(false);
    }
    syncCh(); words(); refHtml();
    return {
      studio: studio, quiz: quiz,
      shown: function(m){
        S.mode = m; player.stop();
        player.labels(m === 'explore' ? { play: 'Watch it happen', again: 'Watch again' } : { play: 'Play', again: 'Replay' });
        player.el.classList.toggle('is-sm', m === 'explore');
        if(m === 'explore'){ if(QZ) QZ.leave(); visible = true; prev = null; gest = null; S.inst = true; run = lakeRun(S.sacks, S.tLake); pin(); syncCh(); if(LS) startTour(false); }
        else { stopTours(); hideCue(false); tease.hidden = true; visible = !!(QZ && QZ.scene()); if(QZ) QZ.enter(); }
        loop(visible); if(visible) setTimeout(layoutNow, 30);
      }
    };
  }
  /* ------------------------------------------------------ test yourself: the practice problems (the drill) */
  function drill(host, data, pre){
    return T.drill(host, data, { slug: 'water-pollution', noun: 'drill', pickerPre: pre,
      generate: function(r, ctx, type){ return W.generate(r, ctx, type); },
      types: [{ value: 'chain', label: 'Read the oxygen graph' }, { value: 'dochange', label: 'Percent change in oxygen' }, { value: 'thermal', label: 'Thermal pollution' }, { value: 'sewage', label: 'Sewage treatment' }, { value: 'load', label: 'Nutrient load' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { chain: 'The eutrophication chain', dochange: 'Percent change in dissolved oxygen', thermal: 'Thermal pollution', sewage: 'Sewage treatment', load: 'A nitrate load' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; api.st.try = null; figure(api.fig, api.problem, api.st); },
      // a wrong reading is drawn on the graph as a red line at the student's value
      onTry: function(s, att, api){ api.st.try = { key: s.key, v: att.value }; figure(api.fig, api.problem, api.st); },
      refit: function(api){ figure(api.fig, api.problem, api.st); }
    });
  }
  /* The student's wrong reading: a dashed red line across the graph. */
  function tryLine(L, R, y, text){
    return '<line class="wp-try" x1="' + L + '" x2="' + R + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text class="wp-try-t" x="' + (R - 4) + '" y="' + (y - 6).toFixed(1) + '" text-anchor="end">' + esc(text) + '</text>';
  }
  /* The drill's figure, drawn from the problem's own numbers in the Explore's style (the same graph, the same tanks,
     sacks, field and river); a value is written on it only once its step is answered, so it never gives a key away. */
  function figure(el, p, st){
    st = st || {};
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, Wd = phone ? 340 : 600, H = T.figSize(Wd, phone ? 280 : 300, { max: g.kind === 'load' ? 0.5 : 0.72 })[1], out = [], label = '';
    var P0 = PAL[document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'];
    var L = 40, R = Wd - 14, top = 34, bot = H - 40;
    function ln(x1, y1, x2, y2, cls){ return '<line class="' + cls + '" x1="' + n1(x1) + '" y1="' + n1(y1) + '" x2="' + n1(x2) + '" y2="' + n1(y2) + '"/>'; }
    function tx(x, y, t, cls, an){ return '<text class="' + cls + '" x="' + n1(x) + '" y="' + n1(y) + '"' + (an ? ' text-anchor="' + an + '"' : '') + '>' + t + '</text>'; }
    if(g.kind === 'lake'){
      // the Explore's lake graph: oxygen 0 to 12 mg/L, algae as times its day 0 amount on the right
      R = Wd - 40;
      var yMax = Math.max(12, Math.ceil(g.osat + 1)), A0 = g.algae[0][1] || 1, aMax = 160, x = function(d){ return L + d / 60 * (R - L); }, y = function(v){ return bot - v / yMax * (bot - top); }, ya = function(v){ return bot - Math.min(v / A0, aMax) / aMax * (bot - top); };
      out.push('<rect class="wp2-g-hyp" x="' + L + '" y="' + n1(y(2)) + '" width="' + (R - L) + '" height="' + n1(bot - y(2)) + '"/>');
      for(var v = 0; v <= yMax; v += 2) out.push(ln(L, y(v), R, y(v), 'wp2-g-grid') + tx(L - 6, y(v) + 4, v, 'wp2-g-tk', 'end'));
      for(var av = 0; av < aMax; av += 40) out.push(tx(R + 6, bot - av / aMax * (bot - top) + 4, av, 'wp2-g-tk is-alg', 'start'));
      [0, 10, 20, 30, 40, 50, 60].forEach(function(d){ out.push(tx(x(d), bot + 15, d, 'wp2-g-tk', 'middle')); });
      out.push('<polygon class="wp2-g-alg" points="' + L + ',' + bot + ' ' + g.algae.map(function(q){ return n1(x(q[0])) + ',' + n1(ya(q[1])); }).join(' ') + ' ' + R + ',' + bot + '"/>');
      out.push('<polyline class="wp2-g-algl" points="' + g.algae.map(function(q){ return n1(x(q[0])) + ',' + n1(ya(q[1])); }).join(' ') + '"/>');
      out.push(ln(L, y(g.osat), R, y(g.osat), 'wp2-g-sat') + tx(R - 4, y(g.osat) - 5, 'Most it can hold: ' + F(g.osat), 'wp2-g-satt', 'end'));
      out.push('<polyline class="wp2-g-do" points="' + g.series.map(function(q){ return n1(x(q[0])) + ',' + n1(y(q[1])); }).join(' ') + '"/>');
      out.push(tx(R - 4, y(2) - 5, '2 mg/L: dead zone below', 'wp2-g-hypt', 'end'));
      if(st.try && st.try.key === 'lowest' && isFinite(st.try.v) && st.try.v >= 0 && st.try.v <= yMax) out.push(tryLine(L, R, y(st.try.v), 'Yours: ' + F(st.try.v) + ' mg/L'));
      out.push(ln(L, bot, R, bot, 'wp2-g-axis') + ln(L, top, L, bot, 'wp2-g-axis') + ln(R, top, R, bot, 'wp2-g-axis is-alg'));
      out.push(tx(L, top - 14, 'Bottom oxygen (mg/L)', 'wp2-g-ax is-oxy') + tx(Wd - 4, top - 14, 'Algae, × day 0', 'wp2-g-ax is-alg', 'end') + tx(R, bot + 30, 'Day', 'wp2-g-ax', 'end'));
      label = 'Graph of bottom-water dissolved oxygen over 60 days at ' + g.T + ' °C, with the algae shaded behind it (times its day 0 amount, right axis) and a line at 2 mg/L. Values every 10 days: ' + g.series.filter(function(q){ return q[0] % 10 === 0; }).map(function(q){ return 'day ' + q[0] + ' ' + F(q[1]) + ' mg/L'; }).join(', ') + '.';
    } else if(g.kind === 'bars'){
      var yM = 12, yy = function(v){ return bot - v / yM * (bot - top); }, bw = (R - L) / 2;
      out.push('<rect class="wp2-g-hyp" x="' + L + '" y="' + n1(yy(2)) + '" width="' + (R - L) + '" height="' + n1(bot - yy(2)) + '"/>');
      for(var t = 0; t <= yM; t += 2) out.push(ln(L, yy(t), R, yy(t), 'wp2-g-grid') + tx(L - 6, yy(t) + 4, t, 'wp2-g-tk', 'end'));
      [g.before, g.after].forEach(function(v, i){ var bx = L + i * bw + bw * 0.25, ww = bw * 0.5, low = v < 2;
        out.push('<rect class="wp2-gbar-f' + (low ? ' is-low' : '') + '" x="' + n1(bx) + '" y="' + n1(yy(v)) + '" width="' + n1(ww) + '" height="' + n1(bot - yy(v)) + '" rx="6"/>' + tx(bx + ww / 2, yy(v) - 7, F(v) + ' mg/L', 'wp2-g-val' + (low ? ' is-bad' : ''), 'middle') + tx(bx + ww / 2, bot + 16, esc(g.labels[i]), 'wp2-g-tk', 'middle')); });
      out.push(tx(L, bot + 33, 'Shaded: a dead zone, below 2 mg/L', 'wp2-g-hypt', 'start'));
      out.push(ln(L, bot, R, bot, 'wp2-g-axis') + ln(L, top, L, bot, 'wp2-g-axis') + tx(L, top - 14, 'Bottom oxygen (mg/L)', 'wp2-g-ax is-oxy'));
      label = 'Bar graph of bottom-water oxygen: ' + esc(g.labels[0]) + ' ' + F(g.before) + ' mg/L, ' + esc(g.labels[1]) + ' ' + F(g.after) + ' mg/L, with the hypoxic zone below 2 mg/L shaded.';
    } else if(g.kind === 'osat'){
      // the Explore's saturation curve, with the two temperatures marked (values appear only as the table is read)
      var xs = function(t){ return L + t / 35 * (R - L); }, ys = function(v){ return bot - v / 16 * (bot - top); };
      for(var a = 0; a <= 16; a += 4) out.push(ln(L, ys(a), R, ys(a), 'wp2-g-grid') + tx(L - 6, ys(a) + 4, a, 'wp2-g-tk', 'end'));
      for(var bb = 0; bb <= 35; bb += 5) out.push(tx(xs(bb), bot + 15, bb, 'wp2-g-tk', 'middle'));
      out.push('<rect class="wp2-g-band" x="' + n1(xs(g.t0)) + '" y="' + top + '" width="' + n1(xs(g.t1) - xs(g.t0)) + '" height="' + (bot - top) + '"/>');
      out.push('<polyline class="wp2-g-osat" points="' + W.OSAT.map(function(q){ return n1(xs(q[0])) + ',' + n1(ys(q[1])); }).join(' ') + '"/>');
      W.OSAT.forEach(function(q){ var last = q[0] >= 35; out.push('<circle class="wp2-g-pt" cx="' + n1(xs(q[0])) + '" cy="' + n1(ys(q[1])) + '" r="3.4"/>' + tx(xs(q[0]) + (last ? -5 : 5), ys(q[1]) - 8, F(q[1]), 'wp2-g-tk', last ? 'end' : null)); });
      [g.t0, g.t1].forEach(function(t, i){ out.push('<line class="wp-guide ' + (i ? 'is-warm' : '') + '" x1="' + n1(xs(t)) + '" x2="' + n1(xs(t)) + '" y1="' + top + '" y2="' + bot + '"/>' + tx(xs(t), top - 4, t + ' °C', 'wp2-g-val ' + (i ? 'is-heat' : 'is-oxy'), 'middle')); });
      if(st.try && st.try.key === 'read' && isFinite(st.try.v) && st.try.v >= 0 && st.try.v <= 16) out.push(tryLine(L, R, ys(st.try.v), 'Yours: ' + F(st.try.v) + ' mg/L'));
      out.push(ln(L, bot, R, bot, 'wp2-g-axis') + ln(L, top, L, bot, 'wp2-g-axis') + tx(L, top - 18, 'Most oxygen fresh water can hold (mg/L), USGS', 'wp2-g-ax is-oxy') + tx(R, bot + 30, 'Temperature (°C)', 'wp2-g-ax', 'end'));
      label = 'Oxygen saturation of fresh water against temperature, USGS: ' + W.OSAT.map(function(q){ return q[0] + ' °C ' + F(q[1]) + ' mg/L'; }).join(', ') + '. Dashed lines at ' + g.t0 + ' and ' + g.t1 + ' °C.';
    } else if(g.kind === 'plant'){
      // the Explore's tanks: raw inflow, primary, secondary, each named, with the BOD under it once worked out
      var names = ['Raw sewage', 'Primary', 'Secondary'], vals = [g.bod, st.after1 ? g.a1 : null, st.after2a ? g.a2 : null], gap = phone ? 26 : 56, tw = (Wd - 28 - 2 * gap) / 3, ty = top + 4, th = Math.min(H - ty - 60, tw * 1.05);
      names.forEach(function(nm, i){
        var x0 = 14 + i * (tw + gap), cx = x0 + tw / 2;
        out.push(tankArt0({ x: x0, y: ty, w: tw, h: th }, i, true, 0, P0, true, false).replace(/<text[^>]*>[^<]*<\/text>|<rect class="wp2-tpill[^>]*\/>/g, ''));
        out.push(tx(cx, ty + th + 18, nm, 'wp2-tname', 'middle'));
        out.push('<rect class="wp2-tpill" x="' + n1(cx - 58) + '" y="' + n1(ty + th + 26) + '" width="116" height="24" rx="12"/>' + tx(cx, ty + th + 43, vals[i] != null ? 'BOD ' + F(vals[i]) + ' mg/L' : 'BOD ?', 'wp2-tdoes' + (vals[i] == null ? ' is-q' : ''), 'middle'));
        if(i < 2){ var ax = x0 + tw, ay = ty + th * 0.3; out.push('<path class="wp2-pipe is-sew" d="M' + n1(ax) + ' ' + n1(ay) + ' h' + gap + '"/>' + tx(ax + gap / 2, ay - 10, '−' + (i ? g.p2 : g.p1) + '%', 'wp2-g-val is-bad', 'middle')); }
      });
      label = 'Treatment plant: raw sewage with BOD ' + g.bod + ' mg/L; primary removes ' + g.p1 + '%, secondary removes ' + g.p2 + '% of what is left.' + (st.after1 ? ' After primary ' + F(g.a1) + ' mg/L.' : '') + (st.after2a ? ' After secondary ' + F(g.a2) + ' mg/L.' : '');
    } else if(g.kind === 'load'){
      // the Explore's field (bags, crops, grass over soil) sloping down to the water it drains into (a creek, lake or
      // reservoir, by context), the runoff between; its label names the flow, not the kind of water
      var fieldY = top + 54, mid = Wd * 0.46, sx0 = mid + 10, sx1 = Wd - 10, sy = fieldY + 30, sb = sy + (H - sy) * 0.6;
      out.push('<defs><linearGradient id="wpLd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P0.sky0 + '"/><stop offset="1" stop-color="' + P0.sky1 + '"/></linearGradient>' +
        '<linearGradient id="wpLw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + mix(P0.top, P0.top, 0) + '"/><stop offset="1" stop-color="' + mix(P0.deep, P0.deep, 0) + '"/></linearGradient></defs>');
      out.push('<rect width="' + Wd + '" height="' + n1(sy + 4) + '" fill="url(#wpLd)"/>');
      // far bank and grass behind the stream
      out.push('<path fill="' + P0.near + '" d="M' + n1(mid) + ' ' + n1(sy - 6) + ' C' + n1(mid + 80) + ' ' + n1(sy - 18) + ' ' + n1(Wd - 80) + ' ' + n1(sy - 2) + ' ' + Wd + ' ' + n1(sy - 12) + ' V' + n1(sy + 4) + ' H' + n1(mid) + 'Z"/>');
      // soil and the field's slope down to the near bank
      var slope = 'M0 ' + fieldY + ' H' + n1(mid - 70) + ' C' + n1(mid - 36) + ' ' + fieldY + ' ' + n1(mid - 20) + ' ' + n1(sy) + ' ' + n1(sx0) + ' ' + n1(sy);
      out.push('<path fill="' + P0.soil + '" d="' + slope + ' V' + H + ' H0Z"/>');
      out.push('<path fill="none" stroke="' + P0.grass + '" stroke-width="6" stroke-linecap="round" d="' + slope + '"/>');
      for(var k2 = 1; k2 < 3; k2++){ var yk = fieldY + (H - fieldY) * k2 / 3; out.push('<path d="M0 ' + n1(yk) + ' C' + n1(mid * 0.3) + ' ' + n1(yk - 4) + ' ' + n1(mid * 0.6) + ' ' + n1(yk + 5) + ' ' + n1(mid - 30) + ' ' + n1(yk + 2) + '" fill="none" stroke="' + P0.soil2 + '" stroke-width="1.2" opacity=".5"/>'); }
      // the stream channel: banks, bed and water
      out.push('<path fill="' + P0.bed + '" d="M' + n1(sx0) + ' ' + n1(sy) + ' C' + n1(sx0 + 20) + ' ' + n1(sb) + ' ' + n1(sx0 + 40) + ' ' + n1(sb + 4) + ' ' + n1((sx0 + sx1) / 2) + ' ' + n1(sb + 4) + ' S' + n1(sx1 - 20) + ' ' + n1(sb) + ' ' + n1(sx1) + ' ' + n1(sy) + ' V' + H + ' H' + n1(sx0) + 'Z"/>');
      out.push('<path fill="url(#wpLw)" d="M' + n1(sx0 + 4) + ' ' + n1(sy + 4) + ' C' + n1(sx0 + 22) + ' ' + n1(sb - 4) + ' ' + n1(sx0 + 42) + ' ' + n1(sb - 2) + ' ' + n1((sx0 + sx1) / 2) + ' ' + n1(sb - 2) + ' S' + n1(sx1 - 22) + ' ' + n1(sb - 4) + ' ' + n1(sx1 - 4) + ' ' + n1(sy + 4) + 'Z"/>');
      out.push('<path class="wp2-surf" d="M' + n1(sx0 + 4) + ' ' + n1(sy + 4) + ' H' + n1(sx1 - 4) + '"/>');
      for(var fw = 0; fw < 4; fw++) out.push('<path class="wp2-flow" d="M' + n1(sx0 + 30 + fw * (sx1 - sx0 - 60) / 4) + ' ' + n1(sy + 18 + (fw % 2) * 14) + ' q12 -4 24 0 t24 0"/>');
      out.push('<path fill="none" stroke="' + P0.grass2 + '" stroke-width="4" stroke-linecap="round" d="M' + n1(sx1) + ' ' + n1(sy) + ' H' + Wd + '"/>');
      // the field: bags and crops, the runoff down the slope into the stream
      for(var c = 0; c < 3; c++) out.push(sack(24 + c * 34, fieldY - 1, 30, P0));
      for(var cr = 132; cr < mid - 76; cr += 13) out.push('<g class="wp2-crop"><path d="M' + cr + ' ' + (fieldY - 3) + ' V' + (fieldY - 20) + '"/><path d="M' + cr + ' ' + (fieldY - 10) + ' q-7 -3 -9 -10 M' + cr + ' ' + (fieldY - 14) + ' q7 -3 9 -10"/></g>');
      out.push('<path fill="none" stroke="' + P0.soil2 + '" stroke-width="5" stroke-linecap="round" opacity=".8" d="M' + n1(mid - 74) + ' ' + n1(fieldY + 1) + ' C' + n1(mid - 34) + ' ' + n1(fieldY + 3) + ' ' + n1(mid - 18) + ' ' + n1(sy + 1) + ' ' + n1(sx0 + 22) + ' ' + n1(sy + 8) + '"/>');
      out.push('<path fill="none" stroke="' + P0.nut + '" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="3 6" d="M' + n1(mid - 74) + ' ' + n1(fieldY + 1) + ' C' + n1(mid - 34) + ' ' + n1(fieldY + 3) + ' ' + n1(mid - 18) + ' ' + n1(sy + 1) + ' ' + n1(sx0 + 22) + ' ' + n1(sy + 8) + '"/>');
      out.push(tx(14, top + 2, g.conc + ' mg/L nitrate in the runoff', 'wp-lab wp-c-nut'));
      var lx = (sx0 + sx1) / 2;
      out.push(tx(lx, sy - 22, 'Water flowing in: ' + String(g.flow).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' L/day', 'wp-lab', 'middle'));
      if(st.load) out.push(tx(lx, sy + 34, M.fmt(g.load, 3) + ' kg nitrate/day', 'wp-tag wp-c-nut', 'middle'));
      if(st.reduce) out.push(tx(lx, sy + 56, 'with the fix: ' + M.fmt(g.after, 3) + ' kg/day', 'wp-tag wp-c-alg', 'middle'));
      label = 'Farm field with fertilizer sacks; runoff carrying ' + g.conc + ' mg/L nitrate down the slope into the water below; ' + g.flow + ' L of water flow in per day.' + (st.load ? ' Load ' + M.fmt(g.load, 3) + ' kg per day.' : '');
    }
    el.innerHTML = '<figure class="cd-fig wp-qfig wp2-qfig"><svg class="wp-svg" viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + out.join('') + '</svg></figure>';
  }
})();
