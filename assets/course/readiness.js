/* Readiness: how a student would score on the real exam today, from every answer they have given
   (docs/progress-profile.md, "Readiness model"). One model for every course; each course's dashboard adapter
   turns its own records into answers and calls estimate().

   WHY THIS SHAPE
   A percent right says little on its own: 70% on easy questions is not 70% on hard ones, one full exam is a
   small sample, and a domain the real exam weighs at 41% matters more than one it weighs at 7%. So:
   - each answer is scored against its question's difficulty (a 1PL / Rasch model, the family the real NREMT
     uses): P(right) = sigmoid(theta - b), b from live answer data when a question has 20+ answers
     (worker /qdiff), else from its written difficulty;
   - recent answers count more (half-life 30 days, never below a quarter), and repeats of one question count as
     at most 1.5 answers, so a memorised card does not look like ability;
   - each area (exam domain or unit) gets its own theta, pulled toward the student's overall theta when it has
     few answers, and the prediction is the exam blueprint's weighted sum of what each area would score on that
     area's questions;
   - the range is the 80% interval (theta +- 1.28 SE) carried through the same sum.
   Nobody has checked this against real results yet: the outcome question (worker /outcome) collects them.

   API
     LevlReady.estimate({ answers, bank, blueprint, live, now }) -> {
       value, lo, hi, n, areas: { <area>: { pct, lo, hi, n } }, overall: { theta, se } }
       answers   [{ id, area, right, total, t, diff }]  one per question: right and total count every try
       bank      { <area>: [diff, ...] }               the difficulty mix the real exam draws from
       blueprint { <area>: weight }                    shares of the real exam (any scale)
       live      { <id>: [n, right] }                  optional, from LevlReady.live(course)
     LevlReady.apBand(course, mcq, frq) -> { band, lo, hi, composite, cLo, cHi } | null
     LevlReady.live(course, cb)                        cached live difficulty (once a day)
     LevlReady.CUT                                     AP cutoffs and free-response shares */
