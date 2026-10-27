/* AP® Psychology free-response kit: what frq.html, each frq/<id>.html and the
   practice exam's Section II share (docs/appsych-architecture.md, "FRQ").

     ApPsychFrq.index(base) / load(base, id)   assets/frq/index.json, <id>.json
     ApPsychFrq.questionHtml(f, opts)          stimulus + parts; opts.write adds a
                                             labeled textarea per part,
                                             opts.n numbers it ("Question 3")
     ApPsychFrq.rubricHtml(f, opts)            per part: one checkbox per rubric
                                             point (what earns it, what else
                                             is accepted), then the sample
     ApPsychFrq.score(el)                      { got, of, parts: [n per part] }
     ApPsychFrq.bookletHtml(fs, opts)          the printable answer booklet:
                                             prompts and data, lined space per
                                             part (more for a graph), page
                                             breaks; opts.rubric adds each
                                             rubric on its own page
     ApPsychFrq.printOnly(html)                prints just that HTML (#psy-print)
     ApPsychFrq.draft(id) / saveDraft(id, part, text)
                                             typed answers, this device only:
                                             localStorage appsych_frq_drafts_v1,
                                             never synced (spec: "saved
                                             locally only")
     ApPsychFrq.scores() / saveScore(id, rec)  self-scores in appsych_prefs_v1
                                             .frqScores (synced with prefs)

   The student checks each rubric point themselves; the optional AI grader
   (assets/course/frq-grader.js) can pre-fill those checkboxes as an estimate. */
