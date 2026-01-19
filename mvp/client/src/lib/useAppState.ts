import { useState, useCallback, useEffect } from "react";
import { AppState, DEFAULT_STATE, ModuleId, appStateSchema, moduleIds } from "@shared/schema";

const STORAGE_KEY = "DREAMENGIN_HUB_STATE_V1";

function getMobileAdjustedState(): AppState {
  const isMobile = window.innerWidth < 640;
  if (!isMobile) return DEFAULT_STATE;
  
  const mobileW = Math.min(320, window.innerWidth - 20);
  const mobileH = Math.min(400, window.innerHeight - 160);
  const mobileX = 10;
  const mobileY = 70;
  
  const adjustedWindows = { ...DEFAULT_STATE.windows };
  moduleIds.forEach(id => {
    if (adjustedWindows[id]) {
      adjustedWindows[id] = {
        ...adjustedWindows[id],
        x: mobileX,
        y: mobileY,
        w: mobileW,
        h: Math.min(mobileH, adjustedWindows[id].h),
      };
    }
  });
  
  return { ...DEFAULT_STATE, windows: adjustedWindows };
}

function loadState(): AppState {
  try {
    const mobileDefaults = getMobileAdjustedState();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged = { 
        ...mobileDefaults, 
        ...parsed, 
        notifications: { ...mobileDefaults.notifications, ...parsed.notifications },
        windows: { ...mobileDefaults.windows, ...parsed.windows } 
      };
      const validated = appStateSchema.safeParse(merged);
      if (validated.success) {
        return validated.data;
      }
      console.warn("State validation failed, using defaults");
    }
    return mobileDefaults;
  } catch (e) {
    console.warn("Failed to load state from localStorage", e);
  }
  return getMobileAdjustedState();
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save state to localStorage", e);
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const openModule = useCallback((id: ModuleId) => {
    setState((prev) => {
      const maxZ = Math.max(...Object.values(prev.windows).map((w) => w.z), 0);
      const isMobile = window.innerWidth < 640;
      const currentWindow = prev.windows[id];
      
      let x = currentWindow.x;
      let y = currentWindow.y;
      let w = currentWindow.w;
      let h = currentWindow.h;
      
      if (isMobile) {
        w = Math.min(currentWindow.w, window.innerWidth - 20);
        h = Math.min(currentWindow.h, window.innerHeight - 160);
        x = Math.max(10, (window.innerWidth - w) / 2);
        y = 70;
      }
      
      return {
        ...prev,
        windows: {
          ...prev.windows,
          [id]: { ...currentWindow, open: true, z: maxZ + 1, x, y, w, h },
        },
        notifications: {
          ...prev.notifications,
          [id]: 0,
        },
      };
    });
  }, []);

  const closeModule = useCallback((id: ModuleId) => {
    setState((prev) => ({
      ...prev,
      windows: {
        ...prev.windows,
        [id]: { ...prev.windows[id], open: false },
      },
    }));
  }, []);

  const minimizeModule = useCallback((id: ModuleId) => {
    setState((prev) => ({
      ...prev,
      windows: {
        ...prev.windows,
        [id]: { ...prev.windows[id], open: false },
      },
    }));
  }, []);

  const bringToFront = useCallback((id: ModuleId) => {
    setState((prev) => {
      const maxZ = Math.max(...Object.values(prev.windows).map((w) => w.z), 0);
      return {
        ...prev,
        windows: {
          ...prev.windows,
          [id]: { ...prev.windows[id], z: maxZ + 1 },
        },
      };
    });
  }, []);

  const updateWindowPosition = useCallback((id: ModuleId, x: number, y: number) => {
    setState((prev) => ({
      ...prev,
      windows: {
        ...prev.windows,
        [id]: { ...prev.windows[id], x, y },
      },
    }));
  }, []);

  const updateWindowSize = useCallback((id: ModuleId, w: number, h: number) => {
    setState((prev) => ({
      ...prev,
      windows: {
        ...prev.windows,
        [id]: { ...prev.windows[id], w, h },
      },
    }));
  }, []);

  const toggleFocus = useCallback(() => {
    setState((prev) => ({ ...prev, focus: !prev.focus }));
  }, []);

  const minimizeAll = useCallback(() => {
    setState((prev) => {
      const windows = { ...prev.windows };
      Object.keys(windows).forEach((key) => {
        windows[key] = { ...windows[key], open: false };
      });
      return { ...prev, windows };
    });
  }, []);

  const closeAll = useCallback(() => {
    setState((prev) => {
      const windows = { ...prev.windows };
      Object.keys(windows).forEach((key) => {
        windows[key] = { ...windows[key], open: false };
      });
      return { ...prev, windows };
    });
  }, []);

  const showAll = useCallback(() => {
    setState((prev) => ({ ...prev, focus: false }));
  }, []);

  return {
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
  };
}
