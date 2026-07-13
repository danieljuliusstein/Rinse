import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Rinse',
  slug: 'rinse-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'rinse',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.rinse.mobile',
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: 'Rinse uses the camera for job photos, receipt scanning, VIN barcodes, and license plate scans.',
      NSPhotoLibraryUsageDescription: 'Rinse uses your photo library to attach job and vehicle photos.',
      NSPhotoLibraryAddUsageDescription: 'Rinse saves job photos to your library when you choose to export them.',
      // Required for Linking.canOpenURL / openURL with tel: and sms: on iOS 9+.
      LSApplicationQueriesSchemes: ['tel', 'telprompt', 'sms', 'mailto'],
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#ecfdf5',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    package: 'com.rinse.mobile',
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-sqlite',
    'expo-dev-client',
    'expo-updates',
    'expo-apple-authentication',
    'expo-camera',
    'expo-iap',
    'expo-localization',
    // On-device plate/VIN OCR — Apple Vision on iOS. Requires a rebuilt dev client (not Expo Go).
    ['expo-mlkit-ocr', { iosEngine: 'vision' }],
    [
      '@sentry/react-native',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          buildReactNativeFromSource: true,
          deploymentTarget: '16.4',
        },
      },
    ],
  ],
  updates: {
    url: 'https://u.expo.dev/a603bec9-0ac7-432a-b24a-9d100f9fd884',
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  experiments: {
    typedRoutes: true,
  },
  extra: {
    pbUrl: process.env.EXPO_PUBLIC_PB_URL,
    appApiUrl: process.env.EXPO_PUBLIC_APP_API_URL,
    webOrigin: process.env.EXPO_PUBLIC_WEB_ORIGIN,
    eas: {
      projectId: 'a603bec9-0ac7-432a-b24a-9d100f9fd884',
    },
  },
}

export default config
