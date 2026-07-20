import type {
  ActiveSoloMatch,
  ActiveTeamMatch,
  Run,
  SoloMatchActivity,
  SoloMatchComparisonStat,
  SoloMatchRunner,
  TeamMatchAccent,
  TeamMatchActivity,
  TeamMatchCountdown,
  TeamMatchParticipant,
  TeamMatchTeam,
  TeamLogoAccent,
} from '../mock';
import type { Tables } from '../types/database';
import { polylineToGpsPoints } from './activityAdapters';
import { formatDurationParts, formatPace, metersToMiles } from './distanceService';
import { experienceFromTotalXp, levelFromTotalXp } from './levelCurve';
import {
  formatMatchDistanceMiles,
  formatMatchDuration,
  matchPointsForActivity,
} from './match/matchScoring';
import { formatRelativeTime } from '../utils/formatRelativeTime';

type MatchRow = Tables<'matches'>;
type TeamRow = Tables<'teams'>;

type TeamMatchState = {
  activities?: TeamMatchActivity[];
  homeMembers?: StoredMember[];
  awayMembers?: StoredMember[];
  homePoints?: number;
  awayPoints?: number;
};

type StoredMember = {
  userId?: string;
  name: string;
  level?: number;
  points?: number;
  distanceMiles?: number;
  pacePerMile?: string;
  isLeader?: boolean;
  avatarUrl?: string;
};

const LOGO_ACCENTS = new Set<TeamLogoAccent>(['lime', 'purple', 'gold', 'silver', 'cyan', 'blue']);

function asTeamAccent(value: string | null | undefined, fallback: TeamMatchAccent): TeamMatchAccent {
  return value === 'lime' || value === 'purple' ? value : fallback;
}

function asLogoAccent(value: string | null | undefined): TeamLogoAccent {
  return LOGO_ACCENTS.has(value as TeamLogoAccent) ? (value as TeamLogoAccent) : 'lime';
}

export function countdownFromEndsAt(endsAt: string): TeamMatchCountdown {
  const remainingMs = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

export function isMatchTimerExpired(endsAt: string | null | undefined): boolean {
  if (!endsAt) {
    return false;
  }

  return new Date(endsAt).getTime() <= Date.now();
}

export function formatMatchCountdownLabel(countdown: TeamMatchCountdown): string {
  const totalSeconds =
    countdown.days * 86_400 +
    countdown.hours * 3_600 +
    countdown.minutes * 60 +
    countdown.seconds;

  if (totalSeconds <= 0) {
    return 'MATCH ENDED';
  }

  if (totalSeconds < 60) {
    return `ENDS IN ${countdown.seconds}S`;
  }

  return `ENDS IN ${countdown.days}D ${countdown.hours}H ${countdown.minutes}M`;
}

function mapStoredMember(
  member: StoredMember,
  index: number,
  accent: TeamMatchAccent,
  fallbackIdPrefix: string,
): TeamMatchParticipant {
  return {
    id: member.userId ?? `${fallbackIdPrefix}-${index}`,
    name: member.name,
    level: member.level ?? 1,
    avatarUrl: member.avatarUrl,
    points: member.points ?? 0,
    challengeStats: {
      distanceMiles: member.distanceMiles ?? 0,
      pacePerMile: member.pacePerMile ?? '--',
    },
    isLeader: member.isLeader,
  };
}

function buildTeamSide(
  team: TeamRow,
  members: StoredMember[],
  totalPoints: number,
  accent: TeamMatchAccent,
  idPrefix: string,
  rankTierId?: string,
): TeamMatchTeam {
  return {
    id: team.id,
    name: team.name,
    totalPoints,
    accent,
    shieldIcon: team.logo_icon,
    logoUrl: team.logo_url ?? undefined,
    rankTierId,
    members: members.map((member, index) => mapStoredMember(member, index, accent, idPrefix)),
  };
}

type LiveMember = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  points?: number;
  distanceMiles?: number;
  pacePerMile?: string;
};

export function overlayLiveMembers(
  members: StoredMember[],
  liveMembers: LiveMember[],
): StoredMember[] {
  if (liveMembers.length === 0) {
    return members;
  }

  const seeded = [...members];
  const usedLive = new Set<string>();

  const merged = seeded.map((member) => {
    const live =
      liveMembers.find((row) => row.user_id === member.userId) ??
      liveMembers.find(
        (row) =>
          !usedLive.has(row.user_id) &&
          row.display_name.toLowerCase() === member.name.toLowerCase(),
      );

    if (!live) {
      return member;
    }

    usedLive.add(live.user_id);
    return {
      ...member,
      userId: live.user_id,
      name: live.display_name,
      avatarUrl: live.avatar_url ?? member.avatarUrl,
      level: levelFromTotalXp(live.total_xp),
      points: live.points ?? member.points,
      distanceMiles: live.distanceMiles ?? member.distanceMiles,
      pacePerMile: live.pacePerMile ?? member.pacePerMile,
    };
  });

  for (const live of liveMembers) {
    if (usedLive.has(live.user_id)) continue;
    merged.push({
      userId: live.user_id,
      name: live.display_name,
      avatarUrl: live.avatar_url ?? undefined,
      level: levelFromTotalXp(live.total_xp),
      points: live.points ?? 0,
      distanceMiles: live.distanceMiles ?? 0,
      pacePerMile: live.pacePerMile ?? '--',
    });
  }

  return merged;
}

