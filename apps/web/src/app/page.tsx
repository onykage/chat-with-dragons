'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Dungeon as DungeonSchema } from '@shared/core';

type Dungeon = z.infer<typeof DungeonSchema>;

export default function Home() {
  const [dungeon, setDungeon] = useState<Dungeon | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const d = DungeonSchema.parse(parsed);
        setDungeon(d);
        setError(null);
      } catch (err:any) {
        setError(err.message);
      }
    };
    reader.readAsText(f);
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 10 }}>Dungeon JSON Viewer</h1>
      <p>Drop a <code>Dungeon</code> JSON here to render a grid and inspect metadata.</p>
      <input type="file" accept="application/json" onChange={onFile} />
      {error && <pre style={{ color: "#ff6b6b" }}>{error}</pre>}
      {dungeon && <DungeonView dungeon={dungeon} />}
    </div>
  );
}

function DungeonView({ dungeon }: { dungeon: Dungeon }) {
  const cell = 18;
  const w = dungeon.grid.width * cell;
  const h = dungeon.grid.height * cell;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 8 }}>
        <strong>ID:</strong> {dungeon.id} &nbsp; 
        <strong>Seed:</strong> {dungeon.seed} &nbsp; 
        <strong>Level:</strong> {dungeon.level}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${dungeon.grid.width}, ${cell}px)`, gap: 1, background:"#333", padding:1, width: w }}>
        {dungeon.grid.tiles.flatMap((row, y) =>
          row.map((t, x) => <Cell key={x+"-"+y} t={t} />)
        )}
      </div>
      <legend style={{ marginTop: 10, fontSize: 12, opacity: .8 }}>
        <span style={{ background:"#222", padding:"2px 4px", marginRight:6 }}>Legend</span>
        wall, floor, door, stairs, water, lava, void
      </legend>
    </div>
  );
}

function Cell({ t }: { t: string }) {
  const map: Record<string,string> = {
    wall: "#404040",
    floor: "#6aa84f",
    door: "#b7b7b7",
    stairs_up: "#9fc5e8",
    stairs_down: "#3d85c6",
    water: "#2e75b6",
    lava: "#e06666",
    void: "#111"
  };
  return <div title={t} style={{ width: 18, height: 18, background: map[t] ?? "#111" }} />;
}
