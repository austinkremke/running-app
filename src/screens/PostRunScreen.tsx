import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PostRunSummary } from '../mock';
import type { GpsPoint } from '../maps/types';
import {
  PostRunChartSection,
  PostRunFooter,
  PostRunHeader,
  PostRunMediaCarousel,
  PostRunPrimaryStats,
  PostRunTitleInput,
} from '../components/post-run';
import { pickRunPhotoUri } from '../services/runPhotoUpload';
import { colors, spacing } from '../theme';

type PostRunScreenProps = {
  summary: PostRunSummary;
  routePoints: GpsPoint[];
  sourceName?: string;
  onBack?: () => void;
  onAddToFeed?: (title: string, photoUri?: string) => void;
};

export function PostRunScreen({ summary, routePoints, sourceName, onBack, onAddToFeed }: PostRunScreenProps) {
  const [title, setTitle] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(summary.photos[0] ?? null);

  function handleAddPhoto() {
    Alert.alert('Add a photo', undefined, [
      {
        text: 'Take Photo',
        onPress: () => {
          void (async () => {
            const result = await pickRunPhotoUri('camera');
            if (!result.canceled) setPhotoUri(result.uri);
          })();
        },
      },
      {
        text: 'Choose from Library',
        onPress: () => {
          void (async () => {
            const result = await pickRunPhotoUri('library');
            if (!result.canceled) setPhotoUri(result.uri);
          })();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }
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
      value: summary.avgHeartRate > 0 ? String(summary.avgHeartRate) : '—',
      unit: summary.avgHeartRate > 0 ? summary.avgHeartRateUnit : '',
    },
    {
      label: 'ELEVATION GAIN',
      value: String(summary.elevationGain),
      unit: summary.elevationGainUnit,
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <PostRunHeader completedAtLabel={summary.completedAtLabel} onBack={onBack} sourceName={sourceName} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <PostRunMediaCarousel
          onAddPhoto={handleAddPhoto}
          onRemovePhoto={() => setPhotoUri(null)}
          photoUri={photoUri}
          routePoints={routePoints}
          weatherTempF={summary.weatherTempF}
        />
        <PostRunTitleInput onChangeText={setTitle} value={title} />
        <PostRunPrimaryStats stats={primaryStats} />
        <PostRunChartSection summary={summary} />
        <PostRunFooter
          onAddToFeed={onAddToFeed ? () => onAddToFeed(title.trim(), photoUri ?? undefined) : undefined}
        />
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
