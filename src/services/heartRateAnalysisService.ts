import { buildSmoothedPaceSegments, type PaceSegment } from './paceSegments';
import { cleanHeartRateSamples, type CleanedHrSample } from './heartRateSamples';
import type { ActivityRecord } from '../types/activity';
import type {
  CardiovascularProfile,
  HeartRateAnalysisResult,
  HrConfidence,
  HrDriftResult,
  HrZoneKey,
  HrZoneResult,
  PaceHrRelationship,
  SustainedHrSegment,
} from '../types/heartRateAnalysis';

const METERS_PER_MILE = 1609.344;

const ZONE_LABELS: Record<HrZoneKey, string> = {
  recovery: 'Recovery',
  easy: 'Easy',
  steady: 'Steady',
  hard: 'Hard',
  maximum: 'Maximum',
};

const ZONE_RANK: Record<HrZoneKey, number> = { recovery: 0, easy: 1, steady: 2, hard: 3, maximum: 4 };

const MIN_VALID_COVERAGE_PERCENT = 15;
const MIN_SEGMENTS_WITH_HR = 5;
const SUSTAINED_MIN_DURATION_SECONDS = 60;
const SUSTAINED_MAX_GAP_SEGMENTS = 2;
const DRIFT_MIN_DURATION_SECONDS = 900;
const DRIFT_MAX_PACE_VARIABILITY = 0.08;
const RELATIONSHIP_MIN_SEGMENTS = 6;
const PACE_CHANGE_THRESHOLD_SEC = 8;
const BPM_CHANGE_THRESHOLD = 4;

type HrSegment = PaceSegment & { avgBpm: number | null; startSeconds: number };

function timeWeightedAvg(segments: PaceSegment[], pick: (s: PaceSegment) => number | null): number | null {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const segment of segments) {
    const value = pick(segment);
    if (value == null) continue;
    weightedSum += value * segment.durationSeconds;
    totalWeight += segment.durationSeconds;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : null;
}

function avgBpmInRange(samples: CleanedHrSample[], startSeconds: number, endSeconds: number): number | null {
  const inRange = samples.filter((s) => s.elapsedSeconds >= startSeconds && s.elapsedSeconds < endSeconds);
  if (inRange.length === 0) return null;
  return inRange.reduce((sum, s) => sum + s.bpm, 0) / inRange.length;
}

function attachHeartRate(segments: PaceSegment[], samples: CleanedHrSample[]): HrSegment[] {
  let start = 0;
  return segments.map((segment) => {
    const withHr: HrSegment = { ...segment, avgBpm: avgBpmInRange(samples, start, segment.elapsedSecondsEnd), startSeconds: start };
    start = segment.elapsedSecondsEnd;
    return withHr;
  });
}

function zoneFor(bpm: number, maxBpm: number): HrZoneKey {
  const pct = bpm / maxBpm;
  if (pct < 0.6) return 'recovery';
  if (pct < 0.7) return 'easy';
  if (pct < 0.8) return 'steady';
  if (pct < 0.9) return 'hard';
  return 'maximum';
}

function zoneBoundaryBpm(pct: number, maxBpm: number): number {
  return Math.round(pct * maxBpm);
}

