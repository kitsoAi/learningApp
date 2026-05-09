# Deploying Backend to Vercel

This backend is prepared to run on Vercel as a FastAPI app from the `backend/` directory.

## Project setup

1. Create a new Vercel project from this repository.
2. Set the **Root Directory** to `backend`.
3. Keep the framework detection automatic.
4. Deploy with the Python runtime using:
   - [pyproject.toml](./pyproject.toml)
   - [main.py](./main.py)

## Required environment variables

Set these in the Vercel project before the first production deployment:

```env
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@YOUR_POOLER_HOST:6543/postgres
SECRET_KEY=replace-with-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=https://your-frontend-domain.vercel.app
ALLOWED_ORIGINS=["https://your-frontend-domain.vercel.app","https://your-custom-domain.com"]
DB_POOL_MODE=transaction
DB_SSL_MODE=require
```

## Optional environment variables

Add these only if you use the related features:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-backend-domain.vercel.app/api/v1/auth/google/callback
FIREBASE_PROJECT_ID=
DB_DISABLE_POSTGRES_JIT=false
```

## Notes for serverless Postgres

- Use a pooled serverless Postgres connection string, such as a Supabase transaction pooler URL on port `6543`.
- The backend automatically switches to `NullPool` for transaction-pooled connections.
- SSL is enabled automatically for non-local database hosts, but `DB_SSL_MODE=require` is recommended in production so the intent is explicit.

## Known limitation

Local disk uploads are intentionally disabled on Vercel.

These endpoints return `501` on Vercel until you move media storage to an external service:

- `POST /api/v1/users/upload`
- `POST /api/v1/admin/content/upload`

Recommended replacements:

- Vercel Blob
- AWS S3
- Supabase Storage

## Local verification

From `backend/`:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
vercel dev
```

## Deployment

From `backend/`:

```powershell
vc deploy
```

For production:

```powershell
vc deploy --prod
```
