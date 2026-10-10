/* Experimental design and argumentation drills (science practices 3 and 6).
   Scenarios are data (bio/data/tools/design-drills.json); each has five
   drills, each made of rows the student answers with radio buttons and
   checks on its own:
     variables  independent and dependent variable (two rows)
     controls   choose the control, then say what it rules out (two rows,
                scored separately: graders give the justification its own point)
     null       assemble the null hypothesis from three slots (one item),
                then pick the alternative hypothesis (one item)
     cer        tag each sentence of a paragraph claim / evidence / reasoning
     predict    the prediction, then the mechanism (two rows, scored separately)
   Each scenario shows its data table, and two written answers (CER, and
   prediction plus mechanism) follow the drills, self-scored against a rubric
   with ApBioTools.frq. Item ids: design-drills:<scenario>:<row>, and
   design-drills:<scenario>-<cer|predict>:a for the written answers. Choice
   options are shuffled for display, so explanations never name a position.

   Direct versions (tools upgrade, U-Bio-skills): the null hypothesis is
   built from word tiles (tap a tile, or drag it, into its slot of the
   sentence), and the CER paragraph is tagged with a highlighter (pick
   Claim, Evidence or Reasoning, then tap sentences). Both only set the same
   radio buttons, which stay one tap away under "Answer as a list", so
   grading, feedback and recording are unchanged; after Check the list
   opens to show the feedback for every part. */
