'use client';

import React from 'react';
import {
  Music,
  Gamepad2,
  FlaskConical,
  Code2,
  Palette,
  Video,
  FileText,
  Grid3x3,
  Globe,
  User,
  Image,
  Link2,
} from 'lucide-react';
import { WidgetInstance, getWidgetType, getWidgetConfig } from '@/types/widgets';
import DreamWidget from './DreamWidget';

interface DreamWidgetGridProps {
  widgets: WidgetInstance[];
  onWidgetOpen?: (widget: WidgetInstance) => void;
  onWidgetLongPress?: (widget: WidgetInstance) => void;
  selectedWidgetId?: string | null;
}

function getIconForType(type: string | undefined): React.ReactNode {
  const iconClass = 'w-5 h-5';
  switch (type) {
    case 'music':        return <Music className={iconClass} />;
    case 'games':        return <Gamepad2 className={iconClass} />;
    case 'lab':          return <FlaskConical className={iconClass} />;
    case 'code':         return <Code2 className={iconClass} />;
    case 'brand':        return <Palette className={iconClass} />;
    case 'media':        return <Video className={iconClass} />;
    case 'youtube':      return <Video className={iconClass} />;
    case 'text':         return <FileText className={iconClass} />;
    case 'social_feed':  return <Globe className={iconClass} />;
    case 'profile_info': return <User className={iconClass} />;
    case 'gallery':      return <Image className={iconClass} />;
    case 'link_tree':    return <Link2 className={iconClass} />;
    default:             return <Grid3x3 className={iconClass} />;
  }
}

export default function DreamWidgetGrid({
  widgets,
  onWidgetOpen,
  onWidgetLongPress,
  selectedWidgetId,
}: DreamWidgetGridProps) {
  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/25">
        <Grid3x3 className="w-8 h-8 mb-3 opacity-30" />
        <p className="text-sm font-light">No widgets configured yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {widgets.map((widget) => {
        const type = getWidgetType(widget);
        const config = getWidgetConfig(widget);
        const isSelected = selectedWidgetId === widget.id;

        return (
          <DreamWidget
            key={widget.id}
            type={type}
            title={widget.title ?? (type ?? 'Widget')}
            subtitle={typeof config.subtitle === 'string' ? config.subtitle : undefined}
            icon={getIconForType(type)}
            isEmpty={false}
            onOpen={onWidgetOpen ? () => onWidgetOpen(widget) : undefined}
            onLongPress={onWidgetLongPress ? () => onWidgetLongPress(widget) : undefined}
            className={isSelected ? 'ring-2 ring-de-gold/60' : ''}
          >
            {typeof config.preview === 'string' ? config.preview : undefined}
          </DreamWidget>
        );
      })}
    </div>
  );
}
