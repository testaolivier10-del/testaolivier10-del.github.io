/* A timed run through a station's structure, out loud.

   The page around this makes three claims, all correct, and then gave you no
   way to act on any of them: that examiners score what you SAY and physically
   demonstrate rather than what you are thinking; that a separate short list of
   critical criteria can fail a station no matter how many points you scored;
   and that the time limit is real and enforced. Reading those three facts is
   not the same as having run into them.

   So this runs a station. The phases come from the same `structure` line the
   card already prints — read out of the DOM, not copied — you tick each one as
   you say it aloud, the clock runs, and at the end you get elapsed time
   against the target and which critical items you never ticked.

   WHAT THIS IS NOT. It is not a scored skill sheet, and it must not pretend to
   be one. The real sheets are precise documents where exact wording and order
   carry points, they differ between the official NREMT version and what
   individual programs teach, and this page says so at the top in a warning box
   that exists for good reason. So: no points, no pass, no fail. It reports
   what happened — you took six minutes, you never said BSI — and leaves the
   verdict to the only documents that can actually issue one.

   THE CLOCK IS EDITABLE, AND DEFAULTS ARE LABELLED AS HEARSAY. Published time
   limits for these stations are widely repeated and not something this file
   should assert as fact to someone preparing for an exam. Each station's
   target is pre-filled with the commonly-published figure, shown as such, and
   the student can set it to whatever their own program uses — which is what
   the warning box has been telling them to do all along. */