(function(root){
  'use strict';
  var DAY = 86400000, HALF = 30, FLOOR = 0.25, REPEAT = 1.5, Z = 1.2816;
  // Expected share right for a typical student, by written difficulty (NREMT words, AP d 1-3).
  var P_DIFF = { easy: 0.82, medium: 0.68, hard: 0.52, expert: 0.4, 1: 0.82, 2: 0.68, 3: 0.52 };
  function sig(x){ return 1 / (1 + Math.exp(-x)); }
  function bOf(id, diff, live){
    var l = live && live[id];
    if(l && l[0] >= 20){ var p = (l[1] + 1) / (l[0] + 2); return -Math.log(p / (1 - p)); }
    var q = P_DIFF[diff] != null ? P_DIFF[diff] : P_DIFF.medium;
    return -Math.log(q / (1 - q));
  }
  // MAP theta for weighted binomial answers under a normal prior; Newton steps.
  function fit(items, mu, s0){
    var th = mu, se = s0;
    for(var it = 0; it < 30; it++){
      var g = -(th - mu) / (s0 * s0), h = -1 / (s0 * s0);
      for(var i = 0; i < items.length; i++){
        var a = items[i], p = sig(th - a.b);
        g += a.w * (a.y - a.n * p);
        h -= a.w * a.n * p * (1 - p);
      }
      var step = g / h;
      th -= Math.max(-1.5, Math.min(1.5, step));
      se = Math.sqrt(-1 / h);
      if(Math.abs(step) < 1e-5) break;
    }
    return { theta: th, se: se };
  }
  function meanOver(bs, th){
    if(!bs.length) return sig(th - bOf(null, 'medium'));
    var s = 0; for(var i = 0; i < bs.length; i++) s += sig(th - bs[i]); return s / bs.length;
  }

  function estimate(o){
    var now = o.now || Date.now(), live = o.live || null, bp = o.blueprint || {}, bank = o.bank || {};
    var all = [], byArea = {}, nAns = 0;
    (o.answers || []).forEach(function(a){
      if(!a || !a.total) return;
      var nEff = Math.min(a.total, REPEAT), y = (a.right / a.total) * nEff;
      var age = a.t ? Math.max(0, (now - a.t) / DAY) : 0;
      var w = Math.max(FLOOR, Math.pow(0.5, age / HALF));
      var it = { b: bOf(a.id, a.diff, live), n: nEff, y: y, w: w };
      all.push(it); nAns += a.total;
      (byArea[a.area] || (byArea[a.area] = [])).push(it);
    });
    var overall = fit(all, 0, 1.5), areas = {}, wSum = 0, v = 0, lo = 0, hi = 0;
    Object.keys(bp).forEach(function(k){
      var w = +bp[k] || 0; if(!w) return;
      var items = byArea[k] || [], f = items.length ? fit(items, overall.theta, 0.8) : { theta: overall.theta, se: Math.sqrt(overall.se * overall.se + 0.64) };
      var bs = (bank[k] || []).map(function(d){ return bOf(null, d); });
      var pct = meanOver(bs, f.theta), pl = meanOver(bs, f.theta - Z * f.se), ph = meanOver(bs, f.theta + Z * f.se);
      var n = items.reduce(function(s, x){ return s + x.n; }, 0);
      areas[k] = { pct: Math.round(pct * 100), lo: Math.round(pl * 100), hi: Math.round(ph * 100), n: Math.round(n), theta: f.theta };
      wSum += w; v += w * pct; lo += w * pl; hi += w * ph;
    });
    if(!wSum) return { value: null, n: nAns, areas: areas, overall: overall };
    return { value: Math.round(v / wSum * 100), lo: Math.round(lo / wSum * 100), hi: Math.round(hi / wSum * 100), n: nAns, areas: areas, overall: overall };
  }

  /* AP: percent of the composite for a 3, 4 and 5, and the free-response share (docs/progress-profile.md table).
     A 2 starts at 0.65 of the 3 cutoff. */
  var CUT = {
    apbio: { frq: 0.5, c: [44, 59, 73] }, apchem: { frq: 0.5, c: [40, 57, 73] }, apphys: { frq: 0.5, c: [40, 57, 75] },
    apstat: { frq: 0.5, c: [40, 55, 70] }, apenv: { frq: 0.4, c: [45, 60, 73] }, appsych: { frq: 1 / 3, c: [49, 62, 75] },
    aphug: { frq: 0.5, c: [46, 60, 75] }, apmacro: { frq: 1 / 3, c: [49, 65, 83] }, apmicro: { frq: 1 / 3, c: [50, 63, 81] },
    apcalc: { frq: 0.5, c: [35, 48, 65] }, apcalcbc: { frq: 0.5, c: [37, 48, 60] }, apprecalc: { frq: 0.375, c: [35, 48, 64], low: true }
  };
  function bandFor(cut, pct){ var c = cut.c; return pct >= c[2] ? 5 : pct >= c[1] ? 4 : pct >= c[0] ? 3 : pct >= c[0] * 0.65 ? 2 : 1; }
  /* mcq: { value, lo, hi } from estimate(); frq: { pct, n } from graded free responses, or null. Without free
     response the FRQ part is taken as the MCQ estimate with the range widened by 10 points each way. */
  function apBand(course, mcq, frq){
    var cut = CUT[course]; if(!cut || !mcq || mcq.value == null) return null;
    var f = cut.frq, fv, fl, fh;
    if(frq && frq.n){ var spread = Math.max(6, 20 / Math.sqrt(frq.n)); fv = frq.pct; fl = Math.max(0, fv - spread); fh = Math.min(100, fv + spread); }
    else { fv = mcq.value; fl = Math.max(0, mcq.lo - 10); fh = Math.min(100, mcq.hi + 10); }
    var c = (1 - f) * mcq.value + f * fv, cl = (1 - f) * mcq.lo + f * fl, ch = (1 - f) * mcq.hi + f * fh;
    return { band: bandFor(cut, c), lo: bandFor(cut, cl), hi: bandFor(cut, ch), composite: Math.round(c), cLo: Math.round(cl), cHi: Math.round(ch), withFrq: !!(frq && frq.n), low: !!cut.low };
  }

  /* Live difficulty: the worker's anonymous tallies for questions with 20+ answers, kept for a day. */
  var API = 'https://api.levlprep.com'; // site-config:API_URL
  function live(course, cb){
    var key = 'levl_qdiff_' + course, c = null;
    try{ c = JSON.parse(localStorage.getItem(key) || 'null'); }catch(e){}
    if(c && c.at && Date.now() - c.at < DAY){ cb(c.q || {}); return; }
    if(!root.fetch){ cb(c ? c.q || {} : {}); return; }
    fetch(API + '/qdiff?course=' + encodeURIComponent(course)).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
      var q = d && d.q ? d.q : (c ? c.q || {} : {});
      try{ localStorage.setItem(key, JSON.stringify({ at: Date.now(), q: q })); }catch(e){}
      cb(q);
    }).catch(function(){ cb(c ? c.q || {} : {}); });
  }

  var api = { estimate: estimate, apBand: apBand, live: live, CUT: CUT, P_DIFF: P_DIFF, _fit: fit };
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LevlReady = api;
})(typeof window !== 'undefined' ? window : this);
