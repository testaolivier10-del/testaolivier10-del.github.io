/* Search across the A&P course (docs/anp-spec.md section 3): lessons, notes,
   glossary and tools, all in the browser.

   Sources, each allowed to fail on its own (offline you get whatever the
   service worker has cached, and the status line says what made it in):
     AnpCurriculum      the built topics: one lesson result each
     AnpTools           the tools
     assets/glossary.json   every defined term
     assets/notes-index.json, then each notes page, split into paragraphs so a
                        hit points at the passage (fetched in the background)
   Matching, ranking and highlighting are the site's shared engine,
   assets/site-search.js (LevlSearch); the box, pills, grouped results and
   keyboard are the shared search page (assets/course/hub.js, LevlHub.search),
   the same in every course. */
(function(){
  var app = document.getElementById('app');
  var CU = window.AnpCurriculum, H = window.LevlHub;
  if(!app || !CU || !H) return;
  var BASE = window.ANP_BASE || '';
  var INDEX = [];

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  var TOPIC = {}, CHAPTER = {}, CORE = {};
  CU.topics.forEach(function(t){ TOPIC[t.id] = t; });
  CU.chapters.forEach(function(c){ CHAPTER[c.id] = c; });
  CU.core.forEach(function(c){ CORE[c.id] = c; });

  /* ---- the index ---- */
  function structure(){
    var out = [];
    CU.topics.filter(function(t){ return t.built; }).forEach(function(t){
      var ch = CHAPTER[t.chapter];
      var core = (t.core || []).map(function(k){ return CORE[k] ? CORE[k].name : k; }).join(', ');
      out.push({ page: 'Lessons', file: BASE + 'lessons/' + t.id + '.html', heading: t.title, meta: 'Topic ' + t.n + ' · ' + (ch ? ch.title : ''),
        text: t.title + '. Interactive lesson in ' + (ch ? ch.title : 'the course') + '. Core concepts: ' + core + '.', weight: 3 });
    });
    (window.AnpTools || []).forEach(function(t){
      out.push({ page: 'Tools', file: BASE + 'tools/' + t.slug + '.html', heading: t.name, meta: 'Interactive tool', text: t.name + '. ' + t.blurb, weight: 3 });
    });
    [['practice', 'Practice', 'Drill a topic, a system or a core concept; mixed review; missed questions.'],
     ['review', 'Review', 'Your spaced review queue of missed questions.'],
     ['exams', 'Exams', 'Unit quizzes, system exams and TEAS A&P practice.'],
     ['flashcards', 'Flashcards', 'Spaced-repetition cards from the glossary and comparison tables.'],
     ['dashboard', 'Dashboard', 'Your mastery by topic, system and core concept.'],
     ['glossary', 'Glossary', 'Every defined term with word roots and pronunciation.'],
     ['learn', 'Learn', 'Every chapter and topic in course order.']].forEach(function(p){
      out.push({ page: 'Pages', file: BASE + p[0] + '.html', heading: p[1], meta: 'Course page', text: p[1] + '. ' + p[2], weight: 1.5 });
    });
    return out;
  }
  function glossary(g){
    // A lesson also answers for the terms it teaches ("mitral" finds the valves lesson).
    var byTopic = {};
    Object.keys(g || {}).forEach(function(cid){ var x = g[cid]; (byTopic[x.p] = byTopic[x.p] || []).push(x.t); });
    INDEX.forEach(function(c){
      var id = c.page === 'Lessons' && c.file.replace(/^.*lessons\//, '').replace(/\.html$/, '');
      if(id && byTopic[id]) c.text += ' Terms taught: ' + byTopic[id].join(', ') + '.';
    });
    return Object.keys(g || {}).map(function(cid){
      var x = g[cid], t = TOPIC[x.p];
      return { page: 'Glossary', file: BASE + 'glossary.html#t-' + cid, heading: x.t, meta: t ? 'Taught in ' + t.title : 'Glossary',
        text: x.d + (x.r && x.r.length ? ' Word roots: ' + x.r.map(function(r){ return r[0] + ' (' + r[1] + ')'; }).join(', ') + '.' : ''), weight: 2 };
    });
  }
  function noteChunks(entry, html){
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var root = doc.querySelector('.anp-prose') || doc.querySelector('main') || doc.body;
    root.querySelectorAll('script,style,nav,.anp-crumb,.anp-onward').forEach(function(n){ n.remove(); });
    var out = [], heading = entry.title, hid = '';
    root.querySelectorAll('h2,h3,p,li,td,th,dd,figcaption').forEach(function(el){
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if(!text) return;
      if(/^H[23]$/.test(el.tagName)){ heading = text; hid = el.id || ''; return; }
      if(text.length < 30) return;
      out.push({ page: 'Notes', file: entry.href + (hid ? '#' + hid : ''), heading: entry.title === heading ? entry.title : entry.title + ' — ' + heading, meta: 'Notes', text: text, weight: 1, fragment: 1 });
    });
    return out;
  }
  function getJson(url){ return fetch(url).then(function(r){ if(!r.ok) throw 0; return r.json(); }); }

  var engine = H.engine(BASE + '../assets/site-search.js');
  var sr = H.search({
    mount: app, prefix: 'anp-sr', placeholder: 'Search lessons, notes, terms and tools (e.g. “gap junction”)',
    kinds: ['Lessons', 'Notes', 'Glossary', 'Tools', 'Pages'], engine: engine, allHref: BASE + '../search.html'
  });
  engine.then(function(){
    INDEX = structure();
    var gl = getJson(BASE + 'assets/glossary.json').then(function(g){ return glossary(g); });
    sr.add(INDEX);
    return sr.add(gl, 'the glossary');
  }).then(function(){
    // Notes last: many small fetches, done in the background.
    sr.add(getJson(BASE + 'assets/notes-index.json').then(function(list){
      return Promise.all(list.map(function(n){
        var id = String(n.file).replace(/^.*\/notes\//, '').replace(/\.html$/, '');
        var entry = { title: n.title, href: BASE + 'notes/' + id + '.html' };
        return fetch(entry.href).then(function(r){ if(!r.ok) throw 0; return r.text(); })
          .then(function(html){ return noteChunks(entry, html); })
          .catch(function(){ return [{ page: 'Notes', file: entry.href, heading: n.title, meta: 'Notes', text: n.title, weight: 1 }]; });
      })).then(function(all){ return all.reduce(function(a, b){ return a.concat(b); }, []); });
    }), 'the notes');
  }, function(){});
})();
