/* AP® Macroeconomics free-response kit: what frq.html, each frq/<id>.html and the
   practice exam's Section II share (docs/apmacro-architecture.md, "FRQ").

     ApMacroFrq.index(base) / load(base, id)   assets/frq/index.json, <id>.json
     ApMacroFrq.questionHtml(f, opts)          stimulus + parts; opts.write adds a
                                             labeled textarea per part,
                                             opts.n numbers it ("Question 3")
     ApMacroFrq.rubricHtml(f, opts)            per part: one checkbox per rubric
                                             point (what earns it, what else
                                             is accepted), then the sample
     ApMacroFrq.score(el)                      { got, of, parts: [n per part] }
     ApMacroFrq.bookletHtml(fs, opts)          the printable answer booklet:
                                             prompts and data, lined space per
                                             part (more for a graph), page
                                             breaks; opts.rubric adds each
                                             rubric on its own page
     ApMacroFrq.printOnly(html)                prints just that HTML (#mac-print)
     ApMacroFrq.draft(id) / saveDraft(id, part, text)
                                             typed answers, this device only:
                                             localStorage apmacro_frq_drafts_v1,
                                             never synced (spec: "saved
                                             locally only")
     ApMacroFrq.scores() / saveScore(id, rec)  self-scores in apmacro_prefs_v1
                                             .frqScores (synced with prefs)

   The student checks each rubric point themselves; the optional AI grader
   (assets/course/frq-grader.js) can pre-fill those checkboxes as an estimate. */
