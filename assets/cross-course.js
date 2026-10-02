/* Cross-course suggestions: "the other course goes deeper on this".

   Three courses on one site, and a student in one of them has no reason to
   know the others teach the thing they just struggled with. An EMT student who
   finished a cardiology drill is exactly the person A&P's cardiovascular
   chapter was written for; an ochem student who just did pKa is one step from
   understanding why blood pH holds at 7.4.

   THE MAPPING IS SMALL AND CURATED ON PURPOSE
   -------------------------------------------
   Every pair below was checked against what the target page actually teaches
   (scripts/test/cross-course.test.mjs pins each href to a real file and each
   "chapter N" to the A&P curriculum). A pair is here only when the target
   explains the mechanism behind the source — not when the two merely share a
   word. NREMT's "Medical" topic is deliberately NOT mapped to endocrine: one
   question in eight there is about glucose, and pointing the other seven at
   the pancreas would be a suggestion that teaches the student to ignore the
   next one. Only the diabetic scenario, which is entirely about glucose, is.

   Source tags are what an end screen passes in ctx.tags: `nremt:<question
   topic>` and `nremt:<scenario id>`, `ochem:<module id>` / `ochem:<topic id>`,
   `anp:<chapter id>` / `anp:<topic id>`.

   WHEN ONE IS SHOWN
   -----------------
   All of these, or nothing:
     - a milestone in the source topic has happened: a finished session,
       exam, scenario or lesson that included it (note(), from next-step.js);
     - the student has NOT started the target course (started(), below);
     - this pair has never been shown before. Once per pair, ever, whether it
       was clicked, dismissed or ignored;
     - no .levl-prompt (save, reminders, install) and no milestone
       celebration (.levl-cele, milestones.js) is on screen. Those ask for
       something the student already has a stake in, so they go first: on an
       end screen this waits out the 2.6 s and 3.4 s at which save and
       reminders ask, and stands down if either did. If one appears while a
       suggestion is up, the suggestion withdraws and is not counted as shown.
       The install prompt, in turn, does not open over one (site-chrome.js).

   Stored in levlprep_cross: milestone days per mapped tag and the day each
   pair was shown. Nothing here is sent anywhere except the click, as
   next-step-click {kind: 'cross-course'}. */
