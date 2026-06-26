import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

import type { XpGainEvent } from '../../mock';
import {
  cumulativeXpForLevel,
  experienceFromTotalXp,
  levelFromTotalXp,
} from '../../services/levelCurve';

type XpGainPhase = 'idle' | 'running' | 'levelUp' | 'done';

function wait(ms: number, shouldAbort: () => boolean) {
  return new Promise<void>((resolve) => {
    const start = Date.now();

    const tick = () => {
      if (shouldAbort()) {
        resolve();
        return;
      }

      if (Date.now() - start >= ms) {
        resolve();
        return;
      }

      setTimeout(tick, 40);
    };

    tick();
  });
}

export function useXpGainAnimation(event: XpGainEvent | null, visible: boolean) {
  const progress = useRef(new Animated.Value(0)).current;
  const earnedOpacity = useRef(new Animated.Value(0)).current;
  const [displayLevel, setDisplayLevel] = useState(1);
  const [displayXp, setDisplayXp] = useState(0);
  const [displayEarnedXp, setDisplayEarnedXp] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(10000);
  const [showConfetti, setShowConfetti] = useState(false);
  const [levelPulse, setLevelPulse] = useState(false);
  const [showLevelUpBanner, setShowLevelUpBanner] = useState(false);
  const [phase, setPhase] = useState<XpGainPhase>('idle');
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const skipRef = useRef(false);
  const finalizeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!visible || !event) {
      setPhase('idle');
      setShowConfetti(false);
      setLevelPulse(false);
      setShowLevelUpBanner(false);
      setVisibleLineCount(0);
      setActiveLineIndex(-1);
      setDisplayEarnedXp(0);
      skipRef.current = false;
      finalizeRef.current = null;
      progress.setValue(0);
      earnedOpacity.setValue(0);
      return;
    }

    const xpEvent: XpGainEvent = event;
    let cancelled = false;

    const segments =
      xpEvent.breakdown.length > 0
        ? xpEvent.breakdown
        : xpEvent.xpEarned > 0
          ? [{ key: 'distance' as const, label: 'Run XP', xp: xpEvent.xpEarned }]
          : [];

    const shouldAbort = () => cancelled || skipRef.current;

    function animateProgress(from: number, to: number, duration: number) {
      if (shouldAbort()) {
        return Promise.resolve();
      }

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
      if (shouldAbort()) {
        earnedOpacity.setValue(1);
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        Animated.timing(earnedOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start(() => resolve());
      });
    }

    function jumpToFinalState() {
      const beforeTotalXp =
        cumulativeXpForLevel(xpEvent.startingLevel) + xpEvent.startingXp;
      const afterTotalXp = beforeTotalXp + xpEvent.xpEarned;
      const afterExperience = experienceFromTotalXp(afterTotalXp);

      progress.stopAnimation();
      earnedOpacity.stopAnimation();

      setVisibleLineCount(segments.length);
      setActiveLineIndex(-1);
      setDisplayLevel(levelFromTotalXp(afterTotalXp));
      setDisplayXp(afterExperience.currentXp);
      setXpToNextLevel(afterExperience.nextLevelXp);
      setDisplayEarnedXp(xpEvent.xpEarned);
      progress.setValue(afterExperience.currentXp / afterExperience.nextLevelXp);
      earnedOpacity.setValue(1);
      setShowConfetti(false);
      setLevelPulse(false);
      setShowLevelUpBanner(false);
      setPhase('done');
    }

    finalizeRef.current = jumpToFinalState;

    async function applyXpChunk(
      chunkXp: number,
      levelRef: { level: number; currentXp: number; levelThreshold: number },
      earnedSoFar: { value: number },
    ) {
      let remainingXp = chunkXp;

      while (remainingXp > 0 && !shouldAbort()) {
        const xpNeeded = levelRef.levelThreshold - levelRef.currentXp;
        const xpThisSegment = Math.min(remainingXp, xpNeeded);
        const fromProgress = levelRef.currentXp / levelRef.levelThreshold;
        const toProgress = (levelRef.currentXp + xpThisSegment) / levelRef.levelThreshold;
        const fillDuration = Math.max(400, Math.min(900, xpThisSegment * 0.18));

        await animateProgress(fromProgress, toProgress, fillDuration);
        if (shouldAbort()) {
          return;
        }

        levelRef.currentXp += xpThisSegment;
        remainingXp -= xpThisSegment;
        earnedSoFar.value += xpThisSegment;
        setDisplayXp(levelRef.currentXp);
        setDisplayEarnedXp(earnedSoFar.value);

        if (levelRef.currentXp >= levelRef.levelThreshold) {
          levelRef.level += 1;
          setDisplayLevel(levelRef.level);
          setPhase('levelUp');
          setShowLevelUpBanner(true);
          setShowConfetti(true);
          setLevelPulse(true);
          await wait(1600, shouldAbort);
          if (shouldAbort()) {
            return;
          }

          setLevelPulse(false);
          setShowLevelUpBanner(false);
          await wait(900, shouldAbort);
          if (shouldAbort()) {
            return;
          }

          setShowConfetti(false);
          levelRef.currentXp = 0;
          levelRef.levelThreshold = experienceFromTotalXp(
            cumulativeXpForLevel(levelRef.level),
          ).nextLevelXp;
          setXpToNextLevel(levelRef.levelThreshold);
          setDisplayXp(0);
          progress.setValue(0);
          await wait(250, shouldAbort);
          setPhase('running');
        }
      }
    }

    async function runAnimation() {
      const { startingLevel, startingXp, xpToNextLevel: threshold, xpEarned } = xpEvent;

      skipRef.current = false;
      setPhase('running');
      setDisplayLevel(startingLevel);
      setDisplayXp(startingXp);
      setDisplayEarnedXp(0);
      setXpToNextLevel(threshold);
      setShowConfetti(false);
      setLevelPulse(false);
      setShowLevelUpBanner(false);
      setVisibleLineCount(0);
      setActiveLineIndex(-1);
      earnedOpacity.setValue(0);
      progress.setValue(startingXp / threshold);

      const levelRef = {
        level: startingLevel,
        currentXp: startingXp,
        levelThreshold: threshold,
      };
      const earnedSoFar = { value: 0 };

      await wait(350, shouldAbort);
      if (shouldAbort()) {
        jumpToFinalState();
        return;
      }

      if (segments.length === 0 || xpEarned === 0) {
        await fadeInEarned();
        setPhase('done');
        return;
      }

      for (let index = 0; index < segments.length; index += 1) {
        if (shouldAbort()) {
          jumpToFinalState();
          return;
        }

        setActiveLineIndex(index);
        setVisibleLineCount(index + 1);

        if (index === 0) {
          await fadeInEarned();
          if (shouldAbort()) {
            jumpToFinalState();
            return;
          }
        }

        await wait(280, shouldAbort);
        if (shouldAbort()) {
          jumpToFinalState();
          return;
        }

        await applyXpChunk(segments[index].xp, levelRef, earnedSoFar);
        if (shouldAbort()) {
          jumpToFinalState();
          return;
        }

        setActiveLineIndex(-1);
        await wait(180, shouldAbort);
      }

      if (!cancelled) {
        setActiveLineIndex(-1);
        setVisibleLineCount(segments.length);
        setDisplayEarnedXp(xpEarned);
        setPhase('done');
      }
    }

    runAnimation();

    return () => {
      cancelled = true;
      finalizeRef.current = null;
      progress.stopAnimation();
      earnedOpacity.stopAnimation();
    };
  }, [earnedOpacity, event, progress, visible]);

  function skipToEnd() {
    if (phase === 'done' || phase === 'idle') {
      return;
    }

    skipRef.current = true;
    finalizeRef.current?.();
  }

  const xpRemaining = Math.max(xpToNextLevel - displayXp, 0);

  return {
    progress,
    earnedOpacity,
    displayLevel,
    displayXp,
    displayEarnedXp,
    xpToNextLevel,
    xpRemaining,
    showConfetti,
    levelPulse,
    showLevelUpBanner,
    phase,
    visibleLineCount,
    activeLineIndex,
    skipToEnd,
  };
}
