'use client';

/**
 * AssetsPanel — Asset universe selector for the Portfolio Engine.
 *
 * Browse and toggle assets across market sectors. Selected assets
 * feed into the Optimize panel's QUBO formulation.
 * Lives at /engines/portfolio/assets.
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, CheckCircle2, Circle } from 'lucide-react';

const ACCENT = '#2a8ab8';

interface Asset {
  ticker: string;
  name:   string;
  sector: string;
  price:  number;
  change: number; // percentage
}

const UNIVERSE: Asset[] = [
  { ticker: 'AAPL',  name: 'Apple Inc.',          sector: 'Technology',    price: 189.30, change:  1.24 },
  { ticker: 'MSFT',  name: 'Microsoft Corp.',      sector: 'Technology',    price: 374.51, change:  0.87 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.',         sector: 'Technology',    price: 174.12, change: -0.32 },
  { ticker: 'NVDA',  name: 'NVIDIA Corp.',          sector: 'Technology',    price: 875.40, change:  3.15 },
  { ticker: 'AMZN',  name: 'Amazon.com Inc.',       sector: 'Consumer',      price: 185.07, change:  0.54 },
  { ticker: 'TSLA',  name: 'Tesla Inc.',            sector: 'Consumer',      price: 177.58, change: -1.86 },
  { ticker: 'META',  name: 'Meta Platforms',        sector: 'Technology',    price: 494.20, change:  2.11 },
  { ticker: 'JPM',   name: 'JPMorgan Chase',        sector: 'Finance',       price: 197.45, change: -0.44 },
  { ticker: 'GS',    name: 'Goldman Sachs',         sector: 'Finance',       price: 441.30, change:  0.19 },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway',   sector: 'Finance',       price: 395.10, change:  0.05 },
  { ticker: 'JNJ',   name: 'Johnson & Johnson',     sector: 'Healthcare',    price: 147.82, change: -0.73 },
  { ticker: 'UNH',   name: 'UnitedHealth Group',    sector: 'Healthcare',    price: 512.33, change:  1.02 },
  { ticker: 'XOM',   name: 'Exxon Mobil',           sector: 'Energy',        price: 111.60, change: -0.91 },
  { ticker: 'CVX',   name: 'Chevron Corp.',          sector: 'Energy',        price: 158.30, change: -0.37 },
  { ticker: 'BTC',   name: 'Bitcoin (spot ETF)',    sector: 'Crypto',        price: 67240.0, change:  4.50 },
  { ticker: 'ETH',   name: 'Ethereum (spot ETF)',   sector: 'Crypto',        price: 3420.0,  change:  2.80 },
];

const SECTORS = ['All', ...Array.from(new Set(UNIVERSE.map((a: Record<string, unknown>) => a.sector)))];
const MAX_SELECTED = 6;

export default function AssetsPanel( ){
  const [selected, setSelected] = useState<Set<string>>(
    new Set(['AAPL', 'MSFT', 'NVDA'])
  );
  const [sectorFilter, setSectorFilter] = useState('All');

  function toggle(ticker: string ){
    setSelected((prev: Record<string, unknown>) => {
      const next = new Set(prev);
      if (next.has(ticker)) {
        next.delete(ticker);
      } else if (next.size < MAX_SELECTED) {
        next.add(ticker);
      }
      return next;
    });
  }

  function reset( ){
    setSelected(new Set(['AAPL', 'MSFT', 'NVDA']));
    setSectorFilter('All');
  }

  const filtered = sectorFilter === 'All'
    ? UNIVERSE
    : UNIVERSE.filter((a: Record<string, unknown>) => a.sector === sectorFilter);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Asset Universe</h1>
            <p className="text-sm text-white/50">Select up to {MAX_SELECTED} assets · feeds into Optimize</p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all"
          >
            <RefreshCw size={12} />
            Reset
          </button>
        </div>

        {/* Selected count */}
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-lg mb-4"
          style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}
        >
          <span className="text-sm font-semibold" style={{ color: ACCENT }}>
            {selected.size} / {MAX_SELECTED} assets selected
          </span>
          <div className="flex gap-1.5">
            {Array.from(selected).map((t: Record<string, unknown>) => (
              <span
                key={t}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: `${ACCENT}20`, color: ACCENT }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Sector filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SECTORS.map((s: Record<string, unknown>) => (
            <button
              key={s}
              onClick={() => setSectorFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                sectorFilter === s
                  ? { background: `${ACCENT}22`, color: ACCENT, border: `1px solid ${ACCENT}55` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {s}
            </button>
          ))}
        </div>

        {/* Asset list */}
        <div className="space-y-2">
          {filtered.map((asset: Record<string, unknown>) => {
            const isSelected  = selected.has(asset.ticker);
            const isMaxed     = !isSelected && selected.size >= MAX_SELECTED;
            const isPositive  = asset.change >= 0;

            return (
              <button
                key={asset.ticker}
                onClick={() => toggle(asset.ticker)}
                disabled={isMaxed}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                style={{
                  background:  isSelected ? `${ACCENT}10` : 'rgba(255,255,255,0.02)',
                  border:      `1px solid ${isSelected ? ACCENT + '55' : 'rgba(255,255,255,0.07)'}`,
                  opacity:     isMaxed ? 0.4 : 1,
                  cursor:      isMaxed ? 'not-allowed' : 'pointer',
                }}
              >
                {/* Checkbox */}
                {isSelected
                  ? <CheckCircle2 size={16} style={{ color: ACCENT, flexShrink: 0 }} />
                  : <Circle       size={16} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                }

                {/* Ticker + name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-white">{asset.ticker}</span>
                    <span className="text-xs text-white/30 truncate">{asset.name}</span>
                  </div>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}
                  >
                    {asset.sector}
                  </span>
                </div>

                {/* Price + change */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-white">
                    ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div
                    className="flex items-center justify-end gap-0.5 text-xs font-semibold"
                    style={{ color: isPositive ? '#22c55e' : '#ef4444' }}
                  >
                    {isPositive
                      ? <TrendingUp size={11} />
                      : <TrendingDown size={11} />
                    }
                    {isPositive ? '+' : ''}{asset.change.toFixed(2)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selected.size >= MAX_SELECTED && (
          <p className="text-center text-xs text-white/30 mt-4">
            Maximum {MAX_SELECTED} assets reached — deselect one to swap
          </p>
        )}
      </div>
    </div>
  );
}
