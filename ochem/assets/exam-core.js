/* The arithmetic behind ochem/exams.html: which questions an exam asks, how
   it is scored, how a saved attempt is checked before it resumes, and the
   exam history. No DOM and no storage access, so it can be tested on its own
   (scripts/test/ochem-exam-core.test.mjs); exams-page.js owns the page.

   PICKING
   -------
   A question here is { id, topic, chapter, diff } with diff easy|medium|hard.
   An exam is n questions spread two ways at once:

     across the course   a chapter test gives each of the chapter's topics an
                         even share; a cumulative exam first splits n over the
                         chapters by how many topics each has (so a ten-topic
                         chapter carries more than a three-topic one), with
                         every chapter getting at least one when n allows, and
                         then evens each chapter's share over its topics.
     across difficulty   30% easy, 45% medium, 25% hard, which is close to the
                         bank's own split (29/45/26), so a test is neither a
                         run of definitions nor a wall of synthesis problems.

   The topic counts are fixed first; difficulty is then chosen slot by slot,
   always taking the level furthest behind its target among those the topic
   still has. Every split hands out one question at a time to whatever is
   furthest below its share, with ties broken at random, so a small chapter
   does not always lose the odd question. */
(function(){
  var MIX = { easy: 0.30, medium: 0.45, hard: 0.25 };
  var DIFFS = ['easy', 'medium', 'hard'];

  function shuffle(list, rng){
    var a = list.slice();
    for(var i = a.length - 1; i > 0; i--){
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Split n over keys in proportion to weights, never giving a key more than
     its cap. One unit at a time to the open key furthest below its share
     (the lowest count/weight); keys are shuffled first, so ties go to a
     random key rather than always the same one. With min1, every key gets one
     before anything else, when n covers them all. Returns { key: count },
     summing to min(n, total cap). */
  function allocate(weights, n, caps, rng, min1){
    rng = rng || Math.random;
    var keys = shuffle(Object.keys(weights).filter(function(k){
      return weights[k] > 0 && (!caps || caps[k] > 0);
    }), rng);
    function room(k){ return !caps || out[k] < caps[k]; }
    var out = {}, left = n;
    keys.forEach(function(k){ out[k] = 0; });
    if(min1 && n >= keys.length){
      keys.forEach(function(k){ out[k] = 1; });
      left -= keys.length;
    }
    while(left > 0){
      var best = null;
      keys.forEach(function(k){
        if(room(k) && (best === null || out[k] / weights[k] < out[best] / weights[best])) best = k;
      });
      if(best === null) break;
      out[best]++; left--;
    }
    return out;
  }

  function groupBy(list, key){
    var out = {};
    list.forEach(function(x){ (out[x[key]] = out[x[key]] || []).push(x); });
    return out;
  }
  function countOf(obj){
    var o = {};
    Object.keys(obj).forEach(function(k){ o[k] = obj[k].length; });
    return o;
  }

  /* How many questions each topic contributes. `cumulative` splits over
     chapters first (see above); otherwise topics share n evenly. */
  function topicCounts(pool, n, cumulative, rng){
    var byTopic = groupBy(pool, 'topic');
    var caps = countOf(byTopic);
    var even = {};
    Object.keys(byTopic).forEach(function(t){ even[t] = 1; });
    if(!cumulative) return allocate(even, n, caps, rng);

    var byChapter = {};
    Object.keys(byTopic).forEach(function(t){
      var ch = byTopic[t][0].chapter;
      (byChapter[ch] = byChapter[ch] || []).push(t);
    });
    var chWeight = {}, chCap = {};
    Object.keys(byChapter).forEach(function(ch){
      chWeight[ch] = byChapter[ch].length;
      chCap[ch] = byChapter[ch].reduce(function(s, t){ return s + caps[t]; }, 0);
    });
    var perChapter = allocate(chWeight, n, chCap, rng, true);
    var out = {};
    Object.keys(perChapter).forEach(function(ch){
      var w = {}, c = {};
      byChapter[ch].forEach(function(t){ w[t] = 1; c[t] = caps[t]; });
      var got = allocate(w, perChapter[ch], c, rng);
      Object.keys(got).forEach(function(t){ out[t] = got[t]; });
    });
    return out;
  }

  /* The exam: an array of question ids, in a random order. */
  function pick(pool, n, opts){
    opts = opts || {};
    var rng = opts.rng || Math.random;
    n = Math.min(n, pool.length);
    var counts = topicCounts(pool, n, !!opts.cumulative, rng);
    var lanes = {};
    Object.keys(counts).forEach(function(t){ lanes[t] = {}; });
    shuffle(pool, rng).forEach(function(q){
      var lane = lanes[q.topic];
      if(!lane) return;
      var d = MIX[q.diff] ? q.diff : 'medium';
      (lane[d] = lane[d] || []).push(q);
    });
    var slots = [];
    Object.keys(counts).forEach(function(t){ for(var i = 0; i < counts[t]; i++) slots.push(t); });
    slots = shuffle(slots, rng);
    var want = allocate(MIX, slots.length, null, rng), got = { easy: 0, medium: 0, hard: 0 };
    var out = [];
    slots.forEach(function(t){
      var lane = lanes[t], best = null, bestGap = -Infinity;
      shuffle(DIFFS, rng).forEach(function(d){
        if(!lane[d] || !lane[d].length) return;
        var gap = (want[d] || 0) - got[d];
        if(gap > bestGap){ best = d; bestGap = gap; }
      });
      if(!best) return;
      got[best]++;
      out.push(lane[best].pop().id);
    });
    return shuffle(out, rng);
  }

  /* ---- scoring ------------------------------------------------------- */

  /* items: [{ id, topic, chapter, diff, answer, choice, flagged }] where
     choice is the author's option index picked, or null if left blank. */
  function score(items){
    var right = 0, answered = 0;
    items.forEach(function(it){
      if(it.choice !== null && it.choice !== undefined){
        answered++;
        if(it.choice === it.answer) right++;
      }
    });
    function tally(key){
      var map = {}, order = [];
      items.forEach(function(it){
        var k = it[key];
        if(!map[k]){ map[k] = { key: k, c: 0, n: 0 }; order.push(k); }
        map[k].n++;
        if(it.choice === it.answer) map[k].c++;
      });
      return order.map(function(k){ return map[k]; });
    }
    var byTopic = tally('topic');
    return {
      right: right,
      total: items.length,
      answered: answered,
      pct: items.length ? Math.round(right / items.length * 100) : 0,
      byChapter: tally('chapter'),
      byTopic: byTopic,
      byDiff: tally('diff'),
      // Topics worth going back to: under 70% on this exam, worst first, and
      // among equals the one with more questions (more evidence) first.
      weak: byTopic.filter(function(x){ return x.c / x.n < 0.7; }).sort(function(a, b){
        return (a.c / a.n - b.c / b.n) || (b.n - a.n);
      })
    };
  }

  /* ---- time ---------------------------------------------------------- */

  /* Exam mode has no pause: the deadline is fixed when the exam starts and
     the clock runs on wall time, so time spent away from the page (a reload,
     a closed tab) still counts. 0 means untimed. */
  function timeLeft(run, now){
    if(!run || !run.deadline) return Infinity;
    return Math.max(0, run.deadline - now);
  }

  /* ---- saved attempts ------------------------------------------------ */

  /* A short FNV-1a of a stem: the same label session-runner.js appends to a
     report. Here it pins each saved question to the text it had when the
     exam began, because ids are positions in the bank and the bank can be
     edited between a reload and a resume. */
  function hash(text){
    text = String(text || '');
    var h = 2166136261;
    for(var i = 0; i < text.length; i++){
      h ^= text.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(36);
  }

  /* A saved attempt is resumed only if every question it asked is still in the
     bank with the same stem and the same number of options. Grading a student
     against a question they were never shown is worse than starting over. */
  function validRun(run, lookup){
    if(!run || run.v !== 1 || !Array.isArray(run.ids) || !run.ids.length) return false;
    var n = run.ids.length;
    if(!Array.isArray(run.hashes) || run.hashes.length !== n) return false;
    if(!Array.isArray(run.orders) || run.orders.length !== n) return false;
    if(!Array.isArray(run.choices) || run.choices.length !== n) return false;
    for(var i = 0; i < n; i++){
      var q = lookup(run.ids[i]);
      if(!q || hash(q.prompt) !== run.hashes[i]) return false;
      var len = (q.options || []).length;
      if(run.orders[i].length !== len) return false;
      var c = run.choices[i];
      if(c !== null && !(c >= 0 && c < len)) return false;
    }
    return true;
  }

  /* ---- history ------------------------------------------------------- */

  var HISTORY_MAX = 40;
  function addHistory(list, entry){
    var out = (Array.isArray(list) ? list : []).concat([entry]);
    return out.slice(-HISTORY_MAX);
  }

  /* ---- a saved midterm range ---------------------------------------

     The midterm's "from chapter" and "to chapter" used to be saved as chapter
     NUMBERS. Numbers go stale the day a chapter moves: after the October 2026
     reorder (IR & MS, Aromatic Chemistry and the Grignard chapter moved
     forward) a saved "chapters 1-12, through Carbonyl" would have meant
     through Aromatic Chemistry instead. So the range is saved as chapter ids
     now, and a range saved the old way is read against the order it was
     saved under, LEGACY_ORDER, and turned into ids. `chapterIds` is the
     current order. Returns { fromId, toId }, always two ids in that order. */
  var LEGACY_ORDER = ['foundations', 'electron-movement', 'nomenclature', 'acids-bases',
    'alkanes-conformations', 'stereochemistry', 'reactivity', 'substitution-elimination',
    'alkenes-alkynes', 'conjugation', 'alcohols-ethers', 'carbonyl-chemistry', 'redox',
    'carboxylic-acids', 'organometallics', 'enolate-chemistry', 'aromatic-chemistry', 'amines',
    'aromatic-breadth', 'spectroscopy', 'synthesis', 'biomolecules', 'polymers'];
  function midtermRange(prefs, chapterIds, dflt){
    var p = prefs || {}, has = function(id){ return chapterIds.indexOf(id) !== -1; };
    var from = has(p.fromId) ? p.fromId : null, to = has(p.toId) ? p.toId : null;
    function legacy(n){ var id = LEGACY_ORDER[(+n) - 1]; return has(id) ? id : null; }
    if(!from && p.from != null) from = legacy(p.from);
    if(!to && p.to != null) to = legacy(p.to);
    from = from || (dflt && has(dflt.fromId) ? dflt.fromId : chapterIds[0]);
    to = to || (dflt && has(dflt.toId) ? dflt.toId : chapterIds[chapterIds.length - 1]);
    if(chapterIds.indexOf(from) > chapterIds.indexOf(to)){ var t = from; from = to; to = t; }
    return { fromId: from, toId: to };
  }

  window.OchemExamCore = {
    LEGACY_ORDER: LEGACY_ORDER,
    midtermRange: midtermRange,
    MIX: MIX,
    HISTORY_MAX: HISTORY_MAX,
    shuffle: shuffle,
    allocate: allocate,
    topicCounts: topicCounts,
    pick: pick,
    score: score,
    timeLeft: timeLeft,
    hash: hash,
    validRun: validRun,
    addHistory: addHistory
  };
})();
