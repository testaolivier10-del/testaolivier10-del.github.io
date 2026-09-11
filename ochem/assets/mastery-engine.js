/* Ochem mastery engine — the long-term memory of the practice system.

   Everything else on the Practice page is stateless within a session; this
   file owns the model of what the student actually knows. It tracks
   *concepts* (concepts.js), not topics, because a concept is the unit a
   student actually fails at: you don't fail "SN2", you fail "backside
   attack" or "leaving group ability", and that same failure predicts trouble
   in epoxide opening and in E2. Topic-level scores can't express that.

   Two deliberate boundaries:

   1. This is a SEPARATE store from OchemCurriculum's 'ochem_progress'.
      Curriculum progress is "did you finish the lesson and what did you score
      on it", and practice must never silently rewrite a lesson run's score
      (same reasoning as the old practice-page.js comment). Mastery here is
      "what do you currently know", which decays, moves both directions, and
      is fed by practice, not by lesson completion.

   2. Mastery is not accuracy. Accuracy is a number you can farm by answering
      easy questions; mastery is an estimate that weights harder questions
      more, weights recent evidence more than old evidence, and decays when a
      concept goes untouched. Those are different quantities and the UI names
      them differently.

   ---------------------------------------------------------------------
   Storage: localStorage['ochem_mastery_v1']
     { v: 1, concepts: { <conceptId>: ConceptState }, mistakes: [...],
       sessions: [...], updated: ts }

   ConceptState:
     s       0..1 strength estimate. The headline number.
     n       total attempts on this concept
     c       total correct
     streak  consecutive correct (resets to 0 on a miss)
     lapses  times a previously-strong concept was missed
     seen    ms timestamp of the last attempt
     due     ms timestamp this concept is next scheduled for review
     ivl     current review interval in days (0 = same session)
     ease    SM-2 style ease factor, 1.3..2.8
     tiers   { '1': {n,c}, ... } per-difficulty-tier tally, so "solid on
             foundational, falls apart on advanced" is visible rather than
             averaged away.

   Strength update — exponentially weighted, difficulty-aware:
     target  = 1 for correct, 0 for wrong
     alpha   = learning rate, larger while evidence is thin so the first few
               answers actually move the needle, floored so it never freezes
     weight  = tier weight: getting a challenge question right is stronger
               evidence of mastery than getting a foundational one right, and
               missing a foundational one is stronger evidence of *not*
               knowing it than missing a challenge one.
     s' = clamp(s + alpha * weight * (target - s))

   Decay: strength is not recomputed on a timer (there is no timer on a
   static site) but read through `strength()`, which applies a gentle
   forgetting curve based on time since last seen, floored at 0.45 of the
   stored value so nothing rots away to zero while you're on holiday.

   Scheduling — SM-2 without the self-rating, since the grade is just
   right/wrong plus how hard the question was:
     correct  -> ivl = 1, then 3, then round(ivl * ease); ease nudges up
     wrong    -> ivl = 0 (due again this session), ease down, lapses++
   `due` is what makes spaced repetition real: resonance learned today comes
   back tomorrow, then in three days, then next week — and because concepts
   span topics, it comes back *inside an acidity question*, not as the same
   flashcard.
   ------------------------------------------------------------------ */
