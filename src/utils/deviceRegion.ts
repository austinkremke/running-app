import * as Localization from 'expo-localization';

/**
 * Device region + flag helpers for the Me tab's country slot.
 *
 * There is no `profiles.country_code` column yet, so the region is read from the
 * device's own locale settings via `expo-localization` (native module — Hermes'
 * `Intl` does not reliably expose region info, which is why an earlier `Intl`-only
 * version of this file silently returned null on-device). This is a display-only
 * signal — nothing is persisted, and the rank shown alongside it is the *global*
 * solo rank, not a per-country one. When a real country column lands, swap the
 * call site to read the stored code and keep `flagEmojiForRegion` as-is.
 *
 * Requires a dev client rebuild (`npx expo run:ios`) after this module was added —
 * `expo-localization` is native and won't be picked up by a JS-only reload.
 */

const REGION_TAG_PATTERN = /^[A-Z]{2}$/;

/** ISO-3166-1 alpha-2 region of the device locale, or null when it can't be determined. */
export function deviceRegionCode(): string | null {
  try {
    const region = Localization.getLocales()[0]?.regionCode ?? null;
    const normalized = region?.toUpperCase() ?? '';
    return REGION_TAG_PATTERN.test(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

/**
 * Flag emoji for an alpha-2 region code, built from regional-indicator symbols
 * so no flag image assets are needed. Returns null for anything unrecognized.
 */
export function flagEmojiForRegion(regionCode: string | null | undefined): string | null {
  const normalized = regionCode?.toUpperCase() ?? '';
  if (!REGION_TAG_PATTERN.test(normalized)) {
    return null;
  }

  const REGIONAL_INDICATOR_A = 0x1f1e6;
  const LETTER_A = 'A'.charCodeAt(0);

  return String.fromCodePoint(
    ...[...normalized].map((letter) => REGIONAL_INDICATOR_A + (letter.charCodeAt(0) - LETTER_A)),
  );
}
