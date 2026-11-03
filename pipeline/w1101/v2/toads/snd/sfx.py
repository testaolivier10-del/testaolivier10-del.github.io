import requests, os
K=open('/mnt/user-data/uploads/Downloads/levlprep/elevenlabs_key.txt').read().strip()
L = {
 'amb_cane': ("A sugar cane field on a warm morning: light breeze rustling tall cane leaves, insects buzzing softly, a few distant birds, no music", 10),
 'amb_night': ("A quiet country road at night: many cane toads and frogs calling, crickets, a faint warm breeze, no music, no cars", 10),
 'crate_out': ("A wooden crate lid creaks open and is set down, then several heavy toads plop out one after another onto soft dirt", 4),
 'tongue': ("A toad's tongue snapping out to catch an insect, a quick wet flick and gulp, close up", 2),
 'snake': ("A snake strikes fast with a sharp hiss and a thud of the strike, then silence", 3),
 'car_pass': ("A 1960s car passing slowly on a country road at night, engine hum approaching then fading away", 5),
}
for name, (txt, d) in L.items():
    if os.path.exists(name + '.mp3'): continue
    r = requests.post('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192', headers={'xi-api-key': K},
                      json={'text': txt, 'duration_seconds': d, 'prompt_influence': 0.5}, timeout=300)
    print(name, r.status_code, '' if r.status_code == 200 else r.text[:200])
    if r.status_code == 200: open(name + '.mp3', 'wb').write(r.content)
r = requests.post('https://api.elevenlabs.io/v1/speech-to-text', headers={'xi-api-key': K}, files={'file': open('music_b.mp3', 'rb')},
                  data={'model_id': 'scribe_v1', 'tag_audio_events': 'true'}, timeout=300)
print('music_b transcript:', repr(r.json().get('text'))[:200])
