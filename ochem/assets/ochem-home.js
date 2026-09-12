/* Course home page — turns the static markup in index.html into a reading of
   where you actually are.

   Everything here is a view over state something else owns: the level and
   streak come from the shared hub engine (one level across every subject),
   module mastery from OchemCurriculum, and the due queue and daily Rounds
   from ochem-xp.js. Nothing is computed twice.

   The markup in index.html is the first-visit state and is correct on its own
   — with JS off, or before any lesson has been finished, the page still reads
   as a course you can start. This script only upgrades what it has real data
   for, so a card whose state can't be established is left exactly as authored.

   Kept out of an inline <script> because it builds href="..." by
   concatenation, which the site's link checker textually scans .html files
   for (see scripts/check-site.mjs). */
(function(){
  var C = window.OchemCurriculum;
  var XP = window.OchemXP;
  var HP = window.HubProgress;
  if(!C) return;

  var base = window.OCHEM_BASE || '';

  /* Hero bars need a label that fits in a 13px row; the curriculum's own
     module titles ("Organic Structure & Electron Movement") do not. */
  var SHORT = {
    'foundations':'Foundations',
    'electron-movement':'Electron movement',
    'acids-bases':'Acids & bases',
    'alkanes-conformations':'Conformations',
    'stereochemistry':'Stereochem',
    'substitution-elimination':'Sub / elim',
    'alkenes-alkynes':'Alkenes',
    'alcohols-ethers':'Alcohols',
    'carbonyl-chemistry':'Carbonyls',
    'carboxylic-acids':'Acids & esters',
    'enolate-chemistry':'Enolates',
    'amines':'Amines',
    'aromatic-chemistry':'Aromatics',
    'spectroscopy':'Spectroscopy'
  };
  var BAR_COLORS = ['#2C9C8B','#E8776A','#C9973A'];

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function el(id){ return document.getElementById(id); }
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }
  function readProgress(){
    try{ var raw = localStorage.getItem('ochem_progress'); return raw ? JSON.parse(raw) : {}; }
    catch(e){ return {}; }
  }

  /* The module a topic belongs to, for the "Module 2 · Electron Movement"
     line on the resume card. */
  function moduleOf(topicId){
    for(var i = 0; i < C.MODULES.length; i++){
      var m = C.MODULES[i];
      for(var j = 0; j < m.topics.length; j++){
        if(m.topics[j].id === topicId) return { mod: m, index: i + 1 };
      }
    }
    return null;
  }

  /* ---- hero progress card ---------------------------------------------- */

  function renderHero(){
    if(!HP) return;
    var info = HP.levelInfo('ochem');
    el('heroLevelRing').textContent = 'L' + info.level;
    el('heroLevelTitle').textContent = info.title;
    el('heroLevelSub').textContent = 'Level ' + info.level + ' · ' + info.total + ' XP';
    el('heroXpFill').style.width = Math.min(100, Math.round(info.into / info.span * 100)) + '%';
    el('heroXpLabel').textContent = info.total + ' / ' + (info.total + info.toNext) +
      ' XP to Level ' + (info.level + 1);

    var streak = HP.streak();
    var chip = el('heroStreak');
    chip.hidden = streak.current < 1;
    el('heroStreakCount').textContent = streak.current;

    // The four modules with the most finished lessons, so the card stays
    // compact and shows the work you've actually done rather than a wall of
    // fourteen empty bars.
    var p = readProgress();
    var scored = C.MODULES.map(function(m, i){
      var done = m.topics.filter(function(t){
        return t.href && p[t.id] && typeof p[t.id].bestScore === 'number';
      }).length;
      return { mod: m, i: i, done: done, pct: C.moduleMastery(m) };
    }).filter(function(x){ return x.pct !== null && x.done > 0; })
      .sort(function(a, b){ return b.done - a.done; })
      .slice(0, 4);

    var box = el('heroModules');
    if(!scored.length) return; // leave the authored "finish a lesson" note
    box.innerHTML = scored.map(function(x){
      return '<div class="mini-domain-row">' +
        '<span>' + esc(SHORT[x.mod.id] || x.mod.title) + '</span>' +
        '<span class="bar"><i style="width:' + x.pct + '%;--dc:' + BAR_COLORS[x.i % 3] + '"></i></span>' +
        '<span class="pct">' + x.pct + '%</span>' +
      '</div>';
    }).join('');
  }

  /* ---- card 1: the lesson you left partway through ---------------------- */

  // No timestamps are stored against a run, so "where you left off" is the
  // furthest unfinished lesson in curriculum order — the deepest point you've
  // reached, which is what the phrase means to a reader.
  function resumableTopic(){
    var p = readProgress();
    var found = null;
    C.MODULES.forEach(function(m){
      m.topics.forEach(function(t){
        var r = p[t.id];
        if(t.href && r && !r.completed && r.step > 0) found = t;
      });
    });
    return found;
  }

  var resumedTopicId = null;

  function renderResume(){
    var topic = resumableTopic();
    if(!topic) return; // leave the authored "start here" card
    resumedTopicId = topic.id;
    var where = moduleOf(topic.id);
    var LC = window.OchemLessonConcepts;
    var total = LC && LC.MAP[topic.id] ? LC.MAP[topic.id].n : null;
    var step = readProgress()[topic.id].step + 1;
    var pct = total ? Math.min(100, Math.round(step / total * 100)) : null;

    el('homeResume').innerHTML =
      '<div class="k">Pick up where you left off</div>' +
      '<h3>' + esc(topic.title) + '</h3>' +
      '<p>' + (where ? 'Module ' + where.index + ' · ' + esc(where.mod.title) + ' · ' : '') +
        'step ' + step + (total ? ' of ' + total : '') + '</p>' +
      (pct === null ? '' : '<div class="track" style="margin-bottom:16px"><i style="width:' + pct + '%"></i></div>') +
      '<a href="' + base + topic.href + '" class="btn-press">Resume lesson</a>';
  }

  /* ---- card 2: the review queue ---------------------------------------- */

  function renderReview(){
    if(!XP) return;
    var debt = XP.reviewDebt();
    if(!debt.count) return; // leave the authored "nothing due yet" card

    el('homeReview').innerHTML =
      '<div class="k">Due for review</div>' +
      '<h3>' + plural(debt.count, 'concept') + '</h3>' +
      '<p>' + (debt.worstDays > 0
          ? 'The oldest is ' + plural(debt.worstDays, 'day') + ' past due. '
          : '') +
        'Scheduled by how shaky each concept was last time, not by when you studied it.</p>' +
      '<a href="' + base + 'review.html" class="btn-outline" style="padding:10px 18px">Clear the queue</a>';
    el('homeReview').classList.add('due');
  }

  /* ---- card 3: the weak prerequisite, else today's Rounds --------------- */

  // The concept-dependency check the course is built on: "you're struggling
  // with E2, so review conformational analysis first" rather than serving
  // more E2 questions. Reported for the weakest topic that has one.
  function weakestWithPrereqs(){
    var worst = null;
    C.MODULES.forEach(function(m){
      m.topics.forEach(function(t){
        // The resume card is already pointing at this one; two cards saying
        // the same word is worse than one card saying something else.
        if(t.id === resumedTopicId) return;
        var s = C.strugglingPrerequisites(t.id);
        if(s && (!worst || s.score < worst.score)) worst = s;
      });
    });
    return worst;
  }

  function renderNext(){
    var weak = weakestWithPrereqs();
    if(weak){
      var prereq = weak.prerequisites[0];
      el('homeNext').innerHTML =
        '<div class="k">Shore this up first</div>' +
        '<h3>' + esc(weak.topic.title) + ' is at ' + weak.score + '%</h3>' +
        '<p>Before more of it: ' +
          (weak.prerequisites.length > 1
            ? 'it leans on ' + weak.prerequisites.length + ' earlier topics, starting with '
            : 'it leans on ') +
          esc(prereq.title).toLowerCase() + '.</p>' +
        (prereq.href
          ? '<a href="' + base + prereq.href + '" class="link-quiet">Review ' + esc(prereq.title).toLowerCase() + ' →</a>'
          : '<p style="margin:0"><em>That lesson hasn\'t been built yet.</em></p>');
      return;
    }
    if(!XP) return;
    var q = XP.quest();
    var done = Math.min(q.done, q.target);
    el('homeNext').innerHTML =
      '<div class="k">Daily Rounds</div>' +
      '<h3>' + done + ' of ' + q.target + '</h3>' +
      '<p>' + (done >= q.target
          ? 'Done for today. A fresh set is drawn from your due queue tomorrow.'
          : 'A short set drawn from what you are closest to forgetting.') + '</p>' +
      '<div class="track" style="margin-bottom:16px"><i style="width:' +
        Math.round(done / q.target * 100) + '%"></i></div>' +
      '<a href="' + base + 'practice.html" class="link-quiet">Practice now →</a>';
  }

  /* ---- the three tiers -------------------------------------------------- */

  // Tier membership is authored in the markup (data-modules="1-3"), so the
  // page says what it groups and this only fills in the readings.
  function renderTiers(){
    var p = readProgress();
    Array.prototype.forEach.call(document.querySelectorAll('[data-modules]'), function(tier){
      var span = tier.getAttribute('data-modules').split('-');
      var from = parseInt(span[0], 10) - 1;
      var to = parseInt(span[1] || span[0], 10) - 1;
      var mods = C.MODULES.slice(from, to + 1);

      var scores = [];
      mods.forEach(function(m){
        m.topics.forEach(function(t){
          var s = C.topicMastery(t.id);
          if(t.href && s !== null) scores.push(s);
        });
      });

      var pctEl = tier.querySelector('.pct');
      var fill = tier.querySelector('.track > i');
      if(scores.length){
        var avg = Math.round(scores.reduce(function(a, b){ return a + b; }, 0) / scores.length);
        if(pctEl){ pctEl.textContent = avg + '%'; pctEl.removeAttribute('style'); }
        if(fill) fill.style.width = avg + '%';
      }

      // A chip goes teal once that lesson has been finished at least once,
      // amber while a run is open — the same two states the tier bar averages.
      Array.prototype.forEach.call(tier.querySelectorAll('[data-topic]'), function(chip){
        var r = p[chip.getAttribute('data-topic')];
        if(!r) return;
        if(typeof r.bestScore === 'number') chip.classList.add('done');
        else if(r.step > 0) chip.classList.add('open');
      });
    });
  }

  function render(){
    try{ renderHero(); }catch(e){}
    try{ renderResume(); }catch(e){}
    try{ renderReview(); }catch(e){}
    try{ renderNext(); }catch(e){}
    try{ renderTiers(); }catch(e){}
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
