/* AP® Chemistry free-response kit: what frq.html, each frq/<id>.html and the
   practice exam's Section II share (docs/apchem-architecture.md, "FRQ").

     ApChemFrq.index(base) / load(base, id)   assets/frq/index.json, <id>.json
     ApChemFrq.questionHtml(f, opts)          stimulus + parts; opts.write adds a
                                             labelled textarea per part,
                                             opts.n numbers it ("Question 3")
     ApChemFrq.rubricHtml(f, opts)            per part: one checkbox per rubric
                                             point (what earns it, what else
                                             is accepted), then the sample
     ApChemFrq.score(el)                      { got, of, parts: [n per part] }
     ApChemFrq.bookletHtml(fs, opts)          the printable answer booklet:
                                             prompts and data, lined space per
                                             part (more for a graph), page
                                             breaks; opts.rubric adds each
                                             rubric on its own page
     ApChemFrq.printOnly(html)                prints just that HTML (#chem-print)
     ApChemFrq.draft(id) / saveDraft(id, part, text)
                                             typed answers, this device only:
                                             localStorage apchem_frq_drafts_v1,
                                             never synced (spec: "saved
                                             locally only")
     ApChemFrq.scores() / saveScore(id, rec)  self-scores in apchem_prefs_v1
                                             .frqScores (synced with prefs)

   No AI grading: the student checks each rubric point themselves. */
