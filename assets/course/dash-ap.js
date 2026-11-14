/* The dashboard of the mastery courses: the six AP® courses and A&P (docs/dashboard.md). Each course's own
   dashboard script (bio/assets/pages/dashboard.js and its forks, anatomy-physiology/assets/apps/mastery.js) passes
   its core, curriculum and words; this builds the five questions of assets/course/dash.js from them and draws the
   course's older panels, by the code that drew them before, into the drawers under each question.

   These courses measure mastery (assets/course/hub.js tiers: Strong is 0.6), not exam accuracy, so the readiness
   question is answered with coverage: the share of the exam (each unit's weight, the middle of its College Board
   range, spread over its topics; units outside the exam weigh nothing here) or of the course (every built topic
   counting once) that sits in topics at Strong or better. Only topics actually at Strong count. Nothing is invented: every number on the page is that sum, or the
   course core's own mastery and review readings.

   cfg: { key, name (html), A (core), CU (curriculum), base, root,
          group: 'unit'|'chapter', groups: [{ id, label, short, weight: [lo, hi] | null }], groupMastery(id),
          second: { label, title, hint, items: [{ id, name, href }], mastery(id), href(id) },
          exams: [{ t, pct }] (optional), examWord, frq: { types, scores } (optional), cram: bool,
          analyticsDrawers(ctx) -> drawers shown when A.allowed('analytics'), gate (html when locked),
          milestones: bool (default true: every course has milestones, audit 2026-11 D4), cross: bool, examTarget: { done, unit } words for the exam-date card } */
