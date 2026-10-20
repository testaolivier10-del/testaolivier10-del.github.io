/* AP® Physics 1 free-response kit: what frq.html, each frq/<id>.html and the
   practice exam's Section II share (docs/apphys-architecture.md, "FRQ").

     ApPhysFrq.index(base) / load(base, id)   assets/frq/index.json, <id>.json
     ApPhysFrq.questionHtml(f, opts)          stimulus + parts; opts.write adds a
                                             labelled textarea per part,
                                             opts.n numbers it ("Question 3")
     ApPhysFrq.rubricHtml(f, opts)            per part: one checkbox per rubric
                                             point (what earns it, what else
                                             is accepted), then the sample
     ApPhysFrq.score(el)                      { got, of, parts: [n per part] }
     ApPhysFrq.bookletHtml(fs, opts)          the printable answer booklet:
                                             prompts and data, lined space per
                                             part (more for a graph), page
                                             breaks; opts.rubric adds each
                                             rubric on its own page
     ApPhysFrq.printOnly(html)                prints just that HTML (#phys-print)
     ApPhysFrq.draft(id) / saveDraft(id, part, text)
                                             typed answers, this device only:
                                             localStorage apphys_frq_drafts_v1,
                                             never synced (spec: "saved
                                             locally only")
     ApPhysFrq.scores() / saveScore(id, rec)  self-scores in apphys_prefs_v1
                                             .frqScores (synced with prefs)

   The student checks each rubric point themselves; the optional AI grader
   (assets/course/frq-grader.js) can pre-fill those checkboxes as an estimate. */
