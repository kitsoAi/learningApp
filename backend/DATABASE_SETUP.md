# Database Setup for FastAPI Backend

## Quick Setup (Windows)

### Option 1: Using Docker (Recommended)

```powershell
# Install Docker Desktop if not already installed
# Then run:
docker run --name puolingo-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=puolingo -p 5432:5432 -d postgres:15
```

### Option 2: Install PostgreSQL Locally

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install and remember your password
3. Open pgAdmin or psql and create the database:

```sql
CREATE DATABASE puolingo;
```

### Option 3: Use existing PostgreSQL

If you already have PostgreSQL running, just create the database:

```powershell
# Using psql command line
psql -U postgres
CREATE DATABASE duolingo_clone;
\q
```

## Update .env file

Make sure your `.env` file has the correct connection string:

```env
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/puolingo
```

Replace `YOUR_PASSWORD` with your actual PostgreSQL password.

## Start the Server

```powershell
python -m uvicorn main:app --reload
```

The server will automatically create all tables on startup!

## Verify Setup

Visit http://localhost:8000/docs to see the API documentation.