export function mapTeamMatchRow(
  match: MatchRow,
  homeTeam: TeamRow,
  awayTeam: TeamRow,
  liveHomeMembers: LiveMember[] = [],
  liveAwayMembers: LiveMember[] = [],
  homeRankTierId?: string,
  awayRankTierId?: string,
  liveActivities: TeamMatchActivity[] = [],
): ActiveTeamMatch {
  const state = (match.state_json ?? {}) as TeamMatchState;
  const homeMembers = overlayLiveMembers(state.homeMembers ?? [], liveHomeMembers);
  const awayMembers = overlayLiveMembers(state.awayMembers ?? [], liveAwayMembers);

  const homePoints =
    state.homePoints ??
    homeMembers.reduce((sum, member) => sum + (member.points ?? 0), 0);
  const awayPoints =
    state.awayPoints ??
    awayMembers.reduce((sum, member) => sum + (member.points ?? 0), 0);

  return {
    id: match.id,
    endsAt: match.ends_at,
    status: match.status === 'completed' ? 'completed' : 'active',
    homeTeam: buildTeamSide(
      homeTeam,
      homeMembers,
      homePoints,
      asTeamAccent(homeTeam.logo_accent, 'lime'),
      'home',
      homeRankTierId,
    ),
    awayTeam: buildTeamSide(
      awayTeam,
      awayMembers,
      awayPoints,
      asTeamAccent(awayTeam.logo_accent, 'purple'),
      'away',
      awayRankTierId,
    ),
    countdown: countdownFromEndsAt(match.ends_at),
    activities: liveActivities.length > 0 ? liveActivities : (state.activities ?? []),
  };
}

export function mapSoloMatchRow(
  match: MatchRow,
  homeProfile: Tables<'profiles'>,
  homeProgress: { total_xp: number; streak_days?: number } | null,
  awayProfile: Tables<'profiles'>,
  awayProgress: { total_xp: number; streak_days?: number } | null,
  activities: Tables<'activities'>[] = [],
  matchType?: Tables<'match_types'> | null,
  homeRating = 1000,
  homeRankTierId?: string,
  awayRankTierId?: string,
): ActiveSoloMatch {
  const homeLevel = levelFromTotalXp(homeProgress?.total_xp ?? 0);
  const awayLevel = levelFromTotalXp(awayProgress?.total_xp ?? 0);

  const homeDistance = sumDistanceForUser(activities, homeProfile.id);
  const awayDistance = sumDistanceForUser(activities, awayProfile.id);
  const homeDuration = sumDurationForUser(activities, homeProfile.id);
  const awayDuration = sumDurationForUser(activities, awayProfile.id);

  // Recomputed fresh from synced activities rather than trusting
  // match_participants.points — that column only updates via the
  // credit_match_activity RPC, which can silently fail or be skipped, so it
  // can lag behind (or never reflect) what the activity feed already shows.
  const homePoints = sumPointsForUser(activities, homeProfile.id);
  const awayPoints = sumPointsForUser(activities, awayProfile.id);

  const mappedActivities = mapSoloActivities(
    activities,
    homeProfile,
    awayProfile,
    homeProgress?.total_xp ?? 0,
    awayProgress?.total_xp ?? 0,
  );
  const totalDistance = homeDistance + awayDistance;
  const totalDuration = homeDuration + awayDuration;

  return {
    id: match.id,
    endsAt: match.ends_at,
    status: match.status === 'completed' ? 'completed' : 'active',
    homeRunner: buildSoloRunner(homeProfile, homeLevel, homePoints, 'lime', homeRankTierId),
    awayRunner: buildSoloRunner(awayProfile, awayLevel, awayPoints, 'purple', awayRankTierId),
    countdown: countdownFromEndsAt(match.ends_at),
    info: {
      rank: homeRating,
      rankPercentile: 'Season rating',
      matchType: matchType?.display_name ?? 'Distance',
      matchTypeIcon: 'footsteps',
      entryFee: 0,
      entryFeeLabel: 'Ranked duel',
    },
    stats: buildSoloComparisonStats(homeDistance, awayDistance, homeDuration, awayDuration, totalDistance, totalDuration),
    activities: mappedActivities,
  };
}

function buildSoloRunner(
  profile: Tables<'profiles'>,
  level: number,
  totalPoints: number,
  accent: TeamMatchAccent,
  rankTierId?: string,
): SoloMatchRunner {
  return {
    id: profile.id,
    name: profile.display_name,
    level,
    avatarUrl: profile.avatar_url ?? '',
    totalPoints,
    accent,
    rankTierId,
  };
}

