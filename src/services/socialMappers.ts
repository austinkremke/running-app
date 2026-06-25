import type { PostRunSummary, Run, RunStats, Team, TeamLogoAccent, TeamMember, TopTeamListing } from '../mock';
import type { Tables } from '../types/database';
import { metersToMiles, formatPace } from './distanceService';
import { experienceFromTotalXp, levelFromTotalXp } from './levelCurve';
import { formatRelativeTime } from '../utils/formatRelativeTime';

type FeedPostRow = Tables<'feed_posts'>;
type ProfileRow = Tables<'profiles'>;
type ActivityRow = Tables<'activities'>;
type TeamRow = Tables<'teams'>;
type TeamMemberRow = Tables<'team_members'>;

export const ROAD_WARRIORS_TEAM_ID = '11111111-1111-4111-8111-111111111111';

const LOGO_ACCENTS = new Set<TeamLogoAccent>(['lime', 'purple', 'gold', 'silver', 'cyan', 'blue']);

function asLogoAccent(value: string): TeamLogoAccent {
  return LOGO_ACCENTS.has(value as TeamLogoAccent) ? (value as TeamLogoAccent) : 'lime';
}

function summaryFromActivity(activity: ActivityRow): PostRunSummary | null {
  if (!activity.summary_json || typeof activity.summary_json !== 'object') {
    return null;
  }

  return activity.summary_json as PostRunSummary;
}

function statsFromActivity(activity: ActivityRow): RunStats {
  const summary = summaryFromActivity(activity);

  if (summary) {
    return {
      distanceMiles: summary.distanceMiles,
      pacePerMile: `${summary.avgPace}${summary.avgPaceUnit}`,
      duration: `${summary.duration}${summary.durationUnit ? ` ${summary.durationUnit}` : ''}`.trim(),
    };
  }

  const distanceMiles = metersToMiles(activity.distance_meters);
  const paceSeconds =
    distanceMiles > 0 ? activity.duration_seconds / distanceMiles : 0;

  return {
    distanceMiles: Number(distanceMiles.toFixed(2)),
    pacePerMile: paceSeconds > 0 ? `${formatPace(paceSeconds)}/mi` : '--',
    duration: `${Math.floor(activity.duration_seconds / 60)} min`,
  };
}

export function mapFeedPostToRun(
  post: FeedPostRow,
  profile: ProfileRow & { player_progress?: { total_xp: number } | null },
  activity: ActivityRow,
  teamName: string | null,
): Run {
  const totalXp = profile.player_progress?.total_xp ?? 0;
  const audiences = post.audiences ?? ['community'];

  return {
    id: post.id,
    user: {
      id: profile.id,
      name: profile.display_name,
      avatarUrl: profile.avatar_url ?? undefined,
      level: levelFromTotalXp(totalXp),
      teamName: teamName ?? 'No team',
    },
    title: post.title || 'Completed a run',
    description: post.description,
    location: post.location,
    postedAt: formatRelativeTime(post.created_at),
    stats: statsFromActivity(activity),
    photoUrl: post.photo_url ?? undefined,
    likes: 0,
    comments: 0,
    feedTabs: audiences.filter(
      (tab): tab is Run['feedTabs'][number] =>
        tab === 'community' || tab === 'friends' || tab === 'team',
    ),
  };
}

type TeamMemberSource = TeamMemberRow & {
  profiles: ProfileRow & {
    player_progress: { total_xp: number } | null;
    player_rank: { competitive_rating: number } | null;
  };
};

export function mapTeamMemberRow(
  member: TeamMemberSource,
  rank: number,
): TeamMember {
  const totalXp = member.profiles.player_progress?.total_xp ?? 0;
  const rating = member.profiles.player_rank?.competitive_rating ?? 1000;

  return {
    id: member.user_id,
    rank,
    name: member.profiles.display_name,
    status: 'Offline',
    avatarUrl: member.profiles.avatar_url ?? undefined,
    level: levelFromTotalXp(totalXp),
    distance: '0 mi',
    power: `${rating.toLocaleString()} PWR`,
    role:
      member.role === 'leader' || member.role === 'co-leader'
        ? member.role
        : undefined,
  };
}

export function mapTeamRow(
  team: TeamRow,
  members: TeamMember[],
  memberCount: number,
): Team {
  const totalXp = members.reduce((sum, member) => sum + member.level * 100, 0);
  const avgRating = members.length
    ? members.reduce((sum, member) => sum + Number(member.power.replace(/[^\d]/g, '')), 0) /
      members.length
    : 1000;

  return {
    id: team.id,
    name: team.name,
    tag: team.tag,
    motto: team.motto,
    level: Math.max(1, Math.floor(totalXp / 500)),
    experience: experienceFromTotalXp(totalXp),
    teamRank: {
      rank: Math.max(1, Math.round(500 - avgRating / 10)),
      topPercent: '—',
      subtitle: 'of all teams',
    },
    shieldIcon: team.logo_icon,
    shieldAccent: asLogoAccent(team.logo_accent),
    stats: [
      {
        id: 'team-stat-members',
        icon: 'people',
        iconColor: '#D7FF2F',
        label: 'Members',
        value: `${memberCount} / ${team.member_max}`,
      },
    ],
    members,
    memberCount,
    memberMax: team.member_max,
    activities: [],
  };
}

export function mapTeamListingRow(
  team: TeamRow,
  memberCount: number,
  rank: number,
): TopTeamListing {
  return {
    id: team.id,
    rank,
    name: team.name,
    tag: team.tag,
    motto: team.motto,
    level: Math.max(1, memberCount),
    memberCount,
    memberMax: team.member_max,
    clanRank: rank,
    totalPoints: memberCount * 1000,
    shieldIcon: team.logo_icon,
    shieldAccent: asLogoAccent(team.logo_accent),
  };
}
