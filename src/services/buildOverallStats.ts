import type { OverallStat } from '../mock';
import { colors } from '../theme';
import { formatDurationClock, formatPace } from './distanceService';
import type { ProfileOverallStats } from './profileStatsService';

/** Shared by MeScreen (own profile) and UserProfileScreen (other users) so the stat-card grid stays in sync. */
export function buildOverallStats(stats: ProfileOverallStats): OverallStat[] {
  return [
    {
      id: 'stat-distance',
      icon: 'footsteps-outline',
      iconColor: colors.accentLime,
      value: stats.totalDistanceMiles.toFixed(1),
      unit: 'mi',
      label: 'Total Distance',
      layout: 'grid',
      metricKey: 'distance',
    },
    {
      id: 'stat-calories',
      icon: 'flame',
      iconColor: '#FF8A3D',
      value: stats.totalCalories.toLocaleString(),
      unit: 'cal',
      label: 'Calories Burned',
      layout: 'grid',
      metricKey: 'calories',
    },
    {
      id: 'stat-time',
      icon: 'stopwatch-outline',
      iconColor: colors.accentLime,
      value: formatDurationClock(stats.totalDurationSeconds),
      unit: 'hr',
      label: 'Total Time',
      layout: 'grid',
      metricKey: 'time',
    },
    {
      id: 'stat-pace',
      icon: 'speedometer-outline',
      iconColor: colors.accentLime,
      value: stats.avgPaceSecondsPerMile > 0 ? formatPace(stats.avgPaceSecondsPerMile) : '--',
      unit: 'min/mi',
      label: 'Avg Pace',
      layout: 'grid',
      metricKey: 'pace',
    },
    {
      id: 'stat-elevation',
      icon: 'trending-up',
      iconColor: colors.accentLime,
      value: stats.totalElevationGainFt.toLocaleString(),
      unit: 'ft',
      label: 'Elevation Gain',
      layout: 'grid',
      metricKey: 'elevation',
    },
    {
      id: 'stat-runs',
      icon: 'footsteps',
      iconColor: colors.accentLime,
      value: String(stats.totalRuns),
      label: 'Total Runs',
      layout: 'grid',
      metricKey: 'runs',
    },
  ];
}
