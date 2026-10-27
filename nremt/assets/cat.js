/* LevlPrep's simulation of the NREMT-EMT computer-adaptive exam, for the
   Adaptive exam on nremt/exams.html (run by nremt/practice-engine.js).

   This is NOT the National Registry's algorithm, which is not public. It is a
   simple, honest model of the same idea (docs/tools-upgrade.md, NREMT item
   types and adaptive exam):

   - Each item's difficulty comes from its bank tag (DIFFICULTY): easy -2,
     medium -1, hard 0, expert +1 on a logit scale. A one-parameter (Rasch)
     model gives the chance of a right answer: 1 / (1 + e^-(ability - b)).
   - The passing line is ability 0: someone exactly at it gets a "hard" item
     right half the time and a "medium" one about 73% of the time. That line is
     LevlPrep's estimate; the Registry sets its standard by its own study.
   - Ability is estimated after every answer as the posterior mean (EAP) on a
     grid, from a normal prior centred on the line, with its standard error.
   - The next item is the one nearest the current estimate, in the domain
     furthest behind its share of the 2025 outline, unseen items first.
   - The exam stops once at least MIN items are answered and the 95% interval
     (estimate +/- 1.96 SE) lies wholly above or below the line; at MAX items;
     or when the clock runs out (then the estimate decides).
   - Domains are reported Above, Near or Below the line from a per-domain
     estimate shrunk toward the overall one (+/- 1 SE decides Near).

   No DOM here; scripts/test/nremt-cat.test.mjs runs it in Node. */
(function (global) {
  'use strict';

  var DIFFICULTY = { easy: -2, medium: -1, hard: 0, expert: 1 };
  var PASS = 0, MIN = 70, MAX = 120, Z = 1.96;
  var TIME_MS = 2 * 60 * 60 * 1000;

  var GRID = [];
  for (var t = -4; t <= 4.0001; t += 0.05) GRID.push(Math.round(t * 100) / 100);

  function prob(theta, b) { return 1 / (1 + Math.exp(-(theta - b))); }
  function bOf(diff) { return Object.prototype.hasOwnProperty.call(DIFFICULTY, diff) ? DIFFICULTY[diff] : DIFFICULTY.medium; }

  /* resp: [{ b, right }]. prior: { mean, sd }. Returns { theta, se }. */
  function estimate(resp, prior) {
    var m = prior && typeof prior.mean === 'number' ? prior.mean : PASS;
    var sd = prior && prior.sd ? prior.sd : 1;
    var logw = GRID.map(function (th) {
      var l = -((th - m) * (th - m)) / (2 * sd * sd);
      for (var i = 0; i < resp.length; i++) {
        var p = prob(th, resp[i].b);
        l += Math.log(resp[i].right ? p : 1 - p);
      }
      return l;
    });
    var top = Math.max.apply(null, logw), sum = 0, mean = 0;
    var w = logw.map(function (l) { var x = Math.exp(l - top); sum += x; return x; });
    for (var i = 0; i < GRID.length; i++) mean += GRID[i] * w[i] / sum;
    var v = 0, above = 0;
    for (var j = 0; j < GRID.length; j++) {
      v += (GRID[j] - mean) * (GRID[j] - mean) * w[j] / sum;
      if (GRID[j] >= PASS) above += w[j] / sum;
    }
    return { theta: mean, se: Math.sqrt(v), pAbove: above };
  }

  /* The state after resp answers, and whether the exam stops here.
     timeUp: the clock has run out. */
  function decide(resp, timeUp) {
    var e = estimate(resp);
    var lo = e.theta - Z * e.se, hi = e.theta + Z * e.se, n = resp.length;
    var reason = null;
    if (n >= MIN && lo > PASS) reason = 'above';
    else if (n >= MIN && hi < PASS) reason = 'below';
    else if (n >= MAX) reason = 'max';
    else if (timeUp) reason = 'time';
    return {
      n: n, theta: e.theta, se: e.se, lo: lo, hi: hi, pAbove: e.pAbove,
      stop: !!reason, reason: reason,
      // Out of time before the minimum is not a pass (LevlPrep's rule; the
      // Registry does not publish what it does then).
      pass: reason === 'above' || (reason === 'max' && e.theta >= PASS) || (reason === 'time' && n >= MIN && e.theta >= PASS),
    };
  }

  /* The domain furthest behind its target share: targets { domain: weight }. */
  function nextDomain(counts, targets) {
    var n = 0, best = null, gap = -Infinity, total = 0;
    Object.keys(counts || {}).forEach(function (d) { n += counts[d]; });
    Object.keys(targets).forEach(function (d) { total += targets[d]; });
    Object.keys(targets).forEach(function (d) {
      var g = (n + 1) * targets[d] / total - (counts[d] || 0);
      if (g > gap) { gap = g; best = d; }
    });
    return best;
  }

  /* Difficulty tags, nearest the estimate first. */
  function levelsNear(theta) {
    return Object.keys(DIFFICULTY).sort(function (a, b) {
      return Math.abs(DIFFICULTY[a] - theta) - Math.abs(DIFFICULTY[b] - theta) || DIFFICULTY[a] - DIFFICULTY[b];
    });
  }

  /* Picks the next item. pool: [{ i, domain, diff }] not yet asked this
     session; seen(i): asked in an earlier session. rand: () => [0, 1). */
  function pick(pool, counts, targets, theta, seen, rand) {
    rand = rand || Math.random;
    if (!pool.length) return null;
    var want = nextDomain(counts, targets);
    var doms = [want].concat(Object.keys(targets).filter(function (d) { return d !== want; }));
    var levels = levelsNear(theta);
    for (var k = 0; k < doms.length; k++) {
      for (var l = 0; l < levels.length; l++) {
        var hits = pool.filter(function (x) { return x.domain === doms[k] && x.diff === levels[l]; });
        if (!hits.length) continue;
        var fresh = hits.filter(function (x) { return !seen || !seen(x.i); });
        var from = fresh.length ? fresh : hits;
        return from[Math.floor(rand() * from.length)].i;
      }
    }
    return pool[Math.floor(rand() * pool.length)].i;
  }

  /* Above, Near or Below the line for one domain's answers, shrunk toward the
     overall estimate so three answers cannot swing it on their own. */
  function domainBand(resp, overallTheta) {
    if (!resp.length) return { band: 'none', theta: null, se: null, n: 0 };
    var e = estimate(resp, { mean: overallTheta, sd: 1 });
    var band = e.theta - e.se > PASS ? 'above' : e.theta + e.se < PASS ? 'below' : 'near';
    return { band: band, theta: e.theta, se: e.se, n: resp.length };
  }

  global.NremtCat = {
    DIFFICULTY: DIFFICULTY, PASS: PASS, MIN: MIN, MAX: MAX, TIME_MS: TIME_MS, Z: Z,
    prob: prob, bOf: bOf, estimate: estimate, decide: decide, nextDomain: nextDomain,
    levelsNear: levelsNear, pick: pick, domainBand: domainBand,
  };
})(typeof window !== 'undefined' ? window : globalThis);
