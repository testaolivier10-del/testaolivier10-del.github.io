/* certificate.html: a certificate of completion for one milestone.

   The URL says which one (?course=anp&m=ch-cells) and nothing else. It is
   never believed on its own: the milestone is re-checked against the progress
   in this browser (assets/milestones.js), and only an earned one is drawn. So
   the same link does two jobs:
     - for the student who earned it, the certificate, with their name typed
       in, to print, save as an image or share;
     - for anyone they send it to, or the student on another device, a short
       description of the course and a way in, instead of a broken page or a
       certificate nobody earned in that browser.

   The name is typed here and kept in this browser only (levlprep_cert_name).
   It is not in the link, not synced, not in a backup, and not sent anywhere;
   a shared link therefore never carries anyone's name.

   What it says, and does not: "Certificate of completion", the course, the
   milestone, the date it was earned and LevlPrep — and, on every copy, that it
   is a record of study on LevlPrep and not a credential, and that LevlPrep is
   not affiliated with the NREMT or any school. A certificate that could be
   mistaken for a qualification would do the student harm the first time
   somebody relied on it. */
(function(){
  var M = window.LevlMilestones;
  var app = document.getElementById('certApp');
  var NAME_KEY = 'levlprep_cert_name';
  var FOOT = 'A record of study on LevlPrep, not a credential. LevlPrep is not affiliated with the NREMT (National Registry of Emergency Medical Technicians) or with any school.';

  var params = new URLSearchParams(location.search);
  var course = params.get('course');
  var id = params.get('m');

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(ch){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
    });
  }
  function getName(){ try{ return localStorage.getItem(NAME_KEY) || ''; }catch(e){ return ''; } }
  function setName(v){ try{ if(v) localStorage.setItem(NAME_KEY, v); else localStorage.removeItem(NAME_KEY); }catch(e){ /* private mode */ } }

  if(window.LevlAnalytics) window.LevlAnalytics.mount();

  if(!M || !app) return;
  if(!M.COURSES[course]){ renderUnknown(); return; }

  M.ensure(course).then(function(){
    var m = id && M.find(course, id);
    if(m && m.earned) renderEarned(m);
    else renderElsewhere(m);
  }, function(){ renderElsewhere(null); });

  /* ---- not earned in this browser -------------------------------------- */

  function courseCard(key){
    var c = M.COURSES[key];
    return '<div class="cert-course"><h2>' + esc(c.name) + '</h2><p>' + esc(c.blurb) + '</p>' +
      '<a class="btn-press sm" href="' + c.home + '">Try ' + esc(c.name) + '</a></div>';
  }

  function renderElsewhere(m){
    var c = M.COURSES[course];
    var what = m ? M.heading(m, course) : c.name;
    document.title = 'A LevlPrep milestone — LevlPrep';
    app.innerHTML =
      '<div class="hero"><div class="eyebrow">Certificate of completion</div>' +
        '<h1>A LevlPrep milestone</h1><p class="lede">' + esc(what) + '</p></div>' +
      courseCard(course) +
      '<div class="cert-elsewhere"><h2>Earned this yourself?</h2>' +
        '<p>A certificate is drawn only from the study progress saved in the browser it was earned in, so it is not showing here. ' +
        'Open this link in that browser. If you studied signed in, signing in here brings your progress with you.</p>' +
        '<p><a href="' + c.dash + '">See your milestones in ' + esc(c.name) + '</a></p></div>';
  }

  function renderUnknown(){
    app.innerHTML =
      '<div class="hero"><div class="eyebrow">Certificate of completion</div>' +
        '<h1>That certificate link is incomplete</h1><p class="lede">It does not say which course it is for. Here is what LevlPrep has.</p></div>' +
      Object.keys(M.COURSES).map(courseCard).join('');
  }

  /* ---- earned ----------------------------------------------------------- */

  function renderEarned(m){
    var c = M.COURSES[course];
    var date = M.formatDate(m.date);
    var iso = new Date(m.date).toISOString().slice(0, 10);
    var statement = M.statement(m, course);
    document.title = 'Certificate: ' + M.heading(m, course) + ' — LevlPrep';

    app.innerHTML =
      '<div class="cert-tools">' +
        '<p class="cert-eyebrow">Your certificate</p>' +
        '<label class="cert-label" for="certName">Name on the certificate</label>' +
        '<input class="cert-input" id="certName" type="text" maxlength="60" autocomplete="name" placeholder="Type your name">' +
        '<p class="cert-hint">Kept in this browser only. It is never sent anywhere, and a shared link does not include it.</p>' +
        '<div class="cert-actions">' +
          '<button type="button" class="btn-press sm" id="certPrint">Print or save as PDF</button>' +
          '<button type="button" class="btn-outline" id="certSave">Save image</button>' +
          '<span id="certShareAnchor"></span>' +
        '</div>' +
      '</div>' +
      '<article class="cert" aria-labelledby="certTitle">' +
        '<div class="cert__frame">' +
          '<p class="cert__brand"><span class="brand-mark" aria-hidden="true">+</span> LevlPrep</p>' +
          '<h1 class="cert__title" id="certTitle">Certificate of completion</h1>' +
          '<p class="cert__lead">This records that</p>' +
          '<p class="cert__name" id="certNameOut"></p>' +
          '<p class="cert__what">' + esc(statement) + '.</p>' +
          '<p class="cert__date">Earned <time datetime="' + iso + '">' + esc(date) + '</time></p>' +
          '<p class="cert__foot">' + esc(FOOT) + '</p>' +
        '</div>' +
      '</article>';

    var input = document.getElementById('certName');
    var out = document.getElementById('certNameOut');
    input.value = getName();
    var file = null, timer = null;
    function paintName(){
      var v = input.value.trim();
      out.textContent = v || 'Your name';
      out.classList.toggle('is-empty', !v);
    }
    // The image for the share sheet is made ahead of time: navigator.share has
    // to be called while the tap still counts as the user's, and drawing a
    // canvas and encoding a PNG after the tap can outlast that.
    function refreshFile(){
      clearTimeout(timer);
      timer = setTimeout(function(){
        toBlob(m, c, date, statement).then(function(blob){
          try{ file = blob ? new File([blob], fileName(), { type: 'image/png' }) : null; }catch(e){ file = null; }
        });
      }, 250);
    }
    paintName();
    refreshFile();
    input.addEventListener('input', function(){ setName(input.value.trim()); paintName(); refreshFile(); });

    document.getElementById('certPrint').addEventListener('click', function(){ window.print(); });
    document.getElementById('certSave').addEventListener('click', function(){
      toBlob(m, c, date, statement).then(function(blob){
        if(!blob) return;
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName();
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
        if(window.LevlAnnounce) window.LevlAnnounce.say('Certificate image saved.');
      });
    });
    if(window.LevlShare){
      var opts = M.shareOpts(m, course);
      window.LevlShare.button(document.getElementById('certShareAnchor'), function(){
        return { what: opts.what, course: opts.course, title: opts.title, text: opts.text, url: opts.url, file: file };
      }, 'Share');
    }
  }

  function fileName(){ return 'levlprep-certificate-' + course + '-' + id + '.png'; }

  /* ---- the image -------------------------------------------------------- */

  /* Drawn rather than screenshotted: there is no way to rasterise the page's
     own HTML without a library, and a canvas drawing of six lines of text is
     short. Always the light "paper" version, whatever the page theme, because
     it is a picture of a printed certificate. */
  function toBlob(m, c, date, statement){
    return (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function(){
      var W = 1600, H = 1131;
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var x = cv.getContext('2d');
      if(!x) return null;
      var ui = getComputedStyle(document.body).fontFamily || 'sans-serif';
      var INK = '#1B2A26', MUTED = '#526C66', TEAL = '#0F5F53', NAVY = '#1F4A42';

      x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H);
      x.strokeStyle = NAVY; x.lineWidth = 14; x.strokeRect(40, 40, W - 80, H - 80);
      x.strokeStyle = TEAL; x.lineWidth = 2; x.strokeRect(70, 70, W - 140, H - 140);

      x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      function text(s, y, size, weight, color, maxW){
        x.font = weight + ' ' + size + 'px ' + ui;
        x.fillStyle = color;
        var lines = wrap(s, maxW || W - 320);
        lines.forEach(function(l, i){ x.fillText(l, W / 2, y + i * size * 1.3); });
        return y + lines.length * size * 1.3;
      }
      function wrap(s, maxW){
        var words = String(s).split(' '), lines = [], cur = '';
        words.forEach(function(w){
          var t = cur ? cur + ' ' + w : w;
          if(x.measureText(t).width > maxW && cur){ lines.push(cur); cur = w; } else cur = t;
        });
        if(cur) lines.push(cur);
        return lines;
      }

      text('+ LevlPrep', 190, 36, '900', NAVY);
      text('CERTIFICATE OF COMPLETION', 300, 54, '900', INK);
      text('This records that', 400, 30, '700', MUTED);
      var name = (document.getElementById('certName') || {}).value;
      name = (name || '').trim();
      x.strokeStyle = '#CFDCD7'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(420, 530); x.lineTo(W - 420, 530); x.stroke();
      if(name) text(name, 510, 72, '900', INK, W - 480);
      var y = text(statement + '.', 620, 36, '700', INK, W - 420);
      text('Earned ' + date, y + 40, 30, '800', TEAL);
      text(FOOT, H - 160, 22, '700', MUTED, W - 400);
      return new Promise(function(resolve){ cv.toBlob(resolve, 'image/png'); });
    });
  }
})();
