export type AdPlacement =
  | 'sidebar_banner'
  | 'feed_inline'
  | 'profile_header'
  | 'music_page'
  | 'lab_sidebar';

export type AdSlot = {
  id: string;
  owner_id?: string;
  placement: AdPlacement;
  active: boolean;
  price_day: number;
  price_week: number;
  created_at?: string;
};

export type ProfileLite = {
  handle: string;
  display_name: string | null;
};

export type AdListing = {
  id: string;
  status?: string;
  ad_slots: AdSlot & { profiles?: ProfileLite };
};

export type AdOrder = {
  id: string;
  buyer_id?: string;
  created_at?: string;
  ad_listings?: AdListing;
};
