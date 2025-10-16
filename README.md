
# Appointment Booking API

Production-ready Node.js (Fastify) API for managing branches, slots, and bookings backed by PostgreSQL.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Build & Run (Docker)](#build--run-docker)
- [Build & Run (Docker Compose)](#build--run-docker-compose)
- [Local Development](#local-development)
- [Testing](#testing)
- [Health & Troubleshooting](#health--troubleshooting)

---

## Prerequisites
- Node.js 22+ (only if running locally)
- Docker 24+ and Docker Compose V2

## Environment Variables
Create a `.env` file at the project root (used by compose and local dev):

```env
# Web
ENV=local
NODE_ENV=development
SERVICE_LOG_LEVEL=info
WEB_SERVER_HOST=0.0.0.0
WEB_SERVER_PORT=4000
CORS_ALLOWED_ORIGINS=http://localhost:3000|http://localhost
EXPIRE_BOOKINGS_INTERVAL_MS = 300000

# PostgreSQL (container-to-container DNS dsn: db:5432)
POSTGRESQL_HOST=db
POSTGRESQL_PORT=5432
POSTGRESQL_DATABASE=appointments
POSTGRESQL_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRESQL_CONNECTION_LIMIT=10
POSTGRESQL_ALLOW_EXIT_ON_IDLE=false

Build & Run (Docker Compose)

docker-compose.yml

Run
npm run build
docker compose up --build

Logs
docker compose logs -f app

Local Development

Install deps and run:
npm install
npm run dev

Make sure your .env points to your local Postgres, e.g.:
POSTGRESQL_HOST=localhost
POSTGRESQL_PORT=5432


open to see the swagger doc: http://localhost:4000/

Health & Troubleshooting

Port already in use (EADDRINUSE 4000):
	Something else is bound to port 4000 in your host or inside a running container.
		Fix:
			lsof -i :4000         # or netstat -tlnp in Linux
			docker compose down
			docker ps             # verify no leftover containers

No app logs in docker compose logs -f app:
	Confirm the container is running and your CMD points to the compiled entry: dist/src/app.js.
		Exec into container and check:
			docker compose exec app sh
			node -v
			ls -R dist
			node dist/src/app.js


Cannot connect to DB from the container:
	If using Compose, use POSTGRESQL_HOST=db.
	If using a host Postgres, use POSTGRESQL_HOST=host.docker.internal (macOS/Windows).
Graceful shutdowns:
	The app listens to SIGINT/SIGTERM and closes the server cleanly.

Notes
	The Dockerfile uses multi-stage builds for fast, minimal images.
	The container runs as a non-root user.