(function(){
  var DRAFTS = 'apchem_frq_drafts_v1', PREFS = 'apchem_prefs_v1';
  // The exam's two lengths: long (10 points) and short (4 points).
  var TYPES = { long: 'Long free response', short: 'Short free response' };
  var ORDER = ['long', 'short'];
  var uid = 0;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function base(){ return window.ApChemBase || ''; }
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
    var KIND = { table: 'Data table', graph: 'Graph', setup: 'Experimental setup', model: 'Model', particle: 'Particle view' };
    return '<section class="chem-stim" aria-labelledby="' + id + '"><p class="chem-stim-k">' + (KIND[s.kind] || 'Stimulus') + '</p><h3 id="' + id + '">' + esc(s.title) + '</h3>' + placePaths(s.html) + '</section>';
  }
  function isGraphPart(f, p){ return !!f.graphSpec && /graph|plot|construct/i.test(String(p.prompt).replace(/<[^>]+>/g, '')); }
  function pts(n){ return n + ' point' + (n === 1 ? '' : 's'); }

  function questionHtml(f, opts){
    opts = opts || {};
    var d = opts.write ? draft(opts.draftKey || f.id) : {};
    return '<div class="chem-fq" data-frq="' + esc(f.id) + '">' +
      (opts.n ? '<p class="chem-fq-k">Question ' + opts.n + ' &middot; ' + esc(TYPES[f.type] || '') + ' &middot; ' + pts(f.points) + '</p>' : '') +
      stim(f) +
      '<ol class="chem-fq-parts">' + f.parts.map(function(p, i){
        var tid = 'fq-' + f.id + '-' + p.label + '-' + (++uid);
        return '<li class="chem-fq-part" data-i="' + i + '"><p class="chem-fq-prompt" id="' + tid + '-p"><b>(' + esc(p.label) + ')</b> ' + p.prompt + ' <span class="chem-small">[' + pts(p.points) + ']</span></p>' +
          (isGraphPart(f, p) ? '<p class="chem-small chem-fq-graphnote">Draw this graph on paper or in the printed answer booklet, then describe it below if you like.</p>' : '') +
          (opts.write ? '<label class="chem-fq-alabel" for="' + tid + '">Your answer to part (' + esc(p.label) + ')</label><textarea id="' + tid + '" class="chem-fq-answer" rows="' + Math.min(10, 3 + p.points * 2) + '" data-part="' + esc(p.label) + '" aria-describedby="' + tid + '-p" spellcheck="true">' + esc(d[p.label] || '') + '</textarea>' : '') +
          '</li>';
      }).join('') + '</ol></div>';
  }

  function rubricHtml(f, opts){
    opts = opts || {};
    var name = 'rb-' + f.id + '-' + (++uid), had = opts.checked || {};
    return '<div class="chem-fq-rubric" data-frq="' + esc(f.id) + '">' + f.parts.map(function(p, i){
      return '<fieldset class="chem-fq-rpart"><legend>Part (' + esc(p.label) + ') &middot; ' + pts(p.points) + '</legend>' +
        p.rubric.map(function(r, k){
          var id = name + '-' + i + '-' + k, on = had[i] && had[i][k];
          return '<label class="chem-fq-point" for="' + id + '"><input type="checkbox" id="' + id + '" data-part="' + i + '" data-k="' + k + '"' + (on ? ' checked' : '') + (opts.readonly ? ' disabled' : '') + '>' +
            '<span><b>1 point.</b> ' + r.point + (r.accept && r.accept.length ? '<span class="chem-fq-accept">Also accept: ' + r.accept.map(esc).join('; ') + '</span>' : '') + '</span></label>';
        }).join('') +
        '<div class="chem-fq-sample"><p class="chem-fq-sample-k">A full-credit answer</p><p>' + p.sample + '</p></div></fieldset>';
    }).join('') + '</div>';
  }
  function score(el){
    var parts = [], got = 0, of = 0;
    el.querySelectorAll('.chem-fq-point input').forEach(function(c){
      var i = +c.getAttribute('data-part');
      parts[i] = (parts[i] || 0) + (c.checked ? 1 : 0);
      of++; if(c.checked) got++;
    });
    return { got: got, of: of, parts: parts };
  }
  function checked(el){
    var out = {};
    el.querySelectorAll('.chem-fq-rubric').forEach(function(r){
      var id = r.getAttribute('data-frq'), o = out[id] = out[id] || {};
      r.querySelectorAll('.chem-fq-point input').forEach(function(c){ var i = c.getAttribute('data-part'); (o[i] = o[i] || [])[+c.getAttribute('data-k')] = c.checked; });
    });
    return out;
  }

  function lines(n){ var s = ''; for(var i = 0; i < n; i++) s += '<div></div>'; return '<div class="chem-lines">' + s + '</div>'; }
  function bookletHtml(fs, opts){
    opts = opts || {};
    var head = '<p class="chem-frq-print-head">Name: ______________________ &nbsp; Date: ____________</p>';
    var body = fs.map(function(f, n){
      return '<section class="chem-bk-q"' + (n ? ' data-break="1"' : '') + '>' + head +
        '<p class="chem-fq-k">' + (fs.length > 1 ? 'Question ' + (n + 1) + ' &middot; ' : '') + esc(f.title) + ' &middot; ' + esc(TYPES[f.type] || '') + ' &middot; ' + pts(f.points) + '</p>' + stim(f) +
        '<ol class="chem-fq-parts">' + f.parts.map(function(p){
          return '<li><p class="chem-fq-prompt"><b>(' + esc(p.label) + ')</b> ' + p.prompt + ' <span class="chem-small">[' + pts(p.points) + ']</span></p>' + (isGraphPart(f, p) ? '<div class="chem-frq-grid"></div>' + lines(4) : lines(Math.max(5, p.points * 6))) + '</li>';
        }).join('') + '</ol></section>';
    }).join('');
    var rub = opts.rubric ? fs.map(function(f){
      return '<section class="chem-bk-q chem-bk-rubric" data-break="1"><h2>Rubric: ' + esc(f.title) + '</h2>' + rubricHtml(f, { readonly: true }).replace(/<input [^>]*>/g, '<span class="chem-bk-box" aria-hidden="true"></span>') + '</section>';
    }).join('') : '';
    return '<div class="chem-booklet">' + (opts.title ? '<h1 class="chem-ws-title">' + esc(opts.title) + '</h1>' + (opts.note ? '<p class="chem-small">' + esc(opts.note) + '</p>' : '') : '') + body + rub + '</div>';
  }
  function printOnly(html){
    var box = document.getElementById('chem-print');
    if(!box){ box = document.createElement('div'); box.id = 'chem-print'; document.body.appendChild(box); }
    box.innerHTML = html;
    document.body.classList.add('chem-printing');
    var done = function(){ document.body.classList.remove('chem-printing'); window.removeEventListener('afterprint', done); };
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

  window.ApChemFrq = { TYPES: TYPES, ORDER: ORDER, index: index, load: load, questionHtml: questionHtml, rubricHtml: rubricHtml, score: score, checked: checked,
    bookletHtml: bookletHtml, printOnly: printOnly, draft: draft, saveDraft: saveDraft, scores: scores, saveScore: saveScore, esc: esc };
})();
