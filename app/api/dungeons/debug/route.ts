// Debug endpoint to test dungeon generation and analyze the results
export async function GET() {
  console.log("=== DUNGEON DEBUG GENERATION ===")

  // Generate a test dungeon
  const refId = `debug-test-1-L1-${Date.now()}-debug`
  const guild = "debug-test"
  const dungeonNumber = 1
  const level = 1
  const width = 20
  const height = 15
  const seed = dungeonNumber + level

  console.log("Generating debug dungeon:", { refId, guild, dungeonNumber, level, width, height, seed })

  // Generate tiles using the same logic as the API
  const tiles = generateMockDungeonTiles(width, height, seed)

  // Convert to 2D grid format like the game does
  const convertedMap = convertTilesToGrid(tiles, width, height)

  // Analyze the results
  const analysis = analyzeDungeon(tiles, convertedMap, width, height)

  // Find spawn point
  const spawnPoint = findFirstWalkableInGrid(convertedMap)

  return Response.json({
    refId,
    guild,
    dungeonNumber,
    level,
    width,
    height,
    seed,
    originalTiles: tiles,
    convertedGrid: convertedMap.tiles,
    analysis,
    spawnPoint,
    debugInfo: {
      totalTiles: tiles.length,
      gridSize: convertedMap.tiles.length * convertedMap.tiles[0]?.length,
      firstFewTiles: tiles.slice(0, 10),
      firstRowOfGrid: convertedMap.tiles[0],
      lastRowOfGrid: convertedMap.tiles[convertedMap.tiles.length - 1],
    },
  })
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
  console.log("Generating tiles for debug dungeon:", { width, height, seed })

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

  console.log("Created", tiles.length, "wall tiles")

  // Create some rooms and corridors
  const rooms = [
    { x: 2, y: 2, width: 4, height: 3 },
    { x: 14, y: 8, width: 5, height: 4 },
    { x: 7, y: 11, width: 6, height: 3 },
    { x: 3, y: 8, width: 3, height: 2 },
    { x: 12, y: 3, width: 4, height: 3 },
  ]

  console.log("Carving out rooms:", rooms)

  // Carve out rooms
  rooms.forEach((room, roomIndex) => {
    console.log(`Carving room ${roomIndex}:`, room)
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
  console.log("Adding corridors")

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

  console.log("Added entrance at (1,1) and exit at", width - 2, height - 2)

  // Add some random features based on seed
  const numFeatures = 3 + (seed % 4)
  console.log("Adding", numFeatures, "random features")

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
      console.log(`Added ${featureType} at (${x}, ${y})`)
    }
  }

  const walkableCount = tiles.filter((t) => t.walkable).length
  console.log("Final tile count:", tiles.length, "walkable:", walkableCount)

  return tiles
}

function convertTilesToGrid(
  tiles: Array<{ x: number; y: number; type: string; walkable?: boolean }>,
  width: number,
  height: number,
) {
  console.log("Converting tiles to grid format")

  // Initialize with walls
  const grid: string[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => "wall"))

  // Place tiles from the array
  tiles.forEach((tile) => {
    if (tile.x >= 0 && tile.x < width && tile.y >= 0 && tile.y < height) {
      grid[tile.y][tile.x] = mapTileType(tile.type)
    }
  })

  console.log("Grid conversion complete")

  return {
    id: `debug-${Date.now()}`,
    name: "Debug Dungeon",
    width,
    height,
    tiles: grid,
  }
}

function mapTileType(type: string): string {
  // Map database tile types to our internal types
  const typeMap: Record<string, string> = {
    wall: "wall",
    room: "floor",
    corridor: "floor",
    entrance: "entrance",
    exit: "exit",
    treasure: "treasure",
    trap: "trap",
    secret: "secret",
    door: "door",
    water: "water",
    tree: "tree",
  }
  return typeMap[type] || "wall"
}

function analyzeDungeon(originalTiles: any[], convertedMap: any, width: number, height: number) {
  const originalWalkable = originalTiles.filter((t) => t.walkable).length

  let gridWalkable = 0
  const tileTypeCounts: Record<string, number> = {}

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tileType = convertedMap.tiles[y][x]
      tileTypeCounts[tileType] = (tileTypeCounts[tileType] || 0) + 1

      // Check if walkable based on tile properties
      if (isWalkableTileType(tileType)) {
        gridWalkable++
      }
    }
  }

  return {
    originalTileCount: originalTiles.length,
    originalWalkableCount: originalWalkable,
    gridTileCount: width * height,
    gridWalkableCount: gridWalkable,
    tileTypeCounts,
    conversionLoss: originalWalkable - gridWalkable,
  }
}

function isWalkableTileType(tileType: string): boolean {
  const walkableTiles = ["floor", "entrance", "exit", "treasure", "trap", "secret", "door"]
  return walkableTiles.includes(tileType)
}

function findFirstWalkableInGrid(map: any): { x: number; y: number } | null {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tileType = map.tiles[y][x]
      if (isWalkableTileType(tileType)) {
        return { x, y }
      }
    }
  }
  return null
}
