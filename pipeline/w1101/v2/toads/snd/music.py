import requests, json, sys
K=open('/mnt/user-data/uploads/Downloads/levlprep/elevenlabs_key.txt').read().strip()
G = ["minimal cinematic documentary underscore", "felt piano", "plucked strings pizzicato", "warm sustained strings", "soft ambient pad",
     "sparse and restrained", "made to sit quietly under a narrator", "clean high quality production"]
NEG = ["vocals", "choir", "lyrics", "drum kit", "trap", "EDM", "corporate", "upbeat pop", "ukulele", "loud brass", "epic trailer"]
S = [("morning", 5890, ["warm curious 1930s countryside morning", "gentle plucked strings and felt piano", "light, wondering", "C major"]),
     ("beetles and the plan", 4500, ["a little nibbling tension, then hopeful and a bit playful", "quick soft pizzicato, bouncing plucked strings"]),
     ("out of reach", 4250, ["wry", "the melody stalls and falls short", "deflating"]),
     ("backfire", 3560, ["a wry darker turn", "minor key", "low plucked bass"]),
     ("poison", 4640, ["dark and ominous", "low sustained strings", "a hush as something dies"]),
     ("americas", 4680, ["calm and balanced", "steady warm strings", "order and checks"]),
     ("spreading", 5840, ["a steady pulse that slowly grows", "rising tension", "spreading"]),
     ("millions", 4640, ["ominous swell", "full low strings", "awe at the scale", "minor key"]),
     ("settle", 4420, ["settling", "felt piano melody returns softly", "final sustained chord fading out"])]
for k, extra in {'a': ["playful but serious"], 'b': ["intimate", "nature documentary"], 'c': ["storybook", "gentle irony"]}.items():
    plan = {"positive_global_styles": G + extra, "negative_global_styles": NEG,
            "sections": [{"section_name": n, "positive_local_styles": p, "negative_local_styles": [], "duration_ms": d, "lines": []} for n, d, p in S]}
    r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K},
                      json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
    print(k, r.status_code, r.text[:200] if r.status_code != 200 else '')
    if r.status_code == 200: open(f'music_{k}.mp3', 'wb').write(r.content)
