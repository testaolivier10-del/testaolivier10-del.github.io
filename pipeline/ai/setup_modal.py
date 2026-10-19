"""One-time LevlPrep Modal setup. Runs on Windows outside Claude's sandbox.
Reads the token from modal_token.txt (never prints it), creates the endpoint key,
deploys the video app, and writes the endpoint address. Everything is logged to modal_setup_log.txt."""
import os, re, secrets, subprocess, sys, traceback

HERE = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(HERE, "modal_setup_log.txt")

def log(msg):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg)

def run(args, env=None, mask=()):
    shown = " ".join("***" if a in mask else a for a in args)
    log("> " + shown)
    p = subprocess.run(args, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = (p.stdout or "") + (p.stderr or "")
    for m in mask:
        out = out.replace(m, "***")
    log(out[-6000:])
    log("exit " + str(p.returncode))
    return p.returncode, out

try:
    open(LOG, "w").close()
    log("python " + sys.version)
    raw = open(os.path.join(HERE, "modal_token.txt"), encoding="utf-8").read()
    tid = re.search(r"ak-[A-Za-z0-9]+", raw).group(0)
    sec = re.search(r"as-[A-Za-z0-9]+", raw).group(0)
    env = dict(os.environ, MODAL_TOKEN_ID=tid, MODAL_TOKEN_SECRET=sec, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")

    run([sys.executable, "-m", "pip", "install", "--upgrade", "--quiet", "modal"])

    keyfile = os.path.join(HERE, "modal_endpoint_key.txt")
    if os.path.exists(keyfile):
        key = open(keyfile).read().strip()
    else:
        key = secrets.token_urlsafe(32)
        open(keyfile, "w").write(key)
    run([sys.executable, "-m", "modal", "secret", "create", "lp-video", "LP_KEY=" + key, "--force"],
        env=env, mask=(key, "LP_KEY=" + key))

    code, out = run([sys.executable, "-m", "modal", "deploy", os.path.join(HERE, "lp_video.py")], env=env)
    urls = re.findall(r"https://[A-Za-z0-9.\-]+\.modal\.run", out)
    if code == 0 and urls:
        open(os.path.join(HERE, "modal_endpoint.txt"), "w").write(urls[0] + "\n")
        log("ENDPOINT " + urls[0])
        log("SETUP OK")
    else:
        log("SETUP FAILED")
except Exception:
    log(traceback.format_exc())
    log("SETUP FAILED")
input("Done. You can close this window (press Enter).")
