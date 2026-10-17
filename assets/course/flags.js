/* Flagged questions for the courses on the shared engine (A&P, AP® Biology,
   AP® Chemistry, AP® Physics 1, AP® Calculus AB, AP® Statistics): window.LevlFlags.

   The same idea as NREMT's flag (nremt/practice-engine.js) and ochem's
   (ochem/assets/flags.js): a manual bookmark on one question. It is not the
   miss list. A miss is something the engine saw; a flag is something only
   the student knows ("I guessed", "come back to this"). Answering a flagged
   question right does not clear it; the student does, with the same button.
   Flagging is free in every course.

   STORAGE  localStorage['<course>_flagged_v1'] = { questionId: timestamp },
            e.g. apbio_flagged_v1. The course prefix puts it in the progress
            backup (assets/progress-backup.js) and each course core registers
            it for account sync (an un-flag reaches other devices through the
            sync's three-way merge).

   Every question engine calls attach() on the questions it renders on a
   study page; one delegated listener does the toggling, so a flag set in
   practice shows on the same question in review or an exam. A "levl:flag"
   event ({ course, id, on }) lets an exam repaint its question map.

     LevlFlags.has(course, id) / list(course) / count(course)
     LevlFlags.toggle(course, id) -> true when now flagged
     LevlFlags.attach(wrap, course, id, mode)  mode 'session': an exam-only
       item that practice cannot serve, flagged for this exam run only
     LevlFlags.examList(box, course, qs, go)  the flagged list before submit
     LevlFlags.markNav(buttons, course, qs)   flag marks on an exam's map */
(function(){
  var session = {};   // course -> { id: 1 } for 'session' flags
  var ICON = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M5 22V4h12.5l-2.5 5 2.5 5H5"/></svg>';

  function key(course){ return course + '_flagged_v1'; }
  function read(course){
    try{ var o = JSON.parse(localStorage.getItem(key(course)) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; }catch(e){ return {}; }
  }
  function write(course, o){
    try{ localStorage.setItem(key(course), JSON.stringify(o)); }catch(e){}
    try{ if(window.StudyHubAccount && window.StudyHubAccount.syncSoon) window.StudyHubAccount.syncSoon(); }catch(e){}
  }
  function own(o, id){ return Object.prototype.hasOwnProperty.call(o, id); }
  function has(course, id){ return own(read(course), id) || !!(session[course] && session[course][id]); }
  // Newest first: the question you just wondered about is the one you came for.
  function list(course){ var o = read(course); return Object.keys(o).sort(function(a, b){ return o[b] - o[a]; }); }
  function count(course){ return list(course).length; }
  function set(course, id, on, temp){
    if(temp){ session[course] = session[course] || {}; if(on) session[course][id] = 1; else delete session[course][id]; }
    else { var o = read(course); if(on) o[id] = Date.now(); else delete o[id]; write(course, o); }
    paint(course, id);
    try{ document.dispatchEvent(new CustomEvent('levl:flag', { detail: { course: course, id: id, on: on } })); }catch(e){}
    return on;
  }
  function toggle(course, id, temp){ return set(course, id, !has(course, id), temp); }

  function sel(course, id){ return '.cx-flag[data-flag-course="' + course + '"][data-flag-id="' + String(id).replace(/"/g, '') + '"]'; }
  function paint(course, id){
    var on = has(course, id);
    [].forEach.call(document.querySelectorAll(sel(course, id)), function(b){
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.title = on ? 'Flagged. Press again to remove the flag.' : 'Flag this question to come back to it.';
    });
  }

  /* The toggle, first in the question card. Its name stays "Flag" and
     aria-pressed carries the state, so a screen reader hears one control. */
  function attach(wrap, course, id, mode){
    if(!wrap || !course || id == null || wrap.querySelector('.cx-flag')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cx-flag';
    b.setAttribute('data-flag-course', course);
    b.setAttribute('data-flag-id', id);
    if(mode === 'session') b.setAttribute('data-flag-session', '1');
    b.innerHTML = ICON + '<span>Flag</span>';
    wrap.insertBefore(b, wrap.firstChild);
    paint(course, id);
  }
  document.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('.cx-flag') : null;
    if(b) toggle(b.getAttribute('data-flag-course'), b.getAttribute('data-flag-id'), b.hasAttribute('data-flag-session'));
  });

  /* Before submitting an exam: every flagged question in this exam, each a
     button back to it. go(i) jumps; the box is hidden when nothing is flagged. */
  function examList(box, course, qs, go){
    if(!box) return 0;
    var idx = [];
    qs.forEach(function(q, i){ if(has(course, q.id)) idx.push(i); });
    box.hidden = !idx.length;
    box.innerHTML = idx.length ? '<p>You flagged ' + (idx.length === 1 ? '1 question' : idx.length + ' questions') + '. Go back to one before you finish:</p>' +
      '<div class="cx-flaglist-b">' + idx.map(function(i){ return '<button type="button" class="btn-outline" data-flag-go="' + i + '">Question ' + (i + 1) + '</button>'; }).join('') + '</div>' : '';
    if(!box._wired){
      box._wired = true;
      box.addEventListener('click', function(e){ var t = e.target.closest('[data-flag-go]'); if(t && box._go) box._go(+t.getAttribute('data-flag-go')); });
    }
    box._go = go;
    return idx.length;
  }
  function markNav(buttons, course, qs){
    [].forEach.call(buttons, function(b, i){
      var on = !!(qs[i] && has(course, qs[i].id));
      b.classList.toggle('is-flag', on);
      if(on && !/flagged$/.test(b.getAttribute('aria-label') || '')) b.setAttribute('aria-label', (b.getAttribute('aria-label') || 'Question ' + (i + 1)) + ', flagged');
    });
  }

  /* The dashboard card: how many are flagged, linking to the Flagged mode.
     It mounts itself above the dashboard (#app[data-slug="dashboard"]) and
     shows only when something is flagged. */
  var DIRS = { 'anatomy-physiology': 'anp', bio: 'apbio', chem: 'apchem', physics: 'apphys', calculus: 'apcalc', statistics: 'apstat' };
  function dashCard(){
    var app = document.querySelector('#app[data-slug="dashboard"]');
    var course = DIRS[(location.pathname.split('/').filter(Boolean).slice(-2, -1)[0]) || ''];
    if(!app || !course) return;
    var card = document.getElementById('cx-flagcard');
    if(!card){
      card = document.createElement('p');
      card.id = 'cx-flagcard';
      card.className = 'cx-flagcard';
      app.parentNode.insertBefore(card, app);
    }
    var n = count(course);
    card.hidden = !n;
    card.innerHTML = n ? ICON + '<span><b>' + (n === 1 ? '1 flagged question' : n + ' flagged questions') + '</b> They stay until you unflag them.</span><a href="practice.html?mode=flagged">Practice them <span aria-hidden="true">&rarr;</span></a>' : '';
  }
  function boot(){
    dashCard();
    window.addEventListener('storage', function(e){ if(!e.key || /_flagged_v1$/.test(e.key)) dashCard(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.LevlFlags = { key: key, has: has, list: list, count: count, toggle: toggle, attach: attach, examList: examList, markNav: markNav };
})();
