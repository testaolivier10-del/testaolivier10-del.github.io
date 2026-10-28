/* NREMT search: the index (audit 2026-10). nremt/search.html hands each
   source to LevlHub.search; this builds them. Every result links INTO the
   right place, not to the top of a page:

     Study notes     notes/<chapter>.html#<section>   one chunk per topic
     Tools           the tool, opened on the thing:  body-map.html?focus=,
                     flowcharts.html#flow-…, reference-cards.html#gcs,
                     sound-trainer.html#snd-…, scenario-sim.html?scenario=,
                     formulary.html#drug-…, skillsheets.html#station-…
     Glossary, Mnemonics, Exam day   the page, scrolled to the match
     Practice questions              practice.html?q=<id> (search.html)

   Each source may fail on its own (offline): it adds nothing and the status
   line names it. */
(function(){
  'use strict';
  function clean(s){ return String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim(); }
  function slug(t){ return String(t).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function get(url, kind){ return fetch(url).then(function(r){ if(!r.ok) throw 0; return kind === 'json' ? r.json() : r.text(); }); }
  function doc(html){ var d = new DOMParser().parseFromString(html, 'text/html'); d.querySelectorAll('script,style').forEach(function(n){ n.remove(); }); return d; }
  function txt(el){ return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }

  /* Study notes: every topic of every chapter, linked to its section. */
  function notes(){
    return get('assets/study-notes.json', 'json').then(function(j){
      var out = [];
      (j.chapters || []).forEach(function(ch){
        var file = 'notes/' + slug(ch.title) + '.html';
        out.push({ page: 'Study notes', meta: 'Chapter ' + ch.num, file: file, heading: ch.title, text: clean(ch.intro), weight: 1.3 });
        (ch.sections || []).forEach(function(s){
          (s.topics || []).forEach(function(t){
            out.push({ page: 'Study notes', meta: 'Chapter ' + ch.num + ' · ' + s.title, file: file + '#' + s.id, heading: t.heading, text: clean(t.html), weight: 1.2 });
          });
        });
      });
      return out;
    });
  }

  /* Tools: what each tool holds, deep-linked. */
  function tool(meta, file, heading, text, w){ return { page: 'Tools', meta: meta, file: file, heading: heading, text: text, weight: w || 1.5 }; }
  function bodyMap(){
    return get('assets/body-content.js').then(function(js){
      var m = /const GROUP_CONTENT = (\{[\s\S]*?\});\n/.exec(js);
      if(!m) return [];
      var g = JSON.parse(m[1]);
      return Object.keys(g).filter(function(k){ return g[k].name && k !== 'skin'; }).map(function(k){
        var c = g[k];
        return tool('Body map', 'body-map.html?focus=' + encodeURIComponent(c.name.toLowerCase()), c.name, [c.location, c.funct, c.path, c.findings].filter(Boolean).join(' '));
      });
    });
  }
  function flows(){
    return get('flowcharts.html').then(function(html){
      var d = doc(html), out = [];
      d.querySelectorAll('#flowDiagrams > h2').forEach(function(h){
        var card = h.nextElementSibling;
        while(card && !card.classList.contains('diagram-card')) card = card.nextElementSibling;
        var id = h.id || 'flow-' + txt(h).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
        out.push(tool('Protocol flows', 'flowcharts.html#' + id, txt(h), txt(card)));
      });
      return out;
    });
  }
  function refCards(){
    return get('reference-cards.html').then(function(html){
      var d = doc(html), out = [];
      d.querySelectorAll('.refcard').forEach(function(c){
        out.push(tool('Reference cards', 'reference-cards.html#' + c.id, txt(c.querySelector('h2')), txt(c)));
      });
      return out;
    });
  }
  // The case data is inline script, so it is read from the source rather than the DOM.
  function field(block, name){ var m = new RegExp('\\b' + name + ':\\s*"((?:[^"\\\\]|\\\\.)*)"').exec(block); return m ? m[1].replace(/\\u2014/g, '—').replace(/\\(.)/g, '$1') : ''; }
  function sounds(){
    return get('sound-trainer.html').then(function(html){
      var out = [], re = /\{\s*id:\s*"([a-z0-9-]+)",[\s\S]*?\n  \}/g, m;
      while((m = re.exec(html))){
        var b = m[0], label = field(b, 'label');
        if(label) out.push(tool('Sound trainer', 'sound-trainer.html#snd-' + m[1], label, field(b, 'description') + ' ' + field(b, 'clinical')));
      }
      return out;
    });
  }
  function scenarios(){
    return get('scenario-sim.html').then(function(html){
      var out = [], re = /\{\s*id:\s*"(s\d+)",\s*title:\s*"((?:[^"\\]|\\.)*)",\s*domain:\s*"([^"]*)",\s*blurb:\s*"((?:[^"\\]|\\.)*)"/g, m;
      while((m = re.exec(html))) out.push(tool('Scenario · ' + m[3], 'scenario-sim.html?scenario=' + m[1], m[2].replace(/\\(.)/g, '$1'), m[4].replace(/\\(.)/g, '$1')));
      return out;
    });
  }
  function drugs(){
    return get('formulary.html').then(function(html){
      var d = doc(html), out = [];
      d.querySelectorAll('.drug-grid .drug').forEach(function(c){
        var n = txt(c.querySelector('h2'));
        out.push(tool('Drug formulary', 'formulary.html#drug-' + n.toLowerCase().replace(/[^a-z]+/g, '-'), n, txt(c)));
      });
      return out;
    });
  }
  function stations(){
    return get('skillsheets.html').then(function(html){
      var d = doc(html), out = [];
      d.querySelectorAll('#stationCards .skill-card').forEach(function(c){
        var n = txt(c.querySelector('h3'));
        out.push(tool('Skill stations', 'skillsheets.html#station-' + slug(n), n, txt(c)));
      });
      return out;
    });
  }
  function tools(){
    return Promise.all([bodyMap(), flows(), refCards(), sounds(), scenarios(), drugs(), stations()].map(function(p){ return p.catch(function(){ return []; }); }))
      .then(function(all){ return all.reduce(function(a, b){ return a.concat(b); }, []); });
  }

  /* Reference pages that read top to bottom: the page, scrolled to the match. */
  function page(file, title){
    return get(file).then(function(html){
      var d = doc(html), out = [], heading = title;
      d.body.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,td,summary').forEach(function(el){
        var t = txt(el);
        if(!t) return;
        if(/^h[1-4]$/i.test(el.tagName)){ heading = t; return; }
        if(t.length < 12) return;
        out.push({ page: title, file: file, heading: heading, text: t, fragment: 1 });
      });
      return out;
    }).catch(function(){ return []; });
  }
  function pages(){
    return Promise.all([page('glossary.html', 'Glossary'), page('mnemonics.html', 'Mnemonics'), page('skillsheets.html', 'Skills guide'), page('exam-day.html', 'Exam day')])
      .then(function(all){ return all.reduce(function(a, b){ return a.concat(b); }, []); });
  }

  window.NremtSearchIndex = { notes: notes, tools: tools, pages: pages };
})();
