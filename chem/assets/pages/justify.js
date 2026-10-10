/* AP® Chemistry justification trainer (justify.html; docs/apchem-spec.md
   section 3, differentiator 1; data format in docs/apchem-architecture.md,
   "Justification trainer").

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
              apchem_frq_drafts_v1 under "justify:<id>", as FRQ drafts are),
              then the checklist and the two model answers

   Premium: the first prompts in course order (free: true in
   assets/justify.json) are open to everyone; the rest show the Premium card
   when ApChemCore.locked() (nothing is locked before launch). Self-checks go
   to apchem_prefs_v1.justify { id: { got, of, best, ts } }. */
(function(){
  var BASE = window.ApChemBase || '';
  var app = document.getElementById('app');
  if(!app) return;
  var Core = window.ApChemCore;
  var CUR = window.ApChemCurriculum || { units: [], topics: [] };
  var UNIT = {}; CUR.units.forEach(function(u){ UNIT[u.id] = u; });
  var TOPIC = {}; CUR.topics.forEach(function(t){ TOPIC[t.id] = t; });
  var DRAFTS = 'apchem_frq_drafts_v1', PREFS = 'apchem_prefs_v1';
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
  function locked(p){ return !p.free && Core && Core.locked && Core.locked(); }
  function unitLabel(u){ var c = UNIT[u]; return c ? (c.part === 'course' ? 'Unit ' + c.n : c.title) : u; }
  function view(name){ app.setAttribute('data-view', name); }
  var LIST = BASE + 'justify.html?list=1';
  // How it works: below the work, folded (open on wide screens).
  var HOW = '<details class="cx-card chem-js-how"><summary>How it works</summary><ol class="chem-js-steps">' +
    '<li><b>Write</b> your answer in full sentences: a claim, the evidence, and the reason at the particle level.</li>' +
    '<li><b>Check</b> it against the rubric, ticking only the points your answer actually makes.</li>' +
    '<li><b>Compare</b> two model answers: one that earns the point, and one that sounds right but does not.</li></ol></details>';
  function openWide(){ try{ var d = app.querySelector('.chem-js-how'); if(d && matchMedia('(min-width: 900px)').matches) d.open = true; }catch(e){} }

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
    var main = app.parentNode, h1 = main.querySelector('.chem-hero h1'), lede = main.querySelector('.chem-hero .lede');
    main.classList.add('ls-host');
    LS = window.LevlStudio.mount({ title: h1 ? h1.textContent : 'Justification trainer', course: 'AP® Chemistry', back: BASE + 'index.html', slug: 'apchem-justify', host: app,
      menu: { copyLink: true, report: { course: 'apchem', id: 'page:justify' },
        note: { label: 'Beta.', html: 'This course has not yet been reviewed by an AP® Chemistry teacher. <a href="' + BASE + '../sources.html">Sources</a>' } } });
    // Back goes to the course home here, not to a tools page.
    var back = LS.root.querySelector('.ls-back'); if(back) back.setAttribute('aria-label', 'Back to AP® Chemistry');
    LS.root.querySelectorAll('.ls-menu a.ls-mi').forEach(function(a){ if(a.getAttribute('href') === BASE + 'index.html') a.querySelector('span').textContent = 'Course home'; });
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
    app.innerHTML = '<p class="chem-small">' + plural(ps.length, 'prompt') + ' across the units, each on a point the exam readers say students miss. ' + (done ? 'You have checked ' + done + ' of them.' : '') + '</p>' +
      '<form class="chem-fq-filters" aria-label="Filter prompts">' +
        '<label class="chem-pr-field"><span>Unit</span><select id="chem-js-unit">' + opt('', 'Every unit', filter.unit) + units.map(function(u){ return opt(u, unitLabel(u) + (UNIT[u] ? ': ' + UNIT[u].title : ''), filter.unit); }).join('') + '</select></label>' +
        '<label class="chem-pr-field"><span>Skill</span><select id="chem-js-skill">' + opt('', 'Every skill', filter.skill) + skills.map(function(k){ return opt(k, DATA.skills[k] || k, filter.skill); }).join('') + '</select></label>' +
      '</form><p class="chem-small" id="chem-js-count" role="status" aria-live="polite"></p><ul class="chem-fq-list chem-js-list"></ul>' + HOW;
    var form, countEl, listEl;
    function paint(){
      var shown = ps.filter(function(p){ return (!filter.unit || p.unit === filter.unit) && (!filter.skill || p.skill === filter.skill); });
      countEl.textContent = plural(shown.length, 'prompt') + (filter.unit || filter.skill ? ' match.' : '.');
      listEl.innerHTML = shown.map(function(p){
        var s = sc[p.id];
        return '<li><a class="chem-fq-card" href="?p=' + encodeURIComponent(p.id) + '"><span class="chem-fq-card-k">' + esc(unitLabel(p.unit)) + ' &middot; ' + esc(DATA.skills[p.skill] || p.skill) + (p.free ? ' &middot; free' : '') + '</span>' +
          '<b>' + esc(p.title) + '</b><span class="chem-small">' + esc(TOPIC[p.topic] ? TOPIC[p.topic].title : '') + (s ? ' &middot; your best: ' + s.best + ' of ' + s.of : '') + (locked(p) ? ' &middot; Premium' : '') + '</span></a></li>';
      }).join('');
      try{ var q = new URLSearchParams(); q.set('list', '1'); if(filter.unit) q.set('unit', filter.unit); if(filter.skill) q.set('skill', filter.skill); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '')); }catch(e){}
    }
    form = app.querySelector('form'); countEl = app.querySelector('#chem-js-count'); listEl = app.querySelector('.chem-js-list');
    form.addEventListener('change', function(e){ if(e.target.id === 'chem-js-unit') filter.unit = e.target.value; else filter.skill = e.target.value; paint(); });
    form.addEventListener('submit', function(e){ e.preventDefault(); });
    paint();
    openWide();
    var S = studio();
    if(S){
      var how = app.querySelector('.chem-js-how'), intro = app.querySelector(':scope > p.chem-small');
      S.add('stage', lsBox('chem-ls-jlist', [countEl, listEl]));
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
    var head = '<p class="chem-small chem-js-nav"><a href="' + LIST + '">&larr; All ' + DATA.prompts.length + ' prompts</a>' + (auto ? ' <span>&middot; ' + (left ? 'Your next unchecked prompt (' + left + ' to go)' : 'You have checked every prompt; here is the first again') + '</span>' : '') + '</p>' +
      '<div class="cx-card chem-js-card"><p class="chem-fq-k">' + esc(unitLabel(p.unit)) + ' &middot; ' + esc(TOPIC[p.topic] ? TOPIC[p.topic].title : '') + ' &middot; Practice ' + esc(p.practice) + '</p>' +
      '<h2 class="chem-js-title" tabindex="-1">' + esc(p.title) + '</h2>' +
      (p.context ? '<section class="chem-stim" aria-label="The situation"><p class="chem-stim-k">The situation</p>' + p.context + '</section>' : '') +
      '<p class="chem-fq-prompt chem-js-prompt" id="chem-js-prompt">' + p.prompt + '</p>';
    if(locked(p)){
      app.innerHTML = head + '</div>' + (Core.gate ? Core.gate('tools', 'justify', p.topic) : '');
      app.querySelector('.chem-js-title').focus();
      return;
    }
    app.innerHTML = head +
      '<label class="chem-fq-alabel" for="chem-js-a">Your answer</label>' +
      '<textarea id="chem-js-a" class="chem-fq-answer" rows="6" aria-describedby="chem-js-prompt" spellcheck="true">' + esc(draft(p.id)) + '</textarea>' +
      '<p class="chem-small">Saved on this device as you type. It is never sent anywhere.</p>' +
      '<div class="chem-pr-actions"><button type="button" class="btn-press" data-act="check">Check my answer</button></div></div>' +
      '<section class="chem-js-check" hidden aria-labelledby="chem-js-ch"></section>' + HOW;
    openWide();
    var ta = app.querySelector('#chem-js-a'), timer = 0, boxEl = app.querySelector('.chem-js-check'), after = null, checkBtn = app.querySelector('[data-act="check"]');
    var S = studio();
    if(S){
      // The prompt and the answer box on the stage, Check in the dock.
      var card = app.querySelector('.chem-js-card'), acts = card.querySelector('.chem-pr-actions'), nav = app.querySelector('.chem-js-nav'), kick = card.querySelector('.chem-fq-k'), how = app.querySelector('.chem-js-how');
      card.classList.add('chem-ls-jcard');
      after = lsBox('chem-ls-jafter');
      if(nav) nav.classList.add('chem-ls-jnav');
      S.add('stage', card);
      S.add('dock', [acts, after, nav]);
      acts.querySelector('[data-act="check"]').classList.add('ls-btn', 'ls-pri');
      if(how){ how.open = true; }
      S.add('why', [boxEl, how]);
      if(kick) S.add('details', lsBox('ls-sec', [kick]));
      S.pills([{ html: esc(unitLabel(p.unit)) + ' · ' + esc(DATA.skills[p.skill] || p.skill), tone: 'ghost' }], 'left');
      S.caption(auto ? (left ? '<b>Your next prompt.</b> Write your answer, then check it.' : 'Write your answer, then check it against the rubric.') : 'Write your answer, then check it against the rubric.');
      S.hint({ target: ta, text: 'Write your answer here', round: 14 });
    }
    ta.addEventListener('input', function(){ clearTimeout(timer); timer = setTimeout(function(){ saveDraft(p.id, ta.value); }, 300); });
    checkBtn.addEventListener('click', function(){
      var btn = this, box = boxEl;
      if(!ta.value.trim()){
        ta.setAttribute('aria-invalid', 'true');
        if(!ta.parentNode.querySelector('.chem-js-empty')) ta.insertAdjacentHTML('afterend', '<p class="chem-small chem-js-empty" role="alert">Write your answer first: the checklist works only against something you wrote.</p>');
        ta.focus(); return;
      }
      ta.removeAttribute('aria-invalid');
      var e = ta.parentNode.querySelector('.chem-js-empty'); if(e) e.remove();
      saveDraft(p.id, ta.value);
      btn.hidden = true;
      box.hidden = false;
      box.innerHTML = '<h2 id="chem-js-ch" tabindex="-1">Check your answer, point by point</h2>' +
        '<div class="chem-js-yours"><p class="chem-fq-sample-k">Your answer</p><p>' + esc(ta.value).replace(/\n/g, '<br>') + '</p></div>' +
        '<fieldset class="chem-fq-rpart"><legend>Tick each point your answer makes, in your own words</legend>' +
        p.checklist.map(function(c, k){ return '<label class="chem-fq-point" for="chem-js-c' + k + '"><input type="checkbox" id="chem-js-c' + k + '" data-k="' + k + '"><span>' + c + '</span></label>'; }).join('') +
        '</fieldset><p class="chem-fq-total" role="status" aria-live="polite"></p>' +
        '<div class="chem-js-models">' +
          '<div class="chem-js-model is-earns"><p class="chem-fq-sample-k">An answer that earns the point</p><p>' + p.earns.answer + '</p><p class="chem-js-why"><b>Why it earns it:</b> ' + p.earns.why + '</p></div>' +
          '<div class="chem-js-model is-misses"><p class="chem-fq-sample-k">An answer that does not</p><p>' + p.misses.answer + '</p><p class="chem-js-why"><b>Why it misses:</b> ' + p.misses.why + '</p></div>' +
        '</div>' +
        '<div class="chem-pr-actions"><button type="button" class="btn-press" data-act="save">Save my check</button>' +
          '<button type="button" class="btn-outline" data-act="again">Rewrite my answer</button>' +
          (next ? '<a class="btn-outline" href="?p=' + encodeURIComponent(next.id) + '">Next prompt</a>' : '<a class="btn-outline" href="' + LIST + '">All prompts</a>') + '</div>' +
        '<p class="chem-small">More practice on this topic: <a href="' + BASE + 'notes/' + p.topic + '.html">the notes</a> &middot; <a href="' + BASE + 'frq.html?unit=' + p.unit + '">free-response questions for ' + esc(unitLabel(p.unit)) + '</a>.</p>';
      function total(){ var n = box.querySelectorAll('.chem-fq-point input:checked').length; box.querySelector('.chem-fq-total').textContent = 'Your answer makes ' + n + ' of ' + p.checklist.length + ' points.'; return n; }
      box.addEventListener('change', total); total();
      box.querySelector('[data-act="save"]').addEventListener('click', function(){
        var got = total();
        saveScore(p.id, got, p.checklist.length);
        if(Core) Core.event('apchem-justify-check', { prompt: p.id, got: got, of: p.checklist.length });
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
        var a2 = box.querySelector('.chem-pr-actions'), save = a2.querySelector('[data-act="save"]');
        box.querySelector('.chem-fq-total').insertAdjacentElement('afterend', lsBox('chem-pr-actions', [save]));
        after.innerHTML = ''; after.appendChild(a2);
        [].slice.call(a2.querySelectorAll('.btn-outline')).forEach(function(b){ b.classList.add('ls-btn'); });
        save.classList.add('ls-btn', 'ls-pri');
        var pts = function(){ var n = box.querySelectorAll('.chem-fq-point input:checked').length; S.pills([{ html: n + ' of ' + p.checklist.length + ' points', tone: n === p.checklist.length ? 'good' : n ? 'warn' : 'ghost' }], 'left'); };
        box.addEventListener('change', pts); pts();
        S.caption('<b>Check your answer under Why.</b> Tick each point it makes, then save.');
        S.open('why', box.querySelector('#chem-js-ch'));
      } else box.querySelector('#chem-js-ch').focus();
    });
    var t = document.querySelector('.chem-js-title'); if(t && location.search.indexOf('p=') > -1) t.focus();
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

  app.innerHTML = '<p class="chem-small">Loading the prompts…</p>';
  fetch(BASE + 'assets/justify.json').then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){
    DATA = d;
    if(!d.prompts || !d.prompts.length){ app.innerHTML = '<p>No prompts are published yet. Meanwhile, read the <a href="' + BASE + 'learn.html">free notes</a>.</p>'; return; }
    route();
  }).catch(function(e){ try{ console.error(e); }catch(x){} if(LS){ LS.suspend(true); app.hidden = false; } app.innerHTML = '<p>The prompts did not load. Check your connection and reload.</p>'; });
})();
