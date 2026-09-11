/* Drives practice.html. Kept out of an inline <script> for the same reason
   as learn-page.js/mastery-page.js: the site's CI checker textually scans
   .html files for href="..."/src="..." and would misfire on a generated
   string built with + concatenation rather than a literal path.

   Practice pulls questions from OchemPracticeBank, grouped by the same
   topic ids OchemCurriculum uses, but keeps its own stats in a separate
   localStorage key ('ochem_practice_stats') instead of calling
   OchemCurriculum.recordAttempt. That's deliberate: recordAttempt feeds the
   CURRENT in-progress lesson run for a topic (step/correct/attempts,
   eventually folded into bestScore when the lesson run completes) —
   answering practice questions on a topic must never silently change the
   score of a lesson run in progress on that same topic. Practice tracks
   its own lifetime accuracy per topic instead, shown in the session
   summary and used to weight adaptive selection, and never touches
   lesson/mastery state.

   Adaptive selection: every shipped topic with questions is eligible.
   Each topic gets a weight from OchemCurriculum.topicMastery (lower/absent
   mastery -> higher weight, so weaker or untouched topics are oversampled)
   combined with this page's own practice accuracy for that topic, so a
   session naturally leans toward what needs the most work while still
   mixing in everything else. */
(function(){
  var C = window.OchemCurriculum;
  var BANK = window.OchemPracticeBank;
  var STATS_KEY = 'ochem_practice_stats';

  function readStats(){
    try{ var raw = localStorage.getItem(STATS_KEY); return raw ? JSON.parse(raw) : {}; }
    catch(e){ return {}; }
  }
  function writeStats(s){
    try{ localStorage.setItem(STATS_KEY, JSON.stringify(s)); }catch(e){}
  }
  function recordPractice(topicId, isCorrect){
    var s = readStats();
    var t = s[topicId] || { correct: 0, attempts: 0 };
    t.attempts++;
    if(isCorrect) t.correct++;
    s[topicId] = t;
    writeStats(s);
  }

  function topicTitle(id){ var t = C.findTopic(id); return t ? t.title : id; }
  function moduleForTopic(id){
    for(var i=0;i<C.MODULES.length;i++){
      for(var j=0;j<C.MODULES[i].topics.length;j++){
        if(C.MODULES[i].topics[j].id === id) return C.MODULES[i];
      }
    }
    return null;
  }

  var ALL_TOPIC_IDS = Object.keys(BANK);

  // Weight: topics never completed (no mastery yet) or scoring low get
  // sampled more; a 1.0 floor means nothing is ever fully excluded.
  function weightFor(topicId){
    var mastery = C.topicMastery(topicId);
    var w = mastery === null ? 3 : Math.max(1, (100 - mastery) / 25);
    var stats = readStats()[topicId];
    if(stats && stats.attempts >= 3){
      var acc = stats.correct / stats.attempts;
      w *= Math.max(0.5, 1.5 - acc);
    }
    return w;
  }

  function weightedPick(pool){
    var weights = pool.map(weightFor);
    var total = weights.reduce(function(a,b){ return a+b; }, 0);
    var r = Math.random() * total;
    for(var i=0;i<pool.length;i++){
      r -= weights[i];
      if(r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function buildSession(topicFilter, count){
    var pool = topicFilter ? [topicFilter] : ALL_TOPIC_IDS.slice();
    var questions = [];
    var recentTopic = null, recentQ = null;
    for(var i=0;i<count;i++){
      var candidates = pool.length > 1 ? pool.filter(function(id){ return id !== recentTopic; }) : pool;
      var topicId = weightedPick(candidates.length ? candidates : pool);
      var bank = BANK[topicId];
      var qCandidates = bank.length > 1 ? bank.filter(function(q){ return q !== recentQ; }) : bank;
      var q = qCandidates[Math.floor(Math.random() * qCandidates.length)];
      questions.push({ topicId: topicId, question: q });
      recentTopic = topicId;
      recentQ = q;
    }
    return questions;
  }

  // ---- UI wiring ----
  var setupEl = document.getElementById('practiceSetup');
  var sessionEl = document.getElementById('practiceSession');
  var summaryEl = document.getElementById('practiceSummary');
  var topicSelect = document.getElementById('topicFilter');
  var lengthSelect = document.getElementById('sessionLength');
  var startBtn = document.getElementById('startPracticeBtn');
  var progFill = document.getElementById('practiceProgFill');
  var progLabel = document.getElementById('practiceProgLabel');
  var card = document.getElementById('practiceCard');

  // Populate the topic filter from the curriculum, module by module, only
  // listing topics that actually have practice questions.
  var optHtml = '<option value="">Mixed — all topics (adaptive)</option>';
  C.MODULES.forEach(function(mod){
    var topicsWithBank = mod.topics.filter(function(t){ return BANK[t.id]; });
    if(!topicsWithBank.length) return;
    optHtml += '<optgroup label="' + mod.title + '">';
    topicsWithBank.forEach(function(t){
      optHtml += '<option value="' + t.id + '">' + t.title + '</option>';
    });
    optHtml += '</optgroup>';
  });
  topicSelect.innerHTML = optHtml;

  var session = null, idx = 0, sessionCorrect = 0, sessionByTopic = {};

  function feedbackHtml(){ return '<div class="feedback" id="pfb"></div>'; }
  function showFeedback(el, good, text){ el.className = 'feedback show ' + (good?'good':'bad'); el.textContent = text; }

  function renderQuestion(){
    var item = session[idx];
    var q = item.question;
    progFill.style.width = Math.round((idx/session.length)*100) + '%';
    progLabel.textContent = 'Question ' + (idx+1) + ' / ' + session.length;

    card.innerHTML =
      '<div class="step-eyebrow">' + topicTitle(item.topicId) + '</div>' +
      '<h2 class="step-title">' + q.q + '</h2>' +
      '<div class="choice-row">' + q.options.map(function(o,i){
        return '<button class="choice-btn" data-i="' + i + '">' + o + '</button>';
      }).join('') + '</div>' +
      feedbackHtml() +
      '<div class="actions"><button class="btn-press" id="pNextBtn" disabled>' + (idx === session.length-1 ? 'Finish' : 'Next question') + '</button></div>';

    var fb = card.querySelector('#pfb');
    var next = card.querySelector('#pNextBtn');
    var answered = false;
    card.querySelectorAll('.choice-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(answered) return;
        answered = true;
        var i = parseInt(btn.getAttribute('data-i'), 10);
        var isCorrect = i === q.correct;
        card.querySelectorAll('.choice-btn').forEach(function(b, bi){
          b.disabled = true;
          if(bi === q.correct) b.classList.add('correct');
          else if(bi === i) b.classList.add('wrong');
        });
        recordPractice(item.topicId, isCorrect);
        sessionByTopic[item.topicId] = sessionByTopic[item.topicId] || { correct: 0, attempts: 0 };
        sessionByTopic[item.topicId].attempts++;
        if(isCorrect){ sessionCorrect++; sessionByTopic[item.topicId].correct++; }
        showFeedback(fb, isCorrect, (isCorrect ? 'Correct. ' : 'Not quite. ') + q.why);
        next.disabled = false;
      });
    });
    next.addEventListener('click', function(){
      idx++;
      if(idx >= session.length) renderSummary();
      else renderQuestion();
    });
  }

  function renderSummary(){
    sessionEl.hidden = true;
    summaryEl.hidden = false;
    var pct = session.length ? Math.round((sessionCorrect/session.length)*100) : 0;
    var rows = Object.keys(sessionByTopic).map(function(id){
      var t = sessionByTopic[id];
      var topicPct = Math.round((t.correct/t.attempts)*100);
      return '<div class="mstat-row"><span class="name">' + topicTitle(id) + '</span>' +
        '<span class="track"><span class="fill" style="width:' + topicPct + '%"></span></span>' +
        '<span class="pct">' + t.correct + '/' + t.attempts + '</span></div>';
    }).join('');
    summaryEl.innerHTML =
      '<div class="overall-card" style="margin-bottom:18px;">' +
        '<div><div class="k">Session score</div><div class="big">' + pct + '%</div></div>' +
        '<div style="max-width:300px;font-size:13.5px;font-weight:700;opacity:.85;">' + sessionCorrect + ' of ' + session.length + ' correct, across ' + Object.keys(sessionByTopic).length + ' topic(s).</div>' +
      '</div>' +
      '<div class="module-card">' + rows + '</div>' +
      '<div class="actions" style="margin-top:18px;justify-content:flex-start;">' +
        '<button class="btn-press" id="againBtn">Practice again</button>' +
        '<a href="mastery.html" class="btn-press alt">View mastery</a>' +
      '</div>';
    summaryEl.querySelector('#againBtn').addEventListener('click', function(){
      summaryEl.hidden = true;
      setupEl.hidden = false;
    });
  }

  startBtn.addEventListener('click', function(){
    var topicFilter = topicSelect.value || null;
    var count = parseInt(lengthSelect.value, 10) || 10;
    if(topicFilter && BANK[topicFilter] && BANK[topicFilter].length < 3){
      // a single topic's bank is small; don't ask for more unique questions
      // than exist, repeats are fine but keep the UI honest about it.
    }
    session = buildSession(topicFilter, count);
    idx = 0; sessionCorrect = 0; sessionByTopic = {};
    setupEl.hidden = true;
    summaryEl.hidden = true;
    sessionEl.hidden = false;
    renderQuestion();
  });
})();
