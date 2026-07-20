import type { ActivityRecord } from '../types/activity';
import { formatPace, metersToMiles } from './distanceService';

export function totalDistanceMeters(records: ActivityRecord[]): number {
  if (records.length === 0) return 0;
  return records[records.length - 1].distanceMeters;
}

export function totalElapsedSeconds(records: ActivityRecord[]): number {
  if (records.length === 0) return 0;
  return records[records.length - 1].elapsedSeconds;
}

export function averagePaceSecondsPerMile(records: ActivityRecord[]): number {
  const distanceMeters = totalDistanceMeters(records);
  const elapsed = totalElapsedSeconds(records);
  const miles = metersToMiles(distanceMeters);
  if (miles <= 0 || elapsed <= 0) return 0;
  return elapsed / miles;
}

export function averageHeartRateBpm(records: ActivityRecord[]): number {
  const samples = records
    .map((record) => record.heartRateBpm)
    .filter((bpm): bpm is number => bpm != null && bpm > 0);
  if (samples.length === 0) return 0;
  return Math.round(samples.reduce((sum, bpm) => sum + bpm, 0) / samples.length);
}

export function elevationGainFeet(records: ActivityRecord[]): number {
  const METERS_TO_FEET = 3.28084;
  let gain = 0;

  for (let index = 1; index < records.length; index += 1) {
    const previous = records[index - 1].altitudeMeters;
    const current = records[index].altitudeMeters;
    if (previous == null || current == null) continue;

    const deltaFeet = (current - previous) * METERS_TO_FEET;
    if (deltaFeet > 0) gain += deltaFeet;
  }

  return Math.round(gain);
}

export function estimateCalories(distanceMiles: number): number {
  if (distanceMiles <= 0) return 0;
  return Math.round(distanceMiles * 110);
}

export function livePaceLabel(records: ActivityRecord[]): string {
  return formatPace(averagePaceSecondsPerMile(records));
}
