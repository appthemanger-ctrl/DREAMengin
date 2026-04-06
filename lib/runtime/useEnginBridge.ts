import { useEffect, useState } from 'react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';

// Template for creating the hooks for each Engine
function createBridgeHook(currentChannel: string) {
  return function useBridge() {
    const [state, setState] = useState({
      lastBpm: null as number | null,
      lastGameScore: null as number | null,
      lastLabResult: null as string | null,
      lastCreatePublish: null as string | null,
      lastBrandCampaign: null as string | null,
    });

    useEffect(() => {
      const channels = {
        music: (p: any) => setState(s => ({ ...s, lastBpm: p.bpm })),
        games: (p: any) => setState(s => ({ ...s, lastGameScore: p.score })),
        lab: (p: any) => setState(s => ({ ...s, lastLabResult: p.experimentId })),
        create: (p: any) => setState(s => ({ ...s, lastCreatePublish: p.contentId })),
        brand: (p: any) => setState(s => ({ ...s, lastBrandCampaign: p.title })),
      };

      const subs = Object.entries(channels)
        .filter(([channel]) => channel !== currentChannel)
        .map(([channel, handler]) => {
          const event = channel === 'music' ? 'music:bpm-changed' : 
                        channel === 'games' ? 'games:score-submitted' :
                        channel === 'lab' ? 'lab:result-ready' :
                        channel === 'create' ? 'create:published' : 'brand:campaign-launched';
          return bridge.subscribe(channel as any, event as any, handler);
        });

      return () => subs.forEach(unsub => unsub());
    }, []);

    return state;
  };
}

export const useCodeEnginBridge = createBridgeHook('code');
export const useStarMakerEnginBridge = createBridgeHook('music');
export const useGameEnginBridge = createBridgeHook('games');
export const useLabEnginBridge = createBridgeHook('lab');
export const useBrandingEnginBridge = createBridgeHook('brand');
export const useContentEnginBridge = createBridgeHook('create');
