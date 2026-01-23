'use client';
type Props = {
  value?: string;
  onChange?: (v: string) => void;
};
const palette = [
  '#dc2626','#ef4444','#f59e0b','#22c55e','#06b6d4','#3b82f6','#a855f7'
];
export default function AccentPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 items-center flex-wrap">
      {palette.map(c => (
        <button
          key={c}
          type="button"
          aria-label={`Pick ${c}`}
          onClick={() => onChange?.(c)}
          className="w-7 h-7 rounded-full border"
          style={{ background: c, outline: value===c ? '2px solid black' : undefined }}
        />
      ))}
    </div>
  );
}
