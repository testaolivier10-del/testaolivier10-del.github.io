/* AP® Calculus AB free-response kit: what frq.html, each frq/<id>.html and the
   practice exam's Section II share (docs/apcalc-architecture.md, "FRQ").

     ApCalcFrq.index(base) / load(base, id)   assets/frq/index.json, <id>.json
     ApCalcFrq.questionHtml(f, opts)          stimulus + parts; opts.write adds a
                                             labelled textarea per part,
                                             opts.n numbers it ("Question 3")
     ApCalcFrq.rubricHtml(f, opts)            per part: one checkbox per rubric
                                             point (what earns it, what else
                                             is accepted), then the sample
     ApCalcFrq.score(el)                      { got, of, parts: [n per part] }
     ApCalcFrq.bookletHtml(fs, opts)          the printable answer booklet:
                                             prompts and data, lined space per
                                             part (more for a graph), page
                                             breaks; opts.rubric adds each
                                             rubric on its own page
     ApCalcFrq.printOnly(html)                prints just that HTML (#calc-print)
     ApCalcFrq.draft(id) / saveDraft(id, part, text)
                                             typed answers, this device only:
                                             localStorage apcalc_frq_drafts_v1,
                                             never synced (spec: "saved
                                             locally only")
     ApCalcFrq.scores() / saveScore(id, rec)  self-scores in apcalc_prefs_v1
                                             .frqScores (synced with prefs)

   No AI grading: the student checks each rubric point themselves. */
