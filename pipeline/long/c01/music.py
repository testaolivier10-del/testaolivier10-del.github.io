"""ElevenLabs music_v1 score, one composition per chapter, sections timed to the edit (premium standard, video standard 6).
python3 music.py <chapter> [take]  -> out/music/<chapter>_<take>.mp3"""
import json, sys, requests
import tl
K = open('/root/.lpkey/k').read().strip()
T = tl.build()
B = T['beats']
GLOBAL = ["intimate documentary score", "felt piano", "warm soft strings", "gentle pads", "late night kitchen calm", "curious and warm",
          "restrained", "high quality mix", "instrumental"]
NEG = ["vocals", "lyrics", "choir", "drum kit", "trap beat", "EDM", "trailer brass", "corporate pop", "comedy", "lo-fi hiss"]
STORY = ["felt piano melody", "soft celesta", "warm strings", "night time wonder"]
TEACH = ["calm steady felt piano ostinato", "soft pad bed", "light pizzicato", "focused, unobtrusive"]
PRACT = ["sparse", "suspended chords", "quiet thinking", "very soft"]
ANS = ["gentle resolution", "warm major chords", "soft"]


def kind(k):
    b = next(x for ch in __import__('c01_script').CHAPTERS for x in ch['beats'] if x['key'] == k)
    if b.get('story'): return 'story'
    if k.endswith('q'): return 'q'
    if k.endswith('a'): return 'a'
    return 'teach'


def plan(chap):
    segs = [s for s in T['segs'] if s['chapter'] == chap and s['kind'] in ('beat', 'card')]
    keys = [s['key'] for s in segs if s['kind'] == 'beat']
    t0 = min(s['t0'] for s in segs)
    nxt = [s['t0'] for s in T['segs'] if s['t0'] > max(s2['t1'] for s2 in segs) + 0.01]
    t1 = min(nxt) if nxt else T['DUR']
    secs = []
    for i, k in enumerate(keys):
        a = B[k]['t0'] if i else t0
        b = B[keys[i + 1]]['t0'] if i + 1 < len(keys) else t1
        kd = kind(k)
        st = {'story': STORY, 'teach': TEACH, 'q': PRACT, 'a': ANS}[kd][:]
        if k == 'hook': st = ["opens on a single soft piano note", "night stillness", "curious, a question hanging", "felt piano"]
        if k == 'promise': st = ["sense of wonder", "celesta sparkle", "rising gently"]
        if k in ('s9',): st = ["building wonder", "strings swell softly", "turn to a warm major chord on the reveal"]
        if k == 'end': st = ["settling", "piano melody returns", "warm resolution", "soft final sustained chord"]
        if k == 'rc': st = ["warm summary", "steady piano", "gentle strings"]
        secs.append(dict(section_name=k, positive_local_styles=st, negative_local_styles=["drums"], duration_ms=int(max(3000, (b - a) * 1000)), lines=[]))
    # music_v1 sections must be at most 120 s; merge too long ones never happen here
    return dict(positive_global_styles=GLOBAL, negative_global_styles=NEG, sections=secs), t0, t1


if __name__ == '__main__':
    chap = sys.argv[1]; take = sys.argv[2] if len(sys.argv) > 2 else 'a'
    p, t0, t1 = plan(chap)
    print(chap, round(t0, 1), round(t1, 1), sum(s['duration_ms'] for s in p['sections']) / 1000, len(p['sections']))
    if '--dry' in sys.argv: sys.exit()
    r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K},
                      json={'composition_plan': p, 'model_id': 'music_v1'}, timeout=900)
    print(r.status_code, r.text[:300] if r.status_code != 200 else len(r.content))
    if r.status_code == 200:
        open(f'out/music/{chap}_{take}.mp3', 'wb').write(r.content)
        json.dump(dict(t0=t0, t1=t1), open(f'out/music/{chap}_{take}.json', 'w'))
