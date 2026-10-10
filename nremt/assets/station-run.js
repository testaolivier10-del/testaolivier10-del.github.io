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

  /* The page's own table of the official sheets ("The official sheets at a
     glance"): its time column is each station's limit (the Registry's exam
     guide; the sheets themselves mostly only record start and end times), and its
     last column paraphrases the critical criteria. Where a station matches a
     row, that is what the clock and the critical list use. */
  var ROW_KEYS = [/trauma/i, /medical/i, /cardiac|aed/i, /bvm/i, /non-rebreather|oxygen/i, /long bone/i, /joint/i, /supine/i, /seated/i, /bleeding/i];
  function sheetRow(name){
    var key = ROW_KEYS.filter(function(r){ return r.test(name); })[0];
    if(!key) return null;
    var rows = document.querySelectorAll('.sheets-table tbody tr');
    for(var i = 0; i < rows.length; i++){
      var th = rows[i].querySelector('th'), tds = rows[i].querySelectorAll('td');
      if(!th || tds.length < 3 || !key.test(text(th))) continue;
      var min = parseInt(text(tds[1]), 10);
      return {
        code: text(th.querySelector('.sheet-code') || th).replace(/^.*\s(E\d+)$/, '$1'),
        minutes: min > 0 ? min : null,
        criteria: text(tds[2]).split(/;\s*/).filter(Boolean).map(function(c){ return c.charAt(0).toUpperCase() + c.slice(1); })
      };
    }
    return null;
  }

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
        why: 'The reading guide on this page calls this "almost always the very first scored item", and it appears on essentially every critical-criteria list there is. Say it out loud before you touch the patient.'
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

      var row = sheetRow(text(h3));
      out.push({ name: text(h3), steps: steps, target: (row && row.minutes) || targetFor(text(h3)),
                 official: !!(row && row.minutes), code: row ? row.code : '', criteria: row ? row.criteria : [] });
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
              '<span class="t">' + s.steps.length + ' phases · ' + s.target + ' min' + (s.code ? ' · ' + esc(s.code) : '') + '</span>' +
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

  /* ---- The clock and the critical list ---------------------------------- */

  /* Which official criteria the run can light by itself, from what happened:
     PPE when a later phase was ticked before BSI; anything timed when the
     clock passes the sheet's limit. The rest the student lights by tapping
     ("I did this"), which is how a self-run is honestly scored. */
  var RE_PPE = /\bPPE\b/i, RE_TIME = /within the \d+ minutes/i;
  var flagged = [];   // per official criterion: '', 'auto', 'self'

  function ring(frac, over){
    var r = 52, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
    return '<svg class="run-ring" viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle cx="60" cy="60" r="' + r + '" class="run-ring-bg"/>' +
      '<circle cx="60" cy="60" r="' + r + '" class="run-ring-fg' + (over ? ' over' : frac > 0.8 ? ' late' : '') + '" ' +
        'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - f)).toFixed(1) + '" transform="rotate(-90 60 60)"/>' +
      '</svg>';
  }

  function bsiSkipped(){
    // BSI is step 0; skipped once any later step is ticked without it.
    return !done[0] && done.slice(1).some(Boolean);
  }

  function lightCriteria(sec){
    if(!station.criteria.length) return;
    var over = sec > targetMin * 60;
    station.criteria.forEach(function(c, i){
      if(flagged[i] === 'self') return;
      var auto = (RE_PPE.test(c) && bsiSkipped()) || (RE_TIME.test(c) && over);
      flagged[i] = auto ? 'auto' : '';
    });
    var box = document.getElementById('runCrit');
    if(!box) return;
    box.querySelectorAll('[data-c]').forEach(function(li){
      var i = +li.getAttribute('data-c'), was = li.parentNode.classList.contains('lit');
      li.parentNode.classList.toggle('lit', !!flagged[i]);
      li.setAttribute('aria-pressed', flagged[i] ? 'true' : 'false');
      if(flagged[i] === 'auto' && !was && window.LevlAnnounce) window.LevlAnnounce.say('Critical criterion: ' + station.criteria[i]);
    });
    var n = flagged.filter(Boolean).length;
    var head = document.getElementById('runCritN');
    if(head) head.textContent = n ? n + ' would fail the station' : 'none yet';
    var badge = document.getElementById('runCritBadge');
    if(badge){ badge.hidden = !n; badge.textContent = n + ' critical criteri' + (n === 1 ? 'on' : 'a') + ' lit \u2193'; }
  }

  function updateClock(){
    var sec = elapsed(), lim = targetMin * 60, over = sec > lim;
    var el = document.getElementById('runClock');
    if(!el) return stop();
    el.textContent = clockText(sec);
    var wrap = document.getElementById('runClockWrap');
    wrap.classList.toggle('over', over);
    wrap.classList.toggle('late', !over && sec > lim * 0.8);
    var fg = wrap.querySelector('.run-ring-fg');
    if(fg){
      var c = 2 * Math.PI * 52;
      fg.setAttribute('stroke-dashoffset', (c * (1 - Math.min(1, sec / lim))).toFixed(1));
      fg.setAttribute('class', 'run-ring-fg' + (over ? ' over' : sec > lim * 0.8 ? ' late' : ''));
    }
    var left = document.getElementById('runLeft');
    if(left) left.textContent = over ? clockText(sec - lim) + ' over' : clockText(lim - sec) + ' left';
    // A spoken heads-up at the two moments that matter, not every second.
    if(window.LevlAnnounce){
      if(!clockSaid.late && sec > lim * 0.8 && !over){ clockSaid.late = true; window.LevlAnnounce.say(clockText(lim - sec) + ' left on the station.'); }
      if(!clockSaid.over && over){ clockSaid.over = true; window.LevlAnnounce.say('Time limit passed.'); }
    }
    lightCriteria(sec);
  }
  var clockSaid = {};

  function begin(s){
    station = s;
    targetMin = s.target;
    done = s.steps.map(function(){ return false; });
    flagged = s.criteria.map(function(){ return ''; });
    clockSaid = {};
    startedAt = Date.now();
    stop();
    tick = setInterval(updateClock, 1000);
    renderRun();
  }

  function renderRun(){
    mount.innerHTML =
      '<div class="run-card run-live">' +
        '<div class="run-name">' + esc(station.name) + (station.code ? ' <span class="run-code">' + esc(station.code) + '</span>' : '') + '</div>' +
        '<div class="run-top2">' +
          '<div class="run-clockwrap" id="runClockWrap">' + ring(0, false) +
            '<div class="run-clockin"><div class="run-clock" id="runClock" role="timer" aria-live="off">0:00</div>' +
            '<div class="run-left" id="runLeft">' + targetMin + ':00 left</div></div>' +
          '</div>' +
          '<div class="run-meta">' +
            '<label class="run-target">Limit ' +
              '<input type="number" id="runTarget" min="1" max="60" value="' + targetMin + '"> min' +
            '</label>' +
            '<div class="run-hearsay">' + (station.official
              ? 'The station limit from the table below (the Registry’s exam guide). Change it if your program differs.'
              : 'Commonly published for this station — confirm against your own program’s sheet.') + '</div>' +
            '<a class="run-badge" id="runCritBadge" href="#runCrit" hidden></a>' +
          '</div>' +
        '</div>' +

        '<div class="run-cols">' +
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

        (station.criteria.length
          ? '<div class="run-crit" id="runCrit">' +
              '<div class="run-crit-h">Critical criteria <span id="runCritN">none yet</span></div>' +
              '<p class="run-crit-sub">Any one fails the station. Two light up by themselves: No PPE, if you tick a later phase before BSI (this tool’s reading of it; the sheet fails a candidate who never takes or voices PPE), and the time limit once it passes. Tap any other you know you did.</p>' +
              '<ul>' + station.criteria.map(function(c, i){
                return '<li><button type="button" class="run-cbtn" data-c="' + i + '" aria-pressed="false">' + esc(c) + '</button></li>';
              }).join('') + '</ul>' +
              '<p class="run-crit-src">Paraphrased from ' + esc(station.code || 'the official sheet') + ' in the table below.</p>' +
            '</div>'
          : '') +
        '</div>' +

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
        var li0 = mount.querySelector('.run-step');
        if(li0) li0.classList.toggle('is-skipped', bsiSkipped());
        lightCriteria(elapsed());
      });
    });
    mount.querySelectorAll('.run-cbtn').forEach(function(b){
      b.addEventListener('click', function(){
        var i = +b.getAttribute('data-c');
        flagged[i] = flagged[i] === 'self' ? '' : 'self';
        lightCriteria(elapsed());
      });
    });
    document.getElementById('runTarget').addEventListener('change', function(e){
      var v = parseInt(e.target.value, 10);
      if(v > 0){ targetMin = v; clockSaid = {}; updateClock(); }
    });
    document.getElementById('runFinish').addEventListener('click', finish);
    document.getElementById('runQuit').addEventListener('click', picker);
    updateClock();
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
          : '<div class="run-okbox">' + (station.steps.filter(function(st){ return st.critical; }).length === 2 ? 'Both critical items ticked.' : 'Every critical item ticked.') + '</div>') +

        (flagged.some(Boolean)
          ? '<div class="run-flagbox"><b>Critical criteria that lit up:</b><ul>' +
              station.criteria.filter(function(c, i){ return flagged[i]; }).map(function(c){ return '<li>' + esc(c) + '</li>'; }).join('') +
            '</ul></div>' : '') +
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
    /* The result is much shorter than the run it replaces, so without this the
       page collapses under the student and they land in the reading guide. */
    var card = mount.querySelector('.run-card');
    if(card){
      card.setAttribute('tabindex', '-1');
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      try{ card.focus({ preventScroll: true }); }catch(e){}
      var top = card.getBoundingClientRect().top;
      if(top < 80 || top > window.innerHeight * 0.6) card.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    }
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
