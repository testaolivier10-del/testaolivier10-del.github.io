/* Mnemonics: a "fill the letters" self-check on every lettered card, and a
   link into a scenario where the case uses it.

   ONE JOB: find out whether you can expand the letters, then see them used.

   The answers are the bold words already on each card; nothing is added. An
   answer counts when it starts the same way as any of the card's words for
   that letter ("Signs/Symptoms" accepts "signs" or "symptoms"), because
   recall, not spelling, is what is being checked. Scenario links come from
   each card's data-scenario attribute, set only where that case's text
   actually uses the mnemonic. */
(function(){
  'use strict';
  function txt(el){ return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function norm(s){ return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }

  /* Lenient on purpose: a typed word counts when it shares its first three
     letters (or all of a shorter word) with a word of the answer, so
     "allergy", "meds" and "past history" all pass. Small words are ignored. */
  var SMALL = { of: 1, to: 1, the: 1, and: 1, or: 1, a: 1, an: 1, in: 1, up: 1 };
  function words(s){ return norm(s).split(' ').filter(function(w){ return w && !SMALL[w]; }); }
  function accepts(answer, typed){
    var t = words(typed), a = words(answer);
    if(!t.length || norm(typed).length < 2) return false;
    return t.some(function(w){
      var k = Math.min(3, w.length);
      return a.some(function(x){ return x.slice(0, k) === w.slice(0, k) && (w.length >= 3 || x === w); });
    });
  }

  document.querySelectorAll('.mnemonics-grid .card').forEach(function(card){
    var rows = Array.prototype.filter.call(card.querySelectorAll('.breakdown .row'), function(r){
      return r.querySelector('.letter') && r.querySelector('b');
    });
    var sid = card.getAttribute('data-scenario');
    if(!rows.length && !sid) return;
    var name = txt(card.querySelector('h2'));
    var tools = document.createElement('div');
    tools.className = 'mn-tools';
    tools.innerHTML =
      (rows.length ? '<button type="button" class="mn-test" aria-pressed="false">Fill the letters</button><span class="mn-score" aria-live="polite"></span>' : '') +
      (sid ? '<a class="mn-call" href="scenario-sim.html?scenario=' + sid + '">Use it on a call: ' + card.getAttribute('data-scenario-title') + ' →</a>' : '');
    card.appendChild(tools);
    if(!rows.length) return;

    var btn = tools.querySelector('.mn-test'), score = tools.querySelector('.mn-score');
    rows.forEach(function(r, i){
      var body = r.children[1];
      body.classList.add('mn-hide');
      var input = document.createElement('input');
      input.className = 'mn-in';
      input.type = 'text';
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.setAttribute('aria-label', name + ': what does ' + txt(r.querySelector('.letter')) + ' stand for?');
      input.hidden = true;
      r.appendChild(input);
      r._answer = txt(r.querySelector('b'));
      r._input = input;
      input.addEventListener('keydown', function(e){
        if(e.key !== 'Enter') return;
        e.preventDefault();
        check(r);
        var next = rows[i + 1];
        if(next) next._input.focus(); else btn.focus();
      });
      input.addEventListener('blur', function(){ if(input.value && !input.readOnly) check(r); });
    });

    function check(r){
      var ok = accepts(r._answer, r._input.value);
      r._input.classList.toggle('ok', ok);
      r._input.classList.toggle('no', !ok);
      r._done = true;
      var n = rows.filter(function(x){ return x._done; }).length, right = rows.filter(function(x){ return x._input.classList.contains('ok'); }).length;
      score.textContent = n + ' of ' + rows.length + ' answered' + (n === rows.length ? ', now show the answers' : '');
    }

    var state = 'off';   // off -> testing -> shown -> off
    btn.addEventListener('click', function(){
      if(state === 'off'){
        state = 'testing';
        card.classList.add('is-testing');
        rows.forEach(function(r){ if(r._mark) r._mark.hidden = true; r._input.hidden = false; r._input.readOnly = false; r._input.value = ''; r._input.className = 'mn-in'; r._done = false; });
        btn.textContent = 'Show the answers';
        score.textContent = '0 / ' + rows.length;
        rows[0]._input.focus();
      } else if(state === 'testing'){
        state = 'shown';
        rows.forEach(function(r){
          if(!r._done) check(r);
          r._input.hidden = true;
          var ok = r._input.classList.contains('ok'), v = r._input.value.trim();
          var mark = r._mark || (r._mark = document.createElement('span'));
          mark.className = 'mn-mark ' + (ok ? 'ok' : 'no');
          mark.textContent = (ok ? '\u2713' : '\u2715') + (v ? ' ' + v : ' blank');
          mark.setAttribute('aria-label', (ok ? 'Recalled: ' : 'Missed: ') + (v || 'left blank'));
          mark.hidden = false;
          r.appendChild(mark);
        });
        card.classList.remove('is-testing');
        var right = rows.filter(function(x){ return x._input.classList.contains('ok'); }).length;
        score.textContent = right + ' / ' + rows.length + ' recalled';
        if(window.LevlAnnounce) window.LevlAnnounce.say(name + ': ' + right + ' of ' + rows.length + ' recalled.');
        btn.textContent = 'Hide my answers';
      } else {
        state = 'off';
        rows.forEach(function(r){ r._input.hidden = true; if(r._mark) r._mark.hidden = true; });
        btn.textContent = 'Fill the letters';
        score.textContent = '';
      }
      btn.setAttribute('aria-pressed', state === 'off' ? 'false' : 'true');
    });
  });

  window.NremtMnemonicCheck = { accepts: accepts };
})();
