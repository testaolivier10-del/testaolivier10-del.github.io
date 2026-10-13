"""Real recorded sound effects from Freesound (free), CC0 only, so no credit is needed and monetized use is fine.

NOTE: Freesound refuses the cloud workspace (HTTP 403); run searches and downloads on the laptop with device_bash,
then stage the files here. These helpers work wherever freesound.org answers.
Needs (one time, by Olivier): a free freesound.org account, an API key from https://freesound.org/apiv2/apply
saved as Downloads\\levlprep\\freesound_key.txt, and freesound.org plus cdn.freesound.org added to the
allowed network domains. Stage the key like the others to /root/.lpkey/fs (chmod 600, never print it).
Until then this module raises and the synthesized sfx.py sounds are used.

    import freesound
    freesound.search("fire whoosh ignite", max_dur=3)   -> [(id, name, duration, rating, tags), ...]
    freesound.get(123456, "ignite_real")                -> writes assets/ignite_real.wav (mono 44.1 kHz,
                                                           trimmed of leading silence, peak normalized)
Then use the new name with c.sound("ignite_real", t). Every fetched sound is logged in assets/freesound.json
so it is downloaded once. Fresh workspaces lose assets/, so after fetching, copy assets/<name>.wav and
assets/freesound.json into sfx/ on the media branch and push; setup copies sfx/* back into assets/.
"""
import os, json, subprocess, urllib.parse, urllib.request

KEY = "/root/.lpkey/fs"
A = "/home/claude/lp/assets"
API = "https://freesound.org/apiv2"


def _key():
    if not os.path.exists(KEY):
        raise RuntimeError("No Freesound key staged (Downloads\\levlprep\\freesound_key.txt); use sfx.py sounds")
    return open(KEY).read().strip()


def _get(url):
    req = urllib.request.Request(url, headers={"Authorization": f"Token {_key()}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def search(query, max_dur=6, n=15):
    q = urllib.parse.urlencode({
        "query": query, "page_size": n, "sort": "rating_desc",
        "filter": f'license:"Creative Commons 0" duration:[0.05 TO {max_dur}]',
        "fields": "id,name,duration,avg_rating,num_ratings,tags,previews,license",
    })
    res = json.loads(_get(f"{API}/search/text/?{q}"))["results"]
    return [(r["id"], r["name"], round(r["duration"], 2), r.get("avg_rating"), r["tags"][:6]) for r in res]


def get(sound_id, name):
    log_p = f"{A}/freesound.json"
    log = json.load(open(log_p)) if os.path.exists(log_p) else {}
    if name in log and os.path.exists(f"{A}/{name}.wav"):
        return f"{A}/{name}.wav"
    info = json.loads(_get(f"{API}/sounds/{sound_id}/?fields=id,name,license,username,previews"))
    assert "publicdomain/zero" in info["license"], f"sound {sound_id} is not CC0"
    mp3 = f"/tmp/fs_{sound_id}.mp3"
    open(mp3, "wb").write(_get(info["previews"]["preview-hq-mp3"]))
    subprocess.run(f'ffmpeg -y -loglevel error -i {mp3} -af "silenceremove=start_periods=1:start_threshold=-50dB,loudnorm=I=-16:TP=-1.5" -ac 1 -ar 44100 "{A}/{name}.wav"', shell=True, check=True)
    log[name] = dict(id=sound_id, title=info["name"], user=info["username"], license="CC0")
    json.dump(log, open(log_p, "w"), indent=1)
    return f"{A}/{name}.wav"
