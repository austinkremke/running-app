import { buildSmoothedPaceSegments, type PaceSegment } from './paceSegments';
import type { ActivityRecord } from '../types/activity';
import type { PaceProfile } from '../types/paceAnalysis';
import type {
  ClimbPacingClassification,
  ClimbThird,
  ClimbingAnalysisResult,
  ClimbingConfidence,
  DownhillClassification,
  DownhillSummary,
  RouteClassification,
  SignificantClimb,
  TerrainCategoryKey,
  TerrainCategoryResult,
} from '../types/climbingAnalysis';

const METERS_PER_MILE = 1609.344;
const METERS_TO_FEET = 3.28084;

// Terrain category boundaries (grade %). Product-level starting points, not
// universal physiological thresholds — see AGENTS.md / SCHEMA.md for context.
const DOWNHILL_MAX_GRADE = -1.5;
const FLAT_MAX_GRADE = 1.5;
const GENTLE_MAX_GRADE = 3;
const MODERATE_MAX_GRADE = 6;

// A segment must be at least gently-uphill to start/continue a climb.
const CLIMB_CANDIDATE_MIN_GRADE = 1.5;
const CLIMB_MIN_DISTANCE_METERS = 400; // ~0.25 mi
const CLIMB_MIN_ELEVATION_GAIN_FEET = 50;
// Up to this many consecutive non-candidate segments (~40s) are bridged
// rather than splitting one hill into several climbs over brief noise/dips.
const CLIMB_MAX_GAP_SEGMENTS = 2;
const STEEPEST_SUSTAINED_MIN_METERS = 100;
const VERTICAL_RATE_MIN_DURATION_SECONDS = 180;
const THIRDS_MIN_DURATION_SECONDS = 90;

const TERRAIN_LABELS: Record<TerrainCategoryKey, string> = {
  downhill: 'Downhill',
  flat: 'Flat',
  gentleUphill: 'Gentle Uphill',
  moderateUphill: 'Moderate Uphill',
  steepUphill: 'Steep Uphill',
};

function categoryFor(gradePercent: number): TerrainCategoryKey {
  if (gradePercent < DOWNHILL_MAX_GRADE) return 'downhill';
  if (gradePercent <= FLAT_MAX_GRADE) return 'flat';
  if (gradePercent <= GENTLE_MAX_GRADE) return 'gentleUphill';
  if (gradePercent <= MODERATE_MAX_GRADE) return 'moderateUphill';
  return 'steepUphill';
}

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

function buildTerrainDistribution(gradeSegments: PaceSegment[]): TerrainCategoryResult[] {
  const buckets: Record<TerrainCategoryKey, PaceSegment[]> = {
    downhill: [],
    flat: [],
    gentleUphill: [],
    moderateUphill: [],
    steepUphill: [],
  };

  for (const segment of gradeSegments) {
    buckets[categoryFor(segment.gradePercent!)].push(segment);
  }

  const totalDistance = gradeSegments.reduce((sum, s) => sum + s.distanceMeters, 0);
  const totalTime = gradeSegments.reduce((sum, s) => sum + s.durationSeconds, 0);

  return (Object.keys(buckets) as TerrainCategoryKey[])
    .map((key) => {
      const bucket = buckets[key];
      if (bucket.length === 0) return null;

      const distanceMeters = bucket.reduce((sum, s) => sum + s.distanceMeters, 0);
      const timeSeconds = bucket.reduce((sum, s) => sum + s.durationSeconds, 0);
      const actualPace = (timeSeconds / distanceMeters) * METERS_PER_MILE;
      const adjustedPace = timeWeightedAvg(bucket, (s) => s.adjustedPaceSecPerMile);
      const avgGrade = timeWeightedAvg(bucket, (s) => s.gradePercent);

      const result: TerrainCategoryResult = {
        key,
        label: TERRAIN_LABELS[key],
        distanceMiles: distanceMeters / METERS_PER_MILE,
        timeSeconds,
        percentOfDistance: totalDistance > 0 ? (distanceMeters / totalDistance) * 100 : 0,
        percentOfMoving: totalTime > 0 ? (timeSeconds / totalTime) * 100 : 0,
        avgActualPaceSecPerMile: actualPace,
        avgAdjustedPaceSecPerMile: adjustedPace,
        avgGradePercent: avgGrade,
      };
      return result;
    })
    .filter((r): r is TerrainCategoryResult => r != null);
}

