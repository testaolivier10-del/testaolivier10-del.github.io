"""The rest of the score on a credit budget: one calm teaching bed (looped under teaching beats), one story cue for the
kitchen moments, and the ending; all music_v1, in the intro's key world (felt piano, warm strings)."""
import requests, sys
K = open('/root/.lpkey/k').read().strip()
G = ["intimate documentary score", "felt piano", "warm soft strings", "gentle pads", "late night calm", "restrained", "high quality mix", "instrumental"]
N = ["vocals", "lyrics", "choir", "drum kit", "trap beat", "EDM", "trailer brass", "corporate pop", "comedy"]
PL = {
 'bed': [("settle", ["calm steady felt piano ostinato", "soft pad", "focused and unobtrusive", "moderate tempo"], 30000),
         ("flow", ["same ostinato continues", "light pizzicato joins", "warm low strings", "even dynamics"], 30000),
         ("return", ["ostinato continues", "soft pad swell", "ends so it can loop back to the start", "same key and tempo as the start"], 30000)],
 'story': [("night", ["felt piano melody", "night time stillness", "soft celesta", "curious"], 15000),
           ("work", ["gentle forward motion", "warm strings enter", "a little wonder"], 15000),
           ("reveal", ["building wonder", "strings swell softly", "turn to a warm major chord", "then settle quietly"], 15000)],
 'end': [("goodnight", ["settling", "piano melody returns", "warm strings", "tender"], 14000),
         ("close", ["warm resolution", "soft final sustained chord", "fade to silence"], 16000)],
}
name = sys.argv[1]
plan = dict(positive_global_styles=G, negative_global_styles=N,
            sections=[dict(section_name=n, positive_local_styles=s, negative_local_styles=["drums"], duration_ms=d, lines=[]) for n, s, d in PL[name]])
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K},
                  json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=900)
print(name, r.status_code, r.text[:300] if r.status_code != 200 else len(r.content))
if r.status_code == 200:
    open(f'out/music/{name}.mp3', 'wb').write(r.content)
