/* AP® Statistics graders: ApStatGrade (docs/apstat-spec.md section 7,
   docs/apstat-architecture.md "Content formats"). Pure, no DOM: the question
   engine (stat-questions.js), the content check and the tests all call it.
   Nothing here is graded by an AI model.

     ApStatGrade.tolerance(N) -> the allowed distance from the key for a
       numeric item, from its kind (spec rule 2) unless it sets tol.
     ApStatGrade.numeric(N, typed) -> { valid, correct, value, notes, mistake, range? }
       kind df: the technology df (within 0.05) or a whole number read as
       Table B is read, rounded down to the df or its row; never rounded up.
       N: { answer, kind, places?, tol?, accept?: [lo, hi], alts?: [...],
            alpha?, mistakes?: [{ value, why }] }
       alts are other accepted values (the table route the build adds);
       a p-value on the other side of alpha from the key is always wrong; a
       p-value range typed "0.02 to 0.025" is right when it contains the key.
     ApStatGrade.readInterval(typed) -> { lo, hi } from "from a to b", "(a, b)",
       "a to b", "a, b" or "a +/- m"; null when it cannot be read.
     ApStatGrade.interval(I, typed | { lo, hi }) -> { valid, correct, lo, hi, parts, notes }
       I: { lo, hi, kind: 'stat', places?, tol?, alts?: [{ lo, hi }] }
     ApStatGrade.conclude(C, picks) -> { valid, correct, slots: { name: bool }, notes }
       the builder: picks = { slot: option index }; every slot exact.
     ApStatGrade.flags(C, text) -> [{ rule, ok, hint }]
       the "write it yourself" layer: hints only, never a score (rule 5). */
