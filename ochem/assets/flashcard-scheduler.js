/* Ochem flashcard scheduler — when each card comes back.

   A small SM-2 variant, the scheduler Anki and SuperMemo descend from, with
   the four self-grades a flashcard app is expected to have. It is kept apart
   from the concept schedule in mastery-engine.js on purpose: that one is fed
   by graded answers to fresh problems, and a card you mark "Good" yourself is
   weaker evidence than a question the engine checked. Flipping cards never
   moves a mastery number; it only decides when a card is shown again.

   ---------------------------------------------------------------------
   Storage: localStorage['ochem_flashcards_v1'], synced with an account
   (registered in ochem-xp.js, which merges two devices' copies card by card).
     { v: 1,
       cards: { <cardId>: { i, e, d, r, l, t } },
       fresh: { day: 'YYYY-MM-DD', n } }
   per card:
     i  interval in days (0 = learning: just seen for the first time, or
        just forgotten, and due again within the session)
     e  ease factor, 1.3..2.8
     d  due, ms timestamp
     r  successful reviews in a row
     l  lapses — times a card that had graduated was forgotten
     t  last graded, ms timestamp (what the sync merge compares)
   fresh counts new cards introduced today, for the daily new-card limit.

   The rules, per grade:
     Again  back in 10 minutes (so later in the same session); interval 0.
            On a card that had graduated this is a lapse: ease -0.20.
     Hard   learning -> 1 day.   review -> max(i + 1, i x 1.2), ease -0.15.
     Good   learning -> 1 day.   review -> 3 days after the 1-day step, then
            max(i + 1, i x ease). Same 1, 3, then x-ease ladder the concept
            schedule uses, so the two pages space things alike.
     Easy   learning -> 4 days.  review -> max(i + 2, i x ease x 1.3),
            ease +0.15.
   Intervals are capped at a year. A day interval lands at local midnight on
   the due day, so "due tomorrow" means tomorrow, not 24 hours from now.

   Studying ahead does not push a card further out. A card graded before it
   is due only changes if you grade it Again — you have just learned you do
   not know it, and that is worth acting on — otherwise its schedule stands.
   Without that rule, flipping through a chapter ahead of an exam would hand
   every card a long interval it never earned.
   ------------------------------------------------------------------ */
