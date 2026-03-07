'use client';

import WidgetShell, { type WidgetShellProps } from '@/components/widgets/WidgetShell';

export type DreamShellProps = WidgetShellProps;

export default function DreamShell(props: DreamShellProps) {
  return <WidgetShell {...props} />;
}
