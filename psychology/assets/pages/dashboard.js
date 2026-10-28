/* The AP® Psychology dashboard (docs/dashboard.md): the five-question dashboard of assets/course/dash.js,
   built by assets/course/dash-ap.js from ApPsychCore (the answer records in appsych_progress_v1), the site's shared XP
   and streak (HubProgress), the flashcard schedule (appsych_flashcards_v1) and the free-response self-scores and exam
   history in appsych_prefs_v1. Nothing is stored here.

   Free: what to do next, weekly accuracy with every exam on the same line, coverage of the exam by unit weight, units
   and science practices by what they cost, level and mastery, and in the drawers the panels this page always had (weakest
   topics, mastery by unit and topic, by science practice, exam history, free-response self-scores, the exam-date card and the
   cram kit). Premium (ApPsychCore.allowed('analytics')): mastery by skill and tool accuracy.

   Exam date: assets/exam-date.js counts down to the course's default exam day until the student sets their own
   (appsych_exam_date); the cram kit (cram.html) counts back from the same date. Every bar carries its number as text. */
document.addEventListener('DOMContentLoaded', function(){
  var app = document.getElementById('app');
  var M = window.LevlDashMastery, A = window.ApPsychCore, CU = window.ApPsychCurriculum;
  if(!app || !M || !A || !CU) return;
  var FRQ_TYPES = { aaq: 'Q1: Article Analysis Question', ebq: 'Q2: Evidence-Based Question' };
  function draw(){
    M.ap({ key: 'appsych', cls: 'psy', name: 'AP&reg; Psychology', A: A, CU: CU, base: window.ApPsychBase || '', root: app, tools: window.ApPsychToolList || [],
      band: false, practiceWord: 'science practice', practiceLabel: 'Science practices', frqTypes: FRQ_TYPES,
      skillHint: 'Each science practice splits into skills (6.B: apply a method, showing the steps, and so on). Every question is tagged with the one it exercises.' });
  }
  draw();
  window.addEventListener('storage', function(e){ if(!e.key || /^appsych_|^hub/.test(e.key)) draw(); });
  document.addEventListener('appsych:progress', draw);
});
