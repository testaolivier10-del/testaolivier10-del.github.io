import requests, os
K=open('/mnt/user-data/uploads/Downloads/levlprep/elevenlabs_key.txt').read().strip()
G = ["minimal cinematic documentary underscore", "soft felt piano", "warm sustained string ensemble", "subtle ambient synth pad",
     "sparse and restrained", "made to sit quietly under a narrator", "emotional but understated", "clean high quality production"]
NEG = ["vocals", "choir", "lyrics", "drum kit", "trap", "EDM", "corporate", "upbeat pop", "ukulele", "on hold music", "loud brass", "epic trailer", "military march snare"]
S = [("heat", 7140, ["still and waiting", "hot summer stillness", "a soft held string chord", "sparse piano notes"]),
     ("climb", 8320, ["curious", "a slow rising piano line", "soft strings"]),
     ("pump", 9320, ["a gentle steady pulse like a heartbeat in the low strings", "warm", "piano ostinato"]),
     ("frozen", 3280, ["the pulse stops", "suspended", "a single held note"]),
     ("fading and fall", 7540, ["darker", "slowly descending", "tension", "muffled, like hearing fading", "ends on one soft low hit then near silence"]),
     ("keep going", 7840, ["a warm turn to major", "the gentle pulse returns", "reassuring resolution", "soft final chord"])]
V = {'a': ["E minor"], 'b': ["intimate", "E minor"], 'c': ["gentle", "A minor"]}
for k, extra in V.items():
    if os.path.exists(f'music_{k}.mp3'): continue
    plan = {"positive_global_styles": G + extra, "negative_global_styles": NEG,
            "sections": [{"section_name": n, "positive_local_styles": p, "negative_local_styles": [], "duration_ms": d, "lines": []} for n, d, p in S]}
    r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K},
                      json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
    print(k, r.status_code, r.text[:200] if r.status_code != 200 else '')
    if r.status_code == 200: open(f'music_{k}.mp3', 'wb').write(r.content)
L = {
 'parade_amb': ("Outdoor parade ground on a hot still summer morning, light warm air, a large crowd murmuring quietly far away behind a rope, a flag flapping softly, no music", 10),
 'gravel_fall': ("A man in a heavy uniform collapses stiffly forward and hits a gravel parade ground, one heavy thud with gravel crunch and a soft scatter of small stones", 3),
 'heartbeat': ("Two slow muffled heartbeats, deep and soft, as if heard from inside the body", 3),
 'boot_creak': ("Polished leather boots creaking softly as a standing soldier shifts his weight and flexes his toes, close up, quiet", 3),
}
for name, (txt, d) in L.items():
    if os.path.exists(name + '.mp3'): continue
    r = requests.post('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192', headers={'xi-api-key': K},
                      json={'text': txt, 'duration_seconds': d, 'prompt_influence': 0.5}, timeout=300)
    print(name, r.status_code, '' if r.status_code == 200 else r.text[:200])
    if r.status_code == 200: open(name + '.mp3', 'wb').write(r.content)
