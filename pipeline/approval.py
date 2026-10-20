"""Approvals locked to the exact file Olivier watched.

Olivier's "approve" in a chat applies to one specific video file. This records the file's git blob id (a
fingerprint of its exact bytes) on the media branch at approval time; the daily run checks it again right before
scheduling or uploading. If the file changed after approval (a fix, a re-render, a wrong copy), the check fails
and nothing is posted until he approves the new file.

usage (from the media branch clone, default /tmp/m; LP_MEDIA_ROOT overrides):
  python3 approval.py approve <queue> <id> [<id> ...]   set status approved, approved_on today, record the fingerprint
  python3 approval.py verify  <queue> <id>              exit 0 = same file (or a legacy item, now recorded), 2 = changed
  python3 approval.py reopen  <queue> <id> [reason]     a fix replaced an approved file: back to pending, needs review
  <queue> is queue.json (Shorts) or long/queue.json (long videos)
The fingerprint is read from origin/media after a fetch, so it is what Buffer and YouTube will actually download.
No file is downloaded: blob ids come from the tree. The script edits the queue file but does not commit;
commit and push the queue right after, as every queue change (claude/levlprep-ops-common.md)."""
import json, os, sys, subprocess, datetime

ROOT = os.environ.get("LP_MEDIA_ROOT") or "/tmp/m"

def git(*a):
    r = subprocess.run(["git", "-C", ROOT] + list(a), capture_output=True, text=True)
    return r.returncode, r.stdout.strip()

def media_path(queue, item):
    """Where the video lives on the branch: Shorts videos/<id>.mp4, long videos the item's video field."""
    if queue.startswith("long"):
        v = item.get("video") or f"long/{item['id']}.mp4"
        return v.split("/media/", 1)[-1] if v.startswith("http") else v
    return f"videos/{item['id']}.mp4"

def blob(path):
    git("fetch", "-q", "origin", "media")
    code, out = git("rev-parse", f"origin/media:{path}")
    return out if code == 0 else None

def load(queue):
    p = os.path.join(ROOT, queue); return p, json.load(open(p))

def save(p, d):
    json.dump(d, open(p, "w"), indent=1, ensure_ascii=False); open(p, "a").write("\n")

def find(d, i):
    for it in d["items"]:
        if it["id"] == i: return it
    sys.exit(f"approval: no item {i}")

def approve(queue, ids):
    p, d = load(queue)
    for i in ids:
        it = find(d, i); path = media_path(queue, it); b = blob(path)
        if not b: sys.exit(f"approval: {path} is not on origin/media; push the video before approving {i}")
        it["status"] = "approved"; it["approved_on"] = datetime.date.today().isoformat(); it["approved_blob"] = b
        print(f"approved {i}: {path} fingerprint {b[:12]}")
    save(p, d)

def verify(queue, i):
    p, d = load(queue); it = find(d, i); path = media_path(queue, it); b = blob(path)
    if not b:
        print(f"MISSING {i}: {path} is not on origin/media"); return 2
    want = it.get("approved_blob")
    if not want:   # approved before 2026-10-20: record what is there now, so later changes are caught
        it["approved_blob"] = b; save(p, d)
        print(f"LEGACY {i}: no fingerprint at approval; recorded {b[:12]} now"); return 0
    if want != b:
        print(f"CHANGED {i}: {path} is {b[:12]} but Olivier approved {want[:12]}. Do not post; ask him to review the new file."); return 2
    print(f"OK {i}: {path} is the approved file ({b[:12]})"); return 0

def reopen(queue, i, reason=""):
    p, d = load(queue); it = find(d, i)
    was = it.get("status")
    if was in ("scheduled", "posted"):
        sys.exit(f"approval: {i} is already {was}; a changed file must not replace it silently (tell Olivier)")
    it["status"] = "pending"; it["approved_on"] = "" if queue.startswith("long") else None; it.pop("approved_blob", None)
    it["reopened"] = (datetime.date.today().isoformat() + (" " + reason if reason else ""))
    save(p, d); print(f"reopened {i} (was {was}): needs Olivier's review again")

if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 3: sys.exit(__doc__)
    cmd, queue = a[0], a[1]
    if cmd == "approve": approve(queue, a[2:])
    elif cmd == "verify": sys.exit(verify(queue, a[2]))
    elif cmd == "reopen": reopen(queue, a[2], " ".join(a[3:]))
    else: sys.exit(__doc__)