function buildZoneResults(hrSegments: HrSegment[], maxBpm: number): HrZoneResult[] {
  const withHr = hrSegments.filter((s): s is HrSegment & { avgBpm: number } => s.avgBpm != null);
  const totalTime = withHr.reduce((sum, s) => sum + s.durationSeconds, 0);

  const buckets: Record<HrZoneKey, HrSegment[]> = { recovery: [], easy: [], steady: [], hard: [], maximum: [] };
  for (const segment of withHr) {
    buckets[zoneFor(segment.avgBpm, maxBpm)].push(segment);
  }

  // Longest continuous streak + entry count, walked in original sequence order.
  const longest: Record<HrZoneKey, number> = { recovery: 0, easy: 0, steady: 0, hard: 0, maximum: 0 };
  const entries: Record<HrZoneKey, number> = { recovery: 0, easy: 0, steady: 0, hard: 0, maximum: 0 };
  let currentZone: HrZoneKey | null = null;
  let currentStreak = 0;
  for (const segment of withHr) {
    const zone = zoneFor(segment.avgBpm, maxBpm);
    if (zone === currentZone) {
      currentStreak += segment.durationSeconds;
    } else {
      entries[zone] += 1;
      currentZone = zone;
      currentStreak = segment.durationSeconds;
    }
    longest[zone] = Math.max(longest[zone], currentStreak);
  }

  const bounds: Record<HrZoneKey, [number | null, number | null]> = {
    recovery: [null, zoneBoundaryBpm(0.6, maxBpm)],
    easy: [zoneBoundaryBpm(0.6, maxBpm), zoneBoundaryBpm(0.7, maxBpm)],
    steady: [zoneBoundaryBpm(0.7, maxBpm), zoneBoundaryBpm(0.8, maxBpm)],
    hard: [zoneBoundaryBpm(0.8, maxBpm), zoneBoundaryBpm(0.9, maxBpm)],
    maximum: [zoneBoundaryBpm(0.9, maxBpm), null],
  };

  return (Object.keys(buckets) as HrZoneKey[])
    .map((key) => {
      const bucket = buckets[key];
      if (bucket.length === 0) return null;

      const timeSeconds = bucket.reduce((sum, s) => sum + s.durationSeconds, 0);
      const distanceMeters = bucket.reduce((sum, s) => sum + s.distanceMeters, 0);

      const result: HrZoneResult = {
        key,
        label: ZONE_LABELS[key],
        timeSeconds,
        percentOfValidTime: totalTime > 0 ? (timeSeconds / totalTime) * 100 : 0,
        distanceMiles: distanceMeters / METERS_PER_MILE,
        avgActualPaceSecPerMile: timeWeightedAvg(bucket, (s) => s.paceSecPerMile),
        avgAdjustedPaceSecPerMile: timeWeightedAvg(bucket, (s) => s.adjustedPaceSecPerMile),
        bpmLow: bounds[key][0],
        bpmHigh: bounds[key][1],
        longestContinuousSeconds: longest[key],
        entryCount: entries[key],
      };
      return result;
    })
    .filter((r): r is HrZoneResult => r != null);
}

function buildCardiovascularProfile(withHr: HrSegment[], zones: HrZoneResult[], maxBpm: number): CardiovascularProfile {
  if (withHr.length < MIN_SEGMENTS_WITH_HR) return 'Insufficient Data';

  const pctByKey: Record<HrZoneKey, number> = { recovery: 0, easy: 0, steady: 0, hard: 0, maximum: 0 };
  for (const zone of zones) pctByKey[zone.key] = zone.percentOfValidTime;

  const lowPct = pctByKey.recovery + pctByKey.easy;
  const highPct = pctByKey.hard + pctByKey.maximum;

  if (lowPct >= 75 && highPct < 10) return 'Low-Intensity Run';

  let transitions = 0;
  let lastHigh: boolean | null = null;
  for (const segment of withHr) {
    if (segment.avgBpm == null) continue;
    const isHigh = ZONE_RANK[zoneFor(segment.avgBpm, maxBpm)] >= 3;
    if (lastHigh !== null && isHigh !== lastHigh) transitions += 1;
    lastHigh = isHigh;
  }
  if (highPct >= 15 && transitions >= 4) return 'Interval Effort';

  const half = Math.floor(withHr.length / 2);
  if (half >= 2) {
    const firstHalf = withHr.slice(0, half);
    const secondHalf = withHr.slice(half);
    const avgRank = (list: HrSegment[]) => {
      const withValues = list.filter((s) => s.avgBpm != null);
      if (withValues.length === 0) return 0;
      return withValues.reduce((sum, s) => sum + ZONE_RANK[zoneFor(s.avgBpm!, maxBpm)], 0) / withValues.length;
    };
    const firstPace = timeWeightedAvg(firstHalf, (s) => s.adjustedPaceSecPerMile) ?? 0;
    const secondPace = timeWeightedAvg(secondHalf, (s) => s.adjustedPaceSecPerMile) ?? 0;
    const rankDelta = avgRank(secondHalf) - avgRank(firstHalf);
    const paceGotFaster = firstPace - secondPace; // positive = second half faster

    if (rankDelta >= 0.4 && paceGotFaster >= 10) return 'Progressive Effort';
  }

  if (highPct >= 40) return 'High-Intensity Effort';
  if (highPct >= 25 && transitions < 3) return 'Tempo Effort';

  const dominant = Math.max(...Object.values(pctByKey));
  if (dominant >= 70) return 'Steady Run';

  return 'Variable Effort';
}

