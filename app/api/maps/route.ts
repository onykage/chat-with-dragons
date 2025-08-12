import type { NextRequest } from "next/server"
import { getDb, memoryStore } from "@/lib/db"
import { type MapRow, toMapRow, fromMapRow } from "@/lib/schema"
import { runMigrations } from "@/lib/migrations"

async function ensureMigrationsIfMissing(e: any) {
  try {
    const msg = String(e?.message || "")
    const code = (e && (e.code as string)) || ""
    console.log("Checking if migration needed:", { msg, code })

    // Table or column missing -> run migrations, then caller can retry once
    if (msg.includes("relation") && msg.includes("does not exist")) {
      console.log("Table missing, running migrations...")
      await runMigrations()
      return true
    }
    if (msg.includes("column") && msg.includes("does not exist")) {
      console.log("Column missing, running migrations...")
      await runMigrations()
      return true
    }
    if (code === "42P01" || code === "42703") {
      console.log("PostgreSQL error code indicates missing table/column, running migrations...")
      await runMigrations()
      return true
    }
    return false
  } catch (migrationError) {
    console.warn("Migration failed:", migrationError)
    return false
  }
}

function mapMemoryList() {
  // Normalize memory rows to API shape
  return memoryStore.list().map((row) => ({
    ...fromMapRow(row),
    customTextures: row.custom_textures || [],
  }))
}

export async function GET() {
  const db = getDb()
  if (!db) {
    return Response.json(mapMemoryList(), { status: 200 })
  }

  try {
    const rows =
      await db`select id, name, width, height, tiles, custom_textures from maps order by created_at desc limit 100`
    const maps = rows.map((row) => ({
      ...fromMapRow(row),
      customTextures: row.custom_textures || [],
    }))
    return Response.json(maps, { status: 200 })
  } catch (e) {
    console.warn("GET /api/maps DB error:", e)
    // Try to auto-migrate once, then retry
    if (await ensureMigrationsIfMissing(e)) {
      try {
        const rows =
          await db!`select id, name, width, height, tiles, custom_textures from maps order by created_at desc limit 100`
        const maps = rows.map((row) => ({
          ...fromMapRow(row),
          customTextures: row.custom_textures || [],
        }))
        return Response.json(maps, { status: 200 })
      } catch (retryError) {
        console.warn("GET /api/maps retry failed, falling back to memory:", retryError)
      }
    }
    // Always fall back to memory instead of throwing
    return Response.json(mapMemoryList(), { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id?: string
      name: string
      width: number
      height: number
      tiles: string[][]
      customTextures?: any[]
    }

    if (!body?.name || !body?.width || !body?.height || !body?.tiles) {
      return new Response("Invalid payload", { status: 400 })
    }

    const id = crypto.randomUUID()
    const row: MapRow = toMapRow({
      ...body,
      id,
      custom_textures: body.customTextures || [],
    })

    const db = getDb()
    if (!db) {
      memoryStore.save(row)
      return Response.json({ ...fromMapRow(row), customTextures: row.custom_textures || [] }, { status: 201 })
    }

    try {
      await db`
        insert into maps (id, name, width, height, tiles, custom_textures)
        values (${row.id}, ${row.name}, ${row.width}, ${row.height}, ${JSON.stringify(row.tiles)}, ${JSON.stringify(
          row.custom_textures || [],
        )})
      `
      return Response.json({ ...fromMapRow(row), customTextures: row.custom_textures || [] }, { status: 201 })
    } catch (e) {
      console.warn("POST /api/maps DB error:", e)
      if (await ensureMigrationsIfMissing(e)) {
        // retry once
        try {
          await db`
            insert into maps (id, name, width, height, tiles, custom_textures)
            values (${row.id}, ${row.name}, ${row.width}, ${row.height}, ${JSON.stringify(row.tiles)}, ${JSON.stringify(
              row.custom_textures || [],
            )})
          `
          return Response.json({ ...fromMapRow(row), customTextures: row.custom_textures || [] }, { status: 201 })
        } catch (e2) {
          console.warn("POST /api/maps retry failed, saving to memory:", e2)
        }
      }
      // Always fall back to memory instead of throwing
      memoryStore.save(row)
      return Response.json({ ...fromMapRow(row), customTextures: row.custom_textures || [] }, { status: 201 })
    }
  } catch (parseError) {
    console.error("POST /api/maps parse error:", parseError)
    return new Response("Invalid JSON payload", { status: 400 })
  }
}
