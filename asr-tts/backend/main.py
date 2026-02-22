import os
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

ASR_MODEL_PATH = os.getenv("ASR_MODEL_PATH", "/app/models/whisper-small-ct2")

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
