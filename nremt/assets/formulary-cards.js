/* "Give or withhold?": a stack of patients, one drug decision each.

   ONE JOB: practice the decision the formulary page is about, which is what
   stops you, by meeting a patient and deciding.

   EVERY CARD IS TIED TO THE PAGE. `rule` is an exact phrase from that drug's
   card on formulary.html; the answer shows the whole line it sits in (read
   from the DOM, not copied), plus the card's dose line, so the deciding fact
   and the page can never disagree. scripts/test/nremt-cases.test.mjs fails
   if a phrase is no longer on the drug's card. The patients themselves are
   minimal: only the findings the rule needs, nothing that would raise a
   second question the page does not answer. */
(function(){
  'use strict';
  var CARDS = [
    { id: 'asa-give', drug: 'Aspirin', give: true,
      pt: '58-year-old with crushing chest pain for 20 minutes, pale and sweaty.', vitals: 'HR 96 · BP 138/88 · SpO₂ 98%', hx: 'High cholesterol. No allergies.', meds: 'Atorvastatin',
      rule: 'Chest pain or discomfort of suspected cardiac origin' },
    { id: 'asa-daily', drug: 'Aspirin', give: true,
      pt: '66-year-old with chest pressure radiating to the jaw.', vitals: 'HR 88 · BP 146/90', hx: 'Prior heart attack. No allergies, no bleeding problems.', meds: 'Aspirin 81 mg every morning, taken today',
      rule: 'a maintenance dose is not a treatment dose' },
    { id: 'asa-gi', drug: 'Aspirin', give: false,
      pt: '61-year-old with chest pain of suspected cardiac origin.', vitals: 'HR 104 · BP 118/74', hx: 'Vomited dark, coffee-ground material twice this morning; black stools for two days.', meds: 'None',
      rule: 'Active gastrointestinal bleeding' },
    { id: 'asa-teen', drug: 'Aspirin', give: false,
      pt: '15-year-old with chest pain your partner thinks could be cardiac.', vitals: 'HR 92 · BP 118/70', hx: 'Healthy.', meds: 'None',
      rule: 'risk of Reye' },
    { id: 'ntg-give', drug: 'Nitroglycerin', give: true,
      pt: '64-year-old with chest pain of suspected cardiac origin, aspirin already given.', vitals: 'HR 84 · BP 148/90', hx: 'Angina. No head injury.', meds: 'Her own prescribed nitroglycerin, none taken today. No sildenafil-type drug.',
      rule: 'in a patient with their own prescribed nitroglycerin' },
    { id: 'ntg-sbp', drug: 'Nitroglycerin', give: false,
      pt: '70-year-old with chest pain, lightheaded.', vitals: 'HR 90 · BP 86/58', hx: 'Angina.', meds: 'His own prescribed nitroglycerin, none taken today.',
      rule: 'Systolic blood pressure below 100 mmHg' },
    { id: 'ntg-pde5', drug: 'Nitroglycerin', give: false,
      pt: '55-year-old with chest pain of suspected cardiac origin.', vitals: 'HR 82 · BP 140/86', hx: 'Angina.', meds: 'His own nitroglycerin. Took sildenafil last night.',
      rule: 'A sildenafil-type drug in the last 24' },
    { id: 'ntg-max', drug: 'Nitroglycerin', give: false,
      pt: '68-year-old with chest pain that has not eased.', vitals: 'HR 86 · BP 136/84', hx: 'Angina.', meds: 'Her own nitroglycerin: three tablets taken in the last 15 minutes.',
      rule: 'Maximum dose already taken' },
    { id: 'ntg-none', drug: 'Nitroglycerin', give: false,
      pt: '50-year-old with first-ever chest pain.', vitals: 'HR 88 · BP 150/92', hx: 'No cardiac history.', meds: 'None. A bystander offers his own nitroglycerin.',
      rule: 'in a patient with their own prescribed nitroglycerin' },
    { id: 'glu-give', drug: 'Oral glucose', give: true,
      pt: '45-year-old diabetic, confused and sweaty, sitting up.', vitals: 'Glucose 48 mg/dL · HR 104', hx: 'Type 1 diabetes. Swallows on command when you ask.', meds: 'Insulin',
      rule: 'in a patient who can still swallow and protect their airway' },
    { id: 'glu-unresp', drug: 'Oral glucose', give: false,
      pt: '52-year-old diabetic found on the floor, responds only to pain.', vitals: 'Glucose 38 mg/dL · HR 110', hx: 'Type 2 diabetes.', meds: 'Insulin',
      rule: 'Unresponsive, or unable to swallow' },
    { id: 'epi-give', drug: 'Epinephrine', give: true,
      pt: '16-year-old who ate peanuts 10 minutes ago: hives spreading, throat "tight".', vitals: 'HR 112 · BP 120/76 · SpO₂ 95%', hx: 'Known peanut allergy.', meds: 'His own epinephrine auto-injector',
      rule: 'a likely allergen plus more than one body system involved' },
    { id: 'epi-skin', drug: 'Epinephrine', give: false,
      pt: '30-year-old with itchy hives on both arms after a new antibiotic.', vitals: 'HR 84 · BP 124/80 · SpO₂ 99%', hx: 'Breathing easily, voice normal, no swelling, no GI symptoms.', meds: 'Her own epinephrine auto-injector',
      rule: 'Skin findings alone are an allergic reaction, not anaphylaxis',
      note: 'Withhold for now, not for good. Keep the auto-injector at hand, reassess often and transport: the moment her breathing, voice, swallowing, gut or blood pressure is involved, this is anaphylaxis and she gets it. If her own action plan or your protocol says otherwise for her, follow it.' },
    { id: 'epi-heart', drug: 'Epinephrine', give: true,
      pt: '72-year-old stung by a bee: wheezing, lips swelling, hives.', vitals: 'HR 118 · BP 84/50', hx: 'Coronary artery disease, hypertension. Known bee allergy.', meds: 'His own epinephrine auto-injector',
      rule: 'not reasons to withhold it from someone whose airway is closing' },
    { id: 'nlx-give', drug: 'Naloxone', give: true,
      pt: '30-year-old slumped with a needle nearby, pinpoint pupils; you are ventilating with a BVM.', vitals: 'HR 58 · RR 4 · SpO₂ 82%', hx: 'Unknown.', meds: 'Unknown',
      rule: 'Suspected opioid overdose' },
    { id: 'nlx-breathing', drug: 'Naloxone', give: false,
      pt: '27-year-old who says he used heroin an hour ago; drowsy but talking.', vitals: 'HR 76 · RR 16 · SpO₂ 97%', hx: 'Breathing adequately.', meds: 'None',
      rule: 'The indication is the breathing, not the drug use' },
    { id: 'alb-give', drug: 'Albuterol', give: true,
      pt: '24-year-old asthmatic, wheezing, speaking in short sentences.', vitals: 'HR 108 · RR 26 · SpO₂ 93%', hx: 'Asthma. Can follow instructions.', meds: 'Her own prescribed albuterol inhaler',
      rule: 'Bronchospasm with wheezing' },
    { id: 'o2-co', drug: 'Oxygen', give: true,
      pt: 'Family of four with headaches on the first cold night, furnace just switched on.', vitals: 'HR 96 · SpO₂ 99%', hx: 'All with the same symptoms.', meds: 'None',
      rule: 'high-flow regardless of the reading' },
    { id: 'o2-hypoxia', drug: 'Oxygen', give: true,
      pt: '70-year-old with pneumonia, breathing fast.', vitals: 'HR 102 · RR 26 · SpO₂ 89%', hx: 'Cough for four days.', meds: 'None',
      rule: 'Hypoxia (SpO' }
  ];

  var mount = document.getElementById('gwBox');
  if(!mount) return;

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function txt(el){ return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function reduced(){ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* The drug's card on the page, and the line in it that holds the rule. */
  function drugCard(name){
    var hs = document.querySelectorAll('.drug-grid .drug > h2');
    for(var i = 0; i < hs.length; i++) if(txt(hs[i]) === name) return hs[i].parentNode;
    return null;
  }
  function ruleLine(card, phrase){
    var els = card.querySelectorAll('li, dd, .stop');
    var norm = function(s){ return s.replace(/[‘’]/g, "'"); };
    for(var i = 0; i < els.length; i++){
      if(els[i].tagName === 'DD' && els[i].querySelector('li')) continue;
      if(norm(txt(els[i])).indexOf(norm(phrase)) >= 0) return els[i];
    }
    return null;
  }
  function section(el){
    if(el.classList && el.classList.contains('stop')) return 'Before you give it';
    var dd = el.tagName === 'DD' ? el : el.closest('dd');
    var dt = dd && dd.previousElementSibling;
    while(dt && dt.tagName !== 'DT') dt = dt.previousElementSibling;
    return dt ? txt(dt) : '';
  }

  var deck = [], at = 0, right = 0, answered = false;

  function start(){ deck = shuffle(CARDS).slice(0, 8); at = 0; right = 0; render(); }

  function render(){
    if(at >= deck.length){
      mount.innerHTML = '<div class="gw-end"><div class="gw-end-n">' + right + ' / ' + deck.length + '</div>' +
        '<p>' + (right === deck.length ? 'Every call right.' : 'The ones you missed went to your Review list.') + '</p>' +
        '<button type="button" class="btn-press" id="gwAgain">Deal again</button></div>';
      document.getElementById('gwAgain').addEventListener('click', start);
      return;
    }
    var c = deck[at];
    answered = false;
    mount.innerHTML =
      '<div class="gw-meta"><span>Card ' + (at + 1) + ' of ' + deck.length + '</span><span>' + right + ' right</span></div>' +
      '<div class="gw-stack">' +
        (at + 2 < deck.length ? '<div class="gw-under gw-under2" aria-hidden="true"></div>' : '') +
        (at + 1 < deck.length ? '<div class="gw-under" aria-hidden="true"></div>' : '') +
        '<article class="gw-card" id="gwCard" tabindex="-1" aria-labelledby="gwQ">' +
          '<div class="gw-drug"><span class="gw-pill">' + esc(c.drug) + '</span></div>' +
          '<p class="gw-pt">' + esc(c.pt) + '</p>' +
          '<dl class="gw-facts"><dt>Vitals</dt><dd class="gw-mono">' + esc(c.vitals) + '</dd>' +
            '<dt>History</dt><dd>' + esc(c.hx) + '</dd><dt>Meds</dt><dd>' + esc(c.meds) + '</dd></dl>' +
          '<p class="gw-q" id="gwQ">Give ' + esc(c.drug.toLowerCase()) + ', or withhold it?</p>' +
          '<div class="gw-stamp" aria-hidden="true"></div>' +
        '</article>' +
      '</div>' +
      '<div class="gw-btns"><button type="button" class="gw-btn gw-no" data-gw="0"><span aria-hidden="true">← </span>Withhold</button>' +
        '<button type="button" class="gw-btn gw-yes" data-gw="1">Give<span aria-hidden="true"> →</span></button></div>' +
      '<p class="gw-hint">Swipe the card, or press <kbd>←</kbd> withhold / <kbd>→</kbd> give.</p>' +
      '<div class="gw-why" id="gwWhy" role="status" aria-live="polite"></div>';
    mount.querySelectorAll('[data-gw]').forEach(function(b){
      b.addEventListener('click', function(){ decide(b.getAttribute('data-gw') === '1'); });
    });
    swipe(document.getElementById('gwCard'));
  }

  function decide(give){
    if(answered) return;
    answered = true;
    var c = deck[at], ok = give === c.give;
    if(ok) right++;
    var card = document.getElementById('gwCard');
    card.classList.add(give ? 'went-give' : 'went-hold', ok ? 'is-ok' : 'is-no');
    card.style.transform = '';
    card.querySelector('.gw-stamp').textContent = c.give ? 'Give' : 'Withhold';
    mount.querySelectorAll('[data-gw]').forEach(function(b){ b.disabled = true; });

    var dc = drugCard(c.drug), line = dc && ruleLine(dc, c.rule), dose = dc && dc.querySelector('dd.dose');
    var why = document.getElementById('gwWhy');
    why.innerHTML =
      '<div class="gw-verdict ' + (ok ? 'ok' : 'no') + '">' + (ok ? 'Right: ' : 'No: ') + (c.give ? 'give it.' : 'withhold it.') + '</div>' +
      (line ? '<div class="gw-rule"><span class="gw-rule-k">' + esc(c.drug) + ' · ' + esc(section(line)) + '</span>' + line.innerHTML + '</div>' : '') +
      (c.give && dose ? '<div class="gw-dose"><span class="gw-rule-k">Dose</span><b>' + esc(txt(dose)) + '</b>' +
        (dose.nextElementSibling && dose.nextElementSibling.tagName === 'DD' ? ' ' + dose.nextElementSibling.innerHTML : '') + '</div>' : '') +
      (c.note ? '<p class="gw-note">' + esc(c.note) + '</p>' : '') +
      '<div class="gw-after"><a href="#drug-' + c.drug.toLowerCase().replace(/[^a-z]+/g, '-') + '" class="link-quiet" data-show="' + esc(c.drug) + '">See the whole ' + esc(c.drug.toLowerCase()) + ' card</a>' +
      '<button type="button" class="btn-press" id="gwNext">Next patient</button></div>';
    var next = document.getElementById('gwNext');
    next.addEventListener('click', function(){ at++; render(); var cd = document.getElementById('gwCard'); if(cd) cd.focus({ preventScroll: true }); });
    next.focus({ preventScroll: true });
    // On a phone the reason is below the card: bring it up.
    if(window.innerWidth < 960){
      var r = why.getBoundingClientRect();
      if(r.bottom > window.innerHeight - 90) window.scrollBy({ top: r.top - 140, behavior: reduced() ? 'auto' : 'smooth' });
    }
    why.querySelector('[data-show]').addEventListener('click', function(e){
      e.preventDefault();
      if(!dc) return;
      dc.classList.remove('gw-flash'); void dc.offsetWidth; dc.classList.add('gw-flash');
      if(line){ line.classList.remove('gw-mark'); void line.offsetWidth; line.classList.add('gw-mark'); }
      dc.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    });
    if(window.NremtToolResults) window.NremtToolResults.record({
      tool: 'formulary', id: 'gw:' + c.id, correct: ok,
      label: c.drug + ': ' + c.pt, href: 'formulary.html#gw'
    });
    if(window.LevlAnnounce) window.LevlAnnounce.say((ok ? 'Right. ' : 'Not this time. ') + (c.give ? 'Give it. ' : 'Withhold it. ') + (line ? txt(line) : '') + (c.note ? ' ' + c.note : ''));
  }

  /* Drag the card sideways; past a third of its width it commits. */
  function swipe(card){
    var x0 = null, dx = 0, id = null;
    card.addEventListener('pointerdown', function(e){ if(answered || e.button > 0) return; x0 = e.clientX; dx = 0; id = e.pointerId; });
    card.addEventListener('pointermove', function(e){
      if(x0 == null || e.pointerId !== id) return;
      dx = e.clientX - x0;
      if(Math.abs(dx) < 6) return;
      try{ card.setPointerCapture(id); }catch(err){}
      card.style.transition = 'none';
      card.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 24) + 'deg)';
      card.classList.toggle('lean-give', dx > 40);
      card.classList.toggle('lean-hold', dx < -40);
    });
    function end(){
      if(x0 == null) return;
      x0 = null;
      card.style.transition = '';
      card.classList.remove('lean-give', 'lean-hold');
      if(Math.abs(dx) > card.offsetWidth / 3) decide(dx > 0);
      else card.style.transform = '';
    }
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
  }

  document.addEventListener('keydown', function(e){
    if(mount.hidden || answered || !document.getElementById('gwCard')) return;
    if(e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if(e.key === 'ArrowLeft'){ e.preventDefault(); decide(false); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); decide(true); }
  });

  /* Mode switch: the card stack first, the bank drill as before. */
  var sw = document.getElementById('fxMode'), drill = document.getElementById('drillBox');
  function mode(m){
    sw.querySelectorAll('button').forEach(function(b){
      var on = b.getAttribute('data-mode') === m;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    mount.hidden = m !== 'gw';
    if(drill) drill.hidden = m !== 'drill';
  }
  if(sw) sw.querySelectorAll('button').forEach(function(b){ b.addEventListener('click', function(){ mode(b.getAttribute('data-mode')); }); });
  mode(location.hash === '#drill' ? 'drill' : 'gw');
  start();

  window.NremtFormularyCards = { CARDS: CARDS };
})();
