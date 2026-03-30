'use client';

/**
 * CampaignsPanel — Campaign ROI calculator and manager for the Brand Engine app.
 *
 * Live CPM/CPC/ROI calculations, campaign list management.
 * Lives at /engines/brand/campaigns.
 */

import { useState } from 'react';
import { DollarSign, TrendingUp, Plus, Trash2, Calculator } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  budget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

const INIT_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Spring Drop Launch',   budget: 500,  impressions: 84200, clicks: 1680, conversions: 42, revenue: 2100 },
  { id: '2', name: 'Collab Promo Series',  budget: 300,  impressions: 52000, clicks: 940,  conversions: 28, revenue: 1400 },
];

function calcMetrics(c: Campaign) {
  const cpm    = c.impressions > 0 ? (c.budget / c.impressions) * 1000 : 0;
  const cpc    = c.clicks > 0 ? c.budget / c.clicks : 0;
  const roi    = c.budget > 0 ? ((c.revenue - c.budget) / c.budget) * 100 : 0;
  const cvr    = c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0;
  const roas   = c.budget > 0 ? c.revenue / c.budget : 0;
  return { cpm, cpc, roi, cvr, roas };
}

export default function CampaignsPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INIT_CAMPAIGNS);
  const [showCalc, setShowCalc] = useState(false);
  const [calc, setCalc] = useState({ budget: 500, impressions: 80000, clicks: 1500, conversions: 40, revenue: 2000 });
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  function removeCampaign(id: string) {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  function addCampaign() {
    if (!newName.trim()) return;
    setCampaigns((prev) => [...prev, {
      id: Date.now().toString(),
      name: newName.trim(),
      budget: calc.budget,
      impressions: calc.impressions,
      clicks: calc.clicks,
      conversions: calc.conversions,
      revenue: calc.revenue,
    }]);
    setNewName('');
    setShowNew(false);
  }

  const calcResult = calcMetrics({ id: '', name: '', ...calc });

  const fmt = (n: number, fixed = 2) => n.toFixed(fixed);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Campaigns</h1>
            <p className="text-sm text-white/50">ROI calculator · campaign manager</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCalc((s) => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all"
            >
              <Calculator size={13} />
              Calculator
            </button>
            <button
              onClick={() => setShowNew((s) => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f472b6]/20 hover:bg-[#f472b6]/30 text-[#f472b6] text-xs font-medium transition-all"
            >
              <Plus size={13} />
              New
            </button>
          </div>
        </div>

        {/* ROI Calculator */}
        {showCalc && (
          <div className="mb-6 p-4 rounded-xl bg-white/[0.04] border border-[#f472b6]/20">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator size={14} className="text-[#f472b6]" />
              ROI Calculator
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {[
                { key: 'budget', label: 'Budget ($)', step: 50 },
                { key: 'impressions', label: 'Impressions', step: 1000 },
                { key: 'clicks', label: 'Clicks', step: 100 },
                { key: 'conversions', label: 'Conversions', step: 5 },
                { key: 'revenue', label: 'Revenue ($)', step: 100 },
              ].map(({ key, label, step }) => (
                <div key={key}>
                  <label className="block text-xs text-white/40 mb-1">{label}</label>
                  <input
                    type="number"
                    value={calc[key as keyof typeof calc]}
                    onChange={(e) => setCalc((p) => ({ ...p, [key]: Number(e.target.value) }))}
                    step={step}
                    min={0}
                    className="w-full px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#f472b6]/50"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: 'CPM',  value: `$${fmt(calcResult.cpm)}` },
                { label: 'CPC',  value: `$${fmt(calcResult.cpc)}` },
                { label: 'CVR',  value: `${fmt(calcResult.cvr)}%` },
                { label: 'ROAS', value: `${fmt(calcResult.roas)}×` },
                { label: 'ROI',  value: `${fmt(calcResult.roi, 1)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center p-2.5 rounded-lg bg-black/20 border border-white/[0.06]">
                  <span className="text-[10px] text-white/30">{label}</span>
                  <span
                    className="text-sm font-bold mt-0.5"
                    style={{ color: label === 'ROI' ? (calcResult.roi >= 0 ? '#4ade80' : '#f87171') : '#f472b6' }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New campaign form */}
        {showNew && (
          <div className="mb-5 p-4 rounded-xl bg-white/[0.04] border border-[#f472b6]/20 flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Campaign name"
              className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#f472b6]/50"
            />
            <button
              onClick={addCampaign}
              disabled={!newName.trim()}
              className="px-4 py-2 rounded-lg bg-[#f472b6] hover:bg-[#ec4899] text-black text-sm font-bold transition-colors disabled:opacity-40"
            >
              Add
            </button>
          </div>
        )}

        {/* Campaign list */}
        <div className="space-y-3">
          {campaigns.map((c) => {
            const m = calcMetrics(c);
            return (
              <div key={c.id} className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                  <DollarSign size={14} className="text-[#f472b6]" />
                  <span className="flex-1 text-sm font-semibold text-white">{c.name}</span>
                  <span className="text-xs text-white/40">Budget: ${c.budget}</span>
                  <button
                    onClick={() => removeCampaign(c.id)}
                    className="text-white/20 hover:text-red-400 transition-colors ml-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-px bg-white/[0.04] text-center text-xs">
                  {[
                    { label: 'CPM',  value: `$${fmt(m.cpm)}` },
                    { label: 'CPC',  value: `$${fmt(m.cpc)}` },
                    { label: 'ROAS', value: `${fmt(m.roas)}×` },
                    { label: 'ROI',  value: `${fmt(m.roi, 1)}%`, isRoi: true },
                  ].map(({ label, value, isRoi }) => (
                    <div key={label} className="py-2 bg-[#0a0a0f]">
                      <div className="text-white/30">{label}</div>
                      <div
                        className="font-bold"
                        style={{ color: isRoi ? (m.roi >= 0 ? '#4ade80' : '#f87171') : '#f472b6' }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm">
            <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
            No campaigns yet — add one above.
          </div>
        )}
      </div>
    </div>
  );
}
