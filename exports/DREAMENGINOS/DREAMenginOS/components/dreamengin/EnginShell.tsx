'use client';
import React from 'react';

export default function EnginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#050A14] text-[#E0F7FA] selection:bg-[#FFD700] selection:text-black">
      {/* The Glass Header */}
      <nav className="sticky top-0 z-50 p-4 backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-black tracking-tighter text-[#FFD700]">DREAMENGIN<span className="text-white">OS</span></h1>
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        </div>
      </nav>
      
      <section className="p-4 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </section>
    </main>
  );
}
