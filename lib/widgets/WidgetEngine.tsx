
import React from "react";
import type { WidgetArchitectureLayer } from "@/types/widgets";

export type WidgetSpec = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  component: React.FC;
  inputs?: string[];
  outputs?: string[];
  public?: boolean;
  monetized?: boolean;
  // Widget architecture layers (§11): UI, Data, AI, Commerce
  architectureLayers?: WidgetArchitectureLayer[];
  // Sub-widget slots this widget exposes (§11)
  slots?: string[];
};

export const WidgetLibrary: Record<string, WidgetSpec> = {
  feedComposer: {
    id: "feedComposer",
    label: "Feed",
    component: () => <div className="text-center">Feed Composer</div>,
    outputs: ["post"],
    architectureLayers: [
      { kind: "ui", enabled: true },
      { kind: "data", enabled: true, config: { realtimeSync: true } },
    ],
  },
  socialWidget: {
    id: "socialWidget",
    label: "Social A",
    component: () => <div className="p-2 rounded bg-card shadow">Social</div>,
    architectureLayers: [
      { kind: "ui", enabled: true },
      { kind: "data", enabled: true },
      { kind: "ai", enabled: true, config: { autoSuggest: true } },
    ],
  },
  musicWidget: {
    id: "musicWidget",
    label: "Music",
    component: () => <div className="p-2 rounded bg-card shadow">Music</div>,
    architectureLayers: [
      { kind: "ui", enabled: true },
      { kind: "data", enabled: true },
      { kind: "commerce", enabled: true, config: { priceModel: "free" } },
    ],
  },
  shopWidget: {
    id: "shopWidget",
    label: "Shop",
    component: () => <div className="p-2 rounded bg-card shadow">Shop</div>,
    architectureLayers: [
      { kind: "ui", enabled: true },
      { kind: "data", enabled: true },
      { kind: "commerce", enabled: true, config: { priceModel: "one-time" } },
    ],
  },
  customWidget: {
    id: "customWidget",
    label: "Custom",
    component: () => <div className="p-2 rounded bg-card shadow">Custom</div>,
    architectureLayers: [
      { kind: "ui", enabled: true },
    ],
    slots: ["main", "sidebar"],
  }
};
