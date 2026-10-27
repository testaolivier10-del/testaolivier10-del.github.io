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
          milestones: bool, cross: bool, examTarget: { done, unit } words for the exam-date card } */
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

    // ---------------------------------------------------------------- 1 now
    var today = st ? { streak: st.current, count: st.todayCount, goal: st.goal, freezes: st.freezes || 0 } : {};
    var Rem = window.LevlReminders;
    if(Rem && Rem.configured && Rem.configured()){ var rs = Rem.settings ? Rem.settings() : null; today.reminder = { text: rs && rs.subscribed ? 'Reminders on' : 'Get a daily reminder', href: '/privacy.html#reminders' }; }
    var nextNew = built.filter(function(t){ return !store.lessons[t.id] && !topicM[t.id].answered; })[0];
    var costly = groups.filter(function(g){ return g.answered && g.got < 1; }).sort(function(a, b){ return b.cost - a.cost; })[0];
    var now;
    if(isNew){
      var first = built[0];
      now = { title: 'Nothing here yet, so start <span>here.</span>', body: 'Every question you answer updates your mastery of its topic, its ' + cfg.group + ' and its ' + cfg.second.word + '. Lessons count too.',
        steps: [first ? '<a href="' + esc(BASE + 'lessons/' + first.id + '.html') + '">Start the first lesson: ' + esc(first.title) + '</a>.' : '',
          'Or open any ' + cfg.group + ' from <a href="' + esc(BASE + 'learn.html') + '">the textbook</a>.', 'Warm up with <a href="' + esc(BASE + 'flashcards.html') + '">flashcards</a> or try a <a href="' + esc(BASE + 'tools.html') + '">tool</a>.'].filter(Boolean), today: today };
    } else {
      var acts = [];
      if(reviewDue) acts.push({ title: 'Review the <span>' + plural(reviewDue, 'question') + '</span> due today.', body: 'They are the ones you missed, back just before you would forget them. Catching them on the day they come due is how they stick.',
        href: BASE + 'review.html', cta: 'Start review', then: 'Review ' + plural(reviewDue, 'due question') });
      if(fc) acts.push({ title: '<span>' + plural(fc, 'flashcard') + '</span> due.', body: 'A few minutes keeps the terms fresh.', href: BASE + 'flashcards.html', cta: 'Flip them', then: 'Then flip the ' + plural(fc, 'flashcard') + ' due' });
      if(weak[0] && weak[0].value < STRONG) acts.push({ title: 'Shore up <span>' + esc(weak[0].title) + '</span>.', body: 'Your weakest topic so far, at ' + pct(weak[0].value) + '% mastery. <a href="' + esc(BASE + 'notes/' + weak[0].id + '.html') + '">Its notes</a> are free if it has been a while.',
        href: BASE + 'practice.html?topic=' + encodeURIComponent(weak[0].id), cta: 'Practice it', then: 'Then practice ' + esc(weak[0].title) + ', your weakest topic' });
      if(nextNew) acts.push({ title: 'Start <span>' + esc(nextNew.title) + '</span>.', body: 'The next topic in course order that you have not started.', href: BASE + 'lessons/' + nextNew.id + '.html', cta: 'Start the lesson', then: 'Then start the next lesson: ' + esc(nextNew.title) });
      if(!acts.length) acts.push({ title: 'Keep it fresh: <span>a mixed set.</span>', body: 'Nothing is due and every topic you have started is Strong. A mixed set keeps it that way.', href: BASE + 'practice.html', cta: 'Practice', then: 'Then a mixed set' });
      now = { title: acts[0].title, body: acts[0].body, href: acts[0].href, cta: acts[0].cta, today: today,
        then: acts.slice(1, 3).map(function(a){ return { text: a.then, href: a.href, cta: 'Go' }; }) };
    }

    // ---------------------------------------------------------------- 2 progress
    var progress = { weeks: weeks, exams: exams, examWord: cfg.examWord || 'exams', firstExamWord: 'first exam',
      examDate: examT ? { t: examT } : null,
      allHref: exams.length ? BASE + 'exams.html' : null, allText: 'Exams',
      empty: isNew ? 'Your line starts with your first answers.' : 'Your weekly line starts now: each week with 5 or more answers adds a point.',
      more: cfg.examHistoryHtml ? [{ label: 'Exam history', html: cfg.examHistoryHtml }] : [] };

    // ---------------------------------------------------------------- 3 ready
    var ready = { title: examIso ? 'Will I be ready by <span>' + esc(D.shortDate(examT)) + '?</span>' : 'How much is <span>solid?</span>', kicker: examIso ? 'exam day' : 'readiness',
      big: coverage + '%', bigSub: ' of ' + ofWhat + ' at Strong',
      note: coverage >= 100 ? 'All of it. Keep Review clear.' : isNew ? 'Every topic you bring to Strong fills this in.' : (100 - coverage) + '% to go' + (daysLeft !== null ? ', with ' + plural(daysLeft, 'day') + ' left.' : '.'),
      scale: { value: coverage, goal: null, lo: '0%', hi: '100%', aria: coverage + '% of ' + ofWhat + ' is at Strong or better.' },
      side: daysLeft !== null ? plural(daysLeft, 'day') + ' left' + (leftTopics ? '<br>about ' + Math.ceil(leftTopics / Math.max(1, daysLeft)) + ' ' + (Math.ceil(leftTopics / Math.max(1, daysLeft)) === 1 ? 'topic' : 'topics') + ' a day to Strong covers the rest' : '') : 'No exam date yet. <a href="#d5ExamDate">Set one</a>',
      gapTitle: 'What closes the gap', gap: [] };
    // The groups already under way that cost the most, then the next one in course order: students learn in
    // order, so an untouched unit at the end of the year is not the first thing to point at.
    function bringText(g){ return 'Bring ' + (cfg.group === 'chapter' ? 'chapter ' + g.n + ', ' + esc(g.short) + ',' : esc(g.short)) + ' to Strong'; }
    var under = groups.filter(function(g){ return g.answered && g.got < 1; }).sort(function(a, b){ return b.cost - a.cost; }).slice(0, 2);
    var nextGroup = groups.filter(function(g){ return !g.answered && g.w > 0; })[0];
    under.concat(nextGroup ? [nextGroup] : []).forEach(function(g){
      var gain = Math.round(g.cost / wTotal * 100);
      if(gain > 0) ready.gap.push({ text: bringText(g) + (g.answered ? ' (' + pct(g.m) + '% mastery now)' : ' (next in order, not started)'), value: '+' + gain + '%', href: BASE + 'practice.html?' + cfg.group + '=' + encodeURIComponent(g.id) });
    });
    var lastBand = cfg.lastBand;
    if(lastBand) ready.gap.push({ text: 'Your last full practice exam: a rough band ' + lastBand + ' of 5 (not calibrated against real AP&reg; scores)', value: 'band ' + lastBand, kind: 'mut', href: BASE + 'exams.html' });
    if(cfg.cram) ready.gap.push({ text: 'The cram kit: a 3-week or 2-week plan counted back from your exam date, with timed mixed sets', value: 'plan', kind: 'mut', href: BASE + 'cram.html' });
    if(!ready.gap.length) delete ready.gap;
    ready.foot = cfg.group === 'unit' ? 'Counts the topics at Strong, each unit weighted by its share of the AP&reg; exam (the middle of the College Board&rsquo;s range). Mastery is not a score prediction.' : 'Counts the topics at Strong, every built topic once. Mastery is not a score prediction.';
    ready.more = [{ label: daysLeft === null ? 'Set your exam date' : 'Exam date and daily target', html: '<div id="d5ExamCard"></div>', open: daysLeft === null && !isNew, id: 'd5ExamDate' }];
    if(cfg.frqHtml) ready.more.push({ label: 'Free-response scores', html: cfg.frqHtml });

    // ---------------------------------------------------------------- 4 focus
    var gstarted = groups.filter(function(g){ return g.answered; });
    var maxCost = Math.max.apply(null, [0.01].concat(groups.map(function(g){ return g.cost; })));
    var maxNot = Math.max.apply(null, [1].concat(groups.map(function(g){ return g.notStrong; })));
    var unstarted = groups.filter(function(g){ return !g.answered; });
    // Untouched groups fold to one: the next in order, and a line for the rest (a long list of empty bars is noise).
    var grows = gstarted.slice().sort(function(a, b){ return (b.cost - a.cost) || (b.notStrong - a.notStrong); }).concat(unstarted.slice(0, 1)).map(function(g, i){
      var share = g.weight ? g.weight[0] + '&ndash;' + g.weight[1] + '% of the exam' : plural(g.topics.length, 'topic');
      if(!g.answered) return { icon: g.icon, name: g.label, sub: 'next in order, not started &middot; ' + share, bar: 0, cost: '', href: BASE + 'practice.html?' + cfg.group + '=' + encodeURIComponent(g.id), cta: 'Start' };
      return { icon: g.icon, warm: g.m < 0.3, name: g.label, sub: pct(g.m) + '% mastery &middot; ' + share, bar: g.w ? g.cost / maxCost : g.notStrong / maxNot,
        cost: g.got >= 1 ? 'at Strong' : g.w && g.weight ? (g.cost / wTotal * 100 < 1 ? 'almost at Strong' : '&asymp; ' + Math.round(g.cost / wTotal * 100) + '% of the exam not yet Strong') : plural(g.notStrong, 'topic') + ' not yet Strong', href: BASE + 'practice.html?' + cfg.group + '=' + encodeURIComponent(g.id), cta: 'Practice' };
    });
    var sec = cfg.second, srows = sec.items.map(function(it){ var m = sec.mastery(it.id); return { it: it, m: m.value || 0, n: m.answered || 0 }; })
      .filter(function(x){ return x.n; }).sort(function(a, b){ return a.m - b.m; }).map(function(x){
        return { icon: String(x.it.short || x.it.id), warm: x.m < 0.3, name: x.it.name, sub: pct(x.m) + '% mastery', bar: 1 - x.m, cost: plural(x.n, 'item') + ' answered', href: sec.href(x.it.id), cta: 'Practice' };
      });
    var focus = { intro: cfg.group === 'unit' ? 'Sorted by how much of the exam each unit carries that you have not brought to Strong yet, not by its percent.' : 'Sorted by how many topics in each chapter are not at Strong yet, not by its percent.',
      views: [{ label: cfg.group === 'unit' ? 'Units' : 'Chapters', rows: gstarted.length ? grows : [],
        foot: gstarted.length && unstarted.length > 1 ? plural(unstarted.length - 1, 'more ' + cfg.group) + ' not started yet. <a href="' + esc(BASE + 'learn.html') + '">See them all in the textbook</a>' : '', empty: 'Answer a few questions and your ' + cfg.group + 's line up here, the most expensive first.' },
        { label: sec.label, rows: srows, empty: 'Answer questions tagged with a ' + sec.word + ' and they line up here, weakest first.' }],
      more: [{ label: 'Weakest topics', html: '<div id="d5Weak"></div>' }, { label: 'Mastery by ' + cfg.group + ' and topic', html: '<div id="d5Groups"></div>' }, { label: sec.title, html: '<div id="d5Second"></div>' }] };
    if(analytics && !isNew && cfg.analyticsDrawers) focus.more = focus.more.concat(cfg.analyticsDrawers({ pill: pill }));
    if(!analytics && cfg.gate) focus.more.push({ label: 'Deeper analytics (Premium)', html: cfg.gate });

    // ---------------------------------------------------------------- 5 record
    var nearest = groups.filter(function(g){ return g.answered && g.m < STRONG; }).sort(function(a, b){ return b.m - a.m; })[0];
    var record = {
      stats: [
        lvl ? { label: 'Level', big: 'Level ' + lvl.level, sub: '&middot; ' + Number(lvl.toNext).toLocaleString() + ' XP to ' + (lvl.level + 1), bar: lvl.into / lvl.span } : null,
        { label: 'Mastery', big: strongTopics + ' of ' + built.length, sub: 'topics at Strong or better' },
        { label: 'Work', big: plural(answeredIds.length, 'item'), sub: 'answered &middot; ' + plural(lessons.length, 'lesson') + ' finished' }
      ].filter(Boolean),
      next: nearest ? { text: 'Next to reach Strong: ' + esc(nearest.short) + '.', sub: 'It is at ' + pct(nearest.m) + '% mastery; Strong starts at 60%.', href: BASE + 'practice.html?' + cfg.group + '=' + encodeURIComponent(nearest.id), cta: 'Practice it' }
        : isNew ? { text: 'Your first ' + cfg.group + ' at Strong is the first thing to earn here.', sub: '' } : null,
      more: [{ label: 'Level and XP', html: '<div id="d5Level"></div>' }].concat(cfg.milestones ? [{ label: 'Milestones and certificates', html: '<div id="levlMilestones"></div>' }] : [])
    };

    var status = isNew ? 'start anywhere, this page fills in as you answer' : coverage + '% of ' + ofWhat + ' at Strong' + (rising ? ', and climbing' : '');
    D.render(root, { now: now, progress: progress, ready: ready, focus: focus, record: record,
      band: { status: status, level: lvl ? { level: lvl.level, title: lvl.title, toNext: lvl.toNext } : null } });

    // ---- the older panels, in their drawers ----
    function set(id, html){ var el = document.getElementById(id); if(el) el.innerHTML = html; }
    function tier(v, n){ return H.tier(v, n); }
    set('d5Weak', H.panel({ id: key + '-db-weak', title: 'Weakest topics', body: weak.length ? weak.map(function(w){
      return H.row({ label: w.title, href: BASE + 'lessons/' + w.id + '.html', value: w.value, tier: tier(w.value, w.answered), note: plural(w.answered, 'item') + ' answered &middot; <a href="' + esc(BASE + 'notes/' + w.id + '.html') + '">notes</a>', action: { href: BASE + 'practice.html?topic=' + encodeURIComponent(w.id), label: 'Practice' } });
    }).join('') : '<p class="cx-emptynote">Answer a few questions and your weakest topics show up here.</p>' }));
    set('d5Groups', H.panel({ id: key + '-db-' + (cfg.group === 'unit' ? 'u' : 'ch'), title: 'Mastery by ' + cfg.group + ' and topic',
      hint: 'Mastery counts distinct questions you have right, weighted by level and fading slowly if you do not revisit them. Untouched topics count as zero.',
      body: groups.length ? H.groups(groups.map(function(g){
        return { started: g.answered > 0, html: H.group({ label: g.label, value: g.m, tier: tier(g.m, g.answered), note: g.topics.filter(function(t){ return topicM[t.id].answered; }).length + ' of ' + plural(g.topics.length, 'topic') + ' started' },
          g.topics.map(function(t){
            var tm = topicM[t.id];
            return H.row({ label: (t.ced ? t.ced + ' ' : t.n && cfg.group === 'chapter' ? t.n + '. ' : '') + t.title, href: BASE + 'lessons/' + t.id + '.html', value: tm.value, tier: tier(tm.value, tm.answered),
              note: tm.answered ? plural(tm.answered, 'item') + ' answered' : (store.lessons[t.id] ? 'Lesson finished' : 'Not started'), action: { href: BASE + 'practice.html?topic=' + encodeURIComponent(t.id), label: 'Practice' } });
          }).join('')) };
      }), cfg.group) : '<p class="cx-emptynote">' + (cfg.group === 'unit' ? 'Units' : 'Chapters') + ' appear here as they are published.</p>' }));
    set('d5Second', H.panel({ id: key + '-db-p', title: sec.title, body: sec.items.map(function(it){
      var m = sec.mastery(it.id);
      return H.row({ label: it.full || it.name, href: it.page || null, value: m.value, tier: tier(m.value, m.answered), note: m.answered ? plural(m.answered, 'item') + ' answered' : '', action: m.answered ? { href: sec.href(it.id), label: 'Practice' } : null });
    }).join('') }));
    if(lvl) set('d5Level', H.level(lvl, { xpLine: myXp.toLocaleString() + ' XP earned in ' + cfg.name + ' &middot; ' + lvl.total.toLocaleString() + ' site-wide', sub: st ? [H.streakLine(st)] : [] }));
    if(analytics && !isNew && cfg.fillAnalytics) cfg.fillAnalytics({ set: set, pill: pill, tier: tier });
    if(cfg.milestones && window.LevlLazy) window.LevlLazy('milestones', function(M){ M.renderList(document.getElementById('levlMilestones'), key); });
    if(ED) ED.mount(document.getElementById('d5ExamCard'), {
      subject: key, links: { review: BASE + 'review.html', exams: BASE + 'exams.html' },
      target: function(days){
        if(!leftTopics) return { done: cfg.doneLine || 'Every published topic is at Strong or better. Keep Review clear and take a practice exam.' };
        return { n: Math.ceil(leftTopics / Math.max(1, days)), unit: 'topics', one: 'topic', why: 'brought to Strong covers the ' + leftTopics + ' not there yet' };
      }
    });
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
      examHistoryHtml: exHtml, frqHtml: frqHtml, lastBand: o.band && full.length ? full[full.length - 1].band : null, cram: true,
      gate: A.gate ? A.gate('analytics', 'dashboard') : '',
      analyticsDrawers: function(){ return [{ label: 'Mastery by skill', html: '<div id="d5Skills"></div>' }, { label: 'Tool accuracy', html: '<div id="d5Tools"></div>' }]; },
      fillAnalytics: function(c){
        var sk = skills();
        c.set('d5Skills', H.panel({ id: o.key + '-db-s', title: 'Mastery by skill' + c.pill, hint: o.skillHint,
          body: sk.length ? sk.map(function(s){ return H.row({ label: 'Skill ' + s.id, value: s.value, tier: c.tier(s.value, s.answered), note: plural(s.answered, 'item') + ' answered' }); }).join('') : '<p class="cx-emptynote">Skills appear once you have answered questions.</p>' }));
        var trows = (o.tools || []).map(function(t){ var s = A.toolStats(t.slug); return s.n ? H.row({ label: t.name, href: BASE + 'tools/' + t.slug + '.html', value: s.c / s.n, note: s.c + ' of ' + s.n + ' right' }) : ''; }).join('');
        c.set('d5Tools', trows ? H.panel({ id: o.key + '-db-t', title: 'Tool accuracy' + c.pill, body: trows }) : '<p class="cx-emptynote">Tools you use show their accuracy here.</p>');
      }
    });
  }

  window.LevlDashMastery = { build: build, ap: ap, initials: initials };
})();
