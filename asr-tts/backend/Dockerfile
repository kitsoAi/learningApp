FROM python:3.11-slim
WORKDIR /app
RUN apt-get update \
  && apt-get install -y ffmpeg libsndfile1 \
  && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
# Force CPU-only torch wheels to avoid downloading CUDA packages.
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
    torch==2.4.1+cpu \
    torchaudio==2.4.1+cpu \
  && pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