(function(){
  var DRAFTS = 'appsych_frq_drafts_v1', PREFS = 'appsych_prefs_v1';
  // The two free-response questions of May 2027, in exam order
  // (docs/appsych-research/framework.md, section 5): 7 points each, no calculator.
  var TYPES = { aaq: 'Q1: Article Analysis Question (AAQ)', ebq: 'Q2: Evidence-Based Question (EBQ)' };
  var ORDER = ['aaq', 'ebq'];
  function calcWord(){ return 'no calculator'; }
  var uid = 0;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  /* An "Also accept" line: math the build rendered (<math>...</math>) is kept,
     any $...$ left is rendered with ApPsychTex, and every other character is
     escaped, so a stray < in the words cannot become markup. */
  var MATH_SPLIT = /(<math[\s\S]*?<\/math>|\$\$[\s\S]+?\$\$|\$[^$]+?\$)/;
  function richText(s){
    var T = typeof window !== 'undefined' && window.ApPsychTex;
    return String(s == null ? '' : s).replace(/\\\$/g, '\u0000').split(MATH_SPLIT).map(function(x, i){
      if(i % 2 === 0) return esc(x);
      if(x.charAt(0) === '<') return x;
      var display = x.slice(0, 2) === '$$', tex = x.slice(display ? 2 : 1, display ? -2 : -1).replace(/\u0000/g, '\\$');
      return T ? T.render(tex, { display: display }) : esc(x);
    }).join('').replace(/\u0000/g, '$');
  }
  function base(){ return window.ApPsychBase || ''; }
  var cache = {};
  function get(b, u){
    var k = b + u;
    if(!cache[k]){ cache[k] = fetch(b + u).then(function(r){ if(!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }); cache[k].catch(function(){ delete cache[k]; }); }
    return cache[k];
  }
  function index(b){ return get(b, 'assets/frq/index.json'); }
  function load(b, id){ return get(b, 'assets/frq/' + id + '.json'); }
  function placePaths(h){ return String(h || '').replace(/(src|href)="figures\//g, '$1="' + base() + 'figures/'); }
  /* What the student reads: the AAQ's study, or the EBQ's three sources,
     each a study summary in the exam's sections (built by build-appsych.mjs). */
  function stim(f){
    return (f.readings || []).map(function(s){
      var id = 'frqs-' + f.id + '-' + (++uid);
      return '<section class="psy-stim" aria-labelledby="' + id + '"><p class="psy-stim-k">' + (f.type === 'ebq' ? 'Source' : 'Study') + '</p><h3 id="' + id + '">' + (s.title || '') + '</h3>' + placePaths(s.html) + '</section>';
    }).join('');
  }
  /* Every part is written in lines on paper (nothing to graph). */
  function space(){ return 'lines'; }
  function isGraphPart(){ return false; }
  function pts(n){ return n + ' point' + (n === 1 ? '' : 's'); }

  function questionHtml(f, opts){
    opts = opts || {};
    var d = opts.write ? draft(opts.draftKey || f.id) : {};
    if(opts.write){ checks[f.id] = f; wireChecks(); }
    return '<div class="psy-fq" data-frq="' + esc(f.id) + '">' +
      (opts.n ? '<p class="psy-fq-k">Question ' + opts.n + ' &middot; ' + esc(TYPES[f.type] || '') + ' &middot; ' + calcWord(f) + ' &middot; ' + pts(f.points) + '</p>' : '') +
      stim(f) +
      '<ol class="psy-fq-parts">' + f.parts.map(function(p, i){
        var tid = 'fq-' + f.id + '-' + p.label + '-' + (++uid);
        return '<li class="psy-fq-part" data-i="' + i + '"><p class="psy-fq-prompt" id="' + tid + '-p"><b>(' + esc(p.label) + ')</b> ' + p.prompt + ' <span class="psy-small">[' + pts(p.points) + ']</span></p>' +
          (isGraphPart(f, p) ? '<p class="psy-small psy-fq-graphnote">Draw this graph on paper or in the printed answer booklet, then describe it below if you like.</p>' : '') +
          (opts.write ? '<label class="psy-fq-alabel" for="' + tid + '">Your answer to part (' + esc(p.label) + ')</label><textarea id="' + tid + '" class="psy-fq-answer" rows="' + Math.min(10, 3 + p.points * 2) + '" data-part="' + esc(p.label) + '" aria-describedby="' + tid + '-p" spellcheck="true">' + esc(d[p.label] || '') + '</textarea>' : '') +
          '</li>';
      }).join('') + '</ol></div>';
  }

  function rubricHtml(f, opts){
    opts = opts || {};
    if(!opts.readonly){ checks[f.id] = f; wireChecks(); }
    var name = 'rb-' + f.id + '-' + (++uid), had = opts.checked || {};
    return '<div class="psy-fq-rubric" data-frq="' + esc(f.id) + '">' + f.parts.map(function(p, i){
      return '<fieldset class="psy-fq-rpart"><legend>Part (' + esc(p.label) + ') &middot; ' + pts(p.points) + '</legend>' +
        p.rubric.map(function(r, k){
          var id = name + '-' + i + '-' + k, on = had[i] && had[i][k];
          return '<label class="psy-fq-point" for="' + id + '"><input type="checkbox" id="' + id + '" data-part="' + i + '" data-k="' + k + '"' + (on ? ' checked' : '') + (opts.readonly ? ' disabled' : '') + '>' +
            '<span><b>1 point.</b> ' + r.point + (r.accept && r.accept.length ? '<span class="psy-fq-accept">Also accept: ' + r.accept.map(richText).join('; ') + '</span>' : '') + '</span></label>';
        }).join('') +
        '<div class="psy-fq-sample"><p class="psy-fq-sample-k">A full-credit answer</p><p>' + p.sample + '</p></div>' +
        (opts.readonly ? '' : numCheckHtml(f, p, i)) + '</fieldset>';
    }).join('') + '</div>';
  }
  /* Hints as you write (spec section 7): a part with `write` rules (cite a
     source, name a concept, avoid a restricted term) shows the rule flags of
     ApPsychGrade.flags under its rubric. Hints only: they never change the
     self-score. The EBQ's restricted terms come from the question. */
  function numCheckHtml(f, p, i){
    if(!p.write) return '';
    return '<div class="psy-fq-flags" data-frq="' + esc(f.id) + '" data-part="' + i + '" aria-live="polite"></div>';
  }
  var checks = {};
  function wireChecks(){
    if(typeof document === 'undefined' || wireChecks.on) return;
    wireChecks.on = true;
    document.addEventListener('input', function(e){
      var ta = e.target.closest && e.target.closest('.psy-fq-answer');
      if(!ta || !window.ApPsychGrade) return;
      var fq = ta.closest('[data-frq]'), f = fq && checks[fq.getAttribute('data-frq')];
      if(!f) return;
      var i = -1; f.parts.forEach(function(p, k){ if(p.label === ta.getAttribute('data-part')) i = k; });
      var p = f.parts[i], box = document.querySelector('.psy-fq-flags[data-frq="' + f.id + '"][data-part="' + i + '"]');
      if(!p || !p.write || !box) return;
      var W = {}; for(var k in p.write) W[k] = p.write[k];
      if(f.restricted && !W.restricted) W.restricted = f.restricted;
      var fl = window.ApPsychGrade.flags({ write: W }, ta.value).filter(function(x){ return !x.ok; });
      box.innerHTML = fl.length ? '<ul class="psy-num-notes">' + fl.map(function(x){ return '<li>' + esc(x.hint) + '</li>'; }).join('') + '</ul>' : '';
    });
  }
  function score(el){
    var parts = [], got = 0, of = 0;
    el.querySelectorAll('.psy-fq-point input').forEach(function(c){
      var i = +c.getAttribute('data-part');
      parts[i] = (parts[i] || 0) + (c.checked ? 1 : 0);
      of++; if(c.checked) got++;
    });
    return { got: got, of: of, parts: parts };
  }
  function checked(el){
    var out = {};
    el.querySelectorAll('.psy-fq-rubric').forEach(function(r){
      var id = r.getAttribute('data-frq'), o = out[id] = out[id] || {};
      r.querySelectorAll('.psy-fq-point input').forEach(function(c){ var i = c.getAttribute('data-part'); (o[i] = o[i] || [])[+c.getAttribute('data-k')] = c.checked; });
    });
    return out;
  }

  function lines(n){ var s = ''; for(var i = 0; i < n; i++) s += '<div></div>'; return '<div class="psy-lines">' + s + '</div>'; }
  function bookletHtml(fs, opts){
    opts = opts || {};
    var head = '<p class="psy-frq-print-head">Name: ______________________ &nbsp; Date: ____________</p>';
    var body = fs.map(function(f, n){
      return '<section class="psy-bk-q"' + (n ? ' data-break="1"' : '') + '>' + head +
        '<p class="psy-fq-k">' + (fs.length > 1 ? 'Question ' + (n + 1) + ' &middot; ' : '') + esc(f.title) + ' &middot; ' + esc(TYPES[f.type] || '') + ' &middot; ' + calcWord(f) + ' &middot; ' + pts(f.points) + '</p>' + stim(f) +
        '<ol class="psy-fq-parts">' + f.parts.map(function(p){
          return '<li><p class="psy-fq-prompt"><b>(' + esc(p.label) + ')</b> ' + p.prompt + ' <span class="psy-small">[' + pts(p.points) + ']</span></p>' + (isGraphPart(f, p) ? '<div class="psy-frq-grid"></div>' + lines(4) : lines(Math.max(5, p.points * 6))) + '</li>';
        }).join('') + '</ol></section>';
    }).join('');
    var rub = opts.rubric ? fs.map(function(f){
      return '<section class="psy-bk-q psy-bk-rubric" data-break="1"><h2>Rubric: ' + esc(f.title) + '</h2>' + rubricHtml(f, { readonly: true }).replace(/<input [^>]*>/g, '<span class="psy-bk-box" aria-hidden="true"></span>') + '</section>';
    }).join('') : '';
    return '<div class="psy-booklet">' + (opts.title ? '<h1 class="psy-ws-title">' + esc(opts.title) + '</h1>' + (opts.note ? '<p class="psy-small">' + esc(opts.note) + '</p>' : '') : '') + body + rub + '</div>';
  }
  function printOnly(html){
    var box = document.getElementById('psy-print');
    if(!box){ box = document.createElement('div'); box.id = 'psy-print'; document.body.appendChild(box); }
    box.innerHTML = html;
    document.body.classList.add('psy-printing');
    var done = function(){ document.body.classList.remove('psy-printing'); window.removeEventListener('afterprint', done); };
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

  window.ApPsychFrq = { TYPES: TYPES, ORDER: ORDER, index: index, load: load, questionHtml: questionHtml, rubricHtml: rubricHtml, score: score, checked: checked,
    bookletHtml: bookletHtml, printOnly: printOnly, draft: draft, saveDraft: saveDraft, scores: scores, saveScore: saveScore, esc: esc };
})();
