
import React from "react";
import { cn } from "@/lib/utils";
import TopBar from "./TopBar";

type WheelLayoutProps = {
  center: React.ReactNode;
  ring: React.ReactNode[];
};

export default function WheelLayout({ center, ring }: WheelLayoutProps) {
  const ringCount = Math.min(ring.length, 8);
  const angleStep = (2 * Math.PI) / ringCount;

  return (
    <div className="min-h-screen de-sky-bg text-foreground flex flex-col items-center justify-start">
      <TopBar />
      <div className="relative w-full max-w-5xl flex-grow flex items-center justify-center my-8">
        {ring.slice(0, 8).map((widget, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const radius = 180;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: "translate(-50%, -50%)"
              }}
            >
              {widget}
            </div>
          );
        })}
        <div className="relative z-10 w-80 h-80 bg-muted rounded-full shadow-xl flex items-center justify-center">
          {center}
        </div>
      </div>
    </div>
  );
}
