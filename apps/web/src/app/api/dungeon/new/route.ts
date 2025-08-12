import { NextResponse } from 'next/server';
import { dungeonFromParts } from '@shared/core';

// tiny RNG from a string seed
function seedToInt(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const id = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const seedStr = url.searchParams.get('seed') ?? String(Date.now());
  const level = parseInt(url.searchParams.get('level') ?? '1', 10);

  const rng = mulberry32(seedToInt(seedStr));
  const width = 25, height = 17;
  const tiles = Array.from({ length: height }, () => Array.from({ length: width }, () => 'wall' as const));

  // carve floors with a random walk
  let x = Math.floor(width / 2), y = Math.floor(height / 2);
  tiles[y][x] = 'floor';
  const steps = width * height * 4;
  for (let i = 0; i < steps; i++) {
    const r = rng();
    if (r < 0.25 && x > 1) x--;
    else if (r < 0.5 && x < width - 2) x++;
    else if (r < 0.75 && y > 1) y--;
    else if (y < height - 2) y++;
    tiles[y][x] = 'floor';
  }

  // sprinkle a few doors
  for (let yy = 1; yy < height - 1; yy++) {
    for (let xx = 1; xx < width - 1; xx++) {
      if (tiles[yy][xx] === 'wall') {
        const floors =
          (tiles[yy][xx - 1] === 'floor') + (tiles[yy][xx + 1] === 'floor') +
          (tiles[yy - 1][xx] === 'floor') + (tiles[yy + 1][xx] === 'floor');
        if (floors === 2 && rng() < 0.03) tiles[yy][xx] = 'door' as const;
      }
    }
  }

  const grid = { width, height, tiles };
  const dungeon = dungeonFromParts({ id: id(), seed: seedStr, level, grid });

  // entrance = first floor; exit = last floor
  outer: for (let yy = 0; yy < height; yy++) for (let xx = 0; xx < width; xx++) {
    if (tiles[yy][xx] !== 'wall') { dungeon.entrances = [{ x: xx, y: yy }]; break outer; }
  }
  outer2: for (let yy = height - 1; yy >= 0; yy--) for (let xx = width - 1; xx >= 0; xx--) {
    if (tiles[yy][xx] !== 'wall') { dungeon.exits = [{ x: xx, y: yy }]; break outer2; }
  }

  return NextResponse.json(dungeon);
}
