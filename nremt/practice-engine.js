/* The NREMT question runner. Three pages share it, each with its own start
   screen and one quiz/results screen between them:
     practice.html   drills, weak-spot practice, missed and flagged queues
     review.html     the spaced review queue
     exams.html      the timed 100-question exam
   The page says which it is with <body data-runner="practice|review|exams">.
   A start screen only carries the controls for its own modes, so every lookup
   goes through $id(), which hands back a detached stand-in for an element this
   page does not have: wiring a button that is not there is then a no-op rather
   than a TypeError, and the engine stays one file instead of three copies. */
const RUNNER_PAGE = (document.body && document.body.getAttribute('data-runner')) || 'practice';
// Which page owns each mode, so an attempt is resumed under the tab it was
// started from.
const RUNNER_HOME = { full: 'exams.html', spaced: 'review.html' };
function runnerPageFor(m){ return RUNNER_HOME[m] || 'practice.html'; }
const RUNNER_SCREENS = `
  <div id="quizScreen">
    <div class="quiz-main">
      <div id="practiceBanner" class="practice-banner"></div>
      <div class="exit-row">
        <button id="exitBtn" class="exit-link">&larr; Exit exam</button>
        <button class="primary submit-top-btn" id="submitBtnTop" style="background:var(--accent);">Submit Now</button>
      </div>
      <div class="q-head-row">
        <div class="q-domain" id="qDomain"></div>
        <button type="button" class="flag-btn" id="flagBtn"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:5px;"><path d="M4 22V4a1 1 0 0 1 1-1h13.5a1 1 0 0 1 .9 1.5l-2.4 4.8a1 1 0 0 0 0 .9l2.4 4.8a1 1 0 0 1-.9 1.5H5"/></svg>Flag for review</button>
      </div>
      <div class="q-prompt" id="qPrompt"></div>
      <div class="options" id="qOptions"></div>
      <div class="nav-row" style="margin-bottom:20px;">
        <button id="prevBtn">Previous</button>
        <button class="primary" id="nextBtn">Next</button>
      </div>
    </div>
    <aside class="quiz-side">
      <div id="timerBar">
        <div class="timer-row">
          <span>Time remaining</span>
          <span class="time-remaining" id="timeRemaining">2:00:00</span>
        </div>
        <div class="pace-line" id="paceLine">&mdash;</div>
      </div>
      <div class="progress-row">
        <span id="progressText">Question 1 of 100</span>
        <span id="answeredText">0 answered</span>
      </div>
      <div class="progress-track"><div class="progress-fill" id="progressFill" style="width:1%"></div></div>
      <div class="jump-row" id="jumpRow"></div>
      <div class="nav-row">
        <button class="primary" id="submitBtn" style="background:var(--accent);">Submit Now</button>
      </div>
    </aside>
  </div>

  <div id="flashcardScreen" style="display:none;">
    <div class="exit-row"><button id="flashcardExitBtn" class="exit-link">&larr; Exit flashcards</button></div>
    <div class="progress-row">
      <span id="fcProgressText">Card 1 of 20</span>
      <span id="fcDomain"></span>
    </div>
    <div class="progress-track"><div class="progress-fill" id="fcProgressFill" style="width:5%"></div></div>

    <div class="fc-card" id="fcCard">
      <div class="fc-face fc-front" id="fcFront"></div>
      <div class="fc-face fc-back" id="fcBack" style="display:none;"></div>
      <div class="fc-hint">Tap the card to flip</div>
    </div>

    <div class="nav-row">
      <button id="fcPrevBtn">Previous</button>
      <button class="primary" id="fcNextBtn">Next</button>
    </div>
  </div>

  <div id="resultsScreen">
    <div class="results-top-row"><button class="retry-btn" id="retryBtnTop">&larr; Back to Start</button><button type="button" class="retry-btn print-btn" id="printResultBtn">Print or save as PDF</button></div>
    <div class="results-side">
      <div class="score-card">
        <div class="big" id="scoreBig">0/100</div>
        <div class="sub" id="scoreSub">0% correct &mdash; completed in 0:00:00</div>
        <div class="domain-breakdown" id="domainBreakdown"></div>
        <div id="readinessUpdate"></div>
      </div>
      <div id="clearedNote" class="cleared-note" style="display:none;"></div>
      <div id="premiumSlot"></div>
    </div>
    <div class="results-main">
      <div class="filter-row">
        <button class="active" data-filter="all">All</button>
        <button data-filter="incorrect">Incorrect only</button>
        <button data-filter="unanswered">Unanswered only</button>
      </div>
      <div id="reviewList"></div>
      <button class="retry-btn" id="retryBtn">Back to Start</button>
    </div>
  </div>
`;
const RUNNER_STANDINS = {};
function $id(id){
  return document.getElementById(id) || RUNNER_STANDINS[id] ||
    (RUNNER_STANDINS[id] = document.createElement(/Select$|Length$/.test(id) ? 'select' : id === 'realisticMode' ? 'input' : 'div'));
}
// practice.html?start=spaced was the home page's way into the review queue
// before the queue had a page of its own. Old links, reminders and bookmarks
// still carry it.
const RUNNER_LEAVING = RUNNER_PAGE === 'practice' && new URLSearchParams(location.search).get('start') === 'spaced';
if(RUNNER_LEAVING) location.replace('review.html' + location.search + location.hash);

