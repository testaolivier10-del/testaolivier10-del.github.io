/* Experimental design and argumentation (AP Biology science practices 3 and 6), tools v2
   (docs/tools-v2-standard.md; brief: docs/tools-v2-design-drills-brief.md), on the shared kit
   (assets/course/tool-kit2.js) through the course adapter ApBioTools.studioKit2.
   EXPLORE (free play, nothing graded; explore() below): a drawn bench of bean plants, a control group and a test
   group. Tab "Fair test": tap what the test group gets (water, plant food, warmth); every difference between the
   groups is ringed, the plants grow to the result, and the cause line says whether the difference can be credited.
   Tab "Sample size": one knob for the plants per group, ±2 SE error bars, "New plants" for a new batch.
   TEST YOURSELF ("Experiment drills", drillsPart() below): every drill of every experiment, unchanged.

   The drills, as before:
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
   opens to show the feedback for every part.

   The setup schematic (tool audit 2026-10: the drills were a paragraph, a
   table and radio buttons). Since the tool review of 2026-11 each scenario
   is drawn as its own setup (see SCENES below) with a plain chart of its
   data beside it. Under it, the setup's parts (the variables drill's
   options) are tags, and the same parts are tappable in the picture; in
   the variables drill, tapping a tag or a part answers the current row
   (what they change, then what they measure), and after Check each tag
   says its role. The tags only set the same radio buttons. */