function sumDistanceForUser(activities: Tables<'activities'>[], userId: string): number {
  return activities
    .filter((activity) => activity.user_id === userId)
    .reduce((sum, activity) => sum + (activity.distance_meters ?? 0), 0);
}

function sumDurationForUser(activities: Tables<'activities'>[], userId: string): number {
  return activities
    .filter((activity) => activity.user_id === userId)
    .reduce((sum, activity) => sum + (activity.duration_seconds ?? 0), 0);
}

function sumPointsForUser(activities: Tables<'activities'>[], userId: string): number {
  return activities
    .filter((activity) => activity.user_id === userId)
    .reduce((sum, activity) => sum + matchPointsForActivity(activity.distance_meters ?? 0, activity.duration_seconds ?? 0), 0);
}

function buildRunFromSoloMatchActivity(
  activity: Tables<'activities'>,
  profile: Tables<'profiles'>,
  totalXp: number,
): Run {
  const distanceMiles = metersToMiles(activity.distance_meters ?? 0);
  const paceSecPerMile = distanceMiles > 0 ? (activity.duration_seconds ?? 0) / distanceMiles : 0;
  const duration = formatDurationParts(activity.duration_seconds ?? 0);

  return {
    id: activity.id,
    user: {
      id: profile.id,
      name: profile.display_name,
      avatarUrl: profile.avatar_url ?? undefined,
      level: levelFromTotalXp(totalXp),
      teamName: '',
    },
    title: 'Completed a run',
    description: '',
    location: '',
    postedAt: formatRelativeTime(activity.started_at),
    stats: {
      distanceMiles: Number(distanceMiles.toFixed(2)),
      pacePerMile: formatPace(paceSecPerMile),
      duration: duration.value,
      durationUnit: duration.unit,
    },
    routePoints: polylineToGpsPoints(activity.polyline, activity.started_at),
    likes: 0,
    comments: 0,
    likedByMe: false,
    feedTabs: [],
    matchId: activity.match_id ?? undefined,
  };
}

function mapSoloActivities(
  activities: Tables<'activities'>[],
  homeProfile: Tables<'profiles'>,
  awayProfile: Tables<'profiles'>,
  homeTotalXp: number,
  awayTotalXp: number,
): SoloMatchActivity[] {
  return [...activities]
    .sort(
      (left, right) =>
        new Date(right.started_at).getTime() - new Date(left.started_at).getTime(),
    )
    .map((activity) => {
      const isHome = activity.user_id === homeProfile.id;
      const profile = isHome ? homeProfile : awayProfile;
      const totalXp = isHome ? homeTotalXp : awayTotalXp;

      return {
        id: activity.id,
        avatarUrl: profile.avatar_url ?? undefined,
        dayLabel: formatActivityDayLabel(activity.started_at),
        distanceMiles: (activity.distance_meters ?? 0) / 1609.34,
        durationLabel: formatMatchDuration(activity.duration_seconds ?? 0),
        pointsEarned: matchPointsForActivity(
          activity.distance_meters ?? 0,
          activity.duration_seconds ?? 0,
        ),
        accent: isHome ? 'lime' : 'purple',
        run: buildRunFromSoloMatchActivity(activity, profile, totalXp),
      };
    });
}

function formatActivityDayLabel(startedAt: string): string {
  const started = new Date(startedAt);
  const today = new Date();
  const startedDay = new Date(started.getFullYear(), started.getMonth(), started.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((todayDay.getTime() - startedDay.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  return started.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function buildSoloComparisonStats(
  homeDistance: number,
  awayDistance: number,
  homeDuration: number,
  awayDuration: number,
  totalDistance: number,
  totalDuration: number,
): SoloMatchComparisonStat[] {
  const distanceTied = homeDistance === awayDistance;
  const distanceDenominator = distanceTied ? 2 : Math.max(totalDistance, 1);
  const timeTied = homeDuration === awayDuration;
  const timeDenominator = timeTied ? 2 : Math.max(totalDuration, 1);

  return [
    {
      id: 'distance',
      label: 'Distance',
      icon: 'footsteps-outline',
      homeValue: formatMatchDistanceMiles(homeDistance),
      awayValue: formatMatchDistanceMiles(awayDistance),
      homeProgress: distanceTied ? 0.5 : homeDistance / distanceDenominator,
    },
    {
      id: 'time',
      label: 'Moving time',
      icon: 'time-outline',
      homeValue: formatMatchDuration(homeDuration),
      awayValue: formatMatchDuration(awayDuration),
      homeProgress: timeTied ? 0.5 : homeDuration / timeDenominator,
    },
  ];
}


export function mapMatchmakingFromTeam(team: TeamRow, memberCount: number) {
  const experience = experienceFromTotalXp(memberCount * 250);
  return {
    teamName: team.name,
    powerRating: memberCount * 300,
    teamLevel: Math.max(1, memberCount + 20),
    shieldIcon: team.logo_icon,
    shieldAccent: asLogoAccent(team.logo_accent),
    memberCount,
    experience,
  };
}
