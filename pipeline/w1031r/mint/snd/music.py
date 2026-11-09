"""ElevenLabs music_v1 score for w1031-03-mirror-mint, composition plan timed to the edit (cuts at 4.02, 8.51, 13.81,
17.16, 23.41, 25.46, lens 28.2, back to the kitchen 33.18, end line 37.07, end 41.72). usage: music.py <out.mp3>"""
import requests, json, sys, subprocess
K = subprocess.run(['bash', '-c', "tr -d ' \\r\\n' < /root/.lpkey/k"], capture_output=True, text=True).stdout
plan = {
 "positive_global_styles": ["gentle cinematic underscore", "felt piano", "warm chamber strings", "soft celesta", "wondrous and curious",
                            "morning kitchen warmth", "light and airy", "high quality mix", "D major"],
 "negative_global_styles": ["vocals", "lyrics", "drum kit", "EDM", "trap", "comedy", "choir", "trailer brass", "corporate pop", "lo-fi"],
 "sections": [
  {"section_name": "morning kitchen", "positive_local_styles": ["soft felt piano motif", "light sustained strings", "curious opening"], "negative_local_styles": ["drums"], "duration_ms": 4020, "lines": []},
  {"section_name": "two smells", "positive_local_styles": ["gentle pizzicato strings", "piano melody", "warm, steady"], "negative_local_styles": ["drums"], "duration_ms": 9790, "lines": []},
  {"section_name": "mirror", "positive_local_styles": ["glassy celesta shimmer", "suspended chord", "wonder"], "negative_local_styles": ["drums"], "duration_ms": 3350, "lines": []},
  {"section_name": "left and right hands", "positive_local_styles": ["playful plucked strings", "light piano answering phrases", "curious"], "negative_local_styles": ["drums"], "duration_ms": 6250, "lines": []},
  {"section_name": "chiral, then the question", "positive_local_styles": ["single soft accent at the start", "held suspension", "then drops to quiet sparse solo piano", "thoughtful"], "negative_local_styles": ["drums"], "duration_ms": 4790, "lines": []},
  {"section_name": "inside the nose", "positive_local_styles": ["soft pulsing pads", "slow rising strings", "mysterious wonder building"], "negative_local_styles": ["drums"], "duration_ms": 4980, "lines": []},
  {"section_name": "mint or rye", "positive_local_styles": ["warm resolution in D major", "piano melody returns with strings", "gentle lift"], "negative_local_styles": ["drums"], "duration_ms": 3890, "lines": []},
  {"section_name": "ending", "positive_local_styles": ["settling", "soft final sustained chord", "fade"], "negative_local_styles": ["drums"], "duration_ms": 4650, "lines": []}
 ]
}
print('total ms', sum(s['duration_ms'] for s in plan['sections']))
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K},
                  json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
print(r.status_code, r.headers.get('content-type'), r.text[:400] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(sys.argv[1], 'wb').write(r.content)
