'use client';

import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { Dungeon as DungeonSchema } from '@shared/core';

type Dungeon = z.infer<typeof DungeonSchema>;

export default function Home() {
  const [dungeon, setDungeon] = useState<Dungeon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState<{x:number;y:number}|null>(null);

  async function onGenerate(seed?: string) {
    try {
      setLoading(true);
      const r = await fetch(`/api/dungeon/new?seed=${encodeURIComponent(seed ?? String(Date.now()))}`, { cache: 'no-store' });
      const json = await r.json();
      const d = DungeonSchema.parse(json);
      setDungeon(d);
      setPlayer(d.entrances[0] ?? { x: 0, y: 0 });
      setError(null);
    } catch (e:any) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { onGenerate(); }, []);

  // arrow keys to move within passable tiles
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!dungeon || !player) return;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -1;
      else if (e.key === 'ArrowRight') dx = 1;
      else if (e.key === 'ArrowUp') dy = -1;
      else if (e.key === 'ArrowDown') dy = 1;
      else return;
      e.preventDefault();
      const nx = player.x + dx, ny = player.y + dy;
      const t = dungeon.grid.tiles[ny]?.[nx];
      if (!t) return;
      if (t === 'wall' || t === 'void' || t === 'water' || t === 'lava') return;
      setPlayer({ x: nx, y: ny });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dungeon, player]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = DungeonSchema.parse(JSON.parse(String(reader.result)));
        setDungeon(d);
        setPlayer(d.entrances[0] ?? { x: 0, y: 0 });
        setError(null);
      } catch (err:any) { setError(err.message); }
    };
    reader.readAsText(f);
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 10 }}>Dungeon JSON Viewer</h1>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
        <button onClick={() => onGenerate()} disabled={loading} style={{ padding:'6px 10px' }}>
          {loading ? 'Generating…' : 'Generate new dungeon'}
        </button>
        <span style={{ opacity:.7, fontSize:12 }}>or load a JSON:</span>
        <input type="file" accept="application/json" onChange={onFile} />
      </div>
      {error && <pre style={{ color: "#ff6b6b" }}>{error}</pre>}
      {dungeon && <DungeonView dungeon={dungeon} player={player} />}
    </div>
  );
}

function DungeonView({ dungeon, player }: { dungeon: Dungeon; player: {x:number;y:number}|null }) {
  const cell = 18;
  const w = dungeon.grid.width * cell;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 8 }}>
        <strong>ID:</strong> {dungeon.id} &nbsp; 
        <strong>Seed:</strong> {dungeon.seed} &nbsp; 
        <strong>Level:</strong> {dungeon.level}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${dungeon.grid.width}, ${cell}px)`, gap:1, background:"#333", padding:1, width:w }}>
        {dungeon.grid.tiles.flatMap((row, y) =>
          row.map((t, x) => (
            <Cell key={x+'-'+y} t={t} isPlayer={player?.x===x && player?.y===y} />
          ))
        )}
      </div>
      <legend style={{ marginTop: 10, fontSize: 12, opacity: .8 }}>
        <span style={{ background:"#222", padding:"2px 4px", marginRight:6 }}>Legend</span>
        wall, floor, door, stairs, water, lava, void
      </legend>
    </div>
  );
}

function Cell({ t, isPlayer }: { t: string; isPlayer: boolean }) {
  const map: Record<string,string> = {
    wall: "#404040", floor: "#6aa84f", door: "#b7b7b7",
    stairs_up: "#9fc5e8", stairs_down: "#3d85c6",
    water: "#2e75b6", lava: "#e06666", void: "#111"
  };
  return (
    <div style={{ width: 18, height: 18, background: map[t] ?? "#111", position:'relative' }}>
      {isPlayer && (
        <div style={{ position:'absolute', inset:2, display:'grid', placeItems:'center', fontWeight:700 }}>
          @
        </div>
      )}
    </div>
  );
}
