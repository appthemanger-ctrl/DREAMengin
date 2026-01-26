'use client';

import { useDrag } from 'react-dnd';
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
      case 'machine':
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
      case 'machine':
        return 'Physics Sim';
      default:
        return widget.type;
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
      ref={drag}
      className={`widget-bubble p-4 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center space-x-3">
        <div className="text-purple-400">
          {getIcon()}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-100 flex items-center">
            {getLabel()}
            {getNotificationCount() && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {getNotificationCount()}
              </span>
            )}
          </div>
          <WidgetContent type={widget.type} config={widget.config_json} />
        </div>
      </div>
    </div>
  );
}

function WidgetContent({ type, config }: { type: string; config: any }) {
  switch (type) {
    case 'notifications':
      return (
        <div className="text-xs text-gray-400">
          {config.unread ? `${config.unread} unread` : 'No new notifications'}
        </div>
      );
    case 'promo':
      return <div className="text-xs text-gray-400">{config.text || 'Active promotion'}</div>;
    case 'next_stream':
      return <div className="text-xs text-gray-400">{config.channel ? `${config.channel} - Live soon` : 'No stream scheduled'}</div>;
    case 'messages':
      return <div className="text-xs text-gray-400">{config.unread ? `${config.unread} unread` : 'No new messages'}</div>;
    case 'lab':
      return <div className="text-xs text-gray-400">Open lab projects</div>;
    case 'machine':
      return <div className="text-xs text-gray-400">{config.name || 'Physics simulation'}</div>;
    default:
      return <div className="text-xs text-gray-400">Widget</div>;
  }
}