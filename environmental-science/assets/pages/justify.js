/* AP® Environmental Science "Make it specific" trainer (justify.html;
   docs/apenv-spec.md section 3, differentiator 4, and section 6; data format
   in docs/apenv-architecture.md, "Make it specific").

   Each prompt is an "explain" or "justify" task built on a point the Chief
   Reader Reports say students miss. The student writes an answer, then checks
   it against the rubric checklist, point by point, and reads two model
   answers: one that earns the point and one that does not, each with why.
   No AI grading: the student ticks what their own answer says, as on the
   free-response pages.

     list     ?list=1 (or ?unit= / ?skill=): every published prompt, filtered
              by unit and by skill, each with its last self-check
     start    no parameters: opens straight on the next prompt not yet
              self-checked (in course order), with "All prompts" one tap away
     one      ?p=<id>: context, prompt, a textarea (saved on this device in
              apenv_frq_drafts_v1 under "justify:<id>", as FRQ drafts are),
              then the checklist, the builder when the prompt has one
              (p.specific: a select per slot, graded exactly by
              ApEnvGrade.specific, the note naming the slot that is wrong;
              spec section 7, rule 4), and the two model answers

   Premium: the first prompts in course order (free: true in
   assets/justify.json) are open to everyone; the rest show the Premium card
   when ApEnvCore.locked() (nothing is locked before launch). Self-checks go
   to apenv_prefs_v1.justify { id: { got, of, best, ts, built? } }, where
   built is the builder's first try { right, of }. */
