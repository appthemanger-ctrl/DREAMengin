'use client';
import React, { useState } from 'react';
import { DSection, DCard, DMetricCard, DBtn, FACE_WRAPPER } from '../DayDreamShell';
const A = '#f472b6';
const RANGES = ['7d','30d','90d','All'];
type Platform = { name:string; icon:string; followers:number; reach:number; engagement:string; color:string };
const PLATFORMS: Platform[] = [
  { name:'Twitter/X',  icon:'𝕏',  followers:0, reach:0, engagement:'0%', color:'#1d9bf0' },
  { name:'Instagram',  icon:'📸', followers:0, reach:0, engagement:'0%', color:'#e1306c' },
  { name:'TikTok',     icon:'🎵', followers:0, reach:0, engagement:'0%', color:'#69c9d0' },
];
export default function AnalyticsFace() {
  const [range, setRange] = useState('30d');
  return (
    <div style={FACE_WRAPPER}>
      {/* Range selector */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {RANGES.map(r => (
          <button key={r} type="button" onClick={() => setRange(r)} style={{ padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', background: range===r?`${A}22`:'rgba(100,150,255,0.06)', border: range===r?`1px solid ${A}55`:'1px solid rgba(100,150,255,0.1)', color: range===r?'rgba(255,180,210,0.95)':'rgba(160,185,255,0.45)' }}>{r}</button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <DBtn label="Export CSV" icon="⬇" accent={A} small ghost />
          <DBtn label="Export PDF" icon="⬇" accent="#94a3b8" small ghost />
        </div>
      </div>
      {/* Key metrics */}
      <DSection title="Overview">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:8 }}>
          <DMetricCard label="Total Reach"   value="—" delta="+0%" accent={A} icon="🌐" />
          <DMetricCard label="Engagements"   value="—" delta="+0%" accent={A} icon="💬" />
          <DMetricCard label="Revenue"       value="$0" delta="+0%" accent={A} icon="💰" />
          <DMetricCard label="Conversions"   value="0" delta="+0%" accent={A} icon="🎯" />
        </div>
        <DCard accent={A} style={{ padding:'12px 14px', textAlign:'center' }}>
          <div style={{ fontSize:11, color:'rgba(160,185,255,0.45)', marginBottom:8 }}>Connect your platforms in Brand Management to see live data</div>
          {/* Simple bar chart placeholder */}
          <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:60, padding:'0 8px' }}>
            {[0.2,0.4,0.3,0.6,0.5,0.8,0.7].map((h,i) => (
              <div key={i} style={{ flex:1, borderRadius:'3px 3px 0 0', background:`linear-gradient(to top,${A}44,${A}22)`, border:`1px solid ${A}33`, height:`${h*100}%` }} />
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d} style={{ fontSize:8, color:'rgba(160,185,255,0.3)' }}>{d}</span>)}
          </div>
        </DCard>
      </DSection>
      {/* Per-platform breakdown */}
      <DSection title="Platforms">
        {PLATFORMS.map(p => (
          <DCard key={p.name} style={{ marginBottom:8, border:`1px solid ${p.color}22` }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${p.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{p.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'rgba(240,244,255,0.9)' }}>{p.name}</div>
                <div style={{ fontSize:10, color:'rgba(160,185,255,0.4)', marginTop:2 }}>
                  {p.followers} followers · {p.reach} reach · {p.engagement} engagement
                </div>
              </div>
              <span style={{ fontSize:10, color:'rgba(160,185,255,0.35)', fontStyle:'italic' }}>Connect to track</span>
            </div>
          </DCard>
        ))}
      </DSection>
    </div>
  );
}
