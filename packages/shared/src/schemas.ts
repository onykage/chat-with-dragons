import { z } from "zod";

export const TileType = z.enum(["wall","floor","door","stairs_up","stairs_down","water","lava","void"]);
export const FeatureType = z.enum(["trap","chest","altar","fountain","secret_door","crack","rock","torch","sign"]);
export const EntityKind = z.enum(["npc","mob","boss","merchant","mage","player"]);

export const Vec2 = z.object({ x: z.number().int(), y: z.number().int() });

export const Room = z.object({
  id: z.string(),
  rect: z.object({ x: z.number().int(), y: z.number().int(), w: z.number().int(), h: z.number().int() }),
  tags: z.array(z.string()).optional()
});

export const Feature = z.object({
  id: z.string(),
  type: FeatureType,
  pos: Vec2,
  data: z.record(z.any()).optional(),
  hidden: z.boolean().optional()
});

export const Entity = z.object({
  id: z.string(),
  kind: EntityKind,
  name: z.string(),
  pos: Vec2,
  level: z.number().int().min(1),
  hostile: z.boolean().optional(),
  ai: z.string().optional(),
  data: z.record(z.any()).optional()
});

export const Grid = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  tiles: z.array(z.array(TileType)) // [height][width]
});

export const Dungeon = z.object({
  id: z.string(),
  seed: z.string(),
  level: z.number().int().min(1),
  createdAt: z.string(), // ISO
  ttlSeconds: z.number().int().positive(),
  grid: Grid,
  rooms: z.array(Room),
  features: z.array(Feature),
  entities: z.array(Entity),
  entrances: z.array(Vec2),
  exits: z.array(Vec2)
});

export type Dungeon = z.infer<typeof Dungeon>;
