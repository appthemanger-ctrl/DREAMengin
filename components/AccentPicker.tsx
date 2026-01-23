'use client';

const PALETTE = [
  '#dc2626', '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899'
];

type Props = {
  value?: string;
  onChange?: (v: string) => void;
  label?: string;
};

export default function AccentPicker({ value = '#dc2626', onChange, label = 'Accent' }: Props) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            onClick={() => onChange?.(c)}
            className="h-8 w-8 rounded-full border border-black/10 dark:border-white/10"
            style={{ background: c, outline: value === c ? '2px solid white' : undefined }}
          />
        ))}
      </div>
      <input
        className="mt-2 w-36 rounded border px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="#dc2626"
      />
    </div>
  );
}
