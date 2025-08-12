import { getDb } from "@/lib/db"

export async function GET() {
  const db = getDb()

  if (!db) {
    return Response.json({
      error: "No database connection",
      hasDb: false,
      env: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        POSTGRES_URL: !!process.env.POSTGRES_URL,
      },
    })
  }

  try {
    // Test database connection
    const testQuery = await db`SELECT 1 as test`
    console.log("Database test query result:", testQuery)

    // Check if generated_dungeons table exists
    const tableCheck = await db`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'generated_dungeons'
      );
    `
    console.log("Table exists check:", tableCheck)

    // List all dungeons
    const dungeons = await db`SELECT id, guild, dungeon_number, level FROM generated_dungeons LIMIT 10`
    console.log("Existing dungeons:", dungeons)

    return Response.json({
      success: true,
      hasDb: true,
      tableExists: tableCheck[0]?.exists,
      dungeonCount: dungeons.length,
      dungeons: dungeons,
      testQuery: testQuery,
    })
  } catch (error) {
    console.error("Database test error:", error)
    return Response.json({
      error: error.message,
      hasDb: true,
      testFailed: true,
    })
  }
}