function detectClimbs(segments: PaceSegment[]): { segments: PaceSegment[]; startDistanceMeters: number }[] {
  const rawClimbs: { segments: PaceSegment[]; startDistanceMeters: number }[] = [];
  let active: PaceSegment[] = [];
  let pendingGap: PaceSegment[] = [];
  let activeStartDistance = 0;
  let cumDistance = 0;

  function closeActive() {
    if (active.length > 0) {
      rawClimbs.push({ segments: active, startDistanceMeters: activeStartDistance });
    }
    active = [];
    pendingGap = [];
  }

  for (const segment of segments) {
    const isCandidate = segment.gradePercent != null && segment.gradePercent >= CLIMB_CANDIDATE_MIN_GRADE;

    if (isCandidate) {
      if (active.length === 0) activeStartDistance = cumDistance;
      active.push(...pendingGap, segment);
      pendingGap = [];
    } else if (active.length > 0) {
      pendingGap.push(segment);
      if (pendingGap.length > CLIMB_MAX_GAP_SEGMENTS) {
        closeActive();
      }
    }

    cumDistance += segment.distanceMeters;
  }
  closeActive();

  return rawClimbs;
}

function steepestSustainedGrade(climbSegments: PaceSegment[]): number {
  let best = 0;
  for (let start = 0; start < climbSegments.length; start += 1) {
    let distance = 0;
    let elevChange = 0;
    for (let end = start; end < climbSegments.length; end += 1) {
      distance += climbSegments[end].distanceMeters;
      elevChange += climbSegments[end].elevChangeMeters ?? 0;
      if (distance >= STEEPEST_SUSTAINED_MIN_METERS) {
        best = Math.max(best, (elevChange / distance) * 100);
        break;
      }
    }
  }
  return best;
}

function classifyThirds(thirds: ClimbThird[]): ClimbPacingClassification {
  const [first, second, third] = thirds;
  const deltaPct = ((third.adjustedPaceSecPerMile - first.adjustedPaceSecPerMile) / first.adjustedPaceSecPerMile) * 100;
  const startDeltaPct = ((second.adjustedPaceSecPerMile - first.adjustedPaceSecPerMile) / first.adjustedPaceSecPerMile) * 100;
  const mean = (first.adjustedPaceSecPerMile + second.adjustedPaceSecPerMile + third.adjustedPaceSecPerMile) / 3;
  const maxDeviationPct =
    (Math.max(
      Math.abs(first.adjustedPaceSecPerMile - mean),
      Math.abs(second.adjustedPaceSecPerMile - mean),
      Math.abs(third.adjustedPaceSecPerMile - mean),
    ) /
      mean) *
    100;

  if (maxDeviationPct <= 4) return 'Steady Climb';
  if (deltaPct <= -3) return 'Strong Finish';
  if (deltaPct >= 8) return 'Significant Fade';
  if (deltaPct >= 3) return 'Moderate Fade';
  if (startDeltaPct <= -3) return 'Controlled Start';
  if (startDeltaPct >= 5) return 'Fast Start';
  return 'Variable Climb';
}

