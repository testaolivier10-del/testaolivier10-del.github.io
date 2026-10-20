"""Modal spend ledger for LevlPrep: one file per run, plus budget reservations.
(An estimate kept by us; Modal's own usage page is the truth when Olivier checks it.)

Why per run files: several scheduled runs (Sunday and Wednesday Shorts, the daily long build) can overlap.
Each run writes ONLY its own file modal_ledger/<run_id>.json, so two runs never edit the same file.
Why reservations: separate files stop write collisions but not double spending. A run first RESERVES its share;
the reservation is pushed to the media branch, and git only accepts the push if nobody else pushed in between
(compare and swap on the branch), so two runs cannot both claim the same remaining money.

usage (needs the media branch clone at /tmp/m; set LP_LEDGER_ROOT to use another clone):
  python3 ledger.py begin <task> [usd|auto]  reserve this run's share (auto = Shorts first formula), prints the grant
  python3 ledger.py month                    spent, held by other runs, free, and this run's numbers
  python3 ledger.py end                      close this run's reservation (unspent money goes back), commit and push
  python3 ledger.py sweep                    list reservations of other runs and whether they are stale (changes nothing)
  tasks: shorts-sun, shorts-wed, long (auto shares), or any name with a fixed usd (shorts-fix 0.3, long-fix 0.7)

The image and video clients refuse a call unless this workspace has an active reservation with room for it
(or LP_MANUAL=1 is set for a hand run in a chat, which still respects the month's cap).
Every start and finish is pushed right away (best effort), so other runs see open calls.
A call submitted but never collected keeps counting at its estimated price (Modal still ran it).
Crash recovery: a run whose file has not changed for STALE_H hours and has no call younger than OPEN_MAX_H stops
holding its unspent reservation; its open calls keep counting. Nothing ever edits another run's file.
The legacy file modal_ledger.json (before 2026-10-19) is read for history and never written again."""
import json, os, sys, time, datetime, glob, subprocess, calendar, tempfile, fcntl

ROOT = os.environ.get("LP_LEDGER_ROOT") or "/tmp/m"
DIR = os.path.join(ROOT, "modal_ledger")
LEGACY = os.path.join(ROOT, "modal_ledger.json")
RUNFILE = os.path.join(ROOT, ".git", "lp_run")     # inside .git: never shows up as an untracked file
RATE = 0.0011          # USD per second, H100 on Modal (about $3.95 an hour), estimate
CAP = 27.0             # monthly cap: the free $30 credit minus a $3 safety margin
EST = {"video": 0.65, "images": 0.12}   # price of one call (per image prompt for images) while it is open
STALE_H = 12           # a run file untouched this long belongs to a run that is over
OPEN_MAX_H = 2         # no single Modal call lasts this long
WEIGHT = {"shorts-sun": 4.0, "shorts-wed": 3.0, "long": 0.5}   # Shorts first (video standard 3c)
GIT = ["git", "-C", ROOT, "-c", "user.name=LevlPrep automation", "-c", "user.email=noreply@levlprep.com"]
_COLLECTED = set()

def _now(): return time.time()
def _month(): return datetime.date.today().strftime("%Y-%m")
def _est(o): return (EST["video"] if o["kind"].startswith("video") else EST["images"]) * o.get("n", 1)

def _need_repo():
    if not os.path.isdir(os.path.join(ROOT, ".git")):
        sys.exit(f"ledger: {ROOT} is not the media branch clone. Make the sparse clone first (claude/levlprep-ops-common.md, Media store).")

def _read(p):
    try: return json.load(open(p))
    except Exception: return None

def run_id():
    try: return open(RUNFILE).read().strip() or None
    except Exception: return None

def _path(rid): return os.path.join(DIR, rid + ".json")

class _lock:
    """Per run file lock: the background wait and a new submit in the same run never overwrite each other."""
    def __init__(self, rid): self.p = os.path.join(ROOT, ".git", "lp_lock_" + rid)
    def __enter__(self):
        self.f = open(self.p, "w"); fcntl.flock(self.f, fcntl.LOCK_EX); return self
    def __exit__(self, *a): fcntl.flock(self.f, fcntl.LOCK_UN); self.f.close()

