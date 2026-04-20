'use client';

/**
 * BuilderPanel — Visual World Builder tool for the Games Engine app.
 *
 * 8×8 tile-grid editor with paint mode, tile palette, and save-to-state.
 * Lives at /engines/games/builder.
 */

import { useState, useCallback } from 'react';
import { Save, Trash2, RotateCcw, Info } from 'lucide-react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';

const GRID_SIZE = 8;

type TileType = 'empty' | 'ground' | 'wall' | 'water' | 'lava' | 'coin' | 'spawn' | 'exit';

interface TileDef {
  type: TileType;
  label: string;
  emoji: string;
  color: string;
}

const TILES: TileDef[] = [
  { type: 'empty',  label: 'Empty',  emoji: '⬛', color: '#111118' },
  { type: 'ground', label: 'Ground', emoji: '🟫', color: '#7c5a2a' },
  { type: 'wall',   label: 'Wall',   emoji: '🧱', color: '#6b7280' },
  { type: 'water',  label: 'Water',  emoji: '🌊', color: '#1e40af' },
  { type: 'lava',   label: 'Lava',   emoji: '🔥', color: '#b91c1c' },
  { type: 'coin',   label: 'Coin',   emoji: '🪙', color: '#c8981a' },
  { type: 'spawn',  label: 'Spawn',  emoji: '🟢', color: '#166534' },
  { type: 'exit',   label: 'Exit',   emoji: '🏁', color: '#7c3aed' },
];

function makeEmptyGrid(): TileType[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 'empty' as TileType)
  );
}

export default function BuilderPanel() {
  const [grid, setGrid] = useState<TileType[][]>(makeEmptyGrid);
  const [activeTile, setActiveTile] = useState<TileType>('ground');
  const [isPainting, setIsPainting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [worldName, setWorldName] = useState('My World');

  const paintCell = useCallback((row: number, col: number) => {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = activeTile;
      return next;
    });
  }, [activeTile]);

  function handleMouseDown(row: number, col: number) {
    setIsPainting(true);
    paintCell(row, col);
  }

  function handleMouseEnter(row: number, col: number) {
    if (isPainting) paintCell(row, col);
  }

  function handleMouseUp() {
    setIsPainting(false);
  }

  function clearGrid() {
    setGrid(makeEmptyGrid());
    setSaved(false);
  }

  function saveWorld() {
    bridge.emit('games', 'games:asset-exported', { assetId: worldName || 'world', assetType: 'level', url: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tileDef = (type: TileType) => TILES.find((t) => t.type === type)!;

  return (
    <div
      className="h-full overflow-y-auto p-4 md:p-6"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">World Builder</h1>
          <p className="text-sm text-white/50">Paint a {GRID_SIZE}×{GRID_SIZE} tile map and save it to your game world</p>
        </div>

        {/* World name */}
        <div className="mb-4">
          <input
            type="text"
            value={worldName}
            onChange={(e) => setWorldName(e.target.value)}
            className="w-full max-w-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c8981a]/60"
            placeholder="World name"
          />
        </div>

        {/* Tile palette */}
        <div className="flex flex-wrap gap-2 mb-5">
          {TILES.map((tile) => (
            <button
              key={tile.type}
              onClick={() => setActiveTile(tile.type)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all select-none"
              style={
                activeTile === tile.type
                  ? { background: `${tile.color}33`, color: 'white', border: `1.5px solid ${tile.color}` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1.5px solid rgba(255,255,255,0.08)' }
              }
            >
              <span>{tile.emoji}</span>
              {tile.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div
          className="inline-grid border border-white/10 rounded-xl overflow-hidden select-none cursor-crosshair mb-5"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {grid.map((row, ri) =>
            row.map((cell, ci) => {
              const def = tileDef(cell);
              return (
                <div
                  key={`${ri}-${ci}`}
                  onMouseDown={() => handleMouseDown(ri, ci)}
                  onMouseEnter={() => handleMouseEnter(ri, ci)}
                  title={def.label}
                  className="w-9 h-9 flex items-center justify-center text-lg transition-colors"
                  style={{ background: def.color }}
                >
                  {cell !== 'empty' && <span className="text-sm leading-none pointer-events-none">{def.emoji}</span>}
                </div>
              );
            })
          )}
        </div>

        {/* Tile guide */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.07] mb-5 text-xs text-white/40">
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          Click or drag to paint tiles. Set a world name then Save to emit to the game runtime.
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={saveWorld}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c8981a] hover:bg-[#d4a520] text-black text-sm font-bold transition-colors"
          >
            <Save size={14} />
            {saved ? 'Saved ✓' : 'Save World'}
          </button>
          <button
            onClick={clearGrid}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
