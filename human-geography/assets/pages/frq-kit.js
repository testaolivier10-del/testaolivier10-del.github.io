/* AP® Human Geography free-response kit: what frq.html, each frq/<id>.html and the
   practice exam's Section II share (docs/aphug-architecture.md, "FRQ").

     ApHugFrq.index(base) / load(base, id)   assets/frq/index.json, <id>.json
     ApHugFrq.questionHtml(f, opts)          stimulus + parts; opts.write adds a
                                             labeled textarea per part,
                                             opts.n numbers it ("Question 3")
     ApHugFrq.rubricHtml(f, opts)            per part: one checkbox per rubric
                                             point (what earns it, what else
                                             is accepted), then the sample
     ApHugFrq.score(el)                      { got, of, parts: [n per part] }
     ApHugFrq.bookletHtml(fs, opts)          the printable answer booklet:
                                             prompts and data, lined space per
                                             part, page
                                             breaks; opts.rubric adds each
                                             rubric on its own page
     ApHugFrq.printOnly(html)                prints just that HTML (#hug-print)
     ApHugFrq.draft(id) / saveDraft(id, part, text)
                                             typed answers, this device only:
                                             localStorage aphug_frq_drafts_v1,
                                             never synced (spec: "saved
                                             locally only")
     ApHugFrq.scores() / saveScore(id, rec)  self-scores in aphug_prefs_v1
                                             .frqScores (synced with prefs)

   The student checks each rubric point themselves; the optional AI grader
   (assets/course/frq-grader.js) can pre-fill those checkboxes as an estimate. */