def _all_runs():
    runs = {os.path.basename(p)[:-5]: d for p in sorted(glob.glob(os.path.join(DIR, "*.json"))) if (d := _read(p))}
    _COLLECTED.clear()   # a call submitted in one run and collected in a resumed run counts once
    _COLLECTED.update(c.get("call") for d in runs.values() for c in d.get("calls", []) if c.get("call"))
    return runs

def _spent(d, month): return sum(c["usd"] for c in d.get("calls", []) if c["date"].startswith(month))

def _open_cost(d):
    return sum(_est(o) for cid, o in d.get("open", {}).items() if cid not in _COLLECTED)

def _stale(d, now):
    last = d.get("touched", d.get("started", 0))
    young = any(now - o["t"] < OPEN_MAX_H * 3600 for cid, o in d.get("open", {}).items() if cid not in _COLLECTED)
    return now - last > STALE_H * 3600 and not young

def _held(d, now, month):
    """Money a run still holds beyond what it spent: its unspent reservation (active, this month, not stale) plus open calls."""
    oc = _open_cost(d); r = d.get("reservation", {})
    if r.get("status") == "active" and r.get("month", month) == month and not _stale(d, now):
        return max(0.0, r.get("usd", 0.0) - d.get("spent_in_run", 0.0) - oc) + oc
    return oc

def status(exclude=None):
    """(spent this month, held by runs other than `exclude`, free = cap - spent - held)."""
    m, now = _month(), _now()
    legacy = _read(LEGACY) or {"calls": []}
    spent = sum(c["usd"] for c in legacy.get("calls", []) if c["date"].startswith(m))
    held = 0.0
    for rid, d in _all_runs().items():
        spent += _spent(d, m)
        if rid != exclude: held += _held(d, now, m)
    return round(spent, 2), round(held, 2), round(CAP - spent - held, 2)

def _new_run(rid, task):
    return {"run": rid, "task": task, "started": _now(), "reservation": {"usd": 0.0, "status": "none"},
            "spent_in_run": 0.0, "open": {}, "calls": []}

def _mine():
    _need_repo()
    rid = run_id()
    if not rid:
        if os.environ.get("LP_MANUAL") != "1": return None, None
        rid = "manual-" + datetime.date.today().isoformat()
        open(RUNFILE, "w").write(rid)
    return rid, (_read(_path(rid)) or _new_run(rid, "manual"))

def _save(rid, d):
    os.makedirs(DIR, exist_ok=True); d["touched"] = _now()
    fd, tmp = tempfile.mkstemp(dir=os.path.join(ROOT, ".git"), prefix="lp_tmp_", suffix=".json")
    with os.fdopen(fd, "w") as f: json.dump(d, f, indent=1)
    os.replace(tmp, _path(rid))

def left():
    """What this run may still spend: the smaller of its reservation's room and what nobody else holds."""
    rid, d = _mine()
    if rid is None: return 0.0
    s, h, free = status(exclude=rid)
    free_global = free - _open_cost(d)
    r = d.get("reservation", {})
    if r.get("status") == "active":
        return round(min(r["usd"] - d.get("spent_in_run", 0.0) - _open_cost(d), free_global), 2)
    return round(free_global, 2) if os.environ.get("LP_MANUAL") == "1" else 0.0

def can_spend(usd):
    """Clients call this before a new Modal call."""
    if run_id() is None and os.environ.get("LP_MANUAL") != "1":
        print("ledger: no reservation in this workspace. Run python3 ledger.py begin <task> auto first "
              "(or set LP_MANUAL=1 for a hand run in a chat).", file=sys.stderr)
        return False
    return left() >= usd

# ---------- git ----------
def _git(*a): return subprocess.run(GIT + list(a), capture_output=True, text=True)

