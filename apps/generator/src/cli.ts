#!/usr/bin/env node
import { Dungeon } from "@shared/core";
import { z } from "zod";
import { fromLegacy } from "./fromLegacy.js";
import { sampleLegacy } from "./sampleLegacy.js";
import fs from "node:fs";
import path from "node:path";

// Very small arg parser
const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const seedIdx = args.indexOf("--seed");
const outPath = outIdx !== -1 ? args[outIdx+1] : "out/dungeon.json";
const seed = seedIdx !== -1 ? args[seedIdx+1] : sampleLegacy.seed;

// Swap your real generator here.
const legacy = { ...sampleLegacy, seed };

const dungeon = fromLegacy(legacy);

// Validate and pretty print JSON
import("@shared/core").then(({ Dungeon: DungeonSchema }) => {
  const parsed = DungeonSchema.parse(dungeon);
  const json = JSON.stringify(parsed, null, 2);
  const outDir = path.dirname(outPath);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, json);
  console.log(json); // emit to console for easy copy/paste
});
