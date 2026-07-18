export type PaceRangeKey = 'recovery' | 'easy' | 'workout' | 'hard';

export type PaceConfidence = 'high' | 'moderate' | 'limited';

/** Personalized pace-range boundaries in seconds/mile. Faster paces are smaller numbers. */
export type PaceProfile = {
  /** Paces slower than this are Recovery. */
  recoveryThresholdSec: number;
  /** Paces slower than this (and faster than recoveryThresholdSec) are Easy. */
  easyThresholdSec: number;
  /** Paces slower than this (and faster than easyThresholdSec) are Workout; faster is Hard. */
  workoutThresholdSec: number;
  runCount: number;
  sampleCount: number;
  confidence: PaceConfidence;
  computedAt: string;
  avgRecoveryPct: number;
  avgEasyPct: number;
  avgWorkoutPct: number;
  avgHardPct: number;
  longestWorkoutSeconds: number;
  longestHardSeconds: number;
};

export type PaceRangeResult = {
  key: PaceRangeKey;
  label: string;
  timeSeconds: number;
  percentOfMoving: number;
  distanceMiles: number;
  /** Faster bound of the range, seconds/mile (null when unbounded, e.g. Hard). */
  paceLowSecPerMile: number | null;
  /** Slower bound of the range, seconds/mile (null when unbounded, e.g. Recovery). */
  paceHighSecPerMile: number | null;
};

export type PaceDistributionResult = {
  ranges: PaceRangeResult[];
  totalMovingSeconds: number;
  classification: string;
  insight: string;
  historicalComparison: string | null;
  confidence: PaceConfidence;
  confidenceNote: string | null;
  gradeAdjusted: boolean;
};
