'use client';
/**
 * useEnginBridge — per-Engin React hooks that wire real bridge.subscribe calls.
 *
 * Each hook subscribes to the 5 channels that are NOT its own and returns
 * live state derived from incoming events. All subscriptions are cleaned up
 * on unmount via the unsubscribe functions returned by bridge.subscribe.
 *
 * Architecture: lib/runtime/dualRuntimeBridge.ts — all 6 typed channels.
 * Privacy: only IDs / primitives cross Engin boundaries (AXIOM 4).
 */

import { useEffect, useState } from 'react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';

function ts() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── CodeEngin — subscribes to music, games, lab, create, brand ──────────────

export interface CodeEnginBridgeState {
  lastBpm: number | null;
  lastGameScore: number | null;
  lastLabResult: string | null;
  lastCreatePublish: string | null;
  lastBrandCampaign: string | null;
  connectionStatus: { music: string; games: string; lab: string; create: string; brand: string };
}

export function useCodeEnginBridge(): CodeEnginBridgeState {
  const [lastBpm, setLastBpm] = useState<number | null>(null);
  const [lastGameScore, setLastGameScore] = useState<number | null>(null);
  const [lastLabResult, setLastLabResult] = useState<string | null>(null);
  const [lastCreatePublish, setLastCreatePublish] = useState<string | null>(null);
  const [lastBrandCampaign, setLastBrandCampaign] = useState<string | null>(null);
  const [status, setStatus] = useState({
    music: 'Waiting for BPM…',
    games: 'Waiting for game events…',
    lab: 'Waiting for lab results…',
    create: 'Waiting for published content…',
    brand: 'Waiting for campaigns…',
  });

  useEffect(() => {
    const subs = [
      bridge.subscribe('music', 'music:bpm-changed', (p) => {
        setLastBpm(p.bpm);
        setStatus((s) => ({ ...s, music: `BPM ${p.bpm} · ${ts()}` }));
      }),
      bridge.subscribe('games', 'games:score-submitted', (p) => {
        setLastGameScore(p.score);
        setStatus((s) => ({ ...s, games: `Score ${p.score} · ${ts()}` }));
      }),
      bridge.subscribe('lab', 'lab:result-ready', (p) => {
        setLastLabResult(p.experimentId);
        setStatus((s) => ({ ...s, lab: `Result: ${p.experimentId} · ${ts()}` }));
      }),
      bridge.subscribe('create', 'create:published', (p) => {
        setLastCreatePublish(p.contentId);
        setStatus((s) => ({ ...s, create: `Published ${p.contentId} · ${ts()}` }));
      }),
      bridge.subscribe('brand', 'brand:campaign-launched', (p) => {
        setLastBrandCampaign(p.title);
        setStatus((s) => ({ ...s, brand: `Campaign: ${p.title} · ${ts()}` }));
      }),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  return { lastBpm, lastGameScore, lastLabResult, lastCreatePublish, lastBrandCampaign, connectionStatus: status };
}

// ─── GameEngin — subscribes to music, code, lab, create, brand ───────────────

export interface GameEnginBridgeState {
  lastBpm: number | null;
  lastBpmTrackId: string | null;
  lastCodeBuild: string | null;
  lastLabResult: string | null;
  lastCreateAsset: string | null;
  lastBrandSegment: string | null;
  connectionStatus: { music: string; code: string; lab: string; create: string; brand: string };
}

export function useGameEnginBridge(): GameEnginBridgeState {
  const [lastBpm, setLastBpm] = useState<number | null>(null);
  const [lastBpmTrackId, setLastBpmTrackId] = useState<string | null>(null);
  const [lastCodeBuild, setLastCodeBuild] = useState<string | null>(null);
  const [lastLabResult, setLastLabResult] = useState<string | null>(null);
  const [lastCreateAsset, setLastCreateAsset] = useState<string | null>(null);
  const [lastBrandSegment, setLastBrandSegment] = useState<string | null>(null);
  const [status, setStatus] = useState({
    music: 'BPM sync ready',
    code: 'Script runtime ready',
    lab: 'Physics sim ready',
    create: 'Asset pipeline ready',
    brand: 'Achievement sharing ready',
  });

  useEffect(() => {
    const subs = [
      bridge.subscribe('music', 'music:bpm-changed', (p) => {
        setLastBpm(p.bpm);
        setLastBpmTrackId(p.trackId);
        setStatus((s) => ({ ...s, music: `BPM ${p.bpm} synced · ${ts()}` }));
      }),
      bridge.subscribe('code', 'code:build-success', (p) => {
        setLastCodeBuild(p.projectId);
        setStatus((s) => ({ ...s, code: `Deploy: ${p.projectId} · ${ts()}` }));
      }),
      bridge.subscribe('lab', 'lab:result-ready', (p) => {
        setLastLabResult(p.experimentId);
        setStatus((s) => ({ ...s, lab: `Result: ${p.experimentId} · ${ts()}` }));
      }),
      bridge.subscribe('create', 'create:export-asset', (p) => {
        setLastCreateAsset(p.assetId);
        setStatus((s) => ({ ...s, create: `Asset ready · ${ts()}` }));
      }),
      bridge.subscribe('brand', 'brand:segment-created', (p) => {
        setLastBrandSegment(p.name);
        setStatus((s) => ({ ...s, brand: `Segment: ${p.name} · ${ts()}` }));
      }),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  return { lastBpm, lastBpmTrackId, lastCodeBuild, lastLabResult, lastCreateAsset, lastBrandSegment, connectionStatus: status };
}

// ─── StarMakerEngin — subscribes to games, code, lab, create, brand ──────────

export interface StarMakerEnginBridgeState {
  lastGameSession: string | null;
  lastCodeBuild: string | null;
  lastLabExport: string | null;
  lastCreateDraft: string | null;
  lastBrandAsset: string | null;
  connectionStatus: { games: string; code: string; lab: string; create: string; brand: string };
}

export function useStarMakerEnginBridge(): StarMakerEnginBridgeState {
  const [lastGameSession, setLastGameSession] = useState<string | null>(null);
  const [lastCodeBuild, setLastCodeBuild] = useState<string | null>(null);
  const [lastLabExport, setLastLabExport] = useState<string | null>(null);
  const [lastCreateDraft, setLastCreateDraft] = useState<string | null>(null);
  const [lastBrandAsset, setLastBrandAsset] = useState<string | null>(null);
  const [status, setStatus] = useState({
    games: 'Waiting for game session…',
    code: 'Waiting for build…',
    lab: 'Waiting for export…',
    create: 'Waiting for draft…',
    brand: 'Waiting for brand update…',
  });

  useEffect(() => {
    const subs = [
      bridge.subscribe('games', 'games:session-started', (p) => {
        setLastGameSession(p.gameTitle);
        setStatus((s) => ({ ...s, games: `Playing: ${p.gameTitle} · ${ts()}` }));
      }),
      bridge.subscribe('code', 'code:build-success', (p) => {
        setLastCodeBuild(p.projectId);
        setStatus((s) => ({ ...s, code: `Build: ${p.projectId} · ${ts()}` }));
      }),
      bridge.subscribe('lab', 'lab:data-exported', (p) => {
        setLastLabExport(p.exportId);
        setStatus((s) => ({ ...s, lab: `Export ready · ${ts()}` }));
      }),
      bridge.subscribe('create', 'create:draft-saved', (p) => {
        setLastCreateDraft(p.title);
        setStatus((s) => ({ ...s, create: `Draft: ${p.title} · ${ts()}` }));
      }),
      bridge.subscribe('brand', 'brand:asset-updated', (p) => {
        setLastBrandAsset(p.assetType);
        setStatus((s) => ({ ...s, brand: `Asset: ${p.assetType} · ${ts()}` }));
      }),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  return { lastGameSession, lastCodeBuild, lastLabExport, lastCreateDraft, lastBrandAsset, connectionStatus: status };
}

// ─── LabEngin — subscribes to music, games, code, create, brand ──────────────

export interface LabEnginBridgeState {
  lastStem: string | null;
  lastGameScore: number | null;
  lastCodeCell: string | null;
  lastCreatePublish: string | null;
  lastBrandSnapshot: string | null;
  connectionStatus: { music: string; games: string; code: string; create: string; brand: string };
}

export function useLabEnginBridge(): LabEnginBridgeState {
  const [lastStem, setLastStem] = useState<string | null>(null);
  const [lastGameScore, setLastGameScore] = useState<number | null>(null);
  const [lastCodeCell, setLastCodeCell] = useState<string | null>(null);
  const [lastCreatePublish, setLastCreatePublish] = useState<string | null>(null);
  const [lastBrandSnapshot, setLastBrandSnapshot] = useState<string | null>(null);
  const [status, setStatus] = useState({
    music: 'Waiting for stem…',
    games: 'Waiting for score data…',
    code: 'Waiting for cell output…',
    create: 'Waiting for publish…',
    brand: 'Waiting for analytics…',
  });

  useEffect(() => {
    const subs = [
      bridge.subscribe('music', 'music:stem-ready', (p) => {
        setLastStem(p.stemType);
        setStatus((s) => ({ ...s, music: `Stem: ${p.stemType} · ${ts()}` }));
      }),
      bridge.subscribe('games', 'games:score-submitted', (p) => {
        setLastGameScore(p.score);
        setStatus((s) => ({ ...s, games: `Score ${p.score} · ${ts()}` }));
      }),
      bridge.subscribe('code', 'code:cell-executed', (p) => {
        setLastCodeCell(p.cellId);
        setStatus((s) => ({ ...s, code: `Cell ${p.cellId} · ${ts()}` }));
      }),
      bridge.subscribe('create', 'create:published', (p) => {
        setLastCreatePublish(p.contentId);
        setStatus((s) => ({ ...s, create: `Published · ${ts()}` }));
      }),
      bridge.subscribe('brand', 'brand:analytics-snapshot', (p) => {
        setLastBrandSnapshot(p.snapshotId);
        setStatus((s) => ({ ...s, brand: `Snapshot ready · ${ts()}` }));
      }),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  return { lastStem, lastGameScore, lastCodeCell, lastCreatePublish, lastBrandSnapshot, connectionStatus: status };
}

// ─── BrandingEngin — subscribes to music, games, code, lab, create ───────────

export interface BrandingEnginBridgeState {
  lastTrack: string | null;
  lastAchievement: string | null;
  lastCodeDeploy: string | null;
  lastLabSim: string | null;
  lastPublish: string | null;
  connectionStatus: { music: string; games: string; code: string; lab: string; create: string };
}

export function useBrandingEnginBridge(): BrandingEnginBridgeState {
  const [lastTrack, setLastTrack] = useState<string | null>(null);
  const [lastAchievement, setLastAchievement] = useState<string | null>(null);
  const [lastCodeDeploy, setLastCodeDeploy] = useState<string | null>(null);
  const [lastLabSim, setLastLabSim] = useState<string | null>(null);
  const [lastPublish, setLastPublish] = useState<string | null>(null);
  const [status, setStatus] = useState({
    music: 'Waiting for release…',
    games: 'Waiting for achievement…',
    code: 'Waiting for deploy…',
    lab: 'Waiting for sim result…',
    create: 'Waiting for publish…',
  });

  useEffect(() => {
    const subs = [
      bridge.subscribe('music', 'music:track-released', (p) => {
        setLastTrack(p.title);
        setStatus((s) => ({ ...s, music: `Released: ${p.title} · ${ts()}` }));
      }),
      bridge.subscribe('games', 'games:achievement-unlocked', (p) => {
        setLastAchievement(p.title);
        setStatus((s) => ({ ...s, games: `Achievement: ${p.title} · ${ts()}` }));
      }),
      bridge.subscribe('code', 'code:deploy-to-game', (p) => {
        setLastCodeDeploy(p.projectId);
        setStatus((s) => ({ ...s, code: `Deploy: ${p.projectId} · ${ts()}` }));
      }),
      bridge.subscribe('lab', 'lab:simulation-complete', (p) => {
        setLastLabSim(p.simulationId);
        setStatus((s) => ({ ...s, lab: `Sim done · ${ts()}` }));
      }),
      bridge.subscribe('create', 'create:published', (p) => {
        setLastPublish(p.contentId);
        setStatus((s) => ({ ...s, create: `Published · ${ts()}` }));
      }),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  return { lastTrack, lastAchievement, lastCodeDeploy, lastLabSim, lastPublish, connectionStatus: status };
}

// ─── ContentEngin — subscribes to music, games, code, lab, brand ─────────────

export interface ContentEnginBridgeState {
  lastStem: string | null;
  lastStemUrl: string | null;
  lastAchievement: string | null;
  lastNotebook: string | null;
  lastLabExport: string | null;
  lastBrandAsset: string | null;
  connectionStatus: { music: string; games: string; code: string; lab: string; brand: string };
}

export function useContentEnginBridge(): ContentEnginBridgeState {
  const [lastStem, setLastStem] = useState<string | null>(null);
  const [lastStemUrl, setLastStemUrl] = useState<string | null>(null);
  const [lastAchievement, setLastAchievement] = useState<string | null>(null);
  const [lastNotebook, setLastNotebook] = useState<string | null>(null);
  const [lastLabExport, setLastLabExport] = useState<string | null>(null);
  const [lastBrandAsset, setLastBrandAsset] = useState<string | null>(null);
  const [status, setStatus] = useState({
    music: 'Waiting for stem…',
    games: 'Waiting for achievement…',
    code: 'Waiting for notebook…',
    lab: 'Waiting for export…',
    brand: 'Waiting for asset…',
  });

  useEffect(() => {
    const subs = [
      bridge.subscribe('music', 'music:stem-ready', (p) => {
        setLastStem(p.stemType);
        setLastStemUrl(p.url);
        setStatus((s) => ({ ...s, music: `Stem: ${p.stemType} · ${ts()}` }));
      }),
      bridge.subscribe('games', 'games:achievement-unlocked', (p) => {
        setLastAchievement(p.title);
        setStatus((s) => ({ ...s, games: `Achievement: ${p.title} · ${ts()}` }));
      }),
      bridge.subscribe('code', 'code:notebook-exported', (p) => {
        setLastNotebook(p.notebookId);
        setStatus((s) => ({ ...s, code: `Notebook: ${p.notebookId} · ${ts()}` }));
      }),
      bridge.subscribe('lab', 'lab:data-exported', (p) => {
        setLastLabExport(p.exportId);
        setStatus((s) => ({ ...s, lab: `Export ready · ${ts()}` }));
      }),
      bridge.subscribe('brand', 'brand:asset-updated', (p) => {
        setLastBrandAsset(p.assetType);
        setStatus((s) => ({ ...s, brand: `Asset: ${p.assetType} · ${ts()}` }));
      }),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  return { lastStem, lastStemUrl, lastAchievement, lastNotebook, lastLabExport, lastBrandAsset, connectionStatus: status };
}
