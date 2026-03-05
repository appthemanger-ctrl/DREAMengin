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
      <span className="mb-1 block text-sm" style={{ color: 'var(--de-text, #1a3a6a)' }}>{label}</span>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          className={inputClassName}
          style={!inputClassName ? {
            width: '100%',
            padding: '11px 48px 11px 14px',
            borderRadius: 10,
            background: 'var(--de-mist, rgba(180,210,250,0.22))',
            border: '1px solid var(--de-border, rgba(160,195,240,0.45))',
            color: 'var(--de-text, #1a3a6a)',
            fontSize: 14,
            outline: 'none',
          } : undefined}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg"
          style={{ color: 'var(--de-text-dim, rgba(60,100,160,0.55))' }}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
