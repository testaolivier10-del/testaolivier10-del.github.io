/* Milestones: what counts as finishing something, and the moment it happens.

   WHAT IS A MILESTONE
   -------------------
   Each course gets milestones that are earned by work, read from the progress
   the course already keeps. Nothing new is scored here; nothing can be earned
   by opening a page.

     ochem   A chapter is complete when every topic in it has a finished
             lesson run (ochem_progress[topic].bestScore is a number — the
             permanent high-water mark curriculum.js keeps, which a redo never
             clears). A notes-only topic has no lesson to finish, so its
             chapter cannot complete until the lesson ships: the same rule
             curriculum.js applies to mastery, for the same reason.
     anp     A chapter is complete when every BUILT topic in it is in
             anp_progress_v1.lessons (the lesson's check questions answered to
             the end). Each record is a timestamp, so the date earned is real.
     both    The course is complete when every chapter is.
     nremt   No chapters to finish. The milestone is a full-length timed
             practice exam (100 questions, two hours) scored at 80% or higher.
             80 because it is the site's own top band — "On track" in the
             readiness estimate and the top band of exam-finish — not a pass
             mark: the real exam is adaptive and publishes no percentage, so
             the certificate says what was done, not that anyone "passed".
             Mastery tiers were the other candidate and were not used: they
             are per-domain accuracy over every mode, including untimed drills
             of one domain, so they say less about sitting an exam.

   Every list here is COMPUTED from progress on each read and only the date a
   milestone was first seen is stored (levlprep_milestones, with which ones
   have not been celebrated yet), because ochem keeps no completion dates of
   its own. A milestone whose progress is gone
   (browser data cleared) is simply not earned any more; the certificate page
   re-checks the same way and never trusts its own URL.

   THE MOMENT
   ----------
   check(course, topic) runs after a lesson finishes (or an NREMT exam).
   Milestones that turn up earned for the first time are recorded; the one
   that this lesson completed is celebrated, with "View certificate" and a
   share. Any others are recorded quietly — on the first run after this
   shipped, a student who had already finished six chapters should not get
   six dialogs for one lesson.

   Loaded on demand through window.LevlLazy('milestones', fn) (site-chrome.js),
   and directly by certificate.html. The hooks are one line each: ochem's
   completeLessonRun (curriculum.js, uncommented there because the ochem shell
   has no bytes to spare), A&P's lessonComplete (anp-core.js) and NREMT's
   showResults (practice-engine.js). Its styles are milestones.css, linked
   when this loads. The pure parts (evaluate, nremtExam) are
   pinned by scripts/test/milestones.test.mjs. */
