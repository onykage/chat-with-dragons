// scripts/migrate.ts
// Run SQL migrations against Neon using DATABASE_URL.
// Works locally (reads files via fs) and in v0 preview (fetch fallback).
import { getDb } from "@/lib/db"
import { runMigrations } from "../lib/migrations"

async function readSql(filePath: string): Promise<string> {
  // Try filesystem first (local dev/CI)
  try {
    const { readFile } = await import("node:fs/promises")
    const { join } = await import("node:path")
    const p = join(process.cwd(), filePath.replace(/^\//, ""))
    return await readFile(p, "utf8")
  } catch {
    // Fallback to fetch (v0 preview/next-lite)
    const res = await fetch(filePath)
    if (!res.ok) throw new Error(`Failed to fetch ${filePath}: ${res.status} ${await res.text()}`)
    return await res.text()
  }
}

function splitStatements(sqlText: string): string[] {
  // Naive splitter on semicolons at line ends (sufficient for our simple schema).
  return sqlText
    .split(/;\s*(?:\n|$)/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

async function main() {
  const sql = getDb()
  if (!sql) {
    console.error("Missing DATABASE_URL environment variable.")
    process.exit(1)
  }

  try {
    console.log("Starting database migration...")
    await runMigrations()
    console.log("Migration completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

main()
