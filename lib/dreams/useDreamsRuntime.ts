/**
 * lib/dreams/useDreamsRuntime.ts
 *
 * Dreams Space runtime — independent state for the Dreams panel.
 *
 * The Dreams Space is separate from the main home runtime.
 * Opening content here does not affect the home view.
 * Runtime persists while the component is mounted; resets on unmount.
 */

import { useCallback, useState } from 'react';

export type DreamsView = 'feed' | 'detail';

export interface DreamsRuntimeState {
  /** Which view is currently shown in the dreams space */
  view: DreamsView;
  /** The active service/provider (null = no service selected) */
  activeService: string | null;
  /** URL of the item currently open in detail view */
  detailUrl: string | null;
  /** Title of the item currently open in detail view */
  detailTitle: string | null;
}

export interface DreamsRuntime {
  state: DreamsRuntimeState;
  /** Open a feed item in the dreams space detail view */
  openDetail: (url: string, title: string) => void;
  /** Return to the dreams feed view */
  goToFeed: () => void;
  /** Set the active service for the dreams space */
  setService: (service: string | null) => void;
}

const DEFAULT_STATE: DreamsRuntimeState = {
  view: 'feed',
  activeService: null,
  detailUrl: null,
  detailTitle: null,
};

export function useDreamsRuntime(): DreamsRuntime {
  const [state, setState] = useState<DreamsRuntimeState>(DEFAULT_STATE);

  const openDetail = useCallback((url: string, title: string) => {
    setState((prev) => ({
      ...prev,
      view: 'detail',
      detailUrl: url,
      detailTitle: title,
    }));
  }, []);

  const goToFeed = useCallback(() => {
    setState((prev) => ({
      ...prev,
      view: 'feed',
      detailUrl: null,
      detailTitle: null,
    }));
  }, []);

  const setService = useCallback((service: string | null) => {
    setState((prev) => ({
      ...prev,
      activeService: service,
      view: 'feed',
      detailUrl: null,
      detailTitle: null,
    }));
  }, []);

  return { state, openDetail, goToFeed, setService };
}
