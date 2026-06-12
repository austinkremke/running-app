import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PostRunSummary } from '../mock';
import type { GpsPoint } from '../maps/types';
import {
  PostRunChartSection,
  PostRunFooter,
  PostRunHeader,
  PostRunMediaCarousel,
  PostRunPrimaryStats,
} from '../components/post-run';
import { colors, spacing } from '../theme';

type PostRunScreenProps = {
  summary: PostRunSummary;
  routePoints: GpsPoint[];
  onBack?: () => void;
  onAddToFeed?: () => void;
};

export function PostRunScreen({ summary, routePoints, onBack, onAddToFeed }: PostRunScreenProps) {
  const primaryStats = [
    {
      label: 'DISTANCE',
      value: summary.distanceMiles.toFixed(2),
      unit: 'mi',
    },
    {
      label: 'TIME',
      value: summary.duration,
      unit: summary.durationUnit,
    },
    {
      label: 'AVG PACE',
      value: summary.avgPace,
      unit: summary.avgPaceUnit,
    },
    {
      label: 'CALORIES',
      value: String(summary.calories),
      unit: summary.caloriesUnit,
    },
    {
      label: 'AVG HEART RATE',
      value: String(summary.avgHeartRate),
      unit: summary.avgHeartRateUnit,
    },
    {
      label: 'ELEVATION GAIN',
      value: String(summary.elevationGain),
      unit: summary.elevationGainUnit,
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <PostRunHeader completedAtLabel={summary.completedAtLabel} onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <PostRunMediaCarousel
          photos={summary.photos}
          routePoints={routePoints}
          weatherTempF={summary.weatherTempF}
        />
        <PostRunPrimaryStats stats={primaryStats} />
        <PostRunChartSection summary={summary} />
        <PostRunFooter onAddToFeed={onAddToFeed} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
});
