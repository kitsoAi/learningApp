# Local Setup

## 1) Create env file

From repo root:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## 2) Start with Docker Compose

```bash
docker compose up -d --build
```

## 3) Verify services

- Frontend: `http://localhost:3000`
- Backend API docs: `http://localhost:8000/docs`
- Backend health: `http://localhost:8000/health`

## 4) Useful commands

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

## Notes

- Database starts as part of compose (`postgres` service).
- If Google/Firebase values are empty, related auth flows may be unavailable, but core local app routes can still run.
- For the separate PuoSpeech service link, set `NEXT_PUBLIC_PUOSPEECH_URL` in `.env` (default `http://localhost:3001`).
