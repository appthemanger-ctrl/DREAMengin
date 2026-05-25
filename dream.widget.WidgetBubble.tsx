'use client';

import {
    Bell,
    Cpu,
    FlaskConical,
    Megaphone,
    MessageSquare,
    Play,
    Video
} from 'lucide-react';
import { useCallback } from 'react';
import { useDrag } from 'react-dnd';

interface WidgetBubbleProps {
  widget: {
    id: string;
    type: string;
     
    config_json: unknown;
  };
}

export default function WidgetBubble({ widget }: WidgetBubbleProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: { id: widget.id, type: widget.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // React 19 + react-dnd types: ConnectDragSource isn't a valid DOM ref type.
  // Use a callback ref that calls `drag(node)` and returns void (what React expects).
  const dragRef = useCallback((node: HTMLDivElement | null) => {
    drag(node);
  }, [drag]);

  const getIcon = () => {
    switch (widget.type) {
      case 'notifications':
        return <Bell className="w-5 h-5" />;
      case 'promo':
        return <Megaphone className="w-5 h-5" />;
      case 'next_stream':
        return <Video className="w-5 h-5" />;
      case 'watch':
        return <Play className="w-5 h-5" />;
      case 'messages':
        return <MessageSquare className="w-5 h-5" />;
      case 'lab':
        return <FlaskConical className="w-5 h-5" />;
      case 'ai':
        return <Cpu className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    switch (widget.type) {
      case 'notifications':
        return 'Notifications';
      case 'promo':
        return 'Promo';
      case 'next_stream':
        return 'Next Stream';
      case 'watch':
        return 'Watch';
      case 'messages':
        return 'Messages';
      case 'lab':
        return 'Lab';
      case 'ai':
        return 'AI';
      default:
        return 'Widget';
    }
  };

  const getNotificationCount = (): React.ReactNode => {
    const cfg = widget.config_json as Record<string, unknown>;
    if ((widget.type === 'notifications' || widget.type === 'messages') && cfg?.unread) {
      return String(cfg.unread);
    }
    return null;
  };

  return (
    <div
      ref={dragRef}
      className={`widget-bubble p-4 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center space-x-3">
        <div className="text-slate-600">
          {getIcon()}
        </div>
        <div>
          <div className="text-sm font-medium text-slate-900 flex items-center">
            {getLabel()}
            {getNotificationCount() && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {getNotificationCount()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
