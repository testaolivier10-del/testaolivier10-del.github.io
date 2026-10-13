"""Voice helper for long videos.
python3 vo.py <script_module> body <chapter_id>       -> JSON body to POST to ElevenLabs with-timestamps (one chapter)
python3 vo.py <script_module> split <chapter_id> <resp> -> out/<ID>/<key>.el.json per beat
python3 vo.py <script_module> list                     -> chapters and character counts
"""
import sys, json, os
sys.path.insert(0, "/home/claude/lp"); sys.path.insert(0, "/home/claude/lp/long")
import el_split
mod = __import__(sys.argv[1]); cmd = sys.argv[2]
def beats(ch): return [(b["key"], mod.clean(b["vo"])) for b in ch["beats"]]
chs = {c["id"]: c for c in mod.CHAPTERS}
if cmd == "list":
    for c in mod.CHAPTERS: print(c["id"], len(" ".join(t for _, t in beats(c))))
elif cmd == "body":
    t = " ".join(t for _, t in beats(chs[sys.argv[3]]))
    print(json.dumps({"text": t, "model_id": "eleven_v3"}))
elif cmd == "split":
    el_split.split(el_split.load(sys.argv[4]), [b for c in sys.argv[3].split(",") for b in beats(chs[c])], f"/home/claude/lp/out/{mod.ID}")
