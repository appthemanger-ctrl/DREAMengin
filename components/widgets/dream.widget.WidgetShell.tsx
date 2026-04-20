'use client';
// components/widgets/dream.widget.WidgetShell.tsx
// Backward-compat shim. Prefer DreamShell directly.
// The canonical Layer 1 implementation is now in components/dreams/dreamsurface.shell.tsx.
export { default } from '@/components/dreams/dreamsurface.shell';
export type { DreamShellProps as WidgetShellProps, DreamDataState as WidgetDataState } from '@/components/dreams/dreamsurface.shell';
