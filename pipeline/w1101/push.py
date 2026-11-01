import json, shutil, os, datetime
M = '/tmp/m'; W = '/home/claude/lp/w1101'
items = json.load(open(f'{W}/items.json'))
order = ['w1101-01-bomber-holes', 'w1101-02-guard-faint', 'w1101-04-cane-toads', 'w1101-03-speed-camera']
by = {i['id']: i for i in items}
q = json.load(open(f'{M}/queue.json'))
have = {i['id'] for i in q['items']}
os.makedirs(f'{M}/videos', exist_ok=True); os.makedirs(f'{M}/thumbs', exist_ok=True)
for k in order:
    shutil.copy(f'{W}/out/{k}/final.mp4', f'{M}/videos/{k}.mp4')
    shutil.copy(f'{W}/out/{k}/thumb_a.png', f'{M}/thumbs/{k}.png')
    if k in have: continue
    i = by[k]
    it = dict(id=k, status='pending', added_on='2026-11-01', date=None, tiktok_caption=i['tiktok_caption'], yt_title=i['yt_title'],
              yt_description=i['yt_description'], badge=i['badge'], hook=i['hook'], search_phrase=i['search_phrase'], yt_no_hashtags=True,
              buffer=None, yt_buffer=None, youtube_id=None, shorts_thumb=False, thumb_v2=True, cta=i['cta'], related_video=None, related_set=False,
              pin_question=i['pin_question'])
    if i.get('manual'):
        it['manual'] = True; it['poll'] = i['poll']
    q['items'].append(it)
json.dump(q, open(f'{M}/queue.json', 'w'), indent=1, ensure_ascii=False)
o = json.load(open(f'{M}/ops.json'))
ids = {c['id'] for c in o.get('community', [])}
for c in [dict(id='cp-w1101-poll', date='2026-11-03', kind='poll', text="Be honest. Ever studied for hours and then blanked on the test?", options=['Yes', 'Every time', 'Never'], image=None, status='pending'),
          dict(id='cp-w1101-bleeding', date='2026-11-06', kind='teaser', text="Tourniquet, direct pressure or packing: which one comes first for a bad bleed? The full bleeding control video walks through all three, step by step, with the mistakes that make each one fail. https://levlprep.com/nremt/notes/bleeding-control.html?ref=yt-cp-bleeding", options=None, image='community/cp-w1101-bleeding.png', status='pending')]:
    if c['id'] not in ids: o.setdefault('community', []).append(c)
o['notes'].append("2026-11-01 weekly batch: analytics done (TikTok, YouTube, Supabase, Umami, Search Console; Bing not signed in). Built w1101 (4 Shorts, all code, no Gemini reference: Figma AI credits out until 5pm PT and the Gemini page refused screenshots). Grease fire Short has youtube_id Q326OU1DRUs (left for the daily run to record with its thumbnail and pin steps). No search PR (waiting on Olivier's fix choice). Two Community post drafts pending.")
json.dump(o, open(f'{M}/ops.json', 'w'), indent=1, ensure_ascii=False)
print('queue', len(q['items']))
