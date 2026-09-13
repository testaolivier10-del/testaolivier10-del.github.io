/* assets/hub-progress.js — the one level and one streak shared by every course.

   Worth testing because it is the part of the site a user would most obviously
   notice being wrong, and the least likely to announce it: a level that slips,
   a streak that resets at midnight in the wrong timezone, XP that lands in the
   wrong subject. None of that throws. It just quietly tells someone they lost
   a 40-day streak. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function fresh(){
  const b = createBrowser();
  b.load('assets/hub-progress.js');
  return { b, HP: b.window.HubProgress };
}

test('the level curve is the documented one and round-trips', () => {
  const { HP } = fresh();
  // 100 * (n-1)^2 — stated in the source as unchanged from the NREMT curve so
  // migrated users keep the level they had. If this ever changes, it demotes
  // every existing user, so pin it.
  assert.equal(HP.xpForLevel(1), 0);
  assert.equal(HP.xpForLevel(2), 100);
  assert.equal(HP.xpForLevel(5), 1600);
  assert.equal(HP.xpForLevel(20), 36100);

  for(let n = 1; n <= 40; n++){
    const at = HP.xpForLevel(n);
    assert.equal(HP.levelForXp(at), n, `exactly at the level ${n} threshold`);
    if(n > 1) assert.equal(HP.levelForXp(at - 1), n - 1, `one XP short of level ${n}`);
  }
});

test('more XP never means a lower level', () => {
  const { HP } = fresh();
  let last = 1;
  for(let xp = 0; xp <= 40000; xp += 37){
    const lvl = HP.levelForXp(xp);
    assert.ok(lvl >= last, `level fell from ${last} to ${lvl} at ${xp} XP`);
    last = lvl;
  }
});

test('awards accumulate, split by subject, and report a level-up once', () => {
  const { HP } = fresh();
  assert.equal(HP.level(), 1);

  const a = HP.award('nremt', 60);
  assert.equal(a.total, 60);
  assert.equal(a.leveledUp, false, '60 XP is short of level 2');

  const b = HP.award('ochem', 50);
  assert.equal(b.total, 110);
  assert.equal(b.level, 2);
  assert.equal(b.leveledUp, true, 'crossing 100 is a level-up');

  // The next award stays at level 2, so it must not claim another level-up.
  assert.equal(HP.award('ochem', 5).leveledUp, false);

  assert.equal(HP.subjectXp('nremt'), 60);
  assert.equal(HP.subjectXp('ochem'), 55);
  assert.equal(HP.xp().total, 115, 'the shared total is the sum of the subjects');
  assert.equal(HP.subjectXp('physics'), 0, 'a subject with no XP reads as zero, not undefined');
});

test('a negative or junk award cannot take XP away', () => {
  const { HP } = fresh();
  HP.award('nremt', 500);
  HP.award('nremt', -400);
  HP.award('nremt', NaN);
  HP.award('nremt', undefined);
  assert.equal(HP.xp().total, 500);
});

test('levelInfo reports progress within the current level', () => {
  const { HP } = fresh();
  HP.award('nremt', 450);           // level 3 starts at 400, level 4 at 900
  const info = HP.levelInfo('nremt');
  assert.equal(info.level, 3);
  assert.equal(info.total, 450);
  assert.equal(info.into, 50, '50 XP into level 3');
  assert.equal(info.span, 500, 'level 3 spans 400..900');
  assert.equal(info.toNext, 450);
});

test('a streak counts consecutive days and survives a day not yet started', () => {
  const { b, HP } = fresh();
  // Four days running, each recorded on its own day.
  for(let i = 0; i < 4; i++){
    HP.recordActivity('nremt', 5);
    b.advanceDays(1);
  }
  // It is now the fifth day and nothing has been done yet today. Yesterday's
  // four-day run must still stand — a streak that only counts once you have
  // studied today would read as broken every morning.
  assert.equal(HP.streak().current, 4);
  assert.equal(HP.streak().todayCount, 0);

  HP.recordActivity('nremt', 5);
  assert.equal(HP.streak().current, 5, 'studying today extends it');
  assert.equal(HP.streak().todayCount, 5);
});

test('a missed day breaks the streak but not the record of the longest', () => {
  const { b, HP } = fresh();
  for(let i = 0; i < 6; i++){ HP.recordActivity('ochem', 3); b.advanceDays(1); }
  assert.equal(HP.streak().longest, 6);

  b.advanceDays(2);                  // skip two whole days
  assert.equal(HP.streak().current, 0, 'the run is over');

  HP.recordActivity('ochem', 3);
  const s = HP.streak();
  assert.equal(s.current, 1, 'starting again starts at one');
  assert.equal(s.longest, 6, 'the longest run is still on record');
});

test('the daily goal decides metToday, and both subjects count toward it', () => {
  const { HP } = fresh();
  HP.setGoal(10);
  HP.recordActivity('nremt', 6);
  assert.equal(HP.streak().metToday, false);
  HP.recordActivity('ochem', 4);
  const s = HP.streak();
  assert.equal(s.todayCount, 10, 'one shared streak means one shared count');
  assert.equal(s.metToday, true);
});

test('rank titles rise with level and differ by course', () => {
  const { HP } = fresh();
  assert.equal(HP.titleForLevel(1, 'hub'), 'Student');
  assert.equal(HP.titleForLevel(30, 'hub'), 'LevlPrep Legend');
  // The last qualifying entry wins, so a level between thresholds keeps the
  // lower title rather than falling through to nothing.
  assert.equal(HP.titleForLevel(4, 'hub'), 'Regular');
  assert.ok(HP.titleForLevel(10, 'nremt'), 'each course has its own set');
});

test('activity older than the retained window is dropped, not counted', () => {
  const { b, HP } = fresh();
  HP.recordActivity('nremt', 1);
  b.advanceDays(400);
  HP.recordActivity('nremt', 1);
  const days = Object.keys(HP.streak().days);
  assert.ok(days.length < 400, 'the day log is pruned rather than growing forever');
  assert.equal(HP.streak().current, 1);
});
