import { RuntimeBackground } from "@/components/RuntimeBackground";
import { StatusBar } from "@/components/StatusBar";
import { UserProfileCard } from "@/components/UserProfileCard";
import { AppGrid } from "@/components/AppGrid";
import { StreamingDeck } from "@/components/StreamingDeck";
import { GamingDeck } from "@/components/GamingDeck";
import { MoreAppsGrid } from "@/components/MoreAppsGrid";
import { EmpireFeed } from "@/components/EmpireFeed";
import { InfoCard } from "@/components/InfoCard";
import { Dock } from "@/components/Dock";
import { ModuleLayer } from "@/components/ModuleLayer";
import { useAppState } from "@/lib/useAppState";

export default function Home() {
  const {
    state,
    openModule,
    closeModule,
    minimizeModule,
    bringToFront,
    updateWindowPosition,
    updateWindowSize,
    toggleFocus,
    minimizeAll,
    closeAll,
    showAll,
  } = useAppState();
  

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <RuntimeBackground />

      <StatusBar
        onFocus={toggleFocus}
        onShowAll={showAll}
        isFocused={state.focus}
      />

      <div
        className="relative h-screen overflow-y-auto pt-[72px] pb-24 scroll-smooth"
        data-testid="homescreen"
      >
        <div className="w-[min(1120px,94vw)] mx-auto">
          <div className="grid gap-[18px] md:grid-cols-[minmax(0,3.1fr)_minmax(260px,1.5fr)] grid-cols-1">
            <div className="min-w-0">
              <UserProfileCard onOpenModule={openModule} />
              <AppGrid notifications={state.notifications} onOpenModule={openModule} />
              <MoreAppsGrid notifications={state.notifications} onOpenModule={openModule} />
              <InfoCard />
              
              <div className="md:hidden mt-4 space-y-4">
                <GamingDeck notifications={state.notifications} onOpenModule={openModule} />
                <StreamingDeck onOpenModule={openModule} />
                <EmpireFeed drops={state.drops} />
              </div>
            </div>

            <div className="space-y-4 hidden md:block">
              <GamingDeck notifications={state.notifications} onOpenModule={openModule} />
              <StreamingDeck onOpenModule={openModule} />
              <EmpireFeed drops={state.drops} />
            </div>
          </div>
        </div>
      </div>

      <ModuleLayer
        windows={state.windows}
        focusMode={state.focus}
        onClose={closeModule}
        onMinimize={minimizeModule}
        onBringToFront={bringToFront}
        onUpdatePosition={updateWindowPosition}
        onUpdateSize={updateWindowSize}
      />

      <Dock
        notifications={state.notifications}
        onOpenModule={openModule}
        onToggleFocus={toggleFocus}
        onMinimizeAll={minimizeAll}
        onCloseAll={closeAll}
      />
    </div>
  );
}
