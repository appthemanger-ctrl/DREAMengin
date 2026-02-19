export type DeviceMode = 'desktop' | 'mobile' | 'desktop_on_mobile';

export type ToolContext = {
  userId: string;
  mode: DeviceMode;
  route: string;
  projectId?: string;
  notebookId?: string;
  attachmentId?: string;
  featureFlags?: Record<string, boolean>;
};

export type ToolRequest = {
  action: string;
  input: Record<string, unknown>;
  context: ToolContext;
};

export type ToolResult = {
  ok: boolean;
  action: string;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    retryable?: boolean;
  };
};

export interface DrEamsTools {
  run(req: ToolRequest): Promise<ToolResult>;
}
