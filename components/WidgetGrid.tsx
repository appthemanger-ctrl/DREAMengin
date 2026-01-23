import { createClient } from '../lib/supabase/client'
'use client';
import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';

export default function WidgetGrid({ initial }: { initial: any[] }) {
  const [widgets, setWidgets] = useState(initial ?? []);
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = widgets.findIndex((w:any) => w.id === active.id);
    const newIndex = widgets.findIndex((w:any) => w.id === over.id);
    const newOrder = arrayMove(widgets, oldIndex, newIndex);
    setWidgets(newOrder);
    try {
      await supabase.from('widgets').upsert(
        newOrder.map((w:any, idx:number) => ({ ...w, position: idx })),
        { onConflict: 'id' }
      );
    } catch {}
  }

  async function deleteWidget(id: string) {
    await supabase.from('widgets').delete().eq('id', id);
    setWidgets((w:any[]) => w.filter((x:any) => x.id !== id));
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl">Your widgets</h2>
        <Link href="/home/add" className="bg-brandB px-4 py-2 rounded-lg text-sm">Add widget</Link>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w:any) => w.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-4 md:grid-cols-2">
            {widgets.map((w:any) => (
              <SortableWidget key={w.id} widget={w} onDelete={deleteWidget} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {widgets.length === 0 && (
        <p className="text-slate-300">Add your first widget to see it here.</p>
      )}
    </>
  );
}

function SortableWidget({ widget, onDelete }: { widget: any; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: widget.id });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="glass p-4 cursor-move">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{widget.title}</h3>
          {widget.body && <p className="text-sm text-slate-300 mt-1">{widget.body}</p>}
          {widget.url && <a className="text-sm underline text-brandA" href={widget.url} target="_blank">Open link</a>}
        </div>
        <button onClick={() => onDelete(widget.id)} className="text-rose-400 text-sm">Delete</button>
      </div>
    </div>
  );
}
