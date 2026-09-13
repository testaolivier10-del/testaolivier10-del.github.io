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

  /* ---- card 2: today ------------------------------------------------
     One card for the day's work: what is due for review and how far
     through the daily Rounds you are. These used to be two cards that read
     the same queue from two angles. A weak prerequisite, when the engine
     finds one, is the one line worth adding here. */
  function renderToday(){
    if(!XP) return;
    var debt = XP.reviewDebt();
    var q = XP.quest();
    var done = Math.min(q.done, q.target);
    var weak = weakestWithPrereqs();
    if(!debt.count && !done && !weak) return; // leave the authored first-visit card

    var head, sub;
    if(done >= q.target){
      head = 'Done for today';
      sub = 'A fresh set is drawn from your due queue tomorrow.';
    } else if(debt.count){
      head = plural(debt.count, 'concept') + ' due';
      sub = (debt.worstDays > 0 ? 'The oldest is ' + plural(debt.worstDays, 'day') + ' past due. ' : '') +
            'Today\'s Rounds: ' + done + ' of ' + q.target + ' done.';
    } else {
      head = 'Rounds: ' + done + ' of ' + q.target;
      sub = 'A short set drawn from what you are closest to forgetting.';
    }
    var prereqLine = '';
    if(weak && weak.prerequisites[0]){
      var pre = weak.prerequisites[0];
      prereqLine = '<p><b>' + esc(weak.topic.title) + '</b> is at ' + weak.score + '%. It leans on ' +
        (pre.href ? '<a href="' + base + pre.href + '">' + esc(pre.title).toLowerCase() + '</a>' : esc(pre.title).toLowerCase()) +
        ' — review that first.</p>';
    }
    el('homeToday').innerHTML =
      '<div class="k">Today</div>' +
      '<h3>' + head + '</h3>' +
      '<p>' + sub + '</p>' +
      '<div class="track thin" style="margin-bottom:14px"><i style="width:' + Math.round(done / q.target * 100) + '%"></i></div>' +
      prereqLine +
      '<a href="' + base + (debt.count ? 'review.html' : 'practice.html') + '" class="btn-press alt sm">' +
        (debt.count ? 'Clear the queue' : 'Start Rounds') + '</a>';
    if(debt.count) el('homeToday').classList.add('due');
  }

  // The concept-dependency check the course is built on: "you're struggling
  // with E2, so review conformational analysis first" rather than serving
  // more E2 questions. Reported for the weakest topic that has one.
  function weakestWithPrereqs(){
    var worst = null;
    C.MODULES.forEach(function(m){
      m.topics.forEach(function(t){
        if(t.id === resumedTopicId) return;
        var s = C.strugglingPrerequisites(t.id);
        if(s && (!worst || s.score < worst.score)) worst = s;
      });
    });
    return worst;
  }

  /* ---- the module list ----------------------------------------------
     One row per module, authored in the markup; this fills the reading and
     marks the module you're in — the one holding the lesson you'd resume,
     else the first with an unfinished lesson. */
  function renderModules(){
    var p = readProgress();
    var current = null;
    if(resumedTopicId){ var w = moduleOf(resumedTopicId); if(w) current = w.mod.id; }
    C.MODULES.forEach(function(m){
      var row = document.querySelector('.mod[data-module="' + m.id + '"]');
      if(!row) return;
      // Chips inside the row: teal once finished, amber while a run is open.
      Array.prototype.forEach.call(row.querySelectorAll('[data-topic]'), function(chip){
        var r = p[chip.getAttribute('data-topic')];
        if(!r) return;
        if(typeof r.bestScore === 'number') chip.classList.add('done');
        else if(r.step > 0) chip.classList.add('open');
      });
      var scores = [];
      var firstOpen = null;
      m.topics.forEach(function(t){
        if(!t.href) return;
        var s = C.topicMastery(t.id);
        if(s !== null) scores.push(s);
        var r = p[t.id];
        if(!firstOpen && !(r && r.completed)) firstOpen = t;
      });
      if(!current && firstOpen && scores.length) current = m.id;
      if(scores.length){
        var avg = Math.round(scores.reduce(function(a, b){ return a + b; }, 0) / scores.length);
        var fill = row.querySelector('.track > i'); if(fill) fill.style.width = avg + '%';
        var pct = row.querySelector('.pct'); if(pct) pct.textContent = avg + '%';
      }

    });
    if(!current){
      // Nothing scored yet: the first module with an unfinished lesson.
      C.MODULES.some(function(m){
        var open = m.topics.some(function(t){ var r = p[t.id]; return t.href && !(r && r.completed); });
        if(open) current = m.id;
        return open;
      });
    }
    if(current){
      var cur = document.querySelector('.mod[data-module="' + current + '"]');
      if(cur){ cur.open = true; var sm = cur.querySelector('.mod-row'); if(sm) sm.classList.add('current'); }
    }
  }

  function render(){
    try{ renderHero(); }catch(e){}
    try{ renderResume(); }catch(e){}
    try{ renderToday(); }catch(e){}
    try{ renderModules(); }catch(e){}
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
