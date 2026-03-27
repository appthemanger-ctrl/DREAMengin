'use client';

type Props = {
  label: string;
};

export default function OpenDaydreamSideBButton({ label }: Props) {
  return (
    <button
      type="button"
      className="de-btn de-btn-primary text-xs"
      onClick={() => window.dispatchEvent(new Event('de:open-side-b'))}
    >
      {label}
    </button>
  );
}