def _sync():
    """Pull the branch. On a conflict, undo the attempt and report failure instead of leaving a half rebase."""
    _git("sparse-checkout", "add", "/modal_ledger/")
    r = _git("pull", "-q", "--rebase", "--autostash", "origin", "media")
    if r.returncode != 0:
        _git("rebase", "--abort")
        return False
    return True

def _commit_push(rid, msg):
    """Commit only this run's file and push. Returns True when the remote accepted it.
    On a rejected push the commit stays local; the next _sync rebases it on top (only this run's file, so no conflict)."""
    _git("add", "--sparse", _path(rid))
    if _git("diff", "--cached", "--quiet", "--", _path(rid)).returncode != 0:
        if _git("commit", "-q", "-m", msg, "--", _path(rid)).returncode != 0: return False
    return _git("push", "-q", "origin", "HEAD:media").returncode == 0

def _publish(rid, msg, tries=2):
    """Best effort push of this run's file so other runs see its open calls."""
    for _ in range(tries):
        if _commit_push(rid, msg): return True
        if not _sync(): break
    print(f"ledger: could not push {rid} ({msg}); it will go out with the next push", file=sys.stderr)
    return False

# ---------- calls ----------
def start(call_id, kind, n=1):
    rid, d = _mine()
    if rid is None: return
    with _lock(rid):
        d = _read(_path(rid)) or d
        d["open"][call_id] = {"t": _now(), "kind": kind, "n": n}; _save(rid, d)
        _publish(rid, f"Modal ledger {rid}: start {kind}")   # inside the lock: a pull never stashes a half written file

def finish(call_id):
    rid, d = _mine()
    if rid is None: return
    with _lock(rid):
        d = _read(_path(rid)) or d
        o = d["open"].pop(call_id, None)
        if o:
            usd = round(max(0.0, _now() - o["t"]) * RATE, 3)
        else:
            # submitted by an earlier run (a resumed build) or never logged: count it once at its usual price
            o = next((r["open"][call_id] for r in _all_runs().values() if call_id in r.get("open", {})), None) \
                or {"t": _now(), "kind": "unknown", "n": 1}
            usd = round(_est(o) if o["kind"] != "unknown" else EST["video"], 3)
        s = _now() - o["t"]
        d["calls"].append({"date": datetime.date.today().isoformat(), "kind": o["kind"], "seconds": round(s), "usd": usd, "call": call_id})
        d["spent_in_run"] = round(d.get("spent_in_run", 0.0) + usd, 3)
        _save(rid, d)
        _publish(rid, f"Modal ledger {rid}: collected ${usd}")

def month_spend(month=None):
    m = month or _month()
    legacy = _read(LEGACY) or {"calls": []}
    return round(sum(c["usd"] for c in legacy.get("calls", []) if c["date"].startswith(m)) +
                 sum(_spent(d, m) for d in _all_runs().values()), 2)

# ---------- reservations ----------
def _runs_left_this_month(task):
    """Remaining weighted runs from today to month end: Sundays, Wednesdays, and about 2 long builds a week."""
    today = datetime.date.today(); last = calendar.monthrange(today.year, today.month)[1]
    days = [today + datetime.timedelta(n) for n in range(last - today.day + 1)]
    sun = sum(1 for x in days if x.weekday() == 6); wed = sum(1 for x in days if x.weekday() == 2)
    longs = max(1, round(len(days) * 2 / 7))
    total = sun * WEIGHT["shorts-sun"] + wed * WEIGHT["shorts-wed"] + longs * WEIGHT["long"]
    w = WEIGHT.get(task, 0.5)
    return w, max(total, w)

