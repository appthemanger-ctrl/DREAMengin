
import React from "react";

export type WidgetSpec = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  component: React.FC;
  inputs?: string[];
  outputs?: string[];
  public?: boolean;
  monetized?: boolean;
};

export const WidgetLibrary: Record<string, WidgetSpec> = {
  feedComposer: {
    id: "feedComposer",
    label: "Feed",
    component: () => <div className="text-center">Feed Composer</div>,
    outputs: ["post"],
  },
  socialWidget: {
    id: "socialWidget",
    label: "Social A",
    component: () => <div className="p-2 rounded bg-card shadow">Social</div>,
  },
  musicWidget: {
    id: "musicWidget",
    label: "Music",
    component: () => <div className="p-2 rounded bg-card shadow">Music</div>,
  },
  shopWidget: {
    id: "shopWidget",
    label: "Shop",
    component: () => <div className="p-2 rounded bg-card shadow">Shop</div>,
  },
  customWidget: {
    id: "customWidget",
    label: "Custom",
    component: () => <div className="p-2 rounded bg-card shadow">Custom</div>,
  }
};