function buildDrift(withHr: HrSegment[], samples: CleanedHrSample[]): HrDriftResult | null {
  const totalDuration = withHr.reduce((sum, s) => sum + s.durationSeconds, 0);
  if (totalDuration < DRIFT_MIN_DURATION_SECONDS) return null;

  const mean = withHr.reduce((sum, s) => sum + s.paceSecPerMile, 0) / withHr.length;
  const variance = withHr.reduce((sum, s) => sum + (s.paceSecPerMile - mean) ** 2, 0) / withHr.length;
  const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1;
  if (coefficientOfVariation > DRIFT_MAX_PACE_VARIABILITY) return null;

  const warmupCutoff = totalDuration * 0.1;
  const analysisSegments = withHr.filter((s) => s.startSeconds >= warmupCutoff);
  if (analysisSegments.length < 4) return null;

  const analysisDuration = analysisSegments.reduce((sum, s) => sum + s.durationSeconds, 0);
  const halfTarget = analysisDuration / 2;
  let cumulative = 0;
  const firstHalf: HrSegment[] = [];
  const secondHalf: HrSegment[] = [];
  for (const segment of analysisSegments) {
    if (cumulative < halfTarget) firstHalf.push(segment);
    else secondHalf.push(segment);
    cumulative += segment.durationSeconds;
  }
  if (firstHalf.length < 2 || secondHalf.length < 2) return null;

  const firstHalfAvgBpm = timeWeightedAvg(
    firstHalf.filter((s) => s.avgBpm != null),
    (s) => (s as HrSegment).avgBpm,
  );
  const secondHalfAvgBpm = timeWeightedAvg(
    secondHalf.filter((s) => s.avgBpm != null),
    (s) => (s as HrSegment).avgBpm,
  );
  if (firstHalfAvgBpm == null || secondHalfAvgBpm == null) return null;

  const firstHalfAdjustedPace = timeWeightedAvg(firstHalf, (s) => s.adjustedPaceSecPerMile) ?? 0;
  const secondHalfAdjustedPace = timeWeightedAvg(secondHalf, (s) => s.adjustedPaceSecPerMile) ?? 0;
  const bpmChange = secondHalfAvgBpm - firstHalfAvgBpm;

  const classification =
    bpmChange <= -3
      ? 'Downward drift'
      : bpmChange < 3
        ? 'Minimal drift'
        : bpmChange < 6
          ? 'Mild upward drift'
          : bpmChange < 10
            ? 'Moderate upward drift'
            : 'High upward drift';

  const coverageInWindow = (firstHalf.length + secondHalf.length) / analysisSegments.length;
  const confidence: HrConfidence = coverageInWindow >= 0.9 ? 'high' : coverageInWindow >= 0.7 ? 'moderate' : 'limited';

  return {
    classification,
    firstHalfAvgBpm,
    secondHalfAvgBpm,
    firstHalfAdjustedPaceSecPerMile: firstHalfAdjustedPace,
    secondHalfAdjustedPaceSecPerMile: secondHalfAdjustedPace,
    bpmChange,
    confidence,
  };
}

