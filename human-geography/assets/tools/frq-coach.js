/* FRQ coach page (docs/aphug-spec.md sections 3.2 and 6). OWNED BY THIS TOOL ONLY
   (builder T2). Mounts into #app with ApHugTools; the model is ApHugMath.frqCoach
   (human-geography/assets/tools/math/frq-coach.js), the content
   human-geography/data/tools/frq-coach.json (served filtered as
   assets/tool-data/frq-coach.json). The frame is ApHugTools.modes (Explore,
   then Test yourself) on the Tool Studio.

   Explore: the stage is the question as the exam sets it out (scenario,
   lettered parts, the task verb of each in bold; the part being answered is
   marked). The dock answers one part at a time, in the order the brief sets:
     1. the verb and its demand (the exam's VERBS words);
     2. write: a box with link-word buttons for the verb (because, so;
        whereas, both; "To a moderate degree,") and a live checklist from
        ApHugGrade.flags (mechanism, both, degree, scale): hints, never a score;
     3. the rubric line and a full-credit sample, revealed on request;
     4. "Which answer earns the point?": the sample against an answer that
        misses the verb's demand, Select then Check, with the slip named.
   Drafts are kept on this device (aphug_frqcoach_v1).
   Test yourself: ApHugTools.drill over the model's generate(). */
