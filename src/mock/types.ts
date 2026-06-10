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

export type ProfileRank = {
  title: string;
  subtitle: string;
  icon: string;
};

export type ProfileExperience = {
  currentXp: number;
  nextLevelXp: number;
  nextLevel: number;
};

export type AchievementVariant = 'purple' | 'lime' | 'gold';

export type Achievement = {
  id: string;
  label: string;
  date: string;
  icon: string;
  badgeText?: string;
  variant: AchievementVariant;
};

export type OverallStatLayout = 'grid' | 'wide';

export type OverallStat = {
  id: string;
  icon: string;
  iconColor: string;
  value: string;
  unit?: string;
  label: string;
  sublabel?: string;
  layout?: OverallStatLayout;
};

export type UserProfile = {
  id: string;
  name: string;
  avatarUrl?: string;
  clanName: string;
  level: number;
  rank: ProfileRank;
  experience: ProfileExperience;
  achievements: Achievement[];
  overallStats: OverallStat[];
};
