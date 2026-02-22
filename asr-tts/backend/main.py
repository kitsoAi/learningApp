import os
import tempfile
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from faster_whisper import WhisperModel
from starlette.background import BackgroundTask
from TTS.api import TTS

ASR_MODEL_PATH = os.getenv("ASR_MODEL_PATH", "/app/models/whisper-small-ct2")
XTTS_MODEL_DIR = os.getenv("XTTS_MODEL_DIR", "/app/xtts")
XTTS_SPEAKER_WAV = os.getenv("XTTS_SPEAKER_WAV", "")
XTTS_LANGUAGE = os.getenv("XTTS_LANGUAGE", "")

app = FastAPI(title="PuoSpeech AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://100.52.241.249",
        "http://100.52.241.249:3000",
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = WhisperModel(ASR_MODEL_PATH, device="cpu", compute_type="int8")

def _cleanup(path: str) -> None:
    if os.path.exists(path):
        os.remove(path)

def _load_tts() -> TTS | None:
    if not XTTS_MODEL_DIR or not os.path.isdir(XTTS_MODEL_DIR):
        return None
    model_path = os.path.join(XTTS_MODEL_DIR, "model.pth")
    config_path = os.path.join(XTTS_MODEL_DIR, "config.json")
    if not os.path.exists(model_path) or not os.path.exists(config_path):
        return None
    return TTS(model_path=model_path, config_path=config_path, progress_bar=False, gpu=False)

tts_model = _load_tts()

@app.get("/health")
def health():
    return {"status": "ok", "model_path": ASR_MODEL_PATH}

@app.post("/transcribe-speech")
async def transcribe_speech(user_audio: UploadFile = File(...)):
    suffix = os.path.splitext(user_audio.filename or "audio.wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await user_audio.read())
        tmp_path = tmp.name
    try:
        segments, _ = model.transcribe(tmp_path)

        text = " ".join([s.text for s in segments]).strip()
        return {"transcription": text, "filename": user_audio.filename, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ASR failed: {e}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/translate-speech")
async def translate_speech(user_audio: UploadFile = File(...)):
    suffix = os.path.splitext(user_audio.filename or "audio.wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await user_audio.read())
        tmp_path = tmp.name
    try:
        segments, _ = model.transcribe(tmp_path, task="translate", beam_size=5)
        text = " ".join([s.text for s in segments]).strip()
        return {"translation": text, "filename": user_audio.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translate failed: {e}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/tts")
async def tts(text_in: dict = Body(...)):
    text = (text_in.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if tts_model is None:
        raise HTTPException(status_code=500, detail="XTTS model not loaded")

    out_path = os.path.join(tempfile.gettempdir(), f"tts_{uuid.uuid4().hex}.wav")

    if XTTS_SPEAKER_WAV:
        tts_model.tts_to_file(
            text=text,
            speaker_wav=XTTS_SPEAKER_WAV,
            language=XTTS_LANGUAGE or None,
            file_path=out_path,
        )
    else:
        tts_model.tts_to_file(
            text=text,
            language=XTTS_LANGUAGE or None,
            file_path=out_path,
        )

    return FileResponse(
        out_path,
        media_type="audio/wav",
        filename="tts.wav",
        background=BackgroundTask(_cleanup, out_path),
    )
