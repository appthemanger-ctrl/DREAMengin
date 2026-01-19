export function InfoCard() {
  return (
    <div
      className="mt-6 glass-soft rounded-xl p-5"
      style={{ borderRadius: "28px" }}
    >
      <div className="text-[10px] tracking-[.24em] uppercase text-secondary-glass">
        How Dreamengin Works
      </div>
      <div className="mt-2 text-sm" style={{ color: "var(--text-primary)" }}>
        Your homepage for all your homepages. Connect every platform, monetize your presence, 
        and manage everything from one control room. Icons open floating windows you can drag and resize.
        Focus mode hides everything for deep work.
      </div>
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <div className="px-2 py-1 rounded-full text-[9px] font-semibold tracking-wide" 
          style={{ background: "rgba(52,211,153,0.2)", color: "rgba(52,211,153,0.95)", border: "1px solid rgba(52,211,153,0.3)" }}>
          Monetization First
        </div>
        <div className="px-2 py-1 rounded-full text-[9px] font-semibold tracking-wide"
          style={{ background: "rgba(56,189,248,0.2)", color: "rgba(56,189,248,0.95)", border: "1px solid rgba(56,189,248,0.3)" }}>
          Connect Everyone
        </div>
        <div className="px-2 py-1 rounded-full text-[9px] font-semibold tracking-wide"
          style={{ background: "rgba(20,184,166,0.2)", color: "rgba(20,184,166,0.95)", border: "1px solid rgba(20,184,166,0.3)" }}>
          No Feed Traps
        </div>
      </div>
    </div>
  );
}
