/* One clear next step at the end of every session.

   Every course already knows what a student should do next — ochem's mastery
   engine has a review queue and a course path, NREMT has a due queue and a
   per-domain score, A&P has both — and the end screens did not use it
   consistently. Some offered three buttons of equal weight, some offered a
   single "Back" that went nowhere new, and the lesson pages ended on a
   paragraph. A session that ends on a dead end is where a study habit stops.

   So every end screen asks one picker, in one order:

     1. review   items the course's own scheduler says are due now
     2. lesson   the first unfinished lesson in the course path
     3. drill    the weakest area there is enough evidence to name
     4. home     the course home, so there is never nowhere to go

   Due work comes first because it is the only one of the four that gets worse
   by waiting: an item reviewed late has to be relearned, a lesson read
   tomorrow is the same lesson. The drill is last of the real options because
   the lesson path already covers anything never studied, and "your weakest
   area" is only an honest claim once the path has been walked.

   The picker reads each course's real state — its own engine when the page
   has loaded it, its localStorage record when it has not — and never stores
   anything of its own. A page passes what only it knows: a queue it is
   holding open (`due`, the flashcard deck's remaining cards), a tier that
   makes no sense right after this session (`skip`), the one or two quiet
   alternatives that belong to this screen (`also`), and the topics just
   finished (`tags`, for the cross-course suggestion in cross-course.js).

   Loaded on demand by LevlNextStep() in site-chrome.js, so it is in no page's
   weight: nothing needs it until a session ends. Tested in
   scripts/test/next-step.test.mjs. */
