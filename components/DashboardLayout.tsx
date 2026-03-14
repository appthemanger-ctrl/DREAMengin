'use client';

import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useState, useCallback } from 'react';
import FeedCard from './FeedCard';
import WidgetBubble from './WidgetBubble';
import CreatePostModal from './CreatePostModal';
import { createClient } from '@/lib/supabase/client';
import { Plus, X, Settings } from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feed: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  widgets: any[];
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notifications: any[];
}

interface Widget {
  id: string;
  type: string;
  config_json: unknown;
  order: number;
  enabled: boolean;
}

export default function DashboardLayout({ feed, widgets: initialWidgets, userId, notifications }: DashboardLayoutProps) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets as Widget[]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const supabase = createClient();

  const moveWidget = useCallback(async (dragIndex: number, hoverIndex: number) => {
    let updatedWidgets: Widget[] = [];
    setWidgets((prev) => {
      const next = [...prev];
      const [dragged] = next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, dragged);
      updatedWidgets = next.map((widget, index) => ({ ...widget, order: index }));
      return updatedWidgets;
    });

    // Save all order updates in parallel
    await Promise.all(
      updatedWidgets.map((widget) =>
        supabase
          .from('widget_instances')
          .update({ order: widget.order })
          .eq('id', widget.id)
      )
    );
  }, [supabase]);

  const addWidget = useCallback(async (type: string) => {
    // Capture the new widget from the functional updater so DB insert stays in sync
    let insertWidget: Widget | undefined;
    setWidgets((prev) => {
      insertWidget = {
        id: crypto.randomUUID(),
        type,
        config_json: {},
        order: prev.length,
        enabled: true,
      };
      return [...prev, insertWidget];
    });

    if (!insertWidget) return;
    await supabase
      .from('widget_instances')
      .insert({
        id: insertWidget.id,
        user_id: userId,
        type: insertWidget.type,
        config_json: insertWidget.config_json,
        order: insertWidget.order,
        enabled: insertWidget.enabled,
      });
  }, [userId, supabase]);

  const removeWidget = useCallback(async (widgetId: string) => {
    await supabase
      .from('widget_instances')
      .delete()
      .eq('id', widgetId);

    setWidgets((prev) => prev.filter(w => w.id !== widgetId));
  }, [supabase]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Widgets */}
            <div className="col-span-3">
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Widgets</h2>
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`p-2 rounded-md ${isEditMode ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {isEditMode && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-md">
                    <p className="text-sm text-slate-600 mb-2">Add widget:</p>
                    <div className="flex flex-wrap gap-2">
                      {['notifications', 'promo', 'next_stream', 'watch', 'messages', 'lab'].map(type => (
                        <button
                          key={type}
                          onClick={() => addWidget(type)}
                          className="px-3 py-1 text-xs bg-slate-800 text-white rounded-md hover:bg-slate-700"
                        >
                          <Plus className="w-3 h-3 inline mr-1" />
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {widgets.map((widget, index) => (
                    <DraggableWidget
                      key={widget.id}
                      widget={widget}
                      index={index}
                      moveWidget={moveWidget}
                      isEditMode={isEditMode}
                      onRemove={() => removeWidget(widget.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Notifications Widget */}
              {notifications.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Notifications</h3>
                  <div className="space-y-2">
                    {notifications.slice(0, 5).map(notif => (
                      <div key={notif.id} className="text-xs text-slate-600 p-2 bg-slate-50 rounded">
                        {notif.content?.message || 'New notification'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Feed */}
            <div className="col-span-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-slate-900">Feed</h1>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </button>
              </div>

              <div className="space-y-4">
                {feed.map((item) => (
                  <FeedCard key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-3">
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Promos</h3>
                <div className="text-xs text-slate-600 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded">
                  <strong>Ad Space Available!</strong>
                  <br />
                  Promote your content on DreamEngin. <Link href="/ads" className="text-blue-600">Learn more</Link>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/lab" className="block text-sm text-slate-600 hover:text-slate-900">Lab Projects</Link>
                  <Link href="/music" className="block text-sm text-slate-600 hover:text-slate-900">Music Releases</Link>
                  <Link href="/shop" className="block text-sm text-slate-600 hover:text-slate-900">Merch Store</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showPostModal && (
          <CreatePostModal
            onClose={() => setShowPostModal(false)}
            userId={userId}
          />
        )}
      </div>
    </DndProvider>
  );
}

interface DraggableWidgetProps {
  widget: Widget;
  index: number;
  moveWidget: (dragIndex: number, hoverIndex: number) => void;
  isEditMode: boolean;
  onRemove: () => void;
}

function DraggableWidget({ widget, index, moveWidget, isEditMode, onRemove }: DraggableWidgetProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'widget',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveWidget(item.index, index);
        item.index = index;
      }
    },
  });

  const ref = (el: HTMLDivElement | null) => {
    drag(drop(el));
  };

  return (
    <div
      ref={ref}
      className={`widget-bubble p-3 ${isDragging ? 'opacity-50' : ''}`}
      style={{ cursor: isEditMode ? 'move' : 'pointer' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize">
          {widget.type.replace('_', ' ')}
        </span>
        {isEditMode && (
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <WidgetContent type={widget.type} config={widget.config_json as Record<string, unknown>} />
    </div>
  );
}

function WidgetContent({ type, config }: { type: string; config: Record<string, unknown> }) {
  switch (type) {
    case 'notifications':
      return <div className="text-xs text-slate-500 mt-1">{String(config.unread ?? 0)} unread</div>;
    case 'promo':
      return <div className="text-xs text-slate-500 mt-1">{String(config.text ?? 'Active promo')}</div>;
    case 'next_stream':
      return <div className="text-xs text-slate-500 mt-1">{String(config.channel ?? 'No stream scheduled')}</div>;
    case 'messages':
      return <div className="text-xs text-slate-500 mt-1">{String(config.unread ?? 0)} messages</div>;
    case 'lab':
      return <div className="text-xs text-slate-500 mt-1">Open lab projects</div>;
    default:
      return <div className="text-xs text-slate-500 mt-1">Widget</div>;
  }
}