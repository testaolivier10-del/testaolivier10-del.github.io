"""LevlPrep YouTube API helper (own Google project, no Zapier).
Credentials: Olivier's file Downloads\\levlprep\\youtube_oauth.txt (line 1 client id, line 2 client secret,
line 3 refresh token), staged into the workspace and copied to /root/.lpkey/yt. Never print or commit it.

python3 yt_api.py check                                  -> channel title and id
python3 yt_api.py upload <mp4> <youtube.md> [--ai]       -> prints video id (public, category 27, not for kids)
python3 yt_api.py thumb <video_id> <png>
python3 yt_api.py playlist <video_id> "<playlist name>"  -> finds or creates the public playlist, adds the video
python3 yt_api.py captions <video_id> <srt>              -> English captions track "English"
python3 yt_api.py stats <startDate> <endDate>            -> JSON per video stats (Analytics API)
python3 yt_api.py retention <video_id> <start> <end>     -> JSON audience retention curve
python3 yt_api.py videos <id,id,...>                     -> JSON titles, durations, publish dates
python3 yt_api.py uploads [n]                            -> JSON list of the channel's latest uploads: id, title, publishedAt
Quota (own project, 10,000 units a day): upload 1600, thumbnail 50, playlist insert 50, captions 400, reads 1.
"""
import sys, json, os, time, urllib.request, urllib.parse, urllib.error

CRED = os.environ.get("YT_CRED", "/root/.lpkey/yt")
API = "https://www.googleapis.com/youtube/v3"

def token():
    cid, sec, ref = [l.strip() for l in open(CRED, encoding="utf-8-sig").read().strip().splitlines()[:3]]
    body = urllib.parse.urlencode({"client_id": cid, "client_secret": sec, "refresh_token": ref, "grant_type": "refresh_token"}).encode()
    try:
        r = json.load(urllib.request.urlopen(urllib.request.Request("https://oauth2.googleapis.com/token", data=body), timeout=60))
    except urllib.error.HTTPError as e:
        sys.exit(f"TOKEN FAIL {e.code}: {e.read()[:300]!r} (if invalid_grant: the refresh token expired or was revoked; Olivier must redo step 5 of the setup and the app must be Published, not Testing)")
    return r["access_token"]

def call(method, url, tok, body=None, ctype="application/json", headers=None, tries=4):
    data = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    h = {"Authorization": "Bearer " + tok}
    if data is not None: h["Content-Type"] = ctype
    h.update(headers or {})
    for i in range(tries):
        try:
            resp = urllib.request.urlopen(urllib.request.Request(url, data=data, method=method, headers=h), timeout=600)
            raw = resp.read(); return resp, (json.loads(raw) if raw.strip() else {})
        except urllib.error.HTTPError as e:
            msg = e.read()[:500]
            if e.code in (500, 502, 503, 504) and i < tries - 1: time.sleep(5 * 2 ** i); continue
            sys.exit(f"HTTP {e.code} {method} {url.split('?')[0]}: {msg!r}")
        except (urllib.error.URLError, TimeoutError) as e:
            if i < tries - 1: time.sleep(5 * 2 ** i); continue
            sys.exit(f"NETWORK {e}")

def parse_md(p):
    s = open(p, encoding="utf-8").read().splitlines()
    title = s[s.index("Title:") + 1].strip()
    i = s.index("Description:") + 1; desc = []
    while i < len(s) and not s[i].startswith("Tags:"): desc.append(s[i]); i += 1
    tags = [t.strip() for t in s[i][5:].split(",") if t.strip()] if i < len(s) else []
    return title, "\n".join(desc).strip(), tags

