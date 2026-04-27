'use client';

/**
 * BuilderPanel — Visual Character Builder tool for the Games Engine app.
 *
 * 32×32 pixel graph editor with paint mode, color palette, and save-to-state.
 * Lives at /engines/games/builder.
 */

import { useState, useCallback, type KeyboardEvent } from 'react';
import { Save, Trash2, Info, Sparkles } from 'lucide-react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';

const GRID_SIZE = 32;

type PixelType = 'transparent' | 'outline' | 'skin' | 'hair' | 'primary' | 'secondary' | 'accent' | 'shadow';

interface PixelDef {
  type: PixelType;
  label: string;
  color: string;
}

const PIXELS: PixelDef[] = [
  { type: 'transparent', label: 'Clear', color: '#111118' },
  { type: 'outline', label: 'Ink', color: '#05060a' },
  { type: 'skin', label: 'Skin', color: '#f2b28d' },
  { type: 'hair', label: 'Hair', color: '#51311f' },
  { type: 'primary', label: 'Suit A', color: '#38bdf8' },
  { type: 'secondary', label: 'Suit B', color: '#7c3aed' },
  { type: 'accent', label: 'Power', color: '#facc15' },
  { type: 'shadow', label: 'Shadow', color: '#334155' },
];

const cellId = (row: number, col: number) => `character-pixel-${row}-${col}`;

function makeEmptyGrid(): PixelType[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 'transparent' as PixelType)
  );
}

export default function BuilderPanel() {
  const [grid, setGrid] = useState<PixelType[][]>(makeEmptyGrid);
  const [activePixel, setActivePixel] = useState<PixelType>('primary');
  const [isPainting, setIsPainting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [characterName, setCharacterName] = useState('Original Hero');

  const paintCell = useCallback((row: number, col: number) => {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = activePixel;
      return next;
    });
  }, [activePixel]);

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

  function focusCell(row: number, col: number) {
    document.getElementById(cellId(row, col))?.focus();
  }

  function handleCellKeyDown(event: KeyboardEvent<HTMLButtonElement>, row: number, col: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      paintCell(row, col);
      return;
    }

    const next: [number, number] | null =
      event.key === 'ArrowUp' ? [Math.max(0, row - 1), col] :
      event.key === 'ArrowDown' ? [Math.min(GRID_SIZE - 1, row + 1), col] :
      event.key === 'ArrowLeft' ? [row, Math.max(0, col - 1)] :
      event.key === 'ArrowRight' ? [row, Math.min(GRID_SIZE - 1, col + 1)] :
      null;

    if (next) {
      event.preventDefault();
      focusCell(next[0], next[1]);
    }
  }

  function clearGrid() {
    setGrid(makeEmptyGrid());
    setSaved(false);
  }

  function saveCharacter() {
    bridge.emit('games', 'games:asset-exported', {
      assetId: characterName || 'original-character',
      assetType: 'character',
      dimensions: `${GRID_SIZE}x${GRID_SIZE}`,
      pixels: grid,
      url: '',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const pixelDef = (type: PixelType) => PIXELS.find((pixel) => pixel.type === type)!;

  return (
    <div
      className="h-full overflow-y-auto p-4 md:p-6"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Character Builder</h1>
          <p className="text-sm text-white/50">Paint an original video game character on a {GRID_SIZE}×{GRID_SIZE} pixel graph</p>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            className="w-full max-w-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c8981a]/60"
            placeholder="Character name"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {PIXELS.map((pixel) => (
            <button
              key={pixel.type}
              onClick={() => setActivePixel(pixel.type)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all select-none"
              style={
                activePixel === pixel.type
                  ? { background: `${pixel.color}33`, color: 'white', border: `1.5px solid ${pixel.color}` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1.5px solid rgba(255,255,255,0.08)' }
              }
            >
              <span className="h-3 w-3 rounded-sm border border-white/20" style={{ background: pixel.color }} />
              {pixel.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto pb-2 mb-5">
          <div
            aria-label={`${GRID_SIZE} by ${GRID_SIZE} character pixel graph`}
            aria-colcount={GRID_SIZE}
            aria-rowcount={GRID_SIZE}
            className="inline-grid border border-white/10 rounded-xl overflow-hidden select-none cursor-crosshair bg-[#111118]"
            role="grid"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
          >
            {grid.map((row, ri) =>
              row.map((cell, ci) => {
                const def = pixelDef(cell);
                return (
                  <button
                    key={`${ri}-${ci}`}
                    id={cellId(ri, ci)}
                    type="button"
                    aria-label={`${def.label} pixel at column ${ci + 1}, row ${ri + 1}`}
                    aria-selected={cell !== 'transparent'}
                    onMouseDown={() => handleMouseDown(ri, ci)}
                    onMouseEnter={() => handleMouseEnter(ri, ci)}
                    onKeyDown={(event) => handleCellKeyDown(event, ri, ci)}
                    role="gridcell"
                    tabIndex={ri === 0 && ci === 0 ? 0 : -1}
                    title={`${def.label} (${ci + 1}, ${ri + 1})`}
                    className="h-3 w-3 border-r border-b border-white/[0.06] p-0 transition-colors focus:outline-none focus:ring-1 focus:ring-[#c8981a] focus:ring-inset sm:h-4 sm:w-4"
                    style={{ background: cell === 'transparent' ? '#111118' : def.color }}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.07] mb-5 text-xs text-white/40">
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          Click or drag to paint pixels. Name your original character, then save to emit a 32×32 character asset to the game runtime.
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={saveCharacter}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c8981a] hover:bg-[#d4a520] text-black text-sm font-bold transition-colors"
          >
            <Save size={14} />
            {saved ? 'Saved ✓' : 'Save Character'}
          </button>
          <button
            onClick={clearGrid}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors"
          >
            <Trash2 size={14} />
            Clear
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-white/40">
            <Sparkles size={13} />
            1,024 cells for clean retro silhouettes, portraits, and playable sprites.
          </span>
        </div>
      </div>
    </div>
  );
}
