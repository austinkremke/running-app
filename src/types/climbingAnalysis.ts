export type TerrainCategoryKey = 'downhill' | 'flat' | 'gentleUphill' | 'moderateUphill' | 'steepUphill';

export type TerrainCategoryResult = {
  key: TerrainCategoryKey;
  label: string;
  distanceMiles: number;
  timeSeconds: number;
  percentOfDistance: number;
  percentOfMoving: number;
  avgActualPaceSecPerMile: number;
  avgAdjustedPaceSecPerMile: number | null;
  avgGradePercent: number | null;
};

export type ClimbPacingClassification =
  | 'Steady Climb'
  | 'Strong Finish'
  | 'Controlled Start'
  | 'Fast Start'
  | 'Moderate Fade'
  | 'Significant Fade'
  | 'Variable Climb'
  | 'Insufficient Length';

export type ClimbThird = {
  actualPaceSecPerMile: number;
  adjustedPaceSecPerMile: number;
};

export type SignificantClimb = {
  index: number;
  startDistanceMiles: number;
  endDistanceMiles: number;
  distanceMiles: number;
  durationSeconds: number;
  elevationGainFeet: number;
  avgGradePercent: number;
  steepestSustainedGradePercent: number;
  actualPaceSecPerMile: number;
  adjustedPaceSecPerMile: number;
  verticalRateFeetPerHour: number | null;
  pacing: ClimbPacingClassification;
  thirds: ClimbThird[] | null;
};

export type DownhillClassification =
  | 'Controlled descent'
  | 'Strong descent'
  | 'Conservative descent'
  | 'Variable descent'
  | null;

export type DownhillSummary = {
  distanceMiles: number;
  timeSeconds: number;
  avgGradePercent: number;
  actualPaceSecPerMile: number;
  adjustedPaceSecPerMile: number | null;
  classification: DownhillClassification;
};

export type RouteClassification =
  | 'Mostly Flat'
  | 'Rolling'
  | 'Hilly'
  | 'Sustained Climb'
  | 'Climb and Descent'
  | 'Mountainous';

export type ClimbingConfidence = 'high' | 'moderate' | 'limited';

export type ClimbingAnalysisResult =
  | {
      state: 'unavailable';
      reason: string;
    }
  | {
      state: 'minimal';
      elevationGainFeet: number;
      routeClassification: RouteClassification;
      message: string;
    }
  | {
      state: 'full';
      routeClassification: RouteClassification;
      elevationGainFeet: number;
      uphillDistanceMiles: number;
      meaningfulClimbCount: number;
      estimatedTerrainImpactSecPerMile: number;
      insight: string;
      terrain: TerrainCategoryResult[];
      climbs: SignificantClimb[];
      downhill: DownhillSummary | null;
      confidence: ClimbingConfidence;
      confidenceNote: string | null;
    };