(function(){
  var DRAFTS = 'apcalc_frq_drafts_v1', PREFS = 'apcalc_prefs_v1';
  // The recurring free-response types (docs/apcalc-research/framework.md,
  // section 5). Every question is worth 9 points; f.calc says whether it is a
  // Part A (graphing calculator) or a Part B (no calculator) question.
  var TYPES = { table: 'Rate in context from a table', model: 'Modeling with a given function', motion: 'Particle motion', area: 'Area and volume',
    de: 'Differential equation and slope field', graph: 'Graph of f\u2032 or graphical FTC', implicit: 'Implicit differentiation and related rates', fg: 'Table of f, g and their derivatives' };
  var ORDER = ['table', 'model', 'motion', 'area', 'de', 'graph', 'implicit', 'fg'];
  function calcWord(f){ return f.calc ? 'calculator' : 'no calculator'; }
  var uid = 0;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  /* An "Also accept" line: math the build rendered (<math>...</math>) is kept,
     any $...$ left is rendered with ApCalcTex, and every other character is
     escaped, so a stray < in the words cannot become markup. */
  var MATH_SPLIT = /(<math[\s\S]*?<\/math>|\$\$[\s\S]+?\$\$|\$[^$]+?\$)/;
  function richText(s){
    var T = typeof window !== 'undefined' && window.ApCalcTex;
    return String(s == null ? '' : s).replace(/\\\$/g, '\u0000').split(MATH_SPLIT).map(function(x, i){
      if(i % 2 === 0) return esc(x);
      if(x.charAt(0) === '<') return x;
      var display = x.slice(0, 2) === '$$', tex = x.slice(display ? 2 : 1, display ? -2 : -1).replace(/\u0000/g, '\\$');
      return T ? T.render(tex, { display: display }) : esc(x);
    }).join('').replace(/\u0000/g, '$');
  }
  function base(){ return window.ApCalcBase || ''; }
  var cache = {};
  function get(b, u){
    var k = b + u;
    if(!cache[k]){ cache[k] = fetch(b + u).then(function(r){ if(!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }); cache[k].catch(function(){ delete cache[k]; }); }
    return cache[k];
  }
  function index(b){ return get(b, 'assets/frq/index.json'); }
  function load(b, id){ return get(b, 'assets/frq/' + id + '.json'); }
  function placePaths(h){ return String(h || '').replace(/(src|href)="figures\//g, '$1="' + base() + 'figures/'); }
  function stim(f){
    var s = f.stimulus || {}, id = 'frqs-' + f.id + '-' + (++uid);
    var KIND = { table: 'Table', graph: 'Graph', diagram: 'Diagram' };
    return '<section class="calc-stim" aria-labelledby="' + id + '"><p class="calc-stim-k">' + (KIND[s.kind] || 'Stimulus') + '</p><h3 id="' + id + '">' + (s.title || '') + '</h3>' + placePaths(s.html) + '</section>';
  }
  /* The answer space a part needs on paper (build-apcalc.mjs partSpace):
     "graph" (a blank grid from graphSpec: sketch a curve, a slope field's
     solution, a graph of f') or "lines". */
  function space(f, p){ return p.space || (f.graphSpec && /sketch|graph|draw/i.test(String(p.prompt).replace(/<[^>]+>/g, '')) ? 'graph' : 'lines'); }
  function isGraphPart(f, p){ return !!f.graphSpec && space(f, p) === 'graph'; }
  function pts(n){ return n + ' point' + (n === 1 ? '' : 's'); }

  function questionHtml(f, opts){
    opts = opts || {};
    var d = opts.write ? draft(opts.draftKey || f.id) : {};
    return '<div class="calc-fq" data-frq="' + esc(f.id) + '">' +
      (opts.n ? '<p class="calc-fq-k">Question ' + opts.n + ' &middot; ' + esc(TYPES[f.type] || '') + ' &middot; ' + calcWord(f) + ' &middot; ' + pts(f.points) + '</p>' : '') +
      stim(f) +
      '<ol class="calc-fq-parts">' + f.parts.map(function(p, i){
        var tid = 'fq-' + f.id + '-' + p.label + '-' + (++uid);
        return '<li class="calc-fq-part" data-i="' + i + '"><p class="calc-fq-prompt" id="' + tid + '-p"><b>(' + esc(p.label) + ')</b> ' + p.prompt + ' <span class="calc-small">[' + pts(p.points) + ']</span></p>' +
          (isGraphPart(f, p) ? '<p class="calc-small calc-fq-graphnote">Draw this graph on paper or in the printed answer booklet, then describe it below if you like.</p>' : '') +
          (opts.write ? '<label class="calc-fq-alabel" for="' + tid + '">Your answer to part (' + esc(p.label) + ')</label><textarea id="' + tid + '" class="calc-fq-answer" rows="' + Math.min(10, 3 + p.points * 2) + '" data-part="' + esc(p.label) + '" aria-describedby="' + tid + '-p" spellcheck="true">' + esc(d[p.label] || '') + '</textarea>' : '') +
          '</li>';
      }).join('') + '</ol></div>';
  }

  function rubricHtml(f, opts){
    opts = opts || {};
    var name = 'rb-' + f.id + '-' + (++uid), had = opts.checked || {};
    return '<div class="calc-fq-rubric" data-frq="' + esc(f.id) + '">' + f.parts.map(function(p, i){
      return '<fieldset class="calc-fq-rpart"><legend>Part (' + esc(p.label) + ') &middot; ' + pts(p.points) + '</legend>' +
        p.rubric.map(function(r, k){
          var id = name + '-' + i + '-' + k, on = had[i] && had[i][k];
          return '<label class="calc-fq-point" for="' + id + '"><input type="checkbox" id="' + id + '" data-part="' + i + '" data-k="' + k + '"' + (on ? ' checked' : '') + (opts.readonly ? ' disabled' : '') + '>' +
            '<span><b>1 point.</b> ' + r.point + (r.accept && r.accept.length ? '<span class="calc-fq-accept">Also accept: ' + r.accept.map(richText).join('; ') + '</span>' : '') + '</span></label>';
        }).join('') +
        '<div class="calc-fq-sample"><p class="calc-fq-sample-k">A full-credit answer</p><p>' + p.sample + '</p></div></fieldset>';
    }).join('') + '</div>';
  }
  function score(el){
    var parts = [], got = 0, of = 0;
    el.querySelectorAll('.calc-fq-point input').forEach(function(c){
      var i = +c.getAttribute('data-part');
      parts[i] = (parts[i] || 0) + (c.checked ? 1 : 0);
      of++; if(c.checked) got++;
    });
    return { got: got, of: of, parts: parts };
  }
  function checked(el){
    var out = {};
    el.querySelectorAll('.calc-fq-rubric').forEach(function(r){
      var id = r.getAttribute('data-frq'), o = out[id] = out[id] || {};
      r.querySelectorAll('.calc-fq-point input').forEach(function(c){ var i = c.getAttribute('data-part'); (o[i] = o[i] || [])[+c.getAttribute('data-k')] = c.checked; });
    });
    return out;
  }

  function lines(n){ var s = ''; for(var i = 0; i < n; i++) s += '<div></div>'; return '<div class="calc-lines">' + s + '</div>'; }
  function bookletHtml(fs, opts){
    opts = opts || {};
    var head = '<p class="calc-frq-print-head">Name: ______________________ &nbsp; Date: ____________</p>';
    var body = fs.map(function(f, n){
      return '<section class="calc-bk-q"' + (n ? ' data-break="1"' : '') + '>' + head +
        '<p class="calc-fq-k">' + (fs.length > 1 ? 'Question ' + (n + 1) + ' &middot; ' : '') + esc(f.title) + ' &middot; ' + esc(TYPES[f.type] || '') + ' &middot; ' + calcWord(f) + ' &middot; ' + pts(f.points) + '</p>' + stim(f) +
        '<ol class="calc-fq-parts">' + f.parts.map(function(p){
          return '<li><p class="calc-fq-prompt"><b>(' + esc(p.label) + ')</b> ' + p.prompt + ' <span class="calc-small">[' + pts(p.points) + ']</span></p>' + (isGraphPart(f, p) ? '<div class="calc-frq-grid"></div>' + lines(4) : lines(Math.max(5, p.points * 6))) + '</li>';
        }).join('') + '</ol></section>';
    }).join('');
    var rub = opts.rubric ? fs.map(function(f){
      return '<section class="calc-bk-q calc-bk-rubric" data-break="1"><h2>Rubric: ' + esc(f.title) + '</h2>' + rubricHtml(f, { readonly: true }).replace(/<input [^>]*>/g, '<span class="calc-bk-box" aria-hidden="true"></span>') + '</section>';
    }).join('') : '';
    return '<div class="calc-booklet">' + (opts.title ? '<h1 class="calc-ws-title">' + esc(opts.title) + '</h1>' + (opts.note ? '<p class="calc-small">' + esc(opts.note) + '</p>' : '') : '') + body + rub + '</div>';
  }
  function printOnly(html){
    var box = document.getElementById('calc-print');
    if(!box){ box = document.createElement('div'); box.id = 'calc-print'; document.body.appendChild(box); }
    box.innerHTML = html;
    document.body.classList.add('calc-printing');
    var done = function(){ document.body.classList.remove('calc-printing'); window.removeEventListener('afterprint', done); };
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

  window.ApCalcFrq = { TYPES: TYPES, ORDER: ORDER, index: index, load: load, questionHtml: questionHtml, rubricHtml: rubricHtml, score: score, checked: checked,
    bookletHtml: bookletHtml, printOnly: printOnly, draft: draft, saveDraft: saveDraft, scores: scores, saveScore: saveScore, esc: esc };
})();