def begin(task, want="auto"):
    """Reserve this run's share. Atomic: the reservation counts only once git accepted the push;
    if another run pushed first, pull, recompute what is free, shrink the grant if needed, retry."""
    _need_repo()
    if want == "auto" and task not in WEIGHT: sys.exit(f"ledger: task {task} has no auto share; give a usd amount")
    rid = datetime.datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + task
    open(RUNFILE, "w").write(rid)
    for attempt in range(5):
        if not _sync():
            print("ledger: could not pull the media branch cleanly (conflict outside the ledger); fix that first", file=sys.stderr)
            break
        s, h, free = status(exclude=rid)
        if want == "auto":
            w, total = _runs_left_this_month(task); ask = free * w / total
        else:
            ask = float(want)
        grant = round(max(0.0, min(ask, free)), 2)
        with _lock(rid):
            d = _read(_path(rid)) or _new_run(rid, task)
            d["reservation"] = {"usd": grant, "status": "active", "month": _month(), "asked": round(ask, 2), "free_when_granted": free}
            _save(rid, d)
        _git("add", "--sparse", _path(rid))
        if _git("commit", "-q", "-m", f"Modal reservation {rid}: ${grant}", "--", _path(rid)).returncode != 0: break
        mine = _git("rev-parse", "HEAD").stdout.strip()
        if _git("push", "-q", "origin", "HEAD:media").returncode == 0:
            print(f"run {rid} reserved ${grant} (asked {round(ask, 2)}; spent this month {s}, held by other runs {h}, free {free})")
            return grant
        if _git("rev-parse", "HEAD").stdout.strip() == mine:
            _git("reset", "-q", "--soft", "HEAD~1")    # undo only our own unpushed reservation commit, then retry
        time.sleep(3 + attempt * 2)
    with _lock(rid):
        d = _read(_path(rid)) or _new_run(rid, task)
        d["reservation"] = {"usd": 0.0, "status": "active", "month": _month(), "asked": 0, "free_when_granted": 0}
        _save(rid, d)
    print(f"run {rid}: the reservation was not accepted; reserved $0 (use reused art or the fallback in video standard section 2)")
    return 0.0

def _run_line(rid, d):
    r = d.get("reservation", {})
    return (f"this run {rid}: reserved ${r.get('usd', 0)}, spent ${round(d.get('spent_in_run', 0), 2)}, "
            f"{len(d.get('open', {}))} calls open, reservation {r.get('status', 'none')}")

def end():
    rid, d = _mine()
    if rid is None: print("ledger: no run in this workspace; nothing to close"); return
    with _lock(rid):
        d = _read(_path(rid)) or d
        r = d.get("reservation", {}); r["status"] = "closed"; r["closed"] = _now(); d["reservation"] = r
        _save(rid, d)
        ok = _publish(rid, f"Modal ledger {rid}: closed, spent ${round(d.get('spent_in_run', 0), 2)}", tries=3)
    s, h, free = status(exclude=rid)
    print(f"{_run_line(rid, d)}; open calls keep counting. pushed: {ok}")
    print(f"month {s} USD estimated, cap {CAP}, held by other runs {h}, free {free}")

def sweep():
    now = _now(); me = run_id(); m = _month()
    for rid, d in _all_runs().items():
        if rid == me: continue
        r = d.get("reservation", {})
        if r.get("status") == "active" or d.get("open"):
            age = round((now - d.get("touched", d.get("started", now))) / 3600, 1)
            state = "stale: only its open calls still count" if _stale(d, now) else "active"
            print(f"{rid}: reserved ${r.get('usd')}, spent ${round(d.get('spent_in_run', 0), 2)}, "
                  f"{len(d.get('open', {}))} open calls, last change {age} h ago -> {state}, holds ${round(_held(d, now, m), 2)}")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "month"
    if cmd == "begin": begin(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "auto")
    elif cmd == "end": end()
    elif cmd == "sweep": sweep()
    else:
        _need_repo()
        rid = run_id(); s, h, free = status(exclude=rid)
        print(f"month {s} USD estimated, cap {CAP}, held by other runs {h}, free {free}")
        if rid and (d := _read(_path(rid))):
            line = _run_line(rid, d)
            if d.get("reservation", {}).get("status") == "active": line += f", may still spend ${left()}"
            print(line)
