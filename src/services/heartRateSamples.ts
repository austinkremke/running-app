import type { ActivityRecord } from '../types/activity';

const MIN_PLAUSIBLE_BPM = 30;
const MAX_PLAUSIBLE_BPM = 230;
/** A run of identical readings lasting at least this long looks like a stuck sensor, not a real flatline. */
const FLATLINE_MIN_SECONDS = 60;
/** An isolated point that jumps this much and snaps back next sample is treated as a sensor spike. */
const ISOLATED_SPIKE_BPM = 40;

export type CleanedHrSample = {
  elapsedSeconds: number;
  bpm: number;
};

export type HeartRateDataQuality = {
  samples: CleanedHrSample[];
  totalRawSamples: number;
  excludedSampleCount: number;
  /** Valid-sample coverage over the activity's recorded time span, 0-100. */
  validCoveragePercent: number;
  missingSectionCount: number;
};

/**
 * Filters raw per-point heart-rate readings: drops missing/implausible values,
 * long stuck-sensor runs of an identical value, and isolated one-sample spikes
 * that snap back immediately (a real effort surge doesn't revert in one sample).
 */
export function cleanHeartRateSamples(records: ActivityRecord[]): HeartRateDataQuality {
  const raw = records
    .filter((r) => r.heartRateBpm != null)
    .map((r) => ({ elapsedSeconds: r.elapsedSeconds, bpm: r.heartRateBpm as number }));

  const totalRawSamples = raw.length;
  if (raw.length === 0) {
    return { samples: [], totalRawSamples: 0, excludedSampleCount: 0, validCoveragePercent: 0, missingSectionCount: 0 };
  }

  const plausible = raw.filter((s) => s.bpm >= MIN_PLAUSIBLE_BPM && s.bpm <= MAX_PLAUSIBLE_BPM);

  // Drop stuck-sensor runs: consecutive identical values spanning >= FLATLINE_MIN_SECONDS.
  const withoutFlatlines: CleanedHrSample[] = [];
  let runStart = 0;
  for (let i = 1; i <= plausible.length; i += 1) {
    const sameAsRun = i < plausible.length && plausible[i].bpm === plausible[runStart].bpm;
    if (!sameAsRun) {
      const runEnd = i - 1;
      const runDuration = plausible[runEnd].elapsedSeconds - plausible[runStart].elapsedSeconds;
      if (runDuration < FLATLINE_MIN_SECONDS) {
        for (let j = runStart; j <= runEnd; j += 1) withoutFlatlines.push(plausible[j]);
      }
      runStart = i;
    }
  }

  // Drop isolated spikes: value jumps away and snaps back on the very next sample.
  const cleaned: CleanedHrSample[] = withoutFlatlines.filter((sample, i) => {
    if (i === 0 || i === withoutFlatlines.length - 1) return true;
    const prev = withoutFlatlines[i - 1];
    const next = withoutFlatlines[i + 1];
    const jumpedUp = sample.bpm - prev.bpm >= ISOLATED_SPIKE_BPM && sample.bpm - next.bpm >= ISOLATED_SPIKE_BPM;
    const jumpedDown = prev.bpm - sample.bpm >= ISOLATED_SPIKE_BPM && next.bpm - sample.bpm >= ISOLATED_SPIKE_BPM;
    return !jumpedUp && !jumpedDown;
  });

  const activitySpanSeconds =
    records.length > 0 ? records[records.length - 1].elapsedSeconds - records[0].elapsedSeconds : 0;
  const validSpanSeconds = cleaned.length > 1 ? cleaned[cleaned.length - 1].elapsedSeconds - cleaned[0].elapsedSeconds : 0;
  const validCoveragePercent = activitySpanSeconds > 0 ? Math.min(100, (validSpanSeconds / activitySpanSeconds) * 100) : 0;

  let missingSectionCount = 0;
  for (let i = 1; i < cleaned.length; i += 1) {
    if (cleaned[i].elapsedSeconds - cleaned[i - 1].elapsedSeconds > 60) missingSectionCount += 1;
  }
  if (activitySpanSeconds > 0 && cleaned.length > 0) {
    if (cleaned[0].elapsedSeconds > 60) missingSectionCount += 1;
    if (activitySpanSeconds - cleaned[cleaned.length - 1].elapsedSeconds > 60) missingSectionCount += 1;
  }

  return {
    samples: cleaned,
    totalRawSamples,
    excludedSampleCount: totalRawSamples - cleaned.length,
    validCoveragePercent,
    missingSectionCount,
  };
}
