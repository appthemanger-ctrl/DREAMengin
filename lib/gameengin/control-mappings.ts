'use client';

/**
 * lib/gameengin/control-mappings.ts
 *
 * Joystick → asset command binding API.
 *
 * Maps a physical input source (e.g. 'left_joystick') to a command target
 * (e.g. 'rotate_x', 'move_forward') for a given asset, persisted in the
 * `control_mappings` Supabase table.
 *
 * Architecture: lives in lib/ (Logic layer) per GENERATION_LAW §3.1.
 * Security: owner_id is set server-side via RLS; the insert only succeeds
 *   for the currently authenticated user (AXIOM 4 / SECURITY.md).
 */

import { createClient } from '@/lib/supabase/client';

export interface ControlMapping {
  id: string;
  asset_id: string;
  input_source: string;
  command_target: string;
  sensitivity: number;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Persist a joystick → asset command binding.
 *
 * @param assetId     - UUID of the target asset.
 * @param command     - Command string, e.g. 'rotate_x' or 'move_forward'.
 * @param inputSource - Physical input source (default: 'left_joystick').
 * @param sensitivity - Axis sensitivity multiplier (default: 1.5).
 * @returns           - The inserted row or a Supabase error.
 *
 * @example
 * const { data, error } = await mapJoystickToAsset('asset-uuid', 'rotate_x');
 * const { data, error } = await mapJoystickToAsset('asset-uuid', 'aim', 'right_joystick', 2.0);
 */
export const mapJoystickToAsset = async (
  assetId: string,
  command: string,
  inputSource = 'left_joystick',
  sensitivity = 1.5,
): Promise<{ data: ControlMapping[] | null; error: unknown }> => {
  const supabase = createClient();

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('control_mappings')
    .insert([{
      asset_id: assetId,
      input_source: inputSource,
      command_target: command,
      sensitivity,
      owner_id: user.id,
    }])
    .select();

  return { data, error };
};
