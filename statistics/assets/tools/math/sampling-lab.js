/* Sampling lab model: ApStatMath.samplingLab (docs/apstat-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apstat-tool-checks/sampling-lab.mjs) and the test
   (scripts/test/apstat-tool-sampling-lab.test.mjs) run exactly this code.

   Loaded on statistics/tools/sampling-lab.html after stat-expr.js,
   stat-dist.js and stat-tool-math.js (M.rng, M.cell, M.sample, M.shuffle)
   and before statistics/assets/tools/sampling-lab.js.

   Explore
     population(scene) -> { units: [{ i, label, row, col, stratum, cluster, value }],
                            N, mu, sigma, strata: [{ name, n, mu }], clusters: [{ name, n }] }
       a fixed population per scene (its own seed), every value rounded to
       the scene's decimals so the picture, the table and the means agree
     METHODS, NAME, RANDOM          the six ways to choose a sample
     draw(r, pop, method, n, scene) -> { picks: [unit index], order, n, mean, note,
       draws?: [{ v, repeat }] (SRS: the random integers, repeats marked),
       alloc?: [n_h] (stratified), clusters?: [ids], k?, start? (systematic),
       ok: false + why when the method does not apply to this scene }
     repeatMeans(r, pop, method, n, scene, k) -> k sample means
     allocate(sizes, n) -> proportional allocation (largest remainder)
   Test yourself
     generate(r, ctx, type) -> { ctx, topic, type, text, steps, solution, figure? }
       types: method (name the method from a procedure), procedure (write an
       SRS procedure slot by slot: label, generate, skip repeats, select),
       bias (name the bias and its direction), numbers (systematic k,
       proportional allocation, how many clusters)
   Every random choice comes from the seeded generator, so a problem code
   gives the same problem on every device and the validator regenerates it. */
