export default function AccentPicker({ value, onChange }) {
  const colors = ['#3B82F6','#10B981','#8B5CF6','#EF4444','#F59E0B','#EC4899']
  return (
    <div className="flex gap-2">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange && onChange(c)}
          className={`w-8 h-8 rounded-full border-2 ${
            value === c ? 'border-gray-900' : 'border-gray-300'
          }`}
          style={{ backgroundColor: c }}
          aria-label={`Select ${c}`}
        />
      ))}
    </div>
  )
}
