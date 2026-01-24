import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DreamAssistant() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hey there! I\'m your Dream Assistant. How can I help you customize your space today?' }
  ]);

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setMessage('');

    // Simulated response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'m here to help! You can ask me to change your theme, add widgets, connect platforms, or get tips on customizing your DREAMengin.'
      }]);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-4"
      data-testid="widget-dream-assistant"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 20px hsl(24 95% 53% / 0.3)',
                '0 0 30px hsl(199 89% 48% / 0.3)',
                '0 0 20px hsl(24 95% 53% / 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="font-semibold gradient-text">Dream Assistant</h3>
            <p className="text-xs text-muted-foreground">AI-powered help</p>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground"
          data-testid="button-toggle-assistant"
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Messages */}
            <div className="glass-card p-3 mb-3 max-h-60 overflow-y-auto space-y-3">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary/20 text-foreground'
                        : 'bg-accent/10 text-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          className="glass-input flex-1 py-2 px-3 text-sm"
          data-testid="input-assistant-message"
        />
        <Button
          size="icon"
          onClick={handleSend}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          data-testid="button-send-message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {!isExpanded && (
        <div className="mt-3 flex flex-wrap gap-2">
          {['Change theme', 'Add widget', 'Connect Roblox'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setMessage(suggestion)}
              className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
