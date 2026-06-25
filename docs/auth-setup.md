# Social auth setup (Apple + Google)

Native sign-in uses `signInWithIdToken` — no browser redirect. Rebuild the dev client after changing `.env` or `app.config.js`.

## Supabase dashboard

**Authentication → Providers**

### Apple
1. Enable **Apple**
2. For native iOS: set **Client IDs** to your bundle id: `com.atkremke.running-app`
3. (Optional) Add Apple Services ID / secret if you also want web OAuth later

### Google
1. Enable **Google**
2. Paste the **Web client ID** (same value as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`)
3. Paste the **Web client secret** from Google Cloud Console
4. **Enable "Skip nonce check"** — required for native iOS Google Sign-In with `@react-native-google-signin/google-signin` (the SDK does not expose a custom nonce on iOS in the open-source package)

## Google Cloud Console

1. Create a project (or reuse existing)
2. **APIs & Services → OAuth consent screen** — configure (External is fine for dev)
3. **Credentials → Create OAuth client ID**
   - **iOS**: bundle id `com.atkremke.running-app` → copy client id → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - **Web application**: copy client id → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and use secret in Supabase

## Apple Developer

1. **Identifiers** → App ID `com.atkremke.running-app` → enable **Sign In with Apple**
2. Rebuild the iOS app (`npx expo run:ios`) so the entitlement is included

## Testing notes

| Provider | Simulator | Physical device | TestFlight |
|----------|-----------|-----------------|------------|
| Email | Yes | Yes | Yes |
| Google | Limited | Yes (after rebuild) | Yes |
| Apple | No | Yes | Yes |

Apple Sign-In does **not** work in the iOS Simulator — use a device or TestFlight.

## Rebuild required

```bash
npx expo run:ios --device
```

New native modules: `expo-apple-authentication`, `@react-native-google-signin/google-signin` (Apple nonce uses `js-sha256`, no `expo-crypto`).

### Pod install error (AppCheckCore / GoogleUtilities)

If `pod install` fails with modular headers / `AppCheckCore`, the project uses `expo-build-properties` with modular headers for `GoogleUtilities` and `RecaptchaInterop`. After pulling, run `npx expo run:ios --device` again (not just Metro reload).