(function(){
  'use strict';
  var T = window.ApHugTools, M = window.ApHugMath;
  if(!T || !M || !M.frqCoach || M.frqCoach.stub) return;
  var F = M.frqCoach, esc = T.esc, KEY = 'aphug_frqcoach_v1';
  var LINKS = {
    explain: ['because', 'so', 'which leads to'],
    'explain-degree': ['To a high degree,', 'To a moderate degree,', 'To a low degree,', 'because'],
    compare: ['Both', 'whereas', 'but'],
    describe: [], identify: [], define: []
  };
  var CHECK_OK = { mechanism: 'The link is stated (because, so, which).', both: 'Both sides are named.', degree: 'The degree is stated.', scale: 'A scale is named.' };
  var CHECK_NAME = { mechanism: 'Link', both: 'Both sides', degree: 'Degree', scale: 'Scale' };

  T.mount('frq-coach', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'frq-coach', labels: ['Explore', 'Test yourself'],
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function load(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }catch(e){ return {}; } }
  function save(d){ try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){} }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var ctxs = data.contexts || [], ctx = ctxs[0], k = 0, LS = null, nid = T.nid('fc'), touched = false;
    var drafts = load(), st = {};
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    function part(){ return ctx.parts[k]; }
    function key(){ return ctx.id + ':' + part().label; }
    function state(){ return st[key()] || (st[key()] = { shown: false, pick: -1, checked: false, order: Math.random() < 0.5 ? [0, 1] : [1, 0] }); }
    host.innerHTML = '<section class="bt-problem hug-fc-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">FRQ coach</h2>' +
      '<div class="hug-fc-fig"></div>' +
      '<div class="hug-fc-ctl"><div class="hug-fc-strip" role="group" aria-label="Part"></div><div class="hug-fc-pcard"></div></div>' +
      '<div class="hug-fc-say"></div>' +
      T.moreHtml('<div class="hug-fc-pick"></div>', 'choose a question') +
      '<div class="hug-fc-ref"></div><p class="sr-only hug-fc-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.hug-fc-live'));
    var cue = T.cue('Read the verb first. Then write what it demands, and check it against the rubric.');
    $('.hug-fc-ctl').insertBefore(cue.el, $('.hug-fc-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var pick = T.choiceSelect({ label: 'Question', options: ctxs.map(function(c){ return { value: c.id, label: c.title }; }), value: ctx.id,
      onChange: function(v){ act(); ctx = ctxs.filter(function(c){ return c.id === v; })[0] || ctxs[0]; k = 0; drawAll(); if(LS && LS.setupRow) LS.setupRow.setup(ctx.title); say('Question: ' + ctx.title + '. Part A.'); } });
    $('.hug-fc-pick').appendChild(pick.el);

    function onClick(e){
      var t = e.target.closest('button');
      if(!t || !(LS ? LS.root : host).contains(t)) return;
      if(t.classList.contains('hug-fc-pb') || t.classList.contains('hug-fc-goto')){ act(); k = +t.getAttribute('data-k'); drawAll(); say('Part ' + part().label + ': ' + F.VERBS[part().verb].name + '.'); var f = $('.hug-fc-pcard textarea'); if(f && !t.classList.contains('hug-fc-goto')) t.focus(); return; }
      if(t.classList.contains('hug-fc-ins')){ act(); insert(t.getAttribute('data-w')); return; }
      if(t.classList.contains('hug-fc-show')){ act(); state().shown = true; drawCard(); say('Rubric line: ' + part().rubric); var r = $('.hug-fc-rub'); if(r) r.focus(); return; }
      if(t.classList.contains('hug-fc-check')){ act(); check(); return; }
      if(t.classList.contains('hug-fc-next')){ act(); k = (k + 1) % ctx.parts.length; drawAll(); var b = $('.hug-fc-pb[data-k="' + k + '"]'); if(b) b.focus(); say('Part ' + part().label + ': ' + F.VERBS[part().verb].name + '.'); }
    }
    host.addEventListener('click', onClick);
    function onChange(e){
      var t = e.target;
      if(t.name === nid + '-earn'){ state().pick = +t.value; state().checked = false; var fb = $('.hug-fc-efb'); if(fb) fb.innerHTML = ''; }
    }
    host.addEventListener('change', onChange);

    function insert(w){
      var ta = $('.hug-fc-write'); if(!ta) return;
      var s = ta.selectionStart != null ? ta.selectionStart : ta.value.length, e2 = ta.selectionEnd != null ? ta.selectionEnd : s;
      var before = ta.value.slice(0, s), after = ta.value.slice(e2);
      var cap = /^[A-Z]/.test(w), pad = before && !/\s$/.test(before) ? ' ' : '';
      var ins = (cap && before.trim() ? w.charAt(0).toLowerCase() + w.slice(1) : w) + ' ';
      if(cap && !before.trim()){ ta.value = ins + after.replace(/^\s+/, ''); s = ins.length; }
      else { ta.value = before + pad + ins + after; s = (before + pad + ins).length; }
      ta.focus(); try{ ta.setSelectionRange(s, s); }catch(x){}
      onWrite();
    }
    function onWrite(){
      var ta = $('.hug-fc-write'); if(!ta) return;
      drafts[key()] = ta.value; save(drafts);
      flags(ta.value);
    }
    function flags(text){
      var G = window.ApHugGrade, ul = $('.hug-fc-flags'), p = part();
      if(!G || !ul) return;
      var spec = F.flagsFor(p), rules = Object.keys(spec.write);
      if(!rules.length){ ul.innerHTML = '<li class="is-note">' + esc(p.verb === 'identify' ? 'Identify: a specific name is enough. No reasons needed.' : p.verb === 'define' ? 'Define: the meaning in a full sentence, not an example.' : 'Describe: say what it is like, where and how much. More than a name.') + '</li>'; return; }
      if(!text.trim()){ ul.innerHTML = rules.map(function(r){ return '<li class="is-todo"><span class="hug-mark">' + CHECK_NAME[r] + '</span> ' + esc(hintOf(r)) + '</li>'; }).join(''); return; }
      var out = G.flags(spec, text);
      // explain the degree: the degree must come FIRST, so only the opening is read for it.
      if(p.verb === 'explain-degree'){ var first = G.flags({ write: { degree: true } }, text.split(/[:.;]/)[0]); out = out.map(function(f){ return f.rule === 'degree' ? first[0] : f; }); }
      ul.innerHTML = out.map(function(f){ return '<li class="' + (f.ok ? 'is-ok' : 'is-no') + '"><span class="hug-mark ' + (f.ok ? 'ok' : 'no') + '">' + (CHECK_NAME[f.rule] || f.rule) + '</span> ' + esc(f.ok ? CHECK_OK[f.rule] || 'OK' : f.hint) + '</li>'; }).join('');
    }
    function hintOf(r){ return { mechanism: 'Give the link: a cause, then "because" or "so", then its effect.', both: 'Say it about both things: "whereas", "both", "but".', degree: 'Open with the degree: "To a moderate degree,".', scale: 'Name the scale: global, regional, national or local.' }[r]; }
    function check(){
      var s = state(), p = part(), fb = $('.hug-fc-efb');
      if(s.pick < 0){ fb.innerHTML = '<span class="bt-small">Choose an answer first.</span>'; return; }
      s.checked = true;
      var ok = s.pick === 0;
      fb.innerHTML = '<p class="hug-fc-res is-' + (ok ? 'ok' : 'no') + '"><span class="hug-mark ' + (ok ? 'ok">Correct' : 'no">Not this one') + '</span> ' + esc(ok ? p.sampleWhy : F.SLIP_NAME[p.slip] + '. ' + p.weakWhy) + '</p>';
      say((ok ? 'Correct. ' + p.sampleWhy : 'Not this one. ' + p.weakWhy));
      drawStrip();
    }

    function drawStage(){
      var fig = $('.hug-fc-fig');
      fig.innerHTML = '<article class="hug-fc-q"><p class="hug-fc-kick">Free-response practice · an original question</p><h3 class="hug-fc-title">' + esc(ctx.title) + '</h3><p class="hug-fc-scn">' + ctx.scenario + '</p>' +
        '<ol class="hug-fc-parts">' + ctx.parts.map(function(p, i){
          return '<li class="hug-fc-part' + (i === k ? ' is-on' : '') + '"><button type="button" class="hug-fc-goto" data-k="' + i + '" aria-label="Answer part ' + p.label + '"' + (i === k ? ' aria-current="true"' : '') + '><span class="hug-fc-pl">' + p.label + '</span></button><span class="hug-fc-pt">' + F.promptHtml(p) + '</span></li>';
        }).join('') + '</ol><p class="hug-fc-foot">One point per part. On the exam, each question has parts A to G.</p></article>';
    }
    function drawStrip(){
      $('.hug-fc-strip').innerHTML = ctx.parts.map(function(p, i){
        var s = st[ctx.id + ':' + p.label], done = s && s.checked && s.pick === 0;
        return '<button type="button" class="hug-fc-pb' + (done ? ' is-done' : '') + '" data-k="' + i + '" aria-pressed="' + (i === k) + '" aria-label="Part ' + p.label + ', ' + esc(F.VERBS[p.verb].name.toLowerCase()) + (done ? ', done' : '') + '"><span class="hug-fc-pbl">' + p.label + '</span><span class="hug-fc-pbv">' + esc(F.VERBS[p.verb].name) + '</span></button>';
      }).join('');
    }
    function drawCard(){
      var p = part(), v = F.VERBS[p.verb], s = state(), el = $('.hug-fc-pcard'), tid = nid + '-w' + k;
      var opts = [p.sample, p.weak];
      el.innerHTML = '<div class="hug-fc-verbcard"><p class="hug-fc-vk">Part ' + p.label + ' asks you to</p><p class="hug-fc-vn">' + esc(v.name) + '</p><p class="hug-fc-vd">' + esc(v.demand) + '</p></div>' +
        '<div class="hug-fc-step"><label class="hug-fc-sh" for="' + tid + '"><span class="hug-fc-n">1</span> Write your answer</label>' +
          (LINKS[p.verb].length ? '<div class="hug-fc-ins-row" role="group" aria-label="Add a link word">' + LINKS[p.verb].map(function(w){ return '<button type="button" class="hug-fc-ins" data-w="' + esc(w) + '">' + esc(w) + '</button>'; }).join('') + '</div>' : '') +
          '<textarea id="' + tid + '" class="hug-fc-write" rows="4" aria-describedby="' + tid + '-f">' + esc(drafts[key()] || '') + '</textarea>' +
          '<ul class="hug-fc-flags" id="' + tid + '-f" aria-live="polite"></ul><p class="bt-small">The checklist gives hints, never a score.</p></div>' +
        '<div class="hug-fc-step"><p class="hug-fc-sh"><span class="hug-fc-n">2</span> Check it against the rubric</p>' +
          (s.shown ? '<div class="hug-fc-rub" tabindex="-1"><p class="hug-fc-rk">Rubric line (1 point)</p><p>' + esc(p.rubric) + '</p><p class="hug-fc-rk">A full-credit answer</p><p class="hug-fc-sample">' + esc(p.sample) + '</p></div>'
            : '<button type="button" class="bt-btn hug-fc-show">Show the rubric line and a sample</button>') + '</div>' +
        '<div class="hug-fc-step"><fieldset class="hug-fc-earn"><legend class="hug-fc-sh"><span class="hug-fc-n">3</span> Which answer earns the point?</legend>' +
          s.order.map(function(o){ var id = nid + '-e' + k + '-' + o; return '<div class="bt-radio hug-fc-opt"><input type="radio" name="' + nid + '-earn" id="' + id + '" value="' + o + '"' + (s.pick === o ? ' checked' : '') + '><label for="' + id + '">' + esc(opts[o]) + '</label></div>'; }).join('') +
          '</fieldset><div class="bt-actions"><button type="button" class="btn-press sm hug-fc-check">Check</button></div><div class="hug-fc-efb" role="status" aria-live="polite"></div></div>' +
        '<div class="hug-fc-act"><button type="button" class="bt-btn hug-fc-next">Next part</button></div>';
      var ta = el.querySelector('textarea');
      ta.addEventListener('input', onWrite);
      flags(ta.value);
      if(s.checked){ var keep = s.pick; s.pick = keep; check(); }
    }
    function words(){
      var p = part(), v = F.VERBS[p.verb];
      var head = '<b>' + esc(v.name) + ':</b> ' + esc(v.demand);
      var why = '<p class="hug-fc-wk">The slip readers see most</p><p>' + esc(v.slip) + '</p>' +
        '<p class="hug-fc-wk">How a part is scored</p><p>Each part earns one point or none. Readers score what you wrote against the rubric line, so the verb decides what counts: a name earns an identify point, but not a describe or an explain point.</p>';
      T.explain($('.hug-fc-say'), head, why);
      if(LS){
        LS.caption('<b>Part ' + esc(p.label) + ': ' + esc(v.name) + '.</b> Watch for: ' + esc(v.slip.charAt(0).toLowerCase() + v.slip.slice(1)), 'explore');
        if(LS.why) LS.why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      }
    }
    function ref(){
      $('.hug-fc-ref').innerHTML = '<h3 class="ls-title-l">The six task verbs</h3>' + T.dataTable(['Verb', 'What earns the point'], F.VERB_ORDER.map(function(v){ return [F.VERBS[v].name, F.VERBS[v].demand]; }), 'Task verbs on the free-response questions');
    }
    function drawAll(){ drawStage(); drawStrip(); drawCard(); words(); }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.hug-fc-fig')], dock: [$('.hug-fc-ctl')], setup: 'Question', moreLabel: 'Choose a question', why: [$('.hug-fc-say')], details: [$('.hug-fc-ref')] });
      s.root.addEventListener('click', onClick); host.removeEventListener('click', onClick);
      s.root.addEventListener('change', onChange); host.removeEventListener('change', onChange);
      LS.setupRow = sp;
      sp.setup(ctx.title);
      drawAll();
      if(s.mode() === 'explore') T.hintSlot(s, s.root.querySelector('.hug-fc-strip'), 'Start here: read the verb', { cls: 'hug-fc-tipslot', before: s.root.querySelector('.hug-fc-pcard') });
    }
    drawAll(); ref();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    var byId = {}; (data.contexts || []).forEach(function(c){ byId[c.id] = c; });
    T.drill(host, data, { slug: 'frq-coach', noun: 'drill',
      generate: function(r, ctx, type){ return F.generate(r, ctx, type); },
      types: F.TYPES.map(function(t){ return { value: t, label: F.TYPE_LABEL[t] }; }),
      typeLabel: 'Practice',
      newLabel: 'New question',
      title: function(p){ return F.TYPE_LABEL[p.type] + ': ' + byId[p.ctx].title; }
    });
  }
})();
