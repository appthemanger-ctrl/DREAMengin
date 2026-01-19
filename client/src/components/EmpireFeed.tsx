import { DropItem } from "@shared/schema";

interface EmpireFeedProps {
  drops: DropItem[];
}

export function EmpireFeed({ drops }: EmpireFeedProps) {
  return (
    <div className="glass-soft rounded-lg p-4" style={{ borderRadius: "24px" }}>
      <div className="text-[10px] tracking-[.24em] uppercase text-secondary-glass">
        Empire Feed
      </div>
      <div className="mt-3 space-y-2" data-testid="empire-feed">
        {drops.length === 0 ? (
          <div className="text-sm text-secondary-glass">No recent updates</div>
        ) : (
          drops.map((drop) => (
            <div
              key={drop.id}
              className="p-3 rounded-lg"
              style={{
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(51,65,85,0.6)",
              }}
              data-testid={`feed-item-${drop.id}`}
            >
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {drop.text}
              </div>
              <div className="text-[10px] text-secondary-glass mt-1">{drop.meta}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