(function(){
  'use strict';
  var M = window.ApStatMath;
  if(!M) return;

  var METHODS = ['srs', 'strat', 'cluster', 'sys', 'conv', 'vol'];
  var NAME = { srs: 'simple random sample', strat: 'stratified random sample', cluster: 'cluster sample', sys: 'systematic random sample', conv: 'convenience sample', vol: 'voluntary response sample' };
  var SHORT = { srs: 'Simple random', strat: 'Stratified', cluster: 'Cluster', sys: 'Systematic', conv: 'Convenience', vol: 'Voluntary' };
  var RANDOM = { srs: true, strat: true, cluster: true, sys: true, conv: false, vol: false };

  function mean(a){ var s = 0; for(var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function sd(a, pop){ var m = mean(a), s = 0; for(var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / (a.length - (pop ? 0 : 1))); }
  function cap(s){ s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  /* a count as text: 1,200 */
  function fN(x){ return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function list(a){ return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function inGroups(c){ return c.clusters.phrase || 'The ' + fN(c.N) + ' ' + c.units + ' are in ' + c.clusters.count + ' ' + c.clusters.many + ' of ' + c.clusters.size + '.'; }

  /* ------------------------------------------------------ the population */
  /* scene: { id, rows, cols, seed, decimals, strata: { by: 'row'|'col'|'cluster',
     groups: [{ name, from, to, mean, sd }] }, clusters: { by: 'row'|'col'|'room',
     names: [...] , rooms?: { per, rows, cols } }, trend?: { by, per } }
     A 'room' layout groups the grid into rooms of rows x cols seats; units
     are labelled room by room. */
  var popCache = {};
  function population(scene){
    var key = scene.id + ':' + scene.seed;
    if(popCache[key]) return popCache[key];
    var r = M.rng(scene.seed || 1), units = [], d = scene.decimals == null ? 1 : scene.decimals;
    var R = scene.rows, C = scene.cols, rooms = scene.clusters && scene.clusters.rooms;
    var lim = scene.clip || [-Infinity, Infinity];
    function stratumOf(u){
      var by = scene.strata.by, v = by === 'row' ? u.row : by === 'col' ? u.col : u.cluster, g = scene.strata.groups;
      for(var k = 0; k < g.length; k++) if(v >= g[k].from && v <= g[k].to) return k;
      return g.length - 1;
    }
    if(rooms){
      // rooms in a grid; seats in each room; label room by room
      var nRooms = rooms.count, per = rooms.seatRows * rooms.seatCols;
      for(var q = 0; q < nRooms; q++) for(var s = 0; s < per; s++){
        var u = { room: q, seat: s, row: Math.floor(s / rooms.seatCols), col: s % rooms.seatCols, cluster: q };
        units.push(u);
      }
    } else {
      for(var y = 0; y < R; y++) for(var x = 0; x < C; x++){
        var u2 = { row: y, col: x };
        u2.cluster = scene.clusters.by === 'col' ? x : y;
        units.push(u2);
      }
    }
    units.forEach(function(u, i){
      u.i = i; u.label = i + 1; u.stratum = stratumOf(u);
      var g = scene.strata.groups[u.stratum];
      var v = g.mean + (scene.trend ? scene.trend.per * (scene.trend.by === 'col' ? u.col : u.row) : 0) + M.normal(r, 0, g.sd);
      u.value = M.round(Math.max(lim[0], Math.min(lim[1], v)), d);
    });
    var vals = units.map(function(u){ return u.value; });
    var strata = scene.strata.groups.map(function(g, k){ var vs = units.filter(function(u){ return u.stratum === k; }).map(function(u){ return u.value; }); return { name: g.name, n: vs.length, mu: mean(vs) }; });
    var nc = 0; units.forEach(function(u){ nc = Math.max(nc, u.cluster + 1); });
    var clusters = [];
    for(var c = 0; c < nc; c++){ var cs = units.filter(function(u){ return u.cluster === c; }); clusters.push({ name: (scene.clusters.names || [])[c] || cap(scene.clusters.name || 'group') + ' ' + (c + 1), n: cs.length, mu: mean(cs.map(function(u){ return u.value; })) }); }
    var out = { units: units, N: units.length, mu: mean(vals), sigma: sd(vals, true), strata: strata, clusters: clusters };
    popCache[key] = out;
    return out;
  }

  /* Proportional allocation by the largest remainder: the counts add to n. */
  function allocate(sizes, n){
    var N = sizes.reduce(function(a, b){ return a + b; }, 0);
    var raw = sizes.map(function(s){ return n * s / N; }), out = raw.map(Math.floor), left = n - out.reduce(function(a, b){ return a + b; }, 0);
    var order = raw.map(function(x, i){ return { i: i, f: x - Math.floor(x) }; }).sort(function(a, b){ return b.f - a.f || a.i - b.i; });
    for(var k = 0; k < left; k++) out[order[k % order.length].i]++;
    return out;
  }

  /* The integers a random number generator would give for an SRS: drawn
     from 1 to N with replacement until n different ones appear; a repeat is
     marked so the page can show it being skipped. */
  function srsDraws(r, N, n){
    var seen = {}, draws = [], picks = [];
    while(picks.length < n){
      var v = r.int(1, N);
      if(seen[v]){ draws.push({ v: v, repeat: true }); continue; }
      seen[v] = true; draws.push({ v: v, repeat: false }); picks.push(v);
    }
    return { draws: draws, picks: picks };
  }

  function draw(r, pop, method, n, scene){
    var U = pop.units, N = pop.N, out = { method: method, picks: [], order: [] };
    n = Math.max(1, Math.min(N, n));
    if(method === 'srs'){
      var d = srsDraws(r, N, n);
      out.draws = d.draws; out.picks = d.picks.map(function(l){ return l - 1; });
    } else if(method === 'strat'){
      var sizes = pop.strata.map(function(s){ return s.n; }), al = allocate(sizes, n);
      out.alloc = al;
      pop.strata.forEach(function(s, k){
        var ids = U.filter(function(u){ return u.stratum === k; }).map(function(u){ return u.i; });
        out.picks = out.picks.concat(M.sample(r, ids, al[k]));
      });
    } else if(method === 'cluster'){
      var avg = N / pop.clusters.length, m = Math.max(1, Math.min(pop.clusters.length, Math.round(n / avg)));
      var cl = M.sample(r, pop.clusters.map(function(c, k){ return k; }), m);
      out.clusters = cl;
      cl.forEach(function(c){ U.forEach(function(u){ if(u.cluster === c) out.picks.push(u.i); }); });
    } else if(method === 'sys'){
      var k = Math.floor(N / n), start = r.int(1, k);
      out.k = k; out.start = start;
      for(var j = 0; j < n; j++) out.picks.push(start - 1 + j * k);
    } else if(method === 'conv'){
      // The n units nearest the spot the surveyor stands, give or take: n at
      // random from the closest 1.5 n (so repeated samples differ a little).
      var cv = scene.convenience;
      if(!cv) return { method: method, ok: false, why: 'No convenience spot in this scene.', picks: [] };
      var near = U.map(function(u){ return { i: u.i, d: dist(u, cv, scene), t: r() }; }).sort(function(a, b){ return a.d - b.d || a.t - b.t; });
      var pool = near.slice(0, Math.min(N, Math.ceil(n * 1.5))).map(function(x){ return x.i; });
      out.picks = M.sample(r, pool, n);
    } else if(method === 'vol'){
      var vo = scene.voluntary;
      if(!vo) return { method: method, ok: false, why: scene.noVoluntary || 'These units cannot volunteer.', picks: [] };
      // Everyone is invited; the chance of answering grows with how strongly
      // a unit feels (its value, in the scene's direction): weights e^(b z).
      var w = U.map(function(u){ return Math.exp((vo.strength || 1.2) * vo.dir * (u.value - pop.mu) / pop.sigma); });
      var left = U.map(function(u){ return u.i; });
      for(var t = 0; t < n; t++){
        var tot = 0; left.forEach(function(i){ tot += w[i]; });
        var x = r() * tot, acc = 0, at = left.length - 1;
        for(var q = 0; q < left.length; q++){ acc += w[left[q]]; if(x < acc){ at = q; break; } }
        out.picks.push(left[at]); left.splice(at, 1);
      }
    }
    out.order = out.picks.slice();
    out.n = out.picks.length;
    out.mean = mean(out.picks.map(function(i){ return U[i].value; }));
    out.ok = true;
    return out;
  }
  function dist(u, cv, scene){
    if(cv.room != null) return u.room === cv.room ? u.seat / 100 : 1 + Math.abs(u.room - cv.room) + u.seat / 100;
    var dy = cv.row != null ? u.row - cv.row : 0, dx = cv.col != null ? u.col - cv.col : 0;
    return Math.sqrt(dx * dx * (cv.col != null ? 1 : 0) + dy * dy * (cv.row != null ? 1 : 0)) + (cv.tie === 'col' ? u.col * 1e-3 : u.row * 1e-3);
  }
  function repeatMeans(r, pop, method, n, scene, k){
    var out = [];
    for(var j = 0; j < k; j++){ var d = draw(r, pop, method, n, scene); if(!d.ok) return []; out.push(d.mean); }
    return out;
  }

  /* -------------------------------------------------- test yourself */
  function pick(r, a){ return a[Math.floor(r() * a.length)]; }
  function choiceStep(key, label, practice, opts, r, extra){
    // opts: [{ t, ok, why }], exactly one ok; options keep authored order, the
    // page shuffles them (choice steps are shuffled unless fixed).
    var s = { key: key, kind: 'choice', label: label, practice: practice, options: [], why: [], correct: -1 };
    opts.forEach(function(o, i){ s.options.push(o.t); s.why.push(o.why); if(o.ok) s.correct = i; });
    if(extra) for(var k in extra) s[k] = extra[k];
    return s;
  }
  function numStep(key, label, practice, answer, mistakes, extra){
    var s = { key: key, kind: 'num', label: label, practice: practice, cell: M.cell(answer, 0, mistakes || [], 0.001), d: 0 };
    if(extra) for(var k in extra) s[k] = extra[k];
    return s;
  }

  /* A procedure, in the context's words, for each method. */
  function describe(ctx, method, r, nums){
    var c = ctx, U = c.units, n = nums.n;
    if(method === 'srs') return 'The ' + c.who + ' numbers all ' + fN(c.N) + ' ' + U + ' on ' + c.list + ', uses a random number generator to choose ' + n + ' different numbers, and ' + c.verb + ' those ' + n + ' ' + U + '.';
    if(method === 'strat') return 'The ' + c.who + ' splits the ' + fN(c.N) + ' ' + U + ' by ' + c.strata.by + ' (' + list(c.strata.groups.map(function(g){ return g.name; })) + ') and chooses a simple random sample from each ' + c.strata.word + ': ' + list(nums.alloc.map(String)) + ' ' + U + ', ' + n + ' in all. Then the ' + c.who + ' ' + c.verb + ' them.';
    if(method === 'cluster') return inGroups(c) + ' The ' + c.who + ' chooses ' + nums.m + ' ' + c.clusters.many + ' at random and ' + c.verb + ' every one of the ' + U + ' in them.';
    if(method === 'sys') return 'Using ' + c.list + ', the ' + c.who + ' chooses a random number from 1 to ' + nums.k + ', starts with that ' + c.unit + ', and then takes every ' + ord(nums.k) + ' ' + c.unit + ' after it until there are ' + n + '.';
    if(method === 'conv') return c.conv + ' The ' + c.who + ' ' + c.verb + ' the first ' + n + ' ' + U + ' found there.';
    return c.vol;
  }
  function ord(k){ var s = ['th', 'st', 'nd', 'rd'], v = k % 100; return k + (s[(v - 20) % 10] || s[v] || s[0]); }

  function genMethod(r, ctx){
    var ms = ctx.vol ? METHODS : METHODS.filter(function(m){ return m !== 'vol'; });
    var method = pick(r, ms), n = ctx.n, nums = { n: n };
    if(method === 'strat') nums.alloc = allocate(ctx.strata.groups.map(function(g){ return g.size; }), n);
    if(method === 'cluster'){ nums.m = Math.max(2, Math.round(n / ctx.clusters.size)); nums.n = nums.m * ctx.clusters.size; }
    if(method === 'sys') nums.k = Math.floor(ctx.N / n);
    var text = '<p>' + ctx.lead + ' ' + describe(ctx, method, r, nums) + '</p>';
    var WHY = {
      srs: 'Every possible group of ' + n + ' ' + ctx.units + ' had the same chance to be the sample: the numbers were chosen at random from the whole list.',
      strat: 'The ' + ctx.units + ' were split into ' + ctx.strata.word + 's first (' + ctx.strata.by + '), and a separate random sample was taken from every ' + ctx.strata.word + '.',
      cluster: 'Whole ' + ctx.clusters.many + ' were chosen at random, and everyone in a chosen ' + ctx.clusters.one + ' is in the sample.',
      sys: 'One random start, then every ' + (nums.k ? ord(nums.k) : 'k-th') + ' ' + ctx.unit + ' on the list: a systematic random sample.',
      conv: 'The ' + ctx.units + ' were the easiest to reach. Nothing random chose them, so this is a convenience sample.',
      vol: 'The ' + ctx.units + ' chose themselves by answering. People who choose to respond are a voluntary response sample.'
    };
    var NOT = {
      srs: 'A simple random sample chooses ' + n + ' ' + ctx.units + ' at random from the whole list in one step, with no groups.',
      strat: 'A stratified sample takes a random sample from EVERY group. Here that did not happen.',
      cluster: 'A cluster sample chooses whole groups at random and takes everyone in them. Here that did not happen.',
      sys: 'A systematic sample takes every k-th unit on a list after one random start. Here that did not happen.',
      conv: 'A convenience sample takes whoever is easiest to reach. Here a chance process did the choosing.',
      vol: 'A voluntary response sample is people who chose to answer. Here the ' + ctx.who + ' did the choosing.'
    };
    var opts = METHODS.filter(function(m){ return m !== 'vol' || ctx.vol || method === 'vol'; }).map(function(m){ return { t: cap(NAME[m]), ok: m === method, why: m === method ? WHY[m] : NOT[m] }; });
    var steps = [choiceStep('method', 'Which kind of sample is this?', '2.A', opts, r)];
    var sol = ['It is a ' + NAME[method] + '. ' + WHY[method]];
    if(method === 'strat'){
      steps.push(choiceStep('groups', 'What are the strata?', '2.A', [
        { t: 'The ' + ctx.strata.by + ' groups: ' + list(ctx.strata.groups.map(function(g){ return g.name; })), ok: true, why: 'The strata are the groups the ' + ctx.units + ' were split into before sampling: one random sample from each.' },
        { t: 'The ' + n + ' ' + ctx.units + ' in the sample', ok: false, why: 'Those are the sample, not the strata. The strata are the groups sampled from.' },
        { t: 'The ' + ctx.clusters.many, ok: false, why: 'The ' + ctx.clusters.many + ' were not used here. The ' + ctx.units + ' were grouped by ' + ctx.strata.by + '.' },
        { t: 'All ' + fN(ctx.N) + ' ' + ctx.units, ok: false, why: 'That is the population. Strata are the groups inside it.' }
      ], r));
      sol.push('The strata are the ' + ctx.strata.by + ' groups. Stratifying by ' + ctx.strata.by + ' helps when ' + ctx.strata.why + ': each group is represented, so the estimate varies less from sample to sample.');
    } else if(method === 'cluster'){
      steps.push(choiceStep('groups', 'What are the clusters?', '2.A', [
        { t: 'The ' + ctx.clusters.count + ' ' + ctx.clusters.many, ok: true, why: 'Clusters are the groups chosen whole. Everyone in a chosen ' + ctx.clusters.one + ' is sampled.' },
        { t: 'The ' + ctx.strata.by + ' groups', ok: false, why: 'Those would be strata. The ' + ctx.units + ' were not split by ' + ctx.strata.by + ' here.' },
        { t: 'The ' + nums.n + ' ' + ctx.units + ' in the sample', ok: false, why: 'That is the sample. The clusters are the ' + ctx.clusters.many + ' it came from.' },
        { t: 'The ' + ctx.who, ok: false, why: 'The clusters are groups of ' + ctx.units + ', not the person sampling.' }
      ], r));
      sol.push('The clusters are the ' + ctx.clusters.many + '. A cluster sample is cheaper (fewer places to visit), but when a ' + ctx.clusters.one + ' is made of similar ' + ctx.units + ' the estimate varies more than for a simple random sample of the same size.');
    } else if(method === 'srs' || method === 'sys'){
      steps.push(choiceStep('chance', 'Which statement is true of this method?', '2.A', method === 'srs' ? [
        { t: 'Every possible group of ' + n + ' ' + ctx.units + ' is equally likely to be the sample', ok: true, why: 'That is what makes it a SIMPLE random sample, not only a random one.' },
        { t: 'It is the only method where each ' + ctx.unit + ' has the same chance to be chosen', ok: false, why: 'Stratified (with proportional allocation) and systematic samples also give each ' + ctx.unit + ' the same chance. The SRS is special because every GROUP of ' + n + ' has the same chance.' },
        { t: 'It guarantees the sample matches the population', ok: false, why: 'No random sample guarantees that. Random samples vary; they are unbiased, not perfect.' },
        { t: 'It needs the ' + ctx.units + ' split into groups first', ok: false, why: 'That is stratified or cluster sampling. An SRS uses the whole list at once.' }
      ] : [
        { t: 'Each ' + ctx.unit + ' has the same chance to be chosen, but not every group of ' + n + ' can be the sample', ok: true, why: 'Two ' + ctx.units + ' next to each other on the list can never both be chosen, so it is random but not simple random.' },
        { t: 'It is a simple random sample', ok: false, why: 'Not simple random: only ' + nums.k + ' different samples are possible, one for each start.' },
        { t: 'It is not random at all', ok: false, why: 'The start is chosen at random, so every ' + ctx.unit + ' has a 1 in ' + nums.k + ' chance.' },
        { t: 'The ' + ctx.units + ' at the top of the list are more likely to be chosen', ok: false, why: 'Every ' + ctx.unit + ' has the same 1 in ' + nums.k + ' chance, wherever it is on the list.' }
      ], r));
      sol.push(method === 'srs' ? 'Simple random: every group of ' + n + ' had the same chance. Label, generate random numbers, skip repeats, select.' : 'Systematic: a random start from 1 to ' + nums.k + ', then every ' + ord(nums.k) + ' ' + ctx.unit + '. It is random, but only ' + nums.k + ' samples are possible. It can go wrong if the list repeats in a cycle of ' + nums.k + '.');
    } else {
      steps.push(choiceStep('represent', 'Is this sample likely to represent all ' + fN(ctx.N) + ' ' + ctx.units + '?', '2.A', [
        { t: 'No: ' + (method === 'conv' ? 'the easiest ' + ctx.units + ' to reach' : 'the ' + ctx.units + ' who chose to answer') + ' may differ from the rest, so the method is biased', ok: true, why: 'A nonrandom method lets a systematic difference creep in. ' + (method === 'conv' ? ctx.convWhy : ctx.volWhy) },
        { t: 'No, because the sample is too small', ok: false, why: 'Size is not the problem: a larger nonrandom sample is just as biased. The Chief Reader Report calls this an extraneous reason.' },
        { t: 'Yes, because ' + n + ' ' + ctx.units + ' is enough', ok: false, why: 'Bias comes from how the sample is chosen, not how big it is.' },
        { t: 'Yes, if the ' + ctx.who + ' is careful to be fair', ok: false, why: 'Good intentions do not remove bias. Only a chance process does.' }
      ], r));
      sol.push('Nonrandom, so likely not representative: ' + (method === 'conv' ? ctx.convWhy : ctx.volWhy));
    }
    return { ctx: ctx.id, topic: method === 'conv' || method === 'vol' ? 'sampling-problems' : ctx.topic, type: 'method', text: text, steps: steps, solution: sol, figure: { method: method, nums: nums } };
  }

  function genProcedure(r, ctx){
    var N = ctx.N, n = ctx.n, U = ctx.units;
    var labelOpts = [
      { t: 'Label the ' + U + ' from 1 to ' + fN(N) + '.', ok: true, why: 'Every ' + ctx.unit + ' needs its own number so the random numbers can point at it.' },
      { t: 'Label the ' + U + ' from 1 to ' + n + '.', ok: false, why: 'Only ' + n + ' labels for ' + fN(N) + ' ' + U + ' leaves most of the population out. Label all ' + fN(N) + '.' },
      { t: 'Put the ' + U + ' in alphabetical order.', ok: false, why: 'An order is not a label. Give each ' + ctx.unit + ' a distinct number from 1 to ' + fN(N) + '.' },
      { t: 'Choose ' + n + ' ' + U + ' that seem typical.', ok: false, why: 'Choosing by judgment is not random. The labelling step gives every ' + ctx.unit + ' a number instead.' }
    ];
    var genOpts = [
      { t: 'Use a random number generator to produce integers from 1 to ' + fN(N) + '.', ok: true, why: 'The range matches the labels exactly, so every ' + ctx.unit + ' can be chosen.' },
      { t: 'Use a random number generator.', ok: false, why: 'Say what it generates: integers from 1 to ' + fN(N) + '. "Use random numbers" with no process loses the point on the exam.' },
      { t: 'Use a random number generator to produce integers from 1 to ' + n + '.', ok: false, why: 'Integers 1 to ' + n + ' can only reach the first ' + n + ' labels.' },
      { t: 'Use a random number generator to produce integers from 0 to ' + fN(N) + '.', ok: false, why: 'There is no ' + ctx.unit + ' 0. The range must match the labels, 1 to ' + fN(N) + '.' }
    ];
    var repOpts = [
      { t: 'Ignore any repeated number and keep generating.', ok: true, why: 'Sampling is without replacement: a ' + ctx.unit + ' cannot be in the sample twice.' },
      { t: 'Keep a repeated number; that ' + ctx.unit + ' counts twice.', ok: false, why: 'Then the sample could have fewer than ' + n + ' different ' + U + '. Skip repeats.' },
      { t: 'If a number repeats, start the whole sample again.', ok: false, why: 'Not wrong in effect, but wasteful and not the standard step. Just skip the repeat and keep going.' },
      { t: 'Repeats cannot happen, so no rule is needed.', ok: false, why: 'A generator can give the same integer twice. Say what you do when it does.' }
    ];
    var selOpts = [
      { t: 'The ' + U + ' whose labels match the first ' + n + ' different numbers form the sample.', ok: true, why: 'Tie the numbers back to the labels and say when to stop: ' + n + ' different ' + U + '.' },
      { t: 'The first ' + n + ' numbers form the sample.', ok: false, why: 'Two things are missing: "different" (repeats are skipped) and the link from numbers back to ' + U + '.' },
      { t: 'Survey the ' + U + ' until the ' + ctx.who + ' has enough answers.', ok: false, why: 'Stop at a fixed ' + n + ' different labels, chosen before anyone answers.' },
      { t: 'Choose the ' + U + ' with the ' + n + ' smallest labels.', ok: false, why: 'That ignores the random numbers. The labels the generator picks are the sample.' }
    ];
    var steps = [
      choiceStep('label', 'Step 1 of the procedure: <b>label</b>.', '2.B', labelOpts, r),
      choiceStep('generate', 'Step 2: <b>generate</b> random numbers.', '2.B', genOpts, r),
      choiceStep('repeats', 'Step 3: what about <b>repeats</b>?', '2.B', repOpts, r),
      choiceStep('select', 'Step 4: <b>select</b> the sample.', '2.B', selOpts, r)
    ];
    var d = srsDraws(r, N, n);
    return { ctx: ctx.id, topic: ctx.topic, type: 'procedure', text: '<p>' + ctx.lead + ' The ' + ctx.who + ' wants a simple random sample of ' + n + ' of the ' + fN(N) + ' ' + U + ' on ' + ctx.list + '. Build the procedure one step at a time.</p>', steps: steps,
      solution: ['Label the ' + U + ' from 1 to ' + fN(N) + '.', 'Use a random number generator to produce integers from 1 to ' + fN(N) + '.', 'Ignore repeated numbers.', 'The ' + U + ' whose labels match the first ' + n + ' different numbers are the sample. For example, the generator gave ' + d.draws.slice(0, 8).map(function(x){ return x.v + (x.repeat ? ' (a repeat, skipped)' : ''); }).join(', ') + (d.draws.length > 8 ? ', and so on' : '') + '.'],
      figure: { method: 'srs', draws: d.draws } };
  }

  var BIAS = { undercoverage: 'Undercoverage', nonresponse: 'Nonresponse bias', response: 'Response bias', voluntary: 'Voluntary response bias', convenience: 'Convenience sampling bias' };
  var BIAS_WHAT = {
    undercoverage: 'Some part of the population cannot be chosen at all.',
    nonresponse: 'The chosen units were picked at random, but some did not answer.',
    response: 'People answered, but the question or setting pushed their answers.',
    voluntary: 'The respondents chose themselves.',
    convenience: 'The surveyor took the easiest units to reach.'
  };
  function genBias(r, ctx){
    var b = pick(r, ctx.biases), param = ctx.param;
    var opts = Object.keys(BIAS).map(function(k){ return { t: BIAS[k], ok: k === b.kind, why: k === b.kind ? BIAS_WHAT[k] + ' ' + b.why : 'Not this one. ' + BIAS_WHAT[k] }; });
    var dir = [
      { t: 'It would likely overestimate ' + param, ok: b.dir === 'over', why: b.dir === 'over' ? b.how : 'Think about who is missing or pushed: ' + b.how },
      { t: 'It would likely underestimate ' + param, ok: b.dir === 'under', why: b.dir === 'under' ? b.how : 'Think about who is missing or pushed: ' + b.how },
      { t: 'No effect, because the sample is large', ok: false, why: 'A large biased sample is still biased. Size reduces variability, not bias.' },
      { t: 'No effect, because the errors cancel out', ok: false, why: 'Bias is a systematic push in one direction. It does not cancel.' }
    ];
    return { ctx: ctx.id, topic: 'sampling-problems', type: 'bias', text: '<p>' + ctx.lead + ' ' + b.text + '</p>',
      steps: [choiceStep('bias', 'Which problem is this?', '2.A', opts, r), choiceStep('direction', 'How would it change the estimate of ' + param + '?', '4.B', dir, r, { fixed: true })],
      solution: [BIAS[b.kind] + '. ' + BIAS_WHAT[b.kind] + ' ' + b.why, cap(b.dir === 'over' ? 'Overestimate' : 'Underestimate') + ': ' + b.how] };
  }

  function genNumbers(r, ctx){
    var which = pick(r, ['sys', 'strat', 'cluster']), steps = [], sol = [], text, fig = { which: which, N: ctx.N };
    if(which === 'sys'){
      var ns = ctx.sysN.filter(function(n){ return ctx.N % n === 0; }), n = pick(r, ns), k = ctx.N / n;
      text = '<p>' + ctx.lead + ' The ' + ctx.who + ' wants a systematic random sample of ' + n + ' of the ' + fN(ctx.N) + ' ' + ctx.units + ' on ' + ctx.list + '.</p>';
      steps.push(numStep('k', 'Take every k-th ' + ctx.unit + '. What is k?', '2.A', k, [{ value: n, why: 'That is the sample size. k is the population size over the sample size: ' + fN(ctx.N) + ' ÷ ' + n + '.' }, { value: k - 1, why: 'Count again: ' + fN(ctx.N) + ' ÷ ' + n + ' gives the step between chosen ' + ctx.units + '.' }]));
      steps.push(choiceStep('start', 'How is the first ' + ctx.unit + ' chosen?', '2.B', [
        { t: 'A random integer from 1 to ' + k, ok: true, why: 'The start must be random and within the first ' + k + ', so every ' + ctx.unit + ' has a 1 in ' + k + ' chance.' },
        { t: 'Always the first ' + ctx.unit + ' on the list', ok: false, why: 'A fixed start makes the whole sample fixed: nothing random is left.' },
        { t: 'A random integer from 1 to ' + ctx.N, ok: false, why: 'A start past ' + k + ' runs off the end of the list before ' + n + ' ' + ctx.units + ' are reached.' },
        k === n ? { t: 'A random integer from 0 to ' + k, ok: false, why: 'There is no ' + ctx.unit + ' 0: the start is a label from 1 to k = ' + k + '.' }
          : { t: 'A random integer from 1 to ' + n, ok: false, why: 'The start ranges over one step, 1 to k = ' + k + ', not over the sample size.' }
      ], r));
      fig.k = k; fig.n = n;
      sol.push('k = ' + fN(ctx.N) + ' ÷ ' + n + ' = ' + k + '.', 'Choose a random integer from 1 to ' + k + ' for the first ' + ctx.unit + ', then take every ' + ord(k) + ' one after it.');
    } else if(which === 'strat'){
      var sizes = ctx.strata.groups.map(function(g){ return g.size; }), nn = pick(r, ctx.stratN), al = allocate(sizes, nn), h = r.int(0, sizes.length - 1), g = ctx.strata.groups[h];
      text = '<p>' + ctx.lead + ' The ' + fN(ctx.N) + ' ' + ctx.units + ' are ' + list(ctx.strata.groups.map(function(x){ return x.size + ' ' + x.name; })) + '. The ' + ctx.who + ' takes a stratified random sample of ' + nn + ' with each ' + ctx.strata.word + ' in proportion to its size.</p>';
      var exact = nn * g.size / ctx.N;
      steps.push(numStep('alloc', 'How many of the sample come from ' + g.name + '?', '3.C', al[h], [{ value: M.round(nn / sizes.length, 0), why: 'That splits the sample equally. In proportion means ' + nn + ' × ' + g.size + '/' + fN(ctx.N) + '.' }, { value: g.size, why: 'That is the size of the ' + ctx.strata.word + ', not its share of the sample.' }], { hint: 'Its share of the population times the sample size' + (Math.abs(exact - Math.round(exact)) > 1e-9 ? ', rounded so the counts add to ' + nn : '') + '.' }));
      steps.push(choiceStep('within', 'How are the ' + al[h] + ' chosen within ' + g.name + '?', '2.B', [
        { t: 'A simple random sample of ' + al[h] + ' from the ' + g.size + ' ' + g.name, ok: true, why: 'Within each ' + ctx.strata.word + ' the sample is an SRS.' },
        { t: 'The first ' + al[h] + ' ' + g.name + ' on the list', ok: false, why: 'Not random inside the ' + ctx.strata.word + '. Each ' + ctx.strata.word + ' needs its own random sample.' },
        { t: 'All ' + g.size + ' ' + g.name, ok: false, why: 'Taking a whole group is cluster sampling. A stratum gets a random sample.' },
        { t: 'Any ' + al[h] + ' who volunteer', ok: false, why: 'Volunteers make a voluntary response sample, which is biased.' }
      ], r));
      fig.sizes = sizes; fig.alloc = al; fig.names = ctx.strata.groups.map(function(x){ return x.name; }); fig.h = h; fig.n = nn;
      sol.push(nn + ' × ' + g.size + '/' + fN(ctx.N) + ' = ' + M.fmt(exact, 4) + (Math.abs(exact - al[h]) > 1e-9 ? ', which rounds to ' + al[h] + ' (the counts ' + list(al.map(String)) + ' add to ' + nn + ')' : '') + '.', 'Then take a simple random sample of ' + al[h] + ' within ' + g.name + '.');
    } else {
      var size = ctx.clusters.size, want = pick(r, ctx.clusterN), m = want / size;
      text = '<p>' + ctx.lead + ' ' + inGroups(ctx) + ' The ' + ctx.who + ' wants a cluster sample of ' + want + ' ' + ctx.units + '.</p>';
      steps.push(numStep('m', 'How many ' + ctx.clusters.many + ' should be chosen?', '3.C', m, [{ value: want, why: 'That is the number of ' + ctx.units + '. Each ' + ctx.clusters.one + ' brings ' + size + ', so divide.' }, { value: ctx.clusters.count, why: 'Choosing every ' + ctx.clusters.one + ' is a census, not a sample.' }]));
      steps.push(choiceStep('within', 'Who in a chosen ' + ctx.clusters.one + ' is in the sample?', '2.A', [
        { t: 'Every ' + ctx.unit + ' in it', ok: true, why: 'A cluster sample takes the chosen groups whole.' },
        { t: 'A random sample of the ' + ctx.units + ' in it', ok: false, why: 'Sampling inside each chosen group is a two-stage sample, not a cluster sample.' },
        { t: 'Only the ' + ctx.units + ' who volunteer', ok: false, why: 'Volunteers would make it a voluntary response sample.' },
        { t: 'One ' + ctx.unit + ' from each ' + ctx.clusters.one, ok: false, why: 'One from each group is closer to a stratified idea. Clusters are taken whole.' }
      ], r));
      fig.m = m; fig.count = ctx.clusters.count; fig.many = ctx.clusters.many; fig.pick = M.sample(r, ctx.clusters.count > 0 ? Array.apply(null, Array(ctx.clusters.count)).map(function(x, i){ return i; }) : [], m);
      sol.push(want + ' ÷ ' + size + ' = ' + m + ' ' + ctx.clusters.many + ', chosen at random from the ' + ctx.clusters.count + '.', 'Everyone in each chosen ' + ctx.clusters.one + ' is sampled.');
    }
    return { ctx: ctx.id, topic: ctx.topic, type: 'numbers', text: text, steps: steps, solution: sol, figure: fig };
  }

  var GEN = { method: genMethod, procedure: genProcedure, bias: genBias, numbers: genNumbers };
  var TYPES = ['method', 'procedure', 'bias', 'numbers'];
  function generate(r, ctx, type){
    var ok = (ctx.types || TYPES).filter(function(t){ return GEN[t]; });
    var t = type && ok.indexOf(type) > -1 ? type : pick(r, ok);
    return GEN[t](r, ctx);
  }

  M.register('samplingLab', {
    METHODS: METHODS, NAME: NAME, SHORT: SHORT, RANDOM: RANDOM, TYPES: TYPES, BIAS: BIAS,
    population: population, allocate: allocate, srsDraws: srsDraws, draw: draw, repeatMeans: repeatMeans,
    mean: mean, sd: sd, ord: ord, generate: generate
  });
})();
