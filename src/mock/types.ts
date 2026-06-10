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

export type TeamRole = 'leader' | 'co-leader';

export type TeamRank = {
  rank: number;
  topPercent: string;
  subtitle: string;
};

export type TeamStat = {
  id: string;
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  sublabel?: string;
};

export type TeamMember = {
  id: string;
  rank: number;
  name: string;
  status: string;
  isOnline?: boolean;
  role?: TeamRole;
  avatarUrl?: string;
  level: number;
  distance: string;
  power: string;
};

export type TeamActivity = {
  id: string;
  icon: string;
  variant: AchievementVariant;
  message: string;
  highlight?: string;
  timeAgo: string;
};

export type MatchTab = 'team' | 'solo';

export type MatchRunner = {
  id: string;
  name: string;
  level: number;
  role?: TeamRole;
  avatarUrl?: string;
  seasonAvg: string;
  totalMiles: string;
};

export type MatchType = {
  title: string;
  description: string;
  icon: string;
};

export type Matchmaking = {
  teamName: string;
  powerRating: number;
  teamLevel: number;
  matchType: MatchType;
  maxLineup: number;
  lineup: MatchRunner[];
  available: MatchRunner[];
};

export type Team = {
  id: string;
  name: string;
  tag: string;
  motto: string;
  level: number;
  experience: ProfileExperience;
  teamRank: TeamRank;
  stats: TeamStat[];
  members: TeamMember[];
  memberCount: number;
  memberMax: number;
  activities: TeamActivity[];
};
