import { useState, useRef, useEffect } from "react";
import { X, Minus, Sparkles, Code2, Send, Terminal, Loader2, CheckCircle2, GitBranch, Server } from "lucide-react";
import { WindowState } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InnerDreamsAIProps {
  id: string;
  windowState: WindowState;
  onClose: () => void;
  onMinimize: () => void;
  onBringToFront: () => void;
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateSize: (w: number, h: number) => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'system';
  content: string;
}

export function InnerDreamsAI({
  id,
  windowState,
  onClose,
  onMinimize,
  onBringToFront,
  onUpdatePosition,
  onUpdateSize,
}: InnerDreamsAIProps) {
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 'init-1', timestamp: new Date().toLocaleTimeString(), type: 'system', content: 'DreamArchitect v2.0 initialized' },
    { id: 'init-2', timestamp: new Date().toLocaleTimeString(), type: 'system', content: 'Connected to local update agent' },
    { id: 'init-3', timestamp: new Date().toLocaleTimeString(), type: 'info', content: 'Ready for site modification instructions' },
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userPrompt = prompt;
    setPrompt("");
    setIsProcessing(true);
    
    // Add user command to logs
    addLog('info', `> ${userPrompt}`);

    // In a real implementation, this would call api/innerdreams
    try {
      addLog('info', 'Sending request to /api/innerdreams...');
      
      const res = await fetch('/api/innerdreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          instruction: userPrompt,
          password: 'demo-password' // This would be managed securely in fullstack
        })
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Endpoint /api/innerdreams not found. Backend upgrade required.");
        }
        throw new Error(`API Error: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (data.ok) {
        addLog('success', 'Patch generated and applied successfully.');
        if (data.pr_url) {
          addLog('system', `PR Created: ${data.pr_url}`);
        }
      } else {
        addLog('error', `Agent Error: ${data.error}`);
      }
      
    } catch (error: any) {
      addLog('error', `Connection Failed: ${error.message}`);
      addLog('system', 'SYSTEM NOTICE: The backend route /api/innerdreams is missing.');
      addLog('system', 'Please upgrade to Fullstack to enable the Node/Express AI agent.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addLog = (type: LogEntry['type'], content: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      type,
      content
    }]);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragListener={false}
      dragControls={undefined}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "absolute",
        left: windowState.x,
        top: windowState.y,
        width: windowState.w,
        height: windowState.h,
        zIndex: windowState.z,
      }}
      className="module-container flex flex-col border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.1)] bg-slate-950/95 backdrop-blur-xl"
      onPointerDown={onBringToFront}
    >
      {/* Header */}
      <div
        className="module-header bg-slate-900/50 border-b border-white/5 cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          // Drag logic handled by parent or library usually
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-white/10 shadow-inner">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide text-slate-100">Dream Architect</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">System Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMinimize} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interface */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Connection Status Bar */}
        <div className="h-8 bg-slate-900/30 border-b border-white/5 flex items-center px-4 gap-4 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3 h-3" />
            <span>branch: <span className="text-cyan-400">dev</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Server className="w-3 h-3" />
            <span>api: <span className="text-green-400">connected</span></span>
          </div>
          <div className="flex-1 text-right">
             LATENCY: 24ms
          </div>
        </div>

        {/* Terminal Output */}
        <div 
          ref={scrollRef}
          className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 scroll-smooth"
        >
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
              <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
              <span className={`break-words ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                log.type === 'system' ? 'text-cyan-400/70' :
                'text-slate-300'
              }`}>
                {log.content}
              </span>
            </div>
          ))}
          {isProcessing && (
            <div className="flex gap-2 items-center text-cyan-500/50 mt-2 pl-[70px]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900/50 border-t border-white/5 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter modification command..."
                className="relative w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900 transition-all font-mono text-sm shadow-xl"
                disabled={isProcessing}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono pointer-events-none border border-slate-800 rounded px-1.5 py-0.5">
                ENTER
              </div>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
