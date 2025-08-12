import type { NextRequest } from "next/server"
import { getDb } from "@/lib/db"

// This would be the structure expected from the dungeon generator
type GeneratedDungeonData = {
  refId: string
  guild: string
  dungeonNumber: number
  level?: number
  width: number
  height: number
  tiles: Array<{
    x: number
    y: number
    type: string
    walkable?: boolean
    description?: string
  }>
  rooms?: Array<{
    x: number
    y: number
    width: number
    height: number
    type: string
  }>
  metadata?: {
    difficulty: number
    theme: string
    generatedAt: string
  }
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const refId = id

  console.log("=== DUNGEON API CALLED ===")
  console.log("Requested refId:", refId)

  if (!refId) {
    console.log("ERROR: Missing refId")
    return new Response("Missing reference ID", { status: 400 })
  }

  const db = getDb()
  console.log("Database connection available:", !!db)

  // First try to get from database using the reference ID
  if (db) {
    try {
      console.log("Querying database for refId:", refId)
      const rows = await db`
        select * from generated_dungeons 
        where id = ${refId}
        limit 1
      `

      console.log("Database query result:", rows.length, "rows found")

      if (rows.length > 0) {
        const row = rows[0]
        console.log("Found dungeon in database:", row.id)
        const dungeonData: GeneratedDungeonData = {
          refId: row.id,
          guild: row.guild,
          dungeonNumber: row.dungeon_number,
          level: row.level || 1,
          width: row.width,
          height: row.height,
          tiles: row.tiles,
          metadata: row.metadata || {},
        }
        console.log("Returning database dungeon")
        return Response.json(dungeonData)
      } else {
        console.log("No dungeon found in database with refId:", refId)
      }
    } catch (error) {
      console.error("Database error fetching dungeon by refId:", error)
      // Fall through to mock generation
    }
  } else {
    console.log("No database connection available")
  }

  // If not found in database, try to parse the refId for fallback generation
  console.log("=== ATTEMPTING FALLBACK GENERATION ===")
  console.log("Parsing refId:", refId)

  // Expected format: guild-dungeonNumber-level-timestamp-randomId
  // Example: test-guild-123-L1-1754872163453-l8jlsl
  // But the guild could contain hyphens, so we need to parse from the end
  const parts = refId.split("-")
  console.log("RefId parts:", parts)

  if (parts.length >= 3) {
    let guild = ""
    let dungeonNumber = 0
    let level = 1

    if (parts.length >= 4) {
      // Try to find the dungeon number by looking for a numeric part
      let dungeonNumberIndex = -1
      let levelIndex = -1

      // Look for level indicator (starts with L or is numeric)
      for (let i = parts.length - 3; i >= 0; i--) {
        const part = parts[i]
        if (part.startsWith("L") && !isNaN(Number(part.substring(1)))) {
          levelIndex = i
          level = Number(part.substring(1))
          break
        } else if (!isNaN(Number(part)) && Number(part) > 0 && Number(part) < 100) {
          levelIndex = i
          level = Number(part)
          break
        }
      }

      // Look for dungeon number (should be before level)
      if (levelIndex > 0) {
        for (let i = levelIndex - 1; i >= 0; i--) {
          const part = parts[i]
          if (!isNaN(Number(part))) {
            dungeonNumberIndex = i
            dungeonNumber = Number(part)
            break
          }
        }
      } else {
        // No level found, look for any numeric part
        for (let i = parts.length - 3; i >= 0; i--) {
          const part = parts[i]
          if (!isNaN(Number(part))) {
            dungeonNumberIndex = i
            dungeonNumber = Number(part)
            break
          }
        }
      }

      // Guild is everything before the dungeon number
      if (dungeonNumberIndex > 0) {
        guild = parts.slice(0, dungeonNumberIndex).join("-")
      } else {
        guild = parts[0]
        for (let i = 1; i < parts.length - 2; i++) {
          if (!isNaN(Number(parts[i]))) {
            dungeonNumber = Number(parts[i])
            break
          }
        }
      }
    } else {
      // Simple case: guild-number-level
      guild = parts[0]
      if (!isNaN(Number(parts[1]))) {
        dungeonNumber = Number(parts[1])
      }
      if (parts.length > 2) {
        const levelPart = parts[2]
        if (levelPart.startsWith("L")) {
          level = Number(levelPart.substring(1)) || 1
        } else if (!isNaN(Number(levelPart))) {
          level = Number(levelPart)
        }
      }
    }

    console.log("Parsed values:", { guild, dungeonNumber, level })

    if (guild && dungeonNumber > 0) {
      try {
        console.log("Generating mock dungeon for:", { refId, guild, dungeonNumber, level })

        const mockDungeon: GeneratedDungeonData = {
          refId,
          guild,
          dungeonNumber,
          level,
          width: 20,
          height: 15,
          tiles: generateMockDungeonTiles(20, 15, dungeonNumber + level),
          rooms: [
            { x: 2, y: 2, width: 4, height: 3, type: "chamber" },
            { x: 14, y: 8, width: 5, height: 4, type: "treasure_room" },
            { x: 7, y: 11, width: 6, height: 3, type: "corridor" },
          ],
          metadata: {
            difficulty: Math.min(dungeonNumber + level, 10),
            theme: ["dungeon", "cave", "ruins", "crypt"][(dungeonNumber + level) % 4],
            generatedAt: new Date().toISOString(),
          },
        }

        console.log("Generated mock dungeon successfully")
        return Response.json(mockDungeon)
      } catch (error) {
        console.error("Failed to generate mock dungeon:", error)
        return new Response(`Failed to generate dungeon: ${error}`, { status: 500 })
      }
    } else {
      return new Response(`Could not parse refId: ${refId}. Expected format: guild-number-level-timestamp-id`, {
        status: 400,
      })
    }
  } else {
    return new Response(`Invalid refId format: ${refId}`, { status: 400 })
  }
}

