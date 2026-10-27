/* Evidence Builder model: ApPsychMath.evidenceBuilder (docs/appsych-architecture.md, "Tools";
   docs/appsych-spec.md sections 3.2 and 6). OWNED BY THIS TOOL ONLY (builder T1):
   no other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/appsych-tool-checks/evidence-builder.mjs)
   and the test (scripts/test/appsych-tool-evidence-builder.test.mjs) run exactly this code.

   A context (psychology/data/tools/evidence-builder.json) is one evidence-based
   question: the question, the claims a student might write (defensible ones,
   and the kinds the readers refuse: a topic sentence, a question, an
   oversimplified statement), three invented sources (each with a method
   detail and one result, which claims it supports), the psychology concepts
   that can link a source's result to a claim, and the restricted terms
   (research and statistics words, the prompt's own topic) that never earn
   the concept point.
     sources(ctx, r)      each source's numbers (group means or r), from ApPsychStats
     evidence(ctx, nums, k, cite)   source k's result as a student would write it
     score(ctx, nums, build)        the 7-point rubric for a built answer:
                                    { A, Bi, Bii, Ci, Cii, total, notes: { part: slip } }
                                    with the slips the 2025 Chief Reader Reports
                                    name (docs/appsych-research/framework.md section 7)
     generate(r, ctx, type)         a seeded drill: "full" (claim, evidence,
                                    concept and link twice), "evidence" (claim,
                                    reading a source, evidence twice) or
                                    "reasoning" (the evidence given; concepts and links) */
