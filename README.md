# Discord Dungeon (Monorepo)

A 1980s‑style Graphical‑MUD dungeon crawler targeting Discord.  
This monorepo contains the web client, a dungeon generator/adapter CLI, shared types/schemas, and
service scaffolding for the authoritative game server.

## Quick start

```bash
# 1) Install pnpm (if needed)
npm i -g pnpm

# 2) Install deps
pnpm install

# 3) Bring up Postgres + Redis locally
docker compose up -d

# 4) Dev the web client
pnpm --filter @apps/web dev

# 5) Generate a sample dungeon JSON to console
pnpm --filter @apps/generator start -- --seed 12345
```

## Packages

- `packages/shared` — Zod schemas for the canonical dungeon format + adapters.
- `apps/web` — Next.js client with a retro console and a JSON viewer.
- `apps/generator` — CLI that converts an existing generator object (e.g., `[wall]`) into the canonical JSON and prints it to stdout; also writes `out/dungeon.json`.
- `services/game` — Node service scaffold (Express + WebSocket) for the authoritative game loop.
- `services/gateway` — WebSocket gateway scaffold (fan‑out to clients).
- `services/bot` — Discord bot scaffold (not enabled yet).

## Database

Local dev uses Dockerized **Postgres** and **Redis** (see `docker-compose.yml`).  
In production, use any managed Postgres (e.g., Neon, Supabase, RDS). Redis can be Upstash or any managed provider.

## Adapter flow

If your current generator outputs arrays like `[wall], [room], ...`, plug it into `apps/generator/src/fromLegacy.ts` by mapping to tiles + features. The CLI will then validate and emit the canonical `Dungeon` JSON (see `packages/shared`).
