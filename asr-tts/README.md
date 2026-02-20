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

2. Start model API:

```bash
docker compose --env-file .env up -d
```

3. Verify:

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

1. Push model API image to ECR (`PUOSPEECH_IMAGE`).
2. Run the model service on ECS/EC2 with GPU if XTTS requires it.
3. Put ALB/Nginx in front, terminate TLS.
4. Keep learning app and model API deployed/scaled separately.
