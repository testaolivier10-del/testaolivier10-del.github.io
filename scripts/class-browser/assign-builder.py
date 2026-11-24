"""Browser checks for the 2026-11-23 assignment changes (docs/teacher-classes.md "Locked assignments"):
the teacher builder: Which questions (same, different, hand-picked), its defaults and what it saves.
Usage: python3 assign-builder.py [args]   with the repo served at http://localhost:8765 and Chrome at /usr/bin/google-chrome."""
import json,sys,time
from playwright.sync_api import sync_playwright
BASE='http://localhost:8765'; fails=[]
def check(ok,msg):
  print(('PASS ' if ok else 'FAIL ')+msg)
  if not ok: fails.append(msg)
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
  for w in (1280,390):
    ctx=b.new_context(viewport={'width':w,'height':1000}); pg=ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(f'{BASE}/teach/?demo=1#assign'); pg.wait_for_selector('#lvtAssign', timeout=20000); pg.wait_for_timeout(800)
    saved=[]
    pg.evaluate("() => { const c=window.LevlTeachDemo.call; window.__saved=[]; window.LevlTeachDemo.call=function(n,a){ if(n==='teach_save_assignment') window.__saved.push(JSON.parse(JSON.stringify(a))); return c.apply(this,arguments); }; }")
    pressed=lambda: pg.evaluate("() => { const b=document.querySelector('[data-qmode][aria-pressed=true]'); return b&&b.getAttribute('data-qmode'); }")
    check(pressed()=='same', f'{w}: required practice starts on Same for everyone')
    pg.click('[data-req="0"]'); check(pressed()=='own', f'{w}: optional practice starts on Different for each student')
    pg.click('[data-req="1"]')
    # topics
    pg.click('details[data-ms="topics"] summary'); boxes=pg.query_selector_all('[data-topic]'); t0=boxes[0].get_attribute('data-topic'); pg.click(f'[data-topic="{t0}"]'); pg.wait_for_timeout(200)
    txt=pg.inner_text('#lvtAssign'); check('These topics have' in txt, f'{w}: the builder says how many questions the topics have')
    pg.keyboard.press('Escape'); pg.mouse.click(5,5)
    pg.click('[data-qmode="pick"]'); pg.wait_for_timeout(1500)
    n=len(pg.query_selector_all('[data-pickq]')); check(n>=3, f'{w}: I will pick them lists the topic\'s questions ({n})')
    for i in range(3): pg.query_selector_all('[data-pickq]')[i*2 if n>5 else i].click(); pg.wait_for_timeout(150)
    lab=pg.inner_text('details[data-ms="pickq"] summary'); check('3 questions picked' in lab, f'{w}: the count of picked questions shows ({lab.strip()[:40]})')
    sm=pg.inner_text('.pp-sumcard'); check('3 questions' in sm, f'{w}: the summary counts the picked questions')
    pg.click('#lvtAssign button[type=submit]'); pg.wait_for_timeout(1200)
    s=pg.evaluate("() => window.__saved"); c=(s[-1]['p_data']['spec'].get('controls') if s else None) or {}
    check(bool(s) and c.get('same') is True and len(c.get('pick',[]))==3 and s[-1]['p_data']['spec']['count']==3, f'{w}: saved with the three picked questions ({json.dumps(c)[:120]})')
    # exam: same by default; mastery and review say why not
    pg.goto(f'{BASE}/teach/?demo=1#assign'); pg.reload(); pg.wait_for_selector('#lvtAssign'); pg.wait_for_timeout(600)
    pg.click('[data-kind="exam"]'); check(pressed()=='same' and not pg.query_selector('[data-qmode="pick"]'), f'{w}: an exam starts on Same for everyone, with no hand picking')
    pg.click('[data-kind="mastery"]'); check(not pg.query_selector('[data-qmode]') and 'Mastery follows each student' in pg.inner_text('#lvtAssign'), f'{w}: mastery explains why it is different for each student')
    pg.click('[data-kind="review"]'); check(not pg.query_selector('[data-qmode]') and 'own missed questions' in pg.inner_text('#lvtAssign'), f'{w}: review explains why')
    sw=pg.evaluate("() => document.documentElement.scrollWidth - window.innerWidth"); check(sw<=1, f'{w}: no sideways scroll ({sw})')
    check(not errs, f'{w}: no page errors {errs[:1]}')
    ctx.close()
  # a course without a runner keeps its note and has no control
  ctx=b.new_context(viewport={'width':1280,'height':1000}); pg=ctx.new_page(); pg.goto(f'{BASE}/teach/?demo=1&course=nremt#assign'); pg.wait_for_selector('#lvtAssign'); pg.wait_for_timeout(600)
  check(not pg.query_selector('[data-qmode]'), 'nremt: no Which questions control where controls do not run')
  ctx.close(); b.close()
print('\n%d failed'%len(fails)); [print(' -',f) for f in fails]
