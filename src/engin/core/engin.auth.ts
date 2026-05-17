// engin.auth — security/auth module
// Real interface and type exports. No dream.* imports.

export interface EnginSession {
  userId: string | null;
  dreamToken: string | null;
  authenticated: boolean;
}

export function createSession(userId?: string, dreamToken?: string: EnginSession {
  return {
    userId: userId ?? null,
    dreamToken: dreamToken ?? null,
    authenticated: !!(userId && dreamToken),
  };
}

export function validateSession(session: EnginSession: boolean {
  return (
    session.authenticated &&
    session.userId !== null &&
    session.dreamToken !== null &&
    session.userId.length > 0 &&
    session.dreamToken.length > 0
  );
}