(function(){
  'use strict';
  var SLUG = 'design-drills';
  var T = window.ApBioTools;
  if(!T) return;
  var EXP = null, CTX = null;
  T.mount(SLUG, function(app, data, ctx){
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
    T.stdPicker(scSel, { label: 'Experiment', count: false, mode: 'quiz' });
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
      sec.className = 'dr-sec'; sec.setAttribute('data-drill', d.id);
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

    /* The setup picture (tool review 2026-11: every scenario was the same row of
       flasks with bars inside, and negative melting points showed as positive
       bars). Each scenario now has a drawn scene of its own setup (SCENES, by
       scenario id): the organism or apparatus, one drawing per group with its
       level under it, and the equipment for what is measured and what is kept
       the same. Every drawn part that matches one of the variables drill's
       options is a <g class="dr-part" data-part="i">, tied to the tag of the
       same option: tapping either answers the drill, and after Check both
       show the role. The data go in a plain labeled chart beside the scene
       (bars from a zero line, so negative values point down, with the ± error
       bars). A scenario with no scene of its own falls back to plain labeled
       flasks. */
    function numOf(v){ var m = /^\s*(−|-)?\s*(\d+(?:\.\d+)?)/.exec(String(v).replace(/<[^>]+>/g, '')); return m ? (m[1] ? -1 : 1) * parseFloat(m[2]) : NaN; }
    function errOf(v){ var m = /±\s*(\d+(?:\.\d+)?)/.exec(String(v)); return m ? parseFloat(m[1]) : 0; }
    function strip(t){ return String(t).replace(/<[^>]+>/g, ''); }
    function n1(v){ return (Math.round(v * 10) / 10).toString(); }
    function tx(x, y, t, cls, anchor){ return '<text class="' + (cls || 'dk-t') + '" x="' + n1(x) + '" y="' + n1(y) + '" text-anchor="' + (anchor || 'middle') + '">' + esc(t) + '</text>'; }
    function tx2(x, y, t, cls){ var l = String(t).split('\n'); return '<text class="' + (cls || 'dk-t') + '" x="' + n1(x) + '" y="' + n1(y) + '" text-anchor="middle">' + l.map(function(s, i){ return '<tspan x="' + n1(x) + '"' + (i ? ' dy="12"' : '') + '>' + esc(s) + '</tspan>'; }).join('') + '</text>'; }
    function part(i, body){ return '<g class="dr-part" data-part="' + i + '">' + body + '</g>'; }
    function hit(x, y, w, h){ return '<rect class="dk-hit" x="' + n1(x) + '" y="' + n1(y) + '" width="' + n1(w) + '" height="' + n1(h) + '"/>'; }
    var P2 = Math.PI * 2;
    /* Equipment icons, about 30 px, centered on x, y. */
    var I = {
      lamp: function(x, y, c){ return '<path class="dk-metal" d="M' + (x - 13) + ' ' + (y - 1) + 'L' + (x - 7) + ' ' + (y - 13) + 'H' + (x + 7) + 'L' + (x + 13) + ' ' + (y - 1) + 'Z"/><circle class="' + (c || 'dk-bulb') + '" cx="' + x + '" cy="' + (y + 4) + '" r="6"/><path class="dk-ray" d="M' + (x - 11) + ' ' + (y + 9) + 'l-5 5M' + x + ' ' + (y + 13) + 'v6M' + (x + 11) + ' ' + (y + 9) + 'l5 5"/>'; },
      thermo: function(x, y){ return '<rect class="dk-glass" x="' + (x - 3.5) + '" y="' + (y - 15) + '" width="7" height="25" rx="3.5"/><circle class="dk-red" cx="' + x + '" cy="' + (y + 10) + '" r="5.5"/><rect class="dk-red" x="' + (x - 1.4) + '" y="' + (y - 7) + '" width="2.8" height="15"/>'; },
      clock: function(x, y){ return '<circle class="dk-face" cx="' + x + '" cy="' + y + '" r="12"/><path class="dk-hand" d="M' + x + ' ' + y + 'V' + (y - 8) + 'M' + x + ' ' + y + 'H' + (x + 6) + '"/>'; },
      watch: function(x, y){ return '<rect class="dk-metal" x="' + (x - 3) + '" y="' + (y - 17) + '" width="6" height="5" rx="1"/>' + I.clock(x, y + 1); },
      cal: function(x, y, t){ return '<rect class="dk-face" x="' + (x - 14) + '" y="' + (y - 13) + '" width="28" height="26" rx="3"/><path class="dk-redb" d="M' + (x - 14) + ' ' + (y - 6) + 'V' + (y - 10) + 'q0 -3 3 -3H' + (x + 11) + 'q3 0 3 3V' + (y - 6) + 'Z"/><text class="dk-ic" x="' + x + '" y="' + (y + 8) + '" text-anchor="middle">' + esc(t) + '</text>'; },
      balance: function(x, y){ return '<path class="dk-metal" d="M' + (x - 16) + ' ' + (y + 12) + 'h32l-3 -9h-26z"/><rect class="dk-screen" x="' + (x - 6) + '" y="' + (y + 5) + '" width="12" height="5" rx="1"/><path class="dk-metal" d="M' + (x - 11) + ' ' + y + 'h22"/><ellipse class="dk-green" cx="' + x + '" cy="' + (y - 3) + '" rx="8" ry="3.5"/>'; },
      ruler: function(x, y){ var d = ''; for(var i = 0; i <= 8; i++) d += 'M' + (x - 16 + i * 4) + ' ' + (y - 5) + 'v' + (i % 2 ? 3 : 5); return '<rect class="dk-ruler" x="' + (x - 18) + '" y="' + (y - 5) + '" width="36" height="10" rx="1.5"/><path class="dk-hand" d="' + d + '"/>'; },
      meter: function(x, y){ return '<rect class="dk-face" x="' + (x - 14) + '" y="' + (y - 11) + '" width="28" height="22" rx="4"/><path class="dk-hand" d="M' + (x - 8) + ' ' + (y + 2) + 'a8 8 0 0 1 16 0M' + x + ' ' + (y + 3) + 'l5 -7"/><circle class="dk-red" cx="' + x + '" cy="' + (y + 3) + '" r="1.6"/>'; },
      dropper: function(x, y){ return '<rect class="dk-red" x="' + (x - 4) + '" y="' + (y - 14) + '" width="8" height="9" rx="4"/><path class="dk-glass" d="M' + (x - 2.5) + ' ' + (y - 6) + 'V' + (y + 8) + 'L' + x + ' ' + (y + 12) + 'L' + (x + 2.5) + ' ' + (y + 8) + 'V' + (y - 6) + 'Z"/>'; },
      bottle: function(x, y, t){ return '<path class="dk-glass" d="M' + (x - 4) + ' ' + (y - 14) + 'h8v6l5 4v16h-18v-16l5 -4z"/><rect class="dk-metal" x="' + (x - 5) + '" y="' + (y - 17) + '" width="10" height="4" rx="1"/><text class="dk-ic" x="' + x + '" y="' + (y + 7) + '" text-anchor="middle">' + esc(t) + '</text>'; },
      tally: function(x, y){ return '<path class="dk-hand" d="M' + (x - 10) + ' ' + (y - 9) + 'v18M' + (x - 5) + ' ' + (y - 9) + 'v18M' + x + ' ' + (y - 9) + 'v18M' + (x + 5) + ' ' + (y - 9) + 'v18M' + (x - 13) + ' ' + (y + 6) + 'l22 -13"/>'; },
      scope: function(x, y){ return '<path class="dk-metal" d="M' + (x - 12) + ' ' + (y + 13) + 'h22M' + (x + 6) + ' ' + (y + 13) + 'v-8a10 10 0 0 0 -10 -12"/><rect class="dk-scope" x="' + (x - 9) + '" y="' + (y - 16) + '" width="8" height="18" rx="2" transform="rotate(-20 ' + (x - 5) + ' ' + (y - 7) + ')"/><path class="dk-metal" d="M' + (x - 11) + ' ' + (y + 5) + 'h12"/>'; },
      dna: function(x, y){ var a = '', b = '', r = ''; for(var i = 0; i <= 12; i++){ var yy = y - 12 + i * 2, s = Math.sin(i / 12 * P2) * 8; a += (i ? 'L' : 'M') + n1(x + s) + ' ' + yy; b += (i ? 'L' : 'M') + n1(x - s) + ' ' + yy; if(i % 2) r += 'M' + n1(x - s) + ' ' + yy + 'H' + n1(x + s); } return '<path class="dk-hand thin" d="' + r + '"/><path class="dk-dna" d="' + a + '"/><path class="dk-dna b" d="' + b + '"/>'; },
      drop: function(x, y, r, cls){ r = r || 6; return '<path class="' + (cls || 'dk-water') + '" d="M' + x + ' ' + n1(y - r * 1.6) + 'C' + n1(x + r * 0.4) + ' ' + n1(y - r * 0.8) + ' ' + n1(x + r) + ' ' + n1(y - r * 0.3) + ' ' + n1(x + r) + ' ' + n1(y + r * 0.2) + 'a' + r + ' ' + r + ' 0 0 1 ' + (-2 * r) + ' 0C' + n1(x - r) + ' ' + n1(y - r * 0.3) + ' ' + n1(x - r * 0.4) + ' ' + n1(y - r * 0.8) + ' ' + x + ' ' + n1(y - r * 1.6) + 'Z"/>'; },
      sun: function(x, y){ var d = ''; for(var i = 0; i < 8; i++){ var t = i / 8 * P2; d += 'M' + n1(x + Math.cos(t) * 10) + ' ' + n1(y + Math.sin(t) * 10) + 'L' + n1(x + Math.cos(t) * 15) + ' ' + n1(y + Math.sin(t) * 15); } return '<path class="dk-sunray" d="' + d + '"/><circle class="dk-sun" cx="' + x + '" cy="' + y + '" r="7.5"/>'; },
      vial: function(x, y){ return '<rect class="dk-glass" x="' + (x - 7) + '" y="' + (y - 14) + '" width="14" height="27" rx="3"/><rect class="dk-food" x="' + (x - 6) + '" y="' + (y + 4) + '" width="12" height="8" rx="2"/><rect class="dk-plug" x="' + (x - 8) + '" y="' + (y - 17) + '" width="16" height="5" rx="2"/>'; },
      glow: function(x, y){ return '<circle class="dk-glowh" cx="' + x + '" cy="' + y + '" r="14"/><path class="dk-glass" d="M' + (x - 4) + ' ' + (y - 13) + 'v7l-8 14q-2 5 4 5h16q6 0 4 -5l-8 -14v-7z"/><path class="dk-glowl" d="M' + (x - 9) + ' ' + (y + 5) + 'l3 -6h12l3 6q1 3 -2 3h-14q-3 0 -2 -3z"/>'; },
      hist: function(x, y){ var h = [4, 9, 14, 9, 4], d = ''; h.forEach(function(v, i){ d += '<rect class="dk-bar" x="' + (x - 13 + i * 5.2) + '" y="' + (y + 10 - v) + '" width="4.4" height="' + v + '"/>'; }); return '<path class="dk-hand" d="M' + (x - 15) + ' ' + (y + 10.5) + 'h30"/>' + d; },
      pond: function(x, y){ return '<ellipse class="dk-water" cx="' + x + '" cy="' + (y + 4) + '" rx="15" ry="7"/><path class="dk-reed" d="M' + (x - 9) + ' ' + (y + 2) + 'q-1 -10 -3 -14M' + (x - 6) + ' ' + (y + 2) + 'q1 -9 3 -12M' + (x + 10) + ' ' + (y + 3) + 'q0 -8 2 -11"/>'; },
      cells: function(x, y){ return '<ellipse class="dk-dish" cx="' + x + '" cy="' + (y + 4) + '" rx="15" ry="6.5"/><path class="dk-cellp" d="M' + (x - 8) + ' ' + (y + 3) + 'l3 -3 4 1 1 3 -4 2zM' + (x + 2) + ' ' + (y + 5) + 'l3 -3 4 1 0 3 -4 1z"/>'; },
      female: function(x, y){ return '<circle class="dk-sym" cx="' + x + '" cy="' + (y - 4) + '" r="7"/><path class="dk-sym" d="M' + x + ' ' + (y + 3) + 'v10M' + (x - 4) + ' ' + (y + 8) + 'h8"/>'; },
      cyl: function(x, y){ return '<path class="dk-glass" d="M' + (x - 6) + ' ' + (y - 15) + 'v26q0 3 3 3h6q3 0 3 -3v-26"/><path class="dk-water" d="M' + (x - 5) + ' ' + (y - 3) + 'v13q0 2 2 2h6q2 0 2 -2v-13z"/><path class="dk-hand thin" d="M' + (x - 6) + ' ' + (y - 9) + 'h4M' + (x - 6) + ' ' + (y - 3) + 'h4M' + (x - 6) + ' ' + (y + 3) + 'h4"/><path class="dk-metal" d="M' + (x - 9) + ' ' + (y + 15) + 'h18"/>'; },
      heater: function(x, y){ return '<rect class="dk-metal" x="' + (x - 15) + '" y="' + (y + 2) + '" width="30" height="11" rx="2"/><path class="dk-heat" d="M' + (x - 8) + ' ' + y + 'q-3 -5 0 -9t0 -9M' + x + ' ' + y + 'q-3 -5 0 -9t0 -9M' + (x + 8) + ' ' + y + 'q-3 -5 0 -9t0 -9"/>'; },
      mag: function(x, y){ return '<circle class="dk-lens" cx="' + (x - 3) + '" cy="' + (y - 3) + '" r="9"/><path class="dk-metal thick" d="M' + (x + 4) + ' ' + (y + 4) + 'l8 8"/>'; },
      moon: function(x, y){ return '<path class="dk-moon" d="M' + (x + 3) + ' ' + (y - 10) + 'a10 10 0 1 0 7 15a8 8 0 0 1 -7 -15z"/>'; },
      probe: function(x, y){ return I.meter(x - 4, y) + '<path class="dk-hand" d="M' + (x + 10) + ' ' + y + 'q8 0 8 10v6"/><rect class="dk-metal" x="' + (x + 16) + '' + '" y="' + (y + 15) + '" width="4" height="8" rx="1"/>'; },
      counter: function(x, y){ return '<rect class="dk-face" x="' + (x - 14) + '" y="' + (y - 11) + '" width="28" height="22" rx="4"/><rect class="dk-screen" x="' + (x - 10) + '" y="' + (y - 7) + '" width="20" height="8" rx="1"/><path class="dk-hand" d="M' + (x - 7) + ' ' + (y - 3) + 'h2M' + (x - 2) + ' ' + (y - 3) + 'h2M' + (x + 3) + ' ' + (y - 3) + 'h2"/><circle class="dk-rad" cx="' + (x + 7) + '" cy="' + (y + 6) + '" r="2.5"/>'; },
      split: function(x, y){ return '<path class="dk-black" d="M' + x + ' ' + (y - 11) + 'a11 11 0 0 0 0 22z"/><path class="dk-brown" d="M' + x + ' ' + (y - 11) + 'a11 11 0 0 1 0 22z"/>'; },
      jar: function(x, y){ return '<rect class="dk-glass" x="' + (x - 11) + '" y="' + (y - 9) + '" width="22" height="22" rx="4"/><rect class="dk-metal" x="' + (x - 12) + '" y="' + (y - 13) + '" width="24" height="5" rx="1.5"/><rect class="dk-flour" x="' + (x - 10) + '" y="' + (y + 4) + '" width="20" height="8" rx="2"/>'; },
      cover: function(x, y){ return '<path class="dk-cover" d="M' + (x - 16) + ' ' + (y + 8) + 'v-10q0 -6 6 -6h20q6 0 6 6v10z"/>'; },
      bug: function(x, y){ return woodlouse(x, y, 0, 1); },
      arrow: function(x, y){ return '<path class="dk-arrow" d="M' + (x - 14) + ' ' + y + 'h24"/><path class="dk-arrowh" d="M' + (x + 8) + ' ' + (y - 5) + 'l7 5-7 5z"/>'; }
    };
    /* Top row: the shared equipment, evenly spaced; each is [part, icon svg fn(x, y), label]. */
    function topRow(items){
      var m = items.length, o = '';
      items.forEach(function(it, i){
        var x = 400 / m * (i + 0.5), body = hit(x - 46, 4, 92, 74) + it[1](x, 26) + tx2(x, 56, it[2], 'dk-t');
        o += it[0] == null ? '<g>' + body + '</g>' : part(it[0], body);
      });
      return o;
    }
    function gx(n, k, L, R){ L = L == null ? 20 : L; R = R == null ? 380 : R; return L + (R - L) / n * (k + 0.5); }
    /* The levels (the first column) under the groups, and its name: the independent variable, part 0. */
    function levels(D, fmtL, title, y, ty){
      var o = '', gw = ((D.R || 380) - (D.L || 20)) / D.n, narrow = gw < 60;
      y = y || (narrow ? 214 : 222);
      D.lv.forEach(function(l, k){
        var x = gx(D.n, k, D.L, D.R), t = fmtL ? fmtL(l, k) : l, two = narrow && t.indexOf(' ') > 0;
        o += two ? '<text class="dk-lv" x="' + n1(x) + '" y="' + y + '" text-anchor="middle">' + esc(t.slice(0, t.indexOf(' '))) + '<tspan x="' + n1(x) + '" dy="12">' + esc(t.slice(t.indexOf(' ') + 1)) + '</tspan></text>' : tx(x, y, t, 'dk-lv');
      });
      return o + tx(((D.L || 20) + (D.R || 380)) / 2, ty || y + (narrow ? 32 : 20), title || strip(D.cols[0]), 'dk-ax');
    }
    function flask(cx, top, bot, w, inner){
      var nk = w * 0.2;
      return '<path class="dk-glass" d="M' + n1(cx - nk) + ' ' + top + 'V' + (top + 20) + 'L' + n1(cx - w / 2) + ' ' + (bot - 6) + 'Q' + n1(cx - w / 2) + ' ' + bot + ' ' + n1(cx - w / 2 + 6) + ' ' + bot + 'H' + n1(cx + w / 2 - 6) + 'Q' + n1(cx + w / 2) + ' ' + bot + ' ' + n1(cx + w / 2) + ' ' + (bot - 6) + 'L' + n1(cx + nk) + ' ' + (top + 20) + 'V' + top + '"/>' + (inner || '');
    }
    function flaskLiq(cx, lt, bot, w, top, cls){
      // the liquid inside a flask whose walls run from (cx ± w*0.2, top + 20) to (cx ± w/2, bot)
      var f = (lt - (top + 20)) / (bot - top - 20), hw = w * 0.2 + (w / 2 - w * 0.2) * f - 2;
      return '<path class="' + (cls || 'dk-water') + '" d="M' + n1(cx - hw) + ' ' + lt + 'L' + n1(cx - w / 2 + 2) + ' ' + (bot - 6) + 'Q' + n1(cx - w / 2 + 2) + ' ' + (bot - 2) + ' ' + n1(cx - w / 2 + 7) + ' ' + (bot - 2) + 'H' + n1(cx + w / 2 - 7) + 'Q' + n1(cx + w / 2 - 2) + ' ' + (bot - 2) + ' ' + n1(cx + w / 2 - 2) + ' ' + (bot - 6) + 'L' + n1(cx + hw) + ' ' + lt + 'Z"/>';
    }
    function tube(cx, top, bot, w, liq, cls){
      var r = w / 2, o = '<path class="dk-glass" d="M' + n1(cx - r) + ' ' + top + 'V' + n1(bot - r) + 'A' + r + ' ' + r + ' 0 0 0 ' + n1(cx + r) + ' ' + n1(bot - r) + 'V' + top + '"/>';
      if(liq != null) o = '<path class="' + (cls || 'dk-water') + '" d="M' + n1(cx - r + 1.5) + ' ' + liq + 'V' + n1(bot - r) + 'A' + (r - 1.5) + ' ' + (r - 1.5) + ' 0 0 0 ' + n1(cx + r - 1.5) + ' ' + n1(bot - r) + 'V' + liq + 'Z"/>' + o;
      return o;
    }
    function dots(cx, cy, w, h, n, cls, r, seed){
      var o = '', s = seed || 7;
      for(var i = 0; i < n; i++){ s = (s * 9301 + 49297) % 233280; var a = s / 233280; s = (s * 9301 + 49297) % 233280; var b = s / 233280; o += '<circle class="' + cls + '" cx="' + n1(cx - w / 2 + a * w) + '" cy="' + n1(cy - h / 2 + b * h) + '" r="' + (r || 1.6) + '"/>'; }
      return o;
    }
    function rnd(seed){ var s = seed || 11; return function(){ s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
    /* Organisms */
    function duckweed(x, y){ return '<ellipse class="dk-leaf" cx="' + (x - 5) + '" cy="' + y + '" rx="5" ry="2.4"/><ellipse class="dk-leaf" cx="' + (x + 3) + '" cy="' + (y - 0.5) + '" rx="4.5" ry="2.2"/><path class="dk-root" d="M' + (x - 4) + ' ' + (y + 2) + 'v7M' + (x + 3) + ' ' + (y + 1.5) + 'v6"/>'; }
    function paramecium(x, y, s){ s = s || 1; return '<g transform="translate(' + n1(x) + ' ' + n1(y) + ') scale(' + s + ')"><path class="dk-cell" d="M-16 0c0 -7 8 -10 16 -9c10 1 17 4 16 9c-1 6 -9 9 -17 8c-8 -1 -15 -3 -15 -8z"/><path class="dk-cil" d="M-15 -4l-3 -2M-9 -8l-2 -3M-2 -9.5l-1 -3M5 -9l0 -3M12 -6.5l2 -2.5M16 0l3 0M12 6.5l2 2.5M4 8.5l0 3M-4 8.5l-1 3M-11 6l-2 2.5"/><circle class="dk-nuc" cx="-1" cy="1" r="3.4"/><circle class="dk-vac" cx="-10" cy="-1" r="2.8"/><path class="dk-vacr" d="M-10 -1l-4 -3M-10 -1l-4 2M-10 -1l0 -5M-10 -1l2 4"/><circle class="dk-vac" cx="10" cy="0" r="2.6"/></g>'; }
    function rbc(x, y){ return '<ellipse class="dk-rbc" cx="' + n1(x) + '" cy="' + n1(y) + '" rx="5" ry="3.4"/><ellipse class="dk-rbcc" cx="' + n1(x) + '" cy="' + n1(y) + '" rx="2" ry="1.3"/>'; }
    function pea(x, y){ return '<circle class="dk-pea" cx="' + n1(x) + '" cy="' + n1(y) + '" r="2.7"/>'; }
    function fly(x, y, wing, s){ s = s || 1; var w = wing || 1; return '<g transform="translate(' + n1(x) + ' ' + n1(y) + ') scale(' + s + ')"><ellipse class="dk-wing" cx="' + n1(-2 - 3 * w) + '" cy="-4" rx="' + n1(2 + 5 * w) + '" ry="' + n1(1.4 + 1.6 * w) + '" transform="rotate(25 -2 -2)"/><ellipse class="dk-wing" cx="' + n1(2 + 3 * w) + '" cy="-4" rx="' + n1(2 + 5 * w) + '" ry="' + n1(1.4 + 1.6 * w) + '" transform="rotate(-25 2 -2)"/><ellipse class="dk-fly" cx="0" cy="1" rx="3" ry="6"/><circle class="dk-flyh" cx="0" cy="-6" r="2.6"/><circle class="dk-red" cx="-1.6" cy="-6.6" r="1"/><circle class="dk-red" cx="1.6" cy="-6.6" r="1"/></g>'; }
    function woodlouse(x, y, rot, s){ var seg = ''; for(var i = -2; i <= 2; i++) seg += 'M' + (i * 2.6) + ' -4.2v8.4'; return '<g transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + (rot || 0) + ') scale(' + (s || 1) + ')"><path class="dk-ant" d="M7 -1.5l4 -3M7 1.5l4 3"/><ellipse class="dk-louse" cx="0" cy="0" rx="8" ry="4.8"/><path class="dk-seg" d="' + seg + '"/></g>'; }
    function beetle(x, y, dark, s, rot){ return '<g transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + Math.round(rot || 0) + ') scale(' + (s || 1) + ')"><ellipse class="' + (dark ? 'dk-black' : 'dk-brown') + '" cx="0" cy="0" rx="2.2" ry="3.4"/><circle class="' + (dark ? 'dk-black' : 'dk-brown') + '" cx="0" cy="-4" r="1.3"/></g>'; }
    function rabbit(x, y, padCls){
      return '<g transform="translate(' + n1(x) + ' ' + n1(y) + ')">' +
        '<path class="dk-darkfur" d="M-6 -30c-3 -10 -1 -20 3 -20c4 0 4 10 2 20zM2 -30c1 -10 5 -19 9 -18c3 2 0 11 -5 19z"/>' +
        '<ellipse class="dk-fur" cx="-2" cy="2" rx="26" ry="17"/><circle class="dk-darkfur" cx="24" cy="4" r="5"/>' +
        '<circle class="dk-fur" cx="-14" cy="-22" r="12"/><circle class="dk-darkfur" cx="-25" cy="-20" r="3.2"/><circle class="dk-eye" cx="-17" cy="-25" r="1.7"/>' +
        '<ellipse class="dk-darkfur" cx="-16" cy="18" rx="7" ry="3.5"/><ellipse class="dk-darkfur" cx="12" cy="18" rx="8" ry="3.5"/>' +
        '<rect class="dk-skin" x="-6" y="-14" width="16" height="9" rx="2"/><rect class="' + padCls + '" x="-8" y="-20" width="20" height="7" rx="2.5"/></g>';
    }
    function onion(x, top, liq, bot, w, nDots, seed){
      // a beaker of solution with an onion resting on its rim and roots dipping in
      var o = '<path class="dk-glass" d="M' + n1(x - w / 2) + ' ' + top + 'V' + bot + 'H' + n1(x + w / 2) + 'V' + top + '"/>';
      o = '<rect class="dk-sol" x="' + n1(x - w / 2 + 1.5) + '" y="' + liq + '" width="' + n1(w - 3) + '" height="' + n1(bot - liq - 1.5) + '"/>' + o;
      var roots = '';
      for(var i = -2; i <= 2; i++) roots += 'M' + n1(x + i * 3) + ' ' + (top - 2) + 'q' + n1(i * 1.5) + ' 18 ' + n1(i * 2.2) + ' ' + n1(liq - top + 22);
      return o + '<path class="dk-root" d="' + roots + '"/><path class="dk-onion" d="M' + n1(x - 14) + ' ' + (top - 6) + 'c0 -16 10 -22 14 -30c4 8 14 14 14 30c0 5 -6 7 -14 7s-14 -2 -14 -7z"/><path class="dk-onionl" d="M' + x + ' ' + (top - 36) + 'q-6 14 -5 27M' + x + ' ' + (top - 36) + 'q6 14 5 27"/>';
    }

    var SCENES = {
      'duckweed-nitrogen': function(D){
        var o = topRow([[3, function(x, y){ return I.cal(x, y, '14'); }, '14 days'], [2, function(x, y){ return I.lamp(x - 9, y) + I.thermo(x + 15, y); }, 'same light,\ntemperature'], [4, I.cyl, 'same volume\nof medium'], [1, I.balance, 'dry plants,\nmeasure protein']]);
        var w = Math.min(56, 360 / D.n * 0.78), lvl = '', liq = '', weed = '';
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k), lt = 138;
          liq += flaskLiq(x, lt, 202, w, 92);
          lvl += dots(x, 175, w * 0.6, 40, Math.round(Math.min(22, numOf(l) * 3)), 'dk-nitrate', 1.7, 3 + k);
          o += flask(x, 92, 202, w);
          weed += duckweed(x - 9, lt - 1) + duckweed(x + 9, lt - 1.5);
        });
        return o + part(4, liq) + part(0, lvl + levels(D, function(l){ return l + ' mM'; }, 'Nitrate in the medium (dots)')) + weed;
      },
      'fat-melting': function(D){
        var o = topRow([[2, function(x, y){ return chain(x - 14, y + 2, 0, 0.5); }, 'every tail\n18 carbons'], [3, I.heater, 'heats at\n2 °C per minute'], [4, I.balance, '5 mg\nsamples'], [1, I.thermo, 'record the\nmelting point']]);
        var kinks = '';
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k), nb = numOf(l);
          o += '<ellipse class="dk-pan" cx="' + n1(x) + '" cy="198" rx="26" ry="6"/><ellipse class="dk-fat" cx="' + n1(x) + '" cy="195" rx="15" ry="3.5"/>';
          kinks += chain(x - 6, 96, nb, 1);
          o += tx(x, 229, strip(D.rows[k][1]), 'dk-ts');
        });
        return o + part(0, kinks + levels(D, function(l){ return l + ' cis C=C'; }, 'Cis double bonds per tail (each one bends the tail)', 215, 246));
      },
      'paramecium-vacuole': function(D){
        var o = topRow([[2, I.clock, '15 min in the\nsolution first'], [3, I.thermo, 'slide\ntemperature'], [4, I.tally, '10 cells\nat each'], [1, I.watch, 'count emptyings\nin 1 minute']]), salt = '';
        var r = Math.min(30, 360 / D.n * 0.42);
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k);
          o += '<ellipse class="dk-dish" cx="' + n1(x) + '" cy="150" rx="' + n1(r + 4) + '" ry="' + n1(r + 4) + '"/><ellipse class="dk-water" cx="' + n1(x) + '" cy="150" rx="' + n1(r) + '" ry="' + n1(r) + '"/>';
          salt += dots(x, 150, r * 1.2, r * 1.2, Math.round(numOf(l) / 6), 'dk-salt', 1.6, 5 + k);
          o += paramecium(x, 150, r / 30);
        });
        return o + part(0, salt + levels(D, function(l){ return l + ' mM'; }, 'NaCl added to the pond water (dots)'));
      },
      'rbc-digoxin': function(D){
        var o = topRow([[2, I.thermo, 'same\ntemperature'], [3, function(x, y){ return I.bottle(x, y, 'K⁺'); }, 'K⁺ in the\nsolution'], [1, I.meter, 'measure\nK⁺ uptake']]), eth = '', dg = '';
        var w = Math.min(34, 360 / D.n * 0.4);
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k), cells = '';
          o += tube(x, 112, 204, w, 132, 'dk-saline');
          var rr = rnd(k + 3); for(var i = 0; i < 9; i++) cells += rbc(x - w / 2 + 6 + rr() * (w - 12), 145 + rr() * 50);
          o += cells;
          if(numOf(l) > 0){ eth += I.dropper(x + w / 2 + 10, 104) + tx(x + w / 2 + 10, 128, 'ethanol', 'dk-ts'); dg += dots(x, 166, w - 10, 50, Math.round(3 + Math.log10(numOf(l) * 100) * 3), 'dk-drug', 1.7, 9 + k); }
          else eth += tx(x + w / 2 + 10, 104, 'none', 'dk-ts');
        });
        return o + part(4, eth) + part(0, dg + levels(D, function(l){ return l + ' µM'; }, 'Digoxin (dots), dissolved in ethanol'));
      },
      'seed-respirometer': function(D){
        var o = topRow([[2, function(x, y){ return pea(x - 6, y + 2) + pea(x, y - 3) + pea(x + 6, y + 2) + pea(x, y + 6); }, '25 peas\nin each tube'], [3, function(x, y){ return '<ellipse class="dk-cotton" cx="' + x + '" cy="' + y + '" rx="12" ry="8"/>'; }, 'KOH cotton\n(absorbs CO₂)'], [4, I.clock, 'settle before\nreadings'], [1, function(x, y){ return I.ruler(x, y + 2) + '<circle class="dk-dye" cx="' + (x - 4) + '" cy="' + (y - 7) + '" r="3"/>'; }, 'drop moves:\nO₂ used']]);
        var bw = Math.min(100, 360 / D.n * 0.8), bath = '', drop = '';
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k), t = numOf(l);
          bath += '<rect class="dk-bath" x="' + n1(x - bw / 2) + '" y="120" width="' + n1(bw) + '" height="84" rx="6"/>' + I.thermo(x + bw / 2 - 12, 150);
          o += tube(x - 12, 96, 196, 22) + '<rect class="dk-metal" x="' + n1(x - 25) + '" y="92" width="26" height="6" rx="2"/>';
          var pp = ''; for(var i = 0; i < 9; i++) pp += pea(x - 18 + (i % 3) * 6, 188 - Math.floor(i / 3) * 5);
          o += pp + '<ellipse class="dk-cotton" cx="' + n1(x - 12) + '" cy="158" rx="9" ry="5"/>';
          o += '<path class="dk-pipe" d="M' + n1(x - 12) + ' 92V84H' + n1(x + bw / 2 - 4) + '"/>';
          drop += '<circle class="dk-dye" cx="' + n1(x - 4 + t * 1.2) + '" cy="84" r="3.2"/>';
        });
        return part(0, bath + levels(D, function(l){ return l + ' °C'; }, 'Water bath temperature')) + o + part(1, drop);
      },
      'elodea-light-color': function(D){
        var o = topRow([[2, I.meter, 'light meter:\nsame energy'], [3, function(x, y){ return I.bottle(x, y, 'HCO₃'); }, 'bicarbonate\n(CO₂ source)'], [4, I.thermo, 'water\ntemperature'], [1, I.tally, 'count O₂ bubbles\nper minute']]), filt = '', bub = '';
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k), c = /blue/i.test(l) ? 'dk-fblue' : /green/i.test(l) ? 'dk-fgreen' : /red/i.test(l) ? 'dk-fred' : 'dk-fgrey';
          o += I.lamp(x, 96);
          filt += '<rect class="' + c + '" x="' + n1(x - 20) + '" y="113" width="40" height="7" rx="2"/>' + '<path class="' + c + ' beam" d="M' + n1(x - 16) + ' 121L' + n1(x - 12) + ' 205H' + n1(x + 12) + 'L' + n1(x + 16) + ' 121Z"/>';
          o += '<circle class="dk-glass" cx="' + n1(x) + '" cy="137" r="11"/><path class="dk-water" d="M' + n1(x - 10) + ' 138a10 10 0 0 0 20 0z"/>';
          o += tube(x, 152, 206, 20, 158);
          o += '<path class="dk-stem" d="M' + n1(x) + ' 202V170M' + n1(x) + ' 194l-6 -3M' + n1(x) + ' 194l6 -3M' + n1(x) + ' 184l-6 -3M' + n1(x) + ' 184l6 -3M' + n1(x) + ' 176l-5 -3M' + n1(x) + ' 176l5 -3"/>';
          bub += '<circle class="dk-bub" cx="' + n1(x + 1) + '" cy="166" r="1.8"/><circle class="dk-bub" cx="' + n1(x - 1) + '" cy="161" r="1.5"/>';
        });
        return o + part(0, filt + levels(D, function(l){ return l; }, 'Color of the filter in front of the lamp')) + part(1, bub);
      },
      'quorum-signal': function(D){
        var o = topRow([[2, I.tally, 'same cells\nat the start'], [3, I.clock, 'time before\nmeasuring'], [4, I.thermo, 'same\ntemperature'], [1, I.meter, 'light per\ncell']]), cm = '';
        D.L = 64; var w = Math.min(58, 316 / D.n * 0.72);
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k, D.L), pct = numOf(l) / 100, lt = 136, h = 202 - 2 - lt, ct = 200 - h * pct;
          o += flaskLiq(x, lt, 202, w, 96, 'dk-broth') + flask(x, 96, 202, w) + dots(x, 182, w * 0.6, 26, 10, 'dk-bact', 1.4, 2 + k);
          if(pct > 0) cm += '<clipPath id="' + gid + 'cq' + k + '"><rect x="' + n1(x - w / 2) + '" y="' + n1(ct) + '" width="' + n1(w) + '" height="' + n1(202 - ct) + '"/></clipPath><g clip-path="url(#' + gid + 'cq' + k + ')">' + flaskLiq(x, lt, 202, w, 96, 'dk-cond') + '</g>';
        });
        cm += I.glow(28, 124) + tx(28, 152, 'cell-free', 'dk-ts') + tx(28, 163, 'medium', 'dk-ts') + tx(28, 174, 'from a dense,', 'dk-ts') + tx(28, 185, 'glowing', 'dk-ts') + tx(28, 196, 'culture', 'dk-ts');
        return o + part(0, cm + levels(D, function(l){ return l + '%'; }, 'Conditioned medium (shaded), % of the volume'));
      },
      'root-mitosis': function(D){
        var o = topRow([[4, I.clock, 'soak\n4 hours'], [2, function(x, y){ return '<path class="dk-root thick" d="M' + x + ' ' + (y - 14) + 'v24"/><rect class="dk-band" x="' + (x - 5) + '" y="' + (y + 2) + '" width="10" height="6" rx="2"/>'; }, 'just behind\nthe tip'], [3, I.tally, '500 cells\nper root tip'], [1, I.scope, '% in mitosis,\n% in metaphase']]), sol = '';
        var w = Math.min(54, 360 / D.n * 0.6);
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k);
          o += onion(x, 128, 150, 204, w);
          sol += dots(x, 178, w - 10, 44, Math.round(numOf(l) / 6), 'dk-drug', 1.7, 4 + k);
        });
        return o + part(0, sol + levels(D, function(l){ return l + ' µM'; }, 'Plant compound in the solution (dots)'));
      },
      'rabbit-fur-temperature': function(D){
        var o = topRow([[3, function(x, y){ return I.cal(x, y, '3 wk'); }, '3 weeks\nof regrowth'], [2, I.ruler, 'same patch\nsize'], [4, I.dna, 'all Himalayan\n(same genotype)'], [1, I.mag, '% of regrown\nhairs black']]), pads = '';
        var temps = D.lv.map(numOf), lo = Math.min.apply(null, temps), hi = Math.max.apply(null, temps);
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k), f = hi > lo ? (numOf(l) - lo) / (hi - lo) : 0.5, s = Math.min(1, 360 / D.n / 80);
          o += '<g transform="translate(' + n1(x) + ' 165) scale(' + n1(s) + ')">' + rabbit(0, 0, 'dk-none') + '</g>';
          pads += '<g transform="translate(' + n1(x) + ' 165) scale(' + n1(s) + ')"><rect class="dk-pad" style="fill:hsl(' + Math.round(215 - 215 * f) + ',75%,58%)" x="-8" y="-20" width="20" height="7" rx="2.5"/></g>';
          o += tx(x + 34 * s, 200, '× 6', 'dk-ts');
        });
        return o + part(0, pads + levels(D, function(l){ return l + ' °C'; }, 'Pad temperature on the shaved patch'));
      },
      'vestigial-temperature': function(D){
        var o = topRow([[2, function(x, y){ return I.dna(x, y) + tx(x + 20, y + 4, 'vg', 'dk-ic'); }, 'all vg/vg'], [3, I.female, '20 females\nfrom each'], [4, I.vial, 'same food'], [1, I.ruler, 'measure\nwing length']]), ther = '';
        var w = Math.min(70, 360 / D.n * 0.78);
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k);
          o += '<rect class="dk-incub" x="' + n1(x - w / 2) + '" y="96" width="' + n1(w) + '" height="110" rx="6"/><rect class="dk-glass" x="' + n1(x - w / 2 + 6) + '" y="104" width="' + n1(w - 12) + '" height="94" rx="3"/>';
          o += I.vial(x - 6, 172) + fly(x - 6, 152, 0.15, 1.2);
          ther += I.thermo(x + w / 2 - 14, 130);
        });
        return o + part(0, ther + levels(D, function(l){ return l + ' °C'; }, 'Incubator temperature while the flies develop'));
      },
      'antibiotic-step': function(D){
        var o = topRow([[2, I.dropper, 'same amount\nof label'], [3, I.clock, '10 minutes\nof labeling'], [4, I.tally, 'same cells\nat the start'], [1, I.counter, 'label built into\nRNA, protein']]), ab = '';
        var w = 20;
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k);
          [['U*', -16, 'RNA'], ['L*', 16, 'protein']].forEach(function(t){ o += tube(x + t[1], 112, 200, w, 128, 'dk-broth') + dots(x + t[1], 172, w - 8, 40, 9, 'dk-bact', 1.3, k * 3 + (t[1] > 0 ? 1 : 0)) + tx(x + t[1], 106, t[0], 'dk-ic big'); });
          ab += dots(x, 160, 56, 50, Math.round(Math.sqrt(numOf(l)) * 4), 'dk-drug', 1.5, 13 + k);
        });
        o += tx(200, 92, 'U* = labeled uridine (into RNA)   L* = labeled leucine (into protein)', 'dk-ts');
        return o + part(0, ab + levels(D, function(l){ return l + ' µg/mL'; }, 'Antibiotic (dots)'));
      },
      'enhancer-reporter': function(D){
        var o = topRow([[2, I.cells, 'liver cells'], [3, I.clock, '24 hours'], [1, I.meter, 'measure\nlight output']]), dna = '', luc = '';
        var X0 = 70, X1 = 290, sx = function(bp){ return X0 + (bp + 2000) / 2000 * (X1 - X0); };
        var cut = { A: null, B: [-2000, -1500], C: [-1500, -1000], D: [-2000, -200] };
        D.lv.forEach(function(l, k){
          var y = 100 + k * 27, c = cut[strip(l).trim()];
          var segs = c ? [[-2000, c[0]], [c[1], 0]] : [[-2000, 0]];
          segs.forEach(function(sg){ if(sg[1] > sg[0]) dna += '<rect class="dk-dnab" x="' + n1(sx(sg[0])) + '" y="' + (y - 4) + '" width="' + n1(sx(sg[1]) - sx(sg[0])) + '" height="8" rx="2"/>'; });
          if(c) dna += '<path class="dk-gap" d="M' + n1(sx(c[0]) + 2) + ' ' + y + 'H' + n1(sx(c[1]) - 2) + '"/>';
          dna += tx(52, y + 4, strip(l), 'dk-lv', 'end');
          luc += '<rect class="dk-luc" x="' + (X1 + 2) + '" y="' + (y - 6) + '" width="60" height="12" rx="3"/>' + tx(X1 + 32, y + 3.5, 'luciferase', 'dk-ic');
          o += '<path class="dk-arrow" d="M' + (X1 - 2) + ' ' + (y - 4) + 'v-6h8"/>';
        });
        [-2000, -1500, -1000, -200].forEach(function(bp){ o += '<path class="dk-tick" d="M' + n1(sx(bp)) + ' 188v8"/>' + tx(sx(bp), 206, bp === -200 ? '−200' : '−' + String(-bp).replace(/(\d)(\d{3})$/, '$1,$2'), 'dk-ts'); });
        o += tx(sx(0), 206, '0', 'dk-ts');
        return o + part(4, luc) + part(0, dna + tx(180, 224, 'Upstream DNA in each construct (bp from the gene; gaps are missing)', 'dk-ax'));
      },
      'desiccation-selection': function(D){
        var o = topRow([[2, function(x, y){ return I.cal(x, y, '30'); }, '30 generations\nof selection'], [3, function(x, y){ return I.drop(x - 8, y + 4, 5) + I.arrow(x + 6, y + 2); }, 'then 2 generations,\nall humid'], [4, I.vial, 'same food'], [1, I.watch, 'hours females\nlive in dry air']]), hum = '';
        var w = Math.min(38, 360 / D.n * 0.8);
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k), dry = /dry/i.test(l);
          o += '<rect class="dk-cage" x="' + n1(x - w / 2) + '" y="120" width="' + n1(w) + '" height="70" rx="4"/><path class="dk-mesh" d="M' + n1(x - w / 2 + 6) + ' 120v70M' + n1(x) + ' 120v70M' + n1(x + w / 2 - 6) + ' 120v70"/>' + fly(x - 6, 170, 1, 0.9) + fly(x + 6, 158, 1, 0.9);
          hum += dry ? I.sun(x, 104) : I.drop(x - 6, 106, 4.5) + I.drop(x + 6, 102, 4.5);
        });
        return o + part(0, hum + levels(D, null, 'Air during selection (sun = very dry, drops = humid)'));
      },
      'beetle-drift': function(D){
        var o = topRow([[2, I.split, 'start: B = 0.50\n(black, brown)'], [3, function(x, y){ return I.cal(x, y, '20'); }, '20 generations'], [4, I.jar, 'same jars\nand food'], [1, I.hist, 'spread of B\namong populations']]), pop = '';
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k), N = numOf(l), r = rnd(5 + k), b = '';
          o += '<rect class="dk-glass" x="' + n1(x - 60) + '" y="100" width="120" height="100" rx="10"/><rect class="dk-metal" x="' + n1(x - 63) + '" y="94" width="126" height="8" rx="2"/><rect class="dk-flour" x="' + n1(x - 58) + '" y="170" width="116" height="28" rx="6"/>';
          var cols = Math.ceil(Math.sqrt(N * 1.6)), rows2 = Math.ceil(N / cols), sp = Math.min(14, 104 / cols);
          for(var i = 0; i < N; i++){ var cx = x - (cols - 1) * sp / 2 + (i % cols) * sp + (r() - 0.5) * 2, cy = 136 - (rows2 - 1) * sp * 0.8 / 2 + Math.floor(i / cols) * sp * 0.8 + (r() - 0.5) * 2; b += beetle(cx, cy, i % 2 === 0, N > 30 ? 0.7 : 1.3, r() * 360); }
          pop += b;
          o += tx(x + 66, 196, '× 20', 'dk-ts', 'start');
        });
        return o + part(0, pop + levels(D, function(l){ return l + ' beetles'; }, 'Beetles in each population'));
      },
      'pond-phosphate': function(D){
        var o = topRow([[2, I.pond, 'water and algae\nfrom one pond'], [3, I.ruler, 'same tank\nsize'], [4, function(x, y){ return I.cal(x, y, '3 wk'); }, '3 weeks'], [1, function(x, y){ return I.moon(x - 10, y) + I.probe(x + 6, y - 2); }, 'dissolved O₂\nat dawn']]), ph = '';
        var w = Math.min(70, 360 / D.n * 0.8);
        o += I.sun(380, 92);
        D.lv.forEach(function(l, k){
          var x = gx(D.n, k);
          o += '<path class="dk-pondw" d="M' + n1(x - w / 2 + 2) + ' 146H' + n1(x + w / 2 - 2) + 'V196H' + n1(x - w / 2 + 2) + 'Z"/><path class="dk-tank" d="M' + n1(x - w / 2) + ' 126V198H' + n1(x + w / 2) + 'V126"/>' + dots(x, 172, w - 12, 40, 12, 'dk-algae', 1.6, 21 + k);
          var a = numOf(l);
          ph += I.bottle(x - w / 2 + 12, 112, 'P') + (a > 0 ? dots(x, 160, w - 16, 20, Math.round(a * 40), 'dk-phos', 1.7, 31 + k) : '');
          o += tx(x + w / 2 - 4, 120, '× 4', 'dk-ts', 'end');
        });
        return o + part(0, ph + levels(D, function(l){ return '+' + l + ' mg/L'; }, 'Phosphorus added to each tank (dots)'));
      },
      'woodlice-humidity': function(D){
        var o = topRow([[2, I.cover, 'covered: both\nsides equally dark'], [3, I.clock, '10 minutes'], [4, function(x, y){ return woodlouse(x, y, 0, 1.4); }, '10 woodlice\neach trial'], [1, I.tally, 'count on\neach side']]);
        var cx = 200, y0 = 104, h = 100, W = 300, side = '', bugs = '';
        side += '<rect class="dk-damp" x="' + (cx - W / 2) + '" y="' + y0 + '" width="' + (W / 2) + '" height="' + h + '" rx="12"/><rect class="dk-dry" x="' + cx + '" y="' + y0 + '" width="' + (W / 2) + '" height="' + h + '" rx="12"/>';
        side += I.drop(cx - 120, y0 + 26, 5) + I.drop(cx - 96, y0 + 72, 5) + I.drop(cx - 60, y0 + 36, 5) + I.drop(cx - 30, y0 + 82, 5);
        side += tx(cx - W / 4, y0 + h + 18, 'damp paper', 'dk-lv') + tx(cx + W / 4, y0 + h + 18, 'dry paper', 'dk-lv');
        for(var i = 0; i < 10; i++) bugs += woodlouse(cx + (i % 2 ? 7 : -7), y0 + 10 + i * 8.6, i % 2 ? 160 : 20, 0.8);
        o += '<path class="dk-mid" d="M' + cx + ' ' + (y0 + 4) + 'V' + (y0 + h - 4) + '"/>';
        return part(0, side + tx(200, 246, 'Moisture on each side; woodlice start on the center line', 'dk-ax')) + o + part(2, '<rect class="dk-lid" x="' + (cx - W / 2 - 4) + '" y="' + (y0 - 4) + '" width="' + (W + 8) + '" height="' + (h + 8) + '" rx="14"/>') + bugs;
      }
    };
    /* An 18-carbon fatty acid tail as a zigzag; each cis double bond is drawn double and bends the chain. */
    function chain(x, y, nDouble, s){
      var at = { 1: [9], 2: [9, 12], 3: [9, 12, 15] }[nDouble] || [], dir = s < 1 ? 0 : Math.PI / 2, px = x, py = y, d = '', dd = '', L = 6.2 * s;
      var pts = [[px, py]];
      for(var i = 1; i <= 17; i++){
        var zig = (i % 2 ? 1 : -1) * 0.55;
        if(s >= 1 && at.indexOf(i - 1) >= 0) dir -= 0.62;
        var a = dir + zig; px += Math.cos(a) * L; py += Math.sin(a) * L; pts.push([px, py]);
        if(s < 1 && i > 6) break;
      }
      pts.forEach(function(p, i){ d += (i ? 'L' : 'M') + n1(p[0]) + ' ' + n1(p[1]); });
      at.forEach(function(c){ if(s < 1) return; var p = pts[c - 1], q = pts[c]; if(!p || !q) return; var nx = -(q[1] - p[1]), ny = q[0] - p[0], m = Math.sqrt(nx * nx + ny * ny) || 1; dd += 'M' + n1(p[0] + nx / m * 3.2) + ' ' + n1(p[1] + ny / m * 3.2) + 'L' + n1(q[0] + nx / m * 3.2) + ' ' + n1(q[1] + ny / m * 3.2); });
      return '<path class="dk-chain" d="' + d + '"/>' + (dd ? '<path class="dk-chain dbl" d="' + dd + '"/>' : '') + '<circle class="dk-head" cx="' + n1(x) + '" cy="' + n1(y - 3) + '" r="' + (3.5 * s) + '"/>';
    }
    function fallbackScene(D){
      var w = Math.min(56, 360 / D.n * 0.78), o = '';
      D.lv.forEach(function(l, k){ var x = gx(D.n, k); o += flaskLiq(x, 140, 202, w, 92) + flask(x, 92, 202, w); });
      return o + part(0, levels(D));
    }
    /* The plain chart: one panel per measured column (or one grouped panel), bars from zero, ± error bars. */
    function chartSvg(D, js, grouped){
      var W = 320, L = 46, R = 10, PH = 120, panels = grouped ? [js] : js.map(function(j){ return [j]; }), out = '';
      panels.forEach(function(cols, pi){
        var keys = cols.map(function(j){ return strip(D.cols[j]); }), stack = cols.length > 1 && keys.join('   ').length > 44, TP = stack ? 18 + 13 * keys.length : 28;
        var gw0 = (W - L - R) / D.n, twoX = gw0 < 44 && D.lv.some(function(l){ return l.indexOf(' ') > 0; }), B = twoX ? 50 : 40;
        var H = TP + PH + B, vals = cols.map(function(j){ return D.rows.map(function(r){ return numOf(r[j]); }); }), errs = cols.map(function(j){ return D.rows.map(function(r){ return errOf(r[j]); }); });
        var lo = 0, hi = 0;
        vals.forEach(function(v, c){ v.forEach(function(x, k){ lo = Math.min(lo, x - errs[c][k]); hi = Math.max(hi, x + errs[c][k]); }); });
        // room for the value labels at both ends
        var span0 = (hi - lo) || 1; if(hi > 0) hi += span0 * 0.08; if(lo < 0) lo -= span0 * 0.14;
        var step = T.niceStep((hi - lo) || 1, 4), ylo = Math.floor(lo / step + 1e-9) * step, yhi = Math.ceil(hi / step - 1e-9) * step; if(yhi === ylo) yhi = ylo + step;
        var Y = function(v){ return TP + PH - (v - ylo) / (yhi - ylo) * PH; }, n = D.n, gw = (W - L - R) / n, bw = Math.min(30, gw * (cols.length > 1 ? 0.36 : 0.62));
        var o = '';
        for(var t = ylo; t <= yhi + 1e-9; t += step){ var tv = Math.round(t / step) * step; o += '<path class="dc-grid" d="M' + L + ' ' + n1(Y(tv)) + 'H' + (W - R) + '"/>' + tx(L - 6, Y(tv) + 4, fmtTick(tv, step), 'dc-tick', 'end'); }
        vals.forEach(function(v, c){
          v.forEach(function(x, k){
            var cx = L + gw * (k + 0.5) + (cols.length > 1 ? (c - (cols.length - 1) / 2) * (bw + 3) : 0), y0 = Y(0), y1 = Y(x), e = errs[c][k];
            o += '<rect class="dc-bar c' + (cols.length > 1 ? c : pi) + '" x="' + n1(cx - bw / 2) + '" y="' + n1(Math.min(y0, y1)) + '" width="' + n1(bw) + '" height="' + n1(Math.max(1, Math.abs(y1 - y0))) + '" rx="2"/>';
            if(e) o += '<path class="dc-err" d="M' + n1(cx) + ' ' + n1(Y(x - e)) + 'V' + n1(Y(x + e)) + 'M' + n1(cx - 4) + ' ' + n1(Y(x - e)) + 'h8M' + n1(cx - 4) + ' ' + n1(Y(x + e)) + 'h8"/>';
            if(n * cols.length <= 10) o += tx(cx, x >= 0 ? Y(x + e) - 4 : Y(x - e) + 12, strip(D.rows[k][cols[c]]).replace(/\s*±.*$/, '').replace(/^-/, '−'), 'dc-val');
          });
        });
        o += '<path class="dc-zero" d="M' + L + ' ' + n1(Y(0)) + 'H' + (W - R) + '"/><path class="dc-axis" d="M' + L + ' ' + TP + 'V' + (TP + PH) + '"/>';
        D.lv.forEach(function(l, k){ var x = L + gw * (k + 0.5), two = gw < 44 && l.indexOf(' ') > 0; o += two ? '<text class="dc-x' + (gw < 40 ? ' sm' : '') + '" x="' + n1(x) + '" y="' + (TP + PH + 15) + '" text-anchor="middle">' + esc(l.slice(0, l.indexOf(' '))) + '<tspan x="' + n1(x) + '" dy="11">' + esc(l.slice(l.indexOf(' ') + 1)) + '</tspan></text>' : tx(x, TP + PH + 15, l, 'dc-x'); });
        o += tx((L + W - R) / 2, H - 6, strip(D.cols[0]), 'dc-xt');
        var ttl = cols.length > 1 ? cols.map(function(j, c){ return '<tspan class="dc-key c' + c + '"' + (stack ? ' x="4" dy="' + (c ? 13 : 0) + '"' : '') + '>■</tspan> ' + esc(keys[c]); }).join(stack ? '' : '   ') : esc(keys[0]);
        o = '<text class="dc-title" x="4" y="14">' + ttl + '</text>' + o;
        var aria = 'Bar chart of ' + cols.map(function(j){ return strip(D.cols[j]); }).join(' and ') + ' for each ' + strip(D.cols[0]).toLowerCase() + ': ' + D.rows.map(function(r, k){ return D.lv[k] + ', ' + cols.map(function(j){ return strip(r[j]); }).join(' and '); }).join('; ') + '.';
        out += '<svg class="bio-svg dr-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(aria) + '">' + o + '</svg>';
      });
      return out;
    }
    function fmtTick(v, step){ var d = Math.min(3, (String(step).split('.')[1] || '').length); return (v < 0 ? '−' : '') + Math.abs(v).toFixed(d); }
    /* Which columns go in the chart, and grouped or not (columns sharing a unit share a panel). */
    var CHART = { 'antibiotic-step': { cols: [1, 2], grouped: true }, 'woodlice-humidity': { cols: [1, 2], grouped: true }, 'beetle-drift': { cols: [1, 2] } };
    function schematic(s){
      if(!s.data || !s.data.rows || !s.data.rows.length) return '';
      var rows = s.data.rows.filter(function(r){ return !/^total$/i.test(String(r[0]).trim()); }).slice(0, 8), cols = s.data.cols;
      var D = { rows: rows, cols: cols, n: rows.length, lv: rows.map(function(r){ return strip(r[0]).trim(); }) };
      var cfg = CHART[s.id] || {}, meas = cfg.cols || [];
      if(!meas.length) for(var j = 1; j < cols.length && meas.length < 2; j++) if(rows.every(function(r){ return isFinite(numOf(r[j])); })) meas.push(j);
      var draw = SCENES[s.id] || fallbackScene, H = 250;
      var opts = s.variables.options.map(strip);
      var aria = 'Sketch of the setup: ' + strip(s.title) + '. ' + D.n + ' groups by ' + strip(cols[0]) + ' (' + D.lv.join(', ') + '). Drawn parts: ' + opts.join('; ') + '.';
      var tags = '<div class="dr-vtags" role="group" aria-label="Parts of this setup"><p class="dr-vtags-h">Parts of this setup</p>' + s.variables.options.map(function(o, i){ return '<button type="button" class="dr-vtag" data-i="' + i + '"><span class="dr-vrole" aria-hidden="true"></span><span class="dr-vt">' + o + '</span></button>'; }).join('') + '</div>';
      return '<div class="dr-schem"><div class="dr-pics"><figure class="dr-scene"><svg class="bio-svg dr-sfig" viewBox="0 0 400 ' + H + '" role="img" aria-label="' + esc(aria) + '">' + draw(D) + '</svg></figure>' +
        (meas.length ? '<figure class="dr-charts">' + chartSvg(D, meas, !!cfg.grouped) + '</figure>' : '') + '</div>' + tags + '</div>';
    }
    /* The tags answer the variables drill: what they change (row 1), then what they measure (row 2). */
    function wireTags(){
      var box = host.querySelector('.dr-schem') || document.querySelector('.ls-root .dr-schem');
      var vsec = host.querySelector('.dr-sec[data-drill="variables"]') || document.querySelector('.dr-sec[data-drill="variables"]');
      if(!box) return;
      var tags = box.querySelectorAll('.dr-vtag'), parts = box.querySelectorAll('.dr-part');
      // a drawn part mirrors its tag: the same role classes, and hovering one lights the other
      function mirror(){ parts.forEach(function(g){ var t = box.querySelector('.dr-vtag[data-i="' + g.getAttribute('data-part') + '"]'); if(!t) return; ['is-iv', 'is-dv', 'is-kept', 'is-conf'].forEach(function(c){ g.classList.toggle(c, t.classList.contains(c)); }); g.classList.toggle('is-live', !t.disabled); }); }
      function hot(i, on){ box.querySelectorAll('.dr-part[data-part="' + i + '"], .dr-vtag[data-i="' + i + '"]').forEach(function(x){ x.classList.toggle('is-hot', on); }); }
      box.addEventListener('pointerover', function(e){ var x = e.target.closest('.dr-part, .dr-vtag'); if(x) hot(x.getAttribute('data-part') || x.getAttribute('data-i'), true); });
      box.addEventListener('pointerout', function(e){ var x = e.target.closest('.dr-part, .dr-vtag'); if(x) hot(x.getAttribute('data-part') || x.getAttribute('data-i'), false); });
      box.querySelector('.dr-sfig').addEventListener('click', function(e){ var g = e.target.closest('.dr-part'); if(!g) return; var t = box.querySelector('.dr-vtag[data-i="' + g.getAttribute('data-part') + '"]'); if(t && !t.disabled) t.click(); });
      if(!vsec){ tags.forEach(function(t){ t.disabled = true; }); mirror(); return; }
      var form = vsec.querySelector('form'), ROLE = ['changed', 'measured'];
      function sync(){
        var picks = [0, 1].map(function(i){ var c = form.querySelectorAll('fieldset')[i].querySelector('input:checked'); return c ? +c.value : -1; });
        var graded = !!form.querySelector('fieldset.is-right, fieldset.is-wrong');
        box.classList.toggle('is-graded', graded);
        tags.forEach(function(t){
          var i = +t.getAttribute('data-i'), role = picks[0] === i ? 0 : picks[1] === i ? 1 : -1, r = t.querySelector('.dr-vrole');
          t.classList.toggle('is-iv', role === 0); t.classList.toggle('is-dv', role === 1);
          r.textContent = role > -1 ? ROLE[role] : '';
          t.disabled = graded;
        });
        mirror();
        box.querySelector('.dr-vtags-h').textContent = graded ? 'Parts of this setup' : picks[0] < 0 ? 'Tap what the investigators change' : picks[1] < 0 ? 'Now tap what they measure' : 'Parts of this setup (Check under the drill)';
      }
      box.querySelector('.dr-vtags').addEventListener('click', function(e){
        var t = e.target.closest('.dr-vtag'); if(!t || t.disabled) return;
        var picks = [0, 1].map(function(i){ return form.querySelectorAll('fieldset')[i].querySelector('input:checked'); });
        var row = !picks[0] ? 0 : !picks[1] ? 1 : (+picks[0].value === +t.getAttribute('data-i') ? 0 : 1);
        choose(form, row, +t.getAttribute('data-i'));
      });
      form.addEventListener('change', sync);
      form.addEventListener('submit', function(){ setTimeout(function(){
        // after Check: every tag says its role (from the data, not the student's picks)
        var vars = currentScen.variables;
        // the other parts: kept the same, unless the scenario's own explanation (whyOptions) says
        // it is the sample size or is not kept the same (a possible confound)
        var wo = vars.whyOptions || {};
        tags.forEach(function(t){ var i = +t.getAttribute('data-i'), r = t.querySelector('.dr-vrole'), w = String(wo[i] || '');
          var role = i === vars.iv ? ['is-iv', 'independent'] : i === vars.dv ? ['is-dv', 'dependent'] : /^Not kept the same/.test(w) ? ['is-conf', 'not kept the same: possible confound'] : /sample size/.test(w) ? ['is-kept', 'sample size'] : ['is-kept', 'kept the same'];
          t.classList.remove('is-iv', 'is-dv'); t.classList.add(role[0]);
          r.textContent = role[1]; t.disabled = true; });
        box.querySelector('.dr-vtags-h').textContent = 'Parts of this setup';
        box.classList.add('is-graded');
        mirror();
      }, 0); });
      sync();
    }
    var currentScen = null;
    var WRITE_TITLE = { cer: 'Write it yourself: claim, evidence and reasoning', predict: 'Write it yourself: prediction and mechanism' };
    var TAGS = ['Claim', 'Evidence', 'Reasoning'], TAG_ID = ['claim', 'evidence', 'reasoning'], TAG_PRACTICE = { claim: '6.A', evidence: '6.B', reasoning: '6.C' };
    function draw(id, focus){
      var s = scen.filter(function(x){ return x.id === id; })[0];
      currentScen = s;
      host.innerHTML = '<h2 id="' + gid + '-sh" tabindex="-1">' + esc(s.title) + '</h2>' + schematic(s) + '<div class="bt-context">' + s.setup + '</div>' +
        (s.data ? T.dataTable(s.data.cols, s.data.rows, s.data.caption) : '');
      drills.forEach(function(d){
        if(only && only !== d.id) return;
        if(d.id === 'variables') section(s, d, 'Name the variables', [
          { key: 'iv', legend: 'Independent variable: what the investigators change on purpose', options: s.variables.options, correct: s.variables.iv, why: whyVar(s, 'iv'), practice: '3.C' },
          { key: 'dv', legend: 'Dependent variable: what they measure in response', options: s.variables.options, correct: s.variables.dv, why: whyVar(s, 'dv'), practice: '3.C' }],
          { lead: '<p class="bt-small dr-taplead">Tap a part in the picture, or pick below.</p>' }).setAttribute('data-drill', 'variables');
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
      wireTags();
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
    CTX = ctx;
    EXP = explore(app, data, ctx);
  }, { studio: { kit2: function(ctx){ return kit2(ctx); } } });

  /* ================================================================ EXPLORE: the plant bench (tools v2)
     Two groups of potted bean plants on one bench, three weeks after the start. Left the control group, right the
     test group; each under the same grow light, with its water jug, its plant food bottle and its heat mat.
     Tab "Fair test": the three things the test group gets are tappable on its side (one tap: same as the control,
     or different). Every thing that differs gets an amber ring on both sides; the plants grow or shrink to the new
     result; the mean of each group (a line across it) and the difference (the bracket) are read from the plants
     as drawn, every frame. Tab "Sample size": a fair test of plant food only, with plants that vary by chance;
     one knob sets the plants per group, each group gets its ±2 SE error bar, and "New plants" grows a new batch.
     The cause line (K.cause) names what differs, the result and whether the difference can be credited; its
     result words are set only once the plants have settled. Every effect size is invented (stated in "?"). */
  // every single effect clears ±2 SE at 6 plants a group with spread SD 3 (2.45 cm a side, 4.9 in all) by at least 1 cm,
  // so a Fair test credit never contradicts the Sample size rule
  var EXM = { base: 18, food: 6, water: -7, warm: 6, sd: 3, max: 12, n1: 6, nStart: 3, seed: 1254130, lo: 3, hi: 37 };
  var ITEMS = [
    { id: 'water', name: 'water', same: 'Same water', diff: 'Less water' },
    { id: 'food', name: 'plant food', same: 'No plant food', diff: 'Plant food' },
    { id: 'warm', name: 'warmth', same: 'Same warmth', diff: 'Warmer' }];
  var MINUS = '−';
  function explore(app, data, ctx, drillsGo){
    var K = window.LevlKit2, M = window.ApBioMath, esc = T.esc;
    var St = { tab: 'fair', cond: { water: false, food: true, warm: false }, n: EXM.nStart, batch: 0, mode: 'explore' };
    function calm(){ return K.reduced() || !window.requestAnimationFrame; }
    function n1(v){ return Math.round(v * 10) / 10; }
    function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

    /* ---- the plants' chance variation */
    var DEV1 = (function(){
      // tab 1: six per group, centred so each group's mean is exactly the model's, spread SD 3 cm
      var r = M.rng(5), out = [[], []];
      out.forEach(function(a){ for(var i = 0; i < EXM.n1; i++) a.push(r.normal(0, 1)); var m = a.reduce(function(x, y){ return x + y; }, 0) / a.length;
        for(i = 0; i < a.length; i++) a[i] -= m; var sd = Math.sqrt(a.reduce(function(x, y){ return x + y * y; }, 0) / (a.length - 1)); for(i = 0; i < a.length; i++) a[i] *= EXM.sd / sd; });
      return out;
    })();
    function batchDev(b){ var r = M.rng(EXM.seed + b * 1013), c = [], t = []; for(var i = 0; i < EXM.max; i++){ c.push(r.normal(0, EXM.sd)); t.push(r.normal(0, EXM.sd)); } return [c, t]; }
    var DEV2 = batchDev(0);
    function clampH(h){ return Math.max(EXM.lo, Math.min(EXM.hi, h)); }
    function cond(){ return St.tab === 'fair' ? St.cond : { water: false, food: true, warm: false }; }
    function target(g, i){
      var c = cond(), dev = St.tab === 'fair' ? DEV1[g][i] : DEV2[g][i];
      var h = EXM.base + dev;
      if(g === 1) h += (c.food ? EXM.food : 0) + (c.water ? EXM.water : 0) + (c.warm ? EXM.warm : 0);
      return clampH(h);
    }
    function count(){ return St.tab === 'fair' ? EXM.n1 : St.n; }
    function differs(){ var c = cond(); return [ITEMS[1], ITEMS[0], ITEMS[2]].filter(function(it){ return c[it.id]; }); }

    /* ---- the stage */
    var stage = document.createElement('div'); stage.className = 'dd2';
    var tabs = K.tabs({ label: 'Idea', big: true, items: [{ value: 'fair', label: 'Fair test' }, { value: 'n', label: 'Sample size' }], value: 'fair', onChange: function(v){ setTab(v, true); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: '', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var sceneBox = document.createElement('div'); sceneBox.className = 'dd2-scene'; sceneBox.id = T.nid('dd2');
    // three layers, so a frame of growing plants repaints only the middle one: the room and bench (still), the plants
    // and their numbers (every frame while they change), the trays, things and words in front (on a tap)
    sceneBox.innerHTML = '<svg class="dd2-svg dd2-svg-b" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="dd2-back"></g><g class="dd2-mats"></g></svg>' +
      '<svg class="dd2-svg dd2-svg-m" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="dd2-plants"><g data-g="0"></g><g data-g="1"></g></g><g class="dd2-over"></g></svg>' +
      '<svg class="dd2-svg dd2-svg-f" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="dd2-fronts"></g><g class="dd2-items"></g><g class="dd2-labs"></g></svg>';
    stage.appendChild(sceneBox);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
    var svgs = sceneBox.querySelectorAll('svg'), svg = svgs[1], q1 = function(c){ return sceneBox.querySelector(c); };
    var gBack = q1('.dd2-back'), gMats = q1('.dd2-mats'), gPl = [q1('.dd2-plants [data-g="0"]'), q1('.dd2-plants [data-g="1"]')];
    var gFront = q1('.dd2-fronts'), gItems = q1('.dd2-items'), gOver = q1('.dd2-over'), gLabs = q1('.dd2-labs');
    var layer = K.layer(sceneBox), G = null;
    var lines = document.createElement('div'); lines.className = 'dd2-lines';
    var cause = K.cause({ label: 'Why' });
    var acts = document.createElement('div'); acts.className = 'dd2-acts';
    acts.innerHTML = '<button type="button" class="tk2-btn dd2-new">New plants</button><button type="button" class="tk2-link dd2-reset">Start over</button>';
    var bNew = acts.querySelector('.dd2-new'), bReset = acts.querySelector('.dd2-reset');
    lines.appendChild(cause.el); lines.appendChild(acts);
    stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite');
    stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* ---- text sizes from measured text */
    var mctx = document.createElement('canvas').getContext('2d'), FAM = 'sans-serif';
    var twC = {};
    function tw(t, size, wt){ var key = t + '|' + size + '|' + (wt || 800) + '|' + FAM; if(twC[key] == null){ mctx.font = (wt || 800) + ' ' + size + 'px ' + FAM; twC[key] = mctx.measureText(t).width; } return twC[key]; }
    /* A label in a slot of width w: one line, else two (split at a space), else a smaller font; never inside a word. */
    function fit(t, w, size){
      var s = size, lines1 = [t];
      if(tw(t, s) > w && t.indexOf(' ') > 0){
        var best = null; t.split(' ').forEach(function(_, i, a){ if(!i) return; var l = [a.slice(0, i).join(' '), a.slice(i).join(' ')], m = Math.max(tw(l[0], s), tw(l[1], s)); if(!best || m < best.m) best = { l: l, m: m }; });
        lines1 = best.l;
      }
      var widest = Math.max.apply(null, lines1.map(function(l){ return tw(l, s); }));
      if(widest > w) s = Math.max(9.5, s * w / widest);
      return { lines: lines1, size: n1(s), w: Math.max.apply(null, lines1.map(function(l){ return tw(l, s); })) };
    }

    /* ---- layout (pixels: the svg's viewBox is the box's own size) */
    function layout(){
      var W = sceneBox.clientWidth, H = sceneBox.clientHeight;
      if(!W || !H) return null;
      var phone = W < 600, m = phone ? 8 : Math.max(20, W * 0.03), gap = phone ? 56 : Math.max(76, Math.min(150, W * 0.09));
      var gw = Math.min((W - 2 * m - gap) / 2, 520), cx = W / 2;
      var frontH = St.tab === 'n' ? (phone ? 124 : 130) : (phone ? 52 : 58), itemsH = phone ? 54 : 74, matH = 7;
      var yFront = H - frontH, yBack = yFront - itemsH, yTray = yBack + 12;
      var ruler = phone ? 15 : 19, bar = St.tab === 'n' ? (phone ? 16 : 22) : 6;
      var g = [0, 1].map(function(k){
        var x0 = k ? cx + gap / 2 : cx - gap / 2 - gw, x1 = x0 + gw;
        // the ruler on the outer side, the error bar on the inner side
        var a = k ? x0 + bar : x0 + ruler + 8, b = k ? x1 - ruler - 8 : x1 - bar;
        return { x0: x0, x1: x1, a: a, b: b, ruler: k ? x1 - ruler : x0, cxp: (a + b) / 2, err: k ? x0 + bar / 2 : x1 - bar / 2 };
      });
      var n = count(), slot = (g[0].b - g[0].a) / n, pw = Math.max(9, Math.min(phone ? 30 : 44, slot * 0.7));
      var potH = Math.max(12, Math.min(28, Math.min(phone ? 30 : 44, (g[0].b - g[0].a) / EXM.n1 * 0.7) * 0.9));   // one pot height whatever the count, so the bench never moves
      var ySoil = yTray - 3 - potH, yTop = phone ? 56 : 64;
      var k = (ySoil - yTop) / (EXM.hi - 1);
      var leaf = Math.max(7, Math.min(phone ? 14 : 26, slot * 0.5));
      return { W: W, H: H, phone: phone, m: m, gap: gap, gw: gw, cx: cx, frontH: frontH, yFront: yFront, yBack: yBack, yTray: yTray, matH: matH,
        g: g, n: n, slot: slot, pw: pw, potH: potH, ySoil: ySoil, yTop: yTop, k: k, leaf: leaf, ruler: ruler };
    }
    function px(g, i, n){ var G0 = G.g[g], s = (G0.b - G0.a) / n; return G0.a + s * (i + 0.5); }
    function yOf(h){ return G.ySoil - h * G.k; }

    /* ---- the still parts: room, lamps, rulers, bench, trays, items */
    function itemX(g, j){ var G0 = G.g[g], w = G0.x1 - G0.x0; return G0.x0 + w * (j + 0.5) / 3; }
    function backSvg(){
      var W = G.W, H = G.H, h = [];
      h.push('<defs><linearGradient id="dd2g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="dd2s-w0"/><stop offset="1" class="dd2s-w1"/></linearGradient>' +
        '<linearGradient id="dd2g-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="dd2s-c0"/><stop offset="1" class="dd2s-c1"/></linearGradient>' +
        '<linearGradient id="dd2g-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="dd2s-t0"/><stop offset="1" class="dd2s-t1"/></linearGradient>' +
        '<linearGradient id="dd2g-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="dd2s-f0"/><stop offset="1" class="dd2s-f1"/></linearGradient>' +
        '<linearGradient id="dd2g-pot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="dd2s-p0"/><stop offset=".55" class="dd2s-p1"/><stop offset="1" class="dd2s-p2"/></linearGradient>' +
        '<linearGradient id="dd2g-warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="dd2s-h0"/><stop offset="1" class="dd2s-h1"/></linearGradient></defs>');
      h.push('<rect class="dd2-wall" x="0" y="0" width="' + W + '" height="' + n1(G.yBack + 2) + '"/>');
      // tiles on the wall, faint
      var tile = G.phone ? 34 : 46, d = '';
      for(var y = tile; y < G.yBack; y += tile) d += 'M0 ' + n1(y) + 'H' + W;
      for(var r = 0, yy = 0; yy < G.yBack; r++, yy += tile) for(var x = (r % 2 ? tile / 2 : 0); x < W; x += tile) d += 'M' + n1(x) + ' ' + n1(yy) + 'V' + n1(Math.min(G.yBack, yy + tile));
      h.push('<path class="dd2-tile" d="' + d + '"/>');
      G.g.forEach(function(g, k){
        var a = g.a - 4, b = g.b + 4, ly = G.phone ? 10 : 12;
        // the grow light's cone over the plants, then the light itself on two cables
        h.push('<path class="dd2-cone" d="M' + n1(a + 8) + ' ' + (ly + 9) + 'L' + n1(b - 8) + ' ' + (ly + 9) + 'L' + n1(b + 10) + ' ' + n1(G.yTray) + 'L' + n1(a - 10) + ' ' + n1(G.yTray) + 'Z"/>');
        h.push('<path class="dd2-cable" d="M' + n1(a + 14) + ' 0V' + ly + 'M' + n1(b - 14) + ' 0V' + ly + '"/>');
        h.push('<rect class="dd2-lamp" x="' + n1(a) + '" y="' + ly + '" width="' + n1(b - a) + '" height="9" rx="4"/><rect class="dd2-lampl" x="' + n1(a + 5) + '" y="' + (ly + 6) + '" width="' + n1(b - a - 10) + '" height="3" rx="1.5"/>');
        // the ruler on the outer side
        var rx = g.ruler, rw = G.ruler, top = yOf(EXM.hi - 1) - 4, rt = '';
        h.push('<rect class="dd2-ruler" x="' + n1(rx) + '" y="' + n1(top) + '" width="' + rw + '" height="' + n1(G.ySoil + 4 - top) + '" rx="2"/>');
        for(var c = 0; c <= EXM.hi - 1; c++){ var yy2 = yOf(c), len = c % 10 === 0 ? rw * 0.55 : c % 5 === 0 ? rw * 0.4 : rw * 0.22; rt += k ? 'M' + n1(rx) + ' ' + n1(yy2) + 'h' + n1(len) : 'M' + n1(rx + rw) + ' ' + n1(yy2) + 'h' + n1(-len); }
        h.push('<path class="dd2-tick" d="' + rt + '"/>');
        [10, 20, 30].forEach(function(c){ h.push('<text class="dd2-rn" data-lab="ruler" x="' + n1(k ? rx + rw - 2 : rx + 2) + '" y="' + n1(yOf(c) + 3.6) + '" text-anchor="' + (k ? 'end' : 'start') + '">' + c + '</text>'); });
      });
      // the bench: its top (seen a little from above) and its front face
      h.push('<path class="dd2-btop" d="M0 ' + n1(G.yBack) + 'H' + W + 'V' + n1(G.yFront) + 'H0Z"/><rect class="dd2-bedge" x="0" y="' + n1(G.yFront) + '" width="' + W + '" height="7"/>');
      h.push('<rect class="dd2-bface" x="0" y="' + n1(G.yFront + 7) + '" width="' + W + '" height="' + n1(H - G.yFront - 7) + '"/>');
      var grain = ''; for(var i = 1; i < 4; i++) grain += 'M0 ' + n1(G.yBack + (G.yFront - G.yBack) * i / 4) + 'C' + n1(W * 0.3) + ' ' + n1(G.yBack + (G.yFront - G.yBack) * i / 4 - 2) + ' ' + n1(W * 0.6) + ' ' + n1(G.yBack + (G.yFront - G.yBack) * i / 4 + 2) + ' ' + W + ' ' + n1(G.yBack + (G.yFront - G.yBack) * i / 4);
      h.push('<path class="dd2-grain" d="' + grain + '"/>');
      return h.join('');
    }
    function matSvg(){
      return G.g.map(function(g, k){
        // the mat sticks out past the tray at both ends, so its glow and its heat show beside the tray
        var a = g.a - 22, b = g.b + 22, y = G.yTray - 1, h = G.matH + 2;
        return '<g class="dd2-mat" data-g="' + k + '"><rect class="dd2-mat-b" x="' + n1(a) + '" y="' + n1(y) + '" width="' + n1(b - a) + '" height="' + h + '" rx="3"/><rect class="dd2-mat-h" x="' + n1(a) + '" y="' + n1(y) + '" width="' + n1(b - a) + '" height="' + h + '" rx="3"/>' +
          '<path class="dd2-wave" d="' + [a + 5, a + 11, b - 11, b - 5].map(function(x){ return 'M' + n1(x) + ' ' + n1(y - 2) + 'q-3 -5 0 -10t0 -10'; }).join('') + '"/></g>';
      }).join('');
    }
    function frontSvg(){
      return G.g.map(function(g){
        var a = g.a - 6, b = g.b + 6, top = G.ySoil + G.potH * 0.5;
        return '<rect class="dd2-tray" x="' + n1(a) + '" y="' + n1(top) + '" width="' + n1(b - a) + '" height="' + n1(G.yTray - top) + '" rx="3"/><rect class="dd2-trayl" x="' + n1(a + 2) + '" y="' + n1(top + 1.5) + '" width="' + n1(b - a - 4) + '" height="2" rx="1"/>';
      }).join('');
    }
    /* Each item at (x, base y): a jug of water, a plant food bottle, the heat mat's switch box. */
    function itemSvg(id, x, y, s){
      var o = '';
      if(id === 'water'){
        var w = 20 * s, hh = 28 * s;
        o += '<g class="dd2-jug"><path class="dd2-glass" d="M' + n1(x - w / 2) + ' ' + n1(y - hh) + 'h' + n1(w) + 'l-' + n1(1.5 * s) + ' ' + n1(hh) + 'h-' + n1(w - 3 * s) + 'z"/>' +
          '<rect class="dd2-water" x="' + n1(x - w / 2 + 2.4 * s) + '" y="' + n1(y - hh + 4 * s) + '" width="' + n1(w - 4.8 * s) + '" height="' + n1(hh - 5.5 * s) + '"/>' +
          '<path class="dd2-handle" d="M' + n1(x + w / 2 - 1) + ' ' + n1(y - hh + 5 * s) + 'c' + n1(8 * s) + ' 0 ' + n1(8 * s) + ' ' + n1(12 * s) + ' 0 ' + n1(13 * s) + '"/>' +
          '<path class="dd2-grad" d="M' + n1(x - w / 2 + 2) + ' ' + n1(y - hh * 0.75) + 'h' + n1(4 * s) + 'M' + n1(x - w / 2 + 2) + ' ' + n1(y - hh * 0.5) + 'h' + n1(4 * s) + 'M' + n1(x - w / 2 + 2) + ' ' + n1(y - hh * 0.25) + 'h' + n1(4 * s) + '"/></g>';
      } else if(id === 'food'){
        var bw = 15 * s, bh = 30 * s;
        o += '<g class="dd2-bottle"><path class="dd2-glass" d="M' + n1(x - 3 * s) + ' ' + n1(y - bh) + 'h' + n1(6 * s) + 'v' + n1(6 * s) + 'l' + n1(bw / 2 - 3 * s) + ' ' + n1(5 * s) + 'v' + n1(bh - 11 * s) + 'h-' + n1(bw) + 'v-' + n1(bh - 11 * s) + 'l' + n1(bw / 2 - 3 * s) + ' -' + n1(5 * s) + 'z"/>' +
          '<rect class="dd2-food" x="' + n1(x - bw / 2 + 1.5) + '" y="' + n1(y - bh + 12 * s) + '" width="' + n1(bw - 3) + '" height="' + n1(bh - 13.5 * s) + '"/>' +
          '<rect class="dd2-cap" x="' + n1(x - 3.6 * s) + '" y="' + n1(y - bh - 4 * s) + '" width="' + n1(7.2 * s) + '" height="' + n1(4.5 * s) + '" rx="1"/>' +
          '<path class="dd2-flabel" d="M' + n1(x) + ' ' + n1(y - 6 * s) + 'c' + n1(-5 * s) + ' ' + n1(-2 * s) + ' ' + n1(-5 * s) + ' ' + n1(-8 * s) + ' 0 ' + n1(-10 * s) + 'c' + n1(5 * s) + ' ' + n1(2 * s) + ' ' + n1(5 * s) + ' ' + n1(8 * s) + ' 0 ' + n1(10 * s) + 'z"/></g>';
      } else {
        var tw2 = 26 * s, th = 18 * s;
        o += '<g class="dd2-ctl"><path class="dd2-cord" d="M' + n1(x) + ' ' + n1(y - th) + 'C' + n1(x) + ' ' + n1(y - th - 10 * s) + ' ' + n1(x - 8 * s) + ' ' + n1(y - th - 6 * s) + ' ' + n1(x - 6 * s) + ' ' + n1(y - th - 16 * s) + '"/>' +
          '<rect class="dd2-box" x="' + n1(x - tw2 / 2) + '" y="' + n1(y - th) + '" width="' + n1(tw2) + '" height="' + n1(th) + '" rx="' + n1(3 * s) + '"/>' +
          '<circle class="dd2-knob" cx="' + n1(x - 4 * s) + '" cy="' + n1(y - th / 2) + '" r="' + n1(5 * s) + '"/><path class="dd2-knobm" d="M' + n1(x - 4 * s) + ' ' + n1(y - th / 2) + 'l' + n1(2.6 * s) + ' -' + n1(3.4 * s) + '"/>' +
          '<circle class="dd2-led" cx="' + n1(x + 7 * s) + '" cy="' + n1(y - th / 2) + '" r="' + n1(2.8 * s) + '"/></g>';
      }
      return o;
    }
    var tapB = [], ringEl = [], labEl = [];
    function itemsSvg(){
      var s = G.phone ? 1.05 : 1.5, yb = G.yFront - 4, o = '';
      G.g.forEach(function(g, k){
        ITEMS.forEach(function(it, j){
          var x = itemX(k, j), rw = Math.min((g.x1 - g.x0) / 3 - 6, 44 * s), rt = yb - 37 * s;
          o += '<g class="dd2-item" data-g="' + k + '" data-id="' + it.id + '"><rect class="dd2-ring" x="' + n1(x - rw / 2) + '" y="' + n1(rt) + '" width="' + n1(rw) + '" height="' + n1(yb - rt + 3) + '" rx="8"/>' + itemSvg(it.id, x, yb, s) + '</g>';
        });
      });
      return o;
    }
    function labsSvg(){
      var o = '', size = G.phone ? 12.5 : 14;
      G.g.forEach(function(g, k){
        var t = k ? 'Test group' : 'Control group', sz = G.phone ? 13 : 15; sz = n1(Math.min(sz, sz * (g.b - g.a - 4) / tw(t, sz)));
        o += '<text class="dd2-gname" data-lab="name" x="' + n1(g.cxp) + '" y="' + (G.phone ? 40 : 46) + '" text-anchor="middle" style="font-size:' + sz + 'px">' + esc(t) + '</text>';
      });
      // the test side's item labels, under each item on the bench's front face (filled in paintItems)
      ITEMS.forEach(function(it, j){ o += '<text class="dd2-ilab" data-lab="item" data-id="' + it.id + '" x="' + n1(itemX(1, j)) + '" y="' + n1(G.yFront + (G.phone ? 22 : 25)) + '" text-anchor="middle"></text>'; });
      return o;
    }
    function paintItems(){
      if(!G) return;
      var c = cond(), slotW = (G.g[1].x1 - G.g[1].x0) / 3 - 8, size = G.phone ? 12.5 : 14;
      gItems.querySelectorAll('.dd2-item').forEach(function(e){
        var k = +e.getAttribute('data-g'), id = e.getAttribute('data-id'), on = k === 1 && c[id];
        e.classList.toggle('is-diff', !!c[id]);
        e.classList.toggle('is-on', !!on);   // the test side when it differs: less water, plant food in the bottle, the mat on
      });
      sceneBox.setAttribute('data-dry', c.water ? '1' : '0');
      gMats.querySelectorAll('.dd2-mat').forEach(function(e){ e.classList.toggle('is-on', +e.getAttribute('data-g') === 1 && c.warm); });
      gLabs.querySelectorAll('.dd2-ilab').forEach(function(t){
        var id = t.getAttribute('data-id'), it = ITEMS.filter(function(x){ return x.id === id; })[0], show = St.tab === 'fair' || id === 'food';
        var f = fit(c[id] ? it.diff : it.same, slotW, size);
        t.style.fontSize = f.size + 'px'; t.classList.toggle('is-diff', !!c[id]); t.setAttribute('visibility', show ? 'visible' : 'hidden');
        var x = t.getAttribute('x');
        t.innerHTML = f.lines.map(function(l, i){ return '<tspan x="' + x + '"' + (i ? ' dy="' + n1(f.size * 1.12) + '"' : '') + '>' + esc(l) + '</tspan>'; }).join('');
      });
      tapB.forEach(function(b, j){ var it = ITEMS[j]; b.pressed(!!St.cond[it.id]); b.el.setAttribute('aria-label', 'Test group: ' + (St.cond[it.id] ? it.diff : it.same) + '. Press for ' + (St.cond[it.id] ? it.same.toLowerCase() : it.diff.toLowerCase()) + '.'); b.el.hidden = St.tab !== 'fair' || St.mode !== 'explore'; });
    }

    /* ---- the plants: one group element each, its stem and leaves set every frame */
    var P = [[], []];   // per group: { i, dev, h, x, op, dry, from, to, t0, dur, el, stem, node, top, gone }
    var LEAF = '<path class="dd2-lf" d="M0 0C.22-.46.86-.5 1 0C.86.5.22.46 0 0Z"/><path class="dd2-rib" d="M.05 0L.88 0"/>';
    function potSvg(){
      var w = G.pw, h = G.potH, b = w * 0.74;
      return '<path class="dd2-pot" d="M' + n1(-w / 2) + ' 0L' + n1(w / 2) + ' 0L' + n1(b / 2) + ' ' + n1(h) + 'L' + n1(-b / 2) + ' ' + n1(h) + 'Z"/><rect class="dd2-rim" x="' + n1(-w / 2 - 1) + '" y="-1" width="' + n1(w + 2) + '" height="' + n1(Math.max(3, h * 0.2)) + '" rx="1.2"/><ellipse class="dd2-soil" cx="0" cy="0.5" rx="' + n1(w / 2 - 1) + '" ry="' + n1(Math.max(1.4, w * 0.09)) + '"/>';
    }
    function plantEl(p){
      p._pot = G.pw + ',' + G.potH;
      var e = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      e.setAttribute('class', 'dd2-pl');
      e.innerHTML = '<g class="dd2-potg">' + potSvg() + '</g><path class="dd2-stem"/><g class="dd2-node"><g class="dd2-l1">' + LEAF + '</g><g class="dd2-l2">' + LEAF + '</g></g><g class="dd2-node2"><g class="dd2-l3">' + LEAF + '</g><g class="dd2-l4">' + LEAF + '</g></g><g class="dd2-top"><g class="dd2-t1">' + LEAF + '</g><g class="dd2-t2">' + LEAF + '</g><g class="dd2-t3">' + LEAF + '</g></g>';
      p.el = e; p.stem = e.querySelector('.dd2-stem'); p.node = e.querySelector('.dd2-node'); p.node2 = e.querySelector('.dd2-node2'); p.top = e.querySelector('.dd2-top');
      p.ls = ['.dd2-l1', '.dd2-l2', '.dd2-t1', '.dd2-t2', '.dd2-t3', '.dd2-l3', '.dd2-l4'].map(function(s){ return e.querySelector(s); });
      p.sway = (((p.i * 37 + p.g * 11) % 7) - 3) * 0.9;
      return e;
    }
    function paintPlant(p){
      var h = p.h, hp = Math.max(0, h * G.k), grow = Math.max(0, Math.min(1, h / 9)), L = G.leaf * (0.35 + 0.65 * grow), dr = p.dry, sw = p.sway * Math.min(1, hp / 60);
      p.el.setAttribute('transform', 'translate(' + n1(p.x) + ' ' + n1(G.ySoil) + ')');
      var op = p.op < 0.999 ? String(n1(p.op * 100) / 100) : '';
      if(p._op !== op){ p._op = op; p.el.style.opacity = op; }
      if(hp < 0.5){ p.stem.setAttribute('d', ''); p.node.setAttribute('visibility', 'hidden'); p.node2.setAttribute('visibility', 'hidden'); p.top.setAttribute('visibility', 'hidden'); return; }
      p.node.setAttribute('visibility', h > 2.5 ? 'visible' : 'hidden'); p.node2.setAttribute('visibility', h > 6 ? 'visible' : 'hidden'); p.top.setAttribute('visibility', 'visible');
      p.stem.setAttribute('d', 'M0 0Q' + n1(sw * 0.6) + ' ' + n1(-hp * 0.5) + ' ' + n1(sw) + ' ' + n1(-hp));
      var swd = String(n1(Math.max(1.6, Math.min(3.8, G.slot * 0.075)) * (0.6 + 0.4 * grow)));
      if(p._sw !== swd){ p._sw = swd; p.stem.setAttribute('stroke-width', swd); }
      // the stem's x at a fraction f of its height (the quadratic above)
      function sx(f){ return 2 * (1 - f) * f * sw * 0.6 + f * f * sw; }
      p.node.setAttribute('transform', 'translate(' + n1(sx(0.36)) + ' ' + n1(-hp * 0.36) + ')');
      p.ls[0].setAttribute('transform', 'rotate(' + n1(-14 + 52 * dr) + ') scale(' + n1(L * 1.08) + ' ' + n1(L * 0.9) + ')');
      p.ls[1].setAttribute('transform', 'rotate(' + n1(194 - 52 * dr) + ') scale(' + n1(L * 1.08) + ' ' + n1(L * 0.9) + ')');
      p.node2.setAttribute('transform', 'translate(' + n1(sx(0.7)) + ' ' + n1(-hp * 0.7) + ')');
      p.ls[5].setAttribute('transform', 'rotate(' + n1(-30 + 50 * dr) + ') scale(' + n1(L * 0.92) + ' ' + n1(L * 0.78) + ')');
      p.ls[6].setAttribute('transform', 'rotate(' + n1(210 - 50 * dr) + ') scale(' + n1(L * 0.92) + ' ' + n1(L * 0.78) + ')');
      p.top.setAttribute('transform', 'translate(' + n1(sw) + ' ' + n1(-hp) + ') rotate(' + n1(24 * dr) + ')');
      var t = L * 0.78;
      p.ls[2].setAttribute('transform', 'rotate(-136) scale(' + n1(t) + ' ' + n1(t * 0.8) + ')');
      p.ls[3].setAttribute('transform', 'rotate(-90) scale(' + n1(t * 1.05) + ' ' + n1(t * 0.8) + ')');
      p.ls[4].setAttribute('transform', 'rotate(-44) scale(' + n1(t) + ' ' + n1(t * 0.8) + ')');
    }
    function ease(t){ return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    var raf = 0, waitT = 0;
    function goTo(p, to, dur, delay){
      p.from = { h: p.h, x: p.x, op: p.op, dry: p.dry }; p.to = to;
      p.t0 = (window.performance ? performance.now() : Date.now()) + (delay || 0); p.dur = calm() ? 0 : dur;
      if(calm()){ p.h = to.h; p.x = to.x; p.op = to.op; p.dry = to.dry; p.to = null; if(p.el) p.el.classList.remove('is-fade'), void p.el.getBoundingClientRect(), p.el.classList.add('is-fade'); }
    }
    function busy(){ return P.some(function(a){ return a.some(function(p){ return !!p.to; }); }); }
    function regrowing(){ return P.some(function(a){ return a.some(function(p){ return p.to && (p.soil || p.gone); }); }); }
    function frame(now){
      raf = 0;
      now = now || (window.performance ? performance.now() : Date.now());
      P.forEach(function(a, g){
        for(var i = a.length - 1; i >= 0; i--){
          var p = a[i];
          if(p.to){
            var f = p.dur ? Math.max(0, Math.min(1, (now - p.t0) / p.dur)) : 1, e = ease(f);
            if(now >= p.t0 || !p.dur){
              ['h', 'x', 'op', 'dry'].forEach(function(k){ p[k] = p.from[k] + (p.to[k] - p.from[k]) * e; });
              if(f >= 1){ ['h', 'x', 'op', 'dry'].forEach(function(k){ p[k] = p.to[k]; }); p.to = null; if(p.next){ var nx = p.next; p.next = null; goTo(p, nx.to, nx.dur, 0); p.soil = true; } else p.soil = false; }
            }
          }
          if(p.gone && !p.to){ if(p.el) p.el.remove(); a.splice(i, 1); continue; }
          if(p.el) paintPlant(p);
        }
      });
      paintOver();
      if(wDirty){ wDirty = false; words(); }
      if(busy()) raf = requestAnimationFrame(frame);
      else settled();
    }
    function kick(){ if(!raf){ if(calm()) frame(); else raf = requestAnimationFrame(frame); } }

    /* Bring the plants to the model for the tab and settings now (regrow: from the soil, a new batch). */
    function sync(how){
      if(!G) return;
      var n = count(), c = cond();
      [0, 1].forEach(function(g){
        var a = P[g], live = a.filter(function(p){ return !p.gone; });
        live.forEach(function(p, j){ if(j >= n){ p.gone = true; p.soil = false; p.next = null; goTo(p, { h: 0, x: p.x, op: 0, dry: p.dry }, 360); } });
        for(var i = 0; i < n; i++){
          var p = live[i], x = px(g, i, n), t = { h: target(g, i), x: x, op: 1, dry: g === 1 && c.water ? 1 : 0 };
          if(!p){
            p = { g: g, i: i, h: 0, x: x, op: 0, dry: t.dry, to: null };
            a.push(p); gPl[g].appendChild(plantEl(p));
            p.soil = true; goTo(p, t, 700, how === 'regrow' ? 0 : 90);
            continue;
          }
          p.i = i;
          if(how === 'regrow' && !calm()){ p.soil = true; goTo(p, { h: 0, x: x, op: 1, dry: t.dry }, 300); p.next = { to: t, dur: 700 }; }
          else { p.next = null; goTo(p, t, how === 'quick' ? 300 : 650); }
        }
      });
      waiting(true);
      kick();
    }
    function rebuildPlants(){
      // after a new layout: the same plants, redrawn at their places at once
      // a pot is redrawn only when its size changed (new plants come in at the right, so the order stays)
      var key = G.pw + ',' + G.potH, pot = null;
      P.forEach(function(a, g){ a.forEach(function(p){ if(p.el && p._pot !== key){ p._pot = key; p.el.querySelector('.dd2-potg').innerHTML = pot || (pot = potSvg()); } }); });
      var n = count();
      P.forEach(function(a, g){ var lv = a.filter(function(p){ return !p.gone; }), nn = Math.max(n, lv.length); lv.forEach(function(p, j){ var x = px(g, j, nn); if(p.to){ p.to.x = x; p.from.x = x; } p.x = x; paintPlant(p); }); });
    }

    /* ---- the numbers on the picture: read from the plants as drawn */
    var over = { ln: [], pill: [], err: [], br: null };
    function overSvg(){
      var o = '';
      [0, 1].forEach(function(g){ o += '<g class="dd2-mean" data-g="' + g + '"><path class="dd2-mline"/><path class="dd2-conn"/></g>'; });
      [0, 1].forEach(function(g){ o += '<g class="dd2-err" data-g="' + g + '"><path class="dd2-ebar"/><circle class="dd2-edot" r="3.2"/></g>'; });
      o += '<text class="dd2-se" data-lab="se" text-anchor="start">±2 SE</text>';
      o += '<g class="dd2-br"><path class="dd2-brl"/><rect class="dd2-pillr" rx="9"/><text class="dd2-pillt" data-lab="diff" text-anchor="middle"></text></g>';
      [0, 1].forEach(function(g){ o += '<g class="dd2-mp" data-g="' + g + '"><rect class="dd2-pillr" rx="9"/><text class="dd2-pillt" data-lab="mean" text-anchor="middle"></text></g>'; });
      return o;
    }
    function stats(g){
      var a = P[g].filter(function(p){ return !p.gone; }).map(function(p){ return p.h; }), n = a.length;
      if(!n) return null;
      var m = a.reduce(function(x, y){ return x + y; }, 0) / n, sd = n > 1 ? Math.sqrt(a.reduce(function(x, y){ return x + (y - m) * (y - m); }, 0) / (n - 1)) : null;
      return { n: n, m: m, sd: sd, se: sd == null ? null : sd / Math.sqrt(n) };
    }
    function fmt(v){ return St.tab === 'fair' ? String(Math.round(v)) : (Math.round(v * 10) / 10).toFixed(1); }
    function pill(gEl, x, y, t){
      var tx = gEl.querySelector('text'), r = gEl.querySelector('rect'), size = G.phone ? 12.5 : 14, w = tw(t, size) + 14, h = size + 9;
      if(tx.textContent !== t) tx.textContent = t; tx.setAttribute('x', n1(x)); tx.setAttribute('y', n1(y + size * 0.36)); tx.style.fontSize = size + 'px';
      r.setAttribute('x', n1(x - w / 2)); r.setAttribute('y', n1(y - h / 2)); r.setAttribute('width', n1(w)); r.setAttribute('height', n1(h));
      return { x: x - w / 2, y: y - h / 2, w: w, h: h };
    }
    var shown = null;   // the stats the numbers show
    function paintOver(){
      if(!G) return;
      var hide = regrowing();
      gOver.classList.toggle('is-wait', hide);
      if(hide) return;
      var s = [stats(0), stats(1)];
      if(!s[0] || !s[1]) return;
      shown = s;
      var ys = s.map(function(x){ return yOf(x.m); });
      [0, 1].forEach(function(g){
        var G0 = G.g[g], e = gOver.querySelector('.dd2-mean[data-g="' + g + '"]');
        e.querySelector('.dd2-mline').setAttribute('d', 'M' + n1(G0.a - 2) + ' ' + n1(ys[g]) + 'H' + n1(G0.b + 2));
        e.querySelector('.dd2-conn').setAttribute('d', 'M' + n1(g ? G0.x0 : G0.x1) + ' ' + n1(ys[g]) + 'H' + n1(G.cx));
        var t = fmt(s[g].m) + ' cm', size = G.phone ? 12.5 : 14, w = tw(t, size) + 14;
        pill(gOver.querySelector('.dd2-mp[data-g="' + g + '"]'), g ? G0.b - w / 2 - 2 : G0.a + w / 2 + 2, ys[g], t);
        var er = gOver.querySelector('.dd2-err[data-g="' + g + '"]'), showE = St.tab === 'n' && s[g].se != null;
        er.setAttribute('visibility', showE ? 'visible' : 'hidden');
        if(showE){
          var y1 = yOf(s[g].m + 2 * s[g].se), y2 = yOf(s[g].m - 2 * s[g].se), x = G0.err, c = 5;
          er.querySelector('.dd2-ebar').setAttribute('d', 'M' + n1(x) + ' ' + n1(y1) + 'V' + n1(y2) + 'M' + n1(x - c) + ' ' + n1(y1) + 'H' + n1(x + c) + 'M' + n1(x - c) + ' ' + n1(y2) + 'H' + n1(x + c));
          var d = er.querySelector('.dd2-edot'); d.setAttribute('cx', n1(x)); d.setAttribute('cy', n1(ys[g]));
        }
      });
      // "±2 SE" names the test group's bar, at its top on the inner side
      var se = gOver.querySelector('.dd2-se'), showS = St.tab === 'n' && s[1].se != null;
      se.setAttribute('visibility', showS ? 'visible' : 'hidden');
      // above the bar's top cap, on the gap side, clear of the plants
      var seFs = G.phone ? 11 : 12.5, seY = yOf(s[1].m + 2 * s[1].se) - 7;
      if(showS){ se.setAttribute('x', n1(G.g[1].err + 3)); se.setAttribute('y', n1(seY)); se.setAttribute('text-anchor', 'end'); se.style.fontSize = seFs + 'px'; }
      // the bracket between the two means, and the difference of the two means as shown (rounded first)
      var dv = St.tab === 'fair' ? Math.round(s[1].m) - Math.round(s[0].m) : Math.round(Math.round(s[1].m * 10) - Math.round(s[0].m * 10)) / 10;
      var dt = dv === 0 ? 'same' : (dv > 0 ? '+' : MINUS) + (St.tab === 'fair' ? Math.abs(dv) : Math.abs(dv).toFixed(1)) + ' cm';
      var br = gOver.querySelector('.dd2-br'), yA = Math.min(ys[0], ys[1]), yB = Math.max(ys[0], ys[1]), c2 = 6;
      // a plain line (no end caps: it must not look like a third error bar)
      br.querySelector('.dd2-brl').setAttribute('d', yB - yA > 1 ? 'M' + n1(G.cx) + ' ' + n1(yA) + 'V' + n1(yB) : '');
      var ph = (G.phone ? 12.5 : 14) + 9, py = yB - yA > ph + 10 ? (yA + yB) / 2 : yA - ph / 2 - 6;
      // with error bars beside the gap, the difference goes above both bars
      if(St.tab === 'n' && s[0].se != null){ var bt = Math.min(yA, yOf(s[0].m + 2 * s[0].se), seY - seFs - 2); py = Math.max(ph / 2 + 4, bt - ph / 2 - 8); }
      pill(br, G.cx, py, dt);
    }
    function waiting(on){ stage.classList.toggle('is-busy', !!on); }

    /* ---- the words: set when the plants have settled */
    function chain(){
      var s = shown;
      if(St.tab === 'fair'){
        var D = differs(), first = !D.length ? 'Nothing differs' : D.length === 1 ? 'Only ' + D[0].name + ' differs' : cap(D.length === 2 ? D[0].name + ' and ' + D[1].name : D[0].name + ', ' + D[1].name + ' and ' + D[2].name) + ' differ';
        var head1 = { t: first, role: 'diff' };
        if(busy() || !s) return [head1, { t: 'Growing', role: 'ink' }];
        var d = Math.round(s[1].m) - Math.round(s[0].m), res = d === 0 ? 'Same height' : 'Test ' + Math.abs(d) + ' cm ' + (d > 0 ? 'taller' : 'shorter');
        var end = !D.length ? { t: 'Nothing is tested', role: 'bad' } : D.length === 1 ? { t: cap(D[0].name) + ' made the difference', role: 'ok' } : { t: 'Can’t tell which did it', role: 'bad', say: 'you cannot tell which one caused it' };
        return [head1, { t: res, role: 'res' }, end];
      }
      var nn = St.n + (St.n === 1 ? ' plant each' : ' plants each'), h0 = { t: nn, role: 'diff' };
      if(busy() || !s) return [h0, { t: 'Growing', role: 'ink' }];
      if(St.n === 1) return [h0, { t: 'No spread to measure', role: 'res' }, { t: 'Can’t tell', role: 'bad', say: 'you cannot tell if it is chance' }];
      var ov = s[0].m + 2 * s[0].se >= s[1].m - 2 * s[1].se && s[1].m + 2 * s[1].se >= s[0].m - 2 * s[0].se;
      return ov ? [h0, { t: 'Bars overlap', role: 'res' }, { t: 'Could be chance', role: 'bad' }] : [h0, { t: 'Bars apart', role: 'res' }, { t: 'Unlikely to be chance', role: 'ok' }];
    }
    var lastSay = '';
    function settled(){
      waiting(false);
      words(); refHtml();
      var t = cause.text();
      if(t !== lastSay){ lastSay = t; say(t); }
    }
    function words(){
      cause.set(chain());
      var s = shown;
      svg.setAttribute('aria-label', 'A bench of bean plants after 3 weeks. Control group ' + (s ? 'mean ' + fmt(s[0].m) + ' cm' : '') + '; test group ' + (s ? 'mean ' + fmt(s[1].m) + ' cm' : '') + '. ' + cause.text());
      stage.setAttribute('data-tab', St.tab);
      stage.setAttribute('data-diff', differs().map(function(x){ return x.id; }).join(','));
      stage.setAttribute('data-n', count());
    }

    /* ---- controls: the three things on the test side (Fair test), the knob (Sample size) */
    function toggle(j){
      hideCue(true); tourDid('tap');
      var it = ITEMS[j]; St.cond[it.id] = !St.cond[it.id];
      paintItems(); sync(); words();
      say('Test group: ' + (St.cond[it.id] ? it.diff : it.same).toLowerCase() + '.');
    }
    function tapBoxes(){
      var yb = G.yFront - 4, s = G.phone ? 1.05 : 1.5;
      return ITEMS.map(function(it, j){ var w = (G.g[1].x1 - G.g[1].x0) / 3 - 2, x = itemX(1, j), top = yb - 37 * s - 5; return [x - w / 2, top, w, G.yFront + (G.phone ? 44 : 50) - top]; });
    }
    var knob = null;
    function knobTrack(){ var y = G.H - (G.phone ? 26 : 30), inset = G.phone ? 34 : 40; return [G.g[0].x0 + inset, y, G.g[1].x1 - inset, y]; }
    function setN(v){
      v = Math.round(v); if(v === St.n) return;
      hideCue(true); tourDid('drag');
      St.n = v; sizes(); rebuildPlants(); sync(); wordsSoon();
    }
    /* The sizes that follow the count (pots, leaves), from the layout already made: no reading of the page. */
    function sizes(){
      if(!G) return;
      var n = count(), slot = (G.g[0].b - G.g[0].a) / n;
      G.n = n; G.slot = slot; G.pw = Math.max(9, Math.min(G.phone ? 30 : 44, slot * 0.7)); G.leaf = Math.max(7, Math.min(G.phone ? 14 : 26, slot * 0.5));
    }
    var wDirty = false;
    function wordsSoon(){ wDirty = true; kick(); }

    /* ---- the cue and "Show me how" */
    var cue = K.cue(layer, { key: 'apbio-design-fair', text: 'Tap the water', side: 'above', at: function(){ if(!G) return [0, 0]; return [itemX(1, 0), G.yFront - (G.phone ? 40 : 50)]; } });
    var cueN = K.cue(layer, { key: 'apbio-design-n', text: 'Drag for more plants', side: 'right', at: function(){ if(!G || !knob) return [0, 0]; var t = knobTrack(), f = (St.n - 1) / (EXM.max - 1); return [t[0] + (t[2] - t[0]) * f + 18, t[1]]; } });
    function curCue(){ return St.tab === 'fair' ? cue : cueN; }
    function hideCue(used){ var c = curCue(); if(c.active()) c.hide(used); }
    function showCue(){ cue.hide(false); cueN.hide(false); if(St.mode === 'explore') curCue().show(); }
    var tour = K.tour({ key: 'apbio-design', label: 'Show me how', steps: [
      { id: 'tap', text: 'Tap the water, the plant food or the warmth on the test side.', target: function(){ return St.tab === 'fair' ? tapB[0].el : knob.el; } },
      { id: 'read', text: 'Amber rings mark everything that differs between the groups.', target: function(){ return sceneBox; } },
      { id: 'why', text: 'The line below says whether the difference can be trusted.', target: function(){ return cause.el; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    var tourN = K.tour({ key: 'apbio-design-n', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag for more plants in each group.', target: function(){ return knob.el; } },
      { id: 'read', text: 'Each bar is ±2 SE. Bars that overlap mean it could be chance.', target: function(){ return sceneBox; } },
      { id: 'new', text: 'New plants grows the same experiment again.', target: function(){ return bNew; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function curTour(){ return St.tab === 'fair' ? tour : tourN; }
    function tourDid(id){ var t = curTour(); if(t.active()) t.did(id); }
    function startTour(){ if(St.mode !== 'explore') return; hideCue(false); curTour().start(true); }

    /* ---- layout and tabs */
    function layoutNow(force){
      var g = layout(); if(!g) return;
      var same = !force && G && g.W === G.W && g.H === G.H && g.frontH === G.frontH, onlyN = same && g.n !== G.n;
      G = g;
      if(onlyN) rebuildPlants();
      FAM = getComputedStyle(svg).fontFamily || FAM;
      if(!same){
        svgs.forEach(function(x){ x.setAttribute('viewBox', '0 0 ' + G.W + ' ' + G.H); });
        sceneBox.setAttribute('data-k', G.k); sceneBox.setAttribute('data-ysoil', G.ySoil);
        gBack.innerHTML = backSvg(); gMats.innerHTML = matSvg(); gFront.innerHTML = frontSvg(); gItems.innerHTML = itemsSvg(); gLabs.innerHTML = labsSvg();
        if(!gOver.firstChild) gOver.innerHTML = overSvg();
        paintItems(); rebuildPlants(); paintOver();
        var bx = tapBoxes(); tapB.forEach(function(b, j){ b.place(bx[j]); });
        if(knob) knob.place(knobTrack());
      }
      if(cue.active()) cue.place(); if(cueN.active()) cueN.place();
      if(tour.active()) tour.place(); if(tourN.active()) tourN.place();
      if(!P[0].length && !P[1].length){ sync(); words(); }
    }
    function setTab(v, user){
      if(v !== St.tab){ hideCue(false); if(tour.active()) tour.stop(); if(tourN.active()) tourN.stop(); }
      var was = St.tab; St.tab = v; tabs.value(v);
      head.purpose(v === 'fair' ? 'See why only one thing may differ.' : 'See why one plant per group is not enough.');
      bNew.hidden = v !== 'n'; bReset.hidden = v !== 'fair';
      if(knob) knob.hide(v !== 'n');
      layoutNow(true);
      paintItems();
      if(was !== v || !P[0].length) sync(user || P[0].length ? 'regrow' : 'quick');
      words();
      if(user) showCue();
    }
    if(window.ResizeObserver) new ResizeObserver(function(){ layoutNow(); }).observe(sceneBox); else window.addEventListener('resize', function(){ layoutNow(); });

    // the controls go on the layer once there is a layout
    ITEMS.forEach(function(it, j){ tapB.push(K.tap(layer, { key: j === 0 ? 'apbio-design-water' : null, chip: false, label: it.same, box: [0, 0, 10, 10], pressed: !!St.cond[it.id], onClick: function(){ toggle(j); } })); });
    knob = K.drag(layer, { key: 'apbio-design-n', label: 'Plants per group', min: 1, max: EXM.max, step: 1, value: St.n, track: [0, 0, 10, 0], chip: false,
      valuetext: function(v){ return v + (v === 1 ? ' plant' : ' plants') + ' per group'; }, tag: function(v){ return v + (v === 1 ? ' plant' : ' plants'); }, onInput: setN });
    knob.el.classList.add('dd2-knob-n');
    bNew.addEventListener('click', function(){
      hideCue(true); tourDid('new'); intoView();
      St.batch++; DEV2 = batchDev(St.batch); sync('regrow'); words();
    });
    bReset.addEventListener('click', function(){ hideCue(true); intoView(); St.cond = { water: false, food: true, warm: false }; paintItems(); sync(); words(); });
    function intoView(){ try{ var r = sceneBox.getBoundingClientRect(), vh = window.innerHeight || 0; if(r.top < 0 || r.bottom > vh) sceneBox.scrollIntoView({ block: r.height > vh ? 'start' : 'center', behavior: calm() ? 'auto' : 'smooth' }); }catch(e){} }

    /* ---- "?": the terms, the bench's invented numbers, the error bars, the drill filter */
    var ref = document.createElement('div'); ref.className = 'ls-sec dd2-ref';
    ref.innerHTML = '<h3 class="ls-title-l">What the bench shows</h3>' +
      '<p class="dd2-ref-p"><b>Independent variable:</b> the one thing you change on purpose (here, plant food for the test group). <b>Dependent variable:</b> what you measure (the height after 3 weeks). <b>Controlled variables:</b> everything kept the same in both groups (the light, the water, the warmth, the pots, the seeds). <b>Control group:</b> the group with no plant food, the baseline to compare with.</p>' +
      '<p class="dd2-ref-p"><b>Confounding variable:</b> a second difference between the groups that could also change the result. With two differences you cannot say which one caused it, even when the second one turns out to do nothing. List what differs between the groups: there should be one thing on that list.</p>' +
      '<p class="dd2-ref-p"><b>Sample size and error bars.</b> Plants of one seed lot still differ by chance. The bars on Sample size are ±2 standard errors (SE = s ÷ √n), about a 95% confidence interval. Bars that do not overlap mean the difference is unlikely to be chance; bars that overlap mean the data do not show a difference. Data support a claim or fail to support it; they never prove it.</p>' +
      '<p class="dd2-ref-p"><b>This bench is a made up example.</b> Bean plants grow to 18 cm on average in 3 weeks; plant food adds 6 cm, less water takes away 7 cm, a warmer mat adds 6 cm, and plants vary by chance with a standard deviation of 3 cm. Each of these is big enough that, with 6 plants a group, the ±2 SE bars of the two groups would not overlap. Light is the same for both groups: very dim light can make seedlings grow taller and thinner, so height alone would mislead.</p>' +
      '<div class="dd2-ref-live"></div>' +
      '<p class="dd2-ref-p">Notes: <a href="../notes/design-variables.html">Independent and dependent variables</a> · <a href="../notes/design-controls.html">Controls</a> · <a href="../notes/stats-confidence-intervals.html">Confidence intervals</a></p>' +
      '<div class="dd2-ref-drill"><h3 class="ls-title-l">Practice one kind of drill</h3></div>' +
      '<p class="dd2-ref-p"><button type="button" class="tk2-how dd2-ref-how">Show me how</button> <button type="button" class="tk2-link dd2-ref-prac">Go to the experiment drills</button></p>';
    var refLive = ref.querySelector('.dd2-ref-live');
    ref.querySelector('.dd2-ref-how').addEventListener('click', function(){ if(ctx.studio){ if(ctx.studio.kit2 && ctx.studio.kit2.mode() !== 'explore') ctx.studio.kit2.go('explore'); if(ctx.studio.close) ctx.studio.close(); } setTimeout(startTour, 60); });
    ref.querySelector('.dd2-ref-prac').addEventListener('click', function(){ if(ctx.studio && ctx.studio.kit2){ if(ctx.studio.close) ctx.studio.close(); ctx.studio.kit2.go('quiz', 'drills'); } });
    function refHtml(){
      var s = shown; if(!s) return;
      var rows = [0, 1].map(function(g){ var a = P[g].filter(function(p){ return !p.gone; }).map(function(p){ return fmt(p.h); }); return '<tr><th scope="row">' + (g ? 'Test' : 'Control') + '</th><td>' + a.join(', ') + '</td><td>' + fmt(s[g].m) + '</td>' + (St.tab === 'n' ? '<td>' + (s[g].se == null ? '–' : '±' + (2 * s[g].se).toFixed(1)) + '</td>' : '') + '</tr>'; }).join('');
      refLive.innerHTML = '<div class="table-wrap"><table><caption>Heights on the bench now (cm)</caption><thead><tr><th scope="col">Group</th><th scope="col">Each plant</th><th scope="col">Mean</th>' + (St.tab === 'n' ? '<th scope="col">±2 SE</th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    function onShow(mode){
      St.mode = mode;
      if(mode === 'explore'){ setTimeout(function(){ layoutNow(true); paintItems(); showCue(); }, 0); }
      else { cue.hide(false); cueN.hide(false); if(tour.active()) tour.stop(); if(tourN.active()) tourN.stop(); paintItems(); finishAll(); }
    }
    /* Leaving Explore: every change lands at once, the frame loop stops, and the words settle (nothing runs on a
       hidden stage). */
    function finishAll(){
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      P.forEach(function(a){
        for(var i = a.length - 1; i >= 0; i--){
          var p = a[i];
          if(p.next){ p.to = p.next.to; p.next = null; }
          if(p.to){ p.h = p.to.h; p.x = p.to.x; p.op = p.to.op; p.dry = p.to.dry; p.to = null; }
          p.soil = false;
          if(p.gone){ if(p.el) p.el.remove(); a.splice(i, 1); continue; }
          if(p.el && G) paintPlant(p);
        }
      });
      if(!G) return;
      paintOver(); wDirty = false; settled();
    }
    setTab('fair', false);
    return { stage: stage, ref: ref, refDrill: ref.querySelector('.dd2-ref-drill'), onShow: onShow, first: function(){ layoutNow(true); setTimeout(function(){ layoutNow(true); if(St.mode === 'explore') showCue(); }, 60); } };
  }

  /* TEST YOURSELF, "Experiment drills": the old Tool Studio arrangement, unchanged in content, grading and record
     ids, handed to the kit adapter as one part with its own picture (the part's stage: the experiment's drawn setup,
     its chart and table, with The setup / The results) and its dock (the drills one at a time). The experiment is
     chosen on the stage (the Experiment dropdown, quiz only); the drill filter is in "?". */
  function drillsPart(app, s, refDrill){
    var pick = app.querySelector('.dr-pick'), host = app.querySelector('.dr-scen');
    var stage = document.createElement('div'), dock = document.createElement('div');
    stage.className = 'ls-dr-stage'; dock.className = 'ls-dr-dock';
    var sels = pick.querySelectorAll(':scope > .bt-ctl');
    if(sels[1] && refDrill) refDrill.appendChild(sels[1]);
    dock.appendChild(pick);
    var wrap = null, view = 'setup', auto = true;
    var DATA_DRILLS = { cer: 1, predict: 1 };
    /* The setup (or the results chart) is scaled to the stage's own height, so the side panel never cuts it: from the
       svg's top to the stage's bottom, less "Read the setup" under it and the Enlarge button's corner. It never shrinks
       below the size where its smallest label (the icons' own small glyphs aside) is 11 px tall on screen, or the
       full width if that is less; when the stage is too short for that, the stage takes the height it needs (its
       min-height), so the side panel starts below the drawing (review recheck 1). */
    var fitQ = 0, LEG = 11;
    function fitPic(){
      fitQ = 0;
      if(stage.hidden || !stage.getClientRects().length) return;
      var host = stage.closest('.ls-stage-body') || stage.parentNode, stg = stage.closest('.ls-stage') || host;
      stg.style.minHeight = '';   // measured from the stage's own height each time
      var enl = stg.querySelector('.ls-enl'), er = enl && enl.getClientRects().length ? enl.getBoundingClientRect() : null;
      var foot = er && er.width ? stg.getBoundingClientRect().bottom - er.top + 4 : 0;
      var rd = stage.querySelector('.dr-readsetup'), under = rd && !rd.hidden && rd.getClientRects().length ? rd.querySelector('summary').getBoundingClientRect().height + 10 : 0;
      var needStage = 0;
      stage.querySelectorAll('.dr-sfig, .dr-charts svg').forEach(function(sv){
        if(!sv.getClientRects().length) return;
        var vb = sv.viewBox && sv.viewBox.baseVal, r = sv.getBoundingClientRect(), w = r.width;
        if(!vb || !vb.width || !w || !r.height) return;
        // the smallest label's font size in viewBox units (the icons' own small glyphs aside). On a phone the studio
        // raises small svg text to 12 px on screen (data-ls-fs0); there the drawing takes its full width, so the raised
        // labels have the room they had before
        var unit = 1e9, raised = false;
        sv.querySelectorAll('text').forEach(function(t){ if(t.classList.contains('dk-ic') || !t.textContent.trim()) return; if(t.hasAttribute('data-ls-fs0')) raised = true; else unit = Math.min(unit, parseFloat(getComputedStyle(t).fontSize) || 1e9); });
        var full = w * vb.height / vb.width, legible = raised || unit >= 1e9 ? full : Math.min(full, vb.height * LEG / unit);
        var lim = Math.min(host.getBoundingClientRect().bottom, stg.getBoundingClientRect().bottom - foot);
        var avail = lim - r.top - 6 - (sv.classList.contains('dr-sfig') ? under : 0);
        var h = Math.min(full, Math.max(legible, avail));
        sv.style.height = Math.floor(h) + 'px';
        // the stage's height that shows the whole drawing at that size
        if(h > avail + 0.5) needStage = Math.max(needStage, r.top - stg.getBoundingClientRect().top + h + 6 + (sv.classList.contains('dr-sfig') ? under : 0) + foot);
      });
      if(needStage) stg.style.minHeight = Math.ceil(needStage) + 'px';
    }
    function unfit(){ var stg = stage.closest('.ls-stage'); if(stg) stg.style.minHeight = ''; }
    function fitSoon(){ if(!fitQ) fitQ = requestAnimationFrame(fitPic); }
    window.addEventListener('resize', fitSoon);
    if(window.ResizeObserver) new ResizeObserver(fitSoon).observe(stage);
    function setView(v, byHand){
      if(byHand) auto = false;
      view = v; stage.classList.toggle('dr-show-data', v === 'data'); fitSoon();
      var rs = stage.querySelector('.dr-readsetup'); if(rs) rs.hidden = v === 'data';
      stage.querySelectorAll('.dr-view button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); });
    }
    function follow(){
      if(!auto || !wrap) return;
      var cur = wrap.querySelector(':scope > .dr-sec:not(.ls-step-off), :scope > .bt-frq:not(.ls-step-off)');
      if(!cur || wrap.classList.contains('is-review')) return;
      var d = cur.classList.contains('bt-frq') ? 'cer' : cur.getAttribute('data-drill');
      setView(DATA_DRILLS[d] ? 'data' : 'setup');
    }
    var scenSel = app.querySelector('.dr-pick select') || pick.querySelector('select');
    function task(){ return { kicker: 'Experiment ' + (scenSel ? (scenSel.selectedIndex + 1) + ' of ' + scenSel.options.length : ''), title: 'Look at the experiment, then answer one drill at a time.' }; }
    function arrange(){
      if(!host.children.length) return;
      stage.innerHTML = '';
      Array.prototype.slice.call(host.querySelectorAll(':scope > h2, :scope > .dr-schem, :scope > .bt-context, :scope > .table-wrap')).forEach(function(x){ stage.appendChild(x); });
      var h2 = stage.querySelector('h2'); if(h2){ h2.classList.add('ls-title-l'); h2.classList.add('sr-only'); }
      var ctxEl = stage.querySelector(':scope > .bt-context');
      if(ctxEl){ var rd = document.createElement('details'); rd.className = 'bt-data dr-readsetup'; rd.innerHTML = '<summary>Read the setup</summary>'; ctxEl.parentNode.insertBefore(rd, ctxEl); rd.appendChild(ctxEl); }
      if(stage.querySelector('.dr-charts') || stage.querySelector('.table-wrap')){
        var vw = document.createElement('div'); vw.className = 'dr-view'; vw.setAttribute('role', 'group'); vw.setAttribute('aria-label', 'Show');
        vw.innerHTML = '<button type="button" class="bt-btn" data-v="setup" aria-pressed="true">The setup</button><button type="button" class="bt-btn" data-v="data" aria-pressed="false">The results</button>';
        vw.addEventListener('click', function(e){ var b = e.target.closest('button'); if(b) setView(b.getAttribute('data-v'), true); });
        if(h2) h2.after(vw); else stage.insertBefore(vw, stage.firstChild);
      }
      auto = true; setView('setup');
      [60, 300, 900].forEach(function(t){ setTimeout(fitSoon, t); });
      var w = document.createElement('div'); w.className = 'ls-dr-steps';
      Array.prototype.slice.call(host.children).forEach(function(x){ w.appendChild(x); });
      if(wrap) wrap.remove();
      wrap = w; dock.appendChild(w);
      window.LevlStudio.stepper(w, { items: ':scope > .dr-sec, :scope > .bt-frq', label: 'Drill' });
      if(window.MutationObserver) new MutationObserver(follow).observe(w, { subtree: true, attributes: true, attributeFilter: ['class'] });
      s.done(false, 'quiz');
      if(s.kit2 && s.kit2.mode() === 'quiz') s.task(task(), 'quiz');
      s.caption('', 'quiz');
      s.pills([], null, 'quiz');
    }
    /* Every drill of this experiment checked (and each written answer has its rubric): the finished card. */
    function finished(){
      if(!wrap) return;
      var secs = wrap.querySelectorAll(':scope > .dr-sec'), frqs = wrap.querySelectorAll(':scope > .bt-frq'), r = 0, n = 0, all = true;
      Array.prototype.forEach.call(secs, function(x){ var m = /(\d+) of (\d+)/.exec((x.querySelector('.bt-result') || {}).textContent || ''); if(!m){ all = false; return; } r += +m[1]; n += +m[2]; });
      Array.prototype.forEach.call(frqs, function(f){ if(!f.querySelector('.bt-rubric')) all = false; });
      if(!all || !secs.length) return;
      var les = wrap.querySelector('.bt-keep a[href*="lessons/"]');
      s.done({ kicker: r === n ? 'Solved' : 'Finished', title: T.esc(r + ' of ' + n + ' right on this experiment.'),
        text: frqs.length ? 'Score your written answers with their rubrics.' : 'The feedback is under each answer.',
        next: scenSel ? { label: 'Next experiment', onClick: function(){ scenSel.selectedIndex = (scenSel.selectedIndex + 1) % scenSel.options.length; scenSel.dispatchEvent(new Event('change', { bubbles: true })); } } : null,
        links: [{ label: 'Review your answers', onClick: function(){ s.done(false, 'quiz'); } }, { label: 'How the drills work', open: 'about' }]
          .concat(les ? [{ label: 'Read the lesson: ' + les.textContent.replace(/^\s*Lesson\s*/, '').trim(), href: les.getAttribute('href') }] : []) }, 'quiz');
    }
    // Feedback lands on the stage: the last checked drill's score as a pill.
    dock.addEventListener('submit', function(){ setTimeout(function(){
      var r = Array.prototype.filter.call(dock.querySelectorAll('.dr-sec:not(.ls-step-off) .bt-result'), function(x){ return x.textContent; })[0];
      var m = r && /(\d+) of (\d+)/.exec(r.textContent);
      if(m) s.pills([{ html: m[1] + ' of ' + m[2] + ' right', tone: m[1] === m[2] ? 'good' : 'warn' }], null, 'quiz');
      finished();
    }, 0); });
    if(window.MutationObserver) new MutationObserver(arrange).observe(host, { childList: true });
    arrange();
    if(scenSel) scenSel.addEventListener('change', function(){ setTimeout(function(){ if(s.kit2 && s.kit2.mode() === 'quiz') s.task(task(), 'quiz'); }, 0); });
    return { value: 'drills', label: 'Experiment drills', stage: stage, dock: dock, task: task, fit: function(){ [0, 120, 500, 1200].forEach(function(t){ setTimeout(fitSoon, t); }); }, unfit: unfit };
  }

  /* The kit adapter's settings: the bench is the Explore stage, the drills are the one Test yourself part. */
  function kit2(ctx){
    var app = document.getElementById('app'), s = ctx.studio;
    var part = drillsPart(app, s, EXP.refDrill);
    var sel = EXP.refDrill.querySelector('select');
    if(sel) sel.addEventListener('change', function(){ if(s.kit2){ if(s.close) s.close(); s.kit2.go('quiz', 'drills'); } });
    setTimeout(EXP.first, 0);
    return { stage: EXP.stage, ref: EXP.ref, parts: [part], onShow: function(mode){ if(mode === 'explore') part.unfit(); EXP.onShow(mode); if(mode !== 'explore') part.fit(); } };
  }
})();
