import {
  BASE_XP_PER_MILE,
  DIMINISHING_DISTANCE_MILES,
  FIRST_RUN_TODAY_BONUS,
  MAX_XP_PER_RUN,
  MIN_DISTANCE_MILES,
} from '../../../config/xpRewards';
import { computeXpFromActivity } from '../xpCalculator';
import { DEV_XP_USER_ID, defaultUserStats, makeRunActivity } from './xpTestFixtures';
import { readDevFlag, writeDevFlag } from './testEnv';

describe('computeXpFromActivity', () => {
  describe('minimum distance (production)', () => {
    it('returns 0 XP when display distance is below 0.1 mi', () => {
      const activity = makeRunActivity({ distanceMiles: 0.09 });

      const result = computeXpFromActivity(activity, defaultUserStats);

      expect(result.totalXp).toBe(0);
      expect(result.breakdown).toHaveLength(0);
    });

    it('qualifies at exactly 0.10 mi (display-rounded)', () => {
      const activity = makeRunActivity({ distanceMiles: 0.1 });

      const result = computeXpFromActivity(activity, defaultUserStats);

      expect(result.totalXp).toBeGreaterThan(0);
    });

    it('awards XP when GPS is slightly under 0.1 mi but displays as 0.10', () => {
      const activity = makeRunActivity({ distanceMiles: 0.0996 });

      expect(activity.summary.distanceMiles).toBe(0.1);

      const result = computeXpFromActivity(activity, defaultUserStats);

      expect(result.totalXp).toBeGreaterThan(0);
    });
  });

  describe('dev bypass user (0.01 mi minimum)', () => {
    const originalDev = readDevFlag();
    const originalEnv = process.env.EXPO_PUBLIC_DEV_XP_USER_ID;

    beforeEach(() => {
      writeDevFlag(true);
      process.env.EXPO_PUBLIC_DEV_XP_USER_ID = DEV_XP_USER_ID;
    });

    afterEach(() => {
      writeDevFlag(originalDev);
      process.env.EXPO_PUBLIC_DEV_XP_USER_ID = originalEnv;
    });

    it('qualifies at 0.01 mi for the dev user', () => {
      const activity = makeRunActivity({ distanceMiles: 0.01 });

      const result = computeXpFromActivity(activity, defaultUserStats, DEV_XP_USER_ID);

      expect(result.totalXp).toBeGreaterThan(0);
    });

    it('awards 50 XP for 0.01 mi — distance XP floors to 0, first-run-today carries the award', () => {
      const activity = makeRunActivity({ distanceMiles: 0.01 });

      const result = computeXpFromActivity(activity, defaultUserStats, DEV_XP_USER_ID);

      const distanceLine = result.breakdown.find((line) => line.key === 'distance');
      const firstRunLine = result.breakdown.find((line) => line.key === 'first-run-today');

      expect(distanceLine).toBeUndefined();
      expect(firstRunLine?.xp).toBe(FIRST_RUN_TODAY_BONUS);
      expect(result.totalXp).toBe(FIRST_RUN_TODAY_BONUS);
    });

    it('still blocks 0.00 mi for the dev user', () => {
      const activity = makeRunActivity({ distanceMiles: 0 });

      const result = computeXpFromActivity(activity, defaultUserStats, DEV_XP_USER_ID);

      expect(result.totalXp).toBe(0);
    });

    it('does not lower minimum for other users', () => {
      const activity = makeRunActivity({ distanceMiles: 0.01 });

      const result = computeXpFromActivity(activity, defaultUserStats, 'other-user-id');

      expect(result.totalXp).toBe(0);
    });
  });

  describe('distance XP and diminishing returns', () => {
    it('scales distance XP below 0.25 mi', () => {
      const activity = makeRunActivity({ distanceMiles: 0.1 });

      const result = computeXpFromActivity(activity, {
        ...defaultUserStats,
        awardedToday: true,
      });

      const distanceLine = result.breakdown.find((line) => line.key === 'distance');
      const rawDistanceXp = Math.floor(0.1 * BASE_XP_PER_MILE);
      const expectedDistanceXp = Math.floor(
        rawDistanceXp * (0.1 / DIMINISHING_DISTANCE_MILES),
      );

      expect(distanceLine?.xp).toBe(expectedDistanceXp);
      expect(distanceLine?.xp).toBe(4);
    });

    it('uses full distance rate at 0.25 mi and above', () => {
      const activity = makeRunActivity({ distanceMiles: 0.25 });

      const result = computeXpFromActivity(activity, {
        ...defaultUserStats,
        awardedToday: true,
      });

      const distanceLine = result.breakdown.find((line) => line.key === 'distance');
      expect(distanceLine?.xp).toBe(Math.floor(0.25 * BASE_XP_PER_MILE));
    });

    it('awards ~100 XP per mile before bonuses on a 5 mi run', () => {
      const activity = makeRunActivity({ distanceMiles: 5 });

      const result = computeXpFromActivity(activity, {
        ...defaultUserStats,
        awardedToday: true,
        streakDays: 0,
      });

      const distanceLine = result.breakdown.find((line) => line.key === 'distance');
      expect(distanceLine?.xp).toBe(500);
    });
  });

  describe('first run today bonus', () => {
    it('adds +50 XP on the first qualifying run of the day', () => {
      const activity = makeRunActivity({ distanceMiles: 0.1 });

      const result = computeXpFromActivity(activity, {
        ...defaultUserStats,
        awardedToday: false,
      });

      expect(result.breakdown.find((line) => line.key === 'first-run-today')?.xp).toBe(
        FIRST_RUN_TODAY_BONUS,
      );
    });

    it('skips first-run-today when already awarded today', () => {
      const activity = makeRunActivity({ distanceMiles: 0.1 });

      const result = computeXpFromActivity(activity, {
        ...defaultUserStats,
        awardedToday: true,
      });

      expect(result.breakdown.find((line) => line.key === 'first-run-today')).toBeUndefined();
    });
  });

  describe('streak multiplier', () => {
    it('applies a 5% bonus per streak day (capped at 7)', () => {
      const activity = makeRunActivity({ distanceMiles: 1 });

      const base = computeXpFromActivity(activity, {
        ...defaultUserStats,
        awardedToday: true,
        streakDays: 0,
      });
      const streak3 = computeXpFromActivity(activity, {
        ...defaultUserStats,
        awardedToday: true,
        streakDays: 3,
      });

      expect(streak3.totalXp).toBeGreaterThan(base.totalXp);
      expect(streak3.breakdown.find((line) => line.key === 'streak')?.xp).toBeGreaterThan(0);
    });
  });

  describe('pace effort bonus', () => {
    it('awards pace XP when faster than rolling average', () => {
      const activity = makeRunActivity({
        distanceMiles: 1,
        paceSecondsPerMile: 7 * 60,
      });

      const result = computeXpFromActivity(activity, {
        ...defaultUserStats,
        awardedToday: true,
        rollingAvgPaceSec: 8 * 60,
      });

      expect(result.breakdown.find((line) => line.key === 'pace')?.xp).toBe(4);
    });

    it('awards no pace XP when slower than rolling average', () => {
      const activity = makeRunActivity({
        distanceMiles: 1,
        paceSecondsPerMile: 9 * 60,
      });

      const result = computeXpFromActivity(activity, {
        ...defaultUserStats,
        awardedToday: true,
        rollingAvgPaceSec: 8 * 60,
      });

      expect(result.breakdown.find((line) => line.key === 'pace')).toBeUndefined();
    });
  });

  describe('elevation bonus', () => {
    it('awards +2 XP per 50 ft climbed', () => {
      const activity = makeRunActivity({
        distanceMiles: 1,
        elevationGainFeet: 100,
      });

      const result = computeXpFromActivity(activity, {
        ...defaultUserStats,
        awardedToday: true,
      });

      expect(result.breakdown.find((line) => line.key === 'elevation')?.xp).toBe(4);
    });
  });

  describe('caps', () => {
    it('never exceeds MAX_XP_PER_RUN', () => {
      const activity = makeRunActivity({ distanceMiles: 100 });

      const result = computeXpFromActivity(activity, defaultUserStats);

      expect(result.totalXp).toBe(MAX_XP_PER_RUN);
    });
  });

  describe('reference: 1.0 mi @ 9:00/mi first run of the day', () => {
    it('awards 155 XP (100 distance + 5% streak + 50 first-run)', () => {
      const activity = makeRunActivity({
        distanceMiles: 1.0,
        paceSecondsPerMile: 9 * 60,
      });

      const result = computeXpFromActivity(activity, defaultUserStats);

      expect(result.breakdown.find((line) => line.key === 'distance')?.xp).toBe(100);
      expect(result.breakdown.find((line) => line.key === 'first-run-today')?.xp).toBe(50);
      expect(result.totalXp).toBe(155);
    });
  });

  describe('reference: 0.10 mi first run of the day', () => {
    it('matches the documented breakdown (4 distance + 50 first-run ≈ 54 with streak 1)', () => {
      const activity = makeRunActivity({ distanceMiles: 0.1 });

      const result = computeXpFromActivity(activity, defaultUserStats);

      expect(result.breakdown.find((line) => line.key === 'distance')?.xp).toBe(4);
      expect(result.breakdown.find((line) => line.key === 'first-run-today')?.xp).toBe(50);
      expect(result.totalXp).toBe(54);
    });
  });
});
