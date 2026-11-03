import requests, json, sys
K=open('/mnt/user-data/uploads/Downloads/levlprep/elevenlabs_key.txt').read().strip()
G = ["minimal cinematic documentary underscore", "soft felt piano", "warm sustained string ensemble", "subtle ambient synth pad",
     "sparse and restrained", "made to sit quietly under a narrator", "emotional but understated", "clean high quality production"]
NEG = ["vocals", "choir", "lyrics", "drum kit", "trap", "EDM", "corporate", "upbeat pop", "ukulele", "on hold music", "loud brass", "epic trailer"]
V = {
 'b': ["1940s wartime", "D minor"],
 'c': ["intimate", "melancholic then hopeful", "D minor"],
 'd': ["Hans Zimmer style restraint", "slow pulse", "D minor"],
}
S = [("losses", 7400, ["somber", "low strings and a distant soft timpani roll", "a sense of loss"]),
     ("the count", 7300, ["quiet piano ostinato, steady and methodical", "low strings"]),
     ("the plan", 3750, ["low strings swell slightly", "confident"]),
     ("wald", 9250, ["almost empty", "solo felt piano, a curious questioning melody", "very quiet"]),
     ("engine hits", 4400, ["dark", "low string tremolo", "one soft deep hit at the start"]),
     ("realization", 5800, ["slowly rising strings", "turning from minor toward major", "hope"]),
     ("the fix", 4500, ["warm resolution in D major", "gentle swell, not loud", "strings and piano together"]),
     ("name", 4300, ["settling", "the piano melody returns softly", "final sustained chord fading out"])]
for k, extra in V.items():
    plan = {"positive_global_styles": G + extra, "negative_global_styles": NEG,
            "sections": [{"section_name": n, "positive_local_styles": p, "negative_local_styles": [], "duration_ms": d, "lines": []} for n, d, p in S]}
    r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K},
                      json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
    print(k, r.status_code, r.text[:200] if r.status_code != 200 else '')
    if r.status_code == 200: open(f'music_{k}.mp3', 'wb').write(r.content)
