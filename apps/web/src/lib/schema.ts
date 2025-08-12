export type TileType = "floor" | "wall" | "water" | "tree" | string

export type TileCategory = "floor" | "wall" | "object"
export type MovementRequirement = "none" | "fly" | "swim" | "climb" | "teleport"

export type TileProperties = {
  id: string
  name: string
  description: string
  category: TileCategory
  walkable: boolean
  movementRequirement: MovementRequirement
  blocksVision: boolean
}

export type CustomTexture = {
  id: string
  name: string
  url: string
  type: "sprite"
  originalMap?: string
  gridX: number
  gridY: number
  properties?: TileProperties
}

export type MapRow = {
  id: string
  name: string
  width: number
  height: number
  tiles: string[][]
  custom_textures?: CustomTexture[]
  created_at: string
}

export function toMapRow(input: {
  id: string
  name: string
  width: number
  height: number
  tiles: string[][]
  custom_textures?: CustomTexture[]
}): MapRow {
  return {
    ...input,
    created_at: new Date().toISOString(),
  }
}

export function fromMapRow(row: Pick<MapRow, "id" | "name" | "width" | "height" | "tiles" | "custom_textures">) {
  return row
}
