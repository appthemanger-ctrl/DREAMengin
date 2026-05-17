'use client';

/**
 * lib/gameengin/dream-engine.ts
 *
 * DREAMengin Core Bridge — connects the controller layer to Asset DNA.
 *
 * Four capabilities:
 *   saveScannedAsset    — persists a Wasm-generated 3D mesh + rig + DNA blob
 *   bindExistingController — upserts a joystick/button → asset command mapping
 *   syncController      — opens a Realtime channel for live control updates
 *   fetchEverything     — reads the global_registry for DreamDMBar
 *
 * Architecture: lives in lib/ (Logic layer) per GENERATION_LAW §3.1.
 * Security: owner_id set from auth.getUser(); RLS enforces server-side.
 *   Client-side uid filtering is defence-in-depth (AXIOM 4 / SECURITY.md).
 */

import { createClient } from '@/lib/supabase/client';
import { decodeLedgerStringToUint8Array, encodeUint8ArrayToLedgerString } from '@/lib/media/ledger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GameAsset {
  id: string;
  owner_id: string;
  label: string;
  source_image_url: string | null;
  asset_type: string;
  config_dna: unknown;
  wasm_mesh_data: string | null;
  wasm_rig_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface GlobalRegistryEntry {
  id: string;
  object_type: string;
  internal_id: string;
  label: string;
  owner_id: string | null;
  created_at: string;
}

export interface WasmOutput {
  mesh: Uint8Array;
  rig: Uint8Array;
  dna: unknown;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── DreamEngine ───────────────────────────────────────────────────────────────

export const DreamEngine = {
  /**
   * ASSET BUILDER — saves the Wasm-generated 3D mesh & rig (moving parts).
   * Use when a user "scans" an image in Create Daydream.
   * The SQL trigger on game_assets auto-registers the entry in global_registry.
   */
  async saveScannedAsset(
    label: string,
    imageUrl: string,
    wasmOutput: WasmOutput,
  ): Promise<GameAsset> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Auth Required');

    const { data, error } = await supabase
      .from('game_assets')
      .insert([{
        owner_id: user.id,
        label,
        source_image_url: imageUrl,
        config_dna: wasmOutput.dna,
        wasm_mesh_data: encodeUint8ArrayToLedgerString(wasmOutput.mesh, {
          mimeType: 'application/octet-stream',
          fileName: `${label}-mesh.bin`,
        }),
        wasm_rig_data: encodeUint8ArrayToLedgerString(wasmOutput.rig, {
          mimeType: 'application/octet-stream',
          fileName: `${label}-rig.bin`,
        }),
      }])
      .select()
      .single();

    if (error) throw error;
    return data as GameAsset;
  },

  /**
   * CONTROLLER BRIDGE — links an existing joystick/button input to an asset.
   * Upserts so calling it again updates the binding rather than duplicating.
   * Run once when you "possess" a 3D model in the game.
   */
  async bindExistingController(
    assetId: string,
    inputSource: string,
    targetCommand: string,
    sensitivity = 1.0,
  ): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Auth Required');

    const { error } = await supabase
      .from('control_mappings')
      .upsert({
        owner_id: user.id,
        asset_id: assetId,
        input_source: inputSource,
        command_target: targetCommand,
        sensitivity,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'owner_id,asset_id,input_source' });

    if (error) throw new Error(`Binding Failed: ${error.message}`);
  },

  /**
   * REALTIME SYNC — subscribes to control_mappings UPDATE events for an asset.
   * Drop the returned channel into a useEffect cleanup to unsubscribe on unmount.
   *
   * @example
   * const channel = DreamEngine.syncController(assetId, (payload) => { ... });
   * return () => { channel.unsubscribe(); };
   */
  syncController(assetId: string, onUpdate: (payload: unknown) => void) {
    const supabase = createClient();
    return supabase
      .channel(`asset_controls_${assetId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'control_mappings',
          filter: `asset_id=eq.${assetId}`,
        },
        onUpdate,
      )
      .subscribe();
  },

  /**
   * GLOBAL REGISTRY — fetches all platform objects (posts, assets, ads, …)
   * ordered newest-first. Used by DreamDMBar and the GAL discovery layer.
   */
  async fetchEverything(): Promise<GlobalRegistryEntry[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('global_registry')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data ?? []) as GlobalRegistryEntry[];
  },

  decodeAssetBinary(encoded: string | null): Uint8Array | null {
    if (!encoded) return null;
    return decodeLedgerStringToUint8Array(encoded);
  },
};