// Runs after the deferred scripts above it: every external script on this
// page is deferred so the page can paint before they arrive, and deferred
// scripts execute, in order, just before DOMContentLoaded.
document.addEventListener('DOMContentLoaded', function(){
if(RUNNER_LEAVING) return;
// The quiz, flashcard and results screens are the same on all three pages, so
// they are written once, here, after the page's own start screen.
(function mountRunnerScreens(){
  const intro = document.getElementById('introScreen');
  if(!intro || document.getElementById('quizScreen')) return;
  intro.insertAdjacentHTML('afterend', RUNNER_SCREENS);
})();
// Everything below runs inside one async IIFE so the question bank can be
// awaited before any of it executes — every function here assumes QUESTIONS is
// already populated by the time it runs.
//
// It used to be a SYNCHRONOUS XMLHttpRequest instead, which looked equivalent
// and was not: Chromium does not route sync XHR through the service worker, so
// the bank was fetched straight off the network even when a perfectly good copy
// was sitting in the cache. Offline, that meant a precached 2.3 MB bank the page
// could not reach, and every practice mode silently dead. It also blocked the
// main thread on a 2.3 MB download and parse. fetch() has neither problem.
(async function(){

// The bank lives in its own JSON file rather than inline here, so it's a
// separately cacheable download and something search.html can fetch and index
// too.
//
// questions-core.json, specifically: the stems, options and answer keys, with
// the explanations stripped out into a second file. The explanations are two
// thirds of the bank's compressed weight and not one word of them is read
// until after a question has been answered, so waiting on them meant every
// visitor waited on 409 KB to see a question they could have been shown
// already. Both files are generated from questions.json and index-aligned
// with it — see scripts/build-question-bank.mjs.
//
// If it can't be loaded, every mode on this page is dead, so say so out loud
// instead of throwing and leaving the start buttons looking live but inert.
const QUESTIONS = await (async function(){
  try{
    const res = await fetch('assets/questions-core.json');
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const parsed = await res.json();
    if(!Array.isArray(parsed) || !parsed.length) throw new Error('empty bank');
    return parsed;
  }catch(e){
    document.documentElement.classList.add('bank-unavailable');
    var banner = document.createElement('div');
    banner.className = 'bank-error';
    banner.setAttribute('role', 'alert');
    banner.innerHTML =
      '<strong>The question bank didn\'t load.</strong>' +
      '<span>Practice, drills and flashcards need it, so they\'re switched off on this ' +
      'page until it does. If you\'re offline, reconnect once and it will be stored for ' +
      'next time; if you\'re online, reload the page.</span>' +
      '<button type="button" onclick="location.reload()">Reload</button>';
    var host = document.querySelector('.xshell') || document.body;
    host.insertBefore(banner, host.firstChild);
    return [];
  }
})();

// What every stored record refers to. QUESTIONS is a list and the code below
// works in positions, because a position is a direct array lookup; but nothing
// that reaches localStorage may be a position, or editing the bank re-points
// every learner's records at different questions. QID translates between the
// two at each of those boundaries — see assets/question-ids.js.
const QID = window.NremtQuestionIds.attach(QUESTIONS);
// The Dashboard's exam-date card spreads the unanswered part of the bank over
// the days left, and should not have to fetch the bank to know its size.
if(QUESTIONS.length){ try{ localStorage.setItem('nremt_bank_size', String(QUESTIONS.length)); }catch(e){} }

// The other half of the bank, started now and deliberately not awaited. The
// earliest it can be wanted is the moment someone answers a question or flips
// a flashcard, which is many seconds of reading away; by then this has long
// since landed. The two places that do read it await the promise anyway,
// because "many seconds" is an assumption about a fast phone on good wifi and
// not a guarantee.
//
// Merged back onto the question objects rather than kept alongside them, so
// every q.explain on this page goes on meaning what it always meant.
//
// A failure here is not fatal the way a failure above is: every mode still
// runs, and the only thing missing is the "why" under an answer.
//
// Started when a session starts, not when the page opens. This page is also
// the hub for three modes, and most arrivals read it and pick one; fetching
// 1.2 MB for every one of those visits paid for explanations nobody had
// asked for yet. beginQuiz and the flashcard opener kick it off, so it lands
// long before the first answer, and the two render sites that need it await
// it. (sw.js still warms the file in the background after install, so a
// repeat visit reads it from the cache either way.)
let explanationsPromise = null;
function loadExplanations(){
  if(explanationsPromise) return explanationsPromise;
  explanationsPromise = (async function(){
  if(!QUESTIONS.length) return;
  try{
    const res = await fetch('assets/explanations.json');
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const list = await res.json();
    if(!Array.isArray(list)) throw new Error('not an array');
    for(let i = 0; i < QUESTIONS.length; i++){
      if(typeof list[i] === 'string') QUESTIONS[i].explain = list[i];
    }
  }catch(e){
    /* leaves q.explain undefined; both render sites fall back to '' */
  }
  })();
  return explanationsPromise;
}

// The one place the pool size is shown as a live figure rather than prose, so
// it can't drift from the file the way the marketing copy twice has.
if(QUESTIONS.length){
  const poolEl = $id('poolCount');
  if(poolEl) poolEl.textContent = QUESTIONS.length.toLocaleString();
}

// Nothing below runs without questions. Bail out rather than letting every
// mode throw its own way.
if(!QUESTIONS.length){
  document.querySelectorAll('.start-btn, .domain-btn, .review-btn').forEach(function(el){
    el.setAttribute('disabled', 'disabled');
    el.setAttribute('aria-disabled', 'true');
  });
}

// Belt-and-braces against a keyed-position tell. The stored bank is kept
// position-balanced by scripts/check-site.mjs, which fails the build if any one
// index holds more than 40% of the keys — but this page shuffles each question's
// options (remapping its correct index to match) anyway, so the letter a learner
// sees is theirs alone and no ordering in the file can leak an answer here.
//
// The chosen order is persisted per-browser (not re-rolled every page load): saved quiz
// progress (EXAM_STATE_KEY, below) stores each answer as an option INDEX, not option text.
// Re-shuffling on every load — as this used to do — silently changed what index 0/1/2/3
// pointed to, so resuming an in-progress exam (or even just reloading mid-quiz) could show
// "you picked C" for an option the user never clicked, and grade against the new order
// instead of the one shown when they answered.
//
// Keyed by question ID, not position. This was a positional array, which meant
// deleting one question re-dealt the letters of every question after it — for
// an exam already in progress, on a record whose entire purpose is to stay
// still. QID.readOrders() accepts the old array and returns the map, so the
// conversion happens on the next page load with no migration step.
const OPTION_ORDER_KEY = 'nremt_option_order';
(function shuffleQuestionOptions(){
  // A question with no saved order is one added to the bank since this browser
  // last loaded the page. It gets shuffled; every question that already had an
  // order keeps it, so a half-finished exam still grades against the letters it
  // displayed.
  let orders = {};
  let changed = false;
  try{
    const raw = localStorage.getItem(OPTION_ORDER_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    orders = QID.readOrders(parsed);
    // Dropping a stale entry, or converting the array, is itself a change
    // worth writing back — otherwise the conversion is redone on every load.
    if(raw && JSON.stringify(orders) !== raw) changed = true;
  }catch(e){ orders = {}; }

  QUESTIONS.forEach((q, qi) => {
    const id = QID.idOf(qi);
    let order = orders[id];
    const needsShuffle = !Array.isArray(order) || order.length !== q.options.length;
    if(needsShuffle){
      order = q.options.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      orders[id] = order;
      changed = true;
    }
    if(q.type === 'multi' || q.type === 'order'){
      const oldCorrect = q.correct;
      q.options = order.map(i => q.options[i]);
      q.correct = oldCorrect.map(oldIdx => order.indexOf(oldIdx));
    } else {
      const oldCorrect = q.correct;
      q.options = order.map(i => q.options[i]);
      q.correct = order.indexOf(oldCorrect);
    }
  });

  if(changed){
    try{ localStorage.setItem(OPTION_ORDER_KEY, JSON.stringify(orders)); }catch(e){}
  }
})();

const flagIcon = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:5px;"><path d="M4 22V4a1 1 0 0 1 1-1h13.5a1 1 0 0 1 .9 1.5l-2.4 4.8a1 1 0 0 0 0 .9l2.4 4.8a1 1 0 0 1-.9 1.5H5"/></svg>';
let mode = 'full'; // 'full', 'review', 'flagged', 'spaced', 'domain', 'adaptive', 'single', or 'flashcard'
let realisticMode = false; // timed exam only: hides Flag and Previous, and locks an answer once given
let selectedDomain = null;
let activeIndices = []; // maps position-in-quiz -> index into QUESTIONS
let current = 0;
let answers = [];
let startTime = null;
let timerInterval = null;
const TIME_LIMIT_MS = 2 * 60 * 60 * 1000;
let TARGET_PACE_MS = TIME_LIMIT_MS / 100;

// Domain-balanced random draw: each full exam pulls this many questions
// from each domain, randomly, from the full question pool.
const DOMAIN_TARGETS = {
  "Assessment": 15,
  "Airway & Respiratory": 15,
  "Cardiac & Medical": 20,
  "Trauma": 20,
  "OB/Peds & Special Populations": 15,
  "EMS Operations": 15
};

function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Supports three question types, mirroring NREMT's Technology-Enhanced Items:
// 'single' (default, omit) — one correct option index.
// 'multi' — select-N-of-M; q.correct is an array of correct option indices.
// 'order' — build-list/drag-and-drop; q.correct is the array of option indices
// in their correct sequence.
const LETTERS = ['A','B','C','D','E','F'];

function isAnswerCorrect(q, ans){
  if(ans === null || ans === undefined) return false;
  if(q.type === 'multi'){
    if(!Array.isArray(ans) || ans.length === 0) return false;
    const a = ans.slice().sort((x,y)=>x-y).join(',');
    const c = q.correct.slice().sort((x,y)=>x-y).join(',');
    return a === c;
  }
  if(q.type === 'order'){
    if(!Array.isArray(ans)) return false;
    return ans.join(',') === q.correct.join(',');
  }
  return ans === q.correct;
}

function formatUserAnswerText(q, ans, letters){
  if(ans === null || ans === undefined) return null;
  if(q.type === 'multi'){
    if(!Array.isArray(ans) || ans.length === 0) return null;
    return ans.slice().sort((x,y)=>x-y).map(i => `${letters[i]}) ${q.options[i]}`).join('; ');
  }
  if(q.type === 'order'){
    if(!Array.isArray(ans)) return null;
    return ans.map((optIdx, pos) => `${pos+1}. ${q.options[optIdx]}`).join('  ');
  }
  return `${letters[ans]}) ${q.options[ans]}`;
}

function formatCorrectAnswerText(q, letters){
  if(q.type === 'multi'){
    return q.correct.slice().sort((x,y)=>x-y).map(i => `${letters[i]}) ${q.options[i]}`).join('; ');
  }
  if(q.type === 'order'){
    return q.correct.map((optIdx, pos) => `${pos+1}. ${q.options[optIdx]}`).join('  ');
  }
  return `${letters[q.correct]}) ${q.options[q.correct]}`;
}

function filterPoolByDifficulty(pool, diffFilter, count){
  if(!diffFilter || diffFilter === 'all') return pool;
  const filtered = pool.filter(i => QUESTIONS[i].diff === diffFilter);
  if(filtered.length >= count) return filtered;
  // Not enough at this difficulty — fill the remainder from the rest of the pool
  const filteredSet = new Set(filtered);
  const rest = shuffle(pool.filter(i => !filteredSet.has(i)));
  return filtered.concat(rest);
}

// Tracks which questions a user has already been served by the full exam and
// domain drill builders, so repeat runs draw fresh questions first instead of
// re-serving the same random subset. Once every question in a given pool has
// already been seen, that pool's seen-state resets so the cycle starts over
// rather than ever blocking the user from taking a quiz.
const SEEN_KEY = 'nremt_seen_questions';
// Stored as ids, held in memory as positions. Same for the missed and flagged
// queues below: every one of these crosses into localStorage, so every one of
// them goes through QID on the way in and out.
function loadSeen(){
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(QID.indicesOf(JSON.parse(raw))) : new Set();
  } catch(e){ return new Set(); }
}
function saveSeen(seenSet){
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(QID.idsOf(Array.from(seenSet)))); } catch(e){}
}
function markSeen(indices){
  const seen = loadSeen();
  indices.forEach(i => seen.add(i));
  saveSeen(seen);
}
// Reorders a pool so not-yet-seen questions come first. If every question in
// the pool has already been seen, clears seen-state for just this pool so it
// becomes fully available again instead of forcing endless repeats.
function preferUnseen(pool, seenSet){
  const unseen = pool.filter(i => !seenSet.has(i));
  const alreadySeen = pool.filter(i => seenSet.has(i));
  if(unseen.length === 0){
    pool.forEach(i => seenSet.delete(i));
    saveSeen(seenSet);
    return shuffle(pool);
  }
  return shuffle(unseen).concat(shuffle(alreadySeen));
}

function buildRandomExamIndices(diffFilter){
  const byDomain = {};
  QUESTIONS.forEach((q, i) => {
    if(!byDomain[q.domain]) byDomain[q.domain] = [];
    byDomain[q.domain].push(i);
  });
  const seen = loadSeen();
  let selected = [];
  Object.entries(DOMAIN_TARGETS).forEach(([domain, count]) => {
    let pool = shuffle(byDomain[domain] || []);
    pool = filterPoolByDifficulty(pool, diffFilter, count);
    pool = preferUnseen(pool, seen);
    selected = selected.concat(pool.slice(0, count));
  });
  markSeen(selected);
  return shuffle(selected);
}

const introScreen = $id('introScreen');
const quizScreen = $id('quizScreen');
const resultsScreen = $id('resultsScreen');
const STORAGE_KEY = 'nremt_exam100_best';
const MISSED_KEY = 'nremt_exam100_missed';
const HISTORY_KEY = 'nremt_exam100_history';

// ---- In-progress exam autosave: lets exiting mid-quiz (accidentally or on
// purpose) be resumable instead of losing the attempt outright. Saved on every
// question render (option picked, next/prev, jump, flag) and cleared only once
// the attempt is actually finished (showResults) or the user discards it.
const EXAM_STATE_KEY = 'nremt_inprogress_exam';
function saveExamState(){
  const state = {
    mode, selectedDomain, activeIndices, current, answers, startTime,
    withTimer: $id('timerBar').style.display === 'block',
  };
  if(mode === 'adaptive' && adaptiveState){
    state.adaptiveState = {
      length: adaptiveState.length,
      targetDifficulty: adaptiveState.targetDifficulty,
      sessionSeen: Array.from(adaptiveState.sessionSeen),
      sessionDomainStats: adaptiveState.sessionDomainStats,
      historicalAcc: adaptiveState.historicalAcc,
    };
  }
  try{ localStorage.setItem(EXAM_STATE_KEY, JSON.stringify(QID.writeExamState(state))); }catch(e){}
}
function loadExamState(){
  try{
    const raw = localStorage.getItem(EXAM_STATE_KEY);
    if(!raw) return null;
    // Returns null if the bank no longer has one of the questions this attempt
    // was asking. Resuming around a hole would mean grading someone against a
    // question they were never shown.
    const state = QID.readExamState(JSON.parse(raw));
    if(!state) return null;
    // A timed exam whose 2-hour window has already elapsed can't meaningfully
    // resume — the clock would just immediately end it again.
    if(state.withTimer && Date.now() - state.startTime >= TIME_LIMIT_MS) return null;
    return state;
  }catch(e){ return null; }
}
function clearExamState(){
  try{ localStorage.removeItem(EXAM_STATE_KEY); }catch(e){}
}

function loadHistory(){
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveHistoryEntry(entry){
  const history = loadHistory();
  history.push(entry);
  while(history.length > 20) history.shift();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// Synthesizes full-exam attempt history into a single estimated pass-likelihood
// number. This is a study-tool heuristic, not a statistical model of the real
// NREMT (which is computer-adaptive) — it exists to give a rough, single-number
// signal of "are you there yet," not a certified prediction.
function computeReadiness(){
  const history = loadHistory().filter(h => h.total > 0);
  if(history.length === 0) return {available:false};

  const n = history.length;
  const pcts = history.map(h => h.score / h.total * 100);

  // Recent attempts matter more than old ones: linear recency weighting.
  let weightedSum = 0, weightTotal = 0;
  pcts.forEach((p,i) => { const w = i + 1; weightedSum += p * w; weightTotal += w; });
  const weightedAvg = weightedSum / weightTotal;

  // Per-domain accuracy aggregated across every mode you've practiced in (full exams,
  // domain drills, adaptive sessions, review) — not just full-exam attempts — so
  // targeted practice in a weak area is reflected here even between full exams.
  const domainAgg = loadDomainStatsAll();
  let weakestDomain = null, weakestPct = null, penaltyApplied = false;
  const domainEntries = Object.entries(domainAgg).filter(([,s]) => s.total >= 5);
  let adjusted = weightedAvg;
  if(domainEntries.length > 0){
    const withPct = domainEntries.map(([d,s]) => [d, s.correct / s.total * 100]);
    withPct.sort((a,b) => a[1] - b[1]);
    weakestDomain = withPct[0][0];
    weakestPct = withPct[0][1];
    const totalCorrect = domainEntries.reduce((a,[,s]) => a + s.correct, 0);
    const totalQs = domainEntries.reduce((a,[,s]) => a + s.total, 0);
    const overallDomainPct = totalCorrect / totalQs * 100;
    // A weak domain drags real readiness down even if the overall average looks fine —
    // NREMT requires competency across content areas, not just a good aggregate score.
    // Only penalize the gap beyond a normal 15-point spread between domains.
    const gap = overallDomainPct - weakestPct;
    if(gap > 15){
      adjusted -= (gap - 15) * 0.5;
      penaltyApplied = true;
    }
  }
  adjusted = Math.max(0, Math.min(100, adjusted));

  // Drill into the weakest domain one level further: which sub-topic inside it is
  // actually dragging it down, so the hint says something actionable ("Toxicology")
  // instead of just re-naming the domain the user already knows is weak.
  let weakestTopic = null, weakestTopicPct = null;
  if(weakestDomain){
    const topics = subtopicStatsAll()[weakestDomain] || {};
    const topicEntries = Object.entries(topics).filter(([,s]) => s.total >= 3);
    if(topicEntries.length > 0){
      const withPct = topicEntries.map(([t,s]) => [t, s.correct / s.total * 100]);
      withPct.sort((a,b) => a[1] - b[1]);
      weakestTopic = withPct[0][0];
      weakestTopicPct = Math.round(withPct[0][1]);
    }
  }

  // Logistic curve centered around ~72% (a commonly cited practice-exam benchmark
  // for NREMT readiness), so scores well above it read as confident and scores
  // well below it read as clearly not ready, with a smooth swing in between.
  const rawProb = 1 / (1 + Math.exp(-0.13 * (adjusted - 72)));
  // With very few attempts, hedge the estimate toward a neutral 50/50 rather than
  // reporting false confidence off one data point.
  const confidence = Math.min(1, n / 5);
  const blendedProb = rawProb * confidence + 0.5 * (1 - confidence);
  const probabilityPct = Math.max(2, Math.min(98, Math.round(blendedProb * 100)));

  let label, tier;
  if(probabilityPct >= 80){ label = 'On track'; tier = 'good'; }
  else if(probabilityPct >= 55){ label = 'Within reach'; tier = 'mid'; }
  else { label = 'Needs more practice'; tier = 'low'; }

  return {
    available: true, probabilityPct, label, tier, attempts: n,
    weightedAvg: Math.round(weightedAvg),
    weakestDomain, weakestPct: weakestPct !== null ? Math.round(weakestPct) : null,
    weakestTopic, weakestTopicPct,
    penaltyApplied, lowConfidence: n < 3,
  };
}

function renderReadiness(targetId, opts){
  opts = opts || {};
  const el = $id(targetId);
  if(!el) return;
  const r = computeReadiness();
  if(!r.available){
    el.innerHTML = opts.compact
      ? `<div class="readiness-update"><div class="r-sub">Take a full practice exam to unlock your estimated readiness score.</div></div>`
      : `<div class="readiness-empty">Take a full exam to see your readiness score.</div>`;
    return;
  }
  const subParts = [`Recent average ${r.weightedAvg}% across ${r.attempts} full exam${r.attempts===1?'':'s'}`];
  if(r.weakestDomain){
    const weakLabel = r.weakestTopic
      ? `${r.weakestDomain} → ${r.weakestTopic} (${r.weakestTopicPct}%)`
      : `${r.weakestDomain} (${r.weakestPct}%)`;
    subParts.push(`weakest area: ${weakLabel}`);
  }
  const note = r.lowConfidence
    ? 'Based on very few attempts — take a few more full exams for a more reliable estimate.'
    : 'A rough estimate from your practice history, not an official prediction of NREMT results.';

  if(opts.compact){
    el.innerHTML = `
      <div class="readiness-update">
        <div class="r-head">
          <span class="r-tag">Updated pass probability</span>
          <span class="r-num">${r.probabilityPct}%</span>
          <span class="r-label tier-${r.tier}">${r.label}</span>
        </div>
        <div class="r-sub">${subParts.join(' · ')}</div>
      </div>
    `;
  } else {
    el.innerHTML = `
      <div class="readiness-card">
        <span class="r-tag">Estimated pass probability</span>
        <div class="r-head">
          <span class="r-num">${r.probabilityPct}%</span>
          <span class="r-label tier-${r.tier}">${r.label}</span>
        </div>
        <div class="r-sub">${subParts.join(' · ')}</div>
        ${toolForDomain(r.weakestDomain)}
        <div class="r-note">${note}</div>
      </div>
    `;
  }
}

/* The tool for whatever you are worst at.

   The readiness card names your weakest domain and then offers nothing to do
   about it except more of the same questions. Three of the tools on this site
   — the sound trainer, the scenarios, the flow diagrams — were linked from the
   tools page and nowhere else, and a student whose weakest domain is Airway &
   Respiratory is the exact person who should be told a wheeze is two clicks
   away.

   Keyed on the six domains the question bank actually uses. Only on the full
   card, never the compact mid-exam update, because a suggestion that appears
   between questions is an interruption. */
const DOMAIN_TOOL = {
  'Airway & Respiratory': { href:'sound-trainer.html', label:'Sound Trainer',
    why:'wheezes, crackles and stridor by ear — the distinction these questions turn on' },
  'Cardiac & Medical': { href:'sound-trainer.html', label:'Sound Trainer',
    why:'heart sounds and murmur timing, plus the chest pain scenario' },
  'Trauma': { href:'scenario-sim.html', label:'Scenarios',
    why:'run a bleeding or crash call from dispatch to handover' },
  'Assessment': { href:'flowcharts.html', label:'Flow Diagrams',
    why:'drill the primary assessment order until it is automatic' },
  'EMS Operations': { href:'flowcharts.html', label:'Flow Diagrams',
    why:'START triage, drilled rather than read' },
  'OB/Peds & Special Populations': { href:'scenario-sim.html', label:'Scenarios',
    why:'the choking toddler call, start to finish' }
};

function toolForDomain(domain){
  const t = DOMAIN_TOOL[domain];
  if(!t) return '';
  return `<a class="r-tool" href="${t.href}"><b>${t.label}</b> — ${t.why} &rarr;</a>`;
}
function renderProgressChart(){
  const history = loadHistory();
  const panel = $id('progressPanel');
  const toggle = $id('progressToggle');
  const subStats = subtopicStatsAll();
  const subtopicRows = [];
  Object.entries(subStats).forEach(([d, topics]) => {
    Object.entries(topics).forEach(([t, ts]) => {
      if(ts.total < 3) return;
      subtopicRows.push({domain: d, topic: t, correct: ts.correct, total: ts.total, pct: Math.round(ts.correct/ts.total*100)});
    });
  });
  subtopicRows.sort((a,b) => a.pct - b.pct);

  if(history.length === 0 && subtopicRows.length === 0){
    toggle.style.display = 'none';
    return;
  }
  toggle.style.display = 'block';
  toggle.textContent = history.length > 0
    ? `View progress (${history.length} attempt${history.length===1?'':'s'}) \u2193`
    : `View progress \u2193`;

  let chartHtml = '';
  if(history.length > 0){
    const pcts = history.map(h => Math.round(h.score / h.total * 100));
    const avg = Math.round(pcts.reduce((a,b)=>a+b,0) / pcts.length);
    const best = Math.max(...pcts);

    const w = 300, h = 100, pad = 6;
    const max = 100, min = 0;
    const stepX = pcts.length > 1 ? (w - pad*2) / (pcts.length - 1) : 0;
    const pts = pcts.map((p,i) => {
      const x = pad + i * stepX;
      const y = h - pad - ((p - min) / (max - min)) * (h - pad*2);
      return [x,y];
    });
    const line = pts.length > 1
      ? pts.map((p,i) => (i===0?'M':'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')
      : `M${pts[0][0]},${pts[0][1]} L${pts[0][0]+0.01},${pts[0][1]}`;

    const svg = `<svg class="progress-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Score trend across recent attempts">
      <path d="${line}" fill="none" stroke="#2C9C8B" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      ${pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2" fill="#16332E"/>`).join('')}
    </svg>`;

    const listHtml = history.slice().reverse().slice(0,8).map(hEntry => {
      const pct = Math.round(hEntry.score / hEntry.total * 100);
      const d = new Date(hEntry.date);
      return `<div class="p-row"><span>${d.toLocaleDateString()}</span><span>${hEntry.score}/${hEntry.total} (${pct}%)</span></div>`;
    }).join('');

    chartHtml = `
      <div class="progress-stats">
        <span>Average: <b>${avg}%</b></span>
        <span>Best: <b>${best}%</b></span>
        <span>Attempts: <b>${history.length}</b></span>
      </div>
      ${svg}
      <div class="progress-list">${listHtml}</div>
    `;
  }

  // Sub-topic breakdown: a finer-grained view than the domain-level chart above,
  // aggregated across every mode (full exams, domain drills, adaptive, review) so it
  // fills in even before a user has taken a full exam. Requires at least 3 attempts
  // in a sub-topic before showing it, so a single lucky/unlucky guess doesn't read
  // as a real strength or weakness.
  let subtopicHtml;
  if(subtopicRows.length > 0){
    subtopicHtml = `
      <div class="subtopic-panel">
        <div class="subtopic-title">Sub-topic breakdown (all-time, 3+ questions each)</div>
        ${subtopicRows.map(r => {
          const barColor = r.pct >= 75 ? 'var(--good)' : r.pct >= 55 ? 'var(--accent)' : 'var(--bad)';
          return `
            <div class="subtopic-row">
              <div class="subtopic-label">
                <span class="subtopic-name"><span class="subtopic-domain">${r.domain} \u2014 </span>${r.topic}</span>
                <span class="subtopic-pct">${r.correct}/${r.total} (${r.pct}%)</span>
              </div>
              <div class="subtopic-bar-wrap"><div class="subtopic-bar" style="width:${r.pct}%;background:${barColor}"></div></div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    subtopicHtml = `
      <div class="subtopic-panel">
        <div class="subtopic-title">Sub-topic breakdown</div>
        <div class="subtopic-empty">Answer at least 3 questions in a sub-topic (any mode) to see it broken out here.</div>
      </div>
    `;
  }

  panel.innerHTML = chartHtml + subtopicHtml;
}

$id('progressToggle').addEventListener('click', () => {
  const panel = $id('progressPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

// Per-question mastery tracking (a simple Leitner-style level 0-5) — this is the
// data the weak-spot practice algorithm reads to decide what to ask next, and it's
// updated by every mode (full exam, domain drill, review, adaptive), not just
// adaptive sessions, so the algorithm benefits from everything you've ever answered.
const MASTERY_KEY = 'nremt_mastery';
// Keyed by question id. The keys come back from JSON as strings, which is
// what QID.indexOf() is string-tolerant for.
function loadMastery(){
  const raw = localStorage.getItem(MASTERY_KEY);
  return raw ? QID.pruneById(JSON.parse(raw)) : {};
}
function updateMastery(qIdx, correct){
  const m = loadMastery();
  const qId = QID.idOf(qIdx);
  if(qId === undefined) return;
  const rec = m[qId] || {level:0, timesCorrect:0, timesWrong:0, lastSeen:0};
  if(correct){
    rec.level = Math.min(5, rec.level + 1);
    rec.timesCorrect++;
  } else {
    rec.level = 0;
    rec.timesWrong++;
  }
  rec.lastSeen = Date.now();
  m[qId] = rec;
  localStorage.setItem(MASTERY_KEY, JSON.stringify(m));
}
// A "mastered" item that hasn't been seen in a while gradually becomes due again —
// a lightweight stand-in for spaced-repetition scheduling, without literal calendar
// scheduling (this is a study tool used in short sessions, not a daily-review app).
function effectiveMasteryLevel(rec){
  if(!rec) return 0;
  const daysSince = (Date.now() - rec.lastSeen) / 86400000;
  const decay = Math.floor(daysSince / 4);
  return Math.max(0, rec.level - decay);
}

// A fixed, explicit spaced-repetition queue built from the same mastery/decay data
// Weak-spot practice already uses to weight its live pool — this just surfaces it as
// a concrete, countable list: previously-answered questions whose decayed mastery
// is low, oldest/weakest first, capped so a session stays a reasonable length.
function loadDueForReview(limit){
  const mastery = loadMastery();
  const now = Date.now();
  const items = Object.keys(mastery)
    // The keys are ids; the queue this returns is positions. loadMastery() has
    // already dropped any id whose question has left the bank.
    .map(k => ({ i: QID.indexOf(k), rec: mastery[k] }))
    .filter(x => x.i !== -1)
    .map(({ i, rec }) => {
      return { i, eff: effectiveMasteryLevel(rec), daysSince: (now - rec.lastSeen) / 86400000 };
    })
    .filter(x => x.eff < 5)
    .sort((a, b) => (a.eff - b.eff) || (b.daysSince - a.daysSince));
  return items.slice(0, limit || 40).map(x => x.i);
}

// Per-domain accuracy aggregated across EVERY mode (not just full exams) — this is
// the shared source of truth for "which domains are actually weak," used by both
// Weak-spot practice's question weighting and the readiness score's weak-domain check.
const DOMAIN_STATS_KEY = 'nremt_domain_stats_all';
function loadDomainStatsAll(){
  const raw = localStorage.getItem(DOMAIN_STATS_KEY);
  return raw ? JSON.parse(raw) : {};
}
function recordDomainStatsAll(domainStats){
  const agg = loadDomainStatsAll();
  Object.entries(domainStats).forEach(([d,s]) => {
    if(!agg[d]) agg[d] = {correct:0, total:0, topics:{}};
    if(!agg[d].topics) agg[d].topics = {};
    agg[d].correct += s.correct;
    agg[d].total += s.total;
    Object.entries(s.topics || {}).forEach(([t,ts]) => {
      if(!agg[d].topics[t]) agg[d].topics[t] = {correct:0, total:0};
      agg[d].topics[t].correct += ts.correct;
      agg[d].topics[t].total += ts.total;
    });
  });
  localStorage.setItem(DOMAIN_STATS_KEY, JSON.stringify(agg));
}
function domainAccuracyPct(){
  const agg = loadDomainStatsAll();
  const pct = {};
  Object.entries(agg).forEach(([d,s]) => { pct[d] = s.total > 0 ? s.correct / s.total * 100 : null; });
  return pct;
}
// Sub-topic accuracy nested under each domain, aggregated the same cross-mode way as
// domainAccuracyPct() — the source of truth for the "Sub-topic breakdown" panel and
// the readiness card's weakest-area line.
function subtopicStatsAll(){
  const agg = loadDomainStatsAll();
  const out = {};
  Object.entries(agg).forEach(([d,s]) => {
    if(!s.topics) return;
    Object.entries(s.topics).forEach(([t,ts]) => {
      if(!out[d]) out[d] = {};
      out[d][t] = ts;
    });
  });
  return out;
}
// One-time migration so users who already had full-exam history (recorded before
// this cross-mode aggregate existed) don't lose that domain signal.
function migrateDomainStatsIfNeeded(){
  if(localStorage.getItem(DOMAIN_STATS_KEY)) return;
  const agg = {};
  loadHistory().forEach(h => {
    if(!h.domainStats) return;
    Object.entries(h.domainStats).forEach(([d,s]) => {
      if(!agg[d]) agg[d] = {correct:0, total:0};
      agg[d].correct += s.correct;
      agg[d].total += s.total;
    });
  });
  if(Object.keys(agg).length) localStorage.setItem(DOMAIN_STATS_KEY, JSON.stringify(agg));
}

// ---- Daily streaks, study goals & reminders ----
const STREAK_KEY = 'nremt_streak';

function dayKey(offsetDays){
  const d = new Date();
  if(offsetDays) d.setDate(d.getDate() + offsetDays);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function loadStreak(){
  const raw = localStorage.getItem(STREAK_KEY);
  const defaults = {
    currentStreak: 0, longestStreak: 0, lastActiveDate: null, dailyCounts: {},
    dailyGoal: 20, remindersEnabled: false, reminderHour: 18, lastNotifiedDate: null,
  };
  return raw ? Object.assign(defaults, JSON.parse(raw)) : defaults;
}
function saveStreak(s){ localStorage.setItem(STREAK_KEY, JSON.stringify(s)); }

// Called with the number of questions/cards studied whenever real activity happens
// (finishing a quiz session, answering an adaptive question, advancing a flashcard).
// A calendar day only ever advances the streak once, no matter how many times this
// fires that day.
function recordStudyActivity(n){
  if(!n) return;
  // The streak itself is site-wide now (assets/hub-progress.js): a day of
  // ochem keeps this flame alive too, and the once-per-day XP bonus is
  // awarded there so two subjects can't both claim it. The local
  // nremt_streak record is still updated because the reminder settings and
  // the NREMT-only history live on it.
  if(window.LevlXP) window.LevlXP.recordActivity(n);
  const s = loadStreak();
  const today = dayKey(0);
  if(s.lastActiveDate !== today){
    const yesterday = dayKey(-1);
    s.currentStreak = (s.lastActiveDate === yesterday) ? s.currentStreak + 1 : 1;
    s.lastActiveDate = today;
    s.longestStreak = Math.max(s.longestStreak, s.currentStreak);
  }
  s.dailyCounts[today] = (s.dailyCounts[today] || 0) + n;
  const keys = Object.keys(s.dailyCounts).sort();
  while(keys.length > 60){ delete s.dailyCounts[keys.shift()]; }
  saveStreak(s);
  renderStreakWidget();
}

// The stored currentStreak reflects the streak as of lastActiveDate. If more than
// one full day has passed since then with no activity, it's actually broken —
// this derives what should be SHOWN right now without mutating storage (storage
// only updates the next time the user actually does something).
function streakStatus(){
  // Reads the shared record so the number here, the header chip, the
  // dashboard and the ochem course can never disagree. Falls back to the
  // local one if hub-progress.js hasn't loaded (offline, blocked CDN).
  const hp = window.HubProgress;
  if(hp){
    const st = hp.streak();
    return {
      display: st.current, longest: st.longest, todayCount: st.todayCount,
      goal: st.goal, metToday: st.metToday,
      // The goal the student actually chose, which is what the settings
      // control has to show — st.goal may be today's eased-off version of it.
      goalBase: st.goalBase, eased: st.eased,
      freezes: st.freezes, freezePending: st.freezePending,
    };
  }
  const s = loadStreak();
  const today = dayKey(0), yesterday = dayKey(-1);
  const broken = s.lastActiveDate !== null && s.lastActiveDate !== today && s.lastActiveDate !== yesterday;
  return {
    display: broken ? 0 : s.currentStreak,
    longest: s.longestStreak,
    todayCount: s.dailyCounts[today] || 0,
    goal: s.dailyGoal,
    metToday: (s.dailyCounts[today] || 0) >= s.dailyGoal,
    goalBase: s.dailyGoal, eased: false, freezes: 0, freezePending: null,
  };
}

function formatHour12(h){
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${period}`;
}

function handleRemindersToggle(checked){
  const s = loadStreak();
  if(!checked){
    s.remindersEnabled = false;
    saveStreak(s);
    renderStreakWidget();
    return;
  }
  if(typeof Notification === 'undefined'){
    alert('Notifications are not supported in this browser.');
    renderStreakWidget();
    return;
  }
  if(Notification.permission === 'denied'){
    alert("Notifications are blocked for this site in your browser's settings. Allow them there, then try again.");
    renderStreakWidget();
    return;
  }
  if(Notification.permission === 'granted'){
    s.remindersEnabled = true;
    saveStreak(s);
    renderStreakWidget();
    return;
  }
  Notification.requestPermission().then(perm => {
    const s2 = loadStreak();
    s2.remindersEnabled = (perm === 'granted');
    saveStreak(s2);
    renderStreakWidget();
  });
}

// Best-effort only: this only fires while this browser tab (or another tab of this
// site) is actually open — a static site with no backend can't push a notification
// to a closed browser. Checked once on load and periodically while the tab is open.
function maybeShowStudyReminder(){
  const s = loadStreak();
  if(!s.remindersEnabled) return;
  if(typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const today = dayKey(0);
  const st = streakStatus();
  const todayCount = st.todayCount;
  if(todayCount >= st.goal) return;
  if(new Date().getHours() < s.reminderHour) return;
  if(s.lastNotifiedDate === today) return;
  try {
    new Notification('Keep your streak going!', {
      body: `You're at ${todayCount}/${st.goal} questions today — a quick session keeps it alive.`,
    });
  } catch(e) { /* some browsers restrict Notification outside a user gesture — ignore */ }
  s.lastNotifiedDate = today;
  saveStreak(s);
}

function renderStreakWidget(){
  const el = $id('streakWidget');
  if(!el) return;
  const s = loadStreak();
  const st = streakStatus();
  const pct = Math.min(100, Math.round(st.todayCount / st.goal * 100));

  let nudge;
  if(st.freezePending && !st.metToday) nudge = `<span class="streak-warn">A streak freeze is holding yesterday open — study today to keep it</span>`;
  else if(st.metToday) nudge = `<span class="streak-done">Today's goal complete ✓</span>`;
  else if(st.display > 0) nudge = `<span class="streak-warn">Practice today to keep your streak alive</span>`;
  else nudge = `<span>Answer a few questions today to start a streak</span>`;

  const hourOptions = [12,14,16,18,19,20,21].map(h =>
    `<option value="${h}" ${s.reminderHour===h?'selected':''}>${formatHour12(h)}</option>`
  ).join('');

  el.innerHTML = `
    <div class="streak-card">
      <div class="streak-top">
        <div class="streak-flame-block">
          <span class="streak-flame" aria-hidden="true"><svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 2c.6 3-1.2 4.6-2.6 6.2C7.8 10.2 7 12 7 14a5 5 0 0 0 10 0c0-1.6-.7-2.7-1.5-3.8.4 1.8-.3 3-1.3 3.4-.2-2-1.6-3-2.8-4.4-1 1.1-2.4 2.3-2.4 4a2 2 0 0 0 1.3 1.9c-1.6-.1-2.8-1.5-2.8-3.4 0-2.5 2.2-4 3.3-6.4.5-1.1.7-2.2.2-3.3Z" fill="var(--accent-2)"/></svg></span>
          <span class="streak-num">${st.display}</span>
          <span class="streak-word">day${st.display===1?'':'s'}</span>
        </div>
        <button class="streak-gear" id="streakSettingsToggle" type="button" aria-label="Streak settings"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V19a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg></button>
      </div>
      <div class="streak-goal-row">
        <span>${st.todayCount}/${st.goal} questions today${st.eased ? ` <span class="streak-eased" title="You missed a few days, so today's goal is lower. It goes back to ${st.goalBase} once you're studying again.">(easier target)</span>` : ''}</span>
        ${nudge}
      </div>
      <div class="streak-track"><div class="streak-fill${st.metToday?' met':''}" style="width:${pct}%"></div></div>
      ${st.longest > st.display ? `<div class="streak-best">Best streak: ${st.longest} day${st.longest===1?'':'s'}</div>` : ''}
      <div class="streak-settings" id="streakSettings" style="display:none;">
        <div class="streak-settings-row">
          <label for="dailyGoalSelect">Daily goal</label>
          <select id="dailyGoalSelect">
            ${[10,20,30,50].map(g => `<option value="${g}" ${(st.goalBase||st.goal)===g?'selected':''}>${g} questions/day</option>`).join('')}
          </select>
        </div>
        <div class="streak-settings-row">
          <label><input type="checkbox" id="remindersCb" ${s.remindersEnabled?'checked':''}> Remind me in-browser if I haven't hit my goal by</label>
          <select id="reminderHourSelect">${hourOptions}</select>
        </div>
        <p class="streak-note">${st.freezes ? `You have ${st.freezes} streak freeze in hand — miss a single day and your streak survives it.` : `Study seven days in a row to earn a streak freeze, which covers one missed day.`} Miss several days and your daily goal eases off on its own until you're back.</p>
        <p class="streak-note">Browser reminders only fire while this tab or browser is open — a static site like this can't message you once it's fully closed. Your browser will ask permission the first time you turn this on.</p>
      </div>
    </div>
  `;

  $id('streakSettingsToggle').addEventListener('click', () => {
    const panel = $id('streakSettings');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  $id('dailyGoalSelect').addEventListener('change', (e) => {
    const goal = parseInt(e.target.value, 10);
    if(window.HubProgress) window.HubProgress.setGoal(goal);
    const st2 = loadStreak();
    st2.dailyGoal = goal;
    saveStreak(st2);
    renderStreakWidget();
    $id('streakSettings').style.display = 'block';
  });
  $id('remindersCb').addEventListener('change', (e) => {
    handleRemindersToggle(e.target.checked);
    setTimeout(() => { const p = $id('streakSettings'); if(p) p.style.display = 'block'; }, 0);
  });
  $id('reminderHourSelect').addEventListener('change', (e) => {
    const st2 = loadStreak();
    st2.reminderHour = parseInt(e.target.value, 10);
    saveStreak(st2);
    $id('streakSettings').style.display = 'block';
  });
}

function loadMissed(){
  const raw = localStorage.getItem(MISSED_KEY);
  return raw ? QID.indicesOf(JSON.parse(raw)) : [];
}
function saveMissed(list){
  localStorage.setItem(MISSED_KEY, JSON.stringify(QID.idsOf(list)));
}

// Flagged questions are a manual bookmark, unlike the missed-question queue —
// flagging/unflagging is purely a user decision and is never auto-added or
// auto-cleared based on whether the question was answered correctly.
const FLAGGED_KEY = 'nremt_exam100_flagged';
function loadFlagged(){
  const raw = localStorage.getItem(FLAGGED_KEY);
  return raw ? QID.indicesOf(JSON.parse(raw)) : [];
}
function saveFlagged(list){
  localStorage.setItem(FLAGGED_KEY, JSON.stringify(QID.idsOf(list)));
}
function toggleFlag(qIdx){
  const flagged = new Set(loadFlagged());
  if(flagged.has(qIdx)) flagged.delete(qIdx); else flagged.add(qIdx);
  saveFlagged(Array.from(flagged));
  return flagged.has(qIdx);
}

function refreshIntroState(){
  const best = localStorage.getItem(STORAGE_KEY);
  const line = $id('bestScoreLine');
  if(best){
    const data = JSON.parse(best);
    line.textContent = `Your best score so far: ${data.score}/${data.total || 100} (completed in ${formatDuration(data.timeMs)})`;
  }
  const missed = loadMissed();
  $id('missedCount').textContent = missed.length;
  $id('reviewBtn').disabled = missed.length === 0;
  const flagged = loadFlagged();
  $id('flaggedCount').textContent = flagged.length;
  $id('flaggedReviewBtn').disabled = flagged.length === 0;
  const due = loadDueForReview();
  $id('spacedCount').textContent = due.length;
  $id('spacedReviewBtn').disabled = due.length === 0;
  renderDueSummary(due.length);
  // An empty queue is hidden, not greyed out: three dead "0" buttons were the
  // first thing a new visitor saw. (On review.html the due queue is the page,
  // and an empty one gets its own explanation instead — see renderDueSummary.)
  var anyQueue = false;
  ['reviewBtn','flaggedReviewBtn'].concat(RUNNER_PAGE === 'review' ? [] : ['spacedReviewBtn']).forEach(function(id){
    var btn = $id(id);
    btn.hidden = btn.disabled;
    if(!btn.disabled) anyQueue = true;
  });
  $id('reviewRow').hidden = !anyQueue;
  renderProgressChart();
  renderReadiness('readinessCard');
  renderWeakDomainsPanel();
  renderStreakWidget();
  renderResumeCard();
}

// The due-queue figures wherever a page shows them: the Review page's stat row,
// its ready/empty states, and the link card on Practice. Everything due is
// counted, though one session takes the 40 most pressing.
function renderDueSummary(sessionCount){
  const mastery = loadMastery();
  const ids = Object.keys(mastery).filter(k => QID.indexOf(k) !== -1);
  const tracked = ids.length;
  const mastered = ids.filter(k => effectiveMasteryLevel(mastery[k]) >= 5).length;
  const dueAll = tracked - mastered;
  document.querySelectorAll('[data-due="all"]').forEach(el => { el.textContent = dueAll.toLocaleString(); });
  document.querySelectorAll('[data-due="session"]').forEach(el => { el.textContent = sessionCount; });
  document.querySelectorAll('[data-due="tracked"]').forEach(el => { el.textContent = tracked.toLocaleString(); });
  document.querySelectorAll('[data-due="mastered"]').forEach(el => { el.textContent = mastered.toLocaleString(); });
  document.querySelectorAll('[data-due-state]').forEach(el => {
    const want = el.getAttribute('data-due-state');
    el.hidden = want === 'ready' ? dueAll === 0 : want === 'empty-new' ? !(dueAll === 0 && tracked === 0) : want === 'empty-done' ? !(dueAll === 0 && tracked > 0) : false;
  });
}

function examStateSummary(state){
  const totalLen = state.mode === 'adaptive' ? state.adaptiveState.length : state.activeIndices.length;
  const answeredCount = state.answers.filter(a => a !== null).length;
  const labels = {full:'Timed exam', review:'Missed-question review', flagged:'Flagged-question review', spaced:'Spaced review', domain:'Domain drill', adaptive:'Weak-spot practice', single:'Single question'};
  const label = labels[state.mode] || 'Practice session';
  let extra = '';
  if(state.withTimer){
    const remaining = Math.max(0, TIME_LIMIT_MS - (Date.now() - state.startTime));
    extra = ` · ${formatDuration(remaining)} left`;
  }
  return `${label} in progress — question ${state.current+1} of ${totalLen}, ${answeredCount} answered${extra}`;
}
function renderResumeCard(){
  const card = $id('resumeExamCard');
  const state = loadExamState();
  if(!state){ card.style.display = 'none'; return; }
  card.style.display = 'flex';
  $id('resumeExamText').textContent = examStateSummary(state);
}
// An attempt resumes on the page it was started from, so a timed exam comes
// back under Exams and a spaced session under Review, whichever page noticed it.
function resumeAttempt(state){
  const home = runnerPageFor(state.mode);
  if(home !== RUNNER_PAGE + '.html'){
    location.href = home + '?resume=1';
    return;
  }
  beginQuiz(state.withTimer, state);
}
$id('resumeExamBtn').addEventListener('click', () => {
  const state = loadExamState();
  if(!state) return;
  resumeAttempt(state);
});
$id('discardExamBtn').addEventListener('click', () => {
  if(confirm('Discard this in-progress attempt? This cannot be undone.')){
    clearExamState();
    renderResumeCard();
  }
});

migrateDomainStatsIfNeeded();
refreshIntroState();
maybeShowStudyReminder();
setInterval(maybeShowStudyReminder, 15*60*1000);

// ?resume=1 is how another page hands over an attempt that belongs here (see
// resumeAttempt). It only ever resumes; with nothing saved it is ignored.
(function(){
  if(new URLSearchParams(location.search).get('resume') === null) return;
  history.replaceState(null, '', location.pathname);
  const state = loadExamState();
  if(state && runnerPageFor(state.mode) === RUNNER_PAGE + '.html') beginQuiz(state.withTimer, state);
})();

// Lets the dashboard's per-domain "Practice" links (practice.html?domain=X) jump
// straight into a 20-question drill on that domain, without the user having to
// manually reselect it from the dropdown. Skipped if there's an in-progress
// exam to resume — that takes priority over a fresh auto-launch.
(function(){
  const domain = new URLSearchParams(location.search).get('domain');
  if(!domain || loadExamState()) return;
  const sel = $id('domainSelect');
  if(![...sel.options].some(o => o.value === domain)) return;
  sel.value = domain;
  history.replaceState(null, '', location.pathname);
  startDomainQuiz(domain, 20);
})();

// advertising (review.html?start=spaced, or practice.html?start=review for the missed
// advertising (practice.html?start=spaced, or ?start=review for the missed
// questions). The count on the home page is worth nothing if acting on it
// means landing here and hunting for the button it was talking about. Same
// precedence rule as ?domain= above: an exam in progress wins.
(function(){
  const start = new URLSearchParams(location.search).get('start');
  if(!start || loadExamState()) return;
  const queues = {
    spaced: loadDueForReview,
    review: loadMissed,
  };
  const load = queues[start];
  if(!load) return;
  const items = load();
  history.replaceState(null, '', location.pathname);
  // An empty queue is not an error — the student may simply have cleared it on
  // another device since the home page rendered. Leave them on the start
  // screen, which is where they would have ended up anyway.
  if(!items.length) return;
  mode = start;
  activeIndices = items;
  beginQuiz(false);
})();

// Lets a search result (practice.html?q=ID) open the single question it found,
// untimed and on its own. Without this the dominant result type in the whole
// search index could only drop the reader on the exam start screen with no way
// back to the question they had just found. Same precedence rule as ?domain=
// above: an exam in progress wins over a fresh auto-launch.
//
// N is a question id, so a link shared in a study group or sitting in someone's
// bookmarks still opens the same question after the bank is edited — and every
// such link made before ids existed still resolves, because the ids were
// numbered in the order those links were counting positions in.
(function(){
  const raw = new URLSearchParams(location.search).get('q');
  if(raw === null || loadExamState()) return;
  const i = QID.indexOf(Number(raw));
  if(i === -1) return;
  mode = 'single';
  activeIndices = [i];
  history.replaceState(null, '', location.pathname);
  beginQuiz(false);
})();

function formatDuration(ms){
  const totalSec = Math.floor(ms/1000);
  const h = Math.floor(totalSec/3600);
  const m = Math.floor((totalSec%3600)/60);
  const s = totalSec%60;
  return h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}

$id('startBtn').addEventListener('click', () => {
  mode = 'full';
  // The real cognitive exam is adaptive and one-directional: you answer, it
  // chooses the next item, and there is no route back. A practice exam with
  // Flag and Previous quietly trains the opposite habit — deferring the hard
  // ones — which is the habit the exam punishes hardest. On by default for
  // that reason; off is for the student who wants to review their reasoning
  // afterwards, which is a different and also useful exercise.
  realisticMode = $id('realisticMode').checked;
  const diffFilter = $id('difficultySelect').value;
  activeIndices = buildRandomExamIndices(diffFilter);
  TARGET_PACE_MS = TIME_LIMIT_MS / activeIndices.length;
  beginQuiz(true);
});

$id('reviewBtn').addEventListener('click', () => {
  const missed = loadMissed();
  if(missed.length === 0) return;
  mode = 'review';
  activeIndices = missed.slice();
  beginQuiz(false);
});

$id('flaggedReviewBtn').addEventListener('click', () => {
  const flagged = loadFlagged();
  if(flagged.length === 0) return;
  mode = 'flagged';
  activeIndices = flagged.slice();
  beginQuiz(false);
});

$id('spacedReviewBtn').addEventListener('click', () => {
  const due = loadDueForReview();
  if(due.length === 0) return;
  mode = 'spaced';
  activeIndices = due;
  beginQuiz(false);
});

$id('flashcardBtn').addEventListener('click', () => {
  const domain = $id('domainSelect').value;
  const diffFilter = $id('difficultySelect').value;
  let pool = domain === 'all'
    ? QUESTIONS.map((_,i) => i)
    : QUESTIONS.map((q,i) => ({q,i})).filter(o => o.q.domain === domain).map(o => o.i);
  if(diffFilter && diffFilter !== 'all'){
    const filtered = pool.filter(i => QUESTIONS[i].diff === diffFilter);
    if(filtered.length > 0) pool = filtered;
  }
  fcIndices = shuffle(pool);
  fcCurrent = 0;
  fcFlipped = false;
  loadExplanations();
  introScreen.style.display = 'none';
  $id('flashcardScreen').style.display = 'block';
  window.scrollTo(0, 0);
  renderFlashcard();
});

let fcIndices = [];
let fcCurrent = 0;
let fcFlipped = false;

async function renderFlashcard(){
  // The back of the card is the explanation, so this is one of the two places
  // that has to have it. Awaited before anything is written, rather than
  // rendering the front and patching the back in later.
  await loadExplanations();
  const q = QUESTIONS[fcIndices[fcCurrent]];
  $id('fcProgressText').textContent = `Card ${fcCurrent+1} of ${fcIndices.length}`;
  $id('fcDomain').innerHTML = `${q.domain}<span class="diff-badge ${q.diff}">${q.diff}</span>`;
  $id('fcProgressFill').style.width = ((fcCurrent+1)/fcIndices.length*100) + '%';

  const letters = LETTERS;
  const frontHint = q.type === 'multi'
    ? `<div style="font-size:12px;color:var(--accent);margin-bottom:8px;">Select ${q.correct.length}</div>`
    : q.type === 'order'
      ? `<div style="font-size:12px;color:var(--accent);margin-bottom:8px;">Put these in order</div>`
      : '';
  $id('fcFront').innerHTML = `
    <div style="margin-bottom:14px;">${q.q}</div>
    ${frontHint}
    <div style="font-size:13.5px;color:var(--muted);">
      ${q.options.map((o,i) => `${letters[i]}) ${o}`).join('<br>')}
    </div>
  `;
  $id('fcBack').innerHTML = `
    <div class="answer">${formatCorrectAnswerText(q, letters)}</div>
    <div class="explain">${q.explain || ''}</div>
    <div class="r-report">${window.LevlReport ? window.LevlReport.button('nremt', QID.idOf(fcIndices[fcCurrent])) : ''}</div>
  `;
  if(window.LevlReport) window.LevlReport.paint();

  fcFlipped = false;
  $id('fcFront').style.display = 'block';
  $id('fcBack').style.display = 'none';
  $id('fcPrevBtn').disabled = fcCurrent === 0;
  $id('fcNextBtn').textContent = fcCurrent === fcIndices.length-1 ? 'Shuffle & Restart' : 'Next';
}

$id('fcCard').addEventListener('click', () => {
  fcFlipped = !fcFlipped;
  const front = $id('fcFront');
  const back  = $id('fcBack');
  front.style.display = fcFlipped ? 'none' : 'block';
  back.style.display  = fcFlipped ? 'block' : 'none';
  // Flipping swaps which face is display:none, and a screen reader is told
  // nothing by that — the whole point of the interaction is the side that just
  // became visible, so read it out.
  if(window.LevlAnnounce){
    window.LevlAnnounce.say((fcFlipped ? back : front).textContent);
  }
});

$id('fcPrevBtn').addEventListener('click', () => {
  if(fcCurrent > 0){ fcCurrent--; renderFlashcard(); }
});
$id('fcNextBtn').addEventListener('click', () => {
  recordStudyActivity(1);
  if(fcCurrent < fcIndices.length-1){
    fcCurrent++;
    renderFlashcard();
  } else {
    fcIndices = shuffle(fcIndices);
    fcCurrent = 0;
    renderFlashcard();
  }
});
$id('flashcardExitBtn').addEventListener('click', () => {
  if(confirm('Exit flashcard review?')){
    $id('flashcardScreen').style.display = 'none';
    introScreen.style.display = 'block';
    window.scrollTo(0, 0);
    refreshIntroState();
  }
});

function startDomainQuiz(domain, length){
  const diffFilter = $id('difficultySelect').value;
  let pool = domain === 'all'
    ? QUESTIONS.map((_,i) => i)
    : QUESTIONS.map((q,i) => ({q,i})).filter(o => o.q.domain === domain).map(o => o.i);
  pool = filterPoolByDifficulty(shuffle(pool), diffFilter, length);
  mode = 'domain';
  selectedDomain = domain === 'all' ? null : domain;
  const seen = loadSeen();
  activeIndices = preferUnseen(pool, seen).slice(0, length);
  markSeen(activeIndices);
  beginQuiz(false);
}

$id('domainStartBtn').addEventListener('click', () => {
  const domain = $id('domainSelect').value;
  const length = parseInt($id('domainLength').value, 10);
  startDomainQuiz(domain, length);
});

// ---- Weak-domain suggestions: surfaces the domain(s) dragging down accuracy
// (cross-mode, same aggregate the readiness card and dashboard use) with a
// one-click "Practice" action, so acting on a weak area doesn't require
// manually picking it from the domain-drill dropdown.
function getWeakestDomains(limit){
  const agg = loadDomainStatsAll();
  const rows = Object.entries(agg)
    .filter(([,s]) => s.total >= 5)
    .map(([d,s]) => ({domain: d, total: s.total, correct: s.correct, pct: Math.round(s.correct/s.total*100)}))
    .sort((a,b) => a.pct - b.pct);
  return rows.slice(0, limit || 3);
}
function renderWeakDomainsPanel(){
  const panel = $id('weakDomainsPanel');
  const weak = getWeakestDomains(3).filter(r => r.pct < 80);
  if(weak.length === 0){ panel.innerHTML = ''; return; }
  panel.innerHTML = `
    <div class="weak-domains-panel">
      <div class="weak-domains-title">Your weaker domains — worth a focused drill</div>
      ${weak.map(r => `
        <div class="weak-domain-row">
          <span class="name">${r.domain}</span>
          <span class="pct">${r.pct}% (${r.correct}/${r.total})</span>
          <button type="button" data-domain="${r.domain}">Practice 20</button>
        </div>
      `).join('')}
    </div>
  `;
}
$id('weakDomainsPanel').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-domain]');
  if(!btn) return;
  startDomainQuiz(btn.dataset.domain, 20);
});

// ---- Weak-spot practice ----
// Unlike the domain drill (a fixed set picked once, by hand) this builds the session
// one question at a time: after every answer it re-weights the remaining pool toward
// whatever domain you're currently weakest in (blending long-term history with how
// this session itself is going) and nudges a target difficulty up or down based on
// whether you got the last question right, so the session actually retargets live
// instead of just being a static list generated at the start.
const DIFF_TO_NUM = {easy:0, medium:1, hard:2, expert:3};
let adaptiveState = null;

function adaptiveDomainWeight(domain){
  const historical = adaptiveState.historicalAcc[domain];
  const s = adaptiveState.sessionDomainStats[domain];
  const sessionAcc = s && s.total > 0 ? s.correct / s.total * 100 : null;
  // Blend in session-so-far accuracy once there's enough of it to mean something,
  // so a bad run on one domain right now pulls next picks toward it immediately —
  // not just whatever your accuracy looked like coming into this session.
  let acc;
  if(sessionAcc !== null && s.total >= 3){
    const sessionWeight = Math.min(0.7, s.total / 10);
    acc = historical !== null && historical !== undefined
      ? historical * (1 - sessionWeight) + sessionAcc * sessionWeight
      : sessionAcc;
  } else {
    acc = historical;
  }
  if(acc == null) return 60; // no data yet on this domain — sample it at a moderate rate
  return Math.max(10, 100 - acc);
}

function pickNextAdaptiveQuestion(){
  const mastery = loadMastery();
  const globalSeen = loadSeen();
  const targetRounded = Math.round(adaptiveState.targetDifficulty);
  const candidates = [];
  QUESTIONS.forEach((q, i) => {
    if(adaptiveState.sessionSeen.has(i)) return;
    const lvl = effectiveMasteryLevel(mastery[i]);
    const itemFactor = 6 - lvl; // less-mastered items are weighted higher
    const dWeight = adaptiveDomainWeight(q.domain);
    const diffFactor = DIFF_TO_NUM[q.diff] === targetRounded ? 2 : 1;
    const unseenBonus = globalSeen.has(i) ? 1 : 2; // favor questions never served before
    candidates.push({i, weight: dWeight * itemFactor * diffFactor * unseenBonus});
  });
  if(candidates.length === 0) return null;
  const totalWeight = candidates.reduce((a,c) => a + c.weight, 0);
  let r = Math.random() * totalWeight;
  for(const c of candidates){
    r -= c.weight;
    if(r <= 0){ adaptiveState.sessionSeen.add(c.i); markSeen([c.i]); return c.i; }
  }
  const last = candidates[candidates.length - 1];
  adaptiveState.sessionSeen.add(last.i);
  markSeen([last.i]);
  return last.i;
}

function updateAdaptiveDifficulty(q, correct){
  const d = DIFF_TO_NUM[q.diff];
  const delta = correct ? (0.15 + d * 0.1) : -(0.2 + (3 - d) * 0.1);
  adaptiveState.targetDifficulty = Math.max(0, Math.min(3, adaptiveState.targetDifficulty + delta));
}

function recordAdaptiveAnswer(qIdx, correct){
  const q = QUESTIONS[qIdx];
  updateMastery(qIdx, correct);
  if(!adaptiveState.sessionDomainStats[q.domain]) adaptiveState.sessionDomainStats[q.domain] = {correct:0, total:0};
  adaptiveState.sessionDomainStats[q.domain].total++;
  if(correct) adaptiveState.sessionDomainStats[q.domain].correct++;
  updateAdaptiveDifficulty(q, correct);
  recordStudyActivity(1);
}

$id('adaptiveStartBtn').addEventListener('click', () => {
  const length = parseInt($id('adaptiveLength').value, 10);
  mode = 'adaptive';
  selectedDomain = null;
  adaptiveState = {
    length,
    targetDifficulty: 1,
    sessionSeen: new Set(),
    sessionDomainStats: {},
    historicalAcc: domainAccuracyPct(),
  };
  const first = pickNextAdaptiveQuestion();
  activeIndices = first !== null ? [first] : [];
  beginQuiz(false);
});

function beginQuiz(withTimer, resumeState){
  loadExplanations();
  if(resumeState){
    mode = resumeState.mode;
    selectedDomain = resumeState.selectedDomain;
    activeIndices = resumeState.activeIndices;
    current = resumeState.current;
    answers = resumeState.answers;
    startTime = resumeState.startTime;
    if(resumeState.adaptiveState){
      adaptiveState = {
        length: resumeState.adaptiveState.length,
        targetDifficulty: resumeState.adaptiveState.targetDifficulty,
        sessionSeen: new Set(resumeState.adaptiveState.sessionSeen),
        sessionDomainStats: resumeState.adaptiveState.sessionDomainStats,
        historicalAcc: resumeState.adaptiveState.historicalAcc,
      };
    }
    if(mode === 'full') TARGET_PACE_MS = TIME_LIMIT_MS / activeIndices.length;
  } else {
    current = 0;
    const totalLen0 = mode === 'adaptive' ? adaptiveState.length : activeIndices.length;
    answers = new Array(totalLen0).fill(null);
    startTime = Date.now();
  }
  const totalLen = mode === 'adaptive' ? adaptiveState.length : activeIndices.length;
  // One event per attempt started. A resume is deliberately not counted: it is
  // the same attempt, and counting it would inflate starts against finishes
  // and make the completion rate read worse than it is.
  if(!resumeState && window.LevlAnalytics){
    window.LevlAnalytics.event('exam-start', { mode: mode, questions: totalLen });
    // Once per browser, ever: how long this student had to hunt before they
    // were answering anything. A first session that starts in ten seconds and
    // one that starts in four minutes are different products.
    window.LevlAnalytics.once('first-questions', { secs: window.LevlAnalytics.secondsIn(), mode: mode });
  }
  introScreen.style.display = 'none';
  quizScreen.style.display = 'grid';
  window.scrollTo(0, 0);
  $id('timerBar').style.display = withTimer ? 'block' : 'none';
  const banner = $id('practiceBanner');
  if(!withTimer){
    banner.style.display = 'block';
    if(mode === 'review'){
      banner.textContent = 'Missed-question review — untimed practice mode';
    } else if(mode === 'flagged'){
      banner.textContent = 'Flagged-question review — untimed practice mode';
    } else if(mode === 'adaptive'){
      banner.textContent = 'Weak-spot practice — untimed, retargets after every question';
    } else if(mode === 'spaced'){
      banner.textContent = 'Spaced review — untimed, oldest/weakest items first';
    } else if(mode === 'single'){
      banner.textContent = 'One question from search — answer it, or head back to the start';
    } else {
      banner.textContent = `Domain drill: ${QUESTIONS[activeIndices[0]] ? QUESTIONS[activeIndices[0]].domain : ''} — untimed practice mode`;
    }
  } else {
    banner.style.display = 'none';
  }
  renderQuestion();
  renderJumpRow();
  if(withTimer){
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
  }
}

function updateTimer(){
  const elapsed = Date.now() - startTime;
  const remaining = TIME_LIMIT_MS - elapsed;
  const remEl = $id('timeRemaining');
  const paceEl = $id('paceLine');

  if(remaining <= 0){
    remEl.textContent = '0:00:00';
    remEl.classList.add('warn');
    clearInterval(timerInterval);
    showResults();
    return;
  }

  remEl.textContent = formatDuration(remaining);
  if(remaining < 10*60*1000) remEl.classList.add('warn');

  // Pace is answered questions over elapsed time. It used to divide by the
  // question you had REACHED, which meant clicking Next without answering made
  // your pace look great, and which declared you "ahead of pace" one second in
  // with nothing answered at all. Below the first answer there is no pace to
  // report, so report none.
  const answered = answers.filter(a => a !== null).length;
  const targetSec = Math.round(TARGET_PACE_MS/1000);
  if(answered === 0){
    paceEl.textContent = `Target pace: ${targetSec}s per question`;
    paceEl.className = 'pace-line';
    return;
  }
  const avgPace = elapsed / answered;
  const paceDiff = TARGET_PACE_MS - avgPace;
  const paceSec = Math.round(avgPace/1000);

  if(paceDiff >= 0){
    paceEl.textContent = `Pace: ${paceSec}s/question avg (target ${targetSec}s) — ahead of pace`;
    paceEl.className = 'pace-line ahead';
  } else {
    paceEl.textContent = `Pace: ${paceSec}s/question avg (target ${targetSec}s) — behind pace`;
    paceEl.className = 'pace-line behind';
  }
}

function renderQuestion(){
  const totalLen = mode === 'adaptive' ? adaptiveState.length : activeIndices.length;
  const q = QUESTIONS[activeIndices[current]];
  $id('progressText').textContent = `Question ${current+1} of ${totalLen}`;
  $id('answeredText').textContent = `${answers.filter(a=>a!==null).length} answered`;
  $id('progressFill').style.width = ((current+1)/totalLen*100) + '%';
  $id('qDomain').innerHTML = `${q.domain}<span class="diff-badge ${q.diff}">${q.diff}</span>`;
  $id('qPrompt').textContent = q.q;

  const isFlagged = loadFlagged().includes(activeIndices[current]);
  const flagBtn = $id('flagBtn');
  flagBtn.innerHTML = flagIcon + (isFlagged ? 'Flagged' : 'Flag for review');
  flagBtn.classList.toggle('active', isFlagged);

  const optsEl = $id('qOptions');
  optsEl.innerHTML = '';

  if(q.type === 'multi'){
    const hint = document.createElement('div');
    hint.className = 'tei-hint';
    hint.textContent = `Select the ${q.correct.length} answer options which are correct.`;
    optsEl.appendChild(hint);
    const selected = Array.isArray(answers[current]) ? answers[current] : [];
    q.options.forEach((opt, i) => {
      const div = document.createElement('div');
      div.className = 'option multi' + (selected.includes(i) ? ' selected' : '');
      div.innerHTML = `<span class="letter">${selected.includes(i) ? '&check;' : LETTERS[i]}</span><span>${opt}</span>`;
      div.addEventListener('click', () => {
        const cur = Array.isArray(answers[current]) ? answers[current].slice() : [];
        const pos = cur.indexOf(i);
        if(pos === -1) cur.push(i); else cur.splice(pos, 1);
        answers[current] = cur;
        renderQuestion();
        renderJumpRow();
      });
      optsEl.appendChild(div);
    });
  } else if(q.type === 'order'){
    const hint = document.createElement('div');
    hint.className = 'tei-hint';
    hint.textContent = 'Arrange these in the correct order.';
    optsEl.appendChild(hint);
    if(!Array.isArray(answers[current])){
      answers[current] = q.options.map((_, i) => i);
    }
    const order = answers[current];
    const list = document.createElement('div');
    list.className = 'order-list';
    order.forEach((optIdx, pos) => {
      const div = document.createElement('div');
      div.className = 'order-item';
      div.innerHTML = `<span class="pos">${pos+1}</span><span class="order-text">${q.options[optIdx]}</span>
        <span class="order-btns">
          <button type="button" data-dir="up" ${pos===0?'disabled':''}>&#9650;</button>
          <button type="button" data-dir="down" ${pos===order.length-1?'disabled':''}>&#9660;</button>
        </span>`;
      div.querySelector('[data-dir="up"]').addEventListener('click', () => {
        [order[pos-1], order[pos]] = [order[pos], order[pos-1]];
        renderQuestion();
        renderJumpRow();
      });
      div.querySelector('[data-dir="down"]').addEventListener('click', () => {
        [order[pos+1], order[pos]] = [order[pos], order[pos+1]];
        renderQuestion();
        renderJumpRow();
      });
      list.appendChild(div);
    });
    optsEl.appendChild(list);
  } else {
    q.options.forEach((opt, i) => {
      const div = document.createElement('div');
      div.className = 'option' + (answers[current]===i ? ' selected' : '');
      div.innerHTML = `<span class="letter">${LETTERS[i]}</span><span>${opt}</span>`;
      div.addEventListener('click', () => {
        answers[current] = i;
        renderQuestion();
        renderJumpRow();
      });
      optsEl.appendChild(div);
    });
  }

  // In exam-realistic mode the two controls the real exam does not have are
  // removed rather than disabled: a greyed-out Previous still invites the habit
  // of planning to come back. The jump row goes for the same reason.
  const realistic = realisticMode && mode === 'full';
  const prevBtn = $id('prevBtn');
  prevBtn.hidden = realistic;
  prevBtn.disabled = current === 0;
  const flagBtnEl = $id('flagBtn');
  if(flagBtnEl) flagBtnEl.hidden = realistic;
  const jumpRowEl = $id('jumpRow');
  if(jumpRowEl) jumpRowEl.hidden = realistic;
  $id('nextBtn').textContent = current === totalLen-1 ? 'Finish' : 'Next';
  saveExamState();
}

function renderJumpRow(){
  const row = $id('jumpRow');
  const flagged = new Set(loadFlagged());
  row.innerHTML = '';
  activeIndices.forEach((qIdx,i) => {
    const btn = document.createElement('button');
    btn.className = 'jump-btn' + (i===current?' current':'') + (answers[i]!==null?' answered':'') + (flagged.has(qIdx)?' flagged':'');
    btn.textContent = i+1;
    btn.addEventListener('click', () => { current = i; renderQuestion(); renderJumpRow(); });
    row.appendChild(btn);
  });
}

$id('flagBtn').addEventListener('click', () => {
  if(realisticMode && mode === 'full') return;
  toggleFlag(activeIndices[current]);
  renderQuestion();
  renderJumpRow();
});

$id('prevBtn').addEventListener('click', () => {
  if(realisticMode && mode === 'full') return;
  if(current > 0){ current--; renderQuestion(); renderJumpRow(); }
});
$id('nextBtn').addEventListener('click', () => {
  const totalLen = mode === 'adaptive' ? adaptiveState.length : activeIndices.length;
  const atFrontier = current === activeIndices.length - 1;

  if(mode === 'adaptive' && atFrontier){
    const qIdx = activeIndices[current];
    recordAdaptiveAnswer(qIdx, isAnswerCorrect(QUESTIONS[qIdx], answers[current]));
  }

  if(current < totalLen - 1){
    if(atFrontier && mode === 'adaptive'){
      const next = pickNextAdaptiveQuestion();
      if(next !== null) activeIndices.push(next);
    }
    current++;
    renderQuestion();
    renderJumpRow();
  } else {
    showResults();
  }
});
$id('exitBtn').addEventListener('click', () => {
  if(confirm('Exit for now? Your progress is saved — you can resume this exact attempt from the start screen.')){
    clearInterval(timerInterval);
    quizScreen.style.display = 'none';
    $id('timerBar').style.display = 'none';
    $id('practiceBanner').style.display = 'none';
    introScreen.style.display = 'block';
    window.scrollTo(0, 0);
    refreshIntroState();
  }
});

function confirmSubmitNow(){
  if(confirm('Submit now? You can still review all questions and answers after.')){
    showResults();
  }
}
$id('submitBtn').addEventListener('click', confirmSubmitNow);
$id('submitBtnTop').addEventListener('click', confirmSubmitNow);

let allReviewData = [];

// XP for a completed quiz session (any mode): a flat completion bonus, 10 XP per
// correct answer, plus a one-time bonus the first time a domain crosses an
// accuracy milestone (see DOMAIN_TIER_THRESHOLDS in nav.js, which also renders
// the header's level badge). Awarded once per finished session, not live per
// question, so it stays a single localStorage write instead of one per answer.
function awardQuizXp(domainStats, score){
  if(!window.LevlXP) return;
  const XP_PER_CORRECT = 10, COMPLETION_BONUS = 25;
  let xpGain = score * XP_PER_CORRECT + COMPLETION_BONUS;

  const xpState = window.LevlXP.loadXp();
  const allDomainStats = loadDomainStatsAll();
  const tierUpdates = {};
  Object.keys(domainStats).forEach(d => {
    const agg = allDomainStats[d];
    if(!agg || agg.total <= 0) return;
    const pct = agg.correct / agg.total * 100;
    let tier = xpState.domainTiers[d] || 0;
    window.LevlXP.DOMAIN_TIER_THRESHOLDS.forEach((t, i) => {
      if(tier <= i && agg.total >= t.minTotal && pct >= t.pct){
        xpGain += t.xp;
        tier = i + 1;
      }
    });
    if(tier !== (xpState.domainTiers[d] || 0)) tierUpdates[d] = tier;
  });

  window.LevlXP.awardXp(xpGain, tierUpdates);
}

function showResults(){
  clearInterval(timerInterval);
  clearExamState();
  const elapsed = Date.now() - startTime;
  quizScreen.style.display = 'none';
  $id('timerBar').style.display = 'none';
  $id('practiceBanner').style.display = 'none';
  resultsScreen.style.display = 'grid';
  window.scrollTo(0, 0);

  let score = 0;
  const domainStats = {};
  let missedSet = new Set(loadMissed());

  activeIndices.forEach((qIdx,i) => {
    const q = QUESTIONS[qIdx];
    if(!domainStats[q.domain]) domainStats[q.domain] = {correct:0,total:0,topics:{}};
    const ds = domainStats[q.domain];
    ds.total++;
    const topic = q.topic || 'General';
    if(!ds.topics[topic]) ds.topics[topic] = {correct:0,total:0};
    ds.topics[topic].total++;
    const correct = isAnswerCorrect(q, answers[i]);
    if(correct){
      score++;
      ds.correct++;
      ds.topics[topic].correct++;
      missedSet.delete(qIdx);
    } else {
      missedSet.add(qIdx);
    }
    // Weak-spot sessions already update mastery live, per-question, as they go —
    // every other mode records it here in bulk instead.
    if(mode !== 'adaptive') updateMastery(qIdx, correct);
  });
  saveMissed(Array.from(missedSet));
  recordDomainStatsAll(domainStats);
  if(mode !== 'adaptive') recordStudyActivity(activeIndices.length);
  awardQuizXp(domainStats, score);

  /* The one page on the site with no per-answer chime: this quiz withholds
     right/wrong until you submit, the way the real exam does, so a sound on
     selection would hand you the answer. The reward lands here instead, on the
     score reveal, pitched to how the attempt went. */
  if(window.LevlSound) window.LevlSound.flourish(score / activeIndices.length);
  // Submitting swaps the whole quiz screen for the results screen. The chime
  // above already says roughly how it went to anyone who can hear it; this is
  // the same news for anyone who cannot, and the exact figure besides.
  if(window.LevlAnnounce){
    window.LevlAnnounce.say(
      `Exam complete. You scored ${score} out of ${activeIndices.length}, ` +
      `${Math.round(score/activeIndices.length*100)} percent.`
    );
  }

  /* A finished exam is the other high point, alongside a level-up, where
     offering to save this is a favor rather than a toll — the student has
     just built something they would be annoyed to lose. StudyHubAccount holds
     the rules about whether to actually show anything; a short attempt is not
     one of those moments, so it does not ask after a five-question drill. */
  if(window.StudyHubAccount && activeIndices.length >= 20){
    setTimeout(function(){
      window.StudyHubAccount.promptToSave('Exam finished \u2014 ' + score + '/' + activeIndices.length,
        { kind: 'exam', score: score, total: activeIndices.length, missed: missedSet.size });
    }, 2600);
  }

  /* Reminders ask at the same high point, and only if the save prompt did not
     take it. Both draw the same .levl-prompt and only one is ever in the DOM at
     once — LevlReminders.offer() checks for the other and stands down, so the
     two cannot stack and the student is never asked for two things at the end
     of one session. Saving progress wins the tie: it protects work that already
     exists, where a reminder is about work that does not exist yet. */
  if(window.LevlReminders && activeIndices.length >= 20){
    setTimeout(function(){ window.LevlReminders.offer('exam-finished'); }, 3400);
  }

  // The other half of the pair. Banded rather than exact: the useful question
  // is "are people passing", and a bare percentage per attempt is finer-grained
  // than that needs while saying more about the individual.
  if(window.LevlAnalytics){
    const pct = Math.round(score / activeIndices.length * 100);
    window.LevlAnalytics.event('exam-finish', {
      mode: mode,
      questions: activeIndices.length,
      band: pct >= 80 ? '80-100' : pct >= 70 ? '70-79' : pct >= 60 ? '60-69' : 'under-60'
    });
  }

  // The Premium waitlist, after a session long enough to have shown what the
  // bank does. See assets/premium.js: this asks, it does not lock anything.
  $id('premiumSlot').innerHTML =
    (window.LevlPremium && activeIndices.length >= 10) ? window.LevlPremium.card('nremt', 'results') : '';

  $id('scoreBig').textContent = `${score}/${activeIndices.length}`;
  $id('scoreSub').textContent = `${Math.round(score/activeIndices.length*100)}% correct — completed in ${formatDuration(elapsed)}`;

  const breakdownEl = $id('domainBreakdown');
  breakdownEl.innerHTML = Object.entries(domainStats).map(([d,s]) => {
    const topicRows = Object.entries(s.topics || {})
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([t,ts]) => `<div class="row topic-row"><span>${t}</span><span>${ts.correct}/${ts.total}</span></div>`)
      .join('');
    return `<div class="row"><span>${d}</span><span>${s.correct}/${s.total}</span></div>${topicRows}`;
  }).join('');

  const clearedNote = $id('clearedNote');
  if(mode === 'review' && missedSet.size === 0){
    clearedNote.style.display = 'block';
    clearedNote.textContent = "You've cleared your entire missed-question queue. Nice work — take the full exam again to build a new one, or just keep it clean.";
  } else if(mode === 'review'){
    clearedNote.style.display = 'block';
    clearedNote.textContent = `${missedSet.size} question${missedSet.size===1?'':'s'} still in your review queue for next time.`;
  } else if(mode === 'flagged'){
    const stillFlagged = loadFlagged().length;
    clearedNote.style.display = 'block';
    clearedNote.textContent = stillFlagged === 0
      ? "You've unflagged everything in this review session. Flag any question again from its answer screen whenever something's worth coming back to."
      : `${stillFlagged} question${stillFlagged===1?'':'s'} still flagged for review. Flags don't clear on their own — unflag one with its Flag button once you're confident on it.`;
  } else {
    clearedNote.style.display = 'none';
  }

  if(mode === 'full'){
    const best = localStorage.getItem(STORAGE_KEY);
    const bestData = best ? JSON.parse(best) : null;
    if(!bestData || score > bestData.score){
      localStorage.setItem(STORAGE_KEY, JSON.stringify({score, total: activeIndices.length, timeMs: elapsed}));
    }
    saveHistoryEntry({score, total: activeIndices.length, timeMs: elapsed, date: Date.now(), domainStats});
  }

  if(mode === 'full' || mode === 'domain' || mode === 'adaptive' || mode === 'spaced'){
    renderReadiness('readinessUpdate', {compact: true});
  } else {
    $id('readinessUpdate').innerHTML = '';
  }

  allReviewData = activeIndices.map((qIdx,i) => {
    const q = QUESTIONS[qIdx];
    const userAns = answers[i];
    const isCorrect = isAnswerCorrect(q, userAns);
    return {q, qIdx, userAns, isCorrect, letters: LETTERS};
  });
  document.querySelectorAll('.filter-row button').forEach(b=>b.classList.remove('active'));
  document.querySelector('.filter-row button[data-filter="all"]').classList.add('active');
  renderReview('all');
}

async function renderReview(filter){
  // The other one: every row in the results list carries the explanation for
  // the question above it.
  await loadExplanations();
  const reviewEl = $id('reviewList');
  let items = allReviewData;
  if(filter === 'incorrect') items = allReviewData.filter(d => !d.isCorrect && d.userAns !== null);
  if(filter === 'unanswered') items = allReviewData.filter(d => d.userAns === null);

  const flagged = new Set(loadFlagged());
  reviewEl.innerHTML = items.map(({q,qIdx,userAns,isCorrect,letters}) => `
      <div class="review-item">
        <div class="r-head">
          <div class="r-domain">${q.domain}<span class="diff-badge ${q.diff}">${q.diff}</span></div>
          <button type="button" class="r-flag-btn${flagged.has(qIdx) ? ' active' : ''}" data-qidx="${qIdx}">${flagIcon}${flagged.has(qIdx) ? 'Flagged' : 'Flag'}</button>
        </div>
        <div class="r-q">${q.q}</div>
        <div class="r-answer ${isCorrect ? 'correct' : 'incorrect'}">
          Your answer: ${formatUserAnswerText(q, userAns, letters) ?? 'Not answered'} ${isCorrect ? '✓' : '✗'}
        </div>
        ${!isCorrect ? `<div class="r-answer correct">Correct answer: ${formatCorrectAnswerText(q, letters)}</div>` : ''}
        <div class="r-explain">${q.explain || ''}</div>
        <div class="r-report">${window.LevlReport ? window.LevlReport.button('nremt', QID.idOf(qIdx)) : ''}</div>
      </div>
  `).join('');
  currentReviewFilter = filter;
  // Re-paint after a re-render: a question already reported from another card
  // in this same list must not come back with a live button.
  if(window.LevlReport) window.LevlReport.paint();
  reviewEl.querySelectorAll('.r-flag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleFlag(parseInt(btn.dataset.qidx, 10));
      renderReview(currentReviewFilter);
    });
  });
}
let currentReviewFilter = 'all';

document.querySelectorAll('.filter-row button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-row button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderReview(btn.dataset.filter);
  });
});

function backToStart(){
  resultsScreen.style.display = 'none';
  introScreen.style.display = 'block';
  window.scrollTo(0, 0);
  refreshIntroState();
}
$id('retryBtn').addEventListener('click', backToStart);
$id('printResultBtn').addEventListener('click', () => {
  resultsScreen.setAttribute('data-printed', new Date().toLocaleString());
  window.print();
});
$id('retryBtnTop').addEventListener('click', backToStart);

})();
});
