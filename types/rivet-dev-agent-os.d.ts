/**
 * Ambient type declarations for @rivet-dev/agent-os packages.
 *
 * These packages are not yet available on npm. The declarations here ensure
 * the project type-checks and builds while the real packages are unavailable.
 * When the packages are published, remove these declarations and install the
 * real npm packages instead.
 */

declare module '@rivet-dev/agent-os' {
  export interface AgentOsOptions {
    software?: unknown[];
    env?: Record<string, string | undefined>;
  }

  export interface HostTools {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: (...args: any[]) => Promise<unknown>;
  }

  export interface CreateSessionOptions {
    hostTools?: HostTools;
  }

  export interface AgentSession {
    sessionId: string;
    prompt(message: string): Promise<string>;
  }

  export class AgentOs {
    static create(options: AgentOsOptions): Promise<AgentOs>;
    createSession(
      type: string,
      options?: CreateSessionOptions,
    ): Promise<{ sessionId: string }>;
    getSession(sessionId: string): AgentSession | undefined;
    closeSession(sessionId: string): Promise<void>;
  }
}

declare module '@rivet-dev/agent-os-common' {
  const common: unknown;
  export default common;
}

declare module '@rivet-dev/agent-os-pi' {
  const pi: unknown;
  export default pi;
}
