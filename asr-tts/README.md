# ASR-TTS Service Config

This folder keeps PuoSpeech model-serving config separate from the main learning app.

## Goal

- `learningApp` frontend/backend stay independent.
- `PuoSpeech` (ASR + XTTS) runs as a separate model API.
- Frontend links to PuoSpeech via `NEXT_PUBLIC_PUOSPEECH_URL`.

## Local Setup

1. Copy env:

```bash
cp .env.example .env
```

2. Edit `.env` build path to your ASR/TTS code:

```bash
PUOSPEECH_BUILD_CONTEXT=/home/ubuntu/puo_speaker/backend
```

3. Build and start model API:

```bash
docker compose --env-file .env up -d --build
```

4. Verify:

```bash
curl http://localhost:3001/health
```

## Link From Learning App

In `learningApp/.env` set:

```bash
NEXT_PUBLIC_PUOSPEECH_URL=http://localhost:3001
```

The frontend sidebar includes a `PuoSpeech` button that opens this URL.

## AWS Notes

Set the production URL in learning app:

```bash
NEXT_PUBLIC_PUOSPEECH_URL=https://speech.yourdomain.com
```

Typical production flow:

1. Build model API image.
2. Push model API image to ECR (`PUOSPEECH_IMAGE`).
3. Switch compose to use image pulls in production if preferred.
2. Run the model service on ECS/EC2 with GPU if XTTS requires it.
3. Put ALB/Nginx in front, terminate TLS.
4. Keep learning app and model API deployed/scaled separately.