function buildPaceHrRelationship(withHr: HrSegment[]): PaceHrRelationship | null {
  if (withHr.length < RELATIONSHIP_MIN_SEGMENTS) return null;

  const thirdSize = Math.floor(withHr.length / 3);
  if (thirdSize < 2) return null;

  const firstThird = withHr.slice(0, thirdSize);
  const lastThird = withHr.slice(withHr.length - thirdSize);

  const firstPace = timeWeightedAvg(firstThird, (s) => s.adjustedPaceSecPerMile);
  const lastPace = timeWeightedAvg(lastThird, (s) => s.adjustedPaceSecPerMile);
  const firstBpm = timeWeightedAvg(
    firstThird.filter((s) => s.avgBpm != null),
    (s) => (s as HrSegment).avgBpm,
  );
  const lastBpm = timeWeightedAvg(
    lastThird.filter((s) => s.avgBpm != null),
    (s) => (s as HrSegment).avgBpm,
  );
  if (firstPace == null || lastPace == null || firstBpm == null || lastBpm == null) return null;

  const paceDelta = firstPace - lastPace; // positive = got faster
  const bpmDelta = lastBpm - firstBpm; // positive = HR rose

  const paceFaster = paceDelta >= PACE_CHANGE_THRESHOLD_SEC;
  const paceSlower = paceDelta <= -PACE_CHANGE_THRESHOLD_SEC;
  const bpmRising = bpmDelta >= BPM_CHANGE_THRESHOLD;
  const bpmStable = Math.abs(bpmDelta) < BPM_CHANGE_THRESHOLD;

  if (paceFaster && bpmRising) return 'Faster Pace, Higher Heart Rate';
  if (paceFaster && bpmStable) return 'Faster Pace, Stable Heart Rate';
  if (!paceFaster && !paceSlower && bpmRising) return 'Stable Pace, Rising Heart Rate';
  if (paceSlower && bpmStable) return 'Slower Pace, Stable Heart Rate';
  if (paceSlower && bpmRising) return 'Slower Pace, Rising Heart Rate';
  if (!paceFaster && !paceSlower && bpmStable) return null; // nothing notable to report
  return 'Variable Relationship';
}

function buildSustainedSegments(withHr: HrSegment[], maxBpm: number): SustainedHrSegment[] {
  const rawSegments: { segments: HrSegment[]; startDistanceMeters: number }[] = [];
  let active: HrSegment[] = [];
  let pendingGap: HrSegment[] = [];
  let activeStartDistance = 0;
  let cumDistance = 0;

  function closeActive() {
    if (active.length > 0) rawSegments.push({ segments: active, startDistanceMeters: activeStartDistance });
    active = [];
    pendingGap = [];
  }

  for (const segment of withHr) {
    const isCandidate = segment.avgBpm != null && ZONE_RANK[zoneFor(segment.avgBpm, maxBpm)] >= 3;

    if (isCandidate) {
      if (active.length === 0) activeStartDistance = cumDistance;
      active.push(...pendingGap, segment);
      pendingGap = [];
    } else if (active.length > 0) {
      pendingGap.push(segment);
      if (pendingGap.length > SUSTAINED_MAX_GAP_SEGMENTS) closeActive();
    }

    cumDistance += segment.distanceMeters;
  }
  closeActive();

  return rawSegments
    .map((raw, index): SustainedHrSegment | null => {
      const durationSeconds = raw.segments.reduce((sum, s) => sum + s.durationSeconds, 0);
      if (durationSeconds < SUSTAINED_MIN_DURATION_SECONDS) return null;

      const distanceMeters = raw.segments.reduce((sum, s) => sum + s.distanceMeters, 0);
      const withBpm = raw.segments.filter((s) => s.avgBpm != null);
      const avgBpm = timeWeightedAvg(withBpm, (s) => (s as HrSegment).avgBpm) ?? 0;
      const maxSustainedBpm = Math.max(...withBpm.map((s) => (s as HrSegment).avgBpm!));
      const avgActualPace = (durationSeconds / distanceMeters) * METERS_PER_MILE;
      const avgAdjustedPace = timeWeightedAvg(raw.segments, (s) => s.adjustedPaceSecPerMile);
      const zone = ZONE_RANK.maximum === ZONE_RANK[zoneFor(maxSustainedBpm, maxBpm)] && avgBpm / maxBpm >= 0.9 ? 'maximum' : 'hard';

      return {
        index,
        startDistanceMiles: raw.startDistanceMeters / METERS_PER_MILE,
        endDistanceMiles: (raw.startDistanceMeters + distanceMeters) / METERS_PER_MILE,
        durationSeconds,
        distanceMiles: distanceMeters / METERS_PER_MILE,
        avgBpm,
        maxSustainedBpm,
        avgActualPaceSecPerMile: avgActualPace,
        avgAdjustedPaceSecPerMile: avgAdjustedPace,
        zone,
      };
    })
    .filter((s): s is SustainedHrSegment => s != null);
}

