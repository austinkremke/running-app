export type FeedTab = 'community' | 'friends' | 'team';

export type RunUser = {
  id: string;
  name: string;
  avatarUrl?: string;
  level: number;
  teamName: string;
};

export type RunStats = {
  distanceMiles: number;
  pacePerMile: string;
  duration: string;
};

export type Run = {
  id: string;
  user: RunUser;
  title: string;
  description: string;
  location: string;
  postedAt: string;
  stats: RunStats;
  photoUrl?: string;
  likes: number;
  comments: number;
  feedTabs: FeedTab[];
};