function generateMockDungeonTiles(
  width: number,
  height: number,
  seed: number,
): Array<{
  x: number
  y: number
  type: string
  walkable?: boolean
  description?: string
}> {
  const tiles: Array<{
    x: number
    y: number
    type: string
    walkable?: boolean
    description?: string
  }> = []

  // Simple seeded random for consistent generation
  let random = seed
  const nextRandom = () => {
    random = (random * 1103515245 + 12345) & 0x7fffffff
    return random / 0x7fffffff
  }

  // Fill with walls first
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push({
        x,
        y,
        type: "wall",
        walkable: false,
      })
    }
  }

  // Create some rooms and corridors
  const rooms = [
    { x: 2, y: 2, width: 4, height: 3 },
    { x: 14, y: 8, width: 5, height: 4 },
    { x: 7, y: 11, width: 6, height: 3 },
    { x: 3, y: 8, width: 3, height: 2 },
    { x: 12, y: 3, width: 4, height: 3 },
  ]

  // Carve out rooms
  rooms.forEach((room) => {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const index = y * width + x
          tiles[index] = {
            x,
            y,
            type: "room",
            walkable: true,
          }
        }
      }
    }
  })

  // Add corridors
  for (let x = 6; x <= 14; x++) {
    const index = 9 * width + x
    tiles[index] = {
      x,
      y: 9,
      type: "corridor",
      walkable: true,
    }
  }

  for (let y = 5; y <= 11; y++) {
    const index = y * width + 9
    tiles[index] = {
      x: 9,
      y,
      type: "corridor",
      walkable: true,
    }
  }

  for (let x = 3; x <= 6; x++) {
    const index = 4 * width + x
    tiles[index] = {
      x,
      y: 4,
      type: "corridor",
      walkable: true,
    }
  }

  // Add entrance and exit
  tiles[1 * width + 1] = {
    x: 1,
    y: 1,
    type: "entrance",
    walkable: true,
    description: "The entrance to this dungeon level",
  }

  tiles[(height - 2) * width + (width - 2)] = {
    x: width - 2,
    y: height - 2,
    type: "exit",
    walkable: true,
    description: "The exit to the next level",
  }

  // Add random features
  const numFeatures = 3 + (seed % 4)
  for (let i = 0; i < numFeatures; i++) {
    const x = Math.floor(nextRandom() * (width - 2)) + 1
    const y = Math.floor(nextRandom() * (height - 2)) + 1
    const index = y * width + x

    if (tiles[index].type === "room" || tiles[index].type === "corridor") {
      const featureType = nextRandom() < 0.5 ? "treasure" : "trap"
      tiles[index] = {
        x,
        y,
        type: featureType,
        walkable: true,
        description:
          featureType === "treasure" ? "A glinting treasure chest" : "Something seems off about this floor...",
      }
    }
  }

  return tiles
}
