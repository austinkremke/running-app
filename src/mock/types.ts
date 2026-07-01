import type { GpsPoint } from '../maps/types';

export type FeedTab = 'community' | 'friends' | 'team';

export type RunUser = {
  id: string;
  name: string;
  avatarUrl?: string;
  level: number;
  teamName: string;
  rankTierId?: string;
};

export type RunStats = {
  distanceMiles: number;
  pacePerMile: string;
  duration: string;
  durationUnit?: string;
};

export type RunPaceHighlight = {
  label: string;
  value: string;
  detail: string;
};

export type Run = {
  id: string;
  user: RunUser;
  title: string;
  description: string;
  location: string;
  postedAt: string;
  stats: RunStats;
  routePoints: GpsPoint[];
  photoUrl?: string;
  paceHighlight?: RunPaceHighlight;
  likes: number;
  comments: number;
  likedByMe: boolean;
  feedTabs: FeedTab[];
};

export type FeedComment = {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  postedAt: string;
};

export type ProfileRank = {
  title: string;
  subtitle: string;
  icon: string;
  tierId?: string;
  competitiveRating?: number;
};

export type ProfileExperience = {
  currentXp: number;
  nextLevelXp: number;
  nextLevel: number;
};

export type { XpGainEvent, XpGainRunSummary, XpGainSegment } from '../types/progression';

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

export type TeamMatchFormat = {
  title: string;
  durationLabel: string;
  winCondition: string;
  overview: string;
  scoringDetails: string;
};

export type Matchmaking = {
  teamName: string;
  powerRating: number;
  teamLevel: number;
  shieldIcon: string;
  shieldAccent: TeamLogoAccent;
  matchFormat: TeamMatchFormat;
  maxLineup: number;
  lineup: MatchRunner[];
  available: MatchRunner[];
};

export type SoloSeasonRecord = {
  wins: number;
  losses: number;
  bestStreak: number;
};

export type ChallengeFriend = {
  id: string;
  name: string;
  level: number;
  avatarUrl?: string;
  isOnline?: boolean;
};

export type ProposedChallenge = {
  friend: ChallengeFriend;
  sentAt: string;
};

export type SoloMatchmaking = {
  name: string;
  avatarUrl: string;
  level: number;
  rankTitle: string;
  rankIcon: string;
  matchFormat: TeamMatchFormat;
  seasonRecord: SoloSeasonRecord;
};

export type TeamMatchAccent = 'lime' | 'purple';

export type TeamMatchChallengeStats = {
  distanceMiles: number;
  pacePerMile: string;
};

export type TeamMatchParticipant = {
  id: string;
  name: string;
  level: number;
  avatarUrl?: string;
  points: number;
  challengeStats: TeamMatchChallengeStats;
  isLeader?: boolean;
};

export type TeamMatchTeam = {
  id: string;
  name: string;
  totalPoints: number;
  accent: TeamMatchAccent;
  shieldIcon: string;
  members: TeamMatchParticipant[];
};

export type TeamChatMessage = {
  id: string;
  authorName: string;
  avatarUrl?: string;
  body: string;
  sentAt: string;
  isCurrentUser?: boolean;
};

export type TeamMatchActivity = {
  id: string;
  avatarUrl?: string;
  playerName: string;
  description: string;
  pointsEarned: number;
  timeAgo: string;
  accent: TeamMatchAccent;
};

export type TeamMatchCountdown = {
  days: number;
  hours: number;
  minutes: number;
};

export type ActiveTeamMatch = {
  id: string;
  homeTeam: TeamMatchTeam;
  awayTeam: TeamMatchTeam;
  countdown: TeamMatchCountdown;
  activities: TeamMatchActivity[];
};

export type SoloMatchRunner = {
  id: string;
  name: string;
  level: number;
  avatarUrl: string;
  totalPoints: number;
  accent: TeamMatchAccent;
};

export type SoloMatchInfo = {
  rank: number;
  rankPercentile: string;
  matchType: string;
  matchTypeIcon: string;
  entryFee: number;
  entryFeeLabel: string;
};

export type SoloMatchComparisonStat = {
  id: string;
  label: string;
  icon: string;
  homeValue: string;
  awayValue: string;
  homeProgress: number;
};

export type SoloMatchActivity = {
  id: string;
  dayLabel: string;
  distanceMiles: number;
  durationLabel: string;
  pointsEarned: number;
  accent: TeamMatchAccent;
};

export type SoloMatchHighlight = {
  id: string;
  icon: string;
  label: string;
  value: string;
  subtext: string;
  accent?: TeamMatchAccent;
};

export type ActiveSoloMatch = {
  id: string;
  homeRunner: SoloMatchRunner;
  awayRunner: SoloMatchRunner;
  countdown: TeamMatchCountdown;
  info: SoloMatchInfo;
  stats: SoloMatchComparisonStat[];
  activities: SoloMatchActivity[];
  highlights: SoloMatchHighlight[];
};

export type TeamLogoAccent = 'lime' | 'purple' | 'gold' | 'silver' | 'cyan' | 'blue';

export type Team = {
  id: string;
  name: string;
  tag: string;
  motto: string;
  level: number;
  experience: ProfileExperience;
  teamRank: TeamRank;
  shieldIcon: string;
  shieldAccent: TeamLogoAccent;
  stats: TeamStat[];
  members: TeamMember[];
  memberCount: number;
  memberMax: number;
  activities: TeamActivity[];
};

export type TopTeamsTab = 'rankings' | 'trending' | 'new' | 'nearby';

export type TopTeamListing = {
  id: string;
  rank: number;
  name: string;
  tag: string;
  motto: string;
  level: number;
  memberCount: number;
  memberMax: number;
  clanRank: number;
  totalPoints: number;
  shieldIcon: string;
  shieldAccent: TeamLogoAccent;
};

export type PostRunChartTab = 'pace' | 'elevation' | 'heartRate';

export type PostRunChartPoint = {
  distanceMiles: number;
  value: number;
};

export type PostRunSummary = {
  completedAtLabel: string;
  distanceMiles: number;
  duration: string;
  durationUnit: string;
  avgPace: string;
  avgPaceUnit: string;
  calories: number;
  caloriesUnit: string;
  avgHeartRate: number;
  avgHeartRateUnit: string;
  elevationGain: number;
  elevationGainUnit: string;
  weatherTempF?: number;
  photos: string[];
  chartData: Record<PostRunChartTab, PostRunChartPoint[]>;
  chartReferenceLines: Partial<Record<PostRunChartTab, number>>;
};
