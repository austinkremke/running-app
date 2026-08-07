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
        locationAlwaysAndWhenInUsePermission:
          'Run Off tracks your route in the background so your run keeps recording when your phone is locked.',
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
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
      'expo-notifications',
      {
        color: '#E3FF6A',
      },
    ],
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsVersion: '11.20.1',
      },
    ],
    'expo-apple-authentication',
    'expo-asset',
    'expo-localization',
    [
      '@kingstinct/react-native-healthkit',
      {
        NSHealthShareUsageDescription:
          'Run Off reads your runs and workouts from Apple Health — including ones synced from Apple Watch, Garmin, or other connected apps — so they show up in your run history and earn XP.',
        NSHealthUpdateUsageDescription:
          'Run Off does not currently write any data back to Apple Health.',
        background: false,
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#05070B',
        dark: {
          image: './assets/splash-icon.png',
          backgroundColor: '#05070B',
        },
      },
    ],
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
    owner: 'austinkremke',
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
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ['location'],
        NSLocationWhenInUseUsageDescription:
          'Run Off needs your location to show your position on the map while running.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Run Off tracks your route in the background so your run keeps recording when your phone is locked.',
        NSLocationAlwaysUsageDescription:
          'Run Off tracks your route in the background so your run keeps recording when your phone is locked.',
        NSPhotoLibraryUsageDescription:
          'Run Off needs access to your photos to set a profile picture or attach a photo to a run.',
        NSCameraUsageDescription:
          'Run Off needs access to your camera to take a photo to attach to a run.',
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
        'ACCESS_BACKGROUND_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
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
      eas: {
        projectId: '7978a309-6236-43e4-b5f3-1d74cb9544f6',
      },
    },
  };
};
