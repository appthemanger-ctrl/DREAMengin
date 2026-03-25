/**
 * ARCHIVED — v2.0.0 (2026-03-25)
 *
 * This component is a v1-era legacy file. It is not imported by any active
 * surface in DREAMengin v2.0.0. It is preserved here for reference only.
 *
 * Do not import this component in new code.
 * Per docs/LAW.md §10: repurpose or remove legacy pieces before introducing new systems.
 */
'use client';

import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Plus, X, Settings, Sparkles, TrendingUp,
  Bell, Calendar, MessageSquare, Zap, Eye
} from 'lucide-react';
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
  config_json: unknown;
  order: number;
  enabled: boolean;
}

export default function DashboardLayoutEnhanced({ feed, widgets: initialWidgets, userId, notifications }: DashboardLayoutProps) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets as Widget[]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const supabase = createClient();

  const moveWidget = async (dragIndex: number, hoverIndex: number) => {
    const draggedWidget = widgets[dragIndex];
    const newWidgets = [...widgets];
    newWidgets.splice(dragIndex, 1);
    newWidgets.splice(hoverIndex, 0, draggedWidget);
    
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      order: index
    }));
    
    setWidgets(updatedWidgets);

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

  const widgetTypes = [
    { type: 'notifications', icon: Bell, label: 'Notifications', color: 'from-blue-500 to-cyan-500' },
    { type: 'promo', icon: Sparkles, label: 'Promotions', color: 'from-purple-500 to-pink-500' },
    { type: 'next_stream', icon: Calendar, label: 'Next Stream', color: 'from-green-500 to-emerald-500' },
    { type: 'messages', icon: MessageSquare, label: 'Messages', color: 'from-orange-500 to-red-500' },
    { type: 'lab', icon: Zap, label: 'Lab Projects', color: 'from-indigo-500 to-purple-500' },
    { type: 'analytics', icon: TrendingUp, label: 'Quick Stats', color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero header with gradient */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl" />
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    Welcome Back
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    Your creative dashboard is ready
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span className="font-medium">Create</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Enhanced Widgets */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-200/50 dark:border-slate-800/50">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <span>Widgets</span>
                  </h2>
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`p-2 rounded-lg transition-all ${
                      isEditMode 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Settings className={`w-5 h-5 ${isEditMode ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {isEditMode && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Add new widget
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {widgetTypes.map(({ type, icon: Icon, label, color }) => (
                        <button
                          key={type}
                          onClick={() => addWidget(type)}
                          className={`group p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-transparent hover:shadow-lg transition-all`}
                        >
                          <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                            {label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {widgets.map((widget, index) => (
                    <DraggableWidgetEnhanced
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

              {/* Enhanced Notifications Panel */}
              {notifications.length > 0 && (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-blue-500" />
                      <span>Recent Activity</span>
                    </h3>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
                      {notifications.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {notifications.slice(0, 5).map((notif, index) => (
                      <div 
                        key={notif.id}
                        className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group cursor-pointer"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <p className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {notif.content?.message || 'New notification'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Feed - Enhanced */}
            <div className="col-span-12 lg:col-span-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    Your Feed
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {feed.length} posts available
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'list'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className={viewMode === 'grid' ? 'space-y-6' : 'space-y-4'}>
                {feed.map((item, index) => (
                  <div
                    key={item.id}
                    className="animate-in slide-in-from-bottom-4 fill-mode-both"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Use existing FeedCard component or enhanced version */}
                    <EnhancedFeedCardPlaceholder item={item} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Sidebar - Enhanced Quick Links */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-200/50 dark:border-slate-800/50">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Featured</span>
                </h3>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                  <div className="relative">
                    <Sparkles className="w-8 h-8 mb-3 opacity-80" />
                    <h4 className="font-bold mb-1">Premium Features</h4>
                    <p className="text-sm opacity-90 mb-3">
                      Unlock advanced analytics and collaboration tools
                    </p>
                    <Link 
                      href="/ads" 
                      className="inline-block px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-all"
                    >
                      Learn More →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-200/50 dark:border-slate-800/50">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                  Quick Access
                </h3>
                <div className="space-y-2">
                  {[
                    { href: '/lab', label: 'Lab Projects', icon: Zap, color: 'text-purple-500' },
                    { href: '/music', label: 'Music Studio', icon: MessageSquare, color: 'text-blue-500' },
                    { href: '/shop', label: 'Merch Store', icon: Eye, color: 'text-green-500' },
                    { href: '/analytics', label: 'Analytics', icon: TrendingUp, color: 'text-orange-500' },
                  ].map(({ href, label, icon: Icon, color }) => (
                    <Link
                      key={href}
                      href={href}
                      className="group flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        {label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

interface DraggableWidgetEnhancedProps {
  widget: Widget;
  index: number;
  moveWidget: (dragIndex: number, hoverIndex: number) => Promise<void>;
  isEditMode: boolean;
  onRemove: () => Promise<void>;
}

// Enhanced draggable widget component
function DraggableWidgetEnhanced({ widget, index, moveWidget, isEditMode, onRemove }: DraggableWidgetEnhancedProps) {
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
      className={`group relative p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:shadow-lg hover:scale-105'
      }`}
      style={{ cursor: isEditMode ? 'move' : 'default' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
          {widget.type.replace('_', ' ')}
        </span>
        {isEditMode && (
          <button
            onClick={onRemove}
            className="p-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        {(widget.config_json as Record<string, unknown>)?.['text'] as string || 'Active'}
      </div>
    </div>
  );
}

// Placeholder for enhanced feed card
 
function EnhancedFeedCardPlaceholder({ item }: { item: any }) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-200/50 dark:border-slate-800/50 hover:shadow-2xl transition-all group">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {item.author || 'Anonymous'}
          </p>
          <p className="text-xs text-slate-500">
            {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {item.title || 'Untitled Post'}
      </h3>
      <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
        {item.content}
      </p>
    </div>
  );
}
