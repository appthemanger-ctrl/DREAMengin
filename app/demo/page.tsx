// app/demo/page.tsx
// Demo page for torus grid navigation

import DreamSpaceDemo from './DreamSpaceDemo';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Dreamengin Demo
          </h1>
          <p className="text-slate-300">
            Torus grid navigation with wrapping in both directions
          </p>
        </div>
        
        <DreamSpaceDemo />
        
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>Use arrow keys or swipe to navigate</p>
          <p>Navigation wraps in all directions</p>
        </div>
      </div>
    </div>
  );
}