(function(){
  'use strict';
  function build(cfg){
    var H = window.LevlHub, D = window.LevlDash, A = cfg.A, CU = cfg.CU, root = cfg.root;
    if(!H || !D || !A || !CU || !root) return;
    var esc = H.esc, plural = H.plural, BASE = cfg.base || '', key = cfg.key;
    function pct(v){ return Math.round((v || 0) * 100); }
    var STRONG = 0.6;
    var built = CU.topics.filter(function(t){ return t.built; });
    var store = A.load(), answeredIds = Object.keys(store.q || {}), lessons = Object.keys(store.lessons || {});
    var isNew = !answeredIds.length && !lessons.length;
    var overall = A.overallMastery(), reviewDue = A.reviewCount();
    var fc = (function(){
      try{
        var d = JSON.parse(localStorage.getItem(key + '_flashcards_v1') || 'null'), now = Date.now(), due = 0;
        if(d && d.cards) Object.keys(d.cards).forEach(function(k){ var s = d.cards[k]; if(s && s.t && s.d <= now) due++; });
        return due;
      }catch(e){ return 0; }
    })();
    var HP = window.HubProgress, st = HP ? HP.streak() : null, lvl = HP ? HP.levelInfo(key) : null, myXp = HP ? HP.subjectXp(key) : 0;
    var analytics = A.allowed('analytics'), pill = A.badge ? A.badge() : '';
    var topicM = {}; built.forEach(function(t){ topicM[t.id] = A.topicMastery(t.id); });
    var startedTopics = built.filter(function(t){ return topicM[t.id].answered > 0; });
    var strongTopics = built.filter(function(t){ return topicM[t.id].value >= STRONG; }).length;
    var weak = A.weakest(5);

    // ---- groups (units or chapters) and coverage ----
    var groups = cfg.groups.map(function(g){
      var ts = built.filter(function(t){ return (cfg.group === 'unit' ? t.unit : t.chapter) === g.id; });
      if(!ts.length) return null;
      var m = cfg.groupMastery(g.id);
      // A unit's exam weight is the middle of its College Board range; units outside the exam (skills units) weigh
      // nothing toward the exam numbers but still list with their topics. A&P chapters weigh their topic count.
      var w = g.weight ? (g.weight[0] + g.weight[1]) / 2 : cfg.group === 'unit' ? 0 : ts.length;
      // The share of the group's topics actually at Strong: a unit's exam weight is spread over its topics.
      var got = ts.filter(function(t){ return topicM[t.id].value >= STRONG; }).length / ts.length;
      return { id: g.id, n: g.n, icon: g.icon, label: g.label, short: g.short || g.label, weight: g.weight, w: w, m: m.value || 0, answered: m.answered || 0, topics: ts, got: got, cost: w * (1 - got),
        notStrong: ts.filter(function(t){ return topicM[t.id].value < STRONG; }).length };
    }).filter(Boolean);
    var wTotal = groups.reduce(function(a, g){ return a + g.w; }, 0) || 1;
    var coverage = Math.round(groups.reduce(function(a, g){ return a + g.w * g.got; }, 0) / wTotal * 100);
    var ofWhat = cfg.group === 'unit' ? 'the exam' : 'the course';

    // ---- exam date ----
    var ED = window.LevlExamDate, examIso = ED ? ED.read(key) : null, daysLeft = examIso ? ED.daysUntil(examIso) : null, examT = null;
    if(examIso && daysLeft >= 0){ var pp = examIso.split('-').map(Number); examT = new Date(pp[0], pp[1] - 1, pp[2]).getTime(); } else { examIso = null; daysLeft = null; }
    var leftTopics = built.filter(function(t){ return topicM[t.id].value < STRONG; }).length;
    var weeks = D.dailyWeeks(key), exams = cfg.exams || [];
    var rising = weeks.length >= 2 && weeks[weeks.length - 1].pct - weeks[0].pct >= 3;

    // ---------------------------------------------------------------- Progress option 2 (docs/progress-profile.md)
    var allN = 0, allC = 0; answeredIds.forEach(function(k){ var r = store.q[k]; if(r){ allN += r.n || 0; allC += r.c || 0; } });
    var accAll = allN ? Math.round(allC / allN * 100) : null;
    var rawIso = ED ? ED.read(key) : null, pastDays = null;
    if(rawIso){ var dd0 = ED.daysUntil(rawIso); if(dd0 < 0) pastDays = -dd0; }
    // On pace: the share of the school year gone by (from September 1) to exam day. Only with an exam date.
    var paceGoal = null;
    if(examT){
      var dt = new Date(), y0 = dt.getMonth() >= 7 ? dt.getFullYear() : dt.getFullYear() - 1, start = new Date(y0, 8, 1).getTime();
      if(examT > start) paceGoal = Math.max(0, Math.min(100, Math.round((Date.now() - start) / (examT - start) * 100)));
    }
    var isAP = cfg.group === 'unit' && window.LevlReady && window.LevlReady.CUT[key];
    // The projected AP score: every answer through the readiness model, units weighted by the exam.
    var proj = null, est = null;
    if(isAP && allN >= 30){
      var bp = {}, bank = {};
      groups.forEach(function(g){ if(g.weight){ bp[g.id] = g.w; bank[g.id] = [2]; } });
      est = window.LevlReady.estimate({ answers: answeredIds.map(function(k){ var r = store.q[k]; return { id: k, area: r.u, right: r.c || 0, total: r.n || 0, t: r.seen || 0, diff: r.d || 2 }; }), bank: bank, blueprint: bp, live: cfg.live || null, unseen: -1.4 });
      proj = window.LevlReady.apBand(key, est, cfg.frqStats || null);
    }

    var facts = [{ big: examIso ? D.shortDate(examT) : 'Set date', label: examIso ? 'exam day, ' + plural(daysLeft, 'day') + ' left' : 'your exam day, for a countdown', button: 'd5ExamCard' }];
    if(isAP) facts.push(proj ? { big: proj.lo === proj.hi ? String(proj.band) : proj.band + ' <small class="d5-mut">(' + proj.lo + ' to ' + proj.hi + ')</small>', label: 'projected AP&reg; score today' + (proj.low ? ', rough' : '') }
      : { big: '&mdash;', label: 'projected AP&reg; score, after ' + (30 - allN > 0 ? 30 - allN + ' more answers' : 'a few answers') });
    if(cfg.frqStats) facts.push(cfg.frqStats.n ? { big: cfg.frqStats.got + ' / ' + cfg.frqStats.of, label: 'free response average, ' + plural(cfg.frqStats.n, 'scored'), href: BASE + 'frq.html' }
      : { big: '&mdash;', label: 'free response: score one with its rubric', href: BASE + 'frq.html' });
    if(examIso && leftTopics) facts.push({ big: Math.ceil(leftTopics / Math.max(1, daysLeft)) + ' a day', label: 'topics to Strong covers the rest' });
    var ready = { value: isNew ? null : coverage, unit: '%', label: 'of ' + ofWhat + ' at Strong', facts: facts, slot: 'd5ExamCard',
      empty: 'Every topic you bring to Strong fills this in. Start with a lesson or a few practice questions.',
      foot: isAP ? 'The projected score uses your answers and published score cutoffs, which move a few points each year. A guide, not a promise.' : 'Every built topic counts once.' };
    if(!isNew){
      ready.scale = paceGoal != null ? { zones: false, goal: paceGoal, goalText: 'on pace for ' + D.shortDate(examT), lo: '0%', hi: '100%' } : { zones: false, lo: '0%', hi: '100%' };
      if(paceGoal != null) ready.pill = coverage >= paceGoal + 5 ? { text: 'Ahead of pace', tier: 'good' } : coverage >= paceGoal - 5 ? { text: 'On pace', tier: 'good' } : coverage >= paceGoal - 20 ? { text: 'A little behind', tier: 'mid' } : { text: 'Behind pace', tier: 'low' };
      ready.explain = '<b>' + coverage + '%</b> of ' + ofWhat + ' sits in topics you have at Strong' + (cfg.group === 'unit' ? ', units weighted by their share of the AP&reg; exam' : '') + '.' +
        (accAll != null ? ' You get <b>' + accAll + '%</b> of questions right overall; a topic counts here once it is Strong.' : '');
    }
    if(isAP && pastDays !== null && pastDays <= 120 && !isNew) ready.outcome = { course: key, title: 'How did your AP&reg; exam go?', choices: [['5', '5'], ['4', '4'], ['3', '3'], ['2', '2'], ['1', '1'], ['later', 'No score yet']],
      predicted: proj ? { value: proj.composite, lo: proj.cLo, hi: proj.cHi, band: proj.band } : { value: coverage }, n: allN, days: pastDays };
    ready.onSlot = function(){
      if(ED) ED.mount(document.getElementById('d5ExamCard'), {
        subject: key, links: { review: BASE + 'review.html', exams: BASE + 'exams.html' },
        target: function(days){
          if(!leftTopics) return { done: cfg.doneLine || 'Every published topic is at Strong or better. Keep Review clear and take a practice exam.' };
          return { n: Math.ceil(leftTopics / Math.max(1, days)), unit: 'topics', one: 'topic', why: 'brought to Strong covers the ' + leftTopics + ' not there yet' };
        }
      });
    };

    var progress = { weeks: weeks, exams: exams, examWord: cfg.examWord || 'exams', firstExamWord: 'first exam',
      examDate: examT ? { t: examT } : null, allHref: exams.length ? BASE + 'exams.html' : (cfg.cram ? BASE + 'cram.html' : null), allText: exams.length ? 'Exams' : 'Cram plan',
      recent: cfg.recent || [],
      empty: isNew ? 'Your line starts with your first answers.' : 'Your weekly line starts now: each week with 5 or more answers adds a point.' };

    // ---------------------------------------------------------------- what is holding me back
    function tierOf(m){ return m >= STRONG ? 'ok' : m >= 0.3 ? 'mid' : ''; }
    function weakIn(g){
      var w = g.topics.filter(function(t){ return topicM[t.id].answered; }).sort(function(a, b){ return topicM[a.id].value - topicM[b.id].value; })[0];
      return w && topicM[w.id].value < STRONG ? { name: w.title, pct: pct(topicM[w.id].value), href: BASE + 'practice.html?topic=' + encodeURIComponent(w.id), id: w.id } : null;
    }
    var gstarted = groups.filter(function(g){ return g.answered; });
    var unstarted = groups.filter(function(g){ return !g.answered; });
    var grows = gstarted.slice().sort(function(a, b){ return (b.cost - a.cost) || (b.notStrong - a.notStrong); }).map(function(g){
      var share = g.weight ? g.weight[0] + '&ndash;' + g.weight[1] + '% of the exam' : plural(g.topics.length, 'topic');
      var wk = weakIn(g), gain = g.w ? Math.round(g.cost / wTotal * 100) : 0;
      return { name: g.label, pct: pct(g.m), word: 'mastery', weak: wk, cost: g.got >= 1 ? 'at Strong' : share, bar: g.m, tier: tierOf(g.m),
        gain: gain >= 1 ? '+' + gain + '%' : '', href: BASE + 'practice.html?' + cfg.group + '=' + encodeURIComponent(g.id), cta: 'Practice ' + g.short,
        links: wk ? [{ href: BASE + 'notes/' + wk.id + '.html', label: 'Notes' }] : [] };
    });
    if(unstarted.length){
      var nx = unstarted[0];
      grows.push({ name: unstarted.length > 1 ? plural(unstarted.length, cfg.group).replace(/^./, function(c){ return c.toUpperCase(); }) + ' not started yet' : nx.label, off: true,
        sub: unstarted.length > 1 ? 'next in order: ' + esc(nx.label) : 'not started yet', href: BASE + 'practice.html?' + cfg.group + '=' + encodeURIComponent(nx.id), cta: 'Start ' + nx.short });
    }
    var trowsT = built.filter(function(t){ return topicM[t.id].answered; }).sort(function(a, b){ return topicM[a.id].value - topicM[b.id].value; }).map(function(t){
      var tm = topicM[t.id];
      return { name: (t.ced ? t.ced + ' ' : '') + t.title, pct: pct(tm.value), word: 'mastery', cost: plural(tm.answered, 'item') + ' answered', bar: tm.value, tier: tierOf(tm.value),
        href: BASE + 'practice.html?topic=' + encodeURIComponent(t.id), cta: 'Practice', links: [{ href: BASE + 'notes/' + t.id + '.html', label: 'Notes' }] };
    });
    var sec = cfg.second, srows = sec.items.map(function(it){ var m = sec.mastery(it.id); return { it: it, m: m.value || 0, n: m.answered || 0 }; })
      .filter(function(x){ return x.n; }).sort(function(a, b){ return a.m - b.m; }).map(function(x){
        return { name: (x.it.short && x.it.short !== x.it.name ? x.it.short + '. ' : '') + x.it.name, pct: pct(x.m), word: 'mastery', cost: plural(x.n, 'item') + ' answered', bar: x.m, tier: tierOf(x.m), href: sec.href(x.it.id), cta: 'Practice' };
      });
    var views = [
      { label: cfg.group === 'unit' ? 'Units' : 'Chapters', rows: gstarted.length ? grows : [], empty: 'Answer a few questions and your ' + cfg.group + 's line up here, the most expensive first.' },
      { label: 'Topics', rows: trowsT, empty: 'Topics you have started show up here, weakest first.' },
      { label: sec.label, rows: srows, empty: 'Answer questions tagged with a ' + sec.word + ' and they line up here, weakest first.' }
    ];
    if(cfg.skillRows){
      var skv = { label: 'Skills', badge: pill ? ' <span class="premium-badge">Premium</span>' : '' };
      if(!analytics) skv.locked = cfg.gate || '<p class="d5-empty">Mastery by skill comes with Premium.</p>';
      else { skv.rows = cfg.skillRows(tierOf); skv.empty = 'Skills appear once you have answered questions.'; }
      views.push(skv);
    }
    var focus = { note: gstarted.length ? (cfg.group === 'unit' ? 'Ranked by how much of the exam each unit carries that is not at Strong yet' : 'Ranked by how many topics in each chapter are not at Strong yet') + ' &middot; <b class="d5-gain">+</b> is what bringing it to Strong adds to the number above' : '', views: views };

    var status = isNew ? 'start anywhere, this page fills in as you answer' : coverage + '% of ' + ofWhat + ' at Strong' + (proj ? ', projected ' + proj.band : '') + (rising ? ', and climbing' : '');
    D.render(root, { progress: progress, ready: ready, focus: focus,
      band: { status: status, level: lvl ? { level: lvl.level } : null, streak: st ? st.current : 0 } });
    if(cfg.cross){
      var cx = document.querySelector('[data-levl-cross]');
      if(cx && window.LevlLazy && /"m":\{"/.test(localStorage.getItem('levlprep_cross') || '')) window.LevlLazy('cross-course', function(X){ X.offer(cx, key); });
    }
  }

  // Two letters for a chip: "Statistics and math" is SM.
  function initials(t){ return String(t).split(/\s+/).filter(function(w){ return /^[A-Z]/.test(w); }).slice(0, 2).map(function(w){ return w[0]; }).join('') || String(t).slice(0, 2); }

  /* The six AP® courses share everything but their words. */
  function ap(o){
    var A = o.A, CU = o.CU, BASE = o.base || '', H = window.LevlHub;
    var esc = H ? H.esc : function(s){ return String(s); };
    function pct(v){ return Math.round((v || 0) * 100); }
    function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }
    var prefs = {}; try{ prefs = JSON.parse(localStorage.getItem(o.key + '_prefs_v1') || '{}') || {}; }catch(e){}
    var all = (prefs.examHistory || []).filter(function(x){ return x && x.mcq; });
    var hist = all.filter(function(x){ return x.mcq.n >= 5; }); // chart points: a 2-question quiz is not a point
    var full = hist.filter(function(x){ return x.kind === 'full' && x.band; });
    var frqScores = prefs.frqScores || {}, fids = Object.keys(frqScores).sort(function(a, b){ return (frqScores[b].ts || 0) - (frqScores[a].ts || 0); });
    var exHtml = !H ? '' : !all.length ? H.panel({ id: o.key + '-db-ex', title: 'Exam history', body: '<p class="cx-emptynote">No exams yet. <a href="' + esc(BASE + 'exams.html') + '">Take a unit test or a practice exam</a>.</p>' }) : (H ? H.panel({ id: o.key + '-db-ex', title: 'Exam history', body: '<ul class="' + o.cls + '-db-list">' + all.slice().reverse().slice(0, 8).map(function(x){
        return '<li><b>' + esc(x.label) + '</b> <span class="' + o.cls + '-small">' + esc(new Date(x.ts).toLocaleDateString()) + '</span><br>Multiple choice ' + x.mcq.c + '/' + x.mcq.n + ' (' + pct(x.mcq.c / x.mcq.n) + '%)' +
          (x.frq ? ' &middot; free response ' + x.frq.got + '/' + x.frq.of : '') + (o.band && x.band ? ' &middot; rough band ' + x.band + ' of 5 <span class="' + o.cls + '-small">(not calibrated)</span>' : '') + '</li>';
      }).join('') + '</ul>' }) : '');
    var frqHtml = H ? H.panel({ id: o.key + '-db-f', title: 'Free-response self-scores', body: fids.length ? fids.slice(0, 8).map(function(id){
        var s = frqScores[id];
        return H.row({ label: s.title || id, href: BASE + 'frq/' + id + '.html', value: s.of ? s.got / s.of : 0, text: s.got + '/' + s.of, note: esc(o.frqTypes[s.type] || '') + (s.tries > 1 ? ' &middot; best ' + s.best + ' over ' + s.tries + ' tries' : '') });
      }).join('') + '<p class="cx-hint" style="margin:8px 0 0">Scores you gave yourself with the rubrics.</p>' : '<p class="cx-emptynote">Score a <a href="' + esc(BASE + 'frq.html') + '">free-response question</a> with its rubric and it shows up here.</p>' }) : '';
    var skills = function(){
      var d = A.load(), seen = {};
      Object.keys(d.q || {}).forEach(function(k){ var p = d.q[k].p; if(p && /\./.test(p)) seen[p] = 1; });
      return Object.keys(seen).sort().map(function(s){ var m = A.practiceMastery(s); return { id: s, value: m.value, answered: m.answered }; });
    };
    build({
      key: o.key, name: o.name, A: A, CU: CU, base: BASE, root: o.root, group: 'unit',
      groups: CU.units.filter(function(u){ return u.part === 'course' || u.weight; }).map(function(u){
        return { id: u.id, n: u.n, icon: u.part === 'course' ? 'U' + u.n : initials(u.title), label: (u.part === 'course' ? 'Unit ' + u.n + ': ' : '') + u.title, short: u.part === 'course' ? 'Unit ' + u.n : u.title, weight: u.weight || null };
      }).concat(CU.units.filter(function(u){ return !(u.part === 'course' || u.weight); }).map(function(u){ return { id: u.id, icon: initials(u.title), label: u.title, short: u.title, weight: null }; })),
      groupMastery: function(id){ return A.unitMastery(id); },
      second: { label: o.practiceLabel, title: 'Mastery by ' + o.practiceWord, word: o.practiceWord,
        items: (CU.practices || []).map(function(p){ return { id: p.id, short: p.id, name: p.name, full: p.id + '. ' + p.name }; }),
        mastery: function(id){ return A.practiceMastery(id); }, href: function(id){ return BASE + 'practice.html?practice=' + id; } },
      exams: hist.map(function(x){ return { t: x.ts, pct: pct(x.mcq.c / x.mcq.n) }; }), examWord: 'exams and unit tests',
      recent: all.slice().reverse().slice(0, 3).map(function(x){ return { big: pct(x.mcq.c / x.mcq.n) + '%' + (o.band && x.band ? ' <small class="d5-mut">band ' + x.band + '</small>' : ''), sub: esc(x.label) + ' &middot; ' + esc(new Date(x.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })) + (x.frq ? ' &middot; FRQ ' + x.frq.got + '/' + x.frq.of : '') }; }),
      frqStats: (function(){
        var n = 0, got = 0, of = 0; fids.forEach(function(id){ var f = frqScores[id]; if(f && f.of){ n++; got += f.got; of += f.of; } });
        // Free-response sections inside full practice exams count too.
        all.forEach(function(x){ if(x.frq && x.frq.of){ n++; got += x.frq.got; of += x.frq.of; } });
        return n ? { n: n, pct: Math.round(got / of * 100), got: Math.round(got / n * 10) / 10, of: Math.round(of / n * 10) / 10 } : { n: 0 };
      })(),
      cram: true, gate: A.gate ? A.gate('analytics', 'dashboard') : '',
      skillRows: function(tierOf){ return skills().filter(function(s){ return s.answered; }).sort(function(a, b){ return a.value - b.value; }).map(function(s){
        return { name: 'Skill ' + s.id, pct: pct(s.value), word: 'mastery', cost: plural(s.answered, 'item') + ' answered', bar: s.value, tier: tierOf(s.value), href: BASE + 'practice.html', cta: 'Practice' }; }); }
    });
  }

  window.LevlDashMastery = { build: build, ap: ap, initials: initials };
})();
