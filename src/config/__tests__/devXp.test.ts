import { MIN_DISTANCE_MILES } from '../xpRewards';
import { isDevXpBypassUser, xpMinDistanceMiles } from '../devXp';
import { readDevFlag, writeDevFlag } from '../../services/progression/__tests__/testEnv';

const DEV_XP_USER_ID = '8ef1125e-30dc-440c-8662-6234dcfc13b5';

describe('devXp', () => {
  const originalDev = readDevFlag();
  const originalEnv = process.env.EXPO_PUBLIC_DEV_XP_USER_ID;

  afterEach(() => {
    writeDevFlag(originalDev);
    process.env.EXPO_PUBLIC_DEV_XP_USER_ID = originalEnv;
  });

  it('uses production minimum outside __DEV__', () => {
    writeDevFlag(false);
    process.env.EXPO_PUBLIC_DEV_XP_USER_ID = DEV_XP_USER_ID;

    expect(xpMinDistanceMiles(DEV_XP_USER_ID)).toBe(MIN_DISTANCE_MILES);
    expect(isDevXpBypassUser(DEV_XP_USER_ID)).toBe(false);
  });

  it('lowers minimum only for the configured dev user in __DEV__', () => {
    writeDevFlag(true);
    process.env.EXPO_PUBLIC_DEV_XP_USER_ID = DEV_XP_USER_ID;

    expect(xpMinDistanceMiles(DEV_XP_USER_ID)).toBe(0.01);
    expect(isDevXpBypassUser(DEV_XP_USER_ID)).toBe(true);
    expect(xpMinDistanceMiles('someone-else')).toBe(MIN_DISTANCE_MILES);
  });
});
