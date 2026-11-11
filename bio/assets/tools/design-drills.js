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
  }, { studio: { arrange: studio } });

  /* Tool Studio (docs/tools-calm.md): the scenario (its setup and data
     table) is the stage; the drills go one at a time in the dock, each with
     its own Check; the scenario choice is the one dock control, the drill
     filter is in Details; "How this works" is under Why. Every draw (a new scenario) is re-arranged into a
     fresh stepper. */
  function studio(app, s){
    var pick = app.querySelector('.dr-pick'), host = app.querySelector('.dr-scen');
    // "How this works" (what each drill practices and how it is checked) is the Why.
    Array.prototype.slice.call(app.children).forEach(function(k){ if(k.matches('.bt-intro')) s.add('about', k); if(k.matches('details.bt-how')){ k.open = true; s.add('why', k); } });
    T.studioKeep(s);
    var stage = document.createElement('div'), det = document.createElement('div'), dock = document.createElement('div');
    stage.className = 'ls-dr-stage'; det.className = 'ls-sec'; dock.className = 'ls-dr-dock';
    s.add('stage', stage); s.add('details', det);
    var sels = pick.querySelectorAll(':scope > .bt-ctl');
    if(sels[1]) det.appendChild(sels[1]);
    s.add('dock', pick); s.add('dock', dock);
    var wrap = null, view = 'setup', auto = true;
    /* Pass 2 (2026-11-10): one picture at a time. Setup (the drawn experiment
       and its text) or Results (the charts and the data table); the drills
       that read the data (claim and evidence, predict, the written answers)
       switch to Results, the others to Setup, until the student picks. */
    var DATA_DRILLS = { cer: 1, predict: 1 };
    function setView(v, byHand){
      if(byHand) auto = false;
      view = v; stage.classList.toggle('dr-show-data', v === 'data');
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
    function arrange(){
      if(!host.children.length) return;
      stage.innerHTML = '';
      Array.prototype.slice.call(host.querySelectorAll(':scope > h2, :scope > .dr-schem, :scope > .bt-context, :scope > .table-wrap')).forEach(function(x){ stage.appendChild(x); });
      var h2 = stage.querySelector('h2'); if(h2) h2.classList.add('ls-title-l');
      // pass 3 (2026-11-11): the picture carries the setup; its full paragraph opens on tap
      var ctxEl = stage.querySelector(':scope > .bt-context');
      if(ctxEl){ var rd = document.createElement('details'); rd.className = 'bt-data dr-readsetup'; rd.innerHTML = '<summary>Read the setup</summary>'; ctxEl.parentNode.insertBefore(rd, ctxEl); rd.appendChild(ctxEl); }
      if(stage.querySelector('.dr-charts') || stage.querySelector('.table-wrap')){
        var vw = document.createElement('div'); vw.className = 'dr-view'; vw.setAttribute('role', 'group'); vw.setAttribute('aria-label', 'Show');
        vw.innerHTML = '<button type="button" class="bt-btn" data-v="setup" aria-pressed="true">The setup</button><button type="button" class="bt-btn" data-v="data" aria-pressed="false">The results</button>';
        vw.addEventListener('click', function(e){ var b = e.target.closest('button'); if(b) setView(b.getAttribute('data-v'), true); });
        if(h2) h2.after(vw); else stage.insertBefore(vw, stage.firstChild);
      }
      auto = true; setView('setup');
      var w = document.createElement('div'); w.className = 'ls-dr-steps';
      Array.prototype.slice.call(host.children).forEach(function(x){ w.appendChild(x); });
      if(wrap) wrap.remove();
      wrap = w; dock.appendChild(w);
      window.LevlStudio.stepper(w, { items: ':scope > .dr-sec, :scope > .bt-frq', label: 'Drill' });
      if(window.MutationObserver) new MutationObserver(follow).observe(w, { subtree: true, attributes: true, attributeFilter: ['class'] });
      s.caption('Look at the experiment, then answer one drill at a time.');
      s.pills([]);
    }
    // Feedback lands on the stage: the last checked drill's score as a pill.
    dock.addEventListener('submit', function(){ setTimeout(function(){
      var r = Array.prototype.filter.call(dock.querySelectorAll('.dr-sec:not(.ls-step-off) .bt-result'), function(x){ return x.textContent; })[0];
      var m = r && /(\d+) of (\d+)/.exec(r.textContent);
      if(m){ s.pills([{ html: m[1] + ' of ' + m[2] + ' right', tone: m[1] === m[2] ? 'good' : 'warn' }]); s.caption('<b>' + T.esc(r.textContent) + '</b> The feedback is under each answer. Next goes on to the next drill.'); }
    }, 0); });
    if(window.MutationObserver) new MutationObserver(arrange).observe(host, { childList: true });
    arrange();
    app.hidden = true;
    s.hint({ target: '.ls-dr-steps .bt-radio', text: 'Read the setup, then pick an answer' });
  }
})();