(function(){
  var KEY = 'ochem_mastery_v1';
  var DAY = 86400000;
  var MAX_MISTAKES = 120;   // ring buffer; older misses stop being useful
  var MAX_SESSIONS = 60;

  // Tier weights. Index 0 unused so tier numbers read naturally (1..4).
  // [weight when correct, weight when wrong]
  var TIER_WEIGHT = [null, [0.70, 1.15], [0.90, 1.00], [1.15, 0.85], [1.35, 0.70]];

  var TIERS = [
    null,
    { n:1, key:'foundational', label:'Foundational', blurb:'Recognize and recall the idea.' },
    { n:2, key:'intermediate', label:'Intermediate', blurb:'Apply one concept to a new case.' },
    { n:3, key:'advanced',     label:'Advanced',     blurb:'Combine several concepts at once.' },
    { n:4, key:'challenge',    label:'Challenge',    blurb:'Little guidance — reason it out.' }
  ];

  var BANDS = [
    { key:'unseen',     label:'Not started', min:-1,   color:'var(--muted)' },
    { key:'shaky',      label:'Shaky',       min:0,    color:'var(--bad)' },
    { key:'developing', label:'Developing',  min:0.45, color:'var(--amber)' },
    { key:'solid',      label:'Solid',       min:0.70, color:'var(--accent)' },
    { key:'mastered',   label:'Mastered',    min:0.88, color:'var(--good)' }
  ];

  function now(){ return Date.now(); }
  function clamp(x, lo, hi){ return x < lo ? lo : (x > hi ? hi : x); }

  function blank(){ return { v:1, concepts:{}, mistakes:[], sessions:[], reviews:{}, updated: now() }; }

  function read(){
    try{
      var raw = localStorage.getItem(KEY);
      if(!raw) return blank();
      var d = JSON.parse(raw);
      if(!d || typeof d !== 'object') return blank();
      d.concepts = d.concepts || {};
      d.mistakes = d.mistakes || [];
      d.sessions = d.sessions || [];
      d.reviews = d.reviews || {};
      return d;
    }catch(e){ return blank(); }
  }
  function write(d){
    d.updated = now();
    try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){}
  }

  function blankConcept(){
    return { s:0, n:0, c:0, streak:0, lapses:0, seen:0, due:0, ivl:0, ease:2.5, tiers:{} };
  }

  /* Forgetting curve applied at read time. A concept with a long interval was
     reviewed successfully many times, so it decays more slowly — that's what
     a long interval means. The 0.45 floor keeps a long absence from erasing
     genuine knowledge; it drops you to "needs review", not "never learned". */
  function decayed(st){
    if(!st || !st.n || !st.seen) return st ? st.s : 0;
    var days = (now() - st.seen) / DAY;
    if(days <= 1) return st.s;
    var halfLife = Math.max(3, (st.ivl || 1) * 2.2);
    var factor = Math.max(0.45, Math.pow(0.5, (days - 1) / halfLife));
    return st.s * factor;
  }

  function stateOf(d, conceptId){
    return d.concepts[conceptId] || null;
  }

  /* ---- public reads ------------------------------------------------- */

  // Current strength 0..1, decay applied. Unseen concepts return null so
  // callers can tell "never attempted" from "attempted and scored zero".
  function strength(conceptId){
    var st = stateOf(read(), conceptId);
    if(!st || !st.n) return null;
    return clamp(decayed(st), 0, 1);
  }

  function bandFor(s){
    if(s === null || s === undefined) return BANDS[0];
    for(var i = BANDS.length - 1; i >= 1; i--){ if(s >= BANDS[i].min) return BANDS[i]; }
    return BANDS[1];
  }

  // Everything the UI needs about one concept in a single object.
  function profile(conceptId){
    var d = read();
    var st = stateOf(d, conceptId) || blankConcept();
    var s = st.n ? clamp(decayed(st), 0, 1) : null;
    return {
      id: conceptId,
      concept: window.OchemConcepts.get(conceptId),
      strength: s,
      raw: st.n ? st.s : null,
      attempts: st.n, correct: st.c, streak: st.streak, lapses: st.lapses,
      accuracy: st.n ? st.c / st.n : null,
      seen: st.seen, due: st.due, interval: st.ivl,
      lesson: st.lesson || 0,
      band: bandFor(s),
      tiers: st.tiers || {},
      dueIn: st.due ? Math.round((st.due - now()) / DAY) : null,
      isDue: !!(st.n && st.due && st.due <= now())
    };
  }

  function allProfiles(){
    return window.OchemConcepts.ALL.map(function(c){ return profile(c.id); });
  }

  /* The tier a student should be served next on this concept. Foundational
     until the idea is recognized at all, then up one band at a time. Nobody
     gets challenge questions on something they're shaky at — that produces
     demoralizing noise, not signal. */
  function targetTier(conceptId){
    var p = profile(conceptId);
    if(p.strength === null) return 1;
    if(p.strength < 0.45) return 1;
    if(p.strength < 0.70) return 2;
    if(p.strength < 0.88) return 3;
    return 4;
  }

  // Concepts sorted by how badly they need work right now. `need` folds in
  // weakness, overdueness, and recent lapses; unseen concepts sit at a
  // moderate need so a brand-new student gets a sensible spread rather than
  // an immediate deep-dive into whatever they happened to miss once.
  function needScore(p){
    var base;
    if(p.strength === null) base = 0.55;                 // unknown, worth probing
    else base = 1 - p.strength;                          // weaker = needier
    var mult = 1;
    if(p.isDue) mult *= 1.7;
    if(p.due && p.due < now() - 3 * DAY) mult *= 1.25;   // properly overdue
    if(p.lapses >= 2) mult *= 1.15;
    if(p.attempts && p.attempts < 3) mult *= 1.1;        // thin evidence, probe more
    return base * mult;
  }

  // Weakest concepts with enough evidence to say so honestly. minAttempts
  // guards against "you're struggling with meso compounds" after one unlucky
  // question — the recommender needs a claim it can defend.
  function weakest(limit, minAttempts){
    var min = minAttempts === undefined ? 3 : minAttempts;
    return allProfiles()
      .filter(function(p){ return p.attempts >= min && p.strength !== null && p.strength < 0.70; })
      .sort(function(a,b){ return needScore(b) - needScore(a); })
      .slice(0, limit || 5);
  }

  function strongest(limit){
    return allProfiles()
      .filter(function(p){ return p.attempts >= 3 && p.strength !== null && p.strength >= 0.70; })
      .sort(function(a,b){ return b.strength - a.strength; })
      .slice(0, limit || 5);
  }

  function due(limit){
    return allProfiles()
      .filter(function(p){ return p.isDue; })
      .sort(function(a,b){ return a.due - b.due; })
      .slice(0, limit || 999);
  }

  /* A concept is only worth drilling if its prerequisites hold up. If you're
     failing anti-periplanar geometry and you're also weak on chair
     conformations, more E2 questions won't help — this is what lets the
     recommender say "review chairs first" instead. */
  function weakPrerequisites(conceptId){
    var c = window.OchemConcepts.get(conceptId);
    if(!c || !c.dependsOn) return [];
    return c.dependsOn
      .map(profile)
      .filter(function(p){ return p.strength !== null && p.strength < 0.60; })
      .sort(function(a,b){ return a.strength - b.strength; });
  }

  function overall(){
    var ps = allProfiles().filter(function(p){ return p.attempts > 0; });
    if(!ps.length) return null;
    var sum = ps.reduce(function(a,p){ return a + p.strength; }, 0);
    return { value: sum / ps.length, touched: ps.length, total: window.OchemConcepts.ALL.length };
  }

  function counts(){
    var out = { unseen:0, shaky:0, developing:0, solid:0, mastered:0 };
    allProfiles().forEach(function(p){ out[p.band.key]++; });
    return out;
  }

  /* ---- writes -------------------------------------------------------- */

  /* The one call the rest of the system makes after every answered question.
       conceptId  the concept the diagnostic engine decided this answer was
                  really about — not necessarily the question's own primary
                  concept, since a wrong option can reveal a different gap.
       correct    boolean
       opts.tier  1..4, defaults to 2
       opts.share 0..1, how much of the evidence this concept gets. A question
                  tagged with three concepts splits credit rather than
                  claiming full evidence for each.
     Returns the updated profile so callers can show "resonance 41% -> 55%". */
  function record(conceptId, correct, opts){
    if(!conceptId || !window.OchemConcepts.get(conceptId)) return null;
    opts = opts || {};
    var tier = clamp(opts.tier || 2, 1, 4);
    var share = opts.share === undefined ? 1 : clamp(opts.share, 0.15, 1);

    var d = read();
    var st = d.concepts[conceptId] || blankConcept();
    var before = st.n ? clamp(decayed(st), 0, 1) : null;

    // Learning rate: fast while evidence is thin, then settling down so a
    // single bad question can't wipe out a well-established concept.
    var alpha = Math.max(0.16, 0.55 / (1 + st.n * 0.45));
    var weight = TIER_WEIGHT[tier][correct ? 0 : 1];
    var target = correct ? 1 : 0;
    // Decay first, so the update starts from what they actually retain today.
    var start = st.n ? clamp(decayed(st), 0, 1) : (correct ? 0.35 : 0.12);
    st.s = clamp(start + alpha * weight * share * (target - start), 0, 1);

    st.n++;
    if(correct){ st.c++; st.streak++; }
    else {
      if(st.s > 0 && before !== null && before >= 0.70) st.lapses++;
      st.streak = 0;
    }

    var tk = String(tier);
    st.tiers[tk] = st.tiers[tk] || { n:0, c:0 };
    st.tiers[tk].n++;
    if(correct) st.tiers[tk].c++;

    // ---- SM-2-lite scheduling ----
    // Same-day repeats consolidate but must not advance the schedule: eight
    // correct answers in one sitting is one day's evidence, not eight
    // successful reviews, and without this guard a single good session
    // catapults a concept to a six-month interval.
    var sameDay = st.seen && (now() - st.seen) < 8 * 3600000;
    if(correct){
      if(st.ivl <= 0) st.ivl = 1;
      else if(!sameDay){
        if(st.ivl === 1) st.ivl = 3;
        else st.ivl = Math.min(120, Math.round(st.ivl * st.ease));
      }
      if(!sameDay) st.ease = clamp(st.ease + (tier >= 3 ? 0.08 : 0.04), 1.3, 2.8);
    } else {
      st.ivl = 0;                                   // back in the deck now
      st.ease = clamp(st.ease - 0.22, 1.3, 2.8);
    }
    st.seen = now();
    // ivl 0 means "later in this session" — 10 minutes out, not immediately,
    // so the follow-up check question isn't literally the next thing served.
    st.due = now() + (st.ivl > 0 ? st.ivl * DAY : 10 * 60000);

    d.concepts[conceptId] = st;
    write(d);
    var after = profile(conceptId);
    after.before = before;
    return after;
  }

  /* A missed question, kept so "review your previous mistakes" is a real mode
     rather than a re-roll of the same pool. Keyed by question id so the same
     question missed twice doesn't occupy two slots. */
  function recordMistake(entry){
    var d = read();
    d.mistakes = d.mistakes.filter(function(m){ return m.qid !== entry.qid; });
    d.mistakes.unshift({
      qid: entry.qid, topicId: entry.topicId, conceptId: entry.conceptId,
      tier: entry.tier || 2, prompt: (entry.prompt || '').slice(0, 160),
      chose: (entry.chose || '').slice(0, 120), ts: now(), fixed: false
    });
    if(d.mistakes.length > MAX_MISTAKES) d.mistakes.length = MAX_MISTAKES;
    write(d);
  }

  // Called when a previously-missed question is answered correctly — the
  // mistake stays in the log (it's history) but stops being served.
  function clearMistake(qid){
    var d = read();
    var hit = false;
    d.mistakes.forEach(function(m){ if(m.qid === qid && !m.fixed){ m.fixed = true; m.fixedTs = now(); hit = true; } });
    if(hit) write(d);
  }

  function mistakes(opts){
    opts = opts || {};
    var list = read().mistakes;
    if(!opts.includeFixed) list = list.filter(function(m){ return !m.fixed; });
    return list.slice(0, opts.limit || 999);
  }

  function recordSession(summary){
    var d = read();
    d.sessions.unshift({
      ts: now(), mode: summary.mode, asked: summary.asked, correct: summary.correct,
      concepts: summary.concepts || []
    });
    if(d.sessions.length > MAX_SESSIONS) d.sessions.length = MAX_SESSIONS;
    write(d);
  }

  function sessions(limit){ return read().sessions.slice(0, limit || MAX_SESSIONS); }

  // Consecutive days (counting back from today) with at least one session.
  function streakDays(){
    var days = {};
    read().sessions.forEach(function(s){ days[new Date(s.ts).toDateString()] = true; });
    var n = 0, cursor = new Date();
    // Today not counting yet is fine — start the walk at today and allow it
    // to miss, so an evening-only student doesn't see the streak vanish at
    // midnight before they've practiced.
    if(!days[cursor.toDateString()]) cursor = new Date(now() - DAY);
    while(days[cursor.toDateString()]){ n++; cursor = new Date(cursor.getTime() - DAY); }
    return n;
  }

  /* ---- spaced review: daily workload, difficulty ceiling, leeches -----

     These three exist because a review queue behaves differently from
     practice, and each rule is there to stop a specific failure mode.

     DAILY_REVIEW_CAP — come back after two weeks away and the honest queue
     is eighty concepts. Showing that number is how people quit. The cap is
     counted per calendar day (not per session), so opening Review twice in
     an evening doesn't hand out forty questions.

     reachedTier — practice pushes you up a difficulty tier once a concept
     is solid. Review must not: it is checking that something still holds,
     not advancing you. So a review question is served at the highest tier
     you have actually answered correctly, and no higher.

     leeches — a concept you have failed five times does not need a sixth
     question, it needs the lesson again. Anki calls these leeches and
     suspends them; here they are pulled out of the queue and surfaced
     separately with a link, so the queue stays clearable instead of
     accumulating a permanent core of things you always get wrong. */
  var DAILY_REVIEW_CAP = 20;
  var LEECH_WRONG = 4;
  var LEECH_STRENGTH = 0.45;

  function dayKey(ts){ return new Date(ts || now()).toISOString().slice(0, 10); }

  // Called once per answered review question, so the cap is a real daily
  // budget rather than a per-session one.
  function noteReview(){
    var d = read();
    var k = dayKey();
    d.reviews[k] = (d.reviews[k] || 0) + 1;
    // Keep a fortnight; older days are only noise.
    Object.keys(d.reviews).forEach(function(day){
      if((now() - new Date(day + 'T00:00:00Z').getTime()) > 14 * DAY) delete d.reviews[day];
    });
    write(d);
  }
  function reviewsToday(){ return read().reviews[dayKey()] || 0; }
  function reviewsRemainingToday(){ return Math.max(0, DAILY_REVIEW_CAP - reviewsToday()); }

  // Highest tier this concept has ever been answered correctly at. Review
  // holds here; it never promotes.
  function reachedTier(conceptId){
    var st = stateOf(read(), conceptId);
    if(!st || !st.tiers) return 1;
    var best = 1;
    Object.keys(st.tiers).forEach(function(t){
      if(st.tiers[t].c > 0) best = Math.max(best, parseInt(t, 10));
    });
    return best;
  }

  function isLeech(p){
    if(!(p.attempts > 0 && (p.attempts - p.correct) >= LEECH_WRONG)) return false;
    if(p.strength === null || p.strength >= LEECH_STRENGTH) return false;
    // Bench lifted. The leech rule's whole demand is "go re-read the lesson";
    // if that happened after the last attempt, the demand is met and the
    // concept goes back in the queue to be re-tested. Leaving it benched
    // would mean the site set homework and then ignored that it was done.
    if(p.lesson && p.lesson >= (p.seen || 0)) return false;
    return true;
  }
  function leeches(){
    return allProfiles().filter(isLeech).sort(function(a, b){ return a.strength - b.strength; });
  }

  /* One implementation of "a lesson step was answered", shared by the lesson
     engine and the four hand-written mechanism pages. Those pages predate the
     engine and each own their step loop, so without this they would each need
     their own copy of the tier, the share, and the first-attempt rule — and
     the copies would drift, which is exactly how the site ended up with two
     disagreeing progress stores in the first place.

     Returns a recorder. Call it once per answer with a stable step key:
       rec(correct, stepIndex, { concept:'backside-attack' })
       rec(correct, stepIndex, { text: cfg.title })   // infer from step text
       rec(correct, stepIndex)                        // topic's primary concept
     Repeat calls for the same key are ignored, because lesson questions let
     you retry until you get it: counting every attempt logs one guess as both
     a miss and a hit, counting the last scores everybody perfect. The first
     answer is the only honest sample. */
  function lessonRecorder(topicId){
    var graded = {};
    return function(correct, stepKey, opts){
      var key = String(stepKey === undefined ? 'x' : stepKey);
      if(graded[key]) return null;
      graded[key] = true;
      opts = opts || {};
      var CN = window.OchemConcepts;

      /* A step can name several concepts, because real lesson questions do
         combine them — "why does OR leave instead of NH2" is leaving-group
         ability first and the tetrahedral intermediate second. Credit splits
         rather than claiming full evidence for each, same rule the question
         engine uses for multi-concept questions. */
      var ids = [];
      if(opts.concepts && opts.concepts.length){
        ids = opts.concepts.filter(function(c){ return CN.get(c); });
      } else if(opts.concept && CN.get(opts.concept)){
        ids = [opts.concept];
      }
      if(!ids.length && opts.text){
        var inferred = CN.inferConcept(String(opts.text).replace(/<[^>]*>/g, ' '), topicId);
        if(inferred) ids = [inferred];
      }
      if(!ids.length) ids = [CN.defaultConceptFor(topicId)];

      /* Tier 1 and half share on the primary. The explanation is on screen
         directly above the question, so this is real evidence but weaker
         than answering the same idea cold in Practice — it must not carry a
         concept to "mastered" on its own. */
      var out = null;
      ids.forEach(function(id, i){
        var r = record(id, correct, { tier: 1, share: i === 0 ? 0.5 : 0.25 });
        if(i === 0) out = r;
      });
      return out;
    };
  }

  /* ---- lessons as evidence -------------------------------------------

     A finished lesson is not proof of mastery. Clicking Continue through an
     explanation is nothing like answering cold, so reading a lesson never
     moves `s` — only answered questions do that.

     What it does do is lift the leech bench. The leech rule exists to say
     "stop drilling this, go read it"; if the student actually goes and
     reads it, the bench has done its job and the concept has to be allowed
     back into the queue to be re-tested. Without this the site hands out
     homework and then ignores that it was done. */
  function noteLesson(topicId){
    var ids = window.OchemConcepts.byTopic(topicId);
    if(!ids || !ids.length) return 0;
    var d = read(), t = now();
    ids.forEach(function(id){
      d.concepts[id] = d.concepts[id] || blankConcept();
      d.concepts[id].lesson = t;
    });
    write(d);
    return ids.length;
  }

  function lessonReadAt(conceptId){
    var st = stateOf(read(), conceptId);
    return (st && st.lesson) || 0;
  }

  /* ---- topic rollup ---------------------------------------------------

     Learn and Mastery think in topics; everything else thinks in concepts.
     This is the bridge. Attempts-weighted rather than a flat mean: a topic
     where one concept has been drilled twenty times and four have been seen
     once should read mostly as the drilled one, not as an average that four
     thin samples can swing. `coverage` is how much of the topic has been
     touched at all, which is what separates "60% on this topic" from "60%
     on the one sixth of this topic you have actually tried". */
  function topicStrength(topicId){
    var ids = window.OchemConcepts.byTopic(topicId);
    if(!ids || !ids.length) return { strength:null, attempts:0, touched:0, total:0, coverage:0 };
    var d = read(), num = 0, den = 0, touched = 0, attempts = 0;
    ids.forEach(function(id){
      var st = stateOf(d, id);
      if(!st || !st.n) return;
      touched++; attempts += st.n;
      var w = Math.min(st.n, 8);               // cap so one over-drilled concept can't own the topic
      num += clamp(decayed(st), 0, 1) * w;
      den += w;
    });
    return {
      strength: den ? num / den : null,
      attempts: attempts,
      touched: touched,
      total: ids.length,
      coverage: ids.length ? touched / ids.length : 0
    };
  }

  // Same rollup, one level up: every topic in a curriculum module.
  function topicsStrength(topicIds){
    var num = 0, den = 0, touched = 0, total = 0, attempts = 0;
    (topicIds || []).forEach(function(t){
      var r = topicStrength(t);
      total += r.total; touched += r.touched; attempts += r.attempts;
      if(r.strength !== null){ var w = Math.min(r.attempts, 24); num += r.strength * w; den += w; }
    });
    return {
      strength: den ? num / den : null,
      attempts: attempts, touched: touched, total: total,
      coverage: total ? touched / total : 0
    };
  }

  // Concept families (from concepts.js) as a breakdown for the Mastery page.
  function familyRollup(){
    var d = read();
    var out = {};
    window.OchemConcepts.ALL.forEach(function(c){
      var f = out[c.family] || (out[c.family] = { family:c.family, num:0, den:0, touched:0, total:0, attempts:0 });
      f.total++;
      var st = stateOf(d, c.id);
      if(st && st.n){
        f.touched++; f.attempts += st.n;
        var w = Math.min(st.n, 8);
        f.num += clamp(decayed(st), 0, 1) * w;
        f.den += w;
      }
    });
    return Object.keys(out).map(function(k){
      var f = out[k];
      return {
        family: f.family,
        strength: f.den ? f.num / f.den : null,
        touched: f.touched, total: f.total, attempts: f.attempts,
        coverage: f.total ? f.touched / f.total : 0
      };
    });
  }

  function reset(){
    try{ localStorage.removeItem(KEY); }catch(e){}
  }

  window.OchemMastery = {
    TIERS: TIERS,
    BANDS: BANDS,
    record: record,
    recordMistake: recordMistake,
    clearMistake: clearMistake,
    mistakes: mistakes,
    recordSession: recordSession,
    sessions: sessions,
    streakDays: streakDays,
    strength: strength,
    profile: profile,
    allProfiles: allProfiles,
    targetTier: targetTier,
    needScore: needScore,
    weakest: weakest,
    strongest: strongest,
    due: due,
    weakPrerequisites: weakPrerequisites,
    DAILY_REVIEW_CAP: DAILY_REVIEW_CAP,
    noteReview: noteReview,
    reviewsToday: reviewsToday,
    reviewsRemainingToday: reviewsRemainingToday,
    reachedTier: reachedTier,
    isLeech: isLeech,
    leeches: leeches,
    overall: overall,
    counts: counts,
    bandFor: bandFor,
    lessonRecorder: lessonRecorder,
    noteLesson: noteLesson,
    lessonReadAt: lessonReadAt,
    topicStrength: topicStrength,
    topicsStrength: topicsStrength,
    familyRollup: familyRollup,
    reset: reset
  };
})();
