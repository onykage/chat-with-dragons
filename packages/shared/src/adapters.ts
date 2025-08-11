import { Dungeon, TileType, FeatureType } from "./schemas.js";

// Example legacy token set -> tiles mapping (customize for your generator)
const tokenToTile: Record<string, typeof TileType._type> = {
  wall: "wall",
  room: "floor",
  path: "floor",
  door: "door",
  water: "water",
  void: "void"
};

/**
 * Convert a legacy 2D token grid like [["wall","room"],...] into a Dungeon grid.
 */
export function gridFromLegacy(legacy: string[][]) {
  const height = legacy.length;
  const width = height ? legacy[0].length : 0;
  const tiles = legacy.map(row => row.map(tok => tokenToTile[tok] ?? "void"));
  return { width, height, tiles };
}

/**
 * Build a minimal valid Dungeon with a grid and metadata. Augment as needed.
 */
export function dungeonFromParts(opts: {
  id: string; seed: string; level: number; ttlSeconds?: number;
  grid: ReturnType<typeof gridFromLegacy> | { width:number;height:number;tiles:("wall"|"floor"|"door"|"stairs_up"|"stairs_down"|"water"|"lava"|"void")[][] };
}) {
  const { id, seed, level, grid } = opts;
  const d: Dungeon = {
    id, seed, level, createdAt: new Date().toISOString(),
    ttlSeconds: opts.ttlSeconds ?? 900,
    grid,
    rooms: [], features: [], entities: [],
    entrances: [{ x:0, y:0 }],
    exits: [{ x: grid.width-1, y: grid.height-1 }]
  };
  return d;
}

/**
 * Trim to the payload the web client needs.
 */
export function toClientPayload(d: Dungeon) {
  return {
    grid: d.grid,
    rooms: d.rooms,
    features: d.features,
    entities: d.entities.filter(e => e.kind !== "player"),
    meta: { id: d.id, level: d.level, seed: d.seed }
  };
}