(function(){
  var DAY = 86400000;

  var COURSES = {
    nremt: { root: '/nremt/', name: 'NREMT' },
    ochem: { root: '/ochem/', name: 'Organic Chemistry' },
    anp:   { root: '/anatomy-physiology/', name: 'A&P' }
  };

  function readJSON(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } }
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }
  function pct(x){ return Math.round(x * 100); }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---- the courses' own answers --------------------------------------
     Each adapter returns null when it has nothing to say, and is called
     inside a try, so a course whose engine is not on this page (or throws)
     falls through to the next tier rather than taking the end screen down. */

  var ADAPTERS = {
    nremt: {
      /* The Review page's count: every tracked question whose decayed level
         is under 5 (renderDueSummary in nremt/practice-engine.js). The decay
         rule is repeated here because the flashcard and scenario pages do not
         load the 2,300-line engine, and loading it to count a queue would be
         absurd; if the engine's rule changes, this changes with it. */
      due: function(){
        var m = readJSON('nremt_mastery') || {}, now = Date.now(), n = 0;
        Object.keys(m).forEach(function(k){
          var r = m[k];
          if(!r) return;
          var eff = Math.max(0, (r.level || 0) - Math.floor((now - (r.lastSeen || 0)) / (4 * DAY)));
          if(eff < 5) n++;
        });
        return n ? { n: n, noun: 'question', href: '/nremt/review.html?start=spaced',
          reason: 'Missed or fading questions. A session takes the 40 most pressing.' } : null;
      },
      // No lesson path: the NREMT course is a question bank and a textbook,
      // and the textbook records no finished chapters to continue from.
      lesson: null,
      /* The weakest domain with ten answers behind it, the same evidence bar
         the readiness score uses before it calls a domain weak. Domain drills
         start from practice.html?domain=, the dashboard's own deep link. */
      weakest: function(){
        var s = readJSON('nremt_domain_stats_all') || {}, best = null;
        Object.keys(s).forEach(function(d){
          var x = s[d];
          if(!x || x.total < 10) return;
          var p = x.correct / x.total;
          if(p < 0.8 && (!best || p < best.p)) best = { p: p, d: d };
        });
        return best ? { label: 'Drill 20 questions on ' + best.d, p: best.p,
          href: '/nremt/practice.html?domain=' + encodeURIComponent(best.d) } : null;
      }
    },

    ochem: {
      /* The Review page's own queue when the question engine is here (it
         drops leeches and concepts past the student's frontier, and applies
         the daily cap); the mastery engine's due list under the same cap when
         only that is loaded, which is every other ochem page. */
      due: function(){
        var QE = window.OchemQuestionEngine, M = window.OchemMastery, n = 0;
        if(QE && QE.reviewQueue) n = QE.reviewQueue().today.length;
        else if(M){
          var leech = {};
          (M.leeches ? M.leeches() : []).forEach(function(p){ leech[p.id] = 1; });
          n = M.due().filter(function(p){ return !leech[p.id]; }).length;
          if(M.reviewsRemainingToday) n = Math.min(n, M.reviewsRemainingToday());
        }
        return n ? { n: n, noun: 'concept', href: '/ochem/review.html',
          reason: 'Due today on their spaced-review schedule.' } : null;
      },
      /* The question engine's nextPathTopic rule: the first topic in
         curriculum order with a lesson and no score. Notes-only topics are
         skipped, since there is nothing in them to finish. */
      lesson: function(){
        var C = window.OchemCurriculum;
        if(!C) return null;
        for(var i = 0; i < C.MODULES.length; i++){
          var ts = C.MODULES[i].topics;
          for(var j = 0; j < ts.length; j++){
            if(C.hasLesson(ts[j]) && C.topicMastery(ts[j].id) === null) return { title: ts[j].title, href: '/ochem/' + ts[j].href };
          }
        }
        return null;
      },
      // weakest() already refuses to name a concept on fewer than three
      // attempts, or one at 70% or better.
      weakest: function(){
        var M = window.OchemMastery, w = M && M.weakest(1)[0];
        return w && w.concept ? { label: 'Drill 8 questions on ' + w.concept.title.toLowerCase(), p: w.strength,
          href: '/ochem/practice.html?concept=' + encodeURIComponent(w.id) } : null;
      }
    },

    anp: {
      /* AnpCore.reviewQueue() is the Review page's queue: questions, and tool
         items that are redone in their tool. Called "items" unless every one
         is a question. */
      due: function(){
        var A = window.AnpCore;
        if(!A) return null;
        var ids = A.reviewQueue(), q = A.load().q;
        if(!ids.length) return null;
        var allQ = ids.every(function(id){ return q[id] && q[id].src === 'q'; });
        return { n: ids.length, noun: allQ ? 'question' : 'item', href: '/anatomy-physiology/review.html',
          reason: 'Each comes back just before you would forget it.' };
      },
      // Chapter order, then topic order within it: the order learn.html lists.
      lesson: function(){
        var C = window.AnpCurriculum, A = window.AnpCore;
        if(!C || !A) return null;
        var done = A.lessonsDone(), chN = {};
        C.chapters.forEach(function(c){ chN[c.id] = c.n; });
        var next = C.topics.filter(function(t){ return t.built && !done[t.id]; })
          .sort(function(a, b){ return (chN[a.chapter] - chN[b.chapter]) || (a.n - b.n); })[0];
        return next ? { title: next.title, href: '/anatomy-physiology/lessons/' + next.id + '.html' } : null;
      },
      weakest: function(){
        var A = window.AnpCore, w = A && A.weakest(5).filter(function(x){ return x.answered >= 3 && x.value < 0.7; })[0];
        return w ? { label: 'Practice your weakest topic: ' + w.title, p: w.value,
          href: '/anatomy-physiology/practice.html?topic=' + encodeURIComponent(w.id) } : null;
      }
    }
  };

  function ask(fn){
    if(!fn) return null;
    try{ return fn(); }catch(e){ return null; }
  }

  /* The pick itself. Pure apart from what the adapters read, which is what
     the tests stub. Returns { kind, label, href | act, reason }. */
  function pick(course, ctx){
    ctx = ctx || {};
    var A = ADAPTERS[course] || {}, C = COURSES[course] || COURSES.nremt;
    var skip = ctx.skip || [];
    var on = function(k){ return skip.indexOf(k) === -1; };

    if(on('review')){
      // A queue the page is holding open outranks the course's: the flashcard
      // deck's remaining cards are due work the student is already inside.
      var d = ctx.due && ctx.due.n > 0 ? ctx.due : ask(A.due);
      if(d && d.n > 0){
        return { kind: 'review', label: d.label || 'Review ' + plural(d.n, 'due ' + d.noun), href: d.href, act: d.act,
          reason: d.reason || 'Still waiting in today\u2019s queue, while this session is fresh.' };
      }
    }
    if(on('lesson')){
      var l = ask(A.lesson);
      if(l) return { kind: 'lesson', label: 'Next lesson: ' + l.title, href: l.href, reason: 'The next lesson in the course you have not finished.' };
    }
    if(on('drill')){
      var w = ask(A.weakest);
      if(w) return { kind: 'drill', label: w.label, href: w.href, reason: 'Your weakest area with enough answers to judge: ' + pct(w.p) + '% so far.' };
    }
    return { kind: 'home', label: 'Back to the ' + C.name + ' home', href: C.root,
      reason: 'Nothing is due and every lesson so far is done.' };
  }

  /* The cross-course source tags for what was just finished. NREMT pages
     pass their tags ready-made (a question topic, a scenario id); ochem and
     A&P pass topic ids, or ochem the concepts a session touched, and each is
     tagged with its chapter as well, since most pairs listen at chapter
     level. A concept counts for its first-listed topic only: concepts are
     shared across chapters on purpose, and "touched a concept that also
     appears in Biomolecules" is not a milestone in Biomolecules. */
  function tagsFor(course, ctx){
    var out = (ctx.tags || []).slice(), topics = (ctx.topics || []).slice();
    function add(t){ if(t && out.indexOf(t) === -1) out.push(t); }
    if(course === 'ochem'){
      var C = window.OchemCurriculum, CO = window.OchemConcepts;
      (ctx.concepts || []).forEach(function(id){ var c = CO && CO.get(id); if(c && c.topics && c.topics[0]) topics.push(c.topics[0]); });
      topics.forEach(function(id){
        add('ochem:' + id);
        if(C) C.MODULES.forEach(function(m){ if(m.topics.some(function(t){ return t.id === id; })) add('ochem:' + m.id); });
      });
    } else if(course === 'anp'){
      var cur = window.AnpCurriculum;
      topics.forEach(function(id){
        add('anp:' + id);
        var t = cur && cur.topics.filter(function(x){ return x.id === id; })[0];
        if(t) add('anp:' + t.chapter);
      });
    }
    return out;
  }

  function track(course, kind){
    if(window.LevlAnalytics) window.LevlAnalytics.event('next-step-click', { course: course, kind: kind });
  }

  function control(cls, item, i){
    return item.href
      ? '<a class="' + cls + '" href="' + esc(item.href) + '" data-n="' + i + '">' + esc(item.label) + '</a>'
      : '<button type="button" class="' + cls + '" data-n="' + i + '">' + esc(item.label) + '</button>';
  }

  /* Draw the step into `el` (the placeholder LevlNextStep() returned). One
     pressed button, the reason under it, and at most two quiet links. */
  function mount(el, course, ctx){
    ctx = ctx || {};
    var p = pick(course, ctx);
    var also = (ctx.also || []).slice(0, 2);
    var items = [p].concat(also);
    el.innerHTML = '<p class="levl-next__k">Next step</p>' +
      control('btn-press levl-next__go', p, 0) +
      '<p class="levl-next__why">' + esc(p.reason) + '</p>' +
      (also.length ? '<p class="levl-next__also">' + also.map(function(a, i){ return control('link-quiet', a, i + 1); }).join('') + '</p>' : '') +
      '<div class="levl-next__cross"></div>';
    el.querySelectorAll('[data-n]').forEach(function(b){
      var item = items[+b.getAttribute('data-n')];
      b.addEventListener('click', function(){
        if(item === p) track(course, p.kind);
        if(item.act) item.act();
      });
    });
    if(ctx.focus){ try{ el.querySelector('.levl-next__go').focus({ preventScroll: true }); }catch(e){} }

    // The finished session is the milestone the cross-course suggestion
    // waits for. Two quiet links already is the most this block carries, so
    // with two the suggestion waits for the dashboard instead.
    var X = window.LevlCross, tags = tagsFor(course, ctx);
    if(X){
      X.note(tags);
      if(also.length < 2) X.offer(el.querySelector('.levl-next__cross'), course, { tags: tags, line: true });
    }
    return p;
  }

  window.LevlNext = { pick: pick, mount: mount, tagsFor: tagsFor, COURSES: COURSES };
})();
