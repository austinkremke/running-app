import { useEffect, useRef, useState } from 'react';

import type { TeamMatchCountdown } from '../mock';
import { countdownFromEndsAt } from '../services/matchMappers';

const DEFAULT_TICK_MS = 60_000;
const FINAL_MINUTE_TICK_MS = 1_000;
const FINAL_MINUTE_THRESHOLD_MS = 5 * 60_000;

type UseLiveCountdownOptions = {
  onExpired?: () => void;
};

export function useLiveCountdown(
  endsAt: string | null | undefined,
  options?: UseLiveCountdownOptions,
): TeamMatchCountdown {
  const onExpired = options?.onExpired;
  const expiredRef = useRef(false);
  const [countdown, setCountdown] = useState<TeamMatchCountdown>(() =>
    endsAt ? countdownFromEndsAt(endsAt) : { days: 0, hours: 0, minutes: 0 },
  );

  useEffect(() => {
    expiredRef.current = false;
  }, [endsAt]);

  useEffect(() => {
    if (!endsAt) {
      setCountdown({ days: 0, hours: 0, minutes: 0 });
      return;
    }

    const endsAtMs = new Date(endsAt).getTime();

    const tick = () => {
      const remainingMs = endsAtMs - Date.now();
      if (remainingMs <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0 });
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpired?.();
        }
        return;
      }

      setCountdown(countdownFromEndsAt(endsAt));
    };

    tick();

    let interval = setInterval(tick, DEFAULT_TICK_MS);

    const scheduleFastTick = () => {
      const remainingMs = endsAtMs - Date.now();
      if (remainingMs <= FINAL_MINUTE_THRESHOLD_MS) {
        clearInterval(interval);
        interval = setInterval(tick, FINAL_MINUTE_TICK_MS);
      }
    };

    scheduleFastTick();
    const fastTickTimer = setInterval(scheduleFastTick, 10_000);

    return () => {
      clearInterval(interval);
      clearInterval(fastTickTimer);
    };
  }, [endsAt, onExpired]);

  return countdown;
}