(function(){
  if(window.LevlMilestones) return;

  var STORE = 'levlprep_milestones';
  var EXAM_LEN = 100;   // the full timed exam's length (nremt/exams.html)
  var EXAM_PCT = 80;

  var COURSES = {
    nremt: {
      name: 'NREMT-EMT prep', home: '/nremt/', dash: '/nremt/dashboard.html',
      blurb: 'Free NREMT-EMT practice: timed 100-question practice exams written to the published blueprint, study notes, skill sheets and flashcards. Unofficial, and not affiliated with the National Registry.'
    },
    ochem: {
      name: 'Organic Chemistry', home: '/ochem/', dash: '/ochem/dashboard.html',
      src: '/ochem/assets/curriculum.js', global: 'OchemCurriculum',
      blurb: 'A free interactive organic chemistry course: perform each mechanism yourself, draw the arrows and predict the product, with a lesson for every topic and practice exams.'
    },
    anp: {
      name: 'Anatomy & Physiology', home: '/anatomy-physiology/', dash: '/anatomy-physiology/dashboard.html',
      src: '/anatomy-physiology/assets/anp-curriculum.js', global: 'AnpCurriculum',
      blurb: 'A free anatomy and physiology course: lessons that build in order from cells to systems, mechanism-first physiology, a virtual lab practical and system exams.'
    }
  };

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(ch){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
    });
  }
  function readJSON(key, fallback){
    try{ var v = JSON.parse(localStorage.getItem(key) || 'null'); return v == null ? fallback : v; }
    catch(e){ return fallback; }
  }

  /* ---- the rules (pure) ------------------------------------------------- */

  /* chapters: [{ id, title, lessons: [topic ids] }]
     done:     { topicId: timestamp | true }  — true where no date is kept
     Returns the course milestone first, then one per chapter. A date is set
     only where every lesson behind it has one; otherwise null, and the
     caller falls back to the day the milestone was first seen. */
  function evaluate(chapters, done){
    done = done || {};
    var chs = (chapters || []).map(function(c){
      var n = 0, last = 0, dated = true;
      c.lessons.forEach(function(id){
        var v = done[id];
        if(!v) return;
        n++;
        if(typeof v === 'number'){ if(v > last) last = v; }
        else dated = false;
      });
      var earned = c.lessons.length > 0 && n === c.lessons.length;
      return {
        id: 'ch-' + c.id, kind: 'chapter', chapter: c.id, title: c.title, lessons: c.lessons.slice(),
        done: n, total: c.lessons.length, earned: earned, date: earned && dated && last ? last : null
      };
    });
    var got = chs.filter(function(c){ return c.earned; });
    var all = chs.length > 0 && got.length === chs.length;
    var dates = got.map(function(c){ return c.date; });
    return [{
      id: 'course', kind: 'course', title: 'Every chapter', lessons: [],
      done: got.length, total: chs.length, earned: all,
      date: all && dates.every(Boolean) ? Math.max.apply(null, dates) : null
    }].concat(chs);
  }

  /* history: nremt_exam100_history entries { score, total, date }
     best:    nremt_exam100_best { score, total } — kept forever, where the
              history keeps the last twenty, so an old qualifying attempt is
              still found (without a date). */
  function nremtExam(history, best){
    function hit(h){ return h && h.total >= EXAM_LEN && h.score / h.total * 100 >= EXAM_PCT; }
    var hits = (history || []).filter(hit);
    var dates = hits.map(function(h){ return h.date; }).filter(function(d){ return typeof d === 'number'; });
    var earned = hits.length > 0 || !!hit(best);
    return [{
      id: 'exam-80', kind: 'exam', title: 'Full-length practice exam at 80% or higher', lessons: [],
      earned: earned, date: earned && dates.length ? Math.min.apply(null, dates) : null,
      best: best && best.total ? Math.round(best.score / best.total * 100) : null
    }];
  }

  /* ---- reading each course's progress ---------------------------------- */

  function sources(course){
    if(course === 'ochem'){
      var C = window.OchemCurriculum;
      if(!C) return null;
      var p = readJSON('ochem_progress', {});
      var done = {};
      var chapters = C.MODULES.map(function(m){
        m.topics.forEach(function(t){
          var r = p[t.id];
          if(C.hasLesson(t) && r && (typeof r.bestScore === 'number' || r.completed)) done[t.id] = true;
        });
        return { id: m.id, title: m.title, lessons: m.topics.map(function(t){ return t.id; }) };
      });
      return evaluate(chapters, done);
    }
    if(course === 'anp'){
      var A = window.AnpCurriculum;
      if(!A) return null;
      var d = readJSON('anp_progress_v1', {});
      var lessons = (d && d.v === 1 && d.lessons) || {};
      var chs = A.chapters.map(function(c){
        return { id: c.id, title: c.title, lessons: A.topics.filter(function(t){ return t.chapter === c.id && t.built; }).map(function(t){ return t.id; }) };
      }).filter(function(c){ return c.lessons.length; });
      return evaluate(chs, lessons);
    }
    if(course === 'nremt'){
      return nremtExam(readJSON('nremt_exam100_history', []), readJSON('nremt_exam100_best', null));
    }
    return null;
  }

  /* The course's map, fetched if this page does not already have it (the
     certificate page, or a dashboard of another course). */
  function ensure(course){
    var c = COURSES[course];
    if(!c) return Promise.reject(new Error('unknown course'));
    return Promise.all([styles(), map(c)]);
  }
  /* assets/milestones.css, once. Resolves either way: unstyled is better than
     a milestone never shown. */
  var stylesP = null;
  function styles(){
    if(stylesP) return stylesP;
    if(document.querySelector('link[href$="milestones.css"]')) return (stylesP = Promise.resolve());
    return (stylesP = new Promise(function(resolve){
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = '/assets/milestones.css';
      l.onload = l.onerror = function(){ resolve(); };
      document.head.appendChild(l);
    }));
  }
  function map(c){
    if(!c.global || window[c.global]) return Promise.resolve();
    return new Promise(function(resolve, reject){
      var el = document.createElement('script');
      el.src = c.src;
      el.onload = function(){ resolve(); };
      el.onerror = function(){ reject(new Error('could not load ' + c.src)); };
      document.head.appendChild(el);
    });
  }

  /* Every milestone for a course, each with a date if earned. Records newly
     earned ones and forgets ones whose progress is gone.

     The store is { dates: { 'anp:ch-cells': ts }, unseen: { key: 1 } }. A
     milestone goes into `unseen` the first time any reader finds it earned,
     and only check() takes it out. Which reader gets there first is not
     ours to choose: the A&P dashboard redraws on every progress write, so it
     can list a chapter a moment before the lesson that finished it asks — and
     if listing it counted as seeing it, that chapter would never be
     celebrated. items.fresh is what is still unseen. */
  function readStore(){
    var s = readJSON(STORE, null);
    if(!s || typeof s !== 'object' || !s.dates) s = { dates: {}, unseen: {} };
    s.unseen = s.unseen || {};
    return s;
  }
  function writeStore(s){
    try{ localStorage.setItem(STORE, JSON.stringify(s)); }catch(e){ /* private mode */ }
  }
  function list(course){
    var items = sources(course) || [];
    var store = readStore();
    var changed = false;
    items.forEach(function(m){
      var k = course + ':' + m.id;
      m.course = course;
      if(m.earned){
        if(!store.dates[k]){ store.dates[k] = m.date || Date.now(); store.unseen[k] = 1; changed = true; }
        if(!m.date) m.date = store.dates[k];
      } else if(store.dates[k]){
        delete store.dates[k]; delete store.unseen[k]; changed = true;
      }
    });
    if(changed) writeStore(store);
    items.fresh = items.filter(function(m){ return store.unseen[course + ':' + m.id]; });
    return items;
  }

  /* Everything unseen in a course is seen now: the one celebrated, and any
     backlog, which is recorded quietly. */
  function markSeen(course, items){
    var store = readStore();
    items.forEach(function(m){ delete store.unseen[course + ':' + m.id]; });
    writeStore(store);
  }

  function find(course, id){
    return list(course).filter(function(m){ return m.id === id; })[0] || null;
  }

  /* ---- words ------------------------------------------------------------ */

  function certUrl(course, id){ return '/certificate.html?course=' + encodeURIComponent(course) + '&m=' + encodeURIComponent(id); }

  function heading(m, course){
    var c = COURSES[course] || {};
    if(m.kind === 'course') return 'Course complete: ' + c.name;
    if(m.kind === 'chapter') return 'Chapter complete: ' + m.title;
    return 'Full-length practice exam, 80% or higher';
  }

  // The line on the certificate after the student's name.
  function statement(m, course){
    var c = COURSES[course] || {};
    if(m.kind === 'course') return 'completed every lesson in every chapter of ' + c.name;
    if(m.kind === 'chapter') return 'completed every lesson in the chapter “' + m.title + '” of ' + c.name;
    return 'scored 80% or higher on a full-length, timed 100-question NREMT-EMT practice exam';
  }

  function shareText(m, course){
    var c = COURSES[course] || {};
    if(m.kind === 'course') return 'I finished every chapter of ' + c.name + ' on LevlPrep.';
    if(m.kind === 'chapter') return 'I finished the “' + m.title + '” chapter of ' + c.name + ' on LevlPrep.';
    return 'I scored 80% or higher on a full-length NREMT-EMT practice exam on LevlPrep.';
  }

  function shareOpts(m, course){
    return { what: 'milestone', course: course, title: heading(m, course), text: shareText(m, course), url: certUrl(course, m.id) };
  }

  function formatDate(ts){
    try{ return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch(e){ return new Date(ts).toDateString(); }
  }

  /* ---- the celebration -------------------------------------------------- */

  function celebrate(m, course){
    var old = document.getElementById('levlCele');
    if(old) old.remove();
    var d = document.createElement('dialog');
    d.id = 'levlCele';
    d.className = 'levl-cele';
    d.setAttribute('aria-labelledby', 'levlCeleH');
    var line = m.kind === 'exam'
      ? 'You scored 80% or higher on a timed, 100-question practice exam. A practice score, not a prediction, but a real one.'
      : m.kind === 'course' ? 'You finished every lesson in every chapter.' : 'You finished every lesson in this chapter.';
    d.innerHTML =
      '<p class="levl-cele__eyebrow">Milestone</p>' +
      '<h2 id="levlCeleH">' + esc(heading(m, course)) + '</h2>' +
      '<p>' + esc(line) + ' Your certificate of completion is ready.</p>' +
      '<div class="levl-cele__actions">' +
        '<a class="btn-press sm" href="' + certUrl(course, m.id) + '">View certificate</a>' +
        '<button type="button" class="btn-outline levl-cele__share" data-share>Share</button>' +
        '<button type="button" class="levl-cele__close" data-close>Close</button>' +
      '</div>';
    document.body.appendChild(d);
    d.querySelector('[data-share]').addEventListener('click', function(){
      if(window.LevlLazy) window.LevlLazy('share', function(S){ S.share(shareOpts(m, course)); });
    });
    d.querySelector('[data-close]').addEventListener('click', function(){ if(d.close) d.close(); else d.remove(); });
    d.addEventListener('close', function(){ d.remove(); });
    if(d.showModal) d.showModal(); else d.setAttribute('open', '');
    if(window.LevlMotionFx) window.LevlMotionFx.confetti();
  }

  /* After a lesson or an exam. `topic` narrows the celebration to what that
     lesson finished; without it (an NREMT exam) anything new is celebrated.
     Waits a beat so the lesson's own "complete" line and XP land first. */
  function check(course, topic){
    return ensure(course).then(function(){
      var unseen = list(course).fresh;
      if(!unseen.length) return null;
      markSeen(course, unseen);
      unseen.forEach(function(x){
        if(window.LevlAnalytics) window.LevlAnalytics.event('milestone', { course: course, kind: x.kind, id: x.chapter || x.id });
      });
      var fresh = unseen.filter(function(m){
        return !topic || m.kind === 'course' || m.lessons.indexOf(topic) > -1;
      });
      if(!fresh.length) return null;
      var m = fresh.filter(function(x){ return x.kind === 'course'; })[0] || fresh[0];
      setTimeout(function(){ celebrate(m, course); }, 1200);
      return m;
    }, function(){ return null; });
  }

  /* ---- the dashboard list ---------------------------------------------- */

  function row(m, course){
    var sub = m.earned
      ? 'Earned ' + formatDate(m.date)
      : m.kind === 'exam'
        ? (m.best != null ? 'Best full exam so far: ' + m.best + '%' : 'Score 80% or more on a full timed exam')
        : m.kind === 'course'
          ? m.done + ' of ' + m.total + ' chapters complete'
          : m.done + ' of ' + m.total + ' lessons done';
    var name = m.kind === 'course' ? 'Course complete' : m.kind === 'chapter' ? m.title : heading(m, course);
    return '<li class="levl-ms__item' + (m.earned ? ' is-earned' : '') + '">' +
      '<span class="levl-ms__mark" aria-hidden="true">' + (m.earned ? '✓' : '') + '</span>' +
      '<span class="levl-ms__text"><b>' + esc(name) + '</b><small>' + esc(sub) + '</small></span>' +
      (m.earned ? '<a class="levl-ms__cert" href="' + certUrl(course, m.id) + '">Certificate<span class="sr-only">: ' + esc(name) + '</span></a>' : '') +
    '</li>';
  }

  function renderList(el, course){
    if(!el) return;
    ensure(course).then(function(){
      var items = list(course);
      var got = items.filter(function(m){ return m.earned; });
      var todo = items.filter(function(m){ return !m.earned; });
      el.innerHTML = '<section class="levl-ms" aria-labelledby="levlMsH">' +
        '<h2 class="levl-ms__h" id="levlMsH">Milestones and certificates</h2>' +
        '<p class="levl-ms__sum">' + got.length + ' of ' + items.length + ' earned in this browser.' +
          (got.length ? '' : ' Each one comes with a printable certificate of completion.') + '</p>' +
        (got.length ? '<ul class="levl-ms__list">' + got.map(function(m){ return row(m, course); }).join('') + '</ul>' : '') +
        (todo.length ? (got.length || todo.length > 4
          ? '<details class="levl-ms__more"><summary>Still to earn (' + todo.length + ')</summary><ul class="levl-ms__list">' + todo.map(function(m){ return row(m, course); }).join('') + '</ul></details>'
          : '<ul class="levl-ms__list">' + todo.map(function(m){ return row(m, course); }).join('') + '</ul>') : '') +
      '</section>';
    }, function(){ /* offline and the map would not load: leave the slot empty */ });
  }

  window.LevlMilestones = {
    COURSES: COURSES,
    EXAM_LEN: EXAM_LEN,
    EXAM_PCT: EXAM_PCT,
    evaluate: evaluate,
    nremtExam: nremtExam,
    ensure: ensure,
    list: list,
    markSeen: markSeen,
    find: find,
    check: check,
    celebrate: celebrate,
    renderList: renderList,
    certUrl: certUrl,
    heading: heading,
    statement: statement,
    shareText: shareText,
    shareOpts: shareOpts,
    formatDate: formatDate
  };
})();
