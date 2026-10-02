/* Export and import everything this browser remembers about your studying.

   All of it lives in localStorage — XP, level, streak, concept strength, the
   spaced-repetition schedule, exam history, flagged and missed questions, how
   far through each lesson you are. That is what makes the site work without an
   account, and it is also the whole risk: localStorage is per-browser and
   per-device, and it is the first thing "clear browsing data" removes. Months
   of scheduling can disappear to a routine bit of housekeeping, with no
   warning and nothing to restore from.

   Signing in syncs some of it. Not everyone signs in, and the sync covers XP
   and streak rather than every last per-question record, so this exists
   regardless: a plain JSON file, readable, that you keep.

   What is deliberately NOT in the file:
     - the Supabase session token (sb_*). It is a live credential. Writing it
       into a file someone might email themselves or drop in a shared folder
       would turn a backup into an account handover.
     - the assistant's answer cache, which is a cache: large, regenerable,
       and meaningless on another device.
     - hub_sync_reloaded, a one-shot flag that guards against a reload loop.
       Restored onto a fresh browser it means nothing; restored at the wrong
       moment it suppresses a reload that should happen. */
(function(){
  var FORMAT = 'levlprep-progress';
  var VERSION = 1;

  /* An allow-list, not a deny-list. A deny-list would quietly start exporting
     whatever a future feature happens to store — including, eventually,
     something that should not leave the device. Anything new has to be added
     here on purpose. */
  var PREFIXES = ['hub_', 'nremt_', 'ochem_', 'anp_'];
  var EXACT = ['levl_sound', 'levlprep_analytics_opt_out', 'levlprep_ai_met'];
  var EXCLUDE = ['hub_sync_reloaded'];

  function included(key){
    if(EXCLUDE.indexOf(key) !== -1) return false;
    if(EXACT.indexOf(key) !== -1) return true;
    for(var i = 0; i < PREFIXES.length; i++){
      if(key.indexOf(PREFIXES[i]) === 0) return true;
    }
    return false;
  }

  /* Everything worth keeping, as a plain object. Values are kept as the exact
     strings localStorage holds rather than parsed into objects: half of them
     are JSON and half are bare strings ('dark', 'on'), and round-tripping
     through a parse would have to guess which, then guess back. A string is
     a string. */
  function snapshot(){
    var data = {};
    var count = 0;
    try {
      for(var i = 0; i < localStorage.length; i++){
        var key = localStorage.key(i);
        if(!included(key)) continue;
        data[key] = localStorage.getItem(key);
        count++;
      }
    } catch(e){ return null; }
    return {
      format: FORMAT,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      site: location.origin,
      keys: count,
      data: data
    };
  }

  /* A filename with the date in it, because the first thing anyone does with
     two backups is try to tell them apart. */
  function filename(){
    return 'levlprep-progress-' + new Date().toISOString().slice(0, 10) + '.json';
  }

  function download(){
    var snap = snapshot();
    if(!snap) return { ok: false, error: 'This browser will not let the site read its own saved data.' };
    if(!snap.keys) return { ok: false, error: 'There is nothing saved on this browser yet.' };

    var blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoked on a timer rather than immediately: Safari has historically
    // torn the download out from under itself when the URL is revoked in the
    // same tick as the click.
    setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
    return { ok: true, keys: snap.keys };
  }

  /* Validates before it touches anything. An import that half-applies is
     worse than one that refuses: the half it wrote cannot be told from the
     progress it overwrote. */
  function parse(text){
    var obj;
    try { obj = JSON.parse(text); }
    catch(e){ return { ok: false, error: 'That file is not valid JSON.' }; }

    if(!obj || typeof obj !== 'object' || Array.isArray(obj)){
      return { ok: false, error: 'That file is not a LevlPrep backup.' };
    }
    if(obj.format !== FORMAT){
      return { ok: false, error: 'That file is not a LevlPrep backup.' };
    }
    if(typeof obj.version !== 'number' || obj.version > VERSION){
      return { ok: false, error: 'That backup was made by a newer version of the site than this one.' };
    }
    if(!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)){
      return { ok: false, error: 'That backup has no data in it.' };
    }

    var clean = {};
    var kept = 0, dropped = 0;
    for(var key in obj.data){
      if(!Object.prototype.hasOwnProperty.call(obj.data, key)) continue;
      var value = obj.data[key];
      // The same allow-list the export used, applied again on the way in. The
      // file came off a disk and could say anything; a backup must not be a
      // way to write arbitrary keys into the site's storage.
      if(!included(key) || typeof value !== 'string'){ dropped++; continue; }
      clean[key] = value;
      kept++;
    }
    if(!kept) return { ok: false, error: 'That backup has no LevlPrep data in it.' };
    return { ok: true, data: clean, kept: kept, dropped: dropped, exportedAt: obj.exportedAt || null };
  }

  /* ---- merging a backup into what is already here ---------------------

     A restore used to clear every key and write the file's copy in its place.
     That is right only when the file is newer than everything on the device;
     restore a month-old backup onto a browser you have studied on since and it
     quietly deleted the month. So a restore MERGES, the way account.js
     reconciles a synced copy with the local one (same code):

       - a key only one side has is kept;
       - a key with a merge rule registered with StudyHubAccount (flashcard
         schedules, the ochem read map) uses that rule, exactly as a sync does;
       - otherwise two JSON values merge structurally: numbers take the larger
         (XP, counts, bests), arrays take the union (attempts, missed and
         flagged questions), dates take the later, an object that carries its
         own timestamp (t, ts, updatedAt, day...) is taken whole from the side
         that touched it last, and any other object merges key by key;
       - what is left (two different settings, two different in-progress
         exams) is a CONFLICT. A conflict goes to whichever side was studied on
         more recently (the later day in hub_activity_v1); the caller can
         override that after asking the person. */

  /* The rules themselves live in account.js (StudyHubAccount.mergeRaw), the
     one merge both a sync and a restore use, so the two cannot drift apart.
     Every page that offers a restore also loads account.js; without it a
     restore still never deletes, it just keeps one side of each key that
     both have. */
  function mergeRaw(key, localRaw, backupRaw, prefer){
    if(localRaw === null || localRaw === undefined) return { value: backupRaw, conflict: false };
    if(localRaw === backupRaw) return { value: localRaw, conflict: false };
    var acct = window.StudyHubAccount;
    if(acct && typeof acct.mergeRaw === 'function') return acct.mergeRaw(key, localRaw, backupRaw, prefer === 'backup' ? 'other' : 'local');
    return { value: prefer === 'backup' ? backupRaw : localRaw, conflict: true };
  }

  // The latest day anybody studied, from the shared activity record.
  function lastStudied(raw){
    try {
      var s = JSON.parse(raw);
      var days = s && s.days ? Object.keys(s.days).sort() : [];
      return days.length ? days[days.length - 1] : '';
    } catch(e){ return ''; }
  }

  /* What a restore would do, without doing it. prefer settles conflicts:
     'local', 'backup', or anything else for the side studied on more
     recently (ties keep this browser's). */
  function plan(text, prefer){
    var parsed = parse(text);
    if(!parsed.ok) return parsed;
    var local = {};
    try {
      for(var i = 0; i < localStorage.length; i++){
        var key = localStorage.key(i);
        if(included(key)) local[key] = localStorage.getItem(key);
      }
    } catch(e){
      return { ok: false, error: 'This browser will not let the site read its own saved data.' };
    }
    var localDay = lastStudied(local.hub_activity_v1);
    var backupDay = lastStudied(parsed.data.hub_activity_v1);
    var newer = backupDay > localDay ? 'backup' : 'local';
    if(prefer !== 'local' && prefer !== 'backup') prefer = newer;

    var writes = {}, added = 0, merged = 0, unchanged = 0, conflicts = [];
    for(var k in parsed.data){
      if(!Object.prototype.hasOwnProperty.call(parsed.data, k)) continue;
      var had = Object.prototype.hasOwnProperty.call(local, k);
      var r = mergeRaw(k, had ? local[k] : null, parsed.data[k], prefer);
      if(r.conflict) conflicts.push(k);
      if(had && r.value === local[k]){ unchanged++; continue; }
      writes[k] = r.value;
      if(had) merged++; else added++;
    }
    return {
      ok: true, writes: writes, added: added, merged: merged, unchanged: unchanged,
      conflicts: conflicts, prefer: prefer, newer: newer,
      localDay: localDay, backupDay: backupDay,
      kept: parsed.kept, dropped: parsed.dropped, exportedAt: parsed.exportedAt
    };
  }

  /* Merges the file into this browser's progress (see above). Nothing on this
     browser that the file lacks is removed, and every write is worked out
     before the first one happens. */
  function restore(text, prefer){
    var p = plan(text, prefer);
    if(!p.ok) return p;
    try {
      for(var k in p.writes){
        if(Object.prototype.hasOwnProperty.call(p.writes, k)) localStorage.setItem(k, p.writes[k]);
      }
    } catch(e){
      return { ok: false, error: 'This browser refused to save the restored data. It may be full, or storage may be blocked.' };
    }
    p.written = Object.keys(p.writes).length;
    return p;
  }

  window.LevlBackup = {
    snapshot: snapshot,
    download: download,
    parse: parse,
    restore: restore,
    plan: plan,
    _mergeRaw: mergeRaw,
    filename: filename,
    included: included
  };
})();
