/* The AP® Biology dashboard (docs/dashboard.md): the five-question dashboard of assets/course/dash.js,
   built by assets/course/dash-ap.js from ApBioCore (the answer records in apbio_progress_v1), the site's shared XP
   and streak (HubProgress), the flashcard schedule (apbio_flashcards_v1) and the free-response self-scores and exam
   history in apbio_prefs_v1. Nothing is stored here.

   Free: what to do next, weekly accuracy with every exam on the same line, coverage of the exam by unit weight, units
   and science practices by what they cost, level and mastery, and in the drawers the panels this page always had (weakest
   topics, mastery by unit and topic, by science practice, exam history, free-response self-scores, the exam-date card and the
   cram kit). Premium (ApBioCore.allowed('analytics')): mastery by skill and tool accuracy.

   Exam date: assets/exam-date.js counts down to the course's default exam day until the student sets their own
   (apbio_exam_date); the cram kit (cram.html) counts back from the same date. Every bar carries its number as text. */
document.addEventListener('DOMContentLoaded', function(){
  var app = document.getElementById('app');
  var M = window.LevlDashMastery, A = window.ApBioCore, CU = window.ApBioCurriculum;
  if(!app || !M || !A || !CU) return;
  var FRQ_TYPES = { iee: 'Experimental results (long)', 'iee-graph': 'Experimental results, graphing (long)', investigation: 'Scientific investigation', conceptual: 'Conceptual analysis', model: 'Analyze a model', data: 'Analyze data' };
  function draw(){
    M.ap({ key: 'apbio', cls: 'bio', name: 'AP&reg; Biology', A: A, CU: CU, base: window.ApBioBase || '', root: app, tools: window.ApBioToolList || [],
      band: true, practiceWord: 'science practice', practiceLabel: 'Science practices', frqTypes: FRQ_TYPES,
      skillHint: 'Each science practice splits into skills (4.B: describe data from a table or graph, and so on). Every question is tagged with the one it exercises.' });
  }
  draw();
  window.addEventListener('storage', function(e){ if(!e.key || /^apbio_|^hub/.test(e.key)) draw(); });
  document.addEventListener('apbio:progress', draw);
});
