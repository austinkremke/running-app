import { useEffect, useState } from 'react';

import { activeLocationProvider, DEFAULT_MAP_REGION } from '../maps';
import type { MapRegion } from '../maps';

type UseInitialMapRegionResult = {
  region: MapRegion;
  isReady: boolean;
};

export function useInitialMapRegion(): UseInitialMapRegionResult {
  const [region, setRegion] = useState<MapRegion>(DEFAULT_MAP_REGION);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRegion() {
      const granted = await activeLocationProvider.requestPermissions();
      if (!granted) {
        if (!cancelled) setIsReady(true);
        return;
      }

      const point = await activeLocationProvider.getCurrentPosition();
      if (cancelled || !point) {
        if (!cancelled) setIsReady(true);
        return;
      }

      setRegion({
        latitude: point.latitude,
        longitude: point.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });
      setIsReady(true);
    }

    loadRegion();

    return () => {
      cancelled = true;
    };
  }, []);

  return { region, isReady };
}
