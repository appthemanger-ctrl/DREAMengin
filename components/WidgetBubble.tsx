'use client';

import { useDrag } from 'react-dnd';
import { useCallback } from 'react';
import {
  Bell,
  Megaphone,
  Video,
  Play,
  MessageSquare,
  FlaskConical,
  Cpu
} from 'lucide-react';

interface WidgetBubbleProps {
  widget: {
    id: string;
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config_json: any;
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

  const getNotificationCount = () => {
    if (widget.type === 'notifications' && widget.config_json.unread) {
      return widget.config_json.unread;
    }
    if (widget.type === 'messages' && widget.config_json.unread) {
      return widget.config_json.unread;
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
