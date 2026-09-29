/* The A&P course home: turns the first-visit markup that scripts/build-anp.mjs
   writes into a reading of where you are.

   Everything here is a view over state something else owns: the level, XP,
   streak and daily goal come from the shared hub engine (HubProgress, one level
   across every subject); mastery, the review queue and the lessons you have
   finished come from AnpCore. A card this script cannot fill is left as
   authored, and the page reads as a course you can start with JS off.

   Kept out of an inline <script> because it builds href="..." by
   concatenation, which the site's link checker scans .html files for. */
(function(){
  var HP = window.HubProgress, A = window.AnpCore, CUR = window.AnpCurriculum;
  var base = window.ANP_BASE || '';
  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }
  function pct(v){ return Math.round((v || 0) * 100); }
  function chapterOf(id){ var cs = CUR.chapters; for(var i = 0; i < cs.length; i++) if(cs[i].id === id) return cs[i]; return null; }

  /* ---- hero: level, XP, streak, and the three part bars ---- */
  function renderHero(){
    if(HP){
      var info = HP.levelInfo('anp');
      el('anpLvRing').textContent = 'L' + info.level;
      el('anpLvTitle').textContent = info.title;
      el('anpLvSub').textContent = 'Level ' + info.level + ' · ' + info.total + ' XP';
      el('anpXpFill').style.width = Math.min(100, Math.round(info.into / info.span * 100)) + '%';
      el('anpXpLabel').textContent = info.total + ' / ' + (info.total + info.toNext) + ' XP to Level ' + (info.level + 1);
      var s = HP.streak();
      el('anpStreak').hidden = s.current < 1;
      el('anpStreakN').textContent = s.current;
      el('anpStreak').title = plural(s.current, 'day') + ' streak, across every subject';
    }
    if(A && CUR){
      // A part's bar is the mean mastery of its chapters that have built topics.
      (CUR.parts || []).forEach(function(p){
        var chs = CUR.chapters.filter(function(c){ return c.part === p.id; });
        var sum = 0, n = 0;
        chs.forEach(function(c){ var m = A.chapterMastery(c.id); if(m.topics){ sum += m.value; n++; } });
        var v = n ? pct(sum / n) : 0;
        var bar = document.querySelector('[data-part-bar="' + p.id + '"]');
        var lab = document.querySelector('[data-part-pct="' + p.id + '"]');
        if(bar) bar.style.width = v + '%';
        if(lab) lab.textContent = v + '%';
      });
    }
  }

  /* ---- the topic to resume: the one you touched last. If its lesson is
     finished, the next built topic whose lesson is not. ---- */
  function resumeTopic(){
    if(!A || !CUR) return null;
    var d = A.load(), last = null, ts = 0;
    Object.keys(d.q).forEach(function(k){ var r = d.q[k]; if(r.t && r.seen > ts){ ts = r.seen; last = r.t; } });
    Object.keys(d.lessons).forEach(function(k){ if(d.lessons[k] > ts){ ts = d.lessons[k]; last = k; } });
    if(!last) return null;
    var ts_ = CUR.topics, i;
    for(i = 0; i < ts_.length; i++) if(ts_[i].id === last) break;
    if(i >= ts_.length) return null;
    if(!d.lessons[last] && ts_[i].built) return { topic: ts_[i], fresh: false };
    for(var j = i + 1; j < ts_.length; j++) if(ts_[j].built && !d.lessons[ts_[j].id]) return { topic: ts_[j], fresh: true };
    return { topic: ts_[i], fresh: false, done: true };
  }

  var resumed = null;
  function renderStart(){
    resumed = resumeTopic();
    if(!resumed) return;
    var t = resumed.topic, ch = chapterOf(t.chapter);
    el('anpStart').innerHTML =
      '<div class="k">' + (resumed.fresh ? 'Up next' : 'Pick up where you left off') + '</div>' +
      '<h2>' + esc(t.title) + '</h2>' +
      '<p>Chapter ' + ch.n + ' · ' + esc(ch.title) + '.' + (resumed.fresh ? ' The next lesson you have not finished.' : '') + '</p>' +
      '<a class="btn-press" href="' + base + 'lessons/' + t.id + '.html">' + (resumed.fresh ? 'Start the lesson' : resumed.done ? 'Go back to the lesson' : 'Continue the lesson') + '</a>';
  }

  function renderReview(){
    if(!A) return;
    var n = A.reviewCount(), card = el('anpReview');
    card.classList.toggle('due', n > 0);
    card.querySelector('h2').textContent = n ? plural(n, 'question') + ' due now' : 'Nothing due yet';
    card.querySelector('p').textContent = n
      ? 'Each right answer pushes that question further out.'
      : 'Anything you miss comes back when you are about to forget it, not on a fixed date.';
    var a = card.querySelector('a'); if(a) a.textContent = n ? 'Review now \u2192' : 'Open review \u2192';
  }

  function renderGoal(){
    if(!HP) return;
    var s = HP.streak(), done = Math.min(s.todayCount, s.goal);
    el('anpGoal').innerHTML =
      '<div class="k">Today’s goal</div>' +
      '<h2>' + done + ' of ' + s.goal + '</h2>' +
      '<p>' + (s.metToday ? 'Goal met for today. Your streak is safe.' : 'Questions, cards and tool steps from any LevlPrep subject count.') + '</p>' +
      '<div class="xp-track" aria-hidden="true"><div class="xp-fill" style="width:' + Math.round(done / Math.max(1, s.goal) * 100) + '%"></div></div>' +
      '<a class="link-quiet" href="' + base + 'practice.html">Practice now →</a>';
  }

  /* ---- the path: chapter mastery on each ring, "you are here", and the
     line through the nodes (the grid placement itself is CSS) ---- */
  var box = el('anpPath'), upTo = -1;
  function renderPath(){
    if(!box) return;
    var nodes = [].slice.call(box.querySelectorAll('.node'));
    upTo = -1;
    nodes.forEach(function(node, i){
      var sm = node.querySelector('small'), id = node.getAttribute('data-chapter');
      if(!sm) return;
      if(sm.getAttribute('data-base') === null) sm.setAttribute('data-base', sm.textContent.replace(/^Start here \u00b7 /, ''));
      var txt = sm.getAttribute('data-base'), m = A ? A.chapterMastery(id) : null;
      if(m && m.topics){
        node.style.setProperty('--p', pct(m.value));
        if(m.answered) txt = plural(m.topics, 'topic') + ' \u00b7 ' + pct(m.value) + '% mastery';
      }
      var here = resumed ? id === resumed.topic.chapter : i === 0;
      node.classList.toggle('current', here);
      var a = node.querySelector('a');
      if(a){ if(here && resumed) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); }
      if(here) upTo = i;
      sm.textContent = (here ? (resumed ? 'You are here' : 'Start here') + ' \u00b7 ' : '') + txt;
    });
    drawPath();
  }

  function drawPath(){
    var nodes = [].slice.call(box.querySelectorAll('.node'));
    var b = box.getBoundingClientRect();
    var pts = nodes.map(function(n){ var r = n.querySelector('.ring').getBoundingClientRect(); return [Math.round(r.left + r.width / 2 - b.left), Math.round(r.top + r.height / 2 - b.top)]; });
    function line(p){
      if(p.length < 2) return '';
      var d = 'M' + p[0][0] + ' ' + p[0][1];
      for(var i = 1; i < p.length; i++){
        var a = p[i - 1], c = p[i];
        // Rows change with a vertical drop, then run across the next row.
        d += Math.abs(a[1] - c[1]) < 2 || Math.abs(a[0] - c[0]) < 2 ? ' L' + c[0] + ' ' + c[1] : ' L' + a[0] + ' ' + c[1] + ' L' + c[0] + ' ' + c[1];
      }
      return d;
    }
    box.querySelector('.path-track').setAttribute('d', line(pts));
    box.querySelector('.path-fill').setAttribute('d', upTo > 0 ? line(pts.slice(0, upTo + 1)) : '');
  }

  /* ---- "Try a step": grade the sample question in place ---- */
  function sample(){
    var card = el('anpSample');
    if(!card) return;
    var right = +card.getAttribute('data-correct');
    var opts = [].slice.call(card.querySelectorAll('.qopt'));
    var why = el('anpSampleWhy'), key = card.querySelector('.anp-sample-key p');
    opts.forEach(function(b){
      b.addEventListener('click', function(){
        var i = +b.getAttribute('data-i');
        opts.forEach(function(o){
          var j = +o.getAttribute('data-i');
          o.disabled = true;
          o.classList.toggle('correct', j === right);
          o.classList.toggle('incorrect', j === i && i !== right);
        });
        var k = key ? key.innerHTML : '';
        why.innerHTML = i === right ? '<b>Correct.</b> ' + k.replace(/^<b>[\s\S]*?<\/b>\s*/, '') : '<b>Not quite.</b> ' + esc(b.getAttribute('data-why') || '') + '<br>Answer: ' + k;
        card.classList.add('answered');
      });
    });
  }

  function render(){
    try{ renderHero(); }catch(e){}
    try{ renderStart(); }catch(e){}
    try{ renderReview(); }catch(e){}
    try{ renderGoal(); }catch(e){}
    try{ renderPath(); }catch(e){}
  }
  function start(){
    render(); sample();
    document.addEventListener('anp:progress', render);
    if(box && window.ResizeObserver) new ResizeObserver(function(){ try{ drawPath(); }catch(e){} }).observe(box);
    else window.addEventListener('resize', function(){ try{ drawPath(); }catch(e){} });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
