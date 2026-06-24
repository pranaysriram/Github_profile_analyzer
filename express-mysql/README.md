# GitHub Profile Analyzer

Backend service that analyzes a GitHub user profile via the **GitHub public API** and stores useful insights in **MySQL**.

**Stack:** Node.js · Express.js · MySQL · Axios

---

## Features

- Fetch public profile data from GitHub by username.
- Aggregates useful insights across the user's repositories:
  - Public repo count, gists, followers, following
  - Total stars and forks across owned (non-fork) repos
  - Top programming language + full language distribution
  - Top 5 repositories by stars
  - Account created / last updated timestamps
- Persists / upserts the analysis to MySQL.
- REST API to list all analyzed profiles and to fetch a single profile.
- Optional `GITHUB_TOKEN` to raise GitHub rate limits (60/hr → 5000/hr).

---

## Setup

### 1. Prerequisites
- Node.js 18+
- A running MySQL 8.x instance

### 2. Install
```bash
cd express-mysql
cp .env.example .env   # then fill in DB credentials
npm install
```

### 3. Create the database / tables
Either run the migration script:
```bash
npm run migrate
```
Or load `schema.sql` manually:
```bash
mysql -u root -p < schema.sql
```

### 4. Run
```bash
npm run dev     # with nodemon
# or
npm start
```
Server: `http://localhost:3000`

---

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/profiles/analyze` | Body `{ "username": "torvalds" }` — fetches from GitHub and stores insights |
| `GET`  | `/api/profiles` | List all analyzed profiles (summary fields) |
| `GET`  | `/api/profiles/:username` | Full stored insights for one profile |
| `DELETE` | `/api/profiles/:username` | Remove a stored profile |
| `GET`  | `/health` | Health check |

### Example
```bash
curl -X POST http://localhost:3000/api/profiles/analyze \
  -H "Content-Type: application/json" \
  -d '{"username":"torvalds"}'

curl http://localhost:3000/api/profiles
curl http://localhost:3000/api/profiles/torvalds
```

---

## Database schema

See [`schema.sql`](./schema.sql). Single table `profiles` with a unique key on `username` (used for upsert via `ON DUPLICATE KEY UPDATE`). JSON columns store the language distribution and the top-repos snapshot.

---

## Postman collection

Import [`postman_collection.json`](./postman_collection.json) — set the `baseUrl` variable to your deployed URL.

---

## Deployment notes

This is a standard Node/Express app. Deploy anywhere Node runs (Render, Railway, Fly.io, a VPS, etc.) and point it at a managed MySQL instance (PlanetScale, Railway MySQL, AWS RDS, etc.). Required env vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, optional `GITHUB_TOKEN`, `PORT`.

After deploying, replace the Postman `baseUrl` variable with your live URL.
