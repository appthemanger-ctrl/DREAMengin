'use client'
import React from 'react'

const AccentPicker = ({ value, onChange }) => {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#8B5CF6', // violet
    '#EF4444', // red
    '#F59E0B', // amber
    '#EC4899', // pink
  ]

  return (
    <div className="flex gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange?.(color)}
          className={`w-8 h-8 rounded-full border-2 ${value === color ? 'border-black/70' : 'border-white/30'}`}
          style={{ backgroundColor: color }}
          aria-label={`Select ${color} color`}
          title={color}
        />
      ))}
    </div>
  )
}

export default AccentPicker