(function(){
  var BASE = window.ApEnvBase || '';
  var app = document.getElementById('app');
  if(!app) return;
  var Core = window.ApEnvCore;
  var CUR = window.ApEnvCurriculum || { units: [], topics: [] };
  var UNIT = {}; CUR.units.forEach(function(u){ UNIT[u.id] = u; });
  var TOPIC = {}; CUR.topics.forEach(function(t){ TOPIC[t.id] = t; });
  var DRAFTS = 'apenv_frq_drafts_v1', PREFS = 'apenv_prefs_v1';
  var DATA = null, filter = { unit: '', skill: '' };

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function readJson(k){ try{ return JSON.parse(localStorage.getItem(k) || '{}') || {}; }catch(e){ return {}; } }
  function draft(id){ return (readJson(DRAFTS)['justify:' + id] || {}).a || ''; }
  function saveDraft(id, text){ try{ var d = readJson(DRAFTS); if(text) d['justify:' + id] = { a: text }; else delete d['justify:' + id]; localStorage.setItem(DRAFTS, JSON.stringify(d)); }catch(e){} }
  function scores(){ return readJson(PREFS).justify || {}; }
  function saveScore(id, got, of){
    try{
      var p = readJson(PREFS), s = p.justify || {}, prev = s[id];
      s[id] = { got: got, of: of, best: Math.max(got, prev && prev.best || 0), ts: Date.now() };
      p.justify = s; localStorage.setItem(PREFS, JSON.stringify(p));
    }catch(e){}
  }
  function saveBuilt(id, right, of){
    try{
      var p = readJson(PREFS), s = p.justify || {}, cur = s[id] || { got: 0, of: 0, best: 0, ts: Date.now() };
      if(!cur.built){ cur.built = { right: right, of: of }; s[id] = cur; p.justify = s; localStorage.setItem(PREFS, JSON.stringify(p)); }
    }catch(e){}
  }
  function plain(t){ var T = window.ApEnvTex; return T && T.plain ? T.plain(t) : String(t).replace(/\$/g, ''); }
  /* The builder: one labeled select per slot, in order (slot labels are authored). */
  function builderHtml(p){
    var C = p.specific, names = Object.keys(C.slots);
    return '<fieldset class="env-fq-rpart env-js-build"><legend>Now build it part by part</legend>' +
      '<p class="env-small">Choose the wording for each part. This is graded exactly, part by part.</p><div class="env-cl">' +
      names.map(function(n, k){
        var sl = C.slots[n];
        return '<label class="env-cl-slot" for="env-js-b' + k + '"><span>' + esc(sl.label || n) + '</span><select id="env-js-b' + k + '" data-slot="' + esc(n) + '"><option value="">Choose</option>' +
          sl.options.map(function(o, i){ return '<option value="' + i + '">' + esc(plain(o)) + '</option>'; }).join('') + '</select></label>';
      }).join('') + '</div><div class="env-js-bact"><button type="button" class="btn-outline" data-act="build">Check my sentence</button></div>' +
      '<div class="env-js-bfb" role="status" aria-live="polite"></div></fieldset>';
  }
  function wireBuilder(box, p){
    var el = box.querySelector('.env-js-build'); if(!el) return;
    var btn = el.querySelector('[data-act="build"]'), fb = el.querySelector('.env-js-bfb'), first = true;
    btn.addEventListener('click', function(){
      var picks = {};
      el.querySelectorAll('select[data-slot]').forEach(function(sel){ if(sel.value !== '') picks[sel.getAttribute('data-slot')] = +sel.value; });
      var G = window.ApEnvGrade;
      var g = G ? G.specific(p.specific, picks) : { valid: false, notes: ['The grader did not load.'] };
      [].slice.call(el.querySelectorAll('.env-mark')).forEach(function(m){ m.remove(); });
      if(!g.valid){ fb.innerHTML = '<p class="env-small" role="alert">Choose an option in every part.</p>'; return; }
      var names = Object.keys(p.specific.slots), right = names.filter(function(n){ return g.slots[n]; }).length;
      el.querySelectorAll('select[data-slot]').forEach(function(sel){
        sel.insertAdjacentHTML('afterend', '<span class="env-mark ' + (g.slots[sel.getAttribute('data-slot')] ? 'ok">Right' : 'no">Check this') + '</span>');
      });
      // A wrong slot's note names the slot; its why is authored math HTML.
      var notes = names.filter(function(n){ return !g.slots[n]; }).map(function(n){
        var sl = p.specific.slots[n], w = sl.why && sl.why[picks[n]];
        return '<li>Check the ' + esc(((sl && sl.label) || n).toLowerCase()) + (w ? ': ' + w : '.') + '</li>';
      });
      fb.innerHTML = '<p><b>' + right + ' of ' + names.length + ' parts right.</b>' + (g.correct ? ' That sentence earns the point.' : '') + '</p>' + (notes.length ? '<ul class="env-num-notes">' + notes.join('') + '</ul>' : '');
      if(first){ first = false; saveBuilt(p.id, right, names.length); if(Core) Core.event('apenv-justify-build', { prompt: p.id, right: right, of: names.length }); }
    });
  }
  function locked(p){ return !p.free && Core && Core.locked && Core.locked(); }
  function unitLabel(u){ var c = UNIT[u]; return c ? (c.part === 'course' ? 'Unit ' + c.n : c.title) : u; }
  function view(name){ app.setAttribute('data-view', name); }
  var LIST = BASE + 'justify.html?list=1';
  // How it works: below the work, folded (open on wide screens).
  var HOW = '<details class="cx-card env-js-how"><summary>How it works</summary><ol class="env-js-steps">' +
    '<li><b>Write</b> your answer in full sentences: a claim, the evidence, and the reasoning that names the principle and its condition.</li>' +
    '<li><b>Check</b> it against the rubric, ticking only the points your answer actually makes.</li>' +
    '<li><b>Compare</b> two model answers: one that earns the point, and one that sounds right but does not.</li></ol></details>';
  function openWide(){ try{ var d = app.querySelector('.env-js-how'); if(d && matchMedia('(min-width: 900px)').matches) d.open = true; }catch(e){} }

  /* Tool Studio (docs/tools-calm.md; pages.json studio: true puts
     data-studio on #app). One prompt: the prompt and the answer box are the
     stage, Check my answer is the dock; after the check, the rubric to tick,
     Save my check and the two model answers are under Why, How it works and
     the follow-up links under Details. The list: the prompts on the stage,
     the two filters in the dock. */
  var LS = null;
  function studio(){
    if(LS) return LS;
    if(!app.getAttribute('data-studio') || !window.LevlStudio) return null;
    var main = app.parentNode, h1 = main.querySelector('.env-hero h1'), lede = main.querySelector('.env-hero .lede');
    main.classList.add('ls-host');
    // Back goes to the course home here, not to a tools page.
    LS = window.LevlStudio.mount({ title: h1 ? h1.textContent : 'Justification trainer', course: 'AP® Environmental Science', back: BASE + 'index.html', backLabel: 'Back to AP® Environmental Science',
      slug: 'apenv-justify', host: app, detailsTitle: 'Topic',
      menu: { copyLink: true, report: { course: 'apenv', id: 'page:justify' }, allTools: { label: 'Course home' },
        note: { label: 'Note.', html: 'This course has not yet been reviewed by an AP® Environmental Science teacher. <a href="' + BASE + '../sources.html">Sources</a>' } } });
    if(lede){ var pp = document.createElement('p'); pp.textContent = lede.textContent; LS.add('about', pp); }
    app.hidden = true;
    return LS;
  }
  function lsBox(cls, els){ var d = document.createElement('div'); d.className = cls; (els || []).forEach(function(e){ if(e) d.appendChild(e); }); return d; }

  /* -------------------------------------------------------------- list */
  function list(){
    view('list');
    var ps = DATA.prompts, sc = scores();
    var units = []; ps.forEach(function(p){ if(units.indexOf(p.unit) < 0) units.push(p.unit); });
    var skills = []; ps.forEach(function(p){ if(skills.indexOf(p.skill) < 0) skills.push(p.skill); });
    function opt(v, label, cur){ return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>'; }
    var done = ps.filter(function(p){ return sc[p.id]; }).length;
    app.innerHTML = '<p class="env-small">' + plural(ps.length, 'prompt') + ' across the units, each on a point the exam readers say students miss. ' + (done ? 'You have checked ' + done + ' of them.' : '') + '</p>' +
      '<form class="env-fq-filters" aria-label="Filter prompts">' +
        '<label class="env-pr-field"><span>Unit</span><select id="env-js-unit">' + opt('', 'Every unit', filter.unit) + units.map(function(u){ return opt(u, unitLabel(u) + (UNIT[u] ? ': ' + UNIT[u].title : ''), filter.unit); }).join('') + '</select></label>' +
        '<label class="env-pr-field"><span>Skill</span><select id="env-js-skill">' + opt('', 'Every skill', filter.skill) + skills.map(function(k){ return opt(k, DATA.skills[k] || k, filter.skill); }).join('') + '</select></label>' +
      '</form><p class="env-small" id="env-js-count" role="status" aria-live="polite"></p><ul class="env-fq-list env-js-list"></ul>' + HOW;
    var form, countEl, listEl;
    function paint(){
      var shown = ps.filter(function(p){ return (!filter.unit || p.unit === filter.unit) && (!filter.skill || p.skill === filter.skill); });
      countEl.textContent = plural(shown.length, 'prompt') + (filter.unit || filter.skill ? ' match.' : '.');
      listEl.innerHTML = shown.map(function(p){
        var s = sc[p.id];
        return '<li><a class="env-fq-card" href="?p=' + encodeURIComponent(p.id) + '"><span class="env-fq-card-k">' + esc(unitLabel(p.unit)) + ' &middot; ' + esc(DATA.skills[p.skill] || p.skill) + (p.free ? ' &middot; free' : '') + '</span>' +
          '<b>' + esc(p.title) + '</b><span class="env-small">' + esc(TOPIC[p.topic] ? TOPIC[p.topic].title : '') + (s ? ' &middot; your best: ' + s.best + ' of ' + s.of : '') + (locked(p) ? ' &middot; Premium' : '') + '</span></a></li>';
      }).join('');
      try{ var q = new URLSearchParams(); q.set('list', '1'); if(filter.unit) q.set('unit', filter.unit); if(filter.skill) q.set('skill', filter.skill); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '')); }catch(e){}
    }
    form = app.querySelector('form'); countEl = app.querySelector('#env-js-count'); listEl = app.querySelector('.env-js-list');
    form.addEventListener('change', function(e){ if(e.target.id === 'env-js-unit') filter.unit = e.target.value; else filter.skill = e.target.value; paint(); });
    form.addEventListener('submit', function(e){ e.preventDefault(); });
    paint();
    openWide();
    var S = studio();
    if(S){
      var how = app.querySelector('.env-js-how'), intro = app.querySelector(':scope > p.env-small');
      S.add('stage', lsBox('env-ls-jlist', [countEl, listEl]));
      S.add('dock', form);
      if(how){ how.open = true; S.add('why', how); }
      if(intro) S.add('details', intro);
      S.caption('Pick a prompt, write your answer, then check it against the rubric.');
    }
  }

  /* --------------------------------------------------------- one prompt */
  function one(p, auto){
    view('one');
    var i = DATA.prompts.indexOf(p), next = DATA.prompts[i + 1];
    var sc = scores(), left = DATA.prompts.filter(function(x){ return !sc[x.id]; }).length;
    var head = '<p class="env-small env-js-nav"><a href="' + LIST + '">&larr; All ' + DATA.prompts.length + ' prompts</a>' + (auto ? ' <span>&middot; ' + (left ? 'Your next unchecked prompt (' + left + ' to go)' : 'You have checked every prompt; here is the first again') + '</span>' : '') + '</p>' +
      '<div class="cx-card env-js-card"><p class="env-fq-k">' + esc(unitLabel(p.unit)) + ' &middot; ' + esc(TOPIC[p.topic] ? TOPIC[p.topic].title : '') + ' &middot; Practice ' + esc(p.practice) + '</p>' +
      '<h2 class="env-js-title" tabindex="-1">' + esc(p.title) + '</h2>' +
      (p.context ? '<section class="env-stim" aria-label="The situation"><p class="env-stim-k">The situation</p>' + p.context + '</section>' : '') +
      '<p class="env-fq-prompt env-js-prompt" id="env-js-prompt">' + p.prompt + '</p>';
    if(locked(p)){
      app.innerHTML = head + '</div>' + (Core.gate ? Core.gate('tools', 'justify', p.topic) : '');
      app.querySelector('.env-js-title').focus();
      return;
    }
    app.innerHTML = head +
      '<label class="env-fq-alabel" for="env-js-a">Your answer</label>' +
      '<textarea id="env-js-a" class="env-fq-answer" rows="6" aria-describedby="env-js-prompt" spellcheck="true">' + esc(draft(p.id)) + '</textarea>' +
      '<p class="env-small">Saved on this device as you type. It is never sent anywhere.</p>' +
      '<div class="env-pr-actions"><button type="button" class="btn-press" data-act="check">Check my answer</button></div></div>' +
      '<section class="env-js-check" hidden aria-labelledby="env-js-ch"></section>' + HOW;
    openWide();
    var ta = app.querySelector('#env-js-a'), timer = 0, boxEl = app.querySelector('.env-js-check'), after = null, checkBtn = app.querySelector('[data-act="check"]');
    var S = studio();
    if(S){
      // The prompt and the answer box on the stage, Check in the dock.
      var card = app.querySelector('.env-js-card'), acts = card.querySelector('.env-pr-actions'), nav = app.querySelector('.env-js-nav'), kick = card.querySelector('.env-fq-k'), how = app.querySelector('.env-js-how');
      card.classList.add('env-ls-jcard');
      after = lsBox('env-ls-jafter');
      if(nav) nav.classList.add('env-ls-jnav');
      S.add('stage', card);
      S.add('dock', [acts, after, nav]);
      acts.querySelector('[data-act="check"]').classList.add('ls-btn', 'ls-pri');
      if(how){ how.open = true; }
      S.add('why', [boxEl, how]);
      if(kick) S.add('details', lsBox('ls-sec', [kick]));
      S.pills([{ html: esc(unitLabel(p.unit)) + ' · ' + esc(DATA.skills[p.skill] || p.skill), tone: 'ghost' }], 'left');
      S.caption(auto ? (left ? '<b>Your next prompt.</b> Write your answer, then check it.' : 'Write your answer, then check it against the rubric.') : 'Write your answer, then check it against the rubric.');
      S.hint({ target: ta, text: 'Write your answer here', round: 14, inside: true });
    }
    ta.addEventListener('input', function(){ clearTimeout(timer); timer = setTimeout(function(){ saveDraft(p.id, ta.value); }, 300); });
    checkBtn.addEventListener('click', function(){
      var btn = this, box = boxEl;
      if(!ta.value.trim()){
        ta.setAttribute('aria-invalid', 'true');
        if(!ta.parentNode.querySelector('.env-js-empty')) ta.insertAdjacentHTML('afterend', '<p class="env-small env-js-empty" role="alert">Write your answer first: the checklist works only against something you wrote.</p>');
        ta.focus(); return;
      }
      ta.removeAttribute('aria-invalid');
      var e = ta.parentNode.querySelector('.env-js-empty'); if(e) e.remove();
      saveDraft(p.id, ta.value);
      btn.hidden = true;
      box.hidden = false;
      box.innerHTML = '<h2 id="env-js-ch" tabindex="-1">Check your answer, point by point</h2>' +
        '<div class="env-js-yours"><p class="env-fq-sample-k">Your answer</p><p>' + esc(ta.value).replace(/\n/g, '<br>') + '</p></div>' +
        '<fieldset class="env-fq-rpart"><legend>Tick each point your answer makes, in your own words</legend>' +
        p.checklist.map(function(c, k){ return '<label class="env-fq-point" for="env-js-c' + k + '"><input type="checkbox" id="env-js-c' + k + '" data-k="' + k + '"><span>' + c + '</span></label>'; }).join('') +
        '</fieldset><p class="env-fq-total" role="status" aria-live="polite"></p>' +
        (p.specific ? builderHtml(p) : '') +
        '<div class="env-js-models">' +
          '<div class="env-js-model is-earns"><p class="env-fq-sample-k">An answer that earns the point</p><p>' + p.earns.answer + '</p><p class="env-js-why"><b>Why it earns it:</b> ' + p.earns.why + '</p></div>' +
          '<div class="env-js-model is-misses"><p class="env-fq-sample-k">An answer that does not</p><p>' + p.misses.answer + '</p><p class="env-js-why"><b>Why it misses:</b> ' + p.misses.why + '</p></div>' +
        '</div>' +
        '<div class="env-pr-actions"><button type="button" class="btn-press" data-act="save">Save my check</button>' +
          '<button type="button" class="btn-outline" data-act="again">Rewrite my answer</button>' +
          (next ? '<a class="btn-outline" href="?p=' + encodeURIComponent(next.id) + '">Next prompt</a>' : '<a class="btn-outline" href="' + LIST + '">All prompts</a>') + '</div>' +
        '<p class="env-small">More practice on this topic: <a href="' + BASE + 'notes/' + p.topic + '.html">the notes</a> &middot; <a href="' + BASE + 'frq.html?unit=' + p.unit + '">free-response questions for ' + esc(unitLabel(p.unit)) + '</a>.</p>';
      wireBuilder(box, p);
      function total(){ var n = box.querySelectorAll('.env-fq-point input:checked').length; box.querySelector('.env-fq-total').textContent = 'Your answer makes ' + n + ' of ' + p.checklist.length + ' points.'; return n; }
      box.addEventListener('change', total); total();
      box.querySelector('[data-act="save"]').addEventListener('click', function(){
        var got = total();
        saveScore(p.id, got, p.checklist.length);
        if(Core) Core.event('apenv-justify-check', { prompt: p.id, got: got, of: p.checklist.length });
        this.textContent = 'Saved'; this.disabled = true;
      });
      box.querySelector('[data-act="again"]').addEventListener('click', function(){
        box.hidden = true; btn.hidden = false;
        if(S){ S.close(); after.innerHTML = ''; S.pills([{ html: esc(unitLabel(p.unit)) + ' · ' + esc(DATA.skills[p.skill] || p.skill), tone: 'ghost' }], 'left'); S.caption('Rewrite your answer, then check it again.'); }
        ta.focus();
      });
      if(S){
        /* The verdict on the stage (a pill), the rubric to tick under Why;
           Save my check stays with the ticks, Rewrite and Next go to the dock. */
        var a2 = box.querySelector('.env-pr-actions'), save = a2.querySelector('[data-act="save"]');
        box.querySelector('.env-fq-total').insertAdjacentElement('afterend', lsBox('env-pr-actions', [save]));
        after.innerHTML = ''; after.appendChild(a2);
        [].slice.call(a2.querySelectorAll('.btn-outline')).forEach(function(b){ b.classList.add('ls-btn'); });
        save.classList.add('ls-btn', 'ls-pri');
        var pts = function(){ var n = box.querySelectorAll('.env-fq-point input:checked').length; S.pills([{ html: n + ' of ' + p.checklist.length + ' points', tone: n === p.checklist.length ? 'good' : n ? 'warn' : 'ghost' }], 'left'); };
        box.addEventListener('change', pts); pts();
        S.caption('<b>Check your answer under Why.</b> Tick each point it makes, then save.');
        S.open('why', box.querySelector('#env-js-ch'));
      } else box.querySelector('#env-js-ch').focus();
    });
    var t = document.querySelector('.env-js-title'); if(t && location.search.indexOf('p=') > -1) t.focus();
  }

  function route(){
    var q = new URLSearchParams(location.search), id = q.get('p');
    var p = id && DATA.prompts.filter(function(x){ return x.id === id; })[0];
    if(UNIT[q.get('unit')]) filter.unit = q.get('unit');
    if(DATA.skills[q.get('skill')]) filter.skill = q.get('skill');
    if(p) return one(p);
    if(q.get('list') || filter.unit || filter.skill) return list();
    // Straight to work: the first prompt (course order) not yet self-checked
    // and open to this student, else the first prompt.
    var sc = scores(), open = DATA.prompts.filter(function(x){ return !locked(x); });
    one(open.filter(function(x){ return !sc[x.id]; })[0] || open[0] || DATA.prompts[0], true);
  }

  app.innerHTML = '<p class="env-small">Loading the prompts…</p>';
  fetch(BASE + 'assets/justify.json').then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){
    DATA = d;
    if(!d.prompts || !d.prompts.length){ app.innerHTML = '<p>No prompts are published yet. Meanwhile, read the <a href="' + BASE + 'learn.html">free notes</a>.</p>'; return; }
    route();
  }).catch(function(e){ try{ console.error(e); }catch(x){} if(LS){ LS.suspend(true); app.hidden = false; } app.innerHTML = '<p>The prompts did not load. Check your connection and reload.</p>'; });
})();
