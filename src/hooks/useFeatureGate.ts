import { useEffect, useMemo, useState } from 'react';

import { usePlayerProgress } from '../context/PlayerProgressContext';
import {
  fetchFeatureGates,
  minLevelForFeature,
  type FeatureGateId,
  type FeatureGateRow,
} from '../services/featureGateService';

export type FeatureGateState = {
  /** True when the feature is gated above the user's current level. */
  locked: boolean;
  /** Active gate threshold, or null when ungated. */
  minLevel: number | null;
  /** CTA copy for locked UI, e.g. "Reach level 5" — level-gate copy, never subscription copy. */
  lockedLabel: string | null;
};

/**
 * Client-side gate check for locked UI states. Fail-open: while loading or on
 * fetch error the feature shows unlocked — the server triggers are the authority
 * and reject under-leveled writes with "Reach level N to unlock X".
 */
export function useFeatureGate(featureId: FeatureGateId): FeatureGateState {
  const { level } = usePlayerProgress();
  const [gates, setGates] = useState<FeatureGateRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchFeatureGates()
      .then((rows) => {
        if (!cancelled) {
          setGates(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGates([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const minLevel = gates ? minLevelForFeature(featureId, gates) : null;
    const locked = minLevel !== null && level < minLevel;

    return {
      locked,
      minLevel,
      lockedLabel: locked ? `Reach level ${minLevel}` : null,
    };
  }, [featureId, gates, level]);
}
