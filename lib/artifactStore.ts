'use client';

import type { DreamArtifact } from '@/types/dreamArtifact';

const STORAGE_KEY = (accountId: string) => `dream_artifacts_${accountId}`;

const SYSTEM_ARTIFACT_TEMPLATES: readonly Omit<DreamArtifact, 'ownerId' | 'createdAt'>[] = [
  {
    id: 'music-generator',
    type: 'music',
    name: 'Music Generator',
    description: 'Open StarMaker as a live module window.',
    source: 'system',
    moduleUrl: '/daydream/music',
    capabilities: ['generate-music', 'compose', 'mix-audio'],
    icon: '🎵',
    isSystemModule: true,
    metadata: { engin: 'StarMakerEngin', hidden: false },
  },
  {
    id: 'codeengin',
    type: 'system-engin',
    name: 'CodeEngin',
    description: 'Code, run, and review live from HomeDream.',
    source: 'system',
    moduleUrl: '/daydream/code',
    capabilities: ['edit-code', 'run-code'],
    icon: '💻',
    isSystemModule: true,
    metadata: { engin: 'CodeEngin', hidden: false },
  },
  {
    id: 'labengin',
    type: 'system-engin',
    name: 'LabEngin',
    description: 'Experiment and visualize inside a live module.',
    source: 'system',
    moduleUrl: '/daydream/lab',
    capabilities: ['experiment', 'visualize'],
    icon: '🔬',
    isSystemModule: true,
    metadata: { engin: 'LabEngin', hidden: false },
  },
  {
    id: 'gameengin',
    type: 'system-engin',
    name: 'GameEngin',
    description: 'Launch game tooling in a dedicated Dream Window.',
    source: 'system',
    moduleUrl: '/daydream/games',
    capabilities: ['play', 'prototype-games'],
    icon: '🎮',
    isSystemModule: true,
    metadata: { engin: 'GameEngin', hidden: false },
  },
  {
    id: 'brandingengin',
    type: 'system-engin',
    name: 'BrandingEngin',
    description: 'Shape brand assets and campaigns from DreamSpace.',
    source: 'system',
    moduleUrl: '/daydream/brand',
    capabilities: ['brand-design', 'campaign-planning'],
    icon: '🎨',
    isSystemModule: true,
    metadata: { engin: 'BrandingEngin', hidden: false },
  },
  {
    id: 'contentengin',
    type: 'system-engin',
    name: 'ContentEngin',
    description: 'Create and publish content inside a modular window.',
    source: 'system',
    moduleUrl: '/daydream/create',
    capabilities: ['create-content', 'publish'],
    icon: '✏️',
    isSystemModule: true,
    metadata: { engin: 'ContentEngin', hidden: false },
  },
];

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function mergeWithSystemArtifacts(accountId: string, artifacts: DreamArtifact[]): DreamArtifact[] {
  const map = new Map<string, DreamArtifact>();
  for (const artifact of getDefaultSystemArtifacts(accountId)) {
    map.set(artifact.id, artifact);
  }
  for (const artifact of artifacts) {
    map.set(artifact.id, artifact);
  }
  return Array.from(map.values());
}

function writeArtifacts(accountId: string, artifacts: DreamArtifact[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY(accountId), JSON.stringify(artifacts));
}

export function getDefaultSystemArtifacts(accountId = 'system'): DreamArtifact[] {
  const createdAt = Date.now();
  return SYSTEM_ARTIFACT_TEMPLATES.map((artifact) => ({
    ...artifact,
    ownerId: artifact.source === 'system' ? 'system' : accountId,
    createdAt,
  }));
}

export function loadArtifacts(accountId?: string | null): DreamArtifact[] {
  if (!accountId) return getDefaultSystemArtifacts();
  if (!isBrowser()) return getDefaultSystemArtifacts(accountId);

  const raw = window.localStorage.getItem(STORAGE_KEY(accountId));
  if (!raw) return getDefaultSystemArtifacts(accountId);

  try {
    const parsed = JSON.parse(raw) as DreamArtifact[];
    return mergeWithSystemArtifacts(accountId, Array.isArray(parsed) ? parsed : []);
  } catch {
    return getDefaultSystemArtifacts(accountId);
  }
}

export function saveArtifact(accountId: string, artifact: DreamArtifact) {
  const existing = loadArtifacts(accountId);
  const map = new Map(existing.map((entry) => [entry.id, entry]));
  map.set(artifact.id, artifact);
  writeArtifacts(accountId, Array.from(map.values()));
}

export function saveArtifacts(accountId: string, artifacts: DreamArtifact[]) {
  writeArtifacts(accountId, mergeWithSystemArtifacts(accountId, artifacts));
}

export function removeArtifact(accountId: string, artifactId: string) {
  const next = loadArtifacts(accountId).filter((artifact) => artifact.id !== artifactId);
  writeArtifacts(accountId, next);
}

export function listVisibleArtifacts(accountId?: string | null): DreamArtifact[] {
  return loadArtifacts(accountId).filter((artifact) => artifact.metadata?.hidden !== true);
}

export function hideArtifact(accountId: string, artifactId: string) {
  const next = loadArtifacts(accountId).map((artifact) =>
    artifact.id === artifactId
      ? { ...artifact, metadata: { ...(artifact.metadata ?? {}), hidden: true } }
      : artifact,
  );
  writeArtifacts(accountId, next);
}

export function restoreArtifact(accountId: string, artifactId: string) {
  const next = loadArtifacts(accountId).map((artifact) =>
    artifact.id === artifactId
      ? { ...artifact, metadata: { ...(artifact.metadata ?? {}), hidden: false } }
      : artifact,
  );
  writeArtifacts(accountId, next);
}

export function listSystemArtifacts(accountId?: string | null): DreamArtifact[] {
  return loadArtifacts(accountId).filter((artifact) => artifact.isSystemModule);
}
