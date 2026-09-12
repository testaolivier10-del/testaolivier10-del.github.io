/* Ochem game layer — XP, concept badges, daily Rounds, and review debt.

   The shared engine (assets/hub-progress.js) owns the level and the streak.
   This file owns the ochem-specific question of WHAT EARNS XP, and it is
   built on one rule: every reward has to track something the mastery engine
   already believes, so none of it can be farmed.

   Concretely:

   TIER-WEIGHTED XP. mastery-engine.js already weights a correct answer on a
   challenge question as stronger evidence than a correct answer on a
   foundational one. XP uses the same ordering, so grinding tier-1 questions
   pays visibly less than working at the edge of what you know. Answering is
   worth nothing on its own — only correct answers pay.

   BADGES FROM STRENGTH, NOT ACCURACY. The NREMT app awards domain badges on
   raw accuracy, which you can farm by answering easy questions. Here a
   concept badge is gated on the mastery engine's decayed strength estimate
   plus a minimum number of attempts, so a badge means "you still know this",
   not "you once had a good run". Strength decays, so badges are checked (and
   only ever awarded) on real evidence, never revoked — losing a badge you
   earned would punish the honest case of taking a week off.

   DAILY ROUNDS. The engine already computes which concepts are due today.
   Surfacing that as a small daily target is a daily goal that happens to be
   exactly the right thing to study, rather than an arbitrary quota.

   REVIEW DEBT instead of a punishing streak. Overdue concepts accumulate
   visibly and clear when you review them. Missing a day costs you nothing —
   it just shows you the backlog, which is the honest signal.

   ---------------------------------------------------------------------
   Storage: localStorage['ochem_game_v1']
     { v:1, conceptTiers: { <conceptId>: 1|2|3 },
            lessons: { <topicId>: 1 }, mechanisms: { <topicId>: 1 },
            quest: { day: 'YYYY-MM-DD', target: n, done: n, claimed: bool },
            achievements: { <id>: ts },
            totals: { sessions, correct, asked } }

   XP itself is not stored here — it goes straight to HubProgress under the
   'ochem' subject, so it counts toward the same site-wide level.
   ------------------------------------------------------------------ */
