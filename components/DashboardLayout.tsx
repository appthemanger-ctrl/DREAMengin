'use client';

import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useState } from 'react';
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
  const supabase = createClient();

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