(function(){
  var DRAFTS = 'apmacro_frq_drafts_v1', PREFS = 'apmacro_prefs_v1';
  // The free-response questions of May 2027, in exam order
  // (docs/apmacro-research/framework.md, section 5): one long (10 points),
  // then two short (5 points each); a four-function calculator allowed.
  var TYPES = { long: 'Long free-response question', short: 'Short free-response question' };
  var ORDER = ['long', 'short'];
  function calcWord(){ return 'four-function calculator'; }
  var uid = 0;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  /* An "Also accept" line: math the build rendered (<math>...</math>) is kept,
     any $...$ left is rendered with ApMacroTex, and every other character is
     escaped, so a stray < in the words cannot become markup. */
  var MATH_SPLIT = /(<math[\s\S]*?<\/math>|\$\$[\s\S]+?\$\$|\$[^$]+?\$)/;
  function richText(s){
    var T = typeof window !== 'undefined' && window.ApMacroTex;
    return String(s == null ? '' : s).replace(/\\\$/g, '\u0000').split(MATH_SPLIT).map(function(x, i){
      if(i % 2 === 0) return esc(x);
      if(x.charAt(0) === '<') return x;
      var display = x.slice(0, 2) === '$$', tex = x.slice(display ? 2 : 1, display ? -2 : -1).replace(/\u0000/g, '\\$');
      return T ? T.render(tex, { display: display }) : esc(x);
    }).join('').replace(/\u0000/g, '$');
  }
  function base(){ return window.ApMacroBase || ''; }
  var cache = {};
  function get(b, u){
    var k = b + u;
    if(!cache[k]){ cache[k] = fetch(b + u).then(function(r){ if(!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }); cache[k].catch(function(){ delete cache[k]; }); }
    return cache[k];
  }
  function index(b){ return get(b, 'assets/frq/index.json'); }
  function load(b, id){ return get(b, 'assets/frq/' + id + '.json'); }
  function placePaths(h){ return String(h || '').replace(/(src|href)="figures\//g, '$1="' + base() + 'figures/'); }
  /* A question's data (a table, a chart), when it has any (built by build-apmacro.mjs). */
  /* The scenario (text before the parts, f.scenario), then the data. */
  function stim(f){
    var sc = f.scenario ? '<p class="mac-fq-scenario">' + f.scenario + '</p>' : '';
    if(!f.stimulus) return sc;
    var id = 'frqs-' + f.id + '-' + (++uid);
    return sc + '<section class="mac-stim" aria-labelledby="' + id + '"><p class="mac-stim-k">Data</p><h3 id="' + id + '">' + (f.stimulus.title || '') + '</h3>' + placePaths(f.stimulus.html) + '</section>';
  }
  /* A graph part (type "graph", docs/apmacro-architecture.md): drawn on the
     page with ApMacroGraph (paper gets a grid), and its rubric points that
     name an `auto` check (labels, shift, equilibrium, outcome, point) are
     ticked by ApMacroGrade.graph when the student asks: an estimate the
     student can change, never a score on its own. */
  function isGraphPart(f, p){ return p.type === 'graph' && !!p.graph; }
  var graphs = {};
  function graphKey(f, i){ return f.id + ':' + i; }
  function mountGraphs(root){
    if(!window.ApMacroGraph || !root) return;
    root.querySelectorAll('.mac-fq-graph[data-gk]:not(.mac-graph)').forEach(function(box){
      var k = box.getAttribute('data-gk'), f = checks[k.split(':')[0]], p = f && f.parts[+k.split(':')[1]];
      if(!p) return;
      var d = draft(f.id)['graph:' + p.label];
      graphs[k] = window.ApMacroGraph.mount(box, p.graph, { onChange: function(r){ saveDraft(f.id, 'graph:' + p.label, JSON.stringify(r)); } });
      if(d){ try{ graphs[k].set(JSON.parse(d)); }catch(e){} }
    });
  }
  function graphCheck(f, i, rubricEl){
    var p = f.parts[i], g = graphs[graphKey(f, i)];
    if(!g || !window.ApMacroGrade) return null;
    var res = window.ApMacroGrade.graph(p.graph, g.get()), by = {};
    res.points.forEach(function(x){ by[x.id] = x; });
    p.rubric.forEach(function(r, k){
      if(!r.auto || !by[r.auto]) return;
      var box = rubricEl.querySelector('input[data-part="' + i + '"][data-k="' + k + '"]');
      if(box) box.checked = by[r.auto].ok;
    });
    return res;
  }
  function pts(n){ return n + ' point' + (n === 1 ? '' : 's'); }

  function questionHtml(f, opts){
    opts = opts || {};
    var d = opts.write ? draft(opts.draftKey || f.id) : {};
    if(opts.write){ checks[f.id] = f; wireChecks(); }
    return '<div class="mac-fq" data-frq="' + esc(f.id) + '">' +
      (opts.n ? '<p class="mac-fq-k">Question ' + opts.n + ' &middot; ' + esc(TYPES[f.type] || '') + ' &middot; ' + calcWord(f) + ' &middot; ' + pts(f.points) + '</p>' : '') +
      stim(f) +
      '<ol class="mac-fq-parts">' + f.parts.map(function(p, i){
        var tid = 'fq-' + f.id + '-' + p.label + '-' + (++uid);
        return '<li class="mac-fq-part" data-i="' + i + '"><p class="mac-fq-prompt" id="' + tid + '-p"><b>(' + esc(p.label) + ')</b> ' + p.prompt + ' <span class="mac-small">[' + pts(p.points) + ']</span></p>' +
          (isGraphPart(f, p) ? (opts.write ? '<div class="mac-fq-graph" data-gk="' + esc(graphKey(f, i)) + '"></div>' : '<p class="mac-small mac-fq-graphnote">Draw this graph on paper or in the printed answer booklet.</p>') : '') +
          (opts.write ? '<label class="mac-fq-alabel" for="' + tid + '">Your answer to part (' + esc(p.label) + ')</label><textarea id="' + tid + '" class="mac-fq-answer" rows="' + Math.min(10, 3 + p.points * 2) + '" data-part="' + esc(p.label) + '" aria-describedby="' + tid + '-p" spellcheck="true">' + esc(d[p.label] || '') + '</textarea>' : '') +
          '</li>';
      }).join('') + '</ol></div>';
  }

  function rubricHtml(f, opts){
    opts = opts || {};
    if(!opts.readonly){ checks[f.id] = f; wireChecks(); }
    var name = 'rb-' + f.id + '-' + (++uid), had = opts.checked || {};
    return '<div class="mac-fq-rubric" data-frq="' + esc(f.id) + '">' + f.parts.map(function(p, i){
      return '<fieldset class="mac-fq-rpart"><legend>Part (' + esc(p.label) + ') &middot; ' + pts(p.points) + '</legend>' +
        p.rubric.map(function(r, k){
          var id = name + '-' + i + '-' + k, on = had[i] && had[i][k];
          return '<label class="mac-fq-point" for="' + id + '"><input type="checkbox" id="' + id + '" data-part="' + i + '" data-k="' + k + '"' + (on ? ' checked' : '') + (opts.readonly ? ' disabled' : '') + '>' +
            '<span><b>1 point.</b> ' + r.point + (r.accept && r.accept.length ? '<span class="mac-fq-accept">Also accept: ' + r.accept.map(function(a){ return richText(String(a).replace(/\.\s*$/, '')); }).join('; ') + '</span>' : '') + '</span></label>';
        }).join('') +
        '<div class="mac-fq-sample"><p class="mac-fq-sample-k">A full-credit answer</p><p>' + p.sample + '</p></div>' +
        (opts.readonly ? '' : numCheckHtml(f, p, i)) + '</fieldset>';
    }).join('') + '</div>';
  }
  /* Hints as you write (spec section 7): a part with `write` rules (cite a
     direction, a causal link) shows the rule flags of ApMacroGrade.flags
     under its rubric; a graph part adds "Check my graph". Hints only: they
     never change the self-score unless the student keeps the ticks. */
  function numCheckHtml(f, p, i){
    var g = isGraphPart(f, p) && p.rubric.some(function(r){ return r.auto; }) ? '<p><button type="button" class="btn-outline sm mac-fq-gcheck" data-frq="' + esc(f.id) + '" data-part="' + i + '">Check my graph</button></p><div class="mac-fq-gnote" aria-live="polite"></div>' : '';
    return g + (p.write ? '<div class="mac-fq-flags" data-frq="' + esc(f.id) + '" data-part="' + i + '" aria-live="polite"></div>' : '');
  }
  var checks = {};
  function wireChecks(){
    if(typeof document === 'undefined' || wireChecks.on) return;
    wireChecks.on = true;
    // Graphs mount once the question's HTML is in the page.
    try{ new MutationObserver(function(){ mountGraphs(document.body); }).observe(document.body, { childList: true, subtree: true }); }catch(e){}
    document.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('.mac-fq-gcheck');
      if(!b) return;
      var f = checks[b.getAttribute('data-frq')], i = +b.getAttribute('data-part'), rb = b.closest('.mac-fq-rubric');
      var res = f && rb && graphCheck(f, i, rb), note = b.parentNode.nextElementSibling;
      if(note) note.innerHTML = !res ? '<p class="mac-small">Draw the graph in your answer first.</p>' : res.correct ? '<p class="mac-small">Every graph point checks out. The boxes are ticked; change them if you disagree.</p>' : '<ul class="mac-num-notes">' + res.notes.map(function(n){ return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
    });
    document.addEventListener('input', function(e){
      var ta = e.target.closest && e.target.closest('.mac-fq-answer');
      if(!ta || !window.ApMacroGrade) return;
      var fq = ta.closest('[data-frq]'), f = fq && checks[fq.getAttribute('data-frq')];
      if(!f) return;
      var i = -1; f.parts.forEach(function(p, k){ if(p.label === ta.getAttribute('data-part')) i = k; });
      var p = f.parts[i], box = document.querySelector('.mac-fq-flags[data-frq="' + f.id + '"][data-part="' + i + '"]');
      if(!p || !p.write || !box) return;
      var W = {}; for(var k in p.write) W[k] = p.write[k];
      var fl = window.ApMacroGrade.flags({ write: W }, ta.value).filter(function(x){ return !x.ok; });
      box.innerHTML = fl.length ? '<ul class="mac-num-notes">' + fl.map(function(x){ return '<li>' + esc(x.hint) + '</li>'; }).join('') + '</ul>' : '';
    });
  }
  function score(el){
    var parts = [], got = 0, of = 0;
    el.querySelectorAll('.mac-fq-point input').forEach(function(c){
      var i = +c.getAttribute('data-part');
      parts[i] = (parts[i] || 0) + (c.checked ? 1 : 0);
      of++; if(c.checked) got++;
    });
    return { got: got, of: of, parts: parts };
  }
  function checked(el){
    var out = {};
    el.querySelectorAll('.mac-fq-rubric').forEach(function(r){
      var id = r.getAttribute('data-frq'), o = out[id] = out[id] || {};
      r.querySelectorAll('.mac-fq-point input').forEach(function(c){ var i = c.getAttribute('data-part'); (o[i] = o[i] || [])[+c.getAttribute('data-k')] = c.checked; });
    });
    return out;
  }

  function lines(n){ var s = ''; for(var i = 0; i < n; i++) s += '<div></div>'; return '<div class="mac-lines">' + s + '</div>'; }
  function bookletHtml(fs, opts){
    opts = opts || {};
    var head = '<p class="mac-frq-print-head">Name: ______________________ &nbsp; Date: ____________</p>';
    var body = fs.map(function(f, n){
      return '<section class="mac-bk-q"' + (n ? ' data-break="1"' : '') + '>' + head +
        '<p class="mac-fq-k">' + (fs.length > 1 ? 'Question ' + (n + 1) + ' &middot; ' : '') + esc(f.title) + ' &middot; ' + esc(TYPES[f.type] || '') + ' &middot; ' + calcWord(f) + ' &middot; ' + pts(f.points) + '</p>' + stim(f) +
        '<ol class="mac-fq-parts">' + f.parts.map(function(p){
          return '<li><p class="mac-fq-prompt"><b>(' + esc(p.label) + ')</b> ' + p.prompt + ' <span class="mac-small">[' + pts(p.points) + ']</span></p>' + (isGraphPart(f, p) ? '<div class="mac-frq-grid"></div>' + lines(4) : lines(Math.max(5, p.points * 6))) + '</li>';
        }).join('') + '</ol></section>';
    }).join('');
    var rub = opts.rubric ? fs.map(function(f){
      return '<section class="mac-bk-q mac-bk-rubric" data-break="1"><h2>Rubric: ' + esc(f.title) + '</h2>' + rubricHtml(f, { readonly: true }).replace(/<input [^>]*>/g, '<span class="mac-bk-box" aria-hidden="true"></span>') + '</section>';
    }).join('') : '';
    return '<div class="mac-booklet">' + (opts.title ? '<h1 class="mac-ws-title">' + esc(opts.title) + '</h1>' + (opts.note ? '<p class="mac-small">' + esc(opts.note) + '</p>' : '') : '') + body + rub + '</div>';
  }
  function printOnly(html){
    var box = document.getElementById('mac-print');
    if(!box){ box = document.createElement('div'); box.id = 'mac-print'; document.body.appendChild(box); }
    box.innerHTML = html;
    document.body.classList.add('mac-printing');
    var done = function(){ document.body.classList.remove('mac-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  }

  function readJson(k){ try{ return JSON.parse(localStorage.getItem(k) || '{}') || {}; }catch(e){ return {}; } }
  function draft(id){ return readJson(DRAFTS)[id] || {}; }
  function saveDraft(id, part, text){
    try{ var d = readJson(DRAFTS); d[id] = d[id] || {}; if(text) d[id][part] = text; else delete d[id][part]; localStorage.setItem(DRAFTS, JSON.stringify(d)); }catch(e){}
  }
  function scores(){ return readJson(PREFS).frqScores || {}; }
  function saveScore(id, rec){
    try{
      var p = readJson(PREFS), s = p.frqScores || {};
      var prev = s[id];
      rec.ts = Date.now(); rec.tries = (prev && prev.tries || 0) + 1; rec.best = Math.max(rec.got, prev && prev.best || 0);
      s[id] = rec; p.frqScores = s;
      localStorage.setItem(PREFS, JSON.stringify(p));
    }catch(e){}
  }

  window.ApMacroFrq = { mountGraphs: mountGraphs, graphCheck: graphCheck, TYPES: TYPES, ORDER: ORDER, index: index, load: load, questionHtml: questionHtml, rubricHtml: rubricHtml, score: score, checked: checked,
    bookletHtml: bookletHtml, printOnly: printOnly, draft: draft, saveDraft: saveDraft, scores: scores, saveScore: saveScore, esc: esc };
})();
