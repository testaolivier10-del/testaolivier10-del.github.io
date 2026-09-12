/* Ochem question engine — decides what to ask next.

   Two banks feed this:
     interactive-bank.js  76 richer questions: click an atom, push an arrow,
                          rank a series, predict a product, choose a
                          mechanism. Every wrong answer carries an authored
                          diagnosis. Preferred whenever one fits.
     practice-bank.json   ~1900 multiple-choice/true-false questions, 30 per
                          topic. Breadth and volume. Normalized here into the
                          same shape and concept-tagged by keyword inference
                          (see concepts.js) so they participate in adaptive
                          selection rather than sitting in a separate mode.

   The selection loop is the reason the page exists. Instead of dealing ten
   random cards off the top of a topic, the engine scores every eligible
   question against the student's current mastery profile and picks the one
   that teaches the most right now:

     need        how weak / how overdue the question's primary concept is
     tier fit    how close the question's difficulty is to the tier this
                 student should be working at for that concept — foundational
                 while an idea is shaky, challenge once it's solid
     format      interactive kinds are weighted up, because a session that is
                 twenty paragraphs in a row teaches less than one that makes
                 you point at the molecule
     diagnosis   questions with authored per-wrong-answer diagnoses are worth
                 more, since a miss there produces real remediation
     variety     repeating the last topic, concept, or question format is
                 penalized, so review interleaves instead of blocking
     mistakes    a question you previously missed and haven't since fixed is
                 boosted, which is what makes "resonance comes back inside an
                 acidity problem next week" actually happen
     freshness   recently served questions are damped so the pool rotates

   The top candidates are then sampled probabilistically rather than taking
   the argmax — a deterministic engine serves the same question every time
   the profile hasn't moved, which feels broken. */
