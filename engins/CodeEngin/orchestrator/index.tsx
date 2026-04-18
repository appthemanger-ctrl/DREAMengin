'use client';

import { AgentPanel } from '../modules/ai-co-pilot/AgentPanel';
import { ArtifactSlot } from '@/lib/enginpipe';

/**
 * CodeEnginOrchestrator – thin composition layer for CodeEngin modules.
 *
 * The existing monolithic CodeEngin component is mounted alongside this
 * orchestrator rather than replaced.  As additional modules are extracted
 * (CI pipeline, pair-programming, etc.) they can be added here.
 *
 * Import example:
 *   import CodeEnginOrchestrator from '@/engins/CodeEngin/orchestrator';
 */
export default function CodeEnginOrchestrator() {
  return (
    <ArtifactSlot artifactId="engin:code">
      <div className="space-y-4">
        <AgentPanel />
        {/*
         * Future modules go here, e.g.:
         * <CIModule />
         * <PairProgrammingModule />
         */}
      </div>
    </ArtifactSlot>
  );
}
