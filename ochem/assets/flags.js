/* Flagged questions — a manual bookmark on a single question.

   Deliberately separate from the mistake list in mastery-engine.js, because
   the two answer different questions. A mistake is something the engine
   observed: you got it wrong, and it stays in rotation until you get it
   right. A flag is something only the student knows — "I picked the right
   answer and I could not tell you why", or "I want to come back to this
   one" — and nothing the engine sees can add or clear it. Getting a flagged
   question right later does NOT unflag it; you do, when you're satisfied.

   Stored as { qid: timestamp } so the list can be shown newest-first, keyed
   by the question ids the question engine hands out ('lb:topic:3' for a bank
   question, the authored id for an interactive one). An id that no longer
   exists in the bank is dropped on read rather than kept forever. */
(function(){
  var KEY = 'ochem_flagged_v1';

  function read(){
    try{
      var raw = localStorage.getItem(KEY);
      var obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === 'object') ? obj : {};
    }catch(e){ return {}; }
  }
  function write(obj){
    try{ localStorage.setItem(KEY, JSON.stringify(obj)); }catch(e){}
  }

  function has(qid){ return Object.prototype.hasOwnProperty.call(read(), qid); }

  /* Newest flag first: the thing you just wondered about is the thing you
     most likely came here to find. */
  function list(){
    var m = read();
    return Object.keys(m).sort(function(a, b){ return m[b] - m[a]; });
  }

  function count(){ return list().length; }

  function add(qid){ var m = read(); m[qid] = Date.now(); write(m); return true; }
  function remove(qid){ var m = read(); delete m[qid]; write(m); return false; }
  function toggle(qid){ return has(qid) ? remove(qid) : add(qid); }
  function clear(){ write({}); }

  /* Flags whose question is still in the pool, as question objects. Anything
     unresolvable is forgotten — a stale id would otherwise inflate the count
     on the Practice page against a session that can never serve it. */
  function questions(){
    var E = window.OchemQuestionEngine;
    if(!E || !E.byId) return [];
    var m = read();
    var out = [];
    var dropped = false;
    list().forEach(function(qid){
      var q = E.byId(qid);
      if(q) out.push(q);
      else { delete m[qid]; dropped = true; }
    });
    if(dropped) write(m);
    return out;
  }

  window.OchemFlags = {
    has: has, list: list, count: count,
    add: add, remove: remove, toggle: toggle, clear: clear,
    questions: questions
  };
})();