(function(){
  var KEY = 'levlprep_cross';
  var DAY = 86400000;
  var WAIT = 4500;   // after session-runner / practice-engine's save (2.6 s) and reminder (3.4 s) asks
  var A = '/anatomy-physiology/';

  // The styles for this and for the next step, linked once (next-step.css
  // says why they are not in theme.css). A dashboard loads only this file.
  var D = window.document;
  if(D && D.head && !D.getElementById('levlNextCss')){
    var css = D.createElement('link');
    css.id = 'levlNextCss'; css.rel = 'stylesheet'; css.href = '/assets/next-step.css';
    D.head.appendChild(css);
  }

  var MAP = [
    { id: 'nremt-cardiac', from: ['nremt:Cardiac', 'nremt:Cardiovascular', 'nremt:s2', 'nremt:s6'], to: 'anp',
      href: A + 'chapters/cardiovascular.html', link: 'Open A&P chapter 19',
      text: 'Cardiac calls lean on how the heart pumps and how its conduction system sets the rhythm. A&P chapter 19 teaches both from the start.' },
    { id: 'nremt-airway', from: ['nremt:Airway Management', 'nremt:Oxygenation & Ventilation', 'nremt:Respiratory Emergencies', 'nremt:s3', 'nremt:s10', 'nremt:s11'], to: 'anp',
      href: A + 'chapters/respiratory.html', link: 'Open A&P chapter 21',
      text: 'Airway and breathing calls rest on how air moves in and how oxygen crosses into the blood. A&P chapter 21 covers ventilation and gas exchange.' },
    { id: 'nremt-shock', from: ['nremt:Bleeding & Shock', 'nremt:s1'], to: 'anp',
      href: A + 'lessons/bp-short-term.html', link: 'Open the A&P lesson',
      text: 'Shock is the body defending its blood pressure as volume falls, which is where the fast pulse and pale, cool skin come from. A&P chapter 19 has a lesson on the baroreceptor reflex behind them.' },
    { id: 'nremt-burns', from: ['nremt:Musculoskeletal & Burns'], to: 'anp',
      href: A + 'lessons/skin-injury.html', link: 'Open the A&P lesson',
      text: 'Burn depth is a question of which layers of skin are gone. A&P chapter 6 teaches the layers, then how burns are classified and sized.' },
    { id: 'nremt-fractures', from: ['nremt:Musculoskeletal & Burns'], to: 'anp',
      href: A + 'chapters/skeleton.html', link: 'Open A&P chapter 8',
      text: 'Splinting starts with knowing which bone you are holding still. A&P chapter 8 walks the skeleton region by region.' },
    { id: 'nremt-chest', from: ['nremt:Head, Chest & Abdominal Trauma'], to: 'anp',
      href: A + 'lessons/ventilation-mechanics.html', link: 'Open the A&P lesson',
      text: 'A collapsed lung makes sense once you see how pressure in the pleural space holds the lung open. A&P chapter 21 explains it in its lesson on ventilation.' },
    { id: 'nremt-diabetic', from: ['nremt:s4'], to: 'anp',
      href: A + 'lessons/pancreas-glucose.html', link: 'Open the A&P lesson',
      text: 'A diabetic emergency is insulin and glucagon out of balance. A&P chapter 17 explains how the pancreas holds blood glucose steady.' },
    { id: 'nremt-anaphylaxis', from: ['nremt:s5'], to: 'anp',
      href: A + 'lessons/immune-disorders.html', link: 'Open the A&P lesson',
      text: 'Anaphylaxis is an allergic reaction gone body-wide. A&P chapter 20 explains the reaction and why epinephrine reverses it.' },
    { id: 'nremt-stroke', from: ['nremt:s7'], to: 'anp',
      href: A + 'lessons/brain-regions.html', link: 'Open the A&P lesson',
      text: 'Slurred speech and weakness on one side point to where in the brain the damage is. A&P chapter 13 maps the regions behind them.' },
    { id: 'nremt-ob', from: ['nremt:Obstetrics', 'nremt:s15', 'nremt:s16', 'nremt:s17', 'nremt:s18'], to: 'anp',
      href: A + 'chapters/development.html', link: 'Open A&P chapter 27',
      text: 'Delivery and newborn care follow the stages of labor and the switch from fetal to newborn circulation. A&P chapter 27 covers both.' },
    { id: 'nremt-pharm', from: ['nremt:Pharmacology'], to: 'anp',
      href: A + 'lessons/ans-signaling.html', link: 'Open the A&P lesson',
      text: 'Epinephrine and albuterol work on the alpha and beta receptors of the autonomic nervous system. A&P chapter 16 explains what each receptor does.' },
    // The two topic-level A&P pairs first: inside chapter 2 they say more than the chapter-level one.
    { id: 'anp-acid-base', from: ['anp:acids-bases-ph', 'anp:fluid-acid-base'], to: 'ochem',
      href: '/ochem/lessons/pka.html', link: 'Open the pKa lesson',
      text: 'The bicarbonate buffer is a weak acid and its conjugate base. Organic chemistry’s pKa lesson explains why some acids give up a proton far more readily than others.' },
    { id: 'anp-biomolecules', from: ['anp:biomolecules'], to: 'ochem',
      href: '/ochem/lessons/carbohydrates.html', link: 'Open the ochem chapter',
      text: 'A&P names the four families of biomolecules. Organic chemistry’s Biomolecules chapter shows how sugars, amino acids and lipids are built and how they react.' },
    { id: 'anp-chem', from: ['anp:chem-physics', 'anp:atoms-ions-bonds'], to: 'ochem',
      href: '/ochem/lessons/atomic-structure.html', link: 'Start organic chemistry',
      text: 'The atoms, bonds and polarity in A&P chapter 2 are where organic chemistry starts. The ochem course builds from them to how molecules react.' },
    { id: 'ochem-acid-base', from: ['ochem:acids-bases'], to: 'anp',
      href: A + 'lessons/acid-base-regulation.html', link: 'Open the A&P lesson',
      text: 'Blood pH is held by the same acid–base equilibrium you just worked through. A&P chapter 25 shows the lungs and kidneys running the bicarbonate buffer.' },
    { id: 'ochem-biomolecules', from: ['ochem:biomolecules'], to: 'anp',
      href: A + 'lessons/digestion-absorption.html', link: 'Open the A&P lesson',
      text: 'Digestion is the hydrolysis of these molecules. A&P chapter 22 follows carbohydrates, proteins and fats from the gut into the blood.' }
  ];

  /* Has the student started this course? XP in it, or any of the records only
     studying writes. A key a visit alone writes (a theme, a last-read page)
     is deliberately not on the list. */
  var STARTED = {
    nremt: ['nremt_mastery', 'nremt_exam100_history', 'nremt_flashcards_v1', 'nremt_domain_stats_all'],
    ochem: ['ochem_progress', 'ochem_mastery_v1', 'ochem_flashcards_v1', 'ochem_exam_history_v1', 'ochem_textbook_read'],
    anp: ['anp_progress_v1', 'anp_flashcards_v1']
  };

  function readJSON(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } }
  function state(){
    var s = readJSON(KEY);
    return s && s.m && s.seen ? s : { m: {}, seen: {} };
  }
  function save(s){ try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch(e){} }
  function courseOf(tag){ return tag.split(':')[0]; }
  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function started(course){
    var xp = readJSON('hub_xp_v1');
    if(xp && xp.subjects && xp.subjects[course] > 0) return true;
    return (STARTED[course] || []).some(function(k){
      var v = localStorage.getItem(k);
      return !!v && v !== '{}' && v !== '[]' && v !== 'null';
    });
  }

  // Only tags some pair listens for are kept, so the record stays a few lines.
  function note(tags){
    var s = state(), day = Math.floor(Date.now() / DAY), changed = false;
    (tags || []).forEach(function(t){
      if(MAP.some(function(m){ return m.from.indexOf(t) !== -1; })){ s.m[t] = day; changed = true; }
    });
    if(changed) save(s);
  }

  /* The pair to show for `course`, or null. One whose source tags include
     `tags` (the session just finished) wins over one met earlier. */
  function eligible(course, tags){
    var s = state();
    var open = MAP.filter(function(m){
      return courseOf(m.from[0]) === course && !s.seen[m.id] && !started(m.to) &&
        m.from.some(function(t){ return t in s.m; });
    });
    var now = open.filter(function(m){ return m.from.some(function(t){ return (tags || []).indexOf(t) !== -1; }); });
    return now[0] || open[0] || null;
  }

  function markSeen(id, on){
    var s = state();
    if(on) s.seen[id] = Math.floor(Date.now() / DAY); else delete s.seen[id];
    save(s);
  }

  // window.document rather than bare: the same object in a browser, and one a
  // test can stand in for (scripts/test/cross-course.test.mjs).
  function prompting(){ return !!window.document.querySelector('.levl-prompt, .levl-cele'); }

  /* Fill `slot` with the suggestion, if there is one and nothing is asking.
     opts.line: the quiet line under an end screen's next step (waits WAIT ms
     for the save and reminder prompts first); otherwise a dashboard card. */
  function offer(slot, course, opts){
    opts = opts || {};
    if(!slot) return;
    function show(){
      if(!slot.isConnected || prompting()) return;
      var m = eligible(course, opts.tags);
      if(!m) return;
      slot.innerHTML = '<div class="levl-cross' + (opts.line ? '' : ' levl-cross--card') + '" role="note">' +
        '<p>' + esc(m.text) + ' <a href="' + esc(m.href) + '">' + esc(m.link) + '</a></p>' +
        '<button type="button" class="levl-cross__x" aria-label="Dismiss this suggestion">×</button></div>';
      markSeen(m.id, true);
      var box = slot.firstChild;
      box.querySelector('a').addEventListener('click', function(){
        if(window.LevlAnalytics) window.LevlAnalytics.event('next-step-click', { course: course, kind: 'cross-course' });
      });
      box.querySelector('button').addEventListener('click', function(){ slot.innerHTML = ''; });
      // Never alongside a prompt: one arriving takes the screen, and this
      // was not really seen, so it may come back at the next milestone.
      if(window.MutationObserver){
        var mo = new MutationObserver(function(){
          if(!box.isConnected){ mo.disconnect(); return; }
          if(prompting()){ mo.disconnect(); slot.innerHTML = ''; markSeen(m.id, false); }
        });
        mo.observe(window.document.body, { childList: true });
      }
    }
    if(opts.line) setTimeout(show, WAIT); else show();
  }

  window.LevlCross = { MAP: MAP, started: started, note: note, eligible: eligible, offer: offer, KEY: KEY };
})();
