# Quick Start - PostgreSQL Setup (No Docker)

Since Docker Desktop is not running, here are your options:

## Option 1: Install PostgreSQL for Windows (Recommended)

1. **Download PostgreSQL**:
   - Go to: https://www.postgresql.org/download/windows/
   - Download the installer (PostgreSQL 15 or 16)
   - Run the installer

2. **During Installation**:
   - Set password to: `postgres` (or remember what you choose)
   - Keep default port: `5432`
   - Install pgAdmin (included)

3. **Create Database**:
   After installation, open **SQL Shell (psql)** from Start Menu:

   ```
   Server [localhost]: (press Enter)
   Database [postgres]: (press Enter)
   Port [5432]: (press Enter)
   Username [postgres]: (press Enter)
   Password: (enter your password)

   postgres=# CREATE DATABASE puolingo;
   postgres=# \q
   ```

4. **Update .env file**:
   If you used a different password, update the `.env` file:

   ```
   DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/puolingo
   ```

5. **Start the server**:
   ```powershell
   python -m uvicorn main:app --reload
   ```

## Option 2: Start Docker Desktop

If you have Docker Desktop installed but it's not running:

1. Open Docker Desktop from Start Menu
2. Wait for it to start (may take 1-2 minutes)
3. Then run:
   ```powershell
   docker run --name puolingo-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=puolingo -p 5432:5432 -d postgres:15
   ```

## Option 3: Use a Cloud Database (Free Tier)

**Supabase** (Free PostgreSQL):

1. Go to https://supabase.com
2. Create free account
3. Create new project
4. Copy the connection string
5. Update `.env` with the connection string

## Verify Setup

Once PostgreSQL is running, start the server:

```powershell
python -m uvicorn main:app --reload
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

Then visit: http://localhost:8000/docs
