/* The exam-date card on each course's Dashboard: a countdown to the student's
   exam and what that leaves per day. It replaced the NREMT Study Plan page,
   whose planner asked for "days until your exam" every visit and forgot the
   answer; here the date is asked once and the card does the arithmetic.

     LevlExamDate.mount(el, {
       subject: 'nremt',              // storage key is <subject>_exam_date
       target: function(days){        // optional: the per-day number
         return { n: 12, unit: 'new questions', why: 'covers the rest of the bank once' };
       },
       links: { practice: 'practice.html', review: 'review.html', exams: 'exams.html' }
     });

   The date stays on this device. It is not added to the course's sync
   namespace, because a push from a page that never loaded this file would
   drop it from the server copy, and a countdown that comes and goes is worse
   than one you set once per device. */
(function(){
  var STYLE_ID = 'levlExamDateStyle';
  var CSS =
    '.xd-card{margin:0 0 20px;}' +
    '.xd-card h2{margin:0 0 10px;}' +
    '.xd-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;}' +
    '.xd-row input[type=date]{font:700 15px var(--font-ui);padding:10px 12px;border:var(--bw,2px) solid var(--line);border-radius:var(--radius-sm,10px);background:var(--white);color:var(--ink);}' +
    '.xd-big{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 0 6px;}' +
    '.xd-big b{font:900 34px/1 var(--font-ui);color:var(--ink);}' +
    '.xd-big span{font-size:14px;font-weight:700;color:var(--muted);}' +
    '.xd-target{margin:12px 0 0;padding:12px 14px;border-radius:var(--radius,14px);background:var(--surface2,var(--tint-accent));font-size:14px;font-weight:700;line-height:1.5;}' +
    '.xd-target b{font-size:17px;}' +
    '.xd-phase{margin:10px 0 0;font-size:13.5px;font-weight:600;color:var(--muted);line-height:1.55;}' +
    '.xd-note{margin:10px 0 0;font-size:12px;font-weight:600;color:var(--muted);}' +
    '.xd-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}' +
    '.xd-link{background:none;border:0;padding:0;font:800 13px var(--font-ui);color:var(--accent);cursor:pointer;text-decoration:underline;}';

  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  function key(subject){ return (subject || 'levl') + '_exam_date'; }
  function read(subject){
    try{ var v = localStorage.getItem(key(subject)); return /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null; }catch(e){ return null; }
  }
  function write(subject, v){
    try{ if(v) localStorage.setItem(key(subject), v); else localStorage.removeItem(key(subject)); }catch(e){}
  }
  function todayIso(){
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // Whole calendar days from today to the exam, in local time, so the count
  // ticks over at midnight rather than at the hour the date was set.
  function daysUntil(iso){
    var p = iso.split('-').map(Number);
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var e = new Date(p[0], p[1] - 1, p[2]);
    return Math.round((e - t) / 86400000);
  }
  function longDate(iso){
    var p = iso.split('-').map(Number);
    try{ return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
    catch(e){ return iso; }
  }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // The same three tiers the Study Plan used, said once instead of as a plan
  // to rebuild every visit.
  function phase(days, links){
    var L = links || {};
    var review = L.review ? '<a href="' + esc(L.review) + '">review queue</a>' : 'review queue';
    var exams = L.exams ? '<a href="' + esc(L.exams) + '">timed exam</a>' : 'timed exam';
    if(days <= 0) return 'Light review only today. No new material, and no full exam.';
    if(days <= 3) return 'Breadth now: a short drill in your weakest area each day, one ' + exams + ' with a day to spare, and the rest in your ' + review + '.';
    if(days <= 10) return 'Rotate through your weak areas one a day, keep the ' + review + ' near zero, and save the last few days for a ' + exams + ' and review.';
    return 'Plenty of runway. New material most days, a ' + exams + ' about once a week, and the ' + review + ' cleared as you go rather than at the end.';
  }

  function mount(el, opts){
    if(!el) return;
    opts = opts || {};
    injectStyle();
    var subject = opts.subject;
    var editing = false;

    function render(){
      var date = read(subject);
      var html = '<section class="panel xd-card" aria-labelledby="xdHead-' + esc(subject) + '">';
      if(!date || editing){
        html += '<h2 id="xdHead-' + esc(subject) + '">' + (date ? 'Change your exam date' : 'When is your exam?') + '</h2>' +
          '<form class="xd-row" data-xd="form">' +
            '<label class="sr-only" for="xdInput-' + esc(subject) + '">Exam date</label>' +
            '<input type="date" id="xdInput-' + esc(subject) + '" min="' + todayIso() + '" value="' + esc(date || '') + '" required>' +
            '<button type="submit" class="btn-press sm">Save</button>' +
            (date ? '<button type="button" class="xd-link" data-xd="cancel">Cancel</button>' : '') +
          '</form>' +
          '<p class="xd-note">Set it and this card counts down, with what that means per day. Stored on this device only.</p>';
      } else {
        var days = daysUntil(date);
        html += '<h2 id="xdHead-' + esc(subject) + '">Your exam</h2>';
        if(days < 0){
          html += '<p class="xd-phase" style="margin-top:0">Your exam date, ' + esc(longDate(date)) + ', has passed. Set the next one?</p>';
        } else {
          html += '<div class="xd-big"><b>' + (days === 0 ? 'Today' : days + (days === 1 ? ' day' : ' days')) + '</b><span>' +
            (days === 0 ? 'Good luck.' : 'until ' + esc(longDate(date))) + '</span></div>';
          var t = days > 0 && typeof opts.target === 'function' ? opts.target(days) : null;
          if(t && t.n > 0){
            html += '<div class="xd-target"><b>' + t.n.toLocaleString() + '</b> ' + esc(t.unit) + ' a day ' + esc(t.why || '') + '.</div>';
          } else if(t && t.done){
            html += '<div class="xd-target">' + esc(t.done) + '</div>';
          }
          html += '<p class="xd-phase">' + phase(days, opts.links) + '</p>';
        }
        html += '<div class="xd-actions"><button type="button" class="xd-link" data-xd="edit">Change date</button>' +
          '<button type="button" class="xd-link" data-xd="clear">Clear</button></div>';
      }
      html += '</section>';
      el.innerHTML = html;
      var form = el.querySelector('[data-xd="form"]');
      if(form) form.addEventListener('submit', function(e){
        e.preventDefault();
        var v = form.querySelector('input').value;
        if(!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
        write(subject, v);
        editing = false;
        render();
      });
      var on = function(name, fn){ var b = el.querySelector('[data-xd="' + name + '"]'); if(b) b.addEventListener('click', fn); };
      on('cancel', function(){ editing = false; render(); });
      on('edit', function(){ editing = true; render(); });
      on('clear', function(){ write(subject, null); editing = false; render(); });
    }
    render();
    return { render: render };
  }

  window.LevlExamDate = { mount: mount, read: read, daysUntil: daysUntil };
})();