function buildClimb(raw: { segments: PaceSegment[]; startDistanceMeters: number }, index: number): SignificantClimb | null {
  const { segments } = raw;
  const distanceMeters = segments.reduce((sum, s) => sum + s.distanceMeters, 0);
  const durationSeconds = segments.reduce((sum, s) => sum + s.durationSeconds, 0);
  const netElevChangeMeters = segments.reduce((sum, s) => sum + (s.elevChangeMeters ?? 0), 0);
  const elevationGainMeters = segments.reduce((sum, s) => sum + Math.max(0, s.elevChangeMeters ?? 0), 0);
  const elevationGainFeet = elevationGainMeters * METERS_TO_FEET;

  const avgGradePercent = distanceMeters > 0 ? (netElevChangeMeters / distanceMeters) * 100 : 0;

  if (
    distanceMeters < CLIMB_MIN_DISTANCE_METERS ||
    elevationGainFeet < CLIMB_MIN_ELEVATION_GAIN_FEET ||
    avgGradePercent <= 0
  ) {
    return null;
  }

  const actualPaceSecPerMile = (durationSeconds / distanceMeters) * METERS_PER_MILE;
  const adjustedPaceSecPerMile = timeWeightedAvg(segments, (s) => s.adjustedPaceSecPerMile) ?? actualPaceSecPerMile;
  const verticalRateFeetPerHour =
    durationSeconds >= VERTICAL_RATE_MIN_DURATION_SECONDS ? elevationGainFeet / (durationSeconds / 3600) : null;

  let thirds: ClimbThird[] | null = null;
  let pacing: ClimbPacingClassification = 'Insufficient Length';

  if (durationSeconds >= THIRDS_MIN_DURATION_SECONDS) {
    const thirdTarget = durationSeconds / 3;
    const groups: PaceSegment[][] = [[], [], []];
    let cumulative = 0;
    let groupIndex = 0;
    for (const segment of segments) {
      groups[groupIndex].push(segment);
      cumulative += segment.durationSeconds;
      if (groupIndex < 2 && cumulative >= thirdTarget * (groupIndex + 1)) {
        groupIndex += 1;
      }
    }

    if (groups.every((g) => g.length > 0)) {
      thirds = groups.map((group) => ({
        actualPaceSecPerMile:
          (group.reduce((sum, s) => sum + s.durationSeconds, 0) / group.reduce((sum, s) => sum + s.distanceMeters, 0)) *
          METERS_PER_MILE,
        adjustedPaceSecPerMile: timeWeightedAvg(group, (s) => s.adjustedPaceSecPerMile) ?? actualPaceSecPerMile,
      }));
      pacing = classifyThirds(thirds);
    }
  }

  return {
    index,
    startDistanceMiles: raw.startDistanceMeters / METERS_PER_MILE,
    endDistanceMiles: (raw.startDistanceMeters + distanceMeters) / METERS_PER_MILE,
    distanceMiles: distanceMeters / METERS_PER_MILE,
    durationSeconds,
    elevationGainFeet,
    avgGradePercent,
    steepestSustainedGradePercent: steepestSustainedGrade(segments),
    actualPaceSecPerMile,
    adjustedPaceSecPerMile,
    verticalRateFeetPerHour,
    pacing,
    thirds,
  };
}

function buildDownhillSummary(gradeSegments: PaceSegment[], profile: PaceProfile): DownhillSummary | null {
  const downhillSegments = gradeSegments.filter((s) => s.gradePercent! < DOWNHILL_MAX_GRADE);
  if (downhillSegments.length === 0) return null;

  const distanceMeters = downhillSegments.reduce((sum, s) => sum + s.distanceMeters, 0);
  const timeSeconds = downhillSegments.reduce((sum, s) => sum + s.durationSeconds, 0);
  if (distanceMeters <= 0 || timeSeconds <= 0) return null;

  const actualPaceSecPerMile = (timeSeconds / distanceMeters) * METERS_PER_MILE;
  const adjustedPaceSecPerMile = timeWeightedAvg(downhillSegments, (s) => s.adjustedPaceSecPerMile);
  const avgGradePercent = timeWeightedAvg(downhillSegments, (s) => s.gradePercent) ?? 0;

  const meanPace = downhillSegments.reduce((sum, s) => sum + s.paceSecPerMile, 0) / downhillSegments.length;
  const variance =
    downhillSegments.reduce((sum, s) => sum + (s.paceSecPerMile - meanPace) ** 2, 0) / downhillSegments.length;
  const coefficientOfVariation = meanPace > 0 ? Math.sqrt(variance) / meanPace : 0;

  let classification: DownhillClassification;
  if (coefficientOfVariation > 0.12) {
    classification = 'Variable descent';
  } else if (actualPaceSecPerMile < profile.workoutThresholdSec) {
    classification = 'Strong descent';
  } else if (actualPaceSecPerMile > profile.recoveryThresholdSec) {
    classification = 'Conservative descent';
  } else {
    classification = 'Controlled descent';
  }

  return {
    distanceMiles: distanceMeters / METERS_PER_MILE,
    timeSeconds,
    avgGradePercent,
    actualPaceSecPerMile,
    adjustedPaceSecPerMile,
    classification,
  };
}