function buildInsight(
  profile: CardiovascularProfile,
  drift: HrDriftResult | null,
  paceHrRelationship: PaceHrRelationship | null,
  primaryZone: HrZoneResult,
): string {
  if (drift && (drift.classification === 'Moderate upward drift' || drift.classification === 'High upward drift')) {
    return `Heart rate increased by ${Math.round(drift.bpmChange)} bpm while grade-adjusted pace remained nearly unchanged, consistent with ${drift.classification.toLowerCase()}.`;
  }
  if (profile === 'Interval Effort') {
    return 'This run alternated between Hard efforts and lower-heart-rate recovery periods.';
  }
  if (profile === 'Progressive Effort') {
    return 'Your heart rate and grade-adjusted pace both increased gradually as the run progressed.';
  }
  if (paceHrRelationship === 'Faster Pace, Stable Heart Rate') {
    return 'Your grade-adjusted pace improved while your heart rate stayed within a narrow range.';
  }
  if (paceHrRelationship === 'Stable Pace, Rising Heart Rate') {
    return 'Your heart rate rose over the run while grade-adjusted pace stayed similar.';
  }
  if (primaryZone.bpmLow != null || primaryZone.bpmHigh != null) {
    const range =
      primaryZone.bpmLow != null && primaryZone.bpmHigh != null
        ? `${primaryZone.bpmLow}–${primaryZone.bpmHigh}`
        : primaryZone.bpmHigh != null
          ? `below ${primaryZone.bpmHigh}`
          : `${primaryZone.bpmLow}+`;
    return `Most of this run was spent in ${primaryZone.label}, with ${Math.round(primaryZone.percentOfValidTime)}% of valid heart-rate time at ${range} bpm.`;
  }
  return `Most of this run was spent in ${primaryZone.label}.`;
}

/**
 * Builds the Heart Rate Analysis card model. Zones are personalized from this
 * run's own observed sustained maximum (no stored user max/resting/threshold
 * HR exists yet) — labeled as an estimate rather than a precise measurement.
 */
export function buildHeartRateAnalysis(records: ActivityRecord[]): HeartRateAnalysisResult {
  const quality = cleanHeartRateSamples(records);

  const segments = buildSmoothedPaceSegments(records);
  const hrSegments = attachHeartRate(segments, quality.samples);
  const withHr = hrSegments.filter((s) => s.avgBpm != null);

  if (
    quality.samples.length === 0 ||
    quality.validCoveragePercent < MIN_VALID_COVERAGE_PERCENT ||
    withHr.length < MIN_SEGMENTS_WITH_HR
  ) {
    return {
      state: 'unavailable',
      reason: 'This activity did not contain enough reliable heart-rate data for a meaningful analysis.',
    };
  }

  const rawMaxBpm = Math.max(...quality.samples.map((s) => s.bpm));
  const maxSustainedBpm = Math.max(...withHr.map((s) => s.avgBpm!));
  // This run's own observed sustained max is the anchor — no stored user max exists to prefer instead.
  const estimatedMaxBpm = maxSustainedBpm;

  const zones = buildZoneResults(hrSegments, estimatedMaxBpm);
  const primaryZone = zones.reduce((a, b) => (b.timeSeconds > a.timeSeconds ? b : a));

  const avgBpm = quality.samples.reduce((sum, s) => sum + s.bpm, 0) / quality.samples.length;
  const profile = buildCardiovascularProfile(withHr, zones, estimatedMaxBpm);
  const drift = buildDrift(withHr, quality.samples);
  const paceHrRelationship = buildPaceHrRelationship(withHr);
  const sustainedSegments = buildSustainedSegments(withHr, estimatedMaxBpm);

  const confidence: HrConfidence =
    quality.validCoveragePercent >= 90 && quality.missingSectionCount <= 1
      ? 'high'
      : quality.validCoveragePercent >= 70
        ? 'moderate'
        : 'limited';

  return {
    state: 'full',
    profile,
    avgBpm,
    maxSustainedBpm,
    rawMaxBpm,
    primaryZone: primaryZone.key,
    validCoveragePercent: quality.validCoveragePercent,
    zoneMethod: "Estimated from this run's observed maximum heart rate",
    insight: buildInsight(profile, drift, paceHrRelationship, primaryZone),
    zones,
    drift,
    paceHrRelationship,
    sustainedSegments,
    confidence,
    confidenceNote: confidence === 'limited' ? 'Heart-rate data was inconsistent, so this analysis is approximate.' : null,
    excludedSampleCount: quality.excludedSampleCount,
    missingSectionCount: quality.missingSectionCount,
  };
}
