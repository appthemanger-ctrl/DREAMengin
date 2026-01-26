'use client';

import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useState, useEffect } from 'react';
import FeedCard from './FeedCard';
import WidgetBubble from './WidgetBubble';
import CreatePostModal from './CreatePostModal';
import { createClient } from '@/lib/supabase/client';
import { Plus, X, Settings } from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  feed: any[];
  widgets: any[];
  userId: string;
  notifications: any[];
}

interface Widget {
  id: string;
  type: string;
  config_json: any;
  order: number;
  enabled: boolean;
}

export default function DashboardLayout({ feed, widgets: initialWidgets, userId, notifications }: DashboardLayoutProps) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [feedItems, setFeedItems] = useState<any[]>(feed);
  const [notifItems, setNotifItems] = useState<any[]>(notifications);
  const supabase = createClient();

  // Subscribe to realtime changes for feed and notifications. When a new
  // record is inserted for this user, prepend it to the existing list so
  // the UI updates immediately without a refresh. We clean up the
  // subscription on unmount to avoid memory leaks.
  useEffect(() => {
    const channel = supabase.channel(`dashboard-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'feed_items',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setFeedItems((current) => [payload.new, ...current]);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifItems((current) => [payload.new, ...current]);
      });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const moveWidget = async (dragIndex: number, hoverIndex: number) => {
    const draggedWidget = widgets[dragIndex];
    const newWidgets = [...widgets];
    newWidgets.splice(dragIndex, 1);
    newWidgets.splice(hoverIndex, 0, draggedWidget);
    
    // Update order for all widgets
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      order: index
    }));
    
    setWidgets(updatedWidgets);

    // Save to Supabase
    for (const widget of updatedWidgets) {
      await supabase
        .from('widget_instances')
        .update({ order: widget.order })
        .eq('id', widget.id);
    }
  };

  const addWidget = async (type: string) => {
    const newWidget: Widget = {
      id: crypto.randomUUID(),
      type,
      config_json: {},
      order: widgets.length,
      enabled: true
    };

    await supabase
      .from('widget_instances')
      .insert({
        id: newWidget.id,
        user_id: userId,
        type: newWidget.type,
        config_json: newWidget.config_json,
        order: newWidget.order,
        enabled: newWidget.enabled
      });

    setWidgets([...widgets, newWidget]);
  };

  const removeWidget = async (widgetId: string) => {
    await supabase
      .from('widget_instances')
      .delete()
      .eq('id', widgetId);

    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      {/* Allow the global body gradient to show through; just ensure text color is set */}
      <div className="min-h-screen text-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Widgets */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-slate-800/60 backdrop-blur-lg rounded-lg border border-slate-700 shadow-md p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Widgets</h2>
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`p-2 rounded-md transition-colors ${isEditMode ? 'bg-purple-700 text-white' : 'hover:bg-slate-700'}`}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {isEditMode && (
                  <div className="mb-4 p-3 bg-slate-700/50 rounded-md border border-slate-600">
                    <p className="text-sm mb-2">Add widget:</p>
                    <div className="flex flex-wrap gap-2">
                      {['notifications', 'promo', 'next_stream', 'watch', 'messages', 'lab'].map(type => (
                        <button
                          key={type}
                          onClick={() => addWidget(type)}
                          className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center transition-colors"
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
              {notifItems.length > 0 && (
                <div className="bg-slate-800/60 backdrop-blur-lg rounded-lg border border-slate-700 p-4">
                  <h3 className="text-sm font-semibold mb-3">Notifications</h3>
                  <div className="space-y-2">
                    {notifItems.slice(0, 5).map(notif => (
                      <div key={notif.id} className="text-xs p-2 bg-slate-700/50 rounded border border-slate-600">
                        {notif.content?.message || 'New notification'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Feed */}
            <div className="col-span-12 lg:col-span-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Feed</h1>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </button>
              </div>

              <div className="space-y-4">
                {feedItems.map((item) => (
                  <FeedCard key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-slate-800/60 backdrop-blur-lg rounded-lg border border-slate-700 shadow-md p-4 mb-6">
                <h3 className="text-sm font-semibold mb-3">Promos</h3>
                <div className="text-xs p-3 bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-800 rounded border border-slate-700">
                  <strong className="text-purple-300">Ad Space Available!</strong>
                  <br />
                  Promote your content on DreamEngin. <Link href="/ads" className="text-purple-400 hover:text-purple-300 underline">Learn more</Link>
                </div>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-lg rounded-lg border border-slate-700 shadow-md p-4">
                <h3 className="text-sm font-semibold mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/lab" className="block text-sm text-gray-300 hover:text-purple-400 transition-colors">Lab Projects</Link>
                  <Link href="/music" className="block text-sm text-gray-300 hover:text-purple-400 transition-colors">Music Releases</Link>
                  <Link href="/shop" className="block text-sm text-gray-300 hover:text-purple-400 transition-colors">Merch Store</Link>
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
      <WidgetContent type={widget.type} config={widget.config_json} />
    </div>
  );
}

function WidgetContent({ type, config }: { type: string; config: any }) {
  switch (type) {
    case 'notifications':
      return <div className="text-xs text-slate-500 mt-1">{config.unread || 0} unread</div>;
    case 'promo':
      return <div className="text-xs text-slate-500 mt-1">{config.text || 'Active promo'}</div>;
    case 'next_stream':
      return <div className="text-xs text-slate-500 mt-1">{config.channel || 'No stream scheduled'}</div>;
    case 'messages':
      return <div className="text-xs text-slate-500 mt-1">{config.unread || 0} messages</div>;
    case 'lab':
      return <div className="text-xs text-slate-500 mt-1">Open lab projects</div>;
    default:
      return <div className="text-xs text-slate-500 mt-1">Widget</div>;
  }
}