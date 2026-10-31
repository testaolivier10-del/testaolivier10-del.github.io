/* AP® Calculus BC: interval answers (intervals of convergence; docs/apcalcbc-architecture.md,
   "interval items"). BC's own runtime file, loaded on BC question pages before AB's question
   engine (calculus/assets/calc-questions.js), which calls it for an item of type "interval".

     ApCalcBCInterval.parse(str, var) -> { lo, hi, loIn, hiIn, point } | null
     ApCalcBCInterval.key(interval)   -> the item's key in that shape
     ApCalcBCInterval.text(K, var)    -> "[1, 5)", "all real numbers", "x = 0 only"
     ApCalcBCInterval.grade(q, typed) -> { valid, correct, score, parts, notes, mistake, right, total }

   Numbers are read by ApCalcQuestions.readNumber (exact values too) at grade time. */
(function(){
  'use strict';
  function Q(){ return window.ApCalcQuestions || {}; }
  function readNumber(s){ return Q().readNumber ? Q().readNumber(s) : null; }
  function threeOk(v, A){ return Q().threeOk ? Q().threeOk(v, A) : false; }
  function same(a, b){ return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }
  /* INTERVALS (AP® Calculus BC, intervals of convergence; docs/apcalcbc-architecture.md,
     "interval items"). A typed interval in interval notation ("[1, 5)", "(-inf, inf)"),
     as an inequality ("1 <= x < 5", "-1 < x ≤ 1", "|x - 3| < 2"), "all real numbers",
     or one point ("x = 3", "{3}") -> { lo, hi, loIn, hiIn, point } (lo, hi numbers or
     ±Infinity; loIn, hiIn whether the endpoint is included) or null. Endpoints may be
     exact values (sqrt(3), 1/2, pi). */
  function readEnd(t){
    t = String(t).trim().replace(/[−–]/g, '-');
    if(/^\+?(inf|infinity|∞|oo)$/i.test(t)) return Infinity;
    if(/^-(inf|infinity|∞|oo)$/i.test(t)) return -Infinity;
    var r = readNumber(t);
    return r ? r.value : NaN;
  }
  function parseInterval(str, v){
    v = v || 'x';
    var s = String(str == null ? '' : str).trim().replace(/[−–]/g, '-').replace(/≤|=<|⩽/g, '<=').replace(/≥|=>|⩾/g, '>=').replace(/\s+/g, ' ');
    if(!s) return null;
    if(/^(all real( numbers)?|all reals|ℝ|r|\(-?∞?inf(inity)?\s*,\s*\+?inf(inity)?\))$/i.test(s)) return { lo: -Infinity, hi: Infinity, loIn: false, hiIn: false };
    var m = /^([\[(])\s*([^,]+?)\s*,\s*([^,]+?)\s*([\])])$/.exec(s);
    if(m){
      var a = readEnd(m[2]), b = readEnd(m[3]);
      if(isNaN(a) || isNaN(b) || a > b) return null;
      return { lo: a, hi: b, loIn: m[1] === '[' && isFinite(a), hiIn: m[4] === ']' && isFinite(b) };
    }
    var vr = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    m = new RegExp('^(?:' + vr + '\\s*=\\s*([^<>=]+)|\\{\\s*([^}]+)\\s*\\}|([^ ]+) only)$').exec(s);
    if(m){ var p = readEnd(m[1] || m[2] || m[3]); return isFinite(p) ? { lo: p, hi: p, loIn: true, hiIn: true, point: true } : null; }
    // |x - a| < R (open; a closed end cannot be written this way)
    m = new RegExp('^\\|\\s*' + vr + '\\s*([+-])\\s*([^|]+)\\|\\s*(<=?)\\s*(.+)$').exec(s) || new RegExp('^\\|\\s*' + vr + '\\s*\\|\\s*(<=?)\\s*(.+)$').exec(s);
    if(m){
      var c = m.length === 5 ? (m[1] === '-' ? 1 : -1) * readEnd(m[2]) : 0, R = readEnd(m.length === 5 ? m[4] : m[2]), inc = (m.length === 5 ? m[3] : m[1]) === '<=';
      if(isNaN(c) || isNaN(R) || R < 0) return null;
      return { lo: c - R, hi: c + R, loIn: inc && isFinite(R), hiIn: inc && isFinite(R) };
    }
    // a < x < b, a <= x < b, ...; also x > a, x < b
    m = new RegExp('^(.+?)\\s*(<=?)\\s*' + vr + '\\s*(<=?)\\s*(.+)$').exec(s);
    if(m){
      var lo = readEnd(m[1]), hi = readEnd(m[4]);
      if(isNaN(lo) || isNaN(hi) || lo > hi) return null;
      return { lo: lo, hi: hi, loIn: m[2] === '<=' && isFinite(lo), hiIn: m[3] === '<=' && isFinite(hi) };
    }
    m = new RegExp('^' + vr + '\\s*(<=?|>=?)\\s*(.+)$').exec(s);
    if(m){
      var e = readEnd(m[2]); if(!isFinite(e)) return null;
      return m[1].charAt(0) === '<' ? { lo: -Infinity, hi: e, loIn: false, hiIn: m[1] === '<=' } : { lo: e, hi: Infinity, loIn: m[1] === '>=', hiIn: false };
    }
    return null;
  }
  /* The key of an interval item -> the same shape. I: { lo, hi (numbers or exact
     strings, "-inf"/"inf"), loIn, hiIn } or { point }. */
  function intervalKey(I){
    if(I.point != null){ var p = readEnd(I.point); return { lo: p, hi: p, loIn: true, hiIn: true, point: true }; }
    return { lo: readEnd(I.lo), hi: readEnd(I.hi), loIn: !!I.loIn, hiIn: !!I.hiIn };
  }
  function endSame(a, b){ return a === b || (isFinite(a) && isFinite(b) && same(a, b)); }
  function fmtEnd(x){ return x === Infinity ? '∞' : x === -Infinity ? '−∞' : String(+x.toPrecision(10)); }
  function intervalText(K, v){
    v = v || 'x';
    if(K.point) return v + ' = ' + fmtEnd(K.lo) + ' only';
    if(K.lo === -Infinity && K.hi === Infinity) return 'all real numbers';
    return (K.loIn ? '[' : '(') + fmtEnd(K.lo) + ', ' + fmtEnd(K.hi) + (K.hiIn ? ']' : ')');
  }
  /* Grades an interval: the two endpoints and the two brackets are four parts, so
     a slip is named (an endpoint not tested, the radius given for the interval,
     the wrong center). Returns { valid, correct, score, parts, notes, mistake,
     right, total }. interval: { lo, hi, loIn, hiIn | point, center?, var?,
     ends?: { lo: why, hi: why }, mistakes?: [{ answer, why }] }. */
  function gradeInterval(q, resp){
    var I = q.interval || {}, v = I['var'] || 'x', K = intervalKey(I), S = parseInterval(resp, v);
    if(!S){
      // A bare number where an interval was asked: often the radius.
      var r = readNumber(resp);
      if(r && isFinite(K.lo) && isFinite(K.hi) && same(r.value, (K.hi - K.lo) / 2) && K.hi > K.lo)
        return { valid: true, correct: false, score: 0, parts: {}, notes: ['That is the radius of convergence. The question asks for the interval: the center plus and minus the radius, then each endpoint tested on its own.'], right: 0, total: 4 };
      return { valid: false, correct: false, score: 0 };
    }
    // An endpoint typed as a decimal correct to three places counts, with a note asking for the exact value.
    var near3 = function(a, b){ return isFinite(a) && isFinite(b) && !same(a, b) && threeOk(a, b); };
    var approx = near3(S.lo, K.lo) || near3(S.hi, K.hi);
    var parts = { lo: endSame(S.lo, K.lo) || near3(S.lo, K.lo), hi: endSame(S.hi, K.hi) || near3(S.hi, K.hi), loIn: null, hiIn: null };
    if(isFinite(K.lo) && !K.point) parts.loIn = parts.lo && S.loIn === K.loIn;
    if(isFinite(K.hi) && !K.point) parts.hiIn = parts.hi && S.hiIn === K.hiIn;
    var graded = ['lo', 'hi', 'loIn', 'hiIn'].filter(function(k){ return parts[k] !== null; });
    var right = graded.filter(function(k){ return parts[k]; }).length;
    var correct = right === graded.length, notes = [], mistake = null;
    if(approx) notes.push('Right to three decimal places. Give an endpoint as its exact value (such as sqrt(3) or 1/2) when you can.');
    if(!correct){
      (I.mistakes || []).some(function(mk){
        var M = parseInterval(mk.answer, v);
        if(M && endSame(M.lo, S.lo) && endSame(M.hi, S.hi) && M.loIn === S.loIn && M.hiIn === S.hiIn){ mistake = mk; return true; }
        return false;
      });
      if(mistake) notes.push(mistake.why);
      else if(parts.lo && parts.hi){
        var ends = I.ends || {};
        if(parts.loIn === false) notes.push(ends.lo || ('Check x = ' + fmtEnd(K.lo) + ' on its own: the series ' + (K.loIn ? 'converges there, so that endpoint is included' : 'diverges there, so that endpoint is left out') + '. The ratio test cannot decide an endpoint; use another test.'));
        if(parts.hiIn === false) notes.push(ends.hi || ('Check x = ' + fmtEnd(K.hi) + ' on its own: the series ' + (K.hiIn ? 'converges there, so that endpoint is included' : 'diverges there, so that endpoint is left out') + '. The ratio test cannot decide an endpoint; use another test.'));
      } else if(isFinite(K.lo) && isFinite(K.hi) && isFinite(S.lo) && isFinite(S.hi) && same(S.hi - S.lo, K.hi - K.lo))
        notes.push('The width is right but the interval is not centered where the series is: a power series in (x − a) is centered at x = a' + (I.center != null ? ' (here ' + I.center + ')' : '') + '.');
      else if(isFinite(K.lo) && isFinite(K.hi) && isFinite(S.lo) && isFinite(S.hi) && K.hi > K.lo && same(S.lo + S.hi, K.lo + K.hi) && [Math.pow((K.hi - K.lo) / 2, 2), Math.sqrt((K.hi - K.lo) / 2)].some(function(r){ return same((S.hi - S.lo) / 2, r); }))
        notes.push('The center is right but the radius is not: from an inequality such as x² < 3 the radius is √3, not 3 (take the square root once, and only once).');
      else if(isFinite(K.lo) && isFinite(K.hi) && isFinite(S.lo) && isFinite(S.hi) && (same(S.hi - S.lo, 2 * (K.hi - K.lo)) || same(2 * (S.hi - S.lo), K.hi - K.lo)))
        notes.push('The radius is off by a factor of 2: the interval runs from the center minus the radius to the center plus the radius.');
      else notes.push('The endpoints are off. Set the ratio test limit below 1 and solve for ' + v + ': that gives the open interval, then test each endpoint.');
    }
    return { valid: true, correct: correct, score: graded.length ? right / graded.length : 0, parts: parts, notes: notes, mistake: mistake, right: right, total: graded.length, read: S };
  }

  window.ApCalcBCInterval = { parse: parseInterval, key: intervalKey, text: intervalText, grade: gradeInterval };
})();
