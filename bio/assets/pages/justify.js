/* AP® Biology justification trainer (justify.html; docs/apbio-spec.md
   decision 29; data format in docs/apbio-architecture.md, "Justification
   trainer"). Forked from calculus/assets/pages/justify.js; the runtime is
   the same in every course, only the names differ.

   Each prompt is an "explain", "justify" or "predict" task built on a point
   students most often lose on written answers. The student writes an answer, then checks
   it against the rubric checklist, point by point, and reads two model
   answers: one that earns the point and one that does not, each with why.
   No AI grading: the student ticks what their own answer says, as on the
   free-response pages.

     list     ?list=1 (or ?unit= / ?skill=): every published prompt, filtered
              by unit and by skill, each with its last self-check
     start    no parameters: opens straight on the next prompt not yet
              self-checked (in course order), with "All prompts" one tap away
     one      ?p=<id>: context, prompt, a textarea (saved on this device in
              apbio_frq_drafts_v1 under "justify:<id>", as FRQ drafts are),
              then the checklist and the two model answers

   Premium: the first prompts in course order (free: true in
   assets/justify.json) are open to everyone; the rest show the Premium card
   when ApBioCore.locked() (nothing is locked before launch). Self-checks go
   to apbio_prefs_v1.justify { id: { got, of, best, ts } }. */
