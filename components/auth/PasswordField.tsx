'use client';

import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  placeholder?: string;
  id?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
};

export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  id,
  required = true,
  className,
  inputClassName,
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <label className={className || 'block'}>
      <span className="mb-1 block text-sm text-white/80">{label}</span>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          className={inputClassName || 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-14 text-white placeholder:text-white/40 outline-none focus:border-sky-400/50'}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
