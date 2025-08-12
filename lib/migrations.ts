import { getDb } from "./db"

export async function runMigrations() {
  const sql = getDb()
  if (!sql) {
    throw new Error("No database connection available for migrations")
  }

  console.log("Running database migrations...")

  try {
    // Create maps table
    await sql`
      CREATE TABLE IF NOT EXISTS maps (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        tiles JSONB NOT NULL,
        custom_textures JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create generated_dungeons table
    await sql`
      CREATE TABLE IF NOT EXISTS generated_dungeons (
        id TEXT PRIMARY KEY,
        ref_id TEXT UNIQUE,
        guild_id TEXT NOT NULL,
        dungeon_number INTEGER NOT NULL,
        level INTEGER DEFAULT 1,
        seed INTEGER NOT NULL,
        map_data JSONB NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create index on ref_id for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_generated_dungeons_ref_id 
      ON generated_dungeons(ref_id)
    `

    // Create index on guild_id and dungeon_number
    await sql`
      CREATE INDEX IF NOT EXISTS idx_generated_dungeons_guild_dungeon 
      ON generated_dungeons(guild_id, dungeon_number)
    `

    console.log("Database migrations completed successfully")
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  }
}
