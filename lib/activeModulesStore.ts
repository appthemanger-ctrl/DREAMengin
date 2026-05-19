'use client';

import type { ActiveModuleInstance } from '@/types/dreamArtifact';

const STORAGE_KEY = (accountId: string) => `dream_active_modules_${accountId}`;

function isBrowser( ){
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function writeInstances(accountId: string, instances: any): ActiveModuleInstance[] | undefined {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY(accountId), JSON.stringify(instances));
}

export function loadActiveModules(accountId?: string | null) {
  if (!accountId || !isBrowser()) return [];

  const raw = window.localStorage.getItem(STORAGE_KEY(accountId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ActiveModuleInstance[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveActiveModule(accountId: string, instance: any): void {
  const existing = loadActiveModules(accountId);
  const map = new Map(existing.map((entry) => [entry.instanceId, entry]));
  map.set(instance.instanceId, instance);
  writeInstances(accountId, Array.from(map.values()));
}

export function saveActiveModules(accountId: string, instances: any) {
  writeInstances(accountId, instances);
}

export function removeActiveModule(accountId: string, instanceId: any): void {
  const next = loadActiveModules(accountId).filter((instance) => instance.instanceId !== instanceId);
  writeInstances(accountId, next);
}