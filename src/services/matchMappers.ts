import type {
  ActiveSoloMatch,
  ActiveTeamMatch,
  SoloMatchRunner,
  TeamMatchAccent,
  TeamMatchActivity,
  TeamMatchCountdown,
  TeamMatchParticipant,
  TeamMatchTeam,
  TeamLogoAccent,
} from '../mock';
import { MOCK_ACTIVE_SOLO_MATCH } from '../mock/soloActiveMatch';
import type { Tables } from '../types/database';
import { experienceFromTotalXp, levelFromTotalXp } from './levelCurve';

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

type SoloMatchState = Partial<
  Pick<ActiveSoloMatch, 'info' | 'stats' | 'activities' | 'highlights'>
> & {
  awayRunner?: SoloMatchRunner;
  homePoints?: number;
  awayPoints?: number;
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
  profile: Tables<'profiles'>,
  progress: { total_xp: number } | null,
  participantPoints = 0,
): ActiveSoloMatch {
  const state = (match.state_json ?? {}) as SoloMatchState;
  const totalXp = progress?.total_xp ?? 0;
  const level = levelFromTotalXp(totalXp);
  const awayRunner = state.awayRunner ?? MOCK_ACTIVE_SOLO_MATCH.awayRunner;

  return {
    id: match.id,
    homeRunner: {
      id: profile.id,
      name: profile.display_name,
      level,
      avatarUrl: profile.avatar_url ?? MOCK_ACTIVE_SOLO_MATCH.homeRunner.avatarUrl,
      totalPoints: participantPoints || MOCK_ACTIVE_SOLO_MATCH.homeRunner.totalPoints,
      accent: 'lime',
    },
    awayRunner,
    countdown: countdownFromEndsAt(match.ends_at),
    info: state.info ?? MOCK_ACTIVE_SOLO_MATCH.info,
    stats: state.stats?.length ? state.stats : MOCK_ACTIVE_SOLO_MATCH.stats,
    activities: state.activities?.length ? state.activities : MOCK_ACTIVE_SOLO_MATCH.activities,
    highlights: state.highlights?.length ? state.highlights : MOCK_ACTIVE_SOLO_MATCH.highlights,
  };
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
