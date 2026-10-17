"""LevlPrep: post the channel's own top-level comment on a video (YouTube Data API, own project).
Needs yt_api.py in the same folder and the staged credentials (/root/.lpkey/yt). Never print the key.

python3 yt_comment.py <video_id> "<text>" [--if-missing]
  --if-missing: do nothing if the channel already has a top-level comment on that video containing "levlprep.com".
Prints the comment thread id. Quota: insert 50 units, list 1.
Pinning is not available in the API; the daily run pins it in YouTube Studio (see levlprep-ops-common.md).
"""
import sys, os, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from yt_api import token, call, API

def own_channel(tok):
    _, r = call("GET", f"{API}/channels?part=id&mine=true", tok)
    return r["items"][0]["id"]

def existing(tok, vid, me):
    q = urllib.parse.urlencode({"part": "snippet", "videoId": vid, "searchTerms": "levlprep.com", "maxResults": 50})
    _, r = call("GET", f"{API}/commentThreads?{q}", tok)
    for t in r.get("items", []):
        s = t["snippet"]["topLevelComment"]["snippet"]
        if s.get("authorChannelId", {}).get("value") == me:
            return t["id"]
    return None

if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 2:
        sys.exit(__doc__)
    vid, text = a[0], a[1]
    tok = token()
    if "--if-missing" in a:
        found = existing(tok, vid, own_channel(tok))
        if found:
            print("exists", found); sys.exit(0)
    _, r = call("POST", f"{API}/commentThreads?part=snippet", tok,
                {"snippet": {"videoId": vid, "topLevelComment": {"snippet": {"textOriginal": text}}}})
    print(r["id"])