(function(){
  var host  = document.getElementById('stationCards');
  var mount = document.getElementById('stationRun');
  if(!host || !mount) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function text(el){ return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

  /* Commonly-published targets, in minutes, keyed by a distinctive fragment of
     the station's name. Presented to the student as "commonly published" and
     editable, never as the authority — see the note at the top. */
  var COMMON_TARGET = [
    { match: /trauma/i,            minutes: 10 },
    { match: /medical/i,           minutes: 15 },
    { match: /cardiac arrest|aed/i,minutes: 10 },
    { match: /bvm|ventilation/i,   minutes: 5  },
    { match: /oxygen|rebreather/i, minutes: 5  },
    { match: /long bone/i,         minutes: 5  },
    { match: /joint/i,             minutes: 5  },
    { match: /bleeding|shock/i,    minutes: 10 }
  ];

  function targetFor(name){
    for(var i = 0; i < COMMON_TARGET.length; i++){
      if(COMMON_TARGET[i].match.test(name)) return COMMON_TARGET[i].minutes;
    }
    return 10;
  }

  /* ---- Read the stations off the page ------------------------------------ */

  function readStations(){
    var out = [];
    host.querySelectorAll('.skill-card').forEach(function(card){
      var h3 = card.querySelector('h3');
      var structure = card.querySelector('.structure');
      var watch = card.querySelector('.watch');
      if(!h3 || !structure) return;

      /* The arrow-separated phase list the card already shows. These are
         phases, not scored steps — the difference is the whole disclaimer on
         this page, and the UI says so where the student can see it. */
      var phases = text(structure)
        .replace(/\.$/, '')
        .split(/→|->/)
        .map(function(p){ return p.trim(); })
        .filter(Boolean);
      if(phases.length < 2) return;

      var steps = [{
        text: 'Take or verbalize BSI / PPE precautions',
        critical: true,
        why: 'The page above calls this "almost always the very first scored item", and it appears on essentially every critical-criteria list there is. Say it out loud before you touch the patient.'
      }];
      phases.forEach(function(p){
        steps.push({ text: p.charAt(0).toUpperCase() + p.slice(1), critical: false });
      });
      if(watch){
        steps.push({
          text: 'Before finishing: ' + text(watch).replace(/^Watch for:\s*/i, ''),
          critical: true,
          why: 'This is the station-specific trap the card flags. It is here at the end so you meet it, not so it belongs last.'
        });
      }

      out.push({ name: text(h3), steps: steps, target: targetFor(text(h3)) });
    });
    return out;
  }

  var STATIONS = readStations();
  if(!STATIONS.length) return;

  /* ---- State ------------------------------------------------------------- */

  var station = null, done = [], startedAt = 0, tick = null, targetMin = 0;

  function elapsed(){ return startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0; }
  function clockText(sec){
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function stop(){
    if(tick){ clearInterval(tick); tick = null; }
  }

  /* ---- Screens ----------------------------------------------------------- */

  function picker(){
    stop();
    station = null;
    mount.innerHTML =
      '<div class="run-card">' +
        '<p class="run-intro">Pick a station and talk your way through it out loud, ticking each phase as you say it. ' +
          'The clock runs, the critical items are marked, and at the end you get what happened — not a score.</p>' +
        '<div class="run-pick">' +
          STATIONS.map(function(s, i){
            return '<button type="button" class="run-station" data-i="' + i + '">' +
              '<span class="n">' + esc(s.name) + '</span>' +
              '<span class="t">' + s.steps.length + ' phases · ' + s.target + ' min</span>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>';
    mount.querySelectorAll('.run-station').forEach(function(b){
      b.addEventListener('click', function(){
        begin(STATIONS[parseInt(b.getAttribute('data-i'), 10)]);
      });
    });
  }

  function begin(s){
    station = s;
    targetMin = s.target;
    done = s.steps.map(function(){ return false; });
    startedAt = Date.now();
    stop();
    tick = setInterval(function(){
      var el = document.getElementById('runClock');
      if(!el) return stop();
      var sec = elapsed();
      el.textContent = clockText(sec);
      el.classList.toggle('over', sec > targetMin * 60);
    }, 1000);
    renderRun();
  }

  function renderRun(){
    mount.innerHTML =
      '<div class="run-card">' +
        '<div class="run-head">' +
          '<div>' +
            '<div class="run-name">' + esc(station.name) + '</div>' +
            '<label class="run-target">Target ' +
              '<input type="number" id="runTarget" min="1" max="60" value="' + targetMin + '"> min' +
            '</label>' +
            '<div class="run-hearsay">Commonly published for this station — confirm against your own program’s sheet.</div>' +
          '</div>' +
          '<div class="run-clock" id="runClock" role="timer" aria-live="off">0:00</div>' +
        '</div>' +

        '<ol class="run-steps">' +
          station.steps.map(function(st, i){
            return '<li class="run-step' + (st.critical ? ' is-critical' : '') + (done[i] ? ' is-done' : '') + '">' +
              '<label>' +
                '<input type="checkbox" data-i="' + i + '"' + (done[i] ? ' checked' : '') + '>' +
                '<span class="run-step__text">' + esc(st.text) + '</span>' +
              '</label>' +
              (st.critical ? '<span class="run-flag">critical</span>' : '') +
            '</li>';
          }).join('') +
        '</ol>' +

        '<p class="run-note">These are the phases this page lists, not an official scored step order. ' +
          'Verbalize each one as you would in the room — the examiner scores what you say and show.</p>' +

        '<div class="run-actions">' +
          '<button type="button" class="drill-next" id="runFinish">Finish and see the run</button>' +
          '<button type="button" class="run-quit" id="runQuit">Pick another station</button>' +
        '</div>' +
      '</div>';

    mount.querySelectorAll('.run-step input').forEach(function(box){
      box.addEventListener('change', function(){
        var i = parseInt(box.getAttribute('data-i'), 10);
        done[i] = box.checked;
        box.closest('.run-step').classList.toggle('is-done', box.checked);
      });
    });
    document.getElementById('runTarget').addEventListener('change', function(e){
      var v = parseInt(e.target.value, 10);
      if(v > 0) targetMin = v;
    });
    document.getElementById('runFinish').addEventListener('click', finish);
    document.getElementById('runQuit').addEventListener('click', picker);
  }

  function finish(){
    var sec = elapsed();
    stop();

    var missedCritical = [], missedOther = 0;
    station.steps.forEach(function(st, i){
      if(done[i]) return;
      if(st.critical) missedCritical.push(st);
      else missedOther++;
    });
    var over = sec > targetMin * 60;

    mount.innerHTML =
      '<div class="run-card">' +
        '<div class="run-name">' + esc(station.name) + '</div>' +

        '<div class="run-result">' +
          '<div class="run-result__row">' +
            '<span class="k">Time</span>' +
            '<span class="v' + (over ? ' over' : '') + '">' + clockText(sec) +
              ' against a ' + targetMin + ' minute target' +
              (over ? ' — over' : '') + '</span>' +
          '</div>' +
          '<div class="run-result__row">' +
            '<span class="k">Phases ticked</span>' +
            '<span class="v">' + done.filter(Boolean).length + ' of ' + station.steps.length + '</span>' +
          '</div>' +
        '</div>' +

        (missedCritical.length
          ? '<div class="run-flagbox">' +
              '<b>Critical items you did not tick:</b>' +
              '<ul>' + missedCritical.map(function(st){
                return '<li>' + esc(st.text) + (st.why ? '<small>' + esc(st.why) + '</small>' : '') + '</li>';
              }).join('') + '</ul>' +
            '</div>'
          : '<div class="run-okbox">Both critical items ticked.</div>') +

        (missedOther ? '<p class="run-note">' + missedOther + ' other phase' + (missedOther === 1 ? '' : 's') +
                       ' left unticked.</p>' : '') +

        '<p class="run-note"><b>No score, and no pass or fail.</b> This is your own run through the ' +
          'general structure — the real sheet has a point list and a critical-criteria list this page ' +
          'deliberately does not reproduce. Check your program’s copy for both.</p>' +

        '<div class="run-actions">' +
          '<button type="button" class="drill-next" id="runAgain">Run it again</button>' +
          '<button type="button" class="run-quit" id="runOther">Pick another station</button>' +
        '</div>' +
      '</div>';

    document.getElementById('runAgain').addEventListener('click', function(){ begin(station); });
    document.getElementById('runOther').addEventListener('click', picker);
  }

  /* ---- Mode switch ------------------------------------------------------- */

  var toggle = document.getElementById('stationMode');
  if(toggle){
    toggle.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click', function(){
        var mode = b.getAttribute('data-mode');
        toggle.querySelectorAll('button').forEach(function(x){
          x.classList.toggle('on', x === b);
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        host.hidden = (mode !== 'read');
        mount.hidden = (mode !== 'run');
        // Leaving the page mid-run should not leave a timer ticking forever.
        if(mode !== 'run') stop();
        else if(!station) picker();
      });
    });
  }

  picker();
})();
