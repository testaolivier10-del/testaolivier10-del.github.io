import requests, sys
K=open('/root/.lpkey/k').read().strip()
plan = {
 "positive_global_styles": ["cinematic documentary score", "pizzicato strings", "felt piano", "soft marimba", "curious and warm, a little tense", "small town morning", "high quality mix"],
 "negative_global_styles": ["vocals", "lyrics", "drum kit", "EDM", "trap beat", "comedy", "lo-fi", "trailer brass", "horror stingers", "risers", "whoosh"],
 "sections": [
  {"section_name": "the line and the choice", "positive_local_styles": ["light worried pizzicato ostinato", "single felt piano notes", "a question hanging", "A minor", "moderate tempo"], "negative_local_styles": ["drums"], "duration_ms": 8200, "lines": []},
  {"section_name": "inside the vault, the example", "positive_local_styles": ["quiet and curious", "soft marimba pattern", "muted low strings", "explaining, steady pulse", "cool and spacious"], "negative_local_styles": ["drums"], "duration_ms": 12700, "lines": []},
  {"section_name": "a normal day", "positive_local_styles": ["lighter, easy stride", "pizzicato and marimba in a major key", "calm"], "negative_local_styles": ["drums"], "duration_ms": 4500, "lines": []},
  {"section_name": "the run", "positive_local_styles": ["urgent fast string ostinato building", "low piano accents", "tension rising then a sudden stop on an empty held low note"], "negative_local_styles": ["drums", "brass"], "duration_ms": 5800, "lines": []},
  {"section_name": "the fear, then insured", "positive_local_styles": ["suspended uneasy chord", "then a clear warm turn to A major", "piano motif rising", "relief"], "negative_local_styles": ["drums"], "duration_ms": 6500, "lines": []},
  {"section_name": "he goes home", "positive_local_styles": ["warm strings and piano", "gentle resolved ending", "final sustained major chord"], "negative_local_styles": ["drums"], "duration_ms": 4500, "lines": []}
 ]
}
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K}, json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
print(r.status_code, r.text[:300] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(sys.argv[1], 'wb').write(r.content)
