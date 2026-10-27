/* Reference cards as a tool (audit 2026-10): four cards, four modes.

     Vitals   the age slider and the vitals check (vitals-check.js), as before
     GCS      three tap columns, eye / verbal / motor, with a live total
     APGAR    five signs, each 0 / 1 / 2, with a live total out of 10
     PAT      the pediatric assessment triangle: tap a side to mark it
              abnormal; the middle says what the combination suggests

   EVERY OPTION IS THE PAGE'S OWN TEXT. The GCS columns and the APGAR rows
   are read from the cards' tables (reference-cards.html), so the tables, the
   flashcards built from them (scripts/build-nremt-flashcards.mjs) and the
   tool can never disagree. The PAT sides come from its table too; what a
   combination suggests is the card's own note ("Reading the combinations")
   plus the standard PAT categories for the ones the note does not name.

   Each card also has a short "Score a patient" practice: a described
   patient, the student taps their score, Check marks each part right or
   wrong on the same columns (the right answer drawn next to theirs), with a
   method hint first and Show the answer after.

   Mounted by reference-cards.html with the Tool Studio (nremt-studio.js).
   Without it (or ?studio=0) the page stays the four scrolling cards. */
(function(){
  'use strict';
  function txt(el){ return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function rowsOf(id){ return [].slice.call(document.querySelectorAll('#' + id + ' tbody tr')).map(function(tr){ return [].map.call(tr.children, txt); }); }

  /* ---- read the tables ---------------------------------------------------- */
  // GCS: score | eye | verbal | motor, a dash where a column has no such score.
  var GCS = { E: [], V: [], M: [] };
  rowsOf('gcs').forEach(function(r){
    var n = +r[0];
    [['E', r[1]], ['V', r[2]], ['M', r[3]]].forEach(function(p){ if(p[1] && !/^[—–-]$/.test(p[1])) GCS[p[0]].push({ n: n, t: p[1] }); });
  });
  var GCS_NAME = { E: 'Eye opening', V: 'Verbal response', M: 'Motor response' };
  var GCS_ICON = {
    E: '<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/>',
    V: '<path d="M5 6h14a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 19 16h-8l-4 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 5 6z"/><path d="M8 11h8"/>',
    M: '<path d="M9 20v-6.5L6.5 11V6.8a1.3 1.3 0 0 1 2.6 0V10m0-4.2a1.3 1.3 0 0 1 2.6 0V10m0-3.5a1.3 1.3 0 0 1 2.6 0V10m0-2.3a1.3 1.3 0 0 1 2.6 0V14l-2 2.2V20"/>'
  };
  // APGAR: sign | 0 | 1 | 2
  var APGAR = rowsOf('apgar').map(function(r){ return { sign: r[0], o: [r[1], r[2], r[3]] }; });
  // PAT: side | what you look at | abnormal suggests
  var PAT = rowsOf('pat').map(function(r){ return { side: r[0], look: r[1], means: r[2] }; });

  /* ---- what a score means -------------------------------------------------- */
  function gcsRead(t, s){
    if(t <= 8) return { tone: 'bad', h: 'Severe (8 or below)', p: 'The classic threshold for an airway that will not protect itself: manage the airway and transport.' };
    if(t <= 12) return { tone: 'warn', h: 'Moderate (9 to 12)', p: 'A significant drop from normal. Report the parts and recheck: the trend beats the number.' };
    if(t < 15) return { tone: 'warn', h: 'Mild (13 or 14)', p: 'Not fully alert and oriented. Recheck in a few minutes; a falling score is the finding.' };
    return { tone: 'good', h: 'Normal (15)', p: 'Eyes open on their own, oriented, obeys commands.' };
  }
  function apgarRead(t){
    if(t >= 7) return { tone: 'good', h: '7 to 10: reassuring', p: 'Routine newborn care: keep the baby warm and dry, and score again at 5 minutes.' };
    if(t >= 4) return { tone: 'warn', h: '4 to 6: moderately abnormal', p: 'This baby needs help: dry, warm and stimulate; ventilate with a BVM if the baby is not breathing, is gasping, or the heart rate is under 100. Score again at 5 minutes.' };
    return { tone: 'bad', h: '0 to 3: low', p: 'Resuscitate now, by the newborn steps your program teaches. Care never waits for the score: the score records what you saw.' };
  }
  // The combinations, by the sides marked abnormal (A appearance, B work of breathing, C circulation).
  var PAT_READ = {
    '':    { tone: 'good', h: 'Stable', p: 'All three sides look normal. Go on to the hands-on assessment.' },
    'A':   { tone: 'warn', h: 'Something systemic', p: 'Appearance alone: think of a brain or metabolic cause, such as hypoxia, hypoglycemia, sepsis, a head injury or a poisoning.' },
    'B':   { tone: 'warn', h: 'Respiratory distress', p: 'Working hard to breathe, appearance still normal: compensating for now. Watch for the appearance to change.' },
    'C':   { tone: 'warn', h: 'Compensated shock', p: 'Poor skin perfusion with a normal appearance: the body is still holding the pressure. Treat for shock and transport.' },
    'AB':  { tone: 'bad', h: 'Respiratory failure', p: 'Appearance plus breathing: the child is no longer compensating. Support breathing and transport now.' },
    'AC':  { tone: 'bad', h: 'Shock (decompensated)', p: 'Appearance plus skin: the brain is no longer getting enough. Treat for shock and transport now.' },
    'BC':  { tone: 'warn', h: 'Breathing and perfusion both abnormal', p: 'Two sides abnormal with a normal appearance: still compensating, but treat both and reassess often.' },
    'ABC': { tone: 'bad', h: 'Cardiopulmonary failure', p: 'All three: the child who is about to arrest. Support breathing and circulation and transport now.' }
  };

  /* ---- practice patients ----------------------------------------------------
     Each is written so every component has one answer from the table above. */
  var GCS_CASES = [
    { t: 'An adult after a fall. Eyes open only when you speak to him. He answers in full sentences but thinks it is last year. He squeezes your hand when asked.', a: { E: 3, V: 4, M: 6 },
      hint: { E: 'He opens them when you speak: eyes to voice.', V: 'Sentences, but the wrong year: confused, not oriented.', M: 'He does what you ask: obeys commands.' } },
    { t: 'A driver after a crash. Eyes closed, opening only to a trapezius squeeze. He moans without words. To the squeeze his arm comes up to your hand and tries to push it away.', a: { E: 2, V: 2, M: 5 },
      hint: { E: 'Eyes open only to pain.', V: 'Sounds with no words: incomprehensible.', M: 'His hand goes to where the pain is: localizes.' } },
    { t: 'A woman found down. No eye opening to anything. No sound at all. To a painful stimulus her arms straighten at the elbows and turn inward.', a: { E: 1, V: 1, M: 2 },
      hint: { E: 'Nothing opens them: none.', V: 'No sound: none.', M: 'Arms straighten and turn in: extension (decerebrate).' } },
    { t: 'A teenager after a seizure. Eyes open on their own. He says random words that do not answer your questions. He pulls his hand away from a pinch.', a: { E: 4, V: 3, M: 4 },
      hint: { E: 'Open without being asked: spontaneous.', V: 'Real words, but not a conversation: inappropriate words.', M: 'Moves away from the pinch: withdraws.' } }
  ];
  var APGAR_CASES = [
    { t: 'At one minute: body pink, hands and feet blue. Heart rate 120. Cries when you flick the soles. Arms and legs flexed and moving. Strong cry.', a: [1, 2, 2, 2, 2],
      hint: ['Pink body, blue hands and feet is acrocyanosis: it scores 1, not 2.', 'Over 100.', 'A cry to stimulation is the top score.', 'Moving actively.', 'A strong cry.'] },
    { t: 'At one minute: blue all over. Heart rate 80. Grimaces when you suction. Some flexion of the arms. Slow, irregular breaths with a weak cry.', a: [0, 1, 1, 1, 1],
      hint: ['Blue all over: 0.', 'Under 100: 1.', 'A grimace only: 1.', 'Some flexion: 1.', 'Slow and irregular, weak cry: 1.'] },
    { t: 'At five minutes: completely pink. Heart rate 140. Sneezes when you touch the nose. Moving all limbs. Strong cry.', a: [2, 2, 2, 2, 2],
      hint: ['Completely pink: 2.', 'Over 100: 2.', 'Cries, coughs or sneezes: 2.', 'Active motion: 2.', 'Strong cry: 2.'] }
  ];
  var PAT_CASES = [
    { t: 'From the doorway: a 3-year-old sitting up, alert and watching you, crying when you come close. Nasal flaring and retractions above the collarbones. Skin pink.', a: 'B',
      hint: 'Is the appearance normal? A child who watches you and protests is. Then look at the work of breathing, then the skin.' },
    { t: 'From the doorway: a 9-month-old limp in a parent\'s arms, not looking at anyone, not consoled. Breathing quietly with no extra effort. Skin mottled and pale.', a: 'AC',
      hint: 'Limp and not consolable is an abnormal appearance. The breathing is quiet. Mottled skin is poor circulation.' },
    { t: 'From the doorway: a 2-year-old playing with a toy, babbling to a parent. Breathing quietly. Skin pale and mottled, hands cool.', a: 'C',
      hint: 'Playing and babbling is a normal appearance. The breathing is easy. Only the skin is wrong.' }
  ];

  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function icon(p){ return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + p + '</svg>'; }

  /* ---- mount ----------------------------------------------------------------- */
  function mount(studio){
    var stage = document.createElement('div'); stage.className = 'rc-stage';
    var dock = document.createElement('div'); dock.className = 'rc-dock';

    /* GCS: three columns of buttons, the total above them */
    var gcs = document.createElement('div'); gcs.className = 'rc-gcs'; gcs.setAttribute('data-rc', 'gcs');
    var gsel = { E: 4, V: 5, M: 6 };
    gcs.innerHTML = '<div class="rc-total" aria-live="polite"><span class="rc-total-n" id="rcGcsN">15</span><span class="rc-total-k">GCS<br><span id="rcGcsParts">E4 V5 M6</span></span></div>' +
      '<div class="rc-cols">' + ['E', 'V', 'M'].map(function(k){
        return '<div class="rc-col" role="radiogroup" aria-label="' + GCS_NAME[k] + '"><div class="rc-col-h">' + icon(GCS_ICON[k]) + '<span>' + GCS_NAME[k].split(' ')[0] + '</span></div>' +
          GCS[k].map(function(o){ return '<button type="button" role="radio" class="rc-opt" data-k="' + k + '" data-n="' + o.n + '"><b>' + o.n + '</b><span>' + esc(o.t) + '</span></button>'; }).join('') + '</div>';
      }).join('') + '</div>';

    /* APGAR: five rows of three */
    var ap = document.createElement('div'); ap.className = 'rc-apgar'; ap.setAttribute('data-rc', 'apgar');
    var asel = APGAR.map(function(){ return 2; });
    ap.innerHTML = '<div class="rc-total" aria-live="polite"><span class="rc-total-n" id="rcApN">10</span><span class="rc-total-k">APGAR<br>out of 10</span></div>' +
      '<div class="rc-ap-rows">' + APGAR.map(function(r, i){
        return '<div class="rc-ap-row" role="radiogroup" aria-label="' + esc(r.sign) + '"><div class="rc-ap-h"><b>' + esc(r.sign.charAt(0)) + '</b>' + esc(r.sign.slice(1)) + '</div>' +
          '<div class="rc-ap-opts">' + r.o.map(function(t, n){ return '<button type="button" role="radio" class="rc-opt" data-i="' + i + '" data-n="' + n + '"><b>' + n + '</b><span>' + esc(t) + '</span></button>'; }).join('') + '</div></div>';
      }).join('') + '</div>';

    /* PAT: an SVG triangle, each side a button */
    var pat = document.createElement('div'); pat.className = 'rc-pat'; pat.setAttribute('data-rc', 'pat');
    var psel = { A: false, B: false, C: false };
    var SIDES = [
      { k: 'A', d: 'M160 28 L52 216', lx: 92, ly: 104, anchor: 'end', name: PAT[0] ? PAT[0].side : 'Appearance' },
      { k: 'B', d: 'M160 28 L268 216', lx: 228, ly: 104, anchor: 'start', name: PAT[1] ? PAT[1].side : 'Work of breathing' },
      { k: 'C', d: 'M52 216 L268 216', lx: 160, ly: 246, anchor: 'middle', one: true, name: PAT[2] ? PAT[2].side : 'Circulation to skin' }
    ];
    pat.innerHTML = '<svg class="rc-tri" viewBox="-36 0 392 272" role="group" aria-label="The pediatric assessment triangle: tap a side to mark it abnormal">' +
      '<path class="rc-tri-fill" d="M160 28 L268 216 L52 216 Z"/>' +
      SIDES.map(function(s){
        return '<g class="rc-side" data-side="' + s.k + '" role="button" tabindex="0" aria-pressed="false" aria-label="' + esc(s.name) + ': normal. Tap to mark it abnormal">' +
          '<path class="rc-side-hit" d="' + s.d + '"/><path class="rc-side-line" d="' + s.d + '"/>' +
          '<text class="rc-side-t" x="' + s.lx + '" y="' + s.ly + '" text-anchor="' + s.anchor + '">' + (s.one ? [s.name] : s.name.split(' ')).map(function(w, j){ return '<tspan x="' + s.lx + '" dy="' + (j ? 15 : 0) + '">' + esc(w) + '</tspan>'; }).join('') + '</text>' +
          '<text class="rc-side-s" x="' + s.lx + '" y="' + (s.ly + (s.one ? 1 : s.name.split(' ').length) * 15 + 2) + '" text-anchor="' + s.anchor + '">normal</text></g>';
      }).join('') +
      '<g class="rc-tri-mid"><text class="rc-mid-h" x="160" y="150" text-anchor="middle">Stable</text></g>' +
      '</svg>' +
      '<div class="rc-pat-read" aria-live="polite"></div>';

    /* the vitals check, as it was */
    var vit = document.createElement('div'); vit.className = 'rc-vitals'; vit.setAttribute('data-rc', 'vitals');
    var vc = document.getElementById('vitalsCheck'); if(vc) vit.appendChild(vc);

    stage.append(vit, gcs, ap, pat);

    /* practice: the patient in the dock, Check / hint / Show the answer */
    var prac = document.createElement('div'); prac.className = 'rc-prac'; prac.hidden = true;
    var mode = 'vitals', practicing = false, pcase = null, hinted = false, revealed = false, decks = {};
    dock.innerHTML = '<div class="ls-row rc-acts"><button type="button" class="ls-btn rc-practice">Score a patient</button><button type="button" class="ls-btn rc-reset">Reset</button></div>';
    dock.appendChild(prac);

    function paintGcs(){
      gcs.querySelectorAll('.rc-opt').forEach(function(b){ var on = gsel[b.dataset.k] === +b.dataset.n; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      var t = gsel.E + gsel.V + gsel.M, r = gcsRead(t);
      gcs.querySelector('#rcGcsN').textContent = t;
      gcs.querySelector('#rcGcsParts').textContent = 'E' + gsel.E + ' V' + gsel.V + ' M' + gsel.M;
      gcs.querySelector('.rc-total').setAttribute('data-tone', r.tone);
      if(mode === 'gcs' && !practicing){
        studio.caption('<b>GCS ' + t + ' (E' + gsel.E + ' V' + gsel.V + ' M' + gsel.M + ').</b> ' + r.h + ': ' + r.p, 'gcs');
        studio.pills([{ html: 'GCS ' + t, tone: r.tone === 'good' ? 'good' : r.tone === 'bad' ? 'bad' : 'warn' }], 'right', 'gcs');
      }
    }
    function paintAp(){
      ap.querySelectorAll('.rc-opt').forEach(function(b){ var on = asel[+b.dataset.i] === +b.dataset.n; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      var t = asel.reduce(function(a, b){ return a + b; }, 0), r = apgarRead(t);
      ap.querySelector('#rcApN').textContent = t;
      ap.querySelector('.rc-total').setAttribute('data-tone', r.tone);
      if(mode === 'apgar' && !practicing){
        var trap = asel[0] === 1 ? ' <span class="tmuted">Pink body, blue hands and feet scores 1: that is acrocyanosis.</span>' : '';
        studio.caption('<b>APGAR ' + t + '.</b> ' + r.h + '. ' + r.p + trap, 'apgar');
        studio.pills([{ html: 'APGAR ' + t, tone: r.tone === 'good' ? 'good' : r.tone === 'bad' ? 'bad' : 'warn' }], 'right', 'apgar');
      }
    }
    function patKey(sel){ return ['A', 'B', 'C'].filter(function(k){ return sel[k]; }).join(''); }
    function paintPat(){
      var key = patKey(psel), r = PAT_READ[key];
      pat.querySelectorAll('.rc-side').forEach(function(g){
        var k = g.getAttribute('data-side'), on = psel[k], s = SIDES.filter(function(x){ return x.k === k; })[0];
        g.classList.toggle('on', on); g.setAttribute('aria-pressed', on ? 'true' : 'false');
        g.setAttribute('aria-label', s.name + ': ' + (on ? 'abnormal' : 'normal') + '. Tap to mark it ' + (on ? 'normal' : 'abnormal'));
        g.querySelector('.rc-side-s').textContent = on ? 'abnormal' : 'normal';
      });
      pat.querySelector('.rc-tri').setAttribute('data-tone', r.tone);
      var mid = pat.querySelector('.rc-mid-h'), words = r.h.split(' '), lines = [];
      words.forEach(function(w){ var l = lines[lines.length - 1]; if(l && (l + ' ' + w).length <= 13) lines[lines.length - 1] = l + ' ' + w; else lines.push(w); });
      mid.innerHTML = lines.map(function(l, j){ return '<tspan x="160" dy="' + (j ? 17 : -(lines.length - 1) * 8.5) + '">' + esc(l) + '</tspan>'; }).join('');
      var rows = ['A', 'B', 'C'].filter(function(k){ return psel[k]; }).map(function(k){ var i = 'ABC'.indexOf(k), p = PAT[i]; return p ? '<li><b>' + esc(p.side) + ':</b> ' + esc(p.look) + '. <span class="tmuted">Abnormal suggests ' + esc(p.means.charAt(0).toLowerCase() + p.means.slice(1)) + '.</span></li>' : ''; });
      pat.querySelector('.rc-pat-read').innerHTML = rows.length ? '<ul>' + rows.join('') + '</ul>' : '<p class="tmuted">Tap a side of the triangle to mark it abnormal.</p>';
      if(mode === 'pat' && !practicing){
        studio.caption('<b>' + r.h + '.</b> ' + r.p, 'pat');
        studio.pills([{ html: r.h, tone: r.tone === 'good' ? 'good' : r.tone === 'bad' ? 'bad' : 'warn' }], 'right', 'pat');
      }
    }

    /* After a wrong Check the student may change an answer and Check again
       (the marks clear); after Show the answer, or a right one, it stays. */
    function unlock(el){
      if(!el.classList.contains('is-checked')) return true;
      var v = prac.querySelector('.rc-verdict');
      if(!practicing || revealed || !v || !v.classList.contains('no')) return false;
      el.classList.remove('is-checked');
      el.querySelectorAll('.is-right,.is-wrong,.is-key').forEach(function(n){ n.classList.remove('is-right', 'is-wrong', 'is-key'); });
      v.className = 'rc-verdict'; v.innerHTML = '';
      prac.querySelector('.rc-prac-acts').hidden = false; prac.querySelector('.rc-prac-acts2').hidden = true;
      return true;
    }
    gcs.addEventListener('click', function(e){
      var b = e.target.closest('.rc-opt'); if(!b || !unlock(gcs)) return;
      gsel[b.dataset.k] = +b.dataset.n; paintGcs(); if(practicing) pracState();
    });
    ap.addEventListener('click', function(e){
      var b = e.target.closest('.rc-opt'); if(!b || !unlock(ap)) return;
      asel[+b.dataset.i] = +b.dataset.n; paintAp(); if(practicing) pracState();
    });
    function toggleSide(g){ if(!unlock(pat)) return; var k = g.getAttribute('data-side'); psel[k] = !psel[k]; paintPat(); if(practicing) pracState(); }
    pat.addEventListener('click', function(e){ var g = e.target.closest('.rc-side'); if(g) toggleSide(g); });
    pat.addEventListener('keydown', function(e){ var g = e.target.closest('.rc-side'); if(g && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); toggleSide(g); } });
    // Arrow keys move within a radio column.
    stage.addEventListener('keydown', function(e){
      var b = e.target.closest('.rc-opt'); if(!b || !/Arrow(Up|Down|Left|Right)/.test(e.key)) return;
      var sib = [].slice.call(b.parentNode.querySelectorAll('.rc-opt')), i = sib.indexOf(b);
      var j = /Up|Left/.test(e.key) ? Math.max(0, i - 1) : Math.min(sib.length - 1, i + 1);
      if(j !== i){ e.preventDefault(); sib[j].focus(); sib[j].click(); }
    });

    /* ---- practice ---- */
    function nextCase(){
      var pool = mode === 'gcs' ? GCS_CASES : mode === 'apgar' ? APGAR_CASES : PAT_CASES;
      if(!decks[mode] || !decks[mode].length) decks[mode] = shuffle(pool);
      pcase = decks[mode].shift(); hinted = false; revealed = false;
      // start from a blank answer: nothing chosen
      if(mode === 'gcs') gsel = { E: 0, V: 0, M: 0 };
      if(mode === 'apgar') asel = APGAR.map(function(){ return -1; });
      if(mode === 'pat') psel = { A: false, B: false, C: false };
      [gcs, ap, pat].forEach(function(x){ x.classList.remove('is-checked'); x.querySelectorAll('.is-right,.is-wrong,.is-key').forEach(function(n){ n.classList.remove('is-right', 'is-wrong', 'is-key'); }); });
      paintGcs(); paintAp(); paintPat();
      if(mode === 'gcs'){ gcs.querySelector('#rcGcsN').textContent = '?'; gcs.querySelector('#rcGcsParts').textContent = 'E? V? M?'; }
      if(mode === 'apgar') ap.querySelector('#rcApN').textContent = '?';
      prac.innerHTML = '<p class="rc-case"><b>The patient.</b> ' + esc(pcase.t) + '</p>' +
        '<p class="rc-hint" hidden></p><div class="rc-verdict" role="status" aria-live="polite"></div>' +
        '<div class="ls-row rc-prac-acts"><button type="button" class="ls-btn rc-hintb">Hint</button><button type="button" class="ls-btn ls-pri rc-check">Check</button></div>' +
        '<div class="ls-row rc-prac-acts2" hidden><button type="button" class="ls-btn rc-show">Show the answer</button><button type="button" class="ls-btn ls-pri rc-next">Next patient</button></div>';
      studio.caption(mode === 'pat' ? '<b>From the doorway:</b> tap each side of the triangle that looks abnormal, then Check.' : '<b>Score this patient:</b> tap one answer in each ' + (mode === 'gcs' ? 'column' : 'row') + ', then Check.', mode);
      studio.pills([{ html: 'Practice', tone: 'accent' }], 'right', mode);
      pracState();
    }
    function chosenAll(){
      if(mode === 'gcs') return gsel.E && gsel.V && gsel.M;
      if(mode === 'apgar') return asel.every(function(n){ return n >= 0; });
      return true;
    }
    function pracState(){ var c = prac.querySelector('.rc-check'); if(c) c.disabled = !chosenAll() || stageEl().classList.contains('is-checked'); }
    function stageEl(){ return mode === 'gcs' ? gcs : mode === 'apgar' ? ap : pat; }
    function mark(showKey){
      var wrong = 0, el = stageEl();
      el.classList.add('is-checked');
      if(mode === 'gcs'){
        ['E', 'V', 'M'].forEach(function(k){
          var want = pcase.a[k], got = gsel[k];
          el.querySelectorAll('.rc-opt[data-k="' + k + '"]').forEach(function(b){
            var n = +b.dataset.n;
            if(n === got) b.classList.add(n === want ? 'is-right' : 'is-wrong');
            if(showKey && n === want && n !== got) b.classList.add('is-key');
          });
          if(got !== want) wrong++;
        });
      } else if(mode === 'apgar'){
        APGAR.forEach(function(r, i){
          var want = pcase.a[i], got = asel[i];
          el.querySelectorAll('.rc-opt[data-i="' + i + '"]').forEach(function(b){
            var n = +b.dataset.n;
            if(n === got) b.classList.add(n === want ? 'is-right' : 'is-wrong');
            if(showKey && n === want && n !== got) b.classList.add('is-key');
          });
          if(got !== want) wrong++;
        });
      } else {
        ['A', 'B', 'C'].forEach(function(k){
          var want = pcase.a.indexOf(k) >= 0, got = psel[k], g = el.querySelector('[data-side="' + k + '"]');
          g.classList.add(got === want ? 'is-right' : 'is-wrong');
          if(got !== want) wrong++;
          if(showKey && want) g.classList.add('is-key');
        });
      }
      return wrong;
    }
    function verdictText(wrong){
      var right = wrong === 0;
      if(mode === 'gcs'){
        var t = pcase.a.E + pcase.a.V + pcase.a.M, g = gsel.E + gsel.V + gsel.M;
        return (right ? '<b>Right: GCS ' + t + ' (E' + pcase.a.E + ' V' + pcase.a.V + ' M' + pcase.a.M + ').</b>' : '<b>You scored ' + g + ' (E' + gsel.E + ' V' + gsel.V + ' M' + gsel.M + '); it is ' + t + ' (E' + pcase.a.E + ' V' + pcase.a.V + ' M' + pcase.a.M + ').</b> The right answer is outlined in each column.') +
          '<ul>' + ['E', 'V', 'M'].map(function(k){ return '<li' + (gsel[k] === pcase.a[k] ? '' : ' class="no"') + '><b>' + GCS_NAME[k] + ' ' + pcase.a[k] + ':</b> ' + esc(pcase.hint[k]) + '</li>'; }).join('') + '</ul>';
      }
      if(mode === 'apgar'){
        var ta = pcase.a.reduce(function(a, b){ return a + b; }, 0), ga = asel.reduce(function(a, b){ return a + Math.max(0, b); }, 0);
        return (right ? '<b>Right: APGAR ' + ta + '.</b>' : '<b>You scored ' + ga + '; it is ' + ta + '.</b> The right answer is outlined in each row.') +
          '<ul>' + APGAR.map(function(r, i){ return asel[i] === pcase.a[i] ? '' : '<li class="no"><b>' + esc(r.sign) + ' ' + pcase.a[i] + ':</b> ' + esc(pcase.hint[i]) + '</li>'; }).join('') + '</ul>';
      }
      var want = PAT_READ[pcase.a].h, got = PAT_READ[patKey(psel)].h;
      return (right ? '<b>Right: ' + want + '.</b>' : '<b>You marked ' + got.toLowerCase() + '; it is ' + want.toLowerCase() + '.</b> The sides you got wrong are marked on the triangle.') + ' ' + esc(PAT_READ[pcase.a].p);
    }
    prac.addEventListener('click', function(e){
      if(e.target.closest('.rc-hintb')){
        var h = prac.querySelector('.rc-hint');
        h.hidden = false; hinted = true;
        h.innerHTML = '<b>Method.</b> ' + (mode === 'gcs' ? 'Take each column alone: what opens the eyes, the best words, the best movement. Score the best response you saw.'
          : mode === 'apgar' ? 'Go down the five signs in order and give each 0, 1 or 2 from its own row. Watch the color row: pink body with blue hands and feet is 1.'
          : esc(pcase.hint));
        return;
      }
      if(e.target.closest('.rc-check')){
        var wrong = mark();
        var v = prac.querySelector('.rc-verdict');
        v.className = 'rc-verdict ' + (wrong ? 'no' : 'ok');
        v.innerHTML = wrong ? '<b>Not quite: ' + wrong + ' ' + (mode === 'pat' ? 'side' : 'part') + (wrong === 1 ? '' : 's') + ' off,</b> marked in red. Change ' + (wrong === 1 ? 'it' : 'them') + ' and Check again, or show the answer.' : verdictText(0);
        prac.querySelector('.rc-prac-acts').hidden = true;
        var a2 = prac.querySelector('.rc-prac-acts2'); a2.hidden = false;
        prac.querySelector('.rc-show').hidden = !wrong;
        if(wrong){ prac.querySelector('.rc-show').focus(); } else prac.querySelector('.rc-next').focus();
        studio.pills([{ html: wrong ? 'Not quite' : 'Right', tone: wrong ? 'bad' : 'good' }], 'right', mode);
        if(window.LevlSound) window.LevlSound.answer(!wrong);
        if(window.NremtToolResults) window.NremtToolResults.record({ tool: 'reference-cards', id: mode + ':' + pcase.t.slice(0, 40), correct: !wrong,
          label: (mode === 'gcs' ? 'GCS' : mode === 'apgar' ? 'APGAR' : 'Pediatric triangle') + ': score a patient', href: 'reference-cards.html#' + (mode === 'pat' ? 'pat' : mode) });
        return;
      }
      if(e.target.closest('.rc-show')){
        var v2 = prac.querySelector('.rc-verdict');
        v2.innerHTML = verdictText(1);
        prac.querySelector('.rc-show').hidden = true;
        // draw the answer: in the PAT, the right sides
        revealed = true; mark(true);
        return;
      }
      if(e.target.closest('.rc-next')) nextCase();
    });

    function setPractice(on){
      practicing = on && mode !== 'vitals';
      prac.hidden = !practicing;
      dock.querySelector('.rc-practice').textContent = practicing ? 'Stop practice' : 'Score a patient';
      dock.querySelector('.rc-practice').setAttribute('aria-pressed', practicing ? 'true' : 'false');
      dock.querySelector('.rc-reset').hidden = practicing;
      if(practicing) nextCase();
      else { [gcs, ap, pat].forEach(function(x){ x.classList.remove('is-checked'); x.querySelectorAll('.is-right,.is-wrong,.is-key').forEach(function(n){ n.classList.remove('is-right', 'is-wrong', 'is-key'); }); }); reset(); }
    }
    function reset(){ gsel = { E: 4, V: 5, M: 6 }; asel = APGAR.map(function(){ return 2; }); psel = { A: false, B: false, C: false }; paintGcs(); paintAp(); paintPat(); }
    dock.querySelector('.rc-practice').addEventListener('click', function(){ setPractice(!practicing); });
    dock.querySelector('.rc-reset').addEventListener('click', reset);

    function show(m){
      mode = m;
      stage.querySelectorAll('[data-rc]').forEach(function(x){ x.hidden = x.getAttribute('data-rc') !== m; });
      stage.setAttribute('data-mode', m);
      dock.querySelector('.rc-acts').hidden = m === 'vitals';
      if(practicing){ practicing = false; prac.hidden = true; dock.querySelector('.rc-practice').textContent = 'Score a patient'; dock.querySelector('.rc-practice').setAttribute('aria-pressed', 'false'); dock.querySelector('.rc-reset').hidden = false; reset(); }
      if(m === 'vitals'){ studio.caption('Slide to an age, then type a vital sign to check it against that row.', 'vitals'); studio.pills([], 'right', 'vitals'); }
      paintGcs(); paintAp(); paintPat();
    }
    reset();
    return { stage: stage, dock: dock, show: show };
  }

  window.NremtRefCards = { mount: mount, pure: { GCS: GCS, APGAR: APGAR, PAT: PAT, PAT_READ: PAT_READ, gcsRead: gcsRead, apgarRead: apgarRead, GCS_CASES: GCS_CASES, APGAR_CASES: APGAR_CASES, PAT_CASES: PAT_CASES } };
})();
