/* The teacher app's integrations (docs/teacher-classes.md, stream C): reminder emails, family progress reports,
   free-response scoring with comments, Google Classroom, Canvas and Schoology (LTI), Class Premium quotes.

   window.LevlTeachIntegrations, loaded by assets/class/teach.js. The contract (docs/teacher-classes.md, v2):
     settings(ctx)    -> HTML for the class's Settings view
     assignment(ctx)  -> HTML for one assignment's page
     wire(ctx)        after teach.js has put that HTML in the page: listeners and the parts that load
   ctx, as teach.js (stream A1) builds it: { where: 'settings'|'assignment', demo, classId, cls, role: 'owner'|'co',
   box, call (teach.js's RPC caller, sample-class aware), members: [{ id, name }], assignment }. An older shape with
   rep (teach_class_report's answer) works too. What needs the students' summaries (who is missing, grades) loads
   teach_class_report through ctx.call and draws into ctx.box. Co-teachers get reminders, family reports and
   free-response scoring; Google Classroom, the LMS and grade passback are for the class's owner only (the Worker
   checks the same). Calls go to the Worker with the teacher's session; it checks the class every time. */
(function(){
  'use strict';
  var API = 'https://api.levlprep.com'; // site-config:API_URL
  var DAY = 86400000;
  var feats = null, gstat = {}, CUR = null, wired = false;

  function M(){ return window.LevlClassModel; }
  function A(){ return window.StudyHubAccount; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function $(id){ return document.getElementById(id); }
  function plural(n, a, b){ return n + ' ' + (n === 1 ? a : (b || a + 's')); }
  function css(){
    if($('lviCss')) return;
    var l = document.createElement('link'); l.id = 'lviCss'; l.rel = 'stylesheet'; l.href = '/assets/class/teach-integrations.css'; document.head.appendChild(l);
  }

  function api(path, body){
    if(!A() || !A().accessToken) return Promise.reject({ error: 'Sign in again.' });
    return A().accessToken().then(function(t){
      if(!t) throw { error: 'Sign in again.' };
      return fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify(body || {}) });
    }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(b){ if(!r.ok){ b = b || {}; b.status = r.status; throw b; } return b; });
    }, function(e){ throw (e && e.error) ? e : { error: 'No connection. Try again.' }; });
  }
  function features(){
    if(!feats) feats = api('/class/features', {}).catch(function(){ feats = null; return {}; });
    return feats;
  }
  function msg(el, text, bad){ if(!el) return; el.textContent = text || ''; el.className = 'lv-msg' + (bad ? ' is-bad' : ''); }
  function errText(e){ return (e && e.error) || 'That did not work. Try again.'; }

  /* One shape for both callers. n.rep is the full report when known (members with summaries), else a stand-in
     built from cls and members, enough for the settings cards. */
  var REPS = {};
  function norm(ctx){
    ctx = ctx || {};
    if(ctx.__n) return ctx;
    var cls = (ctx.rep && ctx.rep.class) || ctx.cls || null;
    var id = (cls && cls.id) || ctx.classId || null;
    var full = ctx.rep || (id && REPS[id]) || null;
    var rep = full || (cls ? { class: cls, members: ctx.members || [], assignments: ctx.assignment ? [ctx.assignment] : [] } : null);
    if(rep && !rep.class.id && id){ rep.class = Object.assign({ id: id }, rep.class); }
    return { __n: true, rep: rep, full: !!full, classId: id, demo: !!ctx.demo, role: ctx.role || (cls && cls.role) || 'owner',
             assignment: ctx.assignment || null, call: ctx.call || null, box: ctx.box || null, where: ctx.where || (ctx.assignment ? 'assignment' : 'settings'),
             part: ctx.part || null, student: ctx.student || null };
  }
  function loadRep(n){
    if(n.full) return Promise.resolve(n.rep);
    var get = n.call ? n.call('teach_class_report', { p_class: n.classId }) : A().rpcData('teach_class_report', { p_class: n.classId });
    return Promise.resolve(get).then(function(r){
      if(!r || !r.class) throw {};
      if(!r.class.id) r.class.id = n.classId;
      REPS[n.classId] = r; n.rep = r; n.full = true;
      if(n.assignment) n.assignment = r.assignments.filter(function(a){ return a.id === n.assignment.id; })[0] || n.assignment;
      return r;
    });
  }
  var isOwner = function(n){ return n.role !== 'co'; };

  function course(rep){ return (M().COURSES[rep.class.course] || {}); }
  function targets(rep, a){ return rep.members.filter(function(m){ return !a.students || a.students.indexOf(m.id) !== -1; }); }
  function stat(a, m){
    var d = (m.extra_days || 0) * DAY, b = {};
    for(var k in a) b[k] = a[k];
    b.due_at = a.due_at ? new Date(Date.parse(a.due_at) + d).toISOString() : null;
    b.late_until = a.late_until ? new Date(Date.parse(a.late_until) + d).toISOString() : null;
    return M().status(b, m.summary);
  }

  /* ============================================================ assignment page */

  function remindCard(ctx){
    var a = ctx.assignment, rows = targets(ctx.rep, a).map(function(m){ return { m: m, s: stat(a, m) }; })
      .filter(function(x){ return x.s.state === 'missing' || x.s.state === 'not'; });
    var list = rows.length ? rows.map(function(x){
      return '<label class="lvt-check lvi-pick"><input type="checkbox" checked data-lvi-who value="' + esc(x.m.id) + '"> ' + esc(x.m.name) +
        ' <span class="lv-tag">' + (x.s.state === 'missing' ? 'Missing' : 'Not started') + '</span></label>';
    }).join('') : '<p class="d5-mut">Nobody is missing this or has yet to start it.</p>';
    return '<section class="d5-card lvi" id="lviRemind"><p class="lv-kick">Reminders</p><h3 class="lv-h3">Email the students who are missing it or have not started</h3>' +
      '<div class="lvi-list">' + list + '</div>' +
      (rows.length ? '<label class="lv-field"><span>A short note from you (optional, no links)</span><textarea class="lv-in" id="lviNote" rows="2" maxlength="300" placeholder="You can still finish this for credit."></textarea></label>' +
        '<div class="lv-btns"><button type="button" class="lv-btn is-sm" data-lvi-act="remind"' + (ctx.demo ? ' disabled' : '') + '>Email a reminder</button></div>' : '') +
      '<p class="lv-msg" id="lviRemindMsg" role="status" aria-live="polite"></p>' +
      '<p class="d5-mut lvi-fine">Sent only when you press the button, to the address each student signed in with (you never see it), as plain text with a link to the course. A student gets at most one teacher reminder a day and can turn them off. Parents are never emailed.' + (ctx.demo ? ' <b>Sample class: nothing is sent.</b>' : '') + '</p></section>';
  }

  function gradesCard(ctx){
    var a = ctx.assignment;
    if(!a.required || !isOwner(ctx)) return '';
    if(ctx.demo) return '<section class="d5-card lvi" id="lviGrades"><p class="lv-kick">Gradebook</p><h3 class="lv-h3">Send these grades to your other gradebook</h3>' +
      '<p class="d5-mut">Scores as this page shows them, out of 100: the share right for practice and review, the exam score, your score for a free response. Students who have not finished are left out unless you tick the box.</p>' +
      '<label class="lvt-check"><input type="checkbox" disabled> Send 0 for missing work</label>' +
      '<div class="lv-btns"><button type="button" class="lv-btn is-sm is-ghost" disabled>Post to Google Classroom</button><button type="button" class="lv-btn is-sm" disabled>Send grades to Classroom</button><button type="button" class="lv-btn is-sm" disabled>Send grades to Canvas or Schoology</button></div>' +
      '<p class="d5-mut lvi-fine"><b>Sample class: nothing is sent.</b> The buttons appear once Google Classroom or your LMS is set up for the class.</p></section>';
    return '<section class="d5-card lvi" id="lviGrades" hidden><p class="lv-kick">Gradebook</p><h3 class="lv-h3">Send these grades to your other gradebook</h3>' +
      '<p class="d5-mut">Scores as this page shows them, out of 100: the share right for practice and review, the exam score, your score for a free response. Students who have not finished are left out unless you tick the box.</p>' +
      '<label class="lvt-check"><input type="checkbox" id="lviZero"> Send 0 for missing work</label>' +
      '<div class="lv-btns" id="lviGradeBtns"></div><p class="lv-msg" id="lviGradeMsg" role="status" aria-live="polite"></p></section>';
  }

  function frqCard(ctx){
    if(ctx.assignment.kind !== 'frq') return '';
    return '<section class="d5-card lvi" id="lviFrq"><p class="lv-kick">Free response</p><h3 class="lv-h3">Score the answers students sent you</h3>' +
      '<div id="lviFrqList"><p class="d5-mut">' + (ctx.demo ? 'In a real class, each answer a student sends appears here with the rubric. Tick the points, add a comment, save: the student sees both on their classes page.' : 'Loading…') + '</p></div></section>';
  }

  function assignment(ctx){
    css();
    var n = norm(ctx);
    if(!n.rep || !n.assignment) return '';
    if(!n.full) return '<div class="lvi-wrap" data-lvi-pending="assignment"><p class="d5-mut">Loading reminders and scoring…</p></div>';
    return '<div class="lvi-wrap">' + remindCard(n) + frqCard(n) + gradesCard(n) + '</div>';
  }

  function gradeList(ctx, zero, frqScores){
    var a = ctx.assignment, out = [];
    targets(ctx.rep, a).forEach(function(m){
      var s = stat(a, m), v = null, fs = frqScores && frqScores[m.id];
      if(fs && fs.of) v = fs.got / fs.of;
      else if(s.state === 'done') v = s.score != null ? s.score : 1;
      else if(s.state === 'missing' && zero) v = 0;
      if(v != null) out.push({ student: m.id, score: Math.max(0, Math.min(1, v)) });
    });
    return out;
  }

  function wireGrades(ctx, f){
    var box = $('lviGrades'); if(!box) return;
    var btns = '';
    var g = gstat[ctx.rep.class.id];
    if(f.google && g && g.connected && g.linked) btns += '<button type="button" class="lv-btn is-sm is-ghost" data-lvi-act="gc-post">Post to Google Classroom</button><button type="button" class="lv-btn is-sm" data-lvi-act="gc-grades">Send grades to Classroom</button>';
    if(f.lti && isOwner(ctx)) btns += '<button type="button" class="lv-btn is-sm" data-lvi-act="lti-grades">Send grades to Canvas or Schoology</button>';
    if(!btns) return;
    $('lviGradeBtns').innerHTML = btns;
    box.hidden = false;
    syncSlots();
  }

  /* ---------------------------------------------- free-response scoring */

  var frqState = {};
  function loadRubric(ctx){
    var id = ctx.assignment.spec && ctx.assignment.spec.frq;
    if(!id) return Promise.resolve(null);
    return fetch('/' + course(ctx.rep).dir + '/assets/frq/' + encodeURIComponent(id) + '.json').then(function(r){ return r.ok ? r.json() : null; }, function(){ return null; });
  }
  function scoreForm(ctx, f, w, aiOn){
    var m = ctx.rep.members.filter(function(x){ return x.id === w.student; })[0] || { name: 'A student who left' };
    var sc = w.score || {}, pts = sc.points || {};
    var parts = f.parts.map(function(p){
      var ans = (w.answers || {})[p.label] || '';
      return '<div class="lvi-part"><p class="lvi-plabel">(' + esc(p.label) + ') ' + (p.prompt || '') + '</p>' +
        '<p class="lvi-ans">' + (ans ? esc(ans) : '<i>No answer to this part.</i>') + '</p>' +
        p.rubric.map(function(r, k){
          var on = pts[p.label] && pts[p.label][k];
          return '<label class="lvt-check lvi-pt"><input type="checkbox" data-pt="' + esc(p.label) + ':' + k + '"' + (on ? ' checked' : '') + '> ' + esc(r.point) + '</label><p class="lvi-ai" data-ai="' + esc(p.label) + ':' + k + '"></p>';
        }).join('') + '</div>';
    }).join('');
    var got = sc.of ? sc.got + ' / ' + sc.of : 'Not scored';
    return '<details class="lvi-sub" data-sub="' + esc(w.student) + '"' + (w.score ? '' : ' open') + '><summary><b>' + esc(m.name) + '</b> <span class="lv-tag">' + esc(got) + '</span></summary>' +
      parts + '<label class="lv-field"><span>Comment for the student</span><textarea class="lv-in" data-comment rows="3" maxlength="2000">' + esc(sc.comment || '') + '</textarea></label>' +
      '<div class="lv-btns">' + (aiOn ? '<button type="button" class="lv-btn is-sm is-ghost" data-lvi-act="frq-ai">AI first pass</button>' : '') +
      '<button type="button" class="lv-btn is-sm" data-lvi-act="frq-save">Save score and comment</button></div><p class="lv-msg" role="status" aria-live="polite"></p></details>';
  }
  /* Sample class: two made-up answers on the real rubric, one scored, every button off. */
  function demoFrq(ctx){
    var list = $('lviFrqList'); if(!list) return;
    loadRubric(ctx).then(function(rub){
      if(!rub || !rub.parts || ctx !== CUR) return;
      var ms = ctx.rep.members.slice(0, 2), work = ms.map(function(m, i){
        var answers = {}, points = {}, got = 0, of = 0;
        rub.parts.forEach(function(p){
          answers[p.label] = 'Sample answer for part ' + p.label + '. In your class, this is what the student wrote on the question page and chose to send you.';
          points[p.label] = p.rubric.map(function(r, k){ of++; var on = i === 0 && k === 0; if(on) got++; return on; });
        });
        return { student: m.id, answers: answers, score: i === 0 ? { points: points, got: got, of: of, comment: 'Good start on the claim. Add the data from the table to support it.' } : null };
      });
      list.innerHTML = '<p class="d5-mut"><b>Sample class: nothing is saved.</b> Each answer a student sends appears here with the rubric. Tick the points, add a comment, save: the student sees both on their classes page.</p>' +
        work.map(function(w){ return scoreForm(ctx, rub, w, false); }).join('');
      list.querySelectorAll('button, input, textarea').forEach(function(el){ el.disabled = true; });
    });
  }
  function wireFrq(ctx, f){
    var list = $('lviFrqList'); if(!list || ctx.demo) return;
    Promise.all([loadRubric(ctx), A().rpcData('teach_frq_work', { p_assignment: ctx.assignment.id })]).then(function(r){
      var rub = r[0], work = Array.isArray(r[1]) ? r[1] : [];
      frqState = { rubric: rub, work: work, scores: {} };
      work.forEach(function(w){ if(w.score) frqState.scores[w.student] = w.score; });
      if(!rub){ list.innerHTML = '<p class="d5-mut">The rubric for this question could not be loaded.</p>'; return; }
      if(!work.length){ list.innerHTML = '<p class="d5-mut">No answers yet. Students send theirs from <b>Your classes</b> (levlprep.com/join.html) after writing it on the question page.</p>'; return; }
      list.innerHTML = '<p class="d5-mut">' + plural(work.length, 'answer') + ' sent. Your score and comment show on the student’s classes page as soon as you save.' + (f.frqAi ? ' The AI first pass is a suggestion: check every point before you save.' : '') + '</p>' +
        work.map(function(w){ return scoreForm(ctx, rub, w, f.frqAi); }).join('');
    }, function(){ list.innerHTML = '<p class="d5-mut">Scoring is not open yet (the database update for it has not been applied).</p>'; });
  }
  function collect(box){
    var points = {}, got = 0, of = 0;
    frqState.rubric.parts.forEach(function(p){ points[p.label] = p.rubric.map(function(){ return false; }); });
    box.querySelectorAll('[data-pt]').forEach(function(i){
      var k = i.getAttribute('data-pt').split(':'); of++;
      if(i.checked){ points[k[0]][+k[1]] = true; got++; }
    });
    return { points: points, got: got, of: of, comment: box.querySelector('[data-comment]').value.trim() };
  }

  /* ============================================================ settings */

  // On each student's page (simplified teacher pages, owner 2026-11-08): one student, so no picker.
  function familiesCard(ctx){
    var st = ctx.student; if(!st) return '';
    var off = ctx.demo ? ' disabled' : '';
    return '<section class="lvi tm-famc" id="lviFam"><p class="d5-lead">Family progress report</p>' +
      '<p class="d5-mut">Mastery by unit, every assignment and its status, your free-response scores and comments. Print it, or make a link that stops working after the days you pick. No parent email is asked for or stored.</p>' +
      '<input type="hidden" id="lviFamWho" value="' + esc(st.id) + '">' +
      '<label class="lv-field" style="margin:12px 0 0;max-width:220px"><span class="tm-sr">Link works for</span><select class="lv-in" id="lviFamDays"><option value="1">Link works 1 day</option><option value="7">Link works 7 days</option><option value="14" selected>Link works 14 days</option><option value="30">Link works 30 days</option></select></label>' +
      '<div class="lv-btns" style="margin-top:12px"><button type="button" class="lp-btn sm tm-mline" data-lvi-act="fam-print"' + off + '>Print report</button><button type="button" class="lp-btn sm tm-mline" data-lvi-act="fam-link"' + off + '>Make a share link</button><button type="button" class="tm-link" data-lvi-act="fam-revoke"' + off + '>Turn off their links</button></div>' +
      '<div id="lviFamOut"></div><p class="lv-msg" id="lviFamMsg" role="status" aria-live="polite"></p>' + (ctx.demo ? '<p class="d5-mut lvi-fine"><b>Sample class: nothing is made.</b></p>' : '') + '</section>';
  }
  function student(ctx){
    css();
    var n = norm(ctx);
    if(!n.rep || !n.student) return '';
    return familiesCard(n);
  }
  function googleCard(ctx){
    // Sample class: the card as a linked class shows it, every button off.
    if(ctx && ctx.demo) return '<section class="d5-card lvi" id="lviGoogle"><p class="lv-kick">Google Classroom</p><h3 class="lv-h3">Bring your Classroom roster, post assignments, send grades</h3>' +
      '<div id="lviGoogleBody"><p class="d5-mut">Connected as <b>ms.rivera@sample.school</b>. Linked to <b>AP Biology · Period 3</b>.</p>' +
      '<div class="lv-btns"><button type="button" class="lv-btn is-sm" disabled>Check the roster</button><button type="button" class="lv-btn is-sm is-ghost" disabled>Post the join link in Classroom</button><button type="button" class="lv-btn is-sm is-ghost" disabled>Copy join link</button><button type="button" class="lv-btn is-sm is-ghost" disabled>Disconnect</button></div>' +
      '<p class="d5-mut lvi-fine"><b>Sample class: nothing is connected.</b> In your own class you connect with the Google account you use for Classroom.</p></div></section>';
    return '<section class="d5-card lvi" id="lviGoogle" hidden><p class="lv-kick">Google Classroom</p><h3 class="lv-h3">Bring your Classroom roster, post assignments, send grades</h3><div id="lviGoogleBody"><p class="d5-mut">Loading…</p></div>' +
      '<p class="lv-msg" id="lviGoogleMsg" role="status" aria-live="polite"></p></section>';
  }
  function lmsCard(){
    return '<section class="d5-card lvi" id="lviLms"><p class="lv-kick">Canvas and Schoology</p><h3 class="lv-h3">Add assignments from your LMS, grades flow back</h3>' +
      '<p class="d5-mut">Your school’s LMS admin adds LevlPrep once (LTI 1.3). Then, in an LMS assignment, pick LevlPrep and choose this class’s assignment; required ones get a gradebook column and you send grades from the assignment page here.</p>' +
      '<div class="lv-btns"><a class="lv-btn is-sm is-ghost" href="/teach/lms.html">Setup guide for your admin</a></div></section>';
  }
  function moreCard(){
    return '<section class="d5-card lvi"><p class="lv-kick">For your school</p><h3 class="lv-h3">Class Premium, purchase orders and privacy paperwork</h3>' +
      '<div class="lv-btns"><a class="lv-btn is-sm is-ghost" href="/teach/quote.html">Ask for a quote or send a purchase order</a><a class="lv-btn is-sm is-ghost" href="/teach/privacy-agreement.html">Student data privacy and DPA</a></div></section>';
  }
  // Settings shows one section at a time: part 'connect' (Google Classroom, Canvas and Schoology) or 'school'.
  function settings(ctx){
    css();
    var n = norm(ctx);
    if(!n.rep) return '';
    if(n.part === 'school') return '<div class="lvi-wrap">' + moreCard() + '</div>';
    if(n.part === 'connect') return '<div class="lvi-wrap">' + (isOwner(n) ? googleCard(n) + lmsCard() : '') + '</div>';
    return '<div class="lvi-wrap">' + (isOwner(n) ? googleCard(n) + lmsCard() : '') + moreCard() + '</div>';
  }

  function googleBody(ctx, g){
    if(!g.connected){
      var q = new URLSearchParams(location.search).get('google');
      var why = { canceled: 'Google sign-in was canceled.', failed: 'Google did not finish connecting. Try again.', scopes: 'Google needs every box ticked to connect. Try again and allow all of them.' }[q] || '';
      return (why ? '<p class="lv-msg is-bad">' + esc(why) + '</p>' : '') + '<p class="d5-mut">Connect with the Google account you use for Classroom. LevlPrep reads your class list and roster (names, no email addresses), adds coursework you choose, posts the join link when you press the button, and sets grades you send. It never reads anything else, and you can disconnect any time.</p>' +
        '<div class="lv-btns"><button type="button" class="lv-btn is-sm" data-lvi-act="gc-connect">Connect Google Classroom</button></div>';
    }
    return '<p class="d5-mut">Connected as <b>' + esc(g.email || 'your Google account') + '</b>. ' + (g.linked ? 'Linked to <b>' + esc(g.linked.title || 'a Classroom class') + '</b>.' : 'Pick the Classroom class that matches this one.') + '</p>' +
      '<div class="lvi-row"><label class="lv-field"><span>Classroom class</span><select class="lv-in" id="lviGcCourse"><option value="">Loading…</option></select></label></div>' +
      '<div class="lv-btns"><button type="button" class="lv-btn is-sm is-ghost" data-lvi-act="gc-link">Link this class</button>' +
      (g.linked ? '<button type="button" class="lv-btn is-sm" data-lvi-act="gc-roster">Check the roster</button>' + joinButtons() : '') +
      '<button type="button" class="lv-btn is-sm is-ghost" data-lvi-act="gc-disconnect">Disconnect</button></div><div id="lviGcRoster"></div>';
  }
  function joinButtons(){
    return '<button type="button" class="lv-btn is-sm is-ghost" data-lvi-act="gc-announce">Post the join link in Classroom</button>' +
      '<button type="button" class="lv-btn is-sm is-ghost" data-lvi-act="gc-copy">Copy join link</button>';
  }
  /* Back from Google with ?gp=: claim the token for this signed-in teacher, then drop it from the address. */
  var finishing = null;
  function finishGoogle(){
    if(finishing) return finishing;
    var q = new URLSearchParams(location.search), gp = q.get('gp');
    if(!gp){ finishing = Promise.resolve(); return finishing; }
    q.delete('gp'); q.set('google', 'connected');
    try{ history.replaceState(null, '', location.pathname + '?' + q.toString() + location.hash); }catch(e){}
    finishing = api('/class/google/finish', { gp: gp }).catch(function(e){ msgLater = errText(e); });
    return finishing;
  }
  var msgLater = '';
  function wireGoogle(ctx){
    var id = ctx.rep.class.id;
    finishGoogle().then(function(){ return api('/class/google/status', { class: id }); }).then(function(g){
      if(msgLater){ msg($('lviGoogleMsg'), msgLater, true); msgLater = ''; }
      gstat[id] = g;
      if(!g.on || ctx !== CUR) return;
      if(CUR.assignment) features().then(function(f){ wireGrades(CUR, f); });
      var box = $('lviGoogle'); if(!box) return;
      box.hidden = false;
      $('lviGoogleBody').innerHTML = googleBody(ctx, g);
      if(g.connected) api('/class/google/courses', {}).then(function(r){
        var sel = $('lviGcCourse'); if(!sel) return;
        sel.innerHTML = '<option value="">Pick one</option>' + (r.courses || []).map(function(c){ return '<option value="' + esc(c.id) + '"' + (g.linked && g.linked.external_id === c.id ? ' selected' : '') + '>' + esc(c.name + (c.section ? ' · ' + c.section : '')) + '</option>'; }).join('');
      }, function(e){ msg($('lviGoogleMsg'), errText(e), true); });
    }, function(){});
  }

  /* ============================================================ actions */

  function act(name, btn){
    var ctx = CUR; if(!ctx || ctx.demo) return;
    var id = ctx.rep.class.id, a = ctx.assignment;
    var busy = function(on){ btn.disabled = on; };
    if(name === 'remind'){
      var who = [].slice.call(document.querySelectorAll('[data-lvi-who]:checked')).map(function(i){ return i.value; });
      if(!who.length){ msg($('lviRemindMsg'), 'Tick at least one student.', true); return; }
      busy(true); msg($('lviRemindMsg'), 'Sending…');
      var tz = ''; try{ tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; }catch(e){}
      api('/class/remind', { class: id, assignment: a.id, students: who, note: ($('lviNote') || {}).value || '', tz: tz }).then(function(r){
        var why = { limit: 'already reminded today', stopped: 'turned reminders off', 'no-email': 'no email on the account', 'send-failed': 'did not go through' };
        var names = function(list){ return list.map(function(s){ var m = ctx.rep.members.filter(function(x){ return x.id === s.id; })[0]; return (m ? m.name : 'a student') + ' (' + (why[s.why] || s.why) + ')'; }).join(', '); };
        msg($('lviRemindMsg'), 'Sent to ' + plural(r.sent, 'student') + '.' + (r.skipped && r.skipped.length ? ' Not sent: ' + names(r.skipped) + '.' : ''));
      }, function(e){ msg($('lviRemindMsg'), errText(e), true); }).then(function(){ busy(false); });
    }
    if(name === 'fam-print'){
      window.open('/teach/report.html?c=' + encodeURIComponent(id) + '&s=' + encodeURIComponent($('lviFamWho').value), '_blank', 'noopener');
    }
    if(name === 'fam-link'){
      busy(true); msg($('lviFamMsg'), 'Making the link…');
      api('/class/report-link', { class: id, student: $('lviFamWho').value, days: +$('lviFamDays').value }).then(function(r){
        msg($('lviFamMsg'), '');
        $('lviFamOut').innerHTML = '<label class="lv-field"><span>Share link (works until ' + esc(new Date(r.expires_at).toLocaleDateString()) + ')</span><input class="lv-in" id="lviFamUrl" readonly value="' + esc(r.url) + '"></label>' +
          '<div class="lv-btns"><button type="button" class="lv-btn is-sm is-ghost" data-lvi-act="fam-copy">Copy link</button></div><p class="d5-mut lvi-fine">Anyone with the link can see this report until it expires. Send it the way you already reach the family.</p>';
      }, function(e){ msg($('lviFamMsg'), errText(e), true); }).then(function(){ busy(false); });
    }
    if(name === 'fam-copy'){
      var inp = $('lviFamUrl'); inp.select();
      (navigator.clipboard ? navigator.clipboard.writeText(inp.value) : Promise.reject()).then(function(){ msg($('lviFamMsg'), 'Copied.'); }, function(){ document.execCommand && document.execCommand('copy'); msg($('lviFamMsg'), 'Copied.'); });
    }
    if(name === 'fam-revoke'){
      if(!confirm('Turn off every share link for this student in this class?')) return;
      api('/class/report-link/revoke', { class: id, student: $('lviFamWho').value }).then(function(){ $('lviFamOut').innerHTML = ''; msg($('lviFamMsg'), 'Every link for this student is off.'); }, function(e){ msg($('lviFamMsg'), errText(e), true); });
    }
    if(name === 'gc-connect'){
      busy(true);
      api('/class/google/start', { class: id }).then(function(r){ location.href = r.url; }, function(e){ busy(false); msg($('lviGoogleMsg'), errText(e), true); });
    }
    if(name === 'gc-link'){
      var c = $('lviGcCourse').value, t = $('lviGcCourse').selectedOptions[0];
      if(!c){ msg($('lviGoogleMsg'), 'Pick a Classroom class.', true); return; }
      busy(true);
      api('/class/google/link', { class: id, course: c }).then(function(){ msg($('lviGoogleMsg'), 'Linked to ' + (t ? t.textContent : 'that class') + '.'); wireGoogle(ctx); }, function(e){ busy(false); msg($('lviGoogleMsg'), errText(e), true); });
    }
    if(name === 'gc-disconnect'){
      if(!confirm('Disconnect Google Classroom? Posted coursework stays in Classroom.')) return;
      api('/class/google/disconnect', {}).then(function(){ wireGoogle(ctx); }, function(e){ msg($('lviGoogleMsg'), errText(e), true); });
    }
    if(name === 'gc-roster'){
      busy(true); msg($('lviGoogleMsg'), 'Checking…');
      api('/class/google/roster', { class: id }).then(function(r){
        msg($('lviGoogleMsg'), '');
        if(r.join) gstat[id] = Object.assign({}, gstat[id] || {}, { join: r.join });
        $('lviGcRoster').innerHTML = '<p class="d5-mut"><b>' + plural(r.matched.length, 'student') + '</b> matched. ' +
          (r.notInClassroom.length ? 'In this class but not matched to Classroom yet: ' + r.notInClassroom.map(function(x){ return esc(x.name); }).join(', ') + '. They match once they sign in to LevlPrep with Google, using the account they use in Classroom. ' : '') + '</p>' +
          (r.missing.length ? '<p class="lv-h3">In Classroom, not matched yet</p><ul class="lvi-list">' + r.missing.map(function(x){ return '<li>' + esc(x.name) + '</li>'; }).join('') + '</ul>' +
            '<p class="d5-mut lvi-fine">They join with the class code or join link and sign in with Google using their school account; then they match here. Joining stays their choice. Use &ldquo;Post the join link in Classroom&rdquo; above, or copy the link and share it yourself.</p>' :'<p class="d5-mut">Everyone in Classroom is matched.</p>');
      }, function(e){ msg($('lviGoogleMsg'), errText(e), true); }).then(function(){ busy(false); });
    }
    if(name === 'gc-announce'){
      if(!confirm('Post the join link as an announcement in your Classroom class? Every student in it will see it.')) return;
      busy(true); msg($('lviGoogleMsg'), 'Posting…');
      api('/class/google/announce', { class: id }).then(function(r){
        if(r.join) gstat[id] = Object.assign({}, gstat[id] || {}, { join: r.join });
        msg($('lviGoogleMsg'), 'Posted the join link in Google Classroom.');
      }, function(e){ msg($('lviGoogleMsg'), errText(e), true); }).then(function(){ busy(false); });
    }
    if(name === 'gc-copy'){
      var url = (gstat[id] && gstat[id].join) || '';
      if(!url){ msg($('lviGoogleMsg'), 'The join link is not loaded yet. Try again in a moment.', true); return; }
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function(){ msg($('lviGoogleMsg'), 'Copied ' + url); }, function(){ window.prompt('Copy the join link:', url); });
    }
    if(name === 'gc-post'){
      busy(true);
      api('/class/google/post', { class: id, assignment: a.id }).then(function(r){ msg($('lviGradeMsg'), r.already ? 'Already in Classroom.' : 'Posted to Google Classroom.'); }, function(e){ msg($('lviGradeMsg'), errText(e), true); }).then(function(){ busy(false); });
    }
    if(name === 'gc-grades' || name === 'lti-grades'){
      var grades = gradeList(ctx, $('lviZero') && $('lviZero').checked, frqState.scores);
      if(!grades.length){ msg($('lviGradeMsg'), 'No finished work to send yet.', true); return; }
      if(!confirm('Send ' + plural(grades.length, 'grade') + ' to ' + (name === 'gc-grades' ? 'Google Classroom' : 'your LMS') + '? Grades already there are replaced.')) return;
      busy(true); msg($('lviGradeMsg'), 'Sending…');
      api(name === 'gc-grades' ? '/class/google/grades' : '/lti/grades', { class: id, assignment: a.id, grades: grades }).then(function(r){
        msg($('lviGradeMsg'), 'Sent ' + plural(r.sent, 'grade') + '.' + (r.skipped.length ? ' ' + r.skipped.length + ' not sent: students not matched yet' + (name === 'gc-grades' ? ' (check the roster in Settings)' : ' (they need to open it once from the LMS)') + '.' : '') + (name === 'gc-grades' ? ' Return them to students in Classroom.' : ''));
      }, function(e){ msg($('lviGradeMsg'), errText(e), true); }).then(function(){ busy(false); });
    }
    if(name === 'frq-ai' || name === 'frq-save'){
      var box = btn.closest('[data-sub]'), student = box.getAttribute('data-sub'), out = box.querySelector('.lv-msg');
      if(name === 'frq-ai'){
        busy(true); msg(out, 'Reading the answer…');
        api('/class/frq/ai', { class: id, assignment: a.id, student: student }).then(function(r){
          msg(out, 'Suggested points are ticked. Check each one, then save.');
          (r.parts || []).forEach(function(p){ p.points.forEach(function(pt, k){
            var i = box.querySelector('[data-pt="' + p.label + ':' + k + '"]'), n = box.querySelector('[data-ai="' + p.label + ':' + k + '"]');
            if(i) i.checked = !!pt.earned;
            if(n) n.textContent = 'AI: ' + (pt.reason || '') + (pt.quote ? ' “' + pt.quote + '”' : '');
          }); });
        }, function(e){ msg(out, errText(e), true); }).then(function(){ busy(false); });
      } else {
        var sc = collect(box);
        busy(true);
        A().rpcData('teach_frq_score', { p_assignment: a.id, p_student: student, p_score: sc }).then(function(ok){
          if(!ok){ msg(out, 'Not saved. The student may have sent a new answer; reload the page.', true); return; }
          frqState.scores[student] = sc;
          box.querySelector('summary .lv-tag').textContent = sc.got + ' / ' + sc.of;
          msg(out, 'Saved. The student can see it now.');
        }, function(){ msg(out, 'Not saved. Try again.', true); }).then(function(){ busy(false); });
      }
    }
  }

  /* The assignment page has a slot for each card (Remind and Send grades open from buttons; free-response scoring
     sits under the students). Move each card there, and show a button only when its card is there and not hidden. */
  var SLOTS = { lviRemind: 'lvtSlotRemind', lviGrades: 'lvtSlotGrades', lviFrq: 'lvtSlotFrq' };
  function place(){
    Object.keys(SLOTS).forEach(function(k){ var card = $(k), slot = $(SLOTS[k]); if(card && slot && card.parentNode !== slot){ slot.innerHTML = ''; slot.appendChild(card); } });
    syncSlots();
  }
  function syncSlots(){
    [].forEach.call(document.querySelectorAll('[data-lvt-slot]'), function(d){ var slot = $(d.getAttribute('data-lvt-slot')), card = slot && slot.firstElementChild; d.hidden = !card || card.hidden; });
  }
  function wire(ctx){
    var n = norm(ctx);
    CUR = n;
    place();
    if(!wired){
      wired = true;
      document.addEventListener('click', function(e){
        var b = e.target.closest && e.target.closest('[data-lvi-act]');
        if(b && !b.disabled) act(b.getAttribute('data-lvi-act'), b);
      });
    }
    if(!n.rep) return;
    if(n.where === 'assignment' && n.assignment && !n.full){
      loadRep(n).then(function(){
        if(n !== CUR) return;
        var box = n.box || document.querySelector('[data-lvi-pending]');
        if(box) box.innerHTML = assignment(n);
        place();
        wireRest(n);
      }, function(){ var box = n.box || document.querySelector('[data-lvi-pending]'); if(box) box.innerHTML = ''; });
      return;
    }
    wireRest(n);
  }
  function wireRest(ctx){
    if(ctx.demo){ if(ctx.assignment && ctx.assignment.kind === 'frq') demoFrq(ctx); return; }
    features().then(function(f){
      if(ctx !== CUR) return;
      if(!f.reminders && $('lviRemind')){
        var r = $('lviRemind').querySelector('[data-lvi-act="remind"]');
        if(r){ r.disabled = true; msg($('lviRemindMsg'), 'Reminder emails are not switched on yet.'); }
      }
      if(!f.reports){ var l = document.querySelector('[data-lvi-act="fam-link"]'); if(l) l.disabled = true; }
      if(ctx.assignment){ wireFrq(ctx, f); wireGrades(ctx, f); }
      if(f.google && isOwner(ctx) && ($('lviGoogle') || $('lviGrades'))) wireGoogle(ctx);
    });
  }

  window.LevlTeachIntegrations = { settings: settings, assignment: assignment, student: student, wire: wire, gradeList: function(c, z, f){ return gradeList(norm(c), z, f); } };
})();
