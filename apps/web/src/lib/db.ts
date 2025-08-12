import { neon } from "@neondatabase/serverless"

type NeonClient = ReturnType<typeof neon>

function resolveDatabaseUrl(): string | null {
  // Try common env names; return the first non-empty one
  const keys = [
    "DATABASE_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL",
    "POSTGRES_URL_NON_POOLING",
    "POSTGRES_URL_NO_SSL",
    "DATABASE_URL_UNPOOLED",
  ] as const
  for (const k of keys) {
    const v = process.env[k]
    if (v && typeof v === "string" && v.trim().length > 0) return v
  }
  return null
}

// Create a Neon client if a DB URL is available (server only).
let client: NeonClient | null = null
export function getDb(): NeonClient | null {
  if (typeof process === "undefined") return null
  const url = resolveDatabaseUrl()
  if (!url) return null
  if (!client) {
    client = neon(url)
  }
  return client
}

// Simple in-memory fallback for preview/testing without a DB.
// Not for production use.
import type { MapRow } from "./schema"

const mem = new Map<string, MapRow>()
export const memoryStore = {
  save(row: MapRow) {
    mem.set(row.id, row)
  },
  get(id: string) {
    return mem.get(id) || null
  },
  list() {
    return Array.from(mem.values()).sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
  },
  delete(id: string) {
    return mem.delete(id)
  },
}
