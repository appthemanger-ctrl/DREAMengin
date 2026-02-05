
import React from "react";

export default function TopBar() {
  return (
    <div className="w-full h-14 px-4 border-b border-border flex items-center justify-between bg-background shadow-sm">
      <button className="text-muted-foreground text-sm">← Back</button>
      <h1 className="text-lg font-semibold">Page Name</h1>
      <button className="text-muted-foreground text-sm">Options</button>
    </div>
  );
}
