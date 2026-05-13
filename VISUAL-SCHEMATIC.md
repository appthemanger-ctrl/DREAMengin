# VISUAL SCHEMATIC

This is the owner-facing Supabase-style visual schematic for the entire DREAMengin repository.
It shows every file, folder, symbol, and connection, including disconnected/floating orphan nodes.

**Live viewer:** https://appthemanger-ctrl.github.io/DREAMengin/

<!-- VISUAL-SCHEMATIC:AUTO-GENERATED:START -->
### Auto-Generated Repository Overview

- **Total files:** 1904
- **Total function/class nodes:** 3412
- **Total edges:** 5065
- **Orphan nodes:** 3020

#### Top-Level Folder Connectivity (overview)
```mermaid
graph LR
  app["app"] -->|793| lib["lib"]
  app["app"] -->|284| components["components"]
  components["components"] -->|282| lib["lib"]
  tests["tests"] -->|238| lib["lib"]
  engins["engins"] -->|107| lib["lib"]
  lib["lib"] -->|54| types["types"]
  app["app"] -->|31| types["types"]
  engins["engins"] -->|30| components["components"]
  tests["tests"] -->|24| components["components"]
  app["app"] -->|20| engins["engins"]
  daydreams["daydreams"] -->|19| components["components"]
  components["components"] -->|15| engins["engins"]
  lib["lib"] -->|15| components["components"]
  tests["tests"] -->|15| app["app"]
  dreamdmbar["dreamdmbar"] -->|14| lib["lib"]
  daydreams["daydreams"] -->|11| lib["lib"]
  hooks["hooks"] -->|10| lib["lib"]
  lib["lib"] -->|9| engine["engine"]
  app["app"] -->|8| styles["styles"]
  components["components"] -->|7| types["types"]
  daydreams["daydreams"] -->|7| engins["engins"]
  components["components"] -->|5| app["app"]
  coresurfaces["coresurfaces"] -->|5| components["components"]
  tests["tests"] -->|5| types["types"]
  components["components"] -->|4| hooks["hooks"]
  tests["tests"] -->|4| scripts["scripts"]
  app["app"] -->|3| hooks["hooks"]
  engins["engins"] -->|3| hooks["hooks"]
  scripts["scripts"] -->|3| lib["lib"]
  coresurfaces["coresurfaces"] -->|2| lib["lib"]
  src["src"] -->|2| lib["lib"]
  types["types"] -->|2| lib["lib"]
  components["components"] -->|1| dreamdmbar["dreamdmbar"]
  dreamdmbar["dreamdmbar"] -->|1| components["components"]
  hooks["hooks"] -->|1| types["types"]
  tests["tests"] -->|1| utils["utils"]
  utils["utils"] -->|1| lib["lib"]
```

#### File-Level Connectivity (auto-generated)

<details><summary>lib/ (521 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `lib/supabase/server.ts` | ts | 2 | 180 | `app/(internal)/idari-console/page.tsx`, `app/(internal)/idari-console/platform-errors/page.tsx`, `app/(internal)/idari-console/platform-health/page.tsx` | `types/supabase.ts`, `lib/supabase/config.ts` |
| `lib/supabase/client.ts` | ts | 1 | 60 | `app/ads/create/page.tsx`, `app/auth/reset-password/page.tsx`, `app/auth/update-password/page.tsx` | `lib/supabase/config.ts` |
| `lib/dev-bypass.ts` | ts | 0 | 44 | `app/(internal)/idari-console/page.tsx`, `app/daydream/analytics/page.tsx`, `app/daydream/brand/page.tsx` | — |
| `lib/runtime/dualRuntimeBridge.ts` | ts | 2 | 32 | `app/dreamdmbar/_components/dreamr/dream.DreamRCore.tsx`, `app/dreamdmbar/_components/dreamr/dream.DreamRFeed.tsx`, `components/daydream/dream.CodeDreamIDE.tsx` | `lib/runtime/madMaxiSnapshotBridge.ts`, `lib/vm/wasmGpuVM.ts` |
| `lib/dreamdm/DreamSystemContext.tsx` | tsx | 4 | 26 | `app/dreamdmbar/_components/DreamBarDataBridge.tsx`, `app/dreamdmbar/dreamspace/page.tsx`, `app/dreamdmbar/dualruntime/page.tsx` | `lib/panels/panelTypes.ts`, `lib/dreamdm/barInteractions.ts`, `lib/supabase/client.ts` |
| `lib/activity/types.ts` | ts | 0 | 20 | `app/api/activity/track/route.ts`, `app/api/ads/view/route.ts`, `app/api/metrics/platform/route.ts` | — |
| `lib/connectors/normalise.ts` | ts | 1 | 18 | `lib/connectors/providers/bluesky.ts`, `lib/connectors/providers/devto.ts`, `lib/connectors/providers/facebook.ts` | `types/connector.ts` |
| `lib/forge/forgeRegistry.ts` | ts | 0 | 17 | `app/daydream/forge/page.tsx`, `components/dreams/dreamsurface.dreamspace.tsx`, `components/forge/dream.panel.AIBuilderPanel.tsx` | — |
| `lib/ai/triad.ts` | ts | 2 | 16 | `app/(internal)/idari-console/page.tsx`, `app/actions/dream-docs.ts`, `app/api/admin/ai-chat/route.ts` | `lib/ai/groq.ts`, `lib/ai/schemas.ts` |
| `lib/identity/canonical-names.ts` | ts | 0 | 15 | `components/dreamengin/dream.DREAMenginOS.tsx`, `components/runtime/dream.RuntimeView.tsx`, `lib/dream-window/DreamWindowLifecycle.ts` | — |
| `lib/api/route.ts` | ts | 1 | 13 | `app/api/account/delete-data/route.ts`, `app/api/account/delete-dream/route.ts`, `app/api/account/export-data/route.ts` | `lib/supabase/server.ts` |
| `lib/gameengin/power-systems.ts` | ts | 0 | 13 | `lib/gameengin/core.ts`, `lib/gameengin/index.ts`, `lib/gameengin/systems/ai.ts` | — |
| `lib/games/hooks.ts` | ts | 2 | 13 | `app/daydream/game/dream.shell.ImmersiveGameShell.tsx`, `components/games/dream.AvenueOfMirrors.tsx`, `components/games/dream.DefuseRitual.tsx` | `lib/webgpu.ts`, `lib/games/performance-baseline.ts` |
| `lib/media/ledger.ts` | ts | 0 | 13 | `app/api/ledger-media/route.ts`, `app/dreamdmbar/_components/dreamr/dreamsurface.dreamr.tsx`, `components/dream.CreatePostModal.tsx` | — |
| `lib/supabase/config.ts` | ts | 0 | 13 | `app/api/auth/providers/route.ts`, `app/api/setup/google-oauth/route.ts`, `app/auth/callback/route.ts` | — |
| `lib/forge/useForgeActivity.ts` | ts | 1 | 12 | `components/daydream/dream.shell.DaydreamShell.tsx`, `components/daydream/dreamsurface.daydream.BrandDaydream.tsx`, `components/dream.universal_asset_registry.tsx` | `lib/forge/forgeRegistry.ts` |
| `lib/social/rss-feed.ts` | ts | 1 | 12 | `app/api/social/rss-feed/route.ts`, `lib/connectors/providers/devto.ts`, `lib/connectors/providers/facebook.ts` | `types/connector.ts` |
| `lib/ui/CustomizeModeContext.tsx` | tsx | 1 | 12 | `app/layout.tsx`, `app/settings/appearance/page.tsx`, `components/customize/dream.bar.CustomizeModeBar.tsx` | `lib/ui/skin-engine.ts` |
| `lib/dreamdm/barInteractions.ts` | ts | 0 | 11 | `app/dreamdmbar/_components/DreamBarDataBridge.tsx`, `components/dream.OSShellActivator.tsx`, `components/home/dream.NeuralSeamCanvas.tsx` | — |
| `lib/forge/forgeIntelligence.ts` | ts | 1 | 11 | `components/daydream/dreamsurface.daydream.BrandDaydream.tsx`, `components/dreams/dreamsurface.dreamspace.tsx`, `engins/dream.ForgeEngin.tsx` | `lib/forge/forgeRegistry.ts` |
| `lib/gameengin/cartridges/manifest.ts` | ts | 0 | 11 | `app/gameengin/cartridges/[id]/page.tsx`, `components/gameengin/dream.cartridge.CartridgeBrowser.tsx`, `components/gameengin/dream.cartridge.CartridgeLauncher.tsx` | — |
| `lib/runtime/dreamOSBus.ts` | ts | 5 | 11 | `app/dreamdmbar/_components/DreamBarDataBridge.tsx`, `app/dreamdmbar/_components/DreamSpaceRegion.tsx`, `components/dream.OSShellActivator.tsx` | `lib/runtime/dualRuntime.ts`, `lib/identity/canonical-names.ts`, `lib/runtime/dualRuntimeBridge.ts` |
| `lib/utils.ts` | ts | 0 | 11 | `app/dream-effects/page.tsx`, `components/dream.FeedCard.tsx`, `components/dream.MessagesClient.tsx` | — |
| `lib/ai/audit.ts` | ts | 2 | 10 | `app/api/account/delete-data/route.ts`, `app/api/account/delete-dream/route.ts`, `app/api/ai/boogieman/child-safety/route.ts` | `lib/supabase/server.ts`, `lib/ai/boogie-policy.ts` |
| `lib/ai/boogie-policy.ts` | ts | 0 | 9 | `app/api/ai/boogieman/status/route.ts`, `app/api/appeal/route.ts`, `app/policy/page.tsx` | — |
| `lib/dream-window/DreamWindowLifecycle.ts` | ts | 1 | 9 | `app/api/dream-windows/[id]/route.ts`, `app/api/dream-windows/route.ts`, `components/dreams/dream.widget.SuperDreamWidget.tsx` | `lib/identity/canonical-names.ts` |
| `lib/eventBus.ts` | ts | 0 | 9 | `components/dream.ForgeDreamCanvas.tsx`, `lib/dreamenginOS/OSContext.tsx`, `lib/dreamenginOS/index.ts` | — |
| `lib/feed/useLiveFeed.ts` | ts | 3 | 9 | `app/dreamdmbar/_components/dreamr/dreamsurface.dreamr.tsx`, `app/dreamdmbar/layout.tsx`, `components/dream.HomeFeed.tsx` | `lib/supabase/client.ts`, `lib/media/postMedia.ts`, `engine/io.ts` |
| `lib/games/navigation.ts` | ts | 0 | 9 | `app/daydream/game/dream.shell.ImmersiveGameShell.tsx`, `app/daydream/games/page.tsx`, `app/daydream/play/page.tsx` | — |
| `lib/ai/schemas.ts` | ts | 0 | 8 | `app/api/ai/eams/route.ts`, `app/api/ai/execute/route.ts`, `app/api/ai/idari/route.ts` | — |
| `lib/auth/nextRedirect.ts` | ts | 0 | 8 | `app/auth/callback/route.ts`, `app/daydream/games/page.tsx`, `app/engines/games/builder/page.tsx` | — |
| `lib/babylon/createEngine.ts` | ts | 0 | 8 | `components/dreamengin/dream.DREAMenginOS.tsx`, `components/dreamengin/dream.scene.BabylonGameScene.tsx`, `components/dreamengin/dream.scene.DrEamsScene.tsx` | — |
| `lib/connectors/connectorRegistry.ts` | ts | 0 | 8 | `app/api/connectors/status/route.ts`, `app/connectors/dream.ConnectorsClient.tsx`, `components/connectors/dream.AddSliceSheet.tsx` | — |
| `lib/media/postMedia.ts` | ts | 0 | 8 | `app/api/dreamr/feed/route.ts`, `app/api/dreamr/suggested/route.ts`, `app/api/feed/route.ts` | — |
| `lib/observability/collector.ts` | ts | 1 | 8 | `app/api/admin/observability/route.ts`, `lib/agents/idariLoop.ts`, `lib/observability/correlator.ts` | `lib/observability/otelBridge.ts` |
| `lib/widgets/widgetRegistry.ts` | ts | 0 | 8 | `app/connectors/dream.ConnectorsClient.tsx`, `components/connectors/dream.NoSlotDialog.tsx`, `components/connectors/dream.PlacementMode.tsx` | — |
| `lib/child-safety/childSafetyDetector.ts` | ts | 1 | 7 | `app/api/ai/boogieman/child-safety/route.ts`, `app/api/comments/route.ts`, `app/api/messages/route.ts` | `lib/child-safety/imageClassifier.ts` |
| `lib/connectors/providers/youtube.ts` | ts | 2 | 7 | `app/api/connectors/[provider]/connect/route.ts`, `app/api/connectors/[provider]/verify/route.ts`, `app/api/youtube/channel/route.ts` | `lib/connectors/normalise.ts`, `types/connector.ts` |
| `lib/daydream/useDaydreamPersistence.ts` | ts | 1 | 7 | `engins/dream.panel.AnalyticsEngin.tsx`, `engins/engin.BrandingEngin.tsx`, `engins/engin.CodeEngin.tsx` | `lib/supabase/client.ts` |
| `lib/dreamenginOS/index.ts` | ts | 11 | 7 | `engins/engin.BrandingEngin.tsx`, `engins/engin.CodeEngin.tsx`, `engins/engin.ContentEngin.tsx` | `lib/ledger.ts`, `lib/eventBus.ts`, `lib/slog.ts` |
| `lib/gameengin/cartridge.ts` | ts | 0 | 7 | `components/gameengin/dream.cartridge.CartridgeLauncher.tsx`, `engins/engin.GameEngin.tsx`, `lib/gameengin/GameRuntime.tsx` | — |
| `lib/runtime/useEnginCoopSync.ts` | ts | 3 | 7 | `engins/dream.panel.AnalyticsEngin.tsx`, `engins/engin.BrandingEngin.tsx`, `engins/engin.CodeEngin.tsx` | `lib/runtime/useSharedEnginChannel.ts`, `lib/runtime/instanceManager.ts`, `types/module-manifest.ts` |
| `lib/social/platforms.ts` | ts | 0 | 7 | `components/dream.ProfileEditor.tsx`, `components/profile/dream.ProfileCanvas.tsx`, `components/ui/dream.PlatformBadge.tsx` | — |
| `lib/agents/agentBus.ts` | ts | 2 | 6 | `app/api/account/delete-dream/route.ts`, `components/dream.AIAssistant.tsx`, `components/dream.DrEamsVoiceAssistant.tsx` | `lib/ai/schemas.ts`, `lib/ai/triad.ts` |
| `lib/ai/boogieman.ts` | ts | 2 | 6 | `app/api/ai/boogieman/child-safety/route.ts`, `app/api/ai/boogieman/privacy-event/route.ts`, `app/api/ai/boogieman/route.ts` | `lib/ai/schemas.ts`, `lib/ai/boogie-policy.ts` |
| `lib/dreamnav/delta.ts` | ts | 0 | 6 | `components/dreamengin/dream.menu.OutdreamMenu.tsx`, `components/dreamengin/dream.overlay.ViewAllDreamsOverlay.tsx`, `components/dreamnav/dreamsurface.dreamnav.tsx` | — |
| `lib/engin-runtime/EnginBaseState.ts` | ts | 0 | 6 | `lib/engin-runtime/EnginRuleSetContract.ts`, `lib/engin-runtime/EnginRuntime.ts`, `lib/engin-runtime/index.ts` | — |
| `lib/gameengin/brain-reader.ts` | ts | 0 | 6 | `app/api/gameengin/crash-report/route.ts`, `tests/gameengin-architect.test.ts`, `tests/gameengin-crash-modal.test.ts` | — |
| `lib/games/mobileControls.ts` | ts | 1 | 6 | `components/games/dream.EchoArena.tsx`, `components/games/dream.GameController.tsx`, `components/games/dream.hud.GameHUD.tsx` | `lib/games/useRemoteChannel.ts` |
| `lib/god-tier/godTierEngine.ts` | ts | 1 | 6 | `components/dreamengin/dream.scene.BabylonGameScene.tsx`, `components/dreamengin/dream.scene.DrEamsScene.tsx`, `components/games/madmaxi/dream.MadmaxiGame.tsx` | `lib/webgpu/director.ts` |
| `lib/navigation/WidgetInstanceMemory.ts` | ts | 0 | 6 | `components/dream.ProfileSpace.tsx`, `components/dream.widget.AnchorWidget.tsx`, `components/spatial/dream.shell.EnhancedSpatialShell.tsx` | — |
| `lib/panels/panelTypes.ts` | ts | 0 | 6 | `app/dreamdmbar/_components/DreamBarDataBridge.tsx`, `components/dream.OSShellActivator.tsx`, `components/panels/dream.panel.SettingsPanel.tsx` | — |
| `lib/runtime/dualRuntime.ts` | ts | 2 | 6 | `components/runtime/dream.DualRuntimeContainer.tsx`, `components/runtime/dream.RuntimeView.tsx`, `lib/dreamdm/DreamSystemContext.tsx` | `lib/identity/canonical-names.ts`, `lib/panels/panelTypes.ts` |
| `lib/runtime/useEnginBridge.ts` | ts | 1 | 6 | `engins/engin.BrandingEngin.tsx`, `engins/engin.CodeEngin.tsx`, `engins/engin.ContentEngin.tsx` | `lib/runtime/dualRuntimeBridge.ts` |
| `lib/agents/idari.ts` | ts | 1 | 5 | `app/api/ai/idari/route.ts`, `lib/admin/upgrade-readiness.ts`, `lib/agents/idariLoop.ts` | `types/ai.ts` |
| `lib/ai/rateLimit.ts` | ts | 1 | 5 | `app/api/ai/boogieman/child-safety/route.ts`, `app/api/ai/boogieman/route.ts`, `app/api/ai/eams/route.ts` | `lib/supabase/server.ts` |
| `lib/componentInventory.ts` | ts | 0 | 5 | `components/dream.ForgeDreamCanvas.tsx`, `components/forge/dream.EngineBuilderCanvas.tsx`, `lib/dreamenginOS/index.ts` | — |
| `lib/engin-runtime/EnginCapabilities.ts` | ts | 0 | 5 | `lib/engin-runtime/EnginRuleSetContract.ts`, `lib/engin-runtime/EnginRuntime.ts`, `lib/engin-runtime/index.ts` | — |
| `lib/forge/forgeMomentum.ts` | ts | 1 | 5 | `components/dreams/dreamsurface.dreamspace.tsx`, `components/forge/dream.widget.ForgeMomentumWidget.tsx`, `components/home/dream.FlagshipEnginesStrip.tsx` | `lib/forge/forgeRegistry.ts` |
| `lib/gameengin/cartridges/loaders.ts` | ts | 14 | 5 | `components/gameengin/dream.cartridge.CartridgeLauncher.tsx`, `engins/engin.GameEngin.tsx`, `lib/gameengin/cartridges/index.ts` | `lib/gameengin/cartridge.ts`, `lib/gameengin/cartridges/reactCartridge.ts`, `components/games/dream.BabylonSideScroller.tsx` |
| `lib/games/performance-baseline.ts` | ts | 0 | 5 | `components/games/dream.EchoArena.tsx`, `components/games/dream.NeonDrift.tsx`, `lib/games/catalog.ts` | — |
| `lib/gct/gct-engine.ts` | ts | 0 | 5 | `lib/gct/anomaly-detection.ts`, `lib/gct/audio-fingerprint.ts`, `lib/gct/image-search.ts` | — |
| `lib/music/starmakerDaw.ts` | ts | 0 | 5 | `components/daydream/starmaker/dream.panel.CompingPanel.tsx`, `components/daydream/starmaker/dream.panel.PianoRollPanel.tsx`, `components/daydream/starmaker/dream.panel.SessionViewPanel.tsx` | — |
| `lib/navigation/NavStateBuffer.ts` | ts | 0 | 5 | `components/dream.widget.AnchorWidget.tsx`, `components/spatial/dream.shell.EnhancedSpatialShell.tsx`, `lib/navigation/SpatialNavigationEngine.ts` | — |
| `lib/observability/correlator.ts` | ts | 1 | 5 | `app/api/admin/observability/route.ts`, `lib/agents/idariLoop.ts`, `lib/observability/index.ts` | `lib/observability/collector.ts` |
| `lib/observability/rootCauseAnalyzer.ts` | ts | 3 | 5 | `app/api/admin/observability/route.ts`, `lib/agents/idariLoop.ts`, `lib/observability/immediateAction.ts` | `lib/observability/correlator.ts`, `lib/observability/collector.ts`, `lib/agents/idari.ts` |
| `lib/runtime/coercionTable.ts` | ts | 0 | 5 | `components/universal-editor/dream.UniversalEditor.tsx`, `lib/runtime/dropTargetRegistry.ts`, `lib/runtime/useDragSurface.ts` | — |
| `lib/runtime/instanceManager.ts` | ts | 3 | 5 | `engins/autoopen/dream.AutoOpenGameEngin.tsx`, `engins/engin.GameEngin.tsx`, `lib/runtime/useEnginCoopSync.ts` | `lib/runtime/runtimeChannel.ts`, `types/module-manifest.ts`, `lib/supabase/client.ts` |
| `lib/supabase/safeGetUser.ts` | ts | 0 | 5 | `app/daydream/games/page.tsx`, `app/dreamdmbar/layout.tsx`, `app/dreamr/page.tsx` | — |
| `lib/ui/runtimeViewport.ts` | ts | 1 | 5 | `app/dreamdmbar/_components/HomeDreamRegion.tsx`, `components/dream.HomeFeed.tsx`, `components/runtime/dream.shell.RuntimeShell.tsx` | `lib/ui/responsive.ts` |
| `lib/vm/types.ts` | ts | 0 | 5 | `lib/vm/bufferManager.ts`, `lib/vm/index.ts`, `lib/vm/snapshot.ts` | — |
| `lib/webgpu/director.ts` | ts | 0 | 5 | `components/dreamengin/dream.scene.BabylonGameScene.tsx`, `lib/god-tier/godTierEngine.ts`, `lib/webgpu/adaptiveQuality.ts` | — |
| `lib/activity/aqs.ts` | ts | 2 | 4 | `app/api/ads/view/route.ts`, `components/activity/dream.ActivityProfile.tsx`, `lib/activity/visibility-score.ts` | `lib/supabase/client.ts`, `lib/activity/types.ts` |
| `lib/activity/scoring.ts` | ts | 1 | 4 | `app/api/activity/track/route.ts`, `components/activity/dream.ActivityPostForm.tsx`, `components/activity/dream.TierBadge.tsx` | `lib/activity/types.ts` |
| `lib/ai/groq.ts` | ts | 0 | 4 | `app/api/admin/ai-chat/route.ts`, `app/api/ai/idari/route.ts`, `lib/ai/triad.ts` | — |
| `lib/ai/tool-router.ts` | ts | 3 | 4 | `lib/ai/handlers/dreams.ts`, `lib/ai/handlers/index.ts`, `lib/ai/handlers/navigation.ts` | `types/ai-system.ts`, `engine/io.ts`, `lib/ai/audit.ts` |
| `lib/audioFingerprint.ts` | ts | 1 | 4 | `components/dream.AudioVisualizer3D.tsx`, `engins/engin.StarMakerEngin.tsx`, `lib/dreamenginOS/index.ts` | `lib/torridity.ts` |
| `lib/botDetection.ts` | ts | 1 | 4 | `app/dreamdmbar/_components/dreamr/dream.DreamRFeed.tsx`, `lib/bot-detection/index.ts`, `lib/dreamenginOS/index.ts` | `lib/slog.ts` |
| `lib/child-safety/imageClassifier.ts` | ts | 1 | 4 | `app/api/ai/boogieman/child-safety/route.ts`, `lib/child-safety/childSafetyDetector.ts`, `lib/child-safety/scanMediaUrls.ts` | `lib/ai/groq.ts` |
| `lib/child-safety/ncmecReporter.ts` | ts | 2 | 4 | `app/api/ai/boogieman/child-safety/route.ts`, `app/api/comments/route.ts`, `app/api/messages/route.ts` | `lib/supabase/server.ts`, `lib/child-safety/childSafetyDetector.ts` |
| `lib/collaboration/index.ts` | ts | 1 | 4 | `components/shared-dream/dream.SharedDreamProvider.tsx`, `hooks/useSharedDream.ts`, `lib/sharedDream.ts` | `engine/io.ts` |
| `lib/connectors/installFlow.ts` | ts | 1 | 4 | `app/connectors/dream.ConnectorsClient.tsx`, `components/connectors/dream.PlacementMode.tsx`, `hooks/useConnectorInstallFlow.ts` | `lib/widgets/widgetRegistry.ts` |
| `lib/connectors/providers/nostr.ts` | ts | 2 | 4 | `app/api/connectors/[provider]/connect/route.ts`, `app/api/connectors/[provider]/verify/route.ts`, `lib/connectors/syncDispatch.ts` | `lib/connectors/normalise.ts`, `types/connector.ts` |
| `lib/daydream/useDaydreamState.ts` | ts | 1 | 4 | `components/daydream/dream.shell.DaydreamShell.tsx`, `engins/engin.BrandingEngin.tsx`, `engins/engin.CodeEngin.tsx` | `lib/supabase/client.ts` |
| `lib/dreamenginOS/OSContext.tsx` | tsx | 3 | 4 | `app/dreamdmbar/_components/DreamSpaceRegion.tsx`, `app/layout.tsx`, `components/home/dream.bar.PersistentDreamBar.tsx` | `lib/ledger.ts`, `lib/eventBus.ts`, `lib/dreamenginOS/index.ts` |
| `lib/dreamr/closeFriendsVisibility.ts` | ts | 2 | 4 | `app/api/dreamr/feed/route.ts`, `app/api/dreamr/suggested/route.ts`, `app/dreamdmbar/_components/dreamr/api/route.ts` | `engine/io.ts`, `lib/supabase/server.ts` |
| `lib/dreamr/torridityLedger.ts` | ts | 1 | 4 | `app/dreamdmbar/_components/dreamr/algorithms/botDetector.ts`, `app/dreamdmbar/_components/dreamr/algorithms/dreamrAlgorithm.ts`, `lib/dreamr/dreamrfeed.tsx` | `lib/dreamr/swipeCalibration.ts` |
| `lib/engin-runtime/EnginIOAdapter.ts` | ts | 0 | 4 | `lib/engin-runtime/EnginRuntime.ts`, `lib/engin-runtime/index.ts`, `lib/engins/game/useGameEnginRuntime.ts` | — |
| `lib/engin-runtime/EnginRuleSetContract.ts` | ts | 2 | 4 | `lib/engin-runtime/EnginRuntime.ts`, `lib/engin-runtime/index.ts`, `lib/engins/game/gameEnginRuleSet.ts` | `lib/engin-runtime/EnginBaseState.ts`, `lib/engin-runtime/EnginCapabilities.ts` |
| `lib/forge/engineForge.ts` | ts | 2 | 4 | `components/dream.ForgeDreamCanvas.tsx`, `components/forge/dream.EngineBuilderCanvas.tsx`, `lib/dreamenginOS/index.ts` | `lib/eventBus.ts`, `lib/componentInventory.ts` |
| `lib/gameengin/ai-director.ts` | ts | 0 | 4 | `components/games/dream.NeonDrift.tsx`, `lib/gameengin/index.ts`, `lib/gameengin/platform.ts` | — |
| `lib/gameengin/core.ts` | ts | 2 | 4 | `lib/gameengin/index.ts`, `lib/gameengin/platform.ts`, `lib/gameengin/post-fx.ts` | `lib/gameengin/power-systems.ts`, `lib/babylon/createEngine.ts` |
| `lib/games/catalog.ts` | ts | 3 | 4 | `components/engines/games/panels/dream.panel.LibraryPanel.tsx`, `components/games/dream.GamesHub.tsx`, `tests/gameengin-cartridges.test.ts` | `lib/gameengin/cartridges/manifest.ts`, `lib/games/performance-baseline.ts`, `lib/games/mobileControls.ts` |
| `lib/games/quality-plan.ts` | ts | 0 | 4 | `app/daydream/games/page.tsx`, `daydreams/games/page.tsx`, `engins/engin.GameEngin.tsx` | — |
| `lib/navigation/manifold.ts` | ts | 0 | 4 | `lib/navigation/TransformSolver.ts`, `lib/navigation/anchorField.ts`, `lib/navigation/index.ts` | — |
| `lib/notifications/notificationHelpers.ts` | ts | 0 | 4 | `components/dream.NotificationCenter.tsx`, `lib/notifications/useNotifications.ts`, `tests/notifications.test.ts` | — |
| `lib/offline/offlineCache.ts` | ts | 0 | 4 | `components/dreamengin/dream.CanvasDropZone.tsx`, `lib/offline/useOfflineSync.ts`, `lib/scene/sceneState.ts` | — |
| `lib/optimizer/creative-optimizero.ts` | ts | 0 | 4 | `components/optimizer/dream.scene.BabylonOptimizeroScene.tsx`, `lib/optimizer/babylon-optimizero.ts`, `tests/babylon-optimizero.test.ts` | — |
| `lib/optimizer/types.ts` | ts | 0 | 4 | `lib/optimizer/constraint-solver.ts`, `lib/optimizer/creative-validator.ts`, `lib/optimizer/index.ts` | — |
| `lib/routing/surfaces.ts` | ts | 0 | 4 | `components/dream.OSShellActivator.tsx`, `components/home/dream.bar.GlobalDreamBar.tsx`, `components/home/dream.bar.PersistentDreamBar.tsx` | — |
| `lib/runtime/EnginDispatcher.ts` | ts | 1 | 4 | `app/dreamdmbar/_components/DreamBarDataBridge.tsx`, `components/dream.OSShellActivator.tsx`, `components/dreamengin/dream.DREAMenginOS.tsx` | `lib/runtime/memory.ts` |
| `lib/runtime/runtimeChannel.ts` | ts | 0 | 4 | `lib/gameengin/GameRuntime.tsx`, `lib/runtime/instanceManager.ts`, `lib/runtime/useSharedEnginChannel.ts` | — |
| `lib/ui/skin-engine.ts` | ts | 0 | 4 | `components/customize/panels/dream.panel.ColorPanel.tsx`, `components/customize/panels/dream.panel.FontPanel.tsx`, `components/customize/panels/dream.panel.LayoutPanel.tsx` | — |
| `lib/ui/theme-engine.ts` | ts | 0 | 4 | `app/settings/appearance/page.tsx`, `components/dreamengin/dream.widget.AppearanceWidget.tsx`, `components/panels/dream.panel.AppearancePanel.tsx` | — |
| `lib/vm/wasmGpuVM.ts` | ts | 3 | 4 | `lib/runtime/dualRuntimeBridge.ts`, `lib/vm/index.ts`, `lib/vm/snapshot.ts` | `lib/vm/bufferManager.ts`, `lib/vm/pipelineCache.ts`, `lib/vm/types.ts` |
| `lib/admin/lockout.ts` | ts | 1 | 3 | `app/api/admin/ai-chat/route.ts`, `app/api/admin/code-files/route.ts`, `tests/admin-lockout.test.ts` | `lib/supabase/server.ts` |
| `lib/agents/teachBus.ts` | ts | 0 | 3 | `components/dream.AIAssistant.tsx`, `components/dream.DrEamsModeToggle.tsx`, `components/dream.ThemeToggle.tsx` | — |
| `lib/artifactStore.ts` | ts | 1 | 3 | `app/dreamdmbar/_components/DreamSpaceRegion.tsx`, `components/home/dream.ActiveModuleSurface.tsx`, `tests/modular-os-stores.test.ts` | `types/dreamArtifact.ts` |
| `lib/child-safety/scanMediaUrls.ts` | ts | 2 | 3 | `app/api/messages/route.ts`, `app/api/posts/route.ts`, `tests/child-safety.test.ts` | `lib/child-safety/childSafetyDetector.ts`, `lib/child-safety/imageClassifier.ts` |
| `lib/code/drEamsCodeAssist.ts` | ts | 0 | 3 | `tests/code-dream-preview.test.ts`, `tests/dr-eams-code-assist.test.ts`, `tests/lab-dream-split.test.ts` | — |
| `lib/connectors/providers/bluesky.ts` | ts | 2 | 3 | `app/api/connectors/[provider]/connect/route.ts`, `app/api/connectors/[provider]/verify/route.ts`, `lib/connectors/syncDispatch.ts` | `lib/connectors/normalise.ts`, `types/connector.ts` |
| `lib/connectors/providers/github.ts` | ts | 2 | 3 | `app/api/connectors/[provider]/connect/route.ts`, `app/api/connectors/[provider]/verify/route.ts`, `lib/connectors/syncDispatch.ts` | `lib/connectors/normalise.ts`, `types/connector.ts` |
| `lib/connectors/providers/mastodon.ts` | ts | 2 | 3 | `app/api/connectors/[provider]/connect/route.ts`, `app/api/connectors/[provider]/verify/route.ts`, `lib/connectors/syncDispatch.ts` | `lib/connectors/normalise.ts`, `types/connector.ts` |
| `lib/connectors/providers/reddit.ts` | ts | 2 | 3 | `app/api/connectors/[provider]/connect/route.ts`, `app/api/connectors/[provider]/verify/route.ts`, `lib/connectors/syncDispatch.ts` | `lib/connectors/normalise.ts`, `types/connector.ts` |
| `lib/connectors/syncDispatch.ts` | ts | 8 | 3 | `app/api/connectors/[provider]/sync/route.ts`, `app/api/connectors/cron/route.ts`, `lib/connectors/reconcile.ts` | `lib/connectors/providers/mastodon.ts`, `lib/connectors/providers/bluesky.ts`, `lib/connectors/providers/github.ts` |
| `lib/connectors/webhookVerification.ts` | ts | 0 | 3 | `app/api/connectors/cron/route.ts`, `app/api/connectors/webhooks/[provider]/route.ts`, `tests/connector-delivery.test.ts` | — |
| `lib/content/transcriptEditor.ts` | ts | 0 | 3 | `app/api/content/transcribe/route.ts`, `engins/engin.ContentEngin.tsx`, `tests/contentengin-features.test.ts` | — |
| `lib/dream-window/enginConnectionNetwork.ts` | ts | 1 | 3 | `lib/dream-window/index.ts`, `lib/dreamengin/osSubsystemManifest.ts`, `tests/dream-window-system.test.ts` | `lib/identity/canonical-names.ts` |
| `lib/dream-window/useDreamWindowActions.ts` | ts | 2 | 3 | `components/dreams/dream.widget.SuperDreamWidget.tsx`, `components/home/dream.ActiveModuleSurface.tsx`, `tests/phase8b-dream-windows.test.ts` | `lib/dream-window/DreamWindowLifecycle.ts`, `types/dream-window.ts` |
| `lib/dreamdm/useDreamBarContext.ts` | ts | 1 | 3 | `dreamdmbar/dreamsurface.dreamdmbar.tsx`, `tests/dream-bar-context.test.ts`, `tests/dreamdm-bar-intent.test.ts` | `lib/dreamdm/DreamSystemContext.tsx` |
| `lib/dreamdm/useDreamDMMessages.ts` | ts | 2 | 3 | `components/dream.MessagesClient.tsx`, `dreamdmbar/dreamsurface.dreamdmbar.tsx`, `lib/dreamdm/useMessagingCore.ts` | `lib/supabase/client.ts`, `engine/io.ts` |
| `lib/dreamr/feedCursor.ts` | ts | 0 | 3 | `app/api/dreamr/feed/route.ts`, `app/dreamdmbar/_components/dreamr/api/route.ts`, `tests/dreamr-visibility-cursor.test.ts` | — |
| `lib/dreamr/swipeCalibration.ts` | ts | 0 | 3 | `components/dream.LandingHero.tsx`, `lib/dreamr/torridityLedger.ts`, `tests/swipe-calibration.test.ts` | — |
| `lib/dreams/drag.ts` | ts | 0 | 3 | `components/dreams/dream.DraggableDream.tsx`, `components/dreams/dream.GlobalDragLayer.tsx`, `components/home/dream.bar.PersistentDreamBar.tsx` | — |
| `lib/engin-runtime/EnginEventBus.ts` | ts | 1 | 3 | `lib/engin-runtime/EnginRuntime.ts`, `lib/engin-runtime/index.ts`, `tests/engin-runtime-core.test.ts` | `lib/eventBus.ts` |
| `lib/enginpipe/telemetry/events.ts` | ts | 0 | 3 | `lib/enginpipe/index.ts`, `lib/enginpipe/telemetry/client.ts`, `tests/enginpipe/telemetry.test.ts` | — |
| `lib/engins/game/gameEnginRuleSet.ts` | ts | 3 | 3 | `lib/engins/game/index.ts`, `lib/engins/game/useGameEnginRuntime.ts`, `tests/game-engin-ruleset.test.ts` | `lib/engin-runtime/EnginRuleSetContract.ts`, `lib/engin-runtime/EnginBaseState.ts`, `lib/engin-runtime/EnginCapabilities.ts` |
| `lib/feature-build/featureManifest.ts` | ts | 1 | 3 | `lib/feature-build/buildCycle.ts`, `lib/feature-build/index.ts`, `tests/feature-build.test.ts` | `lib/identity/canonical-names.ts` |
| `lib/forge-ngn/piece-registry.ts` | ts | 0 | 3 | `components/daydream/dream.NGNEngin.tsx`, `lib/forge-ngn/assembly.ts`, `lib/forge-ngn/index.ts` | — |
| `lib/forge/forgeBuild.ts` | ts | 0 | 3 | `components/forge/dream.panel.AIBuilderPanel.tsx`, `lib/forge/useForgeBuild.ts`, `tests/forge-build.test.ts` | — |
| `lib/gameengin/GameRuntime.tsx` | tsx | 5 | 3 | `components/gameengin/dream.cartridge.CartridgeLauncher.tsx`, `engins/engin.GameEngin.tsx`, `lib/gameengin/index.ts` | `lib/gameengin/cartridge.ts`, `lib/runtime/dreamOSBus.ts`, `lib/runtime/runtimeChannel.ts` |
| `lib/gameengin/post-fx.ts` | ts | 1 | 3 | `components/games/dream.NeonDrift.tsx`, `lib/gameengin/index.ts`, `lib/gameengin/platform.ts` | `lib/gameengin/core.ts` |
| `lib/games/library-state.ts` | ts | 0 | 3 | `components/games/dream.GamesHub.tsx`, `engins/engin.GameEngin.tsx`, `tests/game-navigation.test.ts` | — |
| `lib/games/useRemoteChannel.ts` | ts | 0 | 3 | `components/games/dream.remote.LegacyGameRemote.tsx`, `engins/engin.GameEngin.tsx`, `lib/games/mobileControls.ts` | — |
| `lib/gsap/gsap.ts` | ts | 0 | 3 | `lib/gsap/useGsapEntrance.ts`, `lib/gsap/useGsapFlip.ts`, `lib/gsap/useGsapScrollReveal.ts` | — |
| `lib/icons/sheet.ts` | ts | 0 | 3 | `components/ui/dream.PlatformBadge.tsx`, `components/ui/dream.SheetIcon.tsx`, `tests/icons.test.ts` | — |
| `lib/intelligence/continuityHelpers.ts` | ts | 1 | 3 | `components/dreams/dream.panel.RuntimeMemoryHUD.tsx`, `components/dreams/dreamsurface.dreamspace.tsx`, `tests/dream-continuity-spine.test.ts` | `lib/forge/forgeRegistry.ts` |
| `lib/journey/journeyDots.ts` | ts | 1 | 3 | `components/daydream/dream.shell.DaydreamShell.tsx`, `lib/engins/useEnginWorkflow.ts`, `lib/journey/withJourney.ts` | `types/journey.ts` |
| `lib/ledger.ts` | ts | 2 | 3 | `app/dreamdmbar/_components/DreamSpaceRegion.tsx`, `lib/dreamenginOS/OSContext.tsx`, `lib/dreamenginOS/index.ts` | `engine/io.ts`, `lib/audioFingerprint.ts` |
| `lib/navigation/AnchorWidgetStorage.ts` | ts | 0 | 3 | `components/dream.ShrunkMode.tsx`, `components/dream.widget.AnchorWidget.tsx`, `lib/navigation/index.ts` | — |
| `lib/navigation/dream-state.ts` | ts | 0 | 3 | `lib/navigation/StructureLedger.ts`, `tests/dream-state.test.ts`, `tests/structure-ledger.test.ts` | — |
| `lib/navigation/GestureFrameComputer.ts` | ts | 1 | 3 | `lib/navigation/GestureIntentResolver.ts`, `lib/navigation/SpatialNavigationEngine.ts`, `lib/navigation/index.ts` | `lib/navigation/PointerEventCapture.ts` |
| `lib/navigation/PointerEventCapture.ts` | ts | 0 | 3 | `lib/navigation/GestureFrameComputer.ts`, `lib/navigation/SpatialNavigationEngine.ts`, `lib/navigation/index.ts` | — |
| `lib/navigation/quaternion.ts` | ts | 1 | 3 | `lib/navigation/GestureIntentResolver.ts`, `lib/navigation/TransformSolver.ts`, `lib/navigation/index.ts` | `lib/navigation/manifold.ts` |
| `lib/navigation/ReturnStack.ts` | ts | 0 | 3 | `components/dream.widget.AnchorWidget.tsx`, `lib/navigation/SpatialNavigationEngine.ts`, `lib/navigation/index.ts` | — |
| `lib/navigation/SpatialNavigationEngine.ts` | ts | 7 | 3 | `components/spatial/dream.shell.EnhancedSpatialShell.tsx`, `lib/navigation/index.ts`, `lib/navigation/useNavigation.ts` | `lib/navigation/NavStateBuffer.ts`, `lib/navigation/ReturnStack.ts`, `lib/navigation/PointerEventCapture.ts` |
| `lib/observability/immediateAction.ts` | ts | 1 | 3 | `app/api/admin/observability/route.ts`, `lib/agents/idariLoop.ts`, `tests/idari-observability-loop.test.ts` | `lib/observability/rootCauseAnalyzer.ts` |
| `lib/policy/boogiePolicy.ts` | ts | 1 | 3 | `components/dream.BoogieWarningBanner.tsx`, `lib/activity/boogieActivityPolicy.ts`, `tests/boogie-policy-module.test.ts` | `lib/ai/boogie-policy.ts` |
| `lib/runtime/memory.ts` | ts | 0 | 3 | `lib/runtime/EnginDispatcher.ts`, `tests/conform-memory-map.test.ts`, `tests/engin-dispatcher.test.ts` | — |
| `lib/runtime/swapManager.ts` | ts | 0 | 3 | `components/daydream/dream.CodeDreamIDE.tsx`, `components/daydream/dream.LabDreamIDE.tsx`, `tests/swap-manager-extended.test.ts` | — |
| `lib/runtime/useSharedEnginChannel.ts` | ts | 3 | 3 | `engins/autoopen/dream.AutoOpenGameEngin.tsx`, `engins/engin.GameEngin.tsx`, `lib/runtime/useEnginCoopSync.ts` | `lib/runtime/runtimeChannel.ts`, `lib/runtime/instanceManager.ts`, `types/module-manifest.ts` |
| `lib/setup/checks.ts` | ts | 1 | 3 | `app/api/setup/check/route.ts`, `lib/admin/upgrade-readiness.ts`, `tests/admin-upgrade-readiness.test.ts` | `lib/supabase/config.ts` |
| `lib/slog.ts` | ts | 0 | 3 | `lib/botDetection.ts`, `lib/dreamenginOS/index.ts`, `lib/torridity.ts` | — |
| `lib/torridity.ts` | ts | 1 | 3 | `lib/audioFingerprint.ts`, `lib/dreamenginOS/index.ts`, `tests/spec37-torridity.test.ts` | `lib/slog.ts` |
| `lib/torridity/constants.ts` | ts | 0 | 3 | `components/landing/dream.scene.UniverseField.tsx`, `lib/torridity/index.ts`, `lib/torridity/physics.ts` | — |
| `lib/ui/responsive.ts` | ts | 0 | 3 | `lib/hooks/useResponsive.ts`, `lib/ui/runtimeViewport.ts`, `tests/responsive.test.ts` | — |
| `lib/universalEditor.ts` | ts | 1 | 3 | `components/dreams/dreamsurface.window.tsx`, `hooks/useTapHoldMove.ts`, `lib/dreamenginOS/index.ts` | `lib/eventBus.ts` |
| `lib/vm/bufferManager.ts` | ts | 1 | 3 | `lib/vm/index.ts`, `lib/vm/wasmGpuVM.ts`, `tests/wasm-gpu-vm.test.ts` | `lib/vm/types.ts` |
| `lib/vm/pipelineCache.ts` | ts | 0 | 3 | `lib/vm/index.ts`, `lib/vm/wasmGpuVM.ts`, `tests/wasm-gpu-vm.test.ts` | — |
| `lib/warp/warpEngine.ts` | ts | 0 | 3 | `components/warp/dream.WarpCanvas.tsx`, `lib/warp/useWarp.ts`, `tests/warp-engine.test.ts` | — |
| `lib/webgpu.ts` | ts | 0 | 3 | `app/dream-effects/page.tsx`, `components/webgpu/dream.WebGPUShowcase.tsx`, `lib/games/hooks.ts` | — |
| `lib/activeModulesStore.ts` | ts | 1 | 2 | `components/home/dream.ActiveModuleSurface.tsx`, `tests/modular-os-stores.test.ts` | `types/dreamArtifact.ts` |
| `lib/activity/revenueSplit.ts` | ts | 0 | 2 | `app/api/ads/view/route.ts`, `tests/activity-revenue-split.test.ts` | — |
| `lib/activity/skipCredits.ts` | ts | 1 | 2 | `app/api/ads/view/route.ts`, `tests/skip-credits.test.ts` | `lib/activity/types.ts` |
| `lib/activity/visibility-score.ts` | ts | 3 | 2 | `app/api/feed/route.ts`, `tests/activity-first-protocol.test.ts` | `lib/supabase/client.ts`, `lib/activity/aqs.ts`, `lib/activity/types.ts` |
| `lib/admin/upgrade-readiness.ts` | ts | 3 | 2 | `app/(internal)/idari-console/page.tsx`, `tests/admin-upgrade-readiness.test.ts` | `lib/feature-build/index.ts`, `lib/agents/idari.ts`, `lib/setup/checks.ts` |
| `lib/agentOS/hostTools.ts` | ts | 0 | 2 | `app/api/agent/session/route.ts`, `lib/agentOS.ts` | — |
| `lib/agents/drEamsMode.ts` | ts | 0 | 2 | `components/dream.AIAssistant.tsx`, `components/dream.DrEamsModeToggle.tsx` | — |
| `lib/agents/idariLoop.ts` | ts | 5 | 2 | `lib/observability/healthTrend.ts`, `tests/idari-observability-loop.test.ts` | `lib/observability/collector.ts`, `lib/observability/correlator.ts`, `lib/observability/rootCauseAnalyzer.ts` |
| `lib/ai/confirm.ts` | ts | 0 | 2 | `app/api/ai/eams/route.ts`, `app/api/ai/execute/route.ts` | — |
| `lib/assets/indexedDBStore.ts` | ts | 0 | 2 | `lib/assets/assetOptimizer.ts`, `tests/asset-optimizer.test.ts` | — |
| `lib/audio-fingerprint/fingerprint.ts` | ts | 1 | 2 | `lib/audio-fingerprint/index.ts`, `lib/audio-fingerprint/stem-extractor.ts` | `lib/audio-fingerprint/peak-map.ts` |
| `lib/audio-fingerprint/peak-map.ts` | ts | 0 | 2 | `lib/audio-fingerprint/fingerprint.ts`, `lib/audio-fingerprint/index.ts` | — |
| `lib/branding/logos.ts` | ts | 0 | 2 | `components/dream.BrandLogo.tsx`, `tests/branding-logos.test.ts` | — |
| `lib/composite/compositor.ts` | ts | 0 | 2 | `engins/engin.ContentEngin.tsx`, `tests/compositeengin-features.test.ts` | — |
| `lib/composite/fxSimulation.ts` | ts | 0 | 2 | `engins/engin.ContentEngin.tsx`, `tests/compositeengin-features.test.ts` | — |
| `lib/composite/matchmover.ts` | ts | 0 | 2 | `engins/engin.ContentEngin.tsx`, `tests/compositeengin-features.test.ts` | — |
| `lib/composite/motionCapture.ts` | ts | 0 | 2 | `engins/engin.ContentEngin.tsx`, `tests/compositeengin-features.test.ts` | — |
| `lib/composite/rotoscope.ts` | ts | 0 | 2 | `engins/engin.ContentEngin.tsx`, `tests/compositeengin-features.test.ts` | — |
| `lib/connectors/deliveryStrategy.ts` | ts | 0 | 2 | `app/api/connectors/webhooks/[provider]/route.ts`, `tests/connector-delivery.test.ts` | — |
| `lib/connectors/reconcile.ts` | ts | 4 | 2 | `app/api/connectors/[provider]/sync/route.ts`, `app/api/connectors/cron/route.ts` | `engine/io.ts`, `types/supabase.ts`, `lib/connectors/syncDispatch.ts` |
| `lib/content/publishIntent.ts` | ts | 0 | 2 | `engins/engin.ContentEngin.tsx`, `tests/content-publish-intent.test.ts` | — |
| `lib/content/seoScorer.ts` | ts | 0 | 2 | `engins/engin.ContentEngin.tsx`, `tests/contentengin-features.test.ts` | — |
| `lib/content/voiceClone.ts` | ts | 0 | 2 | `app/api/content/voice-clone/route.ts`, `tests/contentengin-features.test.ts` | — |
| `lib/data-transform.ts` | ts | 0 | 2 | `tests/data-transform-extended.test.ts`, `tests/data-transform.test.ts` | — |
| `lib/diff/aiEditEngine.ts` | ts | 0 | 2 | `engins/engin.CodeEngin.tsx`, `tests/ai-edit-engine.test.ts` | — |
| `lib/diff/diffUtils.ts` | ts | 0 | 2 | `components/daydream/dream.DiffViewer.tsx`, `tests/diff-viewer.test.ts` | — |
| `lib/dream-docs/embed.ts` | ts | 1 | 2 | `app/actions/dream-docs.ts`, `lib/dream-docs/index.ts` | `lib/supabase/server.ts` |
| `lib/dream-window/connectionVerbs.ts` | ts | 1 | 2 | `lib/dream-window/index.ts`, `tests/dream-window-system.test.ts` | `lib/identity/canonical-names.ts` |
| `lib/dream-window/runtimeRegion.ts` | ts | 1 | 2 | `lib/dream-window/index.ts`, `tests/dream-window-system.test.ts` | `lib/identity/canonical-names.ts` |
| `lib/dreamdm/bridgeSeamFlow.ts` | ts | 0 | 2 | `components/home/dream.NeuralSeamCanvas.tsx`, `tests/neural-seam-flow.test.ts` | — |
| `lib/dreamdm/useDreamDMDraft.ts` | ts | 0 | 2 | `components/dream.MessagesClient.tsx`, `dreamdmbar/dreamsurface.dreamdmbar.tsx` | — |
| `lib/dreamdm/useDreamSearch.ts` | ts | 1 | 2 | `components/dream.MessagesClient.tsx`, `dreamdmbar/dreamsurface.dreamdmbar.tsx` | `lib/supabase/client.ts` |
| `lib/dreamengin/drEamsSearch.ts` | ts | 0 | 2 | `components/dreamengin/dream.bar.DrEamsSearchBar.tsx`, `tests/dr-eams-search-bar.test.ts` | — |
| `lib/dreamengin/osSubsystemManifest.ts` | ts | 5 | 2 | `components/dreamengin/dream.DREAMenginOS.tsx`, `tests/os-subsystem-manifest.test.ts` | `lib/dream-window/enginConnectionNetwork.ts`, `lib/forge/forgeRegistry.ts`, `lib/identity/canonical-names.ts` |
| `lib/dreamnav/path.ts` | ts | 1 | 2 | `components/dreamengin/dream.menu.OutdreamMenu.tsx`, `components/dreamengin/dream.overlay.ViewAllDreamsOverlay.tsx` | `lib/dreamnav/delta.ts` |
| `lib/dreamnav/tau.ts` | ts | 1 | 2 | `lib/dreamnav/gctAssist.ts`, `tests/dreamnav.tau.test.ts` | `lib/dreamnav/delta.ts` |
| `lib/dreamr/dreamrfeed.tsx` | tsx | 7 | 2 | `app/dreamdmbar/_components/dreamr/dream.DreamRFeed.tsx`, `app/dreamdmbar/_components/dreamr/dreamsurface.dreamr.tsx` | `lib/feed/useLiveFeed.ts`, `types/connector.ts`, `lib/dreamr/torridityLedger.ts` |
| `lib/dreamr/swipePersonalization.ts` | ts | 0 | 2 | `lib/dreamr/dreamrfeed.tsx`, `tests/dreamr-swipe-personalization.test.ts` | — |
| `lib/engin-runtime/EnginRuntime.ts` | ts | 5 | 2 | `lib/engin-runtime/index.ts`, `lib/engins/game/useGameEnginRuntime.ts` | `lib/engin-runtime/EnginBaseState.ts`, `lib/engin-runtime/EnginEventBus.ts`, `lib/engin-runtime/EnginIOAdapter.ts` |
| `lib/enginpipe/artifact/manifest.ts` | ts | 0 | 2 | `lib/enginpipe/index.ts`, `tests/enginpipe/manifest.test.ts` | — |
| `lib/enginpipe/index.ts` | ts | 5 | 2 | `engins/CodeEngin/orchestrator/dream.index.tsx`, `engins/engin.GameEngin.tsx` | `lib/enginpipe/artifact/manifest.ts`, `lib/enginpipe/telemetry/events.ts`, `lib/enginpipe/telemetry/client.ts` |
| `lib/enginpipe/quality/tiers.ts` | ts | 0 | 2 | `lib/enginpipe/index.ts`, `tests/enginpipe/tiers.test.ts` | — |
| `lib/enginpipe/telemetry/client.ts` | ts | 1 | 2 | `lib/enginpipe/index.ts`, `tests/enginpipe/telemetry.test.ts` | `lib/enginpipe/telemetry/events.ts` |
| `lib/engins/workflowEngine.ts` | ts | 0 | 2 | `lib/engins/useEnginWorkflow.ts`, `tests/engin-workflow.test.ts` | — |
| `lib/feature-build/buildCycle.ts` | ts | 1 | 2 | `lib/feature-build/index.ts`, `tests/feature-build.test.ts` | `lib/feature-build/featureManifest.ts` |
| `lib/feature-build/index.ts` | ts | 3 | 2 | `lib/admin/upgrade-readiness.ts`, `tests/admin-upgrade-readiness.test.ts` | `lib/feature-build/featureManifest.ts`, `lib/feature-build/buildCycle.ts`, `lib/feature-build/uiQualityCriteria.ts` |
| `lib/feature-build/uiQualityCriteria.ts` | ts | 0 | 2 | `lib/feature-build/index.ts`, `tests/feature-build.test.ts` | — |
| `lib/feed/feedTopics.ts` | ts | 0 | 2 | `components/panels/dream.panel.FeedSettingsPanel.tsx`, `lib/feed/useYouTubeLiveFeed.ts` | — |
| `lib/feeds/embedFeedLoader.ts` | ts | 0 | 2 | `app/api/embed-feed/route.ts`, `components/feeds/dream.widget.EmbedFeedWidget.tsx` | — |
| `lib/forge-ngn/assembly.ts` | ts | 1 | 2 | `components/daydream/dream.NGNEngin.tsx`, `lib/forge-ngn/index.ts` | `lib/forge-ngn/piece-registry.ts` |
| `lib/forge/forgeNexus.ts` | ts | 1 | 2 | `engins/dream.ForgeEngin.tsx`, `tests/forge-nexus.test.ts` | `lib/forge/forgeRegistry.ts` |
| `lib/forge/forgeRituals.ts` | ts | 1 | 2 | `engins/dream.ForgeEngin.tsx`, `tests/forge-rituals.test.ts` | `lib/forge/forgeRegistry.ts` |
| `lib/gameengin/cartridge-manifest.ts` | ts | 0 | 2 | `lib/gameengin/dreamr-loader.ts`, `tests/gameengin-spec.test.ts` | — |
| `lib/gameengin/cartridges/reactCartridge.ts` | ts | 1 | 2 | `lib/gameengin/cartridges/loaders.ts`, `lib/gameengin/index.ts` | `lib/gameengin/cartridge.ts` |
| `lib/gameengin/dreamr-loader.ts` | ts | 1 | 2 | `lib/gameengin/cartridgeLoader.ts`, `lib/gameengin/webgpu-runtime-shell.ts` | `lib/gameengin/cartridge-manifest.ts` |
| `lib/gameengin/gameEnginRuntime.ts` | ts | 1 | 2 | `lib/dreamenginOS/index.ts`, `src/core/GameEnginCore.ts` | `lib/eventBus.ts` |
| `lib/gameengin/registerCartridges.ts` | ts | 3 | 2 | `components/gameengin/dream.CartridgeRegistryBootstrap.tsx`, `tests/shell-cartridge-wiring.test.ts` | `lib/gameengin/cartridges/manifest.ts`, `lib/runtime/moduleRegistry.ts`, `types/module-manifest.ts` |
| `lib/gameengin/remote/moves.ts` | ts | 0 | 2 | `lib/gameengin/remote/comboMachine.ts`, `lib/gameengin/remote/index.ts` | — |
| `lib/gameengin/unifiedLoop.ts` | ts | 0 | 2 | `lib/gameengin/index.ts`, `lib/gameengin/useUnifiedLoop.ts` | — |
| `lib/games/avatar.ts` | ts | 0 | 2 | `components/games/dream.GamesHub.tsx`, `engins/engin.GameEngin.tsx` | — |
| `lib/games/gameControllerButtons.ts` | ts | 0 | 2 | `components/games/dream.GameController.tsx`, `tests/game-controller.test.ts` | — |
| `lib/games/gameControllerLeft.ts` | ts | 0 | 2 | `components/games/dream.GameController.tsx`, `tests/game-controller.test.ts` | — |
| `lib/games/gameControllerRight.ts` | ts | 0 | 2 | `components/games/dream.GameController.tsx`, `tests/game-controller.test.ts` | — |
| `lib/games/useGameInputKeyboardBridge.ts` | ts | 1 | 2 | `engins/engin.GameEngin.tsx`, `tests/game-navigation.test.ts` | `components/games/dream.remote.GameRemote.tsx` |
| `lib/games/useGamepad.ts` | ts | 0 | 2 | `components/games/dream.remote.LegacyGameRemote.tsx`, `engins/engin.GameEngin.tsx` | — |
| `lib/games/useImmersiveGameLayout.ts` | ts | 0 | 2 | `components/games/madmaxi/dream.MadmaxiGame.tsx`, `dreamdmbar/dreamsurface.dreamdmbar.tsx` | — |
| `lib/gestures/touchGestures.ts` | ts | 0 | 2 | `lib/gestures/useTouchGestures.ts`, `tests/phase9-touch-gestures.test.ts` | — |
| `lib/gsap/useGsapEntrance.ts` | ts | 1 | 2 | `app/dream-effects/page.tsx`, `components/games/dream.GamesHub.tsx` | `lib/gsap/gsap.ts` |
| `lib/home-buttons/contextual-home.ts` | ts | 0 | 2 | `components/home/dream.bar.GlobalDreamBar.tsx`, `tests/contextual-home.test.ts` | — |
| `lib/intelligence/sessionContinuity.ts` | ts | 0 | 2 | `lib/intelligence/useSessionIntelligence.ts`, `tests/session-continuity.test.ts` | — |
| `lib/intelligence/sessionPatternEngine.ts` | ts | 0 | 2 | `lib/intelligence/useSessionIntelligence.ts`, `tests/session-pattern-engine.test.ts` | — |
| `lib/intelligence/useSessionIntelligence.ts` | ts | 3 | 2 | `components/dreamengin/dream.DREAMenginOS.tsx`, `components/dreams/dreamsurface.dreamspace.tsx` | `lib/intelligence/sessionPatternEngine.ts`, `lib/intelligence/sessionContinuity.ts`, `lib/runtime/dreamOSBus.ts` |
| `lib/journey/journeyInsights.ts` | ts | 1 | 2 | `components/daydream/dream.JourneyTrail.tsx`, `tests/journey-insights.test.ts` | `types/journey.ts` |
| `lib/marketplace/listings.ts` | ts | 0 | 2 | `lib/marketplace/request.ts`, `tests/phase8e-shop-marketplace.test.ts` | — |
| `lib/marketplace/request.ts` | ts | 1 | 2 | `app/api/marketplace/request/route.ts`, `tests/phase8e-shop-marketplace.test.ts` | `lib/marketplace/listings.ts` |
| `lib/music/starmaker.ts` | ts | 0 | 2 | `engins/engin.StarMakerEngin.tsx`, `tests/starmaker-music.test.ts` | — |
| `lib/music/starmakerArrangement.ts` | ts | 0 | 2 | `components/daydream/starmaker/dream.panel.MultitrackArrangementPanel.tsx`, `engins/engin.StarMakerEngin.tsx` | — |
| `lib/navigation/AnchorStateBuffer.ts` | ts | 0 | 2 | `components/dream.widget.AnchorWidget.tsx`, `lib/navigation/index.ts` | — |
| `lib/navigation/GestureIntentResolver.ts` | ts | 2 | 2 | `lib/navigation/SpatialNavigationEngine.ts`, `lib/navigation/index.ts` | `lib/navigation/GestureFrameComputer.ts`, `lib/navigation/quaternion.ts` |
| `lib/navigation/StructureLedger.ts` | ts | 1 | 2 | `lib/navigation/index.ts`, `tests/structure-ledger.test.ts` | `lib/navigation/dream-state.ts` |
| `lib/navigation/TransformSolver.ts` | ts | 3 | 2 | `lib/navigation/SpatialNavigationEngine.ts`, `lib/navigation/index.ts` | `lib/navigation/NavStateBuffer.ts`, `lib/navigation/quaternion.ts`, `lib/navigation/manifold.ts` |
| `lib/notifications/useNotifications.ts` | ts | 1 | 2 | `app/dreamdmbar/_components/HomeDreamRegion.tsx`, `components/dream.NotificationCenter.tsx` | `lib/notifications/notificationHelpers.ts` |
| `lib/observability/otel.ts` | ts | 0 | 2 | `app/api/metrics/route.ts`, `lib/observability/otelBridge.ts` | — |
| `lib/observability/otelBridge.ts` | ts | 1 | 2 | `app/api/metrics/route.ts`, `lib/observability/collector.ts` | `lib/observability/otel.ts` |
| `lib/optimizer/babylon-optimizero.ts` | ts | 1 | 2 | `components/optimizer/dream.scene.BabylonOptimizeroScene.tsx`, `tests/babylon-optimizero.test.ts` | `lib/optimizer/creative-optimizero.ts` |
| `lib/optimizer/constraint-solver.ts` | ts | 1 | 2 | `lib/optimizer/index.ts`, `tests/optimizer.test.ts` | `lib/optimizer/types.ts` |
| `lib/optimizer/creative-validator.ts` | ts | 1 | 2 | `lib/optimizer/index.ts`, `tests/optimizer.test.ts` | `lib/optimizer/types.ts` |
| `lib/platform/lab.ts` | ts | 1 | 2 | `lib/platform/index.ts`, `tests/platform-utils.test.ts` | `lib/supabase/client.ts` |
| `lib/renderer/FrustumCuller.ts` | ts | 0 | 2 | `lib/renderer/Canvas2DRenderer.ts`, `lib/renderer/index.ts` | — |
| `lib/runtime/dropTargetRegistry.ts` | ts | 2 | 2 | `lib/runtime/useDragSurface.ts`, `tests/drop-target-registry.test.ts` | `lib/runtime/coercionTable.ts`, `types/module-manifest.ts` |
| `lib/runtime/enginWorkflowRegistry.ts` | ts | 1 | 2 | `lib/runtime/seamClipboard.ts`, `tests/seam-clipboard.test.ts` | `lib/runtime/dualRuntimeBridge.ts` |
| `lib/runtime/isAuthRelatedError.ts` | ts | 0 | 2 | `app/error.tsx`, `tests/is-auth-related-error.test.ts` | — |
| `lib/runtime/moduleRegistry.ts` | ts | 3 | 2 | `lib/gameengin/registerCartridges.ts`, `tests/shell-cartridge-wiring.test.ts` | `lib/runtime/dualRuntimeBridge.ts`, `types/module-manifest.ts`, `types/widgets.ts` |
| `lib/runtime/runtimeContainer.ts` | ts | 0 | 2 | `lib/runtime/dreamOSBus.ts`, `tests/runtime-container.test.ts` | — |
| `lib/sharedDream.ts` | ts | 2 | 2 | `components/dreams/dream.shell.SharedDreamShell.tsx`, `hooks/useSharedDream.ts` | `engine/io.ts`, `lib/collaboration/index.ts` |
| `lib/shop/listings.ts` | ts | 0 | 2 | `app/api/shop/route.ts`, `tests/phase8e-shop-marketplace.test.ts` | — |
| `lib/ui/theme.ts` | ts | 0 | 2 | `components/dream.ThemeToggle.tsx`, `lib/agents/uiActions.ts` | — |
| `lib/universal-editor/module-manifest.ts` | ts | 0 | 2 | `components/universal-editor/dream.UniversalEditorWrapper.tsx`, `components/universal-editor/useTapHoldMove.ts` | — |
| `lib/vm/dualVMCoordinator.ts` | ts | 1 | 2 | `lib/vm/index.ts`, `tests/wasm-gpu-vm.test.ts` | `lib/runtime/dualRuntimeBridge.ts` |
| `lib/vm/inter-vm-messaging.ts` | ts | 0 | 2 | `lib/vm/dual-runtime.ts`, `lib/vm/index.ts` | — |
| `lib/vm/snapshot.ts` | ts | 2 | 2 | `lib/vm/index.ts`, `tests/wasm-gpu-vm.test.ts` | `lib/vm/types.ts`, `lib/vm/wasmGpuVM.ts` |
| `lib/adari.ts` | ts | 0 | 1 | `scripts/postbuild.ts` | — |
| `lib/agentOS.ts` | ts | 1 | 1 | `app/api/agent/session/route.ts` | `lib/agentOS/hostTools.ts` |
| `lib/agents/uiActions.ts` | ts | 1 | 1 | `components/dream.AIAssistant.tsx` | `lib/ui/theme.ts` |
| `lib/ai/handlers/dreams.ts` | ts | 2 | 1 | `lib/ai/handlers/index.ts` | `lib/ai/tool-router.ts`, `types/ai-system.ts` |
| `lib/ai/handlers/navigation.ts` | ts | 2 | 1 | `lib/ai/handlers/index.ts` | `lib/ai/tool-router.ts`, `types/ai-system.ts` |
| `lib/ai/handlers/social.ts` | ts | 2 | 1 | `lib/ai/handlers/index.ts` | `lib/ai/tool-router.ts`, `types/ai-system.ts` |
| `lib/assets/assetOptimizer.ts` | ts | 1 | 1 | `tests/asset-optimizer.test.ts` | `lib/assets/indexedDBStore.ts` |
| `lib/audio-fingerprint/stem-extractor.ts` | ts | 1 | 1 | `lib/audio-fingerprint/index.ts` | `lib/audio-fingerprint/fingerprint.ts` |
| `lib/bot-detection/index.ts` | ts | 1 | 1 | `tests/spec36-bot-detection.test.ts` | `lib/botDetection.ts` |
| `lib/bot-detection/swipe-physics.ts` | ts | 0 | 1 | `lib/bot-detection/detector.ts` | — |
| `lib/child-safety/messageContextChecker.ts` | ts | 0 | 1 | `tests/child-safety.test.ts` | — |
| `lib/connectors/providers/instagram.ts` | ts | 1 | 1 | `lib/connectors/syncDispatch.ts` | `types/connector.ts` |
| `lib/connectors/providers/shellhub.ts` | ts | 0 | 1 | `app/api/shellhub/devices/route.ts` | — |
| `lib/dream-docs/search.ts` | ts | 1 | 1 | `lib/dream-docs/index.ts` | `lib/supabase/server.ts` |
| `lib/dreamdm/useDreamDMConversations.ts` | ts | 2 | 1 | `dreamdmbar/dreamsurface.dreamdmbar.tsx` | `lib/supabase/client.ts`, `engine/io.ts` |
| `lib/dreamdm/useMessagingCore.ts` | ts | 3 | 1 | `dreamdmbar/dreamsurface.dreamdmbar.tsx` | `lib/supabase/client.ts`, `lib/media/ledger.ts`, `lib/dreamdm/useDreamDMMessages.ts` |
| `lib/dreamdm/useNotifications.ts` | ts | 0 | 1 | `dreamdmbar/dreamsurface.dreamdmbar.tsx` | — |
| `lib/dreamengin/DrEamsAnimator.ts` | ts | 0 | 1 | `components/dreamengin/dream.DrEamsCanvas.tsx` | — |
| `lib/dreams/DreamRegistry.tsx` | tsx | 0 | 1 | `components/runtime/dream.RuntimeView.tsx` | — |
| `lib/dreams/profileProjection.ts` | ts | 1 | 1 | `components/dreams/dream.outputlayer.tsx` | `lib/dreams/types.ts` |
| `lib/dreams/types.ts` | ts | 0 | 1 | `lib/dreams/profileProjection.ts` | — |
| `lib/dreams/useDreamsRuntime.ts` | ts | 0 | 1 | `components/dreams/dreamsurface.dreamspace.tsx` | — |
| `lib/engin-runtime/index.ts` | ts | 6 | 1 | `tests/engin-runtime-core.test.ts` | `lib/engin-runtime/EnginRuntime.ts`, `lib/engin-runtime/EnginRuleSetContract.ts`, `lib/engin-runtime/EnginBaseState.ts` |
| `lib/enginpipe/shell/ArtifactSlot.tsx` | tsx | 1 | 1 | `lib/enginpipe/index.ts` | `lib/eventBus.ts` |
| `lib/engins/game/useGameEnginRuntime.ts` | ts | 3 | 1 | `engins/engin.GameEngin.tsx` | `lib/engin-runtime/EnginRuntime.ts`, `lib/engin-runtime/EnginIOAdapter.ts`, `lib/engins/game/gameEnginRuleSet.ts` |
| `lib/event-bus/index.ts` | ts | 0 | 1 | `components/daydream/dream.NGNEngin.tsx` | — |
| `lib/feed/hashtags.ts` | ts | 0 | 1 | `tests/phase9-hashtags.test.ts` | — |
| `lib/feed/useYouTubeLiveFeed.ts` | ts | 3 | 1 | `components/dream.HomeFeed.tsx` | `lib/feed/useLiveFeed.ts`, `types/connector.ts`, `lib/feed/feedTopics.ts` |
| `lib/forge/useForgeBuild.ts` | ts | 1 | 1 | `components/forge/dream.panel.AIBuilderPanel.tsx` | `lib/forge/forgeBuild.ts` |
| `lib/gameengin/cartridgeLoader.ts` | ts | 1 | 1 | `tests/gameengin-spec.test.ts` | `lib/gameengin/dreamr-loader.ts` |
| `lib/gameengin/control-mappings.ts` | ts | 1 | 1 | `lib/gameengin/index.ts` | `lib/supabase/client.ts` |
| `lib/gameengin/dream-engine.ts` | ts | 2 | 1 | `lib/gameengin/index.ts` | `lib/supabase/client.ts`, `lib/media/ledger.ts` |
| `lib/gameengin/index.ts` | ts | 13 | 1 | `components/games/dream.NeonDrift.tsx` | `lib/gameengin/core.ts`, `lib/gameengin/control-mappings.ts`, `lib/gameengin/dream-engine.ts` |
| `lib/gameengin/platform.ts` | ts | 4 | 1 | `lib/gameengin/index.ts` | `lib/gameengin/core.ts`, `lib/gameengin/ai-director.ts`, `lib/gameengin/post-fx.ts` |
| `lib/gameengin/remote/comboMachine.ts` | ts | 1 | 1 | `lib/gameengin/remote/index.ts` | `lib/gameengin/remote/moves.ts` |
| `lib/gameengin/remote/index.ts` | ts | 4 | 1 | `tests/gameengin-remote.test.ts` | `lib/gameengin/remote/layout.ts`, `lib/gameengin/remote/moves.ts`, `lib/gameengin/remote/sprintDetector.ts` |
| `lib/gameengin/remote/layout.ts` | ts | 0 | 1 | `lib/gameengin/remote/index.ts` | — |
| `lib/gameengin/remote/sprintDetector.ts` | ts | 0 | 1 | `lib/gameengin/remote/index.ts` | — |
| `lib/gameengin/systems/ai.ts` | ts | 1 | 1 | `lib/gameengin/systems/index.ts` | `lib/gameengin/power-systems.ts` |
| `lib/gameengin/systems/animation.ts` | ts | 1 | 1 | `lib/gameengin/systems/index.ts` | `lib/gameengin/power-systems.ts` |
| `lib/gameengin/systems/assets.ts` | ts | 1 | 1 | `lib/gameengin/systems/index.ts` | `lib/gameengin/power-systems.ts` |
| `lib/gameengin/systems/lod.ts` | ts | 1 | 1 | `lib/gameengin/systems/index.ts` | `lib/gameengin/power-systems.ts` |
| `lib/gameengin/systems/network.ts` | ts | 1 | 1 | `lib/gameengin/systems/index.ts` | `lib/gameengin/power-systems.ts` |
| `lib/gameengin/systems/physics.ts` | ts | 1 | 1 | `lib/gameengin/systems/index.ts` | `lib/gameengin/power-systems.ts` |
| `lib/gameengin/systems/pooling.ts` | ts | 1 | 1 | `lib/gameengin/systems/index.ts` | `lib/gameengin/power-systems.ts` |
| `lib/gameengin/systems/rendering.ts` | ts | 1 | 1 | `lib/gameengin/systems/index.ts` | `lib/gameengin/power-systems.ts` |
| `lib/gameengin/systems/spatial.ts` | ts | 1 | 1 | `lib/gameengin/systems/index.ts` | `lib/gameengin/power-systems.ts` |
| `lib/gameengin/systems/world.ts` | ts | 1 | 1 | `lib/gameengin/systems/index.ts` | `lib/gameengin/power-systems.ts` |
| `lib/gameengin/useUnifiedLoop.ts` | ts | 1 | 1 | `lib/gameengin/index.ts` | `lib/gameengin/unifiedLoop.ts` |
| `lib/gct/anomaly-detection.ts` | ts | 1 | 1 | `lib/gct/index.ts` | `lib/gct/gct-engine.ts` |
| `lib/gct/audio-fingerprint.ts` | ts | 1 | 1 | `lib/gct/index.ts` | `lib/gct/gct-engine.ts` |
| `lib/gct/image-search.ts` | ts | 1 | 1 | `lib/gct/index.ts` | `lib/gct/gct-engine.ts` |
| `lib/gct/index.ts` | ts | 5 | 1 | `lib/dreamnav/gctAssist.ts` | `lib/gct/gct-engine.ts`, `lib/gct/image-search.ts`, `lib/gct/anomaly-detection.ts` |
| `lib/gct/recommendations.ts` | ts | 1 | 1 | `lib/gct/index.ts` | `lib/gct/gct-engine.ts` |
| `lib/generationLaw.ts` | ts | 0 | 1 | `lib/dreamenginOS/index.ts` | — |
| `lib/god-tier/useGodTier.ts` | ts | 1 | 1 | `components/providers/dream.GodTierProvider.tsx` | `lib/god-tier/godTierEngine.ts` |
| `lib/gsap/useGsapFlip.ts` | ts | 1 | 1 | `components/daydream/dream.shell.DaydreamShell.tsx` | `lib/gsap/gsap.ts` |
| `lib/gsap/useGsapScrollReveal.ts` | ts | 1 | 1 | `components/games/dream.GamesHub.tsx` | `lib/gsap/gsap.ts` |
| `lib/h265-encoder.ts` | ts | 0 | 1 | `components/games/dream.RecordingControls.tsx` | — |
| `lib/hooks/useMotionTilt.ts` | ts | 0 | 1 | `components/games/dream.GamesHub.tsx` | — |
| `lib/ledger-data.ts` | ts | 0 | 1 | `components/dream.LedgerChart.tsx` | — |
| `lib/music/presets.ts` | ts | 0 | 1 | `engins/engin.StarMakerEngin.tsx` | — |
| `lib/navigation/anchorField.ts` | ts | 1 | 1 | `lib/navigation/index.ts` | `lib/navigation/manifold.ts` |
| `lib/navigation/physics.ts` | ts | 0 | 1 | `lib/navigation/index.ts` | — |
| `lib/navigation/useNavigation.ts` | ts | 2 | 1 | `lib/navigation/index.ts` | `lib/navigation/SpatialNavigationEngine.ts`, `lib/navigation/WidgetInstanceMemory.ts` |
| `lib/optimizer/index.ts` | ts | 3 | 1 | `tests/optimizer.test.ts` | `lib/optimizer/constraint-solver.ts`, `lib/optimizer/creative-validator.ts`, `lib/optimizer/types.ts` |
| `lib/platform/index.ts` | ts | 1 | 1 | `tests/platform-utils.test.ts` | `lib/platform/lab.ts` |
| `lib/renderer/Canvas2DRenderer.ts` | ts | 2 | 1 | `lib/renderer/index.ts` | `lib/renderer/IRenderer.ts`, `lib/renderer/FrustumCuller.ts` |
| `lib/renderer/IRenderer.ts` | ts | 0 | 1 | `lib/renderer/Canvas2DRenderer.ts` | — |
| `lib/runtime/channelMetrics.ts` | ts | 0 | 1 | `lib/gameengin/GameRuntime.tsx` | — |
| `lib/runtime/madMaxiSnapshotBridge.ts` | ts | 0 | 1 | `lib/runtime/dualRuntimeBridge.ts` | — |
| `lib/runtime/offlineQueue.ts` | ts | 0 | 1 | `tests/offline-queue.test.ts` | — |
| `lib/runtime/seamClipboard.ts` | ts | 4 | 1 | `tests/seam-clipboard.test.ts` | `lib/runtime/dualRuntimeBridge.ts`, `lib/runtime/dreamOSBus.ts`, `lib/identity/canonical-names.ts` |
| `lib/runtime/sharedResourcePool.ts` | ts | 0 | 1 | `lib/gameengin/GameRuntime.tsx` | — |
| `lib/scene/sceneState.ts` | ts | 1 | 1 | `tests/phase9-scene-state.test.ts` | `lib/offline/offlineCache.ts` |
| `lib/social-feed.ts` | ts | 0 | 1 | `tests/social-feed.test.ts` | — |
| `lib/social/crossPost.ts` | ts | 1 | 1 | `tests/phase9-cross-post.test.ts` | `lib/social/platforms.ts` |
| `lib/supabase/vector.ts` | ts | 0 | 1 | `tests/tech-foundation.test.ts` | — |
| `lib/torridity/physics.ts` | ts | 1 | 1 | `lib/torridity/index.ts` | `lib/torridity/constants.ts` |
| `lib/user-sim/userSimAgent.ts` | ts | 1 | 1 | `tests/user-sim.test.ts` | `types/user-sim.ts` |
| `lib/vm/bus-events.ts` | ts | 0 | 1 | `lib/vm/dual-runtime.ts` | — |
| `lib/vm/dual-runtime.ts` | ts | 2 | 1 | `lib/vm/index.ts` | `lib/vm/inter-vm-messaging.ts`, `lib/vm/bus-events.ts` |
| `lib/vm/resource-quota.ts` | ts | 0 | 1 | `lib/vm/index.ts` | — |
| `lib/vm/security.ts` | ts | 0 | 1 | `lib/vm/index.ts` | — |
| `lib/vm/wasm-features.ts` | ts | 0 | 1 | `lib/vm/index.ts` | — |
| `lib/warp/useWarp.ts` | ts | 1 | 1 | `components/warp/dream.WarpCanvas.tsx` | `lib/warp/warpEngine.ts` |
| `lib/webgpu/adaptiveQuality.ts` | ts | 1 | 1 | `tests/phase9-adaptive-quality.test.ts` | `lib/webgpu/director.ts` |
| `lib/widgets/feed-resolver.ts` | ts | 2 | 1 | `app/api/dreams/feed/route.ts` | `lib/supabase/server.ts`, `types/widget-system-v2.ts` |
| `lib/widgets/parseConfig.ts` | ts | 1 | 1 | `components/dream.FeedCard.tsx` | `types/widgetConfigs.ts` |
| `lib/widgets/WidgetBus.ts` | ts | 0 | 1 | `lib/widgets/useWidget.ts` | — |
| `lib/widgets/WidgetEventBus.ts` | ts | 0 | 1 | `lib/widgets/CrossWidgetPosting.ts` | — |
| `lib/widgets/WidgetLinkGraph.ts` | ts | 0 | 1 | `lib/widgets/CrossWidgetPosting.ts` | — |
| `lib/activity/boogieActivityPolicy.ts` | ts | 1 | 0 | — | `lib/policy/boogiePolicy.ts` |
| `lib/agents/boogieManAI.ts` | ts | 1 | 0 | — | `types/ai.ts` |
| `lib/agents/dreamengin.ts` | ts | 0 | 0 | — | — |
| `lib/ai/boogie-verifier.ts` | ts | 2 | 0 | — | `types/ai-system.ts`, `lib/supabase/server.ts` |
| `lib/ai/capability-gate.ts` | ts | 3 | 0 | — | `types/ai-system.ts`, `lib/supabase/server.ts`, `lib/ai/triad.ts` |
| `lib/ai/CIC.ts` | ts | 0 | 0 | — | — |
| `lib/ai/confirm-token.ts` | ts | 2 | 0 | — | `lib/supabase/server.ts`, `types/ai-system.ts` |
| `lib/ai/handlers/index.ts` | ts | 4 | 0 | — | `lib/ai/tool-router.ts`, `lib/ai/handlers/navigation.ts`, `lib/ai/handlers/dreams.ts` |
| `lib/ai/idempotency.ts` | ts | 1 | 0 | — | `lib/supabase/server.ts` |
| `lib/ai/rate-limiter.ts` | ts | 1 | 0 | — | `lib/supabase/server.ts` |
| `lib/ai/tfBackend.ts` | ts | 0 | 0 | — | — |
| `lib/audio-fingerprint/index.ts` | ts | 3 | 0 | — | `lib/audio-fingerprint/peak-map.ts`, `lib/audio-fingerprint/fingerprint.ts`, `lib/audio-fingerprint/stem-extractor.ts` |
| `lib/babylon/dreamengine-hybrid.ts` | ts | 0 | 0 | — | — |
| `lib/bot-detection/detector.ts` | ts | 1 | 0 | — | `lib/bot-detection/swipe-physics.ts` |
| `lib/bot-detection/view-tally.ts` | ts | 0 | 0 | — | — |
| `lib/bus.wasm` | file | 0 | 0 | — | — |
| `lib/connectors/providers/devto.ts` | ts | 3 | 0 | — | `lib/connectors/normalise.ts`, `lib/social/rss-feed.ts`, `types/connector.ts` |
| `lib/connectors/providers/facebook.ts` | ts | 3 | 0 | — | `lib/connectors/normalise.ts`, `lib/social/rss-feed.ts`, `types/connector.ts` |
| `lib/connectors/providers/hackernews.ts` | ts | 3 | 0 | — | `lib/connectors/normalise.ts`, `lib/social/rss-feed.ts`, `types/connector.ts` |
| `lib/connectors/providers/medium.ts` | ts | 3 | 0 | — | `lib/connectors/normalise.ts`, `lib/social/rss-feed.ts`, `types/connector.ts` |
| `lib/connectors/providers/pinterest.ts` | ts | 3 | 0 | — | `lib/connectors/normalise.ts`, `lib/social/rss-feed.ts`, `types/connector.ts` |
| `lib/connectors/providers/podcast.ts` | ts | 3 | 0 | — | `lib/connectors/normalise.ts`, `lib/social/rss-feed.ts`, `types/connector.ts` |
| `lib/connectors/providers/substack.ts` | ts | 3 | 0 | — | `lib/connectors/normalise.ts`, `lib/social/rss-feed.ts`, `types/connector.ts` |
| `lib/connectors/providers/tiktok.ts` | ts | 3 | 0 | — | `lib/connectors/normalise.ts`, `lib/social/rss-feed.ts`, `types/connector.ts` |
| `lib/connectors/providers/tumblr.ts` | ts | 3 | 0 | — | `lib/connectors/normalise.ts`, `lib/social/rss-feed.ts`, `types/connector.ts` |
| `lib/connectors/providers/twitter.ts` | ts | 3 | 0 | — | `lib/connectors/normalise.ts`, `lib/social/rss-feed.ts`, `types/connector.ts` |
| `lib/connectors/youtube.ts` | ts | 1 | 0 | — | `lib/supabase/server.ts` |
| `lib/consent/consentManager.ts` | ts | 1 | 0 | — | `lib/supabase/client.ts` |
| `lib/content/generativeFill.ts` | ts | 0 | 0 | — | — |
| `lib/dream-docs/index.ts` | ts | 2 | 0 | — | `lib/dream-docs/search.ts`, `lib/dream-docs/embed.ts` |
| `lib/dream-window/index.ts` | ts | 4 | 0 | — | `lib/dream-window/DreamWindowLifecycle.ts`, `lib/dream-window/connectionVerbs.ts`, `lib/dream-window/runtimeRegion.ts` |
| `lib/dreamdm/useModuleBarIntent.ts` | ts | 1 | 0 | — | `lib/dreamdm/DreamSystemContext.tsx` |
| `lib/dreamengin/engineAssets.ts` | ts | 2 | 0 | — | `lib/supabase/client.ts`, `lib/media/ledger.ts` |
| `lib/dreamnav/gctAssist.ts` | ts | 2 | 0 | — | `lib/gct/index.ts`, `lib/dreamnav/tau.ts` |
| `lib/dreamnav/gestures6.ts` | ts | 1 | 0 | — | `lib/dreamnav/delta.ts` |
| `lib/dreamr/socialHumanityScore.ts` | ts | 1 | 0 | — | `lib/supabase/client.ts` |
| `lib/engins/game/index.ts` | ts | 1 | 0 | — | `lib/engins/game/gameEnginRuleSet.ts` |
| `lib/engins/useEnginWorkflow.ts` | ts | 3 | 0 | — | `lib/runtime/dualRuntimeBridge.ts`, `lib/journey/journeyDots.ts`, `lib/engins/workflowEngine.ts` |
| `lib/forge-ngn/index.ts` | ts | 2 | 0 | — | `lib/forge-ngn/piece-registry.ts`, `lib/forge-ngn/assembly.ts` |
| `lib/gameengin/accessibility-ai.ts` | ts | 0 | 0 | — | — |
| `lib/gameengin/ai-npcs.ts` | ts | 0 | 0 | — | — |
| `lib/gameengin/brain/active-projects.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/asset-registry/README.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/build-history/README.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/character-voices/mad-maxi.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/composition-principles/leading-lines-landmark.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/composition-principles/parallax-layers.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/concept-library/neon-courier.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/concept-library/README.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/concept-patterns/protagonists/reluctant-courier.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/concept-patterns/README.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/concept-patterns/scope-formulas/one-day-runner.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/concept-patterns/settings/neon-rain-megacity.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/crash-reports/README.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/dialogue-patterns/callback-anchor.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/dialogue-patterns/implied-subject.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/dialogue-patterns/sentence-fragment-rhythm.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/emotional-tones/determined.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/emotional-tones/fierce.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/emotional-tones/hopeful.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/emotional-tones/reflective.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/emotional-tones/weary.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/fun-heuristics/meta-progression.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/fun-heuristics/moment-to-moment.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/fun-heuristics/session-loop.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/genre-dna/action-rpg.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/genre-dna/episodic.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/genre-dna/live-service.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/genre-dna/metroidvania.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/genre-dna/open-world.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/genre-dna/platformer.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/genre-dna/puzzle.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/genre-dna/racing.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/genre-dna/roguelike.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/genre-dna/sandbox.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/genre-dna/template.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/inspiration-corpus/celeste.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/inspiration-corpus/dead-cells.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/inspiration-corpus/hades.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/inspiration-corpus/hollow-knight.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/inspiration-corpus/outer-wilds.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/material-recipes/neon-glass-tube.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/material-recipes/rusted-iron.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/material-recipes/sun-bleached-sandstone.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/camera/look-ahead.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/camera/screen-shake.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/camera/smooth-follow.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/combat/combo.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/combat/hit-stop.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/combat/parry.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/combat/ranged.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/movement/coyote-time.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/movement/dash.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/movement/double-jump.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/movement/grapple.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/movement/wall-slide.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/progression/metroidvania-gating.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/progression/roguelike-perks.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/progression/skill-tree.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/structural/ability-gating.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/structural/meta-progression.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/structural/procedural-generation.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/structural/run-persistence.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/structural/season-pass.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/mechanic-library/structural/world-streaming.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/narrative-pacing/default.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/originality-registry/by-cartridge/mad-maxi.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/originality-registry/signatures.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/principles/emotional-core.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/principles/feedback.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/principles/mastery.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/principles/progression.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/principles/responsiveness.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/principles/risk-reward.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/progression-state/README.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/rd-sessions/README.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/README.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/technique-library/lighting/three-point-mood.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/technique-library/modeling/edge-flow.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/technique-library/modeling/silhouette-first.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/technique-library/optimization/texture-atlasing.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/upgrade-history/prioritization-rules.json` | config | 0 | 0 | — | — |
| `lib/gameengin/brain/upgrade-history/README.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/visual-bible/characters/mad-maxi.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/visual-bible/environments/neon-wasteland.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/brain/work-queue/README.md` | doc | 0 | 0 | — | — |
| `lib/gameengin/cartridges/index.ts` | ts | 2 | 0 | — | `lib/gameengin/cartridges/manifest.ts`, `lib/gameengin/cartridges/loaders.ts` |
| `lib/gameengin/cloud-compute.ts` | ts | 0 | 0 | — | — |
| `lib/gameengin/generative-audio.ts` | ts | 0 | 0 | — | — |
| `lib/gameengin/neural-render.ts` | ts | 0 | 0 | — | — |
| `lib/gameengin/path-tracing.ts` | ts | 0 | 0 | — | — |
| `lib/gameengin/predictive-stream.ts` | ts | 0 | 0 | — | — |
| `lib/gameengin/procgen.ts` | ts | 0 | 0 | — | — |
| `lib/gameengin/systems/index.ts` | ts | 10 | 0 | — | `lib/gameengin/systems/physics.ts`, `lib/gameengin/systems/spatial.ts`, `lib/gameengin/systems/pooling.ts` |
| `lib/gameengin/webgpu-runtime-shell.ts` | ts | 1 | 0 | — | `lib/gameengin/dreamr-loader.ts` |
| `lib/gameengin/world-crdt.ts` | ts | 0 | 0 | — | — |
| `lib/gameengin/xr.ts` | ts | 0 | 0 | — | — |
| `lib/games/DualSenseManager.ts` | ts | 0 | 0 | — | — |
| `lib/games/lucid-avenue-world.ts` | ts | 0 | 0 | — | — |
| `lib/games/useAIDirector.ts` | ts | 1 | 0 | — | `lib/gameengin/ai-director.ts` |
| `lib/gestures/useTouchGestures.ts` | ts | 1 | 0 | — | `lib/gestures/touchGestures.ts` |
| `lib/home-buttons/button-groups.ts` | ts | 0 | 0 | — | — |
| `lib/hooks/useResponsive.ts` | ts | 1 | 0 | — | `lib/ui/responsive.ts` |
| `lib/hooks/useTap.ts` | ts | 0 | 0 | — | — |
| `lib/journey/withJourney.ts` | ts | 2 | 0 | — | `lib/journey/journeyDots.ts`, `types/journey.ts` |
| `lib/music/wasmAudioBridge.ts` | ts | 0 | 0 | — | — |
| `lib/navigation/index.ts` | ts | 16 | 0 | — | `lib/navigation/NavStateBuffer.ts`, `lib/navigation/ReturnStack.ts`, `lib/navigation/PointerEventCapture.ts` |
| `lib/navigation/README.md` | doc | 0 | 0 | — | — |
| `lib/observability/healthTrend.ts` | ts | 1 | 0 | — | `lib/agents/idariLoop.ts` |
| `lib/observability/index.ts` | ts | 3 | 0 | — | `lib/observability/collector.ts`, `lib/observability/correlator.ts`, `lib/observability/rootCauseAnalyzer.ts` |
| `lib/offline/useOfflineSync.ts` | ts | 1 | 0 | — | `lib/offline/offlineCache.ts` |
| `lib/optimizer/README.md` | doc | 0 | 0 | — | — |
| `lib/renderer/index.ts` | ts | 2 | 0 | — | `lib/renderer/Canvas2DRenderer.ts`, `lib/renderer/FrustumCuller.ts` |
| `lib/runtime/quantumCircuit.ts` | ts | 1 | 0 | — | `lib/runtime/dualRuntimeBridge.ts` |
| `lib/runtime/snapshotFingerprint.ts` | ts | 1 | 0 | — | `lib/observability/collector.ts` |
| `lib/runtime/useDragSurface.ts` | ts | 3 | 0 | — | `lib/runtime/coercionTable.ts`, `lib/runtime/dropTargetRegistry.ts`, `types/module-manifest.ts` |
| `lib/runtime/useDualRuntime.ts` | ts | 1 | 0 | — | `lib/runtime/dualRuntimeBridge.ts` |
| `lib/runtime/useDualRuntimePersistence.ts` | ts | 1 | 0 | — | `lib/runtime/dualRuntime.ts` |
| `lib/supabase/realtime.ts` | ts | 0 | 0 | — | — |
| `lib/torridity/index.ts` | ts | 2 | 0 | — | `lib/torridity/constants.ts`, `lib/torridity/physics.ts` |
| `lib/vm/index.ts` | ts | 11 | 0 | — | `lib/vm/wasm-features.ts`, `lib/vm/resource-quota.ts`, `lib/vm/inter-vm-messaging.ts` |
| `lib/vm/README.md` | doc | 0 | 0 | — | — |
| `lib/webgpu/useWebGPUDirector.ts` | ts | 1 | 0 | — | `lib/webgpu/director.ts` |
| `lib/widgets/CrossWidgetPosting.ts` | ts | 2 | 0 | — | `lib/widgets/WidgetLinkGraph.ts`, `lib/widgets/WidgetEventBus.ts` |
| `lib/widgets/parse.ts` | ts | 1 | 0 | — | `types/widgetConfigs.ts` |
| `lib/widgets/useWidget.ts` | ts | 1 | 0 | — | `lib/widgets/WidgetBus.ts` |
| `lib/widgets/WidgetEngine.tsx` | tsx | 0 | 0 | — | — |

</details>

<details><summary>components/ (297 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `components/engines/shared/index.ts` | ts | 4 | 28 | `app/engines/brand/campaigns/page.tsx`, `app/engines/brand/identity/page.tsx`, `app/engines/code/ai/page.tsx` | `components/engines/shared/dream.shell.EnginAppShell.tsx`, `components/engines/shared/dream.bar.EnginNavBar.tsx`, `components/engines/shared/dream.EnginProvider.tsx` |
| `components/ui/dream.AuthenticatedPageHeader.tsx` | tsx | 1 | 23 | `app/daydream/analytics/page.tsx`, `app/daydream/brand/page.tsx`, `app/daydream/code/page.tsx` | `components/dream.BrandLogo.tsx` |
| `components/daydream/dream.shell.DaydreamShell.tsx` | tsx | 7 | 15 | `app/daydream/analytics/page.tsx`, `app/daydream/brand/page.tsx`, `app/daydream/code/page.tsx` | `components/games/dream.remote.GameRemote.tsx`, `components/dream.BrandLogo.tsx`, `lib/journey/journeyDots.ts` |
| `components/ui/dream.DreamWord.tsx` | tsx | 0 | 14 | `app/ads/page.tsx`, `app/edit-profiledream/page.tsx`, `app/marketplace/[id]/page.tsx` | — |
| `components/daydream/dream.JourneyTrail.tsx` | tsx | 2 | 11 | `app/dreamdmbar/_components/dreamr/dreamsurface.dreamr.tsx`, `components/dreams/dream.window.JourneyDreamWindow.tsx`, `engins/dream.ForgeEngin.tsx` | `types/journey.ts`, `lib/journey/journeyInsights.ts` |
| `components/daydream/dream.OpenDaydreamSideBButton.tsx` | tsx | 0 | 9 | `app/daydream/code/page.tsx`, `app/daydream/create/page.tsx`, `app/daydream/games/page.tsx` | — |
| `components/dreamengin/dream.panel.CrossEnginStatusPanel.tsx` | tsx | 1 | 7 | `engins/dream.panel.AnalyticsEngin.tsx`, `engins/engin.BrandingEngin.tsx`, `engins/engin.CodeEngin.tsx` | `lib/runtime/dualRuntimeBridge.ts` |
| `components/profile/dream.widget.ProfileWidgetGrid.tsx` | tsx | 2 | 7 | `app/edit-profiledream/page.tsx`, `app/profile/[handle]/page.tsx`, `app/view-profile/page.tsx` | `components/connectors/dream.widget.ConnectorWidgetPicker.tsx`, `components/profile/dream.EditableAvatar.tsx` |
| `components/runtime/dream.DualRuntimeContainer.tsx` | tsx | 1 | 7 | `app/dreamdmbar/_components/DreamBarDataBridge.tsx`, `app/dreamdmbar/dreamspace/page.tsx`, `app/dreamdmbar/homedream/page.tsx` | `lib/runtime/dualRuntime.ts` |
| `components/activity/dream.ActivityProfile.tsx` | tsx | 3 | 5 | `app/edit-profiledream/page.tsx`, `app/profile/[handle]/page.tsx`, `app/view-profile/page.tsx` | `lib/activity/aqs.ts`, `lib/activity/types.ts`, `components/activity/dream.TierBadge.tsx` |
| `components/dream.ThemeApplicator.tsx` | tsx | 0 | 5 | `app/layout.tsx`, `app/settings/appearance/page.tsx`, `components/dream.VoidThemeToggle.tsx` | — |
| `components/games/dream.BabylonSideScroller.tsx` | tsx | 1 | 5 | `app/daydream/game/dream.GamePageClient.tsx`, `components/games/dream.GamesHub.tsx`, `lib/gameengin/cartridges/loaders.ts` | `components/games/madmaxi/index.ts` |
| `components/games/dream.GamesHub.tsx` | tsx | 19 | 5 | `app/daydream/game/dream.shell.ImmersiveGameShell.tsx`, `app/daydream/games/page.tsx`, `daydreams/games/page.tsx` | `lib/games/library-state.ts`, `lib/games/catalog.ts`, `lib/games/navigation.ts` |
| `components/providers/dream.ThemeProvider.tsx` | tsx | 1 | 5 | `app/layout.tsx`, `app/settings/appearance/page.tsx`, `components/dreamengin/dream.widget.AppearanceWidget.tsx` | `lib/ui/theme-engine.ts` |
| `components/customize/panels/dream.panel.ColorPanel.tsx` | tsx | 2 | 4 | `components/customize/dream.GlobalCustomizeUI.tsx`, `components/customize/panels/dream.panel.EffectsPanel.tsx`, `components/customize/panels/dream.panel.FontPanel.tsx` | `lib/ui/CustomizeModeContext.tsx`, `lib/ui/skin-engine.ts` |
| `components/dream.BrandLogo.tsx` | tsx | 1 | 4 | `app/dreamdmbar/_components/HomeDreamRegion.tsx`, `components/daydream/dream.shell.DaydreamShell.tsx`, `components/ui/dream.AuthenticatedPageHeader.tsx` | `lib/branding/logos.ts` |
| `components/dreams/dreamsurface.shell.tsx` | tsx | 0 | 4 | `components/dreams/dream.shell.DreamShell.tsx`, `components/widgets/dream.widget.WidgetCard.tsx`, `components/widgets/dream.widget.WidgetShell.tsx` | — |
| `components/games/_fx/canvasFx.ts` | ts | 0 | 4 | `components/games/dream.Glassfall.tsx`, `components/games/dream.NullCathedral.tsx`, `components/games/dream.SerpentSiege.tsx` | — |
| `components/games/madmaxi/config.ts` | ts | 1 | 4 | `components/games/madmaxi/authoredZonePacks.ts`, `components/games/madmaxi/dream.MadmaxiGame.tsx`, `components/games/madmaxi/index.ts` | `components/games/madmaxi/types.ts` |
| `components/games/madmaxi/types.ts` | ts | 0 | 4 | `components/games/madmaxi/authoredZonePacks.ts`, `components/games/madmaxi/config.ts`, `components/games/madmaxi/dream.MadmaxiGame.tsx` | — |
| `components/auth/dream.PasswordField.tsx` | tsx | 0 | 3 | `app/auth/update-password/page.tsx`, `app/join/page.tsx`, `app/login/page.tsx` | — |
| `components/dream.ProfileShareButton.tsx` | tsx | 1 | 3 | `app/profile/[handle]/page.tsx`, `app/view-profile/page.tsx`, `coresurfaces/dreamsurface.ViewProfile.tsx` | `components/ui/dream.SocialShareSheet.tsx` |
| `components/dreamengin/dream.CanvasDropZone.tsx` | tsx | 1 | 3 | `components/dreamengin/dream.DREAMenginOS.tsx`, `components/dreamengin/dreamsurface.dreamengin.tsx`, `tests/phase9-drag-drop.test.ts` | `lib/offline/offlineCache.ts` |
| `components/dreamnav/dreamsurface.dreamnav.tsx` | tsx | 1 | 3 | `components/dreamengin/dream.menu.OutdreamMenu.tsx`, `components/dreamengin/dream.overlay.ViewAllDreamsOverlay.tsx`, `components/dreamengin/dreamsurface.dreamengin.tsx` | `lib/dreamnav/delta.ts` |
| `components/dreams/dream.DraggableDream.tsx` | tsx | 1 | 3 | `app/dreamdmbar/_components/DreamSpaceRegion.tsx`, `app/dreamdmbar/_components/HomeDreamRegion.tsx`, `app/settings/dreams/dreams-layout-editor.tsx` | `lib/dreams/drag.ts` |
| `components/dreams/dream.widget.SuperDreamWidget.tsx` | tsx | 3 | 3 | `components/widgets/dream.widget.WidgetLibrary.tsx`, `components/widgets/dream.widget.WidgetSurface.tsx`, `tests/phase8b-dream-windows.test.ts` | `lib/dream-window/useDreamWindowActions.ts`, `types/dream-window.ts`, `lib/dream-window/DreamWindowLifecycle.ts` |
| `components/dreams/dreamsurface.dreamspace.tsx` | tsx | 10 | 3 | `app/dreamspace/page.tsx`, `components/runtime/dream.RuntimeView.tsx`, `tests/dreamspace-panel.test.ts` | `components/widgets/dream.widget.UniversalWidget.tsx`, `app/dreamdmbar/_components/DreamSpaceRegion.tsx`, `components/spatial/dream.ProfileSpace.tsx` |
| `components/engines/shared/dream.bar.EnginNavBar.tsx` | tsx | 0 | 3 | `components/engines/shared/dream.EnginRuleSet.ts`, `components/engines/shared/dream.makeEnginApp.tsx`, `components/engines/shared/index.ts` | — |
| `components/games/dream.remote.GameRemote.tsx` | tsx | 1 | 3 | `components/daydream/dream.shell.DaydreamShell.tsx`, `components/games/dream.hud.LegacyGameHUD.tsx`, `lib/games/useGameInputKeyboardBridge.ts` | `components/games/dream.remote.LegacyGameRemote.tsx` |
| `components/games/madmaxi/index.ts` | ts | 3 | 3 | `components/games/dream.BabylonSideScroller.tsx`, `tests/madmaxi-authored-levels.test.ts`, `tests/madmaxi-mechanics.test.ts` | `components/games/madmaxi/dream.MadmaxiGame.tsx`, `components/games/madmaxi/config.ts`, `components/games/madmaxi/levels.ts` |
| `components/overlays/dream.RootStatusScreen.tsx` | tsx | 0 | 3 | `app/error.tsx`, `app/loading.tsx`, `app/not-found.tsx` | — |
| `components/shared-dream/dream.SharedDreamProvider.tsx` | tsx | 2 | 3 | `components/shared-dream/dream.InviteFlow.tsx`, `components/shared-dream/dream.SharedDreamCanvas.tsx`, `components/shared-dream/index.ts` | `lib/collaboration/index.ts`, `lib/supabase/client.ts` |
| `components/widgets/dream.widget.WidgetCard.tsx` | tsx | 1 | 3 | `components/widgets/dream.widget.PlayMediaWidget.tsx`, `components/widgets/dream.widget.UniversalWidget.tsx`, `tests/phase8b-dream-windows.test.ts` | `components/dreams/dreamsurface.shell.tsx` |
| `components/activity/dream.TierBadge.tsx` | tsx | 2 | 2 | `components/activity/dream.ActivityPostForm.tsx`, `components/activity/dream.ActivityProfile.tsx` | `lib/activity/types.ts`, `lib/activity/scoring.ts` |
| `components/connectors/dream.widget.ConnectWidgetPrompt.tsx` | tsx | 1 | 2 | `app/connectors/dream.ConnectorsClient.tsx`, `components/connectors/dream.ConnectDreamPrompt.tsx` | `lib/widgets/widgetRegistry.ts` |
| `components/daydream/dreamsurface.daydream.BrandDaydream.tsx` | tsx | 4 | 2 | `app/daydream/brand/page.tsx`, `daydreams/brand/page.tsx` | `lib/supabase/client.ts`, `lib/runtime/dualRuntimeBridge.ts`, `lib/forge/useForgeActivity.ts` |
| `components/dream.CommandPalette.tsx` | tsx | 0 | 2 | `app/layout.tsx`, `components/providers/dream.AppSurfaceShell.tsx` | — |
| `components/dream.GlobalOverlays.tsx` | tsx | 4 | 2 | `app/layout.tsx`, `components/providers/dream.AppSurfaceShell.tsx` | `components/customize/dream.GlobalCustomizeUI.tsx`, `components/dreams/dream.GlobalDragLayer.tsx`, `components/dreams/dream.PlatformErrorReporter.tsx` |
| `components/dreamengin/dream.DREAMenginOS.tsx` | tsx | 9 | 2 | `components/dreamengin/dreamsurface.dreamengin.tsx`, `tests/dreamengin-os.test.ts` | `lib/babylon/createEngine.ts`, `components/dreamengin/dream.CanvasDropZone.tsx`, `lib/dreamengin/osSubsystemManifest.ts` |
| `components/dreamengin/dream.panel.DrEamsPanel.tsx` | tsx | 0 | 2 | `components/dreamengin/dreamsurface.dreamengin.tsx`, `components/home/dream.bar.GlobalDreamBar.tsx` | — |
| `components/engines/brand/dream.BrandEnginApp.tsx` | tsx | 2 | 2 | `app/engines/brand/page.tsx`, `components/engines/brand/index.ts` | `components/engines/shared/index.ts`, `engins/engin.BrandingEngin.tsx` |
| `components/engines/brand/panels/dream.panel.CampaignsPanel.tsx` | tsx | 0 | 2 | `app/engines/brand/campaigns/page.tsx`, `components/engines/brand/index.ts` | — |
| `components/engines/brand/panels/dream.panel.IdentityPanel.tsx` | tsx | 1 | 2 | `app/engines/brand/identity/page.tsx`, `components/engines/brand/index.ts` | `lib/runtime/dualRuntimeBridge.ts` |
| `components/engines/code/dream.CodeEnginApp.tsx` | tsx | 2 | 2 | `app/engines/code/page.tsx`, `components/engines/code/index.ts` | `components/engines/shared/index.ts`, `engins/engin.CodeEngin.tsx` |
| `components/engines/code/panels/dream.panel.AIPanel.tsx` | tsx | 0 | 2 | `app/engines/code/ai/page.tsx`, `components/engines/code/index.ts` | — |
| `components/engines/code/panels/dream.panel.NotebookPanel.tsx` | tsx | 0 | 2 | `app/engines/code/notebook/page.tsx`, `components/engines/code/index.ts` | — |
| `components/engines/code/panels/dream.panel.ProjectsPanel.tsx` | tsx | 1 | 2 | `app/engines/code/projects/page.tsx`, `components/engines/code/index.ts` | `lib/supabase/client.ts` |
| `components/engines/create/dream.CreateEnginApp.tsx` | tsx | 2 | 2 | `app/engines/create/page.tsx`, `components/engines/create/index.ts` | `components/engines/shared/index.ts`, `engins/engin.ContentEngin.tsx` |
| `components/engines/create/panels/dream.panel.CalendarPanel.tsx` | tsx | 0 | 2 | `app/engines/create/calendar/page.tsx`, `components/engines/create/index.ts` | — |
| `components/engines/create/panels/dream.panel.EditorPanel.tsx` | tsx | 0 | 2 | `app/engines/create/editor/page.tsx`, `components/engines/create/index.ts` | — |
| `components/engines/create/panels/dream.panel.QueuePanel.tsx` | tsx | 0 | 2 | `app/engines/create/queue/page.tsx`, `components/engines/create/index.ts` | — |
| `components/engines/games/dream.GameEnginApp.tsx` | tsx | 2 | 2 | `app/engines/games/page.tsx`, `components/engines/games/index.ts` | `components/engines/shared/index.ts`, `engins/engin.GameEngin.tsx` |
| `components/engines/games/panels/dream.panel.BuilderPanel.tsx` | tsx | 1 | 2 | `app/engines/games/builder/page.tsx`, `components/engines/games/index.ts` | `lib/runtime/dualRuntimeBridge.ts` |
| `components/engines/games/panels/dream.panel.LibraryPanel.tsx` | tsx | 2 | 2 | `app/engines/games/library/page.tsx`, `components/engines/games/index.ts` | `lib/games/catalog.ts`, `lib/games/navigation.ts` |
| `components/engines/games/panels/dream.panel.ScoresPanel.tsx` | tsx | 1 | 2 | `app/engines/games/scores/page.tsx`, `components/engines/games/index.ts` | `lib/supabase/client.ts` |
| `components/engines/lab/dream.LabEnginApp.tsx` | tsx | 2 | 2 | `app/engines/lab/page.tsx`, `components/engines/lab/index.ts` | `components/engines/shared/index.ts`, `engins/engin.LabEngin.tsx` |
| `components/engines/lab/panels/dream.panel.DataVizPanel.tsx` | tsx | 0 | 2 | `app/engines/lab/data/page.tsx`, `components/engines/lab/index.ts` | — |
| `components/engines/lab/panels/dream.panel.ExperimentsPanel.tsx` | tsx | 0 | 2 | `app/engines/lab/experiments/page.tsx`, `components/engines/lab/index.ts` | — |
| `components/engines/lab/panels/dream.panel.QuantumPanel.tsx` | tsx | 0 | 2 | `app/engines/lab/quantum/page.tsx`, `components/engines/lab/index.ts` | — |
| `components/engines/music/dream.MusicEnginApp.tsx` | tsx | 2 | 2 | `app/engines/music/page.tsx`, `components/engines/music/index.ts` | `components/engines/shared/index.ts`, `engins/engin.StarMakerEngin.tsx` |
| `components/engines/music/panels/dream.panel.ArrangePanel.tsx` | tsx | 0 | 2 | `app/engines/music/arrange/page.tsx`, `components/engines/music/index.ts` | — |
| `components/engines/music/panels/dream.panel.MusicLibraryPanel.tsx` | tsx | 0 | 2 | `app/engines/music/library/page.tsx`, `components/engines/music/index.ts` | — |
| `components/engines/music/panels/dream.panel.StudioPanel.tsx` | tsx | 0 | 2 | `app/engines/music/studio/page.tsx`, `components/engines/music/index.ts` | — |
| `components/engines/portfolio/dream.PortfolioEnginApp.tsx` | tsx | 2 | 2 | `app/engines/portfolio/page.tsx`, `components/engines/portfolio/index.ts` | `components/engines/shared/index.ts`, `engins/portfolio/dream.PortfolioEngin.tsx` |
| `components/engines/portfolio/panels/dream.panel.AssetsPanel.tsx` | tsx | 0 | 2 | `app/engines/portfolio/assets/page.tsx`, `components/engines/portfolio/index.ts` | — |
| `components/engines/portfolio/panels/dream.panel.OptimizePanel.tsx` | tsx | 1 | 2 | `app/engines/portfolio/optimize/page.tsx`, `components/engines/portfolio/index.ts` | `engins/dream.QuantumCircuitCanvas.tsx` |
| `components/engines/portfolio/panels/dream.panel.PortfolioQuantumPanel.tsx` | tsx | 0 | 2 | `app/engines/portfolio/quantum/page.tsx`, `components/engines/portfolio/index.ts` | — |
| `components/engines/shared/dream.EnginProvider.tsx` | tsx | 0 | 2 | `components/engines/shared/dream.EnginRuleSet.ts`, `components/engines/shared/index.ts` | — |
| `components/engines/shared/dream.shell.EnginAppShell.tsx` | tsx | 1 | 2 | `components/engines/shared/dream.makeEnginApp.tsx`, `components/engines/shared/index.ts` | `components/shared-dream/index.ts` |
| `components/feed/dream.AlgorithmEngine.tsx` | tsx | 0 | 2 | `app/settings/algorithm/page.tsx`, `components/panels/dream.panel.AlgorithmPanel.tsx` | — |
| `components/gameengin/dream.cartridge.CartridgeErrorBoundary.tsx` | tsx | 0 | 2 | `components/gameengin/dream.cartridge.CartridgeLauncher.tsx`, `tests/gameengin-crash-modal.test.ts` | — |
| `components/gameengin/dream.cartridge.CartridgeLauncher.tsx` | tsx | 6 | 2 | `app/gameengin/cartridges/[id]/page.tsx`, `tests/gameengin-crash-modal.test.ts` | `lib/gameengin/GameRuntime.tsx`, `lib/gameengin/cartridges/loaders.ts`, `lib/gameengin/cartridge.ts` |
| `components/gameengin/dream.CrashReportModal.tsx` | tsx | 0 | 2 | `components/gameengin/dream.cartridge.CartridgeLauncher.tsx`, `tests/gameengin-crash-modal.test.ts` | — |
| `components/gameengin/input/DualSenseManager.ts` | ts | 0 | 2 | `components/games/dream.EchoArena.tsx`, `components/games/dream.NeonDrift.tsx` | — |
| `components/games/dream.AvenueOfMirrors.tsx` | tsx | 1 | 2 | `components/games/dream.GamesHub.tsx`, `lib/gameengin/cartridges/loaders.ts` | `lib/games/hooks.ts` |
| `components/games/dream.DefuseRitual.tsx` | tsx | 1 | 2 | `components/games/dream.GamesHub.tsx`, `lib/gameengin/cartridges/loaders.ts` | `lib/games/hooks.ts` |
| `components/games/dream.EchoArena.tsx` | tsx | 4 | 2 | `components/games/dream.GamesHub.tsx`, `lib/gameengin/cartridges/loaders.ts` | `lib/games/hooks.ts`, `lib/games/performance-baseline.ts`, `lib/games/mobileControls.ts` |
| `components/games/dream.EnginFracture.tsx` | tsx | 1 | 2 | `components/games/dream.GamesHub.tsx`, `lib/gameengin/cartridges/loaders.ts` | `lib/games/hooks.ts` |
| `components/games/dream.Glassfall.tsx` | tsx | 2 | 2 | `components/games/dream.GamesHub.tsx`, `lib/gameengin/cartridges/loaders.ts` | `lib/games/hooks.ts`, `components/games/_fx/canvasFx.ts` |
| `components/games/dream.hud.GameHUD.tsx` | tsx | 3 | 2 | `app/daydream/game/dream.shell.ImmersiveGameShell.tsx`, `engins/engin.GameEngin.tsx` | `components/games/dream.hud.MobileGameHUD.tsx`, `components/games/dream.GameController.tsx`, `lib/games/mobileControls.ts` |
| `components/games/dream.LexiconSolitaire.tsx` | tsx | 1 | 2 | `components/games/dream.GamesHub.tsx`, `lib/gameengin/cartridges/loaders.ts` | `lib/games/hooks.ts` |
| `components/games/dream.NeonDrift.tsx` | tsx | 6 | 2 | `components/games/dream.GamesHub.tsx`, `lib/gameengin/cartridges/loaders.ts` | `lib/games/hooks.ts`, `lib/games/performance-baseline.ts`, `components/gameengin/input/DualSenseManager.ts` |
| `components/games/dream.NiteFlyerSolarHymn.tsx` | tsx | 1 | 2 | `components/games/dream.GamesHub.tsx`, `lib/gameengin/cartridges/loaders.ts` | `lib/games/hooks.ts` |
| `components/games/dream.NullCathedral.tsx` | tsx | 2 | 2 | `components/games/dream.GamesHub.tsx`, `lib/gameengin/cartridges/loaders.ts` | `lib/games/hooks.ts`, `components/games/_fx/canvasFx.ts` |
| `components/games/dream.SerpentSiege.tsx` | tsx | 2 | 2 | `components/games/dream.GamesHub.tsx`, `lib/gameengin/cartridges/loaders.ts` | `lib/games/hooks.ts`, `components/games/_fx/canvasFx.ts` |
| `components/games/dream.VoidlineGP.tsx` | tsx | 2 | 2 | `components/games/dream.GamesHub.tsx`, `lib/gameengin/cartridges/loaders.ts` | `lib/games/hooks.ts`, `components/games/_fx/canvasFx.ts` |
| `components/games/madmaxi/levels.ts` | ts | 3 | 2 | `components/games/madmaxi/dream.MadmaxiGame.tsx`, `components/games/madmaxi/index.ts` | `components/games/madmaxi/config.ts`, `components/games/madmaxi/authoredZonePacks.ts`, `components/games/madmaxi/types.ts` |
| `components/marketplace/dream.MarketplaceListingCard.tsx` | tsx | 0 | 2 | `app/marketplace/page.tsx`, `components/panels/dream.panel.MarketplacePanel.tsx` | — |
| `components/menus/dream.panel.MenuPanel.tsx` | tsx | 0 | 2 | `components/menus/dream.menu.DreamRadialMenu.tsx`, `components/menus/dream.menu.SystemRadialMenu.tsx` | — |
| `components/music/dream.SoundRecorder.tsx` | tsx | 0 | 2 | `app/daydream/music/page.tsx`, `daydreams/music/page.tsx` | — |
| `components/panels/dream.panel.FeedSettingsPanel.tsx` | tsx | 1 | 2 | `components/panels/dream.panel.FeedPanel.tsx`, `components/runtime/dream.RuntimeView.tsx` | `lib/feed/feedTopics.ts` |
| `components/profile/dream.EditableAvatar.tsx` | tsx | 0 | 2 | `components/dream.HomeFeed.tsx`, `components/profile/dream.widget.ProfileWidgetGrid.tsx` | — |
| `components/providers/dream.GodTierProvider.tsx` | tsx | 1 | 2 | `app/layout.tsx`, `components/providers/dream.AppSurfaceShell.tsx` | `lib/god-tier/useGodTier.ts` |
| `components/shaders/dream.LightningWing.tsx` | tsx | 0 | 2 | `components/shaders/index.ts`, `components/three/dream.scene.tsx` | — |
| `components/shaders/dream.NeonGlow.tsx` | tsx | 0 | 2 | `components/shaders/index.ts`, `components/three/dream.scene.tsx` | — |
| `components/shaders/dream.Refractor.tsx` | tsx | 0 | 2 | `components/shaders/index.ts`, `components/three/dream.scene.tsx` | — |
| `components/three/dream.scene.tsx` | tsx | 3 | 2 | `app/dream-effects/page.tsx`, `components/three/index.ts` | `components/shaders/dream.NeonGlow.tsx`, `components/shaders/dream.LightningWing.tsx`, `components/shaders/dream.Refractor.tsx` |
| `components/ui/dream.InfinityIcon.tsx` | tsx | 0 | 2 | `app/profile/[handle]/page.tsx`, `components/dreamengin/dream.HomeControls.tsx` | — |
| `components/ui/dream.PlatformBadge.tsx` | tsx | 3 | 2 | `app/about/page.tsx`, `components/profile/dream.ProfileCanvas.tsx` | `lib/social/platforms.ts`, `components/ui/dream.SheetIcon.tsx`, `lib/icons/sheet.ts` |
| `components/ui/dream.SheetIcon.tsx` | tsx | 1 | 2 | `components/ui/dream.IconList.tsx`, `components/ui/dream.PlatformBadge.tsx` | `lib/icons/sheet.ts` |
| `components/ui/dream.SocialShareSheet.tsx` | tsx | 1 | 2 | `components/dream.HomeFeed.tsx`, `components/dream.ProfileShareButton.tsx` | `lib/social/platforms.ts` |
| `components/universal-editor/useTapHoldMove.ts` | ts | 1 | 2 | `components/universal-editor/dream.UniversalEditorWrapper.tsx`, `components/universal-editor/index.ts` | `lib/universal-editor/module-manifest.ts` |
| `components/widgets/dream.widget.UniversalWidget.tsx` | tsx | 1 | 2 | `components/dreams/dreamsurface.dreamspace.tsx`, `tests/phase8b-dream-windows.test.ts` | `components/widgets/dream.widget.WidgetCard.tsx` |
| `components/widgets/dream.widget.WidgetShell.tsx` | tsx | 1 | 2 | `app/connectors/dream.ConnectorsClient.tsx`, `tests/phase8b-dream-windows.test.ts` | `components/dreams/dreamsurface.shell.tsx` |
| `components/activity/dream.ActivityPostForm.tsx` | tsx | 3 | 1 | `engins/engin.ContentEngin.tsx` | `lib/activity/types.ts`, `lib/activity/scoring.ts`, `components/activity/dream.TierBadge.tsx` |
| `components/ads/dream.AdUnit.tsx` | tsx | 1 | 1 | `components/dream.HomeFeed.tsx` | `lib/activity/types.ts` |
| `components/ads/dream.SkipCreditBalance.tsx` | tsx | 0 | 1 | `components/home/dream.bar.PersistentDreamBar.tsx` | — |
| `components/connectors/dream.AddSliceSheet.tsx` | tsx | 1 | 1 | `app/connectors/dream.ConnectorsClient.tsx` | `lib/connectors/connectorRegistry.ts` |
| `components/connectors/dream.ConnectorRow.tsx` | tsx | 1 | 1 | `app/connectors/dream.ConnectorsClient.tsx` | `lib/connectors/connectorRegistry.ts` |
| `components/connectors/dream.NoSlotDialog.tsx` | tsx | 1 | 1 | `app/connectors/dream.ConnectorsClient.tsx` | `lib/widgets/widgetRegistry.ts` |
| `components/connectors/dream.PlacementMode.tsx` | tsx | 2 | 1 | `app/connectors/dream.ConnectorsClient.tsx` | `lib/widgets/widgetRegistry.ts`, `lib/connectors/installFlow.ts` |
| `components/connectors/dream.widget.ConnectorWidgetPicker.tsx` | tsx | 1 | 1 | `components/profile/dream.widget.ProfileWidgetGrid.tsx` | `components/profile/dream.widget.ProfileWidgetGrid.tsx` |
| `components/customize/dream.bar.CustomizeModeBar.tsx` | tsx | 1 | 1 | `components/customize/dream.GlobalCustomizeUI.tsx` | `lib/ui/CustomizeModeContext.tsx` |
| `components/customize/dream.bar.CustomizeToolbar.tsx` | tsx | 1 | 1 | `components/customize/dream.GlobalCustomizeUI.tsx` | `lib/ui/CustomizeModeContext.tsx` |
| `components/customize/dream.GlobalCustomizeUI.tsx` | tsx | 6 | 1 | `components/dream.GlobalOverlays.tsx` | `components/customize/dream.bar.CustomizeModeBar.tsx`, `components/customize/dream.bar.CustomizeToolbar.tsx`, `components/customize/panels/dream.panel.ColorPanel.tsx` |
| `components/customize/panels/dream.panel.EffectsPanel.tsx` | tsx | 2 | 1 | `components/customize/dream.GlobalCustomizeUI.tsx` | `lib/ui/CustomizeModeContext.tsx`, `components/customize/panels/dream.panel.ColorPanel.tsx` |
| `components/customize/panels/dream.panel.FontPanel.tsx` | tsx | 3 | 1 | `components/customize/dream.GlobalCustomizeUI.tsx` | `lib/ui/CustomizeModeContext.tsx`, `lib/ui/skin-engine.ts`, `components/customize/panels/dream.panel.ColorPanel.tsx` |
| `components/customize/panels/dream.panel.LayoutPanel.tsx` | tsx | 3 | 1 | `components/customize/dream.GlobalCustomizeUI.tsx` | `lib/ui/CustomizeModeContext.tsx`, `lib/ui/skin-engine.ts`, `components/customize/panels/dream.panel.ColorPanel.tsx` |
| `components/daydream/dream.constellationmap.tsx` | tsx | 0 | 1 | `app/daydream/constellation/dream.ConstellationClient.tsx` | — |
| `components/daydream/dream.DiffViewer.tsx` | tsx | 1 | 1 | `engins/engin.CodeEngin.tsx` | `lib/diff/diffUtils.ts` |
| `components/daydream/dreamsurface.daydream.AnalyticsDaydream.tsx` | tsx | 2 | 1 | `app/daydream/analytics/page.tsx` | `components/activity/dream.ActivityProfile.tsx`, `components/daydream/dream.OpenDaydreamSideBButton.tsx` |
| `components/daydream/starmaker/dream.panel.CompingPanel.tsx` | tsx | 1 | 1 | `engins/engin.StarMakerEngin.tsx` | `lib/music/starmakerDaw.ts` |
| `components/daydream/starmaker/dream.panel.MultitrackArrangementPanel.tsx` | tsx | 1 | 1 | `engins/engin.StarMakerEngin.tsx` | `lib/music/starmakerArrangement.ts` |
| `components/daydream/starmaker/dream.panel.PianoRollPanel.tsx` | tsx | 1 | 1 | `engins/engin.StarMakerEngin.tsx` | `lib/music/starmakerDaw.ts` |
| `components/daydream/starmaker/dream.panel.SessionViewPanel.tsx` | tsx | 1 | 1 | `engins/engin.StarMakerEngin.tsx` | `lib/music/starmakerDaw.ts` |
| `components/dream.AudioVisualizer3D.tsx` | tsx | 1 | 1 | `engins/engin.StarMakerEngin.tsx` | `lib/audioFingerprint.ts` |
| `components/dream.DragToAnchorClose.tsx` | tsx | 0 | 1 | `components/dream.ProfileSpace.tsx` | — |
| `components/dream.ForgeDreamCanvas.tsx` | tsx | 4 | 1 | `engins/engin.LabEngin.tsx` | `lib/componentInventory.ts`, `lib/forge/engineForge.ts`, `lib/eventBus.ts` |
| `components/dream.HeroSprite.tsx` | tsx | 0 | 1 | `tests/hero-sprite.test.ts` | — |
| `components/dream.HomeFeed.tsx` | tsx | 11 | 1 | `app/dreamdmbar/_components/HomeDreamRegion.tsx` | `lib/feed/useLiveFeed.ts`, `lib/feed/useYouTubeLiveFeed.ts`, `components/feed/dream.FeedVideoCard.tsx` |
| `components/dream.KonamiDream.tsx` | tsx | 0 | 1 | `components/dream.GlobalOverlays.tsx` | — |
| `components/dream.MessagesClient.tsx` | tsx | 6 | 1 | `app/messages/page.tsx` | `lib/utils.ts`, `lib/supabase/client.ts`, `lib/media/ledger.ts` |
| `components/dream.NotificationCenter.tsx` | tsx | 2 | 1 | `app/dreamdmbar/_components/HomeDreamRegion.tsx` | `lib/notifications/useNotifications.ts`, `lib/notifications/notificationHelpers.ts` |
| `components/dream.panel.ChildSafetyPanel.tsx` | tsx | 0 | 1 | `app/(internal)/idari-console/page.tsx` | — |
| `components/dream.panel.IDariPanel.tsx` | tsx | 1 | 1 | `app/(internal)/idari-console/page.tsx` | `lib/agents/agentBus.ts` |
| `components/dream.ProfileSpace.tsx` | tsx | 2 | 1 | `components/spatial/dream.shell.EnhancedSpatialShell.tsx` | `lib/navigation/WidgetInstanceMemory.ts`, `components/dream.DragToAnchorClose.tsx` |
| `components/dream.universal_asset_registry.tsx` | tsx | 2 | 1 | `tests/universal-asset-registry.test.ts` | `lib/supabase/client.ts`, `lib/forge/useForgeActivity.ts` |
| `components/dreamengin/dream.HomeControls.tsx` | tsx | 1 | 1 | `components/dreamengin/dreamsurface.dreamengin.tsx` | `components/ui/dream.InfinityIcon.tsx` |
| `components/dreamengin/dream.menu.NexusMenu.tsx` | tsx | 1 | 1 | `components/dreamengin/dreamsurface.dreamengin.tsx` | `components/ui/dream.DreamWord.tsx` |
| `components/dreamengin/dream.menu.OutdreamMenu.tsx` | tsx | 3 | 1 | `components/dreamengin/dreamsurface.dreamengin.tsx` | `components/dreamnav/dreamsurface.dreamnav.tsx`, `lib/dreamnav/delta.ts`, `lib/dreamnav/path.ts` |
| `components/dreamengin/engine/math.ts` | ts | 0 | 1 | `components/dreamengin/engine/types.ts` | — |
| `components/dreamr/dream.panel.DreamRChannelPanel.tsx` | tsx | 2 | 1 | `lib/dreamr/dreamrfeed.tsx` | `lib/feed/useLiveFeed.ts`, `types/connector.ts` |
| `components/dreamr/dream.panel.DreamRCreatorPanel.tsx` | tsx | 1 | 1 | `lib/dreamr/dreamrfeed.tsx` | `lib/feed/useLiveFeed.ts` |
| `components/dreams/dream.GlobalDragLayer.tsx` | tsx | 1 | 1 | `components/dream.GlobalOverlays.tsx` | `lib/dreams/drag.ts` |
| `components/dreams/dream.panel.RuntimeMemoryHUD.tsx` | tsx | 2 | 1 | `components/dreams/dreamsurface.dreamspace.tsx` | `lib/runtime/dreamOSBus.ts`, `lib/intelligence/continuityHelpers.ts` |
| `components/dreams/dream.PlatformErrorReporter.tsx` | tsx | 0 | 1 | `components/dream.GlobalOverlays.tsx` | — |
| `components/engines/brand/index.ts` | ts | 3 | 1 | `components/engines/index.ts` | `components/engines/brand/dream.BrandEnginApp.tsx`, `components/engines/brand/panels/dream.panel.IdentityPanel.tsx`, `components/engines/brand/panels/dream.panel.CampaignsPanel.tsx` |
| `components/engines/code/index.ts` | ts | 4 | 1 | `components/engines/index.ts` | `components/engines/code/dream.CodeEnginApp.tsx`, `components/engines/code/panels/dream.panel.NotebookPanel.tsx`, `components/engines/code/panels/dream.panel.ProjectsPanel.tsx` |
| `components/engines/create/index.ts` | ts | 4 | 1 | `components/engines/index.ts` | `components/engines/create/dream.CreateEnginApp.tsx`, `components/engines/create/panels/dream.panel.EditorPanel.tsx`, `components/engines/create/panels/dream.panel.CalendarPanel.tsx` |
| `components/engines/games/index.ts` | ts | 4 | 1 | `components/engines/index.ts` | `components/engines/games/dream.GameEnginApp.tsx`, `components/engines/games/panels/dream.panel.LibraryPanel.tsx`, `components/engines/games/panels/dream.panel.ScoresPanel.tsx` |
| `components/engines/lab/index.ts` | ts | 4 | 1 | `components/engines/index.ts` | `components/engines/lab/dream.LabEnginApp.tsx`, `components/engines/lab/panels/dream.panel.ExperimentsPanel.tsx`, `components/engines/lab/panels/dream.panel.DataVizPanel.tsx` |
| `components/engines/music/index.ts` | ts | 4 | 1 | `components/engines/index.ts` | `components/engines/music/dream.MusicEnginApp.tsx`, `components/engines/music/panels/dream.panel.StudioPanel.tsx`, `components/engines/music/panels/dream.panel.ArrangePanel.tsx` |
| `components/engines/portfolio/index.ts` | ts | 4 | 1 | `components/engines/index.ts` | `components/engines/portfolio/dream.PortfolioEnginApp.tsx`, `components/engines/portfolio/panels/dream.panel.OptimizePanel.tsx`, `components/engines/portfolio/panels/dream.panel.AssetsPanel.tsx` |
| `components/engines/shared/dream.EnginRuleSet.ts` | ts | 2 | 1 | `components/engines/shared/dream.makeEnginApp.tsx` | `components/engines/shared/dream.EnginProvider.tsx`, `components/engines/shared/dream.bar.EnginNavBar.tsx` |
| `components/engines/shared/dream.makeEnginApp.tsx` | tsx | 3 | 1 | `components/engines/shared/index.ts` | `components/engines/shared/dream.shell.EnginAppShell.tsx`, `components/engines/shared/dream.bar.EnginNavBar.tsx`, `components/engines/shared/dream.EnginRuleSet.ts` |
| `components/feed/dream.CommentSection.tsx` | tsx | 1 | 1 | `components/dream.FeedCard.tsx` | `lib/utils.ts` |
| `components/feed/dream.FeedVideoCard.tsx` | tsx | 1 | 1 | `components/dream.HomeFeed.tsx` | `lib/feed/useLiveFeed.ts` |
| `components/feed/dream.FollowButton.tsx` | tsx | 1 | 1 | `app/profile/[handle]/page.tsx` | `components/feed/dream.FollowOnboarding.tsx` |
| `components/feed/dream.FollowOnboarding.tsx` | tsx | 0 | 1 | `components/feed/dream.FollowButton.tsx` | — |
| `components/forge/dream.panel.AIBuilderPanel.tsx` | tsx | 3 | 1 | `engins/dream.ForgeEngin.tsx` | `lib/forge/useForgeBuild.ts`, `lib/forge/forgeBuild.ts`, `lib/forge/forgeRegistry.ts` |
| `components/forge/dream.widget.ForgeMomentumWidget.tsx` | tsx | 1 | 1 | `app/daydream/forge/page.tsx` | `lib/forge/forgeMomentum.ts` |
| `components/gameengin/dream.cartridge.CartridgeBrowser.tsx` | tsx | 1 | 1 | `app/gameengin/cartridges/page.tsx` | `lib/gameengin/cartridges/manifest.ts` |
| `components/gameengin/dream.CartridgeRegistryBootstrap.tsx` | tsx | 1 | 1 | `app/layout.tsx` | `lib/gameengin/registerCartridges.ts` |
| `components/games/dream.GameController.module.css` | css | 0 | 1 | `components/games/dream.GameController.tsx` | — |
| `components/games/dream.GameController.tsx` | tsx | 5 | 1 | `components/games/dream.hud.GameHUD.tsx` | `lib/games/mobileControls.ts`, `lib/games/gameControllerLeft.ts`, `lib/games/gameControllerRight.ts` |
| `components/games/dream.hud.MobileGameHUD.module.css` | css | 0 | 1 | `components/games/dream.hud.MobileGameHUD.tsx` | — |
| `components/games/dream.hud.MobileGameHUD.tsx` | tsx | 2 | 1 | `components/games/dream.hud.GameHUD.tsx` | `components/games/dream.hud.MobileGameHUD.module.css`, `lib/games/mobileControls.ts` |
| `components/games/dream.RecordingControls.tsx` | tsx | 1 | 1 | `engins/engin.GameEngin.tsx` | `lib/h265-encoder.ts` |
| `components/games/dream.remote.LegacyGameRemote.tsx` | tsx | 3 | 1 | `components/games/dream.remote.GameRemote.tsx` | `lib/games/useGamepad.ts`, `lib/games/navigation.ts`, `lib/games/useRemoteChannel.ts` |
| `components/games/madmaxi/audio.ts` | ts | 0 | 1 | `components/games/madmaxi/dream.MadmaxiGame.tsx` | — |
| `components/games/madmaxi/authoredZonePacks.ts` | ts | 2 | 1 | `components/games/madmaxi/levels.ts` | `components/games/madmaxi/config.ts`, `components/games/madmaxi/types.ts` |
| `components/games/madmaxi/dream.MadmaxiGame.tsx` | tsx | 10 | 1 | `components/games/madmaxi/index.ts` | `lib/games/hooks.ts`, `lib/games/useImmersiveGameLayout.ts`, `lib/babylon/createEngine.ts` |
| `components/games/madmaxi/materials.ts` | ts | 0 | 1 | `components/games/madmaxi/dream.MadmaxiGame.tsx` | — |
| `components/games/madmaxi/vfx.ts` | ts | 0 | 1 | `components/games/madmaxi/dream.MadmaxiGame.tsx` | — |
| `components/home/dream.ActiveModuleSurface.tsx` | tsx | 6 | 1 | `app/dreamdmbar/_components/HomeDreamRegion.tsx` | `lib/artifactStore.ts`, `lib/activeModulesStore.ts`, `lib/runtime/dreamOSBus.ts` |
| `components/home/dream.bar.GlobalDreamBar.tsx` | tsx | 5 | 1 | `app/dreamdmbar/layout.tsx` | `components/menus/dream.menu.DualBottomMenu.tsx`, `components/dreamengin/dream.panel.DrEamsPanel.tsx`, `lib/dreamdm/DreamSystemContext.tsx` |
| `components/home/dream.bar.PersistentDreamBar.tsx` | tsx | 11 | 1 | `app/dreamdmbar/layout.tsx` | `dreamdmbar/dreamsurface.dreamdmbar.tsx`, `components/home/dream.NeuralSeamCanvas.tsx`, `components/runtime/dream.RuntimeView.tsx` |
| `components/home/dream.DaydreamPulseStrip.tsx` | tsx | 0 | 1 | `app/dreamdmbar/_components/HomeDreamRegion.tsx` | — |
| `components/home/dream.FlagshipEnginesStrip.tsx` | tsx | 1 | 1 | `app/dreamdmbar/_components/HomeDreamRegion.tsx` | `lib/forge/forgeMomentum.ts` |
| `components/home/dream.NeuralSeamCanvas.tsx` | tsx | 3 | 1 | `components/home/dream.bar.PersistentDreamBar.tsx` | `lib/runtime/dualRuntimeBridge.ts`, `lib/dreamdm/barInteractions.ts`, `lib/dreamdm/bridgeSeamFlow.ts` |
| `components/idari/dream.PlatformHealth.tsx` | tsx | 1 | 1 | `app/(internal)/idari-console/platform-health/page.tsx` | `lib/activity/types.ts` |
| `components/landing/dream.LandingNav.tsx` | tsx | 0 | 1 | `components/dream.LandingHero.tsx` | — |
| `components/landing/dream.LandingProductStatement.tsx` | tsx | 0 | 1 | `components/dream.LandingHero.tsx` | — |
| `components/landing/dream.scene.UniverseField.tsx` | tsx | 1 | 1 | `components/dream.LandingHero.tsx` | `lib/torridity/constants.ts` |
| `components/marketplace/dream.MarketplaceRequestButton.tsx` | tsx | 0 | 1 | `app/marketplace/[id]/page.tsx` | — |
| `components/menus/dream.menu.DualBottomMenu.tsx` | tsx | 0 | 1 | `components/home/dream.bar.GlobalDreamBar.tsx` | — |
| `components/messaging/dream.BoardComposer.tsx` | tsx | 0 | 1 | `app/messages/boards/[id]/page.tsx` | — |
| `components/panels/dream.panel.AlgorithmPanel.tsx` | tsx | 2 | 1 | `components/runtime/dream.RuntimeView.tsx` | `components/feed/dream.AlgorithmEngine.tsx`, `lib/dreamdm/DreamSystemContext.tsx` |
| `components/panels/dream.panel.AppearancePanel.tsx` | tsx | 5 | 1 | `components/runtime/dream.RuntimeView.tsx` | `components/providers/dream.ThemeProvider.tsx`, `lib/ui/theme-engine.ts`, `components/dream.ThemeApplicator.tsx` |
| `components/panels/dream.panel.ConnectorsPanel.tsx` | tsx | 1 | 1 | `components/runtime/dream.RuntimeView.tsx` | `app/connectors/dream.ConnectorsClient.tsx` |
| `components/panels/dream.panel.ControlsPanel.tsx` | tsx | 2 | 1 | `components/runtime/dream.RuntimeView.tsx` | `lib/dreamdm/DreamSystemContext.tsx`, `app/settings/controls/dream.PositionIndicatorToggle.tsx` |
| `components/panels/dream.panel.DataPanel.tsx` | tsx | 2 | 1 | `components/runtime/dream.RuntimeView.tsx` | `lib/supabase/client.ts`, `lib/dreamdm/DreamSystemContext.tsx` |
| `components/panels/dream.panel.HelpPanel.tsx` | tsx | 1 | 1 | `components/runtime/dream.RuntimeView.tsx` | `lib/dreamdm/DreamSystemContext.tsx` |
| `components/panels/dream.panel.MarketplacePanel.tsx` | tsx | 4 | 1 | `components/runtime/dream.RuntimeView.tsx` | `lib/supabase/client.ts`, `components/marketplace/dream.MarketplaceListingCard.tsx`, `components/ui/dream.DreamWord.tsx` |
| `components/panels/dream.panel.PrivacyPanel.tsx` | tsx | 1 | 1 | `components/runtime/dream.RuntimeView.tsx` | `lib/dreamdm/DreamSystemContext.tsx` |
| `components/panels/dream.panel.ProfilePanel.tsx` | tsx | 3 | 1 | `components/runtime/dream.RuntimeView.tsx` | `lib/supabase/client.ts`, `components/profile/dream.widget.ProfileWidgetGrid.tsx`, `components/ui/dream.DreamWord.tsx` |
| `components/panels/dream.panel.SafetyPanel.tsx` | tsx | 3 | 1 | `components/runtime/dream.RuntimeView.tsx` | `lib/supabase/client.ts`, `lib/dreamdm/DreamSystemContext.tsx`, `lib/ai/boogie-policy.ts` |
| `components/panels/dream.panel.SettingsPanel.tsx` | tsx | 3 | 1 | `components/runtime/dream.RuntimeView.tsx` | `lib/supabase/client.ts`, `lib/dreamdm/DreamSystemContext.tsx`, `lib/panels/panelTypes.ts` |
| `components/panels/dream.panel.WidgetsPanel.tsx` | tsx | 3 | 1 | `components/runtime/dream.RuntimeView.tsx` | `lib/supabase/client.ts`, `lib/dreamdm/DreamSystemContext.tsx`, `components/ui/dream.DreamWord.tsx` |
| `components/profile/dream.ProfileCustomizeButton.tsx` | tsx | 1 | 1 | `app/profile/[handle]/page.tsx` | `lib/ui/CustomizeModeContext.tsx` |
| `components/runtime/dream.RuntimeView.tsx` | tsx | 21 | 1 | `components/home/dream.bar.PersistentDreamBar.tsx` | `lib/runtime/dualRuntime.ts`, `app/dreamdmbar/_components/HomeDreamRegion.tsx`, `components/dreams/dreamsurface.dreamspace.tsx` |
| `components/runtime/dream.shell.RuntimeShell.tsx` | tsx | 1 | 1 | `components/runtime/dream.RuntimeView.tsx` | `lib/ui/runtimeViewport.ts` |
| `components/shared-dream/dream.InviteFlow.tsx` | tsx | 1 | 1 | `components/shared-dream/index.ts` | `components/shared-dream/dream.SharedDreamProvider.tsx` |
| `components/shared-dream/dream.SharedDreamCanvas.tsx` | tsx | 1 | 1 | `components/shared-dream/index.ts` | `components/shared-dream/dream.SharedDreamProvider.tsx` |
| `components/shared-dream/index.ts` | ts | 3 | 1 | `components/engines/shared/dream.shell.EnginAppShell.tsx` | `components/shared-dream/dream.SharedDreamProvider.tsx`, `components/shared-dream/dream.SharedDreamCanvas.tsx`, `components/shared-dream/dream.InviteFlow.tsx` |
| `components/spatial/dream.PixiPhysicsLayer.tsx` | tsx | 0 | 1 | `components/spatial/dream.shell.EnhancedSpatialShell.tsx` | — |
| `components/spatial/dream.ProfileSpace.tsx` | tsx | 3 | 1 | `components/dreams/dreamsurface.dreamspace.tsx` | `hooks/use-spatial.ts`, `types/spatial.ts`, `lib/utils.ts` |
| `components/spatial/dream.shell.EnhancedSpatialShell.tsx` | tsx | 5 | 1 | `components/runtime/dream.RuntimeView.tsx` | `lib/navigation/SpatialNavigationEngine.ts`, `lib/navigation/WidgetInstanceMemory.ts`, `lib/navigation/NavStateBuffer.ts` |
| `components/universal-editor/dream.UniversalEditor.tsx` | tsx | 1 | 1 | `components/universal-editor/index.ts` | `lib/runtime/coercionTable.ts` |
| `components/universal-editor/dream.UniversalEditorWrapper.tsx` | tsx | 2 | 1 | `components/universal-editor/index.ts` | `components/universal-editor/useTapHoldMove.ts`, `lib/universal-editor/module-manifest.ts` |
| `components/universe/dream.node-cluster.tsx` | tsx | 1 | 1 | `components/universe/index.ts` | `lib/utils.ts` |
| `components/universe/dream.shell.universe-shell.tsx` | tsx | 1 | 1 | `components/universe/index.ts` | `lib/utils.ts` |
| `components/universe/dream.universe-card.tsx` | tsx | 1 | 1 | `components/universe/index.ts` | `lib/utils.ts` |
| `components/universe/index.ts` | ts | 3 | 1 | `components/dream.FeedCard.tsx` | `components/universe/dream.node-cluster.tsx`, `components/universe/dream.universe-card.tsx`, `components/universe/dream.shell.universe-shell.tsx` |
| `components/webgpu/dream.WebGPUShowcase.tsx` | tsx | 2 | 1 | `app/webgpu/page.tsx` | `lib/webgpu.ts`, `components/webgpu/renderer.ts` |
| `components/webgpu/renderer.ts` | ts | 1 | 1 | `components/webgpu/dream.WebGPUShowcase.tsx` | `components/webgpu/shaders.ts` |
| `components/webgpu/shaders.ts` | ts | 0 | 1 | `components/webgpu/renderer.ts` | — |
| `components/widgets/dream.EditModeProvider.tsx` | tsx | 0 | 1 | `components/widgets/dream.EditModeBanner.tsx` | — |
| `components/widgets/dream.widget.WidgetLibrary.tsx` | tsx | 1 | 1 | `tests/phase8b-dream-windows.test.ts` | `components/dreams/dream.widget.SuperDreamWidget.tsx` |
| `components/widgets/dream.widget.WidgetSurface.tsx` | tsx | 1 | 1 | `tests/phase8b-dream-windows.test.ts` | `components/dreams/dream.widget.SuperDreamWidget.tsx` |
| `components/connectors/dream.ConnectDreamPrompt.tsx` | tsx | 1 | 0 | — | `components/connectors/dream.widget.ConnectWidgetPrompt.tsx` |
| `components/core/dream.CoreDream.tsx` | tsx | 1 | 0 | — | `app/dreamdmbar/_components/HomeDreamRegion.tsx` |
| `components/daydream/dream.CodeDreamIDE.tsx` | tsx | 2 | 0 | — | `lib/runtime/swapManager.ts`, `lib/runtime/dualRuntimeBridge.ts` |
| `components/daydream/dream.LabDreamIDE.tsx` | tsx | 2 | 0 | — | `lib/runtime/swapManager.ts`, `lib/runtime/dualRuntimeBridge.ts` |
| `components/daydream/dream.NGNEngin.tsx` | tsx | 3 | 0 | — | `lib/forge-ngn/piece-registry.ts`, `lib/forge-ngn/assembly.ts`, `lib/event-bus/index.ts` |
| `components/daydream/dream.StandaloneEnginSurface.tsx` | tsx | 7 | 0 | — | `engins/engin.GameEngin.tsx`, `engins/engin.StarMakerEngin.tsx`, `engins/engin.LabEngin.tsx` |
| `components/draggable/dream.DraggableModule.tsx` | tsx | 2 | 0 | — | `lib/runtime/dualRuntimeBridge.ts`, `types/module-manifest.ts` |
| `components/dream.AIAssistant.tsx` | tsx | 4 | 0 | — | `lib/agents/agentBus.ts`, `lib/agents/drEamsMode.ts`, `lib/agents/teachBus.ts` |
| `components/dream.BoogieWarningBanner.tsx` | tsx | 1 | 0 | — | `lib/policy/boogiePolicy.ts` |
| `components/dream.CreatePostModal.tsx` | tsx | 2 | 0 | — | `lib/supabase/client.ts`, `lib/media/ledger.ts` |
| `components/dream.DrEamsModeToggle.tsx` | tsx | 2 | 0 | — | `lib/agents/drEamsMode.ts`, `lib/agents/teachBus.ts` |
| `components/dream.DrEamsVoiceAssistant.tsx` | tsx | 1 | 0 | — | `lib/agents/agentBus.ts` |
| `components/dream.FeedCard.tsx` | tsx | 4 | 0 | — | `lib/utils.ts`, `components/universe/index.ts`, `lib/widgets/parseConfig.ts` |
| `components/dream.IconSelector.tsx` | tsx | 0 | 0 | — | — |
| `components/dream.InnerDreamsButton.tsx` | tsx | 0 | 0 | — | — |
| `components/dream.LandingHero.tsx` | tsx | 4 | 0 | — | `components/landing/dream.scene.UniverseField.tsx`, `components/landing/dream.LandingNav.tsx`, `components/landing/dream.LandingProductStatement.tsx` |
| `components/dream.LedgerChart.tsx` | tsx | 1 | 0 | — | `lib/ledger-data.ts` |
| `components/dream.OSShellActivator.tsx` | tsx | 7 | 0 | — | `components/runtime/dream.DualRuntimeContainer.tsx`, `lib/dreamdm/DreamSystemContext.tsx`, `lib/panels/panelTypes.ts` |
| `components/dream.PhysicsLab.tsx` | tsx | 0 | 0 | — | — |
| `components/dream.ProfileEditor.tsx` | tsx | 4 | 0 | — | `lib/supabase/client.ts`, `lib/ui/CustomizeModeContext.tsx`, `lib/social/platforms.ts` |
| `components/dream.PullToRefresh.tsx` | tsx | 0 | 0 | — | — |
| `components/dream.ShrunkMode.tsx` | tsx | 1 | 0 | — | `lib/navigation/AnchorWidgetStorage.ts` |
| `components/dream.SkeletonLoaders.tsx` | tsx | 0 | 0 | — | — |
| `components/dream.ThemeToggle.tsx` | tsx | 2 | 0 | — | `lib/ui/theme.ts`, `lib/agents/teachBus.ts` |
| `components/dream.ToastSystem.tsx` | tsx | 0 | 0 | — | — |
| `components/dream.VoidThemeToggle.tsx` | tsx | 1 | 0 | — | `components/dream.ThemeApplicator.tsx` |
| `components/dream.widget.AnchorWidget.tsx` | tsx | 5 | 0 | — | `lib/navigation/AnchorStateBuffer.ts`, `lib/navigation/NavStateBuffer.ts`, `lib/navigation/ReturnStack.ts` |
| `components/dream.widget.ProfileWidgetBlock.tsx` | tsx | 0 | 0 | — | — |
| `components/dream.widget.WidgetBubble.tsx` | tsx | 0 | 0 | — | — |
| `components/dreamengin/dream.bar.DrEamsSearchBar.tsx` | tsx | 1 | 0 | — | `lib/dreamengin/drEamsSearch.ts` |
| `components/dreamengin/dream.DrEamsCanvas.tsx` | tsx | 1 | 0 | — | `lib/dreamengin/DrEamsAnimator.ts` |
| `components/dreamengin/dream.overlay.ViewAllDreamsOverlay.tsx` | tsx | 3 | 0 | — | `components/dreamnav/dreamsurface.dreamnav.tsx`, `lib/dreamnav/delta.ts`, `lib/dreamnav/path.ts` |
| `components/dreamengin/dream.scene.BabylonGameScene.tsx` | tsx | 3 | 0 | — | `lib/babylon/createEngine.ts`, `lib/god-tier/godTierEngine.ts`, `lib/webgpu/director.ts` |
| `components/dreamengin/dream.scene.DrEamsScene.tsx` | tsx | 2 | 0 | — | `lib/babylon/createEngine.ts`, `lib/god-tier/godTierEngine.ts` |
| `components/dreamengin/dream.scene.PortfolioOptimizationScene.tsx` | tsx | 0 | 0 | — | — |
| `components/dreamengin/dream.shell.EnginShell.tsx` | tsx | 0 | 0 | — | — |
| `components/dreamengin/dream.widget.AppearanceWidget.tsx` | tsx | 2 | 0 | — | `components/providers/dream.ThemeProvider.tsx`, `lib/ui/theme-engine.ts` |
| `components/dreamengin/dreamsurface.dreamengin.tsx` | tsx | 7 | 0 | — | `components/dreamengin/dream.HomeControls.tsx`, `components/dreamengin/dream.menu.NexusMenu.tsx`, `components/dreamengin/dream.menu.OutdreamMenu.tsx` |
| `components/dreamengin/engine/types.ts` | ts | 1 | 0 | — | `components/dreamengin/engine/math.ts` |
| `components/dreamnav/dream.DreamNavControls.tsx` | tsx | 0 | 0 | — | — |
| `components/dreamr/dream.CloseFriendsSettings.tsx` | tsx | 0 | 0 | — | — |
| `components/dreams/dream.connectorlayer.tsx` | tsx | 0 | 0 | — | — |
| `components/dreams/dream.featurelayer.tsx` | tsx | 0 | 0 | — | — |
| `components/dreams/dream.outputlayer.tsx` | tsx | 1 | 0 | — | `lib/dreams/profileProjection.ts` |
| `components/dreams/dream.shell.DreamShell.tsx` | tsx | 1 | 0 | — | `components/dreams/dreamsurface.shell.tsx` |
| `components/dreams/dream.shell.SharedDreamShell.tsx` | tsx | 2 | 0 | — | `hooks/useSharedDream.ts`, `lib/sharedDream.ts` |
| `components/dreams/dream.SlideOverPanel.tsx` | tsx | 0 | 0 | — | — |
| `components/dreams/dream.window.JourneyDreamWindow.tsx` | tsx | 1 | 0 | — | `components/daydream/dream.JourneyTrail.tsx` |
| `components/dreams/dreamsurface.window.tsx` | tsx | 2 | 0 | — | `hooks/useTapHoldMove.ts`, `lib/universalEditor.ts` |
| `components/engines/index.ts` | ts | 8 | 0 | — | `components/engines/shared/index.ts`, `components/engines/games/index.ts`, `components/engines/music/index.ts` |
| `components/feeds/dream.widget.EmbedFeedWidget.tsx` | tsx | 1 | 0 | — | `lib/feeds/embedFeedLoader.ts` |
| `components/forge/dream.EngineBuilderCanvas.tsx` | tsx | 2 | 0 | — | `lib/componentInventory.ts`, `lib/forge/engineForge.ts` |
| `components/gameengin/dream.cartridge.FeaturedCartridges.tsx` | tsx | 1 | 0 | — | `lib/gameengin/cartridges/manifest.ts` |
| `components/gameengin/README.md` | doc | 0 | 0 | — | — |
| `components/games/css-modules.d.ts` | ts | 0 | 0 | — | — |
| `components/games/dream.hud.LegacyGameHUD.tsx` | tsx | 1 | 0 | — | `components/games/dream.remote.GameRemote.tsx` |
| `components/games/dream.Leaderboard.tsx` | tsx | 0 | 0 | — | — |
| `components/home/dream.widget.DreamWidget.tsx` | tsx | 1 | 0 | — | `lib/utils.ts` |
| `components/menus/dream.menu.DreamRadialMenu.tsx` | tsx | 1 | 0 | — | `components/menus/dream.panel.MenuPanel.tsx` |
| `components/menus/dream.menu.RadialMenu.tsx` | tsx | 0 | 0 | — | — |
| `components/menus/dream.menu.SystemRadialMenu.tsx` | tsx | 1 | 0 | — | `components/menus/dream.panel.MenuPanel.tsx` |
| `components/onboarding/dream.OnboardingTip.tsx` | tsx | 0 | 0 | — | — |
| `components/optimizer/dream.scene.BabylonOptimizeroScene.tsx` | tsx | 4 | 0 | — | `lib/babylon/createEngine.ts`, `lib/optimizer/babylon-optimizero.ts`, `lib/optimizer/creative-optimizero.ts` |
| `components/panels/dream.panel.FeedPanel.tsx` | tsx | 1 | 0 | — | `components/panels/dream.panel.FeedSettingsPanel.tsx` |
| `components/profile/dream.ProfileCanvas.tsx` | tsx | 3 | 0 | — | `lib/supabase/client.ts`, `components/ui/dream.PlatformBadge.tsx`, `lib/social/platforms.ts` |
| `components/providers/dream.AppSurfaceShell.tsx` | tsx | 10 | 0 | — | `components/providers/dream.ThemeProvider.tsx`, `components/dream.ThemeApplicator.tsx`, `lib/dreamdm/DreamSystemContext.tsx` |
| `components/shaders/index.ts` | ts | 3 | 0 | — | `components/shaders/dream.NeonGlow.tsx`, `components/shaders/dream.LightningWing.tsx`, `components/shaders/dream.Refractor.tsx` |
| `components/three/index.ts` | ts | 1 | 0 | — | `components/three/dream.scene.tsx` |
| `components/ui/dream.IconList.tsx` | tsx | 1 | 0 | — | `components/ui/dream.SheetIcon.tsx` |
| `components/universal-editor/index.ts` | ts | 3 | 0 | — | `components/universal-editor/useTapHoldMove.ts`, `components/universal-editor/dream.UniversalEditorWrapper.tsx`, `components/universal-editor/dream.UniversalEditor.tsx` |
| `components/warp/dream.WarpCanvas.tsx` | tsx | 2 | 0 | — | `lib/warp/useWarp.ts`, `lib/warp/warpEngine.ts` |
| `components/webgpu/neuralPostProcess.ts` | ts | 0 | 0 | — | — |
| `components/widgets/dream.AddDreamCTA.tsx` | tsx | 0 | 0 | — | — |
| `components/widgets/dream.ConfigureSheet.tsx` | tsx | 0 | 0 | — | — |
| `components/widgets/dream.EditModeBanner.tsx` | tsx | 1 | 0 | — | `components/widgets/dream.EditModeProvider.tsx` |
| `components/widgets/dream.widget.PlayMediaWidget.tsx` | tsx | 1 | 0 | — | `components/widgets/dream.widget.WidgetCard.tsx` |
| `components/widgets/dream.widget.WidgetPlaceholder.tsx` | tsx | 0 | 0 | — | — |

</details>

<details><summary>app/ (255 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `app/dreamdmbar/_components/dreamr/algorithms/dreamrAlgorithm.ts` | ts | 1 | 5 | `app/api/dreamr/feed/route.ts`, `app/api/dreamr/suggested/route.ts`, `app/dreamdmbar/_components/dreamr/api/route.ts` | `lib/dreamr/torridityLedger.ts` |
| `app/connectors/dream.ConnectorsClient.tsx` | tsx | 10 | 2 | `app/connectors/page.tsx`, `components/panels/dream.panel.ConnectorsPanel.tsx` | `lib/connectors/connectorRegistry.ts`, `components/connectors/dream.ConnectorRow.tsx`, `components/connectors/dream.widget.ConnectWidgetPrompt.tsx` |
| `app/dreamdmbar/_components/dreamr/dreamsurface.dreamr.tsx` | tsx | 6 | 2 | `app/dreamdmbar/_components/HomeDreamRegion.tsx`, `app/dreamr/page.tsx` | `lib/feed/useLiveFeed.ts`, `lib/dreamr/dreamrfeed.tsx`, `app/dreamdmbar/_components/dreamr/dream.DreamRCore.tsx` |
| `app/dreamdmbar/_components/HomeDreamRegion.tsx` | tsx | 10 | 2 | `components/core/dream.CoreDream.tsx`, `components/runtime/dream.RuntimeView.tsx` | `components/dream.NotificationCenter.tsx`, `components/dream.HomeFeed.tsx`, `components/dream.BrandLogo.tsx` |
| `app/settings/controls/dream.PositionIndicatorToggle.tsx` | tsx | 0 | 2 | `app/settings/controls/dream.ControlsClient.tsx`, `components/panels/dream.panel.ControlsPanel.tsx` | — |
| `app/api/ads/orders/route.ts` | route | 1 | 1 | `tests/platform-utils.test.ts` | `lib/supabase/server.ts` |
| `app/api/auth/providers/route.ts` | route | 1 | 1 | `tests/auth-providers-route.test.ts` | `lib/supabase/config.ts` |
| `app/api/content/generative-fill/route.ts` | route | 1 | 1 | `tests/contentengin-features.test.ts` | `lib/supabase/server.ts` |
| `app/api/content/intelligence/route.ts` | route | 1 | 1 | `tests/content-intelligence-routes.test.ts` | `lib/supabase/server.ts` |
| `app/api/content/transcribe/route.ts` | route | 2 | 1 | `tests/contentengin-features.test.ts` | `lib/supabase/server.ts`, `lib/content/transcriptEditor.ts` |
| `app/api/content/voice-clone/route.ts` | route | 2 | 1 | `tests/contentengin-features.test.ts` | `lib/supabase/server.ts`, `lib/content/voiceClone.ts` |
| `app/api/gal/route.ts` | route | 1 | 1 | `tests/platform-utils.test.ts` | `lib/supabase/server.ts` |
| `app/api/gameengin/crash-report/route.ts` | route | 1 | 1 | `tests/gameengin-loop.test.ts` | `lib/gameengin/brain-reader.ts` |
| `app/api/lab/benchmarks/route.ts` | route | 1 | 1 | `tests/content-intelligence-routes.test.ts` | `lib/supabase/server.ts` |
| `app/daydream/constellation/dream.ConstellationClient.tsx` | tsx | 1 | 1 | `app/daydream/constellation/page.tsx` | `components/daydream/dream.constellationmap.tsx` |
| `app/daydream/games/page.tsx` | route | 12 | 1 | `tests/games-daydream-page-auth.test.ts` | `lib/supabase/server.ts`, `lib/supabase/safeGetUser.ts`, `lib/dev-bypass.ts` |
| `app/dreamdmbar/_components/DreamBarDataBridge.tsx` | tsx | 7 | 1 | `app/dreamdmbar/layout.tsx` | `components/runtime/dream.DualRuntimeContainer.tsx`, `lib/dreamdm/DreamSystemContext.tsx`, `lib/panels/panelTypes.ts` |
| `app/dreamdmbar/_components/dreamr/algorithms/botDetector.ts` | ts | 1 | 1 | `tests/bot-detector.test.ts` | `lib/dreamr/torridityLedger.ts` |
| `app/dreamdmbar/_components/dreamr/dream.DreamRCore.tsx` | tsx | 1 | 1 | `app/dreamdmbar/_components/dreamr/dreamsurface.dreamr.tsx` | `lib/runtime/dualRuntimeBridge.ts` |
| `app/dreamdmbar/_components/dreamr/dream.DreamRFeed.tsx` | tsx | 3 | 1 | `tests/dreamr-feed-topics.test.ts` | `lib/runtime/dualRuntimeBridge.ts`, `lib/botDetection.ts`, `lib/dreamr/dreamrfeed.tsx` |
| `app/dreamdmbar/_components/DreamSpaceRegion.tsx` | tsx | 7 | 1 | `components/dreams/dreamsurface.dreamspace.tsx` | `hooks/useAccount.ts`, `lib/artifactStore.ts`, `lib/runtime/dreamOSBus.ts` |
| `app/dreamdmbar/layout.tsx` | route | 9 | 1 | `tests/homedream-page-auth.test.ts` | `lib/supabase/server.ts`, `lib/supabase/safeGetUser.ts`, `lib/ai/triad.ts` |
| `app/feed-settings/dream.FeedSettingsClient.tsx` | tsx | 0 | 1 | `app/feed-settings/page.tsx` | — |
| `app/settings/account/dream.DangerZoneActions.tsx` | tsx | 0 | 1 | `app/settings/account/page.tsx` | — |
| `app/settings/controls/dream.ControlsClient.tsx` | tsx | 1 | 1 | `app/settings/controls/page.tsx` | `app/settings/controls/dream.PositionIndicatorToggle.tsx` |
| `app/settings/data/dream.DataClient.tsx` | tsx | 0 | 1 | `app/settings/data/page.tsx` | — |
| `app/settings/dreams/dreams-layout-editor.tsx` | tsx | 2 | 1 | `app/settings/dreams/page.tsx` | `hooks/useDreamLayout.ts`, `components/dreams/dream.DraggableDream.tsx` |
| `app/settings/privacy/dream.PrivacyClient.tsx` | tsx | 0 | 1 | `app/settings/privacy/page.tsx` | — |
| `app/(internal)/idari-console/page.tsx` | route | 6 | 0 | — | `lib/supabase/server.ts`, `components/dream.panel.IDariPanel.tsx`, `components/dream.panel.ChildSafetyPanel.tsx` |
| `app/(internal)/idari-console/platform-errors/page.tsx` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/(internal)/idari-console/platform-health/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `components/idari/dream.PlatformHealth.tsx` |
| `app/about/page.tsx` | route | 1 | 0 | — | `components/ui/dream.PlatformBadge.tsx` |
| `app/actions/dream-docs.ts` | ts | 4 | 0 | — | `lib/supabase/server.ts`, `lib/ai/triad.ts`, `lib/dream-docs/embed.ts` |
| `app/ads/create/page.tsx` | route | 1 | 0 | — | `lib/supabase/client.ts` |
| `app/ads/page.tsx` | route | 3 | 0 | — | `lib/supabase/server.ts`, `types/ads.ts`, `components/ui/dream.DreamWord.tsx` |
| `app/ads/slot/[id]/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `types/ads.ts` |
| `app/api/account/delete-data/route.ts` | route | 3 | 0 | — | `lib/api/route.ts`, `lib/supabase/server.ts`, `lib/ai/audit.ts` |
| `app/api/account/delete-dream/route.ts` | route | 4 | 0 | — | `lib/api/route.ts`, `lib/supabase/server.ts`, `lib/ai/audit.ts` |
| `app/api/account/export-data/route.ts` | route | 2 | 0 | — | `lib/api/route.ts`, `lib/supabase/server.ts` |
| `app/api/activity/track/route.ts` | route | 3 | 0 | — | `lib/supabase/server.ts`, `lib/activity/scoring.ts`, `lib/activity/types.ts` |
| `app/api/admin/ai-chat/route.ts` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/ai/groq.ts`, `lib/ai/triad.ts` |
| `app/api/admin/ai-request/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/admin/child-safety/route.ts` | route | 3 | 0 | — | `lib/api/route.ts`, `lib/supabase/server.ts`, `lib/ai/triad.ts` |
| `app/api/admin/code-files/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/admin/lockout.ts` |
| `app/api/admin/observability/route.ts` | route | 7 | 0 | — | `lib/api/route.ts`, `lib/supabase/server.ts`, `lib/ai/triad.ts` |
| `app/api/ads/view/route.ts` | route | 5 | 0 | — | `lib/supabase/server.ts`, `lib/activity/aqs.ts`, `lib/activity/types.ts` |
| `app/api/agent/session/route.ts` | route | 2 | 0 | — | `lib/agentOS.ts`, `lib/agentOS/hostTools.ts` |
| `app/api/ai/boogieman/child-safety/route.ts` | route | 9 | 0 | — | `lib/api/route.ts`, `lib/supabase/server.ts`, `lib/child-safety/childSafetyDetector.ts` |
| `app/api/ai/boogieman/privacy-event/route.ts` | route | 4 | 0 | — | `lib/api/route.ts`, `lib/supabase/server.ts`, `lib/ai/audit.ts` |
| `app/api/ai/boogieman/route.ts` | route | 6 | 0 | — | `lib/api/route.ts`, `lib/supabase/server.ts`, `lib/ai/boogieman.ts` |
| `app/api/ai/boogieman/status/route.ts` | route | 1 | 0 | — | `lib/ai/boogie-policy.ts` |
| `app/api/ai/eams/route.ts` | route | 8 | 0 | — | `lib/api/route.ts`, `lib/supabase/server.ts`, `lib/ai/schemas.ts` |
| `app/api/ai/execute/route.ts` | route | 8 | 0 | — | `lib/api/route.ts`, `lib/supabase/server.ts`, `lib/ai/schemas.ts` |
| `app/api/ai/idari/route.ts` | route | 9 | 0 | — | `lib/api/route.ts`, `lib/supabase/server.ts`, `lib/ai/schemas.ts` |
| `app/api/appeal/route.ts` | route | 5 | 0 | — | `lib/api/route.ts`, `lib/supabase/server.ts`, `lib/ai/schemas.ts` |
| `app/api/auth/logout/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/blocks/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/api/route.ts` |
| `app/api/ci/run/route.ts` | route | 0 | 0 | — | — |
| `app/api/close-friends/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/comments/route.ts` | route | 3 | 0 | — | `lib/supabase/server.ts`, `lib/child-safety/childSafetyDetector.ts`, `lib/child-safety/ncmecReporter.ts` |
| `app/api/connectors/[provider]/connect/route.ts` | route | 8 | 0 | — | `lib/supabase/server.ts`, `lib/connectors/providers/mastodon.ts`, `lib/connectors/providers/bluesky.ts` |
| `app/api/connectors/[provider]/disconnect/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/connectors/[provider]/items/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/connectors/[provider]/sync/route.ts` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/connectors/reconcile.ts`, `lib/connectors/syncDispatch.ts` |
| `app/api/connectors/[provider]/verify/route.ts` | route | 8 | 0 | — | `lib/supabase/server.ts`, `lib/connectors/providers/mastodon.ts`, `lib/connectors/providers/bluesky.ts` |
| `app/api/connectors/cron/route.ts` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/connectors/reconcile.ts`, `lib/connectors/syncDispatch.ts` |
| `app/api/connectors/instagram/oauth/callback/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/connectors/instagram/oauth/start/route.ts` | route | 0 | 0 | — | — |
| `app/api/connectors/status/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/connectors/connectorRegistry.ts` |
| `app/api/connectors/webhooks/[provider]/route.ts` | route | 2 | 0 | — | `lib/connectors/webhookVerification.ts`, `lib/connectors/deliveryStrategy.ts` |
| `app/api/connectors/youtube/oauth/callback/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/connectors/youtube/oauth/start/route.ts` | route | 0 | 0 | — | — |
| `app/api/dr-eams/hf/route.ts` | route | 0 | 0 | — | — |
| `app/api/dr-eams/run/route.ts` | route | 0 | 0 | — | — |
| `app/api/drafts/[id]/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/drafts/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/dream-windows/[id]/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/dream-window/DreamWindowLifecycle.ts` |
| `app/api/dream-windows/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/dream-window/DreamWindowLifecycle.ts` |
| `app/api/dreamengin/os-status/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/dreamr/feed/route.ts` | route | 5 | 0 | — | `lib/supabase/server.ts`, `app/dreamdmbar/_components/dreamr/algorithms/dreamrAlgorithm.ts`, `lib/media/postMedia.ts` |
| `app/api/dreamr/suggested/route.ts` | route | 4 | 0 | — | `lib/supabase/server.ts`, `app/dreamdmbar/_components/dreamr/algorithms/dreamrAlgorithm.ts`, `lib/media/postMedia.ts` |
| `app/api/dreams/feed/route.ts` | route | 3 | 0 | — | `lib/supabase/server.ts`, `lib/widgets/feed-resolver.ts`, `types/widget-system-v2.ts` |
| `app/api/dreams/instances/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `types/widget-system-v2.ts` |
| `app/api/dreams/transfer/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/embed-feed/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/feeds/embedFeedLoader.ts` |
| `app/api/favorites/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/feed/route.ts` | route | 3 | 0 | — | `lib/media/postMedia.ts`, `lib/supabase/server.ts`, `lib/activity/visibility-score.ts` |
| `app/api/follow/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/game-scores/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/health/route.ts` | route | 0 | 0 | — | — |
| `app/api/home-layout/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/journey/route.ts` | route | 2 | 0 | — | `types/supabase.ts`, `lib/supabase/server.ts` |
| `app/api/ledger-media/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/media/ledger.ts` |
| `app/api/likes/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/marketplace/request/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/marketplace/request.ts` |
| `app/api/marketplace/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/messages/boards/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/messages/route.ts` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/child-safety/childSafetyDetector.ts`, `lib/child-safety/scanMediaUrls.ts` |
| `app/api/metrics/platform/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/activity/types.ts` |
| `app/api/metrics/route.ts` | route | 2 | 0 | — | `lib/observability/otel.ts`, `lib/observability/otelBridge.ts` |
| `app/api/metrics/user/[userId]/route.ts` | route | 3 | 0 | — | `lib/supabase/server.ts`, `types/supabase.ts`, `lib/activity/types.ts` |
| `app/api/music/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/notifications/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/platform/errors/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/posts/[id]/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/posts/[id]/save/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/posts/[id]/view/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/posts/profile/[userId]/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/posts/route.ts` | route | 5 | 0 | — | `lib/supabase/server.ts`, `lib/child-safety/childSafetyDetector.ts`, `lib/child-safety/scanMediaUrls.ts` |
| `app/api/profile/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/projects/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/scheduled-posts/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/security/scan/route.ts` | route | 0 | 0 | — | — |
| `app/api/settings/appearance/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/settings/feed/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/settings/notifications/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/settings/privacy/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/setup/check/route.ts` | route | 1 | 0 | — | `lib/setup/checks.ts` |
| `app/api/setup/google-oauth/route.ts` | route | 1 | 0 | — | `lib/supabase/config.ts` |
| `app/api/shellhub/devices/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/connectors/providers/shellhub.ts` |
| `app/api/shop/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/shop/listings.ts` |
| `app/api/skip-credits/balance/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/skip-credits/earn/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/activity/types.ts` |
| `app/api/skip-credits/use/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/activity/types.ts` |
| `app/api/social/rss-feed/route.ts` | route | 2 | 0 | — | `lib/social/rss-feed.ts`, `types/connector.ts` |
| `app/api/upload/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/user/layout/route.ts` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/api/views/track/route.ts` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/activity/types.ts` |
| `app/api/widgets/feed/route.ts` | route | 0 | 0 | — | — |
| `app/api/widgets/instances/route.ts` | route | 0 | 0 | — | — |
| `app/api/youtube/channel/route.ts` | route | 2 | 0 | — | `lib/connectors/providers/youtube.ts`, `types/connector.ts` |
| `app/api/youtube/discovery/route.ts` | route | 2 | 0 | — | `lib/connectors/providers/youtube.ts`, `types/connector.ts` |
| `app/api/youtube/live-feed/route.ts` | route | 2 | 0 | — | `lib/connectors/providers/youtube.ts`, `types/connector.ts` |
| `app/auth/callback/route.ts` | route | 3 | 0 | — | `lib/supabase/server.ts`, `lib/supabase/config.ts`, `lib/auth/nextRedirect.ts` |
| `app/auth/reset-password/page.tsx` | route | 2 | 0 | — | `lib/supabase/client.ts`, `lib/supabase/config.ts` |
| `app/auth/update-password/page.tsx` | route | 2 | 0 | — | `lib/supabase/client.ts`, `components/auth/dream.PasswordField.tsx` |
| `app/connectors/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `app/connectors/dream.ConnectorsClient.tsx` |
| `app/daydream/analytics/page.tsx` | route | 6 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/daydream/dream.shell.DaydreamShell.tsx` |
| `app/daydream/brand/engin/page.tsx` | route | 0 | 0 | — | — |
| `app/daydream/brand/page.tsx` | route | 6 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/daydream/dream.shell.DaydreamShell.tsx` |
| `app/daydream/code/engin/page.tsx` | route | 0 | 0 | — | — |
| `app/daydream/code/page.tsx` | route | 6 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/daydream/dream.shell.DaydreamShell.tsx` |
| `app/daydream/constellation/page.tsx` | route | 3 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `app/daydream/constellation/dream.ConstellationClient.tsx` |
| `app/daydream/create/engin/page.tsx` | route | 0 | 0 | — | — |
| `app/daydream/create/page.tsx` | route | 6 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/daydream/dream.shell.DaydreamShell.tsx` |
| `app/daydream/forge/page.tsx` | route | 7 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/daydream/dream.shell.DaydreamShell.tsx` |
| `app/daydream/game/dream.GamePageClient.tsx` | tsx | 1 | 0 | — | `components/games/dream.BabylonSideScroller.tsx` |
| `app/daydream/game/dream.shell.ImmersiveGameShell.tsx` | tsx | 4 | 0 | — | `components/games/dream.hud.GameHUD.tsx`, `components/games/dream.GamesHub.tsx`, `lib/games/navigation.ts` |
| `app/daydream/game/page.tsx` | route | 0 | 0 | — | — |
| `app/daydream/games/engin/page.tsx` | route | 0 | 0 | — | — |
| `app/daydream/lab/engin/page.tsx` | route | 0 | 0 | — | — |
| `app/daydream/lab/page.tsx` | route | 6 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/daydream/dream.shell.DaydreamShell.tsx` |
| `app/daydream/lab/portfolio/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/daydream/dream.shell.DaydreamShell.tsx` |
| `app/daydream/media-vault/page.tsx` | route | 0 | 0 | — | — |
| `app/daydream/music/engin/page.tsx` | route | 0 | 0 | — | — |
| `app/daydream/music/page.tsx` | route | 6 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/music/dream.SoundRecorder.tsx` |
| `app/daydream/music/upload/page.tsx` | route | 1 | 0 | — | `lib/supabase/client.ts` |
| `app/daydream/play/page.tsx` | route | 1 | 0 | — | `lib/games/navigation.ts` |
| `app/discover/page.tsx` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/dream-effects/page.tsx` | route | 4 | 0 | — | `lib/utils.ts`, `lib/gsap/useGsapEntrance.ts`, `lib/webgpu.ts` |
| `app/dreamdmbar/_components/dreamr/api/route.ts` | route | 5 | 0 | — | `lib/supabase/server.ts`, `app/dreamdmbar/_components/dreamr/algorithms/dreamrAlgorithm.ts`, `lib/media/postMedia.ts` |
| `app/dreamdmbar/_components/DreamWidgetGrid.tsx` | tsx | 1 | 0 | — | `types/widgets.ts` |
| `app/dreamdmbar/dreamspace/page.tsx` | route | 2 | 0 | — | `lib/dreamdm/DreamSystemContext.tsx`, `components/runtime/dream.DualRuntimeContainer.tsx` |
| `app/dreamdmbar/dualruntime/page.tsx` | route | 1 | 0 | — | `lib/dreamdm/DreamSystemContext.tsx` |
| `app/dreamdmbar/homedream/page.tsx` | route | 2 | 0 | — | `lib/dreamdm/DreamSystemContext.tsx`, `components/runtime/dream.DualRuntimeContainer.tsx` |
| `app/dreamdmbar/page.tsx` | route | 0 | 0 | — | — |
| `app/dreamr/page.tsx` | route | 5 | 0 | — | `lib/supabase/server.ts`, `components/ui/dream.AuthenticatedPageHeader.tsx`, `app/dreamdmbar/_components/dreamr/dreamsurface.dreamr.tsx` |
| `app/dreamspace/page.tsx` | route | 1 | 0 | — | `components/dreams/dreamsurface.dreamspace.tsx` |
| `app/edit-profiledream/page.tsx` | route | 4 | 0 | — | `lib/supabase/client.ts`, `components/profile/dream.widget.ProfileWidgetGrid.tsx`, `components/ui/dream.DreamWord.tsx` |
| `app/engines/brand/campaigns/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/brand/identity/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/brand/layout.tsx` | route | 0 | 0 | — | — |
| `app/engines/brand/page.tsx` | route | 3 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/brand/dream.BrandEnginApp.tsx` |
| `app/engines/code/ai/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/code/layout.tsx` | route | 0 | 0 | — | — |
| `app/engines/code/notebook/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/code/page.tsx` | route | 3 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/code/dream.CodeEnginApp.tsx` |
| `app/engines/code/projects/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/create/calendar/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/create/editor/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/create/layout.tsx` | route | 0 | 0 | — | — |
| `app/engines/create/page.tsx` | route | 3 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/create/dream.CreateEnginApp.tsx` |
| `app/engines/create/queue/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/games/builder/page.tsx` | route | 5 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/games/layout.tsx` | route | 0 | 0 | — | — |
| `app/engines/games/library/page.tsx` | route | 5 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/games/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/games/dream.GameEnginApp.tsx` |
| `app/engines/games/scores/page.tsx` | route | 5 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/lab/data/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/lab/experiments/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/lab/layout.tsx` | route | 0 | 0 | — | — |
| `app/engines/lab/page.tsx` | route | 3 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/lab/dream.LabEnginApp.tsx` |
| `app/engines/lab/quantum/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/layout.tsx` | route | 0 | 0 | — | — |
| `app/engines/music/arrange/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/music/layout.tsx` | route | 0 | 0 | — | — |
| `app/engines/music/library/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/music/page.tsx` | route | 3 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/music/dream.MusicEnginApp.tsx` |
| `app/engines/music/studio/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts` |
| `app/engines/portfolio/assets/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/portfolio/layout.tsx` | route | 0 | 0 | — | — |
| `app/engines/portfolio/optimize/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/engines/portfolio/page.tsx` | route | 3 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/portfolio/dream.PortfolioEnginApp.tsx` |
| `app/engines/portfolio/quantum/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `lib/dev-bypass.ts`, `components/engines/shared/index.ts` |
| `app/error.tsx` | tsx | 3 | 0 | — | `lib/supabase/client.ts`, `lib/runtime/isAuthRelatedError.ts`, `components/overlays/dream.RootStatusScreen.tsx` |
| `app/feed-settings/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `app/feed-settings/dream.FeedSettingsClient.tsx` |
| `app/gameengin/cartridges/[id]/page.tsx` | route | 2 | 0 | — | `components/gameengin/dream.cartridge.CartridgeLauncher.tsx`, `lib/gameengin/cartridges/manifest.ts` |
| `app/gameengin/cartridges/page.tsx` | route | 1 | 0 | — | `components/gameengin/dream.cartridge.CartridgeBrowser.tsx` |
| `app/gameengin/page.tsx` | route | 0 | 0 | — | — |
| `app/global-error.tsx` | tsx | 0 | 0 | — | — |
| `app/globals-enhanced.css` | css | 0 | 0 | — | — |
| `app/homedream/page.tsx` | route | 0 | 0 | — | — |
| `app/join/page.tsx` | route | 3 | 0 | — | `lib/supabase/client.ts`, `components/auth/dream.PasswordField.tsx`, `lib/supabase/config.ts` |
| `app/lab/[id]/codespace/page.tsx` | route | 0 | 0 | — | — |
| `app/lab/[id]/page.tsx` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/lab/new/page.tsx` | route | 1 | 0 | — | `lib/supabase/client.ts` |
| `app/lab/page.tsx` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/layout.tsx` | route | 14 | 0 | — | `components/providers/dream.ThemeProvider.tsx`, `components/dream.ThemeApplicator.tsx`, `lib/dreamdm/DreamSystemContext.tsx` |
| `app/loading.tsx` | tsx | 1 | 0 | — | `components/overlays/dream.RootStatusScreen.tsx` |
| `app/login/page.tsx` | route | 4 | 0 | — | `components/auth/dream.PasswordField.tsx`, `lib/supabase/client.ts`, `lib/auth/nextRedirect.ts` |
| `app/marketplace/[id]/page.tsx` | route | 3 | 0 | — | `lib/supabase/server.ts`, `components/ui/dream.DreamWord.tsx`, `components/marketplace/dream.MarketplaceRequestButton.tsx` |
| `app/marketplace/page.tsx` | route | 4 | 0 | — | `lib/supabase/server.ts`, `components/marketplace/dream.MarketplaceListingCard.tsx`, `components/ui/dream.DreamWord.tsx` |
| `app/marketplace/sell/page.tsx` | route | 1 | 0 | — | `lib/supabase/client.ts` |
| `app/messages/boards/[id]/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `components/messaging/dream.BoardComposer.tsx` |
| `app/messages/boards/new/page.tsx` | route | 0 | 0 | — | — |
| `app/messages/boards/page.tsx` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/messages/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `components/dream.MessagesClient.tsx` |
| `app/mission/page.tsx` | route | 0 | 0 | — | — |
| `app/not-found.tsx` | tsx | 1 | 0 | — | `components/overlays/dream.RootStatusScreen.tsx` |
| `app/notes/page.tsx` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/onboarding/page.tsx` | route | 1 | 0 | — | `lib/supabase/server.ts` |
| `app/page.tsx` | route | 0 | 0 | — | — |
| `app/policy/page.tsx` | route | 1 | 0 | — | `lib/ai/boogie-policy.ts` |
| `app/profile/[handle]/page.tsx` | route | 8 | 0 | — | `lib/supabase/server.ts`, `components/activity/dream.ActivityProfile.tsx`, `components/profile/dream.widget.ProfileWidgetGrid.tsx` |
| `app/profile/page.tsx` | route | 0 | 0 | — | — |
| `app/settings/account/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `app/settings/account/dream.DangerZoneActions.tsx` |
| `app/settings/algorithm/page.tsx` | route | 3 | 0 | — | `lib/supabase/server.ts`, `components/feed/dream.AlgorithmEngine.tsx`, `components/ui/dream.AuthenticatedPageHeader.tsx` |
| `app/settings/appearance/page.tsx` | route | 4 | 0 | — | `components/providers/dream.ThemeProvider.tsx`, `lib/ui/theme-engine.ts`, `components/dream.ThemeApplicator.tsx` |
| `app/settings/controls/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `app/settings/controls/dream.ControlsClient.tsx` |
| `app/settings/data/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `app/settings/data/dream.DataClient.tsx` |
| `app/settings/dreams/page.tsx` | route | 2 | 0 | — | `components/ui/dream.AuthenticatedPageHeader.tsx`, `app/settings/dreams/dreams-layout-editor.tsx` |
| `app/settings/feed/page.tsx` | route | 0 | 0 | — | — |
| `app/settings/help/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `components/ui/dream.AuthenticatedPageHeader.tsx` |
| `app/settings/notifications/page.tsx` | route | 1 | 0 | — | `components/ui/dream.AuthenticatedPageHeader.tsx` |
| `app/settings/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `lib/ai/triad.ts` |
| `app/settings/privacy/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `app/settings/privacy/dream.PrivacyClient.tsx` |
| `app/settings/safety/page.tsx` | route | 3 | 0 | — | `lib/supabase/server.ts`, `lib/ai/boogie-policy.ts`, `components/ui/dream.AuthenticatedPageHeader.tsx` |
| `app/settings/security/page.tsx` | route | 3 | 0 | — | `lib/supabase/client.ts`, `components/ui/dream.AuthenticatedPageHeader.tsx`, `lib/supabase/config.ts` |
| `app/settings/widgets/page.tsx` | route | 1 | 0 | — | `components/ui/dream.AuthenticatedPageHeader.tsx` |
| `app/shop/page.tsx` | route | 2 | 0 | — | `lib/supabase/server.ts`, `components/ui/dream.DreamWord.tsx` |
| `app/shop/sell/page.tsx` | route | 1 | 0 | — | `lib/supabase/client.ts` |
| `app/u/[handle]/page.tsx` | route | 0 | 0 | — | — |
| `app/view-profile/page.tsx` | route | 5 | 0 | — | `components/activity/dream.ActivityProfile.tsx`, `lib/supabase/server.ts`, `components/profile/dream.widget.ProfileWidgetGrid.tsx` |
| `app/webgpu/page.tsx` | route | 1 | 0 | — | `components/webgpu/dream.WebGPUShowcase.tsx` |

</details>

<details><summary>tests/ (205 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `tests/activity-first-protocol.test.ts` | ts | 4 | 0 | — | `lib/activity/types.ts`, `lib/activity/scoring.ts`, `lib/activity/aqs.ts` |
| `tests/activity-revenue-split.test.ts` | ts | 1 | 0 | — | `lib/activity/revenueSplit.ts` |
| `tests/admin-lockout.test.ts` | ts | 1 | 0 | — | `lib/admin/lockout.ts` |
| `tests/admin-upgrade-readiness.test.ts` | ts | 3 | 0 | — | `lib/feature-build/index.ts`, `lib/admin/upgrade-readiness.ts`, `lib/setup/checks.ts` |
| `tests/agent-bus-consensus.test.ts` | ts | 2 | 0 | — | `lib/ai/triad.ts`, `lib/agents/agentBus.ts` |
| `tests/ai-edit-engine.test.ts` | ts | 1 | 0 | — | `lib/diff/aiEditEngine.ts` |
| `tests/api-route-body-guard.test.ts` | ts | 0 | 0 | — | — |
| `tests/asset-optimizer.test.ts` | ts | 2 | 0 | — | `lib/assets/assetOptimizer.ts`, `lib/assets/indexedDBStore.ts` |
| `tests/auth-providers-route.test.ts` | ts | 1 | 0 | — | `app/api/auth/providers/route.ts` |
| `tests/auth-update-password-page.test.ts` | ts | 0 | 0 | — | — |
| `tests/authenticated-ui-shells.test.ts` | ts | 0 | 0 | — | — |
| `tests/babylon-optimizero.test.ts` | ts | 2 | 0 | — | `lib/optimizer/babylon-optimizero.ts`, `lib/optimizer/creative-optimizero.ts` |
| `tests/babylon-webgpu-engine.test.ts` | ts | 1 | 0 | — | `lib/babylon/createEngine.ts` |
| `tests/bar-hide-preserves-both-runtimes.test.ts` | ts | 1 | 0 | — | `lib/dreamdm/barInteractions.ts` |
| `tests/boogie-policy-module.test.ts` | ts | 1 | 0 | — | `lib/policy/boogiePolicy.ts` |
| `tests/boogieman.test.ts` | ts | 3 | 0 | — | `lib/ai/boogieman.ts`, `lib/ai/boogie-policy.ts`, `lib/ai/schemas.ts` |
| `tests/bot-detector.test.ts` | ts | 1 | 0 | — | `app/dreamdmbar/_components/dreamr/algorithms/botDetector.ts` |
| `tests/branding-logos.test.ts` | ts | 1 | 0 | — | `lib/branding/logos.ts` |
| `tests/canonical-naming-enforcement.test.ts` | ts | 0 | 0 | — | — |
| `tests/child-safety.test.ts` | ts | 4 | 0 | — | `lib/child-safety/childSafetyDetector.ts`, `lib/child-safety/imageClassifier.ts`, `lib/child-safety/scanMediaUrls.ts` |
| `tests/code-dream-preview.test.ts` | ts | 1 | 0 | — | `lib/code/drEamsCodeAssist.ts` |
| `tests/coercion-table.test.ts` | ts | 1 | 0 | — | `lib/runtime/coercionTable.ts` |
| `tests/collector-extended.test.ts` | ts | 1 | 0 | — | `lib/observability/collector.ts` |
| `tests/compositeengin-features.test.ts` | ts | 5 | 0 | — | `lib/composite/motionCapture.ts`, `lib/composite/compositor.ts`, `lib/composite/rotoscope.ts` |
| `tests/conform-memory-map.test.ts` | ts | 1 | 0 | — | `lib/runtime/memory.ts` |
| `tests/connector-delivery.test.ts` | ts | 2 | 0 | — | `lib/connectors/deliveryStrategy.ts`, `lib/connectors/webhookVerification.ts` |
| `tests/connectors.test.ts` | ts | 3 | 0 | — | `lib/connectors/connectorRegistry.ts`, `lib/connectors/normalise.ts`, `lib/connectors/providers/nostr.ts` |
| `tests/content-intelligence-routes.test.ts` | ts | 2 | 0 | — | `app/api/content/intelligence/route.ts`, `app/api/lab/benchmarks/route.ts` |
| `tests/content-publish-intent.test.ts` | ts | 1 | 0 | — | `lib/content/publishIntent.ts` |
| `tests/contentengin-features.test.ts` | ts | 6 | 0 | — | `lib/content/transcriptEditor.ts`, `lib/content/seoScorer.ts`, `lib/content/voiceClone.ts` |
| `tests/contextual-home.test.ts` | ts | 1 | 0 | — | `lib/home-buttons/contextual-home.ts` |
| `tests/creative-optimizero.test.ts` | ts | 1 | 0 | — | `lib/optimizer/creative-optimizero.ts` |
| `tests/data-transform-extended.test.ts` | ts | 1 | 0 | — | `lib/data-transform.ts` |
| `tests/data-transform.test.ts` | ts | 1 | 0 | — | `lib/data-transform.ts` |
| `tests/daydream-engin-routes.test.ts` | ts | 0 | 0 | — | — |
| `tests/decide-bar-release.test.ts` | ts | 1 | 0 | — | `lib/dreamdm/barInteractions.ts` |
| `tests/dev-bypass.test.ts` | ts | 1 | 0 | — | `lib/dev-bypass.ts` |
| `tests/diff-viewer.test.ts` | ts | 1 | 0 | — | `lib/diff/diffUtils.ts` |
| `tests/dr-eams-code-assist.test.ts` | ts | 1 | 0 | — | `lib/code/drEamsCodeAssist.ts` |
| `tests/dr-eams-search-bar.test.ts` | ts | 1 | 0 | — | `lib/dreamengin/drEamsSearch.ts` |
| `tests/dream-bar-context.test.ts` | ts | 1 | 0 | — | `lib/dreamdm/useDreamBarContext.ts` |
| `tests/dream-continuity-spine.test.ts` | ts | 2 | 0 | — | `lib/intelligence/continuityHelpers.ts`, `lib/forge/forgeRegistry.ts` |
| `tests/dream-effects.test.ts` | ts | 0 | 0 | — | — |
| `tests/dream-os-bus.test.ts` | ts | 2 | 0 | — | `lib/runtime/dualRuntimeBridge.ts`, `lib/runtime/dreamOSBus.ts` |
| `tests/dream-state.test.ts` | ts | 1 | 0 | — | `lib/navigation/dream-state.ts` |
| `tests/dream-window-system.test.ts` | ts | 6 | 0 | — | `lib/dream-window/DreamWindowLifecycle.ts`, `lib/dream-window/connectionVerbs.ts`, `lib/dream-window/runtimeRegion.ts` |
| `tests/dreamdm-bar-intent.test.ts` | ts | 2 | 0 | — | `lib/dreamdm/useDreamBarContext.ts`, `lib/dreamdm/DreamSystemContext.tsx` |
| `tests/dreamdm-bar-interactions.test.ts` | ts | 1 | 0 | — | `lib/dreamdm/barInteractions.ts` |
| `tests/dreamdm-bar-wild.test.ts` | ts | 1 | 0 | — | `lib/dreamdm/barInteractions.ts` |
| `tests/dreamdm-draft.test.ts` | ts | 0 | 0 | — | — |
| `tests/dreamdm-messaging-phase2.test.ts` | ts | 0 | 0 | — | — |
| `tests/dreamengin-os.test.ts` | ts | 2 | 0 | — | `components/dreamengin/dream.DREAMenginOS.tsx`, `lib/babylon/createEngine.ts` |
| `tests/dreamnav.tau.test.ts` | ts | 1 | 0 | — | `lib/dreamnav/tau.ts` |
| `tests/dreamr-algorithm-velocity.test.ts` | ts | 1 | 0 | — | `app/dreamdmbar/_components/dreamr/algorithms/dreamrAlgorithm.ts` |
| `tests/dreamr-algorithm.test.ts` | ts | 1 | 0 | — | `app/dreamdmbar/_components/dreamr/algorithms/dreamrAlgorithm.ts` |
| `tests/dreamr-feed-limits.test.ts` | ts | 0 | 0 | — | — |
| `tests/dreamr-feed-topics.test.ts` | ts | 1 | 0 | — | `app/dreamdmbar/_components/dreamr/dream.DreamRFeed.tsx` |
| `tests/dreamr-page-route.test.ts` | ts | 0 | 0 | — | — |
| `tests/dreamr-swipe-personalization.test.ts` | ts | 1 | 0 | — | `lib/dreamr/swipePersonalization.ts` |
| `tests/dreamr-visibility-cursor.test.ts` | ts | 2 | 0 | — | `lib/dreamr/closeFriendsVisibility.ts`, `lib/dreamr/feedCursor.ts` |
| `tests/dreamspace-panel.test.ts` | ts | 1 | 0 | — | `components/dreams/dreamsurface.dreamspace.tsx` |
| `tests/drop-target-registry.test.ts` | ts | 2 | 0 | — | `lib/runtime/dropTargetRegistry.ts`, `lib/runtime/coercionTable.ts` |
| `tests/dual-runtime-bridge-peer-activity.test.ts` | ts | 1 | 0 | — | `lib/runtime/dualRuntimeBridge.ts` |
| `tests/DUALSENSE_TEST_PLAN.md` | doc | 0 | 0 | — | — |
| `tests/durable-bridge.test.ts` | ts | 1 | 0 | — | `lib/runtime/dualRuntimeBridge.ts` |
| `tests/e2e/demo.spec.ts` | ts | 0 | 0 | — | — |
| `tests/e2e/full-coverage.spec.ts` | ts | 0 | 0 | — | — |
| `tests/edit-profiledream-section7.test.ts` | ts | 0 | 0 | — | — |
| `tests/engin-dispatcher.test.ts` | ts | 2 | 0 | — | `lib/runtime/memory.ts`, `lib/runtime/EnginDispatcher.ts` |
| `tests/engin-runtime-core.test.ts` | ts | 6 | 0 | — | `lib/engin-runtime/EnginBaseState.ts`, `lib/engin-runtime/EnginCapabilities.ts`, `lib/engin-runtime/EnginIOAdapter.ts` |
| `tests/engin-workflow.test.ts` | ts | 1 | 0 | — | `lib/engins/workflowEngine.ts` |
| `tests/enginpipe/manifest.test.ts` | ts | 1 | 0 | — | `lib/enginpipe/artifact/manifest.ts` |
| `tests/enginpipe/telemetry.test.ts` | ts | 2 | 0 | — | `lib/enginpipe/telemetry/events.ts`, `lib/enginpipe/telemetry/client.ts` |
| `tests/enginpipe/tiers.test.ts` | ts | 1 | 0 | — | `lib/enginpipe/quality/tiers.ts` |
| `tests/example.spec.ts` | ts | 0 | 0 | — | — |
| `tests/export-full-code.test.ts` | ts | 0 | 0 | — | — |
| `tests/feature-build.test.ts` | ts | 4 | 0 | — | `lib/feature-build/featureManifest.ts`, `lib/feature-build/buildCycle.ts`, `lib/feature-build/uiQualityCriteria.ts` |
| `tests/forge-build.test.ts` | ts | 1 | 0 | — | `lib/forge/forgeBuild.ts` |
| `tests/forge-engin.test.ts` | ts | 2 | 0 | — | `lib/forge/forgeRegistry.ts`, `lib/forge/forgeIntelligence.ts` |
| `tests/forge-momentum.test.ts` | ts | 2 | 0 | — | `lib/forge/forgeMomentum.ts`, `lib/forge/forgeRegistry.ts` |
| `tests/forge-nexus.test.ts` | ts | 2 | 0 | — | `lib/forge/forgeNexus.ts`, `lib/forge/forgeRegistry.ts` |
| `tests/forge-rituals.test.ts` | ts | 2 | 0 | — | `lib/forge/forgeRituals.ts`, `lib/forge/forgeRegistry.ts` |
| `tests/fusion-cartridges-depth.test.ts` | ts | 0 | 0 | — | — |
| `tests/fusion-cartridges.test.ts` | ts | 2 | 0 | — | `lib/gameengin/cartridges/manifest.ts`, `lib/gameengin/cartridges/loaders.ts` |
| `tests/game-controller.test.ts` | ts | 3 | 0 | — | `lib/games/gameControllerLeft.ts`, `lib/games/gameControllerRight.ts`, `lib/games/gameControllerButtons.ts` |
| `tests/game-engin-ruleset.test.ts` | ts | 2 | 0 | — | `lib/engin-runtime/EnginBaseState.ts`, `lib/engins/game/gameEnginRuleSet.ts` |
| `tests/game-navigation.test.ts` | ts | 4 | 0 | — | `lib/auth/nextRedirect.ts`, `lib/games/library-state.ts`, `lib/games/navigation.ts` |
| `tests/game-performance-baseline.test.ts` | ts | 1 | 0 | — | `lib/games/performance-baseline.ts` |
| `tests/game-quality-plan.test.ts` | ts | 1 | 0 | — | `lib/games/quality-plan.ts` |
| `tests/game-remote-regression.test.ts` | ts | 0 | 0 | — | — |
| `tests/gameengin-architect.test.ts` | ts | 1 | 0 | — | `lib/gameengin/brain-reader.ts` |
| `tests/gameengin-cartridges.test.ts` | ts | 4 | 0 | — | `lib/gameengin/cartridges/manifest.ts`, `lib/gameengin/cartridges/loaders.ts`, `components/games/dream.GamesHub.tsx` |
| `tests/gameengin-crash-modal.test.ts` | ts | 4 | 0 | — | `lib/gameengin/brain-reader.ts`, `components/gameengin/dream.CrashReportModal.tsx`, `components/gameengin/dream.cartridge.CartridgeErrorBoundary.tsx` |
| `tests/gameengin-loop.test.ts` | ts | 2 | 0 | — | `lib/gameengin/brain-reader.ts`, `app/api/gameengin/crash-report/route.ts` |
| `tests/gameengin-power-systems.test.ts` | ts | 1 | 0 | — | `lib/gameengin/power-systems.ts` |
| `tests/gameengin-progression.test.ts` | ts | 1 | 0 | — | `lib/gameengin/brain-reader.ts` |
| `tests/gameengin-remote.test.ts` | ts | 1 | 0 | — | `lib/gameengin/remote/index.ts` |
| `tests/gameengin-spec.test.ts` | ts | 4 | 0 | — | `lib/gameengin/cartridge-manifest.ts`, `lib/gameengin/cartridgeLoader.ts`, `lib/gameengin/brain-reader.ts` |
| `tests/games-daydream-page-auth.test.ts` | ts | 1 | 0 | — | `app/daydream/games/page.tsx` |
| `tests/god-tier-engine.test.ts` | ts | 1 | 0 | — | `lib/god-tier/godTierEngine.ts` |
| `tests/hero-sprite.test.ts` | ts | 1 | 0 | — | `components/dream.HeroSprite.tsx` |
| `tests/home-feed-home.test.ts` | ts | 1 | 0 | — | `lib/dreamdm/barInteractions.ts` |
| `tests/homedream-page-auth.test.ts` | ts | 1 | 0 | — | `app/dreamdmbar/layout.tsx` |
| `tests/icons.test.ts` | ts | 1 | 0 | — | `lib/icons/sheet.ts` |
| `tests/idari-admin-guard.test.ts` | ts | 0 | 0 | — | — |
| `tests/idari-observability-loop.test.ts` | ts | 5 | 0 | — | `lib/observability/collector.ts`, `lib/observability/correlator.ts`, `lib/observability/rootCauseAnalyzer.ts` |
| `tests/idari-patch-plan.test.ts` | ts | 1 | 0 | — | `lib/agents/idari.ts` |
| `tests/instance-manager.test.ts` | ts | 1 | 0 | — | `lib/runtime/instanceManager.ts` |
| `tests/integration-wiring.test.ts` | ts | 1 | 0 | — | `lib/forge/forgeRegistry.ts` |
| `tests/is-auth-related-error.test.ts` | ts | 1 | 0 | — | `lib/runtime/isAuthRelatedError.ts` |
| `tests/journey-insights.test.ts` | ts | 2 | 0 | — | `types/journey.ts`, `lib/journey/journeyInsights.ts` |
| `tests/journey.test.ts` | ts | 1 | 0 | — | `types/journey.ts` |
| `tests/lab-dream-split.test.ts` | ts | 1 | 0 | — | `lib/code/drEamsCodeAssist.ts` |
| `tests/lab-section-12-spec.test.ts` | ts | 0 | 0 | — | — |
| `tests/landing-calibration.test.ts` | ts | 0 | 0 | — | — |
| `tests/landing-mission-link.test.ts` | ts | 0 | 0 | — | — |
| `tests/ledger-media.test.ts` | ts | 1 | 0 | — | `lib/media/ledger.ts` |
| `tests/live-feed.test.ts` | ts | 1 | 0 | — | `lib/feed/useLiveFeed.ts` |
| `tests/madmaxi-authored-levels.test.ts` | ts | 2 | 0 | — | `components/games/madmaxi/index.ts`, `components/games/dream.BabylonSideScroller.tsx` |
| `tests/madmaxi-mechanics.test.ts` | ts | 2 | 0 | — | `components/games/madmaxi/index.ts`, `components/games/dream.BabylonSideScroller.tsx` |
| `tests/mobile-game-controls.test.ts` | ts | 2 | 0 | — | `lib/games/mobileControls.ts`, `lib/games/catalog.ts` |
| `tests/modular-os-stores.test.ts` | ts | 4 | 0 | — | `lib/artifactStore.ts`, `lib/activeModulesStore.ts`, `lib/runtime/dreamOSBus.ts` |
| `tests/module-registry.test.ts` | ts | 0 | 0 | — | — |
| `tests/music-starmaker-section10.test.ts` | ts | 0 | 0 | — | — |
| `tests/namespace-isolation.test.ts` | ts | 0 | 0 | — | — |
| `tests/navigation/manifold-physics.spec.ts` | ts | 0 | 0 | — | — |
| `tests/navigation/navigation.spec.ts` | ts | 0 | 0 | — | — |
| `tests/navigation/quaternion.spec.ts` | ts | 0 | 0 | — | — |
| `tests/neural-seam-flow.test.ts` | ts | 1 | 0 | — | `lib/dreamdm/bridgeSeamFlow.ts` |
| `tests/notifications.test.ts` | ts | 1 | 0 | — | `lib/notifications/notificationHelpers.ts` |
| `tests/offline-queue.test.ts` | ts | 1 | 0 | — | `lib/runtime/offlineQueue.ts` |
| `tests/optimizer.test.ts` | ts | 4 | 0 | — | `lib/optimizer/constraint-solver.ts`, `lib/optimizer/index.ts`, `lib/optimizer/creative-validator.ts` |
| `tests/os-subsystem-manifest.test.ts` | ts | 1 | 0 | — | `lib/dreamengin/osSubsystemManifest.ts` |
| `tests/page-surface-wiring.test.ts` | ts | 0 | 0 | — | — |
| `tests/phase6-privacy-idari.test.ts` | ts | 0 | 0 | — | — |
| `tests/phase7-naming.test.ts` | ts | 1 | 0 | — | `lib/identity/canonical-names.ts` |
| `tests/phase8a.test.ts` | ts | 1 | 0 | — | `lib/ai/triad.ts` |
| `tests/phase8b-dream-windows.test.ts` | ts | 10 | 0 | — | `lib/dream-window/DreamWindowLifecycle.ts`, `lib/dream-window/useDreamWindowActions.ts`, `components/dreams/dream.widget.SuperDreamWidget.tsx` |
| `tests/phase8e-orders.test.ts` | ts | 0 | 0 | — | — |
| `tests/phase8e-shop-marketplace.test.ts` | ts | 3 | 0 | — | `lib/shop/listings.ts`, `lib/marketplace/listings.ts`, `lib/marketplace/request.ts` |
| `tests/phase8f-daydream-activation.test.ts` | ts | 0 | 0 | — | — |
| `tests/phase8f-daydream-network.test.ts` | ts | 0 | 0 | — | — |
| `tests/phase8g-dual-runtime-persistence.test.ts` | ts | 0 | 0 | — | — |
| `tests/phase8h-triad-consensus.test.ts` | ts | 0 | 0 | — | — |
| `tests/phase8i-settings-persistence.test.ts` | ts | 0 | 0 | — | — |
| `tests/phase9-adaptive-quality.test.ts` | ts | 1 | 0 | — | `lib/webgpu/adaptiveQuality.ts` |
| `tests/phase9-cross-post.test.ts` | ts | 2 | 0 | — | `lib/social/crossPost.ts`, `lib/social/platforms.ts` |
| `tests/phase9-drag-drop.test.ts` | ts | 1 | 0 | — | `components/dreamengin/dream.CanvasDropZone.tsx` |
| `tests/phase9-hashtags.test.ts` | ts | 1 | 0 | — | `lib/feed/hashtags.ts` |
| `tests/phase9-notifications.test.ts` | ts | 1 | 0 | — | `lib/notifications/notificationHelpers.ts` |
| `tests/phase9-offline-cache.test.ts` | ts | 1 | 0 | — | `lib/offline/offlineCache.ts` |
| `tests/phase9-scene-state.test.ts` | ts | 1 | 0 | — | `lib/scene/sceneState.ts` |
| `tests/phase9-touch-gestures.test.ts` | ts | 1 | 0 | — | `lib/gestures/touchGestures.ts` |
| `tests/platform-utils.test.ts` | ts | 4 | 0 | — | `lib/platform/lab.ts`, `app/api/ads/orders/route.ts`, `app/api/gal/route.ts` |
| `tests/post-media.test.ts` | ts | 1 | 0 | — | `lib/media/postMedia.ts` |
| `tests/post-view-counting.test.ts` | ts | 0 | 0 | — | — |
| `tests/product-law-principle10-alignment.test.ts` | ts | 0 | 0 | — | — |
| `tests/profile-avatar-edit-entrypoints.test.ts` | ts | 0 | 0 | — | — |
| `tests/rate-limiting.test.ts` | ts | 0 | 0 | — | — |
| `tests/readme-autosync.test.ts` | ts | 1 | 0 | — | `scripts/readme-autosync.ts` |
| `tests/readme-homedream-system.test.ts` | ts | 0 | 0 | — | — |
| `tests/readme-section13-code-codeengin.test.ts` | ts | 0 | 0 | — | — |
| `tests/readme-section6-homedream.test.ts` | ts | 0 | 0 | — | — |
| `tests/report-driven-game-agent.test.ts` | ts | 0 | 0 | — | — |
| `tests/repository-state-analysis-section.test.ts` | ts | 1 | 0 | — | `scripts/repository-state-analysis-section.mjs` |
| `tests/responsive.test.ts` | ts | 1 | 0 | — | `lib/ui/responsive.ts` |
| `tests/rss-feed.test.ts` | ts | 1 | 0 | — | `lib/social/rss-feed.ts` |
| `tests/runtime-channel.test.ts` | ts | 1 | 0 | — | `lib/runtime/runtimeChannel.ts` |
| `tests/runtime-container.test.ts` | ts | 1 | 0 | — | `lib/runtime/runtimeContainer.ts` |
| `tests/runtime-viewport.test.ts` | ts | 1 | 0 | — | `lib/ui/runtimeViewport.ts` |
| `tests/runtime-wiring.test.ts` | ts | 0 | 0 | — | — |
| `tests/safe-get-user.test.ts` | ts | 1 | 0 | — | `lib/supabase/safeGetUser.ts` |
| `tests/seam-clipboard.test.ts` | ts | 3 | 0 | — | `lib/runtime/dualRuntimeBridge.ts`, `lib/runtime/enginWorkflowRegistry.ts`, `lib/runtime/seamClipboard.ts` |
| `tests/session-continuity.test.ts` | ts | 1 | 0 | — | `lib/intelligence/sessionContinuity.ts` |
| `tests/session-pattern-engine.test.ts` | ts | 1 | 0 | — | `lib/intelligence/sessionPatternEngine.ts` |
| `tests/setup-env.ts` | ts | 0 | 0 | — | — |
| `tests/shell-cartridge-wiring.test.ts` | ts | 3 | 0 | — | `lib/gameengin/cartridges/manifest.ts`, `lib/gameengin/registerCartridges.ts`, `lib/runtime/moduleRegistry.ts` |
| `tests/skip-credits.test.ts` | ts | 2 | 0 | — | `lib/activity/skipCredits.ts`, `lib/activity/types.ts` |
| `tests/social-feed.test.ts` | ts | 1 | 0 | — | `lib/social-feed.ts` |
| `tests/social-platforms.test.ts` | ts | 1 | 0 | — | `lib/social/platforms.ts` |
| `tests/spec35-vm-bus-events.test.ts` | ts | 0 | 0 | — | — |
| `tests/spec36-bot-detection.test.ts` | ts | 2 | 0 | — | `lib/bot-detection/index.ts`, `lib/botDetection.ts` |
| `tests/spec37-torridity.test.ts` | ts | 1 | 0 | — | `lib/torridity.ts` |
| `tests/spec38-collaboration.test.ts` | ts | 1 | 0 | — | `lib/collaboration/index.ts` |
| `tests/spec41-engine-builder.test.ts` | ts | 3 | 0 | — | `lib/forge/engineForge.ts`, `lib/componentInventory.ts`, `lib/eventBus.ts` |
| `tests/starmaker-music.test.ts` | ts | 2 | 0 | — | `lib/music/starmaker.ts`, `lib/music/starmakerDaw.ts` |
| `tests/structure-ledger.test.ts` | ts | 2 | 0 | — | `lib/navigation/dream-state.ts`, `lib/navigation/StructureLedger.ts` |
| `tests/supabase-config.test.ts` | ts | 1 | 0 | — | `lib/supabase/config.ts` |
| `tests/swap-manager-extended.test.ts` | ts | 1 | 0 | — | `lib/runtime/swapManager.ts` |
| `tests/swipe-calibration.test.ts` | ts | 1 | 0 | — | `lib/dreamr/swipeCalibration.ts` |
| `tests/tech-foundation.test.ts` | ts | 1 | 0 | — | `lib/supabase/vector.ts` |
| `tests/torridity-ledger.test.ts` | ts | 1 | 0 | — | `lib/dreamr/torridityLedger.ts` |
| `tests/universal-asset-registry.test.ts` | ts | 1 | 0 | — | `components/dream.universal_asset_registry.tsx` |
| `tests/universal-visual-modularity.test.ts` | ts | 0 | 0 | — | — |
| `tests/update-readme-current-status.test.ts` | ts | 1 | 0 | — | `scripts/update-readme-status-utils.mjs` |
| `tests/user-sim.test.ts` | ts | 2 | 0 | — | `types/user-sim.ts`, `lib/user-sim/userSimAgent.ts` |
| `tests/utils-extended.test.ts` | ts | 1 | 0 | — | `lib/utils.ts` |
| `tests/utils-supabase-server.test.ts` | ts | 1 | 0 | — | `utils/supabase/server.ts` |
| `tests/v2-readiness.test.ts` | ts | 1 | 0 | — | `lib/identity/canonical-names.ts` |
| `tests/view-profile-public-view-controls.test.ts` | ts | 0 | 0 | — | — |
| `tests/warp-engine.test.ts` | ts | 1 | 0 | — | `lib/warp/warpEngine.ts` |
| `tests/wasm-gpu-vm.test.ts` | ts | 6 | 0 | — | `lib/vm/types.ts`, `lib/vm/bufferManager.ts`, `lib/vm/pipelineCache.ts` |
| `tests/webgpu-director.test.ts` | ts | 1 | 0 | — | `lib/webgpu/director.ts` |
| `tests/widget-install-flow.test.ts` | ts | 3 | 0 | — | `lib/connectors/installFlow.ts`, `lib/widgets/widgetRegistry.ts`, `lib/connectors/connectorRegistry.ts` |
| `tests/youtube-provider.test.ts` | ts | 1 | 0 | — | `lib/connectors/providers/youtube.ts` |

</details>

<details><summary>scripts/ (44 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `scripts/update-readme-status-utils.mjs` | mjs | 0 | 2 | `scripts/update-readme.mjs`, `tests/update-readme-current-status.test.ts` | — |
| `scripts/gameengin/lib/tar.ts` | ts | 0 | 1 | `tests/gameengin-spec.test.ts` | — |
| `scripts/readme-autosync.ts` | ts | 0 | 1 | `tests/readme-autosync.test.ts` | — |
| `scripts/repository-state-analysis-section.mjs` | mjs | 0 | 1 | `tests/repository-state-analysis-section.test.ts` | — |
| `scripts/analyze-repo-state.mjs` | mjs | 0 | 0 | — | — |
| `scripts/archive/proxy.ts` | ts | 2 | 0 | — | `lib/supabase/server.ts`, `lib/supabase/config.ts` |
| `scripts/archive/validate-deployment.js` | js | 0 | 0 | — | — |
| `scripts/autofix-vercel-build.mjs` | mjs | 0 | 0 | — | — |
| `scripts/check-build-memory-drift.mjs` | mjs | 0 | 0 | — | — |
| `scripts/check-engin-filenames.mjs` | mjs | 0 | 0 | — | — |
| `scripts/check-licenses.mjs` | mjs | 0 | 0 | — | — |
| `scripts/check-root-hygiene.mjs` | mjs | 0 | 0 | — | — |
| `scripts/close-all-open-prs.sh` | file | 0 | 0 | — | — |
| `scripts/deploy.sh` | file | 0 | 0 | — | — |
| `scripts/export-full-code.mjs` | mjs | 0 | 0 | — | — |
| `scripts/feature-build/generate-features.mjs` | mjs | 0 | 0 | — | — |
| `scripts/gameengin/architect-run.ts` | ts | 0 | 0 | — | — |
| `scripts/gameengin/artisan-run.ts` | ts | 0 | 0 | — | — |
| `scripts/gameengin/maestro-analyze.ts` | ts | 0 | 0 | — | — |
| `scripts/gameengin/mechanic-run.ts` | ts | 0 | 0 | — | — |
| `scripts/gameengin/package-cartridge.ts` | ts | 0 | 0 | — | — |
| `scripts/gameengin/prophet-run.ts` | ts | 0 | 0 | — | — |
| `scripts/gameengin/upgrader-run.ts` | ts | 0 | 0 | — | — |
| `scripts/gameengin/writer-run.ts` | ts | 0 | 0 | — | — |
| `scripts/generate-mobile-nextgen-spec.mjs` | mjs | 0 | 0 | — | — |
| `scripts/generate-mobile-ps5-spec.mjs` | mjs | 0 | 0 | — | — |
| `scripts/generate-webapp-final-form.mjs` | mjs | 0 | 0 | — | — |
| `scripts/law-check.sh` | file | 0 | 0 | — | — |
| `scripts/migrate-imports.sh` | file | 0 | 0 | — | — |
| `scripts/optimize-dreamengin.mjs` | mjs | 0 | 0 | — | — |
| `scripts/postbuild.js` | js | 0 | 0 | — | — |
| `scripts/postbuild.ts` | ts | 1 | 0 | — | `lib/adari.ts` |
| `scripts/score-pass.cjs` | cjs | 0 | 0 | — | — |
| `scripts/setup-database.sql` | sql | 0 | 0 | — | — |
| `scripts/spec-check.cjs` | cjs | 0 | 0 | — | — |
| `scripts/sync-build-memory.mjs` | mjs | 0 | 0 | — | — |
| `scripts/ui-ux-agent.py` | python | 0 | 0 | — | — |
| `scripts/update-bugs.mjs` | mjs | 0 | 0 | — | — |
| `scripts/update-embed-feed.mjs` | mjs | 0 | 0 | — | — |
| `scripts/update-handoff.mjs` | mjs | 0 | 0 | — | — |
| `scripts/update-readme.mjs` | mjs | 1 | 0 | — | `scripts/update-readme-status-utils.mjs` |
| `scripts/validate-schema-sync.sh` | file | 0 | 0 | — | — |
| `scripts/vercel-ignore.cjs` | cjs | 0 | 0 | — | — |
| `scripts/vercel-preflight.cjs` | cjs | 0 | 0 | — | — |

</details>

<details><summary>src/ (21 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `src/dream/rulesets/homedream/dream.homedream.constants.ts` | ts | 0 | 3 | `src/dream/rulesets/homedream/dream.homedream.physics.ts`, `src/dream/rulesets/homedream/dream.homedream.transforms.ts`, `src/dream/rulesets/homedream/index.ts` | — |
| `src/core/GameEnginCore.ts` | ts | 2 | 2 | `src/configs/demoGameConfig.ts`, `src/launcher.ts` | `lib/gameengin/core.ts`, `lib/gameengin/gameEnginRuntime.ts` |
| `src/dream/rulesets/homedream/dream.homedream.transforms.ts` | ts | 1 | 2 | `src/dream/rulesets/homedream/index.ts`, `src/dreamsurface/dreamsurface.bridge.ts` | `src/dream/rulesets/homedream/dream.homedream.constants.ts` |
| `src/engin/core/engin.eventbus.ts` | ts | 0 | 2 | `src/dreamsurface/dreamsurface.bridge.ts`, `src/engin/core/index.ts` | — |
| `src/engin/core/engin.ledger.ts` | ts | 0 | 2 | `src/dreamsurface/dreamsurface.bridge.ts`, `src/engin/core/index.ts` | — |
| `src/configs/demoGameConfig.ts` | ts | 1 | 1 | `src/launcher.ts` | `src/core/GameEnginCore.ts` |
| `src/dream/rulesets/homedream/dream.homedream.physics.ts` | ts | 1 | 1 | `src/dream/rulesets/homedream/index.ts` | `src/dream/rulesets/homedream/dream.homedream.constants.ts` |
| `src/dreamsurface/dreamsurface.bridge.ts` | ts | 3 | 1 | `src/dreamsurface/index.ts` | `src/engin/core/engin.ledger.ts`, `src/engin/core/engin.eventbus.ts`, `src/dream/rulesets/homedream/dream.homedream.transforms.ts` |
| `src/dreamsurface/dreamsurface.delta.ts` | ts | 0 | 1 | `src/dreamsurface/index.ts` | — |
| `src/engin/core/engin.auth.ts` | ts | 0 | 1 | `src/engin/core/index.ts` | — |
| `src/engin/core/engin.renderloop.ts` | ts | 0 | 1 | `src/engin/core/index.ts` | — |
| `src/components/dream.DreamEnginLogo.tsx` | tsx | 0 | 0 | — | — |
| `src/components/dream.LogoHero.tsx` | tsx | 0 | 0 | — | — |
| `src/components/dream.Nav.tsx` | tsx | 0 | 0 | — | — |
| `src/dream/rulesets/homedream/index.ts` | ts | 3 | 0 | — | `src/dream/rulesets/homedream/dream.homedream.constants.ts`, `src/dream/rulesets/homedream/dream.homedream.transforms.ts`, `src/dream/rulesets/homedream/dream.homedream.physics.ts` |
| `src/dreamsurface/index.ts` | ts | 2 | 0 | — | `src/dreamsurface/dreamsurface.bridge.ts`, `src/dreamsurface/dreamsurface.delta.ts` |
| `src/engin/core/index.ts` | ts | 4 | 0 | — | `src/engin/core/engin.ledger.ts`, `src/engin/core/engin.eventbus.ts`, `src/engin/core/engin.renderloop.ts` |
| `src/engin/state/base.json` | config | 0 | 0 | — | — |
| `src/launcher.ts` | ts | 2 | 0 | — | `src/core/GameEnginCore.ts`, `src/configs/demoGameConfig.ts` |
| `src/lib/ai/client.ts` | ts | 0 | 0 | — | — |
| `src/lib/babylon/useDreamLogoScene.ts` | ts | 0 | 0 | — | — |

</details>

<details><summary>types/ (18 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `types/connector.ts` | ts | 0 | 30 | `app/api/connectors/[provider]/connect/route.ts`, `app/api/connectors/[provider]/sync/route.ts`, `app/api/connectors/[provider]/verify/route.ts` | — |
| `types/module-manifest.ts` | ts | 0 | 8 | `components/draggable/dream.DraggableModule.tsx`, `lib/gameengin/registerCartridges.ts`, `lib/runtime/dropTargetRegistry.ts` | — |
| `types/ai-system.ts` | ts | 0 | 7 | `lib/ai/boogie-verifier.ts`, `lib/ai/capability-gate.ts`, `lib/ai/confirm-token.ts` | — |
| `types/journey.ts` | ts | 0 | 7 | `components/daydream/dream.JourneyTrail.tsx`, `components/daydream/dream.shell.DaydreamShell.tsx`, `lib/journey/journeyDots.ts` | — |
| `types/dreamArtifact.ts` | ts | 0 | 6 | `app/dreamdmbar/_components/DreamSpaceRegion.tsx`, `components/home/dream.ActiveModuleSurface.tsx`, `lib/activeModulesStore.ts` | — |
| `types/supabase.ts` | ts | 0 | 6 | `app/actions/dream-docs.ts`, `app/api/ai/execute/route.ts`, `app/api/journey/route.ts` | — |
| `types/dream-window.ts` | ts | 1 | 3 | `components/dreams/dream.widget.SuperDreamWidget.tsx`, `lib/dream-window/useDreamWindowActions.ts`, `tests/phase8b-dream-windows.test.ts` | `lib/dream-window/DreamWindowLifecycle.ts` |
| `types/widget-system-v2.ts` | ts | 0 | 3 | `app/api/dreams/feed/route.ts`, `app/api/dreams/instances/route.ts`, `lib/widgets/feed-resolver.ts` | — |
| `types/ads.ts` | ts | 0 | 2 | `app/ads/page.tsx`, `app/ads/slot/[id]/page.tsx` | — |
| `types/ai.ts` | ts | 0 | 2 | `lib/agents/boogieManAI.ts`, `lib/agents/idari.ts` | — |
| `types/spatial.ts` | ts | 0 | 2 | `components/spatial/dream.ProfileSpace.tsx`, `hooks/use-spatial.ts` | — |
| `types/user-sim.ts` | ts | 0 | 2 | `lib/user-sim/userSimAgent.ts`, `tests/user-sim.test.ts` | — |
| `types/widgetConfigs.ts` | ts | 0 | 2 | `lib/widgets/parse.ts`, `lib/widgets/parseConfig.ts` | — |
| `types/widgets.ts` | ts | 0 | 2 | `app/dreamdmbar/_components/DreamWidgetGrid.tsx`, `lib/runtime/moduleRegistry.ts` | — |
| `types/ccc.ts` | ts | 0 | 0 | — | — |
| `types/experience.ts` | ts | 0 | 0 | — | — |
| `types/marketplace.ts` | ts | 0 | 0 | — | — |
| `types/rivet-dev-agent-os.d.ts` | ts | 0 | 0 | — | — |

</details>

<details><summary>engins/ (16 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `engins/engin.BrandingEngin.tsx` | tsx | 12 | 4 | `app/daydream/brand/page.tsx`, `components/daydream/dream.StandaloneEnginSurface.tsx`, `components/engines/brand/dream.BrandEnginApp.tsx` | `lib/runtime/useEnginCoopSync.ts`, `lib/supabase/client.ts`, `lib/daydream/useDaydreamState.ts` |
| `engins/engin.CodeEngin.tsx` | tsx | 15 | 4 | `app/daydream/code/page.tsx`, `components/daydream/dream.StandaloneEnginSurface.tsx`, `components/engines/code/dream.CodeEnginApp.tsx` | `lib/runtime/useEnginCoopSync.ts`, `lib/supabase/client.ts`, `lib/daydream/useDaydreamState.ts` |
| `engins/engin.ContentEngin.tsx` | tsx | 19 | 4 | `app/daydream/create/page.tsx`, `components/daydream/dream.StandaloneEnginSurface.tsx`, `components/engines/create/dream.CreateEnginApp.tsx` | `lib/runtime/useEnginCoopSync.ts`, `lib/supabase/client.ts`, `lib/daydream/useDaydreamPersistence.ts` |
| `engins/engin.GameEngin.tsx` | tsx | 29 | 4 | `app/daydream/games/page.tsx`, `components/daydream/dream.StandaloneEnginSurface.tsx`, `components/engines/games/dream.GameEnginApp.tsx` | `lib/runtime/useEnginCoopSync.ts`, `lib/supabase/client.ts`, `lib/daydream/useDaydreamPersistence.ts` |
| `engins/engin.LabEngin.tsx` | tsx | 12 | 4 | `app/daydream/lab/page.tsx`, `components/daydream/dream.StandaloneEnginSurface.tsx`, `components/engines/lab/dream.LabEnginApp.tsx` | `lib/runtime/useEnginCoopSync.ts`, `lib/supabase/client.ts`, `lib/daydream/useDaydreamPersistence.ts` |
| `engins/engin.StarMakerEngin.tsx` | tsx | 24 | 4 | `app/daydream/music/page.tsx`, `components/daydream/dream.StandaloneEnginSurface.tsx`, `components/engines/music/dream.MusicEnginApp.tsx` | `lib/runtime/useEnginCoopSync.ts`, `lib/supabase/client.ts`, `lib/supabase/config.ts` |
| `engins/dream.QuantumCircuitCanvas.tsx` | tsx | 0 | 3 | `components/engines/portfolio/panels/dream.panel.OptimizePanel.tsx`, `engins/engin.LabEngin.tsx`, `engins/portfolio/dream.PortfolioEngin.tsx` | — |
| `engins/autoopen/dream.AutoOpenGameEngin.tsx` | tsx | 2 | 2 | `app/daydream/games/page.tsx`, `daydreams/games/page.tsx` | `lib/runtime/useSharedEnginChannel.ts`, `lib/runtime/instanceManager.ts` |
| `engins/CodeEngin/modules/ai-co-pilot/dream.panel.AgentPanel.tsx` | tsx | 1 | 2 | `engins/CodeEngin/modules/ai-co-pilot/index.ts`, `engins/CodeEngin/orchestrator/dream.index.tsx` | `engins/CodeEngin/modules/ai-co-pilot/useAgentSession.ts` |
| `engins/CodeEngin/modules/ai-co-pilot/useAgentSession.ts` | ts | 0 | 2 | `engins/CodeEngin/modules/ai-co-pilot/dream.panel.AgentPanel.tsx`, `engins/CodeEngin/modules/ai-co-pilot/index.ts` | — |
| `engins/dream.ForgeEngin.tsx` | tsx | 10 | 2 | `app/daydream/forge/page.tsx`, `components/daydream/dream.StandaloneEnginSurface.tsx` | `components/dream.BrandLogo.tsx`, `components/forge/dream.panel.AIBuilderPanel.tsx`, `lib/runtime/dualRuntimeBridge.ts` |
| `engins/portfolio/dream.PortfolioEngin.tsx` | tsx | 5 | 2 | `app/daydream/lab/portfolio/page.tsx`, `components/engines/portfolio/dream.PortfolioEnginApp.tsx` | `engins/dream.QuantumCircuitCanvas.tsx`, `lib/forge/useForgeActivity.ts`, `lib/forge/forgeIntelligence.ts` |
| `engins/CodeEngin/modules/ai-co-pilot/index.ts` | ts | 2 | 1 | `engins/engin.CodeEngin.tsx` | `engins/CodeEngin/modules/ai-co-pilot/dream.panel.AgentPanel.tsx`, `engins/CodeEngin/modules/ai-co-pilot/useAgentSession.ts` |
| `engins/dream.panel.AnalyticsEngin.tsx` | tsx | 8 | 1 | `app/daydream/analytics/page.tsx` | `lib/runtime/useEnginCoopSync.ts`, `lib/supabase/client.ts`, `lib/daydream/useDaydreamPersistence.ts` |
| `engins/CodeEngin/core/parser.ts` | ts | 0 | 0 | — | — |
| `engins/CodeEngin/orchestrator/dream.index.tsx` | tsx | 2 | 0 | — | `engins/CodeEngin/modules/ai-co-pilot/dream.panel.AgentPanel.tsx`, `lib/enginpipe/index.ts` |

</details>

<details><summary>hooks/ (9 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `hooks/useSharedDream.ts` | ts | 3 | 4 | `components/dreams/dream.shell.SharedDreamShell.tsx`, `engins/engin.BrandingEngin.tsx`, `engins/engin.CodeEngin.tsx` | `lib/supabase/client.ts`, `lib/sharedDream.ts`, `lib/collaboration/index.ts` |
| `hooks/useDreamLayout.ts` | ts | 0 | 2 | `app/settings/dreams/dreams-layout-editor.tsx`, `components/home/dream.bar.PersistentDreamBar.tsx` | — |
| `hooks/use-spatial.ts` | ts | 2 | 1 | `components/spatial/dream.ProfileSpace.tsx` | `lib/supabase/client.ts`, `types/spatial.ts` |
| `hooks/useAccount.ts` | ts | 1 | 1 | `app/dreamdmbar/_components/DreamSpaceRegion.tsx` | `lib/supabase/client.ts` |
| `hooks/useConnectorInstallFlow.ts` | ts | 3 | 1 | `app/connectors/dream.ConnectorsClient.tsx` | `lib/widgets/widgetRegistry.ts`, `lib/connectors/connectorRegistry.ts`, `lib/connectors/installFlow.ts` |
| `hooks/useTapHoldMove.ts` | ts | 1 | 1 | `components/dreams/dreamsurface.window.tsx` | `lib/universalEditor.ts` |
| `hooks/useHideOnScroll.ts` | ts | 0 | 0 | — | — |
| `hooks/useTick.ts` | ts | 0 | 0 | — | — |
| `hooks/useViewCounter.ts` | ts | 0 | 0 | — | — |

</details>

<details><summary>agents/ (8 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `agents/.gitkeep` | file | 0 | 0 | — | — |
| `agents/humanAI.persona.md` | doc | 0 | 0 | — | — |
| `agents/humanAI/orchestrator.md` | doc | 0 | 0 | — | — |
| `agents/humanAI/personas/accessibility.md` | doc | 0 | 0 | — | — |
| `agents/humanAI/personas/creator.md` | doc | 0 | 0 | — | — |
| `agents/humanAI/personas/ios-first.md` | doc | 0 | 0 | — | — |
| `agents/humanAI/personas/power-user.md` | doc | 0 | 0 | — | — |
| `agents/humanAI/personas/social-explorer.md` | doc | 0 | 0 | — | — |

</details>

<details><summary>daydreams/ (6 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `daydreams/brand/page.tsx` | tsx | 5 | 0 | — | `lib/supabase/server.ts`, `components/daydream/dream.shell.DaydreamShell.tsx`, `engins/engin.BrandingEngin.tsx` |
| `daydreams/code/page.tsx` | tsx | 5 | 0 | — | `lib/supabase/server.ts`, `components/daydream/dream.shell.DaydreamShell.tsx`, `engins/engin.CodeEngin.tsx` |
| `daydreams/create/page.tsx` | tsx | 5 | 0 | — | `lib/supabase/server.ts`, `components/daydream/dream.shell.DaydreamShell.tsx`, `engins/engin.ContentEngin.tsx` |
| `daydreams/games/page.tsx` | tsx | 11 | 0 | — | `lib/supabase/server.ts`, `lib/supabase/safeGetUser.ts`, `components/games/dream.GamesHub.tsx` |
| `daydreams/lab/page.tsx` | tsx | 5 | 0 | — | `lib/supabase/server.ts`, `components/daydream/dream.shell.DaydreamShell.tsx`, `engins/engin.LabEngin.tsx` |
| `daydreams/music/page.tsx` | tsx | 6 | 0 | — | `lib/supabase/server.ts`, `components/music/dream.SoundRecorder.tsx`, `components/daydream/dream.shell.DaydreamShell.tsx` |

</details>

<details><summary>assembly/ (3 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `assembly/bus.ts` | ts | 0 | 0 | — | — |
| `assembly/index.ts` | ts | 0 | 0 | — | — |
| `assembly/mad-maxi-player.ts` | ts | 0 | 0 | — | — |

</details>

<details><summary>coresurfaces/ (2 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `coresurfaces/dreamsurface.EditProfileDream.tsx` | tsx | 3 | 0 | — | `lib/supabase/client.ts`, `components/profile/dream.widget.ProfileWidgetGrid.tsx`, `components/ui/dream.DreamWord.tsx` |
| `coresurfaces/dreamsurface.ViewProfile.tsx` | tsx | 4 | 0 | — | `lib/supabase/server.ts`, `components/profile/dream.widget.ProfileWidgetGrid.tsx`, `components/dream.ProfileShareButton.tsx` |

</details>

<details><summary>dr-eams/ (2 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `dr-eams/capabilities.yaml` | config | 0 | 0 | — | — |
| `dr-eams/tools.ts` | ts | 0 | 0 | — | — |

</details>

<details><summary>dreamdmbar/ (2 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `dreamdmbar/dream.GlowingLight.tsx` | tsx | 0 | 1 | `dreamdmbar/dreamsurface.dreamdmbar.tsx` | — |
| `dreamdmbar/dreamsurface.dreamdmbar.tsx` | tsx | 16 | 1 | `components/home/dream.bar.PersistentDreamBar.tsx` | `lib/utils.ts`, `lib/dreamdm/useDreamDMMessages.ts`, `lib/dreamdm/useDreamDMDraft.ts` |

</details>

<details><summary>core/ (1 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `core/.gitkeep` | file | 0 | 0 | — | — |

</details>

<details><summary>utils/ (1 files)</summary>

| File | Type | Imports | Imported By | Top Importers | Top Imports |
|---|---|---|---|---|---|
| `utils/supabase/server.ts` | ts | 1 | 1 | `tests/utils-supabase-server.test.ts` | `lib/supabase/server.ts` |

</details>


#### File-Level Graphs by Folder

<details><summary>core/ — 1 files</summary>

```mermaid
graph LR
  f_core__gitkeep[".gitkeep"]
```

</details>

<details><summary>utils/ — 1 files</summary>

```mermaid
graph LR
  f_utils_supabase_server_ts["server.ts"]
  f_lib_supabase_server_ts["server.ts"]
  f_utils_supabase_server_ts --> f_lib_supabase_server_ts
```

</details>

<details><summary>coresurfaces/ — 2 files</summary>

```mermaid
graph LR
  f_coresurfaces_dreamsurface_EditProfileDream_tsx["dreamsurface.EditProfileDream.tsx"]
  f_lib_supabase_client_ts["client.ts"]
  f_components_profile_dream_widget_ProfileWidgetGrid_tsx["dream.widget.ProfileWidgetGrid.tsx"]
  f_components_ui_dream_DreamWord_tsx["dream.DreamWord.tsx"]
  f_coresurfaces_dreamsurface_ViewProfile_tsx["dreamsurface.ViewProfile.tsx"]
  f_lib_supabase_server_ts["server.ts"]
  f_components_dream_ProfileShareButton_tsx["dream.ProfileShareButton.tsx"]
  f_coresurfaces_dreamsurface_EditProfileDream_tsx --> f_lib_supabase_client_ts
  f_coresurfaces_dreamsurface_EditProfileDream_tsx --> f_components_profile_dream_widget_ProfileWidgetGrid_tsx
  f_coresurfaces_dreamsurface_EditProfileDream_tsx --> f_components_ui_dream_DreamWord_tsx
  f_coresurfaces_dreamsurface_ViewProfile_tsx --> f_lib_supabase_server_ts
  f_coresurfaces_dreamsurface_ViewProfile_tsx --> f_components_profile_dream_widget_ProfileWidgetGrid_tsx
  f_coresurfaces_dreamsurface_ViewProfile_tsx --> f_components_dream_ProfileShareButton_tsx
  f_coresurfaces_dreamsurface_ViewProfile_tsx --> f_components_ui_dream_DreamWord_tsx
```

</details>

<details><summary>dr-eams/ — 2 files</summary>

```mermaid
graph LR
  f_dr_eams_capabilities_yaml["capabilities.yaml"]
  f_dr_eams_tools_ts["tools.ts"]
```

</details>

<details><summary>dreamdmbar/ — 2 files</summary>

```mermaid
graph LR
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx["dreamsurface.dreamdmbar.tsx"]
  f_lib_utils_ts["utils.ts"]
  f_lib_dreamdm_useDreamDMMessages_ts["useDreamDMMessages.ts"]
  f_lib_dreamdm_useDreamDMDraft_ts["useDreamDMDraft.ts"]
  f_lib_dreamdm_useDreamSearch_ts["useDreamSearch.ts"]
  f_lib_dreamdm_useMessagingCore_ts["useMessagingCore.ts"]
  f_lib_media_ledger_ts["ledger.ts"]
  f_lib_dreamdm_useNotifications_ts["useNotifications.ts"]
  f_lib_dreamdm_useDreamDMConversations_ts["useDreamDMConversations.ts"]
  f_lib_dreamdm_barInteractions_ts["barInteractions.ts"]
  f_lib_dreamdm_useDreamBarContext_ts["useDreamBarContext.ts"]
  f_lib_dreamdm_DreamSystemContext_tsx["DreamSystemContext.tsx"]
  f_components_ui_dream_DreamWord_tsx["dream.DreamWord.tsx"]
  f_lib_ui_runtimeViewport_ts["runtimeViewport.ts"]
  f_lib_games_useImmersiveGameLayout_ts["useImmersiveGameLayout.ts"]
  f_dreamdmbar_dream_GlowingLight_tsx["dream.GlowingLight.tsx"]
  f_lib_supabase_client_ts["client.ts"]
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_utils_ts
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_dreamdm_useDreamDMMessages_ts
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_dreamdm_useDreamDMDraft_ts
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_dreamdm_useDreamSearch_ts
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_dreamdm_useMessagingCore_ts
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_media_ledger_ts
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_dreamdm_useNotifications_ts
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_dreamdm_useDreamDMConversations_ts
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_dreamdm_barInteractions_ts
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_dreamdm_useDreamBarContext_ts
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_dreamdm_DreamSystemContext_tsx
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_components_ui_dream_DreamWord_tsx
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_ui_runtimeViewport_ts
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_games_useImmersiveGameLayout_ts
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_dreamdmbar_dream_GlowingLight_tsx
  f_dreamdmbar_dreamsurface_dreamdmbar_tsx --> f_lib_supabase_client_ts
```

</details>

<details><summary>assembly/ — 3 files</summary>

```mermaid
graph LR
  f_assembly_bus_ts["bus.ts"]
  f_assembly_index_ts["index.ts"]
  f_assembly_mad_maxi_player_ts["mad-maxi-player.ts"]
```

</details>

<details><summary>daydreams/ — 6 files</summary>

```mermaid
graph LR
  f_daydreams_brand_page_tsx["page.tsx"]
  f_lib_supabase_server_ts["server.ts"]
  f_components_daydream_dream_shell_DaydreamShell_tsx["dream.shell.DaydreamShell.tsx"]
  f_engins_engin_BrandingEngin_tsx["engin.BrandingEngin.tsx"]
  f_components_daydream_dreamsurface_daydream_BrandDaydream_tsx["dreamsurface.daydream.BrandDaydream.tsx"]
  f_components_ui_dream_AuthenticatedPageHeader_tsx["dream.AuthenticatedPageHeader.tsx"]
  f_daydreams_code_page_tsx["page.tsx"]
  f_engins_engin_CodeEngin_tsx["engin.CodeEngin.tsx"]
  f_components_daydream_dream_OpenDaydreamSideBButton_tsx["dream.OpenDaydreamSideBButton.tsx"]
  f_daydreams_create_page_tsx["page.tsx"]
  f_engins_engin_ContentEngin_tsx["engin.ContentEngin.tsx"]
  f_daydreams_games_page_tsx["page.tsx"]
  f_lib_supabase_safeGetUser_ts["safeGetUser.ts"]
  f_components_games_dream_GamesHub_tsx["dream.GamesHub.tsx"]
  f_engins_autoopen_dream_AutoOpenGameEngin_tsx["dream.AutoOpenGameEngin.tsx"]
  f_lib_games_quality_plan_ts["quality-plan.ts"]
  f_lib_games_navigation_ts["navigation.ts"]
  f_lib_dev_bypass_ts["dev-bypass.ts"]
  f_engins_engin_GameEngin_tsx["engin.GameEngin.tsx"]
  f_daydreams_lab_page_tsx["page.tsx"]
  f_engins_engin_LabEngin_tsx["engin.LabEngin.tsx"]
  f_daydreams_music_page_tsx["page.tsx"]
  f_components_music_dream_SoundRecorder_tsx["dream.SoundRecorder.tsx"]
  f_engins_engin_StarMakerEngin_tsx["engin.StarMakerEngin.tsx"]
  f_daydreams_brand_page_tsx --> f_lib_supabase_server_ts
  f_daydreams_brand_page_tsx --> f_components_daydream_dream_shell_DaydreamShell_tsx
  f_daydreams_brand_page_tsx --> f_engins_engin_BrandingEngin_tsx
  f_daydreams_brand_page_tsx --> f_components_daydream_dreamsurface_daydream_BrandDaydream_tsx
  f_daydreams_brand_page_tsx --> f_components_ui_dream_AuthenticatedPageHeader_tsx
  f_daydreams_code_page_tsx --> f_lib_supabase_server_ts
  f_daydreams_code_page_tsx --> f_components_daydream_dream_shell_DaydreamShell_tsx
  f_daydreams_code_page_tsx --> f_engins_engin_CodeEngin_tsx
  f_daydreams_code_page_tsx --> f_components_daydream_dream_OpenDaydreamSideBButton_tsx
  f_daydreams_code_page_tsx --> f_components_ui_dream_AuthenticatedPageHeader_tsx
  f_daydreams_create_page_tsx --> f_lib_supabase_server_ts
  f_daydreams_create_page_tsx --> f_components_daydream_dream_shell_DaydreamShell_tsx
  f_daydreams_create_page_tsx --> f_engins_engin_ContentEngin_tsx
  f_daydreams_create_page_tsx --> f_components_daydream_dream_OpenDaydreamSideBButton_tsx
  f_daydreams_create_page_tsx --> f_components_ui_dream_AuthenticatedPageHeader_tsx
  f_daydreams_games_page_tsx --> f_lib_supabase_server_ts
  f_daydreams_games_page_tsx --> f_lib_supabase_safeGetUser_ts
  f_daydreams_games_page_tsx --> f_components_games_dream_GamesHub_tsx
  f_daydreams_games_page_tsx --> f_components_daydream_dream_shell_DaydreamShell_tsx
  f_daydreams_games_page_tsx --> f_components_daydream_dream_OpenDaydreamSideBButton_tsx
  f_daydreams_games_page_tsx --> f_engins_autoopen_dream_AutoOpenGameEngin_tsx
  f_daydreams_games_page_tsx --> f_components_ui_dream_AuthenticatedPageHeader_tsx
  f_daydreams_games_page_tsx --> f_lib_games_quality_plan_ts
  f_daydreams_games_page_tsx --> f_lib_games_navigation_ts
  f_daydreams_games_page_tsx --> f_lib_dev_bypass_ts
  f_daydreams_games_page_tsx --> f_engins_engin_GameEngin_tsx
  f_daydreams_lab_page_tsx --> f_lib_supabase_server_ts
  f_daydreams_lab_page_tsx --> f_components_daydream_dream_shell_DaydreamShell_tsx
  f_daydreams_lab_page_tsx --> f_engins_engin_LabEngin_tsx
  f_daydreams_lab_page_tsx --> f_components_daydream_dream_OpenDaydreamSideBButton_tsx
  f_daydreams_lab_page_tsx --> f_components_ui_dream_AuthenticatedPageHeader_tsx
  f_daydreams_music_page_tsx --> f_lib_supabase_server_ts
  f_daydreams_music_page_tsx --> f_components_music_dream_SoundRecorder_tsx
  f_daydreams_music_page_tsx --> f_components_daydream_dream_shell_DaydreamShell_tsx
  f_daydreams_music_page_tsx --> f_engins_engin_StarMakerEngin_tsx
  f_daydreams_music_page_tsx --> f_components_ui_dream_AuthenticatedPageHeader_tsx
  f_daydreams_music_page_tsx --> f_lib_dev_bypass_ts
```

</details>

<details><summary>agents/ — 8 files</summary>

```mermaid
graph LR
  f_agents__gitkeep[".gitkeep"]
  f_agents_humanAI_persona_md["humanAI.persona.md"]
  f_agents_humanAI_orchestrator_md["orchestrator.md"]
  f_agents_humanAI_personas_accessibility_md["accessibility.md"]
  f_agents_humanAI_personas_creator_md["creator.md"]
  f_agents_humanAI_personas_ios_first_md["ios-first.md"]
  f_agents_humanAI_personas_power_user_md["power-user.md"]
  f_agents_humanAI_personas_social_explorer_md["social-explorer.md"]
```

</details>

<details><summary>hooks/ — 9 files</summary>

```mermaid
graph LR
  f_hooks_use_spatial_ts["use-spatial.ts"]
  f_lib_supabase_client_ts["client.ts"]
  f_types_spatial_ts["spatial.ts"]
  f_hooks_useAccount_ts["useAccount.ts"]
  f_hooks_useConnectorInstallFlow_ts["useConnectorInstallFlow.ts"]
  f_lib_widgets_widgetRegistry_ts["widgetRegistry.ts"]
  f_lib_connectors_connectorRegistry_ts["connectorRegistry.ts"]
  f_lib_connectors_installFlow_ts["installFlow.ts"]
  f_hooks_useSharedDream_ts["useSharedDream.ts"]
  f_lib_sharedDream_ts["sharedDream.ts"]
  f_lib_collaboration_index_ts["index.ts"]
  f_hooks_useTapHoldMove_ts["useTapHoldMove.ts"]
  f_lib_universalEditor_ts["universalEditor.ts"]
  f_hooks_useDreamLayout_ts["useDreamLayout.ts"]
  f_hooks_useHideOnScroll_ts["useHideOnScroll.ts"]
  f_hooks_useTick_ts["useTick.ts"]
  f_hooks_useViewCounter_ts["useViewCounter.ts"]
  f_hooks_use_spatial_ts --> f_lib_supabase_client_ts
  f_hooks_use_spatial_ts --> f_types_spatial_ts
  f_hooks_useAccount_ts --> f_lib_supabase_client_ts
  f_hooks_useConnectorInstallFlow_ts --> f_lib_widgets_widgetRegistry_ts
  f_hooks_useConnectorInstallFlow_ts --> f_lib_connectors_connectorRegistry_ts
  f_hooks_useConnectorInstallFlow_ts --> f_lib_connectors_installFlow_ts
  f_hooks_useSharedDream_ts --> f_lib_supabase_client_ts
  f_hooks_useSharedDream_ts --> f_lib_sharedDream_ts
  f_hooks_useSharedDream_ts --> f_lib_collaboration_index_ts
  f_hooks_useTapHoldMove_ts --> f_lib_universalEditor_ts
```

</details>

<details><summary>engins/ — 16 files</summary>

```mermaid
graph LR
  f_engins_CodeEngin_modules_ai_co_pilot_dream_panel_AgentPanel_tsx["dream.panel.AgentPanel.tsx"]
  f_engins_CodeEngin_modules_ai_co_pilot_useAgentSession_ts["useAgentSession.ts"]
  f_engins_CodeEngin_modules_ai_co_pilot_index_ts["index.ts"]
  f_engins_CodeEngin_orchestrator_dream_index_tsx["dream.index.tsx"]
  f_lib_enginpipe_index_ts["index.ts"]
  f_engins_autoopen_dream_AutoOpenGameEngin_tsx["dream.AutoOpenGameEngin.tsx"]
  f_lib_runtime_useSharedEnginChannel_ts["useSharedEnginChannel.ts"]
  f_lib_runtime_instanceManager_ts["instanceManager.ts"]
  f_engins_dream_ForgeEngin_tsx["dream.ForgeEngin.tsx"]
  f_components_dream_BrandLogo_tsx["dream.BrandLogo.tsx"]
  f_components_forge_dream_panel_AIBuilderPanel_tsx["dream.panel.AIBuilderPanel.tsx"]
  f_lib_runtime_dualRuntimeBridge_ts["dualRuntimeBridge.ts"]
  f_lib_forge_useForgeActivity_ts["useForgeActivity.ts"]
  f_components_daydream_dream_JourneyTrail_tsx["dream.JourneyTrail.tsx"]
  f_lib_forge_forgeRegistry_ts["forgeRegistry.ts"]
  f_lib_forge_forgeIntelligence_ts["forgeIntelligence.ts"]
  f_lib_forge_forgeMomentum_ts["forgeMomentum.ts"]
  f_lib_forge_forgeNexus_ts["forgeNexus.ts"]
  f_lib_forge_forgeRituals_ts["forgeRituals.ts"]
  f_engins_dream_panel_AnalyticsEngin_tsx["dream.panel.AnalyticsEngin.tsx"]
  f_lib_runtime_useEnginCoopSync_ts["useEnginCoopSync.ts"]
  f_lib_supabase_client_ts["client.ts"]
  f_lib_daydream_useDaydreamPersistence_ts["useDaydreamPersistence.ts"]
  f_components_dreamengin_dream_panel_CrossEnginStatusPanel_tsx["dream.panel.CrossEnginStatusPanel.tsx"]
  f_components_activity_dream_ActivityProfile_tsx["dream.ActivityProfile.tsx"]
  f_lib_activity_types_ts["types.ts"]
  f_engins_engin_BrandingEngin_tsx["engin.BrandingEngin.tsx"]
  f_lib_daydream_useDaydreamState_ts["useDaydreamState.ts"]
  f_lib_dreamenginOS_index_ts["index.ts"]
  f_hooks_useSharedDream_ts["useSharedDream.ts"]
  f_lib_runtime_useEnginBridge_ts["useEnginBridge.ts"]
  f_engins_engin_CodeEngin_tsx["engin.CodeEngin.tsx"]
  f_components_daydream_dream_DiffViewer_tsx["dream.DiffViewer.tsx"]
  f_lib_diff_aiEditEngine_ts["aiEditEngine.ts"]
  f_engins_engin_ContentEngin_tsx["engin.ContentEngin.tsx"]
  f_lib_content_transcriptEditor_ts["transcriptEditor.ts"]
  f_lib_content_publishIntent_ts["publishIntent.ts"]
  f_lib_content_seoScorer_ts["seoScorer.ts"]
  f_lib_composite_motionCapture_ts["motionCapture.ts"]
  f_lib_composite_compositor_ts["compositor.ts"]
  f_lib_composite_rotoscope_ts["rotoscope.ts"]
  f_lib_composite_matchmover_ts["matchmover.ts"]
  f_lib_composite_fxSimulation_ts["fxSimulation.ts"]
  f_components_activity_dream_ActivityPostForm_tsx["dream.ActivityPostForm.tsx"]
  f_engins_engin_GameEngin_tsx["engin.GameEngin.tsx"]
  f_components_games_dream_hud_GameHUD_tsx["dream.hud.GameHUD.tsx"]
  f_components_games_dream_GamesHub_tsx["dream.GamesHub.tsx"]
  f_lib_games_library_state_ts["library-state.ts"]
  f_lib_games_useGamepad_ts["useGamepad.ts"]
  f_lib_games_navigation_ts["navigation.ts"]
  f_lib_games_avatar_ts["avatar.ts"]
  f_lib_games_useGameInputKeyboardBridge_ts["useGameInputKeyboardBridge.ts"]
  f_lib_games_useRemoteChannel_ts["useRemoteChannel.ts"]
  f_lib_games_quality_plan_ts["quality-plan.ts"]
  f_lib_media_ledger_ts["ledger.ts"]
  f_lib_gameengin_GameRuntime_tsx["GameRuntime.tsx"]
  f_lib_gameengin_cartridge_ts["cartridge.ts"]
  f_lib_gameengin_cartridges_loaders_ts["loaders.ts"]
  f_components_games_dream_RecordingControls_tsx["dream.RecordingControls.tsx"]
  f_lib_dreamdm_DreamSystemContext_tsx["DreamSystemContext.tsx"]
  f_lib_engins_game_useGameEnginRuntime_ts["useGameEnginRuntime.ts"]
  f_engins_engin_LabEngin_tsx["engin.LabEngin.tsx"]
  f_components_dream_ForgeDreamCanvas_tsx["dream.ForgeDreamCanvas.tsx"]
  f_engins_dream_QuantumCircuitCanvas_tsx["dream.QuantumCircuitCanvas.tsx"]
  f_engins_engin_StarMakerEngin_tsx["engin.StarMakerEngin.tsx"]
  f_lib_supabase_config_ts["config.ts"]
  f_lib_music_starmaker_ts["starmaker.ts"]
  f_lib_music_starmakerArrangement_ts["starmakerArrangement.ts"]
  f_lib_music_presets_ts["presets.ts"]
  f_lib_music_starmakerDaw_ts["starmakerDaw.ts"]
  f_components_daydream_starmaker_dream_panel_MultitrackArrangementPanel_tsx["dream.panel.MultitrackArrangementPanel.tsx"]
  f_components_daydream_starmaker_dream_panel_PianoRollPanel_tsx["dream.panel.PianoRollPanel.tsx"]
  f_components_daydream_starmaker_dream_panel_CompingPanel_tsx["dream.panel.CompingPanel.tsx"]
  f_components_daydream_starmaker_dream_panel_SessionViewPanel_tsx["dream.panel.SessionViewPanel.tsx"]
  f_components_dream_AudioVisualizer3D_tsx["dream.AudioVisualizer3D.tsx"]
  f_lib_audioFingerprint_ts["audioFingerprint.ts"]
  f_engins_portfolio_dream_PortfolioEngin_tsx["dream.PortfolioEngin.tsx"]
  f_engins_CodeEngin_core_parser_ts["parser.ts"]
  f_engins_CodeEngin_modules_ai_co_pilot_dream_panel_AgentPanel_tsx --> f_engins_CodeEngin_modules_ai_co_pilot_useAgentSession_ts
  f_engins_CodeEngin_modules_ai_co_pilot_index_ts --> f_engins_CodeEngin_modules_ai_co_pilot_dream_panel_AgentPanel_tsx
  f_engins_CodeEngin_modules_ai_co_pilot_index_ts --> f_engins_CodeEngin_modules_ai_co_pilot_useAgentSession_ts
  f_engins_CodeEngin_orchestrator_dream_index_tsx --> f_engins_CodeEngin_modules_ai_co_pilot_dream_panel_AgentPanel_tsx
  f_engins_CodeEngin_orchestrator_dream_index_tsx --> f_lib_enginpipe_index_ts
  f_engins_autoopen_dream_AutoOpenGameEngin_tsx --> f_lib_runtime_useSharedEnginChannel_ts
  f_engins_autoopen_dream_AutoOpenGameEngin_tsx --> f_lib_runtime_instanceManager_ts
  f_engins_dream_ForgeEngin_tsx --> f_components_dream_BrandLogo_tsx
  f_engins_dream_ForgeEngin_tsx --> f_components_forge_dream_panel_AIBuilderPanel_tsx
  f_engins_dream_ForgeEngin_tsx --> f_lib_runtime_dualRuntimeBridge_ts
  f_engins_dream_ForgeEngin_tsx --> f_lib_forge_useForgeActivity_ts
  f_engins_dream_ForgeEngin_tsx --> f_components_daydream_dream_JourneyTrail_tsx
  f_engins_dream_ForgeEngin_tsx --> f_lib_forge_forgeRegistry_ts
  f_engins_dream_ForgeEngin_tsx --> f_lib_forge_forgeIntelligence_ts
  f_engins_dream_ForgeEngin_tsx --> f_lib_forge_forgeMomentum_ts
  f_engins_dream_ForgeEngin_tsx --> f_lib_forge_forgeNexus_ts
  f_engins_dream_ForgeEngin_tsx --> f_lib_forge_forgeRituals_ts
  f_engins_dream_panel_AnalyticsEngin_tsx --> f_lib_runtime_useEnginCoopSync_ts
  f_engins_dream_panel_AnalyticsEngin_tsx --> f_lib_supabase_client_ts
  f_engins_dream_panel_AnalyticsEngin_tsx --> f_lib_daydream_useDaydreamPersistence_ts
  f_engins_dream_panel_AnalyticsEngin_tsx --> f_components_dreamengin_dream_panel_CrossEnginStatusPanel_tsx
  f_engins_dream_panel_AnalyticsEngin_tsx --> f_components_activity_dream_ActivityProfile_tsx
  f_engins_dream_panel_AnalyticsEngin_tsx --> f_lib_forge_useForgeActivity_ts
  f_engins_dream_panel_AnalyticsEngin_tsx --> f_lib_activity_types_ts
  f_engins_dream_panel_AnalyticsEngin_tsx --> f_components_daydream_dream_JourneyTrail_tsx
  f_engins_engin_BrandingEngin_tsx --> f_lib_runtime_useEnginCoopSync_ts
  f_engins_engin_BrandingEngin_tsx --> f_lib_supabase_client_ts
  f_engins_engin_BrandingEngin_tsx --> f_lib_daydream_useDaydreamState_ts
  f_engins_engin_BrandingEngin_tsx --> f_lib_daydream_useDaydreamPersistence_ts
  f_engins_engin_BrandingEngin_tsx --> f_lib_dreamenginOS_index_ts
  f_engins_engin_BrandingEngin_tsx --> f_hooks_useSharedDream_ts
  f_engins_engin_BrandingEngin_tsx --> f_lib_runtime_dualRuntimeBridge_ts
  f_engins_engin_BrandingEngin_tsx --> f_lib_runtime_useEnginBridge_ts
  f_engins_engin_BrandingEngin_tsx --> f_components_dreamengin_dream_panel_CrossEnginStatusPanel_tsx
  f_engins_engin_BrandingEngin_tsx --> f_lib_forge_useForgeActivity_ts
  f_engins_engin_BrandingEngin_tsx --> f_lib_forge_forgeIntelligence_ts
  f_engins_engin_BrandingEngin_tsx --> f_components_daydream_dream_JourneyTrail_tsx
  f_engins_engin_CodeEngin_tsx --> f_lib_runtime_useEnginCoopSync_ts
  f_engins_engin_CodeEngin_tsx --> f_lib_supabase_client_ts
  f_engins_engin_CodeEngin_tsx --> f_lib_daydream_useDaydreamState_ts
  f_engins_engin_CodeEngin_tsx --> f_lib_daydream_useDaydreamPersistence_ts
  f_engins_engin_CodeEngin_tsx --> f_lib_dreamenginOS_index_ts
  f_engins_engin_CodeEngin_tsx --> f_hooks_useSharedDream_ts
  f_engins_engin_CodeEngin_tsx --> f_lib_runtime_dualRuntimeBridge_ts
  f_engins_engin_CodeEngin_tsx --> f_components_daydream_dream_DiffViewer_tsx
  f_engins_engin_CodeEngin_tsx --> f_lib_forge_useForgeActivity_ts
  f_engins_engin_CodeEngin_tsx --> f_lib_forge_forgeIntelligence_ts
  f_engins_engin_CodeEngin_tsx --> f_lib_runtime_useEnginBridge_ts
  f_engins_engin_CodeEngin_tsx --> f_components_daydream_dream_JourneyTrail_tsx
  f_engins_engin_CodeEngin_tsx --> f_components_dreamengin_dream_panel_CrossEnginStatusPanel_tsx
  f_engins_engin_CodeEngin_tsx --> f_lib_diff_aiEditEngine_ts
  f_engins_engin_CodeEngin_tsx --> f_engins_CodeEngin_modules_ai_co_pilot_index_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_runtime_useEnginCoopSync_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_supabase_client_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_daydream_useDaydreamPersistence_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_dreamenginOS_index_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_runtime_dualRuntimeBridge_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_runtime_useEnginBridge_ts
  f_engins_engin_ContentEngin_tsx --> f_components_dreamengin_dream_panel_CrossEnginStatusPanel_tsx
  f_engins_engin_ContentEngin_tsx --> f_lib_forge_useForgeActivity_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_forge_forgeIntelligence_ts
  f_engins_engin_ContentEngin_tsx --> f_components_daydream_dream_JourneyTrail_tsx
  f_engins_engin_ContentEngin_tsx --> f_lib_content_transcriptEditor_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_content_publishIntent_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_content_seoScorer_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_composite_motionCapture_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_composite_compositor_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_composite_rotoscope_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_composite_matchmover_ts
  f_engins_engin_ContentEngin_tsx --> f_lib_composite_fxSimulation_ts
  f_engins_engin_ContentEngin_tsx --> f_components_activity_dream_ActivityPostForm_tsx
  f_engins_engin_GameEngin_tsx --> f_lib_runtime_useEnginCoopSync_ts
  f_engins_engin_GameEngin_tsx --> f_lib_supabase_client_ts
  f_engins_engin_GameEngin_tsx --> f_lib_daydream_useDaydreamPersistence_ts
  f_engins_engin_GameEngin_tsx --> f_lib_dreamenginOS_index_ts
  f_engins_engin_GameEngin_tsx --> f_components_games_dream_hud_GameHUD_tsx
  f_engins_engin_GameEngin_tsx --> f_components_games_dream_GamesHub_tsx
  f_engins_engin_GameEngin_tsx --> f_lib_games_library_state_ts
  f_engins_engin_GameEngin_tsx --> f_lib_games_useGamepad_ts
  f_engins_engin_GameEngin_tsx --> f_lib_games_navigation_ts
  f_engins_engin_GameEngin_tsx --> f_lib_games_avatar_ts
  f_engins_engin_GameEngin_tsx --> f_lib_games_useGameInputKeyboardBridge_ts
  f_engins_engin_GameEngin_tsx --> f_lib_games_useRemoteChannel_ts
  f_engins_engin_GameEngin_tsx --> f_lib_runtime_dualRuntimeBridge_ts
  f_engins_engin_GameEngin_tsx --> f_lib_runtime_useEnginBridge_ts
  f_engins_engin_GameEngin_tsx --> f_lib_runtime_useSharedEnginChannel_ts
  f_engins_engin_GameEngin_tsx --> f_lib_runtime_instanceManager_ts
  f_engins_engin_GameEngin_tsx --> f_components_dreamengin_dream_panel_CrossEnginStatusPanel_tsx
  f_engins_engin_GameEngin_tsx --> f_lib_forge_useForgeActivity_ts
  f_engins_engin_GameEngin_tsx --> f_lib_forge_forgeIntelligence_ts
  f_engins_engin_GameEngin_tsx --> f_lib_games_quality_plan_ts
  f_engins_engin_GameEngin_tsx --> f_lib_media_ledger_ts
  f_engins_engin_GameEngin_tsx --> f_components_daydream_dream_JourneyTrail_tsx
  f_engins_engin_GameEngin_tsx --> f_lib_gameengin_GameRuntime_tsx
  f_engins_engin_GameEngin_tsx --> f_lib_gameengin_cartridge_ts
  f_engins_engin_GameEngin_tsx --> f_lib_gameengin_cartridges_loaders_ts
  f_engins_engin_GameEngin_tsx --> f_components_games_dream_RecordingControls_tsx
  f_engins_engin_GameEngin_tsx --> f_lib_dreamdm_DreamSystemContext_tsx
  f_engins_engin_GameEngin_tsx --> f_lib_engins_game_useGameEnginRuntime_ts
  f_engins_engin_GameEngin_tsx --> f_lib_enginpipe_index_ts
  f_engins_engin_LabEngin_tsx --> f_lib_runtime_useEnginCoopSync_ts
  f_engins_engin_LabEngin_tsx --> f_lib_supabase_client_ts
  f_engins_engin_LabEngin_tsx --> f_lib_daydream_useDaydreamPersistence_ts
  f_engins_engin_LabEngin_tsx --> f_lib_runtime_dualRuntimeBridge_ts
  f_engins_engin_LabEngin_tsx --> f_lib_runtime_useEnginBridge_ts
  f_engins_engin_LabEngin_tsx --> f_components_dreamengin_dream_panel_CrossEnginStatusPanel_tsx
  f_engins_engin_LabEngin_tsx --> f_lib_forge_useForgeActivity_ts
  f_engins_engin_LabEngin_tsx --> f_lib_forge_forgeIntelligence_ts
  f_engins_engin_LabEngin_tsx --> f_components_daydream_dream_JourneyTrail_tsx
  f_engins_engin_LabEngin_tsx --> f_components_dream_ForgeDreamCanvas_tsx
  f_engins_engin_LabEngin_tsx --> f_lib_dreamenginOS_index_ts
  f_engins_engin_LabEngin_tsx --> f_engins_dream_QuantumCircuitCanvas_tsx
  f_engins_engin_StarMakerEngin_tsx --> f_lib_runtime_useEnginCoopSync_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_supabase_client_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_supabase_config_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_daydream_useDaydreamState_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_daydream_useDaydreamPersistence_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_dreamenginOS_index_ts
  f_engins_engin_StarMakerEngin_tsx --> f_hooks_useSharedDream_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_music_starmaker_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_music_starmakerArrangement_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_music_presets_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_runtime_dualRuntimeBridge_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_runtime_useEnginBridge_ts
  f_engins_engin_StarMakerEngin_tsx --> f_components_dreamengin_dream_panel_CrossEnginStatusPanel_tsx
  f_engins_engin_StarMakerEngin_tsx --> f_lib_forge_useForgeActivity_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_forge_forgeIntelligence_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_media_ledger_ts
  f_engins_engin_StarMakerEngin_tsx --> f_lib_music_starmakerDaw_ts
  f_engins_engin_StarMakerEngin_tsx --> f_components_daydream_dream_JourneyTrail_tsx
  f_engins_engin_StarMakerEngin_tsx --> f_components_daydream_starmaker_dream_panel_MultitrackArrangementPanel_tsx
  f_engins_engin_StarMakerEngin_tsx --> f_components_daydream_starmaker_dream_panel_PianoRollPanel_tsx
  f_engins_engin_StarMakerEngin_tsx --> f_components_daydream_starmaker_dream_panel_CompingPanel_tsx
  f_engins_engin_StarMakerEngin_tsx --> f_components_daydream_starmaker_dream_panel_SessionViewPanel_tsx
  f_engins_engin_StarMakerEngin_tsx --> f_components_dream_AudioVisualizer3D_tsx
  f_engins_engin_StarMakerEngin_tsx --> f_lib_audioFingerprint_ts
  f_engins_portfolio_dream_PortfolioEngin_tsx --> f_engins_dream_QuantumCircuitCanvas_tsx
  f_engins_portfolio_dream_PortfolioEngin_tsx --> f_lib_forge_useForgeActivity_ts
  f_engins_portfolio_dream_PortfolioEngin_tsx --> f_lib_forge_forgeIntelligence_ts
  f_engins_portfolio_dream_PortfolioEngin_tsx --> f_lib_runtime_dualRuntimeBridge_ts
  f_engins_portfolio_dream_PortfolioEngin_tsx --> f_components_daydream_dream_JourneyTrail_tsx
```

</details>

<details><summary>types/ — 18 files</summary>

```mermaid
graph LR
  f_types_dream_window_ts["dream-window.ts"]
  f_lib_dream_window_DreamWindowLifecycle_ts["DreamWindowLifecycle.ts"]
  f_types_ads_ts["ads.ts"]
  f_types_ai_system_ts["ai-system.ts"]
  f_types_ai_ts["ai.ts"]
  f_types_ccc_ts["ccc.ts"]
  f_types_connector_ts["connector.ts"]
  f_types_dreamArtifact_ts["dreamArtifact.ts"]
  f_types_experience_ts["experience.ts"]
  f_types_journey_ts["journey.ts"]
  f_types_marketplace_ts["marketplace.ts"]
  f_types_module_manifest_ts["module-manifest.ts"]
  f_types_rivet_dev_agent_os_d_ts["rivet-dev-agent-os.d.ts"]
  f_types_spatial_ts["spatial.ts"]
  f_types_supabase_ts["supabase.ts"]
  f_types_user_sim_ts["user-sim.ts"]
  f_types_widget_system_v2_ts["widget-system-v2.ts"]
  f_types_widgetConfigs_ts["widgetConfigs.ts"]
  f_types_widgets_ts["widgets.ts"]
  f_types_dream_window_ts --> f_lib_dream_window_DreamWindowLifecycle_ts
```

</details>

<details><summary>src/ — 21 files</summary>

```mermaid
graph LR
  f_src_configs_demoGameConfig_ts["demoGameConfig.ts"]
  f_src_core_GameEnginCore_ts["GameEnginCore.ts"]
  f_lib_gameengin_core_ts["core.ts"]
  f_lib_gameengin_gameEnginRuntime_ts["gameEnginRuntime.ts"]
  f_src_dream_rulesets_homedream_dream_homedream_physics_ts["dream.homedream.physics.ts"]
  f_src_dream_rulesets_homedream_dream_homedream_constants_ts["dream.homedream.constants.ts"]
  f_src_dream_rulesets_homedream_dream_homedream_transforms_ts["dream.homedream.transforms.ts"]
  f_src_dream_rulesets_homedream_index_ts["index.ts"]
  f_src_dreamsurface_dreamsurface_bridge_ts["dreamsurface.bridge.ts"]
  f_src_engin_core_engin_ledger_ts["engin.ledger.ts"]
  f_src_engin_core_engin_eventbus_ts["engin.eventbus.ts"]
  f_src_dreamsurface_index_ts["index.ts"]
  f_src_dreamsurface_dreamsurface_delta_ts["dreamsurface.delta.ts"]
  f_src_engin_core_index_ts["index.ts"]
  f_src_engin_core_engin_renderloop_ts["engin.renderloop.ts"]
  f_src_engin_core_engin_auth_ts["engin.auth.ts"]
  f_src_launcher_ts["launcher.ts"]
  f_src_components_dream_DreamEnginLogo_tsx["dream.DreamEnginLogo.tsx"]
  f_src_components_dream_LogoHero_tsx["dream.LogoHero.tsx"]
  f_src_components_dream_Nav_tsx["dream.Nav.tsx"]
  f_src_engin_state_base_json["base.json"]
  f_src_lib_ai_client_ts["client.ts"]
  f_src_lib_babylon_useDreamLogoScene_ts["useDreamLogoScene.ts"]
  f_src_configs_demoGameConfig_ts --> f_src_core_GameEnginCore_ts
  f_src_core_GameEnginCore_ts --> f_lib_gameengin_core_ts
  f_src_core_GameEnginCore_ts --> f_lib_gameengin_gameEnginRuntime_ts
  f_src_dream_rulesets_homedream_dream_homedream_physics_ts --> f_src_dream_rulesets_homedream_dream_homedream_constants_ts
  f_src_dream_rulesets_homedream_dream_homedream_transforms_ts --> f_src_dream_rulesets_homedream_dream_homedream_constants_ts
  f_src_dream_rulesets_homedream_index_ts --> f_src_dream_rulesets_homedream_dream_homedream_constants_ts
  f_src_dream_rulesets_homedream_index_ts --> f_src_dream_rulesets_homedream_dream_homedream_transforms_ts
  f_src_dream_rulesets_homedream_index_ts --> f_src_dream_rulesets_homedream_dream_homedream_physics_ts
  f_src_dreamsurface_dreamsurface_bridge_ts --> f_src_engin_core_engin_ledger_ts
  f_src_dreamsurface_dreamsurface_bridge_ts --> f_src_engin_core_engin_eventbus_ts
  f_src_dreamsurface_dreamsurface_bridge_ts --> f_src_dream_rulesets_homedream_dream_homedream_transforms_ts
  f_src_dreamsurface_index_ts --> f_src_dreamsurface_dreamsurface_bridge_ts
  f_src_dreamsurface_index_ts --> f_src_dreamsurface_dreamsurface_delta_ts
  f_src_engin_core_index_ts --> f_src_engin_core_engin_ledger_ts
  f_src_engin_core_index_ts --> f_src_engin_core_engin_eventbus_ts
  f_src_engin_core_index_ts --> f_src_engin_core_engin_renderloop_ts
  f_src_engin_core_index_ts --> f_src_engin_core_engin_auth_ts
  f_src_launcher_ts --> f_src_core_GameEnginCore_ts
  f_src_launcher_ts --> f_src_configs_demoGameConfig_ts
```

</details>

<details><summary>scripts/ — 44 files</summary>

```mermaid
graph LR
  f_scripts_archive_proxy_ts["proxy.ts"]
  f_lib_supabase_server_ts["server.ts"]
  f_lib_supabase_config_ts["config.ts"]
  f_scripts_postbuild_ts["postbuild.ts"]
  f_lib_adari_ts["adari.ts"]
  f_scripts_update_readme_mjs["update-readme.mjs"]
  f_scripts_update_readme_status_utils_mjs["update-readme-status-utils.mjs"]
  f_scripts_analyze_repo_state_mjs["analyze-repo-state.mjs"]
  f_scripts_archive_validate_deployment_js["validate-deployment.js"]
  f_scripts_autofix_vercel_build_mjs["autofix-vercel-build.mjs"]
  f_scripts_check_build_memory_drift_mjs["check-build-memory-drift.mjs"]
  f_scripts_check_engin_filenames_mjs["check-engin-filenames.mjs"]
  f_scripts_check_licenses_mjs["check-licenses.mjs"]
  f_scripts_check_root_hygiene_mjs["check-root-hygiene.mjs"]
  f_scripts_close_all_open_prs_sh["close-all-open-prs.sh"]
  f_scripts_deploy_sh["deploy.sh"]
  f_scripts_export_full_code_mjs["export-full-code.mjs"]
  f_scripts_feature_build_generate_features_mjs["generate-features.mjs"]
  f_scripts_gameengin_architect_run_ts["architect-run.ts"]
  f_scripts_gameengin_artisan_run_ts["artisan-run.ts"]
  f_scripts_gameengin_lib_tar_ts["tar.ts"]
  f_scripts_gameengin_maestro_analyze_ts["maestro-analyze.ts"]
  f_scripts_gameengin_mechanic_run_ts["mechanic-run.ts"]
  f_scripts_gameengin_package_cartridge_ts["package-cartridge.ts"]
  f_scripts_gameengin_prophet_run_ts["prophet-run.ts"]
  f_scripts_gameengin_upgrader_run_ts["upgrader-run.ts"]
  f_scripts_gameengin_writer_run_ts["writer-run.ts"]
  f_scripts_generate_mobile_nextgen_spec_mjs["generate-mobile-nextgen-spec.mjs"]
  f_scripts_generate_mobile_ps5_spec_mjs["generate-mobile-ps5-spec.mjs"]
  f_scripts_generate_webapp_final_form_mjs["generate-webapp-final-form.mjs"]
  f_scripts_law_check_sh["law-check.sh"]
  f_scripts_migrate_imports_sh["migrate-imports.sh"]
  f_scripts_optimize_dreamengin_mjs["optimize-dreamengin.mjs"]
  f_scripts_postbuild_js["postbuild.js"]
  f_scripts_readme_autosync_ts["readme-autosync.ts"]
  f_scripts_repository_state_analysis_section_mjs["repository-state-analysis-section.mjs"]
  f_scripts_score_pass_cjs["score-pass.cjs"]
  f_scripts_setup_database_sql["setup-database.sql"]
  f_scripts_spec_check_cjs["spec-check.cjs"]
  f_scripts_sync_build_memory_mjs["sync-build-memory.mjs"]
  f_scripts_ui_ux_agent_py["ui-ux-agent.py"]
  f_scripts_update_bugs_mjs["update-bugs.mjs"]
  f_scripts_update_embed_feed_mjs["update-embed-feed.mjs"]
  f_scripts_update_handoff_mjs["update-handoff.mjs"]
  f_scripts_validate_schema_sync_sh["validate-schema-sync.sh"]
  f_scripts_vercel_ignore_cjs["vercel-ignore.cjs"]
  f_scripts_vercel_preflight_cjs["vercel-preflight.cjs"]
  f_scripts_archive_proxy_ts --> f_lib_supabase_server_ts
  f_scripts_archive_proxy_ts --> f_lib_supabase_config_ts
  f_scripts_postbuild_ts --> f_lib_adari_ts
  f_scripts_update_readme_mjs --> f_scripts_update_readme_status_utils_mjs
```

</details>

<details><summary>tests/ — 205 files</summary>

_File-level graph omitted: 205 files exceeds Mermaid render budget. See table above._

</details>

<details><summary>app/ — 255 files</summary>

_File-level graph omitted: 255 files exceeds Mermaid render budget. See table above._

</details>

<details><summary>components/ — 297 files</summary>

_File-level graph omitted: 297 files exceeds Mermaid render budget. See table above._

</details>

<details><summary>lib/ — 521 files</summary>

_File-level graph omitted: 521 files exceeds Mermaid render budget. See table above._

</details>


#### Orphan Files (floating/disconnected)
| Path | Type |
|---|---|
| `.ci/snapshot.diff.txt` | doc |
| `.ci/snapshot.md` | doc |
| `.cursorrules` | file |
| `.env.example` | file |
| `.env.local.example` | file |
| `.github/actions/resilient-engine/action.yml` | config |
| `.github/actions/setup-node/action.yml` | config |
| `.github/agents/dreamengin.agent.md` | doc |
| `.github/agents/error-tracker.agent.md` | doc |
| `.github/agents/gameengin-ai-agent.yml` | config |
| `.github/agents/gameengin.md` | doc |
| `.github/agents/humanAI.agent.md` | doc |
| `.github/agents/idari.agent.md` | doc |
| `.github/agents/my-agent.agent.md` | doc |
| `.github/agents/newagent.agent.md` | doc |
| `.github/agents/Spec-Engin HyperSICC.agent.md` | doc |
| `.github/agents/videogameAi.md` | doc |
| `.github/copilot-instructions.md` | doc |
| `.github/issue-triage/issue-552.md` | doc |
| `.github/issue-triage/issue-556.md` | doc |
| `.github/issue-triage/issue-560.md` | doc |
| `.github/issue-triage/issue-565.md` | doc |
| `.github/issue-triage/issue-571.md` | doc |
| `.github/issue-triage/issue-573.md` | doc |
| `.github/issue-triage/issue-600.md` | doc |
| `.github/issue-triage/issue-601.md` | doc |
| `.github/issue-triage/issue-602.md` | doc |
| `.github/issue-triage/issue-603.md` | doc |
| `.github/issue-triage/issue-604.md` | doc |
| `.github/issue-triage/issue-605.md` | doc |
| `.github/issue-triage/issue-606.md` | doc |
| `.github/issue-triage/issue-607.md` | doc |
| `.github/issue-triage/issue-608.md` | doc |
| `.github/issue-triage/issue-609.md` | doc |
| `.github/issue-triage/issue-610.md` | doc |
| `.github/issue-triage/issue-611.md` | doc |
| `.github/issue-triage/issue-612.md` | doc |
| `.github/issue-triage/issue-613.md` | doc |
| `.github/issue-triage/issue-617.md` | doc |
| `.github/issue-triage/issue-620.md` | doc |
| `.github/issue-triage/issue-621.md` | doc |
| `.github/issue-triage/issue-622.md` | doc |
| `.github/issue-triage/issue-623.md` | doc |
| `.github/issue-triage/issue-647.md` | doc |
| `.github/issue-triage/issue-753.md` | doc |
| `.github/issue-triage/issue-754.md` | doc |
| `.github/pull_request_template.md` | doc |
| `.github/PULL_REQUEST_TEMPLATE.md` | doc |
| `.github/ruleset/autofixvercelbuild.yml` | config |
| `.github/ruleset/bot-pr-automerge.yml` | config |
| `.github/ruleset/bouncer.yml` | config |
| `.github/ruleset/copilot-setup-steps.yml` | config |
| `.github/ruleset/daydream-all.yml` | config |
| `.github/ruleset/daydream-brand-engin.yml` | config |
| `.github/ruleset/daydream-code-engin.yml` | config |
| `.github/ruleset/daydream-create-engin.yml` | config |
| `.github/ruleset/daydream-engin-build-cycle.yml` | config |
| `.github/ruleset/daydream-engin-sicc-refinement.yml` | config |
| `.github/ruleset/daydream-games-engin.yml` | config |
| `.github/ruleset/daydream-lab-engin.yml` | config |
| `.github/ruleset/daydream-music-engin.yml` | config |
| `.github/ruleset/db-extension-audit.yml` | config |
| `.github/ruleset/db-extension-check.yml` | config |
| `.github/ruleset/deploy-artifact.yml` | config |
| `.github/ruleset/docs-auto-update.yml` | config |
| `.github/ruleset/dreamengin-preflight.yml` | config |
| `.github/ruleset/elite-gameengin-evolution.yml` | config |
| `.github/ruleset/engin-all.yml` | config |
| `.github/ruleset/exportrepo.yml` | config |
| `.github/ruleset/game-engin-patrol.yml` | config |
| `.github/ruleset/game-library-research.yml` | config |
| `.github/ruleset/gameengin-ai-agent.yml` | config |
| `.github/ruleset/gameengin-artisan.yml` | config |
| `.github/ruleset/gameengin-maestro.yml` | config |
| `.github/ruleset/gameengin-mechanic.yml` | config |
| `.github/ruleset/gameengin-prophet.yml` | config |
| `.github/ruleset/gameengin-upgrader.yml` | config |
| `.github/ruleset/gameengin-writer.yml` | config |
| `.github/ruleset/games-library-ai-agent.yml` | config |
| `.github/ruleset/garbageman.yml` | config |
| `.github/ruleset/generatesupabasetypes.yml` | config |
| `.github/ruleset/github-actions.yml` | config |
| `.github/ruleset/humanai-army-audit.yml` | config |
| `.github/ruleset/humanai-audit.yml` | config |
| `.github/ruleset/idari-daily.yml` | config |
| `.github/ruleset/issue-bot.yml` | config |
| `.github/ruleset/mobile-nextgen-spec-evolution.yml` | config |
| `.github/ruleset/mobile-ps5-spec-evolution.yml` | config |
| `.github/ruleset/neural-decision-engine.yml` | config |
| `.github/ruleset/optimize-dreamengin.yml` | config |
| `.github/ruleset/portfolio-optimization.yml` | config |
| `.github/ruleset/preflight.yml` | config |
| `.github/ruleset/print-codebase.yml` | config |
| `.github/ruleset/readme-autosync.yml` | config |
| `.github/ruleset/refreshlock.yml` | config |
| `.github/ruleset/repo-snapshot.yml` | config |
| `.github/ruleset/report-driven-coding-agent.yml` | config |
| `.github/ruleset/root-hygiene.yml` | config |
| `.github/ruleset/spec-engin-ai-agent.yml` | config |
| `.github/ruleset/sql-migration-guard.yml` | config |
| `.github/ruleset/sync-build-memory.yml` | config |
| `.github/ruleset/update-embed-feed.yml` | config |
| `.github/ruleset/update-repo-state.yml` | config |
| `.github/ruleset/vercel-deploy.yml` | config |
| `.github/scripts/ai_implement.py` | python |
| `.github/scripts/ai_neural_decision.py` | python |
| `.github/scripts/ai_propose.py` | python |
| `.github/scripts/ai_report_propose.py` | python |
| `.github/scripts/assemble_report_context.py` | python |
| `.github/scripts/catalog_games_for_ai.py` | python |
| `.github/scripts/check-root-hygiene.sh` | file |
| `.github/scripts/DREAMENGIN_CORE_COMPLETE.md` | doc |
| `.github/scripts/DREAMENGIN_CORE_USAGE.md` | doc |
| `.github/scripts/dreamengin_core.py` | python |
| `.github/scripts/humanai_audit.py` | python |
| `.github/scripts/issue-bot.js` | js |
| `.github/scripts/run-readme-autosync.mjs` | mjs |
| `.github/scripts/scan_dreamengin_context.py` | python |
| `.github/scripts/scan_gameengin_context.py` | python |
| `.github/scripts/validate_game_sandbox.py` | python |
| `.github/scripts/validate_report_agent_spec.py` | python |
| `.gitignore` | file |
| `.gitleaks.toml` | config |
| `.husky/pre-commit` | file |
| `.husky/pre-push` | file |
| `AGENTS.md` | doc |
| `agents/.gitkeep` | file |
| `agents/humanAI.persona.md` | doc |
| `agents/humanAI/orchestrator.md` | doc |
| `agents/humanAI/personas/accessibility.md` | doc |
| `agents/humanAI/personas/creator.md` | doc |
| `agents/humanAI/personas/ios-first.md` | doc |
| `agents/humanAI/personas/power-user.md` | doc |
| `agents/humanAI/personas/social-explorer.md` | doc |
| `app/actions/dream-docs.ts` | ts |
| `app/daydream/game/dream.GamePageClient.tsx` | tsx |
| `app/daydream/game/dream.shell.ImmersiveGameShell.tsx` | tsx |
| `app/dreamdmbar/_components/DreamWidgetGrid.tsx` | tsx |
| `app/error.tsx` | tsx |
| `app/global-error.tsx` | tsx |
| `app/globals-enhanced.css` | css |
| `app/loading.tsx` | tsx |
| `app/not-found.tsx` | tsx |
| `assembly/bus.ts` | ts |
| `assembly/index.ts` | ts |
| `assembly/mad-maxi-player.ts` | ts |
| `backend/.env.example` | file |
| `backend/docker-compose.yml` | config |
| `backend/dockerfile` | file |
| `backend/index.js` | js |
| `backend/package-lock.json` | config |
| `backend/package.json` | config |
| `backend/README.md` | doc |
| `backend/src/Routes/apiRoutes.js` | js |
| `backend/src/services/livekitService.js` | js |
| `build-memory/actions.json` | config |
| `build-memory/events.json` | config |
| `build-memory/routes.json` | config |
| `build-memory/schema.json` | config |
| `build-memory/ui-surfaces.json` | config |
| `CHANGELOG.md` | doc |
| `components/connectors/dream.ConnectDreamPrompt.tsx` | tsx |
| `components/core/dream.CoreDream.tsx` | tsx |
| `components/daydream/dream.CodeDreamIDE.tsx` | tsx |
| `components/daydream/dream.LabDreamIDE.tsx` | tsx |
| `components/daydream/dream.NGNEngin.tsx` | tsx |
| `components/daydream/dream.StandaloneEnginSurface.tsx` | tsx |
| `components/draggable/dream.DraggableModule.tsx` | tsx |
| `components/dream.AIAssistant.tsx` | tsx |
| `components/dream.BoogieWarningBanner.tsx` | tsx |
| `components/dream.CreatePostModal.tsx` | tsx |
| `components/dream.DrEamsModeToggle.tsx` | tsx |
| `components/dream.DrEamsVoiceAssistant.tsx` | tsx |
| `components/dream.FeedCard.tsx` | tsx |
| `components/dream.IconSelector.tsx` | tsx |
| `components/dream.InnerDreamsButton.tsx` | tsx |
| `components/dream.LandingHero.tsx` | tsx |
| `components/dream.LedgerChart.tsx` | tsx |
| `components/dream.OSShellActivator.tsx` | tsx |
| `components/dream.PhysicsLab.tsx` | tsx |
| `components/dream.ProfileEditor.tsx` | tsx |
| `components/dream.PullToRefresh.tsx` | tsx |
| `components/dream.ShrunkMode.tsx` | tsx |
| `components/dream.SkeletonLoaders.tsx` | tsx |
| `components/dream.ThemeToggle.tsx` | tsx |
| `components/dream.ToastSystem.tsx` | tsx |
| `components/dream.VoidThemeToggle.tsx` | tsx |
| `components/dream.widget.AnchorWidget.tsx` | tsx |
| `components/dream.widget.ProfileWidgetBlock.tsx` | tsx |
| `components/dream.widget.WidgetBubble.tsx` | tsx |
| `components/dreamengin/dream.bar.DrEamsSearchBar.tsx` | tsx |
| `components/dreamengin/dream.DrEamsCanvas.tsx` | tsx |
| `components/dreamengin/dream.overlay.ViewAllDreamsOverlay.tsx` | tsx |
| `components/dreamengin/dream.scene.BabylonGameScene.tsx` | tsx |
| `components/dreamengin/dream.scene.DrEamsScene.tsx` | tsx |
| `components/dreamengin/dream.scene.PortfolioOptimizationScene.tsx` | tsx |
| `components/dreamengin/dream.shell.EnginShell.tsx` | tsx |
| `components/dreamengin/dream.widget.AppearanceWidget.tsx` | tsx |
| `components/dreamengin/dreamsurface.dreamengin.tsx` | tsx |
| `components/dreamengin/engine/types.ts` | ts |
| `components/dreamnav/dream.DreamNavControls.tsx` | tsx |
| `components/dreamr/dream.CloseFriendsSettings.tsx` | tsx |
| `components/dreams/dream.connectorlayer.tsx` | tsx |
| `components/dreams/dream.featurelayer.tsx` | tsx |
| `components/dreams/dream.outputlayer.tsx` | tsx |
| `components/dreams/dream.shell.DreamShell.tsx` | tsx |
| `components/dreams/dream.shell.SharedDreamShell.tsx` | tsx |
| `components/dreams/dream.SlideOverPanel.tsx` | tsx |
| `components/dreams/dream.window.JourneyDreamWindow.tsx` | tsx |
| `components/dreams/dreamsurface.window.tsx` | tsx |
| `components/engines/index.ts` | ts |
| `components/feeds/dream.widget.EmbedFeedWidget.tsx` | tsx |
| `components/forge/dream.EngineBuilderCanvas.tsx` | tsx |
| `components/gameengin/dream.cartridge.FeaturedCartridges.tsx` | tsx |
| `components/gameengin/README.md` | doc |
| `components/games/css-modules.d.ts` | ts |
| `components/games/dream.hud.LegacyGameHUD.tsx` | tsx |
| `components/games/dream.Leaderboard.tsx` | tsx |
| `components/home/dream.widget.DreamWidget.tsx` | tsx |
| `components/menus/dream.menu.DreamRadialMenu.tsx` | tsx |
| `components/menus/dream.menu.RadialMenu.tsx` | tsx |
| `components/menus/dream.menu.SystemRadialMenu.tsx` | tsx |
| `components/onboarding/dream.OnboardingTip.tsx` | tsx |
| `components/optimizer/dream.scene.BabylonOptimizeroScene.tsx` | tsx |
| `components/panels/dream.panel.FeedPanel.tsx` | tsx |
| `components/profile/dream.ProfileCanvas.tsx` | tsx |
| `components/providers/dream.AppSurfaceShell.tsx` | tsx |
| `components/shaders/index.ts` | ts |
| `components/three/index.ts` | ts |
| `components/ui/dream.IconList.tsx` | tsx |
| `components/universal-editor/index.ts` | ts |
| `components/warp/dream.WarpCanvas.tsx` | tsx |
| `components/webgpu/neuralPostProcess.ts` | ts |
| `components/widgets/dream.AddDreamCTA.tsx` | tsx |
| `components/widgets/dream.ConfigureSheet.tsx` | tsx |
| `components/widgets/dream.EditModeBanner.tsx` | tsx |
| `components/widgets/dream.widget.PlayMediaWidget.tsx` | tsx |
| `components/widgets/dream.widget.WidgetPlaceholder.tsx` | tsx |
| `config/advanced-game-targets.json` | config |
| `config/optimizer.yaml` | config |
| `config/ui-ux-spec.yaml` | config |
| `COOP_AND_SOLO_ROADMAP.md` | doc |
| `core/.gitkeep` | file |
| `coresurfaces/dreamsurface.EditProfileDream.tsx` | tsx |
| `coresurfaces/dreamsurface.ViewProfile.tsx` | tsx |
| `daydreams/brand/page.tsx` | tsx |
| `daydreams/code/page.tsx` | tsx |
| `daydreams/create/page.tsx` | tsx |
| `daydreams/games/page.tsx` | tsx |
| `daydreams/lab/page.tsx` | tsx |
| `daydreams/music/page.tsx` | tsx |
| `docs/ACTION_AUDIT.md` | doc |
| `docs/ACTIVITY_FIRST_PROTOCOL.md` | doc |
| `docs/ADD_WORKFLOW.md` | doc |
| `docs/AGENT_PLAYBOOK.md` | doc |
| `docs/AI_MAP.md` | doc |
| `docs/alignment/DOCS_CHANGE_TRACKER.md` | doc |
| `docs/alignment/REPO_TO_SPEC.md` | doc |
| `docs/ARCHITECTURE.md` | doc |
| `docs/architecture/dreamengin_phase2.md` | doc |
| `docs/architecture/IMPLEMENTATION_NOTES.md` | doc |
| `docs/archive/.gitkeep` | file |
| `docs/AUTH_SETUP.md` | doc |
| `docs/AXIOMS.md` | doc |
| `docs/BOOGIEMAN_POLICY.md` | doc |
| `docs/BUGS.md` | doc |
| `docs/CHILD_SAFETY_POLICY.md` | doc |
| `docs/CONNECTOR_MATRIX.md` | doc |
| `docs/CONNECTORS.md` | doc |
| `docs/CONSTITUTION.md` | doc |
| `docs/COPILOT_TOOLKIT.md` | doc |
| `docs/DR_EAMS.md` | doc |
| `docs/dreamdm_bar_pass1.md` | doc |
| `docs/dreamdm_bar_pass2.md` | doc |
| `docs/dreamdm_messaging_phase2.md` | doc |
| `docs/dreamengin_phase1.md` | doc |
| `docs/dreamengin_phase6.md` | doc |
| `docs/dreamengin_phase8.md` | doc |
| `docs/DREAMGAME_FORMAT.md` | doc |
| `docs/DUALSENSE_EXAMPLE.md` | doc |
| `docs/DUALSENSE_INTEGRATION.md` | doc |
| `docs/ENGIN_RUNTIME.md` | doc |
| `docs/engin_workflows.md` | doc |
| `docs/engineering/guardrails.md` | doc |
| `docs/enginpipe/README.md` | doc |
| `docs/FEATURE_STATUS.md` | doc |
| `docs/GENERATION_LAW.md` | doc |
| `docs/GITHUB_CODING_AGENT.md` | doc |
| `docs/GOLD_BUTTON_DUAL_RUNTIME.md` | doc |
| `docs/GOLD_BUTTON_QUICK_REF.md` | doc |
| `docs/guides/GITHUB_PUSH_GUIDE.md` | doc |
| `docs/guides/README.agent.md` | doc |
| `docs/HANDOFF.md` | doc |
| `docs/icons.md` | doc |
| `docs/IDARI_CONTRACT.md` | doc |
| `docs/ISSUE_FIXES.md` | doc |
| `docs/issue-552-readme-section-bot-ai-agent-quick-reference.md` | doc |
| `docs/issue-556-readme-section-bot-canonical-route-system.md` | doc |
| `docs/issue-560-readme-section-bot-runtime-model.md` | doc |
| `docs/issue-565-readme-section-bot-3-os-layer-naming-law-canonic.md` | doc |
| `docs/issue-571-readme-section-bot-9-daydream-pair-system-6-dayd.md` | doc |
| `docs/issue-573-readme-section-bot-11-games-gameengin.md` | doc |
| `docs/issue-600-readme-section-bot-recent-changes.md` | doc |
| `docs/issue-601-readme-section-bot-repository-state-analysis.md` | doc |
| `docs/issue-602-readme-section-bot-homedream-system.md` | doc |
| `docs/issue-603-readme-section-bot-core-surfaces.md` | doc |
| `docs/issue-604-readme-section-bot-current-implementation-status.md` | doc |
| `docs/issue-605-readme-section-bot-daydream-surfaces.md` | doc |
| `docs/issue-606-readme-section-bot-daydream-engin-network-model.md` | doc |
| `docs/issue-607-readme-section-bot-dreamdmbar-interaction-rail-r.md` | doc |
| `docs/issue-608-readme-section-bot-1-product-law-16-foundational.md` | doc |
| `docs/issue-609-readme-section-bot-6-homedream-core-system-priva.md` | doc |
| `docs/issue-610-readme-section-bot-10-music-starmakerengin.md` | doc |
| `docs/issue-611-readme-section-bot-12-lab-labengin.md` | doc |
| `docs/issue-612-readme-section-bot-13-code-codeengin.md` | doc |
| `docs/issue-613-readme-section-bot-7-edit-profiledream-core-syst.md` | doc |
| `docs/issue-617-readme-section-bot-8-view-profile-public-shared-.md` | doc |
| `docs/issue-620-readme-section-bot-what-this-is.md` | doc |
| `docs/issue-621-readme-section-bot-start-here.md` | doc |
| `docs/issue-622-readme-section-bot-structure.md` | doc |
| `docs/issue-623-readme-section-bot-root-rules.md` | doc |
| `docs/issue-647-readme-section-bot-how-to-regenerate-this-spec.md` | doc |
| `docs/LAW.md` | doc |
| `docs/logs/README_PATCH.md` | doc |
| `docs/mobile-nextgen-web-gaming-engine-spec.md` | doc |
| `docs/mobile-ps5-web-gaming-engine-spec.md` | doc |
| `docs/MODULARITY_VIOLATION_LOG.md` | doc |
| `docs/NAMESPACE_PROTOCOL.md` | doc |
| `docs/NAMING_AUTHORITY.md` | doc |
| `docs/OBSERVABILITY.md` | doc |
| `docs/PHASE9_IMPLEMENTATION.md` | doc |
| `docs/POLICY_TESTS.md` | doc |
| `docs/policy/theboogie.md` | doc |
| `docs/PRINCIPLES_UPDATE.md` | doc |
| `docs/PRODUCT_DEFINITION.md` | doc |
| `docs/REPO_COMPANION.md` | doc |
| `docs/REPO_STATE_ANALYZER.md` | doc |
| `docs/REPO_STRUCTURE_CONTRACT.md` | doc |
| `docs/REVIEW_QUEUE.md` | doc |
| `docs/SECURITY.md` | doc |
| `docs/THEME.md` | doc |
| `docs/TRIAGE_LOG.md` | doc |
| `docs/wasm_gpu_vm_spec.md` | doc |
| `docs/WASM_GPU_VM_SUMMARY.md` | doc |
| `docs/WIDGET_SYSTEM_V2.md` | doc |
| `dr-eams/capabilities.yaml` | config |
| `dr-eams/tools.ts` | ts |
| `engins/CodeEngin/core/parser.ts` | ts |
| `engins/CodeEngin/orchestrator/dream.index.tsx` | tsx |
| `experiments/.gitkeep` | file |
| `frontend/public/favicon.ico` | file |
| `frontend/public/index.html` | file |
| `frontend/public/src/components/commentSection/CommentSection.jsx` | jsx |
| `frontend/public/src/components/feed/Feed.jsx` | jsx |
| `frontend/public/src/components/Videoplayer/VideoPlayer.jsx` | jsx |
| `frontend/public/src/DockerFile` | file |
| `frontend/public/src/index.js` | js |
| `frontend/public/src/package-lock.json` | config |
| `frontend/public/src/package.json` | config |
| `frontend/public/src/Services/api.js` | js |
| `frontend/public/src/Services/livekit.js` | js |
| `frontend/public/src/Utils/socialUtils.js` | js |
| `frontend/public/src/Utils/web3Utils.js` | js |
| `GameENGINspec.md` | doc |
| `grafana/dashboards/default.yml` | config |
| `grafana/datasources/prometheus.yml` | config |
| `hooks/useHideOnScroll.ts` | ts |
| `hooks/useTick.ts` | ts |
| `hooks/useViewCounter.ts` | ts |
| `lib/activity/boogieActivityPolicy.ts` | ts |
| `lib/agents/boogieManAI.ts` | ts |
| `lib/agents/dreamengin.ts` | ts |
| `lib/ai/boogie-verifier.ts` | ts |
| `lib/ai/capability-gate.ts` | ts |
| `lib/ai/CIC.ts` | ts |
| `lib/ai/confirm-token.ts` | ts |
| `lib/ai/handlers/index.ts` | ts |
| `lib/ai/idempotency.ts` | ts |
| `lib/ai/rate-limiter.ts` | ts |
| `lib/ai/tfBackend.ts` | ts |
| `lib/audio-fingerprint/index.ts` | ts |
| `lib/babylon/dreamengine-hybrid.ts` | ts |
| `lib/bot-detection/detector.ts` | ts |
| `lib/bot-detection/view-tally.ts` | ts |
| `lib/bus.wasm` | file |
| `lib/connectors/providers/devto.ts` | ts |
| `lib/connectors/providers/facebook.ts` | ts |
| `lib/connectors/providers/hackernews.ts` | ts |
| `lib/connectors/providers/medium.ts` | ts |
| `lib/connectors/providers/pinterest.ts` | ts |
| `lib/connectors/providers/podcast.ts` | ts |
| `lib/connectors/providers/substack.ts` | ts |
| `lib/connectors/providers/tiktok.ts` | ts |
| `lib/connectors/providers/tumblr.ts` | ts |
| `lib/connectors/providers/twitter.ts` | ts |
| `lib/connectors/youtube.ts` | ts |
| `lib/consent/consentManager.ts` | ts |
| `lib/content/generativeFill.ts` | ts |
| `lib/dream-docs/index.ts` | ts |
| `lib/dream-window/index.ts` | ts |
| `lib/dreamdm/useModuleBarIntent.ts` | ts |
| `lib/dreamengin/engineAssets.ts` | ts |
| `lib/dreamnav/gctAssist.ts` | ts |
| `lib/dreamnav/gestures6.ts` | ts |
| `lib/dreamr/socialHumanityScore.ts` | ts |
| `lib/engins/game/index.ts` | ts |
| `lib/engins/useEnginWorkflow.ts` | ts |
| `lib/forge-ngn/index.ts` | ts |
| `lib/gameengin/accessibility-ai.ts` | ts |
| `lib/gameengin/ai-npcs.ts` | ts |
| `lib/gameengin/brain/active-projects.json` | config |
| `lib/gameengin/brain/asset-registry/README.md` | doc |
| `lib/gameengin/brain/build-history/README.md` | doc |
| `lib/gameengin/brain/character-voices/mad-maxi.json` | config |
| `lib/gameengin/brain/composition-principles/leading-lines-landmark.json` | config |
| `lib/gameengin/brain/composition-principles/parallax-layers.json` | config |
| `lib/gameengin/brain/concept-library/neon-courier.json` | config |
| `lib/gameengin/brain/concept-library/README.md` | doc |
| `lib/gameengin/brain/concept-patterns/protagonists/reluctant-courier.json` | config |
| `lib/gameengin/brain/concept-patterns/README.md` | doc |
| `lib/gameengin/brain/concept-patterns/scope-formulas/one-day-runner.json` | config |
| `lib/gameengin/brain/concept-patterns/settings/neon-rain-megacity.json` | config |
| `lib/gameengin/brain/crash-reports/README.md` | doc |
| `lib/gameengin/brain/dialogue-patterns/callback-anchor.json` | config |
| `lib/gameengin/brain/dialogue-patterns/implied-subject.json` | config |
| `lib/gameengin/brain/dialogue-patterns/sentence-fragment-rhythm.json` | config |
| `lib/gameengin/brain/emotional-tones/determined.json` | config |
| `lib/gameengin/brain/emotional-tones/fierce.json` | config |
| `lib/gameengin/brain/emotional-tones/hopeful.json` | config |
| `lib/gameengin/brain/emotional-tones/reflective.json` | config |
| `lib/gameengin/brain/emotional-tones/weary.json` | config |
| `lib/gameengin/brain/fun-heuristics/meta-progression.json` | config |
| `lib/gameengin/brain/fun-heuristics/moment-to-moment.json` | config |
| `lib/gameengin/brain/fun-heuristics/session-loop.json` | config |
| `lib/gameengin/brain/genre-dna/action-rpg.json` | config |
| `lib/gameengin/brain/genre-dna/episodic.json` | config |
| `lib/gameengin/brain/genre-dna/live-service.json` | config |
| `lib/gameengin/brain/genre-dna/metroidvania.json` | config |
| `lib/gameengin/brain/genre-dna/open-world.json` | config |
| `lib/gameengin/brain/genre-dna/platformer.json` | config |
| `lib/gameengin/brain/genre-dna/puzzle.json` | config |
| `lib/gameengin/brain/genre-dna/racing.json` | config |
| `lib/gameengin/brain/genre-dna/roguelike.json` | config |
| `lib/gameengin/brain/genre-dna/sandbox.json` | config |
| `lib/gameengin/brain/genre-dna/template.json` | config |
| `lib/gameengin/brain/inspiration-corpus/celeste.json` | config |
| `lib/gameengin/brain/inspiration-corpus/dead-cells.json` | config |
| `lib/gameengin/brain/inspiration-corpus/hades.json` | config |
| `lib/gameengin/brain/inspiration-corpus/hollow-knight.json` | config |
| `lib/gameengin/brain/inspiration-corpus/outer-wilds.json` | config |
| `lib/gameengin/brain/material-recipes/neon-glass-tube.json` | config |
| `lib/gameengin/brain/material-recipes/rusted-iron.json` | config |
| `lib/gameengin/brain/material-recipes/sun-bleached-sandstone.json` | config |
| `lib/gameengin/brain/mechanic-library/camera/look-ahead.json` | config |
| `lib/gameengin/brain/mechanic-library/camera/screen-shake.json` | config |
| `lib/gameengin/brain/mechanic-library/camera/smooth-follow.json` | config |
| `lib/gameengin/brain/mechanic-library/combat/combo.json` | config |
| `lib/gameengin/brain/mechanic-library/combat/hit-stop.json` | config |
| `lib/gameengin/brain/mechanic-library/combat/parry.json` | config |
| `lib/gameengin/brain/mechanic-library/combat/ranged.json` | config |
| `lib/gameengin/brain/mechanic-library/movement/coyote-time.json` | config |
| `lib/gameengin/brain/mechanic-library/movement/dash.json` | config |
| `lib/gameengin/brain/mechanic-library/movement/double-jump.json` | config |
| `lib/gameengin/brain/mechanic-library/movement/grapple.json` | config |
| `lib/gameengin/brain/mechanic-library/movement/wall-slide.json` | config |
| `lib/gameengin/brain/mechanic-library/progression/metroidvania-gating.json` | config |
| `lib/gameengin/brain/mechanic-library/progression/roguelike-perks.json` | config |
| `lib/gameengin/brain/mechanic-library/progression/skill-tree.json` | config |
| `lib/gameengin/brain/mechanic-library/structural/ability-gating.json` | config |
| `lib/gameengin/brain/mechanic-library/structural/meta-progression.json` | config |
| `lib/gameengin/brain/mechanic-library/structural/procedural-generation.json` | config |
| `lib/gameengin/brain/mechanic-library/structural/run-persistence.json` | config |
| `lib/gameengin/brain/mechanic-library/structural/season-pass.json` | config |
| `lib/gameengin/brain/mechanic-library/structural/world-streaming.json` | config |
| `lib/gameengin/brain/narrative-pacing/default.json` | config |
| `lib/gameengin/brain/originality-registry/by-cartridge/mad-maxi.json` | config |
| `lib/gameengin/brain/originality-registry/signatures.json` | config |
| `lib/gameengin/brain/principles/emotional-core.md` | doc |
| `lib/gameengin/brain/principles/feedback.md` | doc |
| `lib/gameengin/brain/principles/mastery.md` | doc |
| `lib/gameengin/brain/principles/progression.md` | doc |
| `lib/gameengin/brain/principles/responsiveness.md` | doc |
| `lib/gameengin/brain/principles/risk-reward.md` | doc |
| `lib/gameengin/brain/progression-state/README.md` | doc |
| `lib/gameengin/brain/rd-sessions/README.md` | doc |
| `lib/gameengin/brain/README.md` | doc |
| `lib/gameengin/brain/technique-library/lighting/three-point-mood.json` | config |
| `lib/gameengin/brain/technique-library/modeling/edge-flow.json` | config |
| `lib/gameengin/brain/technique-library/modeling/silhouette-first.json` | config |
| `lib/gameengin/brain/technique-library/optimization/texture-atlasing.json` | config |
| `lib/gameengin/brain/upgrade-history/prioritization-rules.json` | config |
| `lib/gameengin/brain/upgrade-history/README.md` | doc |
| `lib/gameengin/brain/visual-bible/characters/mad-maxi.md` | doc |
| `lib/gameengin/brain/visual-bible/environments/neon-wasteland.md` | doc |
| `lib/gameengin/brain/work-queue/README.md` | doc |
| `lib/gameengin/cartridges/index.ts` | ts |
| `lib/gameengin/cloud-compute.ts` | ts |
| `lib/gameengin/generative-audio.ts` | ts |
| `lib/gameengin/neural-render.ts` | ts |
| `lib/gameengin/path-tracing.ts` | ts |
| `lib/gameengin/predictive-stream.ts` | ts |
| `lib/gameengin/procgen.ts` | ts |
| `lib/gameengin/systems/index.ts` | ts |
| `lib/gameengin/webgpu-runtime-shell.ts` | ts |
| `lib/gameengin/world-crdt.ts` | ts |
| `lib/gameengin/xr.ts` | ts |
| `lib/games/DualSenseManager.ts` | ts |
| `lib/games/lucid-avenue-world.ts` | ts |
| `lib/games/useAIDirector.ts` | ts |
| `lib/gestures/useTouchGestures.ts` | ts |
| `lib/home-buttons/button-groups.ts` | ts |
| `lib/hooks/useResponsive.ts` | ts |
| `lib/hooks/useTap.ts` | ts |
| `lib/journey/withJourney.ts` | ts |
| `lib/music/wasmAudioBridge.ts` | ts |
| `lib/navigation/index.ts` | ts |
| `lib/navigation/README.md` | doc |
| `lib/observability/healthTrend.ts` | ts |
| `lib/observability/index.ts` | ts |
| `lib/offline/useOfflineSync.ts` | ts |
| `lib/optimizer/README.md` | doc |
| `lib/renderer/index.ts` | ts |
| `lib/runtime/quantumCircuit.ts` | ts |
| `lib/runtime/snapshotFingerprint.ts` | ts |
| `lib/runtime/useDragSurface.ts` | ts |
| `lib/runtime/useDualRuntime.ts` | ts |
| `lib/runtime/useDualRuntimePersistence.ts` | ts |
| `lib/supabase/realtime.ts` | ts |
| `lib/torridity/index.ts` | ts |
| `lib/vm/index.ts` | ts |
| `lib/vm/README.md` | doc |
| `lib/webgpu/useWebGPUDirector.ts` | ts |
| `lib/widgets/CrossWidgetPosting.ts` | ts |
| `lib/widgets/parse.ts` | ts |
| `lib/widgets/useWidget.ts` | ts |
| `lib/widgets/WidgetEngine.tsx` | tsx |
| `LICENSE` | file |
| `misc/images/arm2_transparent.png` | file |
| `misc/images/coat_transparent.png` | file |
| `misc/images/head_transparent.png` | file |
| `misc/images/iconslist.png` | file |
| `misc/images/logo_DREAM_transparent.png` | file |
| `misc/images/logo_ENGIN_transparent.png` | file |
| `misc/images/logo_transparent.png` | file |
| `misc/images/shoe1_transparent.png` | file |
| `misc/images/shoe2_transparent.png` | file |
| `misc/images/sprite_2x_transparent.png` | file |
| `misc/images/sprite_transparent.png` | file |
| `next-env.d.ts` | ts |
| `output/patch-plan.json` | config |
| `output/result.json` | config |
| `prometheus/prometheus.yml` | config |
| `public/arm1_transparent.png` | file |
| `public/arm2_transparent.png` | file |
| `public/cartridges/mad-maxi/logic/main.wasm` | file |
| `public/cartridges/mad-maxi/MANIFEST.json` | config |
| `public/cartridges/mad-maxi/tuning.json` | config |
| `public/coat_transparent.png` | file |
| `public/dr-eams-pbr.html` | file |
| `public/favicon.ico` | file |
| `public/feeds/embed-feed.json` | config |
| `public/file.svg` | file |
| `public/globe.svg` | file |
| `public/head_transparent.png` | file |
| `public/images/iconslist.png` | file |
| `public/images/logo1.PNG` | file |
| `public/images/logo2.PNG` | file |
| `public/images/logo3.PNG` | file |
| `public/logo_DREAM_transparent.png` | file |
| `public/logo_ENGIN_transparent.png` | file |
| `public/logo-icon.png` | file |
| `public/manifest.json` | config |
| `public/manifest.webmanifest` | file |
| `public/models/madmaxi.glb` | file |
| `public/module-loader.html` | file |
| `public/next.svg` | file |
| `public/shoe1_transparent.png` | file |
| `public/shoe2_transparent.png` | file |
| `public/sprite_2x_transparent.png` | file |
| `public/sprite_transparent.png` | file |
| `public/vercel.svg` | file |
| `public/videos/signup-bg.mp4` | file |
| `public/window.svg` | file |
| `public/workers/asset-optimizer.worker.js` | js |
| `public/workers/engin-shader.wasm` | file |
| `public/workers/engin-shader.worker.ts` | ts |
| `README.md` | doc |
| `REPO_STATE.md` | doc |
| `repo-visualizer/analyzer.mjs` | mjs |
| `repo-visualizer/graph-stats.json` | config |
| `repo-visualizer/graph.json` | config |
| `repo-visualizer/index.html` | file |
| `repo-visualizer/README.md` | doc |
| `repo-visualizer/server.mjs` | mjs |
| `research-and-development/LICENSE` | file |
| `research-and-development/tech-spec-v1.md` | doc |
| `research/ccc-ada-twin-engine/code/README.md` | doc |
| `research/ccc-ada-twin-engine/data/README.md` | doc |
| `research/ccc-ada-twin-engine/notes/sharpening_notes.txt` | doc |
| `research/ccc-ada-twin-engine/paper/ccc_ada_axioms_and_invariants.tex` | file |
| `research/ccc-ada-twin-engine/paper/ccc_ada_black_hole_gravitational_wave_memory.tex` | file |
| `research/ccc-ada-twin-engine/paper/ccc_ada_holography_and_information_boundary.tex` | file |
| `research/ccc-ada-twin-engine/paper/ccc_ada_predictions_and_falsifiability.tex` | file |
| `research/ccc-ada-twin-engine/paper/ccc_ada_twin_engine_framework.tex` | file |
| `research/ccc-ada-twin-engine/README.md` | doc |
| `research/data/README.md` | doc |
| `research/data/torr_vs_mond_lock_n11.csv` | file |
| `research/DISCOVERY.md` | doc |
| `research/equations/torridityequate.txt` | doc |
| `research/paper/torridity_ledger.tex` | file |
| `research/README.md` | doc |
| `scripts/analyze-repo-state.mjs` | mjs |
| `scripts/archive/proxy.ts` | ts |
| `scripts/archive/validate-deployment.js` | js |
| `scripts/autofix-vercel-build.mjs` | mjs |
| `scripts/check-build-memory-drift.mjs` | mjs |
| `scripts/check-engin-filenames.mjs` | mjs |
| `scripts/check-licenses.mjs` | mjs |
| `scripts/check-root-hygiene.mjs` | mjs |
| `scripts/close-all-open-prs.sh` | file |
| `scripts/deploy.sh` | file |
| `scripts/export-full-code.mjs` | mjs |
| `scripts/feature-build/generate-features.mjs` | mjs |
| `scripts/gameengin/architect-run.ts` | ts |
| `scripts/gameengin/artisan-run.ts` | ts |
| `scripts/gameengin/maestro-analyze.ts` | ts |
| `scripts/gameengin/mechanic-run.ts` | ts |
| `scripts/gameengin/package-cartridge.ts` | ts |
| `scripts/gameengin/prophet-run.ts` | ts |
| `scripts/gameengin/upgrader-run.ts` | ts |
| `scripts/gameengin/writer-run.ts` | ts |
| `scripts/generate-mobile-nextgen-spec.mjs` | mjs |
| `scripts/generate-mobile-ps5-spec.mjs` | mjs |
| `scripts/generate-webapp-final-form.mjs` | mjs |
| `scripts/law-check.sh` | file |
| `scripts/migrate-imports.sh` | file |
| `scripts/optimize-dreamengin.mjs` | mjs |
| `scripts/postbuild.js` | js |
| `scripts/postbuild.ts` | ts |
| `scripts/score-pass.cjs` | cjs |
| `scripts/setup-database.sql` | sql |
| `scripts/spec-check.cjs` | cjs |
| `scripts/sync-build-memory.mjs` | mjs |
| `scripts/ui-ux-agent.py` | python |
| `scripts/update-bugs.mjs` | mjs |
| `scripts/update-embed-feed.mjs` | mjs |
| `scripts/update-handoff.mjs` | mjs |
| `scripts/update-readme.mjs` | mjs |
| `scripts/validate-schema-sync.sh` | file |
| `scripts/vercel-ignore.cjs` | cjs |
| `scripts/vercel-preflight.cjs` | cjs |
| `src/components/dream.DreamEnginLogo.tsx` | tsx |
| `src/components/dream.LogoHero.tsx` | tsx |
| `src/components/dream.Nav.tsx` | tsx |
| `src/dream/rulesets/homedream/index.ts` | ts |
| `src/dreamsurface/index.ts` | ts |
| `src/engin/core/index.ts` | ts |
| `src/engin/state/base.json` | config |
| `src/launcher.ts` | ts |
| `src/lib/ai/client.ts` | ts |
| `src/lib/babylon/useDreamLogoScene.ts` | ts |
| `styles/theme.css` | css |
| `supabase/config.toml` | config |
| `supabase/migrations/20240120000000_initial_schema.sql` | sql |
| `supabase/migrations/20240120000001_enable_rls.sql` | sql |
| `supabase/migrations/20260129000000_upgrade_schema.sql` | sql |
| `supabase/migrations/20260210_ai_core.sql` | sql |
| `supabase/migrations/20260210000000_widget_system_v2.sql` | sql |
| `supabase/migrations/20260210000001_ai_system_v2026.sql` | sql |
| `supabase/migrations/20260214000000_security_axioms.sql` | sql |
| `supabase/migrations/20260226000000_admin_lock.sql` | sql |
| `supabase/migrations/20260305000000_create_notes.sql` | sql |
| `supabase/migrations/20260305000001_comments.sql` | sql |
| `supabase/migrations/20260305000002_leaderboard.sql` | sql |
| `supabase/migrations/20260307000000_readme_gaps.sql` | sql |
| `supabase/migrations/20260307000001_conversations_messages.sql` | sql |
| `supabase/migrations/20260310000000_widget_instances_visibility.sql` | sql |
| `supabase/migrations/20260310000001_profiles_widget_config.sql` | sql |
| `supabase/migrations/20260310000002_profile_dream_widgets.sql` | sql |
| `supabase/migrations/20260310000003_connector_accounts.sql` | sql |
| `supabase/migrations/20260310000004_feed_items.sql` | sql |
| `supabase/migrations/20260310000010_dreamdm_bar_pass2.sql` | sql |
| `supabase/migrations/20260315000000_content_drafts.sql` | sql |
| `supabase/migrations/20260316000000_visibility_mappings.sql` | sql |
| `supabase/migrations/20260319000000_journey_dots.sql` | sql |
| `supabase/migrations/20260319065444_new-migration.sql` | sql |
| `supabase/migrations/20260319120000_connector_accounts_schema_reload.sql` | sql |
| `supabase/migrations/20260320000000_scheduled_posts.sql` | sql |
| `supabase/migrations/20260320100000_game_scores_all_games.sql` | sql |
| `supabase/migrations/20260320110000_user_blocks.sql` | sql |
| `supabase/migrations/20260321000000_ads_platform_promotions.sql` | sql |
| `supabase/migrations/20260321200000_phase8a_feed_and_layout.sql` | sql |
| `supabase/migrations/20260322000000_phase8b_dream_windows.sql` | sql |
| `supabase/migrations/20260322000000_policy_events.sql` | sql |
| `supabase/migrations/20260322000001_message_boards.sql` | sql |
| `supabase/migrations/20260323100000_embed_feed_items.sql` | sql |
| `supabase/migrations/20260324000000_phase8e_orders.sql` | sql |
| `supabase/migrations/20260324000001_phase8e_shop_marketplace.sql` | sql |
| `supabase/migrations/20260325000000_phase8f_daydream_network.sql` | sql |
| `supabase/migrations/20260325100000_child_safety.sql` | sql |
| `supabase/migrations/20260401000001_platform_utilities.sql` | sql |
| `supabase/migrations/20260402000001_control_mappings.sql` | sql |
| `supabase/migrations/20260402000002_game_assets.sql` | sql |
| `supabase/migrations/20260403000001_pgvector_embeddings.sql` | sql |
| `supabase/migrations/20260403000002_pgvector_search_rpc.sql` | sql |
| `supabase/migrations/20260405000001_dreamr_feed_registry.sql` | sql |
| `supabase/migrations/20260405042406_auto_scaffold.sql` | sql |
| `supabase/migrations/20260413000000_phase9_activity_first_protocol.sql` | sql |
| `supabase/migrations/20260417000000_repurpose_nods_as_dream_docs.sql` | sql |
| `supabase/migrations/20260417000001_dream_docs_search_rpc.sql` | sql |
| `supabase/migrations/20260418000000_gameengin_core.sql` | sql |
| `supabase/migrations/20260420000001_consent_settings_audit.sql` | sql |
| `supabase/migrations/20260426000000_activity_coop_gameengin_completion.sql` | sql |
| `supabase/migrations/20260426000100_rename_widgets_to_dreams.sql` | sql |
| `supabase/migrations/20260426000200_build_memory_schema_gaps.sql` | sql |
| `supabase/schema-final.sql` | sql |
| `supabase/seed.sql` | sql |
| `system/ci/archive/root-workflows/github-actions.yml` | config |
| `tailwindcss-animate.d.ts` | ts |
| `terraform/main.tf` | file |
| `tsconfig.games.json` | config |
| `tsconfig.gamesengin.json` | config |
| `types/ccc.ts` | ts |
| `types/experience.ts` | ts |
| `types/marketplace.ts` | ts |
| `types/rivet-dev-agent-os.d.ts` | ts |
| `VISUAL-SCHEMATIC.md` | doc |
| `workflow/archive/appthemanger-ctrl_DREAMengin_95779c.json` | config |
| `workflow/archive/config.yaml` | config |
| `workflow/archive/docker-compose.yml` | config |
| `workflow/archive/Dockerfile` | config |
| `workflow/archive/Dockerfile.dev` | config |

_Generated by `repo-visualizer/analyzer.mjs`._
<!-- VISUAL-SCHEMATIC:AUTO-GENERATED:END -->

Use the interactive viewer in `repo-visualizer/index.html` (served via `pnpm viz`) for click/zoom/filter exploration.
