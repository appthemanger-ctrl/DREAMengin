/**
 * app/api/shellhub/devices/route.ts
 *
 * GET /api/shellhub/devices
 *
 * Server-side proxy: reads ShellHub credentials from connector_accounts.token_blob,
 * calls the ShellHub API, and returns the device list.
 *
 * Never returns token_blob or credentials to the client.
 *
 * Security (AXIOM 4 — Security by Default):
 *   - Requires authenticated user via supabase.auth.getUser()
 *   - RLS on connector_accounts enforces user_id = auth.uid() at DB layer
 *   - Returns 401 for unauthenticated requests
 *   - ShellHub API key is never returned in the response
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  shellhubListDevices,
  SHELLHUB_DEFAULT_SERVER,
  type ShellHubDevice,
} from '@/lib/connectors/providers/shellhub';

export const dynamic = 'force-dynamic';

export interface ShellHubDevicesResponse {
  ok: boolean;
  /** Sanitized server URL (no credentials) — safe to return to the client */
  server_url?: string;
  devices?: ShellHubDevice[];
  error?: string;
}

export async function GET(): Promise<NextResponse<ShellHubDevicesResponse>> {
  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorised' }, { status: 401 });
  }

  // Read credentials — server-side only; never returned to client
  const { data: account, error: fetchError } = await db
    .from('connector_accounts')
    .select('status, token_blob')
    .eq('user_id', user.id)
    .eq('provider', 'shellhub')
    .maybeSingle();

  if (fetchError || !account) {
    return NextResponse.json(
      { ok: false, error: 'ShellHub connector not configured. Connect first.' },
      { status: 404 },
    );
  }

  if (account.status !== 'connected') {
    return NextResponse.json(
      { ok: false, error: `ShellHub connector status is "${account.status}". Please reconnect.` },
      { status: 409 },
    );
  }

  const creds = account.token_blob as Record<string, string>;
  // server_url is not sensitive (it is a public URL), so we include it in the response
  // so the UI can construct terminal/dashboard links that always match the connected account.
  const serverUrl = (creds.server_url as string | undefined) || SHELLHUB_DEFAULT_SERVER;

  try {
    const devices = await shellhubListDevices({
      server_url: serverUrl,
      api_key: creds.api_key ?? '',
    });
    return NextResponse.json({ ok: true, server_url: serverUrl, devices });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error fetching devices';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
