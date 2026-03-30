
import React from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { ArrowLeft } from "lucide-react";

interface TopBarProps {
  title?: string;
  backHref?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  accentColor?: string;
  eyebrow?: string;
}

export default function TopBar({
  title,
  backHref,
  onBack,
  rightSlot,
  accentColor = "var(--de-accent)",
  eyebrow,
}: TopBarProps = {}) {
  const hasBack = !!(backHref || onBack);

  return (
    <header
      className="topbar-premium sicc-bar-edge"
      style={{ position: "sticky", top: 0, zIndex: 80 }}
    >
      {/* Back button */}
      {hasBack && (
        backHref ? (
          <Link
            href={backHref}
            className="topbar-back-btn"
            aria-label="Go back"
            style={{ textDecoration: "none", flexShrink: 0 }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </Link>
        ) : (
          <button
            type="button"
            className="topbar-back-btn"
            onClick={onBack}
            aria-label="Go back"
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </button>
        )
      )}

      {/* Brand logo — always present, left-anchored */}
      {!hasBack && (
        <Link href="/homedream" style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }}>
          <BrandLogo width={28} height={28} alt="DREAMengin" />
        </Link>
      )}

      {/* Title area */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: hasBack ? 4 : 8 }}>
        {eyebrow && (
          <div style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: accentColor,
            lineHeight: 1,
            marginBottom: 2,
          }}>
            {eyebrow}
          </div>
        )}
        {title && (
          <h1 className="topbar-title" style={{ margin: 0 }}>
            {title}
          </h1>
        )}
        {!title && !eyebrow && (
          <span style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            background: `linear-gradient(135deg, var(--de-heading) 0%, ${accentColor} 60%, var(--de-gold) 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            DREAMengin
          </span>
        )}
      </div>

      {/* Right slot */}
      {rightSlot && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {rightSlot}
        </div>
      )}
    </header>
  );
}
