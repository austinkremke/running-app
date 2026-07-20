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
  likes: number;
  comments: number;
  likedByMe: boolean;
  feedTabs: FeedTab[];
  /** Set when this run counted toward an active/completed match. */
  matchId?: string;
  /** Raw ISO timestamp — used only to sort mixed feed item types together. */
  postedAtIso?: string;
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
  nextRankGoal?: ProfileNextRankGoal | null;
};

export type ProfileNextRankGoal = {
  nextTierId: string;
  nextTierTitle: string;
  pointsNeeded: number;
  progress: number;
  currentRating: number;
  nextTierMinRating: number;
  currentTierMinRating: number;
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
  /** When set, the card is tappable and opens a weekly-trend detail view for this metric. */
  metricKey?: StatMetricKey;
};

export type StatMetricKey = 'distance' | 'calories' | 'time' | 'pace' | 'elevation' | 'runs';

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
  tierId?: string;
  tierTitle?: string;
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
  id: string;
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
  logoUrl?: string;
  rankTierId?: string;
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
  run?: Run;
};

export type TeamMatchCountdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export type ActiveTeamMatch = {
  id: string;
  endsAt: string;
  homeTeam: TeamMatchTeam;
  awayTeam: TeamMatchTeam;
  countdown: TeamMatchCountdown;
  activities: TeamMatchActivity[];
};

export type TeamMatchHistorySide = {
  id: string;
  name: string;
  accent: TeamLogoAccent;
  shieldIcon: string;
  logoUrl?: string;
  rankTierId?: string;
};

export type TeamMatchHistoryEntry = {
  id: string;
  endsAt: string;
  homeTeam: TeamMatchHistorySide;
  awayTeam: TeamMatchHistorySide;
  homePoints: number;
  awayPoints: number;
  outcome: 'win' | 'loss' | 'tie';
};

/** A completed team match's feed post — reuses feed_posts likes/comments. */
export type TeamMatchFeedPost = {
  /** feed_posts.id — used for likes/comments, same as a run's post id. */
  id: string;
  matchId: string;
  endsAt: string;
  postedAtIso: string;
  homeTeam: TeamMatchHistorySide;
  awayTeam: TeamMatchHistorySide;
  homePoints: number;
  awayPoints: number;
  /** Absolute result (not viewer-relative) — who actually won. */
  result: 'home' | 'away' | 'tie';
  likes: number;
  comments: number;
  likedByMe: boolean;
};

/** A completed 1v1 solo match's feed post — reuses feed_posts likes/comments. */
export type SoloMatchFeedPost = {
  /** feed_posts.id — used for likes/comments, same as a run's post id. */
  id: string;
  matchId: string;
  endsAt: string;
  postedAtIso: string;
  homeRunner: SoloMatchRunner;
  awayRunner: SoloMatchRunner;
  homePoints: number;
  awayPoints: number;
  /** Absolute result (not viewer-relative) — who actually won. */
  result: 'home' | 'away' | 'tie';
  likes: number;
  comments: number;
  likedByMe: boolean;
};

export type SoloMatchRunner = {
  id: string;
  name: string;
  level: number;
  avatarUrl: string;
  totalPoints: number;
  accent: TeamMatchAccent;
  rankTierId?: string;
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
  avatarUrl?: string;
  dayLabel: string;
  distanceMiles: number;
  durationLabel: string;
  pointsEarned: number;
  accent: TeamMatchAccent;
  run?: Run;
};

export type ActiveSoloMatch = {
  id: string;
  endsAt: string;
  homeRunner: SoloMatchRunner;
  awayRunner: SoloMatchRunner;
  countdown: TeamMatchCountdown;
  info: SoloMatchInfo;
  stats: SoloMatchComparisonStat[];
  activities: SoloMatchActivity[];
};

export type TeamLogoAccent = 'lime' | 'purple' | 'gold' | 'silver' | 'cyan' | 'blue';

export type Team = {
  id: string;
  name: string;
  tag: string;
  motto: string;
  level: number;
  competitiveRating: number;
  teamRank: TeamRank;
  shieldIcon: string;
  shieldAccent: TeamLogoAccent;
  logoUrl?: string;
  stats: TeamStat[];
  members: TeamMember[];
  memberCount: number;
  memberMax: number;
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
  logoUrl?: string;
  rankTierId?: string;
};

export type PostRunChartTab = 'pace' | 'elevation' | 'heartRate';

export type PostRunChartPoint = {
  distanceMiles: number;
  value: number;
};

export type MileSplit = {
  /** 1-indexed mile number (1, 2, 3 …). The final split may be partial. */
  mile: number;
  /** Distance covered in this split — 1.0 for full miles, < 1 for the last partial mile. */
  distanceMiles: number;
  /** Pace in seconds per mile for this split (normalized, so comparable across partial miles). */
  paceSeconds: number;
  /** Net elevation change over the split, in feet (positive = climb). */
  elevationChangeFt: number;
  isPartial: boolean;
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
  /** Per-mile splits; absent on runs recorded before milestone 08. */
  splits?: MileSplit[];
};
