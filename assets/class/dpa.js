/* The data privacy agreement draft (teach/privacy-agreement.html): print it, and keep what a district typed in
   this browser so a reload does not lose it (levlprep_dpa_draft_v1, never sent anywhere). */
(function(){
  'use strict';
  var KEY = 'levlprep_dpa_draft_v1';
  function boot(){
    var form = document.getElementById('dpaForm'); if(!form) return;
    form.addEventListener('submit', function(e){ e.preventDefault(); });
    var saved = {}; try{ saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }catch(e){}
    form.querySelectorAll('input, textarea').forEach(function(el){
      var k = el.id || (el.name + ':' + el.value);
      if(!(k in saved)) return;
      if(el.type === 'checkbox' || el.type === 'radio') el.checked = !!saved[k]; else el.value = saved[k];
    });
    form.addEventListener('input', function(){
      var out = {};
      form.querySelectorAll('input, textarea').forEach(function(el){ var k = el.id || (el.name + ':' + el.value); out[k] = (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value; });
      try{ localStorage.setItem(KEY, JSON.stringify(out)); }catch(e){}
    });
    var p = document.getElementById('dpaPrint'); if(p) p.addEventListener('click', function(){ window.print(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
