import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

import type { XpGainEvent } from '../../mock';
import { cumulativeXpForLevel, experienceFromTotalXp } from '../../services/levelCurve';

type XpGainPhase = 'idle' | 'running' | 'levelUp' | 'done';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useXpGainAnimation(event: XpGainEvent | null, visible: boolean) {
  const progress = useRef(new Animated.Value(0)).current;
  const earnedOpacity = useRef(new Animated.Value(0)).current;
  const [displayLevel, setDisplayLevel] = useState(1);
  const [displayXp, setDisplayXp] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(10000);
  const [showConfetti, setShowConfetti] = useState(false);
  const [levelPulse, setLevelPulse] = useState(false);
  const [showLevelUpBanner, setShowLevelUpBanner] = useState(false);
  const [phase, setPhase] = useState<XpGainPhase>('idle');

  useEffect(() => {
    if (!visible || !event) {
      setPhase('idle');
      setShowConfetti(false);
      setLevelPulse(false);
      setShowLevelUpBanner(false);
      progress.setValue(0);
      earnedOpacity.setValue(0);
      return;
    }

    const xpEvent: XpGainEvent = event;
    let cancelled = false;

    function animateProgress(from: number, to: number, duration: number) {
      return new Promise<void>((resolve) => {
        progress.setValue(from);
        Animated.timing(progress, {
          toValue: to,
          duration,
          useNativeDriver: false,
        }).start(() => resolve());
      });
    }

    function fadeInEarned() {
      return new Promise<void>((resolve) => {
        Animated.timing(earnedOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start(() => resolve());
      });
    }

    async function runAnimation() {
      const { startingLevel, startingXp, xpToNextLevel: threshold, xpEarned } = xpEvent;

      setPhase('running');
      setDisplayLevel(startingLevel);
      setDisplayXp(startingXp);
      setXpToNextLevel(threshold);
      setShowConfetti(false);
      setLevelPulse(false);
      setShowLevelUpBanner(false);
      earnedOpacity.setValue(0);
      progress.setValue(startingXp / threshold);

      await delay(350);
      if (cancelled) {
        return;
      }

      await fadeInEarned();
      if (cancelled) {
        return;
      }

      await delay(250);
      if (cancelled) {
        return;
      }

      let remainingXp = xpEarned;
      let level = startingLevel;
      let currentXp = startingXp;
      let levelThreshold = threshold;

      while (remainingXp > 0 && !cancelled) {
        const xpNeeded = levelThreshold - currentXp;
        const xpThisSegment = Math.min(remainingXp, xpNeeded);
        const fromProgress = currentXp / levelThreshold;
        const toProgress = (currentXp + xpThisSegment) / levelThreshold;
        const fillDuration = Math.max(500, Math.min(1200, xpThisSegment * 0.18));

        await animateProgress(fromProgress, toProgress, fillDuration);
        if (cancelled) {
          return;
        }

        currentXp += xpThisSegment;
        remainingXp -= xpThisSegment;
        setDisplayXp(currentXp);

        if (currentXp >= levelThreshold) {
          level += 1;
          setDisplayLevel(level);
          setPhase('levelUp');
          setShowLevelUpBanner(true);
          setShowConfetti(true);
          setLevelPulse(true);
          await delay(1600);
          if (cancelled) {
            return;
          }

          setLevelPulse(false);
          setShowLevelUpBanner(false);
          await delay(900);
          if (cancelled) {
            return;
          }

          setShowConfetti(false);
          currentXp = 0;
          levelThreshold = experienceFromTotalXp(cumulativeXpForLevel(level)).nextLevelXp;
          setXpToNextLevel(levelThreshold);
          setDisplayXp(0);
          progress.setValue(0);
          await delay(250);
          setPhase('running');
        }
      }

      if (!cancelled) {
        setPhase('done');
      }
    }

    runAnimation();

    return () => {
      cancelled = true;
      progress.stopAnimation();
      earnedOpacity.stopAnimation();
    };
  }, [earnedOpacity, event, progress, visible]);

  const xpRemaining = Math.max(xpToNextLevel - displayXp, 0);

  return {
    progress,
    earnedOpacity,
    displayLevel,
    displayXp,
    xpToNextLevel,
    xpRemaining,
    showConfetti,
    levelPulse,
    showLevelUpBanner,
    phase,
  };
}
