import { AnchorWidgetOrchestrator } from '@/components/AnchorWidgetOrchestrator';

export default function AnchorWidgetDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AnchorWidget Demo
          </h1>
          <p className="text-gray-600 mb-8">
            Ultra-technical execution of Home/Profile/Shrunk mode control with gesture-driven navigation.
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Features</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">🎯</span>
                <span><strong>Tap:</strong> Opens Home/Profile or restores from Shrunk mode</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">⏱️</span>
                <span><strong>Hold (420ms):</strong> Opens Dream selector overlay</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🏠</span>
                <span><strong>Home Mode:</strong> 8 customizable widget slots</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">👤</span>
                <span><strong>Profile Mode:</strong> Freeform widget space with transforms</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📦</span>
                <span><strong>Shrunk Mode:</strong> 12 priority widget launchers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🔄</span>
                <span><strong>Atomic Flips:</strong> O(1) mode transitions without remounting</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">💾</span>
                <span><strong>Persistence:</strong> State saved via idle callbacks</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🔗</span>
                <span><strong>Widget Links:</strong> Cross-widget communication via event bus</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">Try it out!</h3>
            <p className="text-blue-800 text-sm">
              The anchor widget is at the bottom center of the screen. Tap to toggle modes,
              hold for 420ms to trigger the Dream selector.
            </p>
          </div>
        </div>
      </div>
      
      {/* Anchor widget orchestrator */}
      <AnchorWidgetOrchestrator />
    </div>
  );
}
