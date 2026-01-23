export default function AccentPicker({ value = '#3B82F6', onChange = () => {} }) {
  const colors = ['#3B82F6','#10B981','#8B5CF6','#EF4444','#F59E0B','#EC4899'];
  return (
    <div className="flex gap-2">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-8 h-8 rounded-full border-2 ${value === c ? 'border-white' : 'border-white/30'}`}
          style={{ backgroundColor: c }}
          aria-label={`Select ${c} color`}
          title={c}
        />
      ))}
    </div>
  );
}
