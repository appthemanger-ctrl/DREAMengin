'use client';

/**
 * CalendarPanel — 7-day content calendar for the Content Engine app.
 *
 * Add, view, and schedule content across the week.
 * Lives at /engines/create/calendar.
 */

import { useState } from 'react';
import { Plus, Calendar, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';

type ContentType = 'Post' | 'Video' | 'Story' | 'Thread';

interface CalItem {
  id: string;
  type: ContentType;
  title: string;
  dayOffset: number;
  time: string;
}

const TYPE_COLORS: Record<ContentType, string> = {
  Post:   '#fb923c',
  Video:  '#a855f7',
  Story:  '#22d3ee',
  Thread: '#10b981',
};

const TYPE_EMOJIS: Record<ContentType, string> = {
  Post:   '📝',
  Video:  '🎬',
  Story:  '✨',
  Thread: '🧵',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPanel() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [items, setItems] = useState<CalItem[]>([
    { id: '1', type: 'Post',   title: 'New drop announcement',    dayOffset: 1, time: '09:00' },
    { id: '2', type: 'Story',  title: 'Behind the scenes',         dayOffset: 2, time: '14:30' },
    { id: '3', type: 'Video',  title: 'Tutorial: Getting started', dayOffset: 4, time: '18:00' },
    { id: '4', type: 'Thread', title: 'Industry insights thread',  dayOffset: 6, time: '11:00' },
  ]);
  const [showAdd, setShowAdd] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ContentType>('Post');
  const [newTime, setNewTime] = useState('10:00');

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + weekOffset * 7);

  function addItem() {
    if (!newTitle.trim() || showAdd === null) return;
    setItems((prev) => [...prev, {
      id: Date.now().toString(),
      type: newType,
      title: newTitle.trim(),
      dayOffset: showAdd + weekOffset * 7,
      time: newTime,
    }]);
    setNewTitle('');
    setShowAdd(null);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Content Calendar</h1>
            <p className="text-sm text-white/50">Plan and schedule your content week</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-white/50 min-w-[80px] text-center">
              {weekOffset === 0 ? 'This week' : weekOffset > 0 ? `+${weekOffset}w` : `${weekOffset}w`}
            </span>
            <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, di) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + di);
            const dayItems = items.filter((item) => item.dayOffset === di + weekOffset * 7);
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div key={di} className="flex flex-col gap-1.5">
                {/* Day header */}
                <div className={`text-center pb-1.5 border-b ${isToday ? 'border-[#fb923c]/50' : 'border-white/[0.06]'}`}>
                  <div className="text-[10px] text-white/40 uppercase">{DAYS[date.getDay()]}</div>
                  <div
                    className="text-sm font-bold mt-0.5"
                    style={{ color: isToday ? '#fb923c' : 'rgba(255,255,255,0.7)' }}
                  >
                    {date.getDate()}
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-1.5 min-h-[80px]">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-lg px-2 py-1.5"
                      style={{ background: `${TYPE_COLORS[item.type]}18`, border: `1px solid ${TYPE_COLORS[item.type]}33` }}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-[10px]">{TYPE_EMOJIS[item.type]}</span>
                        <span className="text-[10px] font-medium text-white/70 truncate">{item.title}</span>
                      </div>
                      <div className="text-[9px] text-white/30 mt-0.5 flex items-center gap-1">
                        <Clock size={8} />
                        {item.time}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add button */}
                <button
                  onClick={() => setShowAdd(showAdd === di ? null : di)}
                  className="flex items-center justify-center w-full py-1 rounded-lg border border-dashed border-white/[0.08] hover:border-[#fb923c]/40 text-white/20 hover:text-[#fb923c] transition-all text-xs"
                >
                  <Plus size={11} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add form */}
        {showAdd !== null && (
          <div className="mt-5 p-4 rounded-xl bg-white/[0.04] border border-[#fb923c]/20">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-[#fb923c]" />
              <span className="text-sm font-medium text-white">
                Schedule for {DAYS[(weekStart.getDay() + showAdd) % 7]}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ContentType)}
                className="px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
              >
                {(['Post', 'Video', 'Story', 'Thread'] as ContentType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
              />
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Content title"
                className="flex-1 min-w-[150px] px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#fb923c]/50"
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
              />
              <button
                onClick={addItem}
                disabled={!newTitle.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#fb923c] hover:bg-[#f97316] text-black text-sm font-bold transition-colors disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
