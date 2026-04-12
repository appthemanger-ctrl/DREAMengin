'use client';
import type { WidgetInstance } from '@/types/widgets';

interface DreamWidgetGridProps {
  widgets: WidgetInstance[];
  onWidgetOpen: (widget: WidgetInstance) => void;
  onWidgetLongPress: (widget: WidgetInstance) => void;
  selectedWidgetId: string | null;
}

export default function DreamWidgetGrid({ widgets, onWidgetOpen, onWidgetLongPress, selectedWidgetId }: DreamWidgetGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {widgets.map((widget) => (
        <div
          key={widget.id}
          role="button"
          tabIndex={0}
          aria-selected={selectedWidgetId === widget.id}
          onClick={() => onWidgetOpen(widget)}
          onKeyDown={(e) => { if (e.key === 'Enter') onWidgetOpen(widget); }}
          onContextMenu={(e) => { e.preventDefault(); onWidgetLongPress(widget); }}
          className="de-widget cursor-pointer"
          style={{ outline: selectedWidgetId === widget.id ? '2px solid var(--de-accent)' : 'none' }}
        >
          <div className="de-widget-body p-3 text-sm truncate">{widget.id}</div>
        </div>
      ))}
    </div>
  );
}
