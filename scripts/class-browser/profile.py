"""Browser check of the Profile page (profile.html, docs/progress-profile.md "Profile v2") with a seeded student:
All time numbers, courses that fold, earned and locked badges, the locked note, certificates, no sideways scroll.
Usage: python3 profile.py [shots dir]   with the repo served at http://localhost:8765 and Chrome at /usr/bin/google-chrome."""
import json, sys, time
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:8765'; SHOTS = sys.argv[1] if len(sys.argv) > 1 else None
fails = []
def check(ok, msg):
  print(('PASS ' if ok else 'FAIL ') + msg)
  if not ok: fails.append(msg)
SEED = """async () => {
  const P = await (await fetch('/assets/path/apbio.json')).json();
  const now = Date.now(), lessons = {};
  P.topics.filter(t => (t.u === 0 || t.u === 1) && t.l).forEach(t => lessons[t.id] = now - 5e8);
  P.topics.filter(t => t.u === 2 && t.l).slice(0, 2).forEach(t => lessons[t.id] = now - 1e8);
  const q = {}; for(let i = 0; i < 130; i++) q['bio-x-' + i] = { t: 'water-hydrogen-bonding', u: 'unit-1', n: 2, c: 1, right: 1, seen: now - i * 1e6, l: 'p' };
  localStorage.setItem('apbio_progress_v1', JSON.stringify({ v: 1, q, lessons }));
  localStorage.setItem('apbio_prefs_v1', JSON.stringify({ examHistory: [{ ts: now - 9e8, kind: 'unit', unit: 'unit-1', mcq: { c: 17, n: 20 } }, { ts: now - 2e8, kind: 'full', mcq: { c: 39, n: 60 }, frq: { got: 20, of: 40 } }],
    frqScores: { 'frq-a': { got: 5, of: 9, ts: now }, 'frq-b': { got: 3, of: 4, ts: now } } }));
  const m = {}; for(let i = 0; i < 280; i++) m[i] = { level: 2, timesCorrect: 2, timesWrong: 0, lastSeen: now };
  localStorage.setItem('nremt_mastery', JSON.stringify(m));
  localStorage.setItem('nremt_exam100_history', JSON.stringify([{ date: now - 3e8, score: 78, total: 100 }]));
  const days = {}; const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  for(let i = 0; i < 9; i++){ const d = new Date(now - i * 864e5); days[key(d)] = { apbio: 12, nremt: i < 4 ? 20 : 0 }; }
  for(let i = 30; i < 60; i += 3){ const d = new Date(now - i * 864e5); days[key(d)] = { ochem: 6 }; }
  localStorage.setItem('hub_activity_v1', JSON.stringify({ v: 1, days, longest: 9, goal: 15, goalBase: 15 }));
  localStorage.setItem('hub_xp_v1', JSON.stringify({ v: 1, total: 5180, subjects: { apbio: 2340, nremt: 1880, ochem: 960 }, badges: {} }));
}"""
with sync_playwright() as p:
  b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
  for w in (1280, 390):
    ctx = b.new_context(viewport={'width': w, 'height': 900}); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(BASE + '/profile.html'); pg.wait_for_timeout(600); pg.evaluate(SEED); pg.reload(); pg.wait_for_selector('.pf-cx'); pg.wait_for_timeout(2500)
    tiles = pg.evaluate("() => [...document.querySelectorAll('.pf-all .pf-st')].map(x => x.innerText.replace(/\\n/g, ' '))")
    check(tiles == ['820 questions answered', '3 practice exams taken', '%d lessons finished' % pg.evaluate("() => Object.keys(JSON.parse(localStorage.apbio_progress_v1).lessons).length"), '2 free responses written', '19 days studied'], f'{w}: All time adds every course up ({tiles})')
    cx = pg.evaluate("() => [...document.querySelectorAll('.pf-cx')].map(d => [d.getAttribute('data-cx'), d.open, d.querySelector('.pf-cx-n').textContent])")
    check([c[0] for c in cx] == ['apbio', 'nremt', 'ochem'] and cx[0][1] and not cx[1][1], f'{w}: started courses listed, the one studied last open ({cx})')
    bio = pg.evaluate("() => [...document.querySelectorAll('[data-cxb=apbio] .bds:not(.is-row) .bd b')].map(x => x.textContent)")
    check(bio[:2] == ['Unit 1 complete', 'Unit 2 complete'] and '250 questions' in bio and 'First free response' in bio and '80%+ exam' in bio and '7 days studied' in bio, f'{w}: AP Biology earned badges ({bio})')
    certs = pg.evaluate("() => [...document.querySelectorAll('[data-cxb=apbio] .bd-cert')].map(a => a.getAttribute('href'))")
    check(len(certs) == 2 and all('certificate.html?course=apbio' in c for c in certs), f'{w}: finished units link their certificates')
    n_lock = pg.evaluate("() => document.querySelectorAll('[data-cxb=apbio] .bd-lock').length"); n_all = int(cx[0][2].split(' of ')[1].split(' ')[0])
    check(n_lock + len(bio) == n_all and n_all >= 20, f'{w}: {n_all} badges in the course, {n_lock} locked')
    check(pg.evaluate("() => [...document.querySelectorAll('[data-cxb=apbio] .is-locked')].every(l => !l.querySelector('svg text') && getComputedStyle(l.querySelector('.bd-tip')).display === 'none')"), f'{w}: locked badges show no name until asked')
    hero = pg.inner_text('#pfBadgeN'); check(' of ' in hero and int(hero.split(' of ')[0]) >= len(bio), f'{w}: the top card counts badges ({hero})')
    last = pg.locator('[data-cxb=apbio] .bd-lock').last; last.scroll_into_view_if_needed(); last.click(); pg.wait_for_timeout(150)
    tip = pg.evaluate("() => { const t = document.querySelector('.bd-lock.is-on .bd-tip'); const r = t.getBoundingClientRect(); return [t.innerText, r.left, r.right, innerWidth, getComputedStyle(t).display]; }")
    check(tip[4] == 'block' and tip[1] >= 0 and tip[2] <= tip[3] and len(tip[0]) > 10, f'{w}: tapping a locked badge shows its note inside the window ({tip[0][:50]!r})')
    if SHOTS: pg.screenshot(path=f'{SHOTS}/profile_{w}.png', full_page=True)
    pg.keyboard.press('Escape'); check(not pg.query_selector('.bd-lock.is-on'), f'{w}: Escape closes the note')
    pg.click('[data-cx=nremt] summary'); pg.wait_for_timeout(200)
    nr = pg.evaluate("() => [...document.querySelectorAll('[data-cxb=nremt] .bds:not(.is-row) .bd b')].map(x => x.textContent)")
    check('500 questions' in nr and 'First full exam' in nr and '7-day streak' in nr, f'{w}: NREMT keeps its badges ({nr})')
    pg.reload(); pg.wait_for_selector('.pf-cx'); pg.wait_for_timeout(800)
    check(pg.evaluate("() => document.querySelector('[data-cx=nremt]').open"), f'{w}: an opened course stays open on the next visit')
    check(pg.evaluate("() => document.documentElement.scrollWidth <= innerWidth"), f'{w}: no sideways scroll')
    check(pg.evaluate("() => document.querySelector('.pf-cal').children.length / 7") >= 12, f'{w}: the streak grid is still there')
    check(not errs, f'{w}: no page errors {errs[:1]}')
    ctx.close()
  # a brand new visitor
  ctx = b.new_context(viewport={'width': 1280, 'height': 900}); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
  pg.goto(BASE + '/profile.html'); pg.wait_for_timeout(1500)
  check('Start any course' in pg.inner_text('#pfRoot') and pg.inner_text('#pfBadgeN') == '0' and not errs, f'new visitor: empty state, no errors {errs[:1]}')
  b.close()
print('\n%d failed' % len(fails)); [print(' -', f) for f in fails]
sys.exit(1 if fails else 0)