(function(){
  var DRAFTS = 'aphug_frq_drafts_v1', PREFS = 'aphug_prefs_v1';
  // The three free-response questions of May 2027, in exam order
  // (docs/aphug-research/framework.md, section 5): no stimulus, one, two;
  // seven one-point parts A to G each, every part with its task verb; no calculator.
  var TYPES = { none: 'Q1: No stimulus', one: 'Q2: One stimulus', two: 'Q3: Two stimuli' };
  var ORDER = ['none', 'one', 'two'];
  var KIND = { map: 'Map', data: 'Data', image: 'Image', text: 'Text' };
  /* The live hints a part gets from its verb (ApHugGrade.flags): an explain
     needs its link, a compare both sides, explain the degree a stated degree
     and its reason. A part's own `write` rules are added on top. */
  var VERB_WRITE = { explain: { mechanism: true }, compare: { both: true }, 'explain-degree': { degree: true, mechanism: true } };
  function writeOf(p){ var W = {}, k, v = VERB_WRITE[p.verb] || {}; for(k in v) W[k] = v[k]; for(k in (p.write || {})) W[k] = p.write[k]; return W; }
  function hasWrite(p){ return Object.keys(writeOf(p)).length > 0; }
  /* The verb and what it demands, beside every prompt. */
  function verbHtml(p){ return p.verbName ? '<span class="hug-verb">' + esc(p.verbName) + '</span> ' : ''; }
  function demandHtml(p, id){ return p.demand ? '<p class="hug-fq-demand hug-small"' + (id ? ' id="' + id + '"' : '') + '><b>' + esc(p.verbName) + ' means:</b> ' + esc(p.demand) + '</p>' : ''; }
  function calcWord(){ return 'no calculator'; }
  var uid = 0;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  /* An "Also accept" line: math the build rendered (<math>...</math>) is kept,
     any $...$ left is rendered with ApHugTex, and every other character is
     escaped, so a stray < in the words cannot become markup. */
  var MATH_SPLIT = /(<math[\s\S]*?<\/math>|\$\$[\s\S]+?\$\$|\$[^$]+?\$)/;
  function richText(s){
    var T = typeof window !== 'undefined' && window.ApHugTex;
    return String(s == null ? '' : s).replace(/\\\$/g, '\u0000').split(MATH_SPLIT).map(function(x, i){
      if(i % 2 === 0) return esc(x);
      if(x.charAt(0) === '<') return x;
      var display = x.slice(0, 2) === '$$', tex = x.slice(display ? 2 : 1, display ? -2 : -1).replace(/\u0000/g, '\\$');
      return T ? T.render(tex, { display: display }) : esc(x);
    }).join('').replace(/\u0000/g, '$');
  }
  function base(){ return window.ApHugBase || ''; }
  var cache = {};
  function get(b, u){
    var k = b + u;
    if(!cache[k]){ cache[k] = fetch(b + u).then(function(r){ if(!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }); cache[k].catch(function(){ delete cache[k]; }); }
    return cache[k];
  }
  function index(b){ return get(b, 'assets/frq/index.json'); }
  function load(b, id){ return get(b, 'assets/frq/' + id + '.json'); }
  function placePaths(h){ return String(h || '').replace(/(src|href)="figures\//g, '$1="' + base() + 'figures/'); }
  /* What the student reads: no stimulus, one, or two (titled Source 1 and
     Source 2), each a map, data, an image or a text (built by build-aphug.mjs). */
  function stim(f){
    return (f.readings || []).map(function(s){
      var id = 'frqs-' + f.id + '-' + (++uid);
      return '<section class="hug-stim" aria-labelledby="' + id + '"><p class="hug-stim-k">' + (KIND[s.kind] || 'Stimulus') + '</p><h3 id="' + id + '">' + (s.title || '') + '</h3>' + placePaths(s.html) + '</section>';
    }).join('');
  }
  function pts(n){ return n + ' point' + (n === 1 ? '' : 's'); }

  function questionHtml(f, opts){
    opts = opts || {};
    var d = opts.write ? draft(opts.draftKey || f.id) : {};
    if(opts.write){ checks[f.id] = f; wireChecks(); }
    return '<div class="hug-fq" data-frq="' + esc(f.id) + '">' +
      (opts.n ? '<p class="hug-fq-k">Question ' + opts.n + ' &middot; ' + esc(TYPES[f.type] || '') + ' &middot; ' + calcWord(f) + ' &middot; ' + pts(f.points) + '</p>' : '') +
      stim(f) +
      '<ol class="hug-fq-parts">' + f.parts.map(function(p, i){
        var tid = 'fq-' + f.id + '-' + p.label + '-' + (++uid);
        return '<li class="hug-fq-part" data-i="' + i + '" data-verb="' + esc(p.verb || '') + '"><p class="hug-fq-prompt" id="' + tid + '-p"><b>(' + esc(p.label) + ')</b> ' + verbHtml(p) + p.prompt + ' <span class="hug-small">[' + pts(p.points) + ']</span></p>' +
          demandHtml(p, tid + '-d') +
          (opts.write ? '<label class="hug-fq-alabel" for="' + tid + '">Your answer to part (' + esc(p.label) + ')</label><textarea id="' + tid + '" class="hug-fq-answer" rows="4" data-part="' + esc(p.label) + '" aria-describedby="' + tid + '-p ' + tid + '-d" spellcheck="true">' + esc(d[p.label] || '') + '</textarea>' +
            (hasWrite(p) ? '<div class="hug-fq-flags" data-frq="' + esc(f.id) + '" data-part="' + i + '" aria-live="polite"></div>' : '') : '') +
          '</li>';
      }).join('') + '</ol></div>';
  }

  function rubricHtml(f, opts){
    opts = opts || {};
    if(!opts.readonly){ checks[f.id] = f; wireChecks(); }
    var name = 'rb-' + f.id + '-' + (++uid), had = opts.checked || {};
    return '<div class="hug-fq-rubric" data-frq="' + esc(f.id) + '">' + f.parts.map(function(p, i){
      return '<fieldset class="hug-fq-rpart"><legend>Part (' + esc(p.label) + ')' + (p.verbName ? ' &middot; ' + esc(p.verbName) : '') + ' &middot; ' + pts(p.points) + '</legend>' +
        p.rubric.map(function(r, k){
          var id = name + '-' + i + '-' + k, on = had[i] && had[i][k];
          return '<label class="hug-fq-point" for="' + id + '"><input type="checkbox" id="' + id + '" data-part="' + i + '" data-k="' + k + '"' + (on ? ' checked' : '') + (opts.readonly ? ' disabled' : '') + '>' +
            '<span><b>1 point.</b> ' + r.point + (r.accept && r.accept.length ? '<span class="hug-fq-accept">Also accept: ' + r.accept.map(function(a){ return richText(String(a).replace(/\.\s*$/, '')); }).join('; ') + '</span>' : '') + '</span></label>';
        }).join('') +
        '<div class="hug-fq-sample"><p class="hug-fq-sample-k">A full-credit answer</p><p>' + p.sample + '</p></div>' +
        '</fieldset>';
    }).join('') + '</div>';
  }
  /* Hints as you write (spec section 3, item 2): under each answer box, the
     rule flags of ApHugGrade.flags for its verb (an explain without its
     because, a compare with one side) and its own `write` rules. Hints only:
     they never change the self-score. */
  var checks = {};
  function wireChecks(){
    if(typeof document === 'undefined' || wireChecks.on) return;
    wireChecks.on = true;
    document.addEventListener('input', function(e){
      var ta = e.target.closest && e.target.closest('.hug-fq-answer');
      if(!ta || !window.ApHugGrade) return;
      var fq = ta.closest('[data-frq]'), f = fq && checks[fq.getAttribute('data-frq')];
      if(!f) return;
      var i = -1; f.parts.forEach(function(p, k){ if(p.label === ta.getAttribute('data-part')) i = k; });
      var p = f.parts[i], box = document.querySelector('.hug-fq-flags[data-frq="' + f.id + '"][data-part="' + i + '"]');
      if(!p || !hasWrite(p) || !box) return;
      var W = writeOf(p);
      var fl = window.ApHugGrade.flags({ write: W }, ta.value).filter(function(x){ return !x.ok; });
      box.innerHTML = fl.length ? '<ul class="hug-num-notes">' + fl.map(function(x){ return '<li>' + esc(x.hint) + '</li>'; }).join('') + '</ul>' : '';
    });
  }
  function score(el){
    var parts = [], got = 0, of = 0;
    el.querySelectorAll('.hug-fq-point input').forEach(function(c){
      var i = +c.getAttribute('data-part');
      parts[i] = (parts[i] || 0) + (c.checked ? 1 : 0);
      of++; if(c.checked) got++;
    });
    return { got: got, of: of, parts: parts };
  }
  function checked(el){
    var out = {};
    el.querySelectorAll('.hug-fq-rubric').forEach(function(r){
      var id = r.getAttribute('data-frq'), o = out[id] = out[id] || {};
      r.querySelectorAll('.hug-fq-point input').forEach(function(c){ var i = c.getAttribute('data-part'); (o[i] = o[i] || [])[+c.getAttribute('data-k')] = c.checked; });
    });
    return out;
  }

  function lines(n){ var s = ''; for(var i = 0; i < n; i++) s += '<div></div>'; return '<div class="hug-lines">' + s + '</div>'; }
  function bookletHtml(fs, opts){
    opts = opts || {};
    var head = '<p class="hug-frq-print-head">Name: ______________________ &nbsp; Date: ____________</p>';
    var body = fs.map(function(f, n){
      return '<section class="hug-bk-q"' + (n ? ' data-break="1"' : '') + '>' + head +
        '<p class="hug-fq-k">' + (fs.length > 1 ? 'Question ' + (n + 1) + ' &middot; ' : '') + esc(f.title) + ' &middot; ' + esc(TYPES[f.type] || '') + ' &middot; ' + calcWord(f) + ' &middot; ' + pts(f.points) + '</p>' + stim(f) +
        '<ol class="hug-fq-parts">' + f.parts.map(function(p){
          return '<li><p class="hug-fq-prompt"><b>(' + esc(p.label) + ')</b> ' + verbHtml(p) + p.prompt + ' <span class="hug-small">[' + pts(p.points) + ']</span></p>' + lines(6) + '</li>';
        }).join('') + '</ol></section>';
    }).join('');
    var rub = opts.rubric ? fs.map(function(f){
      return '<section class="hug-bk-q hug-bk-rubric" data-break="1"><h2>Rubric: ' + esc(f.title) + '</h2>' + rubricHtml(f, { readonly: true }).replace(/<input [^>]*>/g, '<span class="hug-bk-box" aria-hidden="true"></span>') + '</section>';
    }).join('') : '';
    return '<div class="hug-booklet">' + (opts.title ? '<h1 class="hug-ws-title">' + esc(opts.title) + '</h1>' + (opts.note ? '<p class="hug-small">' + esc(opts.note) + '</p>' : '') : '') + body + rub + '</div>';
  }
  function printOnly(html){
    var box = document.getElementById('hug-print');
    if(!box){ box = document.createElement('div'); box.id = 'hug-print'; document.body.appendChild(box); }
    box.innerHTML = html;
    document.body.classList.add('hug-printing');
    var done = function(){ document.body.classList.remove('hug-printing'); window.removeEventListener('afterprint', done); };
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

  window.ApHugFrq = { TYPES: TYPES, ORDER: ORDER, VERB_WRITE: VERB_WRITE, writeOf: writeOf, index: index, load: load, questionHtml: questionHtml, rubricHtml: rubricHtml, score: score, checked: checked,
    bookletHtml: bookletHtml, printOnly: printOnly, draft: draft, saveDraft: saveDraft, scores: scores, saveScore: saveScore, esc: esc };
})();
