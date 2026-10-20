"""Approvals locked to the exact file Olivier watched.

Olivier's "approve" in a chat applies to one specific video file. Three fingerprints (git blob ids, which identify
a file's exact bytes) make sure that file, and only that file, is what goes out:
  review_blob    recorded when the video is queued and sent to him (the file he watches)
  approved_blob  recorded when he approves; refused if it is not the file he was sent
  verify         right before scheduling or uploading, checks the branch still holds that file and prints a link
                 PINNED to the commit that holds it, so Buffer and YouTube download exactly the approved bytes even
                 if the branch file changes later

usage (from the media branch clone, default /tmp/m; LP_MEDIA_ROOT overrides):
  python3 approval.py review  <queue> <id> [<id> ...]   after queueing for review: record what Olivier is sent
  python3 approval.py approve <queue> <id> [<id> ...]   status approved, approved_on today, approved_blob
  python3 approval.py verify  <queue> <id>              exit 0 and prints "URL <pinned link>": post with that link.
                                                        ANY other exit (2 changed or missing, 1 bad input): do not post
  python3 approval.py reopen  <queue> <id> [reason]     an approved file had to change: back to pending for review
  <queue> is queue.json (Shorts) or long/queue.json (long videos)
Blob ids come from the tree after a fetch, so no video is downloaded. A failed fetch is a failure, never a pass.
The script edits the queue file but does not commit; commit and push the queue right after (claude/levlprep-ops-common.md)."""
import json, os, sys, subprocess, datetime

ROOT = os.environ.get("LP_MEDIA_ROOT") or "/tmp/m"
REPO = "testaolivier10-del/testaolivier10-del.github.io"
LEGACY_BEFORE = "2026-10-20"      # items approved before fingerprints existed

def git(*a):
    r = subprocess.run(["git", "-C", ROOT] + list(a), capture_output=True, text=True)
    return r.returncode, r.stdout.strip()

def media_path(queue, item):
    """Where the video lives on the branch: Shorts videos/<id>.mp4, long videos the item's video field."""
    if queue.startswith("long"):
        v = item.get("video") or f"long/{item['id']}.mp4"
        return v.split("/media/", 1)[-1] if v.startswith("http") else v
    return f"videos/{item['id']}.mp4"

def fetch():
    code, _ = git("fetch", "-q", "origin", "media")
    if code != 0:
        print("approval: could not fetch origin/media, so the file cannot be checked. Do not post; try again later.")
        sys.exit(2)
    return git("rev-parse", "origin/media")[1]

def blob(path):
    code, out = git("rev-parse", f"origin/media:{path}")
    return out if code == 0 else None

def load(queue):
    p = os.path.join(ROOT, queue)
    try: return p, json.load(open(p))
    except Exception as e: print(f"approval: cannot read {p}: {e}"); sys.exit(1)

def save(p, d):
    json.dump(d, open(p, "w"), indent=1, ensure_ascii=False); open(p, "a").write("\n")

def find(d, i):
    for it in d["items"]:
        if it["id"] == i: return it
    print(f"approval: no item {i}"); sys.exit(1)

def review(queue, ids):
    p, d = load(queue); fetch(); items = [find(d, i) for i in ids]; out = []
    for it in items:
        path = media_path(queue, it); b = blob(path)
        if not b: print(f"approval: {path} is not on origin/media; push it before sending it for review"); sys.exit(1)
        out.append((it, b, path))
    for it, b, path in out:
        it["review_blob"] = b; print(f"review {it['id']}: {path} fingerprint {b[:12]}")
    save(p, d)

def approve(queue, ids):
    p, d = load(queue); fetch(); items = [find(d, i) for i in ids]; out = []
    for it in items:                                   # check everything first; save only if all are fine
        if it.get("status") not in ("pending", "approved"):
            print(f"approval: {it['id']} is {it.get('status')}; only a pending item can be approved"); sys.exit(1)
        path = media_path(queue, it); b = blob(path)
        if not b: print(f"approval: {path} is not on origin/media"); sys.exit(1)
        if it.get("review_blob") and it["review_blob"] != b:
            print(f"approval: {it['id']} changed since it was sent for review ({it['review_blob'][:12]} sent, {b[:12]} now). "
                  "Send Olivier the current file before approving."); sys.exit(2)
        out.append((it, b, path))
    for it, b, path in out:
        it["status"] = "approved"; it["approved_on"] = datetime.date.today().isoformat(); it["approved_blob"] = b
        print(f"approved {it['id']}: {path} fingerprint {b[:12]}")
    save(p, d)

def verify(queue, i):
    p, d = load(queue); it = find(d, i); head = fetch(); path = media_path(queue, it); b = blob(path)
    if not b:
        print(f"MISSING {i}: {path} is not on origin/media"); return 2
    want = it.get("approved_blob")
    if not want:
        if it.get("approved_on") and str(it["approved_on"]) < LEGACY_BEFORE:
            it["approved_blob"] = b; save(p, d)
            print(f"LEGACY {i}: approved before fingerprints; recorded {b[:12]} now")
        else:
            print(f"UNCHECKED {i}: no fingerprint, and it was approved on or after {LEGACY_BEFORE}. "
                  "Approve it with approval.py so the file is recorded."); return 2
    elif want != b:
        print(f"CHANGED {i}: {path} is {b[:12]} but Olivier approved {want[:12]}. Do not post; ask him to review the new file."); return 2
    else:
        print(f"OK {i}: {path} is the approved file ({b[:12]})")
    print(f"URL https://raw.githubusercontent.com/{REPO}/{head}/{path}")
    return 0

def reopen(queue, i, reason=""):
    p, d = load(queue); it = find(d, i); was = it.get("status")
    if was in ("scheduled", "posted"):
        print(f"approval: {i} is already {was} (it goes out from its pinned link, so the approved file is what posts). "
              "Tell Olivier instead of changing it."); sys.exit(1)
    it["status"] = "pending"; it["approved_on"] = "" if queue.startswith("long") else None
    it.pop("approved_blob", None); it.pop("review_blob", None)
    it["reopened"] = datetime.date.today().isoformat() + (" " + reason if reason else "")
    save(p, d); print(f"reopened {i} (was {was}): needs Olivier's review again")

if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 3: print(__doc__); sys.exit(1)
    cmd, queue = a[0], a[1]
    if cmd == "review": review(queue, a[2:])
    elif cmd == "approve": approve(queue, a[2:])
    elif cmd == "verify": sys.exit(verify(queue, a[2]))
    elif cmd == "reopen": reopen(queue, a[2], " ".join(a[3:]))
    else: print(__doc__); sys.exit(1)
