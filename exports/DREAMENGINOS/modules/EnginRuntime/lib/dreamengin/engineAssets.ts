import { createClient } from '@/lib/supabase/client';
import { encodeUint8ArrayToLedgerString } from '@/lib/media/ledger';

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

  const meshBase64 = encodeUint8ArrayToLedgerString(wasm_output.mesh, {
    mimeType: 'application/octet-stream',
    fileName: `${label}-mesh.bin`,
  });
  const rigBase64 = encodeUint8ArrayToLedgerString(wasm_output.rig, {
    mimeType: 'application/octet-stream',
    fileName: `${label}-rig.bin`,
  });

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
