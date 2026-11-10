import requests, sys
K=open('/root/.lpkey/k').read().strip()
name, dur, text = sys.argv[1], float(sys.argv[2]), sys.argv[3]
r = requests.post('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192', headers={'xi-api-key': K},
                  json={'text': text, 'duration_seconds': dur, 'prompt_influence': 0.5}, timeout=300)
print(name, r.status_code, r.text[:200] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(name + '.mp3', 'wb').write(r.content)
