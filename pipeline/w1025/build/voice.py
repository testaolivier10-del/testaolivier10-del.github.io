"""Voice one Short as ONE ElevenLabs take (Jeremy, eleven_v3) and write words.json in DISPLAY words.
Spoken respellings: SPOKEN maps a display word (punctuation kept) to its spoken form."""
import json, sys, base64, subprocess, re, os, time
sys.path.insert(0, '/home/claude/runner')
VOICE = '5gaEGrWSk4v20HMfIhgC'
SPOKEN = {"EMTs": "E M Ts", "levlprep": "levl prep"}
vid = sys.argv[1]
beats = json.load(open('/home/claude/w1025/scripts.json'))[vid]
disp_words, spoken_parts = [], []
for _, line in beats:
    for w in line.split():
        core = re.sub(r"[^A-Za-z]", "", w)
        sp = w.replace(core, SPOKEN[core]) if core in SPOKEN else w
        disp_words.append((w, len(sp.split())))
        spoken_parts.append(sp)
text = ' '.join(spoken_parts)
out = f'/home/claude/w1025/out/{vid}'; os.makedirs(out, exist_ok=True)
body = {'text': text, 'model_id': 'eleven_v3', 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75}}
json.dump(body, open(f'{out}/body.json', 'w'))
key = open('/root/.lpkey/k').read().strip()
for k in range(3):
    r = subprocess.run(['curl', '-s', '-w', '%{http_code}', '-X', 'POST', '-H', f'xi-api-key: {key}', '-H', 'Content-Type: application/json',
                        '--data', f'@{out}/body.json', f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps', '-o', f'{out}/el_raw.json'],
                       capture_output=True, text=True)
    if r.stdout.strip() == '200': break
    print('http', r.stdout, 'retry'); time.sleep(30)
d = json.load(open(f'{out}/el_raw.json'))
open(f'{out}/voice.mp3', 'wb').write(base64.b64decode(d['audio_base64']))
import timing
sw = timing.words_from_alignment(d['alignment'])
assert len(sw) == sum(n for _, n in disp_words), (len(sw), sum(n for _, n in disp_words))
words, i = [], 0
for w, n in disp_words:
    words.append((w, sw[i][1], sw[i + n - 1][2])); i += n
json.dump(words, open(f'{out}/words.json', 'w'))
print(vid, 'chars', len(text), 'dur', round(words[-1][2], 2))