(function(root){
  'use strict';

  var KINDS = ['prob', 'z', 't', 'chi2', 'pvalue', 'stat', 'count', 'df', 'critical'];

  function tolerance(N){
    if(N.tol != null) return +N.tol;
    var A = Math.abs(+N.answer), places = N.places != null ? N.places : 2;
    switch(N.kind){
      case 'prob': return A < 0.1 ? Math.max(0.01 * A, 1e-6) : 0.002;
      case 'z': case 't': return 0.02;
      case 'chi2': return A > 10 ? 0.05 : 0.02;
      case 'pvalue': return A < 0.05 ? Math.max(0.1 * A, 1e-6) : 0.005;
      case 'stat': return Math.max(0.5 * Math.pow(10, -places), 0.005 * A);
      case 'count': return 0;
      // A technology df (25.58) typed to one or two places; an integer key is exact.
      case 'df': return Number.isInteger(A) ? 0 : 0.05;
      case 'critical': return 0.005;
    }
    return 1e-9 * Math.max(1, A);
  }

  /* A typed number: "0.0123", "-1.2", ".5", "1,234", "1.2e-3", "12%" (as
     0.12 only for prob and pvalue kinds). */
  function readNumber(s, kind){
    s = String(s == null ? '' : s).trim().replace(/[−–]/g, '-').replace(/\s+/g, '');
    if(!s) return null;
    var pct = /%$/.test(s);
    if(pct) s = s.slice(0, -1);
    if(!/^[+-]?(\d{1,3}(,\d{3})+|\d+)?(\.\d+)?([eE][+-]?\d+)?$/.test(s) || !/\d/.test(s)) return null;
    var v = parseFloat(s.replace(/,/g, ''));
    if(!isFinite(v)) return null;
    if(pct) v = (kind === 'prob' || kind === 'pvalue') ? v / 100 : NaN;
    return isFinite(v) ? v : null;
  }
  // "between 0.02 and 0.025", "0.02 to 0.025", "0.02 < p < 0.025"
  function readRange(s){
    var t = String(s == null ? '' : s).toLowerCase().replace(/[−–]/g, '-');
    var m = /^\s*(?:between\s+)?(-?[\d.]+)\s*(?:and|to|<|<=|,)\s*(?:p\s*(?:<|<=)\s*)?(-?[\d.]+)\s*$/.exec(t);
    if(!m) return null;
    var a = parseFloat(m[1]), b = parseFloat(m[2]);
    return isFinite(a) && isFinite(b) ? [Math.min(a, b), Math.max(a, b)] : null;
  }

  // The Table B row at or below a df (the same rule as ApStatDist.tableDf).
  function tableDf(df){
    df = Math.floor(df + 1e-9);
    if(df <= 30) return Math.max(1, df);
    var rows = [40, 50, 60, 80, 100, 1000], row = 30;
    for(var i = 0; i < rows.length; i++) if(rows[i] <= df) row = rows[i];
    return row;
  }

  function within(v, A, tol){ return Math.abs(v - A) <= tol + 1e-12; }

  function numeric(N, typed){
    var A = +N.answer, tol = tolerance(N), notes = [];
    var v = readNumber(typed, N.kind), range = null;
    if(v == null && N.kind === 'pvalue') range = readRange(typed);
    if(v == null && !range) return { valid: false, correct: false, notes: ['Type a number, such as 0.0123 or -1.25.'] };
    if(range){
      var okR = A >= range[0] - 1e-12 && A <= range[1] + 1e-12;
      if(okR && N.alpha != null && range[0] < N.alpha && range[1] > N.alpha){ okR = false; notes.push('That range straddles α = ' + N.alpha + ', so it cannot decide the test. Narrow it from the table.'); }
      if(!okR && !notes.length) notes.push('That range from the table does not contain the p-value.');
      return { valid: true, correct: okR, range: range, notes: notes };
    }
    var right = within(v, A, tol);
    if(!right && N.accept) right = v >= N.accept[0] - 1e-12 && v <= N.accept[1] + 1e-12;
    if(!right && N.alts) right = N.alts.some(function(x){ return within(v, +x, tol); });
    if(N.kind === 'count') right = right || Math.abs(v - Math.round(v)) < 1e-9 && (N.alts || []).concat([A]).some(function(x){ return Math.round(v) === Math.round(+x); });
    // df: an integer key (n - 1, (r - 1)(c - 1), the conservative df) is
    // exact. A technology df (25.58) is right typed to a place or two, or as
    // a whole number read the way the course reads Table B, rounded down
    // (25.58 -> 25; 67.56 -> 67 or its row 60), never rounded up (26 here is
    // also the pooled n1 + n2 - 2, which the course leaves out).
    if(N.kind === 'df' && !right && Math.abs(v - Math.round(v)) < 1e-9) right = [A].concat(N.alts || []).some(function(x){
      x = +x; return !Number.isInteger(x) && (v === Math.floor(x) || v === tableDf(x));
    });
    if(right && N.kind === 'pvalue' && N.alpha != null && (v < N.alpha) !== (A < N.alpha)){
      right = false;
      notes.push('Your p-value is on the other side of α = ' + N.alpha + ' from the right one, so it would change the conclusion.');
    }
    var mistake = null;
    if(!right){
      (N.mistakes || []).some(function(m){ if(within(v, +m.value, Math.max(tol, 1e-9))){ mistake = m; return true; } return false; });
      if(mistake) notes.push(mistake.why);
      else if(N.kind === 'pvalue' && (within(v * 2, A, tol) || within(v / 2, A, tol))) notes.push('Off by a factor of 2: check whether the test is one-sided or two-sided.');
      else if(N.kind === 'prob' && within(1 - v, A, tol)) notes.push('That is the complement. Check the direction: less than or greater than.');
      else if((N.kind === 'z' || N.kind === 't') && within(-v, A, tol)) notes.push('The size is right but the sign is wrong: statistic minus the null value, in that order.');
      else if(within(v, A, tol * 10)) notes.push('Close. Keep full precision until the last step, then round.');
    }
    return { valid: true, correct: right, value: v, notes: notes, mistake: mistake };
  }

  function readInterval(typed){
    var t = String(typed == null ? '' : typed).toLowerCase().replace(/[−–]/g, '-').replace(/±|\+\/-/g, ' pm ').trim();
    var num = '(-?\\d*\\.?\\d+(?:e-?\\d+)?)';
    var m = new RegExp('^(?:from\\s+)?\\(?\\s*' + num + '\\s*(?:to|,|and)\\s*' + num + '\\s*\\)?$').exec(t);
    if(m) return { lo: parseFloat(m[1]), hi: parseFloat(m[2]) };
    m = new RegExp('^' + num + '\\s*pm\\s*' + num + '$').exec(t);
    if(m){ var c = parseFloat(m[1]), e = parseFloat(m[2]); return { lo: c - e, hi: c + e, center: c, margin: e }; }
    return null;
  }
  function interval(I, typed){
    var got = typed && typeof typed === 'object' ? { lo: +typed.lo, hi: +typed.hi } : readInterval(typed);
    if(!got || !isFinite(got.lo) || !isFinite(got.hi)) return { valid: false, correct: false, notes: ['Type the interval as "from 0.41 to 0.53", "(0.41, 0.53)" or "0.47 +/- 0.06".'] };
    var notes = [];
    var reversed = got.lo > got.hi;
    if(reversed){ var x = got.lo; got = { lo: got.hi, hi: x }; notes.push('Write the lower end first.'); }
    // The key first, then any accepted alternative interval (I.alts, added by
    // the build: the conservative-df and Table B row intervals for t).
    var cands = [{ lo: +I.lo, hi: +I.hi }].concat((I.alts || []).map(function(a){ return { lo: +a.lo, hi: +a.hi }; }));
    var okLo = false, okHi = false;
    cands.some(function(c){
      var l = within(got.lo, c.lo, tolerance({ kind: 'stat', places: I.places, tol: I.tol, answer: c.lo })), h = within(got.hi, c.hi, tolerance({ kind: 'stat', places: I.places, tol: I.tol, answer: c.hi }));
      if(l && h){ okLo = okHi = true; return true; }
      if(l + h > okLo + okHi){ okLo = l; okHi = h; }
      return false;
    });
    if(!(okLo && okHi)){
      var c = (+I.lo + +I.hi) / 2, gc = (got.lo + got.hi) / 2, me = (+I.hi - +I.lo) / 2, gme = (got.hi - got.lo) / 2;
      if(within(gme, me, Math.abs(me) * 0.01) && !within(gc, c, Math.abs(me) * 0.01)) notes.push('The width is right but the interval is centered in the wrong place: center it on the sample statistic.');
      else if(within(gc, c, Math.abs(me) * 0.01)) notes.push('The center is right but the margin of error is not: check the critical value and the standard error.');
    }
    return { valid: true, correct: okLo && okHi && !reversed, lo: got.lo, hi: got.hi, parts: { lo: okLo, hi: okHi }, notes: notes };
  }

  var SLOT_NAME = { decision: 'the decision (the p-value compared with α)', evidence: 'the evidence wording', direction: 'the direction',
    parameter: 'the parameter', context: 'the context', level: 'the confidence level', claim: 'the claim', condition: 'the condition' };
  function conclude(C, picks){
    var slots = C.slots || {}, names = Object.keys(slots), out = {}, notes = [];
    if(!picks || names.some(function(n){ return picks[n] == null; })) return { valid: false, correct: false, notes: ['Choose an option in every blank.'] };
    names.forEach(function(n){
      var s = slots[n], ok = +picks[n] === s.correct;
      out[n] = ok;
      if(!ok){
        var why = s.why && s.why[+picks[n]];
        notes.push('Check ' + (SLOT_NAME[n] || n) + (why ? ': ' + why : '.'));
      }
    });
    return { valid: true, correct: names.every(function(n){ return out[n]; }), slots: out, notes: notes };
  }

  /* Rule-based hints for a written conclusion (spec section 7, rule 5).
     C.write: { context: [words], parameter?: true, direction?: 'greater'|'less'|'different',
     evidence?: true, compare?: { p, alpha }, forbid?: [phrases] }. */
  var FORBID = ['prove', 'proves', 'proven', 'accept h0', 'accept the null', 'h0 is true', 'null hypothesis is true',
    'probability that the null', 'probability the null', '95% of the data', 'there is no difference'];
  var DIR = { greater: /\b(greater|more|higher|larger|exceeds?|increase[sd]?)\b/, less: /\b(less|fewer|lower|smaller|decrease[sd]?)\b/, different: /\b(differ(s|ent|ence)?|not equal|changed?)\b/ };
  function flags(C, text){
    var W = C.write || {}, t = ' ' + String(text || '').toLowerCase().replace(/\s+/g, ' ') + ' ', out = [];
    if(W.context && W.context.length) out.push({ rule: 'context', ok: W.context.some(function(w){ return t.indexOf(String(w).toLowerCase()) > -1; }), hint: 'Name the context in the question\'s own words.' });
    if(W.parameter !== false) out.push({ rule: 'parameter', ok: /\b(true|population|all)\b[^.]*\b(proportion|mean|difference|percent)/.test(t), hint: 'Name the parameter: "the true proportion of all ..." or "the true mean ...".' });
    if(W.direction && DIR[W.direction]) out.push({ rule: 'direction', ok: DIR[W.direction].test(t), hint: 'Say the direction of the alternative hypothesis (greater than, less than, different from).' });
    if(W.evidence !== false) out.push({ rule: 'evidence', ok: /convincing evidence/.test(t), hint: 'Use evidence language: "there is (is not) convincing evidence that ...".' });
    if(W.compare){
      // [^.] or a decimal point inside a number: "0.012 is less than 0.05".
      var cmp = /p[- ]?value(?:[^.]|\.\d)*?(<|>|less than|greater than|below|above)(?:[^.]|\.\d)*?(α|alpha|\d*\.\d+)/.test(t) || /(α|alpha)(?:[^.]|\.\d)*?(<|>|less than|greater than)(?:[^.]|\.\d)*?p[- ]?value/.test(t);
      out.push({ rule: 'compare', ok: cmp, hint: 'Compare the p-value with α, with the inequality: "Because 0.012 < 0.05, ...".' });
    }
    FORBID.concat(W.forbid || []).forEach(function(f){
      if(t.indexOf(' ' + String(f).toLowerCase()) > -1) out.push({ rule: 'forbid', ok: false, hint: 'Avoid "' + f + '": a test gives evidence, it never proves anything or shows the null is true.' });
    });
    return out;
  }

  root.ApStatGrade = { KINDS: KINDS.slice(), tolerance: tolerance, readNumber: readNumber, readRange: readRange,
    numeric: numeric, readInterval: readInterval, interval: interval, conclude: conclude, flags: flags };
})(typeof window !== 'undefined' ? window : globalThis);
