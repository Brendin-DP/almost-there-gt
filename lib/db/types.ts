export type Admin = {
  id: string;
  email: string;
  password: string;
  created_at: string;
};

export type Creator = {
  id: string;
  name: string;
  /** Public channel display name (e.g. YouTube channel title). */
  channel_name: string;
  youtube_channel_id: string;
  profile_image_url: string | null;
  youtube_url: string | null;
  twitch_url: string | null;
  twitter_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type Snapshot = {
  id: string;
  creator_id: string;
  subscriber_count: number;
  recorded_at: string;
  created_at: string;
};

export type Milestone = {
  id: string;
  creator_id: string;
  target_count: number;
  label: string;
  achieved_at: string | null;
  created_at: string;
};

export type MockDb = {
  admins: Admin[];
  creators: Creator[];
  snapshots: Snapshot[];
  milestones: Milestone[];
};
