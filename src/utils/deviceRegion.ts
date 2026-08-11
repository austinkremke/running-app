import * as Localization from 'expo-localization';

/**
 * Device-locale region — used only as a default suggestion when a user opens
 * the country picker for the first time (`profiles.country_code` is the real,
 * stored value everything else reads from; this is never used as a stand-in
 * for it). Read via `expo-localization` (native module — Hermes' `Intl` does
 * not reliably expose region info, which is why an earlier `Intl`-only
 * version of this file silently returned null on-device).
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
