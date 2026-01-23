'use client'
import { WidgetGrid } from '@/components/widget-grid'

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold">My Dreampage 🎨</h1>
        <a href="/home/add" className="btn-primary">+ Add Anything</a>
      </div>
      <WidgetGrid />
    </main>
  )
}
