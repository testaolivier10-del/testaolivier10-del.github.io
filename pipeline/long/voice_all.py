"""Voice chapters directly with the ElevenLabs API (key read from a file, never printed).
python3 voice_all.py <script_module> <key_file> [chapter ids comma separated | all-missing]
Narrator: Jeremy (5gaEGrWSk4v20HMfIhgC) since 2026-10-25 (video standard section 5); eleven_v3, stability 0.5, similarity 0.75.
"""
import sys, json, os, urllib.request, subprocess
VOICE_ID = "5gaEGrWSk4v20HMfIhgC"
sys.path.insert(0, "/home/claude/lp"); sys.path.insert(0, "/home/claude/lp/long")
mod = __import__(sys.argv[1]); key = open(sys.argv[2], encoding="utf-8-sig").read().strip()
want = sys.argv[3] if len(sys.argv) > 3 else "all-missing"
out = f"/home/claude/lp/out/{mod.ID}"; os.makedirs(f"{out}/vo", exist_ok=True)
for ch in mod.CHAPTERS:
    keys = [b["key"] for b in ch["beats"]]
    if want == "all-missing":
        if all(os.path.exists(f"{out}/{k}.el.json") for k in keys): continue
    elif ch["id"] not in want.split(","): continue
    text = " ".join(mod.clean(b["vo"]) for b in ch["beats"])
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps",
        data=json.dumps({"text": text, "model_id": "eleven_v3",
                         "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json"}, method="POST")
    try:
        r = urllib.request.urlopen(req, timeout=300).read()
    except urllib.error.HTTPError as e:
        print("FAIL", ch["id"], e.code, e.read()[:300]); continue
    p = f"{out}/vo/{ch['id']}.json"; open(p, "wb").write(r)
    subprocess.run(["python3", "/home/claude/lp/long/vo.py", sys.argv[1], "split", ch["id"], p], check=True, stdin=subprocess.DEVNULL, cwd="/home/claude/lp/long")
    for k in keys:
        try: os.remove(f"{out}/{k}.draft")
        except FileNotFoundError: pass
    print("voiced", ch["id"], len(text))
