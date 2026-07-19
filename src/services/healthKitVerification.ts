import type { ActivityRecord } from '../types/activity';

export type VerificationTier = 'verified' | 'unverified';

/** ~7 days — generous enough to survive travel/delayed syncs, per the deliberately permissive policy. */
const RECENCY_WINDOW_DAYS = 7;
/** Small allowance for clock skew between the recording device and this device. */
const FUTURE_DATE_TOLERANCE_MS = 60_000;
/** Mirrors MAX_PLAUSIBLE_SPEED_MPS in paceSegments.ts. */
const MAX_PLAUSIBLE_SPEED_MPS = 9.5;
/** Mirrors the plausible bpm range in heartRateSamples.ts. */
const MIN_PLAUSIBLE_BPM = 30;
const MAX_PLAUSIBLE_BPM = 230;

export type VerificationInput = {
  wasUserEntered: boolean;
  workoutEnd: Date;
  records: ActivityRecord[];
};

export type VerificationResult = {
  tier: VerificationTier;
  /** Why it landed at this tier — first failing check, or null when verified. */
  reason: string | null;
};

/**
 * Gating is deliberately permissive (see milestones/09-wearable-integration.md):
 * only signals that directly indicate faking are hard-gated. Source app,
 * device presence, and sample density are recorded in import_metadata but
 * not gated here — promote them to gating later if abuse patterns emerge.
 */
export function computeVerificationTier(input: VerificationInput): VerificationResult {
  if (input.wasUserEntered) {
    return { tier: 'unverified', reason: 'Manually entered, not recorded by a device' };
  }

  const now = Date.now();
  if (input.workoutEnd.getTime() > now + FUTURE_DATE_TOLERANCE_MS) {
    return { tier: 'unverified', reason: 'Future-dated' };
  }

  const recencyMs = RECENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  if (now - input.workoutEnd.getTime() > recencyMs) {
    return { tier: 'unverified', reason: `Older than the ${RECENCY_WINDOW_DAYS}-day recency window` };
  }

  const heartRateRecords = input.records.filter((r) => r.heartRateBpm != null);
  if (heartRateRecords.length === 0) {
    return { tier: 'unverified', reason: 'No heart rate data' };
  }

  const hasImplausibleHr = heartRateRecords.some(
    (r) => r.heartRateBpm! < MIN_PLAUSIBLE_BPM || r.heartRateBpm! > MAX_PLAUSIBLE_BPM,
  );
  if (hasImplausibleHr) {
    return { tier: 'unverified', reason: 'Implausible heart rate value' };
  }

  for (let i = 1; i < input.records.length; i += 1) {
    const dt = input.records[i].elapsedSeconds - input.records[i - 1].elapsedSeconds;
    const dd = input.records[i].distanceMeters - input.records[i - 1].distanceMeters;
    if (dt > 0 && dd / dt > MAX_PLAUSIBLE_SPEED_MPS) {
      return { tier: 'unverified', reason: 'Implausible pace between samples' };
    }
  }

  return { tier: 'verified', reason: null };
}
