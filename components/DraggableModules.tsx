'use client';
import React, { useState } from 'react';

type Item = { name?: string } | string;

export default function DraggableModules({ items = [] as Item[] }) {
  const [list, setList] = useState(items);

  const onDragStart = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(index));
  };
  const onDrop = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (Number.isNaN(from)) return;
    const next = [...list];
    const [m] = (next as Item[]).splice(from, 1);
    (next as Item[]).splice(index, 0, m);
    setList(next);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  return (
    <div>
      {list.map((it: Item, i: number) => (
        <div
          key={i}
          draggable
          onDragStart={onDragStart(i)}
          onDrop={onDrop(i)}
          onDragOver={onDragOver}
          style={{
            border: '1px dashed var(--accent, currentColor)',
            padding: 8,
            marginBottom: 8,
            borderRadius: 8
          }}
        >
          {typeof it === 'string' ? it : it?.name ?? 'Module'}
        </div>
      ))}
    </div>
  );
}
