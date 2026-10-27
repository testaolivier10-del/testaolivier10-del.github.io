/* The A&P dashboard (docs/anp-spec.md section 12, docs/dashboard.md): the five-question dashboard of
   assets/course/dash.js, built by assets/course/dash-ap.js from AnpCore (the answer records in anp_progress_v1),
   the site's shared XP and streak (HubProgress) and the flashcard schedule (anp_flashcards_v1). Nothing is stored
   by this page.

   Free (spec decision 72: progress is never locked): what to do next, weekly accuracy, coverage of the course by
   chapter, chapters and core concepts by what they cost, level and mastery, milestones, and in the drawers the panels
   this page always had (weakest topics, mastery by chapter and topic, by core concept, the exam-date card). Premium
   (AnpCore.allowed('analytics')): weakest core concepts and tool accuracy.

   Every bar carries its number as text beside it, and a word for the tier, so no reading depends on colour. */
document.addEventListener('DOMContentLoaded', function(){
  var app = document.getElementById('app');
  var M = window.LevlDashMastery, A = window.AnpCore, CU = window.AnpCurriculum, H = window.LevlHub;
  if(!app || !M || !A || !CU || !H) return;
  var BASE = window.ANP_BASE || '';
  var TOOL_ROWS = [
    { kind: 'lab-practical', name: 'Lab practical', by: 'by system' },
    { kind: 'predict', name: 'Predict the change', by: 'by difficulty level' },
    { kind: 'feedback-loops', name: 'Feedback loops', by: 'by loop' },
    { kind: 'pathways', name: 'Pathways', by: 'by pathway' },
    { kind: 'graphs', name: 'Graph reader', by: 'by graph' }
  ];
  var TOPIC = {}, CHAPTER = {};
  CU.topics.forEach(function(t){ TOPIC[t.id] = t; });
  CU.chapters.forEach(function(c){ CHAPTER[c.id] = c; });
  function pct(v){ return Math.round((v || 0) * 100); }
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }
  function groupLabel(kind, g){
    if(/^\d+$/.test(g)) return 'Level ' + g;
    if(/^level-?\d+$/i.test(g)) return 'Level ' + g.replace(/\D/g, '');
    if(CHAPTER[g]) return CHAPTER[g].title;
    if(TOPIC[g]) return TOPIC[g].title;
    var s = String(g).replace(/[-_]+/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function draw(){
    M.build({
      key: 'anp', name: 'A&amp;P', A: A, CU: CU, base: BASE, root: app, group: 'chapter',
      groups: CU.chapters.map(function(ch){ return { id: ch.id, n: ch.n, icon: String(ch.n), label: ch.n + '. ' + ch.title, short: ch.title, weight: null }; }),
      groupMastery: function(id){ return A.chapterMastery(id); },
      second: { label: 'Core concepts', title: 'Mastery by core concept', word: 'core concept',
        items: CU.core.map(function(c){ return { id: c.id, short: M.initials(c.name), name: c.name, page: BASE + 'concepts/' + c.id + '.html' }; }),
        mastery: function(id){ return A.coreMastery(id); }, href: function(id){ return BASE + 'practice.html?core=' + encodeURIComponent(id); } },
      gate: A.gate('analytics', 'dashboard', '', 'Your progress, XP, streak, mastery and weakest topics stay free.'),
      milestones: true, cross: true, doneLine: 'Every built topic is at Strong or better. Keep Review clear and take a cumulative exam.',
      analyticsDrawers: function(){ return [{ label: 'Weakest core concepts', html: '<div id="d5WeakCore"></div>' }, { label: 'Tool accuracy', html: '<div id="d5Tools"></div>' }]; },
      fillAnalytics: function(c){
        var weakCore = A.weakestCore(3);
        c.set('d5WeakCore', H.panel({ id: 'anp-db-weakc', title: 'Weakest core concepts' + c.pill, body: weakCore.length ? weakCore.map(function(w){
          return H.row({ label: w.name, href: BASE + 'concepts/' + w.id + '.html', value: w.value, tier: c.tier(w.value, w.answered), note: plural(w.answered, 'item') + ' answered', action: { href: BASE + 'practice.html?core=' + encodeURIComponent(w.id), label: 'Practice' } });
        }).join('') : '<p class="cx-emptynote">Core concepts appear once you have answered questions tagged with them.</p>' }));
        c.set('d5Tools', H.panel({ id: 'anp-db-tools', title: 'Tool accuracy' + c.pill, hint: 'Share of items right in each tool, all time.', body: TOOL_ROWS.map(function(t){
          var s = A.toolStats(t.kind);
          var head = '<h3 class="cx-row-name" style="display:block;margin:14px 0 2px"><a href="' + H.esc(BASE + 'tools/' + t.kind + '.html') + '">' + H.esc(t.name) + '</a></h3>';
          if(!s.n) return head + '<p class="cx-emptynote">Not tried yet.</p>';
          var groups = Object.keys(s.by || {}).sort(function(a, b){ return String(a).localeCompare(String(b), undefined, { numeric: true }); });
          return head + H.row({ label: 'Overall', value: s.c / s.n, text: pct(s.c / s.n) + '%', note: s.c + ' of ' + s.n + ' right' }) +
            (groups.length ? '<p class="cx-hint" style="margin:6px 0 0">' + H.esc(t.by) + '</p>' + groups.map(function(g){ var x = s.by[g]; return H.row({ label: groupLabel(t.kind, g), value: x.n ? x.c / x.n : 0, note: x.c + ' of ' + x.n + ' right' }); }).join('') : '');
        }).join('') }));
      }
    });
  }
  draw();
  // Another tab recording answers, or account sync pulling progress, redraws.
  window.addEventListener('storage', function(e){ if(!e.key || /^anp_|^hub/.test(e.key)) draw(); });
  document.addEventListener('anp:progress', draw);
});
