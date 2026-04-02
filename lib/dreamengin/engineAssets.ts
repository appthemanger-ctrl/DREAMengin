import { createClient } from '@/lib/supabase/client';

/**
 * THE FLOW:
 * 1. UI sends Image to Wasm Engine
 * 2. Wasm Engine generates Mesh + Rig (Moving Parts)
 * 3. This function saves those Binary Blobs to Supabase
 *
 * Note: The global_registry entry is created AUTOMATICALLY by the SQL trigger.
 */
export const saveEngineAsset = async (
  label: string,
  image_url: string,
  wasm_output: { mesh: Uint8Array; rig: Uint8Array; dna: object }
) => {
  const supabase = createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return { error: 'Not authenticated' };

  // Encode binary blobs as base64 strings for Supabase storage (browser-safe)
  const uint8ToBase64 = (bytes: Uint8Array): string =>
    btoa(String.fromCharCode(...bytes));
  const meshBase64 = uint8ToBase64(wasm_output.mesh);
  const rigBase64 = uint8ToBase64(wasm_output.rig);

  // 1. Save the Asset + Moving Parts (Binary)
  const { data: asset, error } = await supabase
    .from('game_assets')
    .insert([{
      owner_id: user.id,
      label,
      source_image_url: image_url,
      asset_type: 'mechanical',
      config_dna: wasm_output.dna,
      wasm_mesh_data: meshBase64,
      wasm_rig_data: rigBase64,
    }])
    .select()
    .single();

  if (error) throw error;

  return { asset };
};
