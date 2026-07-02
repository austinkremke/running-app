import { useEffect, useRef, useState } from 'react';

import type { TeamMatchCountdown } from '../mock';
import { countdownFromEndsAt } from '../services/matchMappers';

const MINUTE_TICK_MS = 60_000;
const SECOND_TICK_MS = 1_000;
const FINAL_SECOND_THRESHOLD_MS = 60_000;

type UseLiveCountdownOptions = {
  onExpired?: () => void;
};

export function useLiveCountdown(
  endsAt: string | null | undefined,
  options?: UseLiveCountdownOptions,
): TeamMatchCountdown {
  const onExpiredRef = useRef(options?.onExpired);
  onExpiredRef.current = options?.onExpired;

  const expiredRef = useRef(false);
  const [countdown, setCountdown] = useState<TeamMatchCountdown>(() =>
    endsAt ? countdownFromEndsAt(endsAt) : { days: 0, hours: 0, minutes: 0, seconds: 0 },
  );

  useEffect(() => {
    expiredRef.current = false;
  }, [endsAt]);

  useEffect(() => {
    if (!endsAt) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const endsAtMs = new Date(endsAt).getTime();

    const tick = () => {
      const remainingMs = endsAtMs - Date.now();
      if (remainingMs <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpiredRef.current?.();
        }
        return SECOND_TICK_MS;
      }

      setCountdown(countdownFromEndsAt(endsAt));
      return remainingMs <= FINAL_SECOND_THRESHOLD_MS ? SECOND_TICK_MS : MINUTE_TICK_MS;
    };

    let timeout: ReturnType<typeof setTimeout> | null = null;

    const scheduleTick = () => {
      const nextDelay = tick();
      timeout = setTimeout(scheduleTick, nextDelay);
    };

    scheduleTick();

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [endsAt]);

  return countdown;
}