(function(){
  var DRAFTS = 'apphys_frq_drafts_v1', PREFS = 'apphys_prefs_v1';
  // The exam's four types, in exam order (docs/apphys-spec.md decision 5).
  var TYPES = { mr: 'Mathematical Routines', tbr: 'Translation Between Representations', lab: 'Experimental Design and Analysis', qqt: 'Qualitative/Quantitative Translation' };
  var ORDER = ['mr', 'tbr', 'lab', 'qqt'];
  var uid = 0;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function base(){ return window.ApPhysBase || ''; }
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
    var KIND = { table: 'Data table', graph: 'Graph', setup: 'Experimental setup', model: 'Model', diagram: 'Diagram' };
    return '<section class="phys-stim" aria-labelledby="' + id + '"><p class="phys-stim-k">' + (KIND[s.kind] || 'Stimulus') + '</p><h3 id="' + id + '">' + esc(s.title) + '</h3>' + placePaths(s.html) + '</section>';
  }
  /* The answer space a part needs on paper (build-apphys.mjs partSpace):
     "graph" (a grid from graphSpec), "draw" (a blank box from drawSpec: a
     free-body diagram or a bar chart) or "lines". */
  function space(f, p){ return p.space || (f.graphSpec && /graph|plot|construct/i.test(String(p.prompt).replace(/<[^>]+>/g, '')) ? 'graph' : 'lines'); }
  function isGraphPart(f, p){ return !!f.graphSpec && space(f, p) === 'graph'; }
  function isDrawPart(f, p){ return !!f.drawSpec && space(f, p) === 'draw'; }
  function drawBox(d){
    if(d.kind === 'bars') return '<div class="phys-frq-draw phys-frq-bars">' + (d.bars || []).map(function(b){ return '<span>' + esc(b) + '</span>'; }).join('') + '</div>';
    return '<div class="phys-frq-draw' + (d.kind === 'fbd' ? ' phys-frq-fbd' : '') + '"><i></i></div>';
  }
  function pts(n){ return n + ' point' + (n === 1 ? '' : 's'); }

  function questionHtml(f, opts){
    opts = opts || {};
    var d = opts.write ? draft(opts.draftKey || f.id) : {};
    return '<div class="phys-fq" data-frq="' + esc(f.id) + '">' +
      (opts.n ? '<p class="phys-fq-k">Question ' + opts.n + ' &middot; ' + esc(TYPES[f.type] || '') + ' &middot; ' + pts(f.points) + '</p>' : '') +
      stim(f) +
      '<ol class="phys-fq-parts">' + f.parts.map(function(p, i){
        var tid = 'fq-' + f.id + '-' + p.label + '-' + (++uid);
        return '<li class="phys-fq-part" data-i="' + i + '"><p class="phys-fq-prompt" id="' + tid + '-p"><b>(' + esc(p.label) + ')</b> ' + p.prompt + ' <span class="phys-small">[' + pts(p.points) + ']</span></p>' +
          (isGraphPart(f, p) ? '<p class="phys-small phys-fq-graphnote">Draw this graph on paper or in the printed answer booklet, then describe it below if you like.</p>' : '') +
          (isDrawPart(f, p) ? '<p class="phys-small phys-fq-graphnote">Draw this ' + (f.drawSpec.kind === 'bars' ? 'bar chart' : f.drawSpec.kind === 'fbd' ? 'free-body diagram' : 'diagram') + ' on paper or in the printed answer booklet, then describe it below if you like.</p>' : '') +
          (opts.write ? '<label class="phys-fq-alabel" for="' + tid + '">Your answer to part (' + esc(p.label) + ')</label><textarea id="' + tid + '" class="phys-fq-answer" rows="' + Math.min(10, 3 + p.points * 2) + '" data-part="' + esc(p.label) + '" aria-describedby="' + tid + '-p" spellcheck="true">' + esc(d[p.label] || '') + '</textarea>' : '') +
          '</li>';
      }).join('') + '</ol></div>';
  }

  function rubricHtml(f, opts){
    opts = opts || {};
    var name = 'rb-' + f.id + '-' + (++uid), had = opts.checked || {};
    return '<div class="phys-fq-rubric" data-frq="' + esc(f.id) + '">' + f.parts.map(function(p, i){
      return '<fieldset class="phys-fq-rpart"><legend>Part (' + esc(p.label) + ') &middot; ' + pts(p.points) + '</legend>' +
        p.rubric.map(function(r, k){
          var id = name + '-' + i + '-' + k, on = had[i] && had[i][k];
          return '<label class="phys-fq-point" for="' + id + '"><input type="checkbox" id="' + id + '" data-part="' + i + '" data-k="' + k + '"' + (on ? ' checked' : '') + (opts.readonly ? ' disabled' : '') + '>' +
            '<span><b>1 point.</b> ' + r.point + (r.accept && r.accept.length ? '<span class="phys-fq-accept">Also accept: ' + r.accept.map(esc).join('; ') + '</span>' : '') + '</span></label>';
        }).join('') +
        '<div class="phys-fq-sample"><p class="phys-fq-sample-k">A full-credit answer</p><p>' + p.sample + '</p></div></fieldset>';
    }).join('') + '</div>';
  }
  function score(el){
    var parts = [], got = 0, of = 0;
    el.querySelectorAll('.phys-fq-point input').forEach(function(c){
      var i = +c.getAttribute('data-part');
      parts[i] = (parts[i] || 0) + (c.checked ? 1 : 0);
      of++; if(c.checked) got++;
    });
    return { got: got, of: of, parts: parts };
  }
  function checked(el){
    var out = {};
    el.querySelectorAll('.phys-fq-rubric').forEach(function(r){
      var id = r.getAttribute('data-frq'), o = out[id] = out[id] || {};
      r.querySelectorAll('.phys-fq-point input').forEach(function(c){ var i = c.getAttribute('data-part'); (o[i] = o[i] || [])[+c.getAttribute('data-k')] = c.checked; });
    });
    return out;
  }

  function lines(n){ var s = ''; for(var i = 0; i < n; i++) s += '<div></div>'; return '<div class="phys-lines">' + s + '</div>'; }
  function bookletHtml(fs, opts){
    opts = opts || {};
    var head = '<p class="phys-frq-print-head">Name: ______________________ &nbsp; Date: ____________</p>';
    var body = fs.map(function(f, n){
      return '<section class="phys-bk-q"' + (n ? ' data-break="1"' : '') + '>' + head +
        '<p class="phys-fq-k">' + (fs.length > 1 ? 'Question ' + (n + 1) + ' &middot; ' : '') + esc(f.title) + ' &middot; ' + esc(TYPES[f.type] || '') + ' &middot; ' + pts(f.points) + '</p>' + stim(f) +
        '<ol class="phys-fq-parts">' + f.parts.map(function(p){
          return '<li><p class="phys-fq-prompt"><b>(' + esc(p.label) + ')</b> ' + p.prompt + ' <span class="phys-small">[' + pts(p.points) + ']</span></p>' + (isGraphPart(f, p) ? '<div class="phys-frq-grid"></div>' + lines(4) : isDrawPart(f, p) ? drawBox(f.drawSpec) + lines(4) : lines(Math.max(5, p.points * 6))) + '</li>';
        }).join('') + '</ol></section>';
    }).join('');
    var rub = opts.rubric ? fs.map(function(f){
      return '<section class="phys-bk-q phys-bk-rubric" data-break="1"><h2>Rubric: ' + esc(f.title) + '</h2>' + rubricHtml(f, { readonly: true }).replace(/<input [^>]*>/g, '<span class="phys-bk-box" aria-hidden="true"></span>') + '</section>';
    }).join('') : '';
    return '<div class="phys-booklet">' + (opts.title ? '<h1 class="phys-ws-title">' + esc(opts.title) + '</h1>' + (opts.note ? '<p class="phys-small">' + esc(opts.note) + '</p>' : '') : '') + body + rub + '</div>';
  }
  function printOnly(html){
    var box = document.getElementById('phys-print');
    if(!box){ box = document.createElement('div'); box.id = 'phys-print'; document.body.appendChild(box); }
    box.innerHTML = html;
    document.body.classList.add('phys-printing');
    var done = function(){ document.body.classList.remove('phys-printing'); window.removeEventListener('afterprint', done); };
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

  window.ApPhysFrq = { TYPES: TYPES, ORDER: ORDER, index: index, load: load, questionHtml: questionHtml, rubricHtml: rubricHtml, score: score, checked: checked,
    bookletHtml: bookletHtml, printOnly: printOnly, draft: draft, saveDraft: saveDraft, scores: scores, saveScore: saveScore, esc: esc };
})();
