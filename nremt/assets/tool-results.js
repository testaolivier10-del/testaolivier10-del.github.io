/* What a tool's answer leaves behind: misses in Review, right answers as progress.

   window.NremtToolResults.record({ tool, id, correct, label, href, qid })

     tool   'body-map' | 'sound-trainer' | 'flowcharts' | 'formulary' | 'scenario-sim'
     id     stable within the tool (a structure key, a sound id, a fork)
     label  what the student was asked about, as Review should name it
     href   the way back to that exact thing in the tool
     qid    optional: the item IS a question-bank question (the formulary
            drill draws from questions.json), so it goes straight into the
            question queue instead

   WHERE A MISS GOES. NREMT's Review queue is nremt_mastery, a Leitner record
   per question id, and practice-engine.js turns it into a session of bank
   questions. It cannot hold a body-map structure or a heart sound: those are
   not questions, the engine could not ask them, and loadMastery() prunes any
   key the bank does not know, so a tool item written there would be erased by
   the next practice answer. So:

     - a bank question (qid) updates nremt_mastery with the engine's own rule
       (right: level +1, wrong: level 0), and Review asks it again like any other;
     - anything else goes in nremt_tool_review, next to it, and Review lists it
       under the question queue as "From the tools", each with a link back to
       the exact thing in its tool. It leaves the list the next time the tool
       records it right. Synced like the rest (nav.js PROGRESS_KEYS).

   RIGHT ANSWERS. Same currency as the rest of the course (assets/hub-progress.js):
   every answer counts toward the day's goal and streak, and each right one is
   worth TOOL_XP, capped per day so clicking through a list is not a level. */
(function(){
  var KEY = 'nremt_tool_review';
  var MASTERY_KEY = 'nremt_mastery';
  var TOOL_XP = 4, TOOL_XP_CAP = 60, MAX_ITEMS = 80;
  var NAMES = {
    'body-map': 'Body map',
    'sound-trainer': 'Sound trainer',
    'flowcharts': 'Protocol flows',
    'formulary': 'Formulary',
    'scenario-sim': 'Scenario sim'
  };

  function dayKey(){
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function readJSON(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } }
  function writeJSON(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
  function load(){
    var s = readJSON(KEY);
    if(!s || typeof s !== 'object' || Array.isArray(s)) s = {};
    if(!s.items || typeof s.items !== 'object') s.items = {};
    if(!s.paid || typeof s.paid !== 'object') s.paid = { day: '', xp: 0 };
    s.v = 1;
    return s;
  }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* The engine's updateMastery(), for a question answered outside it. Kept in
     step with practice-engine.js by hand, like the due count on the home page. */
  function recordQuestion(qid, correct){
    var m = readJSON(MASTERY_KEY);
    if(!m || typeof m !== 'object' || Array.isArray(m)) m = {};
    var rec = m[qid] || { level: 0, timesCorrect: 0, timesWrong: 0, lastSeen: 0 };
    if(correct){ rec.level = Math.min(5, (rec.level || 0) + 1); rec.timesCorrect = (rec.timesCorrect || 0) + 1; }
    else { rec.level = 0; rec.timesWrong = (rec.timesWrong || 0) + 1; }
    rec.lastSeen = Date.now();
    m[qid] = rec;
    writeJSON(MASTERY_KEY, m);
  }

  function award(s, correct){
    var hp = window.HubProgress;
    if(correct){
      var today = dayKey();
      if(s.paid.day !== today) s.paid = { day: today, xp: 0 };
      var xp = Math.min(TOOL_XP, Math.max(0, TOOL_XP_CAP - (s.paid.xp || 0)));
      s.paid.xp = (s.paid.xp || 0) + xp;
      if(hp && xp) hp.award('nremt', xp);
    }
    if(hp) hp.recordActivity('nremt', 1);
  }

  function record(r){
    if(!r || !r.tool || r.id == null) return null;
    var correct = !!r.correct;
    var s = load();
    var qid = r.qid;
    if(typeof qid === 'number' && isFinite(qid)){
      recordQuestion(qid, correct);
    } else {
      var k = r.tool + ':' + r.id;
      var it = s.items[k];
      if(correct){
        delete s.items[k];
      } else {
        it = it || { tool: r.tool, id: String(r.id), misses: 0 };
        it.label = String(r.label || it.label || r.id).slice(0, 160);
        it.href = String(r.href || it.href || '');
        it.misses = (it.misses || 0) + 1;
        it.lastSeen = Date.now();
        s.items[k] = it;
        // Oldest first out, so a long session cannot grow this without bound.
        var keys = Object.keys(s.items);
        if(keys.length > MAX_ITEMS){
          keys.sort(function(a, b){ return (s.items[a].lastSeen || 0) - (s.items[b].lastSeen || 0); });
          keys.slice(0, keys.length - MAX_ITEMS).forEach(function(x){ delete s.items[x]; });
        }
      }
    }
    award(s, correct);
    writeJSON(KEY, s);
    if(window.StudyHubAccount && window.StudyHubAccount.syncSoon) window.StudyHubAccount.syncSoon();
    renderAll();
    return { correct: correct, due: due().length };
  }

  /* Everything waiting, newest miss first. */
  function due(){
    var items = load().items;
    return Object.keys(items).map(function(k){ return items[k]; })
      .filter(function(it){ return it && it.tool; })
      .sort(function(a, b){ return (b.lastSeen || 0) - (a.lastSeen || 0); });
  }

  /* Review's "From the tools" card: any [data-tool-queue] on the page. */
  function render(el){
    var list = due();
    el.hidden = !list.length;
    if(!list.length){ el.innerHTML = ''; return; }
    el.innerHTML =
      '<h2>From the tools <small class="cx-tq-n">' + list.length + ' to revisit</small></h2>' +
      '<p class="cx-small">Missed in the body map, sound trainer, protocol flows or a scenario. Each one leaves this list when you get it right in its tool.</p>' +
      '<ul class="cx-list cx-tq">' + list.map(function(it){
        var n = it.misses || 1;
        return '<li><div>' + esc(it.label) +
          '<span>' + esc(NAMES[it.tool] || it.tool) + ' &middot; missed ' + (n === 1 ? 'once' : n + ' times') + '</span></div>' +
          (it.href ? '<a class="btn-outline cx-tq-go" href="' + esc(it.href) + '">Try it again<span class="sr-only"> in the ' + esc(NAMES[it.tool] || it.tool) + ': ' + esc(it.label) + '</span></a>' : '') +
          '</li>';
      }).join('') + '</ul>';
  }
  function renderAll(){
    if(typeof document === 'undefined') return;
    document.querySelectorAll('[data-tool-queue]').forEach(render);
    document.dispatchEvent(new CustomEvent('nremt:tool-review', { detail: { due: due().length } }));
  }

  window.NremtToolResults = { record: record, due: due, render: render, NAMES: NAMES, KEY: KEY };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderAll);
  else renderAll();
})();
