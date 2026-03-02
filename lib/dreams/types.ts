export type DreamStatus = 'active' | 'dormant' | 'available';

export type FeedItemType =
  | 'news'
  | 'post'
  | 'music'
  | 'game'
  | 'message'
  | 'metric'
  | 'connector';

export type FeedItem = {
  id: string;
  dreamId: string;
  dreamIcon: string;
  dreamLabel: string;
  type: FeedItemType;
  title: string;
  subtitle?: string;
  url?: string;
  timestamp: number;
  score?: number;
  comments?: number;
};

export type DreamConnector = {
  /** fetch() items for this dream's feed lane */
  fetchItems: () => Promise<FeedItem[]>;
  /** how often to auto-refresh in ms (0 = manual only) */
  refreshMs: number;
};