function classifyRoute(params: {
  totalMiles: number;
  elevationGainFeet: number;
  climbs: SignificantClimb[];
  uphillDistanceMiles: number;
  downhillDistanceMiles: number;
  pctUphillOfValidDistance: number;
}): RouteClassification {
  const { totalMiles, elevationGainFeet, climbs, uphillDistanceMiles, downhillDistanceMiles, pctUphillOfValidDistance } = params;
  const elevGainPerMile = totalMiles > 0 ? elevationGainFeet / totalMiles : 0;
  const dominantClimbShare =
    climbs.length > 0 && elevationGainFeet > 0 ? Math.max(...climbs.map((c) => c.elevationGainFeet)) / elevationGainFeet : 0;

  if (elevGainPerMile >= 150 || (climbs.some((c) => c.avgGradePercent >= 7) && elevationGainFeet >= 500)) {
    return 'Mountainous';
  }
  if (climbs.length <= 2 && dominantClimbShare >= 0.6 && downhillDistanceMiles < uphillDistanceMiles * 0.5) {
    return 'Sustained Climb';
  }
  if (climbs.length <= 2 && dominantClimbShare >= 0.5 && downhillDistanceMiles >= 0.3) {
    return 'Climb and Descent';
  }
  if (climbs.length >= 3 && dominantClimbShare < 0.4) {
    return 'Rolling';
  }
  if (pctUphillOfValidDistance >= 0.2 || elevGainPerMile >= 50) {
    return 'Hilly';
  }
  return 'Mostly Flat';
}

function buildOverallInsight(
  routeClassification: RouteClassification,
  climbs: SignificantClimb[],
  estimatedTerrainImpactSecPerMile: number,
): string {
  const longest = climbs.reduce<SignificantClimb | null>(
    (best, c) => (!best || c.distanceMiles > best.distanceMiles ? c : best),
    null,
  );

  if (longest && (longest.pacing === 'Moderate Fade' || longest.pacing === 'Significant Fade')) {
    return `You appear to have slowed during the final third of your longest climb (mile ${longest.startDistanceMiles.toFixed(1)}–${longest.endDistanceMiles.toFixed(1)}), based on grade-adjusted pace.`;
  }
  if (longest && longest.pacing === 'Strong Finish') {
    return `You picked up grade-adjusted pace late in your longest climb (mile ${longest.startDistanceMiles.toFixed(1)}–${longest.endDistanceMiles.toFixed(1)}).`;
  }
  if (climbs.length >= 2 && climbs.every((c) => c.pacing === 'Steady Climb' || c.pacing === 'Insufficient Length')) {
    return `Your grade-adjusted pace stayed consistent across all ${climbs.length} meaningful climbs.`;
  }
  if (estimatedTerrainImpactSecPerMile >= 8) {
    return `The route's hills likely added an estimated ${Math.round(estimatedTerrainImpactSecPerMile)} sec/mi to your actual pace, based on grade-adjusted pace.`;
  }
  if (estimatedTerrainImpactSecPerMile <= -8) {
    return `Downhill terrain likely made your actual pace approximately ${Math.round(-estimatedTerrainImpactSecPerMile)} sec/mi faster than the estimated equivalent flat effort.`;
  }
  if (routeClassification === 'Rolling') {
    return 'The route contained frequent short hills rather than one continuous climb.';
  }
  return 'Your actual pace stayed close to your grade-adjusted pace, suggesting terrain had a limited effect on this run.';
}

/**
 * Builds the Climbing Analysis card model for one completed activity.
 * Terrain categories and climb-detection thresholds are product-level
 * starting points (see spec), not universal physiological truths, and are
 * expected to be tuned against real activity data over time.
 */