def upload(mp4, md, ai=True):
    tok = token(); title, desc, tags = parse_md(md)
    meta = {"snippet": {"title": title[:100], "description": desc[:5000], "tags": tags, "categoryId": "27", "defaultLanguage": "en", "defaultAudioLanguage": "en"},
            "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False, "embeddable": True, "containsSyntheticMedia": bool(ai)}}
    size = os.path.getsize(mp4)
    resp, _ = call("POST", "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status&notifySubscribers=true", tok, meta,
                   ctype="application/json; charset=UTF-8", headers={"X-Upload-Content-Length": str(size), "X-Upload-Content-Type": "video/mp4"})
    loc = resp.headers["Location"]; CH = 16 * 1024 * 1024; off = 0
    with open(mp4, "rb") as f:
        while off < size:
            f.seek(off); chunk = f.read(CH); end = off + len(chunk) - 1
            req = urllib.request.Request(loc, data=chunk, method="PUT", headers={"Content-Length": str(len(chunk)), "Content-Range": f"bytes {off}-{end}/{size}"})
            for i in range(6):
                try:
                    r = urllib.request.urlopen(req, timeout=600); out = json.load(r); return out["id"]
                except urllib.error.HTTPError as e:
                    if e.code == 308:
                        rng = e.headers.get("Range"); off = int(rng.split("-")[1]) + 1 if rng else 0; break
                    if e.code in (500, 502, 503, 504) and i < 5: time.sleep(5 * 2 ** i); tok = token(); continue
                    sys.exit(f"UPLOAD FAIL {e.code}: {e.read()[:400]!r}")
                except (urllib.error.URLError, TimeoutError):
                    if i < 5:
                        time.sleep(5 * 2 ** i)
                        q = urllib.request.Request(loc, data=b"", method="PUT", headers={"Content-Length": "0", "Content-Range": f"bytes */{size}"})
                        try: urllib.request.urlopen(q, timeout=60)
                        except urllib.error.HTTPError as e2:
                            if e2.code == 308:
                                rng = e2.headers.get("Range"); off = int(rng.split("-")[1]) + 1 if rng else 0; break
                        continue
                    sys.exit("UPLOAD NETWORK FAIL")
    sys.exit("UPLOAD ended without a video id")

def thumb(vid, png):
    tok = token()
    call("POST", f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={vid}&uploadType=media", tok, open(png, "rb").read(), ctype="image/png")
    print("thumbnail set")

def playlist(vid, name):
    tok = token(); pid = None; page = ""
    while True:
        _, r = call("GET", f"{API}/playlists?part=snippet&mine=true&maxResults=50{page}", tok)
        for p in r.get("items", []):
            if p["snippet"]["title"].strip().lower() == name.strip().lower(): pid = p["id"]
        if pid or not r.get("nextPageToken"): break
        page = "&pageToken=" + r["nextPageToken"]
    if not pid:
        _, r = call("POST", f"{API}/playlists?part=snippet,status", tok, {"snippet": {"title": name, "description": "Full LevlPrep course videos in textbook order. Free practice on levlprep.com."}, "status": {"privacyStatus": "public"}})
        pid = r["id"]
    _, r = call("GET", f"{API}/playlistItems?part=snippet&playlistId={pid}&maxResults=50", tok)
    if any(i["snippet"]["resourceId"].get("videoId") == vid for i in r.get("items", [])): print("already in", pid); return
    call("POST", f"{API}/playlistItems?part=snippet", tok, {"snippet": {"playlistId": pid, "resourceId": {"kind": "youtube#video", "videoId": vid}}})
    print("added to", pid)

def captions(vid, srt):
    tok = token(); b = "lpboundary7"
    meta = json.dumps({"snippet": {"videoId": vid, "language": "en", "name": "English", "isDraft": False}})
    body = (f"--{b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{meta}\r\n--{b}\r\nContent-Type: application/octet-stream\r\n\r\n").encode() + open(srt, "rb").read() + f"\r\n--{b}--".encode()
    call("POST", "https://www.googleapis.com/upload/youtube/v3/captions?part=snippet&uploadType=multipart", tok, body, ctype=f"multipart/related; boundary={b}")
    print("captions uploaded")

def analytics(params):
    tok = token(); q = urllib.parse.urlencode(dict(ids="channel==MINE", **params))
    _, r = call("GET", "https://youtubeanalytics.googleapis.com/v2/reports?" + q, tok); return r

if __name__ == "__main__":
    a = sys.argv[1:]
    if a[0] == "check":
        _, r = call("GET", f"{API}/channels?part=snippet,statistics&mine=true", token())
        for c in r.get("items", []): print(c["id"], c["snippet"]["title"], c["statistics"].get("subscriberCount"), "subs")
    elif a[0] == "upload": print(upload(a[1], a[2], ai="--no-ai" not in a))
    elif a[0] == "thumb": thumb(a[1], a[2])
    elif a[0] == "playlist": playlist(a[1], a[2])
    elif a[0] == "captions": captions(a[1], a[2])
    elif a[0] == "stats":
        print(json.dumps(analytics({"startDate": a[1], "endDate": a[2], "metrics": "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,shares,comments,subscribersGained", "dimensions": "video", "sort": "-views", "maxResults": 200})))
    elif a[0] == "retention":
        print(json.dumps(analytics({"startDate": a[2], "endDate": a[3], "metrics": "audienceWatchRatio,relativeRetentionPerformance", "dimensions": "elapsedVideoTimeRatio", "filters": f"video=={a[1]}"})))
    elif a[0] == "uploads":
        tok = token(); _, r = call("GET", f"{API}/channels?part=contentDetails&mine=true", tok)
        up = r["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
        _, r = call("GET", f"{API}/playlistItems?part=snippet&playlistId={up}&maxResults={int(a[1]) if len(a) > 1 else 50}", tok)
        print(json.dumps([{"id": i["snippet"]["resourceId"]["videoId"], "title": i["snippet"]["title"], "publishedAt": i["snippet"]["publishedAt"]} for i in r.get("items", [])]))
    elif a[0] == "videos":
        _, r = call("GET", f"{API}/videos?part=snippet,contentDetails,statistics&id={a[1]}", token()); print(json.dumps(r))
