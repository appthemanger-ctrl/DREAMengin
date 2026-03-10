'use client';
// components/widgets/WidgetShell.tsx
// Backward-compat shim. Prefer DreamShell directly.
// The canonical Layer 1 implementation is now in components/dreams/DreamShell.tsx.
export { default } from '@/components/dreams/DreamShell';
export type { DreamShellProps as WidgetShellProps, DreamDataState as WidgetDataState } from '@/components/dreams/DreamShell';
