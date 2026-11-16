import requests, sys
K=open('/root/.lpkey/k').read().strip()
N=["drums"]
plan = {
 "positive_global_styles": ["sparse cinematic documentary score", "cold", "solo cello and low strings", "felt piano single notes", "distant muted brass", "1950s London fog", "serious, restrained", "high quality mix"],
 "negative_global_styles": ["vocals", "lyrics", "drum kit", "EDM", "trap beat", "comedy", "lo-fi", "trailer hits", "horror stingers", "whoosh", "riser"],
 "sections": [
  {"section_name": "a man in the fog with a flare", "positive_local_styles": ["very quiet low string drone", "a slow felt piano figure of three notes", "uneasy, watchful", "D minor"], "negative_local_styles": N, "duration_ms": 6900, "lines": []},
  {"section_name": "where is it coming from", "positive_local_styles": ["a questioning cello line", "slowly climbing", "sparse piano", "curious but grave"], "negative_local_styles": N, "duration_ms": 8700, "lines": []},
  {"section_name": "a normal night", "positive_local_styles": ["lighter, open", "high soft strings", "air and space", "gentle rising piano notes"], "negative_local_styles": N, "duration_ms": 5600, "lines": []},
  {"section_name": "the lid settles", "positive_local_styles": ["the warmth drains away", "a single deep low note lands and holds", "heavy, pressing down", "dark low strings"], "negative_local_styles": N, "duration_ms": 5200, "lines": []},
  {"section_name": "trapped", "positive_local_styles": ["static suspended low chord", "no melody", "slow close cluster in the strings", "airless"], "negative_local_styles": N, "duration_ms": 6700, "lines": []},
  {"section_name": "five days", "positive_local_styles": ["a slow tolling low piano note", "solemn", "very sparse", "mourning cello"], "negative_local_styles": N, "duration_ms": 6400, "lines": []},
  {"section_name": "still out in front", "positive_local_styles": ["a small warm cello phrase", "quiet resolve", "resolves gently", "final sustained soft chord"], "negative_local_styles": N, "duration_ms": 5000, "lines": []}
 ]
}
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K}, json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
print(r.status_code, r.text[:300] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(sys.argv[1], 'wb').write(r.content)