export function buildClimbingAnalysis(records: ActivityRecord[], profile: PaceProfile): ClimbingAnalysisResult {
  const segments = buildSmoothedPaceSegments(records);
  if (segments.length < 3) {
    return {
      state: 'unavailable',
      reason: 'This activity did not contain enough reliable elevation data for a meaningful analysis.',
    };
  }

  const gradeSegments = segments.filter((s) => s.gradePercent != null);
  const gradeReliableFraction = gradeSegments.length / segments.length;

  if (gradeReliableFraction < 0.3) {
    return {
      state: 'unavailable',
      reason: 'This activity did not contain enough reliable elevation data for a meaningful analysis.',
    };
  }

  const totalElevationGainMeters = gradeSegments.reduce((sum, s) => sum + Math.max(0, s.elevChangeMeters ?? 0), 0);
  const elevationGainFeet = totalElevationGainMeters * METERS_TO_FEET;

  const rawClimbs = detectClimbs(segments);
  const climbs = rawClimbs
    .map((raw, index) => buildClimb(raw, index))
    .filter((c): c is SignificantClimb => c != null);

  const terrain = buildTerrainDistribution(gradeSegments);
  const uphillDistanceMiles = terrain
    .filter((t) => t.key === 'gentleUphill' || t.key === 'moderateUphill' || t.key === 'steepUphill')
    .reduce((sum, t) => sum + t.distanceMiles, 0);
  const downhillDistanceMiles = terrain.find((t) => t.key === 'downhill')?.distanceMiles ?? 0;
  const totalValidDistanceMiles = gradeSegments.reduce((sum, s) => sum + s.distanceMeters, 0) / METERS_PER_MILE;
  const totalMiles = segments.reduce((sum, s) => sum + s.distanceMeters, 0) / METERS_PER_MILE;

  if (elevationGainFeet < CLIMB_MIN_ELEVATION_GAIN_FEET && climbs.length === 0) {
    const routeClassification = classifyRoute({
      totalMiles,
      elevationGainFeet,
      climbs,
      uphillDistanceMiles,
      downhillDistanceMiles,
      pctUphillOfValidDistance: totalValidDistanceMiles > 0 ? uphillDistanceMiles / totalValidDistanceMiles : 0,
    });
    return {
      state: 'minimal',
      elevationGainFeet,
      routeClassification,
      message: 'No sustained climbs were found on this route.',
    };
  }

  const routeClassification = classifyRoute({
    totalMiles,
    elevationGainFeet,
    climbs,
    uphillDistanceMiles,
    downhillDistanceMiles,
    pctUphillOfValidDistance: totalValidDistanceMiles > 0 ? uphillDistanceMiles / totalValidDistanceMiles : 0,
  });

  const avgActualPace = timeWeightedAvg(segments, (s) => s.paceSecPerMile) ?? 0;
  const avgAdjustedPace = timeWeightedAvg(segments, (s) => s.adjustedPaceSecPerMile) ?? avgActualPace;
  const estimatedTerrainImpactSecPerMile = avgActualPace - avgAdjustedPace;

  const downhill = buildDownhillSummary(gradeSegments, profile);
  const insight = buildOverallInsight(routeClassification, climbs, estimatedTerrainImpactSecPerMile);

  const climbsLongEnough = climbs.length === 0 || climbs.every((c) => c.durationSeconds >= 120);
  const confidence: ClimbingConfidence =
    gradeReliableFraction >= 0.7 && segments.length >= 15 && climbsLongEnough
      ? 'high'
      : gradeReliableFraction >= 0.4
        ? 'moderate'
        : 'limited';

  return {
    state: 'full',
    routeClassification,
    elevationGainFeet,
    uphillDistanceMiles,
    meaningfulClimbCount: climbs.length,
    estimatedTerrainImpactSecPerMile,
    insight,
    terrain,
    climbs,
    downhill,
    confidence,
    confidenceNote:
      confidence === 'limited' ? 'Elevation data was inconsistent, so climbing metrics are approximate.' : null,
  };
}
