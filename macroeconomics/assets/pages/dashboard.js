/* The AP® Macroeconomics dashboard (docs/dashboard.md): the five-question dashboard of assets/course/dash.js,
   built by assets/course/dash-ap.js from ApMacroCore (the answer records in apmacro_progress_v1), the site's shared XP
   and streak (HubProgress), the flashcard schedule (apmacro_flashcards_v1) and the free-response self-scores and exam
   history in apmacro_prefs_v1. Nothing is stored here.

   Free: what to do next, weekly accuracy with every exam on the same line, coverage of the exam by unit weight, units
   and skill categories by what they cost, level and mastery, and in the drawers the panels this page always had (weakest
   topics, mastery by unit and topic, by skill category, exam history, free-response self-scores, the exam-date card and the
   cram kit). Premium (ApMacroCore.allowed('analytics')): mastery by skill and tool accuracy.

   Exam date: assets/exam-date.js counts down to the course's default exam day until the student sets their own
   (apmacro_exam_date); the cram kit (cram.html) counts back from the same date. Every bar carries its number as text. */
document.addEventListener('DOMContentLoaded', function(){
  var app = document.getElementById('app');
  var M = window.LevlDashMastery, A = window.ApMacroCore, CU = window.ApMacroCurriculum;
  if(!app || !M || !A || !CU) return;
  var FRQ_TYPES = { long: 'Long free-response question', short: 'Short free-response question' };
  function draw(){
    M.ap({ key: 'apmacro', cls: 'mac', name: 'AP&reg; Macroeconomics', A: A, CU: CU, base: window.ApMacroBase || '', root: app, tools: window.ApMacroToolList || [],
      band: false, practiceWord: 'skill category', practiceLabel: 'Skill categories', frqTypes: FRQ_TYPES,
      skillHint: 'Each skill category splits into skills (1.A, 1.B and so on). Every question is tagged with the one it exercises.' });
  }
  draw();
  window.addEventListener('storage', function(e){ if(!e.key || /^apmacro_|^hub/.test(e.key)) draw(); });
  document.addEventListener('apmacro:progress', draw);
});
