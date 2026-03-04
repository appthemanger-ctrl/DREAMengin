import Link from "next/link";

const settingsLinks = [
  { href: "/settings/controls", label: "Customize Controls" },
  { href: "/settings/feed", label: "Feed Sources" },
  { href: "/settings/connectors", label: "Connectors" },
  { href: "/settings/appearance", label: "Appearance" },
  { href: "/settings/data", label: "Delete My Data" },
  { href: "/settings/account", label: "Delete My Dream" },
];

export default function SettingsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-black px-4 py-8">
      <header className="mb-8 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </header>

      <nav className="w-full max-w-2xl flex flex-col gap-2">
        {settingsLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex h-14 items-center rounded-xl border border-white/10 bg-white/5 px-5 text-base text-zinc-200 transition hover:bg-white/10"
          >
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
