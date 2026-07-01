/** @type {import('expo/config').ExpoConfig} */
export default () => {
  const googleIosClientId = (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '').trim();
  const googleWebClientId = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '').trim();

  const googleIosUrlScheme = googleIosClientId.endsWith('.apps.googleusercontent.com')
    ? `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}`
    : null;

  const plugins = [
    [
      'expo-build-properties',
      {
        ios: {
          extraPods: [
            { name: 'GoogleUtilities', modular_headers: true },
            { name: 'RecaptchaInterop', modular_headers: true },
          ],
        },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow Run Off to use your location on the map while running.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Run Off needs access to your photos to set a profile picture.',
      },
    ],
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsVersion: '11.20.1',
      },
    ],
    'expo-apple-authentication',
  ];

  if (googleIosUrlScheme) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: googleIosUrlScheme },
    ]);
  }

  return {
    name: 'Run Off',
    slug: 'running-app',
    scheme: 'runningapp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
      usesAppleSignIn: true,
      bundleIdentifier: 'com.atkremke.running-app',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Run Off needs your location to show your position on the map while running.',
        NSPhotoLibraryUsageDescription:
          'Run Off needs access to your photos to set a profile picture.',
        ...(googleIosClientId ? { GIDClientID: googleIosClientId } : {}),
        ...(googleIosUrlScheme
          ? {
              CFBundleURLTypes: [
                {
                  CFBundleURLSchemes: [
                    'runningapp',
                    'com.atkremke.running-app',
                    googleIosUrlScheme,
                  ],
                },
              ],
            }
          : {}),
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
      predictiveBackGestureEnabled: false,
      package: 'com.atkremke.runningapp',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins,
    extra: {
      googleIosClientId: googleIosClientId || undefined,
      googleWebClientId: googleWebClientId || undefined,
    },
  };
};
