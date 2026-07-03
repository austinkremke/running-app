import type { GpsPoint } from '../maps/types';
import type { PostRunSummary, Run, RunStats, Team, TeamLogoAccent, TeamMember, TopTeamListing } from '../mock';
import type { Tables } from '../types/database';
import { polylineToGpsPoints } from './activityAdapters';
import { metersToMiles, formatDurationParts, formatPace } from './distanceService';
import { paceHighlightFromSummary, photoUrlFromPost } from './feedCardPresentation';
import type { FeedEngagementSummary } from './feedEngagementService';
import { levelFromTotalXp } from './levelCurve';
import { tierFromRating } from './rank/tierFromRating';
import type { ResolvedRankTier } from '../types/rank';
import { formatRelativeTime } from '../utils/formatRelativeTime';

type FeedPostRow = Tables<'feed_posts'>;
type ProfileRow = Tables<'profiles'>;
type ActivityRow = Tables<'activities'>;
type TeamRow = Tables<'teams'>;
type TeamMemberRow = Tables<'team_members'>;

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
      pacePerMile: summary.avgPace,
      duration: summary.duration,
      durationUnit: summary.durationUnit,
    };
  }

  const distanceMiles = metersToMiles(activity.distance_meters);
  const paceSeconds =
    distanceMiles > 0 ? activity.duration_seconds / distanceMiles : 0;
  const duration = formatDurationParts(activity.duration_seconds);

  return {
    distanceMiles: Number(distanceMiles.toFixed(2)),
    pacePerMile: paceSeconds > 0 ? formatPace(paceSeconds) : '--',
    duration: duration.value,
    durationUnit: duration.unit,
  };
}

export function mapFeedPostToRun(
  post: FeedPostRow,
  profile: ProfileRow & {
    player_progress?: { total_xp: number } | null;
    player_rank?: { competitive_rating: number } | null;
  },
  activity: ActivityRow,
  teamName: string | null,
  engagement: FeedEngagementSummary = { likeCount: 0, commentCount: 0, likedByMe: false },
  rankTiers: ResolvedRankTier[] = [],
): Run {
  const totalXp = profile.player_progress?.total_xp ?? 0;
  const rating = profile.player_rank?.competitive_rating;
  const rankTierId =
    rating != null && rankTiers.length > 0
      ? tierFromRating(rating, rankTiers).id
      : undefined;
  const audiences = post.audiences ?? ['community'];
  const summary = summaryFromActivity(activity);
  const paceHighlight = paceHighlightFromSummary(summary);

  return {
    id: post.id,
    user: {
      id: profile.id,
      name: profile.display_name,
      avatarUrl: profile.avatar_url ?? undefined,
      level: levelFromTotalXp(totalXp),
      teamName: teamName ?? 'No team',
      rankTierId,
    },
    title: post.title || 'Completed a run',
    description: post.description,
    location: post.location,
    postedAt: formatRelativeTime(post.created_at),
    stats: statsFromActivity(activity),
    routePoints: polylineToGpsPoints(activity.polyline, activity.started_at),
    photoUrl: photoUrlFromPost(post.photo_url, summary),
    paceHighlight: paceHighlight ?? undefined,
    likes: engagement.likeCount,
    comments: engagement.commentCount,
    likedByMe: engagement.likedByMe,
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

function formatMemberJoined(joinedAt: string): string {
  const date = new Date(joinedAt);
  if (Number.isNaN(date.getTime())) {
    return 'Member';
  }

  return `Joined ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function mapTeamMemberRow(
  member: TeamMemberSource,
  rank: number,
  weekDistanceMeters = 0,
): TeamMember {
  const totalXp = member.profiles.player_progress?.total_xp ?? 0;
  const rating = member.profiles.player_rank?.competitive_rating ?? 1000;

  return {
    id: member.user_id,
    rank,
    name: member.profiles.display_name,
    status: formatMemberJoined(member.joined_at),
    avatarUrl: member.profiles.avatar_url ?? undefined,
    level: levelFromTotalXp(totalXp),
    distance: `${metersToMiles(weekDistanceMeters).toFixed(1)} mi`,
    power: `${rating.toLocaleString()} PWR`,
    role:
      member.role === 'leader' || member.role === 'co-leader'
        ? member.role
        : undefined,
  };
}

/** Real aggregates from the get_team_overview RPC (see teamService). */
export type TeamOverview = {
  competitiveRating: number;
  seasonWins: number;
  seasonLosses: number;
  rankPosition: number;
  teamCount: number;
  weekDistanceMeters: number;
  totalDistanceMeters: number;
  memberWeekMeters: Record<string, number>;
};

export function mapTeamRow(
  team: TeamRow,
  members: TeamMember[],
  memberCount: number,
  totalMemberXp: number,
  overview: TeamOverview | null,
  tiers: ResolvedRankTier[] = [],
): Team {
  const competitiveRating = overview?.competitiveRating ?? 1000;
  const tier = tiers.length > 0 ? tierFromRating(competitiveRating, tiers) : undefined;
  const stats: Team['stats'] = [
    {
      id: 'team-stat-members',
      icon: 'people',
      iconColor: '#D7FF2F',
      label: 'Members',
      value: `${memberCount} / ${team.member_max}`,
    },
  ];

  if (overview) {
    stats.push(
      {
        id: 'team-stat-week-miles',
        icon: 'speedometer',
        iconColor: '#4DEEFF',
        label: 'Miles (7d)',
        value: `${metersToMiles(overview.weekDistanceMeters).toFixed(1)} mi`,
      },
      {
        id: 'team-stat-season-record',
        icon: 'trophy',
        iconColor: '#FFD166',
        label: 'Season',
        value: `${overview.seasonWins}W - ${overview.seasonLosses}L`,
      },
    );
  }

  return {
    id: team.id,
    name: team.name,
    tag: team.tag,
    motto: team.motto,
    // Team level = combined member lifetime XP on the shared curve (snapshot, no XP bar).
    level: levelFromTotalXp(totalMemberXp),
    competitiveRating,
    teamRank: overview
      ? {
          rank: overview.rankPosition,
          topPercent: `Top ${Math.max(
            1,
            Math.min(100, Math.ceil((overview.rankPosition / Math.max(1, overview.teamCount)) * 100)),
          )}%`,
          subtitle: `of ${overview.teamCount} teams`,
          tierId: tier?.id,
          tierTitle: tier?.displayName,
        }
      : { rank: 0, topPercent: '—', subtitle: 'of all teams', tierId: tier?.id, tierTitle: tier?.displayName },
    shieldIcon: team.logo_icon,
    shieldAccent: asLogoAccent(team.logo_accent),
    stats,
    members,
    memberCount,
    memberMax: team.member_max,
    activities: [],
  };
}

type TopTeamRpcRow = {
  team_id: string;
  name: string;
  tag: string;
  motto: string;
  logo_icon: string;
  logo_accent: string;
  member_max: number;
  member_count: number;
  competitive_rating: number;
  season_wins: number;
  season_losses: number;
  total_member_xp: number;
};

export function mapTeamListingRow(row: TopTeamRpcRow, rank: number): TopTeamListing {
  return {
    id: row.team_id,
    rank,
    name: row.name,
    tag: row.tag,
    motto: row.motto,
    level: levelFromTotalXp(row.total_member_xp),
    memberCount: row.member_count,
    memberMax: row.member_max,
    clanRank: rank,
    totalPoints: row.competitive_rating,
    shieldIcon: row.logo_icon,
    shieldAccent: asLogoAccent(row.logo_accent),
  };
}
