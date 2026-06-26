declare const global: typeof globalThis & { __DEV__?: boolean };

export function readDevFlag(): boolean | undefined {
  return global.__DEV__;
}

export function writeDevFlag(value: boolean | undefined): void {
  global.__DEV__ = value;
}

export function withDevXpEnv(
  devUserId: string,
  run: () => void,
  options?: { dev?: boolean },
): void {
  const originalDev = readDevFlag();
  const originalEnv = process.env.EXPO_PUBLIC_DEV_XP_USER_ID;

  writeDevFlag(options?.dev ?? true);
  process.env.EXPO_PUBLIC_DEV_XP_USER_ID = devUserId;

  try {
    run();
  } finally {
    writeDevFlag(originalDev);
    process.env.EXPO_PUBLIC_DEV_XP_USER_ID = originalEnv;
  }
}
