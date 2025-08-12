import type { NextRequest } from "next/server"
import { getDb, memoryStore } from "@/lib/db"
import { fromMapRow } from "@/lib/schema"
import { runMigrations } from "@/lib/migrations"

async function ensureMigrationsIfMissing(e: any) {
  try {
    const msg = String(e?.message || "")
    const code = (e && (e.code as string)) || ""
    console.log("Checking if migration needed:", { msg, code })

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

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const db = getDb()

  if (!db) {
    const row = memoryStore.get(id)
    if (!row) return new Response("Not found", { status: 404 })
    return Response.json({ ...fromMapRow(row), customTextures: row.custom_textures || [] }, { status: 200 })
  }

  try {
    const rows = await db`select id, name, width, height, tiles, custom_textures from maps where id = ${id} limit 1`
    if (rows.length === 0) return new Response("Not found", { status: 404 })
    const row = rows[0]
    return Response.json(
      {
        ...fromMapRow(row),
        customTextures: row.custom_textures || [],
      },
      { status: 200 },
    )
  } catch (e) {
    console.warn(`GET /api/maps/${id} DB error:`, e)
    if (await ensureMigrationsIfMissing(e)) {
      try {
        const rows = await db`select id, name, width, height, tiles, custom_textures from maps where id = ${id} limit 1`
        if (rows.length === 0) return new Response("Not found", { status: 404 })
        const row = rows[0]
        return Response.json(
          {
            ...fromMapRow(row),
            customTextures: row.custom_textures || [],
          },
          { status: 200 },
        )
      } catch (retryError) {
        console.warn(`GET /api/maps/${id} retry failed, falling back to memory:`, retryError)
      }
    }
    // Fall back to memory
    const row = memoryStore.get(id)
    if (!row) return new Response("Not found", { status: 404 })
    return Response.json({ ...fromMapRow(row), customTextures: row.custom_textures || [] }, { status: 200 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const body = (await req.json()) as {
      name: string
      width: number
      height: number
      tiles: string[][]
      customTextures?: any[]
    }

    const db = getDb()
    if (!db) {
      const row = memoryStore.get(id)
      if (!row) return new Response("Not found", { status: 404 })
      const updated = {
        ...row,
        name: body.name,
        width: body.width,
        height: body.height,
        tiles: body.tiles,
        custom_textures: body.customTextures || [],
      }
      memoryStore.save(updated)
      return Response.json({ ...fromMapRow(updated), customTextures: updated.custom_textures || [] }, { status: 200 })
    }

    async function tryUpdate() {
      const rows = await db!`
        update maps
        set name = ${body.name}, 
            width = ${body.width}, 
            height = ${body.height}, 
            tiles = ${JSON.stringify(body.tiles)},
            custom_textures = ${JSON.stringify(body.customTextures || [])}
        where id = ${id}
        returning id, name, width, height, tiles, custom_textures
      `
      if (rows.length === 0) return new Response("Not found", { status: 404 })
      const row = rows[0]
      return Response.json(
        {
          ...fromMapRow(row),
          customTextures: row.custom_textures || [],
        },
        { status: 200 },
      )
    }

    try {
      return await tryUpdate()
    } catch (e) {
      console.warn(`PUT /api/maps/${id} DB error:`, e)
      if (await ensureMigrationsIfMissing(e)) {
        try {
          return await tryUpdate()
        } catch (e2) {
          console.warn(`PUT /api/maps/${id} retry failed, writing to memory:`, e2)
        }
      }
      // Fall back to memory
      const row = memoryStore.get(id)
      if (!row) return new Response("Not found", { status: 404 })
      const updated = {
        ...row,
        name: body.name,
        width: body.width,
        height: body.height,
        tiles: body.tiles,
        custom_textures: body.customTextures || [],
      }
      memoryStore.save(updated)
      return Response.json({ ...fromMapRow(updated), customTextures: updated.custom_textures || [] }, { status: 200 })
    }
  } catch (parseError) {
    console.error(`PUT /api/maps/${id} parse error:`, parseError)
    return new Response("Invalid JSON payload", { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const db = getDb()

  if (!db) {
    const ok = memoryStore.delete(id)
    return new Response(ok ? "Deleted" : "Not found", { status: ok ? 200 : 404 })
  }

  try {
    await db`delete from maps where id = ${id}`
    return new Response("Deleted", { status: 200 })
  } catch (e) {
    console.warn(`DELETE /api/maps/${id} DB error:`, e)
    // Fall back to memory
    const ok = memoryStore.delete(id)
    return new Response(ok ? "Deleted" : "Not found", { status: ok ? 200 : 404 })
  }
}