(function(G){
  'use strict';
  var M = G.ApPsychMath;
  if(!M) return;
  function S(){ return G.ApPsychStats; }
  function cap(s){ s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function low(s){ s = String(s); return s.charAt(0).toLowerCase() + s.slice(1); }
  function rtxt(v){ return M.minus(M.fixed(v, 2)).replace(/^(−?)0\./, '$1.'); }

  var TYPES = ['full', 'evidence', 'reasoning'];
  /* The reasoning choice "link it to the claim, with no concept" (1 point at most). */
  var NONE = 'none';
  var TYPE_LABEL = { full: 'The whole EBQ', evidence: 'Claim and evidence (A, B(i), C(i))', reasoning: 'Reasoning with concepts (B(ii), C(ii))' };
  var PARTS = [
    { k: 'A', label: 'A', name: 'Claim', pts: 1 },
    { k: 'Bi', label: 'B(i)', name: 'Evidence', pts: 1 },
    { k: 'Bii', label: 'B(ii)', name: 'Reasoning', pts: 2 },
    { k: 'Ci', label: 'C(i)', name: 'Evidence', pts: 1 },
    { k: 'Cii', label: 'C(ii)', name: 'Reasoning', pts: 2 }
  ];

  /* ------------------------------------------------------------ numbers */
  function srcNums(s, r){
    if(s.kind === 'r'){
      var X = s.x, Y = s.y, n = s.n, pts, rv, guard = 0, k = (Y.range[1] - Y.range[0]) / (X.range[1] - X.range[0]);
      var xm = (X.range[0] + X.range[1]) / 2, ym = (Y.range[0] + Y.range[1]) / 2;
      do {
        pts = [];
        for(var i = 0; i < n; i++){
          var x = M.round(r.between(X.range[0], X.range[1], 6), X.dec || 0);
          var y = ym + s.direction * 0.75 * k * (x - xm) + M.normal(r, 0, (Y.range[1] - Y.range[0]) * 0.14);
          pts.push([x, Math.min(Y.range[1], Math.max(Y.range[0], M.round(y, Y.dec || 0)))]);
        }
        try{ rv = S().evaluate({ fn: 'r', args: [pts] }); }catch(e){ rv = NaN; }
        guard++;
      } while(guard < 400 && !(rv * s.direction >= 0.35 && rv * s.direction <= 0.85));
      return { kind: 'r', points: pts, r: rv, r2: M.round(rv, 2), describe: S().describe(M.round(rv, 2)),
        slope: S().evaluate({ fn: 'slope', args: [pts] }), intercept: S().evaluate({ fn: 'intercept', args: [pts] }) };
    }
    var d = s.dec || 0, base = M.round(r.between(s.base[0], s.base[1], 6), d), gap = M.round(r.between(s.gap[0], s.gap[1], 6), d), means = [];
    for(var j = 0; j < s.groups.length; j++) means.push(null);
    means[s.lo] = base; means[s.hi] = M.round(base + Math.max(gap, Math.pow(10, -d)), d);
    for(var q = 0; q < means.length; q++) if(means[q] == null) means[q] = M.round(base + gap * r.between(0.3, 0.7, 4), d);
    return { kind: 'means', means: means, dec: d, diff: S().evaluate({ fn: 'sub', args: [means[s.hi], means[s.lo]] }) };
  }
  function sources(ctx, r){ r = r || M.rng(17); return ctx.sources.map(function(s){ return srcNums(s, r); }); }
  function fill(t, s, nm){
    return String(t).replace(/\{m(\d)\}/g, function(_, i){ return M.fixed(nm.means[+i], nm.dec); })
      .replace(/\{r\}/g, rtxt(nm.r2 == null ? 0 : nm.r2)).replace(/\{n\}/g, String(s.n)).replace(/\{diff\}/g, nm.diff == null ? '' : M.fixed(nm.diff, nm.dec));
  }
  function result(ctx, nums, k){ return fill(ctx.sources[k].res, ctx.sources[k], nums[k]); }
  /* A source's result, as a student writes it, cited or not. */
  function evidence(ctx, nums, k, cite){
    var t = fill(ctx.sources[k].ev, ctx.sources[k], nums[k]);
    return cite ? 'According to Source ' + (k + 1) + ', ' + t + '.' : cap(t) + '.';
  }

  /* ------------------------------------------------------------ scoring */
  function claimOf(ctx, id){ return ctx.claims.filter(function(c){ return c.id === id; })[0] || null; }
  function conceptOf(ctx, id){ return ctx.concepts.filter(function(c){ return c.id === id; })[0] || null; }
  function isRestricted(ctx, id){ return ctx.restricted.some(function(x){ return x.id === id; }); }
  function restrictedOf(ctx, id){ return ctx.restricted.filter(function(x){ return x.id === id; })[0] || null; }
  function nameOf(ctx, id){ var c = conceptOf(ctx, id) || restrictedOf(ctx, id); return c ? c.name : ''; }
  /* build: { claim: id, b: { src, what: 'result'|'detail', cite }, bc: concept id,
     c: { src, what, cite }, cc: concept id } (any part may be missing). */
  function evPoint(ctx, cl, e){
    if(!e || e.src == null) return { pt: 0, why: 'Pick a result from a source.' };
    var s = ctx.sources[e.src];
    if(e.what === 'detail') return { pt: 0, why: 'That is a method or participant detail, not a result. Evidence is what the study found.', bad: 'detail' };
    if(!cl || !cl.defensible) return { pt: 0, why: 'Evidence must support a claim, and part A has no defensible claim yet.', bad: 'noclaim' };
    if(s.supports.indexOf(cl.id) < 0) return { pt: 0, why: 'Source ' + (e.src + 1) + '\'s result does not support your claim. Evidence must be consistent with the claim.', bad: 'against' };
    if(!e.cite) return { pt: 0, why: 'Right result, but no citation: uncited evidence loses the point. Add "(Source ' + (e.src + 1) + ')".', bad: 'uncited', usable: true };
    return { pt: 1, why: 'A specific result from Source ' + (e.src + 1) + ', cited, that supports the claim.', usable: true };
  }
  function reasonPoint(ctx, cl, e, ev, cid, other){
    if(!ev.usable) return { pt: 0, why: 'Reasoning explains a result that supports the claim. Fix the evidence first.' };
    if(!cid) return { pt: 0, why: 'Not built yet: choose the concept that explains the result.', bad: 'empty' };
    if(cid === NONE) return { pt: 1, why: 'Linking the evidence to the claim earns 1 point. With no psychology concept applied to it, that is the most this part can earn.', bad: 'noconcept' };
    if(isRestricted(ctx, cid)){ var rr = restrictedOf(ctx, cid); return { pt: 1, why: cap(rr.name) + ' ' + rr.why + ', so it does not earn the concept point.', bad: 'restricted' }; }
    var c = conceptOf(ctx, cid);
    if(!c || !c.links || !c.links[String(e.src)]) return { pt: 1, why: (c ? cap(c.name) : 'That concept') + ' does not explain Source ' + (e.src + 1) + '\'s result. ' + (c && c.off ? c.off : 'Pick a concept that fits this finding.'), bad: 'nofit' };
    if(other && other === cid) return { pt: 1, why: 'You used ' + c.name + ' in B(ii). C(ii) needs a different concept; reusing it caps the part at 1 point.', bad: 'reuse' };
    return { pt: 2, why: 'Evidence, then ' + c.name + ', then the link to the claim: ' + c.links[String(e.src)] };
  }
  /* With no claim that earns A, the scoring guidelines (2026) let the
     evidence and reasoning establish an intended claim in Part B: B and C are
     then scored against a defensible claim that the chosen results support
     (both of them when both are results, else B's), and A still earns 0. */
  function intendedClaim(ctx, b){
    var srcs = [b.b, b.c].filter(function(e){ return e && e.src != null && e.what !== 'detail'; }).map(function(e){ return e.src; });
    if(!srcs.length) return null;
    var ok = function(n){ return ctx.claims.filter(function(c){ return c.defensible && srcs.slice(0, n).every(function(k){ return ctx.sources[k].supports.indexOf(c.id) > -1; }); })[0] || null; };
    return ok(srcs.length) || ok(1);
  }
  function score(ctx, nums, b){
    b = b || {};
    var cl = claimOf(ctx, b.claim), notes = {}, out = { A: 0, Bi: 0, Bii: 0, Ci: 0, Cii: 0 }, ev = cl;
    if(!cl) notes.A = 'Choose a claim that answers the question.';
    else if(cl.defensible){ out.A = 1; notes.A = 'A defensible claim that answers the question.'; }
    else notes.A = cl.why;
    if(cl && !cl.defensible){ ev = intendedClaim(ctx, b) || cl; if(ev !== cl) notes.A += ' (B and C can still score: your evidence and reasoning set up the claim you meant.)'; }
    var eb = evPoint(ctx, ev, b.b), ec = evPoint(ctx, ev, b.c);
    out.Bi = eb.pt; notes.Bi = eb.why;
    if(b.c && b.b && b.c.src != null && b.c.src === b.b.src && ec.usable){ ec = { pt: 0, why: 'This is Source ' + (b.c.src + 1) + ' again. C(i) needs evidence from a different source than B(i).', bad: 'same', usable: true }; }
    out.Ci = ec.pt; notes.Ci = ec.why;
    var rb = reasonPoint(ctx, ev, b.b, eb, b.bc), rc = reasonPoint(ctx, ev, b.c, ec, b.cc, b.bc);
    out.Bii = rb.pt; notes.Bii = rb.why; out.Cii = rc.pt; notes.Cii = rc.why;
    out.total = out.A + out.Bi + out.Bii + out.Ci + out.Cii;
    out.notes = notes;
    out.bad = { Bi: eb.bad, Ci: ec.bad, Bii: rb.bad, Cii: rc.bad };
    return out;
  }
  /* The answer a build makes, as the readers would read it. */
  function written(ctx, nums, b){
    var cl = claimOf(ctx, b.claim), out = {};
    out.A = cl ? cl.text : '';
    ['b', 'c'].forEach(function(k){
      var e = b[k], K = k === 'b' ? 'Bi' : 'Ci', R = k === 'b' ? 'Bii' : 'Cii', cid = b[k + 'c'];
      if(!e || e.src == null){ out[K] = ''; out[R] = ''; return; }
      out[K] = e.what === 'detail' ? (e.cite ? 'According to Source ' + (e.src + 1) + ', ' + low(ctx.sources[e.src].detail) : cap(ctx.sources[e.src].detail)) : evidence(ctx, nums, e.src, e.cite);
      var c = conceptOf(ctx, cid), rr = restrictedOf(ctx, cid);
      if(c && c.links && c.links[String(e.src)]) out[R] = cap(c.links[String(e.src)]);
      else if(c) out[R] = 'This shows ' + c.name + ', so ' + low(cl ? cl.text : 'the claim holds.');
      else if(rr) out[R] = 'This shows ' + rr.name + ', so ' + low(cl ? cl.text : 'the claim holds.');
      else if(cid === NONE) out[R] = cl && cl.defensible ? 'This result supports the claim that ' + low(cl.text) : '';
      else out[R] = '';
    });
    return out;
  }

  /* ------------------------------------------------------------ drills */
  function opt(t, why, key){ return { t: t, why: why, key: !!key }; }
  function choice(r, key, label, opts, practice, hint){
    var o = M.shuffle(r, opts), c = -1;
    o.forEach(function(x, i){ if(x.key) c = i; });
    var s = { kind: 'choice', key: key, label: label, options: o.map(function(x){ return x.t; }), why: o.map(function(x){ return x.why; }), correct: c, practice: practice, level: 'apply' };
    if(hint) s.hint = hint;
    return s;
  }
  function supporting(ctx, id){ var out = []; ctx.sources.forEach(function(s, k){ if(s.supports.indexOf(id) > -1) out.push(k); }); return out; }
  function fits(ctx, k){ return ctx.concepts.filter(function(c){ return c.links && c.links[String(k)]; }); }
  function drillClaims(ctx){ return ctx.claims.filter(function(c){ return c.defensible && supporting(ctx, c.id).length >= 2; }); }
  /* Draw the claim, the B and C sources and the two concepts; the C concept
     differs from the B concept, so C(ii) can earn both points. */
  function plan(r, ctx){
    var cl = r.pick(drillClaims(ctx)), sup = M.shuffle(r, supporting(ctx, cl.id)), b = sup[0], c = sup[1];
    var bc = r.pick(fits(ctx, b)), cOk = fits(ctx, c).filter(function(x){ return x.id !== bc.id; });
    return { claim: cl, b: b, c: c, bc: bc, cc: r.pick(cOk) };
  }
  function stepClaim(r, ctx, cl){
    var others = ctx.claims.filter(function(c){ return !c.defensible; });
    var opts = [opt(cl.text, 'Right: a defensible claim that answers the question, and two sources back it.', true)]
      .concat(M.shuffle(r, others).slice(0, 3).map(function(c){ return opt(c.text, c.why); }));
    return choice(r, 'claim', '<b>Part A.</b> Which is a defensible claim that answers the question?', opts, '4.A', 'A claim takes a side you can back with the sources.');
  }
  function stepEv(r, ctx, nums, pl, which){
    var k = which === 'b' ? pl.b : pl.c, other = which === 'b' ? pl.c : pl.b, key = which === 'b' ? 'evB' : 'evC', P = which === 'b' ? 'B(i)' : 'C(i)';
    var opts = [opt(evidence(ctx, nums, k, true), 'Right: a specific result, cited, from a source that supports the claim' + (which === 'c' ? ', and not the source used in B(i).' : '.'), true)];
    opts.push(opt(evidence(ctx, nums, k, false), 'The right result, but uncited. Uncited evidence loses the point: add "(Source ' + (k + 1) + ')" or "According to Source ' + (k + 1) + '".'));
    opts.push(opt('According to Source ' + (k + 1) + ', ' + low(ctx.sources[k].detail), 'This is a method or participant detail, not a result. Evidence is what the study found.'));
    if(which === 'c') opts.push(opt(evidence(ctx, nums, other, true), 'You used Source ' + (other + 1) + ' in B(i). C(i) needs evidence from a different source.'));
    else {
      var against = ctx.sources.map(function(s, i){ return i; }).filter(function(i){ return ctx.sources[i].supports.indexOf(pl.claim.id) < 0; });
      if(against.length) opts.push(opt(evidence(ctx, nums, against[0], true), 'Source ' + (against[0] + 1) + '\'s result does not support your claim. Evidence must be consistent with the claim.'));
      else opts.push(opt('According to Source ' + (k + 1) + ', ' + low(ctx.sources[k].vague), 'Too vague to score: give the specific result, which group did better and how.'));
    }
    var lbl = which === 'b' ? '<b>Part B(i).</b> Your claim: "' + pl.claim.text + '" Which evidence earns the point?'
      : '<b>Part C(i).</b> Now a second piece of evidence for the same claim. Which earns the point?';
    return choice(r, key, lbl, opts, '4.B', which === 'b' ? 'A result, from a source that supports the claim, with the source named.' : 'A different source from B(i), cited.');
  }
  function stepRead(ctx, nums, k){
    var s = ctx.sources[k], nm = nums[k], hiN = s.groups[s.hi].label, loN = s.groups[s.lo].label;
    var mistakes = [{ value: S().evaluate({ fn: 'add', args: [nm.means[s.hi], nm.means[s.lo]] }), why: 'You added the two means. How much larger is the larger minus the smaller.' },
      { value: -nm.diff, why: 'Subtract the smaller mean from the larger: the answer is positive.' }];
    return { kind: 'num', key: 'read', label: 'Read Source ' + (k + 1) + '\'s graph: how much larger was the mean for ' + low(hiN) + ' than for ' + low(loN) + '?', hint: 'No calculator: subtract by hand.' + (nm.dec ? ' One decimal.' : ''),
      cell: M.cell(nm.diff, 0, mistakes, Math.pow(10, -nm.dec) / 10), d: nm.dec, practice: '3.B', level: 'apply' };
  }
  function stepConcept(r, ctx, pl, which){
    var k = which === 'b' ? pl.b : pl.c, c = which === 'b' ? pl.bc : pl.cc, key = which === 'b' ? 'conB' : 'conC', P = which === 'b' ? 'B(ii)' : 'C(ii)';
    var opts = [opt(cap(c.name), 'Right: ' + c.name + ' explains Source ' + (k + 1) + '\'s result.', true)];
    var topicR = M.shuffle(r, ctx.restricted.filter(function(x){ return x.kind === 'topic'; }))[0], resR = M.shuffle(r, ctx.restricted.filter(function(x){ return x.kind === 'research'; }))[0];
    opts.push(opt(cap(topicR.name), cap(topicR.name) + ' ' + topicR.why + '. It cannot earn the concept point.'));
    opts.push(opt(cap(resR.name), cap(resR.name) + ' ' + resR.why + '. It cannot earn the concept point.'));
    if(which === 'c') opts.push(opt(cap(pl.bc.name), 'You used ' + pl.bc.name + ' in B(ii). C(ii) needs a different concept; reusing it caps the part at 1 point.'));
    else {
      var off = ctx.concepts.filter(function(x){ return !(x.links && x.links[String(k)]); });
      var o = off.length ? r.pick(off) : null;
      if(o) opts.push(opt(cap(o.name), cap(o.name) + ' does not explain this result. ' + (o.off || '')));
    }
    var ev = which === 'b' ? 'Source ' + (pl.b + 1) : 'Source ' + (pl.c + 1);
    return choice(r, key, '<b>Part ' + P + '.</b> Which psychology concept explains the evidence from ' + ev + '?', opts, '1.A', 'Not a research or statistics word, and not the question\'s own topic.');
  }
  function stepLink(r, ctx, pl, which){
    var k = which === 'b' ? pl.b : pl.c, c = which === 'b' ? pl.bc : pl.cc, key = which === 'b' ? 'linkB' : 'linkC', P = which === 'b' ? 'B(ii)' : 'C(ii)';
    var opts = [opt(cap(c.links[String(k)]), 'Right: evidence, then the concept applied to it, then the link to the claim. Both points.', true),
      opt(cap(c.def), 'A definition dropped in earns nothing. Apply the concept to this evidence and say how it supports the claim.'),
      opt('This shows ' + c.name + '.', 'The concept is named but not linked: say how it explains the result and why that supports the claim.'),
      opt(cap(pl.claim.generic || 'This shows the claim is true for everyone.'), 'Generic: no psychology concept and no link to the specific result.')];
    return choice(r, key, 'Finish ' + P + ': which reasoning earns both points?', opts, '4.B', 'Evidence, then concept, then link.');
  }
  function generate(r, ctx, type){
    type = type || 'full';
    if(TYPES.indexOf(type) < 0) throw new Error('evidenceBuilder: unknown type ' + type);
    var nums = sources(ctx, r), pl = plan(r, ctx), steps = [], sol = [];
    if(type !== 'reasoning'){ steps.push(stepClaim(r, ctx, pl.claim)); sol.push('<b>A.</b> ' + pl.claim.text); }
    if(type === 'evidence'){
      var readable = [pl.b, pl.c].filter(function(k){ return nums[k].kind === 'means'; });
      if(readable.length){ var rk = readable[0]; steps.push(stepRead(ctx, nums, rk)); sol.push('Source ' + (rk + 1) + ': ' + M.fixed(nums[rk].means[ctx.sources[rk].hi], nums[rk].dec) + ' − ' + M.fixed(nums[rk].means[ctx.sources[rk].lo], nums[rk].dec) + ' = ' + M.fixed(nums[rk].diff, nums[rk].dec) + '.'); }
    }
    if(type !== 'reasoning'){ steps.push(stepEv(r, ctx, nums, pl, 'b')); sol.push('<b>B(i).</b> ' + evidence(ctx, nums, pl.b, true)); }
    if(type !== 'evidence'){ steps.push(stepConcept(r, ctx, pl, 'b')); steps.push(stepLink(r, ctx, pl, 'b')); sol.push('<b>B(ii).</b> ' + cap(pl.bc.links[String(pl.b)])); }
    if(type !== 'reasoning'){ steps.push(stepEv(r, ctx, nums, pl, 'c')); sol.push('<b>C(i).</b> ' + evidence(ctx, nums, pl.c, true)); }
    if(type !== 'evidence'){ steps.push(stepConcept(r, ctx, pl, 'c')); steps.push(stepLink(r, ctx, pl, 'c')); sol.push('<b>C(ii).</b> ' + cap(pl.cc.links[String(pl.c)])); }
    var text = '<p><b>' + ctx.question + '</b></p>' + (type === 'reasoning'
      ? '<p>Your claim: ' + pl.claim.text + '</p><p>B(i): ' + evidence(ctx, nums, pl.b, true) + '</p><p>C(i): ' + evidence(ctx, nums, pl.c, true) + '</p>'
      : '<p>Read the three sources, then build the answer part by part.</p>');
    return { type: type, ctx: ctx.id, topic: ctx.topic, text: text, steps: steps, solution: sol, nums: nums,
      given: { claim: pl.claim.id, b: pl.b, c: pl.c, bc: pl.bc.id, cc: pl.cc.id } };
  }

  M.register('evidenceBuilder', {
    TYPES: TYPES, TYPE_LABEL: TYPE_LABEL, PARTS: PARTS, NONE: NONE, rtxt: rtxt,
    sources: sources, result: result, evidence: evidence, score: score, written: written,
    claimOf: claimOf, conceptOf: conceptOf, restrictedOf: restrictedOf, isRestricted: isRestricted, nameOf: nameOf,
    supporting: supporting, fits: fits, drillClaims: drillClaims, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