(function(){
  var KEY = 'ochem_flashcards_v1';
  var MIN = 60000;

  var AGAIN = 1, HARD = 2, GOOD = 3, EASY = 4;
  var GRADES = [
    null,
    { n: AGAIN, key: 'again', label: 'Again' },
    { n: HARD,  key: 'hard',  label: 'Hard' },
    { n: GOOD,  key: 'good',  label: 'Good' },
    { n: EASY,  key: 'easy',  label: 'Easy' }
  ];

  var EASE_START = 2.5, EASE_MIN = 1.3, EASE_MAX = 2.8;
  var MAX_IVL = 365;
  var RELEARN_MS = 10 * MIN;
  var NEW_PER_DAY = 20;

  function clamp(x, lo, hi){ return x < lo ? lo : (x > hi ? hi : x); }
  function round2(x){ return Math.round(x * 100) / 100; }

  function dayKey(ms){
    var d = new Date(ms);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // Local midnight `days` days after the day containing `ms`. Built with
  // setDate rather than by adding 86400000s, so a DST change cannot land a
  // card at 23:00 the day before.
  function midnightPlus(ms, days){
    var d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d.getTime();
  }

  function isNew(s){ return !s || !s.t; }
  function isDue(s, now){ return !isNew(s) && s.d <= now; }
  function isLearning(s){ return !isNew(s) && s.i === 0; }
  // Graded ahead of schedule. A card in learning (just seen, or just
  // forgotten) is never early: it is meant to come back within the session,
  // and treating that return as studying ahead would freeze it at "Again".
  function isEarly(s, now){ return !isNew(s) && !isLearning(s) && s.d > now; }

  /* The pure step: a card's state and a grade in, the next state out. Never
     mutates its input. `early` means the card was graded before it was due
     (studying ahead), which only an Again can change — see the header. */
  function next(state, grade, now, early){
    grade = Math.round(grade);
    if(grade < AGAIN || grade > EASY) throw new Error('grade must be 1..4');
    var s = state ? { i: state.i || 0, e: state.e || EASE_START, d: state.d || 0, r: state.r || 0, l: state.l || 0, t: state.t || 0 }
                  : { i: 0, e: EASE_START, d: 0, r: 0, l: 0, t: 0 };
    if(early && !isNew(state) && grade !== AGAIN) return s;

    var learning = s.i < 1;
    if(grade === AGAIN){
      if(!learning){ s.l++; s.e = s.e - 0.20; }
      s.i = 0; s.r = 0;
      s.d = now + RELEARN_MS;
    } else {
      var ivl;
      if(learning){
        ivl = grade === EASY ? 4 : 1;
        if(grade === HARD) s.e -= 0.15;
        if(grade === EASY) s.e += 0.15;
      } else if(grade === HARD){
        ivl = Math.max(s.i + 1, Math.round(s.i * 1.2));
        s.e -= 0.15;
      } else if(grade === GOOD){
        ivl = s.i === 1 ? 3 : Math.max(s.i + 1, Math.round(s.i * s.e));
      } else {
        ivl = Math.max(s.i + 2, Math.round(s.i * s.e * 1.3));
        s.e += 0.15;
      }
      s.i = Math.min(MAX_IVL, ivl);
      s.r++;
      s.d = midnightPlus(now, s.i);
    }
    s.e = round2(clamp(s.e, EASE_MIN, EASE_MAX));
    s.t = now;
    return s;
  }

  /* What each button would do, for the label under it: "10m", "1d", "3w". */
  function preview(state, now, early){
    var out = {};
    for(var g = AGAIN; g <= EASY; g++){
      var s = next(state, g, now, early);
      out[g] = early && g !== AGAIN && !isNew(state) ? 'no change' : label(s, now);
    }
    return out;
  }
  function label(s, now){
    if(s.i === 0) return Math.max(1, Math.round((s.d - now) / MIN)) + 'm';
    var d = s.i;
    if(d < 14) return d + 'd';
    if(d < 60) return Math.round(d / 7) + 'w';
    if(d < 365) return Math.round(d / 30) + 'mo';
    return Math.round(d / 365 * 10) / 10 + 'y';
  }

  /* ---- the store --------------------------------------------------------- */

  function blank(){ return { v: 1, cards: {}, fresh: { day: '', n: 0 } }; }
  function load(){
    try{
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if(!d || d.v !== 1 || typeof d.cards !== 'object' || !d.cards) return blank();
      if(!d.fresh || typeof d.fresh !== 'object') d.fresh = { day: '', n: 0 };
      return d;
    }catch(e){ return blank(); }
  }
  function save(d){
    try{ localStorage.setItem(KEY, JSON.stringify(d)); return true; }catch(e){ return false; }
  }

  function introducedToday(d, now){
    return d.fresh && d.fresh.day === dayKey(now) ? (d.fresh.n || 0) : 0;
  }

  /* Grade one card and persist it. Returns { state, scheduled } where
     `scheduled` says whether this was scheduled work (due, or a new card
     being introduced) rather than studying ahead — the page pays XP only
     for the former. */
  function grade(cardId, g, now, opts){
    opts = opts || {};
    var d = load();
    var prev = d.cards[cardId] || null;
    var wasNew = isNew(prev);
    // A new card is never early, even when met while studying ahead: it is
    // being introduced either way, so it is scheduled and counts against
    // today's new-card allowance.
    var early = isEarly(prev, now);
    var s = next(prev, g, now, early);
    if(wasNew){
      var today = dayKey(now);
      if(d.fresh.day !== today) d.fresh = { day: today, n: 0 };
      d.fresh.n++;
    }
    d.cards[cardId] = s;
    save(d);
    return { state: s, scheduled: !early && !opts.cram, wasNew: wasNew, early: early };
  }

  /* Today's work within a set of cards (already filtered by the page):
     every due card, most overdue first, then new cards in the order given
     (curriculum order) up to what is left of the daily allowance. */
  function queue(cardIds, now, opts){
    opts = opts || {};
    var d = opts.store || load();
    var limit = opts.newPerDay === undefined ? NEW_PER_DAY : opts.newPerDay;
    var due = [], fresh = [], learned = 0;
    cardIds.forEach(function(id){
      var s = d.cards[id];
      if(isNew(s)) fresh.push(id);
      else {
        learned++;
        if(s.d <= now) due.push(id);
      }
    });
    due.sort(function(a, b){ return d.cards[a].d - d.cards[b].d; });
    var allowance = Math.max(0, limit - introducedToday(d, now));
    return {
      due: due,
      fresh: fresh.slice(0, allowance),
      newTotal: fresh.length,
      learned: learned,
      allowance: allowance,
      total: cardIds.length
    };
  }

  /* Cards coming due over the next `days` days, for the "coming up" line. */
  function upcoming(cardIds, now, days){
    var d = load(), until = midnightPlus(now, days || 7), n = 0;
    cardIds.forEach(function(id){
      var s = d.cards[id];
      if(!isNew(s) && s.d > now && s.d < until) n++;
    });
    return n;
  }

  window.OchemCardScheduler = {
    KEY: KEY,
    GRADES: GRADES,
    AGAIN: AGAIN, HARD: HARD, GOOD: GOOD, EASY: EASY,
    NEW_PER_DAY: NEW_PER_DAY,
    MAX_IVL: MAX_IVL,
    next: next,
    preview: preview,
    isNew: isNew,
    isDue: isDue,
    isLearning: isLearning,
    isEarly: isEarly,
    load: load,
    save: save,
    get: function(id){ return load().cards[id] || null; },
    grade: grade,
    queue: queue,
    upcoming: upcoming,
    introducedToday: function(now){ return introducedToday(load(), now); },
    dayKey: dayKey
  };
})();
