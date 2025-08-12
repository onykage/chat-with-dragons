import type { NextRequest } from "next/server"
import { getDb } from "@/lib/db"

// This would be the structure expected from the dungeon generator
type GeneratedDungeonData = {
  guild: string
  dungeonNumber: number
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

export async function GET(_: NextRequest, { params }: { params: { guild: string; dungeonNumber: string } }) {
  const { guild, dungeonNumber } = await params
  const dungeonNum = Number.parseInt(dungeonNumber)

  if (isNaN(dungeonNum)) {
    return new Response("Invalid dungeon number", { status: 400 })
  }

  const db = getDb()

  // First try to get from database
  if (db) {
    try {
      const rows = await db`
        select * from generated_dungeons 
        where guild = ${guild} and dungeon_number = ${dungeonNum} 
        order by level desc limit 1
      `

      if (rows.length > 0) {
        const row = rows[0]
        const dungeonData: GeneratedDungeonData = {
          guild: row.guild,
          dungeonNumber: row.dungeon_number,
          width: row.width,
          height: row.height,
          tiles: row.tiles,
          metadata: row.metadata || {},
        }
        return Response.json(dungeonData)
      }
    } catch (error) {
      console.error("Database error fetching dungeon:", error)
      // Fall through to mock generation
    }
  }

  try {
    // Generate a mock dungeon directly (remove external fetch dependency)
    const mockDungeon: GeneratedDungeonData = {
      guild,
      dungeonNumber: dungeonNum,
      width: 20,
      height: 15,
      tiles: generateMockDungeonTiles(20, 15, dungeonNum),
      rooms: [
        { x: 2, y: 2, width: 4, height: 3, type: "chamber" },
        { x: 14, y: 8, width: 5, height: 4, type: "treasure_room" },
        { x: 7, y: 11, width: 6, height: 3, type: "corridor" },
      ],
      metadata: {
        difficulty: Math.min(dungeonNum, 10),
        theme: ["dungeon", "cave", "ruins", "crypt"][dungeonNum % 4],
        generatedAt: new Date().toISOString(),
      },
    }

    return Response.json(mockDungeon)
  } catch (error) {
    console.error("Failed to generate dungeon:", error)
    return new Response("Failed to generate dungeon", { status: 500 })
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
    { x: 3, y: 8, width: 3, height: 2 }, // Additional room
    { x: 12, y: 3, width: 4, height: 3 }, // Additional room
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

  // Add some corridors connecting rooms
  // Horizontal corridor
  for (let x = 6; x <= 14; x++) {
    const index = 9 * width + x
    tiles[index] = {
      x,
      y: 9,
      type: "corridor",
      walkable: true,
    }
  }

  // Vertical corridor
  for (let y = 5; y <= 11; y++) {
    const index = y * width + 9
    tiles[index] = {
      x: 9,
      y,
      type: "corridor",
      walkable: true,
    }
  }

  // Additional connecting corridors
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

  // Add some random features based on seed
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
