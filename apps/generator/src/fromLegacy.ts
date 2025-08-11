// Adapt your existing generator output here.
// Suppose it returns something like { tokens: string[][], seed: string }
import { gridFromLegacy, dungeonFromParts } from "@shared/core";
import { randomUUID } from "node:crypto";

export function fromLegacy(legacy: { tokens: string[][]; seed: string }) {
  const grid = gridFromLegacy(legacy.tokens);
  return dungeonFromParts({ id: randomUUID(), seed: legacy.seed, level: 1, grid });
}

