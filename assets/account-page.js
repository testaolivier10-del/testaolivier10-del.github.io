/* account.html: the signed-in student's Premium, purchases and refunds.

   Reads my_purchases() (scripts/sql/schema.sql), which answers only for the
   signed-in user. Buying and extending go through the same dialog as every
   course page (LevlPremium.open). Refunds go to the Worker's /premium/refund,
   which enforces the rules (own paid order, 7 days, once per account); the
   page only mirrors them so it doesn't offer a button that would be refused. */
(function (window, document) {
  'use strict';

  var ENDPOINT = 'https://api.levlprep.com'; // site-config:API_URL
  var SUPPORT = 'hello@levlprep.com';
  var WINDOW_DAYS = 7;
  var DAY_MS = 86400000;
  // The paid courses, in registry order (assets/courses.js).
  // courses:begin COURSE_LIST key,paid (generated from assets/courses.js by scripts/build-courses.mjs; edit there)
  var COURSE_LIST = [
    { key: 'nremt', paid: true },
    { key: 'ochem', paid: true },
    { key: 'anp', paid: true },
    { key: 'apbio', paid: true },
    { key: 'apchem', paid: true },
  ];
  // courses:end
  var COURSE_ORDER = COURSE_LIST.filter(function (c) { return c.paid; }).map(function (c) { return c.key; });

  var A, P;
  var rows = null;
  var busy = false;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function day(t) {
    return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function money(cents) { return '$' + (cents / 100).toFixed(2); }

  function courseName(course) {
    var c = P && P.COURSES[course];
    return c ? c.name : course;
  }
  function passLabel(row) {
    if (row.pass === 'grant') return 'Free month';
    if (row.pass === 'guarantee') return 'Pass-or-extend extension';
    var c = P && P.COURSES[row.course];
    var hit = c && (c.passes || []).filter(function (p) { return p.id === row.pass; })[0];
    return hit ? hit.label : row.pass;
  }
  function isPurchase(r) { return !!r.order_id && r.amount_cents > 0; }

  function user() { return A && A.user ? A.user() : null; }

  function load() {
    if (!user()) { rows = null; render(); return; }
    A.rpcData('my_purchases', {}).then(function (data) {
      rows = Array.isArray(data) ? data : [];
      render();
    });
  }

  function render() {
    var u = user();
    $('acctOut').hidden = !!u;
    $('acctIn').hidden = !u;
    if (!u) return;
    $('acctWho').innerHTML = 'Signed in as <strong>' + esc(u.email || 'your account') + '</strong>.';
    if (rows === null) { $('acctCourses').innerHTML = '<p>Loading…</p>'; return; }
    renderCourses();
    renderOrders();
    renderGuarantee();
  }

  /* Pass-or-extend (NREMT). The Worker's /premium/guarantee holds the rules
     (worker/src/premium.js, premiumGuarantee); this only shows the form to
     someone who could use it and explains a refusal in the Worker's words.
     The conditions are LevlPremium.guaranteeText(), the same paragraph the
     purchase dialog and premium.html show. */
  function guaranteeText() {
    var P = window.LevlPremium;
    return (P && P.guaranteeText ? P.guaranteeText() : '') +
      ' An exam counts only when you finish it while signed in. ' +
      'We may check claims against the National Registry’s public certification lookup.';
  }

  function renderGuarantee() {
    var box = $('acctGuarantee');
    if (!box) return;
    var nremt = rows.filter(function (r) { return r.course === 'nremt'; });
    var used = nremt.filter(function (r) { return r.pass === 'guarantee'; })[0];
    var bought = nremt.some(function (r) { return isPurchase(r) && !r.refunded_at; });
    if (used) {
      box.innerHTML = '<p>You’ve used Pass-or-extend: your extension runs until <strong>' +
        esc(day(Date.parse(used.expires_at))) + '</strong>. Good luck on the retake.</p>';
      return;
    }
    if (!bought) {
      box.innerHTML = '<p>Comes with a bought NREMT pass. ' + esc(guaranteeText()) + '</p>';
      return;
    }
    box.innerHTML = '<p>' + esc(guaranteeText()) + '</p>' +
      '<form class="gform" id="gForm" novalidate>' +
        '<label>Full legal name, as the Registry has it<input type="text" id="gName" autocomplete="name" maxlength="100" required></label>' +
        '<label>State you tested for<input type="text" id="gState" autocomplete="address-level1" maxlength="40" required></label>' +
        '<label>Exam date<input type="date" id="gDate" required></label>' +
        '<label class="check"><input type="checkbox" id="gTrue" required> I took the NREMT cognitive exam on that date and did not pass.</label>' +
        '<div><button type="submit" class="btn-press sm" id="gSend">Claim my extension</button></div>' +
        '<p class="note" id="gNote" role="status"></p>' +
      '</form>';
    $('gDate').max = new Date().toISOString().slice(0, 10);
  }

  function claimGuarantee(e) {
    e.preventDefault();
    if (busy) return;
    var out = $('gNote');
    function say(t, good) { out.textContent = t; out.className = 'note ' + (good ? 'good' : 'bad'); }
    if (!$('gTrue').checked) { say('Tick the box to confirm you didn’t pass.'); return; }
    if (!$('gDate').value) { say('Enter the date of your exam.'); return; }
    var btn = $('gSend');
    busy = true;
    btn.disabled = true;
    A.accessToken().then(function (token) {
      if (!token) throw new Error('Your session has expired. Sign in again.');
      // The Worker counts exams from the synced copy (the NREMT pages sync it
      // while signed in), not from this browser.
      return fetch(ENDPOINT + '/premium/guarantee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ legal_name: $('gName').value, state: $('gState').value, exam_date: $('gDate').value }),
      });
    }).then(function (res) {
      return res.json().then(function (body) { return { ok: res.ok, body: body }; }, function () { return { ok: false, body: {} }; });
    }).then(function (r) {
      busy = false;
      if (!r.ok) throw new Error((r.body && r.body.error) || 'That didn’t go through. Try again in a moment.');
      if (P && P.refresh) P.refresh();
      load();
      if (window.LevlAnnounce) window.LevlAnnounce.say('Extension added.');
    }).catch(function (err) {
      busy = false;
      btn.disabled = false;
      say(err && err.message ? err.message : 'That didn’t go through. Try again in a moment.');
    });
  }

  function renderCourses() {
    var now = Date.now();
    $('acctCourses').innerHTML = COURSE_ORDER.map(function (course) {
      var live = rows.filter(function (r) {
        return r.course === course && !r.refunded_at && Date.parse(r.expires_at) > now;
      });
      var end = live.reduce(function (m, r) { return Math.max(m, Date.parse(r.expires_at)); }, 0);
      var paid = live.some(isPurchase);
      var state = !end ? 'Not active'
        : (paid ? 'Premium active until ' : 'Free month until ') + day(end);
      return '<div class="panel course">' +
        '<div><b>' + esc(courseName(course)) + '</b>' +
        '<span class="state' + (end ? ' on' : '') + '">' + esc(state) + '</span></div>' +
        '<div class="buy"><button type="button" class="btn-press sm" data-buy="' + course + '">' +
          (end ? 'Extend' : 'Get Premium') + '</button></div>' +
      '</div>';
    }).join('');
  }

  function renderOrders() {
    var now = Date.now();
    var usedRefund = rows.some(function (r) { return isPurchase(r) && r.refunded_at; });
    var list = rows;
    $('acctNoOrders').hidden = list.length > 0;
    $('acctOrders').innerHTML = list.map(function (r) {
      var start = Date.parse(r.starts_at), end = Date.parse(r.expires_at);
      var chip = r.refunded_at ? ['refunded', 'Refunded']
        : end <= now ? ['ended', 'Ended']
        : start > now ? ['', 'Starts ' + day(start)]
        : ['', 'Active'];
      var html = '<li class="order"><div class="top">' +
        '<b>' + esc(courseName(r.course)) + ' &middot; ' + esc(passLabel(r)) + '</b>' +
        '<span class="chip ' + chip[0] + '">' + esc(chip[1]) + '</span></div>' +
        '<div class="meta">' + day(start) + ' &ndash; ' + day(end) +
        (isPurchase(r) ? ' &middot; ' + money(r.amount_cents) + ' + tax &middot; bought ' + day(Date.parse(r.created_at)) : '') +
        '</div>';
      if (isPurchase(r) && !r.refunded_at) {
        var left = WINDOW_DAYS * DAY_MS - (now - Date.parse(r.created_at));
        if (left > 0 && !usedRefund) {
          html += '<div class="refund" data-refund-box="' + esc(r.order_id) + '">' +
            '<button type="button" class="btn-press sm alt" data-refund="' + esc(r.order_id) + '" data-amount="' + r.amount_cents + '">Refund this pass</button>' +
            '<span>Available for ' + Math.max(1, Math.ceil(left / DAY_MS)) + ' more day' + (Math.ceil(left / DAY_MS) === 1 ? '' : 's') + '.</span>' +
          '</div>';
        } else if (left > 0) {
          html += '<div class="refund"><span>Not refundable: this account has already had its one refund.</span></div>';
        }
      }
      return html + '<p class="note" data-refund-note="' + esc(r.order_id || '') + '"></p></li>';
    }).join('');
  }

  function note(orderId, text, good) {
    var el = document.querySelector('[data-refund-note="' + orderId + '"]');
    if (el) { el.textContent = text; el.className = 'note ' + (good ? 'good' : 'bad'); }
  }

  /* Two steps rather than window.confirm(): the second button says exactly
     what happens, and nothing native blocks the page. */
  function askRefund(btn) {
    var id = btn.getAttribute('data-refund');
    var box = document.querySelector('[data-refund-box="' + id + '"]');
    if (!box) return;
    box.innerHTML = '<span>Refund ' + money(+btn.getAttribute('data-amount')) +
      ' plus tax? The pass ends now.</span>' +
      '<button type="button" class="btn-press sm" data-refund-yes="' + esc(id) + '">Yes, refund it</button>' +
      '<button type="button" class="btn-press sm alt" data-refund-no="1">Keep it</button>';
  }

  function doRefund(btn) {
    if (busy) return;
    var id = btn.getAttribute('data-refund-yes');
    busy = true;
    btn.disabled = true;
    btn.textContent = 'Refunding…';
    A.accessToken().then(function (token) {
      if (!token) throw new Error('Your session has expired. Sign in again.');
      return fetch(ENDPOINT + '/premium/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ order_id: id }),
      });
    }).then(function (res) {
      return res.json().then(function (body) { return { ok: res.ok, body: body }; }, function () { return { ok: false, body: {} }; });
    }).then(function (r) {
      busy = false;
      if (!r.ok) throw new Error((r.body && r.body.error) || 'The refund didn’t go through. Try again in a moment.');
      if (P && P.refresh) P.refresh();
      load();
      setTimeout(function () { note(id, 'Refunded. The money usually reaches your card in 5–10 business days.', true); }, 600);
      if (window.LevlAnnounce) window.LevlAnnounce.say('Refunded.');
    }).catch(function (e) {
      busy = false;
      btn.disabled = false;
      btn.textContent = 'Yes, refund it';
      note(id, e && e.message ? e.message : 'The refund didn’t go through. Try again in a moment.', false);
    });
  }

  function onClick(e) {
    var t = e.target.closest ? e.target.closest('button') : null;
    if (!t) return;
    if (t.id === 'acctSignIn') { if (A) A.openAuthModal('signin'); return; }
    if (t.hasAttribute('data-buy') && P) { P.open(t.getAttribute('data-buy'), 'account', t); return; }
    if (t.hasAttribute('data-refund')) { askRefund(t); return; }
    if (t.hasAttribute('data-refund-yes')) { doRefund(t); return; }
    if (t.hasAttribute('data-refund-no')) { renderOrders(); return; }
  }

  function start() {
    A = window.StudyHubAccount;
    P = window.LevlPremium;
    document.addEventListener('click', onClick);
    document.addEventListener('submit', function (e) { if (e.target && e.target.id === 'gForm') claimGuarantee(e); });
    if (!A) { render(); return; }
    if (A.renderAccountUI) A.renderAccountUI();
    A.onAuthChange(function () { load(); });
    // A purchase finishing in the checkout pop-up updates access; reload the list.
    if (P && P.onChange) P.onChange(function () { if (user()) load(); });
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window, document);
