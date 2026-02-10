# Universal Logging System (ULS)

Monorepo containing frontend (Next.js) and backend (Express + MongoDB).

See `backend/README.md` and `frontend/README.md` for run & deploy instructions.

Quick start (dev):

1. Start MongoDB (Atlas or local) and set `backend/.env` with `MONGODB_URI` and `API_KEY`.
2. Install backend dependencies and start server:

```bash
cd backend
npm install
npm run dev
```

3. Install frontend and start:

```bash
cd ../frontend
npm install
npm run dev
```

Send a sample log via curl (replace API_KEY):

```bash
curl -X POST http://localhost:4000/api/logs \
	-H "Content-Type: application/json" \
	-H "x-api-key: replace-with-secure-key" \
	-d '{"timestamp":"2026-02-09T10:30:00Z","service_name":"auth-service","log_level":"ERROR","message":"Token validation failed","server_id":"server-01","trace_id":"xyz789"}'
```

