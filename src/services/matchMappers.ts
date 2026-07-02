import type {
  ActiveSoloMatch,
  ActiveTeamMatch,
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
import { experienceFromTotalXp, levelFromTotalXp } from './levelCurve';
import {
  formatMatchDistanceMiles,
  formatMatchDuration,
  matchPointsForActivity,
} from './match/matchScoring';

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
  const totalMinutes = Math.floor(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
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
): TeamMatchTeam {
  return {
    id: team.id,
    name: team.name,
    totalPoints,
    accent,
    shieldIcon: team.logo_icon,
    members: members.map((member, index) => mapStoredMember(member, index, accent, idPrefix)),
  };
}

type LiveMember = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
};

export function overlayLiveHomeMembers(
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
    };
  });

  for (const live of liveMembers) {
    if (usedLive.has(live.user_id)) continue;
    merged.push({
      userId: live.user_id,
      name: live.display_name,
      avatarUrl: live.avatar_url ?? undefined,
      level: levelFromTotalXp(live.total_xp),
      points: 0,
      distanceMiles: 0,
      pacePerMile: '--',
    });
  }

  return merged;
}

export function mapTeamMatchRow(
  match: MatchRow,
  homeTeam: TeamRow,
  awayTeam: TeamRow,
  liveHomeMembers: LiveMember[] = [],
): ActiveTeamMatch {
  const state = (match.state_json ?? {}) as TeamMatchState;
  const homeMembers = overlayLiveHomeMembers(state.homeMembers ?? [], liveHomeMembers);
  const awayMembers = state.awayMembers ?? [];

  const homePoints =
    state.homePoints ??
    homeMembers.reduce((sum, member) => sum + (member.points ?? 0), 0);
  const awayPoints =
    state.awayPoints ??
    awayMembers.reduce((sum, member) => sum + (member.points ?? 0), 0);

  return {
    id: match.id,
    endsAt: match.ends_at,
    homeTeam: buildTeamSide(
      homeTeam,
      homeMembers,
      homePoints,
      asTeamAccent(homeTeam.logo_accent, 'lime'),
      'home',
    ),
    awayTeam: buildTeamSide(
      awayTeam,
      awayMembers,
      awayPoints,
      asTeamAccent(awayTeam.logo_accent, 'purple'),
      'away',
    ),
    countdown: countdownFromEndsAt(match.ends_at),
    activities: state.activities ?? [],
  };
}

export function mapSoloMatchRow(
  match: MatchRow,
  homeProfile: Tables<'profiles'>,
  homeProgress: { total_xp: number } | null,
  homePoints: number,
  awayProfile: Tables<'profiles'>,
  awayProgress: { total_xp: number } | null,
  awayPoints: number,
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

  const mappedActivities = mapSoloActivities(activities, homeProfile.id);
  const totalDistance = homeDistance + awayDistance;

  return {
    id: match.id,
    endsAt: match.ends_at,
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
    stats: buildSoloComparisonStats(homeDistance, awayDistance, homeDuration, awayDuration, totalDistance),
    activities: mappedActivities,
    highlights: buildSoloHighlights(mappedActivities, homePoints, awayPoints),
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

function mapSoloActivities(
  activities: Tables<'activities'>[],
  homeUserId: string,
): SoloMatchActivity[] {
  return [...activities]
    .sort(
      (left, right) =>
        new Date(right.started_at).getTime() - new Date(left.started_at).getTime(),
    )
    .slice(0, 5)
    .map((activity) => ({
      id: activity.id,
      dayLabel: formatActivityDayLabel(activity.started_at),
      distanceMiles: (activity.distance_meters ?? 0) / 1609.34,
      durationLabel: formatMatchDuration(activity.duration_seconds ?? 0),
      pointsEarned: matchPointsForActivity(
        activity.distance_meters ?? 0,
        activity.duration_seconds ?? 0,
      ),
      accent: activity.user_id === homeUserId ? 'lime' : 'purple',
    }));
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
): SoloMatchComparisonStat[] {
  const distanceTied = homeDistance === awayDistance;
  const distanceDenominator = distanceTied ? 2 : Math.max(totalDistance, 1);
  const timeTied = homeDuration === awayDuration;
  const timeDenominator = Math.max(homeDuration, awayDuration);

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
      homeProgress: timeTied ? 0.5 : timeDenominator > 0 ? homeDuration / timeDenominator : 0.5,
    },
  ];
}

function buildSoloHighlights(
  activities: SoloMatchActivity[],
  homePoints: number,
  awayPoints: number,
): ActiveSoloMatch['highlights'] {
  const longest = [...activities].sort((left, right) => right.distanceMiles - left.distanceMiles)[0];

  return [
    {
      id: 'scoreboard',
      icon: 'trophy-outline',
      label: 'Match score',
      value: `${homePoints} - ${awayPoints}`,
      subtext: 'Points from synced runs',
      accent: homePoints >= awayPoints ? 'lime' : 'purple',
    },
    ...(longest
      ? [
          {
            id: 'longest-run',
            icon: 'footsteps-outline',
            label: 'Longest run',
            value: `${longest.distanceMiles.toFixed(1)} mi`,
            subtext: longest.dayLabel,
            accent: longest.accent,
          },
        ]
      : []),
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
