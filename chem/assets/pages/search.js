/* Search across the AP® Chemistry course (forked from
   anatomy-physiology/assets/apps/search.js): lessons, notes, glossary,
   free-response questions, tools and course pages, all in the browser.

   Sources, each allowed to fail on its own:
     ApChemCurriculum            the published topics: one lesson result each
     window.ApChemToolList       the published tools
     assets/glossary.json       every defined term
     assets/frq/index.json      the free-response questions
     assets/notes-index.json, then each notes page, split into passages
                                (fetched in the background)
   Matching, ranking and highlighting: the site's shared engine,
   assets/site-search.js (LevlSearch); the page itself is the shared search
   page (assets/course/hub.js, LevlHub.search). The query lives in
   ?q=, so a search is a shareable link. */
(function(){
  /* assets/glossary.json is the shared shape (scripts/lib/glossary.mjs); this
     file works on the old map {id: {t, d, r, s, p, b}}. */
  function glossMap(g){
    if(!g || !g.terms) return g || {};
    var o = {};
    g.terms.forEach(function(x){ o[x.id] = { t: x.term, d: x.def, r: x.roots || [], s: x.say || '', p: x.topic, b: x.href ? 1 : 0 }; });
    return o;
  }
  var app = document.getElementById('app');
  var CU = window.ApChemCurriculum, H = window.LevlHub;
  if(!app || !CU || !H) return;
  var BASE = window.ApChemBase || '';
  var INDEX = [];
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  var TOPIC = {}, UNIT = {};
  CU.topics.forEach(function(t){ TOPIC[t.id] = t; });
  CU.units.forEach(function(u){ UNIT[u.id] = u; });
  function unitName(u){ var c = UNIT[u]; return c ? (c.part === 'course' ? 'Unit ' + c.n + ': ' : '') + c.title : ''; }

  function structure(){
    var out = [];
    CU.topics.filter(function(t){ return t.built; }).forEach(function(t){
      out.push({ page: 'Lessons', file: BASE + 'lessons/' + t.id + '.html', heading: t.title, meta: (t.ced ? 'Topic ' + t.ced + ' · ' : '') + unitName(t.unit), text: t.title + '. Lesson in ' + unitName(t.unit) + '.', weight: 3 });
    });
    (window.ApChemToolList || []).forEach(function(t){ if(t && t.slug && t.live) out.push({ page: 'Tools', file: BASE + 'tools/' + t.slug + '.html', heading: t.name, meta: 'Interactive tool', text: t.name + '. ' + (t.blurb || ''), weight: 3 }); });
    [['practice', 'Practice', 'Questions by unit, topic, science practice, type and difficulty; stimulus sets; missed questions.'],
     ['review', 'Review', 'Your spaced review queue of missed questions.'],
     ['exams', 'Exams', 'Unit tests and full practice exams in the hybrid format, with rubrics.'],
     ['frq', 'Free-response practice', 'Long and short free-response questions with rubrics, sample answers and printable sheets.'],
     ['flashcards', 'Flashcards', 'Spaced-repetition cards from the glossary and lesson summaries.'],
     ['dashboard', 'Dashboard', 'Your mastery by unit, topic and science practice.'],
     ['glossary', 'Glossary', 'Every defined term.'],
     ['teachers', 'For teachers', 'Share links, Google Classroom, printing, framework alignment.'],
     ['learn', 'Learn', 'Every unit and topic in course order.']].forEach(function(p){
      out.push({ page: 'Pages', file: BASE + p[0] + '.html', heading: p[1], meta: 'Course page', text: p[1] + '. ' + p[2], weight: 1.5 });
    });
    return out;
  }
  function glossary(g){
    var byTopic = {};
    Object.keys(g || {}).forEach(function(cid){ var x = g[cid]; (byTopic[x.p] = byTopic[x.p] || []).push(x.t); });
    INDEX.forEach(function(c){ var id = c.page === 'Lessons' && c.file.replace(/^.*lessons\//, '').replace(/\.html$/, ''); if(id && byTopic[id]) c.text += ' Terms taught: ' + byTopic[id].join(', ') + '.'; });
    return Object.keys(g || {}).map(function(cid){
      var x = g[cid], t = TOPIC[x.p];
      return { page: 'Glossary', file: BASE + 'glossary.html#t-' + cid, heading: x.t, meta: t ? 'Taught in ' + t.title : 'Glossary', text: x.d, weight: 2 };
    });
  }
  function frqs(list){
    return (list || []).map(function(f){ return { page: 'Free response', file: BASE + 'frq/' + f.id + '.html', heading: f.title, meta: (f.units || []).map(unitName).join(', ') + ' · ' + f.points + ' points', text: f.title + '. Free-response question. ' + (f.topics || []).map(function(t){ return TOPIC[t] ? TOPIC[t].title : ''; }).join(', '), weight: 2 }; });
  }
  function noteChunks(entry, html){
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var root = doc.querySelector('.chem-prose') || doc.querySelector('main') || doc.body;
    root.querySelectorAll('script,style,nav,.chem-crumb').forEach(function(n){ n.remove(); });
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
    mount: app, prefix: 'chem-sr', placeholder: 'Search the course… (e.g. “hydrogen bond”, “buffer”)',
    kinds: ['Lessons', 'Notes', 'Glossary', 'Free response', 'Tools', 'Pages'], engine: engine, allHref: BASE + '../search.html'
  });
  engine.then(function(){
    INDEX = structure();
    var gl = getJson(BASE + 'assets/glossary.json').then(function(g){ return glossary(glossMap(g)); });
    sr.add(INDEX);
    return Promise.all([sr.add(gl, 'the glossary'), sr.add(getJson(BASE + 'assets/frq/index.json').then(frqs), 'the free-response questions')]);
  }).then(function(){
    sr.add(getJson(BASE + 'assets/notes-index.json').then(function(list){
      return Promise.all(list.map(function(n){
        var id = String(n.file).replace(/^.*\/notes\//, '').replace(/\.html$/, '');
        var entry = { title: n.title, href: BASE + 'notes/' + id + '.html' };
        return fetch(entry.href).then(function(r){ if(!r.ok) throw 0; return r.text(); }).then(function(h){ return noteChunks(entry, h); })
          .catch(function(){ return [{ page: 'Notes', file: entry.href, heading: n.title, meta: 'Notes', text: n.title, weight: 1 }]; });
      })).then(function(all){ return all.reduce(function(a, b){ return a.concat(b); }, []); });
    }), 'the notes');
  }, function(){});
})();
