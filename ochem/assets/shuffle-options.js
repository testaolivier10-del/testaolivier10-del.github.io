/* Option shuffling, shared by every place the site asks a multiple-choice
   question.

   Why this exists: all four question sources on the site were authored the
   same way — write the question, write the right answer, then think up
   distractors — and all four ended up with the answer sitting in the first
   slot. 178 of 193 lesson steps, 15 of 15 mechanism steps, and 53% of the
   1,860-question practice bank. A student who notices can clear a lesson by
   clicking the top button, and because lesson answers feed the concept
   model, the mastery engine banks that as knowledge.

   The banks themselves have been rebalanced, but that is a snapshot: the
   next question anyone writes will be answer-first again, because that is
   how writing a question works. Shuffling at render time makes the bias
   structurally impossible instead of merely currently-absent.

   Two properties the callers depend on:

   1. Stable within a sitting. A permutation is derived from a key (topic +
      step, or a question id) and a salt held in sessionStorage, so stepping
      back to re-read a question shows the options where you left them, and
      a page reload mid-lesson does not reshuffle underneath you. A new
      session gets a new salt, so a second pass through a lesson is not the
      same muscle-memory pattern.

   2. Index-safe. Everything downstream of an answer is keyed by option
      index — correctIndex, the `wrong` map on mechanism steps, the `diag`
      map that tells the mastery engine which misconception a specific wrong
      click reveals. `apply()` returns the reordered options together with
      the mapping needed to translate a clicked position back to the index
      the author wrote, so none of that has to move.

   Options an author pinned in place are left alone: "None of these" and
   "All of the above" have to stay last to read correctly, and a True/False
   pair must stay in that order. */
(function(){
  var PINNED = /(of the above|of these)\s*$/i;
  var TF = ['true', 'false'];
  var SALT_KEY = 'ochem_shuffle_salt';
  var salt = null;

  function getSalt(){
    if(salt !== null) return salt;
    try{
      salt = sessionStorage.getItem(SALT_KEY);
      if(!salt){
        salt = String(Math.floor(Math.random() * 1e9));
        sessionStorage.setItem(SALT_KEY, salt);
      }
    }catch(e){
      /* Private mode, or storage disabled. A fixed salt still shuffles;
         it just repeats across sessions, which is no worse than the
         static ordering this replaces. */
      salt = 'no-storage';
    }
    return salt;
  }

  // xmurmur-ish string hash; only needs to be well spread, not secure.
  function hash(str){
    var h = 2166136261;
    for(var i = 0; i < str.length; i++){
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  /* Deterministic Fisher-Yates over 0..n-1, seeded by key + session salt.

     The generator is mulberry32 and the bucket comes from the FLOAT it
     produces, not from `seed % n`. That is not fussiness: the obvious
     `(seed * 1103515245 + 12345) % (j+1)` puts the low bits of a linear
     congruential generator in charge of the choice, and those bits barely
     vary — with four options it piled 3,990 of 4,000 answers into the last
     slot, which is the same bug as answer-first authoring wearing a
     different hat. There is a test for this in the scratchpad. */
  function permutation(n, key){
    var seed = hash(getSalt() + '|' + key) || 1;
    function rand(){
      seed = (seed + 0x6D2B79F5) >>> 0;
      var t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    var idx = [];
    for(var i = 0; i < n; i++) idx.push(i);
    for(var j = n - 1; j > 0; j--){
      var k = Math.floor(rand() * (j + 1));
      var t2 = idx[j]; idx[j] = idx[k]; idx[k] = t2;
    }
    return idx;
  }

  function isTrueFalse(options){
    return options.length === 2 &&
      TF.indexOf(String(options[0]).trim().toLowerCase()) === 0 &&
      TF.indexOf(String(options[1]).trim().toLowerCase()) === 1;
  }

  /* apply(options, key) -> { options, toOriginal, toShuffled }

       options     the reordered array to render
       toOriginal  toOriginal[shownPosition] = index the author wrote
       toShuffled  toShuffled[authorIndex]   = position it is shown at

     Callers compare a click against toOriginal[clicked], and look up any
     index-keyed metadata (wrong, diag) with the same translation. */
  function apply(options, key){
    var n = options.length;
    var identity = { options: options.slice(), toOriginal: [], toShuffled: [] };
    for(var i = 0; i < n; i++){ identity.toOriginal.push(i); identity.toShuffled.push(i); }
    if(n < 2 || isTrueFalse(options)) return identity;

    var free = [], pinned = [];
    for(var j = 0; j < n; j++){
      (PINNED.test(String(options[j])) ? pinned : free).push(j);
    }
    if(free.length < 2) return identity;

    var perm = permutation(free.length, String(key));
    var order = [];
    for(var k = 0; k < free.length; k++) order.push(free[perm[k]]);
    order = order.concat(pinned);

    var out = { options: [], toOriginal: order.slice(), toShuffled: [] };
    out.toShuffled.length = n;
    for(var m = 0; m < order.length; m++){
      out.options.push(options[order[m]]);
      out.toShuffled[order[m]] = m;
    }
    return out;
  }

  /* Remap an object whose keys are option indices ({wrong}, {diag}) onto
     the shuffled positions, so "here is why that specific click is wrong"
     still lands on the option the student actually pressed. */
  function remapByIndex(map, applied){
    if(!map) return map;
    var out = {};
    for(var k in map){
      if(!Object.prototype.hasOwnProperty.call(map, k)) continue;
      var orig = parseInt(k, 10);
      var pos = isNaN(orig) ? k : applied.toShuffled[orig];
      if(pos === undefined) continue;
      out[pos] = map[k];
    }
    return out;
  }

  /* Convenience for the four hand-written mechanism pages, whose choice
     buttons carry the option TEXT rather than an index — nothing there is
     keyed by position, so they only need the reordered list. Falls back to
     the original array if this file somehow did not load, so a missing
     script degrades to the old fixed order rather than an empty step. */
  function list(options, key){
    return (options && options.length) ? apply(options, key).options : options;
  }

  window.OchemShuffle = { apply: apply, remapByIndex: remapByIndex, list: list };
})();