(function(){
  'use strict';
  var SLUG = 'design-drills';
  var T = window.ApBioTools;
  if(!T) return;
  T.mount(SLUG, function(app, data){
    var esc = T.esc, gid = T.nid('dr');
    var drills = data.drills, scen = data.scenarios;
    if(!scen.length || !drills.length){ app.insertAdjacentHTML('beforeend', '<p class="bio-soon">These drills arrive with their units.</p>'); return; }
    var only = '';
    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('What each drill checks', data.howItWorks) +
      '<div class="bt-controls dr-pick"></div><section class="bt-card dr-scen" aria-live="off"></section>');
    var pick = app.querySelector('.dr-pick'), host = app.querySelector('.dr-scen');
    var scSel = T.choiceSelect({ label: 'Scenario', options: scen.map(function(s, i){ return { value: s.id, label: (i + 1) + '. ' + s.title }; }), value: scen[0].id, onChange: function(v){ draw(v, true); } });
    var drSel = T.choiceSelect({ label: 'Drills', options: [{ value: '', label: 'All drills' }].concat(drills.map(function(d){ return { value: d.id, label: d.name }; })), value: '', onChange: function(v){ only = v; draw(scSel.value(), true); } });
    pick.appendChild(scSel.el); pick.appendChild(drSel.el);
    function shuffle(n){ var a = []; for(var i = 0; i < n; i++) a.push(i); for(var j = n - 1; j > 0; j--){ var k = Math.floor(Math.random() * (j + 1)); var t = a[j]; a[j] = a[k]; a[k] = t; } return a; }
    function topicOf(key){ return (data.partTopics || {})[key]; }

    /* A row: { key, legend, options, correct, why (array per option, or a
       string), practice, fixed }. */
    function rowHtml(r, rid){
      var order = r.fixed ? r.options.map(function(o, i){ return i; }) : shuffle(r.options.length);
      return '<fieldset class="dr-row" data-key="' + r.key + '"><legend>' + r.legend + '</legend><div class="dr-opts">' + order.map(function(i){
        var id = rid + '-' + i;
        return '<div class="bt-radio"><input type="radio" name="' + rid + '" id="' + id + '" value="' + i + '"><label for="' + id + '">' + esc(r.options[i]) + '</label></div>';
      }).join('') + '</div><p class="dr-why" hidden></p></fieldset>';
    }
    /* One drill section: rows, a Check button, feedback; record per row
       unless the drill scores as one item (the null hypothesis). */
    function section(s, d, title, rows, opts){
      opts = opts || {};
      var sid = gid + '-' + s.id + '-' + d.id + (opts.sub ? '-' + opts.sub : '');
      var sec = document.createElement('div');
      sec.className = 'dr-sec';
      sec.innerHTML = '<h3 id="' + sid + '-h">' + esc(title) + '</h3>' + (opts.lead || '') + '<form class="dr-rows" novalidate aria-labelledby="' + sid + '-h">' + rows.map(function(r, i){ return rowHtml(r, sid + '-r' + i); }).join('') +
        '<div class="bt-actions"><button type="submit" class="btn-press sm">Check</button></div></form><p class="bt-result" role="status" aria-live="polite"></p>';
      host.appendChild(sec);
      var form = sec.querySelector('form'), done = false;
      if(opts.onPick) form.addEventListener('change', function(){ opts.onPick(form); });
      form.addEventListener('submit', function(e){
        e.preventDefault();
        if(done) return;
        var picks = rows.map(function(r, i){ var c = form.querySelectorAll('fieldset')[i].querySelector('input:checked'); return c ? +c.value : -1; });
        if(picks.some(function(p){ return p < 0; })){ sec.querySelector('.bt-result').textContent = 'Answer every part first.'; return; }
        done = true;
        var right = 0;
        rows.forEach(function(r, i){
          var fs = form.querySelectorAll('fieldset')[i], ok = picks[i] === r.correct;
          if(ok) right++;
          fs.classList.add(ok ? 'is-right' : 'is-wrong');
          fs.querySelectorAll('input').forEach(function(x){ x.disabled = true; });
          var why = typeof r.why === 'string' ? r.why : (ok ? r.why[r.correct] : r.why[picks[i]] + ' <b>Best answer:</b> ' + esc(r.options[r.correct]) + '. ' + r.why[r.correct]);
          var w = fs.querySelector('.dr-why'); w.hidden = false;
          w.innerHTML = '<span class="bio-mark ' + (ok ? 'ok">Correct' : 'no">Not quite') + '</span> ' + (ok || typeof r.why !== 'string' ? why : why + ' <b>Answer:</b> ' + esc(r.options[r.correct]) + '.');
        });
        var items = opts.oneItem
          ? [{ id: SLUG + ':' + s.id + ':' + opts.oneItem, correct: right === rows.length, topic: topicOf(opts.oneItem), practice: rows[0].practice, level: 'apply', diff: 2, group: d.id }]
          : rows.map(function(r, i){ return { id: SLUG + ':' + s.id + ':' + r.key, correct: picks[i] === r.correct, topic: topicOf(r.topic || r.key), practice: r.practice, level: r.level || 'apply', diff: 2, group: d.id }; });
        T.record(SLUG, items);
        T.event('apbio-drill-check', { tool: SLUG, scenario: s.id, drill: d.id, correct: right, total: rows.length });
        sec.querySelector('.bt-result').textContent = right + ' of ' + rows.length + ' right.';
        form.querySelector('.bt-actions').innerHTML = T.report(SLUG + ':' + s.id + ':' + d.id);
        var lst = sec.querySelector('.dr-list'); if(lst) lst.open = true;
        sec.querySelectorAll('.dr-tile, .dr-sent, .dr-pen').forEach(function(b){ b.disabled = true; });
      });
      return sec;
    }


    /* The radios of a section go into a closed "Answer as a list" disclosure. */
    function listBox(sec, title){
      var form = sec.querySelector('form'), rows = form.querySelector('.bt-actions');
      var det = document.createElement('details');
      det.className = 'bt-how dr-list';
      det.innerHTML = '<summary>' + esc(title) + '</summary><div class="bt-how-body dr-rows"></div>';
      var body = det.querySelector('.dr-rows');
      Array.prototype.slice.call(form.querySelectorAll(':scope > fieldset')).forEach(function(f){ body.appendChild(f); });
      form.insertBefore(det, rows);
      return form;
    }
    function choose(form, i, v){
      var fs = form.querySelectorAll('fieldset')[i], r = fs && fs.querySelector('input[value="' + v + '"]');
      if(!r || r.disabled) return;
      r.checked = true;
      r.dispatchEvent(new Event('change', { bubbles: true }));
    }
    /* Null hypothesis: a sentence of slots, and a tray of tiles per slot. */
    function tiles(sec, sl){
      var form = sec.querySelector('form'), sent = sec.querySelector('.dr-sentence');
      var order = sl.map(function(x, i){ return Array.prototype.map.call(form.querySelectorAll('fieldset')[i].querySelectorAll('input'), function(r){ return +r.value; }); });
      var build = document.createElement('div');
      build.className = 'dr-build';
      build.innerHTML = '<p class="dr-slots" aria-live="polite">' + sl.map(function(x, i){ return '<span class="dr-slot" data-i="' + i + '"><span class="dr-slotk">' + (i + 1) + '. ' + esc(x.label) + '</span><span class="dr-slotv">…</span></span>'; }).join(' ') + '<span class="dr-dot">.</span></p>' +
        sl.map(function(x, i){ return '<div class="dr-tray" role="group" aria-label="' + esc('Tiles for slot ' + (i + 1) + ': ' + x.label) + '"><span class="dr-trayk" aria-hidden="true">' + (i + 1) + '</span>' + order[i].map(function(v){ return '<button type="button" class="dr-tile" data-i="' + i + '" data-v="' + v + '" aria-pressed="false">' + esc(x.options[v]) + '</button>'; }).join('') + '</div>'; }).join('');
      sent.hidden = true;
      sent.parentNode.insertBefore(build, sent.nextSibling);
      listBox(sec, 'Answer as a list instead');
      function sync(){
        sl.forEach(function(x, i){
          var c = form.querySelectorAll('fieldset')[i].querySelector('input:checked'), v = c ? +c.value : -1;
          var slot = build.querySelector('.dr-slot[data-i="' + i + '"]');
          slot.classList.toggle('is-full', v > -1);
          slot.querySelector('.dr-slotv').textContent = v > -1 ? x.options[v] : '…';
          build.querySelectorAll('.dr-tile[data-i="' + i + '"]').forEach(function(b){ var on = +b.getAttribute('data-v') === v; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('is-used', on); });
        });
      }
      form.addEventListener('change', sync);
      build.addEventListener('click', function(e){
        var t = e.target.closest('.dr-tile'); if(t){ choose(form, +t.getAttribute('data-i'), +t.getAttribute('data-v')); return; }
      });
      // drag a tile onto the sentence: it lands in its own slot
      var dragging = null, ghost = null;
      build.addEventListener('pointerdown', function(e){
        var t = e.target.closest('.dr-tile'); if(!t || t.disabled || e.pointerType === 'mouse' && e.button) return;
        dragging = { t: t, x: e.clientX, y: e.clientY, moved: false };
      });
      window.addEventListener('pointermove', function(e){
        if(!dragging) return;
        if(!dragging.moved && Math.abs(e.clientX - dragging.x) + Math.abs(e.clientY - dragging.y) < 8) return;
        if(!dragging.moved){ dragging.moved = true; ghost = dragging.t.cloneNode(true); ghost.className = 'dr-tile dr-ghost'; document.body.appendChild(ghost); }
        ghost.style.left = (e.clientX - 20) + 'px'; ghost.style.top = (e.clientY - 18) + 'px';
        var over = document.elementFromPoint(e.clientX, e.clientY);
        build.querySelectorAll('.dr-slot').forEach(function(s2){ s2.classList.toggle('is-over', !!over && (s2.contains(over) || over.classList.contains('dr-slots'))); });
      });
      window.addEventListener('pointerup', function(e){
        if(!dragging) return;
        var d = dragging; dragging = null;
        if(ghost){ ghost.remove(); ghost = null; }
        build.querySelectorAll('.dr-slot').forEach(function(s2){ s2.classList.remove('is-over'); });
        if(!d.moved) return;
        var over = document.elementFromPoint(e.clientX, e.clientY);
        if(over && build.querySelector('.dr-slots').contains(over)) choose(form, +d.t.getAttribute('data-i'), +d.t.getAttribute('data-v'));
        d.t.addEventListener('click', function stop(ev){ ev.stopPropagation(); d.t.removeEventListener('click', stop, true); }, true);
      });
      sync();
    }
    /* CER: a paragraph of tappable sentences and three highlighter pens. */
    function highlighter(sec, cer){
      var form = sec.querySelector('form'), pen = 0;
      var hl = document.createElement('div');
      hl.className = 'dr-hl';
      hl.innerHTML = '<div class="dr-pens" role="group" aria-label="Highlighter">' + TAGS.map(function(t, i){ return '<button type="button" class="dr-pen p' + i + '" data-p="' + i + '" aria-pressed="' + (i === 0) + '"><span class="dr-mk" aria-hidden="true"></span>' + t + '</button>'; }).join('') + '</div>' +
        '<p class="dr-para">' + cer.map(function(c, i){ return '<button type="button" class="dr-sent" data-i="' + i + '" aria-label="' + esc('Sentence ' + (i + 1) + ': ' + c.text + '. Not tagged.') + '">' + esc(c.text) + '<span class="dr-tag" aria-hidden="true"></span></button>'; }).join(' ') + '</p><p class="bt-small dr-hlsay" role="status" aria-live="polite"></p>';
      form.insertBefore(hl, form.firstChild);
      listBox(sec, 'Answer as a list instead');
      var say = hl.querySelector('.dr-hlsay');
      function sync(){
        cer.forEach(function(c, i){
          var r = form.querySelectorAll('fieldset')[i].querySelector('input:checked'), v = r ? +r.value : -1, b = hl.querySelector('.dr-sent[data-i="' + i + '"]');
          b.className = 'dr-sent' + (v > -1 ? ' p' + v : '');
          b.querySelector('.dr-tag').textContent = v > -1 ? TAGS[v] : '';
          b.setAttribute('aria-label', 'Sentence ' + (i + 1) + ': ' + c.text + '. ' + (v > -1 ? 'Tagged ' + TAGS[v] + '.' : 'Not tagged.'));
        });
      }
      hl.querySelector('.dr-pens').addEventListener('click', function(e){
        var b = e.target.closest('.dr-pen'); if(!b) return;
        pen = +b.getAttribute('data-p');
        hl.querySelectorAll('.dr-pen').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        say.textContent = TAGS[pen] + ' highlighter. ' + ['A claim answers the question.', 'Evidence is data: numbers or observations from the results.', 'Reasoning explains why the evidence supports the claim, using biology.'][pen];
      });
      hl.querySelector('.dr-para').addEventListener('click', function(e){
        var b = e.target.closest('.dr-sent'); if(!b) return;
        choose(form, +b.getAttribute('data-i'), pen);
        say.textContent = 'Sentence ' + (+b.getAttribute('data-i') + 1) + ' tagged ' + TAGS[pen] + '.';
      });
      form.addEventListener('change', sync);
      sync();
    }

    var WRITE_TITLE = { cer: 'Write it yourself: claim, evidence and reasoning', predict: 'Write it yourself: prediction and mechanism' };
    var TAGS = ['Claim', 'Evidence', 'Reasoning'], TAG_ID = ['claim', 'evidence', 'reasoning'], TAG_PRACTICE = { claim: '6.A', evidence: '6.B', reasoning: '6.C' };
    function draw(id, focus){
      var s = scen.filter(function(x){ return x.id === id; })[0];
      host.innerHTML = '<h2 id="' + gid + '-sh" tabindex="-1">' + esc(s.title) + '</h2><div class="bt-context">' + s.setup + '</div>' +
        (s.data ? T.dataTable(s.data.cols, s.data.rows, s.data.caption) : '');
      drills.forEach(function(d){
        if(only && only !== d.id) return;
        if(d.id === 'variables') section(s, d, 'Name the variables', [
          { key: 'iv', legend: 'Independent variable: what the investigators change on purpose', options: s.variables.options, correct: s.variables.iv, why: whyVar(s, 'iv'), practice: '3.C' },
          { key: 'dv', legend: 'Dependent variable: what they measure in response', options: s.variables.options, correct: s.variables.dv, why: whyVar(s, 'dv'), practice: '3.C' }]);
        if(d.id === 'controls') section(s, d, 'Choose a control, then justify it', [
          { key: 'control', legend: s.control.q, options: s.control.options, correct: s.control.correct, why: s.control.why, practice: '3.C' },
          { key: 'control-why', legend: s.controlWhy.q, options: s.controlWhy.options, correct: s.controlWhy.correct, why: s.controlWhy.why, practice: '3.C', level: 'analyze' }]);
        if(d.id === 'null'){
          var sl = s.null.slots;
          var nsec = section(s, d, 'Build the null hypothesis', sl.map(function(x, i){ return { key: 'null-' + i, legend: (i + 1) + '. ' + x.label, options: x.options, correct: x.correct, why: x.why, practice: '3.B' }; }),
            { oneItem: 'null', lead: '<p class="dr-sentence" aria-live="polite">… … …</p>', onPick: function(form){
              var parts = sl.map(function(x, i){ var c = form.querySelectorAll('fieldset')[i].querySelector('input:checked'); return c ? x.options[+c.value] : '…'; });
              form.parentNode.querySelector('.dr-sentence').textContent = parts.join(' ') + '.';
            } });
          tiles(nsec, sl);
          if(s.alt) section(s, d, 'Now the alternative hypothesis', [
            { key: 'alt', legend: s.alt.q, options: s.alt.options, correct: s.alt.correct, why: s.alt.why, practice: '3.B' }], { sub: 'alt' });
        }
        if(d.id === 'cer') highlighter(section(s, d, 'Claim, evidence or reasoning?', s.cer.map(function(c, i){
          return { key: 'cer-' + (i + 1), topic: 'cer', legend: '“' + c.text + '”', options: TAGS, correct: TAG_ID.indexOf(c.tag), why: c.why, practice: TAG_PRACTICE[c.tag], fixed: true, level: 'analyze' };
        }), { lead: '<p class="bt-small">A student wrote this paragraph about the results. Pick a highlighter, then tap each sentence it fits.</p>' }), s.cer);
        if(d.id === 'predict') section(s, d, 'Predict, then explain the mechanism', [
          { key: 'predict', legend: s.predict.q, options: s.predict.options, correct: s.predict.correct, why: s.predict.why, practice: '6.E', fixed: true, level: 'analyze' },
          { key: 'mechanism', legend: s.mechanism.q, options: s.mechanism.options, correct: s.mechanism.correct, why: s.mechanism.why, practice: '6.C', level: 'analyze' }]);
      });
      (s.write || []).forEach(function(w){
        if(only && only !== w.drill) return;
        T.frq(host, { id: s.id + '-' + w.drill, title: WRITE_TITLE[w.drill], topic: topicOf('write-' + w.drill),
          parts: [{ label: 'a', prompt: w.prompt, points: w.points, practice: w.practice, rubric: w.rubric, sample: w.sample, topic: topicOf('write-' + w.drill) }] }, SLUG);
      });
      if(focus) host.querySelector('h2').focus();
    }
    function whyVar(s, k){
      return s.variables.options.map(function(o, i){
        if(i === s.variables[k]) return s.variables.why[k];
        if(s.variables.whyOptions && s.variables.whyOptions[i]) return s.variables.whyOptions[i];
        if(i === s.variables.iv) return 'That is the independent variable: the investigators change it on purpose.';
        if(i === s.variables.dv) return 'That is the dependent variable: it is what they measure.';
        return 'That is kept the same in every group: a controlled variable.';
      });
    }
    draw(scen[0].id, false);
  });
})();
