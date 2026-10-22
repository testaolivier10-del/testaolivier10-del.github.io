"""LevlPrep AI video generator on Modal.

Two modes, both open models (Apache 2.0):
  i2v  : Wan 2.2 I2V A14B, animates one still image
  flf  : Wan 2.1 FLF2V 14B, animates from a first frame to a last frame (pins the end pose)

Web endpoints (plain HTTPS, so they work through Claude's network gateway):
  POST {submit_url}   json {mode, image_b64, last_b64?, prompt, negative?, frames?, steps?, area?}
                      header x-lp-key -> {"call_id": ...}
  GET  {result_url}?call_id=...   header x-lp-key -> 202 while running, then {"video_b64": ...}
  POST /animate       json {image_b64, video_b64, prompt, width?, height?, seed?}: Wan-Animate-2 (painted character + driving video)
Spend is capped by the workspace usage limit ($30, the free monthly credit) and spend limit ($0).
"""
import base64, io, os
import modal

app = modal.App("levlprep-video")
models = modal.Volume.from_name("lp-video-models", create_if_missing=True)
MODEL_DIR = "/models"
I2V_ID = "Wan-AI/Wan2.2-I2V-A14B-Diffusers"
FLF_ID = "Wan-AI/Wan2.1-FLF2V-14B-720P-diffusers"
EDIT_ID = "Qwen/Qwen-Image-Edit-2509"     # image generation and editing with style reference images (Apache 2.0)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "torch==2.6.0", "torchvision==0.21.0", "diffusers>=0.35.0", "transformers>=4.51.0",
        "accelerate>=1.6.0", "sentencepiece", "ftfy", "imageio[ffmpeg]", "numpy", "pillow",
        "huggingface_hub[hf_transfer]", "fastapi[standard]",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1", "HF_HOME": MODEL_DIR + "/hf"})
)
img_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.6.0", "torchvision==0.21.0", "diffusers>=0.36.0", "transformers>=4.51.3",
        "accelerate>=1.6.0", "sentencepiece", "numpy", "pillow", "huggingface_hub[hf_transfer]",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1", "HF_HOME": MODEL_DIR + "/hf"})
)
# Wan-Animate-2 (Aug 2026, Apache 2.0): the painted character performs the motion of a real person in a raw driving
# video, no pose extraction. Distilled checkpoint (10 steps, no CFG) through diffusers from source.
ANIM2_ID = "Wan-AI/Wan2.2-Animate-2-14B-Distilled-Diffusers"
anim_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "ffmpeg")
    .pip_install("torch==2.7.0", "torchvision==0.22.0", extra_index_url="https://download.pytorch.org/whl/cu126")
    .pip_install("git+https://github.com/huggingface/diffusers.git@refs/pull/14412/head", "transformers>=4.51.3", "decord", "opencv-python-headless", "accelerate>=1.6.0",
                 "sentencepiece", "ftfy", "imageio[ffmpeg]", "numpy", "pillow", "huggingface_hub[hf_transfer]", "av")
    .run_commands("pip install https://github.com/Dao-AILab/flash-attention/releases/download/v2.8.3/flash_attn-2.8.3+cu12torch2.7cxx11abiFALSE-cp311-cp311-linux_x86_64.whl || echo 'flash-attn wheel not available, using PyTorch attention'")
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1", "HF_HOME": MODEL_DIR + "/hf"})
)
web_image = modal.Image.debian_slim(python_version="3.11").pip_install("fastapi[standard]")
secret = modal.Secret.from_name("lp-video")


@app.function(image=image, volumes={MODEL_DIR: models}, timeout=3600, cpu=4, memory=8192)
def download(model_id: str):
    """Fetch model weights into the shared volume on a cheap CPU machine (no GPU billed)."""
    from huggingface_hub import snapshot_download
    snapshot_download(model_id, cache_dir=MODEL_DIR + "/hf/hub")
    models.commit()
    return "ok " + model_id


@app.function(image=anim_image, gpu="H100", volumes={MODEL_DIR: models}, timeout=3600,
              memory=98304, max_containers=1, scaledown_window=120)
