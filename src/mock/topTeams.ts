import type { TeamLogoAccent, TopTeamListing } from './types';

const BASE_TEAMS: Omit<TopTeamListing, 'id' | 'rank'>[] = [
  {
    name: 'Road Warriors',
    tag: 'RWAR',
    motto: 'Run together. Win together.',
    level: 24,
    memberCount: 30,
    memberMax: 30,
    clanRank: 128,
    totalPoints: 342_781,
    shieldIcon: 'paw',
    shieldAccent: 'gold',
  },
  {
    name: 'Pacer Unit',
    tag: 'PACR',
    motto: 'Every mile counts.',
    level: 23,
    memberCount: 29,
    memberMax: 30,
    clanRank: 147,
    totalPoints: 315_200,
    shieldIcon: 'flash',
    shieldAccent: 'silver',
  },
  {
    name: 'Pacers',
    tag: 'PACS',
    motto: 'Pace is power.',
    level: 23,
    memberCount: 28,
    memberMax: 30,
    clanRank: 183,
    totalPoints: 298_450,
    shieldIcon: 'footsteps',
    shieldAccent: 'purple',
  },
  {
    name: 'Turbo Terrace',
    tag: 'TRBO',
    motto: 'Faster every day.',
    level: 22,
    memberCount: 27,
    memberMax: 30,
    clanRank: 210,
    totalPoints: 276_890,
    shieldIcon: 'flame',
    shieldAccent: 'cyan',
  },
  {
    name: 'Speed Legion',
    tag: 'SPDL',
    motto: 'Built for speed.',
    level: 22,
    memberCount: 30,
    memberMax: 30,
    clanRank: 256,
    totalPoints: 265_100,
    shieldIcon: 'speedometer',
    shieldAccent: 'blue',
  },
  {
    name: 'Distance Kings',
    tag: 'DKNG',
    motto: 'Miles make champions.',
    level: 21,
    memberCount: 26,
    memberMax: 30,
    clanRank: 301,
    totalPoints: 254_780,
    shieldIcon: 'medal',
    shieldAccent: 'lime',
  },
];

const ACCENTS: TeamLogoAccent[] = ['lime', 'purple', 'gold', 'silver', 'cyan', 'blue'];
const ICONS = ['paw', 'flash', 'footsteps', 'flame', 'speedometer', 'medal', 'moon', 'walk', 'trophy', 'fitness'];

function buildGeneratedTeams(count: number): TopTeamListing[] {
  return Array.from({ length: count }, (_, index) => {
    const rank = index + 1;
    const template = BASE_TEAMS[index % BASE_TEAMS.length];
    const suffix = rank > BASE_TEAMS.length ? ` ${Math.ceil(rank / BASE_TEAMS.length)}` : '';

    return {
      ...template,
      id: `team-ranked-${rank}`,
      rank,
      name: `${template.name}${suffix}`.trim(),
      tag: template.tag.slice(0, 3) + String(rank % 10),
      clanRank: template.clanRank + (rank - 1) * 12,
      totalPoints: Math.max(50_000, template.totalPoints - (rank - 1) * 3_850),
      level: Math.max(8, template.level - Math.floor((rank - 1) / 4)),
      memberCount: Math.max(12, template.memberCount - ((rank - 1) % 5)),
      shieldAccent: ACCENTS[index % ACCENTS.length],
      shieldIcon: ICONS[index % ICONS.length],
    };
  });
}

export const MOCK_TOP_TEAMS_TOTAL = 250;
export const TOP_TEAMS_PAGE_SIZE = 6;
export const MOCK_TOP_TEAMS: TopTeamListing[] = buildGeneratedTeams(MOCK_TOP_TEAMS_TOTAL);
