
'use client';
import { useState } from 'react';

function ProjectileRange(){
  const [v,setV]=useState(20); const [deg,setDeg]=useState(45);
  const g = 9.81;
  const rad = deg * Math.PI/180;
  const R = (v*v*Math.sin(2*rad))/g;
  return (<div className="card p-3">
    <div className="font-medium">Projectile Range</div>
    <div className="text-xs text-gray-600">R = v^2 sin(2θ) / g</div>
    <div className="flex gap-2 mt-2">
      <input type="number" value={v} onChange={e=>setV(+e.target.value)} className="border rounded px-2 py-1 w-28"/> m/s
      <input type="number" value={deg} onChange={e=>setDeg(+e.target.value)} className="border rounded px-2 py-1 w-28"/> °
    </div>
    <div className="mt-2 text-sm">Range ≈ <b>{R.toFixed(2)}</b> m</div>
  </div>);
}

function OhmsLaw(){
  const [i,setI]=useState(1); const [r,setR]=useState(100);
  const V = i*r;
  return (<div className="card p-3">
    <div className="font-medium">Ohm's Law</div>
    <div className="text-xs text-gray-600">V = I × R</div>
    <div className="flex gap-2 mt-2">
      <input type="number" value={i} onChange={e=>setI(+e.target.value)} className="border rounded px-2 py-1 w-28"/> A
      <input type="number" value={r} onChange={e=>setR(+e.target.value)} className="border rounded px-2 py-1 w-28"/> Ω
    </div>
    <div className="mt-2 text-sm">Voltage ≈ <b>{V.toFixed(2)}</b> V</div>
  </div>);
}

export default function Lab(){
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Science Lab</h1>
      <p className="text-sm text-gray-600">Sandbox machines for physics/math demos. (More soon)</p>
      <div className="grid md:grid-cols-2 gap-4">
        <ProjectileRange />
        <OhmsLaw />
      </div>
    </div>
  );
}
