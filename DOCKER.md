# Docker Setup Guide

This guide explains how to run the Learning Application using Docker.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+

## Quick Start

1. **Copy environment file**

   ```bash
   cp .env.docker .env
   ```

2. **Edit `.env` file with your credentials**
   - Set a secure `SECRET_KEY`
   - Add your Google OAuth credentials

3. **Build and start all services**

   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Services

### PostgreSQL Database

- **Port**: 5432
- **Database**: puolingo
- **User**: postgres
- **Password**: postgres (change in production!)

### Backend (FastAPI)

- **Port**: 8000
- **Health Check**: http://localhost:8000/health

### Frontend (Next.js)

- **Port**: 3000

## Common Commands

### Start services

```bash
docker-compose up
```

### Start in detached mode (background)

```bash
docker-compose up -d
```

### Stop services

```bash
docker-compose down
```

### View logs

```bash
docker-compose logs -f
```

### Rebuild after code changes

```bash
docker-compose up --build
```

### Run database migrations

```bash
docker-compose exec backend alembic upgrade head
```

### Seed the database

```bash
docker-compose exec backend python seed.py
```

## Development vs Production

### Development

The current setup is optimized for development with:

- Hot reload disabled (rebuild required for changes)
- Exposed ports for direct access
- Volume mounts for uploads

### Production Considerations

For production deployment:

1. Change default passwords in `docker-compose.yml`
2. Use environment-specific `.env` files
3. Enable HTTPS/SSL
4. Use a reverse proxy (nginx, traefik)
5. Set up proper backup strategies for volumes
6. Use Docker secrets for sensitive data

## Troubleshooting

### Port already in use

If ports 3000, 5432, or 8000 are already in use:

```bash
# Stop conflicting services or change ports in docker-compose.yml
```

### Database connection errors

```bash
# Ensure PostgreSQL is healthy
docker-compose ps

# Check backend logs
docker-compose logs backend
```

### Frontend can't connect to backend

- Verify `NEXT_PUBLIC_API_URL` in `.env`
- Check backend health: http://localhost:8000/health

### DNS Resolution Issues (Docker for Windows)

If you see errors like `Could not resolve 'deb.debian.org'` during the build process:

1.  **Force IPv4**: The backend `Dockerfile` is already configured to force IPv4 for `apt`, which solves most DNS issues on Windows.
2.  **Manual DNS**: If it still fails, try setting specific DNS servers in Docker Desktop:
    - Settings > Docker Engine > Add `"dns": ["8.8.8.8", "8.8.4.4"]` to the JSON.
3.  **Check Host Connectivity**: Run `ping deb.debian.org` from your host PowerShell to ensure your network is connected.

### Clean restart

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Rebuild and start fresh
docker-compose up --build
```

## Volume Management

### Persistent Data

- `postgres_data`: Database files
- `./uploads`: User-uploaded media files

### Backup uploads

```bash
# Create backup
tar -czf uploads-backup.tar.gz uploads/

# Restore backup
tar -xzf uploads-backup.tar.gz
```

## Updates and Deployment

### Pulling latest changes

```bash
git pull origin main
docker-compose up --build
```

### Zero-downtime updates (production)

```bash
# Build new images
docker-compose build

# Rolling update
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend
```
