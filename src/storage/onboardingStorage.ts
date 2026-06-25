import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY_PREFIX = '@runoff/onboarding_completed:';

function onboardingKey(userId: string): string {
  return `${ONBOARDING_KEY_PREFIX}${userId}`;
}

export async function readOnboardingCompleted(userId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(onboardingKey(userId));
  return value === '1';
}

export async function writeOnboardingCompleted(userId: string): Promise<void> {
  await AsyncStorage.setItem(onboardingKey(userId), '1');
}

export async function clearOnboardingCompleted(userId: string): Promise<void> {
  await AsyncStorage.removeItem(onboardingKey(userId));
}