(function(){
  var BASE = window.ApBioBase || '';
  var app = document.getElementById('app');
  if(!app) return;
  var Core = window.ApBioCore;
  var CUR = window.ApBioCurriculum || { units: [], topics: [] };
  var UNIT = {}; CUR.units.forEach(function(u){ UNIT[u.id] = u; });
  var TOPIC = {}; CUR.topics.forEach(function(t){ TOPIC[t.id] = t; });
  var DRAFTS = 'apbio_frq_drafts_v1', PREFS = 'apbio_prefs_v1';
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
  var HOW = '<details class="cx-card bio-js-how"><summary>How it works</summary><ol class="bio-js-steps">' +
    '<li><b>Write</b> your answer in full sentences: a claim, the evidence, and the reasoning that names the principle and its condition.</li>' +
    '<li><b>Check</b> it against the rubric, ticking only the points your answer actually makes.</li>' +
    '<li><b>Compare</b> two model answers: one that earns the point, and one that sounds right but does not.</li></ol></details>';
  function openWide(){ try{ var d = app.querySelector('.bio-js-how'); if(d && matchMedia('(min-width: 900px)').matches) d.open = true; }catch(e){} }

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
    var main = app.parentNode, h1 = main.querySelector('.bio-hero h1'), lede = main.querySelector('.bio-hero .lede');
    main.classList.add('ls-host');
    // Back goes to the course home here, not to a tools page.
    LS = window.LevlStudio.mount({ title: h1 ? h1.textContent : 'Justification trainer', course: 'AP® Biology', back: BASE + 'index.html', backLabel: 'Back to AP® Biology',
      slug: 'apbio-justify', host: app, detailsTitle: 'Topic',
      menu: { copyLink: true, report: { course: 'apbio', id: 'page:justify' }, allTools: { label: 'Course home' },
        note: { label: 'Note.', html: 'This course has not yet been reviewed by an AP® Biology teacher. <a href="' + BASE + '../sources.html">Sources</a>' } } });
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
    app.innerHTML = '<p class="bio-small">' + plural(ps.length, 'prompt') + ' across the units, each on a point students often lose on written answers. ' + (done ? 'You have checked ' + done + ' of them.' : '') + '</p>' +
      '<form class="bio-fq-filters" aria-label="Filter prompts">' +
        '<label class="bio-pr-field"><span>Unit</span><select id="bio-js-unit">' + opt('', 'Every unit', filter.unit) + units.map(function(u){ return opt(u, unitLabel(u) + (UNIT[u] ? ': ' + UNIT[u].title : ''), filter.unit); }).join('') + '</select></label>' +
        '<label class="bio-pr-field"><span>Skill</span><select id="bio-js-skill">' + opt('', 'Every skill', filter.skill) + skills.map(function(k){ return opt(k, DATA.skills[k] || k, filter.skill); }).join('') + '</select></label>' +
      '</form><p class="bio-small" id="bio-js-count" role="status" aria-live="polite"></p><ul class="bio-fq-list bio-js-list"></ul>' + HOW;
    var form, countEl, listEl;
    function paint(){
      var shown = ps.filter(function(p){ return (!filter.unit || p.unit === filter.unit) && (!filter.skill || p.skill === filter.skill); });
      countEl.textContent = plural(shown.length, 'prompt') + (filter.unit || filter.skill ? ' match.' : '.');
      listEl.innerHTML = shown.map(function(p){
        var s = sc[p.id];
        return '<li><a class="bio-fq-card" href="?p=' + encodeURIComponent(p.id) + '"><span class="bio-fq-card-k">' + esc(unitLabel(p.unit)) + ' &middot; ' + esc(DATA.skills[p.skill] || p.skill) + (p.free ? ' &middot; free' : '') + '</span>' +
          '<b>' + esc(p.title) + '</b><span class="bio-small">' + esc(TOPIC[p.topic] ? TOPIC[p.topic].title : '') + (s ? ' &middot; your best: ' + s.best + ' of ' + s.of : '') + (locked(p) ? ' &middot; Premium' : '') + '</span></a></li>';
      }).join('');
      try{ var q = new URLSearchParams(); q.set('list', '1'); if(filter.unit) q.set('unit', filter.unit); if(filter.skill) q.set('skill', filter.skill); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '')); }catch(e){}
    }
    form = app.querySelector('form'); countEl = app.querySelector('#bio-js-count'); listEl = app.querySelector('.bio-js-list');
    form.addEventListener('change', function(e){ if(e.target.id === 'bio-js-unit') filter.unit = e.target.value; else filter.skill = e.target.value; paint(); });
    form.addEventListener('submit', function(e){ e.preventDefault(); });
    paint();
    openWide();
    var S = studio();
    if(S){
      var how = app.querySelector('.bio-js-how'), intro = app.querySelector(':scope > p.bio-small');
      S.add('stage', lsBox('bio-ls-jlist', [countEl, listEl]));
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
    var head = '<p class="bio-small bio-js-nav"><a href="' + LIST + '">&larr; All ' + DATA.prompts.length + ' prompts</a>' + (auto ? ' <span>&middot; ' + (left ? 'Your next unchecked prompt (' + left + ' to go)' : 'You have checked every prompt; here is the first again') + '</span>' : '') + '</p>' +
      '<div class="cx-card bio-js-card"><p class="bio-fq-k">' + esc(unitLabel(p.unit)) + ' &middot; ' + esc(TOPIC[p.topic] ? TOPIC[p.topic].title : '') + ' &middot; Practice ' + esc(p.practice) + '</p>' +
      '<h2 class="bio-js-title" tabindex="-1">' + esc(p.title) + '</h2>' +
      (p.context ? '<section class="bio-stim" aria-label="The situation"><p class="bio-stim-k">The situation</p>' + p.context + '</section>' : '') +
      '<p class="bio-fq-prompt bio-js-prompt" id="bio-js-prompt">' + p.prompt + '</p>';
    if(locked(p)){
      app.innerHTML = head + '</div>' + (Core.gate ? Core.gate('tools', 'justify', p.topic) : '');
      app.querySelector('.bio-js-title').focus();
      return;
    }
    app.innerHTML = head +
      '<label class="bio-fq-alabel" for="bio-js-a">Your answer</label>' +
      '<textarea id="bio-js-a" class="bio-fq-answer" rows="6" aria-describedby="bio-js-prompt" spellcheck="true">' + esc(draft(p.id)) + '</textarea>' +
      '<p class="bio-small">Saved on this device as you type. It is never sent anywhere.</p>' +
      '<div class="bio-pr-actions"><button type="button" class="btn-press" data-act="check">Check my answer</button></div></div>' +
      '<section class="bio-js-check" hidden aria-labelledby="bio-js-ch"></section>' + HOW;
    openWide();
    var ta = app.querySelector('#bio-js-a'), timer = 0, boxEl = app.querySelector('.bio-js-check'), after = null, checkBtn = app.querySelector('[data-act="check"]');
    var S = studio();
    if(S){
      // The prompt and the answer box on the stage, Check in the dock.
      var card = app.querySelector('.bio-js-card'), acts = card.querySelector('.bio-pr-actions'), nav = app.querySelector('.bio-js-nav'), kick = card.querySelector('.bio-fq-k'), how = app.querySelector('.bio-js-how');
      card.classList.add('bio-ls-jcard');
      after = lsBox('bio-ls-jafter');
      if(nav) nav.classList.add('bio-ls-jnav');
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
        if(!ta.parentNode.querySelector('.bio-js-empty')) ta.insertAdjacentHTML('afterend', '<p class="bio-small bio-js-empty" role="alert">Write your answer first: the checklist works only against something you wrote.</p>');
        ta.focus(); return;
      }
      ta.removeAttribute('aria-invalid');
      var e = ta.parentNode.querySelector('.bio-js-empty'); if(e) e.remove();
      saveDraft(p.id, ta.value);
      btn.hidden = true;
      box.hidden = false;
      box.innerHTML = '<h2 id="bio-js-ch" tabindex="-1">Check your answer, point by point</h2>' +
        '<div class="bio-js-yours"><p class="bio-fq-sample-k">Your answer</p><p>' + esc(ta.value).replace(/\n/g, '<br>') + '</p></div>' +
        '<fieldset class="bio-fq-rpart"><legend>Tick each point your answer makes, in your own words</legend>' +
        p.checklist.map(function(c, k){ return '<label class="bio-fq-point" for="bio-js-c' + k + '"><input type="checkbox" id="bio-js-c' + k + '" data-k="' + k + '"><span>' + c + '</span></label>'; }).join('') +
        '</fieldset><p class="bio-fq-total" role="status" aria-live="polite"></p>' +
        '<div class="bio-js-models">' +
          '<div class="bio-js-model is-earns"><p class="bio-fq-sample-k">An answer that earns the point</p><p>' + p.earns.answer + '</p><p class="bio-js-why"><b>Why it earns it:</b> ' + p.earns.why + '</p></div>' +
          '<div class="bio-js-model is-misses"><p class="bio-fq-sample-k">An answer that does not</p><p>' + p.misses.answer + '</p><p class="bio-js-why"><b>Why it misses:</b> ' + p.misses.why + '</p></div>' +
        '</div>' +
        '<div class="bio-pr-actions"><button type="button" class="btn-press" data-act="save">Save my check</button>' +
          '<button type="button" class="btn-outline" data-act="again">Rewrite my answer</button>' +
          (next ? '<a class="btn-outline" href="?p=' + encodeURIComponent(next.id) + '">Next prompt</a>' : '<a class="btn-outline" href="' + LIST + '">All prompts</a>') + '</div>' +
        '<p class="bio-small">More practice on this topic: <a href="' + BASE + 'notes/' + p.topic + '.html">the notes</a> &middot; <a href="' + BASE + 'frq.html?unit=' + p.unit + '">free-response questions for ' + esc(unitLabel(p.unit)) + '</a>.</p>';
      function total(){ var n = box.querySelectorAll('.bio-fq-point input:checked').length; box.querySelector('.bio-fq-total').textContent = 'Your answer makes ' + n + ' of ' + p.checklist.length + ' points.'; return n; }
      box.addEventListener('change', total); total();
      box.querySelector('[data-act="save"]').addEventListener('click', function(){
        var got = total();
        saveScore(p.id, got, p.checklist.length);
        if(Core) Core.event('apbio-justify-check', { prompt: p.id, got: got, of: p.checklist.length });
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
        var a2 = box.querySelector('.bio-pr-actions'), save = a2.querySelector('[data-act="save"]');
        box.querySelector('.bio-fq-total').insertAdjacentElement('afterend', lsBox('bio-pr-actions', [save]));
        after.innerHTML = ''; after.appendChild(a2);
        [].slice.call(a2.querySelectorAll('.btn-outline')).forEach(function(b){ b.classList.add('ls-btn'); });
        save.classList.add('ls-btn', 'ls-pri');
        var pts = function(){ var n = box.querySelectorAll('.bio-fq-point input:checked').length; S.pills([{ html: n + ' of ' + p.checklist.length + ' points', tone: n === p.checklist.length ? 'good' : n ? 'warn' : 'ghost' }], 'left'); };
        box.addEventListener('change', pts); pts();
        S.caption('<b>Check your answer under Why.</b> Tick each point it makes, then save.');
        S.open('why', box.querySelector('#bio-js-ch'));
      } else box.querySelector('#bio-js-ch').focus();
    });
    var t = document.querySelector('.bio-js-title'); if(t && location.search.indexOf('p=') > -1) t.focus();
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

  app.innerHTML = '<p class="bio-small">Loading the prompts…</p>';
  fetch(BASE + 'assets/justify.json').then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){
    DATA = d;
    if(!d.prompts || !d.prompts.length){ app.innerHTML = '<p>No prompts are published yet. Meanwhile, read the <a href="' + BASE + 'learn.html">free notes</a>.</p>'; return; }
    route();
  }).catch(function(e){ try{ console.error(e); }catch(x){} if(LS){ LS.suspend(true); app.hidden = false; } app.innerHTML = '<p>The prompts did not load. Check your connection and reload.</p>'; });
})();