(function(){
  var SEEN_KEY = 'ochem_practice_seen_v1';
  var MAX_SEEN = 500;
  var DAY = 86400000;

  var C  = function(){ return window.OchemConcepts; };
  var M  = function(){ return window.OchemMastery; };
  var CU = function(){ return window.OchemCurriculum; };

  /* ---- seen log (so the pool rotates across sessions) ---------------- */
  function readSeen(){
    try{ var raw = localStorage.getItem(SEEN_KEY); return raw ? JSON.parse(raw) : {}; }
    catch(e){ return {}; }
  }
  function markSeen(qid){
    var s = readSeen();
    s[qid] = Date.now();
    var keys = Object.keys(s);
    if(keys.length > MAX_SEEN){
      keys.sort(function(a,b){ return s[a] - s[b]; });
      keys.slice(0, keys.length - MAX_SEEN).forEach(function(k){ delete s[k]; });
    }
    try{ localStorage.setItem(SEEN_KEY, JSON.stringify(s)); }catch(e){}
  }

  /* ---- the unified pool ---------------------------------------------- */
  var POOL = null;          // array of normalized questions
  var BY_CONCEPT = null;    // conceptId -> [questions]
  var BY_TOPIC = null;
  var BY_ID = null;         // questionId -> question

  // Legacy difficulty strings predate the four-tier ladder. easy/medium/hard
  // map onto foundational/intermediate/advanced; nothing in the legacy bank
  // is authored as a tier-4 challenge, which is what the interactive bank
  // supplies.
  var TIER_FROM_DIFFICULTY = { easy: 1, medium: 2, hard: 3 };

  function normalizeLegacy(topicId, raw, index){
    /* Concept attribution comes from the authored rules first and keyword
       inference only as a fallback. This is not just about feedback wording:
       this concept is what the engine indexes the question under, so it
       decides which drills serve it and which review queue it lands in.
       Inference alone got the topic default 39% of the time, which meant a
       third of the bank was filed under whatever that topic's headline
       concept happened to be. Rules cover 95% of it. */
    var LG = window.OchemLegacyDiagnosis;
    var recall = LG ? LG.isRecall(topicId, raw.q) : false;
    var concept = (LG && LG.conceptFor(topicId, raw.q)) ||
                  C().inferConcept(raw.q, topicId) ||
                  C().defaultConceptFor(topicId);
    return {
      id: 'lb:' + topicId + ':' + index,
      kind: raw.type === 'tf' ? 'tf' : 'mcq',
      tier: TIER_FROM_DIFFICULTY[raw.difficulty] || 2,
      topic: topicId,
      concepts: concept ? [concept] : [],
      prompt: raw.q,
      options: raw.options,
      answer: raw.correct,
      why: raw.why,
      source: 'legacy',
      legacy: true,
      /* Vocabulary and trivia. Still worth asking — knowing that saponification
         is base-promoted ester hydrolysis is useful — but it is not evidence
         about any concept, so nothing is recorded for it. */
      recall: recall
    };
  }

  function build(){
    if(POOL) return;
    POOL = [];
    (window.OchemInteractiveBank ? window.OchemInteractiveBank.ALL : []).forEach(function(q){
      var copy = {};
      for(var k in q){ if(Object.prototype.hasOwnProperty.call(q, k)) copy[k] = q[k]; }
      copy.source = 'interactive';
      if(!copy.concepts || !copy.concepts.length){
        var d = C().defaultConceptFor(copy.topic);
        copy.concepts = d ? [d] : [];
      }
      POOL.push(copy);
    });
    var legacy = window.OchemPracticeBank || {};
    Object.keys(legacy).forEach(function(topicId){
      legacy[topicId].forEach(function(raw, i){ POOL.push(normalizeLegacy(topicId, raw, i)); });
    });

    BY_CONCEPT = {};
    BY_TOPIC = {};
    BY_ID = {};
    POOL.forEach(function(q){
      (q.concepts || []).forEach(function(c){ (BY_CONCEPT[c] = BY_CONCEPT[c] || []).push(q); });
      (BY_TOPIC[q.topic] = BY_TOPIC[q.topic] || []).push(q);
      BY_ID[q.id] = q;
    });
  }

  /* Drop the built pool so the next call rebuilds it.

     The legacy bank arrives over the network now (assets/bank-loader.js), so
     it is possible for something to call build() before it lands. That would
     cache a pool holding only the interactive questions — and because build()
     short-circuits on a non-null POOL, it would stay that way for the life of
     the page. The loader calls this once the bank is in, which makes the
     ordering irrelevant instead of something every caller has to get right. */
  function invalidate(){
    POOL = null;
    BY_CONCEPT = null;
    BY_TOPIC = null;
    BY_ID = null;
  }

  function all(){ build(); return POOL; }
  /* One question by id. Flags store ids, not questions, so anything that
     wants to show a flagged question's prompt has to come back through
     here. */
  function byId(id){ build(); return BY_ID[id] || null; }
  function primaryConcept(q){ return (q.concepts && q.concepts[0]) || C().defaultConceptFor(q.topic); }
  function isInteractive(q){ return q.kind !== 'mcq' && q.kind !== 'tf'; }

  /* ---- scoring -------------------------------------------------------- */

  /* `ctx` carries the session's short-term memory (what was just asked) plus
     cached long-term state (mastery profiles, the mistake list, the seen log)
     so scoring a 2000-question pool doesn't hit localStorage 2000 times. */
  function makeContext(session){
    var profiles = {};
    M().allProfiles().forEach(function(p){ profiles[p.id] = p; });
    var mistakes = {};
    M().mistakes({ limit: 200 }).forEach(function(m){ mistakes[m.qid] = m; });
    return {
      profiles: profiles,
      mistakes: mistakes,
      seen: readSeen(),
      recentTopics: (session && session.recentTopics) || [],
      recentConcepts: (session && session.recentConcepts) || [],
      recentKinds: (session && session.recentKinds) || [],
      askedIds: (session && session.askedIds) || []
    };
  }

  // Multiplier for "how recently did we serve something like this": index -1
  // (not in the window) is free, index 0 is the harshest.
  function recencyPenalty(idx, scale){
    return idx === -1 ? 1 : (scale[idx] === undefined ? scale[scale.length - 1] : scale[idx]);
  }

  function score(q, ctx){
    var cid = primaryConcept(q);
    var p = ctx.profiles[cid];
    if(!p) return 0;

    var s = M().needScore(p);

    // Difficulty matched to where this student actually is on this concept.
    var target = p.strength === null ? 1 : (p.strength < 0.45 ? 1 : p.strength < 0.70 ? 2 : p.strength < 0.88 ? 3 : 4);
    s *= 1 / (1 + 0.9 * Math.abs((q.tier || 2) - target));

    // Format: prefer the richer question types, and prefer questions whose
    // wrong answers will actually produce a diagnosis worth reading.
    if(isInteractive(q)) s *= 1.5;
    if(q.diag) s *= 1.25;

    // Previously missed and not yet redeemed — the core of spaced review.
    var miss = ctx.mistakes[q.id];
    if(miss){
      var ageDays = (Date.now() - miss.ts) / DAY;
      s *= ageDays >= 1 ? 1.9 : 1.2;   // give it a day before re-serving
    }

    // Interleaving. The penalty decays with distance rather than being a flat
    // "was it the last one", because chasing a single weak concept otherwise
    // produces four questions on it in five — technically optimal for that
    // concept, and a miserable session.
    s *= recencyPenalty(ctx.recentTopics.indexOf(q.topic), [0.3, 0.55, 0.75, 0.88]);
    s *= recencyPenalty(ctx.recentConcepts.indexOf(cid), [0.35, 0.6, 0.78, 0.9]);

    // Format rotation. The spec for this page is explicitly that practice
    // should not lean on multiple choice, but the legacy bank outnumbers the
    // interactive one 25:1 — so without an escalating nudge, a run of
    // multiple-choice questions is the statistically likely outcome even
    // with the flat bonus above.
    if(ctx.recentKinds[0] === q.kind) s *= 0.7;
    var plainRun = 0;
    for(var i=0;i<ctx.recentKinds.length;i++){
      if(ctx.recentKinds[i] === 'mcq' || ctx.recentKinds[i] === 'tf') plainRun++;
      else break;
    }
    if(plainRun >= 2) s *= isInteractive(q) ? (1 + 0.5 * plainRun) : 0.6;

    // Rotation: something answered last week is fair game; something answered
    // an hour ago is not.
    var seenAt = ctx.seen[q.id];
    if(seenAt){
      var d = (Date.now() - seenAt) / DAY;
      s *= d < 0.5 ? 0.15 : d < 3 ? 0.5 : d < 10 ? 0.85 : 1;
    } else {
      s *= 1.15;   // mild preference for questions never served
    }

    return s;
  }

  // Weighted sample from the best candidates. Taking the argmax would make
  // the engine deterministic and repetitive; sampling the top slice keeps it
  // adaptive without being predictable.
  function sampleTop(scored, topN){
    if(!scored.length) return null;
    scored.sort(function(a,b){ return b.s - a.s; });
    var slice = scored.slice(0, topN || 10).filter(function(x){ return x.s > 0; });
    if(!slice.length) return scored[0].q;
    var total = slice.reduce(function(a,x){ return a + x.s; }, 0);
    var r = Math.random() * total;
    for(var i=0;i<slice.length;i++){ r -= slice[i].s; if(r <= 0) return slice[i].q; }
    return slice[0].q;
  }

  /* ---- filters -------------------------------------------------------- */

  function poolFor(plan){
    build();
    var pool = POOL;
    if(plan.topic) pool = pool.filter(function(q){ return q.topic === plan.topic; });
    // An empty concept/qid list is a real, meaningful filter — "nothing is
    // due" must yield an empty pool, not silently fall through to every
    // question in the bank. Hence the `!== undefined` rather than a
    // truthiness check on length.
    if(plan.concepts !== undefined){
      pool = pool.filter(function(q){
        return (q.concepts || []).some(function(c){ return plan.concepts.indexOf(c) !== -1; });
      });
    }
    if(plan.qids !== undefined){
      pool = pool.filter(function(q){ return plan.qids.indexOf(q.id) !== -1; });
    }
    if(plan.tiers && plan.tiers.length){
      pool = pool.filter(function(q){ return plan.tiers.indexOf(q.tier || 2) !== -1; });
    }
    if(plan.interactiveOnly) pool = pool.filter(isInteractive);
    return pool;
  }

  /* The one call the session runner makes between questions. Returns the
     single best next question given everything known so far, or null when the
     filtered pool is exhausted. */
  function next(plan, session){
    var pool = poolFor(plan).filter(function(q){ return session.askedIds.indexOf(q.id) === -1; });
    if(!pool.length) return null;

    // 'mixed' deliberately turns the adaptivity down: it's the "just give me
    // a spread across everything" mode, and it should feel different from
    // adaptive rather than being a relabelled copy of it.
    if(plan.mode === 'mixed'){
      var byTopic = {};
      pool.forEach(function(q){ (byTopic[q.topic] = byTopic[q.topic] || []).push(q); });
      var topics = Object.keys(byTopic).filter(function(t){ return t !== session.recentTopics[0]; });
      if(!topics.length) topics = Object.keys(byTopic);
      var t = topics[Math.floor(Math.random() * topics.length)];
      var bucket = byTopic[t];

      /* Topic choice stays random — that spread is what "mixed" means. But
         the pick WITHIN a topic is weighted, because the pool is about 96%
         legacy multiple choice: drawing uniformly served 40 questions in a
         row without a single one you could click, which is the exact
         complaint this bank exists to answer. Turning the adaptivity down
         should relax which CONCEPT gets asked about, not flatten every
         question back into four sentences to choose between. */
      var seenNow = readSeen();
      var weights = bucket.map(function(q){
        var w = 1;
        if(isInteractive(q)) w *= 9;                       // ~4% of the pool, so this is what makes them visible
        else if(q.diag) w *= 2.5;                          // authored diagnosis, even as an mcq
        if(q.kind === session.recentKinds[0]) w *= 0.6;    // don't repeat the format back to back
        if(seenNow[q.id]) w *= 0.7;
        return w;
      });
      var total = weights.reduce(function(a, b){ return a + b; }, 0);
      var roll = Math.random() * total;
      for(var i = 0; i < bucket.length; i++){
        roll -= weights[i];
        if(roll <= 0) return bucket[i];
      }
      return bucket[bucket.length - 1];
    }

    var ctx = makeContext(session);
    var scored = pool.map(function(q){ return { q: q, s: score(q, ctx) }; });
    return sampleTop(scored, 12);
  }

  /* After a miss has been explained, serve a *different* question on the same
     concept at the same tier or one below — "now show me you can apply the
     correction". Prefers a different question format so it tests the idea
     rather than the memory of the last card. */
  function checkQuestion(conceptId, tier, excludeIds, lastKind){
    build();
    var candidates = (BY_CONCEPT[conceptId] || []).filter(function(q){
      return excludeIds.indexOf(q.id) === -1 && (q.tier || 2) <= Math.max(1, tier);
    });
    if(!candidates.length) return null;
    var seen = readSeen();
    candidates.sort(function(a, b){
      function rank(q){
        var r = 0;
        if((q.tier || 2) === Math.max(1, tier)) r += 3;      // same difficulty first
        if(q.kind !== lastKind) r += 2;                       // different format
        if(q.diag) r += 2;                                    // will diagnose if missed too
        if(isInteractive(q)) r += 1;
        if(!seen[q.id]) r += 1;
        return r + Math.random();                             // break ties randomly
      }
      return rank(b) - rank(a);
    });
    return candidates[0];
  }

  /* ---- spaced review -------------------------------------------------

     Review is a different product from practice and this is where that
     difference is implemented, not in the UI.

     Practice asks "what would teach the most right now" and never runs out.
     Review asks "what is closest to being forgotten", takes a capped batch
     of it, and ends. The queue is finite by construction: only concepts you
     have already met, only ones that are due, ordered by how overdue, minus
     leeches, capped at whatever is left of today's budget. */

  function reviewQueue(){
    build();
    var leechIds = M().leeches().map(function(p){ return p.id; });
    // Due, already-met concepts, most overdue first. Weakness is deliberately
    // NOT part of this ordering — that is practice's question.
    var due = M().due().filter(function(p){
      return leechIds.indexOf(p.id) === -1 && (BY_CONCEPT[p.id] || []).length > 0;
    });
    var budget = M().reviewsRemainingToday();
    return {
      today: due.slice(0, budget),
      dueTotal: due.length,
      deferred: Math.max(0, due.length - budget),
      budget: budget,
      capReached: budget === 0 && due.length > 0,
      leeches: M().leeches().filter(function(p){ return (BY_CONCEPT[p.id] || []).length > 0; })
    };
  }

  /* Pick the question to review a concept with. Two rules that adaptive
     selection does not have:

     1. Hold the difficulty. `tier` comes from the highest tier the student
        has actually answered correctly on this concept (mastery.reachedTier),
        and questions above it are excluded. Review checks retention; it does
        not promote.
     2. Move it somewhere else. A concept is worth spacing because it should
        transfer, so a question from a DIFFERENT topic than where it was last
        seen is strongly preferred — resonance coming back inside an acidity
        problem, not the same card again. */
  function reviewQuestion(conceptId, tier, excludeIds, avoidTopics){
    build();
    var seen = readSeen();
    var avoid = avoidTopics || [];
    var candidates = (BY_CONCEPT[conceptId] || []).filter(function(q){
      return excludeIds.indexOf(q.id) === -1 && (q.tier || 2) <= tier;
    });
    if(!candidates.length){
      /* Nothing at or below the reached tier — possible when every question
         tagged with this concept is a harder one. Fall back to the LOWEST
         tier that exists and only that tier: taking "the easiest few" would
         quietly let a challenge question into a review session, which is
         exactly the promotion Review is supposed not to do. */
      var rest = (BY_CONCEPT[conceptId] || []).filter(function(q){
        return excludeIds.indexOf(q.id) === -1;
      });
      if(!rest.length) return null;
      var lowest = rest.reduce(function(m, q){ return Math.min(m, q.tier || 2); }, 9);
      candidates = rest.filter(function(q){ return (q.tier || 2) === lowest; });
    }
    if(!candidates.length) return null;

    var scored = candidates.map(function(q){
      var s = 1;
      if((q.tier || 2) === tier) s *= 1.6;                 // hold the difficulty
      if(avoid.indexOf(q.topic) === -1) s *= 1.8;          // somewhere else
      if(isInteractive(q)) s *= 1.4;
      if(q.diag) s *= 1.2;
      var at = seen[q.id];
      if(at){
        var d = (Date.now() - at) / DAY;
        s *= d < 1 ? 0.2 : d < 5 ? 0.6 : d < 14 ? 0.9 : 1.1;
      } else {
        s *= 1.3;
      }
      return { q: q, s: s };
    });
    return sampleTop(scored, 6);
  }

  /* ---- plans ---------------------------------------------------------- */

  function planLabel(plan){
    switch(plan.mode){
      case 'adaptive': return 'Adaptive practice';
      case 'weak':     return 'Targeted: ' + (plan.conceptTitle || 'your weak spots');
      case 'mistakes': return 'Review your mistakes';
      case 'flagged':  return 'Flagged questions';
      case 'topic':    return 'Topic drill';
      case 'quick':    return 'Quick session';
      case 'mixed':    return 'Mixed practice';
      case 'path':     return 'Continue your path';
      default:         return 'Practice';
    }
  }

  // Target concepts plus their direct prerequisites, weakest first, capped so
  // a "targeted" session stays recognisably targeted.
  function withPrerequisites(conceptIds){
    var out = conceptIds.slice();
    conceptIds.forEach(function(id){
      var c = C().get(id);
      (c && c.dependsOn ? c.dependsOn : []).forEach(function(dep){
        if(out.indexOf(dep) === -1) out.push(dep);
      });
    });
    if(out.length <= conceptIds.length + 2) return out;
    var extras = out.slice(conceptIds.length).sort(function(a, b){
      return M().needScore(M().profile(b)) - M().needScore(M().profile(a));
    });
    return conceptIds.concat(extras.slice(0, 2));
  }

  function makePlan(mode, opts){
    opts = opts || {};
    var plan = { mode: mode, count: opts.count || 10 };
    switch(mode){
      case 'weak':
        plan.concepts = opts.concepts || M().weakest(3).map(function(p){ return p.id; });
        // Pull in each target's prerequisites. Two reasons: a drill confined
        // to one concept serves the same handful of topics over and over,
        // and the prerequisite is frequently where the actual gap is — if
        // you can't push an arrow you may not have resonance solid either.
        plan.concepts = withPrerequisites(plan.concepts);
        plan.conceptTitle = opts.conceptTitle;
        break;
      case 'mistakes':
        plan.qids = M().mistakes({ limit: 40 }).map(function(m){ return m.qid; });
        break;
      /* Flags are a bookmark the student set by hand, so this mode serves
         exactly what they flagged and nothing near it — no prerequisites
         pulled in, no adaptive substitution. The session is as long as the
         flag list unless a shorter count is asked for. */
      case 'flagged':
        plan.qids = opts.qids || (window.OchemFlags ? window.OchemFlags.list() : []);
        plan.count = opts.count || Math.max(1, plan.qids.length);
        break;
      case 'topic':
        plan.topic = opts.topic;
        break;
      case 'quick':
        plan.count = opts.count || 5;
        break;
      case 'path':
        plan.topic = opts.topic;
        plan.concepts = opts.concepts;
        break;
    }
    if(opts.tiers) plan.tiers = opts.tiers;
    plan.label = planLabel(plan);
    return plan;
  }

  /* How many questions a plan can actually serve. The UI needs this so it
     never offers "8 targeted questions" and then runs dry at 3. */
  function availableCount(plan){
    return poolFor(plan).length;
  }

  /* ---- recommendations ------------------------------------------------ */

  // Next topic in the curriculum the student hasn't finished a lesson run on.
  function nextPathTopic(){
    var mods = CU().MODULES;
    for(var i=0;i<mods.length;i++){
      for(var j=0;j<mods[i].topics.length;j++){
        var t = mods[i].topics[j];
        if(t.href && CU().topicMastery(t.id) === null) return { topic: t, module: mods[i] };
      }
    }
    return null;
  }

  /* The "Recommended for you" block. Returns an ordered list of concrete,
     startable recommendations, each with a plan attached — never generic
     advice. The first entry is the default the page leads with.

     The honest-claim rule: a recommendation that names a weakness ("you're
     struggling with anti-periplanar geometry") only appears when the mastery
     engine has enough attempts to defend it. With no history at all, the lead
     recommendation is a short diagnostic instead, which is the truthful
     version of "we don't know you yet". */
  function recommendations(){
    build();
    var out = [];
    var overall = M().overall();
    var weak = M().weakest(4);
    var dueList = M().due(50);
    var missed = M().mistakes({ limit: 50 });

    if(!overall || overall.touched < 4){
      out.push({
        key: 'diagnostic',
        headline: 'Start with a short diagnostic',
        detail: 'Eight mixed questions across the topics you\'ve unlocked, so the engine can find your level. After this, practice gets targeted.',
        cta: 'Start diagnostic',
        plan: makePlan('adaptive', { count: 8 })
      });
    }

    /* A leech — something missed four or more times and still under 45% — is
       not a drilling problem. Recommending eight more questions on it, while
       Review has deliberately pulled it out of the queue for the same reason,
       would have the two pages contradicting each other. Send them to the
       lesson instead. */
    var leech = M().leeches()[0];
    if(leech){
      var lessonTopic = C().lessonTopicFor(leech.id);
      out.push({
        key: 'leech',
        // phrase() not title(): "Meso compounds is not sticking" reads wrong,
        // and singular/plural concept titles make agreement unfixable.
        headline: 'You keep missing ' + C().phrase(leech.id),
        detail: 'You have missed this ' + (leech.attempts - leech.correct) + ' times out of ' +
          leech.attempts + '. Another question would just be the next wrong answer — this one needs the ' +
          'lesson again, not more drilling. It is out of your review queue until you go back to it.',
        cta: lessonTopic ? 'Re-read ' + lessonTopic.title : 'See your mastery map',
        href: lessonTopic ? lessonTopic.href : 'mastery.html'
      });
    }

    // Weakest concept that is still worth drilling (leeches excluded above).
    weak = weak.filter(function(p){ return !M().isLeech(p); });
    if(weak.length){
      var w = weak[0];
      var prereqs = M().weakPrerequisites(w.id);
      var count = Math.min(8, Math.max(4, availableCount(makePlan('weak', { concepts: [w.id] }))));
      var detail = 'You\'re at ' + Math.round(w.strength * 100) + '% on this across ' + w.attempts +
        ' question' + (w.attempts === 1 ? '' : 's') + '. ' + count + ' targeted questions should move it.';
      if(prereqs.length){
        detail += ' Heads up: ' + C().phrase(prereqs[0].id) +
          ' is shaky too, and this builds on it — expect some of those mixed in.';
      }
      // "...with IR functional groups in IR" reads like a bug, so the topic
      // is only named when it adds something the concept title doesn't.
      var where = '';
      if(w.concept.topics && w.concept.topics.length){
        var tt = topicTitle(w.concept.topics[0]);
        if(w.concept.title.toLowerCase().indexOf(tt.toLowerCase()) === -1 &&
           tt.toLowerCase().indexOf(w.concept.title.toLowerCase()) === -1){
          where = ' in ' + tt;
        }
      }
      out.push({
        key: 'weak',
        headline: 'You\'re struggling with ' + C().phrase(w.id) + where,
        detail: detail,
        cta: 'Practice ' + count + ' targeted questions',
        concept: w,
        plan: makePlan('weak', {
          concepts: prereqs.length ? [w.id, prereqs[0].id] : [w.id],
          conceptTitle: w.concept.title, count: count
        })
      });
    }

    if(dueList.length >= 3){
      // Points at Review rather than starting a session here. Review's queue
      // is finite, capped per day and ordered by overdueness — different
      // rules from an adaptive session, and it owns them.
      var batch = Math.min(M().reviewsRemainingToday(), dueList.length);
      out.push({
        key: 'due',
        headline: dueList.length + ' concept' + (dueList.length === 1 ? '' : 's') + ' due for review',
        detail: batch
          ? 'Spaced repetition: these came up earlier and are scheduled to resurface now — inside new problems, not as the same card again. Review takes ' + batch + ' of them and stops.'
          : 'You have already done today\'s review batch. These are queued for tomorrow.',
        cta: batch ? 'Go to Review' : 'See the queue',
        href: 'review.html'
      });
    }

    if(missed.length >= 3){
      out.push({
        key: 'mistakes',
        headline: 'Redo ' + missed.length + ' question' + (missed.length === 1 ? '' : 's') + ' you missed',
        detail: 'Questions you got wrong and haven\'t answered correctly since. Getting one right retires it from this list.',
        cta: 'Review mistakes',
        plan: makePlan('mistakes', { count: Math.min(10, missed.length) })
      });
    }

    // There must always be a startable session at the top of the page. When
    // nothing specific is wrong — a student who is up to date and has missed
    // nothing — adaptive practice IS the recommendation, and saying so beats
    // an empty panel.
    /* There must always be something actionable at the top of the page. A due
       queue counts even though it hands off to Review — it is a concrete next
       step, and when one exists it should lead, because clearing the daily
       queue comes before open-ended practice. Only when nothing at all is
       pending does adaptive practice become the headline. */
    var hasAction = out.some(function(r){ return r.plan || r.key === 'due' || r.key === 'leech'; });
    if(!hasAction){
      out.unshift({
        key: 'adaptive',
        headline: overall ? 'You\'re on top of your review queue' : 'Adaptive practice',
        detail: overall
          ? 'Nothing is due and you have no outstanding mistakes, so the engine will keep pushing your difficulty up where you\'re solid and fill gaps where you\'re thin.'
          : 'The engine picks each question from your mastery profile as you go.',
        cta: 'Practice 10 questions',
        plan: makePlan('adaptive', { count: 10 })
      });
    }

    var path = nextPathTopic();
    if(path){
      out.push({
        key: 'path',
        headline: 'Next in your path: ' + path.topic.title,
        detail: 'You haven\'t finished this lesson yet. Practice questions on it are available, but the lesson comes first.',
        cta: 'Go to the lesson',
        href: path.topic.href,
        plan: makePlan('topic', { topic: path.topic.id, count: 8 })
      });
    }

    return out;
  }

  function topicTitle(topicId){
    var t = CU().findTopic(topicId);
    return t ? t.title : topicId;
  }

  /* Topics that have questions, grouped by module — for the topic picker. */
  function topicsWithQuestions(){
    build();
    return CU().MODULES.map(function(mod){
      return {
        title: mod.title,
        topics: mod.topics.filter(function(t){ return (BY_TOPIC[t.id] || []).length > 0; })
      };
    }).filter(function(m){ return m.topics.length; });
  }

  function stats(){
    build();
    var interactive = POOL.filter(isInteractive).length;
    return { total: POOL.length, interactive: interactive, topics: Object.keys(BY_TOPIC).length };
  }

  window.OchemQuestionEngine = {
    all: all,
    byId: byId,
    next: next,
    checkQuestion: checkQuestion,
    makePlan: makePlan,
    availableCount: availableCount,
    recommendations: recommendations,
    topicsWithQuestions: topicsWithQuestions,
    reviewQueue: reviewQueue,
    reviewQuestion: reviewQuestion,
    primaryConcept: primaryConcept,
    isInteractive: isInteractive,
    markSeen: markSeen,
    topicTitle: topicTitle,
    stats: stats,
    invalidate: invalidate
  };
})();
