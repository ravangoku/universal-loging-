# ULS Backend

Requirements:
- Node 18+
- MongoDB (Atlas recommended)

Run locally:

1. Copy `.env.example` to `.env` and fill in `MONGODB_URI` and `API_KEY`.
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

Endpoints:
- `POST /api/logs` - Ingest logs (requires `x-api-key` or Bearer token)
- `GET /api/logs` - Query logs (filters, pagination, export=csv)
- `POST /api/auth/login` - Obtain JWT for UI (demo users: admin/admin, dev/dev)
- `GET /api/docs` - OpenAPI docs
