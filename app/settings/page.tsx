import AccentPicker from '@/components/AccentPicker';

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="card p-4">
        <div className="mb-2 font-medium">Accent color</div>
        <AccentPicker />
      </div>
    </div>
  );
}