def animate(job: dict) -> bytes:
    """Wan-Animate-2 distilled: job {image_b64 (painted character), video_b64 (driving video of a real person),
    prompt (appearance and background only, no actions), width?, height?, steps?, seed?, fps?} -> mp4 bytes."""
    import inspect, torch, tempfile
    from PIL import Image
    import diffusers
    from diffusers.utils import export_to_video, load_video
    Pipe = getattr(diffusers, "WanAnimate2Pipeline")
    pipe = Pipe.from_pretrained(ANIM2_ID, torch_dtype=torch.bfloat16, cache_dir=MODEL_DIR + "/hf/hub")
    pipe.to("cuda")
    ref = Image.open(io.BytesIO(base64.b64decode(job["image_b64"]))).convert("RGB")
    tmp = tempfile.mkdtemp(); vp = tmp + "/drive.mp4"; open(vp, "wb").write(base64.b64decode(job["video_b64"]))
    drive = None if "driving_video" in inspect.signature(pipe.__call__).parameters else load_video(vp)
    params = inspect.signature(pipe.__call__).parameters
    kw = {}
    for name in params:                                   # the pipeline is new: map inputs by their names
        n = name.lower()
        if n in ("image", "reference_image", "ref_image", "refer_image", "character_image"): kw[name] = ref
        elif n == "driving_video": kw[name] = vp                    # Wan-Animate-2 reads the file itself (decord)
        elif n in ("video", "pose_video", "refer_video", "reference_video", "motion_video"): kw[name] = drive
    if "prompt" in params: kw["prompt"] = job.get("prompt", "")
    w, h = int(job.get("width", 832)), int(job.get("height", 480))
    for k, v in (("height", h), ("width", w), ("num_inference_steps", int(job.get("steps", 10))), ("guidance_scale", 1.0)):
        if k in params: kw[k] = v
    if "flow_solver" in params: kw["flow_solver"] = "euler"
    if "fps" in params: kw["fps"] = int(job.get("fps", 16))
    if "seed" in params: kw["seed"] = int(job.get("seed", 42))
    if "generator" in params: kw["generator"] = torch.Generator("cuda").manual_seed(int(job.get("seed", 42)))
    if not any(k for k in kw if "video" in k.lower()):
        raise RuntimeError("could not find the driving video argument in " + str(list(params)))
    out = pipe(**kw)
    frames = out.frames[0] if hasattr(out, "frames") else out[0]
    p = tmp + "/out.mp4"
    export_to_video(frames, p, fps=int(job.get("fps", 16)))
    return open(p, "rb").read()


def _fit(img, pipe, area):
    import numpy as np
    ar = img.height / img.width
    mod = pipe.vae_scale_factor_spatial * pipe.transformer.config.patch_size[1]
    h = round(np.sqrt(area * ar)) // mod * mod
    w = round(np.sqrt(area / ar)) // mod * mod
    return img.resize((w, h)), h, w


@app.function(image=image, gpu="H100", volumes={MODEL_DIR: models}, timeout=1800,
              memory=98304, max_containers=1, scaledown_window=120)
def generate(job: dict) -> bytes:
    import torch
    from PIL import Image
    from diffusers import AutoencoderKLWan, WanImageToVideoPipeline
    from diffusers.utils import export_to_video

    mode = job.get("mode", "i2v")
    mid = FLF_ID if mode == "flf" else I2V_ID
    cache = MODEL_DIR + "/hf/hub"
    vae = AutoencoderKLWan.from_pretrained(mid, subfolder="vae", torch_dtype=torch.float32, cache_dir=cache)
    kw = {}
    if mode == "flf":
        from transformers import CLIPVisionModel
        kw["image_encoder"] = CLIPVisionModel.from_pretrained(mid, subfolder="image_encoder", torch_dtype=torch.float32, cache_dir=cache)
    pipe = WanImageToVideoPipeline.from_pretrained(mid, vae=vae, torch_dtype=torch.bfloat16, cache_dir=cache, **kw)
    pipe.enable_model_cpu_offload()

    area = int(job.get("area", 480 * 832))
    first = Image.open(io.BytesIO(base64.b64decode(job["image_b64"]))).convert("RGB")
    first, h, w = _fit(first, pipe, area)
    args = dict(image=first, prompt=job["prompt"], height=h, width=w,
                negative_prompt=job.get("negative", "static, blurred details, worst quality, low quality, deformed, disfigured, extra fingers, fused fingers, poorly drawn hands, poorly drawn faces, misshapen limbs, style change, flickering"),
                num_frames=int(job.get("frames", 81)), num_inference_steps=int(job.get("steps", 40)),
                guidance_scale=float(job.get("guidance", 5.0)),
                generator=torch.Generator("cuda").manual_seed(int(job.get("seed", 42))))
    if mode == "flf":
        last = Image.open(io.BytesIO(base64.b64decode(job["last_b64"]))).convert("RGB").resize((w, h))
        args["last_image"] = last
    frames = pipe(**args).frames[0]
    out = "/tmp/out.mp4"
    export_to_video(frames, out, fps=int(job.get("fps", 16)))
    return open(out, "rb").read()


