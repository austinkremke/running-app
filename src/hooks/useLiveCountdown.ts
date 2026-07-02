import { useEffect, useState } from 'react';

import type { TeamMatchCountdown } from '../mock';
import { countdownFromEndsAt } from '../services/matchMappers';

const COUNTDOWN_TICK_MS = 60_000;

export function useLiveCountdown(endsAt: string | null | undefined): TeamMatchCountdown {
  const [countdown, setCountdown] = useState<TeamMatchCountdown>(() =>
    endsAt ? countdownFromEndsAt(endsAt) : { days: 0, hours: 0, minutes: 0 },
  );

  useEffect(() => {
    if (!endsAt) {
      setCountdown({ days: 0, hours: 0, minutes: 0 });
      return;
    }

    const tick = () => {
      setCountdown(countdownFromEndsAt(endsAt));
    };

    tick();
    const interval = setInterval(tick, COUNTDOWN_TICK_MS);
    return () => {
      clearInterval(interval);
    };
  }, [endsAt]);

  return countdown;
}
