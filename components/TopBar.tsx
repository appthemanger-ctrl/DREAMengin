
import React from "react";

export default function TopBar() {
  return (
    <div className="w-full h-14 px-4 flex items-center justify-between shadow-sm backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
      <button className="text-muted-foreground text-sm">← Back</button>
      <h1 className="text-lg font-semibold">Page Name</h1>
      <button className="text-muted-foreground text-sm">Options</button>
    </div>
  );
}
