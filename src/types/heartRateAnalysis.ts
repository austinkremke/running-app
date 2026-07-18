export type HrZoneKey = 'recovery' | 'easy' | 'steady' | 'hard' | 'maximum';

export type HrConfidence = 'high' | 'moderate' | 'limited';

export type HrZoneResult = {
  key: HrZoneKey;
  label: string;
  timeSeconds: number;
  percentOfValidTime: number;
  distanceMiles: number;
  avgActualPaceSecPerMile: number | null;
  avgAdjustedPaceSecPerMile: number | null;
  bpmLow: number | null;
  bpmHigh: number | null;
  longestContinuousSeconds: number;
  entryCount: number;
};

export type HrDriftClassification =
  | 'Minimal drift'
  | 'Mild upward drift'
  | 'Moderate upward drift'
  | 'High upward drift'
  | 'Downward drift'
  | 'Not suitable for analysis';

export type HrDriftResult = {
  classification: HrDriftClassification;
  firstHalfAvgBpm: number;
  secondHalfAvgBpm: number;
  firstHalfAdjustedPaceSecPerMile: number;
  secondHalfAdjustedPaceSecPerMile: number;
  bpmChange: number;
  confidence: HrConfidence;
};

export type PaceHrRelationship =
  | 'Faster Pace, Higher Heart Rate'
  | 'Faster Pace, Stable Heart Rate'
  | 'Stable Pace, Rising Heart Rate'
  | 'Slower Pace, Stable Heart Rate'
  | 'Slower Pace, Rising Heart Rate'
  | 'Variable Relationship';

export type SustainedHrSegment = {
  index: number;
  startDistanceMiles: number;
  endDistanceMiles: number;
  durationSeconds: number;
  distanceMiles: number;
  avgBpm: number;
  maxSustainedBpm: number;
  avgActualPaceSecPerMile: number;
  avgAdjustedPaceSecPerMile: number | null;
  zone: HrZoneKey;
};

export type CardiovascularProfile =
  | 'Low-Intensity Run'
  | 'Steady Run'
  | 'Progressive Effort'
  | 'Tempo Effort'
  | 'Interval Effort'
  | 'High-Intensity Effort'
  | 'Variable Effort'
  | 'Insufficient Data';

export type HeartRateAnalysisResult =
  | {
      state: 'unavailable';
      reason: string;
    }
  | {
      state: 'full';
      profile: CardiovascularProfile;
      avgBpm: number;
      maxSustainedBpm: number;
      rawMaxBpm: number;
      primaryZone: HrZoneKey;
      validCoveragePercent: number;
      zoneMethod: string;
      insight: string;
      zones: HrZoneResult[];
      drift: HrDriftResult | null;
      paceHrRelationship: PaceHrRelationship | null;
      sustainedSegments: SustainedHrSegment[];
      confidence: HrConfidence;
      confidenceNote: string | null;
      excludedSampleCount: number;
      missingSectionCount: number;
    };