(function(){
  var KEY = 'ochem_game_v1';

  // XP per correct answer by difficulty tier (1..4). The gap is deliberate:
  // a challenge question is worth nearly four foundational ones.
  var TIER_XP = [0, 6, 10, 15, 22];
  var SESSION_BONUS = 25;         // for finishing a session at all
  var LESSON_XP = 40;             // first completion of a lesson
  var MECHANISM_XP = 60;          // first completion of a mechanism walkthrough
  var ROUNDS_BONUS = 50;          // completing the day's due queue
  var PERFECT_BONUS = 30;         // a flawless session of 5+ questions

  // Concept badge tiers. Each needs real strength AND enough attempts, so a
  // lucky first answer can't mint one.
  var CONCEPT_TIERS = [
    { key: 'solid',    label: 'Solid',    strength: 0.60, minAttempts: 4, xp: 20 },
    { key: 'strong',   label: 'Strong',   strength: 0.80, minAttempts: 6, xp: 35 },
    { key: 'mastered', label: 'Mastered', strength: 0.92, minAttempts: 8, xp: 50 },
  ];

  function M(){ return window.OchemMastery; }
  function HP(){ return window.HubProgress; }

  function load(){
    var d;
    try{ d = JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){ d = null; }
    if(!d || d.v !== 1){
      d = { v:1, conceptTiers:{}, lessons:{}, mechanisms:{}, quest:null, achievements:{},
            totals:{ sessions:0, correct:0, asked:0 } };
    }
    d.conceptTiers = d.conceptTiers || {};
    d.lessons = d.lessons || {};
    d.mechanisms = d.mechanisms || {};
    d.achievements = d.achievements || {};
    d.totals = d.totals || { sessions:0, correct:0, asked:0 };
    return d;
  }
  function save(d){
    try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){}
  }

  function award(amount, reason){
    if(!HP() || !amount) return null;
    var res = HP().award('ochem', amount);
    lastAwards.push({ xp: amount, reason: reason });
    return res;
  }

  // Collected during a session and reported in the summary, so the student
  // sees WHERE the XP came from rather than one opaque number.
  var lastAwards = [];
  function takeAwards(){
    var out = lastAwards;
    lastAwards = [];
    return out;
  }

  /* ---- per-answer: tier-weighted, correct answers only ---------------- */

  var pending = { xp: 0, correct: 0, asked: 0 };

  function onAnswer(conceptId, correct, tier){
    pending.asked++;
    if(!correct) return;
    pending.correct++;
    pending.xp += TIER_XP[Math.max(1, Math.min(4, tier || 2))];
  }

  /* ---- concept badges: checked against decayed strength ---------------- */

  // Returns the newly crossed tiers so the summary can call them out.
  function checkConceptBadges(conceptIds){
    var m = M();
    if(!m) return [];
    var d = load(), crossed = [], gained = 0;
    (conceptIds || []).forEach(function(id){
      var p = m.profile(id);
      if(!p || p.strength === null) return;
      var have = d.conceptTiers[id] || 0;
      CONCEPT_TIERS.forEach(function(t, i){
        if(have <= i && p.attempts >= t.minAttempts && p.strength >= t.strength){
          have = i + 1;
          gained += t.xp;
          crossed.push({ concept: id, name: (p.concept && p.concept.name) || id, tier: t });
        }
      });
      if(have !== (d.conceptTiers[id] || 0)) d.conceptTiers[id] = have;
    });
    save(d);
    if(gained) award(gained, crossed.length + ' concept badge' + (crossed.length === 1 ? '' : 's'));
    return crossed;
  }

  function conceptTier(conceptId){ return load().conceptTiers[conceptId] || 0; }
  function conceptTierCounts(){
    var d = load(), out = { solid:0, strong:0, mastered:0 };
    Object.keys(d.conceptTiers).forEach(function(id){
      var t = d.conceptTiers[id];
      if(t >= 1) out.solid++;
      if(t >= 2) out.strong++;
      if(t >= 3) out.mastered++;
    });
    return out;
  }

  /* ---- daily Rounds ---------------------------------------------------- */

  // The day's target is the size of the due queue when the day's first look
  // happens, capped so a long absence doesn't set an impossible goal — the
  // rest stays visible as review debt instead.
  var ROUNDS_CAP = 15, ROUNDS_MIN = 5;

  function today(){ return HP() ? HP().dayKey(0) : new Date().toISOString().slice(0, 10); }

  function quest(){
    var d = load();
    var t = today();
    if(!d.quest || d.quest.day !== t){
      var dueCount = M() ? M().due().length : 0;
      d.quest = {
        day: t,
        target: Math.max(ROUNDS_MIN, Math.min(ROUNDS_CAP, dueCount || ROUNDS_MIN)),
        done: 0,
        claimed: false,
      };
      save(d);
    }
    return d.quest;
  }

  function advanceQuest(n){
    quest();                 // makes sure today's quest exists before mutating
    var d = load();
    d.quest.done += (n || 0);
    var justCompleted = !d.quest.claimed && d.quest.done >= d.quest.target;
    if(justCompleted) d.quest.claimed = true;
    save(d);
    if(justCompleted){
      award(ROUNDS_BONUS, 'Daily Rounds complete');
      unlock('rounds_first');
      var streak = roundsStreak(true);
      if(streak >= 7) unlock('rounds_7');
    }
    return { quest: d.quest, justCompleted: justCompleted };
  }

  // Days on which Rounds were completed, counted back from today. Stored as a
  // small list rather than derived from sessions, because "did the day's due
  // work" is a different claim from "opened the app".
  function roundsStreak(recordToday){
    var d = load();
    d.roundsDays = d.roundsDays || [];
    if(recordToday && d.roundsDays.indexOf(today()) === -1){
      d.roundsDays.push(today());
      if(d.roundsDays.length > 180) d.roundsDays.shift();
      save(d);
    }
    var set = {};
    d.roundsDays.forEach(function(x){ set[x] = true; });
    var n = 0, i = set[today()] ? 0 : -1;
    while(HP() && set[HP().dayKey(i)]){ n++; i--; }
    return n;
  }

  /* ---- review debt ------------------------------------------------------ */

  // Not a score and not a punishment: how much overdue work is waiting, and
  // how far past due the worst of it is.
  function reviewDebt(){
    var m = M();
    if(!m) return { count: 0, worstDays: 0, level: 'clear' };
    var due = m.due();
    var now = Date.now();
    var worst = 0;
    due.forEach(function(p){
      var days = Math.floor((now - p.due) / 86400000);
      if(days > worst) worst = days;
    });
    var level = due.length === 0 ? 'clear'
      : due.length <= 5 ? 'light'
      : due.length <= 15 ? 'building'
      : 'heavy';
    return { count: due.length, worstDays: worst, level: level };
  }

  /* ---- achievements ----------------------------------------------------- */

  var ACHIEVEMENTS = [
    { id: 'first_session',  icon: '⚗️', label: 'First session',      blurb: 'Finish a practice session.' },
    { id: 'first_mechanism',icon: '➡️', label: 'Pushed the arrows',  blurb: 'Complete a mechanism walkthrough.' },
    { id: 'rounds_first',   icon: '✅',       label: 'Daily Rounds',       blurb: 'Clear a day’s due queue.' },
    { id: 'rounds_7',       icon: '🔥', label: '7 days of Rounds',   blurb: 'Clear the due queue seven days running.' },
    { id: 'perfect',        icon: '🎯', label: 'Flawless',           blurb: 'A perfect session of 5+ questions.' },
    { id: 'ten_solid',      icon: '🧪', label: '10 concepts solid',  blurb: 'Reach Solid on ten concepts.' },
    { id: 'ten_mastered',   icon: '🏅', label: '10 concepts mastered',blurb: 'Reach Mastered on ten concepts.' },
    { id: 'debt_zero',      icon: '✨',       label: 'Nothing overdue',    blurb: 'Empty the review queue completely.' },
    { id: 'all_lessons',    icon: '📘', label: 'Read the course',    blurb: 'Complete every lesson.' },
  ];

  function unlock(id){
    var d = load();
    if(d.achievements[id]) return false;
    d.achievements[id] = Date.now();
    save(d);
    return true;
  }
  function achievements(){
    var d = load();
    return ACHIEVEMENTS.map(function(a){
      return { id: a.id, icon: a.icon, label: a.label, blurb: a.blurb, earned: !!d.achievements[a.id], at: d.achievements[a.id] || 0 };
    });
  }

  function checkStandingAchievements(){
    var counts = conceptTierCounts();
    if(counts.solid >= 10) unlock('ten_solid');
    if(counts.mastered >= 10) unlock('ten_mastered');
    var d = load();
    if(Object.keys(d.lessons).length >= 58) unlock('all_lessons');
    if(d.totals.sessions > 0 && reviewDebt().count === 0) unlock('debt_zero');
  }

  /* ---- session & lesson hooks (called from mastery-engine.js) ----------- */

  function onSession(summary){
    var asked = summary.asked || 0;
    var correct = summary.correct || 0;
    var concepts = summary.concepts || [];

    var d = load();
    d.totals.sessions++;
    d.totals.asked += asked;
    d.totals.correct += correct;
    save(d);

    // Tier-weighted XP accrued per answer, plus the flat completion bonus.
    // Falls back to a flat rate if this page never routed answers through
    // onAnswer (a mode that records sessions but not individual concepts).
    var base = pending.asked ? pending.xp : correct * TIER_XP[2];
    if(asked) award(base + SESSION_BONUS, asked + ' questions');
    if(asked >= 5 && correct === asked){
      award(PERFECT_BONUS, 'Perfect session');
      unlock('perfect');
    }
    if(d.totals.sessions === 1) unlock('first_session');

    // The shared streak: a day of ochem keeps the site-wide flame alive.
    if(HP()) HP().recordActivity('ochem', asked);

    var crossed = checkConceptBadges(concepts);
    var questResult = advanceQuest(asked);
    checkStandingAchievements();

    pending = { xp: 0, correct: 0, asked: 0 };

    lastResult = {
      awards: takeAwards(),
      conceptBadges: crossed,
      quest: questResult.quest,
      questCompleted: questResult.justCompleted,
      level: HP() ? HP().levelInfo('ochem') : null,
      debt: reviewDebt(),
    };
    return lastResult;
  }

  // recordSession() is called from inside the mastery engine, so the page that
  // triggered it never sees the return value. It reads the result from here
  // instead, right after, to render the session's rewards.
  var lastResult = null;
  function lastSession(){ return lastResult; }

  // Called the first time a lesson or mechanism walkthrough is completed.
  // kind: 'lesson' | 'mechanism'.
  function onTopicComplete(topicId, kind){
    if(!topicId) return null;
    var d = load();
    var bucket = kind === 'mechanism' ? d.mechanisms : d.lessons;
    if(bucket[topicId]) return null;      // XP is for the first completion only
    bucket[topicId] = 1;
    save(d);
    var xp = kind === 'mechanism' ? MECHANISM_XP : LESSON_XP;
    award(xp, kind === 'mechanism' ? 'Mechanism complete' : 'Lesson complete');
    if(kind === 'mechanism') unlock('first_mechanism');
    if(HP()) HP().recordActivity('ochem', 1);
    checkStandingAchievements();
    return { xp: xp, awards: takeAwards(), level: HP() ? HP().levelInfo('ochem') : null };
  }

  /* ---- the reward strip shown at the end of a session ------------------
     Lives here rather than in each page so Practice and Review report the
     same thing the same way. Returns '' when there is nothing to report, so
     a caller can concatenate it unconditionally. */
  function summaryHtml(){
    var r = lastResult;
    if(!r || !r.awards.length) return '';
    function esc(x){
      return String(x).replace(/[&<>"]/g, function(c){
        return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
      });
    }
    var total = r.awards.reduce(function(a, x){ return a + x.xp; }, 0);
    var lines = r.awards.map(function(a){
      return '<span class="xp-line">+' + a.xp + ' <em>' + esc(a.reason) + '</em></span>';
    }).join('');
    var badges = r.conceptBadges.length
      ? '<p class="xp-badges">' + r.conceptBadges.map(function(b){
          return esc(b.name) + ' \u2192 <b>' + esc(b.tier.label) + '</b>';
        }).join(' &middot; ') + '</p>'
      : '';
    var quest = r.questCompleted
      ? '<p class="xp-quest">Daily Rounds complete.</p>'
      : (r.quest ? '<p class="xp-quest">Daily Rounds: ' + Math.min(r.quest.done, r.quest.target) + ' / ' + r.quest.target + '</p>' : '');
    var lvl = r.level
      ? '<span class="xp-level">Level ' + r.level.level + ' &middot; ' + esc(r.level.title) + '</span>'
      : '';
    return '<div class="xp-strip">' +
      '<div class="xp-total">+' + total + ' XP</div>' +
      '<div class="xp-lines">' + lines + '</div>' +
      badges + quest + lvl +
    '</div>';
  }

  window.OchemXP = {
    onAnswer: onAnswer,
    onSession: onSession,
    onTopicComplete: onTopicComplete,
    lastSession: lastSession,
    summaryHtml: summaryHtml,
    quest: quest,
    roundsStreak: roundsStreak,
    reviewDebt: reviewDebt,
    conceptTier: conceptTier,
    conceptTierCounts: conceptTierCounts,
    achievements: achievements,
    totals: function(){ return load().totals; },
    lessonsCompleted: function(){ return Object.keys(load().lessons).length; },
    mechanismsCompleted: function(){ return Object.keys(load().mechanisms).length; },
    CONCEPT_TIERS: CONCEPT_TIERS,
    TIER_XP: TIER_XP,
  };

  // Ochem's own synced keys. 'hub' (level + streak) is registered separately
  // by hub-progress.js, so signing in carries both.
  if(window.StudyHubAccount){
    window.StudyHubAccount.registerNamespace('ochem', [
      'ochem_progress', 'ochem_mastery_v1', KEY,
      // Which textbook sections you've read. Coverage, not competence — it
      // never feeds mastery — but it's the kind of thing that's maddening to
      // lose when you pick the course up on another device.
      'ochem_textbook_read',
    ]);
  }
})();
