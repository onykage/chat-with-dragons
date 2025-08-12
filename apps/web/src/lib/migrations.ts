import { getDb } from "@/lib/db"

export const MIGRATION_FILES = ["/scripts/sql/0001_init.sql", "/scripts/sql/0002_add_custom_textures.sql"]

export async function readSql(filePath: string): Promise<string> {
  // Works in Next.js by fetching the file path
  const res = await fetch(filePath)
  if (!res.ok) throw new Error(`Failed to load ${filePath}: ${res.status} ${await res.text()}`)
  return await res.text()
}

export function splitStatements(sqlText: string): string[] {
  // Simple splitter that works for straightforward schema files (no PL/pgSQL blocks)
  return sqlText
    .split(/;\s*(?:\n|$)/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function runMigrations() {
  const sql = getDb()
  if (!sql) {
    throw new Error("DATABASE_URL is not set. Set it in your environment before running migrations.")
  }

  const applied: { file: string; statements: number }[] = []

  for (const path of MIGRATION_FILES) {
    console.log("Applying migration:", path)
    try {
      const text = await readSql(path)
      const statements = splitStatements(text)

      for (const stmt of statements) {
        if (stmt.trim()) {
          // Use unsafe() for DDL statements that can't use parameters
          await sql.unsafe(stmt)
        }
      }

      applied.push({ file: path, statements: statements.length })
      console.log(`Applied ${statements.length} statements from ${path}`)
    } catch (error) {
      console.error(`Failed to apply migration ${path}:`, error)
      throw error
    }
  }

  return { applied }
}