@app.function(image=img_image, gpu="H100", volumes={MODEL_DIR: models}, timeout=1800,
              memory=98304, max_containers=1, scaledown_window=180)
def make_images(job: dict) -> list:
    """Qwen Image Edit 2509: 1 to 3 reference images (style and characters) plus a prompt -> new images.
    job: {refs_b64: [..], prompts: [..], steps?, cfg?, seed?, width?, height?} -> list of PNG base64 strings."""
    import torch
    from PIL import Image
    from diffusers import QwenImageEditPlusPipeline
    pipe = QwenImageEditPlusPipeline.from_pretrained(EDIT_ID, torch_dtype=torch.bfloat16, cache_dir=MODEL_DIR + "/hf/hub")
    pipe.to("cuda")
    refs = [Image.open(io.BytesIO(base64.b64decode(b))).convert("RGB") for b in job["refs_b64"]]
    outs = []
    for i, prompt in enumerate(job["prompts"]):
        kw = dict(image=refs, prompt=prompt, negative_prompt=job.get("negative", " "),
                  num_inference_steps=int(job.get("steps", 40)), true_cfg_scale=float(job.get("cfg", 4.0)),
                  guidance_scale=1.0, generator=torch.Generator("cuda").manual_seed(int(job.get("seed", 0)) + i))
        if job.get("width"): kw["width"] = int(job["width"]); kw["height"] = int(job["height"])
        im = pipe(**kw).images[0]
        buf = io.BytesIO(); im.save(buf, format="PNG"); outs.append(base64.b64encode(buf.getvalue()).decode())
    return outs


def _check(key):
    from fastapi import HTTPException
    if not key or key != os.environ["LP_KEY"]:
        raise HTTPException(status_code=401, detail="bad key")


@app.function(image=web_image, secrets=[secret])
@modal.asgi_app()
def web():
    from fastapi import FastAPI, Header, Request
    from fastapi.responses import JSONResponse
    api = FastAPI()

    @api.get("/health")
    def health():
        return {"ok": True}

    @api.post("/download")
    def dl(body: dict, x_lp_key: str = Header(None)):
        _check(x_lp_key)
        ids = {"i2v": I2V_ID, "flf": FLF_ID, "edit": EDIT_ID, "animate": ANIM2_ID}
        call = download.spawn(ids[body.get("mode", "i2v")])
        return {"call_id": call.object_id}

    @api.post("/submit")
    def submit(job: dict, x_lp_key: str = Header(None)):
        _check(x_lp_key)
        call = generate.spawn(job)
        return {"call_id": call.object_id}

    @api.post("/animate")
    def anim(job: dict, x_lp_key: str = Header(None)):
        _check(x_lp_key)
        return {"call_id": animate.spawn(job).object_id}

    @api.post("/images")
    def images(job: dict, x_lp_key: str = Header(None)):
        _check(x_lp_key)
        call = make_images.spawn(job)
        return {"call_id": call.object_id}

    @api.get("/result")
    def result(call_id: str, x_lp_key: str = Header(None)):
        _check(x_lp_key)
        fc = modal.FunctionCall.from_id(call_id)
        try:
            out = fc.get(timeout=0)
        except TimeoutError:
            return JSONResponse({"status": "running"}, status_code=202)
        except Exception as e:
            return JSONResponse({"status": "error", "error": repr(e)[:2000]}, status_code=500)
        if isinstance(out, bytes):
            return {"status": "done", "video_b64": base64.b64encode(out).decode()}
        if isinstance(out, list):
            return {"status": "done", "images_b64": out}
        return {"status": "done", "result": out}

    return api
