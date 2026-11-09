import requests, sys
K = open('/root/.lpkey/k').read().strip()
text, dur, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
r = requests.post('https://api.elevenlabs.io/v1/sound-generation', headers={'xi-api-key': K},
                  json={'text': text, 'duration_seconds': dur, 'prompt_influence': 0.5}, timeout=300)
print(r.status_code, r.text[:200] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(out, 'wb').write(r.content)
