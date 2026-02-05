'use client';

import { Calendar, Clock, Send, Trash2, Edit, Plus } from 'lucide-react';
import { useState } from 'react';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  scheduledFor: Date;
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  platforms: ('feed' | 'lab' | 'profile')[];
}

export default function ContentScheduler() {
  const [posts, setPosts] = useState<ScheduledPost[]>([
    {
      id: '1',
      title: 'Weekly Lab Update',
      content: 'Sharing progress on our quantum computing simulation...',
      scheduledFor: new Date(Date.now() + 2 * 24 * 3600000),
      status: 'scheduled',
      platforms: ['feed', 'lab']
    },
    {
      id: '2',
      title: 'New Music Release Announcement',
      content: 'Excited to share my new single "Electron Dreams"',
      scheduledFor: new Date(Date.now() + 5 * 24 * 3600000),
      status: 'scheduled',
      platforms: ['feed', 'profile']
    }
  ]);

  const [showNewPostForm, setShowNewPostForm] = useState(false);

  const getStatusColor = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'publishing':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'published':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Content Scheduler</h2>
        </div>
        <button
          onClick={() => setShowNewPostForm(true)}
          className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Post
        </button>
      </div>

      {showNewPostForm && (
        <div className="mb-6 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
          <h3 className="font-medium text-slate-900 dark:text-white mb-4">New Scheduled Post</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Post title..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:bg-slate-800 dark:text-white"
            />
            <textarea
              placeholder="Post content..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none dark:bg-slate-800 dark:text-white"
            />
            <div className="flex gap-3">
              <input
                type="datetime-local"
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:bg-slate-800 dark:text-white"
              />
              <select className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:bg-slate-800 dark:text-white">
                <option>Feed</option>
                <option>Lab</option>
                <option>Profile</option>
                <option>All</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNewPostForm(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors">
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Calendar className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p>No scheduled posts yet</p>
            <p className="text-sm mt-1">Schedule posts to publish them automatically</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {post.content}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                  {post.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(post.scheduledFor)}
                  </div>
                  <div className="flex gap-1">
                    {post.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    aria-label="Edit"
                  >
                    <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            {posts.filter(p => p.status === 'scheduled').length} posts scheduled for the next 7 days
          </p>
          <a
            href="/scheduler"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            View calendar →
          </a>
        </div>
      </div>
    </div>
  );
}
